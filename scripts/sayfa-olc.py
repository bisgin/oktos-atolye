# Amaç: yerel sunucudaki sayfaların yüklenme ve çalışma maliyetini telefon ve masaüstü görünümünde ölçmek; bir değişiklikten
# önce ve sonra aynı komutla çalıştırıp karşılaştırmak (ör. orta kata ürün rafları: --etiket once, sonra --etiket sonra).
# Girdi:  python scripts/sayfa-olc.py oda/index.html index.html tools/bin/index.html [--port 8092] [--tekrar 3] [--etiket once]
#         [--profil telefon,masaustu] [--zaman-asimi 120] [--tum-ekranlar] [--dry-run]
#         python scripts/sayfa-olc.py --karsilastir .impeccable/olcum/once-....json .impeccable/olcum/sonra-....json
#         (yerel sunucu açık olmalı: python scripts/serve.py 8092)
# Çıktı:  .impeccable/olcum/<etiket>-<YYYYAAGG-SSDDss>.json (her ölçüm + sayfa/profil başına ortanca ve en kötü) ve aynı
#         klasöre hazır anının ekran görüntüleri (PNG; varsayılan her sayfa/profilin ilk tekrarı). .impeccable/ git dışıdır.
#         Ad zaman damgalıdır: tekrar çalıştırmak eski ölçümün üstüne yazmaz, hiçbir dosya silinmez.
# Ölçülenler: istek sayısı; aktarılan bayt (CDP encodedDataLength: başlık + sıkıştırılmış gövde; türe göre glb / görsel / js /
#         wasm / font / css / json / html / diğer; yerel ve dış ayrı); hazır olma süresi (sayfanın kendi işareti, aşağıda ISARETLER;
#         gezinme başlangıcından ms); JS yığını (CDP Performance.getMetrics, çöp toplamadan önce ve sonra); konsol hata/uyarı sayısı
#         ve ilk 5 hata; 5 sn'lik requestAnimationFrame sayısı (görünmez tarayıcıda yalnız gösterge); three.js çizim çağrısı ve
#         üçgen sayısı (bir kare); hazır olana kadarki uzun görevler (longtask, TBT); ekran görüntüsünün boş/düz olup
#         olmadığı (parlaklık sapması).
# Yöntem: her ölçüm kendi Edge'ini açar (soğuk önbellek, boş localStorage: oda girişi her seferinde 'full' modda).
#         Ağ: tarayıcı yalnız 127.0.0.1/localhost ve İZİNLİ dış adresleri çözebilir (--host-resolver-rules); başka her ad
#         çözülemez, istek makineden çıkmaz ve 'engellenen' listesine yazılır. Ağ ve işlemci kısıtlaması (throttling) yok.
# Gereken: playwright (pip), kurulu Microsoft Edge (ayrı tarayıcı indirilmez), Pillow.
import argparse, datetime, io, json, os, statistics, subprocess, sys, time, urllib.request
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKIS = os.path.join(KOK, ".impeccable", "olcum")

# Sayfaların kendi kodunda yazan dış adresler (importmap: three, gsap, manifold, opentype, DRACO çözücü; Google Fonts)
IZINLI = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"]

PROFILLER = {
    "telefon": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
    "masaustu": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1, is_mobile=False, has_touch=False),
}

# Hazır işaretleri sayfaların kendi kodundan (uydurma bekleme süresi yok). 'hazir' ana ölçüdür; ötekiler ek bilgi.
ISARETLER = {
    # Oda (2026-11-02'den beri oda/index.html; "oda/" öneki hem oda/ hem oda/index.html adresini tutar)
    "oda/": {
        # core/story.js mountStory: buildScene (GLB'ler, dokular, ürün yuvaları) bitince aria-busy 'false' olur, çizim başlar
        "kurulum": "document.getElementById('story')?.getAttribute('aria-busy') === 'false'",
        # core/story.js giriş zaman çizelgesinin onComplete'i: .pins-ready + onReady (story.ready). Perde kalkmış, tur hazır.
        "hazir": "document.getElementById('story')?.classList.contains('pins-ready')",
        # oda/index.html: karakter bağlanınca window.karakter (odayı bekletmez, ayrı yüklenir)
        "karakter": "!!window.karakter",
    },
    # core/tool-shell.js rebuild(): ilk model görüntüleyicide gösterilince
    "tools/": {"hazir": "window.__oktosReady === true"},
    # index.html: 2026-11-01 öncesi araç listesi (#tools .toolrow); sonrası 2B giriş, iki yol kartının görseli yazılınca
    "index.html": {"hazir": "document.querySelectorAll('#tools .toolrow').length > 0 || document.querySelector('#yol-urunler')?.childElementCount > 0"},
}
ISARETLER["lab/oda.html"] = ISARETLER["oda/"]  # eski adres: /oda/'ya yönlendirir (süreye yönlendirme de girer)
VARSAYILAN_ISARET = {"hazir": "document.readyState === 'complete'"}

INIT_JS = r"""
(() => {
  if (window.top !== window) return;
  const isaret = __ISARET__;
  const S = window.__olc = { t: {}, uzun: [] };
  // Ana iş parçacığını 50 ms'den uzun kilitleyen görevler (GSAP böyle karelerde zamanı 33 ms sayar: giriş uzar)
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (S.uzun.length < 2000) S.uzun.push([Math.round(e.startTime), Math.round(e.duration)]); })
      .observe({ type: 'longtask', buffered: true });
  } catch (_) { S.uzun = null; }
  // İşaret zamanı, işaretin konduğu görevin içinde yazılır: DOM işaretleri MutationObserver ile (mikro görev), pencere
  // değişkenleri (window.karakter, window.__oktosReady) atandıkları an yakalanır. Yalnız yoklama olsaydı, işaretin hemen
  // ardından gelen uzun bir görev (ör. ilk karede gölgelendirici derleme) ölçümü saniyelerce geciktirirdi.
  const fns = Object.entries(isaret).map(([k, e]) => [k, new Function('try { return !!(' + e + '); } catch (_) { return false; }')]);
  const t0 = performance.now();
  let mo = null, iv = 0;
  const bak = () => {
    for (const [k, f] of fns) if (!(k in S.t) && f()) S.t[k] = Math.round(performance.now());
    if (Object.keys(S.t).length === fns.length || performance.now() - t0 > 300000) { clearInterval(iv); mo?.disconnect(); }
  };
  for (const ad of new Set(Object.values(isaret).flatMap((e) => [...e.matchAll(/window\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1])))) {
    let deger;
    Object.defineProperty(window, ad, { configurable: true, enumerable: true, get: () => deger, set: (x) => { deger = x; bak(); } });
  }
  const izle = () => {
    mo = new MutationObserver(bak);
    mo.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-busy'] });
  };
  izle();
  iv = setInterval(bak, 50); // öteki işaretler için yedek (readyState gibi)
})();
"""

KARE_JS = """() => new Promise((r) => {
  const t0 = performance.now(); let n = 0, son = t0, enUzun = 0, bitti = false;
  const bitir = () => { if (!bitti) { bitti = true; r({ kare: n, sure_ms: Math.round(performance.now() - t0), en_uzun_ms: Math.round(enUzun) }); } };
  const f = () => { const s = performance.now(); n++; enUzun = Math.max(enUzun, s - son); son = s;
    if (s - t0 < 5000) requestAnimationFrame(f); else bitir(); };
  requestAnimationFrame(f);
  setTimeout(bitir, 6500); // rAF hiç çalışmazsa (gizli sekme) takılmasın
})"""

# Bir karelik çizim istatistiği: sıfırlama bir rAF'ta, okuma sonrakinde (arada sayfanın tam bir karesi çizilir)
THREE_JS = """async () => {
  const r = window.story?.renderer || window.oktos?.viewer?.renderer;
  if (!r || !r.info) return null;
  const i = r.info, eski = i.autoReset;
  await new Promise((ok) => requestAnimationFrame(() => { i.autoReset = false; i.reset(); requestAnimationFrame(ok); }));
  const out = { cizim_cagrisi: i.render.calls, ucgen: i.render.triangles, geometri: i.memory.geometries, doku: i.memory.textures,
    program: i.programs ? i.programs.length : null, piksel_orani: r.getPixelRatio(), tuval: [r.domElement.width, r.domElement.height] };
  i.autoReset = eski;
  return out;
}"""

WEBGL_JS = """() => {
  const r = window.story?.renderer || window.oktos?.viewer?.renderer;
  let gl = r?.getContext?.(), gecici = null;
  if (!gl) { gecici = document.createElement('canvas'); gl = gecici.getContext('webgl2') || gecici.getContext('webgl'); }
  if (!gl) return null;
  const e = gl.getExtension('WEBGL_debug_renderer_info');
  const s = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  if (gecici) gl.getExtension('WEBGL_lose_context')?.loseContext();
  return s;
}"""

SAYFA_JS = """() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const veil = document.querySelector('.story-veil');
  return {
    dcl_ms: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    load_ms: nav && nav.loadEventEnd ? Math.round(nav.loadEventEnd) : null,
    fcp_ms: fcp ? Math.round(fcp.startTime) : null,
    perde_opaklik: veil ? Number(getComputedStyle(veil).opacity) : null,
    kaba_isaretci: matchMedia('(pointer: coarse)').matches,
    ekran_boyutu: [screen.width, screen.height, devicePixelRatio],
    yatay_tasma: document.documentElement.scrollWidth > innerWidth,
  };
}"""

MB = 1024 * 1024


def tur(url, mime):
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    mime = (mime or "").lower()
    if ext == ".glb" or mime == "model/gltf-binary":
        return "glb"
    if ext in (".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg") or mime.startswith("image/"):
        return "gorsel"
    if ext in (".js", ".mjs") or "javascript" in mime:
        return "js"
    if ext == ".wasm" or mime == "application/wasm":
        return "wasm"
    if ext in (".woff", ".woff2", ".ttf", ".otf") or mime.startswith("font/"):
        return "font"
    if ext == ".css" or mime == "text/css":
        return "css"
    if ext == ".json" or "json" in mime:
        return "json"
    if ext in (".html", ".htm") or mime == "text/html":
        return "html"
    return "diger"


def isaret_sec(yol):
    temiz = yol.split("?")[0].lstrip("/")
    if temiz in ISARETLER:
        return ISARETLER[temiz]
    for on, isaret in ISARETLER.items():
        if on.endswith("/") and temiz.startswith(on):
            return isaret
    return VARSAYILAN_ISARET


def kisa_ad(yol):
    return yol.split("?")[0].lstrip("/").replace(".html", "").replace("/", "_") or "kok"


def ekran_degerlendir(png):
    from PIL import Image, ImageStat
    im = Image.open(io.BytesIO(png)).convert("L")
    st = ImageStat.Stat(im)
    hist = im.histogram()
    koyu = sum(hist[:16]) / (im.width * im.height)
    sapma = st.stddev[0]
    return {"parlaklik_ort": round(st.mean[0], 1), "parlaklik_sapma": round(sapma, 1), "koyu_oran": round(koyu, 3),
            "bos_supheli": sapma < 8 or koyu > 0.9}


def diger_edge():
    ps = ("@(Get-CimInstance Win32_Process -Filter \"Name = 'msedge.exe'\" | "
          "Where-Object { $_.CommandLine -like '*--headless*' }).Count")
    try:
        return int(subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True, timeout=30).stdout.strip() or 0)
    except Exception:
        return None


def git_bilgi():
    def g(*a):
        try:
            return subprocess.run(["git", *a], cwd=KOK, capture_output=True, text=True, timeout=15).stdout.strip()
        except Exception:
            return None
    return {"dal": g("branch", "--show-current"), "commit": g("rev-parse", "--short", "HEAD"), "kirli": bool(g("status", "--porcelain"))}


def olc(p, url, isaret, profil, ekran_yolu, zaman_asimi):
    from playwright.sync_api import TimeoutError as PwZaman
    kurallar = "MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1, " + ", ".join("EXCLUDE " + h for h in IZINLI)
    b = p.chromium.launch(channel="msedge", headless=True,
                          args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization", f"--host-resolver-rules={kurallar}"])
    sonuc = {"edge_surum": b.version}
    try:
        ctx = b.new_context(locale="tr-TR", **PROFILLER[profil])
        ctx.add_init_script(INIT_JS.replace("__ISARET__", json.dumps(isaret)))
        pg = ctx.new_page()
        cdp = ctx.new_cdp_session(pg)
        cdp.send("Network.enable")
        cdp.send("Performance.enable")
        istek, konsol, sayfa_hata = {}, [], []

        def gonderildi(e):
            u = e["request"]["url"]
            if u.startswith(("http://", "https://")):
                istek.setdefault(e["requestId"], {"url": u, "mime": "", "bayt": 0, "parca": 0, "uzunluk": 0, "bitti": False,
                                                  "hata": None, "onbellek": False, "tahmini": False})["url"] = u

        def yanit(e):
            if e["requestId"] in istek:
                r, y = istek[e["requestId"]], e["response"]
                r["mime"] = y.get("mimeType", "")
                r["durum"] = y.get("status")
                # disk önbelleğinden gelen yanıt ağdan bayt taşımaz (oda: DRACO çözücüsünü iki yükleyici ayrı ister)
                if y.get("fromDiskCache") or y.get("fromPrefetchCache") or y.get("fromServiceWorker"):
                    r["onbellek"] = True
                bas = {k.lower(): v for k, v in (y.get("headers") or {}).items()}
                try:
                    r["uzunluk"] = int(bas.get("content-length", 0))
                except ValueError:
                    pass

        def veri(e):
            if e["requestId"] in istek:
                istek[e["requestId"]]["parca"] += e.get("encodedDataLength", 0)

        def bitti(e):
            # Asıl değer loadingFinished.encodedDataLength; 0 gelirse (bir denemede 2,2 MB'lık GLB böyle düştü) parça
            # toplamı ya da Content-Length kullanılır ve istek 'tahmini' işaretlenir
            if e["requestId"] in istek:
                r = istek[e["requestId"]]
                b = e.get("encodedDataLength", 0)
                if b <= 0 and not r["onbellek"] and max(r["parca"], r["uzunluk"]) > 0:
                    b, r["tahmini"] = max(r["parca"], r["uzunluk"]), True
                r.update(bayt=b, bitti=True)

        def basarisiz(e):
            # Telefon koşularında karakter.glb bazen yanıtı (200) alınıp gövdesi gittikten sonra ERR_ABORTED ile kapanıyor:
            # sunucu günlüğünde tek GET 200, karakter yükleniyor. Bu durumda gövde Content-Length (ya da parça toplamı)
            # ile sayılır, istek 'iptal_yanitli' olarak ayrıca listelenir (başarısız sayılmaz).
            if e["requestId"] in istek:
                r = istek[e["requestId"]]
                r.update(bitti=True, hata=e.get("errorText") or "?")
                if "ERR_ABORTED" in r["hata"] and 200 <= (r.get("durum") or 0) < 300 and not r["onbellek"]:
                    b = max(r["parca"], r["uzunluk"])
                    if b > 0:
                        r.update(bayt=b, tahmini=True, iptal_yanitli=True)

        def onbellek(e):
            if e["requestId"] in istek:
                istek[e["requestId"]]["onbellek"] = True

        cdp.on("Network.requestWillBeSent", gonderildi)
        cdp.on("Network.responseReceived", yanit)
        cdp.on("Network.dataReceived", veri)
        cdp.on("Network.loadingFinished", bitti)
        cdp.on("Network.loadingFailed", basarisiz)
        cdp.on("Network.requestServedFromCache", onbellek)
        pg.on("console", lambda m: konsol.append({"tur": m.type, "metin": m.text[:400]}) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: sayfa_hata.append(str(e)[:400]))

        t_bas = time.time()
        pg.goto(url, wait_until="commit", timeout=60000)
        try:
            pg.wait_for_function("() => 'hazir' in (window.__olc?.t || {})", timeout=zaman_asimi * 1000, polling=100)
            sonuc["zaman_asimi"] = False
        except PwZaman:
            sonuc["zaman_asimi"] = True
        # ekran görüntüsü hazır anında (zaman aşımında da, neyin görüldüğü bilinsin)
        png = pg.screenshot(type="png")
        sonuc["ekran"] = ekran_degerlendir(png)
        if ekran_yolu:
            with open(ekran_yolu, "wb") as f:
                f.write(png)
            sonuc["ekran"]["dosya"] = os.path.relpath(ekran_yolu, KOK)
        sonuc.update(pg.evaluate(SAYFA_JS))
        sonuc["kare"] = pg.evaluate(KARE_JS)
        sonuc["three"] = pg.evaluate(THREE_JS)
        # geç yüklenenler (karakter GLB'si gibi) de sayılsın: açık istek kalmayınca 1 sn bekle (en çok 15 sn)
        t_sakin, sakin_bas = time.time(), None
        while time.time() - t_sakin < 15:
            acik = sum(1 for r in istek.values() if not r["bitti"])
            if acik == 0:
                sakin_bas = sakin_bas or time.time()
                if time.time() - sakin_bas >= 1:
                    break
            else:
                sakin_bas = None
            pg.wait_for_timeout(200)
        sonuc["isaretler_ms"] = pg.evaluate("() => window.__olc?.t || {}")
        uzun = pg.evaluate("() => window.__olc ? window.__olc.uzun : null")
        m1 ={m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
        cdp.send("HeapProfiler.collectGarbage")
        m2 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
        sonuc["yigin_ham_mb"] = round(m1.get("JSHeapUsedSize", 0) / MB, 2)
        sonuc["yigin_mb"] = round(m2.get("JSHeapUsedSize", 0) / MB, 2)
        sonuc["yigin_toplam_mb"] = round(m2.get("JSHeapTotalSize", 0) / MB, 2)
        sonuc["dom_dugum"] = int(m2.get("Nodes", 0))
        sonuc["webgl"] = pg.evaluate(WEBGL_JS)
        sonuc["sure_sn"] = round(time.time() - t_bas, 1)
    finally:
        b.close()

    # ağ dökümü (bitmemiş istekte o ana kadar gelen parçalar sayılır)
    turler, hostlar, engellenen, hatali, iptal = {}, {}, [], [], []
    for r in istek.values():
        if not r["bitti"] and r["parca"] > 0:
            r["bayt"], r["tahmini"] = r["parca"], True
        h = urlparse(r["url"]).hostname or "?"
        k = tur(r["url"], r["mime"])
        t = turler.setdefault(k, {"istek": 0, "bayt": 0})
        t["istek"] += 1
        t["bayt"] += r["bayt"]
        hh = hostlar.setdefault(h, {"istek": 0, "bayt": 0})
        hh["istek"] += 1
        hh["bayt"] += r["bayt"]
        if r.get("iptal_yanitli"):
            iptal.append(f'{r.get("durum")} {r["hata"]} {r["url"][:160]}')
        elif r["hata"]:
            (engellenen if "NAME_NOT_RESOLVED" in r["hata"] else hatali).append(f'{r["hata"]} {r["url"][:160]}')
        elif r.get("durum") and r["durum"] >= 400:
            hatali.append(f'HTTP {r["durum"]} {r["url"][:160]}')
    toplam = sum(r["bayt"] for r in istek.values())
    yerel = sum(v["bayt"] for k, v in hostlar.items() if k in ("127.0.0.1", "localhost"))
    hatalar = [c["metin"] for c in konsol if c["tur"] == "error"] + sayfa_hata
    sonuc.update({
        "istek_sayisi": len(istek),
        "onbellekten": sum(1 for r in istek.values() if r["onbellek"]),
        "bitmeyen_istek": sum(1 for r in istek.values() if not r["bitti"]),
        "bayt_tahmini_istek": sum(1 for r in istek.values() if r["tahmini"]),
        "aktarim_mb": round(toplam / MB, 3),
        "yerel_mb": round(yerel / MB, 3),
        "dis_mb": round((toplam - yerel) / MB, 3),
        "glb_mb": round(turler.get("glb", {}).get("bayt", 0) / MB, 3),
        "gorsel_mb": round(turler.get("gorsel", {}).get("bayt", 0) / MB, 3),
        "js_mb": round(turler.get("js", {}).get("bayt", 0) / MB, 3),
        "diger_mb": round(sum(v["bayt"] for k, v in turler.items() if k not in ("glb", "gorsel", "js")) / MB, 3),
        "turler": {k: {"istek": v["istek"], "mb": round(v["bayt"] / MB, 3)} for k, v in sorted(turler.items())},
        "hostlar": {k: {"istek": v["istek"], "mb": round(v["bayt"] / MB, 3)} for k, v in sorted(hostlar.items())},
        "engellenen": engellenen,
        "basarisiz_istek": hatali,
        "iptal_yanitli": iptal,
        "konsol_hata": len(hatalar),
        "konsol_uyari": sum(1 for c in konsol if c["tur"] == "warning"),
        "ilk_hatalar": hatalar[:5],
        "ilk_uyarilar": [c["metin"] for c in konsol if c["tur"] == "warning"][:5],
        # önce/sonra farkında hangi dosyanın eklendiği görülsün: [adres, tür, KB, durum, not]
        "istekler": [[r["url"][:200], tur(r["url"], r["mime"]), round(r["bayt"] / 1024, 1),
                      " ".join(str(x) for x in (r.get("durum"), r["hata"]) if x) or ("bitmedi" if not r["bitti"] else None),
                      "onbellek" if r["onbellek"] else "tahmini" if r["tahmini"] else ""] for r in istek.values()],
    })
    t = sonuc["isaretler_ms"]
    sonuc["hazir_ms"] = t.get("hazir")
    for k in ("kurulum", "karakter"):
        if k in isaret:
            sonuc[f"{k}_ms"] = t.get(k)
    if uzun is not None:  # hazır işaretine kadar olan uzun görevler (TBT: her görevin 50 ms'yi aşan kısmı)
        sinir = sonuc["hazir_ms"] if sonuc["hazir_ms"] is not None else float("inf")
        once = [d for s, d in uzun if s < sinir]
        sonuc["uzun_gorev"] = {"sayi": len(once), "toplam_ms": sum(once), "en_uzun_ms": max(once, default=0),
                               "hazir_sonrasi_sayi": len(uzun) - len(once),
                               "en_uzun_5": [{"bas_ms": s, "sure_ms": d} for s, d in sorted(uzun, key=lambda x: -x[1])[:5]]}
        sonuc["tbt_ms"] = sum(max(0, d - 50) for d in once)
        sonuc["en_uzun_gorev_ms"] = max(once, default=0)
    sonuc["kare_5sn"] = sonuc["kare"]["kare"] if sonuc.get("kare") else None
    sonuc["en_uzun_kare_ms"] = sonuc["kare"]["en_uzun_ms"] if sonuc.get("kare") else None
    if sonuc.get("three"):
        sonuc["cizim_cagrisi"] = sonuc["three"]["cizim_cagrisi"]
        sonuc["ucgen"] = sonuc["three"]["ucgen"]
    return sonuc


# Özet metrikleri ve "kötü" yönü (+1: büyüğü kötü, -1: küçüğü kötü)
OZET = [("kurulum_ms", 1), ("hazir_ms", 1), ("karakter_ms", 1), ("fcp_ms", 1), ("load_ms", 1), ("istek_sayisi", 1),
        ("aktarim_mb", 1), ("glb_mb", 1), ("gorsel_mb", 1), ("js_mb", 1), ("diger_mb", 1), ("yerel_mb", 1), ("dis_mb", 1),
        ("yigin_mb", 1), ("yigin_ham_mb", 1), ("dom_dugum", 1), ("tbt_ms", 1), ("en_uzun_gorev_ms", 1), ("konsol_hata", 1), ("konsol_uyari", 1),
        ("kare_5sn", -1), ("en_uzun_kare_ms", 1), ("cizim_cagrisi", 1), ("ucgen", 1)]


def ozetle(olcumler):
    ozet = {}
    for o in olcumler:
        ozet.setdefault(o["sayfa"], {}).setdefault(o["profil"], []).append(o)
    out = {}
    for sayfa, profiller in ozet.items():
        for profil, liste in profiller.items():
            d = {"tekrar": len(liste), "zaman_asimi": sum(1 for o in liste if o.get("zaman_asimi")),
                 "bos_ekran_supheli": sum(1 for o in liste if o.get("ekran", {}).get("bos_supheli"))}
            for ad, yon in OZET:
                v = [o[ad] for o in liste if isinstance(o.get(ad), (int, float))]
                if v:
                    d[ad] = {"ortanca": round(statistics.median(v), 3), "en_kotu": max(v) if yon > 0 else min(v), "degerler": v}
            out.setdefault(sayfa, {})[profil] = d
    return out


TABLO = [("kurulum_ms", "kurulum ms"), ("hazir_ms", "hazır ms"), ("aktarim_mb", "aktarım MB"), ("glb_mb", "GLB MB"),
         ("istek_sayisi", "istek"), ("yigin_mb", "yığın MB"), ("konsol_hata", "hata"), ("kare_5sn", "kare/5sn"),
         ("cizim_cagrisi", "çizim")]


def tablo_yaz(ozet):
    for sayfa, profiller in ozet.items():
        print(f"\n{sayfa}")
        for profil, d in profiller.items():
            parca = []
            for ad, baslik in TABLO:
                if ad in d:
                    parca.append(f"{baslik} {d[ad]['ortanca']:g} (en kötü {d[ad]['en_kotu']:g})")
            ek = f"  [zaman aşımı {d['zaman_asimi']}]" if d["zaman_asimi"] else ""
            ek += f"  [boş ekran şüphesi {d['bos_ekran_supheli']}]" if d["bos_ekran_supheli"] else ""
            print(f"  {profil:9s} " + " | ".join(parca) + ek)


def karsilastir(a_yol, b_yol):
    a, b = (json.load(open(y, encoding="utf-8")) for y in (a_yol, b_yol))
    print(f"A: {a['etiket']} {a['zaman']}  →  B: {b['etiket']} {b['zaman']}")
    for sayfa, profiller in a["ozet"].items():
        for profil, da in profiller.items():
            db = b["ozet"].get(sayfa, {}).get(profil)
            if not db:
                continue
            print(f"\n{sayfa} · {profil}")
            for ad, _ in OZET:
                if ad in da and ad in db:
                    x, y = da[ad]["ortanca"], db[ad]["ortanca"]
                    fark = f"{(y - x) / x * 100:+.1f}%" if x else ("0%" if y == 0 else "yeni")
                    print(f"  {ad:16s} {x:>12g} → {y:<12g} {fark}")


def main():
    ap = argparse.ArgumentParser(description="Sayfa yükleme ve çalışma ölçümü (telefon + masaüstü).")
    ap.add_argument("sayfalar", nargs="*")
    ap.add_argument("--port", type=int, default=8092)
    ap.add_argument("--tekrar", type=int, default=3)
    ap.add_argument("--etiket", default="olcum")
    ap.add_argument("--profil", default="telefon,masaustu")
    ap.add_argument("--zaman-asimi", type=int, default=120, help="hazır işareti için en çok bekleme, sn")
    ap.add_argument("--tum-ekranlar", action="store_true", help="her tekrarın ekran görüntüsünü yaz (varsayılan yalnız ilki)")
    ap.add_argument("--karsilastir", nargs=2, metavar=("A.json", "B.json"))
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.karsilastir:
        return karsilastir(*a.karsilastir)
    if not a.sayfalar:
        ap.error("en az bir sayfa yolu gerekli")
    profiller = [x.strip() for x in a.profil.split(",") if x.strip()]
    for x in profiller:
        if x not in PROFILLER:
            ap.error(f"bilinmeyen profil: {x}")
    damga = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    on = f"{a.etiket}-{damga}"
    taban = f"http://127.0.0.1:{a.port}/"
    plan = [(r, s, pr) for r in range(1, a.tekrar + 1) for s in a.sayfalar for pr in profiller]  # tekrarlar iç içe: koşullar eşit dağılır
    if a.dry_run:
        for r, s, pr in plan:
            print(f"tekrar {r}: {taban}{s.lstrip('/')}  [{pr}]  işaret: {list(isaret_sec(s))}")
        print("yazılacak:", os.path.join(CIKIS, on + ".json"))
        return
    try:
        urllib.request.urlopen(taban, timeout=5).read(1)
    except Exception as e:
        sys.exit(f"sunucu yanıt vermiyor ({taban}): {e}. Önce: python scripts/serve.py {a.port}")
    os.makedirs(CIKIS, exist_ok=True)

    from playwright.sync_api import sync_playwright
    ortam = {"diger_gorunmez_edge_bas": diger_edge(), "git": git_bilgi(), "cpu_mantiksal": os.cpu_count()}
    olcumler = []
    t0 = time.time()
    with sync_playwright() as p:
        for i, (r, s, pr) in enumerate(plan, 1):
            yol = s.lstrip("/")
            ekran = os.path.join(CIKIS, f"{on}-{kisa_ad(s)}-{pr}-{r}.png") if (r == 1 or a.tum_ekranlar) else None
            try:
                o = olc(p, taban + yol, isaret_sec(s), pr, ekran, a.zaman_asimi)
            except Exception as e:
                o = {"istisna": str(e).splitlines()[0][:300]}
            o.update(sayfa=yol, profil=pr, tekrar=r)
            olcumler.append(o)
            print(f"[{i}/{len(plan)}] {yol} {pr} #{r}: hazır {o.get('hazir_ms')} ms, {o.get('aktarim_mb')} MB, "
                  f"{o.get('istek_sayisi')} istek, yığın {o.get('yigin_mb')} MB, hata {o.get('konsol_hata')}, "
                  f"kare {o.get('kare_5sn')}" + (f"  İSTİSNA: {o['istisna']}" if "istisna" in o else ""), flush=True)
    ortam["diger_gorunmez_edge_son"] = diger_edge()
    ortam["edge_surum"] = next((o.get("edge_surum") for o in olcumler if o.get("edge_surum")), None)
    ortam["webgl"] = sorted({o.get("webgl") for o in olcumler if o.get("webgl")})
    sonuc = {
        "etiket": a.etiket, "zaman": damga, "betik": "scripts/sayfa-olc.py", "sure_sn": round(time.time() - t0),
        "ayar": {"port": a.port, "tekrar": a.tekrar, "profiller": {k: PROFILLER[k] for k in profiller}, "izinli_dis": IZINLI,
                 "isaretler": {s: isaret_sec(s) for s in a.sayfalar}, "zaman_asimi_sn": a.zaman_asimi},
        "ortam": ortam,
        "notlar": [
            "Süreler gezinme başlangıcından (performance.timeOrigin) ms; ağ kısıtlaması yok, CDN gerçek internetten gelir.",
            "kare_5sn hazır işaretinden sonraki 5 sn'deki requestAnimationFrame sayısı; görünmez tarayıcıda yalnız gösterge.",
            "yigin_mb çöp toplamadan sonra JSHeapUsedSize; GPU belleği ve ArrayBuffer içerikleri buna girmez.",
            "aktarım baytı CDP encodedDataLength (başlık dahil, sıkıştırılmış); ölçüm hazır + 5 sn + ağ sakinleşene kadar sürer.",
            "Her ölçüm yeni Edge: soğuk önbellek, boş localStorage (oda girişi 'full' modda).",
        ],
        "ozet": ozetle(olcumler),
        "olcumler": olcumler,
    }
    yol = os.path.join(CIKIS, on + ".json")
    with open(yol, "w", encoding="utf-8") as f:
        json.dump(sonuc, f, ensure_ascii=False, indent=1)
    tablo_yaz(sonuc["ozet"])
    print(f"\nyazıldı: {yol}  ({sonuc['sure_sn']} sn)")


if __name__ == "__main__":
    main()
