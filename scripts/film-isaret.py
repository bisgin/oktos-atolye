# -*- coding: utf-8 -*-
"""
film-isaret.py: Oktos tanıtım filminin (v06) ses işaretlerini sayfadan okur; scripts/film-ses.py müziği bunlara oturtur.

Amaç
  - lab/tanitim/film.html?cek=1 sayfasını Playwright + kurulu Edge (channel="msedge", ekransız) ile açar.
  - Sahne modüllerinin ctx.isaret(kare, tur, ek) ile bıraktığı işaretleri (window.tanitim.isaretler), vuruş kaydını
    (tanitim.vuruslar), süreyi (tanitim.sure()) ve modül hatalarını (tanitim.hatalar) okur.
  - İşaretler yönden bağımsız olmalı: varsayılan olarak öteki yön de okunur, fark UYARI olarak yazdırılır
    (dosyaya --yon ile seçilen yönün işaretleri yazılır).

Girdi
  - Yerel sunucu açık olmalı (python scripts/serve.py 8080; bu betik sunucuyu başlatmaz).
  - --yon yatay|dikey (varsayılan yatay), --dil tr|en (varsayılan tr), --port 8080
  - --karsilastirma-yok : öteki yönü okuma (daha hızlı)

Çıktı
  - .impeccable/ses/isaretler.json : meta (yön, dil, adres, zaman), sure_sn, toplam_kare (süreden), sahneler
    ({modül: [bas, son]} FİLM kareleri, tanitim.sahneler()'den), sahne_yerlesimi ([{m, ic, bas, son, kaydir}]),
    isaretler [{kare, tur, ...ek}] (FİLM karesi), vuruslar, hatalar (modül), sayfa_hatalari, uyarilar, tur_sayilari, yon_farki.
    Sahneler uzayabilir (modülün `export const ARALIK`'ı); kadro.json'daki toplam ve sahneler İÇ karelerdir, yalnız yedek.

Kullanım
  python scripts/film-isaret.py
  python scripts/film-isaret.py --yon dikey --dil en
  python scripts/film-isaret.py --dry-run        # oku, özetle, yazma

Tekrar çalıştırmak güvenlidir: yalnız .impeccable/ses/isaretler.json'un üzerine yazar.
Gereken: Python 3, playwright (pip), kurulu Microsoft Edge (ayrı tarayıcı indirilmez).
"""
import argparse
import json
import sys
import time
import urllib.request
from collections import Counter
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
CIKIS = KOK / '.impeccable' / 'ses' / 'isaretler.json'
KADRO = KOK / 'lab' / 'tanitim' / 'film' / 'kadro.json'
SAYFA = 'lab/tanitim/film.html'


def sayfa_oku(pw, url):
    """Sayfayı açar, hazır olunca işaretleri, vuruşları, süreyi ve hataları döndürür."""
    b = pw.chromium.launch(channel='msedge', headless=True, args=['--ignore-gpu-blocklist', '--enable-gpu-rasterization'])
    try:
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
        sayfa_hatalari = []
        pg.on('pageerror', lambda e: sayfa_hatalari.append(str(e)))
        pg.goto(url)
        pg.wait_for_function('window.tanitimHazir === true', timeout=90000)
        veri = pg.evaluate("""() => ({
            isaretler: JSON.parse(JSON.stringify(tanitim.isaretler)),
            vuruslar: JSON.parse(JSON.stringify(tanitim.vuruslar)),
            sahneler: tanitim.sahneler ? JSON.parse(JSON.stringify(tanitim.sahneler())) : null,
            sure: tanitim.sure(),
            hatalar: [...tanitim.hatalar],
        })""")
        veri['sayfa_hatalari'] = sayfa_hatalari
        return veri
    finally:
        b.close()


def bitis_duzelt(veri):
    """Çekirdek isaret() yalnız `kare`yi film karesine kaydırıyor; `bitis` İÇ karede kalıyor. bitis < kare ise sahnenin
    kaydir'ı eklenir (çekirdek düzeltilince bu dal kendiliğinden çalışmaz). Dönüş: uyarılar."""
    uyar = []
    for i in veri['isaretler']:
        if 'bitis' in i and i['bitis'] < i['kare'] and veri.get('sahneler'):
            s = next((s for s in veri['sahneler'] if s.get('bas') is not None and s['bas'] <= i['kare'] <= s['son']), None)
            if s and s.get('kaydir'):
                uyar.append(f'k{i["kare"]} {i["tur"]}: bitis {i["bitis"]} iç karede kalmış (film.js isaret() kaydırmıyor), '
                            f'+{s["kaydir"]} → {i["bitis"] + s["kaydir"]}')
                i['bitis'] += s['kaydir']
    return uyar


def anahtar(i):
    return json.dumps(i, ensure_ascii=False, sort_keys=True)


def sirala(isaretler):
    return sorted(isaretler, key=lambda i: (i['kare'], i['tur'], anahtar(i)))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='Tanıtım filmi ses işaretlerini sayfadan okur (isaretler.json).')
    ap.add_argument('--yon', choices=['yatay', 'dikey'], default='yatay', help='dosyaya yazılacak yön (varsayılan yatay)')
    ap.add_argument('--dil', choices=['tr', 'en'], default='tr')
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--karsilastirma-yok', action='store_true', help='öteki yönü okuma')
    ap.add_argument('--dry-run', action='store_true', help='oku ve özetle, dosya yazma')
    arg = ap.parse_args()

    taban = f'http://127.0.0.1:{arg.port}'
    try:
        urllib.request.urlopen(f'{taban}/lab/tanitim/film/kadro.json', timeout=5).read()
    except OSError as e:
        sys.exit(f'Yerel sunucuya ulaşılamadı ({taban}): {e}\nÖnce sunucuyu açın: python scripts/serve.py {arg.port}')

    from playwright.sync_api import sync_playwright
    t0 = time.time()
    yonler = [arg.yon] + ([] if arg.karsilastirma_yok else [y for y in ('yatay', 'dikey') if y != arg.yon])
    okunan = {}
    with sync_playwright() as pw:
        for yon in yonler:
            url = f'{taban}/{SAYFA}?cek=1&yon={yon}&dil={arg.dil}'
            okunan[yon] = sayfa_oku(pw, url)
            okunan[yon]['bitis_uyarilari'] = bitis_duzelt(okunan[yon])
            print(f'{yon}: {len(okunan[yon]["isaretler"])} işaret, {len(okunan[yon]["vuruslar"])} vuruş, '
                  f'süre {okunan[yon]["sure"]:.3f} sn ({time.time() - t0:.0f} sn)')

    ana = okunan[arg.yon]
    isaretler = sirala(ana['isaretler'])
    uyarilar = []
    # Film karesi sayfadan: toplam süreden, sahne yerleşimi tanitim.sahneler()'den (bas/son FİLM karesi; ic: modülün iç
    # kareleri, kaydir: iç → film). kadro.json'daki toplam ve sahneler iç karelerdir, yalnız sayfa vermezse yedek.
    toplam = int(round(ana['sure'] * 60))
    if ana.get('sahneler'):
        sahneler = {s['m']: [int(s['bas']), int(s['son'])] for s in ana['sahneler'] if s.get('bas') is not None}
        yerlesim = ana['sahneler']
    else:
        kadro = json.loads(KADRO.read_text(encoding='utf-8'))
        sahneler = kadro.get('sahneler', {})
        yerlesim = None
        uyarilar.append('sayfa tanitim.sahneler() vermedi: sahne aralıkları kadro.json yedeğinden (iç kareler)')
    uyarilar += ana.get('bitis_uyarilari', [])
    if sahneler and max(b for _, b in sahneler.values()) + 1 != toplam:
        uyarilar.append(f'sahnelerin sonu (k{max(b for _, b in sahneler.values())}) süreyle ({toplam} kare) uyuşmuyor')
    for h in ana['hatalar']:
        uyarilar.append(f'modül hatası: {h}')
    for h in ana['sayfa_hatalari']:
        uyarilar.append(f'sayfa hatası: {h}')
    disari = [i for i in isaretler if not 0 <= i['kare'] < toplam]
    if disari:
        uyarilar.append(f'film dışında kalan işaret: {disari}')

    # Yön farkı: işaretler yönden bağımsız olmalı (aynı kare, tür ve ek)
    yon_farki = {}
    for yon in yonler[1:]:
        a = Counter(anahtar(i) for i in ana['isaretler'])
        b = Counter(anahtar(i) for i in okunan[yon]['isaretler'])
        yalniz_ana = sorted((a - b).elements())
        yalniz_oteki = sorted((b - a).elements())
        if yalniz_ana or yalniz_oteki:
            yon_farki[yon] = {f'yalniz_{arg.yon}': [json.loads(x) for x in yalniz_ana],
                              f'yalniz_{yon}': [json.loads(x) for x in yalniz_oteki]}
            uyarilar.append(f'işaretler yöne bağlı: {arg.yon}↔{yon} farkı {len(yalniz_ana)} + {len(yalniz_oteki)} işaret')
        if abs(okunan[yon]['sure'] - ana['sure']) > 1e-6:
            uyarilar.append(f'süre yöne bağlı: {arg.yon} {ana["sure"]:.3f} sn, {yon} {okunan[yon]["sure"]:.3f} sn')
        if anahtar(okunan[yon].get('sahneler')) != anahtar(ana.get('sahneler')):
            uyarilar.append(f'sahne yerleşimi yöne bağlı: {arg.yon}↔{yon}')

    sayim = {}
    for ad, (a, b) in sahneler.items():
        c = Counter(i['tur'] for i in isaretler if a <= i['kare'] <= b)
        sayim[ad] = dict(sorted(c.items()))
    cikti = dict(
        meta=dict(sayfa=SAYFA, yon=arg.yon, dil=arg.dil, karsilastirilan_yonler=yonler,
                  okundu=time.strftime('%Y-%m-%dT%H:%M:%S'), fps=60),
        sure_sn=ana['sure'], toplam_kare=toplam, sahneler=sahneler, sahne_yerlesimi=yerlesim,
        tur_sayilari=dict(sorted(Counter(i['tur'] for i in isaretler).items())), sahne_basina=sayim,
        hatalar=ana['hatalar'], sayfa_hatalari=ana['sayfa_hatalari'], uyarilar=uyarilar, yon_farki=yon_farki,
        isaretler=isaretler, vuruslar=ana['vuruslar'],
    )

    print(f'toplam {toplam} kare ({ana["sure"]:.3f} sn)')
    print('türler:', json.dumps(cikti['tur_sayilari'], ensure_ascii=False))
    for ad, c in sayim.items():
        print(f'  {ad:13s} k{sahneler[ad][0]}–{sahneler[ad][1]} {json.dumps(c, ensure_ascii=False)}')
    for u in uyarilar:
        print('UYARI:', u)
    if arg.dry_run:
        print('dry-run: dosya yazılmadı. Yazılacak:', CIKIS.relative_to(KOK))
        return
    CIKIS.parent.mkdir(parents=True, exist_ok=True)
    CIKIS.write_text(json.dumps(cikti, ensure_ascii=False, indent=1), encoding='utf-8')
    print('yazıldı:', CIKIS.relative_to(KOK))


if __name__ == '__main__':
    main()
