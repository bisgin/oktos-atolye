// Sahne eşya kütüphanesi: hepsi kodla üretilir ("atölye kili" stili: mat, yumuşak kenarlı).
// Birim mm, Z yukarı. Her eşya, tabanı z=0'da ve XY'de ortalanmış bir THREE.Group döndürür (aksi yazılmadıkça).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const PALETTE = {
  wall: 0xe2e5e1, wallAlt: 0xd5dad5, floor: 0xbfc0b9, baseboard: 0xb7bbb4,
  wood: 0xc79e76, woodDark: 0x9c7552, woodLight: 0xdcc2a2, plywood: 0xd9bf98,
  ink: 0x2b3036, inkSoft: 0x4a5059, steel: 0x9ba3ab, brass: 0xc6a043, copper: 0xb87348,
  paper: 0xf2efe7, cream: 0xe9e1d0,
  leaf: 0x6e9a58, leafDark: 0x4e7b43, stem: 0x5f8a4a,
  terracotta: 0xb8613f, accent: 0xd4621f, blue: 0x3f6fb0, red: 0xb8372f, yellow: 0xe6b33a,
  sage: 0x8fa58a, sand: 0xc9b596, rose: 0xd49a9a, mat: 0x2f5d50,
};

// ---------- malzemeler ----------
const cache = new Map();
export function clay(color, { rough = 0.82, metal = 0, env = 0.55, emissive = 0x000000, emissiveIntensity = 0, side, transparent = false, opacity = 1 } = {}) {
  const key = [color, rough, metal, env, emissive, emissiveIntensity, side, transparent, opacity].join('|');
  if (!cache.has(key)) {
    const m = new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal, envMapIntensity: env,
      emissive, emissiveIntensity, transparent, opacity, side: side ?? THREE.FrontSide,
    });
    cache.set(key, m);
  }
  return cache.get(key);
}
export const metal = (color = PALETTE.steel, rough = 0.32) => clay(color, { rough, metal: 0.85, env: 1 });
export const glow = (color, intensity = 1.6) => clay(color, { rough: 0.6, emissive: color, emissiveIntensity: intensity });

// ---------- yardımcılar ----------
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Yuvarlak kenarlı kutu: tabanı z=0, merkez XY.
export function rbox(w, d, h, r = 2, seg = 3) {
  const rr = Math.max(0.01, Math.min(r, w / 2 - 0.01, d / 2 - 0.01, h / 2 - 0.01));
  const g = new RoundedBoxGeometry(w, d, h, seg, rr);
  g.translate(0, 0, h / 2);
  return g;
}

// Z eksenli silindir / koni: tabanı z=0.
export function cyl(rTop, rBottom, h, seg = 32, open = false) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, open);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, h / 2);
  return g;
}

// Döndürme gövdesi: points = [[r, z], ...] (alttan üste). Z ekseni etrafında.
export function lathe(points, seg = 48) {
  const g = new THREE.LatheGeometry(points.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  return g;
}

export function merge(list) {
  const anyIndexed = list.some((g) => g.index);
  const anyPlain = list.some((g) => !g.index);
  const norm = list.map((g) => {
    let x = anyIndexed && anyPlain && g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((x.attributes.position.count) * 2), 2));
    return x;
  });
  return mergeGeometries(norm, false);
}

const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };
const group = (...children) => { const g = new THREE.Group(); children.forEach((c) => c && g.add(c)); return g; };

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// ---------- oda ----------
// Zemin + arka duvar (y = +back) + sol duvar (x = -left). İsteğe bağlı pencere (arka duvarda).
export function room({ w = 6000, d = 4000, h = 2800, back = 600, left = null, wallColor = PALETTE.wall, floorColor = PALETTE.floor, window: win = null } = {}) {
  const g = new THREE.Group();
  const floor = mesh(new THREE.PlaneGeometry(w, d), clay(floorColor, { rough: 0.95 }), { cast: false });
  floor.position.set(0, back - d / 2, 0);
  g.add(floor);
  const wallMat = clay(wallColor, { rough: 0.96, env: 0.35 });
  const T = 40;
  const addWall = (cx, cz, ww, hh) => {
    const m = mesh(new THREE.BoxGeometry(ww, T, hh), wallMat, { cast: false });
    m.position.set(cx, back + T / 2, cz);
    g.add(m);
  };
  if (win) {
    // Pencere boşluğu çevresinde dört parça duvar.
    const { x, w: ww, z0, z1 } = win;
    const l0 = -w / 2, l1 = x - ww / 2, r0 = x + ww / 2, r1 = w / 2;
    addWall((l0 + l1) / 2, h / 2, l1 - l0, h);
    addWall((r0 + r1) / 2, h / 2, r1 - r0, h);
    addWall(x, z0 / 2, ww, z0);
    addWall(x, (z1 + h) / 2, ww, h - z1);
    g.add(windowFrame(ww, z1 - z0, { x, y: back, z: z0 }));
  } else {
    addWall(0, h / 2, w, h);
  }
  // Süpürgelik
  const bb = mesh(new THREE.BoxGeometry(w, 14, 90), clay(PALETTE.baseboard, { rough: 0.8 }), { cast: false });
  bb.position.set(0, back - 7, 45);
  g.add(bb);
  if (left !== null) {
    const lw = mesh(new THREE.BoxGeometry(T, d, h), clay(PALETTE.wallAlt, { rough: 0.96, env: 0.35 }), { cast: false });
    lw.position.set(left - T / 2, back - d / 2, h / 2);
    g.add(lw);
  }
  return g;
}

// Pencere çerçevesi + cam + ışık huzmesi. Konum: alt kenar ortası.
export function windowFrame(w, h, { x = 0, y = 0, z = 0 } = {}) {
  const g = new THREE.Group();
  const frameMat = clay(0xf4f3ef, { rough: 0.6 });
  const t = 50, dpt = 90;
  const bar = (bw, bh, bx, bz) => { const m = mesh(new THREE.BoxGeometry(bw, dpt, bh), frameMat); m.position.set(bx, 0, bz); g.add(m); };
  bar(w, t, 0, t / 2); bar(w, t, 0, h - t / 2);
  bar(t, h, -w / 2 + t / 2, h / 2); bar(t, h, w / 2 - t / 2, h / 2);
  bar(t * 0.6, h - 2 * t, 0, h / 2);
  // Gökyüzü: dışarıdan gelen ışık hissi (kendinden ışıklı düzlem)
  const sky = mesh(new THREE.PlaneGeometry(w - t, h - t), new THREE.MeshBasicMaterial({ color: 0xfdf6e8 }), { cast: false, receive: false });
  sky.rotation.x = Math.PI / 2;
  sky.position.set(0, 60, h / 2);
  g.add(sky);
  // Denizlik
  const sill = mesh(rbox(w + 120, 200, 30, 6), clay(0xf4f3ef, { rough: 0.55 }));
  sill.position.set(0, -90, -30);
  g.add(sill);
  g.position.set(x, y, z);
  g.userData.sillTop = z;
  return g;
}

// Pencereden içeri düşen ışık huzmesi (yarı saydam, toplamalı).
export function lightShaft({ w = 900, h = 1300, len = 1800, color = 0xfff2d6, opacity = 0.11 } = {}) {
  const geo = new THREE.BufferGeometry();
  const v = new Float32Array([
    -w / 2, 0, 0, w / 2, 0, 0, w / 2, 0, h, -w / 2, 0, h,
    -w / 2 + 200, -len, -h * 0.55, w / 2 + 200, -len, -h * 0.55, w / 2 + 200, -len, h * 0.25, -w / 2 + 200, -len, h * 0.25,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 5;
  return m;
}

// Işıkta süzülen toz zerrecikleri. update(t) çağrılmalı.
export function dust({ count = 160, box = [900, 900, 1100], color = 0xfff6e2, size = 3.2 } = {}) {
  const r = rng(7);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (r() - 0.5) * box[0]; pos[i * 3 + 1] = (r() - 0.5) * box[1]; pos[i * 3 + 2] = r() * box[2];
    seed[i] = r() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  const base = pos.slice();
  pts.userData.update = (t) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const s = seed[i];
      p[i * 3] = base[i * 3] + Math.sin(t * 0.13 + s) * 30;
      p[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * 0.11 + s * 1.3) * 24;
      p[i * 3 + 2] = ((base[i * 3 + 2] + t * 9 + s) % box[2]);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

// ---------- mobilya ----------
export function desk({ w = 1400, d = 700, h = 740, top = 30, color = PALETTE.wood, legs = PALETTE.ink } = {}) {
  const g = new THREE.Group();
  g.add(at(mesh(rbox(w, d, top, 6), clay(color, { rough: 0.7 })), 0, 0, h - top));
  const lm = clay(legs, { rough: 0.45, metal: 0.4 });
  for (const sx of [-1, 1]) {
    // Kızak tipi metal ayak: iki dikme + alt ve üst travers
    const lx = sx * (w / 2 - 70);
    for (const sy of [-1, 1]) g.add(at(mesh(rbox(36, 36, h - top, 4), lm), lx, sy * (d / 2 - 60), 0));
    g.add(at(mesh(rbox(36, d - 80, 30, 4), lm), lx, 0, 60));
    g.add(at(mesh(rbox(36, d - 80, 30, 4), lm), lx, 0, h - top - 30));
  }
  g.add(at(mesh(rbox(w - 140, 26, 60, 4), lm), 0, d / 2 - 60, h - top - 60));
  g.userData.top = h;
  return g;
}

// Çekmeceli dolap. openIndex numaralı çekmece (0 = en üst) dışarı çekilmiş.
// userData.drawers[i] = { inner: {x, y, z, w, d, h} } (dolap koordinatında).
export function drawerUnit({ w = 420, d = 560, h = 600, count = 3, openIndex = 0, open = 300, color = PALETTE.paper, front = PALETTE.sage } = {}) {
  const g = new THREE.Group();
  const cm = clay(color, { rough: 0.7 });
  const t = 18;
  g.add(at(mesh(rbox(w, d, t, 3), cm), 0, 0, h - t)); // üst
  g.add(at(mesh(rbox(w, d, t, 3), cm), 0, 0, 40)); // alt
  g.add(at(mesh(rbox(t, d, h - 40, 3), cm), -w / 2 + t / 2, 0, 40));
  g.add(at(mesh(rbox(t, d, h - 40, 3), cm), w / 2 - t / 2, 0, 40));
  g.add(at(mesh(rbox(w, t, h - 40, 3), cm), 0, d / 2 - t / 2, 40)); // arka
  // Tekerlekler
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const wh = mesh(cyl(18, 18, 22, 20), clay(PALETTE.ink, { rough: 0.5 }));
    wh.rotation.y = Math.PI / 2;
    wh.position.set(sx * (w / 2 - 50) - 11, sy * (d / 2 - 60), 22);
    g.add(wh);
  }
  const fh = (h - 40 - t) / count;
  g.userData.drawers = [];
  const fm = clay(front, { rough: 0.6 });
  for (let i = 0; i < count; i++) {
    const z0 = h - t - (i + 1) * fh;
    const oy = i === openIndex ? -open : 0;
    const dr = new THREE.Group();
    dr.add(at(mesh(rbox(w - 8, 22, fh - 8, 4), fm), 0, -d / 2 + 11, 4)); // ön kapak
    dr.add(at(mesh(rbox(120, 16, 14, 6), metal(PALETTE.inkSoft, 0.4)), 0, -d / 2 - 6, fh * 0.55)); // kulp
    const iw = w - 2 * t - 16, idp = d - 60, ih = fh - 30;
    const tm = clay(PALETTE.cream, { rough: 0.8 });
    dr.add(at(mesh(rbox(iw, idp, 10, 2), tm), 0, 0, 6));
    dr.add(at(mesh(rbox(10, idp, ih, 2), tm), -iw / 2 + 5, 0, 6));
    dr.add(at(mesh(rbox(10, idp, ih, 2), tm), iw / 2 - 5, 0, 6));
    dr.add(at(mesh(rbox(iw, 10, ih, 2), tm), 0, idp / 2 - 5, 6));
    dr.position.set(0, oy, z0);
    g.add(dr);
    g.userData.drawers.push({ inner: { x: 0, y: oy, z: z0 + 16, w: iw - 20, d: idp - 20, h: ih - 10 } });
  }
  return g;
}

// Duvar rafı: tahta + iki ink konsol. Tahtanın üst yüzü z=thick.
export function wallShelf({ w = 900, d = 220, thick = 26, color = PALETTE.woodLight } = {}) {
  const g = new THREE.Group();
  g.add(mesh(rbox(w, d, thick, 4), clay(color, { rough: 0.7 })));
  const bm = clay(PALETTE.ink, { rough: 0.45, metal: 0.3 });
  for (const sx of [-1, 1]) {
    g.add(at(mesh(rbox(16, d - 30, 14, 2), bm), sx * (w / 2 - 120), -10, -14));
    g.add(at(mesh(rbox(16, 14, 110, 2), bm), sx * (w / 2 - 120), d / 2 - 12, -110));
  }
  g.userData.top = thick;
  return g;
}

export function coffeeTable({ r = 380, h = 420, color = PALETTE.wood } = {}) {
  const g = new THREE.Group();
  g.add(at(mesh(cyl(r, r, 32, 64), clay(color, { rough: 0.68 })), 0, 0, h - 32));
  g.add(mesh(cyl(30, 30, h - 32, 24), clay(PALETTE.ink, { rough: 0.45, metal: 0.4 })));
  g.add(mesh(cyl(170, 190, 16, 48), clay(PALETTE.ink, { rough: 0.45, metal: 0.4 })));
  g.userData.top = h;
  return g;
}

export function rug({ r = 900, color = 0xd8d2c4, ring = 0xc4bba8 } = {}) {
  const tex = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#' + color.toString(16).padStart(6, '0');
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#' + ring.toString(16).padStart(6, '0');
    for (let k = 1; k <= 4; k++) { c.lineWidth = 6; c.beginPath(); c.arc(w / 2, h / 2, (w / 2) * (0.35 + k * 0.14), 0, Math.PI * 2); c.stroke(); }
  });
  const m = mesh(cyl(r, r, 8, 96), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, envMapIntensity: 0.3 }), { cast: false });
  return m;
}

// ---------- masa üstü eşyalar ----------
// Kesim matı: 10 mm ızgara + 50 mm kalın çizgi. Sahnede ölçek hissi verir.
export function cuttingMat({ w = 600, d = 450 } = {}) {
  const ppm = 1.6;
  const tex = canvasTexture(Math.round(w * ppm), Math.round(d * ppm), (c, W, H) => {
    c.fillStyle = '#2f5d50'; c.fillRect(0, 0, W, H);
    for (let mm = 0; mm <= Math.max(w, d); mm += 10) {
      const bold = mm % 50 === 0;
      c.strokeStyle = bold ? 'rgba(236,240,232,.55)' : 'rgba(236,240,232,.22)';
      c.lineWidth = bold ? 1.6 : 0.8;
      if (mm <= w) { c.beginPath(); c.moveTo(mm * ppm, 0); c.lineTo(mm * ppm, H); c.stroke(); }
      if (mm <= d) { c.beginPath(); c.moveTo(0, mm * ppm); c.lineTo(W, mm * ppm); c.stroke(); }
    }
    c.fillStyle = 'rgba(236,240,232,.7)';
    c.font = `${Math.round(7 * ppm)}px sans-serif`;
    for (let mm = 50; mm < w; mm += 50) c.fillText(String(mm / 10), mm * ppm + 2, 9 * ppm);
  });
  return mesh(rbox(w, d, 3, 1.4, 1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, envMapIntensity: 0.4 }), { cast: false });
}

// Kurşun kalem (dik): grafit ucu z=0'da, silgi tepede.
export function pencil({ len = 175, color = PALETTE.yellow } = {}) {
  const g = new THREE.Group();
  const lead = 3, cone = 16, ferrule = 6, eraser = 8;
  const body = len - lead - cone - ferrule - eraser;
  g.add(mesh(cyl(0.9, 0.15, lead, 8), clay(PALETTE.ink, { rough: 0.4 })));
  g.add(at(mesh(cyl(3.7, 0.9, cone, 6), clay(PALETTE.woodLight, { rough: 0.8 })), 0, 0, lead));
  g.add(at(mesh(cyl(3.8, 3.8, body, 6), clay(color, { rough: 0.55 })), 0, 0, lead + cone));
  g.add(at(mesh(cyl(3.75, 3.75, ferrule, 12), metal(0xc9ccd1, 0.35)), 0, 0, lead + cone + body));
  g.add(at(mesh(cyl(3.6, 3.6, eraser, 12), clay(0xe48a8a, { rough: 0.9 })), 0, 0, len - eraser));
  return g;
}

export function pen({ len = 145, color = PALETTE.blue } = {}) {
  const g = new THREE.Group();
  g.add(mesh(cyl(4.6, 4.2, len - 20, 20), clay(color, { rough: 0.35 })));
  g.add(at(mesh(cyl(4.8, 4.8, 20, 20), clay(PALETTE.ink, { rough: 0.3 })), 0, 0, len - 20));
  g.add(at(mesh(rbox(2.4, 3, 40, 1), metal(0xc9ccd1)), 0, 5.2, len - 46));
  return g;
}

// Vida (dik): yarım yuvarlak baş + gövde + sivri uç. Çok sayıda vida için geometri olarak da verilir.
export function screwGeometry(len = 16, dia = 4) {
  const head = cyl(dia, dia, dia * 0.55, 16);
  head.translate(0, 0, len - dia * 0.55);
  const shank = cyl(dia / 2, dia / 2, len - dia * 0.55 - 3, 10);
  shank.translate(0, 0, 3);
  const tip = cyl(dia / 2, 0.3, 3, 10); // sivri uç z=0'da
  return merge([head, shank, tip]);
}

// Bağlantı elemanı çeşitleri (vida ayırıcı sahnesi). Uzun olanlar dik, ucu z=0'da; somun ve pul düz, tabanı z=0'da.
// Dönüş: { geo, r: yatarken eksenin yerden yüksekliği, lying: yan yatan uzun parça mı, len: boy }
export function fastener(kind, { len = 16, dia = 4 } = {}) {
  switch (kind) {
    case 'flat': { // havşa başlı (ahşap / alçıpan vidası)
      const hh = dia * 0.62;
      const head = cyl(dia * 0.95, dia * 0.42, hh, 18); head.translate(0, 0, len - hh);
      const shank = cyl(dia * 0.42, dia * 0.42, len - hh - 4, 10); shank.translate(0, 0, 4);
      const tip = cyl(dia * 0.42, 0.25, 4, 10);
      return { geo: merge([head, shank, tip]), r: dia * 0.95, sr: dia * 0.42, lying: true, len };
    }
    case 'pan': return { geo: screwGeometry(len, dia), r: dia, sr: dia / 2, lying: true, len };
    case 'bolt': { // altıgen başlı cıvata
      const hh = dia * 0.65;
      const head = cyl(dia * 0.95, dia * 0.95, hh, 6); head.translate(0, 0, len);
      return { geo: merge([cyl(dia / 2, dia / 2, len, 12), head]), r: dia * 0.95, sr: dia / 2, lying: true, len: len + hh };
    }
    case 'plug': { // kaburgalı plastik dübel
      const pts = [[0, 0], [dia * 0.32, 0]];
      for (let z = 0; z < len - 3; z += len / 7) pts.push([dia * 0.5, z + len / 14], [dia * 0.4, z + len / 7]);
      pts.push([dia * 0.42, len - 2], [dia * 0.78, len - 1.6], [dia * 0.78, len], [0, len]);
      return { geo: lathe(pts, 14), r: dia * 0.78, sr: dia * 0.5, lying: true, len };
    }
    case 'washer': {
      const s = new THREE.Shape(); s.absarc(0, 0, dia * 1.05, 0, Math.PI * 2, false);
      const h = new THREE.Path(); h.absarc(0, 0, dia * 0.55, 0, Math.PI * 2, true); s.holes.push(h);
      return { geo: new THREE.ExtrudeGeometry(s, { depth: dia * 0.22, bevelEnabled: false, curveSegments: 20 }), r: 0, lying: false, len: dia * 0.22, w: dia * 2.1 };
    }
    default: // somun
      return { geo: nutGeometry(dia * 1.75, dia * 0.8, dia * 0.5), r: 0, lying: false, len: dia * 0.8, w: dia * 2.02 };
  }
}

export function nutGeometry(s = 7, h = 3.2, hole = 2) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = [Math.cos(a) * s / Math.sqrt(3), Math.sin(a) * s / Math.sqrt(3)];
    i ? shape.lineTo(...p) : shape.moveTo(...p);
  }
  const hp = new THREE.Path();
  hp.absarc(0, 0, hole, 0, Math.PI * 2, true);
  shape.holes.push(hp);
  return new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 14 });
}

// Örnekli küçük parçalar (vida, somun, pul) bir alana dağıtılır. items: [{geo, mat, n}]
export function scatter(area, items, { seed = 3, lying = true } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  for (const { geo, mat, n } of items) {
    const im = new THREE.InstancedMesh(geo, mat, n);
    im.castShadow = true; im.receiveShadow = true;
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      o.position.set(area.x + (r() - 0.5) * area.w, area.y + (r() - 0.5) * area.d, area.z + (lying ? 2 + r() * 3 : 0));
      if (lying) o.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.4, r() * Math.PI * 2, r() * Math.PI * 2);
      else o.rotation.set((r() - 0.5) * 0.3, (r() - 0.5) * 0.3, r() * Math.PI * 2);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    g.add(im);
  }
  return g;
}

export function coin({ r = 12.5, color = PALETTE.brass } = {}) {
  return mesh(cyl(r, r, 1.9, 32), metal(color, 0.38));
}

export function key({ color = PALETTE.brass } = {}) {
  const g = new THREE.Group();
  const bow = new THREE.Shape();
  bow.absarc(0, 0, 12, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(-4, 0, 3.4, 0, Math.PI * 2, true); bow.holes.push(hole);
  const bg = new THREE.ExtrudeGeometry(bow, { depth: 2.2, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.5, bevelSegments: 2, curveSegments: 24 });
  g.add(mesh(bg, metal(color, 0.35)));
  const blade = new THREE.Shape();
  blade.moveTo(10, -3.5); blade.lineTo(52, -3.5); blade.lineTo(55, 0); blade.lineTo(52, 3.5);
  for (let x = 48; x > 18; x -= 6) { blade.lineTo(x, 3.5); blade.lineTo(x - 1.5, 6); blade.lineTo(x - 3, 3.5); }
  blade.lineTo(10, 3.5);
  g.add(mesh(new THREE.ExtrudeGeometry(blade, { depth: 1.8, bevelEnabled: false }), metal(color, 0.35)));
  return g;
}

export function phone({ color = PALETTE.ink } = {}) {
  const g = new THREE.Group();
  g.add(mesh(rbox(72, 150, 8, 8, 4), clay(color, { rough: 0.35, env: 0.9 })));
  g.add(at(mesh(rbox(66, 142, 0.6, 6, 2), clay(0x1a1d22, { rough: 0.15, env: 1.2 })), 0, 0, 8));
  return g;
}

export function notebook({ w = 148, d = 210, h = 14, color = PALETTE.blue } = {}) {
  const g = new THREE.Group();
  g.add(mesh(rbox(w, d, h, 2.5), clay(color, { rough: 0.75 })));
  g.add(at(mesh(rbox(w - 6, d - 4, h - 3, 1), clay(PALETTE.paper, { rough: 0.95 })), 3, 0, 1.5));
  g.add(at(mesh(rbox(5, d + 0.6, h + 0.6, 1.5), clay(PALETTE.ink, { rough: 0.6 })), w / 2 - 22, 0, -0.3)); // lastik
  return g;
}

export function books({ count = 6, seed = 2, colors = [PALETTE.blue, PALETTE.terracotta, PALETTE.sage, PALETTE.sand, PALETTE.ink, PALETTE.rose], lean = true } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  let x = 0;
  for (let i = 0; i < count; i++) {
    const t = 18 + r() * 22, hh = 190 + r() * 70, dd = 130 + r() * 30;
    const b = new THREE.Group();
    b.add(mesh(rbox(t, dd, hh, 2.5), clay(colors[i % colors.length], { rough: 0.78 })));
    b.add(at(mesh(rbox(t - 4, dd - 3, 2, 0.8), clay(PALETTE.paper, { rough: 0.95 })), 0, 1.5, hh - 0.6));
    b.position.x = x + t / 2;
    if (lean && i === count - 1) { b.rotation.y = -0.32; b.position.x += Math.sin(0.32) * hh * 0.5 + 4; b.position.z = -2; }
    g.add(b);
    x += t + 1;
  }
  g.userData.width = x;
  return g;
}

export function mug({ color = PALETTE.paper, h = 95, r = 41 } = {}) {
  const g = new THREE.Group();
  const outer = [[0, 0], [r - 2, 0], [r, 3], [r, h - 2], [r - 1, h], [r - 5, h], [r - 5, 6], [0, 6]];
  g.add(mesh(lathe(outer, 48), clay(color, { rough: 0.45, env: 0.8 })));
  g.add(at(mesh(cyl(r - 5.5, r - 5.5, 2, 40), clay(0x4a2c1b, { rough: 0.25, env: 1 })), 0, 0, h * 0.72));
  const handle = new THREE.TorusGeometry(24, 6.5, 14, 28, Math.PI);
  handle.rotateX(Math.PI / 2);
  handle.rotateY(Math.PI / 2); // yarım halka +X tarafında, dikey
  const hm = mesh(handle, clay(color, { rough: 0.45, env: 0.8 }));
  hm.position.set(r - 2, 0, h * 0.52);
  g.add(hm);
  return g;
}

// Bitki: saksı + toprak + yapraklar. kind: 'leafy' | 'succulent'
export function plant({ kind = 'leafy', pot = PALETTE.terracotta, size = 1, seed = 5, potShape = null } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const pr = 62 * size, ph = 90 * size;
  if (potShape !== false) {
    g.add(mesh(lathe(potShape || [[0, 0], [pr * 0.78, 0], [pr, ph * 0.92], [pr * 1.06, ph * 0.92], [pr * 1.06, ph], [pr * 0.9, ph], [pr * 0.84, ph * 0.2], [0, ph * 0.2]], 40), clay(pot, { rough: 0.85 })));
  }
  const soilZ = potShape === false ? 0 : ph * 0.86;
  if (potShape !== false) g.add(at(mesh(cyl(pr * 0.92, pr * 0.92, 4, 32), clay(0x5a4232, { rough: 1 })), 0, 0, soilZ));
  const leafMat = clay(PALETTE.leaf, { rough: 0.7 });
  const leafMat2 = clay(PALETTE.leafDark, { rough: 0.7 });
  const leaves = new THREE.Group();
  if (kind === 'succulent') {
    for (let ring = 0; ring < 3; ring++) {
      const n = 7 + ring * 2;
      for (let i = 0; i < n; i++) {
        const lg = new THREE.ConeGeometry(9 * size * (1.2 - ring * 0.25), 46 * size * (1.1 - ring * 0.2), 6);
        const m = mesh(lg, ring % 2 ? leafMat2 : leafMat);
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        m.position.set(Math.cos(a) * (14 - ring * 4) * size, Math.sin(a) * (14 - ring * 4) * size, 18 * size + ring * 8);
        // Koni +Y'yi gösterir: önce dışa doğru çevir (z), sonra yukarı kaldır (x). İç halkalar daha dik.
        m.rotation.set(0, 0, a - Math.PI / 2);
        m.rotateX(0.5 + ring * 0.38);
        leaves.add(m);
      }
    }
  } else {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.5;
      const len = (110 + r() * 80) * size;
      const stem = new THREE.Group();
      const leaf = mesh(new THREE.SphereGeometry(1, 16, 10), i % 3 ? leafMat : leafMat2);
      leaf.scale.set(22 * size, 6 * size, len / 2);
      leaf.position.z = len / 2;
      stem.add(leaf);
      stem.rotation.z = a;
      stem.rotateX(-(0.35 + r() * 0.5));
      leaves.add(stem);
    }
  }
  leaves.position.z = soilZ;
  g.add(leaves);
  g.userData.leaves = leaves;
  return g;
}

// Çiçek: kavisli sap + taç yapraklar. Taban z=0 (vazonun ağzına konur). userData.sway için pivot tabanda.
export function flower({ h = 320, color = 0xf2d16b, petals = 7, seed = 1, bend = 0.18, kind = 'daisy' } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const lean = (r() - 0.5) * bend * 2, lean2 = (r() - 0.5) * bend * 2;
  const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * h * 0.15, lean2 * h * 0.15, h * 0.35), new THREE.Vector3(lean * h * 0.45, lean2 * h * 0.4, h * 0.7), new THREE.Vector3(lean * h * 0.7, lean2 * h * 0.62, h)];
  const curve = new THREE.CatmullRomCurve3(pts);
  g.add(mesh(new THREE.TubeGeometry(curve, 24, 2.2, 6, false), clay(PALETTE.stem, { rough: 0.75 })));
  const head = new THREE.Group();
  head.position.copy(pts[3]);
  // Taç yapraklar: bloom() için kapalı (tomurcuk) ve açık durumları saklanır. Açık durum = varsayılan görünüm.
  const petalData = [];
  const petal = (p, a, r0, r1, z0, z1, t0, t1) => {
    petalData.push({ m: p, a, r0, r1, z0, z1, t0, t1 });
    p.position.set(Math.cos(a) * r1, Math.sin(a) * r1, z1);
    p.rotation.set(0, 0, a);
    p.rotateY(t1);
    head.add(p);
  };
  if (kind === 'tulip') {
    const pm = clay(color, { rough: 0.6 });
    for (let i = 0; i < 6; i++) {
      const p = mesh(new THREE.SphereGeometry(1, 16, 12), pm);
      p.scale.set(13, 7, 26);
      const open = i % 2 ? 0.18 : 0.08;
      petal(p, (i / 6) * Math.PI * 2, 5, 8, 18, 20, -0.12, open);
    }
  } else {
    const pm = clay(color, { rough: 0.65 });
    for (let i = 0; i < petals; i++) {
      const p = mesh(new THREE.SphereGeometry(1, 14, 8), pm);
      p.scale.set(17, 6.5, 2.4);
      petal(p, (i / petals) * Math.PI * 2, 5, 17, 9, 0, -1.3, -0.25);
    }
    head.add(at(mesh(new THREE.SphereGeometry(8.5, 16, 12), clay(0xb8862f, { rough: 0.9 })), 0, 0, 2));
  }
  g.userData.head = head;
  g.userData.petals = petalData;
  // Sapa bir yaprak
  const leaf = mesh(new THREE.SphereGeometry(1, 12, 8), clay(PALETTE.leaf, { rough: 0.7 }));
  leaf.scale.set(26, 5, 9);
  leaf.position.copy(curve.getPoint(0.35)).add(new THREE.Vector3(14, 0, 4));
  leaf.rotation.y = -0.6;
  g.add(leaf);
  g.add(head);
  g.userData.seed = r() * 10;
  return g;
}

// Çiçeğin açılma durumu: k = 0 kısa saplı tomurcuk, 1 tam boy ve açık (flower()'ın varsayılan görünümü).
// Sap tabandan uzar; taç yapraklar merkezden dışa açılır.
export function bloom(f, k) {
  const u = f.userData;
  if (!u.petals) return;
  const kk = Math.max(0, Math.min(1, k));
  const grow = 0.45 + 0.55 * Math.max(0, k); // 1'i biraz aşan k sapı esnetir (yaylanma); taç yapraklar sınırlı
  f.scale.set(1, 1, grow);
  const hs = 0.6 + 0.4 * kk;
  u.head.scale.set(hs, hs, hs / grow); // sap kısalırken taç basılmasın
  for (const p of u.petals) {
    const r = p.r0 + (p.r1 - p.r0) * kk;
    p.m.position.set(Math.cos(p.a) * r, Math.sin(p.a) * r, p.z0 + (p.z1 - p.z0) * kk);
    p.m.rotation.set(0, 0, p.a);
    p.m.rotateY(p.t0 + (p.t1 - p.t0) * kk);
  }
}

// Masa lambası: kollar +X yönüne uzanır, abajur aşağı ve hafif ileri bakar.
// userData.spot = { pos, dir } → sahne buraya sıcak bir SpotLight koyabilir.
export function lamp({ color = PALETTE.ink, bulb = 0xffe2b0, a1 = -0.3, a2 = 1.2, l1 = 330, l2 = 300, tilt = -0.45 } = {}) {
  const g = new THREE.Group();
  const m = clay(color, { rough: 0.4, metal: 0.3 });
  g.add(mesh(cyl(75, 80, 18, 40), m));
  const p0 = new THREE.Vector3(0, 0, 16);
  const d1 = new THREE.Vector3(Math.sin(a1), 0, Math.cos(a1));
  const d2 = new THREE.Vector3(Math.sin(a2), 0, Math.cos(a2));
  const arm1 = mesh(cyl(7, 7, l1, 14), m); arm1.position.copy(p0); arm1.rotation.y = a1; g.add(arm1);
  const J = p0.clone().addScaledVector(d1, l1);
  g.add(at(mesh(new THREE.SphereGeometry(11, 16, 12), m), J.x, J.y, J.z));
  const arm2 = mesh(cyl(6, 6, l2, 14), m); arm2.position.copy(J); arm2.rotation.y = a2; g.add(arm2);
  const T = J.clone().addScaledVector(d2, l2);
  g.add(at(mesh(new THREE.SphereGeometry(9, 16, 12), m), T.x, T.y, T.z));
  const shade = mesh(lathe([[0, 6], [22, 6], [70, -80], [66, -83], [20, 0], [0, 0]], 40), clay(color, { rough: 0.4, metal: 0.3, side: THREE.DoubleSide }));
  shade.position.copy(T);
  shade.rotation.y = tilt;
  g.add(shade);
  const axis = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), tilt);
  const b = mesh(new THREE.SphereGeometry(19, 20, 14), glow(bulb, 2.4), { cast: false });
  b.position.copy(T).addScaledVector(axis, 42);
  g.add(b);
  g.userData.spot = { pos: b.position.clone(), dir: axis };
  return g;
}

export function screwdriver({ len = 210, handle = PALETTE.accent } = {}) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [14, 0], [16, 8], [15, 80], [11, 95], [5, 98], [0, 98]], 24), clay(handle, { rough: 0.45 })));
  g.add(at(mesh(cyl(3, 3, len - 98, 12), metal()), 0, 0, 98));
  g.add(at(mesh(cyl(3, 0.8, 8, 4), metal()), 0, 0, len));
  return g;
}

export function batteryGeometry() {
  return merge([cyl(7, 7, 46, 18), (() => { const t = cyl(2.6, 2.6, 2, 12); t.translate(0, 0, 46); return t; })()]);
}

export function cards({ count = 30, color = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const back = clay(color, { rough: 0.7 });
  const edge = clay(PALETTE.paper, { rough: 0.9 });
  const n = Math.max(1, Math.round(count / 10));
  for (let i = 0; i < n; i++) g.add(at(mesh(rbox(63, 88, 3, 2.5, 1), i === n - 1 ? back : edge), 0, 0, i * 3));
  return g;
}

export function keyboard({ w = 360, d = 120, keyColor = 0xe9e7e1, accent = PALETTE.accent } = {}) {
  const g = new THREE.Group();
  g.add(mesh(rbox(w, d, 14, 5), clay(PALETTE.inkSoft, { rough: 0.5 })));
  const kg = rbox(16.5, 16.5, 7, 2.2, 2);
  const cols = 18, rows = 5;
  const im = new THREE.InstancedMesh(kg, clay(keyColor, { rough: 0.55 }), cols * rows);
  im.castShadow = true; im.receiveShadow = true;
  const o = new THREE.Object3D();
  let k = 0;
  for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
    o.position.set(-w / 2 + 16 + c * 19 + (rr % 2) * 4, -d / 2 + 18 + rr * 19.5, 13);
    o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
  }
  g.add(im);
  g.add(at(mesh(rbox(16.5, 16.5, 7, 2.2, 2), clay(accent, { rough: 0.5 })), w / 2 - 22, -d / 2 + 18, 13));
  return g;
}

// Mekanik klavye (65%, 68 tuş): alüminyum kasa, koyu plaka, yukarı daralan ve tepesi hafif çukur tuşlar.
// Tuş genişlikleri gerçek (1u = 19,05 mm). skip: tuş konmayacak yerler (adlarıyla): oraya özel tuş takılır, altında
// MX anahtarın gövdesi ve artı biçimli sapı görünür. Klavye düz, orijin kasanın alt ortası (eğimi sahne verir).
// Dönüş: Group; userData.keys[ad] = { x, y, u }, userData.capZ = tuş tabanının yüksekliği.
const KB_ROWS = [
  [['esc', 1], ...[...'1234567890'].map((c) => [c, 1]), ['-', 1], ['=', 1], ['bksp', 2], ['del', 1]],
  [['tab', 1.5], ...[...'qwertyuiop'].map((c) => [c, 1]), ['[', 1], [']', 1], ['\\', 1.5], ['pgup', 1]],
  [['caps', 1.75], ...[...'asdfghjkl'].map((c) => [c, 1]), [';', 1], ["'", 1], ['enter', 2.25], ['pgdn', 1]],
  [['lshift', 2.25], ...[...'zxcvbnm'].map((c) => [c, 1]), [',', 1], ['.', 1], ['/', 1], ['rshift', 1.75], ['up', 1], ['end', 1]],
  [['lctrl', 1.25], ['win', 1.25], ['lalt', 1.25], ['space', 6.25], ['ralt', 1], ['fn', 1], ['rctrl', 1], ['left', 1], ['down', 1], ['right', 1]],
];
const KEY_U = 19.05;
const capCache = new Map();
function keycapGeometry(u) {
  if (capCache.has(u)) return capCache.get(u);
  const w = KEY_U * u - 1.25, d = KEY_U - 1.25, h = 8.2;
  let g = new RoundedBoxGeometry(w, d, h, 3, 1.4);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const pos = g.attributes.position, td = (d - 4.6) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = z / h + 0.5; // 0 taban, 1 tepe
    const sx = 1 - (5.6 / w) * t, sy = 1 - (4.6 / d) * t; // tepe her yandan ~2,5 mm içeride
    let zz = z + h / 2;
    if (t > 0.999) zz -= 0.6 * Math.max(0, 1 - ((y * sy) / td) ** 2); // önden arkaya silindirik çukur
    pos.setXYZ(i, x * sx, y * sy, zz);
  }
  g.computeVertexNormals();
  capCache.set(u, g);
  return g;
}
export function mechKeyboard({ alpha = 0xe9e3d3, mod = 0x9c978d, caseColor = 0xb8bdc4, skip = [] } = {}) {
  const g = new THREE.Group();
  const W = 16 * KEY_U, D = 5 * KEY_U, rim = 9, H = 20, plateZ = 13, capZ = 19.5;
  const CW = W + 2 * rim, CD = D + 2 * rim, bar = rim + 0.5;
  // Kasa tepsi biçiminde: taban + dört kenar duvarı (içi açık; plaka ve boş yuvadaki anahtar görünsün)
  const cm = clay(caseColor, { rough: 0.38, metal: 0.55, env: 1 });
  g.add(mesh(rbox(CW, CD, plateZ, 6, 3), cm));
  for (const [w, d, x, y] of [[CW, bar, 0, (CD - bar) / 2], [CW, bar, 0, -(CD - bar) / 2], [bar, CD, (CW - bar) / 2, 0], [bar, CD, -(CW - bar) / 2, 0]]) {
    g.add(at(mesh(rbox(w, d, H, 3, 3), cm), x, y, 0));
  }
  g.add(at(mesh(rbox(W + 1, D + 1, 1.5, 1, 1), clay(0x24272b, { rough: 0.5 }), { cast: false }), 0, 0, plateZ));
  const MODS = new Set(['esc', 'bksp', 'del', 'tab', '\\', 'pgup', 'caps', 'enter', 'pgdn', 'lshift', 'rshift', 'up', 'end',
    'lctrl', 'win', 'lalt', 'ralt', 'fn', 'rctrl', 'left', 'down', 'right']);
  const groups = new Map(); // "u|renk" → konumlar
  const keys = {};
  KB_ROWS.forEach((row, j) => {
    let x = -W / 2;
    const y = (2 - j) * KEY_U; // ilk sıra (rakamlar) arkada
    for (const [name, u] of row) {
      const cx = x + (u * KEY_U) / 2;
      keys[name] = { x: cx, y, u };
      x += u * KEY_U;
      if (skip.includes(name)) continue;
      const k = `${u}|${MODS.has(name) ? 'm' : 'a'}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push([cx, y]);
    }
  });
  const o = new THREE.Object3D();
  for (const [k, list] of groups) {
    const [u, c] = k.split('|');
    const im = new THREE.InstancedMesh(keycapGeometry(+u), clay(c === 'm' ? mod : alpha, { rough: 0.62, env: 0.7 }), list.length);
    im.castShadow = im.receiveShadow = true;
    list.forEach(([x, y], i) => { o.position.set(x, y, capZ); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    g.add(im);
  }
  // Boş yuvalarda MX anahtar: gri gövde, kırmızı artı sap (özel tuş buna takılır)
  for (const name of skip) {
    const { x, y } = keys[name];
    g.add(at(mesh(rbox(14, 14, capZ - plateZ - 1.5, 1.5, 1), clay(0x3a3f46, { rough: 0.45 })), x, y, plateZ + 1.5));
    for (const [sw, sd] of [[4, 1.2], [1.2, 4]]) g.add(at(mesh(rbox(sw, sd, 3.6, 0.3, 1), clay(0xc8402f, { rough: 0.4 })), x, y, capZ - 0.5));
  }
  g.userData.keys = keys;
  g.userData.capZ = capZ;
  g.userData.size = { w: CW, d: CD, h: H };
  return g;
}

// ---------- duvar / oda ögeleri ----------
export function door({ w = 860, h = 2050, color = 0xf1efe9 } = {}) {
  const g = new THREE.Group();
  const fm = clay(0xe9e6de, { rough: 0.6 });
  g.add(at(mesh(rbox(70, 60, h + 70, 4), fm), -w / 2 - 35, 0, 0));
  g.add(at(mesh(rbox(70, 60, h + 70, 4), fm), w / 2 + 35, 0, 0));
  g.add(at(mesh(rbox(w + 140, 60, 70, 4), fm), 0, 0, h));
  const leaf = mesh(rbox(w, 44, h, 3), clay(color, { rough: 0.55 }));
  g.add(leaf);
  // Panel çizgileri
  const pm = clay(0xe4e0d6, { rough: 0.6 });
  g.add(at(mesh(rbox(w - 200, 8, h * 0.38, 3), pm), 0, -22, h * 0.52));
  g.add(at(mesh(rbox(w - 200, 8, h * 0.3, 3), pm), 0, -22, h * 0.1));
  const hm = metal(0x8c939b, 0.3);
  g.add(at(mesh(rbox(30, 12, 150, 6), hm), w / 2 - 70, -28, 960));
  const lever = mesh(rbox(120, 18, 18, 8), hm); lever.position.set(w / 2 - 110, -44, 1040); g.add(lever);
  g.userData.plateZ = 1500;
  return g;
}

export function frame({ w = 420, h = 300, depth = 34, border = 26, color = PALETTE.ink } = {}) {
  // Dik duran çerçeve (XZ düzleminde), ön yüzü -Y. İçi boş: rölyef içine konur.
  const g = new THREE.Group();
  const m = clay(color, { rough: 0.5 });
  const side = (bw, bh, x, z) => g.add(at(mesh(rbox(bw, depth, bh, 3), m), x, 0, z));
  side(w, border, 0, h - border); side(w, border, 0, 0);
  side(border, h, -w / 2 + border / 2, 0); side(border, h, w / 2 - border / 2, 0);
  // Arka pano: çerçevenin arka yüzüne yakın, iç boşluğun ortasında.
  g.add(at(mesh(new THREE.BoxGeometry(w - border * 2 + 2, 4, h - border * 2 + 2), clay(PALETTE.paper)), 0, depth / 2 - 4, h / 2));
  g.userData.inner = { w: w - border * 2, h: h - border * 2 };
  return g;
}

export function easel({ h = 1500, color = PALETTE.woodLight } = {}) {
  const g = new THREE.Group();
  const m = clay(color, { rough: 0.75 });
  for (const sx of [-1, 1]) {
    const leg = mesh(rbox(34, 24, h, 4), m);
    leg.rotation.y = sx * 0.12; leg.position.set(sx * 220, 0, 0); g.add(leg);
  }
  const back = mesh(rbox(30, 24, h * 0.95, 4), m); back.rotation.x = -0.32; back.position.set(0, 60, 0); g.add(back);
  g.add(at(mesh(rbox(560, 70, 26, 4), m), 0, -36, h * 0.42));
  g.userData.ledgeZ = h * 0.42 + 26;
  return g;
}

export function cake({ color = 0xf3e6d6, frosting = 0xe8a7b5 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(cyl(150, 150, 8, 48), clay(0xf4f3ef, { rough: 0.4, env: 0.9 }))); // tabak
  g.add(at(mesh(cyl(110, 110, 80, 48), clay(color, { rough: 0.85 })), 0, 0, 8));
  g.add(at(mesh(cyl(78, 78, 60, 40), clay(color, { rough: 0.85 })), 0, 0, 88));
  const tor = (rr, z) => { const t = new THREE.TorusGeometry(rr, 7, 10, 48); const m = mesh(t, clay(frosting, { rough: 0.7 })); m.position.z = z; g.add(m); };
  tor(108, 86); tor(76, 146);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(at(mesh(new THREE.SphereGeometry(6, 10, 8), clay(0xb8372f, { rough: 0.5 })), Math.cos(a) * 60, Math.sin(a) * 60, 150));
  }
  g.userData.top = 148;
  return g;
}

export function router() {
  const g = new THREE.Group();
  g.add(mesh(rbox(200, 140, 32, 8), clay(0xf1f0ec, { rough: 0.5 })));
  for (const sx of [-1, 1]) {
    const a = mesh(cyl(5, 5, 160, 12), clay(0xf1f0ec, { rough: 0.5 }));
    a.rotation.y = sx * 0.15; a.position.set(sx * 80, 60, 26); g.add(a);
  }
  for (let i = 0; i < 4; i++) g.add(at(mesh(new THREE.SphereGeometry(2.4, 8, 6), glow(i === 0 ? 0x5fd17a : 0x7fb8ff, 2)), -60 + i * 16, -70, 18));
  return g;
}

export function cafeCup() {
  const g = new THREE.Group();
  g.add(mesh(cyl(70, 66, 6, 40), clay(0xf4f3ef, { rough: 0.35, env: 0.9 })));
  const c = mug({ color: 0xf4f3ef, h: 62, r: 38 });
  c.position.z = 5; g.add(c);
  return g;
}

export function giftBox({ w = 140, d = 140, h = 90, color = PALETTE.blue, ribbon = PALETTE.yellow } = {}) {
  const g = new THREE.Group();
  g.add(mesh(rbox(w, d, h, 3), clay(color, { rough: 0.7 })));
  g.add(at(mesh(rbox(w + 6, d + 6, 22, 3), clay(color, { rough: 0.7 })), 0, 0, h - 14));
  const rm = clay(ribbon, { rough: 0.5 });
  g.add(at(mesh(rbox(18, d + 8, h + 9, 2), rm), 0, 0, 0));
  g.add(at(mesh(rbox(w + 8, 18, h + 9, 2), rm), 0, 0, 0));
  for (const s of [-1, 1]) {
    const b = mesh(new THREE.TorusGeometry(18, 6, 10, 24), rm);
    b.rotation.set(Math.PI / 2, 0, s * 0.5); b.position.set(s * 16, 0, h + 20); g.add(b);
  }
  return g;
}

export function turntable({ r = 130 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(cyl(r, r + 4, 18, 64), clay(PALETTE.ink, { rough: 0.45 })));
  const spin = new THREE.Group();
  spin.add(mesh(cyl(r - 8, r - 8, 8, 64), clay(PALETTE.woodLight, { rough: 0.7 })));
  spin.position.z = 18;
  g.add(spin);
  g.userData.spin = spin;
  g.userData.top = 26;
  return g;
}

// Ahşap etiketsiz kutu/stand (QR standı, kartvizitlik vb. için basit kama).
// Kama profilli stand. Profil YZ düzleminde (y: derinlik, z: yükseklik), X boyunca w kadar uzar.
// Eğik yüz -Y'ye (izleyiciye) bakar; karo bu yüze yaslanır.
export function wedgeStand({ w = 120, d = 70, h = 60, color = PALETTE.woodLight } = {}) {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(d / 2, h); s.lineTo(d / 2 - 14, h); s.lineTo(-d / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelSize: 1.2, bevelThickness: 1.2, bevelSegments: 2 });
  // Şekil (x, y) + çekim z → dünya (z, x, y): şekil x → dünya y, şekil y → dünya z, çekim → dünya x.
  geo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -bb.min.z);
  return mesh(geo, clay(color, { rough: 0.75 }));
}
