// SÇ3 kahraman kare (M2 stil karesi; film k1860, plan #23): "Bunlar için Oktos var." / "That's what Oktos is for."
// Plan: tanıtım filmi planı v04 (yerel çalışma notları) §3 #23, §4 stil kılavuzu, §5 G4.
// Kare: tek kâğıt masa (kâğıdın kendisi masa, ~50° üstten), üstünde dört GERÇEK nesne (three.js PBR, tam renk):
//   (1) şeffaf reçine zar seti d4–d20 (zar.js malzemesi ve d10'u), (2) Gridfinity bölmeli organizer + düzenli vidalar,
//   (3) Biggie minyatürü (assets/oda/karakter.glb, boyalı reçine), (4) mermer desenli epoksi saksı (tools/vase vaseMesh).
// Dört doodle karakter (insan.js + kol.js, MONO gri, sc1.js mürekkep katmanı) kadrajın kenarlarından eğilip bakar.
// Katmanlar (alttan): WebGL (kâğıt zemin + masa doodle'ı ekran uzayında dokulu zemin olarak sahnede: zarlar onu kırar;
//   nesneler, gölge, temas gölgesi, renkli kostik) → karakter SVG'si → Oktos'un sesi (SVG yazı) → kâğıt greni (sc1.js
//   kagitKur; gerçek nesnelerin üstünden maskeyle kaldırılır: "tam renk yalnız gerçekte", gren yalnız kâğıt dünyasında).
// Kaynama 8 fps / 4 çizim (karakterler ve masa çizgisi). Kamera 1,6 sn'de %2 iter (#23: k1824–1919); yazı ve gren sabit.
// Sorgu: ?yon=yatay|dikey ?dil=tr|en ?yazi=0 (site sürümü) ?kisi=0 ?kagit=0 ?t=0.6 (kareyi dondur) ?cek=1 (anlar.py, film-cek.py)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { rastgeleKisi, yol, oval, rng, MONO, GOZ_Y } from '../insan.js';
import { kolSVG, kolIK, omuzlar, bilekBul, govdeKes } from '../kol.js';
import { stilKisi, murekkepSekli, kalinlikPx, kagitKur, STIL, E } from './sc1.js';
import { vaseMesh, radiusFn, PROFILES, SIDES_CIRCLE } from '../../../tools/vase/geometry.js';
import { fastener, nutGeometry, merge } from '../../../core/props.js';

const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const DIL = q.get('dil') === 'en' ? 'en' : 'tr';
const PR = 2; // render keskinliği
const M = STIL.murekkep, KAGIT = STIL.kagit;
const SURE = 96 / 60; // #23: k1824–1919
const T_KAHRAMAN = (1860 - 1824) / 60; // k1860
const NS = 'http://www.w3.org/2000/svg';
const hataEl = document.getElementById('hata');
const D2R = Math.PI / 180;

// ======================================================================================= YERLEŞİM (iki ayrı kompozisyon)
// Dünya: mm, Z yukarı, masa (kâğıt) z=0, kamera −Y'den bakar. Nesneler: [x, y, z dönüşü °].
const KUR = DIKEY ? {
  kam: { yuks: 54, uzak: 1010, fov: 34, hedef: [-6, -12, 22], kay: -92 },
  masa: { x0: -168, x1: 168, y0: -268, y1: 172, kalin: 16 },
  zar: [[-128, -22, 18], [-96, -44, -14], [-64, -20, 26], [-118, -82, 8], [-84, -96, -22], [-50, -72, 12]],
  organizer: [58, -62, -16], figur: [-50, 40, 22], saksi: [76, 22, 0],
  isikMerkez: [-6, -16],
} : {
  kam: { yuks: 52, uzak: 705, fov: 23, hedef: [-6, -6, 22], kay: 104 },
  masa: { x0: -240, x1: 240, y0: -150, y1: 145, kalin: 16 },
  zar: [[-142, 2, 18], [-109, -22, -14], [-76, 4, 26], [-130, -60, 8], [-94, -72, -22], [-60, -46, 12]],
  organizer: [34, -52, -16], figur: [-26, 44, 22], saksi: [122, 8, 0],
  isikMerkez: [-10, -6],
};

// ======================================================================================= SAHNE (DOM)
const sahne = document.getElementById('sahne'), kameraDiv = document.getElementById('kamera');
const tuval = document.getElementById('gl'), kisiSvg = document.getElementById('kisiler');
for (const e of [sahne, kameraDiv]) Object.assign(e.style, { width: W + 'px', height: H + 'px' });
Object.assign(tuval.style, { width: W + 'px', height: H + 'px' });
kisiSvg.setAttribute('viewBox', `0 0 ${W} ${H}`); kisiSvg.setAttribute('width', W); kisiSvg.setAttribute('height', H);
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();

// ======================================================================================= RENDERER, KAMERA
const renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.setClearColor(KAGIT, 1);
const sc = new THREE.Scene();

const kam = (() => {
  const c = KUR.kam, e = c.yuks * D2R, h = new THREE.Vector3(...c.hedef);
  const k = new THREE.PerspectiveCamera(c.fov, W / H, 20, 8000);
  k.up.set(0, 0, 1);
  k.position.set(h.x, h.y - c.uzak * Math.cos(e), h.z + c.uzak * Math.sin(e));
  k.lookAt(h);
  if (c.kay) k.setViewOffset(W, H, 0, -c.kay, W, H); // hedef ekranda kay px aşağıda (lens kaydırma: dikeyler eğilmez)
  k.updateProjectionMatrix();
  k.updateMatrixWorld(true);
  return k;
})();
const ekran = (x, y, z = 0) => { const v = new THREE.Vector3(x, y, z).project(kam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };

// ======================================================================================= ORTAM IŞIĞI (stüdyo)
// zar.js yaklaşımı: ışık panellerinden PMREM. Büyük sıcak tepe-sol softbox, sağda dar şerit (cam kenarına çizgi),
// önde alçak dolgu, altta kâğıt yansıması, duvarlar koyu (şeffaf zarın kenarlarını tanımlar).
{
  const o = new THREE.Scene();
  o.background = new THREE.Color('#1b1917');
  const panel = (w, h, p, renk, guc) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(renk).multiplyScalar(guc), side: THREE.DoubleSide }));
    m.position.set(...p); m.lookAt(0, 0, 0); o.add(m);
  };
  panel(4.6, 2.6, [-3.2, 2.4, 5.2], '#fff3e2', 6.5);   // ana softbox (anahtar ışığın yönü)
  panel(0.7, 4.2, [4.4, -0.6, 1.8], '#f4f6ff', 3.4);   // sağ şerit
  panel(5.5, 1.1, [0, -5, 1.2], '#fff8ee', 0.8);       // ön dolgu (kamera tarafı)
  panel(3.6, 1.2, [0.4, 4.2, 5.0], '#fff6ea', 2.1);    // üst yüzlerin yansıma yolu (kameranın aynası): cam yüzeylerde parıltı
  panel(2.2, 2.2, [-2.6, 5, 1.6], '#ffe6c8', 1.1);     // arka sıcak sekme
  panel(14, 14, [0, 0, -3.5], KAGIT, 0.5);              // kâğıt (alttan yansıma)
  sc.environment = new THREE.PMREMGenerator(renderer).fromScene(o, 0.025).texture;
}
const anaIsik = new THREE.DirectionalLight(0xfff0dc, 2.6);
anaIsik.position.set(-360, 330, 900);
anaIsik.castShadow = true;
anaIsik.shadow.mapSize.set(2048, 2048);
Object.assign(anaIsik.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 200, far: 2200 });
anaIsik.shadow.camera.updateProjectionMatrix();
anaIsik.shadow.radius = 9;
anaIsik.shadow.blurSamples = 24;
anaIsik.shadow.bias = -0.0004;
sc.add(anaIsik, anaIsik.target);
const dolgu = new THREE.DirectionalLight(0xe9eeff, 0.35);
dolgu.position.set(600, -500, 300);
sc.add(dolgu);
const ISIK_YON = new THREE.Vector2(360, -330).normalize(); // gölgenin masadaki yönü (ışıktan uzağa)

// ======================================================================================= YARDIMCILAR
const yuvarla = (v) => Math.round(v * 100) / 100;
const XS = new XMLSerializer();
const acikMi = (r) => { const m = /^#([0-9a-f]{6})$/i.exec(r || ''); if (!m) return false; const v = parseInt(m[1], 16); return ((v >> 16) + ((v >> 8) & 255) + (v & 255)) / 765 > 0.75; };
// SVG parça dizgesini sc1.js'in mürekkep kuralıyla çizer (sc1 ogeMurekkeple dışa açık değil; kural aynı):
// kontur → değişken kalınlıklı fırça şekli (ana 6 px, iç 3,6 px ekran pikseli), dolgu kayması 2,5 px.
function murekkeple(str, S, tohum) {
  if (!str) return '';
  const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}">${str}</svg>`, 'image/svg+xml');
  let n = 0;
  const yaz = (e) => XS.serializeToString(e).replace(/ xmlns="[^"]*"/g, '');
  const oge = (e) => {
    const ad = e.tagName;
    if (ad === 'g') return `<g${[...e.attributes].map((a) => ` ${a.name}="${a.value}"`).join('')}>${[...e.children].map(oge).join('')}</g>`;
    if (ad === 'path') {
      const st = e.getAttribute('stroke'), fill = e.getAttribute('fill'), sw = +e.getAttribute('stroke-width') || 0;
      if ((!fill || fill === 'none') && st && sw) {
        const px = kalinlikPx(sw);
        if (acikMi(st) || e.hasAttribute('data-duz')) return `<path d="${e.getAttribute('d')}" fill="none" stroke="${st}" stroke-width="${yuvarla(px / S)}" stroke-linecap="round" stroke-linejoin="round"${e.getAttribute('opacity') ? ` opacity="${e.getAttribute('opacity')}"` : ''}/>`;
        const sk = murekkepSekli(e.getAttribute('d'), px, S, tohum * 131 + (n++) * 7);
        return `<path fill="${st}" d="${sk.replace('__R__', st)}"/>`;
      }
      const tr = /^translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)$/.exec(e.getAttribute('transform') || '');
      if (fill && fill !== 'none' && tr && Math.abs(+tr[1]) <= 3.5 && Math.abs(+tr[2]) <= 3.5) {
        const k = yuvarla(STIL.kaymaPx / S);
        e.setAttribute('transform', `translate(${k} ${k})`);
      }
      return yaz(e);
    }
    if (ad === 'circle' && e.getAttribute('stroke')) e.setAttribute('stroke-width', yuvarla(kalinlikPx(+e.getAttribute('stroke-width')) / S));
    return yaz(e);
  };
  return [...doc.documentElement.children].map(oge).join('');
}
// Doodle çizgi araçları (insan.js titreşimi; kaynama k ile)
function kalem(tohum, k, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + k * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}
function araclar(tohum, k, genlik = 1) {
  const s = kalem(tohum, k, genlik);
  const cizgi = (pts, w = 4.2, r = M, kapali = false) => `<path d="${yol(pts, kapali, s())}" fill="none" stroke="${r}" stroke-width="${w}"/>`;
  const sekil = (pts, dolgu, w = 4.2, kay = [3, 3]) => { const d = yol(pts, true, s()); return `<path d="${d}" fill="${dolgu}" transform="translate(${kay[0]} ${kay[1]})"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${w}"/>`; };
  // düz kenarlı çokgen: köşeler arası eşit aralıklı ara noktalar (Catmull-Rom kenarı şişirmesin)
  const kenarla = (kose, kapali = true, ad = 26) => {
    const out = [], n = kose.length;
    for (let i = 0; i < (kapali ? n : n - 1); i++) {
      const a = kose[i], b = kose[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / ad));
      for (let j = 0; j < m; j++) out.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]);
    }
    if (!kapali) out.push(kose[n - 1]);
    return out;
  };
  return { cizgi, sekil, kenarla };
}
function tuvalYap(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const svgResim = (svg, w, h) => new Promise((ok, red) => {
  const im = new Image(w, h);
  im.onload = () => ok(im);
  im.onerror = () => red(new Error('SVG resmi çizilemedi'));
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
});

// ======================================================================================= KÂĞIT MASA (zemin)
// Masa doodle'ı dünyadaki dikdörtgenin kameradan izdüşümüdür; zemin dokusu ekran uzayındadır (2× çözünürlük).
// 4 kaynama çizimi → 4 tuval; zemin malzemesi gl_FragCoord ile örnekler (iletim geçişinde de aynı: zar onu kırar).
const MS = KUR.masa;
const masaKose = {
  sol: ekran(MS.x0, MS.y0), sag: ekran(MS.x1, MS.y0), sagArka: ekran(MS.x1, MS.y1), solArka: ekran(MS.x0, MS.y1),
  solAlt: ekran(MS.x0, MS.y0, -MS.kalin), sagAlt: ekran(MS.x1, MS.y0, -MS.kalin),
};
// Masa üstünde bir noktanın ekran yeri: u 0 sol → 1 sağ, v 0 ön kenar → 1 arka kenar
const masaNokta = (u, v) => ekran(MS.x0 + (MS.x1 - MS.x0) * u, MS.y0 + (MS.y1 - MS.y0) * v);
const PURUZ = `<filter id="puruz" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>`;
function masaSVG(k) {
  const { sekil, cizgi, kenarla } = araclar(1400, k, 0.9);
  const K = masaKose;
  // ayaklar: ön köşelerden kadrajın dışına
  const ayak = (p, yon) => sekil(kenarla([[p[0] + yon * 6, p[1]], [p[0] + yon * 40, p[1]], [p[0] + yon * 46, H + 80], [p[0] + yon * 14, H + 80]], true, 30), '#cfc9bd', 4.2);
  let s = ayak(K.solAlt, 1) + ayak(K.sagAlt, -1);
  s += sekil(kenarla([K.sol, K.sag, K.sagAlt, K.solAlt]), '#d8d2c7', 4.2);                   // ön yüz (kalınlık)
  s += sekil(kenarla([K.solArka, K.sagArka, K.sag, K.sol]), '#f5f2ec', 4.2);                 // üst yüz: kâğıdın kendisi
  // ön yüzde ahşap/karton lif izi gibi iki kısa iç çizgi (iç detay 3,6)
  const lif = (u0, u1, v) => { const a = [K.sol[0] + (K.sag[0] - K.sol[0]) * u0, K.sol[1] + (K.solAlt[1] - K.sol[1]) * v], b = [K.sol[0] + (K.sag[0] - K.sol[0]) * u1, K.sol[1] + (K.solAlt[1] - K.sol[1]) * v]; return cizgi([a, [(a[0] + b[0]) / 2, a[1] + 1], b], 2.6); };
  s += lif(0.08, 0.2, 0.55) + lif(0.74, 0.84, 0.5);
  return murekkeple(s, 1, 77 + k);
}
async function zeminTuvalleri() {
  const out = [];
  const [mx, my] = ekran(KUR.isikMerkez[0], KUR.isikMerkez[1]);
  for (let k = 0; k < 4; k++) {
    const c = tuvalYap(W * PR, H * PR), g = c.getContext('2d');
    g.scale(PR, PR);
    g.fillStyle = KAGIT; g.fillRect(0, 0, W, H);
    const svg = `<svg xmlns="${NS}" width="${W * PR}" height="${H * PR}" viewBox="0 0 ${W} ${H}"><defs>${PURUZ}</defs><g filter="url(#puruz)">${masaSVG(k)}</g></svg>`;
    g.drawImage(await svgResim(svg, W * PR, H * PR), 0, 0, W, H);
    // ışık havuzu: nesnelerin altında sıcak, kenarlara doğru çok hafif söner (kâğıt düz kalır, ±%3)
    const r = Math.max(W, H) * 0.62, gr = g.createRadialGradient(mx, my, 0, mx, my, r);
    gr.addColorStop(0, 'rgba(255, 248, 234, 0.42)'); gr.addColorStop(0.5, 'rgba(255, 248, 234, 0.08)'); gr.addColorStop(1, 'rgba(90, 76, 58, 0.14)');
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    out.push(c);
  }
  return out;
}
const zeminDoku = new THREE.CanvasTexture(tuvalYap(4, 4));
zeminDoku.colorSpace = THREE.SRGBColorSpace;
zeminDoku.generateMipmaps = false;
zeminDoku.minFilter = THREE.LinearFilter;
const zemin = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.ShaderMaterial({
  uniforms: { harita: { value: zeminDoku }, coz: { value: new THREE.Vector2(W * PR, H * PR) } },
  vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D harita; uniform vec2 coz; void main() { gl_FragColor = texture2D(harita, gl_FragCoord.xy / coz); \n#include <colorspace_fragment>\n }',
}));
zemin.material.toneMapped = false;
sc.add(zemin);
const golgeZemin = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.ShadowMaterial({ color: 0x2b1e14, opacity: 0.26, depthWrite: false }));
golgeZemin.position.z = 0.03;
golgeZemin.receiveShadow = true;
golgeZemin.renderOrder = 1;
sc.add(golgeZemin);
const dekor = [zemin, golgeZemin]; // nesne olmayanlar (maske ve temas geçişinde gizlenir)

// ======================================================================================= 1) ZAR SETİ (zar.js malzemesi + d10)
function d10Geo(r) { // zar.js'ten kopya
  const h = r, U = (a, k) => new THREE.Vector3(Math.cos(k * Math.PI * 2 / 5) * r * 0.9, a, Math.sin(k * Math.PI * 2 / 5) * r * 0.9);
  const L = (a, k) => new THREE.Vector3(Math.cos((k + 0.5) * Math.PI * 2 / 5) * r * 0.9, -a, Math.sin((k + 0.5) * Math.PI * 2 / 5) * r * 0.9);
  const T = new THREE.Vector3(0, h, 0), B = new THREE.Vector3(0, -h, 0);
  const det = (a) => { const e1 = U(a, 0).sub(T), e2 = L(a, 0).sub(T), e3 = U(a, 1).sub(T); return e1.dot(e2.clone().cross(e3)); };
  let lo = 0, hi = h * 0.9;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (det(lo) * det(m) <= 0) ? (hi = m) : (lo = m); }
  const a = (lo + hi) / 2, tri = [];
  for (let k = 0; k < 5; k++) tri.push([T, U(a, k), L(a, k)], [T, L(a, k), U(a, k + 1)], [B, L(a, k), U(a, k + 1)], [B, U(a, k + 1), L(a, k + 1)]);
  const pos = [];
  for (const t of tri) {
    const n = t[1].clone().sub(t[0]).cross(t[2].clone().sub(t[0])), c = t[0].clone().add(t[1]).add(t[2]);
    for (const v of (n.dot(c) < 0 ? [t[0], t[2], t[1]] : t)) pos.push(v.x, v.y, v.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}
const ZAR = [
  { ad: 'd4', renk: '#e8a33d', no: null }, { ad: 'd6', renk: '#2fa59a', no: '6' }, { ad: 'd8', renk: '#7f5bd6', no: '8' },
  { ad: 'd10', renk: '#e0607e', no: '10' }, { ad: 'd12', renk: '#3f7fd6', no: '12' }, { ad: 'd20', renk: '#d4621f', no: '20' },
];
// Bir yüzünü masaya koy: o yüzün normali −Z olur, en alt nokta z=0. Üst yüzün merkezi ve çevrel yarıçapı döner.
function yuzUstuneKoy(g, secim) {
  g = g.index ? g.toNonIndexed() : g;
  g.computeVertexNormals();
  const n = g.attributes.normal, p = g.attributes.position;
  const yuzler = [];
  for (let i = 0; i < p.count; i += 3) yuzler.push(new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i)));
  const alt = yuzler[secim % yuzler.length];
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(alt, new THREE.Vector3(0, 0, -1)));
  g.computeBoundingBox();
  g.translate(0, 0, -g.boundingBox.min.z);
  g.computeVertexNormals();
  // üst yüz: normali +Z olan üçgenler
  const ust = [];
  for (let i = 0; i < p.count; i += 3) if (g.attributes.normal.getZ(i) > 0.999) for (let j = 0; j < 3; j++) ust.push(new THREE.Vector3().fromBufferAttribute(g.attributes.position, i + j));
  if (!ust.length) return { g, ust: null };
  const c = ust.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / ust.length);
  const rc = Math.max(...ust.map((v) => v.distanceTo(c)));
  return { g, ust: { c, rc } };
}
function sayiDokusu(s) {
  const c = tuvalYap(256, 256), x = c.getContext('2d');
  x.fillStyle = '#f6f1e6'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = `700 ${s.length > 1 ? 118 : 150}px "Schibsted Grotesk", sans-serif`;
  const m = x.measureText(s), y = 128 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  x.fillText(s, 128, y);
  if (s === '6') x.fillRect(84, y + 18, 88, 12);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const lekeDoku = (() => {
  const c = tuvalYap(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 2, 128, 128, 126);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.62)'); g.addColorStop(0.7, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
// Kostik: odaklanmış ışık, keskin çekirdek + kısa sönüm (yumuşak "parlama" değil)
const kostikDoku = (() => {
  const c = tuvalYap(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 120);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.28, 'rgba(255,255,255,0.9)'); g.addColorStop(0.45, 'rgba(255,255,255,0.35)'); g.addColorStop(0.75, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const zarlar = [], zarLekeleri = [], sayilar = [];
ZAR.forEach((z, i) => {
  const r = 12;
  const ham = { d4: new THREE.TetrahedronGeometry(r * 1.2), d6: new RoundedBoxGeometry(r * 1.32, r * 1.32, r * 1.32, 4, r * 0.14), d8: new THREE.OctahedronGeometry(r * 1.08), d10: d10Geo(r), d12: new THREE.DodecahedronGeometry(r * 1.02), d20: new THREE.IcosahedronGeometry(r * 1.06) }[z.ad];
  let g, ust = null;
  if (z.ad === 'd6') { g = ham; g.translate(0, 0, r * 0.66); ust = { c: new THREE.Vector3(0, 0, r * 1.32), rc: r * 0.66 }; }
  else ({ g, ust } = yuzUstuneKoy(ham, [0, 0, 3, 0, 5, 7][i]));
  const renk = new THREE.Color(z.renk);
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff).lerp(renk, 0.08), transmission: 1, thickness: r * 1.7, ior: 1.6, roughness: 0.015, metalness: 0,
    attenuationColor: renk, attenuationDistance: r * 1.1, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 2.2, specularIntensity: 1, flatShading: z.ad !== 'd6', side: THREE.DoubleSide,
  }));
  const [x, y, rz] = KUR.zar[i];
  m.position.set(x, y, 0);
  m.rotation.z = rz * D2R;
  sc.add(m); zarlar.push(m);
  if (ust && z.no) {
    const s = ust.rc * (z.no.length > 1 ? 1.05 : 0.95);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: sayiDokusu(z.no), transparent: true, roughness: 0.45, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    d.position.copy(ust.c).add(new THREE.Vector3(0, 0, 0.05));
    m.add(d); sayilar.push(d);
  }
  // Renkli gölge (zarın rengini taşır, ışıktan uzağa uzar) + içinde parlak kostik çekirdek (ekleyerek karışır)
  const yon = Math.atan2(ISIK_YON.y, ISIK_YON.x);
  const temas = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), new THREE.MeshBasicMaterial({ map: lekeDoku, color: '#20160e', transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false }));
  temas.position.set(x, y, 0.05); temas.renderOrder = 2;
  const golge = new THREE.Mesh(new THREE.PlaneGeometry(r * 3.3, r * 2.0), new THREE.MeshBasicMaterial({ map: lekeDoku, color: renk.clone().lerp(new THREE.Color('#1d140c'), 0.35), transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }));
  golge.position.set(x + ISIK_YON.x * r * 0.8, y + ISIK_YON.y * r * 0.8, 0.06);
  golge.rotation.z = yon;
  const kostik = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.95, r * 0.6), new THREE.MeshBasicMaterial({ map: kostikDoku, color: renk.clone().lerp(new THREE.Color('#fff4dc'), 0.15), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  kostik.position.set(x + ISIK_YON.x * r * 1.15, y + ISIK_YON.y * r * 1.15, 0.08);
  kostik.rotation.z = yon;
  golge.renderOrder = 2; kostik.renderOrder = 3;
  sc.add(temas, golge, kostik); zarLekeleri.push(temas, golge, kostik);
});

// ======================================================================================= 2) ORGANİZER (Gridfinity 2×2, mat PLA)
// Ölçüler açık standart (tools/bin GF): 42 mm ızgara, 0,5 boşluk, köşe 3,75, ayak 4,75, birim yükseklik 7. Düz three.js.
const PLA = new THREE.MeshPhysicalMaterial({ color: '#e0662b', roughness: 0.58, metalness: 0, sheen: 0.35, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffd2b0'), envMapIntensity: 0.9 });
const CINKO = new THREE.MeshStandardMaterial({ color: '#a7adb4', metalness: 1, roughness: 0.2, envMapIntensity: 1.45 });
const PIRINC = new THREE.MeshStandardMaterial({ color: '#d6ab52', metalness: 1, roughness: 0.28, envMapIntensity: 1.2 });
function yuvarlakDikd(w, d, r, yolMu = false) {
  const s = yolMu ? new THREE.Path() : new THREE.Shape();
  const x0 = -w / 2, y0 = -d / 2, x1 = w / 2, y1 = d / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
function organizer() {
  const G = new THREE.Group();
  const A = 83.5, R = 3.75, t = 1.5, AYAK = 4.75, TABAN = 1.3, H = 3 * 7, bv = 0.7;
  const mesh = (g, m = PLA) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; G.add(x); return x; };
  // ayaklar (2×2), pahlı
  for (const ix of [-1, 1]) for (const iy of [-1, 1]) {
    const g = new THREE.ExtrudeGeometry(yuvarlakDikd(37.6, 37.6, 2.4), { depth: AYAK - 1.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 1.4, bevelSegments: 2, curveSegments: 8 });
    g.translate(ix * 21, iy * 21, 0.8);
    mesh(g);
  }
  // duvar halkası (üst kenarı yuvarlatılmış) ve taban
  const halka = yuvarlakDikd(A - 2 * bv, A - 2 * bv, R - bv);
  halka.holes.push(yuvarlakDikd(A - 2 * t + 2 * bv, A - 2 * t + 2 * bv, R - t + bv, true));
  const duvar = new THREE.ExtrudeGeometry(halka, { depth: H - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 4, curveSegments: 14 });
  duvar.translate(0, 0, AYAK + bv);
  mesh(duvar);
  const taban = new THREE.ExtrudeGeometry(yuvarlakDikd(A - t, A - t, R - t / 2), { depth: TABAN, bevelEnabled: false, curveSegments: 10 });
  taban.translate(0, 0, AYAK);
  mesh(taban);
  // bölmeler: arkada uzun bölme (vidalar), önde iki bölme (somun, pul)
  const ic = A / 2 - t, zT = AYAK + TABAN, hB = H - TABAN - 2.6;
  const bolme = (w, d, x, y) => { const g = new RoundedBoxGeometry(w, d, hB, 3, 0.55); g.translate(x, y, zT + hB / 2); mesh(g); };
  const yB = 2;
  bolme(2 * ic, 1.2, 0, yB);
  bolme(1.2, ic + yB, 0, (-ic + yB) / 2);
  // --- içerik: düzenli vidalar (yatık, iki sıra iç içe), somunlar (ızgara + küçük yığın), pirinç pullar (yığınlar)
  const r = rng(905);
  const vida = fastener('pan', { len: 18, dia: 3.3 });
  const vidalar = [];
  const sira = (n, yBas, yon, x0) => {
    for (let i = 0; i < n; i++) {
      const g = vida.geo.clone();
      g.rotateX(-Math.PI / 2 * yon);                         // eksen ±Y; uç y=0
      const egim = Math.atan2(vida.r - vida.sr * 0.9, vida.len - 2);
      g.translate(0, 0, vida.r);
      // baş tabanı çevresinde eğ: uç masaya değsin
      const pv = yon * (vida.len - 1.5);
      g.translate(0, -pv, -0); g.rotateX(yon * egim); g.translate(0, pv, 0);
      g.rotateZ((r() - 0.5) * 0.06);
      g.translate(x0 + i * 8.6 + (r() - 0.5) * 0.4, yBas + (r() - 0.5) * 0.6, zT);
      vidalar.push(g);
    }
  };
  // iki sıra: arkadakinin başı arka duvarda, öndekinin başı bölmede; uçlar yarım adım kaydırılıp iç içe geçer
  sira(9, ic - 1.6 - 18, 1, -34.4);
  sira(8, yB + 2.4 + 18, -1, -30.1);
  mesh(merge(vidalar), CINKO);
  const somun = nutGeometry(9, 4.2, 2.7);
  const somunlar = [];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const g = somun.clone(); g.rotateZ(r() * Math.PI); g.translate(-ic / 2 - 0.6 + (a - 1) * 11.6 + (r() - 0.5), -ic / 2 + yB / 2 - 0.6 + (b - 1) * 11.6 + (r() - 0.5), zT);
    somunlar.push(g);
  }
  for (const [a, b] of [[1, 1], [2, 0]]) { const g = somun.clone(); g.rotateZ(r() * 2); g.translate(-ic / 2 - 0.6 + (a - 1) * 11.6 + 0.4, -ic / 2 + yB / 2 - 0.6 + (b - 1) * 11.6 - 0.3, zT + 4.2); somunlar.push(g); }
  mesh(merge(somunlar), CINKO);
  const pul = fastener('washer', { dia: 5.2 });
  const pullar = [];
  const yigin = (x, y, n) => { for (let j = 0; j < n; j++) { const g = pul.geo.clone(); g.translate(x + (r() - 0.5) * 0.9, y + (r() - 0.5) * 0.9, zT + j * pul.len); pullar.push(g); } };
  yigin(ic / 2 + 0.6 - 8, -ic / 2 + yB / 2 + 7, 7); yigin(ic / 2 + 0.6 + 8.5, -ic / 2 + yB / 2 + 6, 5); yigin(ic / 2 + 0.6 - 6, -ic / 2 + yB / 2 - 9, 4); yigin(ic / 2 + 0.6 + 9, -ic / 2 + yB / 2 - 10, 6);
  mesh(merge(pullar), PIRINC);
  return G;
}
const org = organizer();
org.position.set(KUR.organizer[0], KUR.organizer[1], 0);
org.rotation.z = KUR.organizer[2] * D2R;
sc.add(org);
// Sekme ışığı: turuncu PLA duvarlarından kâğıda düşen çok hafif renk (fotoğraftaki gibi; yalnız nesnenin çevresinde)
{
  const sekme = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ map: lekeDoku, color: '#e0662b', transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
  sekme.position.set(KUR.organizer[0], KUR.organizer[1], 0.04); sekme.renderOrder = 1;
  sc.add(sekme); zarLekeleri.push(sekme);
}

// ======================================================================================= 3) BIGGIE MİNYATÜRÜ (karakter.glb, boyalı reçine)
const FIGUR = new THREE.Group();
FIGUR.position.set(KUR.figur[0], KUR.figur[1], 0);
FIGUR.rotation.z = KUR.figur[2] * D2R;
sc.add(FIGUR);
async function figurKur() {
  const KAIDE_H = 3.6, KAIDE_R = 17, BOYU = 76;
  const kaide = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [KAIDE_R - 0.5, 0], [KAIDE_R, 0.5], [KAIDE_R, KAIDE_H - 0.6], [KAIDE_R - 0.7, KAIDE_H], [0, KAIDE_H]].map(([a, b]) => new THREE.Vector2(a, b)), 72).rotateX(Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: '#242226', roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 1 }));
  kaide.castShadow = kaide.receiveShadow = true;
  FIGUR.add(kaide);
  const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/'; // core/oda-karakter.js ile aynı
  const gltf = await new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO)).loadAsync(new URL('../../../assets/oda/karakter.glb', import.meta.url).href);
  const kok = gltf.scene;
  const klip = gltf.animations.find((a) => a.name === (q.get('poz') || 'dans_lahana')) || gltf.animations[0];
  const mixer = new THREE.AnimationMixer(kok);
  mixer.clipAction(klip).play();
  mixer.setTime(+(q.get('pozt') || 0.8));
  kok.updateMatrixWorld(true);
  // boyalı reçine: renkler korunur, saten vernik (hafif parlak)
  kok.traverse((o) => {
    if (!o.isMesh) return;
    const m0 = o.material;
    o.material = new THREE.MeshPhysicalMaterial({
      color: m0.color.clone(), roughness: Math.min(0.62, Math.max(0.3, (m0.roughness ?? 0.6) * 0.72)), metalness: 0,
      clearcoat: 0.32, clearcoatRoughness: 0.32, envMapIntensity: 1.05, side: m0.side,
    });
    o.castShadow = o.receiveShadow = true;
    o.frustumCulled = false;
  });
  // deri pozuyla sınır kutusu
  const kutu = new THREE.Box3();
  kok.traverse((o) => {
    if (!o.isMesh) return;
    if (o.isSkinnedMesh) { o.computeBoundingBox(); kutu.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); }
    else { o.geometry.computeBoundingBox(); kutu.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); }
  });
  const boy = kutu.max.z - kutu.min.z, s = (BOYU - KAIDE_H) / boy;
  const ic = new THREE.Group();
  ic.add(kok);
  kok.position.set(-(kutu.min.x + kutu.max.x) / 2, -(kutu.min.y + kutu.max.y) / 2, -kutu.min.z);
  ic.scale.setScalar(s);
  ic.position.z = KAIDE_H;
  FIGUR.add(ic);
  FIGUR.userData = { boy, s, kutu };
}

// ======================================================================================= 4) MERMER EPOKSİ SAKSI (tools/vase)
// Profil plan #19'daki son biçim (S3: bel + yivli ağız) mm'ye çevrildi; vaseMesh aracın kendi ağı. Profil fonksiyonu
// araç modülünün PROFILES nesnesine çalışma anında eklenir (dosya değişmez).
const SK = { taban: '#e8e2d8', damar: '#5f5a53', altinDamar: '#c39a3e' }; // film.js ctx.SAKSI
const bell = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
const yumus = (a, b, u) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
const SAKSI = { height: 86, r0: 25 };
PROFILES.oktosS3 = (u) => (4.1 * bell(u, 0.28, 0.22) - 4.8 * bell(u, 0.64, 0.14) + 8.9 * yumus(0.72, 1, u) ** 2) / SAKSI.r0;
const SAKSI_AYAR = {
  color: SK.taban, height: SAKSI.height, dBottom: SAKSI.r0 * 2, dTop: SAKSI.r0 * 2, style: 'hollow', wall: 2.6, base: 3,
  profile: 'oktosS3', intensity: 1, waveCycles: 2, kind: 'poly', sides: SIDES_CIRCLE, round: 0, depth: 0.25, aspect: 0.7, rotate: 0,
  blendTop: false, topKind: 'poly', topSides: SIDES_CIRCLE, twistOn: false, twist: 0, twS: 0, twE: 100,
  ribsOn: true, ribCount: 14, ribDepth: 2.6, ribStyle: 'round', ribHelix: 0, ribS: 70, ribE: 100, ribF: 12,
  waveOn: false, waveAmp: 0, waveN: 8, wvS: 0, wvE: 100, wvF: 5, noiseOn: false, noiseAmp: 0, noiseScale: 3, noiseSeed: 7, nzS: 0, nzE: 100, nzF: 10,
  flare: 0, flareZone: 15, ruffleN: 0, ruffleDepth: 0, quality: 'fine',
};
// Mermer: yatayda dikişsiz (periyodik gürültü), damarlar çapraz akar; altın damar ayrı haritada metal.
function mermerDokulari() {
  const w = 1024, h = 512, R = rng(2026);
  const LAT = 256, lat = Float32Array.from({ length: LAT * LAT }, () => R());
  const n2 = (x, y, p) => { // x yönünde p hücre periyotlu değer gürültüsü
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const X0 = ((xi % p) + p) % p, X1 = (X0 + 1) % p, Y0 = ((yi % LAT) + LAT) % LAT, Y1 = (Y0 + 1) % LAT;
    const a = lat[Y0 * LAT + X0], b = lat[Y0 * LAT + X1], c = lat[Y1 * LAT + X0], d = lat[Y1 * LAT + X1];
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
  };
  const fbm = (u, v, p0, o = 5) => { let s = 0, a = 0.5, t = 0; for (let i = 0; i < o; i++) { const p = p0 << i; s += a * n2(u * p, v * p, p); t += a; a *= 0.5; } return s / t; };
  const renk = tuvalYap(w, h), mr = tuvalYap(w, h);
  const ri = renk.getContext('2d').createImageData(w, h), mi = mr.getContext('2d').createImageData(w, h);
  const T = new THREE.Color(SK.taban), Dm = new THREE.Color(SK.damar), Au = new THREE.Color(SK.altinDamar), Su = new THREE.Color('#cfc8bd');
  const hat = (x, gen) => { const a = Math.abs(x); return a < gen ? 1 - (a / gen) ** 2 : 0; };
  for (let j = 0; j < h; j++) {
    const v = j / h;
    for (let i = 0; i < w; i++) {
      const u = i / w;
      const bulut = fbm(u, v * 0.5, 4);
      const wp = fbm(u, v * 0.5 + 3.1, 3);
      // ana damarlar: sin(2πku + cv + çarpıtma)
      const f1 = Math.sin(2 * Math.PI * 2 * u + 7.5 * v + 6.2 * wp + 2.0 * bulut);
      const f2 = Math.sin(2 * Math.PI * 3 * u - 10 * v + 7 * fbm(u, v * 0.5 + 7.7, 4));
      const f3 = Math.sin(2 * Math.PI * 1 * u + 4.2 * v + 5 * fbm(u, v * 0.5 + 11.3, 3) + 1.3);
      // epoksi mermer: geniş dumanlı gri damar + içinde ince koyu çekirdek (yer yer kesik), seyrek ince gri damarlar,
      // tek sürekli altın damar; zemin hafif bulutlu
      const kal = 0.035 + 0.05 * fbm(u, v * 0.5 + 5.5, 3);
      const kes = Math.min(1, Math.max(0, (fbm(u, v * 0.5 + 21, 3) - 0.38) * 3.2));
      const duman = hat(f1, kal * 6) * 0.3, cekirdek = hat(f1, kal * 0.5) * 0.85 * kes, d2 = hat(f2, 0.018) * 0.3 * kes;
      const au = hat(f3, 0.021);
      const c = T.clone().multiplyScalar(1.015 + 0.035 * (bulut - 0.5)).lerp(Su, 0.18 * Math.max(0, wp - 0.5));
      c.lerp(Su.clone().multiplyScalar(0.86), duman); c.lerp(Dm, Math.min(1, cekirdek + d2));
      c.lerp(Au, au);
      const k = (j * w + i) * 4;
      ri.data[k] = Math.round(Math.min(1, c.r) * 255); ri.data[k + 1] = Math.round(Math.min(1, c.g) * 255); ri.data[k + 2] = Math.round(Math.min(1, c.b) * 255); ri.data[k + 3] = 255;
      mi.data[k] = 255; mi.data[k + 1] = Math.round((0.16 + 0.12 * au) * 255); mi.data[k + 2] = Math.round(au * 255); mi.data[k + 3] = 255;
    }
  }
  renk.getContext('2d').putImageData(ri, 0, 0); mr.getContext('2d').putImageData(mi, 0, 0);
  const t1 = new THREE.CanvasTexture(renk), t2 = new THREE.CanvasTexture(mr);
  t1.colorSpace = THREE.SRGBColorSpace;
  for (const t of [t1, t2]) { t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; }
  return { renk: t1, mr: t2 };
}
function saksi() {
  const G = new THREE.Group();
  const { positions, indices } = vaseMesh(SAKSI_AYAR);
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(indices, 1));
  g.computeVertexNormals();
  g = g.toNonIndexed();
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i += 3) {
    const us = [0, 1, 2].map((j) => Math.atan2(p.getY(i + j), p.getX(i + j)) / (2 * Math.PI) + 0.5);
    if (Math.max(...us) - Math.min(...us) > 0.5) for (let j = 0; j < 3; j++) if (us[j] < 0.5) us[j] += 1;
    for (let j = 0; j < 3; j++) { uv[(i + j) * 2] = us[j]; uv[(i + j) * 2 + 1] = p.getZ(i + j) / SAKSI.height; }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const d = mermerDokulari();
  const mat = new THREE.MeshPhysicalMaterial({ map: d.renk, roughnessMap: d.mr, metalnessMap: d.mr, roughness: 1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.05 });
  const govde = new THREE.Mesh(g, mat);
  govde.castShadow = govde.receiveShadow = true;
  G.add(govde);
  // toprak + ekevarya (sukulent) rozeti
  const rf = radiusFn(SAKSI_AYAR), zT = SAKSI.height - 8;
  let rIc = 1e9;
  for (let i = 0; i < 48; i++) rIc = Math.min(rIc, rf(i / 48 * Math.PI * 2, zT / SAKSI.height));
  rIc -= SAKSI_AYAR.wall + 0.4;
  const toprak = new THREE.Mesh(new THREE.CircleGeometry(rIc, 64), new THREE.MeshStandardMaterial({ color: '#3b2c22', roughness: 1, bumpMap: gurultuDoku(), bumpScale: 0.8 }));
  toprak.position.z = zT; toprak.receiveShadow = true;
  G.add(toprak);
  const roz = rozet(rIc * 1.02);
  roz.position.z = zT - 1;
  G.add(roz);
  return G;
}
function gurultuDoku() {
  const c = tuvalYap(256, 256), x = c.getContext('2d'), im = x.createImageData(256, 256), R = rng(55);
  for (let i = 0; i < 256 * 256; i++) { const v = 90 + R() * 140; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
// Ekevarya rozeti: üç halka etli yaprak; gövdede soluk mavi-yeşil, uçta pembe kızarıklık (köşe rengi), tozlu parlaklık (sheen)
function rozet(R0) {
  const G = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, sheen: 0.7, sheenRoughness: 0.75, sheenColor: new THREE.Color('#f2f6f0'), envMapIntensity: 0.9 });
  const c0 = new THREE.Color('#b8c9a8'), c1 = new THREE.Color('#86a99e'), c2 = new THREE.Color('#cf8f86');
  const yaprak = (len, en, kal) => {
    const g = new THREE.SphereGeometry(1, 22, 14);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const t = (x + 1) / 2;                                            // 0 dip, 1 uç
      const gen = en * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(t, 0.62))), 0.85) * (1 - 0.1 * t) + 0.3;
      const kalin = kal * (1 - 0.55 * t) + 0.3;
      let Z = z * kalin - 0.42 * kal * (y * y) * (z > 0 ? 1 : 0.4);     // üst yüz hafif çanak
      Z += len * 0.2 * t * t;                                           // uca doğru yukarı kıvrılır
      p.setXYZ(i, t * len, y * gen, Z);
      const c = t < 0.6 ? c0.clone().lerp(c1, t / 0.6) : c1.clone().lerp(c2, ((t - 0.6) / 0.4) ** 1.6);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  };
  const halkalar = [[13, R0 * 0.98, R0 * 0.55, 3.8, 18, 0], [9, R0 * 0.78, R0 * 0.48, 3.6, 34, 0.5], [6, R0 * 0.52, R0 * 0.4, 3.2, 54, 0.2], [4, R0 * 0.3, R0 * 0.3, 2.6, 70, 0.7]];
  const r = rng(808);
  for (const [n, len, en, kal, egim, faz] of halkalar) {
    for (let i = 0; i < n; i++) {
      const g = yaprak(len * (0.92 + r() * 0.12), en * 0.5, kal);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = m.receiveShadow = true;
      const a = (i + faz + (r() - 0.5) * 0.2) / n * Math.PI * 2;
      m.rotation.order = 'ZYX';
      m.rotation.set(0, -(egim + (r() - 0.5) * 6) * D2R, a);
      m.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 1.5);
      G.add(m);
    }
  }
  return G;
}
const SAKSI_G = saksi();
SAKSI_G.position.set(KUR.saksi[0], KUR.saksi[1], 0);
SAKSI_G.rotation.z = KUR.saksi[2] * D2R;
sc.add(SAKSI_G);

// ======================================================================================= TEMAS GÖLGESİ (yumuşak, altta)
// three.js webgl_shadow_contact örneğinin Z-yukarı uyarlaması: nesnelerin alttan derinliği → iki bulanıklık → zemine.
const TEMAS = (() => {
  const en = (MS.x1 - MS.x0) + 60, boy = (MS.y1 - MS.y0) + 60, yuk = 34;
  const rt = new THREE.WebGLRenderTarget(1024, 1024), rtB = new THREE.WebGLRenderTarget(1024, 1024);
  rt.texture.generateMipmaps = rtB.texture.generateMipmaps = false;
  const grup = new THREE.Group();
  grup.position.set((MS.x0 + MS.x1) / 2, (MS.y0 + MS.y1) / 2, 0);
  const duz = new THREE.PlaneGeometry(en, boy);
  const plan = new THREE.Mesh(duz, new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
  plan.position.z = 0.05; plan.scale.y = -1; plan.renderOrder = 1;
  const bul = new THREE.Mesh(duz, undefined); bul.visible = false; bul.position.z = yuk / 2;
  const kamT = new THREE.OrthographicCamera(-en / 2, en / 2, boy / 2, -boy / 2, 0, yuk);
  kamT.rotation.x = Math.PI; // yukarı bakar
  grup.add(plan, bul, kamT);
  sc.add(grup);
  const derin = new THREE.MeshDepthMaterial();
  derin.userData.koyu = { value: 1.6 };
  derin.onBeforeCompile = (sh) => {
    sh.uniforms.koyu = derin.userData.koyu;
    sh.fragmentShader = 'uniform float koyu;\n' + sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.024, 0.013, 0.007 ), ( 1.0 - fragCoordZ ) * koyu );');
  };
  derin.depthTest = derin.depthWrite = false;
  derin.side = THREE.DoubleSide;
  const yatay = new THREE.ShaderMaterial(HorizontalBlurShader), dikey = new THREE.ShaderMaterial(VerticalBlurShader);
  yatay.depthTest = dikey.depthTest = false; yatay.side = dikey.side = THREE.DoubleSide;
  const bulandir = (m) => {
    bul.visible = true;
    bul.material = yatay; yatay.uniforms.tDiffuse.value = rt.texture; yatay.uniforms.h.value = m / 1024;
    renderer.setRenderTarget(rtB); renderer.render(bul, kamT);
    bul.material = dikey; dikey.uniforms.tDiffuse.value = rtB.texture; dikey.uniforms.v.value = m / 1024;
    renderer.setRenderTarget(rt); renderer.render(bul, kamT);
    bul.visible = false;
  };
  return {
    plan,
    hesapla() {
      const gizli = [...dekor, ...zarlar, ...zarLekeleri, plan].filter((o) => o.visible);
      gizli.forEach((o) => { o.visible = false; });
      const ca = renderer.getClearAlpha(), cc = renderer.getClearColor(new THREE.Color());
      renderer.setClearColor(0x000000, 0);
      sc.overrideMaterial = derin;
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(sc, kamT);
      sc.overrideMaterial = null;
      bulandir(3.2); bulandir(1.4);
      renderer.setRenderTarget(null);
      renderer.setClearColor(cc, ca);
      gizli.forEach((o) => { o.visible = true; });
    },
  };
})();

// ======================================================================================= NESNE MASKESİ (gren için)
// Gerçek nesnelerin kaplama maskesi (2× çözünürlükte, ortalanarak 1×): gren kâğıt dünyasında kalır.
const maske = { beyaz: tuvalYap(W, H), siyah: tuvalYap(W, H) };
function maskeHesapla() {
  const w2 = W * 2, h2 = H * 2;
  const rt = new THREE.WebGLRenderTarget(w2, h2);
  const gizli = [...dekor, ...zarLekeleri, ...sayilar, TEMAS.plan].filter((o) => o.visible);
  gizli.forEach((o) => { o.visible = false; });
  const beyazMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  sc.overrideMaterial = beyazMat;
  const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);
  renderer.setRenderTarget(rt); renderer.clear(); renderer.render(sc, kam);
  const buf = new Uint8Array(w2 * h2 * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, w2, h2, buf);
  renderer.setRenderTarget(null); renderer.setClearColor(cc, ca);
  sc.overrideMaterial = null;
  gizli.forEach((o) => { o.visible = true; });
  rt.dispose();
  const ib = maske.beyaz.getContext('2d').createImageData(W, H), is = maske.siyah.getContext('2d').createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let a = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) a += buf[((h2 - 1 - (2 * y + dy)) * w2 + 2 * x + dx) * 4 + 3];
    const k = (y * W + x) * 4, al = a / 4;
    ib.data[k] = ib.data[k + 1] = ib.data[k + 2] = 255; ib.data[k + 3] = al;
    is.data[k] = is.data[k + 1] = is.data[k + 2] = 0; is.data[k + 3] = al;
  }
  maske.beyaz.getContext('2d').putImageData(ib, 0, 0); maske.siyah.getContext('2d').putImageData(is, 0, 0);
}
let gren = null; // { koyu, acik, koyuKopya, acikKopya }
function grenKur() {
  if (q.get('kagit') === '0') return;
  kagitKur(sahne);
  const [koyu, acik] = [...sahne.querySelectorAll(':scope > canvas.kagit-katman')];
  const kopya = (c) => { const k = tuvalYap(W, H); k.getContext('2d').drawImage(c, 0, 0); return k; };
  gren = { koyu, acik, koyuKopya: kopya(koyu), acikKopya: kopya(acik) };
}
function grenGuncelle(m) { // m: kamera itme matrisi (a, b, c, d, e, f)
  if (!gren) return;
  for (const [c, kop, msk] of [[gren.koyu, gren.koyuKopya, maske.beyaz], [gren.acik, gren.acikKopya, maske.siyah]]) {
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.drawImage(kop, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.setTransform(...m); g.drawImage(msk, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  }
}

// ======================================================================================= KARAKTERLER (doodle, MONO gri)
// film.js KISI kopyası (dört ana karakter)
const KISI = {
  A: { tohum: 7, kadin: true, sacStil: 'kivircik', yas: 'genc', cil: true, gozluk: null, sakal: null, kupe: true, ten: 4, sac: 0, giysi: 3, yaka: 'kapusonlu' },
  B: { tohum: 41, kadin: true, sacStil: 'topuz', yas: 'yasli', sac: 5, ten: 1, gozluk: 'kare', kalem: true, sakal: null, kupe: false, yaka: 'gomlek', giysi: 0 },
  C: { tohum: 52, kadin: false, sacStil: 'kisa', yas: 'orta', sac: 0, ten: 6, sakal: 'sakal', kulaklik: true, gozluk: null, kupe: false, yaka: 'kapusonlu', giysi: 5, yuzEn: 68 },
  D: { tohum: 63, kadin: true, sacStil: 'basortusu', yas: 'orta', ten: 3, ortu: 1, ceket: true, yaka: 'gomlek', giysi: 5, gozluk: null, sakal: null, kupe: false },
};
const P = Object.fromEntries(Object.entries(KISI).map(([a, v]) => [a, rastgeleKisi(v.tohum, v)]));
P.B2 = { ...P.B, gozluk: null }; // B gözlüğünü alnına itti: yüzde gözlük yok, alında ayrı çizilir
const EB = 116; // el boyu (kutu birimi), kol.js önerisi
// Ekran noktası → kişinin yerel (insan.js kutu) birimi. Kişi dönüşümü: translate(ex,ey) rotate(r) scale(S) translate(-200,-GOZ_Y)
const yerele = (f, [x, y]) => { const a = -f.r * D2R, dx = (x - f.ex) / f.S, dy = (y - f.ey) / f.S; return [200 + dx * Math.cos(a) - dy * Math.sin(a), GOZ_Y + dx * Math.sin(a) + dy * Math.cos(a)]; };
// Gövde uzatması: insan.js gövdesi 610'da biter; kadrajın altına dek sür (giysi dolgusu + yan konturlar, govdeKes ile süreklilik)
function uzanti(p, gogus, k, ceket) {
  const { sekil, cizgi } = araclar(p.tohum + 900, k, 0.6);
  const x0 = 200 - gogus - 9, x1 = 200 + gogus + 9, dip = 1500, g = MONO.giysi[p.giysi];
  let s = `<path d="M${x0 + 1} 598 L${x1 - 1} 598 L${x1 + 14} ${dip} L${x0 - 14} ${dip} Z" fill="${g}" transform="translate(3 3)"/>`;
  s += cizgi([[x0, 674], [x0 - 3, 900], [x0 - 9, 1200], [x0 - 14, dip]]) + cizgi([[x1, 674], [x1 + 3, 900], [x1 + 9, 1200], [x1 + 14, dip]]);
  if (ceket) s += cizgi([[192, 604], [193, 800], [195, dip]], 4.2) + cizgi([[208, 604], [207, 800], [205, dip]], 4.2);
  void sekil;
  return s;
}
function figur(f, k) {
  const p = f.p;
  const gogus = f.gogus ?? 108, kalinlik = f.kalinlik ?? 64;
  const G = govdeKes(p, { id: `g${f.ad}${k}`, kaynama: k, gogus, tohum: p.tohum, sol: f.solKol !== false, sag: f.sagKol !== false });
  const bas = stilKisi(f.n, { p, kaynama: k, ifade: f.ifade, bakis: f.bakis, S: f.S, katmanIzi: false });
  const o = omuzlar(p, { kalinlik });
  const ortak = { giysi: MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik, kaynama: k, golge: { klip: G.golgeKlipUrl } };
  const yer = (pt) => yerele(f, pt);
  const ic = (f.arka ? murekkeple(f.arka(yer, k), f.S, f.n + 1) : '')
    + G.tanim + `<g ${G.klip}>${bas}</g>`
    + murekkeple(uzanti(p, gogus, k, p.ceket) + G.kontur, f.S, f.n + 2)
    + murekkeple(f.on ? f.on(yer, k) : '', f.S, f.n + 3)
    + murekkeple(f.kollar(o, ortak, yer, k), f.S, f.n + 4)
    + murekkeple(f.ust ? f.ust(yer, k) : '', f.S, f.n + 5);
  return `<g transform="translate(${yuvarla(f.ex)} ${yuvarla(f.ey)}) rotate(${f.r}) scale(${f.S}) translate(-200 ${-GOZ_Y})">${ic}</g>`;
}
// Dirsek: iki IK çözümünden alttakini seç (dirsek sarkar; kol "boru" gibi dikilmez)
const dirsekSec = (omuz, bilek, ust = 160, alt = 150) => { const a = kolIK(omuz, bilek, ust, alt, 1), b = kolIK(omuz, bilek, ust, alt, -1); return a[1] >= b[1] ? a : b; };
const aciDer = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;
// Masa üstüne düz basan el: avuç merkezi hedefte, parmaklar kolun doğrultusunda masanın içine
function masadaEl(o, ortak, yer, hedefEkran, { yon, tohum, sapma = 0, kisalma = 0.72 }) {
  const omuz = yon < 0 ? o.sol : o.sag, hedef = yer(hedefEkran);
  const elAci = aciDer(omuz, hedef) + sapma, basparmak = yon < 0 ? 1 : -1;
  const bilek = bilekBul({ el: 'dayanma', hedef, elAci, elBoy: EB, basparmak, kisalma, ad: 'avuc' });
  return kolSVG({ ...ortak, omuz, dirsek: dirsekSec(omuz, bilek), bilek, el: 'dayanma', elAci, elBoy: EB, basparmak, kisalma, taraf: yon < 0 ? 'sol' : 'sag', tohum });
}
// Sarkan kol: el kadrajın altında kalır
const sarkan = (o, ortak, yon, tohum) => { const om = yon < 0 ? o.sol : o.sag; return kolSVG({ ...ortak, omuz: om, dirsek: [om[0] + yon * 14, om[1] + 160], bilek: [om[0] + yon * 6, om[1] + 312], el: 'acik', elAci: 90, elBoy: EB, taraf: yon < 0 ? 'sol' : 'sag', tohum }); };
// B'nin alnındaki gözlük (kare çerçeve, yukarı itilmiş: camlar basık, saplar saça girer)
function alinGozlugu(k) {
  const { sekil, cizgi } = araclar(4101, k, 0.8);
  const y = GOZ_Y - 58, gx = 28;
  let s = '';
  for (const yon of [-1, 1]) s += sekil(oval(200 + yon * gx, y, 19, 11, 0, 360, 14, 3.4), '#e9e6df', 3.4, [1.5, 1.5]);
  s += cizgi([[200 - gx + 18, y - 1], [200, y - 4], [200 + gx - 18, y - 1]], 3.2);
  s += cizgi([[200 - gx - 19, y - 2], [200 - gx - 40, y + 4]], 3.2) + cizgi([[200 + gx + 19, y - 2], [200 + gx + 40, y + 4]], 3.2);
  for (const yon of [-1, 1]) s += `<path d="M${200 + yon * gx - 8} ${y - 4} L${200 + yon * gx - 2} ${y - 7}" fill="none" stroke="#ffffff" stroke-width="2.4" data-duz="1"/>`;
  return s;
}
// C'nin baş sallama izleri: başın iki yanında kısa kavisler (iç detay kalınlığı)
function sallamaIzi(k) {
  const { cizgi } = araclar(5201, k, 0.7);
  let s = '';
  for (const yon of [-1, 1]) {
    const x = 200 + yon * 114;
    s += cizgi([[x, GOZ_Y - 40], [x + yon * 9, GOZ_Y - 22], [x + yon * 9, GOZ_Y - 2]], 3.6);
    s += cizgi([[x + yon * 21, GOZ_Y - 28], [x + yon * 27, GOZ_Y - 13], [x + yon * 26, GOZ_Y + 2]], 3.6);
  }
  return s;
}
// Tekerlekli sandalyenin itme tutamakları: omuzların arkasında iki dikme + kauçuk tutacak (baş-omuz kadrajında okunur)
function tutamaklar(k) {
  const { sekil, kenarla } = araclar(5301, k, 0.5);
  let s = '';
  for (const yon of [-1, 1]) {
    const x = 200 + yon * 186, ust = 318;
    s += sekil(kenarla([[x - 9, 1100], [x - 9, ust + 18], [x + 9, ust + 18], [x + 9, 1100]], true, 40), MONO.giysi[4], 3.6, [2, 2]);
    s += sekil(oval(x + yon * 6, ust + 8, 15, 24, 0, 360, 14, 2.8), MONO.giysi[5], 4.2, [2, 2]);
  }
  return s;
}
// D'nin onay işareti: kalem ucunun yanında havaya çizilmiş mürekkep tik (istek işareti değil: vurgu rengi yok)
function onayTik(k, uc) {
  const { cizgi } = araclar(6101, k, 0.6);
  const [x, y] = uc;
  return cizgi([[x - 34, y - 6], [x - 18, y + 8], [x - 8, y + 24], [x + 14, y - 8], [x + 40, y - 44]], 4.2);
}

// Karakter yerleşimi (ekran pikseli). Yatay: iki yanda ikişer kişi (üstte A/B, altta C/D), gövdeler yan ve alt kenardan taşar;
// orta sütun nesnelere kalır. Dikey: A/B yanlarda yazının altında, C/D altta (başlar alt %20 güvenli alanın üstünde).
function kisiler() {
  const PL = DIKEY ? {
    A: { ex: 352, ey: 1300, r: 6, S: 0.8 }, B: { ex: 738, ey: 1292, r: -6, S: 0.8 },
    C: { ex: 160, ey: 1440, r: 10, S: 0.9 }, D: { ex: 922, ey: 1448, r: -10, S: 0.9 },
    elA: [214, 1262], yonA: -1, jestA: 'yumruk', tikD: [1000, 1336],
  } : {
    A: { ex: 160, ey: 486, r: 13, S: 0.86 }, B: { ex: 1764, ey: 478, r: -13, S: 0.86 },
    C: { ex: 286, ey: 896, r: 7, S: 0.92 }, D: { ex: 1640, ey: 900, r: -7, S: 0.92 },
    elA: [392, 712], yonA: 1, jestA: 'sun', tikD: [1488, 846],
  };
  return [
    { ad: 'A', n: 901, p: P.A, ...PL.A, ifade: 'mutlu', bakis: [1, 1], ...(PL.yonA < 0 ? { sagKol: false } : { solKol: false }),
      // avuç yukarı, zarları gösterir ("işte bunlar!"): bilek elA'da, parmaklar zar kümesine
      kollar: (o, ortak, yer) => {
        const r = { ...ortak, manset: 'ribana' }, bilek = yer(PL.elA), hedef = yer(ekran(KUR.zar[3][0], KUR.zar[3][1], 0));
        const y = PL.yonA, om = y < 0 ? o.sol : o.sag;
        // dikey: "evet!" yumruğu (dirsek aşağıda, yumruk omuzun üstünde); yatay: avuç yukarı sunuş
        if (PL.jestA === 'yumruk') return kolSVG({ ...r, omuz: om, dirsek: [om[0] + y * 38, om[1] + 120], bilek, el: 'yumruk', elAci: -96 + y * 8, elBoy: EB * 0.95, basparmak: y, taraf: y < 0 ? 'sol' : 'sag', tohum: 11 });
        const elAci = aciDer(bilek, hedef) - 6 * y;
        return kolSVG({ ...r, omuz: om, dirsek: dirsekSec(om, bilek), bilek, el: 'acik', yuz: 'avuc', elAci, elBoy: EB, basparmak: -y, taraf: y < 0 ? 'sol' : 'sag', tohum: 11 });
      } },
    { ad: 'B', n: 902, p: P.B2, ...PL.B, ifade: 'merak', bakis: [-1, 1], solKol: false, // iç kol çizilmez: pelerin silüeti (sarkan el D'nin başının yanına düşüyordu)
      on: (yer, k) => alinGozlugu(k),
      kollar: (o, ortak) => {
        const r = { ...ortak, kolBoyu: 'sivali' };
        // işaret parmağı gözlüğün köprüsünde, el şakaktan gelir (yüzü örtmez)
        const hedef = [204, GOZ_Y - 60], elAci = -126;
        const bilek = bilekBul({ el: 'isaret', hedef, elAci, elBoy: EB, basparmak: -1 });
        return kolSVG({ ...r, omuz: o.sag, dirsek: dirsekSec(o.sag, bilek, 160, 150), bilek, el: 'isaret', elAci, elBoy: EB, basparmak: -1, taraf: 'sag', tohum: 22 });
      } },
    { ad: 'C', n: 903, p: P.C, ...PL.C, ifade: 'mutlu', bakis: [1, -1], gogus: 122, kalinlik: 74,
      arka: (yer, k) => tutamaklar(k),
      ust: (yer, k) => sallamaIzi(k),
      kollar: (o, ortak) => { const r = { ...ortak, manset: 'ribana' }; return sarkan(o, r, -1, 32) + sarkan(o, r, 1, 31); } },
    { ad: 'D', n: 904, p: P.D, ...PL.D, ifade: 'kisik', bakis: [-1, -1],
      // "Tamam, bu.": eller kadrajın altında; onay yüzde (kısık göz, yan gülüş) ve başının yanında havaya çizilmiş tikte
      kollar: (o, ortak) => { const r = { ...ortak, manset: 'gomlek' }; return sarkan(o, r, -1, 41) + sarkan(o, r, 1, 42); },
      ust: (yer, k) => onayTik(k, yer(PL.tikD)) },
  ];
}

// ======================================================================================= OKTOS'UN SESİ (yazı kilidi)
// Big Shoulders Display: "OKTOS" 900 iri; öbür sözcükler 800, iki satırlık yığınlar halinde OKTOS'un büyük harf
// yüksekliğine kilitlenir (sol yığın sağa yaslı, sağ yığın sola yaslı, taban çizgileri ortak).
async function yaziKur() {
  if (q.get('yazi') === '0') return;
  const ornek = 'BUNLAR İÇİN OKTOS VAR. THAT’S WHAT IS FOR.';
  await Promise.all([document.fonts.load(`900 200px "Big Shoulders Display"`, ornek), document.fonts.load(`800 100px "Big Shoulders Display"`, ornek)]);
  await document.fonts.ready;
  const P0 = DIL === 'en' ? { sol: ['THAT’S', 'WHAT'], sag: ['IS', 'FOR.'] } : { sol: ['BUNLAR', 'İÇİN'], sag: ['VAR.'] };
  const olc = tuvalYap(8, 8).getContext('2d');
  const genis = (s, w, px) => { olc.font = `${w} ${px}px "Big Shoulders Display"`; return olc.measureText(s); };
  let F = DIKEY ? 290 : 214;
  const maks = DIKEY ? W - 120 : 1180;
  let L;
  for (let tur = 0; tur < 6; tur++) {
    const mO = genis('OKTOS', 900, F), capO = mO.actualBoundingBoxAscent;
    const capOran = genis('H', 800, 100).actualBoundingBoxAscent / 100;
    const cs = capO / 2.36, f = cs / capOran, ara = cs * 0.36;
    const iz = 0.012 * f; // küçük sözcüklerde hafif harf aralığı
    const wS = (dizi) => Math.max(0, ...dizi.map((s) => genis(s, 800, f).width + iz * (s.length - 1)));
    const wL = wS(P0.sol), wR = wS(P0.sag), bos = F * 0.075;
    const top = wL + bos + mO.width + bos + wR;
    L = { F, f, capO, cs, ara, iz, wL, wR, bos, wO: mO.width, top };
    if (top <= maks) break;
    F *= maks / top;
  }
  const x0 = (W - L.top) / 2, ustY = DIKEY ? Math.round(H * 0.12 + 30) : 62, tab = ustY + L.capO;
  const tx = (x, y, s, w, px, anchor, iz = 0) => `<text x="${yuvarla(x)}" y="${yuvarla(y)}" font-family="'Big Shoulders Display', sans-serif" font-weight="${w}" font-size="${yuvarla(px)}" letter-spacing="${yuvarla(iz)}" text-anchor="${anchor}" fill="${M}">${s}</text>`;
  let s = '';
  const xL = x0 + L.wL, xO = xL + L.bos, xR = xO + L.wO + L.bos;
  const satir = (dizi, x, anchor) => { const n = dizi.length; dizi.forEach((t, i) => { s += tx(x, tab - (n - 1 - i) * (L.cs + L.ara), t, 800, L.f, anchor, L.iz); }); };
  satir(P0.sol, xL, 'end');
  s += tx(xO, tab, 'OKTOS', 900, L.F, 'start', L.F * 0.004);
  satir(P0.sag, xR, 'start');
  const yz = document.getElementById('yazi');
  yz.innerHTML = `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" lang="${DIL}" aria-label="${DIL === 'en' ? 'That’s what Oktos is for.' : 'Bunlar için Oktos var.'}">${s}</svg>`;
  return L;
}

// ======================================================================================= KURULUM, KARE
let zeminler = [], kisiCizim = [], sonK = -1;
function ciz3B() { renderer.setRenderTarget(null); renderer.render(sc, kam); }
const ODAK = (() => { const [x, y] = ekran(KUR.isikMerkez[0], KUR.isikMerkez[1], 20); return [x, y]; })();
function kare(t) {
  const k = Math.floor(t * 8 + 1e-6) % 4;
  if (k !== sonK) {
    sonK = k;
    zeminDoku.image = zeminler[k]; zeminDoku.needsUpdate = true;
    ciz3B();
    if (kisiCizim.length) kisiSvg.querySelector('g.kisiler').innerHTML = kisiCizim[k];
  }
  // kamera %2 iter (KM), odak nesne kümesinin ortası; yazı ve gren sabit
  const s = 1 + 0.02 * E.KM(Math.min(1, Math.max(0, t / SURE)));
  const m = [s, 0, 0, s, ODAK[0] * (1 - s), ODAK[1] * (1 - s)];
  kameraDiv.style.transform = `matrix(${m.join(',')})`;
  grenGuncelle(m);
}
async function kur() {
  const t0 = performance.now();
  await document.fonts.load('700 120px "Schibsted Grotesk"', '0123456789');
  await figurKur();
  zeminler = await zeminTuvalleri();
  zeminDoku.image = zeminler[0]; zeminDoku.needsUpdate = true;
  renderer.shadowMap.needsUpdate = true;
  TEMAS.hesapla();
  maskeHesapla();
  grenKur();
  await yaziKur();
  kisiSvg.innerHTML = `<defs>${PURUZ}</defs><g filter="url(#puruz)" class="kisiler"></g>`;
  if (q.get('kisi') !== '0') {
    const F = kisiler();
    kisiCizim = [0, 1, 2, 3].map((k) => F.map((f) => figur(f, k)).join(''));
  }
  console.log(`sc3 kuruldu: ${(performance.now() - t0).toFixed(0)} ms`);
}
window.tanitim = { kare: (t) => { try { kare(t); } catch (e) { hataEl.textContent = e.stack; } }, sure: () => SURE, renderer, sc, kam, ekran };
try {
  await kur();
  kare(q.get('t') !== null ? +q.get('t') : (CEKIM ? 0 : T_KAHRAMAN));
  window.tanitimHazir = true;
  if (!CEKIM && q.get('t') === null) {
    const bas = performance.now();
    const dongu = () => { window.tanitim.kare(((performance.now() - bas) / 1000) % (SURE + 0.6)); requestAnimationFrame(dongu); };
    requestAnimationFrame(dongu);
  }
} catch (e) {
  console.error(e);
  hataEl.textContent = e.stack || e.message;
  window.tanitimHazir = true;
}
