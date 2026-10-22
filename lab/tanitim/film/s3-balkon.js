// Sahne 3, BALKON ve SAKSI (D, #10–#13, k1056–1535). Kalıp v1-kanca.js ile aynı: kur(ctx), MUTLAK kare zamanları.
// #10 k1056–1199 Sabah, ayna: aynadaki yansıma (kemerli çerçeve, cam tonu, parıltı) kadrajı taşır. D'nin ceketi omuzlarına
//     atılmış (gömlek kolları önde, ceketin uçlarını tutar), ceketi omuza çeker, kollar yenlere girer (omuz silkme, tık),
//     yakalarını düzeltir; sağ eli kulağa gider (kol.js 'isaret'), küpe takılır (tık + üç kısa ışıltı); sol eli şakaktan
//     saçına girer, saçı omzun arkasına atar (dirsek omuz altında: kol kalkınca yen kanadı açılmasın); aynaya gülümser,
//     başıyla onaylar. Son karelerde bakışı sağa, pencere ışığına kayar (sonraki çekimde uzağa bakışla eşleşir).
//     Pozlar 12 fps; kamera 60 fps doğrusal %4 itiş.
// #11 k1200–1295 Kesme: balkon dışarıdan (taş pervaz + vazo biçimli korkuluk babaları: "balkon" ilk bakışta okunur).
//     D açık balkon kapısında, dirsekleri taşta, kolları pervazda kavuşuk (öne yaslanmış); önce sağa, uzağa dalar (özlem),
//     sonra bakışı soldaki çiçeklere iner (gözler kısılır, yumuşak gülümseme): bir gül, bir lale, bir lale goncası.
//     Çiçekler esintiyle salınır. Kamera ikisini birlikte tutarak yaklaşır (KM); balonsuz mırıltı "Çok güzeller…".
// #12 k1296–1391 Kamera aşağı iner: klişe toprak saksılar (konik gövde + kalın ağız bandı). Sahnedeki TEK tonlu öğe
//     (soluk pişmiş toprak #c4977a); gülün saksısının ağzı kırık (çentik + çatlak), toprak pervaza dökülmüş, bir topak düşer
//     (tık). Üç saksı hep kadrajda (D kadraj dışında kalır). k1362 kesme: D'nin yüzü, gözü saksılarda, kaşı iner (sıkkın).
// #13 k1392–1535 Kesme: geniş plan; D çenesini eline dayar (dirsek pervazda), bakışı balona. Düşünce balonu çiçeklerin
//     üstünde hemen açılır: içinde aynı gül ve lale, saksı önce klişe (kırık ağız); sonra "kıyafet giyer": yeni tasarım
//     yukarıdan aşağı giydirilir (etek çizgisi iner, saksı yerine oturur): yivli → faset (alçak çokgen) → cizimKur 'saksi'
//     (burgu çizgili, ayaklı: en şıkı en sonda, ~40 kare asılı kalır). El yazısı (balonun içinde, üstte): "Keşke bunlara da
//     şık kıyafetler giydirebilsem…", dilek sözü vurgu alt çizgili. D'nin yüzü dilekte kalır (özlem); balonda renk yok,
//     gerçeğe dönülmez; k1536'da kesme (sonraki sahne).
// Kollar kol.js ile (govdeKes + kolSVG; D uzun boylu: omuz ve gövde kesimi 8 birim aşağı). Kişinin gövdesi ve kolları iki
// ayrı svg'de çizilebilir: balkonda gövde pervazın arkasında, kollar pervazın önünde (ön kollar taşın üstünde).
// Bakış: insan.js göz bebeğini bakis × (3, 2) birim kaydırır (göz akı yok); okunsun diye bakis değerleri 3–4 kat verilir.
import { kisiSVG, yol, rng, MONO, GOZ_Y, BOY } from '../insan.js';
import { kolSVG, omuzlar, bilekBul, govdeKes } from '../kol.js';
import { cizimKur, CIZIMLER } from './cizimler.js';

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, odak, vurus, isaret, W, H, PALET, GRI, GRI2, BALON, VURGU } = ctx;
  const yer = ctx.yer, adim = ctx.adim, oval = ctx.oval, M = PALET.murekkep;
  const SIFIR = { sap: () => 0 };
  const f1 = (v) => (+v).toFixed(1);
  const BAS = 1056, SON = 1535;
  vurus(10, 'Ayna: ceket, küpe, saç', 1056, 1199);
  vurus(11, 'Pencere: gül ve lale', 1200, 1295);
  vurus(12, 'Klişe saksılar, kaş iner', 1296, 1391);
  vurus(13, 'Balon: saksı şık giyinir', 1392, SON);

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
    const kg = el(kolUst || g, 'g');
    const sK = svgYap(kg);
    const h = { g, kg, p: p0, ifade: 'notr', bakis: [0, 0], kollar: null, ek: null, i: 0, olcek, x0, y0 };
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
      sG.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: i, ifade: h.ifade, bakis: h.bakis, mono: true })}</g>` + G.kontur + (h.ek ? h.ek(h, i) : '');
      sK.innerHTML = kol;
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
      const kutu = [[-0.07, -0.36], [0.95, -0.36], [0.95, 0.36], [-0.07, 0.36]].map(T).map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L');
      return `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M${kutu}Z"/></clipPath></defs><g clip-path="url(#${id})">${s}</g>`;
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

  // ============================================================================ #11–#13 BALKON (dışarıdan)
  const LB = ctx.katman('s3-balkon', 10);
  gsap.set(LB.div, { autoAlpha: 0 });
  tl.set(LB.div, { autoAlpha: 0 }, 0);
  tl.set(LB.div, { autoAlpha: 1 }, k(1200));
  tl.set(LB.div, { autoAlpha: 0 }, k(SON + 1));
  // Yerleşim: saksılar arasında boşluk (ağızlar teğet olmasın); D, saksı planlarında kadraja girmesin diye sağda.
  // Dikeyde sahne aşağıda (balon için üstte yer, korkuluk kadrajın altını doldurur). Balon: ctx.balon tümsekleri elipsin
  // ~100 px dışına taşar; elips kadraj kenarından en az ~110 px içeride, içerik (yazı + fikir) elipsin içinde kalır
  const B = yer({
    kisi: { x: 1420, alt: 750, olcek: 1.6 }, dirsekX: 40,
    kapi: { x0: 1120, x1: 1730, ust: -520, alt: 712 }, pervaz: { ust: 712, on: 742, alt: 794, x0: -320, x1: 2240 },
    taban: 736, korkuluk: { taban: 1180, ara: 150, en: 64 },
    saksi: [
      { x: 480, h: 150, wA: 150, wT: 100, kH: 32, kirik: true },
      { x: 670, h: 122, wA: 124, wT: 84, kH: 27 },
      { x: 798, h: 100, wA: 104, wT: 70, kH: 23 },
    ],
    cicek: { gul: 112, lale: 122, gonca: 92 }, // sap boyları (saksı ağzından)
    mirilti: { x: 500, y: 330, boyut: 60, aci: -4 },
    balon: { c: [636, 44], r: [480, 276], koken: '86% 92%', n: [[1296, 218, 11], [1236, 248, 16], [1164, 278, 23]] },
    not: { x: 356, y: -192, boyut: 58 }, fikir: { c: [648, 125], boy: 350 },
    kam: { genis: [960, 540, 1], cicek: [960, 490, 1.3], saksi: [628, 596, 2.05], kirik: [530, 650, 2.3], yuz: [1400, 330, 2.2], balon: [930, 232, 0.92] },
  }, {
    kisi: { x: 790, alt: 1400, olcek: 1.6 }, dirsekX: 22,
    kapi: { x0: 500, x1: 1090, ust: -300, alt: 1362 }, pervaz: { ust: 1362, on: 1396, alt: 1456, x0: -400, x1: 1480 },
    taban: 1388, korkuluk: { taban: 1820, ara: 150, en: 60 },
    saksi: [
      { x: 112, h: 152, wA: 150, wT: 100, kH: 32, kirik: true },
      { x: 272, h: 122, wA: 124, wT: 84, kH: 27 },
      { x: 394, h: 100, wA: 100, wT: 68, kH: 22 },
    ],
    cicek: { gul: 116, lale: 126, gonca: 92 },
    mirilti: { x: 56, y: 884, boyut: 64, aci: -4 },
    balon: { c: [540, 430], r: [420, 300], koken: '70% 96%', n: [[712, 808, 11], [672, 774, 16], [628, 738, 22]] },
    not: { x: 262, y: 168, boyut: 60 }, fikir: { c: [540, 520], boy: 360 },
    kam: { genis: [540, 1000, 1], cicek: [480, 1110, 1.2], saksi: [238, 1290, 2.2], kirik: [236, 1312, 2.3], yuz: [790, 970, 1.9], balon: [540, 960, 1] },
  });
  const P = B.pervaz, KP = B.kapi;
  // Açık balkon kapısı: kasa, iç (açık gri), tül perde
  cizgi(LB.svg, duz([[KP.x0 - 30, KP.alt], [KP.x0 - 30, KP.ust], [KP.x1 + 30, KP.ust], [KP.x1 + 30, KP.alt]]), { kapali: true, dolgu: '#d8d2c7', kalinlik: 5.5, tohum: 780 });
  cizgi(LB.svg, duz([[KP.x0, KP.alt], [KP.x0, KP.ust + 30], [KP.x1, KP.ust + 30], [KP.x1, KP.alt]]), { kapali: true, dolgu: '#e6e1d8', kalinlik: 5, tohum: 781 });
  {
    const g = el(LB.svg, 'g');
    const sag = [];
    for (let y = KP.alt, i = 0; y > KP.ust + 30; y -= 60, i++) sag.push([KP.x0 + 150 + (i % 2 ? 18 : -6), y]);
    cizgi(g, [[KP.x0 + 2, KP.ust + 34], [KP.x0 + 2, KP.alt], ...sag], { kapali: true, dolgu: '#f6f3ee', kalinlik: 3.4, renk: '#a59e91', tohum: 782, kay: [0, 0] });
    for (const fx of [46, 96]) cizgi(g, [[KP.x0 + fx, KP.ust + 40], [KP.x0 + fx + 6, (KP.ust + KP.alt) / 2], [KP.x0 + fx - 4, KP.alt]], { kalinlik: 2.6, renk: '#c2bcb1', tohum: 783 + fx });
  }
  // Gövde katmanı (pervazın arkasında), pervaz, kollar (pervazın önünde), saksılar, balon
  const govdeG = el(LB.svg, 'g');
  const pervazG = el(LB.svg, 'g');
  const kolG = el(LB.svg, 'g');
  const saksiG = el(LB.svg, 'g');
  const balonG = el(LB.svg, 'g');
  const DB = figur(govdeG, Dhazir, { ...B.kisi, id: 's3-db', kolUst: kolG });

  // Taş pervaz: üst yüz (açık), ön yüz, saçak gölgesi, parapet duvarı; derzler ve keski izleri
  // Korkuluk: arkası gölgede (D'nin alt gövdesi görünmez), vazo biçimli taş babalar, altta taban kirişi
  const KB = B.korkuluk;
  el(pervazG, 'path', { d: ctx.yol([[P.x0, P.alt], [P.x1, P.alt], [P.x1, KB.taban], [P.x0, KB.taban]], true, SIFIR), fill: '#bdb6a9' });
  {
    const hB = KB.taban - P.alt, bw = KB.en;
    const prof = [[0.5, 0], [0.5, 0.06], [0.3, 0.1], [0.24, 0.2], [0.34, 0.42], [0.46, 0.62], [0.4, 0.78], [0.26, 0.86], [0.42, 0.92], [0.5, 0.94], [0.5, 1]];
    let j = 0;
    for (let bx = P.x0 + KB.ara / 2; bx < P.x1; bx += KB.ara, j++) {
      const sag = prof.map(([u, v]) => [bx + u * bw, P.alt + v * hB]), sol = prof.map(([u, v]) => [bx - u * bw, P.alt + v * hB]).reverse();
      cizgi(pervazG, [...sag, ...sol], { kapali: true, dolgu: TAS.ust, kalinlik: 3.6, tohum: 796 + j, genlik: 0.8 });
    }
    cizgi(pervazG, duz([[P.x0, KB.taban], [P.x1, KB.taban], [P.x1, KB.taban + 60], [P.x0, KB.taban + 60]], true, 60), { kapali: true, dolgu: TAS.on, kalinlik: 5, tohum: 795 });
    cizgi(pervazG, duz([[P.x0, KB.taban + 60], [P.x1, KB.taban + 60], [P.x1, KB.taban + 600], [P.x0, KB.taban + 600]], true, 80), { kapali: true, dolgu: '#e2ddd3', kalinlik: 5, tohum: 789 });
  }
  el(pervazG, 'path', { d: ctx.yol([[P.x0, P.alt], [P.x1, P.alt], [P.x1, P.alt + 16], [P.x0, P.alt + 16]], true, SIFIR), fill: '#6f695f', opacity: 0.35 });
  cizgi(pervazG, duz([[P.x0, P.on], [P.x1, P.on], [P.x1, P.alt], [P.x0, P.alt]], true, 60), { kapali: true, dolgu: TAS.on, kalinlik: 5.5, tohum: 791 });
  cizgi(pervazG, duz([[P.x0 + 16, P.ust], [P.x1 - 16, P.ust], [P.x1, P.on], [P.x0, P.on]], true, 60), { kapali: true, dolgu: TAS.ust, kalinlik: 5.5, tohum: 792 });
  {
    const R1 = rng(793);
    for (let x = P.x0 + 220; x < P.x1; x += 470) cizgi(pervazG, [[x, P.on + 4], [x + 2, P.alt - 4]], { kalinlik: 3.4, tohum: 794 + x });
    for (let i = 0; i < 26; i++) {
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

  // Saksılar ve çiçekleri: çiçek saksının ağzından çıkar (saksının çiziminden sonra)
  const sk = B.saksi.map((s, i) => saksiKur(saksiG, s, 820 + i * 10));
  const cicekG = el(LB.svg, 'g');
  saksiG.parentNode.insertBefore(cicekG, saksiG.nextSibling);
  const cicekler = [
    gulKur(cicekG, sk[0].x + 4, sk[0].agizY + 4, B.cicek.gul, 860),
    laleKur(cicekG, sk[1].x - 2, sk[1].agizY + 3, B.cicek.lale, 880, { egim: -8 }),
    laleKur(cicekG, sk[2].x + 2, sk[2].agizY + 3, B.cicek.gonca, 890, { gonca: true, egim: 10 }),
  ];
  // Esinti: her çiçek sap dibinden ±1,4° salınır (60 fps, farklı evre)
  cicekler.forEach((c, i) => {
    gsap.set(c.g, { svgOrigin: `${c.kok[0]} ${c.kok[1]}` });
    tl.fromTo(c.g, { rotation: -1.4 + i * 0.6 }, { rotation: 1.4 - i * 0.4, duration: k(70 + i * 14), ease: 'sine.inOut', yoyo: true, repeat: 5, immediateRender: false }, k(1200 + i * 9));
  });
  // Dökülen toprak (gül saksısının dibinde, pervazda) ve kırık parçaları
  const dokuntu = el(saksiG, 'g');
  {
    const s0 = B.saksi[0], tb = B.taban, R2 = rng(901), sx = s0.x + s0.wT / 2 + 6;
    cizgi(dokuntu, [[sx - 6, tb + 1], [sx + 14, tb - 12], [sx + 40, tb - 9], [sx + 62, tb + 1]], { kapali: true, dolgu: TOPRAK, kalinlik: 3.4, tohum: 902 });
    for (let i = 0; i < 11; i++) {
      const cx = sx + 70 + R2() * 90 - (i % 3) * 30, cy = tb - 2 + R2() * 4, r = 3 + R2() * 4;
      cizgi(dokuntu, oval(cx, cy, r, r * 0.8, 0, 360, 7), { kapali: true, dolgu: i % 2 ? TOPRAK : TOPRAK_A, kalinlik: 2.4, tohum: 903 + i, kay: [1, 1] });
    }
    for (let i = 0; i < 2; i++) {
      const cx = s0.x - s0.wT / 2 - yer(18, 10) - i * yer(28, 24), cy = tb - 3;
      cizgi(dokuntu, [[cx - 12, cy + 4], [cx + 2, cy - 9], [cx + 14, cy + 3]], { kapali: true, dolgu: TERRA, kalinlik: 3, tohum: 920 + i, kay: [1, 1] });
    }
    // lale saksısının ağzından taşan toprak
    const s1 = sk[1];
    cizgi(dokuntu, [[s1.x - 30, s1.agizY + s1.ry * 0.7], [s1.x - 20, s1.agizY + s1.ry + 14], [s1.x - 6, s1.agizY + s1.ry + 6], [s1.x + 6, s1.agizY + s1.ry * 0.9]], { kapali: true, dolgu: TOPRAK, kalinlik: 3, tohum: 925, kay: [1, 1] });
  }
  // Düşen topak (#12, k1340): kırık çentikten pervaza düşer, sekip durur (30 fps)
  const topak = el(saksiG, 'g');
  {
    const s0 = sk[0], cx = s0.x + B.saksi[0].wA * 0.3, cy = s0.agizY + s0.ry + 8;
    cizgi(topak, oval(cx, cy, 10, 8, 0, 360, 8), { kapali: true, dolgu: TOPRAK, kalinlik: 3, tohum: 930, kay: [1, 1] });
    gizle(topak, 1340);
    const dy = B.taban - cy - 7, dx = B.saksi[0].wA * 0.42;
    tl.fromTo(topak, { x: 0, y: 0 }, { keyframes: { x: [0, dx * 0.5, dx], y: [0, -6, dy] }, duration: k(14), ease: adimli('power2.in', 14, 2), immediateRender: false }, k(1340));
    tl.to(topak, { keyframes: { x: [dx, dx + 10, dx + 16], y: [dy, dy - 8, dy] }, duration: k(10), ease: adimli('none', 10, 2) }, k(1354));
    isaret(1354, 'tik', { not: 'toprak' });
  }

  // ---------- D (balkon) kol pozları: dirsekler gövdeden dışarıda taşın üstünde, ön kollar pervazda yatay, eller ortada
  // üst üste (öne yaslanmış; üst kol kısalır). Çene pozunda sağ ön kol dirsekten çeneye kalkar, sol kol pervazda kalır
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
  };
  const pozB = (n, o) => tl.call(() => DB.poz(o), null, k(adim(n)));
  tl.call(() => DB.poz({ p: Dhazir, kollar: KOLB.kavus, ifade: 'ozlem', bakis: [3.6, -2.6] }), null, k(1200));
  // #11: uzağa (sağa, yukarı) dalmış; göz kırpar, bakışı soldaki çiçeklere iner, gözleri kısılır (beğeni)
  pozB(1210, { ifade: 'kirp' });
  pozB(1215, { ifade: 'ozlem', bakis: [3.8, -2] });
  pozB(1221, { ifade: 'notr', bakis: [-3.8, 3.2] });
  pozB(1231, { ifade: 'merak' });
  pozB(1251, { ifade: 'kisik' });
  pozB(1271, { ifade: 'merak' });
  pozB(1286, { ifade: 'ozlem' });
  // #12: yüz yakın plan (k1362 kesme): gözü saksılarda, kaş iner
  pozB(1362, { ifade: 'ozlem', bakis: [-3.8, 3.2] });
  pozB(1372, { ifade: 'sikkin' });
  // #13: çene elde, balona (sola, yukarı) bakar; tasarımlar değiştikçe merak → beğeni, sonda dilekte kalır (özlem)
  pozB(1392, { kollar: KOLB.cene, ifade: 'sikkin', bakis: [-3.6, -2.6] });
  pozB(1406, { ifade: 'ozlem' });
  pozB(1431, { ifade: 'merak' });
  pozB(1461, { ifade: 'kisik' });
  pozB(1491, { ifade: 'merak' });
  pozB(1501, { ifade: 'ozlem' });
  pozB(1516, { ifade: 'kirp' });
  pozB(1521, { ifade: 'ozlem' });
  isaret(1200, 'kesme');

  // ---------- Mırıltı (balonsuz, yumuşak el yazısı): bakış çiçeklere inince başlar, kamera aşağı inerken söner
  const mir = ctx.elYazisi(LB.div, ctx.metin('Çok güzeller…', 'So pretty…'), B.mirilti);
  ctx.yazElYazisi(mir, 1226, 16);
  isaret(1226, 'konusma', { not: 'mırıltı' });
  ctx.silElYazisi(mir, 1318);

  // ============================================================================ #13 BALON: saksı şık giyinir
  // k1392 kesme (geniş plan), balon hemen açılır: bulut ~1418'de oturur. İçerik 1404'te çizilmeye başlar, el yazısı
  // bulut oturunca yazılır (1414–1436, ekranda ~120 kare). Giydirme 1426 / 1452 / 1478; son tasarım ~1490'dan k1535'e asılı.
  const BL = B.balon;
  const bal = ctx.balon(balonG, { c: BL.c, r: BL.r, noktalar: BL.n, tohum: 37, koken: BL.koken });
  bal.ac(1394);
  isaret(1394, 'dusunce');
  const F = B.fikir, fb = F.boy, fc = F.c;
  const U = ([u, v]) => [fc[0] + u * fb, fc[1] + v * fb];
  const icG = el(bal.ic, 'g');
  gizle(icG, 1404);
  // Çiçekler: cizimKur 'saksi' çiziminin gül ve lale konturları (finalde aynı çizim tamamlanır); saksı konturları ayrı
  const ham = el(icG, 'g');
  const fikir = cizimKur(ctx, ham, 'saksi', { c: fc, boy: fb, kalinlik: 5, tohum: 940, dolgu: GRI });
  const cicekB = el(icG, 'g'), giysiG = el(icG, 'g');
  fikir.slice(2).forEach((h) => cicekB.appendChild(h.g));
  const finalKontur = fikir.slice(0, 2);
  // Tasarımlar (birim kutu, cizimler.js ile aynı: ağız y 0,06, taban ~0,48)
  const yarim = (fx, v0, v1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const v = v0 + (v1 - v0) * i / n; return [fx(v), v]; });
  const simetrik = (fx, v0, v1, ustKenar, n = 8) => {
    const sag = yarim(fx, v0, v1, n), sol = sag.map(([x, v]) => [-x, v]).reverse();
    return [...ustKenar, ...sag.slice(1), ...sol.slice(0, -1)];
  };
  const TASARIM = [];
  // 0 klişe (kırık ağız, gerçek saksının aynısı, mono)
  TASARIM.push([
    { p: [[-0.235, 0.14], [0.235, 0.14], [0.17, 0.48], [-0.17, 0.48]], kapali: true, d: GRI2, duz: true },
    { p: [[-0.27, 0.04], [0.06, 0.04], [0.1, 0.085], [0.14, 0.04], [0.27, 0.04], [0.26, 0.14], [-0.26, 0.14]], kapali: true, d: GRI2, duz: true },
    { p: [[0.1, 0.09], [0.08, 0.18], [0.11, 0.26], [0.09, 0.32]] },
  ]);
  // 1 yivli: göbekli gövde, tırtıklı ağız, beş yiv, ayak bandı
  {
    const fx = (v) => 0.25 + 0.04 * Math.sin(Math.PI * (v - 0.06) / 0.38) - 0.08 * Math.max(0, (v - 0.3) / 0.14) ** 1.5;
    const tirtik = Array.from({ length: 13 }, (_, i) => { const u = -0.25 + 0.5 * i / 12; return [u, 0.06 - (i % 2 ? 0.025 : 0)]; });
    const ana = simetrik(fx, 0.06, 0.44, tirtik, 10);
    const yiv = [-0.62, -0.3, 0, 0.3, 0.62].map((f) => ({ p: yarim((v) => f * fx(v) * 0.92, 0.09, 0.43, 6) }));
    TASARIM.push([{ p: ana, kapali: true, d: GRI }, ...yiv, { p: [[-0.17, 0.44], [0.17, 0.44], [0.19, 0.49], [-0.19, 0.49]], kapali: true, d: GRI2, duz: true }]);
  }
  // 2 faset (alçak çokgen): omuzlu altıgen profil, iki sıra üçgen yüz; sağdaki yüzler gölgede
  TASARIM.push([
    { p: [[-0.25, 0.05], [0.25, 0.05], [0.29, 0.21], [0.17, 0.48], [-0.17, 0.48], [-0.29, 0.21]], kapali: true, d: GRI, duz: true },
    { p: [[0.165, 0.21], [0.25, 0.05], [0.29, 0.21]], kapali: true, d: GRI2, duz: true, ince: true },
    { p: [[0.29, 0.21], [0.085, 0.48], [0.17, 0.48]], kapali: true, d: GRI2, duz: true, ince: true },
    { p: [[-0.165, 0.21], [-0.083, 0.05], [0, 0.21]], kapali: true, d: '#e2ddd3', duz: true, ince: true },
    { p: [[-0.25, 0.05], [-0.165, 0.21], [-0.083, 0.05], [0, 0.21], [0.083, 0.05], [0.165, 0.21], [0.25, 0.05]], duz: true },
    { p: [[-0.29, 0.21], [0.29, 0.21]], duz: true },
    { p: [[-0.29, 0.21], [-0.085, 0.48], [0, 0.21], [0.085, 0.48], [0.29, 0.21]], duz: true },
  ]);
  const tasG = TASARIM.map((tanim, ti) => {
    const kap = el(giysiG, 'g');
    const kr = el(el(el(LB.svg, 'defs'), 'clipPath', { id: `s3-giy${ti}` }), 'rect', { x: fc[0] - fb, y: fc[1] - fb, width: fb * 2, height: ti === 0 ? fb * 2 : 0 });
    kap.setAttribute('clip-path', `url(#s3-giy${ti})`);
    const hs = tanim.map((t, j) => {
      const pts = (t.duz ? duz(t.p, !!t.kapali, 0.05) : t.p).map(U);
      const h = cizgi(kap, pts, { kapali: !!t.kapali, dolgu: t.d || null, kalinlik: t.ince ? 0 : (t.kapali ? 5 : 3.4), tohum: 950 + ti * 20 + j, genlik: 0.9 });
      if (t.ince) h.yol.setAttribute('stroke-width', 0);
      return h;
    });
    return { kap, kr, hs };
  });
  // Son tasarım: cizimKur 'saksi' konturları (finalde logo inşasına giden ortak çizgiler) + bu sahneye özgü süs:
  // yuvarlak gövdeye sarılan burgu çizgileri (gövde konturuyla kırpılır) ve alçak ayak. En şık olan en sonda kalır
  {
    const ti = TASARIM.length;
    const kap = el(giysiG, 'g');
    const kr = el(el(el(LB.svg, 'defs'), 'clipPath', { id: `s3-giy${ti}` }), 'rect', { x: fc[0] - fb, y: fc[1] - fb, width: fb * 2, height: 0 });
    kap.setAttribute('clip-path', `url(#s3-giy${ti})`);
    const ayak = cizgi(kap, duz([[-0.13, 0.47], [0.13, 0.47], [0.17, 0.555], [-0.17, 0.555]], true, 0.05).map(U), { kapali: true, dolgu: GRI2, kalinlik: 4.5, tohum: 1010, genlik: 0.9 });
    finalKontur.forEach((h) => kap.appendChild(h.g));
    const govdeYol = ctx.yol(CIZIMLER.saksi[0].p.map(U), true, SIFIR);
    el(el(el(LB.svg, 'defs'), 'clipPath', { id: 's3-burgu' }), 'path', { d: govdeYol });
    const burguG = el(kap, 'g', { 'clip-path': 'url(#s3-burgu)' });
    const Rv = (v) => 0.25 - 0.06 * (v - 0.06) / 0.42 + 0.03 * Math.sin(Math.PI * (v - 0.06) / 0.42);
    const burgu = [];
    for (let j = 0; j < 7; j++) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const v = 0.04 + 0.48 * i / 12, t = -2.3 + j * 0.62 + (v - 0.04) * 3.6;
        if (Math.abs(t) < 1.45) pts.push(U([Rv(v) * Math.sin(t), v]));
      }
      if (pts.length > 2) burgu.push(cizgi(burguG, pts, { kalinlik: 3, tohum: 1020 + j, genlik: 0.8 }));
    }
    // gövde konturu burgu uçlarının üstünde kalsın: aynı noktalar ve tohumla (cizimKur 'saksi' ilk konturu) dolgusuz kopya
    const ust = cizgi(kap, CIZIMLER.saksi[0].p.map(U), { kapali: true, kalinlik: 5, tohum: 940, genlik: 1.0 });
    tasG.push({ kap, kr, hs: [ayak, ...finalKontur, ...burgu, ust] });
  }
  ham.remove();
  // Giydirme: yeni tasarım yukarıdan aşağı açılır, eskisi alttan kalır; sınırda etek çizgisi iner; sonra saksı yerine oturur
  const ustY = U([0, 0.0])[1], altY = U([0, 0.6])[1];
  const etek = cizgi(icG, [U([-0.3, 0]), U([0, 0.02]), U([0.3, 0])], { kalinlik: 4.5, tohum: 990 });
  gsap.set(etek.g, { autoAlpha: 0 });
  gsap.set(giysiG, { svgOrigin: `${f1(fc[0])} ${f1(U([0, 0.49])[1])}` });
  const giydir = (k0, a, b, sure = 12) => {
    const st = { t: 0 };
    const uyg = () => {
      const y = ustY + (altY - ustY) * st.t;
      tasG[b].kr.setAttribute('y', f1(fc[1] - fb)); tasG[b].kr.setAttribute('height', f1(y - (fc[1] - fb)));
      tasG[a].kr.setAttribute('y', f1(y)); tasG[a].kr.setAttribute('height', f1(fc[1] + fb - y));
      const w = 0.24 + 0.06 * Math.sin(st.t * Math.PI);
      etek.pts = [[fc[0] - w * fb, y - 3], [fc[0], y + 6], [fc[0] + w * fb, y - 3]]; etek.ciz();
    };
    tl.set(etek.g, { autoAlpha: 1 }, k(k0));
    tl.fromTo(st, { t: 0 }, { t: 1, duration: k(sure), ease: E.KM, onUpdate: uyg, immediateRender: false }, k(k0));
    tl.set(etek.g, { autoAlpha: 0 }, k(k0 + sure));
    tl.fromTo(giysiG, { scaleY: 0.93, scaleX: 1.04 }, { scaleY: 1, scaleX: 1, duration: k(14), ease: E.BO, immediateRender: false }, k(k0 + sure));
    isaret(k0 + sure, 'tik', { not: 'giyinir' });
  };
  // Çizim: klişe saksı ve çiçekler bulut büyürken konturdan çizilir
  const ciz0 = [...tasG[0].hs, ...fikir.slice(2)];
  ciz0.forEach((h, i) => {
    tl.fromTo(h.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, k(1404 + Math.min(i, 6) * 2));
    tl.set(h.yol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(1404 + Math.min(i, 6) * 2 + 13));
  });
  giydir(1426, 0, 1);
  giydir(1452, 1, 2);
  giydir(1478, 2, 3);
  isaret(1500, 'vurgu', { not: 'dilek asılı' });

  // El yazısı (balonun içinde üstte) ve dilek sözünün vurgu alt çizgisi
  const N = B.not, ACI = -2;
  const not = ctx.elYazisi(LB.div, ctx.metin('Keşke bunlara da<br><b>şık kıyafetler</b> giydirebilsem…', 'If only I could<br><b>dress them up</b> too…'), { x: N.x, y: N.y, boyut: N.boyut, aci: ACI });
  ctx.yazElYazisi(not, 1414, 24);
  const altCizgi = (p, b) => {
    const x = parseFloat(p.style.left), y = parseFloat(p.style.top), h = p.offsetHeight || N.boyut * 2;
    const x0 = b.offsetLeft, w = b.offsetWidth || 200, yy = b.offsetTop + b.offsetHeight + 2;
    const ham2 = [[x0 - 6, yy + 1], [x0 + w * 0.35, yy - 2], [x0 + w * 0.7, yy], [x0 + w + 8, yy - 3]];
    const a = ACI * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), oy = h / 2;
    return ham2.map(([px, py]) => [x + px * c - (py - oy) * s, y + oy + px * s + (py - oy) * c]);
  };
  const bEl = not.querySelector('b') || not;
  const alt = cizgi(balonG, altCizgi(not, bEl), { renk: VURGU, kalinlik: 5, tohum: 995 });
  gizle(alt.g, 1440);
  tl.call(() => { alt.pts = altCizgi(not, bEl); alt.ciz(); }, null, k(1439));
  tl.fromTo(alt.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, k(1440));

  // ============================================================================ KAMERA (#11–#13)
  const kam = ([cx, cy, s]) => odak(cx, cy, s);
  const KM = B.kam;
  // #11: genişten hafif itiş, k1226'dan D ile çiçekleri birlikte tutarak yaklaşır (KM)
  ctx.kameraKoy(1200, kam(KM.genis));
  tl.fromTo(ctx.kamera, kam(KM.genis), { ...kam([KM.genis[0], KM.genis[1], KM.genis[2] * 1.02]), duration: k(26), ease: 'none', immediateRender: false }, k(1200));
  ctx.kameraGit(1226, 60, kam(KM.cicek));
  tl.to(ctx.kamera, { ...kam([KM.cicek[0], KM.cicek[1], KM.cicek[2] * 1.015]), duration: k(10), ease: 'none' }, k(1286));
  // #12: aşağı iner (üç saksı kadrajda), kırık ağza doğru yavaş itiş; k1362 kesme: D'nin yüzü
  ctx.kameraGit(1296, 40, kam(KM.saksi));
  tl.to(ctx.kamera, { ...kam(KM.kirik), duration: k(1361 - 1336), ease: 'sine.inOut' }, k(1336));
  ctx.kameraKoy(1362, kam(KM.yuz));
  tl.fromTo(ctx.kamera, kam(KM.yuz), { ...kam([KM.yuz[0], KM.yuz[1], KM.yuz[2] * 1.03]), duration: k(30), ease: 'none', immediateRender: false }, k(1362));
  isaret(1362, 'kesme');
  isaret(1372, 'vurgu', { not: 'kaş iner' });
  // #13: kesme, geniş plan (balon, D, gerçek saksılar bir arada); sahne sonuna dek doğrusal hafif itiş
  ctx.kameraKoy(1392, kam(KM.balon));
  tl.fromTo(ctx.kamera, kam(KM.balon), { ...kam([KM.balon[0], KM.balon[1], KM.balon[2] * 1.02]), duration: k(SON - 1392), ease: 'none', immediateRender: false }, k(1392));
  isaret(1392, 'kesme');
}
