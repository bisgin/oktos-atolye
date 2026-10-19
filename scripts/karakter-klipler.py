# Oda karakterinin sitenin koltuğuna göre kurulan klipleri: "Hareket - Sırt Açma" ve "Hareket - Koltukla Kayma".
# Karakter dosyası (bizzikoloşko) açıkken Blender içinde çalışır:
#   exec(open('scripts/karakter-klipler.py', encoding='utf-8').read()); koltuk_al('assets/oda/oda-esya.glb'); sirt_ac(); kaydir()
# sonra dosyayı kaydet ve scripts/karakter-blender.py ile GLB'yi yeniden çıkar. Kliplerin kare bilgisi aksiyonun
# "site_meta" özelliğine yazılır, dışa aktarım onu GLB'nin karakter_meta'sına taşır.
# Koltuğun hareketi core/oda-karakter.js ile aynı formülden: sırt katlılığı (sirt), kökün yürüyüşü (kayma, mm, bakış
# yönünde), koltuğun köke tutturulduğu aralık (tut) ve tutarken kendi ekseninde dönüşü (don). Referans "Site Koltuk"
# (oda-esya.glb'den, karakter birimine ölçekli) önizleme için aynı formülle anahtarlanır; dışa aktarılmaz.
import bpy, math
from mathutils import Vector, Matrix, Quaternion, Euler

rig = bpy.data.objects['bizzikoloşko_rig']
KOL = bpy.data.objects.get('Site Koltuk'); SIRT = bpy.data.objects.get('koltuk_sirt'); UST = bpy.data.objects.get('koltuk_ust')

def koltuk_al(glb):
    """Sitenin oyuncu koltuğunu (oda-esya.glb 'koltuk' kökü) karakter birimine ölçekli, render dışı bir koleksiyona alır"""
    global KOL, SIRT, UST
    onceki = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb)
    yeni = [o for o in bpy.data.objects if o not in onceki]
    kok = bpy.data.objects['koltuk'] if 'koltuk' in bpy.data.objects else next(o for o in yeni if o.name.startswith('koltuk') and not o.parent)
    tut = set()
    def alt(o):
        tut.add(o)
        for c in o.children: alt(c)
    alt(kok)
    for o in yeni:
        if o not in tut: bpy.data.objects.remove(o, do_unlink=True)
    kol = bpy.data.collections.get('Site Koltuk') or bpy.data.collections.new('Site Koltuk')
    if kol.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(kol)
    kol.hide_render = True
    for o in tut:
        for c in list(o.users_collection): c.objects.unlink(o)
        kol.objects.link(o)
    kok.name = 'Site Koltuk'
    kok.scale = (1 / 1500,) * 3   # Z yukarı GLB: içe aktarıcının dönüşü koltuk_kur'da geri alınır (−90° X)
    KOL, SIRT, UST = kok, bpy.data.objects['koltuk_sirt'], bpy.data.objects['koltuk_ust']
S = 1 / 1500                     # site mm → karakter birimi (rig 1,5 ile dışa aktarılır)
SIRT_DIK, SIRT_KATLI = 0.14, -math.pi / 2
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))

def ease(t):
    t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)

def anahtar(k, f):
    if isinstance(k, (int, float)): return k
    if f <= k[0][0]: return k[0][1]
    for (f0, v0), (f1, v1) in zip(k, k[1:]):
        if f <= f1: return v0 + (v1 - v0) * ease((f - f0) / ((f1 - f0) or 1))
    return k[-1][1]

def aralik(f, a, b): return ease((f - a) / (b - a))

def fcmap(act):
    d = {}
    for l in act.layers:
        for s in l.strips:
            for cb in s.channelbags:
                for fc in cb.fcurves: d[(fc.data_path, fc.array_index)] = fc
    return d

REST = {b.name: b.matrix_local.copy() for b in rig.data.bones}

def lq(bn, ax, deg):
    """Armatür uzayındaki eksen etrafında dönüş → kemiğin yerel uzayında quaternion"""
    a = (REST[bn].to_3x3().inverted() @ Vector(ax)).normalized()
    return Quaternion(a, math.radians(deg))

def yeni_aksiyon(ad):
    eski = bpy.data.actions.get(ad)
    if eski: bpy.data.actions.remove(eski)
    a = bpy.data.actions.new(ad)
    a.use_fake_user = True
    return a

def yaz(act, seri, kareler):
    """seri: {(yol, indeks): [değer...]} → yoğun anahtarlar (hızlı). Aksiyon önce rig'e takılır (yuva oluşur)"""
    rig.animation_data.action = act
    for (yol, i), vals in seri.items():
        fc = act.fcurve_ensure_for_datablock(rig, yol, index=i)
        fc.keyframe_points.clear()
        fc.keyframe_points.add(len(kareler))
        co = []
        for f, v in zip(kareler, vals): co += [f, v]
        fc.keyframe_points.foreach_set('co', co)
        fc.keyframe_points.foreach_set('interpolation', [1] * len(kareler))  # LINEAR
        fc.update()
    return act

# ---------------------------------------------------------------------------------------------------------------
# Sırt açma: arkada dur → bir adım yaklaş → katlı sırtı arka yüzünden tut, kaldır (oturak kalkar) → koltuğu kendine
# çekerek geri yürü → koltuğu sağına doğru çevir → bırak. JS meta ile aynı sayılar.
SA = {
    'son': 140,
    # mm, bakış yönünde: 10 cm yaklaşır, kaldırırken 12 cm geri (dikilen sırt büyük başa çarpmasın), sonra koltukla 24 cm
    'kayma': [[1, 0], [14, 100], [24, 100], [56, -60], [64, -60], [100, -300]],
    'sirt': [[24, 1], [56, 0]],                             # katlılık
    'tut': [64, 128], 'don': [[100, 0], [126, -math.pi / 2]],
    'ik': [[1, 0], [6, 0], [16, 1], [110, 1], [122, 0]],    # el IK etkisi
}
KAVRAMA = 600  # mm: kavrama noktası koltuk merkezinin bu kadar arkası

def koltuk_durumu(f, M):
    """Karakterin yerel uzayında koltuk: merkez y, dönüş (rad), katlılık"""
    kay = anahtar(M['kayma'], f) * S
    t0 = M['tut'][0]
    if f < t0:
        y = -KAVRAMA * S + kay           # dünyada duruyor: kök yaklaştıkça yerelde yaklaşır
    else:
        y = -KAVRAMA * S + anahtar(M['kayma'], t0) * S  # tutunca köke kilitli
    return y, anahtar(M.get('don', 0), f), anahtar(M['sirt'], f)

def koltuk_kur(y, don, kat):
    KOL.location = (0, y, 0)
    KOL.rotation_mode = 'XYZ'
    KOL.rotation_euler = (-math.pi / 2, 0, math.pi + don)
    UST.location.y = 70 * kat          # içe aktarımda glTF z → Blender −y: inik oturak +70
    SIRT.rotation_mode = 'QUATERNION'
    SIRT.rotation_quaternion = Quaternion((1, 0, 0), SIRT_DIK + (SIRT_KATLI - SIRT_DIK) * kat)

# Sırtın arka yüzünde tutma noktaları (glTF yerel: x yan, y kalınlık (−48 arka yüz), z boy) → Blender yerel (x, −z, y)
TUT = {'L': Vector((150, -120, -48)), 'R': Vector((-150, -120, -48))}

def sirt_ac():
    taban = fcmap(bpy.data.actions['Hareket - Durma'])
    kareler = list(range(1, SA['son'] + 1))
    pb = rig.pose.bones
    # Kök kemiği bu klipte dinlenmede mi (IK hedeflerinin ebeveyni)
    seri = {}
    def ekle(k, v): seri.setdefault(k, []).append(v)
    prev = {}
    for f in kareler:
        y, don, kat = koltuk_durumu(f, SA)
        koltuk_kur(y, don, kat)
        bpy.context.view_layer.update()
        ik = anahtar(SA['ik'], f)
        # Gövde: Durma tabanı + eğilme
        egil = anahtar([[1, 0], [16, 22], [26, 26], [44, 10], [56, 1], [64, 0], [80, -5], [100, -5], [112, 6], [126, 0], [140, 0]], f)
        bas = anahtar([[1, 0], [14, 14], [40, 10], [56, 2], [64, 0], [100, 0], [112, 12], [126, 0]], f)
        dizb = anahtar([[1, 0], [16, 10], [30, 12], [56, 4], [64, 6], [100, 6], [126, 0]], f)
        EK = {'omurga': [(X, egil * 0.5)], 'göğüs': [(X, egil * 0.5)], 'boyun': [(X, bas * 0.4)], 'kafa': [(X, bas * 0.6)],
              'kalça': [(X, dizb * 0.4)]}
        # Çekerken adım: ayaklar sırayla kalkar (sol 66–76, sağ 78–88, sol 90–100)
        for taraf, a, b in (('L', 66, 76), ('R', 78, 88), ('L', 90, 100)):
            if a <= f <= b:
                u = math.sin(math.pi * (f - a) / (b - a))
                EK.setdefault('uyluk.' + taraf, []).append((X, -14 * u))
                EK.setdefault('baldır.' + taraf, []).append((X, 26 * u))
        for bn in {k[0].split('"')[1] for k in taban if k[0].startswith('pose.bones') and k[0].endswith('rotation_euler')}:
            e = Euler([taban[(f'pose.bones["{bn}"].rotation_euler', i)].evaluate(f) if (f'pose.bones["{bn}"].rotation_euler', i) in taban else 0 for i in range(3)], 'XYZ')
            if bn in EK:
                q = e.to_quaternion()
                for ax, d in EK[bn]: q = lq(bn, ax, d) @ q
                e = q.to_euler('XYZ', prev.get(bn, e))
            prev[bn] = e
            for i in range(3): ekle((f'pose.bones["{bn}"].rotation_euler', i), e[i])
        for (yol, i), fc in taban.items():
            if yol.endswith('rotation_euler') and yol.startswith('pose.bones'): continue
            if yol.startswith('pose.bones') and ('el_IK' in yol) and not yol.endswith('scale'): continue
            ekle((yol, i), fc.evaluate(f))
        # Eller: IK hedefi tutma noktasında (bilek tutma noktasının biraz üstünde ve gerisinde), avuç aşağı, parmaklar ileri
        for taraf in ('L', 'R'):
            hedef = SIRT.matrix_world @ TUT[taraf]
            bilek = hedef + Vector((0, 0.035, 0.03))
            dinlenme = REST['el_IK.' + taraf]
            yon = (hedef - bilek).normalized() * 0.3 + Vector((0, -1, -0.35)).normalized()
            rq = dinlenme.to_quaternion()
            y_rest = (rq @ Vector((0, 1, 0))).normalized()
            q = y_rest.rotation_difference(yon.normalized()) @ rq
            Mh = Matrix.Translation(bilek) @ q.to_matrix().to_4x4()
            basis = dinlenme.inverted() @ Mh      # ebeveyn kök dinlenmede
            loc, rot, _ = basis.decompose()
            for i in range(3): ekle((f'pose.bones["el_IK.{taraf}"].location', i), loc[i])
            for i in range(4): ekle((f'pose.bones["el_IK.{taraf}"].rotation_quaternion', i), rot[i])
            ekle((f'["IK_kol.{taraf}"]', 0), ik)
    act = yeni_aksiyon('Hareket - Sırt Açma')
    yaz(act, seri, kareler)
    act.frame_range = (1, SA['son'])
    import json
    act['site_meta'] = json.dumps({'sirt': SA['sirt'], 'kayma': SA['kayma'], 'tut': SA['tut'], 'don': SA['don'], 'kavrama': KAVRAMA})
    # Referans koltuğu önizleme için anahtarla
    for o in (KOL, UST, SIRT):
        if o.animation_data: o.animation_data_clear()
    for f in kareler:
        y, don, kat = koltuk_durumu(f, SA)
        koltuk_kur(y, don, kat)
        KOL.keyframe_insert('location', frame=f); KOL.keyframe_insert('rotation_euler', frame=f)
        UST.keyframe_insert('location', frame=f); SIRT.keyframe_insert('rotation_quaternion', frame=f)
    return act

def tak(ad):
    act = bpy.data.actions[ad]
    rig.animation_data.action = act
    rig.animation_data.action_slot = act.slots[0]
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = int(act.frame_range[0]), int(act.frame_range[1])

# ---------------------------------------------------------------------------------------------------------------
# Koltukla kayma (döngü, 40 kare): masa başı oturuşu (Masada Bekleme 1. kare), eller kolçaklarda (IK), bacaklar sırayla
# sallanır (sitedeki koltuk karakterin boyuna göre yüksek: ayaklar yere değmez), gövde hafifçe sallanır. Kök masa
# eşlemesinde (z_site = 1,5 z + 335): kolçak üstü 695 mm → 0,24; kolçaklar ±310 mm → ±0,207.
KK = {'son': 41, 'donem': 40}
KOLCAK = {'L': Vector((0.207, -0.045, 0.255)), 'R': Vector((-0.207, -0.045, 0.255))}

def kaydir():
    taban = fcmap(bpy.data.actions['Hareket - Masada Bekleme'])
    kareler = list(range(1, KK['son'] + 1))
    seri = {}
    def ekle(k, v): seri.setdefault(k, []).append(v)
    prev = {}
    for f in kareler:
        a = 2 * math.pi * (f - 1) / KK['donem']
        EK = {
            'baldır.L': [(X, 20 * math.sin(a))], 'baldır.R': [(X, 20 * math.sin(a + math.pi))],
            'uyluk.L': [(X, -6 * math.sin(a + 0.6))], 'uyluk.R': [(X, -6 * math.sin(a + math.pi + 0.6))],
            'ayak.L': [(X, -8 * math.sin(a))], 'ayak.R': [(X, -8 * math.sin(a + math.pi))],
            'omurga': [(X, -3 + 1.2 * math.sin(2 * a))], 'göğüs': [(X, -2), (Z, 2 * math.sin(a))],
            'kafa': [(Z, -2 * math.sin(a)), (X, 2)],
        }
        for bn in {k[0].split('"')[1] for k in taban if k[0].startswith('pose.bones') and k[0].endswith('rotation_euler')}:
            e = Euler([taban[(f'pose.bones["{bn}"].rotation_euler', i)].evaluate(1) if (f'pose.bones["{bn}"].rotation_euler', i) in taban else 0 for i in range(3)], 'XYZ')
            if bn in EK:
                q = e.to_quaternion()
                for ax, d in EK[bn]: q = lq(bn, ax, d) @ q
                e = q.to_euler('XYZ', prev.get(bn, e))
            prev[bn] = e
            for i in range(3): ekle((f'pose.bones["{bn}"].rotation_euler', i), e[i])
        for (yol, i), fc in taban.items():
            if yol.endswith('rotation_euler') and yol.startswith('pose.bones'): continue
            if 'el_IK' in yol and not yol.endswith('scale'): continue
            ekle((yol, i), fc.evaluate(1))
        for taraf in ('L', 'R'):
            bilek = KOLCAK[taraf] + Vector((0, 0, 0.004 * math.sin(a + (0 if taraf == 'L' else math.pi))))
            dinlenme = REST['el_IK.' + taraf]
            yon = Vector((0.15 if taraf == 'L' else -0.15, -1, -0.25)).normalized()  # parmaklar öne, kolçağın ucuna
            rq = dinlenme.to_quaternion()
            q = (rq @ Vector((0, 1, 0))).normalized().rotation_difference(yon) @ rq
            basis = dinlenme.inverted() @ (Matrix.Translation(bilek) @ q.to_matrix().to_4x4())
            loc, rot, _ = basis.decompose()
            for i in range(3): ekle((f'pose.bones["el_IK.{taraf}"].location', i), loc[i])
            for i in range(4): ekle((f'pose.bones["el_IK.{taraf}"].rotation_quaternion', i), rot[i])
            ekle((f'["IK_kol.{taraf}"]', 0), 1.0)
    act = yeni_aksiyon('Hareket - Koltukla Kayma')
    yaz(act, seri, kareler)
    act.frame_range = (1, KK['son'])
    import json
    act['site_meta'] = json.dumps({'tekrar': True})
    # Önizleme: koltuk oturuş yerinde (masa eşlemesinde merkez 7,5 mm önde), sırt dik, oturak kalkık
    for o in (KOL, UST, SIRT):
        if o.animation_data: o.animation_data_clear()
    koltuk_kur(-0.005, 0, 0)
    KOL.location.z = -335 * S
    return act
