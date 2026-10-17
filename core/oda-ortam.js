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

// Oda kabuğu: ışıksız (KHR_materials_unlit → MeshBasicMaterial) pişmiş nesneler; adları Blender'dakiyle aynı
export async function odaKabugu(meta) {
  const g = await gltf().loadAsync(new URL(meta.ortam, KOK).href);
  const kok = g.scene;
  kok.traverse((o) => {
    if (!o.isMesh) return;
    pismis(o.material, meta.olcek.ortam);
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
  const src = c2.getImageData(0, 0, w, h).data, out = new Float32Array(w * h * 4), k = 1 / meta.olcek.pano;
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

// Gökyüzü kubbesi: Blender'ın eşdikdörtgen düzeni ve dünya dönüşü (gokDonus) ile birebir aynı yön
export async function gokKubbesi(meta, r = 25000) {
  const tex = await new THREE.TextureLoader().loadAsync(new URL(meta.gok, KOK).href);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, rho: { value: meta.gokDonus }, k: { value: 1 / meta.olcek.gok } },
    vertexShader: `varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform float rho; uniform float k; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float c = cos(rho), s = sin(rho);
        d = vec3(c * d.x - s * d.y, s * d.x + c * d.y, d.z);  // Rz(rho): Blender'daki dünya dönüşü
        vec2 uv = vec2(0.5 - atan(d.y, d.x) / 6.2831853, 0.5 + asin(clamp(d.z, -1.0, 1.0)) / 3.1415927);
        vec3 e = texture2D(map, uv).rgb;
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
const HUZME_FS = `uniform mat3 inv; uniform vec3 org; uniform vec3 renk; uniform float yog; uniform float zaman; uniform float boy;
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
    gl_FragColor = vec4(renk * yog * kal * kenar * uzak * toz, 1.0);
  }`;
export function huzmeler(acikliklar, gunese, { renk = [1, 0.9, 0.78], yogunluk = 0.6, boy = 4200 } = {}) {
  const g = new THREE.Group(), L = new THREE.Vector3(...gunese).multiplyScalar(-1).normalize(), mats = [];
  for (const { x0, x1, z0, z1, y } of acikliklar) {
    const org = new THREE.Vector3(x0, y, z0), ax = new THREE.Vector3(x1 - x0, 0, 0), ay = new THREE.Vector3(0, 0, z1 - z0), az = L.clone().multiplyScalar(boy);
    const M = new THREE.Matrix3().set(ax.x, ay.x, az.x, ax.y, ay.y, az.y, ax.z, ay.z, az.z); // sütunlar: kenar vektörleri
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
    const m4 = new THREE.Matrix4().set(ax.x, ay.x, az.x, org.x, ax.y, ay.y, az.y, org.y, ax.z, ay.z, az.z, org.z, 0, 0, 0, 1);
    geo.applyMatrix4(m4);
    const mat = new THREE.ShaderMaterial({
      uniforms: { inv: { value: M.clone().invert() }, org: { value: org }, renk: { value: new THREE.Color(...renk) }, yog: { value: yogunluk }, zaman: { value: 0 }, boy: { value: boy } },
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
    o.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    out[ad] = o;
  }
  return out;
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
