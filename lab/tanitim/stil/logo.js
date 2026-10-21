// Logoya dönüşen balonlar (stil denemesi, M2; ≈4 sn akış + slogan, 60 fps).
// Akış: kenarlarda 8 karakterin düşünce balonu (karakterler kadraj dışında, noktalar kenara gider) ve içlerinde doodle
// fikirler (zar, organizer, figür, saksı, çanta süsü, piyon, at, vazo) → balonlar dalga sırasıyla söner → her çizimin
// konturları ortaya akar, her kontur logonun bir siyah parçasının kenarına oturur (nokta eşleme), parça mürekkeple dolar
// (3 kare arayla, aynalı çiftler aynı karede; dalgalar arası +4 kare) → logo ortada tamamlanır (köşeye inmez) →
// "OKTOS" harf harf → "3B bir fikrin mi var? Gerçeğe dönüştürelim."
// Logo parçaları: core/logo-beyaz.svg, Python ile 29 dışbükey parçaya ayrıldı (içbükey köşeden kenar uzantısı boyunca en kısa
// kesik, eksen üstünde eksen boyunca, aynalı çift kesik). Parça grupları logonun motifleridir (köşe kancaları, yan kancalar,
// alt kancalar, çarpı, üst halka); her grup bir balondan beslenir, çizimin kontur sayısı = grubun parça sayısı.
// Kare hızı: konum ve biçim 60 fps; çizgi kaynaması 8 fps / 4 çizim (oturunca durur: el çizimi → kesin logo).
// Sorgu: ?yon=yatay|dikey ?t=2.4 (kareyi dondur) ?hiz=0.5 ?sayac=0 ?cek=1 (scripts/film-cek.py, .impeccable/anlar.py)
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
import { CustomEase } from 'gsap/CustomEase.js';

gsap.registerPlugin(DrawSVGPlugin, CustomEase);
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const FPS = 60, TOPLAM = 330;
const k = (n) => n / FPS; // kare → saniye
const NS = 'http://www.w3.org/2000/svg';
const M = '#1d1d20', BALON = '#fbf9f5';

// ---------- Eğriler (film.js ile aynı adlar)
const E = {
  EO: CustomEase.create('EO', '0.16,1,0.3,1'),   // yavaşlayarak oturur
  EI: CustomEase.create('EI', '0.7,0,0.84,0'),   // çıkış
  KM: CustomEase.create('KM', '0.65,0,0.35,1'),  // şekil dönüşümü
};
const YOL_EGRI = gsap.parseEase('power3.inOut'); // uçuş
const DOLUM_EGRI = gsap.parseEase('power2.in'); // mürekkep kenardan içe: yavaş başlar, hızlanarak kapanır
const BICIM_EGRI = gsap.parseEase('power2.inOut'); // çizimden parçaya biçim

// ---------- Logo (core/logo-beyaz.svg, viewBox 674 × 531.75; dolu bölge evenodd)
const LOGO_D = 'M337,40 L194.5,182.5 L279.25,267.25 L242,304.5 L157,304.5 L157,240 L198.5,281.5 L198.5,212.5 L118,212.5 L118,343 L203.5,343 L115,431.5 L73,431.5 L73,377 L108.5,412.5 L108.5,358 L40,358 L40,472 L137.5,472 L177.75,431.75 L237.75,491.75 L321.25,408.25 L276.25,363.25 L239,400.5 L275.5,400.5 L242,434 L208.75,400.75 L277.75,331.75 L337,391 L396.25,331.75 L465.25,400.75 L432,434 L398.5,400.5 L435,400.5 L397.75,363.25 L352.75,408.25 L436.25,491.75 L496.25,431.75 L536.5,472 L634,472 L634,358 L565.5,358 L565.5,412.5 L601,377 L601,431.5 L559,431.5 L470.5,343 L556,343 L556,212.5 L475.5,212.5 L475.5,281.5 L517,240 L517,304.5 L432,304.5 L394.75,267.25 L479.5,182.5 Z M393.5,182.5 L337,239 L280.5,182.5 L337,126 Z M337,157 L311.5,182.5 L337,208 L362.5,182.5 Z M376,303.5 L337,342.5 L298,303.5 L337,264.5 Z';
const LOGO_ORTA = [337, 265.875]; // dolu bölgenin sınır kutusu ortası (x 40–634, y 40–491,75)
// 29 dışbükey parça (logo birimi; Python ayrıştırması, alan toplamı = logo alanı 108 195,6). Sıra: ağırlık merkezi y, x.
const PARCA = [
  [[337, 40], [337, 126], [237.5, 225.5], [194.5, 182.5]],
  [[337, 40], [479.5, 182.5], [436.5, 225.5], [337, 126]],
  [[311.5, 182.5], [337, 157], [362.5, 182.5], [337, 208]],
  [[157, 212.5], [198.5, 212.5], [198.5, 281.5], [157, 240]],
  [[517, 212.5], [517, 240], [475.5, 281.5], [475.5, 212.5]],
  [[237.5, 225.5], [280.5, 182.5], [337, 239], [337, 264.5], [306.75, 294.75]],
  [[436.5, 225.5], [367.25, 294.75], [337, 264.5], [337, 239], [393.5, 182.5]],
  [[118, 343], [118, 212.5], [157, 212.5], [157, 343]],
  [[517, 212.5], [556, 212.5], [556, 343], [517, 343]],
  [[306.75, 294.75], [298, 303.5], [270.5, 276], [279.25, 267.25]],
  [[403.5, 276], [376, 303.5], [367.25, 294.75], [394.75, 267.25]],
  [[242, 304.5], [203.5, 343], [157, 343], [157, 304.5]],
  [[517, 304.5], [517, 343], [470.5, 343], [432, 304.5]],
  [[337, 391], [277.75, 331.75], [302, 307.5], [337, 342.5]],
  [[372, 307.5], [396.25, 331.75], [337, 391], [337, 342.5]],
  [[108.5, 358], [108.5, 412.5], [73, 377], [73, 358]],
  [[565.5, 412.5], [565.5, 358], [601, 358], [601, 377]],
  [[137.5, 472], [74.5, 472], [270.5, 276], [302, 307.5]],
  [[599.5, 472], [536.5, 472], [372, 307.5], [403.5, 276]],
  [[239, 400.5], [276.25, 363.25], [294.5, 381.5], [275.5, 400.5]],
  [[398.5, 400.5], [379.5, 381.5], [397.75, 363.25], [435, 400.5]],
  [[73, 431.5], [40, 431.5], [40, 358], [73, 358]],
  [[601, 358], [634, 358], [634, 431.5], [601, 431.5]],
  [[242, 434], [294.5, 381.5], [321.25, 408.25], [268.75, 460.75]],
  [[432, 434], [405.25, 460.75], [352.75, 408.25], [379.5, 381.5]],
  [[237.75, 491.75], [177.75, 431.75], [208.75, 400.75], [268.75, 460.75]],
  [[405.25, 460.75], [465.25, 400.75], [496.25, 431.75], [436.25, 491.75]],
  [[40, 431.5], [115, 431.5], [74.5, 472], [40, 472]],
  [[559, 431.5], [634, 431.5], [634, 472], [599.5, 472]],
];

// ---------- Fikir çizimleri (birim; merkez 0,0, y aşağı). duz: köşeli (zar, kutu); değilse yumuşak (Catmull-Rom)
const ov = (cx, cy, rx, ry, n = 14) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const CIZIM = {
  // FRP zarı (d20): dış altıgen, iç üçgen, üst V, alt W, tepe çizgisi
  zar: [
    { p: [[0, -0.56], [0.49, -0.28], [0.49, 0.28], [0, 0.56], [-0.49, 0.28], [-0.49, -0.28]], kapali: true, duz: true },
    { p: [[0, -0.22], [0.27, 0.2], [-0.27, 0.2]], kapali: true, duz: true },
    { p: [[-0.49, -0.28], [0, -0.22], [0.49, -0.28]], duz: true },
    { p: [[0.49, 0.28], [0.27, 0.2], [0, 0.56], [-0.27, 0.2], [-0.49, 0.28]], duz: true },
    { p: [[0, -0.56], [0, -0.22]], duz: true },
  ],
  // İnce uzun vida organizeri: çerçeve, üç bölme, iki vida
  organizer: [
    { p: [[-0.66, -0.2], [0.66, -0.2], [0.66, 0.2], [-0.66, 0.2]], kapali: true, duz: true },
    { p: [[-0.24, -0.2], [-0.24, 0.2]], duz: true },
    { p: [[0.14, -0.2], [0.14, 0.2]], duz: true },
    { p: [[0.42, -0.2], [0.42, 0.2]], duz: true },
    { p: [[-0.56, -0.07], [-0.5, -0.08], [-0.48, -0.03], [-0.34, -0.025], [-0.31, 0], [-0.34, 0.025], [-0.48, 0.03], [-0.5, 0.08], [-0.56, 0.07]], kapali: true },
    { p: [[-0.12, 0.06], [-0.06, 0.05], [-0.05, 0.01], [0.06, 0.0], [0.08, -0.03], [0.05, -0.05], [-0.05, -0.04], [-0.07, -0.08], [-0.13, -0.06]], kapali: true },
  ],
  // Anime figür (doodle heykel): dikenli saçlı iri baş, gövde, kaide
  figur: [
    { p: [[-0.21, -0.12], [-0.3, -0.28], [-0.19, -0.29], [-0.2, -0.45], [-0.07, -0.36], [0.02, -0.53], [0.09, -0.37], [0.22, -0.46], [0.19, -0.29], [0.31, -0.27], [0.21, -0.12], [0.16, -0.01], [0, 0.03], [-0.16, -0.01]], kapali: true },
    { p: [[-0.09, 0.03], [0.09, 0.03], [0.15, 0.14], [0.22, 0.33], [-0.22, 0.33], [-0.15, 0.14]], kapali: true },
    { p: ov(0, 0.4, 0.31, 0.075, 16), kapali: true },
  ],
  // Saksı: gövde, ağız bandı, filiz
  saksi: [
    { p: [[-0.3, -0.04], [0.3, -0.04], [0.22, 0.46], [-0.22, 0.46]], kapali: true, duz: true },
    { p: [[-0.37, -0.16], [0.37, -0.16], [0.37, -0.04], [-0.37, -0.04]], kapali: true, duz: true },
    { p: [[0, -0.16], [0, -0.33], [-0.17, -0.47], [-0.26, -0.43], [-0.12, -0.35], [0, -0.33], [0.12, -0.5], [0.25, -0.52], [0.13, -0.38], [0.01, -0.34]] },
  ],
  // Çanta süsü: halka, bağlantı, kedi başı
  canta: [
    { p: ov(0, -0.38, 0.14, 0.14, 14), kapali: true },
    { p: ov(0, -0.17, 0.05, 0.1, 10), kapali: true },
    { p: [[-0.24, 0.1], [-0.23, -0.07], [-0.1, 0.01], [0.1, 0.01], [0.23, -0.07], [0.24, 0.1], [0.27, 0.26], [0.17, 0.42], [0, 0.46], [-0.17, 0.42], [-0.27, 0.26]], kapali: true },
  ],
  // Masa oyunu piyonu: baş, gövde, taban
  piyon: [
    { p: ov(0, -0.33, 0.14, 0.14, 14), kapali: true },
    { p: [[-0.1, -0.19], [0.1, -0.19], [0.15, -0.14], [0.06, -0.11], [0.08, 0.05], [0.16, 0.2], [0.2, 0.29], [-0.2, 0.29], [-0.16, 0.2], [-0.08, 0.05], [-0.06, -0.11], [-0.15, -0.14]], kapali: true },
    { p: [[-0.29, 0.29], [0.29, 0.29], [0.31, 0.43], [-0.31, 0.43]], kapali: true, duz: true },
  ],
  // Satranç atı: baş ve boyun, taban, yele
  at: [
    { p: [[-0.17, 0.3], [-0.2, 0.05], [-0.14, -0.17], [-0.03, -0.35], [0.03, -0.47], [0.09, -0.36], [0.22, -0.25], [0.3, -0.09], [0.26, 0.0], [0.14, -0.02], [0.05, -0.06], [0.11, 0.11], [0.2, 0.3]], kapali: true },
    { p: [[-0.29, 0.3], [0.29, 0.3], [0.31, 0.44], [-0.31, 0.44]], kapali: true, duz: true },
    { p: [[-0.1, -0.24], [-0.05, -0.12], [-0.1, 0.0], [-0.05, 0.14]] },
  ],
  // Vazo: gövde, ağız, lale
  vazo: [
    { p: [[-0.1, -0.18], [0.1, -0.18], [0.12, -0.08], [0.26, 0.1], [0.24, 0.31], [0.12, 0.45], [-0.12, 0.45], [-0.24, 0.31], [-0.26, 0.1], [-0.12, -0.08]], kapali: true },
    { p: ov(0, -0.2, 0.14, 0.045, 12), kapali: true },
    { p: [[0, -0.22], [0.01, -0.38], [-0.09, -0.47], [-0.06, -0.57], [0, -0.5], [0.06, -0.57], [0.1, -0.47], [0.01, -0.38]] },
  ],
};

// ---------- Gruplar: logo motifi → parçalar (oturma sırası), çizim, dalga. Aynalı gruplar aynı dalgada.
const GRUPLAR = [
  { ad: 'koseL', parca: [21, 27, 15], cizim: 'canta', dalga: 0 },
  { ad: 'koseR', parca: [22, 28, 16], cizim: 'piyon', dalga: 0 },
  { ad: 'yanL', parca: [7, 11, 3], cizim: 'figur', dalga: 1 },
  { ad: 'yanR', parca: [8, 12, 4], cizim: 'saksi', dalga: 1 },
  { ad: 'altL', parca: [25, 23, 19], cizim: 'at', dalga: 2 },
  { ad: 'altR', parca: [26, 24, 20], cizim: 'vazo', dalga: 2 },
  { ad: 'carpi', parca: [17, 18, 13, 14, 9, 10], cizim: 'organizer', dalga: 3, cift: true },
  { ad: 'halka', parca: [5, 6, 0, 1, 2], cizim: 'zar', dalga: 4, cift: true },
];
const BALON_SIRA = ['koseR', 'yanL', 'koseL', 'altR', 'yanR', 'carpi', 'altL', 'halka']; // beliriş sırası (2 k arayla)

// ---------- Yerleşim (balon merkezi c, yarıçap; kaynak: kadraj dışındaki karakterin başı, noktalar oraya gider)
const D = DIKEY ? {
  logo: { cx: 540, cy: 840, s: 1.3 },
  ad: { top: 1196, boyut: 176 }, cumle: { top: 1436, boyut: 60, en: 900 },
  br: [186, 130], dol: [0.6, 0.64], kalin: 5.5, nokta: 1.1,
  balon: {
    halka: { c: [300, 196], kaynak: [-80, 40] }, carpi: { c: [780, 196], kaynak: [1160, 40] },
    yanL: { c: [222, 580], kaynak: [-80, 700] }, yanR: { c: [858, 580], kaynak: [1160, 700] },
    koseL: { c: [236, 1350], kaynak: [-80, 1230] }, koseR: { c: [844, 1350], kaynak: [1160, 1230] },
    altL: { c: [330, 1748], kaynak: [150, 2010] }, altR: { c: [750, 1748], kaynak: [930, 2010] },
  },
} : {
  logo: { cx: 960, cy: 412, s: 1.0 },
  ad: { top: 676, boyut: 132 }, cumle: { top: 872, boyut: 50, en: 1600 },
  br: [150, 104], dol: [0.6, 0.64], kalin: 5, nokta: 0.9,
  balon: {
    halka: { c: [672, 158], kaynak: [520, -90] }, carpi: { c: [1248, 158], kaynak: [1400, -90] },
    yanL: { c: [250, 300], kaynak: [-90, 200] }, yanR: { c: [1670, 300], kaynak: [2010, 200] },
    koseL: { c: [250, 790], kaynak: [-90, 900] }, koseR: { c: [1670, 790], kaynak: [2010, 900] },
    altL: { c: [700, 930], kaynak: [560, 1170] }, altR: { c: [1220, 930], kaynak: [1360, 1170] },
  },
};
const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];

// ---------- Zamanlama (kare)
const Z = {
  balon0: 0, balonAra: 2,            // balonlar 2 k arayla belirir
  inis0: 112, ucus: 44,              // ilk oturma ve uçuş süresi
  yuva: 3, dalgaAra: 4,              // parça arası 3 k, dalga arası +4 k
  dolum: 9, sonme: 14,               // parça dolumu (kenardan içe), balon sönmesi
};
const dalgaBasi = (d) => Z.inis0 + d * (3 * Z.yuva + Z.dalgaAra);

// ---------- Yardımcılar
function rng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ara = (a, b, t) => a + (b - a) * t;
const kis = (x) => Math.max(0, Math.min(1, x));
const f1 = (v) => v.toFixed(1);
function el(ust, ad, nit = {}) {
  const e = document.createElementNS(NS, ad);
  for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v);
  ust.appendChild(e);
  return e;
}
const merkez = (pts) => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
const kutu = (pts) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return { x0: a, y0: b, x1: c, y1: d, en: c - a, boy: d - b, kosegen: Math.hypot(c - a, d - b) }; };

// Catmull-Rom: seyrek noktalardan sık nokta (yumuşak çizim)
function sik(pts, kapali, duz, adim = 10) {
  const n = pts.length, out = [];
  const P = (i) => (kapali ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const son = kapali ? n : n - 1;
  for (let i = 0; i < son; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < adim; j++) {
      const t = j / adim;
      if (duz) { out.push([ara(p1[0], p2[0], t), ara(p1[1], p2[1], t)]); continue; }
      const t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((e) => 0.5 * (2 * p1[e] + (-p0[e] + p2[e]) * t + (2 * p0[e] - 5 * p1[e] + 4 * p2[e] - p3[e]) * t2 + (-p0[e] + 3 * p1[e] - 3 * p2[e] + p3[e]) * t3)));
    }
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}
// Yay uzunluğuyla yeniden örnekle: kapalıda n nokta (ilki tekrarlanmaz), açıkta n nokta (uçlar dahil)
function ornekle(pts, kapali, n) {
  const P = kapali ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = cum[cum.length - 1], bol = kapali ? n : n - 1, out = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const s = (L * i) / bol;
    while (j < P.length - 1 && cum[j] < s) j++;
    const t = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
    out.push([ara(P[j - 1][0], P[j][0], t), ara(P[j - 1][1], P[j][1], t)]);
  }
  return out;
}
// Parça çevresi: köşeler dahil, kenar boyuna orantılı nokta (kenar başına en az 2)
function cevre(poly, NT = 64) {
  let per = 0;
  poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); });
  const pts = [], kose = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length], c = Math.max(2, Math.round((NT * Math.hypot(b[0] - a[0], b[1] - a[1])) / per));
    kose.push(pts.length);
    for (let j = 0; j < c; j++) pts.push([ara(a[0], b[0], j / c), ara(a[1], b[1], j / c)]);
  });
  return { pts, kose };
}
// Noktalardan yumuşak yol (Catmull-Rom → kübik Bézier), insan.js yol() ile aynı biçim
function yolD(v, kapali) {
  const n = v.length;
  if (n < 2) return '';
  const P = (i) => (kapali ? v[(i + n) % n] : v[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(v[0][0])} ${f1(v[0][1])}`;
  const son = kapali ? n : n - 1;
  for (let i = 0; i < son; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return kapali ? d + 'Z' : d;
}
const cokgenD = (poly) => 'M' + poly.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L') + 'Z';
// Dışbükey çokgenin iç teğet yarıçapı (yaklaşık): iç noktalar ızgarasında kenarlara en büyük en küçük uzaklık
function icYaricap(poly) {
  const kb = kutu(poly);
  let en = 0;
  for (let i = 1; i < 24; i++) for (let j = 1; j < 24; j++) {
    const p = [kb.x0 + (kb.en * i) / 24, kb.y0 + (kb.boy * j) / 24];
    let d = Infinity, ic = true;
    poly.forEach((a, n) => {
      const b = poly[(n + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey);
      const sd = (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) / L; // işaretli uzaklık
      d = Math.min(d, Math.abs(sd));
      if (n === 0) ic = sd; else if (Math.sign(sd) !== Math.sign(ic)) ic = false;
    });
    if (ic !== false) en = Math.max(en, d);
  }
  return en;
}

// Kaynama: 8 fps, 4 çizim. Sapma çapaları 6 noktada bir, aralar doğrusal (çizgi titrer ama tırtıklanmaz)
const kaynaIndis = (t) => Math.floor(t * 8) % 4;
function kaynama(tohum, n, kapali) {
  const capa = Math.max(2, Math.ceil(n / 6) + 1);
  const tablo = [0, 1, 2, 3].map((i) => { const r = rng(tohum * 131 + i * 977); return Array.from({ length: capa * 2 }, () => (r() - 0.5) * 2); });
  return (ki, i) => {
    const u = (i / 6), a = Math.floor(u), f = u - a, T = tablo[ki];
    const b = kapali ? (a + 1) % capa : Math.min(capa - 1, a + 1), a2 = a % capa;
    return [ara(T[a2 * 2], T[b * 2], f), ara(T[a2 * 2 + 1], T[b * 2 + 1], f)];
  };
}

// ---------- Sahne
const sahne = document.getElementById('sahne'), svg = document.getElementById('cizim'), yaziKat = document.getElementById('yazi');
const sayac = document.getElementById('sayac'), hataEl = document.getElementById('hata');
for (const e of [sahne, yaziKat]) Object.assign(e.style, { width: W + 'px', height: H + 'px' });
svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();
if (q.get('sayac') === '0' || CEKIM) sayac.hidden = true;

const tanim = el(svg, 'defs');
const balonKat = el(svg, 'g'), logoKap = el(svg, 'g'), dolguKat = el(logoKap, 'g'), konturKat = el(svg, 'g');
const logoYol = el(logoKap, 'path', { fill: M, 'fill-rule': 'evenodd', d: '' });
logoYol.setAttribute('d', LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')));
const tl = gsap.timeline({ paused: true });

// ---------- Balon: tümsekli bulut (4 kaynama çizimi önceden) + kenara giden 3 nokta
function balonKur(ad, sira) {
  const B = D.balon[ad], [cx, cy] = B.c, [rx, ry] = D.br;
  const g = el(balonKat, 'g');
  const yon = [B.kaynak[0] - cx, B.kaynak[1] - cy], yl = Math.hypot(...yon), u = [yon[0] / yl, yon[1] / yl];
  // Bulut kenarının kaynak yönündeki noktası (elips)
  const ek = 1 / Math.hypot(u[0] / rx, u[1] / ry);
  const noktalar = [[30, 15], [66, 11], [98, 8]].map(([d, r]) => [cx + u[0] * (ek + d * D.nokta), cy + u[1] * (ek + d * D.nokta), r * D.nokta]);
  const nk = noktalar.map(() => el(g, 'path', { fill: BALON, stroke: M, 'stroke-width': 4 }));
  const bg = el(g, 'g');
  const dolgu = el(bg, 'path', { fill: BALON });
  const kontur = el(bg, 'path', { fill: 'none', stroke: M, 'stroke-width': D.kalin, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const n = 11, rr = rng(sira * 17 + 5), wv = Array.from({ length: n }, () => 0.75 + rr() * 0.5), top = wv.reduce((a, b) => a + b, 0);
  const aci = []; let acc = 0;
  for (let i = 0; i < n; i++) { aci.push((acc / top) * Math.PI * 2 - Math.PI * 0.62); acc += wv[i]; }
  const cizimler = [0, 1, 2, 3].map((ki) => {
    const r = rng(sira * 911 + ki * 37), sp = () => (r() - 0.5) * 3.2;
    const P = (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    const N = (a) => { const x = Math.cos(a) / rx, y = Math.sin(a) / ry, l = Math.hypot(x, y); return [x / l, y / l]; };
    const uc = aci.map((a) => { const p = P(a); return [p[0] + sp(), p[1] + sp()]; });
    let d = `M${f1(uc[0][0])} ${f1(uc[0][1])}`;
    for (let i = 0; i < n; i++) {
      const a0 = aci[i], a1 = i + 1 < n ? aci[i + 1] : aci[0] + Math.PI * 2;
      const p0 = P(a0), p1 = P(a1), n0 = N(a0), n1 = N(a1), b = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 0.62;
      const c1 = [p0[0] + n0[0] * b + (p1[0] - p0[0]) * 0.08 + sp(), p0[1] + n0[1] * b + (p1[1] - p0[1]) * 0.08 + sp()];
      const c2 = [p1[0] + n1[0] * b - (p1[0] - p0[0]) * 0.08 + sp(), p1[1] + n1[1] * b - (p1[1] - p0[1]) * 0.08 + sp()];
      const q1 = uc[(i + 1) % n];
      d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(q1[0])} ${f1(q1[1])}`;
    }
    const nok = noktalar.map(([x, y, rad], j) => yolD(ov(x + sp() * 0.3, y + sp() * 0.3, rad, rad * 0.86, 10), true));
    return { d: d + 'Z', nok };
  });
  const h = {
    ad, g, bg, nk, kontur,
    ciz(ki) { const c = cizimler[ki]; dolgu.setAttribute('d', c.d); kontur.setAttribute('d', c.d); c.nok.forEach((d, j) => nk[j].setAttribute('d', d)); },
  };
  h.ciz(0);
  // Beliriş: noktalar kenardan balona (küçükten büyüğe), sonra bulut ve konturu
  const k0 = Z.balon0 + sira * Z.balonAra;
  const koken = `${f1(50 + u[0] * 40)}% ${f1(50 + u[1] * 40)}%`;
  gsap.set([...nk].reverse(), { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(bg, { scale: 0.3, autoAlpha: 0, transformOrigin: koken });
  tl.fromTo([...nk].reverse(), { scale: 0 }, { scale: 1, duration: k(8), ease: 'back.out(1.7)', stagger: k(3), immediateRender: false }, k(k0));
  tl.fromTo(bg, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: k(14), ease: 'back.out(1.2)', immediateRender: false }, k(k0 + 6));
  tl.fromTo(kontur, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, k(k0 + 6));
  tl.set(kontur, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(k0 + 19));
  h.k0 = k0;
  h.sondur = (s0) => {
    tl.to(nk, { scale: 0, duration: k(8), ease: E.EI, stagger: k(2) }, k(s0));
    tl.to(bg, { autoAlpha: 0, scale: 0.82, duration: k(Z.sonme), ease: E.EI }, k(s0 + 2));
  };
  return h;
}

// ---------- Kontur: balondaki çizimden logonun bir parçasına (nokta eşleme)
const konturlar = [], dolgular = [];
function konturKur(grup, balon, cizimParca, parcaNo, inis, tohum, j, yer) {
  const kaynakPts = cizimParca.p.map(([x, y]) => [yer.x + x * yer.s, yer.y + y * yer.s]);
  const yogun = sik(kaynakPts, !!cizimParca.kapali, !!cizimParca.duz);
  const hedefPoly = PARCA[parcaNo].map(logoNokta);
  const { pts: T, kose } = cevre(hedefPoly);
  const kap = !!cizimParca.kapali, Nt = T.length, n = kap ? Nt : Nt + 1;
  const S = ornekle(yogun, kap, n);
  const cS = merkez(S), cT = merkez(T);
  const Sr = S.map(([x, y]) => [x - cS[0], y - cS[1]]);
  const kS = kutu(Sr), kT = kutu(T);
  const olc = kT.kosegen / (kS.kosegen || 1);
  // En iyi başlangıç ve yön: kaynak noktaları hedefe en az kayarak otursun (açık kontur köşeden başlar ve kapanır)
  let en = null;
  for (const s of (kap ? T.map((_, i) => i) : kose)) for (const yon of [1, -1]) {
    let c = 0;
    for (let i = 0; i < n; i++) { const b = T[(((s + yon * i) % Nt) + Nt) % Nt]; c += (Sr[i][0] * olc - (b[0] - cT[0])) ** 2 + (Sr[i][1] * olc - (b[1] - cT[1])) ** 2; }
    if (!en || c < en.c) en = { c, s, yon };
  }
  const Tr = Array.from({ length: n }, (_, i) => { const b = T[(((en.s + en.yon * i) % Nt) + Nt) % Nt]; return [b[0] - cT[0], b[1] - cT[1]]; });
  // Uçuş eğrisi: kaynaktan hedefe, dışa doğru bükülen ikinci derece Bézier
  const dx = cT[0] - cS[0], dy = cT[1] - cS[1], L = Math.hypot(dx, dy);
  const isaret = cS[0] < W / 2 ? 1 : -1;
  const buk = (0.16 + 0.05 * (j % 3)) * isaret * (DIKEY ? -1 : 1);
  const kontrol = [cS[0] + dx * 0.5 - (dy / L) * L * buk, cS[1] + dy * 0.5 + (dx / L) * L * buk];
  const yolEl = el(konturKat, 'path', { fill: 'none', stroke: M, 'stroke-width': D.kalin, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const kirpId = `parca-${parcaNo}`;
  el(el(tanim, 'clipPath', { id: kirpId }), 'path', { d: cokgenD(hedefPoly) });
  const dolguEl = el(el(dolguKat, 'g', { 'clip-path': `url(#${kirpId})` }), 'path', { fill: 'none', stroke: M, 'stroke-linejoin': 'miter', d: cokgenD(hedefPoly), 'stroke-width': 0 });
  const ic = icYaricap(hedefPoly);
  const kay = kaynama(tohum, n, kap);
  const durum = { ciz: 0 }; // balonda çizilme oranı (0..1), tl ile
  const ucus0 = inis - Z.ucus;
  const h = { grup, yolEl, dolguEl, durum, inis, ucus0, hedefPoly };
  h.render = (t) => {
    const kare = t * FPS, ki = kaynaIndis(t);
    const u = kis((kare - ucus0) / Z.ucus);
    if (kare >= inis) {
      // Oturdu: kesin parça kenarı; kontur incelir, parça dolar
      const v = kis((kare - inis + 1) / Z.dolum);
      yolEl.setAttribute('d', cokgenD(hedefPoly));
      yolEl.setAttribute('stroke-width', f1(ara(2.6, 1.2, v)));
      dolguEl.setAttribute('stroke-width', f1(ara(2.6, 2 * ic + 4, DOLUM_EGRI(v))));
      dolguEl.setAttribute('fill', v >= 1 ? M : 'none');
      return;
    }
    dolguEl.setAttribute('stroke-width', 0);
    dolguEl.setAttribute('fill', 'none');
    const g = YOL_EGRI(u), m = BICIM_EGRI(kis((u - 0.28) / 0.72));
    const a = 1.3 * (1 - m) * (D.kalin / 5);
    const c = [ara(ara(cS[0], kontrol[0], g), ara(kontrol[0], cT[0], g), g), ara(ara(cS[1], kontrol[1], g), ara(kontrol[1], cT[1], g), g)];
    const sOl = ara(1, Math.sqrt(olc), g);
    const P = Sr.map((s, i) => {
      const [jx, jy] = kay(ki, i);
      return [c[0] + ara(s[0] * sOl, Tr[i][0], m) + jx * a, c[1] + ara(s[1] * sOl, Tr[i][1], m) + jy * a];
    });
    yolEl.setAttribute('stroke-width', f1(ara(D.kalin, 2.6, m)));
    if (u <= 0) {
      // Balonda: çizilme oranı kadarını göster (kapalı kontur ilk noktaya dönerek kapanır)
      const w = durum.ciz;
      if (w <= 0) { yolEl.setAttribute('d', ''); return; }
      const dizi = kap ? [...P, P[0]] : P, son = (dizi.length - 1) * w, i0 = Math.floor(son);
      const parca = dizi.slice(0, i0 + 1);
      if (i0 < dizi.length - 1) { const f = son - i0; parca.push([ara(dizi[i0][0], dizi[i0 + 1][0], f), ara(dizi[i0][1], dizi[i0 + 1][1], f)]); }
      yolEl.setAttribute('d', w >= 1 ? yolD(P, kap) : yolD(parca, false));
      return;
    }
    // Uçuşta: açık kontur, biçim tamamlanınca kendiliğinden kapanır (son nokta = ilk nokta)
    yolEl.setAttribute('d', yolD(P, kap));
  };
  konturlar.push(h);
  return h;
}

// ---------- Kurulum
const balonlar = {};
let sonInis = 0;
function kur() {
  BALON_SIRA.forEach((ad, i) => { balonlar[ad] = balonKur(ad, i); });
  let tohum = 1;
  for (const grup of GRUPLAR) {
    const cizim = CIZIM[grup.cizim], balon = balonlar[grup.ad];
    // Çizim balonun içine sığar: sınır kutusu balonun dol oranına ölçeklenir, ortası balon ortasına gelir
    const ck = kutu(cizim.flatMap((c) => c.p)), B = D.balon[grup.ad];
    const yS = Math.min((2 * D.br[0] * D.dol[0]) / ck.en, (2 * D.br[1] * D.dol[1]) / ck.boy);
    const yer = { s: yS, x: B.c[0] - ((ck.x0 + ck.x1) / 2) * yS, y: B.c[1] + D.br[1] * 0.03 - ((ck.y0 + ck.y1) / 2) * yS };
    if (cizim.length !== grup.parca.length) throw new Error(`${grup.ad}: ${cizim.length} kontur, ${grup.parca.length} parça`);
    // Kontur → parça eşlemesi: çizim içindeki konum ve boy ile grup içindeki konum ve boy en yakın olsun (tüm permütasyonlar)
    const cz = cizim.map((c) => { const kb = kutu(c.p); return { m: [(kb.x0 + kb.x1) / 2, (kb.y0 + kb.y1) / 2], b: kb.kosegen }; });
    const pz = grup.parca.map((no) => { const kb = kutu(PARCA[no]); return { m: [(kb.x0 + kb.x1) / 2, (kb.y0 + kb.y1) / 2], b: kb.kosegen }; });
    const norm = (z) => { const kb = kutu(z.map((o) => o.m)), s = Math.max(kb.en, kb.boy) || 1, bt = z.reduce((a, o) => a + o.b, 0) / z.length; return z.map((o) => ({ m: [(o.m[0] - (kb.x0 + kb.x1) / 2) / s, (o.m[1] - (kb.y0 + kb.y1) / 2) / s], b: o.b / bt })); };
    const cn = norm(cz), pn = norm(pz);
    let enIyi = null;
    const perm = (dizi, n = dizi.length) => (n <= 1 ? [dizi.slice()] : dizi.flatMap((x, i) => perm([...dizi.slice(0, i), ...dizi.slice(i + 1)], n - 1).map((r) => [x, ...r])));
    for (const p of perm(cizim.map((_, i) => i))) {
      let c = 0;
      p.forEach((ci, pi) => { c += (cn[ci].m[0] - pn[pi].m[0]) ** 2 + (cn[ci].m[1] - pn[pi].m[1]) ** 2 + 0.3 * Math.log(cn[ci].b / pn[pi].b) ** 2; });
      if (!enIyi || c < enIyi.c) enIyi = { c, p };
    }
    const hs = grup.parca.map((no, pi) => {
      const yuva = grup.cift ? Math.floor(pi / 2) : pi;
      const inis = dalgaBasi(grup.dalga) + yuva * Z.yuva;
      sonInis = Math.max(sonInis, inis);
      return { pi, no, inis, ci: enIyi.p[pi] };
    });
    // Balonda çizilme sırası: çizimdeki kontur sırası; uçuş sırası: oturma sırası
    for (const o of hs) {
      const h = konturKur(grup, balon, cizim[o.ci], o.no, o.inis, tohum++, o.pi, yer);
      h.ci = o.ci;
    }
    const grupK = konturlar.filter((h) => h.grup === grup).sort((a, b) => a.ci - b.ci);
    grupK.forEach((h, i) => tl.fromTo(h.durum, { ciz: 0 }, { ciz: 1, duration: k(12), ease: 'power2.inOut', immediateRender: false }, k(balon.k0 + 10 + i * 2)));
    balon.sondur(Math.min(...grupK.map((h) => h.ucus0)) - 10);
  }
  // Logo tamam: parçalar yerine tek kesin yol (dikiş yok), küçük bir "tık"
  const tam = sonInis + Z.dolum + 1;
  gsap.set(logoYol, { autoAlpha: 0 });
  tl.set(logoYol, { autoAlpha: 0 }, 0);
  tl.set(logoYol, { autoAlpha: 1 }, k(tam));
  tl.set([dolguKat, konturKat], { autoAlpha: 1 }, 0);
  tl.set([dolguKat, konturKat], { autoAlpha: 0 }, k(tam));
  gsap.set(logoKap, { svgOrigin: `${D.logo.cx} ${D.logo.cy}` });
  tl.to(logoKap, { scale: 1.022, duration: k(5), ease: 'power2.out' }, k(tam));
  tl.to(logoKap, { scale: 1, duration: k(14), ease: 'power2.inOut' }, k(tam + 5));
  yazilariKur(tam + 6);
  tl.to({}, { duration: k(1) }, k(TOPLAM - 1));
}

// ---------- Yazılar: "OKTOS" harf harf (Big Shoulders Display 900), ardından slogan kelime kelime
function yazilariKur(k0) {
  const ad = document.createElement('p');
  ad.className = 'ad';
  Object.assign(ad.style, { top: D.ad.top + 'px', fontSize: D.ad.boyut + 'px' });
  const harfler = [...'OKTOS'].map((h) => { const m = document.createElement('span'); m.className = 'm'; const s = document.createElement('span'); s.className = 'h'; s.textContent = h; m.appendChild(s); ad.appendChild(m); return s; });
  yaziKat.appendChild(ad);
  gsap.set(harfler, { yPercent: 110 });
  tl.fromTo(harfler, { yPercent: 110 }, { yPercent: 0, duration: k(18), ease: E.EO, stagger: k(4), immediateRender: false }, k(k0));

  const cumle = document.createElement('p');
  cumle.className = 'cumle';
  Object.assign(cumle.style, { top: D.cumle.top + 'px', fontSize: D.cumle.boyut + 'px', width: D.cumle.en + 'px', left: (W - D.cumle.en) / 2 + 'px', right: 'auto' });
  const kelimeler = [];
  const parcalar = [['3B', 'bir', 'fikrin', 'mi', 'var?'], ['Gerçeğe', 'dönüştürelim.']];
  parcalar.forEach((satir, si) => {
    satir.forEach((kel, ki) => {
      const m = document.createElement('span'); m.className = 'm';
      const s = document.createElement(si === 1 ? 'b' : 'span'); s.className = 'k'; s.textContent = kel;
      m.appendChild(s); cumle.appendChild(m); kelimeler.push(s);
      if (ki < satir.length - 1) cumle.appendChild(document.createTextNode(' '));
    });
    if (si === 0) cumle.appendChild(DIKEY ? document.createElement('br') : document.createTextNode(' '));
  });
  yaziKat.appendChild(cumle);
  gsap.set(kelimeler, { yPercent: 150 });
  tl.fromTo(kelimeler, { yPercent: 150 }, { yPercent: 0, duration: k(34), ease: E.EO, stagger: k(4), immediateRender: false }, k(k0 + 40));
}

// ---------- Kare kurulumu: zaman çizelgesi + konturlar + balon kaynaması
let sonKi = -1;
function ciz(t) {
  const ki = kaynaIndis(t);
  if (ki !== sonKi) { for (const b of Object.values(balonlar)) b.ciz(ki); sonKi = ki; }
  for (const h of konturlar) h.render(t);
}
function sayacYaz(t) {
  if (sayac.hidden) return;
  sayac.textContent = `k ${String(Math.round(t * FPS)).padStart(3, '0')} · ${t.toFixed(2)} sn`;
}
function kareKur(t) {
  tl.seek(Math.max(t, 1e-4), false); // seek(0) 0. sn'deki set'leri uygulamıyor
  ciz(t);
  sayacYaz(t);
}
tl.eventCallback('onUpdate', () => { ciz(tl.time()); sayacYaz(tl.time()); });
if (CEKIM) { gsap.ticker.lagSmoothing(0); document.getElementById('tekrar').hidden = true; }
window.tanitim = { tl, kare: kareKur, sure: () => tl.duration(), konturlar, Z };
await Promise.all([
  document.fonts.load(`900 ${D.ad.boyut}px "Big Shoulders Display"`, 'OKTOS'),
  document.fonts.load(`400 ${D.cumle.boyut}px "Schibsted Grotesk"`, '3B bir fikrin mi var?'),
  document.fonts.load(`700 ${D.cumle.boyut}px "Schibsted Grotesk"`, 'Gerçeğe dönüştürelim.'),
]).catch(() => {});
await document.fonts.ready;
try { kur(); } catch (e) { console.error(e); hataEl.textContent = e.message; }
kareKur(1e-4);
if (CEKIM) window.tanitimHazir = true;
else if (q.get('t') !== null) {
  const hedef = +q.get('t');
  for (let t = 0; t < hedef; t = Math.min(hedef, t + 1 / FPS)) tl.seek(t, false);
  kareKur(hedef);
} else {
  tl.timeScale(+(q.get('hiz') || 1));
  tl.play(0);
  document.getElementById('tekrar').addEventListener('click', () => location.reload());
}
