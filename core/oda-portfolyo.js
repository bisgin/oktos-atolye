// Odadaki portfolyo köşesi (2026-11-03, kullanıcı kararı: çatı katının portfolyo eşyaları orta kattaki odaya taşındı,
// /portfolyo/ odaya yönlenir; senaryo C:\Oktos\calisma\oktos-dijital-site\senaryo\biggie-sunum.md).
// Parçalar çatı katından (core/cati-sahne.js) taşındı ve odanın ölçüsüne indirildi:
// - Sol duvar (önü +x): kitaplık (1100 × 380 × 2350; altta iki çekmece, dört göz: kitaplar, markasız oyun kutuları,
//   Modern Balbal büstleri, vazolarımız). v8 (2026-11-04): önündeki kara tahta (hakkımda) kalktı; yerinde armut koltuk,
//   Hakkımda onun durağı. (Eski not: kara tahta çatıdaki şövalenin tahtasıydı: odada ayaklı
//   şövaleye yer yok, önüne konan her şey genel planda kitaplığı ya da ekranı örtüyordu).
// - Sağ duvar (önü −x): 55" ekran (çatıdaki 75" OLED'in süreç sunumu, core/cati-ekran.js; 55/75 ölçekli), altında üç
//   gözlü alçak küp raf (TV sehpası; 1125 × 390 × 420, gözü 339 × 344: standart kare oyun kutusu sığar) ve içinde 8
//   kapalı kutu oyunu (gerçek kutu oranları; kapak görseli yok: düz renk, kapakta desen, sırtta yazı); önünde kilim
//   (core/cati-kilim.js, odaya göre küçük). Buzdolabının kameraya bakan yanında çöp kovası (Biggie elmayı oraya atar).
// - Taşınmayan: teleskop (18" Dobson, ayağı Ø 620: odaya da balkona da sığmadı; core/cati-esya.js'te duruyor).
// - Armut koltuk (2026-11-03 v5, kullanıcı isteği; önceki "taşınmaz" kararının yerine): kitaplığın solunda, TV'ye dönük;
//   TV durağında Biggie oturur (PORT.armut, ENGEL).
// Işık: odanın canlı eşyaları gibi (sahnenin ortam haritası ve güneş); pişirmeye girmez.
// Birim mm, Z yukarı, kamera −y tarafından bakar. Engeller (karakterin yol bulması için) ENGEL'de: core/oda-karakter.js
// bunları kendi listesine alır (sunum işi; bu dosya karakter koduna dokunmaz).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OLCU } from './oda-olcu.js';
import { ESERLER, SUREC, HAKKIMDA } from './cati-veri.js';
import { vaseModel } from './oda-urunler.js';

const { ROOM, FRIDGE } = OLCU;
const modul = (yol) => import(yol).catch((e) => { console.warn('portfolyo modülü', yol, e); return null; });
const yieldMain = () => globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));

// ---- yerler (mm) ----
// Sol duvar: kitaplık dolabın (y 1100…1780) önünde, armut onun önünde (v8; önce kara tahta); sağ duvar: çöp buzdolabının (y 575…1125)
// önünde, ekran ve küp raf onun önünde (ekranın arka kenarı maske çerçevesinin (y 510…1190) önünde kalır)
export const PORT = {
  kitaplik: { y: 520, en: 1100, derin: 380, boy: 2350 },
  ekran: { y: -250, z: 900, olcek: 55 / 75 },               // ekranın alt kenarı z (55": 1225 × 706)
  oyunRafi: { y: -250, en: 1125, derin: 390, boy: 420 },   // ekranın altında, sağ duvarda
  kilim: { x: 1180, y: -400, en: 1900, boy: 1000 },        // uzun kenar y boyunca (en), kısa x
  cop: { x: 1890, y: 455, r: 130, boy: 420 },
  // Armut koltuk (2026-11-03 v5, kullanıcı isteği: TV durağında Biggie armuta oturup TV'yi açar): kitaplığın solunda
  // (kitaplığa karşıdan bakınca sol = −y; kitaplık y −30'dan başlar, armut Ø ~900 ona değmesin), önü TV'ye (+x).
  // Çatıdaki model (core/cati-esya.js armut) olduğu gibi; oturak yüksekliği ~330 mm (önü çökük profil)
  // v6 (2026-11-04, kullanıcı itirazı): eski yer (−1560, −500) ve 1086 mm boy kara tahtanın altını (z 1000) ve kitaplığın
  // alt çekmecelerini örtüyordu; tahtanın (y −660…−60) önüne, odanın ön sol köşesine alındı (kutusu y −1730…−830) ve
  // TV'nin ortasına döndü (+x'ten 16° +y'ye)
  // v7 (2026-11-04, kamera kuralı): ön sol köşeden (−1500, −1280) odanın içine. Köşede göz yüksekliğinden armuda bakan
  // ve odanın dışını (ön kesit) göstermeyen kamera yeri yoktu. Yer taramayla seçildi (.impeccable yok; klip-meta-v5.md
  // "v7 — Oda tarafı"): kara tahtayı ve kitaplığın alt çekmecelerini genel planda (masaüstü + telefon) örtmüyor, ürün
  // yuvalarını en az örten, Biggie'nin duraklarına ≥ 700 mm, önü TV'ye (rz ≈ 89°)
  // v8 (2026-11-04, kullanıcı kararı): sol duvarın önüne, kitaplığın öne (−y) bakan yanına, kara tahtanın (kalktı) yerine;
  // önü TV'ye (+x'ten ~5° +y'ye). Oda önde uzayıp kapandığı için (ON_DUVAR) köşede de kamera kuralına uyan kadraj var.
  // Kitaplığın ucuna (y −30) ~470 mm, arka duvara (sırtın ezik tepesi dahil) ~90 mm pay
  armut: { x: -1560, y: -560, rz: Math.PI / 2 + 0.08, r: 450, oturZ: 330 },
};
const DUVAR_SOL = ROOM.x0 + 15, DUVAR_SAG = ROOM.x1 - 15; // süpürgeliğin önü

// Karakterin yol bulması için yeni engeller (k: kutu [x0, x1, y0, y1], d: daire [x, y, r]; core/oda-karakter.js biçimi).
// Bugünkü yolu (balkon → eşik → masa, kenar yeri) kesmez (scripts/karakter-test.py ile sınandı).
export const ENGEL = [
  { ad: 'kitaplik', k: [ROOM.x0 - 200, DUVAR_SOL + PORT.kitaplik.derin, PORT.kitaplik.y - PORT.kitaplik.en / 2, PORT.kitaplik.y + PORT.kitaplik.en / 2] },
  { ad: 'oyunRafi', k: [DUVAR_SAG - PORT.oyunRafi.derin, ROOM.x1 + 200, PORT.oyunRafi.y - PORT.oyunRafi.en / 2, PORT.oyunRafi.y + PORT.oyunRafi.en / 2] },
  { ad: 'cop', d: [PORT.cop.x, PORT.cop.y, PORT.cop.r + 50] },
  // v6: tv_armut kökü armudun ekseninden 600 mm önde (meta armut.eksen_mm); engel yarıçapı + yürüme payı (160) bunun altında
  // kalsın diye 420 (armudun gövdesi ~450, ön yüzü çökük: oturak profili)
  { ad: 'armut', d: [PORT.armut.x, PORT.armut.y, 420] },
];
// Raf üstü (TV altındaki kutu oyunu rafı, mm): Biggie'nin kutuyu bıraktığı yüzey (klip-meta notu: Blender varsayımı ~350)
export const OYUN_RAFI_UST = PORT.oyunRafi.boy;

// ---- yardımcılar (core/cati-sahne.js'ten) ----
let yukleyici = null;
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/'; // büst modelleri Draco sıkıştırmalı
const gltf = (url) => (yukleyici ??= new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO))).loadAsync(url);
const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const doku = (c, { tekrar = false } = {}) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (tekrar) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const aralik = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const birlesik = (geos, mat) => { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = m.receiveShadow = true; return m; };
// Atlas hücresine UV (BoxGeometry: yüz başına 4 köşe; +x, −x, +y, −y, +z, −z)
function hucreUV(g, [u0, v0, u1, v1], yuz = null) {
  const uv = g.attributes.uv;
  const [i0, i1] = yuz === null ? [0, uv.count] : [yuz * 4, yuz * 4 + 4];
  for (let i = i0; i < i1; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return g;
}
const tiklanmaz = (o) => { o.traverse((x) => { x.raycast = () => {}; }); return o; };
// Ahşap lif dokusu (u boyunca lif)
function ahsapDoku(seed, { renk = [214, 178, 132], boy = 256 } = {}) {
  const [c, g] = kanvas(boy, boy), r = rnd(seed);
  g.fillStyle = `rgb(${renk})`; g.fillRect(0, 0, boy, boy);
  for (let i = 0; i < 40; i++) {
    const y0 = r() * boy, a = 0.6 + r() * 2.5, ph = r() * 6, koyu = r() < 0.5;
    g.strokeStyle = koyu ? `rgba(90,58,30,${0.05 + r() * 0.1})` : `rgba(255,240,215,${0.05 + r() * 0.08})`;
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath();
    for (let x = 0; x <= boy; x += 16) g.lineTo(x, y0 + Math.sin((x / boy) * Math.PI * 2 + ph) * a);
    g.stroke();
  }
  return doku(c, { tekrar: true });
}
// Taş tozu yüzeyi (büstler)
function kumDoku(seed, { taban = 236, sacilma = 26, boy = 128 } = {}) {
  const [c, g] = kanvas(boy, boy), r = rnd(seed), img = g.createImageData(boy, boy);
  for (let i = 0; i < boy * boy; i++) {
    const v = taban + (r() - 0.5) * sacilma + (r() < 0.02 ? -25 : 0);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return doku(c, { tekrar: true });
}

// ---- kitaplık ----
// Markasız oyun kutuları kitaplıkta (kapakta doodle desen, yanlarda düz renk şerit; tek atlas 4 × 4: 10 kapak, 6 yan)
function kutuAtlasi() {
  const [c, g] = kanvas(1024, 1024), r = rnd(61), S = 256;
  const zemin = ['#d9cdb4', '#e8c48c', '#9fb7b0', '#c9a3a0', '#b7c49a', '#a8b6cf', '#e4ddcf', '#d39b6a', '#8fa7a0', '#cdbfd8'];
  const desen = [
    (x, y) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const cx = x + 40 + i * 58 + (j % 2) * 29, cy = y + 40 + j * 50; g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; g.lineTo(cx + 24 * Math.cos(a), cy + 24 * Math.sin(a)); } g.closePath(); g.stroke(); } },
    (x, y) => { g.beginPath(); g.arc(x + 180, y + 70, 36, 0, Math.PI * 2); g.stroke(); for (let k = 0; k < 4; k++) { g.beginPath(); for (let i = 0; i <= 20; i++) g.lineTo(x + 20 + i * 11, y + 140 + k * 26 + Math.sin(i * 0.9 + k) * 8); g.stroke(); } },
    (x, y) => { g.beginPath(); g.moveTo(x + 15, y + 200); g.lineTo(x + 80, y + 90); g.lineTo(x + 120, y + 150); g.lineTo(x + 170, y + 60); g.lineTo(x + 240, y + 200); g.stroke(); },
    (x, y) => { for (let i = 0; i < 5; i++) { const tx = x + 30 + i * 46, ty = y + 70 + (i % 2) * 70; g.beginPath(); g.moveTo(tx, ty + 70); g.lineTo(tx + 20, ty); g.lineTo(tx + 40, ty + 70); g.closePath(); g.stroke(); } },
    (x, y) => { g.beginPath(); for (let a = 0; a < 18; a += 0.15) g.lineTo(x + 128 + Math.cos(a) * a * 5.5, y + 128 + Math.sin(a) * a * 5.5); g.stroke(); },
    (x, y) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { g.beginPath(); g.arc(x + 42 + i * 58, y + 42 + j * 58, 18, 0, Math.PI * 2); g.stroke(); } else g.strokeRect(x + 26 + i * 58, y + 26 + j * 58, 32, 32); },
    (x, y) => { g.beginPath(); g.arc(x + 70, y + 70, 34, 0.6, Math.PI * 1.7); g.stroke(); },
    (x, y) => { for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 24; i++) g.lineTo(x + 15 + i * 9.5, y + 170 + k * 22 + Math.sin(i * 0.8 + k * 2) * 7); g.stroke(); } },
    (x, y) => { for (let i = 0; i < 3; i++) { const px = x + 50 + i * 75, py = y + 150; g.beginPath(); g.arc(px, py - 60, 16, 0, Math.PI * 2); g.stroke(); } },
    (x, y) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.strokeRect(x + 30 + i * 110, y + 30 + j * 110, 86, 86); },
  ];
  g.lineCap = g.lineJoin = 'round';
  desen.forEach((f, i) => {
    const x = (i % 4) * S, y = Math.floor(i / 4) * S;
    g.fillStyle = zemin[i]; g.fillRect(x, y, S, S);
    g.strokeStyle = g.fillStyle = '#2a2622'; g.lineWidth = 5;
    f(x, y);
    g.lineWidth = 8; g.strokeRect(x + 6, y + 6, S - 12, S - 12);
  });
  ['#7d3b2d', '#2f4858', '#c99a3b', '#4b6043', '#8b5a7a', '#3c6e8f'].forEach((renk, j) => {
    const i = 10 + j, x = (i % 4) * S, y = Math.floor(i / 4) * S;
    g.fillStyle = renk; g.fillRect(x, y, S, S);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(x, y + S * 0.42, S, S * 0.16);
  });
  return doku(c);
}
const ATLAS_HC = (i) => [((i % 4) + 0.02) / 4, 1 - (Math.floor(i / 4) + 0.98) / 4, ((i % 4) + 0.98) / 4, 1 - (Math.floor(i / 4) + 0.02) / 4];
const RAF_Z = [700, 1080, 1460, 1840, 2325];
// Kitaplık (yerel: önü −y, sırtı +y, x genişlik): baza, iki çekmece, dört göz, arkalık; gözlerde kitaplar, kutular ve
// tasarım çalışmalarına boş yerler (yer listesi döner)
function kitaplikGovde(r, { yerler, kutular, kitaplar }) {
  const { en: W, derin: D, boy: H } = PORT.kitaplik, t = 25, g = [], cek = [];
  g.push(aralik(-W / 2, -W / 2 + t, -D / 2, D / 2, 0, H), aralik(W / 2 - t, W / 2, -D / 2, D / 2, 0, H));
  g.push(aralik(-W / 2 + t, W / 2 - t, -D / 2 + 40, D / 2, 0, 80));
  for (const z of RAF_Z) g.push(aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, z, z + t));
  g.push(aralik(-W / 2 + t, W / 2 - t, D / 2 - 10, D / 2, 80, H));
  for (const [z0, z1] of [[83, 388], [391, 697]]) {
    cek.push(aralik(-W / 2 + t + 2, W / 2 - t - 2, -D / 2 - 2, -D / 2 + 18, z0, z1 - 28));
    cek.push(aralik(-W / 2 + t + 2, W / 2 - t - 2, -D / 2 + 6, -D / 2 + 18, z1 - 28, z1));
  }
  const kutu = (w, d, h, x, y, z, kapakYuz) => {
    const geo = new THREE.BoxGeometry(w, d, h);
    const yanH = ATLAS_HC(10 + Math.floor(r() * 6)), kapak = ATLAS_HC(Math.floor(r() * 10));
    for (let f = 0; f < 6; f++) hucreUV(geo, f === kapakYuz ? kapak : yanH, f);
    kutular.push(geo.translate(x, y, z));
  };
  const xMin = -W / 2 + t + 8, xMax = W / 2 - t - 8, yOn = -D / 2 + 25;
  const duzen = (gozNo, z0, bos) => {
    let x = xMin;
    const tip = gozNo % 4;
    if (tip === 0 || tip === 2) { // yatay yığın + dik dizili sırtlar
      const sw = 300 + r() * 20, sd = 300;
      let zz = z0;
      for (let k = 0; k < 3 && zz + 90 < z0 + bos; k++) { const h = 60 + r() * 30; kutu(sw - k * 14, sd - k * 10, h, x + sw / 2, yOn + sd / 2, zz + h / 2, 4); zz += h + 1; }
      x += sw + 20;
      const sinir = tip === 0 ? xMax - 260 : xMax;
      while (x < sinir - 60) { const kal = 60 + r() * 30, h = Math.min(bos - 30, 260 + r() * 40); kutu(kal, 280, h, x + kal / 2, yOn + 140, z0 + h / 2, 0); x += kal + 3; }
      if (tip === 0) yerler.push([(x + xMax) / 2 + 10, -20, z0]);
    } else { // kitaplar + öne dönük kutu kapağı + boş yer
      while (x < -60) {
        const kal = 22 + r() * 22, h = Math.min(bos - 20, 200 + r() * 70), d = 150 + r() * 60;
        kitaplar.push({ p: [x + kal / 2, yOn + d / 2, z0 + h / 2], s: [kal, d, h], e: 0 });
        x += kal + 1;
      }
      kitaplar.push({ p: [x + 40, yOn + 90, z0 + 95 * Math.cos(0.32) + 2], s: [26, 170, 190], e: -0.32 });
      x += 110;
      const fh = Math.min(bos - 30, 290), fw = 280;
      kutu(fw, 70, fh, x + fw / 2, D / 2 - 60, z0 + fh / 2, 3);
      if (x + fw + 160 < xMax) yerler.push([x + fw + 90, -40, z0]);
    }
  };
  for (let i = 0; i < 4; i++) duzen(i + Math.floor(r() * 2), RAF_Z[i] + t, RAF_Z[i + 1] - RAF_Z[i] - t);
  return { govde: g, cekmece: cek };
}
// Sol duvara: yerel önü −y → dünya +x (rotateZ +90°), arkası duvarda
const solDuvara = (geo, yc, derin) => geo.rotateZ(Math.PI / 2).translate(DUVAR_SOL + derin / 2, yc, 0);
function kitaplik(M) {
  const grup = new THREE.Group(), r = rnd(91), K = PORT.kitaplik;
  const k = { yerler: [], kutular: [], kitaplar: [] };
  const { govde, cekmece } = kitaplikGovde(r, k);
  grup.add(birlesik(govde.map((g) => solDuvara(g, K.y, K.derin)), M.mese), birlesik(cekmece.map((g) => solDuvara(g, K.y, K.derin)), M.meseKoyu));
  grup.add(birlesik(k.kutular.map((g) => solDuvara(g, K.y, K.derin)), new THREE.MeshStandardMaterial({ map: kutuAtlasi(), roughness: 0.7, envMapIntensity: 0.6 })));
  const kitapR = [0x7d3b2d, 0x2f4858, 0xd8c49a, 0x4b6043, 0xa4683a, 0x1f2f3a, 0xc2b59b, 0x6b2e3e, 0xb9a26a];
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.75, envMapIntensity: 0.6 }), k.kitaplar.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  const cx = DUVAR_SOL + K.derin / 2;
  k.kitaplar.forEach((b, i) => {
    q.setFromEuler(e.set(b.e, 0, 0)); // yaslanan kitap dünya y'si boyunca yatar
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(cx - b.p[1], K.y + b.p[0], b.p[2]), q, new THREE.Vector3(b.s[1], b.s[0], b.s[2])));
    im.setColorAt(i, c.set(kitapR[Math.floor(r() * kitapR.length)]).multiplyScalar(0.8));
  });
  im.castShadow = im.receiveShadow = true;
  im.name = 'kitaplar';
  im.userData.kitaplar = k.kitaplar.map((b) => ({ ...b, dunya: [cx - b.p[1], K.y + b.p[0], b.p[2]] }));
  grup.add(im);
  grup.userData.kitaplar = im;
  // Tıklama vekili: kitaplığın bütün hacmi (gözlerin boşluğuna tıklamak da kitaplık)
  grup.add(new THREE.Mesh(solDuvara(aralik(-K.en / 2, K.en / 2, -K.derin / 2 - 10, K.derin / 2, 0, K.boy), K.y, K.derin), new THREE.MeshBasicMaterial({ visible: false })));
  const yerler = k.yerler.map(([x, y, z]) => [cx - y, K.y + x, z]);
  return { grup, yerler };
}
// Tasarım çalışmaları rafta: Modern Balbal büstleri (v8b: boy 280 mm, taş tozu tonu) ve vazolarımız
export const BUST_BOY = 280; // v8b (kullanıcı: göründüklerinin iki katı); göz yüksekliği 355 mm
async function rafEserleri(grup, yerler, M) {
  const isler = [], bustler = ESERLER.filter((e) => e.model), eserListe = (grup.userData.eserler ??= []);
  const bustYeri = new Set(yerler.map((y, i) => [y[2], i]).filter(([z]) => z <= 1500).sort((a, c) => a[0] - c[0]).map(([, i]) => i));
  const vazolar = [['tulip', 0xece9e2], ['ribbed', 0x8fa58a], ['silk', 0xd49a9a], ['star', 0x2c3e66], ['amphora', 0xc49a3c]];
  yerler.forEach(([x, y, z], i) => {
    // v8: büstler Biggie'nin eli yetişen gözlere (z ≤ 1500; kitap_al_ust ~1395'e uzanır), alçaktan başlayarak; kalan
    // yerlere vazo (dekor)
    if (bustYeri.has(i) && bustler.length) {
      const e = bustler.shift();
      isler.push(gltf(new URL(e.model, new URL('../lab/', import.meta.url)).href).then((k) => {
        // v8 (2026-11-04, kullanıcı: büstler küçük): her büstün boyu (z) BUST_BOY (önce en büyük kenar 180: uzun-dar büstler
        // küçük kalıyordu); tabanı 200 mm'yi aşan olursa göze sığsın diye o kadar küçülür. Kabın orijini büstün ortası:
        // Biggie elinde çevirince kendi ekseninde döner (core/oda-sunum.js bustAl). v8b: boy 280, taban en çok 300
        const s = k.scene, b = new THREE.Box3().setFromObject(s), boy = b.getSize(new THREE.Vector3());
        s.scale.setScalar(Math.min(BUST_BOY / Math.max(boy.z, 1), 300 / Math.max(boy.x, boy.y, 1)));
        const b2 = new THREE.Box3().setFromObject(s), c = b2.getCenter(new THREE.Vector3()), yari = (b2.max.z - b2.min.z) / 2;
        s.position.set(-c.x, -c.y, -b2.min.z - yari);
        const tas = new THREE.MeshStandardMaterial({ color: e.ton ?? 0xd9d5cd, roughness: 0.82, map: M.tasDoku, envMapIntensity: 0.6 });
        s.traverse((o) => { if (o.isMesh) { o.material = tas; o.castShadow = o.receiveShadow = true; } });
        const kap = new THREE.Group();
        kap.add(s);
        kap.position.set(x, y, z + yari);
        kap.rotation.z = Math.PI / 2 + (i % 4 - 1.5) * 0.18; // yüzü odaya (+x; çatıdaki batı duvarıyla aynı yön)
        kap.userData.parca = { tur: 'eser', ad: e.id, bust: true, eser: e }; // v8: yalnız büstler tıklanır
        grup.add(kap);
        eserListe.push(kap);
      }).catch((err) => console.warn('büst', e.id, err)));
    } else {
      const [id, renk] = vazolar[i % vazolar.length];
      const v = vaseModel(id, { color: renk }, { malzeme: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, envMapIntensity: 0.7 }) });
      v.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      const boy = new THREE.Box3().setFromObject(v).getSize(new THREE.Vector3());
      if (boy.z > 300) v.scale.setScalar(300 / boy.z);
      v.position.set(x, y, z);
      v.userData.parca = { tur: 'vazo', ad: id }; // v8: dekor (tıklanmaz)
      grup.add(v);
      eserListe.push(v);
    }
  });
  await Promise.all(isler);
}

// ---- kutu oyunu rafı: ekranın altında üç gözlü küp raf (TV sehpası) ve 8 kapalı kutu ----
// Kutular gerçek oyun kutusu ölçülerinde (mm, g × d × y): büyük kare 298 × 298 × 73 ve 300 × 300 × 80, orta kare
// 270 × 270 × 75 ve 255 × 255 × 65, uzun 315 × 225 × 75, kart oyunu 190 × 130 × 45 ve 165 × 120 × 42. Kapak görseli yok:
// düz renk, kapakta desen ve OKTOS, sırtta yazı (dik kutuda dikine). Adlar yok (kullanıcının oyun adları elde değil).
const KR = { t: 38, ara: 16, goz: 339 };           // dış çerçeve ve ara bölme kalınlığı, göz eni (göz 339 × 344)
const OYUN_RENK = ['#b8372f', '#2f4858', '#e8c48c', '#4b6043', '#8b5a7a', '#d4621f', '#3c6e8f', '#c9a3a0', '#1f2f3a', '#9fb7b0'];
// Yerleşim (göz 0, 1, 2: yerel x'te soldan sağa; sağ duvarda göz 0 buzdolabı yanında, göz 2 kameraya yakın; yerel ölçü
// [x, y, z] = [genişlik, derinlik, boy]; tur: 'dik' sırtı öne dik, 'yatay' kapağı yukarı yığın, 'kapak' kapağı öne
// dönük vitrin)
const OYUNLAR = [
  { goz: 0, olcu: [300, 300, 80], tur: 'yatay' }, { goz: 0, olcu: [270, 270, 75], tur: 'yatay' }, { goz: 0, olcu: [255, 255, 65], tur: 'yatay' },
  { goz: 0, olcu: [190, 130, 45], tur: 'yatay' },
  { goz: 1, olcu: [298, 73, 298], tur: 'kapak' },
  { goz: 2, olcu: [73, 298, 298], tur: 'dik' }, { goz: 2, olcu: [80, 300, 300], tur: 'dik' }, { goz: 2, olcu: [75, 270, 270], tur: 'dik' },
];
// Atlas: kutu başına iki hücre (kapak, sırt), 5 × 4 hücre, 256 px. Hücreye mm ölçüsünde çizilir (yüzün oranı korunur)
function oyunAtlasi() {
  const S = 256, [c, g] = kanvas(S * 5, S * 4);
  const hucre = (i) => [(i % 5) * S, Math.floor(i / 5) * S];
  const mmCiz = (i, wmm, hmm, f) => {
    const [x0, y0] = hucre(i);
    g.save();
    g.beginPath(); g.rect(x0, y0, S, S); g.clip();
    g.setTransform(S / wmm, 0, 0, S / hmm, x0, y0);
    f(wmm, hmm);
    g.restore();
  };
  const yazi = (s, px, w, kalin = 700) => { g.font = `${kalin} ${px}px "Big Shoulders Display", "Schibsted Grotesk", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; };
  OYUNLAR.forEach((o, i) => {
    const renk = OYUN_RENK[i], acik = ['#e8c48c', '#c9a3a0', '#9fb7b0'].includes(renk), murekkep = acik ? '#1d1f22' : '#f3eee5';
    const [w, d, h] = o.olcu;
    // Kapak (üst yüz; 'kapak' turunda öne bakan yüz): zemin, köşelerde ince çerçeve, ortada OKTOS
    const [kw, kh] = o.tur === 'kapak' ? [w, h] : [w, d];
    mmCiz(i * 2, kw, kh, (W, H) => {
      g.fillStyle = renk; g.fillRect(0, 0, W, H);
      g.strokeStyle = murekkep; g.globalAlpha = 0.35; g.lineWidth = 3;
      for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(W / 2, H * 0.42, (Math.min(W, H) * k) / 11, 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1; g.lineWidth = 4; g.strokeRect(10, 10, W - 20, H - 20);
      g.fillStyle = murekkep; yazi('', Math.min(W, H) * 0.16, W); g.fillText('OKTOS', W / 2, H * 0.78);
    });
    // Sırt (yan yüzler): dikte uzun kenar düşey, yazı dikine; yatayda uzun kenar yatay
    const dik = o.tur === 'dik';
    const [sw, sh] = dik ? [w, h] : o.tur === 'kapak' ? [w, d] : [w, h];
    mmCiz(i * 2 + 1, sw, sh, (W, H) => {
      g.fillStyle = renk; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, W, H * 0.08); g.fillRect(0, H * 0.92, W, H * 0.08);
      g.fillStyle = murekkep;
      if (dik) { // yazı aşağıdan yukarı
        g.translate(W / 2, H / 2); g.rotate(-Math.PI / 2);
        yazi('', W * 0.42, H); g.fillText('OKTOS', -H * 0.12, 0);
        g.font = `500 ${W * 0.22}px "IBM Plex Mono", monospace`; g.fillText(String(i + 1).padStart(2, '0'), H * 0.34, 0);
      } else {
        yazi('', H * 0.5, W); g.fillText('OKTOS', W / 2 - W * 0.08, H / 2);
        g.font = `500 ${H * 0.3}px "IBM Plex Mono", monospace`; g.fillText(String(i + 1).padStart(2, '0'), W * 0.85, H / 2);
      }
    });
  });
  const t = doku(c);
  t.userData.hucre = (i) => { const [x, y] = hucre(i); return [x / (S * 5) + 0.002, 1 - (y + S) / (S * 4) + 0.002, (x + S) / (S * 5) - 0.002, 1 - y / (S * 4) - 0.002]; };
  return t;
}
// Sağ duvara: yerel önü −y → dünya −x (rotateZ −90°; yerel +x dünya −y'ye, kameraya doğru), arkası duvarda
const sagDuvara = (geo, yc, derin) => geo.rotateZ(-Math.PI / 2).translate(DUVAR_SAG - derin / 2, yc, 0);
function oyunRafi(M) {
  const grup = new THREE.Group(), R = PORT.oyunRafi, { t, ara, goz: GE } = KR;
  const W = R.en, D = R.derin, H = R.boy, g = [];
  g.push(aralik(-W / 2, -W / 2 + t, -D / 2, D / 2, 0, H), aralik(W / 2 - t, W / 2, -D / 2, D / 2, 0, H));
  g.push(aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, 0, t), aralik(-W / 2 + t, W / 2 - t, -D / 2, D / 2, H - t, H));
  for (const k of [1, 2]) { const x = -W / 2 + t + k * GE + (k - 0.5) * ara; g.push(aralik(x - ara / 2, x + ara / 2, -D / 2, D / 2, t, H - t)); }
  g.push(aralik(-W / 2 + t, W / 2 - t, D / 2 - 6, D / 2, t, H - t)); // arkalık
  grup.add(birlesik(g.map((x) => sagDuvara(x, R.y, R.derin)), M.beyazRaf));
  // Kutular: göz içinde öne yakın, sırtları gözün ön kenarından ~20 mm içeride
  const atlas = oyunAtlasi(), hc = atlas.userData.hucre, kutular = [];
  const goz = (i) => { const x0 = -W / 2 + t + i * (GE + ara); return { x0, x1: x0 + GE, z0: t }; };
  const imlec = [0, 0, 0], kutuM = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.55, envMapIntensity: 0.7 });
  // 2026-11-03 v5: her kutu ayrı ağ (tıklanır, Biggie eline alıp rafın üstüne koyar); yerel (raf) konumu sağ duvara
  // çevrilir: dünya = (y + DUVAR_SAG − D/2, −x + R.y, z), dönüş z −90°
  const wq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
  OYUNLAR.forEach((o, i) => {
    const G = goz(o.goz), [w, d, h] = o.olcu, geo = new THREE.BoxGeometry(w, d, h);
    for (let f = 0; f < 6; f++) hucreUV(geo, hc(i * 2 + 1), f);
    hucreUV(geo, hc(i * 2), o.tur === 'kapak' ? 3 : 4); // kapak: üst yüz (+z) ya da öne bakan (−y)
    const yOn = -D / 2 + 20;
    let x, z;
    if (o.tur === 'dik') { x = G.x0 + 12 + imlec[o.goz] + w / 2; imlec[o.goz] += w + 4; z = G.z0 + h / 2; }
    else if (o.tur === 'kapak') { x = (G.x0 + G.x1) / 2; z = G.z0 + h / 2; }
    else { x = (G.x0 + G.x1) / 2 + (w < 200 ? 50 : 0); z = G.z0 + imlec[o.goz] + h / 2; imlec[o.goz] += h + 1; }
    const y = o.tur === 'kapak' ? D / 2 - 30 - d / 2 : yOn + d / 2 + (o.tur === 'yatay' ? 10 : 0);
    if (o.tur === 'kapak') geo.rotateX(-0.06); // vitrinde arkaya hafif yaslı
    const m = new THREE.Mesh(geo, kutuM);
    m.castShadow = m.receiveShadow = true;
    m.name = `oyun-${i + 1}`;
    m.position.set(y + DUVAR_SAG - D / 2, -x + R.y, z);
    m.quaternion.copy(wq);
    // Rafın üstünde yatık duruş: kapağı yukarı (dik kutu yerel y'de, vitrindeki x'te 90° döner); boyu en kısa kenar
    const yat = new THREE.Quaternion();
    if (o.tur === 'dik') yat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    else if (o.tur === 'kapak') yat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    m.userData.parca = { tur: 'oyun', no: i, yuva: { p: m.position.clone(), q: m.quaternion.clone() }, ustQ: wq.clone().multiply(yat), kalin: Math.min(w, d, h) };
    kutular.push(m);
  });
  grup.add(...kutular);
  grup.userData.kutular = kutular;
  // Tıklama vekili: rafın bütün hacmi
  grup.add(new THREE.Mesh(sagDuvara(aralik(-W / 2, W / 2, -D / 2 - 10, D / 2, 0, H), R.y, R.derin), new THREE.MeshBasicMaterial({ visible: false })));
  return grup;
}

const yaziTipleri = () => Promise.race([
  Promise.all(['700 74px "Big Shoulders Display"', '500 44px "Schibsted Grotesk"', '500 26px "IBM Plex Mono"'].map((f) => document.fonts?.load(f))),
  new Promise((r) => setTimeout(r, 1500)),
]).catch(() => {});

// ---- çöp kovası: pedallı, mat çelik (Biggie'nin elma atışı) ----
function copKovasi() {
  const C = PORT.cop, g = new THREE.Group();
  const govdeM = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 0.75, roughness: 0.35, envMapIntensity: 0.8 });
  const siyah = new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.6 });
  const govde = new THREE.Mesh(new THREE.CylinderGeometry(C.r, C.r - 8, C.boy - 30, 40, 1, true).rotateX(Math.PI / 2).translate(0, 0, (C.boy - 30) / 2 + 12), govdeM);
  const taban = new THREE.Mesh(new THREE.CylinderGeometry(C.r - 6, C.r - 6, 12, 40).rotateX(Math.PI / 2).translate(0, 0, 6), siyah);
  const kapak = new THREE.Mesh(new THREE.CylinderGeometry(C.r + 3, C.r + 3, 18, 40).rotateX(Math.PI / 2).translate(0, 0, C.boy - 9), govdeM);
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(90, 50, 14).translate(0, -C.r - 18, 18), siyah);
  for (const m of [govde, taban, kapak, pedal]) { m.castShadow = m.receiveShadow = true; g.add(m); }
  g.position.set(C.x, C.y, 0);
  g.rotation.z = -1.1; // pedalı odaya dönük
  g.userData.agiz = [C.x, C.y, C.boy]; // elmanın düşeceği yer (dünya, mm)
  return g;
}

// ---- kurulum ----
// İki adım (2026-11-03; telefonda açılış süresi): portfolyoIskelet(scene) sahne kurulurken anında döner: her durağın boş
// grubu, tıklama ve kadraj için görünmez hacim vekili (gerçek ölçüde) ve işaretçi yerleri; doldur() sahne hazır olduktan
// sonra (sayfa onReady'de api.portfolyo.yukle()) asıl eşyaları parça parça, aralarda ana iş parçacığını bırakarak kurar.
// Tek kurulumda telefonun "hazır" süresi %39 uzuyordu (doku üretimi, birleştirme, 13 yeni gölgelendirici).
// Döner: { nesne: { kitaplik, oyunlar, ekran, armut, cop }, yerler, ekran (TV denetçisi; doldurulunca), doldur(), update(t) }
const vekilM = new THREE.MeshBasicMaterial({ visible: false });
const vekil = (x0, x1, y0, y1, z0, z1) => new THREE.Mesh(aralik(x0, x1, y0, y1, z0, z1), vekilM);
// hafif (telefon katmanı, core/story.js): kilim dokusu küçük; her yerde: ekranın süreç videosu yalnız ekran kadrajdayken
// dokuya çizilir (telefonun genel planında ekran görünmez; her video karesinde kanvas çizimi + doku yüklemesi)
export function portfolyoIskelet(scene, { lang = 'tr', reduce = false, hafif = false } = {}) {
  const KT = PORT.kitaplik, OR = PORT.oyunRafi, E = PORT.ekran, C = PORT.cop, AR = PORT.armut;
  const ekranH = 963 * E.olcek, ekranW = 1671 * E.olcek;
  const grup = (...v) => { const g = new THREE.Group(); if (v.length) g.add(...v); scene.add(g); return g; };
  const nesne = {
    kitaplik: grup(vekil(DUVAR_SOL, DUVAR_SOL + KT.derin + 10, KT.y - KT.en / 2, KT.y + KT.en / 2, 0, KT.boy)),
    oyunlar: grup(vekil(DUVAR_SAG - OR.derin - 10, DUVAR_SAG, OR.y - OR.en / 2, OR.y + OR.en / 2, 0, OR.boy)),
    ekran: grup(vekil(ROOM.x1 - 50, ROOM.x1, E.y - ekranW / 2, E.y + ekranW / 2, E.z, E.z + ekranH)),
    // v8: armut koltuk durağı (Hakkımda): armudun hacmi (tıklama ve kadraj); armudun kendisi doldur()'da
    armut: grup(vekil(AR.x - 450, AR.x + 450, AR.y - 450, AR.y + 450, 0, 1050)),
    cop: grup(),
  };
  nesne.cop.userData.agiz = [C.x, C.y, C.boy]; // elmanın düşeceği yer (dünya, mm)
  const yerler = {
    kitaplik: [DUVAR_SOL + KT.derin + 30, KT.y, 1980],
    oyunlar: [DUVAR_SAG - OR.derin - 30, OR.y + OR.en / 2 - 170, OR.boy + 60],
    ekran: [ROOM.x1 - 120, E.y, E.z + ekranH + 50],
    armut: [AR.x + 60, AR.y, 1180],
  };
  let ekranGoruldu = -1e9; // ekranın ağlarından biri son çizildiğinde (onBeforeRender yalnız kadrajdaki ağda çağrılır)
  // parcalar(): tıklanabilir küçük eşyalar (2026-11-03 v5; core/oda-sunum.js): rafın kutuları, kitaplığın eserleri ve kitapları
  const P = { nesne, yerler, ekran: null, dolu: false, armut: null,
    parcalar() {
      const kit = nesne.kitaplik.children.find((c) => c.userData.kitaplar), raf = nesne.oyunlar.children.find((c) => c.userData.kutular);
      return { oyun: raf?.userData.kutular ?? [], eser: kit?.userData.eserler ?? [], kitap: kit?.userData.kitaplar ?? null };
    }, update(t) { if (performance.now() - ekranGoruldu < 500) P.ekran?.update?.(t); } };
  let soz = null;
  // derle(nesne, sahne) → Promise (core/story.js story.derle): her parça sahneye girmeden önce gölgelendiricileri paralel
  // derlenir; yoksa ilk göründüğü karede eşzamanlı derleniyordu (telefon taklidinde genel plana dönüşte ~250 ms donma)
  P.doldur = (derle = null) => (soz ??= (async () => {
    const hazir = async (o) => { if (derle) await derle(o, scene).catch(() => {}); return o; };
    const [ekranM, kilimM] = await Promise.all([modul('./cati-ekran.js'), modul('./cati-kilim.js'), yaziTipleri()]);
    const M = {
      mese: new THREE.MeshStandardMaterial({ color: 0xffffff, map: ahsapDoku(21, { renk: [196, 160, 112] }), roughness: 0.6, envMapIntensity: 0.6 }),
      meseKoyu: new THREE.MeshStandardMaterial({ color: 0xe8e0d6, map: ahsapDoku(22, { renk: [186, 148, 100] }), roughness: 0.55, envMapIntensity: 0.6 }),
      beyazRaf: new THREE.MeshStandardMaterial({ color: 0xece9e3, roughness: 0.55, envMapIntensity: 0.6 }),
      tasDoku: kumDoku(43),
    };
    M.koyuAhsap = new THREE.MeshStandardMaterial({ color: 0x8a6440, map: M.mese.map, roughness: 0.7, envMapIntensity: 0.5 });
    // Sağ duvar önce (ekran ve altındaki kutu oyunları): telefonun açılış kadrajına en yakın
    if (ekranM?.oledEkran) {
      P.ekran = ekranM.oledEkran({ lang, reduce, adimlar: SUREC });
      const tv = P.ekran.grup;
      tv.scale.setScalar(E.olcek);
      tv.position.set(ROOM.x1, E.y, E.z); // grubun yerel y = 0 duvar yüzeyi
      tv.rotation.z = -Math.PI / 2;       // önü yerel −y → dünya −x (odaya)
      nesne.ekran.add(await hazir(tv));
      tv.traverse((o) => {
        if (!o.isMesh) return;
        const once = o.onBeforeRender;
        o.onBeforeRender = function (...a) { ekranGoruldu = performance.now(); return once.apply(this, a); };
      });
    }
    await yieldMain();
    nesne.oyunlar.add(await hazir(oyunRafi(M)));
    nesne.cop.add(await hazir(tiklanmaz(copKovasi())));
    await yieldMain();
    const kit = kitaplik(M);
    nesne.kitaplik.add(await hazir(kit.grup));
    const eserler = rafEserleri(kit.grup, kit.yerler, M);
    await yieldMain();
    // Armut koltuk: çatıdaki model yeniden kullanılır (yeni üretim yok); tıklanmaz (TV durağının oturağı)
    const esyaM = await modul('./cati-esya.js');
    if (esyaM?.armut) {
      const A = PORT.armut, a = esyaM.armut({ seed: 1 });
      a.position.set(A.x, A.y, 0);
      a.rotation.z = A.rz;
      scene.add(await hazir(tiklanmaz(a)));
      P.armut = a;
    }
    await yieldMain();
    const L = PORT.kilim;
    const kil = kilimM?.kilim ? kilimM.kilim({ en: L.en, boy: L.boy, seed: 23, ...(hafif ? { dokuMaks: 1400 } : {}) }) : null;
    if (kil) {
      kil.position.set(L.x, L.y, 0);
      kil.rotation.z = Math.PI / 2; // uzun kenarı y boyunca
      scene.add(await hazir(tiklanmaz(kil)));
    }
    await eserler;
    P.dolu = true;
    return P;
  })());
  return P;
}

// Kartın ek içeriği için (oda/index.html → core/cati-panel.js) hakkımda yazısı ve süreç burada da erişilir
export { HAKKIMDA, SUREC };
