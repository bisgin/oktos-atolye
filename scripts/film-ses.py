# -*- coding: utf-8 -*-
"""
film-ses.py: Oktos tanıtım filmi (v06; süre ve sahne aralıkları sayfadan, ~61 sn) için müzik ve nesne sesleri; tamamen kendi sentezimiz.

Amaç
  - Kanca: her yüz değişiminde bir piyano notası ("dın"), notalar v1-kanca.js `sure` dizisinden; A'da Dmaj9'a çözülür.
  - Sahne başına küçük bir piyano müziği (Re majör, 150 BPM, vuruş 24 kare), sahnelerin ses işaretlerine oturur:
    konuşmada asılı nota, düşüncede balon noktaları + akor, sessizlikte müzik susar, 'tik' ve 'zar' anında nesne sesi.
  - Tını: şık, tok, keskin; kırıcı, yorucu ve distorsiyonlu değil. Hazır müzik ya da ses örneği yok (indirme yok,
    lisans derdi yok): piyano ve nesne sesleri sayısal olarak üretilir.

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
EQ = dict(hp=35.0, alt_raf_db=2.0, alt_raf_f=170.0, sert_db=-3.0, sert_f=3200.0, sert_q=0.9, lp=12000.0)

# Nesne sesleri (kendi sentezimiz): kısa, tok, yumuşak tepe. mod: (frekans Hz, sönüm sn, genlik), gur: (merkez Hz, sönüm sn, pay)
# db: aynı karedeki mp piyano notasının tepesine göre düzey. Hepsi 3 kHz'te yumuşak kesilir (sertlik bandı yorulmasın).
NESNE_TIP = {
    'tok':     dict(mod=[(230, .040, 1.0), (590, .020, .55), (1120, .011, .30), (1690, .007, .15)], gur=(1900, .0025, .9), db=1, bant=300),
    'plastik': dict(mod=[(410, .026, 1.0), (960, .014, .55), (1530, .008, .25)], gur=(2000, .0025, .8), db=1, bant=300),
    'kulp':    dict(mod=[(690, .012, 1.0), (1340, .007, .45), (310, .015, .35)], gur=(2100, .0020, .9), db=-1, bant=1000),
    'metal':   dict(mod=[(1250, .070, .45), (1830, .050, .22), (2560, .030, .06), (420, .020, .55)], gur=(2200, .0020, .5), db=-3, bant=1000),
    'cam':     dict(mod=[(1420, .090, .40), (2050, .060, .12), (610, .020, .60)], gur=(2300, .0020, .4), db=-3, bant=1000),
    'toprak':  dict(mod=[(140, .060, 1.0), (310, .030, .45), (620, .015, .20)], gur=(900, .0200, .7), db=1, bant=300),
    'kumas':   dict(mod=[(250, .025, .50), (680, .012, .25)], gur=(1300, .0120, .9), db=-4, bant=300),
    'darbe':   dict(mod=[(82, .130, 1.0), (131, .090, .70), (226, .050, .40), (480, .022, .18)], gur=(700, .0200, .6), db=3, bant=300),
    'kemik':   dict(mod=[(960, .009, 1.0), (1480, .006, .55), (2150, .004, .20), (320, .014, .45)], gur=(1900, .0020, .8), db=1, bant=1000),
    'pit':     dict(mod=[(1480, .010, 1.0), (2220, .005, .20), (740, .012, .40)], gur=(1900, .0015, .5), db=-6, bant=1000),  # ölçü "pıt"
}
NESNE_TIP['zar'] = dict(NESNE_TIP['kemik'], db=2)    # zar: kemik tıkırtılarından seken bir öbek
# Nesne sesi çevresindeki müziğe göre ayarlanır (miks): işareti tek başına taşıyorsa kendi bandında müziğin 6 dB üstü,
# bir notaya eşlik ediyorsa 4 dB altı; hazır düzeyden hiç kısılmaz, en çok +15 dB açılır.
NESNE_FARK = dict(tek=6.0, eslik=-4.0)
NESNE_EN_COK_DB = 15.0

KOK = Path(__file__).resolve().parent.parent
CIKIS = KOK / '.impeccable' / 'ses'
FILM = KOK / '.impeccable' / 'film'
TANITIM = KOK / 'lab' / 'tanitim'
KANCA_JS = TANITIM / 'film' / 'v1-kanca.js'
KALABALIK_JS = TANITIM / 'film' / 's5-kalabalik.js'
KADRO_JSON = TANITIM / 'film' / 'kadro.json'
ISARET_JSON = CIKIS / 'isaretler.json'
VARSAYILAN_VIDEOLAR = [FILM / 'animatik-v06-yatay.mp4', FILM / 'animatik-v06-dikey.mp4']

KADRO = json.loads(KADRO_JSON.read_text(encoding='utf-8'))
# Film kareleri sayfadan gelir (isaretler.json: toplam_kare, sahneler = FİLM kareleri, sahne_yerlesimi.kaydir, vuruslar);
# sahneler uzayabildiği için kadro.json'daki toplam ve sahneler İÇ karelerdir ve yalnız yedektir. isaretleri_oku() günceller.
TOPLAM_KARE = int(KADRO['toplam'])
SAHNELER = {ad: (int(a), int(b)) for ad, (a, b) in KADRO['sahneler'].items()}
SAHNE_KAYDIR = {}          # modül → iç kare + kaydir = film karesi
VURUSLAR = {}              # vuruş no → (k0, k1) film karesi
# s6-final işaret bırakmazsa plan varsayımları (finalin başına göre): logo grupları (köşe, yan, alt, çarpı, halka; aynalı
# çiftler aynı karede), doruk logo tamamlanınca, OKTOS, slogan; tutuş sona dek.
FINAL_VARSAYIM = dict(gruplar=[84, 132, 180, 228, 276], doruk=300, slogan=348)
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


def adim_yukari(m):
    """Re majör dizisinde bir üst derece."""
    m += 1
    while m % 12 not in _RE_MAJOR:
        m += 1
    return m


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
    """s6-final işaretleri yoksa (ya da doruk/slogan eksikse) plan varsayımlarını ekler."""
    a, b = SAHNELER['s6-final']
    s6 = [i for i in isaretler if a <= i['kare'] <= b]
    eklenen = []
    doruk = next((i['kare'] for i in s6 if i['tur'] == 'vurgu' and i.get('ad') == 'doruk'), a + FINAL_VARSAYIM['doruk'])
    if not any(i['tur'] == 'tik' and i['kare'] < doruk for i in s6):
        eklenen += [dict(kare=a + g, tur='tik', ad='logo grubu', varsayim=True) for g in FINAL_VARSAYIM['gruplar'] if a + g < doruk]
    if not any(i['tur'] == 'vurgu' and i.get('ad') == 'doruk' for i in s6):
        eklenen.append(dict(kare=a + FINAL_VARSAYIM['doruk'], tur='vurgu', ad='doruk', varsayim=True))
    if not any(i['tur'] == 'vurgu' and i.get('ad') == 'slogan' for i in s6):
        eklenen.append(dict(kare=a + FINAL_VARSAYIM['slogan'], tur='vurgu', ad='slogan', varsayim=True))
    if not s6:
        kaynak = 'varsayım (s6-final işaret bırakmadı): kadro.json + plan v06'
    elif eklenen:
        kaynak = 's6-final işaretleri + eksikler için varsayım'
    else:
        kaynak = 's6-final işaretleri'
    tum = sorted(isaretler + eklenen, key=lambda i: (i['kare'], i['tur']))
    return tum, dict(kaynak=kaynak, varsayim=eklenen)


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
# PARTİSYON (Re majör; 150 BPM; ölçü 96 kare. Akorlar: I=Dmaj9, vi=Bm9, IV=Gmaj7/9, ii=Em9, V=A7sus4; iv=Gm(add9) ödünç)
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

    def adim_asagi(m):
        m = midi(m) - 1
        while m % 12 not in _RE_MAJOR:
            m -= 1
        return m

    # =========================================================================== KAFE: kalabalık, garson sohbette, asılı sesleniş, yüz asılır, Bm9
    a, b = S['s1-kafe']
    kon, dus, vur, tik = isr('konusma', 's1-kafe'), isr('dusunce', 's1-kafe'), isr('vurgu', 's1-kafe'), isr('tik', 's1-kafe')
    A_NOTA = midi(kisi_notasi('A', 'D4')) + 12
    k4 = vk(4, (a + 108, a + 239))[0]
    # #3 kalabalık kafe: kancanın Dmaj9'u üstünde hafif dokunuş ve A'nın sekme motifi (8-16-16-4); garson sohbette güler
    n(a + 24, 'A4', 0.26, 10, 'kafe: hafif')
    n(a + 48, 'A4', 0.36, 12, 'A motifi (kafe)'); n(a + 60, 'F#4', 0.30, 6, 'A motifi (kafe)')
    n(a + 66, 'A4', 0.32, 6, 'A motifi (kafe)'); n(a + 72, 'D5', 0.38, 20, 'A motifi (kafe)')
    for j, (o, ad) in enumerate(zip((0, 6, 12), MOTIF['garson'][1])):
        if uygun(k4 - 24 + o):
            n(k4 - 24 + o, ad, 0.28 - 0.02 * j, 5, 'garson sohbette: güler')
    # #4 el kalkar: Em9 (ii); her seslenişte asılı nota (A'nın notası), ikincisi bir adım yüksek ve V üstünde; garson kahkaha atar
    son4 = kon[1]['kare'] if len(kon) > 1 else k4 + 80
    akor(k4, ['E2', 'B2'], 0.34, son4 - k4, 'Em9: el kalkar'); akor(k4, ['G3', 'D4'], 0.26, son4 - k4, 'Em9')
    PEDAL.append((k4, son4 - 1))
    m_sesle = A_NOTA
    for j, i in enumerate(kon):
        k = i['kare']
        son = kon[j + 1]['kare'] if j + 1 < len(kon) else k + 40
        if j == 0:
            n(k, m_sesle, 0.44, son - k, '"Bakar mısınız?": asılı (A\'nın notası)', 'isaret')
        else:
            m_sesle = adim_yukari(m_sesle)
            akor(k, ['A1', 'E2'], 0.38, 40, 'A7sus4: yanıt gelmez'); akor(k, ['D4', 'G4'], 0.30, 40, 'A7sus4')
            n(k, m_sesle, 0.48, son - k, '"Bakar mısınız?!": asılı, bir adım yüksek', 'isaret')
            PEDAL.append((k, k + 59))
            for q, ad in enumerate(['D5', 'B4', 'D5', 'B4']):          # garson müşterinin şakasına kahkaha atar
                if uygun(k + 14 + 6 * q):
                    n(k + 14 + 6 * q, ad, 0.26, 4, 'garson kahkaha atar (A\'ya dönmez)')
    # El iner; sessizlikte yüz asılır (müzik susar); dirsek masaya, yanak avuçta: yalnız yumuşak tıklar
    for j, i in enumerate(tik):
        nesne(i['kare'], tik_tipi(i, 'tok'), 'kafe: ' + ('el masaya iner' if j == 0 else 'dirsek masaya, yanak avuçta'), -3.0 * min(j, 1))
    # #5 düşünce: noktalar (sessizlikte de), bulut açılınca Bm9; iç ses; sorun asılı kalır (çözülmez)
    if dus:
        k = dus[0]['kare']
        bulut = max(dusunce_motifi(k, ['F#5', 'A5', 'C#6']), sus_bitisi(k))
        akor(bulut, ['B1', 'F#2'], 0.34, b - bulut + 1, 'Bm9: QR olsa…'); akor(bulut, ['D4', 'A4', 'C#5'], 0.27, b - bulut + 1, 'Bm9')
        PEDAL.append((bulut, b))
        n(bulut + 14, 'F#4', 0.28, 22, 'iç ses'); n(bulut + 38, 'E4', 0.26, 20, 'iç ses')
    for i in vur:
        n(i['kare'], 'E5', 0.40, b - i['kare'] + 1, 'dilek halkası: asılı (Bm üstünde 11.)', 'isaret')

    # =========================================================================== ATÖLYE: D4 girişi, cetvel; grup gider; kuş bakışı, 3B vidalar, "pıt pıt"; parmakla biçimlendirme
    a, b = S['s2-atolye']
    kes, kon, tik = isr('kesme', 's2-atolye'), isr('konusma', 's2-atolye'), isr('tik', 's2-atolye')
    dus, vur = isr('dusunce', 's2-atolye'), isr('vurgu', 's2-atolye')
    B_NOTA = midi(kisi_notasi('B', 'D4'))
    k7 = vk(7, (a + 184, a + 263))[0]
    k8 = vk(8, (a + 264, a + 595))[0]
    k9 = vk(9, (a + 596, b))[0]
    giris = kon[0]['kare'] if kon and kon[0]['kare'] - a <= CAPA_YARICAP else a
    k_git = next((i['kare'] for i in kon if 'Yazıcı' in ek_metni(i)), a + 96)
    k_gel = next((i['kare'] for i in kon if 'Geliyor' in ek_metni(i)), a + 162)
    # #6–#7 pedalsız "cetvel" sekizlikleri (B motifi D F# E A); grup yürüyüp giderken inen, kısılan bir yürüyüş;
    # "Geliyorum!"dan sonra B dolaba yürür (cetvel geri gelir)
    yuruyus = ['B4', 'A4', 'G4', 'F#4', 'E4', 'D4', 'C#4', 'B3']
    dolap = ['E4', 'G4', 'F#4', 'B4', 'A3', 'D4', 'E4', 'G4']
    j, iy, idl = 0, 0, 0
    while a + 12 * j < k8 - CAPA_YARICAP - 1:
        f = giris if j == 0 else a + 12 * j
        if f < k_git:
            ad, v, et = (['D4', 'F#4', 'E4', 'A4'][j % 4] if j else B_NOTA), (0.38 if j % 2 == 0 else 0.32), 'cetvel sekizlikleri (pedalsız)'
        elif f < k_gel:
            ad, v, et = yuruyus[min(iy, 7)], 0.36 - 0.016 * iy, 'grup yürüyüp gider (inen yürüyüş)'
            iy += 1
        else:
            ad, v, et = dolap[idl % 8], (0.36 if j % 2 == 0 else 0.30), 'B dolaba yürür (cetvel)'
            idl += 1
        n(f, ad, v, 8, et)
        j += 1
    n(giris, 'D2', 0.38, 44, 'D: atölye girişi'); n(a + 48, 'G2', 0.34, k_git - a - 48, 'G')
    n(k_git, 'E2', 0.34, k_gel - k_git, 'Em: grup gider'); n(k_gel, 'D2', 0.36, max(8, k7 - k_gel), 'D: Geliyorum')
    n(k7, 'E2', 0.32, 44, 'Em: dolaba yürür'); n(k7 + 48, 'A1', 0.34, max(8, k8 - k7 - 48), 'A7sus4')
    kon8 = [i for i in kon if k8 <= i['kare'] < k9]
    for i in kon:
        k, e = i['kare'], ek_metni(i)
        if k == giris or i in kon8:
            continue                                      # sohbet: D4 girişi; organizer sözü #8'de
        if 'Geliyor' in e:
            n(k, B_NOTA + 12, 0.46, 20, '"Geliyorum!" (B\'nin notası)', 'isaret')
        elif 'Yazıcı' in e:
            n(k, 'A5', 0.38, 18, '"Yazıcı ısındı!": B3 kapıya', 'isaret')
        else:
            n(k, 'F#5', 0.40, 30, '"M8 vida… 3 tane de M6": asılı', 'isaret')
    # #8 kuş bakışı: uzanış yarım tempo (dörtlük); kulp, çekiş, dayanak; 3B vidalar yuvarlanır (pp staccato, giderek seyrek);
    # ölçü çizgisi parça parça (her parça "pıt"); ölçü sonuçları; "Bir organizer alsam… sığar mı?" asılı sus4
    akor(k8, ['B1', 'F#2'], 0.32, 34, 'Bm: kuş bakışı, uzanış'); n(k8, 'F#4', 0.34, 22, 'yarım tempo')
    n(k8 + 24, 'D4', 0.30, 12, 'yarım tempo')
    for i in tik:
        nesne(i['kare'], tik_tipi(i), 'atölye: ' + ek_metni(i).strip())
    t_cek = [i['kare'] for i in tik if 'çekmece' in ek_metni(i)]
    t_vida = [i['kare'] for i in tik if 'vida' in ek_metni(i)]
    t_pit = sorted(i['kare'] for i in tik if 'pıt' in ek_metni(i))
    vur8 = sorted(i['kare'] for i in vur if k8 <= i['kare'] < k9)
    vur9 = [i for i in vur if i['kare'] >= k9]
    if t_cek:
        kc = t_cek[0]
        olcu1 = vur8[0] if vur8 else kc + 100
        n(kc, 'E2', 0.30, olcu1 - kc, 'Em: çekmece açık')
        kv = t_vida[0] if t_vida else kc + 4
        son_v = (t_pit[0] if t_pit else olcu1) - CAPA_YARICAP - 2
        r = np.random.default_rng(TOHUM + 7)
        f, ara = kv + 6, 4.0
        while f < son_v:
            u = (f - kv) / max(1, son_v - kv)
            if uygun(f):
                n(f, str(r.choice(['B4', 'D5', 'E5', 'G5', 'A5', 'B5'])), 0.26 - 0.08 * u, 3, '3B vidalar yuvarlanır: pp staccato', 'isaret')
            ara *= 1.18
            f += int(round(ara))
    # Ölçü sonuçları: ilk kenar B4 (Gmaj7), ikinci kenar G5; soru A7sus4 üstünde asılı (söz ile ikinci ölçü 4 kare arayla:
    # akor söze, ikinci ölçü kendi notasına)
    k_soru = kon8[0]['kare'] if kon8 else (vur8[1] if len(vur8) > 1 else None)
    for j, k in enumerate(vur8):
        if j == 0:
            n(k, 'B4', 0.38, 24, 'ölçü: ilk kenar', 'isaret')
            akor(k, ['G2', 'D3'], 0.28, (k_soru or k + 30) - k, 'Gmaj7: ölçülür')
        else:
            n(k, 'G5', 0.38, 20, 'ölçü: ikinci kenar', 'isaret')
    if k_soru is not None:
        akor(k_soru, ['A1', 'E2'], 0.36, k9 - k_soru, 'A7sus4: buraya sığar mı? (asılı)'); akor(k_soru, ['G3', 'D4'], 0.30, k9 - k_soru, 'A7sus4')
        PEDAL.append((k_soru, k9 - 1))
    for i in kon8:
        n(i['kare'], B_NOTA + 12, 0.42, k9 - i['kare'], '"Bir organizer alsam… sığar mı?": asılı', 'isaret')
    # #9 düşünce: noktalar → Gmaj9; parmakla inceltir (daralan iniş), uzatır (yükselen çıkış); düşüncede asılı (sessizlik)
    if dus:
        bulut = dusunce_motifi(dus[0]['kare'], ['B4', 'D5', 'F#5'])
        akor(bulut, ['G2', 'D3'], 0.34, b - bulut + 1, 'Gmaj9: organizeri biçimlendirir'); akor(bulut, ['F#4', 'A4'], 0.26, b - bulut + 1, 'Gmaj9')
        PEDAL.append((bulut, b))
    for i in vur9:
        k, e = i['kare'], ek_metni(i)
        if 'incel' in e:
            adlar, et = ['E5', 'D5', 'B4'], 'parmakla inceltir (daralan iniş)'
        elif 'uzat' in e:
            adlar, et = ['B4', 'D5', 'E5', 'A5'], 'parmakla uzatır (yükselen çıkış)'
        else:
            adlar, et = ['A4'], 'vurgu'
        for q, ad in enumerate(adlar):
            if q == 0 or uygun(k + 4 * q, k):
                n(k + 4 * q, ad, 0.38 - 0.02 * q, 8, et, 'isaret')

    # =========================================================================== BALKON: ayna; kapıdan güneşe; çiçekler; düşte parmakla biçimlendirme
    a, b = S['s3-balkon']
    kes, kon, tik = isr('kesme', 's3-balkon'), isr('konusma', 's3-balkon'), isr('tik', 's3-balkon')
    dus, vur = isr('dusunce', 's3-balkon'), isr('vurgu', 's3-balkon')
    D_NOTA = kisi_notasi('D', 'B4')
    k11 = vk(11, (a + 144, a + 251))[0]
    k12 = vk(12, (a + 252, a + 355))[0]
    k13 = vk(13, (a + 356, b))[0]
    t_dus = dus[0]['kare'] if dus else b
    # #10 ayna: Dmaj9 → Bm9 → Gmaj7, D motifi legato; ceket ve küpe tıkları (küpede iki ışıltı)
    akor(a, ['D2', 'A2'], 0.40, 96, 'Dmaj9: sabah, ayna'); akor(a, ['F#3', 'C#4'], 0.28, 96, 'Dmaj9')
    PEDAL.append((a, a + 95))
    n(a, 'F#4', 0.38, 24, 'D motifi (legato)'); n(a + 24, 'A4', 0.36, 12, 'D motifi'); n(a + 36, 'B4', 0.38, 12, 'D motifi')
    n(a + 48, 'D5', 0.42, 36, 'D motifi'); n(a + 84, 'C#5', 0.34, 12, 'D motifi')
    akor(a + 96, ['B1', 'F#2'], 0.36, 48, 'Bm9'); n(a + 96, 'D5', 0.36, 12, 'legato'); n(a + 108, 'C#5', 0.32, 12, 'legato')
    n(a + 120, 'B4', 0.34, 24, 'legato'); akor(a + 120, ['G2', 'D3'], 0.32, max(8, k11 - a - 120), 'Gmaj7')
    PEDAL.append((a + 96, k11 - 1))
    for i in tik:
        if i['kare'] > t_dus:
            continue                                      # düşteki biçimlenmeler aşağıda (nota + kumaş)
        nesne(i['kare'], tik_tipi(i), 'balkon: ' + ek_metni(i).strip())
        if 'küpe' in ek_metni(i):
            n(i['kare'] + 4, 'D6', 0.16, 4, 'küpe ışıltısı'); n(i['kare'] + 8, 'F#6', 0.14, 4, 'küpe ışıltısı')
    # #11 kapı ve güneş: kapıya legato yürüyüş (Em9); kol (tık); ışık dolar (Gmaj9 açılır, yükselen pırıltı);
    # beyazdan balkona; güneş yüzüne vurur: Dmaj9 sıcak ve açık
    t_kapi = next((i['kare'] for i in tik if 'kapı' in ek_metni(i)), k11 + 36)
    v_isik = next((i['kare'] for i in vur if 'ışık' in ek_metni(i)), t_kapi + 6)
    v_gunes = next((i['kare'] for i in vur if 'güneş' in ek_metni(i)), k11 + 72)
    kes11 = [i['kare'] for i in kes if v_isik < i['kare'] < v_gunes]
    akor(k11, ['E2', 'B2'], 0.30, t_kapi - k11, 'Em9: kapıya yürür'); akor(k11, ['G3'], 0.22, t_kapi - k11, 'Em9')
    for j, ad in enumerate(['B4', 'A4', 'G4', 'A4', 'B4', 'D5']):
        f = k11 + 12 * j
        if f >= t_kapi - CAPA_YARICAP:
            break
        n(f, ad, 0.32, 14, 'kapıya yürür (legato)')
    PEDAL.append((k11, t_kapi - 1))
    son_isik = (kes11[0] if kes11 else v_gunes)
    akor(v_isik, ['G2', 'D3', 'F#4', 'A4'], 0.32, son_isik - v_isik, 'Gmaj9: ışık dolar')
    for j, ad in enumerate(['D5', 'F#5', 'A5', 'B5']):
        f = v_isik + 4 * j
        if j == 0 or (f < son_isik - CAPA_YARICAP and uygun(f, v_isik)):
            n(f, ad, 0.34 - 0.03 * j, 10, 'ışık dolar: yükselen pırıltı', 'isaret' if j == 0 else 'muzik')
    PEDAL.append((v_isik, son_isik - 1))
    for k in kes11:
        n(k, 'E5', 0.32, 10, 'beyazdan balkona')
    akor(v_gunes, ['D2', 'A2'], 0.38, k12 - v_gunes, 'Dmaj9: güneş'); akor(v_gunes, ['F#3', 'E4', 'A4'], 0.30, k12 - v_gunes, 'Dmaj9')
    n(v_gunes, 'F#5', 0.36, k12 - v_gunes, 'güneşte gözlerini kapar, gülümser', 'isaret')
    PEDAL.append((v_gunes, k12 - 1))
    # #12 çiçekler: Gmaj9 ve D'nin notası; "Çiçeklerim çok güzel…" asılı; klişe saksılar: tek inen nota; topak; kaş iner (ödünç iv)
    akor(k12, ['G2', 'D3'], 0.36, 48, 'Gmaj9: çiçekler'); akor(k12, ['F#3', 'B3'], 0.26, 48, 'Gmaj9')
    n(k12, D_NOTA, 0.36, 26, 'D\'nin notası')
    PEDAL.append((k12, k12 + 47))
    for i in kon:
        if k12 <= i['kare'] < k13:
            n(i['kare'], 'F#5', 0.36, 38, '"Çiçeklerim çok güzel…": legato, asılı', 'isaret')
    t_topak = next((i['kare'] for i in tik if 'toprak' in ek_metni(i)), k12 + 80)
    n(k12 + 48, 'A3', 0.34, max(8, t_topak - k12 - 50), 'klişe saksılar: tek inen nota')
    kas = t_topak + 6
    if kas < k13 - 8:
        akor(kas, ['G2', 'A#3', 'D4'], 0.26, k13 - kas, 'Gm(add9) ödünç iv: kaş iner'); n(kas, 'A4', 0.28, k13 - kas, 'kaş iner')
    # #13 düş: noktalar → Gmaj7/9; parmak tutamacı çeker (iki notalık çekiş), saksı oturur (yükselen nota + kumaş);
    # düş söner, sıkılır (Bm9); "Keşke böyle bir aracım olsaydı…" asılı
    v_sik = next((i['kare'] for i in vur if 'sıkıl' in ek_metni(i)), b - 100)
    if dus:
        bulut = dusunce_motifi(t_dus, ['D5', 'F#5', 'A5'])
        akor(bulut, ['G2', 'D3'], 0.36, v_sik - bulut, 'Gmaj7/9: düşte saksı biçimlenir'); akor(bulut, ['F#4', 'A4', 'B4'], 0.27, v_sik - bulut, 'Gmaj7/9')
        PEDAL.append((bulut, v_sik - 1))
        giy = [i['kare'] for i in tik if t_dus < i['kare'] < v_sik]
        for j, k in enumerate(giy):
            hedef = midi(['B4', 'D5', 'E5', 'F#5'][min(j, 3)])
            for q, f in enumerate((k - 8, k - 4)):
                if uygun(f, k):
                    n(f, adim_asagi(hedef) if q else adim_asagi(adim_asagi(hedef)), 0.22, 4, 'parmak tutamacı çeker', 'isaret')
            n(k, hedef, 0.32 + 0.03 * j, 22, f'saksı biçimlenir {j + 1}', 'isaret')
            nesne(k, 'kumas', 'balkon: saksı oturur', rol='eslik')
    akor(v_sik, ['B1', 'F#2'], 0.30, b - v_sik + 1, 'Bm9: düş söner, sıkılır'); akor(v_sik, ['D4', 'F#4'], 0.24, b - v_sik + 1, 'Bm9')
    PEDAL.append((v_sik, b))
    for i in kon:
        if i['kare'] >= v_sik:
            n(i['kare'], 'A5', 0.36, b - i['kare'] + 1, '"Keşke böyle bir aracım olsaydı…": asılı', 'isaret')
    for i in vur:
        if i['kare'] not in (v_isik, v_gunes, v_sik):
            n(i['kare'], 'A4', 0.32, 24, 'balkon: vurgu', 'isaret')

    # =========================================================================== FRP: sohbet; zar sallanır, atış; 3B zarlar; "Keşke…"; dönen zarlar, taş mı reçine mi
    a, b = S['s4-frp']
    kes, kon, tik, zar = isr('kesme', 's4-frp'), isr('konusma', 's4-frp'), isr('tik', 's4-frp'), isr('zar', 's4-frp')
    dus, vur = isr('dusunce', 's4-frp'), isr('vurgu', 's4-frp')
    E_NOTA = midi(kisi_notasi('E', 'A4'))
    kay4 = SAHNE_KAYDIR.get('s4-frp', 0)
    k15 = vk(15, (a + 136, a + 263))[0]
    k16 = vk(16, (a + 264, a + 503))[0]
    k17 = vk(17, (a + 504, b))[0]
    k_salla = min(max(a + 24, 1611 + kay4), k15 - 40)        # s4-frp.js: E zarları sallar (iç k1611), atar (iç k1656)
    k_atis = min(max(k_salla + 20, 1656 + kay4), k15 - 8)
    sus4 = [(s, e) for s, e in SUS if a <= s <= b]
    # #14 sohbet: G üstünde konuşkan staccato; E2 masaya vurur (darbe); zarlar sallanır: A pedalı, tek notalar sıklaşır; atış
    akor(a, ['G2', 'D3'], 0.30, k_salla - a, 'Gmaj9: sohbet')
    sohbet = ['B4', 'D5', 'A4', 'B4', 'G4', 'A4', 'E4', 'G4']
    for j in range(max(0, (k_salla - a - 4) // 12)):
        n(a + 12 * j, sohbet[j % 8], 0.30 if j % 2 == 0 else 0.25, 5, 'sohbet: konuşkan staccato')
    for i in tik:
        if i['kare'] < k15:
            nesne(i['kare'], 'darbe', 'E2 masaya vurur, kâğıt figürler sallanır', -4)
    akor(k_salla, ['A1', 'E2'], 0.32, k_atis - k_salla, 'A (V): zarlar sallanır, gerilim')
    for o, ad, v, d in [(0, E_NOTA, 0.32, 10), (12, E_NOTA, 0.32, 8), (22, 'C#5', 0.34, 6), (30, 'D5', 0.34, 5), (36, 'E5', 0.36, 4), (41, 'F#5', 0.36, 4)]:
        if k_salla + o < k_atis - 2:
            n(k_salla + o, ad, v, d, 'gerilim: tek notalar')
    n(k_atis, 'G5', 0.34, 8, 'atış: tek nota'); n(k_atis, 'B1', 0.32, 8, 'atış')
    # #15 3B yakın plan (kesme): Bm boşluğu; her çarpma kemik tıkırtısı (seyrek olanı seken öbek); çarpmalar üstünde
    # yavaşlayan arpej (yek); kâğıt şövalye devrilir; zarlar durunca nefes (sessizlik); "hep yek": inen iç çekiş
    s15 = next((s for s, e in sus4 if k15 <= s < k16), k16)
    e15 = next((e for s, e in sus4 if k15 <= s < k16), k16)
    akor(k15, ['B1', 'F#2'], 0.28, s15 - k15, 'Bm: 3B yakın plan')
    zk = sorted(z['kare'] for z in zar)
    for z in zk:
        yogun = any(0 < abs(z - w) <= 12 for w in zk)
        nesne(z, 'kemik' if yogun else 'zar', 'zar çarpar' if yogun else 'zar tıkırtısı')
    t15 = [i['kare'] for i in tik if k15 <= i['kare'] < k16]
    z15 = [z for z in zk if k15 <= z < k16 and all(abs(z - t) > CAPA_YARICAP for t in t15)]   # tıkla çakışan çarpma arpejsiz
    for j, z in enumerate(z15[::2][:4]):
        n(z, ['B3', 'D4', 'F#4', 'A4'][j], 0.36 - 0.02 * j, 24, 'arpej: zarlar yavaşlar (yek)', 'isaret')
    for i in tik:
        if k15 <= i['kare'] < k16:
            nesne(i['kare'], 'kumas', 'kâğıt şövalye devrilir')
    if e15 < k16 - 20:
        n(e15 + 6, 'F#4', 0.28, 12, 'hep yek: söylenirler'); n(e15 + 18, 'D4', 0.26, 16, 'hep yek: söylenirler')
    # #16 hep yek (Bm9) → E3: "Keşke piyonlarımız gerçek olsa…" Em9 + asılı D5 → E: "Keşke FRP zarlarımız olsa…" Gmaj9 + asılı A4
    kon16 = sorted(i['kare'] for i in kon if k16 <= i['kare'] < k17)
    ilk16 = kon16[0] if kon16 else k17
    akor(k16, ['B1', 'F#2'], 0.32, ilk16 - k16, 'Bm9: hep yek'); akor(k16, ['D4', 'A4'], 0.24, ilk16 - k16, 'Bm9')
    PEDAL.append((k16, ilk16 - 1))
    for i in tik:
        if k16 <= i['kare'] < k17:
            nesne(i['kare'], 'kumas', 'kâğıt figür boynunu büker')
    for j, k in enumerate(kon16):
        son = kon16[j + 1] if j + 1 < len(kon16) else k17
        if j == 0:
            akor(k, ['E2', 'B2', 'G3'], 0.32, son - k, 'Em9: "Keşke piyonlarımız gerçek olsa…"')
            n(k, 'D5', 0.42, son - k, 'E3: "Keşke piyonlarımız…": asılı', 'isaret')
        else:
            akor(k, ['G2', 'D3', 'B3'], 0.32, son - k, 'Gmaj9: dilek')
            n(k, E_NOTA, 0.42, son - k, 'E: "Keşke FRP zarlarımız olsa…": asılı (E\'nin notası)', 'isaret')
        PEDAL.append((k, son - 1))
    # #17 çene (vurgu): A7sus4; düşünce: noktalar → Dmaj9 arpeji (zarlar döner); her zar belirince D5 (dın dın…);
    # "Taştan mı olsa…" asılı; taş: Em9 alçak + tok; reçine: Gmaj9 + cam gibi pırıltı; sorun asılı kalır (IV'te biter)
    d17 = dus[0]['kare'] if dus else k17 + 6
    vur17 = sorted(i['kare'] for i in vur if i['kare'] >= k17)
    v_cene = next((v for v in vur17 if v <= d17), None)
    sonra = [v for v in vur17 if v > d17]
    v_tas = sonra[0] if sonra else None
    v_rec = sonra[1] if len(sonra) > 1 else None
    if v_cene is not None:
        akor(v_cene, ['A1', 'E2'], 0.30, d17 - v_cene + 10, 'A7sus4: E elini çenesine götürür'); akor(v_cene, ['D4', 'G4'], 0.24, d17 - v_cene + 10, 'A7sus4')
        PEDAL.append((v_cene, d17 + 9))
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
    if dus:
        bulut = dusunce_motifi(d17, ['F#5', 'A5', 'C#6'])
        son_b = v_tas if v_tas else b
        akor(bulut, ['D2', 'A2'], 0.32, son_b - bulut, 'Dmaj9: zarlar döner')
        for q, ad in enumerate(['D4', 'F#4', 'A4']):
            f = bulut + 4 + 6 * q
            if uygun(f) and (not dizi_tik or f < dizi_tik[0] - CAPA_YARICAP):
                n(f, ad, 0.30, 6, 'arpej: zarlar döner')
        PEDAL.append((bulut, (dizi_tik[0] if dizi_tik else son_b) - 1))
    for q, k in enumerate(dizi_tik):
        n(k, 'D5', 0.48, 5, f'zar {q + 1} belirir: dın', 'isaret')
    for k in [i['kare'] for i in kon if i['kare'] >= k17]:
        n(k, 'E5', 0.40, (v_tas or b) - k, '"Taştan mı olsa…": asılı', 'isaret')
    if v_tas:
        akor(v_tas, ['E2', 'B2', 'G3'], 0.36, (v_rec or b) - v_tas, 'Em9: taş')
        nesne(v_tas, 'tok', 'taş', rol='eslik')
        PEDAL.append((v_tas, (v_rec or b + 1) - 1))
    if v_rec:
        akor(v_rec, ['G2', 'D3', 'B3', 'F#4'], 0.30, b - v_rec + 1, 'Gmaj9: reçineden mi?')
        for q, ad in enumerate(['A5', 'B5', 'D6']):
            f = v_rec + 4 * q
            if q == 0 or uygun(f, v_rec):
                n(f, ad, 0.34 - 0.04 * q, 10, 'reçine: cam gibi pırıltı', 'isaret' if q == 0 else 'muzik')
        PEDAL.append((v_rec, b))

    # =========================================================================== KALABALIK: üst üste kısa motifler, giderek toplanır
    a, b = S['s5-kalabalik']
    isr('kesme', 's5-kalabalik')
    kon, dus, vur = isr('konusma', 's5-kalabalik'), isr('dusunce', 's5-kalabalik'), isr('vurgu', 's5-kalabalik')
    sahip = kalabalik_sahipleri()
    # FRP Gmaj9'da (dilek) biter; kalabalık vi'dan açılır
    akor(a, ['B1', 'F#2'], 0.34, 96, 'Bm9: kafalar alttan çıkar'); akor(a, ['D4', 'F#4'], 0.26, 96, 'Bm9')
    n(a, 'B4', 0.34, 40, 'kesme: kalabalık')
    PEDAL.append((a, a + 95))
    dus_k = [i['kare'] for i in dus]
    kon_k = [i['kare'] for i in kon]
    ilk_fikir = dus_k[0] if dus_k and (not kon_k or dus_k[0] < kon_k[0]) else None
    if ilk_fikir is not None:
        dusunce_motifi(ilk_fikir, ['D5', 'F#5', 'A5'], hizli=True)
    for k in kon_k:
        n(k, 'A4', 0.40, 60, '"Bunu canlandırabilir miyiz?": asılı', 'isaret')
        if uygun(k + 46):
            n(k + 46, 'F#5', 0.24, 20, 'yankı')
    fikirler = [k for k in dus_k if k != ilk_fikir]
    k_keske = next((i['kare'] for i in vur if 'dilek' in ek_metni(i)), vur[0]['kare'] if vur else a + 216)
    k_devir = next((i['kare'] for i in vur if i['kare'] > k_keske), b - 39)
    if fikirler:
        akor(fikirler[0], ['E2', 'B2'], 0.30, k_keske - fikirler[0], 'Em9: kalabalık dolar')
        akor(fikirler[0], ['G3', 'D4'], 0.22, k_keske - fikirler[0], 'Em9')
    kanca_sayac = 0
    J = len(fikirler)
    for j, k in enumerate(fikirler):
        kod = sahip.get(k, (None, None))[0]
        mot = SAHIP_MOTIF.get(kod, 'kanca' if kod else ['kanca', 'A', 'B', 'D', 'E', 'din'][j % 6])
        ofs, adlar = MOTIF[mot]
        if mot == 'kanca':
            adlar = list(KANCA_CIFTLERI[kanca_sayac % len(KANCA_CIFTLERI)]); kanca_sayac += 1
        # Kayıt: önce dağınık (tiz / orta), sonra orta ses alanında toplanır; dilekten sonra kalabalığın üstüne çıkar
        if k > k_keske:
            kaydir = 12 if midi(adlar[0]) < midi('D5') else 0
        else:
            kaydir = (12 if j % 2 == 0 else 0) if j < 0.4 * J else 0
        v0 = 0.30 + 0.10 * j / max(1, J - 1) + (0.10 if k > k_keske else 0.0)
        for q, (o, ad) in enumerate(zip(ofs, adlar)):
            f = k + o
            if q and not uygun(f, k):
                continue
            m = midi(ad) + kaydir
            while m > 84:
                m -= 12
            while m < 57:
                m += 12
            sure = (ofs[q + 1] - o) if q + 1 < len(ofs) else 10
            n(f, m, v0 * 0.9 ** q, max(3, sure), f'fikir: {kod or "?"} ({mot} motifi)', 'isaret')
    for i in vur:
        k = i['kare']
        if k == k_keske:
            # Yarım vuruşluk hep birlikte vurgu; sonra yalnız bas çınlar, son fikirlerin motifleri duyulsun
            akor(k, ['G1', 'G2'], 0.44, k_devir - k, '"Keşke şöyle olsa…": hep birlikte, Gmaj9')
            akor(k, ['D3', 'B3'], 0.34, VURUS // 2, 'Gmaj9')         # orta-tiz boş: hemen ardından gelen fikirler duyulsun
            n(k, 'D5', 0.44, VURUS // 2, 'kalabalığın dileği', 'isaret')
            PEDAL.append((k, k + VURUS // 2 - 1))
        elif k == k_devir:
            akor(k, ['A1', 'E2'], 0.40, b - k + 1, 'A7sus4: devir, balonlar kenara')
            dizi(k, ['D4', 'E4', 'G4', 'A4', 'D5'], 6, 0.30, 0.38, 6, 'balonlar kenara süzülür', 'isaret')
            PEDAL.append((k, b))
        else:
            n(k, 'A4', 0.34, 24, 'vurgu', 'isaret')

    # =========================================================================== FINAL: logo kenar kenar, DORUK, Dadd9, tık
    a, b = S['s6-final']
    f_tik, f_vur, f_nota = isr('tik', 's6-final'), isr('vurgu', 's6-final'), isr('nota', 's6-final')
    isr('kesme', 's6-final')
    doruk = next((i['kare'] for i in f_vur if i.get('ad') == 'doruk'), FINAL_VARSAYIM['doruk'])
    slogan = next((i['kare'] for i in f_vur if i.get('ad') == 'slogan'), FINAL_VARSAYIM['slogan'])
    gruplar = sorted({i['kare'] for i in f_tik if i['kare'] < doruk})
    sonra_tik = sorted({i['kare'] for i in f_tik if i['kare'] >= doruk})
    cizgi = ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5']
    notalar = cizgi[-len(gruplar):] if 0 < len(gruplar) <= len(cizgi) else cizgi + [cizgi[-1]] * max(0, len(gruplar) - len(cizgi))
    ustler = [['G3', 'B3', 'D4'], ['E3', 'G3', 'B3'], ['D4', 'E4', 'G4'], ['C#4', 'E4', 'G4']]   # G/A → Em/A → A7sus4 → A7
    ilk = gruplar[0] if gruplar else doruk
    akor(a, ['A1', 'E2'], 0.32, ilk - a, 'A (V) pedalı: balonlar söner'); akor(a, ustler[0], 0.24, ilk - a, 'G/A')
    PEDAL.append((a, ilk - 1))
    G = len(gruplar)
    for j, g in enumerate(gruplar):
        son = gruplar[j + 1] if j + 1 < G else doruk
        u = j / max(1, G - 1)
        n(g, notalar[j], 0.40 + 0.10 * u, son - g, f'logo grubu {j + 1}', 'isaret')
        n(g, 'A1', 0.30 + 0.08 * u, son - g, 'A bas')
        akor(g, ustler[min(3, int(round(u * 3)))], 0.24 + 0.08 * u, son - g, 'kabaran üst sesler')
        PEDAL.append((g, son - 1))
    # DORUK: logo tamamlanır; Dmaj9 geniş açılım (finalin en yüksek anı). Çift bas tepeyi büyütür ama yüksekliğe az katar:
    # D1 ve D2 geri, yükseklik orta-tiz seslerden gelir (sınırlayıcı az çalışsın). OKTOS harfleri geliyorsa orta ve üst
    # sesler keskin bırakılır (pedal harflere dek): harf notaları çınlayan akorun altında kalmasın; bas tuşta kalır.
    harfler = [k for k in sonra_tik if k < slogan]
    ust_sure = (harfler[0] - doruk - 2) if harfler else slogan - doruk
    akor(doruk, ['D1'], 0.22, slogan - doruk, 'DORUK: logo'); akor(doruk, ['D2'], 0.36, slogan - doruk, 'DORUK: logo')
    akor(doruk, ['A2', 'F#3'], 0.38, slogan - doruk, 'DORUK: logo'); akor(doruk, ['C#4', 'E4', 'A4'], 0.40, ust_sure, 'DORUK: logo')
    n(doruk, 'D5', 0.54, ust_sure, 'DORUK: logo', 'isaret'); n(doruk, 'F#5', 0.50, ust_sure, 'DORUK: logo')
    n(doruk, 'A5', 0.44, ust_sure, 'DORUK: logo')
    PEDAL.append((doruk, doruk + ust_sure - 1 if harfler else slogan - 1))
    # OKTOS harf harf: her harf tıkı Dmaj9'dan inen bir nota (çözülmeye iniş); harf işareti yoksa iki notalık iniş
    inis = ['B5', 'A5', 'F#5', 'E5', 'D5', 'B4', 'A4', 'F#4']     # 6.'dan toniğe pentatonik iniş (ilk harf doruğun tellerinde değil)
    if harfler:
        for j, k in enumerate(harfler):
            n(k, inis[min(j, len(inis) - 1)], 0.46 - 0.015 * j, 14, f'OKTOS harf {j + 1}: çözülmeye iniş', 'isaret')
    else:
        for f, ad, v in [(doruk + 24, 'E5', 0.32), (doruk + 36, 'D5', 0.30)]:
            if f < slogan - CAPA_YARICAP and uygun(f):
                n(f, ad, v, 12, 'OKTOS: çözülmeye iniş')
    # Slogan: Dadd9 çözülme; mürekkep damlaları konarken yumuşak pentatonik damla notaları (Dadd9'un tutulan
    # telleri dışında); slogan oturunca tek "tık"; tutuş, son 0,5 sn kararma
    otur = next((i['kare'] for i in f_tik if 'otur' in ek_metni(i)), None)
    damla = sorted({k for k in sonra_tik if k >= slogan and k != otur})
    akor(slogan, ['D2', 'A2'], 0.34, b - slogan + 1, 'Dadd9: çözülme'); akor(slogan, ['E4', 'F#4', 'A4', 'D5'], 0.28, b - slogan + 1, 'Dadd9')
    DAMLA = ['A5', 'E5', 'F#5', 'B5', 'E5', 'A5', 'F#5', 'B5']
    for j, k in enumerate(damla):
        n(k, DAMLA[j % len(DAMLA)], 0.34 - 0.01 * j, 10, f'slogan damlası {j + 1}', 'isaret')
    tik_k = otur if otur is not None else slogan
    nesne(tik_k, 'tok', 'slogan oturur: tek tık', -3)
    # Akor tuşta; pedal damlalar boyunca kalkık (her damla ayrı duyulsun), tık ile sona dek basılı
    if damla and damla[0] > slogan + 1:
        PEDAL.append((slogan, damla[0] - 1))
    PEDAL.append((tik_k if damla else slogan, b))
    if not damla and tik_k + 48 < b - 30:
        n(tik_k + 48, 'A5', 0.22, b - tik_k - 48, 'son')
    for i in f_nota:
        n(i['kare'], i.get('nota', 'D5'), 0.40, 24, 'final: nota işareti', 'isaret')
    for i in f_vur:
        if i['kare'] not in (doruk, slogan):
            n(i['kare'], 'A4', 0.34, 24, 'final: vurgu', 'isaret')

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
                           isaretle_uyumlu=kanca_isaret == kesmeler),
                final=dict(final_bilgi, doruk=doruk, slogan=slogan, gruplar=gruplar))


def bolumler():
    S = SAHNELER
    return [
        dict(ad='Kanca', kare=S['v1-kanca'], icerik='Her yüz değişiminde bir nota (v1-kanca.js sure dizisi; A3→A5 pentatonik dalga, üçlemede iner); A: Dmaj9 çözülme.'),
        dict(ad='Kafe', kare=S['s1-kafe'], icerik='Kalabalık kafe: Dmaj9 üstünde hafif dokunuş, A\'nın sekme motifi, sohbetteki garsonun motifi; Em9; "Bakar mısınız?" asılı D5, ikinci sesleniş A7sus4 üstünde E5, garson kahkaha atar; sessizlikte yüz asılır (yalnız el ve dirsek tıkları); düşünce noktaları, Bm9; dilek halkasında asılı E5.'),
        dict(ad='Atölye', kare=S['s2-atolye'], icerik='D4 girişi, pedalsız cetvel sekizlikleri; M8 F#5, "Yazıcı ısındı!" A5; grup yürüyüp giderken inen, kısılan yürüyüş; "Geliyorum!" D5, dolaba cetvel; kuş bakışı yarım tempo, kulp ve dayanak tıkları, 3B vidalar yuvarlanırken giderek seyrelen pp staccato; ölçüde her parçaya "pıt"; ilk ölçü B4 (Gmaj7), "Bir organizer alsam… sığar mı?" D5 ve asılı A7sus4; düşünce Gmaj9, parmakla inceltir (iniş) ve uzatır (çıkış); düşüncede sessizlik.'),
        dict(ad='Balkon', kare=S['s3-balkon'], icerik='Ayna: legato D motifi (Dmaj9→Bm9→Gmaj7), ceket ve küpe tıkları; kapıya legato yürüyüş (Em9), kol tıkı, ışık dolar (Gmaj9, yükselen pırıltı), güneş: Dmaj9 sıcak; çiçekler Gmaj9, D\'nin notası B4, "Çiçeklerim…" F#5; klişe saksılar: tek inen A3, topak, kaş iner (ödünç Gm(add9)); düş Gmaj7/9: parmak tutamacı çeker (iki notalık çekiş), her biçimde yükselen nota; sıkılır: Bm9, "Keşke böyle bir aracım…" asılı A5.'),
        dict(ad='FRP masası', kare=S['s4-frp'], icerik='Sohbet: G üstünde konuşkan staccato, masaya vuruş; zarlar sallanır: A pedalında sıklaşan tek notalar, atışta G5; 3B yakın plan: her çarpmada kemik tıkırtısı, yavaşlayan arpej (yek), kâğıt şövalye devrilir, nefes (sessizlik), iç çekiş; Bm9; E3 "Keşke piyonlarımız…" Em9 + D5, E "Keşke FRP zarlarımız…" Gmaj9 + A4; çene A7sus4, düşünce Dmaj9 arpeji, her zar belirince D5 (dın ×5), "Taştan mı…" E5, taş Em9 + tok, reçine Gmaj9 + cam pırıltısı (IV\'te asılı biter).'),
        dict(ad='Kalabalık', kare=S['s5-kalabalik'], icerik='Bm9 boşluğu, N1\'in hızlı düşüncesi ve asılı soru; Em9 üstünde her balonda sahibinin kısa motifi (üst üste; önce tiz/orta dağınık, sonra orta ses alanında toplanır, hız artar); "Keşke şöyle olsa…" yarım vuruşluk hep birlikte Gmaj9, son fikirler kalabalığın üstüne çıkar; devirde A7sus4 ve yükselen çizgi.'),
        dict(ad='Final', kare=S['s6-final'], icerik='A (V) pedalı; her logo grubunda bir nota (yükselen), üst sesler G/A→Em/A→A7sus4→A7 kabarır; logo tamamlanınca DORUK Dmaj9 (en yüksek an, orta-üst sesler keskin bırakılır, bas çınlar); OKTOS harf harf B5→D5 pentatonik iniş; slogan: Dadd9, her mürekkep damlasında yumuşak pentatonik nota (pedalsız), slogan oturunca tek tık; tutuş, son 0,5 sn kararma.'),
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


def cal(notalar, pedal, susturma, secici, rng, hizli=False):
    N = kare_ornek(TOPLAM_KARE)
    kuru = np.zeros((2, N))
    for p in notalar:
        if not secici(p):
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


def nesne_ciz(tip, rng):
    P = NESNE_TIP[tip]
    if tip == 'zar':                     # iki-beş seken kemik tıkırtısı, giderek yakın ve kısık
        L = int(0.45 * SR)
        y = np.zeros(L)
        for t0, a in zip((0.0, 0.038, 0.070, 0.095, 0.113), (1.0, 0.5, 0.32, 0.18, 0.09)):
            c = _vurus_sesi(P, rng, jitter=0.07)
            j = int(t0 * SR)
            m = min(len(c), L - j)
            y[j:j + m] += a * c[:m]
    else:
        y = _vurus_sesi(P, rng)
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


def _nesne_ref(hizli=False):
    return float(np.max(np.abs(nota_ciz(62, 0.40, None, SR, np.random.default_rng(1), PIYANO, hizli))))


def nesne_cal(nesneler, rng, hizli=False):
    """Nesne seslerini çalar. Düzey: mp piyano notasının (D4, hız 0,40) kuru tepesine göre dB."""
    ref = _nesne_ref(hizli)
    N = kare_ornek(TOPLAM_KARE)
    kuru = np.zeros((2, N))
    for e in nesneler:
        y = nesne_ciz(e['tip'], rng) * ref * 10 ** (e['db'] / 20)
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
    bantli = {k: _yuksek_gecir(mono, k) for k in {NESNE_TIP[e['tip']]['bant'] for e in nesneler}}
    for e in nesneler:
        kesim = NESNE_TIP[e['tip']]['bant']
        y = _yuksek_gecir(nesne_ciz(e['tip'], rng).mean(axis=0) * ref * 10 ** (e['db'] / 20), kesim)
        kendi = 10 * math.log10(np.mean(y[:int(0.015 * SR)] ** 2) + 1e-20)
        s = kare_ornek(e['kare'])
        once = bantli[kesim][max(0, s - int(0.030 * SR)):max(1, s - int(0.002 * SR))]
        yatak_db = 10 * math.log10(np.mean(once ** 2) + 1e-20)
        ayar = float(np.clip(yatak_db + NESNE_FARK[e['rol']] - kendi, 0.0, NESNE_EN_COK_DB))
        e['db_ayar'] = round(ayar, 1)
        e['db'] = round(e['db'] + ayar, 1)
    return nesneler


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
    arg = ap.parse_args()
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

    # Çalım: kanca (kesme), fon (muzik), işaret notaları, serbest notalar (sessizlikte de çalar), nesne sesleri
    kuru = dict(
        kesme=cal(notalar, pedal, susturma, lambda p: p['parca'] == 'kesme', rng, arg.hizli),
        muzik=cal(notalar, pedal, susturma, lambda p: p['parca'] == 'muzik' and not p['serbest'], rng, arg.hizli),
        isaret=cal(notalar, pedal, susturma, lambda p: p['parca'] == 'isaret' and not p['serbest'], rng, arg.hizli),
        serbest=cal(notalar, pedal, susturma, lambda p: p['serbest'], rng, arg.hizli),
    )
    ir = yanki_ir(np.random.default_rng(TOHUM + 1), YANKI)
    islak = {ad: eq_uygula(yanki_uygula(x, ir, YANKI['islak_db']), EQ) for ad, x in kuru.items()}
    # Sessizlikte müzik ve yankısı susar; balon noktaları ve nesne sesleri susmaz. Dosya sonunda yumuşak kararma.
    sus = sus_zarfi(islak['muzik'].shape[1], susturma)
    for ad in ('kesme', 'muzik', 'isaret'):
        islak[ad] *= sus
    # Nesne sesleri müziğin üstüne ayarlanır (miks), sonra çalınır
    nesne_duzeyle(nesneler, sum(islak.values()), np.random.default_rng(TOHUM + 2), arg.hizli)
    islak['nesne'] = eq_uygula(yanki_uygula(nesne_cal(nesneler, np.random.default_rng(TOHUM + 2), arg.hizli), ir, YANKI['islak_db']), EQ)
    karisim = sum(islak.values())
    Lk = int(SON_KARARMA_SN * SR)
    son_zarf = np.ones(karisim.shape[1]); son_zarf[-Lk:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, Lk))
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
        baslangiclar = sorted({p['kare'] for p in notalar} | {e['kare'] for e in nesneler})
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
        nesne_bant = {e['kare']: NESNE_TIP[e['tip']]['bant'] for e in nesneler}
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
        )

        cizelge = dict(
            meta=dict(sr=SR, fps=FPS, toplam_kare=TOPLAM_KARE, sure_sn=TOPLAM_KARE / FPS, bpm=BPM, vurus_kare=VURUS,
                      olcu_kare=96, ton='Re majör (D)', tohum=TOHUM, kanca_kaynagi=P['kanca']['kaynak'],
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
            nesne_sesleri=[dict(kare=e['kare'], sn=round(kare_sn(e['kare']), 4), tip=e['tip'], rol=e['rol'], db=e['db'],
                                db_ayar=e.get('db_ayar'), etiket=e['etiket']) for e in nesneler],
            olcum=olcum, dogrulama=dogrulama,
        )
        ozet = dict(hedefler={k: (v['deger'], 'TAMAM' if v['tamam'] else 'KALDI') for k, v in hedefler.items()},
                    bant_db=olcum['tayf']['bant_db'], sinirlayici=(olcum['sinirlayici_en_cok_db'], olcum['sinirlayici_en_cok_sn']),
                    sessizlik=olcum['sessizlik'],
                    isaret=dict(toplam=dogrulama['isaret_sayisi'], eslenen=dogrulama['eslenen'], birlesen=dogrulama['birlesen'],
                                ses_yok=dogrulama['ses_yok'], sapma_1_ustu=[(d['kare'], d['tur'], d['sapma_kare']) for d in dogrulama['sapmasi_1_karedan_buyuk']],
                                zayif=dogrulama['yukselisi_3_dbden_az'], yapisan=len(P['yapisan']), dusen=len(P['dusen']), genel=P['genel']),
                    kanca_isaretle_uyumlu=P['kanca']['isaretle_uyumlu'], final=final_bilgi['kaynak'],
                    nota_sayisi=len(notalar), nesne_sayisi=len(nesneler), sure_sn=round(time.time() - t0, 1))
        print(json.dumps(ozet, ensure_ascii=False, indent=1, default=_json_tip))

        if arg.dry_run:
            print('dry-run: dosya yazılmadı. Yazılacaklar:', CIKIS / 'film-ses.wav', CIKIS / 'kesme-notalari.wav', CIKIS / 'cizelge.json')
            return
        CIKIS.mkdir(parents=True, exist_ok=True)
        wav24_yaz(CIKIS / 'film-ses.wav', cikti)
        wav24_yaz(CIKIS / 'kesme-notalari.wav', kesme_c)
        if not arg.bindirme_yok:
            bind = {}
            if not videolar:
                bind['not'] = 'video yok: animatik-v06-{yatay,dikey}.mp4 çekilince ya da --video ile yeniden çalıştırın'
            for kay in videolar:
                if not kay.exists():
                    bind[kay.name] = 'kaynak yok'
                    continue
                hedef_mp4 = kay.with_name(kay.stem + '-sesli.mp4')
                subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(kay), '-i', str(CIKIS / 'film-ses.wav'),
                                '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', str(SR),
                                '-movflags', '+faststart', str(hedef_mp4)], check=True)
                lag, sure = gecikme_olc(ff, hedef_mp4, cikti, gecici)
                bind[kay.name] = dict(dosya=hedef_mp4.name, ses_kaymasi_ms=lag, ses_suresi_sn=sure, video_suresi_sn=video_suresi(ff, kay))
            cizelge['bindirme'] = bind
            print(json.dumps(dict(bindirme=bind), ensure_ascii=False))
        (CIKIS / 'cizelge.json').write_text(json.dumps(cizelge, ensure_ascii=False, indent=1, default=_json_tip), encoding='utf-8')
        print('yazıldı:', CIKIS)


if __name__ == '__main__':
    main()
