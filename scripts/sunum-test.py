"""Biggie'li rehberli sunumu (core/oda-sunum.js + core/oda-karakter.js) gerçek odada uçtan uca sınar ve açılışın kare
sürelerini ölçer.

Amaç: açılış sırası (yazıların görünme/kaybolma zaman damgaları, dans ile ilişkisi); v8 genel plan (tam altı işaretçi,
şerit / tur / "Çalışmaya dön" yok, oda dışı piksel 0: masaüstü ve telefon, giriş, genel plan, altı durak); durak ziyaretleri
(işaretçiye gerçek tıklama, yolda hedef değiştirme), elma senaryosu (2 elma, yürürken yeme, çöpe isabet, 3. ziyarette boş
buzdolabı), kutu oyunları, kitaplıkta büst (nokta, ele alma, kart, Geri), masa (video, kalkıp gitme), kamera kuralı,
armut (Hakkımda, gözler kapalı) ve TV; konsolda hata ve uyarı 0. Ardından telefon taklidinde (390×844, DPR 3, 4× CPU yavaşlatma)
iki giriş kipinin (?giris=dans, ?giris=yukleme) açılış kare sürelerini (requestAnimationFrame aralıkları) karşılaştırır.
Girdi:  python scripts/sunum-test.py [--adres http://127.0.0.1:8082] [--json] [--yalniz islev|kare] [--kare KLASÖR]
        [--video DOSYA.mp4] [--dry-run]
        Sunucu ayrıca çalışıyor olmalı (scripts/serve.py). Playwright (Python) + kurulu Edge (channel msedge).
Çıktı:  her kontrol için bir satır, kare süreleri tablosu (ya da --json); çıkış kodu 0 geçti, 1 kaldı.
        Yalnız --kare (ara kareler, PNG) ve --video (360p önizleme: açılış + elma, ffmpeg ile mp4) dosya yazar; başka bir
        şey yazmaz, silmez. Ağ: sayfanın kendi CDN modülleri (three, gsap).
"""
import argparse
import json, math
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


# v8 (2026-11-04): oda dışı piksel denetimi. Oda önde ON_DUVAR'a dek uzayıp kapandı; kadrajın her pikselinden atılan ışın
# odanın kabuğuna (zemin, tavan, duvarlar, uzantıları, ön duvar, süpürgelik, kasa, pervaz) odanın kutusundan çıkmadan
# çarpmalı. Çarpmıyorsa ve arka duvarın açıklığından (pencere, balkon kapısı: tasarımın parçası) geçmiyorsa ya da kamera
# odanın kutusunun dışındaysa "oda dışı piksel". Gerçek ağlara ışın (analitik değil): kabukta delik kalırsa yakalar.
PIKSEL_JS = """async () => {
  const T = await import('https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js');
  const { OLCU, ON_DUVAR } = await import(new URL('../core/oda-olcu.js', location.href).href);
  const s = window.story, cam0 = s.camera, R = OLCU.ROOM, G = OLCU.GLASS, ON = ON_DUVAR.y, aglar = [];
  s.scene.traverse((o) => { if (o.isMesh && /^(zemin|tavan|duvar_sol|duvar_sag|duvar_arka|duvar_on|supurgelik|kasa|pervaz)/.test(o.name)) aglar.push(o); });
  const rc = new T.Raycaster(), cam = new T.PerspectiveCamera();
  const cikis = (p, d) => { let t = Infinity; const f = (v) => { if (v > 1e-6 && v < t) t = v; };
    if (d.x > 0) f((R.x1 - p.x) / d.x); else if (d.x < 0) f((R.x0 - p.x) / d.x); if (d.y > 0) f((R.y1 - p.y) / d.y); else if (d.y < 0) f((ON - p.y) / d.y);
    if (d.z > 0) f((R.h - p.z) / d.z); else if (d.z < 0) f(-p.z / d.z); return t; };
  const acik = (q) => Math.abs(q.y - R.y1) < 5 && ((q.x > G.door0 && q.x < G.door1 && q.z < G.head) || (q.x > G.x0 && q.x < G.x1 && q.z > G.sill && q.z < G.head));
  const olc = (pos, target, nx = 64, ny = 40) => {
    cam.fov = cam0.fov; cam.aspect = cam0.aspect; cam.near = 10; cam.far = 1e6; cam.up.set(0, 0, 1);
    cam.position.fromArray(pos); cam.lookAt(new T.Vector3(...target)); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const p0 = cam.position, ic = p0.x > R.x0 && p0.x < R.x1 && p0.y > ON && p0.y < R.y1 && p0.z > 0 && p0.z < R.h;
    if (!ic) return nx * ny;
    let n = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      rc.setFromCamera(new T.Vector2((i + 0.5) / nx * 2 - 1, (j + 0.5) / ny * 2 - 1), cam);
      const p = rc.ray.origin, d = rc.ray.direction, tb = cikis(p, d), q = p.clone().addScaledVector(d, tb);
      let h = Infinity;
      for (const o of aglar) { const a = []; T.Mesh.prototype.raycast.call(o, rc, a); for (const x of a) if (x.distance < h) h = x.distance; }
      if (h > tb + 40 && !acik(q)) n++;
    }
    return n;
  };
  const sh = s.debug.shots, out = { giris: olc(sh.intro.pos, sh.intro.target), genel: olc(sh.main.pos, sh.main.target) };
  // Genel planda yana bakışın iki ucu (dikeyde parmakla kaydırma; masaüstünde kenardan bakma): kamera yerinde döner
  const L = s.debug.look;
  if (L) for (const [ad, yaw] of [['genelSol', L.max], ['genelSag', L.min]]) {
    const p = new T.Vector3(...sh.main.pos), d = new T.Vector3(...sh.main.target).sub(p).applyAxisAngle(new T.Vector3(0, 0, 1), yaw);
    out[ad] = olc(sh.main.pos, p.clone().add(d).toArray());
  }
  for (const id of ['armut', 'kitaplik', 'masa', 'buzdolabi', 'ekran', 'oyunlar']) { const k = s.shotOf(id); out[id] = olc(k.pos, k.target); }
  out.canli = olc(cam0.position.toArray(), cam0.position.clone().add(cam0.getWorldDirection(new T.Vector3()).multiplyScalar(1000)).toArray());
  return JSON.stringify(out);
}"""


def piksel_denetimi(pg, test, G, etiket):
    r = json.loads(pg.evaluate(PIKSEL_JS))
    test.kontrol(G, f'{etiket}: oda dışı piksel 0 (giriş, genel plan ve yana bakışın iki ucu, altı durak, o anki kamera)', all(v == 0 for v in r.values()), json.dumps(r))
    return r


def kamera_kurali(pg, test, klasor=None):
    """v7/v8 kamera kuralı: altı durakta kamera göz yüksekliğinde (1400–1700), odanın içinde, oda dışı piksel 0; odak
    nesnesinin karakter tarafından örtülme oranı (kitaplık, ekran, kutu oyunları ≤ %10; armut, masa, buzdolabında konu
    Biggie'nin kendisi: ölçülür, yazılır)"""
    G = 'Kamera kuralı (v8)'
    olc = """(id) => { const S = window.story, c = S.camera, nesne = S.api.model(id) ?? S.api.nesne(id), kutu = S.api.kutu(id) ?? (nesne ? new (S.api.kutu('oyunlar').constructor)().setFromObject(nesne) : null);
      return JSON.stringify(S.api.kadraj.olcum({ pos: c.position.toArray(), target: S.view().target }, { kutu, nesne, fov: c.fov, aspect: c.aspect })); }"""
    sonuc = {}
    for id_ in ('kitaplik', 'ekran', 'oyunlar', 'armut', 'masa', 'buzdolabi'):
        t = simdi(pg)
        pg.evaluate(f"window.sunum.git({json.dumps(id_)})")
        olay_bekle(pg, 'vardi', t, f"e.id === {json.dumps(id_)}", 40)
        pg.mouse.move(640, 427)  # imleç ortada: yakın plan salınımı sıfırda
        time.sleep(2.2)
        r = json.loads(pg.evaluate(olc, id_))
        sonuc[id_] = r
        konu = id_ in ('armut', 'masa', 'buzdolabi')
        ok = r.get('goz') and r.get('oda') and r.get('disari') == 0 and (konu or (r.get('ortu') or 0) <= 0.10)
        test.kontrol(G, f"{id_}: z {r.get('z')}, oda dışı {r.get('disari')}, karakter örtmesi {r.get('ortu')}", ok, json.dumps(r))
    test.kamera = sonuc


def armut_testi(pg, test, klasor=None):
    """v8 armut (Hakkımda): Biggie armuda yatar, gözlerini kapatır (armut_yat 'gozler_kapali'), armut_uyukla döngüsü, armut
    içine göçer, kartta hakkımda yazısı. TV (ekran): aynı oturuş, 'eller_ensede'de durur (gözler açık), TV açılır. Başka
    başlıkta kalkar, armut eski hâline döner"""
    G = 'Armut ve TV (v8)'
    t = simdi(pg)
    pg.evaluate("window.sunum.git('armut')")
    v = olay_bekle(pg, 'vardi', t, "e.id === 'armut'", 40)
    gk = olay_bekle(pg, 'gozler-kapali', t, 'true', 25)
    tt = olay_bekle(pg, 'tutuyor', t, 'true', 25)
    time.sleep(2.5)
    a = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)') or 'null')
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'armut: Biggie yattı, gözlerini kapattı, uyukluyor (armut_uyukla), armut ezildi', v and gk and tt and a and a['u'] > 0.05 and d.get('klip') == 'armut_uyukla', json.dumps([a, d]))
    hk = pg.evaluate("(() => { const c = document.querySelector('.story-card:not([hidden])'); return c ? [c.querySelector('.sc-title')?.textContent, c.querySelectorAll('.cati-yazi p').length] : null })()")
    test.kontrol(G, 'armut kartı: Hakkımda (hakkımda yazısı kartta)', hk and hk[0] in ('Hakkımda', 'About me') and hk[1] >= 2, json.dumps(hk, ensure_ascii=False))
    pg.evaluate('window.sunum.armutZorla(1)')
    time.sleep(0.6)
    a1 = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)'))
    # Hedef ölçüler GLB meta'sından (armut_yat.armut.gomulu; v7: 220 / 650, v8.2 Blender: 250 / 560)
    gm = pg.evaluate("window.karakter.meta('armut_yat')?.armut?.gomulu ?? { oturak_mm: 220, sirt_mm: 650 }")
    # v8.2: ölçü noktaları armudun ortasında (x 0): çukur (cukur_mm) orada tam derinlikte (kenarlar oturak_mm'de)
    cm = gm.get('cukur_mm', 0)
    test.kontrol(G, f"tam ezilme: oturak ≈ {gm['oturak_mm'] - cm:.0f} mm, sırt tepesi ≈ {gm['sirt_mm'] - cm:.0f} mm (ortadaki çukurla) ve geriye yatık (meta)", abs(a1['oturak'] - gm['oturak_mm'] + cm) <= 20 and abs(a1['sirt'][2] - gm['sirt_mm'] + cm) <= 50 and a1['sirt'][1] > 150, json.dumps([a1, gm.get('surum')]))
    pg.evaluate('window.sunum.armutZorla(null)')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('ekran')")
    tv = olay_bekle(pg, 'tv-ac', t, 'true', 40)
    eb = olay_bekle(pg, 'eylem-bitti', t, "e.id === 'ekran'", 30)
    time.sleep(2.0)
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    kz = pg.evaluate('window.karakter.klipZamani()')
    m = pg.evaluate("window.karakter.meta('armut_yat')")
    durdu = kz and m and kz['ad'] == 'armut_yat' and abs(kz['kare'] - (m.get('eller_ensede', 96) + 10)) < 3 and kz['kare'] < m.get('gozler_kapali', 138) - 15
    test.kontrol(G, "TV: armuda oturdu, TV açıldı, 'eller_ensede'de durdu (gözler açık, uyumuyor), kamera ekranda", tv and eb and durdu and pg.evaluate("window.story.focusedId === 'ekran'"), json.dumps([d, kz]))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('oyunlar')")
    k = olay_bekle(pg, 'eylem-kapat', t, 'true', 10)
    time.sleep(0.5)
    yolda = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)'))
    olay_bekle(pg, 'vardi', t, "e.id === 'oyunlar'", 40)
    a2 = json.loads(pg.evaluate('JSON.stringify(window.sunum.armut)'))
    test.kontrol(G, 'başka başlık: armuttan kalktı (armut_kalk), armut yavaşça eski hâline döndü', k and a2['u'] < 0.01 and yolda['u'] > 0, json.dumps([k, yolda, a2]))


# v8.1/v8.2 denetçileri (sayfada 50 ms'de bir): Biggie'nin gövde sütunu (baş 150, gövde 120, bacak 70 mm yarıçaplı
# kemik küreleri) masa, dolap, kitaplık ve sandalyenin kutusuna girmesin (oturuş klipleri sayılmaz: masada oturmak onun
# işi); büst ve kutu oyunlarının kutusu raf tahtalarına (kitaplığın beş tahtası; küçük rafın üst, alt tahtası, yanları,
# ara bölmeleri) girmesin. Sonuçlar window.__denetim'de (en kötü değer ve o anki durum)
DENETIM_JS = """async () => {
  const T = await import('https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js');
  const { OLCU } = await import(new URL('../core/oda-olcu.js', location.href).href);
  const D = OLCU.DESK, P = OLCU.PEDESTAL, S = window.story.scene, V = () => new T.Vector3();
  const sabit = { masa: new T.Box3(V().set(D.x0, D.y0, 0), V().set(D.x1, D.y1, D.top)), dolap: new T.Box3(V().set(P.x - P.w / 2, P.y - P.d / 2, 0), V().set(P.x + P.w / 2, P.y + P.d / 2, P.h)) };
  const kol = S.getObjectByName('koltuk'), RE = /kafa|boyun|g[oö]ğ[uü]s|omurga|kal[cç]a|omuz|uyluk|bald|diz/i, OTUR = /^(otur|otur2|kalk|kaydir|yaz|sirt_ac|bekle|kafa_salla|cekil|uzan|sevin|inanamama|muzik)$/;
  const RZ = [700, 1080, 1460, 1840, 2325], kitapTahta = RZ.map((z) => new T.Box3(V().set(-2085, -5, z), V().set(-1705, 1045, z + 25)));
  const R = { y: -250, en: 1125, d: 390, h: 420, t: 38, ara: 16, goz: 339 }, x0 = 2085 - R.d, x1 = 2085, y0 = R.y - R.en / 2, y1 = R.y + R.en / 2;
  const kucukTahta = [new T.Box3(V().set(x0, y0, R.h - R.t), V().set(x1, y1, R.h)), new T.Box3(V().set(x0, y0, 0), V().set(x1, y1, R.t)),
    new T.Box3(V().set(x0, y0, 0), V().set(x1, y0 + R.t, R.h)), new T.Box3(V().set(x0, y1 - R.t, 0), V().set(x1, y1, R.h))];
  for (const k of [1, 2]) { const lx = -R.en / 2 + R.t + k * R.goz + (k - 0.5) * R.ara, wy = -lx + R.y; kucukTahta.push(new T.Box3(V().set(x0, wy - R.ara / 2, R.t), V().set(x1, wy + R.ara / 2, R.h - R.t))); }
  const d0 = window.__denetim = { govde: {}, bust: 0, kutu: 0, n: 0 }, taban = new Map();
  clearInterval(window.__denetimT);
  window.__denetimT = setInterval(() => {
    d0.n++;
    const kar = window.karakter;
    // Oturmaya giderken sandalyeyi tutması (arkasına geçip çekmesi) masa durağının işi: sayılmaz
    if (kar && !OTUR.test(kar.durum.klip ?? '') && !kar.debug?.ben?.oturacak) {
      const kb = { ...sabit, kitaplik: new T.Box3(V().set(-2100, -30, 0), V().set(-1705, 1070, 2350)) };
      if (kol) kb.sandalye = new T.Box3().setFromObject(kol);
      for (const b of kar.govdeKemikleri) {
        if (!RE.test(b.name)) continue;
        const p = b.getWorldPosition(V()), r = /kafa/.test(b.name) ? 150 : /uyluk|bald|diz/.test(b.name) ? 70 : 120;
        for (const [ad, k] of Object.entries(kb)) {
          const dx = Math.max(k.min.x - p.x, 0, p.x - k.max.x), dy = Math.max(k.min.y - p.y, 0, p.y - k.max.y), dz = Math.max(k.min.z - p.z, 0, p.z - k.max.z), d = Math.round(Math.hypot(dx, dy, dz) - r);
          if (d < (d0.govde[ad]?.d ?? Infinity)) d0.govde[ad] = { d, kemik: b.name, klip: kar.durum.klip, x: kar.durum.x, y: kar.durum.y, kutu: [k.min.x, k.min.y, k.max.x, k.max.y].map(Math.round), son: window.sunum.kayit.slice(-3).map((e) => e.ad + (e.id ? ':' + e.id : '')) };
        }
      }
    }
    const pp = window.story.api.portfolyo.parcalar();
    const ic = (o, tahtalar) => { const k = new T.Box3().setFromObject(o).expandByScalar(-1); let m = 0; for (const t of tahtalar) if (k.intersectsBox(t)) { const x = k.clone().intersect(t); m = Math.max(m, Math.min(x.max.x - x.min.x, x.max.y - x.min.y, x.max.z - x.min.z)); } return m; };
    for (const o of pp.eser.filter((x) => x.userData.parca?.bust)) d0.bust = Math.max(d0.bust, Math.round(ic(o, kitapTahta)));
    // Kutular yerindeyken (ilk örnek) tahtaya değiyorsa o pay taban sayılır (rafın kendi yerleşimi); artışı ölçülür
    for (const o of pp.oyun) { const m0 = ic(o, kucukTahta); taban.set(o, taban.get(o) ?? m0); const m = Math.round(m0 - taban.get(o)); if (m > d0.kutu) { d0.kutu = m; d0.kutuNe = [o.name, window.sunum.kutu?.durum ?? null]; } }
  }, 50);
  return 'ok';
}"""


def denetim(pg):
    return json.loads(pg.evaluate('JSON.stringify(window.__denetim)'))


def kitaplik_bust(pg, test, klasor=None):
    """v8.2 kitaplık: Biggie yüzü kitaplığa durur; yalnız büstlerde nokta; büste tıklanınca eline alır (alttan açık avuç,
    öbür el belinde; parmaklar büstün dışında), büst dönmez, Biggie onunla armut tarafına yürüyüp bekler; kartta büstün
    bilgisi (tam ekran resim yok); Geri: rafa döner, büst gözüne önden yatay kayarak girer; ikinci Geri genel plan"""
    G = 'Kitaplık ve büst (v8.2)'
    t = simdi(pg)
    pg.evaluate("window.sunum.git('kitaplik')")
    v = olay_bekle(pg, 'vardi', t, "e.id === 'kitaplik'", 40)
    time.sleep(2.2)
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'Biggie kitaplığın önünde, yüzü kitaplığa (ψ −90°)', v and abs(d.get('psi', 0) + 1.57) < 0.1, json.dumps(d))
    n = pg.evaluate("[...document.querySelectorAll('.oda-bust-nokta')].filter((b) => !b.hidden && !b.closest('[hidden]')).length")
    nb = pg.evaluate("window.story.api.portfolyo.parcalar().eser.filter((o) => o.userData.parca?.bust).length")
    boy = pg.evaluate("window.story.api.portfolyo.parcalar().eser.filter((o) => o.userData.parca?.bust).map((o) => { const b = new (window.story.api.kutu('oyunlar').constructor)().setFromObject(o); return Math.round(b.max.z - b.min.z); })")
    test.kontrol(G, f'yalnız büstlerde nokta ({n} / {nb} büst), büst boyu 280 mm', n == nb and nb >= 1 and all(abs(x - 280) <= 3 for x in boy), json.dumps(boy))
    xy = pg.evaluate("(() => { const b = [...document.querySelectorAll('.oda-bust-nokta')].find((x) => !x.hidden); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
    t = simdi(pg)
    if xy:
        pg.mouse.click(xy[0], xy[1])
    e = olay_bekle(pg, 'bust-elde', t, 'true', 60)
    time.sleep(2.0)
    bu = json.loads(pg.evaluate('JSON.stringify(window.sunum.bust)') or 'null')
    d = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    kart = pg.evaluate("(() => { const k = document.querySelector('.story-card:not([hidden]) .cati-bust'); return k ? [k.querySelector('h3')?.textContent, !!k.querySelector('img')] : null })()")
    kutu_yok = pg.evaluate("document.querySelector('.cati-kutu')?.hidden !== false")
    test.kontrol(G, 'noktaya tıklama: büstü eline aldı, onunla armut tarafına yürüyüp bekliyor; kartta adı ve fotoğrafı; tam ekran resim yok',
                 xy and e and bu and bu['elde'] and kart and kart[0] and kutu_yok and abs(d['x'] + 760) < 60 and abs(d['y'] + 160) < 60, json.dumps([xy, bu, d, kart], ensure_ascii=False))
    QJS = "(() => { const o = window.story.api.portfolyo.parcalar().eser.find((x) => x.parent?.isScene); return o ? o.getWorldQuaternion(new (o.quaternion.constructor)()).toArray() : null })()"
    q1 = pg.evaluate(QJS)
    time.sleep(1.5)
    q2 = pg.evaluate(QJS)
    # v8.2: büst elin soketinde (bust_tut nefes alırken el birkaç derece oynar): kendi ekseninde dönmüyor = iki an arası açı < 6°
    sabit_aci = q1 and q2 and 2 * math.acos(min(1, abs(sum(a * b for a, b in zip(q1, q2))))) < 0.1
    ic = pg.evaluate('window.sunum.bustParmakIcinde()')
    test.kontrol(G, 'büst dönmüyor (sabit açı); alttaki el ve beldeki el: parmak eklemi ya da ucu büstün ağının içinde değil', sabit_aci and ic == [0, 0], json.dumps([ic, q1, q2]))
    kare_al(pg, klasor, '20-bust-elde')
    t = simdi(pg)
    pg.keyboard.press('Escape')  # Geri ile aynı yol (onActivate(null) → sunum.sec(null))
    b_ = olay_bekle(pg, 'bust-birak', t, 'true', 40)
    time.sleep(1.8)
    test.kontrol(G, 'Geri: rafa döndü, büst yerine kondu, kitaplıkta kalındı (kart kitaplıkta)', b_ and pg.evaluate("window.story.focusedId === 'kitaplik' && !window.sunum.bust"))
    dn = denetim(pg)
    test.kontrol(G, 'büst alınırken ve geri konurken kitaplığın tahtalarına girmedi (her 50 ms kutusu)', dn['bust'] == 0, json.dumps(dn['bust']))
    pg.keyboard.press('Escape')
    time.sleep(2.0)
    yak = pg.evaluate("(() => { const v = window.story.view(), g = window.story.shotOf(null); return Math.round(Math.hypot(...v.pos.map((x, i) => x - g.pos[i]))); })()")
    test.kontrol(G, 'ikinci Geri: genel plan (kart kapalı, işaretçiler)', pg.evaluate('window.story.focusedId === null') and yak < 50, f'genel plana uzaklık {yak} mm')


def masa_kilidi(pg, test, klasor=None):
    """v8 masa: işaretçiyle masaya; Biggie oturup yazar, monitörde masa-ekran.mp4 (yoksa eski döngü); başka durağa
    tıklanınca kalkıp gider (eski hata: oturduktan sonra başka durak tıklanmıyordu)"""
    G = 'Masa (v8)'
    t = simdi(pg)
    pg.evaluate("window.sunum.git('masa')")
    o = olay_bekle(pg, 'oturdu', t, 'true', 60)
    time.sleep(1.5)
    mk = pg.evaluate('window.sunum.monitor?.kaynak')
    test.kontrol(G, 'masa: Biggie oturdu, yazıyor; monitörde video', o and mk in ('masa', 'diorama') and pg.evaluate("window.karakter.durum.yer === 'koltuk'"), f'kaynak {mk}')
    test.kontrol(G, 'monitör masa-ekran.mp4 oynatıyor (VideoTexture)', mk == 'masa' and pg.evaluate('window.sunum.monitor.masaVar === true'), f'kaynak {mk}')
    cam = pg.evaluate('window.story.view().pos.map(Math.round)')
    test.kontrol(G, 'masa kadrajı: masanın sağ önünden çapraz (v8.2), göz yüksekliğinde', cam[0] > 150 and cam[1] < 900 and 1400 <= cam[2] <= 1700, json.dumps(cam))
    # v8.1: iki video sırayla (dönüş → yontma): ilki bitince ikincisi
    v0 = pg.evaluate('window.sunum.monitor.video')
    gecti = bekle(pg, f"window.sunum.monitor.video && window.sunum.monitor.video !== {json.dumps(v0)}", 40)
    test.kontrol(G, 'monitörde iki video sırayla (dönüş, yontma: ended ile geçiş)', v0 in ('donus', 'yontma') and gecti, json.dumps([v0, pg.evaluate('window.sunum.monitor.video')]))
    kare_al(pg, klasor, '21-masa')
    t = simdi(pg)
    pg.evaluate("window.sunum.git('buzdolabi')")
    k = olay_bekle(pg, 'kalkti', t, 'true', 15)
    v = olay_bekle(pg, 'vardi', t, "e.id === 'buzdolabi'", 45)
    test.kontrol(G, 'masadayken başka durak: kalktı (kalk), gitti; monitör durdu', k and v and not pg.evaluate('window.sunum.monitor.oynuyor'))


def genel_plan(pg, test, klasor=None):
    G = 'Genel plan (v8)'
    ids = pg.evaluate('window.story.hotspots.map((h) => h.id)')
    test.kontrol(G, 'tam altı işaretçi: armut, kitaplık, masa, buzdolabı, ekran, kutu oyunları', sorted(ids) == sorted(['armut', 'kitaplik', 'masa', 'buzdolabi', 'ekran', 'oyunlar']) and pg.evaluate("document.querySelectorAll('.story-pins .pin').length") == 6, json.dumps(ids))
    gor = pg.evaluate("""(() => { const r = document.querySelector('.story-canvas').getBoundingClientRect();
      return [...document.querySelectorAll('.story-pins .pin')].filter((p) => { const b = p.getBoundingClientRect(); return getComputedStyle(p).display !== 'none' && b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom; }).length; })()""")
    test.kontrol(G, 'altı işaretçi de genel planda ekranın içinde', gor == 6, f'{gor} / 6')
    yok = pg.evaluate("""[!document.querySelector('.oda-tur-giris'), !document.querySelector('.oda-next'), !document.querySelector('.oda-calisma'),
      (() => { const s = document.querySelector('.story-strip'); const r = s.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; })()]""")
    test.kontrol(G, 'şerit ("Atölyeden çıkanlar" sekmeleri), "Ürünleri gez", "sıradaki" ve "Çalışmaya dön" yok', all(yok), json.dumps(yok))
    piksel_denetimi(pg, test, G, 'masaüstü 1280×800')
    kare_al(pg, klasor, '01-genel-plan')


def piksel_telefon(b, adres, test):
    G = 'Genel plan (v8)'
    c, pg = sayfa_ac(b, adres, test, viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
    pg.goto(f'{adres}/oda/index.html')
    if acilis_bekle(pg, 150):
        bekle(pg, 'window.story.api.portfolyo.dolu', 60)
        # v8b: dikeyde genel plan odanın ortasına bakar; yana kaydırmanın iki ucuyla birlikte altı işaretçi de görünür
        gor_js = """(() => { const r = document.querySelector('.story-canvas').getBoundingClientRect();
          return [...document.querySelectorAll('.story-pins .pin')].map((p, i) => { const b = p.getBoundingClientRect(); return b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom ? window.story.hotspots[i].id : null; }).filter(Boolean); })()"""
        gorulen = set()
        for yaw in ('0', 'window.story.debug.look.max', 'window.story.debug.look.min', 'window.story.debug.look.max / 2', 'window.story.debug.look.min / 2'):
            pg.evaluate(f'window.story.debug.look.yaw = {yaw}')
            time.sleep(0.8)
            gorulen |= set(pg.evaluate(gor_js))
        pg.evaluate('window.story.debug.look.yaw = 0')
        # Gerçek kaydırma (dokunmatik): sağa sürükleme yana bakışı değiştirir
        bas = pg.evaluate('window.story.debug.look.yaw')
        cdp = c.new_cdp_session(pg)
        for tip, x in (('touchStart', 120), ('touchMove', 200), ('touchMove', 280), ('touchEnd', 280)):
            cdp.send('Input.dispatchTouchEvent', {'type': tip, 'touchPoints': [] if tip == 'touchEnd' else [{'x': x, 'y': 500}]})
            time.sleep(0.05)
        son = pg.evaluate('window.story.debug.look.yaw')
        test.kontrol(G, 'telefon 390×844: genel plan odanın içinden, yana kaydırınca altı işaretçinin hepsi görünür', len(gorulen) == 6 and son > bas + 0.2, json.dumps([sorted(gorulen), bas, son]))
        pg.evaluate('window.story.debug.look.yaw = 0')
        piksel_denetimi(pg, test, G, 'telefon 390×844')
    else:
        test.kontrol(G, 'telefon: açılış bitti', False)
    c.close()


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
    test.kontrol(G, 'kamera sayfanın (sunum), genel planda', pg.evaluate('window.story.driven') and not pg.evaluate("document.getElementById('story').classList.contains('sunum-acilis')"))
    bekle(pg, 'window.story.api.portfolyo.dolu', 60)
    time.sleep(1.5)
    genel_plan(pg, test, klasor)
    pg.evaluate(DENETIM_JS)
    pg.evaluate('window.karakter.debug.AYAR.isirikAra = 1.6')  # elma senaryosu kısa sürsün

    G = 'Duraklar'
    # Gerçek tıklama: genel planda kitaplığın işaretçisine (motor → onActivate → sunum.sec)
    xy = pg.evaluate("(() => { const i = window.story.hotspots.findIndex((h) => h.id === 'kitaplik'), p = document.querySelectorAll('.story-pins .pin')[i]; if (!p) return null; const r = p.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
    t = simdi(pg)
    if xy:
        pg.mouse.click(xy[0], xy[1])
    v = olay_bekle(pg, 'vardi', t, "e.id === 'kitaplik'", 40)
    test.kontrol(G, 'işaretçiye gerçek tıklama (kitaplık): kart açıldı, Biggie vardı', xy and v and pg.evaluate("window.story.focusedId === 'kitaplik'"), json.dumps(xy))
    test.kontrol(G, 'kitaplık: eylem bitti', olay_bekle(pg, 'eylem-bitti', t, "e.id === 'kitaplik'", 20))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('ekran')")
    time.sleep(1.2)
    yolda = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    pg.evaluate("window.sunum.git('oyunlar')")
    v = olay_bekle(pg, 'vardi', t, "e.id === 'oyunlar'", 40)
    tv = pg.evaluate(f"window.sunum.kayit.some((e) => e.ad === 'vardi' && e.id === 'ekran' && e.t > {t})")
    test.kontrol(G, 'yolda yeni hedef: ekran yerine kutu oyunları', v and not tv and yolda.get('klip') == 'yuru', json.dumps(yolda))

    G = 'Elma'
    pg.keyboard.press('Escape')
    time.sleep(2.0)
    # Gerçek tıklama: buzdolabının işaretçisine (Biggie rafın yanında buzdolabının önünde durabilir: ona tıklamak karakterin
    # tepkisidir, durak değil)
    xy = pg.evaluate("(() => { const i = window.story.hotspots.findIndex((h) => h.id === 'buzdolabi'), p = document.querySelectorAll('.story-pins .pin')[i]; if (!p) return null; const r = p.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
    t = simdi(pg)
    if xy:
        pg.mouse.click(xy[0], xy[1])
    d0 = olay_bekle(pg, 'durak', t, "e.id === 'buzdolabi'", 3)
    test.kontrol(G, 'buzdolabına gerçek tıklama durağı buldu', d0, json.dumps(xy))
    if not d0:
        pg.evaluate("window.sunum.git('buzdolabi')")
    v = olay_bekle(pg, 'elma-al', t, 'true', 40)
    test.kontrol(G, '1. ziyaret: elma alındı, sayaç 1', v and v.get('kalan') == 1, json.dumps(v))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('kitaplik')")  # elmayla başka durağa: yolda yer
    isirik = olay_bekle(pg, 'isirik', t, 'true', 20)
    yd = json.loads(pg.evaluate('JSON.stringify(window.karakter.durum)'))
    test.kontrol(G, 'yürürken ısırık (üst gövde katmanı yürüyüşle)', isirik and yd.get('klip') == 'yuru', json.dumps(yd))
    k = olay_bekle(pg, 'kobe', t, 'true', 40)
    n_isirik = pg.evaluate('window.karakter.debug.AYAR.isirik')
    test.kontrol(G, f'{n_isirik} ısırıkta bitti, "kobe"', k and pg.evaluate(f"window.sunum.kayit.filter((e) => e.ad === 'isirik' && e.t > {t}).length") == n_isirik)
    i = olay_bekle(pg, 'isabet', t, 'true', 20)
    test.kontrol(G, '1. elma çöpe isabet', i and i.get('isabet'), json.dumps(i))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('buzdolabi')")
    v = olay_bekle(pg, 'elma-al', t, 'true', 40)
    test.kontrol(G, '2. ziyaret: elma alındı, sayaç 0', v and v.get('kalan') == 0, json.dumps(v))
    i = olay_bekle(pg, 'isabet', t, 'true', 40)
    test.kontrol(G, '2. elma çöpe isabet (durakta bitirdi)', i and i.get('isabet'), json.dumps(i))
    t = simdi(pg)
    pg.evaluate("window.sunum.git('oyunlar')")
    olay_bekle(pg, 'vardi', t, "e.id === 'oyunlar'", 40)
    t = simdi(pg)
    pg.evaluate("window.sunum.git('buzdolabi')")
    b_ = olay_bekle(pg, 'buzdolabi-bos', t, 'true', 40)
    yok = not pg.evaluate(f"window.sunum.kayit.some((e) => e.ad === 'elma-al' && e.t > {t})")
    test.kontrol(G, '3. ziyaret: buzdolabı boş, elma alınmadı', b_ and yok)
    e = json.loads(pg.evaluate('JSON.stringify(window.karakter.elma)'))
    test.kontrol(G, 'iki atış, ikisi de isabet', e.get('atilan') == 2 and all(e.get('isabet', [])), json.dumps(e))

    kutu_oyunlari(pg, test, klasor)
    kitaplik_bust(pg, test, klasor)
    masa_kilidi(pg, test, klasor)
    kamera_kurali(pg, test, klasor)
    armut_testi(pg, test, klasor)
    piksel_denetimi(pg, test, 'Genel plan (v8)', 'masaüstü, durakların sonunda')
    dn = denetim(pg)
    G = 'Çakışma (v8.1/v8.2)'
    test.kontrol(G, f"Biggie'nin gövdesi (ayakta, yürürken) masaya, dolaba, sandalyeye, kitaplığa girmedi ({dn['n']} örnek)", all(v['d'] >= 0 for v in dn['govde'].values()), json.dumps(dn['govde'], ensure_ascii=False))
    test.kontrol(G, 'kutu oyunları alınırken, rafın üstüne konurken ve geri konurken küçük rafın tahtalarına girmedi', dn['kutu'] == 0, json.dumps([dn['kutu'], dn.get('kutuNe')]))
    yt = pg.evaluate('JSON.stringify({ yerTutucu: window.karakter.yerTutucu, gecici: window.sunum.gecici })')
    test.yer_tutucu = json.loads(yt)
    c.close()
    piksel_telefon(b, adres, test)


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
