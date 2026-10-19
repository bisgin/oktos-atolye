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
const U = (t, urun) => ({ ...t, urun });
// Çoklu yuva: bölgede birden çok ürün birlikte durur, şablon yalnız kendi ürününü değiştirir; seçili ürün öne kalkar.
// yer: ürünün yuvadaki yeri [x, y, z] mm; kalk: seçilince yükselme (mm); egim: seçilince ön kenarı üstünde kameraya
// doğru dikelme (rad); dur: seçili değilken eğim. Standlar seçilince biraz öne eğilir. (QR anahtarlık rafta değil,
// dolabın üstündeki anahtar tepsisinde: anahtarlik bölgesi.)
export const COKLU = {
  modem: {
    wifi: { yer: [-160, -15, 36], kalk: 12, egim: 0.16 },
    card: { yer: [0, 0, 0], kalk: 12, egim: 0.16 },
  },
};
export const TEMPLATES = {
  // Çekmece şablonları çekmeceyi doldurur (iç ölçü ~380 × 630 mm). Her parça yazıcı tablasına (256 mm) sığar: şablon
  // parçaların dizilişidir; araçta (over) temsilci parça açılır. Renkler Kutu aracının paletinden, her şablon ayrı.
  cekmece: [
    T('drawer', n2('Çekmece içi · 6 parça', 'Drawer insert · 6 pieces'), 'drawer', { w: 187, d: 208, h: 50, cols: 3, rows: 3, holes: false }, '#d4621f'),
    T('kirtasiye', n2('Kırtasiye düzeni', 'Stationery layout'), 'drawer', { w: 252, d: 208, h: 55, cols: 3, rows: 2, holes: false }, '#3f6fb0'),
    T('tepsiler', n2('Modüler tepsiler · 8 parça', 'Modular trays · 8 pieces'), 'tray', { w: 187, d: 155, h: 32 }, '#b8372f'),
    T('gridfinity', n2('Gridfinity · taban ve kutular', 'Gridfinity · plates and bins'), 'p3', { px: 5, py: 5 }, '#8fa58a'),
    T('uzun', n2('Uzun kanallar · 12 parça', 'Long channels · 12 pieces'), 'drawer', { w: 93, d: 208, h: 48, cols: 1, rows: 1, holes: false, scoop: true }, '#ece9e2'),
    T('atolye', n2('Atölye kutuları · 12 parça', 'Workshop boxes · 12 pieces'), 'drawer', { w: 124, d: 155, h: 45, cols: 2, rows: 3, holes: false }, '#2b3036'),
  ],
  // Anahtar tepsisi: kart anahtarlık mağaza ürünü (preset 'magaza': mağaza açılır, yüzü Oktos tasarımı, KART); QR
  // anahtarlık 3D QR aracının şablonu (arac: 'qr', preset aracın şablonu). Halkada sırayla değişirler.
  anahtarlik: [
    T('koyu', n2('Oktos kart · koyu', 'Oktos card · dark'), 'magaza'),
    { ...T('qr_kare', n2('QR anahtarlık', 'QR keychain'), 'key'), arac: 'qr' },
    T('turuncu', n2('Oktos kart · turuncu', 'Oktos card · orange'), 'magaza'),
    { ...T('qr_yuvarlak', n2('Yuvarlak QR anahtarlık', 'Round QR keychain'), 'key_yuvarlak'), arac: 'qr' },
    T('krem', n2('Oktos kart · krem', 'Oktos card · cream'), 'magaza'),
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
  // Klavye: tuş başlığı setleri (Esc, Enter, yukarı ok) ve yanında aynı tasarımın anahtarlık clicker'ı
  klavye: [T('kedi', n2('Kedi seti', 'Cat set'), 'kedi'), T('kalp', n2('Kalp seti', 'Heart set'), 'kalp'), T('yildiz', n2('Yıldız seti', 'Star set'), 'yildiz'), T('harf', n2('Harf seti', 'Letter set'), 'harf')], // Fidget Clicker tuş şablonları
  // QR: iki ayrı ürün rafta birlikte durur (yerleri COKLU.modem); şablonun `urun`u hangisinin değiştiğini söyler. Sıra
  // ürünleri dolaşır, sonra ikinci şablonları
  modem: [
    U(T('wifi', storyName('qr', 'wifi'), 'wifi'), 'wifi'), // üçüncü değer: 3D QR aracının şablonu (tools/qr/app.js)
    U(T('card', storyName('qr', 'card'), 'card'), 'card'),
    U(T('wifi_turuncu', n2('Misafir Wi-Fi standı', 'Guest Wi-Fi stand'), 'wifi_turuncu'), 'wifi'),
    U(T('card_koyu', n2('Koyu kartvizit', 'Dark business card'), 'card_koyu'), 'card'),
  ],
  puzzle3d: [T('sphere', storyName('puzzle', 'sphere')), T('cube', storyName('puzzle', 'cube')), T('egg', { tr: 'Yumurta yapboz', en: 'Egg puzzle' }), T('heart', { tr: 'Kalp yapboz', en: 'Heart puzzle' })],
  tabela: [T('plate', { tr: 'Plakalı', en: 'On a plate' }, 'plate'), T('letters', { tr: 'Harf harf', en: 'Letter by letter' }, 'letters'), T('round', { tr: 'Yuvarlak plaka', en: 'Rounded plate' }, 'round')], // 3D Yazı şablonları
  saksilar: ['hex', 'square', 'flower', 'organic', 'twist', 'morph', 'amphora'].map((id) => T(id, vaseName(id), id)),
  balkonMasa: [T('menu', storyName('qr', 'menu'), 'menu'), T('coaster', { tr: 'Bardak altlığı', en: 'Coaster' }, 'coaster')],
  // Buzdolabının kapağı (kapak kapalı durak): 3D Yazı mıknatısları
  miknatis: [T('harfler', n2('Harf mıknatısları', 'Letter magnets'), 'harfler'), T('not', n2('"Süt al!" notu', '"Buy milk" note'), 'not'), T('kalp', n2('Kalp ve yıldız', 'Hearts and stars'), 'kalp')],
  buzdolabi: [T('iyi', { tr: '"İyi ki doğdun"', en: '"Happy birthday"' }, 'iyi'), T('nice', { tr: '"Nice yıllara"', en: '"Many more"' }, 'nice')],
  flip: ['family', 'us', 'sea'].map((id) => T(id, storyName('flip', id), id)), // Text Flip aracının şablonları
  cerceve: [T('mountain', { tr: 'Gün batımı', en: 'Sunset' }, 'mountain'), T('sea', { tr: 'Deniz', en: 'Sea' }, 'sea'), T('lake', { tr: 'Göl', en: 'Lake' }, 'lake')], // Filament Painter şablonları
  yapboz: [T('picture', { tr: 'Aile fotoğrafı yapboz', en: 'Family photo puzzle' }, 'picture')], // Puzzle aracının şablonu
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
// Bir aracın şablonunu aracın kendi üreteciyle kurar (odada görünen, araçta açılanla aynı): parçalar kendi renginde,
// kapalı katılar (çevrilince yanları ve arkası bitmiş). ek: odaya özel ölçü farkı (ör. kapı üstü plaka daha büyük).
// Parçalar aracın düzleminde (XY, yüz +z); dik: x ekseninde 90° (yüz −y, yazı yukarı), tabanı z = 0'a oturur.
async function aracModeli(arac, id, ek = {}, { dik = false } = {}) {
  const { TOOL } = await import(`../tools/${arac}/app.js`);
  if (TOOL.init) await TOOL.init();
  const p = TOOL.presets.find((x) => x.id === id) || TOOL.presets[0];
  const st = { ...TOOL.defaults, ...(p.mode ? { mode: p.mode } : {}), ...p.values, ...ek };
  TOOL.enforce(st);
  const ic = new THREE.Group();
  for (const part of TOOL.build(st).parts) {
    if (part.ghost || !part.result || part.result.empty) continue;
    const m = P.mesh(toGeometry(part.result), pla(part.color || st.color));
    m.castShadow = m.receiveShadow = true;
    ic.add(m);
    await yieldMain();
  }
  if (!dik) return ic;
  ic.rotation.x = Math.PI / 2;
  const g = new THREE.Group().add(ic);
  g.updateMatrixWorld(true);
  ic.position.z = -new THREE.Box3().setFromObject(g).min.z;
  return g;
}
// toprak: verilirse (malzeme) saksı ağzın 12 mm altına kadar toprakla dolar; malzeme: renkten malzeme üreten işlev
export function vaseModel(id, over = {}, { toprak = null, malzeme = null } = {}) {
  const p = VASE.presets.find((x) => x.id === id);
  const s = { ...VASE.defaults, ...p.values, ...over, ...(toprak ? { style: 'hollow' } : {}), _thumb: true };
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
// Kalemliğin bölmeleri: merkez ve iç yarıçap (kalemin tabanı bunun içinde kalır). Yuvarlakta dilimler (rows 2: ortada
// halka), köşelide ızgara. Duvar kalınlığı düşülür.
function bolmeler(v) {
  const wall = v.wall ?? 2;
  if (v.shape === 'round') {
    const R = v.w / 2 - wall;
    if (v.cols <= 1) return [{ x: 0, y: 0, r: R }];
    const out = [], halka = v.rows > 1, rm = halka ? R * 0.68 : R * 0.5;
    if (halka) out.push({ x: 0, y: 0, r: R * 0.3 });
    const rs = Math.min(halka ? R * 0.3 : R * 0.48, rm * Math.sin(Math.PI / v.cols)) - wall / 2;
    for (let i = 0; i < v.cols; i++) { const a = ((i + 0.5) / v.cols) * TAU; out.push({ x: Math.cos(a) * rm, y: Math.sin(a) * rm, r: rs }); }
    return out;
  }
  const out = [], rows = v.rows || 1, cw = v.w / v.cols, cd = v.d / rows;
  for (let i = 0; i < v.cols; i++) for (let j = 0; j < rows; j++) out.push({ x: ((i + 0.5) / v.cols - 0.5) * v.w, y: ((j + 0.5) / rows - 0.5) * v.d, r: Math.min(cw, cd) / 2 - wall });
  return out;
}
// Kalem çeşitleri (tabanı z = 0, ucu aşağıda): kurşun kalem, tükenmez, keçeli, fosforlu
function isaretKalemi(renk, fosforlu = false) {
  const g = new THREE.Group(), L = fosforlu ? 122 : 136, r = fosforlu ? 7.4 : 6.6;
  const govde = P.clay(fosforlu ? renk : 0xeceae4, { rough: 0.45 }), kapak = P.clay(renk, { rough: 0.35 });
  g.add(P.mesh(P.cyl(r - 0.6, r, L - 40, 24), govde));
  g.add(P.mesh(P.cyl(r + 0.3, r + 0.3, 40, 24), kapak).translateZ(L - 40));
  if (!fosforlu) g.add(P.mesh(P.cyl(r + 0.05, r + 0.05, 9, 24), kapak).translateZ(18)); // gövdede renk bandı
  return g;
}
const KALEMLER = [
  () => P.pencil({ len: 176, color: K.yellow }),
  () => P.pen({ len: 146, color: K.blue }),
  () => isaretKalemi(0x1f2226),
  () => P.pen({ len: 144, color: K.ink }),
  () => isaretKalemi(0xf0e04a, true),
  () => P.pencil({ len: 168, color: K.red }),
  () => P.pen({ len: 142, color: K.red }),
  () => isaretKalemi(0xef6f9e, true),
];
// Kalemliğe kalem dizer: bölme başına sığdığı kadar (iç yarıçapa göre), tabanı bölmenin içinde, tepesi hafifçe dışa yaslı
function kalemDiz(g, v, tohum = 1) {
  const rng = P.rng(tohum), z0 = (v.floor ?? 2) + 0.4;
  let k = Math.floor(rng() * KALEMLER.length);
  for (const b of bolmeler(v)) {
    const n = b.r > 32 ? 5 : b.r > 22 ? 3 : b.r > 12 ? 2 : 1;
    for (let i = 0; i < n; i++, k++) {
      const kalem = KALEMLER[k % KALEMLER.length](), merkez = n === 5 && i === 4;
      const a = (i / (n === 5 ? 4 : n)) * TAU + rng() * 0.5, rho = n === 1 || merkez ? 0 : Math.max(0, b.r - 8.5) * 0.62;
      // Eğim, kalemin ağız hizasında duvara değmeyeceği kadar (uzun kalemlikte fosforlu duvardan taşıyordu)
      const lean = Math.min(n === 1 ? 0.05 : merkez ? 0.02 : 0.07 + rng() * 0.05, Math.max(0, (b.r - rho - 8.5) / (v.h ?? 100)));
      kalem.position.set(b.x + Math.cos(a) * rho, b.y + Math.sin(a) * rho, z0);
      kalem.rotation.set(-Math.sin(a) * lean, Math.cos(a) * lean, rng() * TAU);
      g.add(kalem);
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

// ---- Klavye: Fidget Clicker'ın tuş başlıkları mekanik klavyede ve yanında aynı tasarımın anahtarlık clicker'ı ----
// Klavye bu tuşları boş (MX anahtarı görünür) kurar; set onlara takılır. Başlık klavyenin kendi tuş biçimi
// (props keycapGeometry), üstünde tasarımın kabartması. Şablon parçalı: değişimde her başlık kendi yerinde küçülür.
export const OZEL_TUSLAR = ['esc', 'enter', 'up'];
const TUS_SETI = {
  kedi: { govde: 0xd4621f, motif: 0xf3efe6, anahtarlik: 'cat' },
  kalp: { govde: 0xe9b8b8, motif: 0xb8372f, anahtarlik: 'heart' },
  yildiz: { govde: 0x3f6fb0, motif: K.yellow, anahtarlik: 'star' },
  harf: { govde: 0x2b3036, motif: 0xece9e2, anahtarlik: null },
};
// Motif: tabanı z = 0'da, başlığın ortasında (x, y ortalı)
function tusMotifi(id, ad, fs, renk) {
  const m = pla(renk), g = new THREE.Group();
  if (id === 'kedi' && ad !== 'enter') { // küçük kedi başı ve gözleri
    g.add(smooth(solid(() => C.move(C.scale(catHead(), 0.3), 0, 0, 3.4), m)));
    for (const sx of [-1, 1]) g.add(P.mesh(new THREE.SphereGeometry(0.8, 10, 8), P.clay(K.ink, { rough: 0.3 })).translateX(sx * 2.4).translateY(-6.2).translateZ(4.6));
  } else if (id === 'kedi') { // pati izi
    const top = (r, x, y, sz = 0.5) => { const s = P.mesh(new THREE.SphereGeometry(r, 16, 10), m); s.scale.z = sz; s.position.set(x, y, 0.4); g.add(s); };
    top(4.4, 0, -1.6, 0.45);
    for (const [x, y] of [[-4.6, 3.2], [-1.6, 5.2], [1.6, 5.2], [4.6, 3.2]]) top(1.8, x, y);
  } else if (id === 'kalp') {
    g.add(smooth(solid(() => C.move(C.extrude(C.poly2(heartPts(ad === 'enter' ? 0.42 : 0.36)), 2.4), 0, -0.6, 0), m)));
  } else if (id === 'yildiz') {
    g.add(smooth(solid(() => C.extrude(C.poly2(starPts(ad === 'enter' ? 7.2 : 6.4, 2.8)), 2.4), m)));
  } else if (ad === 'up') { // harf setinde ok
    g.add(solid(() => C.extrude(C.poly2([[0, 4.6], [-4.6, -3], [4.6, -3]]), 1.8), m));
  } else {
    const t = textSolid(fs, ad === 'enter' ? 'OKTOS' : 'O', ad === 'enter' ? 6 : 9, 1.6, { spacing: 0.3 });
    g.add(solid(() => C.move(t.solid, 0, -t.cap / 2, 0), m));
  }
  return g;
}
// kb: klavyeden { keys, capZ, yer } (yer: anahtarlığın klavyeye göre yeri, Matrix4)
function tusSeti(id, kb, fs) {
  const t = TUS_SETI[id] || TUS_SETI.kedi, g = new THREE.Group();
  g.userData.parcali = true;
  for (const ad of OZEL_TUSLAR) {
    const k = kb.keys[ad], cap = new THREE.Group();
    cap.add(P.mesh(P.keycapGeometry(k.u), pla(t.govde)));
    const motif = tusMotifi(id, ad, fs, t.motif);
    motif.position.z = 7.6; // başlığın tepesine biraz gömülü
    cap.add(motif);
    cap.position.set(k.x, k.y, kb.capZ);
    g.add(cap);
  }
  if (t.anahtarlik && kb.yer) {
    const a = new THREE.Group();
    a.add(keychain(t.anahtarlik));
    kb.yer.decompose(a.position, a.quaternion, a.scale);
    g.add(a);
  }
  return g;
}

// ---- Buzdolabı mıknatısları (3D Yazı): kapağın ön yüzünde. Yerel düzlem: x sağa, y yukarı (kapağın altından), z dışarı;
// mıknatıs 6 mm kalın, tabanı z = 0 (kapak yüzü). Kulp sağda (x ≈ 214): parçalar x −200..160, y 380..790 arasında.
function miknatisModel(id, fs, lang) {
  const g = new THREE.Group(), koy = (m, x, y, rz = 0) => { m.position.set(x, y, 0); m.rotation.z = rz; g.add(m); return m; };
  const yazi = (txt, size, renk, d = 6) => {
    const t = textSolid(fs, txt, size, d, { spacing: 0.2 });
    return smooth(solid(() => C.move(t.solid, 0, -t.cap / 2, 0), pla(renk)), 0.9);
  };
  if (id === 'harfler') {
    const renk = [K.accent, K.blue, K.yellow, K.red, K.sage];
    [...'OKTOS'].forEach((ch, i) => koy(yazi(ch, 64, renk[i]), -170 + i * 72, 660 + Math.sin(i * 1.3) * 18, (i % 2 ? 1 : -1) * 0.12));
    koy(yazi(lang === 'en' ? 'HOME' : 'EV', 34, K.ink), -120, 540, 0.06);
  } else if (id === 'not') {
    const n = koy(solid(() => C.extrude(C.rrect(180, 118, 10), 4), pla(0xf6f1e4)), -40, 600, -0.05);
    const y = yazi(lang === 'en' ? 'BUY MILK!' : 'SÜT AL!', 26, K.ink, 2);
    y.position.set(0, -12, 4);
    n.add(y);
    const d = P.mesh(P.cyl(9, 9, 5, 24), pla(K.red)); // notu tutan yuvarlak mıknatıs (z ekseninde, notun üstünde)
    d.position.set(0, 50, 4);
    n.add(d);
  } else {
    koy(smooth(solid(() => C.extrude(C.poly2(heartPts(2.3)), 6), pla(K.red))), -110, 690, 0.15);
    koy(smooth(solid(() => C.extrude(C.poly2(heartPts(1.3)), 6), pla(K.rose))), -40, 545, -0.2);
    koy(smooth(solid(() => C.extrude(C.poly2(starPts(40, 17)), 6), pla(K.yellow))), 50, 715, 0.1);
    koy(smooth(solid(() => C.extrude(C.poly2(starPts(28, 12)), 6), pla(K.blue))), 105, 590, -0.3);
  }
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
// Tepsideki halkaya takılan QR anahtarlık (kart anahtarlıkla aynı düzen: bağlantı halkası orijinde, etiket −y'ye
// sarkar, yatar). Kare: sarı karo; yuvarlak: adaçayı disk üstünde krem karo. 3D QR aracının key / key_yuvarlak şablonu.
async function qrEtiket(yuvarlak, fs) {
  const g = new THREE.Group();
  if (yuvarlak) {
    g.add(P.mesh(P.cyl(28, 28, 3, 56), P.clay(K.sage, { rough: 0.5 })).translateY(-34));
    const kq = await qrTile(SITE, { size: 36, corner: 3, fs });
    kq.position.set(0, -34, 2.2);
    g.add(kq);
    g.add(P.mesh(P.cyl(6.5, 6.5, 3, 32), P.clay(K.sage, { rough: 0.5 })).translateY(-3.5));
  } else {
    const kq = await qrTile(SITE, { size: 40, base: P.clay(K.yellow, { rough: 0.5 }), corner: 5, fs });
    kq.position.set(0, -27, 0);
    g.add(kq, P.mesh(P.cyl(6.5, 6.5, 3, 32), P.clay(K.yellow, { rough: 0.5 })).translateY(-3.5));
  }
  const halka = P.mesh(new THREE.TorusGeometry(4.2, 0.75, 10, 28), P.metal(0xc9ccd1, 0.3)); // dik bağlantı halkası
  halka.rotation.x = Math.PI / 2;
  halka.position.set(0, 2.5, 3.2);
  g.add(halka);
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return g;
}

// ---- Kart anahtarlık (mağaza ürünü): Blender'daki kart (kart_anahtarlik) kopyalanır, yüzüne Oktos tasarımı basılır.
// Lisanslı kart görselleri (mağazadaki ürünler) sahnede yeniden üretilmez; yüz bizim logomuz ve yazımız.
const KART = {
  koyu: { zemin: '#16181b', logo: '#f3eee5', yazi: '#f2b48a', cerceve: 0x34363a },
  turuncu: { zemin: '#d4621f', logo: '#16181b', yazi: '#16181b', cerceve: 0x3a2418 },
  krem: { zemin: '#efe6d4', logo: '#d4621f', yazi: '#2b3036', cerceve: 0xb7a27e },
};
let logoResmi = null;
async function kartYuzu(id) {
  const k = KART[id], cv = document.createElement('canvas'), W = 340, H = 520;
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = k.zemin;
  c.fillRect(0, 0, W, H);
  logoResmi ||= await new Promise((ok, hata) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = hata;
    im.src = new URL('./logo-beyaz.svg', import.meta.url).href;
  });
  const lc = document.createElement('canvas'), lw = 250, lh = Math.round((lw * 531.75) / 674); // logonun oranı
  lc.width = lw;
  lc.height = lh;
  const l = lc.getContext('2d');
  l.drawImage(logoResmi, 0, 0, lw, lh);
  l.globalCompositeOperation = 'source-in'; // beyaz logoyu şablonun rengine boya
  l.fillStyle = k.logo;
  l.fillRect(0, 0, lw, lh);
  c.drawImage(lc, (W - lw) / 2, 92);
  await document.fonts.load('700 50px "Big Shoulders Display"').catch(() => {});
  c.fillStyle = k.yazi;
  c.textAlign = 'center';
  c.font = '700 50px "Big Shoulders Display", "Schibsted Grotesk", sans-serif';
  c.fillText('OKTOS', W / 2, 382);
  c.font = '600 21px "Schibsted Grotesk", sans-serif';
  c.letterSpacing = '7px';
  c.fillText('WORKSHOP', W / 2 + 3, 418);
  c.globalAlpha = 0.45;
  c.strokeStyle = k.yazi;
  c.lineWidth = 3;
  c.strokeRect(20, 20, W - 40, H - 40);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false; // glTF UV'si (v aşağı): tuvalin üstü kartın kulak tarafında
  tex.anisotropy = 8;
  return tex;
}
async function kartAnahtarlik(id, kart) {
  const k = KART[id], yuz = await kartYuzu(id);
  if (!kart) { // pilotsuz: düz kart
    const g = new THREE.Group();
    g.add(P.mesh(P.rbox(40, 58, 3, 4), P.clay(k.cerceve)).translateY(-36));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(34, 52), new THREE.MeshStandardMaterial({ map: yuz }));
    m.position.set(0, -36, 3.05);
    g.add(m);
    yuz.flipY = true;
    return g;
  }
  const g = kart.clone(true);
  g.position.set(0, 0, 0);
  g.rotation.set(0, 0, 0);
  g.traverse((o) => {
    if (!o.isMesh) return;
    if (/^kart_yuz/.test(o.name)) {
      o.material = o.material.clone();
      o.material.map = yuz;
      o.material.color.set(0xffffff);
      o.material.needsUpdate = true;
    } else if (/^kart_(cerceve|kulak)/.test(o.name)) {
      o.material = o.material.clone();
      o.material.color.setHex(k.cerceve);
    }
    o.castShadow = o.receiveShadow = true;
  });
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
// Resimli düz yapboz: XY'de yatar, w × h mm, kalınlık 6. resim: fotoğrafın adresi (4:3); verilmezse gün batımında dağlar
export async function picturePuzzle({ cols = 4, rows = 3, cell = 130, resim = null } = {}) {
  const { jigsaw } = await import('../tools/puzzle/scene.js');
  const tex = resim ? await new THREE.TextureLoader().loadAsync(resim) : new THREE.CanvasTexture(manzaraResmi());
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
function manzaraResmi() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const g2 = cv.getContext('2d');
  const sky = g2.createLinearGradient(0, 0, 0, 384);
  sky.addColorStop(0, '#9fc1d8'); sky.addColorStop(0.6, '#f4e3c3'); sky.addColorStop(1, '#e9b07a');
  g2.fillStyle = sky; g2.fillRect(0, 0, 512, 384);
  const ridge = (base, amp, f, col, ph) => { g2.fillStyle = col; g2.beginPath(); g2.moveTo(0, 384); for (let x = 0; x <= 512; x += 4) g2.lineTo(x, base - amp * (Math.sin(x * f + ph) * 0.6 + Math.sin(x * f * 2.3 + ph) * 0.4)); g2.lineTo(512, 384); g2.fill(); };
  g2.fillStyle = '#fff4dc'; g2.beginPath(); g2.arc(370, 130, 36, 0, TAU); g2.fill();
  ridge(235, 44, 0.012, '#c27d55', 1); ridge(280, 36, 0.02, '#8c4f3a', 3); ridge(335, 24, 0.03, '#3d3a46', 5);
  return cv;
}

// ---- 3D Yazı: kapı üstü plakası ve pasta süsü (yazı dik, ön yüzü −y) ----
// Orijin: duvar yüzü (y = 0) ve plakanın alt kenarı; plaka 140 mm yüksek, yazı ortasında. 'letters': plakasız,
// harfler doğrudan duvarda.

const FLIP = {
  tr: { family: ['ANNE', 'BABA'], us: ['SEN', 'BEN'], sea: ['ADA', 'EGE'] },
  en: { family: ['MOM', 'DAD'], us: ['YOU', 'ME'], sea: ['SEA', 'SUN'] },
};

// Bir bölgenin bir şablonunu üretir. lang: yazılı ürünler (plaka, pasta süsü, Flip, QR başlığı) için.
// saksi: fotogerçekçi odada saksılara toprak ve baskı malzemesi ({ toprak, malzeme }, vaseModel'e gider).
// pasta: fotogerçekçi odada gerçek pasta modeli (kopyalanır); pasta süsümüz onun üstüne batar.
export async function buildTemplate(zone, id, { lang = 'tr', saksi = {}, pasta = null, klavye = null, kart = null } = {}) {
  await initCSG();
  const fs = await fonts(700);
  switch (zone) {
    case 'cekmece': {
      // Çekmeceyi dolduran dizilişler: doldurulan alan W × D (yuva merkezine göre y −5), parçalar arası 1 mm. Aynı ölçüdeki
      // parça bir kez üretilir, kopyalanır.
      const t = TEMPLATES.cekmece.find((x) => x.id === id), R = t?.renk ? { color: t.renk } : {};
      const W = 376, D = 626, Y0 = -5, AR = 1;
      const g = new THREE.Group(), onbellek = new Map();
      const parca = (preset, over, renk = R) => {
        const k = preset + JSON.stringify(over) + JSON.stringify(renk);
        if (!onbellek.has(k)) onbellek.set(k, binModel(preset, { ...over, ...renk }));
        return onbellek.get(k).clone();
      };
      const koy = (m, x, y, z = 0) => { m.position.set(x, y + Y0, z); g.add(m); };
      // Izgara: sütun genişlikleri (verilmezse eşit), her hücreye fn(sütun, satır, w, d) ile parça
      const izgara = (cols, rows, fn, sutunlar = null) => {
        const ws = sutunlar ?? Array(cols).fill((W - (cols - 1) * AR) / cols), d = (D - (rows - 1) * AR) / rows;
        let x = -W / 2;
        ws.forEach((w, i) => {
          for (let j = 0; j < rows; j++) koy(fn(i, j, w, d), x + w / 2, -D / 2 + d / 2 + j * (d + AR));
          x += w + AR;
        });
      };
      const kutu = (w, d, h, cols, rows, ek = {}) => parca('drawer', { shape: 'rect', w: Math.floor(w), d: Math.floor(d), h, cols, rows, r: 3, wall: 1.6, floor: 1.6, holes: false, lip: false, shelf: false, scoop: false, ...ek });
      if (id === 'drawer') { // 2 × 3, satır satır farklı bölmeler
        const B = [[[4, 1], [4, 1]], [[3, 3], [2, 2]], [[2, 1], [1, 2]]];
        izgara(2, 3, (i, j, w, d) => kutu(w, d, 50, ...B[j][i]));
      } else if (id === 'kirtasiye') { // solda uzun kalem kanalı, sağda bölmeli kutular
        izgara(2, 3, (i, j, w, d) => (i === 0 ? kutu(w, d, 55, 1, 1, { scoop: true }) : kutu(w, d, 55, 3, 2)), [123, 252]);
      } else if (id === 'tepsiler') {
        izgara(2, 4, (i, j, w, d) => kutu(w, d, 32, 3, 2));
      } else if (id === 'uzun') {
        izgara(4, 3, (i, j, w, d) => kutu(w, d, 48, 1, 1, { scoop: true }));
      } else if (id === 'atolye') {
        izgara(3, 4, (i, j, w, d) => kutu(w, d, 45, 2, 3));
      } else { // Gridfinity: 9 × 15 hücre (42 mm); 6 ince taban plakası (4 ya da 5 × 5 hücre, koyu) ve üstünde 44 kutu
        // (iç bölmesiz dört kutu türü: üretimi hafif)
        const U = 42, G0 = { magnets: 'none', screws: 'none' };
        for (const [x0, nx] of [[0, 4], [4, 5]]) for (const y0 of [0, 5, 10]) {
          koy(parca('p1', { px: nx, py: 5, plateStyle: 'thin', pfloor: 1, pmag: 'none', pscrew: 'none' }, { color: '#2b3036' }), (x0 + nx / 2 - 4.5) * U, (y0 + 2.5 - 7.5) * U);
        }
        const blok = [['g6', 0, 0, 4, 2], ['g3', 4, 0, 2, 2], ['g3', 6, 0, 2, 2], ['g1', 8, 0], ['g1', 8, 1],
          ['g3', 0, 2, 2, 2], ['g2', 2, 2, 2, 1], ['g2', 2, 3, 2, 1], ['g6', 4, 2, 4, 2], ['g1', 8, 2], ['g1', 8, 3],
          ['g2', 0, 4, 2, 1], ['g2', 0, 5, 2, 1], ['g6', 2, 4, 4, 2], ['g3', 6, 4, 2, 2], ['g1', 8, 4], ['g1', 8, 5]];
        const yer = [...blok, ...blok.map(([b, x, y, w, h]) => [b, x, y + 6, w, h]), ['g6', 0, 12, 4, 2], ['g3', 4, 12, 2, 2], ['g3', 6, 12, 2, 2], ['g1', 8, 12], ['g1', 8, 13],
          ['g2', 0, 14, 2, 1], ['g2', 2, 14, 2, 1], ['g2', 4, 14, 2, 1], ['g2', 6, 14, 2, 1], ['g1', 8, 14]];
        for (const [b, cx, cy, w = 1, h = 1] of yer) koy(parca(b, G0), (cx + w / 2 - 4.5) * U, (cy + h / 2 - 7.5) * U, 0.6);
      }
      return g;
    }
    case 'kalemlik': {
      const t = TEMPLATES.kalemlik.find((x) => x.id === id), p = BIN.presets.find((x) => x.id === t.preset);
      const v = { ...p.values, ...(t.over || {}) };
      const g = binModel(t.preset, { ...(t.over || {}), ...(t.renk ? { color: t.renk } : {}) });
      kalemDiz(g, v, TEMPLATES.kalemlik.indexOf(t) + 3);
      return g;
    }
    case 'klavye': return klavye ? tusSeti(id, klavye, fs) : keychain(TUS_SETI[id]?.anahtarlik || 'cat');
    case 'modem': {
      // Ürün kendi orijininde (yeri COKLU.modem); onKenar: ön kenarın y'si (seçilince bu kenarın üstünde dikelir)
      const g = await aracModeli('qr', id); // 3D QR aracının standı ve kartviziti
      g.userData.onKenar = new THREE.Box3().setFromObject(g).min.y;
      return g;
    }
    case 'puzzle3d': return puzzle3d(id);
    case 'anahtarlik': return id.startsWith('qr_') ? qrEtiket(id === 'qr_yuvarlak', fs) : kartAnahtarlik(id, kart);
    case 'tabela': return aracModeli('text', id, { boy: 56 }, { dik: true }); // kapı üstünde: 3D Yazı plakası, büyük
    case 'miknatis': return miknatisModel(id, fs, lang);
    case 'saksilar': return vaseModel(id, {}, saksi);
    case 'balkonMasa': return aracModeli('qr', id); // menü standı ve bardak altlığı
    case 'buzdolabi': {
      const g = new THREE.Group();
      let ust = 70; // pastanın üst yüzü (krema)
      if (pasta) {
        const p = pasta.clone();
        g.add(p);
        ust = new THREE.Box3().setFromObject(p).max.z - 16; // çileklerin altı
      } else g.add(P.mesh(P.cyl(100, 100, 70, 40), P.clay(0xf3e6d6, { rough: 0.7 })));
      const top = await aracModeli('text', id, {}, { dik: true }); // 3D Yazı pasta süsü (arkasında birleştiren zemin)
      top.position.z = ust - 26; // çubuklar 26 mm pastaya girer
      g.add(top);
      return g;
    }
    case 'flip': {
      const { flipSolid } = await import('../tools/flip/scene.js');
      const [a, b] = (FLIP[lang] || FLIP.tr)[id];
      return smooth(solid(() => flipSolid(fs, a, b, 40), pla(K.sage)));
    }
    case 'cerceve': { // Filament Painter rölyefi (renk bantları ve kenarıyla), çerçevenin arkalığına oturur
      const g = await aracModeli('painter', id, { genislik: 248 }, { dik: true });
      g.position.z = -new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()).z; // dikeyde ortalı
      return g;
    }
    case 'yapboz': {
      // Aile fotoğrafı (Unsplash, Land O'Lakes, Inc.; kayıt assets/oda/KAYNAKLAR.md)
      const g = await picturePuzzle({ resim: new URL('../assets/oda/yapboz-aile.webp', import.meta.url).href });
      g.rotation.x = Math.PI / 2; // resim yüzü −y'ye
      return g;
    }
    default: throw new Error('bilinmeyen bölge: ' + zone);
  }
}
