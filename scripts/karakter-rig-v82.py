# Biggie rig v8.2 (2026-11-05): site GLB'si için deformasyon iyileştirmesi + karın kemiği.
# Amaç: kollar ensede/başın arkasındayken dirsek ve bilekte kırılma (mum kağıdı burulması, dirsekte tek çizgide katlanma)
#       azalsın; armuda oturunca karın içeri çökebilsin (kullanıcı 05.11: "göbeği çok şişkin").
#   1) ön_kol_burgu.L/R: ön kolun yarısından bileğe twist kemiği, el'in yerel Y (burgu) dönüşünün %65'ini alır
#      (Transformation, SWING_TWIST_Y). Kazakta ön kol ağırlığı dirsekten bileğe yumuşak geçişle ön_kol / burgu arasında.
#   2) dirsek_yarim.L/R: dirsek merkezinde, ön_kol yerel dönüşünün %50'si (Copy Rotation, LOCAL); kazağın dirsek bandı (±45 mm
#      Blender biriminde 0,045) bu kemiğe: büküm tek çizgide kırılmaz.
#   3) Eklem çevresinde maskeli Laplace ağırlık yumuşatma (kazak, pantolon), her köşede en çok 4 etki, DQS kapalı (three.js LBS).
#   4) karın: omurga'nın çocuğu, gövdenin ortasından öne bakan deform kemiği; kazağın ön karın bölgesi ona yumuşak ağırlıkla
#      bağlı. Klip kemiğin ölçeğini anahtarlar (y < 1: karın içeri çöker). Şekil anahtarı değil kemik: GLB'ye kemik kanalı
#      olarak gider (karakter-blender.py export_morph=False), diğer kliplerde ölçek 1 sabiti yazılır.
# 1–3 C:\Oktos\calisma\kamera-mocap\scripts\biggie_rig_v02.py ve biggie_rig_v03.py'den (aynı oturumun mocap çalışması) taşındı;
# kemik adları ve hiyerarşi aynı kaldı, eski aksiyonlar çalışır. Kısıtlar GLB'ye örneklenerek (export_force_sampling) pişer.
# Girdi: karakter dosyası açık (karakter-kaynak-kur.py, karakter-klipler.py'den ÖNCE exec eder: REST yeni kemiklerle kurulsun).
# Çıktı: rig ve ağırlıklar yerinde değişir; RIG_V82 özeti (yazdırılır). Tekrar çalıştırmak güvenli (rig['rig_surum'] bakılır).
import bpy, math
import numpy as np
from mathutils import Vector

RIG_AYAR = {'twist_oran': 0.65, 'yumusat_tur': 18, 'yumusat_kat': 0.5, 'dirsek_bant': 0.045, 'dirsek_oran': 0.5,
            'eklem_yaricap': {'omuz': 0.085, 'dirsek': 0.07, 'bilek': 0.045, 'bel': 0.09, 'kalca': 0.08, 'diz': 0.06, 'boyun': 0.06},
            # karın bölgesi (Blender birimi, dinlenme pozu): kemik başı omurganın önünde, ağırlık ön yüzde z bandında
            'karin_bas': (0.0, -0.02, 0.43), 'karin_uc': (0.0, -0.12, 0.43), 'karin_z': (0.335, 0.43, 0.53), 'karin_x': 0.15, 'karin_on': 0.07}
RIG_V82 = {}


def _rig_mod(mod):
    bpy.context.view_layer.objects.active = rig_
    for o in bpy.context.selected_objects: o.select_set(False)
    rig_.hide_set(False); rig_.hide_viewport = False
    rig_.select_set(True)
    bpy.ops.object.mode_set(mode=mod)


def _agirlik(o):
    names = [g.name for g in o.vertex_groups]
    W = np.zeros((len(o.data.vertices), len(names)))
    for v in o.data.vertices:
        for g in v.groups: W[v.index, g.group] = g.weight
    return names, W


def _yaz(o, names, W):
    for i, n in enumerate(names):
        g = o.vertex_groups.get(n) or o.vertex_groups.new(name=n)
        g.remove(list(range(len(o.data.vertices))))
        for vi in np.nonzero(W[:, i] > 0)[0]: g.add([int(vi)], float(W[vi, i]), 'REPLACE')


def _sinirla(W, k=4, esik=0.01):
    W = np.where(W < esik, 0, W)
    if W.shape[1] > k:
        kes = np.sort(W, axis=1)[:, -k][:, None]
        W = np.where(W >= kes, W, 0)
    t = W.sum(1, keepdims=True); t[t == 0] = 1
    return W / t


def rig_v82():
    global rig_
    rig_ = bpy.data.objects['bizzikoloşko_rig']
    if rig_.get('rig_surum') == 'v8.2':
        print('RIG_V82 zaten kurulu'); return
    A = RIG_AYAR
    _rig_mod('EDIT')
    eb = rig_.data.edit_bones
    for s in 'LR':
        fa, ua = eb[f'ön_kol.{s}'], eb[f'üst_kol.{s}']
        tb = eb.get(f'ön_kol_burgu.{s}') or eb.new(f'ön_kol_burgu.{s}')
        tb.head = fa.head.lerp(fa.tail, 0.45); tb.tail = fa.tail.copy(); tb.roll = fa.roll
        tb.parent = fa; tb.use_connect = False; tb.use_deform = True
        hb = eb.get(f'dirsek_yarim.{s}') or eb.new(f'dirsek_yarim.{s}')
        hb.head = fa.head.copy(); hb.tail = fa.head + (fa.tail - fa.head) * 0.5; hb.roll = fa.roll
        hb.parent = ua; hb.use_connect = False; hb.use_deform = True
        for c in fa.collections: c.assign(tb); c.assign(hb)
    kb = eb.get('karın') or eb.new('karın')
    kb.head = Vector(A['karin_bas']); kb.tail = Vector(A['karin_uc']); kb.roll = 0
    kb.parent = eb['omurga']; kb.use_connect = False; kb.use_deform = True
    for c in eb['omurga'].collections: c.assign(kb)
    _rig_mod('POSE')
    for s in 'LR':
        pb = rig_.pose.bones[f'ön_kol_burgu.{s}']
        for c in list(pb.constraints): pb.constraints.remove(c)
        c = pb.constraints.new('TRANSFORM'); c.name = 'burgu_el'
        c.target = rig_; c.subtarget = f'el.{s}'; c.target_space = 'LOCAL'; c.owner_space = 'LOCAL'
        c.map_from = 'ROTATION'; c.from_rotation_mode = 'SWING_TWIST_Y'
        c.from_min_y_rot = -math.pi; c.from_max_y_rot = math.pi
        c.map_to = 'ROTATION'; c.map_to_x_from = 'X'; c.map_to_y_from = 'Y'; c.map_to_z_from = 'Z'
        c.to_min_y_rot = -math.pi * A['twist_oran']; c.to_max_y_rot = math.pi * A['twist_oran']
        c.to_min_x_rot = c.to_max_x_rot = c.to_min_z_rot = c.to_max_z_rot = 0.0
        c.mix_mode_rot = 'REPLACE'; pb.rotation_mode = 'QUATERNION'
        pb = rig_.pose.bones[f'dirsek_yarim.{s}']
        for c in list(pb.constraints): pb.constraints.remove(c)
        c = pb.constraints.new('COPY_ROTATION'); c.name = 'dirsek_yarim'
        c.target = rig_; c.subtarget = f'ön_kol.{s}'; c.target_space = 'LOCAL'; c.owner_space = 'LOCAL'
        c.mix_mode = 'REPLACE'; c.influence = A['dirsek_oran']; pb.rotation_mode = 'QUATERNION'
    rig_.pose.bones['karın'].rotation_mode = 'QUATERNION'
    _rig_mod('OBJECT')

    bh = lambda n: rig_.matrix_world @ rig_.data.bones[n].head_local
    bt = lambda n: rig_.matrix_world @ rig_.data.bones[n].tail_local
    R = A['eklem_yaricap']; EK = []
    for s in 'LR':
        EK += [(bh(f'üst_kol.{s}'), R['omuz']), (bh(f'ön_kol.{s}'), R['dirsek']), (bh(f'el.{s}'), R['bilek']),
               (bh(f'uyluk.{s}'), R['kalca']), (bh(f'baldır.{s}'), R['diz'])]
    EK += [(bh('omurga'), R['bel']), (bh('göğüs'), R['bel']), (bh('boyun'), R['boyun'])]
    govde = {b.name for b in rig_.data.bones if b.use_deform}

    def yumusat(o, names, W):
        me = o.data; P = np.array([o.matrix_world @ v.co for v in me.vertices]); mask = np.zeros(len(P))
        for j, r in EK:
            m = np.clip(1 - np.linalg.norm(P - np.array(j), axis=1) / r, 0, 1); mask = np.maximum(mask, m * m * (3 - 2 * m))
        cols = [i for i, n in enumerate(names) if n in govde]
        e = np.array([ed.vertices[:] for ed in me.edges]); deg = np.bincount(e.ravel(), minlength=len(P)).astype(float); deg[deg == 0] = 1
        Ws = W[:, cols]; lam = A['yumusat_kat'] * mask[:, None]
        for _ in range(A['yumusat_tur']):
            acc = np.zeros_like(Ws); np.add.at(acc, e[:, 0], Ws[e[:, 1]]); np.add.at(acc, e[:, 1], Ws[e[:, 0]])
            Ws = Ws + lam * (acc / deg[:, None] - Ws)
        W[:, cols] = Ws
        return W, int((mask > 0).sum())

    kz = bpy.data.objects['kazak']
    for n in ('ön_kol_burgu.L', 'ön_kol_burgu.R', 'dirsek_yarim.L', 'dirsek_yarim.R', 'karın'):
        if not kz.vertex_groups.get(n): kz.vertex_groups.new(name=n)
    names, W = _agirlik(kz)
    P = np.array([kz.matrix_world @ v.co for v in kz.data.vertices])
    for s in 'LR':   # ön kol bölme (v02)
        fa, tw, el = names.index(f'ön_kol.{s}'), names.index(f'ön_kol_burgu.{s}'), names.index(f'el.{s}')
        h, t = np.array(bh(f'ön_kol.{s}')), np.array(bt(f'ön_kol.{s}')); ax = t - h
        u = np.clip(((P - h) @ ax) / (ax @ ax), 0, 1.3)
        sm = np.clip((u - 0.15) / 0.8, 0, 1); sm = sm * sm * (3 - 2 * sm)
        w_fa = W[:, fa].copy(); W[:, tw] += w_fa * sm; W[:, fa] = w_fa * (1 - sm)
        w_el = W[:, el].copy(); tasin = np.where(u < 1.0, w_el, w_el * 0.6); W[:, tw] += tasin; W[:, el] = w_el - tasin
    W, n1 = yumusat(kz, names, W)
    W = _sinirla(W)
    for s in 'LR':   # dirsek bandı (v03)
        E, S_ = np.array(bh(f'ön_kol.{s}')), np.array(bh(f'üst_kol.{s}')); ax = (E - S_) / np.linalg.norm(E - S_)
        t = (P - E) @ ax; kol = (P[:, 0] * (1 if s == 'L' else -1)) > 0.11
        m = np.clip(1 - np.abs(t) / A['dirsek_bant'], 0, 1); m = m * m * (3 - 2 * m); m[~kol] = 0
        iu, ifa, ih = names.index(f'üst_kol.{s}'), names.index(f'ön_kol.{s}'), names.index(f'dirsek_yarim.{s}')
        tas = (W[:, iu] + W[:, ifa]) * m * 0.85; top = W[:, iu] + W[:, ifa]; top[top == 0] = 1
        W[:, iu] -= tas * W[:, iu] / top; W[:, ifa] -= tas * W[:, ifa] / top; W[:, ih] += tas
    # karın: ön yüzde (y gövdenin ön yüzüne yakın), z bandında, ortada; ağırlık gövde gruplarından alınır
    ik = names.index('karın'); z0, zm, z1 = A['karin_z']
    gov = [names.index(n) for n in ('kalça', 'omurga', 'göğüs') if n in names]
    on_y = np.array([P[i, 1] for i in range(len(P))])
    wz = np.clip(1 - np.abs(P[:, 2] - zm) / ((z1 - z0) / 2), 0, 1); wz = wz * wz * (3 - 2 * wz)
    wx = np.clip(1 - np.abs(P[:, 0]) / A['karin_x'], 0, 1); wx = wx * wx * (3 - 2 * wx)
    on_min = P[(np.abs(P[:, 0]) < 0.05) & (np.abs(P[:, 2] - zm) < 0.03), 1].min()     # karnın en öndeki y'si
    wy = np.clip((on_min + A['karin_on'] - on_y) / A['karin_on'], 0, 1); wy = wy * wy * (3 - 2 * wy)
    gsum = W[:, gov].sum(1)
    w = wz * wx * wy * np.clip(gsum, 0, 1) * 0.95
    for g in gov:
        W[:, g] -= w * W[:, g] / np.where(gsum == 0, 1, gsum)
    W[:, ik] += w
    W = _sinirla(W)
    _yaz(kz, names, W)
    RIG_V82['kazak_yumusatilan'] = n1; RIG_V82['karin_kose'] = int((w > 0.05).sum()); RIG_V82['karin_on_y_mm'] = round(on_min * 1500, 1)
    pt = bpy.data.objects['pantolon']
    names, W = _agirlik(pt); W, n2 = yumusat(pt, names, W); _yaz(pt, names, _sinirla(W)); RIG_V82['pantolon_yumusatilan'] = n2
    say = 0
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        am = [m for m in o.modifiers if m.type == 'ARMATURE' and m.object == rig_]
        if not am: continue
        for m in am: m.use_deform_preserve_volume = False
        if o.name not in ('kazak', 'pantolon') and len(o.vertex_groups) > 4:
            names, W = _agirlik(o); _yaz(o, names, _sinirla(W)); say += 1
    RIG_V82['sinirlanan_diger'] = say
    rig_['rig_surum'] = 'v8.2'
    print('RIG_V82', RIG_V82)
