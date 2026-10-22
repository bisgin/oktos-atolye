// Sahne 1, KAFE (#3–#5, k192–647; ARALIK ile 72 kare uzadı). A (kısa boylu, yanaklı, kıvırcık saçlı genç kız) kalabalık bir
// kafede tek başına; garsona seslenir, görülmez; yüzü asılır; yanağını avucuna yaslar, masada bir QR standı olsa sipariş
// verebileceğini düşünür. Sahne SORUNDA biter: çözüm, ürün, renkli nesne yok.
// v06 r2 (kullanıcının kare kare notları): "sağa sola bırakılmış aset" yerine derinlikte dizili kalabalık kafe; garson dik
// ve canlı (bir elinde tepsi, öteki el konuşurken oynar, güler, başını sallar; A'ya hiç dönmez); A'nın eli organik
// (tek dış hatlı avuç, ayrık ama doğal parmaklar); iki seslenmeden sonra yüz asılır; düşünürken yanağı avucunda (sıkılmış).
// Derinlik: göz hizası kamerası. Her şey (o: ölçek, h: yerden yükseklik, kutu birimi) ile yerleşir: ekran y = H0 + (K − h)·o.
// Oturan herkesin başı ufuk çizgisinin çevresinde kalır (kalabalık bandı); uzak olan küçük, açık ve ince çizgili (pus).
// #3 (k192–299) Devir: v1'in son yüzü A, aynı yerde ve ölçekte; 58 k KM üstel geri çekilme, kafe genel planı (k194–216 kâğıttan
//    belirir). Arka duvar: büyük camlar, kara tahta menü, tezgâh + espresso makinesi + barista; arka sırada dört masa (biri
//    laptoplu), orta sırada iki masa (birer kişi sırtı dönük), sağ önde sırtı dönük bir kız. Garson sağdaki masanın müşterisiyle
//    sohbette: konuşur (minik balonda karalama), elini oynatır, güler.
// #4 (k300–431) A elini kaldırır (organik el, 12 fps), "Bakar mısınız?" (k310). Garson o sırada konuşuyor. İkinci deneme:
//    A yarı doğrulur, el daha yükseğe, sallar, "Bakar mısınız?!" (k382; birinci balonu şişirir). Garson müşterinin şakasına
//    kahkaha atar, eli göğsünde: A'ya dönmez. El iner (k418).
// #5 (k432–647) Yüz asılır: kaşlar iner, ağız aşağı, omuzlar düşer (sikkin → ozlem, k432–466); kamera A'ya ve balonun
//    yerine yaklaşır. k470 dirsek masaya, k475 yanak avuçta (gövde o yana yaslanır): sıkılmış, göz kapakları yarı inik.
//    Düşünce balonu (k480): masa köşesi, çadır QR standı (cizimler.js), okutan telefon, vurgu halkası; el yazısı iki satır
//    (tam cümle k524'ten SON'a ~120 k). Kafe kâğıda doğru solar. k648 kesme (s2-atolye).
// Kare hızları: karakter pozları 12 fps (ctx.adim), kamera / yazı / balon 60 fps, kaynama çekirdekte 8 fps.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye İÇ (mutlak) kare zamanlı tween ekler; window'a bir şey yazmaz.
import { kisiSVG, govdeOlcusu, boyKaymasi, yol as yolCiz, rng } from '../insan.js';
import { kolSVG, omuzlar, govdeKes } from '../kol.js';
import { CIZIMLER } from './cizimler.js';

export const ARALIK = [192, 647];

const D2R = Math.PI / 180;
const yon = (d) => [Math.cos(d * D2R), Math.sin(d * D2R)];
const dikV = (t) => [-t[1], t[0]]; // +90°: yerel çerçevede başparmak yanı
const topla = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s];

// ---------- Organik el (kullanıcı: "eli çok kötü çizilmiş"; kol.js'in ayrı kapsül parmakları tırmık gibi okunuyordu).
// El TEK dış hatla çizilir: bilekten serçe yanına, parmak parmak (uçlar yuvarlak, aralarda boğum çukuru), işaret kökünden
// başparmak ağına, başparmağın iç yanından ucuna, dış yanından tenar kabarıklığına ve bileğe. Yerel çerçeve: bilek (0,0),
// u parmak ucuna, v başparmak yanına, birim = el boyu. Parmaklar: b kök, a yön (derece, + başparmağa doğru), l boy, r yarı
// kalınlık, k orta boğumdaki kıvrım. yay: parmak açıklığı (0 bitişik, 1 açık el).
const EL_POZ = {
  acik: (yay = 1) => ({
    parmak: [
      { b: [0.5, -0.19], a: -13 * yay, l: 0.31, r: 0.06, k: 4 },
      { b: [0.555, -0.068], a: -4 * yay, l: 0.39, r: 0.065, k: 3 },
      { b: [0.575, 0.06], a: 2.5 * yay, l: 0.43, r: 0.067, k: 2 },
      { b: [0.55, 0.186], a: 9.5 * yay, l: 0.38, r: 0.064, k: 0 },
    ],
    bas: { b: [0.17, 0.2], a: 30 + 20 * yay, l: 0.34, r: 0.08, k: -22 },
    ag: [0.31, 0.245],
  }),
  // Yanağa yaslanan el: parmaklar bitişik, uçları yüze doğru hafif kıvrık; başparmak çene hattı boyunca
  yanak: () => ({
    parmak: [
      { b: [0.5, -0.185], a: -4, l: 0.27, r: 0.062, k: 12 },
      { b: [0.555, -0.064], a: -1.5, l: 0.35, r: 0.067, k: 10 },
      { b: [0.575, 0.06], a: 1, l: 0.38, r: 0.069, k: 9 },
      { b: [0.55, 0.184], a: 3.5, l: 0.33, r: 0.066, k: 7 },
    ],
    bas: { b: [0.16, 0.2], a: 72, l: 0.3, r: 0.078, k: -14 },
    ag: [0.28, 0.25],
  }),
};
function elHatti(T) {
  const F = T.parmak.map((f) => {
    const t = yon(f.a), t2 = yon(f.a + f.k), n = dikV(t), n2 = dikV(t2);
    const m = topla(f.b, t, f.l * 0.5), u = topla(m, t2, f.l * 0.5 - f.r);
    const ru = f.r * 0.84;
    const uc = [-62, -22, 22, 62].map((d) => { const c = Math.cos(d * D2R), s = Math.sin(d * D2R); return [u[0] + ru * (c * t2[0] + s * n2[0]), u[1] + ru * (c * t2[1] + s * n2[1])]; });
    return { ...f, t, t2, n, n2, m, u, uc };
  });
  const hat = [[0.02, -0.19], [0.2, -0.226], [0.38, -0.238]];
  // Parmak yanları kökten uca incelir (uç yarıçapı 0,84 r); aralardaki çukur kök hizasına iner: parmaklar ayrık okunur
  F.forEach((f, i) => {
    const q = topla(f.b, f.t, f.l * 0.22);
    if (i === 0) hat.push(topla(f.b, f.n, -f.r));
    hat.push(topla(q, f.n, -f.r * 0.98), topla(f.m, f.n2, -f.r * 0.93), topla(f.u, f.n2, -f.r * 0.84), ...f.uc, topla(f.u, f.n2, f.r * 0.84), topla(f.m, f.n2, f.r * 0.93), topla(q, f.n, f.r * 0.98));
    if (i < F.length - 1) {
      const g = F[i + 1], a = topla(f.b, f.n, f.r), b = topla(g.b, g.n, -g.r);
      hat.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); // boğum çukuru (kök hizası)
    } else hat.push(topla(f.b, f.n, f.r));
  });
  const B = T.bas, t = yon(B.a), t2 = yon(B.a + B.k), n = dikV(t), n2 = dikV(t2);
  const m = topla(B.b, t, B.l * 0.5), u = topla(m, t2, B.l * 0.5 - B.r);
  hat.push([0.44, 0.255], T.ag, topla(u, n2, -B.r));
  for (const d of [-62, -22, 22, 62]) { const c = Math.cos(d * D2R), s = Math.sin(d * D2R); hat.push([u[0] + B.r * (c * t2[0] + s * n2[0]), u[1] + B.r * (c * t2[1] + s * n2[1])]); }
  hat.push(topla(u, n2, B.r), topla(m, n2, B.r), topla(B.b, n, B.r * 1.05), [0.02, 0.19]);
  return { hat, F };
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, oval, W, H, DIKEY, PALET, MONO, BOY, GOZ_Y, VURGU, BALON, yer, adim, metin } = ctx;
  const M = PALET.murekkep;
  const [BAS, SON] = ARALIK;
  ctx.vurus(3, 'Kafe: A tek başına', BAS, 299);
  ctx.vurus(4, 'Bakar mısınız?', 300, 431);
  ctx.vurus(5, 'Yüz asılır, QR olsa…', 432, SON);

  const L = ctx.katman('s1-kafe', 10);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(BAS));
  tl.set(L.div, { autoAlpha: 0 }, k(SON + 1));
  const defs = el(L.svg, 'defs');
  // Pus süzgeçleri: renkleri kâğıda doğru a oranında açar (uzak olan daha açık), saydamlık değişmez (arkası görünmez)
  const suzgec = (id, a) => {
    const f = el(defs, 'filter', { id, 'color-interpolation-filters': 'sRGB', x: '-10%', y: '-10%', width: '120%', height: '120%' });
    const c = el(f, 'feComponentTransfer');
    [['R', 0.945], ['G', 0.929], ['B', 0.902]].forEach(([kn, v]) => el(c, `feFunc${kn}`, { type: 'linear', slope: (1 - a).toFixed(3), intercept: (a * v).toFixed(3) }));
    return `url(#${id})`;
  };
  const PUS = { duvar: suzgec('s1-pus-duvar', 0.52), uzak: suzgec('s1-pus-uzak', 0.6), orta: suzgec('s1-pus-orta', 0.46), yakin: suzgec('s1-pus-yakin', 0.36), garson: suzgec('s1-pus-garson', 0.16) };

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
  // Kutu birimli dizge çizimleri (insan.js titreşimi + kaynama): garsonun alt gövdesi, tepsi, organik el
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
  let klipNo = 0;
  const klipAlt = (y) => { const id = `s1-klip-${klipNo++}`; const c = el(defs, 'clipPath', { id, clipPathUnits: 'userSpaceOnUse' }); el(c, 'rect', { x: -4000, y: -4000, width: 10000, height: 4000 + y }); return `url(#${id})`; };

  // Organik el çizimi (dizge): yuz 'avuc' (avuç çizgileri) | 'sirt' (boğumlar); bs başparmak yanı (+1/−1), en: v'de kısalma
  function elOrganik({ poz: ad = 'acik', bilek, aci, boy = 104, bs = 1, en = 1, yay = 1, yuz = 'avuc', ten, kaynama = 0, tohum = 1, w = 4.2 }) {
    const { hat, F } = elHatti(EL_POZ[ad](yay));
    const c = Math.cos(aci * D2R), s = Math.sin(aci * D2R);
    const D = ([u, v]) => { const X = u * boy, V = v * boy * bs * en; return [bilek[0] + X * c - V * s, bilek[1] + X * s + V * c]; };
    const ar = araclar(tohum, kaynama, 0.55);
    let out = ar.sk(hat.map(D), ten, w * 0.92, [2, 2]);
    const cz = (pts, oran) => { out += ar.cz(pts.map(D), w * oran); };
    // avuç: yaşam ve kalp çizgisi, orta parmaklarda boğum kırışığı; sırt: yalnız iki kısa tendon izi (karalama olmasın)
    if (yuz === 'avuc') {
      cz([[0.37, 0.215], [0.26, 0.15], [0.14, 0.115], [0.05, 0.1]], 0.5);
      cz([[0.45, -0.215], [0.425, -0.1], [0.45, 0.02]], 0.46);
      for (const f of F.slice(1, 3)) { const q = topla(f.m, f.t2, 0.015); cz([topla(q, f.n2, -f.r * 0.45), topla(q, f.n2, f.r * 0.45)], 0.36); }
    } else if (ad === 'acik') {
      cz([[0.16, -0.04], [0.36, -0.06]], 0.36);
      cz([[0.16, 0.06], [0.36, 0.08]], 0.36);
    }
    return out;
  }

  // ---------- Derinlik (göz hizası kamerası): ekran y = H0 + (K − h)·o; h kutu birimi yükseklik. K kameranın yüksekliği.
  // Yükseklikler (kutu birimi): oturan göz 830, masa üstü 470, oturak 290, ayaktaki göz 1094 (garson: TABAN − GOZ_Y).
  const D = yer({ H0: 440, K: 927 }, { H0: 780, K: 1328 });
  const Y = (o, h) => D.H0 + (D.K - h) * o;
  const cw = (o) => Math.max(1.3, 4.4 * o);   // çizgi kalınlığı (insan.js konturu 4,2 × ölçek ile uyumlu)
  const gn = (o) => 0.3 + 0.8 * o;            // titreşim genliği
  const ad = (o) => 6 + 22 * o;               // kenar nokta aralığı
  const AHSAP = MONO.sac[3];

  // ---------- Yerleşim. A önde (yatayda solda, dikeyde ortada). Garson sağdaki orta masanın yanında, müşteriye dönük.
  // Seslenme balonu kalkan elin öbür yanında: yatayda sağda, dikeyde başın sol üstünde (dikeyde kalkan el sağda).
  const P = yer({
    lamba: { x: 640, ip: 196 },
    duvar: 0.2, cam: [[26, 716], [1318, 1900]], camUst: 70, menu: [892, 150, 1166, 318],
    tezgah: { x0: 846, x1: 1254, o: 0.21, makine: [884, 1062] }, barista: { x: 1150, o: 0.2 }, bitki: { x: 778, o: 0.205 },
    lambalar: [[442, 0.26, 300], [1452, 0.245, 290], [1590, 0.44, 236]],
    garson: { x: 1330, o: 0.46 },
    A: { x: 640, o: 0.92, masa: 862 }, masa: { yari: 290, derin: 48, etek: 66 },
    konus1: { x: 812, y: 436, boyut: 50 }, konus2: { x: 800, y: 414, boyut: 62 },
    balon: { c: [1180, 318], r: [440, 205] }, ic: { yazi: 44, yx: -0.6, yy: -0.82, qb: 0.9, qx: -0.22, qy: 0.28, tx: 1.17, ty: -0.36 },
  }, {
    lamba: { x: 440, ip: 150 },
    duvar: 0.19, cam: [[24, 330], [750, 1056]], camUst: 240, menu: [380, 500, 700, 700],
    tezgah: { x0: 320, x1: 740, o: 0.2, makine: [350, 524] }, barista: { x: 646, o: 0.19 }, bitki: { x: 262, o: 0.2 },
    lambalar: [[165, 0.23, 640], [935, 0.23, 640]],
    garson: { x: 840, o: 0.4 },
    A: { x: 440, o: 1.0, masa: 1640 }, masa: { yari: 300, derin: 54, etek: 76 },
    konus1: { x: 58, y: 1086, boyut: 50 }, konus2: { x: 48, y: 1056, boyut: 58 },
    balon: { c: [540, 760], r: [370, 260] }, ic: { yazi: 48, yx: -0.66, yy: -0.7, qb: 0.72, qx: -0.24, qy: 0.33, tx: 1.18, ty: -0.42 },
  });
  // Masalar: x, o (masa), kişiler [tür ('on' masanın ardında yüzü bize | 'arka' önünde sırtı dönük), x, o, FIG dizini],
  // eşya [tür, u (masa yarıçapına göre), v]. garson: true → garson bu masanın arkasındakilerden sonra çizilir.
  const MASALAR = yer([
    { x: 178, o: 0.245, k: [['on', 178, 0.235, 0]], esya: [['fincan', 0.32, 0.3]] },
    { x: 442, o: 0.26, k: [['on', 442, 0.25, 1]], esya: [['laptop', 0.02, 0.15], ['fincan', -0.62, 0.35]] },
    { x: 1452, o: 0.245, k: [['on', 1452, 0.235, 2]], esya: [['fincan', -0.38, 0.3], ['vazo', 0.5, 0]] },
    { x: 1746, o: 0.25, k: [['on', 1746, 0.24, 3]], esya: [['bardak', 0.38, 0.25]] },
    { x: 178, o: 0.44, k: [['on', 106, 0.42, 4], ['arka', 262, 0.48, 5]], esya: [['fincan', -0.55, 0.35], ['pasta', 0.1, 0.1]] },
    { x: 1592, o: 0.44, k: [['on', 1548, 0.42, 6], ['arka', 1674, 0.48, 7]], esya: [['fincan', -0.5, 0.35], ['bardak', 0.15, -0.1]], garson: true },
    { x: 1860, o: 0.62, k: [['arka', 1842, 0.68, 8]], esya: [['pasta', -0.62, 0.2]] },
  ], [
    { x: 165, o: 0.23, k: [['on', 165, 0.22, 0]], esya: [['fincan', 0.32, 0.3]] },
    { x: 935, o: 0.23, k: [['on', 935, 0.22, 2]], esya: [['vazo', -0.5, 0], ['fincan', 0.4, 0.3]] },
    { x: 132, o: 0.44, k: [['on', 62, 0.42, 4], ['arka', 214, 0.47, 5]], esya: [['fincan', -0.5, 0.35], ['pasta', 0.2, 0.1]] },
    { x: 1052, o: 0.44, k: [['on', 1042, 0.42, 6]], esya: [['fincan', -0.5, 0.35]], garson: true },
    { x: 1040, o: 0.56, k: [['arka', 1000, 0.6, 8]], esya: [['pasta', 0.5, 0.2]] },
  ]);

  // ---------- Kadro: figüranlar (genç, sade; süzgeçle açık gri), barista
  const FIG = [
    { tohum: 621, kadin: true, sacStil: 'uzun', sac: 0, ten: 2, giysi: 2, yaka: 'v' },
    { tohum: 622, kadin: false, sacStil: 'kisa', sac: 1, ten: 4, giysi: 5, yaka: 'kapusonlu', gozluk: 'kare' },
    { tohum: 623, kadin: true, sacStil: 'topuz', sac: 2, ten: 1, giysi: 6, yaka: 'balikci' },
    { tohum: 624, kadin: false, sacStil: 'kivircik', sac: 0, ten: 5, giysi: 3, yaka: 'bisiklet', sakal: 'sakal' },
    { tohum: 611, kadin: true, sacStil: 'bob', sac: 3, ten: 1, giysi: 6, yaka: 'v', kupe: true },
    { tohum: 612, kadin: false, sacStil: 'yan', sac: 2, ten: 3, giysi: 1, yaka: 'kapusonlu', sakal: 'kirli' },
    { tohum: 613, kadin: false, sacStil: 'kisa', sapka: 'bere', bereRenk: 4, sac: 3, ten: 2, giysi: 0, yaka: 'bisiklet' },
    { tohum: 614, kadin: true, sacStil: 'topuz', sac: 4, ten: 0, giysi: 7, yaka: 'balikci' },
    { tohum: 625, kadin: true, sacStil: 'orgu', sac: 1, ten: 4, giysi: 4, yaka: 'kapusonlu' },
  ].map((p) => ctx.rastgeleKisi(p.tohum, { yas: 'genc', gozluk: null, sakal: null, kupe: false, ...p }));
  const BARISTA = ctx.rastgeleKisi(626, { kadin: true, yas: 'genc', sacStil: 'basortusu', ortu: 5, ten: 3, giysi: 5, yaka: 'gomlek', gozluk: null, sakal: null, kupe: false });

  // ---------- Arka plan (devirde kâğıttan belirir): duvar, camlar, zemin, menü, tezgâh, figüranlar, garson
  const arka = el(L.svg, 'g');
  gsap.set(arka, { opacity: 0 });
  tl.set(arka, { opacity: 0 }, k(BAS));
  tl.to(arka, { opacity: 1, duration: k(22), ease: 'power1.in' }, k(BAS + 2));
  const duvarG = el(arka, 'g', { filter: PUS.duvar });
  const menuG = el(duvarG, 'g');
  const duvarY = Y(P.duvar, 0);
  {
    // Zemin: duvar dibi + süpürgelik; ufuktaki kaçış noktasından açılan seyrek tahta çizgileri (derinlik)
    cizgi(duvarG, [[-500, duvarY], [W * 0.5, duvarY - 2], [W + 500, duvarY]], { kalinlik: 3, tohum: T(), genlik: 0.7 });
    cizgi(duvarG, [[-500, duvarY - 12], [W + 500, duvarY - 13]], { kalinlik: 2, tohum: T(), genlik: 0.5, renk: MONO.sac[4] });
    const vx = W / 2;
    for (let i = -7; i <= 7; i++) {
      const xb = vx + i * W * yer(0.16, 0.3), y0 = duvarY + 4, y1 = H + 40, f = (y) => vx + (xb - vx) * (y - D.H0) / (H - D.H0);
      const h = cizgi(duvarG, [[f(y0), y0], [f(y1), y1]], { kalinlik: 2, tohum: T(), genlik: 0.5, renk: MONO.sac[4] });
      h.g.setAttribute('opacity', 0.35);
    }
    // Büyük camlar: kayıt, ara dikmeler, kemer, parıltı çizgileri; pervaz ve pervazda saksılar
    const pervaz = Y(P.duvar, 560);
    for (const [x0, x1] of P.cam) {
      const g = el(duvarG, 'g');
      cizgi(g, kutu(x0, P.camUst, x1, pervaz, 30), { kapali: true, dolgu: '#f6f3ed', kalinlik: 3.4, tohum: T() });
      const n = Math.max(2, Math.round((x1 - x0) / 170));
      for (let i = 1; i < n; i++) { const x = x0 + ((x1 - x0) * i) / n; cizgi(g, [[x, P.camUst], [x, pervaz]], { kalinlik: 5, tohum: T(), genlik: 0.5 }); }
      cizgi(g, [[x0, P.camUst + (pervaz - P.camUst) * 0.24], [x1, P.camUst + (pervaz - P.camUst) * 0.24]], { kalinlik: 4, tohum: T(), genlik: 0.5 });
      for (let i = 0; i < n; i++) { const x = x0 + ((x1 - x0) * (i + 0.3)) / n; cizgi(g, [[x, P.camUst + 70], [x + 34, P.camUst + 26]], { kalinlik: 2.6, tohum: T(), genlik: 0.4, renk: MONO.sac[5] }); }
      cizgi(g, kutu(x0 - 12, pervaz, x1 + 12, pervaz + 12, 30), { kapali: true, dolgu: MONO.giysi[1], kalinlik: 3, tohum: T() });
      // pervazda iki küçük saksı
      for (const u of [0.18, 0.78]) {
        const sx = x0 + (x1 - x0) * u;
        cizgi(g, kenarla([[sx - 12, pervaz - 22], [sx + 12, pervaz - 22], [sx + 9, pervaz], [sx - 9, pervaz]], 10), { kapali: true, dolgu: MONO.giysi[3], kalinlik: 2.4, tohum: T() });
        for (const d of [-1, 0, 1]) cizgi(g, [[sx, pervaz - 22], [sx + d * 12, pervaz - 40 - (d ? 0 : 8)]], { kalinlik: 2.4, tohum: T(), genlik: 0.4 });
      }
    }
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
    // Sarkan lambalar (arka masaların üstünde, derinliğe göre küçük)
    for (const [lx, lo, ly] of P.lambalar) {
      const s = lo / 0.44;
      cizgi(duvarG, [[lx, -40], [lx + 1, ly]], { kalinlik: Math.max(1.4, 2.6 * s), tohum: T(), genlik: 0.4 });
      cizgi(duvarG, kenarla([[lx - 12 * s, ly], [lx + 12 * s, ly], [lx + 40 * s, ly + 34 * s], [lx - 40 * s, ly + 34 * s]], 14), { kapali: true, dolgu: MONO.giysi[5], kalinlik: cw(lo), tohum: T(), genlik: gn(lo) });
      cizgi(duvarG, oval(lx, ly + 35 * s, 13 * s, 7 * s, 0, 180, 8), { kalinlik: cw(lo), tohum: T(), dolgu: BALON, genlik: gn(lo) });
    }
    // Duvar dibinde, tezgâhın yanında uzun saksı bitkisi (yapraklar el çizimi damla)
    const bt = P.bitki, bo = bt.o, by = Y(bo, 0);
    cizgi(duvarG, kenarla([[bt.x - 46 * bo / 0.2, by - 70 * bo / 0.2], [bt.x + 46 * bo / 0.2, by - 70 * bo / 0.2], [bt.x + 36 * bo / 0.2, by], [bt.x - 36 * bo / 0.2, by]], 14), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 3, tohum: T() });
    const Rb = rng(91);
    for (let i = 0; i < 9; i++) {
      const a = -90 + (i - 4) * 19 + (Rb() - 0.5) * 10, Ly = (110 + Rb() * 90) * bo / 0.2, q0 = [bt.x, by - 70 * bo / 0.2], tt = yon(a), q1 = topla(q0, tt, Ly);
      cizgi(duvarG, [q0, topla(q0, tt, Ly * 0.55)], { kalinlik: 2.2, tohum: T(), genlik: 0.4 });
      const nn = dikV(tt), yw = 18 * bo / 0.2;
      cizgi(duvarG, [topla(q0, tt, Ly * 0.5), topla(topla(q0, tt, Ly * 0.72), nn, yw), q1, topla(topla(q0, tt, Ly * 0.72), nn, -yw)], { kapali: true, dolgu: MONO.giysi[3], kalinlik: 2.4, tohum: T(), genlik: 0.6 });
    }
  }

  // ---------- Tezgâh + espresso makinesi (arkasında barista: başı makinenin yanında, makineye bakar)
  const tz = P.tezgah, tzUst = Y(tz.o, 660), tzAlt = Y(tz.o, 0);
  const baristaG = el(arka, 'g', { filter: PUS.uzak });
  const barista = (() => {
    const b = P.barista, goz = Y(b.o, 1094) + 8 * b.o;
    const kg = el(baristaG, 'g', { 'clip-path': klipAlt(tzUst + 4) });
    const h = ctx.kisi(kg, BARISTA, { x: b.x, alt: goz + (BOY.boy - GOZ_Y) * b.o, olcek: b.o });
    h.poz({ ifade: 'notr', bakis: [-1, 1] });
    return h;
  })();
  const tezgahG = el(arka, 'g', { filter: PUS.duvar });
  {
    const sc = (tz.makine[1] - tz.makine[0]) / 204, w = cw(tz.o * 1.5);
    cizgi(tezgahG, [[tz.x0 + 30, tzAlt + 4], [tz.x1 - 30, tzAlt + 4]], { kalinlik: 10 * sc, renk: M, tohum: T(), genlik: 0.4 }).g.setAttribute('opacity', 0.08);
    cizgi(tezgahG, kutu(tz.x0, tzUst + 12 * sc, tz.x1, tzAlt, 30), { kapali: true, dolgu: MONO.giysi[6], kalinlik: w, tohum: T() });
    const n = Math.round((tz.x1 - tz.x0) / (110 * sc));
    for (let i = 1; i < n; i++) { const x = tz.x0 + ((tz.x1 - tz.x0) * i) / n; cizgi(tezgahG, [[x, tzUst + 30 * sc], [x, tzAlt - 12 * sc]], { kalinlik: 2.2, tohum: T(), genlik: 0.5, renk: MONO.giysi[4] }); }
    cizgi(tezgahG, kutu(tz.x0 - 14 * sc, tzUst, tz.x1 + 14 * sc, tzUst + 14 * sc, 30), { kapali: true, dolgu: MONO.giysi[3], kalinlik: w, tohum: T() });
    const [mx0, mx1] = tz.makine, my1 = tzUst, my0 = my1 - (mx1 - mx0) * 0.6;
    cizgi(tezgahG, kenarla([[mx0, my1], [mx0, my0 + 18 * sc], [mx0 + 18 * sc, my0], [mx1 - 18 * sc, my0], [mx1, my0 + 18 * sc], [mx1, my1]], 22 * sc), { kapali: true, dolgu: MONO.giysi[2], kalinlik: w, tohum: T() });
    // Espresso makinesi okunsun: üstte ters fincanlar (ısıtıcı), önde iki basınç saati, iki portafiltre, altında fincanlar
    for (let i = 0; i < 3; i++) {
      const cx0 = mx0 + (mx1 - mx0) * (0.3 + i * 0.2);
      cizgi(tezgahG, kenarla([[cx0 - 13 * sc, my0 - 1], [cx0 + 13 * sc, my0 - 1], [cx0 + 10 * sc, my0 - 20 * sc], [cx0 - 10 * sc, my0 - 20 * sc]], 10 * sc), { kapali: true, dolgu: MONO.giysi[0], kalinlik: w * 0.8, tohum: T(), genlik: 0.6 });
    }
    for (const u of [0.36, 0.64]) {
      const gx0 = mx0 + (mx1 - mx0) * u, gy0 = my0 + 25 * sc;
      cizgi(tezgahG, oval(gx0, gy0, 13 * sc, 13 * sc, 0, 360, 12), { kapali: true, dolgu: BALON, kalinlik: w * 0.8, tohum: T(), genlik: 0.5 });
      cizgi(tezgahG, [[gx0, gy0], [gx0 + 7 * sc, gy0 - 6 * sc]], { kalinlik: 2.2, tohum: T(), genlik: 0.3 });
    }
    const gw = (mx1 - mx0) / 4;
    for (const u of [1.25, 2.75]) {
      const gx0 = mx0 + gw * u;
      cizgi(tezgahG, kutu(gx0 - 15 * sc, my0 + 44 * sc, gx0 + 15 * sc, my0 + 58 * sc, 10), { kapali: true, dolgu: MONO.sac[1], kalinlik: w * 0.8, tohum: T() });
      cizgi(tezgahG, [[gx0 + 12 * sc, my0 + 52 * sc], [gx0 + 40 * sc, my0 + 48 * sc]], { kalinlik: 4 * sc, tohum: T(), genlik: 0.5 });
      cizgi(tezgahG, kutu(gx0 - 11 * sc, my1 - 24 * sc, gx0 + 11 * sc, my1 - 2, 8), { kapali: true, dolgu: MONO.giysi[0], kalinlik: w * 0.8, tohum: T() });
    }
    cizgi(tezgahG, [[mx1 - 6 * sc, my0 + 40 * sc], [mx1 + 16 * sc, my1 - 40 * sc], [mx1 + 14 * sc, my1 - 14 * sc]], { kalinlik: 3, tohum: T(), genlik: 0.6 }); // buhar çubuğu
    // fincan kulesi ve pasta fanusu
    const fx = mx1 + 46 * sc;
    for (let i = 0; i < 3; i++) cizgi(tezgahG, kutu(fx - 18 * sc + i * 2, tzUst - 22 * sc * (i + 1), fx + 18 * sc - i * 2, tzUst - 22 * sc * i - 2, 10), { kapali: true, dolgu: i % 2 ? MONO.giysi[0] : MONO.giysi[6], kalinlik: w * 0.8, tohum: T() });
    const px = tz.x1 - 50 * sc;
    cizgi(tezgahG, oval(px, tzUst - 2, 44 * sc, 7 * sc, 0, 360, 14), { kapali: true, dolgu: MONO.giysi[1], kalinlik: w * 0.8, tohum: T() });
    cizgi(tezgahG, kenarla([[px - 26 * sc, tzUst - 4], [px - 26 * sc, tzUst - 24 * sc], [px + 26 * sc, tzUst - 24 * sc], [px + 26 * sc, tzUst - 4]], 10, false), { kalinlik: 2.4, tohum: T(), genlik: 0.5 });
    cizgi(tezgahG, [...oval(px, tzUst - 4, 36 * sc, 52 * sc, 180, 360, 12)], { kalinlik: w * 0.8, tohum: T(), genlik: 0.6 });
  }

  // ---------- Masa, eşya ve oturanlar (derinlik ölçeğiyle)
  // Yuvarlak bistro masası: üst elips (bakış açısıyla basık), kalınlık bandı, tek ayak, taban
  function bistro(ust, x, o) {
    const g = el(ust, 'g');
    const y = Y(o, 470), rx = 230 * o, ry = rx * (0.06 + 0.32 * o), t = Math.max(2.5, 12 * o), zem = Y(o, 0), w = cw(o), gg = gn(o);
    cizgi(g, oval(x, zem, 110 * o, 12 * o, 0, 360, 14, 2), { kapali: true, dolgu: M, kalinlik: 0.1, tohum: T(), kay: [0, 0] }).g.setAttribute('opacity', 0.07);
    cizgi(g, kenarla([[x - 7 * o, y + ry], [x + 7 * o, y + ry], [x + 7 * o, zem - 10 * o], [x - 7 * o, zem - 10 * o]], ad(o)), { kapali: true, dolgu: MONO.sac[1], kalinlik: w * 0.8, tohum: T(), genlik: gg });
    cizgi(g, oval(x, zem - 6 * o, 76 * o, 11 * o, 0, 360, 14, 2.2), { kapali: true, dolgu: MONO.sac[2], kalinlik: w * 0.8, tohum: T(), genlik: gg });
    const on = oval(x, y, rx, ry, 0, 180, 16, 2);
    cizgi(g, [...on, ...on.slice().reverse().map(([a, b]) => [a, b + t])], { kapali: true, dolgu: MONO.giysi[4], kalinlik: w, tohum: T(), genlik: gg });
    cizgi(g, oval(x, y, rx, ry, 0, 360, 22, 2), { kapali: true, dolgu: MONO.giysi[0], kalinlik: w, tohum: T(), genlik: gg });
    return { g, y, rx, ry, nokta: (u, v) => [x + u * rx, y + v * ry] };
  }
  // Masa üstü eşyası; (x, y) eşyanın masaya değdiği nokta, s = ölçek (birim → px)
  function esya(ust, tur, [x, y], s) {
    const w = cw(s), g0 = gn(s), opt = (dolgu) => ({ kapali: true, dolgu, kalinlik: w, tohum: T(), genlik: g0 });
    if (tur === 'fincan') {
      cizgi(ust, oval(x, y, 36 * s, 9 * s, 0, 360, 14, 2.2), opt(BALON));
      cizgi(ust, kenarla([[x - 17 * s, y - 34 * s], [x + 17 * s, y - 34 * s], [x + 12 * s, y - 3 * s], [x - 12 * s, y - 3 * s]], 10 * s + 3), opt(MONO.giysi[6]));
      cizgi(ust, [[x + 15 * s, y - 27 * s], [x + 27 * s, y - 21 * s], [x + 13 * s, y - 12 * s]], { kalinlik: w * 0.8, tohum: T(), genlik: g0 });
    } else if (tur === 'laptop') {
      cizgi(ust, kenarla([[x - 64 * s, y], [x + 64 * s, y], [x + 56 * s, y - 12 * s], [x - 56 * s, y - 12 * s]], 14 * s + 3), opt(MONO.giysi[3]));
      cizgi(ust, kenarla([[x - 58 * s, y - 12 * s], [x + 58 * s, y - 12 * s], [x + 62 * s, y - 96 * s], [x - 62 * s, y - 96 * s]], 14 * s + 3), opt(MONO.giysi[4]));
      cizgi(ust, [[x - 8 * s, y - 56 * s], [x + 8 * s, y - 56 * s]], { kalinlik: w * 0.7, tohum: T(), genlik: g0 * 0.5, renk: MONO.giysi[1] });
    } else if (tur === 'pasta') {
      cizgi(ust, oval(x, y, 46 * s, 11 * s, 0, 360, 14, 2.2), opt(BALON));
      cizgi(ust, kenarla([[x - 26 * s, y - 4 * s], [x + 16 * s, y - 4 * s], [x + 16 * s, y - 34 * s], [x - 26 * s, y - 34 * s]], 10 * s + 3), opt(MONO.giysi[0]));
      cizgi(ust, kenarla([[x - 26 * s, y - 34 * s], [x + 16 * s, y - 34 * s], [x + 34 * s, y - 44 * s]], 10 * s + 3), opt(MONO.giysi[6]));
      cizgi(ust, [[x - 24 * s, y - 19 * s], [x + 14 * s, y - 19 * s]], { kalinlik: w * 0.7, tohum: T(), genlik: g0 * 0.5, renk: MONO.giysi[4] });
      cizgi(ust, [[x + 24 * s, y - 2 * s], [x + 44 * s, y - 10 * s]], { kalinlik: w * 0.8, tohum: T(), genlik: g0 * 0.5 }); // çatal
    } else if (tur === 'bardak') {
      cizgi(ust, kenarla([[x - 13 * s, y - 60 * s], [x + 13 * s, y - 60 * s], [x + 10 * s, y - 2 * s], [x - 10 * s, y - 2 * s]], 12 * s + 3), opt('#f6f3ed'));
      cizgi(ust, [[x - 11 * s, y - 38 * s], [x + 11 * s, y - 38 * s]], { kalinlik: w * 0.6, tohum: T(), genlik: g0 * 0.5, renk: MONO.sac[4] });
    } else if (tur === 'vazo') {
      cizgi(ust, kenarla([[x - 9 * s, y - 2 * s], [x + 9 * s, y - 2 * s], [x + 12 * s, y - 28 * s], [x + 6 * s, y - 40 * s], [x - 6 * s, y - 40 * s], [x - 12 * s, y - 28 * s]], 8 * s + 3), opt(MONO.giysi[1]));
      cizgi(ust, [[x, y - 40 * s], [x + 4 * s, y - 76 * s]], { kalinlik: w * 0.7, tohum: T(), genlik: g0 * 0.5 });
      cizgi(ust, oval(x + 4 * s, y - 84 * s, 11 * s, 10 * s, 0, 360, 10), opt(MONO.giysi[6]));
    }
  }
  // Yüzü bize dönük oturan (masanın ardında): sandalye sırt dikmeleri gövdenin iki yanında; gövde oturak hizasında kırpılır;
  // masanın altında oturak, sandalye ayakları, baldırlar ve ayakkabılar. Masa sonradan üstüne çizilir.
  function oturanOn(ust, p, { x, o, mo }) {
    const g = el(ust, 'g'), w = cw(o), gg = gn(o);
    const goz = Y(o, 830) + boyKaymasi(p) * 0.35 * o;
    const AH = MONO.sac[2];
    // bükme sandalyenin sırtı: gövdenin ardında kavisli kayıt, iki yanda ince dikme
    const kayit = oval(x, Y(o, 600), 194 * o, 24 * o, 180, 360, 12, 2);
    cizgi(g, [...kayit, ...kayit.slice().reverse().map(([a, b]) => [a, b + 14 * o])], { kapali: true, dolgu: AH, kalinlik: w * 0.85, tohum: T(), genlik: gg });
    for (const yn of [-1, 1]) {
      const sx = x + yn * 190 * o;
      cizgi(g, kenarla([[sx - 5 * o, Y(o, 290)], [sx + 5 * o, Y(o, 290)], [sx + 5 * o, Y(o, 604)], [sx - 5 * o, Y(o, 604)]], ad(o)), { kapali: true, dolgu: AH, kalinlik: w * 0.85, tohum: T(), genlik: gg });
    }
    const kg = el(g, 'g', { 'clip-path': klipAlt(Y(o, 300)) });
    const h = ctx.kisi(kg, p, { x, alt: goz + (BOY.boy - GOZ_Y) * o, olcek: o });
    const oy = Y(o, 290), zo = Y(o, 0);
    cizgi(g, kutu(x - 170 * o, oy, x + 170 * o, oy + 14 * o, ad(o)), { kapali: true, dolgu: AH, kalinlik: w * 0.85, tohum: T(), genlik: gg });
    for (const yn of [-1, 1]) cizgi(g, kenarla([[x + yn * 150 * o - 5 * o, oy + 14 * o], [x + yn * 150 * o + 5 * o, oy + 14 * o], [x + yn * 162 * o + 5 * o, zo], [x + yn * 162 * o - 5 * o, zo]], ad(o)), { kapali: true, dolgu: AH, kalinlik: w * 0.75, tohum: T(), genlik: gg });
    const PANT = MONO.sac[(p.tohum % 3) + 1], dz = Y(mo, 0), dk = Y(mo, 330);
    for (const yn of [-1, 1]) {
      cizgi(g, kenarla([[x + yn * 14 * o, dk], [x + yn * 74 * o, dk], [x + yn * 64 * o, dz - 14 * o], [x + yn * 22 * o, dz - 14 * o]], ad(o)), { kapali: true, dolgu: PANT, kalinlik: w, tohum: T(), genlik: gg });
      cizgi(g, oval(x + yn * 46 * o, dz - 8 * o, 32 * o, 12 * o, 0, 360, 10, 2.2), { kapali: true, dolgu: M, kalinlik: w * 0.7, tohum: T(), genlik: gg });
    }
    h.oturan = { x, o };
    return h;
  }
  // Sırtı dönük oturan (masanın önünde): arka görünüş oturak hizasında kırpılır. Önünde bükme (thonet) kafe sandalyesinin
  // arkası: iki ince arka ayak yerden belin ortasına çıkar, üstte kavisli tek kayıt; oturağın arka kenarı; öndeki ayaklar
  // içeride, kısa görünür. Sırtın çoğu açıkta kalır (kutu gibi okunmasın).
  function oturanArka(ust, p, { x, o }) {
    const g = el(ust, 'g'), w = cw(o), gg = gn(o);
    const goz = Y(o, 830) + boyKaymasi(p) * 0.35 * o;
    const oy = Y(o, 290);
    const kg = el(g, 'g', { 'clip-path': klipAlt(oy + 6 * o) });
    const h = ctx.kisi(kg, p, { x, alt: goz + (BOY.boy - GOZ_Y) * o, olcek: o });
    h.poz({ arka: true });
    const AH = MONO.sac[2], ayak = (x0, x1, y0, y1, k0 = 5) => cizgi(g, kenarla([[x0 - k0 * o, y0], [x0 + k0 * o, y0], [x1 + k0 * o, y1], [x1 - k0 * o, y1]], ad(o)), { kapali: true, dolgu: AH, kalinlik: w * 0.75, tohum: T(), genlik: gg });
    for (const yn of [-1, 1]) ayak(x + yn * 118 * o, x + yn * 124 * o, oy + 14 * o, Y(o * 0.96, 0), 4);
    cizgi(g, kutu(x - 168 * o, oy - 2 * o, x + 168 * o, oy + 14 * o, ad(o)), { kapali: true, dolgu: AH, kalinlik: w * 0.85, tohum: T(), genlik: gg });
    for (const yn of [-1, 1]) ayak(x + yn * 150 * o, x + yn * 162 * o, Y(o, 560), Y(o * 1.04, 0), 5.5);
    const kayit = oval(x, Y(o, 548), 156 * o, 22 * o, 180, 360, 12, 2);
    cizgi(g, [...kayit, ...kayit.slice().reverse().map(([a, b]) => [a, b + 15 * o])], { kapali: true, dolgu: AH, kalinlik: w * 0.85, tohum: T(), genlik: gg });
    h.oturan = { x, o };
    return h;
  }
  // Minik konuşma balonu: içinde karalama (okunmaz söz), kuyruk konuşanın ağzına; yn balonun yana kayması.
  // yuzDisi (px): yüzü bize dönük konuşanda kuyruk ucu ve balon yüzün dışına kayar (kuyruk yanaktan geçmesin)
  function minikBalon(ust, goz, yn, o, tohum, yuzDisi = 0) {
    const b = o / 0.44, [gx, gy] = goz;
    const bx = gx + yn * (64 * b + yuzDisi), by = gy - 92 * b, bw = 44 * b, bh = 25 * b;
    const bg = el(ust, 'g');
    const agiz = [gx + yn * (12 * b + yuzDisi), gy + 20 * b];
    el(bg, 'path', { d: `M${bx - yn * bw * 0.3} ${by + bh * 0.5} L${agiz[0]} ${agiz[1]} L${bx + yn * bw * 0.15} ${by + bh * 0.7}Z`, fill: BALON, stroke: M, 'stroke-width': Math.max(1.4, 2.6 * b), 'stroke-linejoin': 'round' });
    cizgi(bg, oval(bx, by, bw, bh, 0, 360, 18, 4), { kapali: true, dolgu: BALON, kalinlik: Math.max(1.4, 3 * b), tohum, genlik: 0.7 * b, kay: [0, 0] });
    const kar = (yy, ww) => Array.from({ length: 6 }, (_, q) => [bx - ww + (2 * ww * q) / 5, yy + (q % 2 ? -4 : 4) * b]);
    cizgi(bg, kar(by - 6 * b, bw * 0.62), { kalinlik: Math.max(1.3, 2.8 * b), tohum: tohum + 1, genlik: 0.8 * b });
    cizgi(bg, kar(by + 8 * b, bw * 0.4), { kalinlik: Math.max(1.3, 2.8 * b), tohum: tohum + 2, genlik: 0.8 * b });
    gsap.set(bg, { autoAlpha: 0, scale: 0.5, svgOrigin: `${agiz[0]} ${agiz[1]}` });
    return bg;
  }

  // ---------- Masaları kur (uzaktan yakına). Her masa: arkasındakiler → masa → eşya → önündekiler (sırtı dönük)
  const kisiler = []; // { h, fig, tur, x, o, g }
  let garsonUst = null;
  for (const m of MASALAR) {
    const pus = m.o < 0.3 ? PUS.uzak : m.o < 0.55 ? PUS.orta : PUS.yakin;
    const g = el(arka, 'g', { filter: pus });
    for (const [tur, x, o, fi] of m.k) if (tur === 'on') kisiler.push({ h: oturanOn(g, FIG[fi], { x, o, mo: m.o }), fig: fi, tur, x, o, g });
    const ms0 = bistro(g, m.x, m.o);
    for (const [tur, u, v] of m.esya) esya(g, tur, ms0.nokta(u, v), m.o);
    if (m.garson) { garsonUst = el(arka, 'g', { filter: PUS.garson }); }
    const g2 = m.garson ? el(arka, 'g', { filter: pus }) : g;
    for (const [tur, x, o, fi] of m.k) if (tur === 'arka') kisiler.push({ h: oturanArka(g2, FIG[fi], { x, o }), fig: fi, tur, x, o, g: g2 });
  }
  const kisiAd = (fi) => kisiler.find((q) => q.fig === fi);

  // ---------- Garson (kadro.json Garson: uzun, zayıf, önlüklü). DİK durur (eğilmez), müşteriye (ekranın sağı) dönük; A'ya
  // hiç dönmez. Önden: insan.js baş-gövde (bele dek kırpılır) + kol.js kolları + bu modülde bacak, uzun önlük, ayakkabı.
  // Sağ eli (ekranın solu) omuz hizasında tepsiyi taşır; sol eli (ekranın sağı) konuşurken oynar: anlatır (avuç yukarı),
  // kaldırır, göğsüne koyar (kahkaha), beline koyar (dinler), sarkar. El organik (A'nınkiyle aynı çizim).
  const Gp = ctx.kisiParam('Garson');
  const gOl = govdeOlcusu(Gp);
  const gKalin = 52;
  // kol.js omuzlar() orta gövdeyi varsayar: zayıf ve uzun gövdede omuz x = 200 ± (160·en − r + 2), y + boyunEk
  const gOmuz = (() => {
    const o = omuzlar(Gp, { kalinlik: gKalin }), dx = 160 * gOl.en - gKalin / 2 + 2;
    return { sol: [200 - dx, o.sol[1] + gOl.boyunEk], sag: [200 + dx, o.sag[1] + gOl.boyunEk], omuzY: o.omuzY + gOl.boyunEk, ceneY: o.ceneY };
  })();
  const GIYSI = MONO.giysi[Gp.giysi], GTEN = MONO.ten[Gp.ten], ONLUK = MONO.giysi[0], PANTOLON = MONO.sac[1];
  const BEL = 600, ONLUK_ALT = 960, BILEK = 1250, TABAN = 1272;
  function tepsi(ar, [x, y]) {
    let s = ar.sk(oval(x, y - 8, 92, 14, 0, 360, 18, 2.4), MONO.giysi[3], 4);
    for (const dx of [-36, 24]) s += ar.sk(kenarla([[x + dx - 14, y - 56], [x + dx + 14, y - 56], [x + dx + 11, y - 14], [x + dx - 11, y - 14]], 14), MONO.giysi[6], 3.6) + ar.cz([[x + dx - 12, y - 44], [x + dx + 12, y - 44]], 2.6);
    return s;
  }
  // agirlik: −1/1 ağırlık o bacakta (öbür diz hafif kırık, ayak içe), 0 ikisi eşit
  function bacaklar(ar, agirlik = 0) {
    const cx = 200;
    let s = '';
    for (const yn of [-1, 1]) {
      const gevsek = agirlik && yn !== agirlik, d = gevsek ? -14 : 0, ic = gevsek ? -8 * yn : 0;
      s += ar.sk(kenarla([[cx + yn * 6, BEL - 30], [cx + yn * 86, BEL - 30], [cx + yn * 70 + ic, BILEK + d], [cx + yn * 20 + ic, BILEK + 4 + d]], 40), PANTOLON);
    }
    for (const yn of [-1, 1]) {
      const gevsek = agirlik && yn !== agirlik, d = gevsek ? -14 : 0, ic = gevsek ? -8 * yn : 0;
      s += ar.sk(kenarla([[cx + yn * 18 + ic, BILEK - 2 + d], [cx + yn * 74 + ic, BILEK + d], [cx + yn * 90 + ic, BILEK + 20 + d], [cx + yn * 22 + ic, BILEK + 22 + d]], 16), M, 3);
    }
    return s;
  }
  function onluk(ar) {
    const cx = 200;
    let s = ar.sk(kenarla([[cx - 96, BEL - 34], [cx + 96, BEL - 34], [cx + 112, ONLUK_ALT], [cx - 112, ONLUK_ALT]], 40), ONLUK);
    s += ar.cz([[cx - 96, BEL - 18], [cx + 96, BEL - 18]], 3);
    s += ar.cz(kenarla([[cx - 82, BEL + 56], [cx - 24, BEL + 56], [cx - 22, BEL + 114], [cx - 80, BEL + 114]], 20), 3, M, true);
    s += ar.sk(kenarla([[cx - 70, BEL + 20], [cx - 63, BEL + 20], [cx - 64, BEL + 66], [cx - 71, BEL + 66]], 14), MONO.sac[0], 2.4);
    for (const u of [-0.4, 0.35]) s += ar.cz([[cx + u * 200, BEL + 150], [cx + u * 216, ONLUK_ALT - 20]], 2.2, MONO.giysi[4]); // kumaş kıvrımı
    return s;
  }
  // Jest kolu pozları (omza göre, kutu birimi; d dirsek, b bilek, a el yönü, bs başparmak yanı)
  const GJ = {
    sark: { d: [12, 160], b: [8, 300], a: 92, bs: 1, yuz: 'sirt', yay: 0.3 },
    anlat: { d: [46, 150], b: [176, 142], a: -26, bs: -1, yuz: 'avuc', yay: 0.8 },
    anlat2: { d: [40, 154], b: [164, 104], a: -44, bs: -1, yuz: 'avuc', yay: 1 },
    yukari: { d: [84, 110], b: [110, -12], a: -74, bs: -1, yuz: 'avuc', yay: 1 },
    gogus: { d: [28, 172], b: [-62, 124], a: 192, bs: 1, yuz: 'sirt', yay: 0.25 },
    kalca: { d: [98, 128], b: [14, 252], a: 112, bs: 1, yuz: 'sirt', yay: 0.15 },
  };
  function garsonKollar(i, jest) {
    const o1 = gOmuz.sol, o2 = gOmuz.sag;
    const ortak = { giysi: GIYSI, ten: GTEN, kalinlik: gKalin, kaynama: i, manset: 'gomlek', govdeX: 200 };
    const bilek = [o1[0] - 94, o1[1] - 124];
    const kol1 = kolSVG({ ...ortak, omuz: o1, dirsek: [o1[0] - 92, o1[1] + 32], bilek, el: 'dayanma', elAci: 192, kisalma: 0.5, elBoy: 100, taraf: 'sol', tohum: 61 });
    const q = GJ[jest] || GJ.sark, b2 = [o2[0] + q.b[0], o2[1] + q.b[1]];
    const kol2 = elOrganik({ bilek: b2, aci: q.a, boy: 98, bs: q.bs, yay: q.yay, yuz: q.yuz, ten: GTEN, kaynama: i, tohum: 52 }) +
      kolSVG({ ...ortak, omuz: o2, dirsek: [o2[0] + q.d[0], o2[1] + q.d[1]], bilek: b2, el: 'acik', elBoy: 0.01, taraf: 'sag', tohum: 52 });
    return { kol1, kol2, tepsi: tepsi(araclar(633, i), [bilek[0] - 14, bilek[1] - 10]) };
  }
  const GO = P.garson.o, gAyak = [P.garson.x, Y(GO, 0)], gUst = gAyak[1] - TABAN * GO;
  const g0 = el(garsonUst, 'g');
  cizgi(g0, oval(gAyak[0], gAyak[1] + 2, 64 * GO / 0.54, 9 * GO / 0.54, 0, 360, 14, 2), { kapali: true, dolgu: M, kalinlik: 0.1, tohum: T(), kay: [0, 0] }).g.setAttribute('opacity', 0.08);
  const gSar = el(g0, 'g'); // başını sallama, kahkaha sekmesi
  const gSvg = el(gSar, 'svg', svgKutu(gAyak[0], gUst, GO));
  const G = { ifade: 'mutlu', bakis: [1, 1], jest: 'anlat', agirlik: 1 };
  // Gövde (bele dek kırpılı) → bacaklar → önlük → tepsi kolu → tepsi → jest kolu (göğse geldiğinde en üstte)
  function garsonCiz(i = kaynaSon) {
    const ar = araclar(623, i);
    const kol = garsonKollar(i, G.jest);
    const Gk = govdeKes(Gp, { id: 's1-garson', kaynama: i, gogus: 92, tohum: Gp.tohum });
    const kisi = kisiSVG(Gp, { kaynama: i, ifade: G.ifade, bakis: G.bakis, mono: true });
    gSvg.innerHTML = `<defs><clipPath id="s1-garson-bel" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + BEL}"/></clipPath></defs>` +
      `<g clip-path="url(#s1-garson-bel)">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}</g>` + bacaklar(ar, G.agirlik) + onluk(ar) + kol.kol1 + kol.tepsi + kol.kol2;
  }
  const garsonPoz = (o) => { Object.assign(G, o); garsonCiz(); };
  garsonCiz(0);
  ctx.kaynayanlar.add((i) => garsonCiz(i));
  const gGoz = [gAyak[0], gUst + GOZ_Y * GO];
  const gBalon = minikBalon(g0, [gGoz[0], gGoz[1] - 10 * GO], 1, GO * 0.9, 761, 62 * GO);
  // Kahkaha çizgileri: başın sağ üstünde üç kısa çizgi, 12 fps'te iki yer arasında atlar
  const gulme = [0, 1].map((j) => {
    const g = el(g0, 'g'), cx = gGoz[0] + 92 * GO, cy = gGoz[1] - 70 * GO;
    for (const a of [-50, -15, 20]) {
      const t = yon(a + j * 8), r0 = (26 + j * 6) * GO, r1 = (54 + j * 8) * GO;
      cizgi(g, [topla([cx, cy], t, r0), topla([cx, cy], t, r1)], { kalinlik: Math.max(1.6, 4 * GO), tohum: T(), genlik: 0.5 });
    }
    gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS));
    return g;
  });

  // ---------- Sarkan lamba (A'nın masasının üstünde, ön planda)
  {
    const lx = P.lamba.x, ly = P.lamba.ip;
    cizgi(L.svg, [[lx, -500], [lx + 2, ly]], { kalinlik: 3, tohum: T(), genlik: 0.5 });
    cizgi(L.svg, kenarla([[lx - 22, ly], [lx + 22, ly], [lx + 76, ly + 62], [lx - 76, ly + 62]], 20), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 4, tohum: T() });
    cizgi(L.svg, oval(lx, ly + 64, 24, 12, 0, 180, 8), { kalinlik: 3.6, tohum: T(), dolgu: BALON });
  }

  // ---------- A (kahraman: en koyu, en ayrıntılı). Gövde masanın arkasında, kollar masanın önünde (aynı kutu düzlemi)
  const Ap = ctx.kisiParam('A');
  const Ao = P.A.o, MB = 540; // masa üstünün A'nın kutusundaki yüksekliği (birim)
  const aUst = P.A.masa - MB * Ao;
  const aVb = svgKutu(P.A.x, aUst, Ao);
  const aGoz = [P.A.x, aUst + GOZ_Y * Ao];
  const dunya = (q) => [P.A.x + (q[0] - 200) * Ao, aUst + q[1] * Ao]; // A'nın kutu birimi → sahne
  // Sandalye (A'nın arkasında): sırtın iki dikmesi gövdenin iki yanından masanın üstüne taşar ("oturuyor" işareti)
  const sandalye = el(L.svg, 'g');
  gsap.set(sandalye, { opacity: 0 });
  tl.set(sandalye, { opacity: 0 }, k(BAS));
  tl.to(sandalye, { opacity: 1, duration: k(16), ease: 'none' }, k(BAS + 6));
  const SX = 236 * Ao, sUst = P.A.masa - 156 * Ao;
  cizgi(sandalye, oval(P.A.x, sUst + 26 * Ao, SX + 4 * Ao, 22 * Ao, 180, 360, 14), { kalinlik: 12 * Ao, tohum: T(), genlik: 0.5, renk: M });
  cizgi(sandalye, oval(P.A.x, sUst + 26 * Ao, SX + 4 * Ao, 22 * Ao, 180, 360, 14), { kalinlik: 6 * Ao, tohum: T(), genlik: 0.5, renk: AHSAP });
  for (const yn of [-1, 1]) {
    const x = P.A.x + yn * SX, w = 9 * Ao;
    cizgi(sandalye, kenarla([[x - w, P.A.masa + 10], [x + w, P.A.masa + 10], [x + w + yn * 6 * Ao, sUst], [x - w + yn * 6 * Ao, sUst]], 24), { kapali: true, dolgu: AHSAP, kalinlik: 3.6, tohum: T() });
    cizgi(sandalye, oval(x + yn * 6 * Ao, sUst - 6 * Ao, 13 * Ao, 10 * Ao, 0, 360, 10), { kapali: true, dolgu: AHSAP, kalinlik: 3.4, tohum: T() });
  }
  const aG = el(L.svg, 'g');
  const aGovde = el(aG, 'svg', aVb);
  const masaA = el(L.svg, 'g');
  gsap.set(masaA, { opacity: 0 });
  tl.set(masaA, { opacity: 0 }, k(BAS));
  tl.to(masaA, { opacity: 1, duration: k(16), ease: 'none' }, k(BAS + 6)); // devirde kadraj dışında; geri çekilirken belirir
  const etekY = P.A.masa + P.masa.derin + P.masa.etek;
  // Masa (önden, hafif üstten): örtülü tabla, örtünün ön düşüşü, kıvrımlar
  function masa(ust, x, y, yari, derin, { kal = 4.5, etek = 200, kivrim = 3 } = {}) {
    const g = el(ust, 'g');
    const yA = yari * 0.9, alt = y + derin + etek;
    const etekUc = Array.from({ length: 9 }, (_, i) => [x + yari + 6 - ((2 * yari + 12) * i) / 8, alt + (i % 2 ? 5 : 0)]);
    cizgi(g, [...kenarla([[x - yari, y + derin], [x + yari, y + derin]], 26, false), ...kenarla([[x + yari, y + derin], [x + yari + 6, alt]], 26, false).slice(1, -1), ...etekUc, ...kenarla([[x - yari - 6, alt], [x - yari, y + derin]], 26, false).slice(1, -1)], { kapali: true, dolgu: MONO.giysi[6], kalinlik: kal, tohum: T() });
    for (let i = 1; i <= kivrim; i++) {
      const u = -1 + (2 * i) / (kivrim + 1), xx = x + u * yari * 0.92;
      cizgi(g, [[xx, y + derin + etek * 0.35], [xx + u * 4, alt - 2]], { kalinlik: kal * 0.55, tohum: T(), genlik: 0.6, renk: MONO.giysi[4] });
    }
    cizgi(g, kenarla([[x - yA, y], [x + yA, y], [x + yari, y + derin], [x - yari, y + derin]], 26), { kapali: true, dolgu: MONO.giysi[0], kalinlik: kal, tohum: T() });
    return { g, kose: [x + yA, y], onKose: [x + yari, y + derin] };
  }
  {
    // Örtünün altında: A'nın baldırları (oturuyor), sandalyenin ön ayakları, masanın tek ayağı ve tabanı
    const zemin = etekY + 320 * Ao;
    for (const yn of [-1, 1]) {
      const bx = P.A.x + yn * 62 * Ao;
      cizgi(masaA, kenarla([[bx - 26 * Ao, etekY - 30], [bx + 26 * Ao, etekY - 30], [bx + 22 * Ao + yn * 6, zemin - 30 * Ao], [bx - 22 * Ao + yn * 6, zemin - 30 * Ao]], 30), { kapali: true, dolgu: MONO.sac[3], kalinlik: 4.2, tohum: T() });
      cizgi(masaA, kenarla([[bx - 22 * Ao + yn * 6, zemin - 34 * Ao], [bx + 26 * Ao + yn * 20, zemin - 30 * Ao], [bx + 30 * Ao + yn * 24, zemin], [bx - 22 * Ao + yn * 6, zemin]], 14), { kapali: true, dolgu: M, kalinlik: 3, tohum: T() });
    }
    for (const yn of [-1, 1]) {
      const x = P.A.x + yn * (SX - 30 * Ao);
      cizgi(masaA, kenarla([[x - 6 * Ao, etekY - 20], [x + 6 * Ao, etekY - 20], [x + 6 * Ao + yn * 26 * Ao, zemin], [x - 6 * Ao + yn * 26 * Ao, zemin]], 30), { kapali: true, dolgu: AHSAP, kalinlik: 3.4, tohum: T() });
    }
    const ax = P.A.x + 10;
    cizgi(masaA, [[ax, etekY - 10], [ax + 1, zemin - 14]], { kalinlik: 9, tohum: T(), genlik: 0.4 });
    cizgi(masaA, kenarla([[ax - 86, zemin - 14], [ax + 86, zemin - 14], [ax + 96, zemin], [ax - 96, zemin]], 30), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 4, tohum: T() });
  }
  const ms = masa(masaA, P.A.x + 10, P.A.masa, P.masa.yari, P.masa.derin, { etek: P.masa.etek });
  // A'nın masası BOŞ: yalnız boş fincan tabağı + kaşık (çay yok); sağ arka köşe boş (QR'ın yeri)
  {
    const fx = P.A.x + 64 * Ao / 0.92, fy = P.A.masa + P.masa.derin * 0.5;
    cizgi(masaA, oval(fx, fy, 50, 12, 0, 360, 18, 2.2), { kapali: true, dolgu: BALON, kalinlik: 3.6, tohum: T() });
    cizgi(masaA, oval(fx, fy - 1, 21, 5, 0, 360, 12, 2.2), { kapali: true, kalinlik: 2.6, tohum: T(), genlik: 0.5 });
    cizgi(masaA, [[fx + 30, fy - 3], [fx + 58, fy + 7], [fx + 84, fy + 11]], { kalinlik: 3.4, tohum: T(), genlik: 0.5 });
    cizgi(masaA, oval(fx + 24, fy - 5, 9, 5, 0, 360, 8), { kapali: true, dolgu: MONO.giysi[3], kalinlik: 2.6, tohum: T(), genlik: 0.4 });
  }
  const aKolG = el(L.svg, 'g');
  const aKol = el(aKolG, 'svg', aVb);

  // A'nın duruşu: cok (çöküş, birim; − doğrulma), egim (gövdenin yana yaslanması, derece; kalça çevresinde). Gövde
  // svg'de döner/iner; kollar dünyada kalır (masadaki dirsek ve el yerinde), omuzlar ve yüz noktaları aynı dönüşümle bulunur.
  const PIV = [200, MB + 20];
  const A = { kol: null, ifade: 'merak', bakis: [0, 0], cok: 0, egim: 0 };
  const donustur = (q, cok = A.cok, egim = A.egim) => {
    const c = Math.cos(egim * D2R), s = Math.sin(egim * D2R), dx = q[0] - PIV[0], dy = q[1] - PIV[1];
    return [PIV[0] + dx * c - dy * s, PIV[1] + dx * s + dy * c + cok];
  };
  const AKAL = 68; // kol kalınlığı (kapüşonlu: 64'ten biraz dolgun, kalkan kol çubuk gibi durmasın)
  const oA = omuzlar(Ap, { kalinlik: AKAL });
  const hwA = Ap.yuzEn, ceneA = GOZ_Y + 4 + Ap.yuzBoy;
  const KS = yer(-1, 1); // kalkan kol: yatayda ekranın solu (A'nın sağ eli), dikeyde sağı; söz balonu öbür yanda
  const KT = KS < 0 ? 'sol' : 'sag';
  // Masada dinlenen kollar (sabit, kutu birimi; kol.js 'dayanma' eli)
  const DIN = {
    sol: { dirsek: [oA.sol[0] - 26, MB + 6], bilek: [oA.sol[0] + 86, MB + 36], el: 'dayanma', elAci: 16, kisalma: 0.72, basparmak: -1 },
    sag: { dirsek: [oA.sag[0] + 26, MB + 6], bilek: [oA.sag[0] - 86, MB + 36], el: 'dayanma', elAci: 164, kisalma: 0.72, basparmak: 1 },
  };
  // Kaldırış pozları: omza göre (d dirsek, b bilek; x dışa doğru +), a parmak yönü (ekranın solundaki kol için; sağda aynalanır)
  const KALK = {
    kalk1a: { d: [74, 96], b: [92, -26], a: -98 },
    kalk1: { d: [88, 2], b: [86, -132], a: -96 },
    kalk2a: { d: [88, -58], b: [64, -198], a: -93 },
    kalk2: { d: [86, -84], b: [46, -236], a: -86 },
    salla: { d: [86, -84], b: [66, -232], a: -104 },
    ini1: { d: [80, 96], b: [72, -20], a: -94 },
  };
  function kolPoz(taraf, ad0) {
    if (ad0 === 'dinlen') return DIN[taraf];
    const s = taraf === 'sol' ? -1 : 1, O = donustur(oA[taraf]);
    if (KALK[ad0]) {
      const q = KALK[ad0];
      return { dirsek: [O[0] + s * q.d[0], O[1] + q.d[1]], bilek: [O[0] + s * q.b[0], O[1] + q.b[1]], org: { poz: 'acik', aci: s < 0 ? q.a : 180 - q.a, bs: -s, boy: 104, yay: 1, yuz: 'avuc' } };
    }
    // Yanağa yaslanma (ekranın sağındaki kol): dirsek masada, bilek çenenin altında, avuç yanağı tutar; parmaklar şakağa
    const bilekY = donustur([200 + hwA * 1.06, ceneA + 34]);
    if (ad0 === 'yanak') return { dirsek: [oA.sag[0] + 10, MB + 8], bilek: bilekY, org: { poz: 'yanak', aci: -95 + A.egim, bs: -1, boy: 100, en: 0.86, yuz: 'sirt' } };
    if (ad0 === 'yanak1') {
      const b = [(DIN.sag.bilek[0] + bilekY[0]) / 2 + 30, (DIN.sag.bilek[1] + bilekY[1]) / 2 - 10];
      return { dirsek: [oA.sag[0] + 22, MB + 6], bilek: b, org: { poz: 'yanak', aci: -76, bs: -1, boy: 100, en: 0.9, yuz: 'sirt' } };
    }
    return DIN[taraf];
  }
  function aCiz(i = kaynaSon) {
    const kisi = kisiSVG(Ap, { kaynama: i, ifade: A.ifade, bakis: A.bakis, mono: true });
    const kes = `<defs><clipPath id="s1-a-etek" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + (etekY - 24 - aUst) / Ao}"/></clipPath></defs>`;
    const don = `translate(0 ${A.cok.toFixed(1)}) rotate(${A.egim} ${PIV[0]} ${PIV[1]})`;
    if (!A.kol) { aGovde.innerHTML = `${kes}<g clip-path="url(#s1-a-etek)"><g transform="${don}">${kisi}</g></g>`; aKol.innerHTML = ''; return; }
    const Gk = govdeKes(Ap, { id: 's1-a', kaynama: i, tohum: Ap.tohum });
    aGovde.innerHTML = `${kes}<g clip-path="url(#s1-a-etek)"><g transform="${don}">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}</g></g>`;
    const ten = MONO.ten[Ap.ten];
    const ortak = { giysi: MONO.giysi[Ap.giysi], ten, kaynama: i, manset: 'ribana', kalinlik: AKAL };
    let s = '';
    for (const taraf of ['sag', 'sol']) {
      const q = kolPoz(taraf, A.kol[taraf]), omuz = donustur(oA[taraf]), tohum = taraf === 'sag' ? 22 : 21;
      if (q.org) {
        // organik el kolun altında: yenin ağzı bileği örter
        s += elOrganik({ ...q.org, bilek: q.bilek, ten, kaynama: i, tohum: tohum + 5 });
        s += kolSVG({ ...ortak, omuz, dirsek: q.dirsek, bilek: q.bilek, el: 'acik', elBoy: 0.01, taraf, tohum });
      } else s += kolSVG({ ...ortak, omuz, ...q, taraf, tohum });
    }
    if (A.kol.sag === 'yanak') {
      // avucun ittiği yanak: gözün altında yukarı kalkmış kısa kıvrım
      const ar = araclar(29, i, 0.5);
      s += ar.cz([donustur([200 + hwA * 0.42, GOZ_Y + 30]), donustur([200 + hwA * 0.6, GOZ_Y + 22]), donustur([200 + hwA * 0.76, GOZ_Y + 26])], 2.8);
    }
    aKol.innerHTML = s;
  }
  const aPoz = (o) => { if (o.kol) o = { ...o, kol: { ...(A.kol || {}), ...o.kol } }; Object.assign(A, o); aCiz(); };
  aCiz(0);
  ctx.kaynayanlar.add((i) => aCiz(i));

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

  // ---------- Konuşma balonları (sesli söz): kalkan elin öbür yanında, yüzün yanında. Kuyruk ağız hizasında ağzı gösterir
  // ama yüzün ve halka küpenin dışında durur (kuyruk yanağın üstünden geçmesin)
  const KY = -KS;
  const agiz = [P.A.x + KY * (Ap.yuzEn * 1.04 + 36) * Ao, aUst + (GOZ_Y + 4 + Ap.yuzBoy * 0.5) * Ao];
  const kb1 = ctx.konus(L, metin('Bakar mısınız?', 'Excuse me?'), { x: P.konus1.x, y: P.konus1.y, boyut: P.konus1.boyut, kuyruk: agiz, tohum: 731, aci: -2 * KY });
  const kb2 = ctx.konus(L, metin('Bakar mısınız?!', 'Excuse me?!'), { x: P.konus2.x, y: P.konus2.y, boyut: P.konus2.boyut, kuyruk: agiz, tohum: 741, aci: -3 * KY });
  // Caveat'in eğik "?" kıvrımı yazı kutusunun sağından taşar; yazma maskesi onu kesmesin diye kutuya sağ pay
  for (const p of [kb1.p, kb2.p]) p.style.paddingRight = '0.3em';
  kb1.ac(310, 16); ctx.isaret(310, 'konusma'); kb1.kapat(382, 4);
  kb2.ac(382, 12); ctx.isaret(382, 'konusma'); kb2.kapat(430, 10);

  // ---------- Düşünce balonu (#5) ve içi: masa köşesi, çadır QR standı, telefon + okutma çizgileri, vurgu halkası
  const BL = P.balon, bc = BL.c, br = BL.r;
  // A'nın son duruşu (yanak avuçta: çöküş 40, eğim 5): balon noktaları başın sağ üstünden çıkar
  const SON_DURUS = { cok: 40, egim: 7 };
  const aBas = dunya(donustur([266, 96], SON_DURUS.cok, SON_DURUS.egim));
  const bal = (() => {
    const deneme = ctx.balon(defs, { c: bc, r: br, noktalar: [[bc[0], bc[1], 1]], tohum: 53 }); // yalnız ölçü için
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
  bal.ac(480);
  ctx.isaret(480, 'dusunce');
  // A iç sesine dalarken kafe kâğıda doğru solar (odak; kenarlarda yarım figüran yüzü göze batmasın)
  tl.to(arka, { opacity: yer(0.4, 0.3), duration: k(40), ease: 'power1.inOut' }, k(484));
  tl.to(menuG, { opacity: yer(0.4, 0.12), duration: k(40), ease: 'power1.inOut' }, k(484));
  const ic = bal.ic;
  const IC = P.ic, qb = br[1] * IC.qb, qx = bc[0] + br[0] * IC.qx, qy = bc[1] + br[1] * IC.qy;
  // Masa köşesi (A'nın kendi masası, aynı tonlar): üst yüz + ön kalınlık. Sol uç açık, balonun içinde biter.
  const mYb = qy + qb * 0.3, mYf = qy + qb * 0.52, mXl = bc[0] - br[0] * 0.48, mXb = qx + qb * 1.28, mXf = qx + qb * 1.42;
  const mKal = qb * 0.075, mXl2 = mXl - qb * 0.06;
  const masaUst = cizgi(ic, [...kenarla([[mXl, mYb], [mXb, mYb], [mXf, mYf]], 24, false), ...kenarla([[mXf, mYf], [mXl2, mYf]], 24, false).slice(1)], { dolgu: MONO.giysi[0], kalinlik: 4.5, tohum: T(), kay: [0, 0] });
  const masaKal = cizgi(ic, kenarla([[mXl2, mYf], [mXf, mYf], [mXf, mYf + mKal], [mXl2, mYf + mKal]], 24, false), { dolgu: MONO.giysi[6], kalinlik: 4, tohum: T(), kay: [0, 0] });
  // QR standı: cizimler.js'teki AYNI noktalar (finaldeki logo inşası bunları kullanır); kenarlar sık noktalanır
  const qr = CIZIMLER.qrStandi.map((kt, i) => {
    const pts = kt.p.map(([x, y]) => [qx + x * qb, qy + y * qb]);
    return cizgi(ic, kenarla(pts, Math.max(6, qb * 0.05), !!kt.kapali), { kapali: !!kt.kapali, kalinlik: 5, tohum: 40 + i, genlik: 1.0, dolgu: i === 0 ? BALON : null, kay: [0, 0] });
  });
  // Telefon (eğik, havada: okutuyor): koyu gövde, açık ekran, hoparlör yarığı; ekranda tarama çerçevesi; QR'a kesikli çizgi
  const tx = qx + qb * IC.tx, ty = qy + qb * IC.ty, ta = -12 * D2R;
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
    const a = (-120 + (400 * j) / 26) * D2R, b = 1 + (0.08 * j) / 26;
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
  ciz([masaUst, masaKal], 492, 10, { stagger: 2 });
  ciz(qr, 498, 9, { stagger: 1.1 });
  ciz([tel, ekran, yarik, ...cerceve], 514, 9, { stagger: 1.2 });
  tl.to(isin.map((h) => h.g), { autoAlpha: 1, duration: k(6), ease: 'none', stagger: k(2) }, k(528));
  tl.fromTo(isin.map((h) => h.yol), { strokeDashoffset: 0 }, { strokeDashoffset: -19 * 20, duration: k(SON + 1 - 528), ease: 'steps(20)', immediateRender: false }, k(528));
  const halkaBit = ciz([halka], 538, 16, { ease: 'power1.inOut' });
  ctx.isaret(halkaBit, 'vurgu');

  // El yazısı (iç ses): balonun üst yarısında iki satır; balon oturduktan sonra yazılır
  const yb = IC.yazi, yaziX = bc[0] + br[0] * IC.yx, yaziY = bc[1] + br[1] * IC.yy;
  const satir1 = ctx.elYazisi(L.div, metin('Şurada bir <b>QR</b> olsa da', 'If only there were'), { x: yaziX, y: yaziY, boyut: yb, aci: -2 });
  const satir2 = ctx.elYazisi(L.div, metin('sipariş verebilsem…', 'a <b>QR</b> to order…'), { x: yaziX + yb * 0.9, y: yaziY + yb * 1.08, boyut: yb, aci: -2 });
  for (const p of [satir1, satir2]) p.style.paddingRight = '0.3em';
  // tam cümle k524'ten SON'a ~120 k ekranda
  ctx.yazElYazisi(satir1, 494, 18);
  ctx.yazElYazisi(satir2, 508, 16);

  // #5 kamera: yüz asılırken (k432) A'ya ve balonun açılacağı yere yaklaşır (70 k KM, üstel), sonra yavaş %2 itiş. Kadraj,
  // balonun gerçek dış hattı (örneklenmiş, tümsekler dahil) ile A'nın başı + masanın sağ köşesini birlikte, itişin sonunda da
  // 32 px payla içine alacak biçimde hesaplanır.
  {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    const ekle = (x, y) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); };
    const yolE = bal.kontur, uz = yolE.getTotalLength();
    for (let s2 = 0; s2 <= uz; s2 += 6) { const p = yolE.getPointAtLength(s2); ekle(p.x, p.y); }
    ekle(P.A.x - P.masa.yari - 10, aUst + 80 * Ao); ekle(ms.onKose[0] + 20, ms.onKose[1] + 24);
    const pay = 32, son = Math.min((W - 2 * pay) / (b[2] - b[0]), (H - 2 * pay) / (b[3] - b[1])), s5 = son / 1.02;
    const c5 = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    const K5 = odakK(s5, c5), K6 = odakK(son, c5);
    kameraUstel(432, 70, K4, K5);
    tl.fromTo(ctx.kamera, K5, { ...K6, duration: k(SON + 1 - 502), ease: 'none', immediateRender: false }, k(502));
  }

  // ---------- Oyunculuk: A
  // #3: devirde v1'in son pozunda (merak, bakış düz, kolsuz gövde); k200 göz kırpar (kollar bu karede gelir), garsona bakar
  poz(BAS, () => aPoz({ kol: null, ifade: 'merak', bakis: [0, 0], cok: 0, egim: 0 }));
  poz(200, () => { A.kol = { sol: 'dinlen', sag: 'dinlen' }; aPoz({ ifade: 'kirp' }); });
  poz(205, () => aPoz({ ifade: 'notr', bakis: [1, 0] }));
  poz(225, () => aPoz({ ifade: 'notr', bakis: [0, 1] }));   // boş tabağa bakar
  poz(240, () => aPoz({ ifade: 'merak', bakis: [1, -1] })); // garsona
  poz(262, () => aPoz({ ifade: 'notr', bakis: [1, 0] }));
  poz(272, () => aPoz({ ifade: 'kirp' }));
  poz(277, () => aPoz({ ifade: 'merak', bakis: [1, -1] }));
  // #4: el kalkar (12 fps), ağzı açılır: söz
  poz(300, () => aPoz({ kol: { [KT]: 'kalk1a' }, ifade: 'merak', bakis: [1, -1] }));
  poz(305, () => aPoz({ kol: { [KT]: 'kalk1' } }));
  poz(310, () => aPoz({ ifade: 'saskin' }));
  poz(328, () => aPoz({ ifade: 'merak', bakis: [1, -1] }));
  poz(345, () => aPoz({ ifade: 'notr', bakis: [1, 0] }));
  poz(355, () => aPoz({ ifade: 'sikkin', bakis: [1, -1] }));
  // İkinci deneme: yarı doğrulur, el daha yükseğe, sallar
  poz(372, () => aPoz({ kol: { [KT]: 'kalk2a' }, ifade: 'merak', bakis: [1, -1], cok: -7 }));
  poz(377, () => aPoz({ kol: { [KT]: 'kalk2' }, cok: -14 }));
  poz(382, () => aPoz({ ifade: 'saskin' }));
  for (let n = 387; n < 412; n += 10) { poz(n, () => aPoz({ kol: { [KT]: 'salla' } })); poz(n + 5, () => aPoz({ kol: { [KT]: 'kalk2' } })); }
  {
    // Sallama çizgileri: elin balona bakan yanında kısa yaylar, 12 fps'te iki yer arasında atlar (el sallanıyor).
    // Öbür yanda yay yok: o yandaki masanın minik balonuna biner
    const O = oA[KT], hx = P.A.x + (O[0] + KS * 58 - 200) * Ao, hy = aUst + (O[1] - 14 - 308) * Ao;
    const yay = (cx, cy, a0, a1, r) => oval(cx, cy, r, r * 1.1, a0, a1, 6);
    const cizgiler = [[[-40, 6], [72, 96]], [[-64, -20], [80, 104]]].map(([[a0, a1], [r0, r1]], j) => {
      const g = el(L.svg, 'g');
      const [b0, b1] = KS < 0 ? [a0, a1] : [180 - a1, 180 - a0];
      for (const r of [r0, r1]) cizgi(g, yay(hx, hy - j * 10, b0, b1, r * Ao), { kalinlik: 4, tohum: T(), genlik: 0.6 });
      gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS));
      return g;
    });
    for (let n = 387; n < 412; n += 10) {
      tl.set(cizgiler[0], { autoAlpha: 1 }, k(n)); tl.set(cizgiler[0], { autoAlpha: 0 }, k(n + 5));
      tl.set(cizgiler[1], { autoAlpha: 1 }, k(n + 5)); tl.set(cizgiler[1], { autoAlpha: 0 }, k(n + 10));
    }
  }
  poz(400, () => aPoz({ ifade: 'merak', bakis: [1, -1] }));
  // el iner; garsonun kahkahasını görür
  poz(418, () => aPoz({ kol: { [KT]: 'ini1' }, ifade: 'notr', bakis: [1, -1], cok: -7 }));
  poz(424, () => aPoz({ kol: { [KT]: 'dinlen' }, cok: 0 }));
  ctx.isaret(adim(424), 'tik'); // el masaya iner
  // #5a: yüz asılır: kaşlar iner, ağız aşağı, omuzlar düşer; boş tabağa bakar
  ctx.isaret(426, 'sessizlik', { bitis: 478 });
  poz(432, () => aPoz({ ifade: 'sikkin', bakis: [1, 0], cok: 10 }));
  poz(437, () => aPoz({ cok: 18 }));
  poz(447, () => aPoz({ ifade: 'ozlem', bakis: [0, 1], cok: 24 }));
  poz(457, () => aPoz({ ifade: 'kirp' }));
  poz(462, () => aPoz({ ifade: 'ozlem', bakis: [0, 1] }));
  // #5b: dirsek masaya, yanak avuca (gövde o yana yaslanır): sıkılmış; göz kapakları yarı inik, bakış balona
  poz(470, () => aPoz({ kol: { sag: 'yanak1' }, ifade: 'sikkin', bakis: [0, 1], cok: 32, egim: 3 }));
  ctx.isaret(adim(470), 'tik'); // dirsek masaya
  poz(475, () => aPoz({ kol: { sag: 'yanak' }, cok: SON_DURUS.cok, egim: SON_DURUS.egim }));
  poz(485, () => aPoz({ ifade: 'sikkin', bakis: [1, -1] }));
  poz(540, () => aPoz({ ifade: 'kirp' }));
  poz(545, () => aPoz({ ifade: 'sikkin', bakis: [1, -1] }));
  poz(578, () => aPoz({ ifade: 'sikkin', bakis: [0, 0] }));  // bir an boşluğa
  poz(600, () => aPoz({ ifade: 'kirp' }));
  poz(605, () => aPoz({ ifade: 'sikkin', bakis: [1, -1] })); // gözü balona döner: sorun asılı

  // ---------- Oyunculuk: garson ve müşteri (12 fps). Garson konuşur, anlatır, kahkaha atar; A'nın iki seslenmesi de
  // onun sözüne / kahkahasına denk gelir. Bakışı hep müşteride (ekranın sağı, aşağı).
  const musteri = kisiAd(6).h, musteri2 = kisiAd(7)?.h; // dikeyde müşterinin sırtı dönük arkadaşı yok
  musteri.poz({ ifade: 'mutlu', bakis: [-1, -1] });
  const mBalon = minikBalon(kisiAd(6).g, musteri.goz, 1, kisiAd(6).o, 771, 50 * kisiAd(6).o);
  const sek = (n, dy = 3) => { tl.set(gSar, { y: dy }, k(adim(n))); tl.set(gSar, { y: 0 }, k(adim(n) + 5)); };
  const balonAc = (bg, a, b) => {
    tl.fromTo(bg, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: k(6), ease: E.BO, immediateRender: false }, k(a));
    tl.to(bg, { autoAlpha: 0, scale: 0.8, duration: k(5), ease: E.EI }, k(b - 5));
  };
  const gulus = (a, b) => {
    for (let n = adim(a); n < b; n += 10) {
      tl.set(gulme[0], { autoAlpha: 1 }, k(n)); tl.set(gulme[0], { autoAlpha: 0 }, k(n + 5));
      tl.set(gulme[1], { autoAlpha: 1 }, k(n + 5)); tl.set(gulme[1], { autoAlpha: 0 }, k(n + 10));
      sek(n, 4);
    }
  };
  // [kare, garson durumu]
  const GAKIS = [
    [BAS, { ifade: 'mutlu', bakis: [1, 1], jest: 'anlat', agirlik: 1 }],
    [204, { jest: 'anlat2' }], [214, { jest: 'yukari', ifade: 'merak' }], [224, { jest: 'anlat', ifade: 'mutlu' }], [234, { jest: 'anlat2' }],
    [244, { jest: 'kalca', ifade: 'merak', agirlik: -1 }],                                   // dinler
    [284, { jest: 'gogus', ifade: 'mutlu' }],                                                  // güler
    [302, { jest: 'anlat', agirlik: 1 }], [312, { jest: 'yukari', ifade: 'merak' }], [322, { jest: 'anlat2', ifade: 'mutlu' }], [332, { jest: 'yukari' }], [342, { jest: 'anlat' }],
    [352, { jest: 'kalca', ifade: 'merak', agirlik: -1 }],
    [384, { jest: 'gogus', ifade: 'mutlu', agirlik: 1 }],                                      // kahkaha (A'nın ikinci seslenmesi)
    [418, { jest: 'anlat' }], [428, { jest: 'yukari', ifade: 'merak' }], [438, { jest: 'anlat2', ifade: 'mutlu' }], [448, { jest: 'anlat' }],
    [460, { jest: 'kalca', ifade: 'merak', agirlik: -1 }],
    [500, { jest: 'gogus', ifade: 'mutlu' }],
    [522, { jest: 'anlat', agirlik: 1 }], [534, { jest: 'yukari' }], [546, { jest: 'anlat2' }], [558, { jest: 'sark', ifade: 'notr' }],
    [580, { jest: 'kalca', ifade: 'merak', agirlik: -1 }], [612, { jest: 'anlat', ifade: 'mutlu', agirlik: 1 }], [626, { jest: 'yukari' }],
  ];
  for (const [n, d] of GAKIS) poz(n, () => garsonPoz(d));
  for (const [a, b] of [[200, 242], [302, 350], [418, 458], [522, 562], [612, 647]]) balonAc(gBalon, a, b);
  for (const [a, b] of [[248, 282], [356, 382], [464, 498], [584, 610]]) balonAc(mBalon, a, b);
  for (const n of [252, 266, 362, 470, 486, 590]) sek(n); // dinlerken başını sallar
  gulus(284, 300); gulus(384, 414); gulus(500, 516);
  // müşteri: konuşurken 'merak'/'mutlu', garson güldürünce kahkaha
  const MAKIS = [[BAS, 'mutlu'], [214, 'merak'], [234, 'mutlu'], [248, 'merak'], [266, 'mutlu'], [302, 'notr'], [322, 'mutlu'], [356, 'merak'], [384, 'mutlu'], [418, 'notr'], [438, 'mutlu'], [464, 'merak'], [500, 'mutlu'], [522, 'notr'], [584, 'merak'], [612, 'mutlu']];
  for (const [n, f] of MAKIS) poz(n, () => musteri.poz({ ifade: f, bakis: [-1, -1] }));
  for (const n of [258, 290, 366, 392, 474, 508]) { tl.set(musteri.g, { y: -2 }, k(adim(n))); tl.set(musteri.g, { y: 0 }, k(adim(n) + 5)); }
  if (musteri2) for (const n of [222, 292, 340, 396, 446, 506, 560]) { tl.set(musteri2.g, { y: -2 }, k(adim(n))); tl.set(musteri2.g, { y: 0 }, k(adim(n) + 5)); }

  // ---------- Oyunculuk: öteki masalar (sohbet, bakış, göz kırpma; sırtı dönükler başını sallar)
  {
    const t4a = kisiAd(4), t4b = kisiAd(5);
    const b4a = minikBalon(t4a.g, t4a.h.goz, -1, t4a.o, 701, 50 * t4a.o), b4b = minikBalon(t4b.g, t4b.h.goz, 1, t4b.o, 704);
    const sira = [[0, 200, 238], [1, 246, 290], [0, 298, 334], [1, 342, 384], [0, 394, 430], [1, 468, 506], [0, 528, 566], [1, 588, 628]];
    for (const [j, a, b] of sira) {
      const kon = j ? t4b : t4a, din = j ? t4a : t4b;
      balonAc(j ? b4b : b4a, a, b);
      poz(a, () => { kon.h.poz({ ifade: 'mutlu' }); din.h.poz({ ifade: 'merak' }); });
      for (let n = adim(a); n < b - 5; n += 10) { tl.set(kon.h.g, { y: -2 }, k(n)); tl.set(kon.h.g, { y: 0 }, k(n + 5)); }
      poz(b, () => { kon.h.poz({ ifade: 'notr' }); din.h.poz({ ifade: 'notr' }); });
    }
    poz(BAS, () => t4a.h.poz({ ifade: 'notr', bakis: [1, 0] }));
    // arka sıra, laptoplu, ön sağdaki kız, barista: tohumlu küçük canlılık
    const canli = (h, tohum, bakislar, ifadeler = ['notr', 'mutlu', 'merak', 'notr']) => {
      const r = rng(tohum);
      for (let n = BAS + 4 + Math.floor(r() * 18); n < SON - 10; n += 34 + Math.floor(r() * 30)) {
        const f = ifadeler[Math.floor(r() * ifadeler.length)], b = bakislar[Math.floor(r() * bakislar.length)];
        poz(n, () => h.poz({ ifade: f, bakis: b }));
        if (r() < 0.45) { poz(n + 14, () => h.poz({ ifade: 'kirp' })); poz(n + 19, () => h.poz({ ifade: f })); }
      }
    };
    const on = kisiler.filter((q) => q.tur === 'on' && ![4, 6].includes(q.fig));
    on.forEach((q, j) => canli(q.h, 900 + j * 17, q.fig === 1 ? [[0, 1], [0, 1], [1, 1]] : [[1, 0], [-1, 0], [0, 0], [-1, 1]]));
    canli(barista, 950, [[-1, 1], [-1, 1], [0, 0]], ['notr', 'notr', 'mutlu']);
    const sirt = kisiler.filter((q) => q.tur === 'arka' && q.fig !== 7);
    sirt.forEach((q, j) => { const r = rng(960 + j); for (let n = BAS + 10 + Math.floor(r() * 20); n < SON; n += 40 + Math.floor(r() * 30)) { tl.set(q.h.g, { y: -2 }, k(adim(n))); tl.set(q.h.g, { y: 0 }, k(adim(n) + 5)); } });
  }
  // geri sarmada ilk pozlar dönsün
  tl.call(() => { A.kol = null; aPoz({ ifade: 'merak', bakis: [0, 0], cok: 0, egim: 0 }); garsonPoz(GAKIS[0][1]); }, null, k(BAS - 1));
  void ms; void H;
}
