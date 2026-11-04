# Karakter kliplerinin 360p önizlemesi (Workbench, GPU Cycles değil): her klip için ön + yan görünüm yan yana mp4 ve
# kontak paftası; klibin site_meta'sındaki ölçülerle vekil nesneler (buzdolabı + menteşeli kapak, elma, kitaplık yüzü,
# raf + kutu, kumanda + TV, koltuk) kurulur: meta yanlışsa önizlemede görünür.
# Kullanım (depo kökünden; kaynak dosya kaydedilmez):
#   blender -b kaynak/karakter/bizzikolosko_site.blend --python scripts/karakter-klip-onizleme.py -- <çıktı klasörü> [klip ...] [--kare 1,20,40]
#   klip: sitedeki ad (buzdolabi_ac, otur ...); verilmezse yeni eylem klipleri + otur/otur2/kalk.
#   --kare: yalnız bu karelerin tek resmini yazar (<çıktı>/<klip>_kNNN.png), video yok (hata ayıklama).
# Çıktı: <çıktı>/<klip>_onizleme.mp4 (1280×360, 30 fps, ön | yan), <klip>_pafta.png; ara kareler <çıktı>/_kare/ (sonda silinmez,
# tekrar çalıştırmada üzerine yazılır). ffmpeg PATH'te olmalı.
import bpy, json, math, os, subprocess, sys, shutil
from mathutils import Vector, Matrix

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
KARE = None
SONEK = ''    # --sonek _v2: çıktı adlarının sonuna eklenir (klip_v2_onizleme.mp4)
if '--sonek' in arg:
    i = arg.index('--sonek'); SONEK = arg[i + 1]; del arg[i:i + 2]
ONCE = None   # --once <glb>: oturma kliplerini o GLB'nin meta'sıyla (düzeltmeden önceki) çizer, adın sonuna _once
if '--once' in arg:
    i = arg.index('--once'); ONCE = arg[i + 1]; del arg[i:i + 2]
if '--kare' in arg:
    i = arg.index('--kare'); KARE = [int(x) for x in arg[i + 1].split(',')]; del arg[i:i + 2]
CIKTI = os.path.abspath(arg[0]); ISTEK = arg[1:]
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sc = bpy.context.scene
rig = bpy.data.objects['bizzikoloşko_rig']
MM = 1500.0
ADLAR = {'buzdolabi_ac': 'buzdolabi_ac', 'buzdolabi_bos': 'buzdolabi_bos', 'elma_ye': 'elma_ye', 'elma_firlat': 'elma_firlat',
         'yaslan': 'yaslan', 'egil_bak': 'egil_bak', 'kumanda': 'kumanda', 'kutu_al': 'kutu_al',
         'otur': 'Koltuğa Oturma', 'otur2': 'Oturmaya Geçiş', 'kalk': 'Koltuktan Kalkma'}
ISTEK = ISTEK or list(ADLAR)
os.makedirs(os.path.join(CIKTI, '_kare'), exist_ok=True)


def anahtar(k, f):
    if k is None: return 0
    if isinstance(k, (int, float)): return k
    if f <= k[0][0]: return k[0][1]
    for (f0, v0), (f1, v1) in zip(k, k[1:]):
        if f <= f1:
            t = max(0.0, min(1.0, (f - f0) / ((f1 - f0) or 1)))
            return v0 + (v1 - v0) * t * t * (3 - 2 * t)
    return k[-1][1]


# ---- sahne: Workbench, iki ortografik kamera, sahnede yalnız karakter + vekiller ----
VEKIL = bpy.data.collections.new('Onizleme Vekil'); sc.collection.children.link(VEKIL)
for o in sc.objects:
    if o.type in {'MESH', 'CURVE', 'EMPTY', 'LIGHT', 'CAMERA'} and o != rig and o.parent != rig:
        o.hide_render = True
for o in rig.children:
    o.hide_render = o.name in {'Sandviç', 'allık.L', 'allık.R', 'gözyaşı.L', 'gözyaşı.R'}
for c in bpy.data.collections:
    if c.name == 'Site Koltuk': c.hide_render = True
try: sc.render.engine = 'BLENDER_WORKBENCH'
except TypeError as e: print('MOTOR', e)
sh = sc.display.shading
sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_shadows = True; sh.show_cavity = False
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 640, 360, 100
sc.render.fps = 30
sc.render.image_settings.file_format = 'PNG'
sc.render.film_transparent = False
w = sc.world or bpy.data.worlds.new('W'); sc.world = w
w.color = (0.93, 0.92, 0.9)


def kamera(ad, yer, hedef, olcek):
    c = bpy.data.cameras.new(ad); c.type = 'ORTHO'; c.ortho_scale = olcek
    o = bpy.data.objects.new(ad, c); VEKIL.objects.link(o)
    o.location = yer
    o.rotation_euler = (Vector(hedef) - Vector(yer)).to_track_quat('-Z', 'Y').to_euler()
    return o


ON = kamera('Kam On', (-1.9, -2.5, 1.45), (0, -0.15, 0.42), 1.75)
YAN = kamera('Kam Yan', (-3.2, -0.25, 0.65), (0, -0.25, 0.45), 1.75)


def malzeme(ad, renk):
    m = bpy.data.materials.get(ad) or bpy.data.materials.new(ad)
    m.diffuse_color = (*renk, 1)
    return m


def kutu(ad, x0, x1, y0, y1, z0, z1, renk, ust=None):
    me = bpy.data.meshes.new(ad)
    v = [(x, y, z) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me.from_pydata(v, [], f); me.materials.append(malzeme(ad + '_m', renk))
    o = bpy.data.objects.new(ad, me); VEKIL.objects.link(o)
    if ust: o.parent = ust
    return o


def kure(ad, r, renk):
    me = bpy.data.meshes.new(ad)
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r); bm.to_mesh(me); bm.free()
    me.materials.append(malzeme(ad + '_m', renk))
    o = bpy.data.objects.new(ad, me); VEKIL.objects.link(o)
    return o


def zemin():
    kutu('Zemin', -1.6, 1.6, -1.6, 1.2, -0.01, 0, (0.78, 0.76, 0.72))
    # 10 cm ızgara çizgileri (kayma göz kararı görünsün)
    for i in range(-10, 11):
        kutu(f'Cizgi x{i}', i * 0.1 - 0.0015, i * 0.1 + 0.0015, -1.0, 1.0, 0, 0.0008, (0.55, 0.53, 0.5))
        kutu(f'Cizgi y{i}', -1.0, 1.0, i * 0.1 - 0.0015, i * 0.1 + 0.0015, 0, 0.0008, (0.55, 0.53, 0.5))


def temizle():
    for o in list(VEKIL.objects):
        if o.type == 'MESH' and not o.name.startswith(('Zemin', 'Cizgi')):
            bpy.data.objects.remove(o, do_unlink=True)


def bagla(o, kemik):
    o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = kemik
    o.matrix_parent_inverse = Matrix.Identity(4)


def kemik_mat(kemik):
    pb = rig.pose.bones[kemik]
    return rig.matrix_world @ pb.matrix


def yerel_konum(o, kemik, mm_v, q=None):
    """Kemik çerçevesinde (kemiğin başı, mm) nesneyi her karede elle yerleştirmek için dünya matrisi"""
    M = kemik_mat(kemik)
    R = Matrix.Identity(4) if q is None else __import__('mathutils').Quaternion((q[3], q[0], q[1], q[2])).to_matrix().to_4x4()
    return M @ Matrix.Translation(Vector(mm_v) / MM) @ R


def aksiyon(ad):
    return bpy.data.actions['Hareket - ' + ADLAR[ad]]


def meta_oku(ad):
    a = aksiyon(ad)
    if ONCE and ad in GLB_META: return GLB_META[ad]
    if a.get('site_meta'): return json.loads(a['site_meta'])
    return {}


GLB_META = {}
try:
    import struct
    b = open(ONCE or os.path.join(KOK, 'assets', 'oda', 'karakter.glb'), 'rb').read()
    j = json.loads(b[20:20 + struct.unpack_from('<I', b, 12)[0]])
    GLB_META = json.loads(j['scenes'][0]['extras']['karakter_meta'])['klip']
except Exception as e:
    print('GLB meta okunamadı', e)


def koltuk_kur_vekil():
    """Site Koltuk (oda-esya.glb'den, karakter-klipler.py koltuk_al) önizlemeye açılır"""
    k = bpy.data.objects.get('Site Koltuk')
    if not k: return None
    for c in bpy.data.collections:
        if c.name == 'Site Koltuk': c.hide_render = False
    def ac(o):
        o.hide_render = False
        for c in o.children: ac(c)
    ac(k)
    return k


def kamera_yer(o, yer, hedef):
    o.location = yer
    o.rotation_euler = (Vector(hedef) - Vector(yer)).to_track_quat('-Z', 'Y').to_euler()


def kur(ad):
    """Vekilleri kurar; her kare çağrılacak güncelleme işlevini döndürür"""
    temizle()
    rig.location = (0, 0, 0)
    for c in bpy.data.collections:
        if c.name == 'Site Koltuk': c.hide_render = True
    kamera_yer(ON, (-1.9, -2.5, 1.45), (0, -0.15, 0.42))
    YAN.data.ortho_scale = 1.75; kamera_yer(YAN, (-3.2, -0.25, 0.65), (0, -0.25, 0.45))
    m = meta_oku(ad); gm = GLB_META.get(ad, {})
    if ad.startswith('buzdolabi'):
        kamera_yer(ON, (-1.3, 1.9, 1.75), (0.0, -0.3, 0.4))   # sağ arkadan omuz üstü: kapak ve iç görünsün
        h = Vector(m['mentese']) / MM; en = m['kapak_en'] / MM; der = 550 / MM; boy = 850 / MM
        kutu('Buzdolabi', h.x - en, h.x, h.y - der, h.y, 0, boy, (0.82, 0.81, 0.78))
        kutu('Raf', h.x - en + 0.02, h.x - 0.02, h.y - der + 0.02, h.y + 0.0, 440 / MM - 0.006, 440 / MM, (0.95, 0.95, 0.93))
        kap = bpy.data.objects.new('Kapak', None); VEKIL.objects.link(kap); kap.location = h
        kutu('Kapak Yuz', -en, 0, 0, 16 / MM, 0.005, boy - 0.005, (0.88, 0.87, 0.84), kap)
        kutu('Kapak Kol', -en + 0.02, -en + 0.034, 16 / MM, 16 / MM + 0.02, 270 / MM, 490 / MM, (0.3, 0.3, 0.32), kap)
        elma = None
        if 'elma' in m:
            elma = kure('Elma', 0.025, (0.72, 0.1, 0.08)); elma.location = Vector(m['elma']['nokta']) / MM
        def g(f):
            kap.rotation_euler = (0, 0, anahtar(m['kapak'], f))
            if elma:
                if f >= m['al']: elma.matrix_world = yerel_konum(elma, 'el.R', m['elma']['el_yerel'])
                else: elma.matrix_world = Matrix.Translation(Vector(m['elma']['nokta']) / MM)
        return g
    if ad in ('elma_ye', 'elma_firlat'):
        elma = kure('Elma', 0.025, (0.72, 0.1, 0.08))
        G = Vector((0, 0, -9810 / MM))
        if ad == 'elma_firlat':
            YAN.data.ortho_scale = 3.6; kamera_yer(YAN, (-4.0, -1.3, 0.8), (0, -1.3, 0.6))
            elma.scale = (0.4, 0.4, 0.85)   # koçan (meta kocan: ~30 × 62 mm)
            # Örnek çöp kovası (meta cop_ornek: ağzın merkezi) ve atış yayı (bırakma noktasından hiz ile, ağza inene dek)
            c = Vector(m.get('cop_ornek', (0, -1200, 420))) / MM; r = 0.09
            kutu('Cop', c.x - r, c.x + r, c.y - r, c.y + r, 0, c.z, (0.35, 0.37, 0.4))
            p0, v0 = Vector(m['el']) / MM, Vector(m['hiz']) / MM
            t = 0.0
            while True:
                p = p0 + v0 * t + G * t * t / 2
                if p.z < c.z and t > 0.1: break
                n = kure('Yay', 0.007, (0.9, 0.45, 0.1)); n.location = p
                t += 1 / 60
        def g(f):
            if ad == 'elma_firlat' and f > m['birak']:
                t = (f - m['birak']) / 30
                p = Vector(m['el']) / MM + Vector(m['hiz']) / MM * t + G * t * t / 2
                elma.matrix_world = Matrix.Translation(p)
            else:
                elma.matrix_world = yerel_konum(elma, 'el.R', (m.get('elma') or m['kocan'])['el_yerel'])
            if ad == 'elma_firlat': elma.scale = (0.4, 0.4, 0.85)
            if ad == 'elma_ye':
                n = 1 if f >= m['isirik'][0] else 0
                s = m['olcek'][n]
                elma.scale = (s, s, s)
        return g
    if ad == 'yaslan':
        x = m['temas']['duzlem_x'] / MM
        kutu('Kitaplik', x, x + 0.25, -0.5, 0.4, 0, 1.5, (0.55, 0.42, 0.3))
        return lambda f: None
    if ad == 'egil_bak':
        if 'raf' in m:   # v3: önünde rafa yaslanır (raf üstü ve ön kenarı meta'dan), arkasında pano/duvar
            z = m['raf']['ust_z'] / MM; on = -m['raf']['on_kenar'] / MM
            kutu('Raf', -0.45, 0.35, on - 0.2, on, z - 0.02, z, (0.55, 0.42, 0.3))
            kutu('Raf Govde', -0.45, 0.35, on - 0.2, on - 0.17, 0, z - 0.02, (0.5, 0.38, 0.27))
            kutu('Diorama', -0.3, -0.18, on - 0.15, on - 0.05, z, z + 0.1, (0.3, 0.55, 0.4))
        else:
            gz = Vector(m['goz']) / MM
            kutu('Pano', -0.3, 0.3, gz.y - 0.3, gz.y - 0.28, 0.25, 0.75, (0.6, 0.6, 0.62))
        return lambda f: None
    if ad == 'kumanda':
        k = kutu('Kumanda', -0.012, 0.012, -0.06, 0.04, -0.008, 0.008, (0.15, 0.15, 0.17))
        kutu('TV', -0.5, 0.5, -1.4, -1.36, 0.5, 1.1, (0.1, 0.1, 0.12))
        def g(f):
            k.matrix_world = kemik_mat('tutma.R')
        return g
    if ad == 'kutu_al':
        kt = m['kutu']; r = Vector(kt['raf_merkez']) / MM; e = Vector(kt['olcu']) / MM
        kutu('Raf', -0.35, 0.35, r.y - 0.2, r.y + 0.2, r.z - e.z / 2 - 0.02, r.z - e.z / 2, (0.55, 0.42, 0.3))
        kutu('Raf Alt', -0.35, 0.35, r.y - 0.2, r.y + 0.2, 0, r.z - e.z / 2 - 0.02, (0.45, 0.35, 0.25))
        b = kutu('Kutu', -e.x / 2, e.x / 2, -e.y / 2, e.y / 2, -e.z / 2, e.z / 2, (0.2, 0.45, 0.7))
        kutu('Kapak Resmi', -e.x / 2 + 0.01, e.x / 2 - 0.01, -e.y / 2 + 0.01, e.y / 2 - 0.01, e.z / 2, e.z / 2 + 0.002, (0.9, 0.75, 0.2), b)
        def g(f):
            if m['al'] <= f <= m['birak']: b.matrix_world = yerel_konum(b, 'el.R', kt['el_yerel'], kt['el_yerel_q'])
            else: b.matrix_world = Matrix.Translation(r)
        return g
    if ad in ('otur', 'otur2', 'kalk'):
        k = koltuk_kur_vekil()
        mk = m or gm
        if not k: return lambda f: None
        ust = bpy.data.objects['koltuk_ust']; sirt = bpy.data.objects['koltuk_sirt']
        for o in (k, ust, sirt):
            if o.animation_data: o.animation_data_clear()
        ust.location.y = 0
        from mathutils import Quaternion
        sirt.rotation_mode = 'QUATERNION'; sirt.rotation_quaternion = Quaternion((1, 0, 0), 0.14)
        def g(f):
            z = anahtar(mk.get('z', 0), f) / MM; il = anahtar(mk.get('ileri', 0), f) / MM
            ko = anahtar(mk.get('koltuk'), f) / MM
            # Sitedeki gibi: kök yerinde (sahne orijini), gövde (0, −ileri, z) kadar taşınır, koltuk kökün 'koltuk' arkasında
            rig.location = (0, -il, z)
            k.location = (0, ko, 0)
            k.rotation_euler = (-math.pi / 2, 0, math.pi)
        return g
    return lambda f: None


zemin()
ozet = {}
for ad in ISTEK:
    act = aksiyon(ad)
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    son = int(act.frame_range[1])
    g = kur(ad)
    kareler = KARE or list(range(1, son + 1))
    d = os.path.join(CIKTI, '_kare', ad + ('_once' if ONCE else '')); os.makedirs(d, exist_ok=True)
    for f in kareler:
        sc.frame_set(f); g(f); bpy.context.view_layer.update()
        for cam, ek in ((ON, 'on'), (YAN, 'yan')):
            sc.camera = cam
            sc.render.filepath = os.path.join(d, f'{ek}_{f:04d}.png')
            bpy.ops.render.render(write_still=True)
    if KARE and SONEK:
        pass   # --kare + --sonek: video yok, yalnız bu karelerden pafta (aşağıda)
    elif KARE:
        for f in kareler:
            yol = os.path.join(CIKTI, f'{ad}_k{f:03d}.png')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(d, f'on_{f:04d}.png'), '-i', os.path.join(d, f'yan_{f:04d}.png'),
                            '-filter_complex', 'hstack', yol], check=True)
        continue
    ek = ('_once' if ONCE else '') + SONEK
    mp4 = os.path.join(CIKTI, f'{ad}{ek}_onizleme.mp4')
    if not KARE:
        yazi = f"drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{ad}{ek}  %{{frame_num}}':start_number=1:x=10:y=10:fontsize=18:fontcolor=black"
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', os.path.join(d, 'on_%04d.png'), '-framerate', '30',
                        '-i', os.path.join(d, 'yan_%04d.png'), '-filter_complex', f'[0][1]hstack,{yazi}', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                        '-crf', '20', mp4], check=True)
    # Pafta: 12 eşit aralıklı kare (ön | yan), 3 sütun
    n = 12; adim = max(1, (son - 1) / (n - 1))
    sec = KARE or sorted({round(1 + i * adim) for i in range(n)})
    girdi = []
    for f in sec: girdi += ['-i', os.path.join(d, f'on_{f:04d}.png'), '-i', os.path.join(d, f'yan_{f:04d}.png')]
    filt = ''.join(f'[{2*i}][{2*i+1}]hstack,drawtext=fontfile=\'C\\:/Windows/Fonts/arial.ttf\':text=\'{f}\':x=10:y=10:fontsize=22[h{i}];' for i, f in enumerate(sec))
    filt += ''.join(f'[h{i}]' for i in range(len(sec))) + f'xstack=inputs={len(sec)}:layout=' + '|'.join(f'{(i % 3)}*1280_{(i // 3)}*360'.replace('*', '*') for i in range(len(sec)))
    lay = '|'.join(f'{(i % 3) * 1280}_{(i // 3) * 360}' for i in range(len(sec)))
    filt = filt.split('xstack')[0] + f'xstack=inputs={len(sec)}:layout={lay},scale=1920:-1'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + girdi + ['-filter_complex', filt, '-frames:v', '1', os.path.join(CIKTI, f'{ad}{ek}_pafta.png')], check=True)
    ozet[ad] = {'kare': son, 'mp4': mp4}
    print('ONIZLEME', ad, son, mp4)
print('OZET', json.dumps(ozet, ensure_ascii=False))
