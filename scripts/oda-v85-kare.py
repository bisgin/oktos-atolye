"""Oda v8.5 sunum kareleri: büstle yerinde dönüş, kutu oyunu istasyonu, gezen robot süpürge, köşedeki çöp ve "Kobe!" yayı,
genel plan; masaüstü (1440 × 900) ve telefon (390 × 844).

Amaç: kullanıcının canlı v8.4 geri bildirimine yapılan oda düzeltmelerini (core/oda-sunum.js, core/oda-robot.js, çöp ve kutu
durağı) gözle denetlenecek karelere dökmek. Sayfa gerçek odadır (oda/index.html?giris=yukleme), Biggie sunum API'siyle
(window.sunum) yönlendirilir; ölçüler (Biggie'nin yeri, robotun durumu, elma yayının tepesi) yanına JSON olarak yazılır.
Kobe yayı karesinde elmanın uçuşu boyunca her karedeki yeri toplanır ve yalnız o kare için sahneye ince bir iz çizgisi
eklenir (sitede yok; yayın biçimini göstermek için).
Girdi:  python scripts/oda-v85-kare.py --klasor KLASÖR [--adres http://127.0.0.1:8095] [--yalniz masaustu|telefon]
        [--sahne genel,bust,kutu,robot,kobe] [--dry-run]
        Sunucu ayrıca çalışıyor olmalı (scripts/serve.py). Playwright (Python) + kurulu Edge (channel msedge).
Çıktı:  KLASÖR/<ekran>-<n>-<sahne>.png ve KLASÖR/olcum.json. Var olan aynı adlı dosyanın üzerine yazar (--dry-run yalnız
        planı yazar). Ağ: sayfanın kendi CDN modülleri (three, gsap).
"""
import argparse
import json
import os
import sys
import time

EKRAN = {'masaustu': dict(viewport={'width': 1440, 'height': 900}),
         'telefon': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)}


def bekle(pg, js, sure=60, adim=0.25):
    t = time.time()
    while time.time() - t < sure:
        v = pg.evaluate(js)
        if v:
            return v
        time.sleep(adim)
    return None


def olay(pg, ad, sonra, kosul='true', sure=60):
    return bekle(pg, f"(() => window.sunum?.kayit.find((e) => e.ad === {json.dumps(ad)} && e.t > {sonra} && ({kosul})) || null)()", sure)


def simdi(pg):
    return pg.evaluate('Math.round(performance.now() - window.sunum.t0)')


def durum(pg):
    return json.loads(pg.evaluate("JSON.stringify({ biggie: window.karakter?.durum ?? null, robot: window.story.api.robot?.durum ?? null, "
                                  "kamera: window.story.camera.position.toArray().map(Math.round), elma: window.karakter?.elma ?? null })"))


def geri_genel(pg):
    for _ in range(3):
        if pg.evaluate('window.story.focusedId === null && !window.sunum.bust && !window.sunum.kutu'):
            break
        pg.keyboard.press('Escape')
        time.sleep(1.6)


def calis(b, adres, ekran, klasor, sahneler, olcum):
    c = b.new_context(**EKRAN[ekran])
    pg = c.new_page()
    log = []
    pg.on('console', lambda m: log.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: log.append(('pageerror', str(e))))
    pg.goto(f'{adres}/oda/index.html?giris=yukleme')
    bekle(pg, "window.sunum?.acilis === 'bitti' && !!window.story?.api?.portfolyo?.dolu", 150)
    time.sleep(2)
    O = olcum.setdefault(ekran, {})

    SIRA = ['genel-plan', 'bust-donuyor', 'bust-yerinde-donus', 'kutu-istasyonu', 'kutu-rafin-ustunde', 'robot-gezerken', 'cop-kosede-kobe-yayi',
            'bust-sag-bilek', 'fare-gecisi-ilk-an', 'buzdolabi-elma-alma',
            'kutular-onde', 'kutu-diz-bekleme', 'kutu-alis', 'kutu-rafin-ustunde-diz']

    def kare(ad):
        no = SIRA.index(ad) + 1 if ad in SIRA else 99  # sabit numara: tek sahne yeniden çekilince ad aynı kalır
        yol = os.path.join(klasor, f'{ekran}-{no}-{ad}.png')
        pg.screenshot(path=yol)
        O[ad] = {'dosya': os.path.basename(yol), **durum(pg)}
        print(ekran, ad, json.dumps(O[ad], ensure_ascii=False)[:300])

    if 'genel' in sahneler:
        geri_genel(pg)
        # Biggie odada beklerken (inişi ve eşikteki dansı bitmiş)
        bekle(pg, "(() => { const d = window.karakter?.durum; return !d || (d.yer === 'zemin' && d.y < 1500 && d.klip !== 'yuru'); })()", 60)
        time.sleep(1.5)
        kare('genel-plan')
    if 'bust' in sahneler:
        t = simdi(pg)
        pg.evaluate("window.sunum.git('kitaplik')")
        olay(pg, 'vardi', t, "e.id === 'kitaplik'", 40)
        time.sleep(1.5)
        t = simdi(pg)
        pg.evaluate("window.sunum.parca('bust', 0)")
        # Dönüşün ortası (bust-don olayından ~0,9 sn sonra) ve büst elde, yakın plan oturunca
        if olay(pg, 'bust-don', t, 'true', 40):
            time.sleep(0.9)
            kare('bust-donuyor')
        olay(pg, 'bust-elde', t, 'true', 40)
        time.sleep(2.0)
        kare('bust-yerinde-donus')
        geri_genel(pg)
    if 'kutu' in sahneler:
        t = simdi(pg)
        pg.evaluate("window.sunum.git('oyunlar')")
        olay(pg, 'vardi', t, "e.id === 'oyunlar'", 40)
        time.sleep(2.2)
        kare('kutu-istasyonu')
        t = simdi(pg)
        pg.evaluate("window.sunum.parca('kutu', 1)")
        olay(pg, 'kutu-ustte', t, 'true', 40)
        time.sleep(1.6)
        kare('kutu-rafin-ustunde')
        geri_genel(pg)
    if 'robot' in sahneler:
        # Robot gezerken: istasyondan çıkmışsa kamera robota (yanından, alçaktan; ışığı ve fırçası görünsün)
        bekle(pg, "window.story.api.robot?.durum.durum === 'git' && Math.hypot(window.story.api.robot.durum.x - 1880, window.story.api.robot.durum.y + 1250) > 900", 200)
        p = pg.evaluate('window.story.api.robot.konum()')
        pg.evaluate("(p) => window.sunum.kameraUc({ pos: [p.x - 650, p.y - 1150, 900], target: [p.x, p.y, 60] }, 0.01)", p)
        time.sleep(0.8)
        kare('robot-gezerken')
        geri_genel(pg)
        time.sleep(1.5)
    if 'kobe' in sahneler:
        # Elma: buzdolabından alır, masada oturarak yer, oradan köşedeki çöpe atar ("Kobe!"). Kamera masa ile çöpü birlikte
        # görür (buzdolabının üstünden çöpün ağzına bakan yükseklikten)
        t = simdi(pg)
        pg.evaluate("window.sunum.git('buzdolabi')")
        olay(pg, 'kobe', t, 'true', 150)
        pg.evaluate("""() => { window.__iz = []; const E = window.karakter.debug?.elmaDurum; (function f() { const g = E?.elde; if (g) { const v = g.getWorldPosition(g.position.clone()); window.__iz.push(v.toArray()); } if (window.__iz.length < 400) requestAnimationFrame(f); })(); }""")
        # Telefonda (dar yatay görüş) masanın sol önünden, yayın boyunca bakar; buzdolabı çöpün önüne girmez
        kam = "{ pos: [-1700, -200, 2450], target: [900, 1350, 800] }" if ekran == 'telefon' else "{ pos: [650, -250, 2380], target: [500, 1250, 700] }"
        pg.evaluate(f"window.sunum.kameraUc({kam}, 0.01)")
        olay(pg, 'isabet', t, 'true', 20)
        time.sleep(0.3)
        iz = pg.evaluate('window.__iz')
        tepe = max((p[2] for p in iz), default=None)
        # İz çizgisi (yalnız bu kare): three modülü içe aktarma haritasındaki tam adresinden (sayfanınkiyle aynı örnek)
        pg.evaluate("""async (iz) => { const harita = JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports;
          const THREE = await import(new URL(harita.three, location.href).href);
          const g = new THREE.BufferGeometry().setFromPoints(iz.map((p) => new THREE.Vector3(...p)));
          const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffd23f, depthTest: false, transparent: true, opacity: 0.9 }));
          l.renderOrder = 10; l.name = 'kobe_iz'; window.story.scene.add(l); }""", iz)
        time.sleep(0.4)
        O['kobe-yayi'] = {'tepe_mm': round(tepe) if tepe else None, 'nokta': len(iz)}
        kare('cop-kosede-kobe-yayi')
    # Bir klibin belirli karesi gelince (sayfanın kendi karesinde) kamerayı dondurmadan bekler: ad, kare aralığı
    def klip_bekle(ad, k0, k1, sure=150):
        return pg.evaluate("""([ad, k0, k1, sure]) => new Promise((coz) => { const t0 = performance.now();
          (function f() { const z = window.karakter?.klipZamani?.();
            if (z && z.ad === ad && z.kare >= k0 && z.kare <= k1) return coz(Math.round(z.kare * 10) / 10);
            if (performance.now() - t0 > sure * 1000) return coz(null); requestAnimationFrame(f); })(); })""", [ad, k0, k1, sure])
    if 'bilek' in sahneler:
        # Büst tutuşta sağ bilek: kamera elin 450 mm önünden (Biggie'nin baktığı yandan), manşet ve avuç birlikte
        t = simdi(pg)
        pg.evaluate("window.sunum.git('kitaplik')")
        olay(pg, 'vardi', t, "e.id === 'kitaplik'", 40)
        time.sleep(1.5)
        t = simdi(pg)
        pg.evaluate("window.sunum.parca('bust', 0)")
        olay(pg, 'bust-elde', t, 'true', 40)
        time.sleep(2.5)
        # Elden yakın plan kamerası her karede ele bağlı (sunum): yalnız bu kare için sahnenin setView'ı bu bakışta tutulur
        pg.evaluate("""() => { const S = window.story, k = window.karakter, e = (k.kemik('elR') ?? k.elKemigi), p = e.getWorldPosition(e.position.clone()), psi = k.durum.psi + 0.3;
          const v = [[p.x + Math.sin(psi) * 650, p.y - Math.cos(psi) * 650, p.z + 150], [p.x, p.y, p.z]], asil = S.setView;
          window.__setView = asil; S.setView = () => asil.apply(S, v); asil.apply(S, v); }""")
        time.sleep(0.8)
        kare('bust-sag-bilek')
        pg.evaluate("() => { window.story.setView = window.__setView; }")  # sahnenin kendi setView'ı geri
        geri_genel(pg)
    if 'fare' in sahneler:
        # Masada: oturur, yazar; fare emote'u başlayınca ilk kareler (avuç 12. karede farede). Kamera farenin sağ önünden
        t = simdi(pg)
        pg.evaluate("window.sunum.git('masa')")
        olay(pg, 'oturdu', t, 'true', 60)
        pg.evaluate("window.sunum.kameraUc({ pos: [-250, 950, 1180], target: [-700, 1330, 800] }, 0.01)")
        f = klip_bekle('fare', 10, 16, 150)
        O['fare-kare'] = f
        kare('fare-gecisi-ilk-an')
        geri_genel(pg)
    if 'elma' in sahneler:
        # Buzdolabı: kapak açık, el içerideki elmada ('al' karesi çevresi)
        al = pg.evaluate("window.karakter.meta('buzdolabi_ac')?.al ?? 62")
        pg.evaluate("window.sunum.git('buzdolabi')")
        f = klip_bekle('buzdolabi_ac', al - 8, al - 5, 60)
        # Kamera elmanın yanından: Biggie'nin başının elmaya göre yönünden 65° yana, kapağın tersindeki (−y) yandan, açıklığın önünde (x < 1400)
        pg.evaluate("""() => { const k = window.karakter, h = k.kafaUstu(), o = window.story.scene.getObjectByName('buz_elma_0'), e = o.getWorldPosition(o.position.clone());
          const a = Math.atan2(h.y - e.y, h.x - e.x); let en = null;
          for (const d of [1.15, -1.15]) { const b = a + d, p = [e.x + Math.cos(b) * 1150, e.y + Math.sin(b) * 1150, 1250]; if (!en || p[1] < en[1]) en = p; }
          en[0] = Math.min(en[0], 1400); window.sunum.kameraUc({ pos: en, target: [e.x, e.y, e.z + 60] }, 0.01); }""")
        f = klip_bekle('buzdolabi_ac', al - 2, al + 2, 30)
        O['elma-kare'] = f
        kare('buzdolabi-elma-alma')
    if 'kutudiz' in sahneler:
        # v8.5c (A yolu): durakta diz üstü bekleme; uzak gözden (göz 3, kutu 7) alış; kutu rafın üstünde, Biggie diz üstünde
        t = simdi(pg)
        pg.evaluate("window.sunum.git('oyunlar')")
        olay(pg, 'vardi', t, "e.id === 'oyunlar'", 40)
        bekle(pg, "window.karakter.durum.klip === 'diz_bekle'", 20)
        time.sleep(1.0)
        kare('kutu-diz-bekleme')
        t = simdi(pg)
        pg.evaluate("window.sunum.parca('kutu', 6)")
        O['alis-kare'] = klip_bekle('kutu_al_diz', 60, 66, 60)
        kare('kutu-alis')
        olay(pg, 'kutu-ustte', t, 'true', 40)
        bekle(pg, "window.karakter.durum.klip === 'diz_bekle'", 10)
        time.sleep(1.0)
        kare('kutu-rafin-ustunde-diz')
    O['konsol'] = log
    c.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--klasor', required=True)
    ap.add_argument('--adres', default='http://127.0.0.1:8095')
    ap.add_argument('--yalniz', choices=list(EKRAN))
    ap.add_argument('--sahne', default='genel,bust,kutu,robot,kobe')  # ek: bilek,fare,elma
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')
    ekranlar = [a.yalniz] if a.yalniz else list(EKRAN)
    sahneler = a.sahne.split(',')
    if a.dry_run:
        print(f'adres {a.adres}; ekranlar {ekranlar}; sahneler {sahneler}; klasör {a.klasor}')
        return 0
    os.makedirs(a.klasor, exist_ok=True)
    from playwright.sync_api import sync_playwright
    olcum = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'])
        try:
            for e in ekranlar:
                calis(b, a.adres, e, a.klasor, sahneler, olcum)
        finally:
            b.close()
    with open(os.path.join(a.klasor, 'olcum.json'), 'w', encoding='utf-8') as f:
        json.dump(olcum, f, ensure_ascii=False, indent=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
