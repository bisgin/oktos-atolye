# Biggie'li oda sunumunun eylem klipleri (senaryo: oktos-dijital-site/senaryo/biggie-sunum.md "Klip sözleşmesi"):
#   buzdolabi_ac, buzdolabi_bos, elma_ye (yalnız üst gövde), elma_firlat, yaslan, egil_bak, kumanda, kutu_al;
#   v5 (2026-11-03): tv_armut, diz_cok, kutu_al_diz, diz_kalk, kitap_al_alt/orta/ust; elma kemikleri ve ağları (GLB'de
#   ısırık adımları), yüz (açık göz + kırpma, ağız kemiği), yay/canlılık katmanı. Meta biçimi: senaryo/klip-meta-v5.md.
#   v6 (2026-11-04): tv_armut armudun gerçek yüzeyinde (karakter-armut-geo.py), diz_cok/kutu_al_diz/diz_kalk tam diz
#   çökme (seiza) ve 420 mm raf, buzdolabi_ac/_bos kapağın süpürme yayının dışında (yeni duruş). Ölçümler OLCUM_V6.
#   v7 (2026-11-04): tv_armut → armut_yat / armut_uyukla / armut_kalk (armut ezilir, karakter gömülür, elleri ensede
#   uyuklar); seizada ayak üstleri yerde; kutu_al_diz'de baş raf hacmine girmez; diz_bekle, kutu_cevir_sag/_sol,
#   kutu_rafa_birak; zincir uçları aynı poz (uc_kilitle, zincir_olc). Ölçümler OLCUM_V7.
# Girdi: karakter dosyası açık (scripts/karakter-kaynak-kur.py bunu karakter-klipler.py'den sonra exec eder; rig, lq,
#        yaz, yeni_aksiyon, anahtar, ease, fcmap, REST, X, Y, Z oradan gelir).
# Çıktı: "Hareket - <ad>" aksiyonları (30 fps, kök yerinde: kök kemiği ve kalçanın yatay yeri klip başı/sonunda Durma
#        1. karesinde) ve her aksiyonun "site_meta"sı (JSON; karakter-blender.py GLB'nin karakter_meta'sına taşır).
# Tekrar çalıştırmak güvenli: aynı adlı aksiyon silinip yeniden kurulur.
#
# Koordinatlar: karakterin armatür uzayı (Blender birimi; sitede × 1,5 × 1000 = mm), +x karakterin solu, −y baktığı yön
# (ileri), z yukarı, kök (0, 0, 0). Meta'daki noktalar aynı eksenlerde mm (sitenin karakter yereli; ileri −y).
# Kurgu: taban poz Durma'nın 1. karesi (bütün klipler aynı pozdan başlayıp ona döner: 'dur' ile geçiş sıçramaz) +
# anahtarlanmış kemik dönüşleri (armatür ekseninde derece) + el IK (avuç noktası, parmak/başparmak yönü) + bacak IK
# (ayaklar yerde kalır, kalça iner/kalkar) + parmak kıvrımı. Ölçüler (elin değdiği nokta, bırakma hızı) kurulan
# animasyondan ölçülür, elle yazılmaz.
import bpy, json, math
from mathutils import Vector, Matrix, Quaternion, Euler

MM = 1500.0                                   # Blender birimi → site mm
DURMA = 'Hareket - Durma'
UST_KOK = 'omurga'                            # üst gövde katmanının kökü (elma_ye yalnız bunun altındaki kemikler)


# v4 (2026-11-03, kullanıcı: "dinamik ve akıcı"): ara değer artık her anahtarda durmaz. Eski smoothstep her anahtar
# karesinde hızı sıfırlıyordu (dur-kalk, robot gibi). Yerine tekdüze kübik Hermite (Fritsch–Carlson, PCHIP): eğri
# anahtarlardan geçer, aynı yönde süren harekette anahtarda durmadan akar, dönüş/bekleme anahtarında yumuşakça durur,
# taşma (overshoot) yapmaz; ilk ve son anahtarda hız sıfır (klip Durma pozundan yumuşak başlar, yumuşak biter).
def _pchip_egim(xs, ys):
    n = len(xs)
    if n < 2: return [0.0] * n
    h = [xs[i + 1] - xs[i] or 1e-9 for i in range(n - 1)]
    d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    for i in range(1, n - 1):
        if d[i - 1] * d[i] > 0:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    return m


def _pchip(xs, ys, f, m=None):
    if f <= xs[0]: return ys[0]
    if f >= xs[-1]: return ys[-1]
    m = m or _pchip_egim(xs, ys)
    for i in range(len(xs) - 1):
        if f <= xs[i + 1]:
            h = xs[i + 1] - xs[i] or 1e-9; t = (f - xs[i]) / h
            h00, h10, h01, h11 = 2*t**3 - 3*t**2 + 1, t**3 - 2*t**2 + t, -2*t**3 + 3*t**2, t**3 - t**2
            return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1]
    return ys[-1]


def anahtar(k, f):
    """Sayı anahtarları [[kare, değer]] → PCHIP ara değer (karakter-klipler.py'deki smoothstep'li sürümün yerine)"""
    if k is None: return 0
    if isinstance(k, (int, float)): return k
    return _pchip([a for a, _ in k], [b for _, b in k], f)


def vanahtar(k, f):
    """Vektör anahtarları [(kare, (x, y, z))] → bileşen başına PCHIP"""
    xs = [a for a, _ in k]
    return Vector([_pchip(xs, [Vector(v)[i] for _, v in k], f) for i in range(3)])


def el_cerceve(taraf, ileri, avuc_yon):
    """Elin istenen dönüşü (armatür uzayı): parmaklar 'ileri', avuç içi 'avuc_yon' yönüne bakar. Dinlenmede (T-poz) sol el
    parmakları +x, sağ −x; başparmak +z; avuç −y. Sol elde avuç = parmak × başparmak, sağda başparmak × parmak."""
    f0 = Vector((1 if taraf == 'L' else -1, 0, 0)); t0 = Vector((0, 0, 1))
    f = Vector(ileri).normalized(); a = Vector(avuc_yon)
    a = (a - f * a.dot(f)).normalized()
    t = a.cross(f) if taraf == 'L' else f.cross(a)
    B0 = Matrix((f0, t0, f0.cross(t0))).transposed(); B1 = Matrix((f, t, f.cross(t))).transposed()
    return (B1 @ B0.transposed()).to_quaternion()


# Sık kullanılan el yönleri (parmak, avuç)
SARK = {'L': ((0, -0.3, -1), (-1, 0, 0)), 'R': ((0, -0.3, -1), (1, 0, 0))}   # yanda sarkan (Durma)
ELMA_TUT = ((0.4, -1, 0.2), (0, -0.2, 1))                                    # sağ el göğüs önünde, avuç yukarı
# v5 (kullanıcı: "kollar içeri katlanmasın"): v4'te kol düz uzanıyordu (dirsek 180°), el karnın önüne yapışık görünüyordu.
# Tutuş: dirsek yanda ve hafif geride, önkol öne, el göğüs yüksekliğinin altında ve omuz hizasında (dirsek ~95°)
ELMA_ALT = (-0.17, -0.18, 0.5)
DIRSEK_TUT = {'R': (-0.42, 0.12, 0.36), 'L': (0.42, 0.12, 0.36)}
ELMA_KIVRIM = (0.3, 0.4)                                                     # elmayı tutan parmak ve başparmak kıvrımı


def avuc(taraf, nokta=None):
    """El hedefi olan noktanın bileğe göre yeri, el dinlenme çerçevesinde (armatür uzayı): verilmezse tutma kemiği"""
    if nokta is not None: return Vector(nokta)
    return REST['tutma.' + taraf].translation - REST['el.' + taraf].translation


# Elmanın merkezi sağ elde (dinlenme çerçevesi, bileğe göre): parmak köklerinin önünde, avuç tarafında. Karakterin eli
# iri (avuç ~130 mm), elma 76 mm: avuca gömülmesin, parmak uçlarında görünsün
ELMA_EL = (-0.07, -0.035, -0.004)


def oyanahtar(k, f):
    """Yön anahtarları [(kare, (ileri, bas))] → quaternion (slerp)"""
    if f <= k[0][0]: return k[0][1]
    if f >= k[-1][0]: return k[-1][1]
    # Anahtar sırası kareye PCHIP ile eşlenir: ara anahtarda durmadan geçer (yön değişse de dönüş akıcı)
    s = _pchip([a for a, _ in k], list(range(len(k))), f)
    i = min(int(s), len(k) - 2)
    return k[i][1].slerp(k[i + 1][1], s - i)


# Bindirme (overlap/follow-through, v4): üst zincir alttakini birkaç kare geriden izler: önce kalça/omurga, sonra göğüs,
# omuz, boyun, baş. Klip sonuna doğru gecikme sıfıra iner (son kare yine Durma pozunda biter).
GECIKME = {'göğüs': 2, 'omuz.L': 3, 'omuz.R': 3, 'boyun': 3, 'kafa': 4}


def geciktir(k, d, son):
    if not d or not isinstance(k, list): return k
    out = []
    for f, v in k:
        f2 = f + d * max(0.0, min(1.0, (son - f) / (3 * d)))
        out.append([f2, v])
    return out


def bakis(hedef, f, govde_don):
    """Baş takibi: kafanın ileri (−y) yönünü hedef noktaya çevirmek için gereken (X eğim, Z dönüş) derece; gövdenin
    o karedeki toplam X/Z dönüşü düşülür (kafa yalnız kalanı yapar), ±40° ile sınırlı"""
    goz = REST['kafa'].translation + Vector((0, -0.06, 0.08))
    v = hedef - goz
    yaw = math.degrees(math.atan2(v.x, -v.y))
    pitch = -math.degrees(math.atan2(v.z, math.hypot(v.x, v.y)))
    gx, gz = govde_don
    return max(-40, min(40, pitch - gx)), max(-40, min(40, yaw - gz))


PARMAK = [f'parmak_{i}_{j}' for i in range(1, 5) for j in range(1, 4)]
BASP = ['başparmak_1', 'başparmak_2', 'başparmak_3']


def taban_degerleri(akt=DURMA, f=1):
    """Durma 1. karedeki bütün kanallar {(yol, i): değer} (v8.2: başka aksiyonun başka karesi de olur)"""
    return {k: fc.evaluate(f) for k, fc in fcmap(bpy.data.actions[akt]).items()}


# v8.2: klibin tabanı her karede başka bir aksiyonun bir karesi olabilir (S['taban_akt'] = (aksiyon adı, kare eşlemesi
# f → kaynak kare)): masada oturan klavye/fare klipleri, yürürken üst gövde katmanı (yürümenin gövde salınımı korunur).
_TABAN_FC = {}


def taban_kare(S, f):
    ta = S.get('taban_akt')
    if not ta: return None
    ad, es = ta
    if ad not in _TABAN_FC: _TABAN_FC[ad] = fcmap(bpy.data.actions[ad])
    g = es(f) if callable(es) else es
    return {k: fc.evaluate(g) for k, fc in _TABAN_FC[ad].items()}


def poz_sifirla():
    """Anahtarsız kanallar önceki aksiyondan kalmasın: bütün kemik dönüşümleri ve IK özellikleri dinlenmeye"""
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
    for k in ('IK_kol.L', 'IK_kol.R', 'IK_bacak.L', 'IK_bacak.R'): rig[k] = 0.0


def durma_ayak(taraf):
    """Durma 1. karede ayağın armatür uzayındaki matrisi (bacak IK hedefi buraya konur)"""
    poz_sifirla()
    act = bpy.data.actions[DURMA]
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    bpy.context.scene.frame_set(1)
    return rig.pose.bones['ayak.' + taraf].matrix.copy()


# ---- v5: yay (taşma), yüz (göz kırpma, ağız), elma kemikleri ----
# Yay: anahtarlı değer hedef, kemik ona sönümlü yayla gider (ω rad/kare, ζ sönüm): hızlı harekette taşar, geri oturur.
# Son 8 karede hedefe karışır (klip yine Durma pozunda biter).
YAY = {'göğüs': (0.42, 0.45), 'boyun': (0.38, 0.42), 'kafa': (0.34, 0.38), 'omuz.L': (0.45, 0.45), 'omuz.R': (0.45, 0.45),
       'omurga': (0.55, 0.55), 'kalça': (0.6, 0.62)}


def yayla(seri, w, z):
    if not w: return seri
    x, v, out, n = seri[0], 0.0, [], len(seri)
    for i, h in enumerate(seri):
        a = w * w * (h - x) - 2 * z * w * v
        v += a; x += v
        k = max(0.0, min(1.0, (i - (n - 9)) / 8))
        out.append(x * (1 - k) + h * k)
    return out


YUZ_OLCEK = ['göz.L', 'göz.R', 'ağız'] + ['elma_' + s for s in ('g0', 'g1', 'g2', 'g3', 'kocan')]
ELMA_KEMIK = ['elma_g0', 'elma_g1', 'elma_g2', 'elma_g3', 'elma_kocan']


def kirpma_kareleri(son, bas=17, ara=(83, 67, 101, 74)):
    out, f, i = [], bas, 0
    while f < son - 6:
        out.append(f); f += ara[i % len(ara)]; i += 1
    return out


def yuz_kare(S, f, son, ekle):
    """Gözler açık (Durma'nın 1. karesi bir kırpma anı: ölçek z 0,12; v4 bütün kliplerde gözleri kapalı bırakıyordu),
    ara ara kırpar (5 kare). Ağız 'agiz' [[k, 0..1]] ile açılır (ağız kemiği: en × 1,35, boy × 9; önceki yüz çalışmasının
    yolu). Elma kemikleri 'elma': {'g0'..'kocan': [[k, 0|1]]} ölçekle görünür/gizlenir, 'elma_don' elmayı ekseninde çevirir."""
    g = 1.0
    for k in S.get('kirp', kirpma_kareleri(son)):
        d = f - k
        if 0 <= d <= 5: g = min(g, [1, 0.45, 0.08, 0.3, 0.75, 1][d])
    if 'goz_kapa' in S:   # v7: göz kapanması [[k, 0..1]] (1 = kapalı; uyuklama)
        g = min(g, 1 - 0.92 * max(0.0, min(1.0, anahtar(S['goz_kapa'], f))))
    for t in 'LR':
        for i, v in enumerate((1, 1, g)): ekle((f'pose.bones["göz.{t}"].scale', i), v)
    a = max(0.0, anahtar(S.get('agiz', 0), f))
    for i, v in enumerate((1 + 0.35 * a, 1.0, 1 + 8.0 * a)): ekle(('pose.bones["ağız"].scale', i), v)
    if S.get('elma_serbest'): return   # v8.2: elma kemiklerine anahtar yok (önceki klibin elması ve dönüşü kalır)
    E = S.get('elma', {})
    for kn in ELMA_KEMIK:
        k = E.get(kn[5:], 0)
        s_ = 1.0 if (k if isinstance(k, (int, float)) else next((v for kk, v in reversed(k) if f >= kk), 0)) else 0.0
        for i in range(3): ekle((f'pose.bones["{kn}"].scale', i), s_)
    q = Quaternion((0, 1, 0), math.radians(anahtar(S.get('elma_don', 0), f)))
    for i in range(4): ekle(('pose.bones["elma"].rotation_quaternion', i), q[i])


def klip_kur(ad, son, S):
    """S: klip tanımı
      'don': {kemik: {'X'|'Y'|'Z': [[kare, derece], ...]}}  armatür ekseni etrafında ek dönüş (taban pozun üstüne)
      'kalca': [(kare, (dx, dy, dz))]                       kalçanın armatür uzayında kayması
      'el':   {'L'|'R': {'ik': [[k, 0..1]], 'yer': [(k, avuç noktası)], 'yon': [(k, (parmak yönü, başparmak yönü))],
                         'dirsek': [(k, nokta)]}}
      'parmak': {'L'|'R': [[k, 0..1]]}, 'basparmak': {...}  kıvrım (1 = yumruk)
      'ayak': {'L'|'R': [(k, (dx, dy, dz))]}                bacak IK hedefinin Durma'daki yerinden kayması
      'cene': [[k, derece]]                                 çene açılması
      'nefes': genlik (derece; göğüs, 2 sn)
    """
    taban0 = taban_degerleri()
    tb1 = taban_kare(S, 1)
    taban = {**taban0, **tb1} if tb1 else taban0
    kareler = list(range(1, son + 1))
    # v4: bindirme gecikmesi + kalçanın karşı dönüşü (gövde dönerken kalça biraz ters yöne, 2 kare önden)
    don = {bn: {ax: geciktir(k, 0 if S.get('gecikmesiz') else GECIKME.get(bn, 0), son) for ax, k in eks.items()} for bn, eks in S.get('don', {}).items()}
    gz = (don.get('omurga', {}).get('Z'), don.get('göğüs', {}).get('Z'))
    if any(gz) and 'kalça' not in don:
        ref = gz[0] or gz[1]
        don['kalça'] = {'Z': [[max(1, f - 2) if i else f, -0.3 * v] for i, (f, v) in enumerate(ref)]}
    S = dict(S, don=don)
    BAK = S.get('bak')
    def govde(f, ax):
        return sum(anahtar(don.get(b, {}).get(ax), f) for b in ('omurga', 'göğüs', 'boyun'))
    seri = {}
    def ekle(k, v): seri.setdefault(k, []).append(v)
    prev = {}
    ayak0 = {t: durma_ayak(t) for t in 'LR'}
    ayak_uc0 = {t: (durma_ayak(t), rig.pose.bones['ayak_ucu.' + t].head.copy())[1] for t in 'LR'}
    yonq = {t: [(f, el_cerceve(t, a, b)) for f, (a, b) in S.get('el', {}).get(t, {}).get('yon', [(1, SARK[t])])] for t in 'LR'}
    euler_kemik = sorted({k[0].split('"')[1] for k in taban if k[0].startswith('pose.bones') and k[0].endswith('rotation_euler')})
    # v5 (kullanıcı: "vücut çok tepkisiz"): üst zincirin dönüşleri yaydan geçer (taşma + oturma), kalça da hafifçe
    DON = {(bn, ax): yayla([anahtar(k, f) for f in kareler], *((0, 0) if S.get('yaysiz') else YAY.get(bn, (0, 0)))) for bn, eks in S.get('don', {}).items() for ax, k in eks.items()}
    KAL = None
    if 'kalca' in S:
        KE = S.get('kalca_ek', {})
        ks = [vanahtar(S['kalca'], f) + KE.get(f, Vector()) for f in kareler]
        KAL = [Vector(v) for v in zip(*[yayla([v[i] for v in ks], *YAY['kalça']) for i in range(3)])]
    can = S.get('canli', 1.0)
    for f in kareler:
        if tb1 is not None: taban = {**taban0, **taban_kare(S, f)}
        EK = {}
        w = anahtar(BAK['agirlik'], f) if BAK else 0.0
        zarf = can * min(1.0, (f - 1) / 15, (son - f) / 15) if son > 31 else 0.0
        if zarf > 0:   # canlılık: ağırlık aktarımı (kalça yana, omurga karşı), başın küçük gezinmesi, omuz nefesle kalkar
            fa = 2 * math.pi * (f - 1)
            EK.setdefault('omurga', []).append((Z, zarf * 1.2 * math.sin(fa / 130 + 0.7)))
            EK.setdefault('kafa', []).append((Z, zarf * 2.0 * math.sin(fa / 167 + 1.9)))
            EK.setdefault('kafa', []).append((X, zarf * 1.2 * math.sin(fa / 97 + 0.3)))
            for t, sg in (('L', -1), ('R', 1)): EK.setdefault('omuz.' + t, []).append((Y, sg * zarf * 1.5 * math.sin(fa / 60 + 1.2)))
        for bn, eks in S.get('don', {}).items():
            for ax, k in eks.items():
                d = DON[(bn, ax)][f - 1]
                if bn == 'kafa' and ax in 'XZ' and w: d *= (1 - w)
                EK.setdefault(bn, []).append(({'X': X, 'Y': Y, 'Z': Z}[ax], d))
        if w:   # baş bakılan nesneyi izler (hedef anahtarlı nokta), gövdenin dönüşü düşülerek
            bx, bz = bakis(vanahtar(BAK['yer'], f), f, (govde(f, 'X'), govde(f, 'Z')))
            EK.setdefault('kafa', []).extend([(X, w * bx), (Z, w * bz)])
            if S.get('goz_bak'):   # v8.2: gözler de bakılan nesneye (başın dönüşünün bir kesri kadar, önden gider)
                for gz in ('göz.L', 'göz.R'): EK.setdefault(gz, []).extend([(X, w * bx * S['goz_bak']), (Z, w * bz * S['goz_bak'])])
        nef = 1.5 * S.get('nefes', 1.0) * math.sin(2 * math.pi * (f - 1) / 60)
        if S.get('nefes_uc'): nef *= min(1.0, (f - 1) / 12, (son - f) / 12)   # v7: zincir klipleri uçta aynı pozda (nefes 0)
        EK.setdefault('göğüs', []).append((X, -nef))
        if 'cene' in S: EK.setdefault('çene', []).append((X, -anahtar(S['cene'], f)))
        for t in 'LR':
            p = anahtar(S.get('parmak', {}).get(t, 0), f); b = anahtar(S.get('basparmak', {}).get(t, 0), f)
            ax = -Z if t == 'L' else Z
            for bn in PARMAK: EK.setdefault(f'{bn}.{t}', []).append((ax, 75 * p if bn.endswith('_1') else 85 * p))
            for i_, k_ in S.get('parmak_ek', {}).get(t, {}).items():   # v8.2: tek parmağın ek kıvrımı (tık, tuş basma), derece
                d_ = anahtar(k_, f)
                if d_:
                    EK[f'parmak_{i_}_1.{t}'].append((ax, d_)); EK[f'parmak_{i_}_2.{t}'].append((ax, 0.7 * d_))
            for i_, k_ in S.get('parmak_tek', {}).get(t, {}).items():   # v8.2: tek parmağın kıvrımı (genel kıvrımın yerine), 0..1
                d_ = anahtar(k_, f) - p
                if d_:
                    for j_ in (1, 2, 3): EK[f'parmak_{i_}_{j_}.{t}'].append((ax, (75 if j_ == 1 else 85) * d_))
            bax = Vector((1, 0, -1) if t == 'L' else (1, 0, 1)).normalized()
            for bn in BASP: EK.setdefault(f'{bn}.{t}', []).append((bax, 35 * b))
        for bn in euler_kemik:
            e = Euler([taban.get((f'pose.bones["{bn}"].rotation_euler', i), 0) for i in range(3)], 'XYZ')
            if bn in EK:
                q = e.to_quaternion()
                for ax, d in EK[bn]:
                    if d: q = lq(bn, ax, d) @ q
                e = q.to_euler('XYZ', prev.get(bn, e))
            prev[bn] = e
            for i in range(3): ekle((f'pose.bones["{bn}"].rotation_euler', i), e[i])
        # Kalça: Durma'daki yerel konumu + armatür uzayındaki kayma (yerel eksene çevrilir)
        dk = KAL[f - 1].copy() if KAL else Vector()
        if zarf > 0: dk += Vector((zarf * 0.005 * math.sin(2 * math.pi * (f - 1) / 130), 0, zarf * 0.0015 * math.sin(2 * math.pi * (f - 1) / 60)))
        dl = REST['kalça'].to_3x3().inverted() @ dk
        for i in range(3): ekle(('pose.bones["kalça"].location', i), taban.get(('pose.bones["kalça"].location', i), 0) + dl[i])
        for (yol, i), v in taban.items():
            if yol.startswith('pose.bones') and yol.endswith('rotation_euler'): continue
            if yol == 'pose.bones["kalça"].location': continue
            if yol.endswith('.scale') and any(f'"{b}"' in yol for b in list(S.get('olcek', {})) + list(S.get('olcek3', {})) + YUZ_OLCEK): continue
            if any(s in yol for s in ('el_IK', 'ayak_IK', 'dirsek_hedef', 'diz_hedef')): continue
            if yol in ('["IK_kol.L"]', '["IK_kol.R"]', '["IK_bacak.L"]', '["IK_bacak.R"]'): continue
            ekle((yol, i), v)
        # Eller (IK): avuç noktası ve yönü → el_IK (bilek) matrisi. Ebeveyn kök dinlenmede
        for t in 'LR':
            E = S.get('el', {}).get(t, {})
            ik = anahtar(E.get('ik', 0), f)
            q = oyanahtar(yonq[t], f)
            if 'yer' in E:
                bilek = vanahtar(E['yer'], f) - q @ avuc(t, E.get('nokta'))
            else:
                bilek = REST['el_IK.' + t].translation.copy()
            dr = REST['el_IK.' + t]
            Mh = Matrix.Translation(bilek) @ (q.to_matrix() @ dr.to_3x3()).to_4x4()
            loc, rot, _ = (dr.inverted() @ Mh).decompose()
            for i in range(3): ekle((f'pose.bones["el_IK.{t}"].location', i), loc[i])
            for i in range(4): ekle((f'pose.bones["el_IK.{t}"].rotation_quaternion', i), rot[i])
            ekle((f'["IK_kol.{t}"]', 0), ik)
            duz = S.get('duzelt', {}).get(t, {}).get(f)
            if duz is not None:   # v4 kol düzeltmesi: önkol gövdeye giriyorsa el ve dirsek dışarı itilir
                Mh = Matrix.Translation(duz) @ Mh
                loc, rot, _ = (dr.inverted() @ Mh).decompose()
                seri[(f'pose.bones["el_IK.{t}"].location', 0)][-1], seri[(f'pose.bones["el_IK.{t}"].location', 1)][-1], seri[(f'pose.bones["el_IK.{t}"].location', 2)][-1] = loc
            dh = vanahtar(E['dirsek'], f) if 'dirsek' in E else REST['dirsek_hedef.' + t].translation
            if duz is not None: dh = dh + duz * 2.5
            dl = REST['dirsek_hedef.' + t].to_3x3().inverted() @ (dh - REST['dirsek_hedef.' + t].translation)
            for i in range(3): ekle((f'pose.bones["dirsek_hedef.{t}"].location', i), dl[i])
            # v8.2: diz hedefi (S['diz'][t] = [(k, kayma)]): bacak IK'sının dizi nereye büktüğü (bacakları yana açmak için)
            DZ = S.get('diz', {}).get(t)
            dzv = vanahtar(DZ, f) if DZ else Vector()
            dl = REST['diz_hedef.' + t].to_3x3().inverted() @ dzv
            for i in range(3): ekle((f'pose.bones["diz_hedef.{t}"].location', i), dl[i])
            if S.get('bacak_fk'):   # v8.2: bacaklar tabanın kendi (FK) dönüşleriyle (oturan klavye/fare klipleri)
                ekle((f'["IK_bacak.{t}"]', 0), 0.0)
                continue
            # Bacak IK: ayak Durma'daki yerinde (+ kayma); diz hedefi önde
            A = S.get('ayak', {}).get(t)
            dA = vanahtar(A, f) if A else Vector()
            Ma = Matrix.Translation(dA) @ ayak0[t]
            AD = S.get('ayak_don', {}).get(t)
            if AD:   # ayak ucunun (parmak kökü) etrafında X dönüşü: + topuk kalkar (diz çökme, parmak ucuna basma)
                pu = Matrix.Translation(dA) @ ayak_uc0[t]
                Ma = Matrix.Translation(pu) @ Matrix.Rotation(math.radians(anahtar(AD, f)), 4, 'X') @ Matrix.Translation(-pu) @ Ma
            AB = S.get('ayak_bilek', {}).get(t)
            if AB:   # v6: bileğin (ayak kemiğinin başı) etrafında X dönüşü: + parmaklar aşağı (sarkan ayak, diz çökmede ayak üstü yerde)
                pb_ = Matrix.Translation(dA) @ ayak0[t].translation
                Ma = Matrix.Translation(pb_) @ Matrix.Rotation(math.radians(anahtar(AB, f)), 4, 'X') @ Matrix.Translation(-pb_) @ Ma
            AY = S.get('ayak_yaw', {}).get(t)
            if AY:   # v8.2: bileğin etrafında dikey (z) dönüş, derece (+ ayak ucu karakterin soluna; bacak açılınca uçlar dışa)
                pb_ = Ma.translation.copy()
                Ma = Matrix.Translation(pb_) @ Matrix.Rotation(math.radians(anahtar(AY, f)), 4, 'Z') @ Matrix.Translation(-pb_) @ Ma
            ar = REST['ayak_IK.' + t]
            loc, rot, _ = (ar.inverted() @ Ma).decompose()
            for i in range(3): ekle((f'pose.bones["ayak_IK.{t}"].location', i), loc[i])
            for i in range(4): ekle((f'pose.bones["ayak_IK.{t}"].rotation_quaternion', i), rot[i])
            ekle((f'["IK_bacak.{t}"]', 0), 1.0)
        # v4: kemik ölçeği (yanak şişmesi): {kemik: [[k, s]]}, x ve z ölçeklenir (yana ve öne)
        for bn, k in S.get('olcek', {}).items():
            s = anahtar(k, f)
            for i, v in enumerate((s, 1.0 + (s - 1.0) * 0.4, s)): ekle((f'pose.bones["{bn}"].scale', i), v)
        for bn, k in S.get('olcek3', {}).items():   # v8.2: eksen eksen ölçek [(k, (x, y, z))] (karın kemiği: y < 1 içeri çöker)
            v3 = vanahtar(k, f)
            for i in range(3): ekle((f'pose.bones["{bn}"].scale', i), v3[i])
        yuz_kare(S, f, son, ekle)
    act = yeni_aksiyon('Hareket - ' + ad)
    yaz(act, seri, kareler)
    act.frame_range = (1, son)
    return act


# ---- v4: kol–gövde çözücüsü (kullanıcı: "kollar içeri katlanmasın") ----
# Kazağın gövde yüzü (göğüs/omurga/kalça ağırlıklı yüzler, dinlenme pozunda) BVH'ye alınır; her karede önkol ekseni
# (dirsek → bilek, 7 nokta) göğüs kemiğinin dinlenme çerçevesine geri taşınıp yüzeyin içinde mi bakılır. Giren karelerde el
# hedefi yüzey normali yönünde (derinlik + 20 mm pay) dışarı, dirsek hedefi 2,5 katı itilir; düzeltme komşu karelere
# yumuşak yayılır, temas aralıklarında (kol, elma, raf, kutu) el yerinde kalır. Birkaç turda kesişim 0'a iner.
_GOVDE = None


def _govde():
    global _GOVDE
    if _GOVDE: return _GOVDE
    from mathutils.bvhtree import BVHTree
    kz = bpy.data.objects['kazak']; gi = {g.index: g.name for g in kz.vertex_groups}
    tv = {v.index for v in kz.data.vertices if v.groups and gi[max(v.groups, key=lambda g: g.weight).group] in ('göğüs', 'omurga', 'kalça', 'karın')}
    yuz = [tuple(p.vertices) for p in kz.data.polygons if all(i in tv for i in p.vertices)]
    vs = [kz.matrix_world @ v.co for v in kz.data.vertices]
    zs = [vs[i].z for i in tv]
    _GOVDE = (BVHTree.FromPolygons(vs, yuz), min(zs), max(zs))
    return _GOVDE


def onkol_giris(t):
    """O karedeki önkolun gövdeye en derin girişi: (derinlik, armatür uzayında dışarı yön)"""
    bvh, z0, z1 = _govde()
    G = rig.pose.bones['göğüs'].matrix; T = REST['göğüs'] @ G.inverted()
    Rn = G.to_3x3() @ REST['göğüs'].to_3x3().inverted()
    a = rig.pose.bones['ön_kol.' + t].head; b = rig.pose.bones['el.' + t].head
    en = (0.0, None)
    for i in range(7):
        q = T @ a.lerp(b, i / 6)
        if not (z0 <= q.z <= z1): continue
        loc, n, _, d = bvh.find_nearest(q)
        if loc is None or (q - loc).dot(n) >= 0: continue
        if d > en[0]: en = (d, (Rn @ n).normalized())
    return en


def kol_coz(ad, son, S, temas=None, tur=9, pay=0.02):
    temas = temas or {}
    duz = {'L': {}, 'R': {}}
    def uzak(t, g):
        d = min([0 if a <= g <= b else min(abs(g - a), abs(g - b)) for a, b in temas.get(t, [])] or [99])
        return min(1.0, d / 4)
    for it in range(tur):
        act = klip_kur(ad, son, dict(S, duzelt={t: dict(d) for t, d in duz.items()}))
        ham = {'L': {}, 'R': {}}
        for f in range(1, son + 1):
            kare_ayarla(act, f)
            for t in S.get('el', {}):
                d, n = onkol_giris(t)
                if d > 0: ham[t][f] = n * (d + pay)
        top = sum(len(v) for v in ham.values())
        print('KOLCOZ', ad, 'tur', it, 'giren kare', top, 'en derin mm', round(max([v.length - pay for h in ham.values() for v in h.values()] or [0]) * MM, 1))
        if not top: return act
        for t in 'LR':
            ek = {}
            for f, v in ham[t].items():
                for g in range(f - 5, f + 6):
                    if not 1 <= g <= son: continue
                    w = math.exp(-((g - f) / 2.5) ** 2) * uzak(t, g)
                    if w and (g not in ek or (v * w).length > ek[g].length): ek[g] = v * w
            for g, v in ek.items(): duz[t][g] = duz[t].get(g, Vector()) + v
    return klip_kur(ad, son, dict(S, duzelt=duz))


# ---- ölçüm yardımcıları (kurulan aksiyon üzerinde) ----
def kare_ayarla(act, f):
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    bpy.context.scene.frame_set(int(f), subframe=f - int(f))


def nokta(act, f, kemik, uc='head'):
    kare_ayarla(act, f)
    return getattr(rig.pose.bones[kemik], uc).copy()   # armatür uzayı


def mm(v): return [round(x * MM, 1) for x in v]


def el_hatasi(act, S, t, a, b):
    """[a, b] karelerinde el IK hedefi (avuç) ile gerçek avuç (tutma kemiği) arası en büyük uzaklık, mm"""
    E = S['el'][t]; en = 0
    for f in range(a, b + 1):
        kare_ayarla(act, f)
        en = max(en, (el_noktasi(t, E.get('nokta')) - vanahtar(E['yer'], f)).length)
    return round(en * MM, 1)


def el_noktasi(t, nokta=None):
    """Elin hedef noktasının (avuç ya da elma) o karedeki yeri (armatür uzayı)"""
    pb = rig.pose.bones['el.' + t]
    Mr = REST['el.' + t]
    return pb.matrix @ (Mr.inverted() @ (Mr.translation + avuc(t, nokta)))


def elma_nokta(act, f):
    kare_ayarla(act, f)
    return el_noktasi('R', ELMA_EL)


def _elma_meta():
    Mr = REST['el.R']
    return {'kemik': 'el.R', 'el_yerel': mm(Mr.inverted() @ (Mr.translation + Vector(ELMA_EL))), 'cap': 76,
            'not': 'elmanın merkezi el.R kemiğinin yerelinde (mm; kemiğin dinlenme çerçevesi, ölçeksiz)'}


def yerel_mm(act, f, kemik, p):
    """Nokta p'nin (armatür uzayı) kemiğin o karedeki yerel çerçevesinde yeri, mm (sitede kemiğe bağlanan nesne için)"""
    kare_ayarla(act, f)
    return mm(rig.pose.bones[kemik].matrix.inverted() @ p)


# ---------------------------------------------------------------------------------------------------------------
# Sahne düzeni (mm, karakter yereli): buzdolabı (OLCU.FRIDGE: en 500, derin 550, boy 850, raf 440). Kapağın menteşesi
# karakterin solunda (sitede buzdolabının +y köşesi), kol serbest uçta. Kök kapağın kol tarafına yakın, ön yüzden 330 mm
# geride durur: kapak 500 mm'lik yayla açılırken gövdeyi süpürmesin diye karakter kolu çekip sağ arkaya iki adım atar,
# kapak geçince yerine döner; kapatırken de öyle. Elma üst rafta (440 mm), ön yüzden 30 mm içeride (karakter dizlerini kırıp uzanır, büyük kafası buzdolabının üst kenarına girmesin diye az eğilir). Kol 640 mm yükseklikte.
U = 1 / MM
BZ = {'menteşe': Vector((315 * U, -330 * U, 0)), 'en': 500 * U, 'kol_z': 640 * U, 'raf': 440 * U}
GERI = Vector((-0.03, 0.30, 0))   # kapak süpürürken gövdenin çekildiği yer (arka, 450 mm; el kolu bırakmadan)


def kapak_noktasi(aci, uzak, z, disari=30 * U):
    """Kapakta menteşeden 'uzak' kadar, ön yüzünden 'disari' kadar dışarıda (− iç yüz tarafı) nokta. aci: açılma (rad;
    + açılır: kapalıyken kapak menteşeden sağa uzanır, açılınca serbest ucu karakterin soluna gelir)"""
    yon = Vector((-math.cos(aci), math.sin(aci), 0))
    dis = Vector((math.sin(aci), math.cos(aci), 0))
    return BZ['menteşe'] + yon * uzak + dis * disari + Vector((0, 0, z))


def adimlar(f0, a, b, sira='RL', boy=7, yuksek=0.035, kalca_ek=((0, 0, 0), (0, 0, 0))):
    """Gövde a'dan b'ye iki adımda geçer: ayak anahtarları (kayma, kaldırma) ve kalça anahtarları"""
    ayak = {}
    for i, t in enumerate(sira):
        s0 = f0 + i * (boy - 1); s1 = s0 + boy
        A, B = Vector(a), Vector(b); h = Vector((0, 0, yuksek))
        # Önce kalkar, sonra ilerler, inip basar: yerdeyken kaymaz
        ayak[t] = [(s0, tuple(A)), (s0 + 1.5, tuple(A + h * 0.45)), ((s0 + s1) / 2, tuple((A + B) / 2 + h)), (s1 - 1.5, tuple(B + h * 0.45)), (s1, tuple(B))]
    kalca = [(f0, tuple(Vector(a) + Vector(kalca_ek[0]))), (f0 + 2 * boy - 1, tuple(Vector(b) + Vector(kalca_ek[1])))]
    return ayak, kalca


def birlestir(*parcalar):
    """Anahtar listelerini kare sırasıyla birleştirir (aynı karede sonuncusu kalır)"""
    d = {}
    for p in parcalar:
        for f, v in p: d[f] = v
    return sorted(d.items())


ELMA_META = None


# ---------------------------------------------------------------------------------------------------------------
# Elma yeme (döngü 60 kare = 2 sn): sağ el elmayı göğüsten ağza getirir, 20. karede ısırır, indirip çiğner. Yalnız üst
# gövde: GLB'de omurganın altındaki kemikler kalır (karakter-blender.py 'katman': 'ust'), yürürken 'yuru' ile karışır.
# Çiğneme (v4, kullanıcı: "yüzde çiğneme emote'u olsun"): ısırıktan (20) sonra 24–58 arası çene ≈1,75 Hz (17,1 karelik
# dönem, 2 tam çiğneme) açılıp kapanır, hafifçe yana öğütür; yanaklar ağız doluyken şişer (kemik ölçeği, GLB'ye kemik
# kanalı olarak gider: şekil anahtarı gerekmez). Çene ve yanak kemikleri kafa ve sakal ağında ağırlıklı (ölçüldü).
CIGNE = {'bas': 24, 'hz': 1.75, 'tekrar': 2, 'acik': 7.0}
_P = 30 / CIGNE['hz']
_CB, _CS = CIGNE['bas'], CIGNE['bas'] + CIGNE['tekrar'] * _P
CENE = [[1, 0], [14, 0], [18, 16], [21, 0]] + [[f, round(CIGNE['acik'] * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)), 3)]
                                              for f in range(_CB, int(_CS) + 1)] + [[_CS, 0], [61, 0]]
CENE_YAN = [[1, 0], [_CB, 0]] + [[f, round(2.0 * math.sin(2 * math.pi * (f - _CB) / _P), 3)] for f in range(_CB + 1, int(_CS) + 1)] + [[_CS, 0], [61, 0]]
YANAK = [[1, 1.0], [19, 1.0], [24, 1.14]] + [[f, round(1.14 - 0.04 * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)), 3)]
                                             for f in range(_CB + 1, int(_CS) - 3)] + [[_CS, 1.04], [61, 1.0]]


# ---------------------------------------------------------------------------------------------------------------
# "Kobe" atışı v3: elma yendikten sonra yalnız koçan atılır, kova 2,7 m önde (kullanıcı 03.11). Önceki v2 (50 kare, 2026-11-03 koordinatör geri bildirimi: kol omuz üstüne çıkmıyordu, elma gövdenin önüne
# düşüyor gibiydi). Basketbol jump shot'ı: elma sağ elde göğüste (elma_ye pozu); sol el gelip iki el elmayı tutar (1–8),
# dizler bükülür, gövde öne eğilir (hazırlık, 8–16); sıçrar (ayaklar 19–31 arası ~65 mm kalkar), elma göğüsten alnın
# üstüne çıkar (sağ omuz kalkar), 25. karede ileri-yukarı ~45° yönde elden çıkar (bilek kırılır, parmaklar öne-aşağı);
# takip pozu 25–34 (0,3 sn) kalır, iner, toparlanır. Kök yerinde (sıçrama yalnız yukarı).
# Bırakma 22–28 kare arası tek bir yumuşak geçişin ortasında: el orada en hızlı ve yönü 45° (anahtar karede hız sıfırdır).
COP_ORNEK = Vector((0, -2700 * U, 420 * U))   # önizlemedeki çöp kovası: 2,7 m önde, ağız 420 mm (kullanıcı 03.11: 2,5–3 m)
KOCAN = {'cap': 30, 'boy': 62}                 # atılan elma koçanı (mm): elma bitince elde yalnız o kalır


def elma_firlat():
    son = 50
    BIRAK = 25
    p22, p28 = Vector((-0.06, -0.12, 0.765)), Vector((-0.065, -0.2, 0.845))
    R_yer = [(1, ELMA_ALT), (8, (-0.06, -0.27, 0.5)), (16, (-0.05, -0.27, 0.48)), (20, (-0.06, -0.21, 0.66)), (22, tuple(p22)),
             (28, tuple(p28)), (34, (-0.07, -0.2, 0.84)), (44, (-0.2, -0.07, 0.38))]
    R_yon = [(1, ELMA_TUT), (8, ((0.3, -0.7, 0.7), (0.6, 0, 0.4))), (16, ((0.3, -0.7, 0.7), (0.6, 0, 0.4))),
             (21, ((0.05, 0.35, 1), (0, -0.8, 0.4))), (23, ((0.05, 0.3, 1), (0, -0.8, 0.3))),
             (27, ((0, -1, -0.5), (0, 0.4, -1))), (34, ((0, -1, -0.6), (0, 0.5, -1))), (44, SARK['R'])]
    # Sol el elmanın solunda (destek), bırakmaya dek; sonra yukarıda biraz kalır
    sol = lambda p: tuple(Vector(p) + Vector((0.075, 0.0, -0.005)))
    L_yer = [(1, (0.2, -0.07, 0.38)), (8, sol((-0.06, -0.27, 0.5))), (16, sol((-0.05, -0.27, 0.48))), (20, sol((-0.06, -0.21, 0.66))),
             (22, sol(p22)), (25, (0.06, -0.14, 0.8)), (34, (0.07, -0.13, 0.76)), (44, (0.2, -0.07, 0.38))]
    L_yon = [(1, SARK['L']), (8, ((-0.2, -0.4, 1), (-1, 0, 0))), (22, ((-0.1, -0.2, 1), (-1, 0, 0))), (26, ((0.1, -0.4, 1), (-0.8, -0.3, 0))),
             (34, ((0.1, -0.4, 1), (-0.8, -0.3, 0))), (44, SARK['L'])]
    yukari = 0.045  # ayak IK hedefinin kalkışı (Blender birimi; ayak ucu sitede ölçülür: ayak_kalkis_mm)
    ayak = [(1, (0, 0, 0)), (19, (0, 0, 0)), (20.5, (0, 0, 0.012)), (25, (0, 0, yukari)), (29, (0, 0, 0.012)), (30.5, (0, 0, 0)), (50, (0, 0, 0))]
    S = {'nefes': 0.4,
         'kalca': [(1, (0, 0, 0)), (8, (0, 0.005, -0.012)), (16, (0, 0.012, -0.05)), (21, (0, 0.006, 0.02)), (25, (0, 0.0, 0.052)),
                   (28, (0, 0.0, 0.038)), (31, (0, 0.003, 0.005)), (34, (0, 0.006, -0.025)), (40, (0, 0.003, -0.008)), (50, (0, 0, 0))],
         'ayak': {'L': ayak, 'R': ayak},
         'el': {'R': {'ik': [[1, 1], [50, 1]], 'nokta': ELMA_EL, 'yer': R_yer, 'yon': R_yon,
                      'dirsek': [(1, (-0.4, 0.05, 0.3)), (16, (-0.35, 0.05, 0.3)), (22, (-0.3, 0.05, 0.4)), (28, (-0.3, 0.0, 0.45)),
                                 (34, (-0.3, 0.0, 0.45)), (44, (-0.4, 0.1, 0.3))]},
                'L': {'ik': [[1, 0], [6, 1], [34, 1], [44, 0]], 'yer': L_yer, 'yon': L_yon,
                      'dirsek': [(1, (0.4, 0.05, 0.3)), (22, (0.35, 0.05, 0.4)), (44, (0.4, 0.05, 0.3))]}},
         'parmak': {'R': [[1, ELMA_KIVRIM[0]], [16, 0.3], [22, 0.2], [26, 0.05], [34, 0.15], [44, 0.15]],
                    'L': [[1, 0.15], [8, 0.2], [24, 0.2], [28, 0.05], [44, 0.15]]},
         'basparmak': {'R': [[1, ELMA_KIVRIM[1]], [22, 0.3], [26, 0], [50, 0]]},
         'don': {'omurga': {'X': [[1, 0], [8, 6], [16, 12], [22, -2], [26, -6], [34, -4], [44, 0]]},
                 'göğüs': {'X': [[1, 0], [8, 4], [16, 8], [22, -3], [26, -5], [34, -4], [44, 0]], 'Z': [[1, 0], [16, 4], [26, 0], [50, 0]]},
                 'omuz.R': {'Y': [[1, 0], [16, 0], [22, 16], [34, 16], [44, 0]]},
                 'omuz.L': {'Y': [[1, 0], [16, 0], [22, -8], [34, -8], [44, 0]]},
                 'kafa': {'X': [[1, 0], [16, 4], [22, -6], [28, -8], [34, -6], [44, 0]]}},
         'bak': {'agirlik': [[1, 0], [8, 0.5], [36, 0.5], [46, 0]], 'yer': [(1, tuple(COP_ORNEK)), (50, tuple(COP_ORNEK))]},
         'elma': {'kocan': [[1, 1], [BIRAK + 1, 0]]}}   # v5: elde koçan (elma_ye'nin sonu), bırakınca site uçan koçanı alır
    S['el']['R']['dirsek'][0] = (1, DIRSEK_TUT['R'])
    act = kol_coz('elma_firlat', son, S, {'R': [(22, 28)]})
    p0, p1, p2 = elma_nokta(act, BIRAK - 1), elma_nokta(act, BIRAK), elma_nokta(act, BIRAK + 1)
    v_el = (p2 - p0) * 15 * MM                          # avucun bırakma anındaki hızı, mm/sn
    # Örnek kovaya 45°'lik yay: yatay uzaklık d (ileri), yükseklik farkı h; v² = g d² / (d − h) (tan 45° = 1)
    d = (p1.y - COP_ORNEK.y) * MM; h = (COP_ORNEK.z - p1.z) * MM; g = 9810.0
    v = math.sqrt(g * d * d / (d - h))
    hiz = [0.0, -v / math.sqrt(2), v / math.sqrt(2)]
    aci = math.degrees(math.atan2(v_el.z, -v_el.y))
    ayak_kalk = max(nokta(act, f, 'ayak_ucu.L').z for f in range(1, son + 1)) - nokta(act, 1, 'ayak_ucu.L').z
    meta = {'sure': round(son / 30, 2), 'birak': BIRAK, 'takip': [BIRAK, BIRAK + 9], 'el': mm(p1),
            'hiz': [round(x) for x in hiz], 'el_hiz': [round(x) for x in v_el], 'el_aci': round(aci, 1),
            'cop_ornek': mm(COP_ORNEK), 'kocan': {**KOCAN, 'kemik': 'el.R', 'el_yerel': ELMA_META['el_yerel'], 'not': 'koçan elmanın merkezinde, boyu kemiğin z ekseninde'}, 'sicrama': [19, 31], 'ayak_kalkis_mm': round(ayak_kalk * MM),
            'hata_mm': {'birak': el_hatasi(act, S, 'R', BIRAK - 1, BIRAK + 1)},
            'not': 'el: bırakma karesinde elmanın merkezi (karakter yereli, mm); hiz: oradan 45° ileri-yukarı atışla '
                   'cop_ornek ağzına inen hız (mm/sn, g = 9810); el_hiz: avucun gerçek hızı, el_aci: onun yataydan açısı; '
                   'takip: bilek kırık takip pozunun kaldığı kareler'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    return act


# ---------------------------------------------------------------------------------------------------------------
# Kitaplığa yaslanma (150 kare): sol omzu ile solundaki dik yüzeye (kitaplığın yan yüzü) yaslanır, kollarını kavuşturur,
# sağ ayağı solun önünden çaprazlar; 40–120 arası döngü (nefes, etrafa bakış), sonra doğrulur.
def yaslan():
    son = 150
    S = {'nefes': 1.2,
         'kalca': [(1, (0, 0, 0)), (24, (0.05, 0.01, -0.012)), (40, (0.055, 0.012, -0.014)), (120, (0.055, 0.012, -0.014)), (138, (0.01, 0, -0.004)), (150, (0, 0, 0))],
         'ayak': {'R': [(1, (0, 0, 0)), (14, (0, 0, 0)), (16, (0.004, -0.002, 0.02)), (22, (0.06, -0.03, 0.045)), (28, (0.106, -0.067, 0.02)),
                        (30, (0.11, -0.07, 0.005)), (120, (0.11, -0.07, 0.005)), (122, (0.106, -0.067, 0.02)), (128, (0.06, -0.03, 0.045)),
                        (136, (0.004, -0.002, 0.02)), (138, (0, 0, 0)), (150, (0, 0, 0))]},
         'don': {'omurga': {'Y': [[1, 0], [24, 11], [40, 12], [120, 12], [140, 0]], 'X': [[1, 0], [40, -3], [120, -3], [140, 0]]},
                 'göğüs': {'Y': [[1, 0], [24, 8], [40, 9], [120, 9], [140, 0]], 'Z': [[1, 0], [40, 0], [70, -4], [100, 2], [120, 0]]},
                 'kafa': {'Y': [[1, 0], [30, -14], [120, -14], [140, 0]], 'Z': [[1, 0], [44, 0], [56, -22], [76, -22], [88, 14], [104, 14], [116, 0]],
                          'X': [[1, 0], [56, 4], [76, 4], [88, -3], [104, -3], [116, 0]]},
                 'ayak.R': {'X': [[14, 0], [30, 28], [120, 28], [134, 0]]}},
         # Kollar kavuşturulur: sol el sağ kolun altında, sağ el sol kolun üstünde
         'el': {'L': {'ik': [[1, 0], [10, 0], [30, 1], [124, 1], [144, 0]],
                      'yer': [(1, (0.2, -0.07, 0.38)), (30, (-0.1, -0.22, 0.52)), (124, (-0.1, -0.22, 0.52)), (144, (0.2, -0.07, 0.38))],
                      'yon': [(1, SARK['L']), (30, ((-1, -0.2, 0), (0, 1, 0.2))), (124, ((-1, -0.2, 0), (0, 1, 0.2))), (144, SARK['L'])],
                      'dirsek': [(1, (0.4, 0.05, 0.3)), (30, (0.4, -0.1, 0.35)), (124, (0.4, -0.1, 0.35)), (150, (0.4, 0.05, 0.3))]},
                'R': {'ik': [[1, 0], [12, 0], [32, 1], [122, 1], [142, 0]],
                      'yer': [(1, (-0.2, -0.07, 0.38)), (32, (0.11, -0.245, 0.5)), (122, (0.11, -0.245, 0.5)), (142, (-0.2, -0.07, 0.38))],
                      'yon': [(1, SARK['R']), (32, ((1, 0.1, 0.1), (0, 1, 0))), (122, ((1, 0.1, 0.1), (0, 1, 0))), (142, SARK['R'])],
                      'dirsek': [(1, (-0.4, 0.05, 0.3)), (32, (-0.4, -0.1, 0.35)), (122, (-0.4, -0.1, 0.35)), (150, (-0.4, 0.05, 0.3))]}},
         'parmak': {'L': [[1, 0.15], [30, 0.4], [124, 0.4], [144, 0.15]], 'R': [[1, 0.15], [32, 0.4], [122, 0.4], [142, 0.15]]}}
    act = kol_coz('yaslan', son, S)
    # Temas düzlemi: döngü ortasında gövdenin (kazak, kol) en soldaki noktası
    kare_ayarla(act, 80)
    dg = bpy.context.evaluated_depsgraph_get(); en = -1
    for o in rig.children:
        if o.type != 'MESH' or o.name not in ('kazak',): continue
        e = o.evaluated_get(dg); me = e.to_mesh()
        en = max(en, max((e.matrix_world @ v.co).x for v in me.vertices)); e.to_mesh_clear()
    meta = {'sure': round(son / 30, 2), 'giris': [1, 40], 'dongu': [40, 120], 'cikis': [120, 150],
            'temas': {'taraf': 'sol', 'duzlem_x': round(en * MM), 'omuz': mm(nokta(act, 80, 'üst_kol.L'))},
            'not': 'kitaplığın yan yüzü karakterin solunda, x = duzlem_x mm düzleminde (gövdenin en sol noktası); döngü bölümü tekrarlanır'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    return act


# ---------------------------------------------------------------------------------------------------------------
# Rafa yaslanıp bakma (120 kare, v3; kullanıcı 03.11: raf duraklarında mekanik eğilme yerine rafa/duvara yaslanır):
# sağ ön kolu ve dirseği önündeki rafın kenarına dayar (raf üstü 820 mm, kökün 270 mm önü), ağırlığını sağ kola ve sol
# bacağa verir: kalça sola kayar, sağ diz kırılır ve sağ ayak ucuna basar; göğüs rafa doğru eğilir, baş ürüne döner,
# sol el beline. 30–96 arası döngü (nefes, baş ürünü süzer); sonra doğrulur.
RAF = {'z': 820 * U, 'on': -270 * U}


def egil_bak():
    son = 120
    dirsek_yer = Vector((-0.07, RAF['on'] - 0.02, RAF['z'] + 0.012))     # ön kolun rafta yattığı yer (bilek)
    S = {'nefes': 1.0,
         'kalca': [(1, (0, 0, 0)), (14, (0.02, -0.01, -0.006)), (30, (0.035, -0.02, -0.014)), (96, (0.035, -0.02, -0.014)),
                   (110, (0.01, 0, -0.004)), (120, (0, 0, 0))],
         'ayak': {'R': [(1, (0, 0, 0)), (12, (0, 0, 0)), (14, (0, -0.004, 0.012)), (20, (0.005, -0.03, 0.03)), (24, (0.008, -0.04, 0.012)),
                        (26, (0.008, -0.04, 0.006)), (98, (0.008, -0.04, 0.006)), (100, (0.008, -0.04, 0.012)), (106, (0.004, -0.02, 0.03)),
                        (110, (0, -0.004, 0.012)), (112, (0, 0, 0)), (120, (0, 0, 0))]},
         'don': {'omurga': {'X': [[1, 0], [30, 12], [96, 12], [114, 0]], 'Y': [[1, 0], [30, 6], [96, 6], [114, 0]], 'Z': [[1, 0], [30, 6], [96, 6], [114, 0]]},
                 'göğüs': {'X': [[1, 0], [30, 10], [60, 12], [96, 10], [114, 0]], 'Y': [[1, 0], [30, 4], [96, 4], [114, 0]]},
                 'boyun': {'X': [[1, 0], [30, 4], [96, 4], [114, 0]]},
                 'kafa': {'X': [[1, 0], [30, 10], [50, 14], [70, 8], [96, 12], [114, 0]], 'Z': [[1, 0], [30, 12], [50, 20], [66, 4], [82, 16], [96, 12], [114, 0]],
                          'Y': [[1, 0], [30, -6], [96, -6], [114, 0]]},
                 'ayak.R': {'X': [[12, 0], [24, 22], [100, 22], [112, 0]]}},
         'el': {'R': {'ik': [[1, 0], [10, 0], [26, 1], [98, 1], [112, 0]],
                      'yer': [(1, (-0.2, -0.07, 0.38)), (18, (-0.14, -0.2, 0.52)), (26, tuple(dirsek_yer)), (98, tuple(dirsek_yer)),
                              (106, (-0.14, -0.2, 0.52)), (112, (-0.2, -0.07, 0.38))],
                      'yon': [(1, SARK['R']), (26, ((0.8, -0.4, 0), (0, 0, -1))), (98, ((0.8, -0.4, 0), (0, 0, -1))), (112, SARK['R'])],
                      'dirsek': [(1, (-0.4, 0.05, 0.3)), (26, (-0.3, -0.1, 0.25)), (98, (-0.3, -0.1, 0.25)), (120, (-0.4, 0.05, 0.3))]},
                'L': {'ik': [[1, 0], [12, 0], [30, 1], [96, 1], [114, 0]],
                      'yer': [(1, (0.2, -0.07, 0.38)), (30, (0.17, 0.02, 0.42)), (96, (0.17, 0.02, 0.42)), (114, (0.2, -0.07, 0.38))],
                      'yon': [(1, SARK['L']), (30, ((-0.3, 0.6, -0.7), (-1, 0, 0.2))), (96, ((-0.3, 0.6, -0.7), (-1, 0, 0.2))), (114, SARK['L'])],
                      'dirsek': [(1, (0.4, 0.05, 0.3)), (30, (0.45, 0.1, 0.4)), (120, (0.4, 0.05, 0.3))]}},
         'parmak': {'R': [[1, 0.15], [26, 0.35], [98, 0.35], [112, 0.15]], 'L': [[1, 0.15], [30, 0.2], [96, 0.2], [114, 0.15]]}}
    act = kol_coz('egil_bak', son, S, {'R': [(26, 98)]})
    goz = (nokta(act, 60, 'göz.L') + nokta(act, 60, 'göz.R')) / 2
    meta = {'sure': round(son / 30, 2), 'giris': [1, 30], 'dongu': [30, 96], 'cikis': [96, 120],
            'raf': {'ust_z': round(RAF['z'] * MM), 'on_kenar': round(-RAF['on'] * MM), 'kol': mm(dirsek_yer)}, 'goz': mm(goz),
            'not': 'raf üstü ust_z mm, ön kenarı kökün on_kenar mm önünde; sağ ön kol kol noktasında rafa yaslanır; döngü bölümü tekrarlanır'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    return act


# ---------------------------------------------------------------------------------------------------------------
# Kumanda (60 kare): sağ elde kumanda (avuçta, uzun ekseni parmak yönünde); kolunu öne kaldırıp TV'ye doğrultur, 34.
# karede başparmakla basar, indirir.
# v4 (kullanıcı 03.11: "masaya koyacaksa oraya kadar elde"): kumanda sağ öndeki sehpada (üstü 450 mm) durur; dizlerini
# kırıp uzanır, 16. karede alır, TV'ye doğrultup 40. karede basar, 62. karede sehpaya geri bırakır. Kumandanın merkezi
# tutma.R kemiğinin başında (sitede de öyle), sehpadayken uzun ekseni ileri.
MASA = {'z': 0.327, 'nokta': Vector((-0.2, -0.17, 0.327 + 0.008))}   # sehpa üstü 0,327 bl = 490 mm; kumanda merkezi 8 mm üstünde


def kumanda():
    son = 80
    AL, BAS, BIRAK = 16, 40, 62
    hedef = Vector((-0.1, -0.27, 0.6))
    K = MASA['nokta']
    TUT = ((0.25, -1, 0.15), (1, 0, 0))
    MASA_YON = ((0.12, -1, -0.12), (1, 0, -0.1))    # sehpadan alırken: parmaklar ileri, avuç içe, kumanda yatay
    S = {'nefes': 0.6,
         'kalca': [(1, (0, 0, 0)), (8, (0.006, 0.0, -0.02)), (AL, (0.015, -0.004, -0.07)), (24, (0.016, -0.004, -0.01)), (BAS, (0.02, -0.005, -0.006)),
                   (52, (0.014, -0.004, -0.03)), (BIRAK, (0.015, -0.004, -0.07)), (70, (0.004, 0, -0.012)), (80, (0, 0, 0))],
         'ayak': {'R': [(1, (0, 0, 0)), (80, (0, 0, 0))]},
         'el': {'R': {'ik': [[1, 0], [6, 1], [70, 1], [80, 0]],
                      'yer': [(1, (-0.2, -0.07, 0.38)), (10, tuple(K + Vector((0, 0.02, 0.05)))), (AL, tuple(K)), (24, (-0.16, -0.18, 0.45)),
                              (32, tuple(hedef)), (48, tuple(hedef)), (56, tuple(K + Vector((0, 0.02, 0.05)))), (BIRAK, tuple(K)),
                              (68, tuple(K + Vector((-0.01, 0.04, 0.05)))), (80, (-0.2, -0.07, 0.38))],
                      'yon': [(1, SARK['R']), (10, MASA_YON), (AL, MASA_YON), (32, TUT), (48, TUT), (56, MASA_YON), (BIRAK, MASA_YON), (68, MASA_YON), (80, SARK['R'])],
                      'dirsek': [(1, (-0.4, 0.05, 0.3)), (80, (-0.4, 0.05, 0.3))]}},
         'parmak': {'R': [[1, 0.15], [10, 0.05], [AL - 1, 0.1], [AL + 2, 0.6], [BIRAK - 1, 0.6], [BIRAK + 3, 0.1], [80, 0.15]]},
         'basparmak': {'R': [[1, 0], [AL - 1, 0], [AL + 2, 0.2], [BAS - 6, 0.2], [BAS - 1, 0.9], [BAS + 2, 0.9], [BAS + 6, 0.2], [BIRAK - 1, 0.2], [BIRAK + 3, 0], [80, 0]]},
         'don': {'omurga': {'X': [[1, 0], [AL, 16], [28, 2], [50, 2], [BIRAK, 16], [74, 0]], 'Y': [[1, 0], [AL, 4], [32, 4], [48, 4], [BIRAK, 4], [80, 0]]},
                 'göğüs': {'X': [[1, 0], [AL, 8], [28, 0], [50, 0], [BIRAK, 8], [74, 0]], 'Z': [[1, 0], [AL, 8], [32, 6], [48, 6], [BIRAK, 8], [80, 0]],
                           'Y': [[1, 0], [32, -3], [48, -3], [80, 0]]},
                 'omuz.R': {'Y': [[1, 0], [32, 6], [48, 6], [60, 0]]},
                 'omuz.L': {'Y': [[1, 0], [16, 3], [64, 3], [80, 0]]}},
         'bak': {'agirlik': [[1, 0], [8, 0.85], [72, 0.85], [80, 0]],
                 'yer': [(1, tuple(K)), (AL, tuple(K)), (28, (0, -1.38, 0.8)), (50, (0, -1.38, 0.8)), (BIRAK - 4, tuple(K)), (80, tuple(K))]}}
    act = kol_coz('kumanda', son, S, {'R': [(AL, AL), (32, 48), (BIRAK, BIRAK)]})
    meta = {'sure': round(son / 30, 2), 'bas': BAS, 'al': AL, 'birak': BIRAK,
            'kumanda': {'kemik': 'tutma.R', 'tut': [AL, BIRAK], 'masa': mm(K), 'masa_ust': round(MASA['z'] * MM),
                        'not': 'uzun ekseni kemiğin y ekseni (parmak yönü); al–birak arası elde, dışında masa noktasında'},
            'uc': mm(nokta(act, BAS, 'tutma.R')), 'yon': [round(x, 3) for x in (nokta(act, BAS, 'tutma.R') - nokta(act, BAS, 'el.R')).normalized()],
            'hata_mm': {'dogrult': el_hatasi(act, S, 'R', 32, 48), 'al': el_hatasi(act, S, 'R', AL, AL), 'birak': el_hatasi(act, S, 'R', BIRAK, BIRAK)}}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    return act


# ---------------------------------------------------------------------------------------------------------------
# Kutu oyunu alma (105 kare): önündeki raftan (raf üstü kökün 300 mm önünde, yerden 660 mm) yatık duran kutuyu (297 ×
# 297 × 71 mm) iki eliyle yanlarından alır, kapağını yüzüne çevirip bakar, rafa geri koyar.
KUTU = {'en': 297 * U, 'kal': 71 * U, 'raf': Vector((0, -(300 + 297 / 2) * U, 660 * U))}


def kutu_al():
    son = 105
    en, kal = KUTU['en'], KUTU['kal']
    raf_m = KUTU['raf'] + Vector((0, 0, kal / 2))   # kutu merkezi rafta
    goz_m = Vector((0, -0.21, 0.64))                  # bakarken kutu merkezi (göz önü)
    # Kutu dönüşü (x ekseni etrafında): rafta yatık 0°, bakarken kapağı yüze dönük 70°
    kd = [[1, 0], [30, 0], [50, 70], [66, 70], [84, 0], [105, 0]]
    km = [(1, tuple(raf_m)), (30, tuple(raf_m)), (40, tuple(raf_m + Vector((0, 0.04, 0.05)))), (50, tuple(goz_m)), (66, tuple(goz_m)),
          (76, tuple(raf_m + Vector((0, 0.04, 0.05)))), (84, tuple(raf_m)), (105, tuple(raf_m))]
    def kutu_mat(f):
        return Matrix.Translation(vanahtar(km, f)) @ Matrix.Rotation(math.radians(anahtar(kd, f)), 4, 'X')
    def kenar(f, s):  # kutunun yan kenarında avuç noktası
        return kutu_mat(f) @ Vector((s * (en / 2 + 0.012), 0.02, 0))
    fs = [1, 12, 22] + list(range(26, 92, 4)) + [96, 105]
    def el(t, s):
        yer, yon = [], []
        for f in fs:
            if f == 1 or f == 105: yer.append((f, (0.2 * s, -0.07, 0.38))); yon.append((f, SARK[t])); continue
            g = 26 if f <= 12 else 88 if f >= 96 else f
            yer.append((f, tuple(kenar(g, s) + (Vector((0.04 * s, 0.06, 0.04)) if g != f else Vector()))))
            R = kutu_mat(g).to_3x3()
            yon.append((f, (tuple(R @ Vector((0, -1, 0.15))), tuple(R @ Vector((-s, 0, 0))))))
        return {'ik': [[1, 0], [12, 1], [96, 1], [105, 0]], 'yer': yer, 'yon': yon, 'dirsek': [(1, (0.42 * s, 0.05, 0.3)), (105, (0.42 * s, 0.05, 0.3))]}
    S = {'nefes': 0.7,
         'el': {'L': el('L', 1), 'R': el('R', -1)},
         'kalca': [(1, (0, 0, 0)), (24, (0.012, 0.01, -0.012)), (50, (-0.015, 0.005, -0.004)), (66, (-0.018, 0.005, -0.004)), (76, (0.01, 0.01, -0.012)), (105, (0, 0, 0))],
         'parmak': {t: [[1, 0.15], [20, 0.1], [28, 0.45], [86, 0.45], [94, 0.1], [105, 0.15]] for t in 'LR'},
         'basparmak': {t: [[1, 0], [28, 0.3], [86, 0.3], [94, 0], [105, 0]] for t in 'LR'},
         'don': {'omurga': {'X': [[1, 0], [24, 10], [34, 8], [50, 0], [66, 0], [80, 10], [92, 4], [105, 0]]},
                 'göğüs': {'X': [[1, 0], [24, 8], [50, 0], [66, 0], [80, 8], [105, 0]]},
                 'kafa': {'X': [[1, 0], [24, 8], [50, 14], [58, 10], [66, 14], [80, 8], [105, 0]], 'Z': [[50, 0], [56, 6], [62, -4], [66, 0]]},
                 'omuz.L': {'Y': [[1, 0], [30, 3], [84, 3], [105, 0]]}, 'omuz.R': {'Y': [[1, 0], [30, -3], [84, -3], [105, 0]]}},
         'bak': {'agirlik': [[1, 0], [14, 0.6], [92, 0.6], [105, 0]], 'yer': [(f, tuple(v)) for f, v in km]}}
    act = kol_coz('kutu_al', son, S, {'L': [(26, 88)], 'R': [(26, 88)]})
    # Kutunun sağ ele göre yeri (al–birak arası kutu sağ ele bağlanır): sağ el kemiğinin yerelinde kutu merkezi ve dönüşü
    kare_ayarla(act, 40)
    yer_ = rig.pose.bones['el.R'].matrix.inverted() @ kutu_mat(40)
    t_, q_, _ = yer_.decompose()
    meta = {'sure': round(son / 30, 2), 'al': 30, 'birak': 84, 'bak': [50, 66],
            'kutu': {'olcu': [297, 297, 71], 'raf_merkez': mm(raf_m), 'kemik': 'el.R', 'el_yerel': mm(t_), 'el_yerel_q': [round(x, 4) for x in (q_.x, q_.y, q_.z, q_.w)],
                     'goz_merkez': mm(goz_m)},
            'hata_mm': {'sol': el_hatasi(act, S, 'L', 30, 84), 'sag': el_hatasi(act, S, 'R', 30, 84)},
            'not': 'raf_merkez: rafta yatık kutunun merkezi (karakter yereli, mm); al–birak arası kutu el.R kemiğine el_yerel (mm, q x,y,z,w) ile bağlanır'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    return act


# ===============================================================================================================
# v5 (2026-11-03, kullanıcı geri bildirimi): yüz (açık göz + kırpma, ağız kemiği), elma ısırık adımları GLB'de, kol
# tutuşu (el–göğüs ≥ 180 mm, dirsek 70–130°), canlılık (yay, nefes, ağırlık), buzdolabı kapağı el ile eşzamanlı ve
# rafa gerçekten giren el, yeni klipler: tv_armut, diz_cok, kutu_al_diz, diz_kalk, kitap_al_alt/orta/ust.
# ===============================================================================================================

# ---- elma kemikleri ve ağları (GLB'ye gider; three.js'te kemik ölçeği = görünürlük, kod gerekmez) ----
# 'elma' kemiği el.R'nin çocuğu, elmanın merkezinde (ELMA_EL); ekseni (kemik y) dinlenmede avuç yönü (−y): avuç
# yukarı bakınca sap yukarı. Altında beş kemik: elma_g0 (bütün), g1–g3 (1–3 ısırık), elma_kocan; her birine bir ağ
# bağlı. Klip 'elma' anahtarıyla hangisinin ölçeği 1 (görünür) olduğunu yazar; anahtarı olmayan klipte
# karakter-blender.py hepsini 0'a sabitler. Isırık yeri sarımtırak iç malzeme ('Elma İç').
ELMA_R = 38 / MM                     # Ø 76 mm
ELMA_HEDEF = [1.0, 0.72, 0.47, 0.24]  # g0–g3 hacim oranı (her ısırık ≥ çeyrek)
ISIRIK_ACI = [0, 125, 245]           # ısırıkların elma ekseni etrafındaki açısı (derece; ψ = atan2(x, z))


def _malz(ad, renk):
    m = bpy.data.materials.get(ad) or bpy.data.materials.new(ad)
    m.use_nodes = True; m.diffuse_color = (*renk, 1)
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if b: b.inputs['Base Color'].default_value = (*renk, 1); b.inputs['Roughness'].default_value = 0.55
    return m


def _elma_bm():
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=18, radius=ELMA_R)
    for v in bm.verts:   # kemik y = elma ekseni: hafif basık, tepede ve dipte çukur
        c = v.co; y = c.y / ELMA_R
        c.y *= 0.9; k = 1 - 0.18 * math.exp(-((1 - abs(y)) / 0.12) ** 2)
        c.x *= k; c.z *= k
        if abs(y) > 0.97: c.y *= 0.82
    return bm


def _bm_ob(ad, bm, mats):
    me = bpy.data.meshes.new(ad); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(ad, me); bpy.context.scene.collection.objects.link(o); return o


def _isir(ob, merkezler, rb):
    """ob'dan rb yarıçaplı kürelerle ısırık (EXACT boolean, uygulanmış ağ); kesik yüzlere iç malzeme (1)"""
    import bmesh
    dg = bpy.context.evaluated_depsgraph_get(); kes = []
    for i, c in enumerate(merkezler):
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=rb)
        k = _bm_ob(f'_kes{i}', bm, []); k.location = c; kes.append(k)
        md = ob.modifiers.new(f'k{i}', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = k; md.solver = 'EXACT'
    dg.update()
    e = ob.evaluated_get(dg); me = bpy.data.meshes.new_from_object(e)
    for md in list(ob.modifiers): ob.modifiers.remove(md)
    for k in kes: bpy.data.objects.remove(k)
    eski = ob.data; ob.data = me
    for p in me.polygons:
        c = p.center
        if any((c - Vector(m)).length < rb * 1.03 for m in merkezler): p.material_index = 1
    bpy.data.meshes.remove(eski)
    import bmesh as B
    bm = B.new(); bm.from_mesh(me); hac = bm.calc_volume(); bm.free()
    return hac


def agiz_beyaz_kur():
    """Ağız: siyah kenar + içi beyaz (kullanıcı). Ağız ağının kopyası küçültülür (en 0,74, boy 0,5)
    (ağız yüze göre kavisli şerit: derinlik ölçeklenmez, 0,9 mm öne alınır), beyaz malzeme; aynı 'ağız' köşe grubu ve armatür: ağız kemiği açınca ikisi birlikte büyür, kenarda siyah şerit kalır."""
    eski = bpy.data.objects.get('ağız beyaz')
    if eski: bpy.data.objects.remove(eski)
    a = bpy.data.objects['ağız']; o = a.copy(); o.data = a.data.copy(); o.name = 'ağız beyaz'
    for c in a.users_collection: c.objects.link(o)
    me = o.data; n = len(me.vertices)
    c = sum((v.co for v in me.vertices), Vector()) / n
    for v in me.vertices:
        d = v.co - c; v.co = c + Vector((d.x * 0.74, d.y, d.z * 0.5)) + Vector((0, -0.0009, 0))   # eğri şerit: derinlik korunur, öne alınır
    me.materials.clear(); me.materials.append(_malz('Ağız Beyaz', (0.95, 0.94, 0.9)))
    return o


def elma_kur():
    """Elma kemikleri + ağları (tekrar çalıştırmak güvenli). Hacim oranları ölçülür, döndürülür."""
    for o in [o for o in bpy.data.objects if o.name.startswith(('Elma ', '_kes'))]: bpy.data.objects.remove(o)
    bpy.context.view_layer.objects.active = rig
    for o in bpy.context.view_layer.objects: o.select_set(o == rig)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones
    for n in ['elma'] + ELMA_KEMIK:
        if n in eb: eb.remove(eb[n])
    h = REST['el.R'].translation + Vector(ELMA_EL)
    k = eb.new('elma'); k.head = h; k.tail = h + Vector((0, -0.03, 0)); k.roll = 0; k.parent = eb['el.R']; k.use_deform = False
    for n in ELMA_KEMIK:
        c = eb.new(n); c.head = h; c.tail = h + Vector((0, -0.02, 0)); c.roll = 0; c.parent = k; c.use_deform = False
    bpy.ops.object.mode_set(mode='OBJECT')
    for b in rig.data.bones: REST[b.name] = b.matrix_local.copy()
    for n in ['elma'] + ELMA_KEMIK: rig.pose.bones[n].rotation_mode = 'QUATERNION'
    kab, ic, sap = _malz('Elma Kabuk', (0.62, 0.06, 0.05)), _malz('Elma İç', (0.96, 0.86, 0.55)), _malz('Elma Sap', (0.32, 0.2, 0.1))
    import bmesh
    def bagla_(o, kemik):
        o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = kemik
        o.matrix_parent_inverse = Matrix.Translation((0, -rig.data.bones[kemik].length, 0))
    def sapli(bm):   # sap: tepede ince silindir
        r = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.0022, radius2=0.0016, depth=0.014)
        for v in r['verts']: v.co = Vector((v.co.x, v.co.z + ELMA_R * 0.82 + 0.004, v.co.y))
        return r
    hac = []
    bm = _elma_bm(); o0 = _bm_ob('Elma g0', bm, [kab, ic, sap])
    import bmesh as B
    b2 = B.new(); b2.from_mesh(o0.data); V0 = b2.calc_volume(); b2.free(); hac.append(1.0)
    merk = []; onceki = o0
    for i, psi in enumerate(ISIRIK_ACI):
        # ısırık: merkezi elmanın kabuğunda (eksenden R), yarıçapı hedef hacme ikiye bölmeyle (ağız ne kadar büyük ısırır)
        hedef = ELMA_HEDEF[i + 1] * V0; a, b = ELMA_R * 0.3, ELMA_R * 1.3
        c = (ELMA_R * 1.02 * math.sin(math.radians(psi)), 0.0, ELMA_R * 1.02 * math.cos(math.radians(psi)))
        for _ in range(12):
            rb = (a + b) / 2
            t = onceki.copy(); t.data = onceki.data.copy(); bpy.context.scene.collection.objects.link(t)
            v = _isir(t, [c], rb)
            me_ = t.data; bpy.data.objects.remove(t); bpy.data.meshes.remove(me_)
            if v > hedef: a = rb
            else: b = rb
        rb = (a + b) / 2
        o = onceki.copy(); o.data = onceki.data.copy(); o.name = f'Elma g{i + 1}'; bpy.context.scene.collection.objects.link(o)
        v = _isir(o, [c], rb); merk.append((c, rb)); hac.append(round(v / V0, 3)); onceki = o
    # koçan: çekirdek evi (iki uçta genişleyen silindir) + sap
    bm = bmesh.new()
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.006, radius2=0.006, depth=0.044)
    for v in r['verts']:
        y = v.co.z; g = 1 + 1.6 * (abs(y) / 0.022) ** 3
        v.co = Vector((v.co.x * g, y, v.co.y * g))
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.y - e.verts[1].co.y) > 0.01], cuts=4)
    for v in bm.verts:
        y = v.co.y; rr = math.hypot(v.co.x, v.co.z)
        if rr > 1e-6:
            hedef = 0.0055 * (1 + 2.2 * (abs(y) / 0.022) ** 4); v.co.x *= hedef / rr; v.co.z *= hedef / rr
    sapli(bm)
    ko = _bm_ob('Elma koçan', bm, [ic, ic, sap])
    for p in ko.data.polygons:
        if p.center.y > 0.024: p.material_index = 2
    for o in [o for o in bpy.data.objects if o.name.startswith('Elma g')]:   # sap bütün elmada ve ısırıklarda
        bm = bmesh.new(); bm.from_mesh(o.data); n0 = len(bm.faces); sapli(bm)
        for f_ in bm.faces[n0:] if hasattr(bm.faces, '__getitem__') else []: pass
        bm.faces.ensure_lookup_table()
        for f_ in list(bm.faces)[n0:]: f_.material_index = 2
        bm.to_mesh(o.data); bm.free()
    for kn, on in zip(ELMA_KEMIK, ['Elma g0', 'Elma g1', 'Elma g2', 'Elma g3', 'Elma koçan']):
        o = bpy.data.objects[on]
        for c in list(o.users_collection): c.objects.unlink(o)
        rig.users_collection[0].objects.link(o)
        bagla_(o, kn)
        for p in o.data.polygons: p.use_smooth = True
    print('ELMA hacim oranları', hac)
    return {'hacim': hac, 'isirik_aci': ISIRIK_ACI, 'isirik_r_mm': [round(r * MM) for _, r in merk]}


# ---- kol ölçüsü (v5): el–göğüs merkezi ve dirsek açısı, tutuş kareleri ----
def gogus_merkezi():
    g = rig.pose.bones['göğüs']; return (g.head + g.tail) / 2


def tutus_olc(act, t, kareler, nokta=None):
    out = []
    for f in kareler:
        kare_ayarla(act, f)
        u = rig.pose.bones['üst_kol.' + t].head; o_ = rig.pose.bones['ön_kol.' + t].head; e = rig.pose.bones['el.' + t].head
        out.append(((el_noktasi(t, nokta) - gogus_merkezi()).length * MM, math.degrees((u - o_).angle(e - o_))))
    return {'el_gogus_mm': [round(min(d for d, _ in out)), round(max(d for d, _ in out))],
            'dirsek_derece': [round(min(a for _, a in out)), round(max(a for _, a in out))],
            'gecti': all(d >= 180 for d, _ in out) and all(70 <= a <= 130 for _, a in out)}


def tekrarla(k, n, P):
    """[[kare, değer]] tek döngüyü n kez P kare arayla tekrarlar (aynı karede sonuncusu)"""
    d = {}
    for c in range(n):
        for f, v in k: d[f + c * P] = v
    return [[f, v] for f, v in sorted(d.items())]


# ---- buzdolabı (v6, 2026-11-04; kullanıcı: "kapak karakterin içinden geçiyor") ----
# Gerçek model: assets/oda/oda-esya.glb 'buzdolabi' (en 500, derinlik 550, boy 850, raf 440). Kapak (orijini menteşede):
# panel 500 × 848, dış yüzü 26 mm (kol 47 mm, kapağın serbest ucunda 454–474), iç yüzde kapak rafları 100 mm (280–800
# yükseklikte, uçlardan 55 mm içeride). Menteşe karakterin solunda, kapak karaktere doğru açılır (−y'den +y'ye süpürür).
# v5'te kök menteşenin 456 mm uzağındaydı (kapak 500 mm): kapak her açılış ve kapanışta gövdeden geçiyordu, karakterin
# geri adımı yetişmiyordu. v6: karakter kapağın SÜPÜRME YAYININ DIŞINDA, kolun sağ önünde durur (menteşeye ~760 mm,
# yay 500 + gövde payı); kolu SOL eliyle çekip açar (kapak gövdenin önünden geçer), kapak tam açılınca sola, dolabın önüne
# yan adım atıp sağ eliyle elmayı alır, sol eliyle kapağın iç yüzünden tutup kapatmaya başlar, bırakır ve kapak kendi
# kapanırken sağa, yayın dışına geri adım atar. Kapak eğrisi (meta 'kapak') bu zamanlamayla ölçülerek kurulur; her karede
# kapağın hacmi ile gövdenin kesişmesi ölçülür (bz_kesisim).
# Menteşe koordinatları (mm): menteşe orijin, kapalı kapak −x yönünde uzanır, dış yüzü +y (karaktere).
BZV6 = {'B0': Vector((-800, 330, 0)) * U,      # başlangıç/bitiş: gövde (kök) menteşeye göre (yayın dışı)
        'IN': Vector((-440, 160, 0)) * U,      # elmaya uzanırken (dolabın önü, açık kapaktan uzak)
        'elma': Vector((-355, -150, 0)) * U}   # elma: ön yüzün 150 mm içinde
KAPAK_HACIM = [  # kapağın yerelinde kutular (u: menteşeden serbest uca, n: dış yüz +, z: yükseklik; mm)
    ((0, 500), (-10, 26), (22, 848)),          # panel + iç kaplama + conta
    ((55, 445), (-100, -10), (280, 800)),      # kapak rafları ve üstlerindeki ürünler
    ((440, 480), (26, 47), (360, 680))]        # kol
BZ_GOVDE_AG = ('pantolon', 'kazak', 'sol ayak', 'sağ ayak', 'kafa', 'saç sakal', 'kulaklık', 'burun', 'bıyık', 'sol kulak', 'sağ kulak',
               'tekli saç 1', 'tekli saç 2', 'toka', 'topuz top saç 1', 'topuz top saç 2', 'topuz top saç 3')
BZ_EL_AG = ('sol avuç', 'sağ avuç', 'sol başparmak', 'sağ başparmak') + tuple(f'{y} parmak {i}' for y in ('sol', 'sağ') for i in range(1, 5))


def kapak_uzak(p, aci):
    """p (karakter yereli) kapağın hacmine uzaklığı (mm; 0 = içinde) ve içindeyse True"""
    q = (p - BZ['menteşe']) * MM
    yon = Vector((-math.cos(aci), math.sin(aci), 0)); dis = Vector((math.sin(aci), math.cos(aci), 0))
    u, n, z = q.dot(yon), q.dot(dis), q.z
    en = 1e9
    for (u0, u1), (n0, n1), (z0, z1) in KAPAK_HACIM:
        d = math.sqrt(max(0, u0 - u, u - u1) ** 2 + max(0, n0 - n, n - n1) ** 2 + max(0, z0 - z, z - z1) ** 2)
        en = min(en, d)
    return en


def ag_dizi(adlar):
    """O karedeki ağların köşeleri (numpy, armatür uzayı, Blender birimi)"""
    import numpy as np
    dg = bpy.context.evaluated_depsgraph_get(); out = {}
    Mi = np.array(rig.matrix_world.inverted())
    for ad in adlar:
        o = bpy.data.objects[ad].evaluated_get(dg); me = o.to_mesh(); n = len(me.vertices)
        co = np.empty(n * 3, dtype=np.float64); me.vertices.foreach_get('co', co); o.to_mesh_clear()
        co = co.reshape(n, 3); W = Mi @ np.array(o.matrix_world)
        out[ad] = co @ W[:3, :3].T + W[:3, 3]
    return out


def kapak_uzak_np(P, aci):
    """P (n×3, karakter yereli) için kapak hacmine uzaklık (mm; 0 = içinde)"""
    import numpy as np
    q = (P - np.array(BZ['menteşe'])) * MM
    u = q[:, 0] * -math.cos(aci) + q[:, 1] * math.sin(aci); n = q[:, 0] * math.sin(aci) + q[:, 1] * math.cos(aci); z = q[:, 2]
    en = np.full(len(P), 1e9)
    for (u0, u1), (n0, n1), (z0, z1) in KAPAK_HACIM:
        d = np.sqrt(np.maximum(0, np.maximum(u0 - u, u - u1)) ** 2 + np.maximum(0, np.maximum(n0 - n, n - n1)) ** 2 + np.maximum(0, np.maximum(z0 - z, z - z1)) ** 2)
        en = np.minimum(en, d)
    return en


def bz_kesisim(act, K, son, adlar=BZ_GOVDE_AG, adim=1, ayir=None):
    """her karede ağların kapak hacmine giren köşe sayısı ve en yakın uzaklık (mm). ayir: köşeyi sınıflayan işlev (kol/gövde)"""
    out = {'kesisim_kare': [], 'en_cok_kose': 0, 'en_yakin_mm': 1e9, 'en_yakin_kare': None}
    for f in range(1, son + 1, adim):
        kare_ayarla(act, f); N = ag_dizi(adlar); a = K(f); n = 0; yak = 1e9
        for ad, P in N.items():
            d = kapak_uzak_np(P, a)
            if ayir is not None:
                m = ayir(ad, P); d = d[m]
                if not len(d): continue
            n += int((d <= 0).sum()); yak = min(yak, float(d.min()))
        if n: out['kesisim_kare'].append(f)
        out['en_cok_kose'] = max(out['en_cok_kose'], n)
        if yak < out['en_yakin_mm']: out['en_yakin_mm'], out['en_yakin_kare'] = round(yak, 1), f
    return out


def kol_mu(P):
    """köşe kol mu (üst kol / ön kol / el kemiğine gövdeden yakın): kazağın kolları gövde sayılmaz"""
    import numpy as np
    from mathutils.geometry import intersect_point_line
    def seg(b):
        pb = rig.pose.bones[b]; A = np.array(pb.head); B = np.array(pb.tail); AB = B - A
        t = np.clip(((P - A) @ AB) / max(1e-12, AB @ AB), 0, 1)
        return np.linalg.norm(P - (A + t[:, None] * AB), axis=1)
    kol = np.minimum.reduce([seg(b) for b in ('üst_kol.L', 'üst_kol.R', 'ön_kol.L', 'ön_kol.R', 'el.L', 'el.R')])
    gov = np.minimum.reduce([seg(b) for b in ('göğüs', 'omurga', 'kalça', 'boyun', 'omuz.L', 'omuz.R')])
    return kol < gov


def buzdolabi(ad, bos):
    son = 124
    TUT, BIRAK_K, IT0, IT1 = 8, 16, 76, 84
    # kapak: el kolu 8'de kavrar, 8–16 elle döner, bırakınca savrulur (30'da 1,82), 36'da 1,75'e oturur; sol el 76'da iç
    # yüzü tutar, 76–84 kapağı 1,5'e çeker ve bırakır; kapak yavaş başlayıp kapanır (110), küçük sekme
    ac = [[1, 0], [TUT, 0], [BIRAK_K, 0.42], [30, 1.82], [36, 1.75], [IT0, 1.75], [IT1, 1.5], [IT1 + 8, 1.4], [IT1 + 14, 1.12], [IT1 + 20, 0.62],
          [IT1 + 25, 0.18], [IT1 + 27, 0], [IT1 + 30, 0.03], [IT1 + 33, 0], [son, 0]]
    K = lambda f: anahtar(ac, f)
    M_eski = Vector((315 * U, -330 * U, 0))
    BZ['menteşe'] = -BZV6['B0']
    M = BZ['menteşe']
    IN = BZV6['IN'] - BZV6['B0']                       # elmaya uzanırken kökün kayması (karakter yereli)
    kol = BZ['en'] - 27 * U
    elma = M + BZV6['elma'] + Vector((0, 0, BZ['raf'] + 38 * U))
    O = Vector()
    kolp = lambda f: kapak_noktasi(K(f), kol, BZ['kol_z'], 45 * U)
    # sol el kolda: avuç kapağa (−dış), parmaklar serbest uca doğru (kolu kapakla arasından sarar)
    kolyon = lambda f: (tuple(Vector((-math.cos(K(f)), math.sin(K(f)), 0)) + Vector((0, 0, -0.15))), tuple(-Vector((math.sin(K(f)), math.cos(K(f)), 0))))
    a2, k2 = adimlar(36, O, IN, 'LR', boy=9, kalca_ek=((0, 0, -0.01), (0, 0, 0)))          # sola, dolabın önüne
    a3, k3 = adimlar(IT1 - 1, IN, O, 'RL', boy=7, kalca_ek=((0, 0, 0), (0, 0, -0.01)))     # kapak kapanırken sağa, yayın dışına
    kalca = birlestir([(1, (0, 0, 0)), (5, (0.006, 0.006, -0.02)), (TUT, (0.012, 0.008, -0.03)), (BIRAK_K, (0.0, 0.03, -0.02)), (24, (0, 0.01, -0.005)), (32, (0, 0, 0))],
                      k2, [(54, tuple(IN + Vector((0, 0.03, -0.03)))), (58, tuple(IN + Vector((-0.01, 0.07, -0.095)))), (64, tuple(IN + Vector((-0.012, 0.075, -0.1)))),
                           (70, tuple(IN + Vector((0, 0.02, -0.02)))), (IT0, tuple(IN + Vector((0.008, 0.01, -0.01)))), (IT1 - 1, tuple(IN + Vector((0.004, 0.02, -0.01))))],
                      k3, [(IT1 + 18, (0, 0, -0.004)), (son, (0, 0, 0))])
    S = {'nefes': 0.9, 'kalca': kalca,
         'ayak': {t: birlestir([(1, (0, 0, 0)), (35, (0, 0, 0))], a2[t], [(70, tuple(IN)), (IT1 - 1, tuple(IN))], a3[t], [(son, (0, 0, 0))]) for t in 'LR'}}
    govde = lambda f: Vector((vanahtar(kalca, f).x, vanahtar(kalca, f).y, 0))
    sark = lambda t, f: tuple(Vector((0.2 if t == 'L' else -0.2, -0.07, 0.38)) + govde(f))
    # sol el kapak yanındayken gövdenin önünde, karnın solunda tutulur (yanda sarkınca kapağın yayına giriyordu)
    tutL = lambda f: tuple(Vector((0.11, -0.1, 0.42)) + govde(f))
    TUTL_YON = ((0.2, -1, -0.3), (-0.6, 0, -0.8))
    # gövde: kola sola dönüp uzanır, çekerken geriye yaslanır, içeri uzanırken kalçadan menteşelenir; kapatırken sola, kapağa
    X_ = [[1, 0], [6, 10], [TUT, 12], [12, 2], [BIRAK_K, -6], [22, -2], [30, 0], [46, 2], [54, 22], [60, 34], [66, 30], [72, 6], [IT0, 8], [IT1, 2], [IT1 + 8, -2], [108, 0], [son, 0]]
    Z_ = [[1, 0], [6, 10], [TUT, 14], [BIRAK_K, 8], [26, 0], [52, 6], [62, 8], [70, 6], [IT0, 18], [IT1, 14], [IT1 + 10, 4], [110, 0], [son, 0]]
    S['don'] = {'omurga': {'X': [[f, d * 0.6] for f, d in X_], 'Z': [[f, d * 0.5] for f, d in Z_],
                           'Y': [[1, 0], [TUT, 3], [20, 0], [52, 0], [60, -6], [66, -4], [74, 0]]},
                'göğüs': {'X': [[f, d * 0.4] for f, d in X_], 'Z': [[f, d * 0.5] for f, d in Z_]},
                'kafa': {'X': [[1, 0], [6, 8], [TUT, 6], [20, -4], [28, 0], [56, 4], [64, -10], [72, 0], [son, 0]]}}
    itp = lambda f: kapak_noktasi(K(f), 300 * U, 0.43, -25 * U)
    ityon = lambda f: ((0, -0.3, 1), tuple(Vector((math.sin(K(f)), math.cos(K(f)), 0))))
    S['bak'] = {'agirlik': [[1, 0], [4, 0.8], [IT1 + 14, 0.8], [118, 0]],
                'yer': [(1, tuple(kolp(TUT))), (TUT, tuple(kolp(TUT))), (24, tuple(kapak_noktasi(1.2, 0.25, 0.45))), (44, tuple(elma)), (64, tuple(elma)),
                        (70, tuple(elma + Vector((0, 0.2, 0.1))) if not bos else tuple(elma)), (IT0, tuple(itp(IT0))), (IT1 + 6, tuple(kapak_noktasi(0.9, 0.3, 0.45))),
                        (IT1 + 20, tuple(kapak_noktasi(0, 0.25, 0.45))), (son, (0, -1.0, 0.7))]}
    # Sol el: kola uzanır (1–8), 8–16 kola kilitli, bırakır; 70–76 kapağın iç yüzüne, 76–84 kapağa kilitli, bırakır
    L_yer = [(1, sark('L', 1)), (5, tuple(kolp(TUT) + Vector((0.03, 0.05, 0.0))))] + [(f, tuple(kolp(f))) for f in range(TUT, BIRAK_K + 1)] + \
            [(BIRAK_K + 4, tutL(BIRAK_K + 4)), (32, tutL(32))]
    L_yon = [(1, SARK['L'])] + [(f, kolyon(f)) for f in range(5, BIRAK_K + 1, 2)] + [(BIRAK_K + 5, TUTL_YON)]
    L_ik = [[1, 0], [3, 1], [son - 8, 1], [son, 0]]
    if bos:   # boş dolap: iki el rafta gezinir (52–70)
        L_yer += [(52, tutL(52)), (60, tuple(Vector((0.1, -0.2, 0.45)) + IN)), (64, tuple(Vector((0.12, -0.2, 0.48)) + IN)), (70, tuple(Vector((0.11, -0.19, 0.46)) + IN))]
        L_yon += [(52, TUTL_YON), (60, ((1, -0.4, 0), (0, 0, 1))), (70, ((1, -0.4, 0), (0, 0, 1)))]
    else:
        L_yer += [(40, tutL(40)), (66, tutL(66))]
        L_yon += [(66, TUTL_YON)]
    L_yer += [(72, tuple(itp(IT0) + Vector((-0.04, -0.03, 0))))] + [(f, tuple(itp(f))) for f in range(IT0, IT1 + 1)] + \
             [(IT1 + 5, tutL(IT1 + 5)), (son - 12, tutL(son - 12)), (son - 2, sark('L', son - 2)), (son, sark('L', son))]
    L_yon += [(f, ityon(f)) for f in range(72, IT1 + 1, 2)] + [(IT1 + 5, TUTL_YON), (son - 12, TUTL_YON), (son - 2, SARK['L'])]
    S['parmak'] = {'L': [[1, 0.15], [5, 0.05], [TUT, 0.8], [BIRAK_K, 0.8], [BIRAK_K + 3, 0.35], [68, 0.35], [74, 0.0], [IT1, 0.0], [IT1 + 6, 0.35], [son - 8, 0.35], [son, 0.15]], 'R': [[1, 0.15]]}
    S['basparmak'] = {'L': [[1, 0], [TUT, 0.6], [BIRAK_K, 0.6], [BIRAK_K + 3, 0]]}
    # Sağ el: yanda; elmayı alır (v5 yolu, gövdenin IN'deki yerine taşınmış), göğüs önünde tutar
    on = Vector((0, -0.1, 0))   # v5 yolları bu kök kaymasına göre yazılmıştı
    tas = lambda v: tuple(Vector(v) - on + IN)
    R_yer = [(1, sark('R', 1)), (40, sark('R', 40))]
    R_yon = [(1, SARK['R']), (40, SARK['R'])]
    R_ik = [[1, 0], [42, 0]]
    hold = Vector(ELMA_ALT)
    if not bos:
        R_yer += [(48, tas((-0.18, -0.25, 0.48))), (56, tuple(elma + Vector((0.0, 0.09, 0.05)))), (62, tuple(elma)), (64, tuple(elma + Vector((0, 0.01, 0.012)))),
                  (70, tuple(elma + Vector((-0.02, 0.16, 0.06))))] + [(f, tuple(hold + govde(f))) for f in range(78, son + 1, 3)] + [(son, tuple(hold))]
        R_yon += [(48, ((0.2, -1, -0.2), (0, -0.3, -1))), (60, ((0.15, -1, -0.35), (0, -0.3, -1))), (66, ((0.15, -1, -0.2), (0, -0.2, -1))),
                  (78, ELMA_TUT), (son, ELMA_TUT)]
        R_ik += [[50, 1], [son, 1]]
        S['parmak']['R'] += [[54, 0.1], [56, 0.05], [61, 0.05], [64, ELMA_KIVRIM[0]], [son, ELMA_KIVRIM[0]]]
        S['basparmak']['R'] = [[1, 0], [56, 0], [61, 0], [64, ELMA_KIVRIM[1]], [son, ELMA_KIVRIM[1]]]
        S['elma'] = {'g0': [[1, 0], [63, 1]]}
        R_dirsek = [(1, (-0.45, 0.1, 0.32)), (48, tas((-0.45, 0.1, 0.32))), (60, tas((-0.4, 0.0, 0.5))), (78, tuple(Vector(DIRSEK_TUT['R']) + govde(78))), (son, DIRSEK_TUT['R'])]
    else:
        R_yer += [(52, sark('R', 52)), (60, tas((-0.24, -0.16, 0.45))), (64, tas((-0.27, -0.15, 0.48))), (70, tas((-0.26, -0.15, 0.46))), (78, sark('R', 78)), (son, sark('R', son))]
        R_yon += [(52, SARK['R']), (60, ((-1, -0.4, 0), (0, 0, 1))), (70, ((-1, -0.4, 0), (0, 0, 1))), (78, SARK['R'])]
        R_ik += [[54, 0], [60, 1], [70, 1], [78, 0]]
        S['don']['omuz.L'] = {'Y': [[58, 0], [62, -16], [64, -13], [68, -14], [74, 0]]}
        S['don']['omuz.R'] = {'Y': [[58, 0], [62, 16], [64, 13], [68, 14], [74, 0]]}
        S['don']['kafa']['Y'] = [[58, 0], [63, -9], [69, -8], [75, 0]]
        S['agiz'] = [[56, 0], [62, 0.25], [70, 0.25], [76, 0]]
        R_dirsek = [(1, (-0.45, 0.1, 0.32)), (son, (-0.45, 0.1, 0.32))]
    S['el'] = {'R': {'ik': R_ik, 'yer': R_yer, 'yon': R_yon, 'nokta': ELMA_EL, 'dirsek': R_dirsek},
               'L': {'ik': L_ik, 'yer': L_yer, 'yon': L_yon,
                     # dirsek gövdeye yakın (dışa açılınca kapağın yayına giriyordu); kapağı tutarken dışa
                     'dirsek': [(1, (0.45, 0.1, 0.3)), (TUT, (0.5, 0.1, 0.25)), (BIRAK_K + 4, (0.3, 0.18, 0.3)), (44, tuple(Vector((0.18, 0.25, 0.3)) + IN)), (68, tuple(Vector((0.18, 0.25, 0.3)) + IN)),
                                (IT0, tuple(Vector((0.5, 0.15, 0.3)) + IN)), (IT1, tuple(Vector((0.45, 0.15, 0.3)) + IN)), (IT1 + 6, tuple(Vector((0.3, 0.18, 0.3)) + govde(IT1 + 6))),
                                (son - 10, (0.3, 0.18, 0.3)), (son, (0.45, 0.1, 0.3))]}}
    act = kol_coz(ad, son, S, {'L': [(TUT, BIRAK_K), (IT0, IT1)], 'R': [] if bos else [(60, 64)]})
    kes = bz_kesisim(act, K, son, ayir=lambda ad, P: ~kol_mu(P) if ad == 'kazak' else slice(None))
    kes_kol = bz_kesisim(act, K, son, ('kazak',), ayir=lambda ad, P: kol_mu(P))
    kes_el = bz_kesisim(act, K, son, BZ_EL_AG)
    meta = {'sure': round(son / 30, 2), 'kapak': [[f, -round(K(f), 4)] for f in range(1, son + 1)],
            'kapak_basla': TUT, 'kapak_kapan_basla': IT0,
            'mentese': mm(M), 'kapak_en': 500, 'kol': {'el': 'L', 'tut': [TUT, BIRAK_K], 'nokta': mm(kolp(TUT))},
            'itme': {'el': 'L', 'tut': [IT0, IT1]}, 'yaklas': [36, 53], 'don': [[IT1 - 1, IT1 + 13]], 'yaklas_kok_mm': mm(IN),
            'durus_ofset_mm': mm(M_eski - M),
            'kesisim': {'govde_kose': kes['en_cok_kose'], 'kare': kes['kesisim_kare'][:20], 'en_yakin_mm': kes['en_yakin_mm']},
            'not': 'v6: kök kapağın süpürme yayının dışında (menteşeye uzaklık %d mm, kapak 500). Kök v5\'e göre durus_ofset_mm kadar kaydı '
                   '(karakter yereli mm, −y ileri, +x sol); site kökü mentese\'den hesaplıyorsa kendiliğinden doğru yere gelir. '
                   'kapak: her kare sitedeki kapağın rotation.z farkı (rad; − açılır; kare 1 tabanlı, 30 fps): site kapağı klibin zamanına bağlar. '
                   'yaklas: kök yaklas_kok_mm\'ye yan adım atar (dolabın önü), don: kapak kendi kapanırken başlangıç yerine döner. '
                   'Kolu sol el çeker (kol.tut), sol el kapağı iç yüzünden kapatır (itme.tut).' % round(M.length * MM)}
    meta['hata_mm'] = {'kol': el_hatasi(act, S, 'L', TUT, BIRAK_K), 'itme': el_hatasi(act, S, 'L', IT0, IT1)}
    if not bos:
        meta['al'] = 62
        meta['elma'] = {'nokta': mm(elma), 'ic_mm': 150, **ELMA_META, 'kemik_adim': {'g0': 63}}
        meta['hata_mm']['elma'] = el_hatasi(act, S, 'R', 60, 64)
        OLCUM_V5['tutus'][ad] = tutus_olc(act, 'R', range(80, son + 1, 4), ELMA_EL)
    else:
        meta['silk'] = [60, 72]
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    OLCUM_V6.setdefault('buzdolabi', {})[ad] = {'govde_kapak_kesisim': kes, 'kol_kapak': {'kose': kes_kol['en_cok_kose'], 'kare': kes_kol['kesisim_kare'], 'en_yakin_mm': kes_kol['en_yakin_mm']},
                                                'el_kapak': {'kose': kes_el['en_cok_kose'], 'kare': kes_el['kesisim_kare']},
                                                'not': 'gövde: pantolon, kazağın gövdesi (kollar ayrı), ayaklar, baş; el: avuç ve parmaklar (kola ve kapağa değer)',
                                                'gecti': kes['en_cok_kose'] == 0, 'mentese_mm': mm(M), 'durus_ofset_mm': mm(M_eski - M),
                                                'yaklas_kok_mm': mm(IN), 'hata_mm': meta['hata_mm']}
    return act


# ---- elma yeme (v5): 4 ısırık, 240 kare; elma her ısırıkta küçülür, 4.'de koçan kalır ----
# Döngü (60 kare): el elmayı ağza getirir, ağız açılır (14–19), 20'de ısırır (ağız elmaya kapanır, yeni elma adımı
# görünür), indirir, yanaklar şişer ve ağız ritmik çiğner (24–58, 1,75 Hz), bu sırada el elmayı ekseninde çevirir: bir
# sonraki ısırık yeri ağza döner. Yalnız üst gövde (yürürken 'yuru' ile karışır).
ISIRIK = [20, 80, 140, 200]


def elma_ye():
    P, N = 60, 4
    son = P * N + 1
    agiz = Vector((-0.01, -0.175, 0.71))
    alt = Vector(ELMA_ALT)
    AGIZ_YON = ((0.15, -0.35, 1), (0.1, 1, 0.3))
    yer1 = [(1, tuple(alt)), (10, (-0.1, -0.24, 0.58)), (17, tuple(agiz)), (22, tuple(agiz + Vector((0, 0.006, -0.004)))), (30, (-0.11, -0.24, 0.58)), (40, tuple(alt))]
    yon1 = [(1, ELMA_TUT), (15, AGIZ_YON), (24, AGIZ_YON), (38, ELMA_TUT)]
    tek = lambda k: [(f + c * P, v) for c in range(N) for f, v in k] + [(son, k[0][1])]
    cene1 = [[1, 0], [13, 0], [18, 14], [20, 3], [21, 0]] + [[f, round(CIGNE['acik'] * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)), 3)] for f in range(_CB, int(_CS) + 1)] + [[59, 0]]
    agiz1 = [[1, 0], [8, 0], [13, 0.9], [17, 1.0], [19, 0.95], [20, 0.2], [22, 0.05]]   # ağız elma gelmeden açılır (beklenti) + [[f, round(0.32 * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)), 3)] for f in range(_CB, int(_CS) + 1)] + [[59, 0]]
    yanak1 = [[1, 1.0], [19, 1.0], [24, 1.16]] + [[f, round(1.16 - 0.05 * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)) - 0.1 * (f - _CB) / (_CS - _CB), 3)] for f in range(_CB + 1, int(_CS) - 3)] + [[_CS, 1.03], [59, 1.0]]
    # elma ekseni çevirme: ısırık k'nın yeri ağza bakacak açı (ölçülür: ağzın elma çerçevesindeki açısı φ)
    S = {'nefes': 0.7, 'canli': 0.7,
         'el': {'R': {'ik': [[1, 1], [son, 1]], 'nokta': ELMA_EL, 'yer': tek(yer1), 'yon': tek(yon1),
                      'dirsek': [(1, DIRSEK_TUT['R']), (son, DIRSEK_TUT['R'])]}},
         'parmak': {'R': [[1, ELMA_KIVRIM[0]], [son, ELMA_KIVRIM[0]]]}, 'basparmak': {'R': [[1, ELMA_KIVRIM[1]], [son, ELMA_KIVRIM[1]]]},
         'cene': tekrarla(cene1, N, P), 'agiz': tekrarla(agiz1, N, P),
         'olcek': {'yanak.L': tekrarla(yanak1, N, P), 'yanak.R': tekrarla(yanak1, N, P)},
         'kirp': [44, 110, 165, 228],
         'don': {'kafa': {'X': tekrarla([[1, 0], [14, -4], [19, 8], [23, 10], [27, 4], [30, 6], [40, 1], [59, 0]], N, P),
                          'Z': tekrarla([[1, 0], [18, 6], [30, 2], [46, -3], [59, 0]], N, P)},
                 'çene': {'Z': tekrarla([[1, 0], [_CB, 0]] + [[f, round(2.0 * math.sin(2 * math.pi * (f - _CB) / _P), 3)] for f in range(_CB + 1, int(_CS) + 1)] + [[59, 0]], N, P)},
                 'göğüs': {'X': tekrarla([[1, 0], [18, 5], [24, 2], [30, 1], [59, 0]], N, P), 'Y': tekrarla([[1, 0], [18, -3], [40, 1], [59, 0]], N, P)},
                 'omurga': {'X': tekrarla([[1, 0], [12, 2], [20, 4], [34, 1], [59, 0]], N, P)},
                 'omuz.R': {'Y': tekrarla([[1, 0], [16, 6], [24, 6], [38, 0], [59, 0]], N, P)},
                 'omuz.L': {'Y': tekrarla([[1, 0], [20, 3], [40, 3], [59, 0]], N, P)}},
         'elma': {'g0': [[1, 1], [ISIRIK[0], 0]], 'g1': [[1, 0], [ISIRIK[0], 1], [ISIRIK[1], 0]], 'g2': [[1, 0], [ISIRIK[1], 1], [ISIRIK[2], 0]],
                  'g3': [[1, 0], [ISIRIK[2], 1], [ISIRIK[3], 0]], 'kocan': [[1, 0], [ISIRIK[3], 1]]}}
    act = klip_kur('elma_ye', son, S)
    # ağzın elma çerçevesindeki açısı (ısırık karesinde; elma kemiği dönüşsüzken)
    kare_ayarla(act, ISIRIK[0])
    Me = rig.pose.bones['elma'].matrix
    a_ = Me.inverted() @ rig.pose.bones['ağız'].head
    phi = math.degrees(math.atan2(a_.x, a_.z))
    dn = []
    for i, b in enumerate(ISIRIK[:3]):
        al_ = phi - ISIRIK_ACI[i]
        dn += [[b - 6 if i else 1, al_], [b + 6, al_]]
        if i < 2: dn += [[b + 16, al_]]
    S['elma_don'] = dn + [[ISIRIK[3] - 4, phi - ISIRIK_ACI[2] - 60], [son, phi - ISIRIK_ACI[2] - 60]]
    act = kol_coz('elma_ye', son, S, {'R': [(17 + c * P, 22 + c * P) for c in range(N)]})
    adim = {'g0': [1, ISIRIK[0]], 'g1': [ISIRIK[0], ISIRIK[1]], 'g2': [ISIRIK[1], ISIRIK[2]], 'g3': [ISIRIK[2], ISIRIK[3]], 'kocan': [ISIRIK[3], son]}
    meta = {'sure': round((son - 1) / 30, 2), 'tekrar': False, 'katman': 'ust', 'ust_kok': UST_KOK, 'isirik': ISIRIK,
            'elma_adim': adim, 'elma_hacim': ELMA_KUR['hacim'], 'cigne': [[b + 4, b + 38] for b in ISIRIK], 'cigne_hz': CIGNE['hz'],
            'elma': ELMA_META,
            'agiz_mm': round((elma_nokta(act, 20) - nokta(act, 20, 'ağız')).length * MM, 1),
            'hata_mm': {'agiz': el_hatasi(act, S, 'R', 17, 22)},
            'not': 'elma GLB içinde: elma_g0..g3 ve elma_kocan kemiklerinin ölçeği 0/1 (görünürlük), klip kendisi oynatır; '
                   'elma_adim: hangi kemik hangi kare aralığında görünür. Isırıkta ağız kemiği (ağız) açılır, çene ve yanak '
                   'kemikleri çiğner. Klip sonunda elde koçan kalır (elma_firlat koçanla başlar).'}
    OLCUM_V5['tutus']['elma_ye'] = tutus_olc(act, 'R', [1, 40, 60, 100, 160, 220, son], ELMA_EL)
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    return act


# ---- diz çökme (yarım diz: sağ diz yerde, sol ayak önde) ----
# Diz pozu: kalça iner ve biraz öne, sağ ayak geriye kayar ve parmak ucuna basar (topuk kalkar), sağ diz yere değer
# (ölçülüp kalça yüksekliği ayarlanır), sol ayak yarım adım öne, sol diz ~90°.
DIZ = {'kalca': Vector((0.0, -0.03, -0.17)), 'R': Vector((-0.01, 0.17, 0.0)), 'L': Vector((0.005, -0.07, 0.0)), 'R_don': 62}


def diz_ayarla():
    """Yarım diz pozunu ölçerek seçer (ızgara): sağ diz (baldır.R başı) yere değsin (~25 mm), diz kalçanın altında
    kalsın (bacak yana açılmasın), sağ bilek yerin üstünde olsun. Kalça düşüşü, sağ ayağın geri kayması, topuk açısı."""
    hx = REST['uyluk.R'].translation.x
    en = None
    for dz in [-0.11 - 0.01 * i for i in range(9)]:
        for ry in [0.04 + 0.02 * i for i in range(7)]:
            for rd in (30, 42, 54):
                DIZ['kalca'] = Vector((0, -0.03, dz)); DIZ['R'] = Vector((0.0, ry, 0)); DIZ['R_don'] = rd
                act = klip_kur('_diz_olc', 4, diz_poz_S(4, [[1, 1], [4, 1]]))
                kare_ayarla(act, 4); pb = rig.pose.bones
                k = pb['baldır.R'].head; a_ = pb['ayak.R'].head
                p_ = ((k.z - 25 * U) * 4) ** 2 + (k.x - hx) ** 2 + (max(0, 45 * U - a_.z) * 4) ** 2
                if en is None or p_ < en[0]: en = (p_, dz, ry, rd, tuple(round(x * MM) for x in k), round(a_.z * MM))
    _, dz, ry, rd, k, az = en
    DIZ['kalca'] = Vector((0, -0.03, dz)); DIZ['R'] = Vector((0.0, ry, 0)); DIZ['R_don'] = rd
    print('DIZ seçildi kalça', round(dz * MM), 'sağ ayak geri', round(ry * MM), 'topuk', rd, 'diz', k, 'bilek z', az)
    bpy.data.actions.remove(bpy.data.actions['Hareket - _diz_olc'])


def diz_poz_S(son, w):
    """w: [[kare, 0..1]] ayakta (0) → diz (1) karışımı. Adım: önce sağ ayak geri (parmak ucu), sonra çöküş"""
    wk = lambda f: anahtar(w, f)
    fs = sorted({f for f, _ in w})
    kal = [(f, tuple(DIZ['kalca'] * wk(f))) for f in fs]
    S = {'kalca': kal,
         'ayak': {'R': [(f, tuple(DIZ['R'] * min(1, wk(f) * 1.6) + Vector((0, 0, 0.03 * math.sin(math.pi * min(1, wk(f) * 1.6)))))) for f in fs],
                  'L': [(f, tuple(DIZ['L'] * min(1, max(0, wk(f) * 1.6 - 0.3)))) for f in fs]},
         'ayak_don': {'R': [[f, DIZ['R_don'] * min(1, wk(f) * 1.4)] for f in fs]},
         'don': {'omurga': {'X': [[f, 8 * wk(f)] for f in fs]}, 'göğüs': {'X': [[f, 2 * wk(f)] for f in fs]}}}
    return S


# ---- v6 (2026-11-04, kullanıcı: "TAM diz çökmeli: iki diz yerde, kalça topuklara oturmuş, gövde dik") ----
# v5'in yarım dizi (sağ diz yerde, sol ayak önde) yalnız ara poz olarak kalır. Pozlar (hepsi Durma'ya göre kayma):
#   YARIM  v5 yarım diz (diz_ayarla ölçer)
#   DIK    iki diz yerde, parmaklar yere basılı (topuk kalkık), kalça dizlerin üstünde (uyluk dik)
#   SEIZA  iki diz yerde, ayak üstleri yerde (taban yukarı), kalça topukların üstüne oturmuş, gövde dik
# Dizlerin yere değmesi (baldır başı ≤ 30 mm) ve ayak üstünün yere oturması ölçülerek bulunur (seiza_ayarla).
POZ = {}
SEIZA_GERI = 0.09   # seizada uyluk eklemi dizin bu kadar arkasında (135 mm): kalça topukların üstünde


def poz_bos():
    return {'kalca': Vector(), 'ayak': {'L': Vector(), 'R': Vector()}, 'don': {'L': 0.0, 'R': 0.0}, 'bilek': {'L': 0.0, 'R': 0.0}, 'omX': 0.0, 'goX': 0.0}


def poz_akisi(akis, son, kaldir=()):
    """akis: [(kare, poz)] → klip tanımının bacak/kalça/gövde anahtarları. kaldir: [(kare, taraf)] o karede ayak 25 mm kalkar
    (yerdeyken kaymasın: adımın ortası)"""
    S = {'kalca': [(f, tuple(p['kalca'])) for f, p in akis],
         'ayak': {t: [(f, tuple(p['ayak'][t])) for f, p in akis] for t in 'LR'},
         'ayak_don': {t: [[f, p['don'][t]] for f, p in akis] for t in 'LR'},
         'ayak_bilek': {t: [[f, p['bilek'][t]] for f, p in akis] for t in 'LR'},
         'don': {'omurga': {'X': [[f, p['omX']] for f, p in akis]}, 'göğüs': {'X': [[f, p['goX']] for f, p in akis]}}}
    for f, t in kaldir:
        k = S['ayak'][t]; v = vanahtar(k, f)
        S['ayak'][t] = birlestir(k, [(f, tuple(v + Vector((0, 0, 0.017))))])
    return S


def diz_olc(act, f):
    """dizler (baldır başı) z, pantolon ve ayakların en alçak noktası, kalça z, kalça–bilek yatay uzaklığı, gövdenin dikeyden açısı (mm, derece)"""
    kare_ayarla(act, f); pb = rig.pose.bones
    N = ag_noktalari(('pantolon', 'sol ayak', 'sağ ayak'))
    k = pb['kalça'].head; bl = (pb['ayak.L'].head + pb['ayak.R'].head) / 2
    g = pb['boyun'].head - pb['kalça'].head
    dz = [min([v.z for v in N['pantolon'] if (v - pb['baldır.' + t].head).length < 100 * U] or [9]) * MM for t in 'LR']
    kz = [v.z for v in N['pantolon'] if (v - k).length < 170 * U]
    from mathutils.geometry import intersect_point_line
    def _incik(v):
        for t in 'LR':
            a, b = pb['baldır.' + t].head, pb['ayak.' + t].head
            q, l = intersect_point_line(v, a, b)
            if 0.35 < l < 1.1 and (v - q).length < 90 * U: return True
        return False
    iz = [v.z for v in N['pantolon'] if _incik(v)]
    return {'diz_z': [round(pb['baldır.L'].head.z * MM, 1), round(pb['baldır.R'].head.z * MM, 1)],
            'diz_alt_z': [round(dz[0], 1), round(dz[1], 1)], 'kalca_alt_z': round(min(kz) * MM, 1) if kz else None, 'incik_alt_z': round(min(iz) * MM, 1) if iz else None,
            'pantolon_min_z': round(min(v.z for v in N['pantolon']) * MM, 1),
            'ayak_min_z': round(min(v.z for a in ('sol ayak', 'sağ ayak') for v in N[a]) * MM, 1),
            'kalca_z': round(k.z * MM, 1), 'kalca_bilek_yatay': round(math.hypot(k.x - bl.x, k.y - bl.y) * MM, 1),
            'topuk_kalca_z': round((k.z - max(pb['ayak.L'].tail.z, pb['ayak.R'].tail.z, pb['ayak.L'].head.z)) * MM, 1),
            'govde_egim': round(math.degrees(g.angle(Vector((0, 0, 1)))), 1),
            'diz_y': round((pb['baldır.L'].head.y + pb['baldır.R'].head.y) / 2 * MM, 1)}


def _poz_olc(p):
    S = poz_akisi([(1, p), (3, p)], 3); S['canli'] = 0; S['nefes'] = 0
    act = klip_kur('_poz_olc', 3, S)
    return act, diz_olc(act, 2)


def _kalca_diz(p, geri=0.035, hedef=25 * U):
    """Dizler hedef yükseklikte yere değsin diye kalçanın yeri (hesap): bilek ölçülür, diz bileğin önünde baldır boyu
    uzakta (z = hedef), uyluk eklemi dizin 'geri' kadar arkasında, uyluk boyu uzakta. Kalça = uyluk eklemi + dinlenme farkı."""
    _, o = _poz_olc(p)
    pb = rig.pose.bones
    # bilekler simetrik ve uyluk eklemlerinin hizasında (Durma'da sağ ayak 25 mm dışa açık, 9 mm önde)
    AL, AR = pb['ayak.L'].head.copy(), pb['ayak.R'].head.copy(); ym = (AL.y + AR.y) / 2
    for t, A_ in (('L', AL), ('R', AR)):
        hx = REST['uyluk.' + t].translation.x * 1.08
        p['ayak'][t] = p['ayak'][t] + Vector((hx - A_.x, ym - A_.y, 0))
    _, o = _poz_olc(p)
    A = (pb['ayak.L'].head + pb['ayak.R'].head) / 2
    bal = (REST['ayak.L'].translation - REST['baldır.L'].translation).length
    uy = (REST['baldır.L'].translation - REST['uyluk.L'].translation).length
    ky = A.y - math.sqrt(max(0.0, bal * bal - (A.z - hedef) ** 2))
    uyy = ky + geri; uyz = hedef + math.sqrt(max(0.0, uy * uy - geri * geri))
    k0 = REST['kalça'].translation; u0 = (REST['uyluk.L'].translation + REST['uyluk.R'].translation) / 2
    p['kalca'] = Vector((0, uyy - u0.y, uyz - u0.z))
    return _poz_olc(p)[1]


def _kalca_diz_mesh(p, geri, hedef_alt=4):
    """dizin ağı (pantolonun diz çevresi) yere değsin: en alçak noktası ≈ hedef_alt mm (bükülen diz ağı eklemin ~70–100 mm
    altına şişer; eklemi 25 mm'ye koymak dizi yere gömüyordu)"""
    h = 60 * U
    for _ in range(5):
        o = _kalca_diz(p, geri, h)
        alt = min(o['diz_alt_z'])
        if abs(alt - hedef_alt) < 2: break
        h += (hedef_alt - alt) * U
    return o


# v7 (kullanıcı: "kutu çıkarırken ayak bilekleri havada kalıyor"): v6 seizasında bilek 172° ayağı geri-yukarı çeviriyordu,
# ayağın en alçak noktası 72 mm havadaydı (ölçüt yalnız inciği yere koyuyordu). Ayak boyunca üç bölge (bilek, orta,
# parmak) ölçülür; bilek 15 mm indirilir, bilek açısı her ayakta ayağın en alçak noktası yere (≈ 0) değene dek aranır:
# parmaklar ve ayak üstünün önü yerde, bilek kalın paçanın üstünde.
SEIZA_AYAK_Z = -15


def ayak_bolge(p, act_f=None):
    """ayak ağının en alçak noktası ve ayak boyunca üç bölgenin (bilek, orta, parmak) en alçak z'si (mm), sol/sağ"""
    if act_f is None: _poz_olc(p)
    else: kare_ayarla(*act_f)
    pb = rig.pose.bones; N = ag_noktalari(('sol ayak', 'sağ ayak'))
    out = {}
    for a, t in (('sol ayak', 'L'), ('sağ ayak', 'R')):
        A = pb['ayak.' + t]; ax = pb['ayak_ucu.' + t].tail - A.head; L = ax.length; ax.normalize()
        bol = [[], [], []]
        for v in N[a]: bol[min(2, max(0, int((v - A.head).dot(ax) / L * 3)))].append(v.z)
        out[t] = {'min': round(min(v.z for v in N[a]) * MM, 1), 'bolge': [round(min(b) * MM, 1) if b else None for b in bol]}
    return out


def seiza_ayak_duzelt(s):
    for t in 'LR': s['ayak'][t] = s['ayak'][t] + Vector((0, 0, SEIZA_AYAK_Z * U))
    for t in 'LR':
        lo, hi = 110.0, 160.0      # açı büyüdükçe ayak ucu kalkar
        for _ in range(9):
            s['bilek'][t] = (lo + hi) / 2
            m = ayak_bolge(s)[t]['min']
            if m > 0: hi = s['bilek'][t]
            else: lo = s['bilek'][t]
        s['bilek'][t] = round((lo + hi) / 2, 1)


def seiza_ayarla():
    """YARIM (v5 ölçümü), DIK ve SEIZA pozlarını ölçerek kurar"""
    y = poz_bos(); y['kalca'] = DIZ['kalca'].copy(); y['ayak']['R'] = DIZ['R'].copy(); y['ayak']['L'] = DIZ['L'].copy()
    y['don']['R'] = DIZ['R_don']; y['omX'] = 8; y['goX'] = 2
    ab = ayak_bolge(y)   # v7: yarım dizde parmak ucundaki sağ ayak zemine girmesin
    for t in 'LR': y['ayak'][t] = y['ayak'][t] + Vector((0, 0, max(0.0, 2 - ab[t]['min']) * U))
    POZ['YARIM'] = y
    # DIK: iki ayak YARIM'daki sağ ayak gibi (geri, parmak ucunda); kalça dizlerin ~25 mm arkasında, dizler yerde
    d = poz_bos()
    for t in 'LR': d['ayak'][t] = Vector((0, DIZ['R'].y, 0)); d['don'][t] = DIZ['R_don']
    d['omX'] = 4
    o = _kalca_diz_mesh(d, 0.017)
    for _ in range(2):   # v7: parmak ucundaki ayaklar zemine 22 mm giriyordu: her ayak en alçak noktası ~2 mm'ye kalkar
        ab = ayak_bolge(d)
        for t in 'LR': d['ayak'][t] = d['ayak'][t] + Vector((0, 0, max(0.0, 2 - ab[t]['min']) * U))
        o = _kalca_diz_mesh(d, 0.017)
    print('POZ DIK', {k: round(v * MM) for k, v in zip('xyz', d['kalca'])}, o, ayak_bolge(d))
    POZ['DIK'] = d
    # SEIZA: ayak üstü yerde (bilek 172°), bilek dizden ~geride; ayak ağının en alçak noktası yere (≈ 0)
    s = poz_bos(); s['omX'] = 2
    ab = 0.115
    for t in 'LR': s['ayak'][t] = Vector((0, ab, 0.0)); s['bilek'][t] = 172.0
    s['kalca'] = Vector((0, ab - 0.035, -0.2))
    for it in range(3):
        _, o = _poz_olc(s)
        for t in 'LR': s['ayak'][t] = s['ayak'][t] + Vector((0, 0, (4 - min(o['ayak_min_z'], o['incik_alt_z'] if o['incik_alt_z'] is not None else 99)) * U))
        o = _kalca_diz_mesh(s, SEIZA_GERI)
    print('POZ SEIZA v6', {k: round(v * MM) for k, v in zip('xyz', s['kalca'])}, 'ayak', mm(s['ayak']['L']), o)
    seiza_ayak_duzelt(s)
    o = _kalca_diz_mesh(s, SEIZA_GERI)
    print('POZ SEIZA', {k: round(v * MM) for k, v in zip('xyz', s['kalca'])}, 'ayak', mm(s['ayak']['L']), 'bilek', s['bilek'], o, ayak_bolge(s))
    POZ['SEIZA'] = s
    for a in ('Hareket - _poz_olc',):
        if bpy.data.actions.get(a): bpy.data.actions.remove(bpy.data.actions[a])
    POZ['olcu'] = {'DIK': _poz_olc(d)[1], 'SEIZA': _poz_olc(s)[1]}
    bpy.data.actions.remove(bpy.data.actions['Hareket - _poz_olc'])


def poz_kopya(p, **deg):
    q = {'kalca': p['kalca'].copy(), 'ayak': {t: p['ayak'][t].copy() for t in 'LR'}, 'don': dict(p['don']), 'bilek': dict(p['bilek']), 'omX': p['omX'], 'goX': p['goX']}
    q.update(deg)
    return q


ELLER_DIZ = {t: {'yer': (0.085 * s, -0.01, 0.15), 'yon': ((0, -1, -0.5), (0, 0, -1)), 'dirsek': (0.4 * s, 0.05, 0.3)} for t, s in (('L', 1), ('R', -1))}


def diz_el(t, s, kareler):
    """eller: dizlerin üstünde (avuç aşağı) — kareler: [(kare, 'sark'|'diz'|'yer', ik)]"""
    yer, yon, ik = [], [], []
    for f, ne, w in kareler:
        if ne == 'sark': yer.append((f, (0.2 * s, -0.07, 0.38))); yon.append((f, SARK[t]))
        elif ne == 'diz': yer.append((f, ELLER_DIZ[t]['yer'])); yon.append((f, ELLER_DIZ[t]['yon']))
        else: yer.append((f, ne)); yon.append((f, ((0, -1, -0.4), (0, 0, -1))))
        ik.append([f, w])
    return {'ik': ik, 'yer': yer, 'yon': yon, 'dirsek': [(1, (0.42 * s, 0.05, 0.3)), (kareler[-1][0], ELLER_DIZ[t]['dirsek'])]}


def diz_cok():
    """ayakta → seiza: sağ ayak geri, sağ diz yere (yarım diz), sol ayak geri, iki diz yerde (dik), ayak üstleri yere
    yatar, kalça topuklara oturur; eller dizlerin üstüne"""
    son = 50
    Y, D, Sz = POZ['YARIM'], POZ['DIK'], POZ['SEIZA']
    A0 = poz_bos()
    ara = poz_kopya(Y, kalca=Y['kalca'] * 0.45 + Vector((0, 0.01, 0)), omX=10)
    ara['ayak']['R'] = Y['ayak']['R'] * 0.9 + Vector((0, 0, 0.02)); ara['don']['R'] = Y['don']['R'] * 0.6
    sol_kalk = poz_kopya(Y, kalca=(Y['kalca'] + D['kalca']) / 2 + Vector((0, 0, 0.01)), omX=10)
    sol_kalk['ayak']['L'] = (Y['ayak']['L'] + D['ayak']['L']) / 2 + Vector((0, 0, 0.03)); sol_kalk['don']['L'] = D['don']['L'] * 0.5
    otur_ara = poz_kopya(D, kalca=(D['kalca'] + Sz['kalca']) / 2 + Vector((0, 0.01, 0.01)), omX=6)
    for t in 'LR': otur_ara['ayak'][t] = (D['ayak'][t] + Sz['ayak'][t]) / 2 + Vector((0, 0.02, 0.075)); otur_ara['don'][t] = D['don'][t] * 0.3; otur_ara['bilek'][t] = Sz['bilek'][t] * 0.55
    son_p = poz_kopya(Sz)
    akis = [(1, A0), (6, poz_kopya(A0, kalca=Vector((0, 0.005, -0.012)), omX=3)), (12, ara), (19, Y), (22, poz_kopya(Y, kalca=Y['kalca'] + Vector((0, 0, -0.004)))),
            (27, sol_kalk), (31, D), (36, otur_ara), (42, poz_kopya(Sz, kalca=Sz['kalca'] + Vector((0, 0, -0.006)))), (46, poz_kopya(Sz, kalca=Sz['kalca'] + Vector((0, 0, 0.002)))), (son, son_p)]
    S = poz_akisi(akis, son)
    S['don']['kafa'] = {'X': [[1, 0], [16, 10], [30, 4], [44, 2], [son, 2]]}
    S['el'] = {t: diz_el(t, s, [(1, 'sark', 0), (10, 'sark', 0.4), (20, (0.13 * s, -0.16, 0.24), 0.8), (30, (0.12 * s, -0.15, 0.2), 1), (40, 'diz', 1), (son, 'diz', 1)])
               for t, s in (('L', 1), ('R', -1))}
    S['canli'] = 0.4; S['nefes_uc'] = True
    S['parmak'] = {t: [[1, 0], [30, 0.05], [42, 0.2], [son, 0.2]] for t in 'LR'}   # v7: zincir pozu (kutu_al_diz başı) parmak 0,2
    act = kol_coz('diz_cok', son, S)
    o = diz_olc(act, son)
    meta = {'sure': round(son / 30, 2), 'diz': 31, 'oturdu': 42, 'kalca_mm': mm(Sz['kalca']), 'ayak_mm': mm(Sz['ayak']['L']), 'bilek_derece': Sz['bilek']['L'],
            'not': 'v6 tam diz çökme (seiza): iki diz yerde, ayak üstleri yerde, kalça topuklarda; kutu_al_diz bu pozdan başlar, diz_kalk ayağa kaldırır. '
                   'diz: iki diz yere değdi, oturdu: kalça topuklarda'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    OLCUM_V6.setdefault('diz', {})['diz_cok_son'] = o
    return act


def diz_kalk():
    """seiza → ayakta: kalça kalkar (dik diz, parmaklar basılır), sol ayak öne (yarım diz), ellerle dizden itip kalkar"""
    son = 52
    Y, D, Sz = POZ['YARIM'], POZ['DIK'], POZ['SEIZA']
    kalk_ara = poz_kopya(D, kalca=(D['kalca'] + Sz['kalca']) / 2 + Vector((0, -0.005, 0.01)), omX=8)
    for t in 'LR': kalk_ara['ayak'][t] = (D['ayak'][t] + Sz['ayak'][t]) / 2 + Vector((0, 0.02, 0.075)); kalk_ara['don'][t] = D['don'][t] * 0.4; kalk_ara['bilek'][t] = Sz['bilek'][t] * 0.5
    sol_one = poz_kopya(Y, kalca=(Y['kalca'] + D['kalca']) / 2 + Vector((0, -0.01, 0.01)), omX=12)
    sol_one['ayak']['L'] = (Y['ayak']['L'] + D['ayak']['L']) / 2 + Vector((0, 0, 0.03)); sol_one['don']['L'] = D['don']['L'] * 0.4
    kalk = poz_kopya(Y, kalca=Y['kalca'] * 0.5 + Vector((0, -0.02, 0.0)), omX=18)
    kalk['ayak']['R'] = Y['ayak']['R'] * 0.7; kalk['don']['R'] = Y['don']['R'] * 0.7
    A0 = poz_bos()
    akis = [(1, poz_kopya(Sz)), (5, poz_kopya(Sz, kalca=Sz['kalca'] + Vector((0, 0, 0.004)), omX=4)), (12, kalk_ara), (17, D), (22, sol_one), (27, Y),
            (35, kalk), (40, poz_kopya(A0, kalca=Vector((0, 0.008, 0.004)), omX=4)), (44, poz_kopya(A0, kalca=Vector((0, 0, -0.003)))), (son, A0)]
    S = poz_akisi(akis, son, kaldir=[(38, 'R')])
    S['ayak']['R'] = birlestir(S['ayak']['R'], [(42, (0, 0, 0))])
    S['ayak_don']['R'] = [[f, v] for f, v in S['ayak_don']['R'] if f <= 35] + [[40, 0], [son, 0]]
    S['don']['kafa'] = {'X': [[1, 2], [12, 6], [30, 8], [40, -2], [son, 0]]}
    S['el'] = {t: diz_el(t, s, [(1, 'diz', 1), (12, 'diz', 1), (24, (0.12 * s, -0.15, 0.22), 1), (32, (0.14 * s, -0.17, 0.3), 0.8), (40, 'sark', 0.2), (son, 'sark', 0)])
               for t, s in (('L', 1), ('R', -1))}
    S['canli'] = 0.4; S['nefes_uc'] = True
    S['parmak'] = {t: [[1, 0.2], [12, 0.2], [30, 0.05], [son, 0]] for t in 'LR'}   # v7: zincir pozunda parmaklar 0,2
    act = kol_coz('diz_kalk', son, S)
    act['site_meta'] = json.dumps({'sure': round(son / 30, 2), 'ayakta': 44, 'not': 'v6: seiza pozundan (kutu_al_diz sonu) ayağa kalkar'}, ensure_ascii=False)
    return act


def diz_klip_olc(act, son):
    """bütün karelerde: zemine en derin giriş (pantolon, ayak), ve seiza karelerinde ölçüt"""
    al = [diz_olc(act, f) for f in range(1, son + 1, 2)]
    return {'pantolon_min_z': min(o['pantolon_min_z'] for o in al), 'ayak_min_z': min(o['ayak_min_z'] for o in al)}


# ---- kutu oyunu (v6, diz çökmüş/seiza): TV altındaki kısa raftan (üstü 420 mm) kutuyu alır, AYNI rafın üstüne koyar ----
# Gerçek ölçüler (oda ajanı, 03.11): raf üstü z 420, gözlerin tabanı z 38, göz 339 × 344, derinlik 390; en büyük kutu
# 300 × 300 × 80 (gözde yatık). Kutu gözden ancak tamamen çıkınca kalkabilir (üst tahta 382–420): 300 mm'lik kutu
# dizlerle raf arasına sığsın diye kök raftan uzakta durur (raf_on_mm ölçülür: dizin ağının önü + 300 + pay).
# Akış: seiza → dizlerin üstünde doğrulur (dik diz, ayak üstleri yerde) → öne eğilip kutuyu gözden yanlarından kavrar
# (al) → kendine çekip dizlerinin önüne, yere indirir → kutuyu göğsüne yakın kaldırıp (dirsekler bükük) rafın üstüne
# iter (birak) → sağ el kapağın yakın kenarını kaldırır, kapak arkaya yaslanır → topuklarına oturup bakar (seiza).

# ---- v7: baş ile raf hacmi (kullanıcı: "yüz rafın içine giriyor") ----
BAS_AG = ('kafa', 'saç sakal', 'kulaklık', 'burun', 'bıyık', 'sol kulak', 'sağ kulak')
RAF_EN = 1125   # raf boyu (mm, karakterin x'i boyunca); derinlik KUTU_DIZ['derin'], üstü KUTU_DIZ['ust']


def raf_bas_kesisim(act, kareler, on_mm):
    """karelerde baş ağlarının raf kutusunun (x ±562, y −on … −on−390, z 0 … 420) içine en derin girişi (mm: dışarı çıkmak
    için gereken en kısa yol) ve giren köşe sayısı: {kare: (derinlik, sayı)}"""
    y0, y1, zt, xe = -on_mm * U, -(on_mm + KUTU_DIZ['derin']) * U, KUTU_DIZ['ust'] * U, RAF_EN / 2 * U
    out = {}
    for f in kareler:
        kare_ayarla(act, f); N = ag_noktalari(BAS_AG); d, n = 0.0, 0
        for vs in N.values():
            for v in vs:
                if y1 < v.y < y0 and v.z < zt and abs(v.x) < xe:
                    n += 1; d = max(d, min(y0 - v.y, zt - v.z))
        out[f] = (round(d * MM, 1), n)
    return out


ZEMIN_ESIK = -25   # mm: pantolonun zemine en çok girişi (seiza pozunun kendisi −22,6: dizler ve incik yere basar)


def zemin_raf_coz(ad, son, S, temas, on_mm=None, tur=3, zemin_haric=()):
    """v7: kol_coz + iki düzeltme turu: baş raf hacmine giriyorsa (girişin 6 mm fazlası) ya da pantolon zemine ZEMIN_ESIK'ten
    derin giriyorsa (farkın 3 mm fazlası) kalça o karelerde kalkar (S['kalca_ek'], komşulara ±6 kare yumuşak yayılır)"""
    act = kol_coz(ad, son, S, temas)
    ek = {}
    for t_ in range(tur):
        rb = {f: d + 6 for f, (d, n) in raf_bas_kesisim(act, range(1, son + 1), on_mm).items() if n} if on_mm else {}
        zm = {}
        for f in range(1, son + 1):
            pz = diz_olc(act, f)['pantolon_min_z']
            if pz < ZEMIN_ESIK and not any(a <= f <= b for a, b in zemin_haric): zm[f] = ZEMIN_ESIK - pz + 3
        print('ZEMINRAF', ad, 'tur', t_, 'raf', rb, 'zemin', {f: round(v, 1) for f, v in zm.items()})
        if not rb and not zm: break
        yeni = {}
        for f in set(rb) | set(zm):
            d = max(rb.get(f, 0), zm.get(f, 0))
            for g in range(f - 6, f + 7):
                if 1 <= g <= son: yeni[g] = max(yeni.get(g, 0.0), d * U * math.exp(-((g - f) / 3.0) ** 2))
        for g, v in yeni.items(): ek[g] = ek.get(g, 0.0) + v
        S['kalca_ek'] = {g: Vector((0, 0, v)) for g, v in ek.items()}
        act = kol_coz(ad, son, S, temas, tur=4)
    OLCUM_V7.setdefault('kalca_ek_mm', {})[ad] = {g: round(v * MM, 1) for g, v in sorted(ek.items()) if v * MM >= 0.5}
    return act

KUTU7 = {}   # v7: kutu_al_diz'in kurduğu yerler (kutu_cevir, kutu_rafa_birak kullanır)
KUTU_DIZ = {'ust': 420, 'olcu': (300, 300, 80), 'ic_alt': 38, 'derin': 390, 'pay': 15}


KUTU_GOVDE_AG = ('pantolon', 'kafa', 'saç sakal', 'kulaklık')


def kutu_carp(act, f, km, on_mm):
    """f karesinde kutu (km merkezli, eksen hizalı, KUTU_DIZ ölçüsü) ile gövdenin (kazağın gövde köşeleri, pantolon, baş) ve
    rafın (üst tahta, göz bölmeleri, taban) en derin kesişimi, mm"""
    ex, ey, ez = (v * U / 2 for v in KUTU_DIZ['olcu']); c = vanahtar(km, f)
    kare_ayarla(act, f); N = ag_noktalari(KUTU_GOVDE_AG + ('kazak',))
    kz = bpy.data.objects['kazak']; gi = {g.index: g.name for g in kz.vertex_groups}
    gv = [i for i, v in enumerate(kz.data.vertices) if v.groups and gi[max(v.groups, key=lambda g: g.weight).group] in ('göğüs', 'omurga', 'kalça', 'karın', 'boyun')]
    pts = [N['kazak'][i] for i in gv[::2]] + [v for a in KUTU_GOVDE_AG for v in N[a][::2]]
    gd = 0.0
    for p in pts:
        d = p - c
        if abs(d.x) < ex and abs(d.y) < ey and abs(d.z) < ez: gd = max(gd, min(ex - abs(d.x), ey - abs(d.y), ez - abs(d.z)))
    y0 = -on_mm * U; y1 = y0 - KUTU_DIZ['derin'] * U; zt = KUTU_DIZ['ust'] * U; gz = 339 / 2 * U; t_ = 18 * U
    tahtalar = [(-RAF_EN / 2 * U, RAF_EN / 2 * U, y1, y0, zt - 38 * U, zt), (-RAF_EN / 2 * U, RAF_EN / 2 * U, y1, y0, 0, KUTU_DIZ['ic_alt'] * U),
                (-gz - t_, -gz, y1, y0, 0, zt), (gz, gz + t_, y1, y0, 0, zt)]
    rd = 0.0
    for x0, x1, a0, a1, z0, z1 in tahtalar:
        o = [min(x1, c.x + ex) - max(x0, c.x - ex), min(a1, c.y + ey) - max(a0, c.y - ey), min(z1, c.z + ez) - max(z0, c.z - ez)]
        if min(o) > 0: rd = max(rd, min(o))
    return round(gd * MM, 1), round(rd * MM, 1)


def kutu_govde_coz(ad, son, S, temas, act, km, on_mm, aralik, tur=3):
    """v8.2: kutu gövdeye giriyorsa (≥ 2 mm) o karelerde kalça geri (+y, kutudan uzağa) kayar; ölçü OLCUM_V7['kutu_carp']"""
    ek = dict(S.get('kalca_ek', {}))
    for t_ in range(tur):
        olc = {f: kutu_carp(act, f, km, on_mm) for f in range(aralik[0], aralik[1] + 1)}
        gir = {f: g for f, (g, r) in olc.items() if g >= 2}
        print('KUTUCARP', ad, 'tur', t_, 'govde', {f: g for f, g in gir.items()}, 'raf', {f: r for f, (g, r) in olc.items() if r > 0})
        if not gir: break
        for f, g in gir.items():
            for h in range(f - 6, f + 7):
                if 1 <= h <= son:
                    v = Vector((0, (g + 8) * U * math.exp(-((h - f) / 3.0) ** 2), 0))
                    if h not in ek or v.y > 0: ek[h] = ek.get(h, Vector()) + v * 0.6
        S['kalca_ek'] = ek
        act = kol_coz(ad, son, S, temas, tur=4)
    olc = {f: kutu_carp(act, f, km, on_mm) for f in range(aralik[0], aralik[1] + 1, 2)}
    OLCUM_V7.setdefault('kutu_carp', {})[ad] = {'govde_en_derin_mm': max(g for g, _ in olc.values()), 'raf_en_derin_mm': max(r for _, r in olc.values()),
                                               'not': 'v8.2: kutu ile gövde (kazak gövdesi, pantolon, baş) ve raf (üst tahta, taban, bölmeler) kesişimi'}
    return act


def kutu_al_diz():
    son = 210
    AL, CIK, YER, KALK, BIRAK = 42, 54, 60, 82, 100   # v7: al 40 → 42 (gövde kavrama pozuna 37'de varır, el 42'de kutuda)
    ex, ey, ez = (v * U for v in KUTU_DIZ['olcu'])
    Sz = POZ['SEIZA']
    # dik diz, ayak üstleri yerde: kalça dizlerin üstünde
    D2 = poz_kopya(Sz); D2['omX'] = 4
    _kalca_diz_mesh(D2, 0.017)
    POZ['DIK_DUZ'] = D2
    # dizin ağının önü (seiza ve dik dizde en öndeki): raf, kutu yere konunca dizlerle arasında pay kalacak uzaklıkta
    on_y = []
    for p in (Sz, D2):
        _poz_olc(p); pb = rig.pose.bones; N = ag_noktalari(('pantolon',))
        on_y.append(min(v.y for v in N['pantolon'] if v.z < 0.15 and min((v - pb['baldır.' + t].head).length for t in 'LR') < 140 * U))
    bpy.data.actions.remove(bpy.data.actions['Hareket - _poz_olc'])
    diz_on = min(on_y)
    on = -diz_on + ey + KUTU_DIZ['pay'] * U
    ON_MM = round(on * MM)
    ic = Vector((0, -(on + ey / 2), (KUTU_DIZ['ic_alt'] * U + ez / 2)))            # gözdeki kutunun merkezi (önü rafın önüyle bir)
    # v8.2 (kullanıcı: "kutu küçük rafın içinden geçiyor"; v7'de kutu gözden çıkarken yükselip rafa doğru geri gidiyor, üst
    # tahtanın (382–420) içinden geçiyordu): önce gözün tabanında YATAY çekilir (8 mm kalkık), uzak kenarı rafın önünü 9 mm
    # geçince dizlerin önünde DİK kalkar (üst tahtanın 25 mm üstüne), sonra rafın üstüne ileri taşınır ve iner. Gövde kutuya
    # yer açmak için geriye yaslanır (kalça geri; ölçülüp kutu–gövde kesişimi kalçayla giderilir: kutu_govde_coz).
    cik = Vector((0, -on + 0.006 + ey / 2, ic.z + 0.006))                            # gözden tamamen çıktı (uzak kenar rafın 9 mm önünde)
    ust = Vector((0, -(on + ey / 2) + 0.004, KUTU_DIZ['ust'] * U + ez / 2))          # rafın üstünde (önü rafın önüyle bir, 6 mm taşar)
    zt = (KUTU_DIZ['ust'] + 25) * U + ez / 2                                           # taşıma yüksekliği: alt yüz üst tahtanın 25 mm üstünde
    kald = Vector((0, cik.y + 0.004, zt + 0.004))
    km = [(1, ic), (AL, ic), (48, ic + Vector((0, 0.07, 0.005))), (CIK, cik), (YER, cik + Vector((0, 0.004, 0.11))), (66, cik + Vector((0, 0.005, 0.22))),
          (72, Vector((0, cik.y + 0.003, zt))), (KALK, Vector((0, (cik.y + ust.y) / 2, zt + 0.004))), (92, ust + Vector((0, 0.002, 0.016))),
          (BIRAK - 2, ust + Vector((0, 0, 0.003))), (BIRAK, ust), (son, ust)]
    km = [(f, tuple(v)) for f, v in km]
    kutu_mat = lambda f: Matrix.Translation(vanahtar(km, f))
    TUT_Y = ey / 2 - 0.004                                                            # sol el: yan yüzün yakın köşesi (6 mm içeride)
    kenar = lambda f, s: kutu_mat(f) @ (Vector((s * (ex / 2 + 0.012), TUT_Y - 0.03, ez * 0.2)) if s > 0 else Vector((-0.07, TUT_Y - 0.026, ez / 2 + 0.013)))
    # v8.2: sağ el kutunun ÜSTÜNDEN yakın kenara yakın tutar (avuç aşağı, parmaklar ileri, başparmak yakın yüzde): gözün yan
    # boşluğu (20 mm) ele yer vermiyordu, v7'de sağ el yan yüzün dışında bölmenin içindeydi. Sol el kutu dışarı çıkınca sol yan yüze.
    TUT_YON = lambda s: ((0, -1, 0.15), (-s, 0, 0)) if s > 0 else ((0.05, -1, -0.12), (0, 0, -1))
    KAP0, KAP_EL1 = 108, 122
    kapak = [[1, 0], [KAP0, 0], [114, 28], [KAP_EL1, 58], [128, 86], [132, 96], [136, 90], [son, 90]]
    kapak_on = lambda f: Matrix.Translation(vanahtar(km, f) + Vector((0, -ey / 2, ez / 2))) @ Matrix.Rotation(math.radians(anahtar(kapak, f)), 4, 'X') @ Vector((0, ey, 0.008))
    eg = lambda X, kal=Vector(): poz_kopya(D2, kalca=D2['kalca'] + kal, omX=X)
    sz = lambda X, kal=Vector(): poz_kopya(Sz, kalca=Sz['kalca'] + kal, omX=X)
    # alçaktaki kutuya (göz, yer) topuklarda oturarak derin eğilir (uyluk eklemi topukta kalır, omuzlar ~420 mm'ye iner);
    # rafın üstüne koymak için dizlerinin üstünde doğrulur (dik diz)
    # v7 (kullanıcı: "yüz rafın içine giriyor"; v6'da seizada 80° eğilip baş rafın ön yüzünün 150 mm içine giriyordu):
    # gözdeki kutuya dizlerinin üstünde (dik diz) kalça öne verilerek uzanır; baş rafın üstünün üstünde kalır (raf hacmine
    # girmez), sağ omuz öne ve aşağı uzar (omuz.R), gövde sola döner, göğüs yana yatar. Pozlar ölçülerek bulundu (scratch:
    # baş–raf kesişimi 0, el hedefe 0 mm).
    # v8.2: ağırlık aktarımı (uzanırken kalça sağ dize kayar, çekerken geri oturur, kaldırırken gövde geriye yaslanır: kutuya yer)
    X_ = lambda x, y, z=0.0: Vector((x, y, z))
    akis = [(1, poz_kopya(Sz)), (6, sz(4)), (18, sz(16, X_(-0.006, -0.005, 0.004))), (26, eg(28, X_(-0.014, -0.03))),
            (33, eg(46, X_(-0.022, -0.06))), (37, eg(52, X_(-0.024, -100 * U))), (AL, eg(52, X_(-0.024, -100 * U))), (48, eg(42, X_(-0.012, -0.03))),
            (CIK, eg(26, X_(0.0, 0.03, -0.02))), (YER, eg(12, X_(0.008, 0.05, -0.03))), (66, eg(6, X_(0.008, 0.055, -0.02))), (72, eg(6, X_(0.004, 0.035, -0.005))),
            (KALK, eg(12, X_(0, -0.01))),
            (92, eg(22, Vector((0, -0.05, 0)))), (BIRAK, eg(25, Vector((0, -0.06, 0)))), (106, eg(12, Vector((0, -0.01, 0)))), (KAP0, eg(16, Vector((0, -0.02, 0)))),
            (KAP_EL1, eg(20, Vector((0, -0.025, 0.005)))), (130, eg(8)), (142, poz_kopya(Sz, kalca=Sz['kalca'] + Vector((0, 0, 0.006)), omX=6)),
            (150, poz_kopya(Sz, omX=8)), (180, poz_kopya(Sz, omX=6)), (196, poz_kopya(Sz, omX=3)), (son, poz_kopya(Sz))]
    S = poz_akisi(akis, son)
    S['don']['göğüs']['X'] = [[1, 0], [26, 8], [AL, 15], [48, 10], [CIK, 6], [YER, 2], [74, 0], [KALK, 2], [BIRAK, 6], [130, 2], [150, 4], [son, 0]]
    # gözdeki kutuya tek kolla uzanır: gövde sola döner (sağ omuz öne), baş sola çevrilip yana eğilir (büyük baş rafın önüne
    # çarpmasın), sol el rafın üstüne dayanır; kutu yere inince iki el yanlarından tutar
    S['don']['omurga']['Z'] = [[1, 0], [20, 6], [AL, 12], [48, 9], [CIK, 5], [YER, 2], [70, 0], [KAP0, 0], [116, -6], [138, 4], [160, -3], [son, 0]]
    S['don']['göğüs']['Z'] = [[1, 0], [20, 2], [30, 0], [YER, 0]]
    S['don']['göğüs']['Y'] = [[1, 0], [20, 0], [30, -20], [AL, -27.5], [48, -16], [CIK, -6], [YER, 0]]
    S['don']['omuz.R'] = {ax: [[1, 0], [28, 0], [35, 30], [AL, 30], [48, 14], [CIK, 6], [YER, 0], [son, 0]] for ax in 'XZ'}
    S['don']['kafa'] = {'Z': [[1, 0], [20, -6], [30, 0], [YER, 0]], 'X': [[1, 2], [26, -16], [33, -28], [AL, -30], [48, -26], [CIK, -20], [YER, -12], [74, -4], [KALK, 4], [BIRAK, 6], [150, 14], [180, 12], [son, 2]], 'Y': [[150, 0], [160, -8], [170, 6], [180, 0]]}
    # v7: gözdeki kutuya uzanırken bakış başı rafa doğru eğmesin (baş raf hacminin dışında); uçlarda 0 (zincir pozu)
    S['bak'] = {'agirlik': [[1, 0], [16, 0.5], [26, 0], [58, 0], [68, 0.8], [140, 0.8], [176, 0.7], [son - 14, 0.3], [son, 0]],
                'yer': [(1, km[0][1]), (AL, km[0][1]), (YER, tuple(vanahtar(km, YER))), (KALK, tuple(vanahtar(km, KALK))), (BIRAK, km[-2][1]), (150, tuple(Vector(km[-1][1]) + Vector((0, 0, 0.03)))), (son, km[-1][1])]}
    gt = [1, 8, 20, 30, 36] + list(range(AL, BIRAK + 1, 2)) + [104, 112, 120, 128, 140, 150, 176, 196, son]
    def el(t, s):
        yer_, yon_ = [], []
        for f in gt:
            if f <= 8:
                yer_.append((f, ELLER_DIZ[t]['yer'])); yon_.append((f, ELLER_DIZ[t]['yon']))
            elif t == 'L' and 20 <= f <= 48:   # sol el rafın üstüne dayanır (ön kenarın 30 mm içi)
                if f in (20,): yer_.append((f, (0.16, -0.2, 0.3))); yon_.append((f, ((0, -1, -0.3), (0, 0, -1))))
                elif f in (30, 36, 40, 44, 48): yer_.append((f, (0.19, -(on + 0.02), (KUTU_DIZ['ust'] + 12) * U))); yon_.append((f, ((0.1, -1, 0), (0, 0, -1))))
            elif t == 'L' and 48 < f < 58:
                continue
            elif f < AL:   # öne uzanır: kavrama noktasının önünden ve dışından gelir
                w = {20: 0.0, 30: 0.6, 36: 0.9}[f]
                hedef = kenar(AL, s) + Vector((0.04 * s, 0.07, 0.06)) * (1 - w)
                yer_.append((f, tuple(Vector(ELLER_DIZ[t]['yer']).lerp(hedef, min(1.0, 0.35 + w)))))
                yon_.append((f, TUT_YON(s) if w > 0.5 else ((0, -1, -0.2), (-s * 0.6, 0, -0.6))))
            elif f <= BIRAK:   # kutuda (kutu el.R'ye bağlı: el–kutu ilişkisi sabit)
                yer_.append((f, tuple(kenar(f, s)))); yon_.append((f, TUT_YON(s)))
            elif t == 'R' and KAP0 - 4 <= f <= KAP_EL1 + 6:
                if f < KAP0:
                    yer_.append((f, tuple(kapak_on(KAP0) + Vector((0, 0.04, 0.02))))); yon_.append((f, ((0, -1, -0.3), (0, 0.3, -1))))
                elif f <= KAP_EL1:
                    yer_.append((f, tuple(kapak_on(f) + Vector((0, 0.012, -0.012))))); yon_.append((f, ((0, -1, -0.2), (0, 0.4, 1))))
                else:
                    yer_.append((f, tuple(kapak_on(KAP_EL1) + Vector((0, 0.06, -0.05))))); yon_.append((f, ((0, -1, -0.3), (0, 0, -1))))
            elif f <= 112:
                yer_.append((f, tuple(kenar(BIRAK, s) + Vector((0.03 * s, 0.08, 0.02))))); yon_.append((f, ((0, -1, -0.2), (-s * 0.6, 0, -0.6))))
            elif f < 140:
                yer_.append((f, (0.14 * s, -0.16, 0.32))); yon_.append((f, ((0, -1, -0.3), (0, 0, -1))))
            else:
                yer_.append((f, ELLER_DIZ[t]['yer'])); yon_.append((f, ELLER_DIZ[t]['yon']))
        dirsek = [(1, ELLER_DIZ[t]['dirsek']), (20, (0.42 * s, 0.05, 0.35)), (AL, (0.45 * s, -0.25, 0.45)), (YER, (0.45 * s, -0.1, 0.35)), (KALK, (0.42 * s, 0.05, 0.25)),
                  (BIRAK, (0.42 * s, -0.05, 0.35)), (150, ELLER_DIZ[t]['dirsek']), (son, ELLER_DIZ[t]['dirsek'])]
        return {'ik': [[1, 1], [son, 1]], 'yer': yer_, 'yon': yon_, 'dirsek': dirsek}
    S['el'] = {'L': el('L', 1), 'R': el('R', -1)}
    S['parmak'] = {t: [[1, 0.2], [20, 0.05], [AL - 2, 0.05], [AL + 2, 0.45], [BIRAK, 0.45], [BIRAK + 4, 0.1], [140, 0.2], [son, 0.2]] for t in 'LR'}
    S['parmak']['L'] = [[1, 0.2], [20, 0.05], [48, 0.05], [55, 0.05], [58, 0.45], [BIRAK, 0.45], [BIRAK + 4, 0.1], [140, 0.2], [son, 0.2]]
    S['agiz'] = [[132, 0], [138, 0.4], [146, 0.15], [160, 0.1], [170, 0]]   # "vay" ağzı
    S['canli'] = 0.4; S['nefes_uc'] = True
    temas = {'L': [(30, 48), (58, BIRAK)], 'R': [(AL, BIRAK), (KAP0, KAP_EL1)]}
    # kutu elde (al–birak) iken kalça zemin için kaldırılmaz: eller kutudan kayıyordu (sol 16, sağ 20 mm); o aralıkta
    # dizler v6'daki gibi zemine ~48 mm gömülü kalır (ölçü OLCUM_V7.diz)
    act = zemin_raf_coz('kutu_al_diz', son, S, temas, ON_MM, zemin_haric=[(AL - 4, BIRAK + 4)])
    act = kutu_govde_coz('kutu_al_diz', son, S, temas, act, km, ON_MM, (AL - 2, BIRAK + 2))
    kare_ayarla(act, 70)
    yer_ = rig.pose.bones['el.R'].matrix.inverted() @ kutu_mat(70)
    t_, q_, _ = yer_.decompose()
    hata = {'sol': el_hatasi(act, S, 'L', 58, BIRAK), 'sag': el_hatasi(act, S, 'R', AL, BIRAK), 'kapak': el_hatasi(act, S, 'R', KAP0, KAP_EL1)}
    # el–kutu kayması: kutu sitede el.R'ye bağlı; al–birak boyunca kutunun el.R'ye göre yeri ne kadar oynuyor
    kay = 0.0
    for f in range(AL, BIRAK + 1, 2):
        kare_ayarla(act, f); kay = max(kay, ((rig.pose.bones['el.R'].matrix @ yer_).translation - vanahtar(km, f)).length)
    meta = {'sure': round(son / 30, 2), 'al': AL, 'birak': BIRAK, 'kapak_ac': [KAP0, 132], 'kapak_el': [KAP0, KAP_EL1], 'bak': [140, 196],
            'kutu': {'olcu': list(KUTU_DIZ['olcu']), 'raf_on_mm': ON_MM, 'raf_ust_mm': KUTU_DIZ['ust'], 'ic_alt_mm': KUTU_DIZ['ic_alt'],
                     'ic_merkez': mm(ic), 'ust_merkez': mm(ust), 'cik_merkez': mm(cik), 'kemik': 'el.R', 'el_yerel': mm(t_),
                     'el_yerel_q': [round(x, 4) for x in (q_.x, q_.y, q_.z, q_.w)],
                     'kapak': [[f, round(anahtar(kapak, f), 1)] for f in range(KAP0 - 2, 141, 2)],
                     'kapak_mentese': 'üst yüzün arka (uzak) kenarı, derece (+ açılır: yakın kenar kalkar)'},
            'hata_mm': {**hata, 'sol_destek': el_hatasi(act, S, 'L', 30, 48), 'el_kutu_kayma': round(kay * MM, 1)},
            'not': 'v6: diz_cok (seiza) sonrası oynar, sonra diz_kalk. Kök rafın ön yüzünden raf_on_mm geride (dizlerle raf arasına '
                   'kutu yere konabilsin). al–birak arası kutu el.R\'ye el_yerel ile bağlı (iki el yanlarında); birak\'tan sonra ust_merkez\'de '
                   '(rafın üstü 420). Kutu gözden ic_merkez\'den çıkar.'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    # ölçüm: taşıma (kutu yerden kalkınca → bırakana dek) iki kol; seiza karelerinde diz/kalça/gövde
    tasi = list(range(CIK, BIRAK + 1, 2))
    OLCUM_V5['tutus']['kutu_al_diz'] = {**tutus_olc(act, 'R', tasi), 'not': 'v6: taşıma kareleri %d–%d (sağ kol; kutu gözden çıktıktan bırakılana dek)' % (CIK, BIRAK)}
    OLCUM_V6.setdefault('diz', {})['kutu_al_diz'] = {
        'tasima_kareleri': [tasi[0], tasi[-1]], 'sag_kol': tutus_olc(act, 'R', tasi), 'sol_kol': tutus_olc(act, 'L', range(58, BIRAK + 1, 2)),
        'tum_tutus_sag': tutus_olc(act, 'R', range(AL, BIRAK + 1, 2)),
        'not_kol': "sağ el kutuyu al (40) karesinde gözden kavrar, sol el 30–48 rafın üstüne dayanır, 58'de kutuya katılır (sol kol 58–100)",
        'seiza_bas': diz_olc(act, 1), 'seiza_son': diz_olc(act, son), 'bak_orta': diz_olc(act, 170), 'raf_on_mm': ON_MM, 'el_hata_mm': meta['hata_mm']}
    KUTU7.update(on=on, ON_MM=ON_MM, ust=ust, ic=ic, cik=cik, km=km, kapak=kapak, el_yerel=t_, el_yerel_q=q_, AL=AL, BIRAK=BIRAK, KAP0=KAP0,
                 KAP_EL1=KAP_EL1, son=son, D2=D2, TUT_Y=TUT_Y, olcu=(ex, ey, ez), meta=meta)
    return act


# ---- kitaplıktan nesne alma: üç raf yüksekliği için üç klip (site IK çalıştırmaz: klipler pişmiş dönüş) ----
# Seçim gerekçesi: GLB'de IK yok, tek klip + yükseklik meta'sı sitede çalışma anı IK'sı (kol + gövde + ayak) ister;
# üç pişmiş klip ~3 × 4 sn kemik kanalı (budamadan sonra birkaç yüz KB) ve sıfır site kodu: en ucuzu bu. Ara
# yükseklikler en yakın varyantla oynar (±300 mm içinde el hedefe göre ~100 mm sapar; site nesneyi ele bağlar).
# Raf ön kenarı kökün 280 mm önünde; nesne (kitap 150 × 30 × 220 mm, dik) ön kenardan 60 mm içeride.
KITAP = {'on': 280, 'ic': 60, 'olcu': (30, 150, 220)}


def kitap_al(var, h):
    son = 150
    on = KITAP['on'] * U
    z = h * U + KITAP['olcu'][2] * U / 2
    ust_sinir = 0.93                           # parmak ucunda en yüksek avuç (ölçüldü ~1400 mm)
    zg = min(z, ust_sinir)
    p = Vector((-0.03, -(on + KITAP['ic'] * U), zg))
    gos = Vector((-0.07, -0.15, 0.62))   # göğüs önü, yüzü örtmez; dirsek ~100°         # yüz önünde, kapağı kameraya (−y)
    AL, GOS0, GOS1, KOY = 34, 62, 102, 124
    egil = h < 600
    uc = h > 1300
    kal = [(1, (0, 0, 0)), (20, (0, 0.03, -0.09) if egil else (0, -0.01, 0.01)), (AL, (0, 0.05, -0.11) if egil else (0, -0.015, 0.035 if uc else 0.0)),
           (48, (0, 0.0, -0.01)), (GOS0, (0, 0, 0)), (GOS1, (0, 0, 0)), (114, (0, 0.03, -0.09) if egil else (0, -0.01, 0.01)),
           (KOY, (0, 0.05, -0.11) if egil else (0, -0.015, 0.035 if uc else 0.0)), (138, (0, 0, 0)), (son, (0, 0, 0))]
    ayak = [(1, (0, 0, 0)), (son, (0, 0, 0))]
    S = {'nefes': 0.9, 'kalca': kal, 'ayak': {'L': ayak, 'R': ayak}}
    if uc: S['ayak_don'] = {t: [[1, 0], [16, 0], [28, 28], [40, 28], [50, 0], [110, 0], [120, 28], [130, 28], [140, 0], [son, 0]] for t in 'LR'}
    ox = 30 if egil else (-8 if uc else 4)
    S['don'] = {'omurga': {'X': [[1, 0], [AL, ox], [50, 2], [GOS0, -2], [GOS1, -2], [KOY, ox], [140, 0], [son, 0]]},
                'göğüs': {'X': [[1, 0], [AL, ox * 0.4], [GOS0, -3], [GOS1, -3], [KOY, ox * 0.4], [son, 0]], 'Y': [[GOS0, 0], [74, -4], [88, 3], [GOS1, 0]]},
                'kafa': {'Z': [[GOS0, 0], [72, 8], [86, -6], [GOS1, 0]]}}
    S['bak'] = {'agirlik': [[1, 0], [10, 0.85], [GOS0 - 6, 0.85], [GOS0, 0.6], [GOS1, 0.6], [108, 0.85], [136, 0.85], [son, 0]],
                'yer': [(1, tuple(p)), (AL, tuple(p)), (52, tuple(gos)), (GOS1, tuple(gos)), (112, tuple(p)), (son, tuple(p))]}
    KAP = ((0, -0.4, 1), (0, -1, 0))           # parmaklar yukarı, avuç ileri (kitabın sırtını kavrar)
    GOS_YON = ((0.3, 0.1, 1), (1, 0.2, 0))     # avuç sola (kitabın arkası), kapak kameraya
    R_yer = [(1, (-0.2, -0.07, 0.38)), (22, tuple(p + Vector((-0.02, 0.07, -0.03)))), (AL, tuple(p)), (40, tuple(p + Vector((0, 0.05, 0)))),
             (52, tuple(gos + Vector((-0.04, 0.04, -0.04)))), (GOS0, tuple(gos)), (80, tuple(gos + Vector((0.005, -0.01, 0.01)))), (GOS1, tuple(gos)),
             (114, tuple(p + Vector((0, 0.05, 0)))), (KOY, tuple(p)), (130, tuple(p + Vector((-0.02, 0.07, -0.03)))), (146, (-0.2, -0.07, 0.38))]
    R_yon = [(1, SARK['R']), (22, KAP), (40, KAP), (54, GOS_YON), (GOS1, GOS_YON), (114, KAP), (130, KAP), (146, SARK['R'])]
    S['el'] = {'R': {'ik': [[1, 0], [14, 1], [136, 1], [148, 0]], 'yer': R_yer, 'yon': R_yon,
                     'dirsek': [(1, (-0.42, 0.05, 0.3)), (AL, (-0.4, 0.05, 0.45) if not uc else (-0.35, 0.0, 0.7)), (GOS0, (-0.4, 0.05, 0.5)), (GOS1, (-0.4, 0.05, 0.5)),
                                (KOY, (-0.4, 0.05, 0.45) if not uc else (-0.35, 0.0, 0.7)), (son, (-0.42, 0.05, 0.3))]},
               'L': {'ik': [[1, 0], [GOS0 - 8, 0], [GOS0, 1], [GOS1, 1], [GOS1 + 8, 0]],   # sol el kitabın alt kenarını destekler
                     'yer': [(1, (0.2, -0.07, 0.38)), (GOS0, tuple(gos + Vector((0.09, 0.0, -0.1)))), (GOS1, tuple(gos + Vector((0.09, 0.0, -0.1)))), (GOS1 + 10, (0.2, -0.07, 0.38))],
                     'yon': [(1, SARK['L']), (GOS0, ((-1, -0.2, 0.3), (0, 0, 1))), (GOS1, ((-1, -0.2, 0.3), (0, 0, 1))), (GOS1 + 10, SARK['L'])],
                     'dirsek': [(1, (0.42, 0.05, 0.3)), (son, (0.42, 0.05, 0.3))]}}
    S['parmak'] = {'R': [[1, 0.15], [28, 0.0], [AL, 0.0], [AL + 3, 0.55], [KOY, 0.55], [KOY + 3, 0.0], [140, 0.15]], 'L': [[1, 0.15], [GOS0, 0.3], [GOS1, 0.3], [son, 0.15]]}
    S['basparmak'] = {'R': [[1, 0], [AL, 0], [AL + 3, 0.5], [KOY, 0.5], [KOY + 3, 0], [son, 0]]}
    S['agiz'] = [[GOS0, 0], [70, 0.2], [78, 0.0], [son, 0]]
    act = kol_coz(f'kitap_al_{var}', son, S, {'R': [(AL, AL), (GOS0, GOS1), (KOY, KOY)]})
    kare_ayarla(act, AL); uz = (el_noktasi('R') - p).length * MM
    meta = {'sure': round(son / 30, 2), 'al': AL, 'goster': [GOS0, GOS1], 'koy': KOY, 'raf_mm': h,
            'nesne': {'kemik': 'tutma.R', 'olcu': list(KITAP['olcu']), 'raf_nokta': mm(p), 'goster_nokta': mm(gos), 'tut': [AL, KOY],
                      'not': 'nesnenin merkezi tutma.R kemiğinin başında; al–koy arası elde, dışında raf_nokta\'da'},
            'raf_on_mm': KITAP['on'], 'el_raf_hata_mm': round(uz, 1),
            'not': 'kitaplık önünde, kök rafın ön kenarından raf_on_mm geride; goster aralığında nesnenin kapağı kameraya (−y, karakterin baktığı yön) dönük, yakın plan'}
    if uc and z > ust_sinir: meta['uyari'] = f'raf {h} mm: karakter parmak ucunda en çok {round(ust_sinir * MM)} mm\'ye (avuç) uzanır; nesne o yüksekliğe konmalı'
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    OLCUM_V5['tutus'][f'kitap_al_{var}'] = tutus_olc(act, 'R', range(GOS0, GOS1 + 1, 8))
    return act


# ---- armut koltukta TV (v6, 2026-11-04; kullanıcı: "karakter armut koltuğa gömülüyor, ÜSTÜNDE oturmalı") ----
# v5 kalça eklemini oturak yüksekliğinin (430) ~130 mm altına koyuyordu: kalçanın alt yüzü (pantolon, eklemin ~140 mm altı)
# armudun ~250 mm içindeydi. v6 armudun GERÇEK yüzeyini kullanır: scripts/karakter-armut-geo.py sitenin armut({ seed: 1 })
# geometrisini birebir kurar (oturak orta çizgide r 120–240'ta z 454–473, ön kenar r ~400; sırtlık r < 80'de yükselir).
# Kalça, kalçanın en alt noktası oturak yüzeyinin en çok ARMUT['cokme'] (30) mm altına inecek yüksekliğe ölçülerek konur.
# Ölçek sonucu (sitedeki armut, Biggie'nin bacağı kalça→bilek ~360 mm, ayakta kalça 456): oturan kalça ~570 mm'de; ayaklar
# yere YETİŞMEZ (bilek en alçak ~300 mm): bacaklar ön kenardan sarkar. Ayak yerde oturuş için armudun oturağı ≤ ~315 mm
# olmalı (sitede armut ölçeği ≤ 0,68): ARMUT['olcek'] bunun içindir (sitede ölçek değişirse burada da değişip klip yeniden
# kurulur; ayaklar yetişiyorsa yere basar).
# Akış: armudun önünde, sırtı ona dönük durur (site getirir) → bir adım geri, çömelir → geri ve yukarı sıçrayıp oturağa
# oturur (yaslanır, ayaklar sarkar) → sağ yanındaki kumandayı (armudun sağ kolunun üstünde) alır, TV'yi açar (84) →
# izler (100–220 döngü) → kumandayı yerine koyar → öne kayıp yere iner, doğrulur.
ARMUT = {'seed': 1, 'olcek': 1.0, 'eksen': 600, 'otur_r': 230, 'cokme': 30}
_ARMUT = {}


def armut_veri():
    """Armudun yüzeyi karakter yerelinde (Blender birimi): ekseni kökün ARMUT['eksen'] mm arkasında, önü karakterin baktığı
    yön (−y; TV'ye). BVH, dışa bakan normal işareti ve yüzey yüksekliği."""
    if _ARMUT: return _ARMUT
    from mathutils.bvhtree import BVHTree
    A = armut_kur(ARMUT['seed']); s = ARMUT['olcek'] * U; e = Vector((0, ARMUT['eksen'] * U, 0))
    vs = [Vector(v) * s + e for v in A['verts']]
    bvh = BVHTree.FromPolygons(vs, A['faces'])
    ust = Vector((0, ARMUT['eksen'] * U, 3.0)); loc, n, _, _ = bvh.find_nearest(ust)
    _ARMUT.update(bvh=bvh, isaret=1.0 if (ust - loc).dot(n) > 0 else -1.0, P=A['P'], verts=vs, faces=A['faces'])
    return _ARMUT


def armut_yuzey(x, y):
    """(x, y)'deki armudun üst yüzeyi (Blender birimi) ya da None"""
    h = armut_veri()['bvh'].ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)))
    return h[0].z if h[0] is not None else None


def armut_icinde(p):
    """p armudun ne kadar içinde (Blender birimi, 0 = dışarıda)"""
    A = armut_veri(); loc, n, _, d = A['bvh'].find_nearest(p)
    if loc is None or (p - loc).dot(n) * A['isaret'] >= 0: return 0.0
    return d


GOVDE_AG = ('pantolon', 'kazak', 'sol ayak', 'sağ ayak', 'kafa', 'saç sakal')


def ag_noktalari(adlar=GOVDE_AG):
    """O karedeki (pozlu) ağların köşeleri, armatür uzayında"""
    dg = bpy.context.evaluated_depsgraph_get(); out = {}
    for ad in adlar:
        o = bpy.data.objects[ad].evaluated_get(dg); me = o.to_mesh()
        out[ad] = [rig.matrix_world.inverted() @ (o.matrix_world @ v.co) for v in me.vertices]
        o.to_mesh_clear()
    return out


def armut_olc(act, f):
    """Bir karede: kalçanın en alt noktası ile altındaki oturak yüzeyi farkı (mm; − gömülme), gövdenin armuda en derin girişi
    (mm, hangi ağ), ayakların yerden yüksekliği (mm)"""
    kare_ayarla(act, f); N = ag_noktalari()
    k = rig.pose.bones['kalça'].head
    kal = []
    for v in N['pantolon']:
        if v.z < k.z and math.hypot(v.x - k.x, v.y - k.y) < 140 * U:
            z0 = armut_yuzey(v.x, v.y)
            if z0 is not None: kal.append((v.z - z0) * MM)
    gir = (0.0, '')
    for ad, vs in N.items():
        for v in vs[::2]:
            d = armut_icinde(v) * MM
            if d > gir[0]: gir = (d, ad)
    ayak = min(v.z for ad in ('sol ayak', 'sağ ayak') for v in N[ad]) * MM
    return {'kalca_alt_mm': round(min(kal), 1) if kal else None, 'giris_mm': round(gir[0], 1), 'giris_ag': gir[1], 'ayak_yerden_mm': round(ayak, 1)}


def tv_armut_S(otur, ayak_otur, son=300):
    """otur: oturan kalçanın Durma'ya göre kayması; ayak_otur: oturuşta bilek hedefinin kayması (sarkan ayak)"""
    G1, BAS, D0, D1, BIR, K0 = 40, 84, 100, 220, 232, 244
    geri = Vector((0, 0.04, 0))                     # ilk adım: ayaklar 60 mm geri (topuk armudun şişkinliğine yaklaşır)
    cok = Vector((0, 0.03, -0.05))                  # sıçramadan önce çömelme
    kal = [(1, (0, 0, 0)), (8, (0, 0.012, -0.006)), (16, tuple(geri + Vector((0, 0, -0.01)))), (22, tuple(cok + Vector((0, 0.01, 0))))]
    kal += [(28, tuple(otur * 0.55 + Vector((0, 0, 0.05)))), (33, tuple(otur + Vector((0, -0.006, 0.025)))), (37, tuple(otur + Vector((0, 0, -0.006)))),
            (G1, tuple(otur)), (D1, tuple(otur)), (K0, tuple(otur)), (250, tuple(otur + Vector((0, -0.04, 0.005))))]
    kal += [(258, tuple(otur * 0.5 + Vector((0, -0.07, 0.0)))), (264, tuple(cok + Vector((0, -0.02, -0.01)))), (274, (0, -0.012, -0.012)),
            (282, (0, -0.004, 0.004)), (290, (0, 0, -0.002)), (son, (0, 0, 0))]
    ay = {}
    for t, sx in (('L', 1), ('R', -1)):
        ao = Vector(ayak_otur) + Vector((sx * 0.005, 0, 0))
        ay[t] = [(1, (0, 0, 0)), (6 if t == 'R' else 9, (0, 0, 0)), (9 if t == 'R' else 12, tuple(geri * 0.5 + Vector((0, 0, 0.025)))),
                 (12 if t == 'R' else 15, tuple(geri)), (24, tuple(geri)), (29, tuple(ao * 0.5 + Vector((0, -0.03, 0.05)))), (35, tuple(ao + Vector((0, -0.01, -0.012)))),
                 (G1, tuple(ao)), (D0, tuple(ao)), (130, tuple(ao + Vector((0, -0.008, 0.006)))), (160, tuple(ao)), (190, tuple(ao + Vector((0, -0.006, 0.004)))),
                 (K0, tuple(ao)), (252, tuple(ao + Vector((0, -0.04, 0.0)))), (259, tuple(geri * 0.3 + Vector((0, -0.04, 0.03)))),
                 (263 if t == 'L' else 265, tuple(geri * 0.3 + Vector((0, -0.04, 0)))), (284, tuple(geri * 0.3 + Vector((0, -0.04, 0)))),
                 (288 if t == 'L' else 292, (0, -0.012, 0.02)), (292 if t == 'L' else 296, (0, 0, 0)), (son, (0, 0, 0))]
    bilek = [[1, 0], [24, 0], [30, 18], [G1, 28], [K0, 28], [254, 20], [262, 0], [son, 0]]   # sarkan ayak hafif uzanır
    S = {'nefes': 1.2, 'kalca': kal, 'ayak': ay, 'ayak_bilek': {'L': bilek, 'R': bilek}}
    S['don'] = {'omurga': {'X': [[1, 0], [10, 8], [22, 22], [28, 8], [34, -12], [G1, -14], [52, -8], [70, -10], [D0, -15], [D1, -15], [K0, -10],
                                 [250, 24], [258, 30], [266, 26], [278, 6], [son, 0]],
                           'Y': [[G1, 0], [52, -10], [62, -12], [72, -2], [D0, 0], [BIR - 8, 0], [BIR, -10], [K0, 0]]},
                'göğüs': {'X': [[1, 0], [12, 6], [22, 8], [34, -6], [D0, -7], [D1, -7], [262, 8], [son, 0]]},
                'kafa': {'X': [[1, 0], [12, 8], [22, 6], [36, -2], [56, 10], [70, -4], [D0, -6], [140, -4], [170, -7], [D1, -6], [262, 8], [son, 0]],
                         'Z': [[1, 0], [52, -18], [64, -10], [76, 0], [130, 6], [160, -5], [190, 3], [D1, 0], [BIR, -16], [K0, 0]],
                         'Y': [[150, 0], [156, 5], [166, 0]]}}
    return S, (G1, BAS, D0, D1, BIR, K0)


def tv_armut_kalca():
    """Oturan kalçanın yerini ölçerek seçer: kalça otur_r'nin üstünde, en alt noktası yüzeyin cokme mm altında. Ayak
    hedefi: bilek ön şişkinliğin ~50 mm önünde, bacak boyunun %94'ü uzakta (yetişirse yerde)"""
    ky = (ARMUT['eksen'] - ARMUT['otur_r']) * U
    k0 = REST['kalça'].translation
    bilek0 = durma_ayak('L').translation
    A = armut_veri()
    # ön şişkinliğin en önü (karakter yerelinde en küçük y; bilek yüksekliği bandında)
    on_y = min(v.y for v in A['verts'] if abs(v.x) < 0.12)
    bacak = ((REST['baldır.L'].translation - REST['uyluk.L'].translation).length + (REST['ayak.L'].translation - REST['baldır.L'].translation).length)
    sec = None
    for it in range(4):
        dz = sec if sec is not None else 0.08
        otur = Vector((0, ky - k0.y, dz))
        hz = k0.z + dz
        by = on_y - 0.035
        yat = abs(by - ky)
        dik = math.sqrt(max(0.0, (bacak * 0.94) ** 2 - yat * yat))
        bz = max(bilek0.z, hz - dik)
        ayak = Vector((0, by - bilek0.y, bz - bilek0.z))
        S, _ = tv_armut_S(otur, ayak)
        S2 = {k: v for k, v in S.items() if k in ('nefes',)}
        S2['kalca'] = [(1, tuple(otur)), (3, tuple(otur))]
        S2['ayak'] = {t: [(1, tuple(ayak)), (3, tuple(ayak))] for t in 'LR'}
        S2['ayak_bilek'] = {t: [[1, 28], [3, 28]] for t in 'LR'}
        S2['don'] = {'omurga': {'X': [[1, -15], [3, -15]]}, 'göğüs': {'X': [[1, -7], [3, -7]]}}
        S2['canli'] = 0
        act = klip_kur('_armut_olc', 3, S2)
        o = armut_olc(act, 2)
        hedef = -ARMUT['cokme']
        print('ARMUT kalça dz', round(dz * MM), 'kalça z', round(hz * MM), 'ölçü', o)
        if o['kalca_alt_mm'] is None: break
        sec = dz + (hedef - o['kalca_alt_mm']) * U
        if abs(o['kalca_alt_mm'] - hedef) < 2: break
    bpy.data.actions.remove(bpy.data.actions['Hareket - _armut_olc'])
    otur = Vector((0, ky - k0.y, sec)); hz = k0.z + sec
    by = on_y - 0.035; yat = abs(by - ky); dik = math.sqrt(max(0.0, (bacak * 0.94) ** 2 - yat * yat))
    bz = max(bilek0.z, hz - dik)
    return otur, Vector((0, by - bilek0.y, bz - bilek0.z))


def tv_armut():
    son = 300
    otur, ayak_otur = tv_armut_kalca()
    S, (G1, BAS, D0, D1, BIR, K0) = tv_armut_S(otur, ayak_otur, son)
    # v5'in oturan kalçası (0, 0,13, −0,09 kayma) → v6: oturuşta ellerin, dirseklerin ve bakışın yerleri aynı farkla taşınır
    dO = otur - Vector((0, 0.13, -(465 - (430 - 130 + 30)) * U))
    sh = lambda v: tuple(Vector(v) + dO)
    # kumanda: armudun sağ kolunun üstünde, kalçanın ~220 mm sağında (yüzeye oturur)
    k0 = REST['kalça'].translation + otur
    kx, ky = k0.x - 0.15, k0.y - 0.02
    kum = Vector((kx, ky, (armut_yuzey(kx, ky) or k0.z) + 10 * U))
    tv = Vector((0, -2.2, 0.75))
    S['bak'] = {'agirlik': [[1, 0], [44, 0.0], [52, 0.8], [66, 0.8], [76, 0.7], [D0, 0.5], [D1, 0.5], [BIR - 10, 0.7], [BIR + 6, 0.7], [K0, 0]],
                'yer': [(44, tuple(kum)), (62, tuple(kum)), (76, tuple(tv)), (D1, tuple(tv)), (BIR - 6, tuple(kum)), (son, tuple(kum))]}
    tut = Vector(sh((-0.1, 0.03, 0.34)))       # kumanda kucakta (uyluk üstü, karından uzak)
    dogrult = Vector(sh((-0.1, -0.07, 0.52)))
    TUTY = ((0.25, -1, 0.15), (1, 0, 0))
    ALY = ((0.1, -0.2, -1), (1, 0.1, -0.1))
    # sıçrarken eller yanlara açılır (denge), oturunca armudun üstüne dayanır
    R_yer = [(1, (-0.2, -0.07, 0.38)), (14, (-0.24, 0.02, 0.36)), (24, (-0.27, 0.06, 0.4)), (32, sh((-0.24, 0.08, 0.32))), (G1, sh((-0.2, 0.06, 0.28))),
             (52, tuple(kum + Vector((0, 0, 0.05)))), (58, tuple(kum)),
             (66, tuple(kum + Vector((0.03, -0.05, 0.08)))), (76, tuple(dogrult)), (92, tuple(dogrult)), (D0, tuple(tut)), (D1, tuple(tut)),
             (BIR - 6, tuple(kum + Vector((0, 0, 0.05)))), (BIR, tuple(kum)), (238, tuple(kum + Vector((0.02, -0.05, 0.08)))),
             (252, sh((-0.16, -0.12, 0.3))), (264, (-0.2, -0.14, 0.36)), (276, (-0.2, -0.1, 0.38)), (son, (-0.2, -0.07, 0.38))]
    R_yon = [(1, SARK['R']), (14, ((0, 0.3, -1), (1, 0, 0))), (52, ALY), (58, ALY), (76, TUTY), (92, TUTY), (D0, ((0.6, -1, 0.0), (0.2, 0, -1))), (D1, ((0.6, -1, 0.0), (0.2, 0, -1))),
             (BIR, ALY), (244, SARK['R']), (252, ((0, -1, -0.5), (0, 0, -1))), (270, SARK['R'])]
    L_yer = [(1, (0.2, -0.07, 0.38)), (14, (0.24, 0.02, 0.36)), (24, (0.27, 0.06, 0.4)), (32, sh((0.24, 0.08, 0.32))), (G1, sh((0.2, 0.06, 0.28))), (52, sh((0.18, -0.04, 0.3))),
             (D0, sh((0.12, -0.12, 0.33))), (D1, sh((0.12, -0.12, 0.33))),
             (K0, sh((0.16, -0.06, 0.3))), (252, sh((0.16, -0.12, 0.3))), (264, (0.2, -0.14, 0.36)), (276, (0.2, -0.1, 0.38)), (son, (0.2, -0.07, 0.38))]
    L_yon = [(1, SARK['L']), (14, ((0, 0.3, -1), (-1, 0, 0))), (D0, ((-0.6, -1, 0), (-0.2, 0, -1))), (D1, ((-0.6, -1, 0), (-0.2, 0, -1))), (252, ((0, -1, -0.5), (0, 0, -1))), (270, SARK['L'])]
    S['el'] = {'R': {'ik': [[1, 0], [8, 1], [280, 1], [son, 0]], 'yer': R_yer, 'yon': R_yon,
                     'dirsek': [(1, (-0.42, 0.05, 0.3)), (G1, sh((-0.42, 0.15, 0.25))), (76, sh((-0.42, 0.1, 0.38))), (D0, sh(DIRSEK_TUT['R'])), (D1, sh(DIRSEK_TUT['R'])),
                                (264, (-0.42, 0.05, 0.3)), (son, (-0.42, 0.05, 0.3))]},
               'L': {'ik': [[1, 0], [8, 1], [280, 1], [son, 0]], 'yer': L_yer, 'yon': L_yon,
                     'dirsek': [(1, (0.42, 0.05, 0.3)), (G1, sh((0.42, 0.15, 0.25))), (D0, sh(DIRSEK_TUT['L'])), (D1, sh(DIRSEK_TUT['L'])), (264, (0.42, 0.05, 0.3)), (son, (0.42, 0.05, 0.3))]}}
    S['parmak'] = {'R': [[1, 0.15], [52, 0.05], [57, 0.05], [60, 0.6], [BIR - 1, 0.6], [BIR + 3, 0.1], [son, 0.15]], 'L': [[1, 0.15], [D0, 0.3], [D1, 0.3], [son, 0.15]]}
    S['basparmak'] = {'R': [[1, 0], [58, 0], [60, 0.2], [BAS - 5, 0.2], [BAS - 1, 0.9], [BAS + 2, 0.9], [BAS + 6, 0.2], [BIR - 1, 0.2], [BIR + 3, 0], [son, 0]]}
    S['agiz'] = [[150, 0], [156, 0.18], [163, 0.05], [168, 0.15], [176, 0], [son, 0]]   # izlerken güler
    S['olcek'] = {'yanak.L': [[150, 1], [156, 1.06], [176, 1]], 'yanak.R': [[150, 1], [156, 1.06], [176, 1]]}
    act = kol_coz('tv_armut', son, S, {'R': [(58, 58), (76, 92), (BIR, BIR)]})
    kare_ayarla(act, D0); kz = rig.pose.bones['kalça'].head.copy()
    eksen = Vector((0, ARMUT['eksen'] * U, 0))
    # ölçüm: oturuş boyunca kalçanın alt noktası oturak yüzeyine göre, gövdenin armuda girişi, ayaklar; giriş ve çıkışta da giriş
    ol = {f: armut_olc(act, f) for f in list(range(1, son + 1, 4)) + [G1, D0, D1, K0, son]}
    otur_k = [f for f in ol if G1 <= f <= K0]
    ka = [ol[f]['kalca_alt_mm'] for f in otur_k if ol[f]['kalca_alt_mm'] is not None]
    gir = max(ol.values(), key=lambda o: o['giris_mm'])
    OLCUM_V6['tv_armut'] = {
        'olcut': 'oturuşta (kare %d–%d) kalçanın en alt noktası ≥ oturak üst yüzeyi − 40 mm' % (G1, K0),
        'kalca_alt_eksi_yuzey_mm': [min(ka), max(ka)], 'gecti': min(ka) >= -40,
        'govde_armuda_en_derin_giris_mm': gir['giris_mm'], 'giris_ag': gir['giris_ag'],
        'giris_kare': [f for f, o in sorted(ol.items()) if o['giris_mm'] == gir['giris_mm']][0],
        'kalca_z_mm': round(kz.z * MM, 1), 'oturak_yuzey_mm': round((armut_yuzey(kz.x, kz.y) or 0) * MM, 1),
        'ayak_yerden_mm_oturus': [min(ol[f]['ayak_yerden_mm'] for f in otur_k), max(ol[f]['ayak_yerden_mm'] for f in otur_k)],
        'ayaklar_yerde': max(ol[f]['ayak_yerden_mm'] for f in otur_k) <= 15,
        'not': 'sitedeki armut (seed 1, ölçek %.2f): oturak ~460–473 mm; Biggie\'nin bacağı kalça→bilek ~360 mm, ayaklar yere yetişmez' % ARMUT['olcek']}
    meta = {'sure': round(son / 30, 2), 'giris': [1, D0], 'dongu': [D0, D1], 'cikis': [D1, son], 'oturdu': G1, 'kalkmaya_basla': K0, 'ayakta': 290, 'bas': BAS,
            'kumanda': {'kemik': 'tutma.R', 'tut': [58, BIR], 'yan': mm(kum), 'not': 'al–bırak arası elde, dışında armudun sağ kolunun üstünde (yan)'},
            'armut': {'eksen_mm': mm(eksen), 'kalca_mm': mm(kz), 'oturak_mm': OLCUM_V6['tv_armut']['oturak_yuzey_mm'], 'cokme_mm': ARMUT['cokme'],
                      'seed': ARMUT['seed'], 'olcek': ARMUT['olcek'], 'oturma_yuksekligi_mm': round(kz.z * MM, 1),
                      'not': 'v6: armudun dikey ekseni kökün eksen_mm arkasında (yerel mm; −y ileri = TV); armudun önü TV\'ye bakar. '
                             'Klip sitedeki armut({ seed: 1 }) yüzeyine göre kuruldu (scripts/karakter-armut-geo.py): kalça oturağın üstünde '
                             '(en çok cokme_mm çöker). Armudun ölçeği ya da tohumu değişirse klip yeniden kurulmalı.'},
            'not': 'giris oturup kumandayı alır ve TV\'yi açar (bas karesi), dongu izleme bölümü tekrarlanır, cikis kumandayı bırakıp kalkar. '
                   'v6: kök armudun ön şişkinliğinden uzakta başlar/biter (eksen 600 mm), oturuşta ayaklar sarkar (yer yetişmez).'}
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    OLCUM_V5['tutus']['tv_armut'] = tutus_olc(act, 'R', range(D0, D1 + 1, 20))
    return act


OLCUM_V5 = {'tutus': {}}
OLCUM_V6 = {}
OLCUM_V7 = {}
ELMA_KUR = None


# =====================================================================================================================
# v7 (2026-11-04, kullanıcı: "koltuk pofuduk olacak, karakter içine gömülecek"): tv_armut yerine üç klip —
#   armut_yat     armudun önünde ayakta → oturur (armut ezilir), arkaya yaslanır, elleri ensesine (dirsekler yana), gözler kapanır
#   armut_uyukla  döngü: gözler kapalı, yavaş nefes (göğüs inip kalkar), arada başı hafif düşüp toparlanır
#   armut_kalk    gözler açılır, eller iner, doğrulur, ayağa kalkar (armut yavaşça kabarır)
# Armut oturunca ezilir: karakter-armut-geo.py armut_ez (oturak 474 → 220, sırt 1052 → 650, sırt dikeyden 40°). Site aynı
# dönüşümü klibin ezilme_egrisi (kare → t, 0..1) ile oynatır; kalça, sırt ve ense ezilmiş yüzeye göre ölçülerek yerleşir.
# Ayaklar klip boyunca kökte (Durma'daki yerinde) kalır: oturuşta topuklar yerde. Kök armudun ekseninin önünde (eksen_mm).
# =====================================================================================================================
ARMUT7 = {'eksen': 450.0, 'cokme': 40}
_A7 = {}


def armut7_E():
    if 'E' not in _A7:
        A = armut_kur(ARMUT['seed']); _A7['A'] = A; _A7['E'] = armut_ez_kur(A)
    return _A7['E']


def armut7(t, eksen=None):
    """t ezilmesindeki armut (karakter yereli, Blender birimi): BVH, dışa bakan normal işareti"""
    eksen = ARMUT7['eksen'] if eksen is None else eksen
    key = (round(t, 3), round(eksen, 1))
    if key in _A7: return _A7[key]
    from mathutils.bvhtree import BVHTree
    E = armut7_E(); A = _A7['A']; e = Vector((0, eksen * U, 0))
    vs = [Vector(armut_ez(v, E, t)) * U + e for v in A['verts']]
    bvh = BVHTree.FromPolygons(vs, A['faces'])
    ust = Vector((0, eksen * U, 3.0)); loc, n, _, _ = bvh.find_nearest(ust)
    _A7[key] = {'bvh': bvh, 'isaret': 1.0 if (ust - loc).dot(n) > 0 else -1.0}
    return _A7[key]


def armut7_sd(p, D):
    """p'nin armut yüzeyine işaretli uzaklığı (mm; − içeride)"""
    loc, n, _, d = D['bvh'].find_nearest(p)
    if loc is None: return 999.0
    return d * MM if (p - loc).dot(n) * D['isaret'] >= 0 else -d * MM


def armut7_yuzey(x, y, D):
    h = D['bvh'].ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)))
    return h[0].z if h[0] is not None else None


A7_AG = ('pantolon', 'kazak', 'kafa', 'saç sakal', 'kulaklık', 'sol avuç', 'sağ avuç', 'sol ayak', 'sağ ayak')


def a7_olc(act, f, t):
    """bir karede (armut t ezilmesinde): kalçanın altı − oturak yüzeyi, ağ gruplarının armuda en derin girişi (−) ya da en
    yakın uzaklığı (+), ense (kazağın boyun çevresi) uzaklığı, ayakların ve topukların yerden yüksekliği (mm)"""
    kare_ayarla(act, f); N = ag_noktalari(A7_AG); D = armut7(t); pb = rig.pose.bones
    # kazağın gövdesi ile kolları ayrı (kollar ensede: dirsekler armuda gömülebilir): köşenin baskın kemik grubuna göre
    dg = bpy.context.evaluated_depsgraph_get(); kz = bpy.data.objects['kazak']; o_ = kz.evaluated_get(dg); me = o_.to_mesh()
    gi = {g.index: g.name for g in kz.vertex_groups}
    govde_mi = [bool(v.groups) and gi.get(max(v.groups, key=lambda g: g.weight).group, '') in ('göğüs', 'omurga', 'kalça', 'boyun', 'karın') for v in me.vertices]
    o_.to_mesh_clear()
    N['kazak_kol'] = [v for v, g in zip(N['kazak'], govde_mi) if not g]; N['kazak'] = [v for v, g in zip(N['kazak'], govde_mi) if g]
    k = pb['kalça'].head
    kal = []
    for v in N['pantolon']:
        if v.z < k.z and math.hypot(v.x - k.x, v.y - k.y) < 140 * U:
            z0 = armut7_yuzey(v.x, v.y, D)
            if z0 is not None: kal.append((v.z - z0) * MM)
    out = {'t': round(t, 3), 'kalca_alt_mm': round(min(kal), 1) if kal else None}
    for ad, vs in (('pantolon', N['pantolon']), ('kazak', N['kazak']), ('kol', N['kazak_kol']), ('bas', N['kafa'] + N['saç sakal']), ('kulaklik', N['kulaklık']),
                   ('eller', N['sol avuç'] + N['sağ avuç']), ('ayak', N['sol ayak'] + N['sağ ayak'])):
        out[ad + '_mm'] = round(min(armut7_sd(v, D) for v in vs[::3]), 1)
    b = pb['boyun'].head
    ds = [armut7_sd(v, D) for v in N['kazak'] if (v - b).length < 140 * U and v.y > b.y]
    out['ense_mm'] = round(min(ds), 1) if ds else None
    out['ayak_min_z'] = round(min(v.z for a in ('sol ayak', 'sağ ayak') for v in N[a]) * MM, 1)
    out['topuk_min_z'] = round(max(min(v.z for v in N[a] if v.y > pb['ayak.' + t_].head.y) for a, t_ in (('sol ayak', 'L'), ('sağ ayak', 'R'))) * MM, 1)
    out['kalca_z'] = round(k.z * MM, 1)
    g = pb['boyun'].head - pb['kalça'].head
    out['govde_yatis'] = round(math.degrees(g.angle(Vector((0, 0, 1)))), 1)
    return out


# ---- v8.2 (2026-11-05, kullanıcı: armut) ----
# Kollar: v7'de eller kalçanın yanından ensedeki noktaya tek hamlede, el yönü (parmak/avuç) elle verilmiş anahtarlarla
# gidiyordu; el önkoldan ~30–60° kırılıyor, bilek burularak başın arkasına dolanıyordu. v8.2: rahat, basit bir kaldırış —
# dirsekler önde-yanda kalkar (dirsek önde, el arkada), eller kulak hizasından başın arkasına kayar. El yönü elle verilmez:
# parmaklar ÖNKOLUN doğrultusunda (bilek düz, BILEK_BUKUM kadar başa doğru kıvrık), avuç başın merkezine dönük; önkol her
# karede ölçülür, yön iki turda oturur (bilek_hizala). Bütün noktalar dinlenme uzayında (mm) ve kafayla taşınır.
# Bacaklar: v7'de ayaklar Durma'daki yerinde (kalça genişliğinde) ve dizler öndeydi; v8.2'de oturunca ayaklar yana kayar
# (BACAK), ayak uçları dışa döner, dizler dışa açılır (diz hedefi). Karın: oturunca 'karın' kemiği içeri çöker (KARIN).
ENSE = {'L': ((45, 195, 1075), (395, -40, 1100)), 'R': ((-45, 195, 1075), (-395, -40, 1100))}      # avuç, dirsek hedefi
KULAK = {'L': ((185, 55, 1135), (430, -70, 1030)), 'R': ((-185, 55, 1135), (-430, -70, 1030))}    # kaldırışın ortası
OMUZ_ON = {'L': ((205, -95, 930), (390, 30, 800)), 'R': ((-205, -95, 930), (-390, 30, 800))}      # kaldırışın başı
KAFA_MERKEZ = (0, -15, 1150)
BILEK_BUKUM = 14          # derece: parmaklar önkolun doğrultusundan başa doğru (gevşek el; 0 = dimdik)
BACAK = {'ayak_x': 0.05, 'diz_x': 0.17, 'diz_y': 0.02, 'yaw': 20}   # Blender birimi (×1500 mm), derece
KARIN = (1.06, 0.72, 0.96)   # oturuşta karın kemiğinin ölçeği (x yana, y öne: içeri çöker, z)


def kafa_M(act, f):
    kare_ayarla(act, f); return rig.pose.bones['kafa'].matrix @ REST['kafa'].inverted()


def kol_yon(P, D, C, bukum=BILEK_BUKUM):
    """avuç P, dirsek D, baş merkezi C (armatür uzayı) → (parmak yönü, avuç yönü): parmaklar dirsek→el doğrultusunda,
    avuç başa dönük, parmaklar 'bukum' derece avuca doğru"""
    d = (P - D).normalized(); n = C - P; n = (n - d * n.dot(d)).normalized()
    b = math.radians(bukum); f_ = (d * math.cos(b) + n * math.sin(b)).normalized()
    n = (n - f_ * n.dot(f_)).normalized()
    return tuple(f_), tuple(n)


def ense_hedef(act, f, t, tablo=None):
    M = kafa_M(act, f); p, d = (tablo or ENSE)[t]
    P, D, C = M @ (Vector(p) * U), M @ (Vector(d) * U), M @ (Vector(KAFA_MERKEZ) * U)
    return tuple(P), kol_yon(P, D, C), tuple(D)


def bilek_hizala(ad, son, S, kareler, tur=2):
    """S['el'][t]['yon']'u verilen karelerde ölçülen önkola göre yeniden yazar (bilek düz); kareler {t: [(a, b)]}"""
    for _ in range(tur):
        act = klip_kur(ad, son, S)
        for t, araliklar in kareler.items():
            E = S['el'][t]; yeni = {}
            for a, b in araliklar:
                for f in sorted(set(range(a, b + 1, 2)) | {b}):
                    kare_ayarla(act, f); pb = rig.pose.bones
                    D = pb['ön_kol.' + t].head.copy(); P = vanahtar(E['yer'], f)
                    C = (pb['kafa'].matrix @ REST['kafa'].inverted()) @ (Vector(KAFA_MERKEZ) * U)
                    yeni[f] = kol_yon(P, D, C)
            eski = [(f, v) for f, v in E['yon'] if not any(a <= f <= b for a, b in araliklar)]
            E['yon'] = sorted(eski + list(yeni.items()), key=lambda x: x[0])
        bpy.data.actions.remove(act)
    return S


def yat_poz(hy=240, dz=-140, kX=-20, oX=-12, gX=-8, bX=10, hX=12, ay=0, ayz=0, acik=1.0, karin=1.0):
    """yaslanmış oturuş: kalça kökün hy mm arkasında, dz mm aşağıda; gövde kalça/omurga/göğüs X ile geriye (derece, − geri),
    boyun/kafa öne; ayaklar Durma'daki yerinden ay mm geri; acik 0..1 bacakların yana açılışı, karin 0..1 karnın çökmesi"""
    sx = {'L': 1, 'R': -1}
    return {'kalca': Vector((0, hy * U, dz * U)),
            'ayak': {t: Vector((sx[t] * BACAK['ayak_x'] * acik, ay * U, ayz * U)) for t in 'LR'},
            'diz': {t: Vector((sx[t] * BACAK['diz_x'] * acik, -BACAK['diz_y'] * acik, 0)) for t in 'LR'}, 'acik': acik, 'karin': karin,
            'don': {'kalça': {'X': kX}, 'omurga': {'X': oX}, 'göğüs': {'X': gX}, 'boyun': {'X': bX}, 'kafa': {'X': hX}}}


def akis7(akis):
    """[(kare, poz)] → klip tanımının kalça/ayak/diz/dönüş/karın anahtarları"""
    sx = {'L': 1, 'R': -1}
    S = {'kalca': [(f, tuple(p['kalca'])) for f, p in akis], 'ayak': {t: [(f, tuple(p['ayak'][t])) for f, p in akis] for t in 'LR'},
         'diz': {t: [(f, tuple(p['diz'][t])) for f, p in akis] for t in 'LR'},
         'ayak_yaw': {t: [[f, sx[t] * BACAK['yaw'] * p['acik']] for f, p in akis] for t in 'LR'},
         'olcek3': {'karın': [(f, tuple(1 + (k - 1) * p['karin'] for k in KARIN)) for f, p in akis]}, 'don': {}}
    for b, ax in sorted({(b, ax) for _, p in akis for b, d in p['don'].items() for ax in d}):
        S['don'].setdefault(b, {})[ax] = [[f, p['don'].get(b, {}).get(ax, 0.0)] for f, p in akis]
    return S


def poz7_kopya(p, kalca=None, acik=None, karin=None, ayak=None, **don):
    q = {'kalca': (p['kalca'] if kalca is None else kalca).copy(), 'ayak': {t: p['ayak'][t].copy() for t in 'LR'},
         'diz': {t: p['diz'][t].copy() for t in 'LR'}, 'acik': p['acik'], 'karin': p['karin'],
         'don': {b: dict(d) for b, d in p['don'].items()}}
    if acik is not None:   # bacak açılışını yeniden ölçekle
        sx = {'L': 1, 'R': -1}
        for t in 'LR':
            q['ayak'][t].x = sx[t] * BACAK['ayak_x'] * acik
            q['diz'][t] = Vector((sx[t] * BACAK['diz_x'] * acik, -BACAK['diz_y'] * acik, 0))
        q['acik'] = acik
    if karin is not None: q['karin'] = karin
    if ayak is not None:
        for t in 'LR': q['ayak'][t] = q['ayak'][t] + Vector(ayak)
    for k, v in don.items():
        b, ax = k.rsplit('_', 1); b = {'kalca': 'kalça', 'gogus': 'göğüs'}.get(b, b)
        q['don'].setdefault(b, {})[ax] = v
    return q


def ense_el(S, son, kareler, ad='_yat', tablo=None):
    """S['el']'in ensedeki bölümleri: kareler [(a, b)] aralıklarında eller kafanın o anki dönüşümüyle ensede (iki geçiş:
    önce elsiz kurulur, kafa ölçülür)"""
    act = klip_kur(ad, son, dict(S, el={}))
    ek = {'L': {}, 'R': {}}
    for a, b in kareler:
        for f in sorted(set(range(a, b + 1, 2)) | {b}):
            for t in 'LR': ek[t][f] = ense_hedef(act, f, t, tablo)
    bpy.data.actions.remove(act)
    return ek


def kafa_nokta(act, f, tablo):
    """kaldırış yolunun bir noktası (KULAK, OMUZ_ON) o karedeki kafa dönüşümüyle: {t: (avuç, yön, dirsek)}"""
    return {t: ense_hedef(act, f, t, tablo) for t in 'LR'}


def yat_olc_statik(P, t=1.0):
    """poz P'de (3 karelik klip) eller ensede: ölçü"""
    S = akis7([(1, P), (3, P)]); S['canli'] = 0; S['nefes'] = 0
    ek = ense_el(S, 3, [(1, 3)])
    S['el'] = {t_: {'ik': [[1, 1], [3, 1]], 'yer': [(f, v[0]) for f, v in sorted(ek[t_].items())], 'yon': [(f, v[1]) for f, v in sorted(ek[t_].items())],
                    'dirsek': [(f, v[2]) for f, v in sorted(ek[t_].items())]} for t_ in 'LR'}
    act = klip_kur('_yat_olc', 3, S)
    o = a7_olc(act, 2, t)
    o['el_hata_mm'] = max(el_hatasi(act, S, t_, 1, 3) for t_ in 'LR')
    bpy.data.actions.remove(act)
    return o


# Yaslanmış oturuşun pozu: v8.2 armudu (alçak, yatık, yayılan sırt) için yat_bul ile ölçülerek seçilir (ölçüt YAT_OLCUT).
# Başlangıç v7'nin değerleri; kurulumda yat_bul() en iyiyi YAT'a yazar.
YAT = {'eksen': 515.0, 'hy': 260.0, 'dz': -151.0, 'kX': -39.0, 'oX': -8.0, 'gX': -15.5, 'bX': 30.0, 'hX': 16.0}
YAT_OLCUT = {'kalca_alt_mm': -28, 'kazak_mm': -16, 'ense_mm': -4, 'bas_mm': 8, 'govde_yatis': 56}
A7_PAY = {'pantolon': -45.0, 'kazak': -35.0}   # ezilme eğrisi: bu gömülmeyi aşmayacak en küçük t (oturma/kalkma anı)


def yat_P(**ek):
    return yat_poz(**{k: v for k, v in YAT.items() if k != 'eksen'}, **ek)


def yat_maliyet(o):
    c = ((o['kalca_alt_mm'] or 0) - YAT_OLCUT['kalca_alt_mm']) ** 2 / 64
    c += (o['kazak_mm'] - YAT_OLCUT['kazak_mm']) ** 2 / 64 + max(0, -35 - o['kazak_mm']) ** 2
    c += ((o['ense_mm'] if o['ense_mm'] is not None else 0) - YAT_OLCUT['ense_mm']) ** 2 / 50
    c += (o['bas_mm'] - YAT_OLCUT['bas_mm']) ** 2 / 64 + 3 * max(0, -o['bas_mm']) ** 2 + max(0, -8 - o['kulaklik_mm']) ** 2
    c += max(0, -45 - o['pantolon_mm']) ** 2 + max(0, -25 - o['eller_mm']) ** 2 + max(0, -40 - o['kol_mm']) ** 2
    c += (o['govde_yatis'] - YAT_OLCUT['govde_yatis']) ** 2 / 16 + max(0, -10 - o['ayak_min_z']) ** 2 + max(0, o['ayak_min_z'] - 8) ** 2
    c += o.get('el_hata_mm', 0) ** 2 / 50
    return c


def yat_bul(tur=2):
    """YAT'ı koordinat inişiyle ölçerek seçer (armudun v8.2 ezilmesi; ölçüt yat_maliyet)"""
    adim = {'eksen': 25.0, 'hy': 20.0, 'dz': 12.0, 'kX': 4.0, 'oX': 4.0, 'gX': 4.0, 'bX': 5.0, 'hX': 5.0}
    def olc():
        ARMUT7['eksen'] = YAT['eksen']; o = yat_olc_statik(yat_P()); return yat_maliyet(o), o
    en, o = olc()
    print('YATBUL basla', round(en, 1), o)
    for it in range(tur):
        for k in adim:
            for yon in (1, -1):
                while True:
                    eski = YAT[k]; YAT[k] = eski + yon * adim[k]
                    c, o2 = olc()
                    if c < en - 0.05: en, o = c, o2
                    else: YAT[k] = eski; break
        adim = {k: v / 2 for k, v in adim.items()}
        print('YATBUL tur', it, round(en, 1), {k: round(v, 1) for k, v in YAT.items()}, o)
    ARMUT7['eksen'] = YAT['eksen']
    OLCUM_V7['yat_bul'] = {'maliyet': round(en, 2), 'poz': dict(YAT), 'olcu': o}
    return o


def a7_giris(act, f, ts):
    """f karesinde pantolon ve kazak gövdesinin her t için en derin girişi (mm, −): {t: (pantolon, kazak)}"""
    kare_ayarla(act, f); N = ag_noktalari(('pantolon', 'kazak'))
    out = {}
    for t in ts:
        D = armut7(t)
        out[t] = tuple(min(armut7_sd(v, D) for v in N[a][::4]) for a in ('pantolon', 'kazak'))
    return out


def ezilme_bul(act, son, yon, sabit=None):
    """kare kare: gömülme payını (A7_PAY) aşmayan en küçük t (0,05 adım). yon +1: oturma (t azalmaz), −1: kalkma (t artmaz;
    armut en çok 45 karede kabarır, klip sonunda 0). sabit: {kare: t} zorunlu değerler"""
    ts = [round(i * 0.05, 2) for i in range(21)]
    ham = {}
    for f in range(1, son + 1):
        g = a7_giris(act, f, ts)
        ham[f] = next((t for t in ts if g[t][0] >= A7_PAY['pantolon'] and g[t][1] >= A7_PAY['kazak']), 1.0)
    egri, onceki = {}, (0.0 if yon > 0 else 1.0)
    for f in range(1, son + 1):
        t = ham[f]
        if yon > 0: t = max(t, onceki)
        else: t = max(t, min(onceki, max(0.0, onceki - 1 / 45)), 0.0); t = min(t, onceki)
        if sabit and f in sabit: t = sabit[f]
        egri[f] = t; onceki = t
    return egri, ham


def egri_yumusat(egri, son):
    """basamaklı t (0,05) → yumuşak: 5 karelik kayan ortalama, uçlar korunur; 3 ondalık"""
    out = {}
    for f in range(1, son + 1):
        w = [egri[g] for g in range(max(1, f - 2), min(son, f + 2) + 1)]
        out[f] = round(sum(w) / len(w), 3)
    out[1], out[son] = egri[1], egri[son]
    return [[f, out[f]] for f in range(1, son + 1)]


def a7_klip_olc(act, son, egri, kareler=None):
    """klip boyunca (t = ezilme eğrisi): en derin gömülmeler, ayaklar"""
    al = {f: a7_olc(act, f, anahtar(egri, f)) for f in (kareler or list(range(1, son + 1, 3)) + [son])}
    def en(k, fn=min):
        v = [(o[k], f) for f, o in al.items() if o.get(k) is not None]
        return fn(v) if v else (None, None)
    out = {k: {'deger': en(k)[0], 'kare': en(k)[1]} for k in ('pantolon_mm', 'kazak_mm', 'kol_mm', 'bas_mm', 'kulaklik_mm', 'eller_mm', 'ayak_mm', 'ayak_min_z')}
    out['ayak_max_z'] = {'deger': en('ayak_min_z', max)[0], 'kare': en('ayak_min_z', max)[1]}
    return out, al


def el_yan(s, kal):
    """otururken el armudun üstünde, kalçanın yanında (avuç aşağı)"""
    return (tuple(Vector((0.215 * s, kal.y - 0.03, kal.z + 0.005))), ((0, -1, -0.6), (0, 0, -1)))


def kaldiris(S, son, yat_ad, giris, cikis=None):
    """el yolu: el_yan (kalça yanı) ↔ OMUZ_ON ↔ KULAK ↔ ENSE. giris: (el_yan karesi, omuz karesi, kulak karesi, ense karesi)
    ya da None; cikis: (ense son karesi, kulak, omuz, el_yan) ya da None. Ense aralığı ensede. Döner: {t: (yer, yon, dirsek)}
    ve bilek hizalama aralıkları"""
    act = klip_kur(yat_ad, son, dict(S, el={}))
    kal = lambda f: (nokta(act, f, 'kalça'))
    out = {}
    e0 = giris[3] if giris else 1
    e1 = cikis[0] if cikis else son
    ens = {}
    for f in sorted(set(range(e0, e1 + 1, 2)) | {e1}):
        for t in 'LR': ens.setdefault(t, {})[f] = ense_hedef(act, f, t)
    for t, s in (('L', 1), ('R', -1)):
        yer, yon, dir_ = [], [], []
        if giris:
            fy, fo, fk, _ = giris
            p = el_yan(s, kal(fy)); yer.append((fy, p[0])); yon.append((fy, p[1])); dir_.append((fy, (0.42 * s, 0.25, 0.3)))
            for f, tab in ((fo, OMUZ_ON), (fk, KULAK)):
                P, Y, D = ense_hedef(act, f, t, tab); yer.append((f, P)); yon.append((f, Y)); dir_.append((f, D))
        for f, (P, Y, D) in sorted(ens[t].items()):
            yer.append((f, P)); yon.append((f, Y)); dir_.append((f, D))
        if cikis:
            _, fk, fo, fy = cikis
            for f, tab in ((fk, KULAK), (fo, OMUZ_ON)):
                P, Y, D = ense_hedef(act, f, t, tab); yer.append((f, P)); yon.append((f, Y)); dir_.append((f, D))
            p = el_yan(s, kal(fy)); yer.append((fy, p[0])); yon.append((fy, p[1])); dir_.append((fy, (0.42 * s, 0.25, 0.3)))
        out[t] = (yer, yon, dir_)
    bpy.data.actions.remove(act)
    return out


def armut_yat():
    son = 151   # tek sayı: GLB 2 karede bir örnekler, son kare de yazılsın
    P = yat_P(); A0 = poz7_kopya(yat_poz(hy=0, dz=0, kX=0, oX=0, gX=0, bX=0, hX=0, acik=0, karin=0))
    K = P['kalca']
    # oturuş: armudun önünde arkasına bakar, dizlerini kırıp kendini bırakır; ayaklar kalça armuda değerken yana kayar
    # (34–46, kısa kalkışla), karın oturunca çöker (36–58), dizler açılır
    akis = [(1, A0), (8, poz7_kopya(A0, kalca=Vector((0, 0.004, -0.004)), omurga_Z=6, kafa_Z=10)),
            (14, poz7_kopya(A0, kalca=Vector((0, 0.01, -0.02)), omurga_Z=10, kafa_Z=28, omurga_X=4)),
            (22, poz7_kopya(A0, kalca=Vector((0, 0.03, -0.055)), omurga_X=14, omurga_Z=4, kafa_Z=8, kafa_X=4)),
            (28, poz7_kopya(A0, kalca=Vector((0, 0.07, -0.085)), omurga_X=20, kalca_X=4, acik=0.1)),
            (34, poz7_kopya(P, kalca=Vector((0, K.y * 0.85, K.z * 0.88)), kalca_X=-12, omurga_X=4, gogus_X=-2, boyun_X=6, kafa_X=4, acik=0.35, karin=0.2)),
            (39, poz7_kopya(P, kalca=K + Vector((0, 0.002, -0.009)), kalca_X=-20, omurga_X=-4, gogus_X=-6, boyun_X=10, kafa_X=8, acik=0.75, karin=0.6, ayak=(0, 0, 0.012))),
            (45, poz7_kopya(P, kalca=K + Vector((0, 0, 0.004)), kalca_X=-18, omurga_X=-2, gogus_X=-5, boyun_X=10, kafa_X=6, acik=1.04, karin=0.85)),
            (54, poz7_kopya(P, kalca=K, kalca_X=-22, omurga_X=-4, gogus_X=-6, boyun_X=12, kafa_X=6, acik=1.0, karin=1.0)),
            (70, poz7_kopya(P, kalca=K + Vector((0, 0, -0.003)), kalca_X=YAT['kX'] - 2, omurga_X=YAT['oX'] - 1)),
            (78, P), (96, poz7_kopya(P, gogus_X=YAT['gX'] - 3, boyun_X=YAT['bX'] - 6)), (106, poz7_kopya(P, kafa_X=YAT['hX'] - 6)),
            (118, P), (son, P)]
    S = akis7(akis)
    S['don']['kafa']['Y'] = [[100, 0], [104, 4], [110, -2], [116, 0]]
    S['agiz'] = [[86, 0], [92, 0.55], [100, 0.7], [106, 0.2], [112, 0]]          # esneme
    S['goz_kapa'] = [[1, 0], [112, 0], [118, 0.55], [122, 0.3], [130, 0.85], [138, 1], [son, 1]]
    S['kirp'] = [44, 96]
    S['canli'] = 0.6; S['nefes'] = 1.0; S['nefes_uc'] = True
    # eller: yanda → sıçrayışta dengede açık → armuda dayanır → omuz önü → kulak yanı → ensede (bilek düz)
    KG = (78, 84, 90, 97)
    yol = kaldiris(S, son, '_yat', KG)
    kal = lambda f: vanahtar(S['kalca'], f) + REST['kalça'].translation
    def el(t, s):
        yer0, yon0, dir0 = yol[t]
        yer = [(1, (0.2 * s, -0.07, 0.38)), (16, (0.24 * s, -0.02, 0.37)), (26, (0.26 * s, -0.12, 0.36)), (33, (0.27 * s, 0.0, 0.33)),
               (40, el_yan(s, kal(40))[0]), (66, el_yan(s, kal(66))[0])] + yer0
        yon = [(1, SARK[t]), (16, SARK[t]), (33, ((0, -0.5, -1), (s * 0.3, 0, -1))), (40, el_yan(s, kal(40))[1])] + yon0
        dirsek = [(1, (0.42 * s, 0.05, 0.3)), (33, (0.45 * s, 0.1, 0.35))] + dir0
        return {'ik': [[1, 0], [8, 1], [son, 1]], 'yer': yer, 'yon': yon, 'dirsek': dirsek}
    S['el'] = {'L': el('L', 1), 'R': el('R', -1)}
    S['parmak'] = {t: [[1, 0.15], [40, 0.2], [80, 0.25], [90, 0.3], [97, 0.5], [son, 0.5]] for t in 'LR'}
    S['basparmak'] = {t: [[1, 0.0], [90, 0.1], [97, 0.35], [son, 0.35]] for t in 'LR'}
    bilek_hizala('armut_yat', son, S, {t: [(KG[1], son)] for t in 'LR'})
    act = kol_coz('armut_yat', son, S, {'L': [(KG[3], son)], 'R': [(KG[3], son)]})
    egri, ham = ezilme_bul(act, son, +1, sabit={f: 1.0 for f in range(78, son + 1)})
    egri = egri_yumusat(egri, son)
    return act, S, egri


def uyku_S(son, ad):
    """uyuklama döngüsü: YAT pozunda, gözler kapalı; yavaş nefes (4 sn), 150–200 arası başı öne düşüp toparlanır"""
    P = yat_P()
    S = akis7([(1, P), (son, P)])
    nf = lambda f, A: A * math.sin(2 * math.pi * (f - 1) / 120)
    S['don']['göğüs']['X'] = [[f, YAT['gX'] - nf(f, 2.6)] for f in range(1, son + 1, 4)] + [[son, YAT['gX']]]
    S['don']['omurga']['X'] = [[f, YAT['oX'] - nf(f, 0.8)] for f in range(1, son + 1, 4)] + [[son, YAT['oX']]]
    S['don']['kafa']['X'] = [[1, YAT['hX']], [140, YAT['hX']], [160, YAT['hX'] + 6], [178, YAT['hX'] + 11], [184, YAT['hX'] + 12], [189, YAT['hX'] - 3],
                             [196, YAT['hX'] + 1], [204, YAT['hX']], [son, YAT['hX']]]
    S['don']['boyun']['X'] = [[1, YAT['bX']], [146, YAT['bX']], [180, YAT['bX'] + 6], [189, YAT['bX'] - 1], [200, YAT['bX']], [son, YAT['bX']]]
    S['don']['kafa']['Z'] = [[1, 0], [60, 3], [130, -2], [184, 4], [son, 0]]
    S['kalca'] = [(f, tuple(P['kalca'] + Vector((0, 0, nf(f, 0.0012))))) for f in range(1, son + 1, 4)] + [(son, tuple(P['kalca']))]
    # nefeste karın da inip kalkar (çökmüş hâlin çevresinde, ±%3)
    S['olcek3'] = {'karın': [(f, (KARIN[0], KARIN[1] + 0.03 * math.sin(2 * math.pi * (f - 1) / 120), KARIN[2])) for f in range(1, son + 1, 4)] + [(son, KARIN)]}
    S['agiz'] = [[1, 0], [150, 0], [176, 0.12], [186, 0.14], [192, 0], [son, 0]]
    S['goz_kapa'] = [[1, 1], [son, 1]]; S['kirp'] = []
    S['canli'] = 0; S['nefes'] = 0
    S['parmak'] = {t: [[1, 0.5], [son, 0.5]] for t in 'LR'}
    S['basparmak'] = {t: [[1, 0.35], [son, 0.35]] for t in 'LR'}
    ek = ense_el(S, son, [(1, son)], ad='_uyku')
    S['el'] = {t: {'ik': [[1, 1], [son, 1]], 'yer': [(f, v[0]) for f, v in sorted(ek[t].items())], 'yon': [(f, v[1]) for f, v in sorted(ek[t].items())],
                   'dirsek': [(f, v[2]) for f, v in sorted(ek[t].items())]} for t in 'LR'}
    bilek_hizala(ad, son, S, {t: [(1, son)] for t in 'LR'})
    return S


def armut_uyukla():
    son = 241
    S = uyku_S(son, 'armut_uyukla')
    act = kol_coz('armut_uyukla', son, S, {'L': [(1, son)], 'R': [(1, son)]})
    return act, S, [[1, 1.0], [son, 1.0]]


def armut_kalk():
    son = 105
    P = yat_P(); A0 = poz7_kopya(yat_poz(hy=0, dz=0, kX=0, oX=0, gX=0, bX=0, hX=0, acik=0, karin=0)); K = P['kalca']
    akis = [(1, P), (10, poz7_kopya(P, kafa_X=YAT['hX'] - 8, boyun_X=YAT['bX'] - 4)), (22, poz7_kopya(P, kafa_X=YAT['hX'] - 6)),
            (34, poz7_kopya(P, kalca_X=-30, omurga_X=-2, gogus_X=-8, boyun_X=18, kafa_X=10)),
            (44, poz7_kopya(P, kalca=K + Vector((0, -0.01, 0.004)), kalca_X=-14, omurga_X=8, gogus_X=2, boyun_X=8, kafa_X=4, acik=0.85, karin=0.9)),
            (50, poz7_kopya(P, kalca=K + Vector((0, -0.025, 0.008)), kalca_X=-6, omurga_X=16, gogus_X=6, boyun_X=2, kafa_X=0, acik=0.45, karin=0.6, ayak=(0, 0, 0.012))),
            (55, poz7_kopya(P, kalca=K + Vector((0, -0.04, 0.012)), kalca_X=-2, omurga_X=22, gogus_X=8, boyun_X=0, kafa_X=-4, acik=0.15, karin=0.35)),
            (60, poz7_kopya(A0, kalca=Vector((0, K.y * 0.55, K.z * 0.75)), kalca_X=6, omurga_X=34, gogus_X=10, kafa_X=-10, karin=0.15)),
            (68, poz7_kopya(A0, kalca=Vector((0, K.y * 0.25, K.z * 0.42)), kalca_X=4, omurga_X=28, gogus_X=6, kafa_X=-8)),
            (78, poz7_kopya(A0, kalca=Vector((0, 0.03, -0.035)), omurga_X=12, gogus_X=2, kafa_X=-2)),
            (88, poz7_kopya(A0, kalca=Vector((0, 0.004, 0.004)), omurga_X=-2)), (96, poz7_kopya(A0, kalca=Vector((0, 0, -0.002)))), (son, A0)]
    S = akis7(akis)
    S['goz_kapa'] = [[1, 1], [6, 1], [10, 0.4], [13, 0.7], [18, 0.05], [24, 0], [son, 0]]
    S['kirp'] = [30, 84]
    S['agiz'] = [[1, 0], [12, 0], [16, 0.25], [24, 0.05], [30, 0]]
    S['canli'] = 0.5; S['nefes'] = 1.0; S['nefes_uc'] = True
    KC = (14, 20, 26, 34)    # ense bitişi, kulak, omuz önü, kalça yanı
    yol = kaldiris(S, son, '_kalk', None, KC)
    kal = lambda f: vanahtar(S['kalca'], f) + REST['kalça'].translation
    def el(t, s):
        yer, yon, dirsek = (list(x) for x in yol[t])
        yer += [(46, el_yan(s, kal(46))[0]), (54, el_yan(s, kal(54))[0]), (64, (0.24 * s, -0.1, 0.34)), (80, (0.22 * s, -0.08, 0.37)), (son, (0.2 * s, -0.07, 0.38))]
        yon += [(54, el_yan(s, kal(54))[1]), (70, SARK[t]), (son, SARK[t])]
        dirsek += [(54, (0.42 * s, 0.2, 0.3)), (80, (0.42 * s, 0.05, 0.3)), (son, (0.42 * s, 0.05, 0.3))]
        return {'ik': [[1, 1], [92, 1], [son, 0]], 'yer': yer, 'yon': yon, 'dirsek': dirsek}
    S['el'] = {'L': el('L', 1), 'R': el('R', -1)}
    S['parmak'] = {t: [[1, 0.5], [20, 0.3], [40, 0.2], [son, 0.15]] for t in 'LR'}
    S['basparmak'] = {t: [[1, 0.35], [26, 0.1], [son, 0.0]] for t in 'LR'}
    bilek_hizala('armut_kalk', son, S, {t: [(1, KC[2])] for t in 'LR'})
    act = kol_coz('armut_kalk', son, S, {'L': [(1, KC[0]), (KC[3], 54)], 'R': [(1, KC[0]), (KC[3], 54)]})
    egri, ham = ezilme_bul(act, son, -1, sabit={f: 1.0 for f in range(1, 31)} | {son: 0.0})
    egri = egri_yumusat(egri, son)
    return act, S, egri


def armut_gomulu_meta():
    E = armut7_E()
    return {'oturak_once_mm': round(E['zs'], 1), 'oturak_mm': E['oturak_mm'], 'tepe_once_mm': round(E['H'], 1), 'sirt_mm': E['sirt_mm'],
            'sirt_egim_derece': E['sirt_egim_derece'], 'z_harita': [[0, 0], [round(E['zs'], 1), E['oturak_mm']], [round(E['H'], 1), E['sirt_mm']]],
            'siskinlik': E['siskinlik'], 'on_carpan': E['on_carpan'], 'yumusak_mm': E['yumusak_mm'], 'k': E['k'],
            'ust_yayilma': E['ust_yayilma'], 'cukur_mm': E['cukur_mm'], 'cukur_r_mm': E['cukur_r_mm'], 'cukur_z_mm': E['cukur_z_mm'], 'surum': 'v8.2',
            'formul': "armudun yerelinde (mm; orijin tabanın merkezi, önü −y, z yukarı; armut({seed}) köşesi, ölçek 1) v = (x, y, z) → D(v): "
                      "z' = parçalı doğrusal z_harita(z); s = 1 + siskinlik·sin(π·min(1, max(0, z / oturak_once_mm))); x' = x·s; "
                      "y' = y·(y < 0 ? 1 + (s − 1)·on_carpan : s); u = ust_yayilma·smoothstep(oturak_once_mm, tepe_once_mm, z); x' ·= 1 + u; "
                      "y > 0 ise y' ·= 1 + u; z' −= cukur_mm·exp(−(x / cukur_r_mm)²)·smoothstep(0, cukur_z_mm, z); "
                      "a = (z' − oturak_mm) / yumusak_mm; y' += k·yumusak_mm·ln(1 + e^a). "
                      "Ezilme t ile: v_t = v + t·(D(v) − v). Kaynak: scripts/karakter-armut-geo.py armut_ez; JS ikizi core/cati-esya.js armutEzAlani(g).",
            'not': 'v8.2 (05.11): oturak 474 → 250 mm (ortası çukur: 195), sırt 1052 → 560 mm alçalır, dikeyden 48° yatar, tepe yana ve '
                   'arkaya %16 yayılır; armudun kolları kalçanın iki yanında yüksek kalır (gömülü görünür). Ezilme eğrisi her klipte '
                   'armut.ezilme_egrisi. v7 formülünü uygulayan site ust_yayilma ve cukur_* terimlerini atlarsa armut biraz dar ve düz kalır.'}


def armut7_kur():
    """üç armut klibi + meta + ölçüm"""
    ARMUT7['eksen'] = YAT['eksen']
    yat_bul()   # v8.2: armudun yeni ezilmesine göre yaslanma pozu (YAT) ölçülerek
    gm = armut_gomulu_meta()
    yat, Sy, ey = armut_yat()
    uyk, Su, eu = armut_uyukla()
    kalk, Sk, ek_ = armut_kalk()
    uc_kilitle(uyk, uyk, 1, bas=False); uc_kilitle(yat, uyk, 1, bas=False); uc_kilitle(kalk, uyk, 1, son=False)
    ortak = {'eksen_mm': [0.0, YAT['eksen'], 0.0], 'seed': ARMUT['seed'], 'olcek': ARMUT['olcek'], 'gomulu': gm}
    # kalçanın oturuşta yeri ve oturağın yüzeyi (ölçü)
    kare_ayarla(uyk, 1); kz = rig.pose.bones['kalça'].head.copy()
    D = armut7(1.0)
    yuz = armut7_yuzey(kz.x, kz.y, D)
    ilk = lambda e, esik: next((f for f, t in e if t >= esik), None)
    son_ = lambda e, esik: next((f for f, t in e if t <= esik), None)
    yat['site_meta'] = json.dumps({'sure': round(150 / 30, 2), 'tekrar': False, 'oturdu': 39, 'bas': 46, 'yaslandi': 78, 'eller_ensede': 97, 'esneme': [86, 112],
        'karin': {'kemik': 'karın', 'olcek': list(KARIN), 'not': 'v8.2: oturunca karın kemiğinin ölçeği (klibin kendi kanalı; kod gerekmez)'},
        'bacak': {'ayak_yana_mm': round(BACAK['ayak_x'] * MM), 'diz_yana_mm': round(BACAK['diz_x'] * MM), 'ayak_ucu_disa_derece': BACAK['yaw']},
        'gozler_kapali': 138, 'sonra': 'armut_uyukla',
        'armut': {**ortak, 'ezilme_egrisi': ey, 'ezilme_basla': ilk(ey, 0.01), 'ezilme_tam': ilk(ey, 0.999),
                  'kalca_mm': mm(kz), 'oturak_mm': gm['oturak_mm'], 'oturak_yuzey_mm': round((yuz or 0) * MM, 1)},
        'not': 'v7: armudun önünde, sırtı ona dönük ayakta başlar (kök armudun eksen_mm önünde, önü TV\'ye), arkasına bakar, '
               'kendini armuda bırakır (armut ezilir: ezilme_egrisi, sitedeki armut mesh\'i armut.gomulu formülüyle), arkaya yaslanır, '
               'esner, ellerini ensesine atar, gözleri kapanır. Ayaklar kökte, topuklar yerde. Son poz = armut_uyukla 1. karesi.'},
        ensure_ascii=False)
    uyk['site_meta'] = json.dumps({'sure': round(240 / 30, 2), 'tekrar': True, 'dongu': [1, 241], 'bas_duser': [150, 200],
        'armut': {**ortak, 'ezilme_egrisi': eu},
        'not': 'v7: döngü (ilk ve son kare aynı poz). Gözler kapalı, 4 sn\'lik nefes (göğüs), 150–200 başı öne düşüp toparlanır; '
               'eller ensede kafayla birlikte. Armut tam ezik (t 1). Önce armut_yat, sonra armut_kalk.'}, ensure_ascii=False)
    kalk['site_meta'] = json.dumps({'sure': round(104 / 30, 2), 'tekrar': False, 'goz_acik': 24, 'kalkmaya_basla': 44, 'ayakta': 88,
        'armut': {**ortak, 'ezilme_egrisi': ek_, 'kabarma_basla': son_(ek_, 0.999), 'kabarma_bitti': son_(ek_, 0.001)},
        'not': 'v7: armut_uyukla pozundan (1. kare) gözlerini açar, ellerini indirip armuda dayanır, öne doğrulup kalkar; '
               'armut kalça kalkınca yavaşça kabarır (ezilme_egrisi 1 → 0). Son poz Durma (kök yerinde).'}, ensure_ascii=False)
    # ölçüm
    o = {}
    for ad, act, egri, son in (('armut_yat', yat, ey, 151), ('armut_uyukla', uyk, eu, 241), ('armut_kalk', kalk, ek_, 105)):
        ozet, al = a7_klip_olc(act, son, egri)
        o[ad] = {'ozet': ozet}
        if ad == 'armut_uyukla': o[ad]['kare_1'] = al[1]; o[ad]['kare_184'] = a7_olc(act, 184, 1.0)
        if ad == 'armut_yat': o[ad]['kare_39'] = al.get(40); o[ad]['kare_son'] = al[son]
    o['oturus'] = {'kalca_z_mm': round(kz.z * MM, 1), 'oturak_yuzey_mm': round((yuz or 0) * MM, 1), 'poz': dict(YAT)}
    OLCUM_V7['armut'] = o
    return [yat, uyk, kalk]


# =====================================================================================================================
# v7 diz zinciri (2026-11-04, kullanıcı): diz_bekle (seizada bekleme döngüsü), kutu_cevir_sag/_sol (raftaki kutuyu iki elle
# 90° döndürür), kutu_rafa_birak (raftaki kutuyu gözüne geri koyar). Zincirin bütün uçları aynı poz: SEIZA + eller dizlerde
# (ELLER_DIZ), baş X 2°, bakış 0, nefes 0 (nefes_uc), parmak 0,2. Akış: diz_cok → kutu_al_diz → diz_bekle (↻) →
# kutu_cevir_* → diz_bekle … → kutu_rafa_birak → kutu_al_diz (yeni kutu) … → diz_kalk. Uç uyumu zincir_olc ile ölçülür.
# =====================================================================================================================
def diz_el_sabit(son):
    return {t: {'ik': [[1, 1], [son, 1]], 'yer': [(1, ELLER_DIZ[t]['yer']), (son, ELLER_DIZ[t]['yer'])],
                'yon': [(1, ELLER_DIZ[t]['yon']), (son, ELLER_DIZ[t]['yon'])], 'dirsek': [(1, ELLER_DIZ[t]['dirsek']), (son, ELLER_DIZ[t]['dirsek'])]} for t in 'LR'}


def diz_bekle():
    """seiza döngüsü (6 sn): 3 sn'lik nefes (göğüs inip kalkar), iki göz kırpma, baş küçük bakınır, sol el parmakları dizde tıklar"""
    son = 181
    Sz = POZ['SEIZA']
    S = poz_akisi([(1, poz_kopya(Sz)), (son, poz_kopya(Sz))], son)
    nf = lambda f, A: A * math.sin(2 * math.pi * (f - 1) / 90)
    S['don']['göğüs']['X'] = [[f, Sz['goX'] - nf(f, 1.8)] for f in range(1, son + 1, 3)] + [[son, Sz['goX']]]
    S['don']['omurga']['X'] = [[f, Sz['omX'] - nf(f, 0.5)] for f in range(1, son + 1, 3)] + [[son, Sz['omX']]]
    S['don']['kafa'] = {'X': [[1, 2], [40, 5], [95, 0], [140, 4], [son, 2]], 'Z': [[1, 0], [45, 6], [100, -5], [150, 2], [son, 0]]}
    S['el'] = diz_el_sabit(son)
    S['parmak'] = {'R': [[1, 0.2], [son, 0.2]], 'L': [[1, 0.2], [100, 0.2], [103, 0.02], [106, 0.2], [109, 0.02], [112, 0.2], [115, 0.02], [118, 0.2], [son, 0.2]]}
    S['kirp'] = [38, 128]; S['canli'] = 0; S['nefes'] = 0
    act = klip_kur('diz_bekle', son, S)
    uc_kilitle(act, bpy.data.actions['Hareket - kutu_al_diz'], 1)
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': True, 'dongu': [1, son], 'kirp': [38, 128],
        'not': 'v7: seiza (dizlerin üstünde, kalça topuklarda, eller dizlerde) bekleme döngüsü; ilk ve son kare aynı poz = '
               'kutu_al_diz sonu = kutu_cevir_* / kutu_rafa_birak / diz_kalk başı. Nefes 3 sn, göz kırpma 38 ve 128.'}, ensure_ascii=False)
    return act


def kutu_cevir(yon):
    """yon +1: kutu yukarıdan bakınca saat yönünün tersine +90° (kutu_cevir_SOL: Biggie'nin solundaki yüz öne gelir), −1: −90°
    (kutu_cevir_SAG: sağdaki yüz öne gelir; oda ajanının sözleşmesi, klip-meta-v5.md "v7 — Oda tarafı").
    İki el yan yüzlerin yakın köşelerinde kavrar, 0 → 45° birlikte çevirir; dönüşte uzağa giden el (sağda sağ el) köşeden
    yakın yüze kayar, 45 → 90° itip bırakır, öteki el yan yüzde kalır. Seizadan kalkıp (dik diz) uzanır, seizaya döner."""
    son = 41
    ad = 'kutu_cevir_' + ('sol' if yon > 0 else 'sag')
    K = KUTU7; ex, ey, ez = K['olcu']; C = K['ust']; Sz = POZ['SEIZA']; D2 = K['D2']
    G0, G1, KAY0, KAY1, B1 = 10, 21, 22, 25, 32       # kavra, 45°, kayma, 90° bırak
    don = [[1, 0], [G0, 0], [15, 22.5 * yon], [G1, 45 * yon], [KAY1, 45 * yon], [28, 67 * yon], [30, 78 * yon], [B1, 90 * yon], [son, 90 * yon]]
    th = lambda f: math.radians(anahtar(don, f))
    Rz = lambda f: Matrix.Rotation(th(f), 3, 'Z')
    kayan = 'R' if yon > 0 else 'L'
    sabit = 'L' if yon > 0 else 'R'
    sx = {'L': 1, 'R': -1}
    yan = lambda t: Vector((sx[t] * (ex / 2 + 0.012), 0.03, ez * 0.3))          # yan yüzün ortasının 45 mm önü
    yakin = lambda t: Vector((sx[t] * 0.08, ey / 2 + 0.012, ez * 0.3))         # yakın yüzde, ortanın 120 mm yanı
    nok = lambda f, p: C + Rz(f) @ p
    yon_yan = lambda f, t: (tuple(Rz(f) @ Vector((0, -1, 0.15))), tuple(Rz(f) @ Vector((-sx[t], 0, 0))))
    yon_yakin = lambda f: (tuple(Rz(f) @ Vector((0, -0.3, -1))), tuple(Rz(f) @ Vector((0, -1, 0))))
    # gövde pozları ölçülerek bulundu (scratch, 04.11: iki el temas noktasına 0 mm, el–göğüs ≥ 180, dirsek 78–122, baş raf
    # hacminin dışında): θ 0 / 45 / 90'da kalça (ileri −y, z mm), omurga X, göğüs X, omurga Z, omuz X/Z. sol = sağın aynası.
    PZ = {0: dict(ky=-90, kz=-20, oX=36, gX=6, oZ=0, sLX=0, sLZ=0, sRX=0, sRZ=0),
          22: dict(ky=-120, kz=-20, oX=36, gX=6, oZ=12, sLX=0, sLZ=10, sRX=0, sRZ=0),
          45: dict(ky=-120, kz=20, oX=44, gX=12, oZ=12, sLX=0, sLZ=10, sRX=0, sRZ=20),
          46: dict(ky=-90, kz=40, oX=36, gX=12, oZ=12, sLX=0, sLZ=10, sRX=0, sRZ=20),       # 45°, kayan el yakın yüzde
          67: dict(ky=-120, kz=20, oX=36, gX=12, oZ=12, sLX=0, sLZ=10, sRX=0, sRZ=20),
          78: dict(ky=-120, kz=45, oX=36, gX=24, oZ=6, sLX=0, sLZ=-7.2, sRX=0, sRZ=29.2),
          90: dict(ky=-150, kz=75, oX=36, gX=30, oZ=0, sLX=0, sLZ=-25.9, sRX=0, sRZ=56.1)}
    if yon < 0:   # ayna: Z dönüşleri ters, sol/sağ omuz yer değiştirir
        PZ = {a: dict(ky=p['ky'], kz=p['kz'], oX=p['oX'], gX=p['gX'], oZ=-p['oZ'], sLX=p['sRX'], sLZ=-p['sRZ'], sRX=p['sLX'], sRZ=-p['sLZ']) for a, p in PZ.items()}
    eg = lambda X, kal=Vector(): poz_kopya(D2, kalca=D2['kalca'] + kal, omX=X)
    ep = lambda a: eg(PZ[a]['oX'], Vector((0, PZ[a]['ky'] * U, PZ[a]['kz'] * U)))
    kk = [(8, 0), (G0, 0), (15, 22), (G1, 45), (KAY1, 46), (28, 67), (30, 78), (B1, 90)]
    akis = [(1, poz_kopya(Sz)), (5, poz_kopya(Sz, kalca=Sz['kalca'] + Vector((0, 0, 0.01)), omX=6))] + [(f, ep(a)) for f, a in kk] + [(35, eg(14, Vector((0, -0.02, 0)))),
            (37, poz_kopya(Sz, kalca=Sz['kalca'] + Vector((0, 0, 0.004)), omX=4)), (son, poz_kopya(Sz))]
    S = poz_akisi(akis, son)
    S['gecikmesiz'] = True; S['yaysiz'] = True   # temas noktaları kare kare: gecikme ve yay eli kutudan kaydırmasın
    S['don']['göğüs']['X'] = [[1, 0]] + [[f, PZ[a]['gX']] for f, a in kk] + [[36, 1], [son, 0]]
    S['don']['omurga']['Z'] = [[1, 0]] + [[f, PZ[a]['oZ']] for f, a in kk] + [[36, 0], [son, 0]]
    for t in 'LR':
        S['don']['omuz.' + t] = {ax: [[1, 0]] + [[f, PZ[a]['s' + t + ax]] for f, a in kk] + [[36, 0], [son, 0]] for ax in 'XZ'}
    S['don']['kafa'] = {'X': [[1, 2], [6, 10], [G0, 14], [B1, 14], [36, 6], [son, 2]], 'Z': [[1, 0], [G0, 0], [B1, 8 * yon], [36, 2 * yon], [son, 0]]}
    def el(t):
        s = sx[t]
        yer = [(1, ELLER_DIZ[t]['yer']), (6, tuple(nok(G0, yan(t)) + Vector((0.05 * s, 0.09, -0.03))))]
        yo = [(1, ELLER_DIZ[t]['yon']), (6, ((0, -1, -0.2), (-s * 0.6, 0, -0.6)))]
        if t == sabit:
            for f in range(G0, B1 + 1, 1): yer.append((f, tuple(nok(f, yan(t))))); yo.append((f, yon_yan(f, t)))
        else:
            for f in range(G0, G1 + 1, 1): yer.append((f, tuple(nok(f, yan(t))))); yo.append((f, yon_yan(f, t)))
            ko = C + Rz(G1) @ Vector((s * (ex / 2 + 0.03), ey / 2 + 0.03, ez * 0.35))      # köşenin dışından dolaşır
            yer.append((23, tuple(ko))); yo.append((23, yon_yakin(G1)))
            for f in range(KAY1 - 1, B1 + 1, 1): yer.append((f, tuple(nok(f, yakin(t))))); yo.append((f, yon_yakin(f)))
        yer += [(35, tuple(nok(B1, yan(t) if t == sabit else yakin(t)) + Vector((0.03 * s, 0.07, 0.02)))), (son, ELLER_DIZ[t]['yer'])]
        yo += [(35, ((0, -1, -0.2), (-s * 0.6, 0, -0.6))), (son, ELLER_DIZ[t]['yon'])]
        dirsek = [(1, ELLER_DIZ[t]['dirsek']), (8, (0.45 * s, 0.0, 0.42)), (B1, (0.45 * s, 0.0, 0.42)), (son, ELLER_DIZ[t]['dirsek'])]
        return {'ik': [[1, 1], [son, 1]], 'yer': yer, 'yon': yo, 'dirsek': dirsek}
    S['el'] = {'L': el('L'), 'R': el('R')}
    S['parmak'] = {t: [[1, 0.2], [6, 0.05], [G0, 0.35], [B1, 0.35], [35, 0.1], [son, 0.2]] for t in 'LR'}
    S['parmak'][kayan] = [[1, 0.2], [6, 0.05], [G0, 0.35], [G1, 0.35], [23, 0.1], [KAY1, 0.15], [B1, 0.15], [35, 0.1], [son, 0.2]]
    S['canli'] = 0.3; S['nefes_uc'] = True
    elde = {sabit: [[G0, B1]], kayan: [[G0, G1], [KAY1, B1]]}
    act = zemin_raf_coz(ad, son, S, {t: [tuple(a) for a in v] for t, v in elde.items()}, K['ON_MM'])
    uc_kilitle(act, bpy.data.actions['Hareket - kutu_al_diz'], 1, n=5)
    hata = {t: max(el_hatasi(act, S, t, a, b) for a, b in v) for t, v in elde.items()}
    tutus = {t: tutus_olc(act, t, sorted({f for a, b in v for f in range(a, b + 1)})) for t, v in elde.items()}
    kenar_y = lambda t: [round(x, 1) for x in mm(yan(t))]
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': False, 'kavra': G0, 'birak': B1, 'cevir': [G0, B1],
        'kutu': {'don_derece': 90 * yon, 'don': [[f, round(anahtar(don, f), 2)] for f in range(1, son + 1)],
                 'eksen': 'kutunun merkezinden geçen dikey eksen (z); + yukarıdan bakınca saat yönünün tersi (karakter yereli: +x sol, −y ileri)',
                 'merkez_mm': mm(C), 'elde': elde, 'temas_yerel_mm': {'yan_L': kenar_y('L'), 'yan_R': kenar_y('R'), 'yakin_' + kayan: [round(x, 1) for x in mm(yakin(kayan))]},
                 'olcu': list(KUTU_DIZ['olcu'])},
        'hata_mm': hata,
        'not': 'v7: diz_bekle pozunda başlar/biter. Kutu (kutu_al_diz ust_merkez) dikey ekseninde kutu.don eğrisiyle döner (site kutuyu '
               've kapağını bu açıyla çevirir; eller elde aralıklarında yüzeylerde). Kare kutusu (300×300) için; dikdörtgen kutuda '
               'site ölçüyü 90° sonra en/boy takası ile tutar.'}, ensure_ascii=False)
    OLCUM_V7.setdefault('kutu_cevir', {})[ad] = {'el_hata_mm': hata, 'tutus': tutus,
        'olcut': 'elde karelerinde el–göğüs ≥ 180 mm, dirsek 70–130°; el hedefe ≤ 10 mm'}
    return act


def ters_klip(ad, kaynak, bas, son_k, gecis):
    """kaynak aksiyonun [1, bas] aralığını tersten oynatan yeni klip: önce 'gecis' karede kaynağın son_k karesinden bas
    karesine yumuşak geçer, sonra bas → 1 tersten. Kanal kanal örnekler (IK hedefleri dahil)."""
    fc = fcmap(kaynak)
    N = gecis + bas - 1
    seri = {}
    for k, c in fc.items():
        a, b = c.evaluate(son_k), c.evaluate(bas)
        v = []
        for g in range(1, N + 1):
            if g <= gecis:
                w = (g - 1) / (gecis - 1); w = w * w * (3 - 2 * w); v.append(a + (b - a) * w)
            else:
                v.append(c.evaluate(bas - (g - gecis)))
        seri[k] = v
    act = yeni_aksiyon('Hareket - ' + ad)
    yaz(act, seri, list(range(1, N + 1)))
    act.frame_range = (1, N)
    return act, N


def kutu_rafa_birak():
    """kutu_al_diz'in tersi: raftaki kutunun açık kapağını kapatır, kutuyu iki eliyle alır, indirip gözüne kaydırır, seizaya
    döner. kutu_al_diz'in 1–140 kareleri tersten (140–210 bakma bölümü atlanır), başta 12 karelik geçiş."""
    K = KUTU7; src = bpy.data.actions['Hareket - kutu_al_diz']
    BAS, GEC = 140, 12
    act, son = ters_klip('kutu_rafa_birak', src, BAS, K['son'], GEC)
    g = lambda f: GEC + (BAS - f)      # kaynak kare → yeni kare
    km = K['km']; m = K['meta']['kutu']
    kapak = [[f, round(anahtar(K['kapak'], BAS - (f - GEC)) if f > GEC else anahtar(K['kapak'], BAS), 1)] for f in range(1, son + 1, 2)] + [[son, 0.0]]
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': False, 'al': g(K['BIRAK']), 'birak': g(K['AL']),
        'kapak_kapa': [g(136), g(K['KAP0'])], 'kapak_el': [g(K['KAP_EL1']), g(K['KAP0'])],
        'kutu': {'olcu': m['olcu'], 'raf_on_mm': m['raf_on_mm'], 'raf_ust_mm': m['raf_ust_mm'], 'ic_alt_mm': m['ic_alt_mm'],
                 'ust_merkez': m['ust_merkez'], 'ic_merkez': m['ic_merkez'], 'cik_merkez': m['cik_merkez'], 'kemik': 'el.R',
                 'el_yerel': m['el_yerel'], 'el_yerel_q': m['el_yerel_q'], 'kapak': kapak,
                 'yol': [[g(f), mm(Vector(v))] for f, v in reversed(km) if f <= K['BIRAK']],
                 'not': 'al–birak arası kutu el.R\'ye el_yerel ile bağlı (kutu_al_diz ile aynı); birak\'ta ic_merkez\'de (gözde). '
                        'Kutu kutu_cevir ile döndürüldüyse site dönüşünü korur (kare kutu: aynı tutuş).'},
        'not': 'v7: diz_bekle pozunda başlar ve biter; ardından kutu_al_diz (yeni kutu) ya da diz_kalk. kutu_al_diz\'in tersidir '
               '(1–140), başta 12 karelik geçiş.'}, ensure_ascii=False)
    return act



def uc_kilitle(act, ref, ref_f, n=8, bas=True, son=True):
    """zincir pozu: klibin ilk/son n karesinde bütün kanallar ref aksiyonun ref_f karesindeki değerine yumuşakça çekilir (uç
    kare tam eşit). Kol çözücüsünün (kol_coz) kliplere göre biraz farklı düzeltmesi uçlarda sıçrama yapmasın diye."""
    R = fcmap(ref); F = fcmap(act); N = int(act.frame_range[1]); seri = {}
    for k, c in F.items():
        v = [c.evaluate(f) for f in range(1, N + 1)]
        if k in R:
            r = R[k].evaluate(ref_f)
            for i in range(N):
                w = max(1 - i / n if bas else 0.0, 1 - (N - 1 - i) / n if son else 0.0)
                w = max(0.0, min(1.0, w)); w = w * w * (3 - 2 * w)
                v[i] += (r - v[i]) * w
        seri[k] = v
    yaz(act, seri, list(range(1, N + 1)))
    act.frame_range = (1, N)
    return act

ZINCIR_HARIC = ('IK', 'hedef', 'elma', 'göz', 'ağız', 'tutma')


def poz_al(act, f):
    kare_ayarla(act, f)
    return {pb.name: pb.matrix.copy() for pb in rig.pose.bones if not any(h in pb.name for h in ZINCIR_HARIC)}


def zincir_olc(ciftler):
    """klip A'nın son karesi ile B'nin ilk karesi: kemiklerin (armatür uzayı) en büyük açı (derece) ve yer (mm) farkı"""
    out = {}
    for a, b in ciftler:
        A, B = bpy.data.actions['Hareket - ' + a], bpy.data.actions['Hareket - ' + b]
        P0, P1 = poz_al(A, int(A.frame_range[1])), poz_al(B, 1)
        da, dm, ka, km_ = 0.0, 0.0, '', ''
        for n, M in P0.items():
            q0 = M.to_3x3().normalized().to_quaternion(); q1 = P1[n].to_3x3().normalized().to_quaternion()
            ang = math.degrees(q0.rotation_difference(q1).angle); ang = min(ang, 360 - ang)
            d = (M.translation - P1[n].translation).length * MM
            if ang > da: da, ka = ang, n
            if d > dm: dm, km_ = d, n
        out[f'{a}>{b}'] = {'derece': round(da, 2), 'kemik_d': ka, 'mm': round(dm, 1), 'kemik_mm': km_, 'gecti': da <= 2.0 and dm <= 5.0}
    return out


ZINCIR = [('diz_cok', 'kutu_al_diz'), ('kutu_al_diz', 'diz_bekle'), ('diz_bekle', 'diz_bekle'), ('diz_bekle', 'kutu_cevir_sag'),
          ('kutu_cevir_sag', 'diz_bekle'), ('diz_bekle', 'kutu_cevir_sol'), ('kutu_cevir_sol', 'diz_bekle'), ('diz_bekle', 'kutu_rafa_birak'),
          ('kutu_rafa_birak', 'kutu_al_diz'), ('kutu_rafa_birak', 'diz_kalk'), ('kutu_al_diz', 'diz_kalk'), ('diz_bekle', 'diz_kalk'),
          ('kutu_cevir_sag', 'kutu_cevir_sag'), ('kutu_al_diz', 'kutu_cevir_sol'),
          ('armut_yat', 'armut_uyukla'), ('armut_uyukla', 'armut_uyukla'), ('armut_uyukla', 'armut_kalk')]


def diz7_olc():
    """v7 diz ölçüleri: seiza ayakları, baş–raf, zemine giriş (bütün diz klipleri)"""
    on = KUTU7['ON_MM']; o = {}
    for ad in ('diz_cok', 'kutu_al_diz', 'diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol', 'kutu_rafa_birak', 'diz_kalk'):
        act = bpy.data.actions['Hareket - ' + ad]; son = int(act.frame_range[1])
        ks = list(range(1, son + 1, 2)) + [son]
        rb = raf_bas_kesisim(act, ks, on)
        zem = [diz_olc(act, f) for f in ks]
        r = {'bas_raf_en_derin_mm': max(v[0] for v in rb.values()), 'bas_raf_kose': sum(v[1] for v in rb.values()),
             'ayak_min_z': min(z['ayak_min_z'] for z in zem), 'pantolon_min_z': min(z['pantolon_min_z'] for z in zem)}
        if ad != 'diz_cok':
            r['seiza_bas_ayak'] = ayak_bolge(None, (act, 1))
        if ad in ('diz_cok', 'kutu_al_diz', 'diz_bekle', 'kutu_rafa_birak'):
            r['seiza_son_ayak'] = ayak_bolge(None, (act, son))
        o[ad] = r
    OLCUM_V7['diz'] = o
    return o


def eylemleri_kur():
    global ELMA_META, ELMA_KUR
    ELMA_KUR = elma_kur()
    agiz_beyaz_kur()
    ELMA_META = _elma_meta()
    diz_ayarla()
    seiza_ayarla()
    # v7: tv_armut yerine armut_yat / armut_uyukla / armut_kalk (armut7_kur); diz zincirine diz_bekle, kutu_cevir_sag/_sol, kutu_rafa_birak
    out = [buzdolabi('buzdolabi_ac', False), buzdolabi('buzdolabi_bos', True), elma_ye(), elma_firlat(), yaslan(), egil_bak(), kumanda(), kutu_al()]
    out += armut7_kur()
    out += [diz_cok(), kutu_al_diz(), diz_kalk(), diz_bekle(), kutu_cevir(+1), kutu_cevir(-1), kutu_rafa_birak()]
    out += [kitap_al('alt', 400), kitap_al('orta', 1000), kitap_al('ust', 1600)]
    rig.animation_data.action = bpy.data.actions[DURMA]
    for a in out: print('EYLEM', a.name, tuple(a.frame_range), a['site_meta'][:300])
    print('OLCUM_V5', json.dumps(OLCUM_V5, ensure_ascii=False))
    bpy.context.scene['olcum_v5'] = json.dumps(OLCUM_V5, ensure_ascii=False)
    OLCUM_V6['diz']['pozlar'] = POZ.get('olcu', {})
    OLCUM_V6['diz']['diz_cok_zemin'] = diz_klip_olc(bpy.data.actions['Hareket - diz_cok'], 50)
    OLCUM_V6['diz']['diz_kalk_zemin'] = diz_klip_olc(bpy.data.actions['Hareket - diz_kalk'], 52)
    print('OLCUM_V6', json.dumps(OLCUM_V6, ensure_ascii=False))
    bpy.context.scene['olcum_v6'] = json.dumps(OLCUM_V6, ensure_ascii=False)
    diz7_olc()
    OLCUM_V7['zincir'] = zincir_olc(ZINCIR)
    OLCUM_V7['seiza_poz'] = {'bilek_derece': dict(POZ['SEIZA']['bilek']), 'ayak_mm': mm(POZ['SEIZA']['ayak']['L']), 'olcu': POZ['olcu']['SEIZA']}
    print('OLCUM_V7', json.dumps(OLCUM_V7, ensure_ascii=False))
    bpy.context.scene['olcum_v7'] = json.dumps(OLCUM_V7, ensure_ascii=False)
    return out
