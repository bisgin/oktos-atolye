// Kol ve el üreteci (tanıtım filmi, M2 stil kareleri): insan.js çizgi diliyle parametrik kol + el (SVG parça dizgesi).
// Girdi: omuz, (dirsek ya da IK), bilek noktaları + el pozu; çıktı: kişinin svg'sine eklenecek <path> dizgesi.
// Çizgi dili insan.js ile aynı: mürekkep kontur 4,2 (insan kutusu birimi; 400×440 kutu, sahnede ×1,9), iç detay 2,6–3,2,
// yuvarlak uç/birleşim, dolgu konturdan kayık (baskı kayması, aşağı-sağa), noktalarda sabit el titremesi + kaynama
// (kaynama = 0..3: aynı pozun dört çizimi; film 8 fps'te döndürür). Kol giysi renginde, el ten renginde (MONO gri).
// Kol iki kapsülden kurulur: üst kol (omuz ucu düz, dirsek ucu yuvarlak) + ön kol (üstte çizilir, dirsek ucu konturlanmaz):
// böylece her büküm açısında birleşim temiz kalır, kol kendini katladığında ön kol üst kolun önüne geçer.
// El yerel çerçevede tanımlı: bilek (0,0), x parmaklara doğru, y başparmak tarafı, birim = el boyu.
import { yol, rng, MONO, PALET, GOZ_Y } from './insan.js';

const M = PALET.murekkep;
const D2R = Math.PI / 180;
const ekle = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cik = (a, b) => [a[0] - b[0], a[1] - b[1]];
const kat = (a, s) => [a[0] * s, a[1] * s];
const uz = (a) => Math.hypot(a[0], a[1]);
const bir = (a) => { const l = uz(a) || 1; return [a[0] / l, a[1] / l]; };
const dik = (a) => [-a[1], a[0]]; // +90° (ekranda saat yönü, y aşağı)
const don = (a, t) => { const c = Math.cos(t), s = Math.sin(t); return [a[0] * c - a[1] * s, a[0] * s + a[1] * c]; };
const ara = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const SIFIR = { sap: () => 0 };

// ---------------------------------------------------------------------------------------------------------------
// IK: omuzdan bileğe iki kemik; dirseği döndürür. bukulme +1: dirsek, omuz→bilek doğrusunun saat yönü tarafında
// (ekranda), −1: öteki tarafta. Bilek erişilemezse kol düzleşir (ön kol yine bileğe uzanır).
export function kolIK(omuz, bilek, ust = 160, alt = 150, bukulme = 1) {
  const d0 = cik(bilek, omuz);
  const d = sinir(uz(d0), Math.abs(ust - alt) + 1, ust + alt - 0.5);
  const a = Math.acos(sinir((ust * ust + d * d - alt * alt) / (2 * ust * d), -1, 1));
  const t = Math.atan2(d0[1], d0[0]) + (bukulme >= 0 ? a : -a);
  return [omuz[0] + ust * Math.cos(t), omuz[1] + ust * Math.sin(t)];
}

// insan.js kişisinin (kutu birimi) omuz eklemleri: kol buradan çıkınca dış kenarı gövde konturuna oturur.
// yon: −1 ekranın solu, +1 sağı. Döner: { sol, sag, omuzY, ceneY, kalinlik }
export function omuzlar(p, { kalinlik = 64 } = {}) {
  const ceneY = GOZ_Y + 4 + p.yuzBoy, omuzY = ceneY + 40;
  const x = 200, r0 = kalinlik / 2, dx = 160 - r0 + 2, y = omuzY + 18 + r0; // omuz başının tepesi omuzY + 18
  return { sol: [x - dx, y], sag: [x + dx, y], omuzY, ceneY, kalinlik };
}

// ---------------------------------------------------------------------------------------------------------------
// Kaynama: insan.js ile aynı kurgu. Her yol çağrısı kendi noktalarına sabit sapma (el titremesi) + kareye göre kaynama alır.
function kalemKur(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const sapT = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6);
  const kayT = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let sayac = 0;
  return (oran = 1) => {
    const taban = (sayac++ * 37) % 400, o = oran * genlik;
    return { sap: (i, k) => (sapT[(taban + i * 2 + k) % 512] + kayT[(taban + i * 2 + k + 3) % 512]) * o };
  };
}

// Çizim yardımcıları (dizge döndürür)
function cizer(s, kay) {
  const cizgi = (d, w, renk = M) => `<path d="${d}" fill="none" stroke="${renk}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dolgu = (d, renk, k = kay) => `<path d="${d}" fill="${renk}" transform="translate(${k[0]} ${k[1]})"/>`;
  return {
    cizgi: (pts, w, oran = 1, renk = M) => cizgi(yol(pts, false, s(oran)), w, renk),
    // kapalı şekil: dolgu + kontur aynı titreşimle
    sekil: (pts, renk, w, oran = 1, k = kay) => { const d = yol(pts, true, s(oran)); return dolgu(d, renk, k) + cizgi(d, w); },
    // dolgu kapalı, kontur açık (acik: kontur alınacak nokta dizisi, aynı noktalardan)
    kenar: (pts, acik, renk, w, oran = 1, k = kay) => {
      const ss = s(oran);
      const dD = yol(pts, true, ss);
      const dC = yol(acik, false, { sap: (i, e) => ss.sap(pts.indexOf(acik[i]) >= 0 ? pts.indexOf(acik[i]) : i, e) });
      return dolgu(dD, renk, k) + cizgi(dC, w);
    },
    dolguYalniz: (pts, renk, oran = 1, k = kay) => dolgu(yol(pts, true, s(oran)), renk, k),
  };
}

// Değişken kalınlıklı merkez çizgisinin iki kenarı (n: dik yön, uçlarda ortalanmış teğet)
function kenarlar(C, R) {
  const L = [], Rr = [];
  for (let i = 0; i < C.length; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)];
    const n = dik(bir(cik(b, a)));
    L.push(ekle(C[i], kat(n, R[i]))); Rr.push(ekle(C[i], kat(n, -R[i])));
  }
  return { L, R: Rr };
}
// Yarım daire uç: merkez c, yön t (uca doğru), yarıçap r; L kenarından R kenarına
function uc(c, t, r, n = 5) {
  const p = [], nn = dik(t);
  for (let i = 1; i < n; i++) {
    const a = Math.PI * i / n; // 0 → L (nn yönü), π → R
    p.push(ekle(c, ekle(kat(nn, r * Math.cos(a)), kat(t, r * Math.sin(a)))));
  }
  return p;
}
// Kapsül (parmak, ön kol derisi): merkez çizgisi C, yarıçaplar R; iki ucu yuvarlak, kapalı nokta dizisi
function kapsul(C, R, { bas = true, son = true } = {}) {
  const { L, R: Rr } = kenarlar(C, R);
  const t0 = bir(cik(C[0], C[1])), t1 = bir(cik(C[C.length - 1], C[C.length - 2]));
  const ucSon = son ? uc(C[C.length - 1], t1, R[R.length - 1]) : [];
  const ucBas = bas ? uc(C[0], t0, R[0]) : [];
  return [...L, ...ucSon, ...Rr.reverse(), ...ucBas];
}
// Doğru parçasını n noktaya böl
const bol = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => ara(a, b, i / n));
// Kırık çizgiyi (yerel) eşit adımla örnekle
function egri(pts, n) {
  const seg = []; let top = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = uz(cik(pts[i + 1], pts[i])); seg.push(l); top += l; }
  const out = [];
  for (let j = 0; j <= n; j++) {
    let d = top * j / n, i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    out.push(ara(pts[i], pts[i + 1], seg[i] ? sinir(d / seg[i], 0, 1) : 0));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// EL POZLARI (yerel birim: el boyu = 1; bilek 0,0; x parmaklara, y başparmak tarafı)
// Her poz { arka: [...], on: [...], nokta: {ad: [x,y]} } verir. Öğeler:
//   { t:'sekil', p }                kapalı dolgu + kontur
//   { t:'kenar', p, acik }          kapalı dolgu, açık kontur (avuç: parmakların bindiği boğum çizgisi konturlanmaz)
//   { t:'cizgi', p, w }             açık detay çizgisi
// 'arka' avuçtan önce/avuç dahil; 'on' tutulan nesnenin (araya) önüne binen parmaklar.
const parmak = (taban, aci, boy, r, buk = 0, geri = 0.08) => {
  // taban noktasından aci yönünde; ortadaki boğumda buk derece kıvrılır; taban avucun içine geri kadar uzanır
  const t = [Math.cos(aci * D2R), Math.sin(aci * D2R)];
  const b0 = ekle(taban, kat(t, -geri));
  const orta = ekle(taban, kat(t, boy * 0.5));
  const t2 = don(t, buk * D2R);
  const tip = ekle(orta, kat(t2, boy * 0.5 - r * 0.6));
  const C = egri([b0, orta, tip], 5);
  const R = C.map((_, i) => r * (1 - 0.16 * i / (C.length - 1)));
  return kapsul(C, R);
};
// Kıvrık parmak "rulosu" (yumruk/tutma): tabandan ileri kısa, yuvarlak kapsül
const rulo = (a, b, r) => kapsul(egri([a, b], 3), [r, r * 1.02, r * 1.02, r * 0.96]);

// Avuç: bilek kökünden boğum hattına; acikOn: boğum hattı (parmakların bindiği yer) konturlanmaz
function avuc({ en = 1, boy = 1, bombe = 0.03 } = {}) {
  const y = (v) => v * en, x = (v) => v * boy;
  const p = [
    [x(0.46), y(0.215)],            // 0 işaret boğumu
    [x(0.36), y(0.245)],            // başparmak ağı
    [x(0.22), y(0.235)],
    [x(0.08), y(0.2)],
    [x(-0.04), y(0.145)],           // bilek, başparmak yanı
    [x(-0.14), y(0.135)],           // yenin içinde
    [x(-0.14), y(-0.13)],
    [x(-0.04), y(-0.14)],           // bilek, serçe yanı
    [x(0.12), y(-0.185)],
    [x(0.3), y(-0.215)],
    [x(0.44), y(-0.195)],           // 10 serçe boğumu
    [x(0.515 + bombe), y(-0.09)],   // boğum hattı (konturlanmaz)
    [x(0.535 + bombe), y(0.03)],
    [x(0.51 + bombe), y(0.14)],
  ];
  return { p, acik: p.slice(0, 11) };
}
// Yumruk silüeti: tek parça, sıkı (parmaklar arasında boşluk yok). kivrik: kıvrık parmaklar (0 işaret … 3 serçe);
// uçlarda hafif tümsek (boğum), aralarda kısa parmak çizgileri; kıvrım çizgisi (parmak uçlarının avuca girdiği yer).
const PARMAK_Y = [0.158, 0.054, -0.052, -0.152], PARMAK_X = [0.585, 0.608, 0.598, 0.56];
function yumrukGovde(kivrik = [0, 1, 2, 3], { uzat = 0 } = {}) {
  const ust = [];
  ust.push([0.47 + uzat, 0.218]);
  for (let i = 0; i < 4; i++) {
    const y = PARMAK_Y[i], x = PARMAK_X[i] + uzat;
    if (kivrik.includes(i)) ust.push([x - 0.022, y + 0.042], [x, y + 0.004], [x - 0.016, y - 0.04]);
    else ust.push([0.5, y + 0.03], [0.505, y - 0.02]); // uzayan parmağın kökü: düz boğum
  }
  ust.push([0.47 + uzat, -0.212]);
  const p = [[-0.14, 0.135], [0.0, 0.162], [0.17, 0.208], [0.34, 0.228], ...ust, [0.34, -0.222], [0.16, -0.198], [0.0, -0.152], [-0.14, -0.13]];
  // parmak çizgileri: iki komşu kıvrık parmak arasındaki çukurdan içeri
  const ic = [];
  for (let i = 0; i < 3; i++) {
    if (!kivrik.includes(i) || !kivrik.includes(i + 1)) continue;
    const y = (PARMAK_Y[i] + PARMAK_Y[i + 1]) / 2, x = (PARMAK_X[i] + PARMAK_X[i + 1]) / 2 - 0.035 + uzat;
    ic.push({ t: 'cizgi', p: [[x, y], [x - 0.04, y - 0.003], [x - 0.075, y - 0.006]], w: 0.6 });
  }
  return { p, acik: p, ic };
}
// Başparmak (yumrukta): kökten öne, kıvrım çizgisinin üstünden geçer
const basparmakOn = (uc = [0.43, 0.02], bukum = 0.2) => {
  // kökten (elin yanı) fistin önünden enine geçer, ortanın üstünde biter
  const C = egri([[0.1, 0.215], [0.3, 0.2 + bukum * 0.03], uc], 6);
  const R = C.map((_, i) => 0.064 - 0.01 * i / 6);
  return kapsul(C, R);
};

const ELLER = {
  // Açık el: parmaklar hafif açık, avuç ya da el sırtı görünür
  acik: ({ yuz }) => {
    const A = avuc();
    const arka = [
      { t: 'sekil', p: parmak([0.1, 0.165], 50, 0.4, 0.076, -16, 0.06) },                  // başparmak
      { t: 'sekil', p: parmak([0.455, -0.15], -16, 0.33, 0.056, 6) },                      // serçe
      { t: 'sekil', p: parmak([0.505, -0.055], -6, 0.41, 0.062, 5) },                      // yüzük
      { t: 'sekil', p: parmak([0.515, 0.055], 2, 0.45, 0.065, 3) },                        // orta
      { t: 'sekil', p: parmak([0.47, 0.16], 11, 0.4, 0.064, 0) },                          // işaret
      { t: 'kenar', p: A.p, acik: A.acik },
    ];
    if (yuz === 'avuc') arka.push({ t: 'cizgi', p: [[0.42, -0.17], [0.36, -0.06], [0.38, 0.08]], w: 0.55 }, { t: 'cizgi', p: [[0.06, 0.13], [0.2, 0.06], [0.34, 0.1]], w: 0.55 });
    else arka.push({ t: 'cizgi', p: [[0.05, 0.12], [0.16, 0.09]], w: 0.5 });
    return { arka, on: [], nokta: { uc: [0.98, 0.07], avuc: [0.25, 0] } };
  },
  // Masaya düz basan el: parmaklar bitişik, başparmak yana açık; kisalma ile önden bakışta kısalır
  dayanma: () => {
    const A = avuc({ en: 1.05 });
    return {
      arka: [
        { t: 'sekil', p: parmak([0.12, 0.17], 40, 0.36, 0.074, -4, 0.06) },
        { t: 'sekil', p: parmak([0.455, -0.155], -8, 0.33, 0.058, 0) },
        { t: 'sekil', p: parmak([0.505, -0.055], -3, 0.41, 0.063, 0) },
        { t: 'sekil', p: parmak([0.515, 0.055], 1, 0.44, 0.066, 0) },
        { t: 'sekil', p: parmak([0.47, 0.16], 5, 0.4, 0.064, 0) },
        { t: 'kenar', p: A.p, acik: A.acik },
        { t: 'cizgi', p: [[0.06, 0.12], [0.18, 0.08]], w: 0.5 },
      ],
      on: [], nokta: { uc: [0.95, 0.04], avuc: [0.25, 0] },
    };
  },
  // Yumruk: sıkı silüet + parmak çizgileri + önden geçen başparmak
  yumruk: () => {
    const G = yumrukGovde();
    return {
      arka: [{ t: 'kenar', p: G.p, acik: G.acik }, ...G.ic, { t: 'cizgi', p: [[0.45, 0.19], [0.42, 0.0], [0.45, -0.19]], w: 0.5 }],
      on: [{ t: 'sekil', p: basparmakOn([0.44, 0.0]) }],
      nokta: { uc: [0.61, 0], avuc: [0.3, 0] },
    };
  },
  // Tutma: parmaklar tutulanın (araya) önünden sarar; avuç ve başparmak arkada
  tutma: () => {
    const G = yumrukGovde([], { uzat: -0.06 });
    return {
      arka: [
        { t: 'sekil', p: parmak([0.14, 0.19], 22, 0.38, 0.074, -20, 0.06) },  // başparmak tutulanın arkasında
        { t: 'kenar', p: G.p, acik: G.acik },
      ],
      on: [
        { t: 'sekil', p: rulo([0.4, -0.152], [0.575, -0.158], 0.058) },
        { t: 'sekil', p: rulo([0.41, -0.05], [0.615, -0.052], 0.063) },
        { t: 'sekil', p: rulo([0.41, 0.054], [0.62, 0.058], 0.065) },
        { t: 'sekil', p: rulo([0.39, 0.158], [0.59, 0.166], 0.063) },
      ],
      nokta: { tut: [0.5, 0.0], uc: [0.62, 0], avuc: [0.3, 0] },
    };
  },
  // İşaret: işaret parmağı uzar (gövdenin arkasından çıkar), öbürleri kıvrık, başparmak ortanın üstünde
  isaret: () => {
    const G = yumrukGovde([1, 2, 3]);
    return {
      arka: [
        { t: 'sekil', p: parmak([0.47, 0.158], 3, 0.45, 0.064, -3, 0.12) },
        { t: 'kenar', p: G.p, acik: G.acik }, ...G.ic,
        { t: 'cizgi', p: [[0.47, 0.11], [0.45, -0.02], [0.47, -0.18]], w: 0.55 },
      ],
      on: [{ t: 'sekil', p: basparmakOn([0.44, 0.01], 0.4) }],
      nokta: { uc: [0.93, 0.17], avuc: [0.3, 0] },
    };
  },
  // Çene: gevşek yumruk; parmak sırtları çeneyi taşır (nokta.cene), başparmak çene hattı boyunca uzanır
  cene: () => {
    const G = yumrukGovde();
    return {
      arka: [{ t: 'kenar', p: G.p, acik: G.acik }, ...G.ic, { t: 'cizgi', p: [[0.47, 0.19], [0.44, 0.0], [0.47, -0.19]], w: 0.55 }],
      on: [{ t: 'sekil', p: parmak([0.14, 0.2], 16, 0.38, 0.068, -6, 0.06) }],
      nokta: { cene: [0.62, -0.02], uc: [0.62, 0], avuc: [0.3, 0] },
    };
  },
};
export const EL_POZLARI = Object.keys(ELLER);

// Yerel → dünya dönüşümü
function cevir(bilek, aci, boy, bs, kisalma = 1) {
  const c = Math.cos(aci * D2R), s = Math.sin(aci * D2R);
  return ([x, y]) => { const X = x * boy * kisalma, Y = y * boy * bs; return [bilek[0] + X * c - Y * s, bilek[1] + X * s + Y * c]; };
}

// El pozunun bir noktasının (uc, tut, cene, avuc) bilekten nereye düştüğü; ters yönde bilek bulmak için
export function elNoktasi({ el = 'acik', bilek, elAci = 0, elBoy = 105, basparmak = 1, kisalma = 1, ad = 'uc' }) {
  const n = ELLER[el]({ yuz: 'sirt' }).nokta;
  return cevir(bilek, elAci, elBoy, basparmak, kisalma)(n[ad] || n.uc);
}
// Pozun nokta.ad'ı hedefe değsin diye bilek nerede olmalı
export function bilekBul({ el = 'acik', hedef, elAci = 0, elBoy = 105, basparmak = 1, kisalma = 1, ad = 'uc' }) {
  const p = elNoktasi({ el, bilek: [0, 0], elAci, elBoy, basparmak, kisalma, ad });
  return cik(hedef, p);
}

// Tutulan nesneler (araya katmanı): kalem (tablet kalemi) — yerel açıyla, tutma noktasından geçer
function nesneCiz(C, nesne, { merkez, aci, boy, renk = MONO.giysi[5] }) {
  if (nesne !== 'kalem') return '';
  const t = [Math.cos(aci * D2R), Math.sin(aci * D2R)], n = dik(t);
  const a = ekle(merkez, kat(t, -boy * 0.42)), b = ekle(merkez, kat(t, boy * 0.5));
  const r = boy * 0.038;
  const govde = [ekle(a, kat(n, r)), ekle(b, kat(n, r)), ekle(b, kat(n, -r)), ekle(a, kat(n, -r))];
  const uc1 = ekle(b, kat(t, boy * 0.11));
  const sivri = [ekle(b, kat(n, r * 0.9)), uc1, ekle(b, kat(n, -r * 0.9))];
  return C.sekil(govde, renk, 3, 0.4, [1.5, 1.5]) + C.sekil(sivri, MONO.giysi[1], 2.6, 0.3, [1, 1]) +
    C.cizgi([ekle(a, kat(t, boy * 0.12)), ekle(a, kat(t, boy * 0.12))], 2, 0.2);
}

// El çizimi (yerel tanımdan dünyaya). Döner { arka, on } dizgeleri
function elCiz(C, { el, bilek, elAci, elBoy, bs, kisalma, ten, w, yuz }) {
  const tanim = ELLER[el] ? ELLER[el]({ yuz }) : ELLER.acik({ yuz });
  const T = cevir(bilek, elAci, elBoy, bs, kisalma);
  const kayEl = [2, 2];
  const ciz = (o) => {
    const p = o.p.map(T);
    if (o.t === 'sekil') return C.sekil(p, ten, w * 0.9, 0.55, kayEl);
    if (o.t === 'kenar') return C.kenar(p, o.acik.map(T), ten, w * 0.9, 0.55, kayEl);
    return C.cizgi(p, w * (o.w || 0.6), 0.4);
  };
  return { arka: tanim.arka.map(ciz).join(''), on: tanim.on.map(ciz).join(''), nokta: Object.fromEntries(Object.entries(tanim.nokta).map(([k, v]) => [k, T(v)])) };
}

// ---------------------------------------------------------------------------------------------------------------
// KOL: SVG parça dizgesi. Ayrıntı için rapora / kol-test.js'e bak.
export function kolSVG({
  omuz, dirsek = null, bilek, ust = 160, alt = 150, bukulme = 1,
  kalinlik = 64, giysi = MONO.giysi[0], ten = MONO.ten[3],
  el = 'acik', elAci = null, elBoy = null, taraf = 'sag', basparmak = null, yuz = 'sirt', kisalma = null,
  kaynama = 0, tohum = 1, mono = true,
  manset = 'duz',          // 'duz' | 'ribana' (kapüşonlu) | 'gomlek' (ceketin altından gömlek manşeti)
  kolBoyu = 'uzun',        // 'uzun' | 'sivali' (yen dirsek altına sıvanmış, ön kol çıplak: ten okunur)
  araya = '', nesne = null, nesneAci = null, nesneRenk,
  elOnde = false,          // el ön kolun önünde (bilek sert büküldüğünde)
  govdeX = 200,            // gövde ekseni (omuz başının hangi yanı dışarıda)
  omuzUcu = null,          // omuz eğiminin bittiği nokta (insan.js: [200 ± 119, omuzY + 14]); varsayılan omuzdan türetilir
  golge = null,            // { klip: 'url(#id)', kay: [9, 11], opak: 0.12 }: kolun gövdeye düşen düz gölgesi (klip: govdeKes().golgeKlipUrl)
  w = 4.2, kay = [3, 3], genlik = 1,
} = {}) {
  void mono;
  const s = kalemKur(tohum + 11, kaynama, genlik);
  const C = cizer(s, kay);
  const D = dirsek || kolIK(omuz, bilek, ust, alt, bukulme);
  const r0 = kalinlik / 2, r1 = r0 * 0.8, r2 = r0 * 0.58;
  const u = bir(cik(D, omuz)), fo = bir(cik(bilek, D));
  const eb = elBoy || uz(cik(bilek, D)) * 0.72;
  const aci = elAci ?? Math.atan2(fo[1], fo[0]) / D2R;
  const bs = basparmak ?? ((taraf === 'sag' ? 1 : -1) * (yuz === 'avuc' ? 1 : -1));
  const kis = kisalma ?? (el === 'dayanma' ? 0.62 : 1);
  const parca = [];
  const golgeYollari = [];

  // --- Üst kol: omuz ucunda yuvarlak omuz başı (deltoid; kol hangi yöne dönerse dönsün omuzu o kapatır),
  // dirsek ucu yuvarlak, kol bükülünce dış dirsek hafif sivrilir. Omuz başının gövdeye bakan yarısı ince (dikiş),
  // dışa ve yukarı bakan yarısı tam kontur (silüet).
  const buk = Math.acos(sinir(u[0] * fo[0] + u[1] * fo[1], -1, 1)) / D2R;
  const Cu = bol(omuz, D, 5);
  const Ru = Cu.map((_, i) => { const t = i / 5; return r0 * (1 - 0.2 * t) + r0 * 0.05 * Math.sin(Math.PI * Math.min(1, t * 1.6)); });
  const ku = kenarlar(Cu, Ru);
  const ucD = uc(D, u, Ru[5], 8);
  if (buk > 25) { // dış dirsek ucu
    const o = bir(cik(u, fo));
    let en = 0, ei = 0;
    ucD.forEach((q, i) => { const d = bir(cik(q, D)); const v = d[0] * o[0] + d[1] * o[1]; if (v > en) { en = v; ei = i; } });
    const sv = 1 + 0.16 * sinir((buk - 25) / 60, 0, 1);
    ucD[ei] = ekle(D, kat(bir(cik(ucD[ei], D)), Ru[5] * sv));
  }
  // Omuz başı: dış kenar, omuz eğiminin bittiği noktaya (S) çeyrek kavisle bağlanır (gövdenin omuz çizgisi devam eder);
  // iç kenar göğsün üstünde, koltuk altından başlar. Kapak gövdeye gömülü kalır (konturlanmaz).
  const dis = Math.sign(omuz[0] - govdeX) || 1;
  const disL = (ku.L[0][0] - govdeX) * dis >= (ku.R[0][0] - govdeX) * dis;
  const O = disL ? ku.L[0] : ku.R[0], I = disL ? ku.R[0] : ku.L[0];
  const S = omuzUcu || [omuz[0] - dis * 0.28 * r0, omuz[1] - 1.12 * r0];
  const K = [O[0], S[1]];
  const kavis = [ara(ara(O, S, 0.5), K, 0.55), S, ekle(S, kat(bir([-dis * 0.9, -0.45]), r0 * 0.32))];
  const icYol = [ara(I, omuz, 0.5), ara(S, omuz, 0.5)];
  const kapak = disL ? [...icYol, ...kavis.slice().reverse()] : [...kavis, ...icYol.slice().reverse()];
  const ustDolgu = [...ku.L, ...ucD, ...ku.R.slice().reverse(), ...kapak];
  {
    const ss = s(1);
    parca.push(`<path d="${yol(ustDolgu, true, ss)}" fill="${giysi}" transform="translate(${kay[0]} ${kay[1]})"/>`);
    // kontur: omuz kavsinden dış kenara, dirsekten iç kenara (iç kenar koltuk altının biraz altından başlar)
    const Lk = disL ? [...kavis.slice().reverse(), ...ku.L] : [ara(ku.L[0], ku.L[1], 0.6), ...ku.L.slice(1)];
    const Rk = disL ? [ara(ku.R[0], ku.R[1], 0.6), ...ku.R.slice(1)] : [...kavis.slice().reverse(), ...ku.R];
    parca.push(C.cizgi([...Lk, ...ucD, ...Rk.slice().reverse()], w, 1));
  }
  golgeYollari.push(yol(ustDolgu, true, SIFIR));

  // --- Ön kol (yen): dirsek ucu üst kolun dairesinin içinde, konturlanmaz
  const Lf = uz(cik(bilek, D));
  const yenSon = kolBoyu === 'sivali' ? 0.42 : 1.0;       // yenin ön kolda bittiği oran
  const Cf = bol(D, bilek, 6);
  const Rf = Cf.map((_, i) => { const t = i / 6; return t < 0.2 ? r1 * (0.96 + 0.2 * t) : r1 * 1.0 + (r2 - r1) * Math.pow((t - 0.2) / 0.8, 1.3); });
  const kf = kenarlar(Cf, Rf);

  // El ve ön kol derisi (yen bileğin üstüne biner): elOnde değilse el ön koldan önce çizilir
  const E = elCiz(C, { el, bilek, elAci: aci, elBoy: eb, bs, kisalma: kis, ten, w, yuz });
  let nesneD = araya;
  if (nesne) {
    const merkez = E.nokta.tut || E.nokta.avuc;
    const na = nesneAci ?? (aci + bs * 55);
    nesneD += nesneCiz(C, nesne, { merkez, aci: na, boy: eb * 1.25, renk: nesneRenk });
  }
  const elDizge = E.arka + nesneD + E.on;
  if (!elOnde) parca.push(elDizge);

  if (kolBoyu === 'sivali') {
    // çıplak ön kol: yenin bittiği yerden bileğe, bilekte el kökü genişliği
    const rB = eb * 0.15;
    const Cd = bol(ara(D, bilek, 0.3), ara(D, bilek, 1.02), 4);
    const Rd = Cd.map((_, i) => { const t = i / 4; return r1 * 0.92 * (1 - t) + rB * t + r1 * 0.1 * Math.sin(Math.PI * t * 0.8); });
    const kd = kenarlar(Cd, Rd);
    parca.push(C.kenar([...kd.L, ...kd.R.slice().reverse()], kd.L, ten, w * 0.9, 0.8, [2.5, 2.5]) + C.cizgi(kd.R, w * 0.9, 0.8));
  }
  {
    const n = Math.round(6 * yenSon);
    const Ls = kf.L.slice(0, n + 1), Rs = kf.R.slice(0, n + 1);
    const c0 = Cf[0], rc = r1 * 0.96;
    const ucBas = uc(c0, kat(fo, -1), rc, 6);
    const ucSon = Cf[n];
    // yen ağzı: bileğe doğru hafif bombeli
    const ag = [ara(Ls[n], Rs[n], 0.0), ekle(ara(Ls[n], Rs[n], 0.5), kat(fo, Rf[n] * 0.32)), ara(Ls[n], Rs[n], 1.0)];
    const dolgu = [...Ls, ...ag.slice(1, -1), ...Rs.slice().reverse(), ...ucBas];
    parca.push(C.dolguYalniz(dolgu, giysi));
    golgeYollari.push(yol(dolgu, true, SIFIR));
    // kenarlar dirseğin biraz ilerisinden başlar (üst kolun dairesine çizgi bırakmasın)
    const Lk = [ara(Ls[0], Ls[1], 0.35), ...Ls.slice(1)], Rk = [ara(Rs[0], Rs[1], 0.35), ...Rs.slice(1)];
    parca.push(C.cizgi(Lk, w), C.cizgi(Rk, w));
    // yen ağzı (açıklık): iki çizgi, ağız elipsi hissi
    parca.push(C.cizgi(ag, w * 0.92, 0.8));
    const r = Rf[n];
    if (kolBoyu === 'sivali') {
      // sıvanmış yen: kalın katlama bandı
      const geri = kat(fo, -r * 0.55);
      const b1 = [ekle(Ls[n], geri), ekle(ekle(ara(Ls[n], Rs[n], 0.5), geri), kat(fo, r * 0.28)), ekle(Rs[n], geri)];
      parca.push(C.cizgi(b1, w * 0.62, 0.7));
    } else if (manset === 'ribana') {
      const geri = kat(fo, -r * 0.62);
      const m0 = ekle(Ls[n], geri), m1 = ekle(Rs[n], geri), orta = ekle(ekle(ara(m0, m1, 0.5), kat(fo, r * 0.3)), [0, 0]);
      parca.push(C.cizgi([m0, orta, m1], w * 0.62, 0.7));
      for (const t of [0.28, 0.5, 0.72]) {
        const p0 = ekle(ara(m0, m1, t), kat(fo, r * 0.12)), p1 = ekle(ara(Ls[n], Rs[n], t), kat(fo, -r * 0.05 + r * 0.3 * (1 - Math.abs(t - 0.5) * 2) * 0.9));
        parca.push(C.cizgi([p0, p1], w * 0.42, 0.4));
      }
    } else if (manset === 'gomlek') {
      // ceket yeninin altından gömlek manşeti: açık bant
      const ileri = kat(fo, r * 0.5), rr = r * 0.86, nn = dik(fo);
      const c = ucSon;
      const bant = [ekle(c, kat(nn, rr)), ekle(ekle(c, kat(nn, rr)), ileri), ekle(ekle(c, kat(nn, -rr)), ileri), ekle(c, kat(nn, -rr))];
      parca.push(C.sekil(bant, '#f4f1ea', w * 0.8, 0.6, [2, 2]));
      parca.push(C.cizgi(ag, w * 0.92, 0.8)); // ceket ağzı yeniden üstte
    } else {
      const geri = kat(fo, -r * 0.5);
      parca.push(C.cizgi([ekle(Ls[n], geri), ekle(ekle(ara(Ls[n], Rs[n], 0.5), geri), kat(fo, r * 0.3)), ekle(Rs[n], geri)], w * 0.5, 0.6));
    }
  }
  // Dirsek kıvrımları: büküm varsa iç dirseğin iki yanında, kola sarılan iki kavis (yen kumaşı toplanır)
  if (buk > 22) {
    const k = sinir((buk - 22) / 70, 0.35, 1);
    const yanU = (() => { const n = dik(u); return (n[0] * fo[0] + n[1] * fo[1]) > 0 ? n : kat(n, -1); })();   // üst kolda iç yan
    const yanF = (() => { const n = dik(fo); return (n[0] * u[0] + n[1] * u[1]) < 0 ? n : kat(n, -1); })();  // ön kolda iç yan
    const r = Ru[5];
    const A0 = ekle(ekle(D, kat(u, -r * 1.05)), kat(yanU, r * 0.98)), A1 = ekle(ekle(D, kat(u, -r * 0.62)), kat(yanU, r * 0.25)), A2 = ekle(ekle(D, kat(u, -r * 0.5)), kat(yanU, -r * 0.3 * k));
    if (buk < 100) parca.push(C.cizgi([A0, A1, A2], w * 0.55, 0.5)); // sıkı katlanmada üst kol kıvrımı ön kolun altında kalır
    const B0 = ekle(ekle(D, kat(fo, r * 1.0)), kat(yanF, r * 0.96)), B1 = ekle(ekle(D, kat(fo, r * 0.62)), kat(yanF, r * 0.28)), B2 = ekle(ekle(D, kat(fo, r * 0.55)), kat(yanF, -r * 0.18 * k));
    parca.push(C.cizgi([B0, B1, B2], w * 0.5, 0.5));
  }
  if (elOnde) parca.push(elDizge);
  if (golge && golge.klip) {
    const [gx, gy] = golge.kay || [9, 11];
    parca.unshift(`<g clip-path="${golge.klip}"><path d="${golgeYollari.join(' ')}" fill="${golge.renk || M}" opacity="${golge.opak ?? 0.12}" transform="translate(${gx} ${gy})"/></g>`);
  }
  return parca.join('');
}
function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }

// ---------------------------------------------------------------------------------------------------------------
// KUŞ BAKIŞI EL (çekmeceyi tutan el, üstten): el sırtı, boğumlar, kenarı saran parmaklar (tırnak izi), yandan başparmak.
// merkez: tutma noktası (parmakların kenara bindiği yer); aci: parmakların yönü (−90 = ekranda yukarı);
// boy: el boyu; kolUzun: kadraja giren ön kol boyu; araya: tutulan kenar/kol (parmakların altında, başparmağın üstünde).
export function elUstten({
  merkez, aci = -90, boy = 140, ten = MONO.ten[1], giysi = MONO.giysi[0], taraf = 'sag', tutma = true,
  kaynama = 0, tohum = 3, kolUzun = 300, kalinlik = null, manset = 'duz', kolBoyu = 'uzun', araya = '', w = 4.2, kay = [3, 3],
} = {}) {
  const s = kalemKur(tohum + 29, kaynama);
  const C = cizer(s, kay);
  const bs = taraf === 'sag' ? -1 : 1; // sağ el üstten: başparmak solda (ekran), parmaklar yukarıyken
  // yerel: tutma noktası x = 0.6 → bilek = merkez − 0.6
  const T0 = cevir([0, 0], aci, boy, bs);
  const bilek = cik(merkez, T0([0.6, 0]));
  const T = cevir(bilek, aci, boy, bs);
  const P = (pts) => pts.map(T);
  const parca = [];
  const kayEl = [2.5, 2.5];
  // ön kol (yen)
  const rK = (kalinlik ?? boy * 0.44) / 2;
  const yenUc = kolBoyu === 'sivali' ? -0.75 : -0.1;
  const Ck = egri([[-kolUzun / boy, 0], [yenUc, 0]], 4);
  const Rk = Ck.map((_, i) => rK * (1.12 - 0.12 * i / 4));
  if (kolBoyu === 'sivali') {
    const Cd = egri([[-0.8, 0], [0.02, 0]], 4), Rd = Cd.map((_, i) => (rK * 0.95 + (boy * 0.15 - rK * 0.95) * i / 4) / boy);
    const kd = kenarlar(Cd, Rd);
    parca.push(C.kenar(P([...kd.L, ...kd.R.slice().reverse()]), P(kd.L), ten, w * 0.9, 0.7, kayEl) + C.cizgi(P(kd.R), w * 0.9, 0.7));
  }
  // başparmak (tutma: kenarın altına girer → araya ondan sonra)
  const bas = parmak([0.12, 0.17], tutma ? 26 : 40, 0.42, 0.078, -16, 0.06);
  parca.push(C.sekil(P(bas), ten, w * 0.9, 0.55, kayEl));
  // el sırtı
  const sirt = [[0.5, 0.235], [0.34, 0.25], [0.18, 0.23], [0.02, 0.17], [-0.12, 0.15], [-0.12, -0.15], [0.02, -0.16], [0.2, -0.2], [0.38, -0.225], [0.5, -0.21], [0.56, -0.1], [0.57, 0.02], [0.56, 0.14]];
  parca.push(C.kenar(P(sirt), P(sirt.slice(0, 10)), ten, w * 0.9, 0.55, kayEl));
  // tendon / sırt çizgileri (hafif)
  parca.push(C.cizgi(P([[0.1, 0.06], [0.3, 0.1], [0.45, 0.12]]), w * 0.42, 0.4), C.cizgi(P([[0.12, -0.06], [0.3, -0.08], [0.44, -0.1]]), w * 0.42, 0.4));
  parca.push(araya);
  // parmaklar: boğumdan kenara; tutmada uçlar kısa (kenarın ötesine kıvrılır), tırnak yayı
  const F = [[-0.16, 0.055, 0.25], [-0.055, 0.062, 0.31], [0.055, 0.064, 0.33], [0.165, 0.062, 0.3]];
  F.forEach(([y, r, l], i) => {
    const L = tutma ? l : l * 1.35;
    const pts = parmak([0.5, y], (y * 18) * (tutma ? 0.2 : 1), L, r, 0, 0.06);
    parca.push(C.sekil(P(pts), ten, w * 0.9, 0.55, kayEl));
    // boğum yayı ve tırnak
    // orta boğum kırışığı (parmağı enine kesen kısa, hafif kavisli çizgi)
    const xb = 0.5 + L * 0.55;
    parca.push(C.cizgi(P([[xb, y - r * 0.5], [xb + 0.01, y], [xb, y + r * 0.5]]), w * 0.38, 0.25));
  });
  // yen en üstte (bileğin üstüne biner)
  if (kolBoyu !== 'sivali' || true) {
    const kk = kenarlar(Ck, Rk.map((r) => r / boy));
    const n = Ck.length - 1;
    const agiz = [kk.L[n], ekle(Ck[n], [rK * 0.3 / boy, 0]), kk.R[n]];
    parca.push(C.dolguYalniz(P([...kk.L, ...agiz.slice(1, -1), ...kk.R.slice().reverse()]), giysi));
    parca.push(C.cizgi(P(kk.L), w), C.cizgi(P(kk.R), w), C.cizgi(P(agiz), w * 0.92, 0.8));
    const g = Rk[n] / boy;
    if (manset === 'ribana' || kolBoyu === 'sivali') parca.push(C.cizgi(P([[Ck[n][0] - g * 0.6, g], [Ck[n][0] - g * 0.6 + g * 0.25, 0], [Ck[n][0] - g * 0.6, -g]]), w * 0.6, 0.6));
  }
  return parca.join('');
}

// ---------------------------------------------------------------------------------------------------------------
// GÖVDE KESİMİ: insan.js gövdesi kolsuz bir "pelerin" silüetidir (omuzdan aşağı ±162–176). Kol çizilen yanda bu
// silüeti göğüs hattından kesip (clipPath) göğüs yan konturunu yeniden çizer; kol, omuz başından çıkar.
// Kullanım (kutu birimi, kişinin svg'sinin içinde):
//   const G = govdeKes(p, { id: 'a1', kaynama });  →  `${G.tanim}<g ${G.klip}>${kisiSVG(...)}</g>${G.kontur}${kollar}`
// kollar golge: { klip: G.golgeKlipUrl } ile gövdeye gölge düşürebilir.
export function govdeKes(p, { sol = true, sag = true, id = 'govde', gogus = 108, kaynama = 0, tohum = 5, w = 4.2 } = {}) {
  const cx = 200, ceneY = GOZ_Y + 4 + p.yuzBoy, omuzY = ceneY + 40, y0 = omuzY + 10;
  // omuz eğiminin bittiği noktadan (118, +14) koltuk altına ve göğüs yanına; omuz başını kol çizer
  const yan = (yon) => egri([[cx + yon * 119, omuzY + 14], [cx + yon * 126, omuzY + 44], [cx + yon * (gogus + 8), omuzY + 86], [cx + yon * (gogus + 1), omuzY + 124], [cx + yon * gogus, omuzY + 210], [cx + yon * (gogus + 4), 560], [cx + yon * (gogus + 9), 680]], 14);
  const R = yan(1), L = yan(-1);
  const d = (pts) => yol(pts, false, SIFIR).replace(/^M/, 'L');
  const kd = `M-1000 -1000 L1400 -1000 ` +
    (sag ? `L1400 ${y0} L${cx + 119} ${y0} ${d(R)} L${cx + gogus + 9} 900 ` : `L1400 900 `) +
    (sol ? `L${cx - gogus - 9} 900 ${d(L.slice().reverse())} L${cx - 119} ${y0} L-1000 ${y0} Z` : `L-1000 900 Z`);
  // gölge alanı: yalnız gövde (boyun kökünden omuzlara, göğüs yanları)
  const hw = p.yuzEn;
  const gd = `M${cx - hw * 0.5} ${ceneY + 10} L${cx + hw * 0.5} ${ceneY + 10} L${cx + 118} ${omuzY + 14} ` +
    (sag ? `${d(R)} L${cx + gogus + 9} 900 ` : `L${cx + 164} ${omuzY + 56} L${cx + 180} 900 `) +
    (sol ? `L${cx - gogus - 9} 900 ${d(L.slice().reverse())} ` : `L${cx - 180} 900 L${cx - 164} ${omuzY + 56} `) + `L${cx - 118} ${omuzY + 14} Z`;
  const s = kalemKur(tohum + 41, kaynama);
  const C = cizer(s, [3, 3]);
  const kontur = (sag ? C.cizgi(R, w) : '') + (sol ? C.cizgi(L, w) : '');
  return {
    tanim: `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${kd}"/></clipPath><clipPath id="${id}-g" clipPathUnits="userSpaceOnUse"><path d="${gd}"/></clipPath></defs>`,
    klip: `clip-path="url(#${id})"`, golgeKlipUrl: `url(#${id}-g)`, kontur, omuzY, ceneY,
  };
}
