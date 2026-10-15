// Sahneler için ortak yardımcılar: katı modeli (manifold) Three.js ağına çevirme, 3B yazı katıları.
import * as THREE from 'three';
import * as C from './csg.js';
import { toGeometry } from './mesh3.js';
import { mesh } from './props.js';
import { loadFont, textPolys } from './font3d.js';

export { C };

// fn() bir Manifold döndürür; sonuç Three.js ağı olur. Ara nesneler csg.scope ile temizlenir.
export function solid(fn, material, { flat = true } = {}) {
  return mesh(toGeometry(C.scope(fn), { flat }), material);
}

export async function fonts(weight = 700) {
  return loadFont(weight);
}

// Yazıyı XY düzleminde (okunuş +X) depth kadar +Z'ye çeker; yatayda ortalanır, taban çizgisi y=0.
// scope içinde çağrılmalı.
export function textSolid(fs, text, size, depth, { spacing = 0 } = {}) {
  const t = textPolys(fs, text, size, { spacing });
  const polys = t.polys.map((p) => p.map(([x, y]) => [x - t.width / 2, y]));
  return { solid: C.extrude(C.polys2(polys), depth), width: t.width, cap: t.cap };
}

// XY'de yatan katıyı dik çevirir: yazı XZ düzleminde okunur, ön yüzü -Y'ye bakar.
export function standUp(m, depth) {
  return C.move(C.rot(m, 90, 0, 0), 0, depth, 0);
}

// Kenar yuvarlatılmış levha (XY'de), kalınlık z.
export function plate(w, d, t, r) {
  return C.extrude(C.rrect(w, d, r), t);
}

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
