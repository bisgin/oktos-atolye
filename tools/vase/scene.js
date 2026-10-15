// Vazo hikâye sahnesi: pencere önü, içeri düşen ışık, pervaz ve konsolda vazolar, yerde 50 cm'lik uzun vazo.
// Vazolar Vazo aracının gerçek modelleri (TOOL.build); çiçekler hafifçe salınır, ışıkta toz süzülür.
import * as THREE from 'three';
import { initCSG, scope } from '../../core/csg.js';
import { toGeometry } from '../../core/mesh3.js';
import { TOOL } from './app.js';

const BACK = 400;
const WIN = { x: 250, w: 1000, z0: 880, z1: 2150 };
const CONSOLE = { x: 1420, h: 780, w: 900, d: 380 };

export async function buildScene({ scene, P }) {
  await initCSG();
  const { PALETTE: C } = P;
  const glazed = (color) => P.clay(color, { rough: 0.42, env: 0.9 });

  function vase(id, override = {}) {
    const p = TOOL.presets.find((x) => x.id === id);
    const s = { ...TOOL.defaults, ...p.values, ...override, _thumb: true };
    TOOL.enforce(s);
    const r = TOOL.build(s).parts[0].result;
    const g = new THREE.Group();
    g.add(P.mesh(toGeometry(r, { flat: false }), glazed(override.color ?? p.color)));
    return { g, s };
  }

  // ---- oda, pencere, ışık ----
  scene.add(P.room({ back: BACK, w: 7600, d: 5600, window: WIN }));
  const shaft = P.lightShaft({ w: WIN.w * 0.95, h: WIN.z1 - WIN.z0, len: 2200, opacity: 0.09 });
  shaft.position.set(WIN.x, BACK - 20, WIN.z0);
  scene.add(shaft);
  const motes = P.dust({ count: 180, box: [1000, 1300, 1500] });
  motes.position.set(WIN.x + 150, BACK - 800, 450);
  scene.add(motes);
  const rug = P.rug({ r: 950, color: 0xd9d2c3, ring: 0xc9bfa9 });
  rug.position.set(650, -650, 0);
  scene.add(rug);

  const hotspots = [];
  const flowers = [];
  const place = (obj, x, y, z, rz = 0) => { obj.position.set(x, y, z); obj.rotation.z = rz; scene.add(obj); return obj; };
  const SILL = WIN.z0;
  const SILL_Y = BACK - 105;

  // ---- pervaz: altıgen saksı (bitkili), lale vazosu, çiçek kase ----
  {
    const { g, s } = vase('hex');
    const soil = P.mesh(P.cyl(s.dTop / 2 - 8, s.dTop / 2 - 8, 4, 32), P.clay(0x5a4232, { rough: 1 }));
    soil.position.z = s.height - 22;
    g.add(soil);
    const pl = P.plant({ kind: 'leafy', potShape: false, size: 0.75, seed: 8 });
    pl.position.z = s.height - 20;
    g.add(pl);
    place(g, WIN.x + 230, SILL_Y, SILL, 0.2);
    hotspots.push({ id: 'hex', preset: 'hex', object: g });
  }
  {
    const { g, s } = vase('tulip');
    const cols = [0xd8453b, 0xf2c14e, 0xd8453b];
    cols.forEach((col, i) => {
      const f = P.flower({ h: 230 + i * 25, color: col, kind: 'tulip', seed: 3 + i, bend: 0.22 });
      f.position.set((i - 1) * 7, (i % 2) * 6, s.height - 70);
      f.rotation.z = (i - 1) * 0.9;
      g.add(f);
      flowers.push(f);
    });
    place(g, WIN.x + 420, SILL_Y, SILL, 0);
    hotspots.push({ id: 'tulip', preset: 'tulip', object: g });
  }
  {
    const { g, s } = vase('flower');
    const lemon = P.clay(0xe9c94a, { rough: 0.55 });
    [[-22, 10], [20, -14], [8, 26], [-6, -24]].forEach(([x, y], i) => {
      const l = P.mesh(new THREE.SphereGeometry(1, 20, 14), lemon);
      l.scale.set(30, 24, 24);
      l.position.set(x, y, s.height * 0.55 + (i % 2) * 8);
      l.rotation.z = i;
      g.add(l);
    });
    place(g, WIN.x + 20, SILL_Y, SILL, 0);
    hotspots.push({ id: 'flower', preset: 'flower', object: g });
  }

  // ---- konsol: burgulu kule, kaburgalı şişe, kitaplar, küçük çerçeve ----
  {
    const cm = P.clay(C.woodLight, { rough: 0.7 });
    const con = new THREE.Group();
    const { w, d, h } = CONSOLE;
    con.add(P.mesh(P.rbox(w, d, 30, 5), cm).translateZ(h - 30));
    con.add(P.mesh(P.rbox(w - 20, d - 20, h - 250, 4), P.clay(C.paper, { rough: 0.7 })).translateZ(200));
    // İki kapak arasındaki derz çizgisi
    con.add(P.mesh(P.rbox(4, 4, h - 300, 1), P.clay(C.inkSoft, { rough: 0.5 })).translateY(-d / 2 + 9).translateZ(250));
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const leg = P.mesh(P.cyl(14, 10, 200, 16), P.clay(C.woodDark, { rough: 0.7 }));
        leg.position.set(sx * (w / 2 - 50), sy * (d / 2 - 50), 0);
        con.add(leg);
      }
    }
    place(con, CONSOLE.x, BACK - d / 2 - 4, 0);
  }
  const TOP = CONSOLE.h;
  const CY = BACK - CONSOLE.d / 2 - 10;
  {
    const { g } = vase('twist');
    place(g, CONSOLE.x - 300, CY, TOP, 0.3);
    hotspots.push({ id: 'twist', preset: 'twist', object: g });
  }
  {
    const { g, s } = vase('ribbed');
    const f = P.flower({ h: 260, color: 0xf3f0e6, petals: 9, seed: 12, bend: 0.12 });
    f.position.z = s.height - 30;
    g.add(f);
    flowers.push(f);
    place(g, CONSOLE.x - 60, CY - 20, TOP, 0);
    hotspots.push({ id: 'ribbed', preset: 'ribbed', object: g });
  }
  {
    const bk = P.books({ count: 5, seed: 9, lean: false });
    bk.rotation.z = Math.PI / 2;
    place(bk, CONSOLE.x + 250, CY - 10, TOP, Math.PI / 2);
    const fr = P.frame({ w: 170, h: 220, depth: 18, border: 16, color: C.ink });
    fr.rotation.x = -0.12;
    place(fr, CONSOLE.x + 280, BACK - 40, TOP, 0);
  }

  // ---- yerde uzun vazo + dallar ----
  {
    const { g, s } = vase('tall');
    for (let i = 0; i < 4; i++) {
      const f = P.flower({ h: 520 + i * 70, color: [0xf3efe4, 0xe9b8b0, 0xf3efe4, 0xe9b8b0][i], petals: 6, seed: 40 + i, bend: 0.32 });
      f.position.set((i - 1.5) * 10, (i % 2) * 10 - 5, s.height - 90);
      f.rotation.z = i * 1.6;
      g.add(f);
      flowers.push(f);
    }
    place(g, 820, -60, 0, 0.4);
    hotspots.push({ id: 'tall', preset: 'tall', object: g, anchor: [820, -60, 560] });
  }

  // ---- büyük saksı bitkisi (çerçeveleme) ----
  place(P.plant({ kind: 'leafy', size: 2.6, seed: 21, pot: C.paper }), -650, 120, 0, 0);

  const sway = flowers.map((f) => ({ f, s: f.userData.seed, rx: f.rotation.x, ry: f.rotation.y }));
  return {
    shots: {
      intro: { pos: [-1300, -4900, 2600], target: [300, 250, 1150] },
      main: { pos: [1150, -2750, 1450], target: [520, 220, 900] },
    },
    lights: {
      center: [650, 150, 800],
      shadowSpan: 1900,
      key: [-900, -1700, 2600],
      rim: [WIN.x, BACK + 2200, 2700],
    },
    hotspots,
    update(t) {
      motes.userData.update(t);
      for (const w of sway) {
        w.f.rotation.x = w.rx + Math.sin(t * 0.7 + w.s) * 0.025;
        w.f.rotation.y = w.ry + Math.cos(t * 0.55 + w.s * 1.7) * 0.02;
      }
    },
  };
}
