# Biggie v8.4 klipleri (2026-11-05, kullanıcının v8.3 canlı geri bildirimi; meta: oktos-dijital-site/senaryo/klip-meta-v5.md "v8.4"):
#   büst  "El o şekilde tutulurken kol kopmuş". İki kök neden: (1) sağ kol erişim sınırındaydı (omuzdan bileğe kol boyunun
#         %100'ü, dirsek ~0°: kol dümdüz gerilmiş); önkol aşağı-öne bakarken avuç yukarı dönünce açının hepsi bilekte kaldı:
#         bilek bükümü ~56°, elin burgusu ~101° (önkol burgu kemiği %65'ini alır, ~35° bilekte). Kazağın manşeti (burgu %60 /
#         el %40 ağırlıklı) ezilip eğildi, yalnız el.R'ye bağlı elin bilek ucu açığa çıktı (ince silindir + boşluk).
#         (2) sol kolun dirsek hedefi geride ve içerideydi: büst sağ önde olduğu için sol üst kol göğsün İÇİNDEN geçiyor, önkol
#         göğsün ortasından yumru gibi çıkıyordu (omuzda kol yok, göğüste kopuk bir önkol). Düzeltme: büst ortaya ve öne
#         (taban merkezi −90, −295, 715 mm), sağ dirsek geride-yanda (önkol yataya yakın, avuç önkolun supinasyonuyla yukarı),
#         sol dirsek önde-yanda (kol göğsün önünden dolanır); baş büste daha az eğilir (göz–büst ~23 cm, v8.3 ~24). Sağ kol
#         ~%91, dirsek ~49° bükük, bilek bükümü ~11°, bilekte kalan burgu ~19°. Tutuş aynı: taban sağ avuçta, sol el yanda.
#   fare  "Karakter fareyi hâlâ tutmuyor": kol yine erişim sınırındaydı (sağ kol dümdüz, el hedefin ~60 mm gerisinde), klipteki
#         fare kutusu odadakinden 12 mm yüksekte (Blender masası 420, odada masa + mat − kök = 408) ve odada farenin evi mat
#         sınırı yüzünden 65 mm sola kayıyordu (x ≤ −620): el farenin üstünde havada, parmaklar ileride kalıyordu.
#         Yeni fare: siyah, ergonomik sağ el faresi (core/oda-olcu.js OLCU.MOUSE.form; oda ağı core/oda-sahne.js ergonomikFare):
#         sırtı arkada yüksek, öne alçalır, sağa hafif eğimli, sol yanında başparmak oluğu. Avucun ağdaki temas noktası farenin
#         sırtına (tepenin arka yamacı) oturur, işaret ve orta parmak iki tuşta (ölçülerek kıvrılır, uçları ön kenarın gerisinde),
#         yüzük ve serçe sağ yana, başparmak sol oluğa değer; Biggie öne eğilir (kol ≤ %92), bilek masaya yakın.
#         Fare merkezi odanın mat sınırıyla uyumlu (dünya x ≤ −620), masa yüksekliği odadan.
# Girdi: karakter-klip-eylem.py, karakter-klip-v82.py ve karakter-klip-v83.py exec edilmiş (v83'ten sonra exec edilir, aynı adlı
# işlevleri ezer: bust_eller, v82_bust, v82_fare). Çıktı: OLCUM_V84 (ölçümler) ve kliplerin site_meta'sına eklenen alanlar.
import bpy, json, math
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

OLCUM_V84 = {}


# ---------------------------------------------------------------------------------------------------------------------
# Kol ve bilek ölçüsü (her iki klipte de): erişim (omuz–bilek / kol boyu), dirsek bükümü, bilek bükümü (elin önkola göre
# eğilmesi), elin burgusu, önkol burgu kemiğinin aldığı ve bilekte kalan burgu (derece)
def _yerel_q(pb):
    par = pb.parent; rest = pb.bone.matrix_local; prest = par.bone.matrix_local
    return ((prest.inverted() @ rest).inverted() @ (par.matrix.inverted() @ pb.matrix)).to_quaternion()


def _burgu_bukum(q):
    q = q.normalized(); tw = Quaternion((q.w, 0, q.y, 0))
    if tw.magnitude < 1e-9: return 180.0, 180.0
    tw.normalize(); sw = q @ tw.inverted()
    a = (2 * math.degrees(math.atan2(tw.y, tw.w)) + 180) % 360 - 180
    return a, math.degrees(2 * math.acos(min(1.0, abs(sw.w))))


def bilek_olc(act, f, t='R'):
    kare_ayarla(act, f); pb = rig.pose.bones
    el, fa, tw, ua = pb['el.' + t], pb['ön_kol.' + t], pb['ön_kol_burgu.' + t], pb['üst_kol.' + t]
    a1, s1 = _burgu_bukum(_yerel_q(el)); a2, _ = _burgu_bukum(_yerel_q(tw))
    return {'erisim': round((el.head - ua.head).length / (ua.length + fa.length), 3),
            'dirsek_derece': round(math.degrees((ua.tail - ua.head).angle(fa.tail - fa.head)), 1),
            'bilek_bukum_derece': round(s1, 1), 'el_burgu_derece': round(a1, 1), 'bilekte_burgu_derece': round(a1 - a2, 1)}


def bilek_en_kotu(olcu):
    """kare başına ölçülerin en kötüsü (site meta'sı ve test için)"""
    v = list(olcu.values())
    return {'erisim': max(o['erisim'] for o in v), 'dirsek_derece_min': min(o['dirsek_derece'] for o in v),
            'bilek_bukum_derece': max(o['bilek_bukum_derece'] for o in v), 'bilekte_burgu_derece': max(abs(o['bilekte_burgu_derece']) for o in v)}


# ---------------------------------------------------------------------------------------------------------------------
# Büst (v8.4)
TUT['B'] = Vector((-90.0, -295.0, 715.0)) * U        # taban merkezi (karakter yereli): göğsün önünde, ortaya yakın, karnın üstünde
TUT['R_dirsek'] = Vector((-0.20, 0.16, 0.36))         # sağ dirsek hedefi (Blender birimi): geride ve yanda (önkol yataya yakın)
TUT['L_dirsek'] = Vector((0.35, -0.35, 0.40))         # sol dirsek hedefi: önde ve yanda (kol göğsün ÖNÜNDEN dolanır)
TUT_BAK = 0.45                                        # baş büste bu oranda döner (0,85'te yüz büste ~17 cm'ye iniyordu)
_bust_eller_v83 = bust_eller
_tut_S_v82 = tut_S


def bust_eller(B, f=None):
    e = _bust_eller_v83(B, f)
    return dict(e, R=(e['R'][0], e['R'][1], TUT['R_dirsek'].copy()), L=(e['L'][0], e['L'][1], TUT['L_dirsek'].copy()))


def tut_S(son, Bf, ik=None, bak=None):
    return _tut_S_v82(son, Bf, ik, TUT_BAK if bak is None else bak)


def avuc_taban(act, f, B):
    """sağ avucun büstün taban düzlemine uzaklığı (mm; + avuç tabanın altında, − tabana girmiş): taban dairesinin içindeki
    avuç köşeleri (büst ağının ışın sayımı tabanda kararsız: düzleme ölçülür)"""
    kare_ayarla(act, f); Bi = B.inverted(); r = 0.45 * min(bust_model()['taban']) / MM
    P = [Bi @ p for p in ag_noktalari(('sağ avuç',))['sağ avuç']]
    P = [q for q in P if q.xy.length < r]
    return round(-max(q.z for q in P) * MM, 1) if P else None


_tutus_bul_v83 = tutus_bul


def tutus_bul():
    """v8.3 ölçümü + avucun tabana oturması düzleme göre (v8.3'ün avuç ölçüsü yeni yerde işaret değiştiriyordu)"""
    o = _tutus_bul_v83()
    B = lambda f: Bmat(TUT['B'], BUST_YAW)
    for _ in range(4):
        S = tut_S(3, B); S['canli'] = 0; S['nefes'] = 0; tut_hizala('_tut_olc', 3, S)
        a = klip_kur('_tut_olc', 3, S); g = avuc_taban(a, 2, B(2)); bpy.data.actions.remove(a)
        if g is None: break
        TUT['R_alt'] -= (g - 0.5) * U * 0.9
    OLCUM_V84['bust_avuc_taban_mm'] = g; OLCUM_V84['bust_R_alt_mm'] = round(TUT['R_alt'] * MM, 1)
    print('AVUC_TABAN84', g, round(TUT['R_alt'] * MM, 1))
    return o


_v82_bust_v83 = v82_bust


def v82_bust():
    out = _v82_bust_v83()
    kareler = {'bust_tut': (1, 31, 61, 91, 121), 'bust_tut_yuru': (1, 11, 22, 33, 43)}
    for a in out:
        ad = a.name.replace('Hareket - ', ''); m = json.loads(a['site_meta']); son = int(a.frame_range[1])
        if ad in kareler: ks = kareler[ad]
        elif 'tutuldu' in m: ks = (m['tutuldu'], son)          # bust_al_*: tutuştan sona
        else: ks = (1, m.get('tek_el', 1))                       # bust_birak_*: baştan sağ el bırakana dek
        o = {f: bilek_olc(a, f) for f in ks}
        m['bilek'] = {'R': bilek_en_kotu(o), 'L': bilek_en_kotu({f: bilek_olc(a, f, 'L') for f in ks}), 'kareler': list(ks),
                      'not': 'v8.4: kolun erişimi (omuz–bilek / kol boyu), dirsek bükümü, bilek bükümü ve bilekte kalan burgu (önkol '
                             'burgu kemiğinin almadığı); en kötü kare. Avuç yukarı dönüşü önkolda, bilek düz.'}
        if ad in kareler:   # avucun tabana oturuşu (soketten: büst el.R'ye bağlı)
            t_ = Vector(m['bust']['el_yerel']) / MM; q = m['bust']['el_yerel_q']
            L = Matrix.Translation(t_) @ Quaternion((q[3], q[0], q[1], q[2])).to_matrix().to_4x4()
            def _B(f): kare_ayarla(a, f); return rig.pose.bones['el.R'].matrix @ L
            m['bilek']['avuc_taban_mm'] = [avuc_taban(a, f, _B(f)) for f in ks]
        a['site_meta'] = json.dumps(m, ensure_ascii=False)
        OLCUM_V84[ad] = {str(f): v for f, v in o.items()}
    print('BILEK84', json.dumps({k: bilek_en_kotu({int(f): v for f, v in d.items()}) for k, d in OLCUM_V84.items() if k.startswith('bust_') and isinstance(d, dict)}, ensure_ascii=False))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# Fare (v8.4): biçim core/oda-olcu.js OLCU.MOUSE.form (gerçek mm, ölçeksiz; önü +y, sağı +x, taban merkezi orijin). Odadaki ağ
# (core/oda-sahne.js ergonomikFare) aynı formülle kurulur. Klipte fare 'olcek' katı, Biggie'ye göre: önü karakterin önüne (−y),
# FARE_YAW kadar dönük.
def _form(): return olcu_oku()['MOUSE']['form']


def fare_a(F, y): return F['a_on'] + (F['a_arka'] - F['a_on']) * (0.5 - 0.5 * y / F['b'])


def fare_s(F, x, y):
    return ((abs(x) / fare_a(F, y)) ** F['n'] + (abs(y) / F['b']) ** F['n']) ** (1 / F['n'])


def fare_ust(F, x, y):
    """tabanın üstünde sırtın yüksekliği (oluksuz): arkada yüksek, öne alçalır, sağa eğimli, kenarda yuvarlanır"""
    s = fare_s(F, x, y)
    if s >= 1: return 0.0
    t = y - F['yp']
    hl = 1 - F['on_dus'] * (t / (F['b'] - F['yp'])) ** 2 if t >= 0 else 1 - F['arka_dus'] * (t / (F['b'] + F['yp'])) ** 2
    return F['H'] * hl * (1 - F['egim'] * x / fare_a(F, y)) * math.sqrt(1 - s ** F['kenar'])


def fare_oluk(F, x, y, z):
    """sol yanda başparmak oluğu: x'in çarpanı (yan duvar orta yükseklikte içeri çekilir)"""
    if x >= 0: return 1.0
    zr = (z - F['taban']) / F['H']
    return 1 - F['oluk'] * math.exp(-((y - F['oluk_y']) / F['oluk_yy']) ** 2) * math.exp(-((zr - F['oluk_z']) / F['oluk_zz']) ** 2)


def fare_R(F, th):
    """tuş ekinin merkezinden (0, ys) θ yönünde dış çizgiye uzaklık"""
    c, d = Vector((0, F['ys'])), Vector((math.cos(th), math.sin(th)))
    lo, hi = 0.0, 2 * F['b']
    for _ in range(40):
        m = (lo + hi) / 2; p = c + d * m
        if fare_s(F, p.x, p.y) < 1: lo = m
        else: hi = m
    return lo


def fare_nokta(F, th, rho, R=None):
    R = fare_R(F, th) if R is None else R
    x, y = rho * R * math.cos(th), F['ys'] + rho * R * math.sin(th)
    z = F['taban'] + fare_ust(F, x, y)
    return Vector((x * fare_oluk(F, x, y, z), y, z))


def fare_ag(F, M=96, N=28):
    """kapalı dış yüzey (sırt + tuşlar yarıksız, taban şeridi, alt yüz): ölçüm ve önizleme için (gerçek mm)"""
    th = [2 * math.pi * j / M for j in range(M)]; R = [fare_R(F, t) for t in th]
    rh = [math.sin(math.pi / 2 * i / N) for i in range(N + 1)]
    vs = [fare_nokta(F, 0, 0, 1.0)]; fs = []
    for i in range(1, N + 1):
        vs += [fare_nokta(F, th[j], rh[i], R[j]) for j in range(M)]
    ix = lambda i, j: 1 + (i - 1) * M + j % M
    fs += [(0, ix(1, j), ix(1, j + 1)) for j in range(M)]
    for i in range(1, N): fs += [(ix(i, j), ix(i + 1, j), ix(i + 1, j + 1), ix(i, j + 1)) for j in range(M)]
    b0 = len(vs); vs += [Vector((vs[ix(N, j)].x, vs[ix(N, j)].y, 0.0)) for j in range(M)]
    fs += [(ix(N, j), b0 + j, b0 + (j + 1) % M, ix(N, j + 1)) for j in range(M)]
    vs.append(Vector((0, F['ys'], 0.0))); fs += [(len(vs) - 1, b0 + (j + 1) % M, b0 + j) for j in range(M)]
    return vs, fs


_FARE = {}


def fare_bvh():
    if not _FARE:
        F = _form(); vs, fs = fare_ag(F)
        _FARE.update(F=F, vs=vs, fs=fs, bvh=BVHTree.FromPolygons(vs, fs), en=max(abs(v.x) for v in vs) * 2,
                     boy=max(v.y for v in vs) - min(v.y for v in vs), yuk=max(v.z for v in vs))
    return _FARE


def fare_ici(F, q):
    if q.z < 0: return False
    x = q.x / fare_oluk(F, q.x, q.y, q.z) if q.x < 0 else q.x
    return fare_s(F, x, q.y) < 1 and q.z <= F['taban'] + fare_ust(F, x, q.y)


def fare_uzak(noktalar, M):
    """noktalar (armatür uzayı) → fare yüzeyine en küçük işaretli uzaklık (mm, sahnedeki boyda; − içeride)"""
    D = fare_bvh(); Mi = M.inverted(); en = 999.0; k = D['F']['olcek']
    for p in noktalar:
        q = Mi @ p; loc, n, _, d = D['bvh'].find_nearest(q)
        if loc is None: continue
        en = min(en, (-d if fare_ici(D['F'], q) else d) * k)
    return en


def fare_M(C):
    """farenin dönüşümü (gerçek mm → karakter yereli, Blender birimi): taban merkezi C, önü karakterin önüne, FARE_YAW"""
    k = _form()['olcek'] / MM
    return Matrix.Translation(C) @ Matrix.Rotation(math.radians(FARE_YAW), 4, 'Z') @ Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(k, 4)


def fare_sirt(F, x, y, h=0.4):
    """sırtın noktası ve dışa normali (fare yereli, gerçek mm; oluk sol yanda, sırtta etkisiz)"""
    z = lambda a, b: F['taban'] + fare_ust(F, a, b)
    n = Vector((-(z(x + h, y) - z(x - h, y)) / (2 * h), -(z(x, y + h) - z(x, y - h)) / (2 * h), 1)).normalized()
    return Vector((x, y, z(x, y))), n


# Avucun temas noktası: sağ avuç ağının iç yüzünde, işaret ile orta parmağın arasının hizasında (el yereli x +18 mm, bilekten
# 62 mm): fare tuşlarının yarığı iki parmağın arasına gelir. Dinlenme çerçevesinde bileğe göre (armatür uzayı; avuc()'un biçimi)
def avuc_temas(x_mm=18.0, y_mm=62.0):
    Mr = REST['el.R']; o = bpy.data.objects['sağ avuç']; inv = Mr.inverted() @ rig.matrix_world.inverted()
    vs = [inv @ (o.matrix_world @ v.co) for v in o.data.vertices]
    me = o.data; me.calc_loop_triangles()
    bvh = BVHTree.FromPolygons(vs, [tuple(t.vertices) for t in me.loop_triangles])
    h = bvh.ray_cast(Vector((x_mm * U, y_mm * U, 0.2)), Vector((0, 0, -1)))   # avuç içi el yerelinde +z yüzünde
    if h[0] is None: raise RuntimeError('avuç temas noktası bulunamadı')
    return tuple(Mr.to_3x3() @ h[0])


# y_m, x_m: avucun temas noktası farenin sırtında (gerçek mm; tepenin hemen arkası, yarığın 3 mm solu); yatis: el parmak ekseninde
# sağa yatar (derece); kok_ac: parmak köklerinin açılması (derece, − parmaklar kalkar: avuç tepeyi aşar, uçlar tuşlara kıvrılır);
# dirsek: sağ dirsek hedefi (yanda, alçakta: önkol yataya yakın, bilek düz); egil, bosluk, kivrim, bas: _fare_ayarla ölçer
FARE_PAR = {'y_m': -22.0, 'x_m': -3.0, 'bosluk': 0.6 * U, 'egil': 0.0, 'yatis': 16.0, 'kok_ac': -12.0, 'dirsek': (-0.25, 0.0, 0.2),
            'kivrim': {1: 0.0, 2: 0.0, 3: 0.2, 4: 0.3}, 'bas': -0.3}
FARE_PARMAK = {1: 'sağ parmak 1', 2: 'sağ parmak 2', 3: 'sağ parmak 3', 4: 'sağ parmak 4', 'bas': 'sağ başparmak', 'avuc': 'sağ avuç'}


def fare_merkez():
    """fare merkezi (karakter yereli): odadaki masa + mat yüksekliğinde; x odada farenin evi mat üstünde kalsın diye
    (core/oda-sunum.js fareEvi: dünya x ≤ −620 → yerel x ≥ −340)"""
    o = olcu_oku()
    return Vector((-338.0, -415.0, o['DESK']['top'] + o['MAT']['t'] - 335)) * U


def fare_hedef(M, nokta_bosluk=None):
    """avucun hedefi (armatür uzayı): sırttaki temas noktası + normal × boşluk; parmaklar farenin önüne (sırta teğet), avuç sırta"""
    F = _form(); P, n = fare_sirt(F, FARE_PAR['x_m'], FARE_PAR['y_m'])
    R3 = M.to_3x3().normalized(); nw = (R3 @ n).normalized(); fw = (R3 @ Vector((0, 1, 0))).normalized()
    fw = (fw - nw * fw.dot(nw)).normalized()
    b = FARE_PAR['bosluk'] if nokta_bosluk is None else nokta_bosluk
    p = M @ P + nw * b
    # el parmak ekseninde sağa yatar (serçe tarafı aşağı, başparmak tarafı yukarı): ergonomik farede avuç sırtın eğimini izler
    av = Matrix.Rotation(math.radians(FARE_PAR['yatis']), 3, fw) @ (-nw)
    return p, (tuple(fw), tuple(av))


def fare_S(son, Cf, tut=(1, None), egil=None, sabit=False):
    """fare klibi tanımı. sabit: 3 karelik ölçüm klibi (el hep farede, eğilme ve kıvrım sabit)"""
    S = {'taban_akt': (KLAVYE, 1), 'bacak_fk': True, 'nefes': 0.0 if sabit else 0.6, 'canli': 0.0 if sabit else 0.35, 'nefes_uc': True}
    L = FARE_PAR['egil'] if egil is None else egil
    if sabit:
        p, y = fare_hedef(fare_M(Cf(1)))
        S['el'] = {'R': {'ik': [[1, 1], [son, 1]], 'nokta': AVUC_NOKTA, 'yer': [(1, tuple(p)), (son, tuple(p))], 'yon': [(1, y), (son, y)],
                         'dirsek': [(1, FARE_PAR['dirsek']), (son, FARE_PAR['dirsek'])]}}
        S['parmak'] = {'R': [[1, 0.0], [son, 0.0]]}
        S['parmak_tek'] = {'R': {i: [[1, c], [son, c]] for i, c in FARE_PAR['kivrim'].items()}}
        S['parmak_ek'] = {'R': {i: [[1, FARE_PAR['kok_ac']], [son, FARE_PAR['kok_ac']]] for i in (1, 2, 3, 4)}}
        S['basparmak'] = {'R': [[1, FARE_PAR['bas']], [son, FARE_PAR['bas']]]}
        S['don'] = {'omurga': {'X': [[1, L], [son, L]], 'Z': [[1, -3], [son, -3]]}, 'göğüs': {'X': [[1, 0.5 * L], [son, 0.5 * L]]},
                    'omuz.R': {'Y': [[1, 4], [son, 4]]}}
        S['yaysiz'] = True; S['gecikmesiz'] = True
        return S
    TUT0, TUT1 = tut
    a0 = klip_kur('_fare0', 3, dict(S, el={})); kare_ayarla(a0, 1); P0 = tuple(el_noktasi('R', AVUC_NOKTA)); _, Y0 = el_poz(a0, 1, 'R')
    bpy.data.actions.remove(a0)
    H = {f: fare_hedef(fare_M(Cf(f))) for f in range(1, son + 1)}
    kalk = lambda f, dz, dy=0.0: tuple(Vector(H[f][0]) + Vector((0, dy * U, dz * U)))
    yer = [(1, P0), (8, tuple(Vector(P0) + Vector((-0.02, 0.0, 0.03)))), (16, kalk(TUT0, 40, 15)), (TUT0, tuple(H[TUT0][0]))]
    yer += [(f, tuple(H[f][0])) for f in range(TUT0 + 2, TUT1, 2)] + [(TUT1, tuple(H[TUT1][0])), (136, kalk(TUT1, 40, 15)),
            (144, tuple(Vector(P0) + Vector((-0.02, 0, 0.03)))), (son, P0)]
    yon = [(1, Y0), (10, Y0), (16, H[TUT0][1])] + [(f, H[f][1]) for f in range(TUT0, TUT1 + 1, 2)] + [(TUT1, H[TUT1][1]), (136, H[TUT1][1]), (142, Y0), (son, Y0)]
    S['el'] = {'R': {'ik': [[1, 0], [6, 1], [146, 1], [son, 0]], 'nokta': AVUC_NOKTA, 'yer': yer, 'yon': yon,
                     'dirsek': [(1, (-0.3, 0.05, 0.35)), (TUT0, FARE_PAR['dirsek']), (TUT1, FARE_PAR['dirsek']), (son, (-0.3, 0.05, 0.35))]}}
    S['parmak'] = {'R': [[1, 0.2], [14, 0.05], [TUT0, 0.0], [TUT1, 0.0], [136, 0.05], [son, 0.2]]}
    S['parmak_tek'] = {'R': {i: [[1, 0.2], [14, 0.05], [TUT0 - 2, c], [TUT1 + 2, c], [136, 0.05], [son, 0.2]] for i, c in FARE_PAR['kivrim'].items()}}
    e = FARE_PAR['kok_ac']
    S['parmak_ek'] = {'R': {i: [[1, 0], [TUT0 - 2, e], [TUT1 + 2, e], [son, 0]] for i in (1, 2, 3, 4)}}
    b = FARE_PAR['bas']
    S['basparmak'] = {'R': [[1, 0.1], [TUT0 - 4, 0.0], [TUT0, b], [TUT1, b], [TUT1 + 4, 0.0], [son, 0.1]]}
    S['don'] = {'omurga': {'Z': [[1, 0], [30, -3], [120, -3], [son, 0]], 'X': [[1, 0], [TUT0 - 4, L], [TUT1 + 4, L], [son, 0]]},
                'göğüs': {'X': [[1, 0], [TUT0 - 4, 0.5 * L], [TUT1 + 4, 0.5 * L], [son, 0]]},
                'omuz.R': {'Y': [[1, 0], [TUT0, 4], [TUT1, 4], [son, 0]]}}
    return S


def fare_olc(act, f, M):
    """bir karede elin fareye oturuşu (mm): avuç, her parmak ve başparmağın fareye en küçük işaretli uzaklığı (− içeride),
    parmak uçlarının farenin ön kenarına payı (+ gerisinde), bileğin masadan yüksekliği"""
    kare_ayarla(act, f)
    N = ag_noktalari(tuple(FARE_PARMAK.values()))
    o = {str(k): round(fare_uzak(N[a][::2], M), 1) for k, a in FARE_PARMAK.items()}
    D = fare_bvh(); Mi = M.inverted(); k = D['F']['olcek']
    on = max(v.y for v in D['vs'])
    o['on_kenar'] = round(min(on - (Mi @ p).y for a in ('sağ parmak 1', 'sağ parmak 2', 'sağ parmak 3', 'sağ parmak 4') for p in N[a][::2]) * k, 1)
    o['bilek_z'] = round((rig.pose.bones['el.R'].head.z - M.translation.z) * MM, 1)
    return o


def _fare_ayarla(Cf):
    """sabit tutuşu ölçerek ayarlar: (1) Biggie'nin öne eğilmesi: kol erişimi ≤ 0,92; (2) avucun boşluğu: avuç ağı sırta
    0,5–1 mm; (3) her parmağın ve başparmağın kıvrımı: fareye girmeyen en büyük (ikiye bölme)"""
    def kur(L=None):
        S = fare_S(3, Cf, egil=L, sabit=True); a = klip_kur('_fare_olc', 3, S); return a
    for L in (0.0, 4.0, 8.0, 12.0, 16.0):
        a = kur(L); e = bilek_olc(a, 2)['erisim']; bpy.data.actions.remove(a)
        FARE_PAR['egil'] = L
        if e <= 0.88: break
    for _ in range(4):
        a = kur(); o = fare_olc(a, 2, fare_M(Cf(2))); bpy.data.actions.remove(a)
        FARE_PAR['bosluk'] -= max(-15, min(15, o['avuc'] - 0.8)) * U * 0.9
    # serçe en çok 0,45 (fazlası avucun altında yumruk düğümü gibi durur): sağ yana değmezse yanda asılı kalır
    hedef = {1: (-0.4, 0.8), 2: (-0.4, 0.8), 3: (-0.4, 0.6), 4: (-0.4, 0.45), 'bas': (-0.9, 0.8)}
    lo = {k: v[0] for k, v in hedef.items()}; hi = {k: v[1] for k, v in hedef.items()}
    for _ in range(7):
        for k in hedef:
            v = (lo[k] + hi[k]) / 2
            if k == 'bas': FARE_PAR['bas'] = v
            else: FARE_PAR['kivrim'][k] = v
        a = kur(); o = fare_olc(a, 2, fare_M(Cf(2))); bpy.data.actions.remove(a)
        for k in hedef:
            v = FARE_PAR['bas'] if k == 'bas' else FARE_PAR['kivrim'][k]
            if o[str(k)] >= 0.8: lo[k] = v
            else: hi[k] = v
    for k in hedef:
        if k == 'bas': FARE_PAR['bas'] = round(lo[k], 3)
        else: FARE_PAR['kivrim'][k] = round(lo[k], 3)
    a = kur(); o = fare_olc(a, 2, fare_M(Cf(2))); o.update(bilek_olc(a, 2)); bpy.data.actions.remove(a)
    OLCUM_V84['fare_tutus'] = {'egil': FARE_PAR['egil'], 'bosluk_mm': round(FARE_PAR['bosluk'] * MM, 2), 'kivrim': dict(FARE_PAR['kivrim']),
                               'bas': FARE_PAR['bas'], 'olcu_mm': o}
    print('FARE84', json.dumps(OLCUM_V84['fare_tutus'], ensure_ascii=False))
    return o


def v82_fare():
    """v8.4 fare (adı kaynak-kur'un çağrısı için aynı): ergonomik fareyi avuçla kavrar, gezdirir, işaret parmağıyla tıklar"""
    global AVUC_NOKTA
    AVUC_NOKTA = avuc_temas()
    D = fare_bvh(); F = D['F']; k = F['olcek']
    FARE['olcu'] = (round(D['en'] * k), round(D['boy'] * k), round(D['yuk'] * k))
    FARE['merkez'] = fare_merkez()
    son = 151; TUT0, TUT1 = 22, 128
    C0 = FARE['merkez']
    # farenin masadaki yolu (yerel mm): v8.3'tekinin x'i %80 (odada mat içinde kalsın)
    yol = [(1, (0, 0)), (TUT0, (0, 0)), (34, (10, 8)), (44, (-14, 14)), (52, (-16, 12)), (62, (20, -10)), (70, (32, -22)), (78, (30, -20)),
           (92, (-5, 18)), (104, (-8, 20)), (114, (6, 4)), (TUT1, (0, 0)), (son, (0, 0))]
    Cf = lambda f: C0 + Vector((*(Vector(vanahtar([(kk, (x * U, y * U, 0)) for kk, (x, y) in yol], f))[:2]), 0))
    olc0 = _fare_ayarla(Cf)
    S = fare_S(son, Cf, tut=(TUT0, TUT1))
    tik = [54, 58, 80, 108]
    e = FARE_PAR['kok_ac']   # işaret parmağı tıklar: kök açıklığının üstüne 4° iner
    S['parmak_ek']['R'][1] = [[1, 0], [TUT0 - 2, e]] + [kv for t_ in tik for kv in ([t_ - 2, e], [t_, e + 4], [t_ + 2, e])] + [[TUT1 + 2, e], [son, 0]]
    S['bak'] = {'agirlik': [[1, 0], [10, 0.25], [30, 0], [son, 0]], 'yer': [(1, tuple(C0)), (son, tuple(C0))]}
    act = kol_coz('fare', son, S, {'R': [(TUT0, TUT1)]})
    Mf = lambda f: Matrix.Translation(Cf(f)) @ Matrix.Rotation(math.radians(FARE_YAW), 4, 'Z')
    t_, q_ = soket(act, 60, 'el.R', Mf(60))
    Lr = rig.pose.bones['el.R'].matrix.inverted() @ Mf(60); kay = 0.0
    for f in range(TUT0, TUT1 + 1, 2):
        kare_ayarla(act, f); kay = max(kay, ((rig.pose.bones['el.R'].matrix @ Lr).translation - Cf(f)).length)
    kk = [f for f in range(TUT0, TUT1 + 1, 6) if all(abs(f - t_) > 2 for t_ in tik)] + [TUT1]   # tık anları ayrı (tik_isaret_mm)
    olc = {f: fare_olc(act, f, fare_M(Cf(f))) for f in kk}
    bl = {f: bilek_olc(act, f) for f in kk}
    tik_olc = {f: fare_olc(act, f, fare_M(Cf(f)))['1'] for f in tik}
    otur = {'avuc_mm': [min(o['avuc'] for o in olc.values()), max(o['avuc'] for o in olc.values())],
            'parmak_min_mm': min(min(o[str(i)] for i in (1, 2, 3, 4)) for o in olc.values()),
            'parmak_max_mm': max(max(o[str(i)] for i in (1, 2)) for o in olc.values()),
            'basparmak_mm': [min(o['bas'] for o in olc.values()), max(o['bas'] for o in olc.values())],
            'on_kenar_min_mm': min(o['on_kenar'] for o in olc.values()), 'bilek_z_mm': [min(o['bilek_z'] for o in olc.values()), max(o['bilek_z'] for o in olc.values())],
            'tik_isaret_mm': min(tik_olc.values())}
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': True, 'dongu': [1, son], 'masa': True, 'z': 335, 'koltuk': -7.5, 'tut': [TUT0, TUT1], 'tik': tik,
        'fare': {'kemik': 'el.R', 'el_yerel': t_, 'el_yerel_q': q_, 'nokta': 'farenin taban merkezi (masada)', 'olcu_mm': list(FARE['olcu']), 'yaw_derece': FARE_YAW,
                 'olcek_onerisi': k, 'masa_z_mm': round(C0.z * MM), 'merkez_mm': mm(C0), 'form': 'ergonomik_sag_v84', 'form_ayar': F,
                 'yol': [[f, mm(Cf(f))] for f in range(1, son + 1, 2)] + [[son, mm(Cf(son))]], 'el_kayma_mm': round(kay * MM, 1),
                 'oturus': otur, 'bilek': bilek_en_kotu(bl),
                 'not': 'v8.4: siyah ergonomik sağ el faresi (biçim form_ayar = OLCU.MOUSE.form, odadaki ağla aynı; olcek katı). Avuç farenin '
                        'sırtında (tepenin arka yamacı), işaret (parmak 1) ve orta (2) tuşlarda, yüzük ve serçe sağ yanda, başparmak sol '
                        'oluğunda; oturus: avuç ve parmakların fareye uzaklığı (mm, − içeride), parmak uçlarının ön kenara payı. '
                        'tut aralığında fare el.R soketiyle (ya da yol + yaw_derece; soketin çerçevesi yaw\'a dönük, fare önü −y) gider.'},
        'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1),
        'not': 'v8.4: yaz (Klavye Tuşlama) 1. karesinden başlar ve ona döner; tutarken öne eğilir (omurga). Sol el klavyede.'}, ensure_ascii=False)
    OLCUM_V84['fare'] = {'el_kayma_mm': round(kay * MM, 1), 'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1), 'oturus': otur, 'bilek': bilek_en_kotu(bl),
                         'kare': {str(f): o for f, o in olc.items()}, 'tik': tik_olc}
    OLCUM_V82['fare'] = {'el_kayma_mm': round(kay * MM, 1), 'hata_mm': OLCUM_V84['fare']['hata_mm']}
    print('FARE84_KLIP', json.dumps({kk_: OLCUM_V84['fare'][kk_] for kk_ in ('el_kayma_mm', 'hata_mm', 'oturus', 'bilek')}, ensure_ascii=False))
    return [act]
