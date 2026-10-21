// Tanıtım filmi, 1. vuruş prototipi v03 (≈11 sn, 1920×1080 sahne, 60 fps).
// Anlatı kuralı: fikir dünyası tek renkli doodle (kâğıt, mürekkep, gri); tam renk yalnız gerçek Oktos ürününde.
// Akış: hızlanan yüz montajı (18 → 12 → 8 kare) → son yüz göz kırpar, bakar → düşünce balonu → d6 doodle →
// "çok yüzlü olsun" (d6'nın altıgen dış hattı d20'ye akar, set yay biçiminde açılır) → "şeffaf olsun" → 24 kare nefes →
// balonun içine zoom → gerçek reçine zarlar (three.js cam geçirgenliği), ışık parıltısı, ürün etiketi → geri çekiliş.
// Kare hızı: karakter çizimleri 12 fps (adım adım), kamera ve yazı 60 fps, çizgi kaynaması 8 fps / 4 çizim.
// ?t=4.2 kareyi dondurur, ?hiz=0.5 yavaş oynatır, ?cek=1 kare kare çekim (scripts/film-cek.py).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
import { CustomEase } from 'gsap/CustomEase.js';
import { kisiSVG, rastgeleKisi, yol, oval, rng, PALET, BOY } from './insan.js';

gsap.registerPlugin(DrawSVGPlugin, CustomEase);
const CIKIS = CustomEase.create('cikis', '0.16,1,0.3,1');      // giriş ve yerleşme (expo-out)
const ASMA = CustomEase.create('asma', '0.34,1.56,0.64,1');    // ~%10 aşan beliriş
const KAMERA = CustomEase.create('kamera', '0.65,0,0.35,1');   // kamera, şekil dönüşümü
const ZOOM = 'expo.inOut';
const W = 1920, H = 1080, M = PALET.murekkep, FPS = 60;
const kr = (n) => n / FPS; // kare → saniye
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');

// ---------- Sahne ölçeği
const sahne = document.getElementById('sahne');
function sigdir() {
  const k = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * k) / 2}px, ${(innerHeight - H * k) / 2}px) scale(${k})`;
}
addEventListener('resize', sigdir);
sigdir();
const kamera = document.getElementById('kamera'), itme = document.getElementById('itme');

// ---------- Kaynama: 8 fps, 4 çizim döngüsü
let kare = -1;
const kaynayanlar = new Set();
function kaynat(k) { if (k === kare) return; kare = k; for (const f of kaynayanlar) f(k); }
const kaynaIndis = (t) => Math.floor(t * 8) % 4;
gsap.ticker.add((t) => { if (!CEKIM) kaynat(kaynaIndis(t)); });
const sapma = (tohum, genlik = 1.2) => {
  const tablo = [0, 1, 2, 3].map((k) => { const r = rng(tohum * 131 + k * 977); return Array.from({ length: 256 }, () => (r() - 0.5) * 2 * genlik); });
  return (k) => ({ sap: (i, e) => tablo[k][(i * 2 + e) % 256] });
};

// ---------- Kişi (tek renkli doodle). Karakter değişimleri 12 fps adımlarında
const kisiSvg = document.getElementById('kisi');
kisiSvg.setAttribute('viewBox', `0 0 ${BOY.en} ${BOY.boy}`);
const kahraman = rastgeleKisi(7, { kadin: true, sacStil: 'kivircik', yas: 'genc', cil: true, gozluk: null, sakal: null, kupe: true, ten: 4, sac: 0, giysi: 3, yaka: 'kapusonlu' });
// Ardışık iki kişide en çok bir ortak özellik: elle sıralanmış tohumlar
const montaj = [12, 6, 2, 17, 9, 28, 5, 14, 21, 10, 33].map((t) => rastgeleKisi(t));
let kisi = montaj[0], ifade = 'notr', bakis = [0, 0];
const kisiCiz = () => { kisiSvg.innerHTML = kisiSVG(kisi, { kaynama: kare % 3, ifade, bakis, mono: true }); };
kaynayanlar.add(kisiCiz);

// ---------- Düşünce balonu
const BC = [1360, 330], BR = [450, 266];
const bulutSap = sapma(5, 1.6);
function bulutYolu(k, dx = 0, dy = 0) {
  const n = 11, r = rng(77), w = Array.from({ length: n }, () => 0.75 + r() * 0.5), top = w.reduce((a, b) => a + b, 0);
  const sp = k === null ? { sap: () => 0 } : bulutSap(k);
  const aci = []; let acc = 0;
  for (let i = 0; i < n; i++) { aci.push(acc / top * Math.PI * 2 - Math.PI * 0.62); acc += w[i]; }
  const P = (a) => [BC[0] + BR[0] * Math.cos(a), BC[1] + BR[1] * Math.sin(a)];
  const N = (a) => { const x = Math.cos(a) / BR[0], y = Math.sin(a) / BR[1], l = Math.hypot(x, y); return [x / l, y / l]; };
  const f = (v) => v.toFixed(1);
  const uc = aci.map((a, i) => { const q0 = P(a); return [q0[0] + sp.sap(i * 6, 0) + dx, q0[1] + sp.sap(i * 6, 1) + dy]; });
  let d = `M${f(uc[0][0])} ${f(uc[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a0 = aci[i], a1 = i + 1 < n ? aci[i + 1] : aci[0] + Math.PI * 2;
    const p0 = P(a0), p1 = P(a1), n0 = N(a0), n1 = N(a1);
    const b = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 0.62;
    const j = (q0, m) => [q0[0] + sp.sap(i * 6 + m, 0) + dx, q0[1] + sp.sap(i * 6 + m, 1) + dy];
    const c1 = j([p0[0] + n0[0] * b + (p1[0] - p0[0]) * 0.08, p0[1] + n0[1] * b + (p1[1] - p0[1]) * 0.08], 1);
    const c2 = j([p1[0] + n1[0] * b - (p1[0] - p0[0]) * 0.08, p1[1] + n1[1] * b - (p1[1] - p0[1]) * 0.08], 2);
    const q1 = uc[(i + 1) % n];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(q1[0])} ${f(q1[1])}`;
  }
  return d + 'Z';
}
const balonYol = document.querySelector('.bulut-yol'), balonDolgu = document.querySelector('.bulut-dolgu');
const nokta = [[792, 470, 12], [846, 420, 18], [910, 360, 26]];
const noktaEl = [...document.querySelectorAll('.nokta')];
function balonCiz(k) {
  const d = bulutYolu(k);
  balonYol.setAttribute('d', d);
  balonDolgu.setAttribute('d', d);
  nokta.forEach(([x, y, r], i) => noktaEl[i].setAttribute('d', yol(oval(x, y, r, r * 0.86, 0, 360, 10), true, sapma(40 + i, 0.8)(k))));
}
kaynayanlar.add(balonCiz);
const TUVAL = { x: 890, y: 40, en: 940, boy: 590 };
const tuval = document.getElementById('gercek');
Object.assign(tuval.style, { left: TUVAL.x + 'px', top: TUVAL.y + 'px', width: TUVAL.en + 'px', height: TUVAL.boy + 'px' });
tuval.style.clipPath = `path('${bulutYolu(null, -TUVAL.x, -TUVAL.y)}')`;

// ---------- Doodle zarlar (birim boy, merkez 0,0). d6 ve d20'nin dış hattı aynı altıgen: dönüşüm iç çizgilerde
const ALTIGEN = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26], [0, -0.52]];
const ZAR = {
  d4: { dis: [[-0.5, 0.42], [0, -0.5], [0.5, 0.42], [-0.5, 0.42]], ic: [[[0, -0.5], [0.06, 0.12]], [[-0.5, 0.42], [0.06, 0.12], [0.5, 0.42]]] },
  d6: { dis: ALTIGEN, ic: [[[-0.46, -0.26], [0, -0.01], [0.46, -0.26]], [[0, -0.01], [0, 0.52]]] },
  d8: { dis: [[0, -0.54], [0.43, 0], [0, 0.54], [-0.43, 0], [0, -0.54]], ic: [[[-0.43, 0], [0.1, 0.06], [0.43, 0]], [[0, -0.54], [0.1, 0.06], [0, 0.54]]] },
  d10: { dis: [[0, -0.54], [0.45, -0.06], [0.37, 0.24], [0, 0.5], [-0.37, 0.24], [-0.45, -0.06], [0, -0.54]], ic: [[[-0.45, -0.06], [-0.16, 0.12], [0, 0.5]], [[0.45, -0.06], [0.16, 0.12], [0, 0.5]], [[-0.16, 0.12], [0, -0.54], [0.16, 0.12]], [[-0.16, 0.12], [0.16, 0.12]]] },
  d12: { dis: [[-0.18, -0.5], [0.18, -0.5], [0.44, -0.3], [0.52, 0.04], [0.36, 0.38], [0.04, 0.52], [-0.3, 0.44], [-0.5, 0.16], [-0.48, -0.2], [-0.18, -0.5]], ic: [[[0, -0.22], [0.22, -0.06], [0.14, 0.2], [-0.14, 0.2], [-0.22, -0.06], [0, -0.22]], [[0, -0.22], [0, -0.5]], [[0.22, -0.06], [0.5, -0.12]], [[0.14, 0.2], [0.3, 0.42]], [[-0.14, 0.2], [-0.3, 0.42]], [[-0.22, -0.06], [-0.5, -0.12]]] },
  d20: { dis: ALTIGEN, ic: [[[-0.27, 0.16], [0, -0.3], [0.27, 0.16], [-0.27, 0.16]], [[0, -0.52], [-0.27, 0.16]], [[0, -0.52], [0.27, 0.16]], [[-0.46, -0.26], [-0.27, 0.16]], [[0.46, -0.26], [0.27, 0.16]], [[0, 0.52], [-0.27, 0.16]], [[0, 0.52], [0.27, 0.16]]] },
};
const SIRA = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
// Yay dizilimi (gülümseyen yay)
const YUVA = SIRA.map((_, i) => { const u = (i - 2.5) / 2.5; return [BC[0] + u * 330, BC[1] + 8 + 44 * u * u]; });
const NS = 'http://www.w3.org/2000/svg';
const zarKatman = document.getElementById('zarlar');
const zarlar = SIRA.map((ad, i) => {
  const g = document.createElementNS(NS, 'g');
  const yap = () => { const e = document.createElementNS(NS, 'path'); g.appendChild(e); return e; };
  const dis = yap(), ic = ZAR[ad].ic.map(yap);
  const pip = ad === 'd6' ? [0, 1, 2, 3].map(() => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '0.045'); c.setAttribute('fill', M); g.appendChild(c); return c; }) : [];
  zarKatman.appendChild(g);
  const sp = sapma(200 + i, 0.012);
  const ciz = (k) => {
    dis.setAttribute('d', yol(ZAR[ad].dis, false, sapma(300 + i * 10, 0.012)(k)));
    ZAR[ad].ic.forEach((pts, j) => ic[j].setAttribute('d', yol(pts, false, sapma(301 + i * 10 + j, 0.012)(k))));
    const pp = [[0, -0.26], [0.2, 0.2], [-0.2, 0.2], [-0.24, 0.02]];
    pip.forEach((c, j) => { c.setAttribute('cx', pp[j][0] + sp(k).sap(j, 0)); c.setAttribute('cy', pp[j][1] + sp(k).sap(j, 1)); });
  };
  kaynayanlar.add(ciz);
  return { ad, g, dis, ic, pip, st: { x: YUVA[i][0], y: YUVA[i][1], s: 112, o: 0, r: 0 } };
});
const z6 = zarlar[1], z20 = zarlar[5];
function zarUygula() {
  for (const z of zarlar) {
    z.g.setAttribute('transform', `translate(${z.st.x.toFixed(2)} ${z.st.y.toFixed(2)}) rotate(${z.st.r.toFixed(2)}) scale(${z.st.s.toFixed(3)})`);
    z.g.style.opacity = z.st.o;
  }
}
gsap.ticker.add(zarUygula);

// ---------- Gerçek zarlar (three.js; reçine, cam geçirgenliği)
const renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: true, alpha: false, preserveDrawingBuffer: CEKIM });
renderer.setPixelRatio(2); // zoomda keskin kalsın
renderer.setSize(TUVAL.en, TUVAL.boy, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const sc = new THREE.Scene();
{
  const o = new THREE.Scene();
  o.background = new THREE.Color('#2b2722');
  const panel = (w, h, x, y, z, renk, guc) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(renk).multiplyScalar(guc), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); o.add(m);
  };
  panel(5, 1.4, 0, 4, 3, '#ffffff', 7);
  panel(1.2, 5, -4, 0.5, 2, '#fff4e6', 4);
  panel(3, 3, 3, -0.5, -3, '#f1e6d6', 1.6);
  panel(12, 12, 0, -4, 0, '#9a9084', 1);
  sc.environment = new THREE.PMREMGenerator(renderer).fromScene(o, 0.02).texture;
}
const FOV = 18, uzak = (TUVAL.boy / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const kam = new THREE.PerspectiveCamera(FOV, TUVAL.en / TUVAL.boy, 10, uzak * 3);
kam.position.set(0, 0, uzak);
{
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.fillStyle = '#fbf9f5'; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = '#ddd5c8'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 1); x.lineTo(64, 1); x.moveTo(1, 0); x.lineTo(1, 64); x.stroke();
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.anisotropy = 8;
  const z = -260, olc = (uzak - z) / uzak;
  tx.repeat.set(TUVAL.en * olc / 34, TUVAL.boy * olc / 34);
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(TUVAL.en * olc, TUVAL.boy * olc), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }));
  zemin.position.z = z;
  sc.add(zemin);
}
const isik = new THREE.DirectionalLight(0xffffff, 1.6);
isik.position.set(-700, 400, 600);
sc.add(isik);
const parilti = { x: -900 };
function d10Geo(r) {
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
const lekeDoku = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const RENK = ['#e8a33d', '#2fa59a', '#7f5bd6', '#e0607e', '#3f7fd6', '#d4621f'];
const gercek = SIRA.map((ad, i) => {
  const r = 50;
  const geo = { d4: new THREE.TetrahedronGeometry(r * 1.15), d6: new RoundedBoxGeometry(r * 1.25, r * 1.25, r * 1.25, 3, 4), d8: new THREE.OctahedronGeometry(r * 1.05), d10: d10Geo(r), d12: new THREE.DodecahedronGeometry(r * 1.02), d20: new THREE.IcosahedronGeometry(r * 1.05) }[ad];
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 1, thickness: r * 0.9, ior: 1.5, roughness: 0.02, metalness: 0,
    attenuationColor: new THREE.Color(RENK[i]), attenuationDistance: r * 1.5, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 1.3, specularIntensity: 1, flatShading: ad !== 'd6',
  }));
  m.position.set(YUVA[i][0] - TUVAL.x - TUVAL.en / 2, -(YUVA[i][1] - TUVAL.y - TUVAL.boy / 2), 0);
  const leke = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.6, r * 1.3), new THREE.MeshBasicMaterial({ map: lekeDoku, color: new THREE.Color(RENK[i]), transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  leke.position.set(m.position.x + r * 0.25, m.position.y - r * 0.95, -120);
  sc.add(leke);
  m.userData.taban = new THREE.Euler(0.5 + i * 0.4, 0.3 + i * 0.7, 0.2);
  m.userData.don = [0.16 + (i % 3) * 0.05, 0.28 - (i % 2) * 0.1];
  sc.add(m);
  return m;
});
let ACILIS = 7.4;
function gercekCiz(t) {
  const tau = Math.max(0, t - ACILIS), aci = tau + 3.2 * (1 - Math.exp(-3 * tau));
  for (const m of gercek) m.rotation.set(m.userData.taban.x + m.userData.don[0] * aci, m.userData.taban.y + m.userData.don[1] * aci, m.userData.taban.z);
  isik.position.x = parilti.x;
  renderer.render(sc, kam);
}

// ---------- El yazısı notlar (karakterin sesi, balonun içinde) ve ürün etiketi (Oktos'un sesi)
const notlar = [...document.querySelectorAll('.not')];
const etiket = document.getElementById('etiket');

// ---------- Zaman çizelgesi
const tl = gsap.timeline({ paused: true });
function kur() {
  // 0. Kamera her an hareketli: montaj boyunca %3 itiş (60 fps)
  tl.fromTo(itme, { scale: 1 }, { scale: 1.03, duration: 2.6, ease: 'power1.inOut', transformOrigin: '560px 560px' }, 0);
  // 1. Hızlanan montaj: 3 yüz 18 kare, 5 yüz 12 kare, 3 yüz 8 kare; göz çizgisi sabit, düz kesme
  const sure = [18, 18, 18, 12, 12, 12, 12, 12, 8, 8, 8];
  let t = 0;
  montaj.forEach((m, i) => {
    tl.call(() => { kisi = m; ifade = ['notr', 'merak', 'notr', 'mutlu', 'notr', 'sikkin'][i % 6]; bakis = [[0, 0], [1, 0], [-1, 0], [0, 1]][i % 4]; kisiCiz(); }, null, t);
    t += kr(sure[i]);
  });
  const T0 = t; // ≈2,30 sn: kahraman
  tl.call(() => { kisi = kahraman; ifade = 'notr'; bakis = [0, 0]; kisiCiz(); }, null, T0);
  // Karakter hareketi 12 fps adımlarında (beşer kare: 60/12)
  tl.fromTo(kisiSvg, { scale: 1.04 }, { scale: 1, duration: kr(30), ease: 'steps(6)', transformOrigin: '50% 40%', immediateRender: false }, T0);
  tl.call(() => { ifade = 'kirp'; kisiCiz(); }, null, T0 + kr(10));
  tl.call(() => { ifade = 'notr'; kisiCiz(); }, null, T0 + kr(17));
  tl.call(() => { ifade = 'merak'; bakis = [1, -1]; kisiCiz(); }, null, T0 + kr(24));
  // 2. Düşünce balonu: noktalar 4 kare arayla, bulut aşmalı açılır, kendini 22 karede çizer
  const B0 = T0 + kr(30);
  tl.fromTo(noktaEl, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: kr(10), ease: ASMA, stagger: kr(4) }, B0);
  tl.fromTo(document.querySelectorAll('.bulut-g'), { scale: 0.3, opacity: 0, transformOrigin: '22% 88%' }, { scale: 1, opacity: 1, duration: kr(26), ease: 'back.out(1.5)' }, B0 + kr(10));
  tl.fromTo(balonYol, { drawSVG: '0%' }, { drawSVG: '100%', duration: kr(22), ease: CIKIS }, B0 + kr(10));
  tl.set(balonYol, { clearProps: 'strokeDasharray,strokeDashoffset' }, B0 + kr(34));
  // 3. d6 doodle: balon yerleştikten 4 kare sonra, ortada büyük
  const D0 = B0 + kr(36);
  zarlar.forEach((z) => tl.set(z.st, { o: 0 }, 0));
  tl.set(z6.st, { x: BC[0], y: BC[1] + 8, s: 180, o: 1 }, D0);
  tl.fromTo([z6.dis, ...z6.ic], { drawSVG: '0%' }, { drawSVG: '100%', duration: kr(24), ease: 'power2.inOut', stagger: kr(6) }, D0);
  tl.fromTo(z6.pip, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: kr(12), ease: ASMA, stagger: kr(3) }, D0 + kr(26));
  const yazNot = (el, t0, sure) => tl.fromTo(el, { clipPath: 'inset(-20% 100% -20% 0%)', opacity: 1, y: 0 }, { clipPath: 'inset(-20% 0% -20% 0%)', duration: sure, ease: 'none' }, t0);
  const silNot = (el, t0) => tl.to(el, { opacity: 0, y: -18, duration: kr(14), ease: 'power2.in' }, t0);
  notlar.forEach((n) => tl.set(n, { opacity: 0 }, 0));
  yazNot(notlar[0], D0 + kr(14), kr(30));
  // 4. "çok yüzlü olsun": baş iki kez sallanır (16 kare), d6'nın iç çizgileri silinir, d20'nin iç çizgileri akar
  const F0 = D0 + kr(76);
  tl.to(kisiSvg, { rotation: 3, duration: kr(4), ease: 'steps(1)', transformOrigin: '50% 60%', repeat: 3, yoyo: true }, F0 - kr(16));
  silNot(notlar[0], F0);
  yazNot(notlar[1], F0 + kr(6), kr(34));
  tl.set(z20.st, { x: BC[0], y: BC[1] + 8, s: 180, o: 1 }, F0);
  tl.set(z20.dis, { opacity: 0 }, 0);
  tl.fromTo(z20.ic, { drawSVG: '0%' }, { drawSVG: '100%', duration: kr(20), ease: KAMERA, stagger: kr(2) }, F0 + kr(2));
  tl.to(z6.ic, { drawSVG: '100% 100%', duration: kr(16), ease: KAMERA, stagger: kr(2) }, F0);
  tl.to(z6.pip, { scale: 0, duration: kr(8), ease: 'power2.in' }, F0);
  tl.set(z20.dis, { opacity: 1 }, F0 + kr(24));
  tl.set(z6.st, { o: 0 }, F0 + kr(24));
  // 5. Set açılır: d20 yuvasına kayar, diğerleri merkezden 3 kare arayla yaya fırlar, %10 aşar
  const S0 = F0 + kr(34);
  tl.to(z20.st, { x: YUVA[5][0], y: YUVA[5][1], s: 112, duration: kr(30), ease: CIKIS }, S0);
  zarlar.forEach((z, i) => {
    if (z === z20) return;
    const t1 = S0 + kr(3) * i;
    tl.set(z.st, { x: BC[0], y: BC[1] + 8, s: 40, o: 1, r: -25 }, t1);
    if (z === z6) { tl.set(z6.ic, { drawSVG: '100%' }, t1); tl.set(z6.pip, { scale: 1 }, t1); }
    tl.to(z.st, { x: YUVA[i][0], y: YUVA[i][1], duration: kr(30), ease: CIKIS }, t1);
    tl.to(z.st, { s: 112, r: 0, duration: kr(30), ease: ASMA }, t1);
    tl.fromTo([z.dis, ...z.ic], { drawSVG: '0%' }, { drawSVG: '100%', duration: kr(20), ease: 'power2.out', stagger: kr(1) }, t1);
  });
  tl.call(() => { ifade = 'mutlu'; kisiCiz(); }, null, S0 + kr(20));
  // 6. "şeffaf olsun"
  const P0 = S0 + kr(66);
  tl.call(() => { ifade = 'merak'; kisiCiz(); }, null, P0 - kr(10));
  silNot(notlar[1], P0);
  yazNot(notlar[2], P0 + kr(6), kr(30));
  // 7. Nefes (24 kare), sonra balonun içine zoom; gerçek zarlar mürekkep yayılır gibi belirir, renk ilk kez girer
  const Z0 = P0 + kr(36) + kr(24);
  ACILIS = Z0 + kr(30);
  tl.to(kamera, { scale: 1.62, x: W / 2 - BC[0], y: H / 2 - BC[1], duration: kr(66), ease: ZOOM, transformOrigin: `${BC[0]}px ${BC[1]}px` }, Z0);
  tl.to(notlar[2], { opacity: 0, duration: kr(12) }, Z0 + kr(20));
  tl.set(tuval, { opacity: 1 }, ACILIS);
  const acilis = { r: 0 };
  tl.fromTo(acilis, { r: 0 }, { r: 125, duration: kr(54), ease: KAMERA, onUpdate: () => tuval.style.setProperty('--r', acilis.r + '%') }, ACILIS);
  tl.to(zarlar.map((z) => z.st), { o: 0, duration: kr(20), ease: 'power1.out', stagger: kr(3) }, ACILIS + kr(24));
  // 8. Işık parıltısı soldan sağa (48 kare), ürün etiketi (Oktos'un düz yazısı)
  tl.fromTo(parilti, { x: -900 }, { x: 900, duration: kr(48), ease: 'power1.inOut' }, ACILIS + kr(40));
  const E0 = ACILIS + kr(48);
  tl.set(etiket, { opacity: 1 }, E0);
  tl.fromTo(etiket.querySelector('.ust'), { yPercent: 120 }, { yPercent: 0, duration: kr(36), ease: CIKIS }, E0);
  tl.fromTo(etiket.querySelector('.ad'), { yPercent: 115, fontWeight: 300 }, { yPercent: 0, fontWeight: 900, duration: kr(40), ease: CIKIS }, E0 + kr(4));
  tl.fromTo(etiket.querySelector('.cizgi'), { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: kr(36), ease: CIKIS }, E0 + kr(8));
  // 9. Geri çekiliş: kahraman gülümsüyor, gerçek zarlar balonda
  const G0 = E0 + kr(100);
  tl.to(etiket, { opacity: 0, duration: kr(16), ease: 'power2.in' }, G0);
  tl.call(() => { ifade = 'mutlu'; bakis = [1, -1]; kisiCiz(); }, null, G0);
  tl.to(kamera, { scale: 1, x: 0, y: 0, duration: kr(54), ease: ZOOM }, G0);
  tl.to({}, { duration: kr(40) }, G0 + kr(54));
}

// Kare kare çekim: t anını eksiksiz kur
function kareKur(t) {
  tl.seek(t, false);
  kaynat(kaynaIndis(t));
  zarUygula();
  if (tuval.style.opacity !== '0') gercekCiz(t);
}
gsap.ticker.add(() => { if (!CEKIM && tuval.style.opacity !== '0') gercekCiz(tl.time()); });
tuval.style.opacity = '0';
kaynat(0);
if (CEKIM) { gsap.ticker.lagSmoothing(0); document.getElementById('tekrar').hidden = true; }
window.tanitim = { tl, renderer, sc, kam, gercekCiz, kare: kareKur, sure: () => tl.duration() };
document.fonts.ready.then(() => {
  kur();
  if (CEKIM) { window.tanitimHazir = true; return; }
  const t0 = q.get('t');
  if (t0 !== null) { kareKur(+t0); return; }
  tl.timeScale(+(q.get('hiz') || 1));
  tl.play(0);
  document.getElementById('tekrar').addEventListener('click', () => { tuval.style.opacity = '0'; tl.play(0); });
});
