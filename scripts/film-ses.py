# -*- coding: utf-8 -*-
"""
film-ses.py: Oktos tanıtım filmi (animatik M1) için müzik ve ses prototipi, tamamen kendi sentezimiz.

Amaç
  - İlk 4 sn'deki her yüz değişiminde bir piyano notası ("dın"); kesmelere kare kare oturur, A'da çözülür.
  - Altta 38,4 sn'lik küçük bir piyano müziği: şık, tok, keskin; kırıcı, yorucu ve distorsiyonlu değil.
  - Hazır müzik ya da ses örneği kullanılmaz (indirme yok, lisans derdi yok): piyano sesi sayısal olarak üretilir.

Girdi
  - Nota çizelgesi bu dosyada (PARTİSYON bölümü); kare zamanları lab/tanitim/film/v*.js ile eşleşir.
  - Montaj kesmeleri lab/tanitim/film/v1-kanca.js'teki `sure = [...]` dizisinden okunur (film değişirse notalar izler).
  - Doğrulama için .impeccable/film/animatik-m1-yatay.mp4 (yüz değişimleri görüntü farkından bulunur).

Çıktı (.impeccable/ses/)
  - film-ses.wav          : karışım (48 kHz, 24 bit, stereo), -16 LUFS hedefi, tepe <= -1 dBFS
  - kesme-notalari.wav    : yalnız yüz değişimi notaları (aynı kazançla, 38,4 sn, sıfırdan hizalı)
  - cizelge.json          : nota çizelgesi, pedal, bölümler, ölçümler ve doğrulama
  - .impeccable/film/animatik-m1-{yatay,dikey}-sesli.mp4 : görüntü kopyalanır, ses AAC 192k (--bindirme-yok ile atlanır)

Kullanım
  python scripts/film-ses.py              # üret, ölç, bindir
  python scripts/film-ses.py --dry-run    # üret ve ölç, hiçbir dosya yazma
  python scripts/film-ses.py --hizli      # az kısmi sesle hızlı önizleme

Tekrar çalıştırmak güvenlidir: aynı tohum aynı dosyayı üretir; yalnız yukarıdaki kendi çıktılarının üzerine yazar.
Gereken: Python 3, numpy, ffmpeg (PATH'te, FFMPEG ortam değişkeninde ya da WinGet Gyan.FFmpeg paketinde).
"""
import argparse
import glob
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

import numpy as np

# =====================================================================================================
# PARAMETRELER
# =====================================================================================================
SR = 48000                 # örnekleme hızı (video standardı)
FPS = 60                   # film kare hızı
TOPLAM_KARE = 2304         # 38,4 sn
BPM = 150                  # vuruş 24 kare, ölçü 96 kare (plan v04)
TOHUM = 20261021           # aynı tohum → aynı dosya
HEDEF_LUFS = -16.0         # sosyal medya
TEPE_DBTP = -1.0           # gerçek tepe tavanı
SON_KARARMA_SN = 0.5       # dosya sonunda yumuşak kararma (son akor 38,4 sn'de kesilmesin)

PIYANO = dict(
    f_tavan=7000.0,        # bunun üstünde kısmi ses üretilmez (sertlik bandını yormasın)
    kismi_max=36,          # en çok kısmi sayısı (bas notalar)
    inh_a=7e-5, inh_b=0.046,       # uyumsuzluk katsayısı B(m) = a·e^(b·(m-48)); tizde artar
    cekic_yeri=1 / 7.7,    # çekiç telin 1/7,7'sine vurur → bu kısmi sesler zayıflar
    tau_yavas=3.4,         # 220 Hz kısminin yavaş sönümü (sn); frekansla (220/f)^0,75 kısalır
    tau_us=0.75,
    hizli_oran=0.2,        # ilk (hızlı) sönüm, yavaşın bu oranı
    yavas_pay=0.32,        # ikinci sönümün (tını kuyruğu) payı
    dinamik_db=32.0,       # hız 0 → -32 dB, hız 1 → 0 dB
    akort_sent=(0.35, 0.9),  # teller arası akort farkı (sent), notaya göre rastgele
    cekic_db=-27.0,        # çekiç gürültüsü (nota düzeyine göre), hızla +7 dB
    vuruntu_db=-30.0,      # tabla vuruntusu (gövde, "tok")
    atak_ms=0.6,           # tıkırtı olmasın diye en kısa açılış
    pan_genislik=0.42,     # bas solda, tiz sağda (çalan kişinin kulağı)
)
YANKI = dict(rt60=(1.45, 1.35, 1.2, 0.9, 0.55, 0.3),   # bant başına (125, 350, 1k, 2,8k, 7k, 14k Hz)
             merkez=(125, 350, 1000, 2800, 7000, 14000),
             sure=2.4, on_gecikme_ms=11.0, islak_db=-13.0, islak_hp=150.0)
EQ = dict(hp=35.0, alt_raf_db=1.0, alt_raf_f=170.0, sert_db=-1.5, sert_f=3200.0, sert_q=0.9, lp=12000.0)

KOK = Path(__file__).resolve().parent.parent
CIKIS = KOK / '.impeccable' / 'ses'
FILM = KOK / '.impeccable' / 'film'
KANCA_JS = KOK / 'lab' / 'tanitim' / 'film' / 'v1-kanca.js'

# =====================================================================================================
# YARDIMCILAR
# =====================================================================================================
_ADLAR = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
_TERS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def midi(ad):
    m = re.fullmatch(r'([A-G]#?)(-?\d)', ad)
    return 12 * (int(m.group(2)) + 1) + _ADLAR[m.group(1)]


def nota_adi(m):
    return f'{_TERS[m % 12]}{m // 12 - 1}'


def kare_sn(k):
    return k / FPS


def kare_ornek(k):
    return int(round(k * SR / FPS))   # 60 fps, 48 kHz: tam 800 örnek/kare


# =====================================================================================================
# PARTİSYON (Re majör; 150 BPM; ölçü 96 kare. Akorlar: I=Dmaj9, vi=Bm9, IV=Gmaj7/9, ii=Em9, V=A7sus4)
# =====================================================================================================
def kanca_kesmeleri():
    """v1-kanca.js'ten montaj kesmelerini okur: k24'ten başlar, `sure` dizisi kadar ilerler, sonda A."""
    yedek = [18, 18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 8, 8, 8]
    sure, kaynak = yedek, 'yedek (v1-kanca.js okunamadı)'
    try:
        metin = KANCA_JS.read_text(encoding='utf-8')
        m = re.search(r'const sure = \[([\d,\s]+)\]', metin)
        if m:
            sure, kaynak = [int(x) for x in m.group(1).split(',') if x.strip()], 'lab/tanitim/film/v1-kanca.js'
    except OSError:
        pass
    kesmeler, t = [24], 24
    for s in sure[:-1]:
        t += s
        kesmeler.append(t)
    a_karesi = t + sure[-1]
    return kesmeler, a_karesi, kaynak


def partisyon():
    N, PEDAL = [], []

    def n(k, ad, v, d, et='', parca='muzik'):
        N.append(dict(kare=int(k), m=midi(ad), hiz=round(float(v), 3), sure=int(d), parca=parca, etiket=et))

    def akor(k, adlar, v, d, et=''):
        for ad in adlar:
            n(k, ad, v, d, et)

    def dizi(k, adlar, ara, v0, v1, d, et=''):
        for i, ad in enumerate(adlar):
            v = v0 + (v1 - v0) * (i / max(1, len(adlar) - 1))
            n(k + i * ara, ad, v, d, et)

    # ---------- #1–#3 KANCA (k0–239): her yüz bir "dın"; majör pentatonik, kesmeler hızlandıkça dalga dalga
    # yükselir (A3 → A5), üçlemede (8 k) iner ve A'da tonik Re'ye adımla çözülür. Pedal yok: her ton ayrı ve net.
    kesmeler, a_k, kaynak = kanca_kesmeleri()
    KANCA_DIZI = ['A3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'A4', 'D5', 'B4', 'E5', 'D5', 'F#5', 'A5', 'F#5', 'E5']
    yuzler = [0] + kesmeler                      # k0: nozul M1'i basar (ilk yüz)
    if len(yuzler) != len(KANCA_DIZI):           # film değişirse kontur yeniden örneklenir
        KANCA_DIZI = [KANCA_DIZI[round(i * (len(KANCA_DIZI) - 1) / max(1, len(yuzler) - 1))] for i in range(len(yuzler))]
    for i, k in enumerate(yuzler):
        sonraki = yuzler[i + 1] if i + 1 < len(yuzler) else a_k
        v = 0.46 + 0.10 * min(1, i / 12) - (0.03 if i >= 13 else 0)
        n(k, KANCA_DIZI[i], v, sonraki - k + (2 if i + 1 < len(yuzler) else -1), f'yüz {i + 1}', 'kesme')  # son yüz A'dan önce kalkar
    n(a_k, 'D5', 0.60, 48, 'A durur: çözülme', 'kesme')
    akor(0, ['D2', 'A2'], 0.36, 96, 'kanca: Re boşluğu')
    akor(96, ['G2', 'D3'], 0.34, 96, 'kanca: Sol')
    akor(a_k, ['D2', 'A2'], 0.48, 96, 'A: Dmaj9')
    akor(a_k, ['F#3', 'C#4', 'E4'], 0.40, 96, 'A: Dmaj9')
    PEDAL.append((a_k, 287))

    # ---------- #4–#9 ZAR (A): sekme motifi (sekizlik, iki onaltılık, dörtlük: "zar yuvarlanır ve oturur")
    n(240, 'A4', 0.46, 12, 'A motifi'); n(252, 'F#4', 0.38, 6, 'A motifi'); n(258, 'A4', 0.40, 6, 'A motifi')
    n(264, 'D5', 0.48, 24, 'A motifi')
    akor(288, ['B1', 'F#2'], 0.44, 96, 'Bm9'); akor(288, ['D4', 'A4'], 0.32, 48, 'Bm9')
    dizi(300, ['C#5', 'D5', 'F#5'], 6, 0.32, 0.36, 6, 'd6 → d20')
    dizi(330, ['B4', 'D5', 'E5', 'F#5', 'A5'], 6, 0.30, 0.36, 6, 'set yaya dağılır')
    n(360, 'D5', 0.42, 12, 'A motifi (cevap)'); n(372, 'B4', 0.36, 6, 'A motifi (cevap)'); n(378, 'D5', 0.38, 6, 'A motifi (cevap)')
    PEDAL.append((288, 383))
    n(384, 'E5', 0.42, 24, '+ şeffaf'); akor(384, ['G2', 'D3'], 0.42, 72, 'Gmaj7')
    akor(384, ['F#3', 'B3'], 0.30, 72, 'Gmaj7')
    dizi(396, ['D6', 'B5', 'F#5', 'A5'], 12, 0.28, 0.25, 6, 'cam parıltısı')
    PEDAL.append((384, 455))
    # k456–479 bilinçli sessizlik (SUSTURMA)
    akor(480, ['D2', 'A2'], 0.52, 96, 'GERÇEK 1'); akor(480, ['F#4', 'A4', 'E5'], 0.40, 96, 'GERÇEK 1')
    n(480, 'D6', 0.33, 96, 'GERÇEK 1: ışıltı')
    dizi(492, ['A5', 'F#5', 'E5', 'D5', 'A4', 'F#4'], 6, 0.32, 0.26, 6, 'reçine zarlar dolar')
    n(540, 'A4', 0.42, 12, 'A sırıtır'); n(552, 'F#4', 0.36, 6, 'A sırıtır'); n(558, 'A4', 0.38, 6, 'A sırıtır')
    n(564, 'D5', 0.44, 12, 'A sırıtır')
    PEDAL.append((480, 575))
    akor(576, ['B1', 'F#2'], 0.40, 48, 'Bm7'); akor(576, ['A4', 'D5'], 0.28, 24, 'balon küçülür')
    PEDAL.append((576, 623))
    n(600, 'F#4', 0.44, 12, 'M16', 'kesme'); n(612, 'A4', 0.46, 12, 'M17', 'kesme')

    # ---------- #10–#14 MÜHENDİS (B): ölçen, düzenli sekizlikler (cetvel tıkırtısı), pedalsız ve kısa
    n(624, 'G2', 0.38, 48, 'B iner')
    dizi(624, ['D4', 'F#4', 'E4', 'A4'], 12, 0.40, 0.42, 8, 'B motifi')
    akor(672, ['E2', 'B2'], 0.42, 96, 'Em9: vidalar kayar')
    dizi(672, ['G5', 'F#5', 'D5', 'B4', 'A4', 'F#4', 'E4'], 6, 0.34, 0.26, 6, 'vidalar kayar')
    dizi(712, ['D6', 'B5', 'A5', 'F#5'], 6, 0.24, 0.22, 4, 'poşetten 4 vida')
    PEDAL.append((672, 743))
    n(768, 'G2', 0.40, 48, 'Gmaj7'); n(768, 'D3', 0.36, 48, 'Gmaj7')
    dizi(768, ['D4', 'F#4', 'E4', 'A4'], 12, 0.42, 0.44, 9, 'B motifi: Bir organizer lazım.')
    akor(816, ['A1', 'E2'], 0.40, 96, 'A7sus4: Sığar mı?')
    n(816, 'D5', 0.40, 24, 'soru'); n(840, 'E5', 0.38, 24, 'soru (çözülmez)')
    n(864, 'F#4', 0.34, 12, '"84 mm?"'); n(876, 'G4', 0.34, 36, '"?" (sus4 asılı)')
    PEDAL.append((816, 911))
    akor(912, ['B1', 'F#2'], 0.36, 48, 'iç çekiş')
    n(912, 'A4', 0.36, 12, 'iç çekiş'); n(924, 'F#4', 0.32, 12, 'iç çekiş'); n(936, 'E4', 0.30, 24, 'iç çekiş')
    n(930, 'B5', 0.25, 4, 'geç kalan vida devrilir')
    PEDAL.append((912, 959))

    # ---------- #15–#16 OYUNCU (C): eskizler onaltılık üçlüler; ilk ikisi karalanınca susar, üçüncüsü halkayla çınlar
    akor(960, ['G2', 'D3'], 0.38, 96, 'Gmaj7: "?" yükselir')
    n(972, 'B4', 0.44, 12, 'M18', 'kesme'); n(984, 'D5', 0.46, 12, 'M19', 'kesme')
    akor(1008, ['D4', 'F#4'], 0.30, 24, 'C rafın önünde')
    PEDAL.append((960, 1031))
    dizi(1032, ['A4', 'B4', 'D5'], 6, 0.36, 0.36, 13, 'eskiz 1')       # k1045 karalanır → susar
    akor(1056, ['E2', 'B2'], 0.36, 48, 'Em9')
    dizi(1056, ['B4', 'D5', 'E5'], 6, 0.38, 0.38, 13, 'eskiz 2')       # k1069 karalanır → susar
    dizi(1080, ['D5', 'E5', 'F#5'], 6, 0.42, 0.42, 20, 'eskiz 3 (halka)')
    n(1100, 'A5', 0.30, 4, 'halka kapanır')
    PEDAL.append((1080, 1103))
    for p in N:   # eskiz 1–2'nin notaları kısa kalsın (karalama anında kesilir)
        if p['etiket'] == 'eskiz 1':
            p['sure'] = 1045 - p['kare']
        if p['etiket'] == 'eskiz 2':
            p['sure'] = 1069 - p['kare']
    akor(1104, ['A1', 'E2'], 0.38, 48, 'A7sus4: balon yükselir')
    n(1116, 'E4', 0.42, 12, 'M20', 'kesme'); n(1128, 'A4', 0.44, 12, 'M21', 'kesme')
    PEDAL.append((1104, 1151))

    # ---------- #17–#20 SAKSI (D): sıcak, kendinden emin şarkı cümlesi; çekme anları legato, aşırı çekiş komik koşu
    akor(1152, ['D2', 'A2'], 0.44, 96, 'Dmaj7')
    n(1152, 'F#4', 0.42, 24, 'D motifi'); n(1176, 'A4', 0.40, 12, 'D motifi'); n(1188, 'B4', 0.40, 12, 'D motifi')
    n(1200, 'D5', 0.44, 36, 'D motifi'); n(1236, 'C#5', 0.38, 12, 'D motifi')
    PEDAL.append((1152, 1247))
    akor(1248, ['B1', 'F#2'], 0.40, 78, 'Bm7: tutamaçlar')
    dizi(1248, ['B4', 'D5', 'F#5'], 4, 0.28, 0.28, 6, 'tutamaçlar belirir')
    n(1282, 'D5', 0.38, 12, 'bel verir'); n(1294, 'C#5', 0.36, 12, 'bel verir'); n(1306, 'B4', 0.36, 18, 'bel verir')
    PEDAL.append((1248, 1325))
    dizi(1326, ['D5', 'F#5', 'A5'], 4, 0.32, 0.34, 4, 'fazla çeker, gülünç uzar')
    akor(1344, ['G2', 'D3'], 0.38, 48, 'Gmaj7')
    dizi(1350, ['F#5', 'E5', 'C#5'], 12, 0.34, 0.32, 12, 'geri iter: yivli ağız (#11 renk)')
    n(1386, 'D5', 0.42, 30, 'onaylar')
    PEDAL.append((1344, 1391))
    akor(1392, ['A1', 'E2'], 0.40, 48, 'A7sus4'); akor(1392, ['G4', 'E5'], 0.30, 24, 'A7sus4')
    n(1416, 'C#5', 0.36, 24, 'yeden (GERÇEK 2 öncesi)')
    PEDAL.append((1392, 1439))
    akor(1440, ['D2', 'A2'], 0.50, 96, 'GERÇEK 2'); akor(1440, ['F#4', 'A4'], 0.38, 96, 'GERÇEK 2')
    n(1440, 'D6', 0.32, 48, 'GERÇEK 2: ışıltı')
    n(1452, 'A4', 0.36, 24, 'PLA'); n(1488, 'D5', 0.38, 24, 'taş tozu'); n(1512, 'E5', 0.40, 24, 'reçine')
    PEDAL.append((1440, 1535))
    akor(1536, ['B1', 'F#2'], 0.42, 48, 'Bm9'); n(1536, 'F#5', 0.42, 24, 'epoksi')
    dizi(1560, ['A5', 'F#5', 'E5', 'D5'], 6, 0.30, 0.28, 6, 'hızlı tur')
    PEDAL.append((1536, 1583))
    akor(1584, ['G2', 'D3'], 0.42, 48, 'Gmaj9: tık'); akor(1584, ['D5', 'A5'], 0.44, 10, 'D dokunur: tık')
    PEDAL.append((1584, 1631))

    # ---------- #21–#26 FİNAL: ızgara arpeji → bir vuruş sessizlik → "Bunlar için" → GERÇEK 3 her vuruşta bir akor
    akor(1632, ['G1', 'G2'], 0.42, 48, 'Gmaj9: ızgara')
    dizi(1632, ['G3', 'B3', 'D4', 'F#4', 'A4'], 4, 0.34, 0.40, 40, 'paneller çizilir')
    PEDAL.append((1632, 1679))
    # k1680–1703 sessizlik (SUSTURMA)
    n(1704, 'A4', 0.40, 12, 'Bunlar için'); n(1716, 'C#5', 0.42, 12, 'Bunlar için (yeden)')
    PEDAL.append((1704, 1727))
    for k0, sol, sag, et in [(1728, ['D2', 'A2'], ['F#4', 'A4', 'D5'], 'Oktos · B organizer'),
                             (1752, ['B1', 'F#2'], ['D4', 'A4', 'E5'], 'C figür'),
                             (1776, ['G2', 'D3'], ['A4', 'D5', 'F#5'], 'A zarlar'),
                             (1800, ['A1', 'E2'], ['D5', 'E5', 'A5'], 'D saksı')]:
        akor(k0, sol, 0.50, 24, 'GERÇEK 3: ' + et); akor(k0, sag, 0.45, 24, 'GERÇEK 3: ' + et)
        PEDAL.append((k0, k0 + 23))
    akor(1824, ['G2', 'D3'], 0.42, 48, 'kahraman kare: Gmaj9'); akor(1824, ['B3', 'F#4', 'A4', 'D5'], 0.33, 48, 'kahraman kare')
    n(1848, 'E5', 0.36, 24, 'kahraman kare')
    PEDAL.append((1824, 1871))
    akor(1872, ['E2', 'B2'], 0.38, 48, 'Em9')
    n(1872, 'D5', 0.34, 12, 'kahraman kare'); n(1884, 'B4', 0.32, 12, 'kahraman kare'); n(1896, 'A4', 0.34, 24, 'kahraman kare')
    PEDAL.append((1872, 1919))
    akor(1920, ['A1', 'A2'], 0.46, 72, 'nozul sarar: A7sus4')
    dizi(1920, ['E4', 'A4', 'D5', 'E5'], 12, 0.38, 0.50, 12, 'nozul sarar (yükseliş)')
    PEDAL.append((1920, 1967))
    akor(1968, ['G4', 'D5', 'A5'], 0.48, 12, 'logoya dönüşüm'); n(1980, 'C#5', 0.48, 12, 'yeden')
    PEDAL.append((1968, 1991))
    # DORUK: logo dolar (k1990); Dmaj9 geniş açılım
    akor(1992, ['D1'], 0.46, 120, 'DORUK: logo'); akor(1992, ['D2'], 0.54, 120, 'DORUK: logo')
    akor(1992, ['A2', 'F#3'], 0.47, 120, 'DORUK: logo'); akor(1992, ['C#4', 'E4', 'A4'], 0.43, 120, 'DORUK: logo')
    n(1992, 'D5', 0.58, 120, 'DORUK: logo'); n(1992, 'F#5', 0.55, 120, 'DORUK: logo')
    dizi(2016, ['E5', 'D5', 'A4', 'F#4', 'E4', 'D4'], 12, 0.36, 0.26, 12, 'gökyüzü: çözülme')
    n(2088, 'A3', 0.26, 24, 'gökyüzü: çözülme')
    PEDAL.append((1992, 2111))
    akor(2112, ['D2'], 0.36, 96, 'Sol/Re (plagal)'); akor(2112, ['G3', 'B3', 'F#4'], 0.30, 96, 'Sol/Re (plagal)')
    n(2112, 'B4', 0.32, 24, 'gökyüzü'); n(2136, 'A4', 0.30, 24, 'gökyüzü'); n(2160, 'F#4', 0.28, 48, 'gökyüzü')
    PEDAL.append((2112, 2207))
    akor(2208, ['D2', 'A2'], 0.36, 96, 'son: Dadd9'); akor(2208, ['E4', 'F#4', 'A4', 'D5'], 0.30, 96, 'son: Dadd9')
    n(2208, 'A5', 0.24, 96, 'son')
    PEDAL.append((2208, TOPLAM_KARE))

    SUSTURMA = [456, 1680]    # bilinçli sessizlikler: her tuş ve pedal bu karede kalkar
    N.sort(key=lambda p: (p['kare'], p['m']))
    # Akorlar elle çalınmış gibi alttan üste hafifçe açılır (bas tam vuruşta; nota başına 6 ms, doruğa 9 ms).
    # Kesme notaları kaydırılmaz: kareye tam oturur.
    gruplar = {}
    for p in N:
        p['ofset_ms'] = 0.0
        if p['parca'] == 'muzik':
            gruplar.setdefault(p['kare'], []).append(p)
    for k, g in gruplar.items():
        if len(g) > 1:
            for i, p in enumerate(sorted(g, key=lambda q: q['m'])):
                p['ofset_ms'] = round(i * (9.0 if k == 1992 else 6.0), 1)
    return N, sorted(PEDAL), SUSTURMA, dict(kesmeler=yuzler, a_karesi=a_k, kaynak=kaynak)


BOLUMLER = [
    dict(ad='Kanca ve montaj', kare=(0, 239), icerik='Her yüzde bir nota (A3→A5 pentatonik dalga, üçlemede iner), k192 A: Re\'ye çözülür (Dmaj9).'),
    dict(ad='Vinyet A: zar', kare=(240, 623), icerik='Sekme motifi (8-16-16-4); d20 ve set arpejleri; "+ şeffaf" cam parıltısı; k456 sessizlik; k480 GERÇEK 1 vurgusu; M16, M17 notaları.'),
    dict(ad='Vinyet B: mühendis', kare=(624, 959), icerik='Pedalsız, ölçülü sekizlikler; vidalar inen onaltılık; "Sığar mı?" sus4 asılı kalır; iç çekiş inen üçlü.'),
    dict(ad='Vinyet C: figür', kare=(960, 1151), icerik='M18, M19 notaları; üç eskiz onaltılık üçlü: ikisi karalanınca kesilir, üçüncüsü halkayla çınlar; M20, M21.'),
    dict(ad='Vinyet D: saksı', kare=(1152, 1631), icerik='Sıcak şarkı cümlesi; bel legato, aşırı çekiş komik koşu, geri itiş inen legato, onay; GERÇEK 2 ve malzeme başına bir nota; "tık".'),
    dict(ad='Final', kare=(1632, 2207), icerik='Izgara arpeji, k1680 bir vuruş sessizlik, "Bunlar için" yeden, GERÇEK 3 her vuruşta I–vi–IV–V, kahraman kare, nozul yükselişi, k1992 logo DORUK (Dmaj9), gökyüzünde inen çözülme.'),
    dict(ad='Son', kare=(2208, 2303), icerik='Dadd9, pedallı; son 0,5 sn yumuşak kararma.'),
]


def birakma_karesi(p, pedal, susturma):
    """Tuşun kalktığı kare; pedal basılıysa pedalın kalktığı kare. Susturma anları her şeyi keser."""
    tus = p['kare'] + p['sure']
    son = tus
    for a, b in pedal:
        if a <= tus <= b and p['kare'] <= b:
            son = b + 1
            break
    for s in susturma:
        if p['kare'] < s < son:
            son = s
    return son


# =====================================================================================================
# PİYANO SENTEZİ
# =====================================================================================================
def nota_ciz(m, v, birak, uzunluk_max, rng, P, hizli=False):
    """Tek nota, t=0'dan; dönüş (2, L). birak: damper anı (örnek) ya da None (damper yok)."""
    f0 = 440.0 * 2 ** ((m - 69) / 12)
    B = P['inh_a'] * math.exp(P['inh_b'] * (m - 48))
    kmax = 10 if hizli else P['kismi_max']
    n = np.arange(1, kmax + 1, dtype=float)
    fn = n * f0 * np.sqrt(1 + B * n * n)
    sec = fn < P['f_tavan']
    n, fn = n[sec], fn[sec]
    # Tayf: çekiç yeri tarağı × hızla açılan eğim × hıza bağlı yumuşak alçak geçiren × sabit tavan
    tarak = 0.3 + 0.7 * np.abs(np.sin(np.pi * n * P['cekic_yeri']))
    egim = n ** -(1.15 - 0.55 * v)
    fc = min(5200.0, max(1200.0, f0 * (4.0 + 16.0 * v ** 1.4)))
    alcak = 1 / np.sqrt(1 + (fn / fc) ** 4)
    tavan = 1 / np.sqrt(1 + (fn / 6500.0) ** 6)
    a = tarak * egim * alcak * tavan
    if m < 48:   # baslarda temel ses zayıf, gövde 2.–4. kısmide (tok ama gümbürtüsüz)
        a[0] *= min(1.0, max(0.35, 0.35 + (m - 24) * 0.03))
        if m < 36 and len(a) > 1:
            a[1] *= 0.85
    a /= np.sqrt(np.sum(a ** 2))
    # Hız ve kayıt dengesi (tiz biraz kısılır, bas biraz açılır)
    kazanc_db = P['dinamik_db'] * (v - 1) - 0.18 * max(0, m - 72)
    g = 10 ** (kazanc_db / 20)
    # Sönüm: iki aşamalı (hızlı vuruş sesi + yavaş kuyruk)
    tau_y = np.clip(P['tau_yavas'] * (220.0 / fn) ** P['tau_us'], 0.05, 14.0)
    tau_h = P['hizli_oran'] * tau_y + 0.005
    w_y = P['yavas_pay'] * np.clip(1.2 - fn / 4000, 0.4, 1.0)
    # Damper (tizde damper yok: F6 ve üstü)
    damper = birak is not None and m < 89
    td = np.clip(0.09 * (300.0 / fn) ** 0.25, 0.025, 0.25) * (1.8 if m < 40 else 1.0)
    # Kısmi başına uzunluk: -80 dB'ye inene dek (damperli ise bırakma + 9·td)
    L_k = np.minimum(uzunluk_max, (9.2 * tau_y * SR).astype(int))
    if damper:
        L_k = np.minimum(L_k, birak + (9.2 * td * SR).astype(int))
    L = int(max(L_k.max(), 1))
    sol = np.zeros(L); sag = np.zeros(L)
    # Teller: 1–3, hafif akort farkı; her tel biraz farklı yerde (stereo genişlik)
    tel = 1 if m < 30 else (2 if m < 45 else 3)
    yay = rng.uniform(*P['akort_sent'])
    sapma = {1: [0.0], 2: [-0.5, 0.5], 3: [-1.0, 0.07, 1.0]}[tel]
    sapma = [s * yay + rng.normal(0, 0.06) for s in sapma]
    pan0 = np.clip((m - 64) / 40, -1, 1) * P['pan_genislik']
    tel_pan = [pan0 + (i - (tel - 1) / 2) * 0.08 for i in range(tel)]
    tel_g = [(math.cos((p + 1) * math.pi / 4), math.sin((p + 1) * math.pi / 4)) for p in tel_pan]
    t_tum = np.arange(L) / SR
    for i in range(len(fn)):
        Li = int(L_k[i])
        if Li < 8:
            continue
        t = t_tum[:Li]
        zarf = (1 - w_y[i]) * np.exp(-t / tau_h[i]) + w_y[i] * np.exp(-t / tau_y[i])
        if damper and birak < Li:
            zarf[birak:] *= np.exp(-(t[birak:] - t[birak]) / td[i])
        zarf *= a[i] * g / tel
        faz0 = rng.uniform(0, 2 * np.pi)   # kısmiler rastgele evrede: tepe/RMS düşer (tını değişmez), açılış rampası tıkırtıyı önler
        for s in range(tel):
            f = fn[i] * (1 + sapma[s] / 1731.234)
            faz = faz0 + rng.uniform(-0.3, 0.3)
            dalga = np.sin(2 * np.pi * f * t + faz) * zarf
            sol[:Li] += tel_g[s][0] * dalga
            sag[:Li] += tel_g[s][1] * dalga
    # Çekiç: kısa bant geçiren gürültü (keskin atak) + tabla vuruntusu (gövde)
    Lh = min(L, int(0.06 * SR))
    th = t_tum[:Lh]
    gur = rng.standard_normal(Lh)
    X = np.fft.rfft(gur); fr = np.fft.rfftfreq(Lh, 1 / SR)
    fh = min(3200.0, max(900.0, f0 * 5))
    H = np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / fh) / 0.9) ** 2)
    gur = np.fft.irfft(X * H, Lh)
    gur /= (np.sqrt(np.mean(gur ** 2)) + 1e-12)
    gur *= np.exp(-th / (0.0025 + 0.004 * (1 - v))) * (1 - np.exp(-th / 0.0004))
    gur *= 10 ** ((P['cekic_db'] + 7 * v) / 20) * g
    fv = min(180.0, 95 + 0.3 * f0)
    vur = np.sin(2 * np.pi * fv * th) * np.exp(-th / 0.018) * 10 ** ((P['vuruntu_db'] + 8 * v) / 20) * g
    ek = gur + vur
    sol[:Lh] += ek * tel_g[0][0] * 1.0; sag[:Lh] += ek * tel_g[-1][1] * 1.0
    # Açılış rampası (tıkırtı yok)
    La = max(2, int(P['atak_ms'] * 1e-3 * SR))
    ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, La))
    sol[:La] *= ramp; sag[:La] *= ramp
    return np.vstack([sol, sag])


def cal(notalar, pedal, susturma, parca, rng, hizli=False):
    N = kare_ornek(TOPLAM_KARE)
    kuru = np.zeros((2, N))
    for p in notalar:
        if p['parca'] != parca:
            continue
        bas = kare_ornek(p['kare']) + int(round(p.get('ofset_ms', 0.0) * SR / 1000))
        bk = birakma_karesi(p, pedal, susturma)
        p['birakma_kare'] = bk
        birak = kare_ornek(bk) - bas
        y = nota_ciz(p['m'], p['hiz'], birak, N - bas, rng, PIYANO, hizli)
        L = min(y.shape[1], N - bas)
        kuru[:, bas:bas + L] += y[:, :L]
    return kuru


# =====================================================================================================
# YANKI (sentetik dürtü yanıtı, FFT evrişimi) ve EQ
# =====================================================================================================
def _fft_boy(n):
    return 1 << (int(n) - 1).bit_length()


def yanki_ir(rng, Y):
    L = int(Y['sure'] * SR)
    t = np.arange(L) / SR
    fr = np.fft.rfftfreq(L, 1 / SR)
    lf = np.log2(np.maximum(fr, 1.0))
    merkez = np.log2(np.array(Y['merkez'], dtype=float))
    # Bantlar: log frekansta yumuşak üçgen pencereler (toplamları 1)
    W = np.zeros((len(merkez), len(fr)))
    for b in range(len(merkez)):
        if b == 0:
            W[b] = np.clip((merkez[1] - lf) / (merkez[1] - merkez[0]), 0, 1)
        elif b == len(merkez) - 1:
            W[b] = np.clip((lf - merkez[b - 1]) / (merkez[b] - merkez[b - 1]), 0, 1)
        else:
            W[b] = np.clip(np.minimum((lf - merkez[b - 1]) / (merkez[b] - merkez[b - 1]),
                                      (merkez[b + 1] - lf) / (merkez[b + 1] - merkez[b])), 0, 1)
    irler = []
    gec = int(Y['on_gecikme_ms'] * 1e-3 * SR)
    for kanal in range(2):
        X = np.fft.rfft(rng.standard_normal(L))
        ir = np.zeros(L)
        for b, rt in enumerate(Y['rt60']):
            ir += np.fft.irfft(X * W[b], L) * np.exp(-6.9078 * t / rt)
        ir *= 1 - np.exp(-t / 0.015)                      # dağınık kuyruk yavaşça dolar
        ir = np.concatenate([np.zeros(gec), ir[:L - gec]])
        for ms, kz in zip([5.3, 8.9, 13.7, 19.1, 26.3, 33.9], [0.55, 0.42, 0.35, 0.28, 0.22, 0.17]):  # erken yansımalar
            j = int((ms + rng.uniform(-1.2, 1.2) + 0.7 * kanal) * 1e-3 * SR)
            ir[j:j + 3] += kz * rng.choice([-1, 1]) * np.array([0.5, 1.0, 0.5]) * 0.12
        # Islak sinyalden bas çamuru alınır
        Xi = np.fft.rfft(ir)
        Xi *= (fr / Y['islak_hp']) ** 2 / np.sqrt(1 + (fr / Y['islak_hp']) ** 4)
        ir = np.fft.irfft(Xi, L)
        ir /= np.sqrt(np.sum(ir ** 2))
        irler.append(ir)
    return np.vstack(irler)


def yanki_uygula(kuru, ir, islak_db):
    N = kuru.shape[1]
    orta = kuru.mean(axis=0)
    nf = _fft_boy(N + ir.shape[1])
    O = np.fft.rfft(orta, nf)
    islak = np.vstack([np.fft.irfft(O * np.fft.rfft(ir[c], nf), nf)[:N] for c in range(2)])
    return kuru + islak * 10 ** (islak_db / 20)


def eq_uygula(x, E):
    N = x.shape[1]
    nf = _fft_boy(N + SR)
    fr = np.fft.rfftfreq(nf, 1 / SR)
    f = np.maximum(fr, 1e-3)
    H = (f / E['hp']) ** 2 / np.sqrt(1 + (f / E['hp']) ** 4)                       # 35 Hz alçak kesme
    raf = 10 ** (E['alt_raf_db'] / 20)
    H *= 1 + (raf - 1) / (1 + (f / E['alt_raf_f']) ** 2)                            # tokluk: hafif alt raf
    cn = 10 ** (E['sert_db'] / 20)
    H *= 1 + (cn - 1) * np.exp(-0.5 * (np.log2(f / E['sert_f']) / (0.5 / E['sert_q'])) ** 2)  # 3,2 kHz yumuşatma
    H *= 1 / np.sqrt(1 + (f / E['lp']) ** 4)                                         # 12 kHz üstü yumuşak
    return np.vstack([np.fft.irfft(np.fft.rfft(x[c], nf) * H, nf)[:N] for c in range(2)])


# =====================================================================================================
# SINIRLAYICI (yalnız gerekirse; ileri bakan, yumuşak kazanç eğrisi, kırpma yok)
# =====================================================================================================
def kayan_min(a, w):
    n = len(a)
    pad = (-n) % w
    b = np.concatenate([a, np.full(pad + w, np.inf)])
    B = b.reshape(-1, w)
    on = np.minimum.accumulate(B, axis=1).reshape(-1)
    arka = np.minimum.accumulate(B[:, ::-1], axis=1)[:, ::-1].reshape(-1)
    return np.minimum(arka[:n], on[w - 1:w - 1 + n])


def kutu(a, w):
    c = np.concatenate([[0.0], np.cumsum(a)])
    yar = w // 2
    i0 = np.clip(np.arange(len(a)) - yar, 0, len(a)); i1 = np.clip(np.arange(len(a)) + yar + 1, 0, len(a))
    return (c[i1] - c[i0]) / (i1 - i0)


def sinirla(x, tavan_lin, pencere_ms=10.0):
    tepe = np.max(np.abs(x), axis=0)
    gerek = np.minimum(1.0, tavan_lin / np.maximum(tepe, 1e-12))
    if gerek.min() >= 1.0:
        return x, 0.0, 0, None
    W = int(pencere_ms * 1e-3 * SR)
    g = kayan_min(np.concatenate([np.ones(W), gerek, np.ones(W)]), 2 * W + 1)[:len(gerek)]
    g = kutu(kutu(g, W + 1), W + 1)
    g = np.minimum(g, 1.0)
    return x * g, float(-20 * np.log10(g.min())), int(np.sum(g < 0.999)), round(int(np.argmin(g)) / SR, 2)


# =====================================================================================================
# ÖLÇÜM VE DOĞRULAMA
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
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b)


def loudnorm_olc(ff, x, gecici):
    """ffmpeg loudnorm (EBU R128) ile tümleşik ses yüksekliği ve gerçek tepe. x ölçeklenip yazılır, sonuç geri ölçeklenir."""
    olcek = 0.5 / max(1e-9, np.max(np.abs(x)))
    yol = Path(gecici) / 'olcum.wav'
    wav24_yaz(yol, x * olcek)
    r = subprocess.run([ff, '-hide_banner', '-nostats', '-i', str(yol), '-af',
                        f'loudnorm=I={HEDEF_LUFS}:TP={TEPE_DBTP}:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    j = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    duz = 20 * math.log10(olcek)
    return dict(lufs=float(j['input_i']) - duz, tepe_dbtp=float(j['input_tp']) - duz, lra=float(j['input_lra']))


def tayf_olc(x):
    mono = x.mean(axis=0)
    n = 8192
    pen = np.hanning(n)
    kare = [mono[i:i + n] * pen for i in range(0, len(mono) - n, n // 2)]
    G = np.mean(np.abs(np.fft.rfft(np.array(kare), axis=1)) ** 2, axis=0)
    fr = np.fft.rfftfreq(n, 1 / SR)
    top = G.sum()
    bantlar = {}
    for ad, (a, b) in {'<100': (0, 100), '100-500': (100, 500), '500-2k': (500, 2000), '2-5k (sertlik)': (2000, 5000),
                       '5-10k': (5000, 10000), '>10k': (10000, SR / 2)}.items():
        e = G[(fr >= a) & (fr < b)].sum()
        bantlar[ad] = round(10 * math.log10(e / top + 1e-20), 1)
    merkez = float(np.sum(fr * G) / top)
    # Zaman içinde en sert an: 100 ms pencerede 2–5 kHz payı (sessiz pencereler hariç)
    h = SR // 10
    X = np.fft.rfft(mono[:len(mono) // h * h].reshape(-1, h) * np.hanning(h), axis=1)
    P = np.abs(X) ** 2
    f2 = np.fft.rfftfreq(h, 1 / SR)
    tp = P.sum(axis=1); sp = P[:, (f2 >= 2000) & (f2 < 5000)].sum(axis=1)
    canli = tp > tp.max() * 1e-4
    oran = 10 * np.log10(sp[canli] / tp[canli] + 1e-20)
    en = int(np.argmax(np.where(canli, 10 * np.log10(sp / (tp + 1e-30) + 1e-20), -99)))
    return dict(bant_db=bantlar, tayf_merkezi_hz=round(merkez), sertlik_medyan_db=round(float(np.median(oran)), 1),
                sertlik_en_kotu_db=round(float(oran.max()), 1), sertlik_en_kotu_sn=round(en * 0.1, 1))


def baslangic_dogrula(x, hedef_kareler, pencere_kare=4):
    """Her hedef karenin ±pencere'sinde 1 kHz üstü zarfın en dik yükselişini (4 ms'de dB) bulur.
    Dönüş: hedef başına bulunan kare, sapma (kare) ve yükseliş (dB). Gerçek bir nota başlangıcı ≥ 6 dB yükselir."""
    on = int(0.05 * SR)
    mono = np.concatenate([np.zeros(on), x.mean(axis=0)])
    nf = _fft_boy(len(mono))
    fr = np.maximum(np.fft.rfftfreq(nf, 1 / SR), 1e-3)
    H = (fr / 1000) ** 2 / np.sqrt(1 + (fr / 1000) ** 4)        # yumuşak 1 kHz yüksek geçiren (ön çınlama yok)
    yuk = np.fft.irfft(np.fft.rfft(mono, nf) * H, nf)[:len(mono)]
    # Zarf: 3 ms RMS penceresi, 1 ms adım (pencere sonu = adım zamanı); yükseliş: 6 ms'de dB artışı
    h, w = SR // 1000, 3 * SR // 1000
    c2 = np.concatenate([[0.0], np.cumsum(yuk ** 2)])
    son = np.arange(w, len(yuk), h)
    db = 10 * np.log10((c2[son] - c2[son - w]) / w + 1e-18)
    zaman = son / SR * 1000 - 50                                    # ms, dolgu düşülmüş
    yuks = np.full_like(db, -99.0); yuks[6:] = db[6:] - db[:-6]
    sonuc = []
    for k in hedef_kareler:
        c = k / FPS * 1000
        sec = np.where((zaman >= c - pencere_kare * 1000 / FPS) & (zaman <= c + pencere_kare * 1000 / FPS) & (np.arange(len(db)) >= 6))[0]
        i = sec[int(np.argmax(yuks[sec]))]
        j = i - 6                                                   # yükselişin başladığı ilk adım (+3 dB)
        while j < i and db[j] < db[i - 6] + 3:
            j += 1
        t = (zaman[j] - 1.5) / 1000.0                               # pencere ortası
        sonuc.append(dict(kare=k, bulunan=round(t * FPS, 2), sapma_kare=round(t * FPS - k, 2), yukselis_db=round(float(yuks[i]), 1)))
    return sonuc


def video_kesmeleri(ff, video, son_kare=240):
    """İlk son_kare karede ardışık kare farkından yüz değişimlerini bulur."""
    w, h = 96, 54
    r = subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-i', str(video), '-frames:v', str(son_kare),
                        '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True)
    v = np.frombuffer(r.stdout, np.uint8).reshape(-1, h, w).astype(float)
    fark = np.abs(np.diff(v, axis=0)).mean(axis=(1, 2))      # fark[i]: kare i → i+1
    esik = max(4 * np.median(fark), 1.0)
    kesme = [i + 1 for i in range(len(fark)) if fark[i] > esik]
    return kesme, fark


def gecikme_olc(ff, mp4, kaynak, gecici):
    yol = Path(gecici) / 'geri.raw'
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(mp4), '-map', '0:a:0', '-ac', '1',
                    '-ar', str(SR), '-f', 'f32le', str(yol)], check=True)
    g = np.fromfile(yol, np.float32).astype(float)
    a = kaynak.mean(axis=0)[:SR * 6]; b = g[:SR * 6]
    nf = _fft_boy(len(a) + len(b))
    c = np.fft.irfft(np.fft.rfft(b, nf) * np.conj(np.fft.rfft(a, nf)), nf)
    lag = int(np.argmax(np.concatenate([c[-2000:], c[:2000]]))) - 2000
    return round(lag / SR * 1000, 2), round(len(g) / SR, 3)


# =====================================================================================================
# ANA AKIŞ
# =====================================================================================================
def main():
    ap = argparse.ArgumentParser(description='Oktos tanıtım filmi: piyano müziği ve kesme notaları (kendi sentezimiz).')
    ap.add_argument('--dry-run', action='store_true', help='üret ve ölç, hiçbir dosya yazma')
    ap.add_argument('--hizli', action='store_true', help='az kısmi sesle hızlı önizleme')
    ap.add_argument('--bindirme-yok', action='store_true', help='animatik videolarına ses bindirme')
    arg = ap.parse_args()
    t0 = time.time()
    ff = ffmpeg_bul()
    rng = np.random.default_rng(TOHUM)

    notalar, pedal, susturma, kanca = partisyon()
    kesme_kuru = cal(notalar, pedal, susturma, 'kesme', rng, arg.hizli)
    muzik_kuru = cal(notalar, pedal, susturma, 'muzik', rng, arg.hizli)
    ir = yanki_ir(np.random.default_rng(TOHUM + 1), YANKI)
    kesme = eq_uygula(yanki_uygula(kesme_kuru, ir, YANKI['islak_db']), EQ)
    muzik = eq_uygula(yanki_uygula(muzik_kuru, ir, YANKI['islak_db']), EQ)
    karisim = kesme + muzik
    # Ana zarf: bilinçli sessizliklerde (SUSTURMA) kuyruk ve yankı 3 karede kısılır, sonraki vuruştan önce geri gelir;
    # dosya sonunda yumuşak kararma
    kar = np.ones(karisim.shape[1])
    for s in susturma:
        a, b = kare_ornek(s), kare_ornek(s + 3)
        c, d = kare_ornek(s + 22), kare_ornek(s + 24) - 1
        kar[a:b] = np.minimum(kar[a:b], 10 ** (-36 / 20) + (1 - 10 ** (-36 / 20)) * (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b - a))))
        kar[b:c] = 10 ** (-36 / 20)
        kar[c:d] = 10 ** (-36 / 20) + (1 - 10 ** (-36 / 20)) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, d - c)))
    Lk = int(SON_KARARMA_SN * SR)
    kar[-Lk:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, Lk))
    karisim *= kar; kesme *= kar

    with tempfile.TemporaryDirectory() as gecici:
        # Ses yüksekliği: -16 LUFS'a kazanç; gerçek tepe -1 dBTP'yi aşarsa yumuşak sınırlayıcı, sonra yeniden ölç
        o = loudnorm_olc(ff, karisim, gecici)
        kazanc_db = HEDEF_LUFS - o['lufs']
        sinir_db, sinir_ornek, sinir_an = 0.0, 0, None
        cikti = karisim * 10 ** (kazanc_db / 20)
        for _ in range(4):
            o2 = loudnorm_olc(ff, cikti, gecici)
            if o2['tepe_dbtp'] <= TEPE_DBTP + 0.05 and abs(o2['lufs'] - HEDEF_LUFS) <= 0.3:
                break
            if o2['tepe_dbtp'] > TEPE_DBTP:
                tavan = 10 ** ((TEPE_DBTP - 0.3) / 20) * np.max(np.abs(cikti)) / 10 ** (o2['tepe_dbtp'] / 20)
                cikti, gr, sn, an = sinirla(cikti, tavan)
                if gr >= sinir_db:
                    sinir_an = an
                sinir_db, sinir_ornek = max(sinir_db, gr), max(sinir_ornek, sn)
            o3 = loudnorm_olc(ff, cikti, gecici)
            ek = HEDEF_LUFS - o3['lufs']
            cikti *= 10 ** (ek / 20)
            kazanc_db += ek
        son = loudnorm_olc(ff, cikti, gecici)
        kesme_c = kesme * 10 ** (kazanc_db / 20)

        tepe = float(np.max(np.abs(cikti)))
        rms = float(np.sqrt(np.mean(cikti ** 2)))
        olcum = dict(
            lufs=round(son['lufs'], 2), gercek_tepe_dbtp=round(son['tepe_dbtp'], 2), lra=round(son['lra'], 1),
            ornek_tepe_dbfs=round(20 * math.log10(tepe), 2), rms_dbfs=round(20 * math.log10(rms), 2),
            tepe_rms_farki_db=round(20 * math.log10(tepe / rms), 1),
            kirpilan_ornek=int(np.sum(np.abs(cikti) >= 1.0)), minus1_ustu_ornek=int(np.sum(np.abs(cikti) > 10 ** (-1 / 20))),
            sinirlayici_en_cok_db=round(sinir_db, 2), sinirlayici_ornek=sinir_ornek, sinirlayici_en_cok_sn=sinir_an, kazanc_db=round(kazanc_db, 2),
            tayf=tayf_olc(cikti),
        )
        # Sessizlik anları ne kadar sessiz (yankı kuyruğu dahil)
        ses = {}
        for s in susturma:
            a, b = kare_ornek(s + 6), kare_ornek(s + 24)
            ses[f'k{s}'] = round(20 * math.log10(np.sqrt(np.mean(cikti[:, a:b] ** 2)) + 1e-12), 1)
        olcum['sessizlik_rms_dbfs'] = ses

        # Kesme doğrulaması: video yüz değişimleri ↔ planlanan kesmeler ↔ sesteki nota başlangıçları
        video = FILM / 'animatik-m1-yatay.mp4'
        plan = kanca['kesmeler'][1:] + [kanca['a_karesi']]
        dog = dict(plan_kesmeler=plan)
        if video.exists():
            vk, fark = video_kesmeleri(ff, video)
            dog['video_montaj_kesmeleri'] = [k for k in vk if 20 <= k <= kanca['a_karesi']]
            dog['videoda_bulunmayan_plan_kesmesi'] = sorted(set(plan) - set(vk))
            dog['planda_olmayan_video_kesmesi'] = sorted(k for k in vk if 20 <= k < kanca['a_karesi'] and k not in plan)
        bas = baslangic_dogrula(kesme_c[:, :kare_ornek(260)], [0] + plan)
        dog['nota_baslangiclari'] = bas
        dog['en_buyuk_sapma_kare'] = max(abs(b['sapma_kare']) for b in bas)
        dog['en_kucuk_yukselis_db'] = min(b['yukselis_db'] for b in bas)
        dog['tum_kesmeler_1_kare_icinde'] = bool(dog['en_buyuk_sapma_kare'] <= 1.0 and dog['en_kucuk_yukselis_db'] >= 6)

        cizelge = dict(
            meta=dict(sr=SR, fps=FPS, toplam_kare=TOPLAM_KARE, sure_sn=TOPLAM_KARE / FPS, bpm=BPM, vurus_kare=24,
                      olcu_kare=96, ton='Re majör (D)', tohum=TOHUM, kanca_kaynagi=kanca['kaynak'],
                      sentez='kendi sentezimiz: uyumsuz kısmi sesler, iki aşamalı sönüm, 1–3 tel akort farkı, çekiç gürültüsü, damper ve pedal, FFT evrişimli sentetik oda yankısı'),
            bolumler=BOLUMLER,
            pedal=[dict(kare=[a, b], sn=[round(kare_sn(a), 3), round(kare_sn(b + 1), 3)]) for a, b in pedal],
            susturma_kare=susturma,
            notalar=[dict(kare=p['kare'], sn=round(kare_sn(p['kare']) + p['ofset_ms'] / 1000, 4), ofset_ms=p['ofset_ms'], nota=nota_adi(p['m']), midi=p['m'], hiz=p['hiz'],
                          tus_kare=p['sure'], birakma_kare=p.get('birakma_kare'), parca=p['parca'], etiket=p['etiket'])
                     for p in notalar],
            olcum=olcum, dogrulama=dog,
        )
        print(json.dumps(dict(olcum=olcum, dogrulama=dog, nota_sayisi=len(notalar),
                              sure_sn=round(time.time() - t0, 1)), ensure_ascii=False, indent=1))

        if arg.dry_run:
            print('dry-run: dosya yazılmadı. Yazılacaklar:', CIKIS / 'film-ses.wav', CIKIS / 'kesme-notalari.wav', CIKIS / 'cizelge.json')
            return
        CIKIS.mkdir(parents=True, exist_ok=True)
        wav24_yaz(CIKIS / 'film-ses.wav', cikti)
        wav24_yaz(CIKIS / 'kesme-notalari.wav', kesme_c)
        if not arg.bindirme_yok:
            bind = {}
            for yon in ('yatay', 'dikey'):
                kay = FILM / f'animatik-m1-{yon}.mp4'
                hedef = FILM / f'animatik-m1-{yon}-sesli.mp4'
                if not kay.exists():
                    bind[yon] = 'kaynak yok'
                    continue
                subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(kay), '-i', str(CIKIS / 'film-ses.wav'),
                                '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', str(SR),
                                '-movflags', '+faststart', str(hedef)], check=True)
                lag, sure = gecikme_olc(ff, hedef, cikti, gecici)
                bind[yon] = dict(dosya=hedef.name, ses_kaymasi_ms=lag, ses_suresi_sn=sure)
            cizelge['bindirme'] = bind
            print(json.dumps(dict(bindirme=bind), ensure_ascii=False))
        (CIKIS / 'cizelge.json').write_text(json.dumps(cizelge, ensure_ascii=False, indent=1), encoding='utf-8')
        print('yazıldı:', CIKIS)


if __name__ == '__main__':
    main()
