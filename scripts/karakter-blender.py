# Oda karakteri (bizzikoloşko) → web GLB: assets/oda/karakter.glb (core/oda-karakter.js okur).
# Kullanım (masaüstü Blender, arka planda; açık pencere donmasın diye canlı oturumda çalıştırma):
#   blender -b --factory-startup --python scripts/karakter-blender.py -- <karakter.blend> assets/oda/karakter.glb [--adim 2] [--dracosuz]
# Kaynak dosya kaydedilmez. Rig ölçeği 1,5 (sitede ~1,4 m), malzemeler düz renk ("İkinci Ton" grubu çözülür), yüksek
# poli parçalar azaltılır (~74 bin üçgen), klipler NLA izleri olarak (iz adı = klip adı, KLIP) yazılır; kare aralıkları
# ve ölçüler (merdiven, ip, koltuk) sahnenin extras'ında "karakter_meta" (JSON). Dışa aktarımdan sonra hiçbir klipte
# dinlenme pozundan ayrılmayan kemik kanalları atılır (budama). Draco: Blender'ın Draco kütüphanesi varsa ağlar sıkışır
# (Python modülü bpy'de yoktur; o zaman çıktı ayrıca sıkıştırılır).
import bpy, json, sys, math
from mathutils import Vector

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
GIRDI, CIKTI = arg[0], arg[1]
ADIM = int(arg[arg.index('--adim') + 1]) if '--adim' in arg else 2
DRACO = '--dracosuz' not in arg

bpy.ops.wm.open_mainfile(filepath=GIRDI)
sc = bpy.context.scene
rig = bpy.data.objects['bizzikoloşko_rig']
OLCEK = 1.5

HARIC = {'Sandviç', 'allık.L', 'allık.R', 'gözyaşı.L', 'gözyaşı.R'}
SS = {'saç sakal': 1, 'kafa': 1, 'sol kulak': 0, 'sağ kulak': 0, 'kulaklık': 0, 'kazak': 1, 'pantolon': 1, 'sol avuç': 1,
      'sağ avuç': 1, 'ağız': 0, 'dil': 0, 'sol ayak': 1, 'sağ ayak': 1, 'sol başparmak': 1, 'sağ başparmak': 1}
DEC = {'sol göz': 0.06, 'sağ göz': 0.06, 'saç sakal': 0.45, 'kafa': 0.7, 'sol kaş': 0.6, 'sağ kaş': 0.6, 'burun': 0.6}
KLIP = {'merdiven': 'Merdivenden İnme', 'ip': 'İpten İnme', 'yuru': 'Yürüme', 'dur': 'Durma', 'dans_twist': 'Dans Twist',
        'dans_tavuk': 'Dans Tavuk', 'dans_lahana': 'Dans Lahana', 'dans_runningman': 'Dans Runningman',
        'otur': 'Koltuğa Oturma', 'otur2': 'Oturmaya Geçiş', 'kalk': 'Koltuktan Kalkma', 'uzan': 'Klavyeye Uzanma', 'cekil': 'Klavyeden Yaslanma',
        'yaz': 'Klavye Tuşlama', 'kafa_salla': 'Tuşlarken Müziğe Kafa Sallama', 'muzik': 'Taburede Müzik Dinleme',
        'sevin': 'Bilgisayar Başında Sevinme', 'inanamama': 'Ekrana İnanamama', 'bekle': 'Masada Bekleme'}
# Sonradan eklenecek klipler: dosyada varsa alınır (yoksa core/oda-karakter.js yer tutucuyla oynar)
EK = {'sirt_ac': 'Sırt Açma', 'kaydir': 'Koltukla Kayma'}
for k, a in EK.items():
    if bpy.data.actions.get('Hareket - ' + a):
        KLIP[k] = a

# ---- ölçüler (Blender biriminde ölçülür, sitenin mm'sine çevrilir: × 1,5 × 1000) ----
mm = lambda v: round(v * OLCEK * 1000, 1)
mer = bpy.data.objects['Merdiven'].data.vertices
mer_y = sum(v.co.y for v in mer) / len(mer)
mer_x = max(abs(v.co.x) for v in mer)
# Basamak merkezleri: basamak silindirlerinin uç köşelerinin z kümeleri
zs = sorted(v.co.z for v in mer if abs(v.co.x) < 0.171)  # basamak uçları (raylar |x| ≥ 0,173)
kume, basamak = [], []
for z in zs:
    if kume and z - kume[-1] > 0.02:
        basamak.append(sum(kume) / len(kume)); kume = []
    kume.append(z)
if kume: basamak.append(sum(kume) / len(kume))
# Raylar boyunca da köşe var (kümeler birleşiyor): basamaklar ilk ölçümden (z 0,071–0,087 kümesi, 0,083 arayla)
basamak, aralik = [0.079], 0.083
ip = bpy.data.objects['İp']
ip_nok = [p.co for s in ip.data.splines for p in (s.bezier_points if s.type == 'BEZIER' else s.points)]
ip_y = sum(p[1] for p in ip_nok) / len(ip_nok); ip_x = sum(p[0] for p in ip_nok) / len(ip_nok)
kol = bpy.data.objects['Koltuk'].data.vertices
taban = [v.co for v in kol if v.co.z < 0.03]
c0 = (min(v.y for v in taban) + max(v.y for v in taban)) / 2  # koltuk ayağının ortası (koltuk_geri = 0'da)
print('ÖLÇÜ merdiven y', round(mer_y, 4), 'x', round(mer_x, 4), 'basamak', [round(b, 3) for b in basamak[:5]], 'aralık', round(aralik, 4),
      '| ip', round(ip_x, 4), round(ip_y, 4), '| koltuk c0', round(c0, 4))

MASA_Z = 335
kg = lambda g: mm(g + c0)  # koltuk_geri → koltuk merkezinin kökün arkasındaki mm'si
MASA = {'z': MASA_Z, 'koltuk': kg(0)}
meta = {
    'fps': sc.render.fps, 'kalca': 'kalça', 'kafa': 'kafa',
    'merdiven': {'mesafe': mm(-mer_y), 'en': mm(2 * (mer_x - 0.012)), 'ilk': mm(basamak[0]), 'aralik': mm(aralik)},
    'ip': {'mesafe': mm(-ip_y), 'yan': mm(-ip_x)},
    'klip': {
        'merdiven': {'dongu': [1, 49], 'son': [49, 144]},
        'ip': {'dongu': [1, 73], 'son': [73, 252]},
        'yuru': {'tekrar': True}, 'dur': {'tekrar': True},
        # Oturma: kalça 57–81. karede iner (site koltuğu yüksek: kök aynı anda koltuk yüksekliğine kalkar, ayaklar
        # sarkar); 134–164 arası koltuk öne kayar
        'otur': {'z': [[55, 0], [81, MASA_Z]], 'koltuk': [[1, kg(0.128)], [134, kg(0.128)], [164, kg(0)]], 'inis': 81},
        # Kalkma: önce koltuk geri (1–30), kalça 61–89. karede kalkar
        'kalk': {'z': [[61, MASA_Z], [89, 0]], 'koltuk': [[1, kg(0)], [30, kg(0.128)]]},
        # Koltukta Yaslanma alınmaz: eller başın arkasında, sitedeki yüksek koltuk sırtının içinden çıkıyor. Kenarda
        # beklerken taburede müzik dinleme (kalça 0,195, eller önde) aynı koltuk yüksekliğinde oturur
        'yaz': {'tekrar': True, **MASA}, 'muzik': {'tekrar': True, **MASA}, 'bekle': {'tekrar': True, **MASA},
        'kafa_salla': MASA, 'sevin': MASA, 'inanamama': MASA, 'uzan': MASA, 'cekil': MASA,
        'kaydir': {'tekrar': True, **MASA},
    },
}

# İkinci oturma (Oturmaya Geçiş, Mixamo "Stand To Sit"; ziyaret başına otur ile rastgele seçilir): tabureye geri oturur,
# koltuk yerinde durur. Klibin başında kalça kökün ~22 cm önünde (Durma'da ~2,5 cm): gövde 'ileri' kadar geri kaydırılır
# (geçişte sıçramasın), klip bitince site bu kaymayı köke aktarır. Kalça inişi ve oturuşun koltuk mesafesi ölçülür:
# son pozda koltuk kalçaya göre yazma pozundaki yerinde, kök kalçanın son yüksekliğini yazma pozuna eşler.
def kalca(ad, f):
    act = bpy.data.actions[ad]
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    sc.frame_set(f)
    h = rig.pose.bones['kalça'].head
    return h.y, h.z
O2 = 'Hareket - Oturmaya Geçiş'
o2_son = int(bpy.data.actions[O2].frame_range[1])
o2 = [kalca(O2, f) for f in range(1, o2_son + 1)]
yd, _ = kalca('Hareket - Durma', 1)
yy, zy = kalca('Hareket - Klavye Tuşlama', 1)
z0, zmin = o2[0][1], min(z for _, z in o2)
bas = next(i + 1 for i, (_, z) in enumerate(o2) if z < z0 - 0.03 * (z0 - zmin))
inis = min(range(1, o2_son + 1), key=lambda f: o2[f - 1][1])
ileri = mm(o2[0][0] - yd)                                      # gövde kayması (ileri +): başta kalça Durma'daki yerinde
meta['klip']['otur2'] = {
    'z': [[bas, 0], [inis, round(MASA_Z + mm(zy - o2[-1][1]), 1)]],
    'koltuk': round(kg(0) + mm(o2[-1][0] - yy) - ileri, 1),   # koltuk merkezi kökün arkasında (taburenin yeri, sabit)
    'ileri': ileri, 'inis': inis,
}
print('OTUR2', meta['klip']['otur2'])

# Sitenin koltuğuna göre kurulan kliplerin bilgisi aksiyonun kendisinde ("site_meta": sırt, kök kayması, tutma, dönüş)
for k, a in KLIP.items():
    act = bpy.data.actions['Hareket - ' + a]
    if act.get('site_meta'):
        meta['klip'][k] = {**meta['klip'].get(k, {}), **json.loads(act['site_meta'])}

# ---- nesneler ----
karakter = [o for o in rig.children if o.type == 'MESH' and o.name not in HARIC]
for o in karakter:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            lv = SS.get(o.name, 0 if 'parmak' in o.name and 'baş' not in o.name else m.levels)
            m.levels = lv
            m.render_levels = lv
    if o.name in DEC:
        d = o.modifiers.new('Web Azalt', 'DECIMATE')
        d.decimate_type = 'COLLAPSE'
        d.ratio = DEC[o.name]

# ---- malzemeler: "İkinci Ton" grubu düz renge (dokusuz, öznitelik yok) ----
gorulen = set()
for o in karakter:
    for s in o.material_slots:
        m = s.material
        if not m or m.name in gorulen or not m.use_nodes: continue
        gorulen.add(m.name)
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        grup = next((n for n in nt.nodes if n.type == 'GROUP' and n.node_tree and n.node_tree.name == 'İkinci Ton'), None)
        if bsdf and grup:
            r, t, k = grup.inputs['Renk'].default_value, grup.inputs['Ton'].default_value, grup.inputs['Miktar'].default_value
            renk = [r[i] * (1 - 0.12 * k) + t[i] * 0.12 * k for i in range(3)] + [1.0]
            for l in list(bsdf.inputs['Base Color'].links): nt.links.remove(l)
            bsdf.inputs['Base Color'].default_value = renk
            nt.nodes.remove(grup)
        for n in [n for n in nt.nodes if n.type == 'ATTRIBUTE']: nt.nodes.remove(n)

# ---- rig: ölçek ve klipler (NLA izleri) ----
rig.scale = (OLCEK, OLCEK, OLCEK)
ad = rig.animation_data or rig.animation_data_create()
for t in list(ad.nla_tracks): ad.nla_tracks.remove(t)
ad.action = None
for k, a in KLIP.items():
    act = bpy.data.actions['Hareket - ' + a]
    tr = ad.nla_tracks.new()
    tr.name = k
    st = tr.strips.new(k, int(act.frame_range[0]), act)
    if hasattr(st, 'action_slot') and act.slots: st.action_slot = act.slots[0]
    st.extrapolation = 'NOTHING'
sc.frame_set(1)
sc['karakter_meta'] = json.dumps(meta, ensure_ascii=False)

# ---- dışa aktarım sonrası budama (yalnız Python) ----
# Hiçbir klipte dinlenme pozundan ayrılmayan kemik kanalları atılır, kullanılmayan veri sıkıştırılır. (Dışa aktarıcının
# "keep_anim_armature=False" seçeneği klip başına sabit kanalları atar: dinlenmede olmayan sabitler (kulaklık kemiği)
# ve geçişte önceki klipten kalan pozlar bozulur; bu yüzden kullanılmaz.)
import struct
def budama(yol):
    b = open(yol, 'rb').read()
    jl = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    bl = struct.unpack_from('<I', b, o)[0]
    ikili = b[o + 8:o + 8 + bl]
    acc, bv, dug = j['accessors'], j['bufferViews'], j['nodes']
    BOY = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
    def oku(ai):
        a = acc[ai]; v = bv[a['bufferView']]; n = BOY[a['type']]
        bas = v.get('byteOffset', 0) + a.get('byteOffset', 0); adim = v.get('byteStride', 4 * n)
        return [struct.unpack_from('<%df' % n, ikili, bas + i * adim) for i in range(a['count'])]
    VARS = {'translation': (0, 0, 0), 'rotation': (0, 0, 0, 1), 'scale': (1, 1, 1)}
    sabit = {}
    for a in j.get('animations', []):
        for c in a['channels']:
            k = (c['target']['node'], c['target']['path'])
            if k[1] == 'weights': sabit[k] = False; continue
            r = dug[k[0]].get(k[1], VARS[k[1]])
            ok = True
            for v in oku(a['samplers'][c['sampler']]['output']):
                d = max(abs(v[i] - r[i]) for i in range(len(r)))
                if k[1] == 'rotation': d = min(d, max(abs(-v[i] - r[i]) for i in range(4)))
                if d > 1e-5: ok = False; break
            sabit[k] = sabit.get(k, True) and ok
    atilan = 0
    for a in j.get('animations', []):
        n0 = len(a['channels'])
        a['channels'] = [c for c in a['channels'] if not sabit[(c['target']['node'], c['target']['path'])]]
        atilan += n0 - len(a['channels'])
        kul = sorted({c['sampler'] for c in a['channels']}); es = {x: i for i, x in enumerate(kul)}
        a['samplers'] = [a['samplers'][x] for x in kul]
        for c in a['channels']: c['sampler'] = es[c['sampler']]
    # Kullanılan erişiciler ve görünümler; ikili veri yeniden dizilir (4 bayt hizalı)
    kul_acc = set()
    for m in j.get('meshes', []):
        for p in m['primitives']:
            kul_acc.update(p['attributes'].values())
            if 'indices' in p: kul_acc.add(p['indices'])
            for t in p.get('targets', []): kul_acc.update(t.values())
    for sk in j.get('skins', []):
        if 'inverseBindMatrices' in sk: kul_acc.add(sk['inverseBindMatrices'])
    for a in j.get('animations', []):
        for s_ in a['samplers']: kul_acc.update((s_['input'], s_['output']))
    kul_acc = sorted(kul_acc); acc_es = {x: i for i, x in enumerate(kul_acc)}
    kul_bv = {acc[x]['bufferView'] for x in kul_acc if 'bufferView' in acc[x]}
    for m in j.get('meshes', []):
        for p in m['primitives']:
            dr = p.get('extensions', {}).get('KHR_draco_mesh_compression')
            if dr: kul_bv.add(dr['bufferView'])
    for im in j.get('images', []):
        if 'bufferView' in im: kul_bv.add(im['bufferView'])
    kul_bv = sorted(kul_bv); bv_es = {x: i for i, x in enumerate(kul_bv)}
    yeni = bytearray(); yeni_bv = []
    for x in kul_bv:
        v = dict(bv[x]); veri = ikili[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        while len(yeni) % 4: yeni.append(0)
        v['byteOffset'] = len(yeni); v['buffer'] = 0; yeni += veri; yeni_bv.append(v)
    while len(yeni) % 4: yeni.append(0)
    j['bufferViews'] = yeni_bv
    j['accessors'] = [dict(acc[x], **({'bufferView': bv_es[acc[x]['bufferView']]} if 'bufferView' in acc[x] else {})) for x in kul_acc]
    for m in j.get('meshes', []):
        for p in m['primitives']:
            p['attributes'] = {k: acc_es[v] for k, v in p['attributes'].items()}
            if 'indices' in p: p['indices'] = acc_es[p['indices']]
            p['targets'] = [{k: acc_es[v] for k, v in t.items()} for t in p.get('targets', [])] or p.pop('targets', None) or []
            if not p['targets']: p.pop('targets')
            dr = p.get('extensions', {}).get('KHR_draco_mesh_compression')
            if dr: dr['bufferView'] = bv_es[dr['bufferView']]
    for sk in j.get('skins', []):
        if 'inverseBindMatrices' in sk: sk['inverseBindMatrices'] = acc_es[sk['inverseBindMatrices']]
    for a in j.get('animations', []):
        for s_ in a['samplers']: s_['input'] = acc_es[s_['input']]; s_['output'] = acc_es[s_['output']]
    for im in j.get('images', []):
        if 'bufferView' in im: im['bufferView'] = bv_es[im['bufferView']]
    j['buffers'] = [{'byteLength': len(yeni)}]
    # Sahne extras'ında yalnız karakter_meta (eklentilerin özellikleri atılır)
    for s_ in j.get('scenes', []):
        x = s_.get('extras', {})
        s_['extras'] = {'karakter_meta': x['karakter_meta']} if 'karakter_meta' in x else {}
        if not s_['extras']: s_.pop('extras')
    js = json.dumps(j, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    while len(js) % 4: js += b' '
    cikis = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(yeni)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(yeni), 0x004E4942) + bytes(yeni)
    open(yol, 'wb').write(cikis)
    print('BUDAMA kanal atılan', atilan, 'boyut', len(b), '→', len(cikis))

# ---- dışa aktarım ----
for o in bpy.context.view_layer.objects: o.select_set(False)
for o in karakter + [rig]:
    o.hide_set(False)
    o.hide_viewport = False
    o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(
    filepath=CIKTI, export_format='GLB', use_selection=True, export_yup=False, export_apply=True,
    export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_step=ADIM,
    export_optimize_animation_size=True, export_anim_slide_to_zero=True, export_def_bones=False,
    export_draco_mesh_compression_enable=DRACO, export_draco_mesh_compression_level=6,
    export_vertex_color='NONE', export_morph=False, export_cameras=False, export_lights=False, export_extras=True,
    export_optimize_disable_viewport=True)
budama(CIKTI)
print('YAZILDI', CIKTI)
print('META', json.dumps(meta, ensure_ascii=False))
