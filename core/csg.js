// Katı model çekirdeği: manifold-3d (WASM) başlatma ve yardımcılar.
// manifold nesneleri JS çöp toplayıcısına görünmez; scope() içindeki her nesne iş bitince silinir.
import Module from 'manifold-3d';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/manifold-3d@2.5.1/manifold.wasm';
let W = null;
let live = null;

export async function initCSG() {
  if (W) return W;
  W = await Module({ locateFile: () => WASM_URL });
  W.setup();
  return W;
}

function T(obj) {
  if (live) live.push(obj);
  return obj;
}

// Manifold → düz diziler (scope çıktısı)
function diziler(m) {
  const mesh = m.getMesh();
  const box = m.boundingBox();
  const props = m.getProperties();
  return {
    positions: mesh.vertProperties.slice(),
    numProp: mesh.numProp,
    indices: mesh.triVerts.slice(),
    triCount: mesh.triVerts.length / 3,
    volume: props.volume,
    box: { min: [...box.min], max: [...box.max] },
    empty: m.isEmpty(),
  };
}

// fn() bir Manifold döndürür. Sonuç düz diziler olarak alınır, tüm ara nesneler silinir.
export function scope(fn) {
  return scopeMany(() => [fn()])[0];
}

// fn() Manifold dizisi döndürür (ortak bir katıdan çıkan parçalar: bir kez kurulur, birkaç parçaya bölünür).
export function scopeMany(fn) {
  const prev = live;
  live = [];
  try {
    return fn().map(diziler);
  } finally {
    for (const o of live) { try { o.delete(); } catch (_) { /* zaten silinmiş */ } }
    live = prev;
  }
}

const SEG = 48;

// --- 2B kesitler ---
export function rrect(w, d, r = 0, seg = SEG) {
  const { CrossSection } = W;
  r = Math.max(0, Math.min(r, w / 2 - 0.01, d / 2 - 0.01));
  if (r <= 0.001) return T(CrossSection.square([w, d], true));
  const core = T(CrossSection.square([w - 2 * r, d - 2 * r], true));
  return T(core.offset(r, 'Round', 2, seg));
}

export function circle2(r, seg = SEG) {
  return T(W.CrossSection.circle(r, seg));
}

export function poly2(points) {
  return T(new W.CrossSection([points], 'Positive'));
}

// Delikli çokgen kümesi (ör. yazı tipi harfleri): yön fark etmez, iç içe konturlar delik olur.
export function polys2(polygons) {
  return T(new W.CrossSection(polygons, 'EvenOdd'));
}

// Yazı tipi konturları (yönleri tutarlı): üst üste binen harfler birleşir, iç boşluklar delik kalır (el yazısı)
export function polysNZ(polygons) {
  return T(new W.CrossSection(polygons, 'NonZero'));
}

export function offset2(cs, delta, seg = SEG) {
  return T(cs.offset(delta, 'Round', 2, seg));
}

// --- 3B ---
export function extrude(cs, h, z = 0) {
  const m = T(cs.extrude(h));
  return z ? T(m.translate([0, 0, z])) : m;
}

export function box(w, d, h, x = 0, y = 0, z = 0) {
  return T(T(W.Manifold.cube([w, d, h], false)).translate([x, y, z]));
}

export function cyl(h, r1, r2 = r1, seg = SEG, x = 0, y = 0, z = 0) {
  return T(T(W.Manifold.cylinder(h, r1, r2, seg, false)).translate([x, y, z]));
}

// İki yükseklikteki iki kesitin dışbükey zarfı: pah / koni geçişleri için.
// Kesitler dışbükey olmalı (yuvarlak köşeli dikdörtgen, çember).
export function loft(csA, zA, csB, zB) {
  const eps = 0.001;
  const a = T(T(csA.extrude(eps)).translate([0, 0, zA]));
  const b = T(T(csB.extrude(eps)).translate([0, 0, zB - eps]));
  return T(W.Manifold.hull([a, b]));
}

export function sphere(r, seg = 48) {
  return T(W.Manifold.sphere(r, seg));
}

export const scale = (m, v) => T(m.scale(v));
// Düzlemle iki parçaya böler: [üst, alt] (normal yönündeki parça ilk).
export function splitZ(m, z) {
  const [above, below] = m.splitByPlane([0, 0, 1], z);
  T(above); T(below);
  return [above, below];
}

export function hullPts(points) {
  return T(W.Manifold.hull(points));
}

// Doğrudan üretilmiş üçgen ağından Manifold. Ağ kapalı değilse manifold hata fırlatır (doğrulama da budur).
export function fromMesh(positions, indices) {
  const mesh = new W.Mesh({ numProp: 3, vertProperties: positions, triVerts: indices });
  return T(new W.Manifold(mesh));
}

export const move =(m, x = 0, y = 0, z = 0) => T(m.translate([x, y, z]));
export const rot = (m, x = 0, y = 0, z = 0) => T(m.rotate([x, y, z]));
export const add = (a, b) => T(a.add(b));
export const sub = (a, b) => T(a.subtract(b));
export const inter = (a, b) => T(a.intersect(b));

export function union(list) {
  const l = list.filter(Boolean);
  if (l.length === 0) return null;
  if (l.length === 1) return l[0];
  return T(W.Manifold.union(l));
}

export function subAll(base, cutters) {
  const c = union(cutters);
  return c ? sub(base, c) : base;
}
