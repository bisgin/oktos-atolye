# Amaç: oda sayfasında (oda/index.html, 2026-11-02'den beri; eski lab/oda.html yönlendirir) sahne kurulduktan hemen
#        sonraki ana iş parçacığı donmasının NEDENİNİ kategori kategori ölçmek (gölgelendirici derleme/bağlama beklemesi, doku yükleme, tampon, çizim çağrısı, diğer GL, JS) ve bir düzeltmeyi
#        URL bayrağıyla önce→sonra karşılaştırmak. Yöntem (sunucu, ağ kısıtı, hazır işaretleri, profiller) scripts/sayfa-olc.py
#        ile aynıdır; o dosyadaki IZINLI, PROFILLER, ISARETLER ve INIT_JS buradan içe aktarılır (tek kaynak).
# Girdi:  python scripts/donma-olc.py [oda/index.html] [--port 8093] [--tekrar 3] [--profil telefon,masaustu]
#             [--varyant once] [--varyant isinma=isinma=1] [--iz] [--gorunur] [--zaman-asimi 120] [--dry-run]
#         --varyant AD[=SORGU]: AD çıktı etiketi, SORGU adrese eklenir (ör. isinma=isinma=1 → ?isinma=1). Birden çok varyant
#             aynı komutta iç içe (tekrar × varyant × profil) koşar: koşullar eşit dağılır. Varsayılan tek varyant 'once'.
#         --iz: her varyant/profil için ek bir koşu CDP izi (Chrome tracing) alır: GPU sürecinin donma anında ne yaptığını
#             çapraz doğrular (iz yükü süreleri bozar; bu koşular istatistiğe girmez).
#         python scripts/donma-olc.py --grafik once.json sonra.json [--png yol]   (önce→sonra kırılım grafiği, Pillow)
#         (yerel sunucu açık olmalı: python scripts/serve.py 8093)
# Çıktı:  .impeccable/olcum/donma-<varyant>-<YYYYAAGG-SSDDss>.json (her koşu + profil başına ortanca/en az/en çok);
#         --iz ile .impeccable/olcum/donma-<varyant>-<damga>-iz-<profil>.json.gz (ham iz). --grafik:
#         .impeccable/olcum/donma-kirilim-<YYYYAAGG>.png (varsa -2, -3 ... eklenir). Hiçbir dosyanın üstüne yazılmaz, silinmez.
# Ölçüm:  Sayfa açılmadan önce (add_init_script) WebGL2/WebGL1 bağlamının bütün yöntemleri performance.now() ile sarılır;
#         her çağrının süresi 2 ms'lik zaman kovalarına kategori ve evre (render / gölge haritası / PMREM / ön derleme / doku
#         ön yükleme) ayrımıyla yazılır. Donma = ilk renderer.render çağrısını içeren uzun görev (longtask). Kırılım: o uzun
#         görev(ler)deki GL süreleri; kalan süre JS'tir (three.js sahne gezintisi, uniform hazırlığı, sayfa kodu); sarmalayıcının
#         kendi maliyeti (ölçüm yükü) çağrı sayısı × kalibre edilmiş çağrı başı maliyet olarak ayrıca yazılır.
#         Program başına: derleme/bağlama çağrısı, ilk engelleyen sorgu (getProgramInfoLog: GPU süreci derlemeyi bitirene dek
#         bekler) ve ilk çizim; three.js renderer.info.programs ile (malzeme türü, adı) eşlenir.
#         Not: Chrome'da GL çağrıları GPU sürecine kuyruklanır; ana iş parçacığı yalnız eşzamanlı bir sorguda (ya da komut
#         tamponu dolunca) bekler. Bu yüzden bekleme hangi çağrıda görünüyorsa oraya yazılır; --iz bunu GPU tarafından doğrular.
#         performance.now() çapraz köken yalıtımı olmayan sayfada ~0,1 ms'ye yuvarlanır (titreşimli): tek tek küçük çağrılar
#         kaba, binlercesinin toplamı yansızdır.
# Gereken: playwright (pip), kurulu Microsoft Edge, Pillow (grafik için).
import argparse, datetime, gzip, importlib.util, json, os, re, statistics, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKIS = os.path.join(KOK, ".impeccable", "olcum")

_spec = importlib.util.spec_from_file_location("sayfa_olc", os.path.join(KOK, "scripts", "sayfa-olc.py"))
SO = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(SO)

KAT = ["derleme", "baglama", "program_sorgu", "hazir_sorgu", "doku_yukle", "doku_ayir", "mipmap", "tampon", "cizim",
       "hedef", "senkron", "diger_gl"]
FAZ = ["dis", "render", "golge", "pmrem", "derle", "doku_on"]

GL_JS = r"""
(() => {
  if (window.top !== window) return;
  const now = performance.now.bind(performance);
  const KOVA = 2; // ms; pencere kenarındaki komşu kısa görevlerin payı en çok 2 kova
  const KAT = __KAT__, FAZ = __FAZ__;
  const K = Object.fromEntries(KAT.map((k, i) => [k, i])), F = Object.fromEntries(FAZ.map((f, i) => [f, i]));
  const NK = KAT.length, NF = FAZ.length, GEN = NF * NK * 2 + 3; // [evre][kategori][ms, adet] + piksel, bayt, doku(0. seviye)
  let kovalar = new Map(), fazKova = new Map();
  let faz = 0, acik = true;
  const G = window.__gl = { uzun: [], loaf: [], buyuk: [], ilk_render: null, render_sayisi: 0, pmrem_kanca: false, faz_cagri: [] };

  function ekle(k, t0, dt, px, by, d0) {
    const i = Math.floor(t0 / KOVA);
    let a = kovalar.get(i);
    if (!a) { a = new Float64Array(GEN); kovalar.set(i, a); }
    const j = (faz * NK + k) * 2;
    a[j] += dt; a[j + 1] += 1;
    if (px) a[GEN - 3] += px;
    if (by) a[GEN - 2] += by;
    if (d0) a[GEN - 1] += 1;
  }

  // ---- program / gölgelendirici kaydı ----
  const P = new Map(), S = new Map();
  let progNo = 0, aktif = null;
  const yeniP = (t0) => ({ no: ++progNo, t: t0, faz: FAZ[faz], derleme: 0, baglama: 0, ilk_sorgu: null, ilk_sorgu_t: null, sorgu: 0,
    ilk_cizim: null, ilk_cizim_t: null, vs: 0, fs: 0, tanim: new Set() });
  const kayit = {
    createProgram(a, t0, dt, r) { if (r) P.set(r, yeniP(t0)); },
    createShader(a, t0, dt, r) { if (r) S.set(r, { tur: a[0], uzunluk: 0, tanim: [], prog: null }); },
    shaderSource(a) { const s = S.get(a[0]); if (s && typeof a[1] === 'string') { s.uzunluk = a[1].length; s.tanim = [...a[1].matchAll(/^\s*#define\s+([A-Za-z0-9_]+)/gm)].map((m) => m[1]); } },
    compileShader(a, t0, dt) { const s = S.get(a[0]); if (s && s.prog) s.prog.derleme += dt; else if (s) s.derlemeOnce = (s.derlemeOnce || 0) + dt; },
    attachShader(a) {
      const p = P.get(a[0]), s = S.get(a[1]);
      if (!p || !s) return;
      s.prog = p;
      if (s.tur === 0x8B31) p.vs = s.uzunluk; else p.fs = s.uzunluk;
      for (const x of s.tanim) p.tanim.add(x);
      if (s.derlemeOnce) { p.derleme += s.derlemeOnce; s.derlemeOnce = 0; }
    },
    linkProgram(a, t0, dt) { const p = P.get(a[0]); if (p) { p.baglama += dt; p.link_t = t0; } },
    useProgram(a) { aktif = a[0] ? P.get(a[0]) || null : null; },
  };
  const ilkSorgu = (p, t0, dt) => { if (!p) return; if (p.ilk_sorgu === null) { p.ilk_sorgu = dt; p.ilk_sorgu_t = t0; } p.sorgu += dt; };
  const SORGU_P = new Set(['getProgramParameter', 'getProgramInfoLog', 'getActiveUniform', 'getActiveAttrib', 'getUniformLocation',
    'getAttribLocation', 'getUniformBlockIndex', 'getActiveUniforms', 'getUniformIndices', 'getActiveUniformBlockParameter',
    'getActiveUniformBlockName', 'getFragDataLocation', 'getTransformFeedbackVarying', 'validateProgram', 'getAttachedShaders']);
  const SORGU_S = new Set(['getShaderParameter', 'getShaderInfoLog', 'getShaderSource']);
  const CIZIM = new Set(['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements']);
  const KATAD = {};
  for (const x of ['compileShader', 'shaderSource', 'createShader', 'attachShader', 'detachShader', 'deleteShader']) KATAD[x] = K.derleme;
  for (const x of ['linkProgram', 'createProgram', 'deleteProgram']) KATAD[x] = K.baglama;
  for (const x of [...SORGU_P, ...SORGU_S, 'getShaderPrecisionFormat']) KATAD[x] = K.program_sorgu;
  for (const x of ['texStorage2D', 'texStorage3D', 'createTexture']) KATAD[x] = K.doku_ayir;
  KATAD.generateMipmap = K.mipmap;
  for (const x of ['bufferData', 'bufferSubData', 'createBuffer', 'copyBufferSubData']) KATAD[x] = K.tampon;
  for (const x of CIZIM) KATAD[x] = K.cizim;
  for (const x of ['bindFramebuffer', 'framebufferTexture2D', 'framebufferTextureLayer', 'framebufferRenderbuffer', 'renderbufferStorage',
    'renderbufferStorageMultisample', 'blitFramebuffer', 'invalidateFramebuffer', 'checkFramebufferStatus', 'clear', 'clearBufferfv',
    'clearBufferiv', 'clearBufferuiv', 'clearBufferfi', 'readBuffer', 'drawBuffers', 'createFramebuffer', 'createRenderbuffer',
    'bindRenderbuffer']) KATAD[x] = K.hedef;
  for (const x of ['readPixels', 'finish', 'flush', 'getError', 'clientWaitSync', 'fenceSync', 'getSyncParameter', 'getBufferSubData',
    'getQueryParameter']) KATAD[x] = K.senkron;

  // ---- doku yüklemesi: boyut, kaynak türü, bayt ----
  const boyut = (s) => [s.naturalWidth || s.videoWidth || s.displayWidth || s.codedWidth || s.width || 0,
    s.naturalHeight || s.videoHeight || s.displayHeight || s.codedHeight || s.height || 0];
  function doku(ad, a) {
    let w = 0, h = 0, d = 1, src, lv = a[1], kaynakli = false;
    switch (ad) {
      case 'texImage2D': if (a.length === 6) { src = a[5]; kaynakli = true; } else { w = a[3]; h = a[4]; src = a[8]; } break;
      case 'texSubImage2D': if (a.length === 7) { src = a[6]; kaynakli = true; } else { w = a[4]; h = a[5]; src = a[8]; } break;
      case 'texImage3D': w = a[3]; h = a[4]; d = a[5]; src = a[9]; break;
      case 'texSubImage3D': w = a[5]; h = a[6]; d = a[7]; src = a[10]; break;
      case 'compressedTexImage2D': w = a[3]; h = a[4]; src = a[6]; break;
      case 'compressedTexSubImage2D': w = a[4]; h = a[5]; src = a[7]; break;
      case 'texStorage2D': w = a[3]; h = a[4]; lv = 0; break;
      case 'texStorage3D': w = a[3]; h = a[4]; d = a[5]; lv = 0; break;
    }
    const ayir = ad.startsWith('texStorage') || src === null || src === undefined;
    let kaynak = ayir ? 'yok' : typeof src === 'number' ? 'pbo' : (src && src.constructor && src.constructor.name) || '?';
    if (!ayir && src && typeof src === 'object' && !ArrayBuffer.isView(src)) { if (kaynakli || !w) [w, h] = boyut(src); }
    const px = w * h * d;
    const by = !ayir && src && ArrayBuffer.isView(src) ? src.byteLength : ayir ? 0 : px * 4;
    return { ayir, px: ayir ? 0 : px, by, w, h, d, kaynak, lv };
  }
  const DOKU = new Set(['texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D', 'compressedTexImage2D', 'compressedTexSubImage2D',
    'texStorage2D', 'texStorage3D']);

  function sar(proto, ad) {
    const d = Object.getOwnPropertyDescriptor(proto, ad);
    if (!d || typeof d.value !== 'function' || ad === 'constructor' || d.value.__olc) return;
    const f = d.value;
    const sabit = KATAD[ad] ?? K.diger_gl;
    const k = kayit[ad];
    const dk = DOKU.has(ad);
    const sp = SORGU_P.has(ad), ss = SORGU_S.has(ad), cz = CIZIM.has(ad), pp = ad === 'getProgramParameter';
    const yeni = function (...a) {
      const t0 = now();
      const r = f.apply(this, a);
      const dt = now() - t0;
      if (!acik) return r;
      let kat = sabit, px = 0, by = 0, d0 = 0;
      if (dk) {
        const b = doku(ad, a);
        if (ad.startsWith('tex') && !ad.startsWith('texStorage')) kat = b.ayir ? K.doku_ayir : K.doku_yukle;
        px = b.px; by = b.by; d0 = !b.ayir && b.lv === 0 ? 1 : 0;
        if (dt >= 2 && G.buyuk.length < 400) G.buyuk.push({ t: Math.round(t0), ms: +dt.toFixed(2), fn: ad, w: b.w, h: b.h, d: b.d, kaynak: b.kaynak, seviye: b.lv, faz: FAZ[faz] });
      } else if (pp && a[1] === 0x91B1) kat = K.hazir_sorgu;
      else if (sp) ilkSorgu(P.get(a[0]), t0, dt);
      else if (ss) ilkSorgu(S.get(a[0])?.prog, t0, dt);
      else if (cz && aktif && aktif.ilk_cizim === null) { aktif.ilk_cizim = dt; aktif.ilk_cizim_t = t0; }
      if (k) k(a, t0, dt, r);
      ekle(kat, t0, dt, px, by, d0);
      return r;
    };
    yeni.__olc = true;
    proto[ad] = yeni;
  }
  for (const C of [self.WebGL2RenderingContext, self.WebGLRenderingContext]) {
    if (!C) continue;
    for (const ad of Object.getOwnPropertyNames(C.prototype)) sar(C.prototype, ad);
  }

  // ---- evreler: renderer.render, gölge haritası, ön derleme, doku ön yükleme, PMREM ----
  function fazEkle(f, t0, dt) {
    const i = Math.floor(t0 / KOVA);
    let a = fazKova.get(i);
    if (!a) { a = new Float64Array(NF * 2); fazKova.set(i, a); }
    a[f * 2] += dt; a[f * 2 + 1] += 1;
  }
  function fazla(obj, ad, f) {
    const asil = obj[ad];
    if (typeof asil !== 'function' || asil.__olc) return;
    const yeni = function (...a) {
      const onceki = faz;
      // render en alt evre: gölge / PMREM / ön derleme içindeki render çağrısı o evrede sayılır
      const kur = f !== F.render || onceki === F.dis;
      if (kur) faz = f;
      const t0 = now();
      // ilk kare: evre dışından gelen ilk render (PMREM'in ve ön derlemenin içindeki render'lar sayılmaz)
      const ust = f === F.render && kur;
      if (ust) { G.render_sayisi++; if (!G.ilk_render) G.ilk_render = { bas: t0 }; }
      try { return asil.apply(this, a); }
      finally {
        const dt = now() - t0;
        if (kur) { fazEkle(f, t0, dt); faz = onceki; }
        if (ust && G.ilk_render.son === undefined) G.ilk_render.son = t0 + dt;
        if (f !== F.render && dt >= 1 && G.faz_cagri.length < 200) G.faz_cagri.push({ faz: FAZ[f], fn: ad, t: Math.round(t0), ms: +dt.toFixed(1) });
      }
    };
    yeni.__olc = true;
    obj[ad] = yeni;
  }
  function rendererSar(r) {
    if (!r || r.__olc) return;
    r.__olc = true;
    fazla(r, 'render', F.render);
    fazla(r, 'compile', F.derle);
    fazla(r, 'initTexture', F.doku_on);
    if (r.shadowMap) fazla(r.shadowMap, 'render', F.golge);
    G.renderer_kanca = true;
  }
  // Sayfa denetleyiciyi window.story'ye yazar (oda/index.html); ilk kare bundan sonraki rAF'ta çizilir. Atanmadan önce
  // window.story, id="story" bölümünün kendisidir: o davranış korunur.
  let storyDeger;
  Object.defineProperty(window, 'story', { configurable: true, enumerable: true,
    get: () => storyDeger ?? document.getElementById('story'),
    set: (x) => { storyDeger = x; try { if (x && x.renderer) rendererSar(x.renderer); } catch (_) { } } });
  // PMREMGenerator (ortam haritası ön süzgeci) aynı three modülünden: içe aktarma haritası çözüldükten sonra (DOMContentLoaded)
  addEventListener('DOMContentLoaded', () => {
    try {
      const im = JSON.parse(document.querySelector('script[type=importmap]')?.textContent || '{}').imports || {};
      if (!im.three) return;
      import(im.three).then((T) => {
        const pr = T.PMREMGenerator && T.PMREMGenerator.prototype;
        if (pr) { for (const ad of ['fromScene', 'fromEquirectangular', 'fromCubemap', 'compileEquirectangularShader', 'compileCubemapShader']) fazla(pr, ad, F.pmrem); G.pmrem_kanca = true; }
      }).catch(() => { });
    } catch (_) { }
  });

  // ---- uzun görev ve uzun animasyon karesi ----
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (G.uzun.length < 3000) G.uzun.push([+e.startTime.toFixed(1), +e.duration.toFixed(1)]); })
      .observe({ type: 'longtask', buffered: true });
  } catch (_) { G.uzun = null; }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.duration < 100 || G.loaf.length >= 300) continue;
        G.loaf.push({ bas: Math.round(e.startTime), sure: Math.round(e.duration), engel: Math.round(e.blockingDuration || 0),
          render_bas: Math.round(e.renderStart || 0), stil_bas: Math.round(e.styleAndLayoutStart || 0),
          betikler: (e.scripts || []).slice(0, 6).map((s) => ({ cagiran: s.invoker, tur: s.invokerType, kaynak: (s.sourceURL || '').split('/').slice(-2).join('/'),
            fn: s.sourceFunctionName, sure: Math.round(s.duration), zorla_stil: Math.round(s.forcedStyleAndLayoutDuration || 0) })) });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch (_) { G.loaf = null; }

  // ---- Python'dan çağrılanlar ----
  G.pencere = (s, e) => {
    const out = { kat: {}, faz: {}, faz_sure: {}, piksel: 0, bayt: 0, doku: 0 };
    const i0 = Math.floor(s / KOVA), i1 = Math.floor(e / KOVA);
    const top = new Float64Array(GEN), ft = new Float64Array(NF * 2);
    for (let i = i0; i <= i1; i++) {
      const a = kovalar.get(i); if (a) for (let j = 0; j < GEN; j++) top[j] += a[j];
      const b = fazKova.get(i); if (b) for (let j = 0; j < NF * 2; j++) ft[j] += b[j];
    }
    for (let k = 0; k < NK; k++) {
      let ms = 0, n = 0;
      for (let f = 0; f < NF; f++) {
        const j = (f * NK + k) * 2;
        ms += top[j]; n += top[j + 1];
        if (top[j + 1]) { (out.faz[FAZ[f]] ??= {})[KAT[k]] = [+top[j].toFixed(2), top[j + 1]]; }
      }
      out.kat[KAT[k]] = [+ms.toFixed(2), n];
    }
    for (let f = 0; f < NF; f++) if (ft[f * 2 + 1]) out.faz_sure[FAZ[f]] = [+ft[f * 2].toFixed(1), ft[f * 2 + 1]];
    out.piksel = top[GEN - 3]; out.bayt = top[GEN - 2]; out.doku = top[GEN - 1];
    return out;
  };
  G.programlar = () => {
    const r = (window.story && window.story.renderer) || null;
    const three = new Map();
    for (const p of (r && r.info && r.info.programs) || []) if (p.program) three.set(p.program, { tur: p.type, ad: p.name, id: p.id, kullanim: p.usedTimes, anahtar_uzunluk: (p.cacheKey || '').length });
    const out = [];
    for (const [gp, x] of P) {
      const t = three.get(gp);
      out.push({ no: x.no, t: Math.round(x.t), faz: x.faz, derleme: +x.derleme.toFixed(2), baglama: +x.baglama.toFixed(2),
        ilk_sorgu: x.ilk_sorgu === null ? null : +x.ilk_sorgu.toFixed(2), ilk_sorgu_t: x.ilk_sorgu_t === null ? null : Math.round(x.ilk_sorgu_t),
        sorgu: +x.sorgu.toFixed(2), ilk_cizim: x.ilk_cizim === null ? null : +x.ilk_cizim.toFixed(2),
        vs: x.vs, fs: x.fs, tanim: [...x.tanim], three: t || null });
    }
    return out;
  };
  // Sarmalayıcının çağrı başı maliyeti: aynı sarma yolundan geçen boş bir yöntem (kayıt geçici kovalara gider)
  G.kalibre = (n = 200000) => {
    const gk = kovalar, ga = acik; kovalar = new Map(); acik = true;
    const o = { bos() { return 0; } };
    const kopya = {}; Object.defineProperty(kopya, 'bos', { value: o.bos, writable: true, configurable: true });
    sar(kopya, 'bos');
    const t0 = now(); for (let i = 0; i < n; i++) kopya.bos(i); const t1 = now();
    for (let i = 0; i < n; i++) o.bos(i); const t2 = now();
    kovalar = gk; acik = ga;
    return Math.max(0, ((t1 - t0) - (t2 - t1)) / n);
  };
  G.zaman_cozunurlugu = () => { let m = Infinity, a = now(); for (let i = 0; i < 200000 && m > 0.0011; i++) { const b = now(); if (b > a) { m = Math.min(m, b - a); a = b; } } return m; };
  G.durdur = () => { acik = false; };
})();
""".replace("__KAT__", json.dumps(KAT)).replace("__FAZ__", json.dumps(FAZ))

TEMEL_JS = """() => {
  const G = window.__gl;
  const r = window.story && window.story.renderer;
  let gl = r && r.getContext && r.getContext(), ren = null, paralel = null, surum = null;
  if (gl) {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    ren = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    paralel = (gl.getSupportedExtensions() || []).includes('KHR_parallel_shader_compile');
    surum = gl.getParameter(gl.VERSION);
  }
  const isaret = (ad) => { const m = performance.getEntriesByName(ad); return m.length ? Math.round(m[m.length - 1].startTime) : null; };
  return { renderer: ren, gl_surum: surum, paralel_derleme: paralel, capraz_yalitim: self.crossOriginIsolated,
    uzun: G.uzun, loaf: G.loaf, ilk_render: G.ilk_render, render_sayisi: G.render_sayisi, pmrem_kanca: G.pmrem_kanca,
    renderer_kanca: !!G.renderer_kanca, faz_cagri: G.faz_cagri, buyuk: G.buyuk,
    isinma_bas: isaret('isinma-bas'), isinma_son: isaret('isinma-son'), isaretler: (window.__olc && window.__olc.t) || {},
    program_three: r && r.info && r.info.programs ? r.info.programs.length : null,
    info: r && r.info ? { doku: r.info.memory.textures, geometri: r.info.memory.geometries } : null };
}"""

GRUPLAR = [  # grafik ve özet için kategori grupları (ad, kategoriler, renk)
    ("Gölgelendirici derleme/bağlama", ["derleme", "baglama", "program_sorgu", "hazir_sorgu"], (196, 78, 32)),
    ("Doku yükleme", ["doku_yukle", "doku_ayir", "mipmap"], (52, 120, 190)),
    ("Geometri tamponu", ["tampon"], (120, 170, 80)),
    ("Çizim çağrısı", ["cizim"], (230, 170, 40)),
    ("Diğer GL", ["hedef", "senkron", "diger_gl"], (140, 110, 170)),
    ("JS (three.js + sayfa)", ["__js"], (110, 110, 110)),
    ("Ölçüm yükü", ["__yuk"], (200, 200, 200)),
]


def kirilim(pencereler, uzunlar, yuk_ms):
    """Uzun görevlerin pencerelerindeki GL kategorilerini toplar; kalan süre JS, sarmalayıcı maliyeti ölçüm yükü."""
    kat = {k: 0.0 for k in KAT}
    adet = {k: 0 for k in KAT}
    faz = {}
    faz_sure = {}
    piksel = bayt = doku = 0
    for p in pencereler:
        for k, (ms, n) in p["kat"].items():
            kat[k] += ms
            adet[k] += n
        for f, d in p["faz"].items():
            for k, (ms, n) in d.items():
                faz.setdefault(f, {}).setdefault(k, 0.0)
                faz[f][k] += ms
        for f, (ms, n) in p["faz_sure"].items():
            faz_sure[f] = faz_sure.get(f, 0.0) + ms
        piksel += p["piksel"]
        bayt += p["bayt"]
        doku += p["doku"]
    toplam = sum(d for _, d in uzunlar)
    gl = sum(kat.values())
    cagri = sum(adet.values())
    yuk = min(cagri * yuk_ms, max(0.0, toplam - gl))
    js = max(0.0, toplam - gl - yuk)
    gruplar = {}
    for ad, ks, _ in GRUPLAR:
        if ks == ["__js"]:
            gruplar[ad] = round(js, 1)
        elif ks == ["__yuk"]:
            gruplar[ad] = round(yuk, 1)
        else:
            gruplar[ad] = round(sum(kat[k] for k in ks), 1)
    return {"toplam_ms": round(toplam, 1), "gl_ms": round(gl, 1), "js_ms": round(js, 1), "olcum_yuku_ms": round(yuk, 1),
            "gl_cagri": cagri, "gruplar": gruplar,
            "kategoriler": {k: [round(kat[k], 1), adet[k]] for k in KAT if adet[k]},
            "evre_gl": {f: {k: round(v, 1) for k, v in d.items() if v >= 0.5} for f, d in faz.items()},
            "evre_sure": {f: round(v, 1) for f, v in faz_sure.items()},
            "doku_yuklenen": int(doku), "doku_mpiksel": round(piksel / 1e6, 2), "doku_mb": round(bayt / 1024 / 1024, 1)}


ETIKETLER = [  # gölgelendirici tanımlarından kısa nitelikler (program tablosu için)
    ("TONE_MAPPING", "ton"), ("USE_SHADOWMAP", "gölge-al"), ("USE_TRANSMISSION", "geçirgen"), ("USE_MAP", "doku"),
    ("USE_NORMALMAP", "normal"), ("USE_ENVMAP", "ortam"), ("USE_SKINNING", "deri"), ("USE_INSTANCING", "örnek"),
    ("USE_ALPHATEST", "alfa-kes"), ("PHYSICAL", "fiziksel"), ("STANDARD", "standart"), ("DEPTH_PACKING", "derinlik"),
    ("USE_EMISSIVEMAP", "ışıma"), ("USE_LIGHTMAP", "ışık-haritası"), ("USE_AOMAP", "ao"), ("ENVMAP_TYPE_CUBE_UV", "cubeUV"),
    ("FLAT_SHADED", "düz"), ("DOUBLE_SIDED", "çift-yüz"), ("FLIP_SIDED", "ters-yüz"), ("USE_FOG", "sis"),
]


def program_tablosu(programlar, s, e):
    sec = []
    for p in programlar:
        bekle = (p["ilk_sorgu"] or 0) + (p["ilk_cizim"] or 0) + p["derleme"] + p["baglama"]
        icinde = (p["ilk_sorgu_t"] is not None and s <= p["ilk_sorgu_t"] <= e) or (s <= p["t"] <= e)
        tanim = set(p["tanim"])
        three = p.get("three") or {}
        sec.append({"no": p["no"], "maliyet_ms": round(bekle, 1), "ilk_sorgu_ms": p["ilk_sorgu"], "ilk_cizim_ms": p["ilk_cizim"],
                    "tur": three.get("tur") or ("PMREM/iç" if p["faz"] == "pmrem" else "?"), "ad": three.get("ad") or "",
                    "faz": p["faz"], "donmada": icinde, "fs_kar": p["fs"], "vs_kar": p["vs"],
                    "nitelik": [k for d, k in ETIKETLER if d in tanim]})
    sec.sort(key=lambda x: -x["maliyet_ms"])
    return sec


def iz_ozet(ham):
    """CDP izinde ana iş parçacığının en uzun görevi sırasında GPU sürecinde en çok zaman alan olaylar."""
    try:
        olaylar = json.loads(ham)
    except Exception as e:
        return {"hata": str(e)[:200]}
    olaylar = olaylar.get("traceEvents", olaylar) if isinstance(olaylar, dict) else olaylar
    surec, iplik = {}, {}
    for o in olaylar:
        if o.get("ph") == "M" and o.get("name") == "process_name":
            surec[o["pid"]] = o.get("args", {}).get("name", "")
        elif o.get("ph") == "M" and o.get("name") == "thread_name":
            iplik[(o["pid"], o["tid"])] = o.get("args", {}).get("name", "")
    ana = [o for o in olaylar if o.get("ph") == "X" and iplik.get((o.get("pid"), o.get("tid"))) == "CrRendererMain"
           and o.get("name") in ("ThreadControllerImpl::RunTask", "RunTask") and o.get("dur", 0) > 50000]
    if not ana:
        return {"hata": "ana iş parçacığında uzun görev bulunamadı"}
    en = max(ana, key=lambda o: o["dur"])
    s, e = en["ts"], en["ts"] + en["dur"]
    gpu_pid = {p for p, ad in surec.items() if "GPU" in ad}
    topla = {}
    for o in olaylar:
        if o.get("ph") != "X" or o.get("pid") not in gpu_pid or "dur" not in o:
            continue
        a, b = o["ts"], o["ts"] + o["dur"]
        ort = min(b, e) - max(a, s)
        if ort <= 0:
            continue
        k = (iplik.get((o["pid"], o["tid"]), str(o["tid"])), o.get("name", "?"))
        t = topla.setdefault(k, [0.0, 0])
        t[0] += ort / 1000
        t[1] += 1
    en_cok = sorted(topla.items(), key=lambda x: -x[1][0])[:25]
    desen = {"derleme/bağlama": re.compile(r"compile|link|hlsl|d3dcompile|translat", re.I),
             "doku": re.compile(r"tex(image|subimage|storage)|upload|copytexture|sharedimage", re.I)}
    ozet = {}
    for ad, d in desen.items():
        # iç içe olaylar iki kez sayılmasın: her iplikte yalnız en üst düzey eşleşenler (aynı adın kendi içinde iç içesi nadir)
        ozet[ad] = round(sum(v[0] for (ip, n), v in topla.items() if d.search(n) and ip == "CrGpuMain"), 1)
    return {"donma_ms": round(en["dur"] / 1000, 1), "gpu_surec_en_cok": [[ip, n, round(v[0], 1), v[1]] for (ip, n), v in en_cok],
            "gpu_ana_eslesen_ms": ozet}


def olc(p, url, isaret, profil, zaman_asimi, gorunur, iz_yolu):
    from playwright.sync_api import TimeoutError as PwZaman
    kurallar = "MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1, " + ", ".join("EXCLUDE " + h for h in SO.IZINLI)
    b = p.chromium.launch(channel="msedge", headless=not gorunur,
                          args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization", f"--host-resolver-rules={kurallar}"])
    sonuc = {"edge_surum": b.version, "gorunur": gorunur}
    try:
        ctx = b.new_context(locale="tr-TR", **SO.PROFILLER[profil])
        ctx.add_init_script(SO.INIT_JS.replace("__ISARET__", json.dumps(isaret)))
        ctx.add_init_script(GL_JS)
        pg = ctx.new_page()
        hatalar = []
        pg.on("pageerror", lambda e: hatalar.append(str(e)[:300]))
        pg.on("console", lambda m: hatalar.append(m.text[:300]) if m.type == "error" else None)
        if iz_yolu:
            b.start_tracing(page=pg, categories=["toplevel", "gpu", "gpu.angle", "gpu.service", "devtools.timeline", "v8.execute",
                                                 "disabled-by-default-gpu.service", "disabled-by-default-gpu.decoder"])
        t_bas = time.time()
        pg.goto(url, wait_until="commit", timeout=60000)
        try:
            pg.wait_for_function("() => 'hazir' in (window.__olc?.t || {})", timeout=zaman_asimi * 1000, polling=100)
            sonuc["zaman_asimi"] = False
        except PwZaman:
            sonuc["zaman_asimi"] = True
        # karakterin gelişi ve onun ilk karesi de kayda girsin (en çok 20 sn)
        try:
            pg.wait_for_function("() => 'karakter' in (window.__olc?.t || {})", timeout=20000, polling=200)
        except PwZaman:
            pass
        pg.wait_for_timeout(2500)
        pg.evaluate("() => window.__gl.durdur()")
        if iz_yolu:
            ham = b.stop_tracing()
            with gzip.open(iz_yolu, "wb") as f:
                f.write(ham)
            sonuc["iz"] = iz_ozet(ham)
            sonuc["iz"]["dosya"] = os.path.relpath(iz_yolu, KOK)
        temel = pg.evaluate(TEMEL_JS)
        programlar = pg.evaluate("() => window.__gl.programlar()")
        yuk_ms = pg.evaluate("() => window.__gl.kalibre()")
        cozunurluk = pg.evaluate("() => window.__gl.zaman_cozunurlugu()")
        sonuc.update({k: temel[k] for k in ("renderer", "gl_surum", "paralel_derleme", "capraz_yalitim", "render_sayisi", "pmrem_kanca",
                                            "renderer_kanca", "program_three", "info")})
        sonuc["olcum_yuku_cagri_us"] = round(yuk_ms * 1000, 3)
        sonuc["zaman_cozunurlugu_ms"] = round(cozunurluk, 4)
        t = temel["isaretler"]
        sonuc.update(kurulum_ms=t.get("kurulum"), hazir_ms=t.get("hazir"), karakter_ms=t.get("karakter"))
        uzun = temel["uzun"] or []
        ilk = temel["ilk_render"] or {}
        ib, is_ = temel["isinma_bas"], temel["isinma_son"]

        def pencereler(liste):
            return [pg.evaluate("([s, e]) => window.__gl.pencere(s, e)", [s, s + d]) for s, d in liste]

        # Donma: ilk renderer.render çağrısını içeren uzun görev (yoksa ilk kare 50 ms'nin altında)
        donma = [(s, d) for s, d in uzun if ilk.get("bas") is not None and s - 1 <= ilk["bas"] <= s + d + 1]
        sonuc["ilk_render_ms"] = round(ilk["bas"]) if ilk.get("bas") is not None else None
        sonuc["donma_ms"] = round(sum(d for _, d in donma), 1)
        sonuc["donma"] = kirilim(pencereler(donma), donma, yuk_ms) if donma else None
        if donma:
            s, d = donma[0]
            sonuc["donma"]["bas_ms"] = round(s)
            sonuc["donma"]["loaf"] = next((l for l in (temel["loaf"] or []) if l["bas"] - 2 <= s <= l["bas"] + l["sure"]), None)
        # Isınma (bayraklı yol): işaretler arasındaki uzun görevler (eşzamanlı kısım) + toplam süre
        if ib is not None and is_ is not None:
            isin = [(s, d) for s, d in uzun if s + d > ib and s < is_ + 1]
            sonuc["isinma"] = {"bas_ms": ib, "son_ms": is_, "sure_ms": is_ - ib, "kilit_ms": round(sum(d for _, d in isin), 1),
                               "uzun_gorev": [[round(s), round(d)] for s, d in isin],
                               "kirilim": kirilim(pencereler(isin), isin, yuk_ms) if isin else None,
                               "tum_pencere": pg.evaluate("([s, e]) => window.__gl.pencere(s, e)", [ib, is_])}
        # Kilit: kurulumun sonundan (bayraklı yolda ısınmanın başından) ilk karenin sonuna dek ana iş parçacığını kilitleyen süre
        kilit = sorted(set((sonuc.get("isinma") and [(s, d) for s, d in uzun if s + d > ib and s < is_ + 1] or []) + donma))
        sonuc["kilit_ms"] = round(sum(d for _, d in kilit), 1)
        sonuc["kilit"] = kirilim(pencereler(kilit), kilit, yuk_ms) if kilit else None
        # Karakterin gelişindeki ikinci donma: karakter işaretinden ve ilk kareden sonraki en uzun görev
        kar = t.get("karakter")
        if kar is not None:
            sonra = [(s, d) for s, d in uzun if s >= kar - 50 and (s, d) not in donma and s >= (ilk.get("bas") or 0)]
            if sonra:
                en = max(sonra, key=lambda x: x[1])
                sonuc["karakter_donma"] = kirilim(pencereler([en]), [en], yuk_ms)
                sonuc["karakter_donma"]["bas_ms"] = round(en[0])
        hz = sonuc["hazir_ms"] if sonuc["hazir_ms"] is not None else float("inf")
        once = [d for s, d in uzun if s < hz]
        sonuc["tbt_ms"] = round(sum(max(0, d - 50) for d in once))
        sonuc["uzun_gorevler"] = [[round(s), round(d)] for s, d in uzun]
        s0, e0 = (donma[0][0], donma[0][0] + donma[0][1]) if donma else ((ilk.get("bas") or 0) - 1, (ilk.get("bas") or 0) + 200)
        tablo = program_tablosu(programlar, s0, e0)
        sonuc["program_toplam"] = len(programlar)
        sonuc["program_donmada"] = sum(1 for x in tablo if x["donmada"])
        sonuc["program_en_pahali"] = tablo[:12]
        sonuc["program_toplam_maliyet_ms"] = round(sum(x["maliyet_ms"] for x in tablo), 1)
        sonuc["buyuk_doku_yukleme"] = sorted(temel["buyuk"], key=lambda x: -x["ms"])[:15]
        sonuc["evre_cagrilari"] = temel["faz_cagri"][:40]
        sonuc["loaf"] = temel["loaf"]
        sonuc["sayfa_hatalari"] = hatalar[:8]
        sonuc["sure_sn"] = round(time.time() - t_bas, 1)
    finally:
        b.close()
    return sonuc


OZET = ["kurulum_ms", "hazir_ms", "karakter_ms", "donma_ms", "kilit_ms", "tbt_ms", "program_toplam", "program_donmada"]


def ozetle(olcumler):
    out = {}
    for profil in sorted({o["profil"] for o in olcumler}):
        liste = [o for o in olcumler if o["profil"] == profil and not o.get("istisna")]
        d = {"tekrar": len(liste)}

        def ekle(ad, degerler):
            v = [x for x in degerler if isinstance(x, (int, float))]
            if v:
                d[ad] = {"ortanca": round(statistics.median(v), 1), "en_az": min(v), "en_cok": max(v),
                         "yayilim_yuzde": round((max(v) - min(v)) / statistics.median(v) * 100, 1) if statistics.median(v) else 0,
                         "degerler": v}
        for ad in OZET:
            ekle(ad, [o.get(ad) for o in liste])
        for kaynak in ("kilit", "donma", "karakter_donma"):
            for g, _, _ in GRUPLAR:
                ekle(f"{kaynak}.{g}", [(o.get(kaynak) or {}).get("gruplar", {}).get(g, 0 if o.get(kaynak) is None and kaynak != "karakter_donma" else None) for o in liste])
            ekle(f"{kaynak}.doku_mpiksel", [(o.get(kaynak) or {}).get("doku_mpiksel") for o in liste])
            for f in FAZ:
                ekle(f"{kaynak}.evre.{f}", [(o.get(kaynak) or {}).get("evre_sure", {}).get(f) for o in liste])
        ekle("ikinci_donma_ms", [ikinci_donma(o) for o in liste])
        ekle("isinma.sure_ms", [(o.get("isinma") or {}).get("sure_ms") for o in liste])
        ekle("isinma.kilit_ms", [(o.get("isinma") or {}).get("kilit_ms") for o in liste])
        d["renderer"] = sorted({o.get("renderer") or "?" for o in liste})
        d["paralel_derleme"] = sorted({str(o.get("paralel_derleme")) for o in liste})
        out[profil] = d
    return out


def tablo_yaz(ad, ozet):
    print(f"\n== {ad}")
    for profil, d in ozet.items():
        g = lambda k: f"{d[k]['ortanca']:g} [{d[k]['en_az']:g}–{d[k]['en_cok']:g}]" if k in d else "-"
        print(f"  {profil}: kurulum {g('kurulum_ms')} | hazır {g('hazir_ms')} | donma {g('donma_ms')} | kilit {g('kilit_ms')} | "
              f"ısınma {g('isinma.sure_ms')} (kilit {g('isinma.kilit_ms')}) | program {g('program_toplam')} | {d['renderer']}")
        print("     kilit kırılımı (ortanca ms): " + ", ".join(f"{gr} {d['kilit.' + gr]['ortanca']:g}" for gr, _, _ in GRUPLAR if 'kilit.' + gr in d))


# ---------------------------------------------------------------- grafik
def ikinci_donma(o):
    """İlk kareden ve karakter işaretinden sonraki en uzun görev (ms; karakterin ilk görünüşü), uzun görev listesinden."""
    kar, ilk = o.get("karakter_ms"), o.get("ilk_render_ms")
    if kar is None or ilk is None:
        return None
    son = (o.get("donma") or {}).get("bas_ms", ilk) + (o.get("donma_ms") or 0)
    aday = [d for s, d in o.get("uzun_gorevler", []) if s >= max(son, kar - 50)]
    return max(aday, default=0)


def _sayi(v, ondalik=0):
    """Türkçe sayı: binlik nokta, ondalık virgül."""
    s = f"{v:,.{ondalik}f}"
    return s.replace(",", "_").replace(".", ",").replace("_", ".")


def grafik(yollar, png):
    from PIL import Image, ImageDraw, ImageFont
    veriler = [json.load(open(y, encoding="utf-8")) for y in yollar]
    fontlar = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    kalin = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]

    def F(boy, k=False):
        for y in (kalin if k else fontlar):
            if os.path.exists(y):
                return ImageFont.truetype(y, boy)
        return ImageFont.load_default()

    def ad(D):
        return "Önce (bayraksız)" if not D.get("sorgu") else f"Sonra (?{D['sorgu']})"
    W, H = 1080, 2400
    im = Image.new("RGB", (W, H), (250, 248, 244))
    dr = ImageDraw.Draw(im)
    x0, x1 = 60, W - 60
    dr.text((x0, 36), "Oda açılışında donma", font=F(52, True), fill=(30, 30, 30))
    dr.text((x0, 104), "Ana iş parçacığının kilitli kaldığı süre, kurulumdan", font=F(30), fill=(80, 80, 80))
    dr.text((x0, 142), "ilk karenin sonuna dek (3 tekrarın ortancası)", font=F(30), fill=(80, 80, 80))
    profiller = [("telefon", "Telefon görünümü (390×844, DPR 2)"), ("masaustu", "Masaüstü (1440×900)")]
    en_buyuk = max([D["ozet"].get(p, {}).get("kilit_ms", {}).get("ortanca", 0) for p, _ in profiller for D in veriler] + [1])
    olcek = (x1 - x0 - 200) / en_buyuk
    y = 214
    for p, baslik in profiller:
        dr.text((x0, y), baslik, font=F(38, True), fill=(30, 30, 30))
        y += 62
        for D in veriler:
            o = D["ozet"].get(p, {})
            dr.text((x0, y), ad(D), font=F(32, True), fill=(60, 60, 60))
            y += 48
            x = x0
            for g, _, renk in GRUPLAR:
                v = o.get("kilit." + g, {}).get("ortanca", 0)
                w = v * olcek
                if w >= 1:
                    dr.rectangle([x, y, x + w, y + 72], fill=renk)
                    if w > 110:
                        dr.text((x + 12, y + 16), _sayi(v), font=F(32, True), fill=(255, 255, 255))
                x += w
            top = o.get("kilit_ms", {})
            dr.text((x + 14, y + 14), _sayi(top.get("ortanca", 0)) + " ms", font=F(36, True), fill=(30, 30, 30))
            y += 86
            hz = o.get("hazir_ms", {}).get("ortanca")
            satir = [f"sahne hazır {_sayi(hz / 1000, 1)} sn" if hz else None,
                     f"yayılım {_sayi(top.get('en_az', 0))}–{_sayi(top.get('en_cok', 0))} ms" if top else None]
            dr.text((x0, y), "  ·  ".join(s for s in satir if s), font=F(28), fill=(90, 90, 90))
            y += 40
            kd = [v for v in (ikinci_donma(x) for x in D["olcumler"] if x.get("profil") == p) if v is not None]
            if kd:
                dr.text((x0, y), f"karakter gelince ikinci donma {_sayi(statistics.median(kd))} ms", font=F(28), fill=(90, 90, 90))
                y += 40
            y += 18
        y += 26
    dr.text((x0, y), "Renkler", font=F(34, True), fill=(30, 30, 30))
    y += 54
    for i, (g, _, renk) in enumerate(GRUPLAR):
        cy = y + i * 50
        dr.rectangle([x0, cy + 6, x0 + 36, cy + 42], fill=renk)
        dr.text((x0 + 52, cy), g, font=F(32), fill=(40, 40, 40))
    y += len(GRUPLAR) * 50 + 24
    ren = (veriler[0]["ozet"].get("telefon", {}).get("renderer") or ["?"])[0]
    m = re.search(r"NVIDIA[^(]*?(RTX \d+|GTX \d+)", ren)
    notlar = [f"Görünmez Edge, gerçek GPU ({m.group(1) if m else ren[:30]}, ANGLE/D3D11).",
              "Telefon yalnız ekran boyu ve DPR taklidi: gerçek telefon",
              "işlemcisi ve GPU'su değil. Soğuk önbellek, ağ kısıtı yok."]
    for n in notlar:
        dr.text((x0, y), n, font=F(27), fill=(110, 110, 110))
        y += 38
    im = im.crop((0, 0, W, min(H, y + 30)))
    im.save(png)
    print("grafik:", png)


def main():
    ap = argparse.ArgumentParser(description="Oda açılış donması: kategori kırılımı ve önce→sonra.")
    ap.add_argument("sayfa", nargs="?", default="oda/index.html")
    ap.add_argument("--port", type=int, default=8093)
    ap.add_argument("--tekrar", type=int, default=3)
    ap.add_argument("--profil", default="telefon,masaustu")
    ap.add_argument("--varyant", action="append", help="AD[=SORGU], ör. once ya da isinma=isinma=1")
    ap.add_argument("--iz", action="store_true", help="varyant/profil başına ek bir CDP izli koşu")
    ap.add_argument("--gorunur", action="store_true", help="Edge'i görünür pencereyle aç (GPU denetimi için)")
    ap.add_argument("--zaman-asimi", type=int, default=120)
    ap.add_argument("--grafik", nargs="+", metavar="JSON", help="önce.json sonra.json [başka.json ...]")
    ap.add_argument("--png")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.grafik:
        png = a.png
        if not png:
            taban = os.path.join(CIKIS, "donma-kirilim-" + datetime.date.today().strftime("%Y%m%d"))
            png, n = taban + ".png", 2
            while os.path.exists(png):
                png, n = f"{taban}-{n}.png", n + 1
        elif os.path.exists(png):
            sys.exit(f"var, üstüne yazılmaz: {png}")
        return grafik(a.grafik, png)
    varyantlar = []
    for v in a.varyant or ["once"]:
        ad, _, sorgu = v.partition("=")
        varyantlar.append((ad, sorgu))
    profiller = [x.strip() for x in a.profil.split(",") if x.strip()]
    for x in profiller:
        if x not in SO.PROFILLER:
            ap.error(f"bilinmeyen profil: {x}")
    damga = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    taban = f"http://127.0.0.1:{a.port}/"
    isaret = SO.isaret_sec(a.sayfa)

    def adres(sorgu):
        u = taban + a.sayfa.lstrip("/")
        return u + (("&" if "?" in u else "?") + sorgu if sorgu else "")
    plan = [(r, v, pr) for r in range(1, a.tekrar + 1) for v in varyantlar for pr in profiller]
    iz_plan = [(v, pr) for v in varyantlar for pr in profiller] if a.iz else []
    if a.dry_run:
        for r, (ad, sorgu), pr in plan:
            print(f"tekrar {r}: {adres(sorgu)}  [{pr}]  varyant {ad}")
        for (ad, sorgu), pr in iz_plan:
            print(f"iz: {adres(sorgu)}  [{pr}]")
        for ad, _ in varyantlar:
            print("yazılacak:", os.path.join(CIKIS, f"donma-{ad}-{damga}.json"))
        return
    try:
        urllib.request.urlopen(taban, timeout=5).read(1)
    except Exception as e:
        sys.exit(f"sunucu yanıt vermiyor ({taban}): {e}. Önce: python scripts/serve.py {a.port}")
    os.makedirs(CIKIS, exist_ok=True)
    from playwright.sync_api import sync_playwright
    ortam = {"diger_gorunmez_edge_bas": SO.diger_edge(), "git": SO.git_bilgi(), "cpu_mantiksal": os.cpu_count()}
    olcumler = {ad: [] for ad, _ in varyantlar}
    izler = {ad: [] for ad, _ in varyantlar}
    t0 = time.time()
    with sync_playwright() as p:
        for i, (r, (ad, sorgu), pr) in enumerate(plan, 1):
            try:
                o = olc(p, adres(sorgu), isaret, pr, a.zaman_asimi, a.gorunur, None)
            except Exception as e:
                o = {"istisna": str(e).splitlines()[0][:300]}
            o.update(varyant=ad, profil=pr, tekrar=r, adres=adres(sorgu))
            olcumler[ad].append(o)
            k = o.get("kilit") or {}
            print(f"[{i}/{len(plan)}] {ad} {pr} #{r}: kurulum {o.get('kurulum_ms')} hazır {o.get('hazir_ms')} donma {o.get('donma_ms')} "
                  f"kilit {o.get('kilit_ms')} ms | " + ", ".join(f"{g} {v:g}" for g, v in (k.get('gruplar') or {}).items()) +
                  f" | program {o.get('program_toplam')} | {(o.get('renderer') or '?')[:60]}" +
                  (f"  İSTİSNA: {o['istisna']}" if "istisna" in o else ""), flush=True)
        for (ad, sorgu), pr in iz_plan:
            yol = os.path.join(CIKIS, f"donma-{ad}-{damga}-iz-{pr}.json.gz")
            try:
                o = olc(p, adres(sorgu), isaret, pr, a.zaman_asimi, a.gorunur, yol)
            except Exception as e:
                o = {"istisna": str(e).splitlines()[0][:300]}
            o.update(varyant=ad, profil=pr, adres=adres(sorgu))
            izler[ad].append(o)
            print(f"[iz] {ad} {pr}: donma {o.get('donma_ms')} ms; GPU süreci: {(o.get('iz') or {}).get('gpu_ana_eslesen_ms')}", flush=True)
    ortam["diger_gorunmez_edge_son"] = SO.diger_edge()
    for ad, sorgu in varyantlar:
        liste = olcumler[ad]
        ortam["edge_surum"] = next((o.get("edge_surum") for o in liste if o.get("edge_surum")), None)
        sonuc = {"etiket": ad, "sorgu": sorgu, "zaman": damga, "betik": "scripts/donma-olc.py", "sure_sn": round(time.time() - t0),
                 "ayar": {"sayfa": a.sayfa, "port": a.port, "tekrar": a.tekrar, "profiller": {k: SO.PROFILLER[k] for k in profiller},
                          "izinli_dis": SO.IZINLI, "isaret": isaret, "varyantlar": varyantlar, "gorunur": a.gorunur},
                 "ortam": ortam,
                 "notlar": [
                     "Süreler gezinme başlangıcından (performance.timeOrigin) ms.",
                     "donma: ilk renderer.render çağrısını içeren uzun görev. kilit: kurulumun sonundan (bayraklı yolda ısınmanın "
                     "başından) ilk karenin sonuna dek ana iş parçacığını kilitleyen uzun görevlerin toplamı.",
                     "kırılım: o uzun görevlerdeki GL çağrı süreleri kategoriye göre; kalan JS (three.js + sayfa); ölçüm yükü = GL çağrı "
                     "sayısı × kalibre edilmiş sarmalayıcı maliyeti.",
                     "GL çağrıları GPU sürecine kuyruklanır; bekleme, ana iş parçacığının beklediği çağrıya yazılır (çoğunlukla "
                     "program_sorgu: getProgramInfoLog). İzli koşular (izler) bunu GPU süreci tarafından doğrular.",
                     "Soğuk önbellek, yeni Edge profili (gölgelendirici disk önbelleği boş): ilk ziyaret. Ağ ve işlemci kısıtı yok.",
                 ],
                 "ozet": ozetle(liste), "olcumler": liste, "izler": izler[ad]}
        yol = os.path.join(CIKIS, f"donma-{ad}-{damga}.json")
        with open(yol, "w", encoding="utf-8") as f:
            json.dump(sonuc, f, ensure_ascii=False, indent=1)
        tablo_yaz(ad, sonuc["ozet"])
        print(f"yazıldı: {yol}")
    print(f"({round(time.time() - t0)} sn)")


if __name__ == "__main__":
    main()
