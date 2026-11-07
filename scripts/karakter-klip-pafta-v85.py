# Biggie v8.5 klip paftaları (Workbench önizleme karesi; GPU final değil). İki kipte çalışır:
#   1) Blender içinde: kareleri ve bir dizin dosyası yazar.
#      blender -b kaynak/karakter/bizzikolosko_site.blend --python scripts/karakter-klip-pafta-v85.py -- <klasör> <iş> [--sonek _v84]
#      iş: kutu <no> (kutu_k<no>: al / taşı / çevir / bırak, raf ve kutular) | bilek (sağ/sol bilek yakın: bust_tut, fare, elma_tut, Durma) | fare (klavyeden fareye geçişin ilk kareleri ve
#          dönüş; masa + fare) | buz (buzdolabi_ac, _bos; OLCU.FRIDGE gövdesi, raf, açılan kapak)
#   2) Python ile (Blender dışında, Pillow): kareleri etiketli paftaya dizer.
#      python scripts/karakter-klip-pafta-v85.py --birlestir <klasör> <iş> [--sonek _v84]
# Girdi: karakter-kaynak-kur.py'nin kurduğu çalışma kopyası (kaynak dosya kaydedilmez). Ölçüler core/oda-olcu.js'ten.
# Çıktı: <klasör>/_kare/<iş><sonek>_*.png, <klasör>/_kare/<iş><sonek>.json; birleştirince <klasör>/<iş><sonek>_pafta.png.
# Tekrar çalıştırmak güvenli (üzerine yazar).
import json, math, os, sys

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
SONEK = ''
if '--sonek' in arg:
    i = arg.index('--sonek'); SONEK = arg[i + 1]; del arg[i:i + 2]


def birlestir(klasor, is_):
    from PIL import Image, ImageDraw, ImageFont
    d = json.load(open(os.path.join(klasor, '_kare', f'{is_}{SONEK}.json'), encoding='utf-8'))
    s = d['sutun']; boy = d['boy']; sat = math.ceil(len(d['kareler']) / s)
    W = Image.new('RGB', (s * boy, sat * boy + 44), (240, 240, 240)); g = ImageDraw.Draw(W)
    try: fn = ImageFont.truetype('arial.ttf', 22); fk = ImageFont.truetype('arial.ttf', 18)
    except OSError: fn = fk = ImageFont.load_default()
    g.text((10, 10), d['baslik'], fill=(0, 0, 0), font=fn)
    for i, k in enumerate(d['kareler']):
        im = Image.open(os.path.join(klasor, '_kare', k['dosya'])).resize((boy, boy))
        x, y = (i % s) * boy, 44 + (i // s) * boy
        W.paste(im, (x, y)); g.rectangle((x, y, x + len(k['etiket']) * 10 + 12, y + 26), fill=(255, 255, 255)); g.text((x + 6, y + 3), k['etiket'], fill=(0, 0, 0), font=fk)
    yol = os.path.join(klasor, f'{is_}{SONEK}_pafta.png'); W.save(yol); print('PAFTA', yol)


if '--birlestir' in sys.argv:
    i = sys.argv.index('--birlestir'); birlestir(sys.argv[i + 1], sys.argv[i + 2]); sys.exit(0)

import bpy
from mathutils import Vector, Matrix, Quaternion
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI, IS = os.path.abspath(arg[0]), arg[1]
KAREK = os.path.join(CIKTI, '_kare'); os.makedirs(KAREK, exist_ok=True)
for ek in ('karakter-klipler.py', 'karakter-armut-geo.py', 'karakter-klip-eylem.py', 'karakter-klip-v82.py', 'karakter-klip-v83.py', 'karakter-klip-v84.py', 'karakter-klip-v85.py'):
    p = os.path.join(KOK, 'scripts', ek)
    if os.path.exists(p): exec(open(p, encoding='utf-8').read())
for _k in ('IK_kol.L', 'IK_kol.R', 'IK_bacak.L', 'IK_bacak.R'): rig[_k] = 0.0
sc = bpy.context.scene
for o in bpy.data.objects:
    if o.type in ('MESH', 'EMPTY', 'CURVE') and o.parent != rig: o.hide_render = True
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'; sc.display.shading.show_shadows = True
sc.render.resolution_x = sc.render.resolution_y = 640
cam = bpy.data.objects.new('_pafta_kam', bpy.data.cameras.new('_pafta_kam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.clip_start = 0.001; cam.data.clip_end = 100
KAYIT = []
SURUM = 'v8.4 (önce)' if SONEK == '_v84' else 'v8.5'


def malz(ad, renk, alfa=1.0):
    m = bpy.data.materials.get(ad) or bpy.data.materials.new(ad); m.diffuse_color = (*renk, alfa); return m


def kutu_ag(ad, x0, x1, y0, y1, z0, z1, renk, ust=None):
    """eksen hizalı kutu (mm, karakter yereli)"""
    me = bpy.data.meshes.new(ad); v = [(x, y, z) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    me.from_pydata([tuple(c * U for c in p) for p in v], [], [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)])
    me.materials.append(malz(ad + '_m', renk)); o = bpy.data.objects.new(ad, me); sc.collection.objects.link(o)
    if ust: o.parent = ust
    return o


def tak(ad):
    a = bpy.data.actions['Hareket - ' + ad]; rig.animation_data.action = a
    if a.slots: rig.animation_data.action_slot = a.slots[0]
    return a, json.loads(a.get('site_meta', '{}'))


def kare(f):
    sc.frame_set(int(f) + 1); sc.frame_set(int(f)); bpy.context.view_layer.update()


def ciz(ad, pos, hedef, lens, etiket):
    cam.location = pos; cam.rotation_euler = (hedef - pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
    dosya = f'{IS}{SONEK}_{len(KAYIT):03d}.png'; sc.render.filepath = os.path.join(KAREK, dosya); bpy.ops.render.render(write_still=True)
    KAYIT.append({'dosya': dosya, 'etiket': etiket})


def yaz(baslik, sutun, boy=480):
    json.dump({'baslik': baslik, 'sutun': sutun, 'boy': boy, 'kareler': KAYIT}, open(os.path.join(KAREK, f'{IS}{SONEK}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('KARELER', len(KAYIT))


def bust_nesne():
    B = bust_model(); me = bpy.data.meshes.new('_bust'); me.from_pydata([tuple(v) for v in B['verts']], [], B['faces'])
    me.materials.append(malz('_bust_m', (0.62, 0.62, 0.64))); o = bpy.data.objects.new('_bust', me); sc.collection.objects.link(o); return o


if IS == 'bilek':
    # oda kamerasının yönü (büst: elYakin, önünden 26° sola, z 1350) + sağ üst + sağ yan + alttan; manşet–el geçişi yakından
    b = bust_nesne()
    isler = [('bust_tut', 1, True), ('bust_tut', 61, True), ('bust_tut_yuru', 22, True), ('fare', 60, False), ('elma_tut', 1, False), ('Durma', 1, False)]
    for klip, f, bust in isler:
        a, m = tak(klip); kare(f)
        b.hide_render = not bust
        if bust:
            t_ = Vector(m['bust']['el_yerel']) / MM; q = m['bust']['el_yerel_q']
            b.matrix_world = rig.matrix_world @ rig.pose.bones['el.R'].matrix @ Matrix.Translation(t_) @ Quaternion((q[3], q[0], q[1], q[2])).to_matrix().to_4x4()
        pb = rig.pose.bones; fa = pb['ön_kol.R']
        e = rig.matrix_world @ (pb['el.R'].head - (fa.tail - fa.head).normalized() * (20 * U))
        oy = Vector((math.sin(math.radians(26)), -math.cos(math.radians(26)), 0)); po = e + oy * (1500 * U); po.z = 1350 * U
        if klip == 'Durma': po = e + Vector((-0.6, -1, 0.3)).normalized()
        for ad, p in (('oda yönü', po), ('sağ üst', e + Vector((-0.75, -0.35, 0.55)).normalized()), ('sağ yan', e + Vector((-0.95, -0.2, 0.1)).normalized())):
            if klip == 'bust_tut' and f == 1 and ad == 'oda yönü':
                ciz(klip, e + (po - e).normalized() * (1100 * U), e + Vector((0.05, 0, 0.12)), 50, f'{klip} {f} oda genel')
            b.hide_render = True   # yakın karelerde büst gizli: bilek görünsün
            ciz(klip, e + (p - e).normalized() * (430 * U), e, 50, f'{klip} {f} {ad}')
    yaz(f'Sağ bilek {SURUM}' + (': manşet elle birlikte (kazak manşeti %100 el.R, 50 mm geçiş)' if SONEK != '_v84' else ': manşet %26–40 el.R') + '; yakın karelerde büst gizli', 4)

elif IS == 'fare':
    # masa: yüzey (masa + mat, kökün yerelinde 408 mm), fare (OLCU.MOUSE.form, klibin yolunda), klavye kutusu
    a, m = tak('fare'); F = m['fare']; o = olcu_oku()
    z = F['masa_z_mm']
    kutu_ag('_masa', -700, 300, -720, -200, z - 28, z, (0.55, 0.5, 0.45))
    kutu_ag('_klavye', -45 - 220, -45 + 220, -560, -420, z, z + 30, (0.75, 0.75, 0.72))
    D = fare_bvh(); vs, fs = D['vs'], D['fs']
    me = bpy.data.meshes.new('_fare'); me.from_pydata([tuple(v) for v in vs], [], fs); me.materials.append(malz('_fare_m', (0.06, 0.06, 0.07)))
    fo = bpy.data.objects.new('_fare', me); sc.collection.objects.link(fo)
    yolm = {f_: Vector(p) / MM for f_, p in F['yol']}
    def Cf(f_):
        ks = sorted(yolm)
        for a_, b_ in zip(ks, ks[1:]):
            if a_ <= f_ <= b_: return yolm[a_].lerp(yolm[b_], (f_ - a_) / ((b_ - a_) or 1))
        return yolm[ks[-1]]
    kareler = [1, 3, 5, 7, 9, 10, 11, 12, 16, 60, 130, 133, 136, 140]
    for f in kareler:
        kare(f); fo.matrix_world = rig.matrix_world @ fare_M(Cf(f))
        c = rig.matrix_world @ (yolm[1] + Vector((0.06, 0.05, 0.06)))
        ciz('fare', c + Vector((-0.55, -0.45, 0.45)), c, 50, f'fare {f} sağ ön')
        ciz('fare', c + Vector((0.05, -0.62, 0.22)), c, 50, f'fare {f} ön')
    yaz(f'Fare {SURUM}: klavyeden fareye geçişin ilk kareleri (1–16), tutuş (60), dönüş (130–140)', 6, 400)

elif IS.startswith('kutu'):
    # kutu_<göz>: rafın tahtaları ve 8 kutu (core/oda-portfolyo.js), etkin kutu klipteki gibi (al–birak el.R soketinde);
    # kamera odanın FOCUS.oyunlar açısı (600, −1650, 1000) → (1680, −20, 430) ve rafın üstünden
    exec(open(os.path.join(KOK, 'scripts', 'karakter-klip-v85-kutu.py'), encoding='utf-8').read())
    no = int(arg[2]); IS = f'kutu_k{no}'; dur, _ = _durak_ust(); kut, _, _ = oyun_kutulari()
    ps = math.radians(dur[2])
    Minv = Matrix.Rotation(-ps, 4, 'Z') @ Matrix.Translation(Vector((-dur[0] * U, -dur[1] * U, 0)))
    def dunya_kutu(ad, x0, x1, y0, y1, z0, z1, renk):
        o = kutu_ag(ad, x0, x1, y0, y1, z0, z1, renk); o.matrix_world = Minv @ o.matrix_world; return o
    for k, (x0, x1, y0, y1, z0, z1) in raf_tahtalari().items(): dunya_kutu('_raf_' + k, x0, x1, y0, y1, z0, z1, (0.93, 0.93, 0.9))
    renkler = [(0.72, 0.22, 0.18), (0.18, 0.28, 0.35), (0.91, 0.77, 0.55), (0.29, 0.38, 0.26), (0.55, 0.35, 0.48), (0.83, 0.38, 0.12), (0.24, 0.43, 0.56), (0.79, 0.64, 0.63)]
    nes = {}
    for K in kut:
        w, d, h = K['olcu']; me = bpy.data.meshes.new('_k%d' % K['no'])
        v = [(x * d / 2, y * w / 2, z * h / 2) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
        me.from_pydata([tuple(c * U for c in p) for p in v], [], [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)])
        me.materials.append(malz('_km%d' % K['no'], renkler[K['no'] - 1])); o = bpy.data.objects.new('_k%d' % K['no'], me); sc.collection.objects.link(o)
        o.matrix_world = Minv @ Matrix.Translation(Vector(K['dunya']) * U) @ Matrix.Rotation(K['egik'], 4, 'Y')
        nes[K['no']] = o
    ob = nes[no]
    def kutu_el(a, m, f):
        t_ = Vector(m['kutu']['el_yerel']) / MM; q = m['kutu']['el_yerel_q']
        kare(f); return rig.matrix_world @ rig.pose.bones['el.R'].matrix @ Matrix.Translation(t_) @ Quaternion((q[3], q[0], q[1], q[2])).to_matrix().to_4x4()
    # kutu meshi kutu ölçüsünde, ama soket kutu çerçevesine göre (karakter yerelinde w x'te, d y'de): çerçeve farkı
    w, d, h = next(K['olcu'] for K in kut if K['no'] == no)
    me = bpy.data.meshes.new('_aktif'); v = [(x * w / 2, y * d / 2, z * h / 2) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
    me.from_pydata([tuple(c * U for c in p) for p in v], [], [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)])
    me.materials.append(malz('_aktif_m', renkler[no - 1])); akt = bpy.data.objects.new('_aktif', me); sc.collection.objects.link(akt)
    ob.hide_render = True
    kp = Minv @ Vector((600 * U, -1650 * U, 1000 * U)); kh = Minv @ Vector((1680 * U, -20 * U, 430 * U))
    def ciz2(et, f):
        ciz(et, kp, kh, 32, et)
        ciz(et, akt.matrix_world.translation + Vector((0.25, 0.55, 0.55)), akt.matrix_world.translation, 40, et + ' (üstten)')
    a, m = tak('kutu_uzan_al_k%d' % no); son = int(a.frame_range[1]); A = m['anlar']
    for et, f in (('al bekle', 1), ('al yürür', A['O1'] - 6), ('al uzanır', A['AL']), ('al çeker', A['CIK']), ('al kaldırır', A['KALK']), ('al yatırır', A['YAT']),
                  ('al taşır', (A['D0'] + A['D1']) // 2), ('al koyar', A['YUK']), ('al bıraktı', A['BIRAK'] + 6)):
        akt.matrix_world = kutu_el(a, m, min(max(f, m['al']), m['birak'])); kare(f); ciz2(f'k{no} {et} {f}', f)
    son_M = kutu_el(a, m, m['birak'])
    a, m = tak('kutu_uzan_cevir_sag_k%d' % no)
    c = son_M.translation.copy()
    for f in (12, 23, 34):
        th = math.radians(dict(m['kutu']['don'])[f]); kare(f)
        akt.matrix_world = Matrix.Translation(c) @ Matrix.Rotation(th, 4, 'Z') @ Matrix.Translation(-c) @ son_M; ciz2(f'k{no} çevir sağ {f}', f)
    a, m = tak('kutu_uzan_birak_k%d' % no); son = int(a.frame_range[1])
    for et, f in (('bırak alır', m['al']), ('bırak taşır', (m['al'] + m['birak']) // 2), ('bırak gözde', m['birak']), ('bırak bekle', son)):
        akt.matrix_world = kutu_el(a, m, min(max(f, m['al']), m['birak'])); kare(f); ciz2(f'k{no} {et} {f}', f)
    yaz(f'Kutu {no} (göz {next(K["goz"] for K in kut if K["no"] == no) + 1}) {SURUM}: al / taşı / çevir / bırak; raf ve kutular oda ölçüsünde', 6, 400)

elif IS == 'buz':
    # buzdolabı katı gövdesi (bz_kutulari, karakter yereli), açıklık; kapak hacmi (KAPAK_HACIM) menteşede açıyla döner
    Kt, Ac = bz_kutulari()
    for k, (x0, x1, y0, y1, z0, z1) in Kt.items():
        kutu_ag('_bz_' + k, x0, x1, y0, y1, z0, z1, (0.86, 0.86, 0.84) if k != 'raf' else (0.6, 0.8, 0.85))
    Mh = -BZV6['B0']
    mt = bpy.data.objects.new('_bz_mentese', None); sc.collection.objects.link(mt); mt.location = Mh
    # kapak yereli (u: menteşeden serbest uca −x, n: dış yüz +y) → karakter yereli (açı 0: kapalı)
    for i, ((u0, u1), (n0, n1), (z0, z1)) in enumerate(KAPAK_HACIM):
        kutu_ag(f'_bz_kapak{i}', -u1, -u0, n0, n1, z0, z1, (0.8, 0.8, 0.78) if i == 0 else (0.7, 0.75, 0.8), ust=mt)
    for ad in ('buzdolabi_ac', 'buzdolabi_bos'):
        a, m = tak(ad)
        kareler = [1, 20, 36, 46, 52, 56, 60, 62, 64, 68, 72, 84] if ad == 'buzdolabi_ac' else [36, 56, 62, 68]
        for f in kareler:
            kare(f); mt.rotation_euler = (0, 0, m['kapak'][f - 1][1])   # meta: rotation.z farkı (− açılır)
            c = rig.matrix_world @ (Mh + Vector((-0.32, 0.05, 0.4)))
            # oda kamerası FOCUS.buzdolabi: pos (−1641, −1452, 1568) → (1580, 820, 725), kök (1220, 300) ψ 90 → yerel
            ciz(ad, c + (Vector((-1752, 2861, 1568)) * U - c).normalized() * 1.6, c, 40, f'{ad} {f} oda yönü')
            ciz(ad, c + Vector((-1.0, -0.15, 0.2)).normalized() * 1.25, c + Vector((0.1, -0.1, 0)), 40, f'{ad} {f} sağ yan')
    yaz(f'Buzdolabı {SURUM}: gövde açıklığın dışında, kol ve el yalnız boşlukta (gri: OLCU.FRIDGE gövdesi, mavi: raf)', 6, 400)
