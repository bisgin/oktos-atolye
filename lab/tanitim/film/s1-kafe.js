// Sahne 1, KAFE (#3–#5, k192–575). A (kısa boylu, yanaklı, kıvırcık saçlı genç kız) kafede tek başına; garsona seslenir,
// görülmez; masada bir QR standı olsa sipariş verebileceğini düşünür. Sahne SORUNDA biter: çözüm, ürün, renkli nesne yok.
// #3 (k192–287) Devir: v1'in son yüzü A, aynı ekran yerinde ve ölçekte (kamera v1'in itişini sürdürür); 58 k KM üstel
//    ölçekle geri çekilir, kafe genel planı açılır (dekor k194–216 kâğıttan belirir: v1'de kâğıt boştu). A önde, örtülü
//    masasında, sandalyede (sırt dikmeleri gövdesinin iki yanında: "oturuyor" işareti) tek başına; önünde BOŞ fincan
//    tabağı ve kaşık. Arkada iki masa (2+2 genç figüran, açık gri; minik balonlarda karalama), ortada tezgâh + espresso
//    makinesi (basınç saatleri, üstte fincanlar), duvarda kara tahta menü, A'nın üstünde sarkan lamba. Garson (uzun,
//    zayıf, önlüklü, omuz hizasında tepsi) tezgâhın yanında SAĞDAKİ konuşan masaya eğik, onları dinliyor: hiçbir anda
//    A'ya (solda, önde) dönük değil. A k200'de göz kırpar (kollu gövdeye geçiş bu karede), garsona bakar.
// #4 (k288–431) A elini kaldırır (kol.js, 12 fps), ağzı açılır: "Bakar mısınız?" (k300; balon yüzünün sağında, garsona
//    doğru; kuyruk ağzı gösterir, yüzün ve küpenin dışında kalır). Garson A'ya değil sağdaki masaya döner: o yana adım
//    atar, iyice eğilir, güler, başını sallar. İkinci deneme: el daha yüksek ve sallanır, A yarı doğrulur, daha büyük
//    balon "Bakar mısınız?!" (k372). Garson tepsiyle arkasını döner (k378, önden arkaya bir adım daralma) ve sağa
//    yürüyüp k425'te kadrajdan çıkar; A şaşırır, eli iner. İkinci söz birinci balonu "şişirir" (aynı kuyruk ucundan
//    büyük balon onun yerini alır): "Bakar mısınız" k304–436 kesintisiz okunur.
// #5 (k432–575) Omzu düşer, sağ eli masada, köşeye bakar; kamera 60 k KM ile A'ya ve balona yaklaşır, sonra yavaş itiş
//    (kadraj balonun örneklenmiş dış hattından hesaplanır). Arka plan susar ve kâğıda doğru solar (odak A'nın iç sesinde).
//    Düşünce balonu (k432): A'nın masasının köşesinde çadır QR standı (cizimler.js qrStandi noktaları, düz kenarlı), havada
//    okutan telefon, okutma çizgileri 12 fps'te kayar; vurgu halkası (k490, dilek işareti). El yazısı iki satır
//    "Şurada bir QR olsa da / sipariş verebilsem…" (k446, k460; tam cümle k476–575, ~100 k). Balon ve satır k575'e dek kalır;
//    k576 kesme (s2-atolye).
// Kare hızları: karakter pozları 12 fps (ctx.adim), kamera / yazı / balon 60 fps, kaynama çekirdekte 8 fps.
// Kollar kol.js ile (A: dinlenme, iki kaldırış, sallama, indirme; garson: tepsi kolu + sarkık kol). Garsonun bacakları,
// önlüğü ve arkadan görünüşü bu modülde çizilir (insan.js yalnız önden baş-gövde çiziyor). Figüranlar SVG süzgeciyle
// kâğıda doğru açılır (opak kalır: arkalarındaki çizgi içlerinden görünmez).
// Sözleşme (v1-kanca kalıbı): kur(ctx) yalnız ctx.tl'ye MUTLAK kare zamanlı tween ekler; window'a bir şey yazmaz.
import { kisiSVG, govdeOlcusu, yol as yolCiz, rng } from '../insan.js';
import { kolSVG, omuzlar, govdeKes } from '../kol.js';
import { CIZIMLER } from './cizimler.js';

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, oval, W, H, DIKEY, PALET, MONO, BOY, GOZ_Y, VURGU, BALON, yer, adim, metin } = ctx;
  const M = PALET.murekkep;
  const BAS = 192, SON = 575;
  ctx.vurus(3, 'Kafe: A tek başına', BAS, 287);
  ctx.vurus(4, 'Bakar mısınız?', 288, 431);
  ctx.vurus(5, 'QR olsa…', 432, SON);

  const L = ctx.katman('s1-kafe', 10);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(BAS));
  tl.set(L.div, { autoAlpha: 0 }, k(SON + 1));
  const defs = el(L.svg, 'defs');
  // Figüran süzgeci: renkleri kâğıda doğru yarı yarıya açar (mürekkep orta gri olur), saydamlık değişmez
  {
    const f = el(defs, 'filter', { id: 's1-acik', 'color-interpolation-filters': 'sRGB', x: '-10%', y: '-10%', width: '120%', height: '120%' });
    const c = el(f, 'feComponentTransfer');
    [['R', 0.945], ['G', 0.929], ['B', 0.902]].forEach(([a, v]) => el(c, `feFunc${a}`, { type: 'linear', slope: 0.5, intercept: (0.5 * v).toFixed(3) }));
  }

  // ---------- Yerel yardımcılar
  let tohumSayac = 600;
  const T = () => tohumSayac++;
  // Düz kenarlı çokgen: kenarları eşit aralıklı noktalara böler (Catmull-Rom köşede kanca yapmasın, kenar düz kalsın)
  const kenarla = (pts, ad = 24, kapali = true) => {
    const out = [], n = pts.length;
    for (let i = 0; i < (kapali ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / ad));
      for (let j = 0; j < m; j++) out.push([a[0] + ((b[0] - a[0]) * j) / m, a[1] + ((b[1] - a[1]) * j) / m]);
    }
    if (!kapali) out.push(pts[n - 1]);
    return out;
  };
  const kutu = (x0, y0, x1, y1, ad = 24) => kenarla([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], ad);
  const poz = (n, f) => tl.call(f, null, k(adim(n))); // 12 fps poz ızgarası
  // Kutu birimli dizge çizimleri (insan.js titreşimi + kaynama): garsonun alt gövdesi, arkadan görünüşü, tepsi
  function araclar(tohum, i, genlik = 1) {
    const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + i * 1013 + 1);
    const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
    let n = 0;
    const s = () => { const t0 = (n++ * 37) % 400; return { sap: (j, e) => (a[(t0 + j * 2 + e) % 512] + b[(t0 + j * 2 + e + 3) % 512]) * genlik }; };
    const cz = (pts, w = 4.2, renk = M, kapali = false) => `<path d="${yolCiz(pts, kapali, s())}" fill="none" stroke="${renk}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const sk = (pts, dolgu, w = 4.2, kay = [3, 3]) => { const d = yolCiz(pts, true, s()); return `<path d="${d}" fill="${dolgu}" transform="translate(${kay[0]} ${kay[1]})"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; };
    return { cz, sk };
  }
  const svgKutu = (x, ust, o) => ({ viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * o, height: BOY.boy * o, x: x - (BOY.en * o) / 2, y: ust, overflow: 'visible' });
  let kaynaSon = 0; // çekirdeğin son kaynama indisi (poz değişiminde aynı çizimle yeniden çizmek için)
  ctx.kaynayanlar.add((i) => { kaynaSon = i; });

  // ---------- Yerleşim (genel planda kamera ölçek 1: dünya = ekran). A önde solda tek başına; garson arkada iki konuşan
  // masanın arasında, yalnız yana (masalara) eğilir ya da arkasını döner: hiçbir anda A'ya dönük değil.
  // menu: duvardaki kara tahta menü (tezgâhın üstünde); adim: garsonun #4'te sağ masaya attığı adım (px)
  const P = yer({
    duvar: 600, lamba: { x: 640, ip: 196 },
    tezgah: { x0: 860, x1: 1480, ust: 450, alt: 670, makine: [930, 1134] }, menu: [952, 112, 1196, 286],
    masaL: { kisiler: [212, 356], o: 0.44, goz: 452, yon: [-1, -0.3] }, masaR: { kisiler: [1682, 1826], o: 0.44, goz: 452, yon: [0.3, -0.3] },
    garson: { x: 1350, ayak: 880, o: 0.54, adim: 24, egil: 8, cikis: [2090, 850] },
    A: { x: 640, o: 0.92, masa: 862 }, masa: { yari: 290, derin: 48, etek: 66 },
    konus1: { x: 812, y: 436, boyut: 50 }, konus2: { x: 800, y: 412, boyut: 62 },
    balon: { c: [1180, 318], r: [440, 205] }, ic: { yazi: 44, yx: -0.6, yy: -0.82, qb: 0.9, qx: -0.22, qy: 0.28, tx: 1.17, ty: -0.36 },
  }, {
    duvar: 860, lamba: { x: 440, ip: 150 },
    tezgah: { x0: 350, x1: 750, ust: 690, alt: 900, makine: [376, 536] }, menu: [356, 300, 632, 492],
    masaL: { kisiler: [100, 228], o: 0.44, goz: 700, yon: [0.3, 1] }, masaR: { kisiler: [852, 980], o: 0.44, goz: 700, yon: [0.8, -0.3] },
    garson: { x: 620, ayak: 1140, o: 0.5, adim: 0, egil: 6, cikis: [1260, 1120] },
    A: { x: 440, o: 1.0, masa: 1640 }, masa: { yari: 300, derin: 54, etek: 76 },
    konus1: { x: 612, y: 1222, boyut: 50 }, konus2: { x: 598, y: 1166, boyut: 60 },
    balon: { c: [540, 760], r: [370, 260] }, ic: { yazi: 48, yx: -0.66, yy: -0.7, qb: 0.72, qx: -0.24, qy: 0.33, tx: 1.18, ty: -0.42 },
  });

  // ---------- Arka plan (devirde kâğıttan belirir): duvar dibi, tezgâh + makine, figüran masaları, garson, lamba
  const arka = el(L.svg, 'g');
  gsap.set(arka, { opacity: 0 });
  tl.set(arka, { opacity: 0 }, k(BAS));
  tl.to(arka, { opacity: 1, duration: k(22), ease: 'power1.in' }, k(BAS + 2));
  cizgi(arka, [[-500, P.duvar], [W * 0.5, P.duvar - 2], [W + 500, P.duvar]], { kalinlik: 3, tohum: T(), genlik: 0.8, renk: MONO.sac[3] });
  const tz = P.tezgah;
  const tezgahG = el(arka, 'g');
  const menuG = el(tezgahG, 'g');
  {
    // Tezgâh: ön yüz (dikey panel çizgileri) + üst tabla; makine tablanın solunda, fincan kulesi sağında
    cizgi(tezgahG, [[tz.x0 + 30, tz.alt + 8], [tz.x1 - 30, tz.alt + 8]], { kalinlik: 14, renk: M, tohum: T(), genlik: 0.4 }).g.setAttribute('opacity', 0.08);
    cizgi(tezgahG, kutu(tz.x0, tz.ust + 14, tz.x1, tz.alt, 30), { kapali: true, dolgu: MONO.giysi[6], kalinlik: 3.6, tohum: T() });
    const n = Math.round((tz.x1 - tz.x0) / 120);
    for (let i = 1; i < n; i++) { const x = tz.x0 + ((tz.x1 - tz.x0) * i) / n; cizgi(tezgahG, [[x, tz.ust + 36], [x, tz.alt - 16]], { kalinlik: 2.6, tohum: T(), genlik: 0.6, renk: MONO.giysi[4] }); }
    cizgi(tezgahG, kutu(tz.x0 - 16, tz.ust, tz.x1 + 16, tz.ust + 16, 30), { kapali: true, dolgu: MONO.giysi[3], kalinlik: 3.6, tohum: T() });
    const [mx0, mx1] = tz.makine, my1 = tz.ust, my0 = my1 - (mx1 - mx0) * 0.6;
    cizgi(tezgahG, kenarla([[mx0, my1], [mx0, my0 + 18], [mx0 + 18, my0], [mx1 - 18, my0], [mx1, my0 + 18], [mx1, my1]], 22), { kapali: true, dolgu: MONO.giysi[2], kalinlik: 3.6, tohum: T() });
    // Espresso makinesi okunsun (ekmek kızartma makinesi değil): üstte ters fincanlar (ısıtıcı), önde iki basınç saati
    for (let i = 0; i < 3; i++) {
      const cx0 = mx0 + (mx1 - mx0) * (0.3 + i * 0.2);
      cizgi(tezgahG, kenarla([[cx0 - 13, my0 - 1], [cx0 + 13, my0 - 1], [cx0 + 10, my0 - 20], [cx0 - 10, my0 - 20]], 10), { kapali: true, dolgu: MONO.giysi[0], kalinlik: 2.8, tohum: T(), genlik: 0.6 });
    }
    for (const u of [0.36, 0.64]) {
      const gx0 = mx0 + (mx1 - mx0) * u, gy0 = my0 + 25;
      cizgi(tezgahG, oval(gx0, gy0, 13, 13, 0, 360, 12), { kapali: true, dolgu: BALON, kalinlik: 3, tohum: T(), genlik: 0.5 });
      cizgi(tezgahG, [[gx0, gy0], [gx0 + 7, gy0 - 6]], { kalinlik: 2.6, tohum: T(), genlik: 0.3 });
    }
    const gw = (mx1 - mx0) / 4;
    for (const u of [1.25, 2.75]) {
      const gx0 = mx0 + gw * u;
      cizgi(tezgahG, kutu(gx0 - 15, my0 + 44, gx0 + 15, my0 + 58, 10), { kapali: true, dolgu: MONO.sac[1], kalinlik: 3, tohum: T() });
      cizgi(tezgahG, [[gx0 + 12, my0 + 52], [gx0 + 40, my0 + 48]], { kalinlik: 5, tohum: T(), genlik: 0.5 }); // portafiltre sapı
      cizgi(tezgahG, kutu(gx0 - 11, my1 - 24, gx0 + 11, my1 - 2, 8), { kapali: true, dolgu: MONO.giysi[0], kalinlik: 3, tohum: T() }); // fincan
    }
    cizgi(tezgahG, [[mx1 - 6, my0 + 40], [mx1 + 16, my1 - 40], [mx1 + 14, my1 - 14]], { kalinlik: 3.4, tohum: T(), genlik: 0.6 }); // buhar çubuğu
    const fx = mx1 + 52;
    for (let i = 0; i < 3; i++) cizgi(tezgahG, kutu(fx - 20 + i * 2, tz.ust - 24 * (i + 1), fx + 20 - i * 2, tz.ust - 24 * i - 2, 10), { kapali: true, dolgu: i % 2 ? MONO.giysi[0] : MONO.giysi[6], kalinlik: 3, tohum: T() });
    // Duvarda kara tahta menü: okunmaz tebeşir karalamaları (menü var, siparişi alan yok)
    const [b0, b1, b2, b3] = P.menu;
    cizgi(menuG, kutu(b0, b1, b2, b3, 26), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 3.6, tohum: T() });
    cizgi(menuG, kutu(b0 + 10, b1 + 10, b2 - 10, b3 - 10, 26), { kapali: true, kalinlik: 2.4, tohum: T(), genlik: 0.5, renk: MONO.giysi[4] });
    const bw = b2 - b0, bh = b3 - b1;
    const tebesir = (x0, y0, w) => { const n = Math.max(3, Math.round(w / 18)); return Array.from({ length: n }, (_, q) => [x0 + (w * q) / (n - 1), y0 + (q % 2 ? -3 : 3)]); };
    cizgi(menuG, tebesir(b0 + bw * 0.3, b1 + bh * 0.22, bw * 0.4), { kalinlik: 3.4, tohum: T(), genlik: 0.7, renk: MONO.giysi[0] });
    for (let i = 0; i < 4; i++) {
      const y = b1 + bh * (0.42 + i * 0.14);
      cizgi(menuG, tebesir(b0 + bw * 0.14, y, bw * (0.44 - (i % 2) * 0.1)), { kalinlik: 2.4, tohum: T(), genlik: 0.6, renk: MONO.giysi[1] });
      cizgi(menuG, [[b2 - bw * 0.22, y], [b2 - bw * 0.12, y]], { kalinlik: 2.4, tohum: T(), genlik: 0.5, renk: MONO.giysi[1] });
    }
  }

  // ---------- Masa (önden, hafif üstten): örtülü tabla (arka kenar dar, ön kenar geniş), örtünün ön düşüşü, kıvrımlar
  function masa(ust, x, y, yari, derin, { kal = 4.5, etek = 200, kivrim = 3, golge = true } = {}) {
    const g = el(ust, 'g');
    const yA = yari * 0.9, alt = y + derin + etek;
    if (golge) cizgi(g, oval(x, alt + 4, yari * 1.02, 10, 0, 360, 16, 2), { kapali: true, dolgu: M, kalinlik: 0.1, tohum: T(), kay: [0, 0] }).g.setAttribute('opacity', 0.07);
    // örtünün ön düşüşü; etek ucu hafif dalgalı (kıvrımlar etekte açılır)
    const etekUc = Array.from({ length: 9 }, (_, i) => [x + yari + 6 - ((2 * yari + 12) * i) / 8, alt + (i % 2 ? 5 : 0)]);
    cizgi(g, [...kenarla([[x - yari, y + derin], [x + yari, y + derin]], 26, false), ...kenarla([[x + yari, y + derin], [x + yari + 6, alt]], 26, false).slice(1, -1), ...etekUc, ...kenarla([[x - yari - 6, alt], [x - yari, y + derin]], 26, false).slice(1, -1)], { kapali: true, dolgu: MONO.giysi[6], kalinlik: kal, tohum: T() });
    for (let i = 1; i <= kivrim; i++) {
      const u = -1 + (2 * i) / (kivrim + 1), xx = x + u * yari * 0.92;
      cizgi(g, [[xx, y + derin + etek * 0.35], [xx + u * 4, alt - 2]], { kalinlik: kal * 0.55, tohum: T(), genlik: 0.6, renk: MONO.giysi[4] });
    }
    cizgi(g, kenarla([[x - yA, y], [x + yA, y], [x + yari, y + derin], [x - yari, y + derin]], 26), { kapali: true, dolgu: MONO.giysi[0], kalinlik: kal, tohum: T() });
    return { g, kose: [x + yA, y], onKose: [x + yari, y + derin] };
  }

  // ---------- Figüranlar: iki masa, 2+2 genç (süzgeçle açık gri, sade). Yan yana oturur, birbirine bakar, sırayla konuşur:
  // konuşanın minik balonunda karalama, başı 12 fps'te sallanır, dinleyen gülümser.
  const FIG = [
    { tohum: 611, kadin: true, yas: 'genc', sacStil: 'bob', sac: 3, ten: 1, giysi: 6, yaka: 'v', gozluk: null, sakal: null, kupe: true },
    { tohum: 612, kadin: false, yas: 'genc', sacStil: 'yan', sac: 2, ten: 3, giysi: 1, yaka: 'kapusonlu', sakal: 'kirli', gozluk: null, kupe: false },
    { tohum: 613, kadin: false, yas: 'genc', sacStil: 'kisa', sapka: 'bere', bereRenk: 4, sac: 3, ten: 2, giysi: 0, yaka: 'bisiklet', gozluk: null, sakal: null, kupe: false },
    { tohum: 614, kadin: true, yas: 'genc', sacStil: 'topuz', sac: 4, ten: 0, giysi: 7, yaka: 'balikci', gozluk: 'yuvarlak', sakal: null, kupe: false },
  ].map((p) => ctx.rastgeleKisi(p.tohum, p));
  function figuranMasa(m, ps, tohum) {
    const g = el(arka, 'g', { filter: 'url(#s1-acik)' });
    const o = m.o, b = o / 0.44; // b: 0,44 ölçeğine göre çarpan
    const ust = m.goz - GOZ_Y * o, masaY = ust + 540 * o, x = (m.kisiler[0] + m.kisiler[1]) / 2;
    const kisiler = ps.map((p, j) => {
      const h = ctx.kisi(g, p, { x: m.kisiler[j], alt: ust + BOY.boy * o, olcek: o });
      h.poz({ ifade: 'notr', bakis: [j ? -1 : 1, 0] });
      return h;
    });
    masa(g, x, masaY, (m.kisiler[1] - m.kisiler[0]) * 0.98, 24 * b, { kal: 3.4, etek: P.duvar + 60 * b - masaY - 24 * b, kivrim: 2 });
    for (const [j, xk] of m.kisiler.entries()) {
      const fx = xk + (j ? -30 : 30) * b, fy = masaY + 6 * b, yon = j ? -1 : 1;
      cizgi(g, kutu(fx - 11 * b, fy - 20 * b, fx + 11 * b, fy, 8), { kapali: true, dolgu: MONO.giysi[6], kalinlik: 3, tohum: T() });
      cizgi(g, [[fx + 11 * b * yon, fy - 15 * b], [fx + 19 * b * yon, fy - 11 * b], [fx + 11 * b * yon, fy - 6 * b]], { kalinlik: 2.6, tohum: T(), genlik: 0.5 });
    }
    // Minik konuşma balonları: içinde karalama (okunmaz söz), kuyruk konuşanın ağzına
    const balonlar = kisiler.map((h, j) => {
      const [gx, gy] = h.goz, yon = m.yon ? m.yon[j] : j ? 1 : -1; // yon: balonun yana kayması (kadraja sığsın; A'nın kalkan eline, garsonun tepsisine binmesin)
      const bx = gx + yon * 64 * b, by = gy - 92 * b, bw = 44 * b, bh = 25 * b;
      const bg = el(g, 'g');
      const agiz = [gx + yon * 12 * b, gy + 20 * b];
      el(bg, 'path', { d: `M${bx - yon * bw * 0.3} ${by + bh * 0.5} L${agiz[0]} ${agiz[1]} L${bx + yon * bw * 0.15} ${by + bh * 0.7}Z`, fill: BALON, stroke: M, 'stroke-width': 2.6, 'stroke-linejoin': 'round' });
      cizgi(bg, oval(bx, by, bw, bh, 0, 360, 18, 4), { kapali: true, dolgu: BALON, kalinlik: 3, tohum: tohum + j * 3, genlik: 0.7, kay: [0, 0] });
      const kar = (yy, w) => Array.from({ length: 6 }, (_, q) => [bx - w + (2 * w * q) / 5, yy + (q % 2 ? -4 : 4) * b]);
      cizgi(bg, kar(by - 6 * b, bw * 0.62), { kalinlik: 2.8, tohum: tohum + j * 3 + 1, genlik: 0.8 });
      cizgi(bg, kar(by + 8 * b, bw * 0.4), { kalinlik: 2.8, tohum: tohum + j * 3 + 2, genlik: 0.8 });
      gsap.set(bg, { autoAlpha: 0, scale: 0.5, svgOrigin: `${agiz[0]} ${agiz[1]}` });
      return bg;
    });
    return { g, kisiler, balonlar, masaY };
  }
  const tL = figuranMasa(P.masaL, [FIG[0], FIG[1]], 701);
  const tR = figuranMasa(P.masaR, [FIG[2], FIG[3]], 711);
  // Sohbet: [konuşan (0|1), başla, bitir]; konuşan başını 12 fps'te sallar, dinleyen 'merak' / 'mutlu'
  function sohbet(t, sira) {
    for (const [j, a, b] of sira) {
      const kon = t.kisiler[j], din = t.kisiler[1 - j], bal = t.balonlar[j];
      tl.fromTo(bal, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: k(6), ease: E.BO, immediateRender: false }, k(a));
      tl.to(bal, { autoAlpha: 0, scale: 0.8, duration: k(5), ease: E.EI }, k(b - 5));
      poz(a, () => { kon.poz({ ifade: 'mutlu' }); din.poz({ ifade: 'merak' }); });
      for (let n = adim(a); n < b - 5; n += 10) {
        tl.set(kon.g, { y: -3 }, k(n));
        tl.set(kon.g, { y: 0 }, k(n + 5));
      }
      poz(b, () => { kon.poz({ ifade: 'notr' }); din.poz({ ifade: 'notr' }); });
    }
  }
  // #5'te arka plan susar (A'nın iç sesi öne çıkar): son minik balonlar k432 civarında kapanır, sonra yalnız bakışlar
  sohbet(tL, [[0, 196, 236], [1, 244, 290], [0, 298, 330], [1, 338, 384], [0, 394, 432]]);
  // Sağ masa garsonla konuşur: garsona yakın olanın (0) minik balonu ona doğru açılır; A seslenirken (k300) de konuşuyor
  sohbet(tR, [[1, 214, 250], [0, 258, 296], [0, 304, 356], [1, 364, 402], [0, 410, 436]]);
  for (const [t, n, j] of [[tL, 470, 0], [tR, 500, 1], [tL, 530, 1], [tR, 545, 0]]) poz(n, () => t.kisiler[j].poz({ ifade: 'mutlu' }));

  // ---------- Garson (kadro.json Garson: uzun, zayıf, önlüklü). Önden: insan.js baş-gövde (bele dek kırpılır) + kol.js
  // kolları (sol elinde, ekranın sağında, omuz hizasında tepsi; öbür kol sarkık) + bu modülde bacak, uzun önlük, ayakkabı.
  // Arkadan: baş arkası (kazınmış yanlar, üstte saç), gömlek sırtı, önlük bağı ve fiyonk; tepsi kolu ekranın soluna geçer.
  const Gp = ctx.kisiParam('Garson');
  const gOl = govdeOlcusu(Gp);
  const gKalin = 52;
  // kol.js omuzlar() orta gövdeyi varsayar: zayıf ve uzun gövdede omuz x = 200 ± (160·en − r + 2), y + boyunEk
  const gOmuz = (() => {
    const o = omuzlar(Gp, { kalinlik: gKalin }), dx = 160 * gOl.en - gKalin / 2 + 2;
    return { sol: [200 - dx, o.sol[1] + gOl.boyunEk], sag: [200 + dx, o.sag[1] + gOl.boyunEk], omuzY: o.omuzY + gOl.boyunEk, ceneY: o.ceneY };
  })();
  const GIYSI = MONO.giysi[Gp.giysi], TEN = MONO.ten[Gp.ten], ONLUK = MONO.giysi[0], PANTOLON = MONO.sac[1];
  const BEL = 600, ONLUK_ALT = 960, BILEK = 1250, TABAN = 1272;
  function tepsi(ar, [x, y]) {
    // tepsi (yassı elips) + iki bardak; (x, y) tepsinin alt merkezi
    let s = ar.sk(oval(x, y - 8, 92, 14, 0, 360, 18, 2.4), MONO.giysi[3], 4);
    for (const dx of [-36, 24]) s += ar.sk(kenarla([[x + dx - 14, y - 56], [x + dx + 14, y - 56], [x + dx + 11, y - 14], [x + dx - 11, y - 14]], 14), MONO.giysi[6], 3.6) + ar.cz([[x + dx - 12, y - 44], [x + dx + 12, y - 44]], 2.6);
    return s;
  }
  // kalk: yürüyüşte topuğu kalkan bacak (−1 ekranın solu, 1 sağı, 0 ikisi yerde); kalkan bacak kısalır, ayakkabı yükselir
  function bacaklar(ar, arka, kalk = 0) {
    const cx = 200;
    let s = '';
    for (const yon of [-1, 1]) {
      const d = yon === kalk ? -34 : 0;
      s += ar.sk(kenarla([[cx + yon * 6, BEL - 30], [cx + yon * 86, BEL - 30], [cx + yon * 70, BILEK + d], [cx + yon * 20, BILEK + 4 + d]], 40), PANTOLON);
    }
    for (const yon of [-1, 1]) {
      const d = yon === kalk ? -34 : 0;
      s += arka ? ar.sk(oval(cx + yon * 45, BILEK + 12 + d, 30, yon === kalk ? 10 : 14, 0, 360, 12), M, 3)
        : ar.sk(kenarla([[cx + yon * 18, BILEK - 2], [cx + yon * 74, BILEK], [cx + yon * 90, BILEK + 20], [cx + yon * 22, BILEK + 22]], 16), M, 3);
    }
    return s;
  }
  function onluk(ar, arka) {
    const cx = 200;
    if (!arka) {
      let s = ar.sk(kenarla([[cx - 96, BEL - 34], [cx + 96, BEL - 34], [cx + 112, ONLUK_ALT], [cx - 112, ONLUK_ALT]], 40), ONLUK); // uzun önlük
      s += ar.cz([[cx - 96, BEL - 18], [cx + 96, BEL - 18]], 3); // bel bağı
      s += ar.cz(kenarla([[cx - 82, BEL + 56], [cx - 24, BEL + 56], [cx - 22, BEL + 114], [cx - 80, BEL + 114]], 20), 3, M, true); // cep
      s += ar.sk(kenarla([[cx - 70, BEL + 20], [cx - 63, BEL + 20], [cx - 64, BEL + 66], [cx - 71, BEL + 66]], 14), MONO.sac[0], 2.4); // cepte kalem
      return s;
    }
    let s = '';
    for (const yon of [-1, 1]) s += ar.sk(kenarla([[cx + yon * 82, BEL - 30], [cx + yon * 104, BEL - 30], [cx + yon * 114, ONLUK_ALT], [cx + yon * 90, ONLUK_ALT]], 40), ONLUK, 3.6); // önlüğün yanları
    s += ar.sk(kenarla([[cx - 104, BEL - 36], [cx + 104, BEL - 36], [cx + 104, BEL - 20], [cx - 104, BEL - 20]], 30), ONLUK, 3.4); // bel bağı
    s += ar.sk([[cx, BEL - 28], [cx - 30, BEL - 48], [cx - 38, BEL - 14], [cx, BEL - 28], [cx + 30, BEL - 48], [cx + 38, BEL - 14]], ONLUK, 3.2); // fiyonk
    s += ar.cz([[cx - 4, BEL - 24], [cx - 16, BEL + 44]], 3.2) + ar.cz([[cx + 4, BEL - 24], [cx + 14, BEL + 50]], 3.2); // uçlar
    return s;
  }
  function garsonKollar(arka, i) {
    // önde tepsi ekranın sağında (garsonun sol eli); arkadan dönünce aynı el ekranın soluna geçer
    const tT = arka ? 'sol' : 'sag', sT = arka ? 'sag' : 'sol';
    const o1 = gOmuz[tT], o2 = gOmuz[sT], y1 = tT === 'sol' ? -1 : 1, y2 = -y1;
    const ortak = { giysi: GIYSI, ten: TEN, kalinlik: gKalin, kaynama: i, manset: 'gomlek', govdeX: 200 };
    const bilek = [o1[0] + y1 * 94, o1[1] - 124];
    const kol1 = kolSVG({ ...ortak, omuz: o1, dirsek: [o1[0] + y1 * 92, o1[1] + 32], bilek, el: 'dayanma', elAci: y1 > 0 ? -12 : 192, kisalma: 0.5, elBoy: 100, taraf: tT, tohum: arka ? 61 : 51 });
    const kol2 = kolSVG({ ...ortak, omuz: o2, dirsek: [o2[0] + y2 * 12, o2[1] + 160], bilek: [o2[0] + y2 * 8, o2[1] + 300], el: 'acik', elAci: 90 + y2 * 4, elBoy: 100, taraf: sT, tohum: arka ? 62 : 52 });
    return { kol1, kol2, tepsi: tepsi(araclar(arka ? 643 : 633, i), [bilek[0] + y1 * 14, bilek[1] - 10]) };
  }
  function garsonArkaBas(ar) {
    // Baş arkası: yüz ovaliyle aynı ölçü; kulaklar iki yanda, ense; üstte saç kütlesi, yanlar ve ense kazınmış (noktalı ton)
    const cx = 200, cy = GOZ_Y + 4, hw = Gp.yuzEn * 0.96, hh = Gp.yuzBoy, tepe = cy - 6 - hh;
    let s = ar.sk([[cx - hw * 0.4, gOmuz.ceneY - 30], [cx - hw * 0.44, gOmuz.ceneY + 30], [cx + hw * 0.44, gOmuz.ceneY + 30], [cx + hw * 0.4, gOmuz.ceneY - 30]], TEN);
    for (const yon of [-1, 1]) s += ar.sk([[cx + yon * (hw - 4), cy - 10], [cx + yon * (hw + 12), cy - 8], [cx + yon * (hw + 14), cy + 10], [cx + yon * (hw + 4), cy + 22]], TEN, 3.6);
    s += ar.sk(oval(cx, cy - 6, hw, hh, 0, 360, 22, Gp.ust), TEN);
    s += `<path d="${yolCiz(oval(cx, cy - 4, hw - 4, hh - 6, 180, 360, 12, Gp.ust).concat([[cx + hw - 6, cy + hh * 0.5], [cx, cy + hh * 0.62], [cx - hw + 6, cy + hh * 0.5]]), true, { sap: () => 0 })}" fill="${MONO.sac[Gp.sac]}" opacity="0.24"/>`;
    const Rn = rng(77);
    for (let n = 0; n < 46; n++) {
      const x = cx + (Rn() - 0.5) * hw * 1.7, y = cy - hh * 0.2 + Rn() * hh * 0.7;
      if (((x - cx) / hw) ** 2 + ((y - cy) / hh) ** 2 < 0.8) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="${M}" opacity="0.4"/>`;
    }
    s += ar.sk([[cx - hw * 0.7, cy - hh * 0.62], [cx - hw * 0.62, tepe - 18], [cx, tepe - 30], [cx + hw * 0.66, tepe - 18], [cx + hw * 0.76, cy - hh * 0.6], [cx + hw * 0.4, cy - hh * 0.16], [cx - hw * 0.3, cy - hh * 0.18]], MONO.sac[Gp.sac]);
    s += ar.cz([[cx - hw * 0.3, tepe - 10], [cx, cy - hh * 0.5], [cx + hw * 0.2, cy - hh * 0.26]], 2.4) + ar.cz([[cx + hw * 0.32, tepe - 8], [cx + hw * 0.3, cy - hh * 0.52], [cx + hw * 0.5, cy - hh * 0.3]], 2.4);
    return s;
  }
  function garsonArkaGovde(ar) {
    const cx = 200, gY = gOmuz.ceneY + 8, oy = gOmuz.omuzY;
    let s = ar.sk(kenarla([[cx - 40, gY + 6], [cx - 100, oy + 18], [cx - 108, oy + 70], [cx - 98, BEL + 4], [cx + 98, BEL + 4], [cx + 108, oy + 70], [cx + 100, oy + 18], [cx + 40, gY + 6]], 40), GIYSI);
    s += ar.cz([[cx - 96, oy + 44], [cx, oy + 54], [cx + 96, oy + 44]], 3); // sırt boyunduruğu
    s += ar.cz([[cx, oy + 56], [cx + 2, BEL - 40]], 2.6, MONO.giysi[3]); // pli
    s += ar.sk(kenarla([[cx - 34, gY - 4], [cx + 34, gY - 4], [cx + 38, gY + 14], [cx - 38, gY + 14]], 14), GIYSI, 3.4); // yaka bandı
    return s;
  }
  const GO = P.garson.o, gUst = P.garson.ayak - TABAN * GO;
  const gAyak = [P.garson.x, P.garson.ayak];
  const g0 = el(arka, 'g'); // yürüyüş (konum, ölçek)
  cizgi(g0, oval(gAyak[0], gAyak[1] + 2, 64 * GO / 0.54, 9, 0, 360, 14, 2), { kapali: true, dolgu: M, kalinlik: 0.1, tohum: T(), kay: [0, 0] }).g.setAttribute('opacity', 0.08);
  const gSar = el(g0, 'g'); // eğilme, dönüş
  const gSvg = el(gSar, 'svg', svgKutu(gAyak[0], gUst, GO));
  const G = { arka: false, kalk: 0, ifade: 'merak', bakis: [1, 1] };
  // Önden: gövde (bele dek kırpılı) → bacaklar → önlük (bele bağlı, gövdenin önünde) → kollar → tepsi.
  // Arkadan: bacaklar → sırt → önlük bağı ve fiyonk → baş → kollar → tepsi
  function garsonCiz(i = kaynaSon) {
    const ar = araclar(623, i);
    const kol = garsonKollar(G.arka, i);
    if (G.arka) {
      gSvg.innerHTML = bacaklar(ar, true, G.kalk) + garsonArkaGovde(ar) + onluk(ar, true) + garsonArkaBas(ar) + kol.kol2 + kol.kol1 + kol.tepsi;
      return;
    }
    const Gk = govdeKes(Gp, { id: 's1-garson', kaynama: i, gogus: 92, tohum: Gp.tohum });
    const kisi = kisiSVG(Gp, { kaynama: i, ifade: G.ifade, bakis: G.bakis, mono: true });
    gSvg.innerHTML = `<defs><clipPath id="s1-garson-bel" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + BEL}"/></clipPath></defs>` +
      `<g clip-path="url(#s1-garson-bel)">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}</g>` + bacaklar(ar, false) + onluk(ar, false) + kol.kol2 + kol.kol1 + kol.tepsi;
  }
  const garsonPoz = (o) => { Object.assign(G, o); garsonCiz(); };
  garsonCiz(0);
  ctx.kaynayanlar.add((i) => garsonCiz(i));
  // Eğilme: ayak çevresinde dönüş (sol masaya −, sağ masaya +); 12 fps, 2 adım
  const egil = (n, aci) => tl.to(gSar, { rotation: aci, svgOrigin: `${gAyak[0]} ${gAyak[1]}`, duration: k(10), ease: 'steps(2)' }, k(adim(n)));
  tl.set(gSar, { rotation: 4, scaleX: 1, svgOrigin: `${gAyak[0]} ${gAyak[1]}` }, k(BAS)); // sağ masaya eğik (A'ya hiç dönmez)
  tl.set(g0, { x: 0, y: 0, scale: 1, svgOrigin: `${gAyak[0]} ${gAyak[1]}` }, k(BAS));

  // ---------- Sarkan lamba (A'nın masasının üstünde)
  {
    const lx = P.lamba.x, ly = P.lamba.ip;
    cizgi(arka, [[lx, -500], [lx + 2, ly]], { kalinlik: 3, tohum: T(), genlik: 0.5 });
    cizgi(arka, kenarla([[lx - 22, ly], [lx + 22, ly], [lx + 76, ly + 62], [lx - 76, ly + 62]], 20), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 4, tohum: T() });
    cizgi(arka, oval(lx, ly + 64, 24, 12, 0, 180, 8), { kalinlik: 3.6, tohum: T(), dolgu: BALON });
  }

  // ---------- A (kahraman: en koyu, en ayrıntılı). Gövde masanın arkasında, kollar masanın önünde (aynı kutu düzlemi)
  const Ap = ctx.kisiParam('A');
  const Ao = P.A.o, MB = 540; // masa üstünün A'nın kutusundaki yüksekliği (birim)
  const aUst = P.A.masa - MB * Ao;
  const aVb = svgKutu(P.A.x, aUst, Ao);
  const aGoz = [P.A.x, aUst + GOZ_Y * Ao];
  // Sandalye (A'nın arkasında): sırtın iki dikmesi gövdenin iki yanından masanın üstüne taşar, üst kayıt gövdenin ardında.
  // Önden bakışta "oturuyor" işareti budur (yoksa A kürsünün ardında duruyor gibi okunur); ayaklar örtünün altında
  const sandalye = el(L.svg, 'g');
  gsap.set(sandalye, { opacity: 0 });
  tl.set(sandalye, { opacity: 0 }, k(BAS));
  tl.to(sandalye, { opacity: 1, duration: k(16), ease: 'none' }, k(BAS + 6));
  const SX = 236 * Ao, sUst = P.A.masa - 156 * Ao, AHSAP = MONO.sac[3];
  cizgi(sandalye, oval(P.A.x, sUst + 26 * Ao, SX + 4 * Ao, 22 * Ao, 180, 360, 14), { kalinlik: 12 * Ao, tohum: T(), genlik: 0.5, renk: M });
  cizgi(sandalye, oval(P.A.x, sUst + 26 * Ao, SX + 4 * Ao, 22 * Ao, 180, 360, 14), { kalinlik: 6 * Ao, tohum: T(), genlik: 0.5, renk: AHSAP });
  for (const yon of [-1, 1]) {
    const x = P.A.x + yon * SX, w = 9 * Ao;
    cizgi(sandalye, kenarla([[x - w, P.A.masa + 10], [x + w, P.A.masa + 10], [x + w + yon * 6 * Ao, sUst], [x - w + yon * 6 * Ao, sUst]], 24), { kapali: true, dolgu: AHSAP, kalinlik: 3.6, tohum: T() });
    cizgi(sandalye, oval(x + yon * 6 * Ao, sUst - 6 * Ao, 13 * Ao, 10 * Ao, 0, 360, 10), { kapali: true, dolgu: AHSAP, kalinlik: 3.4, tohum: T() });
  }
  const aG = el(L.svg, 'g');
  const aGovde = el(aG, 'svg', aVb);
  const masaA = el(L.svg, 'g');
  gsap.set(masaA, { opacity: 0 });
  tl.set(masaA, { opacity: 0 }, k(BAS));
  tl.to(masaA, { opacity: 1, duration: k(16), ease: 'none' }, k(BAS + 6)); // devirde kadraj dışında; geri çekilirken belirir
  // Örtünün altında: masanın tek ayağı ve tabanı, A'nın baldırları (oturuyor); gövde etekte kırpılır
  const etekY = P.A.masa + P.masa.derin + P.masa.etek;
  {
    const zemin = etekY + 320 * Ao;
    for (const yon of [-1, 1]) {
      const bx = P.A.x + yon * 62 * Ao;
      cizgi(masaA, kenarla([[bx - 26 * Ao, etekY - 30], [bx + 26 * Ao, etekY - 30], [bx + 22 * Ao + yon * 6, zemin - 30 * Ao], [bx - 22 * Ao + yon * 6, zemin - 30 * Ao]], 30), { kapali: true, dolgu: MONO.sac[3], kalinlik: 4.2, tohum: T() });
      cizgi(masaA, kenarla([[bx - 22 * Ao + yon * 6, zemin - 34 * Ao], [bx + 26 * Ao + yon * 20, zemin - 30 * Ao], [bx + 30 * Ao + yon * 24, zemin], [bx - 22 * Ao + yon * 6, zemin]], 14), { kapali: true, dolgu: M, kalinlik: 3, tohum: T() });
    }
    // sandalyenin ön ayakları (örtünün altından iki yana açılarak yere iner)
    for (const yon of [-1, 1]) {
      const x = P.A.x + yon * (SX - 30 * Ao);
      cizgi(masaA, kenarla([[x - 6 * Ao, etekY - 20], [x + 6 * Ao, etekY - 20], [x + 6 * Ao + yon * 26 * Ao, zemin], [x - 6 * Ao + yon * 26 * Ao, zemin]], 30), { kapali: true, dolgu: AHSAP, kalinlik: 3.4, tohum: T() });
    }
    const ax = P.A.x + 10;
    cizgi(masaA, [[ax, etekY - 10], [ax + 1, zemin - 14]], { kalinlik: 9, tohum: T(), genlik: 0.4 }); // ince metal ayak
    cizgi(masaA, kenarla([[ax - 86, zemin - 14], [ax + 86, zemin - 14], [ax + 96, zemin], [ax - 96, zemin]], 30), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 4, tohum: T() });
  }
  const ms = masa(masaA, P.A.x + 10, P.A.masa, P.masa.yari, P.masa.derin, { etek: P.masa.etek, golge: false });
  // Boş fincan tabağı + kaşık (çay YOK): masanın ortasında; sağ arka köşe boş (QR'ın yeri)
  {
    const fx = P.A.x + 64 * Ao / 0.92, fy = P.A.masa + P.masa.derin * 0.5;
    cizgi(masaA, oval(fx, fy, 50, 12, 0, 360, 18, 2.2), { kapali: true, dolgu: BALON, kalinlik: 3.6, tohum: T() });
    cizgi(masaA, oval(fx, fy - 1, 21, 5, 0, 360, 12, 2.2), { kapali: true, kalinlik: 2.6, tohum: T(), genlik: 0.5 });
    cizgi(masaA, [[fx + 30, fy - 3], [fx + 58, fy + 7], [fx + 84, fy + 11]], { kalinlik: 3.4, tohum: T(), genlik: 0.5 });
    cizgi(masaA, oval(fx + 24, fy - 5, 9, 5, 0, 360, 8), { kapali: true, dolgu: MONO.giysi[3], kalinlik: 2.6, tohum: T(), genlik: 0.4 });
  }
  const aKolG = el(L.svg, 'g');
  const aKol = el(aKolG, 'svg', aVb);
  const oA = omuzlar(Ap);
  const [sx, sy] = oA.sol, [dx] = oA.sag;
  // Kol pozları (A'nın kutu birimi). Kaldıran kol ekranın solunda (A'nın sağ eli): sağ yan balona ve garsona açık kalır
  const SOL = {
    dinlen: { dirsek: [sx - 26, MB + 6], bilek: [sx + 86, MB + 36], el: 'dayanma', elAci: 16, kisalma: 0.72, basparmak: -1 },
    kalk1a: { dirsek: [sx - 74, sy + 96], bilek: [sx - 92, sy - 26], el: 'acik', elAci: -104, yuz: 'avuc' },
    kalk1: { dirsek: [sx - 86, sy + 4], bilek: [sx - 92, sy - 136], el: 'acik', elAci: -96, yuz: 'avuc' },
    kalk2a: { dirsek: [sx - 66, sy - 74], bilek: [sx - 62, sy - 214], el: 'acik', elAci: -90, yuz: 'avuc' },
    kalk2: { dirsek: [sx - 52, sy - 104], bilek: [sx - 50, sy - 252], el: 'acik', elAci: -100, yuz: 'avuc' },
    salla: { dirsek: [sx - 52, sy - 104], bilek: [sx - 58, sy - 250], el: 'acik', elAci: -80, yuz: 'avuc' },
    ini1: { dirsek: [sx - 78, sy + 96], bilek: [sx - 70, sy - 20], el: 'acik', elAci: -98, yuz: 'avuc' },
  };
  const SAG = {
    dinlen: { dirsek: [dx + 26, MB + 6], bilek: [dx - 86, MB + 36], el: 'dayanma', elAci: 164, kisalma: 0.72, basparmak: 1 },
    kose: { dirsek: [dx + 40, MB + 4], bilek: [dx + 10, MB + 40], el: 'dayanma', elAci: 120, kisalma: 0.72, basparmak: 1 },
  };
  const A = { sol: null, sag: 'dinlen', ifade: 'merak', bakis: [0, 0] };
  function aCiz(i = kaynaSon) {
    const kisi = kisiSVG(Ap, { kaynama: i, ifade: A.ifade, bakis: A.bakis, mono: true });
    const kes = `<defs><clipPath id="s1-a-etek" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + (etekY - 24 - aUst) / Ao}"/></clipPath></defs>`;
    if (!A.sol) { aGovde.innerHTML = `${kes}<g clip-path="url(#s1-a-etek)">${kisi}</g>`; aKol.innerHTML = ''; return; }
    const Gk = govdeKes(Ap, { id: 's1-a', kaynama: i, tohum: Ap.tohum });
    aGovde.innerHTML = `${kes}<g clip-path="url(#s1-a-etek)">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}</g>`;
    const ortak = { giysi: MONO.giysi[Ap.giysi], ten: MONO.ten[Ap.ten], kaynama: i, manset: 'ribana' };
    aKol.innerHTML = kolSVG({ ...ortak, omuz: oA.sag, ...SAG[A.sag], taraf: 'sag', tohum: 22 }) + kolSVG({ ...ortak, omuz: oA.sol, ...SOL[A.sol], taraf: 'sol', tohum: 21 });
  }
  const aPoz = (o) => { Object.assign(A, o); aCiz(); };
  aCiz(0);
  ctx.kaynayanlar.add((i) => aCiz(i));
  const aKap = [aG, aKolG]; // gövde ve kollar birlikte kayar (doğrulma, çöküş)

  // ---------- Kamera. k192: v1'in son karesiyle aynı (göz W/2, hedefY; piksel ölçeği 1,9 × S × 1,02), sonra üstel geri çekilme
  const S1 = DIKEY ? 1.5 : 1.3, hedefY = H * (DIKEY ? 0.62 : 0.5);
  const c0 = (1.9 * S1 * 1.02) / Ao;
  const K0 = { scale: c0, x: W / 2 - c0 * aGoz[0], y: hedefY - c0 * aGoz[1] };
  const K1 = { scale: 1, x: 0, y: 0 };
  const odakK = (s, c) => ({ scale: s, x: W / 2 - s * c[0], y: H / 2 - s * c[1] });
  const kameraUstel = (n, sure, bas, son, ease = E.KM) => {
    const pr = { p: 0 };
    const uyg = () => {
      const s = bas.scale * Math.pow(son.scale / bas.scale, pr.p);
      const u = Math.abs(son.scale - bas.scale) < 1e-6 ? pr.p : (s - bas.scale) / (son.scale - bas.scale);
      gsap.set(ctx.kamera, { x: bas.x + (son.x - bas.x) * u, y: bas.y + (son.y - bas.y) * u, scale: s });
    };
    tl.fromTo(pr, { p: 0 }, { p: 1, duration: k(sure), ease, onUpdate: uyg, immediateRender: false }, k(n));
  };
  ctx.kameraKoy(BAS, K0);
  kameraUstel(BAS, 58, K0, K1);
  // Genel planda ölü kare yok: sahne ortası çevresinde %3 doğrusal itiş (#3 sonu ve #4 boyunca)
  const K4 = odakK(1.03, [W / 2, H / 2]);
  tl.fromTo(ctx.kamera, K1, { ...K4, duration: k(432 - 250), ease: 'none', immediateRender: false }, k(250));

  // ---------- Konuşma balonları (sesli söz): yüzün sağında, garsona doğru. Kuyruk ağız hizasında ağzı gösterir ama yüzün
  // ve halka küpenin dışında durur (kuyruk yanağın üstünden geçmesin)
  const agiz = [P.A.x + (Ap.yuzEn * 1.04 + 36) * Ao, aUst + (GOZ_Y + 4 + Ap.yuzBoy * 0.5) * Ao];
  const kb1 = ctx.konus(L, metin('Bakar mısınız?', 'Excuse me?'), { x: P.konus1.x, y: P.konus1.y, boyut: P.konus1.boyut, kuyruk: agiz, tohum: 731, aci: -2 });
  const kb2 = ctx.konus(L, metin('Bakar mısınız?!', 'Excuse me?!'), { x: P.konus2.x, y: P.konus2.y, boyut: P.konus2.boyut, kuyruk: agiz, tohum: 741, aci: -3 });
  // İkinci söz birinci balonu "şişirir": aynı kuyruk ucundan, daha büyük balon onun yerini alır (söz 166 k ekranda)
  // Caveat'in eğik "?" kıvrımı yazı kutusunun sağından taşar; yazma maskesi (clip-path, sağ %0) onu kesip "!" gibi
  // gösteriyordu. Kutuya sağ pay: maske kıvrımı da açar (balon ölçüsü konus() içinde önceden alındı, değişmez)
  for (const p of [kb1.p, kb2.p]) p.style.paddingRight = '0.3em';
  kb1.ac(300, 16); ctx.isaret(300, 'konusma'); kb1.kapat(372, 4);
  kb2.ac(372, 12); ctx.isaret(372, 'konusma'); kb2.kapat(426, 10); // düşünce balonu k432'de açılır: söz ondan önce söner

  // ---------- Düşünce balonu (#5) ve içi: masa köşesi, çadır QR standı, telefon + okutma çizgileri, vurgu halkası
  const BL = P.balon, bc = BL.c, br = BL.r;
  // Noktalar: A'nın başının sağ üstünden balonun sol altına (balon dış hattı kaynamasız çizilip örneklenir)
  const aBas = [P.A.x + 66 * Ao, aUst + 96 * Ao];
  const bal = (() => {
    const deneme = ctx.balon(defs, { c: bc, r: br, noktalar: [[bc[0], bc[1], 1]], tohum: 53 }); // yalnız ölçü için (boş nokta dizisi GSAP uyarısı verir)
    const yolE = deneme.kontur, uz = yolE.getTotalLength();
    let en = null;
    for (let s = 0; s <= uz; s += 6) { const p = yolE.getPointAtLength(s), d = Math.hypot(p.x - aBas[0], p.y - aBas[1]); if (!en || d < en.d) en = { d, p: [p.x, p.y] }; }
    deneme.g.remove();
    ctx.kaynayanlar.delete(deneme.ciz);
    const v = [en.p[0] - aBas[0], en.p[1] - aBas[1]];
    const noktalar = [[0.12, 8], [0.42, 12], [0.76, 17]].map(([t, r]) => [aBas[0] + v[0] * t, aBas[1] + v[1] * t, r * yer(1, 1.1)]);
    const koken = `${(((en.p[0] - (bc[0] - br[0])) / (2 * br[0])) * 100).toFixed(0)}% ${(((en.p[1] - (bc[1] - br[1])) / (2 * br[1])) * 100).toFixed(0)}%`;
    return ctx.balon(L.svg, { c: bc, r: br, noktalar, tohum: 53, koken });
  })();
  bal.ac(432);
  ctx.isaret(432, 'dusunce');
  // A iç sesine dalarken kafe kâğıda doğru solar (odak; kenarlarda yarım figüran yüzü göze batmasın)
  tl.to(arka, { opacity: yer(0.42, 0.3), duration: k(40), ease: 'power1.inOut' }, k(436));
  tl.to(menuG, { opacity: yer(0.4, 0.12), duration: k(40), ease: 'power1.inOut' }, k(436)); // dikeyde balonun üstünde yarım kalan tahta
  const ic = bal.ic;
  const IC = P.ic, qb = br[1] * IC.qb, qx = bc[0] + br[0] * IC.qx, qy = bc[1] + br[1] * IC.qy;
  // Masa köşesi (A'nın kendi masası, aynı tonlar): üst yüz (arka kenar, sağ yan, ön kenar) + ön kalınlık. Sol uç açık,
  // balonun içinde biter (çizgisiz). Kenarlar sık noktalı: düz kalır. QR standının tabanı üst yüzün ortasında durur.
  const mYb = qy + qb * 0.3, mYf = qy + qb * 0.52, mXl = bc[0] - br[0] * 0.48, mXb = qx + qb * 1.28, mXf = qx + qb * 1.42;
  const mKal = qb * 0.075, mXl2 = mXl - qb * 0.06;
  const masaUst = cizgi(ic, [...kenarla([[mXl, mYb], [mXb, mYb], [mXf, mYf]], 24, false), ...kenarla([[mXf, mYf], [mXl2, mYf]], 24, false).slice(1)], { dolgu: MONO.giysi[0], kalinlik: 4.5, tohum: T(), kay: [0, 0] });
  const masaKal = cizgi(ic, kenarla([[mXl2, mYf], [mXf, mYf], [mXf, mYf + mKal], [mXl2, mYf + mKal]], 24, false), { dolgu: MONO.giysi[6], kalinlik: 4, tohum: T(), kay: [0, 0] });
  // QR standı: cizimler.js'teki AYNI noktalar (finaldeki logo inşası bunları kullanır), ama kenarlar sık noktalanır:
  // çekirdeğin Catmull-Rom yumuşatması 4 köşeli yamuğu yumurtaya çevirmesin, düz kenarlı çadır stand okunsun
  const qr = CIZIMLER.qrStandi.map((kt, i) => {
    const pts = kt.p.map(([x, y]) => [qx + x * qb, qy + y * qb]);
    return cizgi(ic, kenarla(pts, Math.max(6, qb * 0.05), !!kt.kapali), { kapali: !!kt.kapali, kalinlik: 5, tohum: 40 + i, genlik: 1.0, dolgu: i === 0 ? BALON : null, kay: [0, 0] });
  });
  // Telefon (eğik, havada: okutuyor): koyu gövde, açık ekran, hoparlör yarığı; ekranda tarama çerçevesi; kenarından QR'a iki
  // kesikli çizgi. Masanın arka kenarına ve el yazısına değmez.
  const tx = qx + qb * IC.tx, ty = qy + qb * IC.ty, ta = -12 * Math.PI / 180;
  const don = (u, v) => [tx + u * Math.cos(ta) - v * Math.sin(ta), ty + u * Math.sin(ta) + v * Math.cos(ta)];
  const tw = qb * 0.22, th = qb * 0.4;
  const tel = cizgi(ic, kenarla([don(-tw, -th), don(tw, -th), don(tw, th), don(-tw, th)], 14), { kapali: true, dolgu: MONO.sac[2], kalinlik: 4.5, tohum: T() });
  const ekran = cizgi(ic, kenarla([don(-tw * 0.8, -th * 0.8), don(tw * 0.8, -th * 0.8), don(tw * 0.8, th * 0.86), don(-tw * 0.8, th * 0.86)], 12), { kapali: true, dolgu: BALON, kalinlik: 3, tohum: T(), kay: [0, 0] });
  const yarik = cizgi(ic, [don(-tw * 0.22, -th * 0.9), don(tw * 0.22, -th * 0.9)], { kalinlik: 3, tohum: T(), genlik: 0.3, renk: MONO.giysi[0] });
  const cerceve = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
    const u = tw * 0.42, v = th * 0.32, c = [a * u, b * v + th * 0.03];
    return cizgi(ic, [don(c[0], c[1] - b * v * 0.42), don(c[0], c[1]), don(c[0] - a * u * 0.42, c[1])], { kalinlik: 3.4, tohum: T(), genlik: 0.5 });
  });
  const isinUc = don(-tw * 1.02, th * 0.05);
  const isin = [[qx + qb * 0.16, qy - qb * 0.24], [qx + qb * 0.16, qy + qb * 0.04]].map((q) => {
    const h = cizgi(ic, [isinUc, q], { kalinlik: 3.2, tohum: T(), genlik: 0.4 });
    h.yol.setAttribute('stroke-dasharray', '10 9');
    return h;
  });
  // Vurgu halkası (dilek işareti): QR standının çevresinde, açık uçlu elle çekilmiş halka
  const HALKA = Array.from({ length: 27 }, (_, j) => {
    const a = (-120 + (400 * j) / 26) * Math.PI / 180, b = 1 + (0.08 * j) / 26;
    return [qx + Math.cos(a) * qb * 0.6 * b, qy + Math.sin(a) * qb * 0.56 * b];
  });
  const halka = cizgi(ic, HALKA, { renk: VURGU, kalinlik: 6, tohum: T(), genlik: 1.1 });

  // Balon içi çizimi: DrawSVG sırayla (çizilirken kaynama durur, bitince sürer: ucunda nokta kalmasın)
  function ciz(hs, k0, sure, { stagger = 1.2, ease = E.EO } = {}) {
    const yollar = hs.map((h) => h.yol), dolgular = hs.map((h) => h.dolgu).filter(Boolean);
    gsap.set(yollar, { drawSVG: '0%' }); tl.set(yollar, { drawSVG: '0%' }, k(BAS));
    if (dolgular.length) { gsap.set(dolgular, { autoAlpha: 0 }); tl.set(dolgular, { autoAlpha: 0 }, k(BAS)); tl.to(dolgular, { autoAlpha: 1, duration: k(6), ease: 'none' }, k(k0 + sure * 0.6)); }
    tl.call(() => hs.forEach((h) => { h.donuk = true; }), null, k(k0));
    tl.fromTo(yollar, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(sure), ease, stagger: k(stagger), immediateRender: false }, k(k0));
    const bit = Math.ceil(k0 + sure + stagger * (hs.length - 1) + 1);
    tl.set(yollar, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(bit));
    tl.call(() => hs.forEach((h) => { h.donuk = false; h.ciz(); }), null, k(bit));
    return bit;
  }
  // Kesikli çizgiler DrawSVG ile çizilmez (kesik düz çizgiye döner): belirerek gelir, 12 fps'te kayar (tarama)
  for (const h of isin) { gsap.set(h.g, { autoAlpha: 0 }); tl.set(h.g, { autoAlpha: 0 }, k(BAS)); }
  ciz([masaUst, masaKal], 444, 10, { stagger: 2 });
  ciz(qr, 450, 9, { stagger: 1.1 });
  ciz([tel, ekran, yarik, ...cerceve], 466, 9, { stagger: 1.2 });
  tl.to(isin.map((h) => h.g), { autoAlpha: 1, duration: k(6), ease: 'none', stagger: k(2) }, k(480));
  tl.fromTo(isin.map((h) => h.yol), { strokeDashoffset: 0 }, { strokeDashoffset: -19 * 16, duration: k(SON + 1 - 480), ease: 'steps(16)', immediateRender: false }, k(480));
  const halkaBit = ciz([halka], 490, 16, { ease: 'power1.inOut' });
  ctx.isaret(halkaBit, 'vurgu');

  // El yazısı (iç ses): balonun üst yarısında iki satır; balon oturduktan sonra yazılır
  const yb = IC.yazi, yaziX = bc[0] + br[0] * IC.yx, yaziY = bc[1] + br[1] * IC.yy;
  const satir1 = ctx.elYazisi(L.div, metin('Şurada bir <b>QR</b> olsa da', 'If only there were'), { x: yaziX, y: yaziY, boyut: yb, aci: -2 });
  const satir2 = ctx.elYazisi(L.div, metin('sipariş verebilsem…', 'a <b>QR</b> to order…'), { x: yaziX + yb * 0.9, y: yaziY + yb * 1.08, boyut: yb, aci: -2 });
  for (const p of [satir1, satir2]) p.style.paddingRight = '0.3em';
  // satırlar hızlı yazılır: tam cümle k476'dan k575'e ~100 k ekranda (6 kelime)
  ctx.yazElYazisi(satir1, 446, 18);
  ctx.yazElYazisi(satir2, 460, 16);

  // #5 kamera: A'ya ve balona yaklaşma (60 k KM, üstel), sonra yavaş %2 itiş. Kadraj, balonun gerçek dış hattı (örneklenmiş,
  // tümsekler dahil) ile A'nın başı + masanın sağ köşesini birlikte, itişin sonunda da 32 px payla içine alacak biçimde hesaplanır.
  {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    const ekle = (x, y) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); };
    const yolE = bal.kontur, uz = yolE.getTotalLength();
    for (let s2 = 0; s2 <= uz; s2 += 6) { const p = yolE.getPointAtLength(s2); ekle(p.x, p.y); }
    ekle(P.A.x - P.masa.yari - 10, aUst + 80 * Ao); ekle(ms.onKose[0] + 20, ms.onKose[1] + 24);
    const pay = 32, son = Math.min((W - 2 * pay) / (b[2] - b[0]), (H - 2 * pay) / (b[3] - b[1])), s5 = son / 1.02;
    const c5 = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    const K5 = odakK(s5, c5), K6 = odakK(son, c5);
    kameraUstel(432, 60, K4, K5);
    tl.fromTo(ctx.kamera, K5, { ...K6, duration: k(SON + 1 - 492), ease: 'none', immediateRender: false }, k(492));
  }

  // ---------- Oyunculuk
  // #3: A devirde v1'in son pozunda (merak, bakış düz); k200 göz kırpar (kollu gövde bu karede gelir), garsona bakar
  poz(BAS, () => aPoz({ sol: null, sag: 'dinlen', ifade: 'merak', bakis: [0, 0] }));
  poz(200, () => aPoz({ sol: 'dinlen', ifade: 'kirp' }));
  poz(205, () => aPoz({ ifade: 'notr', bakis: [1, 0] }));
  poz(225, () => aPoz({ ifade: 'notr', bakis: [0, 1] }));   // boş tabağa bakar
  poz(240, () => aPoz({ ifade: 'merak', bakis: [1, -1] })); // garsona
  poz(265, () => aPoz({ ifade: 'notr', bakis: [1, 0] }));
  poz(280, () => aPoz({ ifade: 'merak', bakis: [1, -1] }));
  // Garson: sağ masayı dinler (o yana eğik, gözü o masada), iki kez başını sallar
  poz(BAS, () => garsonPoz({ arka: false, ifade: 'merak', bakis: [1, 1] }));
  for (const n of [222, 262]) { poz(n, () => garsonPoz({ ifade: 'kirp' })); poz(n + 5, () => garsonPoz({ ifade: 'merak' })); }
  for (const n of [236, 276]) { tl.set(gSar, { y: 3 }, k(adim(n))); tl.set(gSar, { y: 0 }, k(adim(n) + 5)); }

  // #4: el kalkar (12 fps), söz; garson sağ masaya döner
  poz(288, () => aPoz({ sol: 'kalk1a', ifade: 'merak', bakis: [1, -1] }));
  poz(293, () => aPoz({ sol: 'kalk1' }));
  poz(298, () => aPoz({ ifade: 'saskin' }));
  poz(318, () => aPoz({ ifade: 'merak', bakis: [1, 0] }));
  // Garson A'ya değil sağ masaya döner: o yana bir adım atar, iyice eğilir, güler (12 fps, 2 adım)
  egil(305, P.garson.egil);
  if (P.garson.adim) tl.to(g0, { x: P.garson.adim, duration: k(10), ease: 'steps(2)' }, k(adim(305)));
  poz(305, () => garsonPoz({ bakis: [1, 1] }));
  poz(310, () => garsonPoz({ ifade: 'mutlu' }));
  for (const n of [320, 340]) { tl.set(gSar, { y: 3 }, k(adim(n))); tl.set(gSar, { y: 0 }, k(adim(n) + 5)); }
  poz(330, () => aPoz({ ifade: 'notr', bakis: [1, 0] }));
  poz(345, () => aPoz({ ifade: 'sikkin', bakis: [1, 0] }));
  // İkinci deneme: A yarı doğrulur, el daha yükseğe, sallar
  poz(358, () => aPoz({ sol: 'kalk2a', ifade: 'merak', bakis: [1, -1] }));
  tl.to(aKap, { y: -12 * Ao / 0.92, duration: k(10), ease: 'steps(2)' }, k(adim(358)));
  poz(363, () => aPoz({ sol: 'kalk2' }));
  poz(368, () => aPoz({ ifade: 'saskin' }));
  for (let n = 375; n < 400; n += 10) { poz(n, () => aPoz({ sol: 'salla' })); poz(n + 5, () => aPoz({ sol: 'kalk2' })); }
  {
    // Sallama çizgileri: elin sağında (balona doğru) kısa yaylar, 12 fps'te iki yer arasında atlar (el sallanıyor).
    // Solda yay yok: soldaki masanın minik balonuna biner
    const hx = P.A.x + (sx - 56 - 200) * Ao, hy = aUst + (sy - 252 - 70) * Ao;
    const yay = (cx, cy, a0, a1, r) => oval(cx, cy, r, r * 1.1, a0, a1, 6);
    const cizgiler = [[yay(hx, hy, -40, 6, 72 * Ao), yay(hx, hy, -40, 6, 96 * Ao)], [yay(hx, hy - 10, -64, -20, 80 * Ao), yay(hx, hy - 10, -64, -20, 104 * Ao)]].map((ikili) => {
      const g = el(L.svg, 'g');
      for (const pts of ikili) cizgi(g, pts, { kalinlik: 4, tohum: T(), genlik: 0.6 });
      gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS));
      return g;
    });
    for (let n = 375; n < 400; n += 10) {
      tl.set(cizgiler[0], { autoAlpha: 1 }, k(n)); tl.set(cizgiler[0], { autoAlpha: 0 }, k(n + 5));
      tl.set(cizgiler[1], { autoAlpha: 1 }, k(n + 5)); tl.set(cizgiler[1], { autoAlpha: 0 }, k(n + 10));
    }
  }
  // Garson: tepsiyle arkasını döner (önden → bir adım daralma → arkadan), sağa ve derine yürüyüp çıkar
  poz(373, () => garsonPoz({ ifade: 'notr', bakis: [1, 0] }));
  tl.to(gSar, { rotation: 0, scaleX: 0.84, svgOrigin: `${gAyak[0]} ${gAyak[1]}`, duration: k(5), ease: 'steps(1)' }, k(adim(378)));
  poz(383, () => garsonPoz({ arka: true }));
  tl.to(gSar, { scaleX: 1, svgOrigin: `${gAyak[0]} ${gAyak[1]}`, duration: k(5), ease: 'steps(1)' }, k(adim(383)));
  ctx.isaret(380, 'tik'); // tepsideki bardaklar
  {
    // Yürüyüş: 12 fps adım, her adımda hafif sekme ve yalpa; sağa ve derine (küçülerek), kadrajdan çıkar
    // k430'dan önce kadrajdan tamamen çıkar (#5'in yaklaşmasında kenarda yarım tepsi kalmasın)
    const [cx, cy] = P.garson.cikis, adimlar = 8, x0 = P.garson.adim;
    for (let j = 1; j <= adimlar; j++) {
      const n = adim(390) + (j - 1) * 5, u = j / adimlar;
      tl.set(g0, { x: x0 + (cx - gAyak[0] - x0) * u, y: (cy - gAyak[1]) * u + (j % 2 ? -5 : 0), scale: 1 - 0.1 * u, svgOrigin: `${gAyak[0]} ${gAyak[1]}` }, k(n));
      tl.set(gSar, { rotation: j % 2 ? 1.5 : -1.5, svgOrigin: `${gAyak[0]} ${gAyak[1]}` }, k(n));
      tl.call(() => garsonPoz({ kalk: j % 2 ? -1 : 1 }), null, k(n));
    }
  }
  poz(400, () => aPoz({ sol: 'kalk2', ifade: 'saskin', bakis: [1, 0] })); // gidişine şaşırır, eli havada kalır
  ctx.isaret(412, 'sessizlik', { bitis: 438 });

  // #5: el iner, omuz düşer, masanın köşesine bakar; düşünce
  poz(418, () => aPoz({ sol: 'ini1', ifade: 'sikkin', bakis: [1, 0] }));
  tl.to(aKap, { y: 0, duration: k(10), ease: 'steps(2)' }, k(adim(418)));
  poz(425, () => aPoz({ sol: 'dinlen' }));
  ctx.isaret(adim(425), 'tik'); // el masaya iner
  poz(430, () => aPoz({ sag: 'kose', ifade: 'sikkin', bakis: [1, 1] }));
  tl.to(aKap, { y: 12 * Ao / 0.92, duration: k(10), ease: 'steps(2)' }, k(adim(430)));
  poz(460, () => aPoz({ ifade: 'ozlem', bakis: [1, 1] }));
  poz(520, () => aPoz({ ifade: 'kirp' }));
  poz(525, () => aPoz({ ifade: 'ozlem', bakis: [1, 1] }));
  poz(548, () => aPoz({ ifade: 'ozlem', bakis: [1, -1] })); // gözü balona kalkar: sorun asılı
  // geri sarmada ilk pozlar dönsün
  tl.call(() => { aPoz({ sol: null, sag: 'dinlen', ifade: 'merak', bakis: [0, 0] }); garsonPoz({ arka: false, kalk: 0, ifade: 'merak', bakis: [1, 1] }); }, null, k(BAS - 1));
  void ms;
}
