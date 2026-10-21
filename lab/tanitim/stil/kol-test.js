// Kol ve el paftası (M2): kol.js'in insan.js gövdelerine bağlı pozları, 6 el pozunun yakın planı, kuş bakışı tutan eller.
// ?yon=yatay|dikey (1920×1080 / 1080×1920). Kaynama 8 fps, 4 çizim: window.tanitim.kare(t) → çizim floor(t·8) mod 4.
// Kişiler film.js KISI A/B/C/D parametreleriyle (kopya) kurulur; kol omuz eklemleri kol.js omuzlar(p).
import { kisiSVG, rastgeleKisi, yol, rng, MONO, PALET, GOZ_Y } from '../insan.js';
import { kolSVG, omuzlar, bilekBul, elUstten, govdeKes, EL_POZLARI } from '../kol.js';

const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const M = PALET.murekkep, VURGU = '#bf5519', VY = '#94400f', KAGIT = '#f1ede6';

const sahne = document.getElementById('sahne'), svg = document.getElementById('pafta');
Object.assign(sahne.style, { width: W + 'px', height: H + 'px' });
svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir); sigdir();

// ---------- Dört ana karakter (film.js KISI kopyası)
const KISI = {
  A: { tohum: 7, kadin: true, sacStil: 'kivircik', yas: 'genc', cil: true, gozluk: null, sakal: null, kupe: true, ten: 4, sac: 0, giysi: 3, yaka: 'kapusonlu' },
  B: { tohum: 41, kadin: true, sacStil: 'topuz', yas: 'yasli', sac: 5, ten: 1, gozluk: 'kare', kalem: true, sakal: null, kupe: false, yaka: 'gomlek', giysi: 0 },
  C: { tohum: 52, kadin: false, sacStil: 'kisa', yas: 'orta', sac: 0, ten: 6, sakal: 'sakal', kulaklik: true, gozluk: null, kupe: false, yaka: 'kapusonlu', giysi: 5, yuzEn: 68 },
  D: { tohum: 63, kadin: true, sacStil: 'basortusu', yas: 'orta', ten: 3, ortu: 1, ceket: true, yaka: 'gomlek', giysi: 5, gozluk: null, sakal: null, kupe: false },
};
const P = Object.fromEntries(Object.entries(KISI).map(([a, v]) => [a, rastgeleKisi(v.tohum, v)]));
const renk = (p) => ({ giysi: MONO.giysi[p.giysi], ten: MONO.ten[p.ten] });

// ---------- Doodle yardımcıları (insan.js titreşimiyle, kaynayan)
function kalem(tohum, k, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + k * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}
function araclar(tohum, k, genlik = 1) {
  const s = kalem(tohum, k, genlik);
  const cizgi = (pts, w = 4.2, r = M, kapali = false) => `<path d="${yol(pts, kapali, s())}" fill="none" stroke="${r}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sekil = (pts, dolgu, w = 4.2, kay = [3, 3]) => { const d = yol(pts, true, s()); return `<path d="${d}" fill="${dolgu}" transform="translate(${kay[0]} ${kay[1]})"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; };
  // eşit aralıklı dikdörtgen noktaları (Catmull-Rom köşede kanca yapmasın)
  const dikd = (x0, y0, x1, y1, rc = 0, ad = 24) => {
    const p = [];
    const kose = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * Math.PI / 180; p.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a)]); } };
    if (!rc) p.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
    else { kose(x1 - rc, y0 + rc, 270); kose(x1 - rc, y1 - rc, 0); kose(x0 + rc, y1 - rc, 90); kose(x0 + rc, y0 + rc, 180); }
    const out = [];
    p.forEach((a, i) => { const b = p[(i + 1) % p.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / ad)); for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); });
    return out;
  };
  return { cizgi, sekil, dikd };
}
const kisi = (p, k, ifade, bakis = [0, 0]) => kisiSVG(p, { kaynama: k, ifade, bakis, mono: true });

// ---------- Pozlar (insan kutusu birimi: 400×440, gövde 610'a iner; vb = görünen pencere)
const POZ = [];
const poz = (ad, etiket, kod, vb, ciz) => POZ.push({ ad, etiket, kod, vb, ciz });
const EB = 116; // el boyu (kutu birimi): yüz boyunun ~%75'i
// Kişi + gövde kesimi + kollar. kollar(G, o) → dizge; G.golgeKlipUrl kol gölgesi için
function figur(p, k, id, { ifade = 'notr', bakis = [0, 0], gogus = 108, kalinlik = 64, arka = '', on = '', kollar }) {
  const G = govdeKes(p, { id: `${id}-${k}`, kaynama: k, gogus, tohum: p.tohum });
  const o = omuzlar(p, { kalinlik });
  const { giysi, ten } = renk(p);
  const ortak = { giysi, ten, kalinlik, kaynama: k, golge: { klip: G.golgeKlipUrl } };
  return arka + G.tanim + `<g ${G.klip}>${kisi(p, k, ifade, bakis)}</g>` + G.kontur + on + kollar(o, ortak, G);
}
// Sarkık kol (el kadrajın altında)
const sarkik = (omuz, yon, ortak, tohum, ek = {}) => kolSVG({ ...ortak, omuz, dirsek: [omuz[0] + yon * 10, omuz[1] + 166], bilek: [omuz[0] + yon * 4, omuz[1] + 318], el: 'acik', elAci: 92, elBoy: EB, taraf: yon > 0 ? 'sag' : 'sol', tohum, ...ek });

// A: işaret parmağı çenenin altında; öbür kol karnın önünden dirseği destekler
poz('A', 'çeneye dokunur', "'isaret'", [-40, 70, 480, 530], (k) => figur(P.A, k, 'a', {
  ifade: 'merak', bakis: [1, -1], kollar: (o, ortak) => {
    const r = { ...ortak, manset: 'ribana' };
    const destek = kolSVG({ ...r, omuz: o.sag, dirsek: [366, 498], bilek: [186, 512], el: 'yumruk', elAci: 182, elBoy: EB * 0.95, taraf: 'sag', basparmak: 1, tohum: 21 });
    const hedef = [186, 176 + P.A.yuzBoy - 2];
    const bilek = bilekBul({ el: 'isaret', hedef, elAci: -82, elBoy: EB, basparmak: 1 });
    const cene = kolSVG({ ...r, omuz: o.sol, bilek, ust: 165, alt: 152, bukulme: 1, el: 'isaret', elAci: -82, elBoy: EB, taraf: 'sol', basparmak: 1, tohum: 22 });
    return destek + cene;
  },
}));

// B: çekmece masası (ön görünüm, v3 kutu birimi), L: çekiş oranı. Dikey çubuk kol
function masaB(k, L) {
  const { sekil, cizgi, dikd } = araclar(331, k, 0.5);
  const dx = -150 * L;
  let c = sekil(dikd(420, 538, 672, 604), '#cfc9bd', 4) + sekil(dikd(409, 529, 421, 613), '#b0a99c', 4);
  const cubuk = sekil(dikd(379, 524, 393, 616, 6, 10), MONO.giysi[5], 3.6, [2, 2]);
  c += cizgi([[393, 534], [409, 534]], 3.6) + cizgi([[393, 606], [409, 606]], 3.6) + cubuk;
  let s = '';
  s += sekil(dikd(420, 526, 1000, 614), '#bdb6a9', 4.2) + sekil(dikd(404, 498, 1000, 526), '#a59e91', 4.2) + sekil(dikd(424, 614, 452, 1000), '#a59e91', 4.2);
  s += sekil([[560, 452], [606, 452], [604, 498], [562, 498]], '#d8d2c7', 3.6) + cizgi([[606, 462], [622, 466], [622, 484], [605, 490]], 3.4);
  return { cekmece: `<g transform="translate(${dx} 0)">${c}</g>`, cubuk: `<g transform="translate(${dx} 0)">${cubuk}</g>`, masa: s, kol: [387 + dx, 570] };
}
const sandalyeB = (k) => { const { sekil, dikd } = araclar(321, k, 0.5); return sekil(dikd(60, 230, 340, 660, 40), MONO.giysi[4], 4.2); };
const dondur = (pt, a, c = [200, 600]) => { const r = a * Math.PI / 180, x = pt[0] - c[0], y = pt[1] - c[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
function poseB(k, L, rot, ay) {
  const p = P.B, m = masaB(k, L);
  const hedef = dondur(m.kol, -rot);
  const ters = (x) => `<g transform="rotate(${-rot} 200 600)">${x}</g>`;
  const govde = figur(p, k, `b${L}`, {
    ifade: ay.ifade, bakis: ay.bakis, on: ters(m.cekmece), kollar: (o, ortak) => {
      const r = { ...ortak, kolBoyu: 'sivali' };
      const bilek = bilekBul({ el: 'tutma', hedef, elAci: ay.aci, elBoy: EB, basparmak: ay.bs, ad: 'tut' });
      const obur = kolSVG({ ...r, omuz: o.sol, ...ay.obur, elBoy: EB, taraf: 'sol', tohum: 32 });
      const cek = kolSVG({ ...r, omuz: o.sag, dirsek: ay.dirsek, bilek, el: 'tutma', elAci: ay.aci, elBoy: EB, basparmak: ay.bs, taraf: 'sag', araya: ters(m.cubuk), tohum: 31 });
      return obur + cek;
    },
  });
  // çekmece kişinin önünde (çekilince kucağın önünden geçer), masa en önde değil: çekmece masanın içinden çıkar
  return sandalyeB(k) + m.masa + `<g transform="rotate(${rot} 200 600)">${govde}</g>`;
}
poz('B1', 'çekmece: hazırlık', "'tutma'", [-20, 100, 680, 500], (k) => poseB(k, 0, 2.5, {
  aci: 12, bs: -1, dirsek: [384, 468], ifade: 'merak', bakis: [1, 1],
  obur: { dirsek: [58, 500], bilek: [126, 640], el: 'acik', elAci: 80 },
}));
poz('B2', 'çekmece: çekiş', "'tutma'", [-20, 100, 680, 500], (k) => poseB(k, 0.72, -7, {
  aci: 172, bs: 1, dirsek: [418, 478], ifade: 'sikkin', bakis: [1, 1],
  obur: { dirsek: [22, 476], bilek: [8, 640], el: 'acik', elAci: 100 },
}));

// B: gözlüğünü burnuna iter (işaret parmağı köprüde), öbür kol sarkık
poz('B3', 'gözlüğü iter', "'isaret'", [-40, 70, 480, 530], (k) => figur(P.B, k, 'b3', {
  ifade: 'sikkin', kollar: (o, ortak) => {
    const r = { ...ortak, kolBoyu: 'sivali' };
    const hedef = [200, GOZ_Y - 2];
    // el yanaktan gelir (parmak köprüde, yumruk sağ yanakta): ağzı örtmez, "şşş" ile karışmaz
    const bilek = bilekBul({ el: 'isaret', hedef, elAci: -122, elBoy: EB, basparmak: -1 });
    return sarkik(o.sol, -1, r, 42) + kolSVG({ ...r, omuz: o.sag, dirsek: [312, 436], bilek, el: 'isaret', elAci: -122, elBoy: EB, basparmak: -1, taraf: 'sag', tohum: 41 });
  },
}));

// C: eli çenesinde, dirseği tekerlekli sandalyenin kolçağında; öbür kol öbür kolçakta
poz('C', 'eli çenede, kolçak', "'cene'", [-50, 70, 520, 530], (k) => {
  const p = P.C, hh = p.yuzBoy;
  const { sekil, cizgi, dikd } = araclar(511, k, 0.5);
  const tekerlek = (cx) => cizgi(Array.from({ length: 11 }, (_, i) => { const a = (196 + i * 15) * Math.PI / 180; return [cx + 250 * Math.cos(a), 840 + 250 * Math.sin(a)]; }), 4.2) +
    cizgi(Array.from({ length: 11 }, (_, i) => { const a = (200 + i * 14) * Math.PI / 180; return [cx + 226 * Math.cos(a), 840 + 226 * Math.sin(a)]; }), 2.6);
  const arka = tekerlek(470) + tekerlek(-70);
  const kolcak = (x0, x1) => sekil(dikd(x0, 520, x1, 548, 12, 14), MONO.giysi[4], 4.2) + sekil(dikd(x0 + (x1 - x0) * 0.62, 548, x0 + (x1 - x0) * 0.62 + 16, 660), MONO.giysi[5], 3.6);
  return figur(p, k, 'c', {
    ifade: 'merak', bakis: [1, -1], gogus: 122, kalinlik: 74, arka, on: kolcak(352, 476) + kolcak(-76, 48), kollar: (o, ortak) => {
      const r = { ...ortak, manset: 'ribana' };
      const hedef = [198, 176 + hh + 4];
      const bilek = bilekBul({ el: 'cene', hedef, elAci: -116, elBoy: EB, basparmak: -1, ad: 'cene' });
      const cene = kolSVG({ ...r, omuz: o.sag, dirsek: [392, 506], bilek, el: 'cene', elAci: -116, elBoy: EB, basparmak: -1, taraf: 'sag', tohum: 51 });
      const sol = kolSVG({ ...r, omuz: o.sol, dirsek: [4, 500], bilek: [-14, 528], el: 'yumruk', elAci: 112, elBoy: EB * 0.95, kisalma: 0.75, taraf: 'sol', basparmak: -1, tohum: 52 });
      return sol + cene;
    },
  });
});

// D: tablet kalemiyle işaret eder (sağ el: tutma + kalem), sol el tableti tutar; blazer + gömlek manşeti
poz('D1', 'kalemle işaret', "'tutma'", [-30, 60, 540, 540], (k) => figur(P.D, k, 'd1', {
  ifade: 'merak', bakis: [1, -1], kollar: (o, ortak) => {
    const r = { ...ortak, manset: 'gomlek' };
    const { sekil, cizgi, dikd } = araclar(631, k, 0.5);
    // tablet: gövdenin önünde, hafif yatık; sol el sol kenarını kavrar
    const tablet = `<g transform="rotate(-8 190 520)">${sekil(dikd(126, 452, 262, 590, 10, 16), MONO.giysi[1], 4.2)}${sekil(dikd(138, 464, 250, 578, 4, 16), '#e9e5dd', 2.6, [0, 0])}</g>`;
    const kal = kolSVG({ ...r, omuz: o.sag, dirsek: [404, 438], bilek: [410, 300], el: 'tutma', elAci: -64, elBoy: EB, basparmak: 1, taraf: 'sag', nesne: 'kalem', nesneAci: -30, tohum: 61 });
    const tut = kolSVG({ ...r, omuz: o.sol, dirsek: [34, 494], bilek: [92, 548], el: 'tutma', elAci: -38, elBoy: EB, basparmak: -1, taraf: 'sol', araya: tablet, tohum: 62 });
    return tut + kal;
  },
}));

// D: masaya dayanır (iki el düz), masa önde
poz('D2', 'masaya dayanır', "'dayanma'", [-50, 92, 500, 540], (k) => {
  const { sekil, dikd } = araclar(621, k, 0.5);
  const yog = (pts) => dikd(0, 0, 0, 0).length && pts; // (yer tutucu)
  void yog;
  // masa üstü (hafif yukarıdan görülen yüzey) ve ön kenar
  const ust = [];
  const kenar = (a, b, n) => { for (let i = 0; i < n; i++) ust.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };
  kenar([-160, 516], [560, 516], 18); kenar([560, 516], [580, 612], 3); kenar([580, 612], [-180, 612], 18); kenar([-180, 612], [-160, 516], 3);
  const masa = sekil(ust, '#cfc9bd', 4.2) + sekil(dikd(-180, 612, 580, 720, 0, 40), '#a59e91', 4.2);
  return figur(P.D, k, 'd2', {
    ifade: 'notr', on: masa, kollar: (o, ortak) => {
      const r = { ...ortak, manset: 'gomlek', el: 'dayanma', elBoy: EB * 1.05, kisalma: 0.7 };
      return kolSVG({ ...r, omuz: o.sol, dirsek: [20, 458], bilek: [80, 532], elAci: 66, basparmak: -1, taraf: 'sol', tohum: 71 }) +
        kolSVG({ ...r, omuz: o.sag, dirsek: [380, 458], bilek: [320, 532], elAci: 114, basparmak: 1, taraf: 'sag', tohum: 72 });
    },
  });
});

// ---------- El yakın planları (6 poz): yen kadrajın altından girer
const EL_ADI = { acik: 'açık', tutma: 'tutma', yumruk: 'yumruk', cene: 'çene', isaret: 'işaret', dayanma: 'dayanma' };
const EL_PLAN = {
  acik: { aci: -78, yuz: 'avuc', bs: 1 }, tutma: { aci: -62, bs: -1, cubuk: true }, yumruk: { aci: -74, bs: -1 },
  cene: { aci: -96, bs: -1 }, isaret: { aci: -72, bs: -1 }, dayanma: { aci: 74, bs: 1, kis: 0.8, masa: true },
};
function elYakin(ad, k) {
  const c = EL_PLAN[ad], bilek = [0, 0], eb = 150;
  const a = c.aci * Math.PI / 180, t = [Math.cos(a), Math.sin(a)], n = [-t[1], t[0]];
  const omuz = [bilek[0] - t[0] * 380 - n[0] * 40, bilek[1] - t[1] * 380 - n[1] * 40];
  const { sekil } = araclar(700, k, 0.5);
  let araya = '';
  if (c.cubuk) {
    const b = [bilek[0] + t[0] * eb * 0.5, bilek[1] + t[1] * eb * 0.5], r = 12, L = 150;
    const p0 = [b[0] - n[0] * L, b[1] - n[1] * L], p1 = [b[0] + n[0] * L, b[1] + n[1] * L];
    araya = sekil([[p0[0] + t[0] * r, p0[1] + t[1] * r], [p1[0] + t[0] * r, p1[1] + t[1] * r], [p1[0] - t[0] * r, p1[1] - t[1] * r], [p0[0] - t[0] * r, p0[1] - t[1] * r]], MONO.giysi[4], 3.4, [2, 2]);
  }
  if (c.masa) araya = '';
  const masa = c.masa ? sekil([[-400, -40], [400, -40], [430, 150], [-430, 150]], '#cfc9bd', 4.2) + sekil([[-430, 150], [430, 150], [430, 400], [-430, 400]], '#a59e91', 4.2) : '';
  const s = masa + kolSVG({ omuz, dirsek: [(omuz[0] + bilek[0]) / 2, (omuz[1] + bilek[1]) / 2], bilek, giysi: MONO.giysi[2], ten: MONO.ten[2], kalinlik: 70, manset: 'duz', el: ad, elAci: c.aci, elBoy: eb, yuz: c.yuz || 'sirt', basparmak: c.bs, kisalma: c.kis ?? null, araya, kaynama: k, tohum: 80 + EL_POZLARI.indexOf(ad) });
  return { s, m: [bilek[0] + t[0] * eb * 0.4, bilek[1] + t[1] * eb * 0.4] };
}

// ---------- Kuş bakışı: çekmece ön kapağını iki elle tutar (vidalar içeride)
function kusBakisi(k) {
  const { sekil, dikd } = araclar(901, k, 0.6);
  const { giysi, ten } = renk(P.B);
  let s = '';
  // çekmece gövdesi (üstten) ve içi: geniş kadraja yetsin diye yanlara taşar
  s += sekil(dikd(-420, -260, 1500, 150, 6, 60), '#b5b1aa', 3.2, [2, 2]) + sekil(dikd(-400, -260, 1480, 132, 4, 60), '#ebe7df', 2.6, [0, 0]);
  const r = rng(77);
  for (let i = 0; i < 46; i++) { const x = -120 + r() * 1320, y = 30 + r() * 92, a = r() * 180; s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})">${sekil([[-14, -3], [12, -3], [15, 0], [12, 3], [-14, 3]], '#b0a99c', 1.8, [1, 1])}</g>`; }
  const kapak = sekil(dikd(-440, 132, 1520, 168, 6, 60), '#a59e91', 4.2);
  const ortak = { boy: 150, ten, giysi, kolBoyu: 'sivali', kaynama: k, kolUzun: 460, kalinlik: 66 };
  s += elUstten({ ...ortak, merkez: [372, 146], aci: -97, taraf: 'sol', araya: kapak, tohum: 3 });
  s += elUstten({ ...ortak, merkez: [708, 146], aci: -83, taraf: 'sag', tohum: 4 });
  return { s, m: [540, 214], vh: 340 };
}

// ---------- Yerleşim
const PAY = DIKEY ? 48 : 56;
const ETK = 38;
function cerceve(x, y, w, h, k, tohum) {
  const { cizgi } = araclar(tohum, k, 0.35);
  const n = 10, pts = [];
  for (let i = 0; i < n; i++) pts.push([x + w * i / n, y]);
  for (let i = 0; i < n; i++) pts.push([x + w, y + h * i / n]);
  for (let i = 0; i < n; i++) pts.push([x + w - w * i / n, y + h]);
  for (let i = 0; i < n; i++) pts.push([x, y + h - h * i / n]);
  return cizgi(pts, 2.6, M, true);
}
const metin = (x, y, s, { boyut = 20, agirlik = 600, aile = 'Schibsted Grotesk', renk: r = M, harf = 0, buyuk = false, anchor = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-family="'${aile}', sans-serif" font-weight="${agirlik}" font-size="${boyut}" letter-spacing="${harf}" fill="${r}" text-anchor="${anchor}"${buyuk ? ' style="text-transform:uppercase"' : ''}>${s}</text>`;
const etiketYaz = (x, y, ad, kod) => `<text x="${x}" y="${y}" font-family="'Schibsted Grotesk', sans-serif"><tspan font-weight="700" font-size="15" letter-spacing="2" fill="${VY}" style="text-transform:uppercase">${ad}</tspan><tspan dx="12" font-weight="400" font-size="15" fill="#6f695f">${kod}</tspan></text>`;
function hucre(x, y, w, h, vb, icerik, k, tohum, ad, kod) {
  let s = `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid ${TEK ? 'meet' : 'slice'}" overflow="hidden">${icerik}</svg>`;
  s += cerceve(x, y, w, h, k, tohum);
  if (ad) s += etiketYaz(x + 2, y + h + 24, ad, kod || '');
  return s;
}
function satir(x, y, gen, aralik, ogeler) {
  const top = ogeler.reduce((a, o) => a + o.vb[2] / o.vb[3], 0), h = (gen - aralik * (ogeler.length - 1)) / top;
  let cx = x;
  return { h, yer: ogeler.map((o) => { const w = h * o.vb[2] / o.vb[3], r = { o, x: cx, y, w, h }; cx += w + aralik; return r; }) };
}
const bul = (ad) => POZ.find((p) => p.ad === ad);
function yerlesim() {
  const L = [];
  if (!DIKEY) {
    const y0 = 124, h1 = 288, gen = W - 2 * PAY, ar = 20;
    const r1 = satir(PAY, y0, (h1 * ['A', 'B1', 'B2', 'B3'].map(bul).reduce((t, o) => t + o.vb[2] / o.vb[3], 0)) + 3 * ar, ar, ['A', 'B1', 'B2', 'B3'].map(bul));
    L.push(...r1.yer);
    const sonX = r1.yer[3].x + r1.yer[3].w;
    L.push({ not: true, x: sonX + 34, y: y0 + 6, w: W - PAY - sonX - 34, h: h1 });
    const y2 = y0 + h1 + ETK;
    const r2o = ['C', 'D1', 'D2'].map(bul), w2 = r2o.map((o) => h1 * o.vb[2] / o.vb[3]);
    let x = PAY;
    r2o.forEach((o, i) => { L.push({ o, x, y: y2, w: w2[i], h: h1 }); x += w2[i] + ar; });
    L.push({ kus: true, x, y: y2, w: W - PAY - x, h: h1 });
    const y3 = y2 + h1 + ETK, eh = H - PAY + 14 - y3 - ETK, ew = (gen - 5 * 16) / 6;
    EL_POZLARI.forEach((ad, i) => L.push({ el: ad, x: PAY + i * (ew + 16), y: y3, w: ew, h: eh }));
  } else {
    const gen = W - 2 * PAY, y0 = 196, ar = 18;
    const sabit = (ogeler, y, h) => {
      const ws = ogeler.map((o) => h * o.vb[2] / o.vb[3]), top = ws.reduce((t, v) => t + v, 0) + ar * (ogeler.length - 1);
      let x = PAY + (gen - top) / 2;
      return ogeler.map((o, i) => { const r = { o, x, y, w: ws[i], h }; x += ws[i] + ar; return r; });
    };
    const hA = 384, hC = 300;
    L.push(...sabit(['A', 'B1'].map(bul), y0, hA));
    L.push(...sabit(['B2', 'B3'].map(bul), y0 + hA + ETK, hA));
    const y3 = y0 + 2 * (hA + ETK);
    L.push(...sabit(['C', 'D1', 'D2'].map(bul), y3, hC));
    const y4 = y3 + hC + ETK, eh = 150, ew = (gen - 5 * 12) / 6;
    const kh = H - PAY + 12 - y4 - (eh + ETK) - ETK;
    L.push({ kus: true, x: PAY, y: y4, w: gen, h: kh });
    EL_POZLARI.forEach((ad, i) => L.push({ el: ad, x: PAY + i * (ew + 12), y: y4 + kh + ETK, w: ew, h: eh }));
  }
  return L;
}
// ?tek=A|B1|…|el-acik|kus : tek hücre tüm sahnede (inceleme)
const TEK = q.get('tek');
const YER = TEK ? [TEK.startsWith('el-') ? { el: TEK.slice(3), x: 20, y: 20, w: W - 40, h: H - 80 } : TEK === 'kus' ? { kus: true, x: 20, y: 20, w: W - 40, h: H - 80 } : { o: bul(TEK), x: 20, y: 20, w: W - 40, h: H - 80 }] : yerlesim();

function baslik() {
  const x = PAY, y = DIKEY ? 104 : 88;
  let s = metin(x, y, 'Kol ve el', { aile: 'Big Shoulders Display', agirlik: 900, boyut: DIKEY ? 96 : 80, buyuk: true, harf: 0.5 });
  const alt = 'M2 · stil karesi · kol.js — insan.js çizgi dili, MONO gri, kaynama 8 fps';
  s += DIKEY ? metin(x, y + 46, alt, { boyut: 22, agirlik: 600 }) : metin(x + 316, y - 8, alt, { boyut: 22, agirlik: 600 });
  return s;
}
function notSatiri(c) {
  const x = c.x, y = c.y;
  let t = metin(x, y + 34, 'kol.js', { aile: 'Big Shoulders Display', agirlik: 800, boyut: 38, buyuk: true, harf: 0.5 });
  const api = [
    'kolSVG({ omuz, dirsek | kolIK(…), bilek,',
    '   el, elAci, elBoy, taraf, basparmak,',
    '   kalinlik, giysi, ten, manset, kolBoyu,',
    '   araya, nesne, golge, kaynama })',
    'govdeKes(p) · omuzlar(p) · bilekBul({…})',
    'elUstten({ merkez, aci, boy, taraf, araya })',
  ];
  api.forEach((s2, i) => { t += metin(x, y + 70 + i * 23, s2.replace(/ /g, ' '), { boyut: 16, agirlik: 600, aile: 'Schibsted Grotesk', renk: M }); });
  const not = ['Omuz başı yuvarlak: kol hangi yöne dönerse omuzu o kapatır.', 'El boyu ≈ yüz boyunun %75’i; MONO ten, kol giysi renginde.', 'Kaynama 8 fps · 4 çizim · dolgu 3 birim kayık.'];
  not.forEach((s2, i) => { t += metin(x, y + 228 + i * 22, s2, { boyut: 15, agirlik: 400, renk: '#5f5a53' }); });
  return t;
}

let son = -1;
function ciz(k) {
  if (k === son) return; son = k;
  let s = TEK ? '' : baslik();
  for (const c of YER) {
    if (c.o) s += hucre(c.x, c.y, c.w, c.h, c.o.vb, c.o.ciz(k), k, 1000 + Math.round(c.x), `${c.o.ad[0]} · ${c.o.etiket}`, c.o.kod);
    else if (c.el) {
      const e = elYakin(c.el, k), vh = 250, vw = vh * c.w / c.h;
      s += hucre(c.x, c.y, c.w, c.h, [e.m[0] - vw / 2, e.m[1] - vh / 2, vw, vh], e.s, k, 2000 + Math.round(c.x + c.y), `el · ${EL_ADI[c.el]}`, DIKEY ? '' : `'${c.el}'`);
    } else if (c.kus) {
      const b = kusBakisi(k), vh = b.vh, vw = vh * c.w / c.h;
      s += hucre(c.x, c.y, c.w, c.h, [b.m[0] - vw / 2, b.m[1] - vh / 2, vw, vh], b.s, k, 3000, 'kuş bakışı · iki el', 'elUstten()');
    } else if (c.not) s += notSatiri(c);
  }
  svg.innerHTML = s;
}

const hataEl = document.getElementById('hata');
const kaynaIndis = (t) => Math.floor(t * 8) % 4;
window.tanitim = { kare: (t) => { try { ciz(kaynaIndis(t)); } catch (e) { hataEl.textContent = e.stack; } }, sure: () => 1 };
await document.fonts.ready;
try { ciz(0); } catch (e) { hataEl.textContent = e.stack; console.error(e); }
window.tanitimHazir = true;
if (!CEKIM) { const dongu = (t) => { window.tanitim.kare(t / 1000); requestAnimationFrame(dongu); }; requestAnimationFrame(dongu); }
