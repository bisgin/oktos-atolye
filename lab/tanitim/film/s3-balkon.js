// Sahne 3, BALKON ve SAKSI (D, #10–#13, k1056–1683; kadro.json'daki k1535'ten 148 k uzun: export ARALIK). Kalıp
// v1-kanca.js ile aynı: kur(ctx), İÇ (mutlak) kare zamanları; sonraki sahneler uzamayla kendiliğinden kayar.
// #10 k1056–1199 Sabah, ayna: aynadaki yansıma (kemerli çerçeve, cam tonu, parıltı) kadrajı taşır. D'nin ceketi omuzlarına
//     atılmış (gömlek kolları önde, ceketin uçlarını tutar), ceketi omuza çeker, kollar yenlere girer (omuz silkme, tık),
//     yakalarını düzeltir; sağ eli kulağa gider (kol.js 'isaret'), küpe takılır (tık + üç kısa ışıltı); sol eli şakaktan
//     saçına girer, saçı omzun arkasına atar (dirsek omuz altında: kol kalkınca yen kanadı açılmasın); aynaya gülümser,
//     başıyla onaylar. Son karelerde bakışı sağa, pencere ışığına kayar. Pozlar 12 fps; kamera 60 fps doğrusal %4 itiş.
// #11 k1200–1307 Kapı ve güneş (kullanıcı: "bir anda balkonda var olmasın"). Kesme: oda, cam balkon kapısı; D sırtı dönük
//     kapıya yürür (kamera izler), kolu tutar (tık), kanat açılır, içeri ışık dolar, D ışığa adım atar, sahne beyaza açılır.
//     k1262 beyazdan balkona: D kapıdan çıkıp pervaza yürür (kameraya doğru büyür), güneşte gözlerini kısar, kollarını
//     taşa koyar, gözlerini kapayıp gülümser; yüzüne ışık vurur, başının çevresinde minik ışıltılar.
// #12 k1308–1411 Çiçekler: saksılar pervazda değil, kapının solunda yüksek bir sehpada, ağızları D'nin göz hizasında; D
//     bakışını yatay çevirir. "Çiçeklerim çok güzel…" (konuşma balonu, ≥90 k). Klişe toprak saksılar (sahnenin TEK tonlu
//     öğesi, soluk pişmiş toprak): gülünkünün ağzı kırık (çentik + çatlak), ötekiler çatlak; toprak tablaya ve kenarından
//     aşağı dökülmüş; k1374 kırık ağızdan bir topak düşer (tık), D'nin kaşı iner. Kamera iki kişilik planda saksılara itilir.
// #13 k1412–1683 Düşünce: kesmesiz geri çekilir, D çenesini eline dayar, balon açılır: "Keşke bunlara da güzel kıyafetler
//     giydirebilsem…". Balonda klişe saksı (aynı gül ve lale) v5-saksi.js'teki gibi vurgu renkli Bézier tutamaçlarıyla
//     biçimlenir: D'nin düşteki eli buluttan girer, işaret parmağıyla çapayı çeker → ince bel (kemerli) → çay bardağı
//     (tabaklı) → uzun ince (çizgili); her biri oturunca tık. Biçimlendirme YALNIZ balonda. Düş söner; D eli yanağına
//     yaslanır, sıkılır: "Keşke böyle bir aracım olsaydı…" (≥90 k). Çözüm gösterilmez; k1684'te kesme (sonraki sahne).
// Kollar kol.js ile (govdeKes + kolSVG; D uzun boylu: omuz ve gövde kesimi 8 birim aşağı). Kişinin gövdesi ve kolları iki
// ayrı svg'de çizilebilir: balkonda gövde pervazın arkasında, kollar pervazın önünde (ön kollar taşın üstünde); kolArkada
// ile kollar gövdeyle aynı (pervazın arkasındaki) svg'ye çizilir (yürürken). arka: true sırtı dönük çizim (insan.js).
// Bakış: insan.js göz bebeğini bakis × (3, 2) birim kaydırır (göz akı yok); okunsun diye bakis değerleri 3–4 kat verilir.
import { kisiSVG, yol, rng, MONO, GOZ_Y, BOY } from '../insan.js';
import { kolSVG, omuzlar, bilekBul, govdeKes } from '../kol.js';
import { cizimKur, CIZIMLER, URUN_RENK } from './cizimler.js';

export const ARALIK = [1056, 1683];
// Renk yardımcıları (ürün renkleri, kullanıcı 2026-10-22): hex → [r, g, b]; iki renk arası; kanalları t kadar koyultma
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const renkKaris = (a, b, t) => { const A = hexRgb(a), B2 = hexRgb(b); return rgbHex(A.map((v, i) => v + (B2[i] - v) * t)); };
const koyult = (h, t) => rgbHex(hexRgb(h).map((v) => v * (1 - t)));

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, odak, vurus, isaret, W, H, PALET, GRI, GRI2, BALON, VURGU } = ctx;
  const yer = ctx.yer, adim = ctx.adim, oval = ctx.oval, M = PALET.murekkep;
  const SIFIR = { sap: () => 0 };
  const f1 = (v) => (+v).toFixed(1);
  const BAS = ARALIK[0], SON = ARALIK[1];
  vurus(10, 'Ayna: ceket, küpe, saç', 1056, 1199);
  vurus(11, 'Kapı, güneş', 1200, 1307);
  vurus(12, 'Sehpadaki çiçekler, kırık saksı', 1308, 1411);
  vurus(13, 'Düş: tutamaçlar; sıkılır', 1412, SON);

  // Tonlar: sahnenin tek tonlu öğesi saksılar (soluk pişmiş toprak); geri kalan her şey mono
  const TERRA = '#c4977a', TERRA_K = '#b0846a', TERRA_A = '#d4b097', TOPRAK = '#5f5a53', TOPRAK_A = '#7d776e';
  const TAS = { ust: '#e2ddd3', on: '#cfc9bd', duvar: '#d8d2c7' };

  const gizle = (e, k0, k1) => { gsap.set(e, { autoAlpha: 0 }); tl.set(e, { autoAlpha: 0 }, 0); tl.set(e, { autoAlpha: 1 }, k(k0)); if (k1 != null) tl.set(e, { autoAlpha: 0 }, k(k1)); };
  // Düz kenarlı çokgen: köşeler arasına eşit aralıklı noktalar (Catmull-Rom kenarı şişirmesin)
  const duz = (kose, kapali = true, ad = 28) => {
    const out = [], n = kose.length;
    for (let i = 0; i < (kapali ? n : n - 1); i++) {
      const a = kose[i], b = kose[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / ad));
      for (let j = 0; j < m; j++) out.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]);
    }
    if (!kapali) out.push(kose[n - 1]);
    return out;
  };
  const elips = (cx, cy, rx, ry, a0, a1, n = 12) => oval(cx, cy, rx, ry, a0, a1, n, 2);
  // Adımlı eğri: değer ease'i izler ama yalnız `ara` karede bir değişir (5 k = 12 fps, 2 k = 30 fps)
  const adimli = (ease, sure, ara = 5) => {
    const f = typeof ease === 'function' ? ease : gsap.parseEase(ease);
    const n = Math.max(1, Math.round(sure / ara));
    return (p) => f(Math.ceil(p * n - 1e-6) / n);
  };

  // ============================================================================ KİŞİ (insan.js + kol.js)
  // Kollu figür: gövde (govdeKes ile kolsuz) bir svg'de, kollar ikinci svg'de (kolUst verilirse başka katmanda).
  // h.poz({ p, ifade, bakis, kollar, ek }) 12 fps ızgarasında tl.call ile çağrılır; kaynama 8 fps (ctx.kaynayanlar).
  const EB = 116; // el boyu (kutu birimi), kol.js önerisi
  const sarkan = (o, ortak, yon, tohum) => {
    const om = yon < 0 ? o.sol : o.sag;
    return kolSVG({ ...ortak, omuz: om, dirsek: [om[0] + yon * 14, om[1] + 160], bilek: [om[0] + yon * 6, om[1] + 312], el: 'acik', elAci: 90, elBoy: EB, taraf: yon < 0 ? 'sol' : 'sag', tohum });
  };
  function figur(ust, p0, { x, alt, olcek, id, kolUst = null }) {
    const en = BOY.en * olcek, boy = BOY.boy * olcek, x0 = x - en / 2, y0 = alt - boy;
    const svgYap = (parent) => el(parent, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: en, height: boy, x: x0, y: y0, overflow: 'visible' });
    const g = el(ust, 'g');
    const sG = svgYap(g);
    const sKa = svgYap(g); // kolArkada: kollar gövdeyle aynı grupta (balkonda pervazın arkasında)
    const kg = el(kolUst || g, 'g');
    const sK = svgYap(kg);
    const h = { g, kg, p: p0, ifade: 'notr', bakis: [0, 0], kollar: null, ek: null, i: 0, olcek, x0, y0, arka: false, kolArkada: false };
    h.kutu = ([wx, wy]) => [(wx - x0) / olcek, (wy - y0) / olcek];
    h.dunya = ([bx, by]) => [x0 + bx * olcek, y0 + by * olcek];
    // D uzun boylu: boyun 8 birim uzar, omuz ve gövde kesimi onunla iner (yüz boyu +8 vererek kol.js'e bildirilir)
    h.olcu = (p = h.p) => {
      const uz = p.boy === 'uzun' ? 8 : 0, pk = { ...p, yuzBoy: p.yuzBoy + uz };
      return { pk, o: omuzlar(pk), hw: p.yuzEn, cy: GOZ_Y + 4, hh: p.yuzBoy, ceneY: GOZ_Y + 4 + p.yuzBoy, omuzY: GOZ_Y + 4 + p.yuzBoy + uz + 40 };
    };
    h.ciz = (i = h.i) => {
      h.i = i;
      const p = h.p, { pk, o } = h.olcu(p);
      const G = govdeKes(pk, { id, kaynama: i, tohum: p.tohum });
      const ortak = { giysi: MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik: 64, kaynama: i, golge: { klip: G.golgeKlipUrl }, manset: p.ceket ? 'gomlek' : 'duz' };
      const kol = h.kollar ? h.kollar(o, ortak, h) : sarkan(o, ortak, -1, 31) + sarkan(o, ortak, 1, 32);
      sG.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: i, ifade: h.ifade, bakis: h.bakis, mono: true, arka: h.arka })}</g>` + G.kontur + (h.ek ? h.ek(h, i) : '');
      (h.kolArkada ? sKa : sK).innerHTML = kol;
      (h.kolArkada ? sK : sKa).innerHTML = '';
    };
    h.poz = (o) => { Object.assign(h, o); h.ciz(); };
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    return h;
  }

  const D0 = ctx.kisiParam('D');
  const Dgomlek = { ...D0, ceket: false, giysi: 6, kupe: false };  // ceketsiz: açık gömlek
  const Dceket = { ...D0, kupe: false };                             // ceket giyildi, küpe henüz tek kulakta
  const Dhazir = { ...D0 };                                          // küpe iki kulakta

  // Kol pozları (kutu birimi). Hedefler yüz ölçüsünden: kulak memesi, çene, saç yanı
  const KOL = {
    // ceketi omuza oturtur: eller yakada, dirsekler dışa
    omuz: (o, r, h) => {
      const { omuzY } = h.olcu();
      const b1 = bilekBul({ el: 'tutma', hedef: [200 - 66, omuzY + 8], elAci: -62, elBoy: EB, basparmak: -1, ad: 'tut' });
      const b2 = bilekBul({ el: 'tutma', hedef: [200 + 66, omuzY + 8], elAci: -118, elBoy: EB, basparmak: 1, ad: 'tut' });
      return kolSVG({ ...r, omuz: o.sol, dirsek: [o.sol[0] - 34, o.sol[1] + 128], bilek: b1, el: 'tutma', elAci: -62, elBoy: EB, basparmak: -1, taraf: 'sol', tohum: 41 })
        + kolSVG({ ...r, omuz: o.sag, dirsek: [o.sag[0] + 34, o.sag[1] + 128], bilek: b2, el: 'tutma', elAci: -118, elBoy: EB, basparmak: 1, taraf: 'sag', tohum: 42 });
    },
    // yakaları aşağı çeker (alt: eller göğüs hizasında)
    yaka: (dy) => (o, r, h) => {
      const { omuzY } = h.olcu();
      const b1 = bilekBul({ el: 'tutma', hedef: [200 - 46, omuzY + 66 + dy], elAci: -58, elBoy: EB, basparmak: -1, ad: 'tut' });
      const b2 = bilekBul({ el: 'tutma', hedef: [200 + 46, omuzY + 66 + dy], elAci: -122, elBoy: EB, basparmak: 1, ad: 'tut' });
      return kolSVG({ ...r, omuz: o.sol, dirsek: [o.sol[0] - 66, o.sol[1] + 128 + dy * 0.5], bilek: b1, el: 'tutma', elAci: -58, elBoy: EB, basparmak: -1, taraf: 'sol', tohum: 43 })
        + kolSVG({ ...r, omuz: o.sag, dirsek: [o.sag[0] + 66, o.sag[1] + 128 + dy * 0.5], bilek: b2, el: 'tutma', elAci: -122, elBoy: EB, basparmak: 1, taraf: 'sag', tohum: 44 });
    },
    // sağ el kulağa (küpe): hedef kulak memesi; a: el açısı, yak: 0 kulakta, 1 yaklaşırken
    kupe: (a, yak = 0) => (o, r, h) => {
      const { hw, cy } = h.olcu();
      const hedef = [200 + hw + 9 + yak * 34, cy + 32 + yak * 76];
      const b = bilekBul({ el: 'isaret', hedef, elAci: a, elBoy: EB, basparmak: 1 });
      return sarkan(o, r, -1, 45) + kolSVG({ ...r, omuz: o.sag, dirsek: [o.sag[0] + 62, o.sag[1] + 112], bilek: b, el: 'isaret', elAci: a, elBoy: EB, basparmak: 1, taraf: 'sag', tohum: 46 });
    },
    // sol el saçta: d 0 parmaklar tepeden saça girer, 1 omza dökülen saç ucunu avuçlar, 2 aşağı süzer (açık el yanda
    // havada kalınca "el sallama" gibi okunuyordu).
    // Dirsek omuzdan ancak biraz yüksek ve camın içinde (çok kalkık üst kolda kol.js omuz kapağı "yen kanadı" bırakıyor)
    sac: (d) => (o, r, h) => {
      const { hw, cy, hh } = h.olcu();
      const P = [
        { uc: [200 - hw * 0.55, cy - hh - 18], aci: -38, dir: [o.sol[0] - 46, o.sol[1] - 38] },
        { tut: [126, h.olcu().omuzY - 20], aci: -80, dir: [o.sol[0] - 40, o.sol[1] + 92] },
        { tut: [132, h.olcu().omuzY + 10], aci: -84, dir: [o.sol[0] - 36, o.sol[1] + 104] },
      ][d];
      if (P.tut) {
        // saçın omza dökülen ucunu avuçlar, aşağı süzer (kol.js 'tutma'; dirsek aşağıda)
        const b = bilekBul({ el: 'tutma', hedef: P.tut, elAci: P.aci, elBoy: EB, basparmak: -1, ad: 'tut' });
        return sarkan(o, r, 1, 47) + kolSVG({ ...r, omuz: o.sol, dirsek: P.dir, bilek: b, el: 'tutma', elAci: P.aci, elBoy: EB, basparmak: -1, taraf: 'sol', tohum: 48 });
      }
      const b = bilekBul({ el: 'acik', hedef: P.uc, elAci: P.aci, elBoy: EB, basparmak: -1 });
      return sarkan(o, r, 1, 47) + kolSVG({ ...r, omuz: o.sol, dirsek: P.dir, bilek: b, el: 'acik', yuz: 'sirt', elAci: P.aci, elBoy: EB, basparmak: -1, taraf: 'sol', tohum: 48 });
    },
  };

  // ============================================================================ #10 AYNA
  const LA = ctx.katman('s3-ayna', 10);
  gsap.set(LA.div, { autoAlpha: 0 });
  tl.set(LA.div, { autoAlpha: 0 }, 0);
  tl.set(LA.div, { autoAlpha: 1 }, k(BAS));
  tl.set(LA.div, { autoAlpha: 0 }, k(1200));
  const A = yer({
    cam: { x0: 612, x1: 1308, ust: 56, alt: 884 }, cerceve: 30,
    kisi: { x: 960, alt: 782, olcek: 1.6 },
    sif: { ust: 900, on: 934, x0: 250, x1: 1670 },
    kupa: [420, 902], tabak: [1440, 904], parfum: [1560, 902],
    isik: [[1394, 150], [1760, 96], [1788, 700], [1420, 760]], isikCubuk: [[1588, 120], [1600, 730]], isikYatay: [[1404, 420], [1772, 380]],
    yuz: [960, 370],
  }, {
    cam: { x0: 150, x1: 930, ust: 240, alt: 1452 }, cerceve: 32,
    kisi: { x: 540, alt: 1196, olcek: 1.8 },
    sif: { ust: 1470, on: 1508, x0: -60, x1: 1140 },
    kupa: [196, 1472], tabak: [770, 1474], parfum: [900, 1472],
    isik: [[700, -40], [1120, -40], [1120, 420], [760, 330]], isikCubuk: [[930, -40], [950, 380]], isikYatay: [[720, 150], [1120, 170]],
    yuz: [540, 760],
  });
  {
    // Duvardaki sabah ışığı (pencere aynanın sağında, kadraj dışında): açık leke + kayıt gölgesi
    const g = el(LA.svg, 'g');
    const d = (pts) => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L');
    el(g, 'path', { d: d(A.isik) + 'Z', fill: '#f9f6f0' });
    for (const c of [A.isikCubuk, A.isikYatay]) el(g, 'path', { d: d(c), stroke: '#e9e3d9', 'stroke-width': 20, fill: 'none' });
  }
  const C = A.cam, R = (C.x1 - C.x0) / 2, CX = (C.x0 + C.x1) / 2;
  const kemer = (pay) => [
    ...duz([[C.x0 - pay, C.alt + pay], [C.x0 - pay, C.ust + R]], false).slice(0, -1),
    ...elips(CX, C.ust + R, R + pay, R + pay, 180, 360, 26),
    ...duz([[C.x1 + pay, C.ust + R], [C.x1 + pay, C.alt + pay], [C.x0 - pay, C.alt + pay]], false).slice(1, -1),
  ];
  cizgi(LA.svg, kemer(A.cerceve), { kapali: true, dolgu: '#a59e91', kalinlik: 5.5, tohum: 701, genlik: 0.8 });
  cizgi(LA.svg, kemer(A.cerceve * 0.45), { kapali: true, kalinlik: 2.6, renk: '#6f695f', tohum: 702, genlik: 0.8 });
  const camYol = ctx.yol(kemer(0), true, SIFIR);
  const defsA = el(LA.svg, 'defs');
  el(el(defsA, 'clipPath', { id: 's3-cam' }), 'path', { d: camYol });
  const camG = el(LA.svg, 'g', { 'clip-path': 'url(#s3-cam)' });
  el(camG, 'path', { d: camYol, fill: '#e7e2d9' });
  // Yansımadaki oda: arkadaki kapı kasası (derinlik), çok açık
  el(camG, 'path', { d: ctx.yol(duz([[C.x0 + R * 0.18, C.alt + 20], [C.x0 + R * 0.18, C.ust + R * 0.55], [C.x0 + R * 0.62, C.ust + R * 0.42], [C.x0 + R * 0.62, C.alt + 20]], false), false, SIFIR), fill: 'none', stroke: '#d3cdc2', 'stroke-width': 10 });
  const DA = figur(camG, Dgomlek, { ...A.kisi, id: 's3-da' });
  // Cam parıltısı (yansımanın üstünde): iki çapraz çizgi
  const parilti = el(camG, 'g', { opacity: 0.75 });
  const pr0 = yer([[C.x1 - 210, C.ust + R + 150], [C.x1 - 30, C.ust + R - 40]], [[C.x1 - 210, C.ust + R + 170], [C.x1 - 40, C.ust + R - 10]]);
  el(parilti, 'path', { d: ctx.yol(pr0, false, SIFIR), stroke: '#fbf9f5', 'stroke-width': 16, 'stroke-linecap': 'round', fill: 'none' });
  el(parilti, 'path', { d: ctx.yol(pr0.map(([x, y]) => [x + 46, y + 40]), false, SIFIR), stroke: '#fbf9f5', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' });
  // Küpe ışıltısı: kulak memesinin çevresinde üç kısa çizgi (k1111)
  const isilti = el(camG, 'g');
  {
    const { hw, cy } = DA.olcu(Dceket);
    const [ex, ey] = DA.dunya([200 + hw + 9, cy + 30]);
    for (let i = 0; i < 3; i++) {
      const a = (-60 + i * 50) * Math.PI / 180;
      cizgi(isilti, [[ex + Math.cos(a) * 26, ey + Math.sin(a) * 26], [ex + Math.cos(a) * 46, ey + Math.sin(a) * 46]], { kalinlik: 4, tohum: 710 + i });
    }
    gsap.set(isilti, { svgOrigin: `${ex} ${ey}` });
  }
  gizle(isilti, 1111, 1123);
  tl.fromTo(isilti, { scale: 0.5 }, { scale: 1.15, duration: k(10), ease: E.EO, immediateRender: false }, k(1111));

  // Şifonyer (aynanın önünde) ve üstündekiler: buharı tüten kupa, küpe tabağı, parfüm
  const S = A.sif;
  cizgi(LA.svg, duz([[S.x0, S.on], [S.x1, S.on], [S.x1 + 10, H + 80], [S.x0 - 10, H + 80]]), { kapali: true, dolgu: '#bdb6a9', kalinlik: 5.5, tohum: 720 });
  cizgi(LA.svg, duz([[S.x0 + 14, S.ust], [S.x1 - 14, S.ust], [S.x1 + 6, S.on], [S.x0 - 6, S.on]]), { kapali: true, dolgu: '#d8d2c7', kalinlik: 5.5, tohum: 721 });
  const cekY = S.on + yer(70, 110);
  cizgi(LA.svg, duz([[S.x0 + 40, cekY], [S.x1 - 40, cekY]], false), { kalinlik: 3.4, tohum: 722 });
  for (const fx of [0.32, 0.68]) cizgi(LA.svg, oval(S.x0 + (S.x1 - S.x0) * fx, cekY + 34, 13, 10, 0, 360, 10), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 723 + fx * 10 });
  {
    const [kx, ky] = A.kupa, g = el(LA.svg, 'g');
    cizgi(g, [[kx + 30, ky - 72], [kx + 60, ky - 66], [kx + 60, ky - 32], [kx + 29, ky - 24]], { kalinlik: 6, tohum: 730 });
    cizgi(g, duz([[kx - 34, ky - 86], [kx + 34, ky - 86], [kx + 31, ky], [kx - 31, ky]], true, 20), { kapali: true, dolgu: '#e2ddd3', kalinlik: 5.5, tohum: 731 });
    cizgi(g, elips(kx, ky - 86, 34, 8, 0, 360, 14), { kapali: true, dolgu: '#6f695f', kalinlik: 4, tohum: 732 });
    // buhar: iki dalgalı çizgi, sürekli yükselip söner (ölü kare yok)
    [[-10, 0], [12, 18]].forEach(([dx, gec], i) => {
      const b = cizgi(g, [[kx + dx, ky - 104], [kx + dx - 9, ky - 126], [kx + dx + 2, ky - 148], [kx + dx - 7, ky - 172]], { kalinlik: 3.4, renk: GRI2, tohum: 733 + i });
      tl.fromTo(b.g, { y: 10, opacity: 0 }, { keyframes: { y: [10, -4, -18], opacity: [0, 1, 0] }, duration: k(48), ease: 'none', repeat: 3, immediateRender: false }, k(BAS + gec));
    });
  }
  {
    const [tx, ty] = A.tabak;
    cizgi(LA.svg, elips(tx, ty - 10, 46, 13, 0, 360, 16), { kapali: true, dolgu: '#efebe4', kalinlik: 4.5, tohum: 740 });
    cizgi(LA.svg, elips(tx, ty - 12, 30, 7, 0, 360, 12), { kapali: true, kalinlik: 2.6, renk: '#8d867a', tohum: 741 });
    const [px, py] = A.parfum;
    cizgi(LA.svg, duz([[px - 26, py - 70], [px + 26, py - 70], [px + 28, py], [px - 28, py]], true, 18), { kapali: true, dolgu: '#e9e5dd', kalinlik: 4.5, tohum: 742 });
    cizgi(LA.svg, duz([[px - 10, py - 92], [px + 10, py - 92], [px + 10, py - 70], [px - 10, py - 70]], true, 10), { kapali: true, dolgu: '#6f695f', kalinlik: 4, tohum: 743 });
    cizgi(LA.svg, [[px - 14, py - 52], [px - 14, py - 18]], { kalinlik: 4, renk: '#fbf9f5', tohum: 744 });
  }

  // Ek çizim: küpe henüz tek kulakta (ekranın solundaki kulak, kutu birimi)
  const tekKupe = (h) => { const { hw, cy } = h.olcu(); return `<circle cx="${f1(200 - hw - 8)}" cy="${cy + 30}" r="5" fill="${MONO.giysi[0]}" stroke="${M}" stroke-width="3"/>`; };
  // Ceket omuzlara atılmış (kollar içeride, yenlerde değil): iki koyu ön panel omuzları ve kolları örter, eller (gömlek
  // manşetiyle) panellerin ön kenarlarını tutar. Kollar tam çizilir ama yalnız el çevresindeki daire görünür (kol ceketin
  // içinde kalır). yuk 0: eller göğüste, yaka kenarında; 1: eller omuzda, ceketi omuza çeker. Kaynama: ctx.sapma (8 fps)
  const pelerinSap = ctx.sapma(760, 1.1);
  KOL.pelerin = (yuk) => (o, r, h) => {
    const { omuzY } = h.olcu(), cn = omuzY - 40, i = r.kaynama;
    const hedefY = yuk ? omuzY + 8 : omuzY + 82, hx = yuk ? 66 : 50;
    let ciz = '';
    const eller = [-1, 1].map((yon) => {
      const aci = yon < 0 ? -62 : -118, bp = yon < 0 ? -1 : 1, om = yon < 0 ? o.sol : o.sag, hedef = [200 + yon * hx, hedefY];
      const b = bilekBul({ el: 'tutma', hedef, elAci: aci, elBoy: EB, basparmak: bp, ad: 'tut' });
      const s = kolSVG({ ...r, golge: null, omuz: om, dirsek: [om[0] + yon * 30, om[1] + 130], bilek: b, el: 'tutma', elAci: aci, elBoy: EB, basparmak: bp, taraf: yon < 0 ? 'sol' : 'sag', tohum: 41 + (yon > 0 ? 1 : 0) });
      // görünür bölge: el yerel çerçevesinde bileğin biraz gerisinden (manşet) parmak uçlarına dikdörtgen
      const id = `s3-pel${yon > 0 ? 1 : 0}`, c = Math.cos(aci * Math.PI / 180), sn = Math.sin(aci * Math.PI / 180);
      const T = ([x, y]) => [b[0] + (x * c - y * bp * sn) * EB, b[1] + (x * sn + y * bp * c) * EB];
      // (kesim bileğin hemen gerisinde: yalnız gömlek manşeti görünür; önceki geniş kutuda kolun yen parçası düz kenarlı bir
      // kama gibi kalıyordu. Kesim çizgisi ceket kenarı gibi mürekkeple çizilir)
      const kutu = [[-0.02, -0.36], [0.95, -0.36], [0.95, 0.36], [-0.02, 0.36]].map(T).map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L');
      const kenar = [[-0.02, -0.27], [0.0, 0], [-0.02, 0.27]].map(T);
      return `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M${kutu}Z"/></clipPath></defs><g clip-path="url(#${id})">${s}</g>`
        + `<path d="${yol(kenar, false, pelerinSap(i + 4))}" fill="none" stroke="${M}" stroke-width="4.2" stroke-linecap="round"/>`;
    });
    for (const yon of [-1, 1]) {
      const pts = [[200 + yon * 30, cn + 26], [200 + yon * 72, omuzY - 2], [200 + yon * 150, omuzY + 12], [200 + yon * 176, omuzY + 52],
        [200 + yon * 184, 640], [200 + yon * 62, 640], [200 + yon * 50, omuzY + 130], [200 + yon * 40, omuzY + 46]];
      const d = yol(pts, true, pelerinSap(i + (yon > 0 ? 2 : 0)));
      ciz += `<path d="${d}" fill="${MONO.giysi[5]}" transform="translate(3 3)"/><path d="${d}" fill="none" stroke="${M}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<path d="${yol([[200 + yon * 150, omuzY + 44], [200 + yon * 138, omuzY + 120], [200 + yon * 146, 600]], false, pelerinSap(i))}" fill="none" stroke="${M}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
    return ciz + eller.join('');
  };
  // #10 pozları (12 fps). Göz aynada kendine (kameraya) bakar; küpede kulağına, saçta yukarı-sola, sonda pencereye
  const pozA = (n, o) => tl.call(() => DA.poz(o), null, k(adim(n)));
  tl.call(() => DA.poz({ p: Dgomlek, ifade: 'notr', bakis: [0, 0], kollar: KOL.pelerin(0), ek: null }), null, k(BAS));
  pozA(1061, { kollar: KOL.pelerin(1), ifade: 'kararli' });          // ceketi omuzlarına çeker
  pozA(1066, { p: Dceket, kollar: KOL.omuz, ek: tekKupe });           // kollar yenlerde: omuz silkme (tık)
  pozA(1071, { kollar: KOL.yaka(0) });
  pozA(1081, { kollar: KOL.yaka(26), ifade: 'notr' });
  pozA(1091, { kollar: KOL.kupe(-112, 1), bakis: [3.6, 0] });
  pozA(1096, { kollar: KOL.kupe(-118), ifade: 'merak' });
  pozA(1106, { kollar: KOL.kupe(-126) });
  pozA(1111, { p: Dhazir, ek: null, kollar: KOL.kupe(-120) });
  pozA(1121, { kollar: KOL.kupe(-108, 1), ifade: 'notr', bakis: [0, 0] });
  pozA(1126, { kollar: KOL.sac(0), bakis: [-3, -1.6] });
  pozA(1131, { kollar: KOL.sac(1) });
  pozA(1136, { kollar: KOL.sac(2), bakis: [0, 0] });
  pozA(1141, { kollar: null });
  pozA(1146, { ifade: 'mutlu' });
  pozA(1166, { ifade: 'kararli' });
  pozA(1176, { ifade: 'kirp' });
  pozA(1181, { ifade: 'kararli' });
  pozA(1186, { ifade: 'merak', bakis: [3.6, 0] });
  pozA(1196, { bakis: [3.6, -2.4] });
  // Omuz silkme (ceket oturur) ve onay (baş sallama): figürün tamamı 12 fps adımla
  const DAo = `${A.kisi.x} ${A.kisi.alt}`;
  gsap.set(DA.g, { svgOrigin: DAo });
  tl.fromTo(DA.g, { y: 0 }, { y: -12, duration: k(5), ease: 'steps(1)', immediateRender: false }, k(1065));
  tl.to(DA.g, { y: 0, duration: k(5), ease: 'steps(1)' }, k(1070));
  tl.to(DA.g, { y: 8, duration: k(5), ease: 'steps(1)' }, k(1151));
  tl.to(DA.g, { y: 0, duration: k(10), ease: 'steps(2)' }, k(1156));
  isaret(BAS, 'kesme');
  isaret(1065, 'tik', { not: 'ceket' });
  isaret(1111, 'tik', { not: 'küpe' });

  // Kamera #10: yüz sabit noktalı doğrusal %4 itiş
  const yz = A.yuz;
  const kamA = (s) => odak(yz[0], yz[1], s, yz[0], yz[1]);
  const SA = yer(1.12, 1.24);
  ctx.kameraKoy(BAS, kamA(SA));
  tl.fromTo(ctx.kamera, kamA(SA), { ...kamA(SA * 1.04), duration: k(1199 - BAS), ease: 'none', immediateRender: false }, k(BAS));

  // ============================================================================ #11 KAPI: odadan balkona (k1200–1261)
  // Kesme (aynada bakışı sağa, ışığa kaymıştı): oda, cam balkon kapısı (camdan uzaktaki korkuluk ve ışık görünür), solda
  // duvarda pencere ışığı ve küçük bir çerçeve. D sırtı dönük (insan.js arka görünüş) ön plandan kapıya yürür: kamera göz
  // hizasında, D uzaklaştıkça göz noktası çevresinde küçülür (göz çizgisi sabit). Konum 60 fps, adım 12 fps (iner-kalkar,
  // kollar karşılıklı sallanır); kamera onu izleyip yaklaşır. Sağ eli kapı koluna uzanır (tık), kanat menteşesinde içe
  // açılır (30 fps; cam yarı saydam, dışarısı kanadın ardında sabit durur), içeri ışık dolar. D ışığa adım atar, kamera
  // kapı boşluğuna itilir, sahne beyaza açılır (perde, ayrı katman); k1262 kesme beyazdan balkona.
  const poly = (pts) => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L') + 'Z';
  const f3 = (v) => (+v).toFixed(3);
  const kam = ([cx, cy, s]) => odak(cx, cy, s);
  // Vazo biçimli taş korkuluk babası (balkonun dışı ve kapı camından görünen uzak korkuluk aynı profil)
  const BABA = [[0.5, 0], [0.5, 0.06], [0.3, 0.1], [0.24, 0.2], [0.34, 0.42], [0.46, 0.62], [0.4, 0.78], [0.26, 0.86], [0.42, 0.92], [0.5, 0.94], [0.5, 1]];
  const baba = (bx, y0, hB, bw) => [...BABA.map(([u, v]) => [bx + u * bw, y0 + v * hB]), ...BABA.map(([u, v]) => [bx - u * bw, y0 + v * hB]).reverse()];

  const LK = ctx.katman('s3-kapi', 10);
  gsap.set(LK.div, { autoAlpha: 0 });
  tl.set(LK.div, { autoAlpha: 0 }, 0);
  tl.set(LK.div, { autoAlpha: 1 }, k(1200));
  tl.set(LK.div, { autoAlpha: 0 }, k(1262));
  const IK = yer({
    goz: 430, kisi: { x: 1230, olcek: 1.1 }, bas: { dx: -700, s: 1.6 }, gec: { dx: 14, s: 0.72 },
    kasa: { x0: 862, x1: 1628, ust: -236 }, kanat: { x0: 900, x1: 1590, ust: -196, camAlt: 980, alt: 1900 },
    kol: [1556, 890], dis: { ust: 806, on: 838, alt: 1000 }, tablo: [230, 96, 470, 344],
    isik: [[200, 470], [640, 392], [660, 1000], [230, 1100]],
    kam: { bas: [900, 520, 1], izle: [1235, 500, 1.22], ic: [1250, 440, 1.9] },
  }, {
    goz: 800, kisi: { x: 600, olcek: 1.1 }, bas: { dx: -270, s: 1.6 }, gec: { dx: -20, s: 0.72 },
    kasa: { x0: 160, x1: 922, ust: -330 }, kanat: { x0: 198, x1: 884, ust: -290, camAlt: 1350, alt: 2700 },
    kol: [850, 1262], dis: { ust: 1176, on: 1208, alt: 1350 }, tablo: null,
    isik: [[-80, 1240], [140, 1170], [150, 2000], [-80, 2060]],
    kam: { bas: [520, 1000, 1.12], izle: [620, 900, 1.6], ic: [600, 820, 2.3] },
  });
  const KS = IK.kasa, KN = IK.kanat, DS = IK.dis, KW = KN.x1 - KN.x0, st = 46;
  el(LK.svg, 'rect', { x: -1500, y: -1500, width: W + 3000, height: H + 3000, fill: '#e4dfd6' });
  el(LK.svg, 'path', { d: poly(IK.isik), fill: '#f4f0e9' });
  if (IK.tablo) {
    // duvarda küçük çerçeve: içinde lale eskizi (balkondaki çiçeklerin habercisi)
    const [x0, y0, x1, y1] = IK.tablo, cx = (x0 + x1) / 2;
    cizgi(LK.svg, duz([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]), { kapali: true, dolgu: '#a59e91', kalinlik: 5, tohum: 1201 });
    cizgi(LK.svg, duz([[x0 + 22, y0 + 22], [x1 - 22, y0 + 22], [x1 - 22, y1 - 22], [x0 + 22, y1 - 22]]), { kapali: true, dolgu: '#efebe4', kalinlik: 3, tohum: 1202 });
    cizgi(LK.svg, [[cx, y1 - 40], [cx - 4, y0 + 150], [cx, y0 + 116]], { kalinlik: 3, renk: '#8d867a', tohum: 1203 });
    cizgi(LK.svg, [[cx - 26, y0 + 118], [cx - 24, y0 + 72], [cx - 10, y0 + 94], [cx, y0 + 64], [cx + 10, y0 + 94], [cx + 24, y0 + 72], [cx + 26, y0 + 118], [cx, y0 + 132]], { kapali: true, kalinlik: 3, renk: '#8d867a', tohum: 1204 });
    cizgi(LK.svg, [[cx - 2, y1 - 60], [cx - 30, y0 + 168], [cx - 4, y0 + 200]], { kalinlik: 3, renk: '#8d867a', tohum: 1205 });
  }
  // Kasa, kapı boşluğu (dışarısı: gök, uzakta korkuluk), kanat (kayıtlar opak, cam yarı saydam), kol, tül
  cizgi(LK.svg, duz([[KS.x0, KN.alt], [KS.x0, KS.ust], [KS.x1, KS.ust], [KS.x1, KN.alt]]), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5.5, tohum: 1210 });
  const defsK = el(LK.svg, 'defs');
  el(el(defsK, 'clipPath', { id: 's3-bosluk' }), 'rect', { x: KN.x0, y: KN.ust, width: KW, height: KN.alt - KN.ust });
  const disG = el(LK.svg, 'g', { 'clip-path': 'url(#s3-bosluk)' });
  el(disG, 'rect', { x: KN.x0, y: KN.ust, width: KW, height: KN.alt - KN.ust, fill: '#f9f7f2' });
  for (let bx = KN.x0 + 34, j = 0; bx < KN.x1 + 40; bx += 96, j++) el(disG, 'path', { d: ctx.yol(baba(bx, DS.on, DS.alt - DS.on + 40, 30), true, SIFIR), fill: '#e8e3da', stroke: '#b5b1aa', 'stroke-width': 3 });
  el(disG, 'path', { d: poly([[KN.x0, DS.ust], [KN.x1, DS.ust], [KN.x1, DS.on], [KN.x0, DS.on]]), fill: '#e2ddd3', stroke: '#b5b1aa', 'stroke-width': 3 });
  const kanatG = el(LK.svg, 'g');
  {
    const g = kanatG, gx0 = KN.x0 + st, gx1 = KN.x1 - st, gy0 = KN.ust + st, gy1 = KN.camAlt;
    el(g, 'rect', { x: gx0, y: gy0, width: gx1 - gx0, height: gy1 - gy0, fill: '#ddd8cf', opacity: 0.38 });
    // cam parıltısı (iki çapraz şerit)
    const pa = [[gx0 + KW * 0.12, gy0 + (gy1 - gy0) * 0.46], [gx0 + KW * 0.42, gy0 + (gy1 - gy0) * 0.18]];
    el(g, 'path', { d: ctx.yol(pa, false, SIFIR), stroke: '#fbf9f5', 'stroke-width': 16, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8 });
    el(g, 'path', { d: ctx.yol(pa.map(([x, y]) => [x + 44, y + 40]), false, SIFIR), stroke: '#fbf9f5', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8 });
    const kayit = (x0, y0, x1, y1, t) => cizgi(g, duz([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true, 40), { kapali: true, dolgu: '#d8d2c7', kalinlik: 4.5, tohum: t, genlik: 0.8 });
    kayit(KN.x0, KN.ust, KN.x0 + st, KN.alt, 1220);
    kayit(KN.x1 - st, KN.ust, KN.x1, KN.alt, 1221);
    kayit(KN.x0, KN.ust, KN.x1, KN.ust + st, 1222);
    kayit(KN.x0, KN.camAlt, KN.x1, KN.camAlt + st, 1223);
    kayit(KN.x0 + st, KN.camAlt + st, KN.x1 - st, KN.alt, 1224);
    // camı bölen ince kayıtlar
    const mx = (gx0 + gx1) / 2;
    cizgi(g, duz([[mx - 7, gy0], [mx + 7, gy0], [mx + 7, gy1], [mx - 7, gy1]], true, 40), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.4, tohum: 1225 });
    for (const t of [1 / 3, 2 / 3]) { const y = gy0 + (gy1 - gy0) * t; cizgi(g, duz([[gx0, y - 7], [gx1, y - 7], [gx1, y + 7], [gx0, y + 7]], true, 40), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.4, tohum: 1226 + t * 3 }); }
    // kol: plaka + menteşeye doğru uzanan manivela
    const [hx, hy] = IK.kol;
    cizgi(g, duz([[hx - 12, hy - 40], [hx + 12, hy - 40], [hx + 12, hy + 46], [hx - 12, hy + 46]], true, 16), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 1228 });
    cizgi(g, [[hx + 2, hy - 4], [hx - 64, hy - 2], [hx - 72, hy + 6]], { kalinlik: 9, renk: M, tohum: 1229 });
  }
  const kanatGolge = el(kanatG, 'rect', { x: KN.x0, y: KN.ust, width: KW, height: KN.alt - KN.ust, fill: '#6f695f', opacity: 0 });
  // Tül: kasanın solunda toplanmış; kapı açılınca esintiyle kıpırdar
  const tulK = el(LK.svg, 'g');
  {
    const x0 = KS.x0 - 40, sag = [];
    for (let y = KN.alt, i = 0; y > KS.ust; y -= 70, i++) sag.push([x0 + 128 + (i % 2 ? 16 : -4), y]);
    cizgi(tulK, [[x0, KS.ust], [x0, KN.alt], ...sag], { kapali: true, dolgu: '#f6f3ee', kalinlik: 3.4, renk: '#a59e91', tohum: 1230, kay: [0, 0] });
    for (const fx of [36, 82]) cizgi(tulK, [[x0 + fx, KS.ust + 10], [x0 + fx + 8, IK.goz], [x0 + fx - 4, KN.alt]], { kalinlik: 2.6, renk: '#c2bcb1', tohum: 1231 + fx });
    gsap.set(tulK, { svgOrigin: `${x0 + 60} ${KS.ust}` });
  }
  // D (sırtı dönük): figür kapının önündeki son yerinde kurulur; yürüyüş bu yere doğru (dönüşüm sonda birim olur)
  const DK = figur(LK.svg, Dhazir, { x: IK.kisi.x, alt: IK.goz + (BOY.boy - GOZ_Y) * IK.kisi.olcek, olcek: IK.kisi.olcek, id: 's3-dk' });
  DK.arka = true; DK.ciz(0);
  // Içeri dolan ışık (D'nin üstünde: sırtı ışığa karşı): kapı boşluğundan radyal parlama + odaya düşen üç huzme
  const rgK = el(defsK, 'radialGradient', { id: 's3-isikK' });
  el(rgK, 'stop', { offset: 0, 'stop-color': '#fffdf8', 'stop-opacity': 1 });
  el(rgK, 'stop', { offset: 0.5, 'stop-color': '#fffdf8', 'stop-opacity': 0.55 });
  el(rgK, 'stop', { offset: 1, 'stop-color': '#fffdf8', 'stop-opacity': 0 });
  const isikK = el(LK.svg, 'g', { opacity: 0 });
  {
    const cx = (KN.x0 + KN.x1) / 2, cy = IK.goz + 40;
    for (const [a, b, op] of [[0.1, 0.45, 0.35], [0.5, 0.8, 0.28], [0.85, 1.0, 0.3]]) {
      const ust0 = KN.x0 + KW * a, ust1 = KN.x0 + KW * b, dx = (cx - KS.x0) * 1.6;
      el(isikK, 'path', { d: poly([[ust0, KN.ust], [ust1, KN.ust], [ust1 - dx * (1 - b * 0.4), KN.alt + 900], [ust0 - dx * (1 - a * 0.4), KN.alt + 900]]), fill: '#fffdf8', opacity: op });
    }
    el(isikK, 'ellipse', { cx, cy, rx: KW * 1.3, ry: KW * 1.5, fill: 'url(#s3-isikK)' });
  }
  // Perde: beyaza açılış (kameradan bağımsız boyutta dev dikdörtgen; ayrı katman, her şeyin üstünde)
  const LP = ctx.katman('s3-perde', 12);
  el(LP.svg, 'rect', { x: -6000, y: -6000, width: 14000, height: 14000, fill: '#fdfbf7' });
  gsap.set(LP.div, { autoAlpha: 0 });
  tl.set(LP.div, { autoAlpha: 0 }, 0);
  tl.fromTo(LP.div, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(12), ease: 'power2.in', immediateRender: false }, k(1250));
  tl.to(LP.div, { autoAlpha: 0, duration: k(16), ease: E.EO }, k(1262));
  tl.set(LP.div, { autoAlpha: 0 }, k(1279));

  // Kollar (sırtı dönük): yürürken karşılıklı sallanır; sağ el kapı koluna uzanır (hedef dünya noktası; u: 0,5 yolda, 1 kolda)
  const KOLK = {
    sallan: (faz) => (o, r) => [-1, 1].map((yon) => {
      const om = yon < 0 ? o.sol : o.sag, s = faz * yon * 16;
      return kolSVG({ ...r, omuz: om, dirsek: [om[0] + yon * 12 + s * 0.4, om[1] + 158], bilek: [om[0] + yon * 4 + s, om[1] + 306], el: 'acik', elAci: 90 - s * 0.3, elBoy: EB, taraf: yon < 0 ? 'sol' : 'sag', tohum: 61 + (yon > 0 ? 1 : 0) });
    }).join(''),
    kola: (hedefD, u = 1) => (o, r, h) => {
      const hd = h.kutu(hedefD), om = o.sag, t = 0.5 + 0.5 * u;
      const tut = [om[0] + (hd[0] - om[0]) * t, om[1] + (hd[1] - om[1]) * t];
      const b = bilekBul({ el: 'tutma', hedef: tut, elAci: 64, elBoy: EB, basparmak: 1, ad: 'tut' });
      return sarkan(o, r, -1, 61) + kolSVG({ ...r, omuz: om, bilek: b, bukulme: -1, el: 'tutma', elAci: 64, elBoy: EB, basparmak: 1, taraf: 'sag', tohum: 63 });
    },
  };
  // Yürüyüş: göz noktası çevresinde ölçek (uzaklaşır) + yana kayma; 12 fps adım
  gsap.set(DK.g, { svgOrigin: `${IK.kisi.x} ${IK.goz}`, x: IK.bas.dx, scale: IK.bas.s });
  tl.fromTo(DK.g, { x: IK.bas.dx, scale: IK.bas.s }, { x: 0, scale: 1, duration: k(31), ease: 'power1.out', immediateRender: false }, k(1200));
  tl.call(() => DK.poz({ arka: true, p: Dhazir, ifade: 'notr', bakis: [0, 0], kollar: KOLK.sallan(-1), ek: null }), null, k(1200));
  for (let i = 0; i < 6; i++) {
    const n = 1200 + i * 5;
    tl.set(DK.g, { y: i % 2 ? 0 : -9, rotation: i % 2 ? 0.7 : -0.7 }, k(n));
    if (i) tl.call(() => DK.poz({ kollar: KOLK.sallan(i % 2 ? 1 : -1) }), null, k(n));
  }
  tl.set(DK.g, { y: 0, rotation: 0 }, k(1230));
  tl.call(() => DK.poz({ kollar: KOLK.kola(IK.kol, 0.5) }), null, k(1230));
  tl.call(() => DK.poz({ kollar: KOLK.kola(IK.kol, 1) }), null, k(1235));
  isaret(1236, 'tik', { not: 'kapı kolu' });
  // Kanat menteşede içe açılır (30 fps); el kolu üç adım izler, sonra bırakır
  const kapiEase = adimli(E.EO, 12, 2);
  const kapiSt = { a: 0 };
  const kanatSx = (a) => 1 - 0.84 * a;
  const kapiUyg = () => {
    kanatG.setAttribute('transform', `translate(${KN.x0} 0) scale(${f3(kanatSx(kapiSt.a))} 1) translate(${-KN.x0} 0)`);
    kanatGolge.setAttribute('opacity', f3(kapiSt.a * 0.3));
  };
  tl.fromTo(kapiSt, { a: 0 }, { a: 1, duration: k(12), ease: kapiEase, onUpdate: kapiUyg, immediateRender: false }, k(1238));
  for (const n of [1238, 1240, 1242]) {
    const sx = kanatSx(kapiEase((n - 1238) / 12));
    tl.call(() => DK.poz({ kollar: KOLK.kola([KN.x0 + (IK.kol[0] - KN.x0) * sx, IK.kol[1]]) }), null, k(n));
  }
  tl.call(() => DK.poz({ kollar: KOLK.sallan(0) }), null, k(1245));
  tl.fromTo(tulK, { skewX: 0 }, { keyframes: { skewX: [0, 4, -2, 3] }, duration: k(22), ease: 'sine.inOut', immediateRender: false }, k(1240));
  tl.fromTo(isikK, { opacity: 0 }, { opacity: 1, duration: k(16), ease: 'power1.in', immediateRender: false }, k(1240));
  isaret(1242, 'vurgu', { not: 'ışık dolar' });
  // Işığa adım: uzaklaşır (iki adım), kamera kapı boşluğuna itilir
  tl.to(DK.g, { x: IK.gec.dx, scale: IK.gec.s, duration: k(16), ease: 'power1.in' }, k(1246));
  for (let i = 0; i < 3; i++) {
    tl.set(DK.g, { y: i % 2 ? 0 : -7 }, k(1246 + i * 5));
    tl.call(() => DK.poz({ kollar: KOLK.sallan(i % 2 ? 1 : -1) }), null, k(1246 + i * 5));
  }
  ctx.kameraKoy(1200, kam(IK.kam.bas));
  tl.fromTo(ctx.kamera, kam(IK.kam.bas), { ...kam(IK.kam.izle), duration: k(34), ease: E.KM, immediateRender: false }, k(1200));
  tl.to(ctx.kamera, { ...kam(IK.kam.ic), duration: k(16), ease: 'power2.in' }, k(1246));
  isaret(1200, 'kesme');

  // ============================================================================ #11–#13 BALKON (dışarıdan, güneşli)
  // Cephe, açık balkon kapısı (içeride gölgede oda, sağda içe açılmış kanat ve dışarı taşan tül), taş pervaz ve vazo
  // biçimli korkuluk babaları. Saksılar pervazda DEĞİL: kapının solunda, cepheye yakın yüksek bir sehpada (ayakları
  // pervazın arkasında kalır), ağızları D'nin göz hizasında: bakışını yatay çevirdiğinde aynı hizaya bakar.
  // Güneş sol üstten: sıcak beyaz parlama + çok saydam geniş huzmeler (mono; vurgu rengi yok) + minik ışıltılar.
  const LB = ctx.katman('s3-balkon', 10);
  gsap.set(LB.div, { autoAlpha: 0 });
  tl.set(LB.div, { autoAlpha: 0 }, 0);
  tl.set(LB.div, { autoAlpha: 1 }, k(1262));
  tl.set(LB.div, { autoAlpha: 0 }, k(SON + 1));
  // Yerleşim: kamera.balon (birim kamera) balon planıdır; öbür planlar onun içine yaklaşır. Balon solda yukarıda, gerçek
  // saksılar ve D'nin yüzü altta aynı hizada (balon tümsekleri çiçeklerin üstünde kalır; elips kadraj kenarından ~110 px
  // içeride). D'nin pervaz yüksekliği eski balkonla aynı (kutu biriminde 416: kavuşuk kollar taşa oturur).
  const B = yer({
    kisi: { x: 1620, alt: 994, olcek: 1.35 }, dirsekX: 40, varis: 0.8,
    kapi: { x0: 1370, x1: 1870, ust: -760 }, pervaz: { ust: 962, on: 990, alt: 1040, x0: -700, x1: 2700 },
    korkuluk: { taban: 1470, ara: 150, en: 64 },
    sehpa: { x0: 868, x1: 1300, ust: 760 }, taban: 754,
    saksi: [
      { x: 982, h: 140, wA: 136, wT: 92, kH: 30, kirik: true },
      { x: 1112, h: 116, wA: 114, wT: 78, kH: 25, catlak: 1 },
      { x: 1222, h: 96, wA: 94, wT: 64, kH: 21, catlak: -1 },
    ],
    cicek: { gul: 108, lale: 118, gonca: 88 },
    gunes: [-300, -460], huzme: [24, 31, 38, 46, 55],
    konus1: { x: 1104, y: 304, boyut: 50, kuyruk: [1516, 552] },
    konus2: { x: 740, y: 318, boyut: 54, kuyruk: [1514, 612] },
    balon: { c: [520, 300], r: [470, 200], koken: '92% 96%', n: [[1470, 472, 10], [1394, 422, 14], [1302, 376, 19], [1196, 342, 24]] },
    fikir: { o: [700, 444], s: 0.75, yazi: { x: 168, y: 186, boyut: 50 } },
    kam: { varis: [1330, 560, 1.12], iki: [1350, 600, 1.5], itis: [1300, 612, 1.58], balon: [960, 500, 1], son: [1290, 640, 1.28] },
  }, {
    kisi: { x: 720, alt: 1604, olcek: 1.35 }, dirsekX: 22, varis: 0.8,
    kapi: { x0: 472, x1: 968, ust: -200 }, pervaz: { ust: 1572, on: 1600, alt: 1652, x0: -700, x1: 1800 },
    korkuluk: { taban: 2090, ara: 150, en: 60 },
    sehpa: { x0: 8, x1: 432, ust: 1370 }, taban: 1364,
    saksi: [
      { x: 104, h: 140, wA: 132, wT: 90, kH: 30, kirik: true },
      { x: 232, h: 116, wA: 110, wT: 76, kH: 25, catlak: 1 },
      { x: 342, h: 96, wA: 92, wT: 62, kH: 21, catlak: -1 },
    ],
    cicek: { gul: 112, lale: 122, gonca: 90 },
    gunes: [-420, 420], huzme: [22, 30, 38, 47, 57],
    konus1: { x: 96, y: 904, boyut: 54, kuyruk: [606, 1160] },
    konus2: { x: 96, y: 790, boyut: 54, kuyruk: [612, 1210] },
    balon: { c: [540, 580], r: [436, 300], koken: '74% 98%', n: [[700, 1102, 10], [670, 1062, 14], [632, 1016, 19]] },
    fikir: { o: [706, 826], s: 0.9, yazi: { x: 132, y: 404, boyut: 58 } },
    kam: { varis: [500, 1250, 1.12], iki: [495, 1236, 1.16], itis: [482, 1246, 1.2], balon: [540, 960, 1], son: [520, 1150, 1.12] },
  });
  const P = B.pervaz, KP = B.kapi, KB = B.korkuluk, SH = B.sehpa;
  // Katmanlar (arkadan öne): cephe ve kapı, sehpa, saksılar, çiçekler, huzmeler, D'nin gövdesi, pervaz, kollar,
  // yüzdeki ışık ve ışıltılar, balon
  const cepheG = el(LB.svg, 'g');
  const sehpaG = el(LB.svg, 'g');
  const saksiG = el(LB.svg, 'g');
  const cicekG = el(LB.svg, 'g');
  const isikArkaG = el(LB.svg, 'g'); // güneş huzmeleri: cephe, sehpa ve saksıların üstünde, D'nin arkasında (D net kalır)
  const govdeG = el(LB.svg, 'g');
  const pervazG = el(LB.svg, 'g');
  const kolG = el(LB.svg, 'g');
  const gunesG = el(LB.svg, 'g');
  const balonG = el(LB.svg, 'g');
  const DB = figur(govdeG, Dhazir, { ...B.kisi, id: 's3-db', kolUst: kolG });

  // Cephe ve kapı: kasa, gölgedeki oda, içe açılmış kanat (sağda), dışarı taşan tül
  el(cepheG, 'rect', { x: -1500, y: -1500, width: W + 3000, height: H + 3000, fill: '#e2ddd3' });
  for (let y = P.ust - 150, i = 0; y > -1400; y -= 150, i++) el(cepheG, 'path', { d: ctx.yol([[-1500, y], [W + 1500, y + (i % 2 ? 3 : -2)]], false, SIFIR), stroke: '#d6d0c5', 'stroke-width': 3, fill: 'none' });
  cizgi(cepheG, duz([[KP.x0 - 30, P.ust + 40], [KP.x0 - 30, KP.ust], [KP.x1 + 30, KP.ust], [KP.x1 + 30, P.ust + 40]]), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5.5, tohum: 780 });
  cizgi(cepheG, duz([[KP.x0, P.ust + 40], [KP.x0, KP.ust + 30], [KP.x1, KP.ust + 30], [KP.x1, P.ust + 40]]), { kapali: true, dolgu: '#a59e91', kalinlik: 5, tohum: 781 });
  el(cepheG, 'path', { d: poly([[KP.x0, KP.ust + 30], [KP.x0 + 60, KP.ust + 30], [KP.x0 + 60, P.ust + 40], [KP.x0, P.ust + 40]]), fill: '#8d867a', opacity: 0.5 });
  cizgi(cepheG, duz([[KP.x1 - 96, KP.ust + 90], [KP.x1, KP.ust + 30], [KP.x1, P.ust + 40], [KP.x1 - 96, P.ust + 40]], true, 50), { kapali: true, dolgu: '#cfc9bd', kalinlik: 4.5, tohum: 782 });
  cizgi(cepheG, duz([[KP.x1 - 82, KP.ust + 120], [KP.x1 - 14, KP.ust + 80], [KP.x1 - 14, P.ust - 120], [KP.x1 - 82, P.ust - 120]], true, 50), { kapali: true, dolgu: '#e2ddd3', kalinlik: 3, tohum: 783 });
  const tulB = el(cepheG, 'g');
  {
    const x0 = KP.x1 - 150, sol = [];
    for (let y = P.ust + 40, i = 0; y > KP.ust + 30; y -= 64, i++) sol.push([x0 + (i % 2 ? -14 : 6), y]);
    cizgi(tulB, [[KP.x1 - 4, KP.ust + 34], [KP.x1 - 4, P.ust + 40], ...sol], { kapali: true, dolgu: '#f6f3ee', kalinlik: 3.4, renk: '#a59e91', tohum: 784, kay: [0, 0] });
    for (const fx of [40, 90]) cizgi(tulB, [[KP.x1 - fx, KP.ust + 40], [KP.x1 - fx - 8, (KP.ust + P.ust) / 2], [KP.x1 - fx + 4, P.ust + 30]], { kalinlik: 2.6, renk: '#c2bcb1', tohum: 785 + fx });
    gsap.set(tulB, { svgOrigin: `${KP.x1} ${KP.ust + 30}` });
    tl.fromTo(tulB, { skewX: 0 }, { keyframes: { skewX: [0, 3.5, -1, 2.5, 0] }, duration: k(150), ease: 'sine.inOut', repeat: 3, immediateRender: false }, k(1262));
  }

  // Sehpanın ve saksıların cepheye düşen gölgesi (güneş sol üstten: sağa ve aşağı kayık, yumuşak)
  {
    const tb = SH.ust, x0 = SH.x0, x1 = SH.x1, dx = yer(46, 40), dy = 34, g = el(cepheG, 'g', { opacity: 0.5 });
    const gol = (pts) => el(g, 'path', { d: poly(pts.map(([x, y]) => [x + dx, y + dy])), fill: '#cbc4b8' });
    gol([[x0 + 10, tb - 16], [x1 - 10, tb - 16], [x1, tb + 22], [x0, tb + 22]]);
    for (const xa of [x0 + 18, x1 - 30]) gol([[xa, tb + 22], [xa + 14, tb + 22], [xa + 18, P.ust], [xa + 4, P.ust]]);
    B.saksi.forEach((s) => gol([[s.x - s.wA / 2, B.taban - s.h], [s.x + s.wA / 2, B.taban - s.h], [s.x + s.wT / 2, B.taban], [s.x - s.wT / 2, B.taban]]));
  }
  // Yüksek sehpa: kalın tabla (üst yüz + ön yüz), iki ön ayak hafif açık, gölgede iki arka ayak, arada kuşak;
  // ayakların altı pervazın arkasında kalır
  {
    const tb = SH.ust, x0 = SH.x0, x1 = SH.x1, alt = P.ust + 220;
    const ayak = (xu, xa, w, renk, t) => cizgi(sehpaG, duz([[xu - w, tb + 18], [xu + w, tb + 18], [xa + w * 0.8, alt], [xa - w * 0.8, alt]], true, 40), { kapali: true, dolgu: renk, kalinlik: 4.5, tohum: t });
    ayak(x0 + 74, x0 + 70, 8, '#8d867a', 1301); ayak(x1 - 74, x1 - 70, 8, '#8d867a', 1302);
    cizgi(sehpaG, duz([[x0 + 30, tb + 150], [x1 - 30, tb + 150], [x1 - 26, tb + 168], [x0 + 26, tb + 168]], true, 40), { kapali: true, dolgu: '#a59e91', kalinlik: 4, tohum: 1303 });
    ayak(x0 + 24, x0 + 4, 11, '#a59e91', 1304); ayak(x1 - 24, x1 - 4, 11, '#a59e91', 1305);
    cizgi(sehpaG, duz([[x0 + 14, tb - 16], [x1 - 14, tb - 16], [x1, tb], [x0, tb]], true, 50), { kapali: true, dolgu: '#d8d2c7', kalinlik: 5, tohum: 1306 });
    cizgi(sehpaG, duz([[x0, tb], [x1, tb], [x1, tb + 22], [x0, tb + 22]], true, 50), { kapali: true, dolgu: '#b0a99c', kalinlik: 5, tohum: 1307 });
  }

  // Taş pervaz: arkası gölgede (D'nin alt gövdesi ve sehpanın ayakları görünmez), vazo biçimli babalar, taban kirişi,
  // üst yüz (açık), ön yüz, saçak gölgesi; derzler ve keski izleri
  el(pervazG, 'path', { d: ctx.yol([[P.x0, P.alt], [P.x1, P.alt], [P.x1, KB.taban], [P.x0, KB.taban]], true, SIFIR), fill: '#bdb6a9' });
  {
    let j = 0;
    for (let bx = P.x0 + KB.ara / 2; bx < P.x1; bx += KB.ara, j++) cizgi(pervazG, baba(bx, P.alt, KB.taban - P.alt, KB.en), { kapali: true, dolgu: TAS.ust, kalinlik: 3.6, tohum: 796 + j, genlik: 0.8 });
    cizgi(pervazG, duz([[P.x0, KB.taban], [P.x1, KB.taban], [P.x1, KB.taban + 60], [P.x0, KB.taban + 60]], true, 60), { kapali: true, dolgu: TAS.on, kalinlik: 5, tohum: 795 });
    cizgi(pervazG, duz([[P.x0, KB.taban + 60], [P.x1, KB.taban + 60], [P.x1, KB.taban + 600], [P.x0, KB.taban + 600]], true, 80), { kapali: true, dolgu: '#e2ddd3', kalinlik: 5, tohum: 789 });
  }
  el(pervazG, 'path', { d: ctx.yol([[P.x0, P.alt], [P.x1, P.alt], [P.x1, P.alt + 16], [P.x0, P.alt + 16]], true, SIFIR), fill: '#6f695f', opacity: 0.35 });
  cizgi(pervazG, duz([[P.x0, P.on], [P.x1, P.on], [P.x1, P.alt], [P.x0, P.alt]], true, 60), { kapali: true, dolgu: TAS.on, kalinlik: 5.5, tohum: 791 });
  cizgi(pervazG, duz([[P.x0 + 16, P.ust], [P.x1 - 16, P.ust], [P.x1, P.on], [P.x0, P.on]], true, 60), { kapali: true, dolgu: TAS.ust, kalinlik: 5.5, tohum: 792 });
  {
    const R1 = rng(793);
    for (let x = P.x0 + 220; x < P.x1; x += 470) cizgi(pervazG, [[x, P.on + 4], [x + 2, P.alt - 4]], { kalinlik: 3.4, tohum: 794 + x });
    for (let i = 0; i < 30; i++) {
      const x = P.x0 + R1() * (P.x1 - P.x0), y = P.on + 10 + R1() * (P.alt - P.on - 20);
      el(pervazG, 'circle', { cx: f1(x), cy: f1(y), r: (1.4 + R1() * 1.6).toFixed(1), fill: '#8d867a', opacity: 0.55 });
    }
  }


  // ---------- Klişe toprak saksı (gerçek): konik gövde + kalın ağız bandı, ağızda toprak; kırık: çentik + çatlak
  function saksiKur(ust, s, tohum) {
    const g = el(ust, 'g');
    const { x } = s, t = B.taban, y0 = t - s.h, yb = y0 + s.kH, ry = s.wA * 0.12, wb = s.wA * 0.88;
    // gövde: bant altından tabana; altta hafif kavis
    const govde = [
      ...duz([[x - wb / 2, yb], [x - s.wT / 2, t]], false, 22).slice(0, -1),
      ...elips(x, t, s.wT / 2, ry * 0.6, 180, 0, 10),
      ...duz([[x + s.wT / 2, t], [x + wb / 2, yb]], false, 22).slice(1),
      ...elips(x, yb, wb / 2, ry * 0.9, 0, 180, 10).slice(1, -1),
    ];
    cizgi(g, govde, { kapali: true, dolgu: TERRA, kalinlik: 5, tohum, genlik: 0.8 });
    // gölge yanı (sağ) ve ağız bandının altına düşen gölge
    const poly = (pts) => 'M' + pts.map(([px, py]) => `${f1(px)} ${f1(py)}`).join(' L') + 'Z';
    el(g, 'path', { d: poly([[x + wb * 0.2, yb + ry * 0.9], [x + wb / 2 - 5, yb + 3], [x + s.wT / 2 - 4, t - 4], [x + s.wT * 0.16, t + ry * 0.45]]), fill: TERRA_K, opacity: 0.5 });
    // kırık çentik: ağzın ön yayında, sağa yakın (kenar bandını keser)
    const ck = s.kirik ? { a0: 38, a1: 74, d: s.kH * 0.62 } : null;
    const cent = (pts, a0, a1) => pts.map(([px, py], i) => {
      if (!ck) return [px, py];
      const a = a0 + (a1 - a0) * i / (pts.length - 1);
      if (a < ck.a0 || a > ck.a1) return [px, py];
      const u = (a - ck.a0) / (ck.a1 - ck.a0), tri = 1 - Math.abs(u - 0.45) / 0.55;
      return [px, py + ck.d * Math.max(0, tri) * (0.8 + 0.2 * Math.sin(u * 9))];
    });
    const ustYay = cent(elips(x, y0, s.wA / 2, ry, 0, 180, 24), 0, 180);
    const bant = [
      [x - s.wA / 2, y0], ...duz([[x - s.wA / 2, y0], [x - s.wA / 2 + 3, yb]], false, 12).slice(1),
      ...elips(x, yb, s.wA / 2 - 3, ry * 0.95, 180, 0, 16).slice(1, -1),
      ...duz([[x + s.wA / 2 - 3, yb], [x + s.wA / 2, y0]], false, 12),
      ...ustYay.slice(1, -1),
    ];
    cizgi(g, bant, { kapali: true, dolgu: TERRA, kalinlik: 5, tohum: tohum + 1, genlik: 0.8 });
    el(g, 'path', { d: poly([[x + s.wA * 0.4, y0 + ry * 0.94], [x + s.wA / 2 - 5, y0 + 4], [x + s.wA / 2 - 6, yb - 3], [x + s.wA * 0.38, yb + ry * 0.86]]), fill: TERRA_K, opacity: 0.45 });
    // ağız: arka kenar (üst yarım elips) + iç (toprak)
    const agiz = cent(elips(x, y0, s.wA / 2, ry, 0, 360, 40), 0, 360);
    cizgi(g, agiz, { kapali: true, dolgu: TERRA_A, kalinlik: 5, tohum: tohum + 2, genlik: 0.7 });
    const ic = cent(elips(x, y0 + 2, s.wA / 2 - 9, ry - 4, 0, 360, 24), 0, 360);
    cizgi(g, ic, { kapali: true, dolgu: TOPRAK, kalinlik: 3.4, tohum: tohum + 3, genlik: 0.6 });
    if (ck) {
      // çentiğin içi (kırık kil, koyu) ve gövdeye inen çatlak
      const cx0 = x + s.wA / 2 * Math.cos(ck.a0 * Math.PI / 180), cx1 = x + s.wA / 2 * Math.cos(ck.a1 * Math.PI / 180);
      const cyy = y0 + ry * Math.sin(56 * Math.PI / 180);
      el(g, 'path', { d: ctx.yol([[cx1, cyy - 2], [cx0, cyy - 4], [(cx0 + cx1) / 2 + 2, cyy + ck.d * 0.9]], true, SIFIR), fill: TERRA_K });
      const cm = (cx0 + cx1) / 2 + 2;
      cizgi(g, [[cm, cyy + ck.d * 0.9], [cm - 8, yb + 14], [cm + 4, yb + 34], [cm - 6, yb + 58], [cm, yb + 76]], { kalinlik: 2.8, tohum: tohum + 4, genlik: 0.6 });
    }
    if (s.catlak) {
      // kılcal çatlak: ağız bandının altından gövdeye (catlak: ±1 hangi yanda), ucunda kısa bir çatal
      const cx = x + s.catlak * s.wA * 0.2, L = (t - yb) * 0.62;
      cizgi(g, [[cx, yb + 4], [cx + 6, yb + L * 0.3], [cx - 3, yb + L * 0.62], [cx + 4, yb + L]], { kalinlik: 2.6, tohum: tohum + 5, genlik: 0.6 });
      cizgi(g, [[cx - 2, yb + L * 0.6], [cx - 14 * s.catlak, yb + L * 0.78]], { kalinlik: 2.2, tohum: tohum + 6, genlik: 0.5 });
    }
    return { g, agizY: y0, ry, x, ck };
  }

  // ---------- Çiçekler (mono): gül (koyu gri, sarmal), lale (açık gri, üç uçlu kâse), gonca
  function gulKur(ust, x, y0, sap, tohum) {
    const g = el(ust, 'g'), bx = x - 6, by = y0 - sap, Rg = yer(40, 44);
    cizgi(g, [[x, y0], [x - 6, y0 - sap * 0.4], [x + 2, y0 - sap * 0.75], [bx, by + Rg * 0.7]], { kalinlik: 5, tohum });
    // dikenler ve yapraklar
    cizgi(g, [[x - 4, y0 - sap * 0.3], [x - 14, y0 - sap * 0.34]], { kalinlik: 3.4, tohum: tohum + 1 });
    cizgi(g, [[x + 1, y0 - sap * 0.62], [x + 12, y0 - sap * 0.66]], { kalinlik: 3.4, tohum: tohum + 2 });
    const yaprak = (ax, ay, yon, L, t2) => {
      const uc = [ax + yon * L, ay - L * 0.42];
      cizgi(g, [[ax, ay], [ax + yon * L * 0.45, ay - L * 0.5], uc, [ax + yon * L * 0.6, ay - L * 0.05]], { kapali: true, dolgu: '#a59e91', kalinlik: 4, tohum: t2 });
      cizgi(g, [[ax + yon * 4, ay - 2], [uc[0] - yon * 8, uc[1] + 4]], { kalinlik: 2.4, tohum: t2 + 1 });
    };
    yaprak(x - 4, y0 - sap * 0.48, -1, 54, tohum + 3);
    yaprak(x + 1, y0 - sap * 0.22, 1, 46, tohum + 5);
    // çanak yaprakları
    for (const d of [-1, 0, 1]) cizgi(g, [[bx + d * 6, by + Rg * 0.72], [bx + d * 24, by + Rg * 0.98]], { kalinlik: 3.4, tohum: tohum + 8 + d });
    // kâse (dalgalı üst kenar) + iç sarmal + yan taç yaprak çizgileri
    const kase = [[-1, -0.1], [-0.92, 0.42], [-0.5, 0.86], [0, 0.96], [0.5, 0.86], [0.92, 0.42], [1, -0.1], [0.72, -0.5], [0.4, -0.3], [0.06, -0.62], [-0.3, -0.34], [-0.68, -0.52]].map(([u, v]) => [bx + u * Rg, by + v * Rg]);
    cizgi(g, kase, { kapali: true, dolgu: '#8d867a', kalinlik: 5, tohum: tohum + 12 });
    const sarmal = [];
    for (let i = 0; i <= 14; i++) { const a = i * 0.62 + 0.6, rr = Rg * (0.08 + i * 0.034); sarmal.push([bx + Math.cos(a) * rr, by - Rg * 0.12 + Math.sin(a) * rr * 0.72]); }
    cizgi(g, sarmal, { kalinlik: 3.4, tohum: tohum + 13 });
    cizgi(g, [[bx - Rg * 0.86, by + Rg * 0.1], [bx - Rg * 0.5, by + Rg * 0.66], [bx - Rg * 0.06, by + Rg * 0.8]], { kalinlik: 3, tohum: tohum + 14 });
    cizgi(g, [[bx + Rg * 0.88, by + Rg * 0.06], [bx + Rg * 0.56, by + Rg * 0.6], [bx + Rg * 0.18, by + Rg * 0.76]], { kalinlik: 3, tohum: tohum + 15 });
    return { g, kok: [x, y0] };
  }
  function laleKur(ust, x, y0, sap, tohum, { gonca = false, egim = 0 } = {}) {
    const g = el(ust, 'g'), hx = x + egim, hy = y0 - sap, Lw = gonca ? yer(22, 24) : yer(31, 34), Lh = gonca ? yer(46, 50) : yer(48, 52);
    // uzun şerit yapraklar (ağızdan)
    const yap = (yon, L, t2) => cizgi(g, [[x - yon * 4, y0 + 2], [x + yon * L * 0.28, y0 - L * 0.5], [x + yon * L * 0.42, y0 - L], [x + yon * L * 0.12, y0 - L * 0.46], [x + yon * 6, y0 + 2]], { kapali: true, dolgu: '#b0a99c', kalinlik: 4, tohum: t2 });
    cizgi(g, [[x, y0], [x + egim * 0.3, y0 - sap * 0.5], [hx, hy + Lh * 0.4]], { kalinlik: 5, tohum });
    yap(-1, sap * (gonca ? 0.55 : 0.7), tohum + 1);
    yap(1, sap * (gonca ? 0.42 : 0.5), tohum + 2);
    const bas = gonca
      ? [[-0.6, 0.1], [-0.5, 0.6], [0, 0.82], [0.5, 0.6], [0.6, 0.1], [0.32, -0.5], [0, -0.86], [-0.32, -0.5]]
      : [[-0.6, -0.16], [-0.56, 0.48], [0, 0.78], [0.56, 0.48], [0.6, -0.16], [0.42, -0.78], [0.2, -0.3], [0, -0.86], [-0.2, -0.3], [-0.42, -0.78]];
    cizgi(g, bas.map(([u, v]) => [hx + u * Lw * 1.6, hy + v * Lh * 0.62]), { kapali: true, dolgu: '#d8d2c7', kalinlik: 5, tohum: tohum + 4 });
    cizgi(g, [[hx, hy + Lh * 0.42], [hx - 2, hy - Lh * 0.1], [hx, hy - Lh * (gonca ? 0.4 : 0.5)]], { kalinlik: 3, tohum: tohum + 5 });
    return { g, kok: [x, y0] };
  }

  // Saksılar ve çiçekleri (sehpada): çiçek saksının ağzından çıkar
  const sk = B.saksi.map((s, i) => saksiKur(saksiG, s, 820 + i * 10));
  const cicekler = [
    gulKur(cicekG, sk[0].x + 4, sk[0].agizY + 4, B.cicek.gul, 860),
    laleKur(cicekG, sk[1].x - 2, sk[1].agizY + 3, B.cicek.lale, 880, { egim: -8 }),
    laleKur(cicekG, sk[2].x + 2, sk[2].agizY + 3, B.cicek.gonca, 890, { gonca: true, egim: 10 }),
  ];
  // Esinti: her çiçek sap dibinden ±1,4° salınır (60 fps, farklı evre)
  cicekler.forEach((c, i) => {
    gsap.set(c.g, { svgOrigin: `${c.kok[0]} ${c.kok[1]}` });
    tl.fromTo(c.g, { rotation: -1.4 + i * 0.6 }, { rotation: 1.4 - i * 0.4, duration: k(70 + i * 14), ease: 'sine.inOut', yoyo: true, repeat: 6, immediateRender: false }, k(1262 + i * 9));
  });
  // Dökülen toprak (sehpanın tablasında, gül saksısının dibinde), kırık parçaları, tabla kenarından düşen kırıntılar
  const dokuntu = el(saksiG, 'g');
  {
    const s0 = B.saksi[0], tb = B.taban, R2 = rng(901), sx = s0.x + s0.wT / 2 + 4;
    cizgi(dokuntu, [[sx - 8, tb + 1], [sx + 8, tb - 10], [sx + 26, tb - 8], [sx + 40, tb + 1]], { kapali: true, dolgu: TOPRAK, kalinlik: 3.4, tohum: 902 });
    for (let i = 0; i < 9; i++) {
      const cx = sx + 30 + R2() * 34 - (i % 3) * 18, cy = tb - 1 + R2() * 5, r = 2.6 + R2() * 3.4;
      cizgi(dokuntu, oval(cx, cy, r, r * 0.8, 0, 360, 7), { kapali: true, dolgu: i % 2 ? TOPRAK : TOPRAK_A, kalinlik: 2.2, tohum: 903 + i, kay: [1, 1] });
    }
    for (let i = 0; i < 2; i++) {
      const cx = s0.x - s0.wT / 2 - 18 - i * 28, cy = tb - 3;
      cizgi(dokuntu, [[cx - 12, cy + 4], [cx + 2, cy - 9], [cx + 14, cy + 3]], { kapali: true, dolgu: TERRA, kalinlik: 3, tohum: 920 + i, kay: [1, 1] });
    }
    // tablanın ön yüzünden aşağı süzülen birkaç kırıntı (yere dökülmüş)
    for (let i = 0; i < 4; i++) {
      const cx = s0.x - 20 + i * 22, cy = SH.ust + 6 + (i % 2) * 9;
      cizgi(dokuntu, oval(cx, cy, 3.2, 2.6, 0, 360, 7), { kapali: true, dolgu: TOPRAK, kalinlik: 2, tohum: 912 + i, kay: [1, 1] });
    }
    // lale saksısının ağzından taşan toprak
    const s1 = sk[1];
    cizgi(dokuntu, [[s1.x - 30, s1.agizY + s1.ry * 0.7], [s1.x - 20, s1.agizY + s1.ry + 14], [s1.x - 6, s1.agizY + s1.ry + 6], [s1.x + 6, s1.agizY + s1.ry * 0.9]], { kapali: true, dolgu: TOPRAK, kalinlik: 3, tohum: 925, kay: [1, 1] });
  }
  // Düşen topak (k1374): kırık çentikten tablaya düşer, sekip durur (30 fps); D'nin kaşı iner
  const topak = el(saksiG, 'g');
  {
    const s0 = sk[0], cx = s0.x + B.saksi[0].wA * 0.3, cy = s0.agizY + s0.ry + 8;
    cizgi(topak, oval(cx, cy, 10, 8, 0, 360, 8), { kapali: true, dolgu: TOPRAK, kalinlik: 3, tohum: 930, kay: [1, 1] });
    gizle(topak, 1374);
    const dy = B.taban - cy - 7, dx = B.saksi[0].wA * 0.42;
    tl.fromTo(topak, { x: 0, y: 0 }, { keyframes: { x: [0, dx * 0.5, dx], y: [0, -6, dy] }, duration: k(14), ease: adimli('power2.in', 14, 2), immediateRender: false }, k(1374));
    tl.to(topak, { keyframes: { x: [dx, dx + 10, dx + 16], y: [dy, dy - 8, dy] }, duration: k(10), ease: adimli('none', 10, 2) }, k(1388));
    isaret(1388, 'tik', { not: 'toprak' });
  }

  // ---------- Güneş (sol üstten): sıcak beyaz parlama + geniş, çok saydam huzmeler; huzmeler ağır ağır nefes alır.
  // D'nin yüzüne vuran ışık: yüzün üstünde yumuşak parlama; minik ışıltılar (dört uçlu yıldız, mürekkep konturlu)
  const defsB = el(LB.svg, 'defs');
  const radyal = (id, renk, duraklar) => { const g = el(defsB, 'radialGradient', { id }); duraklar.forEach(([o, a]) => el(g, 'stop', { offset: o, 'stop-color': renk, 'stop-opacity': a })); };
  radyal('s3-gunes', '#fffaf0', [[0, 0.95], [0.4, 0.45], [1, 0]]);
  radyal('s3-yuz', '#fffdf8', [[0, 0.5], [0.5, 0.2], [1, 0]]);
  const huzmeG = el(isikArkaG, 'g');
  {
    const [gx, gy] = B.gunes;
    el(huzmeG, 'ellipse', { cx: gx, cy: gy, rx: 1500, ry: 1500, fill: 'url(#s3-gunes)' });
    B.huzme.forEach((a, i) => {
      const yarim = 1.6 + (i % 2) * 1.1, L = 4200;
      const u = (d) => [gx + Math.cos(d * Math.PI / 180) * L, gy + Math.sin(d * Math.PI / 180) * L];
      const h = el(huzmeG, 'path', { d: poly([[gx, gy], u(a - yarim), u(a + yarim)]), fill: '#fffaf0', opacity: 0.17 + (i % 3) * 0.04 });
      tl.fromTo(h, { opacity: 0.17 + (i % 3) * 0.04 }, { opacity: 0.07 + (i % 2) * 0.04, duration: k(90 + i * 17), ease: 'sine.inOut', yoyo: true, repeat: 4, immediateRender: false }, k(1262 + i * 11));
    });
  }
  // balon planında huzmeler biraz söner (balonla yarışmasın)
  tl.to(huzmeG, { opacity: 0.55, duration: k(36), ease: 'none' }, k(1408));
  const gozB = DB.dunya([200, GOZ_Y]);
  const yuzIsik = el(gunesG, 'ellipse', { cx: f1(gozB[0]), cy: f1(gozB[1] + 14), rx: 175, ry: 200, fill: 'url(#s3-yuz)', opacity: 0 });
  tl.fromTo(yuzIsik, { opacity: 0 }, { opacity: 0.6, duration: k(22), ease: 'power1.out', immediateRender: false }, k(1268));
  tl.to(yuzIsik, { opacity: 0.32, duration: k(50), ease: 'sine.inOut' }, k(1300));
  tl.to(yuzIsik, { opacity: 0.18, duration: k(30), ease: 'none' }, k(1408));
  const yildiz = (r) => { const a = r * 0.2; return `M0 ${-r} Q${a} ${-a} ${r} 0 Q${a} ${a} 0 ${r} Q${-a} ${a} ${-r} 0 Q${-a} ${-a} 0 ${-r}Z`; };
  // pirilti(x, y, r, k0): 18 k'da açılıp söner (30 fps adım), hafif döner
  const pirilti = (x, y, r, k0, sure = 18) => {
    const g = el(gunesG, 'g', { transform: `translate(${f1(x)} ${f1(y)})` });
    const s = el(g, 'path', { d: yildiz(r), fill: '#fffdf8', stroke: M, 'stroke-width': 2.4, 'stroke-linejoin': 'round' });
    gsap.set(s, { scale: 0, svgOrigin: '0 0' });
    tl.fromTo(s, { scale: 0, rotation: -25 }, { keyframes: { scale: [0, 1.15, 0.85, 0], rotation: [-25, 0, 12, 24] }, duration: k(sure), ease: adimli('none', sure, 2), immediateRender: false }, k(k0));
  };
  // Güneş vurur: başın çevresinde (k1272–1300), sonra çiçeklerde (k1322–1360)
  [[-150, -168, 17, 1272], [138, -200, 13, 1276], [196, -70, 19, 1281], [-196, -50, 12, 1286], [60, -258, 15, 1292], [-110, -236, 11, 1299]]
    .forEach(([dx, dy, r, n]) => pirilti(gozB[0] + dx, gozB[1] + dy, r, n));
  [[sk[0].x - 30, sk[0].agizY - B.cicek.gul - 30, 14, 1322], [sk[1].x + 28, sk[1].agizY - B.cicek.lale - 22, 12, 1334], [sk[2].x - 24, sk[2].agizY - B.cicek.gonca + 4, 11, 1346], [sk[0].x + 52, sk[0].agizY - 60, 10, 1358]]
    .forEach(([x, y, r, n]) => pirilti(x, y, r, n));
  isaret(1272, 'vurgu', { not: 'güneş' });

  // ---------- D (balkon) kol pozları: dirsekler gövdeden dışarıda taşın üstünde, ön kollar pervazda yatay, eller ortada
  // üst üste (öne yaslanmış; üst kol kısalır). Çene pozunda sağ ön kol dirsekten çeneye kalkar; yanak pozunda sol ön kol
  // (ekranın sağı) kalkar, açık el yanağa yaslanır (sıkılmış), baş o yana yatar
  const pervazB = (h) => (P.ust - h.y0) / h.olcek;   // pervaz üst yüzünün kutu birimindeki yeri
  const yatik = (o, r, h, yon, tohum) => {
    const s = pervazB(h), om = yon < 0 ? o.sol : o.sag;
    const dirsek = [om[0] + yon * B.dirsekX, s - 2], bilek = [200 + yon * 40, s + (yon < 0 ? -6 : 4)];
    return kolSVG({ ...r, omuz: om, dirsek, bilek, el: 'dayanma', elAci: yon < 0 ? -4 : 184, elBoy: EB, basparmak: yon < 0 ? -0.8 : 0.8, kisalma: 0.72, taraf: yon < 0 ? 'sol' : 'sag', tohum });
  };
  const KOLB = {
    kavus: (o, r, h) => yatik(o, r, h, 1, 52) + yatik(o, r, h, -1, 51),
    cene: (o, r, h) => {
      const { ceneY } = h.olcu();
      const hedef = [204, ceneY - 8];
      const bilek = bilekBul({ el: 'cene', hedef, elAci: -112, elBoy: EB, basparmak: -1, ad: 'cene' });
      return yatik(o, r, h, -1, 51) + kolSVG({ ...r, omuz: o.sag, dirsek: [o.sag[0] + 8, pervazB(h) - 2], bilek, el: 'cene', elAci: -112, elBoy: EB, basparmak: -1, taraf: 'sag', tohum: 53 });
    },
    // u 0: el çenede (yumruk), 1: açık el yanakta, parmaklar şakağa doğru
    yanak: (u) => (o, r, h) => {
      const { ceneY, hw, cy } = h.olcu();
      if (u < 0.5) {
        const hedef = [214, ceneY - 2];
        const bilek = bilekBul({ el: 'cene', hedef, elAci: -100, elBoy: EB, basparmak: -1, ad: 'cene' });
        return yatik(o, r, h, -1, 51) + kolSVG({ ...r, omuz: o.sag, dirsek: [o.sag[0] + 16, pervazB(h) - 2], bilek, el: 'cene', elAci: -100, elBoy: EB, basparmak: -1, taraf: 'sag', tohum: 53 });
      }
      const aci = -102, hedef = [200 + hw * 1.0, cy + 70];
      const bilek = bilekBul({ el: 'acik', hedef, elAci: aci, elBoy: EB, basparmak: -1, ad: 'avuc' });
      return yatik(o, r, h, -1, 51) + kolSVG({ ...r, omuz: o.sag, dirsek: [o.sag[0] + 26, pervazB(h) - 2], bilek, el: 'acik', yuz: 'sirt', elAci: aci, elBoy: EB, basparmak: -1, taraf: 'sag', tohum: 54 });
    },
  };
  const pozB = (n, o) => tl.call(() => DB.poz(o), null, k(adim(n)));
  // #11 (k1262): kapıdan çıkar (göz noktası çevresinde büyür: kameraya yürür; kollar pervazın arkasında), güneşte gözlerini
  // kısar; pervaza varınca kollarını taşa koyar, gözlerini kapayıp gülümser (güneşin tadını çıkarır)
  tl.call(() => DB.poz({ p: Dhazir, kollar: null, kolArkada: true, ifade: 'kisik', bakis: [0, -1] }), null, k(1262));
  gsap.set([DB.g, DB.kg], { svgOrigin: `${f1(gozB[0])} ${f1(gozB[1])}` });
  tl.fromTo(DB.g, { scale: B.varis }, { scale: 1, duration: k(24), ease: 'power1.inOut', immediateRender: false }, k(1262));
  for (let i = 0; i < 5; i++) tl.set(DB.g, { y: i % 2 ? 0 : -8 }, k(1262 + i * 5));
  tl.set(DB.g, { y: 0 }, k(1286));
  pozB(1286, { kollar: KOLB.kavus, kolArkada: false });
  pozB(1291, { ifade: 'mutlu', bakis: [0, 0] });
  // #12: gözünü açar, bakışı yatay sola, sehpadaki çiçeklere (aynı hiza); beğeni; topak düşünce kaşı iner
  pozB(1306, { ifade: 'kirp' });
  pozB(1311, { ifade: 'notr', bakis: [-3.8, 0.2] });
  pozB(1316, { ifade: 'kisik', bakis: [-3.8, 0.3] });
  pozB(1361, { ifade: 'kirp' });
  pozB(1366, { ifade: 'kisik', bakis: [-3.8, 0.3] });
  pozB(1376, { ifade: 'merak', bakis: [-3.8, 1.2] });
  pozB(1388, { ifade: 'sikkin', bakis: [-3.8, 1.8] });
  pozB(1401, { ifade: 'ozlem', bakis: [-3.8, 0.6] });
  // #13: çene elde, balona bakar; tasarımlar biçimlendikçe merak → beğeni; sonra düş söner, el yanağa, sıkılır
  pozB(1412, { kollar: KOLB.cene, ifade: 'ozlem', bakis: [-3.6, -2.6] });
  pozB(1436, { ifade: 'merak' });
  pozB(1496, { ifade: 'kisik' });
  pozB(1511, { ifade: 'merak' });
  pozB(1531, { ifade: 'kisik' });
  pozB(1546, { ifade: 'merak' });
  pozB(1563, { ifade: 'kisik' });
  pozB(1568, { ifade: 'ozlem', bakis: [-3.2, -1] });
  pozB(1573, { kollar: KOLB.yanak(0) });
  pozB(1578, { kollar: KOLB.yanak(1), ifade: 'sikkin', bakis: [-2.4, 0.6] });
  pozB(1621, { ifade: 'kirp' });
  pozB(1626, { ifade: 'sikkin', bakis: [-3, 1] });
  pozB(1656, { bakis: [-1.6, 1.4] });
  isaret(1262, 'kesme');
  // Yaslanma: el yanağa gelince figür dirsek çevresinde 12 fps adımla eli tarafına yatar
  {
    const { o } = DB.olcu(), dir = DB.dunya([o.sag[0] + 26, pervazB(DB)]);
    tl.set([DB.g, DB.kg], { svgOrigin: `${f1(dir[0])} ${f1(dir[1])}` }, k(1570));
    tl.to([DB.g, DB.kg], { rotation: 3.2, duration: k(10), ease: 'steps(2)' }, k(1578));
  }

  // ============================================================================ #13 DÜŞÜNCE: tutamaçlarla giydirme
  // Çene elde, kesmesiz: kamera balon planına çekilir, balon açılır (bulut ~1438'de oturur). İçinde klişe saksı (kırık
  // ağız, ağız bandı) ve aynı gül, lale. Profilde vurgu renkli Bézier tutamaçları (v5-saksi.js'ten uyarlandı: yarıçap
  // r(u), dört biçim aynı nokta sayısında, enterpolasyonla akar). D'nin düşteki eli (kol.js 'isaret') buluttan girer, işaret
  // parmağıyla bir çapayı tutup çeker; saksı biçimlenir, her tasarım oturunca "tık":
  //   1) bel çapası içe → ince bel (belinde kemer)   2) taban çapası içe → çay bardağı (tabaklı)
  //   3) ağız çapası yukarı → uzun ince (ince dikey çizgiler)
  // Her çekişin en hızlı karesinde 1 k hayalet kontur (leke). Biçimlendirme YALNIZ balonda; sehpadaki saksılar aynen kalır.
  const BL = B.balon;
  const bal = ctx.balon(balonG, { c: BL.c, r: BL.r, noktalar: BL.n, tohum: 37, koken: BL.koken });
  bal.ac(1414);
  isaret(1414, 'dusunce');
  const FK = B.fikir, PS = FK.s, LW = 1 / PS;
  const TAU = Math.PI * 2, KU = 0.24, KA = 0.3, NU = 25;
  const bell = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
  const yumus = (a, b, u) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
  const US = Array.from({ length: NU }, (_, i) => i / (NU - 1));
  const BICIM = [
    { h: 196, r: (u) => 60 + 20 * u + 10 * yumus(0.8, 0.87, u) },                                                 // klişe: konik + ağız bandı
    { h: 236, r: (u) => 86 - 52 * bell(u, 0.52, 0.2) + 8 * yumus(0.8, 1, u) },                                     // ince bel
    { h: 220, r: (u) => 46 + 32 * bell(u, 0.24, 0.2) - 14 * bell(u, 0.64, 0.12) + 42 * yumus(0.66, 1, u) ** 1.6 }, // çay bardağı
    { h: 330, r: (u) => 42 + 6 * u + 14 * yumus(0.84, 1, u) ** 2 },                                                // uzun ince
  ].map((b) => ({ h: b.h, r: US.map(b.r) }));
  const bicim = (sv) => {
    const i = Math.min(BICIM.length - 2, Math.max(0, Math.floor(sv))), t = Math.min(1, Math.max(0, sv - i));
    const A0 = BICIM[i], A1 = BICIM[i + 1];
    return { h: A0.h + (A1.h - A0.h) * t, r: A0.r.map((v, j) => v + (A1.r[j] - v) * t) };
  };
  const rAt = (b, u) => { const j = Math.min(NU - 1.0001, Math.max(0, u * (NU - 1))), i = Math.floor(j), t = j - i; return b.r[i] + (b.r[i + 1] - b.r[i]) * t; };
  const Kat = (u) => KA + (KU - KA) * u; // yükseklikteki elips basıklığı (tabanda KA, ağızda KU)
  const yuzey = (b, u, th) => { const r = rAt(b, u); return [r * Math.cos(th), -b.h * u + Kat(u) * r * Math.sin(th)]; };
  function siluet(b) {
    const p = [];
    for (let j = 0; j < NU; j++) p.push([b.r[j], -b.h * US[j]]);
    const q = b.r[NU - 1];
    for (let i = 1; i < 16; i++) { const th = -Math.PI * i / 16; p.push([q * Math.cos(th), -b.h + KU * q * Math.sin(th)]); }
    for (let j = NU - 1; j >= 0; j--) p.push([-b.r[j], -b.h * US[j]]);
    for (let i = 1; i < 12; i++) { const th = Math.PI - Math.PI * i / 12; p.push([b.r[0] * Math.cos(th), KA * b.r[0] * Math.sin(th)]); }
    return p;
  }
  const elipsP = (cx, cy, rx, ry, n = 48) => Array.from({ length: n }, (_, i) => { const th = TAU * i / n; return [cx + rx * Math.cos(th), cy + ry * Math.sin(th)]; });
  const onYay = (b, u, n = 12) => Array.from({ length: n + 1 }, (_, i) => yuzey(b, u, Math.PI * i / n));

  const fikirG = el(bal.ic, 'g');
  gizle(fikirG, 1424);
  const sG = el(fikirG, 'g', { transform: `translate(${FK.o[0]} ${FK.o[1]}) scale(${PS})` });
  const govdeKap = el(sG, 'g'); // "tık" ölçeği (taban çevresinde)
  const C3 = (ust, pts, o = {}) => cizgi(ust, pts, { genlik: 0.7, ...o, kalinlik: (o.kalinlik ?? 5) * LW });
  // Renkler: balondaki klişe saksı gerçeği gibi pişmiş toprak; her yeni tasarım kendi açık tonuna akar (ince bel şeftali,
  // çay bardağı nane, uzun ince lila). Ağız (iç arka kenar) gövdenin koyusu; kemer, toka ve tabak tasarımın parçası.
  const BICIM_RENK = [
    [TERRA, TERRA_K],
    [URUN_RENK.seftali, URUN_RENK.seftaliKoyu],
    [URUN_RENK.nane, koyult(URUN_RENK.nane, 0.12)],
    [URUN_RENK.lila, koyult(URUN_RENK.lila, 0.12)],
  ];
  const bicimRenk = (sv, j) => {
    const i = Math.min(BICIM_RENK.length - 2, Math.max(0, Math.floor(sv))), t = Math.min(1, Math.max(0, sv - i));
    return renkKaris(BICIM_RENK[i][j], BICIM_RENK[i + 1][j], t);
  };
  const tabakH = [C3(govdeKap, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: koyult(URUN_RENK.nane, 0.2), kalinlik: 4.2, tohum: 1401 }), C3(govdeKap, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: koyult(URUN_RENK.nane, 0.06), kalinlik: 4.2, tohum: 1402 })];
  const govdeDolgu = C3(govdeKap, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: TERRA, kalinlik: 0, tohum: 1403 });
  const silYol = el(el(defsB, 'clipPath', { id: 's3-sil' }), 'path');
  const desenG = el(govdeKap, 'g', { 'clip-path': 'url(#s3-sil)' });
  const kemerH = C3(desenG, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: URUN_RENK.mercanKoyu, kalinlik: 3.4, tohum: 1404 });
  const tokaH = C3(desenG, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: URUN_RENK.limon, kalinlik: 3, tohum: 1405 });
  const cizgiH = [62, 80, 98, 116].map((d, i) => C3(desenG, [[0, 0], [0, 1]], { kalinlik: 2.8, tohum: 1406 + i }));
  const bantH = C3(desenG, [[0, 0], [0, 1]], { kalinlik: 3.4, tohum: 1410 });
  const agizH = C3(govdeKap, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: TERRA_K, kalinlik: 4.5, tohum: 1411 });
  const icH = C3(govdeKap, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: TOPRAK, kalinlik: 2.8, tohum: 1412 });
  const govdeKontur = C3(govdeKap, [[0, 0], [1, 0], [0, 1]], { kapali: true, kalinlik: 5.5, tohum: 1403 });
  const kirikG = el(govdeKap, 'g');
  const centikH = C3(kirikG, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: '#6f695f', kalinlik: 3, tohum: 1413 });
  const catlakH = C3(kirikG, [[0, 0], [0, 1]], { kalinlik: 2.8, tohum: 1414 });
  // Çiçekler: cizimKur 'saksi' çiziminin gül ve lale konturları (saksı konturları atılır); kökleri ağız merkezinde.
  // Düşteki çiçekler çok hafif renk alır: lale (üç uçlu kâse) limon, gül (sarmal) arkasında mercan bir leke
  const FB = 230;
  const cicekB = el(govdeKap, 'g');
  const fl = cizimKur(ctx, cicekB, 'saksi', { c: [0, -0.06 * FB], boy: FB, kalinlik: 5 * LW, tohum: 940 });
  fl[0].g.remove(); fl[1].g.remove();
  fl[3].dolgu?.setAttribute('fill', URUN_RENK.limon);
  {
    // gülün sarmalı açık uçlu (dolgusuz kontur): arkasına konturu olmayan mercan elips (sarmal noktalarının ortası)
    const gp = CIZIMLER.saksi[5].p.map(([x, y]) => [x * FB, -0.06 * FB + y * FB]);
    const xs = gp.map((p) => p[0]), ys = gp.map((p) => p[1]);
    const gx = (Math.min(...xs) + Math.max(...xs)) / 2, gy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const leke = C3(cicekB, elipsP(gx, gy, (Math.max(...xs) - gx) * 0.92, (Math.max(...ys) - gy) * 0.96, 18), { kapali: true, dolgu: URUN_RENK.mercan, kalinlik: 0, tohum: 945, kay: [2, 2] });
    cicekB.insertBefore(leke.g, fl[5].g);
  }
  const cicekCiz = fl.slice(2);
  // Tutamaçlar (vurgu): eksen + üç çapa (taban, bel, ağız) ve kolları; tutulan çapada halka
  const HB = LW * 0.9;
  const tutG = el(sG, 'g');
  const eksen = el(tutG, 'path', { stroke: VURGU, 'stroke-width': 2.5 * LW, 'stroke-dasharray': `${10 * LW} ${9 * LW}`, fill: 'none', opacity: 0 });
  const CAPA = [0, 12, 24];
  const tut = CAPA.map((j, n) => {
    const dis = el(tutG, 'g'), icT = el(dis, 'g');
    const kollar = (n === 1 ? [1, -1] : [n === 0 ? 1 : -1]).map((yon) => ({
      yon, c: el(icT, 'line', { x1: 0, y1: 0, stroke: VURGU, 'stroke-width': 3 * HB, 'stroke-linecap': 'round' }),
      d: el(icT, 'circle', { r: 7.5 * HB, fill: BALON, stroke: VURGU, 'stroke-width': 3 * HB }),
    }));
    el(icT, 'rect', { x: -8 * HB, y: -8 * HB, width: 16 * HB, height: 16 * HB, fill: VURGU, stroke: M, 'stroke-width': 2 * HB });
    return { j, dis, icT, kollar, st: { s: 0 } };
  });
  const halka = el(tutG, 'circle', { r: 22 * HB, fill: 'none', stroke: VURGU, 'stroke-width': 3.5 * HB });
  const halkaSt = { s: 0, i: 1 }, eksenSt = { a: 0 };
  const hayalet = el(sG, 'path', { fill: 'none', stroke: M, 'stroke-width': 4 * LW, 'stroke-linejoin': 'round', opacity: 0 });
  // "Tık" ışıltısı: tasarım oturunca ağzın sağ üstünde üç kısa çizgi
  const patlama = BICIM.map((b, d) => {
    const g = el(sG, 'g'), q = b.r[NU - 1], px = q + 18, py = -b.h - 14;
    for (let i = 0; i < 3; i++) {
      const a = (-80 + i * 40) * Math.PI / 180;
      C3(g, [[px + Math.cos(a) * 18, py + Math.sin(a) * 18], [px + Math.cos(a) * 40, py + Math.sin(a) * 40]], { kalinlik: 4, tohum: 1420 + d * 3 + i });
    }
    gsap.set(g, { svgOrigin: `${f1(px)} ${f1(py)}` });
    return g;
  });

  // Düşteki el: balonun içinde kalır (bulut biçimiyle kırpılır), buluttan girer; parmak ucu çapaya kilitlenir
  const HS = 1.25, EL_ACI = -172;
  el(el(defsB, 'clipPath', { id: 's3-bulut' }), 'path', { d: bal.yolu(), transform: `translate(${BL.c[0]} ${BL.c[1]}) scale(0.975) translate(${-BL.c[0]} ${-BL.c[1]})` });
  const elKlip = el(bal.ic, 'g', { 'clip-path': 'url(#s3-bulut)' });
  const elG = el(elKlip, 'g', { transform: `translate(${FK.o[0]} ${FK.o[1]}) scale(${PS * HS})` });
  const DIN = [320, 140];                    // dinlenme (saksı biriminde; bulutun dışında, kırpılır)
  const EL = { a: 0, j0: 12, j1: 12, b: 1 }; // a: dinlenme → çapa; j0 → j1 arası b ile kayar
  let elKay = 0;
  const Sx = { s: 0, tik: 1 };
  const capa = (b, j) => [b.r[j], -b.h * US[j]];
  function elCiz() {
    const b = bicim(Sx.s), A0 = capa(b, EL.j0), A1 = capa(b, EL.j1);
    const Aj = [A0[0] + (A1[0] - A0[0]) * EL.b, A0[1] + (A1[1] - A0[1]) * EL.b];
    const uc = [(DIN[0] + (Aj[0] - DIN[0]) * EL.a) / HS, (DIN[1] + (Aj[1] - DIN[1]) * EL.a) / HS];
    const bilek = bilekBul({ el: 'isaret', hedef: uc, elAci: EL_ACI, elBoy: EB, basparmak: 1, ad: 'uc' });
    const r1 = 8 * Math.PI / 180, r2 = 28 * Math.PI / 180;
    const dirsek = [bilek[0] + Math.cos(r1) * 150, bilek[1] + Math.sin(r1) * 150], omuz = [dirsek[0] + Math.cos(r2) * 160, dirsek[1] + Math.sin(r2) * 160];
    elG.innerHTML = kolSVG({ omuz, dirsek, bilek, el: 'isaret', elAci: EL_ACI, elBoy: EB, basparmak: 1, taraf: 'sag', giysi: MONO.giysi[5], ten: MONO.ten[Dhazir.ten], kalinlik: 64, kaynama: elKay, tohum: 1440, manset: 'gomlek' });
  }
  ctx.kaynayanlar.add((i) => { elKay = i; if (EL.a > 0.001) elCiz(); });

  function tutUygula(b) {
    for (const t of tut) {
      const j = t.j, x = b.r[j], y = -b.h * US[j];
      const j0 = Math.max(0, j - 1), j1 = Math.min(NU - 1, j + 1);
      let tx = b.r[j1] - b.r[j0], ty = -b.h * (US[j1] - US[j0]);
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      t.dis.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`);
      t.icT.setAttribute('transform', `scale(${f3(t.st.s)})`);
      t.icT.style.opacity = t.st.s > 0.01 ? 1 : 0;
      for (const kk of t.kollar) {
        const ex = tx * 56 * HB * kk.yon, ey = ty * 56 * HB * kk.yon;
        kk.c.setAttribute('x2', f1(ex)); kk.c.setAttribute('y2', f1(ey));
        kk.d.setAttribute('cx', f1(ex)); kk.d.setAttribute('cy', f1(ey));
      }
    }
    eksen.setAttribute('d', `M0 ${f1(30 * LW)} L0 ${f1(-b.h - 40 * LW)}`);
    eksen.setAttribute('opacity', f3(eksenSt.a * 0.7));
    const a = tut[halkaSt.i];
    halka.setAttribute('transform', `translate(${f1(b.r[a.j])} ${f1(-b.h * US[a.j])}) scale(${f3(halkaSt.s)})`);
    halka.style.opacity = halkaSt.s > 0.01 ? 1 : 0;
  }
  const kir = (v) => Math.min(1, Math.max(0, v));
  function uygula() {
    const b = bicim(Sx.s), q = b.r[NU - 1], r0 = b.r[0];
    const sil = siluet(b);
    govdeDolgu.pts = sil; govdeDolgu.ciz();
    govdeDolgu.dolgu.setAttribute('fill', bicimRenk(Sx.s, 0));
    agizH.dolgu.setAttribute('fill', bicimRenk(Sx.s, 1));
    govdeKontur.pts = sil; govdeKontur.ciz();
    silYol.setAttribute('d', ctx.yol(sil, true, SIFIR));
    agizH.pts = elipsP(0, -b.h, q, KU * q); agizH.ciz();
    icH.pts = elipsP(0, -b.h + 2, q * 0.86, KU * q * 0.8, 36); icH.ciz();
    // 0 klişe: ağız bandının alt çizgisi, kırık çentik ve çatlak
    const a0 = kir(1 - Sx.s * 2.2);
    bantH.g.style.opacity = f3(a0); kirikG.style.opacity = f3(a0);
    if (a0 > 0) {
      bantH.pts = onYay(b, 0.82); bantH.ciz();
      const p1 = yuzey(b, 1, 0.62), p2 = yuzey(b, 1, 1.02), pm = yuzey(b, 0.9, 0.82);
      centikH.pts = [p1, p2, [pm[0], pm[1] + 4]]; centikH.ciz();
      catlakH.pts = [[pm[0], pm[1] + 4], [pm[0] - 8, pm[1] + 26], [pm[0] + 4, pm[1] + 48], [pm[0] - 6, pm[1] + 72], [pm[0], pm[1] + 92]]; catlakH.ciz();
    }
    // 1 ince bel: belde kemer (iki ön yay arası) ve küçük toka
    const a1 = kir(1 - Math.abs(Sx.s - 1) * 2.2);
    kemerH.g.style.opacity = f3(a1); tokaH.g.style.opacity = f3(a1);
    if (a1 > 0) {
      kemerH.pts = [...onYay(b, 0.47), ...onYay(b, 0.57).reverse()]; kemerH.ciz();
      const m = yuzey(b, 0.52, Math.PI / 2);
      tokaH.pts = [[m[0] - 9, m[1] - 9], [m[0] + 9, m[1] - 9], [m[0] + 9, m[1] + 9], [m[0] - 9, m[1] + 9]]; tokaH.ciz();
    }
    // 2 çay bardağı: altında çay tabağı (önce kalın kenar, sonra üst yüz)
    const a2 = kir(1 - Math.abs(Sx.s - 2) * 2.2);
    tabakH.forEach((h) => { h.g.style.opacity = f3(a2); });
    if (a2 > 0) {
      const tr = r0 * 1.9, ty = KA * tr * 0.55;
      tabakH[0].pts = [...Array.from({ length: 13 }, (_, i) => [tr * Math.cos(Math.PI * i / 12), 6 + ty * Math.sin(Math.PI * i / 12)]), ...Array.from({ length: 13 }, (_, i) => [tr * 0.96 * Math.cos(Math.PI - Math.PI * i / 12), 18 + ty * Math.sin(Math.PI - Math.PI * i / 12)])];
      tabakH[0].ciz();
      tabakH[1].pts = elipsP(0, 6, tr, ty, 40); tabakH[1].ciz();
    }
    // 3 uzun ince: ön yüzde ince dikey çizgiler
    const a3 = kir((Sx.s - 2) * 2.2);
    cizgiH.forEach((h, i) => {
      h.g.style.opacity = f3(a3);
      if (a3 <= 0) return;
      const th = [62, 80, 98, 116][i] * Math.PI / 180;
      h.pts = Array.from({ length: 8 }, (_, m) => yuzey(b, 0.06 + 0.84 * m / 7, th)); h.ciz();
    });
    cicekB.setAttribute('transform', `translate(0 ${f1(-b.h)})`);
    govdeKap.setAttribute('transform', `scale(${f3(Sx.tik)})`);
    tutUygula(b);
    if (EL.a > 0.001) elCiz(); else elG.innerHTML = '';
  }
  uygula();
  const leke = (kare, sv) => {
    tl.set(hayalet, { attr: { d: ctx.yol(siluet(bicim(sv)), true, SIFIR) }, opacity: 0.35 }, k(kare));
    tl.set(hayalet, { opacity: 0 }, k(kare + 1));
  };
  const tik = (k0, d) => {
    tl.to(Sx, { tik: 1.04, duration: k(6), ease: E.BO, onUpdate: uygula }, k(k0));
    tl.to(Sx, { tik: 1, duration: k(8), ease: E.EO, onUpdate: uygula }, k(k0 + 6));
    gizle(patlama[d], k0, k0 + 10);
    tl.fromTo(patlama[d], { scale: 0.5 }, { scale: 1.15, duration: k(10), ease: E.EO, immediateRender: false }, k(k0));
    isaret(k0, 'tik', { not: 'giyinir' });
  };
  // Çizim: klişe saksı ve çiçekler bulut büyürken konturdan çizilir; dolgular yumuşakça gelir
  [govdeKontur, agizH, icH, bantH, ...cicekCiz].forEach((h, i) => {
    tl.fromTo(h.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(14), ease: E.EO, immediateRender: false }, k(1424 + Math.min(i, 6) * 2));
    tl.set(h.yol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(1424 + Math.min(i, 6) * 2 + 15));
  });
  gsap.set([govdeDolgu.g, agizH.dolgu, icH.dolgu, kirikG], { opacity: 0 });
  tl.fromTo([govdeDolgu.g, agizH.dolgu, icH.dolgu], { opacity: 0 }, { opacity: 1, duration: k(10), ease: 'none', immediateRender: false }, k(1432));
  tl.fromTo(kirikG, { opacity: 0 }, { opacity: 1, duration: k(6), ease: 'none', immediateRender: false }, k(1440));
  // Tutamaçlar belirir (4 k arayla BO); el buluttan girer, bel çapasını tutar
  tl.to(eksenSt, { a: 1, duration: k(8), ease: 'none', onUpdate: uygula }, k(1450));
  tut.forEach((t, i) => tl.to(t.st, { s: 1, duration: k(8), ease: E.BO, onUpdate: uygula }, k(1452 + i * 4)));
  tl.to(EL, { a: 1, duration: k(12), ease: E.EO, onUpdate: uygula }, k(1458));
  // 1) bel içe → ince bel
  tl.call(() => { halkaSt.i = 1; uygula(); }, null, k(1469));
  tl.to(halkaSt, { s: 1, duration: k(6), ease: E.BO, onUpdate: uygula }, k(1470));
  tl.to(Sx, { s: 1, duration: k(22), ease: E.KM, onUpdate: uygula }, k(1472));
  leke(1483, 0.45);
  tik(1494, 1);
  tl.to(halkaSt, { s: 0, duration: k(6), ease: E.EI, onUpdate: uygula }, k(1494));
  // 2) el tabana kayar, taban çapası içe → çay bardağı
  tl.set(EL, { j0: 12, j1: 0, b: 0 }, k(1497));
  tl.to(EL, { b: 1, duration: k(9), ease: E.KM, onUpdate: uygula }, k(1497));
  tl.call(() => { halkaSt.i = 0; uygula(); }, null, k(1505));
  tl.to(halkaSt, { s: 1, duration: k(6), ease: E.BO, onUpdate: uygula }, k(1506));
  tl.to(Sx, { s: 2, duration: k(22), ease: E.KM, onUpdate: uygula }, k(1508));
  leke(1519, 1.45);
  tik(1530, 2);
  tl.to(halkaSt, { s: 0, duration: k(6), ease: E.EI, onUpdate: uygula }, k(1530));
  // 3) el ağza kayar, ağız çapası yukarı → uzun ince
  tl.set(EL, { j0: 0, j1: 24, b: 0 }, k(1532));
  tl.to(EL, { b: 1, duration: k(8), ease: E.KM, onUpdate: uygula }, k(1532));
  tl.call(() => { halkaSt.i = 2; uygula(); }, null, k(1537));
  tl.to(halkaSt, { s: 1, duration: k(6), ease: E.BO, onUpdate: uygula }, k(1538));
  tl.to(Sx, { s: 3, duration: k(22), ease: E.KM, onUpdate: uygula }, k(1540));
  leke(1551, 2.45);
  tik(1562, 3);
  tl.to(halkaSt, { s: 0, duration: k(6), ease: E.EI, onUpdate: uygula }, k(1562));
  // El çekilir, tutamaçlar söner; düş kapanır
  tl.to(EL, { a: 0, duration: k(12), ease: E.EI, onUpdate: uygula }, k(1564));
  tl.to(eksenSt, { a: 0, duration: k(12), ease: E.EI, onUpdate: uygula }, k(1566));
  tut.forEach((t, i) => tl.to(t.st, { s: 0, duration: k(10), ease: E.EI, onUpdate: uygula }, k(1566 + i * 2)));
  bal.kapat(1570);

  // El yazısı (balonun içinde, solda; saksı sağda biçimlenir)
  const YZ = FK.yazi;
  const not = ctx.elYazisi(LB.div, ctx.metin('Keşke bunlara da<br><b>güzel kıyafetler</b><br>giydirebilsem…', 'If only I could<br><b>dress them up</b>…'), { x: YZ.x, y: YZ.y, boyut: YZ.boyut, aci: -2 });
  ctx.yazElYazisi(not, 1438, 24);
  ctx.silElYazisi(not, 1552);

  // Konuşma balonları: "Çiçeklerim çok güzel…" (çiçeklere bakarken) ve kapanışta "Keşke böyle bir aracım olsaydı…"
  const K1 = B.konus1, K2 = B.konus2;
  const kb1 = ctx.konus(LB, ctx.metin('Çiçeklerim çok güzel…', 'My flowers are so pretty…'), { x: K1.x, y: K1.y, boyut: K1.boyut, kuyruk: K1.kuyruk, tohum: 1451, aci: -2 });
  kb1.ac(1314, 18);
  kb1.kapat(1410);
  isaret(1318, 'konusma', { not: 'çiçeklerim' });
  const kb2 = ctx.konus(LB, ctx.metin('Keşke böyle bir aracım olsaydı…', 'If only I had a tool like that…'), { x: K2.x, y: K2.y, boyut: K2.boyut, kuyruk: K2.kuyruk, tohum: 1461, aci: -2 });
  kb2.ac(1584, 22);
  isaret(1588, 'konusma', { not: 'keşke bir aracım' });
  isaret(1578, 'vurgu', { not: 'sıkılır' });

  // ============================================================================ KAMERA (balkon)
  const KM = B.kam;
  // #11: varış planı (kapı, D, sehpa), hafif itiş; #12: iki kişilik plan (yüz sağda, saksılar solda aynı hizada),
  // saksılara doğru yavaş itiş; #13: kesmesiz geri çekilir (balon planı), doğrusal hafif itiş; düş sönerken D, saksılar ve
  // son söze yaklaşır (boş duvar kalmasın), sona dek doğrusal
  ctx.kameraKoy(1262, kam(KM.varis));
  tl.fromTo(ctx.kamera, kam(KM.varis), { ...kam([KM.varis[0], KM.varis[1], KM.varis[2] * 1.025]), duration: k(32), ease: 'none', immediateRender: false }, k(1262));
  ctx.kameraGit(1294, 40, kam(KM.iki));
  tl.to(ctx.kamera, { ...kam(KM.itis), duration: k(1408 - 1334), ease: 'none' }, k(1334));
  ctx.kameraGit(1408, 36, kam(KM.balon));
  tl.to(ctx.kamera, { ...kam([KM.balon[0], KM.balon[1], KM.balon[2] * 1.015]), duration: k(1574 - 1444), ease: 'none' }, k(1444));
  ctx.kameraGit(1574, 44, kam(KM.son));
  tl.to(ctx.kamera, { ...kam([KM.son[0], KM.son[1], KM.son[2] * 1.025]), duration: k(SON - 1618), ease: 'none' }, k(1618));
}
