"""Masa ekranı, heykel süreci döngüsü: Akademi Atlısı büstü "Blender Sculpting" görünümünde kilden büste yontulur.

Amaç: Oda sahnesindeki masa monitörü için ikinci döngü (birincisi masa-ekran-video.py + masa-ekran-kurgu.py döner
  tablası). Hızlandırılmış çekim hissi: kaba kil topağı -> ana kütleler -> ikincil biçimler -> bitmiş büst, kısa bir
  bekleyiş, sonra geri sarılıp topağa döner (son kare = ilk kare, döngü dikişsiz). Aşamalar yordamsal: modelin
  yoğun voksel kopyası tek taban örgüdür; her aşama, modelin kaba voksel + yumuşatma kopyasına "shrinkwrap" ile
  sarılmış hâlidir ve şekil anahtarı (shape key) olarak saklanır, kareler arası anahtarlar karışır (aynı topoloji).
  Workbench + matcap kil, saydam arka plan; fırça dairesi, Sculpting sekmesi ve arayüz 2. adımda çizilir.
İki adım, tek dosya:
  1) Blender içinde (bpy varsa): kareleri ve kare bilgisini (aşama, fırça konumu) yazar.
       blender -b --factory-startup -P scripts/masa-ekran-sculpt.py -- [--model GLB|STL|OBJ] [--kareler KLASOR]
  2) Düz Python (Pillow + ffmpeg): Blender'ı 1. adım için kendisi çağırır (--blender ya da OKTOS_BLENDER; yoksa PATH'teki
     "blender"), sonra arayüzü çizer ve kodlar. --kare-hazir 1. adımı atlar.
       python scripts/masa-ekran-sculpt.py [--model ...] [--blender EXE] [--crf 26] [--drive KLASOR] [--drive-yok]
Girdi: --model (varsayılan assets/cati/modeller/akademi-atlisi.glb, Z yukarı Draco GLB; STL/OBJ de olur). Yerel yol
  depoya yazılmaz: dış girdi argümandan ya da OKTOS_* ortam değişkeninden gelir.
Çıktı (üzerine yazar; aynı girdiden aynı sonuç, tekrar çalıştırmak güvenli):
  assets/oda/masa-ekran-sculpt.mp4  (640x376, 30 fps, 330 kare = 11 sn, H.264 yuv420p, +faststart, ses yok)
  assets/oda/masa-ekran-sculpt.webp (ilk kare afişi)
  --drive / OKTOS_EKRAN_KLASOR verilirse: mp4, webp ve 4 karelik pafta (0, 3, 6, 9 sn) oraya kopyalanır.
  Standart çıktıya JSON özet (boyutlar, dikiş farkı).
"""
import argparse
import json
import math
import os
import sys
import tempfile

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VARSAYILAN_MODEL = os.path.join(KOK, "assets", "cati", "modeller", "akademi-atlisi.glb")
VARSAYILAN_KARE = os.path.join(tempfile.gettempdir(), "masa-ekran-sculpt-kareler")
KARE = 330            # 11 sn x 30 fps
VOKSEL = (0.28, 0.16, 0.08, 0.015)   # aşamaların voksel boyu (büst 2,6 birim); arayüzde de gösterilir

try:
    import bpy  # noqa: F401
    BLENDER = True
except ImportError:
    BLENDER = False


def zaman_cizelgesi(i):
    """Kare i (0..KARE-1) -> (p, firca_gorunur). p: 0 topak, 1 ana kütle, 2 ikincil, 3 bitmiş. Periyodik: i=KARE == i=0."""
    t = (i % KARE) / 30.0
    def yumusak(x):
        x = max(0.0, min(1.0, x))
        return x * x * (3 - 2 * x)
    if t < 0.5:
        return 0.0, False
    if t < 8.0:  # yontma: 12 hamle, her hamle ilk %65'inde ilerler, sonra durur (hızlandırılmış çekim sıçraması)
        u = (t - 0.5) / 7.5 * 12
        k = int(u)
        return 3.0 * (k + yumusak((u - k) / 0.65)) / 12, True
    if t < 9.8:
        return 3.0, t < 8.4
    return 3.0 * (1 - yumusak((t - 9.8) / 1.2)), False


# ----------------------------------------------------------------------------------------------- 1. adım: Blender
def blender_adimi(argv):
    import bpy
    from bpy_extras.object_utils import world_to_camera_view
    from mathutils import Matrix, Vector

    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=VARSAYILAN_MODEL)
    ap.add_argument("--kareler", default=VARSAYILAN_KARE)
    ap.add_argument("--w", type=int, default=1044)
    ap.add_argument("--h", type=int, default=688)
    ap.add_argument("--tek", default=None, help="yalnız bu kareleri çiz, virgüllü (deneme)")
    a = ap.parse_args(argv)
    os.makedirs(a.kareler, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    uz = os.path.splitext(a.model)[1].lower()
    if uz in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=a.model)
        bpy.context.view_layer.update()
        for o in [o for o in sc.objects if o.parent is None]:  # Z yukarı GLB: içe aktarıcının dönüşünü geri al
            o.matrix_world = Matrix.Rotation(-math.pi / 2, 4, "X") @ o.matrix_world
    elif uz == ".stl":
        bpy.ops.wm.stl_import(filepath=a.model)
    elif uz == ".obj":
        bpy.ops.wm.obj_import(filepath=a.model)
    else:
        raise SystemExit("Desteklenmeyen model: " + a.model)
    bpy.context.view_layer.update()
    meshler = [o for o in sc.objects if o.type == "MESH"]
    if not meshler:
        raise SystemExit("Modelde mesh yok: " + a.model)

    # Tek örgü, dünya koordinatında; 2,6 birim boy, taban z = 0, XY ortalı
    dg = bpy.context.evaluated_depsgraph_get()
    kaynak = bpy.data.meshes.new("kaynak")
    import bmesh
    bm = bmesh.new()
    for o in meshler:
        m = bpy.data.meshes.new_from_object(o.evaluated_get(dg), depsgraph=dg)
        m.transform(o.matrix_world)
        bm.from_mesh(m)
        bpy.data.meshes.remove(m)
    for o in list(sc.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]; zs = [v.co.z for v in bm.verts]
    olcek = 2.6 / (max(zs) - min(zs))
    kay = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    for v in bm.verts:
        v.co = (v.co - kay) * olcek
    bm.to_mesh(kaynak); bm.free()
    hedef_ob = bpy.data.objects.new("Hedef", kaynak)
    sc.collection.objects.link(hedef_ob)

    def degerlendir(ob):
        d = bpy.context.evaluated_depsgraph_get()
        return bpy.data.meshes.new_from_object(ob.evaluated_get(d), depsgraph=d)

    # Taban örgü: yoğun voksel kopya (bitmiş aşama)
    m = hedef_ob.modifiers.new("v", "REMESH"); m.mode = "VOXEL"; m.voxel_size = VOKSEL[3]
    taban_me = degerlendir(hedef_ob)
    hedef_ob.modifiers.clear()
    taban = bpy.data.objects.new("AkademiAtlisi", taban_me)
    sc.collection.objects.link(taban)

    # Aşama hedefleri: kaba voksel + yumuşatma; taban onlara sarılır, biraz gevşetilir
    asamalar = []
    for vs, hedef_dz, taban_dz in ((VOKSEL[0], 14, 14), (VOKSEL[1], 10, 4), (VOKSEL[2], 4, 2)):
        h = bpy.data.objects.new("h", kaynak.copy())
        sc.collection.objects.link(h)
        r = h.modifiers.new("v", "REMESH"); r.mode = "VOXEL"; r.voxel_size = vs
        s = h.modifiers.new("s", "SMOOTH"); s.factor = 1.0; s.iterations = hedef_dz
        ss = h.modifiers.new("ss", "SUBSURF"); ss.levels = 2  # kaba yüzeyin düz yüzlerini yuvarlar (matcap'te faset olmasın)
        sw = taban.modifiers.new("sw", "SHRINKWRAP"); sw.target = h; sw.wrap_method = "NEAREST_SURFACEPOINT"
        ts = taban.modifiers.new("ts", "SMOOTH"); ts.factor = 0.5; ts.iterations = taban_dz
        me = degerlendir(taban)
        co = [0.0] * (len(me.vertices) * 3)
        me.vertices.foreach_get("co", co)
        # Yumuşatma hacmi küçültür: aşamayı eksen eksen tabanın kutusuna geri ger (topak da büst boyunda kalsın)
        for ek in range(3):
            tv = [c for c in co[ek::3]]
            bv = [v.co[ek] for v in taban_me.vertices]
            tmn, tmx, bmn, bmx = min(tv), max(tv), min(bv), max(bv)
            co[ek::3] = [bmn + (c - tmn) * (bmx - bmn) / (tmx - tmn) for c in tv]
        asamalar.append(co)
        bpy.data.meshes.remove(me)
        taban.modifiers.clear()
        bpy.data.objects.remove(h, do_unlink=True)
    bpy.data.objects.remove(hedef_ob, do_unlink=True)

    taban.shape_key_add(name="Basis")
    anahtarlar = []
    for ad, co in zip(("topak", "ana", "ikincil"), asamalar):
        k = taban.shape_key_add(name=ad)
        k.data.foreach_set("co", co)
        anahtarlar.append(k)
    for p in taban.data.polygons:
        p.use_smooth = True

    tabla = bpy.data.objects.new("Tabla", None)
    sc.collection.objects.link(tabla)
    taban.parent = tabla

    def agirliklar(p):
        w = [0.0, 0.0, 0.0]
        if p < 1: w[0], w[1] = 1 - p, p
        elif p < 2: w[1], w[2] = 2 - p, p - 1
        elif p < 3: w[2] = 3 - p
        return w

    # Kamera: büst kadrajı dolduracak kadar yakın, hafif yukarıdan
    cam = bpy.data.objects.new("Kam", bpy.data.cameras.new("Kam"))
    cam.data.lens = 50
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.location = Vector((0, -7.0, 2.6))
    bakis = Vector((0, 0, 1.48))
    cam.rotation_euler = (bakis - cam.location).to_track_quat("-Z", "Y").to_euler()

    for motor in ("BLENDER_WORKBENCH", "WORKBENCH"):
        try:
            sc.render.engine = motor
            break
        except TypeError:
            pass
    sh = sc.display.shading
    sh.light = "MATCAP"
    sh.studio_light = "clay_studio.exr"
    sh.color_type = "SINGLE"
    sh.single_color = (0.8, 0.8, 0.8)
    sh.show_cavity = True
    sh.cavity_type = "WORLD"
    sc.display.render_aa = "16"
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = a.w, a.h, 100
    sc.view_settings.view_transform = "Standard"
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"

    # Fırça yolu: ekranda yavaş bir Lissajous; ışın büste çarpmazsa merkeze doğru çekilir (daire hep yüzeyde)
    bpy.context.view_layer.update()  # matrix_world kamera dönüşünü ancak güncellemeden sonra taşır
    cerceve = [cam.matrix_world @ c for c in cam.data.view_frame(scene=sc)]  # sağ üst, sağ alt, sol alt, sol üst

    def isin(u, v):
        ust = cerceve[3].lerp(cerceve[0], u); alt = cerceve[2].lerp(cerceve[1], u)
        nokta = alt.lerp(ust, v)
        d = bpy.context.evaluated_depsgraph_get()
        return sc.ray_cast(d, cam.location, (nokta - cam.location).normalized())

    bilgi = []
    kareler = range(KARE) if a.tek is None else [int(x) for x in a.tek.split(",")]
    for i in kareler:
        p, gorunur = zaman_cizelgesi(i)
        for k, w in zip(anahtarlar, agirliklar(p)):
            k.value = w
        t = i / KARE * 2 * math.pi
        tabla.rotation_euler = (0, 0, math.radians(32) * math.sin(t))  # yavaş yörünge: ±32°, periyodik
        bpy.context.view_layer.update()
        u = 0.5 + 0.10 * math.sin(7 * t + 0.6) + 0.03 * math.sin(23 * t)
        v = 0.55 + 0.22 * math.sin(5 * t) + 0.03 * math.cos(19 * t)
        konum = None
        for _ in range(12):
            vuruldu, yer, *_ = isin(u, v)
            if vuruldu:
                konum = world_to_camera_view(sc, cam, yer)
                break
            u += (0.5 - u) * 0.3; v += (0.55 - v) * 0.3
        bilgi.append({"i": i, "p": round(p, 4), "firca": bool(gorunur and konum is not None),
                      "x": round(konum.x, 4) if konum else 0.5, "y": round(konum.y, 4) if konum else 0.5})
        sc.render.filepath = os.path.join(a.kareler, f"s_{i:04d}.png")
        bpy.ops.render.render(write_still=True)
    with open(os.path.join(a.kareler, "bilgi.json"), "w", encoding="utf-8") as f:
        json.dump({"kare": KARE, "olcek": olcek, "kareler": bilgi}, f)
    print("SCULPT_BITTI", a.kareler, "kose", len(taban.data.vertices))


# ----------------------------------------------------------------------------------------------- 2. adım: arayüz
def kurgu_adimi(argv):
    import glob
    import shutil
    import subprocess
    from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=VARSAYILAN_MODEL)
    ap.add_argument("--kareler", default=VARSAYILAN_KARE)
    ap.add_argument("--blender", default=os.environ.get("OKTOS_BLENDER", "blender"))
    ap.add_argument("--kare-hazir", action="store_true", help="Blender adımını atla, var olan kareleri kullan")
    ap.add_argument("--crf", type=int, default=26)
    ap.add_argument("--drive", default=os.environ.get("OKTOS_EKRAN_KLASOR"))
    ap.add_argument("--drive-yok", action="store_true")
    a = ap.parse_args(argv)

    if not a.kare_hazir:
        for eski in glob.glob(os.path.join(a.kareler, "s_*.png")):
            os.remove(eski)  # yalnız bu betiğin kendi geçici kareleri
        subprocess.run([a.blender, "-b", "--factory-startup", "-P", os.path.abspath(__file__), "--",
                        "--model", a.model, "--kareler", a.kareler], check=True)
    with open(os.path.join(a.kareler, "bilgi.json"), encoding="utf-8") as f:
        bilgi = json.load(f)["kareler"]
    kareler = sorted(glob.glob(os.path.join(a.kareler, "s_*.png")))
    if len(kareler) != KARE or len(bilgi) != KARE:
        sys.exit(f"{KARE} kare bekleniyordu, {len(kareler)} bulundu: {a.kareler}")

    W, H = 640, 376
    UST, ALT, SOL, SAG = 20, 14, 30, 96          # masa-ekran-kurgu.py ile aynı çerçeve
    VW, VH = W - SOL - SAG, H - UST - ALT

    def yazi(boy):
        for ad in ("segoeui.ttf", "arial.ttf"):
            try:
                return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", ad), boy)
            except OSError:
                pass
        return ImageFont.load_default()
    F, FK = yazi(10), yazi(9)
    PANEL, KENAR, METIN, SOLUK = (0x30, 0x30, 0x30, 255), (0x1d, 0x1d, 0x1d, 255), (0xd6, 0xd6, 0xd6, 255), (0x9a, 0x9a, 0x9a, 255)
    MAVI = (0x4a, 0x6f, 0xa5, 255)

    arka = Image.new("RGB", (VW, VH))
    da = ImageDraw.Draw(arka)
    for y in range(VH):
        t = y / (VH - 1)
        da.line([(0, y), (VW, y)], fill=tuple(round(0x3a + (0x2b - 0x3a) * t) for _ in range(3)))
    ZEMIN = arka.convert("RGBA")

    C = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(C)
    d.rectangle([0, 0, W, UST - 1], fill=(0x23, 0x23, 0x23, 255))
    x = 8
    for k in ("File", "Edit", "Render", "Window", "Help"):
        d.text((x, 4), k, font=F, fill=METIN); x += d.textlength(k, font=F) + 10
    x += 8
    for i, k in enumerate(("Layout", "Modeling", "Sculpting", "UV Editing", "Shading", "Animation")):
        tw = d.textlength(k, font=F)
        if i == 2:
            d.rounded_rectangle([x - 5, 3, x + tw + 5, UST - 4], radius=3, fill=(0x47, 0x47, 0x47, 255))
        d.text((x, 4), k, font=F, fill=METIN if i == 2 else SOLUK); x += tw + 13
    # sol araç çubuğu: fırçalar (yuvarlak simgeler), ilki (Draw) seçili değil, Clay Strips seçili
    d.rectangle([0, UST, SOL - 1, H - ALT - 1], fill=PANEL)
    d.line([(SOL - 1, UST), (SOL - 1, H - ALT)], fill=KENAR)
    y = UST + 8
    for i in range(11):
        if i in (5, 9):
            y += 5
        d.rounded_rectangle([6, y, SOL - 7, y + 17], radius=3, fill=MAVI if i == 2 else (0x48, 0x48, 0x48, 255))
        d.ellipse([10, y + 3, SOL - 11, y + 14], outline=(0xc8, 0xc8, 0xc8, 255))
        if i < 5:
            d.ellipse([13, y + 6, SOL - 14, y + 11], fill=(0xc8, 0xc8, 0xc8, 255 if i == 2 else 150))
        y += 21
    # sağ şerit: sahne ağacı + fırça ayarları
    d.rectangle([W - SAG, UST, W, H - ALT - 1], fill=PANEL)
    d.line([(W - SAG, UST), (W - SAG, H - ALT)], fill=KENAR)
    d.text((W - SAG + 8, UST + 5), "Scene Collection", font=FK, fill=METIN)
    for i, k in enumerate(("Camera", "Light", "AkademiAtlisi")):
        yy = UST + 20 + i * 14
        if i == 2:
            d.rectangle([W - SAG + 2, yy - 1, W - 3, yy + 11], fill=(0x33, 0x4d, 0x80, 255))
        d.rectangle([W - SAG + 12, yy + 2, W - SAG + 18, yy + 8], fill=(0xe0, 0x9a, 0x40, 255) if i == 2 else SOLUK)
        d.text((W - SAG + 23, yy), k, font=FK, fill=METIN)
    d.line([(W - SAG + 4, UST + 68), (W - 4, UST + 68)], fill=KENAR)
    d.text((W - SAG + 6, UST + 72), "Clay Strips", font=FK, fill=METIN)
    SATIR = (("Radius", "50 px"), ("Strength", "0.620"), ("Voxel", None))
    for i, (k, v) in enumerate(SATIR):
        yy = UST + 88 + i * 19
        d.text((W - SAG + 6, yy + 2), k, font=FK, fill=SOLUK)
        d.rounded_rectangle([W - 44, yy, W - 5, yy + 13], radius=3, fill=(0x54, 0x54, 0x54, 255))
        if v:
            d.text((W - 41, yy + 1), v, font=FK, fill=METIN)
    d.rectangle([0, H - ALT, W, H], fill=(0x23, 0x23, 0x23, 255))
    d.text((8, H - ALT + 1), "Sculpt    Rotate View    Brush Radius", font=FK, fill=SOLUK)
    d.text((W - 70, H - ALT + 1), "Objects 1/3", font=FK, fill=SOLUK)
    VOKSEL_Y = UST + 88 + 2 * 19 + 1

    VP = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
    dv = ImageDraw.Draw(VP)
    dv.text((8, 6), "User Perspective", font=FK, fill=(0xe6, 0xe6, 0xe6, 230))
    dv.text((8, 18), "(1) AkademiAtlisi", font=FK, fill=(0xc8, 0xc8, 0xc8, 200))
    dv.text((VW - 86, VH - 16), "Sculpt Mode", font=FK, fill=(0xc8, 0xc8, 0xc8, 170))
    cx, cy = VW - 22, 24
    dv.line([(cx, cy), (cx + 13, cy + 4)], fill=(0xd8, 0x4a, 0x5a, 255), width=2); dv.ellipse([cx + 10, cy + 1, cx + 17, cy + 8], fill=(0xd8, 0x4a, 0x5a, 255))
    dv.line([(cx, cy), (cx - 7, cy + 8)], fill=(0x8b, 0xc3, 0x3a, 255), width=2); dv.ellipse([cx - 11, cy + 5, cx - 4, cy + 12], fill=(0x8b, 0xc3, 0x3a, 255))
    dv.line([(cx, cy), (cx, cy - 13)], fill=(0x4a, 0x8c, 0xe0, 255), width=2); dv.ellipse([cx - 4, cy - 17, cx + 3, cy - 10], fill=(0x4a, 0x8c, 0xe0, 255))

    def voksel(p):
        i = min(3, int(p + 0.5))
        return f"{VOKSEL[i] * 50 / 2.6:.2f} mm"  # büst gerçekte ~50 mm

    def kare(i):
        b = bilgi[i]
        v = Image.open(kareler[i]).convert("RGBA").resize((VW, VH), Image.LANCZOS)
        vp = ZEMIN.copy(); vp.alpha_composite(v); vp.alpha_composite(VP)
        if b["firca"]:
            fx, fy = b["x"] * VW, (1 - b["y"]) * VH
            ust = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
            du = ImageDraw.Draw(ust)
            r = 21
            du.ellipse([fx - r, fy - r, fx + r, fy + r], outline=(255, 255, 255, 215), width=1)
            du.ellipse([fx - r * 0.62, fy - r * 0.62, fx + r * 0.62, fy + r * 0.62], outline=(255, 255, 255, 90), width=1)
            du.ellipse([fx - 1, fy - 1, fx + 1, fy + 1], fill=(255, 255, 255, 160))
            vp.alpha_composite(ust)
        tam = Image.new("RGBA", (W, H), (0, 0, 0, 255))
        tam.paste(vp, (SOL, UST)); tam.alpha_composite(C)
        ImageDraw.Draw(tam).text((W - 41, VOKSEL_Y), voksel(b["p"]), font=FK, fill=METIN)
        return tam.convert("RGB")

    is_dir = tempfile.mkdtemp(prefix="masa-ekran-sculpt-kurgu-")
    for i in range(KARE):
        kare(i).save(os.path.join(is_dir, f"k_{i:04d}.png"))

    oda = os.path.join(KOK, "assets", "oda")
    mp4 = os.path.join(oda, "masa-ekran-sculpt.mp4")
    webp = os.path.join(oda, "masa-ekran-sculpt.webp")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", os.path.join(is_dir, "k_%04d.png"),
                    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
                    "-g", "60", "-movflags", "+faststart", "-an", mp4], check=True)
    Image.open(os.path.join(is_dir, "k_0000.png")).save(webp, "WEBP", quality=82, method=6)

    pafta_yol = os.path.join(is_dir, "masa-ekran-sculpt-pafta.png")
    pafta = Image.new("RGB", (W * 2 + 6, H * 2 + 6), (0x11, 0x11, 0x11))
    for j, f in enumerate((0, 90, 180, 270)):
        pafta.paste(Image.open(os.path.join(is_dir, f"k_{f:04d}.png")), ((j % 2) * (W + 6), (j // 2) * (H + 6)))
    pafta.save(pafta_yol)

    def fark(x, y):
        return round(sum(ImageStat.Stat(ImageChops.difference(Image.open(x), Image.open(y))).mean) / 3, 3)
    k = lambda i: os.path.join(is_dir, f"k_{i:04d}.png")
    ardisik = sorted(fark(k(i), k(i + 1)) for i in range(0, KARE - 1, 10))
    ozet = {"mp4": mp4, "mp4_kb": round(os.path.getsize(mp4) / 1024, 1), "webp": webp,
            "webp_kb": round(os.path.getsize(webp) / 1024, 1), "kare": KARE, "crf": a.crf, "pafta": pafta_yol,
            "dikis_fark": fark(k(KARE - 1), k(0)), "ardisik_fark_medyan": ardisik[len(ardisik) // 2],
            "ardisik_fark_en_cok": ardisik[-1], "is_klasoru": is_dir}
    if not a.drive_yok and a.drive:
        os.makedirs(a.drive, exist_ok=True)
        for kaynak in (mp4, webp, pafta_yol):
            shutil.copy2(kaynak, os.path.join(a.drive, os.path.basename(kaynak)))
        ozet["drive"] = a.drive
    print(json.dumps(ozet, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    if BLENDER:
        blender_adimi(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    else:
        kurgu_adimi(sys.argv[1:])
