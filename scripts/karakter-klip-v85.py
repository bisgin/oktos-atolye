# Biggie v8.5 klipleri (2026-11-05, kullanıcının canlı v8.4 geri bildirimi; meta: oktos-dijital-site/senaryo/klip-meta-v5.md "v8.5"):
#   bilek   "Sağ kol hâlâ kopuk": ağırlık sorunu (scripts/karakter-rig-v85.py bilek_v85); burada yalnız ölçü (bilek_olc_v85).
#   fare    "Başlarda havayı tutuyor": klavyeden fareye geçişte el 8–20. kareler açık avuçla havada süzülüyordu (kavrayış
#           22. karede); oda yaz'dan 0,45 sn harmanlıyor. Yeni: el kavrayış biçimini havada alır, 12. karede farede.
#   elma    "Buzdolabının içine giriyor": buzdolabının gerçek gövdesi (OLCU.FRIDGE: duvarlar, raf, tavan) ile kesişim ölçülür
#           (bz_govde_olc); gövde ve baş açıklığın dışında, kol ve el yalnız boşlukta.
#   kutu    Sol el rafın üstünde destek, sağ el kutuyu gözünden kavrar; kutu ele bağlı (el soketi) ve rijit: önce gözden
#           yatay çıkar, sonra kalkar, sonra rafın üstüne konur; her kutu için ayrı al / bırak klibi (gerçek yerinden).
# Girdi: karakter-klip-eylem.py, -v82, -v83, -v84 exec edilmiş (v84'ten sonra exec edilir). Çıktı: OLCUM_V85 ve klipler.
import bpy, json, math, os
import numpy as np
from mathutils import Vector, Matrix, Quaternion

OLCUM_V85 = {}


# ---------------------------------------------------------------------------------------------------------------------
# Buzdolabı gövdesi (core/oda-olcu.js FRIDGE; model scripts/oda-blender.py buzdolabi_kur): gövdenin yerelinde (mm) önü −x,
# menteşe (−d/2, +w/2). Karakter yereline: menteşe BZ['menteşe']'de, buzdolabının önü karaktere (+y) bakar, gövde
# menteşeden karakterin sağına (−x) uzanır: xc = (yf − w/2) + Mx, yc = −(xf + d/2) + My.
def bz_kutulari():
    F = olcu_oku()['FRIDGE']; d, w, h, raf, taban = F['d'], F['w'], F['h'], F['shelf'], F['floor']
    ic_x1 = -12 + (d - 18) / 2; ic_y = w / 2 - 20; ic_z1 = h - 35   # oyuk: ön açık, yanlar 20, arka ~21, tavan 35 (oda-blender.py)
    kutular = {   # (xf0, xf1, yf0, yf1, z0, z1)
        'tavan': (-d / 2, d / 2, -w / 2, w / 2, ic_z1, h),
        'taban': (-d / 2, d / 2, -w / 2, w / 2, 20, taban),
        'yan_mentese': (-d / 2, d / 2, ic_y, w / 2, 20, h),
        'yan_karsi': (-d / 2, d / 2, -w / 2, -ic_y, 20, h),
        'arka': (ic_x1, d / 2, -w / 2, w / 2, 20, h),
        'raf': (-d / 2 + 15, d / 2 - 45, -(w - 44) / 2, (w - 44) / 2, raf - 14, raf),
    }
    M = -BZV6['B0'] * MM   # v6 duruşu (buzdolabi() BZ['menteşe']'yi buna kurar)
    out = {}
    for k, (x0, x1, y0, y1, z0, z1) in kutulari_items(kutular):
        a = [(y0 - w / 2) + M.x, (y1 - w / 2) + M.x]; b = [-(x1 + d / 2) + M.y, -(x0 + d / 2) + M.y]
        out[k] = (min(a), max(a), min(b), max(b), z0, z1)
    acik = {'x': ((-ic_y - w / 2) + M.x, (ic_y - w / 2) + M.x), 'y': -(-d / 2 + d / 2) + M.y, 'z': (taban, ic_z1)}
    return out, acik


def kutulari_items(k): return list(k.items())


def kutu_derinlik(P, k):
    """P (n×3, mm) için eksen hizalı kutuya giriş derinliği (mm; dışarıdaysa 0)"""
    x0, x1, y0, y1, z0, z1 = k
    d = np.minimum.reduce([P[:, 0] - x0, x1 - P[:, 0], P[:, 1] - y0, y1 - P[:, 1], P[:, 2] - z0, z1 - P[:, 2]])
    return np.maximum(d, 0)


def bz_govde_olc(act, son, adim=1, kareler=None, ayrinti=False):
    """her karede: buzdolabının katı gövdesine (duvar, tavan, taban, raf) giriş (gövde/baş, kol, el; mm) ve gövdenin/başın
    açıklıktan içeri (boşluğa) girişi (mm). Kapak (açık kapağın hacmi) ayrıca: kapak_uzak_np."""
    K, A = bz_kutulari()
    gr = {'govde': BZ_GOVDE_AG, 'kol': ('kazak',), 'el': BZ_EL_AG}
    out = {g: {'en_derin_mm': 0.0, 'kare': None, 'kutu': None} for g in gr}
    out['govde_bosluk'] = {'en_derin_mm': 0.0, 'kare': None}
    kare_listesi = kareler or range(1, son + 1, adim)
    per = {}
    for f in kare_listesi:
        kare_ayarla(act, f); N = ag_dizi(set(BZ_GOVDE_AG) | set(BZ_EL_AG))
        for g, adlar in gr.items():
            Ps = []
            for ad in adlar:
                P = N[ad]
                if ad == 'kazak': P = P[kol_mu(P)] if g == 'kol' else P[~kol_mu(P)]
                Ps.append(P)
            P = np.vstack(Ps) * MM
            for kn, k in K.items():
                dd = kutu_derinlik(P, k); m = float(dd.max()) if len(dd) else 0.0
                if m > out[g]['en_derin_mm']: out[g].update(en_derin_mm=round(m, 1), kare=f, kutu=kn)
                if ayrinti and m > 0.5: per.setdefault(f, {})[g + ':' + kn] = round(m, 1)
            if g == 'govde':   # gövde ve baş açıklıktan içeri girmesin (boşluk x ve z aralığında, açıklık düzleminin ötesi)
                ic = (P[:, 0] > A['x'][0]) & (P[:, 0] < A['x'][1]) & (P[:, 2] > A['z'][0]) & (P[:, 2] < A['z'][1])
                dd = np.where(ic, A['y'] - P[:, 1], 0); m = float(max(0.0, dd.max()))
                if m > out['govde_bosluk']['en_derin_mm']: out['govde_bosluk'].update(en_derin_mm=round(m, 1), kare=f)
                if ayrinti and m > 0.5: per.setdefault(f, {})['govde:bosluk'] = round(m, 1)
    if ayrinti: out['kareler'] = per
    return out


# ---------------------------------------------------------------------------------------------------------------------
# Buzdolabı klipleri (v8.5): v6'nın kurgusu (sol el kolu çeker, kapak yayın dışında açılır, yan adım, elma, sol el kapağı
# iç yüzünden kapatır, geri adım) aynı; değişen uzanış: v6'da kök açıklığa 160 mm kalana dek yaklaşıyor, gövde öne eğilip
# çömeliyordu: göbek açıklıktan 78 mm, baş 200 mm içeri giriyor, kol tavanın ön kenarından, sol ayak tabandan geçiyordu
# (bz_govde_olc). Kök artık göbeğin önü açıklığın dışında kalacak kadar geride (göbek kökün ~225 mm önü); Biggie dizlerini
# kırıp alçalır, gövde dik kalır, sağ kol açıklığın içinden elmaya uzanır. Elma ön kenara yakın (BZ85['elma']: ön yüzün
# 100 mm içi; odanın elmaları raf ortasındaydı, el oraya gövde girmeden yetişmez: oda tarafı not "v8.5 — klip tarafı").
BZ85 = {'IN': Vector((-360, 240, 0)) * U,     # uzanırken kök (menteşeye göre; v6 (−440, 160)): sol yanı açık kapağın raflarından uzak
        'elma': Vector((-300, -65, 0)) * U,  # elmanın merkezi (menteşeye göre, raf + yarıçap yükseklikte; v6 (−355, −150))
        'cok': 280 * U, 'geri': 30 * U, 'egil': 0.0, 'kafa_geri': 6,
        'burgu': 16.0}                         # uzanırken omurga ve göğsün sola dönüşü (derece, ikisine yarı yarıya)


def buzdolabi(ad, bos):
    son = 124
    TUT, BIRAK_K, IT0, IT1 = 8, 16, 76, 84
    ac = [[1, 0], [TUT, 0], [BIRAK_K, 0.42], [30, 1.82], [36, 1.75], [IT0, 1.75], [IT1, 1.5], [IT1 + 8, 1.4], [IT1 + 14, 1.12], [IT1 + 20, 0.62],
          [IT1 + 25, 0.18], [IT1 + 27, 0], [IT1 + 30, 0.03], [IT1 + 33, 0], [son, 0]]
    K = lambda f: anahtar(ac, f)
    M_eski = Vector((315 * U, -330 * U, 0))
    BZ['menteşe'] = -BZV6['B0']
    M = BZ['menteşe']
    IN = BZ85['IN'] - BZV6['B0']
    kol = BZ['en'] - 27 * U
    elma = M + BZ85['elma'] + Vector((0, 0, BZ['raf'] + 38 * U))
    O = Vector()
    kolp = lambda f: kapak_noktasi(K(f), kol, BZ['kol_z'], 45 * U)
    kolyon = lambda f: (tuple(Vector((-math.cos(K(f)), math.sin(K(f)), 0)) + Vector((0, 0, -0.15))), tuple(-Vector((math.sin(K(f)), math.cos(K(f)), 0))))
    a2, k2 = adimlar(36, O, IN, 'LR', boy=9, kalca_ek=((0, 0, -0.01), (0, 0, 0)))
    a3, k3 = adimlar(IT1 - 1, IN, O, 'RL', boy=7, kalca_ek=((0.004, 0.065, -0.01), (0, 0, -0.01)))   # v8.5: geri adım kalça gerideyken başlar
    cok, geri = BZ85['cok'], BZ85['geri']
    # v8.5: uzanış dizlerden (kalça iner ve biraz geri), gövde dik; elma alınınca doğrulur
    kalca = birlestir([(1, (0, 0, 0)), (5, (0.006, 0.006, -0.02)), (TUT, (0.012, 0.008, -0.03)), (BIRAK_K, (0.0, 0.03, -0.02)), (24, (0, 0.01, -0.005)), (32, (0, 0, 0))],
                      k2, [(50, tuple(IN + Vector((0, geri * 0.3, -cok * 0.3)))), (55, tuple(IN + Vector((-0.004, geri, -cok * 0.92)))), (64, tuple(IN + Vector((-0.005, geri, -cok)))),
                           (70, tuple(IN + Vector((0, geri * 0.5, -cok * 0.45)))), (IT0, tuple(IN + Vector((0.008, 0.05, -0.01)))), (IT1 - 1, tuple(IN + Vector((0.004, 0.065, -0.01))))],
                      k3, [(IT1 + 18, (0, 0, -0.004)), (son, (0, 0, 0))])
    S = {'nefes': 0.9, 'kalca': kalca,
         'ayak': {t: birlestir([(1, (0, 0, 0)), (35, (0, 0, 0))], a2[t], [(70, tuple(IN)), (IT1 - 1, tuple(IN))], a3[t], [(son, (0, 0, 0))]) for t in 'LR'}}
    govde = lambda f: Vector((vanahtar(kalca, f).x, vanahtar(kalca, f).y, 0))
    sark = lambda t, f: tuple(Vector((0.2 if t == 'L' else -0.2, -0.07, 0.38)) + govde(f))
    tutL = lambda f: tuple(Vector((0.11, -0.1, 0.42)) + govde(f))
    TUTL_YON = ((0.2, -1, -0.3), (-0.6, 0, -0.8))
    e = BZ85['egil']   # v8.5: uzanırken gövde eğilmesi v6'nın bu oranı (baş açıklığın dışında)
    X_ = [[1, 0], [6, 10], [TUT, 12], [12, 2], [BIRAK_K, -6], [22, -2], [30, 0], [46, 2], [54, 22 * e], [60, 34 * e], [66, 30 * e], [72, 6], [IT0, 8], [IT1, 2], [IT1 + 8, -2], [108, 0], [son, 0]]
    tw = BZ85['burgu']   # v8.5: uzanırken gövde sola döner (sağ omuz öne: kol açıklığa yetişir, göbek geri kalır)
    Z_ = [[1, 0], [6, 10], [TUT, 14], [BIRAK_K, 8], [26, 0], [52, 6 + tw * 0.5], [58, 8 + tw], [66, 8 + tw], [72, 6], [IT0, 18], [IT1, 14], [IT1 + 10, 4], [110, 0], [son, 0]]
    S['don'] = {'omurga': {'X': [[f, d * 0.6] for f, d in X_], 'Z': [[f, d * 0.5] for f, d in Z_],
                           'Y': [[1, 0], [TUT, 3], [20, 0], [52, 0], [60, -6], [66, -4], [74, 0]]},
                'göğüs': {'X': [[f, d * 0.4] for f, d in X_], 'Z': [[f, d * 0.5] for f, d in Z_]},
                'kafa': {'X': [[1, 0], [6, 8], [TUT, 6], [20, -4], [28, 0], [56, BZ85['kafa_geri']], [64, BZ85['kafa_geri']], [72, 0], [son, 0]]}}
    itp = lambda f: kapak_noktasi(K(f), 300 * U, 0.43, -25 * U)
    ityon = lambda f: ((0, -0.3, 1), tuple(Vector((math.sin(K(f)), math.cos(K(f)), 0))))
    S['bak'] = {'agirlik': [[1, 0], [4, 0.8], [50, 0.8], [58, 0.45], [66, 0.45], [72, 0.8], [IT1 + 14, 0.8], [118, 0]],
                'yer': [(1, tuple(kolp(TUT))), (TUT, tuple(kolp(TUT))), (24, tuple(kapak_noktasi(1.2, 0.25, 0.45))), (44, tuple(elma)), (64, tuple(elma)),
                        (70, tuple(elma + Vector((0, 0.2, 0.1))) if not bos else tuple(elma)), (IT0, tuple(itp(IT0))), (IT1 + 6, tuple(kapak_noktasi(0.9, 0.3, 0.45))),
                        (IT1 + 20, tuple(kapak_noktasi(0, 0.25, 0.45))), (son, (0, -1.0, 0.7))]}
    L_yer = [(1, sark('L', 1)), (5, tuple(kolp(TUT) + Vector((0.03, 0.05, 0.0))))] + [(f, tuple(kolp(f))) for f in range(TUT, BIRAK_K + 1)] + \
            [(BIRAK_K + 4, tutL(BIRAK_K + 4)), (32, tutL(32))]
    L_yon = [(1, SARK['L'])] + [(f, kolyon(f)) for f in range(5, BIRAK_K + 1, 2)] + [(BIRAK_K + 5, TUTL_YON)]
    L_ik = [[1, 0], [3, 1], [son - 8, 1], [son, 0]]
    # v8.5: çömelirken sol el göğsün sol önünde, gövdeyle iner (karnın önünde açıklığa uzanıyordu)
    gogusL = lambda f: tuple(Vector((0.09, -0.11, 0.47)) + Vector(vanahtar(kalca, f)))
    L_yer += [(40, tutL(40))] + [(f, gogusL(f)) for f in range(50, 71, 4)]
    L_yon += [(50, TUTL_YON), (70, TUTL_YON)]
    L_yer += [(72, tuple(itp(IT0) + Vector((-0.04, -0.03, 0))))] + [(f, tuple(itp(f))) for f in range(IT0, IT1 + 1)] + \
             [(IT1 + 5, tutL(IT1 + 5)), (son - 12, tutL(son - 12)), (son - 2, sark('L', son - 2)), (son, sark('L', son))]
    L_yon += [(f, ityon(f)) for f in range(72, IT1 + 1, 2)] + [(IT1 + 5, TUTL_YON), (son - 12, TUTL_YON), (son - 2, SARK['L'])]
    S['parmak'] = {'L': [[1, 0.15], [5, 0.05], [TUT, 0.8], [BIRAK_K, 0.8], [BIRAK_K + 3, 0.35], [68, 0.35], [74, 0.0], [IT1, 0.0], [IT1 + 6, 0.35], [son - 8, 0.35], [son, 0.15]], 'R': [[1, 0.15]]}
    S['basparmak'] = {'L': [[1, 0], [TUT, 0.6], [BIRAK_K, 0.6], [BIRAK_K + 3, 0]]}
    R_yer = [(1, sark('R', 1)), (40, sark('R', 40))]
    R_yon = [(1, SARK['R']), (40, SARK['R'])]
    R_ik = [[1, 0], [42, 0]]
    hold = Vector(ELMA_ALT)
    acik_y = M.y   # açıklık düzlemi (kapalı kapağın iç yüzü)
    # el açıklığın önünde elmanın hizasına gelir, düz içeri uzanır, alır (boşsa rafı yoklar), aynı yoldan çıkar (raf ve tavan dışında)
    on = Vector((elma.x, acik_y + 0.06, elma.z + 0.03))
    R_yer += [(48, tuple(Vector((elma.x - 0.02, acik_y + 0.16, elma.z + 0.12)))), (54, tuple(on)), (58, tuple(elma + Vector((0, 0.035, 0.02)))), (62, tuple(elma)),
              (64, tuple(elma + Vector((0, 0.005, 0.012)))), (68, tuple(Vector((elma.x, acik_y + 0.04, elma.z + 0.03)))),
              (72, tuple(Vector((elma.x + 0.01, acik_y + 0.14, elma.z + 0.08))))]
    R_yon += [(48, ((0.1, -1, -0.2), (0, -0.3, -1))), (56, ((0.05, -1, -0.15), (0, -0.2, -1))), (66, ((0.05, -1, -0.1), (0, -0.2, -1)))]
    R_dirsek = [(1, (-0.45, 0.1, 0.32)), (48, tuple(Vector((-0.25, 0.1, 0.25)) + govde(48))), (60, tuple(Vector((-0.17, 0.05, 0.25 - cok * 0.8)) + govde(60))),
                (70, tuple(Vector((-0.3, 0.05, 0.25)) + govde(70)))]
    if not bos:
        R_yer += [(f, tuple(hold + govde(f))) for f in range(78, son + 1, 3)] + [(son, tuple(hold))]
        R_yon += [(78, ELMA_TUT), (son, ELMA_TUT)]
        R_ik += [[48, 1], [son, 1]]
        S['parmak']['R'] += [[54, 0.1], [56, 0.05], [61, 0.05], [64, ELMA_KIVRIM[0]], [son, ELMA_KIVRIM[0]]]
        S['basparmak']['R'] = [[1, 0], [56, 0], [61, 0], [64, ELMA_KIVRIM[1]], [son, ELMA_KIVRIM[1]]]
        S['elma'] = {'g0': [[1, 0], [63, 1]]}
        R_dirsek += [(78, tuple(Vector(DIRSEK_TUT['R']) + govde(78))), (son, DIRSEK_TUT['R'])]
    else:   # boş raf: el rafı yoklar, boş çıkar, omuz silker
        R_yer += [(80, sark('R', 80)), (son, sark('R', son))]
        R_yon += [(80, SARK['R'])]
        R_ik += [[48, 1], [son - 8, 1], [son, 0]]
        S['parmak']['R'] += [[54, 0.1], [58, 0.05], [64, 0.25], [70, 0.1], [son, 0.15]]
        S['don']['omuz.L'] = {'Y': [[70, 0], [74, -16], [76, -13], [78, -14], [84, 0]]}
        S['don']['omuz.R'] = {'Y': [[70, 0], [74, 16], [76, 13], [78, 14], [84, 0]]}
        S['don']['kafa']['Y'] = [[66, 0], [70, -9], [76, -8], [82, 0]]
        S['agiz'] = [[64, 0], [70, 0.25], [78, 0.25], [84, 0]]
        R_dirsek += [(84, (-0.45, 0.1, 0.32)), (son, (-0.45, 0.1, 0.32))]
    S['el'] = {'R': {'ik': R_ik, 'yer': R_yer, 'yon': R_yon, 'nokta': ELMA_EL, 'dirsek': R_dirsek},
               'L': {'ik': L_ik, 'yer': L_yer, 'yon': L_yon,
                     'dirsek': [(1, (0.45, 0.1, 0.3)), (TUT, (0.5, 0.1, 0.25)), (BIRAK_K + 4, (0.3, 0.18, 0.3)), (44, tuple(Vector((0.17, 0.15, 0.3)) + IN)), (68, tuple(Vector((0.17, 0.15, 0.25)) + IN)),   # v8.5: dirsek açık kapağın raflarından uzak
                                
                                (IT0, tuple(Vector((0.5, 0.15, 0.3)) + IN)), (IT1, tuple(Vector((0.45, 0.15, 0.3)) + IN)), (IT1 + 6, tuple(Vector((0.3, 0.18, 0.3)) + govde(IT1 + 6))),
                                (son - 10, (0.3, 0.18, 0.3)), (son, (0.45, 0.1, 0.3))]}}
    # kol_coz'un önkol–gövde düzeltmesi (onkol_giris bu iri gövdede yanlış alarm verir: CLAUDE.md gotcha) uzanış boyunca kapalı
    temas = {'L': [(TUT, BIRAK_K), (40, 72), (IT0, IT1)], 'R': [(46, 86)]}
    act = kol_coz(ad, son, S, temas)
    kes = bz_kesisim(act, K, son, ayir=lambda ad, P: ~kol_mu(P) if ad == 'kazak' else slice(None))
    kes_kol = bz_kesisim(act, K, son, ('kazak',), ayir=lambda ad, P: kol_mu(P))
    kes_el = bz_kesisim(act, K, son, BZ_EL_AG)
    govde_olc = bz_govde_olc(act, son)
    meta = {'sure': round(son / 30, 2), 'kapak': [[f, -round(K(f), 4)] for f in range(1, son + 1)],
            'kapak_basla': TUT, 'kapak_kapan_basla': IT0,
            'mentese': mm(M), 'kapak_en': 500, 'kol': {'el': 'L', 'tut': [TUT, BIRAK_K], 'nokta': mm(kolp(TUT))},
            'itme': {'el': 'L', 'tut': [IT0, IT1]}, 'yaklas': [36, 53], 'don': [[IT1 - 1, IT1 + 13]], 'yaklas_kok_mm': mm(IN),
            'durus_ofset_mm': mm(M_eski - M),
            'kesisim': {'govde_kose': kes['en_cok_kose'], 'kare': kes['kesisim_kare'][:20], 'en_yakin_mm': kes['en_yakin_mm']},
            'govde_kesisim': govde_olc,
            'not': 'v8.5: kök kapağın süpürme yayının dışında (menteşeye %d mm); uzanırken gövde açıklığın dışında, dizlerini kırıp '
                   'alçalır, sağ kol açıklıktan elmaya uzanır. govde_kesisim: buzdolabının katı gövdesine (OLCU.FRIDGE duvarları, '
                   'tavan, taban, raf) gövde/kol/el girişi ve gövdenin açıklıktan içeri girişi (mm, 0 olmalı). kapak: her kare '
                   'kapağın rotation.z farkı (rad; − açılır). Kolu sol el çeker (kol.tut), sol el kapağı iç yüzünden kapatır (itme.tut).' % round(M.length * MM)}
    meta['hata_mm'] = {'kol': el_hatasi(act, S, 'L', TUT, BIRAK_K), 'itme': el_hatasi(act, S, 'L', IT0, IT1)}
    if not bos:
        meta['al'] = 62
        F = olcu_oku()['FRIDGE']; Mm = M * MM; e_ = elma * MM
        meta['elma'] = {'nokta': mm(elma), 'ic_mm': round(acik_y * MM - e_.y), **(ELMA_META or {}), 'kemik_adim': {'g0': 63},
                        'buzdolabi_yerel_mm': [round(-(e_.y - Mm.y) - F['d'] / 2, 1), round(e_.x - Mm.x + F['w'] / 2, 1), round(e_.z - 40, 1)],
                        'buzdolabi_yerel_not': 'v8.5: elmanın buzdolabı gövdesinin yerelindeki yeri (core/oda-sahne.js buz_elma ile aynı çerçeve: '
                                               'x önü −, y menteşe tarafı +, z elmanın tabanı = raf üstü). Odanın ilk elması buraya konmalı.'}
        meta['hata_mm']['elma'] = el_hatasi(act, S, 'R', 60, 64); meta['hata_mm']['yaklas'] = el_hatasi(act, S, 'R', 54, 60)
    else:
        meta['silk'] = [70, 84]
    act['site_meta'] = json.dumps(meta, ensure_ascii=False)
    OLCUM_V85.setdefault('buzdolabi', {})[ad] = {'govde_kesisim': govde_olc, 'kapak_govde': kes['en_cok_kose'], 'kapak_kol': kes_kol['en_cok_kose'],
                                                 'kapak_el': kes_el['en_cok_kose'], 'hata_mm': meta['hata_mm'], 'IN_mm': mm(BZ85['IN']), 'elma_mm': mm(BZ85['elma'])}
    print('BUZ85', ad, json.dumps(OLCUM_V85['buzdolabi'][ad], ensure_ascii=False))
    return act


# ---------------------------------------------------------------------------------------------------------------------
# Fare (v8.5, kullanıcı: "fareyi çok sonradan düzgünce kavramaya başladı, başlarda yine havayı tutuyor"). Kök neden (ölçüldü,
# v8.4 klibi): el klavyeden kalkıp 8–16. karelerde açık, düz avuçla (parmak kıvrımı 0,05) farenin 40–70 mm üstünde süzülüyor,
# kavrayış biçimi (kök açıklığı, kıvrım, başparmak) 18–22'de geliyor, avuç 22. karede sırta oturuyordu; oda yaz'dan fareye
# 0,45 sn harmanladığı için kavrayış ~0,9 sn sonra görünüyordu. Yeni: el 4–9. karelerde alçak bir yayla (en çok 25 mm) fareye
# gider, kavrayış biçimini HAVADA alır (8. karede kıvrımlar ve başparmak hazır), 12. karede avuç sırtta; dönüşte aynı yol
# tersten (130 → 140 klavyede). Meta 'giris_solma_sn' (0,15): odanın yaz → fare harmanı bunu aşmamalı.
FARE85 = {'TUT0': 12, 'TUT1': 130, 'KLAVYE': 140, 'yay_mm': 25, 'giris_solma_sn': 0.15}
_fare_S_v84 = fare_S


def fare_S(son, Cf, tut=(1, None), egil=None, sabit=False):
    if sabit: return _fare_S_v84(son, Cf, tut, egil, sabit)
    S = {'taban_akt': (KLAVYE, 1), 'bacak_fk': True, 'nefes': 0.6, 'canli': 0.35, 'nefes_uc': True}
    L = FARE_PAR['egil'] if egil is None else egil
    TUT0, TUT1 = tut; KL = FARE85['KLAVYE']; yay = FARE85['yay_mm'] * U
    a0 = klip_kur('_fare0', 3, dict(S, el={})); kare_ayarla(a0, 1); P0 = tuple(el_noktasi('R', AVUC_NOKTA)); _, Y0 = el_poz(a0, 1, 'R')
    bpy.data.actions.remove(a0)
    H = {f: fare_hedef(fare_M(Cf(f))) for f in range(1, son + 1)}
    ust = lambda f, dz, dy=0.0: tuple(Vector(H[f][0]) + Vector((0, dy * U, dz * U)))
    orta = lambda f, w, dz: tuple(Vector(P0).lerp(Vector(H[f][0]), w) + Vector((0, 0, dz)))
    # gidiş: klavyeden alçak yayla (tepe 6. kare), 9'da farenin 12 mm üstünde (kavrayış biçimi hazır), 12'de sırtta
    yer = [(1, P0), (3, orta(TUT0, 0.12, yay * 0.6)), (6, orta(TUT0, 0.55, yay)), (9, ust(TUT0, 12, 4)), (TUT0, tuple(H[TUT0][0]))]
    yer += [(f, tuple(H[f][0])) for f in range(TUT0 + 2, TUT1, 2)] + [(TUT1, tuple(H[TUT1][0])), (TUT1 + 3, ust(TUT1, 12, 4)),
            (TUT1 + 6, orta(TUT1, 0.55, yay)), (KL - 1, orta(TUT1, 0.1, yay * 0.4)), (KL, P0), (son, P0)]
    yon = [(1, Y0), (3, Y0), (8, H[TUT0][1])] + [(f, H[f][1]) for f in range(TUT0, TUT1 + 1, 2)] + [(TUT1 + 2, H[TUT1][1]), (KL - 3, Y0), (son, Y0)]
    S['el'] = {'R': {'ik': [[1, 0], [3, 1], [KL + 4, 1], [son, 0]], 'nokta': AVUC_NOKTA, 'yer': yer, 'yon': yon,
                     'dirsek': [(1, (-0.3, 0.05, 0.35)), (TUT0, FARE_PAR['dirsek']), (TUT1, FARE_PAR['dirsek']), (KL, (-0.3, 0.05, 0.35)), (son, (-0.3, 0.05, 0.35))]}}
    # parmaklar yazma kıvrımından doğrudan kavrayışa (düz açık avuç yok): 8. karede hazır, 12'den sonra sabit
    S['parmak'] = {'R': [[1, 0.2], [8, 0.0], [TUT1, 0.0], [KL, 0.2], [son, 0.2]]}
    S['parmak_tek'] = {'R': {i: [[1, 0.2], [8, c], [TUT1 + 2, c], [KL, 0.2], [son, 0.2]] for i, c in FARE_PAR['kivrim'].items()}}
    e = FARE_PAR['kok_ac']
    S['parmak_ek'] = {'R': {i: [[1, 0], [8, e], [TUT1 + 2, e], [KL, 0], [son, 0]] for i in (1, 2, 3, 4)}}
    b = FARE_PAR['bas']
    S['basparmak'] = {'R': [[1, 0.1], [5, 0.0], [9, b], [TUT1 + 1, b], [TUT1 + 5, 0.0], [KL, 0.1], [son, 0.1]]}
    S['don'] = {'omurga': {'Z': [[1, 0], [TUT0, -3], [TUT1, -3], [son, 0]], 'X': [[1, 0], [TUT0, L], [TUT1, L], [KL, 0], [son, 0]]},
                'göğüs': {'X': [[1, 0], [TUT0, 0.5 * L], [TUT1, 0.5 * L], [KL, 0], [son, 0]]},
                'omuz.R': {'Y': [[1, 0], [TUT0, 4], [TUT1, 4], [KL, 0], [son, 0]]}}
    return S


def v82_fare():
    """v8.5 fare (adı kaynak-kur'un çağrısı için aynı): v8.4 tutuşu, hızlı ve kavrayış biçimli giriş/çıkış"""
    global AVUC_NOKTA
    AVUC_NOKTA = avuc_temas()
    D = fare_bvh(); F = D['F']; k = F['olcek']
    FARE['olcu'] = (round(D['en'] * k), round(D['boy'] * k), round(D['yuk'] * k))
    FARE['merkez'] = fare_merkez()
    son = 151; TUT0, TUT1 = FARE85['TUT0'], FARE85['TUT1']
    C0 = FARE['merkez']
    yol = [(1, (0, 0)), (TUT0 + 6, (0, 0)), (34, (10, 8)), (44, (-14, 14)), (52, (-16, 12)), (62, (20, -10)), (70, (32, -22)), (78, (30, -20)),
           (92, (-5, 18)), (104, (-8, 20)), (114, (6, 4)), (TUT1 - 6, (0, 0)), (son, (0, 0))]
    Cf = lambda f: C0 + Vector((*(Vector(vanahtar([(kk, (x * U, y * U, 0)) for kk, (x, y) in yol], f))[:2]), 0))
    _fare_ayarla(Cf)
    S = fare_S(son, Cf, tut=(TUT0, TUT1))
    tik = [54, 58, 80, 108]
    e = FARE_PAR['kok_ac']
    S['parmak_ek']['R'][1] = [[1, 0], [8, e]] + [kv for t_ in tik for kv in ([t_ - 2, e], [t_, e + 4], [t_ + 2, e])] + [[TUT1 + 2, e], [FARE85['KLAVYE'], 0], [son, 0]]
    S['bak'] = {'agirlik': [[1, 0], [6, 0.25], [24, 0], [son, 0]], 'yer': [(1, tuple(C0)), (son, tuple(C0))]}
    act = kol_coz('fare', son, S, {'R': [(TUT0 - 4, TUT1 + 4)]})
    Mf = lambda f: Matrix.Translation(Cf(f)) @ Matrix.Rotation(math.radians(FARE_YAW), 4, 'Z')
    t_, q_ = soket(act, 60, 'el.R', Mf(60))
    Lr = rig.pose.bones['el.R'].matrix.inverted() @ Mf(60); kay = 0.0
    for f in range(TUT0, TUT1 + 1, 2):
        kare_ayarla(act, f); kay = max(kay, ((rig.pose.bones['el.R'].matrix @ Lr).translation - Cf(f)).length)
    kk = [f for f in range(TUT0, TUT1 + 1, 6) if all(abs(f - t_) > 2 for t_ in tik)] + [TUT1]
    olc = {f: fare_olc(act, f, fare_M(Cf(f))) for f in kk}
    bl = {f: bilek_olc(act, f) for f in kk}
    tik_olc = {f: fare_olc(act, f, fare_M(Cf(f)))['1'] for f in tik}
    # giriş ve çıkış kare kare (avuç ile fare arası, mm): ilk kavrayış karesi = avuç ≤ 2 mm ve parmaklar ≤ 3 mm
    gir = {f: fare_olc(act, f, fare_M(Cf(f))) for f in list(range(1, TUT0 + 3)) + list(range(TUT1 - 2, FARE85['KLAVYE'] + 2))}
    ilk = next((f for f in sorted(gir) if gir[f]['avuc'] <= 2 and max(gir[f][str(i)] for i in (1, 2)) <= 3), None)
    otur = {'avuc_mm': [min(o['avuc'] for o in olc.values()), max(o['avuc'] for o in olc.values())],
            'parmak_min_mm': min(min(o[str(i)] for i in (1, 2, 3, 4)) for o in olc.values()),
            'parmak_max_mm': max(max(o[str(i)] for i in (1, 2)) for o in olc.values()),
            'basparmak_mm': [min(o['bas'] for o in olc.values()), max(o['bas'] for o in olc.values())],
            'on_kenar_min_mm': min(o['on_kenar'] for o in olc.values()), 'bilek_z_mm': [min(o['bilek_z'] for o in olc.values()), max(o['bilek_z'] for o in olc.values())],
            'tik_isaret_mm': min(tik_olc.values())}
    giris = {'ilk_kavrayis_kare': ilk, 'yay_tepe_mm': FARE85['yay_mm'],
             'kare': {str(f): {'avuc': o['avuc'], 'p1': o['1'], 'p2': o['2'], 'bas': o['bas']} for f, o in gir.items()}}
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': True, 'dongu': [1, son], 'masa': True, 'z': 335, 'koltuk': -7.5, 'tut': [TUT0, TUT1], 'tik': tik,
        'klavye': [1, FARE85['KLAVYE']], 'giris_solma_sn': FARE85['giris_solma_sn'], 'ilk_kavrayis': ilk,
        'fare': {'kemik': 'el.R', 'el_yerel': t_, 'el_yerel_q': q_, 'nokta': 'farenin taban merkezi (masada)', 'olcu_mm': list(FARE['olcu']), 'yaw_derece': FARE_YAW,
                 'olcek_onerisi': k, 'masa_z_mm': round(C0.z * MM), 'merkez_mm': mm(C0), 'form': 'ergonomik_sag_v84', 'form_ayar': F,
                 'yol': [[f, mm(Cf(f))] for f in range(1, son + 1, 2)] + [[son, mm(Cf(son))]], 'el_kayma_mm': round(kay * MM, 1),
                 'oturus': otur, 'bilek': bilek_en_kotu(bl), 'giris': giris,
                 'not': 'v8.5: el klavyeden 12. karede farede (kavrayış biçimi 8. karede havada hazır, yay ≤ 25 mm), 130\'da kalkar, 140\'ta '
                        'klavyede. Biçim form_ayar = OLCU.MOUSE.form (olcek katı). Avuç sırtta, işaret (1) ve orta (2) tuşlarda, yüzük ve '
                        'serçe sağ yanda, başparmak sol oluğunda. tut aralığında fare el.R soketiyle (ya da yol + yaw_derece) gider.'},
        'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1),
        'not': 'v8.5: yaz (Klavye Tuşlama) 1. karesinden başlar ve ona döner. Oda yaz → fare harmanını giris_solma_sn (0,15 sn) '
               'ile yapmalı: 0,45 sn harmanda el ilk kareleri klavyeyle karışık geçiriyor, kavrayış geç okunuyordu.'}, ensure_ascii=False)
    OLCUM_V85['fare'] = {'el_kayma_mm': round(kay * MM, 1), 'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1), 'oturus': otur, 'bilek': bilek_en_kotu(bl), 'giris': giris}
    OLCUM_V84['fare'] = OLCUM_V85['fare']; OLCUM_V82['fare'] = {'el_kayma_mm': round(kay * MM, 1), 'hata_mm': OLCUM_V85['fare']['hata_mm']}
    print('FARE85', json.dumps({k_: OLCUM_V85['fare'][k_] for k_ in ('el_kayma_mm', 'hata_mm', 'oturus', 'bilek')}, ensure_ascii=False), 'ilk', ilk)
    return [act]


