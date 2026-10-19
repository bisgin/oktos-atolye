// Fidget Clicker hikâye sahnesi: masa köşesinde yakın plan. Kedi, kutulu ve yıldız clicker'lar;
// mekanizmayı anlatan patlatılmış mavi anahtar. Üzerine gelince clicker gerçekten "tıklar".
import * as THREE from 'three';
import { initCSG } from '../../core/csg.js';
import { solid, fonts, textSolid, standUp, plate, C } from '../../core/scene-kit.js';

const TOP = 740;

export async function buildScene({ scene, P }) {
  await initCSG();
  const fs = await fonts(700);
  const { PALETTE: K } = P;
  const pla = (c) => P.clay(c, { rough: 0.5, env: 0.75 });

  scene.add(P.room({ back: 380, w: 6000, d: 5000 }));
  scene.add(P.desk({ w: 1400, d: 700, h: TOP, color: K.wood }));
  const mat = P.cuttingMat({ w: 520, d: 380 });
  mat.position.set(230, -60, TOP);
  scene.add(mat);
  const put = (o, x, y, z = TOP, rz = 0) => { o.position.set(x, y, z); o.rotation.z = rz; scene.add(o); return o; };

  put(P.keyboard({ w: 360, d: 120 }), -260, 40, TOP, 0.06);
  put(P.mug({ color: K.ink }), 660, 240, TOP, -0.5);
  put(P.plant({ kind: 'succulent', size: 0.9, pot: K.paper }), 360, 320);
  put(P.notebook({ color: K.sage }), 520, -170, TOP, -0.2);
  put(P.lamp({ a1: -0.25, a2: 1.15, l1: 330, l2: 300, tilt: -0.55 }), 780, 330, TOP, Math.PI - 0.25);

  const hotspots = [];
  const tops = {}; // basılabilir üst parçalar: id → { obj, z0 }

  // ---- Kedi clicker: gövde ikiye bölünür, üst yarı basılır ----
  {
    const g = new THREE.Group();
    const H = 22;
    const body = () => C.union([
      C.scale(C.sphere(26, 64), [1, 0.92, 0.82]),
      C.move(C.rot(C.cyl(16, 9, 0.5, 4), 0, -18, 0), -13, 0, 13),
      C.move(C.rot(C.cyl(16, 9, 0.5, 4), 0, 18, 0), 13, 0, 13),
    ]);
    const bottom = solid(() => { const b = C.move(body(), 0, 0, 21.3); return C.splitZ(b, H)[1]; }, pla(K.accent));
    const top = solid(() => { const b = C.move(body(), 0, 0, 21.3); return C.move(C.splitZ(b, H + 0.9)[0], 0, 0, 0); }, pla(0xf3efe6));
    const face = new THREE.Group();
    for (const sx of [-1, 1]) face.add(P.mesh(new THREE.SphereGeometry(2.6, 14, 10), P.clay(K.ink, { rough: 0.3 })).translateX(sx * 8).translateY(-21).translateZ(H + 10));
    face.add(P.mesh(new THREE.SphereGeometry(1.8, 12, 8), P.clay(0xe48a8a)).translateY(-23).translateZ(H + 5));
    top.add(face);
    g.add(bottom, top);
    put(g, 70, -120, TOP + 3, 0.35);
    tops.cat = { obj: top, z0: 0 };
    hotspots.push({ id: 'cat', preset: 'cat', object: g });
  }

  // ---- Kutulu clicker: 40×40 kutu + "OKTOS" kabartma yazı + basılır kapak ----
  {
    const g = new THREE.Group();
    const base = solid(() => plate(40, 40, 15, 4), pla(K.ink));
    const lid = solid(() => C.move(plate(36, 36, 7, 3), 0, 0, 15.6), pla(K.accent));
    const word = solid(() => {
      const t = textSolid(fs, 'OKTOS', 8.2, 0.9, { spacing: 0.3 });
      return C.move(standUp(t.solid, 0.9), 0, -20 - 0.85, 4.2);
    }, pla(0xf3efe6));
    g.add(base, lid, word);
    put(g, 330, -160, TOP + 3, -0.4);
    tops.boxed = { obj: lid, z0: 0 };
    hotspots.push({ id: 'boxed', preset: 'boxed', object: g });
  }

  // ---- Gömülü yıldız: yıldız prizması, üst yarısı basılır ----
  {
    const g = new THREE.Group();
    const star = () => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        const r = i % 2 ? 13 : 30;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return C.offset2(C.offset2(C.poly2(pts), 3), -3);
    };
    const bottom = solid(() => C.extrude(star(), 11), pla(K.blue));
    const top = solid(() => C.move(C.extrude(C.offset2(star(), -1.2), 7), 0, 0, 11.6), pla(K.yellow));
    g.add(bottom, top);
    put(g, 250, 120, TOP + 3, 0.2);
    tops.star = { obj: top, z0: 0 };
    hotspots.push({ id: 'star', preset: 'star', object: g });
  }

  // ---- Patlatılmış görünüm: alt gövde, mavi anahtar, üst gövde havada ----
  const exploded = new THREE.Group();
  {
    const stand = P.mesh(P.cyl(46, 50, 10, 48), P.clay(K.paper, { rough: 0.6 }));
    const lower = solid(() => C.sub(plate(34, 34, 14, 5), C.move(plate(15.4, 15.4, 12, 0.5), 0, 0, 3)), pla(K.accent));
    const sw = new THREE.Group();
    sw.add(P.mesh(P.rbox(14, 14, 5.2, 1), P.clay(0x3a3f46, { rough: 0.45 })));
    sw.add(P.mesh(P.rbox(15.6, 15.6, 6.4, 1.6), P.clay(0x9aa3ad, { rough: 0.2, transparent: true, opacity: 0.55, env: 1 })).translateZ(5));
    const stem = new THREE.Group();
    stem.add(P.mesh(P.rbox(4.2, 1.3, 4, 0.3), P.clay(0x2f7de1, { rough: 0.35 })), P.mesh(P.rbox(1.3, 4.2, 4, 0.3), P.clay(0x2f7de1, { rough: 0.35 })));
    stem.position.z = 11;
    sw.add(stem);
    for (const sx of [-1, 1]) sw.add(P.mesh(P.cyl(0.8, 0.8, 3.5, 8), P.metal(K.brass)).translateX(sx * 3).translateZ(-3.5));
    const upper = solid(() => C.sub(C.move(plate(34, 34, 10, 5), 0, 0, 0), C.move(plate(6, 6, 6, 0.4), 0, 0, -1)), pla(0xf3efe6));
    exploded.add(stand);
    const stack = new THREE.Group();
    lower.position.z = 0; sw.position.z = 0; upper.position.z = 0;
    stack.add(lower, sw, upper);
    stack.position.z = 26;
    exploded.add(stack);
    exploded.userData = { lower, sw, upper, stack };
    put(exploded, 470, 150, TOP, -0.3);
    hotspots.push({ id: 'switch', preset: 'boxed', object: exploded, anchor: [470, 150, TOP + 120] });
  }

  let hoverId = null;
  const press = {};
  return {
    shots: {
      intro: { pos: [-1100, -2300, 1700], target: [60, 60, 820] },
      main: { pos: [700, -720, 1080], target: [170, 20, 770] },
    },
    lights: { center: [200, 0, 780], shadowSpan: 900, key: [-700, -900, 2200] },
    hotspots,
    onHover(id) { hoverId = id; },
    update(t, dt) {
      // Basma: üzerinde durulan clicker 1.4 sn'de bir tıklar (70 ms in, 150 ms çık).
      for (const [id, tp] of Object.entries(tops)) {
        let p = 0;
        if (hoverId === id) {
          const ph = (t * 0.72) % 1;
          p = ph < 0.05 ? ph / 0.05 : ph < 0.16 ? 1 - (ph - 0.05) / 0.11 : 0;
        }
        press[id] = (press[id] || 0) + (p - (press[id] || 0)) * Math.min(1, dt * 40);
        tp.obj.position.z = tp.z0 - press[id] * 1.8;
      }
      // Patlatılmış görünüm: parçalar nefes alır gibi açılıp kapanır, yavaşça döner.
      const { lower, sw, upper, stack } = exploded.userData;
      const open = hoverId === 'switch' ? 1 : 0.55 + Math.sin(t * 0.9) * 0.35;
      lower.position.z = 0;
      sw.position.z = 18 + open * 16;
      upper.position.z = 32 + open * 38;
      stack.rotation.z = t * 0.25;
    },
  };
}
