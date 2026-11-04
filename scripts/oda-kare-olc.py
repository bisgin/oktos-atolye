"""Oda sayfasının (oda/index.html) telefon taklidinde kare sürelerini ve kare maliyetinin kalemlerini ölçer.

Amaç:  telefon kalite katmanının önce→sonra karşılaştırması. Üç durum ölçülür: açılış (sunumun isim + cümle yazıları
       boyunca), genel plan (açılış bitince, kamera genel planda, N sn) ve bir durağın yakın planı. --kalem ile genel planda
       maliyet kalemleri tek tek kapatılıp açılır (gölge haritası, piksel oranı, Biggie'nin çizimi, huzme/toz, ekranın
       video dokusu, kilim, portfolyo eşyaları) ve her birinin kare süresine etkisi yazılır.
Girdi: python scripts/oda-kare-olc.py [--adres http://127.0.0.1:8082] [--tekrar 3] [--sorgu "karakter=0"] [--genel 10]
           [--kalem] [--etiket once] [--kare KLASÖR] [--dry-run]
       Taklit: 390×844, DPR 3, dokunmatik, mobil, 4× CPU yavaşlatma (scripts/sunum-test.py ile aynı). Sunucu ayrıca
       çalışıyor olmalı (scripts/serve.py). Playwright (Python) + kurulu Edge.
Çıktı: .impeccable/olcum/kare-<etiket>-<YYYYAAGG-SSDDss>.json (her koşu + ortanca) ve ekrana tablo. --kare verilirse
       her koşunun genel plan karesi (PNG) o klasöre. Hiçbir dosyanın üstüne yazmaz, silmez.
Ölçüm: requestAnimationFrame aralıkları (kare süresi), rAF geri çağrılarının toplam JS süresi (kare başına), renderer.render
       ve gölge haritası çizimi süreleri (performance.now, yavaşlatılmış saatle), renderer.info (çizim çağrısı, üçgen, program,
       geometri, doku). %95 dilim: sıralı aralıkların %95'inci elemanı.
"""
import argparse, datetime, json, os, statistics, sys, time

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKIS = os.path.join(KOK, '.impeccable', 'olcum')

INIT_JS = r"""
(() => {
  if (window.top !== window) return;
  const now = performance.now.bind(performance), raf0 = window.requestAnimationFrame.bind(window);
  const K = window.__k = { aralik: [], js: [], render: [], golge: [], curT: -1, cur: 0 };
  // rAF geri çağrıları: kare başına toplam JS süresi
  window.requestAnimationFrame = (cb) => raf0((t) => {
    const a = now();
    try { cb(t); } finally {
      const d = now() - a;
      if (t !== K.curT) { if (K.curT >= 0) K.js.push([K.curT, K.cur]); K.curT = t; K.cur = 0; }
      K.cur += d;
    }
  });
  (function f(t) { K.aralik.push(t); raf0(f); })(now());
  // renderer.render ve gölge haritası: story kurulunca sarılır
  const sar = () => {
    const s = window.story;
    if (!s || !s.renderer || s.renderer.__sarili) return false;
    const r = s.renderer; r.__sarili = true;
    const r0 = r.render.bind(r);
    r.render = (...a) => { const t0 = now(); r0(...a); K.render.push([t0, now() - t0]); };
    const sm = r.shadowMap, s0 = sm.render.bind(sm);
    sm.render = (...a) => { const t0 = now(); s0(...a); K.golge.push([t0, now() - t0]); };
    return true;
  };
  const iv = setInterval(() => { if (sar()) clearInterval(iv); }, 100);
})();
"""

# Kalemler: [ad, uygula JS (geri alma işlevini window.__geri'ye koyar)]
KALEMLER = {
    'golge_statik': """(() => { const sm = story.renderer.shadowMap; sm.autoUpdate = false; sm.needsUpdate = true;
        window.__geri = () => { sm.autoUpdate = true; }; })()""",
    'dpr1': """(() => { const r = story.renderer, p = r.getPixelRatio(), c = r.domElement;
        r.setPixelRatio(1); r.setSize(c.clientWidth, c.clientHeight, false);
        window.__geri = () => { r.setPixelRatio(p); r.setSize(c.clientWidth, c.clientHeight, false); }; })()""",
    'dpr1_5': """(() => { const r = story.renderer, p = r.getPixelRatio(), c = r.domElement;
        r.setPixelRatio(1.5); r.setSize(c.clientWidth, c.clientHeight, false);
        window.__geri = () => { r.setPixelRatio(p); r.setSize(c.clientWidth, c.clientHeight, false); }; })()""",
    'biggie_cizim': """(() => { const g = []; window.karakter?.nesne.traverse((o) => { if (o.isMesh && o.visible) { o.visible = false; g.push(o); } });
        window.__geri = () => g.forEach((o) => { o.visible = true; }); })()""",
    'huzme': """(() => { const g = []; story.scene.traverse((o) => { const m = o.material; if (o.isMesh && o.visible && m?.isShaderMaterial && /toz/.test(m.fragmentShader || '')) { o.visible = false; g.push(o); } });
        window.__geri = () => g.forEach((o) => { o.visible = true; }); })()""",
    'ekran_video': """(() => { const e = story.api?.portfolyo?.ekran; if (!e) { window.__geri = () => {}; return; } const u = e.update; e.update = () => {};
        window.__geri = () => { e.update = u; }; })()""",
    'cam_gecirgensiz': """(() => { const g = []; story.scene.traverse((o) => { for (const m of [o.material].flat()) if (m?.transmission > 0 && !g.some((x) => x[0] === m)) g.push([m, m.transmission, m.transparent, m.opacity, m.depthWrite]); });
        for (const [m] of g) { m.transmission = 0; m.transparent = true; m.opacity = 0.15; m.depthWrite = false; m.needsUpdate = true; }
        window.__geri = () => g.forEach(([m, t, tr, op, dw]) => { m.transmission = t; m.transparent = tr; m.opacity = op; m.depthWrite = dw; m.needsUpdate = true; }); })()""",
    'golge_seyrek3': """(() => { const sm = story.renderer.shadowMap; sm.autoUpdate = false; let n = 0, on = true;
        const f = () => { if (!on) return; sm.needsUpdate = (n++ % 3) === 0; requestAnimationFrame(f); }; f();
        window.__geri = () => { on = false; sm.autoUpdate = true; }; })()""",
    'portfolyo_cizim':"""(() => { const g = []; const P = story.api?.portfolyo; for (const o of Object.values(P?.nesne || {})) if (o.visible) { o.visible = false; g.push(o); }
        story.scene.traverse((o) => { if (/kilim/i.test(o.name) && o.visible) { o.visible = false; g.push(o); } });
        window.__geri = () => g.forEach((o) => { o.visible = true; }); })()""",
}

PROFIL_JS = r"""() => {
  const r = story.renderer, s = story.scene, info = r.info;
  const isiklar = [], deri = [], morf = [];
  let gol = 0, alan = 0, mesh = 0, gorunur = 0;
  s.traverse((o) => {
    if (o.isLight && o.castShadow) isiklar.push({ tur: o.type, harita: o.shadow.mapSize.toArray(), gorunur: o.visible });
    if (o.isSkinnedMesh) deri.push({ ad: o.name, kemik: o.skeleton.bones.length, ucgen: (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 });
    if (o.isMesh && o.morphTargetInfluences?.length) morf.push({ ad: o.name, morf: o.morphTargetInfluences.length });
    if (o.isMesh) { mesh++; if (o.castShadow) gol++; if (o.receiveShadow) alan++; }
  });
  s.traverseVisible((o) => { if (o.isMesh) gorunur++; });
  const tb = new Set(); let piksel = 0;
  s.traverse((o) => { for (const m of [o.material].flat()) if (m) for (const v of Object.values(m)) if (v?.isTexture && !tb.has(v)) { tb.add(v); const im = v.image; if (im?.width) piksel += im.width * im.height; } });
  return {
    cizim: info.render.calls, ucgen: info.render.triangles, program: info.programs?.length, geometri: info.memory.geometries, doku: info.memory.textures,
    doku_mpiksel: +(piksel / 1e6).toFixed(1), dpr: r.getPixelRatio(), tampon: [r.domElement.width, r.domElement.height],
    golge: { acik: r.shadowMap.enabled, tur: r.shadowMap.type, isiklar, gol_atan: gol, gol_alan: alan }, mesh, gorunur_mesh: gorunur,
    deri: deri.length, kemik: deri[0]?.kemik ?? 0, deri_ucgen: deri.reduce((t, d) => t + d.ucgen, 0), morf, vekil: story.debug?.vekil?.durum ?? null,
  };
}"""

OLC_JS = r"""(ms) => new Promise((res) => {
  const K = window.__k, t0 = performance.now(), i0 = K.aralik.length, j0 = K.js.length, r0 = K.render.length, g0 = K.golge.length;
  setTimeout(() => {
    const a = K.aralik.slice(i0), d = [];
    for (let i = 1; i < a.length; i++) d.push(a[i] - a[i - 1]);
    res({ aralik: d, js: K.js.slice(j0).map((x) => x[1]), render: K.render.slice(r0).map((x) => x[1]), golge: K.golge.slice(g0).map((x) => x[1]) });
  }, ms);
})"""


def ozet(d):
    if not d:
        return None
    s = sorted(d)
    return {'n': len(d), 'ort': round(statistics.mean(d), 1), 'p95': round(s[min(len(s) - 1, int(0.95 * len(s)))], 1),
            'enCok': round(s[-1], 1)}


def olc_ozet(h):
    return {'kare': ozet(h['aralik']), 'js': ozet(h['js']), 'render': ozet(h['render']), 'golge': ozet(h['golge'])}


def bekle(pg, js, sure=60, adim=0.25):
    t = time.time()
    while time.time() - t < sure:
        v = pg.evaluate(js)
        if v:
            return v
        time.sleep(adim)
    return None


def kosu(b, adres, sorgu, a, n, konsol):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.on('console', lambda m: konsol.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: konsol.append(('pageerror', str(e))))
    pg.add_init_script(INIT_JS)
    cdp = ctx.new_cdp_session(pg)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    t_bas = time.time()
    pg.goto(f"{adres}/oda/index.html{'?' + sorgu if sorgu else ''}")
    sonuc = {'sorgu': sorgu}
    # Açılış: sunum varsa isim + cümle yazıları boyunca; yoksa story.ready olana dek
    sunumlu = bekle(pg, "window.story && window.story.renderer ? (window.sunum ? 'evet' : 'hayir') : null", 90)
    if sunumlu == 'evet':
        z = bekle(pg, "window.sunum?.zaman.acilisBitti !== undefined && window.sunum.zaman.kameraGenel !== undefined || window.sunum?.acilis === 'bitti' ? JSON.stringify(window.sunum.zaman) : null", 150)
        if z:
            z = json.loads(z)
            sonuc['acilis'] = pg.evaluate("""(z) => {
              const t0 = window.sunum.t0, k = window.__k.aralik, d = [];
              for (let i = 1; i < k.length; i++) if (k[i] >= t0 + z.isimBasla && k[i] <= t0 + z.cumleBitti) d.push(k[i] - k[i - 1]);
              return d; }""", z)
            sonuc['acilis'] = ozet(sonuc['acilis'])
    else:
        bekle(pg, 'window.story?.ready', 90)
    # Portfolyo eşyaları ve kilim kurulsun, kamera genel plana otursun
    bekle(pg, '!window.story?.api?.portfolyo || window.story.api.portfolyo.dolu !== false', 30)
    time.sleep(3)
    sonuc['acilis_sn'] = round(time.time() - t_bas, 1)
    sonuc['profil'] = pg.evaluate(PROFIL_JS)
    sonuc['genel'] = olc_ozet(pg.evaluate(OLC_JS, a.genel * 1000))
    sonuc['profil_sonra'] = pg.evaluate(PROFIL_JS)  # info son karenin (gölge geçişi dahil) sayıları
    if a.kare:
        pg.screenshot(path=os.path.join(a.kare, f"{a.etiket}-genel-{n}.png"))
    if a.kalem:
        sonuc['kalem'] = {}
        for ad, js in KALEMLER.items():
            pg.evaluate(js)
            time.sleep(2)
            sonuc['kalem'][ad] = olc_ozet(pg.evaluate(OLC_JS, 5000))
            sonuc['kalem'][ad]['cizim'] = pg.evaluate('story.renderer.info.render.calls')
            pg.evaluate('window.__geri?.()')
            time.sleep(1)
        sonuc['kalem']['taban'] = olc_ozet(pg.evaluate(OLC_JS, 5000))
    # Yakın plan: ilk durak
    hedef = a.durak
    pg.evaluate(f"story.focus({json.dumps(hedef)})")
    time.sleep(4)
    sonuc['yakin'] = olc_ozet(pg.evaluate(OLC_JS, 6000))
    sonuc['yakin']['odak'] = pg.evaluate('story.focusedId')
    sonuc['yakin']['cizim'] = pg.evaluate('story.renderer.info.render.calls')
    if a.kare:
        pg.screenshot(path=os.path.join(a.kare, f"{a.etiket}-yakin-{n}.png"))
    ctx.close()
    return sonuc


def ortanca(kosular, yol):
    deg = []
    for k in kosular:
        v = k
        for p in yol:
            v = v.get(p) if isinstance(v, dict) else None
        if v is not None:
            deg.append(v)
    return round(statistics.median(deg), 1) if deg else None


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--adres', default='http://127.0.0.1:8082')
    ap.add_argument('--tekrar', type=int, default=3)
    ap.add_argument('--sorgu', default='')
    ap.add_argument('--genel', type=int, default=10, help='genel plan ölçüm süresi (sn)')
    ap.add_argument('--durak', default='kitaplik', help='yakın plan durağı (story.focus kimliği; v8: altı duraktan biri)')
    ap.add_argument('--kalem', action='store_true')
    ap.add_argument('--etiket', default='olcum')
    ap.add_argument('--kare')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')
    if a.dry_run:
        print(f"adres {a.adres}/oda/index.html?{a.sorgu} × {a.tekrar}; genel {a.genel} sn; kalem {a.kalem}; çıktı {CIKIS}")
        return 0
    if a.kare:
        os.makedirs(a.kare, exist_ok=True)
    from playwright.sync_api import sync_playwright
    konsol, kosular = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'])
        try:
            for n in range(a.tekrar):
                kosular.append(kosu(b, a.adres, a.sorgu, a, n + 1, konsol))
        finally:
            b.close()
    oz = {d: {k: ortanca(kosular, [d, 'kare', k] if d != 'acilis' else [d, k]) for k in ('ort', 'p95', 'enCok')} for d in ('acilis', 'genel', 'yakin')}
    for d in ('genel', 'yakin'):
        for k in ('js', 'render', 'golge'):
            oz[d][k + '_ort'] = ortanca(kosular, [d, k, 'ort'])
    if a.kalem:
        oz['kalem'] = {ad: {'p95': ortanca(kosular, ['kalem', ad, 'kare', 'p95']), 'ort': ortanca(kosular, ['kalem', ad, 'kare', 'ort']),
                            'js_ort': ortanca(kosular, ['kalem', ad, 'js', 'ort']), 'render_ort': ortanca(kosular, ['kalem', ad, 'render', 'ort']),
                            'cizim': ortanca(kosular, ['kalem', ad, 'cizim'])} for ad in list(KALEMLER) + ['taban']}
    os.makedirs(CIKIS, exist_ok=True)
    yol = os.path.join(CIKIS, f"kare-{a.etiket}-{datetime.datetime.now():%Y%m%d-%H%M%S}.json")
    with open(yol, 'x', encoding='utf-8') as f:
        json.dump({'sorgu': a.sorgu, 'ortanca': oz, 'kosular': kosular, 'konsol': konsol}, f, ensure_ascii=False, indent=1)
    print(json.dumps(oz, ensure_ascii=False, indent=1))
    print('profil:', json.dumps(kosular[0].get('profil_sonra'), ensure_ascii=False))
    print('konsol hata/uyarı:', len(konsol), '; '.join(x[1][:120] for x in konsol[:4]))
    print('çıktı:', yol)
    return 0


if __name__ == '__main__':
    sys.exit(main())
