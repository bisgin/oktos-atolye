# Karakter kliplerinin ölçümü (Blender, başsız): sitenin karakteri nasıl taşıdığını (klip meta'sındaki gövde yüksekliği
# z, ileri kayması, koltuğun kökün arkasındaki uzaklığı) taklit ederek her karede ölçer:
#   kok_mm        kök kemiğinin yatay kayması (en çok) ve kalçanın klip sonu ile başı arasındaki yatay farkı
#   ayak_mm       yere basan ayağın (ayak_ucu başı yerden ≤ 9 mm) bastığı süre boyunca yatay kayması (en çok, sol/sağ)
#   sicrama       kalçanın kare başı hızı (mm/kare) ve ivmesi (mm/kare²) en çok; ivmenin en büyük olduğu kare
#   koltuk_mm     koltuklu kliplerde gövde ağının (pantolon, kazak, ayaklar) koltuğun parçalarına en derin girişi ve karesi
#   havada        ayakların ikisi de yerden ≥ 30 mm yukarıda olduğu kare sayısı (oturuşta ayak sarkması dahil)
# Kullanım (depo kökünden):
#   blender -b kaynak/karakter/bizzikolosko_site.blend --python scripts/karakter-klip-olc.py -- <çıktı.json> [klip ...] [--glb assets/oda/karakter.glb]
# Meta: aksiyonun site_meta'sı, yoksa --glb'deki karakter_meta (sitenin bugün kullandığı). Klip adı sitedeki ad.
# Çıktı: JSON (klip → ölçüler) ve her klip için bir satır. Hiçbir dosyayı değiştirmez (yalnız çıktı JSON'u yazar).
import bpy, json, math, os, struct, sys
from mathutils import Vector

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
GLB = None
if '--glb' in arg:
    i = arg.index('--glb'); GLB = arg[i + 1]; del arg[i:i + 2]
CIKTI = arg[0]; ISTEK = arg[1:]
MM = 1500.0
rig = bpy.data.objects['bizzikoloşko_rig']; sc = bpy.context.scene
KLIP = {'merdiven': 'Merdivenden İnme', 'ip': 'İpten İnme', 'yuru': 'Yürüme', 'dur': 'Durma', 'dans_twist': 'Dans Twist',
        'dans_tavuk': 'Dans Tavuk', 'dans_lahana': 'Dans Lahana', 'dans_runningman': 'Dans Runningman',
        'otur': 'Koltuğa Oturma', 'otur2': 'Oturmaya Geçiş', 'kalk': 'Koltuktan Kalkma', 'uzan': 'Klavyeye Uzanma',
        'cekil': 'Klavyeden Yaslanma', 'yaz': 'Klavye Tuşlama', 'kafa_salla': 'Tuşlarken Müziğe Kafa Sallama',
        'muzik': 'Taburede Müzik Dinleme', 'sevin': 'Bilgisayar Başında Sevinme', 'inanamama': 'Ekrana İnanamama',
        'bekle': 'Masada Bekleme', 'sirt_ac': 'Sırt Açma', 'kaydir': 'Koltukla Kayma'}
for k in ('buzdolabi_ac', 'buzdolabi_bos', 'elma_ye', 'elma_firlat', 'yaslan', 'egil_bak', 'kumanda', 'kutu_al'): KLIP[k] = k
ISTEK = ISTEK or [k for k in KLIP if bpy.data.actions.get('Hareket - ' + KLIP[k])]

GMETA = {}
if GLB:
    b = open(GLB, 'rb').read()
    j = json.loads(b[20:20 + struct.unpack_from('<I', b, 12)[0]])
    GMETA = json.loads(j['scenes'][0]['extras']['karakter_meta'])['klip']


def anahtar(k, f):
    if k is None: return 0
    if isinstance(k, (int, float)): return k
    if f <= k[0][0]: return k[0][1]
    for (f0, v0), (f1, v1) in zip(k, k[1:]):
        if f <= f1:
            t = max(0.0, min(1.0, (f - f0) / ((f1 - f0) or 1)))
            return v0 + (v1 - v0) * t * t * (3 - 2 * t)
    return k[-1][1]


KOLTUK_PARCA = ['koltuk_oturak', 'koltuk_oturak_kanati', 'koltuk_oturak_kanati.001', 'koltuk_kolcak', 'koltuk_kolcak.001',
                'koltuk_sirt_pano', 'koltuk_sirt_kenar', 'koltuk_bel_yastigi']
GOVDE = ['pantolon', 'kazak', 'sol ayak', 'sağ ayak']


def koltuk_kur(y, z):
    k = bpy.data.objects.get('Site Koltuk')
    if not k: return None
    for o in (k, bpy.data.objects['koltuk_ust'], bpy.data.objects['koltuk_sirt']):
        if o.animation_data: o.animation_data_clear()
    from mathutils import Quaternion
    bpy.data.objects['koltuk_ust'].location.y = 0
    s = bpy.data.objects['koltuk_sirt']; s.rotation_mode = 'QUATERNION'; s.rotation_quaternion = Quaternion((1, 0, 0), 0.14)
    k.location = (0, y, z); k.rotation_euler = (-math.pi / 2, 0, math.pi)
    return k


def girme(dg):
    """Gövde ağının koltuk parçalarına en derin girişi (Blender birimi) ve parça adı"""
    pars = []
    for ad in KOLTUK_PARCA:
        o = bpy.data.objects.get(ad)
        if not o: continue
        bb = [Vector(c) for c in o.bound_box]
        lo = Vector((min(c.x for c in bb), min(c.y for c in bb), min(c.z for c in bb)))
        hi = Vector((max(c.x for c in bb), max(c.y for c in bb), max(c.z for c in bb)))
        pars.append((ad, o.matrix_world.inverted(), lo, hi, min(o.matrix_world.to_scale())))
    en, nerede = 0.0, None
    for gad in GOVDE:
        g = bpy.data.objects[gad].evaluated_get(dg); me = g.to_mesh()
        pts = [g.matrix_world @ v.co for v in me.vertices]
        g.to_mesh_clear()
        for ad, Minv, lo, hi, s in pars:
            for p in pts:
                q = Minv @ p
                if lo.x < q.x < hi.x and lo.y < q.y < hi.y and lo.z < q.z < hi.z:
                    d = min(q.x - lo.x, hi.x - q.x, q.y - lo.y, hi.y - q.y, q.z - lo.z, hi.z - q.z) * s
                    if d > en: en, nerede = d, f'{gad}>{ad}'
    return en, nerede


def olc(ad):
    act = bpy.data.actions['Hareket - ' + KLIP[ad]]
    m = json.loads(act['site_meta']) if act.get('site_meta') else GMETA.get(ad, {})
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    son = int(act.frame_range[1])
    koltuklu = 'koltuk' in m and ad in ('otur', 'otur2', 'kalk')
    kalca, ayak, kok, dz = [], {'L': [], 'R': []}, [], []
    gir, gir_kare, gir_yer = 0.0, None, None
    for f in range(1, son + 1):
        sc.frame_set(f)
        z = anahtar(m.get('z', 0), f) / MM if ad in ('otur', 'otur2', 'kalk') else 0.0
        il = anahtar(m.get('ileri', 0), f) / MM
        gov = Vector((0, -il, z))                         # sitenin gövdeyi taşıdığı yer (karakter yereli)
        pb = rig.pose.bones
        kalca.append(pb['kalça'].head + gov)
        kok.append(pb['kök'].head.copy())
        for t in 'LR': ayak[t].append(pb['ayak_ucu.' + t].head + gov)
        if koltuklu and f % 2 == 1:
            koltuk_kur(anahtar(m['koltuk'], f) / MM + il, -z)   # koltuk gövdeye göre (karakter yerinde, koltuk tersine)
            bpy.context.view_layer.update()
            d, yer = girme(bpy.context.evaluated_depsgraph_get())
            if d > gir: gir, gir_kare, gir_yer = d, f, yer
    zemin = 0.03 + 0.006                                    # ayak_ucu başının yerdeyken yüksekliği + pay
    kay = {}
    for t in 'LR':
        en, bas = 0.0, None
        for p in ayak[t]:
            if p.z <= zemin:
                if bas is None: bas = p
                en = max(en, (p.xy - bas.xy).length)
            else: bas = None
        kay[t] = round(en * MM, 1)
    havada = sum(1 for i in range(son) if min(ayak['L'][i].z, ayak['R'][i].z) > 0.03 + 0.02)
    hiz = [(kalca[i + 1] - kalca[i]).length * MM for i in range(son - 1)]
    ivme = [abs(hiz[i + 1] - hiz[i]) for i in range(len(hiz) - 1)]
    ik = max(range(len(ivme)), key=lambda i: ivme[i]) + 2 if ivme else 1
    r = {'kare': son, 'sure': round(son / 30, 2),
         'kok_mm': round(max((p.xy - kok[0].xy).length for p in kok) * MM, 1),
         'kalca_son_mm': round((kalca[-1].xy - kalca[0].xy).length * MM, 1),
         'ayak_mm': kay, 'havada': havada,
         'sicrama': {'hiz': round(max(hiz), 1) if hiz else 0, 'ivme': round(max(ivme), 1) if ivme else 0, 'kare': ik}}
    if koltuklu: r['koltuk_mm'] = {'derin': round(gir * MM, 1), 'kare': gir_kare, 'yer': gir_yer}
    return r


sonuc = {}
for ad in ISTEK:
    sonuc[ad] = olc(ad)
    print('OLC', ad, json.dumps(sonuc[ad], ensure_ascii=False))
os.makedirs(os.path.dirname(os.path.abspath(CIKTI)), exist_ok=True)
json.dump(sonuc, open(CIKTI, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
