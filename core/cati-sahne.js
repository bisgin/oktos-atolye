// Çatı katı sahnesi (portfolyo): binamızın tepesindeki teras odası. 2026-10-22'de kullanıcı geri bildirimiyle yeniden
// kuruldu (eski gri kutu teras: commit 895b309).
// Çatı: kuzeye, manzaraya doğru yükselen tek eğimli çatı (kirişlerin altı güney duvarında 2600, kuzey cephede 3200; ~7°).
// İçeride açıkta lamine ahşap kiriş + aşık ızgarası ve lambri, dışta saçak (kuzey 1,4 m, doğu 0,9 m, batı ve güney
// 0,35 m); kirişlerin ucu ve saçak altı pencereden bakınca kadrajın tepesinde görünür. Oturma köşesinin ve odanın
// ortasının üstünde iki çatı penceresi. Kuzey ve doğu cephe tam boy sürgü (kanatlar bir yana toplu, açıklıkta cam
// korkuluk), kapıların üstünde sabit cam (doğuda çatı eğimine uyan yamuk).
// İç: x −6000…3400, y −2500…2400. Batı duvarında iki kitaplık (altları çekmeceli; kutu oyunları ve tasarım çalışmaları:
// Modern Balbal büstleri, vazolarımız), aralarında 75" OLED (süreç sunumu, core/cati-ekran.js) ve üstte köprü dolap;
// kuzeyin kapalı kesiminde küçük pencere. Doğuda kilim, üç armut koltuk ve cam sehpa; kuzey açıklıkta şehre bakan Dobson
// teleskop ve yanında ayakta Biggie; şövalede kara tahta (hakkımda); saksılar vazo aracının çıktısı (renkleri farklı),
// bitkiler Poly Haven (CC0).
// Dışarısı core/cati-sehir.js (gökyüzü, bulutlar, karşı bina orta kattaki odayla aynı yerde, sokak, silüet); kilim
// core/cati-kilim.js; teleskop, armut ve sehpa core/cati-esya.js.
// Işık canlı (pişirme yok): güneş core/oda-olcu.js SUN (gölgeli), ortam ışığı gökyüzü panoramasından. Pencereden uzak
// yüzeyler köşe rengiyle karartılır (ışık payı: açıklıklara uzaklık ve yön): TV köşesi gölgede kalır.
// Birim mm, Z yukarı, +x doğu, +y kuzey, döşeme z = 0. Motor core/story.js. Metin core/cati-veri.js, sayfa lab/cati.html.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OLCU, toSun } from './oda-olcu.js';
import { ESERLER, SUREC, RAF_ISLERI } from './cati-veri.js';
import { initCSG } from './csg.js';
import { vaseModel } from './oda-urunler.js';

const KOK = new URL('../assets/', import.meta.url).href;
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';
export const options = { reduce: false };
// Sahne kurulunca dolar: sayfa ve kart TV'yi buradan sürer (süreç adımı seçimi)
export const canli = { ekran: null };
// Ayrı modüller (şehir, kilim, eşyalar, ekran): biri yüklenemezse sahne onsuz açılır, konsola yazar
const modul = (yol) => import(yol).catch((e) => { console.warn('çatı modülü', yol, e); return null; });

// ---- ölçüler ----
export const CATI = {
  ic: { x0: -6000, x1: 3400, y0: -2500, y1: 2400 },     // iç hacim (duvarların ve cam cephelerin iç yüzü)
  dis: { x0: -6200, x1: 3600, y0: -2600, y1: 2600 },    // dış yüz
  tavanG: 2600, tavanK: 3200,                            // kirişlerin altı: güney duvarında ve kuzey cephede
  kiris: { en: 120, boy: 300, x: [-5400, -4200, -3000, -1800, -600, 600, 1800, 3000] },
  asik: { en: 80, boy: 160, aralik: 600 },
  lambri: 25, kaplama: 200,                              // lambri; üstünde yalıtım ve dikişli sac
  sacak: { k: 4000, d: 4500, b: -6550, g: -2950 },       // saçak uçları: kuzey y, doğu x, batı x, güney y
  kuzeyCam: { x0: -1500, x1: 3400, y: 2480, kapi: 2400, bas: 3040 }, // eksen y; kapı boyu; çelik başlık kirişinin altı
  doguCam: { x: 3480, y0: -2300, y1: 2400, kapi: 2100 },
  pencere: { x0: -3400, x1: -2600, z0: 850, z1: 2350 },  // kuzeyin kapalı kesimindeki pencere
  isiklik: [[1860, 2940, -200, 1000], [-1740, -660, 600, 1800]], // çatı pencereleri (plan: x0, x1, y0, y1)
};
const { ic: IC, kuzeyCam: KC, doguCam: DC } = CATI;
const EGIM = Math.atan((CATI.tavanK - CATI.tavanG) / (IC.y1 - IC.y0));
const COS = Math.cos(EGIM), TAN = Math.tan(EGIM);
const zAlt = (y) => CATI.tavanG + (y - IC.y0) * TAN;                         // kirişin alt çizgisi
const KAT = { kiris: CATI.kiris.boy, asik: CATI.kiris.boy + CATI.asik.boy };   // dik ofsetler (kirişin altından)
KAT.lambri = KAT.asik; KAT.kaplama = KAT.lambri + CATI.lambri;
const zUst = (y, ofset) => zAlt(y) + ofset / COS;                           // eğimli katmanın alt yüzü (düşey)
// Batı duvarı: iki kitaplık, aralarında TV; üstte köprü dolap
const KITAPLIK = { en: 1100, derin: 380, boy: 2350, y: [-1800, 1800] };     // merkezleri (y)
const TV = { y: 0, z: 820 };                                                 // ekranın alt kenarı
const KONSOL = { y0: -950, y1: 950, derin: 420, boy: 440 };
// Doğu köşesi: kilim, armutlar, sehpa, teleskop; Biggie teleskobun yanında
const KILIM = { x: 2200, y: -300, en: 3200, boy: 2200 };                   // uzun kenarı y boyunca; teleskop kilimin dışında
const ARMUTLAR = [[3000, 500, 0x3f6b6d, 3], [2980, -700, 0xc8962e, 1], [2300, -1500, 0xa4553a, 2]]; // x, y, renk, tohum
const SEHPA = [2380, -80];
const TELESKOP = { x: 2400, y: 1600, az: 35, el: 42 };   // açık kuzeydoğu köşesinde; üst kafes cam cephenin içinde kalır
const BIGGIE_YER = { x: 1600, y: 1950, yon: [-700, -3800] };                  // teleskobun batı yanında, kameraya dönük
const TAHTA = { x: -2350, y: 1500 };
// Saksılar: [x, y, z, vazo şablonu, renk, bitki (assets/cati/bitkiler.glb düğümü; ilk bulunan), ölçü farkı]
const SAKSILAR = [
  [-1150, 2080, 0, 'hex', 0xb8613f, ['kalatya', 'antoryum_a'], { height: 340, dBottom: 240, dTop: 300 }],
  [-4350, 2120, 0, 'organic', 0x8fa58a, ['pachira', 'antoryum_a'], { height: 420, dBottom: 230, dTop: 210, style: 'hollow' }],
  [-1925, -2180, 0, 'twist', 0x2c3e66, ['egrelti', 'menekse'], { height: 300, dBottom: 230, dTop: 230 }], // güney duvarında çerçevelerin arası
  [3150, 1300, 0, 'morph', 0xece9e2, ['antoryum_c'], { height: 360, dBottom: 260, dTop: 240 }],
  [-3000, 2160, 0, 'amphora', 0xc49a3c, ['menekse', 'antoryum_c'], { height: 280, dBottom: 170, dTop: 190 }], // küçük pencerenin altı
];
// Robot süpürgenin turu (odanın açık zemininde; eşyalara ~3 cm payla); hız mm/sn
const ROBOT = { dur: [-1500, -1500, 0.3], yol: [[-4900, -1800], [-2000, -1680], [200, -1800], [800, -700], [600, 500], [-700, 900], [-3200, 700], [-4950, 300], [-5050, -900]], hiz: 140 };

// ---- kamera ----
// main: oda içinden genel plan (güney duvarının önünden kuzeye: cam cephe ve karşı binanın çatısı, sağda armut köşesi,
// solda şövale ve küçük pencere; tavanda kiriş ızgarası ve saçak). Kenardan bakma sola 75°'ye kadar döner: batı
// duvarındaki TV ve kitaplıklar görünür. Telefonda ayrı kadraj (PORTRE).
export const SHOTS = {
  intro: { pos: [900, -1900, 2350], target: [500, 2400, 1700] },
  main: { pos: [900, -1950, 1500], target: [500, 2400, 1320] },
};
const PORTRE = { pos: [700, -2330, 1500], target: [800, 2400, 1250] };
export const FOCUS = {
  ekran: { pos: [-3300, -150, 1400], target: [-6000, 0, 1260], w: 2300 },
  kitaplik: { pos: [-3800, 1450, 1500], target: [-6000, 1800, 1200], w: 1400 },
  biggie: { pos: [300, -1500, 1600], target: [2200, 850, 850], w: 2600 },   // armut köşesi, teleskop ve Biggie
  hakkimda: { pos: [-1050, -150, 1450], target: [-2350, 1500, 1050], w: 1500 },
};
const SINIR = { min: [IC.x0 + 150, IC.y0 + 150, 150], max: [IC.x1 - 150, IC.y1 - 150, CATI.tavanG - 150] };
const LOOK = { min: -0.45, max: 1.3, edge: 0.2, speed: 0.7 };            // max: sola (batıya) ~75°

// ---- yardımcılar ----
let yukleyici = null;
const gltf = (url) => {
  yukleyici ??= new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO));
  return yukleyici.loadAsync(url);
};
const resim = (url) => new Promise((ok, hata) => { const im = new Image(); im.onload = () => ok(im); im.onerror = hata; im.src = url; });
const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const doku = (c, { tekrar = false, srgb = true } = {}) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (tekrar) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};
// Tohumlu rastgele (sahne her açılışta aynı)
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// x0..x1, y0..y1, z0..z1 aralığını dolduran kutu (birleştirmek için); bol: kenar başına bölüm (köşe rengi için)
const aralik = (x0, x1, y0, y1, z0, z1, bol = [1, 1, 1]) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0, ...bol).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const birlesik = (geos, mat, { golge = true, alir = true } = {}) => {
  const m = new THREE.Mesh(mergeGeometries(geos), mat);
  m.castShadow = golge; m.receiveShadow = alir;
  return m;
};
// İki nokta arasında silindir; r1 a ucunda, r2 b ucunda
function cubuk(a, b, r1, r2 = r1, seg = 10) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2, r1, L, seg).translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  return g.translate(A.x, A.y, A.z);
}
// Dünya ölçüsünde UV (yüzün normaline göre iki eksen): doku her yüzde aynı yoğunlukta
function dunyaUV(g, olcek) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [a, b] = az >= ax && az >= ay ? [p.getX(i), p.getY(i)] : ax >= ay ? [p.getY(i), p.getZ(i)] : [p.getX(i), p.getZ(i)];
    uv.setXY(i, a / olcek, b / olcek);
  }
  return g;
}
// Uzun parça UV'si (kiriş, aşık): u boy ekseni boyunca, v yüzün öbür ekseni (yanlarda z): lif ve lameller boyuna akar
function boyUV(g, eksen, olcek = 1000) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  const al = (i, k) => (k === 'x' ? p.getX(i) : k === 'y' ? p.getY(i) : p.getZ(i));
  const capraz = eksen === 'x' ? 'y' : 'x';
  for (let i = 0; i < p.count; i++) {
    const yatay = Math.abs(n.getZ(i)) > 0.5;
    uv.setXY(i, al(i, eksen) / olcek, al(i, yatay ? capraz : 'z') / olcek);
  }
  return g;
}
// Atlas hücresine UV: geometri UV'si (0..1) hücreye sıkıştırılır (u0, v0, u1, v1 doku koordinatı, v yukarı)
function hucreUV(g, [u0, v0, u1, v1], yuz = null) {
  const uv = g.attributes.uv;
  const [i0, i1] = yuz === null ? [0, uv.count] : [yuz * 4, yuz * 4 + 4]; // BoxGeometry: yüz başına 4 köşe (+x, −x, +y, −y, +z, −z)
  for (let i = i0; i < i1; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return g;
}
// Çatı eğiminde kutu: plan x0..x1, y0..y1; alt yüzü kirişin alt çizgisinden 'ofset' (dik) yukarıda, kalınlık 'kal' (dik).
// uv: 'boy' (y boyunca akan parça), 'x' (x boyunca), 'lambri' (alt yüz düzlem ölçüsünde) ya da yok
function egimli(x0, x1, y0, y1, ofset, kal, { uv = null, bolY = 1, bolX = 1, olcek = 1000 } = {}) {
  const L = (y1 - y0) / COS, yc = (y0 + y1) / 2;
  const g = new THREE.BoxGeometry(x1 - x0, L, kal, bolX, bolY, 1).translate(0, 0, kal / 2 + ofset);
  if (uv === 'boy') boyUV(g, 'y', olcek);
  else if (uv === 'x') boyUV(g, 'x', olcek);
  else if (uv === 'lambri') { // tahtalar eğim boyunca (aşıkların üstünde kuzey-güney)
    const p = g.attributes.position, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) u.setXY(i, p.getY(i) / olcek, p.getX(i) / olcek);
  }
  g.rotateX(EGIM);
  return g.translate((x0 + x1) / 2, yc + ofset * Math.sin(EGIM), zAlt(yc)); // plan aralığı kaymasın
}
// Kutunun tepesini eğime oturtur: üst yüz zUst(y, ofset) çizgisine (duvarların ve dikmelerin tepesi); ara köşe
// sıraları orantılı iner (bölümlü kutu kendi içine katlanmasın)
function egimeKes(g, ofset) {
  const p = g.attributes.position;
  g.computeBoundingBox();
  const z0 = g.boundingBox.min.z, z1 = g.boundingBox.max.z;
  for (let i = 0; i < p.count; i++) p.setZ(i, z0 + (p.getZ(i) - z0) * (zUst(p.getY(i), ofset) - z0) / (z1 - z0));
  g.computeVertexNormals();
  return g;
}
// Plan dikdörtgeninden delikleri çıkarır: kalan parçalar (x şeritleri, her şeritte y aralıkları)
function delikli(x0, x1, y0, y1, delikler) {
  const xs = [...new Set([x0, x1, ...delikler.flatMap(([a, b]) => [a, b]).filter((x) => x > x0 && x < x1)])].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], m = (a + b) / 2;
    const kes = delikler.filter(([dx0, dx1]) => m > dx0 && m < dx1).map(([, , dy0, dy1]) => [Math.max(y0, dy0), Math.min(y1, dy1)]).filter(([p, q]) => q > p).sort((p, q) => p[0] - q[0]);
    let y = y0;
    for (const [p, q] of kes) { if (p > y) out.push([a, b, y, p]); y = Math.max(y, q); }
    if (y < y1) out.push([a, b, y, y1]);
  }
  return out;
}

// ---- ışık payı ----
// Bir noktanın pencerelerden ve çatı pencerelerinden aldığı gün ışığının kabaca oranı (0,3…1): açıklıkların üstüne
// serpilmiş örnek noktalardan, uzaklıkla azalan, açıklığın ve yüzeyin yönüyle ağırlıklı toplam. Köşe rengine yazılır
// (malzemede vertexColors): pencereden uzak duvar, tavan ve döşeme kararır. three.js'te ortam ışığı engel tanımaz; bu
// olmadan odanın dibi pencere önü kadar aydınlık görünür.
const ACIKLIK = (() => {
  const n = [], P = CATI.pencere;
  for (let x = KC.x0 + 250; x < KC.x1; x += 500) for (let z = 250; z < KC.bas; z += 500) n.push([x, KC.y, z, 0, 1, 0, 1]);
  for (let y = DC.y0 + 250; y < DC.y1; y += 500) for (let z = 250; z < 2300; z += 500) n.push([DC.x, y, z, 1, 0, 0, 1]);
  for (let x = P.x0 + 200; x < P.x1; x += 400) for (let z = P.z0 + 200; z < P.z1; z += 400) n.push([x, IC.y1, z, 0, 1, 0, 1]);
  for (const [x0, x1, y0, y1] of CATI.isiklik) for (let x = x0 + 270; x < x1; x += 540) for (let y = y0 + 300; y < y1; y += 600) n.push([x, y, zUst(y, KAT.lambri), -TAN * 0, 0, 1, 2.2]);
  return n;
})();
function isikHam(x, y, z, nx, ny, nz) {
  let s = 0;
  for (const [ax, ay, az, ux, uy, uz, w] of ACIKLIK) {
    const dx = x - ax, dy = y - ay, dz = z - az, d = Math.hypot(dx, dy, dz) || 1;
    const ic = -(dx * ux + dy * uy + dz * uz) / d;         // açıklığın içeri bakan yönü
    if (ic <= 0) continue;
    const yuz = nx || ny || nz ? Math.max(0.35, -(dx * nx + dy * ny + dz * nz) / d) : 1; // odadan yansıyan ışık: en az 0,35
    s += w * ic * yuz / (1 + (d / 1700) ** 2);
  }
  return s;
}
const ISIK_REF = isikHam(800, 1400, 0, 0, 0, 1);
const isikPayi = (x, y, z, nx = 0, ny = 0, nz = 0) => 0.5 + 0.5 * Math.min(1, isikHam(x, y, z, nx, ny, nz) / ISIK_REF) ** 0.55;
// Geometrinin köşe rengini ışık payıyla doldurur (normali dünya yönünde)
function golgele(g, carp = 1) {
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const v = Math.min(1, isikPayi(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)) * carp);
    c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

// ---- dokular ----
// Sıva ve beton için ince kumlu doku (gri tonda; malzeme rengiyle çarpılır)
function kumDoku(seed, { taban = 228, sacilma = 22, boy = 256 } = {}) {
  const [c, g] = kanvas(boy, boy), r = rnd(seed), img = g.createImageData(boy, boy);
  for (let i = 0; i < boy * boy; i++) {
    const v = taban + (r() - 0.5) * sacilma + (r() < 0.02 ? -25 : 0);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return doku(c, { tekrar: true });
}
// Döşeme karosu: 40 cm karolar (doku 1,6 m = 4 × 4), derz ve karo başına ton farkı
function karoDoku() {
  const [c, g] = kanvas(512, 512), r = rnd(7);
  g.fillStyle = '#a49e95'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const v = 200 + (r() - 0.5) * 22;
    g.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
    g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
    for (let k = 0; k < 220; k++) { const s = (r() - 0.5) * 30; g.fillStyle = `rgba(${s > 0 ? 255 : 0},${s > 0 ? 255 : 0},${s > 0 ? 250 : 0},${Math.abs(s) / 300})`; g.fillRect(i * 128 + 3 + r() * 120, j * 128 + 3 + r() * 120, 2 + r() * 3, 2 + r() * 3); }
  }
  return doku(c, { tekrar: true });
}
// Ahşap lif: u boyunca uzun, dalgalı lif çizgileri (ton farkı), v'de katmanlar. lamel: v boyunca lamel derzi (mm/doku)
function ahsapDoku(seed, { renk = [214, 178, 132], lamel = 0, tahta = 0, boy = 512 } = {}) {
  const [c, g] = kanvas(boy, boy), r = rnd(seed);
  g.fillStyle = `rgb(${renk})`; g.fillRect(0, 0, boy, boy);
  // tahta: v boyunca tahta genişliği (doku = 1000 mm; tahta 120 mm ise 8,3 tahta): her tahta kendi tonunda
  const seritler = tahta ? Math.round(1000 / tahta) : lamel ? Math.round(1000 / lamel) : 1;
  const sh = boy / seritler;
  for (let k = 0; k < seritler; k++) {
    const f = 0.9 + r() * 0.2;
    g.fillStyle = `rgba(${renk.map((x) => Math.min(255, x * f) | 0)},1)`;
    g.fillRect(0, k * sh, boy, sh);
    for (let i = 0; i < 26; i++) { // lif
      const y0 = k * sh + r() * sh, a = 0.6 + r() * 2.5, ph = r() * 6, koyu = r() < 0.5;
      g.strokeStyle = koyu ? `rgba(90,58,30,${0.05 + r() * 0.1})` : `rgba(255,240,215,${0.05 + r() * 0.08})`;
      g.lineWidth = 0.6 + r() * 1.6;
      g.beginPath();
      for (let x = 0; x <= boy; x += 16) g.lineTo(x, y0 + Math.sin(x / boy * Math.PI * 2 * (1 + r() * 0.2) + ph) * a);
      g.stroke();
    }
    if (r() < 0.25) { // budak
      const bx = r() * boy, by = k * sh + sh * (0.3 + r() * 0.4);
      g.fillStyle = 'rgba(110,70,35,0.35)'; g.beginPath(); g.ellipse(bx, by, 7 + r() * 6, 3 + r() * 2, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = tahta ? 'rgba(60,38,20,0.55)' : 'rgba(80,52,28,0.22)'; // derz
    g.fillRect(0, k * sh, boy, tahta ? 2.2 : 1.2);
    if (tahta) for (let e = 0; e < 2; e++) { const ex = r() * boy; g.fillRect(ex, k * sh, 1.6, sh); } // tahta başları
  }
  return doku(c, { tekrar: true });
}

// ---- çatı ----
// Kirişler (kuzey-güney, eğimde; güney duvarına oturur, kuzey başlık kirişinin üstünden saçağa uzanır), aşıklar
// (doğu-batı, kirişlerin üstünde 600 aralıkla, doğu ve batı saçağa taşar), lambri (aşıkların üstünde; altı içeriden
// görünür), yalıtım ve dikişli sac, alın ve kenar sacları, çatı pencerelerinin kasası ve camı. Pencere boşluklarında
// lambri, kaplama ve aşıklar kesilir. Bütün ahşap kendi malzemesinde birleşik ağ (köşe rengi: ışık payı).
function cati(M) {
  const { kiris: K, asik: A, sacak: S, isiklik } = CATI;
  const kirisler = [], asiklar = [], lambri = [], kaplama = [], sac = [], kasa = [], camlar = [], astar = [];
  // Kirişler: içeride sıra (8), doğu başlığın üstünde kenar kirişi, batı duvarının üstünde kenar kirişi
  const xs = [...K.x, 3480, -6100];
  for (const x of xs) kirisler.push(golgele(egimli(x - K.en / 2, x + K.en / 2, S.g + 150, S.k, 0, K.boy, { uv: 'boy', bolY: 12 })));
  // Aşıklar: eğim boyunca 600 aralıkla; çatı pencerelerinin içinde kesilir (iki yandaki kirişe takılır)
  for (let y = S.g + 250; y < S.k - 40; y += A.aralik) {
    const parcalar = delikli(S.b, S.d, y - A.en / 2, y + A.en / 2, isiklik);
    for (const [x0, x1, y0, y1] of parcalar) if (y1 - y0 > A.en - 1) asiklar.push(golgele(egimli(x0, x1, y0, y1, KAT.kiris, A.boy, { uv: 'x', bolX: Math.max(1, Math.round((x1 - x0) / 800)) })));
  }
  // Lambri ve kaplama (pencere boşlukları hariç)
  for (const [x0, x1, y0, y1] of delikli(S.b, S.d, S.g, S.k, isiklik)) {
    lambri.push(golgele(egimli(x0, x1, y0, y1, KAT.lambri, CATI.lambri, { uv: 'lambri', bolX: Math.max(1, Math.round((x1 - x0) / 600)), bolY: Math.max(1, Math.round((y1 - y0) / 600)) })));
    kaplama.push(egimli(x0, x1, y0, y1, KAT.kaplama, CATI.kaplama));
  }
  // Alın sacı (kuzey uç), kenar sacları (doğu, batı), güney oluğu: kaplamanın ucunu örter, damlalık biraz aşağı sarkar
  const sacKal = CATI.lambri + CATI.kaplama + 40;
  sac.push(egimli(S.b - 30, S.d + 30, S.k - 2, S.k + 30, KAT.lambri - 20, sacKal));
  sac.push(egimli(S.d, S.d + 30, S.g, S.k, KAT.lambri - 20, sacKal), egimli(S.b - 30, S.b, S.g, S.k, KAT.lambri - 20, sacKal));
  sac.push(egimli(S.b - 30, S.d + 30, S.g - 30, S.g, KAT.lambri - 60, sacKal + 40));
  // Kenar alın tahtası (doğu ve batı saçakta aşıkların ucunu kapatır)
  for (const x of [S.d - 40, S.b]) kirisler.push(golgele(egimli(x, x + 40, S.g, S.k, KAT.kiris, A.boy, { uv: 'boy' })));
  // Çatı pencereleri: iç yüzde beyaz astar (lambriden sacın üstüne), alüminyum kasa, cam (eğimde, sacın üstünde)
  const tepe = KAT.kaplama + CATI.kaplama;
  for (const [x0, x1, y0, y1] of isiklik) {
    astar.push(egimli(x0, x0 + 12, y0, y1, KAT.lambri, tepe - KAT.lambri), egimli(x1 - 12, x1, y0, y1, KAT.lambri, tepe - KAT.lambri));
    astar.push(egimli(x0, x1, y0, y0 + 12, KAT.lambri, tepe - KAT.lambri), egimli(x0, x1, y1 - 12, y1, KAT.lambri, tepe - KAT.lambri));
    kasa.push(egimli(x0 - 40, x1 + 40, y0 - 40, y0 + 40, tepe, 70), egimli(x0 - 40, x1 + 40, y1 - 40, y1 + 40, tepe, 70));
    kasa.push(egimli(x0 - 40, x0 + 40, y0 + 40, y1 - 40, tepe, 70), egimli(x1 - 40, x1 + 40, y0 + 40, y1 - 40, tepe, 70));
    camlar.push(egimli(x0 + 40, x1 - 40, y0 + 40, y1 - 40, tepe + 40, 8));
  }
  const g = new THREE.Group();
  const kirisM = birlesik(kirisler, M.lamine);
  const asikM = birlesik(asiklar, M.lamine);
  const lambriM = birlesik(lambri, M.lambri);
  const kaplamaM = birlesik(kaplama, M.sac);
  const sacM = birlesik(sac, M.sac);
  const kasaM = birlesik(kasa, M.alu);
  const astarM = birlesik(astar, M.astar, { golge: false });
  const camM = birlesik(camlar, M.cam, { golge: false, alir: false });
  for (const m of [kirisM, asikM, lambriM, kaplamaM, sacM, kasaM, astarM, camM]) { m.raycast = () => {}; g.add(m); }
  return g;
}

// ---- kabuk: döşeme, duvarlar, cam cepheler ----
function kabuk(M) {
  const g = new THREE.Group();
  const { dis: D, pencere: P } = CATI;
  // Döşeme: iç hacim ve cam cephelerin dışındaki dar şerit (binanın kenarına kadar); dünya UV'li karo, ışık payı
  const zg = new THREE.PlaneGeometry(D.x1 - IC.x0, D.y1 - IC.y0, 48, 26).translate((IC.x0 + D.x1) / 2, (IC.y0 + D.y1) / 2, 0);
  { const p = zg.attributes.position, uv = zg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1600, p.getY(i) / 1600); }
  const zemin = new THREE.Mesh(golgele(zg), M.karo);
  zemin.receiveShadow = true;
  zemin.name = 'zemin';
  zemin.raycast = () => {};
  // Döşemenin kenar alnı ve dışarıdaki parapetsiz kenar (cam korkulukların altı)
  const alin = [aralik(IC.x0, D.x1, D.y1 - 20, D.y1, -320, 0), aralik(D.x1 - 20, D.x1, IC.y0, D.y1, -320, 0)];
  // Duvarlar (tepeleri lambrinin altına kadar: kirişler ve aşıklar duvara oturur)
  const ust = (geo) => egimeKes(geo, KAT.lambri + 6);
  const duvar = [
    ust(aralik(D.x0, D.x1, D.y0, IC.y0, -60, 4000, [24, 1, 8])),                    // güney
    ust(aralik(D.x0, IC.x0, IC.y0, D.y1, -60, 4000, [1, 14, 8])),                   // batı
    // kuzeyin kapalı kesimi (batı ucundan cam cepheye), küçük pencerenin boşluğuyla
    ust(aralik(IC.x0, P.x0, IC.y1, D.y1, -60, 4000, [7, 1, 8])),
    ust(aralik(P.x1, KC.x0, IC.y1, D.y1, -60, 4000, [3, 1, 8])),
    aralik(P.x0, P.x1, IC.y1, D.y1, -60, P.z0, [2, 1, 2]),
    ust(aralik(P.x0, P.x1, IC.y1, D.y1, P.z1, 4000, [2, 1, 3])),
    ust(aralik(KC.x0 - 160, KC.x0, IC.y1, D.y1, -60, 4000)),                        // cam cephenin batı dikmesi (sıvalı)
    ust(aralik(IC.x1, D.x1, D.y0, DC.y0, -60, 4000, [1, 2, 8])),                    // doğu cephenin güney ayağı
  ].map((d) => golgele(dunyaUV(d, 1000)));
  g.add(zemin, birlesik(duvar, M.siva), birlesik(alin.map((d) => dunyaUV(d, 1000)), M.beton));
  // Süpürgelik (iç yüzlerde, 80 mm)
  const sup = [aralik(IC.x0, IC.x1, IC.y0, IC.y0 + 14, 0, 80), aralik(IC.x0, IC.x0 + 14, IC.y0, IC.y1, 0, 80), aralik(IC.x0, KC.x0 - 160, IC.y1 - 14, IC.y1, 0, 80)];
  g.add(birlesik(sup, M.supurgelik, { golge: false }));
  // Küçük pencere: kasa, cam, iç denizlik (mermer)
  const pk = [aralik(P.x0, P.x1, IC.y1 + 60, IC.y1 + 130, P.z0, P.z0 + 60), aralik(P.x0, P.x1, IC.y1 + 60, IC.y1 + 130, P.z1 - 60, P.z1),
    aralik(P.x0, P.x0 + 60, IC.y1 + 60, IC.y1 + 130, P.z0, P.z1), aralik(P.x1 - 60, P.x1, IC.y1 + 60, IC.y1 + 130, P.z0, P.z1),
    aralik((P.x0 + P.x1) / 2 - 25, (P.x0 + P.x1) / 2 + 25, IC.y1 + 70, IC.y1 + 120, P.z0, P.z1)];
  const pc = [aralik(P.x0 + 60, P.x1 - 60, IC.y1 + 93, IC.y1 + 97, P.z0 + 60, P.z1 - 60)];
  g.add(birlesik(pk, M.alu), birlesik(pc, M.cam, { golge: false, alir: false }));
  g.add(birlesik([aralik(P.x0 - 40, P.x1 + 40, IC.y1 - 40, IC.y1 + 70, P.z0 - 30, P.z0)], M.mermer));
  g.traverse((o) => { if (o !== zemin) o.raycast = () => {}; });
  return g;
}
// Cam cepheler: ince çelik başlık kirişleri (kuzeyde yatay, doğuda eğimde; çatı kirişleri üstüne oturur), lamine köşe
// dikmesi, sürgü kasası, toplanmış kanatlar, kapıların üstünde sabit cam (doğuda yamuk), kuzeyde başlığın üstünde
// kirişlerin arası da cam (içeriden kirişlerin saçağa uzandığı ve saçak altı görünür), açıklıkta cam korkuluk
function camCephe(M) {
  const k = [], celik = [], alu = [], cam = [], korkulukCam = [], dolgu = [];
  const t = 80, B = 160; // başlık kirişinin yarı genişliği, yüksekliği
  celik.push(aralik(KC.x0 - 160, IC.x1 + 160, KC.y - t, KC.y + t, KC.bas, KC.bas + B));
  celik.push(egimli(DC.x - t, DC.x + t, IC.y0 - 100, KC.y + t, -B, B));
  k.push(golgele(dunyaUV(aralik(IC.x1, IC.x1 + 160, KC.y - t, KC.y + t, 0, KC.bas, [1, 1, 4]), 1000)));
  // Kuzeyde başlığın üstü: kirişlerin arasında cam (kirişin altından lambriye); kirişlerin arası açık bölmeler
  const kx = [KC.x0 - 160, ...CATI.kiris.x.filter((x) => x > KC.x0 && x < IC.x1), 3480].sort((a, b) => a - b);
  for (let i = 0; i < kx.length - 1; i++) {
    const a = kx[i] + (i ? CATI.kiris.en / 2 : 160), b = kx[i + 1] - CATI.kiris.en / 2;
    cam.push(egimeKes(aralik(a, b, KC.y - 3, KC.y + 3, KC.bas + B, 4000), KAT.lambri - 2));
    alu.push(aralik(a, b, KC.y - 25, KC.y + 25, KC.bas + B, KC.bas + B + 30));
  }
  // Doğu başlığının üstü: kenar kirişi oturur, aşıklar arası dolgu ahşap (eğimde)
  dolgu.push(egimli(DC.x - 60, DC.x + 60, IC.y0, KC.y - 60, KAT.kiris, CATI.asik.boy, { uv: 'boy', bolY: 6 }));
  // Kuzey sürgü: alt ray, üst ray (kapı boyunda), kayıt (kapı ile sabit cam arası), sabit camın dikmeleri
  const kz = KC.kapi, ky = KC.y;
  alu.push(aralik(KC.x0, IC.x1, ky - 70, ky + 70, 0, 25), aralik(KC.x0, IC.x1, ky - 70, ky + 70, kz, kz + 60));
  for (const d of [-45, 0, 45]) alu.push(aralik(KC.x0, IC.x1, ky + d - 4, ky + d + 4, 25, 37));
  const kxs = [KC.x0, -600, 600, 1800, IC.x1]; // dikmeler çatı kirişlerinin hizasında
  for (const x of kxs) alu.push(aralik(x - 30, x + 30, ky - 30, ky + 30, kz + 60, KC.bas));
  for (let i = 0; i < kxs.length - 1; i++) cam.push(aralik(kxs[i] + 30, kxs[i + 1] - 30, ky - 3, ky + 3, kz + 60, KC.bas));
  // Kuzey kanatları: üç kanat batı uçta üst üste (her biri kendi rayında, 20 mm kaymış)
  const kanat = (a, b, y, yon) => { // yon: 'x' (kuzey, kanat x boyunca) ya da 'y' (doğu)
    const c = 70, z0 = 37, z1 = kz - 5, T = 26;
    const kut = yon === 'x' ? (p, q, r, s) => aralik(p, q, y - T, y + T, r, s) : (p, q, r, s) => aralik(y - T, y + T, p, q, r, s);
    alu.push(kut(a, a + c, z0, z1), kut(b - c, b, z0, z1), kut(a + c, b - c, z0, z0 + c), kut(a + c, b - c, z1 - c, z1));
    cam.push(yon === 'x' ? aralik(a + c, b - c, y - 2, y + 2, z0 + c, z1 - c) : aralik(y - 2, y + 2, a + c, b - c, z0 + c, z1 - c));
  };
  for (let i = 0; i < 3; i++) kanat(KC.x0 + 20 + i * 20, KC.x0 + 20 + i * 20 + 1650, ky - 45 + i * 45, 'x');
  // Doğu sürgü: raylar, kayıt (eğimde değil, kapı boyunda), sabit yamuk cam (kayıttan başlık kirişinin altına)
  const dx = DC.x, dz = DC.kapi;
  alu.push(aralik(dx - 70, dx + 70, DC.y0, KC.y - 80, 0, 25), aralik(dx - 70, dx + 70, DC.y0, KC.y - 80, dz, dz + 60));
  for (const d of [-45, 0, 45]) alu.push(aralik(dx + d - 4, dx + d + 4, DC.y0, KC.y - 80, 25, 37));
  const dys = [DC.y0, -1100, 100, 1300, KC.y - 80];
  const basAlt = (y) => zAlt(y) - B / COS;                   // doğu başlık kirişinin altı
  for (const y of dys) alu.push(egimeKes(aralik(dx - 30, dx + 30, y - 30, y + 30, dz + 60, 4000), -B - 4));
  for (let i = 0; i < dys.length - 1; i++) {
    const gc = aralik(dx - 3, dx + 3, dys[i] + 30, dys[i + 1] - 30, dz + 60, 4000);
    cam.push(egimeKes(gc, -B - 6));
  }
  for (let i = 0; i < 3; i++) kanat(DC.y0 + 20 + i * 20, DC.y0 + 20 + i * 20 + 1650, dx - 45 + i * 45, 'y');
  // Duvar ile doğu cephe arası: güney ayağın kenar dikmesi
  alu.push(aralik(dx - 40, dx + 40, DC.y0 - 10, DC.y0 + 40, 0, basAlt(DC.y0)));
  // Cam korkuluklar (açıklıklarda, 1000 mm): alt kanal (alüminyum), 12 mm cam, üstte paslanmaz küpeşte
  const kk = (x0, x1, y0, y1, yatay) => {
    alu.push(yatay ? aralik(x0, x1, y0 - 30, y0 + 30, 0, 110) : aralik(x0 - 30, x0 + 30, y0, y1, 0, 110));
    korkulukCam.push(yatay ? aralik(x0, x1, y0 - 6, y0 + 6, 110, 1000) : aralik(x0 - 6, x0 + 6, y0, y1, 110, 1000));
    alu.push(yatay ? cubuk([x0, y0, 1012], [x1, y0, 1012], 20, 20, 12) : cubuk([x0, y0, 1012], [x0, y1, 1012], 20, 20, 12));
  };
  kk(KC.x0 + 1720, IC.x1 + 70, IC.y1 + 150, 0, true);
  kk(IC.x1 + 150, 0, DC.y0 + 1720, KC.y + 70, false);
  const g = new THREE.Group();
  const ahsapM = birlesik([...k, ...dolgu.map((d) => golgele(d))], M.lamine), celikM = birlesik(celik, M.celik);
  const aluM = birlesik(alu, M.alu), camM = birlesik(cam, M.cam, { golge: false, alir: false });
  const kcM = birlesik(korkulukCam, M.korkuluk, { golge: false, alir: false });
  for (const m of [ahsapM, celikM, aluM, camM, kcM]) { m.raycast = () => {}; g.add(m); }
  return g;
}

// ---- batı duvarı: kitaplıklar, köprü dolap, TV konsolu ----
// Kutu oyunları: markasız kutular, kapakta kendi doodle desenimiz, yanlarda düz renk şerit (tek atlas, 4 × 4 hücre:
// 10 kapak, 6 yan)
function kutuAtlasi() {
  const [c, g] = kanvas(1024, 1024), r = rnd(61), S = 256;
  const zemin = ['#d9cdb4', '#e8c48c', '#9fb7b0', '#c9a3a0', '#b7c49a', '#a8b6cf', '#e4ddcf', '#d39b6a', '#8fa7a0', '#cdbfd8'];
  const ink = '#2a2622';
  const desen = [
    (x, y) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const cx = x + 40 + i * 58 + (j % 2) * 29, cy = y + 40 + j * 50; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(cx + 24 * Math.cos(a), cy + 24 * Math.sin(a)); } g.closePath(); g.stroke(); } },
    (x, y) => { g.beginPath(); g.arc(x + 180, y + 70, 36, 0, Math.PI * 2); g.stroke(); for (let k = 0; k < 4; k++) { g.beginPath(); for (let i = 0; i <= 20; i++) g.lineTo(x + 20 + i * 11, y + 140 + k * 26 + Math.sin(i * 0.9 + k) * 8); g.stroke(); } },
    (x, y) => { g.beginPath(); g.moveTo(x + 15, y + 200); g.lineTo(x + 80, y + 90); g.lineTo(x + 120, y + 150); g.lineTo(x + 170, y + 60); g.lineTo(x + 240, y + 200); g.stroke(); g.beginPath(); g.moveTo(x + 15, y + 225); g.bezierCurveTo(x + 90, y + 190, x + 160, y + 250, x + 240, y + 215); g.stroke(); },
    (x, y) => { for (let i = 0; i < 5; i++) { const tx = x + 30 + i * 46, ty = y + 70 + (i % 2) * 70; g.beginPath(); g.moveTo(tx, ty + 70); g.lineTo(tx + 20, ty); g.lineTo(tx + 40, ty + 70); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(tx + 20, ty + 70); g.lineTo(tx + 20, ty + 90); g.stroke(); } },
    (x, y) => { g.beginPath(); for (let a = 0; a < 18; a += 0.15) g.lineTo(x + 128 + Math.cos(a) * a * 5.5, y + 128 + Math.sin(a) * a * 5.5); g.stroke(); for (let k = 0; k < 14; k++) { g.beginPath(); g.arc(x + 20 + r() * 216, y + 20 + r() * 216, 4, 0, Math.PI * 2); g.fill(); } },
    (x, y) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { g.beginPath(); g.arc(x + 42 + i * 58, y + 42 + j * 58, 18, 0, Math.PI * 2); g.stroke(); } else g.strokeRect(x + 26 + i * 58, y + 26 + j * 58, 32, 32); },
    (x, y) => { g.beginPath(); g.arc(x + 70, y + 70, 34, 0.6, Math.PI * 1.7); g.stroke(); for (let k = 0; k < 6; k++) { const sx = x + 120 + r() * 110, sy = y + 40 + r() * 180; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? 6 : 15; g.lineTo(sx + rr * Math.cos(a), sy + rr * Math.sin(a)); } g.closePath(); g.stroke(); } },
    (x, y) => { for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 24; i++) g.lineTo(x + 15 + i * 9.5, y + 170 + k * 22 + Math.sin(i * 0.8 + k * 2) * 7); g.stroke(); } g.beginPath(); g.moveTo(x + 90, y + 160); g.lineTo(x + 170, y + 160); g.lineTo(x + 150, y + 185); g.lineTo(x + 108, y + 185); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(x + 130, y + 160); g.lineTo(x + 130, y + 70); g.lineTo(x + 175, y + 140); g.closePath(); g.stroke(); },
    (x, y) => { for (let i = 0; i < 3; i++) { const px = x + 50 + i * 75, py = y + 150; g.beginPath(); g.arc(px, py - 60, 16, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(px - 26, py + 40); g.quadraticCurveTo(px - 14, py - 40, px, py - 42); g.quadraticCurveTo(px + 14, py - 40, px + 26, py + 40); g.closePath(); g.stroke(); } },
    (x, y) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const bx = x + 30 + i * 110, by = y + 30 + j * 110; g.strokeRect(bx, by, 86, 86); const pips = [[1, 1], [0, 0], [2, 2], [0, 2], [2, 0], [1, 0], [1, 2]].slice(0, 2 + i + j * 2); for (const [a, b] of pips) { g.beginPath(); g.arc(bx + 18 + a * 25, by + 18 + b * 25, 6, 0, Math.PI * 2); g.fill(); } } },
  ];
  g.lineCap = g.lineJoin = 'round';
  desen.forEach((f, i) => {
    const x = (i % 4) * S, y = Math.floor(i / 4) * S;
    g.fillStyle = zemin[i]; g.fillRect(x, y, S, S);
    g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 5;
    f(x, y);
    g.lineWidth = 8; g.strokeRect(x + 6, y + 6, S - 12, S - 12);
  });
  const yanlar = ['#7d3b2d', '#2f4858', '#c99a3b', '#4b6043', '#8b5a7a', '#3c6e8f'];
  yanlar.forEach((renk, j) => {
    const i = 10 + j, x = (i % 4) * S, y = Math.floor(i / 4) * S;
    g.fillStyle = renk; g.fillRect(x, y, S, S);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(x, y + S * 0.42, S, S * 0.16);
  });
  return doku(c);
}
const ATLAS_HC = (i) => [((i % 4) + 0.02) / 4, 1 - (Math.floor(i / 4) + 0.98) / 4, ((i % 4) + 0.98) / 4, 1 - (Math.floor(i / 4) + 0.02) / 4];
// Kitaplık (yerel çerçeve: önü −y, sırtı +y duvarda, x genişlik): baza, iki çekmece (gömme kulp), dört göz, arkalık.
// Gözlerde kutu oyunları (yatay yığın, dik dizili sırtlar, öne dönük kapak), kitaplar, tasarım çalışmaları için boş
// yerler (büst ve vazo; yer listesi döner). Kutular ve kitaplar tek ağ (atlas), gövde tek ağ.
const RAF_Z = [700, 1080, 1460, 1840, 2325];
function kitaplikGovde(r, { yerler, kutular, kitaplar }) {
  const { en: W, derin: D, boy: H } = KITAPLIK, t = 25, g = [], cek = [];
  g.push(aralik(-W / 2, -W / 2 + t, -D / 2, D / 2, 0, H), aralik(W / 2 - t, W / 2, -D / 2, D / 2, 0, H)); // yanlar
  g.push(aralik(-W / 2 + t, W / 2 - t, -D / 2 + 40, D / 2, 0, 80));                                        // baza
  for (const z of RAF_Z) g.push(aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, z, z + t));               // raflar ve tepe
  g.push(aralik(-W / 2 + t, W / 2 - t, D / 2 - 10, D / 2, 80, H));                                       // arkalık
  // Çekmeceler: 80..700 arası iki ön (3 mm aralık), üst kenarında gömme kulp yarığı
  for (const [z0, z1] of [[83, 388], [391, 697]]) {
    cek.push(aralik(-W / 2 + t + 2, W / 2 - t - 2, -D / 2 - 2, -D / 2 + 18, z0, z1 - 28));
    cek.push(aralik(-W / 2 + t + 2, W / 2 - t - 2, -D / 2 + 6, -D / 2 + 18, z1 - 28, z1));             // kulp yarığının arkası
  }
  // Göz içleri: her göz için bir düzen
  const kutu = (w, d, h, x, y, z, kapakYuz, rz = 0) => {
    const geo = new THREE.BoxGeometry(w, d, h);
    const yanH = ATLAS_HC(10 + Math.floor(r() * 6)), kapak = ATLAS_HC(Math.floor(r() * 10));
    for (let f = 0; f < 6; f++) hucreUV(geo, f === kapakYuz ? kapak : yanH, f);
    kutular.push(geo.rotateZ(rz).translate(x, y, z));
  };
  const xMin = -W / 2 + t + 8, xMax = W / 2 - t - 8, yOn = -D / 2 + 25;
  const duzen = (gozNo, z0, bos) => {
    let x = xMin;
    const tip = gozNo % 4;
    if (tip === 0 || tip === 2) { // yatay yığın (kapak yukarı) + dik dizili sırtlar
      const sw = 300 + r() * 20, sd = 300;
      let zz = z0;
      for (let k = 0; k < 3 && zz + 90 < z0 + bos; k++) { const h = 60 + r() * 30; kutu(sw - k * 14, sd - k * 10, h, x + sw / 2, yOn + sd / 2, zz + h / 2, 4); zz += h + 1; }
      x += sw + 20;
      const sinir = tip === 0 ? xMax - 260 : xMax;
      while (x < sinir - 60) { const kal = 60 + r() * 30, h = Math.min(bos - 30, 260 + r() * 40); kutu(kal, 280, h, x + kal / 2, yOn + 140, z0 + h / 2, 0); x += kal + 3; }
      if (tip === 0) yerler.push([(x + xMax) / 2 + 10, -20, z0]);                      // tasarım çalışması (büst/vazo)
    } else { // kitaplar + öne dönük kutu kapağı + boş yer
      while (x < -60) {
        const kal = 22 + r() * 22, h = Math.min(bos - 20, 200 + r() * 70), d = 150 + r() * 60;
        kitaplar.push({ p: [x + kal / 2, yOn + d / 2, z0 + h / 2], s: [kal, d, h], e: 0 });
        x += kal + 1;
      }
      kitaplar.push({ p: [x + 40, yOn + 90, z0 + 95 * Math.cos(0.32) + 2], s: [26, 170, 190], e: -0.32 });
      x += 110;
      const fh = Math.min(bos - 30, 290), fw = 280;
      kutu(fw, 70, fh, x + fw / 2, D / 2 - 60, z0 + fh / 2, 3);                                                // kapağı öne (−y)
      if (x + fw + 160 < xMax) yerler.push([x + fw + 90, -40, z0]);
    }
  };
  for (let i = 0; i < 4; i++) duzen(i + Math.floor(r() * 2), RAF_Z[i] + t, RAF_Z[i + 1] - RAF_Z[i] - t);
  return { govde: g, cekmece: cek };
}
function batiDuvari(M, kutuTex) {
  const grup = new THREE.Group(), r = rnd(91);
  const govde = [], cekmece = [], kutular = [], kitaplar = [], yerler = [];
  const yer = (geo, yc) => geo.rotateZ(Math.PI / 2).translate(IC.x0 + KITAPLIK.derin / 2, yc, 0); // önü +x, sırtı duvarda
  for (const yc of KITAPLIK.y) {
    const k = { yerler: [], kutular: [], kitaplar: [] };
    const { govde: g, cekmece: c } = kitaplikGovde(r, k);
    govde.push(...g.map((x) => yer(x, yc)));
    cekmece.push(...c.map((x) => yer(x, yc)));
    kutular.push(...k.kutular.map((x) => yer(x, yc)));
    for (const b of k.kitaplar) kitaplar.push({ ...b, p: [IC.x0 + KITAPLIK.derin / 2 - b.p[1], yc + b.p[0], b.p[2]], s: [b.s[1], b.s[0], b.s[2]], e: b.e });
    for (const [x, y, z] of k.yerler) yerler.push([IC.x0 + KITAPLIK.derin / 2 - y, yc + x, z]);
  }
  // Köprü dolap (TV'nin üstü, iki kitaplığın arası): açık iki göz; TV konsolu (alçak, üç kapaklı, ayaklı)
  const kx0 = IC.x0, kx1 = IC.x0 + KITAPLIK.derin, y0 = KITAPLIK.y[0] + KITAPLIK.en / 2, y1 = KITAPLIK.y[1] - KITAPLIK.en / 2;
  govde.push(aralik(kx0, kx1, y0, y1, 2000, 2025), aralik(kx0, kx1, y0, y1, RAF_Z[4], RAF_Z[4] + 25), aralik(kx0, kx0 + 10, y0, y1, 2025, RAF_Z[4]));
  govde.push(aralik(kx0 + 10, kx1, -12, 12, 2025, RAF_Z[4]));
  for (const [a, b] of [[y0 + 60, -60], [60, y1 - 60]]) { // köprü gözlerinde dik dizili kutular
    let y = a;
    while (y < b - 80) { const kal = 60 + r() * 30, h = 250 + r() * 40; const geo = new THREE.BoxGeometry(280, kal, h); const yanH = ATLAS_HC(10 + Math.floor(r() * 6)); for (let f = 0; f < 6; f++) hucreUV(geo, yanH, f); kutular.push(geo.translate(kx0 + 20 + 140, y + kal / 2, 2025 + h / 2)); y += kal + 3; if (r() < 0.12) y += 120; }
  }
  const K = KONSOL, cx1 = IC.x0 + K.derin;
  govde.push(aralik(IC.x0 + 10, cx1, K.y0, K.y1, 120, K.boy), ...[K.y0 + 40, K.y1 - 40].flatMap((y) => [aralik(cx1 - 70, cx1 - 40, y - 15, y + 15, 0, 120), aralik(IC.x0 + 40, IC.x0 + 70, y - 15, y + 15, 0, 120)]));
  const kapak = (K.y1 - K.y0 - 8) / 3;
  for (let i = 0; i < 3; i++) cekmece.push(aralik(cx1, cx1 + 18, K.y0 + 4 + i * kapak + 2, K.y0 + 4 + (i + 1) * kapak - 2, 126, K.boy - 6));
  const govdeM = birlesik(govde.map((x) => golgele(x, 1.05)), M.mese), cekM = birlesik(cekmece.map((x) => golgele(x, 1.05)), M.meseKoyu);
  const kutuM = birlesik(kutular, new THREE.MeshStandardMaterial({ map: kutuTex, roughness: 0.7 }));
  const kitapR = [0x7d3b2d, 0x2f4858, 0xd8c49a, 0x4b6043, 0xa4683a, 0x1f2f3a, 0xc2b59b, 0x6b2e3e, 0xb9a26a];
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.75 }), kitaplar.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  kitaplar.forEach((k, i) => {
    q.setFromEuler(e.set(k.e, 0, 0)); // yaslanan kitap: dünya y'si boyunca (kitaplığın genişliği) yatar
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(...k.p), q, new THREE.Vector3(...k.s)));
    im.setColorAt(i, c.set(kitapR[Math.floor(r() * kitapR.length)]).multiplyScalar(0.8));
  });
  im.castShadow = im.receiveShadow = true;
  for (const m of [govdeM, cekM, kutuM, im]) { m.castShadow = m.receiveShadow = true; grup.add(m); }
  // Tıklama vekili: iki kitaplık ve köprü (TV ayrı nesne)
  const vekil = new THREE.Mesh(mergeGeometries(KITAPLIK.y.map((yc) => aralik(IC.x0, IC.x0 + KITAPLIK.derin + 20, yc - KITAPLIK.en / 2, yc + KITAPLIK.en / 2, 0, KITAPLIK.boy))), new THREE.MeshBasicMaterial({ visible: false }));
  grup.add(vekil);
  return { grup, yerler };
}
// Tasarım çalışmaları rafta: Modern Balbal büstleri (heykel modelleri, 180 mm, taş tozu tonu) ve vazolarımız
async function rafEserleri(grup, yerler, M) {
  const isler = [];
  const bustler = ESERLER.filter((e) => e.model);
  const vazolar = [['tulip', 0xece9e2], ['ribbed', 0x8fa58a], ['silk', 0xd49a9a], ['star', 0x2c3e66], ['amphora', 0xc49a3c]];
  yerler.forEach(([x, y, z], i) => {
    if (i % 2 === 0 && bustler.length) {
      const e = bustler.shift();
      isler.push(gltf(new URL(e.model, new URL('../lab/', import.meta.url)).href).then((k) => {
        const s = k.scene, b = new THREE.Box3().setFromObject(s), boy = b.getSize(new THREE.Vector3());
        const olc = 180 / Math.max(boy.z, boy.y, 1); // model ekseni bilinmiyor: en uzun düşey ölçü 180 mm
        s.scale.setScalar(olc);
        const b2 = new THREE.Box3().setFromObject(s), c = b2.getCenter(new THREE.Vector3());
        s.position.set(-c.x, -c.y, -b2.min.z);
        const tas = new THREE.MeshStandardMaterial({ color: e.ton ?? 0xd9d5cd, roughness: 0.82, map: M.tasDoku });
        s.traverse((o) => { if (o.isMesh) { o.material = tas; o.castShadow = o.receiveShadow = true; o.raycast = () => {}; } });
        const kap = new THREE.Group();
        kap.add(s);
        kap.position.set(x, y, z);
        kap.rotation.z = Math.PI / 2 + (i % 4 - 1.5) * 0.18; // yüzü odaya (+x)
        grup.add(kap);
      }).catch((err) => console.warn('büst', e.id, err)));
    } else {
      const [id, renk] = vazolar[i % vazolar.length];
      const v = vaseModel(id, { color: renk }, { malzeme: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42 }) });
      v.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.raycast = () => {}; } });
      const b = new THREE.Box3().setFromObject(v), boy = b.getSize(new THREE.Vector3());
      if (boy.z > 300) v.scale.setScalar(300 / boy.z);
      v.position.set(x, y, z);
      grup.add(v);
    }
  });
  await Promise.all(isler);
}

// ---- güney duvarında çerçeveler: kendi işlerimizin fotoğrafları (kitaplık kartındaki galeriyle aynı) ----
// Ahşap çerçeve, beyaz paspartu, fotoğraf (4:5, kırpılarak sığar); göz hizasında, aralıklı. Yüzü kuzeye (odaya)
const CERCEVE = { y: IC.y0, z: 1500, x: [-3500, -2450, -1400, -350], boy: [[520, 650], [420, 525], [520, 650], [420, 525]] };
function cerceveler(M) {
  const g = new THREE.Group(), cer = [], pas = [];
  const yukle = new THREE.TextureLoader();
  CERCEVE.x.forEach((x, i) => {
    const [w, h] = CERCEVE.boy[i], is = RAF_ISLERI[i % RAF_ISLERI.length], y = CERCEVE.y, z = CERCEVE.z, k = 28;
    cer.push(aralik(x - w / 2, x + w / 2, y, y + 30, z - h / 2, z + h / 2));
    pas.push(aralik(x - w / 2 + k, x + w / 2 - k, y + 30, y + 32, z - h / 2 + k, z + h / 2 - k));
    const fw = w - 2 * k - 70, fh = h - 2 * k - 70;
    const tex = yukle.load(new URL(is.gorsel, new URL('../lab/', import.meta.url)).href, (t) => { // kapak kırpması (4:5)
      const a = t.image.width / t.image.height, hedef = fw / fh;
      if (a > hedef) { t.repeat.set(hedef / a, 1); t.offset.set((1 - hedef / a) / 2, 0); } else { t.repeat.set(1, a / hedef); t.offset.set(0, (1 - a / hedef) / 2); }
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    const foto = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh).rotateX(Math.PI / 2).rotateZ(Math.PI), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
    foto.position.set(x, y + 34, z);
    foto.receiveShadow = true;
    g.add(foto);
  });
  g.add(birlesik(cer.map((c) => golgele(c, 1.05)), M.mese), birlesik(pas, M.astar, { golge: false }));
  g.traverse((o) => { o.raycast = () => {}; });
  return g;
}

// ---- saksılar ve bitkiler ----
// Saksılar vazo aracının şablonlarından (ölçüsü büyütülmüş, renkleri farklı, toprakla dolu); bitkiler
// assets/cati/bitkiler.glb'den (Poly Haven CC0; scripts/cati-bitki.py), saksının toprağına oturur, ağız çapına göre
// ölçeklenir
async function saksilar(scene, M) {
  const grup = new THREE.Group();
  const toprak = new THREE.MeshStandardMaterial({ color: 0x3a2b22, roughness: 1, map: M.kum });
  const kaplar = SAKSILAR.map(([x, y, z, id, renk, , over], i) => {
    const v = vaseModel(id, { ...over, color: renk }, { toprak, malzeme: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }) });
    v.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.raycast = () => {}; } });
    v.position.set(x, y, z);
    v.rotation.z = i * 1.3;
    grup.add(v);
    return v;
  });
  scene.add(grup);
  try {
    const kaynak = await gltf(KOK + 'cati/bitkiler.glb');
    SAKSILAR.forEach(([, , , , , adlar, over], i) => {
      const asil = adlar.map((ad) => kaynak.scene.getObjectByName(ad)).find(Boolean);
      if (!asil) return;
      const b = asil.clone(true), kap = new THREE.Group();
      kap.add(b);
      const kutu = new THREE.Box3().setFromObject(b), boy = kutu.getSize(new THREE.Vector3());
      const agiz = (over.dTop ?? 200) * 0.9, olc = Math.max(1, Math.min(2.2, (agiz * 2.2) / Math.max(boy.x, boy.y, 1)));
      b.scale.multiplyScalar(olc);
      b.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = o.receiveShadow = true; o.raycast = () => {};
        const m = o.material; if (m && m.transparent) { m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; } // oda gotcha'sı
      });
      kap.position.set(0, 0, kaplar[i].userData.soil ?? over.height - 12);
      kap.rotation.z = i * 2.1;
      kaplar[i].add(kap);
    });
  } catch (e) { console.warn('bitkiler', e); }
  return grup;
}

// ---- hakkımda: A tipi kara tahta; logo ve 'Oktos Workshop · Ankara' tebeşirle ----
const yaziTipleri = () => Promise.race([
  Promise.all(['700 74px "Big Shoulders Display"', '600 38px "Schibsted Grotesk"', '500 30px "Schibsted Grotesk"', '500 26px "IBM Plex Mono"'].map((f) => document.fonts?.load(f))),
  new Promise((r) => setTimeout(r, 1500)),
]).catch(() => {});
async function karaTahta(lang, ahsapM) {
  await yaziTipleri();
  const [c, g] = kanvas(768, 1024), r = rnd(9);
  g.fillStyle = '#20282a'; g.fillRect(0, 0, 768, 1024);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * 768, r() * 1024, 1 + r() * 30, 1 + r() * 3); }
  try {
    const logo = await resim(new URL('./logo-beyaz.svg', import.meta.url).href);
    const k = 360 / Math.max(logo.width || 360, 1);
    g.globalAlpha = 0.92; g.drawImage(logo, (768 - 360) / 2, 150, 360, (logo.height || 280) * k); g.globalAlpha = 1;
  } catch (e) { /* logo yoksa yalnız yazı */ }
  g.fillStyle = 'rgba(245,242,232,0.94)'; g.textAlign = 'center';
  g.font = '700 74px "Big Shoulders Display", "Schibsted Grotesk", Arial, sans-serif';
  g.fillText('OKTOS WORKSHOP', 384, 600);
  g.font = '500 44px "Schibsted Grotesk", Arial, sans-serif';
  g.fillText(lang === 'en' ? 'Design · Print · Mould · Cast' : 'Tasarım · Baskı · Kalıp · Döküm', 384, 690);
  g.fillText('Ankara', 384, 780);
  g.strokeStyle = 'rgba(245,242,232,0.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(170, 640); g.lineTo(598, 640); g.stroke();
  const t = doku(c);
  const grup = new THREE.Group();
  const W = 720, H = 960, Z0 = 520, egim = 0.16;
  const levha = new THREE.Group();
  const cer = new THREE.Mesh(new THREE.BoxGeometry(W + 60, 36, H + 60), ahsapM); cer.castShadow = true;
  const yuz = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  yuz.position.y = -19;
  levha.add(cer, yuz);
  levha.position.z = Z0 + H / 2;
  levha.rotation.x = -egim;
  grup.add(levha);
  const ayak = (ust, alt) => {
    const a = new THREE.Vector3(...ust), b = new THREE.Vector3(...alt);
    const m = new THREE.Mesh(new THREE.BoxGeometry(34, 34, a.distanceTo(b)), ahsapM);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
    m.castShadow = true;
    grup.add(m);
  };
  const tepeZ = Z0 + H + 40, tepeY = Math.sin(egim) * (H / 2) + 30;
  ayak([-W / 2 + 40, tepeY, tepeZ], [-W / 2 - 40, -90, 0]);
  ayak([W / 2 - 40, tepeY, tepeZ], [W / 2 + 40, -90, 0]);
  ayak([0, tepeY + 20, tepeZ], [0, 520, 0]);
  const raf = new THREE.Mesh(new THREE.BoxGeometry(W + 80, 70, 24), ahsapM); raf.position.set(0, -60, Z0 - 10); raf.castShadow = true; grup.add(raf);
  grup.position.set(TAHTA.x, TAHTA.y, 0);
  const d = new THREE.Vector2(FOCUS.hakkimda.pos[0] - TAHTA.x, FOCUS.hakkimda.pos[1] - TAHTA.y).normalize();
  grup.rotation.z = Math.atan2(d.x, -d.y);
  return grup;
}

// ---- Biggie ve robotu ----
// Biggie teleskobun yanında ayakta bekler ('dur'); görünmez vekil kutu tıklama ve kadraj için
function biggieGrubu() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(520, 520, 1000).translate(0, 0, 500), new THREE.MeshBasicMaterial({ visible: false })));
  g.position.set(BIGGIE_YER.x, BIGGIE_YER.y, 0);
  g.rotation.z = Math.atan2(BIGGIE_YER.yon[0], -BIGGIE_YER.yon[1]); // modelin önü yerel −y
  return g;
}
async function biggieyiYukle(g, durum) {
  try {
    const k = await gltf(KOK + 'oda/karakter.glb');
    const model = k.scene;
    model.scale.setScalar(1000);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.raycast = () => {}; } });
    g.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const klip = (ad) => k.animations.find((a) => a.name === ad);
    const dur = klip('dur') ? mixer.clipAction(klip('dur')) : null;
    dur?.play();
    durum.biggie = { mixer, dur, klip, aktif: dur, model };
  } catch (e) { console.warn('biggie', e); }
}
async function robotuKoy(scene, durum) {
  try {
    const e = await gltf(KOK + 'oda/oda-esya.glb');
    const s = e.scene.getObjectByName('supurge');
    if (!s) return;
    const kap = new THREE.Group(); // Blender'ın taban kayması düğümde kalır (oda gotcha'sı): kabı yerleştir
    kap.add(s);
    s.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.raycast = () => {}; } });
    const ledler = ['supurge_led_sari', 'supurge_led_mavi'].map((ad) => s.getObjectByName(ad)?.material).filter(Boolean);
    ledler.forEach((m, i) => { m.emissive = new THREE.Color(i ? 0x3d8bff : 0xffb627); });
    durum.ledler = ledler;
    durum.robot = kap;
    scene.add(kap);
  } catch (e) { console.warn('robot', e); }
}

// ---- yer tutucu (modül gelmezse): gri kutu ----
const yerTutucu = (w, d, h, renk = 0x9aa0a6) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h).translate(0, 0, h / 2), new THREE.MeshStandardMaterial({ color: renk, roughness: 0.8 }));
  m.castShadow = m.receiveShadow = true;
  return m;
};

// ---- sahne ----
export async function buildScene({ scene, lang = 'tr', quality = 'high' }) {
  const durum = { biggie: null, ledler: [], robot: null, onceki: 0, dis: null, ekran: null };
  const [sehirM, kilimM, esyaM, ekranM] = await Promise.all([
    modul('./cati-sehir.js'), modul('./cati-kilim.js'), modul('./cati-esya.js'), modul('./cati-ekran.js'), initCSG(), yaziTipleri(),
  ]);
  // Dışarısı: gökyüzü, ortam ışığı, sis, şehir (modül yoksa düz pus)
  if (sehirM?.disarisi) durum.dis = await sehirM.disarisi(scene, { reduce: options.reduce });
  else { scene.background = new THREE.Color(0xd5d8dc); scene.fog = null; }

  const M = {
    siva: new THREE.MeshStandardMaterial({ color: 0xece4d6, map: kumDoku(3), roughness: 0.95, vertexColors: true }),
    beton: new THREE.MeshStandardMaterial({ color: 0xbdb8b0, map: kumDoku(4, { taban: 210, sacilma: 30 }), roughness: 0.9 }),
    karo: new THREE.MeshStandardMaterial({ map: karoDoku(), roughness: 0.9, vertexColors: true }),
    lamine: new THREE.MeshStandardMaterial({ color: 0xffffff, map: ahsapDoku(13, { renk: [222, 186, 140], lamel: 40 }), roughness: 0.68, vertexColors: true }),
    lambri: new THREE.MeshStandardMaterial({ color: 0xffffff, map: ahsapDoku(17, { renk: [206, 166, 118], tahta: 120 }), roughness: 0.75, vertexColors: true }),
    mese: new THREE.MeshStandardMaterial({ color: 0xffffff, map: ahsapDoku(21, { renk: [196, 160, 112], boy: 256 }), roughness: 0.6, vertexColors: true }),
    meseKoyu: new THREE.MeshStandardMaterial({ color: 0xe8e0d6, map: ahsapDoku(22, { renk: [186, 148, 100], boy: 256 }), roughness: 0.55, vertexColors: true }),
    sac: new THREE.MeshStandardMaterial({ color: 0x3b3e42, roughness: 0.5, metalness: 0.35 }),
    alu: new THREE.MeshStandardMaterial({ color: 0x3a3e43, roughness: 0.45, metalness: 0.55 }),
    celik: new THREE.MeshStandardMaterial({ color: 0x2b2e32, roughness: 0.55, metalness: 0.5 }),
    astar: new THREE.MeshStandardMaterial({ color: 0xefede8, roughness: 0.9 }),
    mermer: new THREE.MeshStandardMaterial({ color: 0xe9e6e1, roughness: 0.25 }),
    supurgelik: new THREE.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.6 }),
    cam: new THREE.MeshStandardMaterial({ color: 0xe6eff2, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0, depthWrite: false }),
    korkuluk: new THREE.MeshStandardMaterial({ color: 0xcfe3dc, transparent: true, opacity: 0.14, roughness: 0.04, metalness: 0, depthWrite: false }),
    kum: kumDoku(41, { taban: 200, sacilma: 60, boy: 128 }),
    tasDoku: kumDoku(43, { taban: 236, sacilma: 26, boy: 128 }),
  };
  M.koyuAhsap = new THREE.MeshStandardMaterial({ color: 0x8a6440, map: M.mese.map, roughness: 0.7 });

  scene.add(kabuk(M), cati(M), camCephe(M), cerceveler(M));
  // Batı duvarı: kitaplıklar, köprü dolap, konsol; raflarda tasarım çalışmaları; ortada OLED
  const bati = batiDuvari(M, kutuAtlasi());
  scene.add(bati.grup);
  const eserler = rafEserleri(bati.grup, bati.yerler, M);
  let tv;
  if (ekranM?.oledEkran) {
    durum.ekran = ekranM.oledEkran({ lang, reduce: options.reduce, adimlar: SUREC });
    tv = durum.ekran.grup;
  } else tv = yerTutucu(1671, 30, 963, 0x111214);
  canli.ekran = durum.ekran;
  tv.position.set(IC.x0, TV.y, TV.z);            // grubun yerel y = 0 duvar yüzeyi
  tv.rotation.z = Math.PI / 2; // önü yerel −y → dünya +x (odaya)
  scene.add(tv);
  // Doğu köşesi: kilim, armutlar, cam sehpa; kuzey açıklıkta teleskop
  const kose = new THREE.Group();
  const kil = kilimM?.kilim ? kilimM.kilim({ en: KILIM.en, boy: KILIM.boy }) : yerTutucu(KILIM.en, KILIM.boy, 6, 0x9c3b2a);
  kil.position.set(KILIM.x, KILIM.y, 0);
  kil.rotation.z = Math.PI / 2;
  kil.traverse((o) => { o.raycast = () => {}; });
  scene.add(kil);
  for (const [x, y, renk, tohum] of ARMUTLAR) {
    const a = esyaM?.armut ? esyaM.armut({ renk, seed: tohum }) : yerTutucu(850, 850, 1000, renk);
    a.position.set(x, y, 0);
    const d = new THREE.Vector2(1000 - x, 0 - y); // önü odanın ortasına doğru
    a.rotation.z = Math.atan2(d.x, -d.y);
    kose.add(a);
  }
  const sehpa = esyaM?.camSehpa ? esyaM.camSehpa() : yerTutucu(480, 480, 550, 0xc9d6d2);
  sehpa.position.set(...SEHPA, 0);
  kose.add(sehpa);
  const tel = esyaM?.teleskop ? esyaM.teleskop({ az: TELESKOP.az, el: TELESKOP.el, ayna: quality !== 'low' }) : yerTutucu(650, 650, 2000, 0x2a2c2f);
  tel.position.set(TELESKOP.x, TELESKOP.y, 0);
  const biggie = biggieGrubu();
  scene.add(kose, tel, biggie);
  const tahta = await karaTahta(lang, M.koyuAhsap);
  scene.add(tahta);
  saksilar(scene, M);                 // beklemez: bitki modeli gelince toprağa oturur
  biggieyiYukle(biggie, durum);
  robotuKoy(scene, durum);
  await eserler;
  const robotYol = new THREE.CatmullRomCurve3(ROBOT.yol.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  const robotBoy = robotYol.getLength();

  const s = toSun(), merkez = [-1300, 0, 1300];
  return {
    shots: SHOTS,
    focusShots: FOCUS,
    look: LOOK,
    focusShift: 0.16,
    touchOrbit: false,
    portraitShot: PORTRE,
    portraitFov: 62,
    fov: 56,              // yatay ekranda görüş açısı (dikey, derece): cam cephe, tavan ızgarası ve döşeme birlikte
    squareFov: 54,
    cameraBounds: SINIR,
    outlineFocus: false,
    lights: {
      center: merkez,
      key: merkez.map((m, i) => m + s[i] * 4500), // gölge kamerası near 100 / far 8000: oda ve saçak içeride
      keyColor: OLCU.SUN.color, keyIntensity: 3.4,
      hemi: 0.3, fillIntensity: 0, rimIntensity: 0,
      shadowSpan: 6200,
      exposure: 1.0,
    },
    hotspots: [
      { id: 'ekran', object: tv, noLift: true },
      { id: 'kitaplik', object: bati.grup, noLift: true },
      { id: 'biggie', object: biggie, noLift: true, extra: [kose, tel], anchor: [BIGGIE_YER.x, BIGGIE_YER.y, 1250] },
      { id: 'hakkimda', object: tahta, noLift: true },
    ],
    update(time) {
      const dt = Math.min(0.1, Math.max(0, time - durum.onceki));
      durum.onceki = time;
      durum.biggie?.mixer.update(dt);
      durum.dis?.update?.(time);
      durum.ekran?.update?.(time);
      // Robot süpürge odanın açık zemininde tur atar (hareket azaltmada yerinde durur)
      if (durum.robot && options.reduce) { durum.robot.position.set(ROBOT.dur[0], ROBOT.dur[1], 0); durum.robot.rotation.z = ROBOT.dur[2]; } else if (durum.robot) {
        const u = ((time * ROBOT.hiz) / robotBoy) % 1;
        const p = robotYol.getPointAt(u), t = robotYol.getTangentAt(u);
        durum.robot.position.set(p.x, p.y, 0);
        durum.robot.rotation.z = Math.atan2(t.y, t.x) - Math.PI / 2; // modelin önü yerel +y (ışıklar ve düğme önde)
      }
      // Robotun ışıkları: sarı 6 sn'de bir iki kez çakar, mavi 9 sn'de bir yavaşça yanıp söner (odadaki gibi)
      if (durum.ledler.length === 2 && options.reduce) { durum.ledler[0].emissiveIntensity = 0; durum.ledler[1].emissiveIntensity = 2; } else if (durum.ledler.length === 2) {
        const a = time % 6, b = time % 9;
        durum.ledler[0].emissiveIntensity = (a < 0.18 || (a > 0.36 && a < 0.54)) ? 6 : 0;
        durum.ledler[1].emissiveIntensity = b > 4 && b < 5.6 ? 5 * Math.sin(((b - 4) / 1.6) * Math.PI) : 0;
      }
    },
    // TV'ye yeniden tıklamak: sıradaki adım. Biggie'ye yeniden tıklamak: ayakta bir dans, sonra beklemeye döner
    onPoke(id, { reduced = options.reduce } = {}) {
      if (id === 'ekran') { durum.ekran?.ileri(); return; }
      const bg = durum.biggie;
      if (id !== 'biggie' || !bg || reduced) return;
      const adlar = ['dans_twist', 'dans_tavuk', 'dans_lahana', 'dans_runningman'].filter((a) => bg.klip(a));
      if (!adlar.length || bg.aktif !== bg.dur) return;
      const tepki = bg.mixer.clipAction(bg.klip(adlar[Math.floor(Math.random() * adlar.length)]));
      tepki.reset().setLoop(THREE.LoopOnce, 1); tepki.clampWhenFinished = true; tepki.play();
      bg.dur?.crossFadeTo(tepki, 0.35, false);
      bg.aktif = tepki;
      const bitti = (e) => {
        if (e.action !== tepki) return;
        bg.mixer.removeEventListener('finished', bitti);
        bg.dur?.reset().play(); tepki.crossFadeTo(bg.dur, 0.45, false);
        bg.aktif = bg.dur;
      };
      bg.mixer.addEventListener('finished', bitti);
    },
  };
}
