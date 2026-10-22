// Sahne 2, atölye ve organizer (v06, #6–#9, k576–1055). Kadro: B (kahraman), B2, B3, B4 (kadro.json; dört kasketli genç).
// SORUNDA BİTER: organizer yalnız düşüncede kalır, çekmeceye sığmaz; gerçek ürün, renkli nesne yok.
// #6 (k576–671) geniş plan: tezgâh (mengene, çekiç, anahtar), arkada raf, sağda çekmeceli dolap. Üç derinlik: B önde (en koyu),
//    B2 ortada (biraz küçük, %24 pus), B3/B4 arkada (küçük, kalın pus). Konuşan muhatabına eğilir (12 fps), konuşma çizgileri,
//    ağız. B2 B'ye bir şey ister; B taburesinden kalkar (k588–603), B2'ye eğilip "Geliyorum!" der (k600), bakış önce, gövde
//    sonra dolaba döner (k625–635), öne eğik yürür (k645).
// #7 (k672–767) kesmesiz devam: kamera sağa kayıp yaklaşarak B'yi izler (k648–728 KM, orta plan, sonra %1,2 itiş); B dolabın
//    yanında durur. Uzaktaki B2 kadraj dışından, arkadan seslenir (k692, iki satır sırayla yazılır; kuyruk kadraj dışına, B2'ye);
//    B seslenişe döner. Balon k768 kesmesinin üstünden ekran sabit kopyasıyla akar, k862'de kapanır (tam yazılı ~2 sn okunur).
// #8 (k768–911) kuş bakışı: ilk kare dolabın üstü (kupa, kalem, not defteri; yatayda solda tezgâh ve #6'nın çekici), kulp alt
//    üçte birde. B'nin sol eli (kol.js elUstten) alttan kulpa YAVAŞÇA uzanır (k768–806 KM), kavrar, çeker (k808–832 EO); kamera
//    çekmeceyle birlikte aşağı eğilir (k806–842). Çekmece durunca içerik 2–4 px öne kayar ('tik' k832). Vida, somun, pul dağınık
//    (tohumlu). El karıştırır (parmak uçlarının değdiği parçaları iter), uzun vidayı alır (k882), yüzüne kaldırır, 12 fps'te
//    çevirip bakar, bırakır: düşer ('tik' k906), el geri çekilir.
// #9 (k912–1055) B'nin yüzü ve açık çekmece (ön görünüş). Düşünce balonu (k914), içinde organizer
//    çizilir (cizimler.js 'organizer'), "Şuraya bir organizer tasarlasak…" (k926). Organizer balondan çekmeceye iner (k956–968),
//    basıklaşır, kalınlık kazanır; iç enden geniş: eğik iner, önce sol, sonra sağ duvara çarpar ('tik' k968, k971), seker,
//    oturamaz, kıpırdatılır (k996). Ölçü oku ve "?" vurgu renginde (k976–984, 'vurgu'); "Ama ölçüleri? Sığar mı?" (k962).
//    k1012 ikinci deneme, yine sığmaz ('tik' k1020). Sorun asılı kalır; k1056 kesme (s3-balkon).
// Katmanlar: 's2-atolye' (ön görünüş dünyası: #6, #7, #9), 's2-kus' (#8 kuş bakışı, k768'de kamera birim: ekran koordinatı),
// 's2-ses' (#yazi içinde, kameradan bağımsız: yalnız B2'nin balonunun #8'e taşan kopyası).
// Kare hızı: kamera, yazı, nesne konumu 60 fps; karakter pozu ve el pozu 12 fps (adim); kalkma/yürüme sekmesi 12 fps.
// Derinlik: figüranlar saydamlıkla değil kâğıt rengi pusla açılır (üst üste binenler birbirinin içinden görünmez).
// Not: cizimler.js 'organizer' 4 köşeli dikdörtgeni Catmull-Rom'da hapa dönüyor; burada kapalı konturlar sık noktalanır.
import { kisiSVG, boyKaymasi, YAPI, MONO, PALET, GOZ_Y, rng, yol, oval } from '../insan.js';
import { elUstten } from '../kol.js';
import { cizimKur, CIZIMLER } from './cizimler.js';

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, balon, elYazisi, yazElYazisi, odak, kameraGit, kameraKoy, konus,
    vurus, isaret, W, H, VURGU, metin, yer, adim } = ctx;
  const BAS = 576, SON = 1055;
  const MUR = PALET.murekkep, VURGU_YAZI = '#94400f';
  vurus(6, 'Atölye: "Geliyorum!"', 576, 671);
  vurus(7, 'B dolaba yürür, B2 seslenir', 672, 767);
  vurus(8, 'Kuş bakışı: çekmece, yanlış vida', 768, 911);
  vurus(9, 'Organizer sığmaz', 912, 1055);
  isaret(576, 'kesme');
  isaret(578, 'konusma', { ad: 'sohbet' });
  isaret(600, 'konusma', { ad: 'B: Geliyorum' });
  isaret(692, 'konusma', { ad: 'B2: M8 vida' });
  isaret(768, 'kesme');
  isaret(806, 'tik', { ad: 'kulp' });
  isaret(832, 'tik', { ad: 'çekmece durur' });
  isaret(906, 'tik', { ad: 'vida düşer' });
  isaret(912, 'kesme');
  isaret(914, 'dusunce');
  isaret(968, 'tik', { ad: 'organizer sol duvar' });
  isaret(971, 'tik', { ad: 'organizer sağ duvar' });
  isaret(1020, 'tik', { ad: 'organizer ikinci deneme' });
  isaret(984, 'vurgu', { ad: 'ölçü ?' });
  isaret(1032, 'sessizlik', { bitis: 1055, ad: 'sorun asılı' });

  // ---------- Yardımcılar
  const fn = (e) => (typeof e === 'function' ? e : gsap.parseEase(e));
  const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const EOf = fn(E.EO), KMf = fn(E.KM);
  const p2in = fn('power2.in');
  // Kapalı çokgeni eşit aralıklı noktalara böler (insan.js yol() Catmull-Rom: seyrek köşe merceğe döner)
  const yogun = (pts, aralik) => {
    const out = [];
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / aralik));
      for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
    });
    return out;
  };
  const dikdortgen = (x0, y0, x1, y1, rc = 0) => {
    const p = [];
    if (!rc) p.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
    else {
      const kose = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * Math.PI / 180; p.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a)]); } };
      kose(x1 - rc, y0 + rc, 270); kose(x1 - rc, y1 - rc, 0); kose(x0 + rc, y1 - rc, 90); kose(x0 + rc, y0 + rc, 180);
    }
    return yogun(p, sinir(Math.min(x1 - x0, y1 - y0) / 2.5, 4, 40));
  };
  // Kamera: ekran ↔ dünya; itiş: dünya noktası ekranda yerinde kalarak ölçek × oran
  const ekr = (kam, [wx, wy]) => [kam.x + wx * kam.scale, kam.y + wy * kam.scale];
  const cev = (kam, [sx, sy]) => [(sx - kam.x) / kam.scale, (sy - kam.y) / kam.scale];
  const cerceve = (x0, y0, gen) => { const s = W / gen; return { x: -x0 * s, y: -y0 * s, scale: s }; };
  const it = (kam, oran, m) => { const [sx, sy] = ekr(kam, m); return odak(m[0], m[1], kam.scale * oran, sx, sy); };
  // Kaynama indisi (çekirdek 8 fps döndürür); dizge çizimler (kişi + kol, kuş bakışı el) bununla yeniden çizilir
  let kay = 0;
  ctx.kaynayanlar.add((i) => { kay = i; });
  // Dizge çizimler için titreşim (insan.js kurgusu: sabit sapma + kaynama)
  const kalem = (tohum, i, genlik = 1) => {
    const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + i * 1013 + 1);
    const a = Array.from({ length: 96 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 96 }, () => (Rk() - 0.5) * 1.3);
    return { sap: (j, e) => (a[(j * 2 + e) % 96] + b[(j * 2 + e + 3) % 96]) * genlik };
  };

  // ---------- Katmanlar ve görünürlük (yalnız kendi pencerelerinde)
  const L = ctx.katman('s2-atolye', 10);
  const K = ctx.katman('s2-kus', 10);
  const S = (() => {
    const div = document.createElement('div');
    div.className = 'vk'; div.dataset.ad = 's2-ses';
    Object.assign(div.style, { width: W + 'px', height: H + 'px' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    div.appendChild(svg);
    ctx.yaziKatmani.appendChild(div);
    return { div, svg };
  })();
  const pencere = (div, araliklar) => {
    gsap.set(div, { autoAlpha: 0 });
    tl.set(div, { autoAlpha: 0 }, 0);
    for (const [a, b] of araliklar) { tl.set(div, { autoAlpha: 1 }, k(a)); tl.set(div, { autoAlpha: 0 }, k(b)); }
  };
  pencere(L.div, [[BAS, 768], [912, SON + 1]]);
  pencere(K.div, [[768, 912]]);
  pencere(S.div, [[768, 874]]);

  // =====================================================================================================
  // DÜNYA (ön görünüş). Yatay: dört kişi tezgâhın arkasında yan yana; dikey: arka sıra (B4, B3 küçük, açık) + ön sıra (B2, B),
  // tezgâh üstü derin (alet dolu ön plan). Dolap tezgâhın sağ ucunda; B oraya yürür.
  // =====================================================================================================
  // Üç derinlik: B (ön, en koyu), B2 (orta: biraz küçük, hafif pus), B3/B4 (arka: küçük, kalın pus)
  const Y = yer({
    kisi: {
      B4: { x: 300, hiza: 680, olcek: 0.8 },
      B3: { x: 790, hiza: 680, olcek: 0.8 },
      B2: { x: 520, hiza: 782, olcek: 0.93 },
      B: { x: 1070, hiza: 800, olcek: 1 },
    },
    arka: ['B4', 'B3'], on: ['B2', 'B'], pus: { x0: -300, x1: 1540, y1: 856 },
    bSon: 1270, otur: 92, b9dx: 0,
    tezgah: { x0: -120, x1: 1552, ust: 856, on: 984, alt: 1700 },
    mengene: [1070, 984], cekic: [600, 934], anahtar: [260, 944], aletOlcek: 1,
    raf: { y: 290, x0: 90, x1: 960 },
    saat: [1960, 285, 56],
    dolap: { x0: 1562, x1: 1852, ust: 590, alt: 1700, cek0: 606, cekH: 84, cekAra: 92, bizim: 2 },
    kam6: { x0: 0, y0: 196, gen: 1900 }, kam7: { x0: 1010, y0: 220, gen: 1097 },
    gel: { dx: 46, dy: -118, kuyruk: [50, -8], boyut: 48 },
    b2: { dx: 26, y: 250, boyut: 28 },
    k9: { s: 1.9, ekran: [560, 360] },
  }, {
    kisi: {
      B4: { x: 440, hiza: 960, olcek: 0.8 },
      B3: { x: 112, hiza: 960, olcek: 0.8 },
      B2: { x: 262, hiza: 1086, olcek: 0.93 },
      B: { x: 640, hiza: 1100, olcek: 1 },
    },
    arka: ['B4', 'B3'], on: ['B2', 'B'], pus: { x0: -300, x1: 1250, y1: 1156 },
    bSon: 1000, otur: 92, b9dx: 0,
    tezgah: { x0: -60, x1: 1250, ust: 1156, on: 1560, alt: 2400 },
    mengene: [230, 1560], cekic: [560, 1330], anahtar: [1072, 1300], aletOlcek: 1.3,
    raf: { y: 330, x0: 40, x1: 680 },
    saat: [1290, 760, 50],
    dolap: { x0: 1260, x1: 1500, ust: 870, alt: 2400, cek0: 888, cekH: 84, cekAra: 92, bizim: 2 },
    // #7 dikeyde gerçek orta plan: B büyük, dolap kadrajın içinde, tezgâh yalnız alt üçte bir
    kam6: { x0: 0, y0: 120, gen: 939 }, kam7: { x0: 800, y0: 392, gen: 617 },
    gel: { dx: -70, dy: -262, kuyruk: [40, -14], boyut: 44 },
    b2: { dx: 24, y: 440, boyut: 32 },
    k9: { s: 1.58, ekran: [176, 1180] },
  });

  const P = { B: ctx.kisiParam('B'), B2: ctx.kisiParam('B2'), B3: ctx.kisiParam('B3'), B4: ctx.kisiParam('B4') };
  // gOrta: #9'un düşünce dünyası (balon, organizer, ölçü oku) dolabın önünde, B'nin arkasında: omuz organizerin ucunu örter
  const gArka = el(L.svg, 'g'), gOrta = el(L.svg, 'g'), gKisi = el(L.svg, 'g'), gOn = el(L.svg, 'g');

  // ---------- Kişi: film.js kisi() gibi (kutu 400×440, hiza ile boy farkı); h.ic hareket grubu (kalkma, yürüme)
  function figur(ust, p, { x, hiza, olcek = 1 }) {
    const alt = hiza + boyKaymasi(p) * olcek;
    const g = el(ust, 'g');
    const ic = el(g, 'g');
    const s = el(ic, 'svg', { viewBox: '0 0 400 440', width: 400 * olcek, height: 440 * olcek, x: x - 200 * olcek, y: alt - 440 * olcek, overflow: 'visible' });
    const h = { g, ic, svg: s, p, ifade: 'notr', bakis: [0, 0], olcek, x, alt };
    h.ciz = (i = kay) => { s.innerHTML = kisiSVG(h.p, { kaynama: Math.max(0, i), ifade: h.ifade, bakis: h.bakis, mono: true }); };
    h.poz = ({ ifade, bakis } = {}) => { if (ifade) h.ifade = ifade; if (bakis) h.bakis = bakis; h.ciz(); };
    h.dunya = ([bx, by]) => [x - 200 * olcek + bx * olcek, alt - 440 * olcek + by * olcek];
    const Yp = YAPI[p.yapi] || YAPI.orta;
    h.agiz = (yon = 0) => h.dunya([200 + yon * p.yuzEn * Yp.yuz * 0.55, GOZ_Y + 4 + p.yuzBoy * 0.52]);
    h.goz = h.dunya([200, GOZ_Y]);
    h.ciz(0);
    ctx.kaynayanlar.add((i) => h.ciz(i));
    return h;
  }
  // Konuşma çizgileri: yanakta üç kısa çizgi (yelpaze), konuşma yönünde; 12 fps'te yanıp söner
  function konusmaCizgisi(h, yon, tohum) {
    const p = h.p, Yp = YAPI[p.yapi] || YAPI.orta, hw = p.yuzEn * Yp.yuz, o = h.olcek;
    const [mx, my] = h.dunya([200 + yon * (hw + 26), GOZ_Y + 4 + p.yuzBoy * 0.4]);
    const g = el(h.ic, 'g');
    [-40, 0, 40].forEach((a, i) => {
      const r = (a + (yon > 0 ? 0 : 180)) * Math.PI / 180, r0 = 15 * o, l = (i === 1 ? 22 : 17) * o;
      cizgi(g, [[mx + Math.cos(r) * r0, my + Math.sin(r) * r0], [mx + Math.cos(r) * (r0 + l), my + Math.sin(r) * (r0 + l)]], { kalinlik: 4.4 * o, tohum: tohum + i, genlik: 0.5 });
    });
    gsap.set(g, { autoAlpha: 0 });
    return g;
  }
  // Konuşma: k0..k1 arası 5 k'lık adımlarla çizgiler yanar/söner, ağız ifadeleri döner (12 fps)
  function konusur(h, cizg, k0, k1, { desen = [1, 1, 0, 1, 1, 0, 1, 0], ifadeler = ['merak', 'notr', 'mutlu', 'notr'], bakis = null, son = 'notr' } = {}) {
    let j = 0;
    for (let t = adim(k0); t < k1; t += 5, j++) {
      const on = desen[j % desen.length], ifade = on ? ifadeler[j % ifadeler.length] : 'notr';
      tl.set(cizg, { autoAlpha: on ? 1 : 0 }, k(t));
      tl.call(() => h.poz(bakis ? { ifade, bakis } : { ifade }), null, k(t));
    }
    tl.set(cizg, { autoAlpha: 0 }, k(adim(k1)));
    tl.call(() => h.poz({ ifade: son }), null, k(adim(k1)));
  }

  // ---------- Mekân: raf (arka, açık çizgi), dolap, tezgâh (kişilerin önünde), mengene, çekiç, anahtar
  const AR = '#8d867a';
  {
    const R = Y.raf;
    cizgi(gArka, dikdortgen(R.x0, R.y, R.x1, R.y + 14, 3), { kapali: true, dolgu: '#d8d2c7', renk: AR, kalinlik: 3, tohum: 101, kay: [2, 2] });
    for (const x of [R.x0 + 70, R.x1 - 70]) cizgi(gArka, [[x, R.y + 14], [x, R.y + 52], [x - 30, R.y + 14]], { renk: AR, kalinlik: 3, tohum: 102 + x % 7 });
    // markasız kutular ve bir kavanoz
    const kutular = [[R.x0 + 40, 96, 64], [R.x0 + 150, 70, 46], [R.x0 + 400, 120, 58], [R.x1 - 260, 84, 72], [R.x1 - 160, 60, 40]];
    kutular.forEach(([x, en, boy], i) => cizgi(gArka, dikdortgen(x, R.y - boy, x + en, R.y, 4), { kapali: true, dolgu: ['#e2ddd3', '#d8d2c7', '#e6e1d7', '#d8d2c7', '#e2ddd3'][i], renk: AR, kalinlik: 2.8, tohum: 110 + i, kay: [2, 2] }));
    const jx = R.x0 + 300;
    cizgi(gArka, dikdortgen(jx, R.y - 66, jx + 52, R.y, 10), { kapali: true, dolgu: '#ece8e0', renk: AR, kalinlik: 2.8, tohum: 118, kay: [2, 2] });
    cizgi(gArka, dikdortgen(jx - 3, R.y - 78, jx + 55, R.y - 64, 3), { kapali: true, dolgu: '#bdb6a9', renk: AR, kalinlik: 2.6, tohum: 119, kay: [1.5, 1.5] });
  }
  const DL = Y.dolap;
  const cekY = (i) => DL.cek0 + i * DL.cekAra;            // çekmece ön panelinin üst kenarı
  const px0 = DL.x0 + 12, px1 = DL.x1 - 12, pcx = (px0 + px1) / 2;
  const kulp = (y0) => [pcx - 76, y0 + 14, pcx + 76, y0 + 25];
  {
    cizgi(gArka, dikdortgen(DL.x0, DL.ust, DL.x1, DL.alt, 4), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, genlik: 0.6, tohum: 201 });
    cizgi(gArka, dikdortgen(DL.x0 - 10, DL.ust - 18, DL.x1 + 10, DL.ust + 2, 4), { kapali: true, dolgu: '#a59e91', kalinlik: 4, genlik: 0.6, tohum: 202 });
    for (let i = 0; cekY(i) + DL.cekH < DL.alt - 8; i++) {
      const y0 = cekY(i);
      cizgi(gArka, dikdortgen(px0, y0, px1, y0 + DL.cekH, 5), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.4, genlik: 0.5, tohum: 210 + i * 3 });
      const [a, b, c, d] = kulp(y0);
      cizgi(gArka, dikdortgen(a, b, c, d, 5), { kapali: true, dolgu: '#6f695f', kalinlik: 2.8, genlik: 0.4, tohum: 211 + i * 3, kay: [1.5, 1.5] });
    }
  }
  // Açık çekmece (#9, ön görünüş): ön panel kapalıyla aynı yerde, üstünde içi görünen ağız (yan duvarlar, arka duvar, taban)
  const DP = 74, TW = 13;                                  // ağzın görünen derinliği, duvar kalınlığı
  const cy0 = cekY(DL.bizim);
  const agiz = { x0: px0, x1: px1, ust: cy0 - DP, alt: cy0, ix0: px0 + TW, ix1: px1 - TW };
  const acikG = el(gArka, 'g');
  {
    cizgi(acikG, dikdortgen(agiz.x0, agiz.ust, agiz.x1, agiz.alt + 6), { kapali: true, dolgu: '#a59e91', kalinlik: 3.6, genlik: 0.5, tohum: 251 });
    cizgi(acikG, dikdortgen(agiz.ix0, agiz.ust + 9, agiz.ix1, agiz.alt + 6), { kapali: true, dolgu: '#ebe7df', kalinlik: 2.6, genlik: 0.5, tohum: 252, kay: [0, 0] });
    // dağınık içerik (kısaltılmış: önden-üstten bakış, y basık)
    const r = rng(2601);
    for (let i = 0; i < 16; i++) {
      const x = lerp(agiz.ix0 + 14, agiz.ix1 - 14, r()), y = lerp(agiz.ust + 22, agiz.alt - 6, r()), a = r() * 180, L0 = 14 + r() * 26;
      const g = el(acikG, 'g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1 0.55) rotate(${a.toFixed(0)})` });
      if (i % 4 === 3) cizgi(g, oval(0, 0, 7, 7, 0, 360, 6, 2), { kapali: true, dolgu: '#8d867a', kalinlik: 2, genlik: 0.3, tohum: 260 + i, kay: [1, 1] });
      else cizgi(g, [[-L0 / 2, -2.5], [L0 / 2, -2.5], [L0 / 2 + 3, 0], [L0 / 2, 2.5], [-L0 / 2, 2.5]], { kapali: true, dolgu: '#b0a99c', kalinlik: 2, genlik: 0.3, tohum: 260 + i, kay: [1, 1] });
    }
    // ön panel ve kulp (kapalı çekmecenin yerinde, öne çekilmiş)
    cizgi(acikG, dikdortgen(px0 - 4, cy0, px1 + 4, cy0 + DL.cekH + 4, 5), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.8, genlik: 0.5, tohum: 254 });
    const [a, b, c, d] = kulp(cy0);
    cizgi(acikG, dikdortgen(a, b, c, d, 5), { kapali: true, dolgu: '#6f695f', kalinlik: 3, genlik: 0.4, tohum: 255, kay: [1.5, 1.5] });
  }
  gsap.set(acikG, { autoAlpha: 0 });
  tl.set(acikG, { autoAlpha: 0 }, 0);
  tl.set(acikG, { autoAlpha: 1 }, k(912));

  // ---------- Kişiler (arkadan öne): arka sıra (B4, B3, küçük), pus (kâğıt rengi %46: derinlik, figüranlar açılır;
  // saydamlık yerine pus: üst üste binen kişiler birbirinin içinden görünmez), ön sıra (B2, B: kahraman en koyu)
  const F = {};
  for (const ad of Y.arka) F[ad] = figur(gKisi, P[ad], Y.kisi[ad]);
  const pus = el(gKisi, 'rect', { x: Y.pus.x0, y: -400, width: Y.pus.x1 - Y.pus.x0, height: Y.pus.y1 + 400, fill: ctx.KAGIT, opacity: 0.46 });
  // #9'da arka sıra kadraj dışında; pus kalırsa arkasındaki düşünce katmanını (gOrta) yarı yarıya soldurur
  tl.set(pus, { visibility: 'visible' }, k(BAS));           // autoAlpha değil: opaklığı (0,46) ezmesin
  tl.set(pus, { visibility: 'hidden' }, k(912));
  for (const ad of Y.on) F[ad] = figur(gKisi, P[ad], Y.kisi[ad]);
  const B = F.B, B2 = F.B2, B3 = F.B3, B4 = F.B4;
  // B2 orta derinlikte: renkleri %24 kâğıda çekilir (renk matrisi; saydamlık değil, arkadakiler içinden görünmez)
  {
    const a = 0.24, kg = [0xf1, 0xed, 0xe6].map((v) => (v / 255) * a), b = (1 - a).toFixed(3);
    const def = el(L.svg, 'defs');
    const f = el(def, 'filter', { id: 's2-pus-orta', 'color-interpolation-filters': 'sRGB', x: '-5%', y: '-5%', width: '110%', height: '110%' });
    el(f, 'feColorMatrix', { type: 'matrix', values: `${b} 0 0 0 ${kg[0].toFixed(4)} 0 ${b} 0 0 ${kg[1].toFixed(4)} 0 0 ${b} 0 ${kg[2].toFixed(4)} 0 0 0 1 0` });
    B2.g.setAttribute('filter', 'url(#s2-pus-orta)');
  }
  // Eğilme (yaslanma) kökü: bel hizası; kalkma/yürüme x-y'si de aynı grupta (h.ic)
  for (const h of [B, B2, B3, B4]) gsap.set(h.ic, { svgOrigin: `${h.x} ${h.alt - 40 * h.olcek}` });

  // ---------- Tezgâh (kişilerin önünde): üst yüzey (hafif yukarıdan) + ön yüz, mengene ve iki alet
  const aletG = el(gOn, 'g');
  {
    const T = Y.tezgah;
    cizgi(gOn, dikdortgen(T.x0, T.ust, T.x1, T.on, 0), { kapali: true, dolgu: '#e2ddd3', kalinlik: 4, genlik: 0.5, tohum: 301 });
    cizgi(gOn, dikdortgen(T.x0, T.on, T.x1, T.on + 30, 0), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, genlik: 0.5, tohum: 302 });
    cizgi(gOn, dikdortgen(T.x0 + 20, T.on + 30, T.x1 - 20, T.alt, 0), { kapali: true, dolgu: '#cfc9bd', kalinlik: 4, genlik: 0.5, tohum: 303 });
    // ön yüzde iki çekmece izi (sade)
    for (const [x0, x1] of [[T.x0 + 160, T.x0 + 560], [T.x1 - 700, T.x1 - 300]]) {
      cizgi(gOn, dikdortgen(x0, T.on + 64, x1, T.on + 150, 4), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3, genlik: 0.4, tohum: 304 + x0 % 5, kay: [1.5, 1.5] });
      cizgi(gOn, [[(x0 + x1) / 2 - 40, T.on + 92], [(x0 + x1) / 2 + 40, T.on + 92]], { kalinlik: 5, tohum: 306 + x0 % 3 });
    }
    // mengene (ön kenara bağlı): taban, gövde, iki çene, mil ve kol (#9 yakın planında gizli: kadraj altına yarım girmesin)
    gOn.appendChild(aletG); // tezgâh yüzeyinin üstünde dursun
    const [mx, my] = Y.mengene;
    const AO = Y.aletOlcek;
    const M = el(aletG, 'g', { transform: `translate(${mx} ${my}) scale(${AO}) translate(${-mx} ${-my})` });
    cizgi(M, dikdortgen(mx - 70, my - 16, mx + 54, my + 4, 4), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 311 });
    cizgi(M, dikdortgen(mx - 54, my - 66, mx + 28, my - 16, 6), { kapali: true, dolgu: '#a59e91', kalinlik: 3.6, tohum: 312 });
    cizgi(M, dikdortgen(mx - 66, my - 92, mx - 10, my - 64, 3), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 313 });
    cizgi(M, dikdortgen(mx - 4, my - 92, mx + 50, my - 64, 3), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 314 });
    cizgi(M, dikdortgen(mx + 28, my - 50, mx + 100, my - 40, 3), { kapali: true, dolgu: '#6f695f', kalinlik: 3, tohum: 315 });
    cizgi(M, [[mx + 100, my - 84], [mx + 100, my - 6]], { kalinlik: 6, tohum: 316 });
    for (const yy of [my - 88, my - 2]) cizgi(M, oval(mx + 100, yy, 7, 7, 0, 360, 8), { kapali: true, dolgu: '#6f695f', kalinlik: 2.8, tohum: 317, kay: [1, 1] });
    // çekiç (tezgâh üstünde yatık) ve açık ağızlı anahtar
    const [hx, hy] = Y.cekic;
    const C = el(aletG, 'g', { transform: `translate(${hx} ${hy}) rotate(-8) scale(${AO})` });
    cizgi(C, dikdortgen(-110, -7, 60, 7, 6), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.4, tohum: 321 });
    cizgi(C, dikdortgen(52, -26, 86, 26, 4), { kapali: true, dolgu: '#6f695f', kalinlik: 3.4, tohum: 322 });
    const [ax, ay] = Y.anahtar;
    const A = el(aletG, 'g', { transform: `translate(${ax} ${ay}) rotate(6) scale(${AO})` });
    cizgi(A, dikdortgen(-90, -7, 70, 7, 6), { kapali: true, dolgu: '#a59e91', kalinlik: 3.2, tohum: 323 });
    cizgi(A, [[70, -6], [74, -20], [96, -22], [104, -10], [88, -6], [88, 6], [104, 10], [96, 22], [74, 20], [70, 6]], { kapali: true, dolgu: '#a59e91', kalinlik: 3.2, tohum: 324 });
  }

  // ---------- Duvar saati (dolabın sağında/üstünde; #9 kadrajının dışında kalır)
  {
    const [sx, sy, sr] = Y.saat;
    cizgi(gArka, oval(sx, sy, sr, sr, 0, 360, 20, 2), { kapali: true, dolgu: '#ece8e0', renk: AR, kalinlik: 3.2, tohum: 131, kay: [2, 2] });
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r1 = sr * (i % 3 ? 0.82 : 0.74); cizgi(gArka, [[sx + Math.cos(a) * r1, sy + Math.sin(a) * r1], [sx + Math.cos(a) * sr * 0.9, sy + Math.sin(a) * sr * 0.9]], { renk: AR, kalinlik: 2.4, tohum: 140 + i, genlik: 0.3 }); }
    cizgi(gArka, [[sx, sy], [sx + sr * 0.18, sy - sr * 0.5]], { renk: MUR, kalinlik: 3.6, tohum: 153 });
    cizgi(gArka, [[sx, sy], [sx + sr * 0.6, sy + sr * 0.12]], { renk: MUR, kalinlik: 3, tohum: 154 });
  }

  // ---------- Kamera hedefleri (dünya)
  const K6 = cerceve(Y.kam6.x0, Y.kam6.y0, Y.kam6.gen);
  const K7 = cerceve(Y.kam7.x0, Y.kam7.y0, Y.kam7.gen);
  const dxYuru = Y.bSon - Y.kisi.B.x;
  const bGozSon = [B.goz[0] + dxYuru, B.goz[1]];
  const K7son = it(K7, 1.012, [bGozSon[0] + 160, bGozSon[1]]);   // k767'deki kamera (B2'nin balon kopyası bunu kullanır)
  const bGoz9 = [bGozSon[0] + Y.b9dx, bGozSon[1]];
  const K9 = odak(bGoz9[0], bGoz9[1], Y.k9.s, Y.k9.ekran[0], Y.k9.ekran[1]);

  // =====================================================================================================
  // #6 (k576–671): geniş; sohbet, B kalkar, "Geliyorum!", döner, yürümeye başlar
  // #7 (k672–767): kamera B'ye yaklaşarak izler (orta plan); B2 kadraj dışından seslenir (iki satır)
  // =====================================================================================================
  kameraKoy(BAS, K6);
  kameraGit(BAS, 72, it(K6, 1.016, [(B2.goz[0] + B.goz[0]) / 2, B.goz[1]]), 'none');
  kameraGit(648, 80, K7, E.KM);
  kameraGit(728, 39, K7son, 'none');

  const y43 = yer(1, -1);                                    // B4'ten B3'e yön (yatayda B3 sağda, dikeyde solda)
  // Başlangıç pozları (k576)
  const poz = (h, kare, o) => tl.call(() => h.poz(o), null, k(kare));
  poz(B, BAS, { ifade: 'notr', bakis: [-1, 0] });
  poz(B2, BAS, { ifade: 'notr', bakis: [1, 0] });
  poz(B3, BAS, { ifade: 'notr', bakis: [-y43, 0] });
  poz(B4, BAS, { ifade: 'notr', bakis: [y43, 0] });
  tl.set(B.ic, { x: 0, y: Y.otur, scaleX: 1 }, k(BAS));

  // Figüranların sohbeti (B4 ↔ B3) ve B2'nin isteği (B'ye)
  const c4 = konusmaCizgisi(B4, y43, 401), c3 = konusmaCizgisi(B3, -y43, 404), c2 = konusmaCizgisi(B2, 1, 407);
  konusur(B4, c4, BAS, 612, { bakis: [y43, 0] });
  konusur(B3, c3, 612, 652, { desen: [1, 0, 1, 1, 0, 1, 1, 0], bakis: [-y43, 0] });
  konusur(B4, c4, 652, 690, { desen: [1, 1, 0, 1, 0, 1, 1, 0], bakis: [y43, 0] });
  konusur(B3, c3, 690, 740, { desen: [1, 1, 0, 1, 1, 0], bakis: [-y43, 0] });
  konusur(B4, c4, 740, 768, { desen: [1, 0, 1, 1, 0, 1], bakis: [y43, 0] });
  konusur(B2, c2, BAS, 596, { desen: [1, 1, 0, 1], ifadeler: ['merak', 'notr', 'merak', 'mutlu'], bakis: [1, 0] });
  poz(B2, 600, { ifade: 'mutlu', bakis: [1, 0] });
  poz(B2, 620, { ifade: 'notr', bakis: [1, 0] });
  // Yaslanma (12 fps, 2 adım): konuşan muhatabına doğru eğilir, dinleyen hafif karşılık verir. Sıra dizilişini kırar.
  const egil = (h, kare, derece) => tl.to(h.ic, { rotation: derece, duration: k(10), ease: 'steps(2)' }, k(adim(kare)));
  tl.set([B.ic, B2.ic, B3.ic, B4.ic], { rotation: 0 }, k(BAS));
  egil(B4, BAS, 3.2 * y43); egil(B3, BAS, -1.2 * y43);
  egil(B4, 612, 1.4 * y43); egil(B3, 612, -3.4 * y43);
  egil(B4, 652, 3 * y43); egil(B3, 652, -1.4 * y43);
  egil(B4, 690, 1.2 * y43); egil(B3, 690, -3.2 * y43);
  egil(B4, 740, 2.8 * y43);
  egil(B2, BAS, 3.6); egil(B2, 600, 1.2); egil(B2, 700, 3);

  // B: dinler, kalkar (hazırlık 12 fps), "Geliyorum!"
  poz(B, 584, { ifade: 'merak', bakis: [-1, 0] });
  poz(B, 595, { ifade: 'mutlu', bakis: [-1, 0] });
  tl.set(B.ic, { y: Y.otur + 8 }, k(588));
  tl.set(B.ic, { y: Y.otur * 0.42 }, k(593));
  tl.set(B.ic, { y: -8 }, k(598));
  tl.set(B.ic, { y: 0 }, k(603));
  // Konuşma balonu B'nin dolap tarafında (gideceği yön); yürürken B'yle birlikte kayar
  const bAgiz = B.agiz(1);
  const gel = konus(L, metin('Geliyorum!', 'Coming!'), {
    x: bAgiz[0] + Y.gel.dx + 60, y: bAgiz[1] + Y.gel.dy, kuyruk: [bAgiz[0] + Y.gel.kuyruk[0], bAgiz[1] + Y.gel.kuyruk[1]], boyut: Y.gel.boyut, tohum: 61,
  });
  gel.p.style.paddingRight = '0.15em';
  gel.ac(600, 14);
  gel.kapat(684, 10);
  // Döner (yatay basılma + bakış dolaba), yürür: x 60 fps (kamera izler), sekme 12 fps
  // B "Geliyorum!" derken B2'ye doğru eğilir; dönerken bakış önce, gövde sonra (12 fps); yürürken öne (dolaba) eğik
  egil(B, 600, -2.4);
  poz(B, 615, { ifade: 'notr', bakis: [-1, 0] });
  poz(B, 625, { ifade: 'notr', bakis: [1, 0] });
  tl.set(B.ic, { scaleX: 0.93, rotation: 0 }, k(630));
  tl.set(B.ic, { scaleX: 1 }, k(635));
  poz(B, 635, { ifade: 'notr', bakis: [1, 0] });
  tl.set(B.ic, { rotation: 2.4 }, k(645));
  tl.set(B.ic, { rotation: 3.4 }, k(650));
  tl.set(B.ic, { rotation: 1.2 }, k(705));
  tl.set(B.ic, { rotation: -1.6 }, k(710));     // seslenişe döner
  tl.set(B.ic, { rotation: 0.6 }, k(735));
  tl.set(B.ic, { rotation: 0 }, k(740));
  tl.to([B.ic, gel.g, gel.p], { x: dxYuru, duration: k(66), ease: E.KM }, k(645));
  {
    const sek = [-5, -11, 0, -11, 0, -11, 0, -11, 0, -11, 0, -11, -4];
    sek.forEach((v, i) => tl.set(B.ic, { y: v }, k(645 + i * 5)));
    tl.set(B.ic, { y: 0 }, k(645 + sek.length * 5));
  }
  // B2 kadraj dışından seslenir; B omzunun üstünden bakar, sonra çekmeceye
  poz(B, 700, { ifade: 'merak', bakis: [-1, 0] });
  poz(B, 725, { ifade: 'notr', bakis: [-1, 0] });
  poz(B, 735, { ifade: 'notr', bakis: [1, 1] });
  poz(B, 750, { ifade: 'kararli', bakis: [1, 1] });
  konusur(B2, c2, 692, 760, { desen: [1, 1, 0, 1, 1, 1, 0, 1], ifadeler: ['mutlu', 'notr', 'merak', 'notr'], bakis: [1, 0] });

  // B2'nin sözü: iki satır sırayla yazılır (dünya balonu #7'de, ekran sabit kopyası #8'de; kuyruk kadraj dışına, B2'ye)
  const satir2 = (a, b) => ['<span style="display:block;line-height:1.16;padding-right:0.15em">', a, '</span><span style="display:block;line-height:1.16;padding-right:0.15em">', b, '</span>'].join('');
  const b2Metin = metin(satir2('M8 vida…', '3 tane de M6 getirir misin kanka?'), satir2('An M8 screw…', 'and three M6s, mate?'));
  const b2Agiz = B2.agiz(1);
  const b2Yer = { x: Y.kam7.x0 + Y.b2.dx + 26, y: Y.b2.y, boyut: Y.b2.boyut };
  const b2Kuyruk = [Y.kam7.x0 - 40, lerp(Y.b2.y + 100, b2Agiz[1], 0.5)];
  const b2 = konus(L, b2Metin, { x: b2Yer.x, y: b2Yer.y, kuyruk: b2Kuyruk, boyut: b2Yer.boyut, tohum: 71 });
  const b2Ekr = ekr(K7son, [b2Yer.x, b2Yer.y]);
  const b2s = konus(S, b2Metin, {
    x: b2Ekr[0], y: b2Ekr[1], boyut: b2Yer.boyut * K7son.scale, tohum: 71, pay: [26 * K7son.scale, 16 * K7son.scale],
    kuyruk: ekr(K7son, b2Kuyruk),
  });
  const satirlar = (hb) => Array.from(hb.p.querySelectorAll('span'));
  const ACIK = 'inset(-30% 0% -30% 0%)', KAPALI = 'inset(-30% 100% -30% 0%)';
  gsap.set([...satirlar(b2), ...satirlar(b2s)], { clipPath: KAPALI });
  // Okuma süresi: söz k692'de başlar, k740'ta tam yazılı; ekran sabit kopya k862'ye dek durur (tam okunur 2 sn, toplam 2,9 sn)
  tl.fromTo(b2.g, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(692));
  tl.set(b2.p, { autoAlpha: 1, clipPath: 'none' }, k(694));
  tl.fromTo(satirlar(b2)[0], { clipPath: KAPALI }, { clipPath: ACIK, duration: k(12), ease: 'none', immediateRender: false }, k(696));
  tl.fromTo(satirlar(b2)[1], { clipPath: KAPALI }, { clipPath: ACIK, duration: k(26), ease: 'none', immediateRender: false }, k(714));
  // k768 kesme: ekran sabit kopya tam yazılı açılır, k862'de kapanır
  tl.set(b2s.g, { autoAlpha: 0 }, 0);
  tl.set(b2s.g, { autoAlpha: 1, scale: 1 }, k(768));
  tl.set(b2s.p, { autoAlpha: 1, clipPath: 'none' }, k(768));
  tl.set(satirlar(b2s), { clipPath: ACIK }, k(768));
  b2s.kapat(862, 10);
  tl.set([b2.g, b2.p], { autoAlpha: 0 }, k(768)); // dünya balonu #9'da geri gelmesin

  // =====================================================================================================
  // #8 (k768–911): KUŞ BAKIŞI (ekran koordinatı; çekmece-yerel u ≈ mm, iç 480×300; ekran = O + σ·(x, y + D))
  // =====================================================================================================
  // Dikeyde çekmece neredeyse tam en (σ 2,1); dolabın yanları kadraj dışında, üstü yüzey olarak okunur
  const KB = yer({ sig: 2.0, OX: 480, YD: 214, LB: 272, boy: 250, kx: 300 }, { sig: 2.1, OX: 36, YD: 560, LB: 272, boy: 262, kx: 290 });
  const sig = KB.sig, OX = KB.OX, OY = KB.YD - 316 * sig, LB = KB.LB;
  const Dd = (f) => (f < 808 ? 0 : LB * EOf(sinir((f - 808) / 24, 0, 1)));
  const ekranK = (x, y, f) => [OX + sig * x, OY + sig * (y + Dd(f))];
  const uK = ([sx, sy], f) => [(sx - OX) / sig, (sy - OY) / sig - Dd(f)];
  const ZEMIN = '#ebe7df';
  const uG = (ust, x, y, aci = 0) => el(ust, 'g', { transform: `translate(${OX + sig * x} ${OY + sig * y}) rotate(${aci}) scale(${sig})` });
  // Yer (yukarıdan: dolabın dibi, biraz koyu) ve dolabın arkasındaki duvar şeridi
  el(K.svg, 'rect', { x: -3000, y: -3000, width: 8000, height: 8000, fill: '#e6e1d8' });
  el(K.svg, 'rect', { x: -3000, y: -3000, width: 8000, height: 3000 + OY + sig * -30, fill: '#d8d2c7' });
  // Yatay: solda tezgâhın üstü (#6'daki çekiç orada): mekân kesmenin iki yanında aynı
  if (!ctx.DIKEY) {
    const tx1 = OX - 46 * sig - 16, ty1 = OY + sig * 332;
    cizgi(K.svg, dikdortgen(-300, OY + sig * -30, tx1, ty1, 0), { kapali: true, dolgu: '#e2ddd3', kalinlik: 4.5, genlik: 0.5, tohum: 521, kay: [0, 0] });
    cizgi(K.svg, dikdortgen(-300, ty1 - 26, tx1, ty1, 0), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, genlik: 0.5, tohum: 522, kay: [0, 0] });
    const C = el(K.svg, 'g', { transform: `translate(160 ${OY + sig * 262}) rotate(34) scale(1.8)` });
    cizgi(C, dikdortgen(-110, -7, 60, 7, 6), { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.4, tohum: 523 });
    cizgi(C, dikdortgen(52, -26, 86, 26, 4), { kapali: true, dolgu: '#6f695f', kalinlik: 2.4, tohum: 524 });
  }
  const cekG = el(K.svg, 'g');
  cizgi(cekG, dikdortgen(-14, -12, 494, 318, 6), { kapali: true, dolgu: '#b5b1aa', kalinlik: 2.6, genlik: 0.7, tohum: 501, kay: [1.5, 1.5] });
  cizgi(cekG, dikdortgen(0, 0, 480, 300, 3), { kapali: true, dolgu: ZEMIN, kalinlik: 2, genlik: 0.6, tohum: 502, kay: [0, 0] });
  const parcaG = el(cekG, 'g');
  cizgi(cekG, dikdortgen(-26, 314, 506, 342, 4), { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.6, genlik: 0.7, tohum: 503, kay: [1.5, 1.5] });
  for (const x of [156, 324]) cizgi(cekG, dikdortgen(x - 5, 340, x + 5, 348, 2), { kapali: true, dolgu: '#6f695f', kalinlik: 1.8, genlik: 0.3, tohum: 504, kay: [0, 0] });
  cizgi(cekG, dikdortgen(146, 346, 334, 358, 5), { kapali: true, dolgu: '#6f695f', kalinlik: 2.2, genlik: 0.4, tohum: 505, kay: [1, 1] });
  // Dolabın üstü (arka kenardan ön kenara; çekmecenin içerde kalan kısmını örter), ön kenar şeridi ve üstündeki üç eşya
  const dolapUst = el(K.svg, 'g');
  cizgi(dolapUst, dikdortgen(OX - 46 * sig, OY + sig * -30, OX + 526 * sig, KB.YD, 0), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5, tohum: 506, kay: [0, 0] });
  cizgi(dolapUst, dikdortgen(OX - 46 * sig, KB.YD - 18, OX + 526 * sig, KB.YD, 0), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, tohum: 507, kay: [0, 0] });
  {
    const ES = yer({ kupa: [424, 118], kalem: [74, 236, -16], defter: [272, 196, 5] }, { kupa: [372, 236], kalem: [128, 252, -20], defter: [176, 150, 4] });
    // kupa (yukarıdan: ağız halkası, kahve, kulp)
    const kp = uG(dolapUst, ES.kupa[0], ES.kupa[1]);
    cizgi(kp, dikdortgen(36, -10, 62, 10, 8), { kapali: true, dolgu: '#e2ddd3', kalinlik: 2.2, genlik: 0.3, tohum: 531, kay: [1.5, 1.5] });
    cizgi(kp, oval(0, 0, 40, 40, 0, 360, 18, 2), { kapali: true, dolgu: '#ece8e0', kalinlik: 2.4, genlik: 0.3, tohum: 532, kay: [2, 2] });
    cizgi(kp, oval(0, 0, 31, 31, 0, 360, 16, 2), { kapali: true, dolgu: '#6f695f', kalinlik: 1.8, genlik: 0.25, tohum: 533, kay: [0, 0] });
    cizgi(kp, oval(-8, -9, 9, 5, 200, 320, 6), { kalinlik: 1.6, renk: '#ece8e0', genlik: 0.2, tohum: 534 });
    // kurşun kalem
    const kl = uG(dolapUst, ES.kalem[0], ES.kalem[1], ES.kalem[2]);
    cizgi(kl, [[-70, -5], [52, -5], [72, 0], [52, 5], [-70, 5]], { kapali: true, dolgu: '#d8d2c7', kalinlik: 1.8, genlik: 0.25, tohum: 535, kay: [1.2, 1.2] });
    cizgi(kl, dikdortgen(-82, -5, -70, 5, 2), { kapali: true, dolgu: '#a59e91', kalinlik: 1.6, genlik: 0.2, tohum: 536, kay: [0, 0] });
    cizgi(kl, [[52, -5], [52, 5]], { kalinlik: 1.4, genlik: 0.2, tohum: 537 });
    // not defteri (yazısız çizgiler)
    const df = uG(dolapUst, ES.defter[0], ES.defter[1], ES.defter[2]);
    cizgi(df, dikdortgen(-58, -42, 58, 42, 2), { kapali: true, dolgu: '#f4f1ea', kalinlik: 2, genlik: 0.3, tohum: 538, kay: [1.5, 1.5] });
    [-22, -8, 6, 20].forEach((y, i) => cizgi(df, [[-42, y], [[24, 36, 10, 30][i], y + (i % 2 ? 1 : -1)]], { kalinlik: 1.4, renk: '#8d867a', genlik: 0.5, tohum: 540 + i }));
  }
  el(K.svg, 'rect', { x: OX - 46 * sig, y: KB.YD, width: 572 * sig, height: 12, fill: MUR, opacity: 0.08 });
  const elG = el(K.svg, 'g');

  // --- Parçalar (vida, somun, pul): tohumlu, kümeli dağılım (karışık), hafif gevşetilir
  const rs = rng(5207), U = (a, b) => a + (b - a) * rs();
  const PR = [];
  const UZUN = { x: 196, y: 178, th: 14 };
  PR.push({ tur: 'vida', L: 126, w: 8, ozel: true, x0: UZUN.x, y0: UZUN.y, th0: UZUN.th });
  for (let i = 0; i < 34; i++) { const L0 = 16 + 58 * Math.pow(rs(), 1.3); PR.push({ tur: 'vida', L: L0, w: 3.6 + L0 * 0.05 + U(-0.4, 0.4) }); }
  for (let i = 0; i < 16; i++) PR.push({ tur: 'somun', R: U(6, 10) });
  for (let i = 0; i < 14; i++) PR.push({ tur: 'pul', R: U(6, 10) });
  for (const p of PR) p.cr = p.tur === 'vida' ? sinir(p.L * 0.24, 4.5, 14) : p.R;
  const KUME = [[110, 120], [300, 90], [380, 220], [180, 250], [250, 170]];
  for (const p of PR) {
    if (p.ozel) continue;
    const c = KUME[Math.floor(rs() * KUME.length)], a = rs() * Math.PI * 2, d = Math.pow(rs(), 0.7) * 110;
    p.x0 = c[0] + Math.cos(a) * d; p.y0 = c[1] + Math.sin(a) * d * 0.8; p.th0 = U(0, 360);
  }
  const ozel = PR[0];
  for (let itr = 0; itr < 40; itr++) {
    for (let a = 0; a < PR.length; a++) for (let b = a + 1; b < PR.length; b++) {
      const pa = PR[a], pb = PR[b], dx = pb.x0 - pa.x0, dy = pb.y0 - pa.y0, m = (pa.cr + pb.cr) * 0.78, d = Math.hypot(dx, dy) || 0.01;
      if (d < m) {
        const o = (m - d) / 2;
        if (!pa.ozel) { pa.x0 -= dx / d * o * (pb.ozel ? 2 : 1); pa.y0 -= dy / d * o * (pb.ozel ? 2 : 1); }
        if (!pb.ozel) { pb.x0 += dx / d * o * (pa.ozel ? 2 : 1); pb.y0 += dy / d * o * (pa.ozel ? 2 : 1); }
      }
    }
    for (const p of PR) if (!p.ozel) { p.x0 = sinir(p.x0, p.cr + 2, 478 - p.cr); p.y0 = sinir(p.y0, p.cr + 30, 298 - p.cr); }
  }
  // Çekmece durunca öne kayma (2–4 px), gecikme 0–3 k
  for (const p of PR) { p.kayA = U(1.0, 2.0); p.kayG = U(0, 3); p.kayR = U(-3, 3); }

  // --- El yolu (ekran): uzanış (KM), kavrama, çekiş, bırakma, karıştırma, uzun vidayı alma, kaldırma, bırakma
  const elBoy0 = KB.boy;
  const G0 = (f) => ekranK(KB.kx, 352, f);                   // kulp kavrama noktası
  const RUM = [236, 196];                                      // karıştırma merkezi (u)
  const elDur = (f) => {
    const o = { boy: elBoy0, tutma: false, tut: false, aci: -62 };
    if (f < 806) {
      // başlangıç kadrajın hemen altında (kamera bu aralıkta dolabın üstünü gösterir: K8a)
      const t = KMf(sinir((f - 768) / 38, 0, 1)), g = G0(f), bas = [g[0] - yer(230, 220), yer(630, 1180)];
      o.m = [lerp(bas[0], g[0], t), lerp(bas[1], g[1], t)];
      o.aci = lerp(-48, -64, t);
      o.tutma = f >= 805;
    } else if (f < 836) {
      o.m = G0(f); o.aci = -64; o.tutma = true;
    } else if (f < 856) {
      const t = EOf(sinir((f - 840) / 16, 0, 1)), g = G0(f), r = ekranK(RUM[0], RUM[1], f);
      o.m = [lerp(g[0], r[0], t), lerp(g[1], r[1] + 30, t) - Math.sin(t * Math.PI) * 30];
      o.aci = lerp(-64, -56, t); o.boy = elBoy0 * (1 + 0.05 * Math.sin(t * Math.PI));
    } else if (f < 876) {
      const u = f - 856, r = ekranK(RUM[0], RUM[1], f);
      o.m = [r[0] + sig * 40 * Math.sin(2 * Math.PI * u / 16), r[1] + 30 + sig * 18 * Math.sin(2 * Math.PI * u / 10 + 0.6)];
      o.aci = -56 + 10 * Math.sin(2 * Math.PI * u / 12);
    } else {
      const ls = ekranK(UZUN.x + ozel.kayX, UZUN.y + ozel.kayY, f);
      const r = ekranK(RUM[0], RUM[1], 876), r0 = [r[0] + sig * 40 * Math.sin(2 * Math.PI * 20 / 16), r[1] + 30 + sig * 18 * Math.sin(2 * Math.PI * 2 + 0.6)];
      const aciT = UZUN.th - 90;
      if (f < 882) {
        const t = EOf(sinir((f - 876) / 6, 0, 1));
        o.m = [lerp(r0[0], ls[0], t), lerp(r0[1], ls[1], t)]; o.aci = lerp(-56 + 10 * Math.sin(2 * Math.PI * 20 / 12), aciT, t);
      } else if (f < 900) {
        // kaldırır (yüzüne doğru: aşağı ve büyür), 12 fps'te iki kez çevirip bakar
        const t = EOf(sinir((f - 882) / 9, 0, 1));
        o.m = [ls[0] - 14 * t, ls[1] + 84 * t]; o.boy = elBoy0 * (1 + 0.2 * t);
        o.aci = aciT + [0, 0, 16, 16, -6, -6][Math.min(5, Math.floor(Math.max(0, f - 885) / 3))] * (f >= 885 ? 1 : 0);
        o.tutma = true; o.tut = true;
      } else {
        const t = EOf(sinir((f - 900) / 10, 0, 1));
        o.m = [ls[0] - 14 - 50 * t, ls[1] + 84 + 140 * t]; o.boy = elBoy0 * (1.2 - 0.14 * t); o.aci = aciT - 6 + 10 * t;
      }
    }
    // el pozu 12 fps: kavrama/bırakma 5 k ızgarasında
    return o;
  };
  ozel.kayX = 0; ozel.kayY = 0;

  // --- Kare kare içerik: öne kayma + elin itmesi (önceden hesaplanır, belirlenebilir)
  const FS = 808, FE = 911, NF = FE - FS + 1;
  const PX = PR.map(() => new Float32Array(NF)), PY = PR.map(() => new Float32Array(NF)), PT = PR.map(() => new Float32Array(NF));
  {
    const it2 = PR.map(() => [0, 0, 0]);
    for (let f = FS; f <= FE; f++) {
      const j = f - FS;
      const e = elDur(f);
      const itiyor = f >= 846 && f < 880;
      let uc = null, Rz = 0;
      if (itiyor) {
        const a = e.aci * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
        uc = uK([e.m[0] + ux * e.boy * 0.32, e.m[1] + uy * e.boy * 0.32], f);
        Rz = e.boy * 0.2 / sig;
      }
      PR.forEach((p, i) => {
        const kay = p.kayA * EOf(sinir((f - 832 - p.kayG) / 9, 0, 1));
        if (uc && !p.ozel) {
          const x = p.x0 + it2[i][0], y = p.y0 + it2[i][1] + kay, dx = x - uc[0], dy = y - uc[1], d = Math.hypot(dx, dy) || 0.01, m = Rz + p.cr * 0.6;
          if (d < m) { const s = Math.min(2.4, (m - d) * 0.32); it2[i][0] += dx / d * s; it2[i][1] += dy / d * s; it2[i][2] += (i % 2 ? 1 : -1) * s * 3; }
        }
        PX[i][j] = sinir(p.x0 + it2[i][0], p.cr, 480 - p.cr);
        PY[i][j] = sinir(p.y0 + it2[i][1] + kay, p.cr, 300 - p.cr);
        PT[i][j] = p.th0 + it2[i][2] + p.kayR * EOf(sinir((f - 832 - p.kayG) / 9, 0, 1));
      });
    }
    ozel.kayY = ozel.kayA;
  }

  // --- Parça çizimleri (yerel u, merkez 0,0)
  const vidaCiz = (ust, L0, w, tohum) => {
    const g = el(ust, 'g'), hl = Math.max(3.5, w * 0.85), hw = w * 0.95, x0 = -L0 / 2, xb = x0 + hl, x1 = L0 / 2;
    cizgi(g, [[xb, -w / 2], [x1 - w * 0.6, -w / 2], [x1, 0], [x1 - w * 0.6, w / 2], [xb, w / 2]], { kapali: true, dolgu: '#b0a99c', kalinlik: 1.5, genlik: 0.3, tohum, kay: [0.8, 0.8] });
    let d = '';
    for (let x = xb + 3.5; x < x1 - w; x += 4.2) d += `M${x.toFixed(1)} ${(-w / 2 + 0.6).toFixed(1)}L${(x + 1.8).toFixed(1)} ${(w / 2 - 0.6).toFixed(1)}`;
    if (d) el(g, 'path', { d, stroke: MUR, 'stroke-width': 0.9, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 });
    cizgi(g, [[x0, -hw], [xb, -hw], [xb, hw], [x0, hw]], { kapali: true, dolgu: '#8d867a', kalinlik: 1.5, genlik: 0.3, tohum: tohum + 1, kay: [0.8, 0.8] });
    return g;
  };
  const somunCiz = (ust, R, tohum) => {
    const g = el(ust, 'g');
    cizgi(g, [0, 1, 2, 3, 4, 5].map((i) => [R * Math.cos((i * 60 + 30) * Math.PI / 180), R * Math.sin((i * 60 + 30) * Math.PI / 180)]), { kapali: true, dolgu: '#8d867a', kalinlik: 1.5, genlik: 0.3, tohum, kay: [0.8, 0.8] });
    cizgi(g, oval(0, 0, R * 0.46, R * 0.46, 0, 360, 8), { kapali: true, dolgu: ZEMIN, kalinlik: 1.2, genlik: 0.25, tohum: tohum + 1, kay: [0, 0] });
    return g;
  };
  const pulCiz = (ust, R, tohum) => {
    const g = el(ust, 'g');
    cizgi(g, oval(0, 0, R, R, 0, 360, 12), { kapali: true, dolgu: '#c2bcb1', kalinlik: 1.5, genlik: 0.3, tohum, kay: [0.8, 0.8] });
    cizgi(g, oval(0, 0, R * 0.42, R * 0.42, 0, 360, 8), { kapali: true, dolgu: ZEMIN, kalinlik: 1.2, genlik: 0.25, tohum: tohum + 1, kay: [0, 0] });
    return g;
  };
  // Elde tutulan uzun vida (dizge; elUstten 'araya' katmanı: parmakların altında, el sırtının üstünde)
  const vidaDizge = (L0, w, i) => {
    const s = kalem(531, i, 0.5), hl = w * 0.85, hw = w * 0.95, x0 = -L0 / 2, xb = x0 + hl, x1 = L0 / 2;
    const sek = (pts, dolgu, kw) => { const d = yol(pts, true, s); return `<path d="${d}" fill="${dolgu}" transform="translate(1.6 1.6)"/><path d="${d}" fill="none" stroke="${MUR}" stroke-width="${kw}" stroke-linejoin="round"/>`; };
    let dis = '';
    for (let x = xb + 3.5; x < x1 - w; x += 4.2) dis += `M${x.toFixed(1)} ${(-w / 2 + 0.6).toFixed(1)}L${(x + 1.8).toFixed(1)} ${(w / 2 - 0.6).toFixed(1)}`;
    return sek([[xb, -w / 2], [x1 - w * 0.6, -w / 2], [x1, 0], [x1 - w * 0.6, w / 2], [xb, w / 2]], '#b0a99c', 1.5) +
      `<path d="${dis}" stroke="${MUR}" stroke-width="0.9" fill="none" opacity="0.7"/>` + sek([[x0, -hw], [xb, -hw], [xb, hw], [x0, hw]], '#8d867a', 1.5);
  };
  const sira = PR.map((_, i) => i).sort((a, b) => ((a * 7919) % 67) - ((b * 7919) % 67));
  sira.push(sira.splice(sira.indexOf(0), 1)[0]);   // uzun vida en üstte
  const PG = [];
  let golgeEl = null;
  for (const i of sira) {
    const p = PR[i], t = 540 + i * 3;
    if (p.ozel) golgeEl = el(parcaG, 'ellipse', { rx: p.L / 2, ry: p.w * 0.9, fill: MUR, opacity: 0, cx: 0, cy: 0 });
    PG[i] = p.tur === 'vida' ? vidaCiz(parcaG, p.L, p.w, t) : p.tur === 'somun' ? somunCiz(parcaG, p.R, t) : pulCiz(parcaG, p.R, t);
  }

  // Düşen uzun vida: k900'de elden çıkar, 6 k'da düşer (power2.in), k906 'tik', 5 k sekip kayar
  const dusus = (f) => {
    const e = elDur(899), [ux, uy] = uK(e.m, 899);
    const ac = e.aci + 90;
    const s0 = e.boy / elBoy0 * 1.12;                 // elde tutulduğu ölçek (kaldırılmış: kameraya yakın)
    if (f < 906) { const t = p2in(sinir((f - 900) / 6, 0, 1)); return { x: ux + 4 * t, y: uy + 3 * t, th: ac + 8 * t, s: s0 - (s0 - 1) * t }; }
    const t = EOf(sinir((f - 906) / 6, 0, 1));
    return { x: ux + 4 + 3 * t, y: uy + 3 + 2 * t, th: ac + 8 + 5 * t, s: 1 + 0.03 * Math.sin(t * Math.PI) };
  };
  let sonEl = '';
  function kusCiz(f) {
    f = sinir(Math.round(f), 768, FE);
    const Df = Dd(f), j = Math.max(0, f - FS);
    cekG.setAttribute('transform', `translate(${OX.toFixed(2)} ${(OY + sig * Df).toFixed(2)}) scale(${sig})`);
    const e = elDur(f);
    PR.forEach((p, i) => {
      let x = f < FS ? p.x0 : PX[i][j], y = f < FS ? p.y0 : PY[i][j], th = f < FS ? p.th0 : PT[i][j], s = 1;
      if (p.ozel) {
        if (f >= 882 && f < 900) { PG[i].setAttribute('visibility', 'hidden'); return; }
        PG[i].setAttribute('visibility', 'visible');
        if (f >= 900) { const d = dusus(f); x = d.x; y = d.y; th = d.th; s = d.s; }
      }
      PG[i].setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${th.toFixed(1)}) scale(${s.toFixed(3)})`);
    });
    // uzun vidanın gölgesi (kaldırılınca, düşerken)
    if (f >= 882 && f < 908) {
      let gx, gy, th, h;
      if (f < 900) { const [ux, uy] = uK(e.m, f); gx = ux; gy = uy; th = e.aci + 90; h = 10 * EOf(sinir((f - 882) / 10, 0, 1)); }
      else { const d = dusus(f); gx = d.x; gy = d.y; th = d.th; h = Math.min(10, (d.s - 1) * 30); }
      golgeEl.setAttribute('transform', `translate(${(gx + h * 0.5).toFixed(2)} ${(gy + h * 0.8).toFixed(2)}) rotate(${th.toFixed(1)})`);
      golgeEl.setAttribute('opacity', (0.1 + 0.08 * (1 - h / 10)).toFixed(3));
    } else golgeEl.setAttribute('opacity', 0);
    // el (dizge): yalnız konum/poz/kaynama değişince yeniden kurulur
    const tutma = e.tutma, araya = e.tut ? `<g transform="translate(${e.m[0].toFixed(1)} ${e.m[1].toFixed(1)}) rotate(${(e.aci + 90).toFixed(1)}) scale(${(sig * e.boy / elBoy0 * 1.12).toFixed(3)})">${vidaDizge(ozel.L, ozel.w, kay)}</g>` : '';
    const dz = elUstten({
      merkez: e.m, aci: e.aci, boy: e.boy, ten: MONO.ten[P.B.ten], giysi: MONO.giysi[P.B.giysi], taraf: 'sol', tutma,
      kaynama: kay, tohum: 7, kolUzun: yer(900, 1300), kalinlik: e.boy * 0.46, kolBoyu: 'sivali', araya,
    });
    if (dz !== sonEl) { elG.innerHTML = dz; sonEl = dz; }
  }
  kusCiz(768);
  const kusPrx = { f: 768 };
  tl.fromTo(kusPrx, { f: 768 }, { f: FE, duration: k(FE - 768), ease: 'none', onUpdate: () => kusCiz(kusPrx.f), immediateRender: false }, k(768));
  ctx.kaynayanlar.add(() => { if (tl.time() >= k(768) && tl.time() < k(912)) kusCiz(kusPrx.f); });
  // Kamera: çekmecenin açık iç merkezine doğru yavaş itiş (ölü kare yok)
  const K8 = { x: 0, y: 0, scale: 1 };
  // k768: dolabın üstü kadrajı doldurur (kulp alt üçte birde, el aşağıdan girer); çekerken kamera çekmeceyle birlikte
  // aşağı eğilir (k806–842 KM), sonra açık çekmecenin içine yavaş itiş
  const gY = OY + sig * 352;
  const K8a = yer(odak(960, gY, 1, 960, 690), odak(540, gY, 1.22, 540, 1150));
  kameraKoy(768, K8a);
  kameraGit(768, 38, it(K8a, 1.012, [G0(768)[0], gY]), 'none');
  kameraGit(806, 36, K8, E.KM);
  kameraGit(842, 69, it(K8, 1.03, ekranK(240, 150, 832)), 'none');

  // =====================================================================================================
  // #9 (k912–1055): B'nin yüzü ve açık çekmece. Düşünce balonu, organizer, sığmaz.
  // =====================================================================================================
  const s9 = K9.scale;
  const D9 = (sx, sy) => cev(K9, [sx, sy]);
  kameraKoy(912, K9);
  kameraGit(912, 144, it(K9, 1.028, [(bGoz9[0] + pcx) / 2, (bGoz9[1] + cy0) / 2]), 'none');
  tl.set(aletG, { autoAlpha: 1 }, k(BAS));
  tl.set(aletG, { autoAlpha: 0 }, k(912));
  // B dolabın yanında, açık çekmeceye bakar (eller boşta: büst; kol yalnız iş yaparken çizilir, #8)
  tl.set(B.ic, { x: dxYuru + Y.b9dx, y: 0, scaleX: 1, rotation: 0 }, k(912));
  poz(B, 912, { ifade: 'notr', bakis: [1, 1] });
  poz(B, adim(920), { ifade: 'merak', bakis: [1, -1] });
  poz(B, adim(940), { ifade: 'ozlem', bakis: [1, -1] });
  poz(B, adim(956), { ifade: 'merak', bakis: [1, 1] });
  poz(B, adim(972), { ifade: 'saskin', bakis: [1, 1] });
  poz(B, adim(990), { ifade: 'sikkin', bakis: [1, 1] });
  poz(B, adim(1022), { ifade: 'sikkin', bakis: [0, 1] });
  poz(B, adim(1040), { ifade: 'sikkin', bakis: [1, -1] });

  // #9 öğeleri yalnız k912'den sonra (katman #6–#7'de de görünür)
  const yalniz9 = (g, k0 = 912) => { gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, 0); tl.set(g, { autoAlpha: 1 }, k(k0)); };

  // Düşünce balonu (dünya koordinatı; ekrandaki yerinden çevrilir)
  const BY = yer({ c: [1310, 318], r: [500, 168], dots: [[738, 476, 9], [770, 448, 13], [812, 418, 18]], koken: '8% 86%' },
    { c: [556, 470], r: [412, 272], dots: [[300, 972, 11], [348, 932, 15], [404, 884, 20]], koken: '30% 98%' });
  const bal = balon(gOrta, {
    c: D9(...BY.c), r: [BY.r[0] / s9, BY.r[1] / s9], noktalar: BY.dots.map(([x, y, r]) => [...D9(x, y), r / s9]), tohum: 91, koken: BY.koken,
  });
  bal.ac(914, { hizli: true });
  // Organizer çizimi (cizimler.js, ORTAK): balonun içinde çizilir, sonra çekmeceye iner. Kapalı konturlar sık noktalanır
  // (4 köşeli dikdörtgen Catmull-Rom'da hapa dönüyordu), açık kâğıt dolgusu: çekmecenin üstünde duran bir nesne gibi okunur
  const OY9 = yer({ c: [1310, 372], boy: 300 }, { c: [556, 580], boy: 360 });
  const oc = D9(...OY9.c), oboy = OY9.boy / s9;
  const kalinG = el(gOrta, 'g');                             // ön yüz (kalınlık) planın arkasında kalır
  const orgG = el(gOrta, 'g');
  const SW0 = 4.4 / s9 * 2, SW1 = 3.4;                       // balondaki ve çekmecedeki çizgi kalınlığı (dünya)
  const org = cizimKur(ctx, orgG, 'organizer', { c: oc, boy: oboy, kalinlik: SW0, tohum: 940, dolgu: ctx.BALON });
  org.forEach((h, i) => {
    h.kapali = !!CIZIMLER.organizer[i].kapali;
    h.p0 = h.pts.map((q) => [q[0] - oc[0], q[1] - oc[1]]);  // köşeler, balon merkezine göre; iniş noktaları buradan
    if (h.kapali) { h.pts = yogun(h.pts, 9); h.ciz(); }
    if (h.dolgu) h.dolgu.setAttribute('transform', 'translate(1 1)');
  });
  yalniz9(orgG);
  const orgYol = org.map((h) => h.yol);
  const orgDolgu = org.filter((h) => h.dolgu).map((h) => h.dolgu);
  tl.set(orgYol, { drawSVG: '0%' }, k(BAS));
  tl.set(orgDolgu, { autoAlpha: 0 }, k(BAS));
  tl.fromTo(orgYol[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: k(10), ease: E.EO, immediateRender: false }, k(928));
  tl.fromTo(orgYol.slice(1), { drawSVG: '0%' }, { drawSVG: '100%', duration: k(6), ease: E.EO, stagger: k(2), immediateRender: false }, k(934));
  tl.set(orgYol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(954));
  tl.to(orgDolgu, { autoAlpha: 1, duration: k(6), ease: 'none' }, k(950));
  // İniş: balon → çekmece ağzı. Nokta nokta yeniden konumlanır (grup ölçeklenmez: kaynama ve çizgi kalınlığı bozulmaz).
  // Organizer iç enden %27 geniş (çekmecenin dışından da taşar): iki yan duvarın üstüne oturur, içeri giremez; ön yüz
  // şeridi (kalınlık) inerken belirir.
  const OW = 0.92 * oboy, OH = 0.6 * oboy, KAL = 18;
  const hedefEn = (agiz.ix1 - agiz.ix0) * 1.27, hedefBoy = DP * 0.78;
  const hedef = { mx: pcx, my: cy0 - KAL - hedefBoy / 2, sx: hedefEn / OW, sy: hedefBoy / OH };
  const og = { mx: oc[0], my: oc[1], sx: 1, sy: 1, r: 0, kal: 0 };
  const onYuz = cizgi(kalinG, [[0, 0], [1, 0], [1, 1], [0, 1]], { kapali: true, dolgu: '#e2ddd3', kalinlik: SW1, genlik: 0.5, tohum: 951, kay: [0, 0] });
  const bolme = [-0.15, 0.15].map((u, i) => cizgi(kalinG, [[0, 0], [0, 1]], { kalinlik: 2.6, tohum: 953 + i, genlik: 0.3 }));
  yalniz9(kalinG, 958);
  const ogUygula = () => {
    const a = og.r * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const M = ([x, y]) => { const u = x * og.sx, v = y * og.sy; return [og.mx + u * ca - v * sa, og.my + u * sa + v * ca]; };
    // kapalı kontur: köşeler eşlenir, sonra eşit aralıkla noktalanır (basıklaşınca sık noktalar dalga yapmasın)
    for (const h of org) { h.pts = h.kapali ? yogun(h.p0.map(M), 11) : h.p0.map(M); h.ciz(); h.yol.setAttribute('stroke-width', lerp(SW0, SW1, og.kal).toFixed(2)); }
    // ön yüz: planın alt kenarından aşağı (döndürülmüş "aşağı" yönünde) KAL × kal
    const t = KAL * og.kal, dx = -sa * t, dy = ca * t;
    const A = M([-OW / 2, OH / 2]), Bk = M([OW / 2, OH / 2]);
    onYuz.pts = yogun([A, Bk, [Bk[0] + dx, Bk[1] + dy], [A[0] + dx, A[1] + dy]], 9); onYuz.ciz();
    [-0.15, 0.15].forEach((u, i) => { const q = M([u * oboy, OH / 2]); bolme[i].pts = [[q[0] + dx * 0.15, q[1] + dy * 0.15], [q[0] + dx * 0.85, q[1] + dy * 0.85]]; bolme[i].ciz(); });
  };
  ogUygula();
  const ogT = (k0, sure, hedefler, ease = 'none') => tl.to(og, { ...hedefler, duration: k(sure), ease, onUpdate: ogUygula }, k(k0));
  tl.set(og, { mx: oc[0], my: oc[1], sx: 1, sy: 1, r: 0, kal: 0, onComplete: ogUygula }, k(912));
  // düşer, eğik iner: önce sol uç duvara çarpar (k968), sonra sağ uç (k971); seker, oturur, titrer
  ogT(956, 12, { mx: hedef.mx, my: hedef.my - 4, sx: hedef.sx, sy: hedef.sy, r: -4.5 }, 'power2.in');
  ogT(958, 8, { kal: 1 });
  ogT(968, 3, { r: 1.5, my: hedef.my + 2, sy: hedef.sy * 0.86, sx: hedef.sx * 1.02 }, 'power2.in');
  ogT(971, 5, { r: 0.8, my: hedef.my - 13, sy: hedef.sy, sx: hedef.sx }, 'power1.out');
  ogT(976, 6, { r: 0, my: hedef.my }, 'power1.in');
  const titre = (k0, gen) => [gen, -gen, gen * 0.7, -gen * 0.7, gen * 0.4, 0].forEach((v, i) => ogT(k0 + i * 2, 2, { mx: hedef.mx + v }));
  titre(982, 3);
  // B kıpırdatıp yerleştirmeyi dener (12 fps): sola, sağa; olmaz
  [[996, -6, -1], [1001, 6, 1], [1006, 0, 0]].forEach(([kk, dx, r]) => tl.set(og, { mx: hedef.mx + dx, r, onComplete: ogUygula }, k(kk)));
  // ikinci deneme (k1012): kalkar, öbür yana eğik bastırır, iki uç birden çarpar, oturamaz
  ogT(1010, 6, { my: hedef.my - 12, r: 2.5 }, E.EO);
  ogT(1016, 4, { my: hedef.my + 2, r: 0, sy: hedef.sy * 0.88 }, 'power2.in');
  ogT(1020, 6, { my: hedef.my, sy: hedef.sy }, E.EO);
  titre(1026, 2);
  // Çarpma izleri: duvarla temas eden iki uçta kısa çizgi demeti (12 fps, 2 adım)
  const darbe = (x, y, yon, tohum) => {
    const g = el(gOrta, 'g');
    [-42, 0, 42].forEach((a, i) => {
      const r = (a + (yon > 0 ? 0 : 180)) * Math.PI / 180, r0 = 13, l = i === 1 ? 22 : 16;
      cizgi(g, [[x + Math.cos(r) * r0, y + Math.sin(r) * r0], [x + Math.cos(r) * (r0 + l), y + Math.sin(r) * (r0 + l)]], { kalinlik: 3.4, tohum: tohum + i, genlik: 0.5 });
    });
    gsap.set(g, { autoAlpha: 0 });
    return g;
  };
  const dzY = cy0 - KAL * 0.6;
  const dz1 = darbe(hedef.mx - hedefEn / 2 - 6, dzY, -1, 960), dz2 = darbe(hedef.mx + hedefEn / 2 + 6, dzY, 1, 964);
  for (const [g, a, b] of [[dz1, 968, 978], [dz2, 971, 981], [dz1, 1020, 1028], [dz2, 1020, 1028]]) {
    tl.set(g, { autoAlpha: 1, scale: 0.7, transformOrigin: '50% 50%' }, k(a));
    tl.set(g, { scale: 1 }, k(a + 5));
    tl.set(g, { autoAlpha: 0 }, k(b));
  }
  // Ölçü oku (vurgu): çekmecenin iç eni, ön panelin üstünde; ortada "?" (sayının yerinde)
  const okY = cy0 + DL.cekH * 0.66, bosluk = 30;
  const okG = el(gOrta, 'g');
  const okParca = [];
  {
    const ix0 = agiz.ix0, ix1 = agiz.ix1, orta = (ix0 + ix1) / 2;
    for (const [a, b] of [[ix0, orta - bosluk], [ix1, orta + bosluk]]) {
      el(okG, 'path', { d: `M${a} ${okY}L${b} ${okY}`, stroke: '#ebe7df', 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' });
      okParca.push(cizgi(okG, [[a, okY], [b, okY]], { kalinlik: 4, renk: VURGU, genlik: 0.4, tohum: 971 + a % 7 }));
      const yon = b > a ? 1 : -1;
      okParca.push(cizgi(okG, [[a + yon * 11, okY - 7], [a, okY], [a + yon * 11, okY + 7]], { kalinlik: 4, renk: VURGU, genlik: 0.3, tohum: 975 + a % 5 }));
      okParca.push(cizgi(okG, [[a, okY - 14], [a, okY + 14]], { kalinlik: 3, renk: VURGU, genlik: 0.3, tohum: 978 + a % 3 }));
    }
  }
  const okYol = okParca.map((h) => h.yol);
  yalniz9(okG, 976);
  tl.set(okYol, { drawSVG: '0%' }, k(913));
  tl.fromTo(okYol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(8), ease: E.EO, immediateRender: false }, k(976));
  tl.set(okYol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(986));
  const soru = document.createElement('p');
  soru.textContent = '?';
  Object.assign(soru.style, { position: 'absolute', margin: 0, left: pcx + 'px', top: okY + 'px', font: `600 ${Math.round(DL.cekH * 0.78)}px/1 Caveat, cursive`, color: VURGU_YAZI, whiteSpace: 'nowrap', textShadow: '0 0 5px #ebe7df, 0 0 5px #ebe7df' });
  L.div.appendChild(soru);
  gsap.set(soru, { xPercent: -50, yPercent: -54, autoAlpha: 0, scale: 0, transformOrigin: '50% 60%' });
  tl.set(soru, { autoAlpha: 0, scale: 0 }, k(913));
  tl.to(soru, { autoAlpha: 1, scale: 1, duration: k(10), ease: E.BO }, k(984));
  tl.to(soru, { scale: 1.14, duration: k(6), ease: 'power1.out', yoyo: true, repeat: 1 }, k(1030));

  // El yazıları (balonun içinde): 1. satır üstte; 2. satır organizerin boşalttığı yerde
  const NY = yer({ s1: [962, 196, 50], s2: [960, 336, 58] }, { s1: [262, 300, 50], s2: [272, 556, 60] });
  const not1 = elYazisi(L.div, metin('Şuraya bir organizer tasarlasak…', 'We could design an organizer…'), { x: D9(NY.s1[0], NY.s1[1])[0], y: D9(NY.s1[0], NY.s1[1])[1], boyut: NY.s1[2] / s9, aci: -2 });
  not1.style.paddingRight = '0.2em';
  yazElYazisi(not1, 926, 28);
  const not2 = elYazisi(L.div, metin('Ama ölçüleri? Sığar mı?', 'But the size? Will it fit?'), { x: D9(NY.s2[0], NY.s2[1])[0], y: D9(NY.s2[0], NY.s2[1])[1], boyut: NY.s2[2] / s9, aci: -3 });
  not2.style.paddingRight = '0.2em';
  yazElYazisi(not2, 962, 22);
  tl.set([not1, not2], { autoAlpha: 0 }, k(913));
}
