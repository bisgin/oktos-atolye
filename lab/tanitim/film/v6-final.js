// Vinyet 6, FİNAL (#21–#26, k1632–2303). Kalıp: v1-kanca.js (kur(ctx), MUTLAK kare zamanları, katman kendi penceresinde).
// #21 2×2 çizgi roman ızgarası: A (zar), B ("?" + çekmece), C (kesik silüet), D (saksı); çerçeveler 4 k arayla DrawSVG.
//     k1680'de her şey bir vuruş durur (24 k: kaynama donar, kamera sabit); k1704 Oktos sesi "Bunlar için".
// #22 GERÇEK 3: nozul her vuruşta bir panelden geçer (24 k KM; FDM alttan, reçine üstten):
//     k1728 B organizer basılır, vidalar ve geç kalan vida bölmelere zıplar (2 k arayla, 10 k BO yay); k1752 C figür reçineden
//     doğar; k1776 A zarlar balondan avucuna düşer; k1800 D saksı masaya iner (oturma 12 k, %3 aşma). "Oktos var." (300→900).
// #23 kahraman kare: paneller katlanır, dört gerçek nesne tek kâğıt masada (gölgeler), dört karakter kenarlardan eğilir.
// #24 nozul tek çizgiyle dört nesneyi sarar (40 k KM), çizgi Oktos logosuna döner (MorphSVG), logo köşeye, sona dek orada.
// #25 kamera yukarı bakar: dilek balonları, nesneler, kalabalığın balonları yükselir (60 k KM, 4 k arayla, paralaks 1/0,6/0,25);
//     kâğıt göğe açılır (maske 40 k), konturlar geri sarılır (24 k). Yazılar k2016 ve k2112.
// #26 gök karesi + "canlı çatı sahnesi" yer tutucusu + CTA (sosyal).
// Animatik: gerçek nesneler renkli yer tutucu + tek kelimelik GERÇEK etiketi (kahraman karede tek ortak etiket).
// C'nin figürü ctx.FIGUR (yarı saydam reçine), D'nin saksısı ctx.SAKSI (v5'te seçilen mermer epoksi, damarlı).
// Kol/el: kalın yuvarlak uçlu çizgi (ctx.cizgi) yer tutucu.

// Doodle zarlar (zar.js'ten; birim boy, merkez 0,0)
const ALTIGEN = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26], [0, -0.52]];
const ZAR = {
  d4: { dis: [[-0.5, 0.42], [0, -0.5], [0.5, 0.42], [-0.5, 0.42]], ic: [[[0, -0.5], [0.06, 0.12]], [[-0.5, 0.42], [0.06, 0.12], [0.5, 0.42]]] },
  d6: { dis: ALTIGEN, ic: [[[-0.46, -0.26], [0, -0.01], [0.46, -0.26]], [[0, -0.01], [0, 0.52]]] },
  d8: { dis: [[0, -0.54], [0.43, 0], [0, 0.54], [-0.43, 0], [0, -0.54]], ic: [[[-0.43, 0], [0.1, 0.06], [0.43, 0]], [[0, -0.54], [0.1, 0.06], [0, 0.54]]] },
  d10: { dis: [[0, -0.54], [0.45, -0.06], [0.37, 0.24], [0, 0.5], [-0.37, 0.24], [-0.45, -0.06], [0, -0.54]], ic: [[[-0.45, -0.06], [-0.16, 0.12], [0, 0.5]], [[0.45, -0.06], [0.16, 0.12], [0, 0.5]], [[-0.16, 0.12], [0, -0.54], [0.16, 0.12]], [[-0.16, 0.12], [0.16, 0.12]]] },
  d12: { dis: [[-0.18, -0.5], [0.18, -0.5], [0.44, -0.3], [0.52, 0.04], [0.36, 0.38], [0.04, 0.52], [-0.3, 0.44], [-0.5, 0.16], [-0.48, -0.2], [-0.18, -0.5]], ic: [[[0, -0.22], [0.22, -0.06], [0.14, 0.2], [-0.14, 0.2], [-0.22, -0.06], [0, -0.22]], [[0, -0.22], [0, -0.5]], [[0.22, -0.06], [0.5, -0.12]], [[0.14, 0.2], [0.3, 0.42]], [[-0.14, 0.2], [-0.3, 0.42]], [[-0.22, -0.06], [-0.5, -0.12]]] },
  d20: { dis: ALTIGEN, ic: [[[-0.27, 0.16], [0, -0.3], [0.27, 0.16], [-0.27, 0.16]], [[0, -0.52], [-0.27, 0.16]], [[0, -0.52], [0.27, 0.16]], [[-0.46, -0.26], [-0.27, 0.16]], [[0.46, -0.26], [0.27, 0.16]], [[0, 0.52], [-0.27, 0.16]], [[0, 0.52], [0.27, 0.16]]] },
};
const SIRA = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const ZAR_RENK = ['#e8a33d', '#2fa59a', '#7f5bd6', '#e0607e', '#3f7fd6', '#d4621f'];
const ZAR_YER = [[-62, -28], [-8, -30], [46, -28], [-36, -78], [18, -80], [70, -76]]; // küme, taban 0,0
const ZAR_BOY = 50;
// Gerçek nesne yer tutucu renkleri (tam renk yalnız gerçekte)
// Figür: yarı saydam reçine (gövde ve kaide saydam, kulaklık koyu ve dolu)
const RENK = { organizer: '#3f7fd6', figur: '#c2577a', figurKoyu: '#8e3557' };
const FIGUR_BOY = 165; // ctx.FIGUR birim şekli bu boyla (taban 0,0)
// Organizer (kuş bakışı, 200×170, taban ortası 0,0): 3×2 bölme merkezleri
const BOLME = [[-66, -127], [0, -127], [66, -127], [-66, -42], [0, -42], [66, -42]];
// Saksı profili (taban 0,0, boy 150)
const SAKSI_P = [[-44, 0], [-52, -30], [-40, -82], [-48, -128], [-58, -150], [58, -150], [48, -128], [40, -82], [52, -30], [44, 0]];
const SIFIR = { sap: () => 0 };
// Oktos logosu (core/logo-beyaz.svg; dolgu mürekkep rengine çevrilir)
const LOGO = {
  en: 674, boy: 531.75,
  d: 'M337,40 L194.5,182.5 L279.25,267.25 L242,304.5 L157,304.5 L157,240 L198.5,281.5 L198.5,212.5 L118,212.5 L118,343 L203.5,343 L115,431.5 L73,431.5 L73,377 L108.5,412.5 L108.5,358 L40,358 L40,472 L137.5,472 L177.75,431.75 L237.75,491.75 L321.25,408.25 L276.25,363.25 L239,400.5 L275.5,400.5 L242,434 L208.75,400.75 L277.75,331.75 L337,391 L396.25,331.75 L465.25,400.75 L432,434 L398.5,400.5 L435,400.5 L397.75,363.25 L352.75,408.25 L436.25,491.75 L496.25,431.75 L536.5,472 L634,472 L634,358 L565.5,358 L565.5,412.5 L601,377 L601,431.5 L559,431.5 L470.5,343 L556,343 L556,212.5 L475.5,212.5 L475.5,281.5 L517,240 L517,304.5 L432,304.5 L394.75,267.25 L479.5,182.5 Z M393.5,182.5 L337,239 L280.5,182.5 L337,126 Z M337,157 L311.5,182.5 L337,208 L362.5,182.5 Z M376,303.5 L337,342.5 L298,303.5 L337,264.5 Z',
};
const logoYolu = (cx, cy, en) => {
  const s = en / LOGO.en;
  return LOGO.d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => `${(cx + (x - LOGO.en / 2) * s).toFixed(1)},${(cy + (y - LOGO.boy / 2) * s).toFixed(1)}`);
};
// Çokgen kenarlarını eşit aralıklı noktalara böler (Catmull-Rom uzun kenarda şişip köşede ilmek atmasın diye)
const cokgen = (koseler, adim = 32) => {
  const p = [];
  koseler.forEach((a, i) => {
    const b = koseler[(i + 1) % koseler.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / adim));
    for (let j = 0; j < n; j++) p.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
  });
  return p;
};
const dortgen = (x0, y0, x1, y1) => cokgen([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], Math.min(32, Math.max(5, Math.min(x1 - x0, y1 - y0) / 3)));
// Tümsekli bulut noktaları (çukur / tepe dönüşümlü)
const bulutNok = (cx, cy, rx, ry, n = 9) => {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, f = i % 2 ? 1.1 : 0.93;
    p.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
  }
  return p;
};

export function kur(ctx) {
  const { k, E, tl, gsap, el, W, H, DIKEY, DIL, PALET, MONO, VURGU, GRI, GRI2, KAGIT, BALON, odak, yazi, metin, yer, adim, vurus } = ctx;
  const M = PALET.murekkep, yat = !DIKEY, EN = DIL === 'en';
  const K0 = 1632;
  vurus(21, 'Izgara: dört istek', 1632, 1727);
  vurus(22, 'GERÇEK 3: nozul paneller', 1728, 1823);
  vurus(23, 'Kahraman kare', 1824, 1919);
  vurus(24, 'Nozul sarar → logo', 1920, 2015);
  vurus(25, 'Gökyüzüne açılış', 2016, 2207);
  vurus(26, 'Site: canlı çatı', 2208, 2303);

  const L = ctx.katman('v6', 60);
  gsap.set(L.div, { autoAlpha: 0 }); // ilk boyanan karede de gizli
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(K0));
  const svg = L.svg, defs = el(svg, 'defs');
  const KL = DIKEY ? 5 : 6, KI = DIKEY ? 3 : 3.6; // ana kontur, iç detay

  // Kaynayan her şey bu listede (k1680'deki 24 k'lık durak için)
  const kaynar = [];
  const C = (ust, pts, o = {}) => { const h = ctx.cizgi(ust, pts, o); kaynar.push(h); return h; };
  const dondur = (d) => { for (const h of kaynar) h.donuk = d; if (!d) for (const h of kaynar) h.ciz(); };
  const gorun = (hedef, k0, k1) => { gsap.set(hedef, { autoAlpha: 0 }); tl.set(hedef, { autoAlpha: 0 }, 0); if (k0 != null) tl.set(hedef, { autoAlpha: 1 }, k(k0)); if (k1 != null) tl.set(hedef, { autoAlpha: 0 }, k(k1)); };
  const daire = (cx, cy, r, n = 12) => ctx.oval(cx, cy, r, r, 0, 360, n, 2);

  // ---------- Katman düzeni (alttan üste): gök, kâğıt maskesi, zemin (paneller, masa, karakterler), yükselenler, nozul, logo
  const gok = el(svg, 'g');
  const kagitG = el(svg, 'g');
  const zemin = el(svg, 'g');
  const paneller = el(zemin, 'g'), masaG = el(zemin, 'g'), golgeler = el(zemin, 'g'), kahramanlar = el(zemin, 'g');
  const yuk = el(svg, 'g');
  const kalabalik = el(yuk, 'g'), nesneler = el(yuk, 'g'), dilekler = el(yuk, 'g');
  const leke = el(svg, 'path', { fill: 'none', stroke: GRI2, 'stroke-width': DIKEY ? 20 : 26, 'stroke-linecap': 'round', opacity: 0.5 });
  const nozulG = el(svg, 'g');
  const logoG = el(svg, 'g');
  const sonG = el(svg, 'g');
  gorun(leke);

  // Gök (yer tutucu: açık mavi-gri, #d5d8dc pusuna iner) ve kâğıt maskesi (üst kenarı gök pusuna erir)
  const gg = el(defs, 'linearGradient', { id: 'v6-gok', x1: 0, y1: 0, x2: 0, y2: 1 });
  [['0', '#b9c7d4'], ['0.55', '#cad2da'], ['1', '#d5d8dc']].forEach(([o, c]) => el(gg, 'stop', { offset: o, 'stop-color': c }));
  const gokRect = el(gok, 'rect', { x: -60, y: -60, width: W + 120, height: H + 120, fill: 'url(#v6-gok)' });
  const kg = el(defs, 'linearGradient', { id: 'v6-kagit', x1: 0, y1: 0, x2: 0, y2: 1 });
  el(kg, 'stop', { offset: '0', 'stop-color': '#d5d8dc', 'stop-opacity': 0 });
  el(kg, 'stop', { offset: '1', 'stop-color': KAGIT, 'stop-opacity': 1 });
  el(kagitG, 'rect', { x: -60, y: -240, width: W + 120, height: 240, fill: 'url(#v6-kagit)' });
  el(kagitG, 'rect', { x: -60, y: -1, width: W + 120, height: H * 2, fill: KAGIT });

  // ---------- Nozul (v1 ile aynı çizim; uç 0,0)
  const nozulIc = el(nozulG, 'g', { transform: `scale(${DIKEY ? 0.8 : 1})` });
  C(nozulIc, dortgen(-34, -72, 34, -32, 4), { kapali: true, dolgu: GRI, tohum: 811, kalinlik: 4.5 });
  C(nozulIc, cokgen([[-20, -32], [20, -32], [6, -4], [-6, -4]], 8), { kapali: true, dolgu: GRI2, tohum: 812, kalinlik: 4.5 });
  C(nozulIc, [[0, -72], [0, -170]], { tohum: 813, kalinlik: 3 });
  const nozulKoy = (x, y) => nozulG.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  gorun(nozulG);

  // ---------- Kamera: k1632 düz; 48 k %0,8 itiş, durakta sabit, sonra %2'ye; #23'te %2 daha; #24'te geri
  const kam = (s) => odak(W / 2, H / 2, s);
  ctx.kameraKoy(K0, kam(1));
  tl.fromTo(ctx.kamera, kam(1), { ...kam(1.008), duration: k(48), ease: 'none', immediateRender: false }, k(K0));
  tl.fromTo(ctx.kamera, kam(1.008), { ...kam(1.02), duration: k(120), ease: 'none', immediateRender: false }, k(1704));
  tl.fromTo(ctx.kamera, kam(1.02), { ...kam(1.04), duration: k(96), ease: E.KM, immediateRender: false }, k(1824));
  tl.to(ctx.kamera, { ...kam(1), duration: k(60), ease: E.KM }, k(1920));
  ctx.kameraKoy(2016, kam(1));

  // ---------- Doodle çiziciler (yerel koordinat; taban ortası 0,0). dolgu verilirse "gerçek" renkli yer tutucu
  const zarSekil = (ust, i, { dolgu = null, boy = ZAR_BOY, tohum = 0, kal = KI } = {}) => {
    const z = ZAR[SIRA[i]], sc = (pts) => pts.map(([x, y]) => [x * boy, y * boy]);
    const hs = [C(ust, sc(z.dis), { dolgu, kalinlik: kal + 1, tohum: tohum + 1, genlik: 0.9 })];
    z.ic.forEach((pts, j) => hs.push(C(ust, sc(pts), { kalinlik: kal * 0.7, tohum: tohum + 2 + j, genlik: 0.7 })));
    return hs;
  };
  const orgSekil = (ust, { dolgu = null, tohum = 0 } = {}) => [
    C(ust, dortgen(-100, -170, 100, 0, 10), { kapali: true, dolgu, kalinlik: KL, tohum }),
    C(ust, [[-33, -162], [-33, -8]], { kalinlik: KI, tohum: tohum + 1 }),
    C(ust, [[33, -162], [33, -8]], { kalinlik: KI, tohum: tohum + 2 }),
    C(ust, [[-92, -85], [92, -85]], { kalinlik: KI, tohum: tohum + 3 }),
  ];
  // C'nin figürü: ortak ctx.FIGUR (v4 ve v5 ile aynı silüet). Parçalar: 0 kaide, 1 gövde, 2-3 kollar, 4 baş, 5 bant, 6-7 kulaklık.
  // renkli: yarı saydam reçine dolgu + iki parlama çizgisi; kesik: vurgu renginde kesik çizgi (istek işareti, v4'teki gibi)
  const figurSekil = (ust, { renkli = false, tohum = 0, kesik = false } = {}) => {
    const hs = ctx.FIGUR.map((s, j) => {
      const pts = s.p.map(([x, y]) => [x * FIGUR_BOY, y * FIGUR_BOY]), kulak = j >= 6, ana = j === 1 || j === 4;
      const dolgu = renkli && s.kapali ? (kulak ? RENK.figurKoyu : RENK.figur) : null;
      const h = C(ust, pts, { kapali: !!s.kapali, dolgu, renk: kesik ? VURGU : M, kalinlik: ana || j === 0 ? KL - 1 : KI, tohum: tohum + j });
      if (h.dolgu) h.dolgu.setAttribute('fill-opacity', kulak ? 0.92 : j === 0 ? 0.45 : 0.62);
      if (kesik) h.yol.setAttribute('stroke-dasharray', '14 11');
      return h;
    });
    if (renkli) {
      const B = FIGUR_BOY;
      hs.push(C(ust, [[-0.13 * B, -0.8 * B], [-0.16 * B, -0.72 * B], [-0.14 * B, -0.64 * B]], { renk: '#ffffff', kalinlik: 5, tohum: tohum + 9, genlik: 0.6 }));
      hs.push(C(ust, [[-0.2 * B, -0.42 * B], [-0.22 * B, -0.3 * B], [-0.2 * B, -0.2 * B]], { renk: '#ffffff', kalinlik: 4, tohum: tohum + 10, genlik: 0.6 }));
      for (const h of hs.slice(-2)) h.yol.setAttribute('opacity', 0.7);
    }
    return hs;
  };
  // D'nin saksısı: renkli ise ctx.SAKSI (mermer epoksi): taban, damarlar (dolguyla aynı 3 px kaymada, saksı biçimine kırpılı), ağız
  const SK = ctx.SAKSI;
  const damarlar = (ust, tohum) => {
    const id = `v6-damar-${tohum}`;
    el(el(defs, 'clipPath', { id }), 'path', { d: ctx.yol(SAKSI_P, true, SIFIR) });
    const g = el(ust, 'g', { transform: 'translate(3 3)', 'clip-path': `url(#${id})` });
    const r = ctx.rng(tohum);
    for (let i = 0; i < 3; i++) el(g, 'ellipse', { cx: (-40 + r() * 80).toFixed(1), cy: (-130 + r() * 116).toFixed(1), rx: (14 + r() * 16).toFixed(1), ry: (8 + r() * 10).toFixed(1), fill: '#d9d3c9', opacity: 0.6 });
    for (let i = 0; i < 6; i++) {
      let x = -60 + r() * 120, y = -162;
      const egim = (0.25 + r() * 0.4) * (r() < 0.5 ? -1 : 1), pts = [];
      while (y < 12) { pts.push([x, y]); y += 9 + r() * 9; x += egim * 10 + (r() - 0.5) * 12; }
      const altin = i === 2;
      el(g, 'path', { d: ctx.yol(pts, false, SIFIR), fill: 'none', stroke: altin ? SK.altinDamar : SK.damar, 'stroke-width': altin ? 2.2 : (0.9 + r() * 1.8).toFixed(2), opacity: altin ? 0.9 : 0.7, 'stroke-linecap': 'round' });
    }
    return g;
  };
  const saksiSekil = (ust, { renkli = false, tohum = 0 } = {}) => {
    const govde = C(ust, SAKSI_P, { kapali: true, dolgu: renkli ? SK.taban : null, kalinlik: KL - 1, tohum });
    if (renkli) govde.g.insertBefore(damarlar(ust, tohum + 50), govde.yol); // damar konturun altında
    return [
      govde,
      C(ust, ctx.oval(0, -150, 58, 9, 0, 360, 14, 2), { kapali: true, dolgu: renkli ? SK.agiz : null, kalinlik: KI, tohum: tohum + 1 }),
      C(ust, [[-46, -136], [46, -136]], { kalinlik: KI * 0.8, tohum: tohum + 2 }),
    ];
  };
  const vidaSekil = (ust, tohum) => [
    C(ust, dortgen(-12, -3.5, 15, 3.5, 2), { kapali: true, dolgu: GRI2, kalinlik: 2.4, tohum, genlik: 0.5 }),
    C(ust, ctx.oval(-14, 0, 5.5, 7, 0, 360, 8, 2), { kapali: true, dolgu: GRI, kalinlik: 2.4, tohum: tohum + 1, genlik: 0.5 }),
  ];
  const soruSekil = (ust, cx, cy, s, tohum) => [
    C(ust, [[-16, -30], [-11, -44], [4, -48], [16, -38], [14, -22], [2, -12], [0, 4]].map(([x, y]) => [cx + x * s, cy + y * s]), { kalinlik: 7 * s, renk: VURGU, tohum }),
    C(ust, daire(cx, cy + 20 * s, 4 * s, 8), { kapali: true, dolgu: VURGU, renk: VURGU, kalinlik: 4 * s, tohum: tohum + 1 }),
  ];

  // ---------- Nesne: g (yerleşim, svgOrigin 0 0) > govde (iniş/basılma) > [gercek (kırpılır, renkli), ust (mürekkep doodle)]
  const nesneKur = (ad, x, y, s) => {
    const g = el(nesneler, 'g');
    gsap.set(g, { svgOrigin: '0 0', x, y, scale: s });
    const govde = el(g, 'g');
    gsap.set(govde, { svgOrigin: '0 0', x: 0, y: 0, scale: 1 });
    const cp = el(defs, 'clipPath', { id: `v6-kirp-${ad}` });
    const kr = el(cp, 'rect', { x: -3000, y: 0, width: 6000, height: 0 });
    const gercek = el(govde, 'g', { 'clip-path': `url(#v6-kirp-${ad})` });
    const ust = el(govde, 'g');
    const ek = el(g, 'g');
    return { ad, g, govde, gercek, ust, ek, kr, cizgiler: [] };
  };
  // Nesnenin yerel noktasının sahnedeki yeri (o anki tween değerleriyle)
  const P_ = (e, p) => gsap.getProperty(e, p);
  const dunya = (o, lx, ly) => {
    const gs = P_(o.g, 'scaleX');
    return [P_(o.g, 'x') + gs * (P_(o.govde, 'x') + P_(o.govde, 'scaleX') * lx), P_(o.g, 'y') + gs * (P_(o.govde, 'y') + P_(o.govde, 'scaleY') * ly)];
  };
  const kirpTam = (o, kk) => tl.set(o.kr, { attr: { y: -3000, height: 6000 } }, k(kk));
  // GERÇEK etiketi (tek kelime; ekranda en çok 7 kelime): kâğıt renkli zemin üstünde (çizgilerin üstünde okunsun)
  const GERCEK = EN ? 'REAL' : 'GERÇEK';
  const etiket = (ust, x, y) => {
    const e = ctx.gercekEtiket(ust, GERCEK, x, y), t = e.firstChild;
    t.setAttribute('text-anchor', 'middle');
    const bb = t.getBBox(), z = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    for (const [a, v] of Object.entries({ x: bb.x - 8, y: bb.y - 3, width: bb.width + 16, height: bb.height + 6, rx: 6, fill: KAGIT, opacity: 0.92 })) z.setAttribute(a, v);
    e.insertBefore(z, t);
    gorun(e);
    return e;
  };
  // Panel etiketi: süpürme bitince belirir, k1'de (varsayılan: paneller katlanırken, k1824) 6 k'da söner.
  // Ekranda aynı anda en çok iki etiket: başlık EN'de 5 kelime ("That's what Oktos is for."), 5 + 2 = 7
  const etiketKoy = (o, y, kk, k1 = 1824) => {
    const e = etiket(o.g, 0, y);
    tl.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(6), immediateRender: false }, k(kk));
    tl.to(e, { autoAlpha: 0, duration: k(6), ease: 'none' }, k(k1));
  };

  // ---------- #21 Paneller (2×2): A sol üst, B sağ üst, C sol alt, D sağ alt
  const PW = DIKEY ? { x0: 36, y0: 490, w: 494, h: 510, g: 20 } : { x0: 48, y0: 186, w: 900, h: 413, g: 24 };
  const PN = ['A', 'B', 'C', 'D'].map((ad, i) => {
    const p = { ad, i, x: PW.x0 + (i % 2) * (PW.w + PW.g), y: PW.y0 + Math.floor(i / 2) * (PW.h + PW.g), w: PW.w, h: PW.h, t0: K0 + i * 4, cizgiler: [] };
    p.g = el(paneller, 'g');
    const cp = el(defs, 'clipPath', { id: `v6-panel-${ad}` });
    el(cp, 'rect', { x: p.x, y: p.y, width: p.w, height: p.h });
    p.ic = el(p.g, 'g', { 'clip-path': `url(#v6-panel-${ad})` });
    el(p.ic, 'rect', { x: p.x, y: p.y, width: p.w, height: p.h, fill: '#f7f4ee' });
    p.arka = el(p.ic, 'g');
    p.kY = DIKEY ? { x: p.x + 140, alt: p.y + p.h + 10, olcek: 0.78 } : { x: p.x + 230, alt: p.y + p.h + 10, olcek: 0.92 };
    p.kisi = ctx.kisi(p.ic, ctx.kisiParam(ad), p.kY); kaynar.push(p.kisi);
    p.on = el(p.ic, 'g');
    p.cerceve = C(p.g, dortgen(p.x, p.y, p.x + p.w, p.y + p.h, 8), { kapali: true, kalinlik: KL, tohum: 600 + i });
    return p;
  });
  const [pA, pB, pC, pD] = PN;
  const Cp = (p, ust, pts, o) => { const h = C(ust, pts, o); p.cizgiler.push(h.yol); return h; };
  // Baştan balona düşünce noktaları + bulut
  const balonCiz = (p, bc, br, tohum) => {
    const ol = p.kY.olcek, ey = p.kY.alt - 440 * ol + 178 * ol;
    const S = [p.kY.x + 70 * ol, ey - 70 * ol], dx = S[0] - bc[0], dy = S[1] - bc[1], f = 1 / Math.hypot(dx / br[0], dy / br[1]);
    const B = [bc[0] + dx * f, bc[1] + dy * f];
    [[0.16, 7], [0.46, 10], [0.76, 14]].forEach(([t, r], j) => Cp(p, p.arka, daire(S[0] + (B[0] - S[0]) * t, S[1] + (B[1] - S[1]) * t, r * (DIKEY ? 0.8 : 1), 10), { kapali: true, dolgu: BALON, kalinlik: KI, tohum: tohum + j }));
    Cp(p, p.arka, bulutNok(bc[0], bc[1], br[0], br[1], 10), { kapali: true, dolgu: BALON, kalinlik: KL - 1, tohum: tohum + 5, genlik: 1.6 });
  };
  const kutu = (p, x, w, h, tabanY, tohum, ton) => {
    Cp(p, p.arka, dortgen(x, tabanY - h, x + w, tabanY, 4), { kapali: true, dolgu: ton, kalinlik: KI, tohum });
    Cp(p, p.arka, dortgen(x + w * 0.2, tabanY - h * 0.62, x + w * 0.8, tabanY - h * 0.36, 3), { kapali: true, dolgu: '#f4f1ea', kalinlik: KI * 0.7, tohum: tohum + 1 }); // logosuz boş etiket
  };
  const NES = {};

  // A: balonda zar seti; k1776'da avucuna düşer (el: kalın çizgi yer tutucu)
  {
    const s = yat ? 0.9 : 0.72;
    const taban = yat ? [pA.x + 430, pA.y + pA.h - 52] : [pA.x + 330, pA.y + pA.h - 48];
    const bc = yat ? [pA.x + 650, pA.y + 150] : [pA.x + 320, pA.y + 118], br = yat ? [200, 104] : [150, 90];
    balonCiz(pA, bc, br, 620);
    const o = nesneKur('A', taban[0], taban[1], s);
    o.O = [(bc[0] - taban[0]) / s - 4, (bc[1] - taban[1]) / s + 54];
    o.zarlar = SIRA.map((_, i) => {
      const g = el(o.gercek, 'g');
      gsap.set(g, { svgOrigin: '0 0', x: ZAR_YER[i][0] + o.O[0], y: ZAR_YER[i][1] + o.O[1], rotation: 0 });
      zarSekil(g, i, { dolgu: ZAR_RENK[i], tohum: 900 + i * 10 });
      return g;
    });
    const ug = el(o.ust, 'g', { transform: `translate(${o.O[0].toFixed(1)} ${o.O[1].toFixed(1)})` });
    SIRA.forEach((_, i) => zarSekil(el(ug, 'g', { transform: `translate(${ZAR_YER[i][0]} ${ZAR_YER[i][1]})` }), i, { tohum: 900 + i * 10 }).forEach((h) => pA.cizgiler.push(h.yol)));
    // El: ön kol iki kalın çizgi (mürekkep + ten), avuç kapalı şekil
    o.el = el(pA.on, 'g');
    const ten = MONO.ten[ctx.KISI.A.ten];
    const kol = yat ? [[pA.x + 560, pA.y + pA.h + 40], [pA.x + 470, pA.y + pA.h - 34]] : [[pA.x + 430, pA.y + pA.h + 40], [pA.x + 362, pA.y + pA.h - 30]];
    C(o.el, kol, { kalinlik: 40 * s, renk: M, tohum: 950 });
    C(o.el, kol, { kalinlik: 31 * s, renk: ten, tohum: 950 });
    C(o.el, [[-84, -8], [-64, 22], [64, 22], [84, -8], [50, 4], [-50, 4]].map(([x, y]) => [taban[0] + x * s, taban[1] + y * s]), { kapali: true, dolgu: ten, kalinlik: KI, tohum: 951 });
    NES.A = o;
  }
  // B: "?" balonu, kuş bakışı çekmece, dağınık vidalar, üstte %60 organizer hattı
  {
    const s = yat ? 1.15 : 0.95;
    const taban = yat ? [pB.x + 722, pB.y + 385] : [pB.x + 365, pB.y + 412];
    const bc = yat ? [pB.x + 480, pB.y + 96] : [pB.x + 300, pB.y + 104], br = yat ? [66, 58] : [62, 54];
    balonCiz(pB, bc, br, 640);
    soruSekil(pB.arka, bc[0], bc[1] + 6, yat ? 1.05 : 0.95, 660).forEach((h) => pB.cizgiler.push(h.yol));
    const c0 = yat ? [pB.x + 575, pB.y + 150, pB.x + 872, pB.y + 402] : [pB.x + 252, pB.y + 222, pB.x + 482, pB.y + 430];
    Cp(pB, pB.arka, dortgen(...c0, 6), { kapali: true, dolgu: '#e9e4da', kalinlik: KL, tohum: 670 });
    Cp(pB, pB.arka, dortgen(c0[0] + 12, c0[1] + 12, c0[2] - 12, c0[3] - 12, 4), { kapali: true, kalinlik: KI, tohum: 671 });
    Cp(pB, pB.arka, [[c0[0] - 4, c0[3]], [c0[2] + 4, c0[3]]], { kalinlik: KL + 3, tohum: 672 });
    const o = nesneKur('B', taban[0], taban[1], s);
    gsap.set(o.govde, { svgOrigin: '0 -85' });
    orgSekil(o.gercek, { dolgu: RENK.organizer, tohum: 1000 });
    orgSekil(o.ust, { tohum: 1000 }).forEach((h) => pB.cizgiler.push(h.yol));
    const r = ctx.rng(4242);
    o.vidalar = Array.from({ length: 16 }, (_, j) => {
      const g = el(o.ek, 'g');
      vidaSekil(g, 1100 + j * 3).forEach((h) => pB.cizgiler.push(h.yol));
      const gec = j === 15;
      const bas = gec ? [108, -184, 30] : [-104 + r() * 208, -172 + r() * 160, (r() - 0.5) * 140];
      const slot = gec ? 5 : j % 6, kat = gec ? 2 : Math.floor(j / 6);
      const son = [BOLME[slot][0] + (r() - 0.5) * 8, BOLME[slot][1] + (kat - 1) * 15, (r() - 0.5) * 16];
      const st = { x: bas[0], y: bas[1], r: bas[2] };
      const uyg = () => g.setAttribute('transform', `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)})`);
      uyg();
      return { g, bas, son, st, uyg, gec };
    });
    NES.B = o;
  }
  // C: raf, logosuz kutular, boşlukta kesik çizgili figür silüeti (çizgi 12 fps kayar)
  {
    const s = yat ? 1.0 : 0.82;
    const taban = yat ? [pC.x + 700, pC.y + 330] : [pC.x + 372, pC.y + 250];
    const ry = taban[1];
    Cp(pC, pC.arka, dortgen(yat ? pC.x + 420 : pC.x + 188, ry, pC.x + pC.w + 20, ry + (yat ? 16 : 13), 3), { kapali: true, dolgu: GRI, kalinlik: KI + 0.6, tohum: 680 });
    const kutular = yat ? [[pC.x + 438, 92, 124], [pC.x + 544, 70, 92], [pC.x + 772, 74, 108], [pC.x + 860, 30, 70]] : [[pC.x + 198, 52, 80], [pC.x + 260, 40, 58], [pC.x + 424, 44, 72]];
    kutular.forEach(([x, w, h], j) => kutu(pC, x, w, h, ry, 682 + j * 3, MONO.giysi[[1, 3, 6, 2][j]]));
    const o = nesneKur('C', taban[0], taban[1], s);
    figurSekil(o.gercek, { renkli: true, tohum: 1200 });
    o.kesik = figurSekil(o.ust, { tohum: 1200, kesik: true }).map((h) => h.yol);
    NES.C = o;
  }
  // D: masa (dizüstü, kupa), balonda saksı; k1800'de masaya iner
  {
    const s = yat ? 0.95 : 0.82;
    const taban = yat ? [pD.x + 690, pD.y + 350] : [pD.x + 380, pD.y + 430];
    const bc = yat ? [pD.x + 690, pD.y + 128] : [pD.x + 330, pD.y + 118], br = yat ? [160, 96] : [145, 88];
    balonCiz(pD, bc, br, 700);
    const my = taban[1];
    Cp(pD, pD.arka, dortgen(yat ? pD.x + 400 : pD.x + 250, my, pD.x + pD.w + 20, my + (yat ? 16 : 13), 3), { kapali: true, dolgu: GRI, kalinlik: KI + 0.6, tohum: 710 });
    if (yat) {
      Cp(pD, pD.arka, cokgen([[pD.x + 440, my], [pD.x + 420, my - 92], [pD.x + 538, my - 92], [pD.x + 556, my]], 24), { kapali: true, dolgu: GRI2, kalinlik: KI, tohum: 712 });
      Cp(pD, pD.arka, dortgen(pD.x + 424, my - 8, pD.x + 576, my, 2), { kapali: true, dolgu: GRI, kalinlik: KI, tohum: 714 });
    }
    const kx = yat ? pD.x + 820 : pD.x + 456, kb = yat ? 40 : 30, kh = yat ? 50 : 38;
    Cp(pD, pD.arka, dortgen(kx, my - kh, kx + kb, my, 4), { kapali: true, dolgu: MONO.giysi[0], kalinlik: KI, tohum: 716 });
    Cp(pD, pD.arka, [[kx + kb, my - kh * 0.75], [kx + kb + kb * 0.4, my - kh * 0.6], [kx + kb + kb * 0.35, my - kh * 0.3], [kx + kb, my - kh * 0.25]], { kalinlik: KI, tohum: 718 });
    const o = nesneKur('D', taban[0], taban[1], s);
    o.bs = 0.6;
    o.b0 = [(bc[0] - taban[0]) / s, (bc[1] - taban[1]) / s + 75 * o.bs];
    gsap.set(o.govde, { x: o.b0[0], y: o.b0[1], scale: o.bs });
    saksiSekil(o.gercek, { renkli: true, tohum: 1300 });
    saksiSekil(o.ust, { tohum: 1300 }).forEach((h) => pD.cizgiler.push(h.yol));
    NES.D = o;
  }

  // Karakter pozları (panelde): istek bakışı
  const panelPoz = { A: ['merak', [1, -1]], B: ['sikkin', [1, 0]], C: ['merak', [1, 0]], D: ['merak', [1, -1]] };
  for (const p of PN) {
    const [ifade, bakis] = panelPoz[p.ad];
    p.kisi.poz({ ifade, bakis });
    tl.call(() => p.kisi.poz({ ifade, bakis }), null, k(K0));
  }

  // Panel girişleri: çerçeve 14 k EO DrawSVG (4 k arayla), içerik 8 k'da belirir, doodle'lar 12 k'da çizilir
  for (const p of PN) {
    const o = NES[p.ad];
    gorun(p.g, p.t0);
    // İçerik ve nesne panel açılırken gizli başlar (yoksa t0..t0+3 tam görünüp bir kare sönüyordu), t0+3'te 8 k'da belirir
    gorun(p.ic);
    gorun(o.g);
    tl.set([p.ic, o.g], { autoAlpha: 0 }, k(p.t0));
    // Çerçeve çizimi bir kare önce (grup hâlâ gizliyken) başlar: devir karesi k1632 boş kâğıt olmasın
    tl.fromTo(p.cerceve.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(14), ease: E.EO, immediateRender: false }, k(p.t0 - 1));
    tl.fromTo([p.ic, o.g], { autoAlpha: 0 }, { autoAlpha: 1, duration: k(8), ease: 'none', immediateRender: false }, k(p.t0 + 3));
    tl.fromTo(p.cizgiler, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, stagger: k(0.4), immediateRender: false }, k(p.t0 + 3));
    tl.set([p.cerceve.yol, ...p.cizgiler], { clearProps: 'strokeDasharray,strokeDashoffset' }, k(p.t0 + 16 + p.cizgiler.length * 0.4));
  }
  gsap.set(NES.B.ust, { opacity: 0.6 });
  tl.set(NES.B.ust, { opacity: 0.6 }, 0);
  // Kesik silüet 12 fps'te kayar (durakta durur)
  tl.fromTo(NES.C.kesik, { strokeDashoffset: 0 }, { strokeDashoffset: -100, duration: k(48), ease: 'steps(10)', immediateRender: false }, k(K0));
  tl.fromTo(NES.C.kesik, { strokeDashoffset: -100 }, { strokeDashoffset: -250, duration: k(48), ease: 'steps(10)', immediateRender: false }, k(1704));

  // k1680: her şey bir vuruş durur (kaynama donar); k1704 devam
  tl.call(() => dondur(false), null, k(K0));
  tl.call(() => dondur(true), null, k(1680));
  tl.call(() => dondur(false), null, k(1704));

  // ---------- Oktos'un sesi: "Bunlar için Oktos var." tek satır, yerel HTML (Oktos kelimesinin ağırlığı 300→900, 20 k BO)
  if (ctx.YAZI) {
    const p = document.createElement('p');
    p.className = 'yz baslik';
    p.lang = DIL; // EN'de "is" büyük harfte İS olmasın (sayfa lang="tr")
    Object.assign(p.style, yer({ left: '0px', top: '40px', width: W + 'px', textAlign: 'center' }, { left: '40px', top: '236px', width: (W - 80) + 'px', textAlign: 'center' }));
    const kel = EN ? [['That’s', 1704], ['what', 1708], ['Oktos', 1728, 1], ['is', 1732], ['for.', 1736]] : [['Bunlar', 1704], ['için', 1708], ['Oktos', 1728, 1], ['var.', 1732]];
    const sozcuk = [];
    kel.forEach(([s, k0, oktos], i) => {
      if (oktos && DIKEY) p.appendChild(document.createElement('br'));
      else if (i) p.appendChild(document.createTextNode(' '));
      const m = document.createElement('span');
      Object.assign(m.style, { display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.12em 0.05em 0.14em', margin: '-0.12em -0.05em -0.14em' });
      const w = document.createElement('span');
      w.style.display = 'inline-block';
      w.textContent = s;
      if (oktos) w.style.fontWeight = '300';
      m.appendChild(w); p.appendChild(m);
      gsap.set(w, { yPercent: 150 });
      sozcuk.push({ w, k0, oktos });
    });
    ctx.yaziKatmani.appendChild(p);
    gorun(p, 1704, 1930);
    // Maske harf işaretleri (İ, Ç) için dolgulu; gizli konum %150 (dolgu payı yüzünden %105 alttan sızıyordu)
    for (const { w, k0, oktos } of sozcuk) {
      tl.set(w, { yPercent: 150 }, 0);
      tl.fromTo(w, { yPercent: 150 }, { yPercent: 0, duration: k(34), ease: E.EO, immediateRender: false }, k(k0));
      if (oktos) tl.fromTo(w, { fontWeight: 300 }, { fontWeight: 900, duration: k(20), ease: E.BO, immediateRender: false }, k(k0 + 4));
    }
    tl.to(sozcuk.map((x) => x.w), { yPercent: -150, duration: k(18), ease: E.EI, stagger: k(2) }, k(1896));
  }

  // ---------- #22 GERÇEK 3: nozul her vuruşta bir panelden geçer (24 k KM); renk (gerçek) nozulun ardından dolar
  const supur = (k0, yerFn, kirpFn) => {
    const pr = { p: 0 };
    tl.fromTo(pr, { p: 0 }, { p: 1, duration: k(24), ease: E.KM, immediateRender: false, onUpdate: () => { const [x, y] = yerFn(pr.p); nozulKoy(x, y); kirpFn(pr.p); } }, k(k0));
  };
  // Vuruşlar arasında 2 k leke: nozul bir panelden ötekine sıçrar
  const lekeKoy = (kk, a, b) => {
    // Leke yalnız varış tarafında, yolun son ~%22'si (nesne boyunun ~2 katı), 2 k
    tl.call(() => { const p = a(1), q = b(0), s = [p[0] + (q[0] - p[0]) * 0.78, p[1] + (q[1] - p[1]) * 0.78]; leke.setAttribute('d', `M${s[0].toFixed(1)} ${s[1].toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`); }, null, k(kk));
    tl.set(leke, { autoAlpha: 1 }, k(kk));
    tl.set(leke, { autoAlpha: 0 }, k(kk + 2));
  };
  tl.set(nozulG, { autoAlpha: 1 }, k(1728));
  tl.set(nozulG, { autoAlpha: 0 }, k(1824));
  const kirpAlttan = (o, alt, ust) => (p) => { const e = alt - (alt - ust) * p; o.kr.setAttribute('y', e.toFixed(1)); o.kr.setAttribute('height', (alt + 10 - e).toFixed(1)); };

  // k1728 B (FDM, alttan): organizer çekmeceye basılır (12 k, %3 aşma), vidalar 3'erli gruplar halinde 2 k arayla 10 k BO yayla zıplar
  const oB = NES.B;
  tl.set(oB.ust, { opacity: 1 }, k(1728));
  tl.fromTo(oB.govde, { scale: 1 }, { scale: 0.95, duration: k(4), ease: 'power2.in', immediateRender: false }, k(1728));
  tl.to(oB.govde, { scale: 1, duration: k(8), ease: 'back.out(0.9)' }, k(1732));
  const yerB = (p) => dunya(oB, Math.sin(p * Math.PI * 7) * 104, 6 - 184 * p);
  supur(1728, yerB, kirpAlttan(oB, 6, -178));
  kirpTam(oB, 1752);
  tl.set(oB.ust, { autoAlpha: 0 }, k(1752));
  oB.vidalar.forEach((v, j) => {
    const t0 = v.gec ? 1756 : 1740 + Math.floor(j / 3) * 2, pr = { u: 0 };
    tl.fromTo(pr, { u: 0 }, { u: 1, duration: k(10), ease: E.BO, immediateRender: false, onUpdate: () => {
      const u = pr.u, h = Math.sin(Math.PI * Math.min(1, Math.max(0, u))) * (v.gec ? 70 : 46);
      v.st.x = v.bas[0] + (v.son[0] - v.bas[0]) * u;
      v.st.y = v.bas[1] + (v.son[1] - v.bas[1]) * u - h;
      v.st.r = v.bas[2] + (v.son[2] - v.bas[2]) * u;
      v.uyg();
    } }, k(t0));
  });
  etiketKoy(oB, -186, 1752, 1800); // A'nın etiketi (k1806) gelmeden söner
  tl.call(() => pB.kisi.poz({ ifade: 'saskin' }), null, k(adim(1744)));
  tl.call(() => pB.kisi.poz({ ifade: 'kirp' }), null, k(adim(1758)));
  tl.call(() => pB.kisi.poz({ ifade: 'mutlu' }), null, k(adim(1765)));

  // k1752 C (reçine, üstten): figür rafta doğar; kesik silüet söner
  const oC = NES.C;
  const yerC = (p) => dunya(oC, Math.sin(p * Math.PI * 6) * 60, -180 + 186 * p);
  supur(1752, yerC, (p) => { const e = -180 + 186 * p; oC.kr.setAttribute('y', -196); oC.kr.setAttribute('height', (e + 196).toFixed(1)); });
  lekeKoy(1752, yerB, yerC);
  kirpTam(oC, 1776);
  tl.to(oC.ust, { autoAlpha: 0, duration: k(8), ease: 'none' }, k(1770));
  etiketKoy(oC, -188, 1776);
  tl.call(() => pC.kisi.poz({ ifade: 'saskin' }), null, k(adim(1764)));
  tl.call(() => pC.kisi.poz({ ifade: 'mutlu' }), null, k(adim(1780)));

  // k1776 A (reçine, üstten): balondaki zarlar renklenir, nozul onları avuca kadar izler; zarlar 2 k arayla düşer (power2.in)
  const oA = NES.A;
  gorun(oA.el, 1764);
  tl.fromTo(oA.el, { y: 170 }, { y: 0, duration: k(10), ease: 'steps(2)', immediateRender: false }, k(1764));
  const zu = oA.O[1] - 108, za = oA.O[1] + 6; // balondaki kümenin üst ve alt kenarı (yerel)
  const yerA = (p) => {
    if (p < 0.62) { const q = p / 0.62; return dunya(oA, oA.O[0] + Math.sin(q * Math.PI * 5) * 92, zu + (za - zu) * q); }
    const q = (p - 0.62) / 0.38; return dunya(oA, oA.O[0] * (1 - q), za + (-40 - za) * q);
  };
  supur(1776, yerA, (p) => {
    if (p >= 0.62) { oA.kr.setAttribute('y', -3000); oA.kr.setAttribute('height', 6000); return; }
    const e = zu + (za - zu) * (p / 0.62);
    oA.kr.setAttribute('y', zu - 20); oA.kr.setAttribute('height', (e - zu + 20).toFixed(1));
  });
  lekeKoy(1776, yerC, yerA);
  tl.set(oA.ust, { autoAlpha: 0 }, k(1790));
  oA.zarlar.forEach((g, i) => {
    const t = 1790 + i * 2;
    tl.to(g, { x: ZAR_YER[i][0], y: ZAR_YER[i][1], rotation: (i % 2 ? 1 : -1) * 16, duration: k(10), ease: 'power2.in' }, k(t));
    tl.to(g, { rotation: 0, duration: k(6), ease: E.BO }, k(t + 10));
  });
  etiketKoy(oA, -118, 1806);
  tl.call(() => pA.kisi.poz({ bakis: [1, 1] }), null, k(adim(1790)));
  tl.call(() => pA.kisi.poz({ ifade: 'mutlu', bakis: [1, 1] }), null, k(adim(1806)));

  // k1800 D (FDM, alttan): saksı balondan masaya iner (10 k power2.in), oturur (12 k, %3 aşma); nozul alttan basar
  const oD = NES.D;
  tl.fromTo(oD.govde, { x: oD.b0[0], y: oD.b0[1], scale: oD.bs }, { x: 0, y: 0, scale: 1, duration: k(10), ease: 'power2.in', immediateRender: false }, k(1800));
  tl.to(oD.govde, { scaleX: 1.03, scaleY: 0.97, duration: k(3), ease: 'power2.out' }, k(1810));
  tl.to(oD.govde, { scaleX: 1, scaleY: 1, duration: k(9), ease: 'back.out(0.9)' }, k(1813));
  const yerD = (p) => dunya(oD, Math.sin(p * Math.PI * 6) * 62, 4 - 160 * p);
  supur(1800, yerD, kirpAlttan(oD, 4, -156));
  lekeKoy(1800, yerA, yerD);
  kirpTam(oD, 1824);
  tl.set(oD.ust, { autoAlpha: 0 }, k(1824));
  // D'nin panel etiketi yok: k1820'de üçüncü etiket olurdu (EN 5 + 3 = 8 kelime) ve 10 k yaşardı; kahraman karedeki ortak etiket kapsar
  tl.call(() => pD.kisi.poz({ bakis: [1, 1] }), null, k(adim(1800)));
  tl.call(() => pD.kisi.poz({ ifade: 'mutlu', bakis: [1, 0] }), null, k(adim(1815)));

  // ---------- #23 Kahraman kare: paneller katlanır; dört nesne tek kâğıt masada, gölgeler; karakterler kenarlardan eğilir
  const HERO = DIKEY ? {
    masa: [[170, 600], [910, 600], [1000, 1180], [80, 1180]],
    nesne: { A: [360, 832, 1.25], B: [722, 846, 1.2], C: [360, 1112, 1.25], D: [722, 1112, 1.3] },
    kisi: {
      A: { x: 90, alt: 1560, olcek: 1.0, r: 12, dx: -440, dy: 0 }, B: { x: 990, alt: 1560, olcek: 1.0, r: -12, dx: 440, dy: 0 },
      C: { x: 350, alt: 1700, olcek: 0.95, r: 4, dx: 0, dy: 460 }, D: { x: 730, alt: 1700, olcek: 0.95, r: -4, dx: 0, dy: 460 },
    },
  } : {
    masa: [[540, 352], [1380, 352], [1490, 790], [430, 790]],
    nesne: { A: [640, 642, 1.2], B: [872, 652, 1.1], C: [1078, 652, 1.15], D: [1282, 652, 1.15] },
    kisi: {
      A: { x: 190, alt: 1140, olcek: 1.35, r: 10, dx: -540, dy: 0 }, B: { x: 1730, alt: 1140, olcek: 1.35, r: -10, dx: 540, dy: 0 },
      C: { x: 640, alt: 1250, olcek: 1.12, r: 4, dx: 0, dy: 480 }, D: { x: 1290, alt: 1250, olcek: 1.12, r: -4, dx: 0, dy: 480 },
    },
  };
  PN.forEach((p, i) => {
    const t = 1824 + i * 3;
    tl.to(p.g, { [i % 2 ? 'scaleY' : 'scaleX']: 0, svgOrigin: `${p.x + p.w / 2} ${p.y + p.h / 2}`, duration: k(14), ease: E.EI }, k(t));
    tl.set(p.g, { autoAlpha: 0 }, k(t + 14));
  });
  const masa = C(masaG, cokgen(HERO.masa, 40), { kapali: true, dolgu: '#f8f5ef', kalinlik: KL, tohum: 1400 });
  gorun(masaG, 1826);
  tl.fromTo(masa.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(16), ease: E.EO, immediateRender: false }, k(1826));
  tl.fromTo(masa.dolgu, { opacity: 0 }, { opacity: 1, duration: k(8), ease: 'none', immediateRender: false }, k(1826));
  tl.set(masa.yol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(1843));
  ['A', 'B', 'C', 'D'].forEach((ad, i) => {
    const o = NES[ad], [x, y, s] = HERO.nesne[ad], t = 1828 + i * 3;
    tl.to(o.g, { x, y, scale: s, duration: k(24), ease: E.KM }, k(t));
    const rx = (ad === 'B' ? 108 : ad === 'A' ? 96 : 64) * s;
    const gol = el(golgeler, 'ellipse', { cx: x + 18 * s, cy: y + 2, rx, ry: rx * 0.15, fill: M, opacity: 0 });
    tl.set(gol, { opacity: 0 }, 0);
    tl.to(gol, { opacity: 0.16, duration: k(10), ease: 'none' }, k(t + 20));
  });
  const KH = {}, kahBakis = { A: [1, -1], B: [-1, -1], C: [1, -1], D: [-1, -1] };
  ['A', 'B', 'C', 'D'].forEach((ad, i) => {
    const q = HERO.kisi[ad];
    const h = ctx.kisi(kahramanlar, ctx.kisiParam(ad), { x: q.x, alt: q.alt, olcek: q.olcek }); kaynar.push(h);
    // Gövde uzatması: insan.js gövdesi alt kenarın 170 birim altında biter (dikeyde kadraja girer); oradan kadrajın altına dek
    // giysi rengiyle sür. Dolgu gövdenin alt konturunu örter, yan konturlar gövdeninkini (±176) sürdürür
    const ol = q.olcek, x0 = q.x - 176 * ol, x1 = q.x + 176 * ol, y0 = q.alt + 154 * ol, y1 = H + 200, ky = 3 * ol;
    const uz = el(h.g, 'g');
    el(uz, 'path', { d: `M${x0 + ky} ${y0 + ky} L${x1 + ky} ${y0 + ky} L${x1 + ky} ${y1} L${x0 + ky} ${y1} Z`, fill: MONO.giysi[h.p.giysi] });
    C(uz, [[x0, y0], [x0, y1]], { kalinlik: 4.2 * ol, tohum: 1520 + i * 2 });
    C(uz, [[x1, y0], [x1, y1]], { kalinlik: 4.2 * ol, tohum: 1521 + i * 2 });
    gsap.set(h.g, { svgOrigin: `${q.x} ${q.alt}`, rotation: q.r });
    h.poz({ ifade: 'merak', bakis: kahBakis[ad] });
    const t = adim(1836 + i * 4);
    gorun(h.g, t);
    tl.fromTo(h.g, { x: q.dx, y: q.dy }, { x: 0, y: 0, duration: k(20), ease: 'steps(4)', immediateRender: false }, k(t));
    KH[ad] = h;
  });
  // Tepkiler (12 fps ızgarasında 5 k arayla): A sırıtır, B gözlüğünü alnına iter → mutlu, C başını sallar, D onaylar
  tl.call(() => KH.A.poz({ ifade: 'kisik' }), null, k(1860)); // sırıtma
  const qB = HERO.kisi.B, pB2 = { ...KH.B.p, gozluk: null };
  const gz = el(KH.B.g, 'svg', { viewBox: '0 0 400 440', x: qB.x - 200 * qB.olcek, y: qB.alt - 440 * qB.olcek, width: 400 * qB.olcek, height: 440 * qB.olcek, overflow: 'visible' });
  for (const yon of [-1, 1]) C(gz, ctx.oval(200 + yon * 25, 126, 19, 12, 0, 360, 12, 3), { kapali: true, dolgu: '#e4e2dd', kalinlik: 4, tohum: 1501 + yon });
  C(gz, [[156, 126], [128, 134]], { kalinlik: 4, tohum: 1503 });
  C(gz, [[244, 126], [272, 134]], { kalinlik: 4, tohum: 1504 });
  gorun(gz, 1865);
  tl.call(() => KH.B.poz({ p: pB2, ifade: 'mutlu' }), null, k(1865));
  tl.call(() => KH.C.poz({ ifade: 'mutlu' }), null, k(1870));
  tl.to(KH.C.g, { y: 10, duration: k(5), ease: 'steps(1)', yoyo: true, repeat: 3 }, k(1870));
  tl.call(() => KH.D.poz({ ifade: 'mutlu', bakis: [-1, 0] }), null, k(1875));
  tl.to(KH.D.g, { y: 8, duration: k(5), ease: 'steps(1)', yoyo: true, repeat: 1 }, k(1875));
  // Kahraman karede tek ortak GERÇEK etiketi (dört ayrı etiket + başlık 7 kelimeyi aşardı): nesne sırasının altında, masayla
  // birlikte; nesneler oturunca belirir, logo çizilmeye başlarken söner
  const ortakEtiket = etiket(masaG, ...(DIKEY ? [540, 1160] : [961, 722]));
  tl.fromTo(ortakEtiket, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(8), immediateRender: false }, k(1846));
  tl.to(ortakEtiket, { autoAlpha: 0, duration: k(8), ease: 'none' }, k(1920));

  // ---------- #24 Nozul tek çizgiyle dört nesneyi sarar (40 k KM), çizgi logoya döner (24 k KM), logo köşeye (24 k KM)
  const [lx, ly, lrx, lry] = DIKEY ? [540, 872, 340, 300] : [962, 548, 500, 172];
  const kemNok = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, a = Math.PI * (0.92 + 2.3 * t), rr = 1 + 0.06 * Math.sin(a * 5) - 0.06 * t;
    kemNok.push([lx + Math.cos(a) * lrx * rr, ly + Math.sin(a) * lry * rr]);
  }
  const kement = el(logoG, 'path', { d: ctx.yol(kemNok, false, { sap: () => 0 }), fill: M, 'fill-opacity': 0, 'fill-rule': 'evenodd', stroke: M, 'stroke-width': KL, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const Lk = kement.getTotalLength();
  gorun(kement, 1920);
  const pk = { p: 0 };
  tl.fromTo(pk, { p: 0 }, { p: 1, duration: k(40), ease: E.KM, immediateRender: false, onUpdate: () => {
    kement.style.strokeDasharray = `${(Lk * pk.p).toFixed(1)} ${(Lk + 10).toFixed(1)}`;
    const q = kement.getPointAtLength(Lk * pk.p); nozulKoy(q.x, q.y);
  } }, k(1920));
  tl.set(nozulG, { autoAlpha: 1 }, k(1920));
  tl.to(nozulG, { autoAlpha: 0, duration: k(8), ease: 'none' }, k(1960));
  tl.set(kement, { strokeDasharray: 'none' }, k(1962));
  const [bcx, bcy, ben] = DIKEY ? [540, 880, 640] : [960, 560, 560];
  const [kcx, kcy, ken] = DIKEY ? [150, 318, 170] : [1772, 966, 170];
  tl.to(kement, { morphSVG: logoYolu(bcx, bcy, ben), duration: k(24), ease: E.KM }, k(1964));
  gsap.set(logoG, { svgOrigin: `${bcx} ${bcy}` });
  tl.to(logoG, { x: kcx - bcx, y: kcy - bcy, scale: ken / ben, duration: k(24), ease: E.KM }, k(1990));
  tl.fromTo(kement, { fillOpacity: 0 }, { fillOpacity: 1, duration: k(12), ease: 'none', immediateRender: false }, k(1990));

  // ---------- #25 Kamera yukarı bakar: zemin aşağı kayar, yükselenler göğe çıkar (paralaks: dilek balonu 1,0, nesne 0,6,
  // kalabalık 0,25), kâğıt maskesi göğe açılır (40 k), konturlar 24 k'da geri sarılır
  const R = 1.15 * H;
  tl.to(zemin, { y: H * 1.12, duration: k(60), ease: E.KM }, k(2016));
  tl.to(kagitG, { y: H + 260, duration: k(40), ease: E.KM }, k(2028));
  gsap.set(gokRect, { svgOrigin: `${W / 2} ${H / 2}` });
  tl.fromTo(gokRect, { scale: 1 }, { scale: 1.04, duration: k(287), ease: 'none', immediateRender: false }, k(2016));
  const geriSar = [], kesikDilek = [];
  // Dilek balonları: her karakterin başının üstünde, isteğinin küçük doodle'ı
  const dilekIc = {
    A: (u) => zarSekil(u, 5, { boy: 58, tohum: 1600 }),
    B: (u) => soruSekil(u, 0, 4, 0.95, 1610),
    C: (u) => figurSekil(el(u, 'g', { transform: 'translate(0 40) scale(0.42)' }), { tohum: 1620, kesik: true }),
    D: (u) => saksiSekil(el(u, 'g', { transform: 'translate(0 34) scale(0.45)' }), { tohum: 1630 }),
  };
  ['A', 'B', 'C', 'D'].forEach((ad, i) => {
    const q = HERO.kisi[ad], ol = q.olcek, rad = q.r * Math.PI / 180, r = 62 * ol;
    const ey = q.alt - 440 * ol + 178 * ol, yon = q.x < W / 2 ? 1 : -1;
    const dx = yon * 110 * ol, dy = ey - 215 * ol - q.alt; // eğilmeyle birlikte döndür (alt kenar ortası çevresinde)
    const cx = q.x + dx * Math.cos(rad) - dy * Math.sin(rad), cy = q.alt + dx * Math.sin(rad) + dy * Math.cos(rad);
    const mb = el(dilekler, 'g');
    geriSar.push(C(mb, bulutNok(cx, cy, r * 1.18, r, 8), { kapali: true, dolgu: BALON, kalinlik: KI + 0.4, tohum: 1650 + i * 7 }).yol);
    // Kesik çizgili (C'nin silüeti) DrawSVG ile geri sarılmaz (kesik düz çizgiye döner); balonla birlikte söner
    dilekIc[ad](el(mb, 'g', { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${(r / 70).toFixed(3)})` })).forEach((h) => (h.yol.getAttribute('stroke-dasharray') ? kesikDilek : geriSar).push(h.yol));
    gsap.set(mb, { svgOrigin: `${cx} ${cy + r}` });
    const t = 2016 + i * 4;
    gorun(mb, t);
    tl.fromTo(mb, { scale: 0 }, { scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(t));
    tl.to(mb, { y: -R, duration: k(60), ease: E.KM }, k(t));
  });
  ['A', 'B', 'C', 'D'].forEach((ad, i) => tl.to(NES[ad].g, { y: HERO.nesne[ad][1] - R * 0.6, duration: k(60), ease: E.KM }, k(2032 + i * 4)));
  // Kalabalığın küçük balonları: plaka, anahtarlık, displayer, token, dişli (uzak katman, alttan girer)
  const KAL = {
    plaka: (u, t) => [C(u, dortgen(-32, -20, 32, 20), { kapali: true, dolgu: '#f4f1ea', kalinlik: 3.4, tohum: t }), C(u, [[-18, -4], [22, -4]], { kalinlik: 2.6, tohum: t + 1 }), C(u, [[-18, 8], [10, 8]], { kalinlik: 2.6, tohum: t + 2 }), C(u, daire(-24, -12, 3.5, 8), { kapali: true, kalinlik: 2.2, tohum: t + 3 })],
    anahtarlik: (u, t) => [C(u, daire(-18, -16, 11), { kapali: true, kalinlik: 3.4, tohum: t }), C(u, [[-8, -8], [24, -2], [30, 14], [18, 26], [-4, 18]], { kapali: true, dolgu: GRI, kalinlik: 3.4, tohum: t + 1 })],
    displayer: (u, t) => [C(u, dortgen(-28, -14, 22, 26), { kapali: true, kalinlik: 3.4, tohum: t }), C(u, cokgen([[-28, -14], [-14, -28], [36, -28], [22, -14]], 10), { kapali: true, kalinlik: 3.4, tohum: t + 1 }), C(u, cokgen([[22, -14], [36, -28], [36, 12], [22, 26]], 10), { kapali: true, dolgu: GRI, kalinlik: 3.4, tohum: t + 2 })],
    token: (u, t) => [C(u, daire(0, 0, 26, 16), { kapali: true, dolgu: GRI, kalinlik: 3.4, tohum: t }), C(u, daire(0, 0, 16, 14), { kapali: true, kalinlik: 2.6, tohum: t + 1 })],
    disli: (u, t) => {
      const p = [];
      for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, rr = Math.floor(i / 2) % 2 ? 20 : 27; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      return [C(u, p, { kapali: true, dolgu: GRI, kalinlik: 3, tohum: t, genlik: 0.8 }), C(u, daire(0, 0, 7, 10), { kapali: true, dolgu: BALON, kalinlik: 2.6, tohum: t + 1 })];
    },
  };
  const kalX = DIKEY ? [0.14, 0.32, 0.5, 0.68, 0.86] : [0.1, 0.27, 0.44, 0.61, 0.78];
  Object.keys(KAL).forEach((ad, i) => {
    const r = DIKEY ? 64 : 58, cx = W * kalX[i], cy = H + 80 + (i % 2) * 70;
    const mb = el(kalabalik, 'g');
    geriSar.push(C(mb, bulutNok(cx, cy, r * 1.18, r, 8), { kapali: true, dolgu: BALON, kalinlik: KI, tohum: 1700 + i * 9 }).yol);
    KAL[ad](el(mb, 'g', { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${(r / 60).toFixed(3)})` }), 1710 + i * 9).forEach((h) => geriSar.push(h.yol));
    const t = 2048 + i * 4;
    tl.to(mb, { y: -R * 0.25, duration: k(60), ease: E.KM }, k(t));
    tl.to(mb, { y: -R * 0.25 - 60, duration: k(50), ease: 'none' }, k(t + 60));
  });
  gorun(kalabalik, 2016);
  tl.fromTo(geriSar, { drawSVG: '100%' }, { drawSVG: '0%', duration: k(24), ease: E.KM, immediateRender: false }, k(2120));
  tl.to(kesikDilek, { autoAlpha: 0, duration: k(16), ease: 'none' }, k(2120));
  tl.to([kalabalik, dilekler], { autoAlpha: 0, duration: k(12), ease: 'none' }, k(2138));
  // Oktos'un sesi: soru → davet (aynı yerde, maskeden itilerek)
  // Yazı alt yarıda: üst yarıdan nesneler ve dilek balonları geçer, kalabalık balonları en altta kalır
  const yerYazi = yer({ left: 0, top: 612, width: W, align: 'center' }, { left: 40, top: 1090, width: W - 80, align: 'center' });
  // Plandan küçük sapma (denetim, 2. tur): k2016–2048 arası nesneler ve kâğıt kenarı yazının üstünden geçiyor. y1 k2048'de
  // temiz zemine girer, çıkışı k2104'te başlar (k2130'da biter); y2 k2124'te girer: iki satır binmez, y1 ekranda 1,4 sn tam okunur
  const y1 = yazi(metin('3B bir fikrin mi var?', 'Got a 3D idea?'), 2048, 2104, { stil: 'baslik', yer: yerYazi, boyut: DIKEY ? 92 : undefined });
  const y2 = yazi(metin('Gerçeğe dönüştürelim.', 'Let’s make it real.'), 2130, null, { stil: 'baslik', yer: yerYazi, boyut: DIKEY ? 92 : undefined });
  for (const p of [y1, y2]) if (p) p.lang = DIL;

  // ---------- #26 Site: video biter, canlı çatı sahnesi devralır (yer tutucu). Sosyal: logo köşede + CTA satırı
  const cy26 = DIKEY ? 1440 : 900;
  el(sonG, 'rect', { x: 28, y: 28, width: W - 56, height: H - 56, rx: 18, fill: 'none', stroke: VURGU, 'stroke-width': 2.5, 'stroke-dasharray': '12 10', opacity: 0.55 });
  const t1 = el(sonG, 'text', { x: W / 2, y: cy26, 'text-anchor': 'middle', 'font-family': 'Schibsted Grotesk, sans-serif', 'font-weight': 700, 'font-size': 26, 'letter-spacing': 4, fill: VURGU });
  // Yer tutucu tek satır, 2 kelime (sonda ekranda: y2 + CTA + bu = TR 5, EN 7 kelime). Not: video biter, canlı sahne devralır,
  // kamera terasa iner (90 k KM); aşağı ok inişi gösterir
  t1.textContent = EN ? 'ROOF SCENE' : 'ÇATI SAHNESİ';
  const ok = el(sonG, 'g');
  C(ok, [[W / 2 - 20, cy26 - 76], [W / 2, cy26 - 56], [W / 2 + 20, cy26 - 76]], { kalinlik: 4, renk: VURGU, tohum: 1790 });
  gorun(sonG, 2208);
  tl.fromTo(sonG, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(10), ease: 'none', immediateRender: false }, k(2208));
  tl.fromTo(ok, { y: -10 }, { y: 14, duration: k(30), ease: 'steps(6)', repeat: 2, immediateRender: false }, k(2208));
  // CTA k2150'de girer: son 2,56 sn (154 k) ekranda (plan: son 2,5 sn'den fazla logo + CTA)
  const cta = yazi(metin('bisgin.github.io/oktos-atolye', 'bisgin.github.io/oktos-atolye'), 2150, null, {
    stil: 'etiket', yer: yer({ left: 0, top: 748, width: W, align: 'center' }, { left: 40, top: 1206, width: W - 80, align: 'center' }),
  });
  if (cta) Object.assign(cta.style, { textTransform: 'none', letterSpacing: '0.06em', fontSize: DIKEY ? '30px' : '28px' });
}
