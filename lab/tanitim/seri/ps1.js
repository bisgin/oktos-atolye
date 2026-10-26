// PS1 tarzı ürün sahnesi (seri bölümlerinin ürün kısmı). three.js, belirlenimci: ciz(p) aynı p için aynı görüntüyü verir.
// PS1 dili: düşük çözünürlüklü hedef (dikey 270×480, çıkışa tam 4 kat yakın komşu), köşe yakalama (ekran ızgarasına
// oturan köşeler: dönerken titrer), afin doku kayması (perspektif düzeltmesiz UV), 15 bit renk + 4×4 sıralı dither, sis,
// mipsiz yakın komşu dokular, menü yazısı kendi 5×7 piksel yazı tipimizle. Işık yüz başına (düz), parlaklık piksel başına.
// Sahne: koyu gradyan gök, sise karışan dama zemin, döner tabla (üstünde çekmece iç ölçüsü kesik çizgiyle), ürün.
// Ürün bir bağdaştırıcıdan gelir (urunler.js): geometri(degerler) değerlere göre önceden üretilmiş geometriyi verir.
// Akış (bolumler.js urun): kaydırıcılar sırayla adım adım kayar, imleç satır satır iner, malzeme döngüsü, "tam ölçü".
// Menü Oktos'un KENDİ atölye cihazının ekranıdır (PS1 / retro oyun menüsü, ustanın aleti): cihaz adı, "UYARLAMA" plakası,
// ölçü cetveli göstergeleri, "… UYARLANIYOR" durum satırı. Sitedeki aracın arayüzüne benzemez; müşteriye "kendin ayarla"
// demez, "her ölçüye ve malzemeye uyarlarız" der (kullanıcı 2026-10-26).
// Sorgu: yok (seri.js sürer). Z yukarı, birim mm.
import * as THREE from 'three';

export const DUSUK = { en: 270, boy: 480 };
const KAT = 4; // çıkış = düşük × 4 (1080×1920)

// ---------- Tohumlu rastgele (mulberry32)
export function rng(tohum) {
  let a = (tohum * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// =====================================================================================================================
// 5×7 PİKSEL YAZI TİPİ (kendi çizimimiz). Büyük harf + rakam + birkaç işaret. Türkçe harfler gövde + işaret katmanı.
// Hücre: 2 satır üst işaret, 7 satır gövde, 2 satır alt işaret; ilerleme 6 px (ölçek 1).
// =====================================================================================================================
// Her glif 7 satır × 5 sütun; satırlar boşlukla ayrılır (# dolu)
const G = {
  A: '.###. #...# #...# ##### #...# #...# #...#', B: '####. #...# #...# ####. #...# #...# ####.', C: '.###. #...# #.... #.... #.... #...# .###.',
  D: '####. #...# #...# #...# #...# #...# ####.', E: '##### #.... #.... ####. #.... #.... #####', F: '##### #.... #.... ####. #.... #.... #....',
  G: '.###. #...# #.... #.### #...# #...# .####', H: '#...# #...# #...# ##### #...# #...# #...#', I: '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.',
  J: '..### ...#. ...#. ...#. #..#. #..#. .##..', K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#', L: '#.... #.... #.... #.... #.... #.... #####',
  M: '#...# ##.## #.#.# #.#.# #...# #...# #...#', N: '#...# #...# ##..# #.#.# #..## #...# #...#', O: '.###. #...# #...# #...# #...# #...# .###.',
  P: '####. #...# #...# ####. #.... #.... #....', R: '####. #...# #...# ####. #.#.. #..#. #...#', S: '.#### #.... #.... .###. ....# ....# ####.',
  T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', U: '#...# #...# #...# #...# #...# #...# .###.', V: '#...# #...# #...# #...# #...# .#.#. ..#..',
  Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', Z: '##### ....# ...#. ..#.. .#... #.... #####', W: '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.',
  X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#', Q: '.###. #...# #...# #...# #.#.# #..#. .##.#',
  0: '.###. #...# #..## #.#.# ##..# #...# .###.', 1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.', 2: '.###. #...# ....# ...#. ..#.. .#... #####',
  3: '####. ....# ....# .###. ....# ....# ####.', 4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.', 5: '##### #.... ####. ....# ....# #...# .###.',
  6: '.###. #.... #.... ####. #...# #...# .###.', 7: '##### ....# ...#. ..#.. .#... .#... .#...', 8: '.###. #...# #...# .###. #...# #...# .###.',
  9: '.###. #...# #...# .#### ....# ....# .###.',
  ' ': '..... ..... ..... ..... ..... ..... .....', '.': '..... ..... ..... ..... ..... .##.. .##..', ':': '..... .##.. .##.. ..... .##.. .##.. .....',
  '/': '....# ....# ...#. ..#.. .#... #.... #....', '-': '..... ..... ..... .###. ..... ..... .....', '×': '..... #...# .#.#. ..#.. .#.#. #...# .....',
  '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..', '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....',
  '·': '..... ..... ..... ..#.. ..... ..... .....', '▶': '#.... ##... ###.. ####. ###.. ##... #....', '◀': '....# ...## ..### .#### ..### ...## ....#',
  '%': '##..# ##..# ...#. ..#.. .#... #..## #..##', '●': '..... .###. ##### ##### ##### .###. .....',
};
const UST = { 'İ': ['I', '..#..'], 'Ö': ['O', '.#.#.'], 'Ü': ['U', '.#.#.'], 'Ğ': ['G', '#...#', '.###.'], 'Â': ['A', '..#..', '.#.#.'] };
const ALT = { 'Ç': ['C', '..#..', '.##..'], 'Ş': ['S', '..#..', '.##..'] };
for (const c of Object.keys(G)) G[c] = G[c].replaceAll(' ', '');
const GLIF = {};
for (const [c, s] of Object.entries(G)) GLIF[c] = { govde: s, ust: [], alt: [] };
for (const [c, [b, ...u]] of Object.entries(UST)) GLIF[c] = { govde: G[b], ust: u.length === 1 ? [u[0], '.....'] : u, alt: [] };
for (const [c, [b, ...a]] of Object.entries(ALT)) GLIF[c] = { govde: G[b], ust: [], alt: a };

export const yaziGenisligi = (metin, olcek = 1) => metin.length * 6 * olcek - olcek;
// (x, y) gövdenin sol üstü; ust işaretler y − 2·ölçek'ten başlar
export function yaz(c2, metin, x, y, renk, olcek = 1, golge = null) {
  if (golge) yaz(c2, metin, x + olcek, y + olcek, golge, olcek);
  c2.fillStyle = renk;
  let cx = Math.round(x);
  for (const ch of metin) {
    const g = GLIF[ch];
    if (g) {
      const satir = (s, y0) => { for (let i = 0; i < 5; i++) if (s[i] === '#') c2.fillRect(cx + i * olcek, y0, olcek, olcek); };
      for (let r = 0; r < 7; r++) satir(g.govde.slice(r * 5, r * 5 + 5), Math.round(y) + r * olcek);
      g.ust.forEach((s, r) => satir(s, Math.round(y) - (g.ust.length - r) * olcek));
      g.alt.forEach((s, r) => satir(s, Math.round(y) + (7 + r) * olcek));
    }
    cx += 6 * olcek;
  }
}
export const buyuk = (s) => s.toLocaleUpperCase('tr-TR');

// =====================================================================================================================
// DOKULAR (tohumlu, 64×64, yakın komşu, mipsiz, sarmal). Her malzeme: yan (FDM'de katman çizgisi) + üst doku.
// =====================================================================================================================
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function doku(n, boya) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const c2 = cv.getContext('2d');
  const im = c2.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const [r, g, b] = boya(x, y);
    const i = (y * n + x) * 4;
    im.data[i] = r; im.data[i + 1] = g; im.data[i + 2] = b; im.data[i + 3] = 255;
  }
  c2.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const carp = (c, k) => c.map((v) => Math.max(0, Math.min(255, v * k)));
const karis = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// Sarmal değer gürültüsü (kafes n×n, kenarlar birleşir)
function gurultu(tohum, kafes) {
  const r = rng(tohum), L = Array.from({ length: kafes * kafes }, r);
  const at = (i, j) => L[((j % kafes + kafes) % kafes) * kafes + ((i % kafes + kafes) % kafes)];
  const yumus = (t) => t * t * (3 - 2 * t);
  return (u, v) => { // u, v ∈ [0, kafes)
    const i = Math.floor(u), j = Math.floor(v), fu = yumus(u - i), fv = yumus(v - j);
    return (at(i, j) * (1 - fu) + at(i + 1, j) * fu) * (1 - fv) + (at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu) * fv;
  };
}

export const MALZEME_AYAR = {
  // parlak: aynasal güç, sert: parlaklık üssü, alfa: saydamlık (reçine), ortam: gölgedeki dolgu
  pla: { renk: '#5fbf95', parlak: 0.04, sert: 8, alfa: 1, ortam: 0.42, fdm: true },
  petg: { renk: '#e0662a', parlak: 0.75, sert: 46, alfa: 1, ortam: 0.4, fdm: true, katman: 0.5 },
  recine: { renk: '#9fd3e6', parlak: 0.9, sert: 70, alfa: 0.4, ortam: 0.62, fresnel: 0.85 },
  tas: { renk: '#bcb3a5', parlak: 0.03, sert: 6, alfa: 1, ortam: 0.44, benek: true },
  mermer: { renk: '#efebe4', parlak: 0.55, sert: 54, alfa: 1, ortam: 0.46, mermer: true, uvOlcek: 0.38 },
};
function malzemeDokulari(anahtar) {
  const m = MALZEME_AYAR[anahtar], R = hex(m.renk), N = 64;
  if (m.fdm) {
    const k = m.katman ?? 1;
    // Yan: yatay katman çizgileri (4 px'lik dönem: koyu, düz, açık, düz) + çok hafif satır kayması
    const r = rng(11);
    const satirK = Array.from({ length: N }, () => 1 + (r() - 0.5) * 0.03 * k);
    const yan = doku(N, (x, y) => carp(R, (1 + [-0.09, 0, 0.05, 0][y % 4] * k) * satirK[y]));
    // Üst: 45° dolgu çizgileri (üst yüzeyin baskı izi)
    const ust = doku(N, (x, y) => carp(R, 1 + [-0.06, 0.03, 0.05, 0.02][(x + y) % 4] * k));
    return { yan, ust };
  }
  if (m.benek) {
    const r = rng(23), koyu = hex('#5b544b'), acik = hex('#f2ece1'), orta = hex('#8f877b');
    const t = doku(N, () => {
      const a = r();
      if (a < 0.08) return koyu;
      if (a < 0.15) return acik;
      if (a < 0.23) return orta;
      return carp(R, 0.96 + r() * 0.08);
    });
    return { yan: t, ust: t };
  }
  if (m.mermer) {
    const M2 = 128, g1 = gurultu(31, 6), g2 = gurultu(57, 3), gri = hex('#77716a'), altin = hex('#c9a03f');
    const t = doku(M2, (x, y) => {
      const u = (x / M2) * 6, v = (y / M2) * 6;
      const tur = g1(u, v) * 0.8 + g2(u / 2, v / 2) * 0.7;
      // tek dönemli damarlar (sarmal), gürültüyle bükülür
      const d = Math.abs(Math.sin((x / M2 + y / M2) * Math.PI * 2 + tur * 3.2));
      const d2 = Math.abs(Math.sin((x / M2 - y / M2) * Math.PI * 2 + tur * 2.6 + 1.3));
      if (d2 < 0.045) return altin;
      if (d < 0.05) return karis(R, gri, 0.9);
      if (d < 0.16) return karis(R, gri, 0.4 * (1 - (d - 0.05) / 0.11));
      return carp(R, 0.98 + g1(u * 3, v * 3) * 0.04);
    });
    return { yan: t, ust: t };
  }
  // reçine: düz, çok hafif dalga
  const g = gurultu(77, 4);
  const t = doku(N, (x, y) => carp(R, 0.94 + g((x / N) * 4, (y / N) * 4) * 0.1));
  return { yan: t, ust: t };
}
const tekRenk = (h) => doku(2, () => hex(h));

// =====================================================================================================================
// PS1 GÖLGELENDİRİCİSİ: köşe yakalama + afin UV + yüz ışığı + piksel parlaklık + sis. Tek malzeme sınıfı her şeye.
// =====================================================================================================================
const PS1_VS = /* glsl */`
uniform vec2 uRes; uniform float uSnap, uSisYakin, uSisUzak;
attribute float aUst;
varying vec3 vUvq; varying vec3 vN; varying vec3 vW; varying float vUst; varying float vSis;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec4 mv = viewMatrix * w;
  vec4 p = projectionMatrix * mv;
  // Köşe yakalama: ekran ızgarasına (uSnap düşük piksel) otur
  vec2 g = uRes * 0.5 / uSnap;
  p.xy = floor(p.xy / p.w * g + 0.5) / g * p.w;
  gl_Position = p;
  // Afin doku: uv·w ve w birlikte enterpole edilir, parçada bölünür → perspektif düzeltmesi iptal
  vUvq = vec3(uv * p.w, p.w);
  vN = mat3(modelMatrix) * normal;
  vW = w.xyz;
  vUst = aUst;
  vSis = clamp((-mv.z - uSisYakin) / (uSisUzak - uSisYakin), 0.0, 1.0);
}`;
const PS1_FS = /* glsl */`
uniform sampler2D tYan, tUst;
uniform vec3 uIsik, uIsikRenk, uSis, uTint;
uniform float uOrtam, uParlak, uSert, uAlfa, uFresnel, uFlas, uIsiksiz, uUvOlcek;
varying vec3 vUvq; varying vec3 vN; varying vec3 vW; varying float vUst; varying float vSis;
void main() {
  vec2 uv = vUvq.xy / vUvq.z * uUvOlcek;
  vec3 t = (vUst > 0.5 ? texture2D(tUst, uv).rgb : texture2D(tYan, uv).rgb) * uTint;
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  float d = max(dot(n, uIsik), 0.0);
  vec3 c = mix(t * (uOrtam + uIsikRenk * d), t, uIsiksiz);
  vec3 h = normalize(uIsik + v);
  c += uParlak * pow(max(dot(n, h), 0.0), uSert);
  float a = uAlfa;
  if (uFresnel > 0.0) a = mix(uAlfa, 0.95, uFresnel * pow(1.0 - max(dot(n, v), 0.0), 2.0));
  c = mix(c, uSis, vSis);
  c += uFlas;
  gl_FragColor = vec4(c, a);
}`;

// Arka plan: ekran uzayında gradyan (gök → ufuk), sisle aynı renk
const ARKA_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
const ARKA_FS = `uniform vec3 uUst, uUfuk; uniform float uUfukY; varying vec2 vUv;
void main() { float t = smoothstep(uUfukY - 0.05, 1.0, vUv.y); gl_FragColor = vec4(mix(uUfuk, uUst, pow(t, 0.7)), 1.0); }`;

// Son geçiş: düşük çözünürlük → çıkış; mozaik, 15 bit + 4×4 sıralı dither, menü katmanı (dithersiz), beyaz flaş
const SON_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const SON_FS = /* glsl */`
uniform sampler2D tSahne, tHud; uniform vec2 uRes; uniform float uMozaik, uSeviye, uBeyaz;
varying vec2 vUv;
const float B4[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
void main() {
  vec2 px = floor(vUv * uRes);
  vec2 blk = floor(px / uMozaik) * uMozaik + floor(uMozaik * 0.5);
  vec3 c = texture2D(tSahne, (blk + 0.5) / uRes).rgb;
  int bi = int(mod(blk.y, 4.0)) * 4 + int(mod(blk.x, 4.0));
  float b = (B4[bi] + 0.5) / 16.0;
  c = floor(clamp(c, 0.0, 1.0) * uSeviye + b) / uSeviye;
  vec4 h = texture2D(tHud, (px + 0.5) / uRes);
  c = mix(c, h.rgb, h.a);
  c = mix(c, vec3(1.0), uBeyaz);
  gl_FragColor = vec4(c, 1.0);
}`;

// manifold çıktısı (scope: positions/numProp/indices) → düz yüzlü, kutu izdüşümlü UV'li, aUst'lü geometri
export function duzGeometri(r, uvOlcek = 1 / 96) {
  const P = r.positions, np = r.numProp, I = r.indices, n = I.length;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), ust = new Float32Array(n);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (let t = 0; t < n; t += 3) {
    a.fromArray(P, I[t] * np); b.fromArray(P, I[t + 1] * np); c.fromArray(P, I[t + 2] * np);
    e1.subVectors(b, a); e2.subVectors(c, a);
    const N = e1.cross(e2).normalize();
    const ax = Math.abs(N.x), ay = Math.abs(N.y), az = Math.abs(N.z);
    [a, b, c].forEach((q, j) => {
      const i = t + j;
      pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z;
      nor[i * 3] = N.x; nor[i * 3 + 1] = N.y; nor[i * 3 + 2] = N.z;
      if (az >= ax && az >= ay) { uv[i * 2] = q.x * uvOlcek; uv[i * 2 + 1] = q.y * uvOlcek; }
      else if (ax >= ay) { uv[i * 2] = q.y * uvOlcek; uv[i * 2 + 1] = q.z * uvOlcek; }
      else { uv[i * 2] = q.x * uvOlcek; uv[i * 2 + 1] = q.z * uvOlcek; }
      ust[i] = N.z > 0.7 ? 1 : 0;
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aUst', new THREE.BufferAttribute(ust, 1));
  g.computeBoundingSphere();
  return g;
}
// three geometrisine aUst ekle (normal z > 0,7 → üst doku)
function ustEkle(g) {
  const N = g.attributes.normal, u = new Float32Array(N.count);
  for (let i = 0; i < N.count; i++) u[i] = N.getZ(i) > 0.7 ? 1 : 0;
  g.setAttribute('aUst', new THREE.BufferAttribute(u, 1));
  return g;
}

// =====================================================================================================================
// AKIŞ: PS1'e göreli kare p → değerler, etkin satır, malzeme. Saf işlev (ses işaretleri de buradan).
// =====================================================================================================================
export function akis(urun) {
  const K = urun.kaydiricilar, M = urun.malzeme;
  const adimlar = K.map((s) => {
    const n = Math.round((s.son - s.bas) / s.adim);
    return Array.from({ length: n }, (_, i) => Math.round(s.k[0] + ((s.k[1] - s.k[0]) * (i + 1)) / n));
  });
  const degerler = (p) => Object.fromEntries(K.map((s, j) => [s.id, s.bas + s.adim * adimlar[j].filter((t) => t <= p).length]));
  const malzeme = (p) => M.sira[M.k.filter((t) => t <= p).length];
  const satir = (p) => Math.max(0, urun.imlec.filter((t) => t <= p).length - 1);
  const isaretler = [];
  K.forEach((s, j) => adimlar[j].forEach((t, i) => isaretler.push({ p: t, tur: 'kaydir', deger: +((i + 1) / adimlar[j].length).toFixed(3), ad: s.etiket })));
  urun.imlec.slice(1).forEach((t) => isaretler.push({ p: t, tur: 'imlec' }));
  M.k.forEach((t, i) => isaretler.push({ p: t, tur: 'malzeme', deger: i + 1, ad: M.sira[i + 1] }));
  isaretler.push({ p: urun.tam, tur: 'tamam' });
  return { degerler, malzeme, satir, adimlar, isaretler };
}

const EO = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// =====================================================================================================================
// KURULUM
// =====================================================================================================================
export async function ps1Kur({ canvas, urun, bagdastirici, malzemeAdlari, sure }) {
  const { en: RW, boy: RH } = DUSUK;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(RW * KAT, RH * KAT, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // renkler sRGB değeriyle yazılır, dönüşüm yok
  const rt = new THREE.WebGLRenderTarget(RW, RH, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false, depthBuffer: true });

  const RENK = { gok: '#111116', ufuk: '#3a2419', zemin1: '#26252b', zemin2: '#1d1c21', tabla: '#e6dfd3', tablaYan: '#b8501b', cizgi: '#e0662a', krem: '#f1ede6' };
  const v3 = (h) => new THREE.Vector3(...hex(h).map((x) => x / 255));
  const ISIK = new THREE.Vector3(-0.78, -0.42, 0.62).normalize(); // soldan önden: üst, yan ve iç duvarlar ayrışsın
  const SIS = v3(RENK.ufuk);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, RW / RH, 40, 12000);
  camera.up.set(0, 0, 1);
  const EL = 38 * Math.PI / 180, MESAFE = 1290;
  camera.position.set(0, -Math.cos(EL) * MESAFE, Math.sin(EL) * MESAFE + 20);
  camera.lookAt(0, 0, 20);
  camera.setViewOffset(RW, RH, 0, 46, RW, RH); // ürünü yukarı al (altta menü)

  const ps1Malzeme = (tYan, tUst, ayar = {}) => new THREE.ShaderMaterial({
    vertexShader: PS1_VS, fragmentShader: PS1_FS,
    transparent: ayar.alfa < 1, depthWrite: !(ayar.alfa < 1), side: ayar.side ?? THREE.FrontSide,
    uniforms: {
      uRes: { value: new THREE.Vector2(RW, RH) }, uSnap: { value: ayar.snap ?? 1 },
      uSisYakin: { value: 1300 }, uSisUzak: { value: 5200 }, uSis: { value: SIS },
      tYan: { value: tYan }, tUst: { value: tUst }, uTint: { value: new THREE.Vector3(1, 1, 1) },
      uIsik: { value: ISIK }, uIsikRenk: { value: new THREE.Vector3(0.82, 0.77, 0.7) },
      uOrtam: { value: ayar.ortam ?? 0.5 }, uParlak: { value: ayar.parlak ?? 0 }, uSert: { value: ayar.sert ?? 8 },
      uAlfa: { value: ayar.alfa ?? 1 }, uFresnel: { value: ayar.fresnel ?? 0 }, uFlas: { value: 0 }, uIsiksiz: { value: ayar.isiksiz ?? 0 },
      uUvOlcek: { value: ayar.uvOlcek ?? 1 },
    },
  });

  // Arka plan
  const arka = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: ARKA_VS, fragmentShader: ARKA_FS, depthWrite: false, depthTest: false,
    uniforms: { uUst: { value: v3(RENK.gok) }, uUfuk: { value: SIS }, uUfukY: { value: 0.58 } },
  }));
  arka.frustumCulled = false; arka.renderOrder = -10;
  scene.add(arka);

  // Dama zemin (alt bölümlü: afin kayma taşkın olmasın)
  const zg = new THREE.PlaneGeometry(9000, 9000, 36, 36);
  zg.attributes.uv.array.forEach((v, i, A) => { A[i] = v * (9000 / 300); });
  const damaDoku = doku(2, (x, y) => hex((x + y) % 2 ? RENK.zemin1 : RENK.zemin2));
  const zemin = new THREE.Mesh(ustEkle(zg), ps1Malzeme(damaDoku, damaDoku, { ortam: 0.85, snap: 1 }));
  zemin.position.z = -40;
  scene.add(zemin);

  // Döner tabla: alçak silindir; üstünde çekmece iç ölçüsü kesik çizgi (ürünle döner)
  const tabla = new THREE.Group();
  scene.add(tabla);
  const TR = 285;
  const tg = new THREE.CylinderGeometry(TR, TR + 8, 40, 20, 1).rotateX(Math.PI / 2).translate(0, 0, -20);
  tabla.add(new THREE.Mesh(ustEkle(tg), ps1Malzeme(tekRenk(RENK.tablaYan), tekRenk(RENK.tabla), { ortam: 0.55 })));
  const cerceveMalz = ps1Malzeme(tekRenk(RENK.cizgi), tekRenk(RENK.cizgi), { isiksiz: 1 });
  {
    const [cw, cd] = urun.cerceve, K = 7, D = 26, B = 16, kutular = [];
    const kenar = (x0, y0, x1, y1) => {
      const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      for (let s = 0; s < L; s += D + B) {
        const e = Math.min(D, L - s), cx = x0 + ux * (s + e / 2), cy = y0 + uy * (s + e / 2);
        const g = new THREE.BoxGeometry(Math.abs(ux) > 0.5 ? e : K, Math.abs(ux) > 0.5 ? K : e, 1.2).translate(cx, cy, 0.8);
        kutular.push(g);
      }
    };
    const x = cw / 2 + 10, y = cd / 2 + 10; // ürünün 10 mm dışında
    kenar(-x, -y, x, -y); kenar(x, -y, x, y); kenar(x, y, -x, y); kenar(-x, y, -x, -y);
    for (const g of kutular) tabla.add(new THREE.Mesh(ustEkle(g), cerceveMalz));
  }

  // Malzemeler (önceden derlenir); reçine iki geçiş (arka yüz, ön yüz)
  const MAL = {};
  for (const k of Object.keys(MALZEME_AYAR)) {
    const a = MALZEME_AYAR[k], d = malzemeDokulari(k);
    if (a.alfa < 1) MAL[k] = [ps1Malzeme(d.yan, d.ust, { ...a, side: THREE.BackSide }), ps1Malzeme(d.yan, d.ust, a)];
    else MAL[k] = [ps1Malzeme(d.yan, d.ust, a)];
  }
  const urunArka = new THREE.Mesh(undefined, MAL.pla[0]), urunOn = new THREE.Mesh(undefined, MAL.pla[0]);
  urunArka.renderOrder = 1; urunOn.renderOrder = 2;
  tabla.add(urunArka, urunOn);

  // Akış ve ürün geometrileri (açılışta: akış boyunca uğranan bütün değerler)
  const A = akis(urun);
  const ugranan = new Map();
  for (let p = -60; p <= sure + 60; p++) { const v = A.degerler(p); ugranan.set(bagdastirici.anahtar(v), v); }
  await bagdastirici.hazirla([...ugranan.values()]);

  // Menü katmanı (düşük çözünürlük 2B)
  const hudCv = document.createElement('canvas');
  hudCv.width = RW; hudCv.height = RH;
  const H2 = hudCv.getContext('2d');
  const hudDoku = new THREE.CanvasTexture(hudCv);
  hudDoku.magFilter = hudDoku.minFilter = THREE.NearestFilter;
  hudDoku.generateMipmaps = false;

  const son = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: SON_VS, fragmentShader: SON_FS, depthTest: false, depthWrite: false,
    uniforms: { tSahne: { value: rt.texture }, tHud: { value: hudDoku }, uRes: { value: new THREE.Vector2(RW, RH) },
      uMozaik: { value: 1 }, uSeviye: { value: 31 }, uBeyaz: { value: 0 } },
  }));
  son.frustumCulled = false;
  const sonSahne = new THREE.Scene();
  sonSahne.add(son);
  const sonKamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Bütün malzemeleri bir kez derle (ilk karede takılma olmasın)
  urunOn.geometry = bagdastirici.geometri(A.degerler(0));
  urunArka.geometry = urunOn.geometry;
  for (const k of Object.keys(MAL)) { urunOn.material = MAL[k][MAL[k].length - 1]; renderer.compile(scene, camera); }

  const ekranda = new THREE.Vector3();
  const KREM = RENK.krem, TURUNCU = RENK.cizgi, MUREKKEP = '#141418', SOLUK = 'rgba(241,237,230,0.55)';

  // ---------- Menü çizimi (p'nin saf işlevi)
  function hudCiz(p, v, malz, satir, ek) {
    H2.clearRect(0, 0, RW, RH);
    if (p < 0) return;
    // Başlık: üstte cihazın adı (Oktos'un atölye aleti), büyük ürün adı (harf harf), canlı ölçü satırı
    const g = EO((p - 2) / 10);
    if (g > 0) {
      yaz(H2, urun.cihaz || 'OKTOS', 12, 12, TURUNCU, 1);
      const b = urun.baslik, n = Math.max(0, Math.min(b.length, Math.floor((p - 4) / 1.5)));
      yaz(H2, b.slice(0, n), 12, 26, KREM, 2, MUREKKEP);
      if (p >= 14) yaz(H2, buyuk(bagdastirici.bilgi(v)), 12, 50, SOLUK, 1);
    }
    // Panel alttan kayarak gelir (2 px adımlı)
    const py0 = 364, ph = 104;
    const kay = Math.round((1 - EO((p - 2) / 12)) * (ph + 20) / 2) * 2;
    const py = py0 + kay;
    if (kay >= ph + 18) return;
    // Cihaz plakası: koyu gövde, turuncu çerçeve, köşe perçinleri, turuncu başlık şeridi (sağda yanıp sönen çalışma ışığı)
    H2.fillStyle = 'rgba(20,20,26,0.92)'; H2.fillRect(8, py, RW - 16, ph);
    H2.fillStyle = TURUNCU;
    H2.fillRect(8, py, RW - 16, 2); H2.fillRect(8, py + ph - 2, RW - 16, 2); H2.fillRect(8, py, 2, ph); H2.fillRect(RW - 10, py, 2, ph);
    H2.fillRect(10, py + 2, RW - 20, 13);
    yaz(H2, urun.panel, 16, py + 5, MUREKKEP, 1);
    if (Math.floor(p / 10) % 2 === 0) yaz(H2, '●', RW - 22, py + 5, MUREKKEP, 1);
    H2.fillStyle = 'rgba(241,237,230,0.35)';
    for (const [x, y] of [[13, py + ph - 6], [RW - 16, py + ph - 6]]) H2.fillRect(x, y, 2, 2);
    const satirlar = [...urun.kaydiricilar.map((s) => ({ tur: 's', s })), { tur: 'm' }];
    satirlar.forEach((r, i) => {
      const y = py + 24 + i * 20, etkin = i === satir;
      if (etkin) { H2.fillStyle = 'rgba(224,102,42,0.9)'; H2.fillRect(12, y - 4, RW - 24, 15); }
      const yr = etkin ? MUREKKEP : KREM;
      if (etkin && Math.floor(p / 8) % 2 === 0) yaz(H2, '▶', 15, y, MUREKKEP, 1);
      if (r.tur === 's') {
        // Ölçü cetveli: çentikli ray, dolan şerit (ustanın metresi gibi), sağda değer
        const s = r.s, deger = v[s.id], x0 = 86, L = 92;
        yaz(H2, s.etiket, 25, y, yr, 1);
        const dol = Math.round(((deger - s.min) / (s.max - s.min)) * L);
        H2.fillStyle = etkin ? 'rgba(20,20,26,0.3)' : 'rgba(241,237,230,0.18)'; H2.fillRect(x0, y + 1, L, 5);
        H2.fillStyle = yr; H2.fillRect(x0, y + 1, dol, 5);
        H2.fillStyle = etkin ? 'rgba(20,20,26,0.55)' : 'rgba(241,237,230,0.4)';
        for (let k = 0; k <= L; k += 4) H2.fillRect(x0 + k, y + 6, 1, k % 16 === 0 ? 3 : 1);
        const t = `${deger} ${s.birim}`;
        yaz(H2, t, RW - 18 - yaziGenisligi(t), y, yr, 1);
      } else {
        yaz(H2, urun.malzeme.etiket, 25, y, yr, 1);
        const ad = buyuk(malzemeAdlari[malz]), x0 = 86, x1 = RW - 18;
        const ax = Math.round((x0 + x1 - yaziGenisligi(ad)) / 2);
        yaz(H2, ad, ax, y, yr, 1);
        if (ek.malzDegisti) { yaz(H2, '+', ax - 9 - ek.malzDegisti, y, yr, 1); yaz(H2, '+', ax + yaziGenisligi(ad) + 4 + ek.malzDegisti, y, yr, 1); }
      }
    });
    // Durum satırı: cihaz ne yapıyor (Oktos uyarlıyor)
    const durum = (urun.durum || []).filter(([k]) => k <= p).pop();
    if (durum) {
      const isler = !/TAMAM/.test(durum[1]);
      if (!isler || Math.floor(p / 6) % 2 === 0) yaz(H2, '●', 16, py + ph - 14, TURUNCU, 1);
      yaz(H2, durum[1], 26, py + ph - 14, isler ? SOLUK : KREM, 1);
    }
    // "TAM ÖLÇÜ!" ürünün üstünden yükselen yazı
    if (ek.tam != null) {
      const q = ek.tam, t = urun.tamOlcu, x = Math.round(ek.tamX - yaziGenisligi(t, 2) / 2), y = Math.round(ek.tamY - 24 - q * 0.6);
      if (q < 34 && !(q > 26 && q % 4 >= 2)) yaz(H2, t, x, y, Math.floor(q / 3) % 2 ? KREM : TURUNCU, 2, MUREKKEP);
    }
  }

  // ---------- Kare: p PS1'e göreli kare; ek: { mozaik, beyaz }
  function ciz(p, { mozaik = 1, beyaz = 0 } = {}) {
    const v = A.degerler(p), malz = A.malzeme(p), satir = A.satir(p);
    const g = bagdastirici.geometri(v);
    urunOn.geometry = g; urunArka.geometry = g;
    const M = MAL[malz];
    urunOn.material = M[M.length - 1];
    urunArka.material = M[0];
    urunArka.visible = M.length > 1;
    // Malzeme değişiminde: yüz parlaması + küçük zoom punch + ok sekmesi
    const mk = urun.malzeme.k.filter((t) => t <= p).pop();
    const dm = mk == null ? 99 : p - mk;
    const flas = dm < 7 ? 0.32 * (1 - dm / 7) : 0;
    for (const [k, L] of Object.entries(MAL)) for (const m of L) m.uniforms.uFlas.value = k === malz ? flas : 0;
    // Dönüş: PS1 süresince tam tur
    tabla.rotation.z = (urun.donusBaslangic + 360 * (p / sure)) * Math.PI / 180;
    // Çerçeve "tam ölçü"de krem yanıp söner
    const dt = p - urun.tam;
    const yanar = dt >= 0 && dt < 24 && Math.floor(dt / 3) % 2 === 0;
    cerceveMalz.uniforms.uTint.value.set(...(yanar ? [1.0, 1.25, 1.4] : [1, 1, 1]));
    // Kamera: hafif itiş + malzeme punch'ı
    camera.zoom = 1 + 0.06 * Math.min(1, Math.max(0, p / sure)) + (dm < 8 ? 0.07 * Math.pow(1 - dm / 8, 2) : 0) + (dt >= 0 && dt < 8 ? 0.05 * Math.pow(1 - dt / 8, 2) : 0);
    camera.updateProjectionMatrix();
    // "Tam ölçü" yazısının yeri: ürünün üst ortası ekranda
    let ek = { malzDegisti: dm < 4 ? 2 : 0 };
    if (dt >= 0 && dt < 40) {
      tabla.updateMatrixWorld(true);
      let ust = Infinity;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        ekranda.set((sx * v.w) / 2, (sy * v.d) / 2, bagdastirici.yukseklik).applyMatrix4(tabla.matrixWorld).project(camera);
        ust = Math.min(ust, (1 - (ekranda.y * 0.5 + 0.5)) * RH);
      }
      ek = { ...ek, tam: dt, tamX: RW / 2, tamY: ust - 4 };
    }
    hudCiz(p, v, malz, satir, ek);
    hudDoku.needsUpdate = true;
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    son.material.uniforms.uMozaik.value = Math.max(1, Math.round(mozaik));
    son.material.uniforms.uBeyaz.value = beyaz;
    renderer.render(sonSahne, sonKamera);
  }
  return { ciz, akis: A, renderer };
}
