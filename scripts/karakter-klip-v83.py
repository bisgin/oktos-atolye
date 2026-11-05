# Biggie v8.3 klipleri (2026-11-05, kullanıcı canlıda baktı; meta: oktos-dijital-site/senaryo/klip-meta-v5.md "v8.3"):
#   büst   tutuş yeniden: taban sağ avucun İÇİNDE (avuç yukarı), sol el büstü YANDAN kavrar (parmaklar yanına sarılır),
#          büst göğüs hizasında, yüzden ~33 cm; büstün yüzü kameraya yarı dönük (BUST_YAW), Biggie'ye değil. v82 işlevlerinin
#          yerine geçer (bust_eller, tut_hizala, tutus_bul, bust_al): bust_* adları ve meta biçimi aynı.
#   masa   fare (avuç farenin sırtında, işaret ve orta parmak tuşlarda, başparmak yanda), masa_otur (sandalyeyi çeker,
#          çevirir, kolçaklara dayanıp sıçrayarak oturur, sandalyeyle masaya döner), masa_kalk (sandalyeyi yerinde bırakır).
#   elma   oturarak: elma_tut_otur, elma_isir_otur_1..4, elma_firlat_otur (oturduğu yerden çöpe, basketbol atışı).
# Konumlar odanın kodundan okunur (core/oda-olcu.js OLCU.CHAIR/DESK/ROOM, core/oda-portfolyo.js PORT.cop, core/oda-yerler.js
# masa durağı): oda değişince bu betik yeniden çalıştırılır.
# Girdi: karakter-klip-eylem.py ve karakter-klip-v82.py exec edilmiş (v82'den sonra exec edilir, aynı adlı işlevleri ezer).
import bpy, json, math, os, re
from mathutils import Vector, Matrix, Quaternion

OLCUM_V83 = {}


# ---- odanın ölçüleri (site kodundan) ----
def oda_oku():
    o = olcu_oku()
    port = open(os.path.join(KOK, 'core', 'oda-portfolyo.js'), encoding='utf-8').read()
    m = re.search(r'cop:\s*\{\s*x:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+),\s*r:\s*([\d.]+),\s*boy:\s*([\d.]+)', port)
    cop = [float(x) for x in m.groups()]
    yer = open(os.path.join(KOK, 'core', 'oda-yerler.js'), encoding='utf-8').read()
    m = re.search(r"\{\s*id:\s*'masa',\s*yer:\s*\[(-?[\d.]+),\s*(-?[\d.]+)\],\s*yon:\s*(-?[\d.]+)", yer)
    masa = [float(x) for x in m.groups()]
    return {'CHAIR': o['CHAIR'], 'DESK': o['DESK'], 'ROOM': o['ROOM'], 'cop': cop, 'masa': masa}


def dunya_yerel(p, kok, psi):
    """dünya (x, y) mm → karakter yereli (x sol, y −ileri) mm; kök ve bakış psi (derece; 0 = −y)"""
    a = math.radians(psi); f = Vector((math.sin(a), -math.cos(a))); sol = Vector((-f.y, f.x))
    d = Vector((p[0] - kok[0], p[1] - kok[1]))
    return Vector((d.dot(sol), -d.dot(f)))


# ---------------------------------------------------------------------------------------------------------------------
# Büst (v8.3)
BUST_YAW = 50.0           # derece: büstün ön yüzü (modelde −y) Biggie'nin önünden soluna doğru döner (kameraya yarı dönük)
BUST_RAF_YAW = 180.0      # rafta yüzü odaya (Biggie'ye)
TUT.update({'B': Vector((-0.12, -0.17, 0.44)), 'L_yan': 0.012, 'L_kivrim': 0.4, 'L_bas': 0.3, 'R_kivrim': 0.2, 'R_bas': 0.15, 'R_alt': 0.006,
            'R_ofset': Vector((0.0, 0.006, 0)), 'govde_pay_mm': 8})
GOZ = Vector((0, -0.105, 0.779))   # gözlerin yeri (göz kemiklerinin başı, dinlenme)
TUT_DON.update({'omurga': {'Z': -12, 'X': 4}, 'göğüs': {'Z': -8, 'X': 3}})   # v8.3: gövde büste (sağ öne) döner


def bust_yan(B):
    """büstün sol yanı (Biggie'nin +x'i) bel hizasında: dışarıdan merkeze ışınla bulunan yüzey noktası (armatür uzayı)"""
    M = bust_model(); c = B.translation; z = c.z + 0.32 * M['H']
    Bi = B.inverted(); q = Bi @ Vector((c.x + 0.3, c.y, z)); d = (Bi.to_3x3() @ Vector((-1, 0, 0))).normalized()
    h = M['bvh'].ray_cast(q, d)
    return (B @ h[0]) if h[0] is not None else Vector((c.x + M['bel_x'], c.y, z))


def bust_eller(B, f=None):
    c = B.translation
    R = c + Vector((0, 0, -TUT['R_alt'])) + TUT['R_ofset']
    L = bust_yan(B) + Vector((TUT['L_yan'], 0, 0))
    return {'R': (R, ((0.55, -0.83, 0), (0, 0, 1)), Vector((-0.30, 0.0, 0.34))),
            'L': (L, ((-0.12, -1, 0.08), (-1, 0, 0)), Vector((0.30, 0.16, 0.36)))}


def tut_hizala(ad, son, S, aralik=None):
    a, b = aralik or (1, son)
    return hizala_avuc(ad, son, S, {'R': [(a, b, lambda f: (0, 0, 1), 0)], 'L': [(a, b, lambda f: (-1, 0, 0), 0)]})


def Bmat(p, yaw):
    return Matrix.Translation(p) @ Matrix.Rotation(math.radians(yaw), 4, 'Z')


def tutus_bul():
    """sabit tutuş: büst gövdeden ≥ pay, avuçlar büste ~1 mm, kıvrım büste girmeyen en büyük; büst gözlere ~330 mm"""
    B = lambda f: Bmat(TUT['B'], BUST_YAW)
    def olc():
        S = tut_S(3, B); S['canli'] = 0; S['nefes'] = 0; tut_hizala('_tut_olc', 3, S)
        act = klip_kur('_tut_olc', 3, S); o = el_bust_olc(act, 2, B(2)); o['hata'] = max(el_hatasi(act, S, t, 1, 3) for t in 'LR')
        kare_ayarla(act, 2); g = (rig.pose.bones['kafa'].matrix @ REST['kafa'].inverted()) @ GOZ
        o['goz_mm'] = round((bust_merkez(B(2)) - g).length * MM, 1)
        bpy.data.actions.remove(act); return o
    for _ in range(6):
        o = olc()
        if o['govde'] >= TUT['govde_pay_mm']: break
        TUT['B'] = TUT['B'] + Vector((0, -min(25, TUT['govde_pay_mm'] - o['govde'] + 3) * U, 0))
    for _ in range(5):
        o = olc()
        TUT['R_alt'] -= max(-30, min(30, o['avuc_R'] - 1.0)) * U * 0.9
        TUT['L_yan'] -= max(-30, min(30, o['avuc_L'] - 1.0)) * U * 0.9
    for t in 'LR':
        lo, hi = 0.0, 0.95
        for _ in range(6):
            TUT[t + '_kivrim'] = (lo + hi) / 2; o = olc()
            if o['parmak_' + t] >= 1.0: lo = TUT[t + '_kivrim']
            else: hi = TUT[t + '_kivrim']
        TUT[t + '_kivrim'] = round(lo, 3); lo, hi = 0.0, 0.85
        for _ in range(5):
            TUT[t + '_bas'] = (lo + hi) / 2; o = olc()
            if o['basparmak_' + t] >= 1.0: lo = TUT[t + '_bas']
            else: hi = TUT[t + '_bas']
        TUT[t + '_bas'] = round(lo, 3)
    o = olc()
    OLCUM_V82['bust_tutus'] = {'olcu_mm': o, 'B_mm': mm(TUT['B']), 'yaw': BUST_YAW, 'kivrim': {t: TUT[t + '_kivrim'] for t in 'LR'}, 'basparmak': {t: TUT[t + '_bas'] for t in 'LR'}}
    print('TUTUS83', OLCUM_V82['bust_tutus'])
    return o


_bust_al_v82 = bust_al


def bust_al(var, h):
    """v8.2'nin alışı + büstün dönüşü: rafta yüzü Biggie'ye (180°), kaldırırken iki elin arasında BUST_YAW'a döner"""
    act, S, Bf0, K, B_raf = _bust_al_v82(var, h)
    son = int(act.frame_range[1])
    yaw = [[1, BUST_RAF_YAW], [K['KALK'], BUST_RAF_YAW], [K['YER'], BUST_YAW], [son, BUST_YAW]]
    Bf = lambda f: Bmat(Bf0(f).translation, anahtar(yaw, f))
    S2 = tut_S(son, Bf)   # eller döndürülmüş büste göre yeniden (v82 yolunun anahtarlarıyla birleştirilir)
    for t in 'LR':
        a0 = K['AL'] - 4 if t == 'L' else K['R_TUT']
        for k in ('yer', 'yon', 'dirsek'):
            S['el'][t][k] = [x for x in S['el'][t][k] if x[0] < a0] + [x for x in S2['el'][t][k] if x[0] >= a0]
    S['parmak'] = {'L': [[1, 0.15], [16, 0.05], [K['AL'] - 2, 0.1], [K['AL'] + 2, TUT['L_kivrim']], [son, TUT['L_kivrim']]],
                   'R': [[1, 0.15], [36, 0.05], [K['R_TUT'], TUT['R_kivrim']], [son, TUT['R_kivrim']]]}
    S['basparmak'] = {'L': [[1, 0.0], [K['AL'] - 2, 0.0], [K['AL'] + 2, TUT['L_bas']], [son, TUT['L_bas']]], 'R': [[1, 0.0], [K['R_TUT'] - 4, 0.0], [K['R_TUT'], TUT['R_bas']], [son, TUT['R_bas']]]}
    S['bak']['yer'] = [(f, tuple(bust_merkez(Bf(f)) + Vector((0, 0.02, 0.0)))) for f in sorted(set(range(1, son + 1, 4)) | {son})]
    ad = f'bust_al_{var}'
    hizala_avuc(ad, son, S, {'R': [(K['R_TUT'], son, lambda f: (0, 0, 1), 0)], 'L': [(K['AL'] - 4, son, lambda f: (-1, 0, 0), 0)]})
    act = kol_coz(ad, son, S, {'L': [(K['AL'], son)], 'R': [(K['R_TUT'], son)]})
    return act, S, Bf, K, B_raf


_bust_meta_v82 = bust_meta_ortak


def bust_meta_ortak(act, f, Bf):
    m = _bust_meta_v82(act, f, Bf)
    m['yaw_derece'] = BUST_YAW
    m['not'] = ('v8.3: büst el.R\'ye bağlı (soket): taban merkezi kemiğin yerelinde el_yerel, dönüşü el_yerel_q ([x, y, z, w]); '
                'dönüş büstün yüzünü de içerir (modelin ön yüzü −y; tutuşta Biggie\'nin önünden soluna yaw_derece, kameraya yarı dönük). '
                'Büst sabit açıda durur, dönmez.')
    return m


def bust_tut():
    son = 121
    nf = lambda f: math.sin(2 * math.pi * (f - 1) / 120)
    Bf = lambda f: Bmat(TUT['B'] + Vector((0, 0, 0.0016 * nf(f))), BUST_YAW)
    S = tut_S(son, Bf)
    S['don']['kafa'] = {'Z': [[1, 0], [40, 4], [80, -3], [son, 0]], 'Y': [[1, 0], [50, 3], [100, -2], [son, 0]]}
    S['kirp'] = [30, 92]; S['canli'] = 0.4; S['nefes_uc'] = True
    tut_hizala('bust_tut', son, S)
    return kol_coz('bust_tut', son, S, {t: [(1, son)] for t in 'LR'}), S, Bf


def bust_tut_yuru(tut_act):
    son = 43
    S0 = {'taban_akt': (YURUME, lambda f: f), 'don': {}, 'nefes': 0, 'canli': 0, 'gecikmesiz': True}
    T = yuru_tasi('bust_tut_yuru', son, S0, tut_act)
    Bf = lambda f: T[max(1, min(son, round(f)))] @ Bmat(TUT['B'], BUST_YAW)
    S = tut_S(son, Bf); S.update(S0); S['goz_bak'] = 0.4
    S['don'] = {b: {ax: [[1, v * 0.5], [son, v * 0.5]] for ax, v in d.items()} for b, d in TUT_DON.items()}
    tut_hizala('bust_tut_yuru', son, S)
    return kol_coz('bust_tut_yuru', son, S, {t: [(1, son)] for t in 'LR'}), S, Bf


# ---------------------------------------------------------------------------------------------------------------------
# Fare (v8.3): avuç farenin sırtında (arka yarısı), işaret ve orta parmak iki tuşun üstünde (hafif kıvrık), yüzük ve serçe
# sağ yanda kıvrık, başparmak sol yanda. Fare önkolun doğrultusunda hafif içe dönük (FARE_YAW).
FARE_YAW = -14.0   # derece (+ sola): fare ucu Biggie'nin sağından içe


def v82_fare():
    son = 151
    S = {'taban_akt': (KLAVYE, 1), 'bacak_fk': True, 'nefes': 0.6, 'canli': 0.35, 'nefes_uc': True}
    a0 = klip_kur('_fare0', 3, dict(S, el={})); P0, Y0 = el_poz(a0, 1, 'R'); bpy.data.actions.remove(a0)
    ex, ey, ez = (v * U for v in FARE['olcu']); C0 = FARE['merkez']
    TUT0, TUT1 = 22, 128
    yol = [(1, (0, 0)), (TUT0, (0, 0)), (34, (12, 8)), (44, (-18, 14)), (52, (-20, 12)), (62, (25, -10)), (70, (40, -22)), (78, (38, -20)),
           (92, (-6, 18)), (104, (-10, 20)), (114, (8, 4)), (TUT1, (0, 0)), (son, (0, 0))]
    Cf = lambda f: C0 + Vector((*(Vector(vanahtar([(k, (x * U, y * U, 0)) for k, (x, y) in yol], f))[:2]), 0))
    Rf = Matrix.Rotation(math.radians(FARE_YAW), 3, 'Z')
    avuc = lambda f: Cf(f) + Rf @ Vector((0, 0.028, ez + 0.004))     # avuç farenin arka yarısının sırtında
    YON = (tuple(Rf @ Vector((0, -1, -0.32))), (0, 0, -1))              # parmaklar farenin ucuna, avuç aşağı
    yer = [(1, P0), (8, tuple(Vector(P0) + Vector((-0.02, 0.0, 0.03)))), (16, tuple(avuc(TUT0) + Vector((0, 0.01, 0.035)))), (TUT0, tuple(avuc(TUT0)))]
    yer += [(f, tuple(avuc(f))) for f in range(TUT0 + 2, TUT1, 2)] + [(TUT1, tuple(avuc(TUT1))), (136, tuple(avuc(TUT1) + Vector((0, 0.01, 0.035)))),
            (144, tuple(Vector(P0) + Vector((-0.02, 0, 0.03)))), (son, P0)]
    S['el'] = {'R': {'ik': [[1, 0], [6, 1], [146, 1], [son, 0]], 'yer': yer, 'yon': [(1, Y0), (10, Y0), (TUT0, YON), (TUT1, YON), (142, Y0), (son, Y0)],
                     'dirsek': [(1, (-0.3, 0.05, 0.35)), (TUT0, (-0.4, 0.14, 0.3)), (TUT1, (-0.4, 0.14, 0.3)), (son, (-0.3, 0.05, 0.35))]}}
    S['parmak'] = {'R': [[1, 0.2], [14, 0.05], [TUT0, 0.15], [TUT1, 0.15], [136, 0.05], [son, 0.2]]}
    # parmak başına kıvrım (1 işaret, 2 orta tuşlarda düz; 3 yüzük, 4 serçe yanda kıvrık)
    S['parmak_tek'] = {'R': {i: [[1, 0.2], [14, 0.05], [TUT0, c], [TUT1, c], [136, 0.05], [son, 0.2]] for i, c in ((1, 0.12), (2, 0.14), (3, 0.42), (4, 0.5))}}
    S['basparmak'] = {'R': [[1, 0.1], [TUT0 - 2, 0.0], [TUT0 + 2, 0.12], [TUT1 - 2, 0.12], [TUT1 + 2, 0.0], [son, 0.1]]}
    tik = [54, 58, 80, 108]
    S['parmak_ek'] = {'R': {1: [[1, 0]] + [kv for t_ in tik for kv in ([t_ - 2, 0], [t_, 8], [t_ + 2, 0])] + [[son, 0]]}}
    S['bak'] = {'agirlik': [[1, 0], [10, 0.25], [30, 0], [son, 0]], 'yer': [(1, tuple(C0)), (son, tuple(C0))]}
    S['don'] = {'omurga': {'Z': [[1, 0], [30, -3], [120, -3], [son, 0]]}, 'omuz.R': {'Y': [[1, 0], [TUT0, 4], [TUT1, 4], [son, 0]]}}
    act = kol_coz('fare', son, S, {'R': [(TUT0, TUT1)]})
    Mf = lambda f: Matrix.Translation(Cf(f)) @ Matrix.Rotation(math.radians(FARE_YAW), 4, 'Z')
    t_, q_ = soket(act, 60, 'el.R', Mf(60))
    Lr = rig.pose.bones['el.R'].matrix.inverted() @ Mf(60); kay = 0.0
    for f in range(TUT0, TUT1 + 1, 2):
        kare_ayarla(act, f); kay = max(kay, ((rig.pose.bones['el.R'].matrix @ Lr).translation - Cf(f)).length)
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': True, 'dongu': [1, son], 'masa': True, 'z': 335, 'koltuk': -7.5, 'tut': [TUT0, TUT1], 'tik': tik,
        'fare': {'kemik': 'el.R', 'el_yerel': t_, 'el_yerel_q': q_, 'nokta': 'farenin taban merkezi (masada)', 'olcu_mm': list(FARE['olcu']), 'yaw_derece': FARE_YAW,
                 'olcek_onerisi': FARE['olcek_onerisi'], 'masa_z_mm': round(FARE['merkez'].z * MM), 'merkez_mm': mm(C0),
                 'yol': [[f, mm(Cf(f))] for f in range(1, son + 1, 2)] + [[son, mm(Cf(son))]], 'el_kayma_mm': round(kay * MM, 1),
                 'not': 'v8.3: avuç farenin sırtında, işaret (parmak 1) ve orta (2) tuşlarda, yüzük ve serçe sağ yanda, başparmak sol yanda. '
                        'tut aralığında fare el.R soketiyle (ya da yol + yaw_derece) gider.'},
        'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1),
        'not': 'v8.3: yaz (Klavye Tuşlama) 1. karesinden başlar ve ona döner. Sol el klavyede.'}, ensure_ascii=False)
    OLCUM_V82['fare'] = {'el_kayma_mm': round(kay * MM, 1), 'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1)}
    return [act]


# ---------------------------------------------------------------------------------------------------------------------
# Oturarak elma (v8.3): taban Klavye Tuşlama'nın 1. karesi (masada oturuş, kök sitede MASA_Z 335 yukarıda), bacaklar FK,
# sol el klavyede. Ayaktaki tutuş/ısırık yolları göğsün (tutuş) ve başın (ağız) dönüşümüyle oturuşa taşınır.
OTUR0 = {'taban_akt': (KLAVYE, 1), 'bacak_fk': True}


def kemik_M(act, f, k): kare_ayarla(act, f); return rig.pose.bones[k].matrix.copy()


def otur_tasi(ad, son, S0, ref_act, ref_f=1):
    """oturuşta (S0) göğüs ve baş dönüşümleri: ayaktaki ref klibin ref_f karesindekine göre (her kare)"""
    a = klip_kur('_' + ad, son, dict(S0, el={}))
    G = {f: kemik_M(a, f, 'göğüs') for f in range(1, son + 1)}; K = {f: kemik_M(a, f, 'kafa') for f in range(1, son + 1)}
    bpy.data.actions.remove(a)
    G0, K0 = kemik_M(ref_act, ref_f, 'göğüs'), kemik_M(ref_act, ref_f, 'kafa')
    return {f: g @ G0.inverted() for f, g in G.items()}, {f: k @ K0.inverted() for f, k in K.items()}


def v83_elma_otur():
    out = []
    tut_ref = bpy.data.actions['Hareket - elma_tut']
    son = 91
    S0 = dict(OTUR0, nefes=0.6, canli=0.5, nefes_uc=True)
    TG, TK = otur_tasi('elma_tut_otur', son, S0, tut_ref)
    tf = lambda f, v: tuple(TG[f] @ Vector(v)); tr = lambda f, v: tuple(TG[f].to_3x3() @ Vector(v))
    S = dict(S0, elma_serbest=True)
    S['el'] = {'R': {'ik': [[1, 1], [son, 1]], 'nokta': ELMA_EL, 'yer': [(f, tf(f, ELMA_ALT)) for f in range(1, son + 1, 2)] + [(son, tf(son, ELMA_ALT))],
                     'yon': [(f, (tr(f, ELMA_TUT[0]), tr(f, ELMA_TUT[1]))) for f in range(1, son + 1, 2)] + [(son, (tr(son, ELMA_TUT[0]), tr(son, ELMA_TUT[1])))],
                     'dirsek': [(f, tf(f, DIRSEK_TUT['R'])) for f in range(1, son + 1, 6)] + [(son, tf(son, DIRSEK_TUT['R']))]}}
    S['parmak'] = {'R': [[1, ELMA_KIVRIM[0]], [son, ELMA_KIVRIM[0]]]}; S['basparmak'] = {'R': [[1, ELMA_KIVRIM[1]], [son, ELMA_KIVRIM[1]]]}
    S['don'] = {'kafa': {'X': [[1, 0], [30, 6], [44, 7], [60, 0], [son, 0]], 'Z': [[1, 0], [30, -4], [60, 3], [son, 0]]}}
    S['kirp'] = [20, 70]
    tut = kol_coz('elma_tut_otur', son, S, {'R': [(1, son)]})
    tut['site_meta'] = json.dumps({'sure': 3.0, 'tekrar': True, 'dongu': [1, son], 'masa': True, 'z': 335, 'koltuk': -7.5, 'elma_serbest': True, 'elma': _elma_meta(),
        'not': 'v8.3: masada oturarak elmayı tutar (yaz gibi kök MASA_Z 335 yukarıda; sol el klavyede). Elma kemiklerine anahtar yok.'}, ensure_ascii=False)
    out.append(tut)
    # ısırıklar: v8.2'nin ayaktaki elma_isir_k'sinin el ve baş yolu oturuşa taşınır
    for k in range(1, 5):
        ref = bpy.data.actions[f'Hareket - elma_isir_{k}']; rm = json.loads(ref['site_meta']); son = int(ref.frame_range[1])
        TG, TK = otur_tasi(f'elma_isir_otur_{k}', son, S0, tut_ref)
        S = dict(S0)
        yer, yon = [], []
        for f in range(1, son + 1):
            p, y = el_poz(ref, f, 'R'); T = TG[f]
            P = T @ (el_noktasi('R', ELMA_EL) if True else Vector(p))
            kare_ayarla(ref, f); P = T @ el_noktasi('R', ELMA_EL)
            yer.append((f, tuple(P))); yon.append((f, (tuple(T.to_3x3() @ Vector(y[0])), tuple(T.to_3x3() @ Vector(y[1])))))
        dr = [(f, tuple(TG[f] @ nokta(ref, f, 'ön_kol.R'))) for f in range(1, son + 1, 4)]
        S['el'] = {'R': {'ik': [[1, 1], [son, 1]], 'nokta': ELMA_EL, 'yer': yer, 'yon': yon, 'dirsek': dr}}
        # yüz, çene, yanak, elma kemikleri ve baş: ayaktaki klibin kanalları (fc) aynen; gövde oturuşta
        S['parmak'] = {'R': [[1, ELMA_KIVRIM[0]], [son, ELMA_KIVRIM[0]]]}; S['basparmak'] = {'R': [[1, ELMA_KIVRIM[1]], [son, ELMA_KIVRIM[1]]]}
        S['kirp'] = [44, 80]
        a = klip_kur(f'elma_isir_otur_{k}', son, S)
        kopya_kanal(ref, a, ('ağız', 'çene', 'yanak.L', 'yanak.R', 'elma', 'kafa'))
        uc_kilitle(a, tut, 1, n=6)
        m = {kk: rm[kk] for kk in ('isirik', 'cigne', 'tutuyor', 'elma_adim', 'elma_don_derece', 'elma') if kk in rm}
        m.update({'sure': 3.0, 'tekrar': False, 'masa': True, 'z': 335, 'koltuk': -7.5,
                  'not': f'v8.3: masada oturarak {k}. ısırık (elma_isir_{k}\'nin oturuşu): elma_tut_otur pozundan kaldırır, ısırır, indirir. '
                         'Uçlar elma_tut_otur 1. karesi.'})
        a['site_meta'] = json.dumps(m, ensure_ascii=False)
        out.append(a)
    out.append(elma_firlat_otur(tut))
    return out


def kopya_kanal(kaynak, hedef, kemikler):
    """kaynak aksiyonun bu kemiklerdeki bütün kanalları hedefe (aynı kareler)"""
    F = fcmap(kaynak); N = int(hedef.frame_range[1]); seri = {}
    for (yol, i), c in F.items():
        if any(f'"{k}"' in yol for k in kemikler) or any(f'"{k}' in yol and k == 'elma' for k in kemikler):
            seri[(yol, i)] = [c.evaluate(f) for f in range(1, N + 1)]
    yaz(hedef, seri, list(range(1, N + 1))); hedef.frame_range = (1, N)


def elma_firlat_otur(tut):
    """oturduğu yerden çöpe: gövde ve baş çöpe döner, ayaktaki elma_firlat'ın el yolu dönmüş göğse taşınır (basketbol
    atışı: iki el göğüste, kalkış, bilek kırılır), bırakır, takip, klavyeye döner"""
    O = oda_oku(); masa = O['masa']; cop = O['cop']
    hedef = dunya_yerel(cop[:2], masa[:2], masa[2])
    yon = math.degrees(math.atan2(hedef.x, -hedef.y))          # + sol, − sağ (yerelde dönüş açısı)
    son = 61; D = 3; BIRAK = 25 + D
    ref = bpy.data.actions['Hareket - elma_firlat']
    don = max(-80, min(80, yon))
    S0 = dict(OTUR0, nefes=0.4, canli=0.3, nefes_uc=True, gecikmesiz=False)
    S0['don'] = {'kalça': {'Z': [[1, 0], [10, 0.15 * don], [44, 0.15 * don], [56, 0], [son, 0]]},
                 'omurga': {'Z': [[1, 0], [10, 0.32 * don], [44, 0.32 * don], [56, 0], [son, 0]]},
                 'göğüs': {'Z': [[1, 0], [10, 0.28 * don], [44, 0.28 * don], [56, 0], [son, 0]]},
                 'kafa': {'Z': [[1, 0], [9, 0.3 * don], [44, 0.3 * don], [56, 0], [son, 0]]}}
    TG = {}
    a = klip_kur('_firlat_otur', son, dict(S0, el={}))
    for f in range(1, son + 1):
        g = max(1, min(41, f - D)); TG[f] = kemik_M(a, f, 'göğüs') @ kemik_M(ref, g, 'göğüs').inverted()
    bpy.data.actions.remove(a)
    S = dict(S0); yer, yo, dr = [], [], []
    for f in range(1, son + 1):
        g = max(1, min(41, f - D)); kare_ayarla(ref, g); P = TG[f] @ el_noktasi('R', ELMA_EL); _, y = el_poz(ref, g, 'R')
        # oturuşta baş göğse daha yakın: atışın çıkış noktası yüzün önü değil sağ şakağın yanı (göğsün çerçevesinde sağa ve öne)
        w_ = max(0.0, min(1.0, min((f - 8) / 8, (46 - f) / 8)))
        P = P + TG[f].to_3x3() @ Vector((-0.135, -0.06, 0.02)) * w_
        yer.append((f, tuple(P))); yo.append((f, (tuple(TG[f].to_3x3() @ Vector(y[0])), tuple(TG[f].to_3x3() @ Vector(y[1])))))
        if f % 3 == 1: dr.append((f, tuple(TG[f] @ nokta(ref, g, 'ön_kol.R'))))
    a0 = klip_kur('_fo0', 3, dict(OTUR0, el={})); P0, Y0 = el_poz(a0, 1, 'R'); bpy.data.actions.remove(a0)
    S['el'] = {'R': {'ik': [[1, 1], [44, 1], [58, 0], [son, 0]], 'nokta': ELMA_EL, 'yer': [x for x in yer if x[0] <= 44] + [(56, P0), (son, P0)],
                     'yon': [x for x in yo if x[0] <= 44] + [(56, Y0), (son, Y0)], 'dirsek': dr}}
    S['parmak'] = {'R': [[1, ELMA_KIVRIM[0]], [BIRAK - 6, 0.3], [BIRAK, 0.2], [BIRAK + 2, 0.05], [40, 0.15], [54, 0.0], [son, 0.0]]}
    S['basparmak'] = {'R': [[1, ELMA_KIVRIM[1]], [BIRAK, 0.25], [BIRAK + 2, 0], [son, 0.0]]}
    S['elma'] = {'kocan': [[1, 1], [BIRAK + 1, 0]]}
    S['bak'] = {'agirlik': [[1, 0], [9, 0.6], [40, 0.6], [52, 0], [son, 0]], 'yer': [(1, (hedef.x * U, hedef.y * U, cop[3] * U - 0.22)), (son, (hedef.x * U, hedef.y * U, cop[3] * U - 0.22))]}
    act = kol_coz('elma_firlat_otur', son, S, {'R': [(BIRAK - 3, BIRAK + 3)]})
    uc_kilitle(act, tut, 1, son=False, n=6)
    # bırakma noktası ve önerilen hız: yayın tepesi tavanın 500 mm altını geçmez, bombeli (tepe ~ min(1950, tavan − 550))
    p1 = elma_nokta(act, BIRAK)
    z0 = p1.z * MM + 335; zc = cop[3]; tepe = min(O['ROOM']['h'] - 550, max(z0 + 380, 1800))
    dh = Vector((hedef.x - p1.x * MM, hedef.y - p1.y * MM)); d = dh.length; g_ = 9810.0
    vz = math.sqrt(2 * g_ * (tepe - z0)); t1 = vz / g_; t2 = math.sqrt(2 * (tepe - zc) / g_); vh = d / (t1 + t2)
    hiz = [round(dh.x / d * vh), round(dh.y / d * vh), round(vz)]
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': False, 'masa': True, 'z': 335, 'koltuk': -7.5, 'birak': BIRAK, 'takip': [BIRAK, BIRAK + 9],
        'birak_nokta_mm': mm(p1), 'birak_nokta_not': 'karakter yereli, kök yerde; oturuşta dünya z = + MASA_Z (335)',
        'onerilen_hiz_mm_s': hiz, 'tepe_z_mm': round(tepe), 'ucus_sn': round(t1 + t2, 3), 'hedef_yerel_mm': [round(hedef.x), round(hedef.y), round(zc)],
        'hedef_yon_derece': round(yon, 1), 'govde_don_derece': round(don, 1), 'kocan': {**KOCAN, 'kemik': 'el.R', 'el_yerel': ELMA_META['el_yerel']},
        'oda': {'cop': cop, 'masa_kok': masa, 'tavan_mm': O['ROOM']['h']},
        'atis_not': 'v8.3: oturduğu yerden basketbol atışı; gövde ve baş çöpe döner (govde_don_derece). Hız birak_nokta\'dan çöpün ağzına, '
                    'yayın tepesi tepe_z_mm (tavanın ≥ 500 mm altı). Çöp ya da oturuş değişirse site aynı formülle yeniden hesaplar: '
                    'vz = √(2g(tepe − z0)), t = vz/g + √(2(tepe − z_ağız)/g), yatay = mesafe / t; g = 9810 mm/sn².',
        'not': 'v8.3: elma_tut_otur pozundan (koçan elde) başlar, klavyedeki yaz 1. karesine döner.'}, ensure_ascii=False)
    OLCUM_V83['elma_firlat_otur'] = {'hedef_yon': round(yon, 1), 'birak_z_dunya': round(z0), 'tepe': round(tepe), 'hiz': hiz}
    return act


# ---------------------------------------------------------------------------------------------------------------------
# Masa (v8.3): sandalye masaya itilmiş (OLCU.CHAIR). masa_otur: sandalyenin sağında (oturuş yönüne göre) durur, sol eliyle
# sağ kolçağı kavrar, sandalyeyi bir kez geri çeker ve kendine çevirir (−90°), sırtını dönüp iki eliyle kolçaklara dayanır,
# küçük bir sıçrayışla oturur (oturak 548 mm: kalçası 456), sandalyeyle birlikte masaya döner ve yaklaşır, elleri klavyeye.
# Kök (klipte) masa durağı (YER.masa); gövdenin kayması ve sandalyenin yolu meta'da (karakter yereli, mm). Son poz = yaz 1.
KOLTUK = {'oturak_mm': 548, 'kolcak_x': 310, 'kolcak_z': 715, 'kolcak_y': -60, 'kalca_on_mm': 14.5, 'yaz_kalca_y_mm': -22.0}


def masa_otur_S():
    O = oda_oku(); masa = O['masa']
    C0 = dunya_yerel((O['CHAIR']['x'], O['CHAIR']['y']), masa[:2], masa[2]) * U; rz0 = math.degrees(O['CHAIR']['rz'])   # sandalye yereli (bakış masaya)
    son = 141
    C1 = Vector((C0.x, 0.05)); Cs = Vector((0, -7.5 * U))
    kol = [(1, C0, 0.0), (18, C0, 0.0), (34, C1, 0.0), (46, C1, -90.0), (82, C1, -90.0), (106, Cs, 0.0), (son, Cs, 0.0)]
    Cp = lambda f: vanahtar([(k, (p.x, p.y, 0)) for k, p, _ in kol], f)
    Cr = lambda f: anahtar([[k, r] for k, _, r in kol], f)
    CM = lambda f: Matrix.Translation(Cp(f)) @ Matrix.Rotation(math.radians(Cr(f)), 4, 'Z')
    kolcak = lambda f, s: CM(f) @ Vector((s * KOLTUK['kolcak_x'] * U, KOLTUK['kolcak_y'] * U, (KOLTUK['kolcak_z'] + 14) * U))
    # gövde (kalçanın yatay yeri, yaw): yanında durur → sandalyeyi çekerken geri adım → döner → oturağın önü → sıçrar → sandalyede
    B0 = Vector((-0.40, 0.04)); on_otur = lambda f: Cp(f).xy + Matrix.Rotation(math.radians(Cr(f)), 2) @ Vector((0, -0.25))
    govde = [(1, B0, 0.0), (14, B0 + Vector((0.04, 0)), 0.0), (34, B0 + Vector((0.04, 0.09)), 0.0), (46, B0 + Vector((0.03, 0.06)), 0.0),
             (60, on_otur(60) + Vector((-0.06, 0)), -90.0), (70, on_otur(70), -90.0)]
    otur_k = lambda f: Cp(f).xy + Matrix.Rotation(math.radians(Cr(f)), 2) @ Vector((0, -KOLTUK['kalca_on_mm'] * U))
    govde += [(82, otur_k(82), -90.0), (94, otur_k(94), Cr(94)), (106, otur_k(106), 0.0), (son, otur_k(son), 0.0)]
    Gp = lambda f: vanahtar([(k, (p.x, p.y, 0)) for k, p, _ in govde], f)
    Gy = lambda f: anahtar([[k, y] for k, _, y in govde], f)
    TAKE, LAND = 72, 80                                   # sıçrayış: ayaklar yerden kesilir → oturakta
    Z = [[1, 0], [TAKE, 0], [LAND, 335], [son, 335]]
    w_ot = [[1, 0], [TAKE - 2, 0], [LAND + 2, 1], [son, 1]]
    S = {'taban_karisim': (KLAVYE, 1, w_ot), 'bacak_ik': [[1, 1], [TAKE, 1], [LAND - 2, 0], [son, 0]], 'nefes': 0.6, 'canli': 0.3, 'nefes_uc': True, 'gecikmesiz': False}
    # kalça: dünyadaki hedef (yatay Gp, yükseklik: ayakta 456 + çömelme → sıçrayış → oturakta 620) − sitenin kök yüksekliği
    # (z) − tabanın (Durma → Klavye karışımı) kendi kalçası = klibin kalça kayması
    kare_ayarla(bpy.data.actions[DURMA], 1); K0 = rig.pose.bones['kalça'].head.copy()
    kare_ayarla(bpy.data.actions[KLAVYE], 1); K1 = rig.pose.bones['kalça'].head.copy()
    def hz(f):
        if f <= TAKE: return K0.z + anahtar([[1, 0], [64, 0], [69, -0.035], [TAKE, -0.03]], f)
        return anahtar([[TAKE, K0.z - 0.03], [76, K1.z + 335 * U + 0.03], [LAND, K1.z + 335 * U], [son, K1.z + 335 * U]], f)
    S['kalca'] = []
    for f in sorted(set(range(1, son + 1, 2)) | {son}):
        w = max(0.0, min(1.0, anahtar(w_ot, f))); base = K0.lerp(K1, w); p = Gp(f)
        S['kalca'].append((f, (p.x - base.x, p.y - base.y, hz(f) - anahtar(Z, f) * U - base.z)))
    S['don'] = {'kalça': {'Z': [[f, Gy(f)] for f in sorted(set(range(1, son + 1, 3)) | {son})]},
                'omurga': {'X': [[1, 0], [14, 8], [30, 12], [46, 2], [62, 6], [70, 14], [LAND, 4], [100, 2], [son, 0]],
                           'Z': [[1, 0], [14, -10], [34, -14], [46, 0], [son, 0]]},
                'kafa': {'X': [[1, 0], [14, 8], [62, 18], [LAND, 4], [son, 0]]}}
    # ayaklar (ayakta): gövdeyle taşınır ve döner (bileğin dönüşü = gövdenin yaw'ı); yerde kalır (klipte −z: kök sitede
    # yükselirken); sıçrayınca IK kalkar (FK oturuş)
    ayak = {}
    kare_ayarla(bpy.data.actions[DURMA], 1); A0 = {t: rig.pose.bones['ayak.' + t].head.copy() for t in 'LR'}
    for t in 'LR':
        ayak[t] = []
        for f in sorted(set(range(1, LAND + 1, 2)) | {LAND, son}):
            g = min(f, LAND); R2 = Matrix.Rotation(math.radians(Gy(g)), 3, 'Z'); P = Gp(g)
            hedef = Vector((P.x, P.y, 0)) + R2 @ (A0[t] - Vector((K0.x, K0.y, 0)))
            d = hedef - A0[t]; d.z = -anahtar(Z, f) * U
            ayak[t].append((f, tuple(d)))
    S['ayak'] = ayak
    S['ayak_yaw'] = {t: [[f, Gy(min(f, LAND))] for f in sorted(set(range(1, LAND + 1, 3)) | {LAND, son})] for t in 'LR'}
    # eller: sol el sağ kolçağı (14–46: çeker, çevirir); dönünce iki el arkadaki kolçaklara (60–100), sonra klavyeye (FK)
    a0 = klip_kur('_masa0', 3, dict(OTUR0, el={})); PK = {t: el_poz(a0, 1, t) for t in 'LR'}; bpy.data.actions.remove(a0)
    AV = ((0, -1, -0.15), (0, 0, -1))
    def kol_yon(f, s): R3 = CM(f).to_3x3(); return (tuple(R3 @ Vector(AV[0])), AV[1])
    L_yer = [(1, (0.2, -0.07, 0.38)), (10, tuple(kolcak(18, -1) + Vector((0.03, 0.03, 0.06))))] + [(f, tuple(kolcak(f, -1))) for f in range(18, 41, 2)] + \
            [(48, tuple(kolcak(40, -1) + Vector((-0.06, 0, 0.08)))), (58, tuple(kolcak(60, 1) + Vector((0, 0, 0.06))))] + [(f, tuple(kolcak(f, 1))) for f in range(62, 101, 2)] + \
            [(112, PK['L'][0]), (son, PK['L'][0])]
    L_yo = [(1, SARK['L']), (10, kol_yon(18, -1))] + [(f, kol_yon(f, -1)) for f in range(18, 41, 2)] + [(58, kol_yon(60, 1))] + \
           [(f, kol_yon(f, 1)) for f in range(62, 101, 2)] + [(112, PK['L'][1]), (son, PK['L'][1])]
    R_yer = [(1, (-0.2, -0.07, 0.38)), (50, (-0.2, -0.07, 0.38)), (58, tuple(kolcak(60, -1) + Vector((0, 0, 0.06))))] + [(f, tuple(kolcak(f, -1))) for f in range(62, 101, 2)] + \
            [(112, PK['R'][0]), (son, PK['R'][0])]
    R_yo = [(1, SARK['R']), (50, SARK['R']), (58, kol_yon(60, -1))] + [(f, kol_yon(f, -1)) for f in range(62, 101, 2)] + [(112, PK['R'][1]), (son, PK['R'][1])]
    S['el'] = {'L': {'ik': [[1, 0], [8, 1], [118, 1], [126, 0], [son, 0]], 'yer': L_yer, 'yon': L_yo, 'dirsek': [(1, (0.42, 0.05, 0.3)), (30, (0.45, 0.2, 0.35)), (70, (0.45, 0.25, 0.4)), (son, (0.42, 0.1, 0.3))]},
               'R': {'ik': [[1, 0], [50, 0], [56, 1], [118, 1], [126, 0], [son, 0]], 'yer': R_yer, 'yon': R_yo, 'dirsek': [(1, (-0.42, 0.05, 0.3)), (70, (-0.45, 0.25, 0.4)), (son, (-0.42, 0.1, 0.3))]}}
    S['parmak'] = {t: [[1, 0.15], [16, 0.05], [18, 0.55], [40, 0.55], [46, 0.1], [62, 0.5], [100, 0.5], [112, 0.12], [126, 0.0], [son, 0.0]] for t in 'LR'}   # sonda 0: yaz'ın kendi parmakları
    S['bak'] = {'agirlik': [[1, 0], [6, 0.7], [46, 0.6], [56, 0], [son, 0]], 'yer': [(1, tuple(kolcak(18, -1))), (46, tuple(kolcak(46, -1))), (son, tuple(kolcak(46, -1)))]}
    meta = {'z': [[f, round(anahtar(Z, f), 1)] for f in range(TAKE - 2, LAND + 3)], 'sicrama': [TAKE, LAND], 'oturdu': LAND + 4, 'masada': son, 'koltuk': -7.5,
            'koltuk_yol': [[f, mm(Cp(f))[:2], round(Cr(f), 2)] for f in range(1, son + 1, 2)] + [[son, mm(Cp(son))[:2], round(Cr(son), 2)]],
            'koltuk_tut': {'L': [18, 40], 'iki_el': [62, 100]},
            'govde_yol': [[f, mm(Gp(f))[:2], round(Gy(f), 1)] for f in range(1, son + 1, 4)] + [[son, mm(Gp(son))[:2], round(Gy(son), 1)]],
            'baslangic_govde_mm': mm(B0.to_3d())[:2], 'sandalye_bas_mm': mm(C0.to_3d())[:2], 'oda': {'chair': O['CHAIR'], 'masa_kok': masa}}
    return S, son, meta, CM, (Cp, Cr, Gp, Gy)


def v83_masa():
    S, son, meta, CM, _ = masa_otur_S()
    act = kol_coz('masa_otur', son, S, {'L': [(18, 40), (62, 100)], 'R': [(62, 100)]})
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': False, **meta,
        'not': 'v8.3: kök klip boyunca masa durağında (YER.masa, bakış masaya); gövde klibin içinde hareket eder: sandalyenin sağında '
               '(baslangic_govde_mm, karakter yereli: +x sol, −y ileri) başlar. Sitenin yapacağı: kökü masa durağına koy, Biggie\'yi '
               'yürüyüşle baslangic_govde_mm\'ye getir (kökü orada başlatıp gövde kaymasını köke aktarmak da olur), klibi oynat. '
               'Sandalye koltuk_yol\'u izler ([kare, [x, y] mm, rz derece], karakter yereli; rz + sola döner, 0 = önü masaya). '
               'z: kökün yükselişi (sıçrayış; otur\'daki gibi). Son poz = yaz 1. karesi (z 335, koltuk −7,5).'}, ensure_ascii=False)
    # kalkış: sandalyeyle döner (−90°), sandalyeyi orada bırakır, kolçaklara dayanıp iner, döner, yanında durur
    kalk = masa_kalk(act, son, meta)
    OLCUM_V83['masa'] = {'koltuk_yol_bas': meta['koltuk_yol'][0], 'koltuk_yol_son': meta['koltuk_yol'][-1]}
    return [act, kalk]


def masa_kalk(otur, son_o, meta_o):
    """masa_otur'un tersi (son → 46) + sandalye yerinde kalır: el kolçaktan çekilir, gövde başlangıç pozuna döner"""
    G0 = 46; N = son_o - G0 + 1; ek = 14; son = N + ek
    F = fcmap(otur); seri = {}
    durma = taban_degerleri()
    bas_poz = {k: c.evaluate(1) for k, c in F.items()}       # otur'un 1. karesi: yanında ayakta
    for k, c in F.items():
        v = [c.evaluate(son_o - (g - 1)) for g in range(1, N + 1)]
        a, b = v[-1], bas_poz[k]
        for g in range(1, ek + 1):
            w = g / ek; w = w * w * (3 - 2 * w); v.append(a + (b - a) * w)
        seri[k] = v
    act = yeni_aksiyon('Hareket - masa_kalk'); yaz(act, seri, list(range(1, son + 1))); act.frame_range = (1, son)
    g = lambda f: son_o - (f - 1)
    ky = [[f, p, r] for f, p, r in meta_o['koltuk_yol'] if f >= G0]
    kalk_kol = [[son_o - f + 1, p, r] for f, p, r in reversed(ky)]
    kalk_kol += [[son, kalk_kol[-1][1], kalk_kol[-1][2]]]
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': False, 'z': [[son_o - f + 1, z] for f, z in reversed(meta_o['z'])],
        'kalkmaya_basla': son_o - meta_o['sicrama'][1] + 1, 'ayakta': son_o - meta_o['sicrama'][0] + 1, 'koltuk_yol': kalk_kol, 'koltuk': -7.5,
        'bitis_govde_mm': meta_o['baslangic_govde_mm'],
        'not': 'v8.3: yaz pozundan (z 335) sandalyeyle döner, sandalyeyi orada (koltuk_yol\'un son yeri, çekilmiş ve dönük) bırakır, '
               'kolçaklara dayanıp iner (z 335 → 0), döner, sandalyenin yanında ayakta biter (bitis_govde_mm; kök masa durağında). '
               'Site sandalyeyi bir sonraki oturuşa dek orada bırakır (masa_otur onu oradan alırsa koltuk_yol\'un başı farklı olur).'}, ensure_ascii=False)
    return act
