// Sahne 4, FRP MASASI (v10 demlenme; k1536–2445: kadro.json aralığından 220 kare uzun). Kadro (kadro.json): E (DM; kısa, zayıf,
// gözlüklü), E2 (punk: mohawk, deri ceket), E3 (tosun, sakallı), E4 (başörtülü, gözlüklü). Soldan sağa E4, E3, E, E2 (E3,
// E'nin hemen yanında); aralar geniş, masa yassı (alçak elips): dördü tek karede rahat görünür. E perdenin ardında yüksek
// tabureye oturur (perde uzadı, E çökmüş görünmesin). Masada elle çizilmiş savaş haritası ve KATLANIR KÂĞIT figürler
// (kart, tabanı arkaya kıvrılıp dik durdurulmuş: şövalye, büyücü, canavar). Marka yok; ekranda "FRP zarı" denir.
// Kullanıcı 2026-10-23: "her sahne demlensin"; E3'ün eli figürlerin ve perdenin içinden geçiyordu; devrilen kart bir anda
// kayboluyordu; üçü birden düşünsün. Kurallar: figürler perdenin önünde (x ≥ 990), kimsenin kolunun önünde değil; E3'ün
// jestleri kendi gövdesinin önünde, masadan yüksekte (sağ kolu x < 980'de kalır); çakışma kare kare ölçülerek denetlendi.
// #14 (k1536–1747) Genel plan, sohbet: E3 bir şey anlatır (eller göğüs önünde), espride avuçlarını açar; E4 elini ağzına
//     kapatıp güler, E2 geriye yaslanıp E3'ü (perdenin üstünden) gösterir, masaya vurur (kâğıt figürler sallanır). Gülüş
//     söner (nefes). E zarları yumruğunda sallar, herkes öne eğilir; yumruk havada asılı kalır, k1719 atar; zarlar havada
//     yay çizer. Dikeyde kamera çiftten çifte kayar (E4+E3 → E+E2).
// #15 (k1748–1931) Kesme: 3B yakın plan (three.js; toon gölge + mürekkep konturu, harita dokusu aynı çizgi dilinde). İki tavla
//     zarı haritaya düşer, takla atar, seker, yavaşlayıp durur: hep yek. Fizik önceden hesaplı ve tohumsuz (yuvarlatılmış küp,
//     darbe tabanlı katı cisim, 1200 Hz), ekranda %85 hızla (hafif ağır çekim). Bir zar şövalyeyi devirir: kart yüzüstü kapanır,
//     kıvrık tabanı havada kalır. Zarlar durunca nefes; kamera yerde yatan karta kayar, bir an durur.
// #16 (k1932–2265) Kesme: genel plan, kart masada yatıyor, zarlar yek (nefes). E3 kartı alır, kâğıt elinde boynunu büker;
//     kamera ikiliye (E3 + E) yaklaşır. E3: "Keşke piyonlarımız gerçek olsa…" (k2020), E: "Keşke FRP zarlarımız olsa…
//     kendimiz tasarlayabildiğimiz…" (k2090); satırlar en az 2 sn okunur kalır.
// #17 (k2266–2445) Kamera geri çekilir: üçü aynı anda düşünür. E3 (kâğıt elinde): balonda gerçek, renkli piyonlar (şövalye,
//     büyücü, canavar; 3B, dönen kaideler). E (eli çenesinde): balonda 3B zarlar (d20, d12, d8, d6, d4), taşa sonra reçineye
//     döner. E4 (sözsüz, eli çenesinde): balonda kaideli, boyalı masaüstü RPG minifigürü (özgün gezgin; astarla belirir,
//     renkler aşağıdan yukarı boyanır). Üç balon birlikte durur; çözüm yok, sahne balonlarla biter.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye İÇ (mutlak) kare zamanlı tween ekler; 3B tuvaller ctx.herKare ile her karede
// deterministik çizilir (fizik ve dönüşler kare numarasından). window'a bir şey yazılmaz. three.js yüklenemez ya da WebGL
// açılamazsa 3B çekimler düşer: yakın plan yerine 2B masada zarlar iner, balonda zarlar düz çizim kalır.
// Kişiler çekirdeğin ctx.kisi'si yerine burada kurulur: gövde (masanın altında) ve kollar (masanın üstünde) ayrı svg'de.
// kol.js omuzlar() orta gövdeyi varsaydığından omuz ve gövde kesimi yapıya (insan.js YAPI) göre burada düzeltilir.
// Hareket 60 fps (kullanıcı 2026-10-22: 12 fps adımlı poz kesik geliyordu): her kol kendi izinden (anahtar: başlangıç karesi,
// süre, poz, eğri) her karede ara değerle çizilir; eğilme, gülme, vuruş, figür sallanması, kâğıdın bükülmesi sürekli
// tween'ler. Ayrık kalanlar: yüz ifadesi ve göz yönü (çizim), 2B zarın takla yüzü, çizgi kaynaması (8 fps).
import { kisiSVG, YAPI, BOY, GOZ_Y, MONO, PALET, yol, rng, oval } from '../insan.js';
import { kolSVG, bilekBul, elNoktasi, kolIK } from '../kol.js';
import { URUN_RENK, URUN_SIRA } from './cizimler.js';

// three.js (importmap) ve eklentileri: yüklenemezse sahne 2B sürer
let THREE = null, RoundedBoxGeometry = null, LineSegments2 = null, LineSegmentsGeometry = null, LineMaterial = null;
try {
  THREE = await import('three');
  [{ RoundedBoxGeometry }, { LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }] = await Promise.all([
    import('three/addons/geometries/RoundedBoxGeometry.js'), import('three/addons/lines/LineSegments2.js'),
    import('three/addons/lines/LineSegmentsGeometry.js'), import('three/addons/lines/LineMaterial.js')]);
} catch (e) { console.warn('s4-frp: three.js yüklenemedi, 3B çekimler düşer', e); THREE = null; }

// Caveat ancak bir öğe kullanınca indirilir; balonlar yazı genişliği ölçülerek kurulur (yedek yazı tipiyle ölçülürse ~%40 geniş)
try { await document.fonts.load('600 62px Caveat', 'Keşke piyonlarımız gerçek olsa… FRP zarlarımız kendimiz tasarlayabildiğimiz If only our pawns were real we had RPG dice ones designed ourselves'); } catch { /* yoksa yedekle sürer */ }

const BAS = 1536, SON = 2445;
export const ARALIK = [BAS, SON];
// Çekim sınırları ve anahtar kareler
const K_SALLA = 1664; // E'nin kolu perdenin üstüne kalkar, zarları sallar
const K_ATIS = 1719;  // zarlar elden çıkar
const KY = 1748;      // 3B yakın plan başlar (zarlar havada)
const KO = 1932;      // genel plan: kart masada yatıyor
const K_UZAN = 1964;  // E3 kâğıda uzanır
const K_E3 = 2020;    // "Keşke piyonlarımız…"
const K_E = 2090;     // "Keşke FRP zarlarımız…"
const K_GERI = 2266;  // kamera geri çekilir: üçlü düşünce
const K_DUS = [2288, 2296, 2304]; // balonlar: E3, E, E4 (aynı anda düşünürler; 8 kare arayla açılır)
const K_TAS = 2348, K_REC = 2374; // E'nin zarları taşa, reçineye döner; E4'ün figürü boyanır (K_TAS)
const M = PALET.murekkep;
const D2R = Math.PI / 180;
const EB = 116;                 // el boyu (kutu birimi; kol.js önerisi: yüz boyunun ~%75'i)
const DERI = '#46423d';         // insan.js deri ceketin mono tonu (E2'nin kolları da deri)
const SIFIR = { sap: () => 0 };
const f1 = (v) => (+v).toFixed(1);
const f3 = (v) => (+v).toFixed(3);
const TON = { kagit: '#f4f1ea', acik: '#e2ddd3', orta: '#b5b1aa', koyu: '#8d867a', harita: '#ece7dd', cizgi: '#5f5a53', izgara: '#d6d0c5' };

// El titremeli kalem (kol.js kalemKur kopyası): her çağrı kendi sabit sapmasını, kareye göre kaynamasını alır
function kalem(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}

// Düz kenar: her kenarın uçlarına r px yakın ara nokta (uzun kenara orta nokta) eklenir; Catmull-Rom kenarı şişirmez
function duz(pts, kapali = true, r = 5) {
  const n = pts.length, out = [], m = kapali ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = Math.min(0.3, r / L);
    const ara = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out.push(a, ara(u));
    if (L > 8 * r) out.push(ara(0.5));
    out.push(ara(1 - u));
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}
const ov = (x, y, rx, ry, n = 14) => oval(x, y, rx, ry, 0, 360, n, 2);

// ---------- Gövde ölçüleri (yapıya göre): omuz eklemleri, omuz eğiminin bittiği nokta
function omuzlar(p, kalinlik) {
  const Y = YAPI[p.yapi] || YAPI.orta, ek = p.boy === 'uzun' ? 8 : 0;
  const omuzY = GOZ_Y + 4 + p.yuzBoy + ek + 40, r0 = kalinlik / 2, dx = 160 * Y.en - r0 + 2;
  const y = omuzY + 18 + r0 - Y.omuz * 0.5;
  return { sol: [200 - dx, y], sag: [200 + dx, y], ucu: (yon) => [200 + yon * 119 * Y.en, omuzY + 14 - Y.omuz * 0.5], omuzY };
}
// Gövde kesimi (kol.js govdeKes'in yapıya uyarlanmış kopyası): kol çizilen yanda pelerin silüeti göğüs hattından kesilir
function govdeKes(p, { sol, sag, id, kaynama, w = 4.2 }) {
  const Y = YAPI[p.yapi] || YAPI.orta, en = Y.en, ek = p.boy === 'uzun' ? 8 : 0, om = Y.omuz;
  const cx = 200, ceneY = GOZ_Y + 4 + p.yuzBoy, omuzY = ceneY + ek + 40, y0 = omuzY + 10, gg = 108 * en;
  const yan = (yon) => [[cx + yon * 119 * en, omuzY + 14 - om * 0.5], [cx + yon * 126 * en, omuzY + 44 - om * 0.3], [cx + yon * (gg + 8), omuzY + 86],
    [cx + yon * (gg + 1), omuzY + 124], [cx + yon * gg, omuzY + 210], [cx + yon * (gg + 4), 560], [cx + yon * (gg + 9), 680]];
  const R = yan(1), L = yan(-1);
  const d = (pts) => yol(pts, false, SIFIR).replace(/^M/, 'L');
  const kd = `M-1000 -1000 L1400 -1000 ` +
    (sag ? `L1400 ${y0} L${cx + 119 * en} ${y0} ${d(R)} L${cx + gg + 9} 900 ` : `L1400 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} L${cx - 119 * en} ${y0} L-1000 ${y0} Z` : `L-1000 900 Z`);
  const hw = p.yuzEn;
  const gd = `M${cx - hw * 0.5} ${ceneY + 10} L${cx + hw * 0.5} ${ceneY + 10} L${cx + 118 * en} ${omuzY + 14} ` +
    (sag ? `${d(R)} L${cx + gg + 9} 900 ` : `L${cx + 164 * en} ${omuzY + 56} L${cx + 180 * en} 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} ` : `L${cx - 180 * en} 900 L${cx - 164 * en} ${omuzY + 56} `) + `L${cx - 118 * en} ${omuzY + 14} Z`;
  const s = kalem(p.tohum + 41, kaynama);
  const cz = (pts) => `<path d="${yol(pts, false, s())}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {
    tanim: `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${kd}"/></clipPath><clipPath id="${id}-g" clipPathUnits="userSpaceOnUse"><path d="${gd}"/></clipPath></defs>`,
    klip: `clip-path="url(#${id})"`, kontur: (sag ? cz(R) : '') + (sol ? cz(L) : ''),
  };
}
const aciDer = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;

// ---------- 60 fps kol geçişi. Kol tanımı: kolSVG parametreleri (omuz, dirsek, bilek, el, elAci, basparmak…). İki tanım
// arası: kol iki yoldan biriyle akar (aşağıda mod), el ön kolu izler, öbür sayılar doğrusal; el pozu, yüz, taraf gibi ayrık
// alanlar eşikte değişir. (s3-balkon.js'teki ile aynı)
const aciFark = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
// kolSVG'nin varsayılanları (bir tanımda eksik alan karışırken)
const VARSAY = { kisalma: (p) => (p.el === 'dayanma' ? 0.62 : 1), basparmak: (p) => (p.taraf === 'sag' ? 1 : -1) * (p.yuz === 'avuc' ? 1 : -1) };
// a: geçiş anahtarı { esik, mod, elYon }. mod 'eklem' (varsayılan): üst kol omuz çevresinde en kısa yoldan döner, ön kol dirsek
// açısıyla açılıp kapanır (kaldırma, savurma, indirme yay çizer). mod 'el': el önde gider, bilek düz yolda, dirsek IK
// (bir hedefe uzanma, bırakma: el masanın altına sarkmaz)
function kolKaris(A, B, u, a = {}) {
  const esik = a.esik ?? 0.5;
  if (u <= 0) return A;
  if (u >= 1 || !A || !B) return u < esik ? A : B;
  const dir = (p) => p.dirsek || kolIK(p.omuz, p.bilek, p.ust ?? 160, p.alt ?? 150, p.bukulme ?? 1);
  const dA = dir(A), dB = dir(B), C = { ...(u < esik ? A : B) };
  const ara = (p, q) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
  const uz = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  const yon = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) / D2R;
  const omuz = ara(A.omuz, B.omuz);
  const ust = uz(A.omuz, dA) * (1 - u) + uz(B.omuz, dB) * u, alt = uz(dA, A.bilek) * (1 - u) + uz(dB, B.bilek) * u;
  let dirsek, bilek;
  if (a.mod === 'el') {
    bilek = ara(A.bilek, B.bilek);
    const yan = (p, d) => (Math.sign((p.bilek[0] - p.omuz[0]) * (d[1] - p.omuz[1]) - (p.bilek[1] - p.omuz[1]) * (d[0] - p.omuz[0])) || 1);
    const sA = yan(A, dA), sB = yan(B, dB);
    const eA = kolIK(omuz, bilek, ust, alt, sA);
    dirsek = sA === sB ? eA : ara(eA, kolIK(omuz, bilek, ust, alt, sB));
  } else {
    const uA = yon(A.omuz, dA), uB = yon(B.omuz, dB), fA = yon(dA, A.bilek), fB = yon(dB, B.bilek);
    const ua = uA + aciFark(uA, uB) * u;
    dirsek = [omuz[0] + Math.cos(ua * D2R) * ust, omuz[1] + Math.sin(ua * D2R) * ust];
    const fa = (ua + aciFark(uA, fA) * (1 - u) + aciFark(uB, fB) * u) * D2R;
    bilek = [dirsek[0] + Math.cos(fa) * alt, dirsek[1] + Math.sin(fa) * alt];
  }
  Object.assign(C, { omuz, dirsek, bilek });
  // el ön kolu izler: el açısı ön kola göre (bilek bükümü) karışır
  // (a.elYon ±1: bilek bu yöne döner; ör. elin yüzün önünden değil dışarıdan dönmesi için)
  const buk = (p, d) => aciFark(yon(d, p.bilek), p.elAci ?? yon(d, p.bilek));
  const bA = buk(A, dA);
  let bB = buk(B, dB);
  if (a.elYon < 0 && bB > bA) bB -= 360;
  if (a.elYon > 0 && bB < bA) bB += 360;
  C.elAci = yon(dirsek, bilek) + bA * (1 - u) + bB * u;
  const iki = (ad) => [A[ad] ?? VARSAY[ad]?.(A), B[ad] ?? VARSAY[ad]?.(B)];
  for (const ad of ['elBoy', 'kisalma']) { const [p, q] = iki(ad); if (typeof p === 'number' && typeof q === 'number') C[ad] = p + (q - p) * u; }
  const [pa, pb] = iki('basparmak');
  if (pa * pb > 0) C.basparmak = pa + (pb - pa) * u; // ters yandaysa el eşikte döner
  C.ara = true; // ara değer (s4: gizli poz yalnız tam oturmuşken çizilmez)
  return C;
}
// Hareket izi: anahtarlar { bas, sure, poz(f), ease, esik, mod } (bas: geçişin başladığı iç kare, bas sırasında). f karesindeki
// durum: her anahtar, bir öncekinin kendi başladığı andaki ara durumundan pozuna `sure` karede akar (yarıda kesilen sıçramaz)
const izOran = (a, f) => (a.sure > 0 ? a.ease(Math.min(1, Math.max(0, (f - a.bas) / a.sure))) : 1);
function izDurum(iz, f, karis) {
  let bas = null, akt = null;
  for (const a of iz) {
    if (a.bas > f) break;
    if (akt) bas = karis(bas, akt.poz(a.bas), izOran(akt, a.bas), akt);
    akt = a;
  }
  return akt ? karis(bas, akt.poz(f), izOran(akt, f), akt) : null;
}


// ---------- Kâğıt figür çizimleri (kart birimi: u ∈ [−0,5; 0,5] sağa, v ∈ [0; 1] yukarı). 2B sahnede ve 3B dokuda aynı.
// d: dolgu tonu (TON anahtarı), k: kapalı, w: çizgi kalınlığı çarpanı. Genel fantastik figürler (tanınır karakter değil).
const FIGUR = {
  sovalye: [
    { p: [[-0.2, 0.08], [0.2, 0.08], [0.25, 0.47], [0.12, 0.56], [-0.12, 0.56], [-0.25, 0.47]], k: 1, d: 'orta' },
    { p: ov(0, 0.68, 0.13, 0.12), k: 1, d: 'acik' },
    { p: [[-0.09, 0.67], [0.09, 0.67]], w: 0.7 },
    { p: [[0.02, 0.8], [0.1, 0.89], [0.21, 0.86]], w: 0.8 },
    { p: [[0.31, 0.14], [0.33, 0.88]] }, { p: [[0.23, 0.31], [0.42, 0.33]] },
    { p: ov(-0.21, 0.35, 0.15, 0.18), k: 1, d: 'koyu' },
    { p: [[-0.21, 0.24], [-0.21, 0.46]], w: 0.6 }, { p: [[-0.3, 0.36], [-0.12, 0.36]], w: 0.6 },
  ],
  buyucu: [
    { p: [[-0.25, 0.08], [0.25, 0.08], [0.13, 0.56], [-0.13, 0.56]], k: 1, d: 'orta' },
    { p: ov(0, 0.63, 0.11, 0.1), k: 1, d: 'acik' },
    { p: [[-0.1, 0.6], [0.1, 0.6], [0, 0.38]], k: 1, d: 'kagit' },
    { p: [[-0.24, 0.7], [0.24, 0.7], [0.05, 0.98]], k: 1, d: 'koyu' },
    { p: [[-0.3, 0.1], [-0.31, 0.8]] }, { p: ov(-0.31, 0.85, 0.07, 0.07), k: 1, d: 'kagit' },
  ],
  canavar: [
    { p: [[-0.22, 0.08], [0.22, 0.08], [0.27, 0.42], [-0.27, 0.42]], k: 1, d: 'koyu' },
    { p: ov(0, 0.57, 0.21, 0.17), k: 1, d: 'orta' },
    { p: [[-0.15, 0.69], [-0.29, 0.88], [-0.05, 0.73]], k: 1, d: 'acik' },
    { p: [[0.15, 0.69], [0.29, 0.88], [0.05, 0.73]], k: 1, d: 'acik' },
    { p: ov(-0.08, 0.6, 0.03, 0.035, 8), k: 1, d: 'cizgi' }, { p: ov(0.08, 0.6, 0.03, 0.035, 8), k: 1, d: 'cizgi' },
    { p: [[-0.11, 0.51], [-0.055, 0.48], [0, 0.51], [0.055, 0.48], [0.11, 0.51]], w: 0.7 },
    { p: [[-0.25, 0.36], [-0.39, 0.6], [-0.33, 0.66]] }, { p: [[0.25, 0.36], [0.39, 0.6], [0.33, 0.66]] },
  ],
};

// ---------- 2B tavla zarı (noktalı d6): altıgen (üst yüz + iki yan yüz), her yüzde noktalar
const ALTI = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26]];
const YUZ = {
  ust: [[0, -0.52], [0.46, -0.26], [0, -0.01], [-0.46, -0.26]],
  sol: [[-0.46, -0.26], [0, -0.01], [0, 0.52], [-0.46, 0.26]],
  sag: [[0, -0.01], [0.46, -0.26], [0.46, 0.26], [0, 0.52]],
};
const PIP = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
function yuzNokta(q, u, v) {
  const s = 0.5 + 0.3 * u, t = 0.5 + 0.3 * v;
  const a = (1 - s) * (1 - t), b = s * (1 - t), c = s * t, d = (1 - s) * t;
  return [a * q[0][0] + b * q[1][0] + c * q[2][0] + d * q[3][0], a * q[0][1] + b * q[1][1] + c * q[2][1] + d * q[3][1]];
}

// ---------- Zar fiziği: yuvarlatılmış küp (8 köşe küresi, yarıçap rr) + yatay düzlem (y = 0). Kütle 1, kenar 1: küpün
// eylemsizliği yönden bağımsız (I = 1/6), dünya çerçevesinde skaler kalır. Darbe tabanlı ardışık çözüm (geri sekme yalnız ilk
// turda), Coulomb sürtünmesi, temas varken dönme ve kayma sönümü; uyuyunca durur. Tohum yok: aynı girdi, aynı yol.
// Döner: 60 fps kareler [{ p, q }], darbeler [{ f (kare), hiz, p }].
function zarSim({ p0, v0, w0, q0, g = 70, e = 0.5, mu = 0.25, rr = 0.13, dt = 1 / 1200, sure = 2.4, ic = 8 }) {
  const h = 0.5 - rr, invI = 6;
  const p = [...p0], v = [...v0], w = [...w0], q = [...q0];
  const C = [];
  for (const a of [-h, h]) for (const b of [-h, h]) for (const c of [-h, h]) C.push([a, b, c]);
  const don = (q, x) => {
    const [qx, qy, qz, qw] = q, [x0, y0, z0] = x;
    const ix = qw * x0 + qy * z0 - qz * y0, iy = qw * y0 + qz * x0 - qx * z0, iz = qw * z0 + qx * y0 - qy * x0, iw = -qx * x0 - qy * y0 - qz * z0;
    return [ix * qw - iw * qx - iy * qz + iz * qy, iy * qw - iw * qy - iz * qx + ix * qz, iz * qw - iw * qz - ix * qy + iy * qx];
  };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const kareler = [], darbeler = [];
  const adim = Math.round(1 / 60 / dt), N = Math.round(sure * 60);
  let uyku = 0, uyudu = false;
  for (let f = 0; f < N; f++) {
    kareler.push({ p: [...p], q: [...q] });
    if (uyudu) continue;
    for (let s = 0; s < adim; s++) {
      v[1] -= g * dt;
      for (let i = 0; i < 3; i++) p[i] += v[i] * dt;
      const [qx, qy, qz, qw] = q, [wx, wy, wz] = w;
      q[0] += 0.5 * dt * (wx * qw + wy * qz - wz * qy);
      q[1] += 0.5 * dt * (wy * qw + wz * qx - wx * qz);
      q[2] += 0.5 * dt * (wz * qw + wx * qy - wy * qx);
      q[3] += 0.5 * dt * (-wx * qx - wy * qy - wz * qz);
      const ql = Math.hypot(...q); for (let i = 0; i < 4; i++) q[i] /= ql;
      const tem = [];
      for (const c of C) { const r = don(q, c); const y = p[1] + r[1] - rr; if (y < 0) tem.push({ r: [r[0], r[1] - rr, r[2]], d: -y }); }
      for (let it = 0; it < ic; it++) {
        for (const t of tem) {
          const r = t.r, vn = v[1] + w[2] * r[0] - w[0] * r[2];
          if (vn >= 0) continue;
          const rn = crs(r, [0, 1, 0]), kn = 1 + invI * (rn[0] ** 2 + rn[1] ** 2 + rn[2] ** 2);
          const ee = it === 0 && vn < -1.5 ? e : 0;
          if (it === 0 && vn < -4) darbeler.push({ f: f + s / adim, hiz: -vn, p: [p[0] + r[0], 0, p[2] + r[2]] });
          const jn = -(1 + ee) * vn / kn;
          v[1] += jn;
          const tq = crs(r, [0, jn, 0]); for (let i = 0; i < 3; i++) w[i] += invI * tq[i];
          const vx = v[0] + w[1] * r[2] - w[2] * r[1], vz = v[2] + w[0] * r[1] - w[1] * r[0], vt = Math.hypot(vx, vz);
          if (vt > 1e-7) {
            const tt = [vx / vt, 0, vz / vt], rt = crs(r, tt), kt = 1 + invI * (rt[0] ** 2 + rt[1] ** 2 + rt[2] ** 2);
            const jt = Math.max(-mu * jn, -vt / kt);
            v[0] += tt[0] * jt; v[2] += tt[2] * jt;
            const tq2 = crs(r, [tt[0] * jt, 0, tt[2] * jt]); for (let i = 0; i < 3; i++) w[i] += invI * tq2[i];
          }
        }
      }
      if (tem.length) {
        const d = Math.max(...tem.map((t) => t.d)); if (d > 0.002) p[1] += (d - 0.002) * 0.6;
        const sn = 1 - 2.2 * dt; for (let i = 0; i < 3; i++) w[i] *= sn; v[0] *= 1 - 0.5 * dt; v[2] *= 1 - 0.5 * dt;
      }
      if (tem.length >= 3 && Math.hypot(...v) < 0.12 && Math.hypot(...w) < 0.35) uyku += dt; else uyku = 0;
      if (uyku > 0.12) { uyudu = true; break; }
    }
  }
  const tek = [];
  for (const d of darbeler) if (!tek.length || d.f - tek[tek.length - 1].f > 4) tek.push(d); else tek[tek.length - 1].hiz = Math.max(tek[tek.length - 1].hiz, d.hiz);
  return { kareler, darbeler: tek };
}
const qEuler = (x, y, z) => {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2), s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3];
};
// Atışlar (deneme ile seçildi: ilk değme ~k15, ~70 kare yuvarlanma, düz yüzde durur). Son konum (x, z) sahneye taşınır.
const ATISLAR = [
  { p0: [-1.8, 3.4, -11], v0: [1.0, -2, 13], w0: [12, 3, -5], e0: [0.4, 0.8, 0.2], hedef: [-1.35, 0.25] },
  { p0: [1.6, 3.8, -11.6], v0: [-0.7, -1.5, 13.5], w0: [-9, -6, 10], e0: [1.1, 0.3, 0.9], hedef: [1.35, -0.55] },
];

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, W, H, DIKEY, VURGU, BALON, KAGIT } = ctx;
  ctx.vurus(14, 'Sohbet, E zarları atar', BAS, KY - 1);
  ctx.vurus(15, 'Yakın plan: tavla zarları (3B), devrik kart', KY, KO - 1);
  ctx.vurus(16, 'Kart masada; "Keşke piyonlarımız…", "Keşke FRP zarlarımız…"', KO, K_GERI - 1);
  ctx.vurus(17, 'Üçü düşünür: piyonlar, zarlar, minifigür', K_GERI, SON);

  // ---------- Katmanlar: oda < sahne (kişiler, masa, kollar, perde, zarlar) < balonlar < 3B yakın plan < 3B izleri
  const L0 = ctx.katman('s4-frp-oda', 9), L = ctx.katman('s4-frp', 10), LB = ctx.katman('s4-frp-balon', 11);
  const L3 = ctx.katman('s4-frp-3b', 12), L3s = ctx.katman('s4-frp-3b-iz', 13);
  for (const K of [L0, L, LB, L3, L3s]) {
    gsap.set(K.div, { autoAlpha: 0 });
    tl.set(K.div, { autoAlpha: 0 }, 0);
  }

  // ---------- Yerleşim (dünya). Masa: yassı oval üst yüz; kişiler uzak kenarın arkasında, kenar göğüslerini keser.
  const MASA = { c: [960, 905], r: [930, 150] };
  const kenarY = (x) => MASA.c[1] - MASA.r[1] * Math.sqrt(Math.max(0, 1 - ((x - MASA.c[0]) / MASA.r[0]) ** 2));
  const KESIT = 460; // masa uzak kenarı orta boylu kişinin kutusunda bu yükseklikten geçer (göğüs ortası)
  // yuk: oturma yüksekliği (dünya px): E perdenin ardında tabureye oturur
  const YER = { E4: { x: 300, s: 1.08 }, E3: { x: 745, s: 1.08 }, E: { x: 1185, s: 1.08, yuk: 64 }, E2: { x: 1625, s: 1.06 } };

  // ---------- Gruplar (L): gövdeler < masa < kollar < perde < figürler, zarlar < efekt
  // gKolOn: perdenin kenarından öne sarkan el (E'nin zar atışı): yalnız el, perdenin önünde
  const gGovde = el(L.svg, 'g'), gMasa = el(L.svg, 'g'), gKol = el(L.svg, 'g'), gPerde = el(L.svg, 'g'), gKolOn = el(L.svg, 'g');
  const gFigur = el(L.svg, 'g'), gZar = el(L.svg, 'g'), gEfekt = el(L.svg, 'g');
  // Kolun yalnız eli (kolSVG dizgesinden): el en sonda çizilsin diye elOnde; aynı kol eli neredeyse sıfır boyla bir kez daha
  // çizilir, iki dizgenin ortak başı kol (kalem titremesi ikisinde aynı sırayla akar), ayrıldıkları yerden sonrası eldir
  const elYalniz = (P) => {
    const a = kolSVG({ ...P, golge: null, elOnde: true }), b = kolSVG({ ...P, golge: null, elOnde: true, elBoy: 0.01 });
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    return a.slice(a.lastIndexOf('<path', i));
  };
  const oyuncular = [];
  // Kişi: gövde (masanın altında) ve kollar (masanın üstünde) ayrı svg'de. Yüz ve göz ayrık (h.poz, tl.call); kollar her
  // kolun kendi izinden 60 fps: h.kolAt(n, { sol, sag }, sure, ease, mod | { mod, elYon }) n'de başlayan geçiş ekler (ad →
  // POZ ya da ozel). Çizim her karede h.surdur(f)'te, kollar ya da yüz/kaynama değiştiyse (kaynama 8 fps). bos: kolu null
  // olan kişinin gizli pozu
  function oyuncu(ad, { kalinlik = 64, giysi = null, manset = 'duz', kolBoyu = 'uzun', ozel = null, bos = null }) {
    const p = ctx.kisiParam(ad), { x, s, yuk = 0 } = YER[ad];
    const kY = kenarY(x);
    const y0 = kY - KESIT * s + ctx.boyKaymasi(p) * s - yuk, x0 = x - BOY.en * s / 2;
    const gB = el(gGovde, 'g'), gK = el(gKol, 'g'), gO = el(gKolOn, 'g');
    const yap = (g) => el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * s, height: BOY.boy * s, x: x0, y: y0, overflow: 'visible' });
    const sB = yap(gB), sK = yap(gK), sO = yap(gO);
    const o = omuzlar(p, kalinlik);
    const id = `s4-${ad}`;
    const h = {
      ad, p, s, x, x0, y0, ifade: 'notr', bakis: [0, 0], o, kalinlik,
      dunya: ([u, v]) => [x0 + u * s, y0 + v * s],
      kutu: ([X, Y]) => [(X - x0) / s, (Y - y0) / s],
      kenar: (kY - y0) / s,   // masa uzak kenarının bu kişinin kutusundaki yüksekliği
      iz: { sol: [], sag: [] }, kollar: { sol: null, sag: null }, kirli: true,
    };
    let son = 0;
    // yon'daki kolun f karesindeki pozu (kolSVG tanımı, kutu birimi)
    const poz = (yon, ad2, f) => {
      const a = ad2 ?? bos;
      if (!a) return null;
      const P = (ozel && ozel(h, yon, a, f)) || POZ[a]?.(h, yon, f);
      if (!P) return null;
      const taraf = yon < 0 ? 'sol' : 'sag';
      return { omuz: o[taraf], omuzUcu: o.ucu(yon), taraf, tohum: p.tohum % 50 + (yon < 0 ? 1 : 2), elBoy: EB, ...P };
    };
    h.kolAt = (n, kol, sure = 6, ease = 'sine.inOut', ops = 'eklem', esik = 0.5) => {
      const sec = typeof ops === 'string' ? { mod: ops } : ops;
      for (const [taraf, ad2] of Object.entries(kol)) {
        const yon = taraf === 'sol' ? -1 : 1;
        h.iz[taraf].push({ bas: n, sure, ease: gsap.parseEase(ease), esik, ...sec, poz: (f) => poz(yon, ad2, f) });
        h.iz[taraf].sort((a, b) => a.bas - b.bas);
      }
    };
    const ciz = () => {
      const ortak = { giysi: giysi || MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik, kaynama: son, manset, kolBoyu, golge: { klip: `url(#${id}-g)` } };
      const kol = (taraf) => {
        const P = h.kollar[taraf];
        if (!P || (P.gizli && !P.ara)) return '';
        return kolSVG({ ...ortak, ...P, araya: h.araya ? h.araya(taraf, P, son) : '' });
      };
      // elOn: kolun eli perdenin önünde bir kez daha (yalnız el; arkadaki kopyayla aynı çizim, dikiş görünmez)
      const onEl = (taraf) => {
        const P = h.kollar[taraf];
        return P && P.elOn && !(P.gizli && !P.ara) ? elYalniz({ ...ortak, ...P }) : '';
      };
      const sol = kol('sol'), sag = kol('sag');
      const G = govdeKes(p, { sol: !!sol, sag: !!sag, id, kaynama: son });
      sB.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: son, ifade: h.ifade, bakis: h.bakis, mono: true })}</g>` + G.kontur;
      sK.innerHTML = sol + sag;
      sO.innerHTML = onEl('sol') + onEl('sag');
    };
    h.ciz = (i) => { son = Math.max(0, i); h.kirli = true; };
    h.poz = ({ ifade, bakis } = {}) => { if (ifade) h.ifade = ifade; if (bakis) h.bakis = bakis; h.kirli = true; };
    let sonA = '';
    h.surdur = (f) => {
      const K = { sol: izDurum(h.iz.sol, f, kolKaris), sag: izDurum(h.iz.sag, f, kolKaris) };
      const a = JSON.stringify(K) + (h.araya ? h.arayaAnahtar() : '');
      if (!h.kirli && a === sonA) return;
      h.kollar = K; sonA = a; h.kirli = false;
      ciz();
    };
    // Eğilme ve doğrulma: masadaki temas noktası çevresinde (gövde + kollar birlikte); zip: gülme sarsıntısı (dy'ye eklenir)
    h.d = { dx: 0, dy: 0, aci: 0, s: 1, px: x, py: kY, zip: 0 };
    h.uygula = () => {
      const d = h.d;
      const t = `translate(${f1(d.dx)} ${f1(d.dy + d.zip)}) rotate(${f3(d.aci)} ${f1(d.px)} ${f1(d.py)}) translate(${f1(d.px)} ${f1(d.py)}) scale(${f3(d.s)}) translate(${f1(-d.px)} ${f1(-d.py)})`;
      gB.setAttribute('transform', t); gK.setAttribute('transform', t); gO.setAttribute('transform', t);
    };
    // Duruş tween'i (60 fps; verilmezse sine.inOut): İÇ kare zamanlı
    h.dur = (n0, sure, hedef, ease = 'sine.inOut') => tl.to(h.d, { ...hedef, duration: k(sure), ease, onUpdate: h.uygula }, k(n0));
    ciz();
    ctx.kaynayanlar.add(h.ciz);
    oyuncular.push(h);
    return h;
  }

  // ---------- Kol pozları (kutu birimi). yon −1: ekranın solu (kişinin sağ eli), +1: sağı (sol eli). S: omuz eklemi;
  // kn: masa kenarı. Başparmak kuralı (kişi izleyiciye dönük; kol.js'te basparmak +1: başparmak, parmak yönünün saat
  // yönü yanında): izleyici AVCU görüyorsa basparmak −yon, EL SIRTINI görüyorsa +yon. Yani avucu izleyiciye dönük kalkık
  // elde başparmak içe (yüze), sırtı dönük kalkık elde dışa; masaya düz basan elde (sırt görünür) başparmaklar içe,
  // birbirine bakar. kol.js yumruk, işaret ve çene pozları avuç yanından çizilir (başparmak önden geçer): −yon.
  const S = (h, yon) => h.o[yon < 0 ? 'sol' : 'sag'];
  const masaEl = (h, yon, dirsek, hedef, kisalma = 0.74) => {
    const elAci = aciDer(dirsek, hedef), basparmak = yon; // avuç masada, el sırtı görünür
    const bilek = bilekBul({ el: 'dayanma', hedef, elAci, elBoy: EB, basparmak, kisalma, ad: 'avuc' });
    return { dirsek, bilek, el: 'dayanma', elAci, basparmak, kisalma };
  };
  const POZ = {
    // ön kol masada, el düz; iki el yan yana, başparmaklar ortada buluşur (üst üste binmez)
    masa: (h, yon) => { const [sx] = S(h, yon), kn = h.kenar; return masaEl(h, yon, [sx + yon * 14, kn + 44], [200 + yon * 44, kn + 114]); },
    // masaya vurmuş el (biraz dışarıda)
    vur: (h, yon) => { const [sx] = S(h, yon), kn = h.kenar; return masaEl(h, yon, [sx + yon * 34, kn + 36], [200 + yon * 70, kn + 100], 0.8); },
    // vurmaya kalkmış el (avuç aşağı, masanın üstünde): bilekten öne (izleyiciye) bükülür, el sırtı ön kolun önünde görünür
    vurHazir: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 44, sy + 150], bilek: [sx + yon * 40, sy + 30], el: 'dayanma', elAci: yon < 0 ? 64 : 116, basparmak: yon, kisalma: 0.85, elOnde: true }; },
    // anlatırken kalkan el (avuç izleyiciye, parmaklar yukarı)
    anlat: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 30, h.kenar + 6], bilek: [sx - yon * 4, sy - 60], el: 'acik', yuz: 'avuc', elAci: -90 + yon * 12, basparmak: -yon }; },
    anlat2: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 70, h.kenar - 40], bilek: [sx + yon * 84, sy - 104], el: 'acik', yuz: 'avuc', elAci: -90 + yon * 30, basparmak: -yon }; },
    // omuz silkme: avuçlar yukarı, eller iki yanda
    silk: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 40, sy + 140], bilek: [sx + yon * 128, sy + 78], el: 'acik', yuz: 'avuc', elAci: yon > 0 ? -28 : -152, basparmak: -yon, kisalma: 0.86 }; },
    // dışarı doğru gösterme (işaret parmağı): el omuz hizasının üstünde, perdenin ve canavarın üstünden gösterir
    isaret: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 50, sy + 54], bilek: [sx + yon * 104, sy - 70], el: 'isaret', elAci: yon > 0 ? -22 : 202, basparmak: -yon }; },
    // göstermeden önce el omuz hizasına kalkar (parmak yukarı): el perdenin kanadının yanından değil üstünden geçer
    isaret0: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 36, sy + 76], bilek: [sx + yon * 46, sy - 24], el: 'isaret', elAci: yon > 0 ? -60 : -120, basparmak: -yon }; },
    // gülerken eli ağzında (el sırtı izleyiciye, parmaklar içeri)
    agiz: (h, yon) => {
      const [sx] = S(h, yon), elAci = yon < 0 ? -4 : -176, basparmak = yon;
      const bilek = bilekBul({ el: 'acik', hedef: [200 + yon * 4, GOZ_Y + 14 + h.p.yuzBoy * 0.56], elAci, elBoy: EB, basparmak, ad: 'avuc' });
      return { dirsek: [sx + yon * 24, h.kenar + 4], bilek, el: 'acik', yuz: 'sirt', elAci, basparmak };
    },
    // eli çenede (parmak sırtları çeneyi taşır, dirsek masada)
    // (avuç yanı izleyiciye: başparmak içte, çene hattında; yumruğun ucu çenenin altına biraz biner, boyunda kalmaz)
    cene: (h, yon) => {
      const [sx] = S(h, yon), elAci = yon > 0 ? -116 : -64, basparmak = -yon;
      const bilek = bilekBul({ el: 'cene', hedef: [200 - yon * 2, GOZ_Y + 4 + h.p.yuzBoy - 6], elAci, elBoy: EB, basparmak, ad: 'cene' });
      return { dirsek: [sx + yon * 26, h.kenar + 10], bilek, el: 'cene', elAci, basparmak };
    },
  };

  // ---------- E3'ün elindeki kâğıt şövalye (kol.js araya: parmakların arasında, kutu birimi). Taban 'tutma' pozunun tut
  // noktasında, kart yukarı uzanır; bukum 0 → dik, 1 → ~95° yana yığılmış (kâğıt zayıf, boynunu büker).
  const kart = { b: -1 };
  // kart yüzün yanında, çene ile göz hizası arasında (okunsun diye masadaki figürden biraz büyük)
  // (dirsek gövdeye yakın: dışa açılırsa perdenin sol kanadına biniyordu)
  const TUT = { bilek: (h) => { const [sx, sy] = S(h, 1); return [sx - 30, sy - 22]; }, dirsek: (h) => { const [sx, sy] = S(h, 1); return [sx + 6, sy + 132]; }, elAci: -64 };
  // bilek, elAci: o karedeki elin (ara değerli) yeri; kart elle birlikte gelir
  const kartElde = (h, bukum, kaynama, bilek = TUT.bilek(h), elAci = TUT.elAci) => {
    const [bx, by] = elNoktasi({ el: 'tutma', bilek, elAci, elBoy: EB, basparmak: 1, ad: 'tut' });
    const Hc = 108, ww = Hc * 0.62, th = bukum * 1.65;
    const C = (v) => {
      if (th < 1e-3) return [[bx, by - Hc * v], [0, -1]];
      const R = Hc / th, a = th * v;
      return [[bx + R * (1 - Math.cos(a)), by - R * Math.sin(a)], [Math.sin(a), -Math.cos(a)]];
    };
    // yana yığılan kart izleyiciye yan döner: en 0,7'ye kısalır
    const nk = ([u, v]) => { const [p, tg] = C(v), n = [-tg[1], tg[0]]; return [p[0] + n[0] * u * ww * 0.7, p[1] + n[1] * u * ww * 0.7]; };
    const s = kalem(777, kaynama, 0.6);
    const kenar = [];
    for (let i = 0; i <= 8; i++) kenar.push(nk([-0.5, i / 8]));
    for (let i = 8; i >= 0; i--) kenar.push(nk([0.5, i / 8]));
    const yolS = (pts, kapali, dolgu, w) => { const d = yol(pts, kapali, s()); return (dolgu ? `<path d="${d}" fill="${dolgu}" transform="translate(1.5 1.5)"/>` : '') + `<path d="${d}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; };
    let str = yolS(kenar, true, TON.kagit, 3.2);
    for (const f of FIGUR.sovalye) str += yolS(f.p.map(nk), !!f.k, f.d ? (f.d === 'cizgi' ? TON.cizgi : TON[f.d]) : null, 2.4 * (f.w || 1));
    return str;
  };

  // ---------- Kişiler
  const E4 = oyuncu('E4', { kalinlik: 56, manset: 'gomlek' });
  const E3 = oyuncu('E3', {
    kalinlik: 74, kolBoyu: 'sivali',
    ozel: (h, yon, ad) => {
      const [sx, sy] = S(h, yon), kn = h.kenar;
      // E3'ün sohbet jestleri (kullanıcı 2026-10-23: eli figürlerin ve perdenin içinden geçiyordu): eller gövdesinin önünde,
      // masadan yüksekte, dirsekler gövdeye yakın; sağ kol (perde yanı) dünyada x < 980'de kalır. Avuç izleyiciye: −yon.
      // anlat: iki el göğüs önünde kalkık
      if (ad === 'anlat') return { dirsek: [sx + yon * 10, kn - 14], bilek: [sx - yon * 18, sy - 46], el: 'acik', yuz: 'avuc', elAci: -90 + yon * 10, basparmak: -yon };
      // anlat2: sol el biraz dışarı ve yukarı açılır (E4'e uzanmaz), sağ el göğse iner
      if (ad === 'anlat2') {
        return yon < 0
          ? { dirsek: [sx - 12, kn - 30], bilek: [sx - 14, sy - 74], el: 'acik', yuz: 'avuc', elAci: -108, basparmak: 1 }
          : { dirsek: [sx + 6, kn - 2], bilek: [sx - 40, sy + 6], el: 'acik', yuz: 'avuc', elAci: -70, basparmak: -1 };
      }
      // espri: avuçlar yukarı, eller göğüs hizasında iki yanda (küçük omuz silkme; parmaklar yukarı, perdeye uzanmaz)
      if (ad === 'avuc') return { dirsek: [sx + yon * 20, sy + 150], bilek: [sx - yon * 8, sy + 66], el: 'acik', yuz: 'avuc', elAci: yon > 0 ? -62 : -118, basparmak: -yon, kisalma: 0.9 };
      // masadaki devrik kâğıda uzanma / tutup kaldırma (kâğıt parmakların arasında: h.araya). Tutma pozu el sırtından
      // görünür (parmaklar kâğıdın önünden sarar, başparmak arkada): basparmak +yon. Dirsek alçak ve gövdeye yakın: ön kol
      // perdenin sol kanadının altından kâğıda uzanır
      if (ad === 'uzan') {
        const hedef = h.kutu(DEVRIK.tut), elAci = 34;
        const bilek = bilekBul({ el: 'tutma', hedef, elAci, elBoy: EB, basparmak: yon, ad: 'tut' });
        return { dirsek: [sx - 16, kn + 34], bilek, el: 'tutma', elAci, basparmak: yon };
      }
      // kaldırırken önce göğsün önüne (bilek omuzdan uzak: dirsek dışa, perdeye doğru kırılmaz), sonra yüzün yanına
      if (ad === 'kaldir') return { dirsek: [sx - 10, kn + 30], bilek: [sx - 145, sy + 88], el: 'tutma', elAci: -30, basparmak: yon };
      if (ad === 'tut') return { dirsek: TUT.dirsek(h), bilek: TUT.bilek(h), el: 'tutma', elAci: TUT.elAci, basparmak: yon };
      return null;
    },
  });
  // kâğıt elde (kart.b ≥ 0): sağ el tutma pozundayken o anki elin parmakları arasında çizilir
  E3.araya = (taraf, P, kaynama) => (taraf === 'sag' && kart.b >= 0 && P.el === 'tutma' ? kartElde(E3, kart.b, kaynama, P.bilek, P.elAci) : '');
  E3.arayaAnahtar = () => String(kart.b);
  // E'nin zar sallayan yumruğunun titremesi (kare numarasından, sürekli): 7,5 Hz dikey, yarısı hızla yatay; uçlarda söner
  const T0 = K_SALLA + 10, T1 = K_ATIS - 21; // sallama: kol kalkınca başlar, yumruk havaya kalkmadan söner
  const titre = (f) => {
    const z = Math.min(1, Math.max(0, (f - T0) / 6), Math.max(0, (T1 - f) / 4));
    return [2.6 * Math.sin(2 * Math.PI * (f - T0 - 4) / 16 + 0.6) * z, -6.5 * Math.cos(2 * Math.PI * (f - T0 - 4) / 8) * z];
  };
  // E'nin kolları perdenin ardında (dinlenirken çizilmez: 'gizli' poz yalnız geçişte görünür); atış ve jestler sol kolla
  // (yatayda E3'ün yanı)
  const ATIS = { salla: [[66, 215], [34, 362], -96], kaldir: [[60, 186], [28, 334], -80] };
  // Zar atışı (K_ATIS − 5 … KY; kullanıcı 2026-10-23: "d6 zarını atarken el içeri katlanıyor"): eski 'at' pozunda el ön
  // kolun üstüne ~165° katlanıyor, geçişte bilek dışarıdan ~195° dönüyordu. Yeni atış önden bakan kameraya izdüşüm olarak
  // kurulur: kol öne ve aşağı açılır, ön kol izleyiciye doğru kısalır; yumruk bilek düz, ön kolla aynı doğrultuda ve onunla
  // aynı oranda kısalır (ekranda dönerken hep kısadır: yüzün önünden geçmez, katlanmaz). K_ATIS'te el açılır: parmaklar önce
  // izleyiciye (kısa), sonra masaya doğru uzar; avuç masaya bakar (el sırtı görünür, başparmak içte), bilek ön kola göre en
  // çok 44° öne kırılır. El perdenin kenarından öne sarkar (gKolOn'da perdenin önünde), açık kalıp yavaşça iner.
  // Kol anahtarları [iç kare, dirsek, bilek] (kutu birimi): salınım t², bırakış sonrası yavaşlayarak, iniş sine.inOut
  // (dirsek yukarıda ve önde: ön kol perdenin üstünden aşağı iner, yana uzanıyor gibi yatık durmaz)
  const ATIS_KOL = [[K_ATIS - 5, ATIS.kaldir[1], ATIS.kaldir[0]], [K_ATIS, [40, 296], [76, 340]], [K_ATIS + 8, [41, 300], [78, 344]], [K_ATIS + 28, [44, 312], [80, 350]]];
  // Açık el anahtarları [iç kare, bilek bükümü (° ön kola göre, + öne/aşağı), kısalma (el boyunun görünen oranı)]
  const ATIS_EL = [[K_ATIS, 6, 0.42], [K_ATIS + 2, 24, 0.66], [K_ATIS + 4, 34, 0.8], [K_ATIS + 8, 36, 0.82], [K_ATIS + 28, 44, 0.9]];
  const E_DY = -6; // atışta E doğrulur (EE.dur, dünya px): zarın elden çıkış noktası bununla
  const atisPoz = (yon, f) => {
    const K = ATIS_KOL;
    let i = 0;
    while (i < K.length - 2 && f >= K[i + 1][0]) i++;
    const [f0, d0, b0] = K[i], [f1, d1, b1] = K[i + 1];
    const t = Math.min(1, Math.max(0, (f - f0) / (f1 - f0)));
    const u = i === 0 ? t * t : i === 1 ? 1 - (1 - t) ** 3 : 0.5 - 0.5 * Math.cos(Math.PI * t);
    const ara2 = (p, q) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
    const dirsek = ara2(d0, d1), bilek = ara2(b0, b1);
    const onKol = aciDer(dirsek, bilek), boy = Math.hypot(bilek[0] - dirsek[0], bilek[1] - dirsek[1]);
    if (f < K_ATIS) {
      // yumruk: kaldir pozundan (bilek bükümü −2°) düz bileğe; ön kolla birlikte kısalır ama yumruk kalın bir kütle:
      // izleyiciye dönükken bile boyunun ~%45'i görünür (ince bir dilime dönmez)
      const L0 = Math.hypot(b0[0] - d0[0], b0[1] - d0[1]), buk0 = aciFark(aciDer(d0, b0), ATIS.kaldir[2]);
      const elAci = onKol + buk0 * (1 - u), kis = 0.45 + 0.55 * Math.min(1, boy / L0);
      // başparmak hep içte (ekranın sağı): el yukarı bakarken −yon, aşağı bakarken yon (dönüş el kısayken olur)
      return { dirsek, bilek, el: 'yumruk', elAci, elBoy: EB * 0.95, kisalma: kis, basparmak: Math.sin(elAci * D2R) < 0 ? -yon : yon, elOnde: kis < 0.8 };
    }
    const H = ATIS_EL;
    let j = 0;
    while (j < H.length - 2 && f >= H[j + 1][0]) j++;
    const v = Math.min(1, Math.max(0, (f - H[j][0]) / (H[j + 1][0] - H[j][0]))), w = v * v * (3 - 2 * v);
    const buk = H[j][1] + (H[j + 1][1] - H[j][1]) * w, kis = H[j][2] + (H[j + 1][2] - H[j][2]) * w;
    return { dirsek, bilek, el: 'acik', yuz: 'sirt', elAci: onKol + buk, kisalma: kis, basparmak: yon, elOnde: true, elOn: true };
  };
  const EE = oyuncu('E', {
    kalinlik: 56, manset: 'ribana', bos: 'gizli',
    ozel: (h, yon, ad, f) => {
      if (ad === 'salla' || ad === 'kaldir') {
        const [[bx, by], d, a] = ATIS[ad], [tx, ty] = ad === 'salla' ? titre(f) : [0, 0];
        return { dirsek: d, bilek: [bx + tx, by + ty], el: 'yumruk', elAci: a, elBoy: EB * 0.95, basparmak: -yon };
      }
      if (ad === 'atis') return atisPoz(yon, f);
      // konuşurken açık avuç yana ve yukarı ("keşke…"); el perdenin üstünde
      if (ad === 'goster') { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 40, h.kenar - 20], bilek: [sx + yon * 66, sy - 30], el: 'acik', yuz: 'avuc', elAci: yon < 0 ? -128 : -52, basparmak: -yon, kisalma: 0.9 }; }
      // perdenin ardında dinlenen kol (ön kol içe, el perdenin arkasında); kol perdenin üstüne bundan kalkar (dirsek perdenin
      // içinde kalacak kadar yüksek: kalkarken önündeki kâğıt figürün ardından geçmesin)
      if (ad === 'gizli') { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 24, sy + 104], bilek: [200 + yon * 72, sy + 98], el: 'acik', elAci: yon < 0 ? 8 : 172, basparmak: yon, gizli: 1 }; }
      return null;
    },
  });
  const E2 = oyuncu('E2', { kalinlik: 64, giysi: DERI });

  // ---------- Oda (L0): duvar saati ve raf (yalnız genel planda görünür; balonlara değmez)
  {
    const ust = el(L0.svg, 'g');
    const kutuN = (x0, y0, x1, y1) => duz([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true, 4);
    const SA = { c: [150, 130], r: 46 }, [sx, sy] = SA.c;
    cizgi(ust, oval(sx, sy, SA.r, SA.r, 0, 360, 22, 2), { kapali: true, dolgu: '#e6e1d8', kalinlik: 4.5, tohum: 501 });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, r0 = SA.r * 0.72, r1 = SA.r * 0.86;
      cizgi(ust, [[sx + r0 * Math.cos(a), sy + r0 * Math.sin(a)], [sx + r1 * Math.cos(a), sy + r1 * Math.sin(a)]], { kalinlik: 3, tohum: 502 + i });
    }
    cizgi(ust, [[sx, sy], [sx + SA.r * 0.32, sy - SA.r * 0.3]], { kalinlik: 4.5, tohum: 507 });
    const yelkovan = el(ust, 'g');
    cizgi(yelkovan, [[sx, sy], [sx, sy - SA.r * 0.7]], { kalinlik: 3.4, tohum: 508 });
    tl.fromTo(yelkovan, { rotation: -20, svgOrigin: `${sx} ${sy}` }, { rotation: 50, svgOrigin: `${sx} ${sy}`, duration: k(SON - BAS), ease: 'none', immediateRender: false }, k(BAS));
    const [rx0, ry0] = [1660, 200];
    cizgi(ust, kutuN(rx0, ry0, rx0 + 240, ry0 + 14), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 4, tohum: 510 });
    [[0, 70, 22, 2], [24, 84, 18, 5], [44, 62, 26, 1], [72, 76, 20, 3]].forEach(([dx, hh, ww, g], i) =>
      cizgi(ust, kutuN(rx0 + 12 + dx, ry0 - hh, rx0 + 12 + dx + ww, ry0), { kapali: true, dolgu: MONO.giysi[g], kalinlik: 3.4, tohum: 511 + i }));
    cizgi(ust, kutuN(rx0 + 128, ry0 - 46, rx0 + 228, ry0), { kapali: true, dolgu: MONO.giysi[6], kalinlik: 3.6, tohum: 520 });
  }

  // ---------- Masa (gMasa): üst yüz, ön kalınlık, ayaklar (dikey kadrajda görünür), harita
  const gTabla = el(gMasa, 'g');
  {
    const [cx, cy] = MASA.c, [rx, ry] = MASA.r;
    for (const [yon, i] of [[-1, 0], [1, 1]]) {
      const x = cx + yon * rx * 0.58, y = cy + ry * 0.8 + 30;
      cizgi(gTabla, duz([[x - 26, y - 10], [x + 26, y - 10], [x + 20, y + 620], [x - 20, y + 620]], true, 5), { kapali: true, dolgu: '#8d867a', kalinlik: 5, tohum: 535 + i });
    }
    const alt = oval(cx, cy, rx, ry, 0, 180, 26, 2.1).map(([x, y]) => [x, y + 36]);
    cizgi(gTabla, [...oval(cx, cy, rx, ry, 0, 180, 26, 2.1), ...alt.reverse()], { kapali: true, dolgu: '#a59e91', kalinlik: 5, tohum: 530 });
    cizgi(gTabla, oval(cx, cy, rx, ry, 0, 360, 52, 2.1), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5, tohum: 531 });
  }
  // Harita: perspektif kâğıt; (u, v) ∈ [0, 1] çift doğrusal (yassı masada ince bir şerit)
  const HQ = [[540, 788], [1370, 784], [1416, 884], [494, 888]];
  const hp = (u, v) => {
    const a = (1 - u) * (1 - v), b = u * (1 - v), c = u * v, d = (1 - u) * v;
    return [a * HQ[0][0] + b * HQ[1][0] + c * HQ[2][0] + d * HQ[3][0], a * HQ[0][1] + b * HQ[1][1] + c * HQ[2][1] + d * HQ[3][1]];
  };
  {
    const kenar = [];
    for (let i = 0; i < 10; i++) kenar.push(hp(i / 10, 0));
    for (let i = 0; i < 3; i++) kenar.push(hp(1, i / 3));
    for (let i = 0; i < 10; i++) kenar.push(hp(1 - i / 10, 1));
    for (let i = 0; i < 3; i++) kenar.push(hp(0, 1 - i / 3));
    cizgi(gTabla, kenar, { kapali: true, dolgu: TON.harita, kalinlik: 4, tohum: 540 });
    const izg = { kalinlik: 2, renk: TON.izgara, tohum: 541, genlik: 0.6 };
    for (let i = 1; i < 12; i++) cizgi(gTabla, [hp(i / 12, 0.04), hp(i / 12, 0.96)], { ...izg, tohum: 541 + i });
    for (const v of [0.34, 0.67]) cizgi(gTabla, [hp(0.02, v), hp(0.98, v)], { ...izg, tohum: 560 + v * 10 });
    const ince = { kalinlik: 2.8, renk: TON.cizgi, tohum: 570, genlik: 0.8 };
    cizgi(gTabla, [hp(0.06, 0.3), hp(0.15, 0.2), hp(0.24, 0.32), hp(0.21, 0.66), hp(0.11, 0.72), hp(0.05, 0.52)], { ...ince, kapali: true, dolgu: '#d6d1c7', tohum: 571 });
    for (const [u, v, i] of [[0.47, 0.42, 0], [0.53, 0.3, 1], [0.59, 0.44, 2]]) cizgi(gTabla, [hp(u - 0.04, v + 0.16), hp(u, v - 0.1), hp(u + 0.04, v + 0.16)], { ...ince, tohum: 572 + i });
    for (const [u, v, i] of [[0.3, 0.78, 0], [0.34, 0.86, 1], [0.27, 0.88, 2]]) cizgi(gTabla, oval(...hp(u, v), 8, 4, 0, 360, 8), { ...ince, kapali: true, tohum: 575 + i });
    const yolG = el(gTabla, 'g', { 'stroke-dasharray': '10 9' });
    cizgi(yolG, [hp(0.03, 0.9), hp(0.25, 0.86), hp(0.44, 0.62), hp(0.7, 0.58), hp(0.9, 0.32)], { ...ince, tohum: 578 });
    cizgi(gTabla, [hp(0.88, 0.14), hp(0.94, 0.36)], { ...ince, kalinlik: 3.4, tohum: 579 });
    cizgi(gTabla, [hp(0.94, 0.14), hp(0.88, 0.36)], { ...ince, kalinlik: 3.4, tohum: 580 });
  }

  // ---------- Kâğıt figürler (gFigur): kart + arkaya kıvrık taban (yandan görünür), alt gölge. dn: kartın dönüklüğü
  // (−1…1; taban kanadı dönük yanda görünür). Sallanma: grup tabanın ortası çevresinde döner (60 fps).
  const kartNokta = (BL, BR, TR, TL) => ([u, v]) => {
    const s = u + 0.5, a = (1 - s) * (1 - v), b = s * (1 - v), c = s * v, d = (1 - s) * v;
    return [a * BL[0] + b * BR[0] + c * TR[0] + d * TL[0], a * BL[1] + b * BR[1] + c * TR[1] + d * TL[1]];
  };
  const figurCiz = (ust, ad, kn, tohum, w = 3) => FIGUR[ad].map((f, i) => cizgi(ust, f.p.map(kn), {
    kapali: !!f.k, dolgu: f.d ? (f.d === 'cizgi' ? TON.cizgi : TON[f.d]) : null, kalinlik: w * (f.w || 1), tohum: tohum + i, genlik: 0.7, kay: [1.5, 1.5],
  }));
  function kagitFigur(ad, { taban: [x, y], boy, dn = 0.3, tohum }) {
    const g = el(gFigur, 'g'), ww = boy * 0.64, c = Math.cos(dn * 0.9), sn = Math.sin(dn * 0.9);
    const BL = [x - ww / 2 * c, y + ww / 2 * sn * 0.2], BR = [x + ww / 2 * c, y - ww / 2 * sn * 0.2];
    const TL = [BL[0], BL[1] - boy], TR = [BR[0], BR[1] - boy];
    const D = [sn * boy * 0.5, -boy * 0.13];   // arkaya kıvrık taban kanadı: arkaya (yukarı) ve dönük yana
    el(g, 'ellipse', { cx: x + D[0] * 0.4 + 3, cy: y - 2, rx: ww * 0.62, ry: boy * 0.09, fill: '#000', opacity: 0.09 });
    cizgi(g, duz([BL, BR, [BR[0] + D[0], BR[1] + D[1]], [BL[0] + D[0], BL[1] + D[1]]], true, 3), { kapali: true, dolgu: '#ddd7cc', kalinlik: 3, tohum, kay: [1.5, 1.5] });
    cizgi(g, duz([BL, BR, TR, TL], true, 3), { kapali: true, dolgu: TON.kagit, kalinlik: 3.4, tohum: tohum + 1, kay: [1.5, 1.5] });
    const kn = kartNokta(BL, BR, TR, TL);
    cizgi(g, duz([kn([-0.42, 0.04]), kn([0.42, 0.04]), kn([0.42, 0.96]), kn([-0.42, 0.96])], true, 2), { kapali: true, kalinlik: 1.6, renk: TON.koyu, tohum: tohum + 2, genlik: 0.5 });
    figurCiz(g, ad, kn, tohum + 3, Math.max(1.6, boy / 26));
    gsap.set(g, { svgOrigin: `${x} ${y}` });
    return { g, x, y };
  }
  const FB = 86; // figür boyu (dünya px; okunsun diye gerçekten biraz büyük)
  // Hepsi perdenin önünde (x 990–1330): E3'ün sağ kolu (x < 980) ve E2'nin sol kolu (x > 1430) önlerinden geçmez.
  // Şövalye solda, E3'ün uzanabileceği yerde (devrilince onu E3 alır); 3B yakın planda da solda durur.
  const FIGURLER = {
    sovalye: kagitFigur('sovalye', { taban: [1020, 862], boy: FB, dn: 0.2, tohum: 610 }),
    buyucu: kagitFigur('buyucu', { taban: [1160, 868], boy: FB, dn: 0.35, tohum: 590 }),
    canavar: kagitFigur('canavar', { taban: [1302, 864], boy: FB * 1.04, dn: -0.35, tohum: 630 }),
  };
  // Devrik şövalye (yakın plandan sonra): yüzüstü kart (boş sırtı) + havaya kalkmış taban kanadı; durduğu yerin sol önüne
  // düşer (perdenin kanadından uzakta: E3 kaldırırken kâğıt kanadın ardına girmez)
  const DEVRIK = (() => {
    const g = el(gFigur, 'g'), [x, y] = [950, 898], ww = FB * 0.64;
    const BL = [x - ww / 2, y - 4], BR = [x + ww / 2, y + 3], dz = FB * 0.3;
    el(g, 'ellipse', { cx: x + 3, cy: y + dz * 0.5 + 2, rx: ww * 0.66, ry: dz * 0.62, fill: '#000', opacity: 0.08 });
    cizgi(g, duz([BL, BR, [BR[0] + 6, BR[1] + dz], [BL[0] + 4, BL[1] + dz]], true, 3), { kapali: true, dolgu: '#e8e3da', kalinlik: 3.2, tohum: 650, kay: [1.5, 1.5] });
    cizgi(g, duz([BL, BR, [BR[0] - 2, BR[1] - FB * 0.26], [BL[0] - 2, BL[1] - FB * 0.26]], true, 3), { kapali: true, dolgu: '#ddd7cc', kalinlik: 3.2, tohum: 651, kay: [1.5, 1.5] });
    gsap.set(g, { autoAlpha: 0 });
    return { g, tut: [x - 4, y - FB * 0.24] };
  })();

  // ---------- DM perdesi (gPerde): E'nin önünde üç kanat (orta düz, yan kanatlar öne açılır), markasız; v06: daha uzun
  {
    const cx = YER.E.x, s = YER.E.s, by = kenarY(cx) + 22 * s;
    const w = 98 * s, hO = 142 * s, kw = 80 * s, hY = 128 * s, ky = 22 * s;
    const P = [[cx - w - kw, by + ky], [cx - w, by], [cx + w, by], [cx + w + kw, by + ky]];
    const T = [[P[0][0] + 2 * s, P[0][1] - hY], [P[1][0], P[1][1] - hO], [P[2][0], P[2][1] - hO], [P[3][0] - 2 * s, P[3][1] - hY]];
    const kanat = (i, renk, tohum) => cizgi(gPerde, duz([P[i], P[i + 1], T[i + 1], T[i]], true, 5), { kapali: true, dolgu: renk, kalinlik: 4.5, tohum });
    kanat(0, '#8d867a', 680); kanat(2, '#8d867a', 681); kanat(1, '#a59e91', 682);
    const ic = (u, v) => [P[1][0] + (P[2][0] - P[1][0]) * u, P[1][1] - hO * v];
    cizgi(gPerde, duz([ic(0.08, 0.14), ic(0.92, 0.14), ic(0.92, 0.86), ic(0.08, 0.86)], true, 4), { kapali: true, kalinlik: 2.4, renk: '#6f695f', tohum: 683 });
    // perdenin ön yüzünde sade bir süs: çapraz kılıçlar yerine düz bir kalkan silüeti (markasız)
    const [kx, ky2] = ic(0.5, 0.52);
    cizgi(gPerde, [[kx - 22, ky2 - 26], [kx + 22, ky2 - 26], [kx + 20, ky2 + 4], [kx, ky2 + 28], [kx - 20, ky2 + 4]], { kapali: true, kalinlik: 2.6, renk: '#6f695f', tohum: 684 });
  }

  // ---------- 2B zarlar (gZar): uçuş (k1656–1671) ve masada duruş (yakın plandan sonra; hep yek)
  const ZS = 30;
  const zarYap = (tohum) => {
    const g = el(gZar, 'g');
    const golge = el(g, 'ellipse', { rx: ZS * 0.42, ry: ZS * 0.13, fill: '#000', opacity: 0 });
    const govde = el(g, 'g');
    const nit = (w) => ({ fill: 'none', stroke: M, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const yuzler = { ust: el(govde, 'path', { fill: '#f4f1ea' }), sol: el(govde, 'path', { fill: '#dcd6cb' }), sag: el(govde, 'path', { fill: '#c4beb3' }) };
    for (const [ad, q] of Object.entries(YUZ)) yuzler[ad].setAttribute('d', 'M' + q.map(([x, y]) => `${f3(x)} ${f3(y)}`).join(' L') + 'Z');
    const ic = el(govde, 'path', nit(0.06));
    const dis = el(govde, 'path', nit(0.09));
    const pip = Array.from({ length: 18 }, () => el(govde, 'ellipse', { rx: 0.055, ry: 0.05, fill: M }));
    const sp = ctx.sapma(tohum, 0.012);
    const h = { g, golge, govde, deger: [1, 2, 3] };
    h.ciz = (i = 0) => {
      const s = sp(i);
      dis.setAttribute('d', yol(duz(ALTI, true, 0.04), true, s));
      ic.setAttribute('d', yol([[-0.46, -0.26], [-0.2, -0.115], [0, -0.01], [0.2, -0.115], [0.46, -0.26]], false, s) + ' ' + yol([[0, -0.01], [0, 0.26], [0, 0.52]], false, s));
      let j = 0;
      ['ust', 'sol', 'sag'].forEach((ad, fi) => {
        for (const [u, v] of PIP[h.deger[fi]]) {
          const [x, y] = yuzNokta(YUZ[ad], u, v);
          pip[j].setAttribute('cx', f3(x)); pip[j].setAttribute('cy', f3(y)); pip[j].setAttribute('opacity', 1); j++;
        }
      });
      for (; j < pip.length; j++) pip[j].setAttribute('opacity', 0);
    };
    h.koy = (x, y, aci = 0, sx = 1, sy = 1, golge = 0.14) => {
      h.govde.setAttribute('transform', `translate(${f1(x)} ${f1(y - ZS * 0.5)}) rotate(${f1(aci)}) scale(${f1(ZS * sx)} ${f1(ZS * sy)})`);
      h.golge.setAttribute('cx', f1(x + 3)); h.golge.setAttribute('cy', f1(y + ZS * 0.04)); h.golge.setAttribute('opacity', f3(golge));
    };
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    gsap.set(g, { autoAlpha: 0 });
    return h;
  };
  const zar2 = [zarYap(700), zarYap(707)];
  // Uçuş: E'nin açılan elinden haritaya doğru yay (kesmede havadalar); masada son yerleri. Zar ilk karesinde (K_ATIS + 1)
  // açılan parmakların üstünde (zarın merkezi koy()'un y'sinden ZS/2 yukarıda)
  const ELUC = (() => {
    const P = atisPoz(-1, K_ATIS + 1), a = P.elAci * D2R, u = EB * P.kisalma * 0.78;
    const [x, y] = EE.dunya([P.bilek[0] + u * Math.cos(a), P.bilek[1] + u * Math.sin(a)]);
    return [x, y + E_DY + ZS * 0.5];
  })();
  // (figürlerin arasında: şövalyenin devrik yeri 922–978, büyücü 1132–1200, canavar 1260–1330)
  const ZAR_SON = [[1094, 894, -8, [1, 4, 2]], [1234, 890, 12, [1, 3, 5]]];
  const TAKLA = [[2, 5, 4], [6, 4, 1], [3, 1, 5], [5, 6, 3], [4, 2, 6], [2, 3, 1], [6, 5, 4], [3, 6, 2]];
  // Zarlar elden çıkıp yay çizer (atıştan sonra nefes: gözler zarları izler); kesme inişin ortasında. YAY: yayın düz yoldan
  // en çok sapması (dünya px). Avuç masaya bakarak bırakılan zar elden ~16 px sıçrayıp düşer (130'da çıkış perdenin
  // üstüne inen elden ~60 px yükseliyor, zarlar bileğin üstüne tırmanıyordu)
  const UCUS = 34, YAY = 75;
  const ucus = { n: K_ATIS };
  const ucusUygula = (n) => {
    zar2.forEach((z, i) => {
      const t0 = K_ATIS + 1 + i * 2, u = Math.max(0, Math.min(1, (n - t0) / UCUS));
      const A = [ELUC[0] + i * 12, ELUC[1] + i * 6], B = [1040 + i * 110, 846 + i * 8];
      const x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u - YAY * 4 * u * (1 - u);
      const ni = Math.floor((n - t0) / 2);
      const d = TAKLA[(ni + i * 3 + 64) % TAKLA.length];
      if (String(z.deger) !== String(d)) { z.deger = d; z.ciz(); }
      z.koy(x, y, 13 * (n - t0) + i * 40, 1, 1, 0.03 + 0.05 * u); // dönüş sürekli; yüz (nokta) değişimi takla çizimi, 2 karede bir
    });
  };
  tl.fromTo(ucus, { n: K_ATIS }, { n: KY, duration: k(KY - K_ATIS), ease: 'none', onUpdate: () => ucusUygula(ucus.n), immediateRender: false }, k(K_ATIS));
  zar2.forEach((z, i) => { tl.set(z.g, { autoAlpha: 0 }, k(BAS)); tl.set(z.g, { autoAlpha: 1 }, k(K_ATIS + 1 + i * 2)); });
  // masada duruş (yakın plandan sonra)
  tl.call(() => zar2.forEach((z, i) => { const [x, y, a, d] = ZAR_SON[i]; z.deger = d; z.ciz(); z.koy(x, y, a, 1, 1, 0.16); }), null, k(KO));

  // ---------- Balonlar (LB). Konuşma balonu: çekirdeğin konus() çizgisiyle aynı (süperelips, kuyruk); satırlar
  // (<span class="sat">) sırayla yazılır. tabanX: kuyruk tabanının alt kenardaki x'i (verilirse).
  function soz(metin, { x, y, boyut = 50, kuyruk, tohum = 9, pay = [28, 18], taban = 24, tabanX = null }) {
    const g = el(LB.svg, 'g');
    const p = ctx.elYazisi(LB.div, metin, { x, y, boyut, aci: 0 });
    const w = p.offsetWidth || boyut * 6, hh = p.offsetHeight || boyut;
    const b = { cx: x + w / 2, cy: y + hh / 2, rx: w / 2 + pay[0], ry: hh / 2 + pay[1] };
    const govde = cizgi(g, oval(b.cx, b.cy, b.rx, b.ry, 0, 360, 30, 5.5), { kapali: true, dolgu: BALON, kalinlik: 4.5, tohum, genlik: 1.1, kay: [0, 0] });
    const kd = el(g, 'path', { fill: BALON });
    const k1 = cizgi(g, [[0, 0], [0, 0], [0, 0]], { kalinlik: 4.5, tohum: tohum + 1, genlik: 0.9 });
    const k2 = cizgi(g, [[0, 0], [0, 0]], { kalinlik: 4.5, tohum: tohum + 2, genlik: 0.9 });
    const guncelle = () => {
      govde.pts = oval(b.cx, b.cy, b.rx, b.ry, 0, 360, 30, 5.5); govde.ciz();
      const P = (t) => { const c = Math.cos(t), sn = Math.sin(t); return [b.cx + b.rx * Math.sign(c) * Math.abs(c) ** (2 / 5.5), b.cy + b.ry * Math.sign(sn) * Math.abs(sn) ** (2 / 5.5)]; };
      let b1, b2;
      if (tabanX != null) {
        const ust = kuyruk[1] < b.cy, yon = ust ? -1 : 1;
        const kenarYy = (xx) => { const u = Math.min(0.995, Math.abs((xx - b.cx) / b.rx)); return b.cy + yon * b.ry * Math.pow(1 - Math.pow(u, 5.5), 1 / 5.5); };
        b1 = [tabanX - taban, kenarYy(tabanX - taban)]; b2 = [tabanX + taban, kenarYy(tabanX + taban)];
      } else {
        const a = Math.atan2((kuyruk[1] - b.cy) / b.ry, (kuyruk[0] - b.cx) / b.rx);
        const q = P(a), q1 = P(a + 0.01), q0 = P(a - 0.01), tl0 = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
        const t = [(q1[0] - q0[0]) / tl0, (q1[1] - q0[1]) / tl0];
        b1 = [q[0] - t[0] * taban, q[1] - t[1] * taban]; b2 = [q[0] + t[0] * taban, q[1] + t[1] * taban];
      }
      const ic = (z) => [z[0] + (b.cx - z[0]) * 0.1, z[1] + (b.cy - z[1]) * 0.1];
      kd.setAttribute('d', `M${ic(b1).map(f1).join(' ')} L${b1.map(f1).join(' ')} L${kuyruk.map(f1).join(' ')} L${b2.map(f1).join(' ')} L${ic(b2).map(f1).join(' ')}Z`);
      k1.pts = [b1, [(b1[0] + kuyruk[0]) / 2 + (b2[1] - b1[1]) * 0.08, (b1[1] + kuyruk[1]) / 2], kuyruk]; k1.ciz();
      k2.pts = [b2, kuyruk]; k2.ciz();
    };
    guncelle();
    gsap.set(g, { autoAlpha: 0, scale: 0.6, svgOrigin: `${kuyruk[0]} ${kuyruk[1]}` });
    gsap.set(p, { autoAlpha: 0 });
    const satirlar = [...p.querySelectorAll('.sat')];
    gsap.set(satirlar, { clipPath: 'inset(-30% 100% -30% 0%)' });
    const hb = { g, p, b, guncelle, w, h: hh };
    hb.ac = (k0, sureler = [16]) => {
      tl.set(g, { autoAlpha: 0 }, k(BAS));
      tl.set(p, { autoAlpha: 0 }, k(BAS));
      tl.fromTo(g, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(k0));
      tl.set(p, { autoAlpha: 1, clipPath: 'inset(-40% -10% -40% -10%)' }, k(k0 + 4));
      let t = k0 + 4;
      satirlar.forEach((sp, i) => {
        // bitişte sağ pay −12%: Caveat'ın son harfi kutudan taşar, kırpılmasın
        tl.fromTo(sp, { clipPath: 'inset(-30% 100% -30% 0%)' }, { clipPath: 'inset(-30% -12% -30% 0%)', duration: k(sureler[i] ?? 16), ease: 'none', immediateRender: false }, k(t));
        t += (sureler[i] ?? 16) + 6;
      });
    };
    hb.kapat = (k0, sure = 10) => {
      tl.to(g, { autoAlpha: 0, scale: 0.9, duration: k(sure), ease: E.EI }, k(k0));
      tl.to(p, { autoAlpha: 0, duration: k(sure), ease: E.EI }, k(k0));
    };
    return hb;
  }
  const sat = (...s) => s.map((x) => `<span class="sat" style="display:inline-block">${x}</span>`).join('<br>');
  // Kişinin ağız hizasında, yüz konturunun hemen dışında bir nokta (dünya): konuşma balonunun kuyruk ucu (yüzü kesmesin)
  const agiz = (h, yon = -1, ek = [0, 0]) => {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz;
    const [X, Yy] = h.dunya([200 + yon * (hw + 16), GOZ_Y + 4 + h.p.yuzBoy * 0.5]);
    return [X + ek[0], Yy + ek[1]];
  };

  // ---------- Kamera anahtarları. Yatay: kutu kadraja sığar. Dikey: çiftten çifte kayar (dördü yan yana küçük kalırdı).
  const sigdir = ([x0, y0, x1, y1]) => { const s = Math.min(W / (x1 - x0), H / (y1 - y0)); return ctx.odak((x0 + x1) / 2, (y0 + y1) / 2, s); };
  const mo = ([cx, cy, s]) => ctx.odak(cx, cy, s);
  // genel: yakın plandan dönüş (kart masada); ikili: E3 + E iki konuşma balonuyla; uclu: E4, E3, E ve üç düşünce balonu
  const KAM = DIKEY ? {
    // dikeyde iki kişilik ve tek kişilik çekimler: kenar komşunun yüzünden geçmez (E3 yüzü x 660–830, E2 1545–1705)
    genis: mo([530, 450, 1.12]), genis2: mo([548, 446, 1.14]),
    cift2: mo([1400, 440, 1.14]), salla: mo([1188, 470, 1.55]), at: mo([1170, 520, 1.5]),
    genel: mo([968, 700, 1.3]), ikili: mo([960, 560, 1.06]),
    uclu: mo([700, 60, 0.78]),
  } : {
    // itişlerde kadraj kenarı yüzün ortasından geçmesin: E4 (sağ kenarı x ≈ 410) ya tümüyle içeride ya dışarıda
    genis: sigdir([40, 70, 1880, 1105]), genis2: mo([960, 586, 1.075]),
    cift2: null, salla: mo([1142, 522, 1.38]), at: mo([1146, 548, 1.38]),
    genel: mo([975, 610, 1.22]), ikili: mo([960, 480, 1.62]),
    uclu: mo([850, 390, 0.9]),
  };
  const itis = (o, c) => { const wx = (W / 2 - o.x) / o.scale, wy = (H / 2 - o.y) / o.scale; return ctx.odak(wx, wy, o.scale * c); };
  const kamGit = (n0, sure, a, b, ease = E.KM) => tl.fromTo(ctx.kamera, a, { ...b, duration: k(sure), ease, immediateRender: false }, k(n0));

  // =========================================================================== #14 (1536–1747): sohbet, atış
  ctx.isaret(BAS, 'kesme');
  for (const K of [L0, L, LB]) { tl.set(K.div, { autoAlpha: 1 }, k(BAS)); tl.set(K.div, { autoAlpha: 0 }, k(SON + 1)); }
  tl.set(ctx.itme, { x: 0, y: 0 }, k(BAS));
  ctx.kameraKoy(BAS, KAM.genis);
  if (DIKEY) {
    kamGit(BAS, 34, KAM.genis, KAM.genis2, 'none');
    kamGit(1582, 30, KAM.genis2, KAM.cift2);
    kamGit(1612, 48, KAM.cift2, itis(KAM.cift2, 1.02), 'none');
    kamGit(1660, 32, itis(KAM.cift2, 1.02), KAM.salla);
  } else {
    kamGit(BAS, 124, KAM.genis, KAM.genis2, 'none');
    kamGit(1660, 32, KAM.genis2, KAM.salla);
  }
  kamGit(1700, 34, KAM.salla, KAM.at, 'power1.inOut');
  const bas = (h, o, kol) => { tl.call(() => h.poz(o), null, k(BAS)); h.kolAt(BAS, kol, 0); };
  bas(E4, { ifade: 'merak', bakis: [3, 0] }, { sol: 'masa', sag: 'masa' });
  bas(E3, { ifade: 'saskin', bakis: [2, 0] }, { sol: 'anlat', sag: 'anlat' });
  bas(EE, { ifade: 'merak', bakis: [-3, 0] }, { sol: null, sag: null });
  bas(E2, { ifade: 'merak', bakis: [-3, 0] }, { sol: 'masa', sag: 'masa' });
  tl.call(() => { for (const h of oyuncular) { Object.assign(h.d, { dx: 0, dy: 0, aci: 0, s: 1, zip: 0 }); h.uygula(); } }, null, k(BAS));
  for (const h of oyuncular) h.uygula();
  // Yüz ve göz (ayrık çizim) tam karesinde; kollar h.kolAt ile (başlangıç, süre). Kullanıcı 2026-10-23: eller az oynasın,
  // sahne demlensin: jest geçişleri 10–12 kare, aralarında duruş
  const P = (n, h, o) => tl.call(() => h.poz(o), null, k(n));
  // E3 anlatır: eller göğüs önünde, iki sakin jest; 1574 espri: avuçlar yukarı
  P(1548, E3, { ifade: 'merak' }); E3.kolAt(1544, { sol: 'anlat2', sag: 'anlat2' }, 12, 'sine.inOut', 'el');
  P(1562, E3, { ifade: 'saskin' }); E3.kolAt(1558, { sol: 'anlat', sag: 'anlat' }, 12, 'sine.inOut', 'el');
  P(1574, E3, { ifade: 'mutlu' }); E3.kolAt(1570, { sol: 'avuc', sag: 'avuc' }, 10, 'sine.inOut', 'el');
  P(1560, E2, { ifade: 'kisik', bakis: [-3, 0] });
  P(1568, EE, { ifade: 'kisik', bakis: [-3, 0] });
  // gülüşme (1584–1636): E2 geriye yaslanıp E3'ü gösterir, masaya vurur; E4 elini ağzına kapatır; E ve E3 güler (E3'ün
  // elleri masada, gövdesi sarsılır)
  P(1584, E2, { ifade: 'mutlu' }); E2.kolAt(1578, { sol: 'isaret0' }, 7, 'sine.in', 'el'); E2.kolAt(1585, { sol: 'isaret' }, 7, 'sine.out', 'el'); // el önce kalkar, sonra gösterir: perdeye, canavara değmez
  P(1586, E4, { ifade: 'mutlu' }); E4.kolAt(1580, { sag: 'agiz' }, 10);
  P(1584, EE, { ifade: 'mutlu' });
  P(1590, E3, { ifade: 'mutlu', bakis: [3, -1] }); E3.kolAt(1584, { sol: 'masa', sag: 'masa' }, 12); // (eklem yolu: el yolunda dirsek perdeye kırılıyordu)
  E2.dur(1582, 12, { aci: -3.5, dy: -10 });
  E3.dur(1590, 14, { aci: -1.2, dy: -4 });
  // gülme sarsıntısı: zip sürekli iner-kalkar (10 karelik dönüş), başta ve sonda sıfır
  const gul = (h, n0, n1, gen) => {
    const c = Math.max(1, Math.round((n1 - n0) / 10));
    tl.fromTo(h.d, { zip: 0 }, { zip: gen, duration: k(n1 - n0), ease: (q) => 0.5 - 0.5 * Math.cos(2 * Math.PI * c * q), onUpdate: h.uygula, immediateRender: false }, k(n0));
  };
  gul(E2, 1586, 1636, -5); gul(E4, 1590, 1640, 4); gul(EE, 1590, 1630, 3); gul(E3, 1592, 1632, 4);
  // gülme çizgileri (başın yanında üç kısa çizgi): belirir, gülme ritmiyle atar (ölçek, 10 karelik dönüş), söner
  const gulmeCizgi = (h, yon, n0, n1, tohum) => {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz;
    const [ax, ay] = h.dunya([200 + yon * (hw + 26), GOZ_Y - 10]), g = el(gEfekt, 'g');
    [-0.55, 0, 0.55].forEach((a, i) => {
      const L = 20 * h.s, r0 = 8 * h.s, dx = Math.cos(a) * yon, dy = Math.sin(a);
      cizgi(g, [[ax + dx * r0, ay + dy * r0], [ax + dx * (r0 + L), ay + dy * (r0 + L)]], { kalinlik: 3.6, tohum: tohum + i });
    });
    gsap.set(g, { autoAlpha: 0, svgOrigin: `${f1(ax)} ${f1(ay)}` });
    tl.set(g, { autoAlpha: 0 }, k(BAS));
    const c = Math.max(1, Math.round((n1 - n0) / 10));
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(4), ease: 'none', immediateRender: false }, k(n0));
    tl.fromTo(g, { scale: 0.8 }, { scale: 1.12, duration: k(n1 - n0), ease: (q) => 0.5 - 0.5 * Math.cos(2 * Math.PI * c * q), immediateRender: false }, k(n0));
    tl.to(g, { autoAlpha: 0, duration: k(5), ease: 'none' }, k(n1 - 5));
    return g;
  };
  // (E2 sola dönük güler: çizgiler sağında; E4 sağa dönük: solunda)
  gulmeCizgi(E2, 1, 1590, 1630, 720); gulmeCizgi(E4, -1, 1594, 1634, 724);
  // E2 masaya vurur (eli kalkar, 1613'te masada: tık): darbe çizgileri, figürler sallanır
  const K_VUR = 1613;
  E2.kolAt(1600, { sol: 'vurHazir' }, 9, 'sine.inOut', 'el');
  E2.kolAt(K_VUR - 3, { sol: 'vur' }, 3, 'power2.in', 'el');
  ctx.isaret(K_VUR, 'tik');
  {
    const [vx, vy] = E2.dunya([200 - 70, E2.kenar + 100]);
    const g = el(gEfekt, 'g');
    [[-50, -6, -84, -18], [-44, 18, -78, 28], [40, -10, 72, -24], [-10, -30, -16, -60]]
      .forEach(([a, b, c, d], i) => cizgi(g, [[vx + a, vy + b], [vx + c, vy + d]], { kalinlik: 4, tohum: 730 + i }));
    gsap.set(g, { autoAlpha: 0, svgOrigin: `${vx} ${vy}` });
    tl.set(g, { autoAlpha: 0 }, k(BAS));
    tl.fromTo(g, { autoAlpha: 1, scale: 0.7 }, { scale: 1.15, duration: k(9), ease: E.EO, immediateRender: false }, k(K_VUR));
    tl.to(g, { autoAlpha: 0, duration: k(4), ease: 'none' }, k(K_VUR + 6));
  }
  // figürler sallanır (sönümlü, 60 fps): darbeyle hızla yatar, sağa sola salınıp durur
  Object.values(FIGURLER).forEach((f, i) => {
    const sg = i % 2 ? -1 : 1;
    tl.set(f.g, { rotation: 0, y: 0 }, k(BAS));
    tl.to(f.g, { keyframes: [
      { rotation: 7 * sg, y: -3, duration: k(2), ease: 'power2.out' },
      { rotation: -5 * sg, y: 0, duration: k(5), ease: 'sine.inOut' },
      { rotation: 3 * sg, duration: k(5), ease: 'sine.inOut' },
      { rotation: -1 * sg, duration: k(5), ease: 'sine.inOut' },
      { rotation: 0, duration: k(5), ease: 'sine.inOut' },
    ] }, k(K_VUR + i));
  });
  E2.kolAt(K_VUR + 4, { sol: 'masa' }, 10);
  E2.dur(1634, 14, { aci: 0, dy: 0 });
  E3.dur(1634, 14, { aci: 0, dy: 0 });
  P(1636, E4, { ifade: 'mutlu', bakis: [3, 0] }); E4.kolAt(1630, { sag: 'masa' }, 12);
  // nefes (1636–1664): gülüş söner, yüzlerde gülümseme kalır; eller masada
  P(1646, E3, { ifade: 'merak', bakis: [3, 0] });
  P(1650, E2, { ifade: 'merak', bakis: [-3, 0] });
  P(1654, E4, { ifade: 'merak', bakis: [3, 0] });
  // E zarları yumruğunda sallar (sürekli titreme), herkes öne eğilir, gözler yumrukta
  P(K_SALLA + 4, EE, { ifade: 'kisik', bakis: [-2, -1] }); EE.kolAt(K_SALLA, { sol: 'salla' }, 12, 'sine.inOut', 'el'); // el perdenin ardından dümdüz kalkar
  P(1672, E3, { ifade: 'saskin', bakis: [3, -2] });
  P(1676, E4, { ifade: 'merak', bakis: [3, -1] });
  P(1680, E2, { ifade: 'merak', bakis: [-3, -1] });
  P(1690, E2, { ifade: 'kisik' });
  E3.dur(1668, 32, { aci: 2, dy: 8, s: 1.02 }); E4.dur(1672, 32, { aci: 1.6, dy: 8, s: 1.02 }); E2.dur(1670, 32, { aci: -2.2, dy: 8, s: 1.02 });
  // atış: yumruk kalkar ve bir an havada asılı kalır (herkes nefesini tutar), öne ve aşağı savurur (zarlar K_ATIS'te elden
  // çıkar), el perdenin üstünde açık kalıp yavaşça iner; zarlar yüksek bir yay çizer, gözler onları izler
  P(1698, EE, { ifade: 'kararli', bakis: [-2, 1] }); EE.kolAt(1694, { sol: 'kaldir' }, 8);
  EE.dur(1698, 6, { dy: E_DY });
  EE.kolAt(K_ATIS - 5, { sol: 'atis' }, 0); // atisPoz kareden kareye kendisi akar (kaldir pozundan sıçramadan başlar)
  for (const [h, b] of [[E3, [3, -2]], [E4, [3, -2]], [E2, [-3, -2]]]) P(K_ATIS + 3, h, { ifade: 'saskin', bakis: b });
  for (const [h, b] of [[E3, [3, 2]], [E4, [3, 2]], [E2, [-3, 2]]]) P(K_ATIS + 20, h, { bakis: b });
  // Kişiler her karede kendi izinden çizilir (sahne aralığında)
  ctx.herKare((f) => { if (f >= BAS && f <= SON) for (const h of oyuncular) h.surdur(f); });

  // =========================================================================== #15 (1748–1931): 3B yakın plan
  ctx.isaret(KY, 'kesme');
  const yakin = THREE ? yakinPlanKur() : null;
  if (yakin) {
    for (const K of [L0, L, LB]) { tl.set(K.div, { autoAlpha: 0 }, k(KY)); tl.set(K.div, { autoAlpha: 1 }, k(KO)); }
    for (const K of [L3, L3s]) { tl.set(K.div, { autoAlpha: 1 }, k(KY)); tl.set(K.div, { autoAlpha: 0 }, k(KO)); }
    ctx.kameraKoy(KY, ctx.odak(W / 2, H / 2, 1));
    ctx.herKare(yakin.ciz);
    for (const d of yakin.darbeler) if (d.hiz > 6) ctx.isaret(d.n, 'zar');
    ctx.isaret(yakin.devrik, 'tik');
    // zarlar durunca nefes (müzik susar); sonra kamera yerde yatan karta kayar
    ctx.isaret(yakin.durus - 8, 'sessizlik', { bitis: yakin.durus + 24 });
  } else {
    // 3B yoksa: masaya yaklaşan 2B çekim; zarlar haritaya iner, şövalye devrilir
    ctx.kameraKoy(KY, mo([1080, 800, 2.2]));
    kamGit(KY, KO - KY, mo([1080, 800, 2.2]), mo([1040, 840, 2.5]), 'power1.out');
    tl.call(() => zar2.forEach((z, i) => { const [x, y, a, d] = ZAR_SON[i]; z.deger = d; z.ciz(); z.koy(x, y, a, 1, 1, 0.16); }), null, k(KY + 30));
    tl.set(FIGURLER.sovalye.g, { autoAlpha: 0 }, k(KY + 34)); tl.set(DEVRIK.g, { autoAlpha: 1 }, k(KY + 34));
    ctx.isaret(KY + 30, 'zar'); ctx.isaret(KY + 34, 'tik');
  }
  // yakın plandan sonra: şövalye masada devrik
  tl.set(FIGURLER.sovalye.g, { autoAlpha: 1 }, k(BAS));
  tl.set(DEVRIK.g, { autoAlpha: 0 }, k(BAS));
  tl.set(FIGURLER.sovalye.g, { autoAlpha: 0 }, k(KO));
  tl.set(DEVRIK.g, { autoAlpha: 1 }, k(KO));

  // =========================================================================== #16 (1932–2265): kart masada; "Keşke…" sözleri
  ctx.isaret(KO, 'kesme');
  // genel plan: devrik kart ve yek gelen zarlar masada (nefes), sonra E3 kartı alırken kamera ikiliye yaklaşır
  ctx.kameraKoy(KO, KAM.genel);
  kamGit(KO, 40, KAM.genel, itis(KAM.genel, 1.012), 'none');
  kamGit(1972, 44, itis(KAM.genel, 1.012), KAM.ikili);
  kamGit(2016, K_GERI - 2016, KAM.ikili, itis(KAM.ikili, 1.03), 'none');
  tl.call(() => {
    E3.poz({ ifade: 'sikkin', bakis: [3, 3] });
    EE.poz({ ifade: 'sikkin', bakis: [-2, 3] });
    E4.poz({ ifade: 'sikkin', bakis: [3, 2] });
    E2.poz({ ifade: 'sikkin', bakis: [-3, 2] });
    for (const h of oyuncular) { Object.assign(h.d, { dx: 0, dy: 0, aci: 0, s: 1, zip: 0 }); h.uygula(); }
  }, null, k(KO));
  // kesme: kollar yeni planda doğrudan yerinde (geçişsiz)
  for (const h of [E3, E4, E2]) h.kolAt(KO, { sol: 'masa', sag: 'masa' }, 0);
  EE.kolAt(KO, { sol: null, sag: null }, 0);
  P(1950, E2, { ifade: 'kisik', bakis: [-3, 2] });
  P(1956, E4, { ifade: 'sikkin', bakis: [3, 3] });
  // E3 devrik kâğıda uzanır (öne eğilerek), alır, doğrulurken kaldırır; kâğıt elinde boynunu büker (60 fps)
  P(K_UZAN - 4, E3, { ifade: 'sikkin', bakis: [3, 3] }); E3.kolAt(K_UZAN, { sag: 'uzan' }, 14, 'sine.inOut', 'el');
  E3.dur(K_UZAN + 2, 12, { aci: 2.5, dy: 10, s: 1.02 });
  tl.call(() => { kart.b = -1; }, null, k(BAS));
  const K_AL = K_UZAN + 15;
  tl.set(DEVRIK.g, { autoAlpha: 0 }, k(K_AL));
  tl.call(() => { kart.b = 0; E3.poz({ ifade: 'merak', bakis: [1, -3] }); }, null, k(K_AL));
  E3.kolAt(K_AL - 1, { sag: 'kaldir' }, 8, 'sine.in', 'el');
  E3.kolAt(K_AL + 7, { sag: 'tut' }, 10, 'sine.out', 'el');
  E3.dur(K_AL - 1, 13, { aci: 0, dy: 0, s: 1 });
  // kâğıt boynunu büker: yerçekimiyle hızlanarak yığılır (tık), geri seker, oturur
  const K_BUK = K_AL + 14;
  tl.fromTo(kart, { b: 0 }, { keyframes: [
    { b: 0.2, duration: k(6), ease: 'sine.in' },
    { b: 0.55, duration: k(5), ease: 'power1.in' },
    { b: 1.05, duration: k(5), ease: 'power2.in' },
    { b: 0.86, duration: k(5), ease: 'sine.out' },
    { b: 0.97, duration: k(5), ease: 'sine.inOut' },
    { b: 0.93, duration: k(5), ease: 'sine.inOut' },
  ], immediateRender: false }, k(K_BUK));
  ctx.isaret(K_BUK + 16, 'tik');
  P(K_BUK + 16, E3, { ifade: 'sikkin', bakis: [1, -3] });
  P(K_BUK + 24, E3, { ifade: 'ozlem', bakis: [2, -2] });
  P(K_BUK + 4, EE, { ifade: 'merak', bakis: [-3, -1] });
  P(K_BUK + 16, E4, { ifade: 'kirp' }); P(K_BUK + 22, E4, { ifade: 'merak', bakis: [3, -1] });
  P(K_BUK + 26, E2, { ifade: 'merak', bakis: [-3, -1] });
  // "Keşke piyonlarımız gerçek olsa…" (E3). Balon E3'ün sol üstünde; kuyruk yüzün sol yanına iner (başın üstünden
  // geçmesin). E'nin balonu açılırken bu balon hâlâ okunur: ikisi yan yana (yatay) ya da basamaklı (dikey) sığar
  const S1 = ctx.yer({ x: 418, y: 206, tx: 580 }, { x: 524, y: 112, tx: 660 });
  const soz1 = soz(ctx.metin(sat('Keşke piyonlarımız', 'gerçek olsa…'), sat('If only our pawns', 'were real…')),
    { x: S1.x, y: S1.y, boyut: ctx.yer(46, 48), kuyruk: agiz(E3, -1, [-6, -4]), tohum: 740, tabanX: S1.tx });
  soz1.ac(K_E3, [16, 12]);
  ctx.isaret(K_E3, 'konusma');
  soz1.kapat(K_E3 + 162, 8); // ~38 karede yazılır, 2 sn'den uzun okunur
  // E: "Keşke FRP zarlarımız olsa… / kendimiz tasarlayabildiğimiz…" (tek jest: açık avuç)
  P(K_E - 6, EE, { ifade: 'ozlem', bakis: [-1, 3] });
  P(K_E + 4, EE, { ifade: 'saskin' }); EE.kolAt(K_E - 2, { sag: 'goster' }, 12, 'sine.inOut', 'el');
  P(K_E + 16, EE, { ifade: 'ozlem' });
  P(K_E + 44, EE, { ifade: 'merak', bakis: [-3, 0] });
  P(K_E + 80, EE, { ifade: 'ozlem' });
  EE.kolAt(K_E + 84, { sag: null }, 12, 'sine.inOut', 'el');
  P(K_E + 2, E3, { ifade: 'merak', bakis: [3, 0] });
  P(K_E + 8, E2, { ifade: 'merak', bakis: [-3, 0] });
  P(K_E + 14, E4, { ifade: 'merak', bakis: [3, 0] });
  const S2 = ctx.yer({ x: 836, y: 176, tx: 1040 }, { x: 900, y: -150, tx: 1040 });
  const soz2 = soz(DIKEY
    ? ctx.metin(sat('Keşke FRP', 'zarlarımız olsa…', 'kendimiz', 'tasarlayabildiğimiz…'), sat('If only we had', 'real RPG dice…', 'ones we designed', 'ourselves…'))
    : ctx.metin(sat('Keşke FRP zarlarımız olsa…', 'kendimiz tasarlayabildiğimiz…'), sat('If only we had real RPG dice…', 'ones we designed ourselves…')),
  { x: S2.x, y: S2.y, boyut: ctx.yer(46, 48), kuyruk: agiz(EE, -1, [-10, -4]), tohum: 760, tabanX: S2.tx });
  soz2.ac(K_E, DIKEY ? [10, 10, 8, 12] : [18, 20]);
  ctx.isaret(K_E, 'konusma');
  soz2.kapat(K_GERI + 8, 8);

  // =========================================================================== #17 (2266–2445): üçü aynı anda düşünür
  ctx.isaret(K_GERI, 'vurgu');
  kamGit(K_GERI, 46, itis(KAM.ikili, 1.03), KAM.uclu);
  // dikeyde duvar saati E4'ün balonunun altından görünürdü: oda katmanı söner (raf zaten kadraj dışında)
  if (DIKEY) tl.to(L0.div, { autoAlpha: 0, duration: k(14), ease: 'none' }, k(K_GERI + 8));
  kamGit(K_GERI + 46, SON - K_GERI - 46, KAM.uclu, itis(KAM.uclu, ctx.yer(1.02, 1.005)), 'none'); // dikeyde balonlar kenara yakın: itiş çok az
  // düşünme pozları: E eli çenesinde; E4 eli çenesinde (sözsüz); E3 bükülmüş kâğıdı elinde tutup ona bakar
  P(K_GERI + 6, EE, { ifade: 'ozlem', bakis: [1, -3] }); EE.kolAt(K_GERI, { sol: 'cene' }, 12, 'sine.inOut', 'el');
  P(K_GERI + 4, E3, { ifade: 'ozlem', bakis: [2, -3] });
  P(K_GERI + 14, E4, { ifade: 'ozlem', bakis: [2, -3] }); E4.kolAt(K_GERI + 6, { sol: 'cene' }, 12);
  P(K_GERI + 10, E2, { ifade: 'merak', bakis: [-3, -1] });
  P(K_DUS[2] + 40, E2, { ifade: 'merak', bakis: [-2, -3] });
  // Üç bulut (ctx.balon: organik, el çizimi). Yatay: yan yana, başların üstünde; dikey: E4 ve E'ninki alçakta iki yanda,
  // E3'ünki ortada yüksekte (noktaları ikisinin arasından çıkar)
  const DUS = ctx.yer({
    E3: { c: [690, 46], r: [248, 162], n: [[742, 324, 9], [733, 292, 13], [720, 258, 17]], koken: '55% 98%' },
    E: { c: [1296, 64], r: [248, 162], n: [[1196, 316, 9], [1212, 288, 13], [1232, 258, 17]], koken: '25% 96%' },
    E4: { c: [92, 72], r: [248, 162], n: [[290, 356, 9], [266, 326, 13], [236, 292, 17]], koken: '80% 96%' },
  }, {
    E3: { c: [705, -780], r: [330, 300], n: [[744, 318, 9], [741, 236, 12], [737, 146, 15], [732, 48, 18], [726, -56, 21], [719, -166, 24], [712, -282, 27], [706, -400, 30]], koken: '50% 99%' },
    E: { c: [1088, -120], r: [228, 232], n: [[1182, 314, 10], [1170, 262, 14], [1152, 204, 18], [1130, 146, 21]], koken: '60% 98%' },
    E4: { c: [312, -120], r: [228, 232], n: [[300, 350, 10], [302, 290, 14], [306, 222, 18], [310, 156, 21]], koken: '50% 98%' },
  });
  // içerik kutusu: bulutun iç elipsi (içerik tümseklere biraz taşabilir)
  const icKutu = (b, fx = 0.95, fy = 0.88) => [b.c[0] - b.r[0] * fx, b.c[1] - b.r[1] * fy, b.c[0] + b.r[0] * fx, b.c[1] + b.r[1] * fy];
  const [b3, bE, b4] = ['E3', 'E', 'E4'].map((ad, i) => {
    const D = DUS[ad], B = ctx.balon(LB.svg, { c: D.c, r: D.r, noktalar: D.n, tohum: [37, 41, 43][i], koken: D.koken });
    tl.set(B.g, { autoAlpha: 1 }, k(BAS));
    const oturur = Math.round(B.ac(K_DUS[i]) * ctx.FPS);
    ctx.isaret(K_DUS[i], 'dusunce');
    return { B, oturur, icr: icKutu(D) };
  });
  const ZARLAR = ['d20', 'd12', 'd8', 'd6', 'd4'];
  const POP_P = [0, 1, 2].map((i) => b3.oturur + 2 + i * 7);   // E3: piyonlar
  const POP = ZARLAR.map((_, i) => bE.oturur + 2 + i * 5);     // E: zarlar
  const POP_M = b4.oturur + 4;                                 // E4: minifigür
  const TAS = ZARLAR.map((_, i) => K_TAS + i * 3), RECINE = ZARLAR.map((_, i) => K_REC + i * 3);
  const icerik = [
    [THREE ? balonPiyonKur(b3.icr, POP_P) : null, b3, () => duzPiyonlar(b3, POP_P)],
    [THREE ? balonZarKur(bE.icr) : null, bE, () => duzZarlar(bE, POP)],
    [THREE ? balonMiniKur(b4.icr, POP_M) : null, b4, () => duzMini(b4, POP_M)],
  ];
  for (const [x, b, yedek] of icerik) {
    if (!x) { yedek(); continue; }
    tl.set(x.div, { autoAlpha: 0 }, k(BAS));
    tl.set(x.div, { autoAlpha: 1 }, k(b.oturur));
    ctx.herKare(x.ciz);
  }
  // ses: her balonun içeriği belirince bir tık (üçü bir dizi: dın dın dın); zarlar taşa ve reçineye dönerken vurgu
  ctx.isaret(POP_P[0] + 4, 'tik'); ctx.isaret(POP[0] + 4, 'tik'); ctx.isaret(POP_M + 4, 'tik');
  ctx.isaret(TAS[0], 'vurgu');
  ctx.isaret(RECINE[0], 'vurgu');
  P(POP_P[0] + 20, E3, { ifade: 'merak', bakis: [1, -3] });
  P(TAS[0] + 10, EE, { ifade: 'merak', bakis: [1, -3] });
  P(RECINE[0] + 16, EE, { ifade: 'ozlem' });
  P(POP_M + 30, E4, { ifade: 'merak', bakis: [2, -3] });

  // 3B yoksa düz çizim: basit silüetler (kaide elipsi + gövde + baş), sırayla belirir
  function duzFigur(ust, [cx, cy], boy, renk, tohum) {
    const g = el(ust, 'g');
    cizgi(g, oval(cx, cy + boy * 0.45, boy * 0.34, boy * 0.08, 0, 360, 16), { kapali: true, dolgu: URUN_RENK[renk], kalinlik: 4, tohum });
    cizgi(g, [[cx - boy * 0.22, cy + boy * 0.42], [cx + boy * 0.22, cy + boy * 0.42], [cx + boy * 0.12, cy - boy * 0.08], [cx - boy * 0.12, cy - boy * 0.08]], { kapali: true, dolgu: URUN_RENK[renk], kalinlik: 4, tohum: tohum + 1 });
    cizgi(g, oval(cx, cy - boy * 0.24, boy * 0.16, boy * 0.16, 0, 360, 14), { kapali: true, dolgu: URUN_RENK.seftali, kalinlik: 4, tohum: tohum + 2 });
    return g;
  }
  function belir(g, n) { gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS)); tl.set(g, { autoAlpha: 1 }, k(n)); }
  function duzPiyonlar(b, pop) {
    const [x0, y0, x1, y1] = b.icr, boy = (y1 - y0) * 0.8;
    ['gok', 'lila', 'nane'].forEach((r, i) => belir(duzFigur(b.B.ic, [x0 + (x1 - x0) * (0.2 + i * 0.3), (y0 + y1) / 2], boy, r, 820 + i * 5), pop[i]));
  }
  function duzMini(b, n) {
    const [x0, y0, x1, y1] = b.icr;
    belir(duzFigur(b.B.ic, [(x0 + x1) / 2, (y0 + y1) / 2], (y1 - y0) * 0.9, 'adacayi', 840), n);
  }
  function duzZarlar(b, pop) {
    const [x0, y0, x1, y1] = b.icr;
    ZARLAR.forEach((ad, i) => {
      const c = [x0 + (x1 - x0) * (0.1 + i * 0.2), (y0 + y1) / 2], g = el(b.B.ic, 'g');
      cizgi(g, oval(c[0], c[1], 40, 40, 0, 360, [3, 6, 4, 6, 3][i] * 2, 2), { kapali: true, dolgu: URUN_RENK[URUN_SIRA[i]], kalinlik: 5, tohum: 800 + i });
      belir(g, pop[i]);
    });
  }

  // ===========================================================================================================
  // 3B YAKIN PLAN: tavla zarları haritada. Dünya: x sağa, y yukarı, z kameraya doğru; birim = zar kenarı (~16 mm).
  function yakinPlanKur() {
    const lerp3g = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
    L3.div.insertBefore(cv, L3.svg);
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); } catch (e) { console.warn('s4-frp: WebGL yok', e); cv.remove(); return null; }
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(KAGIT);
    sc.fog = new THREE.Fog(KAGIT, 16, 34);
    const kam = new THREE.PerspectiveCamera(DIKEY ? 50 : 30, W / H, 0.1, 90);
    // Toon: üç ton (gölge %66, ara %83, ışık %100); ışık şiddetleri π ile (fiziksel ışık: Lambert /π)
    const grad = new THREE.DataTexture(new Uint8Array([0, 128, 255]), 3, 1, THREE.RedFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
    sc.add(new THREE.AmbientLight(0xffffff, 0.66 * Math.PI));
    const gun = new THREE.DirectionalLight(0xffffff, 0.34 * Math.PI);
    gun.position.set(-5, 10, 4); gun.target.position.set(0, 0, -3);
    gun.castShadow = true; gun.shadow.mapSize.set(2048, 2048);
    Object.assign(gun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 30 });
    gun.shadow.camera.updateProjectionMatrix();
    gun.shadow.bias = -0.0006; gun.shadow.normalBias = 0.02;
    sc.add(gun, gun.target);
    const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
    const doku = (c, { tekrar = null } = {}) => {
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());
      if (tekrar) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(tekrar, tekrar); }
      return t;
    };
    const tuval = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // Tuvalde doodle çizgi: insan.js yol() → Path2D; dolgu konturdan kayık (baskı kayması)
    const tc = (g, pts, kapali, sp, { dolgu = null, renk = M, w = 6, kay = 0 } = {}) => {
      const p = new Path2D(yol(pts, kapali, sp));
      if (dolgu) { g.save(); g.translate(kay, kay); g.fillStyle = dolgu; g.fill(p); g.restore(); }
      if (w) { g.lineWidth = w; g.strokeStyle = renk; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(p); }
    };
    const titrek = (tohum, gen) => { const sp = ctx.sapma(tohum, gen); return sp(0); };

    // --- Masa (geniş, açık ahşap tonu) ve harita kâğıdı (ızgaralı savaş haritası, aynı doodle dili)
    {
      const c = tuval(512, 512), g = c.getContext('2d');
      g.fillStyle = '#cfc9bd'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9; i++) tc(g, Array.from({ length: 9 }, (_, j) => [j * 64, i * 58 + 18 + Math.sin(j * 0.9 + i) * 6]), false, titrek(900 + i, 2), { renk: '#c2bcb1', w: 3 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon({ map: doku(c, { tekrar: 10 }) }));
      m.rotation.x = -Math.PI / 2; m.position.y = -0.004; m.receiveShadow = true; sc.add(m);
    }
    const HS = [10, 14], HC = [0, -3.4], PXU = 150; // harita boyu (x, z), merkezi, birim başına piksel
    {
      const c = tuval(HS[0] * PXU, HS[1] * PXU), g = c.getContext('2d'), U = (x, z) => [(x - HC[0] + HS[0] / 2) * PXU, (z - HC[1] + HS[1] / 2) * PXU];
      g.fillStyle = TON.harita; g.fillRect(0, 0, c.width, c.height);
      // ızgara (1,5 birim ≈ 1 inç)
      for (let x = -HS[0] / 2 + 0.5; x < HS[0] / 2; x += 1.5) tc(g, [U(x, HC[1] - 6.8), U(x + 0.03, HC[1]), U(x, HC[1] + 6.8)], false, titrek(910 + x * 3, 2.5), { renk: TON.izgara, w: 4 });
      for (let z = -HS[1] / 2 + 0.6; z < HS[1] / 2; z += 1.5) tc(g, [U(-4.8, HC[1] + z), U(0, HC[1] + z + 0.03), U(4.8, HC[1] + z)], false, titrek(930 + z * 3, 2.5), { renk: TON.izgara, w: 4 });
      const ince = { renk: TON.cizgi, w: 7 };
      // göl, nehir, dağlar, orman, kesik yol, kule, X
      tc(g, ov(...U(-3.0, -6.4), 1.6 * PXU, 1.0 * PXU, 18), true, titrek(940, 4), { ...ince, dolgu: '#d6d1c7', kay: 6 });
      tc(g, [U(-1.6, -6.2), U(-0.6, -5.4), U(-0.9, -4.2), U(0.2, -3.2), U(1.6, -2.9), U(2.6, -1.6), U(4.9, -1.2)], false, titrek(941, 4), ince);
      tc(g, [U(-1.3, -6.5), U(-0.3, -5.6), U(-0.6, -4.4), U(0.5, -3.5), U(1.8, -3.2), U(2.8, -1.9), U(4.9, -1.6)], false, titrek(942, 4), ince);
      [[1.6, -7.6], [2.6, -7.2], [3.5, -7.8]].forEach(([x, z], i) => tc(g, [U(x - 0.6, z + 0.5), U(x, z - 0.6), U(x + 0.6, z + 0.5)], false, titrek(943 + i, 4), { ...ince, w: 8 }));
      [[-3.6, -2.4], [-3.0, -1.6], [-3.9, -1.2], [-2.6, -2.8]].forEach(([x, z], i) => { tc(g, ov(...U(x, z), 0.42 * PXU, 0.36 * PXU, 12), true, titrek(950 + i, 3), { ...ince, dolgu: '#d6d1c7', kay: 5 }); });
      g.setLineDash([26, 22]);
      tc(g, [U(-4.6, 2.6), U(-2.4, 1.6), U(-0.6, 0.4), U(0.9, -0.6), U(2.9, 0.3), U(4.4, -0.2)], false, titrek(960, 4), ince);
      g.setLineDash([]);
      tc(g, [U(3.2, -5.6), U(3.9, -4.6)], false, titrek(961, 3), { ...ince, w: 9 }); tc(g, [U(3.9, -5.6), U(3.2, -4.6)], false, titrek(962, 3), { ...ince, w: 9 });
      tc(g, [U(-1.4, 1.6), U(-0.8, 1.6), U(-0.8, 0.8), U(-1.4, 0.8)], true, titrek(963, 3), { ...ince, dolgu: '#d6d1c7', kay: 5 });
      // kenar (kâğıt sınırı)
      tc(g, [[6, 6], [c.width / 2, 4], [c.width - 6, 6], [c.width - 4, c.height / 2], [c.width - 6, c.height - 6], [c.width / 2, c.height - 4], [6, c.height - 6], [4, c.height / 2]], true, titrek(964, 3), { renk: M, w: 10 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(HS[0], HS[1]), toon({ map: doku(c) }));
      m.rotation.x = -Math.PI / 2; m.position.set(HC[0], 0, HC[1]); m.receiveShadow = true; sc.add(m);
    }
    // --- DM perdesi (uzakta, sise karışır): üç kanat + mürekkep kenarları
    const cizgiMat = (px, o = {}) => new LineMaterial({ color: new THREE.Color(M), linewidth: px, resolution: new THREE.Vector2(W, H), ...o });
    const kenarCiz = (geo, px, o) => new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 20)), cizgiMat(px, o));
    {
      const g = new THREE.Group(), m = toon({ color: '#a59e91' }), mY = toon({ color: '#8d867a' });
      // kanat: menteşe (grup kökeni) kanadın bir kenarında; ofs kanadın ortasına
      const kanat = (w, mat, ofs) => {
        const geo = new THREE.BoxGeometry(w, 3.6, 0.12); geo.translate(ofs, 1.8, 0);
        const k1 = new THREE.Mesh(geo, mat); k1.castShadow = true;
        const gg = new THREE.Group(); gg.add(k1, kenarCiz(geo, 2.4)); return gg;
      };
      g.add(kanat(4.8, m, 0));
      const sol = kanat(3.6, mY, -1.8); sol.position.x = -2.4; sol.rotation.y = 0.5; g.add(sol);
      const sag = kanat(3.6, mY, 1.8); sag.position.x = 2.4; sag.rotation.y = -0.5; g.add(sag);
      g.position.set(0.6, 0, -15); sc.add(g);
    }
    // --- Kâğıt figürler: kart (önde resim, arkada boş kâğıt) + arkaya kıvrık taban kanadı. Grup kökeni katlama çizgisinde.
    const KW = 1.5, KH = 2.4, KD = 0.75;
    const kartDoku = (ad, on) => {
      const c = tuval(384, 614), g = c.getContext('2d'), K = (u, v) => [(u + 0.5) * 384, (1 - v) * 614];
      const R = 20;
      g.fillStyle = on ? TON.kagit : '#e9e4db'; g.beginPath(); g.roundRect(4, 4, 376, 606, R); g.fill();
      tc(g, [[8, 8], [192, 6], [376, 8], [378, 307], [376, 606], [192, 608], [8, 606], [6, 307]], true, titrek(970, 2), { renk: M, w: 9 });
      if (!on) {
        // kartın sırtı: ince çerçeve ve seyrek çapraz tarama (yüzüstü düşünce "kartın arkası" okunsun)
        tc(g, [[36, 36], [348, 36], [348, 578], [36, 578]], true, titrek(975, 2), { renk: TON.koyu, w: 4 });
        g.save(); g.beginPath(); g.rect(40, 40, 304, 534); g.clip();
        for (let i = -6; i < 10; i++) tc(g, [[36 + i * 52, 578], [36 + i * 52 + 312, 36]], false, titrek(976 + i, 2), { renk: TON.izgara, w: 5 });
        g.restore();
        return c;
      }
      tc(g, [K(-0.42, 0.04), K(0.42, 0.04), K(0.42, 0.96), K(-0.42, 0.96)].flatMap((p, i, a) => { const q = a[(i + 1) % 4]; return [p, [p[0] * 0.86 + q[0] * 0.14, p[1] * 0.86 + q[1] * 0.14], [p[0] * 0.14 + q[0] * 0.86, p[1] * 0.14 + q[1] * 0.86]]; }), true, titrek(971, 2), { renk: TON.koyu, w: 4 });
      FIGUR[ad].forEach((f, i) => tc(g, f.p.map(([u, v]) => K(u, v)), !!f.k, titrek(972 + i, 2.5), { dolgu: f.d ? (f.d === 'cizgi' ? TON.cizgi : TON[f.d]) : null, w: 9 * (f.w || 1), kay: 5 }));
      return c;
    };
    const tabanDoku = () => {
      const c = tuval(384, 192), g = c.getContext('2d');
      g.fillStyle = '#e4dfd5'; g.fillRect(0, 0, 384, 192);
      tc(g, [[8, 8], [376, 8], [376, 184], [8, 184]], true, titrek(990, 2), { renk: M, w: 9 });
      return c;
    };
    const figurYap = (ad) => {
      const kok = new THREE.Group(), govde = new THREE.Group();
      kok.rotation.order = 'YXZ';
      const kart = new THREE.PlaneGeometry(KW, KH, 12, 1);
      const pos = kart.attributes.position; // hafif kâğıt kıvrımı
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / (KW / 2); pos.setZ(i, 0.07 * (1 - x * x)); }
      kart.computeVertexNormals(); kart.translate(0, KH / 2, 0);
      const on = new THREE.Mesh(kart, toon({ map: doku(kartDoku(ad, true)), side: THREE.FrontSide }));
      const arka = new THREE.Mesh(kart.clone(), toon({ map: doku(kartDoku(ad, false)), side: THREE.BackSide }));
      const kanatGeo = new THREE.PlaneGeometry(KW, KD); kanatGeo.rotateX(-Math.PI / 2); kanatGeo.translate(0, 0.004, -KD / 2);
      const kanat = new THREE.Mesh(kanatGeo, toon({ map: doku(tabanDoku()), side: THREE.DoubleSide }));
      for (const m of [on, arka, kanat]) { m.castShadow = true; m.receiveShadow = true; m.material.shadowSide = THREE.DoubleSide; }
      govde.add(on, arka, kanat); kok.add(govde); sc.add(kok);
      return { kok, govde };
    };
    // --- Tavla zarları: yuvarlatılmış küp, yüzlerde noktalar (dokuyla), mürekkep konturu (ters kabuk)
    const pipDoku = (n) => {
      const c = tuval(256, 256), g = c.getContext('2d');
      g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 256, 256);
      const R = rng(1000 + n), r0 = n === 1 ? 30 : 23;
      for (const [u, v] of PIP[n]) {
        g.beginPath(); g.ellipse(128 + u * 64, 128 + v * 64, r0 * (0.94 + R() * 0.12), r0 * (0.94 + R() * 0.12), R() * 3, 0, Math.PI * 2);
        g.fillStyle = M; g.fill();
      }
      return c;
    };
    // BoxGeometry yüz sırası: +x, −x, +y, −y, +z, −z → karşılıklı yüzler toplamı 7
    const DEGER = [3, 4, 1, 6, 2, 5];
    const yuzMat = DEGER.map((n) => toon({ map: doku(pipDoku(n)) }));
    const zarGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.13);
    const kabukMat = new THREE.MeshBasicMaterial({ color: M, side: THREE.BackSide });
    const zarlar = ATISLAR.map((a) => {
      const sim = zarSim({ ...a, q0: qEuler(...a.e0) });
      const K = sim.kareler, son = K[K.length - 1];
      const ofs = [a.hedef[0] - son.p[0], a.hedef[1] - son.p[2]];
      K.forEach((kk) => { kk.p[0] += ofs[0]; kk.p[2] += ofs[1]; });
      sim.darbeler.forEach((d) => { d.p[0] += ofs[0]; d.p[2] += ofs[1]; });
      const kok = new THREE.Group(), ic = new THREE.Mesh(zarGeo, yuzMat), kabuk = new THREE.Mesh(zarGeo, kabukMat);
      ic.castShadow = true; kabuk.scale.setScalar(1.075);
      // son karede yukarı bakan yerel eksen: 1 yüzü (+y) oraya döndürülür (hep yek)
      const qs = new THREE.Quaternion(...son.q).invert(), yukari = new THREE.Vector3(0, 1, 0).applyQuaternion(qs);
      const eks = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((v) => new THREE.Vector3(...v));
      const enIyi = eks.reduce((a2, b) => (b.dot(yukari) > a2.dot(yukari) ? b : a2));
      const ici = new THREE.Group(); ici.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), enIyi);
      ici.add(ic, kabuk); kok.add(ici); sc.add(kok);
      return { kok, ici, kabuk, K, darbeler: sim.darbeler };
    });
    const HIZ = 0.85; // ekranda fizik hızı (hafif ağır çekim)
    const simKare = (n) => (n - KY) * HIZ;
    const durum = (z, fs) => {
      const K = z.K, i = Math.max(0, Math.min(K.length - 1, Math.floor(fs))), j = Math.min(K.length - 1, i + 1), t = Math.max(0, Math.min(1, fs - i));
      const p = K[i].p.map((v, a) => v + (K[j].p[a] - v) * t);
      const q = new THREE.Quaternion(...K[i].q).slerp(new THREE.Quaternion(...K[j].q), t);
      return { p, q };
    };
    // sim karesi → film karesi
    const filmKare = (fs) => KY + fs / HIZ;
    // --- Şövalye, 1. zarın 2. değmesinden 5 kare sonra, zarın gidişinin solunda ve biraz önünde durur; o an devrilir
    const A = zarlar[0], dA = A.darbeler[Math.min(1, A.darbeler.length - 1)], fh = dA.f + 5;
    const ph = durum(A, fh).p, fh1 = durum(A, fh + 3).p;
    const yonA = [fh1[0] - ph[0], fh1[2] - ph[2]], yl = Math.hypot(...yonA) || 1, ileri = [yonA[0] / yl, yonA[1] / yl];
    // gidişin solu (zarın bakışıyla): (−dz, dx)
    const sovalye = figurYap('sovalye');
    sovalye.kok.position.set(ph[0] - ileri[1] * 1.22 + ileri[0] * 0.4, 0, ph[2] + ileri[0] * 1.22 + ileri[1] * 0.4);
    sovalye.kok.rotation.y = 0.18;
    const buyucu = figurYap('buyucu'); buyucu.kok.position.set(-3.4, 0, -3.6); buyucu.kok.rotation.y = 0.5;
    const canavar = figurYap('canavar'); canavar.kok.position.set(3.5, 0, -2.8); canavar.kok.rotation.y = -0.55; canavar.kok.scale.setScalar(1.06);
    const figurler = [sovalye, buyucu, canavar];
    const devrik = Math.round(filmKare(fh));
    // --- Darbe izleri (2B, L3s): çarpma noktasında dört kısa çizgi; 7 kare görünür
    const tumDarbe = zarlar.flatMap((z) => z.darbeler.filter((d) => d.hiz > 5).map((d) => ({ ...d, n: Math.round(filmKare(d.f)) })));
    const izler = tumDarbe.map((d, i) => {
      const g = el(L3s.svg, 'g');
      [[-1, -0.25], [-0.4, -1], [0.4, -1], [1, -0.25]].forEach(([dx, dy], j) => cizgi(g, [[dx * 22, dy * 14], [dx * 44, dy * 30]], { kalinlik: 4.5, tohum: 1100 + i * 5 + j }));
      g.setAttribute('opacity', 0);
      return { g, d };
    });
    const v3 = new THREE.Vector3();
    const ekran = (x, y, z) => { v3.set(x, y, z).project(kam); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; };
    // --- Kamera yolu: girişte geniş (zarlar uzaktan gelir), sonra son zarlara doğru KM ile iner; hafif el kamerası
    const ortaSon = [(ATISLAR[0].hedef[0] + ATISLAR[1].hedef[0]) / 2, 0.5, (ATISLAR[0].hedef[1] + ATISLAR[1].hedef[1]) / 2];
    const KP = DIKEY
      ? { p0: [-0.5, 10.5, 5.2], p1: [ortaSon[0], 8.4, ortaSon[2] + 5.0], t0: [-0.6, 0, -5], t1: [ortaSon[0], 0.3, ortaSon[2] - 0.2] }
      : { p0: [-0.6, 6.4, 6.4], p1: [ortaSon[0] + 0.5, 4.2, ortaSon[2] + 4.6], t0: [0, 0.3, -4.6], t1: [ortaSon[0], 0.35, ortaSon[2]] };
    // son durak: yerde yüzüstü yatan kart (kök + dönük yönde kartın yarısı + kayma), sağında 1. zar biraz görünür
    {
      const yaw = 0.18 - 0.4, uz = 0.25 + KH / 2, kp = sovalye.kok.position;
      const kart = [kp.x + Math.sin(yaw) * uz, 0.15, kp.z + Math.cos(yaw) * uz];
      const zA = [ATISLAR[0].hedef[0], 0.3, ATISLAR[0].hedef[1]];
      KP.t2 = lerp3g(kart, zA, 0.22);
      KP.p2 = KP.t2.map((v, i) => v + (DIKEY ? [0.2, 5.6, 2.8] : [0.4, 4.0, 3.3])[i]);
    }
    const km = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const qTop = new THREE.Quaternion();
    const lerp3 = lerp3g;
    const ciz = (n) => {
      if (n < KY - 1 || n > KO) return;
      const fs = simKare(n);
      for (const z of zarlar) { const d = durum(z, fs); z.kok.position.set(...d.p); z.kok.quaternion.copy(d.q); }
      // kaynama: kontur kabuğu 8 fps'te çok az oynar (dört çizim)
      // kabuk dünyada biraz yukarı kaydırılır: masaya gömülen alt kenarın konturu da görünsün
      const ki = Math.floor(n * 8 / 60) % 4;
      for (const z of zarlar) {
        z.kabuk.scale.setScalar(1.072 + [0, 0.006, -0.003, 0.004][ki]);
        qTop.copy(z.kok.quaternion).multiply(z.ici.quaternion).invert();
        z.kabuk.position.set(0, 0.034, 0).applyQuaternion(qTop);
      }
      // şövalyenin devrilmesi: öne (+z) yüzüstü kapanır (yerçekimi: açı t²), seker, oturur; biraz döner ve kayar
      const tf = (n - devrik) / 11;
      let ax = 0, yaw = 0, kay = 0;
      if (tf > 0) {
        if (tf < 1) { ax = Math.PI / 2 * tf * tf; yaw = -0.4 * tf; kay = 0.25 * tf; } else {
          const u = Math.min(1, (tf - 1) * 11 / 7);
          ax = Math.PI / 2 - 0.16 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0); yaw = -0.4; kay = 0.25;
        }
      }
      sovalye.govde.rotation.set(ax, 0, 0);
      sovalye.kok.rotation.y = 0.18 + yaw;
      sovalye.govde.position.z = kay;
      // kartın hafif kıvrımı (ön yüze 0,07 şişkin) yüzüstü yatınca aşağı bakar: kart kaldırılmazsa haritanın altına gömülüp
      // bir anda kayboluyordu (kullanıcı 2026-10-23). Yattıkça kıvrım kadar yükselir, kenarları haritaya değer
      sovalye.govde.position.y = 0.075 * Math.min(1, ax / (Math.PI / 2));
      // öbür figürler: yakın darbelerde sönümlü titreme
      for (const f of [buyucu, canavar]) {
        let a = 0;
        for (const d of tumDarbe) {
          const dt = (n - d.n) / 60; if (dt < 0) continue;
          const uz = Math.hypot(d.p[0] - f.kok.position.x, d.p[2] - f.kok.position.z);
          a += d.hiz * 0.0045 / (1 + uz * uz * 0.25) * Math.exp(-dt * 6) * Math.sin(dt * 38);
        }
        f.govde.rotation.x = a;
      }
      // kamera: (A) girişte geniş, zarlar dururken KM ile son zarlara iner; (B) nefes; (C) yerde yatan karta kayar, bir an
      // durur (kullanıcı 2026-10-23: devrilen kart bir anda kayboluyordu, yerdeki hâli görünsün)
      const tA = durus + 14, tC0 = KO - 72, tC1 = KO - 30;
      const a = km(Math.max(0, Math.min(1, (n - KY) / (tA - KY)))), c = km(Math.max(0, Math.min(1, (n - tC0) / (tC1 - tC0))));
      const el1 = [Math.sin(n * 0.05) * 0.03, Math.sin(n * 0.037 + 1) * 0.02, 0];
      kam.position.set(...lerp3(lerp3(KP.p0, KP.p1, a), KP.p2, c).map((v, i) => v + el1[i]));
      kam.lookAt(...lerp3(lerp3(KP.t0, KP.t1, a), KP.t2, c));
      kam.updateMatrixWorld();
      // darbe izleri
      for (const { g, d } of izler) {
        const u = (n - d.n) / 7;
        if (u < 0 || u > 1) { g.setAttribute('opacity', 0); continue; }
        const [x, y] = ekran(d.p[0], 0, d.p[2]), s = (0.7 + u * 0.6) * Math.min(1.6, 0.5 + d.hiz / 20);
        g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${f3(s)})`);
        g.setAttribute('opacity', f3(1 - u * u));
      }
      r.render(sc, kam);
    };
    // zarların ikisi de durduğu kare (sessizlik işareti için)
    const sonHareket = (z) => { const K = z.K; let i = K.length - 1; while (i > 0 && Math.hypot(...K[i].p.map((v, a) => v - K[i - 1].p[a])) < 1e-4) i--; return i; };
    const durus = Math.round(filmKare(Math.max(...zarlar.map(sonHareket))));
    ciz(KY);
    return { ciz, darbeler: tumDarbe, devrik, durus };
  }

  // ===========================================================================================================
  // 3B BALON ZARLARI: d20, d12, d8, d6, d4. Kendi gölgelendiricileri (ışıksız sahne): toon üç ton, malzeme süpürmesi
  // (kâğıt → taş → reçine; nesne y'sinde yukarıdan aşağı, sınırda ince mürekkep bandı). Reçinede arka yüzler ve gizli
  // kenarlar görünür (yarı saydam), pırıltılar zamanla yanıp söner. Tüm renkler sRGB değerleriyle (çıkışta dönüşüm yok).
  function balonZarKur([x0, y0, x1, y1]) {
    const w = x1 - x0, h = y1 - y0, PR = 2;
    const div = document.createElement('div');
    Object.assign(div.style, { position: 'absolute', left: x0 + 'px', top: y0 + 'px', width: w + 'px', height: h + 'px', pointerEvents: 'none' });
    const cv = document.createElement('canvas'); cv.width = Math.round(w * PR); cv.height = Math.round(h * PR);
    Object.assign(cv.style, { width: w + 'px', height: h + 'px', display: 'block' });
    div.appendChild(cv); LB.div.appendChild(div);
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { console.warn('s4-frp: WebGL yok', e); div.remove(); return null; }
    r.setPixelRatio(1); r.setSize(cv.width, cv.height, false); r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    const kam = new THREE.PerspectiveCamera(22, w / h, 0.1, 100);
    kam.position.set(0, 0, 20); kam.lookAt(0, 0, 0);
    // ekranda görünen yarım genişlik (birim) z = 0'da
    const yariY = Math.tan(11 * D2R) * 20, yariX = yariY * w / h;
    const vs = `varying vec3 vN; varying vec3 vNo; varying vec3 vP; varying vec3 vV;
      void main(){ vP = position; vNo = normal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
    const fs = `uniform float uTas, uRec, uArka, uZaman, uTohum, uDamar, uPip, uYari;
      uniform vec3 uKagit, uTas1, uTas2, uRecR;
      varying vec3 vN; varying vec3 vNo; varying vec3 vP; varying vec3 vV;
      float h3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float gur(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float pip(vec3 n, vec3 p){
        vec3 a = abs(n); vec2 uv; float v;
        if (a.x > a.y && a.x > a.z) { uv = p.yz; v = n.x > 0.0 ? 3.0 : 4.0; } else if (a.y > a.z) { uv = p.xz; v = n.y > 0.0 ? 1.0 : 6.0; } else { uv = p.xy; v = n.z > 0.0 ? 2.0 : 5.0; }
        uv /= uYari; float d = 9.0, o = 0.5;
        if (v == 1.0 || v == 3.0 || v == 5.0) d = min(d, length(uv));
        if (v >= 2.0) { d = min(d, length(uv - vec2(o, o))); d = min(d, length(uv + vec2(o, o))); }
        if (v >= 4.0) { d = min(d, length(uv - vec2(o, -o))); d = min(d, length(uv + vec2(o, -o))); }
        if (v == 6.0) { d = min(d, length(uv - vec2(o, 0.0))); d = min(d, length(uv + vec2(o, 0.0))); }
        return 1.0 - smoothstep(0.13, 0.16, d);
      }
      void main(){
        vec3 n = normalize(vN); if (uArka > 0.5) n = -n;
        vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
        float d = dot(n, L);
        float ton = d > 0.42 ? 1.0 : (d > -0.08 ? 0.86 : 0.72);
        float yT = mix(1.0, -1.0, uTas) * uYari * 1.25, yR = mix(1.0, -1.0, uRec) * uYari * 1.25;
        float tT = step(yT, vP.y), tR = step(yR, vP.y);
        vec3 c = uKagit;
        // taş: benekli (granit) ya da damarlı (mermer)
        vec3 q = vP / uYari;
        // benekler yuvarlak: hücre içinde merkeze uzaklık (3B hücre, yüzeyle kesişimi daire)
        vec3 c1 = q * 26.0, c2 = q * 19.0;
        float g1 = gur(q * 3.0 + uTohum);
        float b1 = step(0.78, h3(floor(c1) + uTohum)) * step(length(fract(c1) - 0.5), 0.3 + 0.12 * h3(floor(c1) + 5.0));
        float b2 = step(0.9, h3(floor(c2) + uTohum + 3.1)) * step(length(fract(c2) - 0.5), 0.26);
        vec3 tas = mix(uTas1 * 0.94, uTas1 * 1.05, g1);
        tas = mix(tas, uTas2, b1 * (1.0 - uDamar));
        tas = mix(tas, vec3(0.95, 0.94, 0.92), b2 * (1.0 - uDamar));
        float dm = abs(sin(q.x * 2.6 + gur(q * 1.6 + uTohum) * 5.0 + q.y * 1.4));
        tas = mix(tas, uTas2, (1.0 - smoothstep(0.03, 0.09, dm)) * uDamar);
        c = mix(c, tas, tT);
        // reçine: hafif girdap, kenarda parlama (fresnel), yanıp sönen pırıltılar
        vec3 V = normalize(vV);
        float fr = pow(1.0 - abs(dot(n, V)), 2.0);
        float dal = sin(q.x * 3.0 + sin(q.y * 2.4 + uTohum) * 2.0 + q.z * 1.8);
        vec3 rec = mix(uRecR * 0.94, uRecR * 1.06, 0.5 + 0.5 * dal);
        vec3 hq = floor(q * 9.0) + uTohum + 7.0;
        float pir = step(0.93, h3(hq)) * smoothstep(0.2, 1.0, sin(uZaman * 5.0 + h3(hq + 1.7) * 40.0)) * (1.0 - smoothstep(0.08, 0.2, length(fract(q * 9.0) - 0.5)));
        rec += vec3(pir) * 0.55 + vec3(fr) * 0.3;
        c = mix(c, rec, tR);
        c *= ton;
        // d6 noktaları (her malzemede)
        c = mix(c, vec3(0.16, 0.15, 0.15), pip(vNo, vP) * uPip);
        float a = mix(1.0, mix(0.42, 0.78, fr), tR);
        if (uArka > 0.5) { c *= 0.78; a = tR * 0.55; }
        float bant = (1.0 - smoothstep(0.0, 0.045 * uYari, abs(vP.y - yT))) * step(0.001, uTas) * step(uTas, 0.999);
        bant = max(bant, (1.0 - smoothstep(0.0, 0.045 * uYari, abs(vP.y - yR))) * step(0.001, uRec) * step(uRec, 0.999));
        c = mix(c, vec3(0.114, 0.114, 0.125), bant * 0.9);
        gl_FragColor = vec4(c, a);
      }`;
    const v3 = (hex) => { const c = new THREE.Color(hex); c.convertLinearToSRGB(); return new THREE.Vector3(c.r, c.g, c.b); };
    // Tasarımlar (kullanıcı 2026-10-22: ürettiğimiz şeyler açık renkli): her zar paletten başka bir açık tonla başlar, taşta
    // hepsi açık gri-bej benekli granite döner (ton ve benek yoğunluğu az farklı), reçinede başka bir pastel ton (yarı saydam)
    // dizi: üstte üç (d12, d20, d8), altta iki (d6, d4); üç balon yan yana durduğundan iki yönde de aynı
    const TASARIM = [
      { tur: 'd20', x: 0, y: 0.62, boy: 1.55 }, { tur: 'd12', x: -1.68, y: 0.3, boy: 1.15 }, { tur: 'd8', x: 1.66, y: 0.3, boy: 1.1 },
      { tur: 'd6', x: -0.8, y: -1.15, boy: 0.95 }, { tur: 'd4', x: 0.85, y: -1.15, boy: 1.05 },
    ];
    // reçine arka yüzlerle üst üste biner ve koyulaşır: pastel ton %25 beyaza açılarak verilir
    const U = URUN_RENK, acik = (h) => '#' + [1, 3, 5].map((j) => Math.round(parseInt(h.slice(j, j + 2), 16) * 0.75 + 255 * 0.25).toString(16).padStart(2, '0')).join('');
    const RENK = [
      { kagit: U.lila, tas1: '#ddd6ca', tas2: '#8d867a', damar: 0, rec: acik(U.mercan) },      // d20: lila → bej granit → mercan reçine
      { kagit: U.gok, tas1: '#e2dcd1', tas2: '#9a9286', damar: 0, rec: acik(U.nane) },        // d12: gök → açık granit → nane reçine
      { kagit: U.limon, tas1: '#d6cfc3', tas2: '#857e72', damar: 0, rec: acik(U.gok) },       // d8: limon → kum granit → gök reçine
      { kagit: U.nane, tas1: '#e0dad0', tas2: '#948c80', damar: 0, rec: acik(U.lila) },       // d6: nane → açık granit → lila reçine
      { kagit: U.seftali, tas1: '#d9d2c6', tas2: '#8a8377', damar: 0, rec: acik(U.limon) },   // d4: şeftali → bej granit → limon reçine
    ];
    const GEO = {
      d20: (s) => new THREE.IcosahedronGeometry(s * 0.62), d12: (s) => new THREE.DodecahedronGeometry(s * 0.62),
      d8: (s) => new THREE.OctahedronGeometry(s * 0.66), d6: (s) => new THREE.BoxGeometry(s * 0.82, s * 0.82, s * 0.82),
      d4: (s) => new THREE.TetrahedronGeometry(s * 0.72),
    };
    // dizinin kapsamı x ±2,4, y −1,9…1,6 (birim): tuvale sığar, ortası biraz yukarı kayar
    const birim = Math.min(yariX / 2.45, yariY / 1.85), kx = birim;
    const zarlar = TASARIM.map((t, i) => {
      const s = t.boy * birim, geo = GEO[t.tur](s);
      const R2 = RENK[i];
      const uni = () => ({
        uTas: { value: 0 }, uRec: { value: 0 }, uArka: { value: 0 }, uZaman: { value: 0 }, uTohum: { value: i * 3.7 + 1 },
        uDamar: { value: R2.damar }, uPip: { value: t.tur === 'd6' ? 1 : 0 }, uYari: { value: t.tur === 'd6' ? s * 0.41 : s * 0.6 },
        uKagit: { value: v3(R2.kagit) }, uTas1: { value: v3(R2.tas1) }, uTas2: { value: v3(R2.tas2) }, uRecR: { value: v3(R2.rec) },
      });
      const matOn = new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: vs, fragmentShader: fs, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const matArka = new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: vs, fragmentShader: fs, transparent: true, side: THREE.BackSide, depthWrite: false });
      matArka.uniforms.uArka.value = 1;
      const on = new THREE.Mesh(geo, matOn), arka = new THREE.Mesh(geo, matArka);
      arka.renderOrder = 0; on.renderOrder = 1;
      const kenarGeo = new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 10));
      const cm = new LineMaterial({ color: new THREE.Color(M), linewidth: 3.6 * PR, resolution: new THREE.Vector2(cv.width, cv.height) });
      const cmGizli = new LineMaterial({ color: new THREE.Color(M), linewidth: 2.0 * PR, resolution: new THREE.Vector2(cv.width, cv.height), transparent: true, opacity: 0, depthTest: false });
      const kenar = new LineSegments2(kenarGeo, cm), gizli = new LineSegments2(kenarGeo, cmGizli);
      kenar.renderOrder = 2; gizli.renderOrder = 3;
      const g = new THREE.Group(); g.add(arka, on, gizli, kenar);
      g.position.set(t.x * kx, (t.y + 0.15) * birim, 0);
      sc.add(g);
      // dönüş ekseni ve hızı (tohumlu, sabit)
      const RR = rng(4100 + i * 17), eksen = new THREE.Vector3(RR() - 0.5, 1, RR() - 0.5).normalize(), hiz = (0.55 + RR() * 0.35) * (i % 2 ? -1 : 1), faz = RR() * 6;
      return { g, matOn, matArka, cm, cmGizli, eksen, hiz, faz, i };
    });
    const qq = new THREE.Quaternion(), egik = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, 0.3, 0.12));
    const sure01 = (n, a, d) => Math.max(0, Math.min(1, (n - a) / d));
    const cikis = (u) => { const c1 = 1.70158, c3 = c1 + 1; return u <= 0 ? 0 : 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
    const ciz = (n) => {
      if (n < POP[0] - 1 || n > SON + 1) return;
      const ki = Math.floor(n * 8 / 60) % 4;
      for (const z of zarlar) {
        const pop = sure01(n, POP[z.i], 12), tas = sure01(n, TAS[z.i], 18), rec = sure01(n, RECINE[z.i], 18);
        const sk = cikis(pop);
        z.g.scale.setScalar(Math.max(0.0001, sk));
        // giriş dönüşü hızlı başlar, sonra sabit hıza iner
        const t = (n - POP[z.i]) / 60, aci = z.faz + z.hiz * t * 2.2 + (1 - Math.min(1, pop * 1.4)) * 2.5 * Math.sign(z.hiz);
        qq.setFromAxisAngle(z.eksen, aci); z.g.quaternion.copy(egik).multiply(qq);
        for (const m of [z.matOn, z.matArka]) { m.uniforms.uTas.value = tas; m.uniforms.uRec.value = rec; m.uniforms.uZaman.value = n / 60; }
        z.cm.linewidth = (3.6 + [0, 0.35, -0.2, 0.2][ki]) * PR;
        z.cmGizli.opacity = rec * 0.32;
      }
      r.render(sc, kam);
    };
    ciz(POP[0]);
    return { div, ciz };
  }

  // ===========================================================================================================
  // BALON İÇİ 3B FİGÜRLER (E3'ün piyonları, E4'ün minifigürü): şeffaf tuval, toon malzeme. Çizgi dili yakın planla aynı:
  // üç ton gölge, mürekkep konturu (normal boyunca şişirilmiş ters kabuk). Ürün renkleri URUN_RENK (açık pastel).
  function balonTuval([x0, y0, x1, y1], fov = 22, uzak = 20) {
    const w = x1 - x0, h = y1 - y0, PR = 2;
    const div = document.createElement('div');
    Object.assign(div.style, { position: 'absolute', left: x0 + 'px', top: y0 + 'px', width: w + 'px', height: h + 'px', pointerEvents: 'none' });
    const cv = document.createElement('canvas'); cv.width = Math.round(w * PR); cv.height = Math.round(h * PR);
    Object.assign(cv.style, { width: w + 'px', height: h + 'px', display: 'block' });
    div.appendChild(cv); LB.div.appendChild(div);
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { console.warn('s4-frp: WebGL yok', e); div.remove(); return null; }
    r.setPixelRatio(1); r.setSize(cv.width, cv.height, false); r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    const kam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
    kam.position.set(0, 0, uzak); kam.lookAt(0, 0, 0);
    const yariY = Math.tan(fov / 2 * D2R) * uzak;
    return { div, r, sc, kam, yariX: yariY * w / h, yariY };
  }
  // parca(geometri, renk): dolgu (toon) + kontur (ters kabuk) grubu; w kontur kalınlığı (figür birimi), cift: açık yüzey
  // (pelerin, başlık) iki yüzlü. Yardımcılar: torna (dönel profil), kure (ölçekli küre), koy (yer, dönüş), grup, ikiYan
  function toonKit(sc) {
    const grad = new THREE.DataTexture(new Uint8Array([0, 128, 255]), 3, 1, THREE.RedFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
    sc.add(new THREE.AmbientLight(0xffffff, 0.64 * Math.PI));
    const gun = new THREE.DirectionalLight(0xffffff, 0.36 * Math.PI); gun.position.set(-4, 7, 9); sc.add(gun);
    const ink = new THREE.Vector3(0x1d / 255, 0x1d / 255, 0x20 / 255); // gölgelendirici sRGB değeri yazar (dönüşüm yok)
    const kabuk = new Map();
    const kabukMat = (w) => kabuk.get(w) || kabuk.set(w, new THREE.ShaderMaterial({
      uniforms: { uW: { value: w }, uR: { value: ink } },
      vertexShader: 'uniform float uW; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uW, 1.0); }',
      fragmentShader: 'uniform vec3 uR; void main(){ gl_FragColor = vec4(uR, 1.0); }',
      side: THREE.BackSide,
    })).get(w);
    const parcalar = [];
    const parca = (geo, renk, { w = 0.045, cift = false } = {}) => {
      const hedef = new THREE.Color(URUN_RENK[renk] || renk);
      const m = new THREE.MeshToonMaterial({ color: hedef.clone(), gradientMap: grad, side: cift ? THREE.DoubleSide : THREE.FrontSide });
      const g = new THREE.Group(), dolgu = new THREE.Mesh(geo, m);
      g.add(new THREE.Mesh(geo, kabukMat(w)), dolgu);
      parcalar.push({ m, hedef, dolgu });
      return g;
    };
    const torna = (pts, n = 28) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
    const kure = (r0, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r0, 24, 16); g.scale(sx, sy, sz); return g; };
    const koy = (o, [x, y, z], [rx, ry, rz] = [0, 0, 0]) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
    const grup = (...p) => { const g = new THREE.Group(); g.add(...p); return g; };
    const ikiYan = (f) => [-1, 1].map(f);
    return { parca, parcalar, torna, kure, koy, grup, ikiYan };
  }
  function cikisBO(u) { const c1 = 1.70158, c3 = c1 + 1; return u <= 0 ? 0 : 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; }

  // E3'ün balonu: kâğıt figürlerin gerçek hâli, baskı piyonlar (şövalye, büyücü, canavar). Yuvarlak pahlı kaideli, her biri
  // kendi açık renginde; kaidelerinin üstünde salınarak döner (ön yüzleri hep okunur). pop: her piyonun belirdiği kare
  function balonPiyonKur(icr, pop) {
    const T = balonTuval(icr); if (!T) return null;
    const { sc, kam, r, yariX, yariY } = T, { parca, torna, kure, koy, grup, ikiYan } = toonKit(sc);
    const kaide = (renk) => parca(torna([[0, 0], [0.6, 0], [0.64, 0.05], [0.64, 0.12], [0.57, 0.19], [0, 0.19]]), renk);
    const disk = (r0, d) => { const g = new THREE.CylinderGeometry(r0, r0, d, 28); g.rotateX(Math.PI / 2); return g; };
    const PIYON = {
      // şövalye: tunik, miğfer (vizör yarığı, sorguç), kalkan, kılıç
      sovalye: () => grup(kaide('gok'),
        parca(torna([[0, 0.19], [0.42, 0.19], [0.4, 0.3], [0.3, 0.74], [0.25, 0.94], [0.31, 1.0], [0.22, 1.06], [0, 1.06]]), 'gok'),
        koy(parca(kure(0.27), 'lilaAcik'), [0, 1.3, 0]),
        koy(parca(new RoundedBoxGeometry(0.34, 0.07, 0.12, 2, 0.025), 'koyu', { w: 0.02 }), [0, 1.3, 0.22]),
        koy(parca(new THREE.ConeGeometry(0.09, 0.4, 16), 'mercan'), [0, 1.68, -0.05], [-0.3, 0, 0]),
        koy(parca(disk(0.3, 0.07), 'limon'), [-0.38, 0.72, 0.2], [0, -0.45, 0]),
        koy(parca(disk(0.12, 0.08), 'mercan', { w: 0.025 }), [-0.4, 0.72, 0.24], [0, -0.45, 0]),
        koy(parca(new RoundedBoxGeometry(0.08, 0.84, 0.04, 2, 0.015), 'beyaz'), [0.44, 1.06, 0.1]),
        koy(parca(new RoundedBoxGeometry(0.3, 0.07, 0.08, 2, 0.025), 'limon'), [0.44, 0.66, 0.1]),
        koy(parca(new THREE.CapsuleGeometry(0.045, 0.14, 4, 10), 'seftaliKoyu', { w: 0.025 }), [0.44, 0.54, 0.1])),
      // büyücü: cüppe, sakal, geniş kenarlı sivri şapka, asa ve küre
      buyucu: () => grup(kaide('lila'),
        parca(torna([[0, 0.19], [0.46, 0.19], [0.43, 0.3], [0.29, 0.8], [0.22, 1.0], [0, 1.0]]), 'lila'),
        koy(parca(kure(0.22), 'seftali'), [0, 1.16, 0]),
        koy(parca(new THREE.ConeGeometry(0.17, 0.42, 20), 'beyaz'), [0, 0.98, 0.12], [Math.PI, 0, 0]),
        koy(parca(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), 'gok'), [0, 1.3, 0]),
        koy(parca(new THREE.ConeGeometry(0.25, 0.62, 24), 'gok'), [0.02, 1.61, 0], [0, 0, -0.16]),
        koy(parca(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 10), 'seftaliKoyu'), [0.46, 0.94, 0.1]),
        koy(parca(new THREE.IcosahedronGeometry(0.12, 0), 'nane'), [0.46, 1.75, 0.1])),
      // canavar: tombul gövde, açık karın, iri gözler, boynuzlar, kısa kollar
      canavar: () => grup(kaide('nane'),
        koy(parca(kure(0.5, 1, 0.92, 0.86), 'nane'), [0, 0.67, 0]),
        koy(parca(kure(0.32, 1, 1.05, 0.5), 'limon'), [0, 0.6, 0.3]),
        ...ikiYan((s) => koy(parca(kure(0.11), 'beyaz', { w: 0.025 }), [s * 0.17, 0.92, 0.33])),
        ...ikiYan((s) => koy(parca(kure(0.05), 'koyu', { w: 0.012 }), [s * 0.17, 0.92, 0.43])),
        ...ikiYan((s) => koy(parca(new THREE.ConeGeometry(0.09, 0.34, 16), 'seftali'), [s * 0.3, 1.13, 0], [0, 0, -s * 0.5])),
        ...ikiYan((s) => koy(parca(new THREE.CapsuleGeometry(0.085, 0.24, 4, 12), 'nane'), [s * 0.5, 0.64, 0.06], [0, 0, s * 0.9])),
        koy(parca(new RoundedBoxGeometry(0.22, 0.05, 0.05, 2, 0.02), 'koyu', { w: 0.012 }), [0, 0.76, 0.43])),
    };
    // dizi: üç piyon yan yana (x ±1,5), boyları ~1,9; kök hafif öne eğik (yukarıdan bakış), dönme figürlerin ortasından
    const kok = new THREE.Group(), ic = new THREE.Group(); kok.add(ic); sc.add(kok);
    // (öne eğik kaidenin ön kenarı aşağı sarkar: alt pay ~0,2 birim)
    kok.rotation.x = 0.3; ic.position.y = -0.9;
    kok.scale.setScalar(Math.min(yariX * 0.95 / 2.25, yariY * 0.84 / 1.0));
    const piyonlar = ['sovalye', 'buyucu', 'canavar'].map((ad, i) => {
      const t = new THREE.Group(); t.add(PIYON[ad]()); t.position.x = (i - 1) * 1.5; ic.add(t);
      return { t, i };
    });
    const ciz = (n) => {
      if (n < pop[0] - 1 || n > SON + 1) return;
      for (const p of piyonlar) {
        const u = Math.max(0, Math.min(1, (n - pop[p.i]) / 12));
        p.t.scale.setScalar(Math.max(1e-4, cikisBO(u)));
        // salınarak döner; girişte hızlı yarım dönüşle gelir
        p.t.rotation.y = 0.6 * Math.sin((n - pop[p.i]) / 60 * 1.4 + p.i * 2.1) + (1 - Math.min(1, u * 1.2)) * 2.4 * (p.i % 2 ? -1 : 1);
      }
      r.render(sc, kam);
    };
    ciz(pop[0]);
    return { div: T.div, ciz };
  }

  // E4'ün balonu: masaüstü RPG minifigürü (özgün: başlıklı, pelerinli bir gezgin; asasının ucunda kristal, belinde çanta).
  // Pahlı yuvarlak kaide, üstünde kaya ve çimen öbekleri. Astar grisiyle belirir, K_TAS'tan sonra parçalar aşağıdan yukarı
  // boyanır (açık pastel); kaidesiyle birlikte yavaşça döner (döner tabla)
  function balonMiniKur(icr, pop) {
    const T = balonTuval(icr); if (!T) return null;
    const { sc, kam, r, yariX, yariY } = T, { parca, parcalar, torna, kure, koy, grup, ikiYan } = toonKit(sc);
    const tas = new THREE.DodecahedronGeometry(0.2, 0); tas.scale(1.3, 0.75, 1);
    const cimen = () => grup(...[[0, 0.17], [0.05, 0.14], [-0.045, 0.12]].map(([x, h], j) =>
      koy(parca(new THREE.ConeGeometry(0.035, h, 8), 'adacayi', { w: 0.015 }), [x, h / 2, j * 0.02], [0, 0, -x * 5])));
    // pelerin: önü açık (±0,9 rad) kesik koni; başlık: önü açık yarım küre
    const pelerin = new THREE.CylinderGeometry(0.22, 0.52, 0.98, 28, 1, true, 0.9, Math.PI * 2 - 1.8);
    const baslik = new THREE.SphereGeometry(0.21, 24, 16, Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, 0, Math.PI * 0.62);
    const fig = grup(
      parca(torna([[0, 0], [0.84, 0], [0.88, 0.06], [0.88, 0.14], [0.8, 0.22], [0, 0.22]], 40), 'limon'),
      koy(parca(tas, 'lilaAcik'), [-0.52, 0.27, 0.18], [0.2, 0.6, 0.1]),
      ...[[0.52, 0.3], [0.36, -0.42], [-0.16, 0.6], [-0.56, -0.3]].map(([x, z], i) => koy(cimen(), [x, 0.22, z], [0, i * 1.3, 0])),
      ...ikiYan((s) => koy(parca(new THREE.CapsuleGeometry(0.085, 0.3, 4, 12), 'mercan'), [s * 0.11, 0.46, 0])),
      ...ikiYan((s) => koy(parca(kure(0.1, 1, 0.65, 1.35), 'seftaliKoyu'), [s * 0.11, 0.27, 0.04])),
      parca(torna([[0, 0.56], [0.25, 0.56], [0.29, 0.66], [0.27, 0.98], [0.17, 1.1], [0, 1.1]]), 'gok'),
      koy(parca(new THREE.TorusGeometry(0.278, 0.035, 8, 28), 'mercanKoyu', { w: 0.02 }), [0, 0.7, 0], [Math.PI / 2, 0, 0]),
      koy(parca(pelerin, 'adacayi', { cift: true }), [0, 0.68, -0.02]),
      koy(parca(kure(0.16), 'seftali'), [0, 1.25, 0.03]),
      ...ikiYan((s) => koy(parca(kure(0.026), 'koyu', { w: 0.008 }), [s * 0.06, 1.27, 0.175])),
      koy(parca(baslik, 'adacayi', { cift: true }), [0, 1.27, 0]),
      koy(parca(new THREE.CapsuleGeometry(0.07, 0.2, 4, 10), 'adacayi'), [0.36, 0.92, 0.04], [0, 0, 0.6]),
      koy(parca(kure(0.075), 'seftali', { w: 0.02 }), [0.45, 0.8, 0.06]),
      koy(parca(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 10), 'seftaliKoyu'), [0.47, 0.96, 0.06]),
      koy(parca(new THREE.OctahedronGeometry(0.11), 'gok'), [0.47, 1.8, 0.06]),
      koy(parca(new THREE.CapsuleGeometry(0.07, 0.28, 4, 10), 'adacayi'), [-0.31, 0.86, 0.04], [0, 0, -0.22]),
      koy(parca(new RoundedBoxGeometry(0.17, 0.15, 0.09, 2, 0.03), 'seftaliKoyu'), [-0.28, 0.64, 0.17], [0, -0.3, 0]),
    );
    // boya sırası: parçanın figürdeki yüksekliği (kaide önce, kristal en son); figür henüz bir yere bağlı değilken ölçülür
    fig.updateMatrixWorld(true);
    const kutu = new THREE.Box3(), ASTAR = new THREE.Color('#d9d5cd');
    const boya = parcalar.map((p) => { kutu.setFromObject(p.dolgu); return { ...p, y: Math.max(0, (kutu.min.y + kutu.max.y) / 2) }; });
    const ymax = Math.max(...boya.map((b) => b.y));
    const kok = new THREE.Group(), ic = new THREE.Group(); ic.add(fig); kok.add(ic); sc.add(kok);
    kok.rotation.x = 0.28; ic.position.y = -0.85; // kaidenin ön kenarı tuvalin altından taşmasın
    kok.scale.setScalar(Math.min(yariX * 0.9 / 0.95, yariY * 0.82 / 1.0));
    const ciz = (n) => {
      if (n < pop - 1 || n > SON + 1) return;
      const u = Math.max(0, Math.min(1, (n - pop) / 14));
      fig.scale.setScalar(Math.max(1e-4, cikisBO(u)));
      fig.rotation.y = -0.55 + (n - pop) / 60 * 0.5 + (1 - Math.min(1, u * 1.2)) * 2.2;
      for (const b of boya) {
        const v = Math.max(0, Math.min(1, (n - K_TAS - 4 - b.y / ymax * 24) / 10));
        b.m.color.copy(ASTAR).lerp(b.hedef, v * v * (3 - 2 * v));
      }
      r.render(sc, kam);
    };
    ciz(pop);
    return { div: T.div, ciz };
  }
}
