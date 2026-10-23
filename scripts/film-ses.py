# -*- coding: utf-8 -*-
"""
film-ses.py: Oktos tanıtım filmi (v06; süre ve sahne aralıkları sayfadan, ~61 sn) için müzik ve nesne sesleri; tamamen kendi sentezimiz.

Amaç
  - Kanca: her yüz değişiminde bir piyano notası ("dın"), notalar v1-kanca.js `sure` dizisinden; A'da Dmaj9'a çözülür.
  - Sahne başına küçük bir piyano müziği (150 BPM, vuruş 24 kare), sahnelerin ses işaretlerine oturur: konuşmada asılı
    nota, düşüncede balon noktaları + akor, sessizlikte müzik susar, 'tik' ve 'zar' anında nesne sesi.
  - v10 anlatı armonisi: her sahnenin tonu/modu (Re majör → Si minör → Mi dorian/majör → Sol majör → Re dorian → La majör
    → Re majörün V'i → Re majör), kesmelerde pivot akor; sorun = asılı armoni, düşünce = yükselen cümle, sahne sonu = yarım
    kadans, final = tam kadans. Ana tema dizi basamaklarıyla yazılıdır, her sahnede o sahnenin modunda dönüşür. Tekrar
    denetimi: akor ya da desen art arda en çok 2 ölçü (bilinçli ostinato hariç); cizelge ton_plani ve tekrar_denetimi.
  - v12a orkestra: yumuşak davullar, pedler, tokmaklı/telli çalgılar, kontrbas, flüt trili sahne düzenine göre (orkestra_kur).
    Her çalgı bir ses kaynağıdır (kaynak_ciz): 'sentez' (numpy) ya da 'ornek' (scripts/ornek-calici.py, CC0 kütüphane);
    --kaynak ornek, --kaynak-calgi davul=ornek. Örneği olmayan çalgı sentezle çalar, cizelge "orkestra.kaynak"ta yazar.
  - Tını: şık, tok, keskin; kırıcı, yorucu ve distorsiyonlu değil. A yolu (varsayılan, sentez): hazır müzik ya da ses örneği
    yok, her şey sayısal üretilir. B yolu (--kaynak ornek --kutuphane KÖK): CC0 örnek kütüphanesi (yerel, depoya girmez);
    örneği olan çalgı örnekle, olmayan sentezle çalar; örneklerin düzeyi sentezdekine eşitlenir (yalnız tını değişir).

Girdi
  - .impeccable/ses/isaretler.json : sayfanın ses işaretleri, toplam kare, sahne aralıkları (FİLM kareleri), kaymalar ve
    vuruşlar (python scripts/film-isaret.py yazar; yoksa önce onu çalıştırın). Sahneler uzayabilir: müzik vuruş ve işaret
    karelerine oturur, işaretsiz anlar sahnenin iç karesi + kaydir ile bulunur.
  - lab/tanitim/film/kadro.json : karakter notaları (kisiler.<kod>.nota); toplam ve sahneler İÇ karedir, yalnız yedek
  - lab/tanitim/film/v1-kanca.js : `sure = [...]` (kanca yüzleri), lab/tanitim/film/s5-kalabalik.js : balon sahipleri (varsa)
  - s6-final işaret bırakmazsa final plan varsayımlarıyla doldurulur (FINAL_VARSAYIM; cizelge.json'da "varsayim": true).
  - Bindirme için video: --video <mp4> (birden çok verilebilir); verilmezse .impeccable/film/animatik-v06-{yatay,dikey}.mp4 (varsa).

Çıktı (.impeccable/ses/)
  - film-ses.wav       : karışım (48 kHz, 24 bit, stereo), -16 LUFS, gerçek tepe <= -1 dBTP
  - kesme-notalari.wav : yalnız kanca notaları (aynı kazançla, film boyunda, sıfırdan hizalı)
  - davul.wav, fon.wav : orkestra stem'leri (v12a; karışımdaki düzeyle), doku.wav, keman.wav: v2 doku stem'leri
  - cizelge.json       : notalar, nesne sesleri, pedal, sessizlikler, bölümler, ölçümler, hedefler, işaret doğrulaması
  - <video>-sesli.mp4  : görüntü kopyalanır, ses AAC 192k (--bindirme-yok ile atlanır)

Kullanım
  python scripts/film-isaret.py                 # önce işaretleri oku (sahne modülleri değişince tekrar)
  python scripts/film-ses.py                    # üret, ölç, bindir
  python scripts/film-ses.py --dry-run          # üret ve ölç, hiçbir dosya yazma
  python scripts/film-ses.py --hizli            # az kısmi sesle hızlı önizleme
  python scripts/film-ses.py --video .impeccable/film/animatik-v06-yatay.mp4

Tekrar çalıştırmak güvenlidir: aynı tohum ve aynı işaretler aynı dosyayı üretir; yalnız yukarıdaki kendi çıktılarının üzerine yazar.
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
BPM = 150                  # vuruş 24 kare, ölçü 96 kare
VURUS = 24
TOHUM = 20261021           # aynı tohum → aynı dosya
HEDEF_LUFS = -16.0         # sosyal medya
TEPE_DBTP = -1.0           # gerçek tepe tavanı
SON_KARARMA_SN = 0.5       # dosya sonunda yumuşak kararma

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
EQ = dict(hp=35.0, alt_raf_db=3.5, alt_raf_f=170.0, sert_db=-3.0, sert_f=3200.0, sert_q=0.9, lp=12000.0)

# Nesne sesleri (kendi sentezimiz): kısa, tok, yumuşak tepe. mod: (frekans Hz, sönüm sn, genlik), gur: (merkez Hz, sönüm sn, pay)
# db: aynı karedeki mp piyano notasının tepesine göre düzey. Hepsi 3 kHz'te yumuşak kesilir (sertlik bandı yorulmasın).
NESNE_TIP = {
    'tok':     dict(mod=[(230, .040, 1.0), (590, .020, .55), (1120, .011, .30), (1690, .007, .15)], gur=(1900, .0025, .9), db=1, bant=300),
    'plastik': dict(mod=[(410, .026, 1.0), (960, .014, .55), (1530, .008, .25)], gur=(2000, .0025, .8), db=1, bant=300),
    'kulp':    dict(mod=[(690, .012, 1.0), (1340, .007, .45), (310, .015, .35)], gur=(2100, .0020, .9), db=-1, bant=1000),
    'metal':   dict(mod=[(1250, .070, .45), (1830, .050, .22), (2560, .030, .06), (420, .020, .55)], gur=(2200, .0020, .5), db=-3, bant=1000),
    'cam':     dict(mod=[(1420, .090, .40), (2050, .060, .12), (610, .020, .60)], gur=(2300, .0020, .4), db=-3, bant=1000),
    'toprak':  dict(mod=[(140, .060, 1.0), (310, .030, .45), (620, .015, .20)], gur=(900, .0200, .7), db=1, bant=300),
    'kumas':   dict(mod=[(250, .025, .50), (680, .012, .25)], gur=(1300, .0120, .9), db=-4, bant=300),   # v2'de bant 1000 (tiz susturulmuş nota)
    'darbe':   dict(mod=[(82, .130, 1.0), (131, .090, .70), (226, .050, .40), (480, .022, .18)], gur=(700, .0200, .6), db=3, bant=300),
    'kemik':   dict(mod=[(960, .009, 1.0), (1480, .006, .55), (2150, .004, .20), (320, .014, .45)], gur=(1900, .0020, .8), db=1, bant=1000),
    'pit':     dict(mod=[(1480, .010, 1.0), (2220, .005, .20), (740, .012, .40)], gur=(1900, .0015, .5), db=-6, bant=1000),  # ölçü "pıt"
}
NESNE_TIP['zar'] = dict(NESNE_TIP['kemik'], db=2)    # zar: kemik tıkırtılarından seken bir öbek
# Nesne sesi çevresindeki müziğe göre ayarlanır (miks): işareti tek başına taşıyorsa kendi bandında müziğin 6 dB üstü,
# bir notaya eşlik ediyorsa 4 dB altı; hazır düzeyden hiç kısılmaz, en çok +15 dB açılır.
NESNE_FARK = dict(tek=6.0, eslik=-4.0)
NESNE_EN_COK_DB = 15.0

# ----- v2: doku katmanı (ses dokusu) ve piyanodan türetilen nesne sesleri -----------------------------------------------
# "Keçe piyano": yumuşak çekiç, düşük parlaklık, una corda (iki tel, geniş akort farkı), yumuşak atak; düşük hızda çalınır.
PIYANO_KECE = dict(PIYANO, f_tavan=4000.0, parlaklik=0.45, fc_taban=500.0, fc_tavan=2200.0, tavan_f=3500.0,
                   cekic_db=-44.0, cekic_f=0.6, vuruntu_db=-38.0, atak_ms=9.0, tel_max=2, akort_sent=(0.6, 1.3),
                   pan_genislik=0.25, yavas_pay=0.40)
PIYANO_SUSTUR = dict(PIYANO_KECE, parlaklik=0.7, fc_tavan=3000.0, atak_ms=2.5, damper_kat=0.35, cekic_db=-38.0)  # susturulmuş nota
PIYANO_HAZIR = dict(PIYANO_SUSTUR, inh_a=2.5e-3, damper_kat=0.2, atak_ms=1.5)   # hazırlanmış piyano tıkırtısı (uyumsuz kısmiler)
PIYANO_TURU = dict(kece=PIYANO_KECE, sustur=PIYANO_SUSTUR, hazir=PIYANO_HAZIR)
NESNE_PIYANO = False       # main() açar: nesne sesleri susturulmuş piyano notası + çok kısa gövde (gürültü payı kısık)
NESNE_NOTA = {             # tip → (nota, susturma ms, piyano, hız, gövde dB): nota çalan akorun en yakın tonuna kayabilir
    'tok': ('G3', 35, 'sustur', 0.32, -9), 'plastik': ('D4', 30, 'sustur', 0.32, -10), 'kulp': ('A4', 25, 'sustur', 0.30, -12),
    'metal': ('C#6', 90, 'sustur', 0.24, -16), 'cam': ('F#6', 100, 'sustur', 0.20, -16), 'toprak': ('D3', 45, 'sustur', 0.32, -6),
    'kumas': ('E5', 30, 'sustur', 0.20, -14), 'darbe': ('D2', 70, 'sustur', 0.36, -6), 'kemik': ('A5', 22, 'hazir', 0.30, -14),
    'zar': ('A5', 22, 'hazir', 0.30, -14), 'pit': ('A5', 22, 'sustur', 0.28, -18),
}
NESNE_SABIT_PERDE = {'kemik', 'zar', 'darbe', 'toprak'}   # vurmalı: akora kaydırılmaz

# Keman (ambiyans): yaylı tel modeli. Harmonik dizi, gövde rezonansları (A0 hava, B1-/B1+ gövde, köprü tepesi), geç başlayan
# vibrato, yavaş atak/bırakış, legato, çok az yay sürtmesi. flautando: az harmonik, havadar; sordino: köprü tepesi bastırılmış.
KEMAN_GOVDE = [(275, 7.0, 10), (460, 4.0, 9), (540, 5.0, 9), (700, 2.0, 5), (1150, 3.0, 4), (2600, 4.0, 2.5)]  # (Hz, dB, Q)
KEMAN_TEKNIK = dict(
    flautando=dict(harm=5, egim=2.7, sordino_db=12.0, nefes_db=-36.0, atak_ms=240, birak_ms=450, vib=0.0045, gecikme=0.28),
    sordino=dict(harm=8, egim=2.0, sordino_db=15.0, nefes_db=-42.0, atak_ms=110, birak_ms=260, vib=0.005, gecikme=0.22),
)
DOKU_HEDEF_DB = {'s1-kafe': -14.0, 's2-atolye': -13.0, 's3-balkon': -13.0, 's4-frp': -14.0, 's4b-hizli': -14.0, 's5-kalabalik': -14.0,
                 's6-final': -14.0}
DOKU_CEKIL_DB = -6.0       # kanca notaları ve önemli vurgularda doku çekilir
DOKU_SESSIZ_DB = -14.0     # sessizliklerde doku incelir (susmaz)
DOKU_ISLAK_DB = -9.0       # doku aynı odada, biraz daha yankılı (uzun rezonans)

# ----- v09: ANA TEMA (leitmotif) ----------------------------------------------------------------------------------------
# Re majör, 4 + 4 ölçü (soru / cevap); imza aralığı yükselen altılı (A4 → F#5), adım hareketli, ıslıkla çalınabilir.
# (vuruş, nota, süre vuruş); vuruş = 24 kare (150 BPM), ölçü = 4 vuruş
TEMA = [(0, 'A4', 1), (1, 'F#5', 1.5), (2.5, 'E5', .5), (3, 'D5', 1),                    # 1 D   : altılı sıçrama, iniş
        (4, 'E5', 1), (5, 'F#5', .5), (5.5, 'E5', .5), (6, 'D5', 1), (7, 'B4', 1),       # 2 Bm
        (8, 'A4', 1), (9, 'B4', .5), (9.5, 'D5', .5), (10, 'E5', 1), (11, 'A5', 1),      # 3 G   : dörtlü sıçrama
        (12, 'G5', 1.5), (13.5, 'F#5', .5), (14, 'E5', 2),                               # 4 A7  : soru (açık, E5)
        (16, 'A4', 1), (17, 'F#5', 1.5), (18.5, 'E5', .5), (19, 'D5', 1),                # 5 D   : imza yeniden
        (20, 'E5', 1), (21, 'F#5', .5), (21.5, 'G5', .5), (22, 'A5', 1), (23, 'B5', 1),  # 6 G   : tepeye çıkış
        (24, 'A5', 1.5), (25.5, 'F#5', .5), (26, 'E5', 1), (27, 'C#5', 1),               # 7 A7  : iniş, yeden
        (28, 'D5', 4)]                                                                   # 8 D   : cevap (çözülme)
TEMA_AKOR = ['D', 'Bm', 'G', 'A7', 'D', 'G', 'A7', 'D']
# v10: tema dizi basamaklarıyla (0 = tonik; -3 = alttaki 5'li, 2 = 3'lü …): her ton ve modda kendi aralıklarıyla çalınır
# (yalnız aktarım değil: minörde küçük üçlü, dorianda büyük altılı, majörde geniş). Kimlik: yükselen altılı ve iniş kalıbı.
TEMA_ADIM = [(0, -3, 1), (1, 2, 1.5), (2.5, 1, .5), (3, 0, 1),
             (4, 1, 1), (5, 2, .5), (5.5, 1, .5), (6, 0, 1), (7, -2, 1),
             (8, -3, 1), (9, -2, .5), (9.5, 0, .5), (10, 1, 1), (11, 4, 1),
             (12, 3, 1.5), (13.5, 2, .5), (14, 1, 2),
             (16, -3, 1), (17, 2, 1.5), (18.5, 1, .5), (19, 0, 1),
             (20, 1, 1), (21, 2, .5), (21.5, 3, .5), (22, 4, 1), (23, 5, 1),
             (24, 4, 1.5), (25.5, 2, .5), (26, 1, 1), (27, -1, 1),
             (28, 0, 4)]
AKOR_PC = {'D': {2, 6, 9, 1, 4}, 'Bm': {11, 2, 6, 9}, 'G': {7, 11, 2, 6, 9}, 'A7': {9, 1, 4, 7}}
AKOR_KILAVUZ = {'D': [6, 1], 'Bm': [2, 9], 'G': [11, 6], 'A7': [1, 7]}   # karşı ezgi: 3'lü ve 7'li
# Tema keçe piyanoda sağ elde: net ve öne çıkan (keçeden biraz parlak, yumuşak ama belirgin atak)
PIYANO_TEMA = dict(PIYANO_KECE, parlaklik=0.5, fc_tavan=2500.0, atak_ms=4.0, cekic_db=-40.0, pan_genislik=0.15)
TEMA_ONE_DB = 4.5          # melodi kendi bandında (400–1300 Hz, tema çalarken) eşlikten bu kadar yüksek ayarlanır
TEMA_CEKIL = dict(f=650.0, db=-3.0, genislik_okt=1.3)   # tema çalarken akor ve doku melodinin bölgesinde çekilir

KOK = Path(__file__).resolve().parent.parent
CIKIS = KOK / '.impeccable' / 'ses'
FILM = KOK / '.impeccable' / 'film'
TANITIM = KOK / 'lab' / 'tanitim'
KANCA_JS = TANITIM / 'film' / 'v1-kanca.js'
KALABALIK_JS = TANITIM / 'film' / 's5-kalabalik.js'
FRP_JS = TANITIM / 'film' / 's4-frp.js'
KADRO_JSON = TANITIM / 'film' / 'kadro.json'
ISARET_JSON = CIKIS / 'isaretler.json'
VARSAYILAN_VIDEOLAR = [FILM / 'animatik-v07-yatay.mp4', FILM / 'animatik-v07-dikey.mp4']

KADRO = json.loads(KADRO_JSON.read_text(encoding='utf-8'))
# Film kareleri sayfadan gelir (isaretler.json: toplam_kare, sahneler = FİLM kareleri, sahne_yerlesimi.kaydir, vuruslar);
# sahneler uzayabildiği için kadro.json'daki toplam ve sahneler İÇ karelerdir ve yalnız yedektir. isaretleri_oku() günceller.
TOPLAM_KARE = int(KADRO['toplam'])
SAHNELER = {ad: (int(a), int(b)) for ad, (a, b) in KADRO['sahneler'].items()}
SAHNE_KAYDIR = {}          # modül → iç kare + kaydir = film karesi
VURUSLAR = {}              # vuruş no → (k0, k1) film karesi
# s6-final işaret bırakmazsa plan varsayımları (finalin başına göre): logo grupları (köşe, yan, alt, çarpı, halka; aynalı
# çiftler aynı karede), doruk logo tamamlanınca, OKTOS; tutuş sona dek. Slogan yok (v10 kurgusu): sayfa slogan işareti
# vermezse slogan bölümü üretilmez, varsayılmaz.
FINAL_VARSAYIM = dict(gruplar=[84, 132, 180, 228, 276], doruk=300)
CAPA_YARICAP = 3           # bir işaretin ±3 karesinde başka nota başlamaz (flam olmasın, doğrulama karışmasın)
BASLANGIC_SAPMA_MS = {3: 1.4, 8: 1.2}   # başlangıç ölçerinin sabit gecikmesi (zarf penceresi ms → ms), 13 yalıtılmış sesle ölçüldü

# =====================================================================================================
# YARDIMCILAR
# =====================================================================================================
_ADLAR = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
_TERS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
_RE_MAJOR = {2, 4, 6, 7, 9, 11, 1}


def midi(ad):
    if isinstance(ad, (int, np.integer)):
        return int(ad)
    m = re.fullmatch(r'([A-G]#?)(-?\d)', ad)
    return 12 * (int(m.group(2)) + 1) + _ADLAR[m.group(1)]


def nota_adi(m):
    return f'{_TERS[m % 12]}{m // 12 - 1}'


def adim_yukari(m, pcs=None):
    """Dizide (varsayılan Re majör) bir üst derece."""
    pcs = pcs or _RE_MAJOR
    m += 1
    while m % 12 not in pcs:
        m += 1
    return m


def dizi_asagi(m, pcs=None):
    """Dizide (varsayılan Re majör) bir alt derece."""
    pcs = pcs or _RE_MAJOR
    m -= 1
    while m % 12 not in pcs:
        m -= 1
    return m


# ----- v10: ton ve mod, akor sembolleri ------------------------------------------------------------------------------------
MODLAR = {'ionian': [0, 2, 4, 5, 7, 9, 11], 'aeolian': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10],
          'mixolydian': [0, 2, 4, 5, 7, 9, 10]}
_PC = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
       'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
AKOR_TIP = {  # nitelik → kökten aralıklar (üst sesler; önem sırasıyla)
    '': [4, 7], '5': [7], 'm': [3, 7], 'maj7': [4, 11, 7], 'maj9': [4, 11, 14, 7], 'm7': [3, 10, 7], 'm9': [3, 10, 14, 7],
    '7': [4, 10, 7], '9': [4, 10, 14], '13': [4, 10, 21], '7sus4': [5, 10, 7], 'sus4': [5, 7], 'sus2': [2, 7],
    'add9': [4, 14, 7], 'madd9': [3, 14, 7], 'm7b5': [3, 6, 10], 'dim': [3, 6], '6': [4, 9, 7], '6/9': [4, 9, 14],
    'm6': [3, 9, 7], '7b9': [4, 10, 13], 'maj7#11': [4, 11, 18], 'm11': [3, 10, 17],
}


def akor_coz(sembol):
    """'F#m7b5/C' → (kök pc, üst aralıklar, bas pc). Eğik çizgi bas sesi verir."""
    ana, _, bas = sembol.partition('/') if not sembol.endswith('6/9') else (sembol, '', '')
    if sembol.endswith('6/9') and sembol.count('/') > 1:
        ana, _, bas = sembol.rpartition('/')
    kok_ad = ana[:2] if len(ana) > 1 and ana[1] in '#b' else ana[:1]
    nitelik = ana[len(kok_ad):]
    if nitelik not in AKOR_TIP:
        raise ValueError(f'akor niteliği bilinmiyor: {sembol}')
    kok = _PC[kok_ad]
    return kok, AKOR_TIP[nitelik], (_PC[bas] if bas else kok)


def akor_pcs(sembol):
    kok, aral, bas = akor_coz(sembol)
    return {kok, bas} | {(kok + i) % 12 for i in aral}


def kilavuz_pcs(sembol):
    """Karşı ezgi için kılavuz sesler: 3'lü (ya da sus) ve 7'li (yoksa 5'li)."""
    kok, aral, _ = akor_coz(sembol)
    uc = [i for i in aral if i % 12 in (3, 4, 5, 2)][:1]
    ye = [i for i in aral if i % 12 in (10, 11, 9)][:1] or [7]
    return [(kok + i) % 12 for i in uc + ye]


def mod_pcs(kok, mod):
    return {(kok + i) % 12 for i in MODLAR[mod]}


def kare_sn(k):
    return k / FPS


def kare_ornek(k):
    return int(round(k * SR / FPS))   # 60 fps, 48 kHz: tam 800 örnek/kare


def kisi_notasi(kod, yedek):
    return KADRO.get('kisiler', {}).get(kod, {}).get('nota', yedek)


def ek_metni(i):
    return ' '.join(str(i.get(a, '')) for a in ('ad', 'not'))


# =====================================================================================================
# İŞARETLER
# =====================================================================================================
def isaretleri_oku(yol):
    if not yol.exists():
        print(f'İşaret dosyası yok: {yol.relative_to(KOK) if yol.is_relative_to(KOK) else yol}\n'
              'Önce sayfanın ses işaretlerini okuyun:  python scripts/film-isaret.py')
        sys.exit(2)
    global TOPLAM_KARE, SAHNELER, SAHNE_KAYDIR, VURUSLAR
    veri = json.loads(yol.read_text(encoding='utf-8'))
    uyarilar = []
    # Sahne modülleri işaret dosyasından yeniyse işaretler eskimiş olabilir
    kaynaklar = [TANITIM / 'film.js', *sorted((TANITIM / 'film').glob('*.js')), KADRO_JSON]
    yeni = [p.name for p in kaynaklar if p.exists() and p.stat().st_mtime > yol.stat().st_mtime]
    if yeni:
        uyarilar.append(f'işaretler eskimiş olabilir ({", ".join(yeni)} daha yeni): python scripts/film-isaret.py')
    # Film kareleri sayfadan (sahneler uzayabilir); sayfa vermediyse kadro.json yedeği
    if veri.get('toplam_kare') and veri.get('sahne_yerlesimi'):
        TOPLAM_KARE = int(veri['toplam_kare'])
        SAHNELER = {ad: (int(a), int(b)) for ad, (a, b) in veri['sahneler'].items()}
        SAHNE_KAYDIR = {s['m']: int(s.get('kaydir') or 0) for s in veri['sahne_yerlesimi']}
    else:
        uyarilar.append('isaretler.json sahne yerleşimi vermiyor (eski film-isaret.py?): kadro.json yedeği kullanıldı')
    VURUSLAR = {str(v['no']): (int(v['k0']), int(v['k1'])) for v in veri.get('vuruslar', [])}
    for u in veri.get('uyarilar', []):
        uyarilar.append('film-isaret: ' + u)
    isaretler = []
    for i in veri['isaretler']:
        if not 0 <= int(i['kare']) < TOPLAM_KARE:
            continue
        if i['tur'] == 'sessizlik' and int(i.get('bitis', i['kare'] + 1)) <= i['kare']:
            uyarilar.append(f'k{i["kare"]} sessizlik bitişi ({i.get("bitis")}) başlangıçtan önce: yok sayıldı')
            continue
        isaretler.append(dict(i))
    return isaretler, veri, uyarilar


def final_tamamla(isaretler):
    """s6-final işaretleri yoksa (ya da doruk eksikse) plan varsayımlarını ekler. Slogan varsayılmaz (kurgudan kalktı)."""
    a, b = SAHNELER['s6-final']
    s6 = [i for i in isaretler if a <= i['kare'] <= b]
    eklenen = []
    doruk = next((i['kare'] for i in s6 if i['tur'] == 'vurgu' and i.get('ad') == 'doruk'), a + FINAL_VARSAYIM['doruk'])
    if not any(i['tur'] == 'tik' and i['kare'] < doruk for i in s6):
        eklenen += [dict(kare=a + g, tur='tik', ad='logo grubu', varsayim=True) for g in FINAL_VARSAYIM['gruplar'] if a + g < doruk]
    if not any(i['tur'] == 'vurgu' and i.get('ad') == 'doruk' for i in s6):
        eklenen.append(dict(kare=a + FINAL_VARSAYIM['doruk'], tur='vurgu', ad='doruk', varsayim=True))
    if not s6:
        kaynak = 'varsayım (s6-final işaret bırakmadı): kadro.json + plan v06'
    elif eklenen:
        kaynak = 's6-final işaretleri + eksikler için varsayım'
    else:
        kaynak = 's6-final işaretleri'
    tum = sorted(isaretler + eklenen, key=lambda i: (i['kare'], i['tur']))
    return tum, dict(kaynak=kaynak, varsayim=eklenen)


def frp_anlari():
    """s4-frp.js'ten işaretsiz iki anın İÇ karesi: E zarları sallar (K_SALLA), atar (K_ATIS); dayanak olarak 3B yakın plan
    kesmesi (KY). Film karesi = iç kare + kaydir. Okunamazsa boş: partisyon yakın plan kesmesine göre (sahne göreli) yerleştirir."""
    try:
        metin = FRP_JS.read_text(encoding='utf-8')
    except OSError:
        return {}
    return {ad: int(m.group(1)) for ad in ('K_SALLA', 'K_ATIS', 'KY')
            for m in [re.search(rf'const {ad}\s*=\s*(\d+)', metin)] if m}


def kalabalik_sahipleri():
    """s5-kalabalik.js'teki fikir tablosundan balon FİLM karesi → (kişi, çizim) (tablo iç karede, kaydir eklenir).
    Okunamazsa boş (motifler sırayla döner)."""
    try:
        metin = KALABALIK_JS.read_text(encoding='utf-8')
    except OSError:
        return {}
    kay = SAHNE_KAYDIR.get('s5-kalabalik', 0)
    return {int(m.group(2)) + kay: (m.group(1), m.group(3))
            for m in re.finditer(r"(\w+):\s*\{\s*cik:\s*\d+,\s*balon:\s*(\d+)[^}]*?cizim:\s*'(\w+)'", metin)}


# =====================================================================================================
# PARTİSYON (150 BPM; ölçü 96 kare. v10 anlatı armonisi: sahne başına ton/mod ve pivot; akorlar sembolle, ton_plani cizelgede)
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


# Kalabalıkta her fikir balonu sahibinin motifini kısa çalar (ofset kare, notalar)
MOTIF = {
    'kanca':  ((0, 6), ['A4', 'D5']),                        # yeni yüz: kancanın "dın"ı
    'A':      ((0, 6, 9, 12), ['A4', 'F#4', 'A4', 'D5']),     # kafe: sekme motifi
    'garson': ((0, 6, 12), ['E5', 'D5', 'B4']),               # garson: döner, gider
    'B':      ((0, 5, 10, 15), ['D4', 'F#4', 'E4', 'A4']),    # atölye: cetvel
    'D':      ((0, 8, 12), ['F#4', 'A4', 'B4']),              # balkon: sıcak cümle
    'E':      ((0, 3, 6, 9), ['B3', 'D4', 'F#4', 'A4']),      # FRP: zar arpeji
    'din':    ((0, 8), ['D5', 'D5']),                         # piyonlar: dın dın
}
SAHIP_MOTIF = {'A': 'A', 'Garson': 'garson', 'B': 'B', 'B2': 'B', 'B3': 'B', 'B4': 'B', 'D': 'D',
               'E': 'E', 'E4': 'E', 'E2': 'din', 'E3': 'din'}
KANCA_CIFTLERI = [('A4', 'D5'), ('B4', 'E5'), ('D5', 'F#5'), ('E4', 'A4'), ('F#4', 'B4'), ('A4', 'E5')]


def partisyon(isaretler, final_bilgi):
    N, NES, PEDAL = [], [], []
    TEMA_N, TEMA_YER = [], []      # ana temanın notaları (cizelge "tema") ve karşı ezgi için ölçü yerleri
    AKORLAR, TON_HAR, OSTINATO = [], [], []   # v10: akor dizisi, ton planı, bilinçli ostinato aralıkları (tekrar denetimi)
    FRP_AN = {}                                # FRP'nin işaretsiz anları (sallama, atış): film karesi ve kaynağı
    S = SAHNELER
    tuketilen = set()

    # ---------- Sessizlikler ve çapalar (sesin oturacağı işaret kareleri)
    SUS = sorted((int(i['kare']), int(i.get('bitis', i['kare'] + 12))) for i in isaretler if i['tur'] == 'sessizlik')
    cekirdek = [i for i in isaretler if i['tur'] != 'sessizlik']
    kesme_birlesen = {}
    for i in cekirdek:
        if i['tur'] == 'kesme':
            yakin = [j for j in cekirdek if j['tur'] != 'kesme' and 0 < abs(j['kare'] - i['kare']) <= CAPA_YARICAP]
            if yakin:
                kesme_birlesen[i['kare']] = min(yakin, key=lambda j: abs(j['kare'] - i['kare']))['kare']
    CAPA = sorted({i['kare'] for i in cekirdek if not (i['tur'] == 'kesme' and i['kare'] in kesme_birlesen)})

    def uygun(f, kendi=None):
        """f karesinde nota başlayabilir mi: başka bir çapanın ±3 karesinde (çapanın kendisi hariç) olmamalı."""
        return all(abs(c - f) > CAPA_YARICAP or c == f or c == kendi for c in CAPA)

    def isr(tur, sahne, anahtar=None):
        a, b = S[sahne]
        L = [i for i in isaretler if i['tur'] == tur and a <= i['kare'] <= b and (anahtar is None or anahtar in ek_metni(i))]
        for i in L:
            tuketilen.add(id(i))
        return L

    def n(k, ad, v, d, et='', parca='muzik', serbest=False):
        N.append(dict(kare=int(k), m=midi(ad), hiz=round(float(v), 3), sure=max(1, int(d)), parca=parca, etiket=et, serbest=serbest))

    def akor(k, adlar, v, d, et='', parca='muzik'):
        for ad in adlar:
            n(k, ad, v, d, et, parca)

    def dizi(k, adlar, ara, v0, v1, d, et='', parca='muzik'):
        for i, ad in enumerate(adlar):
            v = v0 + (v1 - v0) * (i / max(1, len(adlar) - 1))
            n(k + i * ara, ad, v, d, et, parca)

    def nesne(k, tip, et, db_ek=0.0, rol='tek'):
        NES.append(dict(kare=int(k), tip=tip, db=NESNE_TIP[tip]['db'] + db_ek, etiket=et, rol=rol))

    def sus_bitisi(k):
        for s, e in SUS:
            if s <= k < e:
                return e
        return k

    def dusunce_motifi(k, adlar, hizli=False, v=0.30, et='düşünce: balon noktaları'):
        """Balonun üç noktası birer nota (sessizlikte de çalar); dönüş: bulutun açıldığı kare."""
        ara = 2 if hizli else 4
        for j, ad in enumerate(adlar):
            f = k + j * ara
            if j and not uygun(f, k):
                continue
            n(f, ad, v * (1 - 0.08 * j), 10, et, 'isaret', serbest=True)
        return k + (4 if hizli else 10)

    def tik_tipi(i, yedek='tok'):
        e = ek_metni(i).lower()
        for anahtar, tip in (('pıt', 'pit'), ('kulp', 'kulp'), ('kapı', 'kulp'), ('çekmece', 'tok'), ('vida', 'metal'), ('organizer', 'plastik'),
                             ('ceket', 'kumas'), ('giyin', 'kumas'), ('küpe', 'metal'), ('toprak', 'toprak'), ('bardak', 'cam')):
            if anahtar in e:
                return tip
        return yedek

    # =========================================================================== KANCA (değişmez)
    # Her yüz bir "dın"; majör pentatonik, kesmeler hızlandıkça dalga dalga yükselir (A3 → A5), üçlemede (8 k) iner ve
    # A'da tonik Re'ye adımla çözülür. Pedal yok: her ton ayrı ve net.
    kesmeler, a_k, kaynak = kanca_kesmeleri()
    KANCA_DIZI = ['A3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'A4', 'D5', 'B4', 'E5', 'D5', 'F#5', 'A5', 'F#5', 'E5']
    yuzler = [0] + kesmeler                      # k0: kalem ilk yüzü çizer
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
    PEDAL.append((a_k, a_k + 95))
    isr('kesme', 'v1-kanca')
    kanca_isaret = sorted(i['kare'] for i in isaretler if i['tur'] == 'kesme' and S['v1-kanca'][0] <= i['kare'] <= S['v1-kanca'][1])

    def vk(no, yedek):
        """Vuruşun (k0, k1) FİLM kareleri (sayfanın tanitim.vuruslar'ı); yoksa yedek."""
        return VURUSLAR.get(str(no), yedek)

    # ----- v10 anlatı armonisi: sahne başına ton/mod, akor sembolleri (ses yürütmeli sesleme), tema dönüşümleri
    UST = {'son': [62, 66, 69]}

    def ton(sahne, kok, mod, a_, b_, gecis=''):
        TON_HAR.append(dict(sahne=sahne, kok=kok, mod=mod, kare=[int(a_), int(b_)], gecis=gecis))

    def kaydet(k, sembol, sure, et):
        AKORLAR.append(dict(kare=int(k), sembol=sembol, sure=max(1, int(sure)), etiket=et))

    def ak(k, sembol, sure, v=0.32, et='', ust_v=None, bas5=True, ust=True, parca='muzik'):
        """Akor sembolünden: bas (kök ya da eğik çizgi, C2–A2; kök basta 5'lisi de), üst sesler G3–G#4 arasında önceki
        akordan en az hareketle (ses yürütme). Akor dizisine (cizelge ton_plani) yazılır."""
        k, sure = int(k), max(1, int(sure))
        kok, aral, bas_pc = akor_coz(sembol)
        bas_m = 36 + (bas_pc - 36) % 12
        if bas_m > 45:
            bas_m -= 12
        n(k, bas_m, v, sure, f'{sembol}: {et}', parca)
        if bas5 and bas_pc == kok and 7 in aral:
            n(k, bas_m + 7, v - 0.02, sure, f'{sembol}: {et}', parca)
        if ust:
            merkez = sum(UST['son']) / len(UST['son'])
            secim = []
            for i in aral:
                pc = (kok + i) % 12
                aday = [m for m in range(55, 69) if m % 12 == pc and m not in secim]
                if aday:
                    secim.append(min(aday, key=lambda x: abs(x - merkez)))
            for m in sorted(secim):
                n(k, m, ust_v if ust_v is not None else v - 0.08, sure, f'{sembol}: {et}', parca)
            if secim:
                UST['son'] = sorted(secim)
        kaydet(k, sembol, sure, et)

    def tema_v(bas, olculer, sahne, et, tonik, mod, hiz=0.46, olcek=1.0, legato=0.95, stakato=False, salinim=False,
               son=None, uzat_son=None, kontra=True, oktav=0, kaydir=0, kacin=(), parca='tema'):
        """Temayı tonun dizisinde çalar (basamak → perde: tonik + mod aralığı; aynı çizgi, sahnenin modunda); olcek: vuruş
        = 24·olcek kare; salınım: ara sekizlikler geç (oyunbaz); kaydir: dizide basamak kaydırma (sekans). Bir çapanın ±3
        karesine düşen nota çapaya yapışır (cümlenin iki notası aynı çapaya yığılmaz; kacin'daki çapalara düşen nota
        çalınmaz); sessizlikte nota yok."""
        aral = MODLAR[mod]
        notlar, yer, t = [], [], 0.0
        for o in olculer:
            for bt, st, d in TEMA_ADIM:
                if (o - 1) * 4 <= bt < o * 4:
                    notlar.append((t + bt - (o - 1) * 4, st, d, o, len(yer)))
            yer.append((o, int(round(bas + t * VURUS * olcek)), int(round(4 * VURUS * olcek))))
            t += 4
        hizlar = list(hiz) if isinstance(hiz, (list, tuple)) else [hiz] * len(olculer)
        alinan, konan = set(), []
        for i, (bt, st, d, o, oi) in enumerate(notlar):
            b2 = bt + (0.17 if salinim and bt % 1 == 0.5 else 0.0)
            f = int(round(bas + b2 * VURUS * olcek))
            if son is not None and f > son:
                break
            sure = d * VURUS * olcek * (0.5 if stakato else legato)
            if uzat_son is not None and i == len(notlar) - 1:
                sure = max(sure, uzat_son - f)
            yakin = [c for c in CAPA if 0 < abs(c - f) <= CAPA_YARICAP]
            if yakin:
                f = min(yakin, key=lambda c: abs(c - f))
            if f in alinan or f in kacin:
                continue
            alinan.add(f)
            if f < 0 or f >= TOPLAM_KARE or any(s <= f < e for s, e in SUS):
                continue
            s2 = st + kaydir
            m = midi(tonik) + 12 * oktav + aral[s2 % 7] + 12 * (s2 // 7)
            v = hizlar[oi] + (0.04 if bt % 4 == 0 else 0.0) - (0.03 if bt % 1 else 0.0)
            n(f, m, v, max(3, int(round(sure))), et, parca)
            if parca == 'tema':
                TEMA_N.append(dict(kare=f, m=m, sahne=sahne, olcu=o, etiket=et))
            konan.append(f)
        if kontra and parca == 'tema':
            TEMA_YER.append(dict(sahne=sahne, olculer=[y for y in yer if son is None or y[1] <= son], son=son))
        return konan

    def tema_nota(f, m, v, sure, sahne, olcu, et):
        n(f, m, v, sure, et, 'tema')
        TEMA_N.append(dict(kare=int(f), m=midi(m), sahne=sahne, olcu=olcu, etiket=et))

    # Kanca ton planına ve akor dizisine (yalnız kayıt; kancanın notaları değişmez)
    ton('v1-kanca', 'D', 'ionian', *S['v1-kanca'], 'açılış: Re majör (dın notaları değişmez)')
    kaydet(0, 'D5', 96, 'kanca: Re boşluğu')
    kaydet(96, 'G5', max(1, a_k - 96), 'kanca: Sol')
    kaydet(a_k, 'Dmaj9', 96, 'A: çözülme (kafeye pivot)')

    # =========================================================================== KAFE: Si minör, seyrek ve boşluklu
    # Yalnızlık, görülmemek. Pivot: kancanın Dmaj9'u (Re majörde I = Si minörde III, ortak sesler D F# A C#). Tema ağır
    # (×1,5) ve yalnız; seslenişlerde yanıtsız asılı akorlar (iv9, V sus4); yüz asılınca bas iner (Si → La → Sol → Mi → Fa#:
    # ağıt basamağı); düşüncede durgun ostinato; düşünce yükselen cümle (temanın 6. ölçüsü minörde, tepesi dilek
    # halkasında); sahne sonu yarım kadans (F#7).
    a, b = S['s1-kafe']
    ton('s1-kafe', 'B', 'aeolian', a, b, 'pivot Dmaj9: Re majörde I = Si minörde III')
    kon, dus, vur, tik = isr('konusma', 's1-kafe'), isr('dusunce', 's1-kafe'), isr('vurgu', 's1-kafe'), isr('tik', 's1-kafe')
    A_NOTA = midi(kisi_notasi('A', 'D4')) + 12
    k4 = vk(4, (a + 108, a + 239))[0]
    kafe_pcs = mod_pcs(_PC['B'], 'aeolian')
    if k4 - a > 100:
        ak(a + 48, 'Bmadd9', k4 - a - 48, 0.28, 'A yalnız (i, seyrek)', ust_v=0.20)
    tema_v(a + 12, [1], 's1-kafe', 'tema (kafe): minörde ağır, yalnız', 'B4', 'aeolian', hiz=0.42, olcek=1.5, legato=1.05)
    son4 = kon[1]['kare'] if len(kon) > 1 else k4 + 80
    ak(k4, 'Em9', son4 - k4, 0.32, 'el kalkar (iv, yanıtsız)')
    PEDAL.append((k4, son4 - 1))
    m_sesle = A_NOTA
    for j, i in enumerate(kon):
        k = i['kare']
        son = kon[j + 1]['kare'] if j + 1 < len(kon) else k + 40
        if j == 0:
            n(k, m_sesle, 0.44, son - k, '"Bakar mısınız?": asılı (Em9 üstünde 7\'li)', 'isaret')
        else:
            m_sesle = adim_yukari(m_sesle, kafe_pcs)
            ak(k, 'F#7sus4', 40, 0.36, 'yanıt gelmez (V sus4, çözülmez)')
            n(k, m_sesle, 0.48, son - k, '"Bakar mısınız?!": asılı, bir adım yüksek', 'isaret')
            PEDAL.append((k, k + 39))
            for q, ad_ in enumerate(['D5', 'B4', 'D5', 'B4']):          # garson müşterinin şakasına kahkaha atar
                if uygun(k + 14 + 6 * q):
                    n(k + 14 + 6 * q, ad_, 0.24, 4, 'garson kahkaha atar (A\'ya dönmez)')
    for j, i in enumerate(tik):
        nesne(i['kare'], tik_tipi(i, 'tok'), 'kafe: ' + ('el masaya iner' if j == 0 else 'dirsek masaya, yanak avuçta'), -3.0 * min(j, 1))
    if dus:
        k = dus[0]['kare']
        bulut = max(dusunce_motifi(k, ['F#5', 'A5', 'C#6']), sus_bitisi(k))
        k_dilek = vur[0]['kare'] if vur else bulut + 66
        bas0 = k if sus_bitisi(k) == k else bulut         # sessizlik bittiyse akor noktalarla başlar (noktalar yalnız kalmaz)
        iner = [(bas0, 'Bmadd9', 'yüz asıldı: düşünce açılır (i)'), (bulut + (k_dilek - bulut) // 2, 'Bm/A', 'bas iner'),
                (k_dilek, 'Gmaj7', 'dilek halkası (VI)'), (k_dilek + (b - 47 - k_dilek) // 2, 'Em7', 'bas iner (iv)'),
                (b - 47, 'F#7sus4', 'sorun asılı (V sus4)'), (b - 23, 'F#7', 'sahne sonu: yarım kadans (V)')]
        iner = [x for q, x in enumerate(iner) if q == 0 or x[0] > iner[q - 1][0] + 8]
        for q, (k0, sem, et) in enumerate(iner):
            k1 = iner[q + 1][0] if q + 1 < len(iner) else b + 1
            ak(k0, sem, k1 - k0, 0.30, et)
            PEDAL.append((k0, k1 - 1))
        # düşüncede durgun ostinato (dörtlük, alçak; bilinçli tekrar): bas inerken aynı kalan iç ses
        ost = ['B3', 'F#4', 'D4', 'F#4']
        for q, f in enumerate(range(bulut + 12, b - 50, VURUS)):
            if uygun(f):
                n(f, ost[q % 4], 0.18, 20, 'sıkılma / düşünce: durgun ostinato')
        OSTINATO.append(dict(kare=[bulut, b - 50], etiket='kafe: durgun ostinato'))
        olc = min(1.0, (k_dilek - bulut - 4) / (3 * VURUS))
        tema_v(k_dilek - int(round(3 * VURUS * olc)), [6], 's1-kafe', 'tema (kafe): düşünce, yükselen cümle (minör)', 'B4', 'aeolian',
               hiz=0.44, olcek=olc, uzat_son=b - 47)

    # =========================================================================== ATÖLYE: Mi dorian, cetvel gibi; fikirde Mi majör
    a, b = S['s2-atolye']
    kes, kon, tik = isr('kesme', 's2-atolye'), isr('konusma', 's2-atolye'), isr('tik', 's2-atolye')
    dus, vur = isr('dusunce', 's2-atolye'), isr('vurgu', 's2-atolye')
    B_NOTA = midi(kisi_notasi('B', 'D4'))
    k7 = vk(7, (a + 184, a + 263))[0]
    k8 = vk(8, (a + 264, a + 595))[0]
    k9 = vk(9, (a + 596, b))[0]
    k_fikir = dus[0]['kare'] if dus else k9
    ton('s2-atolye', 'E', 'dorian', a, k_fikir - 1, 'pivot Em: Si minörde iv = Mi dorianda i (F#7 → Em9: aldatıcı)')
    giris = kon[0]['kare'] if kon and kon[0]['kare'] - a <= CAPA_YARICAP else a
    k_git = next((i['kare'] for i in kon if 'Yazıcı' in ek_metni(i)), a + 96)
    k_gel = next((i['kare'] for i in kon if 'Geliyor' in ek_metni(i)), a + 162)
    ak(giris, 'Em9', a + 48 - giris, 0.32, 'atölye: sohbet (i)', ust=False)
    ak(a + 48, 'A13', k_git - a - 48, 0.30, 'cetvel (IV, dorian rengi)', ust=False)
    ak(k_git, 'F#m7', k_gel - k_git, 0.28, 'grup yürüyüp gider (ii, azalır)', ust=False)
    ak(k_gel, 'D6/9', k7 - k_gel, 0.32, '"Geliyorum!" (VII)', ust=False)
    ak(k7, 'Em9', 48, 0.30, 'B dolaba yürür (i)', ust=False)
    ak(k7 + 48, 'Bm7', k8 - k7 - 48, 0.30, 'dolaba varır (v)', ust=False)
    # cetvel sekizlikleri temayı Mi dorianda heceler (ritmik, mekanik); grup giderken inen figür; dolaba yürürken 2–3. ölçü
    dor = MODLAR['dorian']

    def tema8(olculer):
        out = []
        for o in olculer:
            for bt, st, d in TEMA_ADIM:
                if (o - 1) * 4 <= bt < o * 4:
                    m = midi('E5') + dor[st % 7] + 12 * (st // 7)
                    for q in range(max(1, int(round(d * 2)))):
                        out.append((m, q == 0, o))
        return out
    cetvel_t, dolap_t = tema8([1, 2]), tema8([2, 3])
    yuruyus = ['B4', 'A4', 'G4', 'F#4', 'E4', 'D4', 'C#4', 'B3']
    j, iy, it, idl = 0, 0, 0, 0
    while a + 12 * j < k8 - CAPA_YARICAP - 1:
        f = giris if j == 0 else a + 12 * j
        if j == 0:
            n(f, B_NOTA, 0.38, 8, 'D4 girişi (cetvel)')
        elif f < k_git:
            m, yeni, o = cetvel_t[it % len(cetvel_t)]
            it += 1
            if yeni:
                tema_nota(f, m, 0.44, 8, 's2-atolye', o, 'tema (atölye): dorian, cetvel gibi')
            else:
                n(f, m, 0.26, 8, 'cetvel sekizliği')
        elif f < k_gel:
            n(f, yuruyus[min(iy, 7)], 0.34 - 0.02 * iy, 8, 'grup yürüyüp gider (inen figür)')
            iy += 1
        else:
            m, yeni, o = dolap_t[idl % len(dolap_t)]
            idl += 1
            if yeni:
                tema_nota(f, m, 0.42, 8, 's2-atolye', o, 'tema (atölye): dolaba, cetvel')
            else:
                n(f, m, 0.26, 8, 'cetvel sekizliği')
        j += 1
    kon8 = [i for i in kon if k8 <= i['kare'] < k9]
    for i in kon:
        k, e = i['kare'], ek_metni(i)
        if k == giris or i in kon8:
            continue
        if 'Geliyor' in e:
            n(k, B_NOTA + 12, 0.46, 20, '"Geliyorum!" (B\'nin notası, VII\'nin kökü)', 'isaret')
        elif 'Yazıcı' in e:
            n(k, 'B5', 0.36, 18, '"Yazıcı ısındı!": B3 kapıya (F#m7 üstünde 11\'li)', 'isaret')
        else:
            n(k, 'F#5', 0.40, 30, '"M8 vida…": asılı (A13 üstünde 13\'lü)', 'isaret')
    # #8 kuş bakışı: uzanış yarım tempo (v); çekmece açılır (i); vidalar: dağınık staccato (Mi minör pentatonik); ölçüler
    # (III); soru "sığar mı?" V sus4 asılı. "pıt"lar dokuda basamak basamak yükselen dizi.
    ak(k8, 'Bm7', 34, 0.30, 'kuş bakışı: uzanış (v)', ust=False)
    n(k8, 'F#4', 0.34, 22, 'yarım tempo'); n(k8 + 24, 'D4', 0.30, 12, 'yarım tempo')
    for i in tik:
        nesne(i['kare'], tik_tipi(i), 'atölye: ' + ek_metni(i).strip(), 3.0 if 'dayanağa' in ek_metni(i) else 0.0)
    t_cek = [i['kare'] for i in tik if 'çekmece' in ek_metni(i) and i['kare'] < k9]
    t_vida = [i['kare'] for i in tik if 'vida' in ek_metni(i)]
    t_pit = sorted(i['kare'] for i in tik if 'pıt' in ek_metni(i))
    vur8 = sorted(i['kare'] for i in vur if k8 <= i['kare'] < k9)
    vur9 = sorted((i for i in vur if i['kare'] >= k9), key=lambda i: i['kare'])
    k_soru_on = kon8[0]['kare'] if kon8 else None
    if t_cek:
        kc = t_cek[0]
        olcu1 = vur8[0] if vur8 else kc + 100
        ak(kc, 'Em9', min(olcu1, k_soru_on or olcu1) - kc, 0.28, 'çekmece açık (i)', ust_v=0.24, bas5=False)   # üst sesler: 1 kHz'de net başlangıç
        kv = t_vida[0] if t_vida else kc + 4
        son_v = min([t_pit[0] if t_pit else olcu1, olcu1, k_soru_on or olcu1, kv + 72]) - CAPA_YARICAP - 2
        r = np.random.default_rng(TOHUM + 7)
        f, ara = kv + 6, 4.0
        while f < son_v:
            u = (f - kv) / max(1, son_v - kv)
            if uygun(f):
                n(f, str(r.choice(['B4', 'D5', 'E5', 'G5', 'A5', 'B5'])), 0.26 - 0.08 * u, 3, '3B vidalar yuvarlanır: dağınık staccato', 'isaret')
            ara *= 1.18
            f += int(round(ara))
    k_soru = kon8[0]['kare'] if kon8 else (vur8[1] if len(vur8) > 1 else None)
    for j, k in enumerate(vur8):
        if j == 0:
            n(k, 'B4', 0.38, 24, 'ölçü: ilk kenar', 'isaret')
            ak(k, 'Gmaj7', (k_soru or k + 30) - k, 0.28, 'ölçülür (III)', ust=False)
        else:
            n(k, 'G5', 0.38, 20, 'ölçü: ikinci kenar', 'isaret')
    if k_soru is not None:
        ak(k_soru, 'B7sus4', k_fikir - k_soru, 0.36, 'buraya sığar mı? (V sus4, asılı)')
        PEDAL.append((k_soru, k_fikir - 1))
    for i in kon8:
        n(i['kare'], 'E5', 0.42, k_fikir - i['kare'], '"Bir organizer alsam… sığar mı?": asılı (sus4)', 'isaret')
    # #9 fikir: aydınlanan modülasyon Mi dorian → Mi majör (G → G#); tema 3. ölçü majörde yükselir; bakış iner (vi), gözle
    # ölçü (IV, ii), çerçeve (I), inceltir (vi, iner), uzatır (IV, çıkar), dağılır / sahne sonu V sus4 asılı → sessizlik
    ton('s2-atolye (fikir)', 'E', 'ionian', k_fikir, b, 'Mi dorian → Mi majör (G → G#: fikir aydınlanır)')
    vplan = []
    if dus:
        bulut = dusunce_motifi(dus[0]['kare'], ['B4', 'D#5', 'F#5'])
        k_ilk = vur9[0]['kare'] if vur9 else bulut + 60
        ak(bulut, 'Emaj9', k_ilk - bulut, 0.32, 'fikir: aydınlanır (I)')
        PEDAL.append((bulut, k_ilk - 1))
        tema_v(bulut + 4, [3], 's2-atolye', 'tema (atölye): fikir, majörde yükselir', 'E5', 'ionian', hiz=0.44, son=k_ilk - 4)
    gozle = 0
    for i in vur9:
        k, e = i['kare'], ek_metni(i)
        if 'incel' in e:
            vplan.append((k, 'C#m7', 'parmakla inceltir (vi, iner)', ['G#5', 'F#5', 'E5']))
        elif 'uzat' in e:
            vplan.append((k, 'Aadd9', 'parmakla uzatır (IV, çıkar)', ['C#5', 'E5', 'F#5', 'B5']))
        elif 'dağıl' in e:
            vplan.append((k, 'B7sus4', 'bölmeler dağılır (V sus4, asılı)', ['E5']))
        elif 'bakış' in e:
            vplan.append((k, 'C#m9', 'bakış çekmeceye iner (vi)', ['B5', 'G#5', 'E5']))
        elif 'gözle' in e:
            vplan.append((k, ['Amaj7', 'F#m9'][gozle % 2], f'gözle ölçü {gozle + 1} ({["IV", "ii"][gozle % 2]})', [['B4'], ['G#5']][gozle % 2]))
            gozle += 1
        else:
            vplan.append((k, 'Emaj7', 'ölçü çerçevesi (I)', ['G#5']))
    s_son = min([s for s, e in SUS if k_fikir <= s <= b] or [b + 1])
    if vplan and 'B7' not in vplan[-1][1] and s_son - vplan[-1][0] > 40:
        vplan.append((max(vplan[-1][0] + 24, s_son - 30), 'B7sus4', 'sahne sonu: yarım kadans (V sus4, asılı)', []))
    for q, (k, sem, et, notlar_) in enumerate(vplan):
        k1 = vplan[q + 1][0] if q + 1 < len(vplan) else b + 1
        ak(k, sem, k1 - k, 0.30, et)
        PEDAL.append((k, k1 - 1))
        for z, ad_ in enumerate(notlar_):
            if z == 0 or uygun(k + 4 * z, k):
                n(k + 4 * z, ad_, 0.38 - 0.02 * z, 8, et, 'isaret')

    # =========================================================================== BALKON: Sol majör; güneşte geniş; kırıkta iv
    a, b = S['s3-balkon']
    ton('s3-balkon', 'G', 'ionian', a, b, 'Mi majörün V sus4\'ü → sessizlik → Sol majör (kromatik medyant: yeni sahne, yeni ışık)')
    kes, kon, tik = isr('kesme', 's3-balkon'), isr('konusma', 's3-balkon'), isr('tik', 's3-balkon')
    dus, vur = isr('dusunce', 's3-balkon'), isr('vurgu', 's3-balkon')
    D_NOTA = kisi_notasi('D', 'B4')
    k11 = vk(11, (a + 144, a + 251))[0]
    k12 = vk(12, (a + 252, a + 355))[0]
    k13 = vk(13, (a + 356, b))[0]
    t_dus = dus[0]['kare'] if dus else b
    g_pcs = mod_pcs(_PC['G'], 'ionian')
    # #10 ayna: Gmaj9 → Em9 → Cmaj7; tema 1–2. ölçü majörde geniş, legato (sıcak)
    ak(a, 'Gmaj9', 96, 0.36, 'sabah, ayna (I)')
    PEDAL.append((a, a + 95))
    ak(a + 96, 'Em9', 24, 0.32, 'vi')
    ak(a + 120, 'Cmaj7', k11 - a - 120, 0.32, 'IV')
    PEDAL.append((a + 96, k11 - 1))
    tema_v(a, [1, 2], 's3-balkon', 'tema (balkon): majörde geniş, legato', 'G4', 'ionian', hiz=0.46, legato=1.3, son=k11)
    for i in tik:
        if i['kare'] > t_dus:
            continue
        nesne(i['kare'], tik_tipi(i), 'balkon: ' + ek_metni(i).strip())
        if 'küpe' in ek_metni(i):
            n(i['kare'] + 4, 'D6', 0.16, 4, 'küpe ışıltısı'); n(i['kare'] + 8, 'F#6', 0.14, 4, 'küpe ışıltısı')
    # #11 kapıya legato yürüyüş (ii), ışık dolar (V6, yükselir), güneş: I geniş açılım, tema 5. ölçü oktav üstte
    t_kapi = next((i['kare'] for i in tik if 'kapı' in ek_metni(i)), k11 + 36)
    v_isik = next((i['kare'] for i in vur if 'ışık' in ek_metni(i)), t_kapi + 6)
    v_gunes = next((i['kare'] for i in vur if 'güneş' in ek_metni(i)), k11 + 72)
    kes11 = [i['kare'] for i in kes if v_isik < i['kare'] < v_gunes]
    ak(k11, 'Am7', t_kapi - k11, 0.30, 'kapıya yürür (ii)')
    for j, ad_ in enumerate(['B4', 'A4', 'G4', 'A4', 'B4', 'D5']):
        f = k11 + 12 * j
        if f >= t_kapi - CAPA_YARICAP:
            break
        n(f, ad_, 0.30, 14, 'kapıya yürür (legato)')
    PEDAL.append((k11, t_kapi - 1))
    son_isik = (kes11[0] if kes11 else v_gunes)
    ak(v_isik, 'D/F#', son_isik - v_isik, 0.32, 'ışık dolar (V6, yükselir)')
    for j, ad_ in enumerate(['D5', 'F#5', 'A5', 'B5']):
        f = v_isik + 4 * j
        if j == 0 or (f < son_isik - CAPA_YARICAP and uygun(f, v_isik)):
            n(f, ad_, 0.34 - 0.03 * j, 10, 'ışık dolar: yükselen pırıltı', 'isaret' if j == 0 else 'muzik')
    PEDAL.append((v_isik, son_isik - 1))
    for k in kes11:
        n(k, 'E5', 0.32, 10, 'beyazdan balkona')
    ak(v_gunes, 'Gmaj9', k12 - v_gunes, 0.40, 'güneş: geniş açılım (I)', ust_v=0.30)
    n(v_gunes, 'G1', 0.30, k12 - v_gunes, 'güneş: geniş açılım (alt oktav)')
    PEDAL.append((v_gunes, k12 - 1))
    tema_v(v_gunes, [5], 's3-balkon', 'tema (balkon): güneş, geniş (oktav üstte)', 'G4', 'ionian', hiz=0.46, legato=1.2, oktav=1)
    # #12 çiçekler (IV) ve D'nin notası; "Çiçeklerim…" asılı; klişe saksılar: tek inen nota (ii); kırık: ödünç minör iv
    ak(k12, 'Cmaj7', 48, 0.34, 'çiçekler (IV)')
    n(k12, D_NOTA, 0.36, 26, 'D\'nin notası')
    PEDAL.append((k12, k12 + 47))
    for i in kon:
        if k12 <= i['kare'] < k13:
            n(i['kare'], 'A5', 0.34, 38, '"Çiçeklerim çok güzel…": asılı (IV üstünde 13\'lü)', 'isaret')
    t_topak = next((i['kare'] for i in tik if 'toprak' in ek_metni(i)), k12 + 80)
    kaydet(k12 + 48, 'Am7', t_topak - k12 - 48, 'klişe saksılar: tek inen nota (ii)')
    n(k12 + 48, 'A3', 0.34, max(8, t_topak - k12 - 50), 'klişe saksılar: tek inen nota')
    kas = t_topak + 6
    if kas < k13 - 8:
        ak(kas, 'Cmadd9', k13 - kas, 0.28, 'kırık saksı, kaş iner: ödünç minör iv')
    # #13 düş: umutlu yükseliş (vi → IV → V → I6), tema 6. ölçü yükselir; her giyinişte yükselen nota; sıkılır (ii);
    # "Keşke…" asılı; sahne sonu yarım kadans (D7sus4)
    v_sik = next((i['kare'] for i in vur if 'sıkıl' in ek_metni(i)), b - 100)
    if dus:
        bulut = dusunce_motifi(t_dus, ['D5', 'F#5', 'A5'])
        adim = max(24, (v_sik - bulut) // 4)
        yuk = [(bulut + q * adim, sem, et) for q, (sem, et) in enumerate([('Em9', 'düş açılır (vi)'), ('Cmaj9', 'umutlu yükseliş (IV)'),
                                                                         ('Dadd9', 'yükseliş (V)'), ('G/B', 'yükseliş (I6)')])]
        yuk = [y for y in yuk if y[0] < v_sik - 12]
        for q, (k0, sem, et) in enumerate(yuk):
            k1 = yuk[q + 1][0] if q + 1 < len(yuk) else v_sik
            ak(k0, sem, k1 - k0, 0.32, et)
            PEDAL.append((k0, k1 - 1))
        tema_v(bulut + 6, [6], 's3-balkon', 'tema (balkon): düşte umutlu yükseliş', 'G4', 'ionian', hiz=0.44, legato=1.2, son=v_sik - 8)
        giy = [i['kare'] for i in tik if t_dus < i['kare'] < v_sik]
        for j, k in enumerate(giy):
            hedef = midi(['B4', 'D5', 'E5', 'F#5'][min(j, 3)])
            for q, f in enumerate((k - 8, k - 4)):
                if uygun(f, k):
                    n(f, dizi_asagi(hedef, g_pcs) if q else dizi_asagi(dizi_asagi(hedef, g_pcs), g_pcs), 0.22, 4, 'parmak tutamacı çeker', 'isaret')
            n(k, hedef, 0.32 + 0.03 * j, 22, f'saksı biçimlenir {j + 1}', 'isaret')
            nesne(k, 'kumas', 'balkon: saksı oturur', rol='eslik')
    son_y = max(v_sik + 24, b - 47)
    ak(v_sik, 'Am9', son_y - v_sik, 0.30, 'düş söner, sıkılır (ii)')
    PEDAL.append((v_sik, son_y - 1))
    if b - son_y > 12:
        ak(son_y, 'D7sus4', b - son_y + 1, 0.30, 'sahne sonu: yarım kadans (V sus4, soru açık)')
        PEDAL.append((son_y, b))
    for i in kon:
        if i['kare'] >= v_sik:
            n(i['kare'], 'B5', 0.34, b - i['kare'] + 1, '"Keşke böyle bir aracım olsaydı…": asılı (9\'lu)', 'isaret')
    for i in vur:
        if i['kare'] not in (v_isik, v_gunes, v_sik):
            n(i['kare'], 'A4', 0.32, 24, 'balkon: vurgu', 'isaret')

    # =========================================================================== FRP: Re dorian; oyunbaz → gerilim → çözülme → heves
    a, b = S['s4-frp']
    ton('s4-frp', 'D', 'dorian', a, b, 'pivot kök Re: D7sus4 (Sol majörde V) → Dm9 (Re dorianda i)')
    kes, kon, tik, zar = isr('kesme', 's4-frp'), isr('konusma', 's4-frp'), isr('tik', 's4-frp'), isr('zar', 's4-frp')
    dus, vur = isr('dusunce', 's4-frp'), isr('vurgu', 's4-frp')
    E_NOTA = midi(kisi_notasi('E', 'A4'))
    kay4 = SAHNE_KAYDIR.get('s4-frp', 0)
    k15 = vk(15, (a + 136, a + 263))[0]
    k16 = vk(16, (a + 264, a + 503))[0]
    k17 = vk(17, (a + 504, b))[0]
    # Sallama ve atış işaretsiz: s4-frp.js sabitleri + kaydir; okunamazsa 3B yakın plan kesmesine (#15) göreli (v10 kurgusu:
    # sallama kesmeden 84, atış 29 kare önce)
    fa = frp_anlari()
    if 'K_SALLA' in fa and 'K_ATIS' in fa:
        k_salla, k_atis, frp_kaynak = fa['K_SALLA'] + kay4, fa['K_ATIS'] + kay4, 's4-frp.js K_SALLA/K_ATIS + kaydir'
    else:
        k_salla, k_atis, frp_kaynak = k15 - 84, k15 - 29, 'yakın plan kesmesine göreli (s4-frp.js okunamadı)'
    k_salla = min(max(a + 24, k_salla), k15 - 40)
    k_atis = min(max(k_salla + 20, k_atis), k15 - 8)
    FRP_AN.update(salla=k_salla, atis=k_atis, kaynak=frp_kaynak)
    sus4 = [(s, e) for s, e in SUS if a <= s <= b]
    # #14 sohbet: oyunbaz (dorian i – IV – v), tema kesik ve salınımlı; zarlar sallanır: V sus4 gerilim, notalar sıklaşır
    ak(a, 'Dm9', 24, 0.30, 'sohbet (i)', ust_v=0.20)
    ak(a + 24, 'G13', 24, 0.30, 'IV (dorian rengi)', ust_v=0.20)
    ak(a + 48, 'Am7', max(8, k_salla - a - 48), 0.28, 'v', ust_v=0.20)
    tema_v(a, [1, 2], 's4-frp', 'tema (FRP): dorianda oyunbaz', 'D5', 'dorian', hiz=0.44, olcek=0.75, stakato=True, salinim=True,
           son=k_salla - 6, kontra=False)
    for i in tik:
        if i['kare'] < k15:
            nesne(i['kare'], 'darbe', 'E2 masaya vurur, kâğıt figürler sallanır', -4)
    ak(k_salla, 'A7sus4', k_atis - k_salla, 0.32, 'zarlar sallanır: gerilim (V sus4)', ust=False)
    for o, ad_, v, d in [(0, 'A4', 0.32, 10), (12, 'C5', 0.32, 8), (22, 'D5', 0.34, 6), (30, 'E5', 0.34, 5), (36, 'F5', 0.36, 4), (41, 'G5', 0.36, 4)]:
        if k_salla + o < k_atis - 2:
            n(k_salla + o, ad_, v, d, 'gerilim: notalar sıklaşır')
    n(k_atis, 'A5', 0.34, 8, 'atış'); n(k_atis, 'A1', 0.32, 8, 'atış')
    # #15 3B yakın plan: gerilim (bVI maj7#11, ödünç); çarpmalarda kemik tıkırtısı ve yavaşlayan arpej; durunca nefes
    # (sessizlik), ardından çözülme (i add9) ve "hep yek" iç çekişi
    s15 = next((s for s, e in sus4 if k15 <= s < k16), k16)
    e15 = next((e for s, e in sus4 if k15 <= s < k16), k16)
    ak(k15, 'Bbmaj7#11', s15 - k15, 0.28, 'zar yakın planı: gerilim (bVI)', ust_v=0.22)
    zk = sorted(z['kare'] for z in zar)
    for z in zk:
        yogun = any(0 < abs(z - w) <= 12 for w in zk)
        nesne(z, 'kemik' if yogun else 'zar', 'zar çarpar' if yogun else 'zar tıkırtısı')
    t15 = [i['kare'] for i in tik if k15 <= i['kare'] < k16]
    z15 = [z for z in zk if k15 <= z < k16 and all(abs(z - t_) > CAPA_YARICAP for t_ in t15)]
    for j, z in enumerate(z15[::2][:4]):
        n(z, ['A#3', 'D4', 'F4', 'A4'][j], 0.36 - 0.02 * j, 24, 'arpej: zarlar yavaşlar', 'isaret')
    for i in tik:
        if k15 <= i['kare'] < k16:
            nesne(i['kare'], 'kumas', 'kâğıt şövalye devrilir')
    if e15 < k16 - 20:
        ak(e15, 'Dmadd9', k16 - e15, 0.30, 'zarlar durur: çözülme (i)')
        n(e15 + 6, 'F4', 0.28, 12, 'hep yek: söylenirler'); n(e15 + 18, 'D4', 0.26, 16, 'hep yek: söylenirler')
    # #16–#17 "Keşke…" ve düşünceler: üç girişli kanon; her düşünce kendi motifi (1: piyon "dın dın", 2: zar arpeji,
    # 3: temanın başı dorianda), her biri kendi ritminde, üst üste biner (heves). Çene v; dönen zarlar D5 dın; taş (ii) /
    # reçine (III maj7#11); sahne sonu yarım kadans (A7sus4 → La majöre pivot)
    kon_s = sorted(i['kare'] for i in kon)
    kon16 = [k for k in kon_s if k16 <= k < k17]
    dus_s = sorted(i['kare'] for i in dus)
    dus16 = [k for k in dus_s if k16 <= k < k17]
    d17 = next((k for k in dus_s if k >= k17), k17 + 6)
    vur17 = sorted(i['kare'] for i in vur if i['kare'] >= k17)
    v_cene = next((v for v in vur17 if v <= d17), None)
    sonra = [v for v in vur17 if v > d17]
    v_tas = sonra[0] if sonra else None
    v_rec = sonra[1] if len(sonra) > 1 else None
    kadans4 = max(b - 48, (v_rec or 0) + 30)
    kanon_bitis = v_tas or kadans4
    dus_sonra = [k for k in dus_s if k >= k16]
    # Kanonun girişleri: iki dilek (söz ya da balon) ve E'nin düşünceye dalışı (çene; yoksa ilk düşünce). Dilek yoksa
    # düşünceler giriş olur.
    dilekler = (kon16 if len(kon16) >= 2 else dus16)[:2]
    ucuncu = v_cene if v_cene is not None else (d17 if d17 in dus_s else None)
    girisler = dilekler + ([ucuncu] if ucuncu is not None else [])
    if len(girisler) < 3 and len(dus_sonra) >= 3:
        girisler = dus_sonra[:3]
    # her düşünce balonu kendi kısa motifiyle belirir (noktalar sessizlikte de çalar)
    DUS_MOTIF = [['F5', 'A5', 'C6'], ['D5', 'G5', 'A5'], ['A4', 'D5', 'E5']]
    bulutlar = {k: dusunce_motifi(k, DUS_MOTIF[q % 3], v=0.30) for q, k in enumerate(dus_s)}
    ilk16 = min(kon16 + dus16 + [k17])
    ak(k16, 'Bbmaj7', max(8, ilk16 - k16), 0.30, 'hep yek: söylenirler (bVI)')
    for i in tik:
        if k16 <= i['kare'] < k17:
            nesne(i['kare'], 'kumas', 'kâğıt figür boynunu büker')
    DILEK_AKOR = [('Fmaj7', 'III'), ('G13', 'IV')]
    for j, k in enumerate(kon16):
        k1 = kon16[j + 1] if j + 1 < len(kon16) else (v_cene or k17)
        sem, der = DILEK_AKOR[min(j, 1)]
        ak(k, sem, k1 - k, 0.30, f'"Keşke…" {j + 1} ({der})')
        n(k, 'G5' if j == 0 else E_NOTA, 0.42, k1 - k, f'"Keşke…" {j + 1}: asılı', 'isaret')
        PEDAL.append((k, k1 - 1))
    motif = {'piyon': [(0, 'A4', 10), (12, 'D5', 10), (24, 'D5', 10), (48, 'A4', 10), (60, 'D5', 10)],
             'zar': [(0, 'D4', 5), (6, 'F4', 5), (12, 'A4', 5), (18, 'C5', 5), (48, 'D4', 5), (54, 'F4', 5), (60, 'A4', 5), (66, 'C5', 5)]}
    tk = sorted(i['kare'] for i in tik if i['kare'] >= k17)
    dizi_tik, j = [], 0
    while j < len(tk):
        e = j
        while e + 1 < len(tk) and tk[e + 1] - tk[e] <= 12:
            e += 1
        if e - j + 1 >= 3:
            dizi_tik.extend(tk[j:e + 1])
        else:
            for k in tk[j:e + 1]:
                nesne(k, 'tok', 'FRP: tık')
        j = e + 1
    for j, k in enumerate(girisler):
        ad_m = ['piyon', 'zar', 'tema'][j]
        if ad_m == 'tema':
            bas_t = bulutlar.get(k, k + 4) if k in bulutlar else k + 4
            tema_v(bas_t, [1, 2], 's4-frp', 'tema (FRP): kanonun 3. girişi, düşünce (tema başı, dorian)', 'D5', 'dorian', hiz=0.42,
                   olcek=0.75, son=kanon_bitis - 4, kacin=set(dizi_tik))
            continue
        for f0 in range(k + VURUS, kanon_bitis - VURUS, 96):
            for o, nt, d in motif[ad_m]:
                if f0 + o < kanon_bitis - 4 and uygun(f0 + o) and f0 + o not in CAPA:
                    n(f0 + o, nt, 0.24 if ad_m == 'piyon' else 0.20, d, f'kanon girişi {j + 1}: {ad_m} motifi')
    if girisler:
        OSTINATO.append(dict(kare=[girisler[0], kanon_bitis], etiket='FRP: üç girişli kanon (motifler ölçü ölçü döner)'))
    bulut = max([bulutlar[k] for k in dus_sonra if d17 <= k <= d17 + 24] or [d17 + 10])
    if v_cene is not None:
        ak(v_cene, 'Am7', bulut - v_cene, 0.30, 'E elini çenesine götürür (v)')
    if d17 in bulutlar:
        son_b = v_tas if v_tas else b
        ak(bulut, 'Dm9', son_b - bulut, 0.30, 'düşünce: dönen zarlar (i)')
        PEDAL.append((bulut, (dizi_tik[0] if dizi_tik else son_b) - 1))
    for q, k in enumerate(dizi_tik):
        n(k, 'D5', 0.48, 5, f'zar {q + 1} belirir: dın', 'isaret')
    for k in [k for k in kon_s if k >= k17]:
        n(k, 'E5', 0.40, (v_tas or b) - k, '"Taştan mı olsa…": asılı', 'isaret')
    if v_tas:
        ak(v_tas, 'Em7', (v_rec or kadans4) - v_tas, 0.34, 'taş (ii)')
        nesne(v_tas, 'tok', 'taş', rol='eslik')
        PEDAL.append((v_tas, (v_rec or kadans4) - 1))
    if v_rec:
        ak(v_rec, 'Fmaj7#11', max(8, kadans4 - v_rec), 0.30, 'reçine (III, parlak)')
        for q, ad_ in enumerate(['A5', 'B5', 'E6']):
            f = v_rec + 4 * q
            if q == 0 or uygun(f, v_rec):
                n(f, ad_, 0.34 - 0.04 * q, 10, 'reçine: cam gibi pırıltı', 'isaret' if q == 0 else 'muzik')
        PEDAL.append((v_rec, kadans4 - 1))
    if b - kadans4 > 12:
        ak(kadans4, 'A7sus4', b - kadans4 + 1, 0.32, 'sahne sonu: yarım kadans (V sus4 → La majöre pivot)')
        PEDAL.append((kadans4, b))

    # =========================================================================== HIZLI GEÇİŞLER: La majör, parlak ve hızlı
    if 's4b-hizli' in S:
        a, b = S['s4b-hizli']
        ton('s4b-hizli', 'A', 'ionian', a, b, 'pivot A: Re dorianda V (A7sus4) → La majörde I')
        kes4b = sorted(i['kare'] for i in isr('kesme', 's4b-hizli')) or [a]
        tik4b, vur4b = isr('tik', 's4b-hizli'), sorted(i['kare'] for i in isr('vurgu', 's4b-hizli'))
        AKOR4B = [('Aadd9', 'bahçe: çözümün tadı (I)'), ('Dmaj7', 'QR, modem (IV)'), ('F#m9', 'QR, kafe (vi)'),
                  ('E7sus4', 'kartvizit: yarım kadans (V sus4)')]
        DIN4B = ['C#5', 'E5', 'F#5', 'A5', 'B5']
        for j, k in enumerate(kes4b):
            son = (kes4b[j + 1] if j + 1 < len(kes4b) else b + 1)
            n(k, DIN4B[min(j, len(DIN4B) - 1)], 0.46, 18, f'hızlı geçiş {j + 1}: kesmede dın', 'isaret')
            sem, et = AKOR4B[min(j, 3)]
            ak(k, sem, son - k, 0.32, et, ust_v=0.22)
            PEDAL.append((k, son - 1))
        for j, k in enumerate(vur4b):
            n(k, 'C#6' if j == 0 else 'B5', 0.34 if j == 0 else 0.28, 20 if j == 0 else 12,
              'bahçıvan gülümser: parlak nota' if j == 0 else 'alnını siler: küçük nota', 'isaret')
        for i in tik4b:
            nesne(i['kare'], 'pit', 'QR: temiz küçük tık')
        plan = [[1, 2, 3], [4, 5], [6, 7], [8]]
        for j, k in enumerate(kes4b[:4]):
            son_ = (kes4b[j + 1] - 4) if j + 1 < len(kes4b[:4]) else b
            tema_v(k + 12, plan[j], 's4b-hizli', 'tema (hızlı geçiş): La majörde hızlı, parlak', 'A4', 'ionian', hiz=0.46,
                   olcek=0.5, legato=0.9, son=son_, uzat_son=(b if j == len(kes4b[:4]) - 1 else None), kontra=False)

    # =========================================================================== KALABALIK: Re majörün V'inde birikim
    # La pedalı (V); balonlar belirdikçe üst sesler basamak basamak yükselir (A7sus4 → Bm7/A → C#m7b5/A → D/A → Em7/A →
    # F#m7/A); her fikir bir basamak yüksek tek nota; tema girişleri dizi halinde yükselir (sekans); "Keşke": V7 üstünde
    # temanın soru ölçüsü hep birlikte; devirde V9 → final.
    a, b = S['s5-kalabalik']
    ton('s5-kalabalik', 'D', 'ionian', a, b, 'pivot E7sus4 → La pedalı (La majörde V → Re majörde V): dominantta birikim')
    kes5 = isr('kesme', 's5-kalabalik')
    kon, dus, vur = isr('konusma', 's5-kalabalik'), isr('dusunce', 's5-kalabalik'), isr('vurgu', 's5-kalabalik')
    n(a, 'A1', 0.32, b - a + 1, 'V pedalı (birikim)')
    n(a, 'E2', 0.28, b - a + 1, 'V pedalı (birikim)')
    for i in kes5:
        n(i['kare'], 'D5', 0.34, 40, 'kesme: kalabalık (V sus4\'ün 4\'lüsü)', 'isaret')
    dus_k = [i['kare'] for i in dus]
    kon_k = [i['kare'] for i in kon]
    ilk_fikir = dus_k[0] if dus_k and (not kon_k or dus_k[0] < kon_k[0]) else None
    if ilk_fikir is not None:
        dusunce_motifi(ilk_fikir, ['D5', 'F#5', 'A5'], hizli=True)
    for k in kon_k:
        n(k, 'E5', 0.40, 60, '"Bunu canlandırabilir miyiz?": asılı (V üstünde soru)', 'isaret')
    fikirler = [k for k in dus_k if k != ilk_fikir]
    k_keske = next((i['kare'] for i in vur if 'dilek' in ek_metni(i)), vur[0]['kare'] if vur else a + 216)
    k_devir = next((i['kare'] for i in vur if i['kare'] > k_keske), b - 39)
    basamak = ['A7sus4', 'Bm7/A', 'C#m7b5/A', 'D/A', 'Em7/A', 'F#m7/A']
    once = [k for k in fikirler if k < k_keske - 12]
    adimlar = []
    if once:
        f0, span = once[0], max(1, k_keske - once[0])
        for q in range(5):
            hedef = f0 + q * span / 5
            aday = [k for k in once if not adimlar or k > adimlar[-1]]
            if aday:
                adimlar.append(min(aday, key=lambda k: abs(k - hedef)))
    ak(a, basamak[0], (adimlar[0] if adimlar else k_keske) - a, 0.28, 'kafalar alttan çıkar (V sus4)', bas5=False)
    for q, k in enumerate(adimlar):
        k1 = adimlar[q + 1] if q + 1 < len(adimlar) else k_keske
        ak(k, basamak[min(q + 1, len(basamak) - 1)], k1 - k, 0.28 + 0.02 * q, f'kalabalık dolar: basamak {q + 2}', bas5=False)
    d_pcs = mod_pcs(_PC['D'], 'ionian')
    m_b = midi('A4')
    for j, k in enumerate(fikirler):
        hemen_ardi = any(0 < k - c <= 6 for c in CAPA)          # yüksek bir vurgunun hemen ardı: balon onun kuyruğunda kalmasın
        v0 = 0.40 + 0.10 * j / max(1, len(fikirler) - 1) + (0.14 if hemen_ardi else 0.0)
        n(k, m_b, v0, 10, f'fikir {j + 1}: bir basamak yükselir', 'isaret')
        n(k, m_b + 12, v0 * (0.75 if hemen_ardi else 0.45), 6, f'fikir {j + 1}: oktav ışıltısı (yoğun dokuda balon duyulsun)', 'isaret')
        m_b = adim_yukari(m_b, d_pcs)
        if m_b > midi('E6'):
            m_b -= 12
    ff = [k for k in fikirler if a + 60 < k < k_keske - 30]
    for idx, kay in [(0, 0), (3, 1), (6, 2)]:
        if idx < len(ff):
            tema_v(ff[idx], [1], 's5-kalabalik', 'tema (kalabalık): sekans, her girişte bir basamak yüksek', 'D4', 'ionian',
                   hiz=0.38 + 0.03 * kay, kaydir=kay, son=k_keske - 4, kontra=False)
    ak(k_keske, 'A7', k_devir - k_keske, 0.42, '"Keşke şöyle olsa…": V7, hep birlikte', ust_v=0.34)
    PEDAL.append((k_keske, k_devir - 1))
    tema_v(k_keske, [4], 's5-kalabalik', 'tema (kalabalık): "Keşke", soru ölçüsü hep birlikte', 'D5', 'ionian', hiz=0.50, son=k_devir - 4)
    tema_v(k_keske, [4], 's5-kalabalik', 'tema (kalabalık): "Keşke" (oktav altı)', 'D5', 'ionian', hiz=0.40, oktav=-1,
           son=k_devir - 4, kontra=False)
    ak(k_devir, 'A9', b - k_devir + 1, 0.40, 'devir: V9, finale çeker')
    PEDAL.append((k_devir, b))
    tema_v(k_devir, [6], 's5-kalabalik', 'tema (kalabalık): devir, yükselir', 'D5', 'ionian', hiz=0.46, son=b, kontra=False)
    for i in vur:
        if i['kare'] not in (k_keske, k_devir):
            n(i['kare'], 'A4', 0.34, 24, 'vurgu', 'isaret')

    # =========================================================================== FİNAL: Re majöre dönüş; tema tam, doruk, kadans
    # Logo kurulurken V pedalı üstünde tema büyür (1 → 2 → 6), doruğa 7. ölçünün A5'i oturur (I, finalin en yüksek anı) ve
    # OKTOS boyunca asılı kalır (fermata); logo + yazı tıkından sonraki sakin tutuşta temanın son cümlesi iner (F#5 E5
    # C#5, V sus4 → V7) ve tam kadansla Re'ye çözülür (I). Slogan işareti yoksa slogan bölümü yok; varsa eski düzen.
    a, b = S['s6-final']
    ton('s6-final', 'D', 'ionian', a, b, 'V9 → I6/4 – V pedalı → I: Re majöre dönüş')
    f_tik, f_vur, f_nota = isr('tik', 's6-final'), isr('vurgu', 's6-final'), isr('nota', 's6-final')
    isr('kesme', 's6-final')
    doruk = next((i['kare'] for i in f_vur if i.get('ad') == 'doruk'), a + FINAL_VARSAYIM['doruk'])
    slogan = next((i['kare'] for i in f_vur if i.get('ad') == 'slogan'), None)
    gruplar = sorted({i['kare'] for i in f_tik if i['kare'] < doruk})
    sonra_tik = sorted({i['kare'] for i in f_tik if i['kare'] >= doruk})
    logo_tik = next((i['kare'] for i in f_tik if i.get('ad') == 'oktos-tik'), None)
    otur = next((i['kare'] for i in f_tik if 'otur' in ek_metni(i)), None) if slogan is not None else None
    esne = sorted({i['kare'] for i in f_tik if i.get('ad') == 'slogan-i'})
    harfler = sorted({i['kare'] for i in f_tik if i.get('ad') == 'oktos'})
    if not harfler:
        harfler = [k for k in sonra_tik if (slogan is None or k < slogan) and k not in (logo_tik, otur) and k not in esne][:5]
    damla = sorted({k for k in sonra_tik if slogan is not None and k >= slogan and k != otur and k not in esne})
    cizgi = ['F#3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'A4', 'B4']
    notalar = cizgi[-len(gruplar):] if 0 < len(gruplar) <= len(cizgi) else cizgi + [cizgi[-1]] * max(0, len(gruplar) - len(cizgi))
    ustler = [('G/A', ['G3', 'B3', 'D4']), ('Em7/A', ['E3', 'G3', 'B3', 'D4']), ('A7sus4', ['D4', 'E4', 'G4']), ('A7', ['C#4', 'E4', 'G4'])]
    ilk = gruplar[0] if gruplar else doruk
    akor(a, ['A1', 'E2'], 0.32, ilk - a, 'A (V) pedalı: logo kurulur'); akor(a, ['D4', 'F#4'], 0.24, ilk - a, 'D/A')
    kaydet(a, 'D/A', ilk - a, 'logo kurulur (I6/4 → V pedalı)')
    PEDAL.append((a, ilk - 1))
    G = len(gruplar)
    for j, g in enumerate(gruplar):
        son = gruplar[j + 1] if j + 1 < G else doruk
        u = j / max(1, G - 1)
        sem, ust_ = ustler[min(3, int(round(u * 3)))]
        n(g, notalar[j], 0.34 + 0.06 * u, son - g, f'logo grubu {j + 1}', 'isaret')
        n(g, 'A1', 0.30 + 0.08 * u, son - g, 'A bas')
        akor(g, ust_, 0.24 + 0.08 * u, son - g, f'{sem}: kabaran üst sesler')
        kaydet(g, sem, son - g, f'logo grubu {j + 1}: kabarır')
        PEDAL.append((g, son - 1))
    # Tutuşun başı (H) ve kadans: slogan yoksa logo + yazı tıkı; tema inişi H'den sonra, kadans sakin (ölçek ≤ 1,15)
    if slogan is None:
        H = logo_tik if logo_tik is not None else ((harfler[-1] + 12) if harfler else doruk + 48)
        olc = float(np.clip((b - 60 - H) / 72.0, 0.5, 1.15))
        inis_k = [H + int(round(12 * olc)), H + int(round(24 * olc)), H + int(round(48 * olc))]
        kadans = H + int(round(72 * olc))
        v_bas = H
    else:
        inis_k = [doruk + 36, doruk + 48, doruk + 72]
        kadans = otur if otur is not None else slogan
        v_bas = slogan
    bas_son = (v_bas - doruk) if v_bas > doruk else b - doruk
    ust_sure = (harfler[0] - doruk - 6) if harfler else min(48, bas_son)
    akor(doruk, ['D1'], 0.22, bas_son, 'DORUK: logo'); akor(doruk, ['D2'], 0.36, bas_son, 'DORUK: logo')
    akor(doruk, ['A2', 'F#3'], 0.38, bas_son, 'DORUK: logo'); akor(doruk, ['C#4', 'E4', 'A4'], 0.40, ust_sure, 'DORUK: logo')
    n(doruk, 'D5', 0.54, ust_sure, 'DORUK: logo', 'isaret'); n(doruk, 'F#5', 0.50, ust_sure, 'DORUK: logo')
    kaydet(doruk, 'Dmaj9', bas_son, 'DORUK: logo tamam (I)')
    PEDAL.append((doruk, doruk + ust_sure - 1))
    inis = ['D6', 'C#6', 'B5', 'D6', 'C#6', 'B5', 'A5', 'F#5']
    for j, k in enumerate(harfler):
        n(k, inis[min(j, len(inis) - 1)], 0.40, 10, f'OKTOS harf {j + 1}: pırıltı', 'isaret')
    if logo_tik is not None:
        nesne(logo_tik, 'tok', 'logo ve yazı birlikte tık', -3)
    # V → I: sakin tam kadans
    if kadans > v_bas + 36:
        ak(v_bas, 'A7sus4', kadans - 24 - v_bas, 0.28, 'tutuş: V sus4, son soru', ust_v=0.20)
        ak(kadans - 24, 'A7', 24, 0.28, 'V7: kadansa', ust_v=0.20)
        PEDAL.append((v_bas, (damla[0] if damla else kadans) - 1))
        if slogan is not None:
            n(slogan, 'A5', 0.34, 18, 'slogan başlar', 'isaret')
    ak(kadans, 'Dadd9', b - kadans + 1, 0.32, 'tam kadans: bütün sorular kapanır (I)', ust_v=0.24)
    PEDAL.append((kadans, b))
    DAMLA = ['A5', 'E5', 'F#5', 'B5', 'E5', 'A5', 'F#5', 'B5']
    for j, k in enumerate(damla):
        n(k, DAMLA[j % len(DAMLA)], 0.30 - 0.01 * j, 10, f'slogan damlası {j + 1}', 'isaret')
    if otur is not None:
        nesne(otur, 'tok', 'slogan oturur: tek tık', -3)
    for j, k in enumerate(esne):
        n(k, ['A5', 'D6'][j % 2], 0.34 - 0.02 * j, 6, f'İ esner {j + 1}: oyunbaz nota', 'isaret')
    for i in f_nota:
        n(i['kare'], i.get('nota', 'D5'), 0.40, 24, 'final: nota işareti', 'isaret')
    for i in f_vur:
        if i['kare'] not in (doruk, slogan):
            n(i['kare'], 'A4', 0.34, 24, 'final: vurgu', 'isaret')
    for k in sonra_tik:
        if k not in harfler and k not in damla and k not in (otur, logo_tik) and k not in esne:
            nesne(k, 'tok', 'final: tık', -6)
    # Tema finalde tam: 1 → 2 → 6 büyür (V pedalı üstünde), doruğa 7. ölçünün A5'i oturur, inişi tutuşta, kadansta D5
    # Finalin doruğa dek süresine sığan kadar ölçü (1 → 2 → 6; kısa finalde 2 → 6 ya da yalnız 6), gerekirse biraz sıkışık
    yer_ = doruk - a - 6
    n_olcu = next((n for n in (3, 2, 1) if yer_ >= n * 96 * 0.85), 0)
    if n_olcu:
        olc_ = min(1.0, yer_ / (n_olcu * 96))
        tema_v(doruk - int(round(n_olcu * 96 * olc_)), [1, 2, 6][-n_olcu:], 's6-final', 'tema (final): logo kurulurken büyür', 'D5',
               'ionian', hiz=[0.40, 0.44, 0.48][-n_olcu:], olcek=olc_, legato=1.0)
        tema_v(doruk - int(round(96 * olc_)), [6], 's6-final', 'tema (final): büyür (oktav altı)', 'D5', 'ionian', hiz=0.30, oktav=-1,
               olcek=olc_, kontra=False)
    tema_nota(doruk, 'A5', 0.62, inis_k[0] - doruk, 's6-final', 7, 'tema (final): doruk, A5 asılı (fermata)')
    inis_t = [(inis_k[0], 'F#5', 0.44, 'iner'), (inis_k[1], 'E5', 0.42, 'iner'), (inis_k[2], 'C#5', 0.42, 'yeden ses, V7 üstünde')]
    for q, (f, ad_, v, et) in enumerate(inis_t):
        f2 = inis_t[q + 1][0] if q + 1 < len(inis_t) else kadans
        if f < kadans:
            tema_nota(f, ad_, v, max(6, f2 - f), 's6-final', 7, f'tema (final): son cümle {et}')
    tema_nota(kadans, 'D5', 0.46, b - kadans + 1, 's6-final', 8, 'tema (final): tam kadans, çözülme')
    TEMA_YER.append(dict(sahne='s6-final', olculer=[(7, doruk, max(24, kadans - doruk))], son=kadans))

    # Tema öne çıksın: aynı karede temayla yarım/tam ton (ya da aynı) perdede çakışan eşlik ve işaret notaları kalkar
    tema_kare = {}
    for t_ in TEMA_N:
        tema_kare.setdefault(t_['kare'], []).append(t_['m'])
    N[:] = [p for p in N if not (p['parca'] in ('muzik', 'isaret') and p['kare'] in tema_kare
                                 and any(abs(p['m'] - m) <= 2 for m in tema_kare[p['kare']]))]

    # =========================================================================== Kalan işaretler: genel karşılık
    genel = []
    for i in isaretler:
        if id(i) in tuketilen or i['tur'] == 'sessizlik':
            continue
        k, t = i['kare'], i['tur']
        if t == 'tik':
            nesne(k, tik_tipi(i), 'tık (genel)')
        elif t == 'zar':
            nesne(k, 'zar', 'zar (genel)')
        elif t == 'konusma':
            n(k, 'E5', 0.38, 36, 'konuşma (genel): asılı', 'isaret')
        elif t == 'dusunce':
            dusunce_motifi(k, ['D5', 'F#5', 'A5'])
        elif t == 'vurgu':
            n(k, 'A4', 0.36, 24, 'vurgu (genel)', 'isaret')
        elif t == 'nota':
            n(k, i.get('nota', 'D5'), 0.40, 24, 'nota işareti', 'isaret')
        elif t == 'kesme' and k not in kesme_birlesen:
            n(k, 'D2', 0.30, 24, 'kesme (genel)')
        genel.append(dict(kare=k, tur=t, ek=ek_metni(i).strip()))

    # =========================================================================== Temizlik: çapalar, sessizlikler, pedal
    # 1) Fon notası bir çapanın ±3 karesinde başlıyorsa çapaya yapışır (işaret oynarsa müzik flam yapmaz)
    yapisan = []
    for p in N:
        if p['parca'] != 'muzik' or p['kare'] in CAPA:
            continue
        yakin = [c for c in CAPA if abs(c - p['kare']) <= CAPA_YARICAP]
        if yakin:
            c = min(yakin, key=lambda c: abs(c - p['kare']))
            yapisan.append(dict(kare=p['kare'], yeni=c, nota=nota_adi(p['m']), etiket=p['etiket']))
            p['kare'] = c
    # 2) Sessizlikte başlayan (serbest olmayan) notalar düşer; nesne sesleri ve balon noktaları çalar
    dusen = [dict(kare=p['kare'], nota=nota_adi(p['m']), etiket=p['etiket']) for p in N
             if not p['serbest'] and any(s <= p['kare'] < e for s, e in SUS)]
    N = [p for p in N if p['serbest'] or not any(s <= p['kare'] < e for s, e in SUS)]
    # 3) Pedal sessizlikten önce kalkar, sessizlik içinde basılmaz
    pedal = []
    for pa, pb in sorted(PEDAL):
        for s, e in SUS:
            if pa < s <= pb:
                pb = s - 1
            if s <= pa < e:
                pa = e
        if pa <= pb:
            pedal.append((pa, pb))

    N.sort(key=lambda p: (p['kare'], p['m']))
    for p in N:
        p['capada'] = p['kare'] in CAPA          # B: işaret karesindeki nota bir katman parlak (düzey aynı)
        p['cekic'] = p['capada'] and p['parca'] in ('isaret', 'kesme')   # B: işaret notasına çekiç vurgusu (akorlara değil)
    # Akorlar elle çalınmış gibi alttan üste hafifçe açılır (bas tam karede; nota başına 6 ms, doruğa 9 ms).
    # İşaret ve kesme notaları ve çapa karesindeki akorlar kaydırılmaz: kareye tam oturur (doruğu işaret notası D5 taşır).
    gruplar_k = {}
    for p in N:
        p['ofset_ms'] = 0.0
        if p['parca'] == 'muzik' and (p['kare'] not in CAPA or p['kare'] == doruk):
            gruplar_k.setdefault(p['kare'], []).append(p)
    for k, g in gruplar_k.items():
        if len(g) > 1:
            for i, p in enumerate(sorted(g, key=lambda q: q['m'])):
                p['ofset_ms'] = round(i * (9.0 if k == doruk else 6.0), 1)
    NES.sort(key=lambda e: e['kare'])
    return dict(notalar=N, nesneler=NES, pedal=pedal, susturma=SUS, capa=CAPA, kesme_birlesen=kesme_birlesen,
                yapisan=yapisan, dusen=dusen, genel=genel,
                kanca=dict(kesmeler=yuzler, a_karesi=a_k, kaynak=kaynak, isaret_kesmeleri=kanca_isaret,
                           isaretle_uyumlu=[k for k in kanca_isaret if k != 0] == kesmeler),   # k0: ilk yüz (açılış kesmesi)
                final=dict(final_bilgi, doruk=doruk, slogan=slogan, gruplar=gruplar, harfler=harfler, logo_tik=logo_tik, kadans=kadans),
                tema=TEMA_N, tema_yer=TEMA_YER, akorlar=sorted(AKORLAR, key=lambda x: x['kare']), ton_har=TON_HAR, ostinato=OSTINATO,
                frp=FRP_AN)


TON_AD = {'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'Eb': 'Mi♭', 'E': 'Mi', 'F': 'Fa', 'F#': 'Fa#', 'G': 'Sol', 'Ab': 'La♭', 'A': 'La',
          'Bb': 'Si♭', 'B': 'Si'}
MOD_AD = {'ionian': 'majör', 'aeolian': 'minör (eolyen)', 'dorian': 'dorian', 'mixolydian': 'miksolidyen'}


def dizi_pcs_bul(ton_har, f):
    """f karesinde geçerli tonun dizisi (ton planından; en son başlayan bölüm kazanır). Yoksa Re majör."""
    secim = None
    for t in ton_har:
        if t['kare'][0] <= f <= t['kare'][1] and (secim is None or t['kare'][0] >= secim['kare'][0]):
            secim = t
    return mod_pcs(_PC[secim['kok']], secim['mod']) if secim else set(_RE_MAJOR)


def calan_akor(akorlar, f):
    """f karesinde çalan akor sembolü (akor dizisinden; f'ten önce başlayan son akor)."""
    secim = None
    for x in akorlar:
        if x['kare'] <= f + 2:
            secim = x
        else:
            break
    return secim['sembol'] if secim else 'D'


def ton_plani(P):
    """Cizelge: bölüm başına ton/mod, geçiş (pivot) ve akor dizisi."""
    out = []
    for t in P['ton_har']:
        a, b = t['kare']
        aks = [x for x in P['akorlar'] if a <= x['kare'] <= b]
        dizi = []
        for x in aks:
            if not dizi or dizi[-1] != x['sembol']:
                dizi.append(x['sembol'])
        out.append(dict(bolum=t['sahne'], ton=f"{TON_AD.get(t['kok'], t['kok'])} {MOD_AD.get(t['mod'], t['mod'])}", kare=[a, b],
                        sn=[round(kare_sn(a), 2), round(kare_sn(b + 1), 2)], gecis=t['gecis'], akor_dizisi=' → '.join(dizi),
                        akorlar=[dict(kare=x['kare'], sembol=x['sembol'], sure_kare=x['sure'], etiket=x['etiket']) for x in aks]))
    return out


def tekrar_denetimi(P, D=None, olcu=96, O=None):
    """Kural: hiçbir akor ya da nota deseni art arda 2 ölçüden fazla sürmez (bilinçli ostinato hariç).
    1) Akor: aynı sembol art arda yeniden basılıp 2 ölçüyü aşarsa ihlal; tek basışta uzun tutuş yalnız rapor.
    2) Desen: sahne başından ölçü ölçü (96 kare) eşlik + tema + doku piyano başlangıçları (3 karelik ızgara, perde);
       art arda 3+ özdeş ölçü ihlal. Bilinçli ostinato aralıkları (partisyon ve doku) dışarıda."""
    ost = [tuple(o['kare']) for o in P.get('ostinato', []) + (D or {}).get('ostinato', []) + (O or {}).get('ostinato', [])]

    def ostinatoda(a, b):
        return any(oa - 6 <= a and b <= ob + 6 for oa, ob in ost)
    aks = sorted(P['akorlar'], key=lambda x: x['kare'])
    ihlal_akor, uzun = [], []
    i = 0
    while i < len(aks):
        j = i
        while j + 1 < len(aks) and aks[j + 1]['sembol'] == aks[i]['sembol']:
            j += 1
        bas, son = aks[i]['kare'], max(x['kare'] + x['sure'] for x in aks[i:j + 1])
        if son - bas > 2 * olcu:
            kayit = dict(kare=[bas, son], sembol=aks[i]['sembol'], olcu=round((son - bas) / olcu, 2), basis=j - i + 1, etiket=aks[i]['etiket'])
            if j > i and not ostinatoda(bas, son):
                ihlal_akor.append(kayit)
            else:
                uzun.append(kayit)
        i = j + 1
    notalar = [(p['kare'], p['m']) for p in P['notalar'] if p['parca'] in ('muzik', 'tema')]
    if D:
        notalar += [(p['kare'], p['m']) for p in D['piyano']]
    if O:                                   # orkestranın perdeli fon olayları (davullar desen, denetime girmez)
        notalar += [(o['kare'], o['m']) for o in O['olaylar'] if o['m'] is not None and stem_adi(o['calgi']) == 'fon']
    ihlal_desen, en_uzun = [], 0
    for ad, (sa, sb) in SAHNELER.items():
        olculer = []
        for o0 in range(sa, sb + 1, olcu):
            olculer.append((o0, frozenset(((k - o0) // 3, m) for k, m in notalar if o0 <= k < min(o0 + olcu, sb + 1))))
        q = 0
        while q < len(olculer):
            r = q
            while r + 1 < len(olculer) and olculer[q][1] and olculer[r + 1][1] == olculer[q][1]:
                r += 1
            uz = r - q + 1
            if olculer[q][1]:
                a_, b_ = olculer[q][0], olculer[r][0] + olcu - 1
                if uz > 2 and not ostinatoda(a_, b_):
                    ihlal_desen.append(dict(sahne=ad, kare=[a_, b_], olcu=uz, nota=sorted({nota_adi(m) for _, m in olculer[q][1]})))
                if not ostinatoda(a_, b_):
                    en_uzun = max(en_uzun, uz)
            q = r + 1
    return dict(kural='akor ya da nota deseni art arda en çok 2 ölçü; bilinçli ostinato hariç',
                ostinato=[dict(kare=list(o['kare']), etiket=o['etiket'])
                          for o in P.get('ostinato', []) + (D or {}).get('ostinato', []) + (O or {}).get('ostinato', [])],
                akor_ihlal=ihlal_akor, desen_ihlal=ihlal_desen, en_uzun_ozdes_olcu_dizisi=en_uzun, uzun_tutus=uzun,
                tamam=not ihlal_akor and not ihlal_desen)


def bolumler():
    S = SAHNELER
    return [
        dict(ad='Kanca', kare=S['v1-kanca'], icerik='Re majör. Her yüz değişiminde bir nota (v1-kanca.js sure dizisi; A3→A5 pentatonik dalga, üçlemede iner); A: Dmaj9 çözülme (kafeye pivot).'),
        dict(ad='Kafe', kare=S['s1-kafe'], icerik='Si minör (pivot Dmaj9 = III). Tema minörde ağır (×1,5) ve yalnız; el kalkar Em9 (iv) yanıtsız, ikinci sesleniş F#7sus4 asılı (çözülmez), garson kahkaha atar; sessizlikte yüz asılır; düşünce: bas iner (Bm → Bm/A → Gmaj7 → Em7), durgun ostinato, temanın 6. ölçüsü minörde yükselir (tepesi dilek halkasında); sahne sonu F#7sus4 → F#7 (yarım kadans).'),
        dict(ad='Atölye', kare=S['s2-atolye'], icerik='Mi dorian (pivot Em). Cetvel sekizlikleri temayı dorianda heceler (Em9 → A13 → F#m7 → D6/9 → Em9 → Bm7); grup giderken inen figür; kuş bakışı Bm7, çekmece Em9, vidalar dağınık staccato, ölçü Gmaj7, "sığar mı?" B7sus4 asılı; fikirde Mi majöre aydınlanır (G → G#): Emaj9 ve temanın 3. ölçüsü, bakış C#m9, gözle ölçü Amaj7 / F#m9, çerçeve Emaj7, inceltir C#m7 (iner), uzatır Aadd9 (çıkar); sahne sonu B7sus4 asılı → sessizlik.'),
        dict(ad='Balkon', kare=S['s3-balkon'], icerik='Sol majör (kromatik medyant: yeni ışık). Ayna Gmaj9 → Em9 → Cmaj7, tema 1–2. ölçü legato; kapı Am7, ışık D/F# yükselir, güneş Gmaj9 geniş açılım (alt oktav G1) ve temanın 5. ölçüsü oktav üstte; çiçekler Cmaj7, klişe saksılar tek inen nota, kırık saksı ödünç Cm(add9) (iv); düş: Em9 → Cmaj9 → Dadd9 → G/B umutlu yükseliş, temanın 6. ölçüsü; sıkılır Am9, "Keşke…" asılı; sahne sonu D7sus4 (yarım kadans).'),
        dict(ad='FRP masası', kare=S['s4-frp'], icerik='Re dorian (pivot D7sus4 → Dm9). Sohbet Dm9 – G13 – Am7, tema dorianda kesik ve salınımlı (oyunbaz); zarlar sallanır A7sus4, notalar sıklaşır; 3B yakın plan B♭maj7#11 (ödünç bVI) gerilim, kemik tıkırtıları ve yavaşlayan arpej; nefes (sessizlik), çözülme Dm(add9); "Keşke…" dilekleri Fmaj7 / G13 üstünde asılı; üç girişli kanon (piyon "dın dın", zar arpeji, düşüncede temanın başı); dönen zarlar Dm9 + D5 dın; taş Em7, reçine Fmaj7#11; sahne sonu A7sus4 (yarım kadans, La’ya pivot).'),
        *([dict(ad='Hızlı geçişler', kare=S['s4b-hizli'], icerik='La majör (pivot A). Çekim başına akor Aadd9 → Dmaj7 → F#m9 → E7sus4 (yarım kadans), her kesmede yükselen dın (C#5 E5 F#5 A5); tema La majörde çift hızda çekimler boyunca; bahçıvan gülümser C#6; QR’larda temiz tıklar.')]
          if 's4b-hizli' in S else []),
        dict(ad='Kalabalık', kare=S['s5-kalabalik'], icerik='Re majörün V’inde birikim: La pedalı; üst sesler basamak basamak yükselir (A7sus4 → Bm7/A → C#m7b5/A → D/A → Em7/A → F#m7/A); her fikir bir basamak yüksek tek nota; tema sekansla girer (her girişte bir basamak yüksek); "Keşke şöyle olsa…" A7 üstünde temanın soru ölçüsü hep birlikte (oktavlı); devirde A9, temanın 6. ölçüsü yükselir.'),
        dict(ad='Final', kare=S['s6-final'], icerik='Re majöre dönüş. V pedalı üstünde logo kurulur (D/A → G/A → Em7/A → A7sus4 → A7), tema 1 → 2 → 6 büyür; DORUK Dmaj9 ve temanın 7. ölçüsünün A5’i (finalin en yüksek anı), OKTOS boyunca asılı (fermata), harflerde tiz pırıltılar; logo + yazı tıkından sonra sakin tutuşta temanın son cümlesi iner (F#5 E5 C#5; A7sus4 → A7) ve tam kadansla Dadd9 + D5’e çözülür; son 0,5 sn kararma. Slogan işareti yoksa slogan bölümü üretilmez.'),
    ]


def birakma_karesi(p, pedal, susturma):
    """Tuşun kalktığı kare; pedal basılıysa pedalın kalktığı kare. Sessizlik başlangıcı her şeyi keser.
    Pedal tuşun kalktığı karede basılıyorsa notayı tutmaz (pedal değişimi yeni akordan hemen sonra: eski akor susar)."""
    tus = p['kare'] + p['sure']
    son = tus
    for a, b in pedal:
        if a < tus <= b and p['kare'] <= b:
            son = b + 1
            break
    for s, _ in susturma:
        if p['kare'] < s < son:
            son = s
    return son


# =====================================================================================================
# PİYANO SENTEZİ
# =====================================================================================================
def nota_ciz(m, v, birak, uzunluk_max, rng, P, hizli=False, pan_ek=0.0):
    """Tek nota, t=0'dan; dönüş (2, L). birak: damper anı (örnek) ya da None (damper yok). P'nin isteğe bağlı anahtarları
    (parlaklik, fc_taban, fc_tavan, tavan_f, tel_max, damper_kat, cekic_f) yoksa ana piyano davranışı aynen kalır."""
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
    fc = min(P.get('fc_tavan', 5200.0), max(P.get('fc_taban', 1200.0), f0 * (4.0 + 16.0 * v ** 1.4) * P.get('parlaklik', 1.0)))
    alcak = 1 / np.sqrt(1 + (fn / fc) ** 4)
    tavan = 1 / np.sqrt(1 + (fn / P.get('tavan_f', 6500.0)) ** 6)
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
    td = np.clip(0.09 * (300.0 / fn) ** 0.25, 0.025, 0.25) * (1.8 if m < 40 else 1.0) * P.get('damper_kat', 1.0)
    # Kısmi başına uzunluk: -80 dB'ye inene dek (damperli ise bırakma + 9·td)
    L_k = np.minimum(uzunluk_max, (9.2 * tau_y * SR).astype(int))
    if damper:
        L_k = np.minimum(L_k, birak + (9.2 * td * SR).astype(int))
    L = int(max(L_k.max(), 1))
    sol = np.zeros(L); sag = np.zeros(L)
    # Teller: 1–3, hafif akort farkı; her tel biraz farklı yerde (stereo genişlik)
    tel = min(P.get('tel_max', 3), 1 if m < 30 else (2 if m < 45 else 3))
    yay = rng.uniform(*P['akort_sent'])
    sapma = {1: [0.0], 2: [-0.5, 0.5], 3: [-1.0, 0.07, 1.0]}[tel]
    sapma = [s * yay + rng.normal(0, 0.06) for s in sapma]
    pan0 = float(np.clip(np.clip((m - 64) / 40, -1, 1) * P['pan_genislik'] + pan_ek, -0.95, 0.95))
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
    fh = min(3200.0, max(900.0, f0 * 5)) * P.get('cekic_f', 1.0)
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


def cal(notalar, pedal, susturma, secici, rng, hizli=False, P=PIYANO, calgi='piyano'):
    """Piyano notalarını çalgının ses kaynağıyla (sentez: nota_ciz; örnek: ornek-calici) çalar; pedal/damper bırakması aynı."""
    N = kare_ornek(TOPLAM_KARE)
    kuru = np.zeros((2, N))
    ayni = {}                                     # aynı tuşun (telin) sonraki vuruşu: B'de önceki titreşim orada kesilir
    for p in sorted(notalar, key=lambda q: q['kare']):
        ayni.setdefault(p['m'], []).append(p['kare'])
    for p in notalar:
        if not secici(p):
            continue
        bas = kare_ornek(p['kare']) + int(round(p.get('ofset_ms', 0.0) * SR / 1000))
        sonraki = next((k for k in ayni[p['m']] if k > p['kare']), None)
        bk = birakma_karesi(p, pedal, susturma)
        p['birakma_kare'] = bk
        birak = kare_ornek(bk) - bas
        y = kaynak_ciz(calgi, dict(m=p['m'], hiz=p['hiz'], birak=birak, uzunluk_max=N - bas, P=P, kare=p['kare'],
                                   capada=p.get('capada', False), cekic=p.get('cekic', False),
                                   ayni_tel=None if sonraki is None else kare_ornek(sonraki) - bas), rng, hizli)
        L = min(y.shape[1], N - bas)
        kuru[:, bas:bas + L] += y[:, :L]
    return kuru


# =====================================================================================================
# NESNE SESLERİ (modal sentez: sönümlü kısmi sesler + bant geçiren gürültü; yumuşak açılış, 3 kHz'te yumuşak kesim)
# =====================================================================================================
def _vurus_sesi(P, rng, jitter=0.03):
    L = int(min(0.6, 7 * max(tau for _, tau, _ in P['mod'])) * SR) + 64
    t = np.arange(L) / SR
    y = np.zeros(L)
    for f, tau, a in P['mod']:
        f *= 1 + rng.uniform(-jitter, jitter)
        y += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t / tau)
    y /= np.max(np.abs(y)) + 1e-12
    fc, tn, pay = P['gur']
    g = rng.standard_normal(L)
    fr = np.fft.rfftfreq(L, 1 / SR)
    g = np.fft.irfft(np.fft.rfft(g) * np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / fc) / 0.7) ** 2), L)
    g /= np.sqrt(np.mean(g[:max(16, int(tn * SR))] ** 2)) + 1e-12
    y += pay * 0.5 * g * np.exp(-t / tn)
    return y


def _piyano_tik(tip, rng, nota=None):
    """v2 nesne sesi: susturulmuş (ya da hazırlanmış) piyano notası + çok kısa modal gövde; gürültü payı dörtte bir."""
    ad, ms, tur, v, govde_db = NESNE_NOTA[tip]
    m = midi(nota if nota is not None else ad)
    y = nota_ciz(m, v, int(ms * SR / 1000), int(0.8 * SR), rng, PIYANO_TURU[tur]).mean(axis=0)
    P = NESNE_TIP[tip]
    fc, tn, pay = P['gur']
    g = _vurus_sesi(dict(P, gur=(fc, tn, pay * 0.25)), rng)
    g *= np.max(np.abs(y)) * 10 ** (govde_db / 20)
    L = max(len(y), len(g))
    out = np.zeros(L)
    out[:len(y)] += y
    out[:len(g)] += g
    return out


def nesne_ciz(tip, rng, nota=None):
    P = NESNE_TIP[tip]
    if tip == 'zar':                     # iki-beş seken tıkırtı, giderek yakın ve kısık
        L = int(0.45 * SR)
        y = np.zeros(L)
        for t0, a in zip((0.0, 0.038, 0.070, 0.095, 0.113), (1.0, 0.5, 0.32, 0.18, 0.09)):
            c = _piyano_tik(tip, rng, nota) if NESNE_PIYANO else _vurus_sesi(P, rng, jitter=0.07)
            j = int(t0 * SR)
            m = min(len(c), L - j)
            y[j:j + m] += a * c[:m]
    else:
        y = _piyano_tik(tip, rng, nota) if NESNE_PIYANO else _vurus_sesi(P, rng)
    L = len(y)
    fr = np.fft.rfftfreq(L, 1 / SR)
    y = np.fft.irfft(np.fft.rfft(y) / np.sqrt(1 + (fr / 3000.0) ** 4), L)       # 3 kHz yumuşak kesim
    La = int(0.0012 * SR)                                                     # 1,2 ms açılış: yumuşak tepe
    y[:La] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, La))
    kuyruk = int(0.004 * SR)
    y[-kuyruk:] *= np.linspace(1, 0, kuyruk)
    y /= np.max(np.abs(y)) + 1e-12
    pan = rng.uniform(-0.15, 0.15)
    return np.vstack([y * math.cos((pan + 1) * math.pi / 4), y * math.sin((pan + 1) * math.pi / 4)])


def nesne_bandi(tip):
    """Düzey ve başlangıç ölçümünün bandı: v2'de kumaş tiz susturulmuş nota olduğu için 1 kHz."""
    return 1000 if NESNE_PIYANO and tip == 'kumas' else NESNE_TIP[tip]['bant']


def _nesne_ref(hizli=False):
    return float(np.max(np.abs(nota_ciz(62, 0.40, None, SR, np.random.default_rng(1), PIYANO, hizli))))


def nesne_cal(nesneler, rng, hizli=False):
    """Nesne seslerini çalar. Düzey: mp piyano notasının (D4, hız 0,40) kuru tepesine göre dB."""
    ref = _nesne_ref(hizli)
    N = kare_ornek(TOPLAM_KARE)
    kuru = np.zeros((2, N))
    for e in nesneler:
        y = kaynak_ciz(f'nesne.{e["tip"]}', dict(nota=e.get('nota')), rng, hizli) * ref * 10 ** (e['db'] / 20)
        bas = kare_ornek(e['kare'])
        L = min(y.shape[1], N - bas)
        kuru[:, bas:bas + L] += y[:, :L]
    return kuru


def _yuksek_gecir(x, kesim_hz):
    L = len(x)
    nf = _fft_boy(L)
    fr = np.maximum(np.fft.rfftfreq(nf, 1 / SR), 1e-3)
    return np.fft.irfft(np.fft.rfft(x, nf) * (fr / kesim_hz) ** 2 / np.sqrt(1 + (fr / kesim_hz) ** 4), nf)[:L]


def nesne_duzeyle(nesneler, yatak, rng, hizli=False):
    """Her nesne sesinin düzeyini çevresindeki müziğe göre ayarlar (NESNE_FARK). Kendi bandında (NESNE_TIP bant) sesin ilk
    15 ms'si, müziğin sesten önceki 30 ms'siyle karşılaştırılır. nesneler yerinde güncellenir (db, db_ayar)."""
    ref = _nesne_ref(hizli)
    mono = yatak.mean(axis=0)
    bantli = {k: _yuksek_gecir(mono, k) for k in {nesne_bandi(e['tip']) for e in nesneler}}
    for e in nesneler:
        kesim = nesne_bandi(e['tip'])
        y = _yuksek_gecir(nesne_ciz(e['tip'], rng, e.get('nota')).mean(axis=0) * ref * 10 ** (e['db'] / 20), kesim)
        kendi = 10 * math.log10(np.mean(y[:int(0.015 * SR)] ** 2) + 1e-20)
        s = kare_ornek(e['kare'])
        once = bantli[kesim][max(0, s - int(0.030 * SR)):max(1, s - int(0.002 * SR))]
        yatak_db = 10 * math.log10(np.mean(once ** 2) + 1e-20)
        ayar = float(np.clip(yatak_db + NESNE_FARK[e['rol']] - kendi, 0.0, NESNE_EN_COK_DB))
        e['db_ayar'] = round(ayar, 1)
        e['db'] = round(e['db'] + ayar, 1)
    return nesneler


# =====================================================================================================
# DOKU KATMANI (v2): keman ambiyansları + keçe piyano dokusu; piyanodan türetilen nesne sesleri
# =====================================================================================================
def _yavas_gurultu(L, hz, rng):
    """hz hızında rastgele noktalar arası doğrusal: yavaş dalgalanma (vibrato hızı, perde kayması), ortalama 0, ±1."""
    n = max(2, int(L / SR * hz) + 2)
    return np.interp(np.arange(L), np.linspace(0, L, n), rng.uniform(-1, 1, n))


_GOVDE = {}


def keman_govde(teknik):
    """Keman gövdesi + teknik: frekans (Hz) → dB tablosu. Sordino köprü tepesini ve 2–5 kHz'i yumuşatır."""
    if teknik not in _GOVDE:
        f = np.arange(0.0, 12001.0, 5.0)
        db = np.zeros_like(f)
        for fr, g, q in KEMAN_GOVDE:
            db += g / (1 + ((f - fr) / (fr / q)) ** 2)
        fl = np.log2(np.maximum(f, 1.0))
        db -= KEMAN_TEKNIK[teknik]['sordino_db'] * np.exp(-0.5 * ((fl - math.log2(3200)) / 0.7) ** 2)
        db -= 24 * np.clip(fl - math.log2(4500), 0, None)
        db -= 12 * np.clip(math.log2(200) - fl, 0, None)
        _GOVDE[teknik] = (f, db)
    return _GOVDE[teknik]


def keman_cumle(notlar, teknik, pan, rng, hizli=False):
    """Legato keman cümlesi (yaylı tel modeli). notlar: [(kare, midi, süre_kare, hız, kayma_ms)]. Ardışık notalar
    (boşluk ≤ 2 kare) bağlanır: perde kısa (ya da kayma_ms kadar uzun) bir kaymayla değişir, yay değişiminde hafif çukur;
    daha uzun boşlukta yay kalkar. Vibrato her notada gecikmeyle (teknik 'gecikme' sn) başlar. Dönüş: (başlangıç örneği, (2, L))."""
    T = KEMAN_TEKNIK[teknik]
    fg, dbg = keman_govde(teknik)
    s0 = kare_ornek(notlar[0][0])
    R = int(T['birak_ms'] * SR / 1000)
    L = kare_ornek(notlar[-1][0] + notlar[-1][2]) - s0 + R
    f = np.zeros(L); A = np.zeros(L); vd = np.zeros(L)
    cf = int(0.05 * SR)
    sinir = [(kare_ornek(k) - s0, kare_ornek(k + d) - s0) for k, _, d, _, _ in notlar]
    for i, (k, m, d, v, kay) in enumerate(notlar):
        a, e = sinir[i]
        bagli_once = i > 0 and a - sinir[i - 1][1] <= kare_ornek(2)
        bagli_sonra = i + 1 < len(notlar) and sinir[i + 1][0] - e <= kare_ornek(2)
        f0 = 440.0 * 2 ** ((m - 69) / 12)
        f[a:] = f0
        if bagli_once:
            g = max(cf, int(kay * SR / 1000))
            f_once = 440.0 * 2 ** ((notlar[i - 1][1] - 69) / 12)
            u = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, g))
            j1 = min(L, a + g)
            f[a:j1] = f_once * (f0 / f_once) ** u[:j1 - a]
        # Genlik penceresi: yükseliş (atak ya da bağ), içte hafif şişme (messa di voce), iniş (bırakış ya da bağ)
        rise = cf if bagli_once else int(T['atak_ms'] * SR / 1000)
        fall = cf if bagli_sonra else R
        r0 = a - cf // 2 if bagli_once else a
        w = np.zeros(L)
        j0, j1 = max(0, r0), min(L, r0 + rise)
        w[j0:j1] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, rise))[j0 - r0:j1 - r0]
        e0 = e - cf // 2 if bagli_sonra else e
        w[j1:max(j1, e0)] = 1.0
        k0, k1 = max(0, e0), min(L, e0 + fall)
        if k1 > k0:
            w[k0:k1] = (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fall)))[:k1 - k0]
        if e > a:
            u = np.clip((np.arange(L) - a) / (e - a), 0, 1)
            w *= 0.82 + 0.18 * np.sin(np.pi * u)
        A += (v ** 1.6) * w
        # Geç vibrato: notanın başından 'gecikme' sn sonra 0,3 sn'de açılır
        vb = a + int(T['gecikme'] * SR)
        if vb < e:
            ramp = np.clip((np.arange(L) - vb) / (0.3 * SR), 0, 1)
            sec = slice(a, min(L, (sinir[i + 1][0] if i + 1 < len(notlar) else L)))
            vd[sec] = np.maximum(vd[sec], T['vib'] * ramp[sec])
    # Bağlarda yay değişimi: kısa, hafif çukur
    for i in range(1, len(notlar)):
        a = sinir[i][0]
        if a - sinir[i - 1][1] <= kare_ornek(2):
            j0, j1 = max(0, a - cf // 2), min(L, a + cf // 2)
            A[j0:j1] *= 1 - 0.15 * np.sin(np.linspace(0, np.pi, j1 - j0))
    hiz = 5.4 + 0.35 * _yavas_gurultu(L, 1.5, rng)
    vib = vd * np.sin(2 * np.pi * np.cumsum(hiz) / SR + rng.uniform(0, 2 * np.pi))
    kayma = 0.0009 * _yavas_gurultu(L, 0.7, rng)
    fi = f * (1 + vib) * (1 + kayma)
    faz = 2 * np.pi * np.cumsum(fi) / SR
    y = np.zeros(L)
    norm = 0.0
    f_ort = float(np.median(f[f > 0])) if np.any(f > 0) else 440.0
    H = 3 if hizli else T['harm']
    for n in range(1, H + 1):
        if n * f_ort > 5500:
            break
        an = n ** -T['egim']
        y += an * 10 ** (np.interp(n * fi, fg, dbg) / 20) * np.sin(n * faz + rng.uniform(0, 2 * np.pi))
        norm += (an * 10 ** (np.interp(n * f_ort, fg, dbg) / 20)) ** 2 / 2
    y /= math.sqrt(norm) + 1e-12
    # Çok az yay sürtmesi: geniş bantlı, yumuşak gürültü, genliği izler
    nz = rng.standard_normal(L)
    fr = np.fft.rfftfreq(L, 1 / SR)
    nz = np.fft.irfft(np.fft.rfft(nz) * np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / 2200) / 1.0) ** 2), L)
    nz /= np.sqrt(np.mean(nz ** 2)) + 1e-12
    y = (y + nz * 10 ** (T['nefes_db'] / 20)) * A * 0.1
    return s0, np.vstack([y * math.cos((pan + 1) * math.pi / 4), y * math.sin((pan + 1) * math.pi / 4)])


def keman_pizz(m, v, pan, rng):
    """Yumuşak pizzicato (parmakla, sordino gövdesi): kısmiler tize doğru hızlı söner, 3 ms yumuşak atak."""
    fg, dbg = keman_govde('sordino')
    f0 = 440.0 * 2 ** ((m - 69) / 12)
    L = int(0.8 * SR)
    t = np.arange(L) / SR
    y = np.zeros(L)
    for n in range(1, 13):
        fn = n * f0
        if fn > 5000:
            break
        a = abs(math.sin(n * math.pi * 0.2)) / n ** 1.3
        tau = 0.5 / (1 + 0.35 * (n - 1)) * (440.0 / f0) ** 0.3
        y += a * 10 ** (np.interp(fn, fg, dbg) / 20) * np.exp(-t / tau) * np.sin(2 * np.pi * fn * t + rng.uniform(0, 2 * np.pi))
    La = int(0.003 * SR)
    y[:La] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, La))
    y /= np.sqrt(np.mean(y[:int(0.15 * SR)] ** 2)) + 1e-12
    y *= 0.14 * v ** 1.6
    return np.vstack([y * math.cos((pan + 1) * math.pi / 4), y * math.sin((pan + 1) * math.pi / 4)])


# =====================================================================================================
# SES KAYNAKLARI (v12a): her çalgı bir "ses kaynağı"dır; 'sentez' (numpy) ya da 'ornek' (örnek çalıcı) olarak seçilir.
# Aynı nota çizelgesi (olaylar: kare, calgi, m, hiz, sure, pan, ...) iki yolla da çalınır. Seçim: --kaynak, --kaynak-calgi.
# Örnek yoksa ya da okunamazsa çalgı sentezle çalar ve bu, cizelge "kaynak" raporuna yazılır.
# =====================================================================================================
KAYNAK_SECIMI = {'*': 'sentez'}               # çalgı adı ya da öneki ('davul', 'tokmak.kalimba') → 'sentez' | 'ornek'
KAYNAK_RAPOR = {}                             # çalgı → istenen kaynak, kaç olay örnekle / sentezle çaldı, nedenler (cizelge)
ORNEK_MODUL = Path(__file__).resolve().parent / 'ornek-calici.py'   # B yolu: örnek çalıcı (CC0 kütüphane, yerel kök)
ORNEK = None          # ornek-calici FilmKaynagi; main kurar (--kutuphane ya da OKTOS_SES_KUTUPHANE)
ORNEK_MOD = None      # ornek-calici modülü
# ornek-calici.FILM_ESLEME'de olmayan film çalgıları → (örnek çalgı, artikülasyon)
EK_ESLEME = {'keman.flautando': ('keman_grubu', 'sus'), 'keman.sordino': ('keman_grubu', 'sus'), 'keman.karsi': ('keman_grubu', 'sus'),
             'keman.pizz.doku': ('keman_grubu', 'pizz')}
ESLEM_DB = {}         # çalgı → örneğin düzeyi sentezdekine eşitlenirken uygulanan kazanç (dB): A/B'de yalnız tını değişir
ORNEK_OKTAV = {}      # çalgı → örnek aralığı dışında kalıp bir oktav kaydırılarak çalınan olay sayısı
ORNEK_HIZ = {'piyano.tema': 0.85}          # örnek katmanı seçimi: keçe temada daha yumuşak katman


def kaynak_turu(calgi):
    """Çalgının istenen kaynağı: tam ad, sonra önekler (davul.firca → davul), sonra '*'."""
    parcalar = calgi.split('.')
    for i in range(len(parcalar), 0, -1):
        ad = '.'.join(parcalar[:i])
        if ad in KAYNAK_SECIMI:
            return KAYNAK_SECIMI[ad]
    return KAYNAK_SECIMI.get('*', 'sentez')


def ornek_kur(kutuphane):
    """scripts/ornek-calici.py'yi yükler (dosya adında tire: importlib) ve köprüsünü kurar. Kütüphane kökü argüman ya da
    OKTOS_SES_KUTUPHANE (repoya yerel yol yazılmaz)."""
    global ORNEK, ORNEK_MOD
    import importlib.util
    spec = importlib.util.spec_from_file_location('ornek_calici', ORNEK_MODUL)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    ORNEK_MOD = mod
    ORNEK = mod.FilmKaynagi(kutuphane or None, sr=SR, fps=FPS)
    return ORNEK


def _ornek_var(calgi):
    if ORNEK is None:
        return False
    if calgi in EK_ESLEME:
        try:
            return bool(ORNEK.calgi(EK_ESLEME[calgi][0]).gruplar)
        except (OSError, ValueError):
            return False
    try:
        return bool(ORNEK.var_mi(calgi))
    except (OSError, ValueError):
        return False


def _ornek_ciz(calgi, olay):
    if calgi in EK_ESLEME:
        ad, artik = EK_ESLEME[calgi]
        sure = olay['birak'] / SR if olay.get('birak') is not None else olay.get('sure', 24) / FPS
        return ORNEK.calgi(ad).cal(olay['m'], float(olay.get('hiz', 0.5)), sure, artik=artik, rr_tohum=olay.get('kare'),
                                   sustur=bool(olay.get('sustur')))
    return ORNEK.ciz(calgi, olay)


def _ornek_ciz_oktavli(calgi, olay):
    """Örnek aralığı dışındaki nota bir (gerekirse iki) oktav kaydırılarak çalınır; sayısı raporlanır."""
    try:
        return _ornek_ciz(calgi, olay)
    except ValueError as e:
        m = olay.get('m')
        if m is None or 'aralık dışı' not in str(e):
            raise
        for d in (-12, 12, -24, 24):
            try:
                y = _ornek_ciz(calgi, dict(olay, m=m + d))
            except ValueError:
                continue
            ORNEK_OKTAV[calgi] = ORNEK_OKTAV.get(calgi, 0) + 1
            return y
        raise


def _kece_sonrasi(y):
    """Örnek piyanoya keçe karakteri: hafif alçak geçiren (2,6 kHz, 6 dB/okt + 6 kHz üstü 24 dB/okt) ve 6 ms yumuşak vuruş."""
    L = y.shape[1]
    f = np.fft.rfftfreq(L, 1 / SR)
    H = 1 / np.sqrt(1 + (f / 2600.0) ** 2) / np.sqrt(1 + (f / 6000.0) ** 8)
    y = np.vstack([np.fft.irfft(np.fft.rfft(y[c]) * H, L) for c in range(2)])
    a = min(L, int(0.006 * SR))
    y[:, :a] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
    return y


def _lp_sonrasi(fc, derece):
    """Örnek sonrası yumuşak alçak geçiren (derece 4: 12 dB/okt, 8: 24 dB/okt)."""
    def uygula(y):
        L = y.shape[1]
        f = np.fft.rfftfreq(L, 1 / SR)
        H = 1 / np.sqrt(1 + (f / fc) ** derece)
        return np.vstack([np.fft.irfft(np.fft.rfft(y[c]) * H, L) for c in range(2)])
    return uygula


# Örnek sonrası tını: tema keçe; keman grubu sordino gibi koyu (sentezdeki flautando/sordino karakteri, 2–5 kHz'i yormasın);
# parlak perküsyon (tef, alkış, zil) hafif yumuşatılır
TINI_SONRASI = {'piyano.tema': _kece_sonrasi,
                'keman.flautando': _lp_sonrasi(1500.0, 8), 'keman.sordino': _lp_sonrasi(1500.0, 8), 'keman.karsi': _lp_sonrasi(1500.0, 8),
                'ped.yayli': _lp_sonrasi(2200.0, 8), 'keman.pizz': _lp_sonrasi(2000.0, 4), 'keman.pizz.doku': _lp_sonrasi(2000.0, 4),
                'davul.tef': _lp_sonrasi(4000.0, 4), 'davul.alkis': _lp_sonrasi(4000.0, 4), 'davul.zil': _lp_sonrasi(5000.0, 4)}
def _atak_rampasi(sn):
    def uygula(y):
        a = min(y.shape[1], int(sn * SR))
        y = y.copy()
        y[:, :a] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
        return y
    return uygula


def _zincir(*fl):
    def uygula(y):
        for f in fl:
            y = f(y)
        return y
    return uygula


def _zarf_duzle(y, kisa=0.008, uzun=0.2):
    """Uzun yaylı örneklerde vibrato/yay dalgalanmasını (genlik kıpırtısı) yumuşatır: kısa zarf uzun zarfa çekilir
    (kazanç 0,5–2). Tını aynı kalır; dalgalanma yoğun dokuda sahte "başlangıç" ve yorgunluk yapmaz."""
    e2 = y.mean(axis=0) ** 2 + 1e-12
    ek = np.sqrt(kutu(e2, max(1, int(kisa * SR))))
    eu = np.sqrt(kutu(e2, max(1, int(uzun * SR))))
    return y * np.clip(eu / ek, 0.33, 3.0)


for _c in ('keman.flautando', 'keman.sordino', 'keman.karsi'):
    TINI_SONRASI[_c] = _zincir(TINI_SONRASI[_c], _zarf_duzle)
TINI_SONRASI['ped.yayli'] = _zincir(_lp_sonrasi(2200.0, 8), _zarf_duzle, _atak_rampasi(0.6))  # yaylı ped: sentezdeki gibi yavaş atak
CEKIC_VURGUSU_DB = -10.0    # B: işaret notasındaki örnek piyanoya çekiç tıkırtısı (sentez piyanonun çekiç gürültüsü), notanın
                            # ilk 50 ms tepesine göre: gerçek kayıtların yoğun dokusunda başlangıç net kalsın


def _cekic_vurgusu(y, m, v):
    """Kısa bant geçiren gürültü (merkez 5·f0, 0,9–3,2 kHz; 2,5–6,5 ms sönüm): nota_ciz'in çekiç bileşeni."""
    rng = np.random.default_rng(int(m) * 131 + int(v * 1000))
    Lh = min(y.shape[1], int(0.04 * SR))
    th = np.arange(Lh) / SR
    f0 = 440.0 * 2 ** ((m - 69) / 12)
    fh = min(3200.0, max(900.0, f0 * 5))
    X = np.fft.rfft(rng.standard_normal(Lh))
    fr = np.maximum(np.fft.rfftfreq(Lh, 1 / SR), 1)
    gur = np.fft.irfft(X * np.exp(-0.5 * (np.log2(fr / fh) / 0.9) ** 2), Lh)
    gur /= np.max(np.abs(gur)) + 1e-12
    gur *= np.exp(-th / (0.0025 + 0.004 * (1 - v))) * (1 - np.exp(-th / 0.0004))
    tepe = float(np.max(np.abs(y[:, :int(0.05 * SR)]))) if y.shape[1] else 0.0
    y = y.copy()
    y[:, :Lh] += gur * tepe * 10 ** (CEKIC_VURGUSU_DB / 20)
    return y


PIYANO_ORNEK_DAMPER_S = 0.07   # örnek piyanoda tuş bırakılınca (birak) sönüm: sentezdeki damper gibi kısa (örneğin kendi 0,3 s'si yerine)
KEMAN_ORNEK_EK_DB = -2.0   # örnek keman grubu 1 kHz bandında sentez flautandodan belirgin: doku içinde biraz geride (yalnız B)
KEMAN_ORNEK_ATAK = {'keman.flautando': 0.24, 'keman.karsi': 0.24, 'keman.sordino': 0.11}   # sentez tekniğinin atak süresi (s)
ORNEK_CAPA_TAVAN = 0.7     # ... ama en çok bu hıza (yüksek katman tepesi sınırlayıcıyı çalıştırmasın)
ORNEK_CAPA_HIZ = 1.4       # işaret karesindeki piyano notası örnekte bir katman parlak: başlangıç net duyulsun (yalnız B)
HIZALAMA_YOK = {'keman.flautando', 'keman.sordino', 'keman.karsi', 'ped.yayli', 'nefesli.flut', 'davul.zil', 'ped.analog'}
ORNEK_GECIKME = {}    # çalgı → örneklerin atak gecikmesi (ms; hizalanan), cizelge'de ortanca


def _atak_gecikmesi(y, kesim_hz=1000.0, ust_ms=120.0):
    """Örneğin "duyulan" başlangıcı: işaret doğrulamasının ölçeriyle aynı (kesim_hz üstü zarf, 3 ms RMS; sonraki 10 ms /
    önceki 12–2 ms basamağı; alçak bantta 8 ms, 12 / 20–4 ms). Örnek bu kadar erken başlatılır ki ölçülen başlangıç olay
    karesine otursun (sentezle aynı ölçek: BASLANGIC_SAPMA_MS). En çok 60 ms."""
    n = min(y.shape[1], int(ust_ms / 1000 * SR))
    if n < 64:
        return 0
    on = int(0.03 * SR)
    x = np.concatenate([np.zeros(on), y[:, :n].mean(axis=0)])
    f = np.maximum(np.fft.rfftfreq(len(x), 1 / SR), 1e-3)
    H = (f / kesim_hz) ** 2 / np.sqrt(1 + (f / kesim_hz) ** 4)
    yuk = np.fft.irfft(np.fft.rfft(x) * H, len(x))
    w_ms, ileri, geri, ara = (3, 10, 12, 2) if kesim_hz >= 1000 else (8, 12, 20, 4)
    h, w = SR // 1000, w_ms * SR // 1000
    c2 = np.concatenate([[0.0], np.cumsum(yuk ** 2)])
    son = np.arange(w, len(yuk), h)
    p = (c2[son] - c2[son - w]) / w + 1e-18
    cp = np.concatenate([[0.0], np.cumsum(p)])
    i_ = np.arange(len(p))
    a0, a1 = np.clip(i_ + 1, 0, len(p)), np.clip(i_ + 1 + ileri, 0, len(p))
    b0, b1 = np.clip(i_ - geri, 0, len(p)), np.clip(i_ - ara, 0, len(p))
    sonra = (cp[a1] - cp[a0]) / np.maximum(a1 - a0, 1)
    once = (cp[b1] - cp[b0]) / np.maximum(b1 - b0, 1)
    basamak = 10 * np.log10(np.maximum(sonra, 1e-18) / np.maximum(once, 1e-18))
    zaman_ms = son / SR * 1000 - on / SR * 1000 - BASLANGIC_SAPMA_MS[w_ms]
    gec = (zaman_ms > -5) & (i_ >= geri)
    i = int(np.argmax(np.where(gec, basamak, -1e9)))
    return int(np.clip(round(zaman_ms[i] / 1000 * SR), 0, int(0.06 * SR)))


def _denge(y, pan):
    """Stereo örneğe pan: görüntüyü bozmadan denge (tekleştirmeden)."""
    if abs(pan) < 1e-6:
        return y
    p = float(np.clip(pan, -1, 1))
    return np.vstack([y[0] * min(1.0, 1 - p), y[1] * min(1.0, 1 + p)])


def _rapor(calgi, kullanilan, neden=None):
    r = KAYNAK_RAPOR.setdefault(calgi, dict(istenen=kaynak_turu(calgi), ornek=0, sentez=0, nedenler=[]))
    r[kullanilan] += 1
    if neden and neden not in r['nedenler'] and len(r['nedenler']) < 3:
        r['nedenler'].append(neden)


def kaynak_ornekle(calgi, olay):
    """Olayı örnekle çizer (eşleme kazancı ve çalgı kazancı UYGULANMAMIŞ, pan uygulanmış); olmazsa ValueError/OSError."""
    v0 = float(olay.get('hiz', 0.5)) * ORNEK_HIZ.get(calgi, 1.0)
    if olay.get('capada') and calgi.startswith('piyano') and v0 < ORNEK_CAPA_TAVAN:
        v0 = min(ORNEK_CAPA_TAVAN, v0 * ORNEK_CAPA_HIZ)      # işaret notası bir katman parlak, ama tavanlı (sınırlayıcı çalışmasın)
    o2 = dict(olay, hiz=min(1.0, v0)) if abs(v0 - float(olay.get('hiz', 0.5))) > 1e-9 else olay
    y = np.asarray(_ornek_ciz_oktavli(calgi, o2), dtype=float)
    if calgi in TINI_SONRASI:
        y = TINI_SONRASI[calgi](y)
    if calgi.startswith('piyano') and olay.get('m') is not None and y.shape[1]:
        # Dinamik sentezle aynı: notanın tepesi planın hızına göre (PIYANO dinamik_db eğrisi); katman (tını) seçilen hızdan
        # gelir. Böylece A ile B'de yalnız tını değişir, dinamik ve denge (sınırlayıcı, doruk) aynı kalır.
        m_ = olay['m']
        hedef = 10 ** ((PIYANO['dinamik_db'] * (float(olay.get('hiz', 0.5)) - 1) - 0.18 * max(0, m_ - 72)) / 20)
        tepe = float(np.max(np.abs(y[:, :int(0.1 * SR)])))
        if tepe > 0:
            y = y * (hedef / tepe)
    if calgi.startswith('piyano') and olay.get('cekic') and olay.get('m') is not None:
        y = _cekic_vurgusu(y, olay['m'], float(o2.get('hiz', 0.5)))
    if calgi.startswith('piyano') and olay.get('birak') is not None:
        b, tau = int(olay['birak']), PIYANO_ORNEK_DAMPER_S
        if olay.get('ayni_tel') is not None and 0 < int(olay['ayni_tel']) < b:
            b, tau = int(olay['ayni_tel']), 0.02           # aynı tuş yeniden vurulur: önceki titreşim kesilir (aynı tel)
        if 0 < b < y.shape[1]:
            y = y.copy()
            y[:, b:] *= np.exp(-np.arange(y.shape[1] - b) / (tau * SR))
    if calgi not in HIZALAMA_YOK:
        g = _atak_gecikmesi(y, 300.0 if calgi in ALCAK_DAVUL or calgi == 'bas.kontrbas' else 1000.0)
        ORNEK_GECIKME.setdefault(calgi, []).append(round(g * 1000 / SR, 1))
        if g:
            y = y[:, g:].copy()
            f = min(y.shape[1], int(0.0005 * SR))
            y[:, :f] *= np.linspace(0, 1, f)
    return _denge(y, olay.get('pan', 0.0))


def kaynak_sentezle(calgi, olay, rng, hizli=False):
    y = SENTEZ[calgi](olay, rng, hizli)
    return _panla(y, olay.get('pan', 0.0)) if y.ndim == 1 else y


def kaynak_ciz(calgi, olay, rng, hizli=False):
    """Bir olayı çalgının seçili kaynağıyla çizer; dönüş (2, L), t=0'dan, pan ve çalgı kazancı uygulanmış. 'ornek' istenip
    örneği yoksa (ya da aralık dışıysa, okunamazsa) sentezle çalar; hepsi KAYNAK_RAPOR'a sayılır."""
    g = 10 ** (CALGI_DB.get(calgi, 0.0) / 20)
    if kaynak_turu(calgi) == 'ornek':
        if _ornek_var(calgi):
            try:
                y = kaynak_ornekle(calgi, olay)
                _rapor(calgi, 'ornek')
                return y * g * 10 ** (ESLEM_DB.get(calgi, 0.0) / 20)
            except (OSError, ValueError, KeyError) as e:
                _rapor(calgi, 'sentez', f'örnek çalınamadı: {str(e)[:120]}')
        else:
            _rapor(calgi, 'sentez', 'örneği yok (sentezde kalır)')
    else:
        _rapor(calgi, 'sentez')
    return kaynak_sentezle(calgi, olay, rng, hizli) * g


def _bant_payi(y, f0=2000.0, f1=5000.0):
    """(2–5 kHz enerjisi, toplam enerji): tek olayın tayfından (pay raporu için)."""
    x = y.mean(axis=0) if y.ndim == 2 else y
    X = np.abs(np.fft.rfft(x)) ** 2
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return float(X[(f >= f0) & (f < f1)].sum()), float(X.sum())


ORNEK_TINI = {}       # çalgı → örnek ve sentez 2–5 kHz payı (dB), eşleme kazancı, olay sayısı (cizelge)


def eslem_hesapla(isler, hizli=False, ciz_ornek=None, ciz_sentez=None):
    """Örnekle çalınacak çalgıların düzeyini sentezdekine eşitler (enerji, çalgı başına tek kazanç: örneklerin olaylar arası
    dinamiği korunur). isler: [(calgi, olay)]. ciz_*: (calgi, olay, rng) → (2, L) (cümleli keman için ayrı çizici).
    Aynı zamanda 2–5 kHz payını (örnek ve sentez) ORNEK_TINI'ye yazar."""
    rng = np.random.default_rng(TOHUM + 77)
    ciz_ornek = ciz_ornek or (lambda c, o: kaynak_ornekle(c, o))
    ciz_sentez = ciz_sentez or (lambda c, o, r: kaynak_sentezle(c, o, r, hizli))
    top = {}
    for calgi, olay in isler:
        if kaynak_turu(calgi) != 'ornek' or not _ornek_var(calgi):
            continue
        try:
            yo = ciz_ornek(calgi, olay)
        except (OSError, ValueError, KeyError):
            continue
        ys = ciz_sentez(calgi, olay, rng)
        t = top.setdefault(calgi, [0.0, 0.0, 0.0, 0.0, 0])
        b, a = _bant_payi(yo)
        t[0] += a; t[2] += b
        b, a = _bant_payi(ys)
        t[1] += a; t[3] += b
        t[4] += 1
    for calgi, (eo, es, bo, bs, n) in top.items():
        if eo > 0 and es > 0:
            ESLEM_DB[calgi] = float(np.clip(10 * math.log10(es / eo), -30.0, 30.0))
            ORNEK_TINI[calgi] = dict(olay=n, eslem_db=round(ESLEM_DB[calgi], 1),
                                     ornek_2_5k_db=round(10 * math.log10(bo / eo + 1e-20), 1),
                                     sentez_2_5k_db=round(10 * math.log10(bs / es + 1e-20), 1))


def _panla(y, pan):
    if y.ndim == 2:
        if abs(pan) < 1e-6:
            return y
        y = y.mean(axis=0)
    a = (float(np.clip(pan, -1, 1)) + 1) * math.pi / 4
    return np.vstack([y * math.cos(a), y * math.sin(a)])


# ---------------------------------------------------------------------------- sentez yardımcıları
def _hiz_g(v, aralik_db=20.0):
    return 10 ** ((float(v) - 1.0) * aralik_db / 20)


def _hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def _t(L):
    return np.arange(L) / SR


def _zarf(L, atak_s, tau_s, tutus_s=0.0):
    """Yükseltilmiş kosinüs atak + (tutuştan sonra) üstel sönüm."""
    t = _t(L)
    z = np.exp(-np.maximum(t - tutus_s, 0.0) / tau_s)
    La = min(L, max(2, int(atak_s * SR)))
    z[:La] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, La))
    return z


def _gurultu(L, rng, f_m, okt, lp=None, hp=None):
    """Logaritmik eksende Gauss bantlı gürültü (RMS 1); lp/hp: 24/12 dB/okt yumuşak kesim."""
    L = max(L, 16)
    X = np.fft.rfft(rng.standard_normal(L))
    f = np.maximum(np.fft.rfftfreq(L, 1 / SR), 1.0)
    H = np.exp(-0.5 * (np.log2(f / f_m) / (okt / 2)) ** 2)
    if lp:
        H = H / np.sqrt(1 + (f / lp) ** 4)
    if hp:
        H = H * (f / hp) ** 2 / np.sqrt(1 + (f / hp) ** 4)
    y = np.fft.irfft(X * H, L)
    return y / (np.sqrt(np.mean(y ** 2)) + 1e-12)


def _modlar(L, fs, taus, amps, kayma=None):
    """Sönümlü sinüsler sıfır evreden (tıkırtısız); kayma=(oran, tau): perde başta oran kadar yüksek, tau ile iner."""
    t = _t(L)
    y = np.zeros(L)
    for f, tau, a in zip(fs, taus, amps):
        if f >= 0.45 * SR:
            continue
        if kayma:
            oran, kt = kayma
            faz = 2 * np.pi * f * (t + oran * kt * (1 - np.exp(-t / kt)))
        else:
            faz = 2 * np.pi * f * t
        y += a * np.sin(faz) * np.exp(-t / tau)
    return y


def _lp(y, fc, derece=4):
    L = len(y)
    f = np.fft.rfftfreq(L, 1 / SR)
    return np.fft.irfft(np.fft.rfft(y) / np.sqrt(1 + (f / fc) ** derece), L)


def _tepe1(y):
    return y / (float(np.max(np.abs(y))) + 1e-12)


# ---------------------------------------------------------------------------- yumuşak davullar (hepsi 2–5 kHz'e cimri)
def s_kick(o, rng, hizli):
    """Tok, yumuşak kick: 98 → 52 Hz inen sinüs, 220 ms sönüm; tıkı 1,5 kHz altında."""
    v, L = o['hiz'], int(0.5 * SR)
    t = _t(L)
    f0 = 52.0
    y = np.sin(2 * np.pi * f0 * (t + 0.9 * 0.035 * (1 - np.exp(-t / 0.035)))) * np.exp(-t / 0.22)
    Lt = int(0.02 * SR)
    y[:Lt] += 0.10 * v * _gurultu(Lt, rng, 650, 1.4, lp=1500) * np.exp(-_t(Lt) / 0.004)
    return _tepe1(y * _zarf(L, 0.002, 99.0)) * _hiz_g(v)


def s_firca(o, rng, hizli):
    """Fırça trampet vuruşu: geniş ama koyu fısıltı (1,5 kHz merkez, 4 kHz üstü kesik) + trampet gövdesi."""
    v, L = o['hiz'], int(0.35 * SR)
    n = _gurultu(L, rng, 1500, 2.0, lp=3000 + 1500 * v) * _zarf(L, 0.003, 0.07)
    g = _modlar(L, [185.0, 330.0], [0.06, 0.04], [0.6, 0.3])
    return _tepe1(0.8 * n + 0.5 * g) * _hiz_g(v)


def s_supurme(o, rng, hizli):
    """Fırça süpürmesi: deri üstünde dairesel sürtme; süre boyunca şişip sönen koyu gürültü, 5 Hz dalgalanma."""
    v = o['hiz']
    T = max(0.1, o.get('sure', 22) / FPS)
    L = int((T + 0.08) * SR)
    t = _t(L)
    z = np.where(t < T, np.sin(np.pi * np.clip(t / T, 0, 1)) ** 1.5, 0.0)
    am = 1 + 0.25 * np.sin(2 * np.pi * 5.0 * t + rng.uniform(0, 2 * np.pi))
    return _tepe1(_gurultu(L, rng, 1100, 1.6, lp=3200) * z * am + 1e-9) * _hiz_g(v)


def s_shaker(o, rng, hizli):
    v, L = o['hiz'], int(0.15 * SR)
    return _tepe1(_gurultu(L, rng, 2400, 1.1, lp=5000, hp=1100) * _zarf(L, 0.012, 0.04)) * _hiz_g(v)


def s_rim(o, rng, hizli):
    v, L = o['hiz'], int(0.12 * SR)
    y = _modlar(L, [480.0, 1250.0, 2150.0], [0.03, 0.015, 0.008], [1.0, 0.45, 0.15])
    y += 0.25 * _gurultu(L, rng, 1500, 1.5, lp=4000) * np.exp(-_t(L) / 0.004)
    return _tepe1(_lp(y * _zarf(L, 0.0008, 99.0), 5000)) * _hiz_g(v)


def s_blok(o, rng, hizli):
    """Tahta blok: üç kip (1 : 2,57 : 4,1), kısa ve kuru."""
    v, L = o['hiz'], int(0.15 * SR)
    f = _hz(o.get('m') or 79)
    y = _modlar(L, [f, 2.57 * f, 4.1 * f], [0.07, 0.025, 0.012], [1.0, 0.3, 0.08])
    y += 0.12 * _gurultu(L, rng, 1.5 * f, 1.2, lp=4000) * np.exp(-_t(L) / 0.003)
    return _tepe1(_lp(y * _zarf(L, 0.0008, 99.0), 5000)) * _hiz_g(v)


def s_cerceve(o, rng, hizli):
    """Çerçeve davul (bodhrán benzeri): zar kipleri (1 : 1,59 : 2,14 : 2,65), başta hafif perde düşüşü, keçe tokmak."""
    v, L = o['hiz'], int(0.6 * SR)
    f = _hz(o.get('m') or 40)
    y = _modlar(L, [f, 1.59 * f, 2.14 * f, 2.65 * f], [0.28, 0.15, 0.09, 0.06], [1.0, 0.5, 0.3, 0.15], kayma=(0.12, 0.03))
    Lb = int(0.05 * SR)
    y[:Lb] += 0.25 * _gurultu(Lb, rng, 500, 1.5, lp=1500) * np.exp(-_t(Lb) / 0.008)
    return _tepe1(y * _zarf(L, 0.0015, 99.0)) * _hiz_g(v)


def s_alkis(o, rng, hizli):
    """El çırpma: üç kısa patlama (0, ~9, ~18 ms) + kuyruk; 1,3 kHz merkez, 4 kHz üstü yumuşak."""
    v, L = o['hiz'], int(0.25 * SR)
    t = _t(L)
    z = np.zeros(L)
    for t0 in (0.0, 0.009 + rng.uniform(-0.001, 0.001), 0.018 + rng.uniform(-0.001, 0.002)):
        z += np.where(t >= t0, np.exp(-np.maximum(t - t0, 0) / 0.004), 0.0)
    z += 0.6 * np.where(t >= 0.022, np.exp(-np.maximum(t - 0.022, 0) / 0.06), 0.0)
    return _tepe1(_gurultu(L, rng, 1300, 1.3, lp=4000) * z * _zarf(L, 0.0006, 99.0)) * _hiz_g(v)


def s_parmak(o, rng, hizli):
    """Parmak şıklatma: kısa, odaklı (2 kHz, 0,9 oktav) ve kuru."""
    v, L = o['hiz'], int(0.08 * SR)
    y = _gurultu(L, rng, 1900, 0.9, lp=4500) * _zarf(L, 0.0007, 0.012)
    y += 0.3 * _modlar(L, [1750.0], [0.02], [1.0])
    return _tepe1(y) * _hiz_g(v)


def s_tef(o, rng, hizli):
    """Tef: zilleri kısık (2,2–4,8 kHz rastgele kipler, 6 kHz üstü kesik), sallama gürültüsü; vurusta zar tokluğu."""
    v, L = o['hiz'], int(0.25 * SR)
    fs = rng.uniform(2200, 4800, 12)
    y = _modlar(L, fs, rng.uniform(0.05, 0.11, 12), np.full(12, 1 / 12))
    y += 0.25 * _gurultu(L, rng, 3200, 1.0, lp=6000) * np.exp(-_t(L) / 0.05)
    if o.get('vurus'):
        y += 0.5 * _modlar(L, [230.0, 410.0], [0.05, 0.03], [1.0, 0.4])
    return _tepe1(_lp(y * _zarf(L, 0.004, 99.0), 6000)) * _hiz_g(v)


def s_tom(o, rng, hizli):
    v, L = o['hiz'], int(0.7 * SR)
    f = _hz(o.get('m') or 45)
    y = _modlar(L, [f, 1.5 * f, 1.98 * f], [0.35, 0.18, 0.1], [1.0, 0.45, 0.2], kayma=(0.1, 0.06))
    Lb = int(0.03 * SR)
    y[:Lb] += 0.25 * _gurultu(Lb, rng, 1200, 1.5, lp=3000) * np.exp(-_t(Lb) / 0.005)
    return _tepe1(y * _zarf(L, 0.0012, 99.0)) * _hiz_g(v)


def s_timpani(o, rng, hizli):
    """Timpani: neredeyse harmonik tercih edilen kipler (1 : 1,5 : 1,74 : 2 : 2,24 : 2,49), uzun sönüm, keçe tokmak."""
    v, L = o['hiz'], int(3.2 * SR)
    f = _hz(o.get('m') or 38)
    y = _modlar(L, [f * r for r in (1.0, 1.504, 1.742, 2.0, 2.245, 2.494)], [2.0, 1.3, 1.0, 0.9, 0.7, 0.5],
                [1.0, 0.55, 0.3, 0.35, 0.2, 0.12], kayma=(0.02, 0.08))
    Lb = int(0.06 * SR)
    y[:Lb] += 0.3 * _gurultu(Lb, rng, 300, 1.5, lp=800) * np.exp(-_t(Lb) / 0.012)
    return _tepe1(y * _zarf(L, 0.003, 99.0)) * _hiz_g(v)


def s_zil(o, rng, hizli):
    """Yumuşak zil kabarması (tokmakla tremolo): uyumsuz kısmiler −4,5 dB/okt eğimle, 7 kHz üstü kesik; süre boyunca
    üstel kabarma (−26 dB'den 0'a), sonra 0,6 s sönüm."""
    v = o['hiz']
    T = max(0.2, o.get('sure', 96) / FPS)
    L = int((T + 1.6) * SR)
    t = _t(L)
    sayi = 24 if hizli else 48
    fs = np.exp(rng.uniform(np.log(350), np.log(7500), sayi))
    y = np.zeros(L)
    for f in fs:
        y += (f / 1000) ** -0.75 * np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi))
    y = y / (np.sqrt(np.mean(y ** 2)) + 1e-12) + 0.5 * _gurultu(L, rng, 4500, 1.5, lp=7000)
    z = np.where(t < T, np.exp((t - T) / (T / 3.0)), np.exp(-(t - T) / 0.6))
    z *= np.clip(t / 0.05, 0, 1)
    return _tepe1(_lp(y * z, 7000)) * _hiz_g(v)


# ---------------------------------------------------------------------------- pedler (dalga tablosu: ucuz ve temiz)
def _tablo_cal(tablo, f, L, rng, vib=0.0, vib_hz=5.0, kayma=0.0015):
    t = _t(L)
    ff = f * (1 + kayma * np.sin(2 * np.pi * 0.23 * t + rng.uniform(0, 2 * np.pi)))
    if vib:
        ff = ff * (1 + vib * np.clip((t - 0.3) / 0.6, 0, 1) * np.sin(2 * np.pi * vib_hz * t + rng.uniform(0, 2 * np.pi)))
    faz = (np.cumsum(ff) / SR + rng.uniform(0, 1)) % 1.0
    n = len(tablo)
    return np.interp(faz * n, np.arange(n + 1), np.append(tablo, tablo[0]))


def _testere_tablosu(f0, fc, f_tavan, govde=None, n_tablo=4096):
    K = max(1, int(min(f_tavan, 0.45 * SR) / f0))
    x = np.arange(n_tablo) / n_tablo
    tab = np.zeros(n_tablo)
    for n in range(1, K + 1):
        fn = n * f0
        a = (1.0 / n) / np.sqrt(1 + (fn / fc) ** 4)
        if govde:
            a *= govde(fn)
        tab += a * np.sin(2 * np.pi * n * x)
    return tab / (np.sqrt(np.mean(tab ** 2)) + 1e-12)


def _ped(o, rng, sesler, fc, f_tavan, atak, birak, vib=0.0, govde=None):
    f0 = _hz(o['m'])
    T = max(0.2, o.get('sure', 96) / FPS)
    L = int((T + birak + 0.05) * SR)
    tab = _testere_tablosu(f0, fc, f_tavan, govde)
    y = np.zeros((2, L))
    for cent, pan in sesler:
        s = _tablo_cal(tab, f0 * 2 ** (cent / 1200), L, rng, vib=vib)
        a = (pan + 1) * math.pi / 4
        y[0] += s * math.cos(a)
        y[1] += s * math.sin(a)
    t = _t(L)
    z = np.clip(t / atak, 0, 1)
    z = 0.5 - 0.5 * np.cos(np.pi * z)
    z *= np.where(t > T, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - T) / birak, 0, 1)), 1.0)
    y *= z * 0.25 / len(sesler) ** 0.5
    return y * _hiz_g(o['hiz'], 12.0)


def s_ped_analog(o, rng, hizli):
    """Sıcak analog ped: üç akortsuz testere (−7, 0, +6 sent), 900 Hz 24 dB/okt alçak geçiren, 0,5 s atak, 0,8 s bırakma."""
    return _ped(o, rng, [(-7, -0.5), (0, 0.0), (6, 0.5)], 900.0, 3000.0, 0.5, 0.8)


def s_ped_yayli(o, rng, hizli):
    """Yaylı ped: dört akortsuz testere, 2,2 kHz alçak geçiren, gövde tepeleri (450 Hz, 1,3 kHz), geç vibrato, 0,7 s atak."""
    def govde(f):
        return 1 + 0.4 * math.exp(-0.5 * (math.log2(f / 450) / 0.5) ** 2) + 0.3 * math.exp(-0.5 * (math.log2(f / 1300) / 0.4) ** 2)
    return _ped(o, rng, [(-9, -0.6), (-3, -0.2), (3, 0.2), (9, 0.6)], 2200.0, 4500.0, 0.7, 0.9, vib=0.0025, govde=govde)


# ---------------------------------------------------------------------------- tokmaklı ve telli (kipsel sentez)
def s_kalimba(o, rng, hizli):
    """Kalimba: temel + dil kısmisi (~5,95×) + zayıf 2×; başparmak tıkı; sustur=True: kısa (avuçla susturulmuş)."""
    v, f = o['hiz'], _hz(o['m'])
    sustur = bool(o.get('sustur'))
    tau = (0.14 if sustur else float(np.clip(1.1 * (440 / f) ** 0.3, 0.4, 1.6)))
    L = int(min(2.0, 6 * tau + 0.05) * SR)
    y = _modlar(L, [f, 2.0 * f, 5.95 * f], [tau, tau * 0.4, 0.07 if not sustur else 0.04], [1.0, 0.05, 0.18])
    Lb = int(0.01 * SR)
    y[:Lb] += 0.12 * _gurultu(Lb, rng, 1500, 1.4, lp=3500) * np.exp(-_t(Lb) / 0.0025)
    return _tepe1(y * _zarf(L, 0.0015, 99.0)) * _hiz_g(v)


def s_marimba(o, rng, hizli):
    v, f = o['hiz'], _hz(o['m'])
    tau = float(np.clip(0.5 * (440 / f) ** 0.5, 0.25, 1.2))
    L = int(min(2.0, 6 * tau) * SR)
    y = _modlar(L, [f, 3.93 * f, 9.2 * f], [tau, 0.15, 0.04], [1.0, 0.3, 0.06])
    Lb = int(0.01 * SR)
    y[:Lb] += 0.1 * _gurultu(Lb, rng, 900, 1.5, lp=1500) * np.exp(-_t(Lb) / 0.003)
    return _tepe1(y * _zarf(L, 0.002, 99.0)) * _hiz_g(v)


def s_glok(o, rng, hizli):
    """Glokenşpil (yumuşak tokmak): kipler 1 : 2,76 : 5,40, üst kipler hızlı söner, 1,5 ms yumuşak atak."""
    v, f = o['hiz'], _hz(o['m'])
    L = int(2.5 * SR)
    y = _modlar(L, [f, 2.756 * f, 5.404 * f], [1.4, 0.4, 0.12], [1.0, 0.2, 0.05])
    return _tepe1(y * _zarf(L, 0.0015, 99.0)) * _hiz_g(v)


def s_can(o, rng, hizli):
    """Çan (yumuşak): hum 0,5 – prime 1 – minör üçlü 1,183 – beşli 1,506 – nominal 2 …; m nominal perdedir."""
    v, f = o['hiz'], _hz(o['m']) / 2
    L = int(3.0 * SR)
    oran = [0.5, 1.0, 1.183, 1.506, 2.0, 2.514, 2.662]
    y = _modlar(L, [f * r for r in oran], [3.0, 2.0, 1.6, 1.3, 1.2, 0.6, 0.5], [0.35, 0.8, 0.4, 0.3, 1.0, 0.25, 0.15])
    return _tepe1(_lp(y * _zarf(L, 0.003, 99.0), 6000)) * _hiz_g(v)


def s_arp(o, rng, hizli):
    """Arp: koparma yeri 0,12 tarağı, harmonikler tize doğru hızlı söner; temel sönüm perdeyle (0,6–3 s)."""
    v, f = o['hiz'], _hz(o['m'])
    tau1 = float(np.clip(2.2 * (220 / f) ** 0.4, 0.6, 3.0))
    L = int(min(3.5, 5 * tau1) * SR)
    K = [n for n in range(1, 17) if n * f < 5000]
    amps = [abs(math.sin(math.pi * n * 0.12)) / n ** 1.6 for n in K]
    taus = [tau1 / (1 + 0.35 * (n - 1)) for n in K]
    y = _modlar(L, [n * f for n in K], taus, amps)
    return _tepe1(_lp(y * _zarf(L, 0.002, 99.0), 4500)) * _hiz_g(v)


def s_kontrbas(o, rng, hizli):
    """Kontrbas pizzicato: yuvarlak (koparma 0,18, 120 Hz gövde tepesi), sürenin sonunda parmakla susturulur."""
    v, f = o['hiz'], _hz(o['m'])
    T = max(0.08, o.get('sure', 20) / FPS)
    L = int((min(T, 1.6) + 0.12) * SR)
    t = _t(L)
    K = [n for n in range(1, 21) if n * f < 2500]
    y = np.zeros(L)
    for n in K:
        fn = n * f
        a = abs(math.sin(math.pi * n * 0.18)) / n ** 1.1 * (1 + 1.5 * math.exp(-0.5 * (math.log2(fn / 120) / 0.8) ** 2))
        y += a * np.sin(2 * np.pi * fn * t) * np.exp(-t / (0.85 / (1 + 0.6 * (n - 1))))
    Lb = int(0.04 * SR)
    y[:Lb] += 0.2 * _gurultu(Lb, rng, 180, 1.5, lp=500) * np.exp(-_t(Lb) / 0.01)
    y *= _zarf(L, 0.004, 99.0)
    y *= np.where(t > T, np.exp(-(t - T) / 0.05), 1.0)
    return _tepe1(y) * _hiz_g(v)


def s_flut(o, rng, hizli):
    """Flüt trili (balkonda kuş yerine): iki nota arasında ~11 Hz yumuşak geçişli tril, zayıf harmonikler, nefes."""
    v = o['hiz']
    f1, f2 = _hz(o['m']), _hz(o.get('m2', o['m'] + 2))
    T = max(0.15, o.get('sure', 36) / FPS)
    L = int((T + 0.1) * SR)
    t = _t(L)
    kare = (np.floor(t * o.get('tril_hz', 11.0) * 2) % 2)
    kare = kutu(kare, int(0.006 * SR))
    ff = (f1 + (f2 - f1) * kare) * (1 + 0.004 * np.sin(2 * np.pi * 5.0 * t))
    faz = 2 * np.pi * np.cumsum(ff) / SR
    y = np.sin(faz) + 0.25 * np.sin(2 * faz) + 0.1 * np.sin(3 * faz)
    y += 0.05 * _gurultu(L, rng, 2 * f1, 1.0, lp=5000)
    z = np.clip(t / 0.05, 0, 1) * np.where(t > T, np.exp(-(t - T) / 0.03), 1.0)
    return _tepe1(y * z) * _hiz_g(v)


def s_keman_pizz(o, rng, hizli):
    y = keman_pizz(o['m'], 1.0, o.get('pan', 0.0), rng)                     # mevcut yaylı pizzicato sentezi
    return y / (float(np.max(np.abs(y))) + 1e-12) * _hiz_g(o['hiz'])


SENTEZ = {
    'davul.kick': s_kick, 'davul.firca': s_firca, 'davul.supurme': s_supurme, 'davul.shaker': s_shaker, 'davul.rim': s_rim,
    'davul.blok': s_blok, 'davul.cerceve': s_cerceve, 'davul.alkis': s_alkis, 'davul.parmak': s_parmak, 'davul.tef': s_tef,
    'davul.tom': s_tom, 'davul.timpani': s_timpani, 'davul.zil': s_zil,
    'ped.analog': s_ped_analog, 'ped.yayli': s_ped_yayli,
    'tokmak.kalimba': s_kalimba, 'tokmak.marimba': s_marimba, 'tokmak.glok': s_glok, 'tokmak.can': s_can,
    'tel.arp': s_arp, 'bas.kontrbas': s_kontrbas, 'nefesli.flut': s_flut, 'keman.pizz': s_keman_pizz,
    # mevcut çalgılar da aynı arayüzden çalar (piyano, keçe/susturulmuş piyano)
    'piyano': lambda o, rng, hizli: nota_ciz(o['m'], o['hiz'], o.get('birak'), o['uzunluk_max'], rng, o.get('P', PIYANO), hizli,
                                             pan_ek=o.get('pan_ek', 0.0)),
}
for _ad in ('tema', 'kece', 'sustur', 'hazir'):
    SENTEZ[f'piyano.{_ad}'] = SENTEZ['piyano']
# Çalgı kazancı (dB, stem içi denge; stem düzeyi sahne başına ayrıca ayarlanır). Davullar hep geride, tiz ve tıkırtılılar en geride.
CALGI_DB = {'davul.kick': -4.0, 'davul.cerceve': -4.0, 'davul.tom': -4.0, 'davul.timpani': 0.0, 'davul.firca': -8.0,
            'davul.supurme': -13.0, 'davul.shaker': -16.0, 'davul.rim': -12.0, 'davul.blok': -10.0, 'davul.alkis': -11.0,
            'davul.parmak': -12.0, 'davul.tef': -17.0, 'davul.zil': -13.0,
            'bas.kontrbas': -2.0, 'tokmak.kalimba': -8.0, 'tokmak.marimba': -8.0, 'tokmak.glok': -16.0, 'tokmak.can': -11.0,
            'tel.arp': -8.0, 'ped.analog': -4.0, 'ped.yayli': -5.0, 'nefesli.flut': -15.0, 'keman.pizz': -6.0}
ALCAK_DAVUL = {'davul.kick', 'davul.cerceve', 'davul.tom', 'davul.timpani'}    # enerjisi 500 Hz altında
YAVAS_ATAK = {'ped.analog', 'ped.yayli', 'davul.zil', 'davul.supurme', 'nefesli.flut'}   # başlangıç doğrulamasına girmez
EQ_ORNEK_FARK = dict(alt_raf_db=-1.0, parlak_db=2.5, parlak_f=1800.0, parlak_okt=1.6)   # B yolu: örnek piyano daha koyu/dolgun
DAVUL_EQ = dict(EQ, sert_db=-6.0, sert_f=3500.0, sert_q=0.7, lp=7000.0)   # davul stem'i: 2–5 kHz'i yormasın
DAVUL_HEDEF_DB = {'s1-kafe': -20.0, 's2-atolye': -21.0, 's4-frp': -19.0, 's4b-hizli': -17.0, 's5-kalabalik': -18.0, 's6-final': -17.0}
FON_HEDEF_DB = {'s1-kafe': -14.0, 's2-atolye': -18.0, 's3-balkon': -13.0, 's4-frp': -17.0, 's4b-hizli': -17.0, 's6-final': -15.0}


def stem_adi(calgi):
    return 'davul' if calgi.startswith('davul.') else 'fon'


def olaylari_cal(olaylar, stem, rng, hizli=False):
    """Bir stem'in olaylarını seçili kaynaklarla çalar (kuru, (2, N))."""
    N = kare_ornek(TOPLAM_KARE)
    kuru = np.zeros((2, N))
    eslem_hesapla([(o['calgi'], o) for o in olaylar if stem_adi(o['calgi']) == stem], hizli)   # örnekliler: düzey sentezle eşit
    for o in olaylar:
        if stem_adi(o['calgi']) != stem:
            continue
        bas = kare_ornek(o['kare']) + int(round(o.get('ofset_ms', 0.0) * SR / 1000))
        if not 0 <= bas < N:
            continue
        y = kaynak_ciz(o['calgi'], o, rng, hizli)
        L = min(y.shape[1], N - bas)
        kuru[:, bas:bas + L] += y[:, :L]
    return kuru


# =====================================================================================================
# ORKESTRA DÜZENİ (v12a): ton/akor planının üstüne fon, doku ve yumuşak davullar. Olaylar işaretlerin ±3 karesinde
# başlamaz (yavaş ataklılar hariç), sessizlikte çalmaz. Bilinçli ostinatolar tekrar denetimine bildirilir.
# =====================================================================================================
def orkestra_kur(P, isaretler, D=None):
    S, V = SAHNELER, VURUSLAR
    CAPA, SUS = P['capa'], P['susturma']
    O, OST = [], []
    rng = np.random.default_rng(TOHUM + 21)

    nota_k = {p['kare'] for p in P['notalar']}

    def uygun(f, kendi=None, alcak=False):
        """f'te olay başlayabilir mi: işaretlerin ±3 karesinde değil (alçak davullar piyano notalı işaretlerde ±1: 1 kHz
        bandında başlangıç doğrulamasını bozmazlar), sessizlikte değil."""
        def pay(c):
            return 1 if alcak and c in nota_k else CAPA_YARICAP
        return (0 <= f < TOPLAM_KARE and all(abs(c - f) > pay(c) or c == f or c == kendi for c in CAPA)
                and not any(s - 3 <= f < e for s, e in SUS))

    def ekle(f, calgi, m=None, v=0.5, d=12, pan=0.0, et='', zorla=False, **ek):
        f = int(round(f))
        if not (0 <= f < TOPLAM_KARE) or any(s - 3 <= f < e for s, e in SUS):
            return False
        if not zorla and calgi not in YAVAS_ATAK and not uygun(f, alcak=calgi in ALCAK_DAVUL):
            return False
        O.append(dict(kare=f, calgi=calgi, m=None if m is None else midi(m), hiz=round(float(v), 3), sure=max(1, int(d)),
                      pan=round(float(pan), 2), etiket=et, **ek))
        return True

    def akor(f):
        sem = calan_akor(P['akorlar'], f)
        kok, aral, bas = akor_coz(sem)
        return sem, kok, aral, bas

    def ton4(f, kok_alt):
        """Akorun dört temel sesi kökten yukarı: [kök, 3'lü (ya da sus), 5'li, 7'li (yoksa 6'lı, yoksa oktav)]."""
        sem, kok, aral, _ = akor(f)
        a12 = [i % 12 for i in aral]
        uc = next((i for i in a12 if i in (3, 4, 5, 2)), 4)
        bes = next((i for i in a12 if i in (7, 6, 8)), 7)
        yedi = next((i for i in a12 if i in (10, 11, 9)), 12)
        r = kok_alt + (kok - kok_alt) % 12
        return [r, r + uc, r + bes, r + yedi]

    def ton4_pc(f):
        return [m % 12 for m in ton4(f, 0)]

    def isr(tur, sahne, anahtar=None):
        a_, b_ = S[sahne]
        return sorted(i['kare'] for i in isaretler if i['tur'] == tur and a_ <= i['kare'] <= b_
                      and (anahtar is None or anahtar in ek_metni(i)))

    def ped(a_, b_, calgi, lo, hi, v, et):
        """Akor dizisinden ped: her akor değişiminde ses yürütmeli 3–4 ses (lo–hi), akor bitene dek."""
        aks = [x for x in P['akorlar'] if a_ <= x['kare'] < b_]
        onceki = None
        for q, x in enumerate(aks):
            k1 = aks[q + 1]['kare'] if q + 1 < len(aks) else b_
            if k1 - x['kare'] < 12:
                continue
            kok, aral, _ = akor_coz(x['sembol'])
            pcs = [kok] + [(kok + i) % 12 for i in aral if i % 12 not in (0,)][:3]
            merkez = (lo + hi) / 2 if onceki is None else sum(onceki) / len(onceki)
            secim = []
            for pc in pcs:
                aday = [m for m in range(lo, hi + 1) if m % 12 == pc and m not in secim]
                if aday:
                    secim.append(min(aday, key=lambda m: abs(m - merkez)))
            onceki = secim or onceki
            for j, m in enumerate(sorted(secim)):
                ekle(x['kare'], calgi, m, v, k1 - x['kare'] + 6, pan=-0.4 + 0.8 * j / max(1, len(secim) - 1), et=f'{et} ({x["sembol"]})')

    def arpej(f0, adet, lo, ara=6, v=0.42, et='arp arpeji', calgi='tel.arp'):
        tonlar = []
        sem, kok, aral, _ = akor(f0)
        pcs = {kok} | {(kok + i) % 12 for i in aral}
        tonlar = [m for m in range(lo, lo + 40) if m % 12 in pcs][:adet]
        for j, m in enumerate(tonlar):
            ekle(f0 + j * ara, calgi, m, v * (1 - 0.02 * j), 40, pan=-0.5 + j / max(1, len(tonlar) - 1), et=et)

    # ------------------------------------------------------------------ KAFE: fırça trampet + kontrbas, hafif caz salınımı
    a, b = S['s1-kafe']
    dus_k = (isr('dusunce', 's1-kafe') or [b])[0]
    bulut_k = dus_k + 10
    son_m = None
    for q, f in enumerate(range(a + 48, b - 12, VURUS)):
        vno = ((f - a) // VURUS) % 4
        dus = f >= bulut_k
        ekle(f, 'davul.supurme', v=0.40 if not dus else 0.32, d=VURUS - 2, pan=0.2 if q % 2 else -0.2, et='kafe: fırça süpürmesi')
        if not dus and vno in (1, 3):
            ekle(f, 'davul.firca', v=0.5, d=6, pan=0.1, et='kafe: fırça vuruşu (2 ve 4)')
        if not dus and vno == 3:
            ekle(f + 16, 'davul.firca', v=0.3, d=4, pan=0.1, et='kafe: salınımlı ara vuruş (caz)')
        # kontrbas yürüyüşü: ölçü başında ve akor değişiminde bas, sonra akor sesleri, dördüncüde sonraki köke yaklaşma
        if dus and vno in (1, 3):
            continue
        sem, kok, aral, bas_pc = akor(f)
        degisti = sem != akor(f - VURUS)[0]
        if vno == 0 or degisti:
            hedef_pc = bas_pc
        elif vno == 3:
            _, _, _, sonraki = akor(f + VURUS)
            dz = dizi_pcs_bul(P['ton_har'], f)
            hedef_pc = (sonraki + (1 if (sonraki + 1) % 12 in dz else 2)) % 12 if q % 2 else (sonraki - 1) % 12
        else:
            ton = ton4_pc(f)
            hedef_pc = ton[2] if vno == 1 else (ton[1] if q % 3 else ton[0])
        aday = [m for m in range(28, 48) if m % 12 == hedef_pc]
        m = min(aday, key=lambda x: abs(x - (son_m if son_m is not None else 35)))
        if ekle(f, 'bas.kontrbas', m, v=0.55 if vno == 0 else 0.47, d=(2 * VURUS - 4) if dus else (VURUS - 4), pan=-0.05,
                et='kafe: kontrbas yürüyüşü' + (' (düşüncede yarım notalar)' if dus else '')):
            son_m = m
    # Fincan ve kaşık şıngırtısı: keçe piyanonun yerine yumuşak glokenşpil
    if D is not None:
        fincan = [p for p in D['piyano'] if p['etiket'] == 'kafe: fincan, kaşık']
        D['piyano'][:] = [p for p in D['piyano'] if p['etiket'] != 'kafe: fincan, kaşık']
        for p in fincan:
            ekle(p['kare'], 'tokmak.glok', min(p['m'], 93), 0.32, 8, pan=p['pan'], et='kafe: fincan şıngırtısı (glokenşpil)')

    # ------------------------------------------------------------------ ATÖLYE: tahta blok, shaker, cetvel tık-tak, susturulmuş kalimba ostinatosu
    a, b = S['s2-atolye']
    k8 = V.get('8', (a + 264, 0))[0]
    k_fikir = (isr('dusunce', 's2-atolye') or [V.get('9', (a + 596, 0))[0]])[0]
    s_son = min([s for s, e in SUS if k_fikir <= s <= b] or [b + 1])
    for f in range(a + 24, k8 - 6, VURUS):
        vno = ((f - a) // VURUS) % 4
        ekle(f, 'davul.blok', 84 if vno % 2 == 0 else 79, v=0.45 if vno == 0 else 0.38, d=4, pan=-0.25,
             et='atölye: cetvel tık-tak (tahta blok)')
    for f in range(a + 24, s_son - 12, 12):
        ara = ((f - a) // 12) % 2 == 1
        bolum = 0 if f < k8 else (1 if f < k_fikir else 2)
        if bolum > 0 and not ara:
            continue
        ekle(f, 'davul.shaker', v=(0.42 if ara else 0.30) - 0.04 * bolum, d=6, pan=0.3, et='atölye: shaker')
    desen = [(0, 0, 0.45), (36, 2, 0.38), (72, 1, 0.38), (84, 3, 0.32)]       # tresillo (3+3+2): kök, 5'li, 3'lü, 7'li
    k_ost = a + 96
    for o0 in range(k_ost, s_son - 24, 96):
        fikir = o0 >= k_fikir
        for ofs, idx, v in desen:
            f = o0 + ofs
            if f >= s_son - 12:
                break
            ton = ton4(f, 64)
            ekle(f, 'tokmak.kalimba', ton[idx], v, 10, pan=0.15, sustur=not fikir,
                 et='atölye fikir: kalimba açılır (çınlayan)' if fikir else 'atölye: susturulmuş kalimba ostinatosu')
    OST.append(dict(kare=[k_ost, s_son - 24], etiket='atölye: kalimba ostinatosu (tresillo, akorla değişir)'))

    # ------------------------------------------------------------------ BALKON: sıcak ped, arp arpejleri; güneşte çanlar; flüt trili
    a, b = S['s3-balkon']
    k12 = V.get('12', (a + 252, 0))[0]
    v_isik = (isr('vurgu', 's3-balkon', 'ışık') or [V.get('11', (a + 144, 0))[0] + 42])[0]
    v_gunes = (isr('vurgu', 's3-balkon', 'güneş') or [v_isik + 30])[0]
    v_sik = (isr('vurgu', 's3-balkon', 'sıkıl') or [b - 100])[0]
    dus_b = (isr('dusunce', 's3-balkon') or [None])[0]
    ped(a, b + 1, 'ped.analog', 52, 67, 0.5, 'balkon: sıcak ped')
    arpej(a + 8, 7, 55, 6, 0.40, 'balkon: ayna, arp arpeji')
    arpej(v_gunes + 5, 10, 55, 4, 0.46, 'balkon: güneş, geniş arp süpürmesi')
    for j, m in enumerate([79, 86, 83]):            # G5, D6, B5
        ekle(v_gunes + 26 + 12 * j, 'tokmak.can', m, 0.42 - 0.05 * j, 60, pan=0.4 - 0.4 * j, et='balkon: güneşte çanlar')
    for f, m1, m2, d, et in [(v_gunes + 70, 86, 88, 40, 'balkon: dışarıda kuş gibi flüt trili'),
                             (k12 + 22, 83, 84, 30, 'balkon: çiçeklerde flüt trili')] + \
                            ([(dus_b + 64, 86, 88, 36, 'balkon: düşte flüt trili')] if dus_b else []):
        if f < v_sik - 20:
            ekle(f, 'nefesli.flut', m1, 0.45, d, pan=0.55, m2=m2, tril_hz=11.0, et=et)
    if dus_b:
        for x in [x for x in P['akorlar'] if dus_b <= x['kare'] < v_sik]:
            arpej(x['kare'] + 4, 6, 60, 6, 0.36, f'balkon düş: umutlu arpej ({x["sembol"]})')

    # ------------------------------------------------------------------ FRP: pizzicato yaylılar, tef; zar atışında tom geçişi; çerçeve davul
    a, b = S['s4-frp']
    k_salla, k_atis = P['frp']['salla'], P['frp']['atis']
    k16 = V.get('16', (a + 264, 0))[0]
    k17 = V.get('17', (a + 504, 0))[0]
    for o0 in range(a, k_salla - 12, 96):
        for j, ofs in enumerate([0, 12, 36, 60, 72]):
            f = o0 + ofs
            if f >= k_salla - 8:
                break
            ton = ton4(f, 62)
            ekle(f, 'keman.pizz', ton[[0, 2, 1, 3, 2][j]], 0.5 if ofs in (0, 36) else 0.42, 6, pan=0.3 if j % 2 else -0.2,
                 et='FRP sohbet: pizzicato yaylılar')
        for ofs in (0, 48):
            f = o0 + ofs
            if f < k_salla - 8:
                _, _, _, bas_pc = akor(f)
                ekle(f, 'bas.kontrbas', 28 + (bas_pc - 28) % 12, 0.5, 20, pan=-0.05, et='FRP sohbet: kontrbas')
    for f in range(a, k_salla - 6, VURUS):
        if ((f - a) // VURUS) % 4 in (1, 3):
            ekle(f, 'davul.tef', v=0.42, d=8, pan=0.35, et='FRP sohbet: tef (2 ve 4)')
    for j, (ofs, m) in enumerate([(-18, 'C3'), (-12, 'A2'), (-6, 'F2'), (0, 'D2')]):
        ekle(k_atis + ofs, 'davul.tom', m, 0.42 + 0.07 * j, 8, pan=-0.3 + 0.2 * j, et='zar atışı: küçük tom geçişi')
    dilek = isr('konusma', 's4-frp')
    ilk = next((k for k in dilek if k16 <= k < k17), k16)
    d17 = next((k for k in isr('dusunce', 's4-frp') if k >= k17), k17 + 6)
    v_tas = next((k for k in isr('vurgu', 's4-frp') if k > d17), b - 48)
    o0 = a + ((ilk - a) // VURUS) * VURUS
    while o0 < v_tas - 6:
        for ofs, v, m, et in [(0, 0.50, 'E2', 'vurgu'), (36, 0.34, 'B2', 'ara'), (48, 0.44, 'E2', 'üç'), (72, 0.40, 'E2', 'dört'),
                              (84, 0.28, 'B2', 'ara')]:
            if o0 + ofs >= ilk and o0 + ofs < v_tas - 6:
                ekle(o0 + ofs, 'davul.cerceve', m, v, 8, pan=0.1, et='FRP kanon: çerçeve davul')
        o0 += 96

    # ------------------------------------------------------------------ HIZLI GEÇİŞLER: parmak şıklatma, el çırpma, yumuşak kick nabzı, parlak kalimba
    if 's4b-hizli' in S:
        a, b = S['s4b-hizli']
        kes = isr('kesme', 's4b-hizli') or [a]
        for f in range(a, b - 6, VURUS):
            vno = ((f - a) // VURUS) % 4
            cekim = sum(1 for k in kes if k <= f)
            ekle(f, 'davul.kick', v=0.5 if vno == 0 else 0.42, d=8, et='hızlı: yumuşak kick nabzı')
            if vno == 1 or (vno == 3 and cekim <= 1):
                ekle(f, 'davul.parmak', v=0.45, d=4, pan=-0.3, et='hızlı: parmak şıklatma')
            if vno == 3 and cekim >= 2:
                ekle(f, 'davul.alkis', v=0.42, d=6, pan=0.25, et='hızlı: el çırpma')
        for j, f in enumerate(range(a + 6, b - 6, 12)):
            ton = ton4(f, 72)
            ekle(f, 'tokmak.kalimba', ton[[0, 1, 2, 3, 2, 1][j % 6]], 0.36, 10, pan=0.25, et='hızlı: parlak kalimba')

    # ------------------------------------------------------------------ KALABALIK: katmanlanan perküsyon, büyüyen trampet geçişi
    a, b = S['s5-kalabalik']
    fik = isr('dusunce', 's5-kalabalik')
    vur5 = isr('vurgu', 's5-kalabalik')
    k_keske = (isr('vurgu', 's5-kalabalik', 'dilek') or vur5[:1] or [a + 216])[0]
    esik = [fik[i] if i < len(fik) else k_keske for i in (2, 6, 10)]
    for f in range(a + 24, k_keske - 8, 12):
        u = (f - a) / max(1, k_keske - a)
        if ((f - a) // 12) % 2 == 1 or f >= esik[0]:
            ekle(f, 'davul.shaker', v=0.30 + 0.12 * u, d=6, pan=0.3, et='kalabalık: shaker (1. katman)')
        vno = ((f - a) // VURUS) % 4
        if (f - a) % VURUS == 0:
            if f >= esik[0] and vno in (0, 2):
                ekle(f, 'davul.cerceve', 'E2', 0.38 + 0.15 * u, 8, et='kalabalık: çerçeve davul (2. katman)')
            if f >= esik[1] and vno in (1, 3):
                ekle(f, 'davul.alkis', v=0.32 + 0.12 * u, d=6, pan=-0.25, et='kalabalık: el çırpma (3. katman)')
        elif f >= esik[2]:
            ekle(f, 'davul.rim', v=0.3 + 0.1 * u, d=4, pan=0.2, et='kalabalık: rim (4. katman)')
    gecis_bas = k_keske - 72
    f, ara = gecis_bas, 12.0
    while f < k_keske - 6:
        u = (f - gecis_bas) / 72
        ekle(f, 'davul.firca', v=0.32 + 0.3 * u, d=4, pan=0.05, et='kalabalık: büyüyen trampet geçişi')
        ara = 12.0 if u < 0.4 else (6.0 if u < 0.8 else 4.0)
        f = int(round(f + ara))
    ekle(k_keske, 'davul.cerceve', 'E2', 0.55, 12, et='"Keşke": hep birlikte vuruş', zorla=True)

    # ------------------------------------------------------------------ FİNAL: logoya giderken zil kabarması; doruğa timpani; sakin çözülme
    a, b = S['s6-final']
    doruk, kadans = P['final']['doruk'], P['final'].get('kadans') or b - 72
    gruplar = P['final'].get('gruplar') or []
    ilk_g = gruplar[0] if gruplar else a + 48
    for f in range(a + ((ilk_g - a) // VURUS) * VURUS, doruk - 12, VURUS):
        if f >= ilk_g:
            u = (f - ilk_g) / max(1, doruk - ilk_g)
            ekle(f, 'davul.cerceve', 'E2', 0.30 + 0.18 * u, 8, et='final: logo kurulur, yumuşak nabız')
    zb = max(a + 12, doruk - 192)
    ekle(zb, 'davul.zil', None, 0.62, doruk - zb, et='final: logoya giderken zil kabarması', zorla=True)
    ekle(doruk, 'davul.timpani', 'D2', 0.78, 96, et='DORUK: timpani', zorla=True)
    ekle(kadans, 'davul.timpani', 'D2', 0.36, 96, et='kadans: yumuşak timpani (sakin çözülme)', zorla=True)
    ped(doruk, b + 1, 'ped.yayli', 50, 66, 0.45, 'final: yaylı ped, çözülme')
    tonlar = [62, 66, 69, 74, 76, 78, 81]          # D4 F#4 A4 D5 E5 F#5 A5 (Dadd9)
    for j, m in enumerate(tonlar):
        ekle(kadans + 8 + 9 * j, 'tel.arp', m, 0.36 - 0.015 * j, 60, pan=-0.5 + j / 6, et='kadans: sakin arp arpeji')

    O.sort(key=lambda o: (o['kare'], o['calgi']))
    ozet = {}
    for ad, (sa, sb) in S.items():
        say = {}
        for o in O:
            if sa <= o['kare'] <= sb:
                say[o['calgi']] = say.get(o['calgi'], 0) + 1
        if say:
            ozet[ad] = say
    return dict(olaylar=O, ostinato=OST, ozet=ozet)


def orkestra_karis(ORK, islak, ir, akt, notalar, susturma, hizli=False):
    """Orkestra stem'leri (davul, fon): çal, aynı odada yankı, EQ (davul daha yumuşak), sessizlikte sus, tema çalarken
    melodinin bölgesinde çekil; fon işaret notalarında doku gibi çekilir. Düzey sahne başına müziğin (K ağırlıklı)
    DAVUL_HEDEF_DB / FON_HEDEF_DB altına ayarlanır. islak'a 'davul' ve 'fon' eklenir (tema ayarına eşlik olarak girer)."""
    N = islak['muzik'].shape[1]
    ref = k_agirlikli(sum(islak.values()))
    sus = sus_zarfi(N, susturma)
    onemli = sorted({p['kare'] for p in notalar if p['parca'] in ('kesme', 'isaret')})
    bilgi = {}
    for stem, hedefler, E, ek in (('davul', DAVUL_HEDEF_DB, DAVUL_EQ, 31), ('fon', FON_HEDEF_DB, EQ, 32)):
        kuru = olaylari_cal(ORK['olaylar'], stem, np.random.default_rng(TOHUM + ek), hizli)
        if not np.any(kuru):
            continue
        w = eq_uygula(yanki_uygula(kuru, ir, YANKI['islak_db']), E) * sus
        if akt is not None:
            w = tema_cekil(w, akt)
        if stem == 'fon' or (stem == 'davul' and ORNEK is not None):
            w *= doku_zarfi(N, onemli, susturma)       # B: gerçek kayıtlı davul da işaret anlarında çekilir
        dk = k_agirlikli(w)
        kaz = {}
        for ad, hedef in hedefler.items():
            if ad not in SAHNELER:
                continue
            a, b = kare_ornek(SAHNELER[ad][0]), kare_ornek(SAHNELER[ad][1] + 1)
            em, ed = float(np.sum(ref[:, a:b] ** 2)), float(np.sum(dk[:, a:b] ** 2))
            if ed > 0 and em > 0:
                kaz[ad] = float(np.clip(hedef - 10 * math.log10(ed / em), -40.0, 30.0))
        w0 = w
        for tur in range(3):                      # sahne sınırında taşan kuyruklar (uzun örnekler) için iki düzeltme turu
            w = w0 * sahne_kazanci(N, kaz)
            dk = k_agirlikli(w)
            goreli = {}
            for ad in kaz:
                a, b = kare_ornek(SAHNELER[ad][0]), kare_ornek(SAHNELER[ad][1] + 1)
                goreli[ad] = 10 * math.log10(float(np.sum(dk[:, a:b] ** 2)) / float(np.sum(ref[:, a:b] ** 2)) + 1e-20)
            if all(abs(goreli[ad] - hedefler[ad]) <= 0.2 for ad in kaz) or tur == 2:
                break
            kaz = {ad: kaz[ad] + hedefler[ad] - goreli[ad] for ad in kaz}
        goreli = {ad: round(v, 1) for ad, v in goreli.items()}
        islak[stem] = w
        bilgi[stem] = dict(kazanc_db={k: round(v, 1) for k, v in kaz.items()}, goreli_db=goreli, hedef_db=hedefler)
    return bilgi


def _cumle_ornekle(calgi, notlar, pan):
    """Legato cümle örnekle: her nota ayrı örnek (sürekli artikülasyonun bırakışı bir sonrakine biner)."""
    s0 = kare_ornek(notlar[0][0])
    parca = []
    atak = KEMAN_ORNEK_ATAK.get(calgi, 0.0)
    for j, (k, m, d, v, _) in enumerate(notlar):
        y = kaynak_ornekle(calgi, dict(m=m, hiz=v, sure=d + 3, kare=k))
        if atak:                       # sentezdeki flautando/sordino gibi yavaş giriş; cümle içinde legato (kısa)
            y = _atak_rampasi(atak if j == 0 else 0.06)(y)
        parca.append((kare_ornek(k) - s0, y))
    L = max(o + y.shape[1] for o, y in parca)
    out = np.zeros((2, L))
    for o, y in parca:
        out[:, o:o + y.shape[1]] += y
    return s0, _denge(out, pan)


def kaynak_cumle(calgi, notlar, teknik, pan, rng, hizli=False):
    """Legato cümle (keman): sentezde tek cümle (kaymalar, vibrato, yay); örnekte keman grubu (sus) notaları, düzeyi
    sentezdekine eşitlenmiş (ESLEM_DB). Dönüş (başlangıç örneği, (2, L))."""
    g = 10 ** (CALGI_DB.get(calgi, 0.0) / 20)
    if kaynak_turu(calgi) == 'ornek':
        if _ornek_var(calgi):
            try:
                s0, y = _cumle_ornekle(calgi, notlar, pan)
                _rapor(calgi, 'ornek')
                return s0, y * g * 10 ** ((ESLEM_DB.get(calgi, 0.0) + KEMAN_ORNEK_EK_DB) / 20)
            except (OSError, ValueError, KeyError) as e:
                _rapor(calgi, 'sentez', f'örnek çalınamadı: {str(e)[:120]}')
        else:
            _rapor(calgi, 'sentez', 'örneği yok (sentezde kalır)')
    else:
        _rapor(calgi, 'sentez')
    s0, y = keman_cumle(notlar, teknik, pan, rng, hizli)
    return s0, y * g


SENTEZ['keman.pizz.doku'] = lambda o, rng, hizli: keman_pizz(o['m'], o['hiz'], o.get('pan', 0.0), rng)
for _tip in NESNE_TIP:
    SENTEZ[f'nesne.{_tip}'] = (lambda o, rng, hizli, _tip=_tip: nesne_ciz(_tip, rng, o.get('nota')))


def ses_haritasi(notalar, pedal, susturma):
    """Her kare için çalan (tuşta ya da pedalda) müzik notaları: dokunun akora uyması için."""
    H = [set() for _ in range(TOPLAM_KARE + 1)]
    for p in notalar:
        bk = min(TOPLAM_KARE, birakma_karesi(p, pedal, susturma))
        for f in range(max(0, p['kare']), bk):
            H[f].add(p['m'])
    return H


def doku_kur(P, isaretler, nesneler):
    """Sahne başına doku: keman ambiyansları (cümle, pizzicato) ve keçe piyano olayları; nesne seslerine perde verir.
    Bütün kareler işaretlerden ve vuruşlardan; doku notaları işaretlerin ±3 karesinde başlamaz (doğrulama ve flam)."""
    S, V = SAHNELER, VURUSLAR
    rng = np.random.default_rng(TOHUM + 11)
    H = ses_haritasi(P['notalar'], P['pedal'], P['susturma'])
    CAPA, SUS = P['capa'], P['susturma']
    PD, KM, PZ, PED, OST = [], [], [], [], []

    def uygun(f, kendi=None):
        return all(abs(c - f) > CAPA_YARICAP or c == f or c == kendi for c in CAPA)

    def sessizde(f):
        return any(s <= f < e for s, e in SUS)

    def dizi_pcs(f):
        return dizi_pcs_bul(P['ton_har'], f)        # v10: o anın tonu/modu (ton planı)

    def pcs(f):
        for g in range(min(f, TOPLAM_KARE), max(-1, f - 120), -1):
            if H[g]:
                return {m % 12 for m in H[g]}
        return dizi_pcs(f)

    def bas_nota(f):
        for g in range(min(f, TOPLAM_KARE), max(-1, f - 120), -1):
            if H[g]:
                return min(H[g])
        return midi('D2')

    def akor_tonu(f, lo, hi, yakin=None):
        aday = [m for m in range(lo, hi + 1) if m % 12 in pcs(f)] or [m for m in range(lo, hi + 1) if m % 12 in dizi_pcs(f)]
        if yakin is None:
            return int(rng.choice(aday))
        return min(aday, key=lambda m: (abs(m - yakin), m))

    def isr(tur, sahne, anahtar=None):
        a, b = S[sahne]
        return sorted(i['kare'] for i in isaretler if i['tur'] == tur and a <= i['kare'] <= b
                      and (anahtar is None or anahtar in ek_metni(i)))

    def pn(k, m, v, d, tur, pan, et, kendi=None):
        k = int(k)
        if 0 <= k < TOPLAM_KARE and uygun(k, kendi):
            PD.append(dict(kare=k, m=int(m), hiz=round(float(v), 3), sure=max(1, int(d)), tur=tur, pan=round(float(pan), 2), etiket=et))

    def cumle(bas, son, lo, hi, ritim, hiz, teknik, pan, et, ilk=None, yon=1, adimli=0.55):
        notlar, f, i = [], int(bas), 0
        on_ = int(KEMAN_TEKNIK[teknik]['atak_ms'] * FPS / 1000) + 3     # atak süresi + 3 kare
        m = ilk if ilk is not None else akor_tonu(f, lo, hi)
        while f < son - 3:
            d = int(min(ritim[i % len(ritim)], son - f))
            if notlar and any(-on_ <= f - c <= CAPA_YARICAP for c in CAPA):
                k0_, m0_, d0_, h0_, g0_ = notlar[-1]          # keman, ataklı yükselişi çapaya taşacak yerde yeni nota başlatmaz: bağlar
                notlar[-1] = (k0_, m0_, d0_ + d, h0_, g0_)
            else:
                notlar.append((f, int(m), d, float(hiz), 0))
            f += d
            i += 1
            if rng.random() < adimli:
                m2 = adim_yukari(m, dizi_pcs(f)) if yon > 0 else dizi_asagi(m, dizi_pcs(f))
            else:
                aday = [x for x in range(m - 5, m + 6) if x != m and x % 12 in pcs(f) and lo <= x <= hi]
                yonlu = [x for x in aday if (x - m) * yon > 0]
                m2 = min(yonlu or aday or [m], key=lambda x: abs(x - m))
            if not lo <= m2 <= hi:
                yon = -yon
                m2 = adim_yukari(m, dizi_pcs(f)) if yon > 0 else dizi_asagi(m, dizi_pcs(f))
            m = int(np.clip(m2, lo, hi))
            if rng.random() < 0.25:
                yon = -yon
        if notlar:
            KM.append(dict(teknik=teknik, pan=round(float(pan), 2), notlar=notlar, etiket=et))

    # ------------------------------------------------------------------ KAFE
    a, b = S['s1-kafe']
    k4 = V.get('4', (a + 108, 0))[0]
    k5 = V.get('5', (a + 240, 0))[0]
    kon = isr('konusma', 's1-kafe')
    dus_k = (isr('dusunce', 's1-kafe') or [k5 + 48])[0]
    sus_k = [(s, e) for s, e in SUS if a <= s <= b]
    son_k = min(b - 40, dus_k + 90)
    # Kalabalık uğultusu: üç keman (divisi), sordino, konuşma ritminde kısa ve birbirine karışan cümleler, sağa sola yayılmış;
    # yüz asılınca (sessizlik) yalnız biri kısık sürer; düşüncede kafe kâğıda doğru solarken söner
    for ses, (pan, lo, hi) in enumerate([(-0.55, 69, 79), (0.05, 71, 81), (0.55, 74, 84)]):
        f = a + 20 + ses * 9
        while f < son_k:
            ritim = [int(x) for x in rng.choice([6, 8, 10, 12, 16], int(rng.integers(3, 7)))]
            sure = sum(ritim)
            sessiz = any(s - 12 <= f <= e for s, e in sus_k)
            if not (sessiz and ses > 0):
                sol = 1.0 if f < k5 else max(0.0, 1 - (f - k5) / max(1, son_k - k5))
                hiz = (0.13 if sessiz else 0.21) * (0.4 + 0.6 * sol) * (1.0 - 0.08 * ses)
                if hiz >= 0.08:
                    cumle(f, f + sure, lo, hi, ritim, hiz, 'sordino', pan, 'kafe: kalabalık uğultusu (keman divisi)', yon=int(rng.choice([-1, 1])))
            f += sure + int(rng.integers(14, 40))
    # Fincan ve kaşık: seyrek, çok hafif tiz notalar (susturulmuş keçe piyano)
    f = a + 30
    while f < k5:
        pn(f, akor_tonu(f, 85, 93), 0.11, 3, 'sustur', rng.uniform(-0.6, 0.6), 'kafe: fincan, kaşık')
        f += int(rng.integers(45, 110))
    # Garsonun kahkahası: küçük tril (keçe)
    for k0 in [k4 - 30] + ([kon[1] + 32] if len(kon) > 1 else []):
        ust = akor_tonu(k0, 86, 90)
        for q in range(6):
            pn(k0 + 3 * q, ust if q % 2 == 0 else dizi_asagi(ust, dizi_pcs(k0)), 0.12 - 0.008 * q, 3, 'kece', 0.45, 'garson kahkahası: tril')

    # ------------------------------------------------------------------ ATÖLYE
    a, b = S['s2-atolye']
    k8 = V.get('8', (a + 264, 0))[0]
    k9 = V.get('9', (a + 596, 0))[0]
    # Atölye nabzı: susturulmuş bas tekrarları (keçe piyano), dörtlük; çalan akorun kökü (bilinçli ostinato: mekanik nabız)
    OST.append(dict(kare=[a + 12, k9 - 6], etiket='atölye nabzı (susturulmuş bas, dörtlük)'))
    f = a + 12
    while f < k9 - 6:
        if not sessizde(f):
            m = bas_nota(f)
            while m < 38:
                m += 12
            while m > 50:
                m -= 12
            pn(f, m, 0.16, 5, 'sustur', -0.1, 'atölye nabzı (susturulmuş bas)')
        f += VURUS
    t_kulp = (isr('tik', 's2-atolye', 'kulp') or [None])[0]
    t_day = (isr('tik', 's2-atolye', 'çekmece') or [None])[0]
    t_vida = (isr('tik', 's2-atolye', 'vida') or [None])[0]
    t_pit = isr('tik', 's2-atolye', 'pıt')
    # Çekmece açılışı: keman flautando glissando (kulptan dayanağa yumuşak kayış)
    if t_kulp is not None and t_day is not None and t_day - t_kulp > 20:
        KM.append(dict(teknik='flautando', pan=0.25, etiket='çekmece açılır: yumuşak glissando (keman)',
                       notlar=[(t_kulp + 4, midi('A4'), 6, 0.20, 0),
                               (t_kulp + 10, akor_tonu(t_day, 84, 88), t_day - t_kulp - 4, 0.22, (t_day - t_kulp - 16) * 1000 / FPS)]))
    # Vidalar yuvarlanır: inen pizzicato figürü (Re majör, giderek seyrek, sağa sola)
    if t_vida is not None:
        son_v = min(t_pit[0] if t_pit else t_vida + 60, t_vida + 60) - 5
        m, f, ara = akor_tonu(t_vida, 84, 88), t_vida + 8, 3.0   # +8: işaretin doğrulama penceresinin dışında
        while f < son_v and m >= 64:
            if uygun(f):
                PZ.append(dict(kare=int(f), m=int(m), hiz=round(0.30 - 0.10 * (f - t_vida) / max(1, son_v - t_vida), 3),
                               pan=round(float(rng.uniform(-0.45, 0.45)), 2), etiket='vidalar yuvarlanır: inen pizzicato'))
            m = dizi_asagi(m, dizi_pcs(f))
            ara *= 1.15
            f += int(round(ara))
    # Ölçü "pıt"ları: her parça susturulmuş bir nota, cetvel gibi yükselir (iki koşu: iki kenar)
    pitler = sorted((e for e in nesneler if e['tip'] == 'pit' and a <= e['kare'] <= b), key=lambda e: e['kare'])
    kosu, onceki = 0, None
    for e in pitler:
        if onceki is None or e['kare'] - onceki > 8:
            m = adim_yukari((midi('D5') if kosu == 0 else midi('B4')) - 1, dizi_pcs(e['kare']))   # dizideki ilk ses
            kosu += 1
        e['nota'] = nota_adi(m)
        m = adim_yukari(m, dizi_pcs(e['kare']))
        onceki = e['kare']

    # ------------------------------------------------------------------ BALKON
    a, b = S['s3-balkon']
    k11 = V.get('11', (a + 144, 0))[0]
    v_isik = (isr('vurgu', 's3-balkon', 'ışık') or [k11 + 42])[0]
    v_gunes = (isr('vurgu', 's3-balkon', 'güneş') or [k11 + 72])[0]
    v_sik = (isr('vurgu', 's3-balkon', 'sıkıl') or [b - 100])[0]
    # İçeride sakin, sıcak alt doku: keçe piyano, çalan akorun kökü ve beşlisi, yarım ölçüde bir, pedallı
    f = a
    while f < v_isik - 8:
        r = bas_nota(f)
        while r < 50:
            r += 12
        while r > 61:
            r -= 12
        pn(f, r, 0.15, 48, 'kece', -0.2, 'balkon: içeride sıcak alt doku')
        pn(f + 12, r + 7, 0.12, 36, 'kece', 0.2, 'balkon: içeride sıcak alt doku')
        PED.append((f, min(f + 47, v_isik - 1)))
        f += 48
    # Hava: uzun, yavaş şişip sönen tiz flautando çizgisi; güneş vurunca bir basamak yükselir; sıkılınca iner ve söner
    m1 = akor_tonu(v_isik, 79, 83)
    notlar = [(v_isik, m1, v_gunes - v_isik, 0.19, 0)]
    m, f, i = adim_yukari(m1, dizi_pcs(v_gunes)), v_gunes, 0
    uzun = [72, 96, 60, 108, 84, 96]
    while f < v_sik - 24:
        d = int(min(uzun[i % len(uzun)], v_sik - f))
        notlar.append((f, m, d, 0.22 if i == 0 else 0.18, 140 if i else 90))
        f += d
        i += 1
        aday = [x for x in range(m - 4, m + 5) if x != m and x % 12 in pcs(f) and 76 <= x <= 86]
        m = int(rng.choice(aday)) if aday else m
    notlar.append((v_sik, dizi_asagi(m, dizi_pcs(v_sik)), max(24, min(90, b - v_sik - 20)), 0.13, 160))
    KM.append(dict(teknik='flautando', pan=0.35, notlar=notlar, etiket='balkon: hava (flautando), güneşte bir basamak yükselir'))
    # Esinti: ikinci keman, alçakta aralıklı, yavaş şişip sönen uzun notalar (karşı yanda)
    f = v_gunes + 40
    while f < v_sik - 80:
        d = int(rng.integers(60, 90))
        KM.append(dict(teknik='flautando', pan=-0.35, notlar=[(f, akor_tonu(f, 69, 76), d, 0.15, 0)], etiket='balkon: esinti şişmesi'))
        f += d + int(rng.integers(40, 80))
    # Güneş: parıldayan yüksek arpej (keçe, pedallı), ışıltılarla eş: çıkıp iner
    tonlar = sorted({akor_tonu(v_gunes, lo, lo + 4) for lo in (78, 81, 84, 87)})
    desen = tonlar + tonlar[-2:0:-1]
    for q in range(10):
        k = v_gunes + 6 + 6 * q
        pn(k, desen[q % len(desen)], 0.13 - 0.006 * q, 10, 'kece', 0.5 * math.sin(q * 1.3), 'güneş: parıldayan arpej')
    PED.append((v_gunes, v_gunes + 80))

    # ------------------------------------------------------------------ FRP
    a, b = S['s4-frp']
    k16 = V.get('16', (a + 264, 0))[0]
    k17 = V.get('17', (a + 504, 0))[0]
    k_salla = P['frp']['salla']                  # partisyonla aynı kaynak (s4-frp.js + kaydir)
    # Sohbet: kısa, neşeli staccato kümeler (susturulmuş keçe)
    f = a + 8
    while f < k_salla - 10:
        m = akor_tonu(f, 74, 83)
        for q in range(int(rng.integers(2, 4))):
            pn(f + 3 * q, m, 0.13, 3, 'sustur', float(rng.uniform(-0.5, 0.5)), 'FRP sohbet: neşeli staccato')
            m = adim_yukari(m, dizi_pcs(f)) if rng.random() < 0.6 else dizi_asagi(m, dizi_pcs(f))
        f += int(rng.integers(16, 26))
    # "Keşke…" dileklerinin altında ölçülü bir keman çizgisi (flautando)
    cumle(k16 + 12, k17 - 6, 74, 83, [48, 36, 60, 48], 0.16, 'flautando', -0.3, 'FRP: dileklerin altında keman', yon=1, adimli=0.6)
    d17 = (isr('dusunce', 's4-frp') or [k17 + 6])[0]
    sonra = [v for v in isr('vurgu', 's4-frp') if v > d17]
    v_tas = sonra[0] if sonra else None
    v_rec = sonra[1] if len(sonra) > 1 else None
    # Dönen zarlar: hafif dönen arpej (keçe), taşa dek
    f, q = d17 + 12, 0
    son_d = v_tas if v_tas else b
    while f < son_d - 4:
        m = akor_tonu(f, [74, 78, 81, 78][q % 4], [74, 78, 81, 78][q % 4] + 3)
        pn(f, m, 0.11, 4, 'kece', 0.4 * math.sin(q * 0.9), 'dönen zarlar: arpej')
        f += 4
        q += 1
    if v_tas:
        pn(v_tas, akor_tonu(v_tas, 38, 45), 0.24, 30, 'sustur', -0.1, 'taş: tok alçak nota', kendi=v_tas)
    if v_rec:
        for q in range(6):
            k = v_rec + 14 + 6 * q
            pn(k, akor_tonu(k, 83 + q, 86 + q), 0.11 - 0.01 * q, 10, 'kece', 0.5 * math.cos(q), 'reçine: berrak tiz parıltı')
        PED.append((v_rec, b))
        if b - v_rec > 60:
            KM.append(dict(teknik='flautando', pan=0.3, notlar=[(v_rec + 20, akor_tonu(v_rec, 81, 86), b - v_rec - 30, 0.14, 0)],
                           etiket='reçine: havada keman'))

    # ------------------------------------------------------------------ HIZLI GEÇİŞLER (s4b)
    # Bahçe: yumuşak keman esintisi (flautando, iki uzun şişme) ve toprak için alçak, susturulmuş keçe tıklar (dikim ritminde);
    # QR çekimlerinde doku eklenmez (temiz küçük tıklar nesne sesi)
    if 's4b-hizli' in S:
        a, b = S['s4b-hizli']
        kes4b = isr('kesme', 's4b-hizli') or [a]
        bahce_son = kes4b[1] if len(kes4b) > 1 else a + 156
        if bahce_son - a > 100:
            m1 = akor_tonu(a + 6, 76, 81)
            KM.append(dict(teknik='flautando', pan=-0.3, etiket='bahçe: yumuşak keman esintisi',
                           notlar=[(a + 6, m1, 70, 0.17, 0), (a + 76, akor_tonu(a + 76, 74, 83, yakin=adim_yukari(m1, dizi_pcs(a + 76))), bahce_son - a - 84, 0.15, 140)]))
        f = a + 10
        while f < bahce_son - 8:
            pn(f, akor_tonu(f, 45, 52), 0.14, 4, 'sustur', float(rng.uniform(-0.3, 0.3)), 'bahçe: toprak tıkı (keçe)')
            f += int(rng.integers(12, 20))

    # ------------------------------------------------------------------ KALABALIK
    a, b = S['s5-kalabalik']
    vur5 = isr('vurgu', 's5-kalabalik')
    keske = (isr('vurgu', 's5-kalabalik', 'dilek') or vur5[:1] or [a + 210])[0]
    devir = next((v for v in vur5 if v > keske), b - 39)
    # Fikirlerin uğultusu: iki keman, sordino, kısa cümleler; "keşke"ye doğru sıklaşır
    for ses, (pan, lo, hi) in enumerate([(-0.5, 71, 81), (0.5, 74, 84)]):
        f = a + 40 + 13 * ses
        while f < keske - 20:
            u = (f - a) / max(1, keske - a)
            ritim = [int(x) for x in rng.choice([6, 8, 10, 12], int(rng.integers(3, 6)))]
            sure = min(sum(ritim), keske - 8 - f)
            if sure > 12:
                cumle(f, f + sure, lo, hi, ritim, 0.12 + 0.08 * u, 'sordino', pan, 'kalabalık: fikirlerin uğultusu (keman)',
                      yon=int(rng.choice([-1, 1])))
            f += sum(ritim) + int(rng.integers(int(30 - 18 * u), int(50 - 25 * u)))
    # Keşke: uğultu toplanır; üç keman akorun tonlarında bir araya gelir, şişip söner
    for ses, (pan, lo, hi) in enumerate([(-0.4, 74, 79), (0.0, 78, 83), (0.4, 81, 86)]):
        KM.append(dict(teknik='flautando', pan=pan, notlar=[(keske + 6, akor_tonu(keske + 6, lo, hi), max(24, min(60, devir - keske - 6)), 0.20, 0)],
                       etiket='keşke: uğultu toplanır'))

    # ------------------------------------------------------------------ FİNAL
    a, b = S['s6-final']
    gruplar = sorted(i['kare'] for i in isaretler if i['tur'] == 'tik' and a <= i['kare'] <= b and i.get('grup'))
    damla = sorted(i['kare'] for i in isaretler if i['tur'] == 'tik' and a <= i['kare'] <= b and i.get('ad') == 'slogan')
    # Logo inşası: çizgilerin oturuşlarına çok kısa yumuşak notalar (çizgi başına işaret yok: her gruba doğru sıklaşan ritim)
    onceki = a + 30
    for g in gruplar:
        f = onceki
        while f < g - 6:
            u = (f - onceki) / max(1, g - onceki)
            pn(f, akor_tonu(f, 74, 86), 0.10 + 0.04 * u, 3, 'sustur', float(rng.uniform(-0.6, 0.6)), 'logo: çizgi oturur')
            f += int(max(5, 18 - 12 * u + int(rng.integers(-2, 3))))
        onceki = g + 6
    # Kalabalık ekranda: logo tamamlanınca gülümseyip sıçrar → sıcak, kalabalık bir keman akoru (hep birlikte, ortadan dışa);
    # slogan oturunca yine sevinir → küçük bir şişme
    doruk_k = next((i['kare'] for i in isaretler if i['tur'] == 'vurgu' and i.get('ad') == 'doruk'), None)
    otur_k = next((i['kare'] for i in isaretler if i['tur'] == 'tik' and i.get('ad') == 'slogan-otur'), None)
    kadans_k = P['final'].get('kadans') if P['final'].get('slogan') is None else None
    if doruk_k is not None:
        for ses, (pan, lo, hi, gec) in enumerate([(0.0, 78, 81, 0), (-0.3, 74, 78, 3), (0.3, 81, 86, 3), (-0.6, 69, 74, 6), (0.6, 83, 88, 6)]):
            KM.append(dict(teknik='flautando', pan=pan, etiket='final: kalabalık sevinir (hep birlikte)',
                           notlar=[(doruk_k + 4 + gec, akor_tonu(doruk_k + 4, lo, hi), 66 - gec, 0.24, 0)]))
    if kadans_k is not None and b - kadans_k > 40:
        # Slogan yok: tam kadansta iki keman alçak ve sakin (tonik ve 3'lü), sona dek söner
        for pan, lo, hi in [(-0.35, 66, 71), (0.35, 73, 78)]:
            KM.append(dict(teknik='flautando', pan=pan, etiket='final: tam kadans, kemanlar sakin',
                           notlar=[(kadans_k + 3, akor_tonu(kadans_k + 3, lo, hi), b - kadans_k - 20, 0.15, 0)]))
    if otur_k is not None and b - otur_k > 50:
        for pan, lo, hi in [(-0.35, 74, 79), (0.35, 81, 86)]:
            KM.append(dict(teknik='flautando', pan=pan, etiket='final: slogan oturur, kalabalık yine sevinir',
                           notlar=[(otur_k + 3, akor_tonu(otur_k + 3, lo, hi), min(48, b - otur_k - 20), 0.18, 0)]))
    # Slogan damlaları: su damlası gibi yumuşak tiz yankı (keçe), damladan 6 kare sonra, bir oktav üstte (E6'yı aşmadan)
    muz = {p['kare']: p['m'] for p in P['notalar'] if 'slogan damlası' in p['etiket']}
    for j, k in enumerate(damla):
        m = muz.get(k, midi('A5'))
        pn(k + 6, m + 12 if m + 12 <= midi('E6') else m, 0.10, 8, 'kece', 0.5 if j % 2 else -0.5, 'slogan damlası: yankı')

    # ------------------------------------------------------------------ Karşı ezgi (v09): tema çalarken kemanlar
    # Temanın her ölçüsünde akorunun kılavuz sesi (3'lü ya da 7'li), melodinin altında (D4–A4), en yakın sesle bağlı
    # uzun notalar (flautando, pp–p): yalnız uğultu değil, temaya karşılık veren bir çizgi
    for yer in P.get('tema_yer', []):
        notlar, onceki = [], 66
        for o, f0, L in yer['olculer']:
            pcs_ = kilavuz_pcs(calan_akor(P['akorlar'], f0))     # v10: o anda çalan akorun kılavuz sesleri
            aday = [m for m in range(62, 72) if m % 12 in pcs_] or [onceki]
            m = min(aday, key=lambda x: (abs(x - onceki), x))
            onceki = m
            son_ = f0 + L if yer['son'] is None else min(f0 + L, yer['son'])
            if son_ - f0 > 12:
                notlar.append((f0, m, son_ - f0, 0.22, 120))
        if notlar:
            KM.append(dict(teknik='flautando', pan=-0.25, notlar=notlar, etiket=f'karşı ezgi: {yer["sahne"]}'))

    # ------------------------------------------------------------------ Nesne seslerine perde: çalan akorun en yakın tonu
    for e in nesneler:
        if e['tip'] in NESNE_SABIT_PERDE or 'nota' in e:
            continue
        taban = midi(NESNE_NOTA[e['tip']][0])
        aday = [m for m in range(taban - 5, taban + 7) if m % 12 in pcs(e['kare'])]
        e['nota'] = nota_adi(min(aday, key=lambda m: (abs(m - taban), m)) if aday else taban)

    PD.sort(key=lambda p: (p['kare'], p['m']))
    ozet = {}
    for ad, (sa, sb) in S.items():
        ozet[ad] = dict(piyano=sum(sa <= p['kare'] <= sb for p in PD), keman_cumle=sum(sa <= c['notlar'][0][0] <= sb for c in KM),
                        keman_nota=sum(len(c['notlar']) for c in KM if sa <= c['notlar'][0][0] <= sb),
                        pizzicato=sum(sa <= z['kare'] <= sb for z in PZ))
    return dict(piyano=PD, keman=KM, pizz=PZ, pedal=sorted(PED), ozet=ozet, ostinato=OST)


def doku_cal(D, rng, hizli=False):
    """Doku: (keçe piyano stem, keman stem) kuru. Keman düzeyi keçe piyanoya ayarlı (aynı hızda eşit RMS)."""
    N = kare_ornek(TOPLAM_KARE)
    piy = np.zeros((2, N))
    for p in D['piyano']:
        Pp = PIYANO_TURU[p['tur']]
        bas = kare_ornek(p['kare'])
        bk = p['kare'] + p['sure'] if p['tur'] == 'sustur' else birakma_karesi(p, D['pedal'], [])
        y = kaynak_ciz(f'piyano.{p["tur"]}', dict(m=p['m'], hiz=p['hiz'], birak=kare_ornek(bk) - bas, uzunluk_max=N - bas, P=Pp,
                                                   pan_ek=p['pan']), rng, hizli)
        L = min(y.shape[1], N - bas)
        piy[:, bas:bas + L] += y[:, :L]
    # Ayar: aynı hızda (0,2) keçe D5 ile keman D5'in RMS'i eşit olsun
    rp = nota_ciz(74, 0.2, None, SR, np.random.default_rng(1), PIYANO_KECE, hizli)[:, int(0.05 * SR):int(0.5 * SR)]
    _, rk = keman_cumle([(0, 74, 60, 0.2, 0)], 'flautando', 0.0, np.random.default_rng(2), hizli)
    olcek = float(np.sqrt(np.mean(rp ** 2)) / (np.sqrt(np.mean(rk[:, int(0.3 * SR):int(0.8 * SR)] ** 2)) + 1e-12))
    kem = np.zeros((2, N))

    def km_calgi(c):
        return 'keman.karsi' if c['etiket'].startswith('karşı ezgi') else f'keman.{c["teknik"]}'
    kemanlar = D['keman']
    if any(kaynak_turu(km_calgi(c)) == 'ornek' for c in kemanlar):
        # B: keman grubu örneği zaten bir grup; aynı perdeden üst üste binen ikinci tek-nota girişi (≤ 12 kare arayla)
        # birleşir (+3 dB ilkine): iki kaydın vibratosu birbirini dövüp genlik dalgalanması yapmasın
        tut, birlesik = [], {}
        for c in sorted(kemanlar, key=lambda c: c['notlar'][0][0]):
            if len(c['notlar']) == 1:
                k, m, d, v, gl = c['notlar'][0]
                es = next((t for t in tut if len(t['notlar']) == 1 and t['notlar'][0][1] == m
                           and 0 <= k - t['notlar'][0][0] <= 12 and km_calgi(t) == km_calgi(c)), None)
                if es is not None:
                    k0, m0, d0, v0, g0 = es['notlar'][0]
                    es['notlar'] = [(k0, m0, max(d0, k + d - k0), v0, g0)]
                    birlesik[id(es)] = birlesik.get(id(es), 1) + 1
                    continue
            tut.append(dict(c))
        for t in tut:
            if id(t) in birlesik:
                k0, m0, d0, v0, g0 = t['notlar'][0]
                t['notlar'] = [(k0, m0, d0, min(1.0, v0 * math.sqrt(birlesik[id(t)])), g0)]
        kemanlar = tut
    # örnekli keman (keman grubu): düzeyi cümle cümle sentezle eşit (çalgı başına tek kazanç)
    eslem_hesapla([(km_calgi(c), c) for c in kemanlar], hizli,
                  ciz_ornek=lambda cg, c: _cumle_ornekle(cg, c['notlar'], c['pan'])[1],
                  ciz_sentez=lambda cg, c, r: keman_cumle(c['notlar'], c['teknik'], c['pan'], r, hizli)[1])
    eslem_hesapla([('keman.pizz.doku', dict(m=z['m'], hiz=z['hiz'], pan=z['pan'], kare=z['kare'])) for z in D['pizz']], hizli)
    for c in kemanlar:
        s0, y = kaynak_cumle(km_calgi(c), c['notlar'], c['teknik'], c['pan'], rng, hizli)
        L = min(y.shape[1], N - s0)
        if L > 0:
            kem[:, s0:s0 + L] += y[:, :L] * olcek
    for z in D['pizz']:
        y = kaynak_ciz('keman.pizz.doku', dict(m=z['m'], hiz=z['hiz'], pan=z['pan'], kare=z['kare']), rng, hizli)
        s0 = kare_ornek(z['kare'])
        L = min(y.shape[1], N - s0)
        kem[:, s0:s0 + L] += y[:, :L] * olcek
    return piy, kem


def doku_zarfi(n_ornek, onemli, susturma):
    """Doku çekilmesi: önemli anlarda (kanca, işaret notaları) −6 dB (3 kare önce iner, 18 kare tutar, 18 karede döner);
    sessizlikte −10 dB (incelir, susmaz)."""
    g = np.zeros(n_ornek)                     # dB
    t = np.arange(n_ornek)
    for k in onemli:
        a0, a, b, c = (int(np.clip(kare_ornek(x), 0, n_ornek)) for x in (k - 6, k - 3, k + 18, k + 36))
        if a > a0:
            g[a0:a] = np.minimum(g[a0:a], DOKU_CEKIL_DB * (t[a0:a] - a0) / (a - a0))
        g[a:b] = np.minimum(g[a:b], DOKU_CEKIL_DB)
        if c > b:
            g[b:c] = np.minimum(g[b:c], DOKU_CEKIL_DB * (1 - (t[b:c] - b) / (c - b)))
    for s, e in susturma:
        a, b = kare_ornek(s), kare_ornek(e)
        g[a:b] = np.minimum(g[a:b], DOKU_SESSIZ_DB)
    g = kutu(g, kare_ornek(4))                              # yumuşat (tıkırtısız geçiş; kayan ortalama)
    return 10 ** (g / 20)


def sahne_kazanci(n_ornek, kazanc_db):
    """Sahne başına sabit kazanç (dB), sınırlarda 24 karelik yumuşak geçiş; sözlükte olmayan sahne 0 (sessiz)."""
    g = np.zeros(n_ornek)
    for ad, (a, b) in SAHNELER.items():
        if ad in kazanc_db:
            g[kare_ornek(a):kare_ornek(b + 1)] = 10 ** (kazanc_db[ad] / 20)
    return kutu(g, kare_ornek(24))


def tema_aktivite(notalar, n_ornek):
    """Tema çalıyor mu (0..1): tema notalarının tuş süresi + 0,3 sn, 50 ms yumuşak geçişle."""
    a = np.zeros(n_ornek)
    for p in notalar:
        if p['parca'] == 'tema':
            s0 = kare_ornek(p['kare'])
            a[s0:min(n_ornek, kare_ornek(p['kare'] + p['sure']) + int(0.3 * SR))] = 1.0
    return np.clip(kutu(a, int(0.05 * SR)), 0.0, 1.0)


def tema_cekil(x, akt):
    """Tema çalarken eşlik melodinin bölgesinde (TEMA_CEKIL çan süzgeci) çekilir: x + akt·(süzülmüş − x)."""
    N = x.shape[1]
    nf = _fft_boy(N)
    f = np.maximum(np.fft.rfftfreq(nf, 1 / SR), 1e-3)
    g = 10 ** (TEMA_CEKIL['db'] / 20)
    H = 1 + (g - 1) * np.exp(-0.5 * (np.log2(f / TEMA_CEKIL['f']) / (TEMA_CEKIL['genislik_okt'] / 2)) ** 2)
    y = np.vstack([np.fft.irfft(np.fft.rfft(x[c], nf) * H, nf)[:N] for c in range(x.shape[0])])
    return x + akt * (y - x)


def bant_enerji(x, f0, f1, maske):
    """[f0, f1] Hz bandının maske (0/1) altındaki toplam enerjisi (mono)."""
    m = x.mean(axis=0)
    N = len(m)
    nf = _fft_boy(N)
    fr = np.fft.rfftfreq(nf, 1 / SR)
    b = np.fft.irfft(np.fft.rfft(m, nf) * ((fr >= f0) & (fr <= f1)), nf)[:N]
    return float(np.sum((b * maske) ** 2))


def sert_atak_say(x, esik_db=12.0, taban_dbfs=-45.0):
    """Ani sert atak: 2–5 kHz bandında 2 ms RMS zarfı 4 ms içinde ≥ esik_db yükselir ve taban_dbfs'yi aşar (50 ms bekleme).
    Dönüş: sayı ve en yüksek 10 anın saniyesi ve düzeyi."""
    mono = x.mean(axis=0)
    N = len(mono)
    nf = _fft_boy(N)
    fr = np.maximum(np.fft.rfftfreq(nf, 1 / SR), 1e-3)
    H = (fr / 2000) ** 4 / (1 + (fr / 2000) ** 4) / (1 + (fr / 5000) ** 4)
    bnt = np.fft.irfft(np.fft.rfft(mono, nf) * H, nf)[:N]
    h, w = SR // 1000, 2 * SR // 1000
    c2 = np.concatenate([[0.0], np.cumsum(bnt ** 2)])
    son = np.arange(w, N, h)
    db = 10 * np.log10((c2[son] - c2[son - w]) / w + 1e-18)
    yuks = np.full_like(db, -99.0)
    yuks[4:] = db[4:] - db[:-4]
    aday = np.where((yuks >= esik_db) & (db >= taban_dbfs))[0]
    olay, son_i = [], -10 ** 9
    for i in aday:
        if i - son_i >= 50:
            olay.append(i)
            son_i = i
    en = sorted(olay, key=lambda i: -db[i])[:10]
    return dict(sayi=len(olay), esik_db=esik_db, taban_dbfs=taban_dbfs,
                en_yuksek=[dict(sn=round(son[i] / SR, 3), dbfs=round(float(db[i]), 1)) for i in sorted(en)])


def wav24_oku(yol):
    with wave.open(str(yol)) as w:
        kanal, gen = w.getnchannels(), w.getsampwidth()
        b = np.frombuffer(w.readframes(w.getnframes()), np.uint8)
    if gen != 3:
        raise ValueError('yalnız 24 bit')
    b = b.reshape(-1, 3)
    x = (b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16))
    x = np.where(x >= 1 << 23, x - (1 << 24), x).astype(float) / 8388607.0
    return x.reshape(-1, kanal).T


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
    if E.get('parlak_db'):                                                            # B yolu: örnek piyanoya hafif parlaklık
        cp = 10 ** (E['parlak_db'] / 20)
        H *= 1 + (cp - 1) * np.exp(-0.5 * (np.log2(f / E['parlak_f']) / (E.get('parlak_okt', 1.5) / 2)) ** 2)
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


def baslangic_dogrula(x, hedef_kareler, pencere_kare=4, kesim_hz=1000):
    """Her hedef karenin ±pencere'sinde kesim_hz üstü zarfın en dik yükselişini (6 ms'de dB) bulur (piyano: 1 kHz;
    yalnız nesne sesi olan işaret: 300 Hz, tok sesler koyu). pencere_kare tek sayı ya da hedef başına liste.
    Dönüş: hedef başına bulunan kare, sapma (kare) ve yükseliş (dB)."""
    if not hedef_kareler:
        return []
    on = int(0.05 * SR)
    mono = np.concatenate([np.zeros(on), x.mean(axis=0)])
    nf = _fft_boy(len(mono))
    fr = np.maximum(np.fft.rfftfreq(nf, 1 / SR), 1e-3)
    H = (fr / kesim_hz) ** 2 / np.sqrt(1 + (fr / kesim_hz) ** 4)   # yumuşak yüksek geçiren (sıfır evreli)
    yuk = np.fft.irfft(np.fft.rfft(mono, nf) * H, nf)[:len(mono)]
    # Zarf: RMS penceresi (1 kHz: 3 ms; alçak bant: 8 ms, birkaç periyot görsün), 1 ms adım (pencere sonu = adım zamanı).
    # Basamak ölçüsü: sonraki `ileri` ms'nin ortalama gücü / önceki [-geri, -ara] ms'nin ortalama gücü (dB). Yoğun dokuda
    # kısmi seslerin vuruşu kısa dalgalanma yapar; ortalama alan basamak ölçüsü bunu yok sayar, gerçek başlangıcı bulur.
    w_ms, ileri, geri, ara = (3, 10, 12, 2) if kesim_hz >= 1000 else (8, 12, 20, 4)
    h, w = SR // 1000, w_ms * SR // 1000
    c2 = np.concatenate([[0.0], np.cumsum(yuk ** 2)])
    son = np.arange(w, len(yuk), h)
    p = (c2[son] - c2[son - w]) / w + 1e-18
    cp = np.concatenate([[0.0], np.cumsum(p)])
    i_ = np.arange(len(p))
    a0, a1 = np.clip(i_ + 1, 0, len(p)), np.clip(i_ + 1 + ileri, 0, len(p))
    b0, b1 = np.clip(i_ - geri, 0, len(p)), np.clip(i_ - ara, 0, len(p))
    sonra = (cp[a1] - cp[a0]) / np.maximum(a1 - a0, 1)
    once = (cp[b1] - cp[b0]) / np.maximum(b1 - b0, 1)
    basamak = 10 * np.log10(np.maximum(sonra, 1e-18) / np.maximum(once, 1e-18))
    zaman = son / SR * 1000 - 50                                    # ms, dolgu düşülmüş
    pencereler = pencere_kare if isinstance(pencere_kare, (list, tuple)) else [pencere_kare] * len(hedef_kareler)
    sonuc = []
    for k, pk in zip(hedef_kareler, pencereler):
        c = k / FPS * 1000
        sec = np.where((zaman >= c - pk * 1000 / FPS) & (zaman <= c + pk * 1000 / FPS) & (i_ >= geri))[0]
        i = sec[int(np.argmax(basamak[sec]))]
        t = (zaman[i] - BASLANGIC_SAPMA_MS[w_ms]) / 1000.0          # yalıtılmış seslerle ayarlanmış sabit gecikme
        sonuc.append(dict(kare=k, pencere_kare=pk, bulunan=round(t * FPS, 2), sapma_kare=round(t * FPS - k, 2),
                          yukselis_db=round(float(basamak[i]), 1), bant_hz=kesim_hz))
    return sonuc


def k_agirlikli(x):
    """Yaklaşık K ağırlığı (ITU-R BS.1770: ~38 Hz yüksek geçiren + 1,7 kHz üstü +4 dB raf), sıfır evreli FFT süzgeci."""
    N = x.shape[1]
    nf = _fft_boy(N)
    f = np.maximum(np.fft.rfftfreq(nf, 1 / SR), 1e-3)
    H = (f / 38.0) ** 2 / np.sqrt(1 + (f / 38.0) ** 4)
    r = (f / 1681.0) ** 2
    H *= 1 + (10 ** (4 / 20) - 1) * r / (1 + r)
    return np.vstack([np.fft.irfft(np.fft.rfft(x[c], nf) * H, nf)[:N] for c in range(2)])


def vurus_yuksekligi(xk, k0, k1, hiza):
    """[k0, k1] aralığında `hiza` karesine hizalı 24 karelik (400 ms) vuruş pencerelerinin ses yüksekliği (LUFS, yaklaşık)."""
    sonuc = []
    bas = hiza - ((hiza - k0) // VURUS) * VURUS
    for a in range(bas, k1 - VURUS + 2, VURUS):
        s0, s1 = kare_ornek(a), kare_ornek(a + VURUS)
        ms = float(np.sum(np.mean(xk[:, s0:s1] ** 2, axis=1)))
        sonuc.append(dict(kare=a, lufs=round(-0.691 + 10 * math.log10(ms + 1e-20), 2)))
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


def video_suresi(ff, mp4):
    r = subprocess.run([ff, '-hide_banner', '-i', str(mp4)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    m = re.search(r'Duration:\s*(\d+):(\d+):([\d.]+)', r.stderr)
    return round(int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)), 3) if m else None


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


def _json_tip(o):
    """numpy sayıları ve mantıksal değerleri JSON'a düz Python değeri olarak yazar."""
    return o.item() if hasattr(o, 'item') else str(o)


def sus_zarfi(n_ornek, susturma):
    """Bilinçli sessizlik: müzik ve yankı kuyruğu 3 karede -36 dB'ye iner, bitişten 2 kare önce geri gelir."""
    kar = np.ones(n_ornek)
    taban = 10 ** (-36 / 20)
    for s, e in susturma:
        a, b = kare_ornek(s), kare_ornek(s + 3)
        c, d = kare_ornek(max(s + 3, e - 2)), kare_ornek(e)
        kar[a:b] = np.minimum(kar[a:b], taban + (1 - taban) * (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b - a))))
        kar[b:c] = taban
        if d > c:
            kar[c:d] = taban + (1 - taban) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, d - c)))
    return kar


# =====================================================================================================
# ANA AKIŞ
# =====================================================================================================
def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='Oktos tanıtım filmi v06: piyano müziği, kanca notaları ve nesne sesleri (kendi sentezimiz).')
    ap.add_argument('--dry-run', action='store_true', help='üret ve ölç, hiçbir dosya yazma')
    ap.add_argument('--hizli', action='store_true', help='az kısmi sesle hızlı önizleme')
    ap.add_argument('--bindirme-yok', action='store_true', help='videolara ses bindirme')
    ap.add_argument('--video', action='append', help='sesin bindirileceği mp4 (birden çok verilebilir); varsayılan animatik-v06-{yatay,dikey}.mp4')
    ap.add_argument('--isaretler', default=str(ISARET_JSON), help='işaret dosyası (film-isaret.py çıktısı)')
    ap.add_argument('--ek', default='', help='çıktı adı eki: --ek v2 → film-ses-v2.wav, doku-v2.wav, cizelge-v2.json, <video>-sesli-v2.mp4')
    ap.add_argument('--doku-yok', action='store_true', help='doku katmanı yok, nesne sesleri eski modal sentez (v1 karışımı)')
    ap.add_argument('--orkestra-yok', action='store_true', help='v12a orkestrası (fon, doku çalgıları, yumuşak davullar) yok')
    ap.add_argument('--kaynak', default='sentez', choices=['sentez', 'ornek'], help='bütün çalgıların ses kaynağı (varsayılan sentez)')
    ap.add_argument('--kaynak-calgi', action='append', help='çalgı ya da önek başına kaynak: --kaynak-calgi davul=ornek (birden çok)')
    ap.add_argument('--kutuphane', default=None, help='örnek kütüphanesinin kökü (yoksa OKTOS_SES_KUTUPHANE); yalnız ornek kaynakta gerekir')
    ap.add_argument('--onceki', default='film-ses.wav', help='"kulak tırmalamasın" karşılaştırmasının önceki karışımı (.impeccable/ses/ içinde)')
    arg = ap.parse_args()
    global NESNE_PIYANO
    NESNE_PIYANO = not arg.doku_yok
    sonek = f'-{arg.ek}' if arg.ek else ''
    global ORNEK
    KAYNAK_SECIMI.clear()
    KAYNAK_SECIMI['*'] = arg.kaynak
    for s_ in arg.kaynak_calgi or []:
        ad_, _, tur_ = s_.partition('=')
        if tur_.strip() not in ('sentez', 'ornek'):
            ap.error(f'--kaynak-calgi {s_}: tür sentez ya da ornek olmalı')
        KAYNAK_SECIMI[ad_.strip()] = tur_.strip()
    if 'ornek' in KAYNAK_SECIMI.values():
        try:
            ornek_kur(arg.kutuphane or os.environ.get('OKTOS_SES_KUTUPHANE'))
        except (OSError, ValueError) as e:
            ap.error(f'örnek çalıcı kurulamadı: {e}')
        if kaynak_turu('piyano') == 'ornek':
            EQ.update(EQ_ORNEK_FARK)        # örnek piyano sentezden koyu: alt raf yok, 1,8 kHz çevresi biraz açık
            # Gerçek kayıtlar (yay, tokmak) işaret anlarında sentezden daha "dolu": doku ve orkestra işaret notalarında daha çok
            # çekilir (doku hedefi aynı; kemanın doku içindeki payı KEMAN_ORNEK_EK_DB kadar geride)
            global DOKU_CEKIL_DB
            DOKU_CEKIL_DB = -12.0
    t0 = time.time()
    ff = ffmpeg_bul()
    rng = np.random.default_rng(TOHUM)

    isaretler_ham, isaret_veri, uyarilar = isaretleri_oku(Path(arg.isaretler))
    isaretler, final_bilgi = final_tamamla(isaretler_ham)
    if final_bilgi['varsayim']:
        uyarilar.append(f'final {final_bilgi["kaynak"]}: {len(final_bilgi["varsayim"])} işaret varsayıldı; s6 gelince film-isaret.py ile yeniden okuyun')
    for u in uyarilar:
        print('UYARI:', u)
    P = partisyon(isaretler, final_bilgi)
    notalar, nesneler, pedal, susturma = P['notalar'], P['nesneler'], P['pedal'], P['susturma']
    D = None if arg.doku_yok else doku_kur(P, isaretler, nesneler)     # nesne seslerine perde de verir
    ORK = None if arg.orkestra_yok else orkestra_kur(P, isaretler, D)   # v12a: fon, tokmaklı/telli, yumuşak davullar
    TEKRAR = tekrar_denetimi(P, D, O=ORK)                                # v10: 2 ölçü kuralı (bilinçli ostinato hariç)
    TON_PLANI = ton_plani(P)

    # Çalım: kanca (kesme), fon (muzik), işaret notaları, serbest notalar (sessizlikte de çalar), nesne sesleri
    kuru = dict(
        kesme=cal(notalar, pedal, susturma, lambda p: p['parca'] == 'kesme', rng, arg.hizli),
        muzik=cal(notalar, pedal, susturma, lambda p: p['parca'] == 'muzik' and not p['serbest'], rng, arg.hizli),
        isaret=cal(notalar, pedal, susturma, lambda p: p['parca'] == 'isaret' and not p['serbest'], rng, arg.hizli),
        serbest=cal(notalar, pedal, susturma, lambda p: p['serbest'], rng, arg.hizli),
    )
    if P['tema']:
        kuru['tema'] = cal(notalar, pedal, susturma, lambda p: p['parca'] == 'tema', rng, arg.hizli, P=PIYANO_TEMA, calgi='piyano.tema')
    piyano_tini = {ad: tayf_olc(x)['bant_db']['2-5k (sertlik)'] for ad, x in kuru.items()
                   if ad in ('kesme', 'muzik', 'isaret', 'tema') and np.any(x)}     # kuru piyano stem'lerinin 2–5 kHz payı
    ir = yanki_ir(np.random.default_rng(TOHUM + 1), YANKI)
    islak = {ad: eq_uygula(yanki_uygula(x, ir, YANKI['islak_db']), EQ) for ad, x in kuru.items()}
    # Sessizlikte müzik ve yankısı susar; balon noktaları ve nesne sesleri susmaz. Dosya sonunda yumuşak kararma.
    sus = sus_zarfi(islak['muzik'].shape[1], susturma)
    for ad in ('kesme', 'muzik', 'isaret', 'tema'):
        if ad in islak:
            islak[ad] *= sus
    # Tema öne: melodi TEMA_ONE_DB; tema çalarken akor ve doku melodinin bölgesinde (TEMA_CEKIL) biraz çekilir
    akt = tema_aktivite(notalar, islak['muzik'].shape[1]) if P['tema'] else None
    if akt is not None:
        for ad in ('muzik', 'isaret', 'serbest'):
            islak[ad] = tema_cekil(islak[ad], akt)
    # Nesne sesleri müziğin üstüne ayarlanır (miks), sonra çalınır
    nesne_duzeyle(nesneler, sum(islak.values()), np.random.default_rng(TOHUM + 2), arg.hizli)
    islak['nesne'] = eq_uygula(yanki_uygula(nesne_cal(nesneler, np.random.default_rng(TOHUM + 2), arg.hizli), ir, YANKI['islak_db']), EQ)
    ork_bilgi = orkestra_karis(ORK, islak, ir, akt, notalar, susturma, arg.hizli) if ORK is not None and ORK['olaylar'] else None
    tema_kazanci = None
    if akt is not None:
        islak['nesne'] = tema_cekil(islak['nesne'], akt)
        # Melodi öne: tema çalarken 400–1300 Hz bandında eşlikten TEMA_ONE_DB yüksek olacak kazanç (ölçerek ayarlanır)
        maske = (akt > 0.5).astype(float)
        geri = sum(v for ad, v in islak.items() if ad != 'tema')
        tema_kazanci = {}
        for ad, (sa_, sb_) in SAHNELER.items():           # sahne başına: her sahnede melodi aynı ölçüde öne
            mk_ = np.zeros_like(maske)
            mk_[kare_ornek(sa_):kare_ornek(sb_ + 1)] = maske[kare_ornek(sa_):kare_ornek(sb_ + 1)]
            if mk_.sum() > 0.3 * SR:
                r0 = 10 * math.log10(bant_enerji(islak['tema'], 400, 1300, mk_) / max(bant_enerji(geri, 400, 1300, mk_), 1e-20))
                tema_kazanci[ad] = round(float(np.clip(TEMA_ONE_DB - r0, -12.0, 12.0)), 1)
        islak['tema'] *= sahne_kazanci(islak['tema'].shape[1], tema_kazanci)
    karisim = sum(islak.values())
    Lk = int(SON_KARARMA_SN * SR)
    son_zarf = np.ones(karisim.shape[1]); son_zarf[-Lk:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, Lk))
    # Doku (v2): keçe piyano + keman, aynı oda (biraz daha yankılı). Sahne başına müziğin DOKU_HEDEF_DB altına ayarlanır,
    # kanca ve işaret notalarında çekilir, sessizlikte incelir.
    doku_bilgi = None
    if D is not None:
        piy_k, kem_k = doku_cal(D, np.random.default_rng(TOHUM + 12), arg.hizli)
        piy_w = eq_uygula(yanki_uygula(piy_k, ir, DOKU_ISLAK_DB), EQ)
        kem_w = eq_uygula(yanki_uygula(kem_k, ir, DOKU_ISLAK_DB), EQ)
        if akt is not None:
            piy_w, kem_w = tema_cekil(piy_w, akt), tema_cekil(kem_w, akt)
        onemli = sorted({p['kare'] for p in notalar if p['parca'] in ('kesme', 'isaret')})
        cekil = doku_zarfi(karisim.shape[1], onemli, susturma)
        piy_w *= cekil
        kem_w *= cekil
        mk, dk = k_agirlikli(karisim), k_agirlikli(piy_w + kem_w)
        kaz, goreli0 = {}, {}
        for ad, hedef in DOKU_HEDEF_DB.items():
            if ad not in SAHNELER:
                continue
            a, b = kare_ornek(SAHNELER[ad][0]), kare_ornek(SAHNELER[ad][1] + 1)
            em, ed = float(np.sum(mk[:, a:b] ** 2)), float(np.sum(dk[:, a:b] ** 2))
            if ed > 0 and em > 0:
                goreli0[ad] = 10 * math.log10(ed / em)
                kaz[ad] = float(np.clip(hedef - goreli0[ad], -30.0, 24.0))
        zarf = sahne_kazanci(karisim.shape[1], kaz)
        piy_w *= zarf
        kem_w *= zarf
        doku = (piy_w + kem_w) * son_zarf
        dk = k_agirlikli(doku)
        goreli = {}
        for ad in kaz:
            a, b = kare_ornek(SAHNELER[ad][0]), kare_ornek(SAHNELER[ad][1] + 1)
            goreli[ad] = round(10 * math.log10(float(np.sum(dk[:, a:b] ** 2)) / float(np.sum(mk[:, a:b] ** 2)) + 1e-20), 1)
        doku_bilgi = dict(sahne_kazanci_db={k: round(v, 1) for k, v in kaz.items()}, goreli_db=goreli, hedef_db=DOKU_HEDEF_DB, ozet=D['ozet'])
        karisim = karisim + piy_w + kem_w
    karisim *= son_zarf
    kesme = islak['kesme'] * son_zarf
    muzik_bus = (islak['kesme'] + islak['muzik'] + islak['isaret']) * son_zarf

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
        muzik_c = muzik_bus * 10 ** (kazanc_db / 20)

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
        # Sessizlikler: müzik (yankısıyla) ne kadar sessiz; karışımda nesne sesleri ve balon noktaları çalabilir
        ses = {}
        for s, e in susturma:
            a, b = kare_ornek(s + 4), kare_ornek(e - 2)
            if b > a:
                ses[f'k{s}-{e}'] = dict(muzik_rms_dbfs=round(20 * math.log10(np.sqrt(np.mean(muzik_c[:, a:b] ** 2)) + 1e-12), 1),
                                       karisim_rms_dbfs=round(20 * math.log10(np.sqrt(np.mean(cikti[:, a:b] ** 2)) + 1e-12), 1))
        olcum['sessizlik'] = ses

        # "Kulak tırmalamasın": en sert 100 ms (2–5 kHz payı), 5–10 kHz, ani sert atak sayısı; doku ve keman ayrıca.
        # Karşılaştırma için önceki karışım (ek yoksa yazılmadan önceki film-ses.wav) ve cizelge.json
        olcum['sert_atak'] = dict(karisim=sert_atak_say(cikti))
        sa = olcum['sert_atak']['karisim']
        sa['dakikada'] = round(sa['sayi'] / (cikti.shape[1] / SR / 60), 1)
        onceki = dict()
        yol1 = CIKIS / arg.onceki
        if yol1.exists() and yol1.name != f'film-ses{sonek}.wav':
            try:
                x1 = wav24_oku(yol1)
                t1 = tayf_olc(x1)
                s1 = sert_atak_say(x1)['sayi']
                onceki = dict(dosya=yol1.name, sertlik_en_kotu_db=t1['sertlik_en_kotu_db'], sertlik_en_kotu_sn=t1['sertlik_en_kotu_sn'],
                              bant_5_10k_db=t1['bant_db']['5-10k'], sert_atak=s1, sert_atak_dakikada=round(s1 / (x1.shape[1] / SR / 60), 1))
            except (OSError, ValueError) as e:
                onceki = dict(hata=str(e))
        olcum['onceki_karisim'] = onceki
        # Melodi öne çıkışı: tema çalarken 400–1300 Hz bandında tema / geri kalan (dB); sahne başına da
        if akt is not None:
            tema_c = islak['tema'] * son_zarf * 10 ** (kazanc_db / 20)
            maske = (akt > 0.5).astype(float)
            et_, er_ = bant_enerji(tema_c, 400, 1300, maske), bant_enerji(cikti - tema_c, 400, 1300, maske)
            sahne_one = {}
            for ad, (sa_, sb_) in SAHNELER.items():
                mk_ = np.zeros_like(maske)
                mk_[kare_ornek(sa_):kare_ornek(sb_ + 1)] = maske[kare_ornek(sa_):kare_ornek(sb_ + 1)]
                if mk_.sum() > SR * 0.2:
                    e1, e2 = bant_enerji(tema_c, 400, 1300, mk_), bant_enerji(cikti - tema_c, 400, 1300, mk_)
                    sahne_one[ad] = round(10 * math.log10(e1 / max(e2, 1e-20)), 1)
            olcum['tema'] = dict(one_db=round(10 * math.log10(et_ / max(er_, 1e-20)), 1), sahne_one_db=sahne_one,
                                 kazanc_db=tema_kazanci, hedef_one_db=TEMA_ONE_DB,
                                 sure_sn=round(float(maske.sum()) / SR, 1), nota=len(P['tema']),
                                 sahne_nota={ad: sum(t['sahne'] == ad for t in P['tema']) for ad in SAHNELER})
        if doku_bilgi:
            kaz_lin = 10 ** (kazanc_db / 20)
            doku_c = doku * kaz_lin
            keman_c = kem_w * son_zarf * kaz_lin
            dt, kt = tayf_olc(doku_c), tayf_olc(keman_c)
            olcum['doku'] = dict(doku_bilgi, tayf_doku=dt, tayf_keman=kt,
                                 keman_2_5k_db=kt['bant_db']['2-5k (sertlik)'], keman_5_10k_db=kt['bant_db']['5-10k'],
                                 sert_atak_doku=sert_atak_say(doku_c), sert_atak_keman=sert_atak_say(keman_c))
            olcum['sert_atak'].update(doku=olcum['doku']['sert_atak_doku']['sayi'], keman=olcum['doku']['sert_atak_keman']['sayi'])
        ork_c = {}
        if ork_bilgi:
            kaz_lin = 10 ** (kazanc_db / 20)
            ork_c = {st: islak[st] * son_zarf * kaz_lin for st in ork_bilgi}
            olcum['orkestra'] = dict(seviye=ork_bilgi, **{f'tayf_{st}': tayf_olc(x) for st, x in ork_c.items()})
            olcum['sert_atak'].update({st: sert_atak_say(x)['sayi'] for st, x in ork_c.items()})

        # Doruk: finalin (ve filmin) vuruşları içinde en yüksek mi (400 ms pencere, yaklaşık K ağırlıklı)
        fa, fb = SAHNELER['s6-final']
        doruk = P['final']['doruk']
        xk = k_agirlikli(cikti)
        vf = vurus_yuksekligi(xk, fa, fb, doruk)
        vt = vurus_yuksekligi(xk, 0, TOPLAM_KARE - 1, doruk)
        en_f = max(vf, key=lambda r: r['lufs'])
        en_t = max(vt, key=lambda r: r['lufs'])
        dv = next(r for r in vf if r['kare'] == doruk)
        ikinci = max((r for r in vf if r['kare'] != doruk), key=lambda r: r['lufs'])
        olcum['doruk'] = dict(kare=doruk, varsayim=any(i.get('ad') == 'doruk' for i in final_bilgi['varsayim']),
                              doruk_vurusu_lufs=dv['lufs'], finalin_en_yuksek_vurusu=en_f, finalde_ikinci=ikinci,
                              fark_db=round(dv['lufs'] - ikinci['lufs'], 2), filmin_en_yuksek_vurusu=en_t,
                              final_vuruslari=vf)

        # İşaret doğrulaması: her çapa karesinde karışımda nota başlangıcı (±1 kare). Pencere komşu başlangıca göre daralır.
        baslangiclar = sorted({p['kare'] for p in notalar} | {e['kare'] for e in nesneler}
                              | ({p['kare'] for p in D['piyano']} | {z['kare'] for z in D['pizz']} if D else set())
                              | ({o['kare'] for o in ORK['olaylar'] if o['calgi'] not in YAVAS_ATAK} if ORK else set()))
        capa_ses = {}
        for p in notalar:
            if p['kare'] in P['capa']:
                capa_ses.setdefault(p['kare'], []).append(f'{nota_adi(p["m"])} ({p["etiket"]})')
        for e in nesneler:
            if e['kare'] in P['capa']:
                capa_ses.setdefault(e['kare'], []).append(f'{e["tip"]} sesi ({e["etiket"]})')
        hedef = {1000: ([], []), 300: ([], [])}
        zar_kare = {e['kare'] for e in nesneler if e['tip'] == 'zar'}
        nota_kare = {p['kare'] for p in notalar}
        nesne_bant = {e['kare']: nesne_bandi(e['tip']) for e in nesneler}
        for c in P['capa']:
            if c not in capa_ses:
                continue
            komsu = min([abs(b - c) for b in baslangiclar if b != c] or [99])
            pk = max(1, min(3, komsu // 2))
            if c in zar_kare:
                pk = min(pk, 2)          # zar öbeğinin ikinci sekişi +2,3 kare: pencere ondan önce biter
            bant = 1000 if c in nota_kare else nesne_bant.get(c, 1000)
            hedef[bant][0].append(c); hedef[bant][1].append(pk)
        bulunan = {r['kare']: r for bant, (h, pk) in hedef.items() for r in baslangic_dogrula(cikti, h, pk, bant)}
        isaret_dog = []
        for i in isaretler:
            if i['tur'] == 'sessizlik':
                continue
            k = i['kare']
            kayit = dict(kare=k, tur=i['tur'], ek=ek_metni(i).strip() or None, varsayim=bool(i.get('varsayim')))
            if i['tur'] == 'kesme' and k in P['kesme_birlesen']:
                kayit.update(durum='birleşti', capa=P['kesme_birlesen'][k])
            elif k - 1 in bulunan and k in bulunan:
                # 1 kare (17 ms) arayla iki olay tek an duyulur ve ayrı ölçülemez: önceki işaretle birlikte doğrulanır
                kayit.update(durum='birleşti', capa=k - 1, ses=capa_ses[k], aciklama='1 kare arayla: önceki işaretle tek an')
            elif k in bulunan:
                r = bulunan[k]
                kayit.update(durum='eşlendi', ses=capa_ses[k], bulunan_kare=r['bulunan'], sapma_kare=r['sapma_kare'],
                             yukselis_db=r['yukselis_db'], pencere_kare=r['pencere_kare'], bant_hz=r['bant_hz'])
            else:
                kayit.update(durum='ses yok')
            isaret_dog.append(kayit)
        eslenen = [d for d in isaret_dog if d['durum'] == 'eşlendi']
        en_sapma = max(abs(d['sapma_kare']) for d in eslenen) if eslenen else None
        zayif = [d for d in eslenen if d['yukselis_db'] < 3]
        dogrulama = dict(
            isaret_sayisi=len(isaret_dog), eslenen=len(eslenen), birlesen=sum(d['durum'] == 'birleşti' for d in isaret_dog),
            ses_yok=[dict(kare=d['kare'], tur=d['tur']) for d in isaret_dog if d['durum'] == 'ses yok'],
            en_buyuk_sapma_kare=en_sapma, sapmasi_1_karedan_buyuk=[d for d in eslenen if abs(d['sapma_kare']) > 1.0],
            yukselisi_3_dbden_az=[dict(kare=d['kare'], tur=d['tur'], yukselis_db=d['yukselis_db']) for d in zayif],
            tum_isaretler_1_kare_icinde=bool(eslenen) and bool(en_sapma <= 1.0),
            kanca=dict(kesmeler=P['kanca']['kesmeler'][1:] + [P['kanca']['a_karesi']], isaret_kesmeleri=P['kanca']['isaret_kesmeleri'],
                       isaretle_uyumlu=P['kanca']['isaretle_uyumlu']),
            capaya_yapisan_fon_notasi=P['yapisan'], sessizlikte_dusen_nota=P['dusen'], genel_karsilik=P['genel'],
            isaretler=isaret_dog,
        )
        # Kanca: video varsa yüz değişimleri görüntü farkından da bulunur
        videolar = [Path(v) for v in arg.video] if arg.video else [v for v in VARSAYILAN_VIDEOLAR if v.exists()]
        if videolar:
            vk, _ = video_kesmeleri(ff, videolar[0], son_kare=P['kanca']['a_karesi'] + 8)
            plan = dogrulama['kanca']['kesmeler']
            dogrulama['kanca'].update(video=videolar[0].name, video_kesmeleri=[k for k in vk if 20 <= k <= P['kanca']['a_karesi']],
                                      videoda_bulunmayan=sorted(set(plan) - set(vk)))
        else:
            dogrulama['kanca']['video'] = 'yok (animatik-v06 videosu henüz çekilmedi)'

        hedefler = dict(
            lufs=dict(deger=olcum['lufs'], hedef='-16 ± 0,5', tamam=abs(olcum['lufs'] - HEDEF_LUFS) <= 0.5),
            gercek_tepe_dbtp=dict(deger=olcum['gercek_tepe_dbtp'], hedef='≤ -1,0', tamam=olcum['gercek_tepe_dbtp'] <= TEPE_DBTP + 1e-6),
            kirpilan_ornek=dict(deger=olcum['kirpilan_ornek'], hedef=0, tamam=olcum['kirpilan_ornek'] == 0),
            sertlik_2_5k_db=dict(deger=olcum['tayf']['bant_db']['2-5k (sertlik)'], hedef='≤ -18', tamam=olcum['tayf']['bant_db']['2-5k (sertlik)'] <= -18),
            tayf_merkezi_hz=dict(deger=olcum['tayf']['tayf_merkezi_hz'], hedef='350–450', tamam=350 <= olcum['tayf']['tayf_merkezi_hz'] <= 450),
            doruk_finalin_en_yuksek_vurusu=dict(deger=f'k{en_f["kare"]} ({en_f["lufs"]} LUFS); doruk k{doruk}, ikinciden {olcum["doruk"]["fark_db"]} dB yüksek',
                                                hedef=f'k{doruk}', tamam=en_f['kare'] == doruk),
            isaret_sapmasi_kare=dict(deger=en_sapma, hedef='≤ 1', tamam=dogrulama['tum_isaretler_1_kare_icinde']),
            tekrar_2_olcu=dict(deger=f'akor ihlali {len(TEKRAR["akor_ihlal"])}, desen ihlali {len(TEKRAR["desen_ihlal"])}, '
                                     f'en uzun özdeş ölçü dizisi {TEKRAR["en_uzun_ozdes_olcu_dizisi"]}',
                               hedef='0 ihlal (bilinçli ostinato hariç)', tamam=TEKRAR['tamam']),
        )
        t2 = olcum['tayf']
        if onceki.get('sertlik_en_kotu_db') is not None:
            hedefler['en_sert_100ms_2_5k_db'] = dict(deger=f'{t2["sertlik_en_kotu_db"]} ({t2["sertlik_en_kotu_sn"]} sn)',
                                                     hedef=f'≤ önceki {onceki["sertlik_en_kotu_db"]} ({onceki["sertlik_en_kotu_sn"]} sn)',
                                                     tamam=t2['sertlik_en_kotu_db'] <= onceki['sertlik_en_kotu_db'] + 0.05)
            hedefler['bant_5_10k_db'] = dict(deger=t2['bant_db']['5-10k'], hedef=f'düşük (önceki {onceki["bant_5_10k_db"]})',
                                             tamam=t2['bant_db']['5-10k'] <= onceki['bant_5_10k_db'] + 1.0)
            # İstek "ölç ve raporla": geçti/kaldı değil, rapor (önceki karışımla dakika başına karşılaştırma)
            hedefler['ani_sert_atak'] = dict(deger=f'{sa["sayi"]} ({sa["dakikada"]}/dk)',
                                             hedef=f'rapor; önceki {onceki["dosya"]}: {onceki["sert_atak"]} ({onceki["sert_atak_dakikada"]}/dk)',
                                             tamam=None)
        if doku_bilgi:
            hedefler['keman_2_5k_db'] = dict(deger=olcum['doku']['keman_2_5k_db'], hedef='rapor (karışım hedefi ≤ -18)',
                                             tamam=olcum['doku']['keman_2_5k_db'] <= -18)
            hedefler['doku_goreli_db'] = dict(deger=doku_bilgi['goreli_db'], hedef='-10…-14 (sahne başına)',
                                              tamam=all(-14.5 <= v <= -9.5 for v in doku_bilgi['goreli_db'].values()))
        if ORNEK is not None:
            hedefler['ornek_2_5k_db'] = dict(
                deger=dict({c: t['ornek_2_5k_db'] for c, t in ORNEK_TINI.items()}, **{f'piyano.{k}': v for k, v in piyano_tini.items()}),
                hedef='rapor: örnekli çalgının kendi 2–5 kHz payı (kuru; karışım hedefi ≤ -18)', tamam=None)
        if ork_bilgi:
            if 'davul' in ork_bilgi:
                hedefler['davul_2_5k_db'] = dict(deger=olcum['orkestra']['tayf_davul']['bant_db']['2-5k (sertlik)'],
                                                 hedef='rapor (davul stem’inin kendi 2–5 kHz payı; karışım hedefi ≤ -18)', tamam=None)
            hedefler['orkestra_goreli_db'] = dict(deger={st: b['goreli_db'] for st, b in ork_bilgi.items()},
                                                  hedef='sahne başına davul ve fon hedefi ±0,6 dB',
                                                  tamam=all(abs(v - b['hedef_db'][ad]) <= 0.6 for b in ork_bilgi.values()
                                                            for ad, v in b['goreli_db'].items()))

        cizelge = dict(
            meta=dict(sr=SR, fps=FPS, toplam_kare=TOPLAM_KARE, sure_sn=TOPLAM_KARE / FPS, bpm=BPM, vurus_kare=VURUS,
                      olcu_kare=96, ton='anlatı planı (bölüm başına ton/mod: ton_plani); açılış ve kapanış Re majör', tohum=TOHUM, kanca_kaynagi=P['kanca']['kaynak'],
                      isaret_dosyasi=dict(okundu=isaret_veri.get('meta', {}).get('okundu'), yon=isaret_veri.get('meta', {}).get('yon'),
                                          dil=isaret_veri.get('meta', {}).get('dil'), sayi=len(isaretler_ham)),
                      final_kaynagi=final_bilgi['kaynak'], final_varsayimlari=final_bilgi['varsayim'], uyarilar=uyarilar,
                      sentez='kendi sentezimiz: uyumsuz kısmi sesler, iki aşamalı sönüm, 1–3 tel akort farkı, çekiç gürültüsü, damper ve pedal, '
                             'modal nesne sesleri (tık, zar, darbe), FFT evrişimli sentetik oda yankısı'),
            hedefler=hedefler, bolumler=bolumler(),
            sahneler={ad: dict(kare=[a, b], sn=[round(kare_sn(a), 3), round(kare_sn(b + 1), 3)]) for ad, (a, b) in SAHNELER.items()},
            pedal=[dict(kare=[a, b], sn=[round(kare_sn(a), 3), round(kare_sn(b + 1), 3)]) for a, b in pedal],
            sessizlik=[dict(kare=[s, e]) for s, e in susturma],
            notalar=[dict(kare=p['kare'], sn=round(kare_sn(p['kare']) + p['ofset_ms'] / 1000, 4), ofset_ms=p['ofset_ms'], nota=nota_adi(p['m']), midi=p['m'],
                          hiz=p['hiz'], tus_kare=p['sure'], birakma_kare=p.get('birakma_kare'), parca=p['parca'], serbest=p['serbest'], etiket=p['etiket'])
                     for p in notalar],
            nesne_sesleri=[dict(kare=e['kare'], sn=round(kare_sn(e['kare']), 4), tip=e['tip'], nota=e.get('nota') if NESNE_PIYANO else None,
                                rol=e['rol'], db=e['db'], db_ayar=e.get('db_ayar'), etiket=e['etiket']) for e in nesneler],
            olcum=olcum, dogrulama=dogrulama,
            ton_plani=TON_PLANI, tekrar_denetimi=TEKRAR,
            kaynak=dict(secim=dict(KAYNAK_SECIMI), calgilar=KAYNAK_RAPOR, ornek_tini=ORNEK_TINI, eslem_db=ESLEM_DB,
                        oktav_kaydirilan=ORNEK_OKTAV, piyano_kuru_2_5k_db=piyano_tini,
                        atak_hizalama_ms={c: float(np.median(v)) for c, v in ORNEK_GECIKME.items() if v}, eq=dict(EQ)),
        )
        if ORK is not None:
            cizelge['meta']['sentez'] += ('; v12a orkestra (ses kaynağı arayüzü: sentez | ornek): yumuşak davullar (fırça trampet ve '
                                          'süpürme, shaker, rim, tahta blok, çerçeve davul, kick, el çırpma, parmak şıklatma, tef, tom, '
                                          'timpani, zil kabarması), pedler (analog, yaylı), kalimba, marimba, glokenşpil, çan, arp, '
                                          'kontrbas pizzicato, flüt trili')
            cizelge['orkestra'] = dict(
                kaynak_secimi=dict(KAYNAK_SECIMI), kaynak=KAYNAK_RAPOR, ornek_tini=ORNEK_TINI, oktav_kaydirilan=ORNEK_OKTAV,
                ornek_calici='scripts/ornek-calici.py (kütüphane yerel, yolu yazılmaz)' if ORNEK is not None else None,
                seviye=ork_bilgi, ozet=ORK['ozet'], ostinato=ORK['ostinato'], calgi_db=CALGI_DB,
                olaylar=[dict(kare=o['kare'], sn=round(kare_sn(o['kare']), 3), calgi=o['calgi'], stem=stem_adi(o['calgi']),
                              nota=None if o['m'] is None else nota_adi(o['m']), hiz=o['hiz'], sure_kare=o['sure'], pan=o['pan'],
                              etiket=o['etiket']) for o in ORK['olaylar']])
        if P['tema']:
            cizelge['tema'] = dict(
                tarif='4 + 4 ölçü (soru / cevap), imza aralığı yükselen altılı (5. → 3. derece); dizi basamaklarıyla yazılı, her sahnede '
                      'o sahnenin tonunda/modunda çalar (Si minör, Mi dorian → Mi majör, Sol majör, Re dorian, La majör, Re majör); keçe piyano sağ el, '
                      f'+{TEMA_ONE_DB:g} dB öne, çalarken eşlik ve doku {TEMA_CEKIL["f"]:g} Hz çevresinde {TEMA_CEKIL["db"]:g} dB çekilir',
                akorlar_re_majorde=TEMA_AKOR,
                kaynak=[dict(vurus=bt, basamak=st, re_majorde=nota_adi(midi('D5') + MODLAR['ionian'][st % 7] + 12 * (st // 7)), sure_vurus=d,
                             olcu=int(bt // 4) + 1) for bt, st, d in TEMA_ADIM],
                donusum={ad: sorted({t['etiket'] for t in P['tema'] if t['sahne'] == ad}) for ad in SAHNELER},
                notalar=[dict(kare=t['kare'], sn=round(kare_sn(t['kare']), 3), nota=nota_adi(t['m']), sahne=t['sahne'], olcu=t['olcu'],
                              etiket=t['etiket']) for t in sorted(P['tema'], key=lambda t: (t['kare'], t['m']))])
        if D is not None:
            cizelge['meta']['sentez'] += ('; v2 doku: keçe piyano (yumuşak çekiç, una corda, düşük parlaklık, yumuşak atak) ve keman '
                                          '(harmonik dizi, gövde rezonansları, geç vibrato, legato, flautando ve con sordino, pizzicato); '
                                          'nesne sesleri susturulmuş/hazırlanmış piyano notası + kısa gövde')
            cizelge['doku'] = dict(
                piyano=[dict(kare=p['kare'], nota=nota_adi(p['m']), hiz=p['hiz'], sure=p['sure'], tur=p['tur'], pan=p['pan'], etiket=p['etiket'])
                        for p in D['piyano']],
                keman=[dict(teknik=c['teknik'], pan=c['pan'], etiket=c['etiket'], kare=[c['notlar'][0][0], c['notlar'][-1][0] + c['notlar'][-1][2]],
                            notalar=[(k, nota_adi(m), d, v) for k, m, d, v, _ in c['notlar']]) for c in D['keman']],
                pizzicato=[dict(kare=z['kare'], nota=nota_adi(z['m']), hiz=z['hiz'], etiket=z['etiket']) for z in D['pizz']],
                pedal=D['pedal'])
        ozet = dict(hedefler={k: (v['deger'], 'RAPOR' if v['tamam'] is None else 'TAMAM' if v['tamam'] else 'KALDI') for k, v in hedefler.items()},
                    bant_db=olcum['tayf']['bant_db'], sinirlayici=(olcum['sinirlayici_en_cok_db'], olcum['sinirlayici_en_cok_sn']),
                    sessizlik=olcum['sessizlik'],
                    isaret=dict(toplam=dogrulama['isaret_sayisi'], eslenen=dogrulama['eslenen'], birlesen=dogrulama['birlesen'],
                                ses_yok=dogrulama['ses_yok'], sapma_1_ustu=[(d['kare'], d['tur'], d['sapma_kare']) for d in dogrulama['sapmasi_1_karedan_buyuk']],
                                zayif=dogrulama['yukselisi_3_dbden_az'], yapisan=len(P['yapisan']), dusen=len(P['dusen']), genel=P['genel']),
                    kanca_isaretle_uyumlu=P['kanca']['isaretle_uyumlu'], final=final_bilgi['kaynak'],
                    nota_sayisi=len(notalar), nesne_sayisi=len(nesneler), sure_sn=round(time.time() - t0, 1))
        if doku_bilgi:
            ozet['doku'] = dict(goreli_db=doku_bilgi['goreli_db'], kazanc_db=doku_bilgi['sahne_kazanci_db'], ozet=D['ozet'],
                                keman_bant_db=olcum['doku']['tayf_keman']['bant_db'], doku_bant_db=olcum['doku']['tayf_doku']['bant_db'])
        ozet['sert_atak'] = olcum['sert_atak']
        if ork_bilgi:
            ozet['orkestra'] = dict(goreli_db={st: b['goreli_db'] for st, b in ork_bilgi.items()}, ozet=ORK['ozet'],
                                    bant_db={st: olcum['orkestra'][f'tayf_{st}']['bant_db'] for st in ork_bilgi},
                                    kaynak={k: (v['ornek'], v['sentez']) for k, v in KAYNAK_RAPOR.items()},
                                    ornek_tini=ORNEK_TINI, oktav_kaydirilan=ORNEK_OKTAV)
        ozet['tekrar'] = dict(tamam=TEKRAR['tamam'], akor_ihlal=TEKRAR['akor_ihlal'], desen_ihlal=TEKRAR['desen_ihlal'],
                              en_uzun=TEKRAR['en_uzun_ozdes_olcu_dizisi'])
        ozet['ton_plani'] = [(t['bolum'], t['ton'], t['akor_dizisi']) for t in TON_PLANI]
        if 'tema' in olcum:
            ozet['tema'] = olcum['tema']
        ozet['onceki'] = onceki
        ozet['en_sert_100ms'] = (olcum['tayf']['sertlik_en_kotu_db'], olcum['tayf']['sertlik_en_kotu_sn'])
        print(json.dumps(ozet, ensure_ascii=False, indent=1, default=_json_tip))

        dosya = dict(karisim=CIKIS / f'film-ses{sonek}.wav', kesme=CIKIS / f'kesme-notalari{sonek}.wav', cizelge=CIKIS / f'cizelge{sonek}.json')
        if doku_bilgi:
            dosya.update(doku=CIKIS / f'doku{sonek}.wav', keman=CIKIS / f'keman{sonek}.wav')
        for st in ork_c:
            dosya[st] = CIKIS / f'{st}{sonek}.wav'
        if arg.dry_run:
            print('dry-run: dosya yazılmadı. Yazılacaklar:', *[p.name for p in dosya.values()])
            return
        CIKIS.mkdir(parents=True, exist_ok=True)
        wav24_yaz(dosya['karisim'], cikti)
        wav24_yaz(dosya['kesme'], kesme_c)
        if doku_bilgi:
            wav24_yaz(dosya['doku'], doku_c)
            wav24_yaz(dosya['keman'], keman_c)
        for st, x in ork_c.items():
            wav24_yaz(dosya[st], x)
        if not arg.bindirme_yok:
            bind = {}
            if not videolar:
                bind['not'] = 'video yok: animatik-v06-{yatay,dikey}.mp4 çekilince ya da --video ile yeniden çalıştırın'
            for kay in videolar:
                if not kay.exists():
                    bind[kay.name] = 'kaynak yok'
                    continue
                hedef_mp4 = kay.with_name(kay.stem + '-sesli' + sonek + '.mp4')
                subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(kay), '-i', str(dosya['karisim']),
                                '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', str(SR),
                                '-movflags', '+faststart', str(hedef_mp4)], check=True)
                lag, sure = gecikme_olc(ff, hedef_mp4, cikti, gecici)
                bind[kay.name] = dict(dosya=hedef_mp4.name, ses_kaymasi_ms=lag, ses_suresi_sn=sure, video_suresi_sn=video_suresi(ff, kay))
            cizelge['bindirme'] = bind
            print(json.dumps(dict(bindirme=bind), ensure_ascii=False))
        dosya['cizelge'].write_text(json.dumps(cizelge, ensure_ascii=False, indent=1, default=_json_tip), encoding='utf-8')
        print('yazıldı:', *[p.name for p in dosya.values()])


if __name__ == '__main__':
    main()
