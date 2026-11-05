// Armut koltuğun ezilmesi (2026-11-04 v7): Biggie armuta yatınca armut içine göçer. Dönüşüm Blender'la ortak tek formül:
// GLB meta'sı `armut_yat.armut.gomulu` (kaynak scripts/karakter-armut-geo.py armut_ez; klip-meta-v5.md "v7 — Blender
// tarafı"). Karakterin armuda gömülme ölçüsü bu formülle ölçüldü: sitede başka bir eğme kullanılırsa kalça ve sırt
// armudun içinde ya da üstünde kalır. Formül (armudun yereli, mm; orijin tabanın merkezi, önü −y, z yukarı):
//   z' = z_harita(z) (parçalı doğrusal; son parçanın eğimiyle uzar)
//   s  = 1 + siskinlik · sin(π · min(1, max(0, z / oturak_once_mm)))
//   x' = x · s;  y' = y · (y < 0 ? 1 + (s − 1) · on_carpan : s)
//   y' += k · yumusak_mm · ln(1 + e^((z' − oturak_mm) / yumusak_mm))
//   ezilme t ile: v_t = v + t · (D(v) − v)
// t klibin `armut.ezilme_egrisi`nden (core/oda-sunum.js armutKaresi). Biyeler, kulp ve gövde aynı alanla eğilir.
// Normaller alanın Jacobian'ıyla döner (geometri dizinsiz, kırık normalli: yeniden hesaplamak düz gölgelerdi). Hesap
// tekil köşelerde (aynı konumdaki köşeler birleştirilir, ~1/6'sı), yalnız t değişince.
import * as THREE from 'three';
import { armutEzAlani } from './cati-esya.js';

// Meta yoksa (eski GLB) Blender'ın v7 değerleri
export const GOMULU_VARSAYILAN = {
  oturak_once_mm: 475.6, oturak_mm: 220, tepe_once_mm: 1051.7, sirt_mm: 650,
  z_harita: [[0, 0], [475.6, 220], [1051.7, 650]], siskinlik: 0.08, on_carpan: 0.4, yumusak_mm: 40, k: 0.4717,
};

// grup: armut grubu (içinde 'armut' ağı); g: meta gomulu (yoksa varsayılan). Döner { ayarla(t), t, oturak(), sirt() }
export function armutEzici(grup, g = null) {
  const A = { ...GOMULU_VARSAYILAN, ...(g ?? {}) };
  const mesh = grup.isMesh ? grup : grup.getObjectByProperty('isMesh', true);
  if (!mesh?.geometry?.attributes?.position) return null;
  const geo = mesh.geometry, pa = geo.attributes.position, na = geo.attributes.normal, n = pa.count;
  const harita = new Int32Array(n), anahtar = new Map(), tek = [];
  for (let i = 0; i < n; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = `${Math.round(x * 100)},${Math.round(y * 100)},${Math.round(z * 100)}`;
    let j = anahtar.get(k);
    if (j === undefined) { j = tek.length / 3; anahtar.set(k, j); tek.push(x, y, z); }
    harita[i] = j;
  }
  const P0 = new Float32Array(tek), m = P0.length / 3;
  const N0 = na ? new Float32Array(na.array) : null;
  const Pn = new Float32Array(m * 3), Jc = new Float32Array(m * 9);
  // v8.2: alan Blender'la ortak core/cati-esya.js armutEzAlani'ndan (tepe yayılması ve çukur dahil; v7 meta'sında
  // ek terimler 0). Tek çıktı dizisi: ayarla() her çağrının sonucunu hemen okur
  const ez = armutEzAlani(A), out = [0, 0, 0];
  const alan = (x, y, z, t) => ez(x, y, z, t, out);
  let t0 = -1;
  const e = 1.5;
  function ayarla(t) {
    t = Math.min(1, Math.max(0, t));
    if (Math.abs(t - t0) < 0.002 && t0 >= 0) return false;
    t0 = t;
    for (let j = 0; j < m; j++) {
      const x = P0[j * 3], y = P0[j * 3 + 1], z = P0[j * 3 + 2];
      const f = alan(x, y, z, t), fx = f[0], fy = f[1], fz = f[2];
      Pn[j * 3] = fx; Pn[j * 3 + 1] = fy; Pn[j * 3 + 2] = fz;
      if (!N0) continue;
      const a = alan(x + e, y, z, t), a0 = (a[0] - fx) / e, a1 = (a[1] - fy) / e, a2 = (a[2] - fz) / e;
      const b = alan(x, y + e, z, t), b0 = (b[0] - fx) / e, b1 = (b[1] - fy) / e, b2 = (b[2] - fz) / e;
      const c = alan(x, y, z + e, t), c0 = (c[0] - fx) / e, c1 = (c[1] - fy) / e, c2 = (c[2] - fz) / e;
      const o = j * 9; // kofaktör: n' = nx (b×c) + ny (c×a) + nz (a×b)
      Jc[o] = b1 * c2 - b2 * c1; Jc[o + 1] = b2 * c0 - b0 * c2; Jc[o + 2] = b0 * c1 - b1 * c0;
      Jc[o + 3] = c1 * a2 - c2 * a1; Jc[o + 4] = c2 * a0 - c0 * a2; Jc[o + 5] = c0 * a1 - c1 * a0;
      Jc[o + 6] = a1 * b2 - a2 * b1; Jc[o + 7] = a2 * b0 - a0 * b2; Jc[o + 8] = a0 * b1 - a1 * b0;
    }
    const pp = pa.array, nn = na?.array;
    for (let i = 0; i < n; i++) {
      const j = harita[i];
      pp[i * 3] = Pn[j * 3]; pp[i * 3 + 1] = Pn[j * 3 + 1]; pp[i * 3 + 2] = Pn[j * 3 + 2];
      if (!nn) continue;
      const nx = N0[i * 3], ny = N0[i * 3 + 1], nz = N0[i * 3 + 2], o = j * 9;
      const X = nx * Jc[o] + ny * Jc[o + 3] + nz * Jc[o + 6], Y = nx * Jc[o + 1] + ny * Jc[o + 4] + nz * Jc[o + 7], Z = nx * Jc[o + 2] + ny * Jc[o + 5] + nz * Jc[o + 8];
      const L = Math.hypot(X, Y, Z) || 1;
      nn[i * 3] = X / L; nn[i * 3 + 1] = Y / L; nn[i * 3 + 2] = Z / L;
    }
    pa.needsUpdate = true;
    if (na) na.needsUpdate = true;
    geo.computeBoundingBox(); // kadraj ve tıklama ışını kutuyu okur
    return true;
  }
  // Küre bir kez, büyük (görüş kırpması; t = 1 hâli dinlenmenin kutusundan sırtın yatmasıyla taşar)
  geo.computeBoundingSphere();
  geo.boundingSphere.radius *= 1.25;
  return {
    ayarla,
    get t() { return t0; },
    kose: m,
    // Ölçüm: oturağın ortası (x 0, y −220, dinlenmede oturak yüksekliği) ve sırtın tepesi şu anki t ile
    oturak() { return alan(0, -220, A.oturak_once_mm, Math.max(0, t0))[2]; },
    sirt() { return [...alan(0, 120, A.tepe_once_mm, Math.max(0, t0))]; },
  };
}
