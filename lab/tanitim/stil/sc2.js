// M2 stil karesi SÇ2, "çekmece kuşkusu" (plan v04 §3 #13, k860): B'nin bakışından (tepeden) açık çekmece.
// Plan: tanıtım filmi planı v04 (yerel çalışma notları) §3 #11–#14, §4 stil kılavuzu, §5 G3.
// Anlatı: çekmece dağınık (~60 vida, somun, pul; devrilmiş şeffaf poşetten dökülen vidalar). B'nin aklındaki organizer
// çekmecenin üstüne kesik çizgiyle biner (%60); uzun vida kısa bölmeden taşar, bir köşe çekmeceye sığmaz. Ölçü okları ve
// "84 mm?" istek işaretidir (vurgu rengi). B'nin iki eli çekmecenin ön kenarını tutar (kol.js elUstten). "Sığar mı?" el yazısı.
// Gözün yolu: eller (alt, en açık ton koyu panelde) → vidalar (doku) → ölçü (vurgu) → "?" (en büyük yazı, vurgu).
// Stil katmanı sc1.js'ten (çizgi şekli, kâğıt, kaynama indisi): SÇ1 ile aynı mürekkep ve gren.
// Birim: çekmece zemini mm (iç 480×300; Gridfinity 42), ekrana S px/mm ile. Kontur kalınlıkları EKRAN pikselinde verilir.
// Belirlenebilir: bütün yerleşim tohumlu (insan.js rng), Math.random yok.
// Sorgu: ?yon=yatay|dikey ?dil=tr|en ?kagit=0 (gren yok) ?t=0.4 (kareyi dondur) ?cek=1 (anlar.py / film-cek.py)
//        ?ham=1 (organizer ve işaretler gizli: dağınıklık tek başına)
import { STIL, murekkepSekli, kagitKur, kaynaIndis, W, H, DIKEY, DIL, q, CEKIM } from './sc1.js';
import { yol, oval, rng, MONO } from '../insan.js';
import { elUstten } from '../kol.js';

const M = STIL.murekkep, V = STIL.vurgu, KAGIT = STIL.kagit;
const PARLAK = '#faf8f3';
const D2R = Math.PI / 180;
const f2 = (v) => Math.round(v * 100) / 100;
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const don = ([x, y], a) => { const c = Math.cos(a * D2R), s = Math.sin(a * D2R); return [x * c - y * s, x * s + y * c]; };
const yer = (pts, x, y, a) => pts.map((p) => { const r = don(p, a); return [r[0] + x, r[1] + y]; });
const HAM = q.get('ham') === '1';

// ------------------------------------------------------------------------------------------------ düzen (yön başına)
// C: zemin merkezinin (240,150) ekran yeri; th: dünya açısı (derece; hafif eğik tepe kadrajı, sağ üst yükselir).
// kutular: organizer bölmeleri (Gridfinity birimi [gx, gy, gw, gh]); kisa: uzun vidanın taştığı bölme; kotu: sığmayan köşe.
const U = 42, OX = 9, OY = 3;
const YATAY = {
  S: 2.2, C: [572, 474], th: -2,
  kutular: [
    [0, 0, 3, 2], [3, 0, 2, 2], [5, 0, 3, 1], [5, 1, 3, 1], [8, 0, 2, 2], [10, 0, 1, 2],
    [0, 2, 2, 2], [2, 2, 3, 2], [5, 2, 2, 2], [7, 2, 3, 1], [7, 3, 3, 1],
    [0, 4, 3, 3], [3, 4, 2, 3], [5, 4, 3, 2], [5, 6, 3, 1], [8, 4, 2, 3], [10, 4, 1, 1],
  ],
  kisa: [10, 2, 1, 2], kotu: [10, 5, 1.9, 2],
  kahraman: { x: 450, y: 129, a: 92.5 },           // uzun vida (baş üstte)
  olcu: 'sag',                                     // ölçü çizgisi çekmecenin sağında, dikey
  poset: { x: 104, y: 74, a: 24 },
  temiz: [[414, 44, 486, 206], [452, 232, 486, 304]], // kahraman bölgesi ve sığmayan köşenin taşan yanı: parça girmez
  yigin: [[62, 262, 46, 30], [190, 268, 52, 26], [304, 266, 46, 28], [410, 272, 30, 22]], // ön yığınlar [x, y, yarıEn, yarıBoy]
  el: { boy: 322, sol: [112, 323], sag: [368, 323], aciSol: -99, aciSag: -81 },
  etiket: { boyut: 104 },
  baslik: { boyut: 172, x: null, y: 700, aci: -4 },
};
const DIKEY_D = {
  S: 2.1, C: [476, 990], th: -1.5,
  kutular: [
    [0, 0, 3, 2], [3, 0, 3, 2], [6, 1, 2, 1], [8, 0, 3, 2],
    [0, 2, 3, 2], [3, 2, 2, 2], [5, 2, 3, 1], [5, 3, 3, 1], [8, 2, 3, 2],
    [0, 4, 2, 3], [2, 4, 3, 3], [5, 4, 2, 2], [5, 6, 2, 1], [7, 4, 2, 3], [9, 4, 2, 1],
  ],
  kisa: [6, 0, 2, 1], kotu: [9, 5, 2.9, 2],
  kahraman: { x: 303, y: 24, a: 181.5 },          // baş sağda
  olcu: 'ust',                                     // ölçü çizgisi çekmecenin üstünde, yatay
  poset: { x: 116, y: 170, a: 14 },
  temiz: [[232, -4, 374, 52], [440, 232, 486, 304]],
  yigin: [[64, 266, 48, 28], [196, 270, 52, 24], [304, 262, 48, 30], [430, 268, 36, 26]],
  el: { boy: 350, sol: [112, 323], sag: [368, 323], aciSol: -99, aciSag: -81 },
  etiket: { boyut: 108 },
  baslik: { boyut: 178, x: 556, y: 380, aci: -4, orta: true },
};
const L = DIKEY ? DIKEY_D : YATAY;
const S = L.S;
const ORT = [240, 150];
// dünya (mm) → ekran (px)
const ekran = ([x, y]) => { const r = don([(x - ORT[0]) * S, (y - ORT[1]) * S], L.th); return [L.C[0] + r[0], L.C[1] + r[1]]; };
const DUNYA_TR = `translate(${L.C[0]} ${L.C[1]}) rotate(${L.th}) scale(${S}) translate(${-ORT[0]} ${-ORT[1]})`;
const EL_TR = `translate(${L.C[0]} ${L.C[1]}) rotate(${L.th})`; // eller px biriminde (ölçeksiz)

// Çekmece ölçüleri (mm): iç yüz görünen derinlik (hafif bakış açısı: arka ve yan iç yüzler görünür), duvar üstü kalınlığı
const HS = 7, HB = 16, TW = 12;
const PANEL = { x0: -HS - TW - 17, x1: 480 + HS + TW + 17, y0: 300 + TW, y1: 300 + TW + 22, yuz: 300 + TW + 39 };

// ------------------------------------------------------------------------------------------------ çizim araçları
// Kalem: insan.js titreşimi (sabit el sapması + kaynamaya göre değişen kısım). genlik mm cinsinden.
function kalemKur(K) {
  return (tohum, genlik = 0.4) => {
    const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + K * 1013 + 1);
    const a = Array.from({ length: 128 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 128 }, () => (Rk() - 0.5) * 1.3);
    return { sap: (i, e) => (a[(i * 2 + e) % 128] + b[(i * 2 + e + 3) % 128]) * genlik };
  };
}
// Mürekkep: çizgiyi değişken kalınlıklı dolguya çevirir (sc1.js murekkepSekli; px ekran pikseli)
function murekkep(d, px, renk, tohum, { golge = true, uc, ucBoy, s = S } = {}) {
  const sh = murekkepSekli(d, px, s, tohum, { golge, uc, ucBoy });
  return sh ? `<path fill="${renk}" d="${sh.replace('__R__', renk)}"/>` : '';
}
// Kenarları sık noktalara böl (Catmull-Rom köşeyi yumuşatsın ama kenarı şişirmesin)
function sik(pts, adim, kapali = true) {
  const out = [], n = pts.length;
  for (let i = 0; i < (kapali ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / adim));
    for (let j = 0; j < m; j++) out.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]);
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}
// Yuvarlak köşeli dikdörtgen (kapalı, sık)
function dikd(x0, y0, x1, y1, rc = 0, adim = 6) {
  const p = [];
  const kose = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * D2R; p.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a)]); } };
  if (!rc) p.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
  else { kose(x1 - rc, y0 + rc, 270); kose(x1 - rc, y1 - rc, 0); kose(x0 + rc, y1 - rc, 90); kose(x0 + rc, y0 + rc, 180); }
  return sik(p, adim);
}
const cember = (cx, cy, r, n = 14) => oval(cx, cy, r, r, 0, 360, n, 2);
const yay = (cx, cy, r, a0, a1, n = 6) => oval(cx, cy, r, r, a0, a1, n, 2);
// Dışbükey zarf (monoton zincir)
function zarf(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const alt = [], ust = [];
  for (const v of p) { while (alt.length >= 2 && cr(alt.at(-2), alt.at(-1), v) <= 0) alt.pop(); alt.push(v); }
  for (const v of p.slice().reverse()) { while (ust.length >= 2 && cr(ust.at(-2), ust.at(-1), v) <= 0) ust.pop(); ust.push(v); }
  return alt.slice(0, -1).concat(ust.slice(0, -1));
}
const ISIK = [-0.47, -0.88]; // ışığa doğru (sol üst)

// Bir kaynama çiziminin araçları. Hepsi dünya biriminde (mm) nokta alır, dizge döndürür.
function araclar(K) {
  const kal = kalemKur(K);
  const kay = f2(STIL.kaymaPx / S);
  return {
    kal,
    // açık ya da kapalı mürekkep çizgisi
    cizgi(pts, px, { kapali = false, renk = M, tohum = 1, genlik = 0.4, golge, uc, ucBoy } = {}) {
      const d = yol(pts, kapali, kal(tohum, genlik));
      return murekkep(d, px, renk, tohum * 7 + K, { golge: golge ?? kapali, uc, ucBoy });
    },
    // dolgu (baskı kayması) + kontur, aynı titreşimle
    sekil(pts, dolgu, px, { tohum = 1, genlik = 0.4, kayPx = STIL.kaymaPx, renk = M, opak } = {}) {
      const d = yol(pts, true, kal(tohum, genlik)), k = f2(kayPx / S);
      return `<path d="${d}" fill="${dolgu}"${opak != null ? ` fill-opacity="${opak}"` : ''} transform="translate(${k} ${k})"/>` + (px ? murekkep(d, px, renk, tohum * 7 + K) : '');
    },
    // yalnız dolgu
    dolgu(pts, renk, { tohum = 1, genlik = 0.4, kayPx = STIL.kaymaPx, opak } = {}) {
      const d = yol(pts, true, kal(tohum, genlik)), k = f2(kayPx / S);
      return `<path d="${d}" fill="${renk}"${opak != null ? ` fill-opacity="${opak}"` : ''} transform="translate(${k} ${k})"/>`;
    },
    // ince düz çizgi (diş, pah, kesik çizgi): sabit kalınlık
    ince(pts, px, { renk = M, tohum = 1, genlik = 0.25, opak, kapali = false, kesik } = {}) {
      return `<path d="${yol(pts, kapali, kal(tohum, genlik))}" fill="none" stroke="${renk}" stroke-width="${f2(px / S)}" stroke-linecap="round" stroke-linejoin="round"${opak != null ? ` stroke-opacity="${opak}"` : ''}${kesik ? ` stroke-dasharray="${kesik.map((v) => f2(v / S)).join(' ')}"` : ''}/>`;
    },
    // gölge siluet (dünya, ofsetli; gölge grubunda tek renk, grup opaklığıyla)
    siluet(pts, dx, dy, tohum = 1) { return `<path d="${yol(pts, true, kal(tohum, 0.2))}" transform="translate(${dx} ${dy})"/>`; },
    kay,
  };
}

// ------------------------------------------------------------------------------------------------ parçalar
// Renkler (MONO sıcak griler): çelik, çinko (açık), siyah oksit (koyu), plastik dübel (en açık)
const RENK = {
  celik: ['#b0a99c', '#a59e91'], cinko: ['#c8c2b7', '#bdb6a9'], siyah: ['#6f695f', '#5f5a53'], plastik: ['#ece8e0', '#e2ddd3'],
  somun: ['#a59e91', '#8d867a', '#bdb6a9'], somunYan: '#6f695f', pul: ['#c8c2b7', '#b5b1aa', '#d4cec4'], pulYan: '#8d867a',
  delik: '#c3bcb0',
};
// Vida (yan yatmış, ekseni yerel +x; baş x ≤ 0, uç x = L). Baş yüzü hafif devrik görünür (yıldız/yarık okunsun diye).
// tur: yildiz (yuvarlak baş, yıldız yuva) | havsa (havşa baş, yıldız) | yarik (yuvarlak baş, düz yarık) | civata (altıgen baş) | dubel
function vidaGeo(p) {
  const { L: Lv, d, tur } = p;
  const hd = p.hd ?? (tur === 'civata' ? 1.75 * d : 2.05 * d), hh = p.hh ?? (tur === 'civata' ? 0.7 * d : tur === 'havsa' ? 0.62 * d : 0.72 * d);
  const uc = tur === 'civata' || tur === 'dubel' ? 0 : 1.55 * d, Lb = Lv - uc;
  let govde;
  if (tur === 'civata') govde = sik([[0, -d / 2], [Lv - 0.9, -d / 2], [Lv, -d / 2 + 0.9], [Lv, d / 2 - 0.9], [Lv - 0.9, d / 2], [0, d / 2]], 1.6);
  else if (tur === 'dubel') {
    const r = d / 2, ust = [], altK = [];
    for (let x = 2.2; x < Lv - 1.5; x += 2.8) { ust.push([x, -r], [x + 1.4, -r * 0.84]); altK.push([x, r], [x + 1.4, r * 0.84]); }
    govde = [[0, -r * 0.9], ...ust, [Lv - 0.6, -r * 0.6], [Lv, 0], [Lv - 0.6, r * 0.6], ...altK.reverse(), [0, r * 0.9]];
  } else govde = sik([[0, -d / 2], [Lb, -d / 2], [Lv, 0], [Lb, d / 2], [0, d / 2]], 1.6);
  let bas, yuz = null;
  if (tur === 'havsa') {
    const ry = hd / 2, rx = hd * 0.2;
    bas = [[0.4, -d / 2], ...oval(-hh, 0, rx, ry, 270, 90, 10, 2).reverse(), [0.4, d / 2]];
    yuz = { cx: -hh, rx, ry };
  } else if (tur === 'civata') {
    const y = hd / 2;
    bas = sik([[0.3, -y], [-hh + 0.9, -y], [-hh, -y + 1.1], [-hh, y - 1.1], [-hh + 0.9, y], [0.3, y]], 1.4);
  } else if (tur === 'dubel') {
    const r = d / 2 * 1.42;
    bas = sik([[0.4, -r], [-1.6, -r], [-1.9, -r + 0.6], [-1.9, r - 0.6], [-1.6, r], [0.4, r]], 1);
  } else {
    // yuvarlak (kubbe) baş: düz tarafı gövdeye, kubbesi geriye
    bas = [[0.4, -hd * 0.46], ...oval(0.4, 0, hh, hd / 2, 270, 90, 12, 2.2).reverse(), [0.4, hd * 0.46]];
    yuz = { cx: -hh * 0.5, rx: hh * 0.42, ry: hd * 0.34 };
  }
  return { hd, hh, uc, Lb, govde, bas, yuz };
}
function vidaCiz(A, p, { px = 2.8, ic = 1.4, tohum = 1, dis = M, disOpak = 0.75, parlak = 1.6 } = {}) {
  // (x, y) vidanın ortası: yerel eksen başta 0, uçta L
  const g = vidaGeo(p), T = (pts) => yer(pts.map(([u, v]) => [u - p.L / 2, v]), p.x, p.y, p.a);
  const [gr, br] = p.renk;
  let s = '';
  s += A.sekil(T(g.govde), gr, px, { tohum, genlik: 0.12, kayPx: 2 });
  // diş çizgileri: eğik, gövde boyunca (vidada sivri uca kadar daralır); dübelde kaburga
  const d = p.d, hw = (x) => (x < g.Lb ? d / 2 : d / 2 * Math.max(0, (p.L - x) / Math.max(0.1, p.L - g.Lb)));
  if (p.tur === 'dubel') {
    for (let x = 3.6; x < p.L - 2; x += 2.8) s += A.ince(T([[x, -d * 0.4], [x + 0.3, 0], [x, d * 0.4]]), 1.1, { tohum: tohum + x, opak: 0.5 });
  } else {
    const adim = p.tur === 'civata' ? sinir(d * 0.32, 1.7, 2.6) : sinir(d * 0.58, 2.4, 4.2);
    const x0 = p.tur === 'civata' ? p.L * 0.42 : (p.L > 50 ? p.L * 0.3 : 1.2);
    const egim = p.tur === 'civata' ? d * 0.12 : d * 0.42;
    let dd = '';
    for (let x = x0; x < p.L - 1.2; x += adim) {
      const a = hw(x) - 0.45, b = hw(x + egim) - 0.45;
      if (a < 0.7 || b < 0.7) break;
      const [p0, p1] = T([[x, -a], [x + egim, b]]);
      dd += `M${f2(p0[0])} ${f2(p0[1])}L${f2(p1[0])} ${f2(p1[1])}`;
    }
    if (dd) s += `<path d="${dd}" fill="none" stroke="${dis}" stroke-opacity="${disOpak}" stroke-width="${f2(ic / S)}" stroke-linecap="round"/>`;
  }
  // parıltı: ışığa bakan kenarda kâğıt renginde kısa çizgi
  const n = don([0, -1], p.a), yan = n[0] * ISIK[0] + n[1] * ISIK[1] > 0 ? -1 : 1;
  if (parlak) s += A.ince(T([[p.L * 0.14, yan * d * 0.2], [p.L * (p.tur === 'civata' ? 0.38 : 0.62), yan * d * 0.22]]), parlak, { renk: PARLAK, tohum: tohum + 3, opak: 0.85 });
  // baş
  s += A.sekil(T(g.bas), br, px, { tohum: tohum + 5, genlik: 0.1, kayPx: 2 });
  if (p.tur === 'civata') {
    s += A.ince(T([[-g.hh + 0.7, -g.hd * 0.2], [-0.5, -g.hd * 0.2]]), 1.3, { tohum: tohum + 6, opak: 0.7 });
    s += A.ince(T([[-g.hh + 0.7, g.hd * 0.2], [-0.5, g.hd * 0.2]]), 1.3, { tohum: tohum + 7, opak: 0.7 });
    s += A.ince(T([[-g.hh + 1.2, yan * g.hd * 0.36], [-0.8, yan * g.hd * 0.36]]), 1.3, { renk: PARLAK, tohum: tohum + 8, opak: 0.8 });
  }
  if (g.yuz) {
    const { cx, rx, ry } = g.yuz;
    s += A.sekil(T(oval(cx, 0, rx, ry, 0, 360, 12, 2)), RENK.cinko[0], Math.max(1.4, px * 0.62), { tohum: tohum + 9, genlik: 0.08, kayPx: 0.6 });
    // yuva: yıldız (iki kol) ya da yarık (tek, kalın)
    const k = rx / ry, rr = ry * 0.6, fi = p.yuvaAci ?? 30;
    const kol = (a) => { const c = Math.cos(a * D2R), sn = Math.sin(a * D2R); return T([[cx - k * rr * c, -rr * sn], [cx + k * rr * c, rr * sn]]); };
    if (p.tur === 'yarik') s += A.ince(kol(fi), Math.max(1.6, px * 0.72), { tohum: tohum + 10, genlik: 0.05 });
    else { s += A.ince(kol(fi), Math.max(1.3, px * 0.55), { tohum: tohum + 10, genlik: 0.05 }) + A.ince(kol(fi + 90), Math.max(1.3, px * 0.55), { tohum: tohum + 11, genlik: 0.05 }); }
  }
  const sil = A.siluet(T(g.govde), p.gx ?? 1.3, p.gy ?? 1.9, tohum) + A.siluet(T(g.bas), p.gx ?? 1.3, p.gy ?? 1.9, tohum + 5);
  return { s, sil };
}
// Somun (yatık): altıgen yüz + kalınlık (bakış B'den, alt yan yüzler görünür) + pah dairesi + dişli delik
function somunCiz(A, p, { tohum = 1 } = {}) {
  const { x, y, R, a } = p, t = R * 0.62;
  const hex = Array.from({ length: 6 }, (_, i) => { const r = don([R * Math.cos(i * 60 * D2R), R * Math.sin(i * 60 * D2R)], a); return [x + r[0], y + r[1]]; });
  const alt = hex.map(([u, v]) => [u, v + t]);
  let s = A.sekil(sik(zarf([...hex, ...alt]), 1.4), RENK.somunYan, 2.6, { tohum, genlik: 0.1, kayPx: 2 });
  for (const v of hex) if (v[1] - y > -R * 0.45) s += A.ince([v, [v[0], v[1] + t]], 1.3, { tohum: tohum + v[0], opak: 0.75 });
  s += A.sekil(sik(hex, 1.4), p.renk, 2.6, { tohum: tohum + 1, genlik: 0.1, kayPx: 2 });
  s += A.ince(cember(x, y, R * 0.84, 18), 1.2, { tohum: tohum + 2, kapali: true, opak: 0.5 });
  s += A.sekil(cember(x, y, R * 0.46, 12), RENK.delik, 2, { tohum: tohum + 3, genlik: 0.06, kayPx: 0 });
  s += A.ince(yay(x, y + 0.4, R * 0.36, 200, 340, 6), 1.1, { tohum: tohum + 4, opak: 0.55 });
  s += A.ince(yay(x, y, R * 0.66, 200, 250, 5), 1.6, { renk: PARLAK, tohum: tohum + 5, opak: 0.9 });
  return { s, sil: A.siluet(sik(zarf([...hex, ...alt]), 2), 1.5, 2.2, tohum) };
}
// Pul: halka + ince kalınlık; yaylı pulda halka kesik, uçlar kayık
function pulCiz(A, p, { tohum = 1 } = {}) {
  const { x, y, R } = p, r = R * (p.yayli ? 0.6 : 0.48), t = R * 0.12;
  let s = '', sil;
  if (p.yayli) {
    const g0 = p.a + 8, g1 = p.a + 352, n = 18;
    const dis = oval(x, y, R, R, g0, g1, n, 2), ic = oval(x, y, r, r, g0, g1, n, 2).reverse();
    const halka = [...dis, ...ic];
    halka[0] = [halka[0][0], halka[0][1] - 0.5]; halka[halka.length - 1] = [halka.at(-1)[0], halka.at(-1)[1] - 0.5];
    s += A.sekil(halka.map(([u, v]) => [u, v + t]), RENK.pulYan, 2.2, { tohum, genlik: 0.08, kayPx: 2 });
    s += A.sekil(halka, p.renk, 2.4, { tohum: tohum + 1, genlik: 0.08, kayPx: 2 });
    sil = A.siluet(halka, 1.2, 1.7, tohum);
  } else {
    s += A.sekil(cember(x, y + t, R, 18), RENK.pulYan, 2.2, { tohum, genlik: 0.08, kayPx: 2 });
    s += A.sekil(cember(x, y, R, 18), p.renk, 2.4, { tohum: tohum + 1, genlik: 0.08, kayPx: 2 });
    s += A.sekil(cember(x, y, r, 12), RENK.delik, 1.8, { tohum: tohum + 2, genlik: 0.06, kayPx: 0 });
    sil = A.siluet(cember(x, y, R, 14), 1.2, 1.7, tohum);
  }
  s += A.ince(yay(x, y, (R + r) / 2, 196, 252, 5), 1.6, { renk: PARLAK, tohum: tohum + 3, opak: 0.9 });
  return { s, sil };
}

// ------------------------------------------------------------------------------------------------ yerleşim (tohumlu)
const KUTU = (b) => [OX + b[0] * U + 1.5, OY + b[1] * U + 1.5, OX + (b[0] + b[2]) * U - 1.5, OY + (b[1] + b[3]) * U - 1.5];
function parcalariKur() {
  const r = rng(860 + (DIKEY ? 1 : 0)), Ur = (a, b) => a + (b - a) * r();
  const turler = [];
  const ekle = (n, f) => { for (let i = 0; i < n; i++) turler.push(f(i)); };
  ekle(12, () => ({ tur: 'yildiz' })); ekle(10, () => ({ tur: 'havsa' })); ekle(4, () => ({ tur: 'yarik' }));
  ekle(6, () => ({ tur: 'civata' })); ekle(2, () => ({ tur: 'dubel' }));
  ekle(12, () => ({ tur: 'somun' })); ekle(9, () => ({ tur: 'pul' })); ekle(3, () => ({ tur: 'pul', yayli: true }));
  // karıştır (tohumlu)
  for (let i = turler.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [turler[i], turler[j]] = [turler[j], turler[i]]; }
  for (const p of turler) {
    if (p.tur === 'somun') { p.R = Ur(8, 11.5); p.renk = RENK.somun[Math.floor(r() * 3)]; }
    else if (p.tur === 'pul') { p.R = Ur(8, 12.5); p.renk = RENK.pul[Math.floor(r() * 3)]; }
    else if (p.tur === 'civata') { p.L = Ur(28, 54); p.d = Ur(6.8, 8); p.renk = r() < 0.5 ? RENK.siyah : RENK.celik; }
    else if (p.tur === 'dubel') { p.L = Ur(30, 36); p.d = 7.6; p.renk = RENK.plastik; }
    else {
      p.L = 24 + 46 * Math.pow(r(), 1.3); p.d = 5 + (p.L - 24) * 0.036;
      const c = r(); p.renk = c < 0.5 ? RENK.celik : c < 0.8 ? RENK.cinko : RENK.siyah;
      p.yuvaAci = Ur(0, 90);
    }
    p.a = Ur(0, 360);
    p.uzun = p.tur !== 'somun' && p.tur !== 'pul';
    p.rad = p.uzun ? (p.tur === 'civata' ? p.d * 0.9 : p.d * 1.02) : p.R;
  }
  // kapsül: uzun parçada eksen parçası, yuvarlakta nokta
  const kapsul = (p) => {
    if (!p.uzun) return [[p.x, p.y], [p.x, p.y], p.R];
    const t = don([1, 0], p.a), h = p.L / 2;
    return [[p.x - t[0] * h, p.y - t[1] * h], [p.x + t[0] * h, p.y + t[1] * h], p.rad];
  };
  const parcaUzak = (a0, a1, b0, b1) => {
    const d = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1]], l = ab[0] * ab[0] + ab[1] * ab[1]; const t = l ? sinir(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l, 0, 1) : 0; return Math.hypot(p[0] - a[0] - ab[0] * t, p[1] - a[1] - ab[1] * t); };
    return Math.min(d(a0, b0, b1), d(a1, b0, b1), d(b0, a0, a1), d(b1, a0, a1));
  };
  const kp = L.poset;
  const posetIci = (x, y) => { const [u, v] = don([x - kp.x, y - kp.y], -kp.a); return Math.abs(u) < 80 && Math.abs(v) < 56; };
  const dokulme = (x, y) => { const [u, v] = don([x - kp.x, y - kp.y], -kp.a); return u > 40 && u < 158 && Math.abs(v) < 38; };
  const temizMi = (c) => {
    for (const [x0, y0, x1, y1] of L.temiz) {
      const kx = sinir(c[0][0], x0, x1), ky = sinir(c[0][1], y0, y1), kx2 = sinir(c[1][0], x0, x1), ky2 = sinir(c[1][1], y0, y1);
      if (Math.hypot(c[0][0] - kx, c[0][1] - ky) < c[2] + 4 || Math.hypot(c[1][0] - kx2, c[1][1] - ky2) < c[2] + 4) return false;
      if (parcaUzak(c[0], c[1], [x0, y0], [x1, y0]) < c[2] || parcaUzak(c[0], c[1], [x0, y1], [x1, y1]) < c[2]) return false;
    }
    return true;
  };
  const yerlesen = [];
  for (const p of turler) {
    let iyi = null, iyiPuan = -1e9;
    for (let deneme = 0; deneme < 70; deneme++) {
      // yoğunluk önde (B'ye yakın): çekiş durunca içerik öne fırlayıp birikti; parçaların yarısı öndeki yığınlarda
      let x, y;
      if (r() < 0.5) { const c = L.yigin[Math.floor(r() * L.yigin.length)]; x = c[0] + (r() + r() - 1) * c[2]; y = c[1] + (r() + r() - 1) * c[3]; }
      else { x = Ur(14, 466); y = 16 + 270 * (1 - Math.pow(r(), 2.1)); }
      p.x = x; p.y = y;
      const c = kapsul(p);
      const ic = [c[0], c[1]].every(([u, v]) => u > c[2] * 0.6 && u < 480 - c[2] * 0.6 && v > c[2] * 0.6 && v < 300 - c[2] * 0.6);
      if (!ic || !temizMi(c)) continue;
      if ([c[0], c[1], [x, y]].some(([u, v]) => posetIci(u, v) || dokulme(u, v))) continue;
      let enYakin = 1e9;
      for (const q2 of yerlesen) { const cq = kapsul(q2); enYakin = Math.min(enYakin, parcaUzak(c[0], c[1], cq[0], cq[1]) - c[2] - cq[2]); }
      // önde (y > 220) üst üste binmeye izin: küçük yığınlar; geride ara bırak
      const izin = y > 205 ? -c[2] * 0.7 : y > 120 ? 1 : 4;
      const puan = enYakin - izin;
      if (puan > 0) { iyi = { x, y }; break; }
      if (puan > iyiPuan) { iyiPuan = puan; iyi = { x, y }; }
    }
    p.x = iyi.x; p.y = iyi.y;
    yerlesen.push(p);
  }
  // çizim sırası: yassılar önce (pul, somun), sonra vidalar; aynı sınıfta arkadan öne
  const sira = { pul: 0, somun: 1 };
  yerlesen.sort((a, b) => (sira[a.tur] ?? 2) - (sira[b.tur] ?? 2) || a.y - b.y);
  return yerlesen;
}
const PARCALAR = parcalariKur();
const KAHRAMAN = { tur: 'havsa', L: 112, d: 7.4, hd: 15.4, hh: 5.6, renk: ['#5f5a53', '#6f695f'], yuvaAci: 58, ...L.kahraman };

// Poşet içi ve dökülen vidalar (poşet yerel: u ağza doğru, v enine)
function posetParcalari() {
  const r = rng(712), Ur = (a, b) => a + (b - a) * r(), kp = L.poset;
  const w = (u, v) => { const t = don([u, v], kp.a); return [kp.x + t[0], kp.y + t[1]]; };
  const ic = [[-30, -14, 8], [-6, 12, 64], [12, -10, 120], [-34, 16, 150], [24, 14, 40]].map(([u, v, a], i) => {
    const [x, y] = w(u, v); const L2 = Ur(26, 36);
    return { tur: i % 2 ? 'havsa' : 'yildiz', L: L2, d: 4.8 + (L2 - 22) * 0.03, x, y, a: a + kp.a, renk: RENK.celik, yuvaAci: Ur(0, 90) };
  });
  // dökülenler: ağızdan yelpaze gibi, giderek uzaklaşan
  const dok = [[60, 4, 12], [84, -9, -24], [104, 13, 58], [130, -2, 8]].map(([u, v, a], i) => {
    const [x, y] = w(u, v); const L2 = Ur(28, 40);
    return { tur: i === 2 ? 'yarik' : 'yildiz', L: L2, d: 4.8 + (L2 - 22) * 0.03, x, y, a: a + kp.a, renk: i === 1 ? RENK.cinko : RENK.celik, yuvaAci: Ur(0, 90) };
  });
  return { ic, dok };
}
const POSET = posetParcalari();

// ------------------------------------------------------------------------------------------------ katmanlar
function cekmece(A) {
  const disR = [[-HS - TW, -HB - TW], [480 + HS + TW, -HB - TW], [480 + HS + TW, 300 + TW], [-HS - TW, 300 + TW]];
  const icR = [[-HS, -HB], [480 + HS, -HB], [480 + HS, 300], [-HS, 300]];
  let s = '';
  // iç yüzler (arka ışıklı, sol gölgede, sağ açık) ve zemin
  s += A.dolgu(sik([[-HS, -HB], [480 + HS, -HB], [480, 0], [0, 0]], 8), '#c9c3b8', { tohum: 11, kayPx: 0 });
  s += A.dolgu(sik([[-HS, -HB], [0, 0], [0, 300], [-HS, 300]], 8), '#b4ada0', { tohum: 12, kayPx: 0 });
  s += A.dolgu(sik([[480 + HS, -HB], [480 + HS, 300], [480, 300], [480, 0]], 8), '#d6d0c5', { tohum: 13, kayPx: 0 });
  s += A.dolgu(sik([[0, 0], [480, 0], [480, 300], [0, 300]], 8), '#e7e2d9', { tohum: 14, kayPx: 0 });
  // duvarların zemine düşen gölgesi (ışık sol üstten): arka ve sol şerit
  s += `<g fill="${M}" opacity="0.075">${A.dolgu(sik([[0, 0], [480, 0], [472, 10], [9, 10], [9, 300], [0, 300]], 6), M, { tohum: 15, kayPx: 0, genlik: 0.6 })}</g>`;
  s += A.ince(sik([[0, 300], [0, 0], [480, 0], [480, 300]], 8, false), 2.6, { tohum: 16, genlik: 0.3, opak: 0.8 });
  s += A.ince([[-HS, -HB], [0, 0]], 2.2, { tohum: 17, opak: 0.7 }) + A.ince([[480 + HS, -HB], [480, 0]], 2.2, { tohum: 18, opak: 0.7 });
  return s;
}
// Duvar üstleri (çerçeve) en üstte değil: parçalar duvarın altına giremez ama organizer hattı duvarın üstüne biner
function duvarlar(A) {
  const disR = dikd(-HS - TW, -HB - TW, 480 + HS + TW, 300 + TW, 3, 8), icR = sik([[-HS, -HB], [480 + HS, -HB], [480 + HS, 300], [-HS, 300]], 8);
  const k = A.kay, kal = A.kal(21, 0.7), kal2 = A.kal(22, 0.6);
  const d1 = yol(disR, true, kal), d2 = yol(icR, true, kal2);
  let s = `<path d="${d1} ${d2}" fill="#a59e91" fill-rule="evenodd" transform="translate(${k} ${k})"/>`;
  // ahşap lifi: duvar üstlerinde birkaç uzun ince çizgi
  s += A.ince([[-HS - TW + 4, -HB - 6], [180, -HB - 7.5], [480 + HS + TW - 6, -HB - 5.5]], 1.2, { tohum: 23, opak: 0.35, genlik: 0.5 });
  s += A.ince([[-HS - 6, -HB + 30], [-HS - 5, 160], [-HS - 6.5, 296]], 1.2, { tohum: 24, opak: 0.35, genlik: 0.5 });
  s += A.ince([[480 + HS + 5, -HB + 20], [480 + HS + 6.5, 150], [480 + HS + 5, 290]], 1.2, { tohum: 25, opak: 0.35, genlik: 0.5 });
  s += murekkep(d1, 6, M, 26) + murekkep(d2, 3.6, M, 27);
  return s;
}
function panel(A) {
  const P = PANEL;
  let s = '';
  // ön yüz (B'ye bakan, koyu) ve kulp
  s += A.sekil(sik([[P.x0, P.y1 - 1], [P.x1, P.y1 - 1], [P.x1 - 3, P.yuz], [P.x0 + 3, P.yuz]], 8), '#6f695f', 6, { tohum: 31, genlik: 0.6 });
  s += A.sekil(dikd(198, P.yuz - 3, 282, P.yuz + 9, 5, 5), '#4f4b45', 4.2, { tohum: 32 });
  s += A.ince([[203, P.yuz + 1.5], [277, P.yuz + 1.5]], 1.8, { renk: PARLAK, tohum: 33, opak: 0.55 });
  return s;
}
function panelUst(A) {
  const P = PANEL;
  let s = A.sekil(dikd(P.x0, P.y0, P.x1, P.y1, 3, 8), '#8d867a', 6, { tohum: 34, genlik: 0.6 });
  s += A.ince([[P.x0 + 8, P.y0 + 6], [P.x1 - 40, P.y0 + 5.2]], 1.3, { tohum: 35, opak: 0.35, genlik: 0.6 });
  s += A.ince([[P.x0 + 30, P.y0 + 14], [P.x1 - 8, P.y0 + 15]], 1.3, { tohum: 36, opak: 0.3, genlik: 0.6 });
  s += A.ince([[P.x0 + 6, P.y0 + 2.6], [P.x1 - 6, P.y0 + 2.6]], 1.8, { renk: PARLAK, tohum: 37, opak: 0.4, genlik: 0.3 });
  return s;
}
// Şeffaf poşet: devrik, ağzı açık (zip çizgisi), içindekiler plastiğin ardından soluk görünür
function poset(A) {
  const kp = L.poset, w = (pts) => yer(pts, kp.x, kp.y, kp.a);
  let ic = '', sil = '';
  POSET.ic.forEach((p, i) => { const v = vidaCiz(A, p, { px: 2.2, tohum: 900 + i * 13, parlak: 0 }); ic += v.s; });
  // gövde: hafif buruşuk kenar (dalgalı), ağız sağda biraz açık
  const govde = [];
  for (let i = 0; i <= 14; i++) govde.push([-62 + i * 8.6, -42 + Math.sin(i * 1.7) * 1.4]);
  govde.push([62, -36], [66, -18], [68, 0], [66, 18], [62, 36]);
  for (let i = 14; i >= 0; i--) govde.push([-62 + i * 8.6, 42 + Math.sin(i * 2.3) * 1.4]);
  govde.push([-66, 30], [-67, 0], [-66, -30]);
  sil += A.siluet(w(govde), 1.6, 2.4, 951);
  let s = ic;
  s += A.sekil(w(govde), '#f6f4ef', 2.8, { tohum: 951, genlik: 0.5, kayPx: 2, opak: 0.58 });
  // dikiş (kapalı uç) ve zip (ağıza yakın iki çizgi + kızak)
  s += A.ince(w([[-58, -38], [-59, 0], [-58, 38]]), 1.4, { tohum: 952, opak: 0.5 });
  s += A.ince(w([[50, -40], [51.5, 0], [50, 40]]), 2.2, { tohum: 953, opak: 0.75 });
  s += A.ince(w([[54.5, -39], [56, 0], [54.5, 39]]), 1.4, { tohum: 954, opak: 0.55 });
  s += A.sekil(w(dikd(46, -46, 58, -36, 2, 2)), '#d4cec4', 2, { tohum: 955, genlik: 0.15, kayPx: 0.8 });
  // ağız: iki katman ayrık, iç karanlık
  s += A.sekil(w(oval(64, 0, 6, 26, 0, 360, 14, 2)), '#d9d3c8', 2.2, { tohum: 956, genlik: 0.2, kayPx: 0.8 });
  // plastik parıltısı ve kırışıklar
  s += A.ince(w([[-48, -30], [-20, -33], [8, -31]]), 2.4, { renk: PARLAK, tohum: 957, opak: 0.95, genlik: 0.4 });
  s += A.ince(w([[-44, -24], [-30, -25.5]]), 1.6, { renk: PARLAK, tohum: 958, opak: 0.9 });
  s += A.ince(w([[18, 30], [36, 26], [44, 18]]), 2, { renk: PARLAK, tohum: 959, opak: 0.9 });
  s += A.ince(w([[-30, 8], [-12, 20], [2, 24]]), 1.2, { tohum: 960, opak: 0.28, genlik: 0.5 });
  s += A.ince(w([[10, -22], [24, -8], [30, 6]]), 1.2, { tohum: 961, opak: 0.28, genlik: 0.5 });
  return { s, sil };
}
// Organizer hattı (B'nin aklındaki): bölmeler kesik çizgi, %60
function organizer(A) {
  let s = '';
  const kesik = [10, 7];
  for (const b of L.kutular) {
    const [x0, y0, x1, y1] = KUTU(b);
    s += A.ince(dikd(x0, y0, x1, y1, 4.5, 5), 2.6, { tohum: 300 + b[0] * 17 + b[1] * 5, genlik: 0.35, kapali: true, kesik });
  }
  // kısa bölmenin ve sığmayan köşenin komşuları da kesikli (yalnız kendileri vurgu)
  return `<g opacity="0.6">${s}</g>`;
}
// İstek işaretleri (vurgu): kısa bölme ve uymayan köşe düz çizgi; çarpma tikleri; tarama; titreme; ölçü okları
function isaretler(A) {
  let s = '';
  const [kx0, ky0, kx1, ky1] = KUTU(L.kisa);
  s += A.cizgi(dikd(kx0, ky0, kx1, ky1, 4.5, 4), 3.6, { kapali: true, renk: V, tohum: 401, genlik: 0.35, golge: false });
  // uzun vidanın kutu kenarını kestiği yerler: dışa doğru üç kısa tik
  const t = don([1, 0], KAHRAMAN.a), n = [-t[1], t[0]];
  const kes = [];
  for (const yon of [-1, 1]) {
    // eksen boyunca kutunun kenarına kadar
    let lo = 0, hi = 70;
    const ic = (u) => { const x = KAHRAMAN.x + t[0] * u * yon, y = KAHRAMAN.y + t[1] * u * yon; return x > kx0 && x < kx1 && y > ky0 && y < ky1; };
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (ic(m)) lo = m; else hi = m; }
    kes.push([KAHRAMAN.x + t[0] * lo * yon, KAHRAMAN.y + t[1] * lo * yon, yon]);
  }
  // her kesişimde vidanın iki yanında, dışa ve yana açılan ikişer kısa tik ("takıldı" işareti)
  kes.forEach(([x, y, yon], i) => {
    const disa = [t[0] * yon, t[1] * yon];
    for (const yan of [-1, 1]) {
      for (const [aci, bas, l] of [[35, 8, 7], [75, 9, 6]]) {
        const dir = don(disa, aci * yan * (yon > 0 ? 1 : -1));
        const o = [x + dir[0] * bas, y + dir[1] * bas];
        s += A.cizgi([o, [o[0] + dir[0] * l, o[1] + dir[1] * l]], 2.8, { renk: V, tohum: 410 + i * 9 + aci + yan, genlik: 0.15, uc: 0.5, ucBoy: 4 });
      }
    }
  });
  void n;
  // sığmayan köşe: bölmenin duvara binen kısmı taralı, kenarı düz vurgu, yanında titreme çizgileri
  const [bx0, by0, bx1, by1] = KUTU(L.kotu);
  const tasma = [[480, by0], [bx1, by0], [bx1, by1], [480, by1]];
  const id = `kotu-${A.K}`;
  let tar = '';
  for (let u = -60; u < 120; u += 3.4) tar += `M${f2(480 + u)} ${f2(by0 - 4)}L${f2(480 + u + 100)} ${f2(by0 + 96)}`;
  s += `<clipPath id="${id}"><path d="${yol(sik(tasma, 3), true, { sap: () => 0 })}"/></clipPath>`;
  s += `<g clip-path="url(#${id})"><path d="${tar}" stroke="${V}" stroke-width="${f2(1.9 / S)}" fill="none" stroke-linecap="round" opacity="0.85"/></g>`;
  // bölmenin çekmece içindeki kısmı öbürleri gibi kesikli; duvara binen kısmı düz vurgu (yalnız taşan köşe işaretli)
  s += `<g opacity="0.6">${A.ince(dikd(bx0, by0, bx1, by1, 4.5, 5), 2.6, { tohum: 431, genlik: 0.35, kapali: true, kesik: [10, 7] })}</g>`;
  s += A.cizgi(sik([[476, by0], [bx1 - 4.5, by0], [bx1, by0 + 4.5], [bx1, by1 - 4.5], [bx1 - 4.5, by1], [476, by1]], 3, false), 3.6, { renk: V, tohum: 432, genlik: 0.3, uc: 0.55, ucBoy: 8 });
  for (let i = 0; i < 3; i++) {
    const x = bx1 + 4.5 + i * 4.2, y0 = by1 - 30 + i * 3, y1 = by1 - 8 - i * 3;
    s += A.cizgi([[x, y0], [x + 0.6, (y0 + y1) / 2], [x, y1]], 2.6, { renk: V, tohum: 440 + i, genlik: 0.25, uc: 0.45, ucBoy: 5 });
  }
  // ölçü: uzatma çizgileri + ölçü çizgisi + ok uçları
  const okUcu = (p, dir) => { const a = don(dir, 28), b = don(dir, -28); return [[p[0] - a[0] * 7, p[1] - a[1] * 7], p, [p[0] - b[0] * 7, p[1] - b[1] * 7]]; };
  if (L.olcu === 'sag') {
    const xd = 529, xe0 = kx1 + 3, xe1 = xd + 6;
    s += A.cizgi([[xe0, ky0], [xe1, ky0]], 2.2, { renk: V, tohum: 451, genlik: 0.2, uc: 0.6, ucBoy: 6 });
    s += A.cizgi([[xe0, ky1], [xe1, ky1]], 2.2, { renk: V, tohum: 452, genlik: 0.2, uc: 0.6, ucBoy: 6 });
    s += A.cizgi([[xd, ky0 + 1], [xd + 0.5, (ky0 + ky1) / 2], [xd, ky1 - 1]], 3.4, { renk: V, tohum: 453, genlik: 0.25, uc: 0.8, ucBoy: 8 });
    s += A.cizgi(okUcu([xd, ky0 + 1], [0, -1]), 3.4, { renk: V, tohum: 454, genlik: 0.12, uc: 0.6, ucBoy: 5 });
    s += A.cizgi(okUcu([xd, ky1 - 1], [0, 1]), 3.4, { renk: V, tohum: 455, genlik: 0.12, uc: 0.6, ucBoy: 5 });
  } else {
    const yd = -HB - TW - 26, ye0 = ky0 - 4, ye1 = yd - 6;
    s += A.cizgi([[kx0, ye0], [kx0, ye1]], 2.2, { renk: V, tohum: 451, genlik: 0.2, uc: 0.6, ucBoy: 6 });
    s += A.cizgi([[kx1, ye0], [kx1, ye1]], 2.2, { renk: V, tohum: 452, genlik: 0.2, uc: 0.6, ucBoy: 6 });
    s += A.cizgi([[kx0 + 1, yd], [(kx0 + kx1) / 2, yd - 0.5], [kx1 - 1, yd]], 3.4, { renk: V, tohum: 453, genlik: 0.25, uc: 0.8, ucBoy: 8 });
    s += A.cizgi(okUcu([kx0 + 1, yd], [-1, 0]), 3.4, { renk: V, tohum: 454, genlik: 0.12, uc: 0.6, ucBoy: 5 });
    s += A.cizgi(okUcu([kx1 - 1, yd], [1, 0]), 3.4, { renk: V, tohum: 455, genlik: 0.12, uc: 0.6, ucBoy: 5 });
  }
  return s;
}

// ------------------------------------------------------------------------------------------------ eller (kol.js)
// elUstten px biriminde (ölçeksiz grup) çizilir. Çıktı '<!--A-->' işaretinden ikiye bölünür: önce başparmak + el sırtı
// (panelin üst bandının altında), sonra parmaklar + yen (bandın üstünde). Konturlar sc1 mürekkebine çevrilir.
const AYIR = '<!--ARAYA-->';
const EL_TEN = MONO.ten[1], EL_GIYSI = MONO.giysi[0];
function eller(K) {
  const E = L.el, cik = [];
  for (const [taraf, nokta, aci, tohum] of [['sol', E.sol, E.aciSol, 3], ['sag', E.sag, E.aciSag, 4]]) {
    const merkez = [(nokta[0] - ORT[0]) * S, (nokta[1] - ORT[1]) * S];
    const str = elUstten({
      merkez, aci, boy: E.boy, ten: EL_TEN, giysi: EL_GIYSI, taraf, kaynama: K, tohum,
      kolUzun: 900, kalinlik: E.boy * 0.42, kolBoyu: 'sivali', manset: 'duz', araya: AYIR, w: 4.2, kay: [2.5, 2.5],
    });
    const [alt, ust] = str.split(AYIR);
    // elin yerel çerçevesi (kol.js elUstten ile aynı kurgu): bilek = merkez − 0.6·boy·yön; y başparmak yanı
    const c = Math.cos(aci * D2R), sn = Math.sin(aci * D2R), bs = taraf === 'sag' ? -1 : 1, b = E.boy;
    const bilek = [merkez[0] - 0.6 * b * c, merkez[1] - 0.6 * b * sn];
    const yerel = ([X, Y]) => { const dx = X - bilek[0], dy = Y - bilek[1]; return [(dx * c + dy * sn) / b, (-dx * sn + dy * c) / (b * bs)]; };
    const dunya = ([x, y]) => { const X = x * b, Yy = y * b * bs; return [bilek[0] + X * c - Yy * sn, bilek[1] + X * sn + Yy * c]; };
    cik.push({ alt, ust, yerel, dunya, id: `${taraf}${K}` });
  }
  return cik;
}
const XS = new XMLSerializer();
const NOKTA = /-?\d*\.?\d+(?:e-?\d+)?/g;
// Konturları mürekkep şekline çevirir (px = çizgi kalınlığı × oran; el yakın plan olduğu için en kalın kontur elde).
// Ten ve giysi dolgularına biçim gölgesi (sc1 yüzündeki gibi: ışık sol üstten, sağ-alt kenarda koyu hilal).
// El sırtının bilek çizgisi kesilir (kol.js sırt konturu bileği enine kapatıyor; tepeden eldiven ağzı gibi okunuyordu).
let klipNo = 0;
function elMurekkeple(str, tohum, el, { bilekKes = false } = {}) {
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${str}</svg>`, 'image/svg+xml');
  let i = 0, out = '';
  const k = STIL.kaymaPx;
  const golgeRenk = (r) => (r === EL_TEN ? '#aaa59c' : r === EL_GIYSI ? '#c4beb2' : null);
  // bileğe kadar inen (kol değil) parça: sırt dolgusu ve konturu; bilek çizgisi ve gölge hilali kesilir, alttaki önkol görünür
  const bilekte = (d) => {
    if (!bilekKes) return false;
    const v = (d.match(NOKTA) || []).map(Number);
    let enAz = 1e9;
    for (let j = 0; j + 1 < v.length; j += 2) enAz = Math.min(enAz, el.yerel([v[j], v[j + 1]])[0]);
    return enAz > -0.17 && enAz < -0.08;
  };
  // yalnız bilek çizgisinin orta kısmı kesilir (yanlar kalır: sırt konturu önkol konturuna akar)
  const kes = (icerik) => {
    const id = `bk${++klipNo}`, yz = (pts) => `M${pts.map(el.dunya).map((p) => `${f2(p[0])} ${f2(p[1])}`).join('L')}Z`;
    const d = yz([[-3, -3], [4, -3], [4, 3], [-3, 3]]) + yz([[-0.21, -0.112], [-0.066, -0.112], [-0.066, 0.112], [-0.21, 0.112]]);
    return `<clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath><g clip-path="url(#${id})">${icerik}</g>`;
  };
  for (const e of doc.documentElement.children) {
    i++;
    if (e.tagName !== 'path') { out += XS.serializeToString(e).replace(/ xmlns="[^"]*"/g, ''); continue; }
    const st = e.getAttribute('stroke'), fill = e.getAttribute('fill'), sw = +e.getAttribute('stroke-width') || 0, d = e.getAttribute('d');
    let parca = '';
    if (fill === 'none' && st && sw) {
      const px = sw >= 3 ? sw * 1.48 : sw * 1.4;
      parca = murekkep(d, px, st, tohum * 31 + i, { s: 1, golge: true });
    } else if (fill && fill !== 'none') {
      const g = golgeRenk(fill);
      if (g) {
        const id = `eg${++klipNo}`;
        parca = `<clipPath id="${id}"><path d="${d}" transform="translate(${k} ${k})"/></clipPath><g clip-path="url(#${id})">`
          + `<path d="${d}" fill="${g}" transform="translate(${k} ${k})"/><path d="${d}" fill="${fill}" transform="translate(${k - 6} ${k - 5})"/></g>`;
      } else parca = `<path d="${d}" fill="${fill}" transform="translate(${k} ${k})"/>`;
    }
    out += bilekte(d) ? kes(parca) : parca;
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ yazı (el yazısı, Caveat 600)
// Kaynama: harf başına küçük açı ve taban kayması (4 çizim)
function elYazisi(metin, { x, y, boyut, aci = 0, renk = M, sonRenk, K, tohum = 1, anchor = 'start' }) {
  const R = rng(tohum * 53 + K * 977), harf = [...metin];
  const govde = sonRenk ? harf.slice(0, -1) : harf, son = sonRenk ? harf.at(-1) : null;
  const rot = (n) => Array.from({ length: n }, () => f2((R() - 0.5) * 3.2)).join(' ');
  const dy = (n) => { let onc = 0; return Array.from({ length: n }, () => { const v = (R() - 0.5) * 2.2; const d = v - onc; onc = v; return f2(d); }).join(' '); };
  const j = [f2((R() - 0.5) * 1.2), f2((R() - 0.5) * 1.2)];
  let t = `<text x="${f2(x + j[0])}" y="${f2(y + j[1])}" transform="rotate(${aci} ${f2(x)} ${f2(y)})" font-family="Caveat, cursive" font-weight="600" font-size="${boyut}" fill="${renk}" text-anchor="${anchor}">`;
  t += `<tspan rotate="${rot(govde.length)}" dy="${dy(govde.length)}">${govde.join('')}</tspan>`;
  if (son) t += `<tspan fill="${sonRenk}" dx="${f2(boyut * 0.03)}" rotate="${rot(1)}">${son}</tspan>`;
  return t + '</text>';
}

// ------------------------------------------------------------------------------------------------ bir kaynama çizimi
function kare(K) {
  const A = araclar(K);
  A.K = K;
  let golge = '', govde = '';
  // dağınık parçalar
  PARCALAR.forEach((p, i) => {
    const r = rng(i * 131 + K * 7 + 5), jx = (r() - 0.5) * 0.9, jy = (r() - 0.5) * 0.9, ja = (r() - 0.5) * 1.6; // parça başına kaynama (≈1 px)
    const q2 = { ...p, x: p.x + jx, y: p.y + jy, a: p.a + ja };
    const c = p.tur === 'somun' ? somunCiz(A, q2, { tohum: 100 + i * 7 }) : p.tur === 'pul' ? pulCiz(A, q2, { tohum: 100 + i * 7 }) : vidaCiz(A, q2, { tohum: 100 + i * 7 });
    golge += c.sil; govde += c.s;
  });
  // dökülen vidalar (poşetin önünde, zeminde)
  let dokul = '';
  POSET.dok.forEach((p, i) => { const c = vidaCiz(A, p, { tohum: 980 + i * 11 }); golge += c.sil; dokul += c.s; });
  const ps = poset(A);
  golge += ps.sil;
  // kahraman vida: koyu, kalın kontur, açık diş çizgileri
  const kv = vidaCiz(A, KAHRAMAN, { px: 4, ic: 1.7, tohum: 777, dis: '#c2bcb1', disOpak: 0.8, parlak: 2.4 });
  golge += kv.sil.replace(/translate\([^)]*\)/g, 'translate(2.4 3.4)');

  // el katmanları
  const EL = eller(K);
  const elAlt = EL.map((e, i) => elMurekkeple(e.alt, 70 + i * 13 + K, e, { bilekKes: true })).join('');
  const elUst = EL.map((e, i) => elMurekkeple(e.ust, 90 + i * 13 + K, e)).join('');
  const elSil = EL.map((e) => e.alt + e.ust).join('');

  // çekmecenin kâğıda düşen gölgesi (çekmece havada: büyük ofset)
  const P = PANEL;
  const cekGolge = A.siluet([...dikd(-HS - TW, -HB - TW, 480 + HS + TW, 300 + TW, 3, 10), ...[]], 9, 12, 5) + A.siluet(dikd(P.x0, P.y0, P.x1, P.yuz + 9, 3, 10), 9, 12, 6);

  let s = '';
  s += `<g transform="${DUNYA_TR}">`;
  s += `<g fill="${M}" opacity="0.05" transform="translate(12 16)">${cekGolge}</g><g fill="${M}" opacity="0.09">${cekGolge}</g>`;
  s += cekmece(A);
  s += `<g fill="${M}" opacity="0.15">${golge}</g>`;
  s += govde + dokul + ps.s + kv.s;
  s += duvarlar(A);
  if (!HAM) s += organizer(A) + isaretler(A);
  s += panel(A);
  s += `</g>`;
  // el gölgesi (eller çekmeceden yüksekte: büyük ofset), sonra el altı, panel bandı, el üstü
  s += `<g transform="${EL_TR}"><g class="siluet" opacity="0.15" transform="translate(13 17)">${elSil}</g>${elAlt}</g>`;
  s += `<g transform="${DUNYA_TR}">${panelUst(A)}</g>`;
  s += `<g transform="${EL_TR}">${elUst}</g>`;
  if (!HAM) s += yazilar(K);
  return s;
}

// Yazılar: "84 mm?" ölçünün yanında (vurgu), "Sığar mı?" negatif alanda (mürekkep, "?" vurgu)
const METIN = DIL === 'en' ? { soru: 'Will it fit?' } : { soru: 'Sığar mı?' };
let OLCU_YER = null, BASLIK_YER = null;
function yazilarHesapla() {
  const olc = document.createElement('canvas').getContext('2d');
  const gen = (m, b) => { olc.font = `600 ${b}px Caveat`; return olc.measureText(m).width; };
  const [kx0, ky0, kx1, ky1] = KUTU(L.kisa);
  if (L.olcu === 'sag') {
    const p = ekran([541, (ky0 + ky1) / 2]);
    OLCU_YER = { x: p[0], y: p[1] + L.etiket.boyut * 0.3, boyut: L.etiket.boyut, anchor: 'start', aci: L.th - 3 };
  } else {
    const p = ekran([(kx0 + kx1) / 2, -HB - TW - 37]);
    OLCU_YER = { x: p[0], y: p[1], boyut: L.etiket.boyut, anchor: 'middle', aci: L.th - 3 };
  }
  // başlık: sütuna sığsın (EN daha uzun)
  const B = L.baslik;
  const sinirGen = DIKEY ? W - 150 : W - (B.x ?? OLCU_YER.x) - 70;
  const boyut = Math.min(B.boyut, Math.floor(B.boyut * sinirGen / gen(METIN.soru, B.boyut)));
  BASLIK_YER = { x: B.x ?? OLCU_YER.x - 8, y: B.y, boyut, anchor: B.orta ? 'middle' : 'start', aci: B.aci };
}
function yazilar(K) {
  let s = elYazisi('84 mm?', { ...OLCU_YER, renk: V, K, tohum: 5 });
  s += elYazisi(METIN.soru, { ...BASLIK_YER, renk: M, sonRenk: V, K, tohum: 9 });
  return s;
}

// ------------------------------------------------------------------------------------------------ sahne
const sahne = document.getElementById('sahne'), hataEl = document.getElementById('hata');
Object.assign(sahne.style, { width: W + 'px', height: H + 'px' });
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir); sigdir();
const NS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(NS, 'svg');
svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
svg.classList.add('cizim');
svg.innerHTML = `<defs><filter id="puruz" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
  <g filter="url(#puruz)"><g class="icerik"></g></g>`;
sahne.prepend(svg);
if (q.get('kagit') !== '0') kagitKur(sahne);
const icerik = svg.querySelector('.icerik');

try {
  await document.fonts.load('600 120px Caveat', 'Sığar mı? Will it fit? 84 mm');
  await document.fonts.ready;
} catch (e) { console.warn(e); }

let CIZIMLER = [];
try {
  yazilarHesapla();
  CIZIMLER = [0, 1, 2, 3].map((K) => kare(K));
} catch (e) { hataEl.textContent = e.stack; console.error(e); }
let son = -1;
const ciz = (i) => { if (i !== son && CIZIMLER[i]) { icerik.innerHTML = CIZIMLER[i]; son = i; } };
ciz(0);
window.tanitim = { kare: (t) => ciz(kaynaIndis(t)), sure: () => 2 };
window.tanitimHazir = true;
if (!CEKIM) {
  if (q.get('t') !== null) window.tanitim.kare(+q.get('t'));
  else { const t0 = performance.now(); const dongu = () => { window.tanitim.kare((performance.now() - t0) / 1000); requestAnimationFrame(dongu); }; requestAnimationFrame(dongu); }
}
