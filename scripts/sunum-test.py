"""Biggie'li rehberli sunumu (core/oda-sunum.js + core/oda-karakter.js) gerçek odada uçtan uca sınar ve açılışın kare
sürelerini ölçer.

Amaç: açılış sırası (yazıların görünme/kaybolma zaman damgaları, dans ile ilişkisi), durak ziyaretleri (yuvalı, yuvasız,
yolda hedef değiştirme), elma senaryosu (2 elma, yürürken yeme, çöpe isabet, 3. ziyarette boş buzdolabı), "Çalışmaya dön"
→ oturma → Biggie'siz sunum; konsolda hata ve uyarı 0. Ardından telefon taklidinde (390×844, DPR 3, 4× CPU yavaşlatma)
iki giriş kipinin (?giris=dans, ?giris=yukleme) açılış kare sürelerini (requestAnimationFrame aralıkları) karşılaştırır.
Girdi:  python scripts/sunum-test.py [--adres http://127.0.0.1:8082] [--json] [--yalniz islev|kare] [--kare KLASÖR]
        [--video DOSYA.mp4] [--dry-run]
        Sunucu ayrıca çalışıyor olmalı (scripts/serve.py). Playwright (Python) + kurulu Edge (channel msedge).
Çıktı:  her kontrol için bir satır, kare süreleri tablosu (ya da --json); çıkış kodu 0 geçti, 1 kaldı.
        Yalnız --kare (ara kareler, PNG) ve --video (360p önizleme: açılış + elma, ffmpeg ile mp4) dosya yazar; başka bir
        şey yazmaz, silmez. Ağ: sayfanın kendi CDN modülleri (three, gsap).
"""
import argparse
import json
import os
import shutil
import statistics
import subprocess
import sys
import tempfile
import time

KARE_TOPLA = """
window.__kare = [];
(function f(t) { window.__kare.push(t); requestAnimationFrame(f); })(performance.now());
"""


class Test:
    def __init__(self):
        self.sonuc = []
        self.konsol = []

    def kontrol(self, grup, ad, gecti, ayrinti=''):
        self.sonuc.append({'grup': grup, 'ad': ad, 'gecti': bool(gecti), 'ayrinti': ayrinti})
        return gecti


def sayfa_ac(b, adres, test=None, **ctx):
    c = b.new_context(**ctx)
    pg = c.new_page()
    if test is not None:
        pg.on('console', lambda m: test.konsol.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: test.konsol.append(('pageerror', str(e))))
    return c, pg


def bekle(pg, js, sure=60, adim=0.25):
    t = time.time()
    while time.time() - t < sure:
        v = pg.evaluate(js)
        if v:
            return v
        time.sleep(adim)
    return None


def olay_bekle(pg, ad, sonra=0, kosul='true', sure=60):
    """sunum.kayit'ta t > sonra olan ilk 'ad' olayını bekler (kosul: e değişkeniyle JS ifadesi)"""
    return bekle(pg, f"(() => window.sunum?.kayit.find((e) => e.ad === {json.dumps(ad)} && e.t > {sonra} && ({kosul})) || null)()", sure)


def simdi(pg):
    return pg.evaluate('Math.round(performance.now() - window.sunum.t0)')


def acilis_bekle(pg, sure=90):
    return bekle(pg, "window.sunum?.zaman.acilisBitti !== undefined && window.sunum.zaman.kameraGenel !== undefined || window.sunum?.acilis === 'bitti' ? JSON.stringify(window.sunum.zaman) : null", sure)


def kare_al(pg, klasor, ad):
    if klasor:
        pg.screenshot(path=os.path.join(klasor, f'{ad}.png'))


def tikla(pg, sel):
    """Düğmeye gerçek fare tıklaması (öğenin ekrandaki ortası; Playwright click'inin görünür kılmak için kaydırması turu
    oynatıyordu)"""
    r = pg.evaluate(f"(() => {{ const e = document.querySelector({json.dumps(sel)}); if (!e || e.hidden || e.disabled) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }})()")
    if r:
        pg.mouse.click(r[0], r[1])
    return r


def kutu_durum(pg):
    return json.loads(pg.evaluate('JSON.stringify(window.sunum.kutu)') or 'null')


def kutu_oyunlari(pg, test, klasor=None):
    """v7: rafa tıkla → kutunun ipucu → kutuya tıkla (Biggie diz çöker, kutuyu rafın üstüne koyar, bekler) → sağ ok ×2 →
    sol ok → başka kutu → Geri"""
    G = 'Kutu oyunları (v7)'
    t = simdi(pg)
    pg.evaluate("window.sunum.git('oyunlar')")
    v = olay_bekle(pg, 'vardi', t, "e.id === 'oyunlar'", 40)
    test.kontrol(G, 'rafa tıklama: kamera rafta, Biggie rafın yanında (kutu almadı)', v and pg.evaluate("window.story.focusedId === 'oyunlar'") and not pg.evaluate(f"window.sunum.kayit.some((e) => e.ad === 'kutu-al' && e.t > {t})"))
    time.sleep(1.6)
    xy = pg.evaluate('window.sunum.kutuNokta(1)')
    pg.mouse.move(xy[0] - 3, xy[1]) if xy else None
    time.sleep(0.15)
    if xy:
        pg.mouse.move(xy[0], xy[1])
    time.sleep(0.4)
    ip = pg.evaluate("(() => { const e = document.querySelector('.oda-kutu-ipucu'); return e && !e.hidden ? e.innerText : null })()")
    # Fare kamerayı biraz döndürür (paralaks): imlecin altındaki kutu komşusu olabilir; ipucundaki kutuyla sürer
    no = pg.evaluate("window.sunum.kutuPanel.ipucuNo")
    test.kontrol(G, 'fare kutunun üstünde: ad + tek satır imlecin yanında', xy and ip and no is not None and f'Kutu oyunu {no + 1}' in ip and 'Taslak' in ip, json.dumps([xy, ip, no], ensure_ascii=False))
    no = 1 if no is None else no
    kare_al(pg, klasor, '10-raf-ipucu')
    t = simdi(pg)
    if xy:
        pg.mouse.click(xy[0], xy[1])
    s = olay_bekle(pg, 'kutu-sec', t, f'e.no === {no + 1}', 5)
    test.kontrol(G, 'kutuya tıklama: panel açıldı (sayfa 1, Taslak)', s and pg.evaluate("!document.querySelector('.oda-kutu').hidden && document.querySelector('.oda-kutu .ok-sayac').textContent.includes('1') && !document.querySelector('.ok-taslak').hidden"))
    u = olay_bekle(pg, 'kutu-ustte', t, f'e.no === {no + 1}', 40)
    tt = olay_bekle(pg, 'tutuyor', t, 'true', 20)
    k = kutu_durum(pg)
    test.kontrol(G, 'Biggie diz çöktü, kutuyu aldı, rafın üstüne koydu (z ≈ 420 + yarı kalınlık), dizlerinde bekliyor', u and tt and k and k['ustte'] and 440 <= k['z'] <= 470 and k['tutuyor'], json.dumps(k))
    pg.mouse.move(640, 427)  # imleç ortada: yakın plan salınımı sıfırda
    time.sleep(1.4)
    kk = json.loads(pg.evaluate("""(() => { const S = window.story, c = S.camera, K = S.api.kadraj, m = S.api.portfolyo.parcalar().oyun[window.sunum.kutu.no];
      const kutu = new (S.api.kutu('oyunlar').constructor)().setFromObject(m);
      return JSON.stringify(K.olcum({ pos: c.position.toArray(), target: S.view().target }, { kutu, nesne: m, fov: c.fov, aspect: c.aspect })); })()"""))
    test.kontrol(G, 'kutu sahnesi kadrajı: göz yüksekliği, oda içi, oda dışı piksel 0, Biggie kutuyu örtmüyor (≤ %10, gövde kemiği küreleri)', kk.get('goz') and kk.get('oda') and kk.get('disari') == 0 and kk.get('ortu') is not None and kk['ortu'] <= 0.10, json.dumps(kk))
    test.kutu_kadraj = kk
    kare_al(pg, klasor, '11-kutu-rafin-ustunde')
    oklar = pg.evaluate("[...document.querySelectorAll('.oda-kutu-ok')].map((b) => [b.getAttribute('aria-label'), !b.hidden])")
    test.kontrol(G, 'iki ok düğmesi görünür ve adlı (erişilebilir)', len(oklar) == 2 and all(a and g for a, g in oklar), json.dumps(oklar, ensure_ascii=False))
    q0 = k['q'] if k else None
    for _ in range(2):
        tikla(pg, '.oda-kutu-ok.sag')
        time.sleep(1.3)
    k = kutu_durum(pg)
    test.kontrol(G, 'sağ ok ×2: sayfa 3, kutu döndü', k and k['sayfa'] == 3 and k['q'] != q0, json.dumps(k))
    tikla(pg, '.oda-kutu-ok.sol')
    time.sleep(1.3)
    k = kutu_durum(pg)
    bas = pg.evaluate("document.querySelector('.oda-kutu .ok-baslik').textContent")
    test.kontrol(G, 'sol ok: sayfa 2 ("Benim katkım" + görsel yeri)', k and k['sayfa'] == 2 and bas == 'Benim katkım' and pg.evaluate("!document.querySelector('.ok-gorsel').hidden"), json.dumps([k, bas], ensure_ascii=False))
    kare_al(pg, klasor, '12-sayfa-2')
    pg.keyboard.press('ArrowRight')
    time.sleep(1.2)
    k = kutu_durum(pg)
    test.kontrol(G, 'klavye →: sayfa 3', k and k['sayfa'] == 3, json.dumps(k))
    pg.keyboard.press('ArrowLeft')
    time.sleep(1.2)
    t = simdi(pg)
    xy = None
    for i in [x for x in (5, 6, 7, 4, 0, 2, 3, 1) if x != no]:
        xy = pg.evaluate(f'window.sunum.kutuNokta({i})')
        if xy:
            break
    if xy:
        pg.mouse.click(xy[0], xy[1])
    r = olay_bekle(pg, 'kutu-rafta', t, f'e.no === {no + 1}', 30)
    u = olay_bekle(pg, 'kutu-ustte', t, f'e.no !== {no + 1}', 40)
    k = kutu_durum(pg)
    test.kontrol(G, 'panel açıkken başka kutu: önceki rafa döndü, yenisi alındı', xy and r and u and k and k['no'] != no and k['panel'], json.dumps([xy, k]))
    time.sleep(0.6)
    t = simdi(pg)
    tikla(pg, '.ok-geri')
    r = olay_bekle(pg, 'kutu-rafta', t, 'true', 30)
    time.sleep(1.8)
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'Geri: kutu rafa döndü, panel kapandı, Biggie kalktı', r and kutu_durum(pg) is None and pg.evaluate("document.querySelector('.oda-kutu').hidden") and d.get('klip') in ('dur', 'diz_kalk', 'yuru'), json.dumps(d))
    kare_al(pg, klasor, '13-geri')


def kamera_kurali(pg, test, klasor=None):
    """v7 kamera kuralı: yakın plan ve istasyon kadrajlarında kamera göz yüksekliğinde (1400–1700), odanın içinde, kadrajda
    oda dışı piksel 0; odak nesnesinin karakter tarafından örtülme oranı ölçülür (≤ %10)"""
    G = 'Kamera kuralı (v7)'
    olc = """(id) => { const S = window.story, c = S.camera, nesne = S.api.model(id) ?? S.api.nesne(id), kutu = S.api.kutu(id) ?? (nesne ? new (S.api.kutu('oyunlar').constructor)().setFromObject(nesne) : null);
      return JSON.stringify(S.api.kadraj.olcum({ pos: c.position.toArray(), target: S.view().target }, { kutu, nesne, fov: c.fov, aspect: c.aspect })); }"""
    sonuc = {}
    for id_ in ('anahtarlik', 'figur', 'raf', 'maske', 'biblo', 'kitaplik', 'ekran', 'hakkimda', 'buzdolabi'):
        t = simdi(pg)
        pg.evaluate(f"window.sunum.git({json.dumps(id_)})")
        olay_bekle(pg, 'vardi', t, f"e.id === {json.dumps(id_)}", 40)
        pg.mouse.move(640, 427)  # imleç ortada: yakın plan salınımı sıfırda
        time.sleep(2.2)
        r = json.loads(pg.evaluate(olc, id_))
        sonuc[id_] = r
        # Buzdolabında Biggie'nin eylemi dolabın önünde (elmayı içinden alır): örtme ölçülür, yazılır, koşul değil
        ok = r.get('goz') and r.get('oda') and r.get('disari') == 0 and (id_ == 'buzdolabi' or (r.get('ortu') or 0) <= 0.10)
        test.kontrol(G, f"{id_}: z {r.get('z')}, oda dışı {r.get('disari')}, karakter örtmesi {r.get('ortu')}", ok, json.dumps(r))
        if id_ in ('figur', 'kitaplik', 'ekran', 'buzdolabi'):
            kare_al(pg, klasor, f'2{list(sonuc).index(id_)}-kadraj-{id_}')
    test.kamera = sonuc


def armut_testi(pg, test, klasor=None):
    """v7 armut: TV durağında Biggie armuta yatar (armut_yat; yoksa tv_armut giriş + dongu bölümü döngüde), armut içine
    göçer; başka başlıkta kalkar, armut yavaşça eski hâline döner. Tam ezilme (u = 1) ölçüsü: oturak ~220, sırt ~650"""
    G = 'Armut (v7)'
    t = simdi(pg)
    pg.evaluate("window.sunum.git('ekran')")
    v = olay_bekle(pg, 'vardi', t, "e.id === 'ekran'", 40)
    tt = olay_bekle(pg, 'tutuyor', t, 'true', 25)
    time.sleep(2.5)
    a = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)') or 'null')
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'Biggie armutta bekliyor (uyuklama döngüsü), armut ezildi', v and tt and a and a['u'] > 0.05 and d.get('klip') in ('armut_uyukla', 'tv_armut'), json.dumps([a, d]))
    pg.mouse.move(640, 427)
    time.sleep(1.5)
    r = json.loads(pg.evaluate("""(() => { const S = window.story, c = S.camera, a = S.api.portfolyo.armut, kutu = new (S.api.kutu('oyunlar').constructor)().setFromObject(a);
      return JSON.stringify(S.api.kadraj.olcum({ pos: c.position.toArray(), target: S.view().target }, { kutu, fov: c.fov, aspect: c.aspect })); })()"""))
    test.kontrol(G, f"armut yakın planı kamera kuralında (z {r.get('z')}, oda dışı {r.get('disari')})", r.get('goz') and r.get('oda') and r.get('disari') == 0 and pg.evaluate("window.sunum.kayit.some((e) => e.ad === 'kadraj')"), json.dumps(r))
    kare_al(pg, klasor, '30-armut-uyuklama')
    pg.evaluate('window.sunum.armutZorla(1)')
    time.sleep(0.6)
    a1 = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)'))
    test.kontrol(G, 'tam ezilme: oturak ≈ 220 mm, sırt tepesi ≈ 650 mm ve geriye yatık', abs(a1['oturak'] - 220) <= 20 and abs(a1['sirt'][2] - 650) <= 50 and a1['sirt'][1] > 200, json.dumps(a1))
    pg.evaluate('window.sunum.armutZorla(null)')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('biblo')")
    k = olay_bekle(pg, 'eylem-kapat', t, 'true', 10)
    time.sleep(0.5)
    yolda = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)'))
    olay_bekle(pg, 'vardi', t, "e.id === 'biblo'", 40)
    a2 = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)'))
    test.kontrol(G, 'başka başlık: armuttan kalktı, armut yavaşça eski hâline döndü', k and a2['u'] < 0.01 and yolda['u'] > 0, json.dumps([k, yolda, a2]))


def islev(b, adres, test, klasor=None):
    G = 'Açılış (?giris=dans, masaüstü 1280×800)'
    c, pg = sayfa_ac(b, adres, test, viewport={'width': 1280, 'height': 800})
    pg.goto(f'{adres}/oda/index.html?giris=dans')
    z = acilis_bekle(pg)
    if not test.kontrol(G, 'açılış bitti (90 sn içinde)', z):
        c.close()
        return
    z = json.loads(z)
    test.zaman = z
    sira = ['hazir', 'dansBasla', 'isimBasla', 'isimTam', 'isimCik', 'isimBitti', 'cumleBasla', 'cumleBitti', 'acilisBitti']
    test.kontrol(G, 'sıra: ' + ' < '.join(sira), all(k in z for k in sira) and all(z[sira[i]] <= z[sira[i + 1]] for i in range(len(sira) - 1)), json.dumps(z))
    test.kontrol(G, 'isim dansla başlar (≤ 100 ms)', abs(z.get('isimBasla', 0) - z.get('dansBasla', -999)) <= 100)
    test.kontrol(G, 'iki satır dans bitmeden kaybolmaz', z.get('isimCik', 0) >= z.get('dansBitti', 1e9) - 50)
    test.kontrol(G, 'cümle isimlerden sonra', z.get('cumleBasla', 0) >= z.get('isimBitti', 1e9))
    d = pg.evaluate('JSON.stringify(window.karakter?.durum)')
    d = json.loads(d) if d else {}
    test.kontrol(G, 'Biggie odanın ortasında bekliyor (dur)', d.get('yer') == 'zemin' and d.get('klip') == 'dur' and abs(d.get('x', 0) - 520) < 40, json.dumps(d))
    test.kontrol(G, 'tur başladı (kamera turun)', pg.evaluate('window.story.driven') and not pg.evaluate("document.getElementById('story').classList.contains('sunum-acilis')"))
    kare_al(pg, klasor, '01-acilis-sonu')
    pg.evaluate('window.karakter.debug.AYAR.isirikAra = 1.6')  # elma senaryosu kısa sürsün

    G = 'Duraklar'
    t = simdi(pg)
    pg.evaluate("window.sunum.git('raf')")  # yuvalı: motor → onActivate → tur + Biggie
    v = olay_bekle(pg, 'vardi', t, "e.id === 'raf'", 40)
    test.kontrol(G, 'yuvalı durak (raf): Biggie vardı', v)
    test.kontrol(G, 'yuvalı durak: kamera yakın planda (kart açık)', pg.evaluate("window.story.focusedId === 'raf'"))
    test.kontrol(G, 'yuvalı durak: eylem bitti', olay_bekle(pg, 'eylem-bitti', t, "e.id === 'raf'", 20))
    kare_al(pg, klasor, '02-raf')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('kitaplik')")  # yuvasız: ışın + kamera bu modülde
    test.kontrol(G, 'yuvasız durak (kitaplik): Biggie vardı', olay_bekle(pg, 'vardi', t, "e.id === 'kitaplik'", 40))
    test.kontrol(G, 'yuvasız durak: eylem bitti', olay_bekle(pg, 'eylem-bitti', t, "e.id === 'kitaplik'", 20))
    kare_al(pg, klasor, '03-kitaplik')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('ekran')")
    time.sleep(1.2)
    yolda = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    pg.evaluate("window.sunum.git('biblo')")
    v = olay_bekle(pg, 'vardi', t, "e.id === 'biblo'", 40)
    tv = pg.evaluate(f"window.sunum.kayit.some((e) => e.ad === 'vardi' && e.id === 'ekran' && e.t > {t})")
    test.kontrol(G, 'yolda yeni hedef: ekran yerine biblo', v and not tv and yolda.get('klip') == 'yuru', json.dumps(yolda))
    # Gerçek tıklama: ekranda bir ürün işaretçisine (yuvalı durak, onActivate yolu)
    t = simdi(pg)
    pg.evaluate("window.story.unfocus?.()")
    pg.evaluate("window.sunum.git('maske')")
    test.kontrol(G, 'maske (eylemsiz durak): vardı', olay_bekle(pg, 'vardi', t, "e.id === 'maske'", 40))

    G = 'Elma'
    # Gerçek tıklama: genel planda buzdolabının ekrandaki yerine (yuvasız durak: ışın + nesne kutusu)
    pg.evaluate("window.story.blur(); const s = window.story.shotOf(null); window.story.setView(s.pos, s.target)")
    time.sleep(0.6)
    xy = pg.evaluate("""(() => { const o = window.story.api.nesne('buzdolabi'); if (!o) return null;
      const T = window.story.camera.position.constructor, b = { min: new T(), max: new T() };
      const c = new T(); o.updateMatrixWorld(true); o.getWorldPosition(c); c.z = 500; c.x -= 200; c.project(window.story.camera);
      const r = window.story.renderer.domElement.getBoundingClientRect();
      return [r.left + (c.x * 0.5 + 0.5) * r.width, r.top + (-c.y * 0.5 + 0.5) * r.height]; })()""")
    t = simdi(pg)
    if xy:
        pg.mouse.click(xy[0], xy[1])
    d0 = olay_bekle(pg, 'durak', t, "e.id === 'buzdolabi'", 3)
    test.kontrol(G, 'buzdolabına gerçek tıklama durağı buldu', d0, json.dumps(xy))
    if not d0:
        pg.evaluate("window.sunum.git('buzdolabi')")
    v = olay_bekle(pg, 'elma-al', t, 'true', 40)
    test.kontrol(G, '1. ziyaret: elma alındı, sayaç 1', v and v.get('kalan') == 1, json.dumps(v))
    kare_al(pg, klasor, '04-elma-al')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('anahtarlik')")  # elmayla başka durağa: yolda yer
    isirik = olay_bekle(pg, 'isirik', t, 'true', 20)
    yd = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'yürürken ısırık (üst gövde katmanı yürüyüşle)', isirik and yd.get('klip') == 'yuru', json.dumps(yd))
    kare_al(pg, klasor, '05-yururken-yer')
    k = olay_bekle(pg, 'kobe', t, 'true', 40)
    n_isirik = pg.evaluate('window.karakter.debug.AYAR.isirik')  # v5: ısırık sayısı klibin meta'sından (4)
    test.kontrol(G, f'{n_isirik} ısırıkta bitti, "kobe"', k and pg.evaluate(f"window.sunum.kayit.filter((e) => e.ad === 'isirik' && e.t > {t}).length") == n_isirik)
    time.sleep(0.5)
    kare_al(pg, klasor, '06-kobe')
    i = olay_bekle(pg, 'isabet', t, 'true', 20)
    test.kontrol(G, '1. elma çöpe isabet', i and i.get('isabet'), json.dumps(i))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('buzdolabi')")
    v = olay_bekle(pg, 'elma-al', t, 'true', 40)
    test.kontrol(G, '2. ziyaret: elma alındı, sayaç 0', v and v.get('kalan') == 0, json.dumps(v))
    i = olay_bekle(pg, 'isabet', t, 'true', 40)  # durakta bitirip atar
    test.kontrol(G, '2. elma çöpe isabet (durakta bitirdi)', i and i.get('isabet'), json.dumps(i))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('maske')")
    olay_bekle(pg, 'vardi', t, "e.id === 'maske'", 40)
    t = simdi(pg)
    pg.evaluate("window.sunum.git('buzdolabi')")
    b_ = olay_bekle(pg, 'buzdolabi-bos', t, 'true', 40)
    yok = not pg.evaluate(f"window.sunum.kayit.some((e) => e.ad === 'elma-al' && e.t > {t})")
    test.kontrol(G, '3. ziyaret: buzdolabı boş, elma alınmadı', b_ and yok)
    e = json.loads(pg.evaluate('JSON.stringify(window.karakter.elma)'))
    test.kontrol(G, 'iki atış, ikisi de isabet', e.get('atilan') == 2 and all(e.get('isabet', [])), json.dumps(e))

    # v7 (kamera kuralı buzdolabını da gezer: elma senaryosundan sonra, kalan elma yokken)
    kutu_oyunlari(pg, test, klasor)
    kamera_kurali(pg, test, klasor)
    armut_testi(pg, test, klasor)

    G = 'Tur sonu'
    kalan = pg.evaluate("window.sunum.durak.filter((D) => !['cop', 'masa'].includes(D.id) && !window.sunum.ziyaret.has(D.id)).map((D) => D.id)")
    for id_ in kalan:
        t = simdi(pg)
        pg.evaluate(f"window.sunum.git({json.dumps(id_)})")
        olay_bekle(pg, 'vardi', t, f"e.id === {json.dumps(id_)}", 40)
    test.kontrol(G, f'bütün duraklar gezilince "Çalışmaya dön" ({len(kalan)} durak daha gezildi)', bekle(pg, "!document.querySelector('.oda-calisma').hidden", 5))
    kare_al(pg, klasor, '07-calisma-buton')
    t = simdi(pg)
    pg.click('.oda-calisma')
    o = olay_bekle(pg, 'oturdu', t, 'true', 60)
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'Biggie sandalyesine gidip oturdu', o and d.get('yer') == 'koltuk', json.dumps(d))
    kare_al(pg, klasor, '08-oturdu')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('kitaplik')")
    time.sleep(2.5)
    dz = olay_bekle(pg, 'durak', t, "e.id === 'kitaplik'", 5)
    d2 = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, "sonra Biggie'siz: durak sunuldu, Biggie masada kaldı", dz and dz.get('biggie') is False and d2.get('yer') == 'koltuk', json.dumps(d2))
    yt = pg.evaluate('JSON.stringify({ yerTutucu: window.karakter.yerTutucu, gecici: window.sunum.gecici })')
    test.yer_tutucu = json.loads(yt)
    c.close()


def kare_olc(b, adres, kip, test, video=None):
    """Telefon taklidi (390×844, DPR 3, dokunmatik) + 4× CPU: açılış yazıları boyunca rAF aralıkları"""
    ctx = dict(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
    c, pg = sayfa_ac(b, adres, test, **ctx)
    pg.add_init_script(KARE_TOPLA)
    cdp = c.new_cdp_session(pg)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.goto(f'{adres}/oda/index.html?giris={kip}')
    z = acilis_bekle(pg, 150)
    if not z:
        c.close()
        return {'kip': kip, 'hata': 'açılış bitmedi'}
    z = json.loads(z)
    r = pg.evaluate("""(z) => {
      const t0 = window.sunum.t0, k = window.__kare;
      const aralik = (a, b) => { const d = []; for (let i = 1; i < k.length; i++) if (k[i] >= t0 + a && k[i] <= t0 + b) d.push(k[i] - k[i - 1]); return d; };
      return { isim: aralik(z.isimBasla, z.isimBitti), cumle: aralik(z.cumleBasla, z.cumleBitti), takip: z.takip ?? null };
    }""", z)
    c.close()

    def ozet(d):
        if not d:
            return None
        s = sorted(d)
        return {'kare': len(d), 'ort': round(statistics.mean(d), 1), 'p95': round(s[min(len(s) - 1, int(0.95 * len(s)))], 1), 'enCok': round(s[-1], 1),
                'fps': round(1000 / statistics.mean(d), 1)}
    return {'kip': kip, 'zaman': z, 'isim': ozet(r['isim']), 'cumle': ozet(r['cumle']), 'takip': r['takip']}


def video_cek(b, adres, hedef):
    """360p önizleme: açılış + elma (masaüstü 1280×720 kadraj). Kareler CDP ekran yayınından (Page.startScreencast,
    640×360 JPEG, zaman damgalı) alınır, sistemdeki ffmpeg ile 30 fps mp4 olur (Playwright'ın kendi ffmpeg'i gerekmez)"""
    import base64
    tmp = tempfile.mkdtemp(prefix='sunum-video-')
    c = b.new_context(viewport={'width': 1280, 'height': 720})
    pg = c.new_page()
    cdp = c.new_cdp_session(pg)
    kareler = []

    def kare(e):
        yol = os.path.join(tmp, f'{len(kareler):05d}.jpg')
        with open(yol, 'wb') as f:
            f.write(base64.b64decode(e['data']))
        kareler.append((yol, e['metadata'].get('timestamp', time.time())))
        try:
            cdp.send('Page.screencastFrameAck', {'sessionId': e['sessionId']})
        except Exception:
            pass
    cdp.on('Page.screencastFrame', kare)
    t_bas = time.time()
    pg.goto(f'{adres}/oda/index.html?giris=dans')
    cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 85, 'maxWidth': 640, 'maxHeight': 360, 'everyNthFrame': 1})
    bekle(pg, 'window.sunum?.zaman.hazir', 60)
    acilis_bekle(pg)
    t = simdi(pg)
    pg.evaluate("window.sunum.git('buzdolabi')")
    olay_bekle(pg, 'elma-al', t, 'true', 40)
    time.sleep(1.0)
    pg.evaluate("window.sunum.git('cop')")
    olay_bekle(pg, 'isabet', t, 'true', 40)
    time.sleep(1.5)
    cdp.send('Page.stopScreencast')
    c.close()
    # Değişken aralıklı kareler: concat listesinde her karenin süresi bir sonrakine kadar
    liste = os.path.join(tmp, 'liste.txt')
    with open(liste, 'w', encoding='utf-8') as f:
        for i, (yol, ts) in enumerate(kareler):
            sonraki = kareler[i + 1][1] if i + 1 < len(kareler) else ts + 1 / 30
            f.write(f"file '{yol.replace(os.sep, '/')}'\nduration {max(0.001, sonraki - ts):.4f}\n")
        f.write(f"file '{kareler[-1][0].replace(os.sep, '/')}'\n")
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    gecici = os.path.join(tmp, 'cikti.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-vf', 'fps=30,scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', '-an', gecici], check=True)
    shutil.copyfile(gecici, hedef)
    shutil.rmtree(tmp, ignore_errors=True)
    return {'sn': round(time.time() - t_bas, 1), 'kare': len(kareler)}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--adres', default='http://127.0.0.1:8082')
    ap.add_argument('--json', action='store_true')
    ap.add_argument('--yalniz', choices=['islev', 'kare', 'video'])
    ap.add_argument('--kare', help='ara kareleri bu klasöre yaz (PNG)')
    ap.add_argument('--video', help='360p önizleme videosu (mp4) yolu')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')
    if a.dry_run:
        print(f'adres {a.adres}; işlev: {a.yalniz != "kare"}; kare: {a.yalniz != "islev"}; video: {a.video}')
        return 0
    from playwright.sync_api import sync_playwright
    test = Test()
    test.yer_tutucu = None
    kareler = []
    if a.kare:
        os.makedirs(a.kare, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'])
        try:
            if a.yalniz not in ('kare', 'video'):
                islev(b, a.adres, test, a.kare)
            if a.yalniz not in ('islev', 'video'):
                for kip in ('dans', 'yukleme'):
                    kareler.append(kare_olc(b, a.adres, kip, test))
            if a.video:
                test.video_sn = video_cek(b, a.adres, a.video)
        finally:
            b.close()
    hata = [k for k in test.konsol if k[0] in ('error', 'pageerror')]
    uyari = [k for k in test.konsol if k[0] == 'warning']
    test.kontrol('Konsol', 'hata 0', not hata, '; '.join(x[1][:160] for x in hata[:5]))
    test.kontrol('Konsol', 'uyarı 0', not uyari, '; '.join(x[1][:160] for x in uyari[:5]))
    for k in kareler:
        if 'hata' in k:
            test.kontrol('Kare süreleri', f"{k['kip']}: ölçüldü", False, k['hata'])
            continue
        for bol in ('isim', 'cumle'):
            o = k[bol]
            test.kontrol('Kare süreleri', f"{k['kip']} / {bol}: %95 dilim ≤ 20 ms", o and o['p95'] <= 20, json.dumps(o))
    kaldi = [r for r in test.sonuc if not r['gecti']]
    if a.json:
        print(json.dumps({'sonuc': test.sonuc, 'kareler': kareler, 'zaman': getattr(test, 'zaman', None), 'yerTutucu': test.yer_tutucu}, ensure_ascii=False, indent=1))
    else:
        son = None
        for r in test.sonuc:
            if r['grup'] != son:
                print(f"\n{r['grup']}")
                son = r['grup']
            print(f"  {'GEÇTİ' if r['gecti'] else 'KALDI'}  {r['ad']}" + (f"  ({r['ayrinti']})" if r['ayrinti'] and not r['gecti'] else ''))
        if getattr(test, 'zaman', None):
            print('\nAçılış zaman damgaları (ms, sayfa modülünden):', json.dumps(test.zaman))
        for k in kareler:
            if 'hata' not in k:
                print(f"Kare ({k['kip']}): isim {k['isim']} | cümle {k['cumle']} | isimBasla {k['zaman'].get('isimBasla')} ms")
        if test.yer_tutucu:
            print('Yer tutucu:', json.dumps(test.yer_tutucu, ensure_ascii=False))
        print(f"\n{'KALDI' if kaldi else 'GEÇTİ'}: {len(test.sonuc) - len(kaldi)} geçti, {len(kaldi)} kaldı")
    return 1 if kaldi else 0


if __name__ == '__main__':
    sys.exit(main())
