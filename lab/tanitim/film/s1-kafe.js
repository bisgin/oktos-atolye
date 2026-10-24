// Sahne 1, KAFE (#3–#5, k192–950; ARALIK). A (kısa boylu, yanaklı, kıvırcık saçlı genç kız) kalabalık bir kafede tek başına;
// garsona seslenir, görülmez; yüzü asılır; yanağını yumruğuna yaslar, iç çeker. Sıkılıp masadaki kalemle peçeteye kendi
// uydurduğu yaratığı karalar (K1, kullanıcı 2026-10-25). Balonda çizim peçeteden kalkar, kalınlaşır,
// masasında kendi gölgesiyle durur: "Bu masamda dursa…". Tam o an garson sonunda gelir, yine yüzüne bakmadan tabağı tepsiye
// koyar, peçeteyi buruşturup götürür; balon söner. Sahne SORUNDA biter (fikir gitti): çözüm, ürün yok.
// v06 r2 (kullanıcının kare kare notları): "sağa sola bırakılmış aset" yerine derinlikte dizili kalabalık kafe; garson dik
// ve canlı (bir elinde tepsi, öteki el konuşurken oynar, güler, başını sallar; A'ya hiç dönmez); A'nın eli organik
// (tek dış hatlı avuç, ayrık ama doğal parmaklar); iki seslenmeden sonra yüz asılır; düşünürken yanağı avucunda (sıkılmış).
// Derinlik: göz hizası kamerası. Her şey (o: ölçek, h: yerden yükseklik, kutu birimi) ile yerleşir: ekran y = H0 + (K − h)·o.
// Oturan herkesin başı ufuk çizgisinin çevresinde kalır (kalabalık bandı); uzak olan küçük, açık ve ince çizgili (pus).
// v06 r3 (kullanıcı 2026-10-23: "60 fps güzel ama her şey çok hızlı, sahne demlensin; geçişte ~100 kare sıkılma pozu;
// yanaktaki el insan gibi olsun"): zaman çapaları Z'de (kur içinde). Önemli her andan sonra 0,4–0,8 sn nefes, üst üste
// binen hareketler ayrık, garsonun ve figüranların mikro hareketleri seyrek, konuşma balonları ≥ 2 sn.
// v06 r4 (kullanıcı 2026-10-23: "ilk karakterin eli, saksı sahnesindeki karakterin düşünürkenki eli gibi olsun, eli
// yanağında kapalı halde"): yanak eli s3-balkon D'nin düşünme yumruğu (kol.js 'cene'); el yanağa giderken kapanır (elYumruk).
// #3 (k192–263) Devir: v1'in son yüzü A, aynı yerde ve ölçekte; 58 k KM üstel geri çekilme, kafe genel planı (k194–216 kâğıttan
//    belirir). Arka duvar: büyük camlar, kara tahta menü, tezgâh + espresso makinesi + barista; arka sırada dört masa (biri
//    laptoplu), orta sırada iki masa (birer kişi sırtı dönük), sağ önde sırtı dönük bir kız. Garson sağdaki masanın müşterisiyle
//    sohbette: konuşur (minik balonda karalama), elini oynatır, güler.
// #4 (k264–489) A elini kaldırır (18 k), "Bakar mısınız?" (k282, 2 sn). Garson müşterinin şakasına güler (k324): görülmez,
//    yüzü düşer, nefes. İkinci deneme (k376): yarı doğrulur, el daha yükseğe, "Bakar mısınız?!" (k396; birinciyi şişirir), iki
//    kez sallar; garson kahkaha atar, eli göğsünde: A'ya dönmez. El havada asılı kalır (k436–462, karşılıksız), iner (k484).
// #5 (k490–950) Yüz asılır: kaşlar iner, ağız aşağı, omuzlar düşer (k490–518); kamera A'ya ve balonun yerine yaklaşır; nefes.
//    k544–574 el kapanarak yanağa gider, k568–588 baş yumruğa çöker, o yana yaslanır, yanak ezilir: sıkılmış. k590 iç çekiş.
//    K1 (2026-10-25): k600 kamera ele ve peçeteye iner; k616 boştaki el masadaki kaleme uzanır. k630–719 kuş bakışı ara çekim
//    (kesmeyle): sağ el kalemi üç parmakla tutar, kalemin ucu peçetede yaratığın konturlarını çizer (k640–700; cizimler.js yaratik,
//    yalnız mürekkep), el çıkar, karalama okunur. k720 kesmeyle orta plana dönüş, kamera geri çekilir. k728 düşünce
//    balonu: masa köşesi, peçete, aynı karalama; k764 çizim kalkar, döner, kalınlaşır, renklenir (fikirler renkli, kişiler ve
//    mekân mono), k796 masaya kendi gölgesiyle konar; el yazısı "Bu masamda dursa…" (k780–902). Kafe kâğıda doğru solar.
//    k776 garson sohbeti bitirir, tepsiyi öbür eline alır; k812 yürüyerek gelir (kafe geri gelir), k858 eğilir, tabağı tepsiye
//    koyar, k896 peçeteyi buruşturur ve kaldırır: balon söner, A'nın ağzı açık kalır. k924 garson döner, gider. k951 kesme.
// Kare hızları: HAREKET 60 fps (kullanıcı 2026-10-22: 12 fps adımlama kesik görünüyordu): gövde çöküşü ve eğimi, kollar
// (dirsek ve bilek omuz çevresinde kutupsal ara değerle yay çizer), el biçimi (açık el ↔ yumruk kapanışı), garsonun
// jestleri ve ağırlık aktarımı, sekmeler, kahkaha ve sallama çizgileri her karede izlerden hesaplanır (herKare). Yüz ifadesi
// ve bakış ayrık çizimdir (göz kırpma 4 k); kamera / yazı / balon 60 fps; kaynama çekirdekte 8 fps.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye İÇ (mutlak) kare zamanlı tween ekler; window'a bir şey yazmaz.
import { kisiSVG, govdeOlcusu, boyKaymasi, yol as yolCiz, rng } from '../insan.js';
import { kolSVG, omuzlar, govdeKes, bilekBul, kolIK } from '../kol.js';
import { CIZIMLER, URUN_RENK, duz } from './cizimler.js';

export const ARALIK = [192, 950];

const D2R = Math.PI / 180;
const yon = (d) => [Math.cos(d * D2R), Math.sin(d * D2R)];
const dikV = (t) => [-t[1], t[0]]; // +90°: yerel çerçevede başparmak yanı
const topla = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s];
const f2 = (v) => (+v).toFixed(2);

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
// Açık el (yay) ile yanak eli arasında karışım (m 0 → 1): el yanağa giderken parmaklar akarak bitişir
function elKaris(yay, m) {
  const a = EL_POZ.acik(yay);
  if (m <= 0) return a;
  const b = EL_POZ.yanak();
  if (m >= 1) return b;
  const L = (x, y) => x + (y - x) * m, L2 = (p, q) => [L(p[0], q[0]), L(p[1], q[1])];
  const P = (p, q) => ({ b: L2(p.b, q.b), a: L(p.a, q.a), l: L(p.l, q.l), r: L(p.r, q.r), k: L(p.k, q.k) });
  return { parmak: a.parmak.map((p, i) => P(p, b.parmak[i])), bas: P(a.bas, b.bas), ag: L2(a.ag, b.ag) };
}
// Ara değer yardımcıları: açı farkı (en kısa yol, derece); omuz çevresinde kutupsal ara değer (bilek ve dirsek yay çizer)
const aciFark = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
const ara = (a, b, t) => a + (b - a) * t;
function kutupAra(O, p, q, t) {
  const r0 = Math.hypot(p[0] - O[0], p[1] - O[1]), r1 = Math.hypot(q[0] - O[0], q[1] - O[1]);
  const a0 = Math.atan2(p[1] - O[1], p[0] - O[0]) / D2R, a1 = Math.atan2(q[1] - O[1], q[0] - O[0]) / D2R;
  const a = (a0 + aciFark(a0, a1) * t) * D2R, r = ara(r0, r1, t);
  return [O[0] + r * Math.cos(a), O[1] + r * Math.sin(a)];
}
// Kol ara pozu (ileri kinematik): dirsek omuz çevresinde, ön kol dirsek çevresinde döner (el önce kalkar, masada kaymaz)
function kolAra(O, d0, b0, d1, b1, t) {
  const d = kutupAra(O, d0, d1, t);
  const v = kutupAra([0, 0], [b0[0] - d0[0], b0[1] - d0[1]], [b1[0] - d1[0], b1[1] - d1[1]], t);
  return { dirsek: d, bilek: [d[0] + v[0], d[1] + v[1]] };
}
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

// ---------- Yumruk eli (yanağa yaslanan el; kullanıcı 2026-10-23: "saksı sahnesindeki karakterin düşünürkenki eli gibi
// olsun, eli yanağında kapalı halde"). s3-balkon'da D'nin son pozu kol.js 'cene' gevşek yumruğudur: dört parmağın boğum
// tümsekleri üstte yanağa dayanır, aralarında kısa parmak çizgileri, altında parmak uçlarının avuca girdiği kıvrım çizgisi,
// başparmak yumruğun çene yanındaki kenarı boyunca uzanır. Burada aynı yumruk (ölçüleri kol.js'ten) masadaki gevşek elden
// (kol.js 'dayanma' ölçüleri) kapanarak kurulur, c 0 → 1: avuca kıvrılan parmak önden bakışta kısalır, parmaklar boğum
// tümseğine iner, aralarındaki oluk sığlaşır, uçlar basıklaşır. Masada el sırtı, yanakta avuç izleyiciye döner (başparmak
// yanı ters yana geçer); el kenarına dönüp ince bir şeride inmesin diye gövde hiç aynalanmaz: yumruk v'de aynalı tanımlıdır
// (kol.js 'cene', başparmak −1 ile aynı çizim) ve başparmak parmakların önünden öbür yana geçerek yumruğun çene yanındaki
// kenarına yatar. Yerel çerçeve kol.js ile aynı: bilek (0,0), u parmaklara, v el sırtı görünürken başparmak yanına (+),
// birim = el boyu.
// parmak: [kök, yön (derece, + v'ye), boy, yarıçap], +v'den −v'ye (açık elde işaret → serçe, yumrukta serçe → işaret);
// oluk: parmak arası çukurun kökten yüksekliği; bas: uçların basıklığı (1 yuvarlak); bp: başparmak [kök, yön, boy, yarıçap,
// büküm]; yanB / yanS: avucun +v ve −v kenarı (bilekten ilk parmak köküne / son parmak kökünden bileğe; bilek ucu yenin içinde)
const YUM = {
  acik: {
    parmak: [[[0.47, 0.16], 5, 0.42, 0.06], [[0.515, 0.055], 1, 0.46, 0.062], [[0.505, -0.055], -3, 0.43, 0.06], [[0.455, -0.155], -8, 0.35, 0.055]],
    oluk: 0.02, bas: 1, bp: [[0.12, 0.17], 40, 0.36, 0.074, -4],
    yanB: [[-0.14, 0.142], [0, 0.171], [0.17, 0.234], [0.33, 0.254], [0.45, 0.228]],
    yanS: [[0.42, -0.214], [0.3, -0.226], [0.14, -0.198], [0, -0.159], [-0.14, -0.137]],
  },
  yumruk: {
    parmak: [[[0.538, 0.148], 0, 0, 0.044], [[0.576, 0.048], 0, 0, 0.046], [[0.586, -0.058], 0, 0, 0.046], [[0.563, -0.162], 0, 0, 0.046]],
    oluk: 0, bas: 0.55, bp: [[0.14, -0.2], -16, 0.38, 0.068, 6],
    yanB: [[-0.14, 0.13], [0, 0.152], [0.16, 0.198], [0.34, 0.222], [0.47, 0.212]],
    yanS: [[0.47, -0.218], [0.34, -0.228], [0.17, -0.208], [0, -0.162], [-0.14, -0.135]],
  },
};
// kol.js 'cene' noktası (aynalı): boğumların ortası, yanağa değen yer (bilek bu noktadan geriye bulunur)
const YUM_YANAK = [0.62, 0.02];
const karis = (a, b, m) => (Array.isArray(a) ? a.map((x, i) => karis(x, b[i], m)) : a + (b - a) * m);
const yumus = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
// Kırık çizgiyi yay uzunluğuna göre n noktaya eşit böler (uçlar dahil): biçim değişse de nokta sayısı ve sırası aynı kalır
// (titreşim nokta sırasına bağlı: kare kare kaymasın)
function esitBol(pts, n) {
  const top = [0];
  for (let i = 1; i < pts.length; i++) top.push(top[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = top[top.length - 1], out = [];
  let j = 1;
  for (let s = 0; s < n; s++) {
    const d = (L * s) / (n - 1);
    while (j < pts.length - 1 && top[j] < d) j++;
    const a = pts[j - 1], b = pts[j], u = top[j] > top[j - 1] ? Math.min(1, (d - top[j - 1]) / (top[j] - top[j - 1])) : 0;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
// Kırık çizginin baştan f oranı kadarı
function yolKes(pts, f) {
  const l = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let kalan = Math.max(0, f) * l.reduce((a, b) => a + b, 0);
  const out = [pts[0]];
  for (let i = 0; i < l.length; i++) {
    if (kalan >= l[i]) { out.push(pts[i + 1]); kalan -= l[i]; continue; }
    const u = l[i] ? kalan / l[i] : 0;
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]);
    break;
  }
  return out;
}
// Başparmak kapsülü (kol.js parmak ile aynı kurgu): kökten ortaya, ortadan büküm kadar dönerek uca; kökten uca %16 incelir.
// L dış yan (+v), R avuç yanı; uc: uçtaki yarım daire (iç noktalar), kok: kökteki yarım daire (R0 → L0, uçlar dahil)
function kapsulNok(b, a, l, r, k, geri = 0.06) {
  const t = yon(a), t2 = yon(a + k);
  const b0 = topla(b, t, -geri), m = topla(b, t, l * 0.5), u = topla(m, t2, l * 0.5 - r * 0.6);
  const C = esitBol([b0, m, u], 6), R = C.map((_, i) => r * (1 - (0.16 * i) / 5));
  const N = C.map((_, i) => { const p = C[Math.max(0, i - 1)], q = C[Math.min(5, i + 1)], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [-(q[1] - p[1]) / d, (q[0] - p[0]) / d]; });
  const yarim = (c, tt, nn, rr, acilar) => acilar.map((d) => { const cs = Math.cos(d * D2R), sn = Math.sin(d * D2R); return [c[0] + rr * (cs * tt[0] + sn * nn[0]), c[1] + rr * (cs * tt[1] + sn * nn[1])]; });
  const tU = dikV(N[5]).map((x) => -x), t0 = dikV(N[0]).map((x) => -x); // uçta ve kökte ileri yön (N'den −90°)
  return {
    L: C.map((p, i) => topla(p, N[i], R[i])), R: C.map((p, i) => topla(p, N[i], -R[i])),
    uc: yarim(C[5], tU, N[5], R[5], [60, 30, 0, -30, -60]),
    kok: yarim(C[0], t0.map((x) => -x), N[0], R[0], [-90, -60, -30, 0, 30, 60, 90]),
  };
}
// Yumruk elinin c anındaki biçimi: dış hat (sabit nokta sayısı: avuç yanları + parmak başına 13 eşit aralıklı nokta),
// parmak arası oluklar (çizgiler buradan iner) ve başparmak ölçüleri
function yumrukHatti(c) {
  const T = Object.fromEntries(Object.keys(YUM.acik).map((a) => [a, karis(YUM.acik[a], YUM.yumruk[a], c)]));
  const F = T.parmak.map(([b, a, l, r]) => {
    const t = yon(a), n = dikV(t), m = topla(b, t, l * 0.5), u = topla(m, t, Math.max(0, l * 0.5 - r)), ru = r * 0.86;
    const yay = [];
    for (let d = 90; d >= -90; d -= 15) { const cs = Math.cos(d * D2R) * T.bas, sn = Math.sin(d * D2R); yay.push([u[0] + ru * (cs * t[0] + sn * n[0]), u[1] + ru * (cs * t[1] + sn * n[1])]); }
    return { b, t, n, r, arti: topla(m, n, r * 0.93), eksi: topla(m, n, -r * 0.93), yay };
  });
  const oluk = F.slice(0, -1).map((f, i) => {
    const g = F[i + 1], a = topla(f.b, f.n, -f.r), b = topla(g.b, g.n, g.r), tm = [(f.t[0] + g.t[0]) / 2, (f.t[1] + g.t[1]) / 2];
    return { p: topla([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], tm, T.oluk), t: tm };
  });
  const hat = [...T.yanB];
  F.forEach((f, i) => {
    const bas = i === 0 ? topla(f.b, f.n, f.r) : oluk[i - 1].p, son = i === F.length - 1 ? topla(f.b, f.n, -f.r) : oluk[i].p;
    const p = esitBol([bas, f.arti, ...f.yay, f.eksi, son], 13);
    hat.push(...(i === 0 ? p : p.slice(1)));
  });
  hat.push(...T.yanS);
  return { hat, oluk, bp: T.bp };
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, oval, W, H, DIKEY, PALET, MONO, BOY, GOZ_Y, BALON, yer, adim, metin } = ctx;
  const M = PALET.murekkep;
  const [BAS, SON] = ARALIK;
  // Zaman çapaları (iç kare). Kullanıcı 2026-10-23: "bütün video çok hızlı, her sahnenin biraz demlenmesi lazım". Her önemli
  // andan sonra kısa nefes (0,4–0,8 sn); üst üste binen hareketler ayrık; konuşma balonları ve el yazısı en az 2 sn ekranda;
  // sonda A'nın şaşkın yüzü kısa tutulur, sonra atölyeye kesme.
  const Z = {
    kalk1: 264,  // 1. kaldırış (18 k), el yukarıda söz
    soz1: 282,   // "Bakar mısınız?" (balon 120 k ekranda)
    gormez: 324, // garson müşterinin şakasına güler: görülmedi; A'nın yüzü düşer, ~30 k nefes
    kalk2: 376,  // 2. kaldırış: yarı doğrulur, el daha yükseğe (20 k)
    soz2: 396,   // "Bakar mısınız?!" (balon 122 k ekranda); el iki kez sallanır (yarım salınım 10 k)
    sustu: 436,  // sallama biter, el havada asılı: karşılıksız (~26 k nefes)
    inis: 462,   // el iner (22 k), A oturur
    asil: 490,   // yüz asılır: kaşlar iner, omuzlar düşer (28 k), kamera yaklaşır; ~26 k nefes
    yanak: 544,  // el yanağa gider (30 k), baş ele çöker (20 k), yanak ezilir (k588 oturur)
    // K1 (kullanıcı 2026-10-25: peçetedeki karakter)
    cek: 590,    // iç çekiş: omuz kalkar (12 k), iner (16 k), yerine oturur; gözler kaleme iner
    uzan: 616,   // boştaki el kaleme uzanır (14 k), kavrar, kaldırıp ilk konturun başına götürür (10 k)
    ara0: 630,   // kesme: kuş bakışı ara çekim (el kalemi kavradığı an); el kalemle sağ alttan girer (10 k)
    ciz: 640,    // kalem peçeteye değer: ucu yaratığın konturlarını sırayla izler (60 k), çizgi uçtan büyür
    bitti: 700,  // çizim biter: kalem kalkar, el kadrajdan çıkar (10 k); karalama tek başına okunur (10 k)
    ara1: 720,   // kesme: orta plana dönüş (kalem masada, el dinlenmeye döner); ~24 k nefes, yarım gülümseme
    dusun: 728,  // düşünce balonu açılır (24 k): masa köşesi, peçete, aynı karalama; ~12 k nefes
    kalk: 764,   // çizim peçeteden kalkar, döner, kalınlaşır, renklenir (32 k)
    kon: 796,    // masaya konar, gölgesi düşer ('vurgu'); el yazısı k780–804 yazılır, balonla söner (≥ 2 sn ekranda)
    yazi: 780,
    devir: 776,  // garson sohbeti bitirir, tepsiyi öbür eline alır (16 k; kafe solukken, başı balonun ardında)
    garson: 812, // garson A'nın masasına yürür (40 k), elinde tepsi; kafe geri gelir
    al: 858,     // eğilir, tabağa uzanır (14 k), kavrar, tepsiye koyar (14 k, 'tik'), peçeteye uzanır (10 k)
    burus: 896,  // peçeteyi buruşturur (6 k, 'tik'), kaldırır (12 k): balon söner, A şaşkın
    don: 924,    // garson doğrulmuş, yüzü görünür (A'ya bakmaz); döner (6 k), gider; A'nın ağzı açık kalır, k951 kesme
  };
  ctx.vurus(3, 'Kafe: A tek başına', BAS, Z.kalk1 - 1);
  ctx.vurus(4, 'Bakar mısınız?', Z.kalk1, Z.asil - 1);
  ctx.vurus(5, 'Yüz asılır, peçeteye yaratık; garson götürür', Z.asil, SON);

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
  const poz = (n, f) => tl.call(f, null, k(n)); // ayrık çizim değişimi (ifade, bakış) o karede
  // Akan izler (hepsi kareden saf işlev: ileri/geri sarmada ve kare kare çekimde aynı sonuç)
  const egri = (e) => (typeof e === 'function' ? e : gsap.parseEase(e || 'sine.inOut'));
  // Sayı izi: [[kare, değer, eğri?], ...]; değere o karede varılır, önceki anahtardan eğriyle geçilir
  const izSayi = (...kf) => (f) => {
    if (f <= kf[0][0]) return kf[0][1];
    for (let i = 1; i < kf.length; i++) if (f < kf[i][0]) { const [k0, v0] = kf[i - 1], [k1, v1, e] = kf[i]; return v0 + (v1 - v0) * egri(e)((f - k0) / (k1 - k0)); }
    return kf[kf.length - 1][1];
  };
  // Poz izi: [[kare, ad, eğri?], ...] → [önceki ad, sonraki ad, t (eğrili)]
  const izAra = (iz, f) => {
    if (f <= iz[0][0]) return [iz[0][1], iz[0][1], 0];
    for (let i = 1; i < iz.length; i++) if (f < iz[i][0]) { const [k0, a] = iz[i - 1], [k1, b, e] = iz[i]; return [a, b, a === b ? 0 : egri(e)((f - k0) / (k1 - k0))]; }
    const s = iz[iz.length - 1][1];
    return [s, s, 0];
  };
  // Tek sekme (baş sallama, gülümseme): y dy'ye çıkar ve iner, d karede (sine)
  const zipla = (g, n, dy = -2, d = 8) => {
    tl.to(g, { y: dy, duration: k(d / 2), ease: 'sine.out' }, k(n));
    tl.to(g, { y: 0, duration: k(d / 2), ease: 'sine.in' }, k(n + d / 2));
  };
  // Sürekli salınım (konuşurken, gülerken): n'den başlayıp adet kez 0 → dy → 0, her biri d k (kahkaha 10, sohbet 16)
  const salin = (g, n, adet, dy = -2, d = 10) => {
    if (adet > 0) tl.fromTo(g, { y: 0 }, { y: dy, duration: k(d / 2), ease: 'sine.inOut', yoyo: true, repeat: adet * 2 - 1, immediateRender: false }, k(n));
  };
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
  // m verilirse el biçimi açık el ↔ yanak eli karışımıdır (elKaris; poz yok sayılır)
  function elOrganik({ poz: ad = 'acik', m = null, bilek, aci, boy = 104, bs = 1, en = 1, yay = 1, yuz = 'avuc', ten, kaynama = 0, tohum = 1, w = 4.2 }) {
    if (m != null) ad = m < 0.5 ? 'acik' : 'yanak';
    const { hat, F } = elHatti(m != null ? elKaris(yay, m) : EL_POZ[ad](yay));
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

  // Yumruk eli çizimi (dizge; biçim yumrukHatti'nde). c: kapanma (0 masadaki gevşek el, kol.js 'dayanma' ile aynı yan;
  // 1 yanakta gevşek yumruk, kol.js 'cene' başparmak −1 ile aynı çizim); ku: u'da kısalma (masada yatan el önden kısalır, kol.js
  // kisalma). Çizim sırası kol.js 'cene' ile aynı: el gövdesi (tek dış hat), parmak çizgileri ve kıvrım çizgisi (el kapandıkça
  // uzar), önde başparmak (kökü açık el halinde avuca açık; yumruk kapandıkça kök kavsi de çizilir). Bütün çağrılar her karede
  // aynı sırada (titreşim nokta sırasına bağlı: kaymasın).
  function elYumruk({ bilek, aci, boy = 100, ku = 1, c = 1, ten, kaynama = 0, tohum = 1, w = 4.2 }) {
    const cs = Math.cos(aci * D2R), sn = Math.sin(aci * D2R);
    const D = ([u, v]) => { const X = u * boy * ku, V = v * boy; return [bilek[0] + X * cs - V * sn, bilek[1] + X * sn + V * cs]; };
    const ar = araclar(tohum, kaynama, 0.55), ac = araclar(tohum + 3, kaynama, 0.4);
    const { hat, oluk, bp } = yumrukHatti(c);
    let out = ar.sk(hat.map(D), ten, w * 0.9, [2, 2]);
    // parmak çizgileri: oluğun hemen altından avuca doğru (kol.js yumrukGovde ic); kıvrım çizgisi ortadan iki yana uzar
    const g1 = yumus(0.4, 0.9, c), g2 = yumus(0.5, 0.95, c);
    for (const o of oluk) {
      const n = dikV(o.t), a = topla(o.p, o.t, -0.012);
      out += ac.cz([a, topla(topla(a, o.t, -0.04 * g1), n, 0.003 * g1), topla(topla(a, o.t, -0.075 * g1), n, 0.006 * g1)].map(D), w * 0.6 * Math.min(1, g1 * 3));
    }
    const KV = [[0.47, 0.19], [0.44, 0], [0.47, -0.19]], ara2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    out += ac.cz([ara2(KV[1], KV[0], g2), KV[1], ara2(KV[1], KV[2], g2)].map(D), w * 0.55 * Math.min(1, g2 * 3));
    // Başparmak: dolgu kapalı, kontur dış yandan uca, uçtan avuç yanına; kök kavsi iki uçtan ortaya doğru kapanır
    const K = kapsulNok(...bp), g3 = yumus(0.5, 1, c);
    out += `<path d="${yolCiz([...K.L, ...K.uc, ...K.R.slice().reverse(), ...K.kok].map(D), true, { sap: () => 0 })}" fill="${ten}" transform="translate(2 2)"/>`;
    const kA = esitBol(yolKes(K.kok.slice(0, 4), g3), 3), kB = esitBol(yolKes(K.kok.slice(3).reverse(), g3), 3);
    out += ar.cz([...kB.slice().reverse(), ...K.L.slice(1), ...K.uc, ...K.R.slice().reverse(), ...kA.slice(1)].map(D), w * 0.9);
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
  // ic (K1 balon içi): s ölçek çarpanı (br.x, br.y), o masa kökeni (balon merkezinden, br oranı), mx0 masanın açık sol ucu,
  // pn peçetenin X'i, xl/zl yaratığın konduğu yer, kk son boyu, yaw son sapması (derece), yuk uçuş yüksekliği, yazı yeri.
  const P = yer({
    lamba: { x: 640, ip: 196 },
    duvar: 0.2, cam: [[26, 716], [1318, 1900]], camUst: 70, menu: [892, 150, 1166, 318],
    tezgah: { x0: 846, x1: 1254, o: 0.21, makine: [884, 1062] }, barista: { x: 1150, o: 0.2 }, bitki: { x: 778, o: 0.205 },
    lambalar: [[442, 0.26, 300], [1452, 0.245, 290], [1590, 0.44, 236]],
    garson: { x: 1330, o: 0.46 },
    A: { x: 640, o: 0.92, masa: 862 }, masa: { yari: 290, derin: 48, etek: 66 },
    konus1: { x: 812, y: 436, boyut: 50 }, konus2: { x: 800, y: 414, boyut: 62 },
    balon: { c: [1180, 318], r: [440, 205] }, ic: { yazi: 44, yx: -0.68, yy: -0.84, s: [0.62, 1.32], o: [0.02, 0.3], mx0: -1.3, pn: -0.62, xl: 0.45, zl: -0.1, kk: 0.95, yaw: -22, yuk: 0.32 },
  }, {
    lamba: { x: 440, ip: 150 },
    duvar: 0.19, cam: [[24, 330], [750, 1056]], camUst: 240, menu: [380, 500, 700, 700],
    tezgah: { x0: 320, x1: 740, o: 0.2, makine: [350, 524] }, barista: { x: 646, o: 0.19 }, bitki: { x: 262, o: 0.2 },
    lambalar: [[165, 0.23, 640], [935, 0.23, 640]],
    garson: { x: 840, o: 0.4 },
    A: { x: 440, o: 1.0, masa: 1640 }, masa: { yari: 300, derin: 54, etek: 76 },
    konus1: { x: 58, y: 1086, boyut: 50 }, konus2: { x: 48, y: 1056, boyut: 58 },
    balon: { c: [540, 760], r: [370, 260] }, ic: { yazi: 48, yx: -0.66, yy: -0.68, s: [0.62, 1.05], o: [0.0, 0.36], mx0: -1.25, pn: -0.56, xl: 0.42, zl: -0.08, kk: 0.95, yaw: -22, yuk: 0.3 },
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
  // agirlik: −1/1 ağırlık o bacakta (öbür diz hafif kırık, ayak içe), 0 ikisi eşit; ara değerler ağırlığı akarak aktarır
  function bacaklar(ar, agirlik = 0) {
    const cx = 200;
    let s = '';
    const gev = (yn) => Math.max(0, -agirlik * yn); // bu bacağın gevşeklik payı (0..1)
    for (const yn of [-1, 1]) {
      const d = -14 * gev(yn), ic = -8 * yn * gev(yn);
      s += ar.sk(kenarla([[cx + yn * 6, BEL - 30], [cx + yn * 86, BEL - 30], [cx + yn * 70 + ic, BILEK + d], [cx + yn * 20 + ic, BILEK + 4 + d]], 40), PANTOLON);
    }
    for (const yn of [-1, 1]) {
      const d = -14 * gev(yn), ic = -8 * yn * gev(yn);
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
  // İki jest arasında ara poz: dirsek omuz, ön kol dirsek çevresinde yay çizer, el açısı en kısa yoldan döner; başparmak yanı
  // (bs) sıfırdan geçerken el kenarından görünür (avuç ↔ sırt bilek dönüşü)
  function jestAra(a, b, t) {
    const p = GJ[a] || GJ.sark, q = GJ[b] || GJ.sark;
    if (a === b || t <= 0) return p;
    if (t >= 1) return q;
    let bs = ara(p.bs, q.bs, t);
    if (Math.abs(bs) < 0.15) bs = bs < 0 ? -0.15 : 0.15;
    const K = kolAra([0, 0], p.d, p.b, q.d, q.b, t);
    return { d: K.dirsek, b: K.bilek, a: p.a + aciFark(p.a, q.a) * t, bs, yuz: t < 0.5 ? p.yuz : q.yuz, yay: ara(p.yay, q.yay, t) };
  }
  function garsonKollar(i, q) {
    const o1 = gOmuz.sol, o2 = gOmuz.sag;
    const ortak = { giysi: GIYSI, ten: GTEN, kalinlik: gKalin, kaynama: i, manset: 'gomlek', govdeX: 200 };
    const bilek = [o1[0] - 94, o1[1] - 124];
    const kol1 = kolSVG({ ...ortak, omuz: o1, dirsek: [o1[0] - 92, o1[1] + 32], bilek, el: 'dayanma', elAci: 192, kisalma: 0.5, elBoy: 100, taraf: 'sol', tohum: 61 });
    const b2 = [o2[0] + q.b[0], o2[1] + q.b[1]];
    const kol2 = elOrganik({ bilek: b2, aci: q.a, boy: 98, bs: q.bs, yay: q.yay, yuz: q.yuz, ten: GTEN, kaynama: i, tohum: 52 }) +
      kolSVG({ ...ortak, omuz: o2, dirsek: [o2[0] + q.d[0], o2[1] + q.d[1]], bilek: b2, el: 'acik', elBoy: 0.01, taraf: 'sag', tohum: 52 });
    return { kol1, kol2, tepsi: tepsi(araclar(633, i), [bilek[0] - 14, bilek[1] - 10]) };
  }
  const GO = P.garson.o, gAyak = [P.garson.x, Y(GO, 0)], gUst = gAyak[1] - TABAN * GO;
  const g0 = el(garsonUst, 'g');
  cizgi(g0, oval(gAyak[0], gAyak[1] + 2, 64 * GO / 0.54, 9 * GO / 0.54, 0, 360, 14, 2), { kapali: true, dolgu: M, kalinlik: 0.1, tohum: T(), kay: [0, 0] }).g.setAttribute('opacity', 0.08);
  const gSar = el(g0, 'g'); // başını sallama, kahkaha sekmesi
  const gSvg = el(gSar, 'svg', svgKutu(gAyak[0], gUst, GO));
  // G.J: o karenin (ara) jest pozu; G.agirlik: −1..1 akan ağırlık. Her karede garsonIz(f) kurar.
  const G = { ifade: 'mutlu', bakis: [1, 1], J: GJ.anlat, agirlik: 1 };
  let gAnah = '';
  // Gövde (bele dek kırpılı) → bacaklar → önlük → tepsi kolu → tepsi → jest kolu (göğse geldiğinde en üstte)
  function garsonCiz(i = kaynaSon) {
    const J = G.J, anah = `${i}|${G.ifade}|${G.bakis}|${J.d.map(f2).join()}|${J.b.map(f2).join()}|${f2(J.a)}|${f2(J.bs)}|${J.yuz}|${f2(J.yay)}|${f2(G.agirlik)}`;
    if (anah === gAnah) return;
    gAnah = anah;
    const ar = araclar(623, i);
    const kol = garsonKollar(i, J);
    const Gk = govdeKes(Gp, { id: 's1-garson', kaynama: i, gogus: 92, tohum: Gp.tohum });
    const kisi = kisiSVG(Gp, { kaynama: i, ifade: G.ifade, bakis: G.bakis, mono: true });
    gSvg.innerHTML = `<defs><clipPath id="s1-garson-bel" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + BEL}"/></clipPath></defs>` +
      `<g clip-path="url(#s1-garson-bel)">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}</g>` + bacaklar(ar, G.agirlik) + onluk(ar) + kol.kol1 + kol.tepsi + kol.kol2;
  }
  garsonCiz(0);
  ctx.kaynayanlar.add((i) => garsonCiz(i));
  const gGoz = [gAyak[0], gUst + GOZ_Y * GO];
  const gBalon = minikBalon(g0, [gGoz[0], gGoz[1] - 10 * GO], 1, GO * 0.9, 761, 62 * GO);
  // Kahkaha çizgileri: başın sağ üstünde üç kısa çizgi; iki konum arasında sekmeyle aynı ritimde AKARAK salınır
  // (ilk takım her karede yeniden kurulur; ikinci takım yalnız tohum sırası değişmesin diye kurulur, gizli kalır)
  const gulCx = gGoz[0] + 92 * GO, gulCy = gGoz[1] - 70 * GO;
  const gulNok = (a, u) => { const t = yon(a + u * 8); return [topla([gulCx, gulCy], t, (26 + u * 6) * GO), topla([gulCx, gulCy], t, (54 + u * 8) * GO)]; };
  const gulme = [0, 1].map((j) => {
    const g = el(g0, 'g'), hs = [];
    for (const a of [-50, -15, 20]) hs.push(cizgi(g, gulNok(a, j), { kalinlik: Math.max(1.6, 4 * GO), tohum: T(), genlik: 0.5 }));
    gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS));
    return { g, hs };
  });
  const gulmeKur = (u) => [-50, -15, 20].forEach((a, i) => { const h = gulme[0].hs[i]; h.pts = gulNok(a, u); h.ciz(); });

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
  // A'nın masası (K1): ortada peçete (A'nın önünde, iki elinin arası; sol dinlenen elin parmakları kenarına değer), peçetenin
  // önünde yatan kalem, sağda yanak dirseğinin ötesinde boş fincan tabağı + kaşık (çay yok). Yerleşim A'nın kutu biriminde
  // (iki yönde aynı), çizim dünyada. Tabak ve peçete her karede kurulur: garson ikisini de alıp götürür.
  const dB = P.masa.derin / Ao; // masa üstünün derinliği (kutu birimi)
  const PEC = { y0: MB + 0.05 * dB, y1: MB + 0.95 * dB, arka: [214, 318], on: [205, 323] };
  const pecC = [264, (PEC.y0 + PEC.y1) / 2];
  // Peçete dış hattı: sabit sayıda nokta (buruşurken top biçimine akar; titreşim nokta sırasına bağlı)
  const PEC_HAT = esitBol([[PEC.arka[0], PEC.y0], [PEC.arka[1], PEC.y0 + 1], [PEC.on[1], PEC.y1], [PEC.on[0], PEC.y1 - 1], [PEC.arka[0], PEC.y0]], 25).slice(0, 24).map(dunya);
  // Karalama: yaratığın birim kutusu peçeteye yatık (perspektifle basık; izleyiciye dönük okunur), ön kenar biraz geniş
  const DW = 84, DH = (PEC.y1 - PEC.y0) * 0.86;
  // A kendine dönük çizer (ara çekim ve balonla aynı yön): karşıdan bakan izleyiciye baş aşağı görünür; ön kenar biraz geniş
  const pecD = ([u, v]) => [pecC[0] - u * DW * (1 - 0.06 * v), pecC[1] - v * DH];
  // Kalemin izleyeceği yollar (kutu birimi): her kontur cizimKur'un köşe noktalarıyla (duz), kapalıysa başa döner
  // Çizim sırası: baş, boynuzlar, gözler, bebekler, ağız, gövde, kuyruk. Sağ el çizginin sağ altında kalır: önce üstteki
  // konturlar çizilir, el sonradan çizilenlerin üstünü kapatmaz
  const KAR_SIRA = [2, 3, 4, 5, 6, 7, 8, 9, 0, 1];
  const karYol = (map) => KAR_SIRA.map((j) => { const kn = CIZIMLER.yaratik[j]; const p = (kn.yumusak ? kn.p : duz(kn.p, !!kn.kapali)).map(map); return kn.kapali ? [...p, p[0]] : p; });
  const KAR_YOL = karYol(pecD);
  // Ara çekim (kuş bakışı) yerleşimi, ekran koordinatı (kamera bu çekimde birim): peçete merkezi ve kenarı, el boyu oranı
  const INS = yer({ c: [W / 2 - 30, H / 2 + 6], s: 760 }, { c: [W / 2, H / 2 - 60], s: 900 });
  INS.aci = -4 * D2R; INS.D = INS.s * 0.6; INS.dc = [INS.c[0] - 0.04 * INS.s, INS.c[1] - 0.05 * INS.s]; INS.el = INS.s * 0.5;
  const insD = ([u, v]) => { const x = u * INS.D, y = v * INS.D, c = Math.cos(INS.aci), s = Math.sin(INS.aci); return [INS.dc[0] + x * c - y * s, INS.dc[1] + x * s + y * c]; };
  const INS_YOL = karYol(insD);
  const pecG = el(masaA, 'g');
  const pecete = cizgi(pecG, PEC_HAT, { kapali: true, dolgu: BALON, kalinlik: 3.2, tohum: 1501, genlik: 0.5, kay: [2, 2] });
  const pecKat = cizgi(pecG, [dunya([pecC[0] - 4, PEC.y0 + 3]), dunya([pecC[0] - 2, PEC.y1 - 3])], { kalinlik: 1.8, tohum: 1502, genlik: 0.3, renk: MONO.giysi[2] });
  const murekkep = KAR_YOL.map((_, i) => cizgi(pecG, [], { kalinlik: 2.4 * Ao, tohum: 1510 + i, genlik: 0.3 }));
  // Tabak (dünya): yanak dirseğinin sağında, masanın sağ ucunda (garsonun eli yetişsin)
  const TABAK = dunya([452, MB + 0.5 * dB]);
  const tabakG = el(masaA, 'g');
  {
    const [fx, fy] = TABAK;
    cizgi(tabakG, oval(fx, fy, 50, 12, 0, 360, 18, 2.2), { kapali: true, dolgu: BALON, kalinlik: 3.6, tohum: T() });
    cizgi(tabakG, oval(fx, fy - 1, 21, 5, 0, 360, 12, 2.2), { kapali: true, kalinlik: 2.6, tohum: T(), genlik: 0.5 });
    cizgi(tabakG, [[fx + 22, fy - 3], [fx + 38, fy + 1], [fx + 54, fy + 4]], { kalinlik: 3.4, tohum: T(), genlik: 0.5 });
    cizgi(tabakG, oval(fx + 16, fy - 4, 9, 5, 0, 360, 8), { kapali: true, dolgu: MONO.giysi[3], kalinlik: 2.6, tohum: T(), genlik: 0.4 });
  }
  // Kalem (kol.js nesneCiz'in renk ve biçimi; tutma noktası uca yakın, arka ucu yumruğun üstünden taşar: yazan el gibi).
  // KL: el açısı, kalem açısı (yazarken; uç aşağıda), el boyu, kısalma, başparmak yanı. Kalemin ucu tutma noktasından
  // KL_UC·eb ötede: bilek, uçtan geriye kol.js bilekBul ile bulunur.
  const KL = { ea: -8, na: 64, eb: 84, kis: 0.92, bs: 1 };
  const KL_GERI = 0.6, KL_ON = 0.2, KL_SIVRI = 0.12, KL_UC = (KL_ON + KL_SIVRI) * 1.12;
  const kalemNok = (tut, na, eb) => {
    const t = yon(na), n = dikV(t), boy = eb * 1.12, r = boy * 0.042;
    const a = topla(tut, t, -boy * KL_GERI), b = topla(tut, t, boy * KL_ON);
    return { govde: [topla(a, n, r), topla(b, n, r), topla(b, n, -r), topla(a, n, -r)], uc: [topla(b, n, r * 0.9), topla(b, t, boy * KL_SIVRI), topla(b, n, -r * 0.9)] };
  };
  function kalemSVG(tut, na, eb, i) {
    const K = kalemNok(tut, na, eb), ar = araclar(77, i, 0.35);
    return ar.sk(duz(K.govde, true), MONO.giysi[5], 3, [1.5, 1.5]) + ar.sk(duz(K.uc, true), MONO.giysi[1], 2.6, [1, 1]);
  }
  // Masada yatan kalem: peçetenin önünde, ucu sağda (kavrama anındaki el kalemiyle aynı yer ve açı)
  const KL_YAT = { uc: [306, MB + 0.99 * dB], na: 2 };
  const kalemTut = (uc, na) => topla(uc, yon(na), -KL_UC * KL.eb);
  const kalemMasaG = el(masaA, 'g');
  {
    const K = kalemNok(kalemTut(KL_YAT.uc, KL_YAT.na), KL_YAT.na, KL.eb);
    cizgi(kalemMasaG, duz(K.govde.map(dunya), true), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 3 * Ao, tohum: 1530, genlik: 0.4, kay: [1.5, 1.5] });
    cizgi(kalemMasaG, duz(K.uc.map(dunya), true), { kapali: true, dolgu: MONO.giysi[1], kalinlik: 2.6 * Ao, tohum: 1531, genlik: 0.3, kay: [1, 1] });
  }
  const aKolG = el(L.svg, 'g');
  const aKol = el(aKolG, 'svg', aVb);
  // Garson (K1) ön katmanı: A'nın kollarının ve masasının üstünde, balonun altında (yürüyüş, tabak, peçete); Z.devir'de açılır
  const gOnG = el(L.svg, 'g');

  // A'nın duruşu: cok (çöküş, birim; − doğrulma), egim (gövdenin yana yaslanması, derece; kalça çevresinde). Gövde
  // svg'de döner/iner; kollar dünyada kalır (masadaki dirsek ve el yerinde), omuzlar ve yüz noktaları aynı dönüşümle bulunur.
  const PIV = [200, MB + 20];
  const A = { kol: null, ifade: 'merak', bakis: [0, 0], cok: 0, egim: 0, ezik: 0, kalem: null };
  const donustur = (q, cok = A.cok, egim = A.egim) => {
    const c = Math.cos(egim * D2R), s = Math.sin(egim * D2R), dx = q[0] - PIV[0], dy = q[1] - PIV[1];
    return [PIV[0] + dx * c - dy * s, PIV[1] + dx * s + dy * c + cok];
  };
  const AKAL = 68; // kol kalınlığı (kapüşonlu: 64'ten biraz dolgun, kalkan kol çubuk gibi durmasın)
  const oA = omuzlar(Ap, { kalinlik: AKAL });
  const hwA = Ap.yuzEn;
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
    // Yanağa yaslanma (ekranın sağındaki kol; s3-balkon KOLB.yanak gibi): gevşek yumruğun boğumları yanağa dayanır
    // (YANAK: yüzün sağ kenarında, ağız hizasının biraz üstü), başparmak içte çene yanında. Dirsek masada, omzun biraz
    // dışında; ön kol dirsekten yukarı kalkar. El yüzle birlikte döner (bilek gövde dönüşümüyle bulunur): iç çekişte baş ve
    // yumruk birlikte oynar.
    const bilekY = yumrukBilek(donustur(YANAK), YUM_ACI + A.egim, YUM_BOY);
    if (ad0 === 'yanak') return { dirsek: [oA.sag[0] + 22, MB + 10], bilek: bilekY, yum: { c: 1, aci: YUM_ACI + A.egim, ku: 1, boy: YUM_BOY } };
    if (ad0 === 'yanak1') {
      // yolun ortası: ön kol yarı kalkmış, el yarı kapalı, başparmak parmakların önünden geçiyor
      const b = [(DIN.sag.bilek[0] + bilekY[0]) / 2 + 26, (DIN.sag.bilek[1] + bilekY[1]) / 2 - 4], d = [oA.sag[0] + 22, MB + 8];
      return { dirsek: d, bilek: b, yum: { c: 0.5, aci: Math.atan2(b[1] - d[1], b[0] - d[0]) / D2R + 6, ku: 0.86, boy: (DIN_EB + YUM_BOY) / 2 } };
    }
    return DIN[taraf];
  }
  // Yumruk yanakta: el boyu (A'nın yüzüne oranı s3'teki D ile aynı: 116 / 67 ≈ 100 / 56), yön (dik yukarı, başla birlikte
  // döner); dinlenen elin boyu kol.js'teki gibi ön kol boyundan (×0,72)
  const YUM_BOY = 100, YUM_ACI = -98;
  const DIN_EB = Math.hypot(DIN.sag.bilek[0] - DIN.sag.dirsek[0], DIN.sag.bilek[1] - DIN.sag.dirsek[1]) * 0.72;
  const YANAK = [200 + hwA * 0.8, GOZ_Y + 4 + Ap.yuzBoy * 0.46];
  // Yumruğun 'cene' noktası hedefe değsin diye bilek nerede olmalı (kol.js bilekBul)
  function yumrukBilek(hedef, aci, boy) {
    const X = YUM_YANAK[0] * boy, V = YUM_YANAK[1] * boy, cs = Math.cos(aci * D2R), sn = Math.sin(aci * D2R);
    return [hedef[0] - (X * cs - V * sn), hedef[1] - (X * sn + V * cs)];
  }
  const YAN = new Set(['yanak', 'yanak1']);
  // Adlı poz → sayısal durum. Masada dinlenen kolun organik karşılığı (yalnız ara karelerde çizilir): aynı yön, kısalmış avuç.
  // yan: geçiş yanak pozuna (ya da ondan) ise el yumruk elidir; masada kol.js 'dayanma' ölçüleriyle gevşek (c 0) başlar
  function kolDurum(taraf, ad0, yan = false) {
    if (ad0 === 'dinlen') {
      const d = DIN[taraf];
      if (yan) return { dirsek: d.dirsek, bilek: d.bilek, org: { tur: 'yum', c: 0, aci: d.elAci, ku: d.kisalma, boy: DIN_EB } };
      return { dirsek: d.dirsek, bilek: d.bilek, org: { m: 0, aci: d.elAci, bs: taraf === 'sol' ? 1 : -1, boy: 100, en: 0.72, yay: 0.25, yuz: 'sirt' } };
    }
    const q = kolPoz(taraf, ad0), o = q.org;
    if (q.yum) return { dirsek: q.dirsek, bilek: q.bilek, org: { tur: 'yum', ...q.yum } };
    return { dirsek: q.dirsek, bilek: q.bilek, org: { m: o.poz === 'yanak' ? 1 : 0, aci: o.aci, bs: o.bs, boy: o.boy, en: o.en ?? 1, yay: o.yay ?? 1, yuz: o.yuz } };
  }
  const orgAra = (p, q, t) => (p.tur === 'yum'
    ? { tur: 'yum', c: ara(p.c, q.c, t), aci: p.aci + aciFark(p.aci, q.aci) * t, ku: ara(p.ku, q.ku, t), boy: ara(p.boy, q.boy, t) }
    : { m: ara(p.m, q.m, t), aci: p.aci + aciFark(p.aci, q.aci) * t, bs: ara(p.bs, q.bs, t), boy: ara(p.boy, q.boy, t), en: ara(p.en, q.en, t), yay: ara(p.yay, q.yay, t), yuz: t < 0.5 ? p.yuz : q.yuz });
  // A.kol[taraf] = [önceki poz, sonraki poz, t]: kol omuz çevresinde (gövdeyle birlikte) iki poz arasında yay çizer.
  // Masada dinlenen kol kol.js 'dayanma' eliyle çizilir; el masadan kalktığı ilk karede organik ele geçer.
  let aAnah = '';
  function aCiz(i = kaynaSon) {
    const kl = A.kalem ? [A.kalem.el, ...A.kalem.dirsek, ...A.kalem.bilek, A.kalem.ea, A.kalem.na ?? '', ...(A.kalem.tut || [])].map((v) => (typeof v === 'number' ? f2(v) : v)).join() : '';
    const anah = `${i}|${A.kolVar}|${A.kol.sol.join()}|${A.kol.sag.join()}|${A.ifade}|${A.bakis}|${f2(A.cok)}|${f2(A.egim)}|${f2(A.ezik)}|${kl}`;
    if (anah === aAnah) return;
    aAnah = anah;
    const kisi = kisiSVG(Ap, { kaynama: i, ifade: A.ifade, bakis: A.bakis, mono: true });
    const kes = `<defs><clipPath id="s1-a-etek" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + (etekY - 24 - aUst) / Ao}"/></clipPath></defs>`;
    const don = `translate(0 ${A.cok.toFixed(2)}) rotate(${A.egim.toFixed(3)} ${PIV[0]} ${PIV[1]})`;
    if (!A.kolVar) { aGovde.innerHTML = `${kes}<g clip-path="url(#s1-a-etek)"><g transform="${don}">${kisi}</g></g>`; aKol.innerHTML = ''; return; }
    const Gk = govdeKes(Ap, { id: 's1-a', kaynama: i, tohum: Ap.tohum });
    aGovde.innerHTML = `${kes}<g clip-path="url(#s1-a-etek)"><g transform="${don}">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}${yanakEz(i)}</g></g>`;
    const ten = MONO.ten[Ap.ten];
    const ortak = { giysi: MONO.giysi[Ap.giysi], ten, kaynama: i, manset: 'ribana', kalinlik: AKAL };
    let s = '';
    for (const taraf of ['sag', 'sol']) {
      const [a, b, t] = A.kol[taraf], omuz = donustur(oA[taraf]), tohum = taraf === 'sag' ? 22 : 21;
      // K1 kalem eli (ekranın solu): kalemi masadan alır, peçeteye çizer, yerine bırakır (kalemIz)
      if (taraf === 'sol' && A.kalem) {
        const q = A.kalem;
        s += kolSVG({ ...ortak, omuz, dirsek: q.dirsek, bilek: q.bilek, el: q.el, elAci: q.ea, elBoy: q.eb, basparmak: q.bs, kisalma: q.kis, araya: q.tut ? kalemSVG(q.tut, q.na, q.eb, i) : '', taraf, tohum });
        continue;
      }
      if (a === 'dinlen' && (b === 'dinlen' || t <= 0)) { s += kolSVG({ ...ortak, omuz, ...DIN[taraf], taraf, tohum }); continue; }
      const yan = YAN.has(a) || YAN.has(b);
      const P0 = kolDurum(taraf, a, yan), P1 = a === b ? P0 : kolDurum(taraf, b, yan);
      const q = a === b || t <= 0 ? P0 : { ...kolAra(omuz, P0.dirsek, P0.bilek, P1.dirsek, P1.bilek, t), org: orgAra(P0.org, P1.org, t) };
      // el kolun altında: yenin ağzı bileği örter
      if (q.org.tur === 'yum') s += elYumruk({ ...q.org, bilek: q.bilek, ten, kaynama: i, tohum: tohum + 5 });
      else s += elOrganik({ ...q.org, bilek: q.bilek, ten, kaynama: i, tohum: tohum + 5 });
      s += kolSVG({ ...ortak, omuz, dirsek: q.dirsek, bilek: q.bilek, el: 'acik', elBoy: 0.01, taraf, tohum });
    }
    aKol.innerHTML = s;
  }
  // Ezilen yanak (s3-balkon yanakEz gibi; gövde svg'sinde, yumruk kol katmanında üstte): yumruk değince yumruğun üstünde,
  // yanakta yukarı itilmiş kısa kavis belirir, baş yumruğa çöktükçe derinleşir (ölçü A'nın yüzüne oranlı: 56 / 67)
  function yanakEz(i) {
    const e = A.ezik;
    if (e <= 0.02) return '';
    const [tx, ty] = YANAK, ar = araclar(29, i, 0.45);
    return ar.cz([[tx - 33, ty - 4 - e], [tx - 21, ty - 7 - 7 * e], [tx - 7.5, ty - 6 - 7 * e]], 2.4 * Math.min(1, e * 2.5));
  }
  A.kol = { sol: ['dinlen', 'dinlen', 0], sag: ['dinlen', 'dinlen', 0] };
  A.kolVar = false;
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
  tl.fromTo(ctx.kamera, K1, { ...K4, duration: k(Z.asil - 250), ease: 'none', immediateRender: false }, k(250));

  // ---------- Konuşma balonları (sesli söz): kalkan elin öbür yanında, yüzün yanında. Kuyruk ağız hizasında ağzı gösterir
  // ama yüzün ve halka küpenin dışında durur (kuyruk yanağın üstünden geçmesin)
  const KY = -KS;
  const agiz = [P.A.x + KY * (Ap.yuzEn * 1.04 + 36) * Ao, aUst + (GOZ_Y + 4 + Ap.yuzBoy * 0.5) * Ao];
  const kb1 = ctx.konus(L, metin('Bakar mısınız?', 'Excuse me?'), { x: P.konus1.x, y: P.konus1.y, boyut: P.konus1.boyut, kuyruk: agiz, tohum: 731, aci: -2 * KY });
  const kb2 = ctx.konus(L, metin('Bakar mısınız?!', 'Excuse me?!'), { x: P.konus2.x, y: P.konus2.y, boyut: P.konus2.boyut, kuyruk: agiz, tohum: 741, aci: -3 * KY });
  // Caveat'in eğik "?" kıvrımı yazı kutusunun sağından taşar; yazma maskesi onu kesmesin diye kutuya sağ pay
  for (const p of [kb1.p, kb2.p]) p.style.paddingRight = '0.3em';
  // Her söz en az 2 sn okunur: birinci balon ikincisi açılırken söner (aynı yerde, ikincisi onu şişirir)
  kb1.ac(Z.soz1, 16); ctx.isaret(Z.soz1, 'konusma'); kb1.kapat(Z.soz2, 6);
  kb2.ac(Z.soz2, 14); ctx.isaret(Z.soz2, 'konusma'); kb2.kapat(Z.soz2 + 112, 10);

  // ---------- Düşünce balonu (#5, K1) ve içi: masa köşesi (A'nın kendi masası, aynı tonlar), üstünde peçete ve AYNI karalama
  // (cizimler.js yaratik). Çizim peçeteden kalkar, döner, kalınlaşır (ön kontur + kaydırılmış arka kopya + birleştiren
  // kenarlar), açık renkle dolar (fikirler renkli; kişiler ve mekân mono), masaya kendi gölgesiyle konar. Peçete boş kalır.
  const BL = P.balon, bc = BL.c, br = BL.r;
  // A'nın son duruşu (yanak avuçta: çöküş 40, eğim 7): balon noktaları başın sağ üstünden çıkar
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
  bal.ac(Z.dusun);
  ctx.isaret(Z.dusun, 'dusunce');
  // A hayale dalarken kafe kâğıda doğru solar (balon açıldıktan sonra); garson yürümeye başlayınca gerçek geri gelir
  tl.to(arka, { opacity: yer(0.4, 0.3), duration: k(40), ease: 'power1.inOut' }, k(Z.dusun + 20));
  tl.to(menuG, { opacity: yer(0.4, 0.12), duration: k(40), ease: 'power1.inOut' }, k(Z.dusun + 20));
  tl.to([arka, menuG], { opacity: 1, duration: k(32), ease: 'power1.inOut' }, k(Z.garson + 8));
  // Yaratık konunca balon noktaları hafifçe kabarıp iner (tutuş ölü kare olmasın)
  tl.to(bal.noktalar, { y: -3, duration: k(16), ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: k(5), immediateRender: false }, k(Z.kon + 10));
  // Peçete kalkarken balon söner: fikir peçeteyle gider
  bal.kapat(Z.burus + 6, 18);
  const ic = bal.ic;
  // Dik izdüşüm: masa düzlemi Y = 0 (yukarı +), Z izleyiciye doğru +; bakış FI kadar yukarıdan:
  // ekran = O3 + S3·(X, Z·sinFI − Y·cosFI). Birim = yaratığın kutusu × S3 px.
  const IC = P.ic, FI = 38 * D2R, sF = Math.sin(FI), cF = Math.cos(FI);
  const S3 = Math.min(br[0] * IC.s[0], br[1] * IC.s[1]);
  const O3 = [bc[0] + br[0] * IC.o[0], bc[1] + br[1] * IC.o[1]];
  const p3 = ([X, Yd, Zd]) => [O3[0] + S3 * X, O3[1] + S3 * (Zd * sF - Yd * cF)];
  // Masa köşesi: üst yüz + ön kalınlık; sol ucu açık, balonun içinde biter
  {
    const z0 = -0.42, z1 = 0.3, x1 = 1.05, t3 = 0.07, x0 = IC.mx0;
    const u = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0 - 0.05, 0, z1]].map(p3);
    const on = [[x0 - 0.05, 0, z1], [x1, 0, z1], [x1, -t3, z1], [x0 - 0.05, -t3, z1]].map(p3);
    cizgi(ic, kenarla(on, 24, false), { dolgu: MONO.giysi[6], kalinlik: 4, tohum: 1590, kay: [0, 0] });
    cizgi(ic, [...kenarla([u[0], u[1], u[2]], 24, false), ...kenarla([u[2], u[3]], 24, false).slice(1)], { dolgu: MONO.giysi[0], kalinlik: 4.5, tohum: 1591, kay: [0, 0] });
  }
  // Peçete (masada, hafif dönük) ve katlama izi
  const PN = { x: IC.pn, z: -0.03, w: 0.34, d: 0.3, yaw: -7 * D2R };
  const pnYer = (x, z) => [PN.x + x * Math.cos(PN.yaw) - z * Math.sin(PN.yaw), 0, PN.z + x * Math.sin(PN.yaw) + z * Math.cos(PN.yaw)];
  {
    const kose = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => p3(pnYer(a * PN.w, b * PN.d)));
    cizgi(ic, kenarla(kose, 20), { kapali: true, dolgu: BALON, kalinlik: 3.4, tohum: 1592, genlik: 0.7, kay: [2, 2] });
    cizgi(ic, [p3(pnYer(0.02, -PN.d)), p3(pnYer(-0.01, PN.d))], { kalinlik: 2, tohum: 1593, genlik: 0.4, renk: MONO.giysi[2] });
  }
  // Yaratık: kontur başına ön yüz; gövde, kuyruk, baş ve boynuzlar kalınlaşır (köşe kenarı başına yan yüz: koyu tonla dolu,
  // konturu arka kenar ve birleştiren kenarlar). Sıra: her konturun yan yüzleri, sonra ön yüzü (yakın yüz üstte); gözler,
  // bebekler ve ağız yalnız ön yüzde. Gölge: gövde, baş ve boynuzların masaya düşen izdüşümü (grup saydamlığı: üst üste binmez).
  const YAR = CIZIMLER.yaratik, KALIN = new Set([0, 1, 2, 3, 4]);
  const hex = (h) => [1, 3, 5].map((j) => parseInt(h.slice(j, j + 2), 16));
  const renkKaris = (a, b, m) => { const p = hex(a), q = hex(b); return `#${p.map((v, j) => Math.round(v + (q[j] - v) * m).toString(16).padStart(2, '0')).join('')}`; };
  const golge3 = el(ic, 'g', { opacity: 0 });
  const golgeH = [0, 2, 3, 4].map((j) => ({ j, h: cizgi(golge3, [], { kapali: true, dolgu: M, kalinlik: 0.1, tohum: 1620 + j, genlik: 0.5, kay: [0, 0] }) }));
  const yarG = el(ic, 'g');
  const Y3 = YAR.map((kn, i) => {
    const n = kn.p.length, kenarSay = KALIN.has(i) ? (kn.kapali ? n : n - 1) : 0;
    const anaR = URUN_RENK[kn.r || YAR[0].r];
    const yan = Array.from({ length: kenarSay }, (_, j) => cizgi(yarG, [], { kapali: true, dolgu: BALON, kalinlik: 3, tohum: 1700 + i * 16 + j, genlik: 0.6, kay: [0, 0] }));
    const on = cizgi(yarG, [], { kapali: !!kn.kapali, dolgu: kn.kapali ? BALON : null, kalinlik: 4.4, tohum: 40 + i, genlik: 1.0, kay: [2, 2] });
    return { kn, i, yan, on, renk: URUN_RENK[kn.r] || null, yanRenk: [renkKaris(anaR, M, 0.07), renkKaris(anaR, M, 0.24)] };
  });
  // t (0 peçetede yatık karalama → 1 masada dik, kalın, renkli): yunuslama 90° → 0, sapma (peçetenin açısından tam bir
  // dönüşle son açıya), boy (karalama 0,5 → IC.kk), kalınlık, renk, peçeteden masaya yay çizen merkez
  function yaratikCiz(f) {
    const t = Math.min(1, Math.max(0, (f - Z.kalk) / (Z.kon - Z.kalk)));
    const th = 90 * (1 - yumus(0.06, 0.82, t)) * D2R;
    const ps = (-7 + (IC.yaw + 7) * yumus(0.2, 1, t) + 44 * Math.sin(Math.PI * yumus(0.15, 0.95, t))) * D2R;
    const kk = 0.5 + (IC.kk - 0.5) * yumus(0.1, 0.9, t), dz = 0.17 * kk * yumus(0.25, 0.8, t);
    const cp = yumus(0.42, 0.78, t), e = yumus(0, 1, t);
    const merk = [ara(PN.x, IC.xl, e), ara(0, 0.49 * kk, e) + IC.yuk * Math.sin(Math.PI * t), ara(PN.z, IC.zl, e)];
    // konuşta hafif basılma (taban masada kalır)
    const bas = f > Z.kon ? 1 - 0.08 * Math.sin(Math.PI * Math.min(1, (f - Z.kon) / 10)) : 1;
    const cT = Math.cos(th), sT = Math.sin(th), cP = Math.cos(ps), sP = Math.sin(ps), taban = -0.49 * kk;
    const W3 = (x, y, z) => {
      const lx = x * kk, ly = (-(y + 0.03) * kk - taban) * bas + taban;
      const Y1 = ly * cT + z * sT, Z1 = -ly * sT + z * cT;
      return [merk[0] + lx * cP - Z1 * sP, merk[1] + Y1, merk[2] + lx * sP + Z1 * cP];
    };
    const wOn = ara(2.6, 4.4, yumus(0.1, 0.6, t));
    for (const { kn, yan, on, renk, yanRenk } of Y3) {
      const F = kn.p.map(([x, y]) => W3(x, y, 0)), n = kn.p.length;
      yan.forEach((h, j) => {
        if (dz < 0.003) { h.pts = []; h.ciz(); return; }
        const j2 = (j + 1) % n, Bj = W3(kn.p[j][0], kn.p[j][1], -dz), Bj2 = W3(kn.p[j2][0], kn.p[j2][1], -dz);
        const q = [F[j], F[j2], Bj2, Bj].map(p3), ust = Math.abs(q[1][0] - q[0][0]) > Math.abs(q[1][1] - q[0][1]);
        h.pts = duz(q, true);
        // üst yüzler ışıkta (açık), yan yüzler gölgede (koyu)
        h.dolgu.setAttribute('fill', renkKaris(BALON, ust ? yanRenk[0] : yanRenk[1], cp));
        h.ciz();
      });
      on.pts = kn.yumusak ? F.map(p3) : duz(F.map(p3), !!kn.kapali); // dik izdüşüm doğrusal: köşe eki ekranda
      if (on.dolgu) on.dolgu.setAttribute('fill', renkKaris(BALON, renk || BALON, cp));
      on.yol.setAttribute('stroke-width', wOn.toFixed(2));
      on.ciz();
    }
    // gölge: ışık sağ üstten (sol yan yüzler koyu), masada sola düşer; yalnız konarken belirir
    const gP = (w) => p3([w[0] - w[1] * 0.55, 0, w[2] - w[1] * 0.12]);
    for (const { j, h } of golgeH) { h.pts = duz(YAR[j].p, true).map(([x, y]) => gP(W3(x, y, 0))); h.ciz(); }
    golge3.setAttribute('opacity', (0.12 * yumus(0.72, 1, t)).toFixed(3));
  }
  yaratikCiz(Z.kalk);

  // El yazısı (iç ses): balonun sol üstünde; yaratık inerken yazılır, balonla birlikte söner (ekranda ≥ 2 sn)
  const yb = IC.yazi, yaziX = bc[0] + br[0] * IC.yx, yaziY = bc[1] + br[1] * IC.yy;
  const satir1 = ctx.elYazisi(L.div, metin('Bu masamda dursa…', 'If only this could'), { x: yaziX, y: yaziY, boyut: yb, aci: -2 });
  const satir2 = ctx.elYazisi(L.div, metin('', 'sit on my desk…'), { x: yaziX + yb * 0.9, y: yaziY + yb * 1.08, boyut: yb, aci: -2 });
  for (const p of [satir1, satir2]) p.style.paddingRight = '0.3em';
  ctx.yazElYazisi(satir1, Z.yazi, 20);
  ctx.yazElYazisi(satir2, Z.yazi + 18, 16);
  tl.to([satir1, satir2], { autoAlpha: 0, duration: k(12), ease: E.EI }, k(Z.burus + 6));

  // Garsonun A'nın masasındaki yeri (yürüyüşün sonu): masanın sağ ucunun hemen dışında, A'ya yakın derinlikte
  const GW = { x1: yer(1078, 872), o1: 0.95, x2: yer(1250, 930), o2: yer(0.72, 0.68) };
  // #5 kamera: yüz asılırken A'ya ve balonun açılacağı yere yaklaşır (58 k KM, üstel). Kadraj balonun gerçek dış hattı
  // (örneklenmiş, tümsekler dahil), A'nın başı, masanın sağ köşesi ve garsonun geleceği yeri 32 px payla içine alır. K1: iç
  // çekişten sonra kalem eline ve peçeteye iner (k600–629); çizim kuş bakışı ara çekimde (Z.ara0–Z.ara1, kamera birim);
  // dönüşte yakın plandan balon kadrajına geri çekilir (40 k; balon bu sırada açılır), sonra SON'a dek çok yavaş %3 itiş.
  {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    const ekle = (x, y) => { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); };
    const yolE = bal.kontur, uz = yolE.getTotalLength();
    for (let s2 = 0; s2 <= uz; s2 += 6) { const p = yolE.getPointAtLength(s2); ekle(p.x, p.y); }
    ekle(P.A.x - P.masa.yari - 10, aUst + 80 * Ao); ekle(ms.onKose[0] + 20, ms.onKose[1] + 24);
    ekle(GW.x1 + 170 * GW.o1, ms.onKose[1]);
    const pay = 32, son = Math.min((W - 2 * pay) / (b[2] - b[0]), (H - 2 * pay) / (b[3] - b[1])), s5 = son / 1.03;
    const c5 = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    const K5 = odakK(s5, c5), K5b = odakK(s5 * 1.008, c5), K6 = odakK(son, c5);
    // yakın: A'nın yüzü (yumruk dahil), peçete, yatan kalem
    const kb = [Infinity, Infinity, -Infinity, -Infinity];
    const kek = ([x, y]) => { kb[0] = Math.min(kb[0], x); kb[1] = Math.min(kb[1], y); kb[2] = Math.max(kb[2], x); kb[3] = Math.max(kb[3], y); };
    const yz = donustur([200, GOZ_Y + 10], SON_DURUS.cok, SON_DURUS.egim);
    [[-80, -96], [150, 70]].forEach(([dx, dy]) => kek(dunya([yz[0] + dx, yz[1] + dy])));
    kek(dunya([PEC.on[0] - 40, PEC.y1 + 16])); kek(dunya([PEC.on[1] + 24, PEC.y1 + 16])); kek(dunya([150, MB + dB + 10]));
    const sc = Math.min((W - 120) / (kb[2] - kb[0]), (H - 120) / (kb[3] - kb[1]), s5 * 1.8);
    const cc = [(kb[0] + kb[2]) / 2, (kb[1] + kb[3]) / 2];
    const Kc = odakK(sc, cc), Kc2 = odakK(sc * 1.02, cc);
    kameraUstel(Z.asil, 58, K4, K5);
    tl.fromTo(ctx.kamera, K5, { ...K5b, duration: k(Z.cek + 10 - Z.asil - 58), ease: 'none', immediateRender: false }, k(Z.asil + 58));
    kameraUstel(Z.cek + 10, Z.ara0 - 1 - Z.cek - 10, K5b, Kc);
    tl.set(ctx.kamera, { x: 0, y: 0, scale: 1 }, k(Z.ara0)); // ara çekim ekran koordinatında
    kameraUstel(Z.ara1, 40, Kc2, K5);
    tl.fromTo(ctx.kamera, K5, { ...K6, duration: k(SON + 1 - Z.ara1 - 40), ease: 'none', immediateRender: false }, k(Z.ara1 + 40));
  }

  // ---------- Oyunculuk: A (her karede izlerden: aIz(f) → A, sonra aCiz). Kollar ve gövde akar; ifade ve bakış ayrık.
  // #3: devirde v1'in son pozunda (merak, bakış düz, kolsuz gövde); k200 göz kırpar (kollar bu karede gelir), garsona bakar.
  // #4: el kalkar (önce dışa açılır, sonra yukarı, 18 k), ağız açılır: söz; el havada bekler, garson güler (görmedi), yüz
  // düşer, nefes. İkinci deneme: yarı doğrulur, el daha yükseğe, iki kez sallar (yarım salınım 10 k), el havada asılı kalır
  // (karşılıksız), iner (22 k, 'tik'). #5a: yüz asılır, omuzlar düşer (28 k), nefes. #5b: el yanağa gider (30 k; parmaklar
  // kıvrılır), baş ele çöker ve o yana yaslanır (20 k), yanak ezilir; iç çekiş (omuz kalkar, iner), göz kırpma. K1: boştaki el
  // kalemi alır, peçeteye yaratığı çizer, kalemi bırakır (kalemIz); hayal ederken gülümser, peçete gidince ağzı açık kalır.
  const izKalk = [
    [200, 'dinlen'], [Z.kalk1, 'dinlen'], [Z.kalk1 + 9, 'kalk1a', 'sine.in'], [Z.kalk1 + 18, 'kalk1', 'sine.out'],
    [Z.kalk2, 'kalk1'], [Z.kalk2 + 10, 'kalk2a', 'sine.in'], [Z.kalk2 + 20, 'kalk2', 'sine.out'],
    [Z.soz2 + 10, 'salla'], [Z.soz2 + 20, 'kalk2'], [Z.soz2 + 30, 'salla'], [Z.sustu, 'kalk2'],
    [Z.inis, 'kalk2'], [Z.inis + 11, 'ini1', 'sine.in'], [Z.inis + 22, 'dinlen', 'sine.out'],
  ];
  const izYanak = [[Z.yanak, 'dinlen'], [Z.yanak + 15, 'yanak1', 'sine.in'], [Z.yanak + 30, 'yanak', 'sine.out']];
  const KOL_IZ = {
    sol: KT === 'sol' ? izKalk : [[200, 'dinlen']],
    sag: KT === 'sag' ? [...izKalk, ...izYanak] : [[200, 'dinlen'], ...izYanak],
  };
  // Çöküş (− doğrulma) ve eğim: yarı doğrulma (2. kaldırışla), geri oturma (el inerken), yüz asılırken omuzlar düşer,
  // el yanağa değince baş ele çöker ve o yana eğilir (son duruş SON_DURUS: balon ona göre kurulu). İç çekiş (Z.cek):
  // omuzlar kalkar (nefes alır), sonra biraz daha aşağı iner (verir) ve yerine oturur. Peçete kalkınca baş yumruktan biraz
  // kalkar (şaşkınlık; yumruk başla birlikte)
  const SD = SON_DURUS, ZC = Z.cek;
  const COK = izSayi([BAS, 0], [Z.kalk2, 0], [Z.kalk2 + 20, -14, E.KM], [Z.inis + 2, -14], [Z.inis + 24, 0, E.KM],
    [Z.asil, 0], [Z.asil + 28, 24, 'power2.out'], [Z.yanak + 24, 24], [Z.yanak + 44, SD.cok, E.KM],
    [ZC, SD.cok], [ZC + 12, SD.cok - 6, 'sine.inOut'], [ZC + 28, SD.cok + 4, 'sine.inOut'], [ZC + 40, SD.cok + 1, 'sine.inOut'],
    [Z.burus, SD.cok + 1], [Z.burus + 10, SD.cok - 9, 'power2.out']);
  const EGIM = izSayi([BAS, 0], [Z.yanak + 24, 0], [Z.yanak + 44, SD.egim, E.KM],
    [ZC, SD.egim], [ZC + 12, SD.egim - 0.6, 'sine.inOut'], [ZC + 28, SD.egim + 0.5, 'sine.inOut'], [ZC + 40, SD.egim, 'sine.inOut'],
    [Z.burus, SD.egim], [Z.burus + 10, SD.egim - 2, 'power2.out']);
  // Yanağın ezilmesi: el değdiği an başlar, baş çöktükçe derinleşir, iç çekişte nefes verirken biraz artar
  const EZIK = izSayi([Z.yanak + 26, 0], [Z.yanak + 44, 1, 'sine.out'], [ZC + 12, 0.85, 'sine.inOut'], [ZC + 28, 1.12, 'sine.inOut'], [ZC + 40, 1, 'sine.inOut'],
    [Z.burus, 1], [Z.burus + 10, 0.55, 'power2.out']);
  // Yüz (ayrık): [kare, ifade, bakış?]; göz kırpma 4 k; ifade değişimi hareketin doruğunda (el yukarı varınca söz). K1: sıkkın
  // bakış kaleme iner, çizerken merak (gözler peçetede), çizim bitince yarım gülümseme: gözler kapanır, hayal eder (garsonun
  // gelişini görmez); peçete kalkınca şaşkın, gözler peçeteyi izler
  const A_YUZ = [
    [BAS, 'merak', [0, 0]], [200, 'kirp'], [204, 'notr', [1, 0]], [232, 'merak', [1, -1]],
    [Z.soz1 - 2, 'saskin'], [Z.soz1 + 26, 'merak', [1, -1]],
    [Z.gormez + 8, 'notr', [1, 0]], [Z.gormez + 24, 'kirp'], [Z.gormez + 28, 'notr', [1, 0]], [Z.kalk2 - 6, 'merak', [1, -1]],
    [Z.soz2 - 2, 'saskin'], [Z.sustu + 4, 'notr', [1, 0]],
    [Z.asil, 'sikkin', [1, 0]], [Z.asil + 16, 'ozlem', [0, 1]], [Z.asil + 38, 'kirp'], [Z.asil + 42, 'ozlem', [0, 1]],
    [Z.yanak + 20, 'sikkin', [0, 1]], [ZC + 30, 'kirp'], [ZC + 34, 'sikkin', [0, 1]],
    [Z.uzan + 18, 'merak', [1, 1]], [Z.bitti + 12, 'merak', [1, 1]], [Z.bitti + 22, 'kirp'], [Z.bitti + 26, 'mutlu'],
    [Z.burus, 'saskin', [1, -1]],
  ];
  // ---------- K1 kalem eli (ekranın solu; iki yönde de boştaki el). Kalemin ucunun izi kutu biriminde: konturlar sırayla çizilir,
  // aralarda kalem kalkar ve sonraki konturun başına sıçrar (2 k). Kontur süresi boyuyla orantılı, her kontur sine.inOut (el
  // hızlanıp yavaşlar); mürekkep ucun arkasında kalır (peçetedeki yollar aynı ilerlemeyle kesilir).
  const SIN = gsap.parseEase('sine.inOut');
  const KAR_ZAMAN = (() => {
    const L2 = INS_YOL.map((p) => p.slice(1).reduce((s, q, j) => s + Math.hypot(q[0] - p[j][0], q[1] - p[j][1]), 0));
    const SEK = 2, cizK = Z.bitti - Z.ciz - SEK * (L2.length - 1), Lt = L2.reduce((a, b) => a + b, 0);
    const d = L2.map((l) => Math.max(2, (cizK * l) / Lt)), olc = cizK / d.reduce((a, b) => a + b, 0);
    let t0 = Z.ciz;
    return d.map((x) => { const a = t0, b = t0 + x * olc; t0 = b + SEK; return [a, b]; });
  })();
  function karalama(f, yollar = KAR_YOL, kalkY = 7) {
    const il = KAR_ZAMAN.map(([a, b]) => SIN(Math.min(1, Math.max(0, (f - a) / (b - a)))));
    for (let i = 0; i < KAR_ZAMAN.length; i++) {
      const [a, b] = KAR_ZAMAN[i];
      if (f < a && i > 0) {
        const a0 = KAR_ZAMAN[i - 1][1], u = (f - a0) / (a - a0), p0 = yollar[i - 1][yollar[i - 1].length - 1], p1 = yollar[i][0], e = SIN(u);
        return { uc: [ara(p0[0], p1[0], e), ara(p0[1], p1[1], e) - kalkY * Math.sin(Math.PI * u)], il, kalk: Math.sin(Math.PI * u) };
      }
      if (f <= b) { const p = yolKes(yollar[i], il[i]); return { uc: p[p.length - 1], il, kalk: 0 }; }
    }
    const s = yollar[yollar.length - 1];
    return { uc: s[s.length - 1], il, kalk: 0 };
  }
  // El pozu kalemin ucundan: tutma noktası uçtan KL_UC·eb geride, bilek tutma noktasından kol.js bilekBul ile. Yazarken dirsek
  // masada, dinlenmedekinden biraz önde; uzanırken ve bırakırken kayar.
  const KL_DIRSEK = [DIN.sol.dirsek[0] + 40, MB + 8];
  const kalemPoz = (uc, na, ea = KL.ea) => {
    const tut = topla(uc, yon(na), -KL_UC * KL.eb);
    return { el: 'tutma', tut, na, ea, eb: KL.eb, bs: KL.bs, kis: KL.kis, dirsek: KL_DIRSEK, bilek: bilekBul({ el: 'tutma', hedef: tut, elAci: ea, elBoy: KL.eb, basparmak: KL.bs, kisalma: KL.kis, ad: 'tut' }) };
  };
  const KL_YATP = kalemPoz(KL_YAT.uc, KL_YAT.na);
  const dinlenPoz = (t) => {
    const D0 = DIN.sol;
    return { el: 'dayanma', dirsek: [ara(D0.dirsek[0], KL_DIRSEK[0], t), ara(D0.dirsek[1], KL_DIRSEK[1], t)], bilek: [ara(D0.bilek[0], KL_YATP.bilek[0], t), ara(D0.bilek[1], KL_YATP.bilek[1], t) - 6 * Math.sin(Math.PI * t)], ea: ara(D0.elAci, KL.ea, t), eb: DIN_EB, bs: D0.basparmak, kis: D0.kisalma };
  };
  function kalemIz(f) {
    if (f < Z.uzan || f >= Z.bitti + 22) return null;
    if (f < Z.uzan + 14) return dinlenPoz(SIN((f - Z.uzan) / 14));                      // açık el kaleme kayar
    const ilk = KAR_YOL[0][0], s = KAR_YOL[KAR_YOL.length - 1], son = s[s.length - 1];
    if (f < Z.ciz) {                                                                     // kavrar, kaldırır, doğrultur
      const t = SIN((f - Z.uzan - 14) / (Z.ciz - Z.uzan - 14));
      return kalemPoz([ara(KL_YAT.uc[0], ilk[0], t), ara(KL_YAT.uc[1], ilk[1], t) - 12 * Math.sin(Math.PI * t)], ara(KL_YAT.na, KL.na, t));
    }
    if (f <= Z.bitti) return kalemPoz(karalama(f).uc, KL.na);                           // çizer
    if (f < Z.bitti + 10) {                                                              // kalkar, yerine iner
      const t = SIN((f - Z.bitti) / 10);
      return kalemPoz([ara(son[0], KL_YAT.uc[0], t), ara(son[1], KL_YAT.uc[1], t) - 12 * Math.sin(Math.PI * t)], ara(KL.na, KL_YAT.na, t));
    }
    return dinlenPoz(1 - SIN((f - Z.bitti - 10) / 12));                                  // bırakır, el dinlenmeye döner
  }
  function aIz(f) {
    A.kolVar = f >= 200;
    A.kol = { sol: izAra(KOL_IZ.sol, f), sag: izAra(KOL_IZ.sag, f) };
    A.cok = COK(f); A.egim = EGIM(f); A.ezik = EZIK(f);
    A.kalem = kalemIz(f);
    let ifade = A_YUZ[0][1], bakis = A_YUZ[0][2];
    for (const [n, fa, b] of A_YUZ) { if (n > f) break; ifade = fa; if (b) bakis = b; }
    A.ifade = ifade; A.bakis = bakis;
  }
  // Peçete, karalama, tabak ve masadaki kalem (her karede): mürekkep kalemin ucunun arkasında; peçete garsonun elinde
  // buruşur (dış hat ve çizgiler elin çevresinde topa akar), kalkınca masadan silinir; tabak garson kavrayınca masadan kalkar
  const TOP_R = 20;
  const TOP_NOK = (() => { const R = rng(4242); return PEC_HAT.map((_, j) => { const a = (j / PEC_HAT.length) * 2 * Math.PI, r = TOP_R * (0.72 + 0.38 * R()); return [r * Math.cos(a), r * Math.sin(a) * 0.85]; }); })();
  function masaIz(f) {
    const { il } = karalama(Math.max(f, Z.ciz - 1));
    const c = GT.burus, topM = GT.elDunya ? [GT.elDunya[0], GT.elDunya[1] + TOP_R * 0.7] : [0, 0], pecM = dunya(pecC); // top yumruğun altından taşar (eldeki gibi)
    const buz = (p) => (c > 0 ? [ara(p[0], topM[0] + (p[0] - pecM[0]) * 0.12, c), ara(p[1], topM[1] + (p[1] - pecM[1]) * 0.12, c)] : p);
    pecete.pts = c > 0 ? PEC_HAT.map((p, j) => [ara(p[0], topM[0] + TOP_NOK[j][0], c), ara(p[1], topM[1] + TOP_NOK[j][1], c)]) : PEC_HAT;
    pecete.ciz();
    pecKat.g.setAttribute('opacity', (1 - c).toFixed(2));
    murekkep.forEach((h, i) => { h.pts = f < Z.ciz || il[i] <= 0.002 ? [] : yolKes(KAR_YOL[i], il[i]).map(dunya).map(buz); h.ciz(); });
    pecG.style.visibility = GT.topElde ? 'hidden' : 'visible';
    kalemMasaG.style.visibility = f >= Z.uzan + 14 && f < Z.bitti + 10 ? 'hidden' : 'visible';
    tabakG.style.visibility = GT.tabak === 'masa' ? 'visible' : 'hidden';
  }
  // ---------- Ara çekim (K1, kuş bakışı insert). Z.ara0'da kesmeyle girilir, Z.ara1'de kesmeyle orta plana dönülür (kamera bu
  // çekimde birim: ekran = dünya). Masaya tepeden, A'nın tarafından bakılır (A kadrajın altında; solu kadrajın solu): örtü,
  // sol üst köşede tabağın kenarı, ortada kabartma kenarlı, katlama izli kâğıt peçete. A'nın sağ eli sağ alttan girer ve
  // kalemi üç parmakla tutar: başparmak ile işaret parmağı arasında, orta parmak altta destek; yüzük ve serçe avuca kıvrık.
  // El çizginin sağ altında kalır (çizim sırası üstten aşağı). Kalemin ucu konturları sırayla çizer, çizgi uçtan büyür
  // (orta plandaki karalamayla aynı zaman). Çizim bitince kalem kalkar, el kadrajdan çıkar, karalama bir an tek başına okunur.
  const ARA = ctx.katman('s1-kafe-ara', 11);
  gsap.set(ARA.div, { autoAlpha: 0 });
  tl.set(ARA.div, { autoAlpha: 0 }, 0);
  tl.set(ARA.div, { autoAlpha: 1 }, k(Z.ara0));
  tl.set(ARA.div, { autoAlpha: 0 }, k(Z.ara1));
  const donNok = (c, a) => ([x, y]) => [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
  {
    const s = ARA.svg;
    el(s, 'rect', { x: -40, y: -40, width: W + 80, height: H + 80, fill: MONO.giysi[0] });
    // örtü dokusu: seyrek, soluk dokuma çizgileri
    for (let j = -6; j <= 14; j++) { const x0 = j * yer(150, 130); cizgi(s, [[x0, -40], [x0 + H * 0.35, H + 40]], { kalinlik: 1.6, tohum: 1640 + j, genlik: 0.4, renk: MONO.giysi[1] }).g.setAttribute('opacity', 0.5); }
    // tabağın kenarı (sol üst köşe): kenar, iç halka
    const tc = yer([-70, -120], [-150, 330]), tr = yer(330, 360);
    cizgi(s, oval(tc[0], tc[1], tr, tr, 0, 360, 48, 2), { kapali: true, dolgu: BALON, kalinlik: 5, tohum: 1661, genlik: 0.9, kay: [6, 8] });
    cizgi(s, oval(tc[0], tc[1], tr * 0.66, tr * 0.66, 0, 360, 40, 2), { kapali: true, kalinlik: 3, tohum: 1662, genlik: 0.7, renk: MONO.giysi[3] });
    // peçete: yuvarlak köşeli kare (süperelips), dönük; altında hafif gölge; kenardan içeride kabartma şeridi, katlama izleri
    const D = donNok(INS.c, INS.aci), h = INS.s / 2;
    const kare = (o, u = 9) => oval(0, 0, h * o, h * o, 0, 360, 64, u).map(D);
    el(s, 'path', { d: yolCiz(kare(1).map(([x, y]) => [x + 10, y + 14]), true, { sap: () => 0 }), fill: M, opacity: 0.08 });
    cizgi(s, kare(1), { kapali: true, dolgu: BALON, kalinlik: 4.5, tohum: 1663, genlik: 0.8, kay: [0, 0] });
    for (const [o, w] of [[0.9, 2.4], [0.86, 1.6]]) {
      const hk = cizgi(s, kare(o, 12), { kapali: true, kalinlik: w, tohum: 1664 + o * 10, genlik: 0.4, renk: MONO.giysi[2] });
      hk.yol.setAttribute('stroke-dasharray', o > 0.88 ? '3 9' : '14 10');
    }
    for (const [a, b] of [[[-h * 0.97, 4], [h * 0.97, -3]], [[2, -h * 0.97], [-5, h * 0.97]]]) cizgi(s, [D(a), D(b)], { kalinlik: 2, tohum: 1670 + a[0], genlik: 0.5, renk: MONO.giysi[2] });
  }
  const araMur = INS_YOL.map((_, i) => cizgi(ARA.svg, [], { kalinlik: yer(5.5, 6.5), tohum: 1560 + i, genlik: 0.8 }));
  const araEl = el(ARA.svg, 'g');
  // Yazan el (üstten, sağ el). Yerel çerçeve: kalemin ucu (0,0), x kalem boyunca uçtan geriye, y başparmak yanı (+), birim =
  // el boyu. Parmaklar kapsül (C merkez çizgisi uçtan köke, R yarıçap); el sırtı tek dış hat; ön kol yenle kadraj dışına.
  const YE = {
    serce: { C: [[0.55, -0.32], [0.62, -0.335], [0.69, -0.35]], R: [0.038, 0.042, 0.044] },
    yuzuk: { C: [[0.45, -0.25], [0.53, -0.27], [0.62, -0.29]], R: [0.044, 0.048, 0.051] },
    orta: { C: [[0.17, -0.075], [0.26, -0.11], [0.38, -0.16], [0.52, -0.205]], R: [0.04, 0.046, 0.052, 0.056] },
    sirt: [[0.44, -0.06], [0.47, -0.13], [0.55, -0.225], [0.62, -0.295], [0.68, -0.35], [0.78, -0.35], [0.88, -0.28], [0.96, -0.2], [1.0, -0.02], [0.98, 0.15], [0.86, 0.24], [0.7, 0.27], [0.56, 0.2], [0.47, 0.07]],
    bas: { C: [[0.17, 0.055], [0.25, 0.1], [0.34, 0.165], [0.44, 0.225], [0.55, 0.26]], R: [0.045, 0.05, 0.057, 0.064, 0.07] },
    isaret: { C: [[0.11, -0.03], [0.19, -0.05], [0.28, -0.08], [0.38, -0.1], [0.47, -0.115]], R: [0.041, 0.045, 0.05, 0.053, 0.057] },
    kalem: { arka: 0.78, r: 0.021, sivri: 0.07 },
    kol: { bilek: [1.08, -0.02], aci: 14, en: [0.175, 0.24], boy: 3.4, manset: 0.09 }, // ön kol dikeyde de kadraj dışına uzanır
  };
  const yarimDaire = (c, t, n, r) => [30, 60, 90, 120, 150].map((d) => { const a = d * D2R; return [c[0] + r * (Math.cos(a) * n[0] + Math.sin(a) * t[0]), c[1] + r * (Math.cos(a) * n[1] + Math.sin(a) * t[1])]; });
  function kapsulHat(C, R) {
    const n = C.length, bir = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
    const N = C.map((_, i) => { const p = C[Math.max(0, i - 1)], q = C[Math.min(n - 1, i + 1)], d = bir([q[0] - p[0], q[1] - p[1]]); return [-d[1], d[0]]; });
    const L = C.map((c, i) => topla(c, N[i], R[i])), Rr = C.map((c, i) => topla(c, N[i], -R[i]));
    const tS = bir([C[n - 1][0] - C[n - 2][0], C[n - 1][1] - C[n - 2][1]]), t0 = bir([C[0][0] - C[1][0], C[0][1] - C[1][1]]);
    return [...L, ...yarimDaire(C[n - 1], tS, N[n - 1], R[n - 1]), ...Rr.reverse(), ...yarimDaire(C[0], t0, N[0].map((v) => -v), R[0])];
  }
  // kalk: kalemin kâğıttan kalkışı (0..1): el biraz büyür, gölgesi açılır
  function elYazan(i, uc, aciD, H0, kalk) {
    const a = aciD * D2R, H = H0 * (1 + 0.04 * kalk), xh = [Math.cos(a), Math.sin(a)], yh = [-Math.sin(a), Math.cos(a)];
    const T = ([x, y]) => [uc[0] + (x * xh[0] + y * yh[0]) * H, uc[1] + (x * xh[1] + y * yh[1]) * H];
    const ar = araclar(181, i, 0.9), ten = MONO.ten[Ap.ten], giy = MONO.giysi[Ap.giysi], w = yer(4.6, 5);
    const sk = (pts, dolgu, ww = w) => ar.sk(pts.map(T), dolgu, ww, [3, 3]);
    const cz = (pts, ww) => ar.cz(pts.map(T), ww);
    const K = YE.kol, kd = yon(K.aci), kn = dikV(kd), b0 = K.bilek, b1 = topla(b0, kd, K.boy);
    const kol = [topla(b0, kn, K.en[0]), topla(b1, kn, K.en[1]), topla(b1, kn, -K.en[1]), topla(b0, kn, -K.en[0])];
    const manset = [topla(b0, kn, K.en[0] + 0.01), topla(topla(b0, kd, K.manset), kn, K.en[0] + 0.015), topla(topla(b0, kd, K.manset), kn, -K.en[0] - 0.015), topla(b0, kn, -K.en[0] - 0.01)];
    const kalemPts = (() => { const A = [YE.kalem.sivri, 0], B = [YE.kalem.arka, 0.02], r = YE.kalem.r; return { govde: [[A[0], -r], [B[0], B[1] - r], [B[0], B[1] + r], [A[0], r]], uc: [[A[0], -r * 0.9], [0, 0], [A[0], r * 0.9]] }; })();
    // gölge (ışık sol üstten: sağ alta düşer); kalem kalkınca açılır
    const gk = [(0.03 + 0.05 * kalk) * H, (0.045 + 0.07 * kalk) * H];
    const golge = [YE.sirt, kapsulHat(YE.bas.C, YE.bas.R), kapsulHat(YE.isaret.C, YE.isaret.R), kalemPts.govde].map((p) => `<path d="${yolCiz(p.map(T).map(([x, y]) => [x + gk[0], y + gk[1]]), true, { sap: () => 0 })}" fill="${M}"/>`).join('');
    let s = `<g opacity="${(0.1 - 0.03 * kalk).toFixed(3)}">${golge}</g>`;
    s += sk(kapsulHat(YE.serce.C, YE.serce.R), ten) + sk(kapsulHat(YE.yuzuk.C, YE.yuzuk.R), ten) + sk(kapsulHat(YE.orta.C, YE.orta.R), ten);
    s += sk(YE.sirt, ten);
    // boğum yayları (işaret, orta, yüzük) ve el sırtında iki tendon izi
    for (const [p, q] of [[[0.47, -0.1], [0.5, -0.15]], [[0.55, -0.205], [0.58, -0.255]], [[0.62, -0.285], [0.65, -0.33]]]) s += cz([p, [(p[0] + q[0]) / 2 + 0.015, (p[1] + q[1]) / 2], q], w * 0.55);
    s += cz([[0.62, -0.15], [0.74, -0.16], [0.86, -0.13]], w * 0.4) + cz([[0.64, -0.03], [0.76, -0.04], [0.88, -0.03]], w * 0.4);
    // ön kol yeni ve ribana manşet (bileği örter)
    s += sk(kol, giy) + sk(manset, giy, w * 0.9);
    for (const u of [0.25, 0.5, 0.75]) s += cz([topla(topla(b0, kd, 0.012), kn, ara(-K.en[0], K.en[0], u)), topla(topla(b0, kd, K.manset - 0.012), kn, ara(-K.en[0], K.en[0], u))], w * 0.4);
    // kalem (arka ucu başparmak ile işaret arasındaki ağdan el sırtının üstüne taşar), sonra başparmak ve işaret parmağı üstte
    s += sk(duz(kalemPts.govde, true), MONO.giysi[5], w * 0.8) + sk(kalemPts.uc, MONO.giysi[1], w * 0.7);
    s += sk(kapsulHat(YE.bas.C, YE.bas.R), ten);
    s += cz([[0.19, 0.04], [0.22, 0.065], [0.2, 0.09]], w * 0.45) + cz([[0.32, 0.13], [0.345, 0.155], [0.335, 0.185]], w * 0.45); // tırnak, eklem
    s += sk(kapsulHat(YE.isaret.C, YE.isaret.R), ten);
    s += cz([[0.13, -0.045], [0.16, -0.025], [0.13, -0.005]], w * 0.45) + cz([[0.29, -0.09], [0.31, -0.068], [0.3, -0.045]], w * 0.45);
    return s;
  }
  // Kalemin ucu ara çekimde: girişte sağ alttan ilk konturun başına, çizerken konturlarda, sonra sağ alta çıkış
  const ARA_GIR = yer([W - 120, H - 10], [W - 90, H - 260]), ARA_CIK = [W + 260, H + 300]; // giriş: uç sağ alt köşede; çıkış: el tümüyle dışarı
  function araIz(f) {
    if (f < Z.ara0 || f >= Z.ara1) return null;
    const ilk = INS_YOL[0][0], s = INS_YOL[INS_YOL.length - 1], son = s[s.length - 1];
    let uc, kalk;
    if (f < Z.ciz) { const t = SIN((f - Z.ara0) / (Z.ciz - Z.ara0)); uc = [ara(ARA_GIR[0], ilk[0], t), ara(ARA_GIR[1], ilk[1], t)]; kalk = 1 - t; }
    else if (f <= Z.bitti) { const c = karalama(f, INS_YOL, 0); uc = c.uc; kalk = c.kalk; }
    else { const t = SIN(Math.min(1, (f - Z.bitti) / 10)); uc = [ara(son[0], ARA_CIK[0], t), ara(son[1], ARA_CIK[1], t)]; kalk = Math.min(1, t * 2); }
    return { uc, kalk, aci: 46 + 3 * Math.sin(f * 0.11) };
  }
  let araAnah = '';
  function araCiz(f, i = kaynaSon) {
    const iz = araIz(f);
    const { il } = karalama(Math.max(f, Z.ciz - 1), INS_YOL, 0);
    araMur.forEach((h, j) => { h.pts = f < Z.ciz || il[j] <= 0.002 ? [] : yolKes(INS_YOL[j], il[j]); h.ciz(); });
    const anah = iz ? `${i}|${iz.uc.map(f2)}|${f2(iz.kalk)}|${f2(iz.aci)}` : '';
    if (anah === araAnah) return;
    araAnah = anah;
    araEl.innerHTML = iz && iz.uc[0] < W + 250 ? elYazan(i, iz.uc, iz.aci, INS.el, iz.kalk) : '';
  }
  // Sallama çizgileri: elin balona bakan yanında kısa yaylar; iki konum arasında elle aynı salınımla akar (u 1: 'salla').
  // Öbür yanda yay yok: o yandaki masanın minik balonuna biner. İkinci takım yalnız tohum sırası için kurulur, gizli kalır.
  const O_ = oA[KT], sHx = P.A.x + (O_[0] + KS * 58 - 200) * Ao, sHy = aUst + (O_[1] - 14 - 308) * Ao;
  const SALLA_YAY = [[[-40, 6], [72, 96]], [[-64, -20], [80, 104]]];
  const sallaNok = (u, j) => {
    // u 1 → takım 0 (el 'salla'da), u 0 → takım 1 (el 'kalk2'de)
    const [[a0, a1], [r0, r1]] = SALLA_YAY[0], [[c0, c1], [q0, q1]] = SALLA_YAY[1];
    const A0 = ara(c0, a0, u), A1 = ara(c1, a1, u), R = j ? ara(q1, r1, u) : ara(q0, r0, u), cy = sHy - ara(10, 0, u);
    const [b0, b1] = KS < 0 ? [A0, A1] : [180 - A1, 180 - A0];
    return oval(sHx, cy, R * Ao, R * Ao * 1.1, b0, b1, 6);
  };
  const sallaG = SALLA_YAY.map(([[a0, a1], [r0, r1]], j) => {
    const g = el(L.svg, 'g'), hs = [];
    const [b0, b1] = KS < 0 ? [a0, a1] : [180 - a1, 180 - a0];
    for (const r of [r0, r1]) hs.push(cizgi(g, oval(sHx, sHy - j * 10, r * Ao, r * Ao * 1.1, b0, b1, 6), { kalinlik: 4, tohum: T(), genlik: 0.6 }));
    gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS));
    return { g, hs };
  });
  tl.to(sallaG[0].g, { autoAlpha: 1, duration: k(4), ease: 'sine.out' }, k(Z.soz2 + 2));
  tl.to(sallaG[0].g, { autoAlpha: 0, duration: k(5), ease: 'sine.in' }, k(Z.sustu - 2));
  const sallaKur = (f) => {
    const [a, b, t] = izAra(KOL_IZ[KT], f);
    const u = a === 'salla' ? 1 - t : b === 'salla' ? t : 0;
    sallaG[0].hs.forEach((h, j) => { h.pts = sallaNok(u, j); h.ciz(); });
  };
  ctx.isaret(Z.inis + 22, 'tik'); // el masaya iner
  // #5a: yüz asılır: kaşlar iner, ağız aşağı, omuzlar düşer; boş tabağa bakar (el yanağa varana dek müzik susar)
  ctx.isaret(Z.inis + 22, 'sessizlik', { bitis: Z.yanak + 30 });
  // #5b: el yanağa varır, dirsek ağırlığı alır
  ctx.isaret(Z.yanak + 30, 'tik');
  // K1: kalem peçeteye değer, çizim biter (kalem kalkar), yaratık masaya konar (vurgu), garson yürür, tabak tepsiye konar,
  // peçete buruşur; peçete kalkınca müzik susar (fikir gitti), atölyeye kesmeye dek sessizlik
  ctx.isaret(Z.ciz, 'tik', { ad: 'kalem peçeteye değer' });
  ctx.isaret(Z.bitti, 'tik', { ad: 'çizim biter, kalem kalkar' });
  ctx.isaret(Z.kon + 2, 'vurgu', { ad: 'yaratık masaya konar' });
  ctx.isaret(Z.garson, 'tik', { ad: 'garson yürür' });
  ctx.isaret(Z.al + 28, 'tik', { ad: 'tabak tepsiye, bardak şıngırdar' });
  ctx.isaret(Z.burus + 2, 'tik', { ad: 'peçete buruşur' });
  ctx.isaret(Z.burus + 6, 'sessizlik', { bitis: SON + 1 });

  // ---------- Oyunculuk: garson ve müşteri. Garson konuşur, anlatır, dinler, kahkaha atar; A'nın iki seslenmesi de
  // müşterinin şakasına attığı kahkahaya denk gelir. Bakışı hep müşteride (ekranın sağı, aşağı). Kullanıcı 2026-10-23:
  // daha az ama daha net hareket: jest 26–60 k'da bir değişir, iki poz arasında 14 k'da akar (anahtardan 2 k önce başlar),
  // ağırlık 18 k'da bir bacaktan öbürüne geçer; ifade ayrık. Sekme, kahkaha ve baş sallama sine ile.
  const musteri = kisiAd(6).h, musteri2 = kisiAd(7)?.h; // dikeyde müşterinin sırtı dönük arkadaşı yok
  musteri.poz({ ifade: 'mutlu', bakis: [-1, -1] });
  const mBalon = minikBalon(kisiAd(6).g, musteri.goz, 1, kisiAd(6).o, 771, 50 * kisiAd(6).o);
  const balonAc = (bg, a, b) => {
    tl.fromTo(bg, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: k(6), ease: E.BO, immediateRender: false }, k(a));
    tl.to(bg, { autoAlpha: 0, scale: 0.8, duration: k(5), ease: E.EI }, k(b - 5));
  };
  // Kahkaha: a..b arasında 10 k'lık sekmeler (gövde 0 → 4 → 0), çizgiler aynı ritimde salınır, uçlarda belirip söner
  const GULUS = [];
  const gulus = (a, b) => {
    const n0 = adim(a), adet = Math.ceil((b - n0) / 10), n1 = n0 + adet * 10;
    GULUS.push([n0, n1]);
    salin(gSar, n0, adet, 4);
    tl.to(gulme[0].g, { autoAlpha: 1, duration: k(3), ease: 'sine.out' }, k(n0));
    tl.to(gulme[0].g, { autoAlpha: 0, duration: k(4), ease: 'sine.in' }, k(n1 - 4));
  };
  // [kare, garson durumu]
  const GAKIS = [
    [BAS, { ifade: 'mutlu', bakis: [1, 1], jest: 'anlat', agirlik: 1 }],                     // anlatır
    [222, { jest: 'yukari', ifade: 'merak' }], [248, { jest: 'anlat2', ifade: 'mutlu' }],
    [274, { jest: 'kalca', ifade: 'merak', agirlik: -1 }],                                   // müşteriyi dinler
    [Z.gormez, { jest: 'gogus', ifade: 'mutlu' }],                                           // şakaya güler: A'yı görmez
    [358, { jest: 'anlat', agirlik: 1 }],                                                     // karşılık verir
    [Z.soz2 + 6, { jest: 'gogus', ifade: 'mutlu' }],                                         // kahkaha (A'nın ikinci seslenmesi)
    [442, { jest: 'anlat2' }],
    [486, { jest: 'kalca', ifade: 'merak', agirlik: -1 }],                                   // dinler
    [546, { jest: 'anlat', ifade: 'mutlu', agirlik: 1 }], [604, { jest: 'yukari', ifade: 'merak' }], [630, { jest: 'anlat2', ifade: 'mutlu' }],
    [672, { jest: 'kalca', ifade: 'merak', agirlik: -1 }], [716, { jest: 'anlat', ifade: 'mutlu', agirlik: 1 }],
    [756, { jest: 'sark', ifade: 'notr', bakis: [-1, 1] }],                                // K1: sohbet biter, A'nın masasına (tabağa) bakar
  ];
  // Akan izler: jest ve ağırlık anahtarları geçiş bitişine (anahtar + 7, ağırlıkta + 10) varılacak biçimde yazılır
  const gIz = (alan, sure, son) => {
    const iz = [];
    for (const [n, d] of GAKIS) {
      if (d[alan] == null) continue;
      const kk = n === BAS ? BAS : adim(n), v = d[alan];
      if (!iz.length) { iz.push([kk, v]); continue; }
      const bas = Math.max(kk - 2, iz[iz.length - 1][0]);
      iz.push([bas, iz[iz.length - 1][1]], [bas + Math.min(sure, son(kk) - bas), v, 'sine.inOut']);
    }
    return iz;
  };
  const sonraki = (alan) => (kk) => { const s = GAKIS.map(([n, d]) => (d[alan] != null && n !== BAS ? adim(n) - 2 : null)).filter((x) => x != null && x > kk - 2); return s.length ? s[0] : Infinity; };
  const G_JEST = gIz('jest', 14, sonraki('jest'));
  const G_AGIR = gIz('agirlik', 18, sonraki('agirlik'));
  const AGIR = (f) => { const [a, b, t] = izAra(G_AGIR, f); return ara(a, b, t); };
  function garsonIz(f) {
    const [a, b, t] = izAra(G_JEST, f);
    G.J = jestAra(a, b, t);
    G.agirlik = AGIR(f);
    for (const [n, d] of GAKIS) { if ((n === BAS ? BAS : adim(n)) > f) break; if (d.ifade) G.ifade = d.ifade; if (d.bakis) G.bakis = d.bakis; }
  }
  // Kahkaha çizgilerinin salınımı (gövde sekmesiyle aynı evre: n0'dan 10 k periyot)
  const gulmeIz = (f) => {
    for (const [n0, n1] of GULUS) if (f >= n0 - 1 && f <= n1) { gulmeKur(0.5 - 0.5 * Math.cos((2 * Math.PI * (f - n0)) / 10)); return; }
  };
  // garson konuşur (minik balon) → müşteri konuşur → garson güler; seyrek baş sallama
  for (const [a, b] of [[200, 270], [358, 396], [442, 484], [546, 600], [632, 668], [718, 752]]) balonAc(gBalon, a, b);
  for (const [a, b] of [[278, 322], [490, 540], [676, 712]]) balonAc(mBalon, a, b);
  for (const n of [290, 306, 504, 522, 694]) zipla(gSar, adim(n), 3, 10); // dinlerken başını sallar
  gulus(Z.gormez, Z.gormez + 30); gulus(Z.soz2 + 6, Z.soz2 + 40);
  // müşteri: konuşurken 'mutlu', dinlerken 'merak', garson güldürünce kahkaha
  const MAKIS = [[BAS, 'merak'], [248, 'mutlu'], [278, 'mutlu'], [358, 'merak'], [Z.soz2 + 6, 'mutlu'], [442, 'merak'], [490, 'mutlu'], [546, 'merak'], [604, 'mutlu'], [676, 'mutlu'], [736, 'merak']];
  for (const [n, f] of MAKIS) poz(adim(n), () => musteri.poz({ ifade: f, bakis: [-1, -1] }));
  for (const n of [292, 330, 408, 420, 504, 694]) zipla(musteri.g, adim(n));
  if (musteri2) for (const n of [236, 336, 414, 520, 640, 760]) zipla(musteri2.g, adim(n));

  // ---------- Garson ön katmanda (K1). Z.devir'de sohbet biter: arka plandaki çizim (g0) gizlenir, aynı yerde, ölçekte ve
  // çizimle ön katmandaki (gOnG: A'nın kollarının ve masasının üstünde, balonun altında) devralır. Tepsiyi öbür eline (ekranın
  // sağı) alır (başı balonun ardında, kafe soluk), A'nın masasının sağ ucuna yürür (adım 11 k, gövde salınır, ölçek
  // derinlikle büyür, pus kalkar), A'nın yüzüne hiç bakmadan eğilir: tabağı tepsiye koyar, peçeteye uzanır, buruşturur,
  // kaldırır, doğrulur, döner (arkadan görünüş), gider. Kollar dünyadaki hedeflere uzanır (bilek kol.js bilekBul, dirsek
  // kolIK); eğilme gövdenin üst yarısını bel çevresinde döndürür. Durum her karede gIzOn(f) ile kurulur (saf).
  const gO1 = gOmuz.sol, gO2 = gOmuz.sag;
  const GSARK = {
    sol: { tur: 'org', d: [gO1[0] - 12, gO1[1] + 160], b: [gO1[0] - 8, gO1[1] + 300], a: 88, bs: -1, yuz: 'sirt', yay: 0.3 },
    sag: { tur: 'org', d: [gO2[0] + 12, gO2[1] + 160], b: [gO2[0] + 8, gO2[1] + 300], a: 92, bs: 1, yuz: 'sirt', yay: 0.3 },
  };
  const TEPSI_UST = { tur: 'kol', el: 'dayanma', d: [gO1[0] - 92, gO1[1] + 32], b: [gO1[0] - 94, gO1[1] - 124], ea: 192, eb: 100, kis: 0.5 };
  const TEPSI_ON = { tur: 'kol', el: 'dayanma', d: [gO2[0] + 26, gO2[1] + 182], b: [gO2[0] - 10, gO2[1] + 232], ea: 196, eb: 100, kis: 0.5 };
  const tepsiUstM = [TEPSI_UST.b[0] - 14, TEPSI_UST.b[1] - 10], tepsiOnM = [TEPSI_ON.b[0] - 32, TEPSI_ON.b[1] - 14];
  const G_UST = 196, G_ALT = 186, G_EB = 96; // uzanan kolun kemikleri ve el boyu (uzun, zayıf garson)
  const KALDIR = [gO1[0] + 92, gO1[1] + 214];  // buruşuk peçete gövdenin önünde, bel üstünde, elde
  const GT = { acik: false, tabak: 'masa', burus: 0, topElde: false, elDunya: null };
  // Çerçeveler: yerel (eğik üst gövde) ↔ kutu (garsonun svg'si) ↔ dünya
  const yerel2kutu = (q) => { const c = Math.cos(GT.egim * D2R), s = Math.sin(GT.egim * D2R), dx = q[0] - 200, dy = q[1] - BEL; return [200 + dx * c - dy * s, BEL + dx * s + dy * c + GT.cok]; };
  const kutu2yerel = (q) => { const c = Math.cos(-GT.egim * D2R), s = Math.sin(-GT.egim * D2R), dx = q[0] - 200, dy = q[1] - GT.cok - BEL; return [200 + dx * c - dy * s, BEL + dx * s + dy * c]; };
  const kutu2dunya = (q) => [GT.x + (q[0] - 200) * GT.o, GT.ust + q[1] * GT.o];
  const dunya2kutu = (w) => [(w[0] - GT.x) / GT.o + 200, (w[1] - GT.ust) / GT.o];
  // Uzanan kol (ekranın solu): hedef yerel çerçevede; 'org' açık el (parmak ucu hedefte), 'tutma' kavrayan el (tutma noktası)
  // Dirsek: iki çözümden alttaki (yerçekimi); kemikler yakın hedefte sarkan kolunki (160/150), uzak hedefte kol neredeyse
  // gerilene dek uzar (uzun kollu garson; sarkıktan uzanmaya geçişte dirsek sıçramasın)
  const dirsekAlt = (b) => {
    const L = Math.hypot(b[0] - gO1[0], b[1] - gO1[1]), u1 = Math.min(G_UST, Math.max(160, L * 0.535)), u2 = Math.min(G_ALT, Math.max(150, L * 0.5));
    const d1 = kolIK(gO1, b, u1, u2, 1), d2 = kolIK(gO1, b, u1, u2, -1);
    return d1[1] >= d2[1] ? d1 : d2;
  };
  function gUzan(hedef, el0, ea = null) {
    const a = ea ?? Math.atan2(hedef[1] - gO1[1], hedef[0] - gO1[0]) / D2R + 8;
    if (el0 === 'org') { const b = topla(hedef, yon(a), -0.9 * 98); return { tur: 'org', b, d: dirsekAlt(b), a, bs: -1, yuz: 'sirt', yay: 0.45 }; }
    const b = bilekBul({ el: 'tutma', hedef, elAci: a, elBoy: G_EB, basparmak: -1, kisalma: 1, ad: 'tut' });
    return { tur: 'kol', el: 'tutma', b, d: dirsekAlt(b), ea: a, eb: G_EB, bs: -1, kis: 1, tut: hedef };
  }
  const sarkUcu = topla(GSARK.sol.b, yon(GSARK.sol.a), 0.9 * 98);
  const EGIL = izSayi([Z.al, 0], [Z.al + 12, -15, 'sine.inOut'], [Z.burus + 6, -15], [Z.burus + 20, 0, 'sine.inOut']);
  const BOG = izSayi([Z.al, 0], [Z.al + 12, 46, 'sine.inOut'], [Z.burus + 6, 46], [Z.burus + 20, 0, 'sine.inOut']);
  const WALK = gsap.parseEase('power1.inOut');
  function gIzOn(f) {
    GT.acik = f >= Z.devir;
    GT.tabak = 'masa'; GT.burus = 0; GT.topElde = false; GT.elDunya = null;
    if (!GT.acik) return;
    Object.assign(GT, { egim: 0, cok: 0, zip: 0, ayak: [0, 0], dm: 14, im: 8, arka: false, sx: 1, ifade: 'notr', bakis: [-1, 1], araya: null, tabakK: null });
    // Konum: sohbet yerinde → yürüyüş (Z.garson) → masanın sağ ucu → dönüş, uzaklaşma (Z.don)
    let x = P.garson.x, o = GO, faz = null, gen = 0, pus = 0.16;
    if (f >= Z.garson) {
      const p = Math.min(1, (f - Z.garson) / (Z.al - 6 - Z.garson)), e = WALK(p);
      x = ara(P.garson.x, GW.x1, e); o = ara(GO, GW.o1, e); pus = 0.16 * (1 - e);
      if (p < 1) { faz = (2 * Math.PI * (f - Z.garson)) / 22; gen = 1 - yumus(0.82, 1, p); }
    }
    if (f >= Z.don) {
      GT.sx = Math.max(0.35, Math.abs(Math.cos((Math.PI * Math.min(6, f - Z.don)) / 6)));
      GT.arka = f >= Z.don + 3;
      if (f >= Z.don + 3) {
        const p = Math.min(1, (f - Z.don - 3) / 44);
        x = ara(GW.x1, GW.x2, p); o = ara(GW.o1, GW.o2, p);
        faz = (2 * Math.PI * (f - Z.don - 3)) / 22; gen = yumus(0, 0.15, p);
      }
    }
    if (faz != null) {
      const kL = Math.max(0, Math.sin(faz)), kR = Math.max(0, Math.sin(faz + Math.PI));
      GT.ayak = [kL * gen, kR * gen]; GT.dm = 32; GT.im = 10; GT.zip = -5 * Math.max(kL, kR) * gen;
    } else if (f < Z.garson) {
      const ag = ara(AGIR(Z.devir), 0, SIN(Math.min(1, (f - Z.devir) / 16)));
      GT.ayak = [Math.max(0, ag), Math.max(0, -ag)];
    }
    GT.x = x; GT.o = o; GT.pus = pus;
    GT.ust = Y(o, 0) - TABAN * o + GT.zip * o;
    GT.egim = EGIL(f); GT.cok = BOG(f);
    // Kollar ve tepsi
    if (GT.arka) {
      GT.kolT = { ...TEPSI_ON, d: [400 - TEPSI_ON.d[0], TEPSI_ON.d[1]], b: [400 - TEPSI_ON.b[0], TEPSI_ON.b[1]], ea: -16 };
      GT.tepsiK = [400 - tepsiOnM[0] - 44, tepsiOnM[1]]; // arkadan: tepsi gövdenin solundan taşar (ayna)
      const sw = faz != null ? Math.sin(faz) * gen : 0;
      const b = [gO2[0] + 10 + 14 * sw, gO2[1] + 290];
      GT.kolS = { tur: 'kol', el: 'tutma', d: [gO2[0] + 14 + 5 * sw, gO2[1] + 160], b, ea: 92, eb: G_EB, bs: 1, kis: 1 };
      GT.topElde = true; GT.tabak = 'tepsi'; GT.burus = 1;
      GT.araya = { top: topla(b, yon(92), 0.5 * G_EB) };
      return;
    }
    if (f < Z.garson) {
      // tepsi öbür ele: sol kol tepsiyi göğsün önüne indirir, sağ kol alır ve önde tutar; sol kol sarkar
      const u = SIN(Math.min(1, (f - Z.devir) / 16));
      GT.tepsiKol = u < 0.5 ? 'sol' : 'sag';
      const sol = kolAra(gO1, TEPSI_UST.d, TEPSI_UST.b, GSARK.sol.d, GSARK.sol.b, u), sag = kolAra(gO2, GSARK.sag.d, GSARK.sag.b, TEPSI_ON.d, TEPSI_ON.b, u);
      GT.kolS = u < 0.5 ? { ...TEPSI_UST, d: sol.dirsek, b: sol.bilek } : { ...GSARK.sol, d: sol.dirsek, b: sol.bilek };
      GT.kolT = u < 0.5 ? { ...GSARK.sag, d: sag.dirsek, b: sag.bilek } : { ...TEPSI_ON, d: sag.dirsek, b: sag.bilek };
      const m = yumus(0.3, 0.7, u), orta = [200, gO1[1] + 60];
      GT.tepsiK = [ara(ara(tepsiUstM[0], orta[0], m), ara(orta[0], tepsiOnM[0], m), m), ara(ara(tepsiUstM[1], orta[1], m), ara(orta[1], tepsiOnM[1], m), m)];
      GT.bakis = [-1, 1];
      return;
    }
    GT.tepsiKol = 'sag';
    GT.kolT = TEPSI_ON;
    GT.tepsiK = yerel2kutu(tepsiOnM);
    const sw = faz != null ? Math.sin(faz) * gen : 0;
    GT.kolS = { ...GSARK.sol, b: [GSARK.sol.b[0] + 16 * sw, GSARK.sol.b[1]], d: [GSARK.sol.d[0] + 5 * sw, GSARK.sol.d[1]] };
    if (f < Z.al) return;
    // Al: tabak kenarı → tepsideki yeri → peçetenin sağ kenarı → buruşturur → göğüs hizasına kaldırır
    GT.bakis = [0, 1];
    const yer2 = (w) => kutu2yerel(dunya2kutu(w));
    const kenar = yer2([TABAK[0] + 40, TABAK[1] - 2]);
    const tabakTepsi = [GT.tepsiK[0] + 44, GT.tepsiK[1] - 14];          // kutu birimi
    const kenarTepsi = kutu2yerel([tabakTepsi[0] + 40 / GT.o, tabakTepsi[1] - 2 / GT.o]);
    const pec = yer2(dunya([PEC.on[1] - 14, pecC[1] + 2]));
    const t1 = Z.al + 14, t2 = Z.al + 28, t3 = Z.burus, t4 = Z.burus + 6, t5 = Z.burus + 18;
    const yay = (p, q, t, h) => [ara(p[0], q[0], t), ara(p[1], q[1], t) - h * Math.sin(Math.PI * t)];
    if (f < t1) GT.kolS = gUzan(yay(sarkUcu, kenar, SIN((f - Z.al) / 14), 30), 'org');
    else if (f < t2) {
      GT.kolS = gUzan(yay(kenar, kenarTepsi, SIN((f - t1) / 14), 50), 'tutma');
      GT.tabak = 'el';
      GT.tabakK = [yerel2kutu(GT.kolS.tut)[0] - 40 / GT.o, yerel2kutu(GT.kolS.tut)[1] + 2 / GT.o];
    } else {
      GT.tabak = 'tepsi';
      if (f < t3) GT.kolS = gUzan(yay(kenarTepsi, pec, SIN((f - t2) / (t3 - t2)), 24), 'org');
      else if (f < t4) { GT.kolS = gUzan(pec, 'tutma'); GT.burus = SIN((f - t3) / 6); }
      else {
        GT.kolS = gUzan(yay(pec, KALDIR, SIN(Math.min(1, (f - t4) / (t5 - t4))), 10), 'tutma');
        GT.burus = 1; GT.topElde = true; GT.bakis = [1, 1];
        GT.araya = { top: GT.kolS.tut };
      }
      if (f >= t3) GT.elDunya = kutu2dunya(yerel2kutu(GT.kolS.tut));
    }
  }
  // Ön garsonun çizimi (kutu birimi; garsonCiz ile aynı parçalar ve aynı titreşim sırası: devirde iki çizim aynı)
  const gonFilt = el(defs, 'filter', { id: 's1-pus-garson-on', 'color-interpolation-filters': 'sRGB', x: '-10%', y: '-10%', width: '120%', height: '120%' });
  const gonFn = (() => { const c = el(gonFilt, 'feComponentTransfer'); return [['R', 0.945], ['G', 0.929], ['B', 0.902]].map(([kn, v]) => ({ e: el(c, `feFunc${kn}`, { type: 'linear' }), v })); })();
  const gonGolge = el(gOnG, 'path', { fill: M, opacity: 0.08 });
  const gonSar = el(gOnG, 'g');
  const gonSvg = el(gonSar, 'svg', svgKutu(P.garson.x, gUst, GO));
  gsap.set(gOnG, { autoAlpha: 0 });
  function bacakOn(ar, [k0, k1], dm, im) {
    const cx = 200, kk = [k0, k1];
    let s = '';
    [-1, 1].forEach((yn, j) => { const d = -dm * kk[j], ic = -im * yn * kk[j]; s += ar.sk(kenarla([[cx + yn * 6, BEL - 30], [cx + yn * 86, BEL - 30], [cx + yn * 70 + ic, BILEK + d], [cx + yn * 20 + ic, BILEK + 4 + d]], 40), PANTOLON); });
    [-1, 1].forEach((yn, j) => { const d = -dm * kk[j], ic = -im * yn * kk[j]; s += ar.sk(kenarla([[cx + yn * 18 + ic, BILEK - 2 + d], [cx + yn * 74 + ic, BILEK + d], [cx + yn * 90 + ic, BILEK + 20 + d], [cx + yn * 22 + ic, BILEK + 22 + d]], 16), M, 3); });
    return s;
  }
  const onlukArka = (ar) => ar.cz([[100, BEL - 22], [300, BEL - 22]], 3.4) + ar.sk(oval(186, BEL - 14, 14, 9, 0, 360, 10), ONLUK, 2.6) + ar.sk(oval(214, BEL - 14, 14, 9, 0, 360, 10), ONLUK, 2.6) +
    ar.cz([[196, BEL - 10], [188, BEL + 40]], 2.6) + ar.cz([[204, BEL - 10], [214, BEL + 38]], 2.6);
  function tabakSVG(ar, [x, y], s) {
    return ar.sk(oval(x, y, 50 * s, 12 * s, 0, 360, 18, 2.2), BALON, 3.6 * s, [2 * s, 2 * s]) + ar.cz(oval(x, y - s, 21 * s, 5 * s, 0, 360, 12, 2.2), 2.6 * s, M, true) +
      ar.cz([[x + 22 * s, y - 3 * s], [x + 38 * s, y + s], [x + 54 * s, y + 4 * s]], 3.4 * s) + ar.sk(oval(x + 16 * s, y - 4 * s, 9 * s, 5 * s, 0, 360, 8), MONO.giysi[3], 2.6 * s, [s, s]);
  }
  function tepsiOn(ar, [x, y], tabak, s, ayna = 1) {
    let out = ar.sk(oval(x, y - 8, 92, 14, 0, 360, 18, 2.4), MONO.giysi[3], 4);
    for (const dx of [-54 * ayna, -20 * ayna]) out += ar.sk(kenarla([[x + dx - 14, y - 56], [x + dx + 14, y - 56], [x + dx + 11, y - 14], [x + dx - 11, y - 14]], 14), MONO.giysi[6], 3.6) + ar.cz([[x + dx - 12, y - 44], [x + dx + 12, y - 44]], 2.6);
    if (tabak) out += tabakSVG(ar, [x + 44 * ayna, y - 14], s);
    return out;
  }
  function topSVG(ar, [x, y], r) {
    const pts = TOP_NOK.filter((_, j) => j % 3 === 0).map(([u, v]) => [x + (u * r) / TOP_R, y + (v * r) / TOP_R]);
    return ar.sk(pts, BALON, 3.2, [2, 2]) + ar.cz([[x - r * 0.5, y - r * 0.2], [x - r * 0.05, y + r * 0.1], [x + r * 0.2, y - r * 0.35]], 2.2) + ar.cz([[x - r * 0.1, y + r * 0.45], [x + r * 0.45, y + r * 0.15]], 2.2);
  }
  function gKolCiz(i, taraf, q, araya = '') {
    const omuz = taraf === 'sol' ? gO1 : gO2, tohum = taraf === 'sol' ? 61 : 52;
    const ortak = { giysi: GIYSI, ten: GTEN, kalinlik: gKalin, kaynama: i, manset: 'gomlek', govdeX: 200, omuz, dirsek: q.d, bilek: q.b, taraf, tohum };
    if (q.tur === 'org') return elOrganik({ bilek: q.b, aci: q.a, boy: 98, bs: q.bs, yay: q.yay, yuz: q.yuz, ten: GTEN, kaynama: i, tohum }) + kolSVG({ ...ortak, el: 'acik', elBoy: 0.01 });
    return kolSVG({ ...ortak, el: q.el, elAci: q.ea, elBoy: q.eb, basparmak: q.bs, kisalma: q.kis, araya });
  }
  let gonAnah = '';
  function garsonOnCiz(i = kaynaSon) {
    if (!GT.acik) return;
    const anah = `${i}|${JSON.stringify(GT, (kk, v) => (typeof v === 'number' ? +v.toFixed(2) : v))}`;
    if (anah === gonAnah) return;
    gonAnah = anah;
    const o = GT.o;
    for (const [a, v] of Object.entries(svgKutu(GT.x, GT.ust, o))) gonSvg.setAttribute(a, v);
    gonGolge.setAttribute('d', yolCiz(oval(GT.x, Y(o, 0) + 2, (64 * o) / 0.54, (9 * o) / 0.54, 0, 360, 14, 2), true, { sap: () => 0 }));
    gonSar.setAttribute('transform', `translate(${f2(GT.x)} 0) scale(${GT.sx.toFixed(3)} 1) translate(${f2(-GT.x)} 0)`);
    gonFn.forEach(({ e, v }) => { e.setAttribute('slope', (1 - GT.pus).toFixed(3)); e.setAttribute('intercept', (GT.pus * v).toFixed(3)); });
    if (GT.pus > 0.004) gOnG.setAttribute('filter', 'url(#s1-pus-garson-on)'); else gOnG.removeAttribute('filter');
    const ar = araclar(623, i), at = araclar(633, i), ap = araclar(645, i);
    const don = `translate(0 ${f2(GT.cok)}) rotate(${GT.egim.toFixed(2)} 200 ${BEL})`, ters = `rotate(${(-GT.egim).toFixed(2)} 200 ${BEL}) translate(0 ${f2(-GT.cok)})`;
    const Gk = govdeKes(Gp, { id: 's1-garson-on', kaynama: i, gogus: 92, tohum: Gp.tohum });
    const kisi = kisiSVG(Gp, { kaynama: i, ifade: GT.ifade, bakis: GT.bakis, mono: true, arka: GT.arka });
    const govde = `<g transform="${don}"><g clip-path="url(#s1-garson-on-bel)">${Gk.tanim}<g ${Gk.klip}>${kisi}</g>${Gk.kontur}</g></g>`;
    const tanim = `<defs><clipPath id="s1-garson-on-bel" clipPathUnits="userSpaceOnUse"><rect x="-600" y="-600" width="1600" height="${600 + BEL}"/></clipPath></defs>`;
    let araya = '';
    if (GT.tabak === 'el') araya = `<g transform="${ters}">${tabakSVG(ap, GT.tabakK, 1 / o)}</g>`;
    if (GT.araya?.top) araya = topSVG(ap, [GT.araya.top[0], GT.araya.top[1] + (TOP_R * 0.7) / o], TOP_R / o); // top yumruğun altından taşar
    if (GT.arka) {
      gonSvg.innerHTML = tanim + tepsiOn(at, GT.tepsiK, true, 1 / o, -1) + govde + bacakOn(ar, GT.ayak, GT.dm, GT.im) + onlukArka(ar) +
        gKolCiz(i, 'sol', GT.kolT) + gKolCiz(i, 'sag', GT.kolS, araya);
      return;
    }
    const tepsiKol = GT.tepsiKol === 'sol' ? ['sol', GT.kolS] : ['sag', GT.kolT], serbest = GT.tepsiKol === 'sol' ? ['sag', GT.kolT] : ['sol', GT.kolS];
    gonSvg.innerHTML = tanim + govde + bacakOn(ar, GT.ayak, GT.dm, GT.im) + onluk(ar) +
      `<g transform="${don}">${gKolCiz(i, ...tepsiKol)}</g>` + tepsiOn(at, GT.tepsiK, GT.tabak === 'tepsi', 1 / o) +
      `<g transform="${don}">${gKolCiz(i, ...serbest, araya)}</g>`;
  }
  ctx.kaynayanlar.add((i) => garsonOnCiz(i));
  tl.set(g0, { autoAlpha: 1 }, k(BAS));
  tl.set(g0, { autoAlpha: 0 }, k(Z.devir));

  // ---------- Oyunculuk: öteki masalar (sohbet, bakış, göz kırpma 4 k; konuşan sine ile sekerek konuşur, sırtı dönükler
  // başını sallar)
  {
    const t4a = kisiAd(4), t4b = kisiAd(5);
    const b4a = minikBalon(t4a.g, t4a.h.goz, -1, t4a.o, 701, 50 * t4a.o), b4b = minikBalon(t4b.g, t4b.h.goz, 1, t4b.o, 704);
    // sohbet sırası (uzun, sakin dönüşler; konuşan 16 k'lık yumuşak sekmeyle konuşur)
    const sira = [[0, 200, 252], [1, 264, 322], [0, 336, 392], [1, 408, 462], [0, 478, 534], [1, 550, 606], [0, 622, 680], [1, 696, 754]];
    for (const [j, a, b] of sira) {
      const kon = j ? t4b : t4a, din = j ? t4a : t4b;
      balonAc(j ? b4b : b4a, a, b);
      poz(adim(a), () => { kon.h.poz({ ifade: 'mutlu' }); din.h.poz({ ifade: 'merak' }); });
      salin(kon.h.g, adim(a), Math.ceil((b - 5 - adim(a)) / 16), -2, 16);
      poz(adim(b), () => { kon.h.poz({ ifade: 'notr' }); din.h.poz({ ifade: 'notr' }); });
    }
    poz(BAS, () => t4a.h.poz({ ifade: 'notr', bakis: [1, 0] }));
    // arka sıra, laptoplu, ön sağdaki kız, barista: tohumlu küçük canlılık
    const canli = (h, tohum, bakislar, ifadeler = ['notr', 'mutlu', 'merak', 'notr']) => {
      const r = rng(tohum);
      for (let n = BAS + 4 + Math.floor(r() * 18); n < SON - 10; n += 52 + Math.floor(r() * 40)) {
        const f = ifadeler[Math.floor(r() * ifadeler.length)], b = bakislar[Math.floor(r() * bakislar.length)];
        poz(adim(n), () => h.poz({ ifade: f, bakis: b }));
        if (r() < 0.45) { poz(adim(n + 14), () => h.poz({ ifade: 'kirp' })); poz(adim(n + 14) + 4, () => h.poz({ ifade: f })); }
      }
    };
    const on = kisiler.filter((q) => q.tur === 'on' && ![4, 6].includes(q.fig));
    on.forEach((q, j) => canli(q.h, 900 + j * 17, q.fig === 1 ? [[0, 1], [0, 1], [1, 1]] : [[1, 0], [-1, 0], [0, 0], [-1, 1]]));
    canli(barista, 950, [[-1, 1], [-1, 1], [0, 0]], ['notr', 'notr', 'mutlu']);
    const sirt = kisiler.filter((q) => q.tur === 'arka' && q.fig !== 7);
    // sırtı dönük konuşan (masa 4) kendi konuşmasında ayrıca baş sallamaz (iki sekme üst üste binmesin)
    const konusmaPen = (h) => sira.filter(([j]) => (j ? t4b : t4a).h === h).map(([, a, b]) => [adim(a) - 8, b + 2]);
    sirt.forEach((q, j) => {
      const r = rng(960 + j), pen = konusmaPen(q.h);
      for (let n = BAS + 10 + Math.floor(r() * 20); n < SON; n += 64 + Math.floor(r() * 40)) { const kk = adim(n); if (!pen.some(([a, b]) => kk >= a && kk <= b)) zipla(q.h.g, kk, -2, 10); }
    });
  }

  // ---------- Her kare: A ve garson izlerden kurulur (önbellekli: değişmeyen karede yeniden çizilmez), çizgiler salınır
  ctx.herKare((f) => {
    if (f < BAS - 1 || f > SON + 1) return;
    aIz(f); aCiz();
    if (f < Z.devir) { garsonIz(f); garsonCiz(); }
    gIzOn(f);
    gsap.set(gOnG, { autoAlpha: GT.acik ? gsap.getProperty(arka, 'opacity') : 0 });
    garsonOnCiz();
    masaIz(f);
    if (f >= Z.dusun - 2 && f <= Z.burus + 30) yaratikCiz(f);
    if (f >= Z.ara0 - 1 && f <= Z.ara1) araCiz(f);
    if (f >= Z.soz2 - 2 && f <= Z.sustu + 4) sallaKur(f);
    gulmeIz(f);
  });
  // Kur anında ilk durum (devir karesi)
  aIz(BAS); aCiz(0);
  garsonIz(BAS); garsonCiz(0);
  gIzOn(BAS); masaIz(BAS);
  void ms; void H;
}
