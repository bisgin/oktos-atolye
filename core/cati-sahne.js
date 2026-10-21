// Çatı katı sahnesi (portfolyo): odanın üstündeki çatı terası. Kullanıcıyı gökyüzü karşılar, kaydırınca kamera terasa
// iner. Odanın aynı sabahı: güneş core/oda-olcu.js SUN (ışık) ve odanın penceresindeki gökyüzü (Poly Haven 'balcony',
// CC0; assets/cati/gok.webp, 6°–90° bandı, ufka doğru şehir pusu). Gökyüzü fotoğrafındaki ev, şemsiye ve servi bir dilimde
// toplanır (gok.json blokDilim); o dilim güneyde ve batıda terastan ~12 m yükselen komşu blokun arkasında kalır, kuzey ve
// doğu açık (şehir). Güneş kuzey-kuzeydoğudan gelir: blok terasa gölge düşürmez.
// Işık canlı (pişirme yok, Blender gerekmez): güneş gölgeli DirectionalLight, ortam ışığı gökyüzünün küçük panoramasından.
// Şehir ucuz: binalar birleştirilmiş iki ağ (cephe, çatı), gölge atmaz, sisle puslanır; en uzakta boyanmış silüet kartı.
// Portfolyo: kaidelerde Modern Balbal heykelleri (scripts/portfolyo-model.py), çamaşır ipinde baskılar, merdiven kovasının
// duvarında süreç panosu, kara tahtada hakkımda; Biggie ve robotu terasta. Metin core/cati-veri.js, sayfa lab/cati.html.
// Birim mm, Z yukarı, teras döşemesi z = 0. Motor core/story.js (sceneModule sözleşmesi oda-sahne.js ile aynı).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OLCU, toSun } from './oda-olcu.js';
import { ESERLER, GALERI, SUREC } from './cati-veri.js';

const KOK = new URL('../assets/', import.meta.url).href;
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';
export const options = { reduce: false };

// ---- ölçüler ----
export const CATI = {
  teras: { x0: -3600, x1: 3600, y0: -2600, y1: 2600 },
  parapet: { h: 1050, t: 200 },                          // kuzey ve doğu kenarı (iç yüzleri x 3400, y 2400)
  kova: { x0: -3600, x1: -1500, y0: 300, y1: 2400, h: 2600 }, // merdiven kovası: kapısı güneye, panosu doğuya bakar
  blokUst: 12000,                                        // güney ve batıdaki komşu blok terastan bu kadar yüksek
  gokYaricap: 24000,
  pus: 0xd5d8dc,                                         // ufuk pusu (gok.webp'nin alt kenarıyla aynı aile)
};
// Gökyüzü fotoğrafının yönü: u = 0,44 (blok diliminin başı) güneye 175°'ye gelir; azimut +y'den +x'e (SUN ile aynı)
const GOK_U0 = 0.44 - 175 / 360;

const MASA = { x: 2900, y: -450, en: 1400, derin: 460, boy: 900 }; // Modern Balbal sergi masası (doğu parapetinin önü)
const KAIDE = [[2900, -870], [2900, -450], [2900, -30]];       // heykellerin yerleri masada (40 cm arayla)
const IP = { a: [-650, 1750], b: [2350, 1750], z: 1950, sarkma: 140 }; // çamaşır ipi (galeri; direk panonun önünü kapatmasın)
const PANO = { x: -1500, y: 1350, z: 1450, en: 1700, boy: 1000 };      // süreç panosu: kovanın doğu yüzünde
const TAHTA = { x: -3000, y: -1250 };                                   // hakkımda kara tahtası (güneybatı köşesi, şövalede; yüzü kameraya döner)
export const BIGGIE = { x: 1350, y: 650, psi: -0.81 };                   // yüzü güneybatıya (kameraya): yön (sin ψ, −cos ψ)
const ROBOT = { x: 1950, y: 350, rz: 0.4 };

// ---- kamera ----
// main: gökyüzü (kaydırmalı turun ilk durağı). Çatıya genel bakış 'teras' durağı (focusShots). Telefonda da gök
export const SHOTS = {
  intro: { pos: [600, -1800, 1650], target: [1600, 2600, 16000] },
  main: { pos: [600, -1800, 1650], target: [2700, 6000, 7400] }, // kovanın anteni kadraja girmesin
};
export const FOCUS = {
  teras: { pos: [-300, -2450, 2050], target: [700, 2600, 1250], w: 4600 }, // w: genişlik kadraja sığmazsa motor kamerayı geri çeker (bloğa girmesin)
  eserler: { pos: [1850, -1250, 1300], target: [2900, -450, 1000], w: 1750 },
  galeri: { pos: [850, -1700, 1650], target: [850, 1750, 1500], w: 3400 },
  surec: { pos: [1500, 1250, 1600], target: [-1500, 1350, 1430], w: 1950 },
  hakkimda: { pos: [-1250, -2350, 1350], target: [-3000, -1250, 850], w: 1650 },
  biggie: { pos: [-350, -950, 1450], target: [BIGGIE.x, BIGGIE.y, 760], w: 1900 },
};
const LOOK = { min: -0.5, max: 0.5, edge: 0.2, speed: 0.7 };

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
const kutu = (w, d, h, mat, { golge = true } = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h).translate(0, 0, h / 2), mat);
  m.castShadow = golge; m.receiveShadow = true;
  return m;
};

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
// Teras karosu: 40 cm karolar (doku 1,6 m = 4 × 4), derz ve karo başına ton farkı
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
// Apartman cephesi: bir kat (2,9 m) × bir aks (3 m) = bir pencere; doku tekrar eder (dünya ölçüsünde UV)
function cepheDoku() {
  const [c, g] = kanvas(256, 256);
  g.fillStyle = '#f2efe9'; g.fillRect(0, 0, 256, 256);
  // pencere: 1,3 × 1,4 m, alt kenarı kattan 0,9 m yukarı (doku v yukarı doğru: kanvasın üstü katın üstü)
  const px = 256 / 3000, py = 256 / 2900;
  const x0 = (3000 - 1300) / 2 * px, w = 1300 * px, y1 = 256 - 900 * py, h = 1400 * py;
  g.fillStyle = '#5d6672'; g.fillRect(x0 - 6, y1 - h - 6, w + 12, h + 12);       // söve
  g.fillStyle = '#323a44'; g.fillRect(x0, y1 - h, w, h);                           // cam
  g.fillStyle = 'rgba(190,205,220,0.35)'; g.fillRect(x0, y1 - h, w, h * 0.45);     // camda gök yansıması
  g.fillStyle = '#e6e2da'; g.fillRect(x0 + w / 2 - 3, y1 - h, 6, h); g.fillRect(x0, y1 - h * 0.62, w, 5); // doğrama
  g.fillStyle = '#d9d4cb'; g.fillRect(x0 - 10, y1, w + 20, 10);                    // denizlik
  g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 252, 256, 4);                     // kat çizgisi
  return doku(c, { tekrar: true });
}

// Bina parçası: dört yan yüz (cephe, dünya ölçüsünde UV: aks 3 m, kat 2,9 m) ve üst yüz (çatı); renk köşe başına
function bina(x0, x1, y0, y1, z0, z1, renk, cephe, cati) {
  const p = [], uv = [], n = [], col = [];
  const yuz = (a, b, nx, ny, uzun) => { // a → b yatay kenar (z0..z1), dışa bakan normal
    const [ax, ay] = a, [bx, by] = b;
    const L = uzun / 3000, Z0 = z0 / 2900, Z1 = z1 / 2900;
    p.push(ax, ay, z0, bx, by, z0, bx, by, z1, ax, ay, z0, bx, by, z1, ax, ay, z1);
    uv.push(0, Z0, L, Z0, L, Z1, 0, Z0, L, Z1, 0, Z1);
    for (let i = 0; i < 6; i++) { n.push(nx, ny, 0); col.push(...renk); }
  };
  yuz([x0, y0], [x1, y0], 0, -1, x1 - x0);
  yuz([x1, y0], [x1, y1], 1, 0, y1 - y0);
  yuz([x1, y1], [x0, y1], 0, 1, x1 - x0);
  yuz([x0, y1], [x0, y0], -1, 0, y1 - y0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  cephe.push(g);
  const c = new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z1);
  const k = new Float32Array(c.attributes.position.count * 3).fill(0.9);
  c.setAttribute('color', new THREE.BufferAttribute(k, 3));
  cati.push(c);
}

// ---- gökyüzü ----
function gokKubbesi(tex, meta) {
  const s = toSun();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex }, u0: { value: GOK_U0 }, altK: { value: meta.altKenar }, parlak: { value: 1.18 },
      gunes: { value: new THREE.Vector3(...s).normalize() }, pus: { value: new THREE.Color(CATI.pus) },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D map; uniform float u0, altK, parlak; uniform vec3 gunes, pus;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float az = atan(d.x, d.y);
        float el = degrees(asin(clamp(d.z, -1.0, 1.0)));
        vec3 col = pus;
        if (el >= altK) col = texture2D(map, vec2(fract(u0 + az / 6.2831853), (el - altK) / (90.0 - altK))).rgb;
        float c = max(dot(d, gunes), 0.0);
        col += vec3(1.0, 0.96, 0.88) * (pow(c, 12.0) * 0.22 + pow(c, 220.0) * 0.9);
        gl_FragColor = vec4(col * parlak, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(CATI.gokYaricap, 64, 32), mat);
  m.renderOrder = -2;
  m.frustumCulled = false;
  return m;
}

// Uzak şehir silüeti: pusun içinde katmanlı bloklar, arada birkaç minare; yalnız açık yönlerde (kuzey, doğu). Kart
// silindir şeridi (yarıçap R, z ALT..UST); altı dolu pus (yakın şehrin arkası), bloklar göz hizasının 2°–12° üstüne çıkar
// (gökyüzü fotoğrafının ufkundaki ağaçları ve pusu örter)
function silüetKarti() {
  const R = 22500, ALT = -6000, UST = 8500, GOZ = 1650, H = 512;
  const zPx = (z) => H * (1 - (z - ALT) / (UST - ALT));           // z (mm) → kanvas satırı
  const acı = (e) => zPx(GOZ + R * Math.tan(THREE.MathUtils.degToRad(e)));
  const [c, g] = kanvas(4096, H), r = rnd(31);
  const katman = (e0, e1, renk, yogun) => {
    g.fillStyle = renk;
    for (let x = 0; x < 4096;) {
      const w = 14 + r() * 60, tepe = acı(e0 + r() * (e1 - e0));
      g.fillRect(x, tepe, w + 1, H - tepe);
      if (r() < yogun) { g.fillRect(x + w * 0.3, tepe - 5, w * 0.22, 5); if (r() < 0.3) g.fillRect(x + w * 0.7, tepe - 16, 2, 16); }
      if (r() < 0.018) { const mx = x + w / 2, mt = acı(e1 + 4 + r() * 3); g.fillRect(mx - 3, mt, 6, tepe - mt); g.beginPath(); g.moveTo(mx - 5, mt); g.lineTo(mx, mt - 16); g.lineTo(mx + 5, mt); g.fill(); }
      x += w + (r() < 0.12 ? r() * 24 : 0);
    }
  };
  katman(2.5, 6, 'rgb(199,205,212)', 0.3);   // en uzak, en açık (pusun içinde)
  katman(1.2, 4, 'rgb(189,196,204)', 0.4);
  katman(0.3, 2.4, 'rgb(178,186,195)', 0.5);
  const t = doku(c);
  const a0 = THREE.MathUtils.degToRad(-40), a1 = THREE.MathUtils.degToRad(178);
  const geo = new THREE.CylinderGeometry(R, R, UST - ALT, 96, 1, true, 0, a1 - a0).rotateX(Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false });
  const m = new THREE.Mesh(geo, mat);
  m.position.z = (UST + ALT) / 2;
  m.rotation.z = Math.PI - a1; // silindir açısı döndürmeden sonra −y'den başlar
  m.renderOrder = -1;
  return m;
}

// Şehir: sokakla ayrılmış komşu bloklar (açık yönlerde), güney ve batıda yüksek komşu blok
function sehir(cepheMat, catiMat) {
  const cephe = [], cati = [], r = rnd(11);
  const renkler = [[1, 0.97, 0.92], [0.98, 0.9, 0.82], [0.93, 0.93, 0.95], [1, 0.93, 0.86], [0.9, 0.86, 0.82], [0.96, 0.95, 0.9]];
  const renk = () => renkler[Math.floor(r() * renkler.length)];
  // Kendi binamızın gövdesi: döşemenin 10 mm altında biter (dar ekranda kamera terasın dışına çekilince altı boş görünmesin)
  bina(-3600, 3600, -2600, 2600, -15000, -10, [0.96, 0.94, 0.9], cephe, cati);
  // Yüksek komşu blok (L): güney ve batı; tabanı terasın 15 m altı
  bina(-14000, 7000, -12000, -2600, -15000, CATI.blokUst, [0.95, 0.93, 0.88], cephe, cati);
  bina(-14000, -3600, -2600, 12000, -15000, CATI.blokUst, [0.93, 0.91, 0.87], cephe, cati);
  // Doğudaki bitişik komşu (bizden alçak), kuzeyde sokağın karşısı (çatısı bizimle aşağı yukarı aynı)
  bina(3600, 11000, -2600, 4000, -15000, -2800, renk(), cephe, cati);
  bina(-8000, 2000, 9600, 18000, -15000, -600, [0.98, 0.92, 0.84], cephe, cati);   // karşı ev
  bina(2400, 9000, 9600, 16000, -15000, 1500, renk(), cephe, cati);
  // Halka: kuzey ve doğu yönlerinde rastgele bloklar (12–21 m)
  for (let i = 0; i < 46; i++) {
    const a = THREE.MathUtils.degToRad(-30 + r() * 200), d = 12500 + r() * 8500;
    const cx = Math.sin(a) * d, cy = Math.cos(a) * d;
    if (cx < -3600 && cy < 12000) continue; // batı blokunun içi
    if (cy < -2600 && cx < 7000) continue;  // güney blokunun içi
    const w = 3500 + r() * 6000, dd = 3500 + r() * 5000, h = -6000 + r() * 12000;
    bina(cx - w / 2, cx + w / 2, cy - dd / 2, cy + dd / 2, -15000, h, renk(), cephe, cati);
  }
  const cm = new THREE.Mesh(mergeGeometries(cephe), cepheMat);
  const km = new THREE.Mesh(mergeGeometries(cati), catiMat);
  cm.receiveShadow = km.receiveShadow = false;
  cm.castShadow = km.castShadow = false;
  // Çatı donanımı: su depoları ve güneş kolektörleri (yakın çatılarda; tek ağ)
  const don = [], beyaz = [];
  const depo = (x, y, z) => beyaz.push(new THREE.CylinderGeometry(500, 500, 1100, 16).rotateX(Math.PI / 2).translate(x, y, z + 550));
  const kolektor = (x, y, z) => {
    don.push(new THREE.BoxGeometry(1000, 1800, 60).rotateX(-0.7).translate(x, y, z + 700));
    beyaz.push(new THREE.CylinderGeometry(220, 220, 1500, 12).rotateZ(Math.PI / 2).translate(x, y + 750, z + 1350));
  };
  depo(-6000, 12500, -600); kolektor(-3500, 12000, -600); depo(-1500, 15000, -600); kolektor(4500, 11500, 1500); depo(7000, 13500, 1500);
  depo(6000, -500, -2800); kolektor(8500, 1500, -2800);
  const donM = new THREE.Mesh(mergeGeometries(don), new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.35, metalness: 0.4 }));
  const beyM = new THREE.Mesh(mergeGeometries(beyaz), new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.6 }));
  return [cm, km, donM, beyM];
}

// ---- teras ----
function teras(siva, beton) {
  const g = new THREE.Group();
  const { x0, x1, y0, y1 } = CATI.teras, { h, t } = CATI.parapet;
  const karo = karoDoku();
  karo.repeat.set((x1 - x0) / 1600, (y1 - y0) / 1600);
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshStandardMaterial({ map: karo, roughness: 0.92 }));
  zemin.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
  zemin.receiveShadow = true;
  zemin.name = 'zemin';
  zemin.raycast = () => {}; // teras durağı yalnız işaretçi ve şeritten: boş zemine tıklamak oraya uçurmasın
  g.add(zemin);
  // Parapet (kuzey, doğu) ve başlığı
  const kuzey = kutu(x1 - x0, t, h, siva); kuzey.position.set((x0 + x1) / 2, y1 - t / 2, 0);
  const dogu = kutu(t, y1 - y0 - t, h, siva); dogu.position.set(x1 - t / 2, (y0 + y1 - t) / 2, 0);
  const bk = kutu(x1 - x0 + 40, t + 60, 50, beton); bk.position.set((x0 + x1) / 2, y1 - t / 2, h);
  const bd = kutu(t + 60, y1 - y0 - t, 50, beton); bd.position.set(x1 - t / 2, (y0 + y1 - t) / 2, h);
  g.add(kuzey, dogu, bk, bd);
  // Merdiven kovası
  const k = CATI.kova;
  const kova = kutu(k.x1 - k.x0, k.y1 - k.y0, k.h, siva); kova.position.set((k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, 0);
  const tavan = kutu(k.x1 - k.x0 + 160, k.y1 - k.y0 + 160, 120, beton); tavan.position.set((k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, k.h);
  // Kapı (güney yüzünde): koyu yeşil sac, küçük tel camlı pencere, kol
  const kapiM = new THREE.MeshStandardMaterial({ color: 0x2f4a3c, roughness: 0.55, metalness: 0.3 });
  const kapi = kutu(900, 40, 2050, kapiM); kapi.position.set(-2350, k.y0 - 10, 0);
  const cam = kutu(420, 10, 380, new THREE.MeshStandardMaterial({ color: 0x9fb3c2, roughness: 0.15, metalness: 0.2 }), { golge: false }); cam.position.set(-2350, k.y0 - 32, 1450);
  const kol = kutu(130, 40, 25, new THREE.MeshStandardMaterial({ color: 0xb8b8b0, metalness: 0.9, roughness: 0.3 }), { golge: false }); kol.position.set(-2000, k.y0 - 50, 1000);
  g.add(kova, tavan, kapi, cam, kol);
  // Kovanın üstünde su deposu, güneş kolektörü ve TV anteni
  const zt = k.h + 120;
  const depo = new THREE.Mesh(new THREE.CylinderGeometry(520, 520, 1150, 24).rotateX(Math.PI / 2).translate(0, 0, 575), new THREE.MeshStandardMaterial({ color: 0x9fb6c9, roughness: 0.55 }));
  depo.position.set(-3000, 1900, zt); depo.castShadow = true;
  const kolM = new THREE.MeshStandardMaterial({ color: 0x24314a, roughness: 0.25, metalness: 0.5 });
  const kol2 = new THREE.Mesh(new THREE.BoxGeometry(1000, 1700, 60), kolM);
  kol2.rotation.x = 0.75; kol2.position.set(-2200, 900, zt + 650); kol2.castShadow = true;
  const kolDepo = new THREE.Mesh(new THREE.CylinderGeometry(210, 210, 1400, 16).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.4, metalness: 0.2 }));
  kolDepo.position.set(-2200, 1600, zt + 1250); kolDepo.castShadow = true;
  const metal = new THREE.MeshStandardMaterial({ color: 0x8d9196, roughness: 0.4, metalness: 0.8 });
  const anten = new THREE.Group();
  anten.add(new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 2600, 8).rotateX(Math.PI / 2).translate(0, 0, 1300), metal));
  for (let i = 0; i < 6; i++) anten.add(new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 900 - i * 90, 6).rotateZ(Math.PI / 2).translate(0, 0, 1700 + i * 140), metal));
  anten.position.set(-1750, 2150, zt); anten.rotation.z = 0.3;
  anten.traverse((o) => { o.castShadow = true; });
  g.add(depo, kol2, kolDepo, anten);
  return g;
}

// Sergi masası ve heykeller (heykeller sonradan yüklenir; masa grubu hotspot nesnesi)
function kaideler(beton) {
  const g = new THREE.Group(), ahsap = new THREE.MeshStandardMaterial({ color: 0x9a7650, roughness: 0.7 });
  const ust = kutu(MASA.derin, MASA.en, 40, ahsap); ust.position.set(MASA.x, MASA.y, MASA.boy - 40); g.add(ust);
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
    const a = kutu(45, 45, MASA.boy - 40, ahsap); a.position.set(MASA.x + dx * (MASA.derin / 2 - 40), MASA.y + dy * (MASA.en / 2 - 40), 0); g.add(a);
  }
  // Her heykelin altında küçük beton kaide (masada)
  for (const [x, y] of KAIDE) { const k = kutu(150, 150, 40, beton); k.position.set(x, y, MASA.boy); g.add(k); }
  return g;
}
async function heykelleriKoy(g) {
  const modeller = ESERLER.filter((e) => e.model);
  await Promise.all(modeller.map(async (e, i) => {
    try {
      const s = (await gltf(e.model)).scene;
      const kutuK = new THREE.Box3().setFromObject(s), boy = kutuK.max.z - kutuK.min.z;
      s.traverse((o) => {
        if (!o.isMesh) return;
        // Girinti yıkaması (vertex rengi) açılır: koyu yerler boya gibi kalır, açıklar taş tozu rengi
        const c = o.geometry.attributes.color;
        if (c) for (let j = 0; j < c.count; j++) for (let k = 0; k < 3; k++) c.setComponent(j, k, 0.52 + 0.48 * c.getComponent(j, k));
        o.material = new THREE.MeshStandardMaterial({ color: e.ton, vertexColors: !!c, roughness: 0.9 });
        o.castShadow = true; o.receiveShadow = true;
      });
      const kap = new THREE.Group();
      kap.add(s);
      s.scale.setScalar(180 / boy); // gerçek boy 18 cm
      const [x, y] = KAIDE[i];
      kap.position.set(x, y, MASA.boy + 40);
      kap.rotation.z = -Math.PI / 2; // yüz batıya (terasa)
      kap.name = e.id;
      g.add(kap);
    } catch (err) { console.warn('heykel', e.id, err); }
  }));
}

// Çamaşır ipi galerisi: iki direk, sarkık ip, mandallı baskılar (yüzü güneye)
async function galeri() {
  const g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: 0x7d8288, roughness: 0.5, metalness: 0.7 });
  for (const [x, y] of [IP.a, IP.b]) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(25, 30, IP.z + 60, 10).rotateX(Math.PI / 2).translate(0, 0, (IP.z + 60) / 2), metal);
    d.position.set(x, y, 0); d.castShadow = true; g.add(d);
  }
  const L = IP.b[0] - IP.a[0];
  const ipZ = (x) => { const u = (x - IP.a[0]) / L; return IP.z - IP.sarkma * 4 * u * (1 - u); };
  const yol = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const x = IP.a[0] + (L * i) / 12; return new THREE.Vector3(x, IP.a[1], ipZ(x)); }));
  const ip = new THREE.Mesh(new THREE.TubeGeometry(yol, 40, 4, 6, false), new THREE.MeshStandardMaterial({ color: 0xe9e5dc, roughness: 0.8 }));
  ip.castShadow = true; g.add(ip);
  const kagit = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.85, side: THREE.DoubleSide });
  const mandal = new THREE.MeshStandardMaterial({ color: 0xd8b47a, roughness: 0.7 });
  const baskilar = [];
  const n = GALERI.length, aralik = L / (n + 1);
  await Promise.all(GALERI.map(async (it, i) => {
    let im = null;
    try { im = await resim(it.gorsel); } catch (e) { /* görsel yoksa boş kağıt */ }
    const oran = im ? im.width / im.height : 0.75, boy = 470, en = Math.min(560, boy * oran);
    const kap = new THREE.Group();
    const x = IP.a[0] + aralik * (i + 1), z = ipZ(x);
    kap.position.set(x, IP.a[1], z);
    // Baskı: beyaz kenarlı kağıt (arka yüz düz), görsel öne
    const arka = new THREE.Mesh(new THREE.PlaneGeometry(en + 40, boy + 40).rotateX(Math.PI / 2).translate(0, 0, -(boy + 40) / 2), kagit);
    arka.castShadow = true;
    kap.add(arka);
    if (im) {
      const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
      const on = new THREE.Mesh(new THREE.PlaneGeometry(en, boy).rotateX(Math.PI / 2).translate(0, -2, -(boy + 40) / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
      kap.add(on);
    }
    for (const dx of [-(en / 2) + 30, en / 2 - 30]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(18, 26, 90).translate(0, 0, -25), mandal);
      m.position.set(dx, 0, 0); m.castShadow = true; kap.add(m);
    }
    kap.userData.faz = i * 1.7;
    baskilar[i] = kap;
    g.add(kap);
  }));
  g.userData.baskilar = baskilar;
  return g;
}

// Kanvasa yazmadan önce sayfanın yazı tipleri (en çok 1,5 sn beklenir; gelmezse yedek yazı tipi)
const yaziTipleri = () => Promise.race([
  Promise.all(['700 74px "Big Shoulders Display"', '600 38px "Schibsted Grotesk"', '500 30px "Schibsted Grotesk"'].map((f) => document.fonts?.load(f))),
  new Promise((r) => setTimeout(r, 1500)),
]).catch(() => {});

// Süreç panosu: mantar levha, sekiz kaydın ilk karesi polaroid gibi, altında adım adı (tek doku)
async function pano(lang) {
  await yaziTipleri();
  const [c, g] = kanvas(2048, 1204), r = rnd(5);
  g.fillStyle = '#b8895a'; g.fillRect(0, 0, 2048, 1204);
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,55,25,0.18)' : 'rgba(240,210,170,0.16)'; g.fillRect(r() * 2048, r() * 1204, 2 + r() * 4, 2 + r() * 4); }
  g.strokeStyle = '#6d5236'; g.lineWidth = 34; g.strokeRect(17, 17, 2014, 1170);
  const resimler = await Promise.all(SUREC.map((s) => resim(s.poster).catch(() => null)));
  const sut = 4, en = 420, boy = 330, bx = 110, by = 70, ax = (2048 - 2 * bx - sut * en) / (sut - 1);
  g.textAlign = 'center';
  SUREC.forEach((s, i) => {
    const x = bx + (i % sut) * (en + ax), y = by + Math.floor(i / sut) * 560;
    g.save(); g.translate(x + en / 2, y + 250); g.rotate((r() - 0.5) * 0.06); g.translate(-(x + en / 2), -(y + 250));
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 8, y + 10, en, 480);
    g.fillStyle = '#f6f3ec'; g.fillRect(x, y, en, 480);
    const im = resimler[i];
    if (im) {
      const k = Math.max(boy / im.height, (en - 36) / im.width), w = im.width * k, h = im.height * k;
      g.save(); g.beginPath(); g.rect(x + 18, y + 18, en - 36, boy); g.clip(); g.drawImage(im, x + 18 + (en - 36 - w) / 2, y + 18 + (boy - h) / 2, w, h); g.restore();
    }
    g.fillStyle = '#2b2a28'; g.font = '600 38px "Schibsted Grotesk", Arial, sans-serif';
    g.fillText(String(i + 1).padStart(2, '0'), x + en / 2, y + boy + 70);
    g.font = '500 30px "Schibsted Grotesk", Arial, sans-serif';
    g.fillText(s.ad[lang] || s.ad.tr, x + en / 2, y + boy + 112);
    g.fillStyle = '#c0392b'; g.beginPath(); g.arc(x + en / 2, y + 6, 13, 0, Math.PI * 2); g.fill(); // raptiye
    g.restore();
  });
  const t = doku(c);
  const m = new THREE.Group();
  const cer = new THREE.Mesh(new THREE.BoxGeometry(40, PANO.en, PANO.boy), new THREE.MeshStandardMaterial({ color: 0x6d5236, roughness: 0.8 }));
  cer.castShadow = true;
  // Düzlem: yerel x → +y (bakana göre sağ), yerel y → +z, normal → +x (kovanın doğu yüzünden dışarı)
  const yuz = new THREE.Mesh(new THREE.PlaneGeometry(PANO.en - 20, PANO.boy - 20).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
  yuz.position.x = 21;
  yuz.receiveShadow = true;
  m.add(cer, yuz);
  m.position.set(PANO.x + 20, PANO.y, PANO.z);
  return m;
}

// Hakkımda: kaldırımda duran A tipi kara tahta; logo ve 'Oktos Workshop · Ankara' tebeşirle
async function karaTahta(lang) {
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
  const ahsap = new THREE.MeshStandardMaterial({ color: 0x7a5b3c, roughness: 0.8 });
  const grup = new THREE.Group();
  const W = 720, H = 960, Z0 = 520, egim = 0.16;
  // Levha: yerel düzlem −y'ye bakar (yerel x sağ, z yukarı); çerçeve arkada
  const levha = new THREE.Group();
  const cer = new THREE.Mesh(new THREE.BoxGeometry(W + 60, 36, H + 60), ahsap); cer.castShadow = true;
  const yuz = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  yuz.position.y = -19;
  levha.add(cer, yuz);
  levha.position.z = Z0 + H / 2;
  levha.rotation.x = -egim; // arkaya yaslı
  grup.add(levha);
  // Şövale ayakları: iki ön, bir arka
  const ayak = (ust, alt) => { // iki nokta arasında kare kesitli çıta
    const a = new THREE.Vector3(...ust), b = new THREE.Vector3(...alt);
    const m = new THREE.Mesh(new THREE.BoxGeometry(34, 34, a.distanceTo(b)), ahsap);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
    m.castShadow = true;
    grup.add(m);
  };
  const tepeZ = Z0 + H + 40, tepeY = Math.sin(egim) * (H / 2) + 30;
  ayak([-W / 2 + 40, tepeY, tepeZ], [-W / 2 - 40, -90, 0]);
  ayak([W / 2 - 40, tepeY, tepeZ], [W / 2 + 40, -90, 0]);
  ayak([0, tepeY + 20, tepeZ], [0, 520, 0]);
  const raf = new THREE.Mesh(new THREE.BoxGeometry(W + 80, 70, 24), ahsap); raf.position.set(0, -60, Z0 - 10); raf.castShadow = true; grup.add(raf);
  grup.position.set(TAHTA.x, TAHTA.y, 0);
  // Yüzü 'hakkimda' kamerasına döner: yerel −y → kameraya
  const d = new THREE.Vector2(FOCUS.hakkimda.pos[0] - TAHTA.x, FOCUS.hakkimda.pos[1] - TAHTA.y).normalize();
  grup.rotation.z = Math.atan2(d.x, -d.y);
  return grup;
}

// ---- Biggie ve robotu ----
// Yerleşim grubu hemen döner (hotspot); model arkadan gelir. Görünmez vekil kutu tıklama ve kadraj için
function biggieGrubu() {
  const g = new THREE.Group();
  const vekil = new THREE.Mesh(new THREE.BoxGeometry(520, 420, 1500).translate(0, 0, 750), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(vekil);
  g.position.set(BIGGIE.x, BIGGIE.y, 0);
  g.rotation.z = BIGGIE.psi;
  return g;
}
async function biggieyiYukle(g, durum) {
  try {
    const k = await gltf(KOK + 'oda/karakter.glb');
    const model = k.scene;
    model.scale.setScalar(1000);
    // Tıklama ve üzerine gelme vekil kutudan: derili ağ her pointermove'da üçgen üçgen ışınlanmasın (geç gelen ağda etiket de yok)
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.raycast = () => {}; } });
    g.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const klip = (ad) => k.animations.find((a) => a.name === ad);
    const dur = klip('dur') ? mixer.clipAction(klip('dur')) : null;
    dur?.play();
    durum.biggie = { mixer, dur, klip, aktif: dur };
  } catch (e) { console.warn('biggie', e); }
}
async function robotuKoy(scene, durum) {
  try {
    const e = await gltf(KOK + 'oda/oda-esya.glb');
    const s = e.scene.getObjectByName('supurge');
    if (!s) return;
    const kap = new THREE.Group(); // Blender'ın taban kayması düğümde kalır (oda gotcha'sı): kabı yerleştir
    kap.add(s);
    kap.position.set(ROBOT.x, ROBOT.y, 0);
    kap.rotation.z = ROBOT.rz;
    s.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const ledler = ['supurge_led_sari', 'supurge_led_mavi'].map((ad) => s.getObjectByName(ad)?.material).filter(Boolean);
    ledler.forEach((m, i) => { m.emissive = new THREE.Color(i ? 0x3d8bff : 0xffb627); });
    durum.ledler = ledler;
    scene.add(kap);
  } catch (e) { console.warn('robot', e); }
}

// ---- sahne ----
export async function buildScene({ scene, lang = 'tr' }) {
  const durum = { biggie: null, ledler: [], galeri: null, onceki: 0 };
  const [gokTex, meta, ortamTex] = await Promise.all([
    new THREE.TextureLoader().loadAsync(KOK + 'cati/gok.webp'),
    fetch(KOK + 'cati/gok.json').then((r) => r.json()),
    new THREE.TextureLoader().loadAsync(KOK + 'cati/ortam.webp'),
  ]);
  gokTex.colorSpace = THREE.SRGBColorSpace;
  gokTex.generateMipmaps = false; // u sarmasında (fract) türev sıçrar: mip seviyesi yanlış seçilir, dikiş çizgisi çıkardı
  gokTex.minFilter = THREE.LinearFilter;
  ortamTex.colorSpace = THREE.SRGBColorSpace;
  ortamTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = ortamTex;
  scene.environmentRotation?.set(Math.PI / 2, 0, 0); // dokular Y yukarı varsayar, sahne Z yukarı
  scene.background = new THREE.Color(CATI.pus);
  scene.fog = new THREE.Fog(CATI.pus, 14000, 30000);
  scene.add(gokKubbesi(gokTex, meta));
  scene.add(silüetKarti());

  const siva = new THREE.MeshStandardMaterial({ color: 0xece4d6, map: kumDoku(3), roughness: 0.95 });
  siva.map.repeat.set(4, 4);
  const beton = new THREE.MeshStandardMaterial({ color: 0xbdb8b0, map: kumDoku(4, { taban: 210, sacilma: 30 }), roughness: 0.9 });
  const cepheT = cepheDoku();
  const cepheMat = new THREE.MeshStandardMaterial({ map: cepheT, vertexColors: true, roughness: 0.9 });
  const catiMat = new THREE.MeshStandardMaterial({ color: 0xa7a29a, vertexColors: true, roughness: 0.95 });
  for (const m of sehir(cepheMat, catiMat)) scene.add(m);

  const t = teras(siva, beton);
  scene.add(t);
  const zemin = t.getObjectByName('zemin');
  const kaide = kaideler(beton);
  scene.add(kaide);
  const [gal, panoM, tahta] = await Promise.all([galeri(), pano(lang), karaTahta(lang), heykelleriKoy(kaide)]);
  scene.add(gal, panoM, tahta);
  durum.galeri = gal;
  const biggie = biggieGrubu();
  scene.add(biggie);
  biggieyiYukle(biggie, durum);       // beklemez: sahne açılır, Biggie gelince görünür
  robotuKoy(scene, durum);

  const s = toSun(), merkez = [0, 0, 600];
  return {
    shots: SHOTS,
    focusShots: FOCUS,
    look: LOOK,
    focusShift: 0.16,
    touchOrbit: false,
    portraitShot: SHOTS.main,
    portraitFov: 58,
    outlineFocus: false,
    lights: {
      center: merkez,
      key: merkez.map((m, i) => m + s[i] * 4500), // motorun gölge kamerası near 100 / far 8000: 4500'de bütün teras içeride
      keyColor: OLCU.SUN.color, keyIntensity: 3.4,
      hemi: 0.45, fillIntensity: 0, rimIntensity: 0,
      shadowSpan: 5200,
      exposure: 1.0,
    },
    hotspots: [
      { id: 'teras', object: zemin, preset: undefined, noLift: true, anchor: [600, -200, 40] },
      { id: 'eserler', object: kaide, noLift: true, preset: 'magaza', disari: 'https://oktosworkshop.com/biblolar', cta: { tr: 'Mağazada gör', en: 'See in the shop' } },
      { id: 'galeri', object: gal, noLift: true },
      { id: 'surec', object: panoM, noLift: true },
      { id: 'hakkimda', object: tahta, noLift: true },
      { id: 'biggie', object: biggie, noLift: true, anchor: [BIGGIE.x, BIGGIE.y, 1500] },
    ],
    update(time) {
      const dt = Math.min(0.1, Math.max(0, time - durum.onceki));
      durum.onceki = time;
      durum.biggie?.mixer.update(dt);
      // Baskılar rüzgârda hafifçe sallanır
      if (!options.reduce) for (const b of durum.galeri?.userData.baskilar || []) if (b) b.rotation.x = Math.sin(time * 1.3 + b.userData.faz) * 0.05 + Math.sin(time * 0.37 + b.userData.faz) * 0.03;
      // Robotun ışıkları: sarı 6 sn'de bir iki kez çakar, mavi 9 sn'de bir yavaşça yanıp söner (odadaki gibi)
      if (durum.ledler.length === 2 && options.reduce) { durum.ledler[0].emissiveIntensity = 0; durum.ledler[1].emissiveIntensity = 2; } else if (durum.ledler.length === 2) {
        const a = time % 6, b = time % 9;
        durum.ledler[0].emissiveIntensity = (a < 0.18 || (a > 0.36 && a < 0.54)) ? 6 : 0;
        durum.ledler[1].emissiveIntensity = b > 4 && b < 5.6 ? 5 * Math.sin(((b - 4) / 1.6) * Math.PI) : 0;
      }
    },
    // Biggie'ye yeniden tıklamak: bir dans, sonra durmaya döner
    onPoke(id, { reduced = options.reduce } = {}) {
      const bg = durum.biggie;
      if (id !== 'biggie' || !bg || reduced) return;
      const adlar = ['dans_twist', 'dans_tavuk', 'dans_lahana', 'dans_runningman'].filter((a) => bg.klip(a));
      if (!adlar.length || bg.aktif !== bg.dur) return;
      const dans = bg.mixer.clipAction(bg.klip(adlar[Math.floor(Math.random() * adlar.length)]));
      dans.reset().setLoop(THREE.LoopOnce, 1); dans.clampWhenFinished = true; dans.play();
      bg.dur?.crossFadeTo(dans, 0.35, false);
      bg.aktif = dans;
      const bitti = (e) => {
        if (e.action !== dans) return;
        bg.mixer.removeEventListener('finished', bitti);
        bg.dur?.reset().play(); dans.crossFadeTo(bg.dur, 0.45, false);
        bg.aktif = bg.dur;
      };
      bg.mixer.addEventListener('finished', bitti);
    },
  };
}
