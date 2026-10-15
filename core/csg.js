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

// fn() bir Manifold döndürür. Sonuç düz diziler olarak alınır, tüm ara nesneler silinir.
export function scope(fn) {
  const prev = live;
  live = [];
  try {
    const m = fn();
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
