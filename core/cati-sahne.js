// Çatı katı sahnesi (portfolyo): odanın üstündeki cam teras odası (gri kutu yerleşim, plan: çatı teras planı 2026-10-21
// bölüm 4). Kuzey ve doğu cephede açık bırakılmış sürgülü pencereler (kanatlar bir yana toplanmış, açıklıkta cam yok),
// kirişli cam tavan (gölgesi kilime düşer), güneyde ve batıda iç duvar, kuzeybatıda merdiven kovası (kapısı açık, merdiven
// aşağı odaya iner). İçeride: kuzey parapetin önünde "fikir rafı" (2×4 gözlü vitrin; 7 alan + "Senin fikrin", her gözde
// kendinden ışıklı başlık kâğıdı, döner kaide ve titreyen hayalet çizim; gerçek ürün gelince yalnız core/cati-veri.js
// değişir), üstünde süreç rayı (4 ışıklı kart), kodla çizilen Anadolu motifli kilim (elibelinde, koçboynuzu, göz), armut
// koltukta Biggie, 50 cm kitaplık, kuzeydoğu köşesinde şehre bakan teleskop, güney duvarında kutu oyunu rafı (markasız,
// kapaklarda doodle), şövalede kara tahta (hakkımda), gezen robot süpürge.
// Dışarısı odanın aynı sabahı: güneş core/oda-olcu.js SUN (ışık) ve odanın penceresindeki gökyüzü (Poly Haven 'balcony',
// CC0; assets/cati/gok.webp, 6°–90° bandı, ufka doğru şehir pusu). Gökyüzü fotoğrafındaki ev, şemsiye ve servi bir dilimde
// toplanır (gok.json blokDilim); o dilim güneyde ve batıda terastan ~12 m yükselen komşu blokun arkasında kalır, kuzey ve
// doğu açık (şehir). Güneş kuzey-kuzeydoğudan gelir: blok terasa gölge düşürmez, vitrin ters ışıkta kalır (gözler bu yüzden
// kendinden ışıklı).
// Işık canlı (pişirme yok, Blender gerekmez): güneş gölgeli DirectionalLight, ortam ışığı gökyüzünün küçük panoramasından.
// Camlar gölge düşürmez; bütün kasalar ve kirişler tek birleşik ağ. Mobilyalar gri kutu yer tutucu (dış varlık yok).
// Birim mm, Z yukarı, +x doğu, +y kuzey, teras döşemesi z = 0. Motor core/story.js (sceneModule sözleşmesi oda-sahne.js
// ile aynı; kamera iç hacmin dışına çıkmasın diye cameraBounds verilir). Metin core/cati-veri.js, sayfa lab/cati.html.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OLCU, toSun } from './oda-olcu.js';
import { ALANLAR, SUREC_RAYI, fikirLinki, SAYFA } from './cati-veri.js';

const KOK = new URL('../assets/', import.meta.url).href;
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';
export const options = { reduce: false };

// ---- ölçüler ----
export const CATI = {
  teras: { x0: -3600, x1: 3600, y0: -2600, y1: 2600 },   // dış kenar (duvarların ve parapetin dış yüzü)
  ic: { x0: -3500, x1: 3400, y0: -2500, y1: 2400 },      // iç hacim: batı ve güney iç duvarının, doğu ve kuzey parapetin iç yüzü
  parapet: { h: 1050, t: 200 },                          // pencereler parapetin üstünde (eşik = başlığın üstü)
  tavan: 2750,                                           // kirişlerin altı; cam kirişlerin üstünde
  kiris: { en: 80, boy: 160, aralik: 700 },
  kova: { x0: -3500, x1: -1500, y0: 300, y1: 2400 },     // merdiven kovası (kuzeybatı); kapısı güneye
  kapi: { x0: -3000, x1: -2100, h: 2100 },
  blokUst: 12000,                                        // güney ve batıdaki komşu blok terastan bu kadar yüksek
  gokYaricap: 24000,
  pus: 0xd5d8dc,                                         // ufuk pusu (gok.webp'nin alt kenarıyla aynı aile)
};
const ESIK = CATI.parapet.h + 50;                         // pencere eşiği (parapet başlığının üstü)
const CATI_UST = CATI.tavan + CATI.kiris.boy;            // cam düzlemi
const KUZEY = { x0: -1500, x1: 3460, y: 2500, kanat: -1440 }; // kuzey sürgü kasası (y: kasa ekseni); kanatlar batı uçta toplu
const DOGU = { x: 3500, y0: -2500, y1: 2460, kanat: -2440 };  // doğu sürgü; kanatlar güney uçta toplu
const KANAT = { boy: 1600, kasa: 90, kalin: 59, kayma: 20 };  // üç kanat üst üste, her biri kendi rayında
const ACIK = { x0: 350, x1: 1750, y0: -2500, y1: -1100 };     // cam tavanın açık bölmesi (cam kanadı yan bölmenin üstüne kaymış)
const VITRIN = { x: 1000, y: 2210, en: 1900, derin: 380, boy: 1000 };
export const GOZ = { x: [298, 766, 1234, 1702], z: [740, 280], ic: 440, alt: [520, 60] }; // göz merkezleri; alt: gözün tabanı
const KAIDE = { y: 2190, r: 150, h: 30 };                 // döner kaide (gözün derinliğinin ortası)
const KILIM = { x: 1000, y: 250, en: 2400, boy: 1600 };  // genel planın alt bandında görünsün diye plandakinden 55 cm kuzeyde
const ARMUT = { x: 2050, y: 700, psi: -0.8 };             // yön (sin ψ, −cos ψ): güneybatıya, odaya 3/4 dönük
const KITAPLIK = { x: 2800, y: 600, rz: -1.27, en: 500, derin: 250, boy: 500 }; // önü batı-güneybatıya (armudun yan sehpası)
const TELESKOP = { x: 2700, y: 1900, az: 45, el: 20 };    // kuzeydoğu köşesinden şehre
const OYUN_RAFI = { x: -2300, y: -2315, en: 1080, derin: 370, boy: 1560 };
const TAHTA = { x: -2350, y: -1100 };                     // hakkımda kara tahtası (şövalede; yüzü kameraya döner)
const BITKI = [[-1100, 2200, 'aloe'], [-400, 2200, 'antoryum']];
// Biggie armut koltukta oturur: kök oturağın çukurunda, oturma klibinin yüksekliğinde (klip meta'sı z 335 = oda koltuğu)
export const BIGGIE = { otur: 'muzik', z: 215, ileri: 110 }; // z: kalça armudun çukuruna otursun (ölçüldü: kalça kemiği kökün 285 mm üstünde)
// Robot süpürgenin turu (kilimin çevresinde, eşyalara ~3 cm payla); hız mm/sn
const ROBOT = { dur: [-300, 1500, 0.3], yol: [[-1000, -1700], [900, -1900], [2600, -1500], [3150, -600], [3220, 150], [3150, 1150], [2300, 1450], [1000, 1750], [-600, 1500], [-1150, 200], [-1150, -900]], hiz: 140 };

// ---- kamera ----
// main: oda içi genel plan (güney duvarının önünden kuzeye: vitrin, süreç rayı, açık sürgü, kilim, armutta Biggie).
// Telefonda ayrı kadraj (PORTRE). Duraklar: süreç, 8 göz, pencere köşesi (biggie), hakkımda, merdiven.
export const SHOTS = {
  intro: { pos: [950, -2300, 2250], target: [1050, 2300, 1300] },
  main: { pos: [950, -2330, 1450], target: [1050, 2300, 620] },
};
const PORTRE = { pos: [900, -2300, 1450], target: [900, 2300, 1150] }; // vitrin tam sığar, Biggie kadrajın dışında kalır
const gozShot = (i) => {
  const x = GOZ.x[i % 4], z = GOZ.z[i < 4 ? 0 : 1];
  // Gözün ~1,1 m önünden, 250 mm yukarıdan (daha yukarıdan bakınca üst tabla başlığı örtüyor); w: dar ekranda sığacak genişlik
  return { pos: [x, VITRIN.y - 1100, z + 250], target: [x, KAIDE.y, z], w: 600 };
};
export const FOCUS = {
  surec: { pos: [1000, 700, 1350], target: [1000, 2250, 1080], w: 1950 },
  ...Object.fromEntries(ALANLAR.map((a, i) => [a.id, gozShot(i)])),
  biggie: { pos: [400, -1300, 1450], target: [2600, 1250, 750], w: 2200 },        // pencere köşesi: armut, kitaplık, teleskop
  hakkimda: { pos: [-700, -100, 1450], target: [-2350, -1700, 950], w: 1700 },
  // merdiven: kapıdan aşağı inen basamaklara, güneyden; masaüstünde kart için ~0,5 m batıya kayar, telefonda w kadar geri çekilir
  // (şövale ikisinde de kameranın arkasında kalır)
  merdiven: { pos: [-2350, -750, 1600], target: [-2600, 800, 300], w: 1000 },
};
// Kamera sınırı: iç hacmin 150 mm içi (motor yakın plan geri çekmesinde ve sürülen kamerada bunun dışına çıkmaz)
const SINIR = { min: [CATI.ic.x0 + 150, CATI.ic.y0 + 150, 150], max: [CATI.ic.x1 - 150, CATI.ic.y1 - 150, CATI.tavan - 150] };
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
// x0..x1, y0..y1, z0..z1 aralığını dolduran kutu geometrisi (birleştirmek için)
const aralik = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const birlesik = (geos, mat, { golge = true, alir = true } = {}) => {
  const m = new THREE.Mesh(mergeGeometries(geos), mat);
  m.castShadow = golge; m.receiveShadow = alir;
  return m;
};
// İki nokta arasında silindir (çubuk, ayak, tüp); r1 a ucunda, r2 b ucunda
function cubuk(a, b, r1, r2 = r1, seg = 10) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2, r1, L, seg).translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  return g.translate(A.x, A.y, A.z);
}
// Dünya ölçüsünde UV (yüzün normaline göre iki eksen): kumlu sıva dokusu her duvarda aynı yoğunlukta
function dunyaUV(g, olcek) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [a, b] = az >= ax && az >= ay ? [p.getX(i), p.getY(i)] : ax >= ay ? [p.getY(i), p.getZ(i)] : [p.getX(i), p.getZ(i)];
    uv.setXY(i, a / olcek, b / olcek);
  }
  return g;
}
// Yatay düzlem (dünya UV'li: karolar parçalar arasında kaymaz)
function duzlem(x0, x1, y0, y1, z, olcek = 1600) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / olcek, p.getY(i) / olcek);
  return g;
}
// Atlas hücresine UV: geometri UV'si (0..1) hücreye sıkıştırılır (u0, v0, u1, v1 doku koordinatı, v yukarı)
function hucreUV(g, [u0, v0, u1, v1], yuz = null) {
  const uv = g.attributes.uv;
  const [i0, i1] = yuz === null ? [0, uv.count] : [yuz * 4, yuz * 4 + 4]; // BoxGeometry: yüz başına 4 köşe (+x, −x, +y, −y, +z, −z)
  for (let i = i0; i < i1; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return g;
}
// Kanvas hücresi (piksel) → doku koordinatı (CanvasTexture flipY: kanvasın üstü v = 1)
const hucre = (x, y, w, h, W, H, pay = 2) => [(x + pay) / W, 1 - (y + h - pay) / H, (x + w - pay) / W, 1 - (y + pay) / H];

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
// Apartman cephesi: bir kat (2,9 m) × bir aks (3 m) = bir pencere; doku tekrar eder (dünya ölçüsünde UV)
function cepheDoku() {
  const [c, g] = kanvas(256, 256);
  g.fillStyle = '#f2efe9'; g.fillRect(0, 0, 256, 256);
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

// Bina parçası: dört yan yüz (cephe, dünya ölçüsünde UV: aks 3 m, kat 2,9 m) ve üst yüz (çatı; cati null ise yok); renk
// köşe başına
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
  if (!cati) return;
  const c = new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, z1);
  const k = new Float32Array(c.attributes.position.count * 3).fill(0.9);
  c.setAttribute('color', new THREE.BufferAttribute(k, 3));
  cati.push(c);
}

// ---- gökyüzü ----
// Gökyüzü fotoğrafının yönü: u = 0,44 (blok diliminin başı) güneye 175°'ye gelir; azimut +y'den +x'e (SUN ile aynı)
const GOK_U0 = 0.44 - 175 / 360;
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
function silüetKarti() {
  const R = 22500, ALT = -6000, UST = 8500, GOZ_Z = 1650, H = 512;
  const zPx = (z) => H * (1 - (z - ALT) / (UST - ALT));
  const acı = (e) => zPx(GOZ_Z + R * Math.tan(THREE.MathUtils.degToRad(e)));
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
  katman(2.5, 6, 'rgb(199,205,212)', 0.3);
  katman(1.2, 4, 'rgb(189,196,204)', 0.4);
  katman(0.3, 2.4, 'rgb(178,186,195)', 0.5);
  const t = doku(c);
  const a0 = THREE.MathUtils.degToRad(-40), a1 = THREE.MathUtils.degToRad(178);
  const geo = new THREE.CylinderGeometry(R, R, UST - ALT, 96, 1, true, 0, a1 - a0).rotateX(Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false });
  const m = new THREE.Mesh(geo, mat);
  m.position.z = (UST + ALT) / 2;
  m.rotation.z = Math.PI - a1;
  m.renderOrder = -1;
  return m;
}

// Şehir: sokakla ayrılmış komşu bloklar (açık yönlerde), güney ve batıda yüksek komşu blok
function sehir(cepheMat, catiMat) {
  const cephe = [], cati = [], r = rnd(11);
  const renkler = [[1, 0.97, 0.92], [0.98, 0.9, 0.82], [0.93, 0.93, 0.95], [1, 0.93, 0.86], [0.9, 0.86, 0.82], [0.96, 0.95, 0.9]];
  const renk = () => renkler[Math.floor(r() * renkler.length)];
  // Kendi binamızın gövdesi: döşemenin 10 mm altında biter; üst yüzü yok (döşeme örter, merdiven boşluğunu kapatmasın)
  bina(-3600, 3600, -2600, 2600, -15000, -10, [0.96, 0.94, 0.9], cephe, null);
  // Yüksek komşu blok (L): güney ve batı; tabanı terasın 15 m altı
  bina(-14000, 7000, -12000, -2600, -15000, CATI.blokUst, [0.95, 0.93, 0.88], cephe, cati);
  bina(-14000, -3600, -2600, 12000, -15000, CATI.blokUst, [0.93, 0.91, 0.87], cephe, cati);
  // Doğudaki bitişik komşu (bizden alçak), kuzeyde sokağın karşısı (çatısı bizimle aşağı yukarı aynı)
  bina(3600, 11000, -2600, 4000, -15000, -2800, renk(), cephe, cati);
  bina(-8000, 2000, 9600, 18000, -15000, -600, [0.98, 0.92, 0.84], cephe, cati);
  bina(2400, 9000, 9600, 16000, -15000, 1500, renk(), cephe, cati);
  // Halka: kuzey ve doğu yönlerinde rastgele bloklar (12–21 m)
  for (let i = 0; i < 46; i++) {
    const a = THREE.MathUtils.degToRad(-30 + r() * 200), d = 12500 + r() * 8500;
    const cx = Math.sin(a) * d, cy = Math.cos(a) * d;
    if (cx < -3600 && cy < 12000) continue;
    if (cy < -2600 && cx < 7000) continue;
    const w = 3500 + r() * 6000, dd = 3500 + r() * 5000, h = -6000 + r() * 12000;
    bina(cx - w / 2, cx + w / 2, cy - dd / 2, cy + dd / 2, -15000, h, renk(), cephe, cati);
  }
  const cm = new THREE.Mesh(mergeGeometries(cephe), cepheMat);
  const km = new THREE.Mesh(mergeGeometries(cati), catiMat);
  cm.receiveShadow = km.receiveShadow = false;
  cm.castShadow = km.castShadow = false;
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

// ---- oda kabuğu ----
// Zemin (merdiven boşluğu hariç), iç duvarlar, parapetler, merdiven kovası (kapı boşluğu, açık kapı, aşağı inen basamaklar),
// kovanın betonu ve üstündeki su deposu, kolektör, anten (içeriden görünmez; inişte işaret)
function kabuk(siva, beton) {
  const g = new THREE.Group();
  const { ic, kova, kapi, tavan, parapet } = CATI;
  const karo = karoDoku();
  const zemin = new THREE.Mesh(mergeGeometries([duzlem(ic.x0, ic.x1, ic.y0, kova.y0, 0), duzlem(kova.x1, ic.x1, kova.y0, ic.y1, 0)]),
    new THREE.MeshStandardMaterial({ map: karo, roughness: 0.92 }));
  zemin.receiveShadow = true;
  zemin.name = 'zemin';
  g.add(zemin);
  const ust = CATI_UST + 40, alt = -1400; // duvarlar camın biraz üstüne çıkar; kovanın içinde döşemenin altına iner
  const duvarlar = [
    aralik(-3600, 3600, -2600, ic.y0, -60, ust),               // güney iç duvarı
    aralik(-3600, ic.x0, ic.y0, 2600, -60, ust),               // batı iç duvarı
    aralik(-3600, ic.x0, kova.y0, ic.y1, alt, -60),            // batı duvarı kovanın içinde (merdiven boşluğu)
    aralik(ic.x0, kova.x1, ic.y1, 2600, alt, ust),             // kovanın kuzeyi
    aralik(kova.x1, 3600, ic.y1, 2600, -60, parapet.h),        // kuzey parapet
    aralik(ic.x1, 3600, ic.y0, ic.y1, -60, parapet.h),         // doğu parapet
    // kova: güney duvarı kapı boşluğuyla (eşiğin altı dolu), doğu duvarı
    aralik(ic.x0, kapi.x0, kova.y0, kova.y0 + 100, alt, tavan),
    aralik(kapi.x1, kova.x1, kova.y0, kova.y0 + 100, alt, tavan),
    aralik(kapi.x0, kapi.x1, kova.y0, kova.y0 + 100, kapi.h, tavan),
    aralik(kapi.x0, kapi.x1, kova.y0, kova.y0 + 100, alt, 0),
    aralik(kova.x1 - 100, kova.x1, kova.y0 + 100, ic.y1, alt, tavan),
  ];
  g.add(birlesik(duvarlar.map((d) => dunyaUV(d, 1000)), siva));
  // Parapet başlıkları ve kovanın betonu (cam tavanla aynı hizada)
  g.add(birlesik([
    aralik(kova.x1, 3640, ic.y1 - 20, 2640, parapet.h, ESIK),
    aralik(ic.x1 - 20, 3640, -2640, ic.y1 - 20, parapet.h, ESIK),
    aralik(-3600, kova.x1, kova.y0, 2600, tavan, CATI_UST + 40),
  ].map((d) => dunyaUV(d, 1000)), beton));
  // Kovanın içi: duvarların iç yüzünde koyu astar (gün ışığı girmez, merdiven boşluğu aşağıda kararır)
  const ix0 = ic.x0 + 1, ix1 = kova.x1 - 101, iy0 = kova.y0 + 101, iy1 = ic.y1 - 1;
  const astar = new THREE.MeshStandardMaterial({ color: 0x77726a, map: siva.map, roughness: 0.95 });
  g.add(birlesik([
    aralik(ix0, ix0 + 2, iy0, iy1, alt, tavan), aralik(ix1 - 2, ix1, iy0, iy1, alt, tavan), aralik(ix0, ix1, iy1 - 2, iy1, alt, tavan),
    aralik(ix0, kapi.x0, iy0, iy0 + 2, alt, tavan), aralik(kapi.x1, ix1, iy0, iy0 + 2, alt, tavan), aralik(kapi.x0, kapi.x1, iy0, iy0 + 2, kapi.h, tavan),
    aralik(ix0, ix1, iy0, iy1, tavan - 2, tavan),
  ].map((d) => dunyaUV(d, 1000)), astar, { golge: false }));
  // Merdiven: kapının ardında kısa sahanlık, sonra kuzeye inen 7 basamak (175 × 250, koyu beton). Yukarıdan bakınca
  // rıhtlar görünmez: basamakları her basamağın kuzey kenarındaki açık renk kaydırmaz şerit okutur. Doğu yanında
  // korkuluk, en altta karanlık boşluk
  const M = { x0: -3000, x1: -2160, y0: 650 };
  const basamak = [], burun = [aralik(M.x0, M.x1, M.y0 - 30, M.y0 + 10, -4, 2)];
  for (let i = 1; i <= 7; i++) {
    const y0 = M.y0 + 250 * (i - 1), y1 = M.y0 + 250 * i, z = -175 * i;
    basamak.push(aralik(M.x0, M.x1, y0, y1, -1300, z));
    if (i < 7) burun.push(aralik(M.x0, M.x1, y1 - 30, y1 + 10, z - 4, z + 2));
  }
  const betonKoyu = new THREE.MeshStandardMaterial({ color: 0x77716a, map: beton.map, roughness: 0.92 });
  g.add(birlesik([duzlem(ic.x0, kova.x1 - 100, kova.y0 + 100, M.y0, 0, 1000)], beton, { golge: false }));
  g.add(birlesik(basamak.map((b) => dunyaUV(b, 1000)), betonKoyu, { golge: false }));
  g.add(new THREE.Mesh(mergeGeometries(burun), new THREE.MeshBasicMaterial({ color: 0xd6d0c4 })));
  const kx = M.x1 + 30, korkuluk = [cubuk([kx, M.y0, 950], [kx, M.y0 + 1750, 950 - 1225], 20, 20, 8)];
  for (let i = 0; i <= 7; i += 2) korkuluk.push(cubuk([kx, M.y0 + 125 + 250 * i, -175 * (i + 1)], [kx, M.y0 + 125 + 250 * i, -175 * (i + 1) + 1037], 12, 12, 6));
  g.add(birlesik(korkuluk, new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.4, metalness: 0.6 }), { golge: false }));
  const dip = new THREE.Mesh(duzlem(ic.x0, kova.x1 - 100, M.y0, ic.y1, -1300), new THREE.MeshStandardMaterial({ color: 0x1f1d1b, roughness: 1 }));
  g.add(dip);
  // Kovanın üstünde su deposu, güneş kolektörü ve TV anteni
  const zt = CATI_UST + 40;
  const depo = new THREE.Mesh(new THREE.CylinderGeometry(520, 520, 1150, 24).rotateX(Math.PI / 2).translate(0, 0, 575), new THREE.MeshStandardMaterial({ color: 0x9fb6c9, roughness: 0.55 }));
  depo.position.set(-3000, 1900, zt); depo.castShadow = true;
  const kol2 = new THREE.Mesh(new THREE.BoxGeometry(1000, 1700, 60), new THREE.MeshStandardMaterial({ color: 0x24314a, roughness: 0.25, metalness: 0.5 }));
  kol2.rotation.x = 0.75; kol2.position.set(-2200, 1300, zt + 650); kol2.castShadow = true;
  const metal = new THREE.MeshStandardMaterial({ color: 0x8d9196, roughness: 0.4, metalness: 0.8 });
  const anten = new THREE.Group();
  anten.add(new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 2600, 8).rotateX(Math.PI / 2).translate(0, 0, 1300), metal));
  for (let i = 0; i < 6; i++) anten.add(new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 900 - i * 90, 6).rotateZ(Math.PI / 2).translate(0, 0, 1700 + i * 140), metal));
  anten.position.set(-1750, 2150, zt); anten.rotation.z = 0.3;
  anten.traverse((o) => { o.castShadow = true; });
  g.add(depo, kol2, anten);
  return g;
}

// Kova kapısı (merdiven durağının nesnesi): içeri, doğu duvarına doğru açılmış koyu yeşil sac kapı (güneydoğudan bakınca
// duvarın ardında kalır, merdiven görünür), kapı boşluğunu dolduran görünmez tıklama kutusu
function kapiGrubu() {
  const { kova, kapi } = CATI, g = new THREE.Group();
  const kapiM = new THREE.MeshStandardMaterial({ color: 0x2f4a3c, roughness: 0.55, metalness: 0.3 });
  const kanat = new THREE.Mesh(aralik(0, 40, 0, kapi.x1 - kapi.x0, 0, 2050), kapiM);
  kanat.position.set(kapi.x1 - 10, kova.y0 + 110, 0);
  kanat.rotation.z = 0.12; // tam dayanmamış
  kanat.castShadow = true;
  const kol = new THREE.Mesh(aralik(-40, 0, 700, 830, 1000, 1025), new THREE.MeshStandardMaterial({ color: 0xb8b8b0, metalness: 0.9, roughness: 0.3 }));
  kanat.add(kol);
  const vekil = new THREE.Mesh(aralik(kapi.x0, kapi.x1, kova.y0 - 20, kova.y0 + 120, 0, kapi.h), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(kanat, vekil);
  return g;
}

// ---- sürgülü pencereler ve cam tavan ----
// Bütün kasalar, kanat çerçeveleri, köşe dikmesi, lentolar ve tavan kirişleri tek birleşik ağ (antrasit alüminyum).
// Camlar ayrı iki ağ: toplanmış kanatların camı (opaklık 0,1) ve tavan camı (0,08); ikisi de gölge düşürmez.
function pencereVeTavan() {
  const k = [], cam = [], tcam = [];
  const { tavan, kiris, ic, kova } = CATI, z0 = ESIK, z1 = tavan, kd = 95; // kasa derinliği 190
  const kanatZ0 = z0 + 72, kanatZ1 = z1 - 66;
  const K = KANAT;
  // Kuzey kasa: alt (ray) ve üst kasa, batı dikmesi, üç ince ray
  k.push(aralik(KUZEY.x0, KUZEY.x1, KUZEY.y - kd, KUZEY.y + kd, z0, z0 + 60), aralik(KUZEY.x0, KUZEY.x1, KUZEY.y - kd, KUZEY.y + kd, z1 - 60, z1));
  k.push(aralik(KUZEY.x0, KUZEY.x0 + 60, KUZEY.y - kd, KUZEY.y + kd, z0, z1));
  for (const d of [-60, 0, 60]) k.push(aralik(KUZEY.x0 + 60, KUZEY.x1, KUZEY.y + d - 4, KUZEY.y + d + 4, z0 + 60, z0 + 72));
  // Doğu kasa
  k.push(aralik(DOGU.x - kd, DOGU.x + kd, DOGU.y0, DOGU.y1, z0, z0 + 60), aralik(DOGU.x - kd, DOGU.x + kd, DOGU.y0, DOGU.y1, z1 - 60, z1));
  k.push(aralik(DOGU.x - kd, DOGU.x + kd, DOGU.y0, DOGU.y0 + 60, z0, z1));
  for (const d of [-60, 0, 60]) k.push(aralik(DOGU.x + d - 4, DOGU.x + d + 4, DOGU.y0 + 60, DOGU.y1, z0 + 60, z0 + 72));
  // Köşe dikmesi 80 × 80
  k.push(aralik(3460, 3540, 2460, 2540, z0, z1));
  // Kanatlar: çerçeve 90, kalınlık 59, her biri kendi rayında ve 20 mm kaymış (üst üste toplu); camı çerçevenin içinde
  for (let i = 0; i < 3; i++) {
    const d = (i - 1) * 60, a = KUZEY.kanat + i * K.kayma, b = a + K.boy, y = KUZEY.y + d, t = K.kalin / 2, c = K.kasa;
    k.push(aralik(a, a + c, y - t, y + t, kanatZ0, kanatZ1), aralik(b - c, b, y - t, y + t, kanatZ0, kanatZ1));
    k.push(aralik(a + c, b - c, y - t, y + t, kanatZ0, kanatZ0 + c), aralik(a + c, b - c, y - t, y + t, kanatZ1 - c, kanatZ1));
    cam.push(aralik(a + c, b - c, y - 2, y + 2, kanatZ0 + c, kanatZ1 - c));
    const ya = DOGU.kanat + i * K.kayma, yb = ya + K.boy, x = DOGU.x + d;
    k.push(aralik(x - t, x + t, ya, ya + c, kanatZ0, kanatZ1), aralik(x - t, x + t, yb - c, yb, kanatZ0, kanatZ1));
    k.push(aralik(x - t, x + t, ya + c, yb - c, kanatZ0, kanatZ0 + c), aralik(x - t, x + t, ya + c, yb - c, kanatZ1 - c, kanatZ1));
    cam.push(aralik(x - 2, x + 2, ya + c, yb - c, kanatZ0 + c, kanatZ1 - c));
  }
  // Lentolar (pencerelerin üstü, cam tavanın kenarı)
  k.push(aralik(kova.x1, 3600, ic.y1, 2600, tavan, CATI_UST + 40), aralik(ic.x1, 3600, -2600, ic.y1, tavan, CATI_UST + 40));
  // Tavan kirişleri: kuzey-güney doğrultusunda 700 aralıklı (açık bölmenin kenarları kirişte), iki aşık doğu-batı
  const kz0 = tavan, kz1 = tavan + kiris.boy, ke = kiris.en / 2;
  for (let x = ACIK.x0 - 5 * kiris.aralik; x < ic.x1; x += kiris.aralik) {
    if (x < ic.x0 + 100) continue;
    k.push(aralik(x - ke, x + ke, ic.y0, x < kova.x1 ? kova.y0 : ic.y1, kz0, kz1));
  }
  k.push(aralik(ic.x0, ic.x1, ACIK.y1 - ke, ACIK.y1 + ke, kz0, kz1), aralik(kova.x1, ic.x1, 650 - ke, 650 + ke, kz0, kz1));
  // Tavan camı: kova ve açık bölme dışında; açık bölmenin camı doğudaki bölmenin üstünde (çerçeveli)
  const cz = CATI_UST + 2;
  tcam.push(aralik(ic.x0, ACIK.x0, ic.y0, kova.y0, cz, cz + 4), aralik(kova.x1, ACIK.x0, kova.y0, ic.y1, cz, cz + 4));
  tcam.push(aralik(ACIK.x0, ACIK.x1, ACIK.y1, ic.y1, cz, cz + 4), aralik(ACIK.x1, ic.x1, ic.y0, ic.y1, cz, cz + 4));
  const sx0 = ACIK.x1 + 20, sx1 = sx0 + (ACIK.x1 - ACIK.x0), sz = cz + 30;
  tcam.push(aralik(sx0 + 50, sx1 - 50, ACIK.y0 + 50, ACIK.y1 - 50, sz, sz + 4));
  k.push(aralik(sx0, sx1, ACIK.y0, ACIK.y0 + 50, sz - 20, sz + 24), aralik(sx0, sx1, ACIK.y1 - 50, ACIK.y1, sz - 20, sz + 24));
  k.push(aralik(sx0, sx0 + 50, ACIK.y0 + 50, ACIK.y1 - 50, sz - 20, sz + 24), aralik(sx1 - 50, sx1, ACIK.y0 + 50, ACIK.y1 - 50, sz - 20, sz + 24));

  const alu = new THREE.MeshStandardMaterial({ color: 0x3a3e43, roughness: 0.45, metalness: 0.55 });
  const kasalar = birlesik(k, alu);
  kasalar.name = 'kasalar';
  const camM = (op) => new THREE.MeshStandardMaterial({ color: 0xe6eff2, transparent: true, opacity: op, roughness: 0.05, metalness: 0, depthWrite: false });
  const kanatCam = birlesik(cam, camM(0.1), { golge: false, alir: false });
  const tavanCam = birlesik(tcam, camM(0.08), { golge: false, alir: false });
  kanatCam.raycast = tavanCam.raycast = () => {};
  return [kasalar, kanatCam, tavanCam];
}

// ---- kilim ----
// Anadolu motifli kilim, kodla: 12,5 mm'lik ilmek ızgarasında (192 × 128) basamaklı motifler, kanvasa 8 px büyütülür,
// üstüne atkı ve çözgü dokusu. Kenarda koçboynuzu bordürü, su yolu şeridi; zeminde ortada elibelinde (eller belde
// kadın figürü) altıgen göl içinde, iki yanda göz göllü baklavalar, köşelerde küçük gözler. Renkler kök boya tonları;
// kırmızıda sıra sıra hafif ton farkı (abraş).
function kilimDoku() {
  const W = 192, H = 128, PX = 8, r = rnd(23);
  const RENK = [[166, 58, 36], [40, 53, 83], [232, 215, 181], [210, 155, 58], [59, 38, 32], [86, 112, 76]];
  const [KIR, LAC, KRM, HAR, KAH, YES] = [0, 1, 2, 3, 4, 5];
  const g = new Uint8Array(W * H).fill(KIR);
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  const halka = (i) => (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y) === i;
  const her = (f) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f(x, y); };
  // kenar halkaları: kahve kenar örgüsü, hardal şerit (kahve beneklerle), krem bordür zemini, su yolu
  her((x, y) => {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (d <= 1) set(x, y, KAH);
    else if (d <= 3) set(x, y, (x + y) % 4 === 0 ? KAH : HAR);
    else if (d <= 17) set(x, y, KRM);
    else if (d === 18 || d === 22) set(x, y, KAH);
    else if (d <= 21) {
      const k = d - 19, s = (y === d || y === H - 1 - d) ? x : y; // şeridin boyunca konum
      set(x, y, (s % 6 === k || s % 6 === 5 - k) ? KRM : LAC);
    }
  });
  // bitmap damgası ('#' = renk, '+' = ikinci renk)
  const damga = (rows, x0, y0, c, c2 = c, yatay = false) => rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return;
    const [x, y] = yatay ? [x0 + j, y0 + i] : [x0 + i, y0 + j];
    set(x, y, ch === '+' ? c2 : c);
  }));
  const KOC = [ // koçboynuzu (11 × 8)
    '.###...###.',
    '#...#.#...#',
    '#.#..#..#.#',
    '#..#.#.#..#',
    '.##..#..##.',
    '.....#.....',
    '....###....',
    '...#####...',
  ];
  const KOC_ALT = [...KOC].reverse();
  // üst ve alt bordür: koçboynuzları (kırmızı / lacivert sırayla); sol ve sağ bordür: yan yatmış koçboynuzları
  let n = 0;
  for (let x = 22; x + 11 <= W - 22; x += 15, n++) {
    damga(KOC, x, 5, n % 2 ? LAC : KIR);
    damga(KOC_ALT, x, H - 13, n % 2 ? KIR : LAC);
  }
  n = 0;
  for (let y = 24; y + 11 <= H - 24; y += 15, n++) {
    damga(KOC, 5, y, n % 2 ? LAC : KIR, KIR, true);
    damga(KOC_ALT, W - 13, y, n % 2 ? KIR : LAC, KIR, true);
  }
  // göz: basamaklı baklava halkaları (m = 0,8|dx| + |dy|)
  const goz = (cx, cy, R, renkler, adim) => her((x, y) => {
    const m = Math.abs(x - cx) * 0.8 + Math.abs(y - cy);
    if (m <= R) set(x, y, renkler[Math.min(renkler.length - 1, Math.floor(m / adim))]);
  });
  // bordür köşelerinde küçük gözler
  for (const [cx, cy] of [[11, 11], [W - 12, 11], [11, H - 12], [W - 12, H - 12]]) goz(cx, cy, 6, [HAR, KAH, KRM, LAC], 1.6);
  // zemin: üç göl (ortada altıgen içinde elibelinde, iki yanda göz)
  const zx0 = 23, zx1 = W - 24, cy = H / 2 - 0.5;
  const cx = [zx0 + (zx1 - zx0) / 6, W / 2 - 0.5, zx1 - (zx1 - zx0) / 6];
  // ortadaki altıgen göl: dış hardal çizgi, krem halka, lacivert iç; kenarında kancalar
  her((x, y) => {
    const dx = Math.abs(x - cx[1]), dy = Math.abs(y - cy), d = dx + Math.max(0, dy - 12);
    if (d > 21) return;
    set(x, y, d > 19.5 ? HAR : d > 17.5 ? KRM : d > 16.5 ? KAH : LAC);
  });
  for (const s of [-1, 1]) for (const t of [-1, 1]) damga(['##', '#.', '##'], Math.round(cx[1] + s * 23) - (s < 0 ? 1 : 0), Math.round(cy + t * 6) - 1, HAR);
  // elibelinde: elmas baş, omuzlar, beline dayanan kollar (iki üçgen), etek
  {
    const x0 = Math.round(cx[1]), y0 = Math.round(cy);
    const cz = (ax, ay, bx, by, c, k = 2) => { // kalın çizgi (ızgarada)
      const n2 = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let i = 0; i <= n2; i++) { const px = Math.round(ax + (bx - ax) * i / n2), py = Math.round(ay + (by - ay) * i / n2); for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) set(px + a, py + b, c); }
    };
    goz(x0, y0 - 17, 3.2, [HAR, KRM], 1.7);                     // baş
    cz(x0 - 1, y0 - 13, x0 - 1, y0 + 1, KRM, 3);               // gövde
    cz(x0 - 9, y0 - 12, x0 + 8, y0 - 12, KRM);                 // omuz
    for (const s of [-1, 1]) {
      const ox = s < 0 ? 0 : -1;
      cz(x0 + s * 9 + ox, y0 - 12, x0 + s * 13 + ox, y0 - 5, KRM); // kol dışa
      cz(x0 + s * 13 + ox, y0 - 5, x0 + s * 4 + ox, y0 + 1, KRM);  // el bele
      for (let yy = y0 - 10; yy <= y0 - 1; yy++) { // kol üçgeninin içi hardal
        const w = yy < y0 - 5 ? (yy - (y0 - 11)) * 0.55 : (y0 + 1 - yy) * 0.95;
        for (let xx = 3; xx <= Math.min(11, 2 + w); xx++) if (g[yy * W + x0 + s * xx] === LAC) set(x0 + s * xx, yy, HAR);
      }
    }
    for (let j = 0; j <= 15; j++) { // etek: belden aşağı genişler
      const w = Math.floor(3 + j * 0.62);
      for (let i = -w; i <= w; i++) set(x0 + i, y0 + 2 + j, (j > 3 && j < 13 && Math.abs(i) + Math.abs(j - 8) * 0.8 <= 3.5) ? KIR : KRM);
    }
    cz(x0 - 9, y0 + 18, x0 - 5, y0 + 18, KRM); cz(x0 + 4, y0 + 18, x0 + 8, y0 + 18, KRM); // ayaklar
  }
  // yan göller: göz (iç içe baklava), çevresinde krem kancalar
  for (const x of [cx[0], cx[2]]) {
    goz(x, cy, 26, [KAH, KRM, HAR, LAC, KRM, LAC, HAR, KRM, KAH], 3);
    for (const s of [-1, 1]) damga(['.#.', '###', '#.#'], Math.round(x) - 1, Math.round(cy + s * 30) - 1, KRM);
  }
  // zeminin köşelerinde küçük gözler, göller arasında yeşil ara motif
  for (const [x, y] of [[zx0 + 8, 31], [zx1 - 8, 31], [zx0 + 8, H - 32], [zx1 - 8, H - 32]]) goz(x, y, 5, [KRM, LAC, HAR], 1.8);
  for (const x of [(cx[0] + cx[1]) / 2, (cx[1] + cx[2]) / 2]) for (const y of [cy - 22, cy + 22]) goz(x, y, 4, [YES, KRM], 2.2);
  // kanvasa: ilmek başına kare, kırmızı ve lacivertte sıra abraşı, ilmek başına küçük ton farkı
  const [c, k] = kanvas(W * PX, H * PX);
  const abras = Array.from({ length: H }, (_, y) => 1 + 0.05 * Math.sin(y * 0.23) + (r() - 0.5) * 0.03);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ci = g[y * W + x], [R0, G0, B0] = RENK[ci], f = (ci <= 1 ? abras[y] : 1) * (1 + (r() - 0.5) * 0.05);
    k.fillStyle = `rgb(${R0 * f | 0},${G0 * f | 0},${B0 * f | 0})`;
    k.fillRect(x * PX, y * PX, PX, PX);
  }
  // atkı ve çözgü: tek sıralar biraz koyu, her ilmeğin ortasında hafif parıltı, ince gren
  const img = k.getImageData(0, 0, W * PX, H * PX), d = img.data;
  for (let py = 0; py < H * PX; py++) for (let px = 0; px < W * PX; px++) {
    const i = (py * W * PX + px) * 4, f = (py % 2 ? 0.92 : 1.02) * (px % 4 === 0 ? 0.95 : 1) * (1 + (r() - 0.5) * 0.08);
    d[i] *= f; d[i + 1] *= f; d[i + 2] *= f;
  }
  k.putImageData(img, 0, 0);
  return doku(c);
}
// Püskül şeridi: kısa kenarlarda krem ipler (saydam doku)
function puskulDoku() {
  const [c, g] = kanvas(1024, 64), r = rnd(29);
  for (let x = 2; x < 1024; x += 5 + r() * 2) {
    g.strokeStyle = `rgba(${226 + r() * 14},${210 + r() * 12},${178 + r() * 12},1)`;
    g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 6, 40 + r() * 22); g.stroke();
  }
  return doku(c);
}
function kilim() {
  const g = new THREE.Group();
  const yan = new THREE.MeshStandardMaterial({ color: 0x6b3324, roughness: 0.97 });
  const ust = new THREE.MeshStandardMaterial({ map: kilimDoku(), roughness: 0.97 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(KILIM.en, KILIM.boy, 7), [yan, yan, yan, yan, ust, yan]);
  m.position.set(KILIM.x, KILIM.y, 3.5);
  m.receiveShadow = true;
  const pm = new THREE.MeshStandardMaterial({ map: puskulDoku(), alphaTest: 0.4, roughness: 1, side: THREE.DoubleSide });
  const p = [];
  for (const s of [-1, 1]) p.push(new THREE.PlaneGeometry(KILIM.boy - 40, 80).rotateZ(s * Math.PI / 2).translate(KILIM.x + s * (KILIM.en / 2 + 38), KILIM.y, 1.5));
  const pus = new THREE.Mesh(mergeGeometries(p), pm);
  pus.receiveShadow = true;
  g.add(m, pus);
  g.traverse((o) => { o.raycast = () => {}; });
  return g;
}

// ---- köşe: armut koltuk, kitaplık, teleskop ----
// Armut koltuk: deforme küre. Üst yüzün yüksekliği yere göre: ortada oturma çukuru, arkası yüksek (sırt), yanları biraz
// kabarık (kol), önü alçak (bacaklar üstünden sarkar); altı yayvan, üstü hafif buruşuk. Önü yerel −y
const ARMUT_R = 470, ARMUT_OTURAK = 400;
const yumus = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function armutGeo() {
  const geo = new THREE.SphereGeometry(1, 64, 40), p = geo.attributes.position, R = ARMUT_R;
  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i), yay = 1 + 0.13 * (1 - uz);
    const x = ux * R * yay, y = uy * R * yay;
    const arka = yumus(0, R, y), on = yumus(0, R, -y), yan = yumus(0.35 * R, R, Math.abs(x));
    let H = ARMUT_OTURAK + 400 * arka * arka - 70 * on + 130 * yan * (1 - arka) * (1 - 0.5 * on);
    H -= 45 * Math.exp(-(x * x + (y + 60) ** 2) / (200 * 200));
    H += 10 * Math.sin(x * 0.03 + y * 0.011) * Math.sin(y * 0.026) * Math.max(0, uz);
    p.setXYZ(i, x, y, H * (1 + Math.sin(uz * Math.PI / 2)) / 2);
  }
  geo.computeVertexNormals();
  return geo;
}
function armut() {
  const kumas = new THREE.MeshStandardMaterial({ color: 0x3f6b6d, map: kumDoku(41, { taban: 225, sacilma: 30, boy: 128 }), roughness: 1 });
  kumas.map.repeat.set(6, 6);
  const m = new THREE.Mesh(armutGeo(), kumas);
  m.castShadow = m.receiveShadow = true;
  m.position.set(ARMUT.x, ARMUT.y, 0);
  m.rotation.z = ARMUT.psi;
  return m;
}
// 50 cm kitaplık: iki raf, kitaplar tek InstancedMesh (renk örnek başına); önü yerel −y
function kitaplik(ahsap) {
  const g = new THREE.Group(), { en: W, derin: D, boy: H } = KITAPLIK, t = 18;
  g.add(birlesik([
    aralik(-W / 2, -W / 2 + t, -D / 2, D / 2, 0, H), aralik(W / 2 - t, W / 2, -D / 2, D / 2, 0, H),
    aralik(-W / 2, W / 2, -D / 2, D / 2, H - t, H),
    aralik(-W / 2 + t, W / 2 - t, -D / 2 + 10, D / 2, 0, 30),
    aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, 30, 30 + t),
    aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, 255, 255 + t),
    aralik(-W / 2 + t, W / 2 - t, D / 2 - 6, D / 2, 30, H - t),
  ], ahsap));
  const r = rnd(53), renk = [0x7d3b2d, 0x2f4858, 0xd8c49a, 0x4b6043, 0xa4683a, 0x1f2f3a, 0xc2b59b, 0x6b2e3e, 0xb9a26a];
  const kitaplar = [];
  for (const [z, bos] of [[30 + t, 255 - 30 - t], [255 + t, H - t - 255 - t]]) {
    let x = -W / 2 + t + 6;
    while (x < W / 2 - t - 50) {
      const kal = 18 + r() * 24, h = Math.min(bos - 12, 140 + r() * 70), d = 120 + r() * 60;
      kitaplar.push({ p: [x + kal / 2, -D / 2 + 8 + d / 2, z + h / 2], s: [kal, d, h], e: 0 });
      x += kal + 1 + (r() < 0.12 ? 10 : 0);
    }
    const kal = 24, h = 170; // sonuncusu yaslanmış
    kitaplar.push({ p: [x + 40, -D / 2 + 8 + 80, z + h / 2 * Math.cos(0.35) + 2], s: [kal, 160, h], e: -0.35 });
  }
  for (let i = 0; i < 3; i++) kitaplar.push({ p: [-60 + i * 4, -10, H + 14 + i * 26], s: [230 - i * 25, 170 - i * 12, 26], e: 0, d: 0.1 * i });
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.75 }), kitaplar.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  kitaplar.forEach((k, i) => {
    q.setFromEuler(e.set(0, k.e, k.d || 0));
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(...k.p), q, new THREE.Vector3(...k.s)));
    im.setColorAt(i, c.set(renk[Math.floor(r() * renk.length)]));
  });
  im.castShadow = im.receiveShadow = true;
  g.add(im);
  g.position.set(KITAPLIK.x, KITAPLIK.y, 0);
  g.rotation.z = KITAPLIK.rz;
  return g;
}
// Teleskop: üç ayaklı sehpa, kafa, pirinç tüp (çiy kalkanı, göz merceği, arayıcı); kuzeydoğu köşesinden şehre 20° yukarı
function teleskop() {
  const T = TELESKOP, g = new THREE.Group();
  const ahsapM = new THREE.MeshStandardMaterial({ color: 0x7a5b3c, roughness: 0.7 });
  const siyah = new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.5, metalness: 0.3 });
  const pirinc = new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.32, metalness: 0.85 });
  const ayak = [];
  for (let i = 0; i < 3; i++) { const a = 0.6 + i * 2.094; ayak.push(cubuk([Math.cos(a) * 450, Math.sin(a) * 450, 0], [Math.cos(a) * 55, Math.sin(a) * 55, 1060], 18, 14, 6)); }
  const tepsi = new THREE.CylinderGeometry(150, 150, 12, 3).rotateX(Math.PI / 2).translate(0, 0, 520);
  g.add(birlesik([...ayak, tepsi], ahsapM));
  const az = THREE.MathUtils.degToRad(T.az), el = THREE.MathUtils.degToRad(T.el);
  const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), Math.sin(el));
  const m = new THREE.Vector3(0, 0, 1220), at = (k, v = m) => v.clone().addScaledVector(d, k).toArray();
  const yan = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize();
  const arka = new THREE.Vector3(...at(-430));
  g.add(birlesik([
    new THREE.CylinderGeometry(65, 65, 70, 16).rotateX(Math.PI / 2).translate(0, 0, 1095), cubuk([0, 0, 1120], [0, 0, 1185], 24),
    cubuk(at(560), at(760), 64, 64, 24), cubuk(at(-470), at(-430), 46, 46, 20),
    cubuk(arka.toArray(), arka.clone().add(new THREE.Vector3(0, 0, 150)).toArray(), 16, 13, 12),
    cubuk(at(-160, m.clone().addScaledVector(yan, 70).add(new THREE.Vector3(0, 0, 55))), at(160, m.clone().addScaledVector(yan, 70).add(new THREE.Vector3(0, 0, 55))), 16, 18, 10),
  ], siyah));
  g.add(birlesik([cubuk(at(-430), at(560), 55, 55, 24)], pirinc));
  g.position.set(T.x, T.y, 0);
  return g;
}

// ---- kutu oyunu rafı ----
// Ahşap raf (güney duvarına dayalı, önü kuzey) ve markasız kutular: kapakta kendi doodle desenimiz, yanlarda düz renk
// şerit. Bütün kutular tek ağ, tek atlas dokusu (4 × 4 hücre: 10 kapak, 6 yan).
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
function oyunRafi(ahsap) {
  const R = OYUN_RAFI, g = new THREE.Group(), t = 25, W = R.en, D = R.derin;
  const raf = [40, 410, 785, 1160, R.boy - t];
  g.add(birlesik([
    aralik(-W / 2, -W / 2 + t, -D / 2, D / 2, 0, R.boy), aralik(W / 2 - t, W / 2, -D / 2, D / 2, 0, R.boy),
    ...raf.map((z) => aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, z, z + t)),
    aralik(-W / 2 + t, W / 2 - t, -D / 2 + 15, -D / 2 + 25, 0, R.boy),
    aralik(-W / 2 + t, W / 2 - t, D / 2 - 30, D / 2 - 20, 0, 40),
  ], ahsap));
  // Kutular: her bölmede bir yatay yığın, bir öne dönük kutu (kapağı görünür), birkaç dik duran kutu (yanı görünür)
  const r = rnd(71), A = 4, hc = (i) => [((i % A) + 0.02) / A, 1 - (Math.floor(i / A) + 0.98) / A, ((i % A) + 0.98) / A, 1 - (Math.floor(i / A) + 0.02) / A];
  const kutular = [];
  const kutu = (w, d, h, x, y, z, kapakYuz, rz = 0, ry = 0) => {
    const geo = new THREE.BoxGeometry(w, d, h);
    const yanH = hc(10 + Math.floor(r() * 6)), kapak = hc(Math.floor(r() * 10));
    for (let f = 0; f < 6; f++) hucreUV(geo, f === kapakYuz ? kapak : yanH, f);
    geo.rotateY(ry).rotateZ(rz).translate(x, y, z);
    kutular.push(geo);
  };
  for (let b = 0; b < 4; b++) {
    const z0 = raf[b] + t, bos = raf[b + 1] - z0;
    let x = -W / 2 + t + 10;
    // yatay yığın (kapak yukarı)
    const sw = 280 + r() * 30, sd = 280 + r() * 20;
    let zz = z0;
    for (let k = 0; k < 2 + Math.floor(r() * 2) && zz + 110 < z0 + bos; k++) { const h = 55 + r() * 35; kutu(sw - k * 12, sd - k * 8, h, x + sw / 2, -D / 2 + 40 + sd / 2, zz + h / 2, 4); zz += h; }
    x += sw + 15;
    // öne dönük kutu: kapağı +y, arkaya hafif yaslı
    const fh = Math.min(bos - 20, 260 + r() * 40), fw = 220 + r() * 50, fd = 70;
    kutu(fw, fd, fh, x + fw / 2, D / 2 - 120, z0 + fh / 2 * Math.cos(0.08) + 2, 2, 0, 0);
    x += fw + 15;
    // dik duran kutular (kapak yanlara, yanı öne)
    while (x < W / 2 - t - 70) {
      const kal = 55 + r() * 35, h = Math.min(bos - 25, 220 + r() * 90), d = 240 + r() * 50;
      kutu(kal, d, h, x + kal / 2, -D / 2 + 40 + d / 2, z0 + h / 2, 0);
      x += kal + 4;
    }
  }
  const km = birlesik(kutular, new THREE.MeshStandardMaterial({ map: kutuAtlasi(), roughness: 0.7 }));
  g.add(km);
  g.position.set(R.x, R.y, 0);
  return g;
}

// ---- bitkiler (yer tutucu: saksı, aloe ve antoryum) ----
function bitkiler() {
  const g = new THREE.Group(), r = rnd(83);
  const saksi = [], yesil = [], kirmizi = [], toprak = [];
  for (const [x, y, tur] of BITKI) {
    saksi.push(new THREE.CylinderGeometry(150, 115, 300, 28).rotateX(Math.PI / 2).translate(x, y, 150));
    toprak.push(new THREE.CircleGeometry(138, 24).translate(x, y, 285));
    if (tur === 'aloe') {
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4 + r() * 0.3, e = 0.25 + (i / 14) * 0.6, L = 380 + r() * 200;
        const geo = new THREE.ConeGeometry(30, L, 4).translate(0, L / 2, 0).scale(1, 1, 0.45);
        geo.rotateX(Math.PI / 2).rotateY(e).rotateZ(a).translate(x, y, 285);
        yesil.push(geo);
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const a = i * 2.3 + r() * 0.4, e = 0.25 + r() * 0.5, L = 420 + r() * 260;
        const uc = [x + Math.cos(a) * Math.sin(e) * L, y + Math.sin(a) * Math.sin(e) * L, 285 + Math.cos(e) * L];
        yesil.push(cubuk([x, y, 285], uc, 6, 5, 5));
        const yap = new THREE.CircleGeometry(110, 18).scale(0.75, 1.25, 1).translate(0, 120, 0)
          .rotateX(-0.9 - r() * 0.4).rotateZ(a - Math.PI / 2).translate(...uc);
        (i % 4 === 3 ? kirmizi : yesil).push(yap); // her dördüncüsü kırmızı çiçek yaprağı
      }
    }
  }
  const pla = new THREE.MeshStandardMaterial({ color: 0xe6e1d8, roughness: 0.6 });
  g.add(birlesik(saksi, pla), birlesik(toprak, new THREE.MeshStandardMaterial({ color: 0x3a2b22, roughness: 1 }), { golge: false }));
  g.add(birlesik(yesil, new THREE.MeshStandardMaterial({ color: 0x4d7a45, roughness: 0.6, side: THREE.DoubleSide })));
  if (kirmizi.length) g.add(birlesik(kirmizi, new THREE.MeshStandardMaterial({ color: 0xb8322a, roughness: 0.35, side: THREE.DoubleSide })));
  g.traverse((o) => { o.raycast = () => {}; });
  return g;
}

// ---- fikir rafı (vitrin) ----
// Kanvasa yazmadan önce sayfanın yazı tipleri (en çok 1,5 sn beklenir; gelmezse yedek yazı tipi)
const yaziTipleri = () => Promise.race([
  Promise.all(['700 74px "Big Shoulders Display"', '600 38px "Schibsted Grotesk"', '500 30px "Schibsted Grotesk"', '500 26px "IBM Plex Mono"'].map((f) => document.fonts?.load(f))),
  new Promise((r) => setTimeout(r, 1500)),
]).catch(() => {});
const MUREKKEP = '#1d1f22', KREM = '#ece8e1', KUM = '#e8c48c';
const buyuk = (s, lang) => s.toLocaleUpperCase(lang === 'en' ? 'en' : 'tr');
// Başlığı genişliğe sığdırır: önce tek satırda en çok %25 küçültür, sığmazsa iki satıra böler (döndürür: [satırlar, punto])
function sigdir(g, metin, en, maks) {
  const font = (p) => `700 ${p}px "Big Shoulders Display", "Schibsted Grotesk", Arial, sans-serif`;
  for (let p = maks; p >= maks * 0.75; p -= 2) { g.font = font(p); if (g.measureText(metin).width <= en) return [[metin], p]; }
  const k = metin.split(' ');
  const satir = k.length > 1 ? [k.slice(0, Math.ceil(k.length / 2)).join(' '), k.slice(Math.ceil(k.length / 2)).join(' ')] : [metin];
  for (let p = maks; p >= 30; p -= 2) { g.font = font(p); if (satir.every((s) => g.measureText(s).width <= en)) return [satir, p]; }
  return [satir, 30];
}
// Gözlerin arka kâğıdı (atlas 4 × 2, göz başına 512 px = 440 mm): nokta ızgaralı krem kâğıt, numara, kum rengi şerit
// üstünde büyük başlık, altında alt kalemler. Kendinden ışıklı (ton eşlemesiz): ters ışıkta da okunur.
function kagitAtlasi(lang) {
  const S = 512, [c, g] = kanvas(S * 4, S * 2);
  const L = (o) => o[lang] ?? o.tr;
  ALANLAR.forEach((a, i) => {
    const x = (i % 4) * S, y = Math.floor(i / 4) * S;
    g.fillStyle = KREM; g.fillRect(x, y, S, S);
    g.fillStyle = '#d3ccc0';
    for (let px = 12; px < S; px += 23) for (let py = 12; py < S; py += 23) { g.beginPath(); g.arc(x + px, y + py, 1.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(29,31,34,0.5)'; g.font = '500 26px "IBM Plex Mono", monospace'; g.textBaseline = 'alphabetic';
    g.fillText(String(i + 1).padStart(2, '0'), x + 30, y + 52);
    const [satir, p] = sigdir(g, buyuk(L(a.baslik), lang), S - 60, 92);
    let by = y + 64 + p * 0.82;
    for (const s of satir) {
      const w = g.measureText(s).width;
      g.fillStyle = KUM; g.fillRect(x + 26, by - p * 0.3, w + 10, p * 0.3); // başlık altı fosforlu şerit
      g.fillStyle = MUREKKEP; g.fillText(s, x + 30, by);
      by += p * 0.92;
    }
    g.fillStyle = 'rgba(29,31,34,0.78)'; g.font = '500 30px "Schibsted Grotesk", Arial, sans-serif';
    g.fillText(L(a.alt), x + 30, by + 12);
  });
  return doku(c);
}
// Hayalet çizimler: her alanın ürün fikri, el çizimi gibi titreyen mürekkep (3 çeşit, saniyede 10 kez değişir). Atlas
// 8 sütun (alan) × 3 satır (çeşit); bütün gözler aynı dokuyu kullanır, çeşit doku kaydırmasıyla seçilir.
const HAYALET = {
  kutu: (k) => {
    k.yol([[.08, .58], [.62, .58], [.62, .88], [.08, .88]], true); k.yol([[.62, .58], [.82, .46], [.82, .76], [.62, .88]]);
    k.yol([[.06, .44], [.26, .30], [.86, .33], [.66, .47]], true); k.yol([[.06, .44], [.06, .49], [.66, .52], [.66, .47]]);
    k.yol([[.20, .58], [.26, .53], [.70, .53]], false, [8, 9]);
    k.cokgen(.86, .93, .07, 6); k.yol([[.30, .91], [.44, .91], [.44, 1], [.30, 1]], true); k.nokta(.37, .955); k.nokta(.33, .925); k.nokta(.41, .985);
  },
  plaka: (k) => {
    k.yuvarlak(.05, .26, .95, .80, .06); k.daire(.14, .35, .03); k.daire(.86, .35, .03);
    k.yol([[.18, .70], [.36, .46], [.48, .60], [.62, .40], [.82, .70]]); k.daire(.30, .38, .06);
    k.yol([[.08, .85], [.97, .85], [.97, .30]]);
  },
  figur: (k) => {
    k.daire(.5, .17, .085); k.yol([[.5, .255], [.5, .29]]);
    k.yol([[.36, .32], [.64, .32], [.60, .80], [.40, .80]], true);
    k.yol([[.37, .34], [.42, .50], [.48, .54]]); k.yol([[.63, .34], [.58, .50], [.52, .54]]); k.daire(.5, .55, .045, .035);
    k.daire(.5, .85, .26, .045); k.yol([[.24, .85], [.24, .92]]); k.yol([[.76, .85], [.76, .92]]); k.yay(.5, .92, .26, .045, 0, Math.PI);
    k.yay(.5, .88, .40, .09, 3.6, 5.9); k.yol([[.86, .78], [.885, .815], [.84, .82]]);
  },
  anahtarlik: (k) => {
    k.daire(.5, .12, .09); k.daire(.5, .26, .025, .045); k.daire(.5, .34, .025, .045); k.daire(.5, .42, .025, .045);
    k.yuvarlak(.22, .47, .78, .93, .08); k.daire(.5, .53, .03); k.daire(.5, .73, .11);
    k.yol([[.68, .64], [.75, .60]]); k.yol([[.70, .73], [.78, .73]]); k.yol([[.68, .82], [.75, .86]]);
  },
  stant: (k) => {
    k.yol([[.14, .30], [.72, .30], [.72, .84], [.14, .84]], true); k.yol([[.17, .33], [.69, .33], [.69, .81], [.17, .81]], true);
    k.yol([[.14, .30], [.28, .20], [.86, .20], [.72, .30]]); k.yol([[.86, .20], [.86, .74], [.72, .84]]);
    k.yol([[.06, .84], [.80, .84], [.92, .76]]); k.yol([[.06, .84], [.06, .93], [.80, .93], [.92, .85], [.92, .76]]);
    k.yol([[.34, .84], [.34, .62], [.52, .62], [.52, .84]], false, [7, 8]);
    k.yol([[.22, .42], [.28, .36]]); k.yol([[.23, .50], [.31, .42]]);
  },
  ev: (k) => {
    const yarim = [[.5, .95], [.68, .95], [.75, .80], [.73, .62], [.62, .48], [.58, .38], [.62, .32]];
    k.yol(yarim); k.yol(yarim.map(([x, y]) => [1 - x, y])); k.daire(.5, .32, .12, .025);
    k.yol([[.5, .28], [.5, .98]], false, [10, 6, 2, 6]);
    k.yol([[.5, .31], [.47, .16]]); k.yol([[.47, .16], [.30, .10], [.40, .02], [.47, .16]], true); k.yol([[.47, .16], [.38, .07]]);
  },
  endustri: (k) => {
    k.yol([[.18, .36], [.68, .36], [.68, .80], [.18, .80]], true); k.daire(.43, .58, .12);
    k.yol([[.04, .55], [.18, .55]]); k.yol([[.04, .61], [.18, .61]]); k.yol([[.68, .55], [.94, .55]]); k.yol([[.68, .61], [.94, .61]]); k.yol([[.94, .55], [.94, .61]]);
    k.yol([[.0, .58], [1, .58]], false, [12, 6, 2, 6]);
    k.yol([[.82, .46], [.82, .70]]); k.yol([[.80, .49], [.82, .46], [.84, .49]]); k.yol([[.80, .67], [.82, .70], [.84, .67]]);
    k.daire(.25, .18, .07); k.yol([[.25, .14], [.25, .22]]); k.yol([[.21, .18], [.29, .18]]); k.yol([[.21, .22], [.29, .22]]);
    k.yol([[.70, .16], [.75, .22], [.86, .08]]);
  },
  fikir: (k) => {
    k.yol([[.5, .30], [.24, .43], [.5, .56], [.76, .43]], true);
    k.yol([[.24, .43], [.24, .76], [.5, .89], [.5, .56]]); k.yol([[.5, .89], [.76, .76]]);
    k.yol([[.76, .43], [.76, .76]], false, [9, 9]);
    k.yol([[.80, .20], [.86, .14]]); k.yol([[.84, .26], [.93, .25]]); k.yol([[.74, .16], [.75, .08]]);
  },
};
const HAY = { w: 256, h: 341, en: 255, boy: 340 }; // atlas hücresi (px) ve sahnedeki boyu (mm)
function hayaletAtlasi() {
  const [c, g] = kanvas(HAY.w * 8, 1024);
  g.lineCap = g.lineJoin = 'round';
  ALANLAR.forEach((a, i) => {
    for (let v = 0; v < 3; v++) {
      const r = rnd(101 + i * 7 + v * 131), j = () => (r() - 0.5) * 3.2;
      const ox = i * HAY.w + 16, oy = v * HAY.h + 14, sw = HAY.w - 32, sh = HAY.h - 28;
      const P = ([x, y]) => [ox + x * sw + j(), oy + y * sh + j()];
      g.strokeStyle = 'rgba(29,31,34,0.82)'; g.fillStyle = 'rgba(29,31,34,0.82)'; g.lineWidth = 4.2;
      const ciz = (pts, kapali = false, kesik = null) => {
        g.setLineDash(kesik || []);
        g.beginPath();
        const q = pts.map(P);
        // köşelerde biraz taşma (el çizimi): ilk ve son parçalar 4–8 px uzar
        const uz = (a2, b2, k) => { const dx = b2[0] - a2[0], dy = b2[1] - a2[1], L = Math.hypot(dx, dy) || 1; return [a2[0] - dx / L * k, a2[1] - dy / L * k]; };
        const bas = q.length > 1 && !kapali && !kesik ? uz(q[0], q[1], 3 + r() * 4) : q[0];
        g.moveTo(...bas);
        for (let n = 1; n < q.length; n++) {
          const [x0, y0] = q[n - 1], [x1, y1] = q[n], adim = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 28));
          for (let s = 1; s <= adim; s++) g.lineTo(x0 + (x1 - x0) * s / adim + (s < adim ? j() * 0.6 : 0), y0 + (y1 - y0) * s / adim + (s < adim ? j() * 0.6 : 0));
        }
        if (kapali) { g.lineTo(...q[0]); g.lineTo(...uz(q[0], q[1], -(4 + r() * 4))); }
        else if (!kesik && q.length > 1) g.lineTo(...uz(q[q.length - 1], q[q.length - 2], 3 + r() * 4));
        g.stroke();
      };
      const elips = (cx, cy, rx, ry, a0, a1) => { const n = 26, pts = []; for (let s = 0; s <= n; s++) { const t = a0 + (a1 - a0) * s / n; pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry * (sw / sh)]); } return pts; };
      const k = {
        yol: (pts, kapali, kesik) => ciz(pts, kapali, kesik),
        daire: (cx, cy, rx, ry = rx) => ciz(elips(cx, cy, rx, ry, -0.3, Math.PI * 2 + 0.25)), // kapanışta biraz bindirir
        yay: (cx, cy, rx, ry, a0, a1) => ciz(elips(cx, cy, rx, ry, a0, a1)),
        cokgen: (cx, cy, rr, n2) => ciz(Array.from({ length: n2 }, (_, s) => [cx + Math.cos(s * 2 * Math.PI / n2) * rr, cy + Math.sin(s * 2 * Math.PI / n2) * rr * (sw / sh)]), true),
        yuvarlak: (x0, y0, x1, y1, rr) => { const ry = rr * sw / sh; ciz([[x0 + rr, y0], [x1 - rr, y0], [x1, y0 + ry], [x1, y1 - ry], [x1 - rr, y1], [x0 + rr, y1], [x0, y1 - ry], [x0, y0 + ry]], true); },
        nokta: (x, y) => { const [px, py] = P([x, y]); g.beginPath(); g.arc(px, py, 4, 0, Math.PI * 2); g.fill(); },
      };
      (HAYALET[a.doodle] || HAYALET.fikir)(k);
    }
  });
  const t = doku(c);
  t.anisotropy = 4;
  return t;
}
// Vitrin: huş kontrplak gövde (taban, orta raf, üst tabla, yanlar, bölmeler, arkalık tek ağ), gözlerin arka kâğıdı (tek ağ,
// atlas), her gözde görünmez tıklama kutusu, döner kaide ve hayalet çizim (göz grubu = durağın nesnesi)
function vitrin(lang, ahsap) {
  const V = VITRIN, x0 = V.x - V.en / 2, x1 = V.x + V.en / 2, y0 = V.y - V.derin / 2, y1 = V.y + V.derin / 2;
  const govde = [
    aralik(x0 + 30, x1 - 30, y0 + 40, y1, 0, 40), aralik(x0, x1, y0, y1, 40, 60), aralik(x0, x1, y0, y1, 500, 520), aralik(x0, x1, y0, y1, 960, 1000),
    aralik(x0, x0 + 28, y0, y1, 40, 1000), aralik(x1 - 28, x1, y0, y1, 40, 1000), aralik(x0, x1, y1 - 20, y1, 60, 960),
  ];
  for (let c = 1; c < 4; c++) { const xc = (GOZ.x[c - 1] + GOZ.x[c]) / 2; govde.push(aralik(xc - 14, xc + 14, y0, y1 - 20, 60, 960)); }
  const govdeM = birlesik(govde, ahsap);
  govdeM.raycast = () => {};
  // Arka kâğıtlar: düzlem −y'ye bakar (rotateX(π/2): yerel y → z), atlas hücresi göz başına
  const kagitTex = kagitAtlasi(lang);
  const kag = ALANLAR.map((a, i) => hucreUV(new THREE.PlaneGeometry(GOZ.ic, GOZ.ic), hucre((i % 4) * 512, Math.floor(i / 4) * 512, 512, 512, 2048, 1024, 1))
    .rotateX(Math.PI / 2).translate(GOZ.x[i % 4], y1 - 21, GOZ.z[i < 4 ? 0 : 1]));
  const kagitlar = new THREE.Mesh(mergeGeometries(kag), new THREE.MeshBasicMaterial({ map: kagitTex, toneMapped: false, color: 0xf4f1ec }));
  kagitlar.raycast = () => {};
  // Hayaletler ve kaideler
  const hayTex = hayaletAtlasi();
  const hayM = new THREE.MeshBasicMaterial({ map: hayTex, transparent: true, depthWrite: false, toneMapped: false });
  const kaideM = new THREE.MeshStandardMaterial({ color: 0xe9e6e0, roughness: 0.55 });
  const centik = new THREE.MeshStandardMaterial({ color: 0x3a3e43, roughness: 0.5 });
  const gozler = ALANLAR.map((a, i) => {
    const g = new THREE.Group(), x = GOZ.x[i % 4], zb = GOZ.alt[i < 4 ? 0 : 1];
    const vekil = new THREE.Mesh(aralik(x - GOZ.ic / 2, x + GOZ.ic / 2, y0, y1 - 20, zb, zb + GOZ.ic), new THREE.MeshBasicMaterial({ visible: false }));
    const kaide = new THREE.Mesh(new THREE.CylinderGeometry(KAIDE.r, KAIDE.r, KAIDE.h, 48).rotateX(Math.PI / 2), kaideM);
    kaide.position.set(x, KAIDE.y, zb + KAIDE.h / 2);
    kaide.castShadow = kaide.receiveShadow = true;
    const c = new THREE.Mesh(aralik(KAIDE.r - 24, KAIDE.r - 4, -8, 8, KAIDE.h / 2, KAIDE.h / 2 + 2), centik); // dönüşü gösteren çentik
    kaide.add(c);
    const u0 = (i * HAY.w + 1) / 2048, u1 = ((i + 1) * HAY.w - 1) / 2048, v1 = 1 - 1 / 1024, v0 = 1 - (HAY.h - 1) / 1024;
    const hay = new THREE.Mesh(hucreUV(new THREE.PlaneGeometry(HAY.en, HAY.boy), [u0, v0, u1, v1]).rotateX(Math.PI / 2), hayM);
    hay.position.set(x, KAIDE.y, zb + KAIDE.h + 4 + HAY.boy / 2);
    hay.renderOrder = 2;
    g.add(vekil, kaide, hay);
    g.userData = { kaide, hay, x, zb };
    return g;
  });
  return { govde: govdeM, kagitlar, gozler, hayTex };
}
// Gerçek ürün gelince: yuvadaki GLB döner kaideye sığdırılır (340 × 300 × 360), hayalet çizim söner
async function urunKoy(goz, url) {
  try {
    const s = (await gltf(url)).scene, kap = new THREE.Group(), b = new THREE.Box3().setFromObject(s), boy = b.getSize(new THREE.Vector3());
    const k = Math.min(300 / Math.max(boy.x, 1), 300 / Math.max(boy.y, 1), 360 / Math.max(boy.z, 1));
    s.scale.setScalar(k);
    s.position.set(-(b.min.x + b.max.x) / 2 * k, -(b.min.y + b.max.y) / 2 * k, -b.min.z * k);
    s.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    kap.add(s);
    goz.userData.kaide.add(kap);
    kap.position.z = KAIDE.h / 2;
    goz.userData.hay.visible = false;
  } catch (e) { console.warn('ürün', url, e); }
}

// Süreç rayı: vitrinin üstünde, arkaya hafif yaslı 4 ışıklı kart (300 × 210) ve aralarında doodle oklar
function rayAtlasi(lang) {
  const [c, g] = kanvas(2048, 512), L = (o) => o[lang] ?? o.tr, W = 512, H = 358;
  g.lineCap = g.lineJoin = 'round';
  const ikon = [
    (x, y) => { g.strokeRect(x, y + 40, 110, 110); g.beginPath(); g.moveTo(x, y + 40); g.lineTo(x + 50, y); g.lineTo(x + 160, y); g.lineTo(x + 110, y + 40); g.moveTo(x + 160, y); g.lineTo(x + 160, y + 110); g.lineTo(x + 110, y + 150); g.stroke(); g.setLineDash([8, 8]); g.beginPath(); g.moveTo(x, y + 150); g.lineTo(x + 50, y + 110); g.lineTo(x + 160, y + 110); g.moveTo(x + 50, y + 110); g.lineTo(x + 50, y); g.stroke(); g.setLineDash([]); },
    (x, y) => { g.strokeRect(x + 40, y, 80, 50); g.beginPath(); g.moveTo(x + 55, y + 50); g.lineTo(x + 80, y + 90); g.lineTo(x + 105, y + 50); g.stroke(); for (let k = 0; k < 4; k++) { g.beginPath(); for (let i = 0; i <= 8; i++) g.lineTo(x + i * 20, y + 150 - k * 14 + (i % 2) * 5); g.stroke(); } },
    (x, y) => { g.strokeRect(x + 20, y, 120, 24); g.beginPath(); g.moveTo(x + 60, y + 24); g.lineTo(x + 60, y + 60); g.lineTo(x + 50, y + 80); g.lineTo(x + 110, y + 80); g.lineTo(x + 100, y + 60); g.lineTo(x + 100, y + 24); g.stroke(); g.beginPath(); g.moveTo(x, y + 100); g.lineTo(x, y + 150); g.lineTo(x + 160, y + 150); g.lineTo(x + 160, y + 100); g.stroke(); g.beginPath(); g.arc(x + 80, y + 105, 6, 0, Math.PI * 2); g.fill(); },
    (x, y) => { g.strokeRect(x, y + 70, 70, 80); g.strokeRect(x + 90, y + 70, 70, 80); g.beginPath(); g.arc(x + 70, y + 110, 22, -Math.PI / 2, Math.PI / 2); g.stroke(); g.beginPath(); g.arc(x + 90, y + 110, 22, Math.PI / 2, Math.PI * 1.5); g.stroke(); g.beginPath(); g.moveTo(x + 50, y); g.lineTo(x + 110, y); g.lineTo(x + 100, y + 30); g.lineTo(x + 60, y + 30); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(x + 80, y + 30); g.bezierCurveTo(x + 85, y + 45, x + 75, y + 55, x + 80, y + 66); g.stroke(); },
  ];
  SUREC_RAYI.forEach((s, i) => {
    const x = i * W;
    g.fillStyle = KREM; g.fillRect(x, 0, W, H);
    g.strokeStyle = MUREKKEP; g.lineWidth = 6; g.strokeRect(x + 10, 10, W - 20, H - 20);
    g.fillStyle = 'rgba(29,31,34,0.55)'; g.font = '500 30px "IBM Plex Mono", monospace'; g.fillText(String(i + 1).padStart(2, '0'), x + 34, 62);
    const [satir, p] = sigdir(g, buyuk(L(s.ad), lang), 270, 74);
    satir.forEach((t2, j) => { const w = g.measureText(t2).width, by = 132 + j * p * 0.95; g.fillStyle = KUM; g.fillRect(x + 30, by - p * 0.28, w + 8, p * 0.28); g.fillStyle = MUREKKEP; g.fillText(t2, x + 34, by); });
    g.strokeStyle = MUREKKEP; g.fillStyle = MUREKKEP; g.lineWidth = 5;
    ikon[i](x + 316, 150);
  });
  // ok (hücre 0, 384; 256 × 128)
  g.strokeStyle = MUREKKEP; g.lineWidth = 9;
  g.beginPath(); g.moveTo(20, 450); g.bezierCurveTo(80, 425, 160, 470, 226, 446); g.stroke();
  g.beginPath(); g.moveTo(196, 420); g.lineTo(230, 446); g.lineTo(194, 474); g.stroke();
  return doku(c);
}
function surecRayi(lang, ahsap) {
  const g = new THREE.Group(), V = VITRIN, z = V.boy, y = V.y - 20, egim = -0.14;
  const tex = rayAtlasi(lang);
  const kartlar = [], oklar = [], cer = [];
  cer.push(aralik(V.x - V.en / 2 + 40, V.x + V.en / 2 - 40, y - 60, y + 40, z, z + 16), aralik(V.x - V.en / 2 + 40, V.x + V.en / 2 - 40, y - 64, y - 52, z + 16, z + 34));
  GOZ.x.forEach((x, i) => {
    const k = hucreUV(new THREE.PlaneGeometry(300, 210), hucre(i * 512, 0, 512, 358, 2048, 512, 2)).translate(0, 105, 0).rotateX(Math.PI / 2).rotateX(egim);
    kartlar.push(k.translate(x, y - 30, z + 16));
    cer.push(aralik(-160, 160, 2, 22, -6, 216).rotateX(egim).translate(x, y - 30, z + 16));
    if (i < 3) oklar.push(hucreUV(new THREE.PlaneGeometry(120, 60), hucre(0, 384, 256, 128, 2048, 512, 2)).rotateX(Math.PI / 2).rotateX(egim).translate((x + GOZ.x[i + 1]) / 2, y - 30, z + 120));
  });
  const kM = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xf4f1ec });
  const okM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, toneMapped: false });
  const kartM = new THREE.Mesh(mergeGeometries(kartlar), kM);
  kartM.position.y = -1;
  g.add(birlesik(cer, ahsap), kartM, new THREE.Mesh(mergeGeometries(oklar), okM));
  return g;
}

// Hakkımda: A tipi kara tahta; logo ve 'Oktos Workshop · Ankara' tebeşirle
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
  const levha = new THREE.Group();
  const cer = new THREE.Mesh(new THREE.BoxGeometry(W + 60, 36, H + 60), ahsap); cer.castShadow = true;
  const yuz = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  yuz.position.y = -19;
  levha.add(cer, yuz);
  levha.position.z = Z0 + H / 2;
  levha.rotation.x = -egim;
  grup.add(levha);
  const ayak = (ust, alt) => {
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
  const d = new THREE.Vector2(FOCUS.hakkimda.pos[0] - TAHTA.x, FOCUS.hakkimda.pos[1] - TAHTA.y).normalize();
  grup.rotation.z = Math.atan2(d.x, -d.y);
  return grup;
}

// ---- Biggie ve robotu ----
// Biggie armut koltukta: grup oturağın çukurunda, yüzü koltukla aynı yöne. Görünmez vekil kutu tıklama ve kadraj için
function biggieGrubu() {
  const g = new THREE.Group();
  const vekil = new THREE.Mesh(new THREE.BoxGeometry(520, 520, 1000).translate(0, 0, 500), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(vekil);
  const [fx, fy] = [Math.sin(ARMUT.psi), -Math.cos(ARMUT.psi)];
  g.position.set(ARMUT.x + fx * BIGGIE.ileri, ARMUT.y + fy * BIGGIE.ileri, BIGGIE.z);
  g.rotation.z = ARMUT.psi;
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
    const otur = klip(BIGGIE.otur) ? mixer.clipAction(klip(BIGGIE.otur)) : null;
    otur?.play();
    durum.biggie = { mixer, dur: otur, klip, aktif: otur, model };
  } catch (e) { console.warn('biggie', e); }
}
async function robotuKoy(scene, durum) {
  try {
    const e = await gltf(KOK + 'oda/oda-esya.glb');
    const s = e.scene.getObjectByName('supurge');
    if (!s) return;
    const kap = new THREE.Group(); // Blender'ın taban kayması düğümde kalır (oda gotcha'sı): kabı yerleştir
    kap.add(s);
    s.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const ledler = ['supurge_led_sari', 'supurge_led_mavi'].map((ad) => s.getObjectByName(ad)?.material).filter(Boolean);
    ledler.forEach((m, i) => { m.emissive = new THREE.Color(i ? 0x3d8bff : 0xffb627); });
    durum.ledler = ledler;
    durum.robot = kap;
    scene.add(kap);
  } catch (e) { console.warn('robot', e); }
}

// ---- sahne ----
export async function buildScene({ scene, lang = 'tr' }) {
  const durum = { biggie: null, ledler: [], robot: null, onceki: 0, cesit: -1, odak: null };
  const [gokTex, meta, ortamTex] = await Promise.all([
    new THREE.TextureLoader().loadAsync(KOK + 'cati/gok.webp'),
    fetch(KOK + 'cati/gok.json').then((r) => r.json()),
    new THREE.TextureLoader().loadAsync(KOK + 'cati/ortam.webp'),
    yaziTipleri(),
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
  const beton = new THREE.MeshStandardMaterial({ color: 0xbdb8b0, map: kumDoku(4, { taban: 210, sacilma: 30 }), roughness: 0.9 });
  const ahsap = new THREE.MeshStandardMaterial({ color: 0xd2b48c, map: kumDoku(5, { taban: 232, sacilma: 26, boy: 128 }), roughness: 0.7 });
  const koyuAhsap = new THREE.MeshStandardMaterial({ color: 0x8a6440, map: ahsap.map, roughness: 0.7 });
  const cepheMat = new THREE.MeshStandardMaterial({ map: cepheDoku(), vertexColors: true, roughness: 0.9 });
  const catiMat = new THREE.MeshStandardMaterial({ color: 0xa7a29a, vertexColors: true, roughness: 0.95 });
  for (const m of sehir(cepheMat, catiMat)) scene.add(m);

  scene.add(kabuk(siva, beton), ...pencereVeTavan(), kilim(), bitkiler());
  const kapi = kapiGrubu();
  const V = vitrin(lang, ahsap);
  const ray = surecRayi(lang, koyuAhsap);
  scene.add(kapi, V.govde, V.kagitlar, ...V.gozler, ray);
  ALANLAR.forEach((a, i) => { if (a.yuva?.model) urunKoy(V.gozler[i], a.yuva.model); });
  // Köşe: armut + Biggie (durağın nesnesi), kitaplık ve teleskop (aynı durağa götürür)
  const kose = new THREE.Group();
  const biggie = biggieGrubu();
  kose.add(armut(), biggie);
  const kitap = kitaplik(koyuAhsap), tel = teleskop();
  scene.add(kose, kitap, tel, oyunRafi(koyuAhsap));
  const tahta = await karaTahta(lang);
  scene.add(tahta);
  biggieyiYukle(biggie, durum);       // beklemez: sahne açılır, Biggie gelince görünür
  robotuKoy(scene, durum);
  const robotYol = new THREE.CatmullRomCurve3(ROBOT.yol.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  const robotBoy = robotYol.getLength();

  const s = toSun(), merkez = [0, 0, 600];
  const L = (o) => o[lang] ?? o.tr;
  return {
    shots: SHOTS,
    focusShots: FOCUS,
    look: LOOK,
    focusShift: 0.16,
    touchOrbit: false,
    portraitShot: PORTRE,
    portraitFov: 58,
    fov: 50,              // yatay ekranda görüş açısı (dikey, derece): oda içinden vitrin, pencere ve kilim birlikte
    squareFov: 50,
    cameraBounds: SINIR,
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
      { id: 'surec', object: ray, noLift: true },
      ...ALANLAR.map((a, i) => ({
        id: a.id, object: V.gozler[i], noLift: true, tool: 'goz',
        ...(fikirLinki(a, lang) ? { preset: 'magaza', disari: fikirLinki(a, lang), cta: { [lang]: L(SAYFA.fikrini) } } : {}),
      })),
      { id: 'biggie', object: kose, noLift: true, extra: [kitap, tel], anchor: [biggie.position.x, biggie.position.y, BIGGIE.z + 950] },
      { id: 'hakkimda', object: tahta, noLift: true },
      { id: 'merdiven', object: kapi, noLift: true, anchor: [(CATI.kapi.x0 + CATI.kapi.x1) / 2, CATI.kova.y0, CATI.kapi.h + 120] },
    ],
    update(time) {
      const dt = Math.min(0.1, Math.max(0, time - durum.onceki));
      durum.onceki = time;
      durum.biggie?.mixer.update(dt);
      // Hayalet çizimler saniyede 10 kez titrer (3 çeşit); hareket azaltmada durur
      const cesit = options.reduce ? 0 : Math.floor(time * 10) % 3;
      if (cesit !== durum.cesit) { durum.cesit = cesit; V.hayTex.offset.y = -cesit * HAY.h / 1024; }
      // Odaktaki gözün kaidesi yavaşça döner
      if (durum.odak && !options.reduce) durum.odak.userData.kaide.rotation.z += dt * 0.6;
      // Robot süpürge kilimin çevresinde tur atar (hareket azaltmada yerinde durur)
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
    onFocus(id) { const i = ALANLAR.findIndex((a) => a.id === id); durum.odak = i >= 0 ? V.gozler[i] : null; },
    onUnfocus() { durum.odak = null; }, // motor yeni durağın onFocus'unu bundan sonra çağırır
    // Biggie'ye yeniden tıklamak: oturduğu yerde bir tepki (sevinç, kafa sallama, şaşırma), sonra beklemeye döner
    onPoke(id, { reduced = options.reduce } = {}) {
      const bg = durum.biggie;
      if (id !== 'biggie' || !bg || reduced) return;
      const adlar = ['sevin', 'kafa_salla', 'inanamama'].filter((a) => bg.klip(a));
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
