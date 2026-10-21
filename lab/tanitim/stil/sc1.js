// M2 stil kareleri: SÇ1 kanca (k150) ve montaj testinin (montaj.js) ortak stil katmanı.
// Plan: tanıtım filmi planı v04 (yerel çalışma notları) §3 #2, §4 stil kılavuzu;
// çürütme: aynı klasörde ...-curutme.md (işaretler baş-omuz kadrajında okunsun, ardışık iki yüzde en çok 1 ortak özellik).
// insan.js'e DOKUNMAZ: kisiSVG çıktısını sarmalar ve "mürekkepler" (öneri olarak insan.js'e taşınabilir):
//   - kontur kalınlığı EKRAN pikselinde verilir: 1920 genişlikte ana kontur 6 px, iç detay 3,6 px (ölçekten bağımsız)
//   - her çizgi değişken kalınlıklı dolgu şekline çevrilir: açık çizginin uçları incelir (fırça girişi), kapalı
//     şekilde alt-sağ kenar kalınlaşır (hacim), kalınlık kaynamayla birlikte hafifçe oynar (±%13)
//   - dolgu konturdan 2,5 px sağ-alta kayık (baskı kayması); gözde kâğıt rengi parıltı; boyunda çene gölgesi;
//     giysinin dibinde FDM katman izi (nozulun yüzleri "bastığı" ipucu, kadrajın alt kenarında söner)
//   - montaj yüzlerinin ayırt edici işaretleri (baret, kask, takke, yazma oyası, işitme cihazı, örgü, kurye kayışı...)
// Sorgu (sc1.html): ?yon=yatay|dikey ?dil=tr|en ?duzen=a|b (b: ön cümle yüzün solunda, varsayılan) ?kagit=0 (gren yok)
//        ?t=1.6 (kareyi dondur) ?cek=1 (film-cek.py / anlar.py)
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';
import { kisiSVG, rastgeleKisi, yol, oval, rng, MONO, BOY, GOZ_Y } from '../insan.js';

gsap.registerPlugin(CustomEase);
export { gsap };
export const q = new URLSearchParams(location.search);
export const CEKIM = q.has('cek');
export const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
export const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
export const DIL = q.get('dil') === 'en' ? 'en' : 'tr';
export const FPS = 60;
export const k = (n) => n / FPS;
export const E = {
  EO: CustomEase.create('EO', '0.16,1,0.3,1'),
  EI: CustomEase.create('EI', '0.7,0,0.84,0'),
  KM: CustomEase.create('KM', '0.65,0,0.35,1'),
};
export const STIL = {
  kagit: '#f1ede6', murekkep: '#1d1d20', vurgu: '#bf5519', vurguYazi: '#94400f',
  anaPx: 6, icPx: 3.6, kaymaPx: 2.5,
};
const M = STIL.murekkep;
// Göz çapası (montajda bütün yüzlerin gözü burada) ve karakter ölçeği (insan.js birimi → sahne pikseli).
// Yatay: plan §3 #2 (%50, %40). Dikey: sosyal güvenli alan (üst %12, alt %20) içinde yazıya üstte yer kalır.
export const CAPA = DIKEY ? { x: 540, y: 1185, S: 2.95 } : { x: 960, y: 432, S: 2.45 };

// ---------------------------------------------------------------- yol yardımcıları
const SAYI = /-?\d*\.?\d+(?:e-?\d+)?/g;
function yolNoktalari(d) {
  // insan.js yol() biçimi: M x y C ... (Z). L de okunur.
  const tok = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  const pts = [];
  let i = 0, cmd = null, cur = [0, 0], kapali = false;
  while (i < tok.length) {
    const t = tok[i];
    if (t === 'M' || t === 'C' || t === 'L' || t === 'Z') { cmd = t; if (t === 'Z') kapali = true; i++; continue; }
    if (cmd === 'M' || cmd === 'L') { cur = [+tok[i], +tok[i + 1]]; pts.push(cur); i += 2; cmd = 'L'; }
    else if (cmd === 'C') {
      const a = [+tok[i], +tok[i + 1]], b = [+tok[i + 2], +tok[i + 3]], p = [+tok[i + 4], +tok[i + 5]];
      for (let j = 1; j <= 10; j++) {
        const u = j / 10, v = 1 - u;
        pts.push([v * v * v * cur[0] + 3 * v * v * u * a[0] + 3 * v * u * u * b[0] + u * u * u * p[0],
          v * v * v * cur[1] + 3 * v * v * u * a[1] + 3 * v * u * u * b[1] + u * u * u * p[1]]);
      }
      cur = p; i += 6;
    } else i++;
  }
  if (kapali && pts.length > 2 && Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 0.05) pts.pop();
  return { pts, kapali };
}
function ornekle(pts, kapali, h) {
  const P = kapali ? [...pts, pts[0]] : pts;
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const top = L.at(-1);
  const n = Math.max(kapali ? 8 : 2, Math.round(top / h));
  const out = [];
  let j = 0;
  for (let i = 0; i < (kapali ? n : n + 1); i++) {
    const s = top * i / n;
    while (j < L.length - 2 && L[j + 1] < s) j++;
    const u = (s - L[j]) / ((L[j + 1] - L[j]) || 1);
    out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * u, P[j][1] + (P[j + 1][1] - P[j][1]) * u]);
  }
  return { p: out, top };
}
const yuvarla = (v) => Math.round(v * 100) / 100;
const nk = (q0) => `${yuvarla(q0[0])} ${yuvarla(q0[1])}`;
const daire = (x, y, r) => `M${yuvarla(x - r)} ${yuvarla(y)}a${yuvarla(r)} ${yuvarla(r)} 0 1 0 ${yuvarla(2 * r)} 0a${yuvarla(r)} ${yuvarla(r)} 0 1 0 ${yuvarla(-2 * r)} 0Z`;
const IS = [0.47, 0.88]; // "ışık" sol üstten: alt-sağa bakan kenar kalın

// Bir çizgiyi (d) değişken kalınlıklı dolgu şekline çevirir. px: ekran pikselinde ortalama kalınlık, S: birim→piksel.
export function murekkepSekli(d, px, S, tohum, { golge = true, uc = 0.32, ucBoy = 15 } = {}) {
  const { pts, kapali } = yolNoktalari(d);
  if (pts.length < 2) return '';
  const { p, top } = ornekle(pts, kapali, 2.2 / S);
  const n = p.length, w0 = px / S;
  if (top * S < 2) return daire(p[0][0], p[0][1], w0 / 2);
  // kalınlık gürültüsü (kapalı şekilde dönemli)
  const R = rng(tohum), adim = 34 / S;
  const nG = kapali ? Math.max(1, Math.round(top / adim)) : Math.ceil(top / adim) + 2;
  const gg = Array.from({ length: nG + 1 }, () => R() * 2 - 1);
  const gAdim = kapali ? top / nG : adim;
  const nor = [];
  for (let i = 0; i < n; i++) {
    const a = p[kapali ? (i - 1 + n) % n : Math.max(0, i - 1)], b = p[kapali ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    nor.push([-ty / l, tx / l]);
  }
  if (kapali) {
    let mx = 0, my = 0;
    for (const q0 of p) { mx += q0[0]; my += q0[1]; }
    mx /= n; my /= n;
    let s = 0;
    for (let i = 0; i < n; i++) s += nor[i][0] * (p[i][0] - mx) + nor[i][1] * (p[i][1] - my);
    if (s < 0) for (const v of nor) { v[0] = -v[0]; v[1] = -v[1]; }
  }
  const sm = (x) => x * x * (3 - 2 * x);
  const w = p.map((_, i) => {
    const s = top * i / (kapali ? n : n - 1);
    const x = s / gAdim, i0 = Math.floor(x), u = sm(x - i0);
    const g0 = gg[kapali ? i0 % nG : Math.min(i0, nG)], g1 = gg[kapali ? (i0 + 1) % nG : Math.min(i0 + 1, nG)];
    let f = 1 + 0.13 * (g0 * (1 - u) + g1 * u);
    if (kapali && golge) f *= 1 + 0.24 * (nor[i][0] * IS[0] + nor[i][1] * IS[1]);
    if (!kapali) {
      const Lt = Math.min(top * 0.34, ucBoy / S);
      f *= uc + (1 - uc) * sm(Math.min(1, s / Lt)) * sm(Math.min(1, (top - s) / Lt));
    }
    return w0 * f;
  });
  const sol = p.map((q0, i) => [q0[0] + nor[i][0] * w[i] / 2, q0[1] + nor[i][1] * w[i] / 2]);
  const sag = p.map((q0, i) => [q0[0] - nor[i][0] * w[i] / 2, q0[1] - nor[i][1] * w[i] / 2]).reverse();
  let dd = kapali ? `M${sol.map(nk).join('L')}ZM${sag.map(nk).join('L')}Z` : `M${sol.map(nk).join('L')}L${sag.map(nk).join('L')}Z`;
  // Uçlara yuvarlak başlık, keskin dönüşlere yuvarlak birleşim (ayrı alt yol değil, ayrı şekil: sarma yönü karışmasın)
  let nokta = '';
  if (!kapali) nokta += daire(p[0][0], p[0][1], w[0] / 2) + daire(p[n - 1][0], p[n - 1][1], w[n - 1] / 2);
  for (let i = 1; i < n - 1; i++) {
    const ax = p[i][0] - p[i - 1][0], ay = p[i][1] - p[i - 1][1], bx = p[i + 1][0] - p[i][0], by = p[i + 1][1] - p[i][1];
    const c = (ax * bx + ay * by) / ((Math.hypot(ax, ay) * Math.hypot(bx, by)) || 1);
    if (c < 0.82) nokta += daire(p[i][0], p[i][1], w[i] / 2);
  }
  return nokta ? `${dd}" /><path fill="__R__" d="${nokta}` : dd;
}

// insan.js kalınlığı (kendi birimi) → ekran pikseli. Ana kontur 4,2 → 6 px; 3–4 arası iç detay (≈3,6 px); ince tel/kırışık olduğu gibi.
export function kalinlikPx(w) {
  if (w >= 4.0) return STIL.anaPx * (w / 4.2);
  if (w >= 3.0) return w;
  return w;
}

const acikMi = (renk) => {
  const m = /^#([0-9a-f]{6})$/i.exec(renk || '');
  if (!m) return false;
  const v = parseInt(m[1], 16);
  return ((v >> 16) + ((v >> 8) & 255) + (v & 255)) / 765 > 0.75;
};

// Bir SVG parçası dizgisini mürekkepler. S: o parçanın birim→piksel ölçeği. cocuk: gözler 1,2 kat.
function ogeleriCoz(str) {
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${str}</svg>`, 'image/svg+xml');
  return [...doc.documentElement.children];
}
const XS = new XMLSerializer();
const yaz = (el) => XS.serializeToString(el).replace(/ xmlns="[^"]*"/g, '');

function ogeMurekkeple(el, S, tohum, ops) {
  const ad = el.tagName;
  if (ad === 'g') {
    const ic = [...el.children].map((c, i) => ogeMurekkeple(c, S, tohum * 7 + i, ops)).join('');
    const nit = [...el.attributes].map((a) => ` ${a.name}="${a.value}"`).join('');
    return `<g${nit}>${ic}</g>`;
  }
  if (el.hasAttribute('data-ham')) return yaz(el);
  if (ad === 'path') {
    const stroke = el.getAttribute('stroke'), fill = el.getAttribute('fill');
    const sw = +el.getAttribute('stroke-width') || 0;
    const d = el.getAttribute('d');
    if (fill === 'none' && stroke && sw) {
      const px = kalinlikPx(sw);
      if (acikMi(stroke) || el.hasAttribute('data-duz')) {
        return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${yuvarla(px / S)}" stroke-linecap="round" stroke-linejoin="round"${el.getAttribute('opacity') ? ` opacity="${el.getAttribute('opacity')}"` : ''}/>`;
      }
      const sekil = murekkepSekli(d, px, S, tohum, { golge: !el.hasAttribute('data-golgesiz') });
      return `<path fill="${stroke}" d="${sekil.replace('__R__', stroke)}"/>`;
    }
    const tr = el.getAttribute('transform');
    if (fill && fill !== 'none' && tr && /^translate\(/.test(tr)) {
      const kay = yuvarla(STIL.kaymaPx / S);
      el.setAttribute('transform', `translate(${kay} ${kay})`);
      return yaz(el);
    }
    return yaz(el);
  }
  if (ad === 'ellipse') {
    const fill = el.getAttribute('fill');
    if (fill === '#000' && ops.ten > 2) return '';
    let rx = +el.getAttribute('rx'), ry = +el.getAttribute('ry');
    const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy');
    if (fill === M && rx >= 4 && rx < 8) {
      // göz: çocukta iri; açık gözde kâğıt rengi parıltı (bakışla birlikte kayar)
      if (ops.cocuk) { rx *= 1.2; ry *= 1.2; el.setAttribute('rx', yuvarla(rx)); el.setAttribute('ry', yuvarla(ry)); }
      let s = yaz(el);
      if (ry >= 4) s += `<circle cx="${yuvarla(cx + rx * 0.34)}" cy="${yuvarla(cy - ry * 0.4)}" r="${yuvarla(Math.max(1.15, rx * 0.27))}" fill="${STIL.kagit}"/>`;
      return s;
    }
    return yaz(el);
  }
  if (ad === 'circle') {
    if (el.getAttribute('stroke')) el.setAttribute('stroke-width', yuvarla(kalinlikPx(+el.getAttribute('stroke-width')) / S));
    return yaz(el);
  }
  return yaz(el);
}

// ---------------------------------------------------------------- el çizimi yardımcıları (insan.js dilinde, kendi birimiyle)
function elCizimi(tohum, kaynama) {
  const R = rng(tohum * 53 + 11), sabit = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6);
  const Rk = rng(tohum * 89 + kaynama * 1013 + 5), kayna = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => sabit[(t + i * 2 + e) % 512] + kayna[(t + i * 2 + e + 3) % 512] }; };
}
const CIZ = (d, w = 4.2, renk = M, ek = '') => `<path d="${d}" fill="none" stroke="${renk}" stroke-width="${w}"${ek}/>`;
const DOL = (d, renk) => `<path d="${d}" fill="${renk}" transform="translate(3 3)"/>`;
// Düz kenarlı şekil: köşeler arası ara noktalar (Catmull-Rom kenarı şişirmesin)
function kenarla(kose, kapali = true, parca = 5) {
  const out = [];
  const n = kose.length;
  for (let i = 0; i < (kapali ? n : n - 1); i++) {
    const a = kose[i], b = kose[(i + 1) % n];
    for (let j = 0; j < parca; j++) out.push([a[0] + (b[0] - a[0]) * j / parca, a[1] + (b[1] - a[1]) * j / parca]);
  }
  if (!kapali) out.push(kose[n - 1]);
  return out;
}
function bbox(d) {
  const v = (d.match(SAYI) || []).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) { x0 = Math.min(x0, v[i]); x1 = Math.max(x1, v[i]); y0 = Math.min(y0, v[i + 1]); y1 = Math.max(y1, v[i + 1]); }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}
function icinde(pt, poly) {
  let ic = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}
const karistir = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------- montaj yüzleri
// film.js MONTAJ'ın birebir kopyası (M1–M21). Tohum film.js'teki gibi: 100 + (n - 1) · 13.
export const MONTAJ_P = [
  { sacStil: 'kel', sac: 6, sakal: 'biyik', gozluk: 'kare', kalem: true, yas: 'yasli', ten: 2 },
  { sacStil: 'topuz', yas: 'genc', ten: 5, yuzEn: 52, yuzBoy: 66, gozluk: null, sakal: null },
  { sacStil: 'basortusu', ten: 3, yelek: true, gozluk: null, sakal: null },
  { sacStil: 'kivircik', sakal: 'kirli', ten: 6, gozluk: null },
  { sacStil: 'bob', sac: 5, isitme: true, ten: 1, yas: 'orta', gozluk: null, sakal: null },
  { sacStil: 'yan', ten: 4, kulaklik: true, gozluk: null, sakal: null },
  { sacStil: 'topuz', ten: 6, gozluk: null, sakal: null, kupe: true },
  { sacStil: 'yan', sac: 3, cil: true, ten: 0, yas: 'genc', gozluk: null, sakal: null },
  { sacStil: 'basortusu', yas: 'yasli', ten: 4, ortu: 4, gozluk: null, sakal: null },
  { sacStil: 'bere', sakal: 'sakal', ten: 2, gozluk: null },
  { sacStil: 'bob', ten: 5, yas: 'genc', gozluk: null, sakal: null },
  { sacStil: 'kel', sakal: 'sakal', sac: 5, yas: 'yasli', ten: 5, gozluk: null },
];

// Stil katmanının eklemeleri. `duz`: film.js parametresine yapılan düzeltme (raporda öneri olarak);
// sil/arka/once/on: işaret çizimleri (insan.js birimi; c = yüz geometrisi, s = el sapması).
const ACIK = '#ece8e0', KOYU = '#45413c';
export const YUZLER = {
  2: { // ~8 yaşında kız: iki topuz, eksik ön diş (çocuk oranı: bütün figür %90)
    ifade: 'notr', bakis: [0, 0], cocuk: 0.9, parilti: true,
    sil: (b, c) => Math.abs(b.cx - (c.cx + 4)) < 10 && Math.abs(b.cy - (c.tepe - 22)) < 12 && b.w < 80,
    arka: (s, c, p) => [-1, 1].map((yon) => {
      const bx = c.cx + yon * c.hw * 0.92, by = c.tepe + 8;
      const sac = MONO.sac[p.sac];
      return DOL(yol(oval(bx, by, 25, 23, 0, 360, 12), true, s()), sac) + CIZ(yol(oval(bx, by, 25, 23, 0, 360, 12), true, s()))
        + CIZ(yol([[bx - yon * 12, by + 4], [bx - yon * 2, by - 10], [bx + yon * 10, by - 4], [bx + yon * 2, by + 6]], false, s()), 2.4);
    }).join(''),
    on: (s, c) => {
      const x0 = c.cx, a = c.ay;
      const agiz = yol([[x0 - 18, a - 3], [x0, a - 4.5], [x0 + 18, a - 3], [x0 + 12, a + 7], [x0, a + 11], [x0 - 12, a + 7]], true, s());
      const dis = (pts) => { const d = yol(pts, true, s()); return `<path d="${d}" fill="#f6f3ed"/>` + CIZ(d, 2.2); };
      return DOL(agiz, '#221f1d') + CIZ(agiz, 3.6)
        + dis([[x0 - 12.5, a - 2.4], [x0 - 4, a - 3.4], [x0 - 4.2, a + 2.8], [x0 - 12, a + 2.2]])
        + dis([[x0 + 3, a - 3.4], [x0 + 12.5, a - 2.4], [x0 + 12, a + 2.2], [x0 + 3.2, a + 2.8]]);
    },
  },
  3: { // başörtüsü + baret, şantiye yeleği
    ifade: 'notr', bakis: [-1, 0],
    on: (s, c) => {
      const by = c.cy - c.hh * 0.62;
      const kubbe = [[c.cx - c.hw - 14, by + 2], [c.cx - c.hw - 11, by - 30], [c.cx - c.hw * 0.52, c.tepe - 26], [c.cx, c.tepe - 33], [c.cx + c.hw * 0.52, c.tepe - 26], [c.cx + c.hw + 11, by - 30], [c.cx + c.hw + 14, by + 2], [c.cx, by - 3]];
      const siper = [[c.cx - c.hw - 32, by + 3], [c.cx, by + 11], [c.cx + c.hw + 32, by + 3], [c.cx + c.hw + 27, by - 7], [c.cx, by - 1], [c.cx - c.hw - 27, by - 7]];
      const k1 = yol(kubbe, true, s()), k2 = yol(siper, true, s());
      return DOL(k1, ACIK) + CIZ(k1) + CIZ(yol([[c.cx - 9, c.tepe - 31], [c.cx - 10, c.tepe + 6], [c.cx - 11, by - 4]], false, s()), 3.4)
        + CIZ(yol([[c.cx + 9, c.tepe - 31], [c.cx + 10, c.tepe + 6], [c.cx + 11, by - 4]], false, s()), 3.4)
        + DOL(k2, ACIK) + CIZ(k2);
    },
  },
  4: { // kısa afro (bukle dokusu), kirli sakal
    ifade: 'merak', bakis: [1, 0],
    on: (s, c, p, R) => {
      let out = '';
      for (const [rf, a0, a1, adim] of [[0.88, 188, 352, 15], [0.66, 200, 340, 20]]) {
        for (let a = a0; a <= a1; a += adim) {
          const t = (a + (R() - 0.5) * 6) * Math.PI / 180;
          const x = c.cx + (c.hw + 20) * rf * Math.cos(t), y = c.cy - c.hh * 0.25 + (c.hh + 12) * rf * Math.sin(t);
          const b0 = R() * 360;
          out += CIZ(yol(oval(x, y, 4.6, 4, b0, b0 + 250, 8), false, s()), 2.4, '#141416');
        }
      }
      return out;
    },
  },
  5: { // kısa kır saç (bob), kulak arkası işitme cihazı (insan.js'tekinden belirgin: hortum ve kulak kalıbıyla)
    ifade: 'mutlu', bakis: [0, 0], duz: { isitme: false, cil: false, giysi: 1 },
    on: (s, c) => {
      const ex = c.cx + c.hw, X = (v) => ex + v;
      const g = yol([[X(13), c.cy - 21], [X(19.5), c.cy - 18], [X(21), c.cy - 6], [X(18.5), c.cy + 4], [X(14.5), c.cy - 2], [X(13.5), c.cy - 12]], true, s());
      const kalip = yol(oval(X(4), c.cy + 3, 3.4, 3.8, 0, 360, 8), true, s());
      return DOL(g, '#6f695f') + CIZ(g, 3.4) + CIZ(yol([[X(13.5), c.cy - 19], [X(8), c.cy - 19.5], [X(3.5), c.cy - 11], [X(4), c.cy - 1]], false, s()), 2.2)
        + DOL(kalip, '#6f695f') + CIZ(kalip, 2.2);
    },
  },
  6: { // yanları kısa saç, burun halkası, boynunda kulaklık (plan: boyunda; insan.js'inki başın üstünde)
    ifade: 'notr', bakis: [1, 0], duz: { cil: false, kulaklik: false, giysi: 4 },
    on: (s, c) => {
      let out = CIZ(yol(oval(c.cx - 3.5, GOZ_Y + 33.5, 4.4, 4.4, -70, 230, 10), false, s()), 2.6);
      for (const yon of [-1, 1]) {
        // bant boynun arkasından dolaşır: yalnız boyunla kap arası görünür
        out += CIZ(yol([[c.cx + yon * c.hw * 0.4, c.ceneY + 2], [c.cx + yon * (c.hw * 0.4 + 12), c.ceneY + 6], [c.cx + yon * 52, c.ceneY + 20]], false, s()), 8);
        const kx = c.cx + yon * 58, ky = c.ceneY + 36;
        const kap = yol(oval(kx, ky, 17, 21, 0, 360, 14).map(([x, y]) => [kx + (x - kx) * Math.cos(yon * 0.5) - (y - ky) * Math.sin(yon * 0.5), ky + (x - kx) * Math.sin(yon * 0.5) + (y - ky) * Math.cos(yon * 0.5)]), true, s());
        const ic = yol(oval(kx + yon * 3, ky - 1, 9, 12, 0, 360, 10), true, s());
        out += DOL(kap, '#35322e') + CIZ(kap) + DOL(ic, '#6f695f') + CIZ(ic, 2.4);
      }
      return out;
    },
  },
  7: { // ince örgülerden topuz (örgü dokusu), halka küpe
    ifade: 'merak', bakis: [-1, 0],
    on: (s, c, p, R) => {
      let out = '';
      const n = 6;
      for (let i = 0; i < n; i++) {
        const u = 0.1 + 0.8 * i / (n - 1);
        const x0 = c.cx - c.hw + 10 + u * (2 * c.hw - 20), y0 = c.cy - c.hh * (0.46 + 0.2 * Math.sin(Math.PI * u)) - 2;
        const x2 = c.cx + 4 + (u - 0.5) * 30, y2 = c.tepe - 4;
        const x1 = (x0 + x2) / 2 + (u - 0.5) * 18, y1 = (y0 + y2) / 2;
        out += CIZ(yol([[x0, y0], [x1, y1], [x2, y2]], false, s()), 2.4, '#5f5a53');
        for (let j = 1; j < 5; j++) {
          const t = j / 5, px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2, py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
          out += CIZ(yol([[px - 3.2, py + 2.4], [px, py - 1], [px + 3.2, py + 2.4]], false, s()), 1.8, '#5f5a53');
        }
      }
      const ox = c.cx + 4, oy = c.tepe - 22;
      for (const r of [0.55, 0.85]) out += CIZ(yol(oval(ox, oy, 30 * r, 24 * r, 200, 340, 8), false, s()), 1.8, '#5f5a53');
      for (const yon of [-1, 1]) out += CIZ(yol(oval(c.cx + yon * (c.hw + 9), c.cy + 41, 8.5, 11, 0, 360, 14), true, s()), 3.2);
      return out;
    },
  },
  8: { // bisiklet kaskı (havalandırma yarıkları, çene kayışı), çil, dalgalı kızıl saç
    ifade: 'notr', bakis: [0, 0], duz: { giysi: 4 },
    on: (s, c) => {
      const kabuk = yol([[c.cx - c.hw - 13, c.cy - c.hh * 0.28], [c.cx - c.hw - 12, c.cy - c.hh * 0.7], [c.cx - c.hw * 0.55, c.tepe - 21], [c.cx + c.hw * 0.15, c.tepe - 28], [c.cx + c.hw * 0.78, c.tepe - 18], [c.cx + c.hw + 15, c.cy - c.hh * 0.62], [c.cx + c.hw + 15, c.cy - c.hh * 0.28], [c.cx + c.hw * 0.5, c.cy - c.hh * 0.5], [c.cx, c.cy - c.hh * 0.55], [c.cx - c.hw * 0.5, c.cy - c.hh * 0.52]], true, s());
      let out = '';
      for (const yon of [-1, 1]) {
        out += CIZ(yol([[c.cx + yon * (c.hw + 7), c.cy - c.hh * 0.32], [c.cx + yon * (c.hw - 1), c.cy + 8], [c.cx + yon * c.hw * 0.55, c.ceneY - 6], [c.cx + yon * 5, c.ceneY + 3]], false, s()), 2.6);
      }
      out += DOL(kabuk, '#d8d2c7') + CIZ(kabuk);
      for (const [dx, dy, l] of [[-0.62, 6, 22], [-0.2, -4, 26], [0.22, -4, 26], [0.62, 6, 22]]) {
        const x = c.cx + dx * c.hw, y = c.tepe + dy;
        const yk = yol([[x - 3.2, y - l / 2], [x + 3.2, y - l / 2 + 1], [x + 3.6, y + l / 2], [x - 3, y + l / 2 - 1]], true, s());
        out += `<path d="${yk}" fill="${KOYU}"/>` + CIZ(yk, 2.4);
      }
      const siper = yol([[c.cx - c.hw * 0.62, c.cy - c.hh * 0.53], [c.cx, c.cy - c.hh * 0.6], [c.cx + c.hw * 0.62, c.cy - c.hh * 0.52], [c.cx + c.hw * 0.6, c.cy - c.hh * 0.43], [c.cx, c.cy - c.hh * 0.5], [c.cx - c.hw * 0.6, c.cy - c.hh * 0.44]], true, s());
      return out + DOL(siper, '#bdb6a9') + CIZ(siper, 3.6);
    },
  },
  9: { // yaşlı: oyalı, çene altından bağlı desenli yazma; kaz ayakları
    ifade: 'mutlu', bakis: [0, 0],
    on: (s, c, p, R) => {
      const ortu = MONO.basortusu[p.ortu];
      let out = '';
      // yazma deseni: küçük çiçek beneklerı (örtünün üstünde, yüzün dışında)
      const ortuPoly = [[c.cx, c.cy - c.hh - 22], [c.cx + c.hw + 24, c.cy - c.hh * 0.55], [c.cx + c.hw + 30, c.cy + c.hh * 0.3], [c.cx + c.hw + 44, c.ceneY + 44], [c.cx + 124, c.ceneY + 96], [c.cx, c.ceneY + 110], [c.cx - 124, c.ceneY + 96], [c.cx - c.hw - 44, c.ceneY + 44], [c.cx - c.hw - 30, c.cy + c.hh * 0.3], [c.cx - c.hw - 24, c.cy - c.hh * 0.55]];
      const desen = karistir(ortu, M, 0.42);
      for (let gy = c.tepe - 30; gy < c.ceneY + 110; gy += 21) {
        for (let gx = c.cx - 150; gx < c.cx + 150; gx += 23) {
          const x = gx + (R() - 0.5) * 9 + ((gy / 21) % 2) * 11, y = gy + (R() - 0.5) * 8;
          if (!icinde([x, y], ortuPoly)) continue;
          const yx = (x - c.cx) / (c.hw + 8), yy = (y - (c.cy - 6)) / (c.hh + 10);
          if (yx * yx + yy * yy < 1.15) continue; // yüzün üstüne değil
          out += `<circle cx="${yuvarla(x)}" cy="${yuvarla(y)}" r="1.9" fill="${desen}"/>`;
          for (let j = 0; j < 4; j++) { const t = j * Math.PI / 2 + 0.4; out += `<circle cx="${yuvarla(x + Math.cos(t) * 3.6)}" cy="${yuvarla(y + Math.sin(t) * 3.6)}" r="1.5" fill="${desen}"/>`; }
        }
      }
      // oya: ön bandın yüze bakan kenarı boyunca boncuk
      const kenar = [[c.cx - c.hw - 6, c.cy + c.hh * 0.18], [c.cx - c.hw + 6, c.cy - c.hh * 0.38], [c.cx, c.cy - c.hh * 0.6], [c.cx + c.hw - 6, c.cy - c.hh * 0.38], [c.cx + c.hw + 6, c.cy + c.hh * 0.18]];
      const { p: oy } = ornekle(yolNoktalari(yol(kenar, false, { sap: () => 0 })).pts, false, 8.5);
      for (const [x, y] of oy) { const d = yol(oval(x, y, 2.6, 2.6, 0, 360, 8), true, s()); out += `<path d="${d}" fill="${ACIK}"/>` + CIZ(d, 1.8); }
      // çene altı düğüm ve uçlar
      const dg = (pts) => { const d = yol(pts, true, s()); return DOL(d, ortu) + CIZ(d, 3.6); };
      out += dg([[c.cx - 3, c.ceneY + 20], [c.cx - 13, c.ceneY + 40], [c.cx - 8, c.ceneY + 54], [c.cx + 2, c.ceneY + 30]]);
      out += dg([[c.cx + 3, c.ceneY + 20], [c.cx + 14, c.ceneY + 37], [c.cx + 12, c.ceneY + 50], [c.cx + 1, c.ceneY + 30]]);
      out += dg(oval(c.cx - 10, c.ceneY + 16, 9, 6.5, 0, 360, 10)) + dg(oval(c.cx + 10, c.ceneY + 16, 9, 6.5, 0, 360, 10)) + dg(oval(c.cx, c.ceneY + 18, 5.5, 5.5, 0, 360, 10));
      // kaz ayakları (insan.js'in tek çizgisine ek)
      for (const yon of [-1, 1]) {
        out += CIZ(yol([[c.cx + yon * c.hw * 0.64, c.cy - 11], [c.cx + yon * c.hw * 0.8, c.cy - 15]], false, s()), 2.2);
        out += CIZ(yol([[c.cx + yon * c.hw * 0.62, c.cy + 7], [c.cx + yon * c.hw * 0.77, c.cy + 13]], false, s()), 2.2);
      }
      return out;
    },
  },
  10: { // ponponlu bere (örgü kaburgası), sakal, kurye çantası kayışı
    ifade: 'merak', bakis: [-1, 0], duz: { giysi: 1 },
    on: (s, c) => {
      let out = '';
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const u = -1 + 2 * i / n, x = c.cx + u * (c.hw + 4);
        const yUst = c.cy - c.hh * (0.5 + 0.1 * (1 - u * u)) + 4, yAlt = c.cy - c.hh * 0.3 + 5 * (1 - u * u) - 2;
        out += CIZ(yol([[x, yUst], [x + 0.5, yAlt]], false, s()), 1.8, '#5f5a53');
      }
      const pp = oval(c.cx, c.tepe - 39, 15, 14, 0, 360, 22).map(([x, y], i) => { const r = i % 2 ? 1 : 1.12; return [c.cx + (x - c.cx) * r, c.tepe - 39 + (y - (c.tepe - 39)) * r]; });
      const pd = yol(pp, true, s());
      out = DOL(pd, '#bdb6a9') + CIZ(pd, 3.6) + out;
      const kayis = yol(kenarla([[c.cx - 156, c.omuzY + 30], [c.cx - 131, c.omuzY + 12], [c.cx + 168, c.omuzY + 262], [c.cx + 140, c.omuzY + 282]], true, 6), true, s());
      const toka = yol(kenarla([[c.cx - 14, c.omuzY + 104], [c.cx + 12, c.omuzY + 120], [c.cx + 1, c.omuzY + 138], [c.cx - 25, c.omuzY + 122]], true, 3), true, s());
      return out + DOL(kayis, '#5f5a53') + CIZ(kayis) + DOL(toka, ACIK) + CIZ(toka, 3.4);
    },
  },
  11: { // kısa bob, kulağının arkasında tablet kalemi (SÇ1 yüzü, k150)
    ifade: 'merak', bakis: [1, -1], parilti: true,
    once: { bul: (b, c) => b.w < 30 && b.h < 50 && b.cx > c.cx + c.hw - 2 && Math.abs(b.cy - (c.cy + 6)) < 14,
      ciz: (s, c) => {
        const ust = [c.cx + c.hw + 27, c.cy - 50], alt = [c.cx + c.hw + 3, c.cy + 8];
        const L = Math.hypot(alt[0] - ust[0], alt[1] - ust[1]), u = [(alt[0] - ust[0]) / L, (alt[1] - ust[1]) / L], nv = [-u[1], u[0]], r = 5.2;
        const P = (t, k0) => [ust[0] + u[0] * t + nv[0] * k0, ust[1] + u[1] * t + nv[1] * k0];
        const govde = [];
        for (let a = 0; a <= 180; a += 30) { const t = a * Math.PI / 180; govde.push([ust[0] + nv[0] * r * Math.cos(t) - u[0] * r * Math.sin(t), ust[1] + nv[1] * r * Math.cos(t) - u[1] * r * Math.sin(t)]); }
        for (let i = 1; i <= 4; i++) govde.push(P((L - 12) * i / 4, -r));
        govde.push(P(L - 1, -1.2), P(L - 1, 1.2));
        for (let i = 4; i >= 1; i--) govde.push(P((L - 12) * i / 4, r));
        const gd = yol(govde, true, s());
        const uc = yol([P(L - 12, -r * 0.92), P(L - 1, -1.1), P(L - 1, 1.1), P(L - 12, r * 0.92)], true, s());
        return DOL(gd, '#ece8e0') + CIZ(gd, 3.6) + `<path d="${uc}" fill="#45413c"/>` + CIZ(yol([P(9, -r), P(9, r)], false, s()), 2);
      } },
  },
  12: { // takke, kırçıl sakal, yaşlı
    ifade: 'notr', bakis: [0, 0],
    on: (s, c, p, R) => {
      const t = c.tepe;
      const kubbe = yol([[c.cx - c.hw * 0.84, t + 27], [c.cx - c.hw * 0.62, t + 2], [c.cx, t - 9], [c.cx + c.hw * 0.62, t + 2], [c.cx + c.hw * 0.84, t + 27], [c.cx, t + 19]], true, s());
      let out = DOL(kubbe, ACIK) + CIZ(kubbe);
      for (const f of [0.42, 0.74]) {
        const pts = [];
        for (let i = 0; i <= 8; i++) { const u = -1 + 2 * i / 8; pts.push([c.cx + u * c.hw * 0.8 * (0.55 + 0.45 * f), t + 19 - 21 * f * (1 - u * u * 0.8) + 8 * (1 - f) * u * u]); }
        out += CIZ(yol(pts, false, s()), 1.8, '#7d776e');
        for (let i = 1; i < 8; i++) { const [x, y] = pts[i]; out += CIZ(yol([[x - 2, y - 3], [x, y + 1], [x + 2, y - 3]], false, s()), 1.6, '#7d776e'); }
      }
      out += `<circle cx="${c.cx}" cy="${yuvarla(t - 2)}" r="2.6" fill="#7d776e"/>`;
      for (let i = 0; i < 9; i++) {
        const x = c.cx + (R() - 0.5) * c.hw * 1.3, y = c.ay + 6 + R() * (c.ceneY - c.ay - 4);
        if (Math.abs(x - c.cx) < 14 && y < c.ay + 12) continue;
        out += CIZ(yol([[x, y], [x + (R() - 0.5) * 3, y + 6]], false, s()), 1.8, '#5f5a53');
      }
      return out;
    },
  },
};

export const montajKisi = (n) => rastgeleKisi(100 + (n - 1) * 13, { ...MONTAJ_P[n - 1], ...(YUZLER[n]?.duz || {}) });

// Yüz geometrisi (insan.js kisiSVG ile aynı hesap)
function geometri(p) {
  const cx = 200, cy = GOZ_Y + 4, hw = p.yuzEn, hh = p.yuzBoy;
  return { cx, cy, hw, hh, tepe: cy - 6 - hh, ceneY: cy + hh, ay: cy + hh * 0.52, omuzY: cy + hh + 40 };
}

// Tek bir kişinin tek bir çizimi (kaynama 0–3): stil katmanı uygulanmış SVG dizgisi (insan.js birimi, 400×440)
const onbellek = new Map();
let kimlik = 0;
export function stilKisi(n, { p = montajKisi(n), kaynama = 0, ifade, bakis, S = CAPA.S, katmanIzi = true } = {}) {
  const Y = YUZLER[n] || {};
  ifade = ifade || Y.ifade || 'notr';
  bakis = bakis || Y.bakis || [0, 0];
  const anahtar = `${n}|${kaynama}|${ifade}|${bakis}|${S}|${katmanIzi}`;
  if (onbellek.has(anahtar)) return onbellek.get(anahtar);
  const c = geometri(p);
  const s = elCizimi(p.tohum, kaynama);
  const R = rng(p.tohum * 17 + 3); // işaret yerleşimi kaynamada sabit
  const Se = S * (Y.cocuk || 1);
  const ham = kisiSVG(p, { kaynama, ifade, bakis, mono: true });
  const arka = Y.arka ? ogeleriCoz(Y.arka(s, c, p, R)) : [];
  let govdeOgeleri = ogeleriCoz(ham);
  if (Y.sil) {
    const at = new Set(govdeOgeleri.filter((e) => e.tagName === 'path' && Y.sil(bbox(e.getAttribute('d')), c)));
    govdeOgeleri = govdeOgeleri.filter((e) => !at.has(e));
  }
  // boyun ve gövde: insan.js sırası [arka saç (uzun/bob)] boyun(dolgu, çizgi) gövde(dolgu, çizgi)
  const b0 = ['uzun', 'bob'].includes(p.sacStil) ? 2 : 0;
  const boyunD = govdeOgeleri[b0]?.getAttribute('d'), govdeD = govdeOgeleri[b0 + 2]?.getAttribute('d');
  const id = `k${++kimlik}`;
  const kay = yuvarla(STIL.kaymaPx / Se);
  const ekler = new Map(); // indis → öncesine eklenecek dizgi
  const ekle = (i, str) => ekler.set(i, (ekler.get(i) || '') + str);
  if (boyunD && govdeD && bbox(govdeD).w > 300) {
    // çene gölgesi (boyunda, boyna kırpılı)
    const ten = MONO.ten[p.ten];
    const golge = yol([[c.cx - c.hw * 0.46, c.ceneY - 22], [c.cx + c.hw * 0.46, c.ceneY - 22], [c.cx + c.hw * 0.46, c.ceneY + 3], [c.cx, c.ceneY + 15], [c.cx - c.hw * 0.46, c.ceneY + 3]], true, { sap: () => 0 });
    ekle(b0 + 2, `<clipPath id="${id}b"><path d="${boyunD}" transform="translate(${kay} ${kay})"/></clipPath><g clip-path="url(#${id}b)"><path d="${golge}" fill="${karistir(ten, M, 0.2)}" transform="translate(${kay} ${kay})"/></g>`);
    if (katmanIzi) {
      // FDM katman izi: giysinin dibinde ince yatay hatlar, yukarı doğru söner (nozulun ilk yüzü bastığının ipucu)
      const alt = GOZ_Y + (H - CAPA.y) / Se + 6, ust = alt - 64 * 2.45 / Se;
      let hatlar = '';
      for (let y = alt; y > ust; y -= 2.25) hatlar += `M0 ${yuvarla(y)}H400`;
      ekle(b0 + 3, `<clipPath id="${id}g"><path d="${govdeD}" transform="translate(${kay} ${kay})"/></clipPath>`
        + `<linearGradient id="${id}l" x1="0" y1="${yuvarla(ust)}" x2="0" y2="${yuvarla(alt)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>`
        + `<mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="${yuvarla(ust)}" width="400" height="${yuvarla(alt - ust + 4)}"><rect x="0" y="${yuvarla(ust)}" width="400" height="${yuvarla(alt - ust + 4)}" fill="url(#${id}l)"/></mask>`
        + `<g clip-path="url(#${id}g)"><g mask="url(#${id}m)"><path data-ham="1" d="${hatlar}" stroke="${M}" stroke-opacity="0.2" stroke-width="${yuvarla(1.1 / Se)}" fill="none"/>`
        + `<path data-ham="1" d="${hatlar}" transform="translate(0 ${yuvarla(1.1 / Se)})" stroke="#fff" stroke-opacity="0.22" stroke-width="${yuvarla(0.9 / Se)}" fill="none"/></g></g>`);
    }
  }
  // Yüzde biçim gölgesi: ışık sol üstten, sağ-alt kenarda ince bir hilal (yüz dolgusuna kırpılı)
  const yi = govdeOgeleri.findIndex((e) => {
    if (e.tagName !== 'path' || !e.getAttribute('fill') || e.getAttribute('fill') === 'none') return false;
    const b = bbox(e.getAttribute('d'));
    return Math.abs(b.cx - c.cx) < 8 && Math.abs(b.w - 2 * c.hw) < 16 && Math.abs(b.h - 2 * c.hh) < 18;
  });
  if (yi >= 0) {
    const yd = govdeOgeleri[yi].getAttribute('d'), ten = MONO.ten[p.ten];
    ekle(yi + 1, `<clipPath id="${id}y"><path d="${yd}" transform="translate(${kay} ${kay})"/></clipPath><g clip-path="url(#${id}y)">`
      + `<path d="${yd}" fill="${karistir(ten, M, 0.12)}" transform="translate(${kay} ${kay})"/><path d="${yd}" fill="${ten}" transform="translate(${yuvarla(kay - 7)} ${yuvarla(kay - 5)})"/></g>`);
  }
  if (Y.once) {
    const i = govdeOgeleri.findIndex((e) => e.tagName === 'path' && e.getAttribute('fill') !== 'none' && Y.once.bul(bbox(e.getAttribute('d')), c));
    if (i >= 0) ekle(i, Y.once.ciz(s, c, p, R));
  }
  // Gövdeye hacim: kolu gövdeden ayıran iki kıvrım (insan.js gövdesi kolsuz bir yamuk); gövde çizgisinin hemen üstüne
  if (boyunD && govdeD) {
    let kivrim = '';
    for (const yon of [-1, 1]) kivrim += CIZ(yol([[c.cx + yon * 121, c.omuzY + 66], [c.cx + yon * 128, c.omuzY + 112], [c.cx + yon * 131, c.omuzY + 176]], false, s()), 3.6);
    ekle(b0 + 4, kivrim);
  }
  const ops = { cocuk: !!Y.cocuk, ten: p.ten };
  let cikti = arka.map((e, i) => ogeMurekkeple(e, Se, p.tohum * 101 + kaynama * 7 + i, ops)).join('');
  govdeOgeleri.forEach((e, i) => {
    if (ekler.has(i)) cikti += ogeleriCoz(ekler.get(i)).map((x, j) => ogeMurekkeple(x, Se, p.tohum * 211 + kaynama * 5 + j, ops)).join('');
    cikti += ogeMurekkeple(e, Se, p.tohum * 307 + kaynama * 13 + i, ops);
  });
  if (Y.parilti) {
    // koyu saçta ışık: tepenin sol üstünde iki kısa kavis (ışık sol üstten, kalınlık kuralıyla aynı yön)
    const pr = karistir(MONO.sac[p.sac], STIL.kagit, 0.34);
    const pd = CIZ(yol(oval(c.cx, c.cy - 6, c.hw * 0.86, c.hh + 2, 214, 238, 6), false, s()), 3.6, pr, ' data-golgesiz="1"')
      + CIZ(yol(oval(c.cx, c.cy - 6, c.hw * 0.72, c.hh - 8, 222, 234, 4), false, s()), 3, pr, ' data-golgesiz="1"');
    cikti += ogeleriCoz(pd).map((e, i) => ogeMurekkeple(e, Se, p.tohum * 503 + kaynama * 3 + i, ops)).join('');
  }
  if (Y.on) cikti += ogeleriCoz(Y.on(s, c, p, R)).map((e, i) => ogeMurekkeple(e, Se, p.tohum * 401 + kaynama * 11 + i, ops)).join('');
  if (Y.cocuk) cikti = `<g transform="translate(200 ${GOZ_Y}) scale(${Y.cocuk}) translate(-200 -${GOZ_Y})">${cikti}</g>`;
  onbellek.set(anahtar, cikti);
  return cikti;
}

// ---------------------------------------------------------------- sahne, kâğıt
export function sahneKur() {
  const sahne = document.getElementById('sahne');
  Object.assign(sahne.style, { width: W + 'px', height: H + 'px' });
  const sigdir = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
  };
  addEventListener('resize', sigdir);
  sigdir();
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.classList.add('cizim');
  // Mürekkep kenarı: çok hafif pürüz (kâğıda emilen mürekkep), ekran pikselinde ±0,8 px
  svg.innerHTML = `<defs><filter id="puruz" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
    <g filter="url(#puruz)"><g class="itme"><svg class="kisi" viewBox="0 0 ${BOY.en} ${BOY.boy}" overflow="visible"
      x="${CAPA.x - 200 * CAPA.S}" y="${CAPA.y - GOZ_Y * CAPA.S}" width="${BOY.en * CAPA.S}" height="${BOY.boy * CAPA.S}"></svg></g></g>`;
  sahne.prepend(svg);
  // ?kagit=0: gren videoya gömülmez (site sürümü: plan §6, doku CSS'te). Gren bit hızını belirgin artırır.
  if (q.get('kagit') !== '0') kagitKur(sahne);
  return { sahne, svg, itme: svg.querySelector('.itme'), kisi: svg.querySelector('.kisi'), yazi: document.getElementById('yazi') };
}

// Kâğıt: sabit (kameradan ve kaynamadan bağımsız). İki tuval: koyu gren + lif + bulutlanma (çarp), açık benek (ekran).
export function kagitKur(sahne) {
  const R = rng(4242);
  const koyu = document.createElement('canvas'), acik = document.createElement('canvas');
  for (const c of [koyu, acik]) { c.width = W; c.height = H; c.className = 'kagit-katman'; }
  const g = koyu.getContext('2d');
  // bulutlanma: kaba ızgarada rastgele ton, yumuşak büyütme
  const bw = Math.ceil(W / 90) + 2, bh = Math.ceil(H / 90) + 2;
  const bulut = Array.from({ length: bw * bh }, () => R());
  const img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) {
    const fy = y / 90, y0 = Math.floor(fy), uy = fy - y0, sy = uy * uy * (3 - 2 * uy);
    for (let x = 0; x < W; x++) {
      const fx = x / 90, x0 = Math.floor(fx), ux = fx - x0, sx = ux * ux * (3 - 2 * ux);
      const b = (bulut[y0 * bw + x0] * (1 - sx) + bulut[y0 * bw + x0 + 1] * sx) * (1 - sy) + (bulut[(y0 + 1) * bw + x0] * (1 - sx) + bulut[(y0 + 1) * bw + x0 + 1] * sx) * sy;
      const r = R();
      let v = 1 - 0.028 * b - 0.075 * r * r * r;
      if (r > 0.9985) v -= 0.12;
      const i = (y * W + x) * 4;
      d[i] = 255 * v; d[i + 1] = 255 * (v - 0.004); d[i + 2] = 255 * (v - 0.012); d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // lifler
  g.lineCap = 'round';
  for (let i = 0; i < Math.round(W * H / 6500); i++) {
    const x = R() * W, y = R() * H, a = R() * Math.PI * 2, l = 6 + R() * 26;
    g.strokeStyle = `rgba(118, 100, 74, ${0.05 + R() * 0.07})`;
    g.lineWidth = 0.5 + R() * 0.7;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (R() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  const h = acik.getContext('2d');
  h.fillStyle = '#000'; h.fillRect(0, 0, W, H);
  const im2 = h.getImageData(0, 0, W, H), e = im2.data;
  for (let i = 0; i < W * H; i++) { if (R() < 0.006) { const v = 120 + R() * 135; e[i * 4] = v; e[i * 4 + 1] = v; e[i * 4 + 2] = v; } }
  h.putImageData(im2, 0, 0);
  h.lineCap = 'round';
  for (let i = 0; i < Math.round(W * H / 9000); i++) {
    const x = R() * W, y = R() * H, a = R() * Math.PI * 2, l = 5 + R() * 18;
    h.strokeStyle = `rgba(255, 255, 255, ${0.15 + R() * 0.25})`;
    h.lineWidth = 0.6 + R() * 0.6;
    h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); h.stroke();
  }
  koyu.style.mixBlendMode = 'multiply';
  acik.style.mixBlendMode = 'screen'; acik.style.opacity = '0.2';
  sahne.append(koyu, acik);
}

// Kaynama: 8 fps, 4 çizim (tohum = floor(k/8) mod 4)
export const kaynaIndis = (t) => Math.floor(t * 8 + 1e-6) % 4;

// Oktos sesi: kelimeler maskeden açılır (34 k EO, 4 k arayla). Maske İ, Ş noktaları için dolgulu (v6-final ile aynı).
export function kelimeler(p, metin) {
  const out = [];
  metin.split(' ').forEach((s, i) => {
    if (i) p.appendChild(document.createTextNode(' '));
    const m = document.createElement('span');
    m.className = 'maske';
    const w = document.createElement('span');
    w.className = 'kelime';
    w.textContent = s;
    m.appendChild(w); p.appendChild(m);
    out.push(w);
  });
  return out;
}

// ---------------------------------------------------------------- SÇ1 sayfası
// Yazı tiplerini açıkça yükle (latin-ext alt kümesi: İ, Ş, Ğ). Yalnız fonts.ready yetmez: henüz kullanılmayan ağırlık
// istenmemiş olur, ölçüm yedek yazı tipiyle yapılır.
export async function yaziTipleri() {
  const ornek = 'Herkesin aklında BİR ŞEY VAR. Everyone has SOMETHING IN MIND. ğüşiöçİĞÜŞÖÇ';
  await Promise.all([
    document.fonts.load('900 100px "Big Shoulders Display"', ornek),
    document.fonts.load('600 50px "Schibsted Grotesk"', ornek),
  ]);
  await document.fonts.ready;
}

async function sc1() {
  const { kisi, yazi } = sahneKur();
  await yaziTipleri();
  const DUZEN = q.get('duzen') === 'a' ? 'a' : 'b';
  const N = 11; // k150'deki yüz: M11 (plan #2: M2–3 18 k, M4–12 12 k → k144–155)
  const p = montajKisi(N);
  const cizimler = [0, 1, 2, 3].map((i) => stilKisi(N, { p, kaynama: i }));
  let son = -1;
  const ciz = (i) => { if (i !== son) { kisi.innerHTML = cizimler[i]; son = i; } };
  ciz(0);

  // ---- yazı: ön cümle (Schibsted 600) + vurgu satırları (Big Shoulders 900, büyük harf); "bir şey"in altında istek çizgisi
  const MT = DIL === 'en'
    ? { on: 'Everyone has', satir: ['SOMETHING', 'IN MIND.'], vurgu: 0 }
    : { on: 'Herkesin aklında', satir: ['BİR ŞEY', 'VAR.'], vurgu: 0 };
  const blok = document.createElement('div');
  blok.className = `blok duzen-${DIKEY ? 'dikey' : DUZEN}`;
  blok.lang = DIL;
  const on = document.createElement('p'); on.className = 'on';
  const vur = document.createElement('p'); vur.className = 'vur';
  const onK = kelimeler(on, MT.on);
  const satirlar = MT.satir.map((s) => { const sp = document.createElement('span'); sp.className = 'satir'; vur.appendChild(sp); return { sp, k: kelimeler(sp, s) }; });
  blok.append(on, vur);
  yazi.appendChild(blok);

  // Ölçek: vurgu satırlarının en genişi sütuna sığsın (dil değişse de)
  const olc = document.createElement('canvas').getContext('2d');
  olc.font = '900 100px "Big Shoulders Display"';
  const enGenis = Math.max(...MT.satir.map((s) => olc.measureText(s).width * 1.005));
  let sutun, ust, onPx, maks;
  // Telefonda yatay video ~0,2 ölçekte izlenir: ön cümle en az ~70 px (ekranda ~14 px)
  if (DIKEY) { sutun = { x: 84, w: W - 168 }; onPx = 62; maks = 232; }
  else if (DUZEN === 'a') { sutun = { x: 1236, w: 590 }; onPx = 60; maks = 214; }
  else { sutun = { x: 1232, w: 572 }; onPx = 72; maks = 214; }
  const vPx = Math.min(maks, Math.floor(sutun.w / enGenis * 100));
  on.style.fontSize = onPx + 'px';
  vur.style.fontSize = vPx + 'px';
  const blokH = () => blok.offsetHeight;
  if (DIKEY) {
    Object.assign(blok.style, { left: sutun.x + 'px', width: sutun.w + 'px', textAlign: 'center' });
    ust = Math.round(H * 0.12 + 22);
    blok.style.top = ust + 'px';
  } else if (DUZEN === 'a') {
    Object.assign(blok.style, { left: sutun.x + 'px', width: sutun.w + 'px' });
    blok.style.top = Math.round(CAPA.y - blokH() / 2 + 10) + 'px';
  } else {
    // b: ön cümle yüzün solunda (sağa yaslı), vurgu sağda; ön cümlenin taban çizgisi ilk vurgu satırınınkiyle aynı
    Object.assign(blok.style, { left: sutun.x + 'px', width: sutun.w + 'px' });
    Object.assign(on.style, { position: 'absolute', right: (sutun.w + (sutun.x - 712)) + 'px', width: '560px', textAlign: 'right', whiteSpace: 'nowrap' });
    blok.style.top = Math.round(CAPA.y - vur.offsetHeight / 2 + 4) + 'px';
    // taban çizgisi eşle: ilk satırın satır kutusu içindeki taban çizgisi ölçülür
    const tab = (el) => { const r = document.createElement('span'); r.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; el.appendChild(r); const y = r.offsetTop; r.remove(); return y; };
    const t1 = tab(satirlar[0].sp);
    const t0 = tab(on);
    on.style.top = (t1 - t0) + 'px';
  }

  // İstek çizgisi (vurgu rengi, mürekkep fırçası): ilk vurgu satırının altında, hafif yükselen, sağda kıvrık uç
  const NS = 'http://www.w3.org/2000/svg';
  const cizgiSvg = document.createElementNS(NS, 'svg');
  cizgiSvg.classList.add('istek');
  blok.prepend(cizgiSvg); // yazının arkasında: Ş'nin çengeli çizginin üstünden geçer (elle çizilmiş alt çizgi gibi)
  const s0 = satirlar[MT.vurgu];
  const kel = s0.k;
  const solX = kel[0].parentNode.offsetLeft, sagX = kel.at(-1).parentNode.offsetLeft + kel.at(-1).parentNode.offsetWidth;
  const taban = (() => { const r = document.createElement('span'); r.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; s0.sp.appendChild(r); const y = r.offsetTop; r.remove(); return y; })();
  const yc = taban + vPx * 0.075, en = sagX - solX;
  const pts = [[solX - en * 0.02, yc + vPx * 0.03], [solX + en * 0.32, yc + vPx * 0.012], [solX + en * 0.72, yc - vPx * 0.002], [sagX - en * 0.01, yc - vPx * 0.022], [sagX + en * 0.03, yc - vPx * 0.05]];
  const dCizgi = yol(pts, false, { sap: (i, e) => [0, 0.8, -0.6, 0.5, 0][i] * (e ? 1 : 0) });
  const sekil = murekkepSekli(dCizgi, vPx * 0.075, 1, 77, { uc: 0.14, ucBoy: en * 0.26 });
  cizgiSvg.innerHTML = `<path fill="${STIL.vurgu}" d="${sekil.replace('__R__', STIL.vurgu)}"/>`;
  Object.assign(cizgiSvg.style, { position: 'absolute', left: '0', top: '0', width: blok.offsetWidth + 'px', height: blok.offsetHeight + 'px', overflow: 'visible' });
  cizgiSvg.setAttribute('viewBox', `0 0 ${blok.offsetWidth} ${blok.offsetHeight}`);

  // ---- zaman çizelgesi (2 sn): film k36'dan başlayan girişin aynısı, sonra tutuş (k150 = tam görünüm)
  const tl = gsap.timeline({ paused: true });
  const tum = [...onK, ...satirlar.flatMap((x) => x.k)];
  gsap.set(tum, { yPercent: 150 });
  tum.forEach((w, i) => tl.fromTo(w, { yPercent: 150 }, { yPercent: 0, duration: k(34), ease: E.EO, immediateRender: false }, k(6 + i * 4)));
  const cz = cizgiSvg.querySelector('path');
  gsap.set(cz, { clipPath: 'inset(-50% 100% -50% -5%)' });
  tl.fromTo(cz, { clipPath: 'inset(-50% 100% -50% -5%)' }, { clipPath: 'inset(-50% -5% -50% -5%)', duration: k(18), ease: E.EO, immediateRender: false }, k(6 + tum.length * 4 + 10));
  tl.to({}, { duration: k(1) }, k(119));

  const kare = (t) => { tl.seek(Math.max(1e-4, t), false); ciz(kaynaIndis(t)); };
  window.tanitim = { kare, sure: () => 2, tl };
  kare(1e-4);
  if (CEKIM) window.tanitimHazir = true;
  else if (q.get('t') !== null) kare(+q.get('t'));
  else {
    const t0 = performance.now();
    const dongu = () => { kare(((performance.now() - t0) / 1000) % 2.6); requestAnimationFrame(dongu); };
    requestAnimationFrame(dongu);
  }
}

if (document.body?.dataset.sayfa === 'sc1') sc1().catch((e) => { console.error(e); document.getElementById('hata').textContent = e.message; });
