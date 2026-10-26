# -*- coding: utf-8 -*-
"""
seri-ses.py: Oktos sosyal medya serisi (lab/tanitim/seri.html) için efekt sesleri; tamamen kendi sentezimiz (numpy).

Amaç
  - Sayfanın ses işaretlerini (window.tanitim.isaretler(): [{kare, tur, ...}]) okur, her olaya kendi ürettiğimiz bir sesi
    o kareye oturtur: vuruş "boom", hitmarker tıkı, zoom woosh, patlama, damga, PS1 menü sesleri (kaydırıcı tıkları,
    imleç, malzeme seçimi, "tam ölçü"), mozaik girişi, final (logo, harfler, çağrı) ve kesitteki film sesleri (tik, vida
    tıngırtısı, düşünce balonu). Bilinen meme seslerinin kopyası yok: hepsi sinüs, kare dalga ve süzülmüş gürültüden.
  - Müzik YOK (paylaşımda Instagram'dan eklenecek). Ses yüksekliği -16 LUFS (EBU R128, ffmpeg loudnorm ile ölçülür),
    gerçek tepe <= -1 dBTP; aşarsa yumuşak sınırlayıcı (kırpma yok).
  - --video verilirse sesi videoya bindirir (görüntü kopyalanır, ses AAC 192k); --telefon ile 720×1280 ~2,4 Mb/sn kopya.

Girdi
  - Yerel sunucu açık olmalı (python scripts/serve.py 8080): sayfa Playwright + kurulu Edge ile ekransız açılır.
  - --bolum atolye (varsayılan), --port 8080, --isaretler JSON (sayfayı açmadan önceki dökümü kullan)
  - --video .impeccable/film/seri-atolye.mp4 (birden çok verilebilir), --telefon (bindirilen her videonun telefon kopyası)

Çıktı (.impeccable/ses/, yerel, depoya girmez)
  - seri-<bolum>.wav            : 48 kHz, 24 bit, stereo, -16 LUFS, gerçek tepe <= -1 dBTP
  - seri-<bolum>-isaretler.json : sayfadan okunan işaretler (süre, hatalar)
  - seri-<bolum>-cizelge.json   : yerleştirilen sesler (kare, sn, tür, kazanç), ölçümler
  - <video>-sesli.mp4 ve (--telefon) <video>-telefon.mp4 videonun yanına

Kullanım
  python scripts/seri-ses.py --video .impeccable/film/seri-atolye.mp4 --telefon
  python scripts/seri-ses.py --dry-run        # işaretleri oku, sesi üret ve ölç, hiçbir dosya yazma

Tekrar çalıştırmak güvenlidir: yalnız yukarıdaki çıktıların üzerine yazar. Silme yok.
Gereken: Python 3, numpy, playwright (pip), kurulu Microsoft Edge, ffmpeg (winget Gyan.FFmpeg).
"""
import argparse
import glob
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
KOK = Path(__file__).resolve().parent.parent
CIKIS = KOK / '.impeccable' / 'ses'
SR = 48000
FPS = 60
HEDEF_LUFS = -16.0
TEPE_DBTP = -1.0

# Tür başına göreli düzey (dB, normalleştirmeden önce) ve stereo yayılım (rastgele pan genliği)
DUZEY = {
    'boom': 0, 'patlama': -2, 'damga': -3, 'woosh': -8, 'hit': -8, 'mozaik': -12, 'panel': -16, 'kaydir': -15,
    'imlec': -13, 'malzeme': -10, 'tamam': -9, 'logo': -10, 'harf': -19, 'cagri': -14,
    'tik': -14, 'vida': -13, 'dusunce': -15,
}
PAN = {'hit': 0.45, 'tik': 0.2, 'vida': 0.0, 'kaydir': 0.1, 'harf': 0.3, 'patlama': 0.0}


# =====================================================================================================
# SENTEZ YARDIMCILARI
# =====================================================================================================
def zaman(sure):
    return np.arange(int(round(sure * SR))) / SR


def zarf(n, atak, dusus):
    """Doğrusal atak, üstel düşüş (sn)."""
    t = np.arange(n) / SR
    return np.clip(t / max(atak, 1e-5), 0, 1) * np.exp(-np.maximum(t - atak, 0) / dusus)


def suz(x, tur, f, Q=0.707, adim=32):
    """RBJ biquad; f sabit ya da örnek başına dizi (katsayı adim örnekte bir yenilenir). tur: lp | hp | bp."""
    n = len(x)
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    y = np.zeros(n)
    x1 = x2 = y1 = y2 = 0.0
    b0 = b1 = b2 = a1 = a2 = 0.0
    for i in range(n):
        if i % adim == 0:
            w = 2 * math.pi * min(max(f[i], 10.0), SR * 0.45) / SR
            c, s = math.cos(w), math.sin(w)
            al = s / (2 * Q)
            if tur == 'lp':
                b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
            elif tur == 'hp':
                b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
            else:
                b0, b1, b2 = al, 0.0, -al
            a0 = 1 + al
            b0, b1, b2, a1, a2 = b0 / a0, b1 / a0, b2 / a0, -2 * c / a0, (1 - al) / a0
        xi = x[i]
        yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi
        y[i] = yi
    return y


def faz(f):
    return 2 * math.pi * np.cumsum(f) / SR


def ucgen(ph):
    return 2 / math.pi * np.arcsin(np.sin(ph))


def kare_dalga(ph, yumusak=6.0):
    return np.tanh(yumusak * np.sin(ph))


def normal(y):
    m = np.max(np.abs(y))
    return y / m if m > 0 else y


# =====================================================================================================
# SESLER (her biri mono dizi + yerleşim kayması (sn; woosh tepe noktası işaret karesine otursun diye negatif))
# =====================================================================================================
def ses_boom(r, ek):
    t = zaman(0.9)
    n = len(t)
    f = 42 + (150 - 42) * np.exp(-t / 0.06)
    p = faz(f)
    govde = np.sin(p) * zarf(n, 0.002, 0.28) + 0.35 * np.sin(2 * p) * zarf(n, 0.002, 0.12)
    tok = suz(r.standard_normal(n), 'lp', 300) * zarf(n, 0.001, 0.04) * 2.0
    cat = suz(r.standard_normal(n), 'hp', 2500) * zarf(n, 0.0005, 0.012) * 0.5
    return np.tanh(1.6 * (govde + tok + cat)) / math.tanh(1.6), 0.0


def ses_hit(r, ek):
    t = zaman(0.09)
    n = len(t)
    d = 1 + (r.random() - 0.5) * 0.06
    y = (np.sin(2 * math.pi * 3150 * d * t) + 0.6 * np.sin(2 * math.pi * 4730 * d * t) + 0.3 * np.sin(2 * math.pi * 6310 * d * t)) * zarf(n, 0.0005, 0.018)
    y += suz(r.standard_normal(n), 'hp', 4000) * zarf(n, 0.0002, 0.004) * 1.2
    return normal(y), 0.0


def ses_woosh(r, ek):
    on, son = 0.3, 0.14
    t = zaman(on + son)
    n = len(t)
    f = np.where(t < on, 350 * 8 ** (t / on), 2800 * np.exp(-(t - on) / 0.2))
    env = np.where(t < on, (t / on) ** 2.2, np.exp(-(t - on) / 0.05))
    y = suz(r.standard_normal(n), 'bp', f, Q=1.4) * env
    return normal(y), -on


def ses_patlama(r, ek):
    t = zaman(1.4)
    n = len(t)
    fc = 300 + 6000 * np.exp(-t / 0.18)
    gov = suz(r.standard_normal(n), 'lp', fc, Q=0.9) * zarf(n, 0.002, 0.45) * 2.2
    rumble = np.sin(faz(48 + 30 * np.exp(-t / 0.1))) * zarf(n, 0.003, 0.5) * 0.9
    cit = np.zeros(n)
    for _ in range(40):
        a = int((r.random() ** 1.8) * 0.6 * SR)
        L = int(0.003 * SR)
        if a + L < n:
            cit[a:a + L] += r.standard_normal(L) * (1 - a / (0.6 * SR)) * 0.9
    cit = suz(cit, 'hp', 1500)
    return np.tanh(2.2 * normal(gov + rumble + cit)) / math.tanh(2.2), 0.0


def ses_damga(r, ek):
    t = zaman(0.5)
    n = len(t)
    thud = np.sin(faz(60 + 35 * np.exp(-t / 0.03))) * zarf(n, 0.001, 0.09)
    knock = suz(r.standard_normal(n), 'bp', 850, Q=3) * zarf(n, 0.0005, 0.03) * 3.0
    slap = suz(r.standard_normal(n), 'hp', 3000) * zarf(n, 0.0003, 0.015) * 0.8
    return np.tanh(1.8 * (thud + knock + slap)) / math.tanh(1.8), 0.0


def ses_mozaik(r, ek):
    # Kısa, basamaklı yükselen dijital süpürme (8 basamak), kare dalga, alçak geçiren
    t = zaman(0.34)
    n = len(t)
    bas = np.floor(np.minimum(t / 0.3, 0.999) * 8) / 8
    f = 180 * (1400 / 180) ** bas
    y = kare_dalga(faz(f), 3.0) * zarf(n, 0.01, 0.18)
    y = suz(y, 'lp', 3200)
    return normal(y), 0.0


def ses_panel(r, ek):
    t = zaman(0.12)
    n = len(t)
    y = suz(r.standard_normal(n), 'bp', 900 * (2.4 ** (t / 0.12)), Q=1.6) * np.sin(np.pi * np.minimum(t / 0.12, 1)) ** 1.5
    return normal(y), 0.0


def ses_kaydir(r, ek):
    # Değer arttıkça perde yükselir (bir oktav), kısa üçgen tıkı
    v = float(ek.get('deger') or 0)
    t = zaman(0.05)
    n = len(t)
    f = 520 * 2 ** (v * 0.9)
    y = ucgen(faz(np.full(n, f))) * zarf(n, 0.0008, 0.012)
    y += suz(r.standard_normal(n), 'hp', 3000) * zarf(n, 0.0002, 0.002) * 0.4
    return normal(y), 0.0


def ses_imlec(r, ek):
    # İki kısa kare dalga tıkı: 990 Hz, 35 ms sonra 740 Hz (imleç bir satır iner)
    n = int(0.075 * SR)
    a = int(0.035 * SR)
    y = np.zeros(n)
    y[:a] = kare_dalga(faz(np.full(a, 990.0)), 2.5) * zarf(a, 0.001, 0.015)
    y[a:] = kare_dalga(faz(np.full(n - a, 740.0)), 2.5) * zarf(n - a, 0.001, 0.015)
    return normal(suz(y, 'lp', 2600)), 0.0


def ses_malzeme(r, ek):
    # Seçim: iki sesli üçgen akor (kök malzeme sırasıyla yükselir), başta küçük perde sıçraması, hafif pırıltı
    i = int(ek.get('deger') or 1)
    kok = 440 * 2 ** (((i - 1) * 2) / 12)
    t = zaman(0.16)
    n = len(t)
    sic = 1 + 0.06 * np.exp(-t / 0.01)
    y = (ucgen(faz(kok * sic)) + 0.7 * ucgen(faz(kok * 1.5 * sic))) * zarf(n, 0.002, 0.07)
    y += suz(r.standard_normal(n), 'hp', 6000) * zarf(n, 0.001, 0.03) * 0.15
    return normal(y), 0.0


def ses_tamam(r, ek):
    notalar = [1047, 1319, 1568, 2093]
    y = np.zeros(int(0.45 * SR))
    for j, f in enumerate(notalar):
        a = int(j * 0.055 * SR)
        L = len(y) - a
        d = 0.05 if j < 3 else 0.16
        y[a:] += ucgen(faz(np.full(L, float(f)))) * zarf(L, 0.002, d) * (0.8 if j < 3 else 1.0)
    return normal(y), 0.0


def ses_logo(r, ek):
    t = zaman(0.5)
    n = len(t)
    pop = np.sin(faz(520 + 260 * (1 - np.exp(-t / 0.02)))) * zarf(n, 0.002, 0.03)
    can = np.sin(2 * math.pi * 1560 * t) * zarf(n, 0.003, 0.22) * 0.35 + np.sin(2 * math.pi * 2340 * t) * zarf(n, 0.003, 0.12) * 0.15
    return normal(pop + can), 0.0


def ses_harf(r, ek):
    t = zaman(0.04)
    n = len(t)
    f = 1500 + 120 * float(ek.get('deger') or 0)
    y = np.sin(2 * math.pi * f * t) * zarf(n, 0.0005, 0.006) + suz(r.standard_normal(n), 'hp', 2500) * zarf(n, 0.0002, 0.002) * 0.5
    return normal(y), 0.0


def ses_cagri(r, ek):
    t = zaman(0.45)
    n = len(t)
    y = np.sin(2 * math.pi * 660 * t) * zarf(n, 0.004, 0.12)
    a = int(0.07 * SR)
    y[a:] += np.sin(2 * math.pi * 990 * t[:n - a]) * zarf(n - a, 0.004, 0.18)
    return normal(y), 0.0


def ses_tik(r, ek):
    t = zaman(0.06)
    n = len(t)
    y = suz(r.standard_normal(n), 'bp', 2400, Q=2) * zarf(n, 0.0003, 0.003) * 2 + np.sin(2 * math.pi * 900 * t) * zarf(n, 0.0005, 0.02) * 0.6
    return normal(y), 0.0


def ses_vida(r, ek):
    y = np.zeros(int(0.7 * SR))
    for j in range(16):
        a = int((0.55 * (j / 16) ** 1.6 + r.random() * 0.02) * SR)
        L = int(0.03 * SR)
        if a + L >= len(y):
            continue
        t = np.arange(L) / SR
        f = 2800 + r.random() * 3200
        y[a:a + L] += np.sin(2 * math.pi * f * t) * zarf(L, 0.0002, 0.006) * (1 - j / 18) * (0.6 + 0.4 * r.random())
    y += suz(r.standard_normal(len(y)), 'lp', 400) * zarf(len(y), 0.001, 0.03) * 0.8
    return normal(y), 0.0


def ses_dusunce(r, ek):
    t = zaman(0.12)
    n = len(t)
    y = np.sin(faz(280 + 340 * np.minimum(t / 0.07, 1))) * zarf(n, 0.004, 0.035)
    return normal(y), 0.0


SESLER = {k[4:]: v for k, v in globals().items() if k.startswith('ses_')}


# =====================================================================================================
# ÖLÇÜM, SINIRLAYICI, YAZMA, BİNDİRME
# =====================================================================================================
def ffmpeg_bul():
    if os.environ.get('FFMPEG') and Path(os.environ['FFMPEG']).exists():
        return os.environ['FFMPEG']
    w = shutil.which('ffmpeg')
    if w:
        return w
    la = os.environ.get('LOCALAPPDATA')
    if la:
        aday = sorted(glob.glob(os.path.join(la, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg*', '*', 'bin', 'ffmpeg.exe')))
        if aday:
            return aday[-1]
    sys.exit('ffmpeg bulunamadı: PATH\'e ekleyin ya da FFMPEG ortam değişkenini verin.')


def wav24_yaz(yol, x):
    y = np.clip(np.round(x.T * 8388607.0), -8388608, 8388607).astype('<i4')
    b = y.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(yol), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


def loudnorm_olc(ff, x, gecici):
    """ffmpeg loudnorm (EBU R128): tümleşik ses yüksekliği ve gerçek tepe. x ölçeklenip yazılır, sonuç geri ölçeklenir."""
    olcek = 0.5 / max(1e-9, float(np.max(np.abs(x))))
    yol = Path(gecici) / 'olcum.wav'
    wav24_yaz(yol, x * olcek)
    r = subprocess.run([ff, '-hide_banner', '-nostats', '-i', str(yol), '-af',
                        f'loudnorm=I={HEDEF_LUFS}:TP={TEPE_DBTP}:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    j = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    duz = 20 * math.log10(olcek)
    return dict(lufs=float(j['input_i']) - duz, tepe_dbtp=float(j['input_tp']) - duz)


def sinirla(x, tavan):
    """Yumuşak tepe sınırlayıcı: 1 ms bloklar, ±6 ms ileri bakış (en küçük kazanç), iki kez 5 blok yumuşatma
    (yumuşatma penceresi ileri bakıştan dar: tepe bloğunun kazancı gereken değerin altında kalır)."""
    B = 48
    n = x.shape[1]
    m = -(-n // B)
    tepe = np.zeros(m * B)
    tepe[:n] = np.max(np.abs(x), axis=0)
    blok = tepe.reshape(m, B).max(axis=1)
    gerek = np.minimum(1.0, tavan / np.maximum(blok, 1e-12))
    if gerek.min() >= 1.0:
        return x, 0.0
    H = 6
    p = np.pad(gerek, H, constant_values=1.0)
    g = np.lib.stride_tricks.sliding_window_view(p, 2 * H + 1).min(axis=1)
    for _ in range(2):
        g = np.convolve(np.pad(g, 2, mode='edge'), np.ones(5) / 5, mode='valid')
    g = np.minimum(g, 1.0)
    gs = np.interp(np.arange(n), np.arange(m) * B + B / 2, g)
    return x * gs, float(-20 * math.log10(g.min()))


def isaretleri_oku(bolum, port):
    from playwright.sync_api import sync_playwright
    url = f'http://127.0.0.1:{port}/lab/tanitim/seri.html?bolum={bolum}&cek=1'
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', headless=True, args=['--ignore-gpu-blocklist', '--enable-gpu-rasterization'])
        try:
            pg = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
            sayfa_hatalari = []
            pg.on('pageerror', lambda e: sayfa_hatalari.append(str(e)))
            pg.goto(url)
            pg.wait_for_function('window.tanitimHazir === true', timeout=120000)
            v = pg.evaluate('() => ({ isaretler: JSON.parse(JSON.stringify(tanitim.isaretler())), sure: tanitim.sure(), hatalar: [...tanitim.hatalar] })')
        finally:
            b.close()
    v.update(adres=url, sayfa_hatalari=sayfa_hatalari)
    return v


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bolum', default='atolye')
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--isaretler', help='önceki işaret dökümü (JSON); verilirse sayfa açılmaz')
    ap.add_argument('--video', action='append', default=[], help='sesin bindirileceği mp4 (birden çok verilebilir)')
    ap.add_argument('--telefon', action='store_true', help='bindirilen videonun 720×1280 ~2,4 Mb/sn kopyası (<ad>-telefon.mp4)')
    ap.add_argument('--dry-run', action='store_true')
    o = ap.parse_args()

    if o.isaretler:
        veri = json.loads(Path(o.isaretler).read_text(encoding='utf-8'))
    else:
        veri = isaretleri_oku(o.bolum, o.port)
    if veri.get('hatalar') or veri.get('sayfa_hatalari'):
        print('SAYFA HATALARI:', *(veri.get('hatalar') or []), *(veri.get('sayfa_hatalari') or []), sep='\n  ')
    sure = float(veri['sure'])
    N = int(round(sure * SR))
    karisim = np.zeros((2, N))
    yerlesim, bilinmeyen = [], []
    for i, e in enumerate(veri['isaretler']):
        tur = e['tur']
        if tur not in SESLER:
            bilinmeyen.append(tur)
            continue
        r = np.random.default_rng(1000 + i * 7919)
        y, kay = SESLER[tur](r, e)
        k = 10 ** (DUZEY.get(tur, -12) / 20)
        pan = (r.random() - 0.5) * 2 * PAN.get(tur, 0.0)
        sol, sag = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        a = int(round((e['kare'] / FPS + kay) * SR))
        b0 = max(0, -a)
        a = max(0, a)
        L = min(len(y) - b0, N - a)
        if L <= 0:
            continue
        karisim[0, a:a + L] += y[b0:b0 + L] * k * sol * math.sqrt(2)
        karisim[1, a:a + L] += y[b0:b0 + L] * k * sag * math.sqrt(2)
        yerlesim.append(dict(kare=e['kare'], sn=round(e['kare'] / FPS, 3), tur=tur, ad=e.get('ad'), deger=e.get('deger'), duzey_db=DUZEY.get(tur), pan=round(pan, 2)))
    if bilinmeyen:
        print('sesi olmayan işaret türleri:', sorted(set(bilinmeyen)))

    ff = ffmpeg_bul()
    with tempfile.TemporaryDirectory() as gecici:
        o1 = loudnorm_olc(ff, karisim, gecici)
        kazanc = HEDEF_LUFS - o1['lufs']
        cikti = karisim * 10 ** (kazanc / 20)
        sinir_db = 0.0
        for _ in range(6):
            o2 = loudnorm_olc(ff, cikti, gecici)
            if o2['tepe_dbtp'] <= TEPE_DBTP + 0.05 and abs(o2['lufs'] - HEDEF_LUFS) <= 0.3:
                break
            if o2['tepe_dbtp'] > TEPE_DBTP:
                tavan = 10 ** ((TEPE_DBTP - 0.4) / 20) * np.max(np.abs(cikti)) / 10 ** (o2['tepe_dbtp'] / 20)
                cikti, gr = sinirla(cikti, tavan)
                sinir_db = max(sinir_db, gr)
            o3 = loudnorm_olc(ff, cikti, gecici)
            cikti = cikti * 10 ** ((HEDEF_LUFS - o3['lufs']) / 20)
        son = loudnorm_olc(ff, cikti, gecici)
    ornek_tepe = float(np.max(np.abs(cikti)))
    olcum = dict(lufs=round(son['lufs'], 2), tepe_dbtp=round(son['tepe_dbtp'], 2), ornek_tepe=round(ornek_tepe, 4),
                 sinirlayici_en_cok_db=round(sinir_db, 2), kirpma=bool(ornek_tepe >= 1.0))
    print(json.dumps(dict(bolum=o.bolum, sure_sn=sure, ses_sayisi=len(yerlesim), olcum=olcum), ensure_ascii=False))
    if o.dry_run:
        print('--dry-run: dosya yazılmadı')
        return

    CIKIS.mkdir(parents=True, exist_ok=True)
    wav = CIKIS / f'seri-{o.bolum}.wav'
    wav24_yaz(wav, cikti)
    (CIKIS / f'seri-{o.bolum}-isaretler.json').write_text(json.dumps(veri, ensure_ascii=False, indent=1), encoding='utf-8')
    cizelge = dict(bolum=o.bolum, sure_sn=sure, olcum=olcum, hedef=dict(lufs=HEDEF_LUFS, tepe_dbtp=TEPE_DBTP), sesler=yerlesim)
    bind = {}
    for v in o.video:
        kay = Path(v)
        if not kay.is_absolute():
            kay = KOK / kay
        if not kay.exists():
            bind[kay.name] = 'kaynak yok'
            continue
        sesli = kay.with_name(kay.stem + '-sesli.mp4')
        subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(kay), '-i', str(wav),
                        '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', str(SR),
                        '-shortest', '-movflags', '+faststart', str(sesli)], check=True)
        bind[kay.name] = dict(sesli=sesli.name, boyut_kb=round(sesli.stat().st_size / 1024))
        if o.telefon:
            tel = kay.with_name(kay.stem + '-telefon.mp4')
            subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(sesli),
                            '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '2400k',
                            '-maxrate', '2800k', '-bufsize', '4800k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
                            '-movflags', '+faststart', str(tel)], check=True)
            bind[kay.name]['telefon'] = tel.name
            bind[kay.name]['telefon_kb'] = round(tel.stat().st_size / 1024)
        print('yazıldı:', *(p for p in [sesli, kay.with_name(kay.stem + '-telefon.mp4') if o.telefon else None] if p))
    cizelge['bindirme'] = bind
    (CIKIS / f'seri-{o.bolum}-cizelge.json').write_text(json.dumps(cizelge, ensure_ascii=False, indent=1), encoding='utf-8')
    print('yazıldı:', wav)


if __name__ == '__main__':
    main()
