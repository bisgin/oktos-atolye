# Sunum eylem kliplerinin inceleme dosyası, ölçümü ve paftası (v6 2026-11-04: armudun gerçek yüzeyi, 420 mm raf, buzdolabının
# yeni duruşu; v5, 2026-11-03; v4'ten: gerçek buzdolabı modeli
# assets/oda/oda-esya.glb, elma GLB'de (rig'in elma kemikleri), yeni klipler, yüz yakın planı, kapak rafı karesi).
# Amaç: kullanıcı Blender'da klipleri eşyalarla birlikte görsün; eşyalar (elma, koçan, kumanda, kutu) el kemiğine Child Of
#       kısıtıyla bağlanır (influence anahtarlı: alındığı kareden bırakıldığı kareye dek elde; sonra dünyada sabit ya da
#       atış yayında). Ölçüm kare kare yapılır, pafta düşük çözünürlüklü Workbench karesidir (GPU final değil).
# Girdi: karakter-kaynak-kur.py'nin kurduğu çalışma kopyası (kaynak/karakter/bizzikolosko_site.blend). Kaynak kaydedilmez.
# Kullanım (depo kökünden):
#   blender -b kaynak/karakter/bizzikolosko_site.blend --python scripts/karakter-klip-inceleme.py -- <pafta klasörü> <inceleme.blend> [--sonek _v4] [--pafta-yok]
# Çıktı: <klasör>/<klip><sonek>_pafta.png (12 kare, ön | yan), <klasör>/elma_ye_cigneme<sonek>_pafta.png (yakın plan),
#        <klasör>/olcum<sonek>.json; <inceleme.blend> (her klibin eşyaları "İnceleme <klip>" koleksiyonunda).
# Tekrar çalıştırmak güvenli (çıktıların üzerine yazar). ffmpeg PATH'te olmalı.
import bpy, json, math, os, subprocess, sys, bmesh
from mathutils import Vector, Matrix, Quaternion

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SONEK = '_v7'
if '--sonek' in arg:
    i = arg.index('--sonek'); SONEK = arg[i + 1]; del arg[i:i + 2]
PAFTA = '--pafta-yok' not in arg
arg = [a for a in arg if a != '--pafta-yok']
CIKTI, KAYDET = os.path.abspath(arg[0]), os.path.abspath(arg[1])
os.makedirs(os.path.join(CIKTI, '_kare'), exist_ok=True)
sc = bpy.context.scene
rig = bpy.data.objects['bizzikoloşko_rig']
MM = 1500.0
KLIPLER = ['buzdolabi_ac', 'buzdolabi_bos', 'elma_ye', 'elma_firlat', 'yaslan', 'egil_bak', 'kumanda', 'kutu_al',
           'armut_yat', 'armut_uyukla', 'armut_kalk', 'diz_cok', 'kutu_al_diz', 'diz_kalk', 'diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol',
           'kutu_rafa_birak', 'kitap_al_alt', 'kitap_al_orta', 'kitap_al_ust']
if '--yalniz' in arg:   # v7: yalnız verilen klipler (virgüllü)
    i = arg.index('--yalniz'); KLIPLER = arg[i + 1].split(','); del arg[i:i + 2]
    CIKTI, KAYDET = os.path.abspath(arg[0]), os.path.abspath(arg[1])
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(KOK, 'scripts', 'karakter-armut-geo.py'), encoding='utf-8').read())   # v6: armudun gerçek yüzeyi
G = Vector((0, 0, -9810 / MM))
U = 1 / MM
for _k in ('IK_kol.L', 'IK_kol.R', 'IK_bacak.L', 'IK_bacak.R'): rig[_k] = 0.0   # v8.2: FK klipler (Klavye Tuşlama) IK'sız
exec(open(os.path.join(KOK, 'scripts', 'karakter-klip-v82.py'), encoding='utf-8').read())   # v8.2: büst modeli (bust_model), FARE


def akt(ad): return bpy.data.actions['Hareket - ' + ad]
def meta(ad): return json.loads(akt(ad)['site_meta'])


def tak(ad):
    a = akt(ad); rig.animation_data.action = a
    if a.slots: rig.animation_data.action_slot = a.slots[0]


def kare(f):
    # Aynı kareye yeniden gelince (aksiyon değişmiş olsa da) Blender pozu yeniden hesaplamıyor: önce başka kareye geç
    if sc.frame_current == int(f): sc.frame_set(int(f) + 1)
    sc.frame_set(int(f)); bpy.context.view_layer.update()


def kemik_w(kemik): return rig.matrix_world @ rig.pose.bones[kemik].matrix


def anahtar(k, f):
    if isinstance(k, (int, float)): return k
    if f <= k[0][0]: return k[0][1]
    for (f0, v0), (f1, v1) in zip(k, k[1:]):
        if f <= f1:
            t = max(0.0, min(1.0, (f - f0) / ((f1 - f0) or 1))); return v0 + (v1 - v0) * t * t * (3 - 2 * t)
    return k[-1][1]


# ---- sahne ----
for o in sc.objects:
    if o.type in {'MESH', 'CURVE', 'EMPTY', 'LIGHT', 'CAMERA', 'FONT'} and o != rig and o.parent != rig:
        o.hide_render = True; o.hide_viewport = True
for o in rig.children:
    o.hide_render = o.name in {'Sandviç', 'allık.L', 'allık.R', 'gözyaşı.L', 'gözyaşı.R'}
    if o.hide_render: o.hide_viewport = True
for c in bpy.data.collections:
    if c.name in ('Site Koltuk', 'Eski (Tripo)'): c.hide_render = True; c.hide_viewport = True
try: sc.render.engine = 'BLENDER_WORKBENCH'
except TypeError as e: print('MOTOR', e)
sh = sc.display.shading
sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_shadows = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 640, 360, 100
sc.render.fps = 30; sc.render.image_settings.file_format = 'PNG'
w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.color = (0.93, 0.92, 0.9)
ORTAK = bpy.data.collections.new('İnceleme Ortak'); sc.collection.children.link(ORTAK)


def malzeme(ad, renk):
    m = bpy.data.materials.get(ad) or bpy.data.materials.new(ad); m.diffuse_color = (*renk, 1); return m


def kutu(kol, ad, x0, x1, y0, y1, z0, z1, renk, ust=None):
    me = bpy.data.meshes.new(ad)
    v = [(x, y, z) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    me.from_pydata(v, [], [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)])
    me.materials.append(malzeme(ad + '_m', renk))
    o = bpy.data.objects.new(ad, me); kol.objects.link(o)
    if ust: o.parent = ust
    return o


def kure(kol, ad, r, renk, olcek=(1, 1, 1)):
    me = bpy.data.meshes.new(ad); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    for v in bm.verts: v.co = Vector([v.co[i] * olcek[i] for i in range(3)])
    bm.to_mesh(me); bm.free(); me.materials.append(malzeme(ad + '_m', renk))
    o = bpy.data.objects.new(ad, me); kol.objects.link(o); return o


def kamera(ad, olcek):
    c = bpy.data.cameras.new(ad); c.type = 'ORTHO'; c.ortho_scale = olcek
    o = bpy.data.objects.new(ad, c); ORTAK.objects.link(o); return o


def kam_yer(o, yer, hedef, olcek=None):
    o.location = yer; o.rotation_euler = (Vector(hedef) - Vector(yer)).to_track_quat('-Z', 'Y').to_euler()
    if olcek: o.data.ortho_scale = olcek


ON, YAN, YUZ = kamera('İnc Kam Ön', 1.75), kamera('İnc Kam Yan', 1.75), kamera('İnc Kam Yüz', 0.42)
kam_yer(YUZ, (-0.55, -1.05, 0.86), (0, -0.1, 0.77))
kutu(ORTAK, 'İnc Zemin', -1.6, 1.6, -3.0, 1.2, -0.01, 0, (0.78, 0.76, 0.72))
for i in range(-10, 11):
    kutu(ORTAK, f'İnc Çizgi x{i}', i * 0.1 - 0.0015, i * 0.1 + 0.0015, -1.0, 1.0, 0, 0.0008, (0.55, 0.53, 0.5))
    kutu(ORTAK, f'İnc Çizgi y{i}', -1.0, 1.0, i * 0.1 - 0.0015, i * 0.1 + 0.0015, 0, 0.0008, (0.55, 0.53, 0.5))


def sabit_anahtar(o, f, M):
    """Nesnenin kendi dönüşümünü f karesinde M'ye anahtarla (sabit ara değer)"""
    o.rotation_mode = 'QUATERNION'
    l, q, s = M.decompose()
    o.location, o.rotation_quaternion, o.scale = l, q, s
    for yol in ('location', 'rotation_quaternion', 'scale'): o.keyframe_insert(yol, frame=f)


def sabitle(o):
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves if hasattr(o.animation_data.action, 'fcurves') else []:
            for k in fc.keyframe_points: k.interpolation = 'CONSTANT'
        try:
            from bpy_extras import anim_utils
            cb = anim_utils.action_get_channelbag_for_slot(o.animation_data.action, o.animation_data.action_slot)
            for fc in cb.fcurves:
                for k in fc.keyframe_points: k.interpolation = 'CONSTANT'
        except Exception as e: print('SABIT', e)


def bagla(o, kemik, al, birak, son, W0=None, yerel=None, ucus=None):
    """o: eşya. al karesinde elin o anki yerinde (W0 verilmezse kemik @ yerel) Child Of ile kemiğe bağlanır; birak'a dek
    elle gider; sonra birak karesindeki yerinde sabit kalır (ucus=(p0, v0) verilirse atış yayında uçar)."""
    kare(al); Mg = kemik_w(kemik)
    if W0 is None: W0 = Mg @ Matrix.Translation(yerel)
    c = o.constraints.new('CHILD_OF'); c.name = 'El ' + kemik
    c.target = rig; c.subtarget = kemik
    c.inverse_matrix = Mg.inverted()
    c.influence = 0.0; c.keyframe_insert('influence', frame=1)
    c.influence = 1.0; c.keyframe_insert('influence', frame=al)
    sabit_anahtar(o, 1, W0)
    if birak < son:
        c.influence = 1.0; c.keyframe_insert('influence', frame=birak)
        c.influence = 0.0; c.keyframe_insert('influence', frame=birak + 1)
        kare(birak); Mb = kemik_w(kemik) @ Mg.inverted() @ W0
        if ucus:
            p0, v0 = ucus
            for f in range(birak + 1, son + 1):
                t = (f - birak) / 30; p = p0 + v0 * t + G * t * t / 2
                sabit_anahtar(o, f, Matrix.Translation(p) @ Matrix.Translation(-Mb.translation) @ Mb)
        else:
            sabit_anahtar(o, birak + 1, Mb)
    if al == 1:   # baştan elde: influence 1
        c.influence = 1.0; c.keyframe_insert('influence', frame=1)
    sabitle(o)
    return {'kemik': kemik, 'al': al, 'birak': birak, 'yerel': (Mg.inverted() @ W0)}


# ---- her klibin eşyaları ----
KUR = {}
OLCU = {}


def kol_yap(ad):
    k = bpy.data.collections.new('İnceleme ' + ad); sc.collection.children.link(k); return k


def kur(ad):
    tak(ad); m = meta(ad); son = int(akt(ad).frame_range[1]); K = kol_yap(ad); B = {}
    if ad.startswith('buzdolabi'):
        h = Vector(m['mentese']) / MM
        kok, kap = buzdolabi_modeli(K, ad)
        hw = kap.matrix_world.copy()
        for f in range(1, son + 1):   # kapak menteşede: meta 'kapak' (site rotation.z farkı, − açılır) → dünyada z dönüşü
            a = m['kapak'][f - 1][1]
            Mw = Matrix.Translation(h) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Translation(-h) @ hw
            kap.matrix_basis = (kap.parent.matrix_world @ kap.matrix_parent_inverse).inverted() @ Mw if kap.parent else Mw
            kap.keyframe_insert('location', frame=f); kap.keyframe_insert('rotation_euler', frame=f)
        if 'elma' in m:   # raftaki elma (alınana dek): rig'in elmasının kopyası, alındığı karede gizlenir
            e = bpy.data.objects['Elma g0'].copy(); e.parent = None; e.matrix_parent_inverse = Matrix.Identity(4); K.objects.link(e)
            kare(m['al']); pb = rig.pose.bones['elma']
            e.matrix_world = rig.matrix_world @ pb.matrix
            gor(e, [(1, True), (m['elma']['kemik_adim']['g0'], False)])
    elif ad == 'elma_ye':
        pass   # elma rig'de (elma_g0..g3, elma_kocan kemikleri)
    elif ad == 'elma_firlat':
        kc = bpy.data.objects['Elma koçan'].copy(); kc.parent = None; kc.matrix_parent_inverse = Matrix.Identity(4); K.objects.link(kc)
        c = Vector(m['cop_ornek']) / MM; r = 0.09
        kutu(K, 'Çöp', c.x - r, c.x + r, c.y - r, c.y + r, 0, c.z, (0.35, 0.37, 0.4))
        kare(m['birak']); p0 = (kemik_w('el.R') @ Matrix.Translation(Vector(m['kocan']['el_yerel']) / MM)).translation
        B['Koçan'] = (kc, bagla(kc, 'el.R', 1, m['birak'], son, yerel=Vector(m['kocan']['el_yerel']) / MM,
                                ucus=(p0, Vector(m['hiz']) / MM)), 0.012)
        gor(kc, [(1, False), (m['birak'] + 1, True)])   # bırakana dek rig'in koçanı görünür, sonra uçan kopya
    elif ad == 'yaslan':
        x = m['temas']['duzlem_x'] / MM
        kutu(K, 'Kitaplık', x, x + 0.25, -0.5, 0.4, 0, 1.5, (0.55, 0.42, 0.3))
    elif ad == 'egil_bak':
        z = m['raf']['ust_z'] / MM; on = -m['raf']['on_kenar'] / MM
        kutu(K, 'Raf', -0.45, 0.35, on - 0.2, on, z - 0.02, z, (0.55, 0.42, 0.3))
        kutu(K, 'Raf Gövde', -0.45, 0.35, on - 0.2, on - 0.17, 0, z - 0.02, (0.5, 0.38, 0.27))
        kutu(K, 'Diorama', -0.3, -0.18, on - 0.15, on - 0.05, z, z + 0.1, (0.3, 0.55, 0.4))
    elif ad == 'kumanda':
        km = m['kumanda']
        if 'masa' not in km: KUR[ad] = (K, B, son); return   # v3: sehpa yok (kumanda hep elde)
        p = Vector(km['masa']) / MM; zt = km['masa_ust'] / MM
        kutu(K, 'Sehpa', p.x - 0.15, p.x + 0.15, p.y - 0.15, p.y + 0.15, 0, zt, (0.55, 0.42, 0.3))
        kutu(K, 'TV', -0.5, 0.5, -1.4, -1.36, 0.5, 1.1, (0.1, 0.1, 0.12))
        k = kutu(K, 'Kumanda', -0.012, 0.012, -0.06, 0.04, -0.008, 0.008, (0.15, 0.15, 0.17))
        B['Kumanda'] = (k, bagla(k, 'tutma.R', m['al'], m['birak'], son, yerel=Vector()), 0.0)
        B['Kumanda'][1]['hedef'] = p
    elif ad == 'kutu_al':
        kt = m['kutu']; r = Vector(kt['raf_merkez']) / MM; e = Vector(kt['olcu']) / MM
        kutu(K, 'Kutu Rafı', -0.35, 0.35, r.y - 0.2, r.y + 0.2, r.z - e.z / 2 - 0.02, r.z - e.z / 2, (0.55, 0.42, 0.3))
        kutu(K, 'Kutu Rafı Alt', -0.35, 0.35, r.y - 0.2, r.y + 0.2, 0, r.z - e.z / 2 - 0.02, (0.45, 0.35, 0.25))
        b = kutu(K, 'Kutu', -e.x / 2, e.x / 2, -e.y / 2, e.y / 2, -e.z / 2, e.z / 2, (0.2, 0.45, 0.7))
        kutu(K, 'Kutu Kapak Resmi', -e.x / 2 + 0.01, e.x / 2 - 0.01, -e.y / 2 + 0.01, e.y / 2 - 0.01, e.z / 2, e.z / 2 + 0.002, (0.9, 0.75, 0.2), b)
        B['Kutu'] = (b, bagla(b, 'el.R', m['al'], m['birak'], son, W0=Matrix.Translation(r)), 0.0)
        B['Kutu'][1]['hedef'] = r; B['Kutu'][1]['en'] = e.x
    elif ad == 'tv_armut':
        A = m['armut']; e = Vector(A['eksen_mm']) / MM
        if 'seed' in A:   # v6: sitenin armut({ seed }) yüzeyi birebir (scripts/karakter-armut-geo.py)
            GA = armut_kur(A['seed']); s_ = A.get('olcek', 1.0) / MM
            me = bpy.data.meshes.new('Armut'); me.from_pydata([Vector(v) * s_ + e for v in GA['verts']], [], GA['faces'])
            me.materials.append(malzeme('Armut_m', (0.78, 0.59, 0.18)))
            for pl in me.polygons: pl.use_smooth = True
            K.objects.link(bpy.data.objects.new('Armut', me))
        else:
            o = kure(K, 'Armut', 1.0, (0.78, 0.59, 0.18), (450 / MM, 450 / MM, 540 / MM)); o.location = e + Vector((0, 0.06, 540 / MM * 0.7))
            kutu(K, 'Armut Oturak', e.x - 0.17, e.x + 0.17, e.y - 0.3, e.y - 0.02, 0, (A['oturak_mm'] - A['batma_mm']) / MM, (0.74, 0.55, 0.16))
        kutu(K, 'TV', -0.6, 0.6, -2.25, -2.2, 0.55, 1.2, (0.08, 0.08, 0.1))
        km = m['kumanda']; p = Vector(km['yan']) / MM
        k = kutu(K, 'Kumanda', -0.012, 0.012, -0.06, 0.04, -0.008, 0.008, (0.15, 0.15, 0.17))
        B['Kumanda'] = (k, bagla(k, 'tutma.R', km['tut'][0], km['tut'][1], son, W0=Matrix.Translation(p)), 0.0)
        B['Kumanda'][1]['hedef'] = p
    elif ad.startswith('armut_'):   # v7: ezilen armut (şekil anahtarı 'ez' = armut_ez(t = 1); değeri klibin ezilme_egrisi)
        A = m['armut']; e = Vector(A['eksen_mm']) / MM; GA = armut_kur(A['seed']); E = armut_ez_kur(GA)
        me = bpy.data.meshes.new('Armut ' + ad); me.from_pydata([Vector(v) / MM + e for v in GA['verts']], [], GA['faces'])
        me.materials.append(malzeme('Armut_m', (0.78, 0.59, 0.18)))
        for pl in me.polygons: pl.use_smooth = True
        o = bpy.data.objects.new('Armut ' + ad, me); K.objects.link(o)
        o.shape_key_add(name='Taban'); sk = o.shape_key_add(name='ez', from_mix=False)
        for i, v in enumerate(GA['verts']): sk.data[i].co = Vector(armut_ez(v, E, 1.0)) / MM + e
        for f, t in A['ezilme_egrisi']:
            sk.value = t; sk.keyframe_insert('value', frame=f)
        kutu(K, 'TV', -0.6, 0.6, -2.25, -2.2, 0.55, 1.2, (0.08, 0.08, 0.1))
    elif ad in ('kutu_al_diz', 'diz_cok', 'diz_kalk', 'diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol', 'kutu_rafa_birak'):
        kt = meta('kutu_al_diz')['kutu']; on = kt['raf_on_mm'] / MM; ust = kt['raf_ust_mm'] / MM; ex, ey, ez = (v / MM for v in kt['olcu'])
        # v6: TV altı kısa raf (oda ölçüsü): üst tahta 382–420, göz tabanı 0–38, derinlik 390, gözler 339 mm (ortadaki göz karakterin önünde)
        d = 390 / MM; ic = kt['ic_alt_mm'] / MM; gz = 339 / MM; t_ = 18 / MM
        kutu(K, 'Raf Üst', -0.375, 0.375, -on - d, -on, ust - 38 / MM, ust, (0.55, 0.42, 0.3))
        kutu(K, 'Raf Taban', -0.375, 0.375, -on - d, -on, 0, ic, (0.5, 0.38, 0.27))
        for i, x in enumerate((-gz / 2 - t_, gz / 2)):
            kutu(K, f'Raf Bölme {i}', x, x + t_, -on - d, -on, ic, ust - 38 / MM, (0.5, 0.38, 0.27))
        kutu(K, 'Raf Arka', -0.375, 0.375, -on - d, -on - d + 0.006, ic, ust, (0.45, 0.34, 0.24))
        kutu(K, 'TV', -0.6, 0.6, -on - 0.24, -on - 0.2, 900 / MM, 900 / MM + 0.45, (0.08, 0.08, 0.1))
        if ad == 'kutu_al_diz':
            r = Vector(kt['ic_merkez']) / MM
            b = kutu(K, 'Kutu', -ex / 2, ex / 2, -ey / 2, ey / 2, -ez / 2, ez / 2, (0.2, 0.45, 0.7))
            mt = bpy.data.objects.new('Kutu Menteşe', None); K.objects.link(mt); mt.parent = b; mt.location = (0, -ey / 2, ez / 2)
            kutu(K, 'Kutu Kapak', -ex / 2, ex / 2, 0, ey, 0, 0.004, (0.9, 0.75, 0.2), mt)
            for f, a in m['kutu']['kapak']:
                mt.rotation_euler = (math.radians(a), 0, 0); mt.keyframe_insert('rotation_euler', index=0, frame=f)
            B['Kutu'] = (b, bagla(b, 'el.R', m['al'], m['birak'], son, W0=Matrix.Translation(r)), 0.0)
            B['Kutu'][1]['hedef'] = Vector(kt['ust_merkez']) / MM
        elif ad in ('diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol', 'kutu_rafa_birak'):   # v7: raftaki kutu (kapak açık)
            r = Vector(kt['ust_merkez']) / MM
            b = kutu(K, 'Kutu', -ex / 2, ex / 2, -ey / 2, ey / 2, -ez / 2, ez / 2, (0.2, 0.45, 0.7))
            mt = bpy.data.objects.new('Kutu Menteşe', None); K.objects.link(mt); mt.parent = b; mt.location = (0, -ey / 2, ez / 2)
            kutu(K, 'Kutu Kapak', -ex / 2, ex / 2, 0, ey, 0, 0.004, (0.9, 0.75, 0.2), mt)
            kap = m['kutu']['kapak'] if ad == 'kutu_rafa_birak' else [[1, 90]]
            for f, a in kap:
                mt.rotation_euler = (math.radians(a), 0, 0); mt.keyframe_insert('rotation_euler', index=0, frame=f)
            if ad.startswith('kutu_cevir'):   # kutu merkezinin dikey ekseninde döner (meta kutu.don, derece)
                b.rotation_mode = 'XYZ'; b.location = r
                for f, a in m['kutu']['don']:
                    b.rotation_euler = (0, 0, math.radians(a)); b.keyframe_insert('rotation_euler', index=2, frame=f)
                b.keyframe_insert('location', frame=1)
            elif ad == 'kutu_rafa_birak':
                B['Kutu'] = (b, bagla(b, 'el.R', m['al'], m['birak'], son, W0=Matrix.Translation(r)), 0.0)
                B['Kutu'][1]['hedef'] = Vector(kt['ic_merkez']) / MM
            else:
                b.location = r
    elif ad.startswith('kitap_al'):
        n = m['nesne']; p = Vector(n['raf_nokta']) / MM; on = m['raf_on_mm'] / MM; z = m['raf_mm'] / MM
        kutu(K, 'Kitaplık Raf', -0.45, 0.45, -on - 0.3, -on, z - 0.02, z, (0.55, 0.42, 0.3))
        kutu(K, 'Kitaplık Arka', -0.45, 0.45, -on - 0.32, -on - 0.3, 0, 1.25, (0.5, 0.38, 0.27))
        for i, x in enumerate((-0.2, -0.15, 0.1, 0.14, 0.18)):
            kutu(K, f'Kitap {i}', x - 0.012, x + 0.012, -on - 0.25, -on - 0.05, z, z + 0.14 + 0.01 * i, (0.3 + 0.1 * i, 0.3, 0.5 - 0.06 * i))
        d, w, hh = (v / MM for v in n['olcu'])
        k = kutu(K, 'Kitap', -d / 2, d / 2, -w / 2, w / 2, -hh / 2, hh / 2, (0.85, 0.3, 0.2))
        kutu(K, 'Kitap Kapak', -w / 2, w / 2, -d / 2 - 0.002, -d / 2 - 0.0005, -hh / 2 + 0.01, hh / 2 - 0.01, (0.95, 0.85, 0.3), k)
        B['Kitap'] = (k, bagla(k, 'tutma.R', m['al'], m['koy'], son, W0=Matrix.Translation(p)), 0.0)
        B['Kitap'][1]['hedef'] = p
    elif ad.startswith('bust_'):   # v8.2: gerçek büst modeli (280 mm); al/bırak klibinde meta yolu, tutuşta el.R soketi
        bm = bust_model(); me = bpy.data.meshes.new('Büst ' + ad); me.from_pydata(bm['verts'], [], bm['faces'])
        me.materials.append(malzeme('Büst_m', (0.82, 0.8, 0.76)))
        for pl in me.polygons: pl.use_smooth = True
        b = bpy.data.objects.new('Büst ' + ad, me); K.objects.link(b)
        bu = m['bust']
        if 'raf_nokta' in bu:
            r = Vector(bu['raf_nokta']) / MM; on = m['raf_on_mm'] / MM
            kutu(K, 'Kitaplık Göz', -0.4, 0.4, -on - 0.3, -on, r.z - 0.02, r.z, (0.55, 0.42, 0.3))
            kutu(K, 'Kitaplık Üst Göz', -0.4, 0.4, -on - 0.3, -on, r.z + 380 / MM - 0.02, r.z + 380 / MM, (0.55, 0.42, 0.3))   # gözler 725 / 1105
            kutu(K, 'Kitaplık Arka', -0.4, 0.4, -on - 0.32, -on - 0.3, 0, 1.3, (0.5, 0.38, 0.27))
            for f, p in bu['yol']:
                b.location = Vector(p) / MM; b.keyframe_insert('location', frame=f)
        else:
            kare(1); q = bu['el_yerel_q']
            L = Matrix.Translation(Vector(bu['el_yerel']) / MM) @ Quaternion((q[3], q[0], q[1], q[2])).to_matrix().to_4x4()
            B['Büst'] = (b, bagla(b, 'el.R', 1, son + 1, son, W0=kemik_w('el.R') @ L), 0.0)
    elif ad in ('fare', 'Klavye Tuşlama'):   # v8.2: Blender sahnesinin masası (üst 420), klavye, fare (1,8 kat)
        kutu(K, 'Masa', -0.45, 0.45, -0.62, -0.2, 0.26, 0.28, (0.55, 0.42, 0.3))
        kutu(K, 'Klavye', -0.2, 0.16, -0.405, -0.285, 0.28, 0.2967, (0.2, 0.2, 0.22))
        if ad == 'fare':
            fm = m['fare']; ex, ey, ez = (v / MM / 2 for v in fm['olcu_mm'])
            fo = kutu(K, 'Fare', -ex, ex, -ey, ey, 0, 2 * ez, (0.85, 0.85, 0.88))
            for f, p in fm['yol']:
                fo.location = Vector(p) / MM; fo.keyframe_insert('location', frame=f)
    KUR[ad] = (K, B, son)


def gor(o, adim):
    """görünürlük anahtarları [(kare, görünür)]"""
    for f, v in adim:
        o.hide_render = not v; o.hide_viewport = not v
        o.keyframe_insert('hide_render', frame=f); o.keyframe_insert('hide_viewport', frame=f)


def buzdolabi_modeli(K, ad):
    """oda-esya.glb'den buzdolabı (kapak rafı ürünleriyle). Gotcha: model Z-yukarı dışa aktarılmış, içe aktarıcı Y-yukarı
    sayıp kökü +90° X çevirir: kök X −90° geri döndürülür. Karakter yerelinde ön yüz +y'ye (karaktere) bakar, menteşe +x'te."""
    once = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(KOK, 'assets', 'oda', 'oda-esya.glb'))
    yeni = [o for o in bpy.data.objects if o not in once]
    kok = next(o for o in yeni if o.name.split('.')[0] == 'buzdolabi')
    tut = set()
    def alt(o):
        tut.add(o)
        for c in o.children: alt(c)
    alt(kok)
    ust = kok.parent
    for o in yeni:
        if o not in tut and o != ust: bpy.data.objects.remove(o)
    kok_w = kok.matrix_world.copy()
    if ust: bpy.data.objects.remove(ust)
    for o in tut:
        for c in list(o.users_collection): c.objects.unlink(o)
        K.objects.link(o)
    kok.parent = None
    # glTF düğüm yerelinde: ön yüz −x, menteşe +y, yukarı +z (model mm). İçe aktarılan dünya dönüşünden yalnız ölçek alınır
    kok.matrix_world = Matrix.Rotation(math.radians(-90), 4, 'Z') @ Matrix.Diagonal((1 / MM, 1 / MM, 1 / MM, 1)) @ BZ_DUZELT
    bpy.context.view_layer.update()
    kap = next(o for o in tut if o.name.startswith('buzdolabi_kapak'))
    h = Vector(meta(ad)['mentese']) / MM
    kok.matrix_world = Matrix.Translation(h - kap.matrix_world.translation) @ kok.matrix_world
    bpy.context.view_layer.update()
    for o in tut: o.rotation_mode = 'XYZ'
    # Kapak rafı ürünleri sitede core/oda-ortam.js'te üretiliyor (330 ml kutu Ø 66 × 122, cam su şişesi): vekilleri
    # kapak rafı tabanlarının üstüne, kapağın çocuğu olarak (kapakla döner)
    for t in [o for o in tut if o.name.startswith('kapak_rafi_taban') and o.type == 'MESH']:
        bb = [t.matrix_world @ Vector(c) for c in t.bound_box]
        x0, x1 = min(p.x for p in bb), max(p.x for p in bb); y0, y1 = min(p.y for p in bb), max(p.y for p in bb); z1 = max(p.z for p in bb)
        uzun = 'x' if x1 - x0 > y1 - y0 else 'y'
        for i in range(4):
            u = (i + 0.5) / 4
            c = Vector((x0 + (x1 - x0) * u, (y0 + y1) / 2, z1)) if uzun == 'x' else Vector(((x0 + x1) / 2, y0 + (y1 - y0) * u, z1))
            r, hh = 33 / MM, (122 if i != 3 else 230) / MM
            me = bpy.data.meshes.new('İçecek'); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r, radius2=r, depth=hh)
            bm.to_mesh(me); bm.free()
            me.materials.append(malzeme('İçecek ' + str(i), [(0.92, 0.9, 0.86), (0.85, 0.2, 0.15), (0.2, 0.45, 0.8), (0.7, 0.85, 0.95)][i]))
            o = bpy.data.objects.new('Kapak rafı ürün', me); K.objects.link(o)
            o.matrix_world = Matrix.Translation(c + Vector((0, 0, hh / 2)))
            o.parent = kap; o.matrix_parent_inverse = kap.matrix_world.inverted()
    print('BUZDOLABI', [(o.name, [round(x * MM) for x in o.matrix_world.translation]) for o in tut if o.name.startswith(('buzdolabi_kapak', 'buzdolabi_raf'))],
          'boyut', [round(x * MM) for x in kok_w.to_scale()])
    return kok, kap


BZ_DUZELT = Matrix.Rotation(math.radians(-90), 4, 'X')   # içe aktarıcının Y-yukarı dönüşümünü geri al


# ---- gövde modeli (kol–gövde kesişimi): kazağın gövde köşeleri (göğüs/omurga/kalça ağırlıklı), z dilimlerinde elips ----
kz = bpy.data.objects['kazak']; gi = {g.index: g.name for g in kz.vertex_groups}
RG = rig.data.bones['göğüs'].matrix_local.copy()
gov = [kz.matrix_world @ v.co for v in kz.data.vertices
       if v.groups and gi[max(v.groups, key=lambda g: g.weight).group] in ('göğüs', 'omurga', 'kalça')]
z0, z1 = min(p.z for p in gov), max(p.z for p in gov)
from mathutils.bvhtree import BVHTree
_tv = {v.index for v in kz.data.vertices if v.groups and gi[max(v.groups, key=lambda g: g.weight).group] in ('göğüs', 'omurga', 'kalça')}
_yuz = [tuple(p.vertices) for p in kz.data.polygons if all(i in _tv for i in p.vertices)]
GOVDE = BVHTree.FromPolygons([kz.matrix_world @ v.co for v in kz.data.vertices], _yuz)


def govde_ici(p):
    """p (armatür uzayı, pozlu) kazağın gövde yüzeyinin ne kadar içinde (mm, 0 = dışarıda). Nokta göğüs kemiğinin
    dinlenme çerçevesine geri taşınır (gövde eğilse de dönse de), en yakın gövde yüzüne göre içte mi bakılır"""
    q = RG @ rig.pose.bones['göğüs'].matrix.inverted() @ p
    if not (z0 <= q.z <= z1): return 0.0
    loc, n, _, d = GOVDE.find_nearest(q)
    if loc is None or (q - loc).dot(n) >= 0: return 0.0
    return d * MM


def kol_olc(ad, son):
    """her karede iki önkolun (dirsek → bilek, 7 nokta) gövdeye en derin girişi ve dirsek açısı"""
    tak(ad); en = {'L': 0.0, 'R': 0.0}; kare_say = 0; aci = {'L': 180.0, 'R': 180.0}; ilk = None
    for f in range(1, son + 1):
        kare(f); var = False
        for t in 'LR':
            a = rig.pose.bones['ön_kol.' + t].head; b = rig.pose.bones['el.' + t].head; u = rig.pose.bones['üst_kol.' + t].head
            d = max(govde_ici(a.lerp(b, i / 6)) for i in range(7))
            if f == 1: ilk = (ilk or {}) | {t: d}
            en[t] = max(en[t], d); var = var or d > 0
            aci[t] = min(aci[t], math.degrees((u - a).angle(b - a)))
        kare_say += var
    return {'kesisim_mm': {t: round(v, 1) for t, v in en.items()}, 'kesisim_kare': kare_say,
            'dirsek_min_aci': {t: round(v, 1) for t, v in aci.items()}}


def esya_olc(ad):
    K, B, son = KUR[ad]; goster(ad); tak(ad); out = {}   # gizli koleksiyondaki nesne hesaplanmaz: önce göster
    for n, (o, b, r) in B.items():
        Y = b['yerel']; al, bir = b['al'], min(b['birak'], son); en = 0.0; kop = 0
        for f in range(al, bir + 1):
            kare(f)
            beklenen = kemik_w(b['kemik']) @ Y
            d = (o.matrix_world.translation - beklenen.translation).length * MM
            en = max(en, d); kop += d > 15
        x = {'tut': [al, bir], 'el_esya_sapma_mm': round(en, 2), 'kopma_kare': kop,
             'el_esya_mesafe_mm': round(Y.translation.length * MM, 1)}
        if 'hedef' in b:
            kare(min(b['birak'] + 2, son))
            x['birakma_hedef_mm'] = round((o.matrix_world.translation - b['hedef']).length * MM, 1)
        if ad == 'kutu_al':   # sol el kutunun sol yanında kalıyor mu (kutu sağ ele bağlı): avuç–yan yüz uzaklığının değişimi
            ds = []
            for f in range(al + 2, bir - 1):
                kare(f); q = o.matrix_world.inverted() @ rig.pose.bones['tutma.L'].head
                ds.append(abs(q.x) - b['en'] / 2)
            x['sol_el_yan_mm'] = [round(min(ds) * MM, 1), round(max(ds) * MM, 1)]
        out[n] = x
    return out


def cigne_olc():
    tak('elma_ye'); m = meta('elma_ye'); c = []
    for f in range(1, 62):
        kare(f); pb = rig.pose.bones['çene']
        c.append(math.degrees((rig.data.bones['çene'].matrix_local.to_3x3().inverted() @ pb.matrix.to_3x3()).to_quaternion().angle))
    tepe = [f for f in range(m['cigne'][0] + 2, 61) if c[f - 1] > c[f - 2] and c[f - 1] >= c[f] and c[f - 1] > 2]
    hz = round((len(tepe) - 1) / ((tepe[-1] - tepe[0]) / 30), 2) if len(tepe) > 1 else None
    kare(36); ys = rig.pose.bones['yanak.L'].scale.x
    return {'tepe_kareleri': tepe, 'hz': hz, 'cene_max_derece': round(max(c), 1), 'yanak_olcek_36': round(ys, 3)}


def kameralar(ad):
    kam_yer(ON, (-1.9, -2.5, 1.45), (0, -0.15, 0.42), 1.75); kam_yer(YAN, (-3.2, -0.25, 0.65), (0, -0.25, 0.45), 1.75)
    if ad.startswith('buzdolabi'):   # v6: menteşe kökün ~800 mm solunda: dolap ve kapağın yayı kadrajda
        h = Vector(meta(ad)['mentese']) / MM
        kam_yer(ON, (-1.2, 1.9, 1.9), (h.x * 0.45, h.y * 0.5, 0.4), 2.1); kam_yer(YAN, (h.x * 0.45, 0.2, 3.0), (h.x * 0.45, 0.2, 0.0), 2.1)
        YAN.rotation_euler = (0, 0, 0)
    if ad == 'elma_firlat': kam_yer(YAN, (-4.0, -1.3, 0.8), (0, -1.3, 0.6), 3.6)
    if ad == 'kumanda': kam_yer(YAN, (-3.2, -0.5, 0.75), (0, -0.5, 0.55), 2.2)
    if ad == 'tv_armut' or ad.startswith('armut_'): kam_yer(ON, (-1.6, -2.2, 1.3), (0, 0.15, 0.45), 2.0); kam_yer(YAN, (-3.2, 0.15, 0.55), (0, 0.15, 0.45), 1.9)
    if ad in ('kutu_al_diz', 'diz_cok', 'diz_kalk', 'diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol', 'kutu_rafa_birak'): kam_yer(ON, (-1.4, 1.2, 1.3), (0, -0.25, 0.25), 1.6); kam_yer(YAN, (-3.2, -0.25, 0.42), (0, -0.25, 0.38), 1.5)
    if ad.startswith('kitap_al'): kam_yer(YAN, (-3.2, -0.25, 0.75), (0, -0.25, 0.6), 1.9); kam_yer(ON, (-1.5, -2.4, 1.4), (0, -0.2, 0.6), 1.9)
    if ad.startswith('bust_'): kam_yer(ON, (1.0, 1.5, 1.35), (-0.06, -0.2, 0.62), 1.3); kam_yer(YAN, (-2.6, -0.2, 0.75), (0, -0.2, 0.6), 1.5)
    if ad in ('fare', 'Klavye Tuşlama'): kam_yer(ON, (0.5, -1.6, 1.3), (-0.12, -0.33, 0.33), 0.75); kam_yer(YAN, (-1.9, -0.3, 0.55), (0, -0.3, 0.4), 0.9)
    if ad.startswith('elma_isir') or ad.startswith('elma_tut'): kam_yer(ON, (-0.9, -1.8, 1.2), (0, -0.1, 0.62), 1.0); kam_yer(YAN, (-2.4, -0.1, 0.7), (0, -0.1, 0.6), 1.1)


def goster(ad):
    for a, (K, _, _) in KUR.items():
        K.hide_render = a != ad; K.hide_viewport = a != ad


def ciz(ad, kareler, kams, d):
    os.makedirs(d, exist_ok=True)
    for f in kareler:
        kare(f)
        for cam, ek in kams:
            sc.camera = cam; sc.render.filepath = os.path.join(d, f'{ek}_{f:04d}.png'); bpy.ops.render.render(write_still=True)


def pafta(girdi_grup, etiket, sutun, w, h, yol):
    girdi, filt = [], ''
    j = 0
    for i, (dosyalar, et) in enumerate(zip(girdi_grup, etiket)):
        for x in dosyalar: girdi += ['-i', x]
        ins = ''.join(f'[{j + k}]' for k in range(len(dosyalar)))
        st = f'{ins}hstack=inputs={len(dosyalar)},' if len(dosyalar) > 1 else f'{ins}'
        filt += f"{st}drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{et}':x=10:y=10:fontsize=22[h{i}];"
        j += len(dosyalar)
    n = len(girdi_grup)
    lay = '|'.join(f'{(i % sutun) * w}_{(i // sutun) * h}' for i in range(n))
    filt += ''.join(f'[h{i}]' for i in range(n)) + f'xstack=inputs={n}:layout={lay}:fill=white,scale=1920:-1'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + girdi + ['-filter_complex', filt, '-frames:v', '1', yol], check=True)


for ad in KLIPLER: kur(ad)
sonuc = {'not': 'mm site birimi (Blender birimi × 1500). el_esya_sapma_mm: tutuş boyunca eşyanın, alındığı karede ele göre '
                'yerinden en çok sapması; kopma_kare: sapması 15 mm üstü kare; kesisim_mm: önkol ekseninin (dirsek–bilek) '
                'kazağın gövde elipsinin içine en derin girişi; dirsek_min_aci: üst kol–önkol arası en küçük açı.', 'klip': {}}
for ad in KLIPLER:
    son = KUR[ad][2]
    r = {'kare': son, 'sure_sn': round(son / 30, 2)}
    r.update(kol_olc(ad, son))
    e = esya_olc(ad)
    if e: r['esya'] = e
    sonuc['klip'][ad] = r
    print('OLCUM', ad, json.dumps(r, ensure_ascii=False))
    if PAFTA:
        goster(ad); tak(ad); kameralar(ad)
        n = 12; sec = sorted({round(1 + i * (son - 1) / (n - 1)) for i in range(n)})
        d = os.path.join(CIKTI, '_kare', ad + SONEK)
        ciz(ad, sec, ((ON, 'on'), (YAN, 'yan')), d)
        pafta([[os.path.join(d, f'on_{f:04d}.png'), os.path.join(d, f'yan_{f:04d}.png')] for f in sec], [str(f) for f in sec], 3, 1280, 360,
              os.path.join(CIKTI, f'{ad}{SONEK}_pafta.png'))
if PAFTA and 'elma_ye' in KLIPLER and 'buzdolabi_ac' in KLIPLER:   # yüz yakın planı: ısırık (ağız açık), çiğneme, yanak, göz kırpma; her ısırıkta küçülen elma
    goster('elma_ye'); tak('elma_ye')
    kam_yer(YUZ, (0.45, -1.1, 0.86), (0, -0.12, 0.7), 0.34)   # soldan: sağ el ağzı örtmesin
    sec = [8, 12, 14, 19, 20, 26, 34, 44, 46, 74, 80, 92, 134, 140, 194, 200, 228, 241]
    d = os.path.join(CIKTI, '_kare', 'yuz' + SONEK)
    ciz('elma_ye', sec, ((YUZ, 'yuz'),), d)
    et = {12: '12 agiz acilir', 14: '14 agiz acik', 74: '74 agiz acik', 134: '134 agiz acik', 194: '194 agiz acik', 17: '17', 19: '19 isirik', 20: '20 isirdi 1', 26: '26 yanak dolu', 34: '34 cigneme', 44: '44 goz kirpma', 46: '46 kirpma',
          80: '80 isirik 2', 140: '140 isirik 3', 200: '200 isirik 4 kocan', 228: '228 kirpma', 241: '241 kocan'}
    pafta([[os.path.join(d, f'yuz_{f:04d}.png')] for f in sec], [et.get(f, str(f)) for f in sec], 6, 640, 360,
          os.path.join(CIKTI, f'yuz_yakin{SONEK}_pafta.png'))
    # buzdolabı kapak rafı: kapak açıkken kapağın iç yüzü (raf ürünleri) ve dolabın içi
    goster('buzdolabi_ac'); tak('buzdolabi_ac')
    RAF = kamera('İnc Kam Raf', 1.1)
    h = Vector(meta('buzdolabi_ac')['mentese']) / MM
    RAF2 = kamera('İnc Kam Raf2', 1.0)
    kam_yer(RAF, (-0.95, -0.45, 0.85), (h.x + 0.05, h.y + 0.2, 0.36), 0.95)        # kapağın iç yüzü (kapak rafı)
    kam_yer(RAF2, (-1.1, 0.25, 1.1), (h.x - 0.25, h.y - 0.2, 0.4), 1.15)            # el dolabın içinde (yandan-üstten)
    d = os.path.join(CIKTI, '_kare', 'kapak_rafi' + SONEK)
    ciz('buzdolabi_ac', [34], ((RAF, 'raf'),), d); ciz('buzdolabi_ac', [58, 62], ((RAF2, 'raf'),), d)
    pafta([[os.path.join(d, f'raf_{f:04d}.png')] for f in (34, 58, 62)], ['34 kapak acik - kapak rafi', '58 el rafa girer', '62 elmayi alir'], 3, 640, 360,
          os.path.join(CIKTI, f'buzdolabi_kapak_rafi{SONEK}.png'))
try: sonuc['tutus_v5'] = json.loads(sc['olcum_v5'])
except Exception as e: print('olcum_v5 yok', e)
try: sonuc['v6'] = json.loads(sc['olcum_v6'])
except Exception as e: print('olcum_v6 yok', e)
try: sonuc['v7'] = json.loads(sc['olcum_v7'])
except Exception as e: print('olcum_v7 yok', e)
sonuc['not'] += (' tutus_v5 (v5 ölçüsü, kullanıcı: kollar içeri katlanmasın): tutuş karelerinde el (avuç/elma) ile göğüs merkezi '
                 '(göğüs kemiğinin ortası) arası mm ve dirsek açısı (üst kol–önkol; 180 düz); ölçüt el–göğüs ≥ 180 mm, dirsek 70–130°.')
json.dump(sonuc, open(os.path.join(CIKTI, f'olcum{SONEK}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# İnceleme dosyası: rig buzdolabi_ac'te, yalnız onun eşyaları görünür (başka klip: rig'in aksiyonunu değiştir, aynı adlı
# "İnceleme <klip>" koleksiyonunu aç). Kameralar ve zemin "İnceleme Ortak"ta.
goster(KLIPLER[0]); tak(KLIPLER[0]); sc.frame_start, sc.frame_end = 1, int(akt(KLIPLER[0]).frame_range[1]); sc.frame_set(1)
sc.camera = ON
bpy.ops.wm.save_as_mainfile(filepath=KAYDET, copy=True)
print('KAYDEDILDI', KAYDET)
