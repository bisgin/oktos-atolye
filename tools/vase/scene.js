// Vazo hikâye sahnesi: pencere önü, içeri düşen ışık, pervaz ve konsolda vazolar, yerde 50 cm'lik uzun vazo.
// Vazolar Vazo aracının gerçek modelleri (TOOL.build); çiçekler hafifçe salınır, ışıkta toz süzülür.
// Yakınlaşınca (onFocus) her vazo canlanır: saksıda bitki büyüyüp çiçek açar, laleler ve dallar uzayıp açılır,
// pervazdaki limonlar kaseye zıplar, burgulu kule kendi etrafında döner.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { initCSG } from '../../core/csg.js';
import { toGeometry } from '../../core/mesh3.js';
import { pose, tidy } from '../../core/motion.js';
import { TOOL } from './app.js';

const BACK = 400;
const WIN = { x: 250, w: 1000, z0: 880, z1: 2150 };
const CONSOLE = { x: 1420, h: 780, w: 900, d: 380 };
const TAU = Math.PI * 2;

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

  // Çiçeğin açılma durumu (0 tomurcuk → 1 açık); growFlower yaylanarak açar.
  const setBloom = (f, k) => { f.userData.k = k; P.bloom(f, k); };
  const growFlower = (f, { delay = 0, dur = 1.5 } = {}) => {
    const st = { k: f.userData.k ?? 0 };
    return gsap.to(st, { k: 1, duration: dur, delay, ease: 'back.out(1.6)', onUpdate: () => setBloom(f, st.k) });
  };

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
  const focusFx = {};   // id → (reduced) => yakınlaşınca oynayan canlandırma
  const shown = {};     // bir kez oynayanlar (bitki büyümesi, çiçek açması tekrarlanmaz)
  const place = (obj, x, y, z, rz = 0) => { obj.position.set(x, y, z); obj.rotation.z = rz; scene.add(obj); return obj; };
  const SILL = WIN.z0;
  const SILL_Y = BACK - 105;

  // ---- pervaz: altıgen saksı (bitki + papatyalar), lale vazosu, çiçek kase ----
  {
    const { g, s } = vase('hex');
    // Toprak diski altıgenin iç yarıçapında kalmalı (cos 30° ≈ 0,87), yoksa düz yüzlerden dışarı taşar.
    const soilR = (s.dTop / 2) * 0.8 - 4;
    const soil = P.mesh(P.cyl(soilR, soilR, 4, 32), P.clay(0x5a4232, { rough: 1 }));
    soil.position.z = s.height - 22;
    g.add(soil);
    const pl = P.plant({ kind: 'leafy', potShape: false, size: 0.75, seed: 8 });
    pl.position.z = s.height - 20;
    g.add(pl);
    // Yapraklar başta küçük: yakınlaşınca büyür, aralarından üç papatya açar.
    const stems = pl.userData.leaves.children;
    stems.forEach((st) => st.scale.setScalar(0.35));
    const daisies = [0xf6f1e4, 0xf2d16b, 0xf6f1e4].map((col, i) => {
      const f = P.flower({ h: 170 + i * 30, color: col, petals: 8, seed: 60 + i, bend: 0.26 });
      const holder = new THREE.Group();
      holder.scale.setScalar(0.62);
      const a = i * 2.1 + 0.4;
      holder.position.set(Math.cos(a) * 20, Math.sin(a) * 20, s.height - 20);
      holder.rotation.z = a;
      holder.add(f);
      g.add(holder);
      flowers.push(f);
      setBloom(f, 0);
      return f;
    });
    place(g, WIN.x + 230, SILL_Y, SILL, 0.2);
    hotspots.push({ id: 'hex', preset: 'hex', object: g, focusRadius: 200, focusElev: 0.45 });
    focusFx.hex = (reduced) => {
      if (reduced) { stems.forEach((st) => st.scale.setScalar(1)); daisies.forEach((f) => setBloom(f, 1)); return; }
      gsap.to(stems.map((st) => st.scale), { x: 1, y: 1, z: 1, duration: 1.1, ease: 'back.out(1.7)', stagger: 0.05, delay: 0.45 });
      daisies.forEach((f, i) => growFlower(f, { delay: 0.95 + i * 0.22, dur: 1.4 }));
    };
  }
  {
    const { g, s } = vase('tulip');
    const tulips = [0xd8453b, 0xf2c14e, 0xd8453b].map((col, i) => {
      const f = P.flower({ h: 230 + i * 25, color: col, kind: 'tulip', seed: 3 + i, bend: 0.22 });
      f.position.set((i - 1) * 7, (i % 2) * 6, s.height - 70);
      f.rotation.z = (i - 1) * 0.9;
      g.add(f);
      flowers.push(f);
      setBloom(f, 0.3);
      return f;
    });
    place(g, WIN.x + 420, SILL_Y, SILL, 0);
    hotspots.push({ id: 'tulip', preset: 'tulip', object: g, focusRadius: 230, focusCenter: [WIN.x + 420, SILL_Y, SILL + 190] });
    focusFx.tulip = (reduced) => tulips.forEach((f, i) => (reduced ? setBloom(f, 1) : growFlower(f, { delay: 0.45 + i * 0.2, dur: 1.6 })));
  }
  {
    const { g, s } = vase('flower');
    // Limonlar başta pervazda, kasenin solunda: yakınlaşınca birer birer kaseye zıplar.
    const lemon = P.clay(0xe9c94a, { rough: 0.55 });
    const ball = new THREE.SphereGeometry(1, 20, 14);
    const MESS = [[150, 300], [100, 272], [122, 336], [58, 312]];
    const items = [[-22, 10], [20, -14], [8, 26], [-6, -24]].map(([x, y], i) => {
      const l = P.mesh(ball, lemon);
      l.scale.set(30, 24, 24);
      l.position.set(MESS[i][0], MESS[i][1], SILL + 24);
      l.rotation.z = 0.4 + i * 0.9;
      scene.add(l);
      return {
        obj: l, home: pose([x, y, s.height * 0.55 + (i % 2) * 8], [0, 0, i]),
        at: 0.5 + i * 0.2, arc: 120, arrive: 0.75, spins: 1, axis: new THREE.Vector3(0, 1, 0), bounce: 5,
      };
    });
    place(g, WIN.x + 20, SILL_Y, SILL, 0);
    hotspots.push({ id: 'flower', preset: 'flower', object: g, extra: items.map((it) => it.obj), focusRadius: 210, focusElev: 0.62 });
    focusFx.flower = (reduced) => tidy(g, items, { reduced });
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
    // Her yakınlaşmada bir tur döner: burgu ışıkta akar. Bitiş açısı mutlak: art arda tıklamada
    // yarım turdan başlayan yeni tur vazoyu rastgele açıda bırakmasın.
    const rz0 = g.rotation.z;
    let turns = 0;
    focusFx.twist = (reduced) => {
      if (reduced) return;
      turns += 1;
      gsap.to(g.rotation, { z: rz0 + turns * TAU, duration: 2.8, ease: 'power2.inOut', delay: 0.35, overwrite: true });
    };
  }
  {
    const { g, s } = vase('ribbed');
    const f = P.flower({ h: 260, color: 0xf3f0e6, petals: 9, seed: 12, bend: 0.12 });
    f.position.z = s.height - 30;
    g.add(f);
    flowers.push(f);
    setBloom(f, 0.25);
    place(g, CONSOLE.x - 60, CY - 20, TOP, 0);
    hotspots.push({ id: 'ribbed', preset: 'ribbed', object: g, focusRadius: 250, focusCenter: [CONSOLE.x - 60, CY - 20, TOP + 230] });
    focusFx.ribbed = (reduced) => (reduced ? setBloom(f, 1) : growFlower(f, { delay: 0.5, dur: 1.8 }));
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
    const branches = [];
    for (let i = 0; i < 4; i++) {
      const f = P.flower({ h: 520 + i * 70, color: [0xf3efe4, 0xe9b8b0, 0xf3efe4, 0xe9b8b0][i], petals: 6, seed: 40 + i, bend: 0.32 });
      f.position.set((i - 1.5) * 10, (i % 2) * 10 - 5, s.height - 90);
      f.rotation.z = i * 1.6;
      g.add(f);
      flowers.push(f);
      setBloom(f, 0.35);
      branches.push(f);
    }
    place(g, 820, -60, 0, 0.4);
    hotspots.push({ id: 'tall', preset: 'tall', object: g, anchor: [820, -60, 560], focusRadius: 610, focusElev: 0.2, focusCenter: [820, -60, 560] });
    focusFx.tall = (reduced) => branches.forEach((f, i) => (reduced ? setBloom(f, 1) : growFlower(f, { delay: 0.5 + i * 0.25, dur: 1.9 })));
  }

  // ---- büyük saksı bitkisi (çerçeveleme) ----
  place(P.plant({ kind: 'leafy', size: 2.6, seed: 21, pot: C.paper }), -650, 120, 0, 0);

  const sway = flowers.map((f) => ({ f, s: f.userData.seed, rx: f.rotation.x, ry: f.rotation.y }));
  let breeze = 0; // yeniden tıklanınca çiçekler bir an daha çok salınır
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
    onFocus(id, { reduced } = {}) {
      if (id === 'twist' || !shown[id]) { shown[id] = true; focusFx[id]?.(reduced); return; }
      this.onPoke(id, { reduced });
    },
    // Yeniden tıklama: kule bir tur daha döner, limonlar kıpırdar, çiçekler bir an çok salınır.
    onPoke(id, { reduced } = {}) {
      if (reduced) return;
      if (id === 'twist') focusFx.twist(false);
      else if (id === 'flower') focusFx.flower(false);
      else breeze = 1;
    },
    update(t, dt = 0.016) {
      motes.userData.update(t);
      breeze = Math.max(0, breeze - dt * 0.7);
      const amp = 1 + breeze * 5;
      for (const w of sway) {
        w.f.rotation.x = w.rx + Math.sin(t * 0.7 + w.s) * 0.025 * amp;
        w.f.rotation.y = w.ry + Math.cos(t * 0.55 + w.s * 1.7) * 0.02 * amp;
      }
    },
  };
}
