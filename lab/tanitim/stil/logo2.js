// Logo inşası (stil denemesi, M2 · logo2; ≈6 sn akış + 1 sn bekleme, 60 fps).
// Önceki deneme (logo.js) bütün çizimi bütün parça grubuna nokta nokta biçim dönüştürüyordu: ara karelerde karalama,
// "yapay zekâ karıştırmış" hissi. Burada biçim dönüşümü yok, YAPIM var:
//   1. Kenarlarda 8 düşünce balonu (sahipleri kadraj dışında, noktalar kenara gider). İçlerinde düz çizgilerden kurulu
//      doodle'lar: QR masa standı, bölmeli vida organizeri, gül ve laleli saksı, d20, piyon, yapboz parçası, oyun kutusu,
//      Wi-Fi levhası. Çizgilerin uçları köşeden hafifçe taşar (mimar eskizi): çizim baştan ayrı çizgilerden okunur.
//   2. Sırası gelen balon söner (kontur noktalara ayrılır, noktalar küçülür); çizim eklemlerinden ayrılır (patlatılmış
//      görünüş), çizgiler yerinde süzülür ve sırası gelen çizgi kalkar.
//   3. Logo 29 dışbükey parçadır (logo-veri.js). Parça kenarları aynı doğru üstünde birleşen "çubuklar"a toplanır:
//      paylaşılan kenar bir kez gelir, uzun doğru birkaç parçanın kenarını birden taşır (iskele çizgisi). Çizgi sayısı
//      çubuk sayısını aşarsa en uzun çubuklar (aynalı çift birlikte) bir T-eklemden ya da ortadan ikiye bölünür.
//   4. Atama (Macar algoritması): maliyet = yol + açı farkı + boy oranı + balonun zaman öbeği. Yakın ve benzer çizgi benzer
//      kenara gider; bir balonun çizgileri birbirine yakın zamanlarda kalkar (balon dalga dalga hasat edilir).
//   5. Uçuş: çizgi kimliğini korur; uzaktayken el çizimi kaynar ve kavisi durur, yaklaştıkça doğrulur, kaynama söner
//      (el çizimi → kesin çizgi). Döner, boyu uzar, kenara parçanın dışından dikine yaklaşır, hafifçe taşar ve oturur;
//      boyu biraz kısa gelir (en çok %12), değince uçları eklemlere uzanır. Başka çubukla buluştuğu eklemde küçük kaynak noktası atar.
//   6. Parça bütün kenarları gelince kapanır; mürekkep kenarlardan içe dolar (9 kare), sonra kenar çizgisi incelir ve
//      logo kenarına oturur. İki komşu da dolunca aralarında ince dikiş kalır.
//   7. Sıra montaj gibi okunur, dıştan içe: önce motifler ayrı ayrı kurulur (köşe kancaları, yan kancalar, alt kancalar),
//      sonra çarpı hepsini birbirine bağlar, en son üst halka; aynalı çiftler aynı karede. Son parça halkanın içindeki küçük
//      karo (kaynak noktaları vurgu renginde: filmdeki tek vurgu). Kenardaki balonlar sırayla hasat edilir, akış yönü
//      zamanla değişir (yanlardan, alttan, üstten).
//   8. Son: dikişler kaybolur (tek logo yoluna geçilir), %2 "tık", logo ortada kalır; "OKTOS" harf harf. Altında slogan
//      için bir satır boş (slogan ayrı denemede).
// Bütün durum karenin saf işlevi: tanitim.kare(t) her anı baştan kurar (sırayla ilerletmek gerekmez).
// Kaynama 8 fps / 4 çizim (logo.js ile aynı).
// Sorgu: ?yon=yatay|dikey ?t=2.4 (kareyi dondur) ?hiz=0.5 ?sayac=0 ?cek=1 (scripts/film-cek.py, scripts/film-kare.py)
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';
import { LOGO_D, LOGO_ORTA, LOGO_EKSEN, PARCA } from './logo-veri.js';

gsap.registerPlugin(CustomEase);
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const FPS = 60;
const NS = 'http://www.w3.org/2000/svg';
const M = '#1d1d20', BALON = '#fbf9f5', KAGIT = '#f1ede6', VURGU = '#bf5519';

// ---------- Eğriler
const EO = CustomEase.create('EO', '0.16,1,0.3,1'); // yavaşlayarak oturur (film.js ile aynı)
const EI = CustomEase.create('EI', '0.7,0,0.84,0'); // çıkış
const P2I = gsap.parseEase('power2.in'), P2O = gsap.parseEase('power2.out'), P2IO = gsap.parseEase('power2.inOut');
const GERI = gsap.parseEase('back.out(1.7)'), GERI12 = gsap.parseEase('back.out(1.2)'), GERI3 = gsap.parseEase('back.out(3)');

// ---------- Yerleşim (balon: çizim, merkez c, kaynak = kadraj dışındaki sahibin başı, o = balon boy çarpanı [x, y])
const D = DIKEY ? {
  logo: { cx: 540, cy: 840, s: 1.3 },
  ad: { top: 1196, boyut: 176 },
  br: [172, 120], dol: [0.68, 0.7], kontur: 5.5, cizgi: 4.2, ince: 3.4, nokta: 1.1, olcu: 1.25,
  balon: [
    { cizim: 'zar', c: [300, 215], kaynak: [-80, 70], o: [1, 1] },
    { cizim: 'wifi', c: [800, 265], kaynak: [1160, 170], o: [0.78, 0.8] },
    { cizim: 'qr', c: [200, 690], kaynak: [-60, 860], o: [0.9, 1.05] },
    { cizim: 'saksi', c: [890, 725], kaynak: [1140, 560], o: [0.9, 1.1] },
    { cizim: 'organizer', c: [215, 1300], kaynak: [-60, 1480], o: [0.96, 0.9] },
    { cizim: 'kutu', c: [865, 1335], kaynak: [1140, 1150], o: [0.92, 0.98] },
    { cizim: 'piyon', c: [330, 1715], kaynak: [190, 2010], o: [0.95, 1.05] },
    { cizim: 'yapboz', c: [765, 1760], kaynak: [900, 2010], o: [1, 1] },
  ],
} : {
  logo: { cx: 960, cy: 412, s: 1.0 },
  ad: { top: 676, boyut: 132 },
  br: [150, 104], dol: [0.68, 0.7], kontur: 5, cizgi: 3.8, ince: 2.8, nokta: 0.9, olcu: 1,
  balon: [
    { cizim: 'zar', c: [690, 150], kaynak: [560, -90], o: [1, 1.05] },
    { cizim: 'wifi', c: [1240, 135], kaynak: [1380, -90], o: [0.8, 0.82] },
    { cizim: 'qr', c: [265, 300], kaynak: [-90, 200], o: [0.95, 1.12] },
    { cizim: 'saksi', c: [1655, 310], kaynak: [2010, 230], o: [0.95, 1.16] },
    { cizim: 'organizer', c: [255, 770], kaynak: [-90, 880], o: [1.05, 0.95] },
    { cizim: 'kutu', c: [1665, 760], kaynak: [2010, 870], o: [0.95, 1] },
    { cizim: 'piyon', c: [700, 935], kaynak: [560, 1170], o: [0.9, 1] },
    { cizim: 'yapboz', c: [1225, 930], kaynak: [1360, 1170], o: [1, 1] },
  ],
};
const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];

// ---------- Fikir çizimleri (birim; merkez 0,0, y aşağı). Her öğe BİR çizgi: 2 nokta düz, fazlası yumuşak eğri.
const yay = (cx, cy, rx, ry, a0, a1, n = 7) => Array.from({ length: n }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
});
const dortgen = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]];
const CIZIM = {
  // QR masa standı: levha, masa çizgisi, üç konum karesi (her kenar ayrı çizgi)
  qr: [
    ...dortgen(-0.32, -0.46, 0.32, 0.26),
    [[-0.46, 0.4], [0.46, 0.4]],
    [[-0.2, 0.26], [-0.28, 0.4]], [[0.2, 0.26], [0.28, 0.4]],
    ...dortgen(-0.24, -0.38, -0.07, -0.21), ...dortgen(0.07, -0.38, 0.24, -0.21), ...dortgen(-0.24, -0.04, -0.07, 0.13),
  ],
  // Bölmeli vida organizeri (üstten): çerçeve, üç bölme, iki vida (gövde + baş)
  organizer: [
    ...dortgen(-0.5, -0.26, 0.5, 0.26),
    [[-0.1, -0.26], [-0.1, 0.26]], [[0.24, -0.26], [0.24, 0.26]], [[-0.1, 0], [0.24, 0]],
    [[-0.41, -0.12], [-0.19, -0.12]], [[-0.41, -0.18], [-0.41, -0.06]],
    [[-0.39, 0.13], [-0.17, 0.13]], [[-0.39, 0.07], [-0.39, 0.19]],
  ],
  // Saksı: ağız bandı, gövde; lale (sap, çanak, taç uçları), gül (sap, dış kıvrım, iç kıvrım)
  saksi: [
    [[-0.27, 0], [0.27, 0]], [[-0.27, 0.1], [0.27, 0.1]], [[-0.27, 0], [-0.27, 0.1]], [[0.27, 0], [0.27, 0.1]],
    [[-0.22, 0.1], [-0.16, 0.5]], [[0.22, 0.1], [0.16, 0.5]], [[-0.16, 0.5], [0.16, 0.5]],
    [[0.07, 0], [0.1, -0.18], [0.13, -0.34]],
    [[0.0, -0.64], [-0.01, -0.47], [0.13, -0.34], [0.27, -0.47], [0.26, -0.64]],
    [[0.0, -0.64], [0.065, -0.52], [0.13, -0.68], [0.195, -0.52], [0.26, -0.64]],
    [[-0.05, 0], [-0.09, -0.14], [-0.16, -0.25]],
    yay(-0.17, -0.4, 0.15, 0.14, 110, 380, 9),
    yay(-0.165, -0.405, 0.065, 0.065, 300, 560, 7),
  ],
  // d20: dış altıgen, ön yüz üçgeni, komşu yüzlerin kenarları
  zar: (() => {
    const H = [[0, -0.5], [0.43, -0.25], [0.43, 0.25], [0, 0.5], [-0.43, 0.25], [-0.43, -0.25]];
    const T = [[0, -0.21], [0.25, 0.2], [-0.25, 0.2]];
    return [
      ...H.map((p, i) => [p, H[(i + 1) % 6]]),
      ...T.map((p, i) => [p, T[(i + 1) % 3]]),
      [T[0], H[5]], [T[0], H[1]], [T[1], H[1]], [T[1], H[3]], [T[2], H[3]], [T[2], H[5]],
    ];
  })(),
  // Masa oyunu piyonu: baş (iki yarım), yaka, gövde, taban
  piyon: [
    yay(0, -0.37, 0.13, 0.13, -90, -270, 7), yay(0, -0.37, 0.13, 0.13, -90, 90, 7),
    [[-0.14, -0.21], [0.14, -0.21]],
    [[-0.07, -0.21], [-0.08, 0.02], [-0.2, 0.24]], [[0.07, -0.21], [0.08, 0.02], [0.2, 0.24]],
    [[-0.28, 0.24], [0.28, 0.24]], [[-0.3, 0.4], [0.3, 0.4]], [[-0.28, 0.24], [-0.3, 0.4]], [[0.28, 0.24], [0.3, 0.4]],
  ],
  // Kalınlıklı yapboz parçası: üst ve sağ kenarda topuz, alt kenarda kalınlık
  yapboz: [
    [[-0.36, -0.28], [-0.1, -0.28]], [[-0.1, -0.28], [-0.15, -0.4], [-0.08, -0.5], [0.08, -0.5], [0.15, -0.4], [0.1, -0.28]], [[0.1, -0.28], [0.36, -0.28]],
    [[0.36, -0.28], [0.36, -0.08]], [[0.36, -0.08], [0.48, -0.13], [0.57, -0.06], [0.57, 0.06], [0.48, 0.13], [0.36, 0.08]], [[0.36, 0.08], [0.36, 0.32]],
    [[0.36, 0.32], [-0.36, 0.32]], [[-0.36, 0.32], [-0.36, -0.28]],
    [[-0.36, 0.32], [-0.29, 0.42]], [[-0.29, 0.42], [0.43, 0.42]], [[0.36, 0.32], [0.43, 0.42]],
  ],
  // Oyun kutusu: kutu (ön, üst, yan) ve kapak çizgisi
  kutu: [
    ...dortgen(-0.42, -0.12, 0.22, 0.36),
    [[-0.42, -0.12], [-0.22, -0.34]], [[-0.22, -0.34], [0.42, -0.34]], [[0.22, -0.12], [0.42, -0.34]],
    [[0.42, -0.34], [0.42, 0.14]], [[0.22, 0.36], [0.42, 0.14]],
    [[-0.42, 0.03], [0.22, 0.03]], [[0.22, 0.03], [0.42, -0.19]],
  ],
  // Wi-Fi levhası (küçük, ikincil): levha ve üç yay
  wifi: [
    ...dortgen(-0.36, -0.3, 0.36, 0.3),
    yay(0, 0.17, 0.08, 0.08, -140, -40, 5), yay(0, 0.17, 0.17, 0.17, -140, -40, 6), yay(0, 0.17, 0.26, 0.26, -140, -40, 7),
  ],
};

// ---------- Montaj sırası (dıştan içe: motifler, bağlayan çarpı, halka; aynalı çiftler aynı dilimde) ve zamanlama (kare)
const SIRA = [[21, 22], [27, 28], [15, 16], [7, 8], [11, 12], [3, 4], [25, 26], [23, 24], [19, 20], [17, 18], [13, 14], [9, 10], [5, 6], [0, 1], [2]];
const Z = {
  balonAra: 3, cizimGecikme: 10, cizgiAra: 2, cizgiSure: 7, // balon belirişi, çizimin çizilmesi
  enErkenSonme: 84,         // ilk balon sönmesi (çizimler ~1 sn okunur)
  sonmeOnce: 12,            // balonun sönmesi ile ilk çizginin kalkışı arası
  varisAra: 2, dilimAra: 3, // ardışık çubuk (çifti) varışı, dilimler arası
  kopma: 8,                 // çizginin kalkıştan önce çizimden kopuşu
  oturma: 4, dolum: 9, incelme: 8, sonNefes: 8, // parça kapanışı, mürekkep dolumu, kenar incelmesi, son parçadan önce
  dikis: 6, takasSonra: 6,  // dikişlerin sönmesi, yazı gecikmesi
  bekleme: 60,              // OKTOS bittikten sonra
};

// ---------- Yardımcılar
function rng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ara = (a, b, t) => a + (b - a) * t;
const kis = (x) => Math.max(0, Math.min(1, x));
const yumusak = (a, b, x) => { const t = kis((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const f1 = (v) => v.toFixed(1);
const uzak = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const aciSar = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; };
function el(ust, ad, nit = {}) {
  const e = document.createElementNS(NS, ad);
  for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v);
  ust.appendChild(e);
  return e;
}
const kutu = (pts) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return { x0: a, y0: b, x1: c, y1: d, en: c - a, boy: d - b }; };
const ov = (cx, cy, rx, ry, n = 14) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const olcekle = ([x, y], s) => `translate(${f1(x)} ${f1(y)}) scale(${s.toFixed(4)}) translate(${f1(-x)} ${f1(-y)})`;

// Catmull-Rom: seyrek noktalardan sık nokta
function sik(pts, adim = 10) {
  const n = pts.length, out = [];
  const P = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < adim; j++) {
      const t = j / adim, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((e) => 0.5 * (2 * p1[e] + (-p0[e] + p2[e]) * t + (2 * p0[e] - 5 * p1[e] + 4 * p2[e] - p3[e]) * t2 + (-p0[e] + 3 * p1[e] - 3 * p2[e] + p3[e]) * t3)));
    }
  }
  out.push(pts[n - 1]);
  return out;
}
// Yay uzunluğuyla yeniden örnekle (açık; uçlar dahil n nokta)
function ornekle(P, n) {
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + uzak(P[i - 1], P[i]));
  const L = cum[cum.length - 1], out = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const s = (L * i) / (n - 1);
    while (j < P.length - 1 && cum[j] < s) j++;
    const t = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
    out.push([ara(P[j - 1][0], P[j][0], t), ara(P[j - 1][1], P[j][1], t)]);
  }
  return out;
}
// Noktalardan yumuşak yol (Catmull-Rom → kübik Bézier), logo.js yolD ile aynı biçim
function yolD(v, kapali = false) {
  const n = v.length;
  if (n < 2) return '';
  const P = (i) => (kapali ? v[(i + n) % n] : v[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(v[0][0])} ${f1(v[0][1])}`;
  const son = kapali ? n : n - 1;
  for (let i = 0; i < son; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return kapali ? d + 'Z' : d;
}
const cokgenD = (poly) => 'M' + poly.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L') + 'Z';
// Dışbükey çokgenin iç teğet yarıçapı (yaklaşık; logo.js ile aynı)
function icYaricap(poly) {
  const kb = kutu(poly);
  let en = 0;
  for (let i = 1; i < 24; i++) for (let j = 1; j < 24; j++) {
    const p = [kb.x0 + (kb.en * i) / 24, kb.y0 + (kb.boy * j) / 24];
    let d = Infinity, ic = true;
    poly.forEach((a, n) => {
      const b = poly[(n + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey);
      const sd = (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) / L;
      d = Math.min(d, Math.abs(sd));
      if (n === 0) ic = sd; else if (Math.sign(sd) !== Math.sign(ic)) ic = false;
    });
    if (ic !== false) en = Math.max(en, d);
  }
  return en;
}
// Noktanın doğru parçasına uzaklığı ve parça üstündeki konumu (0..L)
function parcaUstu(p, a, b) {
  const ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey);
  const t = ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L;
  const d = Math.abs((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / L;
  return { t, d, L };
}
// Macar algoritması (kare maliyet matrisi, en küçük toplam): satır i → sütun
function macar(C) {
  const n = C.length, INF = 1e18;
  const u = new Float64Array(n + 1), v = new Float64Array(n + 1), p = new Int32Array(n + 1), yol = new Int32Array(n + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(n + 1).fill(INF), used = new Uint8Array(n + 1);
    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = INF, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) {
        const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; yol[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = yol[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const sonuc = new Array(n);
  for (let j = 1; j <= n; j++) sonuc[p[j] - 1] = j - 1;
  return sonuc;
}
// Kaynama: 8 fps, 4 çizim
const kaynaIndis = (f) => Math.floor((f / FPS) * 8) % 4;

// ---------- Sahne
const sahne = document.getElementById('sahne'), svg = document.getElementById('cizim'), yaziKat = document.getElementById('yazi');
const sayac = document.getElementById('sayac'), hataEl = document.getElementById('hata');
for (const e of [sahne, yaziKat]) Object.assign(e.style, { width: W + 'px', height: H + 'px' });
svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();
if (q.get('sayac') === '0' || CEKIM) sayac.hidden = true;

const tanim = el(svg, 'defs');
const balonKat = el(svg, 'g'), logoKap = el(svg, 'g'), dolguKat = el(logoKap, 'g'), dikisKat = el(logoKap, 'g');
const cizgiKat = el(svg, 'g'), kaynakKat = el(svg, 'g');
const logoYol = el(logoKap, 'path', { fill: M, 'fill-rule': 'evenodd', d: LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')) });

// ---------- Balon: tümsekli bulut (4 kaynama çizimi) + kenara giden 3 nokta. Sönme: kontur noktalara ayrılır.
function balonKur(B, sira) {
  const [cx, cy] = B.c, rx = D.br[0] * B.o[0], ry = D.br[1] * B.o[1];
  const g = el(balonKat, 'g');
  const yon = [B.kaynak[0] - cx, B.kaynak[1] - cy], yl = Math.hypot(...yon), u = [yon[0] / yl, yon[1] / yl];
  const ek = 1 / Math.hypot(u[0] / rx, u[1] / ry); // bulut kenarının kaynak yönündeki uzaklığı
  const noktalar = [[30, 15], [66, 11], [98, 8]].map(([d, r]) => [cx + u[0] * (ek + d * D.nokta), cy + u[1] * (ek + d * D.nokta), r * D.nokta]);
  const nk = noktalar.map(() => el(g, 'path', { fill: BALON, stroke: M, 'stroke-width': 4 }));
  const bg = el(g, 'g');
  const dolgu = el(bg, 'path', { fill: BALON });
  const kontur = el(bg, 'path', { fill: 'none', stroke: M, 'stroke-width': D.kontur, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1000 });
  const n = 11, rr = rng(sira * 17 + 5), wv = Array.from({ length: n }, () => 0.75 + rr() * 0.5), top = wv.reduce((a, b) => a + b, 0);
  const aci = [];
  let acc = 0;
  for (let i = 0; i < n; i++) { aci.push((acc / top) * Math.PI * 2 - Math.PI * 0.62); acc += wv[i]; }
  const cizimler = [0, 1, 2, 3].map((ki) => {
    const r = rng(sira * 911 + ki * 37), sp = () => (r() - 0.5) * 3.2;
    const P = (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    const N = (a) => { const x = Math.cos(a) / rx, y = Math.sin(a) / ry, l = Math.hypot(x, y); return [x / l, y / l]; };
    const uc = aci.map((a) => { const p = P(a); return [p[0] + sp(), p[1] + sp()]; });
    let d = `M${f1(uc[0][0])} ${f1(uc[0][1])}`;
    for (let i = 0; i < n; i++) {
      const a0 = aci[i], a1 = i + 1 < n ? aci[i + 1] : aci[0] + Math.PI * 2;
      const p0 = P(a0), p1 = P(a1), n0 = N(a0), n1 = N(a1), b = uzak(p0, p1) * 0.62;
      const c1 = [p0[0] + n0[0] * b + (p1[0] - p0[0]) * 0.08 + sp(), p0[1] + n0[1] * b + (p1[1] - p0[1]) * 0.08 + sp()];
      const c2 = [p1[0] + n1[0] * b - (p1[0] - p0[0]) * 0.08 + sp(), p1[1] + n1[1] * b - (p1[1] - p0[1]) * 0.08 + sp()];
      const q1 = uc[(i + 1) % n];
      d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(q1[0])} ${f1(q1[1])}`;
    }
    const nok = noktalar.map(([x, y, rad]) => yolD(ov(x + sp() * 0.3, y + sp() * 0.3, rad, rad * 0.86, 10), true));
    return { d: d + 'Z', nok };
  });
  const koken = [cx + u[0] * ek * 0.8, cy + u[1] * ek * 0.8]; // büyüme kökeni: sahibe bakan kenar
  const b = { B, sira, g, c: [cx, cy], rx, ry, gorunus: 0, sonme: Infinity, cizgiler: [] };
  b.ciz = (f) => {
    const gor = f >= b.gorunus && f < b.sonme + 22;
    g.style.display = gor ? '' : 'none';
    if (!gor) return;
    const c = cizimler[kaynaIndis(f)];
    dolgu.setAttribute('d', c.d); kontur.setAttribute('d', c.d);
    // Noktalar: en uzaktaki önce belirir; sönerken buluta en yakın önce küçülür
    nk.forEach((e, k) => {
      e.setAttribute('d', c.nok[k]);
      let s = GERI(kis((f - (b.gorunus + (2 - k) * 3)) / 8));
      s *= 1 - EI(kis((f - (b.sonme + 4 + k * 3)) / 8));
      e.setAttribute('transform', olcekle(noktalar[k], Math.max(0, s)));
    });
    // Bulut: kökenden büyür, kontur çizilerek kapanır
    const v = kis((f - (b.gorunus + 6)) / 14);
    bg.setAttribute('transform', olcekle(koken, 0.3 + 0.7 * GERI12(v)));
    bg.setAttribute('opacity', kis(v * 2.5).toFixed(3));
    if (f < b.sonme) {
      const w = EO(kis((f - (b.gorunus + 6)) / 12));
      kontur.setAttribute('stroke-dasharray', `${(1000 * w).toFixed(1)} 1000`);
      kontur.setAttribute('stroke-width', D.kontur);
      dolgu.setAttribute('fill-opacity', 1);
      return;
    }
    // Sönme: kontur kesik çizgiye, sonra noktalara ayrılır; noktalar küçülür, dolgu solar
    const s = f - b.sonme, per = 1000 / 26, a = P2I(kis(s / 10));
    kontur.setAttribute('stroke-dasharray', `${(per * (1 - a) + 0.01).toFixed(2)} ${(per * a).toFixed(2)}`);
    kontur.setAttribute('stroke-width', (D.kontur * (1 - P2I(kis((s - 9) / 9)))).toFixed(2));
    dolgu.setAttribute('fill-opacity', (1 - P2O(kis((s - 1) / 11))).toFixed(3));
  };
  return b;
}

// ---------- Çubuklar: parça kenarlarını taşıyan doğru parçaları (logo birimi)
const dNokta = (d, t) => [d.u[0] * t - d.u[1] * d.c, d.u[1] * t + d.u[0] * d.c];
function cubuklariKur() {
  const dogrular = new Map();
  PARCA.forEach((poly, pi) => poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    let ux = b[0] - a[0], uy = b[1] - a[1];
    const L = Math.hypot(ux, uy);
    ux /= L; uy /= L;
    if (ux < -1e-9 || (Math.abs(ux) < 1e-9 && uy < 0)) { ux = -ux; uy = -uy; }
    const c = -uy * a[0] + ux * a[1];
    const anahtar = `${ux.toFixed(4)} ${uy.toFixed(4)} ${c.toFixed(2)}`;
    if (!dogrular.has(anahtar)) dogrular.set(anahtar, { u: [ux, uy], c, ara: [] });
    const ta = a[0] * ux + a[1] * uy, tb = b[0] * ux + b[1] * uy;
    dogrular.get(anahtar).ara.push({ t0: Math.min(ta, tb), t1: Math.max(ta, tb), pi });
  }));
  const kose = PARCA.flat();
  const out = [];
  for (const d of dogrular.values()) {
    d.ara.sort((x, y) => x.t0 - y.t0);
    // Doğru üstündeki bütün parça köşeleri (bölme noktası adayları)
    d.kose = [...new Set(kose.filter((p) => Math.abs(-d.u[1] * p[0] + d.u[0] * p[1] - d.c) < 1e-3).map((p) => +(p[0] * d.u[0] + p[1] * d.u[1]).toFixed(4)))];
    let cur = null;
    for (const a of d.ara) {
      if (cur && a.t0 <= cur.t1 + 1e-6) cur.t1 = Math.max(cur.t1, a.t1);
      else { if (cur) out.push(cur); cur = { d, t0: a.t0, t1: a.t1 }; }
    }
    out.push(cur);
  }
  return out;
}
const cubukUc = (c) => [dNokta(c.d, c.t0), dNokta(c.d, c.t1)];
const aynaNokta = ([x, y]) => [2 * LOGO_EKSEN - x, y];
function aynaBul(c, liste) {
  const [a, b] = cubukUc(c).map(aynaNokta);
  return liste.find((o) => { const [p, r] = cubukUc(o); return (uzak(p, a) < 0.05 && uzak(r, b) < 0.05) || (uzak(p, b) < 0.05 && uzak(r, a) < 0.05); }) || null;
}
function bol(c, liste) {
  const L = c.t1 - c.t0, orta = (c.t0 + c.t1) / 2;
  const aday = c.d.kose.filter((t) => t > c.t0 + 0.3 * L && t < c.t1 - 0.3 * L).sort((x, y) => Math.abs(x - orta) - Math.abs(y - orta));
  const ts = aday.length ? aday[0] : orta;
  liste.splice(liste.indexOf(c), 1, { d: c.d, t0: c.t0, t1: ts }, { d: c.d, t0: ts, t1: c.t1 });
}

// ---------- Çizgi: balondaki bir çizim çizgisi (yerel biçim + kimlik), sonra uçuş ve oturma
const N_NOKTA = 12;
function cizgiKur(b, def, j, yer, tohum) {
  const r = rng(tohum);
  const ham = def.map(([x, y]) => [yer.x + x * yer.s, yer.y + y * yer.s]);
  const egri = ham.length > 2;
  let pts = ornekle(egri ? sik(ham) : ham, N_NOKTA);
  let A = pts[0], B = pts[N_NOKTA - 1];
  if (!egri) {
    // Mimar eskizi: düz çizginin uçları köşeden biraz taşar
    const L = uzak(A, B), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
    const e1 = Math.min(0.08 * L, (1.2 + r() * 2.2) * D.olcu), e2 = Math.min(0.08 * L, (1.2 + r() * 2.2) * D.olcu);
    A = [A[0] - ux * e1, A[1] - uy * e1]; B = [B[0] + ux * e2, B[1] + uy * e2];
    pts = ornekle([A, B], N_NOKTA);
  }
  const L0 = uzak(A, B), th0 = Math.atan2(B[1] - A[1], B[0] - A[0]);
  const ux = Math.cos(th0), uy = Math.sin(th0), m0 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const kavis = egri ? 0 : Math.max(-2.2, Math.min(2.2, (r() - 0.5) * 0.06 * L0)) * D.olcu;
  const yerel = pts.map((p, i) => {
    const dx = p[0] - A[0], dy = p[1] - A[1], t = (dx * ux + dy * uy) / L0;
    return [t, -dx * uy + dy * ux + kavis * Math.sin(Math.PI * (i / (N_NOKTA - 1)))];
  });
  // Kaynama sapması: 4 çapa noktası, aralar doğrusal
  const capa = [0, 4, 8, 11];
  const tablo = [0, 1, 2, 3].map((ki) => { const rr = rng(tohum * 131 + ki * 977); return capa.map(() => [(rr() - 0.5) * 2, (rr() - 0.5) * 2]); });
  const sapma = (ki, i) => {
    let k = 0;
    while (k < capa.length - 2 && i > capa[k + 1]) k++;
    const f = (i - capa[k]) / (capa[k + 1] - capa[k]), T = tablo[ki];
    return [ara(T[k][0], T[k + 1][0], f), ara(T[k][1], T[k + 1][1], f)];
  };
  // Sönmede eklemden ayrılış: çizim ortasından dışa (biraz saparak), küçük dönüş
  const merkezYon = [m0[0] - yer.mx, m0[1] - yer.my], ml = Math.hypot(...merkezYon) || 1;
  const sap = (r() - 0.5) * 0.7, ma = Math.atan2(merkezYon[1], merkezYon[0]) + sap;
  const yol = ml < 3 ? [Math.cos(r() * 6.28), Math.sin(r() * 6.28)] : [Math.cos(ma), Math.sin(ma)];
  const yolEl = el(cizgiKat, 'path', { fill: 'none', stroke: M, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return {
    b, j, yolEl, yerel, sapma, L0, th0, m0, egri,
    pop: { yon: yol, gevsek: (2.5 + r() * 2.5) * D.olcu, don: (r() - 0.5) * 0.07, gecikme: Math.floor(r() * 4), suzul: (0.015 + r() * 0.02) * D.olcu,
      kopma: (8 + r() * 6) * D.olcu, don2: (r() - 0.5) * 0.22 },
    ciz0: 0, cubuk: null,
  };
}
// Çizginin kare f'deki duruşu: merkez c, açı th, boy L, kavis çarpanı k, kaynama genliği amp, kalınlık w, görünen oran g
function durus(h, f) {
  const sonme = h.b.sonme + h.pop.gecikme;
  const amp0 = 0.9 * D.olcu;
  if (f < sonme) {
    return { c: h.m0, th: h.th0, L: h.L0, k: 1, amp: amp0, w: D.cizgi, g: P2O(kis((f - h.ciz0) / Z.cizgiSure)) };
  }
  // Balon sönünce eklemler açılır (gevşeme, çizim okunur kalır); sırası gelen çizgi kalkıştan önce dışa kopar
  const tau = f - sonme, p = h.pop;
  const patlak = (t) => {
    const ee = GERI3(kis(t / 10)), k0 = h.kalkis - Z.kopma, ek = h.cubuk ? GERI(kis((sonme + t - k0) / Z.kopma)) : 0;
    const m = p.gevsek * ee + p.suzul * Math.max(0, t) + p.kopma * ek;
    return { c: [h.m0[0] + p.yon[0] * m, h.m0[1] + p.yon[1] * m], th: h.th0 + p.don * ee + p.don2 * ek };
  };
  if (!h.cubuk) {
    // Fazla çizgi: yerinde kısalıp söner
    const s = 1 - P2I(kis(tau / 12)), pp = patlak(tau);
    return { c: pp.c, th: pp.th, L: h.L0 * s, k: 1, amp: amp0, w: D.cizgi * s, g: 1 };
  }
  if (f < h.kalkis) { const pp = patlak(tau); return { c: pp.c, th: pp.th, L: h.L0, k: 1, amp: amp0, w: D.cizgi, g: 1 }; }
  const cb = h.cubuk;
  if (f < cb.varis) {
    const u = (f - h.kalkis) / h.F, v1 = h.v1, gg = (v1 - 2) * u * u * u + (3 - v1) * u * u;
    const [P0, P1, P2, P3] = h.bez, mt = 1 - gg;
    const c = [0, 1].map((i) => mt * mt * mt * P0[i] + 3 * mt * mt * gg * P1[i] + 3 * mt * gg * gg * P2[i] + gg * gg * gg * P3[i]);
    const th = h.thK + h.dTh * yumusak(0.06, 0.78, u);
    const L = h.L0 * Math.pow(cb.L / h.L0, yumusak(0.12, 0.85, u)) - h.kisa * yumusak(0.55, 1, u);
    return { c, th, L, k: 1 - yumusak(0.03, 0.55, u), amp: amp0 * (1 - yumusak(0.4, 0.92, u)), w: ara(D.cizgi, D.ince, yumusak(0.3, 0.9, u)), g: 1 };
  }
  // Oturdu: sönümlü yay (geliş yönünde taşar, geri gelir); boy eklemlere oturur; parçalar dolunca incelir
  const t2 = f - cb.varis, om = (2 * Math.PI) / 9;
  const disp = h.yayA * Math.exp(-t2 / 3.5) * Math.sin(om * t2);
  const c = [cb.orta[0] + h.gelis[0] * disp, cb.orta[1] + h.gelis[1] * disp];
  const w = D.ince * (1 - yumusak(cb.doluBitis, cb.doluBitis + Z.incelme, f));
  return { c, th: h.thT, L: cb.L - h.kisa * Math.exp(-t2 / 1.6), k: 0, amp: 0, w, g: 1, oturdu: true };
}
function cizgiCiz(h, f) {
  if (f < h.ciz0) { h.yolEl.setAttribute('d', ''); return; }
  const z = durus(h, f);
  if (z.w <= 0.02 || z.L <= 0.3) { h.yolEl.setAttribute('d', ''); return; }
  h.yolEl.setAttribute('stroke-width', z.w.toFixed(2));
  const cs = Math.cos(z.th), sn = Math.sin(z.th);
  if (z.oturdu) {
    const a = [z.c[0] - cs * z.L / 2, z.c[1] - sn * z.L / 2], b = [z.c[0] + cs * z.L / 2, z.c[1] + sn * z.L / 2];
    h.yolEl.setAttribute('d', `M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}`);
    return;
  }
  const ki = kaynaIndis(f);
  const P = h.yerel.map(([t, o], i) => {
    const x = (t - 0.5) * z.L, y = o * z.k, [jx, jy] = h.sapma(ki, i);
    return [z.c[0] + x * cs - y * sn + jx * z.amp, z.c[1] + x * sn + y * cs + jy * z.amp];
  });
  if (z.g >= 1) { h.yolEl.setAttribute('d', yolD(P)); return; }
  if (z.g <= 0) { h.yolEl.setAttribute('d', ''); return; }
  const son = (P.length - 1) * z.g, i0 = Math.floor(son), parca = P.slice(0, i0 + 1);
  if (i0 < P.length - 1) { const fr = son - i0; parca.push([ara(P[i0][0], P[i0 + 1][0], fr), ara(P[i0][1], P[i0 + 1][1], fr)]); }
  h.yolEl.setAttribute('d', yolD(parca));
}

// ---------- Kurulum
const balonlar = [], cizgiler = [], parcalar = [], kaynaklar = [], dikisler = [];
let cubuklar = [], T = {}, TOPLAM = 420, harfler = [];
function kur() {
  // 1) Balonlar ve içlerindeki çizgiler
  let tohum = 7;
  D.balon.forEach((B, bi) => {
    const b = balonKur(B, bi);
    balonlar.push(b);
    const cizim = CIZIM[B.cizim];
    const ck = kutu(cizim.flat());
    const yS = Math.min((2 * b.rx * D.dol[0]) / ck.en, (2 * b.ry * D.dol[1]) / ck.boy);
    const yer = { s: yS, x: b.c[0] - ((ck.x0 + ck.x1) / 2) * yS, y: b.c[1] + b.ry * 0.03 - ((ck.y0 + ck.y1) / 2) * yS, mx: b.c[0], my: b.c[1] + b.ry * 0.03 };
    cizim.forEach((def, j) => { const h = cizgiKur(b, def, j, yer, tohum++); b.cizgiler.push(h); cizgiler.push(h); });
  });
  const S = cizgiler.length;

  // 2) Çubuklar; çizgi sayısına eşitlenir (en uzun çubuk ikiye bölünür, aynalı çift birlikte)
  cubuklar = cubuklariKur();
  const E0 = cubuklar.length;
  for (let koruma = 0; cubuklar.length < S && koruma < 200; koruma++) {
    const kalan = S - cubuklar.length;
    const sirali = [...cubuklar].sort((a, b) => (b.t1 - b.t0) - (a.t1 - a.t0));
    const sec = sirali.find((c) => { const m = aynaBul(c, cubuklar); return kalan >= 2 || m === c || !m; });
    if (!sec) break;
    const m = aynaBul(sec, cubuklar);
    bol(sec, cubuklar);
    if (m && m !== sec) bol(m, cubuklar);
  }
  // Ekran koordinatları, parça ilişkisi
  cubuklar.forEach((c, i) => {
    c.no = i;
    [c.a, c.b] = cubukUc(c);
    c.p0 = logoNokta(c.a); c.p1 = logoNokta(c.b);
    c.orta = [(c.p0[0] + c.p1[0]) / 2, (c.p0[1] + c.p1[1]) / 2];
    c.L = uzak(c.p0, c.p1);
    c.th = Math.atan2(c.p1[1] - c.p0[1], c.p1[0] - c.p0[0]);
    c.parcalar = new Set(c.d.ara.filter((a) => Math.min(a.t1, c.t1) - Math.max(a.t0, c.t0) > 0.5).map((a) => a.pi));
  });
  cubuklar.forEach((c) => { c.ayna = aynaBul(c, cubuklar); });
  const gerekli = PARCA.map((_, pi) => cubuklar.filter((c) => c.parcalar.has(pi)));

  // 3) Varış zamanları (göreli): dilim dilim; dilim içinde mevcut yapıya en çok değen çubuk (çifti) önce, eşitse alttaki
  const degiyor = (p, c) => { const r = parcaUstu(p, c.a, c.b); return r.d < 0.5 && r.t > -0.5 && r.t < r.L + 0.5; };
  const kapanis = new Array(PARCA.length).fill(0);
  const gelen = [];
  let imlec = 0;
  for (const dilim of SIRA) {
    if (dilim.includes(2)) imlec += Z.sonNefes;
    const bas = imlec;
    const yeni = [...new Set(dilim.flatMap((p) => gerekli[p]))].filter((c) => c.varis === undefined);
    const gruplar = [], alindi = new Set();
    for (const c of yeni) {
      if (alindi.has(c)) continue;
      const g = c.ayna && c.ayna !== c && yeni.includes(c.ayna) ? [c, c.ayna] : [c];
      g.forEach((x) => alindi.add(x));
      gruplar.push(g);
    }
    while (gruplar.length) {
      let enIyi = null;
      for (const g of gruplar) {
        const c = g[0];
        const temas = [c.a, c.b].filter((p) => gelen.some((o) => degiyor(p, o))).length + gelen.filter((o) => [o.a, o.b].some((p) => degiyor(p, c))).length;
        const skor = Math.min(temas, 3) * 1000 + (c.a[1] + c.b[1]) / 2;
        if (!enIyi || skor > enIyi.skor) enIyi = { g, skor };
      }
      enIyi.g.forEach((c) => { c.varis = imlec; gelen.push(c); });
      gruplar.splice(gruplar.indexOf(enIyi.g), 1);
      imlec += Z.varisAra;
    }
    for (const p of dilim) kapanis[p] = Math.max(bas, ...gerekli[p].map((c) => c.varis)) + Z.oturma;
    imlec += Z.dilimAra;
  }

  // 4) Atama: Macar algoritması; balonun zaman öbeği iki turda maliyete girer
  const n = S, Dn = Math.max(W, H) / 4;
  const gmS = Math.exp(cizgiler.reduce((a, h) => a + Math.log(h.L0), 0) / S);
  const gmT = Math.exp(cubuklar.reduce((a, c) => a + Math.log(c.L), 0) / cubuklar.length);
  const temel = cizgiler.map((h) => cubuklar.map((c) => {
    const dAci = Math.abs(aciSar(2 * (h.th0 - c.th))) / 2; // yönsüz açı farkı (0..π/2)
    return uzak(h.m0, c.orta) / Dn + 0.45 * (dAci / (Math.PI / 2)) + 0.4 * Math.abs(Math.log(h.L0 / gmS) - Math.log(c.L / gmT));
  }));
  let atama = null, zaman = null;
  for (let tur = 0; tur < 3; tur++) {
    const C = cizgiler.map((h, i) => {
      const satir = temel[i].map((v, j) => v + (zaman ? 0.009 * Math.abs(cubuklar[j].varis - zaman.get(h.b)) : 0));
      for (let k = cubuklar.length; k < n; k++) satir.push(2.5 + h.L0 / (60 * D.olcu)); // fazla çizgi (kısa olan söner)
      return satir;
    });
    atama = macar(C);
    zaman = new Map();
    for (const b of balonlar) {
      const v = b.cizgiler.map((h) => cubuklar[atama[cizgiler.indexOf(h)]]).filter(Boolean).map((c) => c.varis).sort((x, y) => x - y);
      zaman.set(b, v.length ? v[Math.floor(v.length / 2)] : 0);
    }
  }
  cizgiler.forEach((h, i) => { h.cubuk = cubuklar[atama[i]] || null; if (h.cubuk) h.cubuk.cizgi = h; });

  // 5) Uçuş süresi, kalkış, balonun sönmesi; sonra her şey ilk sönme Z.enErkenSonme olacak biçimde kaydırılır
  for (const h of cizgiler) {
    if (!h.cubuk) continue;
    const yol = uzak(h.m0, h.cubuk.orta);
    h.F = Math.round(Math.max(34, Math.min(62, 26 + yol / (24 * Math.sqrt(D.olcu)))));
    h.kalkis = h.cubuk.varis - h.F;
  }
  for (const b of balonlar) {
    const k = b.cizgiler.filter((h) => h.cubuk).map((h) => h.kalkis);
    b.sonme = (k.length ? Math.min(...k) : 0) - Z.sonmeOnce;
  }
  const kaydir = Z.enErkenSonme - Math.min(...balonlar.map((b) => b.sonme));
  for (const b of balonlar) b.sonme += kaydir;
  for (const h of cizgiler) if (h.cubuk) h.kalkis += kaydir;
  for (const c of cubuklar) c.varis += kaydir;
  kapanis.forEach((v, i) => { kapanis[i] = v + kaydir; });
  // Beliriş sırası = sönme sırası (ilk sönen ilk belirir); çizgiler sırayla çizilir
  [...balonlar].sort((a, b) => a.sonme - b.sonme).forEach((b, i) => {
    b.gorunus = i * Z.balonAra;
    b.cizgiler.forEach((h, j) => { h.ciz0 = b.gorunus + Z.cizimGecikme + j * Z.cizgiAra; });
  });

  // 6) Uçuş eğrisi (kübik Bézier): patlak konumdan, dışa savrularak çıkar; kenara dikine, kaynak tarafından yaklaşır
  for (const h of cizgiler) {
    if (!h.cubuk) continue;
    const cb = h.cubuk;
    const z = durus(h, h.kalkis - 1e-6);
    const P0 = z.c, P3 = cb.orta, dist = uzak(P0, P3) || 1;
    const hedefYon = [(P3[0] - P0[0]) / dist, (P3[1] - P0[1]) / dist];
    let d0 = [h.pop.yon[0] * 0.4 + hedefYon[0], h.pop.yon[1] * 0.4 + hedefYon[1]];
    const dl = Math.hypot(...d0); d0 = [d0[0] / dl, d0[1] / dl];
    const P1 = [P0[0] + d0[0] * 0.3 * dist, P0[1] + d0[1] * 0.3 * dist];
    // Son yaklaşma, kapatacağı ilk parçanın DIŞINDAN: köşeler önce açık kalır, değince kapanır (içeriden gelen çizgi
    // komşu kenarları keser, "#" gibi görünür)
    const ilk = [...cb.parcalar].sort((x, y) => kapanis[x] - kapanis[y])[0];
    const pm = PARCA[ilk].map(logoNokta).reduce((a, p, _, A) => [a[0] + p[0] / A.length, a[1] + p[1] / A.length], [0, 0]);
    let nrm = [-Math.sin(cb.th), Math.cos(cb.th)];
    if (nrm[0] * (pm[0] - P3[0]) + nrm[1] * (pm[1] - P3[1]) > 0) nrm = [-nrm[0], -nrm[1]];
    const kol = Math.min(0.28 * dist, 90 * D.olcu);
    const P2 = [P3[0] + nrm[0] * kol, P3[1] + nrm[1] * kol];
    h.bez = [P0, P1, P2, P3];
    h.gelis = [-nrm[0], -nrm[1]];
    h.v1 = 1.3;
    // Açı: patlak açıdan, hedef doğrultunun en yakın yönüne (en çok 90°)
    h.thK = z.th;
    let dTh = aciSar(cb.th - h.thK);
    if (Math.abs(dTh) > Math.PI / 2) dTh = aciSar(dTh + Math.PI);
    h.dTh = dTh; h.thT = h.thK + dTh;
    const hiz = (3 * kol * h.v1) / h.F; // varışta px/kare
    h.yayA = Math.min(hiz / ((2 * Math.PI) / 9), 4 * D.olcu);
    h.kisa = Math.min(0.12 * cb.L, 9 * D.olcu);
  }

  // 7) Parçalar: kapanış, mürekkep dolumu (kesik yol içinde kalınlaşan kenar), kenarların incelmesi
  PARCA.forEach((poly, pi) => {
    const ekran = poly.map(logoNokta);
    const kid = `l2-parca-${pi}`;
    el(el(tanim, 'clipPath', { id: kid }), 'path', { d: cokgenD(ekran) });
    const dEl = el(el(dolguKat, 'g', { 'clip-path': `url(#${kid})` }), 'path', { fill: 'none', stroke: M, 'stroke-linejoin': 'miter', d: cokgenD(ekran) });
    parcalar.push({ pi, el: dEl, kapanis: kapanis[pi], ic: icYaricap(ekran), dolu: kapanis[pi] + Z.dolum });
  });
  for (const c of cubuklar) c.doluBitis = Math.max(...[...c.parcalar].map((p) => parcalar[p].dolu));
  // Dikişler: aynı doğru üstünde iki parçanın örtüşen kenarı; ikisi de dolunca ince kâğıt çizgisi
  const dogrular = new Set(cubuklar.map((c) => c.d));
  for (const d of dogrular) {
    for (let i = 0; i < d.ara.length; i++) for (let j = i + 1; j < d.ara.length; j++) {
      const a = d.ara[i], b = d.ara[j], t0 = Math.max(a.t0, b.t0), t1 = Math.min(a.t1, b.t1);
      if (t1 - t0 < 0.5 || a.pi === b.pi) continue;
      const p0 = logoNokta(dNokta(d, t0)), p1 = logoNokta(dNokta(d, t1));
      const e = el(dikisKat, 'path', { d: `M${f1(p0[0])} ${f1(p0[1])} L${f1(p1[0])} ${f1(p1[1])}`, stroke: KAGIT, 'stroke-width': (1.3 * D.olcu).toFixed(2), fill: 'none' });
      dikisler.push({ el: e, bas: Math.max(parcalar[a.pi].dolu, parcalar[b.pi].dolu) });
    }
  }

  // 8) Kaynak noktaları: çubuk değdiğinde ucunda (ya da ucuna değen eski çubuğun ucunda) başka çubuk varsa
  const anahtarlar = new Set();
  const sonParca = SIRA[SIRA.length - 1];
  for (const c of [...cubuklar].sort((x, y) => x.varis - y.varis)) {
    const noktalar = [];
    for (const p of [c.a, c.b]) if (cubuklar.some((o) => o !== c && o.varis <= c.varis && degiyor(p, o))) noktalar.push(p);
    for (const o of cubuklar) if (o !== c && o.varis < c.varis) for (const p of [o.a, o.b]) { const r = parcaUstu(p, c.a, c.b); if (r.d < 0.5 && r.t > 1 && r.t < r.L - 1) noktalar.push(p); }
    for (const p of noktalar) {
      const an = `${p[0].toFixed(1)} ${p[1].toFixed(1)} ${c.varis}`;
      if (anahtarlar.has(an)) continue;
      anahtarlar.add(an);
      const vurgu = sonParca.some((sp) => c.parcalar.has(sp));
      const g = el(kaynakKat, 'g');
      const halka = el(g, 'circle', { fill: 'none', stroke: vurgu ? VURGU : M });
      const nokta = el(g, 'circle', { fill: vurgu ? VURGU : M });
      const [x, y] = logoNokta(p);
      [halka, nokta].forEach((e) => { e.setAttribute('cx', f1(x)); e.setAttribute('cy', f1(y)); });
      kaynaklar.push({ g, halka, nokta, f0: c.varis + 1, vurgu });
    }
  }

  // 9) Son: dikişler söner → tek logo yolu + %2 tık → OKTOS
  T.son = Math.max(...parcalar.map((p) => p.dolu));
  T.dikis = T.son + 3;
  T.takas = T.dikis + Z.dikis;
  T.ad = T.takas + Z.takasSonra;
  yaziKur();
  T.adBitis = T.ad + 4 * 4 + 18;
  TOPLAM = Math.max(420, Math.ceil(T.adBitis + Z.bekleme));

  window.tanitim.durum = {
    cizgi: S, cubuk0: E0, cubuk: cubuklar.length, fazla: cizgiler.filter((h) => !h.cubuk).length, kaynak: kaynaklar.length,
    balon: balonlar.map((b) => ({ cizim: b.B.cizim, gorunus: b.gorunus, sonme: b.sonme, cizgi: b.cizgiler.length,
      kalkis: b.cizgiler.filter((h) => h.cubuk).map((h) => h.kalkis).sort((x, y) => x - y) })),
    kapanis: parcalar.map((p) => p.kapanis), T, TOPLAM,
  };
}

// ---------- Yazı: "OKTOS" harf harf (Big Shoulders Display 900); altında slogan satırı boş
function yaziKur() {
  const ad = document.createElement('p');
  ad.className = 'ad';
  Object.assign(ad.style, { top: D.ad.top + 'px', fontSize: D.ad.boyut + 'px' });
  harfler = [...'OKTOS'].map((h) => { const m = document.createElement('span'); m.className = 'm'; const s = document.createElement('span'); s.className = 'h'; s.textContent = h; m.appendChild(s); ad.appendChild(m); return s; });
  yaziKat.appendChild(ad);
}

// ---------- Kare kurulumu (saf: yalnız f'ye bağlı)
function ciz(f) {
  for (const b of balonlar) b.ciz(f);
  for (const h of cizgiler) cizgiCiz(h, f);
  for (const p of parcalar) {
    if (f < p.kapanis) { p.el.style.display = 'none'; continue; }
    p.el.style.display = '';
    const v = kis((f - p.kapanis) / Z.dolum);
    if (v >= 1) { p.el.setAttribute('fill', M); p.el.setAttribute('stroke-width', 0); continue; }
    p.el.setAttribute('fill', 'none');
    p.el.setAttribute('stroke-width', ara(D.ince, 2 * p.ic + 4, P2I(v)).toFixed(2));
  }
  for (const d of dikisler) {
    const a = yumusak(d.bas, d.bas + 6, f) * (1 - yumusak(T.dikis, T.dikis + Z.dikis, f));
    d.el.style.display = a > 0.01 ? '' : 'none';
    d.el.setAttribute('opacity', (0.75 * a).toFixed(3));
  }
  for (const k of kaynaklar) {
    const t = f - k.f0;
    if (t < 0 || t > 14) { k.g.style.display = 'none'; continue; }
    k.g.style.display = '';
    const R = D.ince * (k.vurgu ? 2.1 : 1.55);
    const r = R * (t < 2 ? P2O(t / 2) : 1 - P2I(kis((t - 2) / 9)));
    k.nokta.setAttribute('r', Math.max(0, r).toFixed(2));
    const hv = kis(t / 10);
    k.halka.setAttribute('r', ara(R * 1.2, R * (k.vurgu ? 2.8 : 3.6), P2O(hv)).toFixed(2));
    k.halka.setAttribute('stroke-width', (1.6 * D.olcu * (1 - hv)).toFixed(2));
    k.halka.setAttribute('opacity', (1 - hv).toFixed(3));
  }
  // Takas: parçalar ve çizgiler yerine tek logo yolu (dikiş yok); %2 tık, logo ortada kalır
  const takas = f >= T.takas;
  logoYol.style.display = takas ? '' : 'none';
  dolguKat.style.display = takas ? 'none' : '';
  cizgiKat.style.display = takas ? 'none' : '';
  const tk = f - T.takas;
  const s = tk < 0 ? 1 : tk < 5 ? 1 + 0.02 * P2O(tk / 5) : 1 + 0.02 * (1 - P2IO(kis((tk - 5) / 14)));
  logoKap.setAttribute('transform', olcekle([D.logo.cx, D.logo.cy], s));
  harfler.forEach((e, i) => {
    const v = EO(kis((f - (T.ad + i * 4)) / 18));
    e.style.transform = `translateY(${(110 * (1 - v)).toFixed(2)}%)`;
  });
}
function sayacYaz(f) {
  if (sayac.hidden) return;
  sayac.textContent = `k ${String(Math.round(f)).padStart(3, '0')} · ${(f / FPS).toFixed(2)} sn`;
}
function kareKur(t) {
  const f = Math.max(0, t * FPS);
  ciz(f);
  sayacYaz(f);
}
window.tanitim = { kare: kareKur, sure: () => TOPLAM / FPS, hatalar: [] };
await Promise.all([document.fonts.load(`900 ${D.ad.boyut}px "Big Shoulders Display"`, 'OKTOS')]).catch(() => {});
await document.fonts.ready;
try { kur(); } catch (e) { console.error(e); hataEl.textContent = e.message; window.tanitim.hatalar.push(String(e && e.stack || e)); }
kareKur(0);
if (CEKIM) { document.getElementById('tekrar').hidden = true; window.tanitimHazir = true; }
else if (q.get('t') !== null) kareKur(+q.get('t'));
else {
  const hiz = +(q.get('hiz') || 1);
  let t0 = null;
  const dongu = (simdi) => {
    if (t0 === null) t0 = simdi;
    const t = ((simdi - t0) / 1000) * hiz;
    kareKur(Math.min(t, TOPLAM / FPS));
    if (t < TOPLAM / FPS) requestAnimationFrame(dongu);
  };
  requestAnimationFrame(dongu);
  document.getElementById("tekrar").addEventListener("click", () => location.reload());
}
