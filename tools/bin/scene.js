// Organizer hikâye sahnesi: çalışma masası, açık çekmeceli dolap ve duvar rafı.
// Şablonlar Kutu aracının gerçek modelleri (TOOL.build), içleri hikâyeyi anlatan eşyalarla dolu.
import * as THREE from 'three';
import { initCSG, scope } from '../../core/csg.js';
import { toGeometry } from '../../core/mesh3.js';
import { TOOL } from './app.js';

const DESK_TOP = 740;

export async function buildScene({ scene, P, quality }) {
  await initCSG();
  const { PALETTE: C } = P;
  const printed = (color) => P.clay(color, { rough: 0.55, env: 0.7 });

  // Bir şablonu araçtaki gibi üretir; atölyedeki ile aynı model.
  function presetModel(id, override = {}) {
    const p = TOOL.presets.find((x) => x.id === id);
    const s = { ...TOOL.defaults, ...(p.mode ? { mode: p.mode } : {}), ...p.values, ...override, _thumb: true };
    TOOL.enforce(s);
    const g = new THREE.Group();
    for (const part of TOOL.build(s).parts) {
      if (part.ghost) continue;
      g.add(P.mesh(toGeometry(part.result), printed(override.color ?? p.color)));
    }
    return { g, s };
  }
  // Dikdörtgen kutunun bölme merkezleri ve iç ölçüleri.
  function cells(s) {
    const wi = s.w - 2 * s.wall, di = s.d - 2 * s.wall;
    const pw = (wi + s.div) / s.cols, pd = (di + s.div) / s.rows;
    const out = [];
    for (let j = 0; j < s.rows; j++) for (let i = 0; i < s.cols; i++) {
      out.push({ x: -wi / 2 + i * pw + (pw - s.div) / 2, y: -di / 2 + j * pd + (pd - s.div) / 2, w: pw - s.div, d: pd - s.div, z: s.floor });
    }
    return out;
  }

  // ---- oda ----
  scene.add(P.room({ back: 430, w: 7000, d: 5200 }));
  const desk = P.desk({ w: 1500, d: 720, h: DESK_TOP });
  scene.add(desk);
  const mat = P.cuttingMat({ w: 600, d: 450 });
  mat.position.set(70, -70, DESK_TOP);
  scene.add(mat);

  const hotspots = [];
  const add = (obj, x, y, z, rotZ = 0) => { obj.position.set(x, y, z); obj.rotation.z = rotZ; scene.add(obj); return obj; };

  // ---- Kalemlik (yuvarlak) + kalemler ----
  {
    const { g, s } = presetModel('pencup');
    const r = P.rng(11);
    const colors = [C.yellow, C.yellow, C.blue, C.red, C.yellow, C.sage, C.ink];
    colors.forEach((col, i) => {
      const pc = i === 2 || i === 6 ? P.pen({ color: col }) : P.pencil({ color: col, len: 170 + r() * 15 });
      const a = (i / colors.length) * Math.PI * 2;
      pc.position.set(Math.cos(a) * 16, Math.sin(a) * 16, s.floor);
      pc.rotation.set(Math.sin(a) * 0.16, -Math.cos(a) * 0.16, r() * 3);
      g.add(pc);
    });
    add(g, -520, 190, DESK_TOP, 0.3);
    hotspots.push({ id: 'pencup', preset: 'pencup', object: g });
  }

  // ---- Lamba (kalemliğin arkasında) ----
  {
    const lamp = P.lamp({ a1: -0.28, a2: 1.18, l1: 360, l2: 330, tilt: -0.5 });
    add(lamp, -700, 250, DESK_TOP, -0.25);
    lamp.updateMatrixWorld(true);
    const sp = lamp.userData.spot;
    const spot = new THREE.SpotLight(0xffd6a0, 2.2, 0, 0.62, 0.75, 0);
    spot.position.copy(sp.pos).applyMatrix4(lamp.matrixWorld);
    spot.target.position.copy(sp.pos.clone().addScaledVector(sp.dir, 600)).applyMatrix4(lamp.matrixWorld);
    scene.add(spot, spot.target);
  }

  // ---- Masa düzenleyici + içindekiler ----
  {
    const { g, s } = presetModel('desk', { w: 260, d: 115, h: 70, cols: 4, rows: 1 });
    const cs = cells(s);
    const r = P.rng(4);
    // 1: keçeli kalemler
    [C.accent, C.blue, C.ink].forEach((col, k) => {
      const pn = P.pen({ color: col, len: 135 });
      pn.position.set(cs[0].x - 12 + k * 12, cs[0].y + (r() - 0.5) * 30, s.floor);
      pn.rotation.set(0.12, (k - 1) * 0.12, 0);
      g.add(pn);
    });
    // 2: yapışkan not destesi
    const notes = P.mesh(P.rbox(48, 48, 26, 1.5), P.clay(0xf1d36b, { rough: 0.9 }));
    notes.position.set(cs[1].x, cs[1].y - 20, s.floor);
    g.add(notes);
    // 3: telefon, dik
    // Dik duran telefon: uzun kenarı yukarıda, hafif geriye yaslı.
    const ph = P.phone();
    ph.rotation.set(Math.PI / 2 - 0.22, 0, 0);
    ph.scale.setScalar(0.65);
    ph.position.set(cs[2].x, cs[2].y + 6, s.floor + 50);
    g.add(ph);
    // 4: cetvel ve makas yerine: iki silgi ve USB bellekler
    const er = P.mesh(P.rbox(40, 18, 12, 2), P.clay(0xf2f0ea));
    er.position.set(cs[3].x, cs[3].y - 25, s.floor);
    g.add(er);
    const usb = P.mesh(P.rbox(18, 50, 9, 2), P.clay(C.ink, { rough: 0.4 }));
    usb.position.set(cs[3].x, cs[3].y + 20, s.floor);
    g.add(usb);
    add(g, -140, 240, DESK_TOP, 0);
    hotspots.push({ id: 'desk', preset: 'desk', object: g });
  }

  // ---- Vida ayırıcı (mat üstünde) + vidalar ----
  {
    const { g, s } = presetModel('screws');
    const cs = cells(s);
    const screw = P.screwGeometry(14, 4.2);
    const longScrew = P.screwGeometry(24, 4.6);
    const nut = P.nutGeometry(7, 3.2, 2.1);
    const washer = P.cyl(5, 5, 1, 18);
    const steel = P.metal(C.steel, 0.3);
    const brass = P.metal(C.brass, 0.35);
    const fills = [[screw, steel, 8], [nut, steel, 7], [longScrew, steel, 6], [washer, brass, 9], [screw, brass, 7], [nut, brass, 6], [longScrew, steel, 5], [washer, steel, 8]];
    const pick = [0, 2, 4, 6, 8, 11, 13, 17, 19, 22];
    pick.forEach((ci, k) => {
      const c = cs[ci];
      const [geo, m, n] = fills[k % fills.length];
      g.add(P.scatter({ x: c.x, y: c.y, z: c.z, w: c.w - 8, d: c.d - 8 }, [{ geo, mat: m, n }], { seed: 20 + k }));
    });
    add(g, 210, -110, DESK_TOP + 3, -0.12);
    hotspots.push({ id: 'screws', preset: 'screws', object: g });
  }

  // ---- Yuvarlak tepsi + anahtar, bozuk para ----
  {
    const { g, s } = presetModel('roundtray', { w: 170 });
    const k1 = P.key(); k1.position.set(-30, 18, s.floor + 0.2); k1.rotation.z = 0.6; k1.scale.setScalar(0.9); g.add(k1);
    const k2 = P.key({ color: C.steel }); k2.position.set(-36, -24, s.floor + 2.4); k2.rotation.z = -0.4; k2.scale.setScalar(0.85); g.add(k2);
    const r = P.rng(9);
    for (let i = 0; i < 7; i++) {
      const cn = P.coin({ r: 11 + r() * 3, color: i % 3 ? C.brass : C.steel });
      const a = Math.PI * 0.15 + r() * 1.2;
      cn.position.set(Math.cos(a) * 45, Math.sin(a) * 45 - 10, s.floor + (i % 3) * 1.9);
      cn.rotation.set((r() - 0.5) * 0.15, (r() - 0.5) * 0.15, 0);
      g.add(cn);
    }
    add(g, -430, -170, DESK_TOP, 0);
    hotspots.push({ id: 'roundtray', preset: 'roundtray', object: g });
  }

  // ---- Kupa, defter, telefon (masanın sağı) ----
  add(P.mug({ color: C.paper }), 560, 200, DESK_TOP, -0.6);
  add(P.notebook({ color: C.blue }), 520, -150, DESK_TOP, 0.28);
  const ph2 = P.phone();
  add(ph2, 590, -150, DESK_TOP + 14, 0.32);

  // ---- Çekmeceli dolap + Çekmece içi ----
  {
    const UX = -1020, UY = -40;
    const unit = P.drawerUnit({ w: 440, d: 560, h: 610, openIndex: 0, open: 300, front: C.sage });
    add(unit, UX, UY, 0, 0);
    const dr = unit.userData.drawers[0].inner;
    const { g, s } = presetModel('drawer', { w: 300, d: 240, h: 42, cols: 4, rows: 3 });
    const cs = cells(s);
    const bat = P.batteryGeometry();
    g.add(P.scatter({ x: cs[0].x, y: cs[0].y, z: s.floor, w: 20, d: 30 }, [{ geo: bat, mat: P.clay(0xd9a43a, { rough: 0.5 }), n: 3 }], { seed: 4, lying: false }));
    g.add(P.scatter({ x: cs[5].x, y: cs[5].y, z: s.floor, w: 30, d: 30 }, [{ geo: P.nutGeometry(9, 4, 3), mat: P.metal(), n: 6 }], { seed: 6 }));
    const measure = P.mesh(P.rbox(58, 58, 30, 9), P.clay(C.accent, { rough: 0.5 }));
    measure.position.set(cs[8].x, cs[8].y, s.floor);
    g.add(measure);
    const tape = P.mesh(P.cyl(28, 28, 18, 32), P.clay(C.yellow, { rough: 0.6 }));
    tape.position.set(cs[10].x, cs[10].y, s.floor);
    g.add(tape);
    for (let i = 0; i < 3; i++) {
      const usb = P.mesh(P.rbox(16, 46, 8, 2), P.clay([C.ink, C.red, C.blue][i], { rough: 0.4 }));
      usb.position.set(cs[3].x - 18 + i * 18, cs[3].y, s.floor);
      g.add(usb);
    }
    g.position.set(UX + dr.x, UY + dr.y, dr.z);
    scene.add(g);
    hotspots.push({ id: 'drawer', preset: 'drawer', object: g });
  }

  // ---- Duvar rafı: Gridfinity kutular + alet kutusu + kitaplar + bitki ----
  {
    const shelf = P.wallShelf({ w: 1050, d: 230 });
    const SX = 330, SY = 430 - 115, SZ = 1230;
    add(shelf, SX, SY, SZ, 0);
    const top = SZ + 26;

    // Gridfinity: 3×2 plaka + üstünde iki kutu
    const grid = new THREE.Group();
    const plate = TOOL.build({ ...TOOL.defaults, mode: 'plate', px: 3, py: 2, plateStyle: 'thin', _thumb: true });
    grid.add(P.mesh(toGeometry(plate.parts[0].result), printed(C.ink)));
    const b1 = presetModel('g4', { gx: 2, gy: 2, gz: 3, gcols: 2, grows: 2, showPlate: false });
    b1.g.position.set(-21, 0, 0);
    grid.add(b1.g);
    const b2 = presetModel('g1', { showPlate: false, color: C.accent });
    b2.g.position.set(42, 21, 0);
    grid.add(b2.g);
    const b3 = presetModel('g1', { showPlate: false, color: C.sand, gz: 2 });
    b3.g.position.set(42, -21, 0);
    grid.add(b3.g);
    grid.children[1].add(P.scatter({ x: -20, y: -20, z: 7.2, w: 24, d: 24 }, [{ geo: P.nutGeometry(), mat: P.metal(C.brass), n: 7 }], { seed: 31 }));
    add(grid, SX - 130, SY - 10, top, 0.05);
    hotspots.push({ id: 'g4', preset: 'g4', object: grid });

    // Alet kutusu + tornavidalar
    const { g, s } = presetModel('tools', { w: 230, d: 95, h: 72 });
    const cs = cells(s);
    [C.accent, C.blue, C.ink, C.yellow, C.accent].forEach((col, i) => {
      // Tornavida ters durur: sap yukarıda, uç bölmenin tabanında.
      const len = 180 + (i % 2) * 25;
      const sd = P.screwdriver({ len, handle: col });
      const c = cs[Math.min(cs.length - 1, Math.floor(i / 2))];
      sd.rotation.set(Math.PI, 0.08 * (i - 2), 0);
      sd.position.set(c.x - 14 + (i % 2) * 26, c.y + 8, s.floor + len);
      g.add(sd);
    });
    add(g, SX + 250, SY - 5, top, -0.04);
    hotspots.push({ id: 'tools', preset: 'tools', object: g });

    const bk = P.books({ count: 6, seed: 3 });
    add(bk, SX - 500, SY + 5, top, 0);
    add(P.plant({ kind: 'succulent', size: 0.75, pot: C.paper }), SX - 255, SY, top, 0);
  }

  return {
    shots: {
      intro: { pos: [-2900, -4700, 3700], target: [-380, 120, 980] },
      main: { pos: [1750, -2900, 2050], target: [-260, 20, 760] },
    },
    lights: { center: [-150, 50, 800], shadowSpan: 1700 },
    hotspots,
  };
}
