// Puzzle Maker hikâye sahnesi: sehpada yarısı kurulmuş kabartma yapboz, havada açılmış küre ve küp.
// Parçalar gerçek geometri: her hücre mantar biçimli tırnaklarla çizilir, komşu hücre aynı eğriyle
// girinti alır; hücre modelle kesiştirilir. Üzerine gelince parçalar yerlerine oturur.
import * as THREE from 'three';
import { initCSG } from '../../core/csg.js';
import { solid, C } from '../../core/scene-kit.js';

const BACK = 400;

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
function jigsaw(nx, ny, cell, seed = 3) {
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

export async function buildScene({ scene, P }) {
  await initCSG();
  const { PALETTE: K } = P;
  const pla = (c) => P.clay(c, { rough: 0.5, env: 0.75 });
  const put = (o, x, y, z = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.z = rz; scene.add(o); return o; };
  const hotspots = [];
  const animated = []; // { group, pieces: [{ mesh, home, away, spin }], id }

  scene.add(P.room({ back: BACK, w: 7000, d: 5400 }));
  const TX = 300, TY = -250, TT = 430;
  put(P.rug({ r: 1150, color: 0xd6d1c5, ring: 0xc7bfad }), TX, TY, 0);
  put(P.coffeeTable({ r: 520, h: TT, color: K.woodLight }), TX, TY, 0);

  // ---- Kabartma yapboz: 4×3 parça, 9'u yerinde, 3'ü masada dağınık ----
  {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 340;
    const g2 = cv.getContext('2d');
    const sky = g2.createLinearGradient(0, 0, 0, 340);
    sky.addColorStop(0, '#9fc1d8'); sky.addColorStop(0.6, '#f4e3c3'); sky.addColorStop(1, '#e9b07a');
    g2.fillStyle = sky; g2.fillRect(0, 0, 512, 340);
    const ridge = (base, amp, f, col, ph) => { g2.fillStyle = col; g2.beginPath(); g2.moveTo(0, 340); for (let x = 0; x <= 512; x += 4) g2.lineTo(x, base - amp * (Math.sin(x * f + ph) * 0.6 + Math.sin(x * f * 2.3 + ph) * 0.4)); g2.lineTo(512, 340); g2.fill(); };
    g2.fillStyle = '#fff4dc'; g2.beginPath(); g2.arc(370, 120, 34, 0, Math.PI * 2); g2.fill();
    ridge(210, 40, 0.012, '#c27d55', 1); ridge(250, 34, 0.02, '#8c4f3a', 3); ridge(300, 22, 0.03, '#3d3a46', 5);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, envMapIntensity: 0.6 });
    const W = 240, Hh = 160, T = 6, cell = 60;
    const cells = jigsaw(4, 3, cell, 7);
    const g = new THREE.Group();
    const loose = new Set([3, 7, 10]);
    cells.forEach((c, k) => {
      const m = solid(() => C.extrude(C.offset2(C.polys2([c.poly]), -0.35), T), top);
      // Doku koordinatı: dünya XY'den (yapboz boyunca tek görsel)
      const pos = m.geometry.attributes.position;
      const uv = new Float32Array(pos.count * 2);
      for (let v = 0; v < pos.count; v++) { uv[v * 2] = pos.getX(v) / W + 0.5; uv[v * 2 + 1] = pos.getY(v) / Hh + 0.5; }
      m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      if (loose.has(k)) {
        const r = k * 1.7;
        m.position.set(Math.cos(r) * 220 + 40, Math.sin(r) * 120 - 60, 0);
        m.rotation.z = r;
      }
      g.add(m);
    });
    put(g, TX - 30, TY - 40, TT, -0.12);
    hotspots.push({ id: 'relief', preset: null, object: g });
  }

  // ---- Küre yapboz: 3×3 hücreyle dikey kesilmiş küre; parçalar havada açılmış ----
  {
    const R = 66, cell = 44;
    const cells = jigsaw(3, 3, cell, 11);
    const colors = [K.accent, K.sand, K.sage, K.blue, K.accent, K.rose, K.sand, K.sage, K.ink];
    const g = new THREE.Group();
    const pieces = [];
    cells.forEach((c, k) => {
      const m = solid(() => C.inter(C.move(C.sphere(R, 72), 0, 0, R), C.extrude(C.offset2(C.polys2([c.poly]), -0.4), 2 * R + 4, -2)), pla(colors[k % colors.length]), { flat: false });
      const away = new THREE.Vector3(c.cx * 0.5, c.cy * 0.5, 40 + (k % 3) * 14);
      pieces.push({ mesh: m, home: new THREE.Vector3(0, 0, 0), away, spin: (k % 2 ? 1 : -1) * (0.3 + k * 0.05) });
      g.add(m);
    });
    const stand = P.mesh(P.cyl(40, 46, 10, 40), P.clay(K.paper, { rough: 0.6 }));
    stand.position.z = -10;
    g.add(stand);
    put(g, TX + 280, TY + 130, TT + 10, 0);
    animated.push({ id: 'sphere', pieces, k: 0 });
    hotspots.push({ id: 'sphere', preset: null, object: g, anchor: [TX + 280, TY + 130, TT + 230] });
  }

  // ---- Küp yapboz: 2×2 sütun parça, açılmış ----
  {
    const S = 84, cell = 42;
    const cells = jigsaw(2, 2, cell, 5);
    const colors = [K.blue, K.yellow, K.red, K.sage];
    const g = new THREE.Group();
    const pieces = [];
    cells.forEach((c, k) => {
      const m = solid(() => C.inter(C.move(C.box(S, S, S, -S / 2, -S / 2, 0), 0, 0, 0), C.extrude(C.offset2(C.polys2([c.poly]), -0.4), S + 4, -2)), pla(colors[k]));
      pieces.push({ mesh: m, home: new THREE.Vector3(), away: new THREE.Vector3(c.cx * 0.7, c.cy * 0.7, 10 + k * 6), spin: (k % 2 ? 1 : -1) * 0.25 });
      g.add(m);
    });
    put(g, TX - 330, TY + 170, TT, 0.3);
    animated.push({ id: 'cube', pieces, k: 0 });
    hotspots.push({ id: 'cube', preset: null, object: g });
  }

  put(P.mug({ color: K.paper }), TX + 120, TY - 330, TT, 0.4);
  put(P.giftBox({ w: 200, d: 150, h: 60, color: K.ink, ribbon: K.accent }), TX + 380, TY - 200, TT, -0.5);
  put(P.plant({ kind: 'leafy', size: 2.2, seed: 9, pot: K.terracotta }), TX + 820, 260, 0);

  let hoverId = null;
  return {
    shots: {
      intro: { pos: [-1300, -3600, 2300], target: [200, -150, 500] },
      main: { pos: [860, -1650, 1250], target: [130, -170, 480] },
    },
    lights: { center: [300, -200, 450], shadowSpan: 1300, key: [-900, -1300, 2400] },
    hotspots,
    onHover(id) { hoverId = id; },
    update(t, dt) {
      for (const a of animated) {
        const target = hoverId === a.id ? 1 : 0;
        a.k += (target - a.k) * Math.min(1, dt * 3.2);
        a.pieces.forEach((p, i) => {
          const f = 1 - a.k;
          const bob = Math.sin(t * 1.1 + i) * 4 * f;
          p.mesh.position.copy(p.home).lerp(p.away, f);
          p.mesh.position.z += bob;
          p.mesh.rotation.z = p.spin * f * Math.sin(t * 0.4 + i * 0.7) * 0.6;
        });
      }
    },
  };
}
