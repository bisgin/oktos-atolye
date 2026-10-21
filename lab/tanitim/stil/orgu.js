// Örgüyle yazılan slogan (stil denemesi, filmin kapanış satırı; ≈4,3 sn akış + 1 sn bekleme, 60 fps).
// Akış: logonun ve "OKTOS"un altında iki örgü şişi aşağıdan gelir, "hayaller"i ilmek ilmek örer (her harfin tek çizgilik
// iskeleti boyunca V biçimli ilmek zinciri; şişler 12 fps tıkla çaprazlanır, her tıkta birkaç ilmek patlar, harf
// aralarında şişler kalkıp bir sonraki harfe atlar), son ilmekte iki tıkla bağlar, yün kopar → sol şiş düşer, sağ şiş
// kalem gibi dönüp satırın başına uçar ve tek bir yün çizgisiyle "Dokunulabilir"i el yazısıyla yazar (eğride yavaşlar,
// düzlükte hızlanır), iki i'nin noktasını düğüm olarak vurur, kadrajdan çıkar. Satır "Dokunulabilir hayaller" kalır.
// Harf iskeletleri bu dosyada elle tanımlandı (yazı tipi dosyası ya da dış kaynaklı kontur yok).
// Yatay: tek satır. Dikey: iki satır ("Dokunulabilir" üstte, "hayaller" altta; telefonda okunurluk için büyük).
// Logo ve "OKTOS" yalnız yer tutucu (filmdeki yer ve boy, logo.js ile aynı), hareketsiz.
// Kare hızı: konum 60 fps; şiş pozu ve ilmek patlaması 12 fps tık (5 karede bir).
// Sorgu: ?yon=yatay|dikey ?t=2.4 (kareyi dondur) ?hiz=0.5 ?sayac=0 ?cek=1 (scripts/film-cek.py, scripts/film-kare.py)
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';

gsap.registerPlugin(CustomEase);
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const FPS = 60;
const k = (n) => n / FPS; // kare → saniye
const NS = 'http://www.w3.org/2000/svg';
const M = '#1d1d20', GRI = '#cfc9bd';
const IP = '#bf5519', IP_KOYU = '#6b2a0a', IP_ACIK = '#e9a06a'; // yün: vurgu turuncusu, gölge ve parlaklık
const SIS = '#d9bd8e', SIS_ACIK = '#f3e3c4'; // bambu şiş

// ---------- Eğriler (film.js ile aynı adlar)
const E = {
  EO: CustomEase.create('EO', '0.16,1,0.3,1'),   // yavaşlayarak oturur
  EI: CustomEase.create('EI', '0.7,0,0.84,0'),   // çıkış
  KM: CustomEase.create('KM', '0.65,0,0.35,1'),  // yer değiştirme
};
const P2O = gsap.parseEase('power2.out');
const PATLA = gsap.parseEase('back.out(2.4)'); // ilmek ve düğüm patlaması

// ---------- Logo (core/logo-beyaz.svg, viewBox 674 × 531.75; logo.js ile aynı yol)
const LOGO_D = 'M337,40 L194.5,182.5 L279.25,267.25 L242,304.5 L157,304.5 L157,240 L198.5,281.5 L198.5,212.5 L118,212.5 L118,343 L203.5,343 L115,431.5 L73,431.5 L73,377 L108.5,412.5 L108.5,358 L40,358 L40,472 L137.5,472 L177.75,431.75 L237.75,491.75 L321.25,408.25 L276.25,363.25 L239,400.5 L275.5,400.5 L242,434 L208.75,400.75 L277.75,331.75 L337,391 L396.25,331.75 L465.25,400.75 L432,434 L398.5,400.5 L435,400.5 L397.75,363.25 L352.75,408.25 L436.25,491.75 L496.25,431.75 L536.5,472 L634,472 L634,358 L565.5,358 L565.5,412.5 L601,377 L601,431.5 L559,431.5 L470.5,343 L556,343 L556,212.5 L475.5,212.5 L475.5,281.5 L517,240 L517,304.5 L432,304.5 L394.75,267.25 L479.5,182.5 Z M393.5,182.5 L337,239 L280.5,182.5 L337,126 Z M337,157 L311.5,182.5 L337,208 L362.5,182.5 Z M376,303.5 L337,342.5 L298,303.5 L337,264.5 Z';
const LOGO_ORTA = [337, 265.875];

// ---------- Yerleşim. X: harf gövdesi (x-yüksekliği) piksel; taban: satır taban çizgileri; top: yün yumağı (kadraj dışı)
const D = DIKEY ? {
  logo: { cx: 540, cy: 840, s: 1.3 }, ad: { top: 1196, boyut: 176 },
  X: 86, taban: [1590, 1776], top: [1010, 2010],
} : {
  logo: { cx: 960, cy: 412, s: 1.0 }, ad: { top: 676, boyut: 132 },
  X: 58, taban: [978], top: [1700, 1150],
};
const X = D.X;
const CIZ = Math.max(1.4, 0.024 * X); // dış çizgi kalınlığı

// ---------- Ölçüler (X biriminde)
const ADIM = 0.2;       // ilmek aralığı (zincir boyunca)
const ZINCIR = 0.28;    // zincir eni (iki bacak arası)
const HARF_ARA = 0.16;  // örgü harfleri arası boşluk
const KELIME_ARA = 1.0;  // yatayda "Dokunulabilir" ile "hayaller" arası
const YUN = 0.115;      // yazı yününün kalınlığı
const SIS_BOY = 3.9 * X, SIS_KAL = 0.135 * X;
const KALEM_ACI = -56;  // sağ şiş kalem tutuşunda (uçtan sapa yön, derece; sap sağ üstte)

// ---------- Zamanlama (kare)
const TIK = 5;                                // 12 fps
const TIK_HARF = [3, 3, 2, 3, 1, 1, 3, 2];    // h a y a l l e r: harf başına tık (ll hızlı, e r yavaşlar)
const Z = { orgu0: 14, ucus: 22, yaz: 70, hop: 8, vur: 4, cikis: 18, bekle: 60 };

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
const araN = (a, b, t) => [ara(a[0], b[0], t), ara(a[1], b[1], t)];
const kis = (x) => Math.max(0, Math.min(1, x));
const f1 = (v) => v.toFixed(1);
const RAD = Math.PI / 180;
function el(ust, ad, nit = {}) {
  const e = document.createElementNS(NS, ad);
  for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v);
  ust.appendChild(e);
  return e;
}
// Elips yayı (derece; y aşağı, açı artınca saat yönü)
const yay = (cx, cy, rx, ry, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + ((a1 - a0) * i) / n) * RAD;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
});
function birikim(P) {
  const c = [0];
  for (let i = 1; i < P.length; i++) c.push(c[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return c;
}
// Kırık çizgide s uzunluğundaki nokta ve teğet (ikili arama)
function noktaAt(P, c, s) {
  s = Math.max(0, Math.min(c[c.length - 1], s));
  let lo = 0, hi = c.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
  const u = (s - c[lo]) / ((c[hi] - c[lo]) || 1);
  const dx = P[hi][0] - P[lo][0], dy = P[hi][1] - P[lo][1], L = Math.hypot(dx, dy) || 1;
  return { p: araN(P[lo], P[hi], u), t: [dx / L, dy / L], i: lo };
}
// Eşit aralıklı yeniden örnekleme (adım yaklaşık)
function esitle(P, adim) {
  const c = birikim(P), L = c[c.length - 1], n = Math.max(2, Math.round(L / adim) + 1);
  return Array.from({ length: n }, (_, i) => noktaAt(P, c, (L * i) / (n - 1)).p);
}
// Merkezcil Catmull-Rom: seyrek el yazısı noktalarından sık nokta (aşma ve ilmek taşması az)
function egri(P, adim) {
  const n = P.length, out = [];
  const nok = (i) => (i < 0 ? araN(P[0], P[1], -1) : i >= n ? araN(P[n - 1], P[n - 2], -1) : P[i]);
  const dt = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const li = (a, b, ta, tb, t) => araN(a, b, (t - ta) / (tb - ta));
  for (let i = 0; i < n - 1; i++) {
    const p0 = nok(i - 1), p1 = P[i], p2 = P[i + 1], p3 = nok(i + 2);
    const t0 = 0, t1 = dt(p0, p1), t2 = t1 + dt(p1, p2), t3 = t2 + dt(p2, p3);
    const m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / adim));
    for (let j = 0; j < m; j++) {
      const t = t1 + ((t2 - t1) * j) / m;
      const A1 = li(p0, p1, t0, t1, t), A2 = li(p1, p2, t1, t2, t), A3 = li(p2, p3, t2, t3, t);
      out.push(li(li(A1, A2, t0, t2, t), li(A2, A3, t1, t3, t), t1, t2, t));
    }
  }
  out.push(P[n - 1]);
  return out;
}
const yolD = (P) => 'M' + P.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L');

// ---------- Örgü harfleri: tek çizgilik iskeletler (X biriminde; sol orta çizgi x=0, taban y=0, yukarı eksi).
// Çizim yönü ilmeğin V ucunun yönüdür: gövdeler yukarıdan aşağı örülür (V'ler aşağı bakar, örgü kumaşındaki gibi).
const ORGU_HARF = {
  h: { en: 0.62, c: [[[0, -1.55], [0, 0]], [...yay(0.31, -0.62, 0.31, 0.38, 198, 360), [0.62, 0]]] },
  a: { en: 0.62, c: [yay(0.31, -0.5, 0.31, 0.5, -56, -304), [[0.62, -1], [0.62, 0]]] },
  y: { en: 0.66, c: [[[0, -1], [0.33, -0.04]], [[0.66, -1], [0.22, 0.36], [0.14, 0.48], [0.02, 0.52]]] },
  l: { en: 0, c: [[[0, -1.55], [0, 0]]] },
  e: { en: 0.64, c: [[[0.06, -0.5], ...yay(0.32, -0.5, 0.32, 0.5, 0, -312)]] },
  r: { en: 0.48, c: [[[0, -1], [0, 0]], yay(0.32, -0.6, 0.32, 0.4, 202, 300)] },
};
const ORGU_KELIME = 'hayaller';
const orguEn = [...ORGU_KELIME].reduce((a, h) => a + ORGU_HARF[h].en + ZINCIR + HARF_ARA, 0) - HARF_ARA;

// ---------- El yazısı (Dokunulabilir): harf başına seyrek noktalar (X biriminde). İlk nokta giriş, son nokta çıkış;
// harfler arası bağ Catmull-Rom'un kendisi. g: önceki çıkıştan bu girişe yatay uzaklık. nokta: i'nin düğümü.
const YAZI_HARF = {
  D: { g: 0, p: [[0.02, -0.02], [0.1, -0.75], [0.13, -1.46], [0.5, -1.5], [0.86, -1.25], [0.98, -0.72], [0.8, -0.2], [0.4, -0.01], [0.06, 0], [-0.16, 0.04], [-0.22, 0.2], [0.02, 0.27], [0.5, 0.2], [0.9, 0.06]] },
  o: { g: 0.3, p: [[0.12, 0], [0.32, -0.01], [0.55, -0.2], [0.63, -0.55], [0.5, -0.9], [0.3, -1], [0.09, -0.85], [0.02, -0.5], [0.1, -0.12], [0.3, 0], [0.5, -0.05], [0.7, -0.2]] },
  k: { g: 0.3, p: [[0.14, -1.25], [0.24, -1.55], [0.18, -1.7], [0.06, -1.6], [0.03, -1.2], [0.02, -0.6], [0.02, 0], [0.04, -0.45], [0.24, -0.82], [0.44, -0.86], [0.42, -0.62], [0.12, -0.46], [0.32, -0.36], [0.44, -0.1], [0.58, 0], [0.7, -0.03]] },
  u: { g: 0.28, p: [[0.04, -0.92], [0.03, -0.3], [0.18, -0.01], [0.42, -0.1], [0.55, -0.5], [0.58, -0.95], [0.58, -0.4], [0.62, -0.05], [0.76, -0.02]] },
  n: { g: 0.28, p: [[0.03, -0.92], [0.02, -0.4], [0.02, 0], [0.05, -0.5], [0.25, -0.95], [0.48, -0.9], [0.56, -0.5], [0.58, -0.06], [0.74, -0.02]] },
  l: { g: 0.3, p: [[0.22, -1.3], [0.27, -1.62], [0.15, -1.72], [0.05, -1.55], [0.04, -1], [0.05, -0.2], [0.15, -0.01], [0.32, -0.04]] },
  a: { g: 0.62, p: [[0.52, -0.88], [0.3, -1], [0.08, -0.82], [0.03, -0.38], [0.2, -0.01], [0.44, -0.14], [0.56, -0.6], [0.58, -1], [0.57, -0.45], [0.62, -0.05], [0.76, -0.02]] },
  b: { g: 0.3, p: [[0.22, -1.3], [0.27, -1.62], [0.15, -1.72], [0.05, -1.55], [0.03, -1], [0.04, -0.2], [0.2, 0], [0.45, -0.14], [0.56, -0.5], [0.45, -0.88], [0.26, -0.88], [0.42, -0.8], [0.62, -0.86], [0.76, -0.86]] },
  i: { g: 0.28, p: [[0.12, -0.98], [0.1, -0.35], [0.18, -0.01], [0.32, -0.04]], nokta: [0.13, -1.4] },
  r: { g: 0.28, p: [[0.04, -0.95], [0.03, -0.4], [0.03, 0], [0.05, -0.5], [0.2, -0.88], [0.4, -0.98], [0.56, -0.88]] },
};
const YAZI_KELIME = 'Dokunulabilir';
function yaziNoktalari() {
  const P = [], dugum = [];
  let cikis = null;
  for (const h of YAZI_KELIME) {
    const G = YAZI_HARF[h];
    const ox = cikis === null ? 0 : cikis + G.g - G.p[0][0];
    for (const [x, y] of G.p) P.push([ox + x, y]);
    if (G.nokta) dugum.push([ox + G.nokta[0], G.nokta[1]]);
    cikis = ox + G.p[G.p.length - 1][0];
  }
  return { P, dugum };
}

// ---------- Sahne
const sahne = document.getElementById('sahne'), svg = document.getElementById('cizim'), arka = document.getElementById('arka');
const yaziKat = document.getElementById('yazi'), sayac = document.getElementById('sayac'), hataEl = document.getElementById('hata');
for (const e of [sahne, yaziKat]) Object.assign(e.style, { width: W + 'px', height: H + 'px' });
for (const s of [svg, arka]) { s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('width', W); s.setAttribute('height', H); }
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();
if (q.get('sayac') === '0' || CEKIM) sayac.hidden = true;

// Yer tutucular: logo açık kontur, "OKTOS"
const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];
el(arka, 'path', { fill: 'none', stroke: GRI, 'stroke-width': 2.5, 'stroke-linejoin': 'round',
  d: LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')) });
const ad = document.createElement('p');
ad.className = 'ad';
ad.textContent = 'OKTOS';
Object.assign(ad.style, { top: D.ad.top + 'px', fontSize: D.ad.boyut + 'px' });
yaziKat.appendChild(ad);

const yaziKatman = el(svg, 'g'), ilmekKat = el(svg, 'g'), dugumKat = el(svg, 'g'), ipKat = el(svg, 'g'), sisKat = el(svg, 'g');
const tl = gsap.timeline({ paused: true });
const S = { giris: 0, sol: 0, ucus: 0, kes: 0, yazi: 0, cikis: 0 };

// ---------- Yün çizgisi: dış gölge + gövde + eğik büküm izleri + parlaklık
const BUKUM_ARA = 0.085; // X biriminde, büküm izleri arası
// Büküm izleri: yol boyunca eşit aralıklı, yüne çapraz kısa çizgiler (halat gibi bükülmüş iplik)
function bukumler(P, kalin) {
  const c = birikim(P), L = c[c.length - 1], adim = BUKUM_ARA * X, out = [];
  const a = 0.4 * kalin, b = 0.32 * kalin;
  for (let s = adim * 0.5; s < L; s += adim) {
    const { p, t } = noktaAt(P, c, s), n = [-t[1], t[0]];
    out.push(`M${f1(p[0] - n[0] * a - t[0] * b)} ${f1(p[1] - n[1] * a - t[1] * b)} L${f1(p[0] + n[0] * a + t[0] * b)} ${f1(p[1] + n[1] * a + t[1] * b)}`);
  }
  return out;
}
function yunKur(ust, kalin) {
  const g = el(ust, 'g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const dis = el(g, 'path', { stroke: IP_KOYU, 'stroke-width': f1(kalin + 2 * CIZ) });
  const ic = el(g, 'path', { stroke: IP, 'stroke-width': f1(kalin) });
  const bukum = el(g, 'path', { stroke: IP_KOYU, 'stroke-width': f1(Math.max(1, kalin * 0.16)), opacity: 0.5 });
  const parlak = el(g, 'path', { stroke: IP_ACIK, 'stroke-width': f1(kalin * 0.24), transform: `translate(${f1(-0.012 * X)} ${f1(-0.02 * X)})`, opacity: 0.8 });
  return {
    g, kalin,
    yaz(d, bd = '') { for (const y of [dis, ic, parlak]) y.setAttribute('d', d); bukum.setAttribute('d', bd); },
    // Sabit yün parçası (uçlar): yol ve büküm birlikte
    sabit(P) { this.yaz(yolD(P), bukumler(P, kalin).join('')); },
  };
}

// ---------- İlmek: V biçiminde iki bacak (yaprak elips), uç zincirin ilerleme yönünde
const ilmekler = [];
function ilmekKur(p, t, harf, r) {
  const aci = Math.atan2(t[1], t[0]) / RAD + (r() - 0.5) * 7;
  const g = el(ilmekKat, 'g', { visibility: 'hidden' });
  const pp = ADIM * X, ww = ZINCIR * X;
  // Işık sol üstten: ekran kaymasını ilmeğin yerel eksenine çevir
  const ca = Math.cos(-aci * RAD), sa = Math.sin(-aci * RAD), lx = -0.014 * X, ly = -0.02 * X;
  const isik = [lx * ca - ly * sa, lx * sa + ly * ca];
  for (const yon of [-1, 1]) {
    const kuyruk = [-0.56 * pp, yon * 0.36 * ww], uc = [0.44 * pp, yon * 0.03 * ww];
    const cx = (kuyruk[0] + uc[0]) / 2, cy = (kuyruk[1] + uc[1]) / 2;
    const L = Math.hypot(uc[0] - kuyruk[0], uc[1] - kuyruk[1]), b = Math.atan2(uc[1] - kuyruk[1], uc[0] - kuyruk[0]) / RAD;
    const rx = L / 2 + 0.03 * X, ry = 0.066 * X;
    el(g, 'ellipse', { cx: f1(cx), cy: f1(cy), rx: f1(rx), ry: f1(ry), transform: `rotate(${f1(b)} ${f1(cx)} ${f1(cy)})`, fill: IP, stroke: IP_KOYU, 'stroke-width': f1(CIZ) });
    const hx = cx + isik[0], hy = cy + isik[1];
    el(g, 'ellipse', { cx: f1(hx), cy: f1(hy), rx: f1(rx * 0.52), ry: f1(ry * 0.3), transform: `rotate(${f1(b)} ${f1(hx)} ${f1(hy)})`, fill: IP_ACIK, opacity: 0.85 });
  }
  const il = { p, aci, g, harf, f: Infinity, son: '' };
  ilmekler.push(il);
  return il;
}

// ---------- Şiş: sivri uç, düz gövde, bilezik ve topuz. Yerel eksen: uç (0,0), sap +x yönünde.
function sisKur() {
  const g = el(sisKat, 'g');
  const L = SIS_BOY, th = SIS_KAL, uc = 0.55 * X;
  el(g, 'path', { d: `M0 0 L${f1(uc)} ${f1(-th / 2)} L${f1(L)} ${f1(-th / 2)} L${f1(L)} ${f1(th / 2)} L${f1(uc)} ${f1(th / 2)} Z`,
    fill: SIS, stroke: M, 'stroke-width': f1(CIZ * 0.9), 'stroke-linejoin': 'round' });
  el(g, 'line', { x1: f1(uc * 0.9), y1: f1(-th * 0.14), x2: f1(L - th), y2: f1(-th * 0.14), stroke: SIS_ACIK, 'stroke-width': f1(th * 0.24), 'stroke-linecap': 'round' });
  el(g, 'rect', { x: f1(L - th * 0.3), y: f1(-th * 0.8), width: f1(th * 0.55), height: f1(th * 1.6), rx: f1(th * 0.2), fill: M });
  el(g, 'circle', { cx: f1(L + th * 1.05), cy: 0, r: f1(th * 1.05), fill: M });
  return { g, koy(uc0, aci) { g.setAttribute('transform', `translate(${f1(uc0[0])} ${f1(uc0[1])}) rotate(${f1(aci)})`); } };
}
const yonu = (aci) => [Math.cos(aci * RAD), Math.sin(aci * RAD)]; // uçtan sapa birim vektör

// ---------- Kurulum
let harfler = [], tikler = [], yazi = null, dugumler = [], sisL = null, sisR = null, ip = null, kuyruk0 = null, kuyruk1 = null;
let TOPLAM = 0;
function kur() {
  // Yerleşim: yatayda tek satır (yazı + boşluk + örgü), dikeyde iki satır
  const { P: yp, dugum } = yaziNoktalari();
  const yx0 = Math.min(...yp.map((p) => p[0])), yx1 = Math.max(...yp.map((p) => p[0]));
  const yaziEn = yx1 - yx0;
  let yaziKok, orguKok; // piksel: (x, taban)
  if (DIKEY) {
    yaziKok = [(W - yaziEn * X) / 2 - yx0 * X, D.taban[0]];
    orguKok = [(W - orguEn * X) / 2, D.taban[1]];
  } else {
    const top = yaziEn + KELIME_ARA + orguEn, x0 = (W - top * X) / 2;
    yaziKok = [x0 - yx0 * X, D.taban[0]];
    orguKok = [x0 + (yaziEn + KELIME_ARA) * X, D.taban[0]];
  }

  // Örgü: harf harf ilmekler
  const r = rng(7);
  let x = orguKok[0] + (ZINCIR / 2) * X;
  harfler = [...ORGU_KELIME].map((h) => {
    const G = ORGU_HARF[h], harf = { h, ilmekler: [] };
    for (const cizgi of G.c) {
      const P = cizgi.map(([cx, cy]) => [x + cx * X, orguKok[1] + cy * X]);
      const c = birikim(P), L = c[c.length - 1], n = Math.max(2, Math.round(L / (ADIM * X)) + 1);
      for (let i = 0; i < n; i++) {
        const { p, t } = noktaAt(P, c, (L * i) / (n - 1));
        harf.ilmekler.push(ilmekKur([p[0] + (r() - 0.5) * 0.02 * X, p[1] + (r() - 0.5) * 0.02 * X], t, harf, r));
      }
    }
    x += (G.en + ZINCIR + HARF_ARA) * X;
    return harf;
  });

  // Tık planı: harf arası atlama tıkı, harf içinde ilmek tıkları (ilmekler tıkın ilk 3 karesine yayılır), sonda 2 bağlama
  let f = Z.orgu0, onceki = harfler[0].ilmekler[0].p;
  harfler.forEach((h, hi) => {
    if (hi > 0) { const b = h.ilmekler[0].p; tikler.push({ f0: f, tur: 'atla', a: onceki, b }); onceki = b; f += TIK; }
    const n = h.ilmekler.length, nt = TIK_HARF[hi];
    for (let j = 0; j < nt; j++) {
      const grup = h.ilmekler.slice(Math.round((j * n) / nt), Math.round(((j + 1) * n) / nt));
      grup.forEach((il, m) => { il.f = f + Math.floor((m * 3) / grup.length); });
      const b = grup[grup.length - 1].p;
      tikler.push({ f0: f, tur: 'ilmek', a: onceki, b });
      onceki = b; f += TIK;
    }
  });
  for (let j = 0; j < 2; j++) { tikler.push({ f0: f, tur: 'bagla', a: onceki, b: onceki }); f += TIK; }
  Z.orguSon = f;
  Z.ucus0 = Z.orguSon + 2;
  Z.yaz0 = Z.ucus0 + Z.ucus;
  Z.yazSon = Z.yaz0 + Z.yaz;
  Z.cikis0 = Z.yazSon + 2 * (Z.hop + Z.vur);
  TOPLAM = Z.cikis0 + Z.cikis + Z.bekle;

  // Yün uçları: başta (h'nin ilk ilmeği, sola sarkar) ve sonda (r'nin son ilmeği, kopunca kalır)
  const ilk = harfler[0].ilmekler[0].p, son = harfler[harfler.length - 1].ilmekler.at(-1).p;
  kuyruk0 = yunKur(ilmekKat, YUN * 0.8 * X);
  kuyruk0.sabit(egri([[0, 0], [-0.12, -0.06], [-0.24, -0.04], [-0.28, 0.06]].map(([a, b]) => [ilk[0] + a * X, ilk[1] + b * X]), 0.05 * X));
  kuyruk1 = yunKur(ilmekKat, YUN * 0.8 * X);
  kuyruk1.sabit(egri([[0, 0], [0.16, 0.0], [0.3, 0.08], [0.36, 0.24]].map(([a, b]) => [son[0] + a * X, son[1] + b * X]), 0.05 * X));
  ilmekKat.insertBefore(kuyruk0.g, ilmekKat.firstChild);
  ilmekKat.insertBefore(kuyruk1.g, ilmekKat.firstChild);

  // El yazısı yolu: sık ve eşit aralıklı noktalar; hız eğriliğe göre (dönemeçte yavaş, düzde hızlı)
  const yolP = esitle(egri(yp.map(([a, b]) => [yaziKok[0] + a * X, yaziKok[1] + b * X]), 0.01 * X), 0.02 * X);
  const c = birikim(yolP), n = yolP.length, kav = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const a1 = Math.atan2(yolP[i][1] - yolP[i - 1][1], yolP[i][0] - yolP[i - 1][0]);
    const a2 = Math.atan2(yolP[i + 1][1] - yolP[i][1], yolP[i + 1][0] - yolP[i][0]);
    let d = Math.abs(a2 - a1); if (d > Math.PI) d = 2 * Math.PI - d;
    kav[i] = d / (0.02); // radyan / X
  }
  const zaman = [0];
  for (let i = 1; i < n; i++) {
    let km = 0, sy = 0;
    for (let j = Math.max(0, i - 4); j <= Math.min(n - 1, i + 4); j++) { km += kav[j]; sy++; }
    zaman.push(zaman[i - 1] + 1 + 0.55 * Math.pow(km / sy, 0.8));
  }
  const Tson = zaman[n - 1];
  yazi = { P: yolP, c, zaman: zaman.map((z) => z / Tson), yun: yunKur(yaziKatman, YUN * X), bukum: bukumler(yolP, YUN * X) };
  dugumler = dugum.map(([a, b]) => {
    const p = [yaziKok[0] + a * X, yaziKok[1] + b * X], R = 0.1 * X;
    const g = el(dugumKat, 'g', { visibility: 'hidden' });
    el(g, 'circle', { r: f1(R), fill: IP, stroke: IP_KOYU, 'stroke-width': f1(CIZ) });
    el(g, 'path', { d: `M${f1(-R * 0.55)} ${f1(R * 0.1)} A${f1(R * 0.55)} ${f1(R * 0.5)} 0 1 1 ${f1(R * 0.35)} ${f1(R * 0.45)}`, fill: 'none', stroke: IP_KOYU, 'stroke-width': f1(CIZ * 0.9), 'stroke-linecap': 'round' });
    el(g, 'circle', { cx: f1(-R * 0.35), cy: f1(-R * 0.4), r: f1(R * 0.22), fill: IP_ACIK });
    return { p, g, f: Infinity };
  });

  // Şişler ve yumaktan gelen yün
  sisL = sisKur(); sisR = sisKur();
  ip = yunKur(ipKat, 0.07 * X);

  // Zaman çizelgesi: büyük geçişler (kalan her şey kare numarasından hesaplanır)
  tl.fromTo(S, { giris: 0 }, { giris: 1, duration: k(Z.orgu0), ease: E.EO, immediateRender: false }, 0);
  tl.fromTo(S, { sol: 0 }, { sol: 1, duration: k(18), ease: E.EI, immediateRender: false }, k(Z.orguSon - 2));
  tl.fromTo(S, { kes: 0 }, { kes: 1, duration: k(12), ease: 'power2.in', immediateRender: false }, k(Z.orguSon));
  tl.fromTo(S, { ucus: 0 }, { ucus: 1, duration: k(Z.ucus), ease: E.KM, immediateRender: false }, k(Z.ucus0));
  tl.fromTo(S, { yazi: 0 }, { yazi: 1, duration: k(Z.yaz), ease: 'power1.inOut', immediateRender: false }, k(Z.yaz0));
  tl.fromTo(S, { cikis: 0 }, { cikis: 1, duration: k(Z.cikis), ease: E.EI, immediateRender: false }, k(Z.cikis0));
  tl.to({}, { duration: k(1) }, k(TOPLAM - 1));
}

// ---------- Örgü pozları (12 fps): A = sağ şiş ilmeğe girer, B = ilmeği çekip çıkarır, N = atlama (açık)
const POZ = {
  A: { eL: 0.26, eR: 0.5, aL: 128, aR: 49 },
  B: { eL: 0.34, eR: 0.1, aL: 122, aR: 60 },
  N: { eL: 0.3, eR: 0.3, aL: 125, aR: 55 },
};
function orguPoz(f) {
  const ilk = tikler[0];
  if (f < ilk.f0) return { Q: ilk.a, ...POZ.N, kalk: 0, j: -1 };
  const j = Math.min(tikler.length - 1, Math.floor((f - Z.orgu0) / TIK)), tk = tikler[j], fi = f - tk.f0;
  if (fi >= TIK) return { Q: tk.b, ...POZ.B, kalk: 0, j };
  const r = rng(j * 31 + 3), oy = () => (r() - 0.5) * 4; // tık başına küçük el farkı (tohumlu)
  if (tk.tur === 'atla') {
    const u = E.KM(kis(fi / TIK));
    return { Q: araN(tk.a, tk.b, u), ...POZ.N, kalk: Math.sin(Math.PI * u) * 0.55 * X, j };
  }
  const u = P2O(kis(fi / 3)), poz = fi < 2 ? POZ.A : POZ.B;
  return { Q: araN(tk.a, tk.b, u), eL: poz.eL, eR: poz.eR, aL: poz.aL + oy(), aR: poz.aR + oy(), kalk: 0, j };
}
// Örgü sırasında şiş uçları: çaprazlama noktası Q'nun biraz üstünde (yeni ilmek görünsün)
function orguUclari(f) {
  const p = orguPoz(f), Q = [p.Q[0], p.Q[1] - 0.18 * X - p.kalk];
  const uL = yonu(p.aL), uR = yonu(p.aR);
  return { uL: [Q[0] - uL[0] * p.eL * X, Q[1] - uL[1] * p.eL * X], aL: p.aL, uR: [Q[0] - uR[0] * p.eR * X, Q[1] - uR[1] * p.eR * X], aR: p.aR };
}

// ---------- El yazısı: kare → yazılan uzunluk
function yaziS(u) {
  const z = yazi.zaman;
  let lo = 0, hi = z.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (z[m] <= u) lo = m; else hi = m; }
  const v = (u - z[lo]) / ((z[hi] - z[lo]) || 1);
  return ara(yazi.c[lo], yazi.c[hi], v);
}
function yaziCiz(s) {
  if (s <= 0) { yazi.yun.yaz(''); return; }
  const at = noktaAt(yazi.P, yazi.c, s), P = yazi.P.slice(0, at.i + 1);
  P.push(at.p);
  const m = Math.max(0, Math.floor(s / (BUKUM_ARA * X) - 0.5) + 1); // uca kadar gelen büküm izleri
  yazi.yun.yaz(yolD(P), yazi.bukum.slice(0, m).join(''));
}

// ---------- Kare: her şey t'den kurulur
function ciz(t) {
  const f = t * FPS;
  // İlmekler: tıkta patlar (4 kare, hafif taşma)
  for (const il of ilmekler) {
    let d;
    if (f < il.f) d = 'h';
    else {
      const sc = PATLA(kis((f - il.f + 1) / 4));
      d = `translate(${f1(il.p[0])} ${f1(il.p[1])}) rotate(${f1(il.aci)}) scale(${sc.toFixed(3)})`;
    }
    if (d === il.son) continue;
    il.son = d;
    if (d === 'h') il.g.setAttribute('visibility', 'hidden');
    else { il.g.setAttribute('visibility', 'visible'); il.g.setAttribute('transform', d); }
  }
  kuyruk0.g.setAttribute('visibility', f >= Z.orgu0 ? 'visible' : 'hidden');
  kuyruk1.g.setAttribute('visibility', f >= Z.orguSon ? 'visible' : 'hidden');

  // Şişler
  const son = orguUclari(Math.min(f, Z.orguSon - 0.001));
  if (f < Z.orguSon - 2) {
    const o = orguUclari(f), g = 1 - S.giris;
    const dy = g * (H * 0.45 + SIS_BOY * 0.4);
    sisL.koy([o.uL[0] - g * 0.6 * X, o.uL[1] + dy], o.aL + g * 12);
  } else {
    // Sol şiş kendi ekseni boyunca aşağı kayarak düşer
    const uL = yonu(son.aL), d = S.sol * (SIS_BOY + H * 0.5);
    sisL.koy([son.uL[0] + uL[0] * d, son.uL[1] + uL[1] * d], son.aL + S.sol * 14);
  }
  // Sağ şiş: örgü → uçuş (kalem tutuşuna döner) → yazı → noktalar → çıkış
  let uc, aci;
  if (f < Z.ucus0) {
    const o = orguUclari(Math.min(f, Z.orguSon - 0.001)), g = 1 - S.giris;
    uc = [o.uR[0] + g * 0.6 * X, o.uR[1] + g * (H * 0.45 + SIS_BOY * 0.4)]; aci = o.aR - g * 12;
  }
  else if (f < Z.yaz0) {
    const u = S.ucus, hedef = yazi.P[0];
    uc = araN(son.uR, hedef, u);
    uc[1] -= Math.sin(Math.PI * u) * (DIKEY ? 1.2 : 1.6) * X;
    aci = ara(son.aR, KALEM_ACI, u);
  } else {
    const s = yaziS(S.yazi), at = noktaAt(yazi.P, yazi.c, s);
    if (f < Z.yazSon) {
      uc = at.p;
      aci = KALEM_ACI + 5 * at.t[0] - 4 * at.t[1];
    } else {
      // Noktalar: önce sağdaki i, sonra soldaki; her biri uçuş + vuruş (2 kare in, 2 kare kalk)
      const yuk = 0.3 * X, fi = f - Z.yazSon, sira = [dugumler[1], dugumler[0]];
      let bas = yazi.P.at(-1);
      aci = KALEM_ACI;
      uc = bas;
      for (let m = 0; m < 2; m++) {
        const d0 = Z.hop + Z.vur, hedef = [sira[m].p[0], sira[m].p[1] - yuk];
        const yer = fi - m * d0;
        if (yer < 0) break;
        if (yer < Z.hop) {
          const u = E.KM(yer / Z.hop);
          uc = araN(bas, hedef, u); uc[1] -= Math.sin(Math.PI * u) * 0.45 * X;
        } else if (yer < d0) {
          const v = yer - Z.hop, dal = v < 2 ? v / 2 : Math.max(0, 1 - (v - 2) / 2);
          uc = [hedef[0], hedef[1] + yuk * dal];
        } else uc = hedef;
        bas = hedef;
      }
      if (f >= Z.cikis0) {
        const c = S.cikis;
        uc = [uc[0] + c * 1.5 * X, uc[1] + c * (H * 0.55 + SIS_BOY)];
        aci = KALEM_ACI + c * 30;
      }
    }
  }
  sisR.koy(uc, aci);

  // El yazısı yünü: uç nereye kadar geldiyse
  yaziCiz(f < Z.yaz0 ? 0 : f >= Z.yazSon ? yazi.c.at(-1) : yaziS(S.yazi));
  // Düğümler (i noktaları): vuruşun dibinde patlar
  dugumler[1].f = Z.yazSon + Z.hop + 2;
  dugumler[0].f = Z.yazSon + 2 * Z.hop + Z.vur + 2;
  for (const dg of dugumler) {
    if (f < dg.f) { dg.g.setAttribute('visibility', 'hidden'); continue; }
    const sc = PATLA(kis((f - dg.f + 1) / 5));
    dg.g.setAttribute('visibility', 'visible');
    dg.g.setAttribute('transform', `translate(${f1(dg.p[0])} ${f1(dg.p[1])}) scale(${sc.toFixed(3)})`);
  }

  // Yumaktan gelen yün: sağ şişin ucunun biraz gerisine sarılı; bağlamadan sonra kopup yumağa çekilir
  const tut = (o) => { const u = yonu(o.aR); return [o.uR[0] + u[0] * 0.32 * X, o.uR[1] + u[1] * 0.32 * X]; };
  const A0 = f < Z.orguSon ? tut(orguUclari(f)) : tut(son);
  if (f < Z.orgu0 * 0.4 || S.kes >= 1) ip.yaz('');
  else {
    const g = f < Z.orgu0 ? 1 - S.giris : 0;
    const A = [A0[0], A0[1] + g * (H * 0.45 + SIS_BOY * 0.4)], B = D.top;
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), sal = Math.sin(f * 0.11) * 0.03 * L;
    const C = [(A[0] + B[0]) / 2 - 0.22 * L + sal, (A[1] + B[1]) / 2 + 0.12 * L];
    const P = [];
    for (let i = 0; i <= 28; i++) {
      const u = ara(S.kes, 1, i / 28);
      P.push([(1 - u) ** 2 * A[0] + 2 * (1 - u) * u * C[0] + u * u * B[0], (1 - u) ** 2 * A[1] + 2 * (1 - u) * u * C[1] + u * u * B[1]]);
    }
    ip.yaz(yolD(P));
  }
}

function sayacYaz(t) {
  if (sayac.hidden) return;
  sayac.textContent = `k ${String(Math.round(t * FPS)).padStart(3, '0')} · ${t.toFixed(2)} sn`;
}
function kareKur(t) {
  tl.seek(Math.max(t, 1e-4), false);
  ciz(Math.max(t, 1e-4));
  sayacYaz(t);
}
tl.eventCallback('onUpdate', () => { ciz(tl.time()); sayacYaz(tl.time()); });
if (CEKIM) { gsap.ticker.lagSmoothing(0); document.getElementById('tekrar').hidden = true; }
await document.fonts.load(`900 ${D.ad.boyut}px "Big Shoulders Display"`, 'OKTOS').catch(() => {});
await document.fonts.ready;
try { kur(); } catch (e) { console.error(e); hataEl.textContent = e.message; }
window.tanitim = { tl, kare: kareKur, sure: () => tl.duration(), Z, ilmekSayisi: () => ilmekler.length, hatalar: [] };
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
