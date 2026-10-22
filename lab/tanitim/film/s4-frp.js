// Sahne 4, FRP MASASI (#14–#17, k1536–2015). Kadro (kadro.json): E (DM; kısa, zayıf, gözlüklü), E2 (punk: mohawk, deri ceket,
// piercing), E3 (tosun, yanaklı, sakallı), E4 (başörtülü, gözlüklü). Oval masa; masada elle çizilmiş harita, piyon yerine dört
// TAVLA PULU; E'nin önünde markasız, düz, üç kanatlı DM perdesi. Herkes masanın arkasında, yüzü bize dönük: E ortada ve önde
// (kahraman), E3 solda, E4 solda arkada, E2 sağda. Arkadaşlar ön kollarını masaya dayamış öne eğilir (kol.js, masanın üstünde).
// #14 (k1536–1631) Gerilim: üç arkadaş öne eğilir (12 fps), gözleri E'de; E perdenin ardından kısık gözle bakar, k1596'dan
//     zarları yumruğunda sallar (30 fps titreme). Yatayda duvar saatinin yelkovanı ilerler (dikeyde solda sarkan lamba).
//     Kamera E'ye doğru hızlanarak iter.
// #15 (k1632–1727) Kesme: masaya yakın plan (E3 ve E2'nin başı kadraj dışında). E yumruğu kaldırır (k1632), atar (k1638, el
//     açılır, parmaklar haritaya; 30 fps; dikeyde sağ kolla, E4'ün önünden geçmesin). İki tavla zarı (noktalı d6, pul
//     boyunda) haritada takla atar, sekip durur (2 karede bir çizim): hep yek. k1640–1652 sessizlik (nefes tutulur: kaşlar
//     kalkık), k1652/1655 'zar'; kamera k1646'dan yazıya yer açarak yükselir. Arkadaşlar söylenir. E zara bakar:
//     "Keşke FRP zarlarım olsa… / bir d20, bir d8…" (k1664–1782, iki satır sırayla yazılır).
// #16 (k1728–1823) Kesme: E ve balonlar. E'nin düşünce balonu (k1730; kadraja tam sığar, noktaları E'nin başından çıkar):
//     d20, d8 (cizimler.js) + el yazısı etiketleri; tavla pulu çizilir, silinir, yerine kendi piyonları çizilir; turuncu halka
//     (dilek, k1786). E eli çenesinde, gözü balonda; sonra arkadaşlarına döner: "Piyonlarımızı / kendimiz tasarlasak?"
//     (k1790–1880). Arkadaşların yüzünde fikir belirir. Bulut k1812'de söner, kesmede yoktur.
// #17 (k1824–2015) Kesme: genel plan. E2 doğrulur, yumruğunu kaldırır, titretir; k1866 kısa sessizlik, k1876 masaya vurur:
//     masa 12 fps ezilir, zarlar ve pullar zıplar, kamera sarsılır, darbe çizgileri; E'nin balonu sözü kesilmiş gibi kapanır.
//     E2: "Abi, bundan / kutu oyunu mu yapsak?" (k1884); "kutu oyunu" turuncu alt çizgi (k1922). Balon büyür (k1932; yatayda
//     sağa, dikeyde yukarı), boş bölgesine sığan en büyük boyda kutu oyunu çizilir (cizimler.js), 4 piyon kapağın köşegeni
//     boyunca tek tek iner (k1962–1994, 4 'tik'). Herkesin gözü parlar (merak/şaşkın, göz parıltısı, turuncu pırıltılar).
//     Gerçek ürün yok; k2016'da kesme (katmanlar gizlenir).
// Sözleşme (v1-kanca kalıbı): kur(ctx) yalnız ctx.tl'ye MUTLAK kare zamanlı tween ekler; window'a bir şey yazmaz.
// Kişiler çekirdeğin ctx.kisi'si yerine burada kurulur: gövde kesimi (kol çıkan yanda) ve kollar ayrı katmanda (masanın üstünde)
// çizilsin diye. kol.js omuzlar() orta gövdeyi varsaydığından omuz ve gövde kesimi yapıya (insan.js YAPI) göre düzeltilir.
// Düz kenarlı çizimler (perde, raf, cizimler.js'teki d20, d8, piyon, kutu) köşelerine yakın ara noktayla çizilir: çekirdeğin
// Catmull-Rom yolu dört noktalı bir kutuyu yastığa çeviriyordu. Biçim cizimler.js ile aynıdır (yalnız kenarlar düz kalır).
import { kisiSVG, YAPI, BOY, GOZ_Y, MONO, PALET, yol, rng } from '../insan.js';
import { kolSVG, kolIK, bilekBul } from '../kol.js';
import { CIZIMLER } from './cizimler.js';

// Caveat ancak bir öğe kullanınca indirilir; document.fonts.ready onu beklemez (s5-kalabalik ile aynı önlem). Balonlar ve
// "kutu oyunu" alt çizgisi yazı genişliği ölçülerek kurulur: yalnız bu modül yüklenince ölçüm yedek yazı tipiyle yapılıyor,
// balonlar ~%40 geniş çıkıyor, doğrudan geç bir kareye atlanınca alt çizgi yanlış boyda kalıyordu.
try { await document.fonts.load('600 62px Caveat', 'Keşke FRP zarlarım olsa… bir d20, bir d8 Piyonlarımızı kendimiz tasarlasak? Abi, bundan kutu oyunu mu yapsak? If only I had real RPG dice… a d20, a d8 What if we designed our own pawns? Dude, should we make this a board game?'); } catch { /* yoksa yedekle sürer */ }

const BAS = 1536, SON = 2015;
const M = PALET.murekkep;
const D2R = Math.PI / 180;
const EB = 116;                 // el boyu (kutu birimi; kol.js önerisi: yüz boyunun ~%75'i)
const DERI = '#46423d';         // insan.js deri ceketin mono tonu (E2'nin kolları da deri)
const SIFIR = { sap: () => 0 };
const f1 = (v) => (+v).toFixed(1);
const f3 = (v) => (+v).toFixed(3);

// El titremeli kalem (kol.js kalemKur kopyası): her çağrı kendi sabit sapmasını, kareye göre kaynamasını alır
function kalem(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}

// Düz kenar: her kenarın uçlarına r px yakın ara nokta (uzun kenara orta nokta) eklenir; Catmull-Rom kenarı şişirmez
function duz(pts, kapali = true, r = 5) {
  const n = pts.length, out = [], m = kapali ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = Math.min(0.3, r / L);
    const ara = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out.push(a, ara(u));
    if (L > 8 * r) out.push(ara(0.5));
    out.push(ara(1 - u));
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}

// ---------- Gövde ölçüleri (yapıya göre): omuz eklemleri, omuz eğiminin bittiği nokta
function omuzlar(p, kalinlik) {
  const Y = YAPI[p.yapi] || YAPI.orta, ek = p.boy === 'uzun' ? 8 : 0;
  const omuzY = GOZ_Y + 4 + p.yuzBoy + ek + 40, r0 = kalinlik / 2, dx = 160 * Y.en - r0 + 2;
  const y = omuzY + 18 + r0 - Y.omuz * 0.5;
  return { sol: [200 - dx, y], sag: [200 + dx, y], ucu: (yon) => [200 + yon * 119 * Y.en, omuzY + 14 - Y.omuz * 0.5], omuzY };
}
// Gövde kesimi (kol.js govdeKes'in yapıya uyarlanmış kopyası): kol çizilen yanda pelerin silüeti göğüs hattından kesilir
function govdeKes(p, { sol, sag, id, kaynama, w = 4.2 }) {
  const Y = YAPI[p.yapi] || YAPI.orta, en = Y.en, ek = p.boy === 'uzun' ? 8 : 0, om = Y.omuz;
  const cx = 200, ceneY = GOZ_Y + 4 + p.yuzBoy, omuzY = ceneY + ek + 40, y0 = omuzY + 10, gg = 108 * en;
  const yan = (yon) => [[cx + yon * 119 * en, omuzY + 14 - om * 0.5], [cx + yon * 126 * en, omuzY + 44 - om * 0.3], [cx + yon * (gg + 8), omuzY + 86],
    [cx + yon * (gg + 1), omuzY + 124], [cx + yon * gg, omuzY + 210], [cx + yon * (gg + 4), 560], [cx + yon * (gg + 9), 680]];
  const R = yan(1), L = yan(-1);
  const d = (pts) => yol(pts, false, SIFIR).replace(/^M/, 'L');
  const kd = `M-1000 -1000 L1400 -1000 ` +
    (sag ? `L1400 ${y0} L${cx + 119 * en} ${y0} ${d(R)} L${cx + gg + 9} 900 ` : `L1400 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} L${cx - 119 * en} ${y0} L-1000 ${y0} Z` : `L-1000 900 Z`);
  const hw = p.yuzEn;
  const gd = `M${cx - hw * 0.5} ${ceneY + 10} L${cx + hw * 0.5} ${ceneY + 10} L${cx + 118 * en} ${omuzY + 14} ` +
    (sag ? `${d(R)} L${cx + gg + 9} 900 ` : `L${cx + 164 * en} ${omuzY + 56} L${cx + 180 * en} 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} ` : `L${cx - 180 * en} 900 L${cx - 164 * en} ${omuzY + 56} `) + `L${cx - 118 * en} ${omuzY + 14} Z`;
  const s = kalem(p.tohum + 41, kaynama);
  const cz = (pts) => `<path d="${yol(pts, false, s())}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {
    tanim: `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${kd}"/></clipPath><clipPath id="${id}-g" clipPathUnits="userSpaceOnUse"><path d="${gd}"/></clipPath></defs>`,
    klip: `clip-path="url(#${id})"`, kontur: (sag ? cz(R) : '') + (sol ? cz(L) : ''),
  };
}

// Dirsek: iki IK çözümünden dıştakini seç (yon −1: ekranın solu)
const dirsekDis = (omuz, bilek, yon, ust = 160, alt = 150) => { const a = kolIK(omuz, bilek, ust, alt, 1), b = kolIK(omuz, bilek, ust, alt, -1); return (a[0] - b[0]) * yon >= 0 ? a : b; };
const dirsekAlt = (omuz, bilek, ust = 160, alt = 150) => { const a = kolIK(omuz, bilek, ust, alt, 1), b = kolIK(omuz, bilek, ust, alt, -1); return a[1] >= b[1] ? a : b; };
const aciDer = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;

// ---------- Tavla zarı (d6, noktalı): v2-zar'ın altıgen d6 çizimi (üst yüz + iki yan yüz), her yüzde noktalar
const ALTI = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26]];
const YUZ = {
  ust: [[0, -0.52], [0.46, -0.26], [0, -0.01], [-0.46, -0.26]],
  sol: [[-0.46, -0.26], [0, -0.01], [0, 0.52], [-0.46, 0.26]],
  sag: [[0, -0.01], [0.46, -0.26], [0.46, 0.26], [0, 0.52]],
};
const PIP = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
// Dörtgen yüzde (u, v ∈ [-1, 1]) çift doğrusal nokta; yayılım 0,3
function yuzNokta(q, u, v) {
  const s = 0.5 + 0.3 * u, t = 0.5 + 0.3 * v;
  const a = (1 - s) * (1 - t), b = s * (1 - t), c = s * t, d = (1 - s) * t;
  return [a * q[0][0] + b * q[1][0] + c * q[2][0] + d * q[3][0], a * q[0][1] + b * q[1][1] + c * q[2][1] + d * q[3][1]];
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, W, H, DIKEY, VURGU, BALON, adim } = ctx;
  const ka = (n) => k(adim(n)); // 12 fps poz ızgarası
  ctx.vurus(14, 'Gerilim, E perdenin ardında', 1536, 1631);
  ctx.vurus(15, 'Tavla zarları, "Keşke…"', 1632, 1727);
  ctx.vurus(16, 'Düşünce: d20, d8, piyon', 1728, 1823);
  ctx.vurus(17, 'E2 vurur: kutu oyunu', 1824, 2015);

  // cizimler.js çizimi, düz kenarlarla (köşe sayısı az olan konturlar sıklaştırılır; ovaller olduğu gibi)
  const cizim = (ust, ad, { c, boy, kalinlik = 5, tohum = 40, renk, dolgu = null }) => CIZIMLER[ad].map((kt, i) => {
    const pts = kt.p.map(([x, y]) => [c[0] + x * boy, c[1] + y * boy]);
    return cizgi(ust, pts.length <= 8 ? duz(pts, !!kt.kapali, Math.max(3, boy * 0.025)) : pts,
      { kapali: !!kt.kapali, kalinlik, tohum: tohum + i, genlik: 1.0, renk, dolgu: kt.kapali ? dolgu : null });
  });

  // ---------- Katmanlar: oda (duvar) < sahne (kişiler, masa, kollar, perde, zarlar) < balonlar
  const L0 = ctx.katman('s4-frp-oda', 9), L = ctx.katman('s4-frp', 10), LB = ctx.katman('s4-frp-balon', 11);
  for (const K of [L0, L, LB]) {
    gsap.set(K.div, { autoAlpha: 0 });
    tl.set(K.div, { autoAlpha: 0 }, 0);
    tl.set(K.div, { autoAlpha: 1 }, k(BAS));
    tl.set(K.div, { autoAlpha: 0 }, k(SON + 1));
  }
  tl.set(ctx.itme, { x: 0, y: 0 }, k(BAS));
  const sahnede = () => { const t = tl.time(); return t >= k(BAS) - 0.02 && t < k(SON + 1); };

  // ---------- Yerleşim (dünya koordinatı). Masa: oval üst yüz; kişiler uzak kenarın arkasında, kenar göğüslerini keser.
  const MASA = ctx.yer({ c: [940, 885], r: [820, 210] }, { c: [540, 1480], r: [640, 250] });
  const kenarY = (x) => MASA.c[1] - MASA.r[1] * Math.sqrt(Math.max(0, 1 - ((x - MASA.c[0]) / MASA.r[0]) ** 2));
  const KESIT = 460; // masa uzak kenarı orta boylu kişinin kutusunda bu yükseklikten geçer (göğüs ortası)
  const YER = ctx.yer({
    E3: { x: 300, s: 1.12 }, E4: { x: 640, s: 0.96 }, E: { x: 1000, s: 1.18 }, E2: { x: 1440, s: 1.12 },
  }, {
    E3: { x: 175, s: 0.98 }, E4: { x: 375, s: 0.8 }, E: { x: 560, s: 1.04 }, E2: { x: 880, s: 0.96 },
  });

  // ---------- Oyuncu: gövde (masanın altında) ve kollar (masanın üstünde) iki ayrı svg, ortak eğilme dönüşümü
  const gGovde = el(L.svg, 'g'), gMasa = el(L.svg, 'g'), gKol = el(L.svg, 'g'), gPerde = el(L.svg, 'g'), gZar = el(L.svg, 'g'), gEfekt = el(L.svg, 'g');
  const oyuncular = [];
  function oyuncu(ad, { kalinlik = 64, kollar, giysi = null, manset = 'duz', kolBoyu = 'uzun' }) {
    const p = ctx.kisiParam(ad), { x, s } = YER[ad];
    const alt = kenarY(x) - (KESIT - BOY.boy) * s + ctx.boyKaymasi(p) * s;
    const x0 = x - BOY.en * s / 2, y0 = alt - BOY.boy * s;
    const gB = el(gGovde, 'g'), gK = el(gKol, 'g');
    const yap = (g) => el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * s, height: BOY.boy * s, x: x0, y: y0, overflow: 'visible' });
    const sB = yap(gB), sK = yap(gK);
    const o = omuzlar(p, kalinlik);
    const id = `s4-${ad}`;
    const h = {
      ad, p, s, x, alt, ifade: 'notr', bakis: [0, 0], kol: 'masa', titre: [0, 0], parilti: false, o,
      dunya: ([u, v]) => [x0 + u * s, y0 + v * s],
      // masa kenarının bu kişinin kutusundaki yüksekliği
      kenar: KESIT - ctx.boyKaymasi(p),
    };
    let son = 0;
    h.ciz = (i) => {
      if (i != null) { son = Math.max(0, i); if (!sahnede()) return; }
      const ortak = { giysi: giysi || MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik, kaynama: son, manset, kolBoyu, golge: { klip: `url(#${id}-g)` } };
      const kl = kollar(h, o, ortak) || {};
      const G = govdeKes(p, { sol: !!kl.sol, sag: !!kl.sag, id, kaynama: son });
      sB.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: son, ifade: h.ifade, bakis: h.bakis, mono: true })}</g>` + G.kontur + (h.parilti ? parilti(h) : '');
      sK.innerHTML = (kl.sol || '') + (kl.sag || '');
    };
    h.poz = ({ ifade, bakis, kol, titre } = {}) => {
      if (ifade) h.ifade = ifade; if (bakis) h.bakis = bakis; if (kol) h.kol = kol; if (titre) h.titre = titre;
      h.ciz();
    };
    // Eğilme ve doğrulma: masadaki temas noktası çevresinde (gövde + kollar birlikte)
    h.d = { dx: 0, dy: 0, aci: 0, s: 1, px: x, py: kenarY(x) };
    h.uygula = () => {
      const d = h.d;
      const t = `translate(${f1(d.dx)} ${f1(d.dy)}) rotate(${f3(d.aci)} ${f1(d.px)} ${f1(d.py)}) translate(${f1(d.px)} ${f1(d.py)}) scale(${f3(d.s)}) translate(${f1(-d.px)} ${f1(-d.py)})`;
      gB.setAttribute('transform', t); gK.setAttribute('transform', t);
    };
    // Duruş tween'i (12 fps adımlı, ya da verilen eğri): MUTLAK kare zamanlı
    h.dur = (n0, sure, hedef, ease = null) => tl.to(h.d, { ...hedef, duration: k(sure), ease: ease || `steps(${Math.max(1, Math.round(sure / 5))})`, onUpdate: h.uygula }, k(n0));
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    oyuncular.push(h);
    return h;
  }
  // Göz parıltısı (#17 sonu): göz bebeklerinin üstünde beyaz noktalar
  function parilti(h) {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz, [bx, by] = h.bakis;
    let s = '';
    for (const yon of [-1, 1]) {
      const gx = 200 + yon * hw * 0.38 + bx * 3, gy = GOZ_Y + by * 2;
      s += `<circle cx="${f1(gx + 1.6)}" cy="${f1(gy - 2.4)}" r="3" fill="#ffffff"/><circle cx="${f1(gx - 2)}" cy="${f1(gy + 2.6)}" r="1.4" fill="#ffffff"/>`;
    }
    return s;
  }

  // Ön kol masada, el düz (dayanma): dirsek masa kenarının hemen önünde, avuç içe doğru (öne eğilmiş duruş)
  const masadaEl = (o, ortak, dirsek, hedef, yon, tohum) => {
    const omuz = yon < 0 ? o.sol : o.sag, basparmak = yon < 0 ? 1 : -1, kisalma = 0.74;
    const elAci = aciDer(dirsek, hedef);
    const bilek = bilekBul({ el: 'dayanma', hedef, elAci, elBoy: EB, basparmak, kisalma, ad: 'avuc' });
    return kolSVG({ ...ortak, omuz, omuzUcu: o.ucu(yon), dirsek, bilek, el: 'dayanma', elAci, elBoy: EB, basparmak, kisalma, taraf: yon < 0 ? 'sol' : 'sag', tohum });
  };
  // Eli çenede (kol-test 'C' pozu): parmak sırtları çeneyi taşır, dirsek masada
  const ceneEl = (h, o, ortak, yon, tohum, dirsek) => {
    const omuz = yon < 0 ? o.sol : o.sag, elAci = yon > 0 ? -116 : -64, basparmak = yon > 0 ? -1 : 1;
    const hedef = [200 - yon * 2, GOZ_Y + 4 + h.p.yuzBoy + 4];
    const bilek = bilekBul({ el: 'cene', hedef, elAci, elBoy: EB, basparmak, ad: 'cene' });
    return kolSVG({ ...ortak, omuz, omuzUcu: o.ucu(yon), dirsek, bilek, el: 'cene', elAci, elBoy: EB, basparmak, taraf: yon < 0 ? 'sol' : 'sag', tohum });
  };
  // Yumruk (havada ya da masada): bilek, yumruğun bakış açısı
  const yumruk = (o, ortak, yon, bilek, elAci, tohum, dirsek = null) => {
    const omuz = yon < 0 ? o.sol : o.sag;
    return kolSVG({ ...ortak, omuz, omuzUcu: o.ucu(yon), dirsek: dirsek || dirsekDis(omuz, bilek, yon), bilek, el: 'yumruk', elAci, elBoy: EB * 0.95, basparmak: -yon, taraf: yon < 0 ? 'sol' : 'sag', tohum });
  };
  // İki ön kol masada (dirsekler omuzların altında, kenarın önünde; eller göğsün önünde birbirine yakın)
  const onKollar = (h, o, r, t1, t2, { acik = 0, ic = 0 } = {}) => {
    const kn = h.kenar;
    return {
      sol: masadaEl(o, r, [o.sol[0] - 14 - acik, kn + 44], [176 - ic, kn + 112], -1, t1),
      sag: masadaEl(o, r, [o.sag[0] + 14 + acik, kn + 44], [228 + ic, kn + 116], 1, t2),
    };
  };

  // ---------- Kişiler ve kol pozları (kutu birimi)
  const E4 = oyuncu('E4', {
    kalinlik: 56, manset: 'gomlek',
    kollar: (h, o, r) => {
      if (h.kol === 'masa' && !DIKEY) return onKollar(h, o, r, 41, 42);
      // dikeyde E4 arka sırada E3'ün omzunun ardında: sol kolu çizilmez (E3'ün gövdesinin önüne geçmesin)
      const sol = DIKEY ? null : masadaEl(o, r, [o.sol[0] - 14, h.kenar + 44], [180, h.kenar + 110], -1, 41);
      // dikeyde dirsek perdenin ardında kalır (perdenin alt kenarından yumru gibi taşıyordu)
      return { sol, sag: ceneEl(h, o, r, 1, 42, [o.sag[0] + 24, h.kenar + (DIKEY ? -14 : 26)]) };
    },
  });
  const E2 = oyuncu('E2', {
    kalinlik: 64, giysi: DERI,
    kollar: (h, o, r) => {
      const kn = h.kenar, [tx, ty] = h.titre;
      const sag = masadaEl(o, r, [o.sag[0] + 14, kn + 44], [232, kn + 116], 1, 22);
      if (h.kol === 'kalk') return { sol: yumruk(o, r, -1, [30 + tx, 70 + ty], -84, 21), sag };
      if (h.kol === 'ara') return { sol: yumruk(o, r, -1, [-70, 300], 150, 21), sag };
      if (h.kol === 'vur') return { sol: yumruk(o, r, -1, [30, kn + 100], 96, 21, [-70, kn - 10]), sag };
      return { sol: masadaEl(o, r, [o.sol[0] - 14, kn + 44], [172, kn + 112], -1, 21), sag };
    },
  });
  const E3 = oyuncu('E3', {
    kalinlik: 74, kolBoyu: 'sivali',
    kollar: (h, o, r) => onKollar(h, o, r, 31, 32, { acik: 6 }),
  });
  // E'nin atış kolu (yatayda ekranın solu): dirsek perdenin ardında kalır, ön kol perdenin üstünden çıkar; el perdenin sol üst
  // köşesinin üstünde açılır, zarlar perdenin önünden haritaya düşer (perdenin yanından çıkan kol E4'ün kolu gibi okunuyordu).
  // Açılan el E'nin omzunun önünde kalır, parmaklar haritaya (aşağı) bakar: sola uzanan el E4'ün çene kolunun üstüne
  // biniyor, pençe gibi okunuyordu. Dikeyde E4 E'ye çok yakın (kalkan kol başörtüsünün önünden geçiyordu): atış sağ
  // kolla, E2 yanındaki boşlukta yapılır (değerler sağ kolun kutu birimi; açılar ona göre).
  const SAG_ATIS = DIKEY;
  const ATIS = ctx.yer(
    { salla: [[66, 215], [34, 362], -96], kaldir: [[60, 186], [28, 334], -80], at: [[104, 236], [40, 372], 100], at2: [[104, 258], [46, 380], 108] },
    { salla: [[304, 228], [330, 368], -84], kaldir: [[316, 180], [322, 336], -100], at: [[308, 236], [346, 372], 100], at2: [[304, 262], [352, 380], 96] });
  const EE = oyuncu('E', {
    kalinlik: 56, manset: 'ribana',
    kollar: (h, o, r) => {
      const [tx, ty] = h.titre;
      const yon = SAG_ATIS ? 1 : -1, yan = SAG_ATIS ? 'sag' : 'sol';
      if (h.kol === 'salla') { const [[bx, by], d, a] = ATIS.salla; return { [yan]: yumruk(o, r, yon, [bx + tx, by + ty], a, 11, d) }; }
      if (h.kol === 'kaldir') { const [b, d, a] = ATIS.kaldir; return { [yan]: yumruk(o, r, yon, b, a, 11, d) }; }
      if (h.kol === 'at' || h.kol === 'at2') {
        const [bilek, dirsek, elAci] = ATIS[h.kol];
        return { [yan]: kolSVG({ ...r, omuz: o[yan], omuzUcu: o.ucu(yon), dirsek, bilek, el: 'acik', elAci, elBoy: EB, basparmak: yon, yuz: 'sirt', taraf: yan, tohum: 11 }) };
      }
      if (h.kol === 'cene') return { sag: ceneEl(h, o, r, 1, 12, [o.sag[0] + 26, o.sag[1] + 150]) };
      return {};
    },
  });

  // ---------- Oda (L0): yatayda duvar saati (gerilim; yelkovan sahne boyunca ilerler) ve raf; dikeyde sarkan lamba
  // (dikeyde saate temiz yer yok: üst yarı balonların, saat düşünce balonuna değiyordu)
  {
    const ust = el(L0.svg, 'g');
    const kutuN = (x0, y0, x1, y1) => duz([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true, 4);
    if (!DIKEY) {
      const SA = { c: [146, 160], r: 48 }, [sx, sy] = SA.c;
      cizgi(ust, ctx.oval(sx, sy, SA.r, SA.r, 0, 360, 22, 2), { kapali: true, dolgu: '#e6e1d8', kalinlik: 4.5, tohum: 501 });
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2, r0 = SA.r * 0.72, r1 = SA.r * 0.86;
        cizgi(ust, [[sx + r0 * Math.cos(a), sy + r0 * Math.sin(a)], [sx + r1 * Math.cos(a), sy + r1 * Math.sin(a)]], { kalinlik: 3, tohum: 502 + i });
      }
      cizgi(ust, [[sx, sy], [sx + SA.r * 0.32, sy - SA.r * 0.3]], { kalinlik: 4.5, tohum: 507 });
      const yelkovan = el(ust, 'g');
      cizgi(yelkovan, [[sx, sy], [sx, sy - SA.r * 0.7]], { kalinlik: 3.4, tohum: 508 });
      tl.fromTo(yelkovan, { rotation: -20, svgOrigin: `${sx} ${sy}` }, { rotation: 40, svgOrigin: `${sx} ${sy}`, duration: k(SON - BAS), ease: 'none', immediateRender: false }, k(BAS));
      // raf: sağ duvarda (E2'nin omzunun üstünde), markasız kitaplar ve bir kutu
      const [rx0, ry0] = [1650, 340];
      cizgi(ust, kutuN(rx0, ry0, rx0 + 250, ry0 + 14), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 4, tohum: 510 });
      [[0, 70, 22, 2], [24, 84, 18, 5], [44, 62, 26, 1], [72, 76, 20, 3]].forEach(([dx, hh, ww, g], i) =>
        cizgi(ust, kutuN(rx0 + 12 + dx, ry0 - hh, rx0 + 12 + dx + ww, ry0), { kapali: true, dolgu: MONO.giysi[g], kalinlik: 3.4, tohum: 511 + i }));
      cizgi(ust, kutuN(rx0 + 130, ry0 - 46, rx0 + 236, ry0), { kapali: true, dolgu: MONO.giysi[6], kalinlik: 3.6, tohum: 520 });
      cizgi(ust, [[rx0 + 130, ry0 - 30], [rx0 + 236, ry0 - 30]], { kalinlik: 2.6, tohum: 521 });
    } else {
      // sarkan lamba (dikeyin üst üçte birini taşır). Sol kenarda, E3'ün üstünde: ortada asılıyken kablosu #16 bulutunun ve
      // #17 balonunun tepesine saplanıyor, balon iple asılı tabela gibi okunuyordu; balonlar x ≥ 230'da kalır.
      const [lx, ly] = [150, 540];
      cizgi(ust, [[lx, ly - 1200], [lx, ly - 500], [lx, ly]], { kalinlik: 3, tohum: 522 });
      cizgi(ust, duz([[lx - 28, ly], [lx + 28, ly], [lx + 64, ly + 52], [lx - 64, ly + 52]], true, 4), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 4.5, tohum: 523 });
      cizgi(ust, ctx.oval(lx, ly + 54, 22, 12, 0, 180, 8, 2), { kalinlik: 3.4, tohum: 524 });
    }
  }

  // ---------- Masa (gMasa): üst yüz, ön kalınlık, (dikeyde ayaklar), harita, tavla pulları
  const gAyak = el(gMasa, 'g');
  const gTabla = el(gMasa, 'g'); // vuruşta ezilen grup (masa + harita + pullar)
  {
    const [cx, cy] = MASA.c, [rx, ry] = MASA.r;
    const alt = ctx.oval(cx, cy, rx, ry, 0, 180, 22, 2.1).map(([x, y]) => [x, y + 40]);
    cizgi(gTabla, [...ctx.oval(cx, cy, rx, ry, 0, 180, 22, 2.1), ...alt.reverse()], { kapali: true, dolgu: '#a59e91', kalinlik: 5, tohum: 530 });
    cizgi(gTabla, ctx.oval(cx, cy, rx, ry, 0, 360, 44, 2.1), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5, tohum: 531 });
    if (DIKEY) for (const [yon, i] of [[-1, 0], [1, 1]]) {
      const x = cx + yon * rx * 0.62, y = cy + ry * 0.78 + 40;
      cizgi(gAyak, duz([[x - 26, y - 10], [x + 26, y - 10], [x + 20, y + 520], [x - 20, y + 520]], true, 5), { kapali: true, dolgu: '#8d867a', kalinlik: 5, tohum: 535 + i });
    }
  }
  // Harita: perspektif kâğıt; (u, v) ∈ [0, 1] çift doğrusal
  const HQ = ctx.yer([[560, 800], [1270, 790], [1320, 975], [500, 990]], [[180, 1365], [760, 1352], [800, 1520], [140, 1534]]);
  const hp = (u, v) => {
    const a = (1 - u) * (1 - v), b = u * (1 - v), c = u * v, d = (1 - u) * v;
    return [a * HQ[0][0] + b * HQ[1][0] + c * HQ[2][0] + d * HQ[3][0], a * HQ[0][1] + b * HQ[1][1] + c * HQ[2][1] + d * HQ[3][1]];
  };
  {
    const kenar = [];
    for (let i = 0; i < 8; i++) kenar.push(hp(i / 8, 0));
    for (let i = 0; i < 4; i++) kenar.push(hp(1, i / 4));
    for (let i = 0; i < 8; i++) kenar.push(hp(1 - i / 8, 1));
    for (let i = 0; i < 4; i++) kenar.push(hp(0, 1 - i / 4));
    cizgi(gTabla, kenar, { kapali: true, dolgu: '#ece7dd', kalinlik: 4, tohum: 540 });
    const ince = { kalinlik: 2.8, renk: '#5f5a53', tohum: 541, genlik: 0.8 };
    // göl, dağlar, orman, kesik yol, hedef (X)
    cizgi(gTabla, [hp(0.12, 0.3), hp(0.24, 0.22), hp(0.33, 0.36), hp(0.28, 0.62), hp(0.16, 0.66), hp(0.09, 0.5)], { ...ince, kapali: true, dolgu: '#d6d1c7', tohum: 542 });
    for (const [u, v, i] of [[0.5, 0.3, 0], [0.58, 0.22, 1], [0.66, 0.32, 2]]) cizgi(gTabla, [hp(u - 0.05, v + 0.1), hp(u, v - 0.06), hp(u + 0.05, v + 0.1)], { ...ince, tohum: 543 + i });
    for (const [u, v, i] of [[0.4, 0.78, 0], [0.46, 0.84, 1], [0.35, 0.86, 2]]) cizgi(gTabla, ctx.oval(...hp(u, v), 9, 6, 0, 360, 8), { ...ince, kapali: true, tohum: 546 + i });
    const yolG = el(gTabla, 'g', { 'stroke-dasharray': '10 9' });
    cizgi(yolG, [hp(0.05, 0.92), hp(0.3, 0.88), hp(0.52, 0.62), hp(0.74, 0.55), hp(0.88, 0.3)], { ...ince, tohum: 549 });
    cizgi(gTabla, [hp(0.86, 0.16), hp(0.94, 0.3)], { ...ince, kalinlik: 3.4, tohum: 550 });
    cizgi(gTabla, [hp(0.94, 0.16), hp(0.86, 0.3)], { ...ince, kalinlik: 3.4, tohum: 551 });
  }
  // Tavla pulları: yassı silindir (üst elips + yan bant), iki açık iki koyu; vuruşta zıplar
  const PULLAR = ctx.yer([[700, 855, 0], [830, 935, 1], [1120, 850, 1], [1215, 930, 0]], [[250, 1400, 0], [370, 1475, 1], [620, 1395, 1], [700, 1470, 0]]);
  const pulG = PULLAR.map(([x, y, koyu], i) => {
    const g = el(gTabla, 'g', { transform: 'translate(0 0)' });
    const rx = ctx.yer(28, 26), ry = rx * 0.38, hh = rx * 0.34;
    const renk = koyu ? MONO.sac[2] : '#efebe3', yanR = koyu ? MONO.sac[1] : '#cfc9bd';
    el(g, 'ellipse', { cx: x + 3, cy: y + hh + 6, rx: rx * 1.05, ry: ry * 1.1, fill: '#000', opacity: 0.1 });
    cizgi(g, [...ctx.oval(x, y, rx, ry, 0, 180, 10, 2), ...ctx.oval(x, y + hh, rx, ry, 0, 180, 10, 2).reverse()], { kapali: true, dolgu: yanR, kalinlik: 3.4, tohum: 560 + i * 3, kay: [1.5, 1.5] });
    cizgi(g, ctx.oval(x, y, rx, ry, 0, 360, 16, 2), { kapali: true, dolgu: renk, kalinlik: 3.4, tohum: 561 + i * 3, kay: [1.5, 1.5] });
    cizgi(g, ctx.oval(x, y, rx * 0.56, ry * 0.56, 0, 360, 12, 2), { kapali: true, kalinlik: 2.2, renk: koyu ? '#e6e2da' : '#8d867a', tohum: 562 + i * 3 });
    return g;
  });

  // ---------- DM perdesi (gPerde): E'nin önünde üç kanat (orta kanat düz, yan kanatlar öne açılır), düz, markasız
  {
    const cx = YER.E.x, s = YER.E.s, by = kenarY(cx) + 22 * s;
    const w = 102 * s, hO = 98 * s, kw = 78 * s, hY = 88 * s, ky = 20 * s;
    const P = [[cx - w - kw, by + ky], [cx - w, by], [cx + w, by], [cx + w + kw, by + ky]];
    const T = [[P[0][0] + 2 * s, P[0][1] - hY], [P[1][0], P[1][1] - hO], [P[2][0], P[2][1] - hO], [P[3][0] - 2 * s, P[3][1] - hY]];
    const kanat = (i, renk, tohum) => cizgi(gPerde, duz([P[i], P[i + 1], T[i + 1], T[i]], true, 5), { kapali: true, dolgu: renk, kalinlik: 4.5, tohum });
    kanat(0, '#8d867a', 570); kanat(2, '#8d867a', 571); kanat(1, '#a59e91', 572);
    const ic = (u, v) => [P[1][0] + (P[2][0] - P[1][0]) * u, P[1][1] - hO * v];
    cizgi(gPerde, duz([ic(0.08, 0.16), ic(0.92, 0.16), ic(0.92, 0.84), ic(0.08, 0.84)], true, 4), { kapali: true, kalinlik: 2.4, renk: '#6f695f', tohum: 573 });
  }

  // ---------- Zarlar (gZar): durum her 2 karede bir (30 fps). Konum yolu: atış yayı + iki sekme + kayma
  const ZS = ctx.yer(58, 50); // zar boyu (px): pulla aynı boyda (46'da zarlar haritanın çizgileri arasında kayboluyordu)
  const zarYap = (tohum) => {
    const g = el(gZar, 'g');
    const golge = el(g, 'ellipse', { rx: ZS * 0.42, ry: ZS * 0.13, fill: '#000', opacity: 0 });
    const govde = el(g, 'g');
    const nit = (w) => ({ fill: 'none', stroke: M, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const yuzler = { ust: el(govde, 'path', { fill: '#f4f1ea' }), sol: el(govde, 'path', { fill: '#dcd6cb' }), sag: el(govde, 'path', { fill: '#c4beb3' }) };
    for (const [ad, q] of Object.entries(YUZ)) yuzler[ad].setAttribute('d', 'M' + q.map(([x, y]) => `${f3(x)} ${f3(y)}`).join(' L') + 'Z');
    const ic = el(govde, 'path', nit(0.05));
    const dis = el(govde, 'path', nit(0.075));
    const pip = Array.from({ length: 18 }, () => el(govde, 'ellipse', { rx: 0.05, ry: 0.045, fill: M }));
    const sp = ctx.sapma(tohum, 0.012);
    const h = { g, golge, govde, deger: [1, 2, 3], zip: 0 };
    h.ciz = (i = 0) => {
      const s = sp(i);
      dis.setAttribute('d', ctx.yol(duz(ALTI, true, 0.04), true, s));
      ic.setAttribute('d', ctx.yol([[-0.46, -0.26], [-0.2, -0.115], [0, -0.01], [0.2, -0.115], [0.46, -0.26]], false, s) + ' ' + ctx.yol([[0, -0.01], [0, 0.26], [0, 0.52]], false, s));
      let j = 0;
      ['ust', 'sol', 'sag'].forEach((ad, fi) => {
        for (const [u, v] of PIP[h.deger[fi]]) {
          const [x, y] = yuzNokta(YUZ[ad], u, v);
          pip[j].setAttribute('cx', f3(x)); pip[j].setAttribute('cy', f3(y)); pip[j].setAttribute('opacity', 1); j++;
        }
      });
      for (; j < pip.length; j++) pip[j].setAttribute('opacity', 0);
    };
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    gsap.set(g, { autoAlpha: 0 });
    return h;
  };
  // Atış: E'nin açılan elinden; iniş haritanın ortasında. Yol noktaları: bırakış, 1. değme, 2. değme, 3. değme, durma
  // bırakış noktası: açılan elin parmak uçları (EE.dunya ile, atış pozundan)
  const AT = (() => { const [b, , a] = ATIS.at, u = EB * 0.85; return EE.dunya([b[0] + u * Math.cos(a * D2R), b[1] + u * Math.sin(a * D2R) - 10]); })();
  const ZAR_YOL = [
    { t0: 1640, ini: ctx.yer([AT, [860, 902], [905, 912], [928, 908], [938, 906]], [AT, [440, 1460], [470, 1468], [486, 1465], [494, 1464]]), son: [1, 3, 2], aciSon: -8 },
    { t0: 1642, ini: ctx.yer([[AT[0] + 14, AT[1] + 6], [950, 878], [994, 868], [1014, 870], [1020, 871]], [[AT[0] + 12, AT[1] + 6], [520, 1430], [552, 1424], [566, 1426], [570, 1427]]), son: [1, 2, 4], aciSon: 10 },
  ];
  const SEKME = [12, 8, 6, 6];     // her parçanın süresi (kare): uçuş, sekme 1, sekme 2, kayma
  const YUK = [0.3, 0.12, 0.05, 0]; // parça yay yüksekliği (yolun boyuna oranla)
  const TAKLA = [[2, 5, 4], [6, 4, 1], [3, 1, 5], [5, 6, 3], [4, 2, 6], [2, 3, 1], [6, 5, 4], [3, 6, 2]];
  const zarlar = ZAR_YOL.map((z, zi) => {
    const h = zarYap(580 + zi * 7);
    const durum = (n) => { // n: kare (60 fps); 2 karelik adımla nicelenir
      const t = Math.floor((n - z.t0) / 2) * 2;
      let kalan = t, i = 0;
      while (i < SEKME.length && kalan > SEKME[i]) { kalan -= SEKME[i]; i++; }
      if (i >= SEKME.length) return { x: z.ini[4][0], y: z.ini[4][1], aci: z.aciSon, sx: 1, sy: 1, deger: z.son, golge: 0.16 };
      const u = Math.max(0, kalan / SEKME[i]);
      const A = z.ini[i], B = z.ini[i + 1];
      const uz = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u - 4 * YUK[i] * uz * u * (1 - u);
      const donus = [52, 38, 24, 10][i];
      const aci = i === 3 ? z.aciSon + (1 - u) * 14 : z.aciSon + 400 - ((t * donus) / 2) % 360;
      const ez = (i === 0 || i === 1) && kalan === SEKME[i];   // yere değdiği an 2 karelik ezilme
      const deger = i === 3 ? z.son : TAKLA[(Math.floor(t / 2) + zi * 3) % TAKLA.length];
      return { x, y, aci, sx: ez ? 1.2 : 1, sy: ez ? 0.82 : 1, deger, golge: i === 0 ? 0.04 + 0.1 * u : 0.14 };
    };
    return { h, z, durum };
  });
  const zarUygula = (n) => {
    for (const { h, z, durum } of zarlar) {
      if (n < z.t0) continue;
      const d = durum(n);
      h.govde.setAttribute('transform', `translate(${f1(d.x)} ${f1(d.y + h.zip - ZS * 0.5)}) rotate(${f1(d.aci)}) scale(${f1(ZS * d.sx)} ${f1(ZS * d.sy)})`);
      h.golge.setAttribute('cx', f1(d.x + 3)); h.golge.setAttribute('cy', f1(d.y + ZS * 0.04)); h.golge.setAttribute('opacity', f3(h.zip < -10 ? 0.06 : d.golge));
      if (String(h.deger) !== String(d.deger)) { h.deger = d.deger; h.ciz(); }
    }
  };
  const zarSaat = { n: 1638 };
  tl.fromTo(zarSaat, { n: 1638 }, { n: 2016, duration: k(2016 - 1638), ease: 'none', onUpdate: () => zarUygula(zarSaat.n), immediateRender: false }, k(1638));
  zarlar.forEach(({ h, z }) => { tl.set(h.g, { autoAlpha: 0 }, k(BAS)); tl.set(h.g, { autoAlpha: 1 }, k(z.t0)); });

  // ---------- Balonlar (LB). Konuşma balonu: çekirdeğin konus() çizgisiyle aynı (süperelips, kuyruk), ama boyu değişebilir,
  // kuyruk tabanı sabit genişlikte (büyük balonda üçgen şişmesin) ve satırlar (<span class="sat">) sırayla yazılır.
  // tabanX: kuyruk tabanının alt kenardaki x'i (verilirse; balon büyüse de taban yerinde kalır, kuyruk başı kesmez)
  function soz(metin, { x, y, boyut = 50, kuyruk, tohum = 9, pay = [28, 18], taban = 26, tabanX = null }) {
    const g = el(LB.svg, 'g');
    const p = ctx.elYazisi(LB.div, metin, { x, y, boyut, aci: 0 });
    const w = p.offsetWidth || boyut * 6, hh = p.offsetHeight || boyut;
    const b = { cx: x + w / 2, cy: y + hh / 2, rx: w / 2 + pay[0], ry: hh / 2 + pay[1] };
    const govde = cizgi(g, ctx.oval(b.cx, b.cy, b.rx, b.ry, 0, 360, 30, 5.5), { kapali: true, dolgu: BALON, kalinlik: 4.5, tohum, genlik: 1.1, kay: [0, 0] });
    const kd = el(g, 'path', { fill: BALON });
    const k1 = cizgi(g, [[0, 0], [0, 0], [0, 0]], { kalinlik: 4.5, tohum: tohum + 1, genlik: 0.9 });
    const k2 = cizgi(g, [[0, 0], [0, 0]], { kalinlik: 4.5, tohum: tohum + 2, genlik: 0.9 });
    const guncelle = () => {
      govde.pts = ctx.oval(b.cx, b.cy, b.rx, b.ry, 0, 360, 30, 5.5); govde.ciz();
      const P = (t) => { const c = Math.cos(t), sn = Math.sin(t); return [b.cx + b.rx * Math.sign(c) * Math.abs(c) ** (2 / 5.5), b.cy + b.ry * Math.sign(sn) * Math.abs(sn) ** (2 / 5.5)]; };
      let b1, b2;
      if (tabanX != null) {
        // alt kenar: |x/rx|^5,5 + |y/ry|^5,5 = 1
        const altY = (xx) => { const u = Math.min(0.995, Math.abs((xx - b.cx) / b.rx)); return b.cy + b.ry * Math.pow(1 - Math.pow(u, 5.5), 1 / 5.5); };
        b1 = [tabanX - taban, altY(tabanX - taban)]; b2 = [tabanX + taban, altY(tabanX + taban)];
      } else {
        const a = Math.atan2((kuyruk[1] - b.cy) / b.ry, (kuyruk[0] - b.cx) / b.rx);
        const q = P(a), q1 = P(a + 0.01), q0 = P(a - 0.01), tl0 = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
        const t = [(q1[0] - q0[0]) / tl0, (q1[1] - q0[1]) / tl0];
        b1 = [q[0] - t[0] * taban, q[1] - t[1] * taban]; b2 = [q[0] + t[0] * taban, q[1] + t[1] * taban];
      }
      const ic = (z) => [z[0] + (b.cx - z[0]) * 0.1, z[1] + (b.cy - z[1]) * 0.1];
      kd.setAttribute('d', `M${ic(b1).map(f1).join(' ')} L${b1.map(f1).join(' ')} L${kuyruk.map(f1).join(' ')} L${b2.map(f1).join(' ')} L${ic(b2).map(f1).join(' ')}Z`);
      k1.pts = [b1, [(b1[0] + kuyruk[0]) / 2 + (b2[1] - b1[1]) * 0.08, (b1[1] + kuyruk[1]) / 2], kuyruk]; k1.ciz();
      k2.pts = [b2, kuyruk]; k2.ciz();
    };
    guncelle();
    gsap.set(g, { autoAlpha: 0, scale: 0.6, svgOrigin: `${kuyruk[0]} ${kuyruk[1]}` });
    gsap.set(p, { autoAlpha: 0 });
    const satirlar = [...p.querySelectorAll('.sat')];
    gsap.set(satirlar, { clipPath: 'inset(-30% 100% -30% 0%)' });
    const hb = { g, p, b, guncelle, w, h: hh };
    // ac: balon 8 k BO ile kuyruk ucundan açılır; satırlar sırayla yazılır (sureler: satır başına kare, aralarında 6 k)
    hb.ac = (k0, sureler = [16]) => {
      tl.set(g, { autoAlpha: 0 }, k(BAS));
      tl.set(p, { autoAlpha: 0 }, k(BAS));
      tl.fromTo(g, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(k0));
      if (!satirlar.length) { ctx.yazElYazisi(p, k0 + 4, sureler[0]); return; }
      tl.set(p, { autoAlpha: 1, clipPath: 'inset(-40% -10% -40% -10%)' }, k(k0 + 4));
      let t = k0 + 4;
      satirlar.forEach((sp, i) => {
        // bitişte sağ pay −12%: Caveat'ın son harfi (d, k) kutudan taşar, kırpılmasın
        tl.fromTo(sp, { clipPath: 'inset(-30% 100% -30% 0%)' }, { clipPath: 'inset(-30% -12% -30% 0%)', duration: k(sureler[i] ?? 16), ease: 'none', immediateRender: false }, k(t));
        t += (sureler[i] ?? 16) + 6;
      });
    };
    hb.kapat = (k0, sure = 10) => {
      tl.to(g, { autoAlpha: 0, scale: 0.9, duration: k(sure), ease: E.EI }, k(k0));
      tl.to(p, { autoAlpha: 0, duration: k(sure), ease: E.EI }, k(k0));
    };
    return hb;
  }
  const sat = (...s) => s.map((x) => `<span class="sat" style="display:inline-block">${x}</span>`).join('<br>');
  const alti = (s) => `<span class="alti">${s}</span>`;
  // Kişinin ağız hizasında, yüz konturunun hemen dışında bir nokta (dünya): konuşma balonunun kuyruk ucu (yüzü kesmesin)
  const agiz = (h, yon = -1, ek = [0, 0]) => {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz;
    const [X, Yy] = h.dunya([200 + yon * (hw + 16), GOZ_Y + 4 + h.p.yuzBoy * 0.5]);
    return [X + ek[0], Yy + ek[1]];
  };

  // ---------- Kamera: yatayda kutu kadraja sığar; dikeyde merkez + ölçek (dar ekranda dört kişi yan yana zor sığar:
  // kadrajın kenarı bir yüzün ortasından geçmesin diye merkez ve ölçek elle seçildi)
  const sigdir = ([x0, y0, x1, y1]) => { const s = Math.min(W / (x1 - x0), H / (y1 - y0)); return ctx.odak((x0 + x1) / 2, (y0 + y1) / 2, s); };
  const mo = ([cx, cy, s]) => ctx.odak(cx, cy, s);
  const KAM = DIKEY ? {
    k14a: mo([540, 1170, 1.12]), k14b: mo([542, 1160, 1.18]),
    // #15 yakın plan: E3 ve E2'nin başı tümüyle dışarıda (iki kenarda yarım kulak kalıyordu)
    k15a: mo([526, 1260, 2.16]), k15b: mo([526, 1105, 2.16]),
    k16a: mo([540, 800, 1.17]), k16b: mo([540, 800, 1.19]),
    k17a: mo([540, 1110, 1.15]), k17b: mo([540, 990, 1.12]),
  } : {
    k14a: sigdir([40, 90, 1880, 1080]), k14b: mo([1000, 480, 1.22]),
    // #15 açılışı E3'ün başını tümüyle dışarıda bırakır (sol kenarda yarım kulak kalıyordu)
    k15a: mo([1085, 600, 1.42]), k15b: mo([952, 532, 1.28]),
    // #16: bulut kadraja tam sığar (tepesi ve sağ tümseği kesiliyordu), yüzler çeneyle birlikte görünür; saat tam içeride,
    // raf dışarıda (ikisi de kenarda yarım kalıyordu)
    k16a: sigdir([60, -285, 1640, 604]), k16b: sigdir([72, -278, 1628, 597]),
    k17a: sigdir([60, -110, 1880, 1000]), k17b: sigdir([80, -240, 1880, 800]),
  };
  // itis: kadraj merkezindeki dünya noktası sabit kalarak ölçek çarpanı
  const itis = (o, c) => { const wx = (W / 2 - o.x) / o.scale, wy = (H / 2 - o.y) / o.scale; return ctx.odak(wx, wy, o.scale * c); };

  // =========================================================================== #14 (1536–1631): gerilim
  ctx.isaret(1536, 'kesme');
  ctx.kameraKoy(BAS, KAM.k14a);
  tl.fromTo(ctx.kamera, KAM.k14a, { ...KAM.k14b, duration: k(96), ease: 'power1.in', immediateRender: false }, k(BAS));
  const bas = (h, o) => tl.call(() => h.poz(o), null, k(BAS));
  bas(E3, { ifade: 'merak', bakis: [1, -1], kol: 'masa' });
  bas(E4, { ifade: 'merak', bakis: [1, 0], kol: 'cene' });
  bas(E2, { ifade: 'merak', bakis: [-1, 0], kol: 'masa', titre: [0, 0] });
  bas(EE, { ifade: 'kisik', bakis: [-1, 0], kol: 'yok', titre: [0, 0] });
  for (const h of oyuncular) { h.uygula(); tl.call(() => { Object.assign(h.d, { dx: 0, dy: 0, aci: 0, s: 1 }); h.uygula(); h.parilti = false; }, null, k(BAS)); }
  tl.call(() => oyuncular.forEach((h) => h.ciz()), null, k(BAS));
  // öne eğilme (12 fps): arkadaşlar E'ye doğru
  E3.dur(1540, 50, { aci: 2.2, dy: 8, s: 1.02 });
  E4.dur(1550, 45, { aci: 1.6, dy: 10, s: 1.02 });
  E2.dur(1545, 50, { aci: -2.4, dy: 8, s: 1.02 });
  EE.dur(1560, 30, { dy: 6 });
  tl.call(() => E3.poz({ ifade: 'kirp' }), null, ka(1570)); tl.call(() => E3.poz({ ifade: 'merak' }), null, ka(1577));
  tl.call(() => E4.poz({ ifade: 'kirp' }), null, ka(1590)); tl.call(() => E4.poz({ ifade: 'merak' }), null, ka(1597));
  tl.call(() => E2.poz({ ifade: 'kisik', bakis: [-1, 0] }), null, ka(1585));
  // E zarları yumruğunda sallar (30 fps titreme)
  tl.call(() => EE.poz({ kol: 'salla', ifade: 'kisik', bakis: [-1, 0] }), null, ka(1596));
  for (let n = 1598, i = 0; n < 1630; n += 2, i++) {
    const tt = [[0, -7], [3, 5], [-2, -6], [2, 6]][i % 4];
    tl.call(() => EE.poz({ titre: tt }), null, k(n));
  }

  // =========================================================================== #15 (1632–1727): atış, zarlar, "Keşke…"
  ctx.isaret(1632, 'kesme');
  ctx.kameraKoy(1632, KAM.k15a);
  // atış boyunca hafif itiş; zarlar sekerken (k1646) konuşma balonuna yer açan yükseliş (26 k KM; zarlar kadrajın altında
  // kalır), balon kalkış bitmeden açılmaz (k1664: tepesi kesilmesin), sonra itiş
  tl.fromTo(ctx.kamera, KAM.k15a, { ...itis(KAM.k15a, 1.01), duration: k(14), ease: 'none', immediateRender: false }, k(1632));
  tl.fromTo(ctx.kamera, itis(KAM.k15a, 1.01), { ...KAM.k15b, duration: k(26), ease: E.KM, immediateRender: false }, k(1646));
  tl.fromTo(ctx.kamera, KAM.k15b, { ...itis(KAM.k15b, ctx.yer(1.02, 1.01)), duration: k(56), ease: 'none', immediateRender: false }, k(1672));
  tl.call(() => EE.poz({ kol: 'kaldir', titre: [0, 0], ifade: 'kararli', bakis: [-1, 1] }), null, k(1632));
  EE.dur(1632, 4, { dy: -6 }, 'none');
  tl.call(() => EE.poz({ kol: 'at', ifade: 'kararli' }), null, k(1638));
  tl.call(() => EE.poz({ kol: 'at2' }), null, k(1644));
  // el zarı bırakınca çabuk geri çekilir (açık el E4'ün önünde asılı kalmasın), göz zarlarda
  tl.call(() => EE.poz({ kol: 'yok', bakis: [-1, 1] }), null, ka(1655));
  EE.dur(1655, 10, { dy: 4 });
  ctx.isaret(1640, 'sessizlik', { bitis: 1652 });
  ctx.isaret(1652, 'zar');
  ctx.isaret(1655, 'zar');
  // arkadaşlar: şaşırır, nefesini tutar (kaşlar kalkık, ağız küçük: 'ozlem'; 'kararli' kaşı çattığı için öfke gibi
  // okunuyordu), hep yek: söylenir
  const gozZar = { E3: [1, 1], E4: [1, 1], E2: [-1, 1] };
  for (const [h, ad] of [[E3, 'E3'], [E4, 'E4'], [E2, 'E2']]) {
    tl.call(() => h.poz({ ifade: ad === 'E3' ? 'merak' : 'saskin', bakis: gozZar[ad] }), null, ka(1640));
    tl.call(() => h.poz({ ifade: 'ozlem' }), null, ka(1652));
    tl.call(() => h.poz({ ifade: 'sikkin' }), null, ka(1672 + (ad === 'E4' ? 5 : 0)));
  }
  E3.dur(1640, 10, { dy: 14, s: 1.03 }); E4.dur(1640, 10, { dy: 12 }); E2.dur(1640, 10, { dy: 12, aci: -3 });
  tl.call(() => EE.poz({ ifade: 'sikkin', bakis: [-1, 1] }), null, ka(1672));
  tl.call(() => EE.poz({ ifade: 'ozlem', bakis: [-1, 1] }), null, ka(1690));
  for (const [h, b] of [[E3, [1, -1]], [E4, [1, 0]], [E2, [-1, 0]]]) tl.call(() => h.poz({ ifade: 'merak', bakis: b }), null, ka(1700));
  // "Keşke FRP zarlarım olsa… / bir d20, bir d8…"
  // dikeyde dar kadraja sığsın diye üç satır
  const S1 = ctx.yer({ x: 330, y: 150, tx: 768 }, { x: 312, y: 696, tx: 470 });
  // kuyruk ucu: yatayda E'nin sol yanağının biraz dışında (saçın kenarına paralel inip konturunu yalamasın); dikeyde
  // balon E'nin başının hemen üstünde, E4 bitişikte: kısa kuyruk E'nin saçının üstüne iner (yanağa inen kuyruk E4'ün
  // başörtüsüne değip onu gösteriyordu)
  const KUY_E = DIKEY ? [512, 872] : agiz(EE, -1, [-14, 2]);
  const soz1 = soz(DIKEY
    ? ctx.metin(sat('Keşke FRP', 'zarlarım olsa…', 'bir d20, bir d8…'), sat('If only I had', 'real RPG dice…', 'a d20, a d8…'))
    : ctx.metin(sat('Keşke FRP zarlarım olsa…', 'bir d20, bir d8…'), sat('If only I had real RPG dice…', 'a d20, a d8…')),
  { x: S1.x, y: S1.y, boyut: ctx.yer(52, 44), kuyruk: KUY_E, tohum: 600, tabanX: S1.tx });
  // zarlar son kaymasını yaparken başlar (yedi kelime: ~2 sn ekranda), ikinci söz açılmadan kapanır
  soz1.ac(1664, DIKEY ? [8, 10, 12] : [18, 14]);
  ctx.isaret(1664, 'konusma');
  soz1.kapat(1782, 8);

  // =========================================================================== #16 (1728–1823): düşünce balonu, "Piyonlarımızı…"
  ctx.isaret(1728, 'kesme');
  ctx.kameraKoy(1728, KAM.k16a);
  tl.fromTo(ctx.kamera, KAM.k16a, { ...KAM.k16b, duration: k(96), ease: 'none', immediateRender: false }, k(1728));
  // Bulut: yatayda E ile E2'nin üstünde, E2'nin ibiğinden ~60 px açıkta (değiyordu); noktalar E'nin başından çıkar.
  // Dikeyde 1. söz balonunun üstünde ve lambanın sağında; noktalar balonla E2 arasındaki koridordan bulutun altına çıkar.
  const BL = ctx.yer({ c: [1300, -50], r: [262, 128], n: [[1078, 270, 9], [1112, 222, 13], [1154, 164, 17]], koken: '20% 94%' },
    { c: [578, 400], r: [328, 170], n: [[690, 902, 8], [730, 868, 11], [760, 814, 14], [778, 748, 18], [786, 670, 21]], koken: '66% 96%' });
  const B = ctx.balon(LB.svg, { c: BL.c, r: BL.r, noktalar: BL.n, tohum: 31, koken: BL.koken });
  tl.set(B.g, { autoAlpha: 1 }, k(BAS));
  B.ac(1730, { hizli: true });
  ctx.isaret(1730, 'dusunce');
  tl.call(() => EE.poz({ kol: 'cene', ifade: 'ozlem', bakis: [1, -1] }), null, ka(1730));
  for (const h of [E3, E4, E2]) tl.call(() => h.poz({ ifade: 'merak' }), null, ka(1740));
  // balon içeriği: d20, d8 (cizimler.js), tavla pulu → piyon; el yazısı etiketleri; turuncu halka
  const IC = ctx.yer({ d20: [1152, -62], d8: [1300, -62], pul: [1450, -52], boy: 104 }, { d20: [418, 392], d8: [600, 392], pul: [782, 404], boy: 116 });
  const ciz = (hs, n0, sure, ara = 2) => {
    hs.forEach((h, i) => {
      tl.set(h.yol, { drawSVG: '0%' }, k(BAS));
      if (h.dolgu) { tl.set(h.dolgu, { autoAlpha: 0 }, k(BAS)); tl.to(h.dolgu, { autoAlpha: 1, duration: k(6), ease: 'none' }, k(n0 + i * ara + sure - 4)); }
      tl.fromTo(h.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(sure), ease: 'power2.out', immediateRender: false }, k(n0 + i * ara));
    });
  };
  const sil = (hs, n0, sure) => hs.forEach((h, i) => {
    tl.to(h.yol, { drawSVG: '100% 100%', duration: k(sure), ease: 'power2.in' }, k(n0 + i));
    if (h.dolgu) tl.to(h.dolgu, { autoAlpha: 0, duration: k(sure), ease: 'none' }, k(n0));
  });
  // Sıra (bulut 1742'de oturur): d20 1740, d8 1747, pul 1756 → silinir 1770, piyon 1772, halka 1786; bulut 1812'de söner,
  // k1824 kesmesinde yoktur (genel planda tepesi kesilirdi, E2'nin kalkan yumruğuna da değerdi).
  ciz(cizim(B.ic, 'd20', { c: IC.d20, boy: IC.boy, kalinlik: 5, tohum: 610 }), 1740, 12, 1);
  ciz(cizim(B.ic, 'd8', { c: IC.d8, boy: IC.boy * 0.95, kalinlik: 5, tohum: 620 }), 1747, 12, 2);
  // tavla pulu (bu sahnenin çizimi): yassı silindir
  const PB = IC.boy * 0.8, [px, py] = IC.pul;
  const pulCizim = [
    cizgi(B.ic, ctx.oval(px, py - PB * 0.06, PB * 0.42, PB * 0.17, 0, 360, 18, 2), { kapali: true, kalinlik: 5, tohum: 630 }),
    cizgi(B.ic, ctx.oval(px, py + PB * 0.09, PB * 0.42, PB * 0.17, 0, 180, 10, 2), { kalinlik: 5, tohum: 631 }),
    cizgi(B.ic, [[px - PB * 0.42, py - PB * 0.06], [px - PB * 0.42, py + PB * 0.09]], { kalinlik: 5, tohum: 632 }),
    cizgi(B.ic, [[px + PB * 0.42, py - PB * 0.06], [px + PB * 0.42, py + PB * 0.09]], { kalinlik: 5, tohum: 633 }),
    cizgi(B.ic, ctx.oval(px, py - PB * 0.06, PB * 0.24, PB * 0.095, 0, 360, 12, 2), { kapali: true, kalinlik: 3.4, tohum: 634 }),
  ];
  ciz(pulCizim, 1756, 10, 1);
  sil(pulCizim, 1770, 8);
  ciz(cizim(B.ic, 'piyon', { c: [px, py - IC.boy * 0.1], boy: IC.boy * 1.05, kalinlik: 5, tohum: 640 }), 1772, 12, 2);
  ctx.isaret(1774, 'tik');
  ciz([cizgi(B.ic, ctx.oval(px, py - IC.boy * 0.08, IC.boy * 0.48, IC.boy * 0.6, 200, 575, 30, 2), { kalinlik: 5.5, renk: VURGU, tohum: 650 })], 1786, 12);
  ctx.isaret(1786, 'vurgu');
  // etiketler (el yazısı): d20, d8
  const etk = (metin, c, n0) => {
    const p = ctx.elYazisi(LB.div, ctx.metin(metin, metin), { x: c[0] - IC.boy * 0.2, y: c[1] + IC.boy * 0.5, boyut: ctx.yer(40, 44), aci: -3 });
    tl.set(p, { autoAlpha: 0 }, k(BAS));
    ctx.yazElYazisi(p, n0, 10);
    return p;
  };
  const etiketler = [etk('d20', IC.d20, 1752), etk('d8', IC.d8, 1760)];
  B.kapat(1812, 12);
  for (const p of etiketler) tl.to(p, { autoAlpha: 0, duration: k(10), ease: E.EI }, k(1812));
  tl.set([B.g, ...etiketler], { autoAlpha: 0 }, k(1824));
  // E arkadaşlarına döner: "Piyonlarımızı / kendimiz tasarlasak?" (1790 → vuruştan sonra 1880: 90 k ekranda)
  tl.call(() => EE.poz({ kol: 'yok', ifade: 'merak', bakis: [-1, 0] }), null, ka(1790));
  const S2 = ctx.yer({ x: 420, y: 150, tx: 776 }, { x: 140, y: 700, tx: 430 });
  const soz2 = soz(ctx.metin(sat('Piyonlarımızı', 'kendimiz tasarlasak?'), sat('What if we designed', 'our own pawns?')),
    { x: S2.x, y: S2.y, boyut: ctx.yer(52, 46), kuyruk: KUY_E, tohum: 660, tabanX: S2.tx });
  soz2.ac(1790, [12, 16]);
  ctx.isaret(1790, 'konusma');
  tl.call(() => E3.poz({ ifade: 'kisik', bakis: [1, -1] }), null, ka(1806));
  tl.call(() => E4.poz({ ifade: 'kisik', bakis: [1, 0] }), null, ka(1812));
  tl.call(() => E2.poz({ ifade: 'saskin', bakis: [-1, 0] }), null, ka(1810));

  // =========================================================================== #17 (1824–2015): E2 vurur, kutu oyunu
  ctx.isaret(1824, 'kesme');
  // hafif itiş (ölü kare yok) → büyüyen balona açılış (30 k KM) → sonda %2,5 itiş
  ctx.kameraKoy(1824, KAM.k17a);
  // (açılış, büyümeden 8 k önce başlar: dikeyde yukarı kalkan yazı kadrajdan çıkmasın)
  tl.fromTo(ctx.kamera, KAM.k17a, { ...itis(KAM.k17a, 1.03), duration: k(100), ease: 'none', immediateRender: false }, k(1824));
  tl.fromTo(ctx.kamera, itis(KAM.k17a, 1.03), { ...KAM.k17b, duration: k(30), ease: E.KM, immediateRender: false }, k(1924));
  tl.fromTo(ctx.kamera, KAM.k17b, { ...itis(KAM.k17b, 1.025), duration: k(62), ease: 'none', immediateRender: false }, k(1954));
  // E2 doğrulur, yumruğunu kaldırır, titretir
  tl.call(() => E2.poz({ ifade: 'saskin', bakis: [-1, 0] }), null, ka(1826));
  E2.dur(1836, 10, { dy: -18, aci: 0, s: 1.03 });
  tl.call(() => E2.poz({ kol: 'kalk', ifade: 'mutlu', bakis: [-1, -1] }), null, ka(1840));
  for (let n = 1848, i = 0; n < 1866; n += 2, i++) {
    const tt = [[3, -4], [-3, 3], [2, -3], [-2, 4]][i % 4];
    tl.call(() => E2.poz({ titre: tt }), null, k(n));
  }
  tl.call(() => E2.poz({ titre: [0, 0], ifade: 'kararli' }), null, k(1866));
  ctx.isaret(1866, 'sessizlik', { bitis: 1876 });
  tl.call(() => E2.poz({ kol: 'ara' }), null, k(1872));
  tl.call(() => E2.poz({ kol: 'vur', ifade: 'mutlu', bakis: [-1, 1] }), null, k(1876));
  E2.dur(1874, 2, { dy: 10, s: 1.0 }, 'none');
  E2.dur(1881, 10, { dy: 0 });
  ctx.isaret(1876, 'vurgu');
  // ezilme (12 fps): masa ve üstündekiler; zarlar ve pullar zıplar
  const [mcx, mcy] = MASA.c;
  const ezil = (n, sy) => tl.set(gTabla, { attr: { transform: `translate(${mcx} ${mcy}) scale(${(2 - sy).toFixed(3)} ${sy.toFixed(3)}) translate(${-mcx} ${-mcy})` } }, k(n));
  tl.set(gTabla, { attr: { transform: 'translate(0 0)' } }, k(BAS));
  ezil(1876, 0.95); ezil(1881, 1.02); ezil(1886, 1.0);
  const zip = [[1876, 4], [1881, -38], [1886, -26], [1891, 0]];
  PULLAR.forEach((_, i) => {
    tl.set(pulG[i], { attr: { transform: 'translate(0 0)' } }, k(BAS));
    for (const [n, dy] of zip) tl.set(pulG[i], { attr: { transform: `translate(0 ${dy * (0.8 + (i % 2) * 0.4)})` } }, k(n + (i % 2) * 2));
  });
  zarlar.forEach(({ h }, i) => {
    tl.call(() => { h.zip = 0; }, null, k(BAS));
    for (const [n, dy] of zip) tl.call(() => { h.zip = dy * (1.2 - i * 0.2); zarUygula(n + i); }, null, k(n + i));
  });
  ctx.isaret(1892, 'zar');
  // kamera sarsıntısı (itme katmanı, 2 karede bir)
  [[1876, 0, 9], [1878, -7, -5], [1880, 6, 4], [1882, -4, -3], [1884, 2, 2], [1886, 0, 0]].forEach(([n, x, y]) => tl.set(ctx.itme, { x, y }, k(n)));
  // darbe çizgileri yumruğun çevresinde
  {
    const [vx, vy] = E2.dunya([30, E2.kenar + 100]);
    const g = el(gEfekt, 'g');
    [[-70, -10, -112, -30], [-60, 22, -104, 34], [60, -14, 104, -36], [56, 20, 100, 30], [-20, -40, -30, -84], [24, -40, 34, -82]]
      .forEach(([a, b, c, d], i) => cizgi(g, [[vx + a, vy + b], [vx + c, vy + d]], { kalinlik: 4.5, tohum: 680 + i }));
    gsap.set(g, { autoAlpha: 0 });
    tl.set(g, { autoAlpha: 0 }, k(BAS));
    tl.set(g, { autoAlpha: 1, scale: 0.7, svgOrigin: `${vx} ${vy}` }, k(1876));
    tl.set(g, { scale: 1.1 }, k(1881));
    tl.set(g, { autoAlpha: 0 }, k(1888));
  }
  // vuruş E'nin sözünü keser: balon sarsıntıyla 4 k titrer, sonra kapanır (90 k ekranda kalmış olur); herkes E2'ye döner
  soz2.kapat(1880, 8);
  tl.call(() => EE.poz({ ifade: 'saskin', bakis: [1, 0] }), null, ka(1876));
  tl.call(() => E3.poz({ ifade: 'merak', bakis: [1, 0] }), null, ka(1878));
  tl.call(() => E4.poz({ ifade: 'saskin', bakis: [1, 0], kol: 'masa' }), null, ka(1878));
  E3.dur(1876, 5, { dy: -6 }); E4.dur(1876, 5, { dy: -8, aci: 0 }); EE.dur(1876, 5, { dy: -8 });
  // "Abi, bundan / kutu oyunu mu yapsak?"; balon büyür (yatayda sağa, dikeyde yukarı), kutu oyunu çizilir, 4 piyon dizilir
  const S3 = ctx.yer({ x: 660, y: -60, tx: 1050, kuy: [-14, 0] }, { x: 320, y: 590, tx: 690, kuy: [-6, 0] });
  const soz3 = soz(ctx.metin(sat('Abi, bundan', `${alti('kutu oyunu')} mu yapsak?`), sat('Dude, should we make', `this a ${alti('board game')}?`)),
    { x: S3.x, y: S3.y, boyut: ctx.yer(54, 50), kuyruk: agiz(E2, -1, S3.kuy), tohum: 700, tabanX: S3.tx });
  soz3.ac(1884, [12, 18]);
  ctx.isaret(1884, 'konusma');
  tl.call(() => E2.poz({ kol: 'masa', ifade: 'mutlu', bakis: [-1, -1] }), null, ka(1895));
  // turuncu alt çizgi (dilek): "kutu oyunu"
  const altS = soz3.p.querySelector('.alti');
  const altG = el(LB.svg, 'g');
  const altPts = () => {
    let x = S3.x, y = S3.y;
    for (let n = altS; n && n !== soz3.p; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    const w = altS.offsetWidth || 200, hh = altS.offsetHeight || 50;
    return [[x - 4, y + hh * 0.92], [x + w * 0.4, y + hh * 0.88], [x + w * 0.75, y + hh * 0.93], [x + w + 6, y + hh * 0.86]];
  };
  const altC = cizgi(altG, altPts(), { renk: VURGU, kalinlik: 5.5, tohum: 710 });
  // alt çizgi yazı bitince (k1924) çekilir
  tl.call(() => { altC.pts = altPts(); altC.ciz(); }, null, k(1920));
  tl.set(altC.yol, { drawSVG: '0%' }, k(BAS));
  tl.fromTo(altC.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, k(1922));
  ctx.isaret(1922, 'vurgu');
  // büyüme: yatayda sol kenar sabit, balon sağa ve iki yana açılır (yazı yerinde); dikeyde alt kenar sabit, balon yukarı
  // büyür (yazı ve alt çizgi onunla çıkar). Kuyruk ucu yerinde kalır.
  const B3 = soz3.b, b0 = { ...B3 };
  const BY = ctx.yer({ gen: 460, ust: 90, alt: 60 }, { gen: 40, ust: 380, alt: 0 });
  const buyu = { u: 0 };
  tl.fromTo(buyu, { u: 0 }, {
    u: 1, duration: k(18), ease: E.BO, immediateRender: false,
    onUpdate: () => {
      const u = buyu.u;
      B3.rx = b0.rx + BY.gen * u / 2; B3.cx = b0.cx + (DIKEY ? 0 : BY.gen * u / 2);
      B3.ry = b0.ry + (BY.ust + BY.alt) * u / 2; B3.cy = b0.cy + (BY.alt - BY.ust) * u / 2;
      soz3.guncelle();
    },
  }, k(1932));
  if (DIKEY) tl.fromTo([soz3.p, altG], { y: 0 }, { y: -BY.ust, duration: k(18), ease: E.BO, immediateRender: false }, k(1932));
  // kutu oyunu (cizimler.js): büyüyen balonun boş bölgesine sığan en büyük boyda (yatayda yazının sağı, dikeyde yazının
  // altı). Piyonlar kapağın uzun köşegeni boyunca aralıklı bir sıra olur (kapağın ortasına üst üste yığılıyorlardı); kapak
  // süsleri piyonların altında kalıp karmaşa yapacağı için çizilmez. Birim kutuda kapsam: x ±0,46, y −0,405 (piyon tepesi)
  // … +0,40 (kutunun alt köşesi).
  const bolge = DIKEY
    ? [b0.cx - b0.rx - BY.gen / 2 + 50, S3.y - BY.ust + soz3.h + 34, b0.cx + b0.rx + BY.gen / 2 - 50, b0.cy + b0.ry - 30]
    : [S3.x + soz3.w + 40, b0.cy - b0.ry - BY.ust + 26, b0.cx + b0.rx + BY.gen - 46, b0.cy + b0.ry + BY.alt - 26];
  const kbBoy = Math.min(320, (bolge[2] - bolge[0]) / 0.92, (bolge[3] - bolge[1]) / 0.805);
  const KB = { c: [(bolge[0] + bolge[2]) / 2, bolge[1] + 0.405 * kbBoy + ((bolge[3] - bolge[1]) - 0.805 * kbBoy) / 2], boy: kbBoy };
  const kutu = cizim(LB.svg, 'kutuOyunu', { c: KB.c, boy: KB.boy, kalinlik: 5, tohum: 720, dolgu: BALON });
  ['#e6e1d8', '#cfc9bd', '#b5b1aa'].forEach((r, i) => kutu[i].dolgu?.setAttribute('fill', r));
  for (const h of kutu.slice(3)) gsap.set(h.g, { autoAlpha: 0 });
  ciz(kutu.slice(0, 3), 1944, 12, 3);
  const kp = (u, v) => [KB.c[0] + u * KB.boy, KB.c[1] + v * KB.boy];
  [0.2, 0.4, 0.6, 0.8].forEach((t, i) => {
    const pb = KB.boy * 0.27, taban = kp(-0.44 + 0.9 * t, -0.12 - 0.04 * t);
    const g = el(LB.svg, 'g');
    cizim(g, 'piyon', { c: [taban[0], taban[1] - pb * 0.44], boy: pb, kalinlik: 4.5, tohum: 730 + i * 5, dolgu: '#a59e91' });
    const n0 = 1962 + i * 8;
    gsap.set(g, { autoAlpha: 0 });
    tl.set(g, { autoAlpha: 0, y: 0, scaleX: 1, scaleY: 1, svgOrigin: `${taban[0]} ${taban[1]}` }, k(BAS));
    tl.set(g, { autoAlpha: 1 }, k(n0));
    tl.fromTo(g, { y: -KB.boy * 0.26 }, { y: 0, duration: k(6), ease: 'power2.in', immediateRender: false }, k(n0));
    tl.set(g, { scaleY: 0.86, scaleX: 1.1 }, k(n0 + 6));
    tl.set(g, { scaleY: 1, scaleX: 1 }, k(n0 + 8));
    ctx.isaret(n0 + 6, 'tik');
  });
  // herkesin gözü parlar: balona bakar (merak / şaşkın), göz parıltısı ve turuncu pırıltılar
  const balonBak = ctx.yer({ E3: [1, -1], E4: [1, -1], E: [1, -1], E2: [-1, -1] }, { E3: [1, -1], E4: [1, -1], E: [1, -1], E2: [-1, -1] });
  tl.call(() => EE.poz({ ifade: 'merak', bakis: balonBak.E }), null, ka(1942));
  tl.call(() => E3.poz({ ifade: 'merak', bakis: balonBak.E3 }), null, ka(1950));
  tl.call(() => E4.poz({ ifade: 'merak', bakis: balonBak.E4 }), null, ka(1955));
  tl.call(() => E2.poz({ ifade: 'merak', bakis: balonBak.E2 }), null, ka(1960));
  for (const [h, n, ifade] of [[EE, 1995, 'saskin'], [E3, 2000, 'mutlu'], [E4, 1998, 'saskin'], [E2, 2002, 'mutlu']]) {
    tl.call(() => { h.parilti = true; h.poz({ ifade: ifade === 'mutlu' ? 'merak' : ifade }); }, null, ka(n));
  }
  tl.call(() => { E3.poz({ ifade: 'mutlu' }); E2.poz({ ifade: 'mutlu' }); }, null, ka(2010));
  ctx.isaret(2000, 'vurgu');
  const yildiz = ([x, y], r) => [[x, y - r], [x + r * 0.22, y - r * 0.22], [x + r, y], [x + r * 0.22, y + r * 0.22], [x, y + r], [x - r * 0.22, y + r * 0.22], [x - r, y], [x - r * 0.22, y - r * 0.22]];
  // Pırıltı yerleri (kutu birimi): başın, saçın, başörtüsünün ve konuşma kuyruğunun konturuna değmesin (yüzün hemen yanına
  // konunca kontura oturuyordu). Dikeyde kişiler bitişik: tek pırıltı, komşunun başından uzakta.
  const pirilti = (h) => {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz;
    if (DIKEY) return {
      E3: [[200 + hw * 0.7, GOZ_Y - 150, 16]], E4: [[200 + hw * 0.6, GOZ_Y - 150, 15]],
      E: [[200 + hw + 44, GOZ_Y - 70, 18]], E2: [[200 + hw * 0.75, GOZ_Y - 130, 15]],
    }[h.ad];
    const sag = [200 + hw + 70, GOZ_Y - 72, h.ad === 'E2' ? 18 : 21], sol = [200 - hw - 60, GOZ_Y - 30, 13];
    return h.ad === 'E2' ? [sag] : [sag, sol]; // E2'nin solundan konuşma kuyruğu iner
  };
  oyuncular.forEach((h, i) => {
    pirilti(h).forEach(([u, v, r], j) => {
      const c = h.dunya([u, v]);
      const g = el(gEfekt, 'g');
      cizgi(g, yildiz(c, r * h.s), { kapali: true, dolgu: VURGU, renk: VURGU, kalinlik: 2.4, tohum: 760 + i * 4 + j, kay: [0, 0] });
      const n0 = adim(1996 + i * 3 + j * 5);
      gsap.set(g, { autoAlpha: 0 });
      tl.set(g, { autoAlpha: 0 }, k(BAS));
      tl.set(g, { autoAlpha: 1, scale: 0.3, svgOrigin: `${c[0]} ${c[1]}` }, k(n0));
      tl.set(g, { scale: 1.15 }, k(n0 + 5));
      tl.set(g, { scale: 0.85 }, k(n0 + 10));
      tl.set(g, { scale: 1 }, k(n0 + 15));
    });
  });
}
