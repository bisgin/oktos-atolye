# Biggie rig v8.5 (2026-11-05, kullanıcı: "Özellikle sağ kol hâlâ kopuk gibi görünüyor"): bilekte manşet ile el arasında
# geçiş. Kök neden (ölçüldü, scripts/karakter-klip-pafta-v85.py bilek paftası): kazağın kol ucu (manşet) el kemiğinin
# başından 34 mm ileri, elin üstüne taşar; ama ağırlığı yalnız %26–40 el.R, gerisi ön_kol_burgu.R (elin burgusunun %65'i).
# Avuç ağı ise %100 el.R. El büküldükçe ve burgunun bilekte kalan kısmı (bust_tut ~20°) arttıkça manşetin dudağı elle
# birlikte gitmez: LBS iki dönüşü doğrusal karıştırınca dudak köşeleri içe çöker / sivri bir kıvrım olarak dışarı çıkar,
# avucun bilek ucu manşetin üstünden açığa çıkar ("el kola yapıştırılmış" görünümü).
# Düzeltme: kolun manşet bandında el ağırlığı bilekten 50 mm geriden bileğe dek yumuşakça (smoothstep) %100'e çıkar (avucun
# bilek ucu 15 mm geride başlar, o bölgede ~%78); manşet elle aynı çerçevede kalır, burgu ve büküm manşetin arkasındaki
# 50 mm'lik kazak bandına yayılır. Kol ağırlıkları
# (ön_kol, burgu) aynı oranda azalır, köşe başına ≤ 4 etki (three.js LBS). Sol kol simetrik.
# Girdi: karakter dosyası açık, rig_v82() çalışmış (ön_kol_burgu grupları var). Çıktı: kazak ağırlıkları yerinde; RIG_V85.
# Tekrar çalıştırmak güvenli (rig['bilek_v85'] bakılır). karakter-kaynak-kur.py rig_v82()'den hemen sonra çağırır.
import bpy
import numpy as np

BILEK_V85 = {'u0_mm': -50.0, 'u1_mm': 0.0, 'el_tavan': 1.0, 'r_mm': 120.0}
RIG_V85 = {}


def bilek_v85():
    rg = bpy.data.objects['bizzikoloşko_rig']
    if rg.get('bilek_v85'):
        print('BILEK_V85 zaten'); return
    A = BILEK_V85; MMb = 1500.0
    kz = bpy.data.objects['kazak']
    names = [g.name for g in kz.vertex_groups]
    n = len(kz.data.vertices)
    W = np.zeros((n, len(names)))
    for v in kz.data.vertices:
        for g in v.groups: W[v.index, g.group] = g.weight
    P = np.array([kz.matrix_world @ v.co for v in kz.data.vertices])
    B = rg.data.bones; mw = rg.matrix_world
    for s in 'LR':
        h = np.array(mw @ B[f'ön_kol.{s}'].head_local); e = np.array(mw @ B[f'el.{s}'].head_local)
        ax = e - h; L = np.linalg.norm(ax); ax = ax / L
        u = ((P - h) @ ax) - L                                  # el başına göre (Blender birimi)
        r = np.linalg.norm((P - h) - np.outer((P - h) @ ax, ax), axis=1)
        yan = (P[:, 0] * (1 if s == 'L' else -1)) > abs(h[0]) * 0.8
        t = np.clip((u * MMb - A['u0_mm']) / (A['u1_mm'] - A['u0_mm']), 0, 1); t = t * t * (3 - 2 * t)
        hedef = t * A['el_tavan']; hedef[~yan | (r * MMb > A['r_mm'])] = 0
        ie = names.index(f'el.{s}')
        kol = [names.index(k) for k in (f'ön_kol.{s}', f'ön_kol_burgu.{s}', f'dirsek_yarim.{s}') if k in names]
        m = hedef > W[:, ie] + 1e-4
        ek = (hedef - W[:, ie]) * m
        ksum = W[:, kol].sum(1); ksum_s = np.where(ksum == 0, 1, ksum)
        al = np.minimum(ek, ksum)
        for k in kol: W[:, k] -= al * W[:, k] / ksum_s
        W[:, ie] += al
        RIG_V85[f'kose_{s}'] = int((al > 0.01).sum())
        RIG_V85[f'manset_el_ort_{s}'] = round(float(W[(u * MMb > 0) & yan & (r * MMb < A['r_mm']), ie].mean()), 3)
    # ≤ 4 etki, toplam 1
    W = np.where(W < 0.01, 0, W)
    kes = np.sort(W, axis=1)[:, -4][:, None]; W = np.where(W >= kes, W, 0)
    tp = W.sum(1, keepdims=True); tp[tp == 0] = 1; W = W / tp
    for i, nm in enumerate(names):
        g = kz.vertex_groups[nm]; g.remove(list(range(n)))
        for vi in np.nonzero(W[:, i] > 0)[0]: g.add([int(vi)], float(W[vi, i]), 'REPLACE')
    rg['bilek_v85'] = 1
    print('RIG_V85', RIG_V85)
