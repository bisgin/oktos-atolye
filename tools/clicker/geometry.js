// Fidget Clicker katıları (mm, Z yukarı). İki ürün:
//   anahtarlik: figür gövde (kedi, kalp, yıldız, kutu) içine Cherry MX uyumlu klavye anahtarı takılır; üstte basılan
//               kapak anahtarın sapına oturur; yanda halka kulağı. Önizlemede anahtar yarı saydam (ghost, dışa aktarılmaz).
//   tus:        MX uyumlu tuş başlığı (1u–2,25u), üstünde kabarık motif (kedi, kalp, yıldız, harf, ok).
// MX ölçüleri (ai03 wiki, Deskthority; baskı payı +0,1 mm): plaka yuvası 14 × 14, plaka 1,5; tuş başlığı yuvası artı
// 4,1 × 1,17. Plaka altındaki anahtar gövdesi için resmî ölçü bulunamadı: boşluk cömert (9 mm), atölye deneme baskısıyla
// doğrular.
import * as C from '../../core/csg.js';
import { loadFont, textPolys } from '../../core/font3d.js';

export const MX = {
  yuva: 14.1, plaka: 1.5, alt: 9, taban: 2, // gövde: taban + plaka altı boşluk + plaka
  ustGovde: 15.6, ustH: 6.6, sapUst: 11.6,   // anahtarın plaka üstü (gövde ve sapın tepesi, plakadan)
  arti: 4.2, kol: 1.3, sapR: 2.8, yol: 4,    // artı yuva (4,1 / 1,17 + pay), sap kılıfı, basma yolu
};
let yazi = null;
export async function hazirla() { yazi ||= await loadFont(700); }

const daire = (r, cx = 0, cy = 0, n = 64) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)]);
const kalp = (k) => Array.from({ length: 72 }, (_, i) => {
  const t = (i / 72) * Math.PI * 2;
  return [-16 * Math.sin(t) ** 3 * k, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * k];
});
const yildiz = (R, r) => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });

// Figür silüeti (XY, ortası orijinde, eni ~S): çokgen listesi; kedi = baş + iki kulak (birleşimi 3B'de alınır)
function silüet(sekil, S) {
  if (sekil === 'kalp') return [kalp(S / 34)];
  if (sekil === 'yildiz') return [yildiz(S / 2, S / 4.4)];
  if (sekil === 'kutu') return null;
  const r = S / 2;
  return [daire(r, 0, -r * 0.08), [[-r * 0.95, r * 0.2], [-r * 0.15, r * 0.62], [-r * 0.78, r * 1.08]], [[r * 0.95, r * 0.2], [r * 0.78, r * 1.08], [r * 0.15, r * 0.62]]];
}
// Silüeti h yüksekliğinde (z0'dan) katıya çevirir; iç: içe kayma (kapak gövdeden 1,2 mm küçük)
function katiSil(s, h, z0 = 0, ic = 0) {
  if (s.sekil === 'kutu') return C.extrude(C.rrect(s.boy - 2 * ic, s.boy - 2 * ic, Math.max(1, 5 - ic)), h, z0);
  const parcalar = silüet(s.sekil, s.boy).map((p) => C.poly2(yonlu(p)));
  const kes = ic ? parcalar.map((k) => C.offset2(k, -ic)) : parcalar;
  return C.union(kes.map((k) => C.extrude(k, h, z0)));
}
// Çokgeni saat yönünün tersine çevirir (Positive dolgu boş kalmasın)
function yonlu(p) {
  let a = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]);
  return a > 0 ? p : [...p].reverse();
}

// ---- anahtarlık clicker ----
function anahtarlikParcalari(s) {
  const hb = MX.taban + MX.alt + MX.plaka, zh = hb - MX.plaka + MX.ustH, zs = hb - MX.plaka + MX.sapUst;
  // Kapak eteği gövdeden basma yolu + 0,4 mm yukarıda (basınca gövdeye değmez); boşluğun tavanı anahtarın üst gövdesinden
  // yol + 0,2 mm yukarıda (basınca çarpmaz); sap kılıfı tavandan sapın tepesine 3,8 mm kalana iner
  const zb = hb + MX.yol + 0.4, zc = zh + MX.yol + 0.2, tavan = 2.4;
  const kulakX = -(s.sekil === 'kutu' ? s.boy / 2 : s.boy * 0.52) - 4;
  const out = [];
  out.push({ ad: 'govde', renk: 'govde', fn: () => {
    const g = C.union([katiSil(s, hb), C.cyl(5, 6.5, 6.5, 40, kulakX, 0, 0)]);
    return C.subAll(g, [
      C.box(MX.yuva + 0.6, MX.yuva + 0.6, MX.alt, -(MX.yuva + 0.6) / 2, -(MX.yuva + 0.6) / 2, MX.taban), // plaka altı boşluk
      C.box(MX.yuva, MX.yuva, MX.plaka + 2, -MX.yuva / 2, -MX.yuva / 2, hb - MX.plaka - 0.01),       // plaka yuvası
      C.cyl(7, 3, 3, 32, kulakX - 1, 0, -1),                                                          // halka deliği
    ]);
  } });
  out.push({ ad: 'kapak', renk: 'color', fn: () => {
    const dis = katiSil(s, zc + tavan - zb, zb, 1.2);
    const bosluk = C.box(MX.ustGovde + 1, MX.ustGovde + 1, zc - zb + 0.01, -(MX.ustGovde + 1) / 2, -(MX.ustGovde + 1) / 2, zb - 0.01);
    const sapAlt = zs - 3.8, kilif = C.cyl(zc - sapAlt + 0.01, MX.sapR, MX.sapR, 32, 0, 0, sapAlt);
    const arti = C.union([C.box(MX.arti, MX.kol, 3.81, -MX.arti / 2, -MX.kol / 2, sapAlt - 0.01), C.box(MX.kol, MX.arti, 3.81, -MX.kol / 2, -MX.arti / 2, sapAlt - 0.01)]);
    let k = C.union([C.sub(dis, bosluk), C.sub(kilif, arti)]);
    if (s.sekil === 'kutu' && s.metin.trim()) { // kapağın üstünde kabarık yazı
      const t = textPolys(yazi, s.metin.trim(), Math.min(s.boy * 0.3, (s.boy - 8) / Math.max(1, s.metin.trim().length * 0.62)), { spacing: 0.4 });
      const ox = t.width / 2;
      k = C.union([k, C.move(C.extrude(C.polys2(t.polys.map((p) => p.map(([x, y]) => [x - ox, y]))), 1.2), 0, -t.cap / 2, zc + tavan)]);
    }
    return k;
  } });
  if (s.sekil === 'kedi') out.push({ ad: 'yuz', renk: 'govde', fn: () => C.union([ // kapakta gözler ve burun
    ...[-1, 1].map((sx) => C.cyl(1.2, s.boy * 0.06, s.boy * 0.06, 24, sx * s.boy * 0.17, s.boy * 0.02, zc + tavan - 0.2)),
    C.cyl(1.2, s.boy * 0.04, s.boy * 0.04, 20, 0, -s.boy * 0.12, zc + tavan - 0.2),
  ]) });
  // Önizlemede anahtar (yarı saydam): plaka altı gövde, plaka üstü gövde, sap
  out.push({ ad: 'anahtar', renk: 'anahtar', ghost: true, fn: () => C.union([
    C.box(13.9, 13.9, 5, -6.95, -6.95, hb - MX.plaka - 5),
    C.box(MX.ustGovde, MX.ustGovde, MX.ustH, -MX.ustGovde / 2, -MX.ustGovde / 2, hb - MX.plaka),
    C.box(4, 4, zs - zh, -2, -2, zh),
  ]) });
  return out;
}

// ---- tuş başlığı ----
function motifKesit(s, en, boy) {
  const m = s.motif, k = Math.min(en, boy);
  if (m === 'kalp') return [C.poly2(yonlu(kalp(k / 46)))];
  if (m === 'yildiz') return [C.poly2(yonlu(yildiz(k * 0.38, k * 0.16)))];
  if (m === 'ok') return [C.poly2(yonlu([[0, k * 0.36], [-k * 0.34, -k * 0.2], [k * 0.34, -k * 0.2]]))];
  if (m === 'kedi') return silüet('kedi', k * 0.62).map((p) => C.poly2(yonlu(p)));
  const metin = (s.harf || 'O').trim().slice(0, 6) || 'O';
  const t = textPolys(yazi, metin, Math.min(k * 0.55, (en * 0.8) / Math.max(1, metin.length * 0.62)), { spacing: 0.3 });
  const ox = t.width / 2;
  return [C.polys2(t.polys.map((p) => p.map(([x, y]) => [x - ox, y - t.cap / 2])))];
}
function tusParcalari(s) {
  const W = s.u * 19.05 - 1.05, D = 18, H = 8;
  return [
    { ad: 'tus', renk: 'govde', fn: () => {
      const dis = C.loft(C.rrect(W, D, 1.2), 0, C.rrect(W - 5.4, D - 4.5, 2), H);
      const ic = C.loft(C.rrect(W - 2.6, D - 2.6, 0.6), -0.01, C.rrect(W - 7.4, D - 6.6, 1.2), H - 1.6);
      const kilif = C.cyl(H - 1.6 - 0.6 + 0.01, MX.sapR, MX.sapR, 32, 0, 0, 0.6);
      const arti = C.union([C.box(MX.arti, MX.kol, 4, -MX.arti / 2, -MX.kol / 2, 0.59), C.box(MX.kol, MX.arti, 4, -MX.kol / 2, -MX.arti / 2, 0.59)]);
      return C.union([C.sub(dis, ic), C.sub(kilif, arti)]);
    } },
    { ad: 'motif', renk: 'color', fn: () => C.union(motifKesit(s, W - 5.4, D - 4.5).map((k) => C.extrude(k, 1.4, H - 0.2))) },
  ];
}

export function parcalar(s) {
  return s.mode === 'tus' ? tusParcalari(s) : anahtarlikParcalari(s);
}
