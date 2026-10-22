// Sahne 4b, HIZLI GEÇİŞLER (v06; s4-frp'den sonra, s5-kalabalik'tan önce; iç kareler 0–491, ~8,2 sn). Kullanıcı notu:
// "fikirler birleşmeden önce ikişer saniyelik hızlı sahneler". Sorun sahnesi DEĞİL: Oktos ürünlerinin hayattaki hızlı
// görüntüleri. Düz kesmeler, her çekimde küçük bir kamera itişi ya da kayması (ölü kare yok); konuşma yok.
// #4b.1 (k0–155) Bahçıvan: genç bahçıvan (geniş kenarlı hasır şapka, önlük, sıvalı kollar) tezgâhta 8×8 fide kasasına fide
//      diker; elleri toprakta (parmak uçları toprak yığınının altında). Yanında altlıklı kasalar üst üste istif, en üsttekinin
//      her gözünde bir filiz. k60 başını kaldırıp gülümser; elinin tersiyle alnını siler, alnında toprak izi kalır.
//      Kasalar baskı ürünümüz gibi: dış duvarlarda katman çizgileri, her katta altlığın (taşma tablası) kenarı. Tezgâh ve
//      kasalar küçük bir perspektif izdüşümüyle (kamera3: Y yukarı, Z kameraya, mm) çizilir; ızgara gerçek kısalmayla okunur.
// #4b.2 (k156–263) QR, modem: rafta yönlendirici (anten, yanıp sönen ışıklar), üstünde dik QR plakası (Wi-Fi simgesi).
//      Telefon tutan el alttan girer; vizörde QR, köşe işaretleri kilitlenir, küçük turuncu tik (tik).
// #4b.3 (k264–371) QR, kafe masası: mermer masa, çadır QR standı (cizimler.js qrStandi biçimi, gerçek QR deseniyle), buharı
//      tüten fincan, küçük vazo; bir el ikinci fincanı tabağıyla masaya bırakır (tik) ve sağ üste çekilir.
// #4b.4 (k372–491) QR, kartvizit: başka bir masa KUŞ BAKIŞI (ahşap tahtalar, defter, kalem, fincan, saksı, telefon); el
//      QR'lı kartviziti kadrajın ortasına kaydırır (tik), kalkıp çekilir (kol.js elUstten).
// Sözleşme: kur(ctx) yalnız ctx.tl'ye İÇ kare zamanlı tween ekler (ARALIK [0, SON]); her çekim kendi katmanında, kamerayı
// kendi ilk karesinde koyar. QR desenleri tohumlu (sürüm 1 iskeleti: üç konum karesi, zamanlama şeritleri) ve durağan;
// konturlar kaynar (8 fps). Kişi pozu 12 fps (tl.call, ctx.adim); el ve nesne hareketi 60 fps, ctx.herKare ile kare
// numarasından hesaplanır (geri sarmada da aynı kare). Turuncu yalnız #4b.2'deki tikte.
import { kisiSVG, MONO, PALET, BOY, GOZ_Y, yol, rng, oval } from '../insan.js';
import { kolSVG, omuzlar, govdeKes, bilekBul, elNoktasi, elUstten } from '../kol.js';
import { CIZIMLER } from './cizimler.js';

export const ARALIK = [0, 491];
const [BAS, SON] = ARALIK;
// Çekim sınırları (iç kare): bahçıvan, modem, kafe, kartvizit
const K1 = 0, K2 = 156, K3 = 264, K4 = 372;
const D2R = Math.PI / 180;
const M = PALET.murekkep;
const f1 = (v) => (+v).toFixed(1);
const lerp = (a, b, t) => a + (b - a) * t;
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const aciDer = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;
// Tonlar (mono): toprak, baskı kasası (açık PLA), altlık, ahşap, porselen
const TON = {
  toprak: '#5f5a53', kasaUst: '#ece7dd', kasaOn: '#e2ddd3', kasaSol: '#ece7dd', kasaSag: '#cfc9bd',
  altUst: '#bdb6a9', altOn: '#a59e91', altSol: '#b0a99c', altSag: '#8d867a', yaprak: '#d8d2c7',
  ahsap: '#cfc9bd', ahsapOn: '#a59e91', ahsapK: '#8d867a', cizgi: '#8d867a', beyaz: '#f4f1ea', koyu: '#46423d',
};

// El titremeli kalem (s4-frp ile aynı kurgu): her çağrı kendi sabit sapmasını, kareye göre kaynamasını alır
function kalem(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}
// Dizge çizimleri (kişi kutusunda): cz açık çizgi, sk dolgulu kapalı şekil (dolgu konturdan kayık)
function dizge(tohum, kaynama, genlik = 1) {
  const s = kalem(tohum, kaynama, genlik);
  const cz = (pts, w = 4.2, renk = M, op = 1) => `<path d="${yol(pts, false, s())}" fill="none" stroke="${renk}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  const sk = (pts, dolgu, w = 4.2, kay = [3, 3]) => {
    const d = yol(pts, true, s());
    return `<path d="${d}" fill="${dolgu}" transform="translate(${kay[0]} ${kay[1]})"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  return { cz, sk };
}
// Düz kenarlı çokgen: kenarları eşit aralıklı noktalara böler (Catmull-Rom kenarı şişirmesin, köşe sıkı yuvarlansın)
function kenarla(pts, ad = 24, kapali = true) {
  const out = [], n = pts.length;
  for (let i = 0; i < (kapali ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / ad));
    for (let j = 0; j < m; j++) out.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]);
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}
// Yuvarlak köşeli dikdörtgen (köşe yayları 4 nokta, kenarlar bölünmüş)
function yDortgen(x0, y0, x1, y1, r, ad = 24) {
  const k = [];
  const yay = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * D2R; k.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  yay(x1 - r, y0 + r, -90); yay(x1 - r, y1 - r, 0); yay(x0 + r, y1 - r, 90); yay(x0 + r, y0 + r, 180);
  return kenarla(k, ad, true);
}
const dYol = (pts) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';
// Çift doğrusal dörtgen eşlemesi: A sol üst, B sağ üst, Cc sağ alt, D sol alt; (u, v) ∈ [0, 1]
const dortgen = (A, B, Cc, D) => (u, v) => {
  const a = (1 - u) * (1 - v), b = u * (1 - v), c = u * v, d = (1 - u) * v;
  return [a * A[0] + b * B[0] + c * Cc[0] + d * D[0], a * A[1] + b * B[1] + c * Cc[1] + d * D[1]];
};

// ---------- QR (sürüm 1 iskeleti, 21×21): üç konum karesi + ayırma bandı, zamanlama şeritleri, tohumlu veri modülleri.
// Gerçek bir bağlantıyı kodlamaz (animatik); okunuşu QR gibidir.
function qrDesen(tohum, n = 21) {
  const r = rng(tohum * 7 + 3);
  const m = Array.from({ length: n }, () => Array(n).fill(false));
  const ayrik = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!ayrik(x, y)) m[y][x] = r() < 0.48;
  for (let i = 8; i < n - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
  const konum = (x0, y0) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) m[y0 + y][x0 + x] = Math.max(Math.abs(x - 3), Math.abs(y - 3)) !== 2; };
  konum(0, 0); konum(n - 7, 0); konum(0, n - 7);
  return m;
}
// Koyu modüllerin tek yolu (komşu kareler aynı yolda: dikiş çıkmaz). map: (u, v) → ekran; sessiz bölge modül cinsinden
function qrYol(m, map, sessiz = 1.5) {
  const n = m.length, top = n + 2 * sessiz, p = (i, j) => map((i + sessiz) / top, (j + sessiz) / top);
  let d = '';
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (m[j][i]) {
    const q = [p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1)];
    d += `M${f1(q[0][0])} ${f1(q[0][1])}L${f1(q[1][0])} ${f1(q[1][1])}L${f1(q[2][0])} ${f1(q[2][1])}L${f1(q[3][0])} ${f1(q[3][1])}Z`;
  }
  return d;
}

// ---------- Küçük perspektif kamera (mm; Y yukarı, Z kameraya doğru, yuvarlanma yok): P(nokta) → ekran, m(nokta) → px/mm
function kamera3(goz, hedef, f, [sx, sy]) {
  const n3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const fw = n3([hedef[0] - goz[0], hedef[1] - goz[1], hedef[2] - goz[2]]);
  const sg = n3([-fw[2], 0, fw[0]]);
  const up = [sg[1] * fw[2] - sg[2] * fw[1], sg[2] * fw[0] - sg[0] * fw[2], sg[0] * fw[1] - sg[1] * fw[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rel = (p) => [p[0] - goz[0], p[1] - goz[1], p[2] - goz[2]];
  return {
    goz,
    P: (p) => { const d = rel(p), z = dot(d, fw); return [sx + f * dot(d, sg) / z, sy - f * dot(d, up) / z]; },
    m: (p) => f / dot(rel(p), fw),
  };
}
// Yerel (u, y, v) → dünya: (X, Z) merkezli, Y ekseni çevresinde aci derece dönük
function yerel(X, Z, aci) {
  const c = Math.cos(aci * D2R), s = Math.sin(aci * D2R);
  const f = (u, y, v) => [X + u * c - v * s, y, Z + u * s + v * c];
  f.yon = (nu, nv) => [nu * c - nv * s, 0, nu * s + nv * c];
  return f;
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, W, H, VURGU, yer, adim } = ctx;
  const ka = (n) => k(adim(n)); // 12 fps poz ızgarası
  let tohumSayac = 4100;
  const T = () => tohumSayac++;
  const C = (ust, pts, o = {}) => cizgi(ust, pts, { tohum: T(), ...o });
  const es = (e) => (typeof e === 'function' ? e : gsap.parseEase(e));
  const EO = es(E.EO), EI = es(E.EI), BO = es('back.out(1.7)'), P3O = es('power3.out');
  // f karesinin [k0, k1] içindeki ilerlemesi (0→1, eğri e)
  const ilerle = (f, k0, k1, e = (x) => x) => e(sinir((f - k0) / (k1 - k0), 0, 1));
  let kayIndis = 0; // çekirdeğin son kaynama indisi (herKare çizimleri aynı çizimle yeniden kurar)
  ctx.kaynayanlar.add((i) => { kayIndis = i; });

  ctx.vurus('4b.1', 'Bahçıvan: fide diker, alnını siler', K1, K2 - 1);
  ctx.vurus('4b.2', 'QR: modemin üstünde, telefonla okutulur', K2, K3 - 1);
  ctx.vurus('4b.3', 'QR: kafe masasında, fincan bırakılır', K3, K4 - 1);
  ctx.vurus('4b.4', 'QR: kuş bakışı kartvizit kaydırılır', K4, SON);

  // Her çekim kendi katmanında: k0'da açılır, k1 + 1'de kapanır. Görünürlük tl.set ile değil, her karede kare numarasından
  // kurulur: ARALIK 0'dan başladığı için alt çizelgenin tam 0. anındaki set ve call'lar GSAP'ta uygulanmıyor (çocuk zamanı
  // 0'a yuvarlanıyor), tam filmde ilk kare boş kalıyordu (?ic=1 testi 1e-4'ten başladığı için görünmüyordu).
  const katmanlar = [];
  const katmanAc = (ad, k0, k1) => {
    const L = ctx.katman(ad, 10);
    gsap.set(L.div, { autoAlpha: 0 });
    katmanlar.push({ L, k0, k1, acik: false });
    return L;
  };
  ctx.herKare((f) => {
    for (const K of katmanlar) {
      const ac = f >= K.k0 && f <= K.k1;
      if (ac !== K.acik) { K.acik = ac; gsap.set(K.L.div, { autoAlpha: ac ? 1 : 0 }); }
    }
  });
  // Kamera: çekimin ilk karesinde A'ya koyulur, k1'e dek B'ye gider. A, B: [dünya x, dünya y (ekran ortasına), ölçek].
  // Ölçek ≥ 1 kalır ve kayma (1 − 1/ölçek)·W/2'yi geçmez: dünya kadrajı hep doldurur.
  const kamera = (k0, k1, A, B, ease = 'none') => {
    const a = ctx.odak(A[0], A[1], A[2]), b = ctx.odak(B[0], B[1], B[2]);
    ctx.kameraKoy(k0, a);
    tl.fromTo(ctx.kamera, a, { ...b, duration: k(k1 + 1 - k0), ease, immediateRender: false }, k(k0));
  };
  tl.set(ctx.itme, { x: 0, y: 0 }, k(BAS));
  // Bir grubun dönüşümünü yaz (herKare): öteleme, dönme (derece), ölçek
  const donustur = (g, x, y, r = 0, s = 1) => g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(r)}) scale(${(+s).toFixed(4)})`);

  // QR çizimi: beyaz zemin dörtgeni + koyu modüller (durağan) + ince kontur (kaynar)
  const qrKoy = (ust, A, B, Cc, D, tohum, { zemin = TON.beyaz, kontur = 2.4 } = {}) => {
    const g = el(ust, 'g');
    el(g, 'path', { d: dYol([A, B, Cc, D]), fill: zemin });
    el(g, 'path', { d: qrYol(qrDesen(tohum), dortgen(A, B, Cc, D)), fill: M });
    if (kontur) C(g, kenarla([A, B, Cc, D], 18), { kapali: true, kalinlik: kontur, genlik: 0.5, renk: TON.cizgi });
    return g;
  };

  // =========================================================================== #4b.1 BAHÇIVAN (k0–155)
  ctx.isaret(K1, 'kesme');
  const L1 = katmanAc('s4b-bahce', K1, K2 - 1);
  const sahne1 = () => { const t = tl.time(); return t >= k(K1) - 0.02 && t < k(K2); };
  // Yerleşim (mm, Y yukarı, Z kameraya). Yatay: bahçıvan solda, istif sağ önde. Dikey: bahçıvan ortada, istif sağ önde.
  const B1 = yer({
    goz: [0, 850, 1050], hedef: [0, 0, 0], f: 1500, merkez: [960, 700],
    masa: { x0: -1600, x1: 1600, z0: -280, z1: 300 }, dikmeler: [-1180, 1180],
    kisi: { X: -300, s: 1.0 }, tepsi: { X: -300, Z: -50, aci: 3 }, yigin: { X: 430, Z: 95, aci: -11 },
    paket: { X: 60, Z: 170, aci: -18 }, yigin2: { X: -720, Z: 40 }, kurek: { X: -760, Z: 210, aci: 30 },
    sera: { x0: -60, x1: 1980, ad: 236, y1: 560 }, kam: [[990, 548, 1.16], [1002, 536, 1.22]],
  }, {
    // dikey: kamera daha yüksek ve dik; istif kasanın önünde, sağda (tezgâhın derinliği kadrajın boyunu doldurur)
    goz: [0, 1200, 1050], hedef: [0, 0, 160], f: 1850, merkez: [540, 1260],
    masa: { x0: -1100, x1: 1100, z0: -260, z1: 520 }, dikmeler: [-500, 500],
    kisi: { X: -40, s: 1.12 }, tepsi: { X: -40, Z: -60, aci: 3 }, yigin: { X: 120, Z: 300, aci: -9 },
    paket: { X: -250, Z: 380, aci: 14 }, yigin2: { X: -430, Z: -20 }, kurek: { X: -420, Z: 250, aci: 34 },
    sera: { x0: -40, x1: 1120, ad: 214, y1: 900 }, kam: [[560, 1080, 1.12], [568, 1058, 1.17]],
  });
  const K3D = kamera3(B1.goz, B1.hedef, B1.f, B1.merkez);
  const P3 = (x, y, z) => K3D.P([x, y, z]);
  const gArka = el(L1.svg, 'g'), gGovde = el(L1.svg, 'g'), gMasa = el(L1.svg, 'g'), gTepsi = el(L1.svg, 'g');
  const gKol = el(L1.svg, 'g'), gYigin = el(L1.svg, 'g');

  // ---------- Arka plan: seranın açık gri kayıtları (pus), tepeden sarkan bir sarmaşık
  {
    const S = B1.sera, ac = { kalinlik: 5, renk: '#d6d0c5', genlik: 0.8 };
    for (let x = S.x0; x <= S.x1; x += S.ad) C(gArka, kenarla([[x, -40], [x + 4, S.y1]], 60, false), ac);
    for (const y of [S.y1 * 0.12, S.y1 * 0.5]) C(gArka, kenarla([[S.x0 - 40, y], [S.x1 + 40, y + 6]], 60, false), ac);
    for (let x = S.x0; x < S.x1; x += S.ad * 2) C(gArka, [[x + 10, S.y1 * 0.12 + 8], [x + S.ad - 10, S.y1 * 0.5 - 8]], { ...ac, kalinlik: 3 });
    // sarmaşık: sol üstten sarkan dal, yapraklar açık gri
    const dal = [[S.x0 + S.ad * 0.4, -30], [S.x0 + S.ad * 0.55, S.y1 * 0.15], [S.x0 + S.ad * 0.42, S.y1 * 0.3], [S.x0 + S.ad * 0.6, S.y1 * 0.42]];
    C(gArka, dal, { kalinlik: 3, renk: '#bdb6a9' });
    dal.slice(1).forEach(([x, y], i) => {
      for (const yon of [-1, 1]) {
        const uc = [x + yon * 34, y + 18], o = [x + yon * 17, y + 9];
        C(gArka, [[x, y], [o[0] - 6, o[1] + 10 * yon], uc, [o[0] + 6, o[1] - 10 * yon]], { kapali: true, dolgu: '#e2ddd3', kalinlik: 2.6, renk: '#bdb6a9', kay: [0, 0] });
      }
      void i;
    });
  }

  // ---------- Tezgâh: ayaklar, ön kalınlık, üst yüz (tahtalar), dökülmüş toprak kırıntıları
  {
    const { x0, x1, z0, z1 } = B1.masa;
    // ayaklar kısa tutulur: dik bakışta uzun dikmeler kadrajın altında yana açılıyor
    for (const x of B1.dikmeler) C(gMasa, kenarla([P3(x - 34, -40, z1 - 40), P3(x + 34, -40, z1 - 40), P3(x + 34, -520, z1 - 40), P3(x - 34, -520, z1 - 40)], 40), { kapali: true, dolgu: TON.ahsapK, kalinlik: 4.4 });
    C(gMasa, kenarla([P3(x0, 0, z1), P3(x1, 0, z1), P3(x1, -44, z1), P3(x0, -44, z1)], 40), { kapali: true, dolgu: TON.ahsapOn, kalinlik: 4.4 });
    C(gMasa, kenarla([P3(x0, 0, z0), P3(x1, 0, z0), P3(x1, 0, z1), P3(x0, 0, z1)], 40), { kapali: true, dolgu: TON.ahsap, kalinlik: 4.4 });
    const nz = 4;
    for (let i = 1; i < nz; i++) { const z = lerp(z0, z1, i / nz); C(gMasa, kenarla([P3(x0, 0, z), P3(x1, 0, z)], 50, false), { kalinlik: 2.4, renk: TON.ahsapK, genlik: 0.6 }); }
    const r = rng(77);
    let d = '';
    for (let i = 0; i < 26; i++) {
      const p = P3(B1.tepsi.X + (r() - 0.5) * 620, 0, B1.tepsi.Z + 150 + r() * 120), rr = 1.6 + r() * 2.6;
      d += `M${f1(p[0] - rr)} ${f1(p[1])}a${f1(rr)} ${f1(rr * 0.7)} 0 1 0 ${f1(rr * 2)} 0a${f1(rr)} ${f1(rr * 0.7)} 0 1 0 ${f1(-rr * 2)} 0Z`;
    }
    el(gMasa, 'path', { d, fill: TON.toprak, opacity: 0.85 });
  }

  // ---------- Fide kasası (baskı ürünü): altlık + 8×8 gözlü kasa; kat kadar üst üste. Çizim sırası her katta: altlığın üst
  // yüzü → kasanın yan yüzleri (katman çizgili) ve üstü → altlığın yan yüzleri (kasanın dibini örten dudak).
  const HUC = 30, IC = 240, DIS = 250, ALT = 270, ALT_H = 14, ADIM = 52;
  function kutu3(ust, Lw, { a, b, y0, y1, renk, yanlar = true, ustYuz = true, katman = 0, kalinlik = 3.6 }) {
    const Q = (u, y, v) => K3D.P(Lw(u, y, v));
    const gor = (nu, nv, u, y, v) => { const n = Lw.yon(nu, nv), c = Lw(u, y, v), g = K3D.goz; return n[0] * (g[0] - c[0]) + n[2] * (g[2] - c[2]) > 0; };
    const ad = 22;
    if (yanlar) {
      const yuzler = [
        { p: [[-a, b], [a, b]], n: [0, 1], renk: renk.on },
        { p: [[-a, -b], [-a, b]], n: [-1, 0], renk: renk.sol },
        { p: [[a, b], [a, -b]], n: [1, 0], renk: renk.sag },
      ];
      for (const yz of yuzler) {
        const [[u0, v0], [u1, v1]] = yz.p;
        if (!gor(yz.n[0], yz.n[1], (u0 + u1) / 2, (y0 + y1) / 2, (v0 + v1) / 2)) continue;
        C(ust, kenarla([Q(u0, y1, v0), Q(u1, y1, v1), Q(u1, y0, v1), Q(u0, y0, v0)], ad), { kapali: true, dolgu: yz.renk, kalinlik, kay: [1.5, 1.5] });
        // baskı katman çizgileri (dış duvar boyunca yatay, ince ve açık: sayfa gibi okunmasın)
        for (let i = 1; i <= katman; i++) {
          const y = lerp(y0, y1, i / (katman + 1));
          C(ust, kenarla([Q(u0, y, v0), Q(u1, y, v1)], 30, false), { kalinlik: 1.1, renk: '#bdb6a9', genlik: 0.35 });
        }
      }
    }
    if (ustYuz) C(ust, kenarla([Q(-a, y1, -b), Q(a, y1, -b), Q(a, y1, b), Q(-a, y1, b)], ad), { kapali: true, dolgu: renk.ust, kalinlik, kay: [1.5, 1.5] });
  }
  // Filiz: gövde + iki çenek yaprağı (tohumlu boy ve eğim); taban dünya noktası, ölçek o noktadaki px/mm
  function filiz(ust, w3, tohum, olc = 1) {
    const r = rng(tohum * 13 + 5), b = K3D.P(w3), mm = K3D.m(w3);
    const h = (13 + r() * 6) * mm * olc, eg = (r() - 0.5) * 0.5;
    const tp = [b[0] + h * eg * 0.4, b[1] - h];
    C(ust, [b, [b[0] + h * eg * 0.12, b[1] - h * 0.5], tp], { kalinlik: Math.max(1.6, 2.1 * mm), genlik: 0.4 });
    for (const yon of [-1, 1]) {
      const a = (-90 + yon * (50 + r() * 20)) * D2R, L = (8 + r() * 2.5) * mm * olc;
      const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], o = [tp[0] + d[0] * L * 0.5, tp[1] + d[1] * L * 0.5];
      C(ust, [tp, [o[0] + n[0] * L * 0.3, o[1] + n[1] * L * 0.3], [tp[0] + d[0] * L, tp[1] + d[1] * L], [o[0] - n[0] * L * 0.3, o[1] - n[1] * L * 0.3]],
        { kapali: true, dolgu: TON.yaprak, kalinlik: Math.max(1.3, 1.7 * mm), genlik: 0.35, kay: [1, 1] });
    }
  }
  const RENK_KASA = { on: TON.kasaOn, sol: TON.kasaSol, sag: TON.kasaSag, ust: TON.kasaUst };
  const RENK_ALT = { on: TON.altOn, sol: TON.altSol, sag: TON.altSag, ust: TON.altUst };
  function kasaKur(ust, { X, Z, aci, kat = 1, dolu = () => false, tohum = 0 }) {
    const Lw = yerel(X, Z, aci), Q = (u, y, v) => K3D.P(Lw(u, y, v));
    const g = el(ust, 'g');
    const gl = ALT / 2;
    el(g, 'path', { d: dYol([[-gl, -gl], [gl, -gl], [gl, gl], [-gl, gl]].map(([u, v]) => Q(u + 24, 0, v + 30))), fill: '#000', opacity: 0.08 });
    const UST = kat * ADIM;
    for (let i = 0; i < kat; i++) {
      const y0 = i * ADIM;
      kutu3(g, Lw, { a: ALT / 2, b: ALT / 2, y0, y1: y0 + ALT_H, renk: RENK_ALT, yanlar: false });
      kutu3(g, Lw, { a: DIS / 2, b: DIS / 2, y0: y0 + 3, y1: y0 + ADIM, renk: RENK_KASA, katman: 3, ustYuz: i === kat - 1 });
      kutu3(g, Lw, { a: ALT / 2, b: ALT / 2, y0, y1: y0 + ALT_H, renk: RENK_ALT, ustYuz: false });
    }
    // gözler: toprak (kenarlar arası boşluk kasanın duvarı olarak okunur)
    const d = 3.4;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const u0 = -IC / 2 + c * HUC + d, u1 = u0 + HUC - 2 * d, v0 = -IC / 2 + r * HUC + d, v1 = v0 + HUC - 2 * d;
      C(g, kenarla([Q(u0, UST, v0), Q(u1, UST, v0), Q(u1, UST, v1), Q(u0, UST, v1)], 12), { kapali: true, dolgu: TON.toprak, kalinlik: 1.5, genlik: 0.4, kay: [0, 0] });
    }
    // filizler arkadan öne (öndeki sıra arkadakinin üstüne biner)
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (dolu(c, r)) filiz(g, Lw(-IC / 2 + (c + 0.5) * HUC, UST - 1, -IC / 2 + (r + 0.5) * HUC), tohum + r * 8 + c);
    const hucre = (c, r, dy = 0) => Q(-IC / 2 + (c + 0.5) * HUC, UST + dy, -IC / 2 + (r + 0.5) * HUC);
    return { g, Q, Lw, UST, hucre };
  }

  // Çalışılan kasa (bahçıvanın önünde): uzak dört sıra ve beşinci sıranın sağdaki iki gözü dikilmiş; (5, 4) dikilmek üzere
  const FC = 5, FR = 4;
  const TEP = kasaKur(gTepsi, { ...B1.tepsi, kat: 1, dolu: (c, r) => r < FR || (r === FR && c > FC), tohum: 300 });
  const fideG = el(gTepsi, 'g');
  filiz(fideG, TEP.Lw(-IC / 2 + (FC + 0.5) * HUC, TEP.UST - 1, -IC / 2 + (FR + 0.5) * HUC), 990);
  // Dikilen fidenin dibinde bastırılmış toprak
  {
    const p = TEP.hucre(FC, FR), mm = K3D.m(TEP.Lw(0, TEP.UST, 0));
    C(fideG, oval(p[0], p[1] + 1, 11 * mm, 4 * mm, 0, 360, 10, 2), { kapali: true, dolgu: '#4f4b45', kalinlik: 1.4, genlik: 0.3, kay: [0, 0] });
    fideG.insertBefore(fideG.lastChild, fideG.firstChild);
  }
  // Tohum paketi (tezgâhta yatık kâğıt; üstünde filiz çizimi), yedek toprak yığını, küçük kürek
  {
    const Lp = yerel(B1.paket.X, B1.paket.Z, B1.paket.aci), Q = (u, v) => K3D.P(Lp(u, 0.5, v));
    el(gTepsi, 'path', { d: dYol([Q(-42, -66), Q(52, -66), Q(52, 76), Q(-42, 76)]), fill: '#000', opacity: 0.07 });
    C(gTepsi, kenarla([Q(-48, -72), Q(48, -72), Q(48, 72), Q(-48, 72)], 16), { kapali: true, dolgu: TON.beyaz, kalinlik: 3.4, kay: [1.5, 1.5] });
    C(gTepsi, kenarla([Q(-48, -50), Q(48, -50)], 16, false), { kalinlik: 2, renk: TON.cizgi });
    C(gTepsi, [Q(0, 34), Q(-3, 8), Q(0, -16)], { kalinlik: 2.6 });
    for (const yon of [-1, 1]) C(gTepsi, [Q(0, -14), Q(yon * 14, -26), Q(yon * 26, -18), Q(yon * 12, -10)], { kapali: true, dolgu: TON.yaprak, kalinlik: 2.2, kay: [1, 1] });
    for (const [a, b] of [[-30, 50], [-30, 60]]) C(gTepsi, [Q(a, b), Q(a + (b === 50 ? 58 : 40), b)], { kalinlik: 2, renk: TON.cizgi });
    // yedek toprak yığını
    const Y = B1.yigin2, b0 = P3(Y.X, 0, Y.Z), mm = K3D.m([Y.X, 0, Y.Z]);
    const yg = [...oval(b0[0], b0[1], 150 * mm, 42 * mm, 0, 180, 10, 2)];
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = lerp(b0[0] - 150 * mm, b0[0] + 150 * mm, 1 - t); yg.push([x, b0[1] - 66 * mm * Math.sin(t * Math.PI) ** 0.8 - (i % 2) * 6 * mm]); }
    el(gTepsi, 'ellipse', { cx: f1(b0[0] + 26 * mm), cy: f1(b0[1] + 10 * mm), rx: f1(160 * mm), ry: f1(40 * mm), fill: '#000', opacity: 0.07 });
    C(gTepsi, yg, { kapali: true, dolgu: TON.toprak, kalinlik: 4 });
    for (const [dx, dy] of [[-60, -30], [10, -50], [70, -20]]) C(gTepsi, [[b0[0] + dx * mm, b0[1] + dy * mm], [b0[0] + (dx + 22) * mm, b0[1] + (dy - 6) * mm]], { kalinlik: 2, renk: '#8d867a' });
    // kürek: sap + uç (tezgâhta yatık)
    const Lk = yerel(B1.kurek.X, B1.kurek.Z, B1.kurek.aci), R = (u, v, y = 6) => K3D.P(Lk(u, y, v));
    C(gTepsi, kenarla([R(-150, -13), R(-40, -11), R(-40, 11), R(-150, 13)], 14), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6 });
    C(gTepsi, [R(-40, 0), R(-20, 0)], { kalinlik: 5 });
    C(gTepsi, [R(-20, -30), R(40, -34), R(110, 0), R(40, 34), R(-20, 30)], { kapali: true, dolgu: '#bdb6a9', kalinlik: 3.6, kay: [1.5, 1.5] });
    C(gTepsi, [R(-14, 0), R(80, 0)], { kalinlik: 1.8, renk: TON.cizgi });
  }

  // İstif: üç kat altlıklı kasa; en üsttekinin her gözünde bir filiz
  kasaKur(gYigin, { ...B1.yigin, kat: 3, dolu: () => true, tohum: 500 });

  // ---------- Bahçıvan (insan.js + kol.js): gövde tezgâhın arkasında, kollar kasanın üstünde. Şapka, önlük, toprak izi
  // ve parmak uçlarındaki toprak bu modülde çizilir (kişinin kutu biriminde).
  const pB = ctx.rastgeleKisi(377, {
    kadin: true, yas: 'genc', sacStil: 'orgu', sac: 2, ten: 2, boy: 'orta', yapi: 'orta', yanak: 0.45, cil: true,
    yaka: 'v', giysi: 6, gozluk: null, sakal: null, kupe: false,
  });
  const EB = 108, KAL = 58, KESIT = 460;
  const [kx, kY] = P3(B1.kisi.X, 0, B1.masa.z0);
  const BH = (() => {
    const p = pB, s = B1.kisi.s, x0 = kx - BOY.en * s / 2, y0 = kY - KESIT * s + ctx.boyKaymasi(p) * s;
    const yap = (g) => el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * s, height: BOY.boy * s, x: x0, y: y0, overflow: 'visible' });
    const gB = el(gGovde, 'g'), gK = el(gKol, 'g');
    const sB = yap(gB), sK = yap(gK);
    const o = omuzlar(p, { kalinlik: KAL });
    const cx = 200, cy = GOZ_Y + 4, hw = p.yuzEn, hh = p.yuzBoy, tepe = cy - 6 - hh, gY = cy + hh;
    const h = { p, s, o, ifade: 'notr', bakis: [0, 0], sol: 'bas', sag: 'fideTut', leke: false, dy: 0, kutu: ([X, Y]) => [(X - x0) / s, (Y - y0) / s] };
    // Hasır şapka: geniş kenar (yanlara doğru hafif sarkık), taç, koyu bant, tepede kıvrım, hasır izleri
    const sapka = (kay) => {
      const { cz, sk } = dizge(p.tohum + 301, kay, 0.8);
      const by = cy - hh * 0.8, brx = hw + 88, bry = 20;
      const kenar = [];
      for (let a = 0; a < 360; a += 15) { const t = a * D2R, c = Math.cos(t); kenar.push([cx + brx * c, by + bry * Math.sin(t) + 12 * c * c]); }
      let str = sk(kenar, '#d8d2c7', 4.2);
      for (const a of [18, 42, 138, 162, 66, 114]) {
        const t = a * D2R, c = Math.cos(t), sn = Math.sin(t), q = (r) => [cx + brx * r * c, by + bry * r * sn + 12 * c * c * r];
        str += cz([q(0.74), q(0.92)], 2, M, 0.45);
      }
      const tac = [[cx - hw * 0.98, by], [cx - hw * 1.02, by - 26], [cx - hw * 0.86, tepe - 6], [cx - hw * 0.48, tepe - 28], [cx, tepe - 34], [cx + hw * 0.48, tepe - 28],
        [cx + hw * 0.86, tepe - 6], [cx + hw * 1.02, by - 26], [cx + hw * 0.98, by], [cx + hw * 0.6, by + bry * 0.5], [cx, by + bry * 0.62], [cx - hw * 0.6, by + bry * 0.5]];
      str += sk(tac, '#e2ddd3', 4.2);
      const bant = [[cx - hw * 1.01, by - 17], [cx - hw * 0.6, by - 17 + bry * 0.5], [cx, by - 17 + bry * 0.62], [cx + hw * 0.6, by - 17 + bry * 0.5], [cx + hw * 1.01, by - 17],
        [cx + hw * 0.98, by], [cx + hw * 0.6, by + bry * 0.5], [cx, by + bry * 0.62], [cx - hw * 0.6, by + bry * 0.5], [cx - hw * 0.98, by]];
      str += sk(bant, '#6f695f', 3.6, [2, 2]);
      str += cz([[cx - 16, tepe - 31], [cx, tepe - 23], [cx + 16, tepe - 31]], 2.6);
      for (const [u, v] of [[-0.55, 0.42], [-0.18, 0.25], [0.28, 0.3], [0.62, 0.5]]) str += cz([[cx + hw * u, tepe - 18 + v * 50], [cx + hw * (u + 0.13), tepe - 26 + v * 50]], 2, M, 0.4);
      return str;
    };
    // Önlük: göğüs parçası (cepli) ve boyun askıları; gövde kesiminin içinde
    const onluk = (kay) => {
      const { cz, sk } = dizge(p.tohum + 311, kay);
      let str = '';
      for (const yon of [-1, 1]) str += sk([[cx + yon * 56, gY + 100], [cx + yon * 44, gY + 98], [cx + yon * hw * 0.36, gY + 16], [cx + yon * hw * 0.5, gY + 18]], '#a59e91', 3.4, [2, 2]);
      str += sk(kenarla([[cx - 62, gY + 96], [cx + 62, gY + 96], [cx + 68, 900], [cx - 68, 900]], 40), '#a59e91', 4.2);
      str += cz(kenarla([[cx - 34, gY + 134], [cx + 34, gY + 134]], 20, false), 3);
      str += cz([[cx - 52, gY + 112], [cx + 50, gY + 112]], 1.8, '#5f5a53', 0.5);
      return str;
    };
    // Alında toprak izi (elin tersiyle silişten sonra)
    const leke = (kay) => dizge(p.tohum + 321, kay).cz([[cx - 26, cy - hh * 0.6], [cx - 4, cy - hh * 0.64], [cx + 22, cy - hh * 0.6]], 6, '#79756e', 0.6);
    // Parmak uçlarını örten toprak yığını ve kirli parmak uçları
    // P: parmakların ortası (avuç ile uç arası); yığın parmak uçlarını örter, kenarında kırıntılar
    const yigin = (P, kay, tohum) => {
      const { cz, sk } = dizge(tohum, kay, 0.6);
      const rx = EB * 0.24, ry = EB * 0.085, pts = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, ust = Math.sin(a) < 0, r = 1 + (ust ? 0.14 * Math.sin(a * 5) : 0);
        pts.push([P[0] + rx * r * Math.cos(a), P[1] + ry * r * Math.sin(a) * (ust ? 1.6 : 0.7)]);
      }
      let str = sk(pts, TON.toprak, 2.8, [1.5, 1.5]);
      str += cz([[P[0] - rx * 0.45, P[1] - ry * 0.6], [P[0] - rx * 0.1, P[1] - ry * 0.9]], 1.8, '#8d867a');
      for (const [dx, dy, rr] of [[-rx * 1.25, ry * 0.4, 2.6], [rx * 1.3, ry * 0.1, 2.2], [rx * 0.4, ry * 1.6, 2]]) str += `<circle cx="${f1(P[0] + dx)}" cy="${f1(P[1] + dy)}" r="${rr}" fill="${TON.toprak}"/>`;
      return str;
    };
    const kirli = (P, a) => {
      const t = [Math.cos(a * D2R), Math.sin(a * D2R)], n = [-t[1], t[0]];
      return [[-6, -14], [-2, 0], [-7, 13]].map(([u, v], i) => `<ellipse cx="${f1(P[0] + t[0] * u + n[0] * v)}" cy="${f1(P[1] + t[1] * u + n[1] * v)}" rx="${7 - i}" ry="4.5" transform="rotate(${f1(a)} ${f1(P[0] + t[0] * u + n[0] * v)} ${f1(P[1] + t[1] * u + n[1] * v)})" fill="${TON.toprak}" opacity="0.75"/>`).join('');
    };
    // Fide (elde, kutu biriminde): toprak topağı tutma noktasında, gövde ve yapraklar elin yanından sola yukarı
    const fideElde = (P, kay) => {
      const { cz, sk } = dizge(991, kay, 0.6);
      let str = sk([[P[0] - 9, P[1] - 4], [P[0] + 9, P[1] - 4], [P[0] + 7, P[1] + 14], [P[0] - 7, P[1] + 14]], TON.toprak, 2.8, [1.5, 1.5]);
      const tp = [P[0] - 22, P[1] - 30];
      str += cz([[P[0] - 2, P[1] - 4], [P[0] - 12, P[1] - 18], tp], 3);
      for (const [dx, dy] of [[-22, -6], [6, -20]]) str += sk([tp, [tp[0] + dx * 0.5 - 4, tp[1] + dy * 0.5 - 4], [tp[0] + dx, tp[1] + dy], [tp[0] + dx * 0.5 + 4, tp[1] + dy * 0.5 + 4]], TON.yaprak, 2.6, [1, 1]);
      return str;
    };
    // Kol pozları (kutu birimi). yon −1: ekranın solu, +1: sağı. Kasadaki hedefler ekrandan kutuya çevrilir.
    const S = (yon) => o[yon < 0 ? 'sol' : 'sag'];
    const elKasada = (yon, hedefE, { el: elAd = 'dayanma', ad = 'avuc', kisalma = 0.74, elAci = null, dis = 30, kalk = 0 } = {}) => {
      const sh = S(yon), hedef = h.kutu(hedefE);
      hedef[1] -= kalk;
      const dirsek = [lerp(sh[0], hedef[0], 0.42) + yon * dis, lerp(sh[1], hedef[1], 0.58)];
      const a = elAci ?? aciDer(dirsek, hedef), basparmak = -yon;
      const bilek = bilekBul({ el: elAd, hedef, elAci: a, elBoy: EB, basparmak, kisalma, ad });
      return { dirsek, bilek, el: elAd, elAci: a, basparmak, kisalma };
    };
    const yuz = (dx, dy) => [cx + dx, cy + dy];
    // Kasadaki eller: sol el sol gözlerde toprağı bastırır, sağ el (5, 4) gözüne fide diker (kollar gövdenin önünden çaprazlamaz)
    const POZ = {
      bas: (yon) => ({ ...elKasada(yon, TEP.hucre(1, 4)), toprak: true }),
      bas1: (yon) => ({ ...elKasada(yon, TEP.hucre(2, 5, -2)), toprak: true }),
      fideTut: (yon) => ({ ...elKasada(yon, TEP.hucre(FC, FR), { el: 'tutma', ad: 'tut', kisalma: 1, elAci: 96, kalk: 46 }), fide: true }),
      fideIn: (yon) => ({ ...elKasada(yon, TEP.hucre(FC, FR), { el: 'tutma', ad: 'tut', kisalma: 1, elAci: 92, kalk: 8 }), fide: true, toprak: true }),
      bas2: (yon) => ({ ...elKasada(yon, TEP.hucre(FC, FR + 1, -2)), toprak: true }),
      bas3: (yon) => ({ ...elKasada(yon, TEP.hucre(FC + 1, FR + 1, -2)), toprak: true }),
      // elin tersiyle alın silme: el sırtı izleyiciye, parmaklar alın boyunca öbür şakağa; bilek sağ şakaktan sola kayar
      kalk: (yon) => { const sh = S(yon); return { dirsek: [sh[0] + 62, sh[1] + 96], bilek: [sh[0] + 14, sh[1] - 52], el: 'acik', yuz: 'sirt', elAci: -104, kirli: true }; },
      // dirsek omuzdan biraz yüksek (çok kalkık üst kolda kol.js omuz kapağı kanat gibi açılıyor)
      alin0: () => ({ dirsek: [cx + 190, cy + 98], bilek: yuz(hw + 22, -34), el: 'acik', yuz: 'sirt', elAci: 190, kirli: true }),
      alin1: () => ({ dirsek: [cx + 166, cy + 96], bilek: yuz(hw * 0.56, -38), el: 'acik', yuz: 'sirt', elAci: 187, kirli: true }),
      alin2: () => ({ dirsek: [cx + 146, cy + 96], bilek: yuz(6, -39), el: 'acik', yuz: 'sirt', elAci: 184, kirli: true }),
      alin3: () => ({ dirsek: [cx + 126, cy + 98], bilek: yuz(-hw * 0.42, -37), el: 'acik', yuz: 'sirt', elAci: 181, kirli: true }),
      kalk2: (yon) => { const sh = S(yon); return { dirsek: [sh[0] + 56, sh[1] + 92], bilek: [sh[0] - 4, sh[1] - 44], el: 'acik', yuz: 'sirt', elAci: -70, kirli: true }; },
      kenar: (yon) => ({ ...elKasada(yon, TEP.Q(DIS / 2 - 4, TEP.UST, 30), { kisalma: 0.8 }), kirli: true }),
    };
    let son = 0;
    h.ciz = (i) => {
      if (i != null) { son = Math.max(0, i); if (!sahne1()) return; }
      const G = govdeKes(p, { id: 's4b-bahcivan', kaynama: son, tohum: p.tohum });
      const ortak = { giysi: MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik: KAL, kaynama: son, kolBoyu: 'sivali' };
      let kol = '', ek = '';
      for (const yon of [-1, 1]) {
        const taraf = yon < 0 ? 'sol' : 'sag', P = POZ[h[taraf]](yon);
        const yz = P.yuz || 'sirt', bs = P.basparmak ?? ((taraf === 'sag' ? 1 : -1) * (yz === 'avuc' ? 1 : -1));
        const kis = P.kisalma ?? (P.el === 'dayanma' ? 0.62 : 1);
        const tut = P.fide ? elNoktasi({ el: P.el, bilek: P.bilek, elAci: P.elAci, elBoy: EB, basparmak: bs, kisalma: kis, ad: 'tut' }) : null;
        kol += kolSVG({ ...ortak, omuz: o[taraf], taraf, tohum: 61 + (yon < 0 ? 0 : 1), elBoy: EB, ...P, araya: tut ? fideElde(tut, son) : '' });
        const uc = elNoktasi({ el: P.el, bilek: P.bilek, elAci: P.elAci, elBoy: EB, basparmak: bs, kisalma: kis, ad: 'uc' });
        const avuc = elNoktasi({ el: P.el, bilek: P.bilek, elAci: P.elAci, elBoy: EB, basparmak: bs, kisalma: kis, ad: 'avuc' });
        if (P.toprak) ek += yigin([lerp(avuc[0], uc[0], 0.8), lerp(avuc[1], uc[1], 0.8)], son, 70 + yon);
        else if (P.kirli) ek += kirli(uc, P.elAci);
      }
      sB.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: son, ifade: h.ifade, bakis: h.bakis, mono: true })}${onluk(son)}</g>${G.kontur}${h.leke ? leke(son) : ''}${sapka(son)}`;
      sK.innerHTML = kol + ek;
      const tr = `translate(0 ${f1(h.dy)})`;
      gB.setAttribute('transform', tr); gK.setAttribute('transform', tr);
    };
    h.poz = (o2) => { Object.assign(h, o2); h.ciz(); };
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    return h;
  })();

  // ---------- Zaman (12 fps pozlar): fideyi göze indirir (k10), bırakır, iki eliyle toprağı bastırır; k55 başını kaldırır,
  // k60 gülümser; k70–95 elinin tersiyle alnını siler (k85'ten sonra alında toprak izi); el kasanın kenarına iner.
  const P1 = (n, o) => tl.call(() => BH.poz(o), null, ka(K1 + n));
  // ekerken gözler kasada (kirp: göz kapakları inik), k55'te başını kaldırır
  const POZ0 = { sol: 'bas', sag: 'fideTut', ifade: 'kirp', bakis: [0, 2], leke: false, dy: 0 };
  tl.call(() => BH.poz(POZ0), null, k(K1));
  gsap.set(fideG, { autoAlpha: 0 });
  tl.set(fideG, { autoAlpha: 0 }, k(K1));
  // 0. kare (alt çizelgenin 0. anı, yukarıdaki not): poz, fide, itme ve kamera elle kurulur
  ctx.herKare((f) => {
    if (f !== K1) return;
    BH.poz(POZ0);
    gsap.set(fideG, { autoAlpha: 0 });
    gsap.set(ctx.itme, { x: 0, y: 0 });
    gsap.set(ctx.kamera, ctx.odak(...B1.kam[0]));
  });
  tl.set(fideG, { autoAlpha: 1 }, ka(K1 + 20));
  P1(10, { sag: 'fideIn', dy: 2 });
  P1(20, { sag: 'bas2', dy: 4 });
  P1(25, { sol: 'bas1', dy: 2 });
  P1(30, { sag: 'bas3', dy: 4 });
  P1(35, { sol: 'bas', dy: 2 });
  P1(40, { sag: 'bas2', dy: 4 });
  P1(45, { sol: 'bas1', dy: 2 });
  P1(50, { sag: 'bas3', dy: 3 });
  P1(55, { ifade: 'notr', bakis: [1, -1], dy: 0 });
  P1(60, { ifade: 'mutlu', dy: -3 });
  ctx.isaret(K1 + 60, 'vurgu');
  P1(70, { sag: 'kalk' });
  P1(75, { sag: 'alin0' });
  ctx.isaret(K1 + 75, 'vurgu');
  P1(80, { sag: 'alin1' });
  P1(85, { sag: 'alin2', leke: true });
  P1(90, { sag: 'alin3' });
  P1(95, { sag: 'kalk2' });
  P1(100, { sag: 'kenar', dy: -2 });
  P1(125, { dy: -4 });
  P1(140, { dy: -2 });
  kamera(K1, K2 - 1, B1.kam[0], B1.kam[1]);

  // =========================================================================== #4b.2 QR, MODEM (k156–263)
  ctx.isaret(K2, 'kesme');
  const L2 = katmanAc('s4b-modem', K2, K3 - 1);
  const B2 = yer({
    r: { x: 780, y: 700, s: 1 }, raf: { y: 700, s: 1 }, priz: [330, 480], tel: { x: 1390, y: 620, s: 1, aci: -9 }, gir: [430, 720, 16],
    kam: [[1000, 600, 1.16], [985, 590, 1.22]],
  }, {
    r: { x: 540, y: 1150, s: 1.3 }, raf: { y: 1150, s: 1.3 }, priz: [250, 760], tel: { x: 720, y: 1520, s: 1.3, aci: -7 }, gir: [300, 860, 12],
    kam: [[540, 1160, 1.26], [548, 1148, 1.32]],
  });
  {
    // duvar prizi ve kablo (açık gri), raf
    const [px, py] = B2.priz, s = B2.r.s;
    C(L2.svg, yDortgen(px - 46 * s, py - 46 * s, px + 46 * s, py + 46 * s, 12 * s, 20), { kapali: true, dolgu: '#e2ddd3', kalinlik: 4, renk: '#8d867a' });
    for (const dx of [-14, 14]) el(L2.svg, 'ellipse', { cx: f1(px + dx * s), cy: f1(py), rx: f1(5 * s), ry: f1(8 * s), fill: '#8d867a' });
    C(L2.svg, [[px, py + 12 * s], [px + 20 * s, py + 120 * s], [lerp(px, B2.r.x, 0.5), B2.r.y - 40 * s], [B2.r.x - 200 * B2.r.s, B2.r.y - 90 * B2.r.s]], { kalinlik: 4.5, renk: '#8d867a' });
    const ry = B2.raf.y, rs = B2.raf.s;
    C(L2.svg, kenarla([[-80, ry - 40 * rs], [W + 80, ry - 40 * rs], [W + 80, ry + 18 * rs], [-80, ry + 18 * rs]], 60), { kapali: true, dolgu: TON.ahsap, kalinlik: 4.4 });
    C(L2.svg, kenarla([[-80, ry + 18 * rs], [W + 80, ry + 18 * rs], [W + 80, ry + 58 * rs], [-80, ry + 58 * rs]], 60), { kapali: true, dolgu: TON.ahsapOn, kalinlik: 4.4 });
    for (const x of [W * 0.18, W * 0.82]) C(L2.svg, kenarla([[x - 14, ry + 58 * rs], [x + 14, ry + 58 * rs], [x + 14, ry + 200 * rs], [x - 14, ry + 200 * rs]], 30), { kapali: true, dolgu: TON.ahsapK, kalinlik: 4 });
  }
  // Yönlendirici (yerel: ön yüzün alt ortası 0,0) ve üstünde QR plakası
  const gR = el(L2.svg, 'g', { transform: `translate(${B2.r.x} ${B2.r.y}) scale(${B2.r.s})` });
  const LED = [];
  {
    el(gR, 'ellipse', { cx: 30, cy: 4, rx: 290, ry: 16, fill: '#000', opacity: 0.08 });
    for (const yon of [-1, 1]) {
      const b0 = [yon * 196, -124], u = [Math.sin(yon * 8 * D2R), -Math.cos(yon * 8 * D2R)], n = [-u[1], u[0]], L = 238, r = 11;
      const pt = (t, o2) => [b0[0] + u[0] * L * t + n[0] * o2, b0[1] + u[1] * L * t + n[1] * o2];
      C(gR, [pt(0, -r), pt(0.5, -r), pt(1, -r * 0.9), pt(1.04, 0), pt(1, r * 0.9), pt(0.5, r), pt(0, r)], { kapali: true, dolgu: '#8d867a', kalinlik: 4 });
      C(gR, [pt(0.12, -r * 1.3), pt(0.12, r * 1.3)], { kalinlik: 3 });
    }
    C(gR, kenarla([[-262, -100], [262, -100], [240, -134], [-240, -134]], 30), { kapali: true, dolgu: '#a59e91', kalinlik: 4.4, kay: [2, 2] });
    for (let i = 0; i < 6; i++) C(gR, [[-150 + i * 22, -110], [-140 + i * 22, -126]], { kalinlik: 2.6, renk: '#6f695f', genlik: 0.4 });
    C(gR, yDortgen(-262, -100, 262, 0, 14, 30), { kapali: true, dolgu: '#8d867a', kalinlik: 4.4 });
    for (let i = 0; i < 6; i++) {
      const x = -190 + i * 40;
      LED.push(C(gR, yDortgen(x - 10, -54, x + 10, -46, 4, 8), { kapali: true, dolgu: i % 2 ? TON.beyaz : '#5f5a53', kalinlik: 2.4, kay: [0, 0] }));
    }
    C(gR, [[150, -50], [226, -50]], { kalinlik: 3, renk: '#5f5a53' });
    for (const x of [-210, 210]) C(gR, kenarla([[x - 22, 0], [x + 22, 0], [x + 18, 8], [x - 18, 8]], 10), { kapali: true, dolgu: '#5f5a53', kalinlik: 3 });
    // QR plakası (dik, ayaklı): ayak, sağ yan kalınlık, ön yüz, Wi-Fi simgesi, QR, yazı çizgisi
    const gP = el(gR, 'g', { transform: 'translate(36 -118)' });
    C(gP, kenarla([[-94, -6], [94, -6], [98, 10], [-98, 10]], 20), { kapali: true, dolgu: '#bdb6a9', kalinlik: 3.6 });
    C(gP, kenarla([[80, -222], [92, -216], [92, -4], [80, -6]], 20), { kapali: true, dolgu: '#cfc9bd', kalinlik: 3.4, kay: [0, 0] });
    C(gP, yDortgen(-80, -226, 80, -4, 12, 24), { kapali: true, dolgu: TON.beyaz, kalinlik: 4.2, kay: [2, 2] });
    for (const [r, n] of [[30, 8], [19, 6]]) C(gP, oval(0, -176, r, r * 0.9, 225, 315, n), { kalinlik: 4 });
    el(gP, 'circle', { cx: 0, cy: -178, r: 4.5, fill: M });
    qrKoy(gP, [-58, -160], [58, -160], [58, -44], [-58, -44], 21, { kontur: 0 });
    C(gP, [[-36, -26], [36, -26]], { kalinlik: 4, renk: '#6f695f' });
  }
  // Telefon tutan el (yerel: telefonun ortası 0,0). Sıra: parmak uçları ve avuç telefonun arkasında, başparmak önünde.
  const gT = el(L2.svg, 'g');
  const telKilit = el(gT, 'g'), telTik = el(gT, 'g');
  {
    const ten = MONO.ten[1], giy = MONO.giysi[5];
    const g0 = el(gT, 'g');
    gT.insertBefore(g0, telKilit);
    for (const [x, y] of [[-112, 26], [-117, 76], [-111, 126]]) C(g0, oval(x, y, 19, 23, 0, 360, 12, 2), { kapali: true, dolgu: ten, kalinlik: 3.8, kay: [1.5, 1.5] });
    // yen (bileğin altından kadraj dışına), sonra avucun kökü ve bilek tek dış hatla (telefonun arkasından sağ alta taşar)
    C(g0, [[88, 330], [184, 300], [330, 640], [190, 700]], { kapali: true, dolgu: giy, kalinlik: 4.2 });
    C(g0, [[-40, 200], [40, 150], [112, 136], [138, 186], [140, 246], [162, 300], [184, 330], [104, 352], [86, 300], [52, 256], [0, 238]], { kapali: true, dolgu: ten, kalinlik: 4.2, kay: [2, 2] });
    C(g0, [[118, 176], [126, 222], [124, 250]], { kalinlik: 2.2 });
    C(g0, [[96, 344], [180, 316]], { kalinlik: 3.4 });
    C(g0, yDortgen(-110, -222, 110, 222, 30, 30), { kapali: true, dolgu: TON.koyu, kalinlik: 4.4 });
    C(g0, yDortgen(-97, -206, 97, 208, 20, 30), { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.6, kay: [0, 0] });
    C(g0, yDortgen(-26, -200, 26, -190, 5, 10), { kapali: true, dolgu: TON.koyu, kalinlik: 2, kay: [0, 0] });
    // vizörde plaka: açık yüz, Wi-Fi yayı, QR
    C(g0, yDortgen(-76, -150, 76, 104, 10, 24), { kapali: true, dolgu: TON.beyaz, kalinlik: 2.6, renk: '#8d867a', kay: [0, 0] });
    C(g0, oval(0, -104, 22, 20, 225, 315, 6), { kalinlik: 3.4 });
    qrKoy(g0, [-56, -84], [56, -84], [56, 28], [-56, 28], 21, { kontur: 0 });
  }
  {
    // köşe işaretleri (kilitlenince daralır) ve tik rozeti (turuncu, küçük)
    const c = [0, -28], a = 74;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) C(telKilit, [[c[0] + sx * a, c[1] + sy * (a - 26)], [c[0] + sx * a, c[1] + sy * a], [c[0] + sx * (a - 26), c[1] + sy * a]], { kalinlik: 6, renk: TON.beyaz, genlik: 0.5 });
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) C(telKilit, [[c[0] + sx * a, c[1] + sy * (a - 26)], [c[0] + sx * a, c[1] + sy * a], [c[0] + sx * (a - 26), c[1] + sy * a]], { kalinlik: 3, renk: M, genlik: 0.5 });
    C(telTik, oval(0, 0, 26, 26, 0, 360, 16, 2), { kapali: true, dolgu: TON.beyaz, kalinlik: 3.4, kay: [0, 0] });
    C(telTik, [[-12, 1], [-3, 10], [13, -9]], { kalinlik: 6, renk: VURGU, genlik: 0.4 });
    // başparmak telefonun sağ kenarının önünde
    const ten = MONO.ten[1];
    C(gT, [[128, 132], [110, 92], [80, 50], [66, 38], [60, 52], [74, 82], [98, 150]], { kapali: true, dolgu: ten, kalinlik: 4, kay: [1.5, 1.5] });
    C(gT, [[66, 54], [74, 48], [80, 56]], { kalinlik: 2.2 });
  }
  const TIK2 = K2 + 56;
  ctx.isaret(TIK2, 'tik');
  ctx.herKare((f) => {
    if (f < K2 - 1 || f > K3) return;
    const t = ilerle(f, K2 + 8, K2 + 34, EO), G = B2.gir, Tl = B2.tel;
    donustur(gT, Tl.x + G[0] * (1 - t), Tl.y + G[1] * (1 - t), Tl.aci + G[2] * (1 - t), Tl.s);
    const kil = 1.12 - 0.12 * ilerle(f, K2 + 44, K2 + 52, EO);
    donustur(telKilit, 0, -28 * (1 - kil), 0, kil);
    const tk = f < TIK2 ? 0 : BO(sinir((f - TIK2) / 10, 0, 1));
    donustur(telTik, 0, 156, 0, Math.max(0.001, tk));
    telTik.setAttribute('opacity', f < TIK2 ? 0 : 1);
    // ışıklar: 2. ve 4. ışık yanıp söner (12 fps ızgarasında)
    const yan = Math.floor((f - K2) / 10) % 2 === 0;
    LED[1].dolgu.setAttribute('fill', yan ? TON.beyaz : '#5f5a53');
    LED[3].dolgu.setAttribute('fill', yan ? '#5f5a53' : TON.beyaz);
  });
  kamera(K2, K3 - 1, B2.kam[0], B2.kam[1]);

  // =========================================================================== #4b.3 QR, KAFE MASASI (k264–371)
  ctx.isaret(K3, 'kesme');
  const L3 = katmanAc('s4b-kafe', K3, K4 - 1);
  const B3 = yer({
    m: { cx: 960, cy: 800, rx: 720, ry: 190, s: 1 }, pencere: [70, 40, 1180, 520], lamba: [1480, 340], fincan: [-360, 340],
    kam: [[960, 690, 1.22], [990, 700, 1.28]],
  }, {
    m: { cx: 540, cy: 1240, rx: 500, ry: 150, s: 0.95 }, pencere: [90, 300, 1000, 880], lamba: [800, 560], fincan: [-290, 285],
    kam: [[540, 1160, 1.36], [552, 1168, 1.42]],
  });
  const m3 = B3.m, s3 = m3.s;
  {
    // pencere (açık gri kayıtlar) ve sarkan lamba
    const [x0, y0, x1, y1] = B3.pencere, ac = { kalinlik: 5, renk: '#d6d0c5', genlik: 0.8 };
    C(L3.svg, kenarla([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 60), { kapali: true, kalinlik: 6, renk: '#d6d0c5' });
    C(L3.svg, kenarla([[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]], 60, false), ac);
    C(L3.svg, kenarla([[x0, lerp(y0, y1, 0.42)], [x1, lerp(y0, y1, 0.42)]], 60, false), ac);
    const [lx, ly] = B3.lamba;
    C(L3.svg, [[lx, -40], [lx + 2, ly - 60 * s3]], { kalinlik: 3, renk: '#a59e91' });
    C(L3.svg, kenarla([[lx - 26 * s3, ly - 62 * s3], [lx + 26 * s3, ly - 62 * s3], [lx + 74 * s3, ly], [lx - 74 * s3, ly]], 20), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, renk: '#8d867a' });
    C(L3.svg, oval(lx, ly + 6 * s3, 20 * s3, 13 * s3, 0, 180, 8, 2), { kalinlik: 3, renk: '#8d867a' });
  }
  // Masa: ayak, kalınlık, mermer üst (damarlar)
  {
    const { cx, cy, rx, ry } = m3;
    C(L3.svg, kenarla([[cx - 34 * s3, cy + ry], [cx + 34 * s3, cy + ry], [cx + 30 * s3, H + 600], [cx - 30 * s3, H + 600]], 50), { kapali: true, dolgu: '#8d867a', kalinlik: 4.4 });
    const on = oval(cx, cy, rx, ry, 0, 180, 30, 2.1);
    C(L3.svg, [...on, ...on.slice().reverse().map(([x, y]) => [x, y + 22 * s3])], { kapali: true, dolgu: '#bdb6a9', kalinlik: 4.4 });
    C(L3.svg, oval(cx, cy, rx, ry, 0, 360, 56, 2.1), { kapali: true, dolgu: '#e6e1d8', kalinlik: 4.4 });
    for (const [a, b, c2, d] of [[-0.8, 0.1, -0.35, 0.55], [0.2, -0.6, 0.62, 0.1], [0.45, 0.4, 0.86, 0.22]]) {
      C(L3.svg, [[cx + a * rx, cy + b * ry], [cx + lerp(a, c2, 0.5) * rx + 14, cy + lerp(b, d, 0.5) * ry - 8], [cx + c2 * rx, cy + d * ry]], { kalinlik: 2, renk: '#cfc9bd', genlik: 0.8 });
    }
  }
  // QR standı: cizimler.js qrStandi gövdesi (çadır ön yüzü + taban), sağda çadırın öbür kanadı; panelde gerçek QR
  {
    const boy = 300 * s3, sx = m3.cx, sy = m3.cy - 52 * s3;
    const Q = ([x, y]) => [sx + x * boy, sy + (y - 0.42) * boy];
    el(L3.svg, 'ellipse', { cx: f1(sx + 30 * s3), cy: f1(sy + 4 * s3), rx: f1(150 * s3), ry: f1(24 * s3), fill: '#000', opacity: 0.08 });
    const on = CIZIMLER.qrStandi[0].p, taban = CIZIMLER.qrStandi[1].p;
    C(L3.svg, kenarla([[0.22, -0.42], [0.29, -0.39], [0.41, 0.40], [0.32, 0.42]].map(Q), 16), { kapali: true, dolgu: '#bdb6a9', kalinlik: 3.8, kay: [1.5, 1.5] });
    C(L3.svg, kenarla([[taban[0][0], 0.405], [taban[1][0], 0.405], [taban[1][0], 0.45], [taban[0][0], 0.45]].map(Q), 18), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6 });
    C(L3.svg, kenarla(on.map(Q), 18), { kapali: true, dolgu: TON.beyaz, kalinlik: 4.4, kay: [2, 2] });
    const yuz = dortgen(Q(on[1]), Q(on[2]), Q(on[3]), Q(on[0]));
    qrKoy(L3.svg, yuz(0.2, 0.1), yuz(0.8, 0.1), yuz(0.8, 0.5), yuz(0.2, 0.5), 33);
    C(L3.svg, [yuz(0.3, 0.64), yuz(0.7, 0.64)], { kalinlik: 4, renk: '#6f695f' });
    C(L3.svg, [yuz(0.36, 0.76), yuz(0.64, 0.76)], { kalinlik: 3, renk: '#8d867a' });
  }
  // Fincan (yerel: tabağın ortası 0,0): tabak, gövde, kulp, ağız, kahve
  function fincan(ust) {
    C(ust, oval(0, 0, 98, 27, 0, 360, 22, 2), { kapali: true, dolgu: TON.beyaz, kalinlik: 4 });
    C(ust, oval(0, -2, 54, 13, 0, 360, 16, 2), { kalinlik: 2, renk: TON.cizgi, genlik: 0.5, kapali: true });
    C(ust, [[54, -64], [88, -62], [92, -42], [72, -28], [48, -26]], { kalinlik: 5.5 });
    C(ust, [[-58, -78], [-55, -42], [-40, -12], [0, -4], [40, -12], [55, -42], [58, -78], ...oval(0, -78, 58, 15, 0, 180, 12, 2)], { kapali: true, dolgu: TON.beyaz, kalinlik: 4.2 });
    C(ust, oval(0, -78, 58, 15, 0, 360, 20, 2), { kapali: true, dolgu: TON.beyaz, kalinlik: 4 });
    C(ust, oval(0, -77, 49, 11, 0, 360, 18, 2), { kapali: true, dolgu: TON.toprak, kalinlik: 2.2, kay: [0, 0] });
  }
  const F1 = [m3.cx + B3.fincan[0] * s3, m3.cy + 34 * s3], F2 = [m3.cx + B3.fincan[1] * s3, m3.cy + 56 * s3];
  {
    // küçük vazo ve dal (arka solda)
    const vx = m3.cx - 190 * s3, vy = m3.cy - 96 * s3, v = s3;
    C(L3.svg, [[vx, vy - 60 * v], [vx - 10 * v, vy - 130 * v], [vx + 4 * v, vy - 170 * v]], { kalinlik: 3 });
    for (const [dx, dy, a] of [[-10, -128, -1], [4, -168, 1], [-4, -100, 1]]) C(L3.svg, [[vx + dx * v, vy + dy * v], [vx + (dx + a * 14) * v, vy + (dy - 18) * v], [vx + (dx + a * 30) * v, vy + (dy - 8) * v], [vx + (dx + a * 14) * v, vy + (dy + 2) * v]], { kapali: true, dolgu: TON.yaprak, kalinlik: 2.6, kay: [1, 1] });
    C(L3.svg, kenarla([[vx - 16 * v, vy], [vx + 16 * v, vy], [vx + 22 * v, vy - 40 * v], [vx + 9 * v, vy - 62 * v], [vx - 9 * v, vy - 62 * v], [vx - 22 * v, vy - 40 * v]], 12), { kapali: true, dolgu: '#cfc9bd', kalinlik: 3.8 });
  }
  const gF1 = el(L3.svg, 'g', { transform: `translate(${f1(F1[0])} ${f1(F1[1])}) scale(${s3})` });
  el(gF1, 'ellipse', { cx: 14, cy: 8, rx: 104, ry: 24, fill: '#000', opacity: 0.08 });
  fincan(gF1);
  C(gF1, [[60, -8], [96, 2], [128, 4]], { kalinlik: 4.5, renk: '#6f695f' }); // kaşık
  // buhar: üç dalgalı çizgi, 12 fps'te kıvrılır
  const buhar = [-20, 4, 26].map((x) => C(gF1, [[x, -96], [x, -150]], { kalinlik: 3.6, renk: '#a59e91', genlik: 0.6 }));
  // İkinci fincan ve onu tabağından tutan el (parmak uçları tabağın altında, el sırtı ve başparmak üstte)
  const gF2p = el(L3.svg, 'g'), gF2 = el(L3.svg, 'g'), gF2e = el(L3.svg, 'g');
  const gF2g = el(gF2, 'ellipse', { cx: 14, cy: 8, rx: 104, ry: 24, fill: '#000', opacity: 0.08 });
  fincan(gF2);
  {
    const ten = MONO.ten[3], giy = MONO.giysi[2];
    for (const [x, y] of [[50, 33], [72, 34], [93, 31]]) C(gF2p, oval(x, y, 12, 11, 0, 360, 10, 2), { kapali: true, dolgu: ten, kalinlik: 3.2, kay: [1, 1] });
    // ön kol: sağ üstten çapraz iner (sıvalı yen), bilek; el sırtı tabağın sağ kenarını tutar. El fincana göre küçük
    // kalmasın diye tutuş noktası (100, 0) çevresinde 1,35 kat (parmak uçları tabağın altında yerinde kalır)
    const gx = el(gF2e, 'g', { transform: 'translate(100 0) scale(1.35) translate(-100 0)' });
    C(gx, [[300, -146], [560, -300], [640, -190], [342, -64]], { kapali: true, dolgu: giy, kalinlik: 3.4 });
    C(gx, [[184, -64], [320, -132], [350, -70], [210, 6]], { kapali: true, dolgu: ten, kalinlik: 3.4, kay: [2, 2] });
    C(gx, [[300, -146], [342, -64]], { kalinlik: 2.6 });
    C(gx, [[212, -74], [150, -60], [104, -34], [94, -6], [112, 16], [170, 18], [222, 4]], { kapali: true, dolgu: ten, kalinlik: 3.2, kay: [1.5, 1.5] });
    C(gx, [[120, -24], [134, -10]], { kalinlik: 1.8 });
    C(gx, [[146, -36], [160, -22]], { kalinlik: 1.8 });
  }
  // başparmak tabağın kenarının üstünde (el sırtıyla aynı ölçekte)
  const gBas = el(gF2e, 'g', { transform: 'translate(100 0) scale(1.35) translate(-100 0)' });
  C(gBas, [[118, -24], [80, -31], [62, -27], [64, -15], [82, -12], [120, -8]], { kapali: true, dolgu: MONO.ten[3], kalinlik: 3, kay: [1.5, 1.5] });
  const TIK3 = K3 + 36;
  ctx.isaret(TIK3, 'tik');
  ctx.herKare((f) => {
    if (f < K3 - 1 || f > K4) return;
    // fincan 4–36 arası iner (EO), değişte 2 px oturur
    const t = ilerle(f, K3 + 4, TIK3, EO), dx = 560 * (1 - t), dy = -420 * (1 - t), sc = 1 + 0.12 * (1 - t);
    const otur = f >= TIK3 && f < TIK3 + 6 ? 2 * Math.sin((f - TIK3) / 6 * Math.PI) : 0;
    const x = F2[0] + dx * s3, y = F2[1] + dy * s3 + otur;
    donustur(gF2, x, y, 0, sc * s3);
    gF2g.setAttribute('opacity', t < 0.95 ? 0 : 0.08);
    // el bırakır (k44 parmak uçları tabağın altından çıkar: gizlenir), 48–76 sağ üste çekilir
    const c = ilerle(f, K3 + 48, K3 + 76, EI);
    const ex = x + 760 * c * s3, ey = y - 380 * c * s3;
    donustur(gF2p, ex, ey, 0, sc * s3);
    gF2p.setAttribute('opacity', f >= K3 + 44 ? 0 : 1);
    donustur(gF2e, ex, ey, 0, sc * s3);
    // buhar (12 fps): her çizgi yukarı doğru kıvrılır, faz kayar
    const faz = Math.floor((f - K3) / 5) * 0.9;
    buhar.forEach((h, j) => {
      const x0 = [-20, 4, 26][j], pts = [];
      for (let i = 0; i <= 6; i++) { const yy = -96 - i * 18 - j * 6; pts.push([x0 + Math.sin(faz + i * 0.9 + j * 2.1) * (4 + i * 1.6), yy]); }
      h.pts = pts; h.ciz(kayIndis);
    });
  });
  kamera(K3, K4 - 1, B3.kam[0], B3.kam[1]);

  // =========================================================================== #4b.4 QR, KARTVİZİT, KUŞ BAKIŞI (k372–491)
  ctx.isaret(K4, 'kesme');
  const L4 = katmanAc('s4b-kart', K4, SON);
  const B4 = yer({
    kart: [960, 560], s: 1, defter: [330, 250, -8], fincan: [1590, 250], saksi: [150, 930], tel: [1730, 800, 14], plank: 168,
    gir: [600, 780, -22], kam: [[960, 540, 1.0], [952, 548, 1.06]],
  }, {
    kart: [540, 900], s: 1.15, defter: [300, 340, -8], fincan: [880, 380], saksi: [150, 1720], tel: [940, 1450, 14], plank: 190,
    gir: [520, 1100, -22], kam: [[540, 960, 1.0], [540, 930, 1.06]],
  });
  {
    // tahtalar (yatay), damarlar
    const a = B4.plank, r = rng(404);
    for (let y = -a, i = 0; y < H + a; y += a, i++) {
      C(L4.svg, kenarla([[-60, y], [W + 60, y], [W + 60, y + a], [-60, y + a]], 80), { kapali: true, dolgu: i % 2 ? '#d8d2c7' : '#cfc9bd', kalinlik: 3, renk: '#8d867a', kay: [0, 0] });
      for (let j = 0; j < 2; j++) {
        const yy = y + a * (0.3 + 0.4 * j), x0 = r() * W * 0.4, x1 = x0 + W * (0.35 + r() * 0.3);
        C(L4.svg, [[x0, yy], [lerp(x0, x1, 0.33), yy + 6], [lerp(x0, x1, 0.66), yy - 4], [x1, yy + 3]], { kalinlik: 1.8, renk: '#b0a99c', genlik: 0.6 });
      }
    }
  }
  {
    // defter (spiralli, çizgili) ve üstünde kalem
    const [dx, dy, da] = B4.defter;
    const g = el(L4.svg, 'g', { transform: `translate(${dx} ${dy}) rotate(${da})` });
    el(g, 'rect', { x: -212, y: -150, width: 440, height: 320, rx: 8, fill: '#000', opacity: 0.08 });
    C(g, kenarla([[-220, -160], [220, -160], [220, 160], [-220, 160]], 40), { kapali: true, dolgu: TON.beyaz, kalinlik: 4.2, kay: [2, 2] });
    for (let i = 0; i < 6; i++) C(g, kenarla([[-190, -90 + i * 40], [190, -90 + i * 40]], 60, false), { kalinlik: 1.6, renk: '#bdb6a9', genlik: 0.4 });
    for (let i = 0; i < 11; i++) C(g, oval(-180 + i * 36, -160, 8, 12, 0, 360, 10, 2), { kapali: true, kalinlik: 3, genlik: 0.4 });
    C(g, [[-120, 110], [150, 30], [160, 44], [-112, 124]], { kapali: true, dolgu: '#6f695f', kalinlik: 3.6 });
    C(g, [[150, 30], [180, 26], [160, 44]], { kapali: true, dolgu: '#cfc9bd', kalinlik: 3 });
    // fincan (üstten): tabak, kulp, fincan, kahve, köpükte kalp
    const [fx, fy] = B4.fincan, gf = el(L4.svg, 'g', { transform: `translate(${fx} ${fy})` });
    el(gf, 'circle', { cx: 10, cy: 12, r: 122, fill: '#000', opacity: 0.08 });
    C(gf, oval(0, 0, 120, 120, 0, 360, 24, 2), { kapali: true, dolgu: TON.beyaz, kalinlik: 4.2 });
    C(gf, kenarla([[58, -18], [118, -40], [126, -18], [66, 6]], 14), { kapali: true, dolgu: TON.beyaz, kalinlik: 4 });
    C(gf, oval(0, 0, 74, 74, 0, 360, 20, 2), { kapali: true, dolgu: TON.beyaz, kalinlik: 4.2 });
    C(gf, oval(0, 0, 60, 60, 0, 360, 18, 2), { kapali: true, dolgu: '#6f695f', kalinlik: 2.6, kay: [0, 0] });
    C(gf, [[0, 18], [-22, -2], [-14, -18], [0, -8], [14, -18], [22, -2]], { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.2, renk: '#d8d2c7', kay: [0, 0] });
    // saksı (üstten): ağız, toprak, ışınsal yapraklar
    const [sx, sy] = B4.saksi, gs = el(L4.svg, 'g', { transform: `translate(${sx} ${sy})` });
    C(gs, oval(0, 0, 130, 130, 0, 360, 24, 2), { kapali: true, dolgu: '#a59e91', kalinlik: 4.2 });
    C(gs, oval(0, 0, 106, 106, 0, 360, 22, 2), { kapali: true, dolgu: TON.toprak, kalinlik: 3, kay: [0, 0] });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 360 + 10, u = [Math.cos(a * D2R), Math.sin(a * D2R)], n = [-u[1], u[0]], L = 150 + (i % 3) * 22;
      C(gs, [[0, 0], [u[0] * L * 0.5 + n[0] * 34, u[1] * L * 0.5 + n[1] * 34], [u[0] * L, u[1] * L], [u[0] * L * 0.5 - n[0] * 34, u[1] * L * 0.5 - n[1] * 34]], { kapali: true, dolgu: i % 2 ? '#bdb6a9' : '#cfc9bd', kalinlik: 3.6, kay: [2, 2] });
      C(gs, [[u[0] * 20, u[1] * 20], [u[0] * L * 0.85, u[1] * L * 0.85]], { kalinlik: 2, renk: '#8d867a' });
    }
    // telefon (ekranı kapalı)
    const [tx, ty, ta] = B4.tel, gt = el(L4.svg, 'g', { transform: `translate(${tx} ${ty}) rotate(${ta})` });
    el(gt, 'rect', { x: -98, y: -196, width: 216, height: 420, rx: 30, fill: '#000', opacity: 0.08 });
    C(gt, yDortgen(-108, -210, 108, 210, 30, 30), { kapali: true, dolgu: TON.koyu, kalinlik: 4.2 });
    C(gt, yDortgen(-96, -196, 96, 198, 20, 30), { kapali: true, dolgu: '#5f5a53', kalinlik: 2.4, kay: [0, 0] });
  }
  // Kartvizit (yerel: kartın ortası 0,0): gölge, kalınlık, üst yüz (baskı çizgileri), işaret, ad çizgileri, QR
  const gK4 = el(L4.svg, 'g');
  const gKart = el(gK4, 'g'), gEl4 = el(gK4, 'g');
  {
    const kw = 190, kh = 120;
    el(gKart, 'path', { d: dYol(yDortgen(-kw + 10, -kh + 14, kw + 10, kh + 14, 14, 40)), fill: '#000', opacity: 0.1 });
    C(gKart, yDortgen(-kw, -kh + 5, kw, kh + 5, 14, 30), { kapali: true, dolgu: '#b5b1aa', kalinlik: 3.6, kay: [0, 0] });
    C(gKart, yDortgen(-kw, -kh, kw, kh, 14, 30), { kapali: true, dolgu: '#f6f3ed', kalinlik: 4.2, kay: [0, 0] });
    const id = 's4b-kart-klip', defs = el(gKart, 'defs'), kp = el(defs, 'clipPath', { id });
    el(kp, 'path', { d: dYol(yDortgen(-kw + 4, -kh + 4, kw - 4, kh - 4, 12, 30)) });
    const gc = el(gKart, 'g', { 'clip-path': `url(#${id})` });
    let d = '';
    for (let x = -kw - kh * 2; x < kw; x += 11) d += `M${x} ${kh}L${x + kh * 2} ${-kh}`;
    el(gc, 'path', { d, stroke: '#1d1d20', 'stroke-width': 1, opacity: 0.06, fill: 'none' });
    C(gKart, yDortgen(-160, -92, -112, -44, 10, 12), { kapali: true, dolgu: '#cfc9bd', kalinlik: 3 });
    C(gKart, oval(-136, -68, 12, 12, 0, 360, 10, 2), { kapali: true, kalinlik: 3 });
    C(gKart, [[-160, -6], [-24, -6]], { kalinlik: 9 });
    C(gKart, [[-160, 24], [-62, 24]], { kalinlik: 5, renk: '#5f5a53' });
    C(gKart, [[-160, 66], [-54, 66]], { kalinlik: 3.6, renk: '#8d867a' });
    C(gKart, [[-160, 88], [-80, 88]], { kalinlik: 3.6, renk: '#8d867a' });
    qrKoy(gKart, [22, -86], [168, -86], [168, 60], [22, 60], 57, { kontur: 0 });
  }
  // El (kol.js elUstten, üstten): parmaklar kartın sağ alt çeyreğinde; kaynamada yeniden kurulur
  const EL4 = { merkez: [178, 150], aci: -126, boy: 236 };
  let sonEl4 = -1;
  const el4Ciz = (i) => {
    if (i === sonEl4) return;
    const t = tl.time(); if (t < k(K4) - 0.02 || t >= k(SON + 1)) return;
    sonEl4 = i;
    gEl4.innerHTML = elUstten({
      merkez: EL4.merkez, aci: EL4.aci, boy: EL4.boy, ten: MONO.ten[4], giysi: MONO.giysi[1], taraf: 'sag', tutma: false,
      kaynama: i, tohum: 23, kolUzun: 760, kalinlik: EL4.boy * 0.46, kolBoyu: 'uzun', manset: 'ribana',
    });
  };
  ctx.kaynayanlar.add(el4Ciz);
  const TIK4 = K4 + 40;
  ctx.isaret(TIK4, 'tik');
  ctx.herKare((f) => {
    if (f < K4 - 1 || f > SON + 1) return;
    if (sonEl4 < 0) el4Ciz(kayIndis);
    const s = B4.s, t = ilerle(f, K4 + 4, TIK4, P3O), G = B4.gir;
    donustur(gK4, B4.kart[0] + G[0] * (1 - t), B4.kart[1] + G[1] * (1 - t), -6 + G[2] * (1 - t), s);
    // el kalkar (hafif büyür) ve sağ alta çekilir
    const c = ilerle(f, K4 + 48, K4 + 80, EI);
    donustur(gEl4, 560 * c, 900 * c, 0, 1 + 0.07 * ilerle(f, K4 + 46, K4 + 56, EO));
  });
  kamera(K4, SON, B4.kam[0], B4.kam[1]);
}
