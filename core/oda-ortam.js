// Oda sahnesinin fotogerçekçi ortamı (scripts/oda-blender.py çıktıları): pişmiş oda kabuğu (GLB), balkonun ardındaki
// gökyüzü, ürünlerin yansıması için odanın 360° görüntüsü, güneş huzmeleri, ürün gölgesini pişmiş yüzeye düşüren
// görünmez yüzeyler ve çiçekler. Gri kutu (core/oda-sahne.js) pilot açıkken bunları kullanır.
// Doku kodlaması (Blender betiğiyle aynı): dokuda sqrt(ışık × ölçek) sRGB olarak durur; burada sRGB çözülür, karesi
// alınır, ölçeğe bölünür. Böylece güneş lekesi ile gölgedeki duvar (~100 kat fark) 8 bitte bantlanmadan taşınır.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const KOK = new URL('../assets/oda/', import.meta.url);
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';
let loader = null;
function gltf() {
  if (loader) return loader;
  const draco = new DRACOLoader().setDecoderPath(DRACO);
  loader = new GLTFLoader().setDRACOLoader(draco);
  return loader;
}
export const ortamMeta = async () => (await fetch(new URL('oda-ortam.json', KOK))).json();

// Pişmiş doku: haritadan okunan (sRGB'si çözülmüş) değerin karesi × (1 / ölçek)
function pismis(mat, olcek) {
  mat.color.setScalar(1 / olcek);
  mat.fog = false;
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
      vec4 sampledDiffuseColor = texture2D( map, vMapUv );
      sampledDiffuseColor.rgb *= sampledDiffuseColor.rgb;
      diffuseColor *= sampledDiffuseColor;
    #endif`);
  };
  mat.customProgramCacheKey = () => 'oda-pismis';
  return mat;
}

// Oda kabuğu: ışıksız (KHR_materials_unlit → MeshBasicMaterial) pişmiş nesneler; adları Blender'dakiyle aynı.
// ic: odanın içi bu kadar kısılır (loş oda), balkon ve korkuluk olduğu gibi kalır: dışarısı içeriden parlak görünür
export const IC = 0.75;
export async function odaKabugu(meta) {
  const g = await gltf().loadAsync(new URL(meta.ortam, KOK).href);
  const kok = g.scene;
  kok.traverse((o) => {
    if (!o.isMesh) return;
    const disari = /^(balkon|korkuluk|karsi|sokak|dis_)/; // balkon, sokak, karşı bina: dışarısı parlak kalır
    const dis = disari.test(o.name) || disari.test(o.parent?.name ?? '');
    pismis(o.material, meta.olcek.ortam / (dis ? 1 : IC));
    o.castShadow = false;
    o.receiveShadow = false;
  });
  return kok;
}

// 360° görüntüyü çözülmüş kayan noktalı dokuya çevirir (ortam ışığı/yansıma için: tarayıcı kendisi PMREM'e çevirir).
// Blender'ın eşdikdörtgen düzeni Z yukarı; three.js Y yukarı varsayar: sahne.environmentRotation.x = π/2 ile eşlenir.
export async function panoDokusu(meta) {
  const img = await new THREE.ImageLoader().loadAsync(new URL(meta.pano, KOK).href);
  const w = img.width, h = img.height, cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c2 = cv.getContext('2d', { willReadFrequently: true });
  c2.drawImage(img, 0, 0);
  const src = c2.getImageData(0, 0, w, h).data, out = new Float32Array(w * h * 4), k = IC / meta.olcek.pano;
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const s = i / 255, lin = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    lut[i] = lin * lin * k;
  }
  for (let y = 0; y < h; y++) { // satırlar ters çevrilir: dokuda v = 1 üst (gökyüzü)
    const sy = (h - 1 - y) * w * 4, dy = y * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      out[dy + x] = lut[src[sy + x]];
      out[dy + x + 1] = lut[src[sy + x + 1]];
      out[dy + x + 2] = lut[src[sy + x + 2]];
      out[dy + x + 3] = 1;
    }
  }
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.FloatType);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

// Gökyüzü kubbesi: Blender'ın eşdikdörtgen düzeni ve dünya dönüşü (gokDonus) ile birebir aynı yön. Pencereden görünen
// yön aralığı manzaranın tam çözünürlüklü kesitinden (meta.gokYakin: dokudaki yeri u0, du, v0, v1), kalanı küçük tam
// görüntüden okunur
export async function gokKubbesi(meta, r = 25000) {
  const tl = new THREE.TextureLoader(), yk = meta.gokYakin;
  const [tex, yakin] = await Promise.all([tl.loadAsync(new URL(meta.gok, KOK).href), yk ? tl.loadAsync(new URL(yk.dosya, KOK).href) : null]);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (yakin) { // ekranda hep büyütülerek görünür: mip gerekmez (kesit kenarında türev sıçraması da olmaz)
    yakin.colorSpace = THREE.SRGBColorSpace;
    yakin.generateMipmaps = false;
    yakin.minFilter = THREE.LinearFilter;
  }
  const kirp = yk ? new THREE.Vector4(yk.u0, yk.du, yk.v0, yk.v1) : new THREE.Vector4(0, 0, 0, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, yakin: { value: yakin ?? tex }, kirp: { value: kirp }, rho: { value: meta.gokDonus }, k: { value: 1 / meta.olcek.gok }, lift: { value: meta.gokYukselt ?? 0 } },
    vertexShader: `varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform sampler2D yakin; uniform vec4 kirp; uniform float rho; uniform float k; uniform float lift; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float c = cos(rho), s = sin(rho);
        d = vec3(c * d.x - s * d.y, s * d.x + c * d.y, d.z);  // Rz(rho): Blender'daki dünya dönüşü
        // lift: manzaranın ufku biraz aşağı kayar; görüntünün kendi yakın korkuluğu bizim döşemenin ardında kalır
        vec2 uv = vec2(0.5 - atan(d.y, d.x) / 6.2831853, clamp(0.5 + (asin(clamp(d.z, -1.0, 1.0)) + lift) / 3.1415927, 0.0, 1.0));
        vec3 e = texture2D(map, uv).rgb;
        float cu = fract(uv.x - kirp.x) / max(kirp.y, 1e-5), cv = (uv.y - kirp.z) / max(kirp.w - kirp.z, 1e-5);
        float ic = step(0.0001, kirp.y) * step(cu, 1.0) * step(0.0, cv) * step(cv, 1.0);
        e = mix(e, texture2D(yakin, vec2(cu, cv)).rgb, ic);
        gl_FragColor = vec4(e * e * k, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

// Güneş huzmeleri: açıklık dikdörtgeni (x0..x1, z0..z1, duvar düzlemi y) güneşin tersi yönde süpürülür. Parça
// gölgelendiricisi bakış ışınının bu eğik kutudaki yolunu hesaplar: kalın yerde yoğun, kenarda yumuşak, zeminin altında
// yok; içinde ağır kıpırdayan toz. Gerçek hacimsel ışık değil (çok ağır): film setlerindeki gibi bir ışık hilesi.
const HUZME_VS = `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const HUZME_FS = `uniform mat3 inv; uniform vec3 org; uniform vec3 renk; uniform float yog; uniform float zaman; uniform float boy; uniform float guc;
  varying vec3 vW;
  float gurultu(vec3 p) { return sin(p.x * 0.011 + zaman * 0.21) * sin(p.y * 0.013 - zaman * 0.17) * sin(p.z * 0.009 + zaman * 0.13); }
  void main() {
    vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
    vec3 o = inv * (ro - org), d = inv * rd;            // birim küp uzayı: x açıklık genişliği, y yükseklik, z süpürme
    vec3 t1 = (vec3(0.0) - o) / d, t2 = (vec3(1.0) - o) / d;
    vec3 tn = min(t1, t2), tf = max(t1, t2);
    float a = max(max(tn.x, tn.y), max(tn.z, 0.0)), b = min(min(tf.x, tf.y), tf.z);
    // zeminin (z = 0) altı sayılmaz
    if (rd.z < 0.0) b = min(b, -ro.z / rd.z); else a = max(a, -ro.z / rd.z);
    if (b <= a) discard;
    vec3 m = o + d * (0.5 * (a + b));                   // yolun ortası (birim küpte)
    float kenar = smoothstep(0.0, 0.12, m.x) * smoothstep(1.0, 0.88, m.x) * smoothstep(0.0, 0.08, m.y) * smoothstep(1.0, 0.92, m.y);
    float uzak = smoothstep(0.0, 0.08, m.z) * (1.0 - smoothstep(0.35, 1.0, m.z));  // açıklıkta doğar, ilerledikçe söner
    vec3 pw = ro + rd * (0.5 * (a + b));
    float toz = 0.82 + 0.18 * gurultu(pw);
    float kal = (b - a) / boy;                          // yol uzunluğu (huzme boyuna göre)
    // Kameranın yakınındaki pus söner: önünden geçen huzme görüntüyü sütlü bir perdeyle kapatmasın
    float yakin = smoothstep(600.0, 2200.0, distance(cameraPosition, pw));
    gl_FragColor = vec4(renk * yog * guc * kal * kenar * uzak * toz * yakin, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
export function huzmeler(acikliklar, gunese, { renk = [1, 0.9, 0.78], yogunluk = 0.4, boy = 4200 } = {}) {
  const g = new THREE.Group(), L = new THREE.Vector3(...gunese).multiplyScalar(-1).normalize(), mats = [];
  for (const { x0, x1, z0, z1, y } of acikliklar) {
    const org = new THREE.Vector3(x0, y, z0), ax = new THREE.Vector3(x1 - x0, 0, 0), ay = new THREE.Vector3(0, 0, z1 - z0), az = L.clone().multiplyScalar(boy);
    const M = new THREE.Matrix3().set(ax.x, ay.x, az.x, ax.y, ay.y, az.y, ax.z, ay.z, az.z); // sütunlar: kenar vektörleri
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
    const m4 = new THREE.Matrix4().set(ax.x, ay.x, az.x, org.x, ax.y, ay.y, az.y, org.y, ax.z, ay.z, az.z, org.z, 0, 0, 0, 1);
    geo.applyMatrix4(m4);
    const mat = new THREE.ShaderMaterial({
      uniforms: { inv: { value: M.clone().invert() }, org: { value: org }, renk: { value: new THREE.Color(...renk) }, yog: { value: yogunluk }, zaman: { value: 0 }, boy: { value: boy }, guc: { value: 1 } },
      vertexShader: HUZME_VS, fragmentShader: HUZME_FS,
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    mats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    g.add(mesh);
  }
  g.userData.tick = (t) => { for (const m of mats) m.uniforms.zaman.value = t; };
  // Genel güç (0..1): sahne yakın plana geçince kısar (huzmeler genel planın havasıdır)
  const guc = { v: 1 };
  g.userData.guc = (v, sure, gsap) => gsap.to(guc, { v, duration: sure, ease: 'power2.out', overwrite: true, onUpdate: () => { for (const m of mats) m.uniforms.guc.value = guc.v; } });
  return g;
}

// Ürün gölgesini pişmiş yüzeye düşüren görünmez yüzey (yalnız gölge çizilir)
export function golgeYuzeyi(w, d, x, y, z, opacity = 0.7) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.ShadowMaterial({ opacity, depthWrite: false }));
  m.position.set(x, y, z);
  m.receiveShadow = true;
  m.renderOrder = 1;
  return m;
}

// Çiçekler (ışıklı malzeme, 2K doku): adı verilen çeşitler, tabanı orijinde
export async function cicekler(meta) {
  const g = await gltf().loadAsync(new URL(meta.bitki.dosya, KOK).href);
  const out = {};
  for (const ad of meta.bitki.cesitler) {
    const o = g.scene.getObjectByName(ad);
    if (!o) continue;
    o.traverse((x) => {
      if (!x.isMesh) return;
      x.castShadow = true;
      x.receiveShadow = true;
      // Yaprak saydamlığı karışım değil kesik: karışımlı malzeme derinlik yazmaz, sonra çizilen tül (önündeki
      // çiçeğin arkasında durduğu hâlde) üstüne biniyordu
      for (const m of [x.material].flat()) if (m.transparent && m.map) { m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; }
    });
    out[ad] = o;
  }
  return out;
}

// Canlı ışıkta duran eşyalar (monitör, mini buzdolabı): kök düğümler, adları Blender'dakiyle aynı. Buzdolabının kapağı
// 'buzdolabi_kapak' düğümü, orijini menteşede (sahne döndürür).
export async function esyalar(meta) {
  const g = await gltf().loadAsync(new URL(meta.esya.dosya, KOK).href);
  const out = {};
  for (const ad of meta.esya.koklar) {
    const o = g.scene.getObjectByName(ad);
    if (!o) continue;
    o.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    out[ad] = o;
  }
  return out;
}

// Çay takımı (balkon masasındaki kupanın yerine): ince belli cam çay bardağı, içinde demli çay, porselen tabak.
// Dönme gövdeleri kodla kurulur (profil mm: [yarıçap, yükseklik]); cam gerçek kırılma ve yansımayla çizilir.
function donme(profil, seg = 64) {
  const g = new THREE.LatheGeometry(profil.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2); // three.js Y ekseninde döndürür; sahne Z yukarı
  return g;
}
export function cayTakimi() {
  const g = new THREE.Group();
  const cam = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 1.6, ior: 1.5, envMapIntensity: 1.3 });
  // Çay opak: three.js'te geçirgen bardağın ardındaki ikinci geçirgen nesne (çay) çizilmez; demli çay zaten koyu
  const cay = new THREE.MeshPhysicalMaterial({ color: 0x6a1a07, roughness: 0.12, envMapIntensity: 0.6 });
  // Üst yüz ayrı: gerçek çayda ışık içeri girer, yüzey koyu bir ayna gibi durur (aynı renkte güneşte pembe görünüyordu)
  const cayUst = new THREE.MeshPhysicalMaterial({ color: 0x3a0a04, roughness: 0.03, envMapIntensity: 0.45 });
  const porselen = new THREE.MeshPhysicalMaterial({ color: 0xf3f1ec, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 });
  const tabak = new THREE.Mesh(donme([[0, 0], [30, 0], [32, 1.5], [40, 3], [48, 6], [54, 10], [56, 12], [55.4, 13], [53, 11.6], [46, 8.6], [36, 6], [26, 4.5], [24, 4], [0, 4]]), porselen);
  // Bardak (klasik ince belli, ~100 ml): yuvarlak alt gövde Ø 50, bel Ø 38, lale gibi açılan ağız Ø 56, boy 96.
  // Dış profil yukarı, ağızdan iç profil aşağı (~1,3 mm et), 7 mm kalın taban
  const bardak = new THREE.Mesh(donme([[0, 0], [20, 0], [21.2, 0.8], [21.6, 2.5], [22.5, 6], [24.5, 13], [25.2, 20], [24.6, 27], [22.4, 34],
    [20, 41], [19, 48], [19.2, 54], [20.5, 62], [22.8, 72], [25.4, 83], [27.4, 92], [28, 96], [27.6, 96.6], [26.8, 96],
    [26.2, 92], [24.2, 83], [21.6, 72], [19.3, 62], [18, 54], [17.8, 48], [18.8, 41], [21.2, 34], [23.4, 27], [24, 20], [23.3, 13],
    [21.4, 8], [19, 7], [0, 7]], 96), cam);
  const sivi = new THREE.Mesh(donme([[0, 7.2], [18.8, 7.2], [21.2, 8.2], [23.1, 13], [23.8, 20], [23.2, 27], [21, 34], [18.6, 41], [17.6, 48],
    [17.8, 54], [19.1, 62], [21.4, 72], [23.3, 80], [23.8, 82.5]], 96), cay);
  const yuzey = new THREE.Mesh(new THREE.CircleGeometry(23.8, 96), cayUst);
  yuzey.position.z = 82.5;
  bardak.position.z = sivi.position.z = 4; // tabağın çukuruna oturur
  sivi.add(yuzey);
  tabak.castShadow = tabak.receiveShadow = true;
  sivi.castShadow = true;
  g.add(tabak, sivi, bardak);
  return g;
}

// Saksı toprağı malzemesi (Poly Haven farm_soil, 1K WebP)
let toprakMat = null;
export function toprakMalzemesi() {
  if (toprakMat) return toprakMat;
  const tl = new THREE.TextureLoader(), t = (f, srgb) => {
    const x = tl.load(new URL(f, KOK).href);
    x.wrapS = x.wrapT = THREE.RepeatWrapping;
    if (srgb) x.colorSpace = THREE.SRGBColorSpace;
    return x;
  };
  toprakMat = new THREE.MeshStandardMaterial({ map: t('toprak-renk.webp', true), normalMap: t('toprak-normal.webp'), roughnessMap: t('toprak-puruz.webp'), roughness: 1, envMapIntensity: 0.6 });
  return toprakMat;
}

// Tül perde (oda-esya.glb 'perde' kökü): yarı saydam, pencereden gelen ışıkla hafif parlar; eteği rüzgârla odaya doğru
// salınır (üst kornişte sabit, aşağı indikçe artar). Işığın süzülmesi pişmiş dokuda durur; burada yalnız kumaş oynar.
// zUst / zAlt: kornişin ve eteğin yüksekliği (mm); hareket azaltma tercihinde perde kıpırdamaz.
export function perdeTul(kok, { zUst, zAlt }) {
  const u = {
    zaman: { value: 0 }, zUst: { value: zUst }, zAlt: { value: zAlt },
    genlik: { value: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 16 }, // etekte en çok, mm
  };
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf2efe8, roughness: 0.92, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false,
    emissive: 0xfff3e2, emissiveIntensity: 0.1, envMapIntensity: 0.5,
  });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'uniform float zaman; uniform float genlik; uniform float zUst; uniform float zAlt;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float etek = clamp((zUst - position.z) / (zUst - zAlt), 0.0, 1.0);
      etek *= etek;
      float esinti = (sin(zaman * 0.8 + position.x * 0.011) + 0.45 * sin(zaman * 1.9 + position.x * 0.029 + 1.3)) / 1.45;
      transformed.y -= genlik * etek * (0.55 + 0.45 * esinti);   // pencereden esen rüzgâr eteği odaya iter
      transformed.x += genlik * 0.2 * etek * sin(zaman * 0.6 + position.z * 0.004);`);
  };
  mat.customProgramCacheKey = () => 'oda-perde';
  kok.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    if (o.name.startsWith('perde_')) { o.material = mat; o.renderOrder = 3; }
  });
  kok.userData.tick = (t) => { u.zaman.value = t; };
  return kok;
}

// Markasız içecekler (buzdolabının kapak rafı): 330 ml alüminyum kutu (Ø 66, boy 122; gövde boyalı, yazı ve logo yok,
// ince gümüş şerit) ve uzun boyunlu cam şişe (içi opak: geçirgen camın ardındaki ikinci geçirgen nesne çizilmez).
// Tabanı z = 0'da.
const icAlu = () => new THREE.MeshStandardMaterial({ color: 0xd6d9dc, metalness: 1, roughness: 0.3 });
export function icecekKutusu(renk) {
  const g = new THREE.Group(), alu = icAlu();
  const boya = new THREE.MeshPhysicalMaterial({ color: renk, metalness: 0.4, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.12 });
  g.add(new THREE.Mesh(donme([[0, 2.5], [22, 0.4], [27, 1], [31, 4], [33, 9]], 48), alu));
  g.add(new THREE.Mesh(donme([[33, 9], [33, 66], [33, 66.1]], 48), boya));
  g.add(new THREE.Mesh(donme([[33.05, 66], [33.05, 70]], 48), alu));
  g.add(new THREE.Mesh(donme([[33, 70], [33, 104]], 48), boya));
  g.add(new THREE.Mesh(donme([[33, 104], [31.5, 110], [28, 116.5], [27.2, 120.5], [26.4, 122], [24.6, 121.2], [24.2, 118], [0, 118]], 48), alu));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function camSise(icRenk = 0xc9d36a, kapakRenk = 0xb8372f) {
  const g = new THREE.Group();
  const cam = new THREE.MeshPhysicalMaterial({ color: 0xcfe8d4, roughness: 0.04, transmission: 1, thickness: 3, ior: 1.5, envMapIntensity: 1.2 });
  const sivi = new THREE.MeshStandardMaterial({ color: icRenk, roughness: 0.2 });
  g.add(new THREE.Mesh(donme([[0, 0], [28, 0], [30, 4], [30, 140], [26, 165], [15, 195], [13, 228], [0, 228]], 48), cam));
  g.add(new THREE.Mesh(donme([[0, 3], [27, 3], [28, 6], [28, 138], [24, 162], [12.5, 188], [0, 188]], 48), sivi));
  g.add(new THREE.Mesh(donme([[0, 238], [14, 238], [14.6, 236], [14.6, 227], [13.6, 226], [0, 226]], 32), new THREE.MeshStandardMaterial({ color: kapakRenk, metalness: 0.6, roughness: 0.35 })));
  return g;
}
