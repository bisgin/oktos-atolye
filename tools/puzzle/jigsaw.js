// Yapboz parça kesimi: nx × ny hücre, her kenar mantar biçimli tırnakla çizilir, komşu hücre aynı eğriyle girinti
// alır. Puzzle aracı (geometry.js) ve oda sahnesi (core/oda-urunler.js) kullanır.
import * as THREE from 'three';

// Kenar boyunca tırnak profili (a: kenar boyunca 0..1, b: dik yönde, kenar boyuna oranla).
const KNOB = [[0, 0], [0.35, 0], [0.38, 0.07], [0.33, 0.15], [0.37, 0.23], [0.5, 0.27], [0.63, 0.23], [0.67, 0.15], [0.62, 0.07], [0.65, 0], [1, 0]];
function knobPoints(steps = 5) {
  const out = [];
  const pts = KNOB.map(([a, b]) => new THREE.Vector2(a, b));
  const curve = new THREE.SplineCurve(pts);
  for (let i = 0; i <= KNOB.length * steps; i++) out.push(curve.getPoint(i / (KNOB.length * steps)));
  return out.map((v) => [v.x, v.y]);
}
const KP = knobPoints();

// p0 → p1 kenarı; t: +1/−1 tırnak yönü (kenarın sol normaline göre), 0: düz.
function edgePts(p0, p1, t) {
  if (!t) return [p0, p1];
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  return KP.map(([a, b]) => [p0[0] + a * dx + nx * b * L * t, p0[1] + a * dy + ny * b * L * t]);
}

// nx × ny hücreli yapboz; her hücre için kapalı çokgen döner (orijin: ızgaranın ortası).
export function jigsaw(nx, ny, cell, seed = 3) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const H = [...Array(ny + 1)].map((_, j) => [...Array(nx)].map(() => (j === 0 || j === ny ? 0 : rnd() < 0.5 ? 1 : -1)));
  const V = [...Array(nx + 1)].map((_, i) => [...Array(ny)].map(() => (i === 0 || i === nx ? 0 : rnd() < 0.5 ? 1 : -1)));
  const ox = (nx * cell) / 2, oy = (ny * cell) / 2;
  const P = (i, j) => [i * cell - ox, j * cell - oy];
  const cells = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const bottom = edgePts(P(i, j), P(i + 1, j), H[j][i]);
    const right = edgePts(P(i + 1, j), P(i + 1, j + 1), V[i + 1][j]);
    const top = edgePts(P(i, j + 1), P(i + 1, j + 1), H[j + 1][i]).reverse();
    const left = edgePts(P(i, j), P(i, j + 1), V[i][j]).reverse();
    const poly = [...bottom.slice(0, -1), ...right.slice(0, -1), ...top.slice(0, -1), ...left.slice(0, -1)];
    cells.push({ i, j, poly, cx: (i + 0.5) * cell - ox, cy: (j + 0.5) * cell - oy });
  }
  return cells;
}
