// Text Flip geometrisi: her harf çifti kesiştirilir, birinci harf önden (XZ), ikinci harf yandan (YZ) çekilir;
// kesişim iki kelimeyi birden taşır. Text Flip aracı (app.js) ve oda sahnesi (core/oda-urunler.js) kullanır.
import { plate, C } from '../../core/scene-kit.js';
import { textPolys } from '../../core/font3d.js';

// Harfi kendi kutusunda ortalanmış çokgen olarak döndürür (taban çizgisi y=0).
function glyph(fs, ch, size) {
  const t = textPolys(fs, ch, size);
  const b = t.glyphs[0].box;
  if (!b) return null;
  const cx = (b.minX + b.maxX) / 2;
  return { polys: t.polys.map((p) => p.map(([x, y]) => [x - cx, y])), w: b.maxX - b.minX, h: b.maxY };
}

// Heykelin yerleşimi: harf yuvaları köşegen boyunca (i·p, i·p), ortadaki yuva orijinde. Yalnız yazı tipi
// hesabıdır (scope gerekmez). Oda sahnesi heykeli bu parçalardan kurar.
export function flipLayout(fs, w1, w2, size) {
  const n = Math.max(w1.length, w2.length);
  const A = [...w1.padEnd(n)].map((c) => glyph(fs, c, size));
  const B = [...w2.padEnd(n)].map((c) => glyph(fs, c, size));
  const pitch = Math.max(...[...A, ...B].filter(Boolean).map((g) => g.w)) * 1.02;
  return { n, A, B, pitch, depth: pitch * 1.6, mid: ((n - 1) * pitch) / 2 };
}

// i. yuvanın parçası, yuvanın ortasında; taban çizgisi z=0 (scope içinde). İki harf de yoksa null.
// Ön kelime −Y'den, ikinci kelime +X'ten okunur.
export function flipPiece(L, i) {
  const a = L.A[i], b = L.B[i], d = L.depth;
  const front = a ? C.move(C.rot(C.extrude(C.polys2(a.polys), d), 90, 0, 0), 0, d / 2, 0) : null;
  let side = b ? C.move(C.rot(C.extrude(C.polys2(b.polys), d), 90, 0, 0), 0, d / 2, 0) : null;
  if (side) side = C.rot(side, 0, 0, 90);
  if (front && side) return C.inter(front, side);
  return front || side; // kısa kelimede yuva tek harfle dolar
}

// Köşegen taban levhası, ortası orijinde (scope içinde).
export function flipBase(L) {
  const len = (L.n - 1) * L.pitch * Math.SQRT2 + L.pitch * 1.6;
  return C.rot(plate(len, L.pitch * 0.9, 4, 3), 0, 0, 45);
}

// İki kelimeli heykel, tek katı (scope içinde çağrılır). Tabanın ortası orijinde.
export function flipSolid(fs, w1, w2, size) {
  const L = flipLayout(fs, w1, w2, size);
  const pieces = [];
  for (let i = 0; i < L.n; i++) {
    const p = flipPiece(L, i);
    if (p) pieces.push(C.move(p, i * L.pitch - L.mid, i * L.pitch - L.mid, 4));
  }
  return C.union([flipBase(L), ...pieces]);
}
