# Ürün görseli: bir ürünün 3B kaynağını (STL / OBJ / GLB / 3MF) tutarlı bir stüdyo sahnesinde kare görsele çevirir.
#
# Amaç  : Sitedeki her ürün aynı ışık, aynı zemin ve aynı 3/4 açıyla görünsün (telefon ızgarasında okunur kare).
# Girdi : --id <urun-id> ve bir ya da birden çok --kaynak <dosya> (yol argümanla verilir; betikte yerel yol yok).
#         Birden çok kaynak (set ürünü) yan yana ya da ızgarada (--dizilim izgara) dizilir. Kaynaklar yalnız okunur.
# Çıktı : --cikti <klasör> içine PNG. Ad: --ad verilirse o; yoksa <id>_<360p|2048p>_<YYYYMMDD-HHMMSS>.png.
#         Dosya zaten varsa üzerine yazmaz, adına zaman damgası ekler. stdout'a tek satır 'URUN_RENDER {json}'
#         (boyut mm, üçgen, kabuk, süre); --rapor <dosya.jsonl> verilirse aynı satırı oraya ekler.
# Kipler: --olc        yalnız ölç (boyut, üçgen, kabuk sayısı), render yok
#         --onizleme   360x360, Cycles işlemcide 24 örnek + gürültü giderici (varsayılan)
#         --final      2048x2048, Cycles GPU (OptiX > CUDA > işlemci) 256 örnek. YALNIZ kullanıcı onayından sonra.
# Sahne : 1 birim = 1 mm, Z yukarı. Kaynak mm kabul edilir (--olcek ile değiştir). Nesnenin en alt noktası z = 0'a
#         oturur, XY'de ortalanır. Ön yüz -Y kabul edilir; değilse --don "x,y,z" (derece) ile çevir. Kamera 3/4
#         (--aci azimut, --yukseklik derece); kadraj nesnenin izdüşümünden hesaplanır (--doluluk, kesik kadraj olmaz).
#         Zemin: nötr sonsuz fon (kıvrık). Işık: yumuşak ana + dolgu + arka; gücü ışığın alanıyla ölçeklenir, böylece
#         5 cm'lik biblo ile 30 cm'lik kılıç aynı pozlamada çıkar.
# Malzeme: --malzeme tas | recine | pla, --renk #rrggbb (taş: girintiler koyulaşır, döküm görünümü);
#         renkli üründe renk soluk çıkarsa --pozlama -0.5 (EV).
#
# Kullanım (depo kökünden):
#   blender -b --factory-startup --python scripts/urun-render.py -- --id <id> --kaynak <dosya> --cikti <klasör> [--onizleme]
#   blender -b --factory-startup --python scripts/urun-render.py -- --id <id> --kaynak <a.stl> --kaynak <b.stl> --olc
import argparse
import json
import math
import os
import sys
import time
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime

import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

T0 = time.time()


# ---------------------------------------------------------------- argümanlar

def argumanlar():
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser(prog='urun-render.py')
    p.add_argument('--id', required=True, help='ürün kimliği (core/urun-veri.js URUNLER.id)')
    p.add_argument('--kaynak', action='append', required=True, help='3B dosya (STL/OBJ/GLB/GLTF/3MF); tekrarlanabilir')
    p.add_argument('--cikti', help='çıktı klasörü (render kiplerinde zorunlu)')
    p.add_argument('--ad', help='çıktı dosya adı (varsa zaman damgası eklenir)')
    kip = p.add_mutually_exclusive_group()
    kip.add_argument('--olc', action='store_true', help='yalnız ölç, render yok')
    kip.add_argument('--onizleme', action='store_true', help='360p önizleme (varsayılan)')
    kip.add_argument('--final', action='store_true', help='2048p GPU final (kullanıcı onayıyla)')
    p.add_argument('--olcek', type=float, default=1.0, help='kaynak birimi -> mm çarpanı (STL mm ise 1)')
    p.add_argument('--don', default='0,0,0', help='kaynağı döndür, derece "x,y,z" (ön yüz -Y olsun)')
    p.add_argument('--aci', type=float, default=35.0, help='kamera azimutu, derece (0 = tam önden)')
    p.add_argument('--yukseklik', type=float, default=22.0, help='kamera yükseklik açısı, derece')
    p.add_argument('--lens', type=float, default=70.0, help='odak uzaklığı mm (36 mm sensör)')
    p.add_argument('--doluluk', type=float, default=0.78, help='nesnenin kadrajdaki en büyük boyu (0-1)')
    p.add_argument('--malzeme', default='tas', choices=('tas', 'recine', 'pla'))
    p.add_argument('--renk', default=None, help='#rrggbb ürün rengi')
    p.add_argument('--fon', default='#cfd2ce', help='#rrggbb zemin rengi')
    p.add_argument('--pozlama', type=float, default=0.0, help='pozlama düzeltmesi, EV (renkli üründe -0.5 dene)')
    p.add_argument('--aralik', type=float, default=0.18, help='set ürününde parçalar arası boşluk (genişliğe oran)')
    p.add_argument('--dizilim', default='satir', choices=('satir', 'izgara'), help='set ürününde parçaların dizilişi')
    p.add_argument('--boyut', type=int, default=None, help='kare kenarı px (varsayılan 360 / 2048)')
    p.add_argument('--ornek', type=int, default=None, help='Cycles örnek sayısı (varsayılan 24 / 256)')
    p.add_argument('--kabuk', action='store_true', help='ölçüme bağlı kabuk (loose part) sayısını ekle')
    p.add_argument('--rapor', help='URUN_RENDER satırını ekleyeceği .jsonl dosyası')
    a = p.parse_args(arg)
    if not (a.olc or a.final):
        a.onizleme = True
    if not a.olc and not a.cikti:
        p.error('--cikti gerekli (render kipleri)')
    return a


def hex_renk(h):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


# ---------------------------------------------------------------- içe aktarma

def _yeni_nesneler(once):
    return [o for o in bpy.data.objects if o.name not in once and o.type == 'MESH']


def tmf_yukle(yol, ad):
    """3MF (zip + XML): çekirdek şema, bileşenler (components) ve üretim uzantısı (p:path). Birim mm'ye çevrilir."""
    CORE = '{http://schemas.microsoft.com/3dmanufacturing/core/2015/02}'
    PROD = '{http://schemas.microsoft.com/3dmanufacturing/production/2015/06}'
    BIRIM = {'micron': 0.001, 'millimeter': 1.0, 'centimeter': 10.0, 'inch': 25.4, 'foot': 304.8, 'meter': 1000.0}
    z = zipfile.ZipFile(yol)
    modeller, olcek = {}, 1.0

    def model_oku(isim):
        isim = isim.lstrip('/')
        if isim not in modeller:
            kok = ET.fromstring(z.read(isim))
            nesneler = {}
            for ob in kok.iter(CORE + 'object'):
                nesneler[ob.get('id')] = ob
            modeller[isim] = (kok, nesneler)
        return modeller[isim]

    def donusum(s):
        if not s:
            return Matrix.Identity(4)
        v = [float(x) for x in s.split()]
        return Matrix(((v[0], v[3], v[6], v[9]), (v[1], v[4], v[7], v[10]), (v[2], v[5], v[8], v[11]), (0, 0, 0, 1)))

    noktalar, ucgenler = [], []

    def topla(isim, oid, M):
        _, nesneler = model_oku(isim)
        ob = nesneler[oid]
        mesh = ob.find(CORE + 'mesh')
        if mesh is not None:
            v = np.array([[float(e.get('x')), float(e.get('y')), float(e.get('z'))]
                          for e in mesh.find(CORE + 'vertices')], dtype=np.float64)
            t = np.array([[int(e.get('v1')), int(e.get('v2')), int(e.get('v3'))]
                          for e in mesh.find(CORE + 'triangles')], dtype=np.int64)
            R = np.array(M)
            v = v @ R[:3, :3].T + R[:3, 3]
            ucgenler.append(t + sum(len(n) for n in noktalar))
            noktalar.append(v)
        comps = ob.find(CORE + 'components')
        if comps is not None:
            for c in comps.findall(CORE + 'component'):
                topla(c.get(PROD + 'path') or isim, c.get('objectid'), M @ donusum(c.get('transform')))

    kok_ad = next((n for n in z.namelist() if n.lower().endswith('3dmodel.model')), None)
    if not kok_ad:
        raise SystemExit(f'3MF içinde 3dmodel.model yok: {yol}')
    kok, _ = model_oku(kok_ad)
    olcek = BIRIM.get(kok.get('unit', 'millimeter'), 1.0)
    for item in kok.find(CORE + 'build').findall(CORE + 'item'):
        topla(item.get(PROD + 'path') or kok_ad, item.get('objectid'), donusum(item.get('transform')))
    if not noktalar:
        raise SystemExit(f'3MF içinde örgü yok: {yol}')
    v = np.concatenate(noktalar) * olcek
    t = np.concatenate(ucgenler)
    me = bpy.data.meshes.new(ad)
    me.vertices.add(len(v))
    me.vertices.foreach_set('co', v.astype(np.float32).ravel())
    me.loops.add(len(t) * 3)
    me.loops.foreach_set('vertex_index', t.astype(np.int32).ravel())
    me.polygons.add(len(t))
    me.polygons.foreach_set('loop_start', np.arange(0, len(t) * 3, 3, dtype=np.int32))
    me.update(calc_edges=True)
    me.validate()
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    return [ob]


def yukle(yol, olcek):
    """Dosyayı içe aktarır; mesh nesnelerini döndürür. Ölçek: kaynak birim -> mm."""
    if not os.path.isfile(yol):
        raise SystemExit(f'kaynak yok: {yol}')
    uz = os.path.splitext(yol)[1].lower()
    once = {o.name for o in bpy.data.objects}
    ad = os.path.splitext(os.path.basename(yol))[0]
    if uz == '.stl':
        bpy.ops.wm.stl_import(filepath=yol, global_scale=1.0, use_scene_unit=False, forward_axis='Y', up_axis='Z')
        yeni = _yeni_nesneler(once)
    elif uz == '.obj':
        bpy.ops.wm.obj_import(filepath=yol)
        yeni = _yeni_nesneler(once)
    elif uz in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=yol)
        yeni = _yeni_nesneler(once)
    elif uz == '.3mf':
        yeni = tmf_yukle(yol, ad)
    else:
        raise SystemExit(f'desteklenmeyen biçim: {uz} ({yol})')
    if not yeni:
        raise SystemExit(f'örgü gelmedi: {yol}')
    # glTF ebeveyn boşlukları: dünya dönüşümünü örgüye taşı, ebeveyni kopar (yerleştirme tek düzlemde kalsın)
    for o in yeni:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = Matrix.Diagonal((olcek, olcek, olcek, 1.0)) @ mw
    return yeni


# ---------------------------------------------------------------- ölçüm

def dunya_noktalari(nesneler, en_cok=None):
    parcalar = []
    for o in nesneler:
        me = o.data
        n = len(me.vertices)
        co = np.empty(n * 3, np.float32)
        me.vertices.foreach_get('co', co)
        co = co.reshape(-1, 3).astype(np.float64)
        M = np.array(o.matrix_world)
        parcalar.append(co @ M[:3, :3].T + M[:3, 3])
    p = np.concatenate(parcalar) if parcalar else np.zeros((0, 3))
    if en_cok and len(p) > en_cok:
        p = p[np.linspace(0, len(p) - 1, en_cok).astype(np.int64)]
    return p


def kabuk_say(me):
    """Bağlı parça (loose part) sayısı: kenarlar üzerinden kanca + sıkıştırma (numpy, büyük STL'de saniyeler)."""
    e = np.empty(len(me.edges) * 2, np.int64)
    me.edges.foreach_get('vertices', e)
    a, b = e[0::2], e[1::2]
    lab = np.arange(len(me.vertices))
    while True:
        la, lb = lab[a], lab[b]
        f = la != lb
        if not f.any():
            break
        m = np.minimum(la[f], lb[f])
        np.minimum.at(lab, la[f], m)
        np.minimum.at(lab, lb[f], m)
        while True:
            nl = lab[lab]
            if np.array_equal(nl, lab):
                break
            lab = nl
    kullanilan = np.zeros(len(me.vertices), bool)
    kullanilan[a] = True
    kullanilan[b] = True
    return int(len(np.unique(lab[kullanilan])))


def ucgen_say(nesneler):
    toplam = 0
    for o in nesneler:
        me = o.data
        me.calc_loop_triangles()
        toplam += len(me.loop_triangles)
    return toplam


# ---------------------------------------------------------------- yerleştirme

def tasi(nesneler, kay):
    # location değişince matrix_world sahne güncellenene kadar eski kalır: ölçümden önce güncelle
    for o in nesneler:
        o.location += kay
    bpy.context.view_layer.update()


def yerlestir(gruplar, don_derece, aralik, dizilim):
    """Her kaynak grubu döndürülür, en alt noktası z = 0'a oturur. Gruplar yan yana (satir) ya da kareye yakın
    ızgarada (izgara; arka sıralar kameradan uzakta) dizilir; bütün XY'de ortalanır."""
    R = Euler([math.radians(float(x)) for x in don_derece.split(',')], 'XYZ').to_matrix().to_4x4()
    for g in gruplar:
        for o in g:
            o.matrix_world = R @ o.matrix_world
    bpy.context.view_layer.update()
    kutular = []
    for g in gruplar:
        p = dunya_noktalari(g)
        kutular.append((p.min(0), p.max(0)))
    n = len(gruplar)
    sutun = math.ceil(math.sqrt(n)) if dizilim == 'izgara' else n
    gen = max(mx[0] - mn[0] for mn, mx in kutular)
    der = max(mx[1] - mn[1] for mn, mx in kutular)
    bosluk = aralik * float(np.median([mx[0] - mn[0] for mn, mx in kutular])) if n > 1 else 0.0
    x = 0.0
    for i, (g, (mn, mx)) in enumerate(zip(gruplar, kutular)):
        satir, s = divmod(i, sutun)
        if dizilim == 'izgara':
            merkez = Vector((s * (gen + bosluk), satir * (der + bosluk), 0.0))
        else:
            merkez = Vector((x + (mx[0] - mn[0]) / 2, 0.0, 0.0))
            x += (mx[0] - mn[0]) + bosluk
        tasi(g, merkez - Vector(((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, mn[2])))
    hepsi = [o for g in gruplar for o in g]
    p = dunya_noktalari(hepsi)
    mn, mx = p.min(0), p.max(0)
    tasi(hepsi, Vector((-(mn[0] + mx[0]) / 2, -(mn[1] + mx[1]) / 2, -mn[2])))
    p = dunya_noktalari(hepsi)
    return hepsi, p.min(0), p.max(0)


# ---------------------------------------------------------------- sahne

def birim_mm(sc):
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 0.001
    sc.unit_settings.length_unit = 'MILLIMETERS'


def urun_malzemesi(tur, renk_hex, D):
    VARS = {'tas': '#ddd7cd', 'recine': '#8b8f93', 'pla': '#c9c4bb'}
    renk = hex_renk(renk_hex or VARS[tur])
    m = bpy.data.materials.new('urun_' + tur)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = {'tas': 0.86, 'recine': 0.5, 'pla': 0.42}[tur]
    if tur == 'tas':
        # Döküm görünümü: girintiler koyulaşır (yalnız nesnenin kendisine bakan AO; zemin karartmaz)
        ao = nt.nodes.new('ShaderNodeAmbientOcclusion')
        ao.only_local = True
        ao.inputs['Distance'].default_value = 0.05 * D
        def renk_sok(dugum, ad, cikis=False):
            # Mix düğümünde aynı adlı float/vektör/renk soketleri var: renk olanı türüyle seç
            return next(s for s in (dugum.outputs if cikis else dugum.inputs) if s.name == ad and s.type == 'RGBA')

        koyu = nt.nodes.new('ShaderNodeMix')
        koyu.data_type = 'RGBA'
        koyu.blend_type = 'MULTIPLY'
        koyu.inputs['Factor'].default_value = 1.0
        renk_sok(koyu, 'A').default_value = renk
        nt.links.new(ao.outputs['AO'], renk_sok(koyu, 'B'))
        karis = nt.nodes.new('ShaderNodeMix')
        karis.data_type = 'RGBA'
        karis.inputs['Factor'].default_value = 0.75
        renk_sok(karis, 'A').default_value = renk
        nt.links.new(renk_sok(koyu, 'Result', True), renk_sok(karis, 'B'))
        nt.links.new(renk_sok(karis, 'Result', True), bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = renk
    return m


def yumusat(nesneler):
    for o in nesneler:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        try:
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
        except Exception:
            bpy.ops.object.shade_smooth()
    bpy.ops.object.select_all(action='DESELECT')


def sonsuz_fon(D, aci_derece, renk_hex):
    """Kıvrık fon: önde düz zemin, nesnenin arkasında çeyrek daire ile yükselen duvar; kameranın tam karşısına döner."""
    import bmesh
    W, on, arka, R, H = 60 * D, 30 * D, 1.6 * D, 2.2 * D, 25 * D
    profil = [(-on, 0.0), (arka, 0.0)]
    for i in range(1, 17):
        t = (math.pi / 2) * i / 16
        profil.append((arka + R * math.sin(t), R - R * math.cos(t)))
    profil.append((arka + R, H))
    bm = bmesh.new()
    sol = [bm.verts.new((-W / 2, y, z)) for y, z in profil]
    sag = [bm.verts.new((W / 2, y, z)) for y, z in profil]
    for i in range(len(profil) - 1):
        bm.faces.new((sol[i], sag[i], sag[i + 1], sol[i + 1]))
    me = bpy.data.meshes.new('fon')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('fon', me)
    bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = (0, 0, math.radians(aci_derece))
    m = bpy.data.materials.new('fon')
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = hex_renk(renk_hex)
    b.inputs['Roughness'].default_value = 0.92
    me.materials.append(m)
    return ob


def yon(az, el):
    """Hedeften kameraya birim yön: az = 0 tam önden (-Y), pozitif az sağa (+X)."""
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def alan_isigi(ad, hedef, az, el, uzaklik, boy, yogunluk):
    li = bpy.data.lights.new(ad, 'AREA')
    li.shape = 'DISK'
    li.size = boy
    li.energy = yogunluk * boy * boy  # alanla ölçek: aynı açıdan aynı aydınlık, nesnenin boyundan bağımsız
    ob = bpy.data.objects.new(ad, li)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = hedef + yon(az, el) * uzaklik
    ob.rotation_euler = (hedef - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return ob


def isiklar(hedef, D, az_kam):
    # Ana ışık kameranın solundan ve yukarıdan (yandan gelen ışık biçimi verir), dolgu sağdan zayıf, arka ışık kenarı ayırır
    alan_isigi('ana', hedef, az_kam - 55, 42, 3.2 * D, 2.6 * D, 55.0)
    alan_isigi('dolgu', hedef, az_kam + 70, 18, 3.6 * D, 3.2 * D, 7.0)
    alan_isigi('arka', hedef, az_kam + 165, 62, 2.0 * D, 1.4 * D, 40.0)
    w = bpy.data.worlds.new('dunya')
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.55, 0.55, 0.56, 1)
    bg.inputs['Strength'].default_value = 0.12
    bpy.context.scene.world = w


def kamera_kur(noktalar, az, el, lens, doluluk):
    """Kamerayı 3/4 açıya koyar; uzaklığı ve lens kaydırmasını nesnenin izdüşümüne göre ayarlar (kesik kadraj yok)."""
    sc = bpy.context.scene
    cam_d = bpy.data.cameras.new('kamera')
    cam_d.lens = lens
    cam_d.sensor_width = 36.0
    cam_d.sensor_fit = 'AUTO'
    cam = bpy.data.objects.new('kamera', cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    mn, mx = noktalar.min(0), noktalar.max(0)
    hedef = Vector(((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2))
    D = float(np.linalg.norm(mx - mn))
    d = yon(az, el)
    k = lens / 36.0
    uzak = 3.0 * D

    def izdusum(uz):
        cam.location = hedef + d * uz
        q = (-d).to_track_quat('-Z', 'Y')
        cam.rotation_euler = q.to_euler()
        # matrix_world sahne güncellenene kadar eski kalır: dönüşümü elle kur
        M = np.array((Matrix.Translation(cam.location) @ q.to_matrix().to_4x4()).inverted())
        pc = noktalar @ M[:3, :3].T + M[:3, 3]
        z = -pc[:, 2]
        return 0.5 + pc[:, 0] / z * k, 0.5 + pc[:, 1] / z * k

    for _ in range(12):
        u, v = izdusum(uzak)
        boy = max(u.max() - u.min(), v.max() - v.min())
        if abs(boy - doluluk) < 0.002:
            break
        uzak *= boy / doluluk
    u, v = izdusum(uzak)
    cam_d.shift_x = float((u.max() + u.min()) / 2 - 0.5)
    cam_d.shift_y = float((v.max() + v.min()) / 2 - 0.5)
    cam_d.clip_start = max(0.5, uzak * 0.02)
    cam_d.clip_end = uzak * 50
    kadraj = {'u': [round(float(u.min() - cam_d.shift_x), 3), round(float(u.max() - cam_d.shift_x), 3)],
              'v': [round(float(v.min() - cam_d.shift_y), 3), round(float(v.max() - cam_d.shift_y), 3)]}
    return cam, hedef, D, uzak, kadraj


def render_ayari(sc, final, boyut, ornek):
    sc.render.engine = 'CYCLES'
    sc.render.resolution_x = sc.render.resolution_y = boyut
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '8'
    cy = sc.cycles
    cy.samples = ornek
    cy.use_adaptive_sampling = True
    cy.use_denoising = True
    try:
        cy.denoiser = 'OPENIMAGEDENOISE'
    except TypeError:
        pass
    cy.max_bounces = 6 if final else 4
    cy.diffuse_bounces = 3 if final else 2
    cy.glossy_bounces = 3 if final else 2
    cy.transmission_bounces = 2
    cihaz = 'CPU'
    if final:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for tur in ('OPTIX', 'CUDA'):
            try:
                prefs.compute_device_type = tur
                prefs.get_devices()
                gpu = [x for x in prefs.devices if x.type == tur]
                if gpu:
                    for x in prefs.devices:
                        x.use = x.type == tur
                    cy.device = 'GPU'
                    cihaz = tur
                    break
            except TypeError:
                continue
    for ad, deger in (('view_transform', 'AgX'), ('look', 'AgX - Medium High Contrast')):
        try:
            setattr(sc.view_settings, ad, deger)
        except TypeError:
            pass
    return cihaz


def cikti_yolu(a, boyut):
    os.makedirs(a.cikti, exist_ok=True)
    damga = datetime.now().strftime('%Y%m%d-%H%M%S')
    ad = a.ad or f'{a.id}_{boyut}p_{damga}.png'
    yol = os.path.join(a.cikti, ad)
    if os.path.exists(yol):
        kok, uz = os.path.splitext(ad)
        yol = os.path.join(a.cikti, f'{kok}_{damga}{uz}')
    return yol


# ---------------------------------------------------------------- ana akış

def main():
    a = argumanlar()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    birim_mm(sc)

    t = time.time()
    gruplar = [yukle(k, a.olcek) for k in a.kaynak]
    sure_yukle = time.time() - t

    rapor = {'id': a.id, 'kip': 'olc' if a.olc else ('final' if a.final else 'onizleme'),
             'kaynaklar': [os.path.basename(k) for k in a.kaynak],
             'blender': bpy.app.version_string}
    parcalar = []
    for k, g in zip(a.kaynak, gruplar):
        p = dunya_noktalari(g)
        boy = (p.max(0) - p.min(0)).tolist()
        bilgi = {'dosya': os.path.basename(k), 'boyut_mm': [round(x, 1) for x in boy],
                 'ucgen': ucgen_say(g), 'nesne': len(g),
                 'mb': round(os.path.getsize(k) / 1e6, 1)}
        if a.kabuk:
            bilgi['kabuk'] = sum(kabuk_say(o.data) for o in g)
        if max(boy) < 5 or max(boy) > 2000:
            bilgi['birim_uyari'] = 'en büyük boy %.2f: birim mm olmayabilir (--olcek)' % max(boy)
        parcalar.append(bilgi)
    rapor['parcalar'] = parcalar

    hepsi, mn, mx = yerlestir(gruplar, a.don, a.aralik, a.dizilim)
    rapor['toplam_boyut_mm'] = [round(float(x), 1) for x in (mx - mn)]
    rapor['ucgen'] = sum(x['ucgen'] for x in parcalar)
    rapor['sure_yukle_sn'] = round(sure_yukle, 1)

    if a.olc:
        rapor['sure_toplam_sn'] = round(time.time() - T0, 1)
        return rapor

    final = bool(a.final)
    boyut = a.boyut or (2048 if final else 360)
    ornek = a.ornek or (256 if final else 24)
    noktalar = dunya_noktalari(hepsi, en_cok=60000)
    cam, hedef, D, uzak, kadraj = kamera_kur(noktalar, a.aci, a.yukseklik, a.lens, a.doluluk)
    mat = urun_malzemesi(a.malzeme, a.renk, D)
    for o in hepsi:
        o.data.materials.clear()
        o.data.materials.append(mat)
    yumusat(hepsi)
    sonsuz_fon(D, a.aci, a.fon)
    isiklar(hedef, D, a.aci)
    cihaz = render_ayari(sc, final, boyut, ornek)
    sc.view_settings.exposure = a.pozlama

    yol = cikti_yolu(a, boyut)
    sc.render.filepath = yol
    t = time.time()
    bpy.ops.render.render(write_still=True)
    rapor.update({'cikti': yol, 'boyut_px': boyut, 'ornek': ornek, 'cihaz': cihaz,
                  'kamera': {'azimut': a.aci, 'yukseklik': a.yukseklik, 'lens': a.lens,
                             'uzaklik_mm': round(uzak, 1), 'kadraj': kadraj},
                  'don': a.don, 'malzeme': a.malzeme, 'renk': a.renk, 'pozlama': a.pozlama,
                  'sure_render_sn': round(time.time() - t, 1),
                  'sure_toplam_sn': round(time.time() - T0, 1)})
    if not os.path.isfile(yol):
        rapor['hata'] = 'çıktı yazılmadı'
    return rapor


if __name__ == '__main__':
    r = main()
    satir = 'URUN_RENDER ' + json.dumps(r, ensure_ascii=False)
    print(satir, flush=True)
    a = argumanlar()
    if a.rapor:
        os.makedirs(os.path.dirname(os.path.abspath(a.rapor)), exist_ok=True)
        with open(a.rapor, 'a', encoding='utf-8') as f:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
