// Organizer hikâye sahnesi: çalışma masası, açık çekmeceli dolap ve duvar rafı.
// Şablonlar Kutu aracının gerçek modelleri (TOOL.build). Sahne dağınık açılır: masaya 45 vida, somun, pul
// saçılmış, kalemler yatıyor, anahtar ve paralar ortada, dolabın üstü yığın, raftaki kutular yerinde değil.
// Bir şablona yakınlaşınca (onFocus) eşyaları zıplayıp içine yerleşir: "Her şeyin bir yeri olsun."
import * as THREE from 'three';
import { initCSG } from '../../core/csg.js';
import { toGeometry } from '../../core/mesh3.js';
import { pose, setPose, tidy } from '../../core/motion.js';
import { TOOL } from './app.js';

const DESK_TOP = 740;
const MAT = { x0: -230, x1: 370, y0: -295, y1: 155, top: DESK_TOP + 3 }; // kesim matı, masanın üstünde
const TAU = Math.PI * 2;
const X = new THREE.Vector3(1, 0, 0);
const Z = new THREE.Vector3(0, 0, 1);
const tmpQ = new THREE.Quaternion();

export async function buildScene({ scene, P }) {
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

  // ---- dağınıklık yardımcıları (dünya koordinatı) ----
  const surf = (x, y) => (x > MAT.x0 && x < MAT.x1 && y > MAT.y0 && y < MAT.y1 ? MAT.top : DESK_TOP);
  // Yan yatan uzun eşya: ucu (yerel z=0) p'de, gövdesi yaw yönünde uzanır. Sıra: kendi ekseninde döner (roll),
  // yatırılır (tilt > 0: öbür ucu alçalır), sonra masada yaw kadar çevrilir.
  const lying = (p, yaw, roll = 0, tilt = 0) => ({
    pos: new THREE.Vector3(...p),
    quat: new THREE.Quaternion().setFromAxisAngle(Z, yaw)
      .multiply(tmpQ.setFromAxisAngle(X, Math.PI / 2 + tilt))
      .multiply(tmpQ.setFromAxisAngle(Z, roll)),
  });
  // Ortası (cx, cy)'de duracak uzun eşyanın uç noktası
  const tipFor = (cx, cy, yaw, len) => [cx - (Math.sin(yaw) * len) / 2, cy + (Math.cos(yaw) * len) / 2];
  const strew = (obj, ps) => { setPose(obj, ps); scene.add(obj); return obj; };
  const taken = []; // dağınık eşyalar birbirinin içine girmesin
  function freeSpot(sample, ok, minD) {
    for (let i = 0; i < 90; i++) {
      const [x, y] = sample();
      if (ok(x, y) && !taken.some(([a, b, d]) => Math.hypot(a - x, b - y) < Math.max(d, minD))) { taken.push([x, y, minD]); return [x, y]; }
    }
    const p = sample();
    taken.push([...p, minD]);
    return p;
  }

  // ---- oda ----
  scene.add(P.room({ back: 430, w: 7000, d: 5200 }));
  scene.add(P.desk({ w: 1500, d: 720, h: DESK_TOP }));
  const mat = P.cuttingMat({ w: 600, d: 450 });
  mat.position.set(70, -70, DESK_TOP);
  scene.add(mat);

  const hotspots = [];
  const tidies = {};
  const add = (obj, x, y, z, rotZ = 0) => { obj.position.set(x, y, z); obj.rotation.z = rotZ; scene.add(obj); return obj; };
  // Şablon + toparlanacak eşyaları kaydeder. İşaretçi noktası (anchor) toparlanınca yeni tepeye taşınır.
  // focusRadius: yakın planda kadraja girecek yarıçap (mm); focusElev: bakış yüksekliği (bölmelerin içi görünsün).
  function register(id, g, items, { focusRadius, focusElev, extra = items.map((it) => it.obj) } = {}) {
    const box = new THREE.Box3();
    const anchor = new THREE.Vector3();
    const fit = () => { box.setFromObject(g); box.getCenter(anchor); anchor.z = box.max.z + 18; };
    fit();
    hotspots.push({ id, preset: id, object: g, anchor, extra, focusRadius, focusElev });
    tidies[id] = { g, items, fit };
  }

  // ---- Vida ayırıcı + 45 bağlantı elemanı: 9 çeşit × 5 ----
  {
    const { g, s } = presetModel('screws');
    const SX = 210, SY = -110;
    add(g, SX, SY, MAT.top, -0.12);
    const cs = cells(s);
    const m = {
      zinc: P.metal(0xcdb35e, 0.35), black: P.metal(0x2b2f35, 0.45), steel: P.metal(C.steel, 0.3),
      brass: P.metal(C.brass, 0.35), plug: P.clay(0xd9d4c8, { rough: 0.6 }),
    };
    // lay: bölmede diziliş. diag = çapraz paralel, row = yan yana, stack = üst üste, grid = 2×2 + üstte bir
    const KINDS = [
      { kind: 'flat', len: 24, dia: 4, mat: m.zinc, lay: 'diag' },   // ahşap vidası
      { kind: 'flat', len: 26, dia: 3.6, mat: m.black, lay: 'diag' }, // alçıpan vidası
      { kind: 'pan', len: 14, dia: 3.6, mat: m.steel, lay: 'row' },   // yuvarlak başlı vida
      { kind: 'pan', len: 10, dia: 3, mat: m.brass, lay: 'row' },     // küçük pirinç vida
      { kind: 'bolt', len: 20, dia: 4, mat: m.steel, lay: 'diag' },   // altıgen cıvata
      { kind: 'nut', dia: 5, mat: m.steel, lay: 'stack' },            // somun
      { kind: 'nut', dia: 4, mat: m.brass, lay: 'grid' },             // pirinç somun
      { kind: 'washer', dia: 5, mat: m.steel, lay: 'stack' },         // pul
      { kind: 'plug', len: 24, dia: 5, mat: m.plug, lay: 'diag' },    // dübel
    ];
    const SLOTS = [0, 2, 4, 10, 12, 14, 20, 22, 24]; // çeşit başına bir bölme, satranç düzeni
    const r = P.rng(77);
    // Bölmedeki düzenli duruş (ayırıcının yerel koordinatı)
    function slot(F, lay, c, n) {
      const jit = (r() - 0.5) * 0.12;
      if (lay === 'row') { // kısa vidalar yan yana, baş-uç dönüşümlü
        const gap = F.r + F.sr + 0.4;
        const yaw = n % 2 ? Math.PI : 0;
        const [tx, ty] = tipFor(c.x + (n - 2) * gap, c.y, yaw, F.len);
        return lying([tx, ty, s.floor + F.r], yaw, r() * TAU);
      }
      if (lay === 'diag') { // uzunlar çapraz: altta üç, üstte iki. Köşegen kameranın bakışına dik: boyları görünsün
        const gap = F.r + F.sr + 0.3;
        const yaw = -Math.PI / 4 + (n % 2 ? Math.PI : 0);
        const up = n >= 3;
        const off = up ? (n - 3.5) * gap : (n - 1) * gap;
        const [tx, ty] = tipFor(c.x + Math.SQRT1_2 * off, c.y - Math.SQRT1_2 * off, yaw, F.len);
        return lying([tx, ty, s.floor + F.r + (up ? F.r * 1.45 : 0)], yaw, r() * TAU);
      }
      if (lay === 'grid') {
        if (n === 4) return pose([c.x, c.y, s.floor + F.len], [0, 0, 0.5 + jit]);
        const q = [[-1, -1], [1, -1], [-1, 1], [1, 1]][n];
        return pose([c.x + q[0] * F.w * 0.55, c.y + q[1] * F.w * 0.55, s.floor], [0, 0, jit]);
      }
      return pose([c.x, c.y, s.floor + n * F.len], [0, 0, jit * 4]); // üst üste
    }
    const items = [];
    KINDS.forEach((K, t) => {
      const F = P.fastener(K.kind, K);
      const c = cs[SLOTS[t]];
      for (let n = 0; n < 5; n++) {
        const obj = P.mesh(F.geo, K.mat);
        // Dağınık: ayırıcının çevresinde, matın ve masanın üstünde
        const [x, y] = freeSpot(
          () => { const a = r() * TAU, d = 140 + r() * 165; return [SX + Math.cos(a) * d, SY + Math.sin(a) * d * 0.8]; },
          (px, py) => py > -335 && py < 300 && px > -60 && px < 410 && !(px < 20 && py > 150),
          19,
        );
        const yaw = r() * TAU;
        if (F.lying) {
          const [tx, ty] = tipFor(x, y, yaw, F.len);
          strew(obj, lying([tx, ty, surf(x, y) + F.sr], yaw, r() * TAU, -(F.r - F.sr) / F.len));
        } else {
          strew(obj, pose([x, y, surf(x, y)], [0, 0, yaw]));
        }
        const stack = K.lay === 'stack' || K.lay === 'grid';
        items.push({
          obj, home: slot(F, K.lay, c, n),
          at: 0.5 + t * 0.16 + n * (stack ? 0.11 : 0.05),
          dur: stack ? 0.7 : undefined,
          arc: 60 + r() * 45, arrive: 0.8, spins: 1, bounce: F.lying ? 2 : 1.2,
        });
      }
    });
    register('screws', g, items, { focusRadius: 175, focusElev: 0.9 });
  }

  // ---- Kalemlik: kalemler masada yatıyor ----
  {
    const { g, s } = presetModel('pencup');
    add(g, -520, 190, DESK_TOP, 0.3);
    const r = P.rng(11);
    const colors = [C.yellow, C.yellow, C.blue, C.red, C.yellow, C.sage, C.ink];
    const items = colors.map((col, i) => {
      const isPen = i === 2 || i === 6;
      const len = isPen ? 145 : 170 + r() * 15;
      const pc = isPen ? P.pen({ color: col }) : P.pencil({ color: col, len });
      const a = (i / colors.length) * TAU;
      const [x, y] = freeSpot(() => [-560 + r() * 230, -35 + r() * 140], () => true, 16);
      const yaw = Math.PI / 2 + (r() - 0.5) * 1.3;
      const [tx, ty] = tipFor(x, y, yaw, len);
      strew(pc, lying([tx, ty, DESK_TOP + (isPen ? 4.8 : 3.8)], yaw, r() * TAU));
      return {
        obj: pc,
        home: pose([Math.cos(a) * 16, Math.sin(a) * 16, s.floor], [Math.sin(a) * 0.16, -Math.cos(a) * 0.16, r() * 3]),
        at: 0.45 + i * 0.13, arc: 150, arrive: 0.66, dur: 0.95 + r() * 0.1, bounce: 4,
      };
    });
    register('pencup', g, items, { focusRadius: 215, focusElev: 0.5 });
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

  // ---- Masa düzenleyici: kalemler, not destesi, telefon, silgi, USB önünde dağınık ----
  {
    const { g, s } = presetModel('desk', { w: 260, d: 115, h: 70, cols: 4, rows: 1 });
    add(g, -140, 240, DESK_TOP, 0);
    const cs = cells(s);
    const r = P.rng(4);
    const spot = (minD) => freeSpot(() => [-235 + r() * 200, 45 + r() * 100], () => true, minD);
    const items = [];
    const flat = (obj, minD, home, opts) => {
      const [x, y] = spot(minD);
      strew(obj, pose([x, y, DESK_TOP], [0, 0, r() * TAU]));
      items.push({ obj, home, ...opts });
    };
    // keçeli kalemler
    [C.accent, C.blue, C.ink].forEach((col, k) => {
      const pn = P.pen({ color: col, len: 135 });
      const [x, y] = spot(14);
      const yaw = Math.PI / 2 + (r() - 0.5) * 1.1;
      const [tx, ty] = tipFor(x, y, yaw, 135);
      strew(pn, lying([tx, ty, DESK_TOP + 4.8], yaw, r() * TAU));
      items.push({ obj: pn, home: pose([cs[0].x - 12 + k * 12, cs[0].y + (r() - 0.5) * 30, s.floor], [0.12, (k - 1) * 0.12, 0]), arc: 130, arrive: 0.66, dur: 0.9, bounce: 3 });
    });
    flat(P.mesh(P.rbox(48, 48, 26, 1.5), P.clay(0xf1d36b, { rough: 0.9 })), 40, pose([cs[1].x, cs[1].y - 20, s.floor]), { arc: 90, bounce: 2 });
    // telefon: masada yatıyor, bölmesine dik oturur
    const ph = P.phone();
    ph.scale.setScalar(0.65);
    flat(ph, 55, pose([cs[2].x, cs[2].y + 6, s.floor + 50], [Math.PI / 2 - 0.22, 0, 0]), { arc: 120, arrive: 0.7, dur: 0.95, bounce: 2 });
    flat(P.mesh(P.rbox(40, 18, 12, 2), P.clay(0xf2f0ea)), 28, pose([cs[3].x, cs[3].y - 25, s.floor]), { arc: 80, spins: 1, bounce: 2 });
    flat(P.mesh(P.rbox(18, 50, 9, 2), P.clay(C.ink, { rough: 0.4 })), 30, pose([cs[3].x, cs[3].y + 20, s.floor]), { arc: 80, spins: 1, bounce: 2 });
    items.forEach((it, i) => { it.at = 0.45 + i * 0.12; });
    register('desk', g, items, { focusRadius: 190, focusElev: 0.6 });
  }

  // ---- Yuvarlak tepsi: anahtar ve bozuk paralar masada ----
  {
    const { g, s } = presetModel('roundtray', { w: 170 });
    add(g, -430, -170, DESK_TOP, 0);
    const r = P.rng(9);
    const spot = (minD) => freeSpot(() => [-330 + r() * 200, -330 + r() * 230], (x, y) => Math.hypot(x + 430, y + 170) > 112, minD);
    const items = [];
    // Tepsi: ortada yuvarlak göbek (yarıçap 41,6), dışta 6 dilim (ortası 62,4 mm'de, 0°, 60°, ... yönlerinde).
    // Anahtarlar göbeğe, paralar dilimlere: üç dilimde üst üste ya da yan yana.
    [[C.brass, -26, 9, 0.1, 0.9], [C.steel, -18, -13, -0.3, 0.85]].forEach(([col, hx, hy, rz, sc]) => {
      const k = P.key({ color: col });
      k.scale.setScalar(sc);
      const [x, y] = spot(48);
      strew(k, pose([x, y, DESK_TOP], [0, 0, r() * TAU]));
      items.push({ obj: k, home: pose([hx, hy, s.floor + 0.2], [0, 0, rz]), arc: 110, spins: 1, axis: Z, bounce: 2 });
    });
    const RING = 62.4;
    const COINS = [[0, 0, 0], [0, 0, 1], [0, 0, 2], [1, -13, 0], [1, 13, 0], [5, 0, 0], [5, 0, 1]]; // [dilim, yana kayma, kat]
    COINS.forEach(([k, t, layer], i) => {
      const cn = P.coin({ r: 11 + r() * 2, color: k === 1 ? C.steel : C.brass });
      const a = (k * Math.PI) / 3;
      const [x, y] = spot(28);
      strew(cn, pose([x, y, DESK_TOP]));
      items.push({
        obj: cn, home: pose([Math.cos(a) * RING - Math.sin(a) * t, Math.sin(a) * RING + Math.cos(a) * t, s.floor + layer * 1.9], [0, 0, r() * TAU]),
        arc: 100 + r() * 40, spins: 2, bounce: 1.5, dur: layer ? 0.75 : undefined,
      });
    });
    items.forEach((it, i) => { it.at = 0.45 + i * 0.09; });
    register('roundtray', g, items, { focusRadius: 170, focusElev: 0.75 });
  }

  // ---- Kupa, defter, telefon (masanın sağı) ----
  add(P.mug({ color: C.paper }), 560, 200, DESK_TOP, -0.6);
  add(P.notebook({ color: C.blue }), 520, -150, DESK_TOP, 0.28);
  add(P.phone(), 590, -150, DESK_TOP + 14, 0.32);

  // ---- Çekmeceli dolap + Çekmece içi: eşyalar dolabın üstüne yığılmış ----
  {
    const UX = -1020, UY = -40, TOPZ = 610;
    const unit = P.drawerUnit({ w: 440, d: 560, h: TOPZ, openIndex: 0, open: 300, front: C.sage });
    add(unit, UX, UY, 0, 0);
    const dr = unit.userData.drawers[0].inner;
    const { g, s } = presetModel('drawer', { w: 300, d: 240, h: 42, cols: 4, rows: 3 });
    g.position.set(UX + dr.x, UY + dr.y, dr.z);
    scene.add(g);
    const cs = cells(s); // ön iki sıra (0–7) çekmece dışında, görünür
    const r = P.rng(6);
    const spot = (minD) => freeSpot(() => [UX - 160 + r() * 320, UY - 255 + r() * 190], () => true, minD);
    const items = [];
    const put = (obj, mess, home, opts = {}) => { strew(obj, mess); items.push({ obj, home, arc: 110, ...opts }); };
    const batGeo = P.batteryGeometry(), batMat = P.clay(0xd9a43a, { rough: 0.5 });
    for (let i = 0; i < 3; i++) {
      const [x, y] = spot(24);
      const yaw = r() * TAU;
      const [tx, ty] = tipFor(x, y, yaw, 46);
      put(P.mesh(batGeo, batMat), lying([tx, ty, TOPZ + 7], yaw), pose([cs[0].x + (i - 1) * 16, cs[0].y, s.floor], [0, 0, r()]), { spins: 1 });
    }
    [C.ink, C.red, C.blue].forEach((col, i) => {
      const [x, y] = spot(30);
      put(P.mesh(P.rbox(16, 46, 8, 2), P.clay(col, { rough: 0.4 })), pose([x, y, TOPZ], [0, 0, r() * TAU]), pose([cs[1].x - 20 + i * 20, cs[1].y, s.floor]), { spins: 1 });
    });
    const nutGeo = P.nutGeometry(9, 4, 3), nutMat = P.metal();
    for (let i = 0; i < 6; i++) {
      const [x, y] = spot(16);
      put(P.mesh(nutGeo, nutMat), pose([x, y, TOPZ], [0, 0, r() * TAU]), pose([cs[2].x + ((i % 2) - 0.5) * 16, cs[2].y + (Math.floor(i / 2) - 1) * 16, s.floor], [0, 0, r() * 0.3]), { spins: 1 });
    }
    put(P.mesh(P.cyl(28, 28, 18, 32), P.clay(C.yellow, { rough: 0.6 })), pose([...spot(60), TOPZ]), pose([cs[4].x, cs[4].y, s.floor]));
    put(P.mesh(P.rbox(58, 58, 30, 9), P.clay(C.accent, { rough: 0.5 })), pose([...spot(70), TOPZ], [0, 0, 0.5]), pose([cs[5].x, cs[5].y, s.floor]));
    items.forEach((it, i) => { it.at = 0.45 + i * 0.08; });
    register('drawer', g, items, { focusRadius: 240, focusElev: 0.72 });
  }

  // ---- Duvar rafı: Gridfinity kutular + alet kutusu + kitaplar + bitki ----
  {
    const shelf = P.wallShelf({ w: 1050, d: 230 });
    const SX = 330, SY = 430 - 115, SZ = 1230;
    add(shelf, SX, SY, SZ, 0);
    const top = SZ + 26;
    const r = P.rng(13);

    // Gridfinity: 3×2 plaka; kutular başta plakanın yanında, biri ötekinin üstüne yamuk konmuş
    const grid = new THREE.Group();
    const plate = TOOL.build({ ...TOOL.defaults, mode: 'plate', px: 3, py: 2, plateStyle: 'thin', _thumb: true });
    grid.add(P.mesh(toGeometry(plate.parts[0].result), printed(C.ink)));
    const b1 = presetModel('g4', { gx: 2, gy: 2, gz: 3, gcols: 2, grows: 2, showPlate: false });
    const b2 = presetModel('g1', { showPlate: false, color: C.accent });
    const b3 = presetModel('g1', { showPlate: false, color: C.sand, gz: 2 });
    b1.g.add(P.scatter({ x: -20, y: -20, z: 7.2, w: 24, d: 24 }, [{ geo: P.nutGeometry(), mat: P.metal(C.brass), n: 7 }], { seed: 31 }));
    const h1 = new THREE.Box3().setFromObject(b1.g).max.z;
    grid.add(b1.g, b2.g, b3.g);
    setPose(b1.g, pose([128, 8, 0], [0, 0, 0.32]));
    setPose(b2.g, pose([218, -48, 0], [0, 0, -0.5]));
    setPose(b3.g, pose([120, 16, h1 + 0.5], [0.05, -0.04, 0.95]));
    add(grid, SX - 130, SY - 10, top, 0.05);
    register('g4', grid, [
      { obj: b3.g, home: pose([42, -21, 0]), at: 0.45, arc: 60, dur: 0.75, bounce: 1.2 },
      { obj: b1.g, home: pose([-21, 0, 0]), at: 0.85, arc: 45, dur: 0.75, bounce: 1.2 },
      { obj: b2.g, home: pose([42, 21, 0]), at: 1.1, arc: 45, dur: 0.7, bounce: 1.2 },
    ], { focusRadius: 170, focusElev: 0.6, extra: [] });

    // Alet kutusu: tornavidalar başta rafta, kutunun sağında yan yatıyor
    const { g, s } = presetModel('tools', { w: 230, d: 95, h: 72 });
    const TX = SX + 250, TY = SY - 5;
    add(g, TX, TY, top, -0.04);
    const cs = cells(s);
    const items = [C.accent, C.blue, C.ink, C.yellow, C.accent].map((col, i) => {
      // Tornavida ters durur: sap yukarıda, uç bölmenin tabanında.
      const len = 180 + (i % 2) * 25;
      const sd = P.screwdriver({ len, handle: col });
      const c = cs[Math.min(cs.length - 1, Math.floor(i / 2))];
      const yaw = (i % 2 ? Math.PI : 0) + (r() - 0.5) * 0.35; // sap-uç dönüşümlü, yan yana
      const [tx, ty] = tipFor(TX + 150 + i * 22, TY + (r() - 0.5) * 24, yaw, len);
      strew(sd, lying([tx, ty, top + 18], yaw, r() * TAU, 0.07));
      return {
        obj: sd, home: pose([c.x - 14 + (i % 2) * 26, c.y + 8, s.floor + len], [Math.PI, 0.08 * (i - 2), 0]),
        at: 0.45 + i * 0.14, arc: 175, arrive: 0.68, dur: 1.05, bounce: 3,
      };
    });
    register('tools', g, items, { focusRadius: 235, focusElev: 0.45 });

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
    // Yakınlaşınca toparlama; toparlanmış şablona yeniden tıklanınca eşyalar yerinde kıpırdar.
    onFocus(id, { reduced } = {}) {
      const t = tidies[id];
      if (t) tidy(t.g, t.items, { reduced, onDone: t.fit });
    },
    onPoke(id, { reduced } = {}) {
      const t = tidies[id];
      if (t) tidy(t.g, t.items, { reduced, onDone: t.fit });
    },
  };
}
