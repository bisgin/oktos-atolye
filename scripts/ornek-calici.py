# -*- coding: utf-8 -*-
"""
ornek-calici.py: Oktos tanıtım filmi müziği için ÖRNEK ÇALICI (sampler). Gerçek çalgı kayıtlarıyla (CC0: VSCO 2 CE, VCSL,
Virtuosity Drums) film-ses.py'nin nota çizelgesini çalabilen modül, kütüphane tarayıcısı ve deneme komutu.

Amaç
  - Tarayıcı (--tara): scripts/ornek-harita.json'daki kurallarla her çalgı klasörünü tarar. Dosya adlarından, eşleme
    metinlerinden (MappingChart.txt) ve SFZ'den nota (MIDI), hız katmanı, round robin, artikülasyon / vuruş türü çıkarır;
    perdeyi ölçerek dosya adlarındaki oktav düzenini doğrular (timpanide perdeyi ölçer), seviyeleri ölçer; özeti haritanın
    her çalgısındaki "tarama" bölümüne yazar. Eşlenemeyen ve hiçbir kurala girmeyen ses dosyalarını raporlar.
  - Çalıcı (modül, film-ses.py'nin "ses kaynağı" arayüzü için):
        kaynak = OrnekCalgi('keman_grubu', kutuphane, sr=48000)
        y = kaynak.cal(midi, hiz, sure_sn, artik=None, rr_tohum=None)   # (2, L) float64, t=0'dan
        y = kaynak.vur('ride', hiz, rr_tohum=None)                      # davul ve perküsyon
        y = kaynak.tril(m1, m2, hiz, sure_sn, tril_hz=11.0)             # iki sürekli örnek arasında legato tril
    En yakın örnek notayı seçer, en çok ±3 yarım ton yeniden örnekleyerek kaydırır (dışı: OrnekHatasi, bir ValueError);
    hız katmanını hıza göre seçer (katman sınırında hafif karışım), round robin'i belirlenebilir döndürür, sürekli
    artikülasyonda bırakışta kısa sönüm uygular (gerekirse kararlı bölümü çapraz geçişle uzatır), pizz ve vurmalıda
    örneğin doğal sönümü kalır. Her şey 48 kHz'e (ffmpeg soxr) çözülür.
  - film-ses.py köprüsü: FilmKaynagi(kutuphane).var_mi(calgi) / .ciz(calgi, olay) ve FILM_ESLEME (film çalgısı → örnek).
  - Deneme (--deneme): her çalgıdan kısa gösterim; çalgı başına seviye, tepe ve gerçek tepe ölçümü; kırpma yok.

Girdi
  - Kütüphane kökü: --kutuphane YOL ya da OKTOS_SES_KUTUPHANE ortam değişkeni (yerel yol repoya yazılmaz).
  - scripts/ornek-harita.json: çalgı → kütüphane içi göreli klasör ve dosya adı kuralları (+ --tara'nın yazdığı özetler).

Çıktı (.impeccable/ yereldir, depoya girmez)
  - scripts/ornek-harita.json içindeki "tarama" bölümleri ve "tarama_ozet" (--tara; yerel yol içermez)
  - .impeccable/ses/ornek-onbellek/tepeler.json : örnek başına tepe düzeyi (--tara; katman eğrisi bunu kullanır)
  - .impeccable/ses/ornek-onbellek/*.npy : 48 kHz float32'ye çözülmüş örnekler (yalnız çalınanlar, ~1,7 MB/örnek;
    anahtar: yol+boy+tarih; silmek güvenli, gerekince yeniden çözülür)
  - .impeccable/ses/ornek-deneme.wav (48 kHz, 24 bit, stereo) ve ornek-deneme.json (ölçümler) (--deneme)

Kullanım
  set OKTOS_SES_KUTUPHANE=<kütüphane kökü>          (ya da her komutta --kutuphane <kök>)
  python scripts/ornek-calici.py --tara [--dry-run] [--calgi piyano,davul]
  python scripts/ornek-calici.py --deneme [--dry-run] [--calgi ...]
  python scripts/ornek-calici.py --liste

Tekrar çalıştırmak güvenlidir: tarama yalnız "tarama" alanlarını yeniden yazar (kurallara dokunmaz, tarih yazmaz: aynı
kütüphane aynı dosyayı verir); önbellek dosyaları içerik anahtarıyla adlanır, var olan yeniden yazılmaz; deneme yalnız
kendi iki çıktısının üzerine yazar. --dry-run hiçbir dosya yazmaz (önbellek dahil).
Gereken: Python 3.12, numpy, ffmpeg (PATH'te, FFMPEG ortam değişkeninde ya da WinGet Gyan.FFmpeg paketinde).
İçe aktarma (dosya adında tire var): importlib.util.spec_from_file_location('ornek_calici', 'scripts/ornek-calici.py').
"""
import argparse
import glob
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import wave
from collections import Counter, OrderedDict
from dataclasses import dataclass
from pathlib import Path

import numpy as np

SR = 48000
BURADA = Path(__file__).resolve().parent
KOK = BURADA.parent
HARITA_YOLU = BURADA / 'ornek-harita.json'
SES_DIZIN = KOK / '.impeccable' / 'ses'
ONBELLEK = SES_DIZIN / 'ornek-onbellek'
DENEME_WAV = SES_DIZIN / 'ornek-deneme.wav'
DENEME_JSON = SES_DIZIN / 'ornek-deneme.json'
ORTAM_DEGISKENI = 'OKTOS_SES_KUTUPHANE'
SES_UZANTI = {'.wav', '.flac'}
ONBELLEK_SURUM = 1
YAZMA = True                 # --dry-run kapatır: önbellek ve çıktılar yazılmaz
EN_COK_KAYDIRMA = 3.0        # yarım ton
KATMAN_KARISIM = 0.08        # katman sınırında karışım genişliği (hız birimi)


class OrnekHatasi(ValueError):
    """Örnekle çalınamayan istek (aralık dışı, bilinmeyen tür, kütüphane yok). film-ses.py ValueError'u yakalayıp sentezle çalar."""


# ============================================================================ nota adları
_PC = {'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
       'A': 9, 'A#': 10, 'BB': 10, 'B': 11}
_ADLAR = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
DIN_SIRA = {'ppp': 0, 'pp': 1, 'p': 2, 'mp': 3, 'mf': 4, 'f': 5, 'ff': 6, 'fff': 7}


def nota_midi(ad):
    """'C#4' → 61 (C4 = 60). Bemol 'Bb3' de olur."""
    m = re.fullmatch(r'([A-Ga-g])([#b]?)(-?\d+)', str(ad).strip())
    if not m:
        raise OrnekHatasi(f'nota adı çözülemedi: {ad}')
    anahtar = m.group(1).upper() + {'#': '#', 'b': 'B', '': ''}[m.group(2)]
    return 12 * (int(m.group(3)) + 1) + _PC[anahtar]


def midi_adi(m):
    if m is None:
        return '-'
    r = int(round(m))
    return f'{_ADLAR[r % 12]}{r // 12 - 1}'


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ============================================================================ yollar ve araçlar
def kutuphane_bul(yol=None):
    """Kütüphane kökü: argüman, yoksa OKTOS_SES_KUTUPHANE. Repoda yerel yol tutulmaz."""
    yol = yol or os.environ.get(ORTAM_DEGISKENI)
    if not yol:
        raise OrnekHatasi(f'kütüphane kökü yok: --kutuphane verin ya da {ORTAM_DEGISKENI} ortam değişkenini ayarlayın')
    p = Path(yol).expanduser()
    if not p.is_dir():
        raise OrnekHatasi(f'kütüphane klasörü bulunamadı: {p}')
    return p.resolve()


_FFMPEG = []


def ffmpeg_yolu():
    if _FFMPEG:
        return _FFMPEG[0]
    yol = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
    if not yol:
        aday = glob.glob(os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg*', '*',
                                      'bin', 'ffmpeg.exe'))
        yol = sorted(aday)[-1] if aday else None
    _FFMPEG.append(yol)
    return yol


def harita_oku(yol=HARITA_YOLU):
    return json.loads(Path(yol).read_text(encoding='utf-8'))


def _json_metni(obj, girinti=0):
    """Okunur JSON: kısa yapı ve yalnız sayı/metin içeren liste tek satır, uzun sözlük ve iç içe liste açık."""
    tek = json.dumps(obj, ensure_ascii=False)
    duz_liste = isinstance(obj, list) and all(not isinstance(v, (dict, list)) for v in obj)
    if len(tek) + 2 * girinti <= 118 or duz_liste or not isinstance(obj, (dict, list)) or not obj:
        return tek
    ic = '  ' * (girinti + 1)
    if isinstance(obj, dict):
        satirlar = [f'{ic}{json.dumps(k, ensure_ascii=False)}: {_json_metni(v, girinti + 1)}' for k, v in obj.items()]
        return '{\n' + ',\n'.join(satirlar) + '\n' + '  ' * girinti + '}'
    satirlar = [f'{ic}{_json_metni(v, girinti + 1)}' for v in obj]
    return '[\n' + ',\n'.join(satirlar) + '\n' + '  ' * girinti + ']'


# ============================================================================ ses okuma, yeniden örnekleme, önbellek
def wav_oku(yol):
    """PCM 16/24/32 bit ya da 32 bit kayan noktalı WAV → ((2, n) float32, sr)."""
    veri = Path(yol).read_bytes()
    if veri[:4] != b'RIFF' or veri[8:12] != b'WAVE':
        raise OrnekHatasi(f'WAV değil: {yol}')
    i, bicim, kanal, sr, bit, ham = 12, None, None, None, None, None
    while i + 8 <= len(veri):
        ad, boy = veri[i:i + 4], int.from_bytes(veri[i + 4:i + 8], 'little')
        govde = veri[i + 8:i + 8 + boy]
        if ad == b'fmt ':
            bicim = int.from_bytes(govde[0:2], 'little')
            kanal = int.from_bytes(govde[2:4], 'little')
            sr = int.from_bytes(govde[4:8], 'little')
            bit = int.from_bytes(govde[14:16], 'little')
            if bicim == 0xFFFE and len(govde) >= 26:
                bicim = int.from_bytes(govde[24:26], 'little')
        elif ad == b'data':
            ham = govde
        i += 8 + boy + (boy & 1)
    if ham is None or kanal is None:
        raise OrnekHatasi(f'WAV başlığı eksik: {yol}')
    if bicim == 3 and bit == 32:
        x = np.frombuffer(ham[:len(ham) // 4 * 4], '<f4').astype(np.float32)
    elif bicim == 1 and bit == 16:
        x = np.frombuffer(ham[:len(ham) // 2 * 2], '<i2').astype(np.float32) / 32768.0
    elif bicim == 1 and bit == 32:
        x = (np.frombuffer(ham[:len(ham) // 4 * 4], '<i4') / 2147483648.0).astype(np.float32)
    elif bicim == 1 and bit == 24:
        b = np.frombuffer(ham[:len(ham) // 3 * 3], np.uint8).reshape(-1, 3).astype(np.int32)
        x = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
        x = (np.where(x >= 1 << 23, x - (1 << 24), x) / 8388608.0).astype(np.float32)
    else:
        raise OrnekHatasi(f'desteklenmeyen WAV biçimi ({bicim}, {bit} bit): {yol}')
    x = x[:len(x) // kanal * kanal].reshape(-1, kanal).T
    if kanal == 1:
        x = np.vstack([x[0], x[0]])
    return np.ascontiguousarray(x[:2]), sr


def ffmpeg_oku(yol, sr=SR):
    """ffmpeg ile çöz (FLAC dahil) ve soxr ile sr'ye yeniden örnekle → (2, n) float32. Ara dosya yazılmaz (boru)."""
    ff = ffmpeg_yolu()
    if not ff:
        raise OrnekHatasi('ffmpeg bulunamadı (FLAC için gerekli; winget install Gyan.FFmpeg ya da FFMPEG ortam değişkeni)')
    komut = [ff, '-v', 'error', '-nostdin', '-i', str(yol), '-af', f'aresample={sr}:resampler=soxr:precision=28',
             '-ac', '2', '-f', 'f32le', '-acodec', 'pcm_f32le', 'pipe:1']
    p = subprocess.run(komut, capture_output=True)
    if p.returncode != 0:
        raise OrnekHatasi(f'ffmpeg çözemedi: {yol}: {p.stderr.decode(errors="replace").strip()[:200]}')
    x = np.frombuffer(p.stdout[:len(p.stdout) // 8 * 8], '<f4')
    return np.ascontiguousarray(x.reshape(-1, 2).T)


def ham_oku(yol):
    """Ölçüm için: WAV doğal hızında (hızlı), FLAC ffmpeg ile 48 kHz'de → ((2, n) float32, sr)."""
    if Path(yol).suffix.lower() == '.wav':
        return wav_oku(yol)
    return ffmpeg_oku(yol, SR), SR


# --- Kaiser pencereli sinc yeniden örnekleyici (perde kaydırma; ffmpeg yoksa hız dönüşümü de)
_YARI = 24            # sinc yarı genişliği (sıfır geçişi)
_FAZ = 4096           # kesir faz çözünürlüğü
_BETA = 9.0           # Kaiser β (~ −90 dB durdurma bandı)
_TABLOLAR = {}


def _sinc_tablosu(fc):
    anahtar = round(fc, 6)
    if anahtar not in _TABLOLAR:
        yk = int(math.ceil(_YARI / fc))
        k = np.arange(-yk + 1, yk + 1)
        fr = np.arange(_FAZ + 1) / _FAZ
        t = fr[:, None] - k[None, :]
        w = np.i0(_BETA * np.sqrt(np.clip(1 - (t / yk) ** 2, 0, None))) / np.i0(_BETA)
        _TABLOLAR[anahtar] = (k, (fc * np.sinc(fc * t) * w).astype(np.float32), yk)
    return _TABLOLAR[anahtar]


def yeniden_ornekle(x, adim, n_cikis=None, parca=16384):
    """x: (C, n). Çıkış örneği j, giriş konumu j*adim'den okunur: adim = 2**(yarım_ton/12) perdeyi yükseltir (kısaltır);
    adim = sr_giris/sr_cikis hız dönüştürür. Kesim min(1, 1/adim)'in %96'sı: katlanma (aliasing) yok."""
    x = np.asarray(x, dtype=np.float32)
    tek = x.ndim == 1
    if tek:
        x = x[None]
    C, n = x.shape
    if n_cikis is None:
        n_cikis = max(0, int(math.floor((n - 1) / adim)) + 1)
    fc = 0.96 * min(1.0, 1.0 / adim)
    k, h, yk = _sinc_tablosu(fc)
    xp = np.pad(x, ((0, 0), (yk, yk + 2)))
    y = np.empty((C, n_cikis), np.float32)
    for s in range(0, n_cikis, parca):
        e = min(n_cikis, s + parca)
        p = np.arange(s, e, dtype=np.float64) * adim
        i = np.floor(p).astype(np.int64)
        fi = np.rint((p - i) * _FAZ).astype(np.int64)
        idx = np.minimum(i[:, None] + (k + yk)[None, :], xp.shape[1] - 1)
        W = h[fi]
        for c in range(C):
            y[c, s:e] = np.einsum('mt,mt->m', xp[c][idx], W)
    return y[0] if tek else y


class _Lru:
    """Bayt bütçeli en-son-kullanılan önbelleği (süreç içi)."""

    def __init__(self, sinir):
        self.d, self.bayt, self.sinir = OrderedDict(), 0, sinir

    def al(self, k):
        v = self.d.get(k)
        if v is not None:
            self.d.move_to_end(k)
        return v

    def koy(self, k, v):
        if k in self.d:
            return
        self.d[k] = v
        self.bayt += v.nbytes
        while self.bayt > self.sinir and len(self.d) > 1:
            _, eski = self.d.popitem(last=False)
            self.bayt -= eski.nbytes


TEPE_TABLOSU = ONBELLEK / 'tepeler.json'   # --tara yazar: {göreli yol: tepe dBFS} (yerel, ölçüm)
_TEPELER = {}
_COZULMUS = _Lru(1.5e9)
_KAYDIRILMIS = _Lru(0.6e9)
_BASLANGIC = {}


def _kuyruk_kirp(x, sr, esik_db=-80.0):
    """Sondaki sessizliği (tepeden 80 dB aşağısı) kes, 5 ms yumuşak bitiş."""
    a = np.max(np.abs(x), axis=0)
    tepe = float(a.max()) if a.size else 0.0
    if tepe <= 0:
        return x[:, :1]
    son = int(np.nonzero(a > tepe * 10 ** (esik_db / 20))[0][-1])
    bit = min(x.shape[1], son + int(0.05 * sr))
    x = np.array(x[:, :bit], dtype=np.float32)
    f = min(bit, int(0.005 * sr))
    x[:, bit - f:] *= np.linspace(1, 0, f, dtype=np.float32)
    return x


def cozulmus(yol, sr=SR):
    """Örneği sr'ye çözülmüş (2, n) float32 olarak verir: süreç içi önbellek → disk önbelleği (.npy) → ffmpeg (soxr)."""
    yol = Path(yol)
    st = yol.stat()
    anahtar = hashlib.sha1(f'{yol.as_posix()}|{st.st_size}|{st.st_mtime_ns}|{sr}|{ONBELLEK_SURUM}'.encode()).hexdigest()[:20]
    x = _COZULMUS.al(anahtar)
    if x is not None:
        return x
    dosya = ONBELLEK / f'{anahtar}.npy'
    if dosya.exists():
        x = np.load(dosya)
    else:
        if ffmpeg_yolu() or yol.suffix.lower() != '.wav':
            x = ffmpeg_oku(yol, sr)
        else:
            x, s0 = wav_oku(yol)
            if s0 != sr:
                x = yeniden_ornekle(x, s0 / sr)
        x = _kuyruk_kirp(x, sr)
        if YAZMA:
            ONBELLEK.mkdir(parents=True, exist_ok=True)
            gecici = ONBELLEK / f'{anahtar}.yaziliyor.npy'
            np.save(gecici, x)
            os.replace(gecici, dosya)
    _COZULMUS.koy(anahtar, x)
    return x


def baslangic(x, sr, esik_db=-60.0):
    """Sesin başladığı örnek (tepeden 60 dB aşağısını ilk aşan yer − 1 ms)."""
    a = np.max(np.abs(x), axis=0)
    tepe = float(a.max()) if a.size else 0.0
    if tepe <= 0:
        return 0
    i = int(np.argmax(a > tepe * 10 ** (esik_db / 20)))
    return max(0, i - int(0.001 * sr))


# ============================================================================ ölçüm (tarama)
def duzey_olc(x, sr):
    """Tepe (dBFS), en gürültülü 50 ms RMS (dBFS), süre, en gürültülü anın zamanı."""
    a = np.max(np.abs(x), axis=0)
    tepe = float(a.max()) if a.size else 0.0
    w = max(1, int(0.05 * sr))
    kare = np.concatenate([[0.0], np.cumsum((x.astype(np.float64) ** 2).mean(axis=0))])
    if len(kare) > w + 1:
        ort = (kare[w:] - kare[:-w]) / w
        j = int(np.argmax(ort))
        rms, tepe_sn = math.sqrt(max(float(ort[j]), 1e-20)), (j + w / 2) / sr
    else:
        rms, tepe_sn = math.sqrt(max(float(kare[-1]) / max(1, x.shape[1]), 1e-20)), 0.0
    return dict(tepe_db=round(20 * math.log10(max(tepe, 1e-10)), 2), rms_db=round(20 * math.log10(rms), 2),
                sure_sn=round(x.shape[1] / sr, 3), tepe_sn=round(tepe_sn, 3))


def perde_olc(x, sr, aday_midi):
    """YIN ile aday perdelerden (aynı nota sınıfının oktavları) hangisinin çaldığını bulur.
    Dönüş (midi, sent sapması, d') ya da None. Kural: eşiğin (0,25) altındaki en tiz aday; yoksa en düşük d'."""
    mono = x.mean(axis=0).astype(np.float64)
    adaylar = [(m, hz(m)) for m in aday_midi if 25.0 <= hz(m) <= sr / 5]
    if not adaylar:
        return None
    f_min = min(f for _, f in adaylar)
    tmax = int(sr / f_min * 1.06) + 2
    W = max(int(0.08 * sr), int(5 * sr / f_min))
    bas = baslangic(x, sr)
    kalan = len(mono) - bas
    atla = min(int(0.12 * sr), max(0, kalan - W - tmax) // 3)
    seg = mono[bas + atla: bas + atla + W + tmax]
    if len(seg) < W + tmax:
        W = len(seg) - tmax
        if W < 2.5 * sr / f_min:
            return None
    a = seg[:W]
    N = 1 << int(math.ceil(math.log2(len(seg) + W)))
    r = np.fft.irfft(np.fft.rfft(seg, N) * np.conj(np.fft.rfft(a, N)), N)[:tmax + 1]
    e = np.concatenate([[0.0], np.cumsum(seg ** 2)])
    t = np.arange(tmax + 1)
    d = e[W] + (e[t + W] - e[t]) - 2 * r
    d[0] = 0.0
    cm = np.ones_like(d)
    cm[1:] = d[1:] * t[1:] / np.maximum(np.cumsum(d[1:]), 1e-12)
    sonuc = []
    for m, f in adaylar:
        tc = sr / f
        lo, hi = max(1, int(tc * 0.97)), min(tmax - 1, int(math.ceil(tc * 1.03)))
        if hi <= lo:
            continue
        k = lo + int(np.argmin(cm[lo:hi + 1]))
        p, q, s = cm[k - 1], cm[k], cm[k + 1]
        pay = p - 2 * q + s
        kay = 0.5 * (p - s) / pay if pay > 0 else 0.0
        sonuc.append((m, float(q), sr / (k + kay)))
    if not sonuc:
        return None
    uygun = [s for s in sonuc if s[1] < 0.25]
    m, dd, f_olc = max(uygun, key=lambda s: s[2]) if uygun else min(sonuc, key=lambda s: s[1])
    return m, round(1200 * math.log2(f_olc / hz(m)), 1), round(dd, 3)


def _spektrum(x, sr, t0, t1, N=1 << 19):
    mono = x.mean(axis=0).astype(np.float64)
    bas = baslangic(x, sr)
    seg = mono[bas + int(t0 * sr): bas + int(t1 * sr)]
    if len(seg) < int(0.2 * sr):
        seg = mono[bas: bas + int(1.0 * sr)]
    X = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), N))
    return np.fft.rfftfreq(N, 1 / sr), X


def _tepe_ince(f, X, k):
    """Parabolik ara değerle tepe frekansı."""
    p, q, s = np.log(X[k - 1] + 1e-12), np.log(X[k] + 1e-12), np.log(X[k + 1] + 1e-12)
    pay = p - 2 * q + s
    return (k + (0.5 * (p - s) / pay if pay < 0 else 0.0)) * (f[1] - f[0])


def timpani_perde(x, sr, f_alt=60.0, f_ust=300.0):
    """Timpani asıl tonu: kipler ≈ 1 : 1,5 : 2 : 2,5 şablonuna en iyi uyan f (log genlik toplamı), sonra ±5 % içindeki gerçek
    tepeye inceltilir → MIDI (kesirli). Yumuşak vuruşlarda yanılabilir; kazan başına ortanca alınır."""
    f, X = _spektrum(x, sr, 0.15, 1.2)
    Xl = np.log10(X + X.max() * 1e-4)
    df = f[1] - f[0]
    en, fc_en = None, None
    for fc in f_alt * 2 ** (np.arange(0, math.log2(f_ust / f_alt), 0.0025)):
        puan = 0.0
        for r, w in ((1.0, 1.0), (1.5, 0.8), (2.0, 0.7), (2.5, 0.5)):
            lo, hi = int(fc * r * 0.985 / df), int(math.ceil(fc * r * 1.015 / df))
            puan += w * float(Xl[lo:hi + 1].max())
        if en is None or puan > en:
            en, fc_en = puan, fc
    lo, hi = int(fc_en * 0.95 / df), int(math.ceil(fc_en * 1.05 / df))
    k = lo + int(np.argmax(X[lo:hi + 1]))
    return 69 + 12 * math.log2(_tepe_ince(f, X, k) / 440.0)


def bant_sent(x, sr, midi, genislik_sent=70.0):
    """Beklenen temel frekansın ±genislik içindeki en güçlü tepesi: (sent sapması, tepenin tüm spektruma göre dB'i, kenarda mı).
    Çubuklu çalgı ve kalimbada YIN'den güvenilir (uyumsuz kısmiler)."""
    f, X = _spektrum(x, sr, 0.08, 1.1)
    f0 = hz(midi)
    df = f[1] - f[0]
    lo, hi = int(f0 * 2 ** (-genislik_sent / 1200) / df), int(math.ceil(f0 * 2 ** (genislik_sent / 1200) / df))
    k = lo + int(np.argmax(X[lo:hi + 1]))
    sent = 1200 * math.log2(_tepe_ince(f, X, k) / f0)
    return round(sent, 1), round(20 * math.log10(X[k] / X.max()), 1), k in (lo, hi)


def merkez_hz(x, sr):
    """İlk 0,3 sn'nin spektral ağırlık merkezi (vurmalı türleri tanımlamak için)."""
    bas = baslangic(x, sr)
    seg = x.mean(axis=0)[bas: bas + int(0.3 * sr)].astype(np.float64)
    if len(seg) < 64:
        return 0.0
    X = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
    f = np.fft.rfftfreq(len(seg), 1 / sr)
    return float((X * f).sum() / max(X.sum(), 1e-12))


# ============================================================================ SFZ (davul eşlemesi)
def sfz_tanimlar(yol):
    tanim = {}
    for satir in Path(yol).read_text(encoding='utf-8', errors='replace').splitlines():
        m = re.match(r'\s*#define\s+(\$\w+)\s+(\S+)', satir)
        if m:
            tanim[m.group(1)] = m.group(2)
    return tanim


def sfz_bolgeler(yol, kok, tanim=None):
    """Küçük SFZ okuyucu: #define, #include (kok'e göreli), <global>/<master>/<group>/<region> kalıtımı.
    Her bölge sözlüğünde '_kaynak' = bölgenin yazılı olduğu dosyanın adı (uzantısız)."""
    tanim = dict(tanim or {})
    bolgeler, durum, hedef, bolge = [], {'global': {}, 'master': {}, 'group': {}}, [None], [None]

    def bitir():
        if bolge[0] is not None:
            bolgeler.append(bolge[0])
            bolge[0] = None

    def baslik(ad, kaynak):
        bitir()
        if ad == 'region':
            bolge[0] = {**durum['global'], **durum['master'], **durum['group'], '_kaynak': kaynak}
            hedef[0] = bolge[0]
        elif ad == 'global':
            durum['global'], durum['master'], durum['group'] = {}, {}, {}
            hedef[0] = durum['global']
        elif ad == 'master':
            durum['master'], durum['group'] = {}, {}
            hedef[0] = durum['master']
        elif ad == 'group':
            durum['group'] = {}
            hedef[0] = durum['group']
        else:
            hedef[0] = {}

    def isle(dosya, kaynak):
        for satir in Path(dosya).read_text(encoding='utf-8', errors='replace').splitlines():
            satir = satir.split('//')[0]
            for parca in re.split(r'(<\w+>|#include\s+"[^"]+"|#define\s+\$\w+\s+\S+)', satir):
                if not parca or parca.isspace():
                    continue
                if parca.startswith('<'):
                    baslik(parca[1:-1], kaynak)
                elif parca.startswith('#include'):
                    ic = re.search(r'"([^"]+)"', parca).group(1)
                    isle(Path(kok) / ic, Path(ic).stem)
                elif parca.startswith('#define'):
                    _, ad, deger = parca.split(None, 2)
                    tanim[ad] = deger.strip()
                else:
                    for m in re.finditer(r'(\w+)=(.*?)(?=\s+\w+=|\s*$)', parca):
                        deger = m.group(2).strip()
                        for k in sorted(tanim, key=len, reverse=True):
                            deger = deger.replace(k, tanim[k])
                        if hedef[0] is not None:
                            hedef[0][m.group(1)] = deger

    isle(Path(yol), Path(yol).stem)
    bitir()
    return bolgeler


# ============================================================================ dizin (kurallar → örnek listesi)
@dataclass
class Ornek:
    yol: Path
    goreli: str                # kütüphane köküne göre (/ ayraçlı)
    grup: str                  # artikülasyon (perdeli) ya da vuruş türü (vurmali)
    midi: float = None         # çalan perde (oktav düzeltmeli ya da ölçülen)
    ad_midi: int = None        # dosya adındaki/eşlemedeki perde (oktav düzeltmesiz)
    katman: float = 1.0        # katman sıra değeri (sayı ya da pp..fff sırası)
    rr: int = 1
    hiz: tuple = None          # SFZ: (lovel, hivel)
    sfz: dict = None           # SFZ genlik bilgisi
    ofset: int = 0             # SFZ offset (kaynak örneği)
    kaynak_no: int = 0
    ham_artik: str = ''
    parca: str = None          # ölçülen notanın anahtarı (timpani kazanı)


def _oktav(kaynak, ham_artik):
    ok = kaynak.get('oktav', 0)
    if isinstance(ok, dict):
        return int(ok.get(ham_artik, ok.get('*', 0)))
    return int(ok or 0)


def _eslem_oku(yol):
    """MappingChart.txt: 'NNN=MIDI' satırları → {NNN: MIDI}."""
    es = {}
    for satir in Path(yol).read_text(encoding='utf-8', errors='replace').splitlines():
        m = re.match(r'\s*(\d+)\s*=\s*(\d+)\s*$', satir)
        if m:
            es[m.group(1)] = int(m.group(2))
    return es


def dizin_kur(tanim, kok, olculen_nota=None, akort=None):
    """Bir çalgının kurallarını kütüphaneye uygular. Dönüş: (örnekler, eşlenemeyenler [(göreli, neden)], eksikler [(göreli, neden)]).
    olculen_nota: {parça: {'midi': kesirli}} (timpani); akort: {göreli: sent} ('akort': 'olc' kaynaklarında perdeye eklenir)."""
    olculen_nota, akort = olculen_nota or {}, akort or {}
    perdeli = tanim.get('tur', 'perdeli') == 'perdeli'
    ornekler, eslenmeyen, eksik, gorulen = [], [], [], set()
    for no, kaynak in enumerate(tanim.get('kaynaklar', [])):
        if 'sfz' in kaynak:
            sfz_kok = kok / kaynak['sfz_kok']
            tanimlar = sfz_tanimlar(kok / kaynak['tanimlar']) if kaynak.get('tanimlar') else {}
            esle, yok = kaynak.get('tur_esle', {}), set(kaynak.get('yok_say', []))
            gorulmeyen = Counter()
            for b in sfz_bolgeler(kok / kaynak['sfz'], sfz_kok, tanimlar):
                harita_adi = re.sub(r'_map$', '', b.get('_kaynak', ''))
                ornek_yolu = b.get('sample', '')
                if harita_adi in yok or not ornek_yolu or ornek_yolu.startswith('*'):
                    continue
                tur = esle.get(harita_adi)
                yol = (sfz_kok / ornek_yolu.replace('\\', '/')).resolve()
                try:
                    goreli = yol.relative_to(kok).as_posix()
                except ValueError:
                    goreli = yol.as_posix()
                if tur is None:
                    gorulmeyen[harita_adi] += 1
                    continue
                if not yol.exists():
                    eksik.append((goreli, f'SFZ {harita_adi} → {tur}: örnek dosyası indirilmemiş'))
                    continue
                if (tur, goreli) in gorulen:
                    continue
                gorulen.add((tur, goreli))
                egri = {int(k[len('amp_velcurve_'):]): float(v) for k, v in b.items() if k.startswith('amp_velcurve_')}
                ornekler.append(Ornek(yol=yol, goreli=goreli, grup=tur, katman=float(b.get('lovel', 0)),
                                      rr=int(float(b.get('seq_position', 1))),
                                      hiz=(int(float(b.get('lovel', 0))), int(float(b.get('hivel', 127)))),
                                      sfz=dict(veltrack=float(b.get('amp_veltrack', 100)), egri=egri),
                                      ofset=int(float(b.get('offset', 0))), kaynak_no=no, ham_artik=harita_adi))
            for ad, n in gorulmeyen.items():
                eslenmeyen.append((f'{kaynak["sfz"]} [{ad}]', f'SFZ grubu tur_esle\'de yok ({n} bölge)'))
            continue
        taban = kok / kaynak['klasor']
        if not taban.is_dir():
            eksik.append((kaynak['klasor'], 'klasör yok'))
            continue
        desen = re.compile(kaynak['desen'])
        eslem = _eslem_oku(taban / kaynak['eslem']) if kaynak.get('eslem') else None
        for yol in sorted(p for p in taban.rglob('*') if p.is_file() and p.suffix.lower() in SES_UZANTI):
            rel = yol.relative_to(taban).as_posix()
            m = desen.fullmatch(rel)
            if not m:
                continue
            g = m.groupdict()
            goreli = yol.relative_to(kok).as_posix()
            ham_artik = g.get('artik') if g.get('artik') is not None else kaynak.get('artik_sabit', '')
            artik = kaynak.get('artik_esle', {}).get(ham_artik) if 'artik_esle' in kaynak else ham_artik
            ham_tur = g.get('tur') if 'tur' in g else None
            if ham_tur is None and 'tur' in g:
                ham_tur = ''
            tur = kaynak.get('tur_esle', {}).get(ham_tur) if ham_tur is not None and 'tur_esle' in kaynak else kaynak.get('tur_sabit')
            grup = artik if perdeli else tur
            if not grup:
                eslenmeyen.append((goreli, f'artikülasyon/tür eşlemede yok: {ham_artik or ham_tur!r}'))
                continue
            ad_midi, midi, parca = None, None, None
            if g.get('nota'):
                ad_midi = nota_midi(g['nota'])
                midi = ad_midi + 12 * _oktav(kaynak, ham_artik)
            elif g.get('indeks') is not None and eslem is not None:
                if g['indeks'] not in eslem:
                    eslenmeyen.append((goreli, f'eşleme dosyasında indeks yok: {g["indeks"]}'))
                    continue
                ad_midi = eslem[g['indeks']]
                midi = ad_midi + 12 * _oktav(kaynak, ham_artik)
            elif kaynak.get('nota_kaynagi') == 'olcum':
                parca = g.get('parca') or ham_artik
                midi = olculen_nota.get(parca, {}).get('midi') if isinstance(olculen_nota.get(parca), dict) else None
            if midi is not None and kaynak.get('akort') == 'olc' and goreli in akort:
                midi = midi + float(akort[goreli]) / 100.0
            if g.get('katman'):
                katman = float(g['katman'])
            elif g.get('din'):
                katman = float(DIN_SIRA[g['din']])
            else:
                katman = 1.0
            rr = int(g['rr']) if g.get('rr') else 1
            ornekler.append(Ornek(yol=yol, goreli=goreli, grup=grup, midi=midi, ad_midi=ad_midi, katman=katman, rr=rr,
                                  kaynak_no=no, ham_artik=ham_artik or ham_tur or '', parca=parca))
    return ornekler, eslenmeyen, eksik


def kapsanan_dosyalar(harita, kok):
    """Herhangi bir kuralın desenine uyan bütün ses dosyaları (eşlemede olmasa da) ve SFZ'nin andığı dosyalar."""
    sahip = set()
    for tanim in harita['calgilar'].values():
        ornekler, eslenmeyen, _ = dizin_kur(tanim, kok)
        sahip |= {o.goreli for o in ornekler}
        sahip |= {g for g, _ in eslenmeyen}
    return sahip


# ============================================================================ grup (bir artikülasyon ya da vuruş türü)
class Grup:
    def __init__(self, ad, ornekler, ozellik):
        self.ad = ad
        self.sure = ozellik.get('sure', 'dogal')
        self.birakis_sn = float(ozellik.get('birakis_sn', 0.12))
        self.dongu = bool(ozellik.get('dongu', True))
        self.sfz = any(o.sfz is not None for o in ornekler)
        if self.sfz:
            self.araliklar = sorted({o.hiz for o in ornekler})
            j_of = {r: j for j, r in enumerate(self.araliklar)}
            katman_no = lambda o: j_of[o.hiz]
        else:
            siralar = sorted({o.katman for o in ornekler})
            n = len(siralar)
            self.araliklar = [(j / n, (j + 1) / n) for j in range(n)]
            j_of = {r: j for j, r in enumerate(siralar)}
            katman_no = lambda o: j_of[o.katman]
        self.n_katman = len(self.araliklar)
        self.tablo = {}
        for o in ornekler:
            self.tablo.setdefault((o.midi, katman_no(o)), []).append(o)
        for v in self.tablo.values():
            v.sort(key=lambda o: (o.rr, o.goreli))
        self.notalar = sorted({o.midi for o in ornekler if o.midi is not None})
        self.ornekler = ornekler

    def katman_bul(self, v):
        """Hızın düştüğü katman no (SFZ: 1..127 hız; diğerleri eşit bölmeler)."""
        if self.sfz:
            vel = 1 + int(round(float(np.clip(v, 0, 1)) * 126))
            for j, (lo, hi) in enumerate(self.araliklar):
                if lo <= vel <= hi:
                    return j
            return min(range(self.n_katman), key=lambda j: min(abs(vel - self.araliklar[j][0]), abs(vel - self.araliklar[j][1])))
        return min(self.n_katman - 1, int(float(np.clip(v, 0, 1)) * self.n_katman))


# ============================================================================ çalıcı
def kararli_bolum(x, sr, blok_sn=0.05, pay_db=4.0):
    """Sürekli örneğin döngüye uygun kararlı bölümü (a, b) (örnek): atak sonrası (≥ 0,35 sn, ≥ %30) ile düzeyin ortanca
    düzeyden 4 dB'den fazla düşmediği son an arası. Örneğin kendi bırakış kuyruğu döngüye girmez."""
    blok = max(1, int(blok_sn * sr))
    n = x.shape[1] // blok
    if n < 16:
        return int(x.shape[1] * 0.3), int(x.shape[1] * 0.8)
    e = 10 * np.log10(np.maximum((x[:, :n * blok].astype(np.float64) ** 2).mean(axis=0).reshape(n, blok).mean(axis=1), 1e-20))
    orta = float(np.median(e[int(n * 0.2):int(n * 0.7)]))
    iyi = np.nonzero(e >= orta - pay_db)[0]
    b = int(iyi[-1]) * blok if iyi.size else int(n * 0.8) * blok
    a = max(int(0.35 * sr), int(n * 0.3) * blok)
    if b - a < int(0.5 * sr):
        a, b = int(x.shape[1] * 0.3), max(int(x.shape[1] * 0.8), int(x.shape[1] * 0.3) + 16)
    return a, b


def _surdur(x, a, b, n_toplam, sr):
    """x'in [a, b) kararlı bölümünü eşit güçlü çapraz geçişle döngüleyerek en az n_toplam örneğe uzatır (b'den sonrası atılır)."""
    b = min(b, x.shape[1])
    c = max(16, min(int(0.25 * sr), (b - a) // 3))
    t = np.linspace(0, np.pi / 2, c)
    cik, gir = np.cos(t), np.sin(t)
    parcalar, son = [x[:, :b - c]], x[:, b - c:b]
    toplam = b - c
    while toplam < n_toplam:
        bolum = x[:, a:b]
        parcalar.append(son * cik + bolum[:, :c] * gir)
        parcalar.append(bolum[:, c:b - a - c])
        son = bolum[:, b - a - c:]
        toplam += (b - a - c)
    parcalar.append(son)
    return np.concatenate(parcalar, axis=1)


def _birak(x, n_bas, R):
    """n_bas'tan sonra R örnekte söndür (üstel, sonunda tam sıfır)."""
    L = min(x.shape[1], n_bas + max(1, R))
    y = x[:, :L]
    if L > n_bas:
        t = np.arange(L - n_bas) / max(1, R)
        y[:, n_bas:L] *= np.exp(-6.9 * t) * (1 - t)
    return y


class OrnekCalgi:
    """Tek çalgının örnek çalıcısı (film-ses.py "ses kaynağı" arayüzü için).

    kaynak = OrnekCalgi(ad, kutuphane=None, sr=48000, tohum=0)
      ad: harita çalgısı (OrnekCalgi.adlar()); kutuphane: kök yol ya da None (OKTOS_SES_KUTUPHANE)
    kaynak.cal(midi, hiz=0.7, sure_sn=1.0, artik=None, rr_tohum=None, sustur=False) → (2, L) float64
      midi: çalan perde (C4 = 60), örnek notalarından en çok ±3 yarım ton uzakta; hiz 0..1; sure_sn: tuşa basılı süre
      (sürekli artikülasyonda bırakış o anda başlar; doğal sönümlüde yok sayılır, sustur=True ise o anda susturulur)
    kaynak.vur(tur, hiz=0.7, rr_tohum=None, sure_sn=None) → (2, L): vurmalı çalgılar; sure_sn verilirse o anda kesilir
    kaynak.tril(m1, m2, hiz, sure_sn, tril_hz=11.0, artik=None) → (2, L): iki sürekli nota arasında legato tril
    Düzey: hiz=1'de varsayılan grubun üst katmanının ortanca tepesi ≈ 1,0 (0 dBFS); film-ses sentezleriyle aynı ölçek
    (davul: trampetin en sert vuruşu 0 dBFS, set içi doğal denge korunur; perküsyon: her tür kendi üst katmanına göre).
    Çok katmanlıda düzey hızla sürekli değişir (katman sınırında sıçrama yok, SFZ genlik eğrileri yerine), tını katmandan
    gelir; tek katmanlıda (v − 1) × hiz_aralik_db.
    rr_tohum: None → çalgının kendi sayacıyla döner (çağrı sırasına bağlı); tamsayı → (rr_tohum + nota + katman) mod rr.
    """

    def __init__(self, ad, kutuphane=None, sr=SR, harita=None, tohum=0, en_cok_kaydirma=EN_COK_KAYDIRMA, karisim=KATMAN_KARISIM):
        self.harita = harita if harita is not None else harita_oku()
        if ad not in self.harita['calgilar']:
            raise OrnekHatasi(f'bilinmeyen çalgı: {ad}; olanlar: {", ".join(self.harita["calgilar"])}')
        self.ad, self.sr, self.tohum = ad, int(sr), int(tohum)
        self.tanim = self.harita['calgilar'][ad]
        self.kok = kutuphane if isinstance(kutuphane, Path) and kutuphane.is_dir() else kutuphane_bul(kutuphane)
        self.perdeli = self.tanim.get('tur', 'perdeli') == 'perdeli'
        tarama = self.tanim.get('tarama') or {}
        ornekler, self.eslenmeyen, self.eksik = dizin_kur(self.tanim, self.kok, tarama.get('olculen_nota'), tarama.get('akort_sent'))
        ozellik = self.tanim.get('artik', {})
        gruplar = {}
        for o in ornekler:
            gruplar.setdefault(o.grup, []).append(o)
        self.gruplar = {g: Grup(g, lst, ozellik.get(g, {})) for g, lst in sorted(gruplar.items())}
        self.sanal = self.tanim.get('sanal', {})
        self.varsayilan = self.tanim.get('varsayilan_artik')
        self.aralik_db = float(self.tanim.get('hiz_aralik_db', 12.0))
        self.en_cok_kaydirma, self.karisim = float(en_cok_kaydirma), float(karisim)
        self._sayac = {}
        self.kayit = None        # liste verilirse her çalışta kullanılan örnekler yazılır
        self.uyarilar = []
        self.normal_db = self._normal_hesapla(tarama)
        self._egriler = {g: self._egri_kur(g, tarama) for g in self.gruplar}
        self._tepeler, self._nota_ref, self._kararlilar = {}, {}, {}

    @staticmethod
    def adlar(harita=None):
        return list((harita or harita_oku())['calgilar'])

    def _normal_hesapla(self, tarama, tavan_db=40.0):
        """Düzey ayarı (dB): hiz=1'de üst katmanın ortanca tepesi 0 dBFS. Çok kısık kayıtlar (ör. çerçeve davulda el sürtmesi) en çok +40 dB yükseltilir."""
        gr = tarama.get('gruplar', {})
        if not gr:
            self.uyarilar.append('tarama yok: düzey ayarı 0 dB (önce --tara)')

        def ust(g):
            v = gr.get(g, {}).get('ust_tepe_db')
            if v is None:
                return 0.0
            if -float(v) > tavan_db:
                self.uyarilar.append(f'{g}: kayıt çok kısık ({v} dBFS), +{tavan_db:.0f} dB ile sınırlandı')
            return min(tavan_db, -float(v))
        if self.tanim.get('normal', 'calgi') == 'grup':
            return {g: ust(g) for g in self.gruplar}
        ref = self.tanim.get('normal_grup') or self.varsayilan or next(iter(self.gruplar), None)
        d = ust(ref)
        return {g: d for g in self.gruplar}

    def _egri_kur(self, gad, tarama):
        """Hız → düzey eğrisi (≥ 2 katmanlı gruplar, SFZ dahil): katmanın üst hız sınırında o katmanın doğal düzeyi (ölçülen
        ortanca tepe, üst katmana göre; ardışık fark SFZ'de 0,5–18, diğerlerinde 2–18 dB), aralarda doğrusal; en alt katman
        hiz_aralik_db eğimiyle v=0'a iner. Dönüş (v noktaları, hedef dB [v=0, katman 0..n-1], doğal dB) ya da None (tek katman)."""
        g = self.gruplar[gad]
        dogal = (tarama.get('gruplar', {}).get(gad) or {}).get('katman_tepe_db')
        if g.n_katman < 2 or not dogal or len(dogal) != g.n_katman:
            return None
        N = [float(x) - float(dogal[-1]) for x in dogal]
        alt = 0.5 if g.sfz else 2.0
        A = [0.0] * g.n_katman
        for j in range(g.n_katman - 2, -1, -1):
            A[j] = A[j + 1] - float(np.clip(N[j + 1] - N[j], alt, 18.0))
        ust = [hi / 127.0 for _, hi in g.araliklar] if g.sfz else [hi for _, hi in g.araliklar]
        ust[-1] = max(ust[-1], 1.0)
        return [0.0] + ust, [A[0] - self.aralik_db * ust[0]] + A, N

    # --------------------------------------------------------------- bilgi
    def artikler(self):
        return list(self.gruplar) if self.perdeli else []

    def turler(self):
        return [] if self.perdeli else sorted(set(self.gruplar) | set(self.sanal))

    def aralik(self, artik=None):
        """(en pes, en tiz) çalınabilir MIDI (±kaydırma dahil)."""
        g = self._grup(artik)
        if not g.notalar:
            return None
        return (int(round(g.notalar[0]) - self.en_cok_kaydirma), int(round(g.notalar[-1]) + self.en_cok_kaydirma))

    def _grup(self, ad):
        if self.perdeli:
            ad = ad or self.varsayilan
        if ad in self.gruplar:
            return self.gruplar[ad]
        raise OrnekHatasi(f'{self.ad}: bilinmeyen {"artikülasyon" if self.perdeli else "tür"} {ad!r}; '
                          f'olanlar: {", ".join(self.artikler() or self.turler())}')

    # --------------------------------------------------------------- iç işler
    def _katmanlar(self, g, m, v):
        """[(katman_no, ağırlık)]: hızın katmanı, nota için yoksa en yakını; eşit bölmeli katman sınırında hafif karışım."""
        mevcut = [j for j in range(g.n_katman) if (m, j) in g.tablo]
        if not mevcut:
            raise OrnekHatasi(f'{self.ad}/{g.ad}: {midi_adi(m)} için örnek yok')
        hedef = g.katman_bul(v)
        j = hedef if hedef in mevcut else min(mevcut, key=lambda q: (abs(q - hedef), -q))
        if not g.sfz and 1 < g.n_katman <= 6 and self.karisim > 0:
            bi = int(round(v * g.n_katman))
            b = bi / g.n_katman
            if 0 < bi < g.n_katman and abs(v - b) < self.karisim / 2 and (bi - 1) in mevcut and bi in mevcut:
                w = (v - (b - self.karisim / 2)) / self.karisim        # eşit güçlü: iki ayrı kayıt ilintisiz toplanır
                return [(bi - 1, math.cos(w * math.pi / 2)), (bi, math.sin(w * math.pi / 2))]
        return [(j, 1.0)]

    def _rr_sec(self, g, m, j, rr_tohum):
        lst = g.tablo[(m, j)]
        if len(lst) == 1:
            return lst[0]
        if rr_tohum is not None:
            return lst[(int(rr_tohum) + int(round(m or 0)) + j) % len(lst)]
        anahtar = (g.ad, m, j)
        i = self._sayac.get(anahtar, self.tohum)
        self._sayac[anahtar] = i + 1
        return lst[i % len(lst)]

    def _ciz(self, o, adim, gerek):
        """Örneği başlangıcından (sessizlik atlanır, SFZ offset uygulanır), perde kaydırılmış, float64 kopya olarak verir.
        gerek: gereken çıkış uzunluğu (None → tamamı)."""
        x = cozulmus(o.yol, self.sr)
        anahtar = (str(o.yol), self.sr)
        if anahtar not in _BASLANGIC:
            _BASLANGIC[anahtar] = baslangic(x, self.sr)
        bas = max(_BASLANGIC[anahtar], int(o.ofset * self.sr / 48000))
        yeni = abs(adim - 1.0) > 1e-9
        if gerek is None and yeni:
            k2 = (str(o.yol), self.sr, round(adim, 9))
            y = _KAYDIRILMIS.al(k2)
            if y is None:
                y = yeniden_ornekle(x[:, bas:], adim)
                _KAYDIRILMIS.koy(k2, y)
        else:
            y = x[:, bas:] if gerek is None else x[:, bas: bas + int(gerek * adim) + 2 * _YARI * 3 + 8]
            if yeni:
                y = yeniden_ornekle(y, adim)
        y = np.array(y, dtype=np.float64)
        if bas > 0:
            f = min(y.shape[1], int(0.0005 * self.sr))
            y[:, :f] *= np.linspace(0, 1, f)
        return y

    def _tepe_db(self, o):
        """Örneğin tepe düzeyi: tarama tablosundan (tepeler.json), yoksa çözülmüş örnekten."""
        if not _TEPELER and TEPE_TABLOSU.exists():
            try:
                _TEPELER.update(json.loads(TEPE_TABLOSU.read_text(encoding='utf-8')))
            except (OSError, ValueError):
                _TEPELER['_bozuk'] = 0.0
        if o.goreli in _TEPELER:
            return float(_TEPELER[o.goreli])
        k = (str(o.yol), self.sr)
        if k not in self._tepeler:
            self._tepeler[k] = 20 * math.log10(max(float(np.max(np.abs(cozulmus(o.yol, self.sr)))), 1e-9))
        return self._tepeler[k]

    def _nota_ref_db(self, g, m, A):
        """Notanın 'hiz=1' düzeyi: elindeki en üst katmanın ortanca tepesi. Üst katmanı eksik notada eldeki en üst katman tam
        düzey sayılır (VSCO'da tek katmanlı notalar çoğunlukla orta-güçlü çalınmış; tahminle yükseltmek tepeyi +9 dB aşırıyordu)."""
        k = (g.ad, m)
        if k not in self._nota_ref:
            j = max(q for q in range(g.n_katman) if (m, q) in g.tablo)
            self._nota_ref[k] = float(np.median([self._tepe_db(o) for o in g.tablo[(m, j)]]))
        return self._nota_ref[k]

    def _kazanc(self, g, o, v, m):
        """Çok katmanlıda: hedef düzey = normal + notanın hiz=1 düzeyi + eğri(v); örneğin kendi tepesi buna getirilir (katman
        sınırında sıçrama yok, tını katmandan gelir). Tek katmanlıda: doğal düzey + (v − 1) × hiz_aralik_db."""
        n_db = self.normal_db.get(g.ad, 0.0)
        egri = self._egriler.get(g.ad)
        if egri:
            vs, A, _ = egri
            hedef = n_db + self._nota_ref_db(g, m, A) + float(np.interp(v, vs, A))
            return 10 ** ((hedef - self._tepe_db(o)) / 20)
        return 10 ** ((n_db + (v - 1.0) * self.aralik_db) / 20)

    def _kararli(self, o):
        k = (str(o.yol), self.sr)
        if k not in self._kararlilar:
            x = cozulmus(o.yol, self.sr)
            if k not in _BASLANGIC:
                _BASLANGIC[k] = baslangic(x, self.sr)
            self._kararlilar[k] = kararli_bolum(x[:, _BASLANGIC[k]:], self.sr)
        return self._kararlilar[k]

    def _uzat(self, o, adim, n_tut, R, kes, dongu):
        """Çalınacak ham parça: kesilecekse yalnız gereken uzunluk; tutuş örneğin kararlı bölümünü aşıyorsa döngü."""
        if dongu:
            a, b = self._kararli(o)
            if n_tut > b / adim - 1:
                x = self._ciz(o, adim, None)
                return _surdur(x, int(a / adim), int(b / adim), n_tut + R, self.sr)
        return self._ciz(o, adim, (n_tut + R) if kes else None)

    def _kaydet(self, **k):
        if self.kayit is not None:
            self.kayit.append(k)

    def _topla(self, parcalar):
        L = max(p.shape[1] for p in parcalar)
        y = np.zeros((2, L))
        for p in parcalar:
            y[:, :p.shape[1]] += p
        return y

    # --------------------------------------------------------------- arayüz
    def cal(self, midi, hiz=0.7, sure_sn=1.0, artik=None, rr_tohum=None, sustur=False):
        if not self.perdeli:
            raise OrnekHatasi(f'{self.ad} vurmalı: vur(tur, hiz) kullanın')
        if midi is None:
            raise OrnekHatasi(f'{self.ad}: nota yok')
        g = self._grup(artik)
        if not g.notalar:
            raise OrnekHatasi(f'{self.ad}/{g.ad}: notası bilinen örnek yok (timpani için önce --tara)')
        v = float(np.clip(hiz, 0.0, 1.0))
        kaynak_m = min(g.notalar, key=lambda q: (abs(q - midi), q))
        kayma = float(midi) - kaynak_m
        # sınır nota adına göre (±3 yarım ton); akort düzeltmesi (en çok yarım ton) bunun üstüne eklenebilir
        if abs(float(midi) - round(kaynak_m)) > self.en_cok_kaydirma + 1e-6 or abs(kayma) > self.en_cok_kaydirma + 0.5:
            a = self.aralik(g.ad)
            raise OrnekHatasi(f'{self.ad}/{g.ad}: {midi_adi(midi)} ({midi}) aralık dışı; çalınabilir {midi_adi(a[0])}–{midi_adi(a[1])}')
        adim = 2 ** (kayma / 12)
        surekli = g.sure == 'surekli'
        n_not = int(round(max(0.0, float(sure_sn or 0.0)) * self.sr))
        R = int(g.birakis_sn * self.sr) if surekli else int(0.06 * self.sr)
        kes = surekli or sustur
        parcalar = []
        for j, w in self._katmanlar(g, kaynak_m, v):
            o = self._rr_sec(g, kaynak_m, j, rr_tohum)
            x = self._uzat(o, adim, n_not, R, kes, surekli and g.dongu)
            parcalar.append(x * (w * self._kazanc(g, o, v, kaynak_m)))
            self._kaydet(calgi=self.ad, grup=g.ad, dosya=o.goreli, kayma=round(kayma, 3), katman=j, agirlik=round(w, 3))
        y = self._topla(parcalar)
        if kes:
            y = _birak(y, n_not, R)
        return y

    def vur(self, tur, hiz=0.7, rr_tohum=None, sure_sn=None):
        if self.perdeli:
            raise OrnekHatasi(f'{self.ad} perdeli: cal(midi, hiz, sure_sn) kullanın')
        v = float(np.clip(hiz, 0.0, 1.0))
        if tur in self.sanal and tur not in self.gruplar:
            s = self.sanal[tur]
            lo, hi = s.get('hiz', [0.0, 1.0])
            tur, v = s['tur'], lo + v * (hi - lo)
        g = self._grup(tur)
        parcalar = []
        n_not = None if sure_sn is None else int(round(max(0.0, sure_sn) * self.sr))
        R = int(g.birakis_sn * self.sr)
        for j, w in self._katmanlar(g, None, v):
            o = self._rr_sec(g, None, j, rr_tohum)
            x = self._uzat(o, 1.0, n_not or 0, R, n_not is not None, n_not is not None and g.sure == 'surekli' and g.dongu)
            parcalar.append(x * (w * self._kazanc(g, o, v, None)))
            self._kaydet(calgi=self.ad, grup=g.ad, dosya=o.goreli, kayma=0.0, katman=j, agirlik=round(w, 3))
        y = self._topla(parcalar)
        if n_not is not None:
            y = _birak(y, n_not, R)
        return y

    def tril(self, m1, m2, hiz=0.6, sure_sn=1.0, tril_hz=11.0, artik=None, rr_tohum=None, kenar_ms=6.0):
        """İki sürekli notayı birlikte çalıp aralarında tril hızında eşit güçlü geçiş yapar (yeniden atak yok)."""
        a = self.cal(m1, hiz, sure_sn, artik, rr_tohum)
        b = self.cal(m2, hiz, sure_sn, artik, None if rr_tohum is None else rr_tohum + 1)
        L = max(a.shape[1], b.shape[1])
        a = np.pad(a, ((0, 0), (0, L - a.shape[1])))
        b = np.pad(b, ((0, 0), (0, L - b.shape[1])))
        t = np.arange(L) / self.sr
        kare = (np.floor(t * tril_hz * 2) % 2).astype(float)
        k = max(1, int(kenar_ms / 1000 * self.sr))
        cekirdek = np.hanning(2 * k + 1)
        kare = np.convolve(kare, cekirdek / cekirdek.sum(), mode='same')
        return a * np.cos(kare * np.pi / 2) + b * np.sin(kare * np.pi / 2)


# ============================================================================ film-ses.py köprüsü
# film-ses.py çalgısı → (örnek çalgı, yöntem, artikülasyon/tür). None: örneği yok, sentezde kalır.
FILM_ESLEME = {
    'piyano': ('piyano', 'cal', None),
    'piyano.tema': ('piyano', 'cal', None),
    'piyano.kece': None, 'piyano.sustur': None, 'piyano.hazir': None,     # keçe / susturulmuş piyano örneği yok
    'davul.kick': ('davul', 'vur', 'kick'),
    'davul.firca': ('davul', 'vur', 'trampet_tap'),                       # fırça örneği yok: hayalet trampet vuruşu
    'davul.supurme': None,                                                # fırça süpürmesi örneği yok
    'davul.shaker': ('perkusyon', 'vur', ['shaker_kalin_asagi', 'shaker_kalin_yukari']),  # sekizlik konumuna göre aşağı/yukarı
    'davul.rim': ('davul', 'vur', 'cross'),
    'davul.blok': ('perkusyon', 'vur', 'tahta_blok'),
    'davul.cerceve': ('perkusyon', 'vur', 'cerceve'),
    'davul.alkis': ('perkusyon', 'vur', 'alkis'),
    'davul.parmak': None,                                                 # parmak şıklatma örneği yok
    'davul.tef': ('perkusyon', 'vur', 'tef'),
    'davul.tom': ('davul', 'vur', 'tom_alcak'),
    'davul.timpani': ('timpani', 'cal', 'vurus'),
    'davul.zil': ('perkusyon', 'zil', None),                              # kabarma: tepe olay sonuna oturur
    'ped.yayli': ('yayli', 'cal', 'sus'),                                 # m ≥ 55 keman grubu, altı cello
    'ped.analog': None,
    'tokmak.kalimba': ('kalimba', 'cal', None),
    'tokmak.marimba': ('marimba', 'cal', None),
    'tokmak.glok': ('glok', 'cal', None),
    'tokmak.can': None,
    'tel.arp': ('arp', 'cal', None),
    'bas.kontrbas': ('kontrbas', 'cal', 'pizz'),
    'nefesli.flut': ('flut', 'tril', 'sus'),                              # m2 varsa tril, yoksa uzun nota
    'keman.pizz': ('keman_grubu', 'cal', 'pizz'),
}


SEKIZLIK_KARE = 12       # film-ses.py: vuruş 24 kare → sekizlik 12 kare


class FilmKaynagi:
    """film-ses.py'deki OrnekCalici ile aynı yüz: var_mi(calgi), ciz(calgi, olay) → (2, L), t=0'dan, pan ve çalgı kazancı
    UYGULANMAMIŞ (kaynak_ciz uygular). olay: m (MIDI ya da None), hiz 0..1, sure (kare, fps), birak (örnek, varsa), kare
    (round robin tohumu), m2/tril_hz (flüt trili), sustur."""

    def __init__(self, kutuphane=None, sr=SR, fps=60, harita=None):
        self.kok = kutuphane_bul(kutuphane) if not isinstance(kutuphane, Path) else kutuphane
        self.sr, self.fps = sr, fps
        self.harita = harita or harita_oku()
        self._calgilar = {}

    def calgi(self, ad):
        if ad not in self._calgilar:
            self._calgilar[ad] = OrnekCalgi(ad, self.kok, self.sr, self.harita)
        return self._calgilar[ad]

    def var_mi(self, calgi):
        e = FILM_ESLEME.get(calgi)
        if not e:
            return False
        adlar = ['keman_grubu', 'cello'] if e[0] == 'yayli' else [e[0]]
        try:
            return all(self.calgi(a).gruplar for a in adlar)
        except (OSError, OrnekHatasi):
            return False

    def ciz(self, calgi, olay):
        e = FILM_ESLEME.get(calgi)
        if not e:
            raise OrnekHatasi(f'{calgi}: örnek eşlemesi yok')
        ad, yontem, secim = e
        m, v = olay.get('m'), float(olay.get('hiz', 0.5))
        if olay.get('birak') is not None:
            sure = float(olay['birak']) / self.sr
        else:
            sure = float(olay.get('sure', 24)) / self.fps
        tohum = olay.get('kare')
        if ad == 'yayli':
            ad = 'keman_grubu' if (m or 0) >= 55 else 'cello'
        k = self.calgi(ad)
        if yontem == 'vur':
            if isinstance(secim, list):                       # sırayla: sekizlik (SEKIZLIK_KARE) konumunun paritesi
                secim = secim[(int(tohum or 0) // SEKIZLIK_KARE) % len(secim)]
            return k.vur(secim, v, rr_tohum=tohum)
        if yontem == 'zil':
            return self._zil(k, v, sure, tohum)
        if yontem == 'tril' and olay.get('m2') is not None:
            return k.tril(m, olay['m2'], v, sure, tril_hz=float(olay.get('tril_hz', 11.0)), artik=secim, rr_tohum=tohum)
        return k.cal(m, v, sure, artik=secim, rr_tohum=tohum, sustur=bool(olay.get('sustur')))

    def _zil(self, k, v, sure, tohum):
        """Zil kabarması: tepesi olay süresinin sonuna en yakın örnek; tepe o ana kaydırılır."""
        adaylar = []
        for tur in ('zil_kabarma_kisa', 'zil_kabarma_orta', 'zil_kabarma_uzun'):
            if tur in k.gruplar:
                y = k.vur(tur, v, rr_tohum=tohum)
                zarf = np.convolve(np.max(np.abs(y), axis=0), np.ones(2400) / 2400, mode='same')
                adaylar.append((abs(np.argmax(zarf) / self.sr - sure), np.argmax(zarf) / self.sr, y))
        if not adaylar:
            raise OrnekHatasi('zil kabarması örneği yok')
        _, tepe, y = min(adaylar, key=lambda a: a[0])
        fark = int(round((sure - tepe) * self.sr))
        if fark > 0:
            return np.pad(y, ((0, 0), (fark, 0)))
        y = y[:, -fark:].copy()
        f = min(y.shape[1], int(0.3 * self.sr))
        y[:, :f] *= np.linspace(0, 1, f)
        return y


# ============================================================================ tarama
def _araliklar_metni(sayilar):
    """[40, 41, 42, 45] → ['E2–F#2', 'A2']."""
    out, i = [], 0
    s = sorted(sayilar)
    while i < len(s):
        j = i
        while j + 1 < len(s) and s[j + 1] == s[j] + 1:
            j += 1
        out.append(midi_adi(s[i]) if i == j else f'{midi_adi(s[i])}–{midi_adi(s[j])}')
        i = j + 1
    return out


def calgi_tara(ad, tanim, kok, olc=True, ilerleme=None):
    """Bir çalgıyı tarar ve ölçer; dönüş 'tarama' sözlüğü."""
    perdeli = tanim.get('tur', 'perdeli') == 'perdeli'
    ornekler, eslenmeyen, eksik = dizin_kur(tanim, kok, None)
    olcum = {}
    oktav_say = {}
    sapmalar = []
    parca_perde = {}
    for i, o in enumerate(ornekler):
        if ilerleme:
            ilerleme(i, len(ornekler))
        if not olc:
            continue
        x, sr = ham_oku(o.yol)
        d = duzey_olc(x, sr)
        if not perdeli:
            d['merkez_hz'] = round(merkez_hz(x, sr))
        if perdeli and o.ad_midi is not None:
            p = perde_olc(x, sr, [o.ad_midi + 12 * k for k in range(-2, 4)])
            if p:
                k = (p[0] - o.ad_midi) // 12
                d['olculen_oktav'], d['sent'] = k, p[1]
                anahtar = f'{o.kaynak_no}:{o.ham_artik}'
                oktav_say.setdefault(anahtar, Counter())[k] += 1
            if tanim['kaynaklar'][o.kaynak_no].get('akort') == 'olc':
                d['akort'] = bant_sent(x, sr, o.midi)
        elif perdeli and o.parca:
            parca_perde.setdefault(o.parca, []).append(timpani_perde(x, sr))
        olcum[o.goreli] = d
    sonuc = dict(ornek_sayisi=len(ornekler))
    tepeler = {g: d['tepe_db'] for g, d in olcum.items()}
    # akort: güvenilir ölçümler (tepe bant kenarında değil, spektrumun en güçlüsünden en çok 25 dB aşağıda) perdeye eklenir
    akort = {}
    for o in ornekler:
        a = olcum.get(o.goreli, {}).get('akort')
        if not a:
            continue
        sent, duzey, kenar = a
        if kenar or duzey < -25:
            sapmalar.append(dict(dosya=o.goreli, neden=f'akort ölçülemedi (temel zayıf: {duzey:.0f} dB), düzeltilmedi'))
            continue
        akort[o.goreli] = sent
        o.midi += sent / 100.0
    if akort:
        sonuc['akort_sent'] = akort
    # oktav doğrulaması: kaynak + ham artikülasyon başına çoğunluk
    if oktav_say:
        ok = {}
        for anahtar, say in sorted(oktav_say.items()):
            no, ham = anahtar.split(':', 1)
            kural = _oktav(tanim['kaynaklar'][int(no)], ham)
            olculen = say.most_common(1)[0][0]
            ok[ham or anahtar] = dict(kural=kural, olculen=olculen, dagilim={str(k): v for k, v in sorted(say.items())},
                                      uyusuyor=kural == olculen)
        sonuc['oktav'] = ok
        for o in ornekler:
            d = olcum.get(o.goreli, {})
            if 'sent' in d:
                cogunluk = ok[o.ham_artik or f'{o.kaynak_no}:']['olculen']
                sent = akort.get(o.goreli, d['sent'])
                if d['olculen_oktav'] != cogunluk:
                    sapmalar.append(dict(dosya=o.goreli, neden=f'YIN oktavı {d["olculen_oktav"]:+d} (çoğunluk {cogunluk:+d}; '
                                                                 f'büyük olasılıkla ölçüm yanılgısı)'))
                elif o.goreli in akort and abs(sent) > 10:
                    sapmalar.append(dict(dosya=o.goreli, neden=f'akort {sent:+.0f} sent, kaydırmada düzeltilir'))
                elif o.goreli not in akort and abs(sent) > 35:
                    sapmalar.append(dict(dosya=o.goreli, neden=f'YIN perde sapması {sent:+.0f} sent (düzeltilmez)'))
    if parca_perde:
        on = {}
        for parca, lst in sorted(parca_perde.items()):
            mf = float(np.median(lst))
            on[parca] = dict(midi=round(mf, 2), nota=midi_adi(mf), hz=round(hz(mf), 1), olcum_sayisi=len(lst),
                             yayilim_sent=round(100 * (max(lst) - min(lst)), 0))
        sonuc['olculen_nota'] = on
        for o in ornekler:
            if o.parca in on:
                o.midi = on[o.parca]['midi']
    # gruplar
    ozellik = tanim.get('artik', {})
    gruplar = {}
    for o in ornekler:
        gruplar.setdefault(o.grup, []).append(o)
    gs = {}
    for gad, lst in sorted(gruplar.items()):
        g = Grup(gad, lst, ozellik.get(gad, {}))
        bilgi = dict(sayi=len(lst), katman_sayisi=g.n_katman, rr_en_cok=max(len(v) for v in g.tablo.values()),
                     sure=g.sure)
        if g.sfz:
            bilgi['hiz_araliklari'] = [list(r) for r in g.araliklar]
        if perdeli and g.notalar:
            tam = [int(round(m)) for m in g.notalar]
            bilgi['nota_araligi'] = [midi_adi(g.notalar[0]), midi_adi(g.notalar[-1])]
            bilgi['nota_sayisi'] = len(g.notalar)
            bilgi['notalar'] = [midi_adi(m) for m in g.notalar]
            calinir = set()
            for m in g.notalar:
                calinir |= set(range(int(round(m) - EN_COK_KAYDIRMA), int(round(m) + EN_COK_KAYDIRMA) + 1))
            bilgi['calinabilir'] = [midi_adi(min(calinir)), midi_adi(max(calinir)), min(calinir), max(calinir)]
            bosluk = [m for m in range(min(tam), max(tam) + 1) if m not in calinir]
            if bosluk:
                bilgi['bosluklar'] = _araliklar_metni(bosluk)
            eksik_katman = sum(1 for m in g.notalar for j in range(g.n_katman) if (m, j) not in g.tablo)
            if eksik_katman:
                bilgi['eksik_katman'] = eksik_katman
        if olc and olcum:
            per_j, ust = {}, []
            for (m, j), lst2 in g.tablo.items():
                for o in lst2:
                    if o.goreli in olcum:
                        per_j.setdefault(j, []).append(olcum[o.goreli]['tepe_db'])
            for (m, j), lst2 in g.tablo.items():
                if j == g.n_katman - 1:
                    ust += [olcum[o.goreli]['tepe_db'] for o in lst2 if o.goreli in olcum]
            bilgi['katman_tepe_db'] = [round(float(np.median(per_j[j])), 1) for j in sorted(per_j)]
            bilgi['ust_tepe_db'] = round(float(np.median(ust)), 2) if ust else None
            sureler = [olcum[o.goreli]['sure_sn'] for o in lst if o.goreli in olcum]
            bilgi['sure_sn'] = [round(min(sureler), 2), round(max(sureler), 2)]
            if not perdeli:
                bilgi['merkez_hz'] = int(np.median([olcum[o.goreli]['merkez_hz'] for o in lst if o.goreli in olcum]))
                bilgi['tepe_ani_sn'] = round(float(np.median([olcum[o.goreli]['tepe_sn'] for o in lst if o.goreli in olcum])), 2)
        gs[gad] = bilgi
    sonuc['gruplar'] = gs
    yin = [u for u in sapmalar if u['neden'].startswith('YIN')]
    sapmalar = [u for u in sapmalar if not u['neden'].startswith('YIN')]
    if sapmalar:
        sonuc['perde_uyarilari'] = sapmalar
    if yin:
        sonuc['yin_uyari_sayisi'] = len(yin)
        sonuc['_yin'] = yin                 # yalnız ekrana; haritaya yazılmaz
    if eslenmeyen:
        sonuc['eslenmeyen'] = [f'{a} ({b})' for a, b in eslenmeyen]
    if eksik:
        sayac = Counter(b for _, b in eksik)
        sonuc['eksik'] = [f'{n} dosya: {b}' for b, n in sayac.items()]
    return sonuc, tepeler


def tara(harita, kok, sec=None, olc=True):
    """Dönüş (çalgı → tarama, kütüphane özeti ya da None, {göreli yol: tepe dBFS})."""
    sonuc, tepeler = {}, {}
    for ad, tanim in harita['calgilar'].items():
        if sec and ad not in sec:
            continue
        print(f'  {ad} taranıyor…', end='', flush=True)

        def ilerleme(i, n):
            if i % 50 == 0:
                print(f' {i}/{n}', end='', flush=True)
        sonuc[ad], t = calgi_tara(ad, tanim, kok, olc, ilerleme)
        tepeler.update(t)
        print(' tamam', flush=True)
    ozet = None
    if not sec:
        sahip = kapsanan_dosyalar({'calgilar': {a: {**t, 'tarama': sonuc.get(a, t.get('tarama'))}
                                                for a, t in harita['calgilar'].items()}}, kok)
        tum = sorted(p.relative_to(kok).as_posix() for p in kok.rglob('*')
                     if p.is_file() and p.suffix.lower() in SES_UZANTI and '.git' not in p.parts)
        disarida = [p for p in tum if p not in sahip]
        ozet = dict(ses_dosyasi=len(tum), kurala_giren=len(tum) - len(disarida),
                    hicbir_kurala_girmeyen=_klasor_ozet(disarida))
    return sonuc, ozet, tepeler


def _klasor_ozet(yollar):
    say = Counter(p.rsplit('/', 1)[0] if '/' in p else '.' for p in yollar)
    return [f'{k}: {v} dosya' for k, v in sorted(say.items())]


def tarama_yazdir(sonuc, ozet):
    for ad, t in sonuc.items():
        print(f'\n{ad}: {t["ornek_sayisi"]} örnek')
        for gad, b in t['gruplar'].items():
            satir = f'  {gad:28s} {b["sayi"]:3d} örnek, {b["katman_sayisi"]} katman, rr≤{b["rr_en_cok"]}'
            if 'nota_araligi' in b:
                satir += f', nota {b["nota_araligi"][0]}–{b["nota_araligi"][1]} ({b["nota_sayisi"]}), çalınır {b["calinabilir"][0]}–{b["calinabilir"][1]}'
            if b.get('bosluklar'):
                satir += f', BOŞLUK {",".join(b["bosluklar"])}'
            if b.get('eksik_katman'):
                satir += f', eksik katman {b["eksik_katman"]}'
            if b.get('katman_tepe_db'):
                kt = b['katman_tepe_db']
                satir += f', katman tepe dB {kt if len(kt) <= 4 else [kt[0], "…", kt[-1]]}'
            if 'merkez_hz' in b:
                satir += f', merkez {b["merkez_hz"]} Hz'
            if 'sure_sn' in b:
                satir += f', {b["sure_sn"][0]}–{b["sure_sn"][1]} sn'
            print(satir)
        for ham, o in (t.get('oktav') or {}).items():
            if not o['uyusuyor']:
                print(f'  UYARI oktav {ham}: kural {o["kural"]:+d}, ölçülen {o["olculen"]:+d} {o["dagilim"]}')
        for parca, o in (t.get('olculen_nota') or {}).items():
            print(f'  ölçülen nota {parca}: {o["nota"]} ({o["hz"]} Hz, {o["olcum_sayisi"]} ölçüm, yayılım {o["yayilim_sent"]:.0f} sent)')
        uyarilar = t.get('perde_uyarilari', []) + t.get('_yin', [])
        for u in uyarilar[:14]:
            print(f'  perde: {u["dosya"].rsplit("/", 1)[-1]}: {u["neden"]}')
        if len(uyarilar) > 14:
            print(f'  … {len(uyarilar) - 14} perde uyarısı daha')
        for e in t.get('eslenmeyen', []):
            print(f'  eşlenemeyen: {e}')
        for e in t.get('eksik', []):
            print(f'  eksik: {e}')
    if ozet:
        print(f'\nKütüphane: {ozet["ses_dosyasi"]} ses dosyası, {ozet["kurala_giren"]} tanesi bir kurala giriyor.')
        for s in ozet['hicbir_kurala_girmeyen']:
            print(f'  hiçbir kurala girmeyen: {s}')


# ============================================================================ deneme
class Serit:
    """Bir gösterim bölümü: olayları zamanına ekler."""

    def __init__(self, ad, sr):
        self.ad, self.sr, self.y, self.son, self.hatalar = ad, sr, np.zeros((2, 0)), 0.0, []

    def ekle(self, x, t_sn, kazanc=1.0):
        i = int(round(t_sn * self.sr))
        j = i + x.shape[1]
        if j > self.y.shape[1]:
            self.y = np.pad(self.y, ((0, 0), (0, j - self.y.shape[1])))
        self.y[:, i:j] += x * kazanc
        self.son = max(self.son, t_sn)

    def dene(self, f, t_sn, kazanc=1.0):
        try:
            self.ekle(f(), t_sn, kazanc)
        except OrnekHatasi as e:
            self.hatalar.append(str(e))

    def bitir(self, kuyruk_sn=2.5, karar_sn=0.6):
        L = min(self.y.shape[1], int((self.son + kuyruk_sn) * self.sr))
        y = self.y[:, :L].copy()
        f = min(L, int(karar_sn * self.sr))
        y[:, L - f:] *= np.linspace(1, 0, f) ** 2
        return y


def _gercek_tepe(y):
    """4× bant sınırlı aşırı örnekleme ile gerçek tepe (doğrusal)."""
    en = 0.0
    n = y.shape[1]
    N = 1 << int(math.ceil(math.log2(n + 4096)))
    for c in range(y.shape[0]):
        z = np.fft.irfft(np.fft.rfft(y[c], N), 4 * N) * 4
        en = max(en, float(np.max(np.abs(z[:4 * n]))))
    return en


def _kapili_rms(y, sr, blok_sn=0.1, kapi_db=20.0):
    """100 ms bloklar, en gürültülü bloğun 20 dB altında kalanlar atılarak RMS (dBFS)."""
    b = int(blok_sn * sr)
    n = y.shape[1] // b
    if n == 0:
        return -120.0
    e = (y[:, :n * b] ** 2).mean(axis=0).reshape(n, b).mean(axis=1)
    edb = 10 * np.log10(np.maximum(e, 1e-20))
    sec = e[edb > edb.max() - kapi_db]
    return float(10 * np.log10(max(sec.mean(), 1e-20)))


def _db(x):
    return round(20 * math.log10(max(x, 1e-10)), 2)


def _deneme_bolumleri():
    """(bölüm adı, çalgı, kurucu): kurucu(serit, kaynak)."""
    B = 0.6   # 100 BPM vuruş

    def piyano(s, k):
        olcek = [62, 64, 66, 67, 69, 71, 73, 74]
        for i, m in enumerate(olcek):
            s.dene(lambda m=m, i=i: k.cal(m, 0.42 + 0.03 * i, 0.27), i * B / 2)
        for m in (50, 57, 62, 66, 69):
            s.dene(lambda m=m: k.cal(m, 0.4, 1.9), 2.6)
        for m in (50, 57, 62, 66, 69, 74):
            s.dene(lambda m=m: k.cal(m, 0.85, 2.2), 4.8)

    def keman(s, k):
        s.dene(lambda: k.cal(69, 0.6, 2.6, artik='sus'), 0.0)
        for i, m in enumerate([74, 69, 66, 62, 66, 69, 74]):
            s.dene(lambda m=m, i=i: k.cal(m, 0.62 + 0.04 * (i % 2), 0.3, artik='pizz', rr_tohum=i), 3.2 + i * 0.3)

    def cello(s, k):
        s.dene(lambda: k.cal(50, 0.6, 2.2, artik='sus'), 0.0)
        for i, m in enumerate([50, 54, 57, 62]):
            s.dene(lambda m=m, i=i: k.cal(m, 0.65, 0.2, artik='spic', rr_tohum=i), 2.8 + i * 0.3)

    def kontrbas(s, k):
        yuruyus = [38, 42, 45, 47, 43, 47, 50, 52, 45, 49, 52, 43, 38]
        for i, m in enumerate(yuruyus):
            v = 0.72 if i % 4 == 0 else 0.6
            s.dene(lambda m=m, v=v, i=i: k.cal(m, v, 0.55, artik='pizz', rr_tohum=i), i * B)

    def arp(s, k):
        yukari = [50, 54, 57, 62, 66, 69, 74, 78, 81, 86]
        dizi = yukari + yukari[-2::-1]
        for i, m in enumerate(dizi):
            s.dene(lambda m=m: k.cal(m, 0.55), i * 0.13)
        s.dene(lambda: k.cal(38, 0.6), len(dizi) * 0.13 + 0.1)
        s.dene(lambda: k.cal(50, 0.5), len(dizi) * 0.13 + 0.1)

    def flut(s, k):
        s.dene(lambda: k.cal(81, 0.6, 1.2, artik='sus'), 0.0)
        s.dene(lambda: k.tril(81, 83, 0.6, 2.0, tril_hz=11.0, artik='sus'), 1.25)
        for i, m in enumerate([86, 81, 78, 74]):
            s.dene(lambda m=m, i=i: k.cal(m, 0.6, 0.2, artik='stac', rr_tohum=i), 3.6 + i * 0.3)

    def tokmak(notalar, aralik=0.3, v=0.6):
        def kur(s, k):
            for i, m in enumerate(notalar):
                s.dene(lambda m=m, i=i: k.cal(m, v + 0.05 * ((i + 1) % 2), rr_tohum=i), i * aralik)
        return kur

    def timpani(s, k):
        notalar = sorted(k.gruplar['vurus'].notalar) if 'vurus' in k.gruplar else []
        for i, m in enumerate(notalar):
            s.dene(lambda m=m, i=i: k.cal(m, 0.6, rr_tohum=i), i * B)
        if notalar:
            orta = notalar[len(notalar) // 2]
            s.dene(lambda: k.cal(orta, 0.7, 2.5, artik='tremolo'), len(notalar) * B + 0.2)

    def davul(s, k):
        vur = 0.5                                   # 120 BPM, üçleme swing
        for olcu in range(4):
            t0 = olcu * 4 * vur
            for b in range(4):
                t = t0 + b * vur
                s.dene(lambda b=b: k.vur('ride', 0.58 if b % 2 else 0.5), t)
                s.dene(lambda: k.vur('kick', 0.2), t)
                if b % 2:
                    s.dene(lambda: k.vur('hh_pedal', 0.55), t)
                    s.dene(lambda: k.vur('ride', 0.42), t + vur * 2 / 3)
            hayalet = [(1, 0.35), (3, 0.3)] if olcu % 2 == 0 else [(0, 0.28), (2, 0.38), (3, 0.3)]
            for b, v in hayalet:
                s.dene(lambda v=v: k.vur('trampet_tap', v), t0 + b * vur + vur * 2 / 3)
            if olcu == 3:
                s.dene(lambda: k.vur('cross', 0.5), t0 + 3 * vur)
        s.dene(lambda: k.vur('ride', 0.6), 16 * vur)
        s.dene(lambda: k.vur('kick', 0.35), 16 * vur)

    def perkusyon(s, k):
        t = 0.0
        for i in range(16):                         # shaker: sekizlikler aşağı/yukarı, vurgu vuruşta
            tur = 'shaker_kalin_asagi' if i % 2 == 0 else 'shaker_kalin_yukari'
            s.dene(lambda i=i, tur=tur: k.vur(tur, 0.62 if i % 4 == 0 else 0.48, rr_tohum=i), t + i * B / 2)
        t += 8 * B + 0.3
        for i, (dt, v) in enumerate([(0, 0.6), (1, 0.5), (2, 0.55), (2.5, 0.45), (3, 0.65)]):
            s.dene(lambda v=v, i=i: k.vur('tahta_blok', v, rr_tohum=i), t + dt * B)
        t += 4 * B + 0.3
        for i, (dt, tur, v) in enumerate([(0, 'cerceve_buyuk', 0.7), (1, 'cerceve_buyuk_sustur', 0.5), (1.5, 'cerceve_kucuk', 0.5),
                                          (2, 'cerceve_buyuk', 0.6), (3, 'cerceve_kucuk_sustur', 0.55)]):
            s.dene(lambda tur=tur, v=v, i=i: k.vur(tur, v, rr_tohum=i), t + dt * B)
        t += 4 * B + 0.3
        for i, (dt, tur, v) in enumerate([(0, 'tef', 0.6), (1, 'tef_salla', 0.5), (2, 'tef', 0.7), (3, 'tef_salla', 0.5)]):
            s.dene(lambda tur=tur, v=v, i=i: k.vur(tur, v, rr_tohum=i), t + dt * B)
        t += 4 * B + 0.5
        for i in range(4):
            s.dene(lambda i=i: k.vur('alkis', 0.65, rr_tohum=i), t + (1 + 2 * i) * B)
        t += 8 * B + 0.3
        s.dene(lambda: k.vur('zil_kabarma', 0.7), t)

    def perkusyon_diger(s, k):
        anilan = {'shaker_kalin_asagi', 'shaker_kalin_yukari', 'tahta_blok', 'cerceve_buyuk', 'cerceve_buyuk_sustur', 'cerceve_kucuk', 'cerceve_kucuk_sustur', 'tef',
                  'tef_salla', 'alkis', 'zil_kabarma_orta', 'zil_kabarma', 'cerceve'}
        t = 0.0
        for tur in k.turler():
            if tur in anilan or 'tremolo' in tur or 'can_agaci' in tur or 'kabarma' in tur:
                continue
            s.dene(lambda tur=tur: k.vur(tur, 0.6), t)
            t += 0.45
        s.dene(lambda: k.vur('can_agaci_yukari', 0.6), t + 0.2)

    return [
        ('piyano: Re majör ölçek ve akorlar (p, f)', 'piyano', piyano),
        ('keman_grubu: uzun La4 ve pizz', 'keman_grubu', keman),
        ('cello: uzun Re3 ve spiccato', 'cello', cello),
        ('kontrbas: pizz yürüyen bas', 'kontrbas', kontrbas),
        ('arp: Re majör arpej', 'arp', arp),
        ('flut: uzun La5, La–Si tril, staccato', 'flut', flut),
        ('glok: kısa cümle', 'glok', tokmak([86, 90, 93, 90, 88, 86, 93, 98], 0.3)),
        ('marimba: kısa cümle', 'marimba', tokmak([62, 66, 69, 74, 73, 69, 66, 64, 62, 50], 0.3)),
        ('ksilofon: kısa cümle', 'ksilofon', tokmak([86, 88, 90, 93, 95, 93, 90, 86], 0.15)),
        ('kalimba: kısa cümle', 'kalimba', tokmak([62, 66, 69, 66, 64, 62, 59, 57], 0.3)),
        ('timpani: kazanlar ve tremolo', 'timpani', timpani),
        ('davul: 4 ölçü yumuşak caz (ride, hh pedal, kick, trampet tap)', 'davul', davul),
        ('perkusyon: shaker, tahta blok, çerçeve, tef, alkış, zil kabarması', 'perkusyon', perkusyon),
        ('perkusyon: diğer türler birer vuruş', 'perkusyon', perkusyon_diger),
    ]


def deneme(kok, sec=None, hedef_rms_db=-18.0, tavan_dbtp=-1.0, ara_sn=0.5):
    harita = harita_oku()
    calgilar, bolumler = {}, []
    for baslik, ad, kur in _deneme_bolumleri():
        if sec and ad not in sec:
            continue
        if ad not in calgilar:
            calgilar[ad] = OrnekCalgi(ad, kok, SR, harita)
        k = calgilar[ad]
        k.kayit = []
        s = Serit(baslik, SR)
        print(f'  {baslik}…', flush=True)
        kur(s, k)
        y = s.bitir() if s.y.shape[1] else np.zeros((2, SR // 2))
        ham_tepe, ham_rms = float(np.max(np.abs(y))), _kapili_rms(y, SR)
        ham_gt = _gercek_tepe(y)
        kazanc_db = min(hedef_rms_db - ham_rms, tavan_dbtp - _db(ham_gt))     # düzey eşitle, gerçek tepe tavanını aşma
        kayit = k.kayit
        bolumler.append(dict(baslik=baslik, calgi=ad, y=y * 10 ** (kazanc_db / 20), ham_tepe_dbfs=_db(ham_tepe),
                             ham_gercek_tepe_dbtp=_db(ham_gt), ham_rms_dbfs=round(ham_rms, 2), kazanc_db=round(kazanc_db, 2),
                             ornek=len({r['dosya'] for r in kayit}), en_buyuk_kayma=max([abs(r['kayma']) for r in kayit] or [0]),
                             karisim=sum(1 for r in kayit if r['agirlik'] < 1), hatalar=s.hatalar, uyarilar=k.uyarilar))
    # gerçek tepe tavanı: gerekirse hepsini birlikte kıs (yalnız kısar)
    tepeler = [_gercek_tepe(b['y']) for b in bolumler]
    en = max(tepeler) if tepeler else 0.0
    ortak_db = min(0.0, tavan_dbtp - _db(en)) if en > 0 else 0.0
    parcalar, t, rapor = [], 0.0, []
    bosluk = np.zeros((2, int(ara_sn * SR)))
    for b, gt in zip(bolumler, tepeler):
        y = b.pop('y') * 10 ** (ortak_db / 20)
        b.update(baslangic_sn=round(t, 2), sure_sn=round(y.shape[1] / SR, 2), tepe_dbfs=_db(float(np.max(np.abs(y)))),
                 gercek_tepe_dbtp=_db(gt * 10 ** (ortak_db / 20)), rms_dbfs=round(_kapili_rms(y, SR), 2),
                 kirpma=bool(np.max(np.abs(y)) >= 1.0))
        parcalar += [y, bosluk]
        t += (y.shape[1] + bosluk.shape[1]) / SR
        rapor.append(b)
    karisim = np.concatenate(parcalar, axis=1) if parcalar else np.zeros((2, SR))
    genel = dict(dosya='.impeccable/ses/ornek-deneme.wav', sure_sn=round(karisim.shape[1] / SR, 2), sr=SR, bit=24,
                 tepe_dbfs=_db(float(np.max(np.abs(karisim)))), gercek_tepe_dbtp=_db(en * 10 ** (ortak_db / 20)),
                 ortak_kazanc_db=round(ortak_db, 2), hedef_rms_dbfs=hedef_rms_db, kirpma=bool(np.max(np.abs(karisim)) >= 1.0))
    return karisim, dict(genel=genel, bolumler=rapor)


def wav_yaz(yol, y, sr=SR):
    """(2, n) float → 24 bit PCM stereo WAV (sınır dışı değer kırpılmaz, hata verir)."""
    if np.max(np.abs(y)) >= 1.0:
        raise OrnekHatasi('kırpma olur: tepe ≥ 0 dBFS')
    q = np.round(y.T * 8388607.0).astype(np.int32).reshape(-1)
    b = np.stack([q & 0xFF, (q >> 8) & 0xFF, (q >> 16) & 0xFF], axis=1).astype(np.uint8).tobytes()
    Path(yol).parent.mkdir(parents=True, exist_ok=True)
    gecici = Path(yol).with_suffix('.yaziliyor.wav')
    with wave.open(str(gecici), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(sr)
        w.writeframes(b)
    os.replace(gecici, yol)


def deneme_yazdir(rapor):
    print(f'\n{"bölüm":62s} {"örnek":>5s} {"kayma":>5s} {"ham tepe":>8s} {"ham RMS":>8s} {"kazanç":>7s} '
          f'{"tepe":>7s} {"g.tepe":>7s} {"RMS":>7s}')
    for b in rapor['bolumler']:
        print(f'{b["baslik"][:62]:62s} {b["ornek"]:5d} {b["en_buyuk_kayma"]:5.1f} {b["ham_tepe_dbfs"]:8.1f} {b["ham_rms_dbfs"]:8.1f} '
              f'{b["kazanc_db"]:+7.1f} {b["tepe_dbfs"]:7.1f} {b["gercek_tepe_dbtp"]:7.1f} {b["rms_dbfs"]:7.1f}'
              + ('  KIRPMA' if b['kirpma'] else ''))
        for h in b['hatalar']:
            print(f'    hata: {h}')
        for u in b['uyarilar']:
            print(f'    uyarı: {u}')
    g = rapor['genel']
    print(f'\nDosya {g["dosya"]}: {g["sure_sn"]} sn, tepe {g["tepe_dbfs"]} dBFS, gerçek tepe {g["gercek_tepe_dbtp"]} dBTP, '
          f'ortak kazanç {g["ortak_kazanc_db"]} dB, kırpma {"VAR" if g["kirpma"] else "yok"}')


# ============================================================================ komut satırı
def main():
    global YAZMA
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description='Oktos örnek çalıcı: tarama, liste, deneme.')
    ap.add_argument('--kutuphane', help=f'kütüphane kökü (yoksa {ORTAM_DEGISKENI})')
    ap.add_argument('--tara', action='store_true', help='kütüphaneyi tara, ölç, haritanın tarama bölümlerini yaz')
    ap.add_argument('--deneme', action='store_true', help='her çalgıdan kısa gösterim: .impeccable/ses/ornek-deneme.wav')
    ap.add_argument('--liste', action='store_true', help='çalgılar, artikülasyonlar ve vuruş türleri')
    ap.add_argument('--calgi', help='virgülle çalgı adları (yalnız bunlar)')
    ap.add_argument('--dry-run', action='store_true', help='hiçbir dosya yazma (önbellek dahil)')
    a = ap.parse_args()
    YAZMA = not a.dry_run
    if not (a.tara or a.deneme or a.liste):
        ap.print_help()
        return 0
    try:
        kok = kutuphane_bul(a.kutuphane)
    except OrnekHatasi as e:
        print(f'HATA: {e}')
        return 2
    sec = [s.strip() for s in a.calgi.split(',')] if a.calgi else None
    harita = harita_oku()
    if sec:
        bilinmeyen = [s for s in sec if s not in harita['calgilar']]
        if bilinmeyen:
            print(f'HATA: bilinmeyen çalgı {bilinmeyen}; olanlar: {", ".join(harita["calgilar"])}')
            return 2
    if a.tara:
        print('Tarama:')
        sonuc, ozet, tepeler = tara(harita, kok, sec)
        tarama_yazdir(sonuc, ozet)
        for ad, t in sonuc.items():
            harita['calgilar'][ad]['tarama'] = {k: v for k, v in t.items() if not k.startswith('_')}
        if ozet:
            harita['tarama_ozet'] = ozet
        metin = _json_metni(harita) + '\n'
        if YAZMA:
            if HARITA_YOLU.read_text(encoding='utf-8') != metin:
                HARITA_YOLU.write_text(metin, encoding='utf-8')
                print(f'\nyazıldı: {HARITA_YOLU.relative_to(KOK).as_posix()}')
            else:
                print('\nharita değişmedi')
            eski = {}
            if TEPE_TABLOSU.exists():
                try:
                    eski = json.loads(TEPE_TABLOSU.read_text(encoding='utf-8'))
                except (OSError, ValueError):
                    eski = {}
            yeni = dict(sorted({**eski, **tepeler}.items()))
            if yeni != eski:
                ONBELLEK.mkdir(parents=True, exist_ok=True)
                TEPE_TABLOSU.write_text(json.dumps(yeni, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')
                print(f'yazıldı: {TEPE_TABLOSU.relative_to(KOK).as_posix()} ({len(yeni)} örnek tepesi)')
        else:
            print('\n--dry-run: harita ve tepe tablosu yazılmadı')
    if a.liste:
        harita = harita_oku()
        for ad in harita['calgilar']:
            if sec and ad not in sec:
                continue
            k = OrnekCalgi(ad, kok, SR, harita)
            if k.perdeli:
                parcalar = []
                for g in k.artikler():
                    r = k.aralik(g)
                    parcalar.append(f'{g} [{midi_adi(r[0])}–{midi_adi(r[1])}]' if r else f'{g} [nota yok]')
                print(f'{ad} (cal): ' + ', '.join(parcalar) + f'; varsayılan {k.varsayilan}')
            else:
                print(f'{ad} (vur): ' + ', '.join(k.turler()))
            for u in k.uyarilar:
                print(f'  uyarı: {u}')
    if a.deneme:
        print('Deneme:')
        y, rapor = deneme(kok, sec)
        deneme_yazdir(rapor)
        if YAZMA:
            wav_yaz(DENEME_WAV, y)
            DENEME_JSON.write_text(json.dumps(rapor, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
            print(f'yazıldı: {DENEME_WAV.relative_to(KOK).as_posix()}, {DENEME_JSON.relative_to(KOK).as_posix()}')
        else:
            print('--dry-run: deneme dosyası yazılmadı')
    return 0


if __name__ == '__main__':
    sys.exit(main())
