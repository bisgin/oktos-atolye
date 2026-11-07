# Biggie v8.5 kutu oyunu klipleri (2026-11-05; kullanıcı kararı ve oda sözleşmesi: klip-meta-v5.md "v8.5 — oda tarafı" / "v8.5 — klip tarafı").
# Girdi: karakter-klip-eylem.py ... karakter-klip-v85.py exec edilmiş, POZ (seiza_ayarla) ve KUTU7 (kutu_al_diz) kurulmuş.
# Çıktı: kutu_uzan_al_k<no>, kutu_uzan_birak_k<no>, kutu_uzan_cevir_sag_k<no> / _sol_k<no>, kutu_uzan_bekle; OLCUM_V85['kutu'].
import bpy, json, math, os
from mathutils import Vector, Matrix, Quaternion

def _js_nesne(s, ad):
    """core/*.js içinden sabit nesne/dizi metni (basit: ilk eşleşen parantez dengesi)"""
    i = s.index(ad); j = min(k for k in (s.find('{', i), s.find('[', i)) if k >= 0); ac = s[j]; kap = '}' if ac == '{' else ']'; n = 0
    for k in range(j, len(s)):
        if s[k] == ac: n += 1
        elif s[k] == kap:
            n -= 1
            if not n: return s[j:k + 1]


def oyun_kutulari():
    """odadaki 8 kutu (tek kaynak core/oda-olcu.js OLCU.OYUN_KUTU; raf PORT.oyunRafi, KR): dünyada merkez (mm), boy
    (w: dünya y boyunca, d: x boyunca, h), tür, göz (0–2), gözün y aralığı; oyunlar durağı (core/oda-yerler.js)"""
    import re
    s = open(os.path.join(KOK, 'core', 'oda-portfolyo.js'), encoding='utf-8').read()
    kr = dict((k, float(v)) for k, v in re.findall(r"(\w+): ([\d.]+)", _js_nesne(s, 'const KR')))
    R = dict((k, float(v)) for k, v in re.findall(r"(\w+): (-?[\d.]+)", re.search(r"oyunRafi: \{[^}]*\}", s).group(0)))
    W, D, H, t, ara, GE = R['en'], R['derin'], R['boy'], kr['t'], kr['ara'], kr['goz']
    O = olcu_oku(); DS = O['ROOM']['x1'] - 15
    out = []
    for k in O['OYUN_KUTU']:
        g = k['goz'] - 1; x0 = -W / 2 + t + g * (GE + ara); x1 = x0 + GE
        out.append({'no': k['no'], 'goz': g, 'tur': k['tur'], 'olcu': tuple(k['olcu']), 'dunya': tuple(k['merkez']),
                    'goz_y': (-x1 + R['y'], -x0 + R['y']), 'on_x': DS - D, 'arka_x': DS, 'ust_z': H, 't': t, 'egik': 0.0})
    y = open(os.path.join(KOK, 'core', 'oda-yerler.js'), encoding='utf-8').read()
    m = re.search(r"\{ id: 'oyunlar', yer: \[([-\d.]+), ([-\d.]+)\], yon: ([-\d.]+)", y)
    durak = (float(m.group(1)), float(m.group(2)), float(m.group(3))) if m else None
    return out, durak, {'en': W, 'derin': D, 'boy': H, 't': t, 'ara': ara, 'goz': GE, 'y': R['y'], 'on_x': DS - D}

def _rot(ax, deg): return Matrix.Rotation(math.radians(deg), 4, ax)


def yol_M(yol, f):
    """rijit yolda f karesindeki dönüşüm: konum PCHIP (vanahtar), dönüş komşu anahtarlar arası slerp"""
    p = vanahtar([(k, tuple(M.translation)) for k, M in yol], f)
    ks = [k for k, _ in yol]
    if f <= ks[0]: q = yol[0][1].to_quaternion()
    elif f >= ks[-1]: q = yol[-1][1].to_quaternion()
    else:
        i = max(i for i, k in enumerate(ks) if k <= f); a, b = yol[i], yol[i + 1]
        u = (f - a[0]) / ((b[0] - a[0]) or 1); u = u * u * (3 - 2 * u)
        q = a[1].to_quaternion().slerp(b[1].to_quaternion(), u)
    return Matrix.Translation(Vector(p)) @ q.to_matrix().to_4x4()



def avuc_yuzu(t, ileri_mm=62.0):
    """avucun yüzündeki temas noktası (bileğe göre, dinlenme çerçevesi, armatür ekseni; avuc() biçimi): dinlenmede (T-poz)
    avuç −y'ye bakar; parmak ekseninde bilekten ileri_mm'deki avuç köşelerinin en −y olanı"""
    o = bpy.data.objects[('sol' if t == 'L' else 'sağ') + ' avuç']; inv = rig.matrix_world.inverted()
    e = REST['el.' + t].translation; ax = Vector((1 if t == 'L' else -1, 0, 0))
    P = [inv @ (o.matrix_world @ v.co) for v in o.data.vertices]
    S_ = [p for p in P if abs((p - e).dot(ax) - ileri_mm * U) < 8 * U and abs(p.z - e.z) < 22 * U]
    p = min(S_, key=lambda q: q.y)
    return tuple(p - e)


KUTU85_OLCU = {}

def kutu85_kutu_noktalari(Mk, G, n=7):
    """kutunun yüzey noktaları (karakter yereli): Mk kutunun dönüşümü (merkez), G ölçüler (mm)"""
    w, d, h = G['w'] * U / 2, G['d'] * U / 2, G['h'] * U / 2
    out = []
    ls = [-1 + 2 * i / (n - 1) for i in range(n)]
    for a in ls:
        for b in ls:
            for p in ((a * w, b * d, h), (a * w, b * d, -h), (a * w, d, b * h), (a * w, -d, b * h), (w, a * d, b * h), (-w, a * d, b * h)):
                out.append(Mk @ Vector(p))
    return out




# =====================================================================================================================
# Kutu oyunları v8.5 (kullanıcı kararı 05.11: "Diz çökerek beklesin; yakın göze yerinden uzanır, uzaktakine bir iki adım
# alıp eğilir, uzanır; seçilince yukarı taşısın"; oda sözleşmesi klip-meta-v5.md "v8.5 — oda tarafı").
# Kök bütün kliplerde oda durağında (1410, 420), ψ 50° (core/oda-yerler.js oyunlar.yer/yon; kurulumda okunur). Biggie'nin
# gövdesi klibin içinde yer değiştirir (kalça, ayak ve el hedefleri kökün uzayında): kutunun gözünün önündeki "iş yerine"
# diz üstü kayar (yakın göz) ya da yarım kalkıp dizlerinin üstünde adımlar (uzak göz), 40° döner (yüzü rafa, ψ 90°), sol eli
# rafın üstünde, eğilip sağ eliyle kutuyu kavrar. Kutu rijit: gözden YATAY çekilir (uzak yüzü rafın önünü 12 mm geçene dek;
# Biggie bu sırada dizlerinin üstünde geri kayar, göbek kutuya değmesin), DİK kalkar, dik kutular havada yatırılır (dik sıra
# Y'de sağa, vitrin X'te geriye: kapak yukarı), iki elle göğsün önünde taşınarak durağa dönülür, kutu rafın üstündeki yerine
# (oyunlar.kutuV85.ust (1890, 140), raf üstü 420 + kalınlık/2 + 1) rafa paralel konur, Biggie diz üstü beklemeye döner.
# Kutu 'al'dan 'birak'a dek el.R'ye bağlı (kutu.el_yerel / el_yerel_q, kutu.yol aynı yolun merkezi). Geri koyma klibi al'ın
# tersidir; çevirme rafın üstünde sağ elle (sol el rafta). Ölçüm (kutu86_olc): gerçek kutu (el.R × soket) ile raf tahtaları,
# gövde; el–kutu kayması; zemin.
KUTU86 = {'ileri': 300, 'ileri_en': 310, 'R': 427, 'geri_dik': 120, 'geri_yatay': 110, 'cik_pay': 12, 'kalk_pay': 25, 'adim_mm': 210, 'tasi_z': 600, 'tasi_bosluk': 45}
_K86 = {}
KUTU86_P = {}   # kutuya özel uzanış (kutu86_uzanis_ara ölçerek seçer): taban 'seiza'|'dik', X eğilme, kal kalça öne (mm), ileri (mm)


def _durak_ust():
    """oyunlar durağı (x, y, ψ derece) ve rafın üstündeki kutu yeri (x, y)"""
    import re
    y = open(os.path.join(KOK, 'core', 'oda-yerler.js'), encoding='utf-8').read()
    m = re.search(r"\{ id: 'oyunlar', yer: \[([-\d.]+), ([-\d.]+)\], yon: ([-\d.]+)", y)
    u = re.search(r"kutuV85: \{[^}]*ust: \[([-\d.]+), ([-\d.]+)\]", y)
    return (float(m.group(1)), float(m.group(2)), float(m.group(3))), (float(u.group(1)), float(u.group(2)))


def d2y(p, durak):
    """dünya (mm) → durak yereli (mm; +x sol, −y ileri)"""
    ps = math.radians(durak[2]); dx, dy = p[0] - durak[0], p[1] - durak[1]
    return dx * math.cos(ps) + dy * math.sin(ps), -(dx * math.sin(ps) - dy * math.cos(ps))


def y2d(lx, ly, durak):
    ps = math.radians(durak[2])
    return durak[0] + lx * math.cos(ps) - ly * math.sin(ps), durak[1] + lx * math.sin(ps) + ly * math.cos(ps)


def T_yer(x, y, yaw):
    """kök uzayında gövde dönüşümü: (x, y) Blender birimi, yaw derece (+ sola)"""
    return Matrix.Translation(Vector((x, y, 0))) @ _rot('Z', yaw)


def T_ara(A, B, u):
    u = max(0.0, min(1.0, u)); u = u * u * (3 - 2 * u)
    ya = math.degrees(A.to_euler().z); yb = math.degrees(B.to_euler().z)
    p = A.translation.lerp(B.translation, u)
    return T_yer(p.x, p.y, ya + (yb - ya) * u)


def poz_ara(akis, f):
    """poz akışında f karesi (PCHIP alanlar)"""
    g = lambda fn: vanahtar([(k, tuple(fn(p))) for k, p in akis], f)
    s = lambda fn: anahtar([[k, fn(p)] for k, p in akis], f)
    return {'kalca': Vector(g(lambda p: p['kalca'])), 'ayak': {t: Vector(g(lambda p, t=t: p['ayak'][t])) for t in 'LR'},
            'don': {t: s(lambda p, t=t: p['don'][t]) for t in 'LR'}, 'bilek': {t: s(lambda p, t=t: p['bilek'][t]) for t in 'LR'},
            'omX': s(lambda p: p['omX']), 'goX': s(lambda p: p['goX'])}


def kutu86_hazirla():
    if _K86: return _K86
    k0 = None
    act = bpy.data.actions[DURMA]; rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    poz_sifirla(); bpy.context.scene.frame_set(1)
    _K86['k0'] = rig.pose.bones['kalça'].head.copy()
    _K86['f0'] = {t: durma_ayak(t).translation.copy() for t in 'LR'}
    Sz = POZ['SEIZA']; out = {}
    for ad, p in (('seiza', Sz), ('dik', KUTU7['D2'])):
        _poz_olc(p); N = ag_noktalari(('pantolon', 'kazak')); pb = rig.pose.bones
        diz = min(v.y for v in N['pantolon'] if v.z < 0.15 and min((v - pb['baldır.' + t].head).length for t in 'LR') < 140 * U)
        gob = min(v.y for v in N['kazak'] if 0.2 < v.z < 0.6 and abs(v.x) < 0.15)
        out[ad] = (diz, gob)
    bpy.data.actions.remove(bpy.data.actions['Hareket - _poz_olc'])
    _K86.update(diz_on=-min(o[0] for o in out.values()), gobek_on=-min(o[1] for o in out.values()), avuc_R=avuc_yuzu('R'), avuc_L=avuc_yuzu('L'))
    _K86['durak'], _K86['ust'] = _durak_ust()
    db = bpy.data.actions['Hareket - diz_bekle']; _K86['dinlen'] = {}
    for t in 'LR':
        _, yo = el_poz(db, 1, t); kare_ayarla(db, 1); _K86['dinlen'][t] = (tuple(el_noktasi(t, _K86['avuc_' + t])), yo)
    print('KUTU86', {k: (round(v * MM) if isinstance(v, float) else v) for k, v in _K86.items() if k in ('diz_on', 'gobek_on', 'durak', 'ust')})
    return _K86


def kutu86_geo(K):
    """kutunun iş yeri (gözünün önü, yüzü rafa) ve iş yerelinde ölçüleri; durak yereline dönüşüm T_sw"""
    H = kutu86_hazirla(); w, d, h = K['olcu']; R = KUTU86['R']
    iw = (K['on_x'] - R, K['dunya'][1])                                 # iş yeri (dünya, mm), ψ 90
    lx, ly = d2y(iw, H['durak'])
    T_sw = T_yer(lx * U, ly * U, 90 - H['durak'][2])
    c0 = Vector((0.0, -(K['dunya'][0] - iw[0]), K['dunya'][2])) * U      # iş yerelinde (+x = dünya +y, −y = dünya +x)
    q0 = _rot('Z', 180) @ _rot('X', math.degrees(K['egik']))
    uzun = K['tur'] in ('dik', 'kapak')
    return {'w': w, 'd': d, 'h': h, 'R': R, 'iw': iw, 'T_sw': T_sw, 'c0': c0, 'q0': q0, 'uzun': uzun,
            'yakin': (lx * lx + ly * ly) ** 0.5 < 450, 'mesafe': (lx * lx + ly * ly) ** 0.5}


def raf_tahtalari():
    """rafın tahtaları dünyada (mm; x0, x1, y0, y1, z0, z1): üst, taban, arka, dış yanlar, ara bölmeler"""
    _, _, R = oyun_kutulari(); on, ar = R['on_x'], R['on_x'] + R['derin']; y0, y1 = R['y'] - R['en'] / 2, R['y'] + R['en'] / 2
    t, a, G, H = R['t'], R['ara'], R['goz'], R['boy']
    T = {'ust': (on, ar, y0, y1, H - t, H), 'taban': (on, ar, y0, y1, 0, t), 'arka': (ar - 6, ar, y0, y1, 0, H),
         'yan_1': (on, ar, y1 - t, y1, 0, H), 'yan_2': (on, ar, y0, y0 + t, 0, H)}
    for k in (1, 2):
        xc = -R['en'] / 2 + t + k * G + (k - 0.5) * a; yc = -xc + R['y']
        T[f'bolme_{k}'] = (on, ar, yc - a / 2, yc + a / 2, 0, H)
    return T



def _yon(R3, yo): return (tuple(R3 @ Vector(yo[0])), tuple(R3 @ Vector(yo[1])))


def kutu86_zaman(K, G):
    """al klibinin zaman çizelgesi: her kare için gövde dönüşümü, poz, ayaklar, kutu, eller"""
    H = _K86; Sz, D2, DK = POZ['SEIZA'], KUTU7['D2'], POZ['DIK']
    w, d, h = G['w'] * U, G['d'] * U, G['h'] * U
    T_sw = G['T_sw']; I4 = Matrix.Identity(4)
    uzak = not G['yakin']
    n_adim = max(1, math.ceil(G['mesafe'] / KUTU86['adim_mm']))
    ADIM = 12                                                       # kare / adım (iki bacak)
    kalk = 10 if uzak else 0
    O0, O1 = 1 + 4, 1 + 4 + kalk + n_adim * ADIM + kalk                # gidiş
    AL = O1 + 26; CIK = AL + 16; KALK = CIK + 14; YAT = KALK + (16 if G['uzun'] else 0); TAS = YAT + 8
    D0 = TAS + 2; D1 = D0 + kalk + n_adim * ADIM + kalk             # dönüş (kutu elde)
    P0 = D1 + 2; YUK = P0 + 22; BIRAK = YUK + 8; son = BIRAK + 26
    geri = (KUTU86['geri_dik'] if G['uzun'] else KUTU86['geri_yatay']) * U
    derin = (K['dunya'][0] - G['d'] / 2) - K['on_x']                      # kutunun yakın yüzü rafın önünden içeride (mm)
    ileri = KUTU86_P.get(K['no'], {}).get('ileri', min(KUTU86['ileri_en'], max(0.0, KUTU86['ileri'] + derin - 30))) * U
    # gövde dönüşümü
    def Tb(f):
        if f <= O0: return I4.copy()
        if f <= O1: return T_ara(I4, T_sw, (f - O0 - kalk) / max(1, n_adim * ADIM)) if f > O0 + kalk else I4.copy()
        if f <= D0:   # uzanırken dizlerinin üstünde öne (ileri), çekerken geri (geri): kutu dizlere ve göbeğe değmez
            if f <= AL: gg = -ileri * max(0.0, min(1.0, (f - O1) / (AL - 8 - O1)))
            else: gg = -ileri + (ileri + geri) * max(0.0, min(1.0, (f - AL) / (CIK - AL + 6)))
            return T_sw @ Matrix.Translation(Vector((0, gg, 0)))
        if f <= D1:
            Ta = T_sw @ Matrix.Translation(Vector((0, geri, 0)))
            return T_ara(Ta, I4, (f - D0 - kalk) / max(1, n_adim * ADIM)) if f > D0 + kalk else Ta
        return I4.copy()
    # ayaklar: bacak başına basma dönüşümleri (adım aralarında yerde sabit)
    def adim_T(f, a, b, Ta, Tb_, ilk, n=None):
        """[a, b] yürüme aralığında bacağın dönüşümü (ilk: o adımda önce oynayan bacak mı; n adım)"""
        n = n or n_adim
        if f <= a: return Ta, 0.0
        if f >= b: return Tb_, 0.0
        L_ = (b - a) / n
        i = min(n - 1, int((f - a) / L_)); s = (f - a - i * L_) / L_
        y0, y1 = (0.0, 0.5) if ilk else (0.5, 1.0)
        u0, u1 = i / n, (i + 1) / n
        if s < y0: return T_ara(Ta, Tb_, u0), 0.0
        if s > y1: return T_ara(Ta, Tb_, u1), 0.0
        r = (s - y0) / (y1 - y0)
        return T_ara(Ta, Tb_, u0 + (u1 - u0) * r), math.sin(math.pi * r)
    sag_once = T_sw.translation.x < 0                               # sağa gidiyorsa önce sağ bacak
    def Tf(f, t):
        ilk = (t == 'R') == sag_once
        if f <= O1: return adim_T(f, O0 + kalk, O1 - kalk, I4, T_sw, ilk)
        if f <= D0:
            if O1 < f <= CIK + 6: return (adim_T(f, O1, AL - 8, T_sw, T_sw @ Matrix.Translation(Vector((0, -ileri, 0))), ilk, 1) if f <= AL
                                         else adim_T(f, AL, CIK + 6, T_sw @ Matrix.Translation(Vector((0, -ileri, 0))), T_sw @ Matrix.Translation(Vector((0, geri, 0))), not ilk, 1))
            return Tb(f), 0.0
        Ta = T_sw @ Matrix.Translation(Vector((0, geri, 0)))
        if f <= D1: return adim_T(f, D0 + kalk, D1 - kalk, Ta, I4, not ilk)
        return I4.copy(), 0.0
    # poz (gövde çerçevesinde)
    eg = lambda X, kal=Vector(): poz_kopya(D2, kalca=D2['kalca'] + kal, omX=X)
    c0 = G['c0']; alcak = max(0.0, min(1.0, (300 * U - c0.z) / (220 * U)))
    P = KUTU86_P.get(K['no'], {})
    Xu = P.get('X', 32 + 24 * alcak); kal = Vector((-0.018, -P.get('kal', 120) * U, P.get('kalz', 0) * U))
    uz = (lambda X, k: poz_kopya(Sz, kalca=Sz['kalca'] + k, omX=X)) if P.get('taban') == 'seiza' else eg
    yur = DK if uzak else Sz
    akis = [(1, poz_kopya(Sz))]
    if uzak: akis += [(O0, poz_kopya(Sz)), (O0 + kalk, poz_kopya(yur)), (O1 - kalk, poz_kopya(yur)), (O1, poz_kopya(Sz))]
    else: akis += [(O1, poz_kopya(Sz))]
    akis += [(O1 + 8, uz(Xu * 0.4, kal * 0.3)), (AL - 6, uz(Xu, kal)), (AL, uz(Xu, kal)),
             (AL + 8, uz(Xu, kal * 0.8)), (CIK, uz(Xu * 0.95, kal * -0.5)), (CIK + 6, uz(Xu * 0.7, kal * -0.3)), (KALK, eg(8, Vector((0, 0.03, 0))))]
    if G['uzun']: akis += [(YAT, eg(8, Vector((0, 0.02, 0))))]
    akis += [(TAS, poz_kopya(Sz, omX=6))]
    if uzak: akis += [(D0 + kalk, poz_kopya(yur, omX=6)), (D1 - kalk, poz_kopya(yur, omX=6)), (D1, poz_kopya(Sz, omX=6))]
    else: akis += [(D1, poz_kopya(Sz, omX=6))]
    akis += [(P0 + 10, eg(20, Vector((0, -0.05, 0)))), (YUK, eg(30, Vector((0, -0.09, 0)))), (BIRAK, eg(30, Vector((0, -0.09, 0)))),
             (BIRAK + 10, eg(10, Vector((0, -0.01, 0)))), (BIRAK + 18, poz_kopya(Sz, omX=4)), (son, poz_kopya(Sz))]
    # kutu: iş yerelinde rijit yol → durak yereli
    ust_pay = (420 - (K['dunya'][2] + G['h'] / 2)) if K['tur'] == 'yatay' else 99
    kalk0 = 0.006 if ust_pay > 8 else 0.0005
    cik = Vector((0, -G['R'] * U + d / 2 + KUTU86['cik_pay'] * U, c0.z + kalk0))
    zt = 420 * U; tz = KUTU86['tasi_z'] * U
    q0 = G['q0']; M = lambda c, q: Matrix.Translation(c) @ q
    yol_w = [(1, M(c0, q0)), (AL, M(c0, q0)), (AL + 4, M(c0 + Vector((0, 0.008, kalk0)), q0)), (CIK, M(cik, q0)), (KALK, M(Vector((cik.x, cik.y, tz)), q0))]
    if K['tur'] == 'kapak':
        pv = Vector((0, cik.y - d / 2, tz - h / 2)); eks, aci = 'X', 90; ince = d
    elif K['tur'] == 'dik':
        pv = Vector((-w / 2, cik.y, tz - h / 2)); eks, aci = 'Y', -90; ince = w
    else:
        eks, aci, ince = None, 0, h
    if eks:
        for i, f in enumerate(range(KALK + 2, YAT + 1, 2)):
            u = (i + 1) / ((YAT - KALK) / 2); a = aci * (0.5 - 0.5 * math.cos(math.pi * u))
            yol_w.append((f, Matrix.Translation(pv) @ _rot(eks, a) @ Matrix.Translation(-pv) @ M(Vector((cik.x, cik.y, tz)), q0)))
    q_duz = (_rot(eks, aci) @ q0) if eks else q0
    # taşıma: kutu gövdenin önünde (gövde çerçevesinde), göbekten tasi_bosluk ötede
    sonM = yol_w[-1][1] if eks else M(Vector((cik.x, cik.y, tz)), q0)
    dy = max(abs((sonM.to_3x3() @ Vector(e)).y) * s for e, s in (((1, 0, 0), w / 2), ((0, 1, 0), d / 2), ((0, 0, 1), h / 2)))
    tasi_b = M(Vector((0, -(H['gobek_on'] + KUTU86['tasi_bosluk'] * U + dy), tz)), sonM.to_3x3().to_4x4())
    # hedef: rafın üstü (durak yereli), rafa paralel
    ux, uy = d2y(H['ust'], H['durak'])
    Q_t = T_sw.to_3x3().to_4x4() @ q_duz
    hedef = M(Vector((ux * U, uy * U, zt + ince / 2 + 0.0007)), Q_t)
    def kutu(f):
        if f <= YAT: return T_sw @ yol_M(yol_w, f)
        if f <= TAS:   # yatırılmış kutu gövdenin önündeki taşıma yerine
            A = T_sw @ yol_M(yol_w, YAT); B = Tb(f) @ tasi_b
            u = (f - YAT) / max(1, TAS - YAT); u = u * u * (3 - 2 * u)
            return Matrix.Translation(A.translation.lerp(B.translation, u)) @ A.to_quaternion().slerp(B.to_quaternion(), u).to_matrix().to_4x4()
        if f <= P0: return Tb(f) @ tasi_b
        if f <= BIRAK:
            A = tasi_b; B = hedef
            ust = Matrix.Translation(Vector((0, 0, 0.04))) @ B
            if f <= YUK:   # önce kalkar (alt yüz rafın üstünün 25 mm üstüne), sonra ileri, hedefin 40 mm üstüne
                u = (f - P0) / (YUK - P0); u = u * u * (3 - 2 * u)
                p = A.translation.lerp(ust.translation, u); p.z = max(p.z, A.translation.z + (ust.translation.z - A.translation.z) * min(1, u * 1.8))
                return Matrix.Translation(p) @ A.to_quaternion().slerp(B.to_quaternion(), u).to_matrix().to_4x4()
            u = (f - YUK) / (BIRAK - YUK); u = u * u * (3 - 2 * u)
            return Matrix.Translation(ust.translation.lerp(B.translation, u)) @ B.to_quaternion().to_matrix().to_4x4()
        return hedef
    A = {'O0': O0, 'O1': O1, 'AL': AL, 'CIK': CIK, 'KALK': KALK, 'YAT': YAT, 'TAS': TAS, 'D0': D0, 'D1': D1, 'P0': P0, 'YUK': YUK, 'BIRAK': BIRAK, 'son': son}
    return A, Tb, Tf, akis, kutu, hedef, q_duz, ince



def kutu86_al(K):
    """kutu_uzan_al_k<no>: duraktaki diz üstü beklemeden başlar, kutuyu rafın üstüne koyup oraya döner"""
    H = kutu86_hazirla(); G = kutu86_geo(K)
    A, Tb, Tf, akis, kutu, hedef, q_duz, ince = kutu86_zaman(K, G)
    son, AL, CIK, KALK, YAT, TAS, P0, BIRAK, O1, D1 = (A[k] for k in ('son', 'AL', 'CIK', 'KALK', 'YAT', 'TAS', 'P0', 'BIRAK', 'O1', 'D1'))
    w, d, h = G['w'] * U, G['d'] * U, G['h'] * U
    k0, f0 = H['k0'], H['f0']; T_sw = G['T_sw']
    # sağ elin kutudaki yeri (iş yerelinde ilk duruşa göre → kutu çerçevesi)
    ust_pay = (420 - (K['dunya'][2] + G['h'] / 2))
    # sağ el: kutunun üstünde el sığacak boşluk varsa üst yüzden yakın kenara yakın (avuç aşağı, parmaklar ileri), yoksa
    # (yığında) yakın yüzün ortası (avuç kutuya, parmaklar yukarı); vitrin: yakın yüzün üst yarısı
    ust_pay = (420 - 38 - (K['dunya'][2] + G['h'] / 2))
    if any(k['goz'] == K['goz'] and k['no'] != K['no'] and k['dunya'][2] > K['dunya'][2] for k in oyun_kutulari()[0]): ust_pay = 0   # yığında üstünde kutu var
    if K['tur'] == 'kapak':
        tR = (Vector((-60 * U, d / 2 + 3 * U, h / 2 - 55 * U)), (0.15, 0, 1), (0, -1, 0))
    elif ust_pay > 40:
        tR = (Vector((-min(30 * U, max(0.0, w / 2 - 20 * U)), d / 2 - 40 * U, h / 2 + 3 * U)), (0, -1, 0.05), (0, 0, -1))
    else:
        tR = (Vector((-min(50 * U, max(0.0, w / 2 - 30 * U)), d / 2 + 3 * U, 0)), (0.15, 0, 1), (0, -1, 0))
    Mk0 = T_sw @ Matrix.Translation(G['c0']) @ G['q0']; Ri0 = Mk0.to_3x3().inverted()
    pR_k = Mk0.inverted() @ (T_sw @ (G['c0'] + tR[0]))
    yR_k = (Ri0 @ (T_sw.to_3x3() @ Vector(tR[1])), Ri0 @ (T_sw.to_3x3() @ Vector(tR[2])))
    # sol el kutunun sol yanında (taşıma yerinde, gövdenin solu +x)
    Mt = kutu(TAS); Rt = Mt.to_3x3(); Tbt = Tb(TAS); Rb = Tbt.to_3x3()
    hx = max(abs((Rb.inverted() @ (Rt @ Vector(e))).x) * s for e, s in (((1, 0, 0), w / 2), ((0, 1, 0), d / 2), ((0, 0, 1), h / 2)))
    pL_w = Mt.translation + Rb @ Vector((hx + 3 * U, 0.02, 0))
    pL_k = Mt.inverted() @ pL_w
    yL_k = (Rt.inverted() @ (Rb @ Vector((0.1, -1, 0))), Rt.inverted() @ (Rb @ Vector((-1, 0, 0))))
    destek = T_sw @ Vector((0.09, -G['R'] * U - 22 * U, 432 * U))   # rafın ön kenarına yakın (kutunun solunda)   # rafın üstünde, kutunun solunda (dış yan tahtanın içinde)
    yD = _yon(T_sw.to_3x3(), ((0.1, -1, 0.45), (0, 0, -1)))   # parmaklar hafif kalkık (üst yüzün içine sarkmasın)
    elK = lambda f, p, yo: (tuple(kutu(f) @ p), _yon(kutu(f).to_3x3(), yo))
    rest = lambda f, t: (tuple(Tb(f) @ Vector(H['dinlen'][t][0])), _yon(Tb(f).to_3x3(), H['dinlen'][t][1]))   # diz_bekle'deki avuç
    def lerp_el(a, b, u):
        u = max(0.0, min(1.0, u)); u = u * u * (3 - 2 * u)
        return tuple(Vector(a[0]).lerp(Vector(b[0]), u)), (tuple(Vector(a[1][0]).lerp(Vector(b[1][0]), u)), tuple(Vector(a[1][1]).lerp(Vector(b[1][1]), u)))
    LK = (YAT if G['uzun'] else KALK) - 2                                   # sol el kutuya katılır
    S = {'kalca': [], 'ayak': {'L': [], 'R': []}, 'ayak_don': {'L': [], 'R': []}, 'ayak_bilek': {'L': [], 'R': []}, 'ayak_yaw': {'L': [], 'R': []},
         'don': {'omurga': {'X': [], 'Z': []}, 'göğüs': {'X': []}, 'kalça': {'Z': []}}, 'el': {'R': {'ik': [[1, 1], [son, 1]], 'yer': [], 'yon': [], 'dirsek': [], 'nokta': H['avuc_R']},
         'L': {'ik': [[1, 1], [son, 1]], 'yer': [], 'yon': [], 'dirsek': [], 'nokta': H['avuc_L']}}}
    bak = []
    for f in range(1, son + 1):
        T = Tb(f); p = poz_ara(akis, f); yaw = math.degrees(T.to_euler().z)
        kal = T @ (k0 + p['kalca']) - k0
        lif = 0.0
        for t in 'LR':
            Tt, l = Tf(f, t); lif = max(lif, l)
            S['ayak'][t].append((f, tuple(Tt @ (f0[t] + p['ayak'][t]) + Vector((0, 0, 0.012 * l)) - f0[t])))
            S['ayak_yaw'][t].append([f, math.degrees(Tt.to_euler().z)])
            S['ayak_don'][t].append([f, p['don'][t]]); S['ayak_bilek'][t].append([f, p['bilek'][t]])
        S['kalca'].append((f, tuple(kal + Vector((0, 0, 0.005 * lif)))))
        S['don']['omurga']['X'].append([f, p['omX']]); S['don']['göğüs']['X'].append([f, p['goX']]); S['don']['kalça']['Z'].append([f, yaw])
        # sağ el
        if f <= O1: e = rest(f, 'R')
        elif f < AL: e = lerp_el(rest(f, 'R'), (tuple(kutu(AL) @ pR_k + T.to_3x3() @ Vector((0, 0.05, 0.04)) * (1 - (f - O1) / (AL - O1))), _yon(kutu(AL).to_3x3(), yR_k)), (f - O1) / (AL - O1 - 4))
        elif f <= BIRAK: e = elK(f, pR_k, yR_k)
        else: e = lerp_el(elK(BIRAK, pR_k, yR_k), rest(f, 'R'), (f - BIRAK) / 14)
        S['el']['R']['yer'].append((f, e[0])); S['el']['R']['yon'].append((f, e[1]))
        # sol el
        dst = (tuple(destek), yD)
        if f <= O1 + 2: e = rest(f, 'L')
        elif f < AL - 6:   # önden ve yukarıdan rafın üstüne (rafın ön kenarının içinden geçmez)
            ara = (tuple(Vector(destek) + T_sw.to_3x3() @ Vector((0, 0.07, 0.06))), yD); u_ = (f - O1 - 2) / (AL - 8 - O1)
            e = lerp_el(rest(f, 'L'), ara, u_ * 1.6) if u_ < 0.6 else lerp_el(ara, dst, (u_ - 0.6) / 0.4)
        elif f <= CIK + 2: e = dst
        elif f < LK: e = lerp_el(dst, elK(LK, pL_k, yL_k), (f - CIK - 2) / max(1, LK - CIK - 2))
        elif f <= BIRAK: e = elK(f, pL_k, yL_k)
        else: e = lerp_el(elK(BIRAK, pL_k, yL_k), rest(f, 'L'), (f - BIRAK) / 14)
        S['el']['L']['yer'].append((f, e[0])); S['el']['L']['yon'].append((f, e[1]))
        for t, s in (('R', -1), ('L', 1)):
            dv = Vector((0.42 * s, 0.05, 0.35)) if (f < O1 or f > BIRAK + 10) else Vector((0.45 * s, -0.05, 0.38))
            S['el'][t]['dirsek'].append((f, tuple(T @ dv)))
        bak.append((f, tuple(T.inverted() @ (kutu(f).translation if f >= O1 else T_sw.translation + Vector((0, -0.3, 0.3))))))
    S['don']['omurga']['Z'] = [[1, 0], [AL - 10, 6], [AL, 10], [CIK, 4], [KALK, 0], [son, 0]]
    S['don']['omuz.R'] = {ax: [[1, 0], [AL - 12, 0], [AL - 4, 20], [AL + 2, 20], [CIK, 6], [KALK, 0], [A['YUK'], 8], [BIRAK, 8], [BIRAK + 8, 0], [son, 0]] for ax in 'XZ'}
    kx = KUTU86_P.get(K['no'], {}).get('kafa', -16)   # uzanırken baş kalkık (çene rafın üstünün üstünde)
    S['don']['kafa'] = {'X': [[1, 2], [AL - 8, kx * 0.8], [AL, kx], [CIK, kx * 0.6], [KALK, -4], [A['YUK'], 4], [son, 2]]}
    S['bak'] = {'agirlik': [[1, 0], [10, 0.5], [AL - 14, 0.0], [CIK + 4, 0.0], [KALK, 0.5], [son - 12, 0.5], [son, 0]], 'yer': bak}
    S['parmak'] = {'R': [[1, 0.2], [AL - 8, 0.05], [AL - 2, 0.05], [AL + 2, 0.3 if tR[2][2] < 0 else 0.12], [BIRAK, 0.3 if tR[2][2] < 0 else 0.12], [BIRAK + 4, 0.1], [son, 0.2]],
                   'L': [[1, 0.2], [AL - 10, 0.0], [CIK, 0.0], [LK, 0.1], [BIRAK, 0.1], [BIRAK + 4, 0.1], [son, 0.2]]}
    S['canli'] = 0.25; S['nefes_uc'] = True; S['gecikmesiz'] = True
    ad = 'kutu_uzan_al_k%d' % K['no']
    act = klip_kur(ad, son, S)
    act = uc_kilitle(act, bpy.data.actions['Hareket - diz_bekle'], 1, n=5)
    return act, G, A, kutu, hedef, (pR_k, yR_k), S



def kutu86_olc(act, K, G, A, kutu, sok, adim=2, kareler=None):
    """kare kare: gerçek kutu (al–birak arası el.R × soket, dışında planlanan yol) ile raf tahtaları ve gövde; gövdenin raf
    tahtalarına girişi; el–kutu kayması (soketteki kutu ile planlanan yol farkı)"""
    H = _K86; dur = H['durak']; T = raf_tahtalari()
    L = Matrix.Translation(Vector(sok[0]) / MM) @ Quaternion((sok[1][3], *sok[1][:3])).to_matrix().to_4x4()
    gov = ('pantolon', 'kazak', 'kafa', 'saç sakal', 'kulaklık', 'sol ayak', 'sağ ayak') + BZ_EL_AG
    Gk = {'w': G['w'], 'd': G['d'], 'h': G['h']}
    o = {'kutu_raf_mm': 0.0, 'kutu_raf_kare': None, 'kutu_govde_mm': 0.0, 'kutu_govde_kare': None, 'kutu_govde_ag': None,
         'govde_raf_mm': 0.0, 'govde_raf_kare': None, 'govde_raf_ag': None, 'el_kutu_mm': 0.0, 'zemin_mm': 0.0}
    dw = lambda p: (*y2d(p.x * MM, p.y * MM, dur), p.z * MM)
    def icerde(q, k):
        x0, x1, y0, y1, z0, z1 = k
        return min(q[0] - x0, x1 - q[0], q[1] - y0, y1 - q[1], q[2] - z0, z1 - q[2])
    for f in (kareler or list(range(1, A['son'] + 1, adim)) + [A['AL'], A['BIRAK']]):
        kare_ayarla(act, f)
        Mp = kutu(f)
        Mk = (rig.pose.bones['el.R'].matrix @ L) if A['AL'] <= f <= A['BIRAK'] else Mp
        if A['AL'] <= f <= A['BIRAK']: o['el_kutu_mm'] = max(o['el_kutu_mm'], round((Mk.translation - Mp.translation).length * MM, 1))
        P = [dw(p) for p in kutu85_kutu_noktalari(Mk, Gk, 6)]
        for kn, k in T.items():
            for q in P:
                dd = icerde(q, k)
                if dd > o['kutu_raf_mm']: o.update(kutu_raf_mm=round(dd, 1), kutu_raf_kare=f, kutu_raf_tahta=kn)
        Mi = Mk.inverted(); hw, hd, hh = G['w'] / 2, G['d'] / 2, G['h'] / 2
        N = ag_dizi(gov)
        if 'kazak' in N: N['kazak'] = N['kazak'][~kol_mu(N['kazak'])]
        for ad, V in N.items():
            for v in V[::3]:
                v = Vector(v); q = (Mi @ v) * MM
                if ad not in BZ_EL_AG:
                    dd = min(hw - abs(q.x), hd - abs(q.y), hh - abs(q.z))
                    if dd > o['kutu_govde_mm']: o.update(kutu_govde_mm=round(dd, 1), kutu_govde_kare=f, kutu_govde_ag=ad)
                w_ = dw(v)
                if -w_[2] > o['zemin_mm']: o.update(zemin_mm=round(-w_[2], 1), zemin_kare=f, zemin_ag=ad)
                for kn, k in T.items():
                    dd = icerde(w_, k)
                    if ad in BZ_EL_AG and w_[2] >= 414: continue   # el rafın üstünde (destek): üst yüzün 6 mm içine dek temas
                    if dd > o['govde_raf_mm'] + 0.5: o.update(govde_raf_mm=round(dd, 1), govde_raf_kare=f, govde_raf_ag=ad + ':' + kn)
    return o


def kutu86_soket(act, A, kutu):
    kare_ayarla(act, A['AL'] + 2); Lk = rig.pose.bones['el.R'].matrix.inverted() @ kutu(A['AL'] + 2); t_, q_, _ = Lk.decompose()
    return mm(t_), [round(x, 5) for x in (q_.x, q_.y, q_.z, q_.w)]


def kutu86_uzanis_ara(K, adaylar):
    """uzanış adaylarını kurup ölçer (sağ el kutuya, sol el rafa, baş/gövde raf tahtalarına), en iyisini KUTU86_P'ye yazar"""
    en = None
    for P in adaylar:
        KUTU86_P[K['no']] = P
        act, G, A, kutu, hedef, tut, S = kutu86_al(K)
        r = el_hatasi(act, S, 'R', A['AL'] - 2, A['CIK'] + 6); l = el_hatasi(act, S, 'L', A['AL'] - 4, A['CIK'])
        o = kutu86_olc(act, K, G, A, kutu, kutu86_soket(act, A, kutu), kareler=list(range(A['AL'] - 8, A['KALK'] + 1, 3)))
        m = max(r - 8, 0) * 2 + max(l - 10, 0) + o['govde_raf_mm'] * 4 + o['kutu_govde_mm'] * 4 + o['kutu_raf_mm'] * 4
        print('ARA', K['no'], P, 'R', r, 'L', l, 'raf', o['govde_raf_mm'], o['govde_raf_ag'], 'kutu_govde', o['kutu_govde_mm'], 'kutu_raf', o['kutu_raf_mm'], 'maliyet', round(m, 1))
        if en is None or m < en[0]: en = (m, P)
        bpy.data.actions.remove(act)
    KUTU86_P[K['no']] = en[1]
    return en


def kutu86_cevir(K, hedef, ince, yon):
    """kutu_uzan_cevir_sag/sol_k<no>: duraktaki diz üstü beklemeden uzanır, rafın üstündeki kutunun üstüne sağ avucunu koyar,
    kutuyu dikey ekseninde ±90° çevirir (sağ: −90°, yukarıdan saat yönü), bırakır, beklemeye döner"""
    H = _K86; Sz, D2 = POZ['SEIZA'], KUTU7['D2']; son = 51; G0, G1, B1 = 12, 34, 38
    eg = lambda X, kal=Vector(): poz_kopya(D2, kalca=D2['kalca'] + kal, omX=X)
    don = [[1, 0], [G0, 0], [G1, 90 * yon], [son, 90 * yon]]
    th = lambda f: anahtar(don, f)
    c = hedef.translation.copy()
    Mf = lambda f: Matrix.Translation(c) @ _rot('Z', th(f)) @ Matrix.Translation(-c) @ hedef
    # avuç kutunun üstünde, dönüş eli Biggie'ye yakın tutsun: sağa çevirirken sağ yarıdan önüne, sola çevirirken önünden sağına
    r_ = min(K['olcu'][0], K['olcu'][1]) / 2 * U
    v_ = Vector((-0.55 * r_, 0.05 * r_, 0)) if yon < 0 else Vector((-0.05 * r_, 0.55 * r_, 0))
    p_k = hedef.inverted() @ (c + v_ + Vector((0, 0, ince / 2 + 3 * U)))
    y_k = (hedef.to_3x3().inverted() @ Vector((0.1, -1, 0)), hedef.to_3x3().inverted() @ Vector((0, 0, -1)))
    elK = lambda f: (tuple(Mf(f) @ p_k), _yon(Mf(f).to_3x3(), y_k))
    rest = H['dinlen']['R']
    ust = lambda f: (tuple(Vector(elK(f)[0]) + Vector((0, 0.01, 0.035))), elK(f)[1])
    yer = [(1, rest[0]), (7, ust(G0)[0]), (G0, elK(G0)[0])] + [(f, elK(f)[0]) for f in range(G0 + 2, G1 + 1, 2)] + [(B1, ust(G1)[0]), (son - 4, rest[0]), (son, rest[0])]
    yo = [(1, rest[1]), (7, ust(G0)[1])] + [(f, elK(f)[1]) for f in range(G0, G1 + 1, 2)] + [(B1, elK(G1)[1]), (son - 4, rest[1]), (son, rest[1])]
    akis = [(1, poz_kopya(Sz)), (8, eg(22, Vector((0, -0.06, 0)))), (G0, eg(34, Vector((0, -0.11, 0)))), (G1, eg(34, Vector((0, -0.11, 0)))),
            (B1 + 4, eg(10, Vector((0, -0.01, 0)))), (son - 4, poz_kopya(Sz, omX=3)), (son, poz_kopya(Sz))]
    S = poz_akisi(akis, son)
    S['el'] = {'R': {'ik': [[1, 1], [son, 1]], 'yer': yer, 'yon': yo, 'nokta': H['avuc_R'], 'dirsek': [(1, ELLER_DIZ['R']['dirsek']), (G0, (-0.42, -0.05, 0.42)), (G1, (-0.42, -0.05, 0.42)), (son, ELLER_DIZ['R']['dirsek'])]},
               'L': diz_el_sabit(son)['L']}
    S['parmak'] = {'R': [[1, 0.2], [8, 0.0], [G0, 0.08], [G1, 0.08], [B1, 0.05], [son, 0.2]], 'L': [[1, 0.2], [son, 0.2]]}
    S['don']['omuz.R'] = {ax: [[1, 0], [G0, 10], [G1, 10], [son, 0]] for ax in 'XZ'}
    S['bak'] = {'agirlik': [[1, 0], [8, 0.6], [G1, 0.6], [son, 0]], 'yer': [(1, tuple(c)), (son, tuple(c))]}
    S['canli'] = 0.2; S['nefes_uc'] = True; S['gecikmesiz'] = True
    ad = 'kutu_uzan_cevir_%s_k%d' % ('sol' if yon > 0 else 'sag', K['no'])
    act = klip_kur(ad, son, S)
    act = uc_kilitle(act, bpy.data.actions['Hareket - diz_bekle'], 1, n=5)
    hata = el_hatasi(act, S, 'R', G0, G1)
    gk = 0.0; w2, d2, h2 = K['olcu'][0] / 2, K['olcu'][1] / 2, K['olcu'][2] / 2
    for f in range(G0, G1 + 1, 2):
        kare_ayarla(act, f); Mi = Mf(f).inverted(); N = ag_dizi(('pantolon', 'kazak', 'kafa', 'saç sakal', 'kulaklık'))
        N['kazak'] = N['kazak'][~kol_mu(N['kazak'])]
        for V in N.values():
            for v in V[::3]:
                q = (Mi @ Vector(v)) * MM
                gk = max(gk, min(w2 - abs(q.x), d2 - abs(q.y), h2 - abs(q.z)))
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': False, 'kavra': G0, 'birak': B1, 'cevir': [G0, G1],
        'kutu': {'no': K['no'], 'don_derece': 90 * yon, 'don': [[f, round(th(f), 2)] for f in range(1, son + 1)],
                 'eksen': 'kutunun merkezinden geçen dikey eksen; + yukarıdan saat yönünün tersi', 'merkez_mm': mm(c), 'elde': {'R': [[G0, G1]]}},
        'hata_mm': {'R': hata}, 'kutu_govde_mm': round(max(0.0, gk), 1),
        'not': 'v8.5: kutu_uzan_bekle (diz üstü, durakta) ile başlar ve biter; sağ avuç kutunun üstünde, kutu kutu.don ile döner (site '
               'kutuyu çevirir, ele bağlanmaz); sol el dizde.'}, ensure_ascii=False)
    return act, hata, round(max(0.0, gk), 1)


def kutu86_kur(nolar=None):
    """kutuların al / bırak / çevir klipleri ve bekleme; ölçümler OLCUM_V85['kutu']"""
    kutu86_hazirla()
    kut, _, _ = oyun_kutulari(); dur = _K86['durak']; out = []; olcum = {}
    b = bpy.data.actions.get('Hareket - kutu_uzan_bekle')
    if b: bpy.data.actions.remove(b)
    bk = bpy.data.actions['Hareket - diz_bekle'].copy(); bk.name = 'Hareket - kutu_uzan_bekle'; bk.use_fake_user = True
    m = json.loads(bk['site_meta']); m['not'] = 'v8.5: kutu oyunu durağında diz üstü bekleme (diz_bekle ile aynı); kutu_uzan_* klipleri bu pozda başlayıp biter.'
    bk['site_meta'] = json.dumps(m, ensure_ascii=False); out.append(bk)
    for K in kut:
        if nolar and K['no'] not in nolar: continue
        act, G, A, kutu, hedef, tut, S = kutu86_al(K)
        sok = kutu86_soket(act, A, kutu)
        o = kutu86_olc(act, K, G, A, kutu, sok)
        hR = el_hatasi(act, S, 'R', A['AL'], A['BIRAK']); hL = el_hatasi(act, S, 'L', A['TAS'], A['BIRAK'])
        qw = (_rot('Z', dur[2]) @ hedef).to_quaternion()
        yol = [[f, mm(kutu(f).translation)] for f in range(A['AL'], A['BIRAK'] + 1, 2)] + [[A['BIRAK'], mm(kutu(A['BIRAK']).translation)]]
        meta = {'sure': round((A['son'] - 1) / 30, 2), 'tekrar': False, 'al': A['AL'], 'birak': A['BIRAK'], 'goz': K['goz'] + 1, 'anlar': A,
                'kok': 'durakta (kutu_uzan_bekle ile aynı yer); gövde klibin içinde gözün önüne gider ve döner',
                'is_yeri_dunya_mm': [round(G['iw'][0]), round(G['iw'][1])], 'yakin_goz': G['yakin'], 'uzanis': KUTU86_P.get(K['no'], {}),
                'kutu': {'no': K['no'], 'olcu': list(K['olcu']), 'kemik': 'el.R', 'el_yerel': sok[0], 'el_yerel_q': sok[1], 'yol': yol,
                         'ust_merkez': mm(hedef.translation), 'ust_q_dunya': [round(x, 5) for x in (qw.x, qw.y, qw.z, qw.w)]},
                'olcum': {**o, 'el_R_hata_mm': hR, 'el_L_hata_mm': hL},
                'not': 'v8.5: al→birak arası kutu el.R soketinde (ya da kutu.yol: merkez, durak yereli). ust_q_dunya kutunun rafın üstündeki '
                       'duruşu (dünya, [x, y, z, w]); oda hedefQ olarak bunu kullansın (vitrin kutusu kapağı yukarı yatar).'}
        act['site_meta'] = json.dumps(meta, ensure_ascii=False); out.append(act)
        N0 = A['son']; br, N = ters_klip('kutu_uzan_birak_k%d' % K['no'], act, N0, N0, 2)
        g = lambda f: 2 + (N0 - f)
        mb = {k: v for k, v in meta.items() if k != 'anlar'}
        mb.update(sure=round((N - 1) / 30, 2), al=g(A['BIRAK']), birak=g(A['AL']), kutu=dict(meta['kutu'], yol=[[g(f), p] for f, p in reversed(yol)]))
        mb['not'] = ('v8.5: kutu_uzan_al_k%d tersten: kutu rafın üstünden ele (al), aynı rijit yoldan gözüne (birak); bekleme pozunda başlar ve biter.' % K['no'])
        br['site_meta'] = json.dumps(mb, ensure_ascii=False); out.append(br)
        ce = {}
        ince = (G['h'] if K['tur'] == 'yatay' else (G['d'] if K['tur'] == 'kapak' else G['w'])) * U
        for yon in (-1, 1):
            a2, h2, gk = kutu86_cevir(K, hedef, ince, yon)
            out.append(a2); ce['sol' if yon > 0 else 'sag'] = {'el_mm': h2, 'kutu_govde_mm': gk}
        olcum[K['no']] = {**o, 'el_R_hata_mm': hR, 'el_L_hata_mm': hL, 'cevir': ce, 'kare': A['son']}
        print('KUTU86_KLIP', K['no'], json.dumps(olcum[K['no']], ensure_ascii=False))
    OLCUM_V85['kutu'] = olcum
    return out
