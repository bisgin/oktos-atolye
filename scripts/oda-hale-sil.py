"""Oda kabuğunun pişmiş zemin dokusundan robot süpürgenin eski kırmızı halesini siler (v8.5, 2026-11-05).

Amaç: robot süpürge v8.3'te köşeden (1830, 1460) taşındı, v8.5'te odada geziyor; ama Blender pişirmesi (scripts/oda-blender.py
vekil_supurge + vekil_supurge_isik) eski yerde zemine kırmızı bir hale ve temas gölgesi bırakmıştı. Yeniden pişirmek
(--final, GPU) yerine yalnız zemin dokusu düzeltilir: halenin içi (r ≤ ~300 mm) çevresindeki halkadan doldurulur
(tahta damarı yüksek geçiren ayrıntıyla korunur), dışa doğru taşan kırmızı ışık yakındaki temiz zeminin R/G, B/G
oranına çekilir. Işığın kendisi artık robotun üstünde canlı (core/oda-robot.js).
Girdi:  python scripts/oda-hale-sil.py [--glb assets/oda/oda-ortam.glb] [--merkez 1830,1460] [--yedek KLASÖR] [--dry-run]
        [--onizleme DOSYA.png]
Çıktı:  GLB yerinde yazılır (yalnız 'zemin' görüntüsü değişir; diğer bütün bufferView'lar bayt bayt aynı, kaydırılır).
        --yedek verilirse önce özgün GLB oraya kopyalanır. --dry-run yalnız ölçer ve yazacağını söyler. Tekrar çalıştırmak
        güvenli: GLB'nin asset.extras.haleSilindi işareti varsa hiçbir şey yapmaz. Ağ yok.
Not:    oda-blender.py yeniden pişirilirse hale robotun istasyonunda (OLCU.ROBOT) yeniden oluşur; o zaman bu betiği yeni
        merkezle çalıştır ya da Blender betiğinde vekil_supurge_isik'i kapat.
"""
import argparse
import io
import json
import os
import shutil
import struct
import sys

import numpy as np
from PIL import Image, ImageFilter

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Zemin ağının UV'si (tarayıcıda zemin ağının 4 köşesinden ölçüldü, 2026-11-05): u, dünya y'sine (−1800 → 0,0004,
# 1800 → 0,8569); v, dünya x'ine (−2100 → 0,0004, 2100 → 0,9996). Doku flipY = false: satır = v · H, sütun = u · W
U0, U1, Y0, Y1 = 0.0004, 0.8569, -1800.0, 1800.0
V0, V1, X0, X1 = 0.0004, 0.9996, -2100.0, 2100.0


def glb_oku(yol):
    b = open(yol, 'rb').read()
    sihir, surum, boy = struct.unpack('<III', b[:12])
    if sihir != 0x46546C67:
        raise SystemExit('GLB değil: ' + yol)
    jl, jt = struct.unpack('<II', b[12:20])
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    bl, bt = struct.unpack('<II', b[o:o + 8])
    return j, bytearray(b[o + 8:o + 8 + bl])


def glb_yaz(yol, j, bin_):
    js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    bin_ = bytes(bin_) + b'\0' * ((4 - len(bin_) % 4) % 4)
    toplam = 12 + 8 + len(js) + 8 + len(bin_)
    with open(yol, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, toplam))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(bin_), 0x004E4942) + bin_)


def bufferview_degistir(j, bin_, bv_i, yeni):
    """bufferView bv_i'nin baytlarını yenisiyle değiştirir, ardından gelenleri kaydırır (4 bayt hizalı)"""
    bvs = j['bufferViews']
    sira = sorted(range(len(bvs)), key=lambda i: bvs[i].get('byteOffset', 0))
    out = bytearray()
    for i in sira:
        v = bvs[i]
        eski = bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        veri = yeni if i == bv_i else eski
        out += b'\0' * ((4 - len(out) % 4) % 4)
        v['byteOffset'] = len(out)
        v['byteLength'] = len(veri)
        out += veri
    j['buffers'][0]['byteLength'] = len(out)
    return out


def hale_sil(im, merkez_dunya):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    H, W, _ = a.shape
    px = lambda x, y: ((U0 + (y - Y0) / (Y1 - Y0) * (U1 - U0)) * W, (V0 + (x - X0) / (X1 - X0) * (V1 - V0)) * H)
    cx0, cy0 = px(*merkez_dunya)
    umax = int(U1 * W) - 2  # bu sütunun ötesi kullanılmıyor (siyah)
    Y, X = np.mgrid[0:H, 0:W]
    # Halenin kesin merkezi: verilen noktanın 200 px çevresinde kırmızı fazlasının ağırlık merkezi
    pen = (np.abs(X - cx0) < 200) & (np.abs(Y - cy0) < 200) & (X <= umax)
    ex = np.clip(a[..., 0] - 1.45 * a[..., 1], 0, None) * pen
    if ex.sum() < 1000:
        return None, {'hata': 'hale bulunamadı', 'merkez_px': [round(cx0), round(cy0)]}
    cx, cy = float((ex * X).sum() / ex.sum()), float((ex * Y).sum() / ex.sum())
    d = np.hypot(X - cx, Y - cy)
    th = np.arctan2(Y - cy, X - cx)
    gec = X <= umax
    R_IC, R_DIS = 145, 300  # px (~2,05 mm/px): iç dolgu ~300 mm, kırmızı taşma ~615 mm
    # Temiz zeminin renk oranı: halenin x'te 500 mm berisindeki şerit (buzdolabı gölgesine girmez)
    m = (Y > cy - 340) & (Y < cy - 240) & (X > cx - 200) & (X < min(cx + 150, umax))
    k_r = float((a[..., 0][m] / np.maximum(a[..., 1][m], 1)).mean())
    k_b = float((a[..., 2][m] / np.maximum(a[..., 1][m], 1)).mean())
    bulanik = lambda c, s: np.asarray(Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s))).astype(np.float32)
    G, B = a[..., 1], a[..., 2]
    Gb, Bb = bulanik(G, 2.5), bulanik(B, 2.5)
    ayr = np.clip(G / np.maximum(Gb, 1), 0.9, 1.1)          # tahta damarı (yüksek geçiren)
    ayr = 1 + (ayr - 1) * (1 - np.exp(-((d - 82) / 12) ** 2))  # halkanın kendi kenarı ayrıntıya girmesin
    # İç: her açıda sınır halkasının (R_IC … R_IC + 12) ortalaması, merkezden sınıra doğrusal
    nb = 180
    bi = ((th + np.pi) / (2 * np.pi) * nb).astype(int) % nb
    hal = (d >= R_IC) & (d < R_IC + 12) & gec
    Gs, Bs, n = np.zeros(nb), np.zeros(nb), np.zeros(nb)
    np.add.at(Gs, bi[hal], Gb[hal]); np.add.at(Bs, bi[hal], Bb[hal]); np.add.at(n, bi[hal], 1)
    ok = n > 0
    i = np.arange(nb)
    Gs = np.interp(i, i[ok], Gs[ok] / n[ok], period=nb); Bs = np.interp(i, i[ok], Bs[ok] / n[ok], period=nb)
    for _ in range(3):
        Gs = (np.roll(Gs, 1) + Gs + np.roll(Gs, -1)) / 3; Bs = (np.roll(Bs, 1) + Bs + np.roll(Bs, -1)) / 3
    t = np.clip(d / (R_IC + 12), 0, 1)
    Gf = Gs.mean() * (1 - t) + Gs[bi] * t
    Bf = Bs.mean() * (1 - t) + Bs[bi] * t
    ic = (d < R_IC + 12) & gec
    w = np.clip((R_IC + 12 - d) / 12, 0, 1)
    G2 = np.where(ic, Gf * ayr * w + G * (1 - w), G)
    B2 = np.where(ic, Bf * ayr * w + B * (1 - w), B)
    wr = np.clip((R_DIS - d) / (R_DIS - 230), 0, 1) * gec
    out = a.copy()
    out[..., 0] = a[..., 0] * (1 - wr) + G2 * k_r * wr
    out[..., 1] = np.where(gec, G2, G)
    out[..., 2] = np.where(gec, B2 * (1 - wr) + G2 * k_b * wr, B)
    once = float(np.clip(a[..., 0] - 1.45 * a[..., 1], 0, None)[d < R_DIS].mean())
    sonra = float(np.clip(out[..., 0] - 1.45 * out[..., 1], 0, None)[d < R_DIS].mean())
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8)), {
        'merkez_px': [round(cx, 1), round(cy, 1)], 'oran': [round(k_r, 3), round(k_b, 3)],
        'kirmizi_fazlasi': [round(once, 2), round(sonra, 2)]}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--glb', default=os.path.join(KOK, 'assets', 'oda', 'oda-ortam.glb'))
    ap.add_argument('--merkez', default='1830,1460', help='halenin dünya merkezi x,y (mm; v8.3 öncesi OLCU.ROBOT)')
    ap.add_argument('--yedek', default=None, help='özgün GLB bu klasöre kopyalanır (yazmadan önce)')
    ap.add_argument('--onizleme', default=None, help='önce/sonra karşılaştırma PNG')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    j, bin_ = glb_oku(a.glb)
    if (j.get('asset', {}).get('extras') or {}).get('haleSilindi'):
        print('zaten silinmiş:', j['asset']['extras']['haleSilindi'])
        return 0
    img = next((k for k, im in enumerate(j.get('images', [])) if im.get('name') == 'zemin'), None)
    if img is None:
        raise SystemExit("'zemin' görüntüsü yok")
    bv = j['images'][img]['bufferView']
    v = j['bufferViews'][bv]
    eski = bytes(bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']])
    im = Image.open(io.BytesIO(eski))
    merkez = [float(x) for x in a.merkez.split(',')]
    yeni, olcu = hale_sil(im, merkez)
    if yeni is None:
        print(json.dumps(olcu, ensure_ascii=False))
        return 1
    tampon = io.BytesIO()
    yeni.save(tampon, 'WEBP', quality=85, method=6)
    veri = tampon.getvalue()
    olcu.update({'doku_bayt': [len(eski), len(veri)], 'boyut': list(im.size)})
    print(json.dumps(olcu, ensure_ascii=False))
    if a.onizleme:
        cx, cy = olcu['merkez_px']
        k = (int(cx - 330), int(cy - 330), int(cx + 330), im.size[1])
        Image.fromarray(np.hstack([np.asarray(im.convert('RGB').crop(k)), np.asarray(yeni.crop(k))])).save(a.onizleme)
    if a.dry_run:
        print('--dry-run: yazılmadı')
        return 0
    if a.yedek:
        os.makedirs(a.yedek, exist_ok=True)
        shutil.copyfile(a.glb, os.path.join(a.yedek, os.path.basename(a.glb)))
    bin2 = bufferview_degistir(j, bin_, bv, veri)
    j.setdefault('asset', {}).setdefault('extras', {})['haleSilindi'] = {'merkez_mm': merkez, 'tarih': '2026-11-05'}
    glb_yaz(a.glb, j, bin2)
    print('yazıldı:', a.glb)
    return 0


if __name__ == '__main__':
    sys.exit(main())
