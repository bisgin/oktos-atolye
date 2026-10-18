// Oda sahnesinin ürünleri: her bölgenin şablon listesi (TEMPLATES) ve bir şablonun 3B modelini üreten işlev
// (buildTemplate). Modeller araçların kendi üreticilerinden (Kutu, Vazo: TOOL.build), hikâye sahnelerinin parça
// üreticilerinden (Flip, Painter, Puzzle) ve QR, Clicker, 3D Yazı için eski vitrinin biçimlerinden gelir.
// Model tabanı z = 0, ön yüzü −y; birim mm. preset yalnız atölyesi hazır araçlarda ("Bu şablonla tasarla").
import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import * as P from './props.js';
import { initCSG } from './csg.js';
import { toGeometry, positions3 } from './mesh3.js';
import { solid, fonts, textSolid, standUp, plate, C } from './scene-kit.js';
import { STORIES } from './story-data.js';
import { TOOL as BIN } from '../tools/bin/app.js';
import { TOOL as VASE } from '../tools/vase/app.js';

const K = P.PALETTE;
const TAU = Math.PI * 2;
const pla = (c) => P.clay(c, { rough: 0.46, env: 0.85 });
// Eğri yüzeyler yumuşak, kesik kenarlar keskin (solid() düz gölgeler)
const smooth = (m, crease = 0.5) => { m.geometry = toCreasedNormals(m.geometry, crease); return m; };
const yieldMain = () => globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));
// Parçanın dönme noktası kendi ortası olsun (sahnedeki yeri değişmez)
function recenter(m) {
  m.geometry.computeBoundingBox();
  const c = m.geometry.boundingBox.getCenter(new THREE.Vector3());
  m.geometry.translate(-c.x, -c.y, -c.z);
  m.position.add(c);
  return m;
}

// ---- şablon listeleri ----
const binName = (id) => ({ tr: BIN.strings.tr['pr.' + id], en: BIN.strings.en['pr.' + id] });
const vaseName = (id) => ({ tr: VASE.strings.tr['pr.' + id], en: VASE.strings.en['pr.' + id] });
const storyName = (tool, id) => ({ tr: STORIES[tool].hotspots[id].tr, en: STORIES[tool].hotspots[id].en });
// over: aracın şablonu üstüne ölçü farkı (varsa "Bu şablonla tasarla" ölçüleri adrese yazar, bkz. sablonDegeri)
const T = (id, name, preset = null, over = null, renk = null) => ({ id, name, preset, over, renk });
const n2 = (tr, en) => ({ tr, en });
export const TEMPLATES = {
  // Çekmece şablonları Kutu aracının paletinden ayrı renklerde: değişim çekmecenin beyaz içinde fark edilsin
  cekmece: [
    T('drawer', binName('drawer'), 'drawer', null, '#d4621f'),
    T('screws', binName('screws'), 'screws', null, '#3f6fb0'),
    T('g4', binName('g4'), 'g4', null, '#8fa58a'),
    T('karma', n2('Gridfinity karışık', 'Gridfinity mix'), 'g3', null, '#b8372f'),
    T('tools', n2('Alet bölmeleri', 'Tool caddies'), 'tools', null, '#2b3036'),
    T('cards', n2('Kart kutuları', 'Card boxes'), 'cards', null, '#d4621f'),
    T('uzun', n2('Uzun bölmeler', 'Long compartments'), 'drawer', { w: 360, d: 480, h: 50, cols: 4, rows: 1, holes: false }, '#ece9e2'),
    T('desk', n2('Masa düzenleyiciler', 'Desk organizers'), 'desk', null, '#3f6fb0'),
    T('tray', n2('Küçük tepsiler', 'Small trays'), 'tray', null, '#8fa58a'),
    T('roundtray', n2('Yuvarlak tepsiler', 'Round trays'), 'roundtray', null, '#b8372f'),
  ],
  kalemlik: [
    T('pencup', binName('pencup'), 'pencup'),
    T('pencup3', binName('pencup3'), 'pencup3'),
    T('uzun', n2('İnce uzun kalemlik', 'Tall slim cup'), 'pencup', { w: 66, h: 125 }, '#2b3036'),
    T('ikili', n2('İki bölmeli', 'Two-way cup'), 'pencup3', { cols: 2, w: 90, h: 100 }, '#d4621f'),
    T('dortlu', n2('Dört bölmeli', 'Four-way cup'), 'pencup3', { cols: 4, w: 110, h: 100 }, '#3f6fb0'),
    T('halka', n2('Halkalı kalemlik', 'Ring cup'), 'pencup3', { cols: 6, rows: 2, w: 112, h: 90 }, '#c9b596'),
    T('kare', n2('Kare kalemlik', 'Square cup'), 'tray', { w: 90, d: 90, h: 105, cols: 2, rows: 2, r: 10 }, '#ece9e2'),
    T('ikiz', n2('Yan yana kalemlik', 'Twin cup'), 'tray', { w: 130, d: 72, h: 100, cols: 2, rows: 1, r: 12 }, '#8fa58a'),
  ],
  klavye: [T('cat', storyName('clicker', 'cat')), T('heart', { tr: 'Kalp clicker', en: 'Heart clicker' }), T('star', { tr: 'Yıldız clicker', en: 'Star clicker' })],
  modem: ['wifi', 'card', 'key'].map((id) => T(id, storyName('qr', id))),
  puzzle3d: [T('sphere', storyName('puzzle', 'sphere')), T('cube', storyName('puzzle', 'cube')), T('egg', { tr: 'Yumurta yapboz', en: 'Egg puzzle' }), T('heart', { tr: 'Kalp yapboz', en: 'Heart puzzle' })],
  tabela: [T('plate', { tr: 'Plakalı', en: 'On a plate' }), T('letters', { tr: 'Harf harf', en: 'Letter by letter' }), T('round', { tr: 'Yuvarlak plaka', en: 'Rounded plate' })],
  saksilar: ['hex', 'square', 'flower', 'organic', 'twist', 'morph', 'amphora'].map((id) => T(id, vaseName(id), id)),
  balkonMasa: [T('menu', storyName('qr', 'menu')), T('coaster', { tr: 'Bardak altlığı', en: 'Coaster' })],
  buzdolabi: [T('iyi', { tr: '"İyi ki doğdun"', en: '"Happy birthday"' }), T('nice', { tr: '"Nice yıllara"', en: '"Many more"' })],
  flip: ['family', 'us', 'sea'].map((id) => T(id, storyName('flip', id))),
  cerceve: [T('mountain', { tr: 'Gün batımı', en: 'Sunset' }), T('sea', { tr: 'Deniz', en: 'Sea' }), T('lake', { tr: 'Göl', en: 'Lake' })],
  yapboz: [T('picture', { tr: 'Resimli yapboz', en: 'Picture puzzle' })],
};

// Ölçü farkı olan şablonun araçta birebir açılması için tam durum (mode + şablon değerleri + fark); yoksa null.
// ?sablon= ölçüleri şablonunkine sıfırlar: bu şablonlarda sayfa bunun yerine bu değerleri adrese yazar.
export function sablonDegeri(zone, id) {
  const t = TEMPLATES[zone]?.find((x) => x.id === id);
  if (!(t?.over || t?.renk) || !t.preset) return null;
  const p = BIN.presets.find((x) => x.id === t.preset);
  if (!p) return null;
  return { ...(p.mode ? { mode: p.mode } : {}), ...p.values, ...(t.over || {}), ...(t.renk ? { color: t.renk } : {}) };
}

// ---- Kutu ve Vazo: araçların kendi üreticileri ----
export function binModel(id, over = {}) {
  const p = BIN.presets.find((x) => x.id === id);
  const s = { ...BIN.defaults, ...(p.mode ? { mode: p.mode } : {}), ...p.values, ...over, _thumb: true };
  BIN.enforce(s);
  const g = new THREE.Group();
  for (const part of BIN.build(s).parts) if (!part.ghost) g.add(P.mesh(toGeometry(part.result), P.clay(over.color ?? p.color, { rough: 0.55, env: 0.7 })));
  return g;
}
// toprak: verilirse (malzeme) saksı ağzın 12 mm altına kadar toprakla dolar; malzeme: renkten malzeme üreten işlev
export function vaseModel(id, over = {}, { toprak = null, malzeme = null } = {}) {
  const p = VASE.presets.find((x) => x.id === id);
  const s = { ...VASE.defaults, ...p.values, ...over, _thumb: true };
  VASE.enforce(s);
  const g = new THREE.Group(), res = VASE.build(s).parts[0].result, renk = over.color ?? p.color;
  g.add(P.mesh(toGeometry(res, { flat: false }), malzeme ? malzeme(renk) : P.clay(renk, { rough: 0.42, env: 0.9 })));
  g.userData.h = s.height;
  if (toprak) {
    const z = s.height - 12, geo = toprakKapagi(res, z);
    if (geo) {
      const m = new THREE.Mesh(geo, toprak);
      m.position.z = z;
      m.receiveShadow = true;
      g.add(m);
      g.userData.soil = z;
    }
  }
  return g;
}
// Saksının kendi gövdesi z yüksekliğinde dilimlenir: içi boşsa kesitteki delik (iç kenar), doluysa dış kenarın 2,5 mm içi
// toprağın biçimi olur. Her şablona (altıgen, kare, çiçek ...) kendiliğinden uyar. Doku koordinatı mm / 250.
// res: aracın örgü verisi (scope() katıyı siler): dilim için katı yeniden kurulur, iş bitince elle silinir.
const xy = (v) => (Array.isArray(v) ? v : [v.x ?? v[0], v.y ?? v[1]]);
function toprakKapagi(res, z) {
  const kati = C.fromMesh(positions3(res), res.indices);
  let polys;
  try {
    const cs = kati.slice(z);
    polys = cs.toPolygons().map((q) => q.map(xy)); // manifold noktaları {x, y} nesnesi olarak verir
    cs.delete();
  } finally {
    kati.delete();
  }
  if (!polys.length) return null;
  const alan = (q) => q.reduce((a, v, i) => { const w = q[(i + 1) % q.length]; return a + v[0] * w[1] - w[0] * v[1]; }, 0) / 2;
  const delikler = polys.filter((q) => alan(q) < 0).sort((a, b) => alan(a) - alan(b));
  let pts = delikler.length ? delikler[0].slice().reverse() : null;
  if (!pts) {
    const dis = polys.slice().sort((a, b) => alan(b) - alan(a))[0];
    const a = C.poly2(dis), b = C.offset2(a, -2.5);
    pts = b.toPolygons()[0]?.map(xy);
    a.delete();
    b.delete();
    if (!pts) return null;
  }
  const geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 250, pos.getY(i) / 250);
  return geo;
}
// Kutunun bölme merkezleri (kalem dizmek için): yuvarlakta dilimler (rows 2: ortada halka), köşelide ızgara
function bolmeMerkezleri(v) {
  if (v.shape === 'round') {
    const R = v.w / 2, out = v.rows > 1 ? [[0, 0]] : [];
    if (v.cols <= 1) return [[0, 0]];
    const r = v.rows > 1 ? R * 0.68 : R * 0.48;
    for (let i = 0; i < v.cols; i++) { const a = ((i + 0.5) / v.cols) * TAU; out.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return out;
  }
  const out = [];
  for (let i = 0; i < v.cols; i++) for (let j = 0; j < (v.rows || 1); j++) out.push([((i + 0.5) / v.cols - 0.5) * v.w, ((j + 0.5) / (v.rows || 1) - 0.5) * v.d]);
  return out;
}
// Kalemliğin içinde dışa yaslı kalemler (içerik)
function pencils(g, centers, r = 14) {
  const cols = [0xf2c14e, 0x3f6fb0, 0xb8372f, 0x2b3036, 0x8fa58a, 0xf2c14e];
  let k = 0;
  for (const [cx, cy] of centers) {
    for (let i = 0; i < 2; i++, k++) {
      const a = (i / 2) * TAU + k, pen = P.mesh(P.cyl(4, 4, 168 + (k % 3) * 10, 8), P.clay(cols[k % cols.length], { rough: 0.6 }));
      pen.position.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4);
      pen.rotation.set(-Math.sin(a) * 0.14, Math.cos(a) * 0.14, 0);
      g.add(pen);
    }
  }
}

// ---- Clicker: anahtarlık fidget'lar (gövde ikiye bölünür, üst yarısı basılır) ----
const catHead = () => C.union([
  C.scale(C.sphere(26, 48), [1, 0.92, 0.82]),
  C.move(C.rot(C.cyl(16, 9, 0.5, 4), 0, -18, 0), -13, 0, 13),
  C.move(C.rot(C.cyl(16, 9, 0.5, 4), 0, 18, 0), 13, 0, 13),
]);
const starPts = (R, r) => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * TAU + Math.PI / 2, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });
const heartPts = (k) => Array.from({ length: 72 }, (_, i) => {
  const t = (i / 72) * TAU;
  return [-16 * Math.sin(t) ** 3 * k, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * k];
});
const keyRing = (x, y, rz) => {
  const m = P.mesh(new THREE.TorusGeometry(10, 1.15, 10, 40), P.metal(0xc9ccd1, 0.3));
  m.position.set(x, y, 1.15);
  m.rotation.z = rz;
  return m;
};
const ringTab = (x, y) => C.sub(C.cyl(5, 6.5, 6.5, 32, x, y, 0), C.cyl(7, 3, 3, 24, x, y, -1));
function keychain(id) {
  const g = new THREE.Group();
  if (id === 'cat') {
    const H = 22, body = () => C.move(catHead(), 0, 0, 21.3);
    g.add(smooth(solid(() => C.union([C.splitZ(body(), H)[1], ringTab(-27, 0)]), pla(K.accent))));
    const top = smooth(solid(() => C.splitZ(body(), H + 0.9)[0], pla(0xf3efe6)));
    for (const sx of [-1, 1]) top.add(P.mesh(new THREE.SphereGeometry(2.6, 14, 10), P.clay(K.ink, { rough: 0.3 })).translateX(sx * 8).translateY(-21).translateZ(H + 10));
    top.add(P.mesh(new THREE.SphereGeometry(1.8, 12, 8), P.clay(0xe48a8a)).translateY(-23).translateZ(H + 5));
    g.add(top, keyRing(-36, -2, 0));
    return g;
  }
  const [pts, tabAt, body, cap, ringAt] = id === 'heart'
    ? [heartPts(1.85), [33, 13], K.red, K.rose, [42.4, 16.4, 0.3]]
    : [starPts(30, 13), [0, 33], K.blue, K.yellow, [0, 42, -0.2]];
  g.add(smooth(solid(() => C.union([C.extrude(C.poly2(pts), 11), ringTab(...tabAt)]), pla(body))));
  g.add(smooth(solid(() => C.move(C.extrude(C.offset2(C.poly2(pts), -1.2), 7), 0, 0, 11.6), pla(cap))), keyRing(...ringAt));
  return g;
}

// ---- QR: karo (taban + kabarık modüller), dik stand, kartvizit, anahtarlık, altlık ----
let qrLib = null;
const SITE = 'https://bisgin.github.io/oktos-atolye/';
async function qrTile(text, { size, color = K.ink, base = P.clay(0xf4f2ec, { rough: 0.55 }), corner = 6, header = null, fs }) {
  qrLib ||= (await import('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm')).default;
  const q = qrLib(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount(), cell = size / (n + 4), headH = header ? size * 0.28 : 0;
  const g = new THREE.Group();
  g.add(P.mesh(P.rbox(size, size + headH, 3, corner), base).translateY(headH / 2));
  let count = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) count++;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(cell * 1.001, cell * 1.001, 1.4), P.clay(color, { rough: 0.45 }), count);
  im.castShadow = im.receiveShadow = true;
  const o = new THREE.Object3D();
  let k = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!q.isDark(r, c)) continue;
    o.position.set(-size / 2 + (c + 2.5) * cell, size / 2 - (r + 2.5) * cell, 3.7);
    o.updateMatrix();
    im.setMatrixAt(k++, o.matrix);
  }
  g.add(im);
  if (header) {
    g.add(solid(() => {
      const t = textSolid(fs, header, headH * 0.62, 1.4, { spacing: 0.4 });
      return C.move(t.solid, 0, size / 2 + headH * 0.5 - t.cap / 2 - 1, 3);
    }, P.clay(color, { rough: 0.45 })));
  }
  g.userData.size = size;
  return g;
}
// Karoyu kaideye geriye yaslı diker; ön yüzü −y
function standing(t, { baseW, color = K.woodLight }) {
  const g = new THREE.Group(), holder = new THREE.Group();
  t.position.y = t.userData.size / 2;
  holder.add(t);
  holder.rotation.x = Math.PI / 2 - 0.25;
  holder.position.set(0, -4, 12);
  g.add(P.mesh(P.rbox(baseW, 46, 14, 5), P.clay(color, { rough: 0.7 })), holder);
  return g;
}

// ---- Puzzle: 3B yapbozlar (dikey kesici prizmalarla parçalanmış katılar) ve resimli düz yapboz ----
async function puzzle3d(id) {
  const { jigsaw } = await import('../tools/puzzle/scene.js');
  const cut = (c) => C.extrude(C.offset2(C.polys2([c.poly]), -0.4), 400, -200);
  const g = new THREE.Group();
  if (id === 'sphere') {
    const R = 66, colors = [K.accent, K.sand, K.sage, K.blue, K.accent, K.rose, K.sand, K.sage, K.ink];
    for (const [k, c] of jigsaw(3, 3, 44, 11).entries()) {
      const m = solid(() => C.inter(C.move(C.sphere(R, 72), 0, 0, R), cut(c)), pla(colors[k]), { flat: false });
      m.position.z = 10;
      g.add(recenter(m));
      await yieldMain();
    }
    g.add(P.mesh(P.cyl(40, 46, 10, 40), P.clay(K.paper, { rough: 0.6 })));
  } else if (id === 'cube') {
    const S = 84, colors = [K.blue, K.yellow, K.red, K.sage];
    for (const [k, c] of jigsaw(2, 2, 42, 5).entries()) g.add(solid(() => C.inter(C.box(S, S, S, -S / 2, -S / 2, 0), cut(c)), pla(colors[k])));
  } else if (id === 'egg') {
    const R = 46, KZ = 1.32, colors = [K.yellow, K.cream, K.rose, K.cream, K.yellow, K.sage, K.rose, K.cream, K.yellow];
    for (const [k, c] of jigsaw(3, 3, 31, 17).entries()) {
      const m = solid(() => C.inter(C.move(C.scale(C.sphere(R, 64), [1, 1, KZ]), 0, 0, R * KZ), cut(c)), pla(colors[k]), { flat: false });
      if (!m.geometry.attributes.position.count) continue;
      m.position.z = 12;
      g.add(m);
      await yieldMain();
    }
    g.add(P.mesh(P.cyl(24, 30, 14, 40), P.clay(K.blue, { rough: 0.55 })));
  } else {
    const S = 2.6, D = 22, lift = 17 * S - 2.5 * S + 6;
    const shape = heartPts(S), colors = [K.red, K.rose, K.accent, K.rose, K.red, K.rose, K.accent, K.red, K.rose];
    g.add(solid(() => plate(50, 28, 12, 5), pla(K.woodDark)));
    for (const [k, c] of jigsaw(3, 3, 30, 13).entries()) {
      const m = solid(() => C.move(standUp(C.inter(C.extrude(C.poly2(shape), D), C.extrude(C.offset2(C.polys2([c.poly]), -0.4), D + 2, -1)), D), 0, -D / 2, lift), pla(colors[k]));
      if (m.geometry.attributes.position.count) g.add(m);
      await yieldMain();
    }
  }
  return g;
}
// Resimli düz yapboz (gün batımında dağlar): XY'de yatar, w × h mm, kalınlık 6
export async function picturePuzzle({ cols = 4, rows = 3, cell = 130 } = {}) {
  const { jigsaw } = await import('../tools/puzzle/scene.js');
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const g2 = cv.getContext('2d');
  const sky = g2.createLinearGradient(0, 0, 0, 384);
  sky.addColorStop(0, '#9fc1d8'); sky.addColorStop(0.6, '#f4e3c3'); sky.addColorStop(1, '#e9b07a');
  g2.fillStyle = sky; g2.fillRect(0, 0, 512, 384);
  const ridge = (base, amp, f, col, ph) => { g2.fillStyle = col; g2.beginPath(); g2.moveTo(0, 384); for (let x = 0; x <= 512; x += 4) g2.lineTo(x, base - amp * (Math.sin(x * f + ph) * 0.6 + Math.sin(x * f * 2.3 + ph) * 0.4)); g2.lineTo(512, 384); g2.fill(); };
  g2.fillStyle = '#fff4dc'; g2.beginPath(); g2.arc(370, 130, 36, 0, TAU); g2.fill();
  ridge(235, 44, 0.012, '#c27d55', 1); ridge(280, 36, 0.02, '#8c4f3a', 3); ridge(335, 24, 0.03, '#3d3a46', 5);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, envMapIntensity: 0.6 });
  const W = cols * cell, H = rows * cell, g = new THREE.Group();
  for (const c of jigsaw(cols, rows, cell, 7)) {
    const m = solid(() => C.extrude(C.offset2(C.polys2([c.poly]), -0.5), 6), top);
    const pos = m.geometry.attributes.position, uv = new Float32Array(pos.count * 2);
    for (let v = 0; v < pos.count; v++) { uv[v * 2] = pos.getX(v) / W + 0.5; uv[v * 2 + 1] = pos.getY(v) / H + 0.5; }
    m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.add(m);
    await yieldMain();
  }
  g.userData.size = [W, H];
  return g;
}

// ---- 3D Yazı: kapı üstü plakası ve pasta süsü (yazı dik, ön yüzü −y) ----
// Orijin: duvar yüzü (y = 0) ve plakanın alt kenarı; plaka 140 mm yüksek, yazı ortasında. 'letters': plakasız,
// harfler doğrudan duvarda.
function signModel(id, fs, text) {
  const g = new THREE.Group(), size = 62, depth = id === 'letters' ? 14 : 5, back = id === 'letters' ? 0 : 14;
  let w = 0;
  const letters = solid(() => {
    const t = textSolid(fs, text, size, depth, { spacing: 2 });
    w = t.width;
    return C.move(standUp(t.solid, depth), 0, -depth - back, 70 - t.cap / 2);
  }, id === 'plate' ? pla(0xf3efe6) : pla(K.ink));
  if (id === 'plate') g.add(solid(() => C.move(standUp(plate(w + 80, 140, 14, 10), 14), 0, -14, 70), pla(K.ink)));
  if (id === 'round') g.add(solid(() => C.move(standUp(plate(w + 110, 150, 14, 70), 14), 0, -14, 70), pla(0xece5d8)));
  g.add(letters);
  return g;
}
function cakeTopper(fs, text) {
  return solid(() => {
    const t = textSolid(fs, text, 30, 3, { spacing: 0.5 });
    const bar = C.move(plate(t.width + 8, 5, 3, 2), 0, -2.2, 0);
    const sticks = [-0.3, 0.3].map((k) => C.move(C.box(3, 46, 3, -1.5, -46, 0), t.width * k, 0, 0));
    return C.move(standUp(C.union([t.solid, bar, ...sticks]), 3), 0, -1.5, 46);
  }, pla(K.yellow));
}
const TOPPER = { iyi: { tr: 'İyi ki doğdun', en: 'Happy birthday' }, nice: { tr: 'Nice yıllara', en: 'Many more' } };
const SIGN = { tr: 'Oksijen alma alanı', en: 'Fresh air zone' };
const FLIP = {
  tr: { family: ['ANNE', 'BABA'], us: ['SEN', 'BEN'], sea: ['ADA', 'EGE'] },
  en: { family: ['MOM', 'DAD'], us: ['YOU', 'ME'], sea: ['SEA', 'SUN'] },
};
const RELIEF = { mountain: ['mountain', 'sunset', 7], sea: ['sea', 'sea', 5], lake: ['lake', 'lake', 3] };

// Bir bölgenin bir şablonunu üretir. lang: yazılı ürünler (plaka, pasta süsü, Flip, QR başlığı) için.
// saksi: fotogerçekçi odada saksılara toprak ve baskı malzemesi ({ toprak, malzeme }, vaseModel'e gider).
// pasta: fotogerçekçi odada gerçek pasta modeli (kopyalanır); pasta süsümüz onun üstüne batar.
export async function buildTemplate(zone, id, { lang = 'tr', saksi = {}, pasta = null } = {}) {
  await initCSG();
  const fs = await fonts(700);
  switch (zone) {
    case 'cekmece': {
      // Çekmecenin içi ~400 × 560 mm: tek parça ya da birkaç kutunun dizilişi; renk şablon listesinden
      const color = TEMPLATES.cekmece.find((x) => x.id === id)?.renk, R = color ? { color } : {};
      if (id === 'drawer') return binModel('drawer', { w: 370, d: 500, h: 45, cols: 4, rows: 4, ...R });
      if (id === 'screws') return binModel('screws', { w: 320, d: 320, h: 32, ...R });
      if (id === 'uzun') return binModel('drawer', { w: 360, d: 480, h: 50, cols: 4, rows: 1, holes: false, ...R });
      const G0 = { magnets: 'none', screws: 'none', ...R }; // Gridfinity: mıknatıs ve vida deliği yok (hızlı)
      const dizi = (bin, yerler, g = new THREE.Group()) => {
        for (const [x, y, rz = 0] of yerler) {
          const c = bin.clone();
          c.position.set(x, y, 0);
          c.rotation.z = rz;
          g.add(c);
        }
        return g;
      };
      if (id === 'g4') return dizi(binModel('g4', G0), [[-64, -92], [64, -92], [-64, 0], [64, 0], [-64, 92], [64, 92]]);
      if (id === 'tools') return dizi(binModel('tray', R), [[-55, 150], [55, 150]], dizi(binModel('tools', R), [[-48, -125, Math.PI / 2], [48, -125, Math.PI / 2]]));
      if (id === 'cards') return dizi(binModel('cards', R), [-108, 0, 108].flatMap((x) => [-84, 0, 84].map((y) => [x, y])));
      if (id === 'desk') return dizi(binModel('desk', R), [[0, -70], [0, 60]]);
      if (id === 'tray') return dizi(binModel('tray', R), [[-55, -45], [55, -45], [-55, 45], [55, 45]]);
      if (id === 'roundtray') return dizi(binModel('roundtray', R), [[0, -90], [0, 90]]);
      // Gridfinity karışık: 42 mm ızgarada 8 × 6 hücre (yüksek kutu, vida kutusu, etiketli, tekli, alçak tepsi)
      const kutu = {}, g = new THREE.Group(), U = 42;
      const yerlesim = [['g3', 0, 0, 2, 2], ['g5', 2, 0, 2, 2], ['g2', 4, 0, 2, 1], ['g2', 4, 1, 2, 1], ['g1', 6, 0], ['g1', 7, 0], ['g1', 6, 1], ['g1', 7, 1],
        ['g6', 0, 2, 4, 2], ['g2', 4, 2, 2, 1], ['g2', 4, 3, 2, 1], ['g1', 6, 2], ['g1', 7, 2], ['g1', 6, 3], ['g1', 7, 3], ['g6', 0, 4, 4, 2], ['g5', 4, 4, 2, 2], ['g3', 6, 4, 2, 2]];
      for (const [b, cx, cy, w = 1, h = 1] of yerlesim) {
        kutu[b] ||= binModel(b, G0);
        const c = kutu[b].clone();
        c.position.set((cx + w / 2 - 4) * U, (cy + h / 2 - 3) * U, 0);
        g.add(c);
      }
      return g;
    }
    case 'kalemlik': {
      const t = TEMPLATES.kalemlik.find((x) => x.id === id), p = BIN.presets.find((x) => x.id === t.preset);
      const v = { ...p.values, ...(t.over || {}) };
      const g = binModel(t.preset, { ...(t.over || {}), ...(t.renk ? { color: t.renk } : {}) });
      pencils(g, bolmeMerkezleri(v), v.cols * (v.rows || 1) > 1 ? 7 : 16);
      return g;
    }
    case 'klavye': return keychain(id);
    case 'modem': {
      if (id === 'wifi') return standing(await qrTile('WIFI:T:WPA;S:Oktos Misafir;P:ornek-sifre;;', { size: 70, header: 'Wi-Fi', fs }), { baseW: 82 });
      if (id === 'card') {
        const card = new THREE.Group(), cq = await qrTile(SITE, { size: 40, corner: 2, fs });
        card.add(P.mesh(P.rbox(85, 55, 1.2, 3, 1), P.clay(0xf6f3ec, { rough: 0.7 })).translateY(27.5));
        cq.scale.set(1, 1, 0.5);
        cq.position.set(-18, 27.5, 1);
        card.add(cq);
        card.userData.size = 0; // standing() kartı alt kenarından tutar
        return standing(card, { baseW: 92, color: K.ink });
      }
      const tag = new THREE.Group(), kq = await qrTile(SITE, { size: 40, base: P.clay(K.yellow, { rough: 0.5 }), corner: 5, fs });
      tag.add(kq, keyRing(0, 32, 0));
      const key = P.key({ color: K.brass });
      key.position.set(12, 50, 0.5);
      key.rotation.z = 0.9;
      tag.add(key);
      tag.rotation.z = 0.35;
      return tag;
    }
    case 'puzzle3d': return puzzle3d(id);
    case 'tabela': return signModel(id, fs, SIGN[lang] || SIGN.tr);
    case 'saksilar': return vaseModel(id, {}, saksi);
    case 'balkonMasa': {
      if (id === 'menu') return standing(await qrTile(SITE, { size: 74, color: K.accent, header: lang === 'en' ? 'Menu' : 'Menü', fs }), { baseW: 86, color: K.ink });
      const g = new THREE.Group(), aq = await qrTile(SITE, { size: 54, corner: 3, fs });
      g.add(P.mesh(P.cyl(46, 46, 4, 64), P.clay(0xb38e64, { rough: 0.9 })));
      aq.scale.set(1, 1, 0.6);
      aq.position.z = 3.4;
      g.add(aq);
      return g;
    }
    case 'buzdolabi': {
      const g = new THREE.Group();
      let ust = 70; // pastanın üst yüzü (krema)
      if (pasta) {
        const p = pasta.clone();
        g.add(p);
        ust = new THREE.Box3().setFromObject(p).max.z - 16; // çileklerin altı
      } else g.add(P.mesh(P.cyl(100, 100, 70, 40), P.clay(0xf3e6d6, { rough: 0.7 })));
      const top = cakeTopper(fs, TOPPER[id][lang] || TOPPER[id].tr);
      top.position.z = ust - 26; // çubuklar 26 mm pastaya girer
      g.add(top);
      return g;
    }
    case 'flip': {
      const { flipSolid } = await import('../tools/flip/scene.js');
      const [a, b] = (FLIP[lang] || FLIP.tr)[id];
      return smooth(solid(() => flipSolid(fs, a, b, 40), pla(K.sage)));
    }
    case 'cerceve': {
      const { landscape, reliefGeometry, FILAMENTS } = await import('../tools/painter/scene.js');
      const [kind, pal, seed] = RELIEF[id];
      const m = new THREE.Mesh(reliefGeometry(landscape(kind, 160, 112, seed), 560, 392, { colors: FILAMENTS[pal] }),
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, envMapIntensity: 0.6 }));
      m.castShadow = m.receiveShadow = true;
      m.rotation.x = Math.PI / 2; // rölyef yüzü −y'ye
      return m;
    }
    case 'yapboz': {
      const g = await picturePuzzle();
      g.rotation.x = Math.PI / 2; // resim yüzü −y'ye
      return g;
    }
    default: throw new Error('bilinmeyen bölge: ' + zone);
  }
}
