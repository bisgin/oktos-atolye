// Çatı katı kilimi (kodla): Anadolu düz dokuma kilimi (ilmeksiz, atkı yüzlü, yarıklı dokuma; Konya/Obruk düzeni).
// Desen 6,25 mm'lik basamak ızgarasında (bir basamak ≈ iki çözgü) renk numarası olarak kurulur, sonra kanvasa dokunur
// (uzun kenar en çok 2048 px): kök boya renkleri, sıra sıra abraş, atkı sıraları, renk sınırlarında kısa yarıklar ve
// uzun sınırlarda kenetli dişler, yün tüyü. Çözgü uzun kenar (x) boyunca gider: atkı sıraları kısa kenara paraleldir,
// çözgü uçları kısa kenarlarda düğümlü püskül olur.
// Düzen (dıştan içe): uzun kenarlarda kenar örgüsü, kısa kenarlarda düz dokuma baş; su yolu (zikzak), ana bordür
// (uçlarında koçboynuzu kanatlı, içi yıldızlı baklavalar; köşelerde göz), su yolu; kırmızı zemin. Zeminde uzun eksen
// boyunca üç kancalı göl: ortada çift elibelinde (başında koçboynuzu: bereket), iki yanda yıldız, koçboynuzu ve göz.
// Göller arasında muska, göz, küpe; uçlarda kurt izi; köşelerde pıtrak. Desen iki eksende aynalıdır; dokuyucunun
// bilerek bıraktığı tek kusur (nazarlık) bir köşededir.
// Birim mm, Z yukarı; kilim merkezi orijinde, alt yüzü z = 0, uzun kenar x ekseninde. Kalınlık 5,5 mm, yere yapışık.
import * as THREE from 'three';

const HUCRE = 6.25;      // desen basamağı (mm; 3200 × 2200 kilimde)
const DOKU_MAKS = 2048;  // dokunun uzun kenarı en çok (telefon)
const KALIN = 5.5;       // kilim kalınlığı (mm)
const BOS = -1;
// Kök boya renkleri (sRGB): kırmızı (kök boya), lacivert (çivit), fildişi (boyasız yün), sarı (safran / muhabbet
// çiçeği), ceviz kahvesi, yeşil (çivit üstüne sarı), turuncu, açık çivit
const [KIR, LAC, KRM, SAR, KAH, YES, TUR] = [0, 1, 2, 3, 4, 5, 6]; // 7: açık çivit (şimdilik kullanılmıyor)
const PALET = [
  [140, 34, 31], [30, 40, 74], [214, 197, 162], [200, 142, 44],
  [64, 42, 31], [70, 102, 72], [196, 98, 40], [74, 108, 146],
];
// Abraş: her renk bant bant ne kadar oynar (parlaklık, sıcaklık)
const ABRAS = [[0.07, 0.04], [0.09, 0.03], [0.035, 0.02], [0.05, 0.03], [0.05, 0.02], [0.06, 0.03], [0.05, 0.03], [0.07, 0.03]];

// Tohumlu rastgele (aynı tohum aynı kilimi verir)
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// ---- motifler: f(dx, dy) hücre merkezinin motif merkezine uzaklığı → renk ya da BOS ----
// Göz: iç içe basamaklı baklavalar (en içte nokta)
const goz = (renkler, kalin = 2) => (dx, dy) => {
  const k = Math.max(0, Math.ceil((Math.abs(dx) + Math.abs(dy)) / kalin) - 1);
  return k < renkler.length ? renkler[k] : BOS;
};
// Sekiz köşeli yıldız: kare ile baklavanın birleşimi; katmanlar dıştan içe (her katman `kalin` hücre)
const yildizIci = (ax, ay, s) => Math.max(ax, ay) <= s || ax + ay <= Math.round(s * 1.42);
const yildiz = (s, renkler, kalin = 3) => (dx, dy) => {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (!yildizIci(ax, ay, s)) return BOS;
  let k = 0;
  while (k + 1 < renkler.length && yildizIci(ax, ay, s - (k + 1) * kalin)) k++;
  return renkler[k];
};
// Koçboynuzu: ortada sap, sapın ucundan iki yana kıvrılan boynuzlar (basamaklı halka; sapa bakan alt çeyreği açık).
// v: tabandan boynuz yönüne. r: boynuz yarıçapı, kalin: boynuz kalınlığı, sap: sap boyu, ic: boynuzun içindeki nokta
const kocboynuzu = (r, kalin, sap, renk, ic = BOS) => (dx, v) => {
  const ax = Math.abs(dx);
  if (v < 0) return BOS;
  if (ax <= 1 && v <= sap) return renk;
  const ux = ax - (r + 1), uy = v - sap, m = Math.abs(ux) + Math.abs(uy);
  if (m <= r && m > r - kalin && !(ux < 0 && uy < 0)) return renk;
  if (ic >= 0 && m <= Math.max(1, r - kalin - 2)) return ic;
  return BOS;
};
// Elibelinde: elleri belinde (kollar omuz uçlarından dirseğe açılır, eller bele dayanır) dik duran kadın figürü; başının
// iki yanında koçboynuzu (bereket), belinde kuşak, eteğinde iki şerit, ayakları dışa dönük. (X, Y): Y yukarı (kanvasın
// üstü, kuzey); merkez belde.
function elibelinde({ govde = KRM, goz1 = SAR, goz2 = LAC, kusak = SAR, serit = [LAC, KIR] } = {}) {
  const boynuz = kocboynuzu(7, 3, 2, govde);
  return (X, Y) => {
    const ax = Math.abs(X);
    const bas = ax + Math.abs(Y - 44);
    if (bas <= 2) return goz2;                                   // baştaki göz
    if (bas <= 4) return goz1;
    if (bas <= 9) return govde;                                  // baş: basamaklı baklava
    if (boynuz(X, Y - 52) >= 0) return govde;                    // koçboynuzu: tepeden iki yana kıvrılır
    if (ax <= 3 && Y > 31 && Y <= 35) return govde;              // boyun
    if (ax <= 12 && Y > 25 && Y <= 31) return govde;             // omuzlar
    const k = ax + Math.abs(Y - 14);                             // kollar: omuz ucundan dirseğe (28, 14), oradan bele
    if (Y > -3 && Y <= 31 && k > 21 && k <= 28) return govde;
    if (Math.abs(ax - 14) + Math.abs(Y - 14) <= 3) return goz1;  // kolla gövde arasındaki boşlukta göz
    if (ax <= 6 && Y > -6 && Y <= -2) return kusak;              // kuşak
    if (ax <= 6 && Y > -6 && Y <= 31) return govde;              // gövde
    if (Y > -28 && Y <= -6 && ax <= 6 + (-6 - Y)) {              // etek: 45° genişler
      if (Y > -15 && Y <= -12) return serit[0];
      if (Y > -21 && Y <= -19) return serit[1];
      return govde;
    }
    if (Y > -36 && Y <= -28 && ax > 3 && ax <= 7) return govde;  // bacaklar
    if (Y > -38 && Y <= -36 && ax > 3 && ax <= 11) return govde; // ayaklar dışa
    return BOS;
  };
}
// Pıtrak: dört kollu haç, kol uçlarında merkeze kıvrılan çapalar, köşegenlerde noktalar
const pitrak = (R, A, B, C = B) => (dx, dy) => {
  const ax = Math.abs(dx), ay = Math.abs(dy), m = ax + ay;
  if (m <= 2) return B;
  if (m <= 6) return A;
  const kol = (u, v) => (u <= 1 && v <= R) || (v > R - 2 && v <= R && u <= 5) || (u > 3 && u <= 5 && v > R - 6 && v <= R);
  if (kol(ax, ay) || kol(ay, ax)) return A;
  if (Math.abs(ax - 7) + Math.abs(ay - 7) <= 2) return C;
  return BOS;
};
// Muska (üçgen tılsım): v ucundan tabanına (taban dışa), tabanından üç püskül sarkar
const muska = (Hm, [dis, ara, orta, ic, goz1]) => (dx, v) => {
  const ax = Math.abs(dx);
  if (v >= 0 && v <= Hm && ax <= v) {
    const e = Math.min(v - ax, Hm - v);
    if (e < 3) return dis;
    if (e < 5) return ara;
    if (e < 9) return orta;
    const g = Math.abs(dx) + Math.abs(v - Hm * 0.62);
    if (g <= 3) return goz1;
    if (g <= 5) return dis;
    return ic;
  }
  // püsküller: tabanın üç yerinden dışa doğru ip ve ucunda küçük baklava
  const pv = v - Hm;
  for (const px of [0, Math.round(Hm * 0.55)]) {
    const qx = Math.abs(ax - px);
    if (pv > 0 && pv <= 4 && qx <= 1) return dis;
    if (qx + Math.abs(pv - 6) <= 2) return ara;
  }
  return BOS;
};
// Küpe: halka, sap, ortasında noktalı baklava, altında üç sarkaç. v: yukarı (halka tarafı)
const kupe = ([A, B, C]) => (dx, v) => {
  const ax = Math.abs(dx);
  const halka = ax + Math.abs(v - 12);
  if (halka <= 3 && halka > 1) return A;
  if (ax <= 1 && v > 6 && v <= 10) return A;
  const b = ax + Math.abs(v - 1);
  if (b <= 2) return C;
  if (b <= 6) return B;
  for (const px of [0, 4]) if (Math.abs(ax - px) <= 0.5 && v < -4 && v >= -8 - (px ? 0 : 2)) return A;
  if (Math.abs(ax - 4) + Math.abs(v + 9.5) <= 1.5 || ax + Math.abs(v + 11.5) <= 1.5) return C;
  return BOS;
};
// Kurt izi: ortada küçük baklava, köşegenlerde dört pençe (basamaklı) ve pençe uçlarında tırnaklar
const kurtIzi = ([A, B]) => (dx, dy) => {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax + ay <= 1) return B;
  if (ax + ay <= 3) return A;
  const p = Math.abs(ax - 4) + Math.abs(ay - 4);
  if (p <= 1) return B;
  if (p <= 2.5) return A;
  if ((ax === 6 && ay <= 3 && ay >= 2) || (ay === 6 && ax <= 3 && ax >= 2) || (ax === 6 && ay === 6)) return A;
  return BOS;
};

// ---- desen ızgarası ----
// W × H hücre (W uzun kenar). Yalnız sol-üst çeyrek çizilir, sonra iki eksende aynalanır (simetri kendiliğinden).
function desenKur(W, H) {
  const g = new Uint8Array(W * H).fill(KIR);
  const koy = (i, j, c) => { if (c >= 0 && i >= 0 && j >= 0 && i < W && j < H) g[j * W + i] = c; };
  // (cx, cy) merkezli, ±rx × ±ry kutuda f(dx, dy); maske(i, j) false ise o hücreye dokunmaz
  const motif = (cx, cy, rx, ry, f, maske) => {
    for (let j = Math.floor(cy - ry); j < Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i < Math.ceil(cx + rx); i++) {
      if (maske && !maske(i, j)) continue;
      koy(i, j, f(i + 0.5 - cx, j + 0.5 - cy));
    }
  };
  // Çerçeve: kenar örgüsü (uzun kenarlar), baş (kısa kenarlar), halkalar (iç dikdörtgenden uzaklık r)
  const KENAR = 3, BAS = 10;
  const BAS_SERIT = [KAH, KAH, KIR, KIR, KIR, LAC, KRM, LAC, KIR, KIR];
  const R = { su1: 1, cizgi1: 10, ana: 11, cizgi2: 47, su2: 48, cizgi3: 56, zemin: 57 };
  const ANA = R.cizgi2 - R.ana; // ana bordür genişliği (36)
  const w = W - 2 * BAS, h = H - 2 * KENAR;
  // Su yolu: zemin üstünde 45° zikzak; dişlerin içinde nokta
  const zikzak = (s, t, n, [zemin, cizgi, nokta]) => {
    const A = (n - 3) / 2, P = 4 * A, u = s / P;
    const z = A * (4 * Math.abs(u - Math.round(u)) - 1);
    const tc = t + 0.5 - n / 2;
    if (Math.abs(tc - z) <= 1) return cizgi;
    const ds = s - Math.round(s / (P / 2)) * (P / 2), tepe = Math.round(s / (P / 2)) % 2 === 0 ? 1 : -1;
    if (nokta >= 0 && Math.abs(ds) <= 1 && Math.abs(tc - tepe * (A - 0.5)) <= 0.5 + (n % 2 ? 0 : 0.5)) return nokta;
    return zemin;
  };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ey = Math.min(j, H - 1 - j), ex = Math.min(i, W - 1 - i);
    if (ey < KENAR) { koy(i, j, KAH); continue; }
    if (ex < BAS) { koy(i, j, BAS_SERIT[ex]); continue; }
    const x = i - BAS, y = j - KENAR;
    const rx = Math.min(x, w - 1 - x), ry = Math.min(y, h - 1 - y), r = Math.min(rx, ry);
    if (r >= R.zemin) continue;
    const s = ry <= rx ? x + 0.5 - w / 2 : y + 0.5 - h / 2;
    let c = KAH;
    if (r >= R.su1 && r < R.cizgi1) c = zikzak(s, r - R.su1, R.cizgi1 - R.su1, [LAC, KRM, KIR]);
    else if (r >= R.ana && r < R.cizgi2) c = KRM;
    else if (r >= R.su2 && r < R.cizgi3) c = zikzak(s, r - R.su2, R.cizgi3 - R.su2, [LAC, SAR, BOS]);
    koy(i, j, c);
  }
  // Ana bordür: koçboynuzu kanatlı, içi yıldızlı baklavalar (renkler sırayla); köşelerde göz
  const kanat = kocboynuzu(4, 2, 2, 0); // baklavanın uçlarında koçboynuzu kanat (bordür boyunca dışa)
  const bordurBaklava = (A, B, C, D) => (ds, dt) => {
    const as = Math.abs(ds), at = Math.abs(dt), m = as + at;
    if (m <= 14) {
      if (m > 11) return A;
      if (m > 9) return KRM;
      if (m <= 2) return D;
      if (yildizIci(as, at, 4)) return C;
      return B;
    }
    return kanat(at, as - 14) >= 0 ? A : BOS;
  };
  const bordurRenk = (k) => (k % 2 ? [LAC, KIR, KRM, LAC] : [KIR, LAC, SAR, KIR]);
  const ortaT = R.ana + ANA / 2; // bant ortası (halka uzaklığı)
  {
    // sıra: köşe kareleri arasındaki boya tek sayıda baklava (ortadaki eksende), aralık 42–50 hücre
    const sira = (boy) => {
      let n = 2 * Math.round((boy / 46 - 1) / 2) + 1;
      while (n > 1 && boy / n < 42) n -= 2;
      return [Math.max(1, n), Math.min(50, Math.floor(boy / Math.max(1, n)))];
    };
    const jc = KENAR + ortaT, [n, P] = sira(W - 2 * (BAS + R.ana + ANA));
    for (let k = 0; k < n; k++) motif(W / 2 + (k - (n - 1) / 2) * P, jc, 21, 17, bordurBaklava(...bordurRenk(k)));
    const ic = BAS + ortaT, [n2, P2] = sira(H - 2 * (KENAR + R.ana + ANA));
    for (let k = 0; k < n2; k++) motif(ic, H / 2 + (k - (n2 - 1) / 2) * P2, 17, 21, (dx, dy) => bordurBaklava(...bordurRenk(k + 1))(dy, dx));
    // köşe gözü
    motif(BAS + ortaT, KENAR + ortaT, 17, 17, goz([KIR, SAR, LAC, KRM, KIR, KRM, LAC, KAH], 2));
  }
  // Zemin ve göller
  const Z = { x0: BAS + R.zemin, y0: KENAR + R.zemin };
  const FX = W / 2 - Z.x0, FY = H / 2 - Z.y0;           // zeminin yarı boyları (hücre)
  const b = FY - 8, bosluk = 18, pay = 15;
  // göl yarı boyu: üç göl zemini boyuna doldursun; uzun yolluk kilimde ucu kenara taşmasın (o zaman göller açılır)
  const a = Math.min(Math.floor((2 * FX - 2 * bosluk - 2 * pay) / 6), b - 40), D = FX - pay - a;
  const hh = Math.max(8, b - a);                          // göl düz kenarının yarı boyu
  const golD = (ax, ay) => Math.max(ax - a, ax + ay - (hh + a)); // ≤ 0: gölün içi (b = hh + a)
  const bb = hh + a;
  const GOL = [
    { cx: W / 2, govde: LAC, bant: SAR, oz: KIR, ic: () => BOS }, // özü aynalamadan sonra (figür dik durur)
    { cx: W / 2 - D, govde: LAC, bant: YES, oz: KRM, ic: null },
  ];
  // dış göllerin özü: ortada yıldız, iki yanda koçboynuzu, uçlara doğru göz ve küçük yıldız
  const yil = yildiz(14, [LAC, KIR, KRM, SAR], 4);
  const koc = kocboynuzu(9, 3, 6, KIR, SAR);
  const gz = goz([SAR, LAC, KRM, KIR, LAC], 2);
  const kyil = yildiz(5, [TUR, SAR], 3);
  GOL[1].ic = (dx, dy) => {
    const ay = Math.abs(dy);
    for (const f of [yil(dx, dy), koc(dx, ay - 20), gz(dx, ay - 50), kyil(dx, ay - 72)]) if (f >= 0) return f;
    return BOS;
  };
  // gölün kenar kancaları (eğik kenarlarda): kenardan dışa çıkan sap, uçta göle değmeyen kıvrım
  const kanca = (ax, ay) => {
    for (let c = a - 6; c >= 6; c -= 12) {
      const e = bb - c;
      const sap = (ax === c - 0.5 || ax === c + 0.5) && ay > bb - ax && ay <= e + 4.5;
      const ust = ay >= e + 3.5 && ay <= e + 4.5 && ax > c && ax <= c + 4;
      const in_ = ay === e + 2.5 && ax > c + 2 && ax <= c + 4;
      if (sap || ust || in_) return true;
    }
    // uçta T biçimli tepelik, kolları geri kıvrık
    if (ax <= 1 && ay > bb && ay <= bb + 4) return true;
    if (ay > bb + 2 && ay <= bb + 4 && ax <= 4) return true;
    if (ax > 3 && ax <= 4 && ay > bb + 0.5 && ay <= bb + 2) return true;
    return false;
  };
  for (const G of GOL) {
    const cy = H / 2;
    motif(G.cx, cy, a + 6, bb + 6, (dx, dy) => {
      const ax = Math.abs(dx), ay = Math.abs(dy), d = golD(ax, ay);
      if (d > 0) return kanca(ax, ay) ? KRM : BOS;
      if (d > -3) return KRM;
      if (d > -4) return KAH;
      if (d > -18) {
        // gövdede göz noktaları: düz kenarın ortasında ve uçlarda
        if (Math.abs(ax - (a - 11)) + ay <= 4) return Math.abs(ax - (a - 11)) + ay <= 2 ? SAR : KRM;
        if (ax + Math.abs(ay - (bb - 11)) <= 4) return ax + Math.abs(ay - (bb - 11)) <= 2 ? SAR : KRM;
        return G.govde;
      }
      if (d > -21) return G.bant;
      if (d > -22) return G.oz;
      const f = G.ic(dx, dy);
      return f >= 0 ? f : G.oz;
    });
  }
  // Dolgu motifleri (sol üst çeyrek; aynalanınca dörde çıkar)
  const ortaX = W / 2 - D / 2, gx1 = W / 2 - D;           // göller arası koridorun ortası, dış gölün merkezi
  // göller arasında muska (V boşluğu: tabanı kenarda, ucu merkeze)
  const alan = (i, j) => i >= Z.x0 && j >= Z.y0 && i < W - Z.x0 && j < H - Z.y0;
  const muskaUc = H / 2 - hh - 10, muskaH = muskaUc - (Z.y0 + 11);
  if (muskaH > 12) motif(ortaX, muskaUc - muskaH / 2, muskaH + 2, muskaH / 2 + 10, (dx, dy) => muska(muskaH, [LAC, KRM, KIR, SAR, LAC])(dx, -(dy - muskaH / 2)), alan);
  // koridorda göz ve küpe
  motif(ortaX, H / 2, 9, 9, goz([KRM, LAC, SAR, LAC], 2), alan);
  if (hh >= 46) motif(ortaX, H / 2 - 30, 9, 16, (dx, dy) => kupe([SAR, TUR, KRM])(dx, -dy), alan);
  // uç koridorda kurt izi ve göz
  const ucX = Z.x0 + (gx1 - a - Z.x0) / 2;
  motif(ucX, H / 2, 8, 8, kurtIzi([KRM, LAC]), alan);
  motif(ucX, H / 2 - 28, 7, 7, goz([SAR, LAC, KRM], 2), alan);
  // köşelerde pıtrak
  const pr = 16;
  motif(Z.x0 + pr + 3, Z.y0 + pr + 3, pr + 1, pr + 1, pitrak(pr, LAC, SAR, KRM), alan);
  // Aynala: sol yarı → sağ, üst yarı → alt
  for (let j = 0; j < H / 2; j++) for (let i = W / 2; i < W; i++) g[j * W + i] = g[j * W + W - 1 - i];
  for (let j = H / 2; j < H; j++) for (let i = 0; i < W; i++) g[j * W + i] = g[(H - 1 - j) * W + i];
  // Orta gölün özünde dik duran elibelinde; başının üstünde küçük yıldız, ayaklarının altında göz
  {
    const fig = elibelinde(), ust = yildiz(5, [TUR, SAR], 3), alt = goz([LAC, SAR, KRM, LAC], 2);
    motif(W / 2, H / 2, a, bb, (dx, dy) => {
      if (golD(Math.abs(dx), Math.abs(dy)) > -23) return BOS;
      const X = dx, Y = -dy;
      for (const f of [fig(X, Y + 12), ust(X, Y - 66), alt(X, Y + 66)]) if (f >= 0) return f;
      return BOS;
    });
  }
  // Nazarlık: sağ alt köşedeki pıtrağın gözü yeşil (dokuyucunun bilerek bıraktığı tek kusur)
  motif(W - 1 - (Z.x0 + pr + 3) + 1, H - 1 - (Z.y0 + pr + 3) + 1, 3, 3, (dx, dy) => (Math.abs(dx) + Math.abs(dy) <= 2 ? YES : BOS));
  return g;
}

// Abraş bandı: x boyunca (atkı sıraları) parça parça sabit, sınırda yumuşak geçişli ton çarpanı [r, g, b]
function abrasBandi(W, r, [parlak, sicak]) {
  const out = new Float32Array(W * 3);
  let i = 0, p = 1, s = 0;
  while (i < W) {
    const boy = 6 + Math.floor(r() * 48);
    const yeni = r() < 0.35 ? [1, 0] : [1 + (r() - 0.55) * 2 * parlak, (r() - 0.5) * 2 * sicak];
    for (let k = 0; k < boy && i < W; k++, i++) {
      const t = Math.min(1, k / 2); // iki hücrede geçiş
      const pp = p + (yeni[0] - p) * t, ss = s + (yeni[1] - s) * t;
      out[i * 3] = pp * (1 + ss); out[i * 3 + 1] = pp; out[i * 3 + 2] = pp * (1 - ss);
    }
    [p, s] = yeni;
  }
  return out;
}

// Desen + dokuma → renk ve normal kanvasları
function dokuUret({ en, boy, seed }) {
  // Basamak 3200 × 2200'de 6,25 mm; başka ölçüde desen orantılı büyür / küçülür (çerçeve ve göller sığsın)
  const hucre = HUCRE * Math.min(en / 3200, boy / 2200);
  const W = 2 * Math.round(en / hucre / 2), H = 2 * Math.round(boy / hucre / 2);
  const PX = Math.max(1, Math.floor(DOKU_MAKS / Math.max(W, H)));
  const g = desenKur(W, H), r = rnd(seed);
  const CW = W * PX, CH = H * PX;
  const abras = ABRAS.map((a) => abrasBandi(W, r, a));
  const atki = Float32Array.from({ length: CW }, () => 1 + (r() - 0.5) * 0.07);   // her piksel sütunu bir atkı demeti
  // ipin boyunca kalınlık / büküm farkı (çizgisel çizgiler): sinüs tablosundan, sütun başına faz
  const SIN = Float32Array.from({ length: 1024 }, (_, i) => Math.sin(i * Math.PI / 512));
  const faz1 = Uint16Array.from({ length: CW }, () => (r() * 1024) | 0), faz2 = Uint16Array.from({ length: CW }, () => (r() * 1024) | 0);
  // solma: geniş alanlarda hafif açık-koyu (ayrık: satır × sütun)
  const fa = r() * 6.28, fb = r() * 6.28;
  const SX = Float32Array.from({ length: CW }, (_, x) => Math.sin(x * 0.011 + fa)), SY = Float32Array.from({ length: CH }, (_, y) => Math.sin(y * 0.017 + fb));
  const SX2 = Float32Array.from({ length: CW }, (_, x) => Math.sin(x * 0.004 + fb)), SY2 = Float32Array.from({ length: CH }, (_, y) => Math.sin(y * 0.006 + fa));
  const [c, k] = kanvas(CW, CH);
  const img = k.createImageData(CW, CH), d = img.data;
  for (let py = 0; py < CH; py++) {
    const j = (py / PX) | 0, cizgi1 = py * 18, cizgi2 = py * 4;
    for (let px = 0; px < CW; px++) {
      const i = (px / PX) | 0, ci = g[j * W + i], R0 = PALET[ci], A = abras[ci];
      // atkı yüzlü bezayağı: atkı çözgünün bir üstünden bir altından geçer (komşu atkıda kaydırmalı): 2 piksellik dama
      const ortu = ((px + (py >> 1)) & 1) ? 0.955 : 1.02;
      const f = atki[px] * (1 + 0.035 * SIN[(cizgi1 + faz1[px]) & 1023] * SIN[(cizgi2 + faz2[px]) & 1023]) * ortu
        * (1 + 0.025 * SX[px] * SY[py] + 0.02 * SX2[px] * SY2[py]) * (1 + (r() - 0.5) * 0.08);
      const o = (py * CW + px) * 4;
      d[o] = R0[0] * A[i * 3] * f; d[o + 1] = R0[1] * A[i * 3 + 1] * f; d[o + 2] = R0[2] * A[i * 3 + 2] * f; d[o + 3] = 255;
    }
  }
  // Renk sınırları (çözgü yönünde, x boyunca): kısa sınırda yarık (koyu ince çizgi), uzun sınırda kenetli dişler
  const yukseklik = new Float32Array(CW * CH);
  const koyu = (px, py, f) => { const o = (py * CW + px) * 4; d[o] *= f; d[o + 1] *= f; d[o + 2] *= f; yukseklik[py * CW + px] -= (1 - f) * 1.2; };
  for (let j = 0; j < H - 1; j++) {
    let i = 0;
    while (i < W) {
      if (g[j * W + i] === g[(j + 1) * W + i]) { i++; continue; }
      let L = 0;
      while (i + L < W && g[j * W + i + L] !== g[(j + 1) * W + i + L]) L++;
      const py = (j + 1) * PX;
      if (L >= 2 && L <= 12) {
        for (let px = i * PX + 1; px < (i + L) * PX - 1; px++) { koyu(px, py - 1, 0.55); koyu(px, py, 0.62); }
      } else if (L > 12) {
        // kenetli: alt sıranın ilk pikseli dişli olarak üst rengi alır
        for (let px = i * PX; px < (i + L) * PX; px++) if (px % 4 < 2) {
          const o = ((py - 1) * CW + px) * 4, o2 = (py * CW + px) * 4;
          d[o2] = d[o] * 0.96; d[o2 + 1] = d[o + 1] * 0.96; d[o2 + 2] = d[o + 2] * 0.96;
        }
      }
      i += L;
    }
  }
  k.putImageData(img, 0, 0);
  // Normal haritası (dokuyla aynı çözünürlük): atkı sırtları (kısa kenara paralel), atkının çözgü üstünden geçtiği
  // kabarıklıklar (dama), yarıklar ve renk sınırlarında çukur, yün greni
  const NW = CW, NH = CH;
  const hy = new Float32Array(NW * NH);
  const sirt = Float32Array.from({ length: NW }, () => 0.45 + r() * 0.55);
  for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) {
    hy[y * NW + x] = sirt[x] * (((x + (y >> 1)) & 1) ? 0.62 : 1) + yukseklik[y * CW + x] + (r() - 0.5) * 0.18;
  }
  const [nc, nk] = kanvas(NW, NH);
  const nimg = nk.createImageData(NW, NH), nd = nimg.data, S = 0.9;
  for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) {
    const hx0 = hy[y * NW + Math.max(0, x - 1)], hx1 = hy[y * NW + Math.min(NW - 1, x + 1)];
    const hy0 = hy[Math.max(0, y - 1) * NW + x], hy1 = hy[Math.min(NH - 1, y + 1) * NW + x];
    let nx = -(hx1 - hx0) * S, ny = (hy1 - hy0) * S, nz = 1;
    const L = 1 / Math.sqrt(nx * nx + ny * ny + 1); nx *= L; ny *= L; nz = L;
    const o = (y * NW + x) * 4;
    nd[o] = (nx * 0.5 + 0.5) * 255; nd[o + 1] = (ny * 0.5 + 0.5) * 255; nd[o + 2] = (nz * 0.5 + 0.5) * 255; nd[o + 3] = 255;
  }
  nk.putImageData(nimg, 0, 0);
  return { renk: c, normal: nc, W, H, PX, hucre };
}

const dokuAyarla = (t, srgb) => {
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;              // eğik bakışta desen net kalsın (sürücünün sınırına indirilir)
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
};

// Kilimin renk dokusu (tek başına): CanvasTexture, u uzun kenar (x), v kısa kenar (y)
export function kilimDoku({ en = 3200, boy = 2200, seed = 23 } = {}) {
  const { renk, W, H, PX, hucre } = dokuUret({ en, boy, seed });
  const t = dokuAyarla(new THREE.CanvasTexture(renk), true);
  t.userData = { izgara: [W, H], hucre, pikselHucre: PX };
  return t;
}

// Kenar dalgası: uzun kenarlarda hafif bel ve dalga, kısa kenarlarda dalga, kenarda yer yer 1–2 mm kalkma
function kenarDalgasi(en, boy, r) {
  const p = Array.from({ length: 10 }, () => r() * Math.PI * 2);
  return (x, y) => {
    const ux = x / (en / 2), vy = y / (boy / 2);
    const wy = Math.abs(vy) ** 4, wx = Math.abs(ux) ** 4;
    const k = vy > 0 ? 0 : 1, kx = ux > 0 ? 0 : 1;
    const sy = Math.sign(vy) * (-9 * Math.cos(ux * Math.PI / 2) + 6 * Math.sin(x / 260 + p[k]) + 2.5 * Math.sin(x / 97 + p[2 + k]));
    const sx = Math.sign(ux) * (5 * Math.sin(y / 210 + p[4 + kx]) + 2 * Math.sin(y / 83 + p[6 + kx]));
    const dz = 1.4 * Math.max(0, Math.sin(x / 300 + p[8 + k])) * wy + 0.9 * Math.max(0, Math.sin(y / 240 + p[8 + kx])) * wx;
    return [sx * wx, sy * wy, dz];
  };
}

// Püsküller: kısa kenarlarda çözgü uçları demet demet düğümlenir; düğümden sonra ipler yere serilir
function puskulGeo(en, boy, kay, r) {
  const pos = [], nor = [], col = [], idx = [];
  const renk = new THREE.Color();
  const ekle = (x, y, z, nx, ny, nz, c) => { pos.push(x, y, z); nor.push(nx, ny, nz); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
  // şerit: yerde yatan ip (genişlik boyunca normaller yana eğik: yuvarlak görünür)
  const serit = (pts, gen, c) => {
    const n0 = pos.length / 3;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
      const nx = -ty, ny = tx, w = gen[k] / 2, [x, y, z] = pts[k];
      ekle(x + nx * w, y + ny * w, z, nx * 0.55, ny * 0.55, 0.83, c);
      ekle(x - nx * w, y - ny * w, z, -nx * 0.55, -ny * 0.55, 0.83, c);
    }
    for (let k = 0; k < pts.length - 1; k++) { const a = n0 + 2 * k; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  };
  const kure = new THREE.SphereGeometry(1, 8, 5);
  const kp = kure.attributes.position, kn = kure.attributes.normal, ki = kure.index.array;
  const dugum = (x, y, z, rx, ry, rz, yon, c) => {
    const n0 = pos.length / 3, cs = Math.cos(yon), sn = Math.sin(yon);
    for (let v = 0; v < kp.count; v++) {
      const lx = kp.getX(v) * rx, ly = kp.getY(v) * ry, lz = kp.getZ(v) * rz;
      const mx = kn.getX(v) / rx, my = kn.getY(v) / ry, mz = kn.getZ(v) / rz, ml = Math.hypot(mx, my, mz);
      ekle(x + lx * cs - ly * sn, y + lx * sn + ly * cs, z + lz, (mx * cs - my * sn) / ml, (mx * sn + my * cs) / ml, mz / ml, c);
    }
    for (let v = 0; v < ki.length; v++) idx.push(n0 + ki[v]);
  };
  const n = Math.round(boy / 34);
  for (const s of [-1, 1]) for (let q = 0; q < n; q++) {
    const y0 = -boy / 2 + (q + 0.5) * boy / n + (r() - 0.5) * 3;
    const [dx, dy, dz] = kay(s * en / 2, y0);
    const xe = s * en / 2 + dx, ye = y0 + dy, ze = KALIN * 0.5 + dz;
    const ton = 0.9 + r() * 0.12;
    renk.setRGB(0.82 * ton, 0.76 * ton, 0.64 * ton, THREE.SRGBColorSpace);
    const yon = (r() - 0.5) * 0.14;                      // demetin dışa açısı
    const ux = s * Math.cos(yon), uy = Math.sin(yon);
    const at = (u, v, z) => [xe + ux * u - uy * v * s, ye + uy * u + ux * v * s, z];
    const Lk = 15 + r() * 7;
    serit([at(-10, 0, ze), at(0, 0, ze), at(Lk * 0.6, 0, 3.4), at(Lk, 0, 3.0)], [16, 14, 10, 8], renk);
    dugum(...at(Lk + 3.5, 0, 3.2), 7, 6.5, 3.4, Math.atan2(uy, ux), renk);
    const m = 5 + (r() < 0.4 ? 1 : 0);
    for (let k = 0; k < m; k++) {
      const aci = (k - (m - 1) / 2) * 0.12 + (r() - 0.5) * 0.12, L = 55 + r() * 40, egri = (r() - 0.5) * 16;
      const c2 = renk.clone().multiplyScalar(0.94 + r() * 0.1);
      const pts = [], dal = r() * 6.28, gen = [];
      for (let t = 0; t <= 6; t++) {   // gevşek ip: hafif kıvrımlı, uca doğru incelir
        const f = t / 6, u = Lk + 6 + f * L * Math.cos(aci), v = f * L * Math.sin(aci) + egri * f * f + 2.2 * f * Math.sin(f * 13 + dal);
        pts.push(at(u, v, 2.6 - 1.6 * f)); gen.push(3.8 - 1.3 * f);
      }
      serit(pts, gen, c2);
    }
  }
  kure.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

// Kilim: gövde (üst yüz desenli, yanlar kenar örgüsü rengi), püsküller, kenarda ince temas gölgesi.
// Merkez orijinde, alt yüzü z = 0, uzun kenar x ekseninde; ışın atma kapalı.
export function kilim({ en = 3200, boy = 2200, seed = 23 } = {}) {
  const r = rnd(seed * 7 + 1);
  const kay = kenarDalgasi(en, boy, r);
  const { renk, normal } = dokuUret({ en, boy, seed });
  const map = dokuAyarla(new THREE.CanvasTexture(renk), true);
  const nmap = dokuAyarla(new THREE.CanvasTexture(normal), false);
  const ust = new THREE.MeshStandardMaterial({ map, normalMap: nmap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 1, metalness: 0 });
  const yanMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...PALET[KAH].map((v) => v / 255), THREE.SRGBColorSpace), roughness: 1 });

  // üst yüz: ızgara (kenar dalgası ve hafif kabarıklık), UV kaymadan (desen kenarla birlikte dalgalanır)
  const nx = Math.round(en / 50), ny = Math.round(boy / 50);
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny, x = (u - 0.5) * en, y = (v - 0.5) * boy, [dx, dy, dz] = kay(x, y);
    pos.push(x + dx, y + dy, KALIN + dz); uv.push(u, v);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b2 = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, b2, d, a, d, c);
  }
  const ustGeo = new THREE.BufferGeometry();
  ustGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ustGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  ustGeo.setIndex(idx);
  ustGeo.computeVertexNormals();
  // yanlar ve temas gölgesi: üst yüzün çevresi (yukarıdan bakınca saat yönünün tersine)
  const cevre = [];
  for (let i = 0; i <= nx; i++) cevre.push(i);
  for (let j = 1; j <= ny; j++) cevre.push(j * (nx + 1) + nx);
  for (let i = nx - 1; i >= 0; i--) cevre.push(ny * (nx + 1) + i);
  for (let j = ny - 1; j >= 1; j--) cevre.push(j * (nx + 1));
  const P = (k) => [pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]];
  // yanlar: üst köşede normal yukarı eğik (sarılmış kenar örgüsü yuvarlak görünür), altta dışa
  const yp = [], yn = [], gp = [], gc = [];
  const disa = (q) => {
    const A = P(cevre[(q - 1 + cevre.length) % cevre.length]), C = P(cevre[(q + 1) % cevre.length]);
    const tx = C[0] - A[0], ty = C[1] - A[1], L = Math.hypot(tx, ty);
    return [ty / L, -tx / L];
  };
  for (let q = 0; q < cevre.length; q++) {
    const q2 = (q + 1) % cevre.length, A = P(cevre[q]), B = P(cevre[q2]), [ax, ay] = disa(q), [bx, by] = disa(q2);
    yp.push(A[0], A[1], 0, B[0], B[1], 0, B[0], B[1], B[2], A[0], A[1], 0, B[0], B[1], B[2], A[0], A[1], A[2]);
    yn.push(ax, ay, 0, bx, by, 0, bx * 0.6, by * 0.6, 0.8, ax, ay, 0, bx * 0.6, by * 0.6, 0.8, ax * 0.6, ay * 0.6, 0.8);
  }
  const yanGeo = new THREE.BufferGeometry();
  yanGeo.setAttribute('position', new THREE.Float32BufferAttribute(yp, 3));
  yanGeo.setAttribute('normal', new THREE.Float32BufferAttribute(yn, 3));
  // temas gölgesi: kenarın 3 mm içinden 14 mm dışına koyulaşan (siyah, saydamlığı azalan) şerit
  for (let q = 0; q < cevre.length; q++) {
    const A = P(cevre[(q - 1 + cevre.length) % cevre.length]), B = P(cevre[q]), C = P(cevre[(q + 1) % cevre.length]);
    let tx = C[0] - A[0], ty = C[1] - A[1]; const L = Math.hypot(tx, ty); tx /= L; ty /= L;
    const ox = ty, oy = -tx; // dışa
    gp.push(B[0] - ox * 3, B[1] - oy * 3, 0.35, B[0] + ox * 14, B[1] + oy * 14, 0.35);
    gc.push(0, 0, 0, 0.42, 0, 0, 0, 0);
  }
  const gi = [];
  for (let q = 0; q < cevre.length; q++) { const a = 2 * q, b2 = 2 * ((q + 1) % cevre.length); gi.push(a, b2 + 1, b2, a, a + 1, b2 + 1); }
  const golgeGeo = new THREE.BufferGeometry();
  golgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  golgeGeo.setAttribute('color', new THREE.Float32BufferAttribute(gc, 4));
  golgeGeo.setIndex(gi);

  const g = new THREE.Group();
  g.name = 'kilim';
  const govde = new THREE.Mesh(ustGeo, ust);
  const yan = new THREE.Mesh(yanGeo, yanMat);
  const puskul = new THREE.Mesh(puskulGeo(en, boy, kay, r),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
  const golge = new THREE.Mesh(golgeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  golge.renderOrder = -1;
  for (const m of [govde, yan, puskul]) m.receiveShadow = true;
  g.add(golge, govde, yan, puskul);
  g.traverse((o) => { o.raycast = () => {}; });
  g.userData.olcu = { en, boy, kalin: KALIN };
  return g;
}
