# Biggie v8.2 klipleri (2026-11-05, kullanıcı geri bildirimi; meta: oktos-dijital-site/senaryo/klip-meta-v5.md "v8.2"):
#   büst   bust_al_alt / bust_al_orta (raftan alır, tutuşa getirir), bust_birak_alt / _orta (tersi), bust_tut (ayakta bekleme
#          döngüsü), bust_tut_yuru (yürürken; ikisi de üst gövde katmanı). Tutuş: sağ el AÇIK, avuç yukarı, büstü tabanından
#          taşır; sol el belinden arkadan (Biggie'ye bakan yüzden) kavrar, parmaklar sağ yanına sarılır; baş ve gözler büste.
#          Parmakların büste girmesi gerçek büst modeliyle (assets/cati/modeller, 280 mm) ölçülüp kıvrım ona göre seçilir.
#   masa   fare (sağ el fareyi kavrar, gezdirir, işaret parmağıyla tıklar); Klavye Tuşlama'ya tuş basmaları (parmak ucu
#          her basışta iner; tus meta'sı).
#   elma   elma_isir_1..4 (tutuştan kaldırır, k. ısırık, indirir, tutar), elma_tut (bekleme), elma_tut_yuru (yürürken; üst
#          gövde), elma_firlat meta'sı (bırakma karesi, noktası, önerilen hız).
# Girdi: karakter-klip-eylem.py exec edilmiş ve eylemleri_kur() çalışmış olmalı (klip_kur, kol_coz, elma_ye, ELMA_*).
# Çıktı: "Hareket - <ad>" aksiyonları ve site_meta; OLCUM_V82 (ölçümler). Tekrar çalıştırmak güvenli.
import bpy, json, math, os
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

OLCUM_V82 = {}
YURUME = 'Hareket - Yürüme'


def hizala_avuc(ad, son, S, kareler, tur=2):
    """kareler {t: [(a, b, avuç_fn, bükum)]}: avuç yönü avuç_fn(f) (armatür uzayı); parmaklar ölçülen önkolun avuç düzlemine
    izdüşümü (bilek düz), bükum derece avuca doğru. S['el'][t]['yon'] o aralıklarda yeniden yazılır."""
    for _ in range(tur):
        act = klip_kur(ad, son, S)
        for t, ar in kareler.items():
            E = S['el'][t]; yeni = {}
            for a, b, fn, bk in ar:
                for f in sorted(set(range(a, b + 1, 2)) | {b}):
                    kare_ayarla(act, f); pb = rig.pose.bones
                    d = (pb['el.' + t].head - pb['ön_kol.' + t].head).normalized(); n = Vector(fn(f)).normalized()
                    fp = (d - n * d.dot(n)).normalized(); b_ = math.radians(bk)
                    fp = (fp * math.cos(b_) + n * math.sin(b_)).normalized()
                    yeni[f] = (tuple(fp), tuple(n))
            E['yon'] = sorted([(f, v) for f, v in E['yon'] if not any(a <= f <= b for a, b, _, _ in ar)] + list(yeni.items()), key=lambda x: x[0])
        bpy.data.actions.remove(act)
    return S


def el_poz(act, f, t):
    """el'in o karedeki yönü (parmak, avuç) ve avuç noktası (tutma), armatür uzayı: IK'sız (FK) klipten IK'ya geçiş için"""
    kare_ayarla(act, f); pb = rig.pose.bones
    R = pb['el.' + t].matrix.to_3x3() @ REST['el.' + t].to_3x3().inverted()
    f0 = Vector((1 if t == 'L' else -1, 0, 0))
    return tuple(el_noktasi(t)), (tuple(R @ f0), tuple(R @ Vector((0, -1, 0))))


def soket(act, f, kemik, M):
    """M (armatür uzayında nesne dönüşümü) kemiğin yerelinde: (el_yerel mm, el_yerel_q [x, y, z, w])"""
    kare_ayarla(act, f); L = rig.pose.bones[kemik].matrix.inverted() @ M
    t_, q_, _ = L.decompose()
    return mm(t_), [round(x, 4) for x in (q_.x, q_.y, q_.z, q_.w)]


def gogus_M(act, f):
    kare_ayarla(act, f); return rig.pose.bones['göğüs'].matrix.copy()


# ---------------------------------------------------------------------------------------------------------------------
# Büst modeli: portfolyo GLB'si (Z yukarı), 280 mm boya ölçeklenir; taban merkezi orijin. Ölçüm ve el yerleşimi için.
BUST = {'boy': 280, 'model': 'akademi-atlisi.glb', 'raf_on': 280, 'raf_ic': 100}
_BM = {}


def bust_model():
    if _BM: return _BM
    yol = os.path.join(KOK, 'assets', 'cati', 'modeller', BUST['model'])
    onceki = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=yol)
    yeni = [o for o in bpy.data.objects if o not in onceki]
    dg = bpy.context.evaluated_depsgraph_get(); vs, fs = [], []
    for o in yeni:
        if o.type != 'MESH': continue
        oe = o.evaluated_get(dg); me = oe.to_mesh(); n0 = len(vs)
        vs += [oe.matrix_world @ v.co for v in me.vertices]
        me.calc_loop_triangles(); fs += [tuple(n0 + i for i in tr.vertices) for tr in me.loop_triangles]
        oe.to_mesh_clear()
    for o in yeni: bpy.data.objects.remove(o, do_unlink=True)
    dims = [max(v[i] for v in vs) - min(v[i] for v in vs) for i in range(3)]
    ax = dims.index(max(dims))
    if ax == 1: vs = [Vector((v.x, -v.z, v.y)) for v in vs]          # içe aktarıcı Z yukarı dosyayı yatırdı: geri kaldır
    elif ax == 0: vs = [Vector((-v.z, v.y, v.x)) for v in vs]
    z0, z1 = min(v.z for v in vs), max(v.z for v in vs); H = z1 - z0
    en = lambda a, b: [v for v in vs if a <= (v.z - z0) / H <= b]
    alt, ust = en(0, 0.08), en(0.92, 1)
    gen = lambda P: (max(v.x for v in P) - min(v.x for v in P)) * (max(v.y for v in P) - min(v.y for v in P))
    if gen(ust) > gen(alt): vs = [Vector((v.x, -v.y, z0 + z1 - v.z)) for v in vs]   # taban altta (geniş uç): x ekseninde 180° (yansıma değil)
    z0 = min(v.z for v in vs); alt = [v for v in vs if v.z - z0 < 0.02 * H]
    c = Vector(((max(v.x for v in alt) + min(v.x for v in alt)) / 2, (max(v.y for v in alt) + min(v.y for v in alt)) / 2, z0))
    k = BUST['boy'] / MM / H
    vs = [(v - c) * k for v in vs]
    Hb = BUST['boy'] / MM
    bel = [v for v in vs if abs(v.z - 0.3 * Hb) < 0.03 * Hb]
    bvh = BVHTree.FromPolygons(vs, fs)
    dis = Vector((0, 0, 3 * Hb)); loc, n, _, _ = bvh.find_nearest(dis)
    _BM['isaret'] = 1.0 if (dis - loc).dot(n) > 0 else -1.0       # yüz yönü içe dönükse işaret çevrilir
    _BM.update(verts=vs, faces=fs, bvh=bvh, H=Hb,
               taban=[round((max(v.x for v in alt) - min(v.x for v in alt)) * k * MM), round((max(v.y for v in alt) - min(v.y for v in alt)) * k * MM)],
               bel_y=max(v.y for v in bel if abs(v.x) < 0.02 * Hb), bel_x=max(abs(v.x) for v in bel), ic=Vector((0, 0, 0)))
    print('BUST model', BUST['model'], 'taban mm', _BM['taban'], 'bel_y mm', round(_BM['bel_y'] * MM), 'bel_x mm', round(_BM['bel_x'] * MM))
    return _BM


def bust_ici(q, bvh):
    """nokta büstün içinde mi (yukarı ışının kesişim sayısı tek): modelin yüz yönleri tutarsız, normale güvenilmez"""
    n, p, yon = 0, q.copy(), Vector((0.0123, 0.0071, 1)).normalized()
    for _ in range(40):
        h = bvh.ray_cast(p, yon)
        if h[0] is None: break
        n += 1; p = h[0] + yon * 1e-5
    return n % 2 == 1


def bust_uzak(noktalar, B):
    """noktalar (armatür uzayı) → büst yüzeyine en küçük işaretli uzaklık (mm, − içeride); B büstün dönüşümü (taban merkezi)"""
    Bi = B.inverted(); bvh = bust_model()['bvh']; en = 999.0
    for p in noktalar:
        q = Bi @ p; loc, n, _, d = bvh.find_nearest(q)
        if loc is None: continue
        s = -d if d < 0.03 and bust_ici(q, bvh) else d
        en = min(en, s * MM)
    return en


PARMAK_AG = {t: [f'{y} parmak {i}' for i in range(1, 5)] for t, y in (('L', 'sol'), ('R', 'sağ'))}
AVUC_AG = {'L': ('sol avuç', 'sol başparmak'), 'R': ('sağ avuç', 'sağ başparmak')}


def el_bust_olc(act, f, B):
    kare_ayarla(act, f)
    N = ag_noktalari(PARMAK_AG['L'] + PARMAK_AG['R'] + list(AVUC_AG['L']) + list(AVUC_AG['R']) + ['kazak'])
    o = {}
    for t in 'LR':
        o['parmak_' + t] = round(bust_uzak([v for a in PARMAK_AG[t] for v in N[a][::2]], B), 1)
        o['avuc_' + t] = round(bust_uzak([v for v in N[AVUC_AG[t][0]][::2]], B), 1)
        o['basparmak_' + t] = round(bust_uzak([v for v in N[AVUC_AG[t][1]][::2]], B), 1)
    kz = bpy.data.objects['kazak']; gi = {g.index: g.name for g in kz.vertex_groups}
    gv = [i for i, v in enumerate(kz.data.vertices) if v.groups and gi[max(v.groups, key=lambda g: g.weight).group] in ('göğüs', 'omurga', 'kalça', 'karın', 'boyun')]
    o['govde'] = round(bust_uzak([N['kazak'][i] for i in gv[::2]], B), 1)   # kollar hariç gövde
    return o


# Tutuş geometrisi (Blender birimi, karakter yereli): taban merkezi B_TUT; sağ avuç tabanın altında (avuç yukarı), sol avuç
# belin arkasında (Biggie'ye bakan yüz, büstün +y'si), parmaklar −x (büstün sağ yanına sarılır). Ölçülerek ayarlanır.
TUT = {'B': Vector((-0.05, -0.19, 0.47)), 'R_alt': 0.010, 'L_arka': 0.012, 'L_kivrim': 0.45, 'R_kivrim': 0.12, 'R_bas': 0.15, 'L_bas': 0.35,
       'R_ofset': Vector((0.006, 0.004, 0)), 'govde_pay_mm': 8}
TUT_DON = {'omurga': {'Z': -6, 'X': 3}, 'göğüs': {'Z': -4, 'X': 2}}


def bust_merkez(B): return B @ Vector((0, 0, bust_model()['H'] / 2))


def bust_eller(B, f=None):
    """B (büst dönüşümü) için iki elin hedefi: {t: (avuç noktası, (parmak, avuç), dirsek)}"""
    M = bust_model()
    R = B @ (Vector((0, 0, -TUT['R_alt'])) + TUT['R_ofset'])
    L = B @ Vector((0.012, M['bel_y'] + TUT['L_arka'], 0.30 * M['H']))
    return {'R': (R, ((0.7, -0.7, 0), (0, 0, 1)), Vector((-0.30, -0.06, 0.36))),
            'L': (L, ((-1, 0, 0.18), (0, -1, 0)), Vector((0.24, -0.28, 0.44)))}


def tut_S(son, Bf, ik=None, bak=0.85):
    """tutuş klibi tanımı: Bf(f) büst dönüşümü; eller büste bağlı; gövde sağa döner; baş ve gözler büste"""
    S = {'don': {b: {ax: [[1, v], [son, v]] for ax, v in d.items()} for b, d in TUT_DON.items()}, 'nefes': 0.8, 'canli': 0.5, 'goz_bak': 0.4,
         'bak': {'agirlik': [[1, bak], [son, bak]], 'yer': [(f, tuple(bust_merkez(Bf(f)) + Vector((0, 0.02, 0.02)))) for f in sorted(set(range(1, son + 1, 4)) | {son})]}}
    S['el'] = {}
    for t in 'LR':
        yer, yon, dr = [], [], []
        for f in sorted(set(range(1, son + 1, 2)) | {son}):
            p, y, d = bust_eller(Bf(f))[t]; yer.append((f, tuple(p))); yon.append((f, y)); dr.append((f, tuple(d)))
        S['el'][t] = {'ik': ik or [[1, 1], [son, 1]], 'yer': yer, 'yon': yon, 'dirsek': dr}
    S['parmak'] = {'R': [[1, TUT['R_kivrim']], [son, TUT['R_kivrim']]], 'L': [[1, TUT['L_kivrim']], [son, TUT['L_kivrim']]]}
    S['basparmak'] = {'R': [[1, TUT['R_bas']], [son, TUT['R_bas']]], 'L': [[1, TUT['L_bas']], [son, TUT['L_bas']]]}
    return S


def tut_hizala(ad, son, S, aralik=None):
    a, b = aralik or (1, son)
    return hizala_avuc(ad, son, S, {'R': [(a, b, lambda f: (0, 0, 1), 0)], 'L': [(a, b, lambda f: (0, -1, 0), -4)]})


def tutus_bul():
    """sabit tutuşu ölçerek ayarlar: büst gövdeden ≥ govde_pay_mm, avuçlar büste 0–3 mm, parmak kıvrımı büste girmeyen en büyük"""
    B = lambda f: Matrix.Translation(TUT['B'])
    def olc():
        S = tut_S(3, B); S['canli'] = 0; S['nefes'] = 0; tut_hizala('_tut_olc', 3, S)
        act = klip_kur('_tut_olc', 3, S); o = el_bust_olc(act, 2, B(2)); o['hata'] = max(el_hatasi(act, S, t, 1, 3) for t in 'LR')
        bpy.data.actions.remove(act); return o
    for _ in range(6):   # gövde payı
        o = olc()
        if o['govde'] >= TUT['govde_pay_mm']: break
        d_ = min(25, TUT['govde_pay_mm'] - o['govde'] + 3) * U    # öne ve biraz yukarı (karın göğse doğru içeri çekilir)
        TUT['B'] = TUT['B'] + Vector((0, -d_, 0.5 * d_))
    for _ in range(3):   # avuçlar
        o = olc()
        TUT['R_alt'] -= max(-40, min(40, o['avuc_R'] - 1.5)) * U * 0.9
        TUT['L_arka'] -= max(-40, min(40, o['avuc_L'] - 1.5)) * U * 0.9
    for t in 'LR':       # kıvrım: büste girmeyen en büyük (ikiye bölme)
        lo, hi = 0.0, 0.9
        for _ in range(6):
            TUT[t + '_kivrim'] = (lo + hi) / 2; o = olc()
            if o['parmak_' + t] >= 1.0: lo = TUT[t + '_kivrim']
            else: hi = TUT[t + '_kivrim']
        TUT[t + '_kivrim'] = round(lo, 3)
        lo, hi = 0.0, 0.8
        for _ in range(5):
            TUT[t + '_bas'] = (lo + hi) / 2; o = olc()
            if o['basparmak_' + t] >= 1.0: lo = TUT[t + '_bas']
            else: hi = TUT[t + '_bas']
        TUT[t + '_bas'] = round(lo, 3)
    o = olc()
    OLCUM_V82['bust_tutus'] = {'olcu_mm': o, 'B_mm': mm(TUT['B']), 'kivrim': {t: TUT[t + '_kivrim'] for t in 'LR'}, 'basparmak': {t: TUT[t + '_bas'] for t in 'LR'}}
    print('TUTUS', OLCUM_V82['bust_tutus'])
    return o


def bust_al(var, h):
    """raftan alış (raf tabanı h mm; büst gözün ön kenarından BUST['raf_ic'] içeride, kök rafın önünden BUST['raf_on'] geride)"""
    son = 81
    M = bust_model()
    B_raf = Vector((-0.01, -(BUST['raf_on'] + BUST['raf_ic']) * U, h * U))
    AL, KALK, CEK, R_TUT, YER = 26, 32, 44, 52, 62
    yuksek = h > 900
    yol = [(1, B_raf), (AL, B_raf), (KALK, B_raf + Vector((0, 0.004, 0.012))), (CEK, B_raf.lerp(TUT['B'], 0.45) + Vector((0, 0.06, 0.03 if yuksek else 0.05))),
           (R_TUT, TUT['B'] + Vector((0.01, 0.0, 0.02))), (YER, TUT['B'] + Vector((0, 0, -0.004))), (68, TUT['B'] + Vector((0, 0, 0.002))), (74, TUT['B']), (son, TUT['B'])]
    Bf = lambda f: Matrix.Translation(vanahtar([(k, tuple(v)) for k, v in yol], f))
    S = tut_S(son, Bf)
    # gövde: rafa uzanır (öne eğilir; üst rafta parmak ucu), sonra doğrulup büstü sağına alır
    # v8.2b: alçak gözde baş üst rafın ön kenarına yaklaşıyordu: az eğilir, kol uzanır
    S['don'] = {'omurga': {'X': [[1, 0], [16, 3 if not yuksek else -4], [AL, 4 if not yuksek else -6], [CEK, 4], [YER, TUT_DON['omurga']['X']], [son, TUT_DON['omurga']['X']]],
                           'Z': [[1, 0], [AL, 2], [CEK, -2], [YER, TUT_DON['omurga']['Z']], [son, TUT_DON['omurga']['Z']]]},
                'göğüs': {'X': [[1, 0], [AL, 4 if not yuksek else -3], [CEK, 2], [YER, TUT_DON['göğüs']['X']], [son, TUT_DON['göğüs']['X']]],
                          'Z': [[1, 0], [AL, 0], [YER, TUT_DON['göğüs']['Z']], [son, TUT_DON['göğüs']['Z']]]}}
    S['kalca'] = [(1, (0, 0, 0)), (18, (0, -0.008, -0.016 if not yuksek else 0.01)), (AL, (0, -0.012, -0.028 if not yuksek else 0.02)), (CEK, (0, -0.005, -0.008)),
                  (YER, (0, 0.004, -0.004)), (son, (0, 0, 0))]
    S['ayak'] = {t: [(1, (0, 0, 0)), (son, (0, 0, 0))] for t in 'LR'}
    if yuksek: S['ayak_don'] = {t: [[1, 0], [12, 0], [22, 22], [34, 22], [44, 0], [son, 0]] for t in 'LR'}
    # sol el önden gelir (yanda sarkan → belin arkası), sağ el tabanın altına sağ-arkadan girer
    L = S['el']['L']; R = S['el']['R']
    L['ik'] = [[1, 0], [10, 1], [son, 1]]
    L['yer'] = [(1, (0.2, -0.07, 0.38)), (14, tuple(bust_eller(Bf(AL))['L'][0] + Vector((0.06, 0.06, -0.04))))] + [(f, p) for f, p in L['yer'] if f >= AL - 4]
    L['yon'] = [(1, SARK['L']), (14, ((-0.6, -0.6, 0.2), (-0.5, -0.5, -0.4)))] + [(f, y) for f, y in L['yon'] if f >= AL - 4]
    L['dirsek'] = [(1, (0.42, 0.05, 0.3))] + [(f, d) for f, d in L['dirsek'] if f >= AL - 4]
    R['ik'] = [[1, 0], [30, 0.2], [40, 1], [son, 1]]
    alt_ = lambda f: bust_eller(Bf(f))['R'][0]
    R['yer'] = [(1, (-0.2, -0.07, 0.38)), (30, (-0.22, -0.1, 0.36)), (40, tuple(alt_(40) + Vector((-0.06, 0.05, -0.07)))), (46, tuple(alt_(46) + Vector((-0.02, 0.01, -0.025))))] + \
               [(f, p) for f, p in R['yer'] if f >= R_TUT]
    R['yon'] = [(1, SARK['R']), (30, SARK['R']), (40, ((0.6, -0.6, 0.1), (0.2, 0, 1)))] + [(f, y) for f, y in R['yon'] if f >= R_TUT]
    R['dirsek'] = [(1, (-0.42, 0.05, 0.3))] + [(f, d) for f, d in R['dirsek'] if f >= R_TUT]
    S['parmak'] = {'L': [[1, 0.15], [16, 0.05], [AL - 2, 0.1], [AL + 2, TUT['L_kivrim']], [son, TUT['L_kivrim']]],
                   'R': [[1, 0.15], [36, 0.05], [R_TUT, TUT['R_kivrim']], [son, TUT['R_kivrim']]]}
    S['basparmak'] = {'L': [[1, 0.0], [AL - 2, 0.0], [AL + 2, TUT['L_bas']], [son, TUT['L_bas']]], 'R': [[1, 0.0], [R_TUT - 4, 0.0], [R_TUT, TUT['R_bas']], [son, TUT['R_bas']]]}
    S['bak']['agirlik'] = [[1, 0], [8, 0.85], [son, 0.85]]
    S['agiz'] = [[YER, 0], [70, 0.18], [78, 0]]
    S['nefes_uc'] = True
    ad = f'bust_al_{var}'
    hizala_avuc(ad, son, S, {'R': [(R_TUT, son, lambda f: (0, 0, 1), 0)], 'L': [(AL - 4, son, lambda f: (0, -1, 0), -4)]})
    act = kol_coz(ad, son, S, {'L': [(AL, son)], 'R': [(R_TUT, son)]})
    return act, S, Bf, dict(AL=AL, KALK=KALK, CEK=CEK, R_TUT=R_TUT, YER=YER), B_raf


def bust_tut():
    son = 121
    nf = lambda f: math.sin(2 * math.pi * (f - 1) / 120)
    Bf = lambda f: Matrix.Translation(TUT['B'] + Vector((0, 0, 0.0016 * nf(f))))
    S = tut_S(son, Bf)
    S['don']['kafa'] = {'Z': [[1, 0], [40, 5], [80, -3], [son, 0]], 'Y': [[1, 0], [50, 4], [100, -2], [son, 0]]}
    S['kirp'] = [30, 92]; S['canli'] = 0.4; S['nefes_uc'] = True
    tut_hizala('bust_tut', son, S)
    return kol_coz('bust_tut', son, S, {t: [(1, son)] for t in 'LR'}), S, Bf


def yuru_tasi(ad, son, S0, P0):
    """yürüme tabanında göğsün dönüşümüyle taşınan nokta: göğsün tutuş pozundaki (P0 klibinin 1. karesi) dönüşümüne göre"""
    act = klip_kur('_' + ad, son, dict(S0, el={}))
    G = {f: gogus_M(act, f) for f in range(1, son + 1)}
    bpy.data.actions.remove(act)
    G0 = gogus_M(P0, 1)
    return {f: g @ G0.inverted() for f, g in G.items()}


def bust_tut_yuru(tut_act):
    son = 43
    S0 = {'taban_akt': (YURUME, lambda f: f), 'don': {}, 'nefes': 0, 'canli': 0, 'gecikmesiz': True}
    T = yuru_tasi('bust_tut_yuru', son, S0, tut_act)
    Bf = lambda f: T[max(1, min(son, round(f)))] @ Matrix.Translation(TUT['B'])
    S = tut_S(son, Bf); S.update(S0); S['goz_bak'] = 0.4
    S['don'] = {b: {ax: [[1, v * 0.5], [son, v * 0.5]] for ax, v in d.items()} for b, d in TUT_DON.items()}
    tut_hizala('bust_tut_yuru', son, S)
    return kol_coz('bust_tut_yuru', son, S, {t: [(1, son)] for t in 'LR'}), S, Bf


def bust_meta_ortak(act, f, Bf):
    t_, q_ = soket(act, f, 'el.R', Bf(f))
    M = bust_model()
    return {'kemik': 'el.R', 'el_yerel': t_, 'el_yerel_q': q_, 'nokta': 'büstün taban merkezi (z yukarı, büstün ekseni)',
            'boy_mm': BUST['boy'], 'olcu_model': BUST['model'], 'taban_mm': M['taban'],
            'not': 'büst el.R\'ye bağlı (soket): taban merkezi kemiğin yerelinde el_yerel, dönüşü el_yerel_q ([x, y, z, w]). '
                   'Büst kendi dikey ekseninde dönmez; ön yüzünün yönü sitede seçilir (tutuş tabana ve bele dayanır, büst '
                   '100–130 mm genişlikte yaklaşık simetrik).'}


def v82_bust():
    global TUT
    bust_model(); tutus_bul()
    out = []; yol_meta = {}
    for var, h in (('alt', 725), ('orta', 1105)):
        act, S, Bf, K, B_raf = bust_al(var, h)
        son = int(act.frame_range[1])
        yol = [[f, mm(Bf(f).translation)] for f in range(1, son + 1, 2)] + [[son, mm(Bf(son).translation)]]
        olc = {f: el_bust_olc(act, f, Bf(f)) for f in (K['AL'], K['R_TUT'], K['YER'], son)}
        hata = {t: el_hatasi(act, S, t, a, son) for t, a in (('L', K['AL']), ('R', K['R_TUT']))}
        meta = {'sure': round((son - 1) / 30, 2), 'tekrar': False, 'raf_mm': h, 'raf_on_mm': BUST['raf_on'], 'al': K['AL'], 'iki_el': K['R_TUT'],
                'tutuldu': K['YER'], 'sonra': 'bust_tut',
                'bust': {**bust_meta_ortak(act, son, Bf), 'raf_nokta': mm(B_raf), 'yol': yol,
                         'yol_not': 'al karesine dek raf_nokta\'da; al–son arası yol (karakter yereli, mm, taban merkezi; dönüş yok); son karede '
                                    'el.R soketiyle aynı yer. Site ister yolu, ister al\'dan sonra soketi kullanır (fark ≤ hata_mm).'},
                'hata_mm': hata, 'olcu_mm': {str(k): v for k, v in olc.items()},
                'not': f'v8.2: kitaplık önünde (kök rafın ön kenarından raf_on_mm geride), raf tabanı {h} mm\'deki büstü sol eliyle belinden '
                       'arkadan kavrar, kaldırıp çeker, sağ avucu tabanın altına girer, büstü sağ önüne alır; baş ve gözler büste. '
                       'Son poz = bust_tut 1. karesi.'}
        act['site_meta'] = json.dumps(meta, ensure_ascii=False)
        bir, n = ters_klip(f'bust_birak_{var}', act, son, son, 2)
        g = lambda f: 2 + (son - f)
        bir['site_meta'] = json.dumps({'sure': round((n - 1) / 30, 2), 'tekrar': False, 'raf_mm': h, 'raf_on_mm': BUST['raf_on'],
            'tek_el': g(K['R_TUT']), 'koy': g(K['AL']), 'once': 'bust_tut',
            'bust': {**bust_meta_ortak(act, son, Bf), 'raf_nokta': mm(B_raf), 'yol': [[g(f), p] for f, p in reversed(yol)]},
            'not': f'v8.2: bust_al_{var}\'ın tersi: bust_tut pozundan büstü rafa (raf_nokta) koyar, koy karesinde bırakır, Durma\'ya döner.'}, ensure_ascii=False)
        OLCUM_V82[f'bust_al_{var}'] = {'el_bust_mm': {str(k): v for k, v in olc.items()}, 'el_hata_mm': hata}
        out += [act, bir]
    tut, S, Bf = bust_tut()
    for a in out[0::2]: uc_kilitle(a, tut, 1, bas=False, n=6)
    for a in out[1::2]: uc_kilitle(a, tut, 1, son=False, n=6)
    o = {f: el_bust_olc(tut, f, Bf(f)) for f in (1, 61, 121)}
    tut['site_meta'] = json.dumps({'sure': 4.0, 'tekrar': True, 'dongu': [1, 121], 'katman': 'ust', 'ust_kok': UST_KOK,
        'bust': bust_meta_ortak(tut, 1, Bf), 'olcu_mm': {str(k): v for k, v in o.items()},
        'not': 'v8.2: büstü tutarken ayakta bekleme (üst gövde katmanı, dur üstüne). Sağ el açık, avuç yukarı, tabanın altında; sol el '
               'belinde arkadan, parmaklar büstün sağ yanına sarılı; baş ve gözler büste. Büst el.R soketinde sabit açıyla.'}, ensure_ascii=False)
    yu, Sy, Bfy = bust_tut_yuru(tut)
    oy = {f: el_bust_olc(yu, f, Bfy(f)) for f in (1, 11, 22, 33)}
    yu['site_meta'] = json.dumps({'sure': round(42 / 30, 2), 'tekrar': True, 'dongu': [1, 43], 'katman': 'ust', 'ust_kok': UST_KOK, 'eslik': 'yuru',
        'bust': bust_meta_ortak(yu, 1, Bfy), 'olcu_mm': {str(k): v for k, v in oy.items()},
        'not': 'v8.2: büstle yürürken üst gövde katmanı (yuru üstüne; yuru ile aynı uzunlukta, aynı karede başlatın). Gövdenin '
               'salınımı yürümeden; büst göğüsle birlikte taşınır, eller aynı tutuşta.'}, ensure_ascii=False)
    OLCUM_V82['bust_tut'] = {str(k): v for k, v in o.items()}; OLCUM_V82['bust_tut_yuru'] = {str(k): v for k, v in oy.items()}
    return out + [tut, yu]


# ---------------------------------------------------------------------------------------------------------------------
# Masa: fare. Taban Klavye Tuşlama'nın 1. karesi (oturuş, sol el klavyede), bacaklar FK. Fare 1,8 kat (sitede 1,6–2):
# 105 × 190 × 65 mm; Blender sahnesinin masasında (üst 420 mm) klavyenin sağında. Sağ el klavyeden gelir, avucu farenin
# sırtına oturur (parmaklar düğmelerde, başparmak sol yanında), fareyi gezdirir, işaret parmağıyla tıklar, klavyeye döner.
FARE = {'olcu': (105, 190, 65), 'merkez': Vector((-405, -485, 420)) * U, 'olcek_onerisi': 1.8}
KLAVYE = 'Hareket - Klavye Tuşlama'


def v82_fare():
    son = 151
    S = {'taban_akt': (KLAVYE, 1), 'bacak_fk': True, 'nefes': 0.6, 'canli': 0.35, 'nefes_uc': True}
    a0 = klip_kur('_fare0', 3, dict(S, el={})); P0, Y0 = el_poz(a0, 1, 'R'); bpy.data.actions.remove(a0)
    ex, ey, ez = (v * U for v in FARE['olcu']); C0 = FARE['merkez']
    TUT0, TUT1 = 22, 128
    # farenin yolu (masada): küçük gezinmeler, hızlı bir sürükleme, tıklar
    yol = [(1, (0, 0)), (TUT0, (0, 0)), (34, (12, 8)), (44, (-18, 14)), (52, (-20, 12)), (62, (25, -10)), (70, (40, -22)), (78, (38, -20)),
           (92, (-6, 18)), (104, (-10, 20)), (114, (8, 4)), (TUT1, (0, 0)), (son, (0, 0))]
    Cf = lambda f: C0 + Vector((*(Vector(vanahtar([(k, (x * U, y * U, 0)) for k, (x, y) in yol], f))[:2]), 0))
    avuc = lambda f: Cf(f) + Vector((0, 0.022, ez + 0.009))     # avuç farenin arka-üstünde (parmaklar düğmelere uzanır)
    yer = [(1, P0), (8, tuple(Vector(P0) + Vector((-0.02, 0.0, 0.03)))), (16, tuple(avuc(TUT0) + Vector((0, 0.01, 0.035)))), (TUT0, tuple(avuc(TUT0)))]
    yer += [(f, tuple(avuc(f))) for f in range(TUT0 + 2, TUT1, 2)] + [(TUT1, tuple(avuc(TUT1))), (136, tuple(avuc(TUT1) + Vector((0, 0.01, 0.035)))),
            (144, tuple(Vector(P0) + Vector((-0.02, 0, 0.03)))), (son, P0)]
    S['el'] = {'R': {'ik': [[1, 0], [6, 1], [146, 1], [son, 0]], 'yer': yer, 'yon': [(1, Y0), (10, Y0), (TUT0, ((0.15, -1, -0.2), (0, 0, -1))), (TUT1, ((0.15, -1, -0.2), (0, 0, -1))), (142, Y0), (son, Y0)],
                     'dirsek': [(1, (-0.3, 0.05, 0.35)), (TUT0, (-0.42, 0.1, 0.3)), (TUT1, (-0.42, 0.1, 0.3)), (son, (-0.3, 0.05, 0.35))]}}
    S['parmak'] = {'R': [[1, 0.2], [14, 0.05], [TUT0, 0.32], [TUT1, 0.32], [136, 0.05], [son, 0.2]]}
    S['basparmak'] = {'R': [[1, 0.1], [TUT0 - 2, 0.0], [TUT0 + 2, 0.3], [TUT1 - 2, 0.3], [TUT1 + 2, 0.0], [son, 0.1]]}
    tik = [54, 58, 80, 108]   # işaret parmağı (parmak_1) iner ve kalkar
    S['parmak_ek'] = {'R': {1: [[1, 0]] + [kv for t_ in tik for kv in ([t_ - 2, 0], [t_, 9], [t_ + 2, 0])] + [[son, 0]]}}
    S['bak'] = {'agirlik': [[1, 0], [10, 0.25], [30, 0], [son, 0]], 'yer': [(1, tuple(C0)), (son, tuple(C0))]}
    S['don'] = {'omurga': {'Z': [[1, 0], [30, -3], [120, -3], [son, 0]]}, 'omuz.R': {'Y': [[1, 0], [TUT0, 4], [TUT1, 4], [son, 0]]}}
    hizala_avuc('fare', son, S, {'R': [(TUT0, TUT1, lambda f: (0, 0, -1), 10)]})
    act = kol_coz('fare', son, S, {'R': [(TUT0, TUT1)]})
    Mf = lambda f: Matrix.Translation(Cf(f))                       # farenin taban merkezi
    t_, q_ = soket(act, 60, 'el.R', Mf(60))
    kay = 0.0
    Lr = rig.pose.bones['el.R'].matrix.inverted() @ Mf(60)
    for f in range(TUT0, TUT1 + 1, 2):
        kare_ayarla(act, f); kay = max(kay, ((rig.pose.bones['el.R'].matrix @ Lr).translation - Cf(f)).length)
    act['site_meta'] = json.dumps({'sure': round((son - 1) / 30, 2), 'tekrar': True, 'dongu': [1, son], 'masa': True, 'tut': [TUT0, TUT1], 'tik': tik,
        'fare': {'kemik': 'el.R', 'el_yerel': t_, 'el_yerel_q': q_, 'nokta': 'farenin taban merkezi (masada)', 'olcu_mm': list(FARE['olcu']),
                 'olcek_onerisi': FARE['olcek_onerisi'], 'masa_z_mm': round(FARE['merkez'].z * MM), 'merkez_mm': mm(C0),
                 'yol': [[f, mm(Cf(f))] for f in range(1, son + 1, 2)] + [[son, mm(Cf(son))]], 'el_kayma_mm': round(kay * MM, 1),
                 'not': 'tut aralığında fare el.R soketiyle (ya da yol ile: masada kayar, z sabit) gider; dışında merkez_mm\'de durur. '
                        'Konumlar Blender sahnesinin masasına göre (karakter yereli, kök oturuşun kökü); site masayı yaz klibine göre '
                        'koyuyorsa fare de aynı farkla kayar.'},
        'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1),
        'not': 'v8.2: yaz (Klavye Tuşlama) 1. karesinden başlar ve ona döner (yaz ↔ fare kesintisiz). Sol el klavyede.'}, ensure_ascii=False)
    OLCUM_V82['fare'] = {'el_kayma_mm': round(kay * MM, 1), 'hata_mm': el_hatasi(act, S, 'R', TUT0, TUT1)}
    return [act]


def v82_klavye():
    """Klavye Tuşlama'ya tuş basmaları: her parmağın ucu (parmak_i_3 kuyruğu) kendi yazma bölümünde yerel en alçak
    noktaya geldiği kare bir basış; o karede parmak kökü ve orta eklemi ek kıvrımla iner (≈ 8 mm), sonra kalkar."""
    act = bpy.data.actions[KLAVYE]; son = int(act.frame_range[1])
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    for k in ('IK_kol.L', 'IK_kol.R', 'IK_bacak.L', 'IK_bacak.R'): rig[k] = 0.0
    if act.get('v82_tus'):
        print('KLAVYE zaten basışlı'); return []
    Z = {}; EL = {}
    for f in range(1, son + 1):
        kare_ayarla(act, f); pb = rig.pose.bones
        for t in 'LR':
            EL[(t, f)] = pb['tutma.' + t].head.copy()
            for i in range(1, 5): Z[(t, i, f)] = pb[f'parmak_{i}_3.{t}'].tail.copy()
    yaziyor = lambda t, f: EL[(t, f)].z < 0.35 and (t == 'L' or EL[(t, f)].x > -0.1)   # el klavyede (fareye gitmemiş)
    bas = []
    for t in 'LR':
        for i in range(1, 5):
            son_b = -99
            for f in range(4, son - 3):
                if not all(yaziyor(t, g) for g in range(f - 3, f + 4)): continue
                z = Z[(t, i, f)].z
                if z <= min(Z[(t, i, g)].z for g in range(f - 3, f + 4)) and z < Z[(t, i, f - 3)].z - 0.002 and f - son_b >= 8:
                    b = f if f % 2 else f + 1     # GLB 2 karede bir örnekler: tepe tek karede
                    bas.append((b, t, i)); son_b = f
    # kanalları yeniden yaz: parmak_i_1 ve _2 Euler'ine ek kıvrım (karakter-klip-eylem.py klip_kur'daki eksenle)
    sekil = {-2: 0.35, -1: 0.8, 0: 1.0, 1: 0.6, 2: 0.25}
    ek = {}
    for b, t, i in bas:
        for d, w in sekil.items():
            if 1 <= b + d <= son: ek[(t, i, b + d)] = max(ek.get((t, i, b + d), 0.0), w)
    fc = fcmap(act); seri = {}
    for t in 'LR':
        ax = Vector((0, 0, -1)) if t == 'L' else Vector((0, 0, 1))
        for i in range(1, 5):
            for j, A in ((1, 6.0), (2, 4.5)):
                bn = f'parmak_{i}_{j}.{t}'; yol = f'pose.bones["{bn}"].rotation_euler'
                if (yol, 0) not in fc: continue
                vals = [[], [], []]; prev = None
                for f in range(1, son + 1):
                    e = Euler([fc[(yol, k)].evaluate(f) for k in range(3)], 'XYZ')
                    w = ek.get((t, i, f), 0.0)
                    if w:
                        e = (lq(bn, ax, A * w) @ e.to_quaternion()).to_euler('XYZ', prev or e)
                    prev = e
                    for k in range(3): vals[k].append(e[k])
                for k in range(3): seri[(yol, k)] = vals[k]
    yaz(act, seri, list(range(1, son + 1)))
    act.frame_range = (1, son)
    # basış anında parmak ucu (kuyruk) yeri (karakter yereli, mm; Blender sahnesinin klavyesi üstü 445 mm)
    tus = []
    for b, t, i in sorted(bas):
        kare_ayarla(act, b); tus.append([b, t, i, mm(rig.pose.bones[f'parmak_{i}_3.{t}'].tail)])
    m = json.loads(act['site_meta']) if act.get('site_meta') else {}
    m.update({'tus': tus, 'tus_not': 'v8.2: [kare, el, parmak (1 işaret … 4 serçe), parmak ucu kemiğinin kuyruğu (mm, karakter yereli; et '
              'ucu ~10 mm aşağıda)]. Her basışta parmak 2 kare iner, 2 kare kalkar (≈ 8 mm). Blender sahnesinde klavyenin tuş üstü 445 mm.',
              'tus_sayisi': len(tus)})
    act['site_meta'] = json.dumps(m, ensure_ascii=False); act['v82_tus'] = 1
    OLCUM_V82['klavye'] = {'basis': len(tus), 'L': sum(1 for x in tus if x[1] == 'L'), 'R': sum(1 for x in tus if x[1] == 'R')}
    print('KLAVYE basış', OLCUM_V82['klavye'])
    return [act]


# ---------------------------------------------------------------------------------------------------------------------
# Elma dizisi (sitede ~60 sn): elma_ye'nin tutuşu (ELMA_ALT, avuç yukarı, dirsek yanda) ortak poz. Akış örneği:
#   buzdolabi_ac → elma_tut ↻ → elma_isir_1 → elma_tut ↻ (ya da yürürken elma_tut_yuru ↻) → elma_isir_2 → … → elma_isir_4
#   (koçan) → elma_tut ↻ → elma_firlat. elma_tut ve elma_tut_yuru elma kemiklerine anahtar yazmaz (elma_serbest): önceki
#   ısırığın elması ve dönüşü kalır. Bütün uçlar elma_tut'un 1. karesi (uc_kilitle).
def elma_tut_S(son):
    S = {'nefes': 0.7, 'canli': 0.6, 'nefes_uc': True, 'elma_serbest': True,
         'el': {'R': {'ik': [[1, 1], [son, 1]], 'nokta': ELMA_EL, 'yer': [(1, ELMA_ALT), (son, ELMA_ALT)], 'yon': [(1, ELMA_TUT), (son, ELMA_TUT)],
                      'dirsek': [(1, DIRSEK_TUT['R']), (son, DIRSEK_TUT['R'])]}},
         'parmak': {'R': [[1, ELMA_KIVRIM[0]], [son, ELMA_KIVRIM[0]]]}, 'basparmak': {'R': [[1, ELMA_KIVRIM[1]], [son, ELMA_KIVRIM[1]]]}}
    return S


def v82_elma():
    out = []
    son = 91
    S = elma_tut_S(son)
    nf = lambda f: math.sin(2 * math.pi * (f - 1) / 90)
    S['el']['R']['yer'] = [(f, tuple(Vector(ELMA_ALT) + Vector((0, 0, 0.003 * nf(f))))) for f in range(1, son + 1, 6)] + [(son, ELMA_ALT)]
    S['don'] = {'kafa': {'X': [[1, 0], [30, 6], [44, 7], [60, 0], [son, 0]], 'Z': [[1, 0], [30, -4], [60, 3], [son, 0]]}}   # elmaya göz atar
    S['kirp'] = [20, 70]
    tut = kol_coz('elma_tut', son, S, {'R': [(1, son)]})
    tut['site_meta'] = json.dumps({'sure': 3.0, 'tekrar': True, 'dongu': [1, son], 'katman': 'ust', 'ust_kok': UST_KOK, 'elma_serbest': True,
        'elma': ELMA_META, 'not': 'v8.2: elmayı tutarken bekleme (üst gövde, dur üstüne). Elma kemiklerine anahtar yok: önceki klibin '
                                  'elması (ısırık adımı ve dönüşü) kalır; site elma_adim\'i kendisi yazıyorsa aynen sürer.'}, ensure_ascii=False)
    out.append(tut)
    # yürürken
    sy = 43
    S0 = {'taban_akt': (YURUME, lambda f: f), 'don': {}, 'nefes': 0, 'canli': 0, 'gecikmesiz': True, 'elma_serbest': True}
    T = yuru_tasi('elma_tut_yuru', sy, S0, tut)
    R0 = Quaternion()   # yön de göğüsle döner
    Sy = elma_tut_S(sy); Sy.update(S0)
    tf = lambda f, v: tuple(T[f] @ Vector(v))
    tr = lambda f, v: tuple(T[f].to_3x3() @ Vector(v))
    Sy['el']['R']['yer'] = [(f, tf(f, ELMA_ALT)) for f in range(1, sy + 1)]
    Sy['el']['R']['yon'] = [(f, (tr(f, ELMA_TUT[0]), tr(f, ELMA_TUT[1]))) for f in range(1, sy + 1)]
    Sy['el']['R']['dirsek'] = [(f, tf(f, DIRSEK_TUT['R'])) for f in range(1, sy + 1)]
    yu = kol_coz('elma_tut_yuru', sy, Sy, {'R': [(1, sy)]})
    yu['site_meta'] = json.dumps({'sure': round(42 / 30, 2), 'tekrar': True, 'dongu': [1, sy], 'katman': 'ust', 'ust_kok': UST_KOK, 'eslik': 'yuru',
        'elma_serbest': True, 'elma': ELMA_META,
        'not': 'v8.2: elmayla yürürken üst gövde katmanı (yuru üstüne; yuru ile aynı uzunlukta, aynı karede başlatın). Sağ el elmayı '
               'göğsün önünde tutar (göğüsle taşınır), sol kol yürümenin salınımında. Elma kemiklerine anahtar yok.'}, ensure_ascii=False)
    out.append(yu)
    # ısırıklar: elma_ye'nin bir döngüsü (60 kare) + 30 kare tutuş; k. ısırıkta elma o ısırığın yeri ağza dönük
    ye = bpy.data.actions['Hareket - elma_ye']; yem = json.loads(ye['site_meta'])
    kare_ayarla(ye, ISIRIK[0]); Me = rig.pose.bones['elma'].matrix; a_ = Me.inverted() @ rig.pose.bones['ağız'].head
    phi = math.degrees(math.atan2(a_.x, a_.z))
    don = [0.0] + [phi - a for a in ISIRIK_ACI] + [phi - ISIRIK_ACI[2] - 60]   # k. ısırıktan önceki ve sonraki dönüş
    adim = ['g0', 'g1', 'g2', 'g3', 'kocan']
    agiz = Vector((-0.01, -0.175, 0.71)); alt = Vector(ELMA_ALT); AGIZ_YON = ((0.15, -0.35, 1), (0.1, 1, 0.3))
    for k in range(1, 5):
        son = 91; B = 20
        S = elma_tut_S(son); S.pop('elma_serbest')
        S['el']['R']['yer'] = [(1, tuple(alt)), (10, (-0.1, -0.24, 0.58)), (17, tuple(agiz)), (22, tuple(agiz + Vector((0, 0.006, -0.004)))), (30, (-0.11, -0.24, 0.58)), (40, tuple(alt)), (son, tuple(alt))]
        S['el']['R']['yon'] = [(1, ELMA_TUT), (15, AGIZ_YON), (24, AGIZ_YON), (38, ELMA_TUT), (son, ELMA_TUT)]
        S['cene'] = [[1, 0], [13, 0], [18, 14], [20, 3], [21, 0]] + [[f, round(CIGNE['acik'] * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)), 3)] for f in range(_CB, int(_CS) + 1)] + [[62, 0], [son, 0]]
        S['agiz'] = [[1, 0], [8, 0], [13, 0.9], [17, 1.0], [19, 0.95], [20, 0.2], [22, 0.05], [son, 0]]
        yk = [[1, 1.0], [19, 1.0], [24, 1.16]] + [[f, round(1.16 - 0.05 * (0.5 - 0.5 * math.cos(2 * math.pi * (f - _CB) / _P)) - 0.1 * (f - _CB) / (_CS - _CB), 3)] for f in range(_CB + 1, int(_CS) - 3)] + [[_CS, 1.03], [62, 1.0], [son, 1.0]]
        S['olcek'] = {'yanak.L': yk, 'yanak.R': yk}
        S['don'] = {'kafa': {'X': [[1, 0], [14, -4], [19, 8], [23, 10], [27, 4], [30, 6], [40, 1], [60, 0], [son, 0]], 'Z': [[1, 0], [18, 6], [30, 2], [46, -3], [62, 0], [son, 0]]},
                    'çene': {'Z': [[1, 0], [_CB, 0]] + [[f, round(2.0 * math.sin(2 * math.pi * (f - _CB) / _P), 3)] for f in range(_CB + 1, int(_CS) + 1)] + [[62, 0], [son, 0]]},
                    'göğüs': {'X': [[1, 0], [18, 5], [24, 2], [30, 1], [60, 0], [son, 0]], 'Y': [[1, 0], [18, -3], [40, 1], [60, 0], [son, 0]]},
                    'omurga': {'X': [[1, 0], [12, 2], [20, 4], [34, 1], [60, 0], [son, 0]]},
                    'omuz.R': {'Y': [[1, 0], [16, 6], [24, 6], [38, 0], [son, 0]]}}
        S['kirp'] = [44, 80]
        S['elma'] = {a: ([[1, 1], [B, 0]] if a == adim[k - 1] else [[1, 0], [B, 1]] if a == adim[k] else 0) for a in adim}
        d0, d1 = don[k - 1], don[k]
        S['elma_don'] = [[1, d0], [16, d1], [son, d1]]   # kaldırırken elmayı bileğiyle çevirir: k. ısırığın yeri ağza
        a = kol_coz(f'elma_isir_{k}', son, S, {'R': [(17, 22)]})
        uc_kilitle(a, tut, 1, n=6)
        a['site_meta'] = json.dumps({'sure': 3.0, 'tekrar': False, 'katman': 'ust', 'ust_kok': UST_KOK, 'isirik': B, 'cigne': [B + 4, B + 38], 'tutuyor': [44, son],
            'elma_adim': {adim[k - 1]: [1, B], adim[k]: [B, son]}, 'elma_don_derece': [round(d0, 1), round(d1, 1)], 'elma': ELMA_META,
            'agiz_mm': round((elma_nokta(a, B) - nokta(a, B, 'ağız')).length * MM, 1),
            'not': f'v8.2: {k}. ısırık: elma_tut pozundan kaldırır, {B}. karede ısırır (görünen elma {adim[k - 1]} → {adim[k]}), çiğnerken '
                   'indirir, 44\'ten sonra tutar. Uçlar elma_tut 1. karesi. Isırık sırası 1 → 4 (4: koçan kalır).'}, ensure_ascii=False)
        out.append(a)
    # fırlatma: başı elma_tut'a kilitli; meta'ya bırakma noktası ve önerilen hız
    fi = bpy.data.actions['Hareket - elma_firlat']
    uc_kilitle(fi, tut, 1, son=False, n=6)
    m = json.loads(fi['site_meta'])
    v = math.sqrt(sum(x * x for x in m['hiz']))
    m.update({'birak_nokta_mm': m['el'], 'onerilen_hiz_mm_s': m['hiz'], 'onerilen_hiz_buyukluk_mm_s': round(v),
              'atis_not': 'v8.2: basketbol atışı (jump shot): birak karesinde koçan birak_nokta_mm\'den (karakter yereli, mm) ayrılır. '
                          'onerilen_hiz_mm_s cop_ornek ağzına 45°\'lik atış; kovanın gerçek yeri için site yayı kendisi kurar: '
                          'yatay uzaklık d, yükseklik farkı h, açı θ (önerilen 50–55°): v = √(g·d² / (2·cos²θ·(d·tanθ − h))), g = 9810 mm/sn². '
                          'Başı elma_tut 1. karesi (koçan elde).'})
    fi['site_meta'] = json.dumps(m, ensure_ascii=False)
    out.append(fi)
    return out
