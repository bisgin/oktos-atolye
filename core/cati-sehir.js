// Çatı katının dışarısı: gökyüzü kubbesi, kümülüs bulutlar, puslu uzak şehir silüeti, sokaklar, bitişik nizam apartmanlar
// (Ankara: farklı kat sayısı, renk, pencere ritmi ve çatı tipi; cepheler sokak hizasında) ve bizim binanın cephesi.
// Kullanım (core/cati-sahne.js buildScene): const dis = await disarisi(scene, { reduce }); update(time) içinde dis.update(time).
// Dönen nesne: { grup (şehir ağları), sure (kurulum süreleri, ms), update(time) (bulutlar çok yavaş kayar; reduce'da durur) }.
// Gökyüzünü, pusu (scene.fog), arka planı ve ortam ışığını (ortam.webp) bu modül kurar; motorun güneşi ve yarıküre ışığı
// şehri de aydınlatır. Önizleme: .impeccable/onizleme/sehir.html?kam=1..4 (yerel, depoya girmez).
// Koordinat: çatı çerçevesi, birim mm, Z yukarı, +x doğu, +y kuzey, teras döşemesi z = 0. Orta kattaki odayla ortak:
// çatı (x, y, z) = oda (x, y + 680, z − 9000). Karşı bina scripts/oda-blender.py karsi_kur ile aynı (konum, 4 m'lik
// bölmeler, kat kotları, balkon düzeni, krem sıva); yalnız çatısı burada ayrıntılanır (yukarıdan görünür).
// Bizim binanın z > −10 hacmine bir şey konmaz (çatı odası orada).
// Gölge: şehir gölge düşürmez, almaz (motorun gölge kamerası yalnız terası kapsar). Biçim şöyle verilir: güneşin gölgeleri
// düz çatılara dokuyla pişer (çatı atlası: her çatıya bir bölge; parapet, kule, depo, kolektör, komşu kütle gölgesi ve
// dip kararması), sokak ve bahçelere binaların gölgesi bir gölge haritasıyla çarpılır, cephelerde balkon altı ve saçak
// altı yarı saydam koyu bantlarla (sahte AO).
// Çizim çağrısı malzeme başına bir: aynı malzemedeki bütün parçalar tek ağda birleşir. Yakın binaların pencere ve
// balkonları geometri; uzak sıraların cepheleri tek doku atlasından (8 cephe tipi × 8 çeşit; hücre = bir aks × bir kat;
// çeşit gölgelendiricide aks ve kat başına rastgele seçilir, renk köşe renginden).
// Kamera uzağı: şehir ve gökyüzü 30 m'den öteye uzanır. Motorun kamerası (far 30000) her çizimden önce SEHIR.kameraUzak'a
// çekilir (scene.onBeforeRender kancası); motor kendi far'ını büyütürse kanca bir şey yapmaz.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toSun } from './oda-olcu.js';

const KOK = new URL('../assets/', import.meta.url).href;
const Z0 = -15000; // sokak kotu (asfalt üstü)
const DEG = Math.PI / 180;

// ---- ölçüler ----
export const SEHIR = {
  sokak: Z0,                                   // asfalt üstü
  kaldirim: 150,                               // kaldırım yüksekliği
  bizimKaldirim: [2600, 5080],                 // y aralıkları (sokak doğu-batı uzanır)
  asfalt: [5080, 13180],
  karsiKaldirim: [13180, 15680],
  bizim: { x0: -6200, x1: 3600, y0: -12000, y1: 2600, ust: -10, kat: 3000 },   // 5 kat konut, kuzey cephe sokağa
  balkon: { x0: -150, x1: 1950, y0: 2600, y1: 4100, z: -9000 },                // orta kattaki odanın balkonu
  karsi: { y: 15680, y1: 27680, x0: -10000, x1: 14000, bolme: 4000, katlar: [-12000, -9000, -6000], cati: -3000, parapet: -2200 },
  doguKomsu: { x0: 3600, x1: 14000, cati: -3000 },
  batiKomsu: { x0: -18000, x1: -6200, cati: -3000 },
  araSokak: [32000, 44000],                    // kuzey-güney ara sokak (x aralığı, kaldırımlar dahil)
  pus: 0xd5d8dc,
  sis: [20000, 115000],                        // karşı bina (16–28 m) net, arka sıralar puslu
  kameraUzak: 165000,
  gok: 145000, bulut: 122000, siluet: 108000,  // kubbe, bulut kartları ve silüet şeridinin yarıçapı
};

// Güneş (oda-olcu.js SUN): gölge, yükseklik başına (−GX, −GY) kayar
const GUNES = toSun();
const GX = GUNES[0] / GUNES[2], GY = GUNES[1] / GUNES[2];

// ---- yardımcılar ----
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
function doku(c, { tekrar = false, srgb = true, mip = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (tekrar) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  t.anisotropy = 8;
  return t;
}
// sRGB onaltılık → doğrusal köşe rengi (k: ton çarpanı)
const renk = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const css = (r) => `rgb(${r.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;

const P = {
  karsiSiva: renk(0xe9d6bb), bizimSiva: renk(0xece4d6), beton: renk(0xb3aea6), betonAcik: renk(0xcac5bb),
  mermer: renk(0xdcd7cd), pvc: renk(0xe6e6e3), koyu: renk(0x232427), perde: renk(0xcfc9bc), cam: renk(0x0d1014),
  vitrin: renk(0x41474e), kapi: renk(0x3c4a43), metal: renk(0x8e9296), pas: renk(0x6a5f57), alu: renk(0xb5b9bc),
  tank: renk(0xeceee9), kolektor: renk(0x18233c), yaprak: renk(0x4f6c36), saksi: renk(0x9a5232), ahsap: renk(0x8a6142),
  antrasit: renk(0x35383c), kiremitKoyu: renk(0x8c4630), ip: renk(0x2a2a2a), canak: renk(0xd4d6d6),
};
const BEYAZ = [1, 1, 1];
const CAMASIR = [0xf2f2ee, 0x3d5fa0, 0xc8463a, 0xe8d36a, 0x6b8e5a, 0xe9b7c4, 0x2d2f36, 0x8fb6d8, 0xf2f2ee, 0xd98c3a].map((h) => renk(h));
const PALET = [0xe8dcc4, 0xead79e, 0xdfae94, 0xe6c3b8, 0xd9d9d4, 0xefece4, 0xc9d4b6, 0xe3c48f, 0xc8d2db, 0xd59e80, 0xe4d2b4, 0xbfc9b5, 0xf0e2c8, 0xd2b8a2, 0xe9cf9a, 0xc98f74];

// Dünya ölçüsünde UV (yüzün normaline göre iki eksen): dokular her parçada aynı yoğunlukta
function dunyaUV(g, olcek) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [a, b] = az >= ax && az >= ay ? [p.getX(i), p.getY(i)] : ax >= ay ? [p.getY(i), p.getZ(i)] : [p.getX(i), p.getZ(i)];
    uv.setXY(i, a / olcek, b / olcek);
  }
  return g;
}

// Üçgen ya da dörtgen yüz: k köşeler (çevre sırasıyla), yon dış yön ipucu (dolanım ve normal ona göre), uv köşe başına,
// ek: [[ad, köşe başına değerler, boyut], ...]
function yuz(k, yon, uv = null, ek = []) {
  const [a, b, c] = k;
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const ters = n[0] * yon[0] + n[1] * yon[1] + n[2] * yon[2] < 0;
  const L = Math.hypot(...n) || 1;
  n = n.map((v) => (ters ? -v : v) / L);
  const sira = k.length === 4 ? (ters ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]) : (ters ? [0, 2, 1] : [0, 1, 2]);
  const pos = [], nor = [], uvs = [];
  for (const i of sira) { pos.push(...k[i]); nor.push(...n); uvs.push(...(uv ? uv[i] : [0, 0])); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  for (const [ad, deger, boy] of ek) { const v = []; for (const i of sira) v.push(...deger[i]); g.setAttribute(ad, new THREE.Float32BufferAttribute(v, boy)); }
  return g;
}

// 2B dışbükey zarf (Andrew)
function zarf(p) {
  const q = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (q.length < 3) return q;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const alt = [], ust = [];
  for (const v of q) { while (alt.length >= 2 && cr(alt[alt.length - 2], alt[alt.length - 1], v) <= 0) alt.pop(); alt.push(v); }
  for (let i = q.length - 1; i >= 0; i--) { const v = q[i]; while (ust.length >= 2 && cr(ust[ust.length - 2], ust[ust.length - 1], v) <= 0) ust.pop(); ust.push(v); }
  ust.pop(); alt.pop();
  return alt.concat(ust);
}
// Noktanın güneş doğrultusunda zp düzlemine izdüşümü
const izdus = (x, y, z, zp) => { const h = Math.max(0, z - zp); return [x - h * GX, y - h * GY]; };
function kutuGolgesi(x0, x1, y0, y1, z0, z1, zp) {
  if (z1 <= zp) return null;
  const za = Math.max(z0, zp), p = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) p.push(izdus(x, y, za, zp), izdus(x, y, z1, zp));
  return zarf(p);
}

// ---- parça toplayıcı: malzeme adına göre geometri listeleri, sonda malzeme başına tek ağ ----
class Toplu {
  constructor() { this.l = {}; }
  ekle(ad, g, r = BEYAZ, ao = 0) {
    if (g.index) g = g.toNonIndexed();
    const p = g.attributes.position, n = p.count, c = new Float32Array(n * 3);
    let za = Infinity, zb = -Infinity;
    if (ao) for (let i = 0; i < n; i++) { const z = p.getZ(i); if (z < za) za = z; if (z > zb) zb = z; }
    for (let i = 0; i < n; i++) {
      const k = ao ? 1 - ao * (1 - (p.getZ(i) - za) / Math.max(1, zb - za)) : 1; // dibe doğru kararma (sahte AO)
      c[i * 3] = r[0] * k; c[i * 3 + 1] = r[1] * k; c[i * 3 + 2] = r[2] * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    (this.l[ad] ??= []).push(g);
    return g;
  }
  kutu(ad, x0, x1, y0, y1, z0, z1, r = BEYAZ, uv = 0, ao = 0) {
    if (x1 - x0 < 0.5 || y1 - y0 < 0.5 || z1 - z0 < 0.5) return null;
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (uv) dunyaUV(g, uv);
    return this.ekle(ad, g, r, ao);
  }
  silindir(ad, x, y, z0, z1, r, seg, renkK = BEYAZ, r2 = r) {
    return this.ekle(ad, new THREE.CylinderGeometry(r2, r, z1 - z0, seg).rotateX(Math.PI / 2).translate(x, y, (z0 + z1) / 2), renkK);
  }
  // İki nokta arasında çubuk (direk, ip, boru)
  cubuk(ad, a, b, r, seg, renkK = BEYAZ) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
    if (L < 1) return null;
    const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true).translate(0, L / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    return this.ekle(ad, g.translate(A.x, A.y, A.z), renkK);
  }
  matris(ad, g, m, renkK) { g.applyMatrix4(m); return this.ekle(ad, g, renkK); }
  // Atlas cephesi: yon yüzün dış normali ('-y', '+y', '-x', '+x'), d yüz düzlemi; a0..a1 yüz boyunca, z0..z1; hücre
  // ızgarası aB, zB'den başlar, hücre aks × kat; tip atlas satırı, tohum çeşit karışımı; r duvar rengi
  cephe(yon, d, a0, a1, z0, z1, aB, zB, aks, kat, tip, tohum, r) {
    if (a1 - a0 < 1 || z1 - z0 < 1) return;
    const n = { '-y': [0, -1, 0], '+y': [0, 1, 0], '-x': [-1, 0, 0], '+x': [1, 0, 0] }[yon];
    const P3 = (a, z) => (yon[1] === 'y' ? [a, d, z] : [d, a, z]);
    const k = [P3(a0, z0), P3(a1, z0), P3(a1, z1), P3(a0, z1)];
    const u = (a) => (a - aB) / aks, v = (z) => (z - zB) / kat;
    const g = yuz(k, n, [[u(a0), v(z0)], [u(a1), v(z0)], [u(a1), v(z1)], [u(a0), v(z1)]],
      [['color', [r, r, r, r], 3], ['hucre', Array(4).fill([tip, tohum]), 2]]);
    (this.l.cephe ??= []).push(g);
  }
  // Sahte AO bandı: dört köşe ve köşe başına koyuluk (0..1); iki yüzlü, ışıksız
  golge(k, alfa) {
    const g = yuz(k, [0, 0, 0], null, [['color', alfa.map((a) => [0.03, 0.03, 0.04, a]), 4]]);
    (this.l.golge ??= []).push(g);
  }
}

// Cephe çerçevesi: a yüz boyunca, b yüzden dışarı (mm), z yukarı; yon dış normal, d yüz düzlemi
function cerceve(T, yon, d) {
  const xy = {
    '-y': (a0, a1, b0, b1) => [a0, a1, d - b1, d - b0],
    '+y': (a0, a1, b0, b1) => [a0, a1, d + b0, d + b1],
    '+x': (a0, a1, b0, b1) => [d + b0, d + b1, a0, a1],
    '-x': (a0, a1, b0, b1) => [d - b1, d - b0, a0, a1],
  }[yon];
  const nokta = (a, b, z) => (yon === '-y' ? [a, d - b, z] : yon === '+y' ? [a, d + b, z] : yon === '+x' ? [d + b, a, z] : [d - b, a, z]);
  return {
    nokta,
    kutu: (ad, a0, a1, b0, b1, z0, z1, r, uv, ao) => { const [x0, x1, y0, y1] = xy(Math.min(a0, a1), Math.max(a0, a1), b0, b1); return T.kutu(ad, x0, x1, y0, y1, z0, z1, r, uv, ao); },
    // Blender karsi_kur kutusu gibi: genişlik, derinlik, yükseklik, a merkezi, b merkezi, alt z
    k: (ad, w, bd, h, ca, cb, z0, r) => { const [x0, x1, y0, y1] = xy(ca - w / 2, ca + w / 2, cb - bd / 2, cb + bd / 2); return T.kutu(ad, x0, x1, y0, y1, z0, z0 + h, r); },
    // yüze paralel koyu bant (b: yüzden uzaklık), alfa alt ve üst kenarda
    golge: (a0, a1, b, z0, z1, alt, ust) => T.golge([nokta(a0, b, z0), nokta(a1, b, z0), nokta(a1, b, z1), nokta(a0, b, z1)], [alt, alt, ust, ust]),
  };
}

// ---- çatı atlası: her düz çatıya bir doku bölgesi; zemin malzemesi, lekeler, dip kararması ve pişmiş güneş gölgesi ----
class Cati {
  constructor(x0, x1, y0, y1, z, tip, mm, tohum) { Object.assign(this, { x0, x1, y0, y1, z, tip, mm, tohum, golgeler: [], izler: [], inceler: [], yollar: [] }); }
  kutu(x0, x1, y0, y1, z0, z1, iz = true) {
    const p = kutuGolgesi(x0, x1, y0, y1, z0, z1, this.z);
    if (p) this.golgeler.push(p);
    if (iz && z0 <= this.z + 80) this.izler.push([x0, x1, y0, y1]);
  }
  noktalar(p3, iz = null) { this.golgeler.push(zarf(p3.map(([x, y, z]) => izdus(x, y, z, this.z)))); if (iz) this.izler.push(iz); }
  silindir(x, y, z0, z1, r, iz = true) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p.push([x + r * Math.cos(a), y + r * Math.sin(a), z0], [x + r * Math.cos(a), y + r * Math.sin(a), z1]); }
    this.noktalar(p, iz && z0 <= this.z + 80 ? [x - r, x + r, y - r, y + r] : null);
  }
  cizgi(a, b, kal) { this.inceler.push([izdus(...a, this.z), izdus(...b, this.z), kal]); }
}

class CatiAtlasi {
  constructor() { this.l = []; }
  ekle(x0, x1, y0, y1, z, tip, mm = 100, tohum = 1) { const c = new Cati(x0, x1, y0, y1, z, tip, mm, tohum); this.l.push(c); return c; }
  // Yerleştir, boya, çatı düzlemlerini 'cati' listesine ekle; komşu kütleler (kutleler) de gölge düşürür
  ciz(T, kutleler) {
    const W = 2048, pad = 4;
    for (const c of this.l) { c.pw = Math.ceil((c.x1 - c.x0) / c.mm) + 2 * pad; c.ph = Math.ceil((c.y1 - c.y0) / c.mm) + 2 * pad; }
    const sirali = [...this.l].sort((a, b) => b.ph - a.ph);
    let x = 0, y = 0, satir = 0;
    for (const c of sirali) {
      if (x + c.pw > W) { x = 0; y += satir; satir = 0; }
      c.px = x; c.py = y; x += c.pw; satir = Math.max(satir, c.ph);
    }
    const H = Math.min(2048, Math.ceil((y + satir) / 16) * 16); // yalnız dolu satırlar (WebGL2: 2'nin kuvveti gerekmez)
    const [cv, g] = kanvas(W, H);
    const desen = desenler();
    for (const c of this.l) {
      const s = 1 / c.mm, w = (c.x1 - c.x0) * s, h = (c.y1 - c.y0) * s, r = rnd(c.tohum * 97 + 13);
      const X = (xx) => (xx - c.x0) * s, Y = (yy) => (c.y1 - yy) * s;
      g.save();
      g.translate(c.px + pad, c.py + pad);
      g.beginPath(); g.rect(-pad, -pad, w + 2 * pad, h + 2 * pad); g.clip();
      catiZemini(g, c, w, h, s, r, desen);
      // yürüme yolu (çakıllı çatıda kapıdan beton karo)
      for (const [a0, a1, b0, b1] of c.yollar) {
        g.fillStyle = '#bdb6aa'; g.fillRect(X(a0), Y(b1), (a1 - a0) * s, (b1 - b0) * s);
        g.strokeStyle = 'rgba(80,72,64,0.35)'; g.lineWidth = Math.max(1, 12 * s);
        for (let q = a0; q < a1; q += 500) { g.beginPath(); g.moveTo(X(q), Y(b1)); g.lineTo(X(q), Y(b0)); g.stroke(); }
        for (let q = b0; q < b1; q += 500) { g.beginPath(); g.moveTo(X(a0), Y(q)); g.lineTo(X(a1), Y(q)); g.stroke(); }
      }
      // parapet dibi kararması (kenarlardan 350 mm içeri)
      const ao = Math.max(3, 380 * s);
      const kenar = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(30,26,22,0.45)'); gr.addColorStop(1, 'rgba(30,26,22,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
      kenar(0, 0, w, ao, 0, 0, 0, ao); kenar(0, h - ao, w, h, 0, h, 0, h - ao); kenar(0, 0, ao, h, 0, 0, ao, 0); kenar(w - ao, 0, w, h, w, 0, w - ao, 0);
      // eşyaların dibi
      g.filter = `blur(${Math.max(1, 90 * s).toFixed(1)}px)`;
      g.strokeStyle = 'rgba(25,22,20,0.45)'; g.lineWidth = Math.max(2, 140 * s);
      for (const [a0, a1, b0, b1] of c.izler) g.strokeRect(X(a0), Y(b1), (a1 - a0) * s, (b1 - b0) * s);
      g.filter = 'none';
      // gölgeler: önce maske (üst üste binen gölgeler iki kez koyulaşmasın), sonra çarp
      const [mc, mg] = kanvas(Math.ceil(w) + 2, Math.ceil(h) + 2);
      mg.fillStyle = '#fff'; mg.fillRect(0, 0, mc.width, mc.height);
      mg.fillStyle = mg.strokeStyle = 'rgb(150,153,166)'; // gölgede doğrusal ~0,3 (güneş + ortam → yalnız ortam)
      const poli = (p) => { if (p.length < 3) return; mg.beginPath(); mg.moveTo(X(p[0][0]), Y(p[0][1])); for (const q of p.slice(1)) mg.lineTo(X(q[0]), Y(q[1])); mg.closePath(); mg.fill(); };
      c.golgeler.forEach(poli);
      for (const k of kutleler) {
        if (k[4] <= c.z + 10) continue;
        if (k[0] <= c.x0 + 1 && k[1] >= c.x1 - 1 && k[2] <= c.y0 + 1 && k[3] >= c.y1 - 1) continue; // kendi gövdesi
        const L = (k[4] - c.z) * 1.2;
        if (k[0] > c.x1 + 500 || k[1] < c.x0 - L - 500 || k[2] > c.y1 + 500 || k[3] < c.y0 - L - 500) continue;
        const p = kutuGolgesi(k[0], k[1], k[2], k[3], c.z - 1, k[4], c.z);
        if (p) poli(p);
      }
      for (const [a, b, kal] of c.inceler) { mg.lineWidth = Math.max(1, kal * s); mg.beginPath(); mg.moveTo(X(a[0]), Y(a[1])); mg.lineTo(X(b[0]), Y(b[1])); mg.stroke(); }
      g.globalCompositeOperation = 'multiply';
      g.filter = `blur(${Math.max(0.6, 25 * s).toFixed(1)}px)`;
      g.drawImage(mc, 0, 0);
      g.filter = 'none';
      g.globalCompositeOperation = 'source-over';
      g.restore();
      // çatı düzlemi (parapetlerin altına kadar)
      const u0 = (c.px + pad) / W, u1 = (c.px + pad + w) / W, v1 = 1 - (c.py + pad) / H, v0 = 1 - (c.py + pad + h) / H, z = c.z + 2;
      T.ekle('cati', yuz([[c.x0, c.y0, z], [c.x1, c.y0, z], [c.x1, c.y1, z], [c.x0, c.y1, z]], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]));
    }
    return doku(cv);
  }
}

// Çatı dokusu desenleri (küçük, tekrar eden): çakıl, gürültü
function desenler() {
  const r = rnd(5);
  const [c1, g1] = kanvas(64, 64);
  g1.fillStyle = '#b6aea3'; g1.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 700; i++) { const v = 150 + r() * 70; g1.fillStyle = `rgb(${v},${v - 6},${v - 14})`; g1.fillRect(r() * 64, r() * 64, 1 + r() * 1.5, 1 + r() * 1.5); }
  const [c2, g2] = kanvas(64, 64);
  const im = g2.createImageData(64, 64);
  for (let i = 0; i < 64 * 64; i++) { const v = 128 + (r() - 0.5) * 60; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g2.putImageData(im, 0, 0);
  return { cakil: c1, gurultu: c2 };
}

// Çatı tipine göre zemin: membran (bitümlü örtü, rulo ekleri), çakıl, beton karo, boya (açık kaplama), ahşap deck, beton
function catiZemini(g, c, w, h, s, r, desen) {
  const dolgu = (renkK) => { g.fillStyle = renkK; g.fillRect(-4, -4, w + 8, h + 8); };
  const ince = Math.max(1, 25 * s);
  if (c.tip === 'membran') {
    dolgu('#76726c');
    g.strokeStyle = 'rgba(160,154,146,0.55)'; g.lineWidth = ince;
    for (let x = (r() * 1000) * s; x < w; x += 1000 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let i = 0; i < 10; i++) { g.fillStyle = r() < 0.5 ? 'rgba(170,165,156,0.22)' : 'rgba(40,38,36,0.22)'; g.fillRect(r() * w, r() * h, (600 + r() * 2500) * s, (400 + r() * 1500) * s); }
  } else if (c.tip === 'cakil') {
    dolgu('#b3aba0');
    g.fillStyle = g.createPattern(desen.cakil, 'repeat'); g.globalAlpha = 0.9; g.fillRect(-4, -4, w + 8, h + 8); g.globalAlpha = 1;
  } else if (c.tip === 'karo' || c.tip === 'beton') {
    dolgu(c.tip === 'karo' ? '#c3bcb1' : '#aaa59d');
    if (c.tip === 'karo') {
      for (let i = 0; i < w / (500 * s) + 1; i++) for (let j = 0; j < h / (500 * s) + 1; j++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,250,240' : '60,55,50'},${(r() * 0.12).toFixed(3)})`; g.fillRect(i * 500 * s, j * 500 * s, 500 * s, 500 * s); }
      g.strokeStyle = 'rgba(90,84,76,0.45)'; g.lineWidth = ince;
      for (let x = 0; x < w; x += 500 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 500 * s) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    }
  } else if (c.tip === 'boya') {
    dolgu('#d6d4cd');
  } else if (c.tip === 'deck') {
    dolgu('#8d6c4e');
    for (let y = 0; y < h; y += 145 * s) { g.fillStyle = `rgba(${r() < 0.5 ? '255,235,210' : '40,25,15'},${(r() * 0.16).toFixed(3)})`; g.fillRect(0, y, w, 140 * s); g.fillStyle = 'rgba(30,20,12,0.5)'; g.fillRect(0, y + 140 * s, w, Math.max(0.6, 5 * s)); }
  }
  // gürültü ve lekeler (yağmur birikintisi izleri, kir)
  g.globalCompositeOperation = 'overlay';
  g.fillStyle = g.createPattern(desen.gurultu, 'repeat'); g.globalAlpha = 0.35; g.fillRect(-4, -4, w + 8, h + 8);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 6 + w * h / 4000; i++) {
    const x = r() * w, y = r() * h, R = (300 + r() * 1800) * s;
    const gr = g.createRadialGradient(x, y, 0, x, y, R);
    const koyu = r() < 0.7;
    gr.addColorStop(0, koyu ? 'rgba(35,32,28,0.16)' : 'rgba(240,236,228,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
  // süzgeçler (köşelere yakın koyu daire)
  g.fillStyle = 'rgba(25,24,22,0.8)';
  for (const [x, y] of [[0.08, 0.1], [0.92, 0.88]]) { g.beginPath(); g.arc(x * w, y * h, Math.max(1, 90 * s), 0, Math.PI * 2); g.fill(); }
}

// ---- zemin gölge haritası: bütün bina kütlelerinin güneş gölgesi (sokak, kaldırım, bahçe) ----
const GA = { x0: -80000, y0: -80000, boy: 220000, px: 1024 };
function zeminGolgesi(kutleler) {
  const [c, g] = kanvas(GA.px, GA.px), s = GA.px / GA.boy;
  const X = (x) => (x - GA.x0) * s, Y = (y) => (GA.y0 + GA.boy - y) * s;
  g.fillStyle = '#fff'; g.fillRect(0, 0, GA.px, GA.px);
  g.fillStyle = 'rgb(82,84,92)'; // doğrusal veri: gölgede ~0,32
  for (const k of kutleler) {
    const p = kutuGolgesi(k[0], k[1], k[2], k[3], Z0 - 1, k[4], Z0);
    if (!p) continue;
    g.beginPath(); g.moveTo(X(p[0][0]), Y(p[0][1])); for (const q of p.slice(1)) g.lineTo(X(q[0]), Y(q[1])); g.closePath(); g.fill();
  }
  // bina diplerinde kararma
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
  for (const k of kutleler) g.strokeRect(X(k[0]), Y(k[3]), (k[1] - k[0]) * s, (k[3] - k[2]) * s);
  const t = doku(c, { srgb: false });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
// Zemin malzemesine gölge haritası: dünya xy'sinden örneklenir, albedo ile çarpılır
function golgeli(m, tex) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.golgeHarita = { value: tex };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vZemin;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvZemin = (modelMatrix * vec4(transformed, 1.0)).xy;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vZemin;\nuniform sampler2D golgeHarita;')
      .replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.rgb *= texture2D(golgeHarita, (vZemin - vec2(${GA.x0.toFixed(1)}, ${GA.y0.toFixed(1)})) / ${GA.boy.toFixed(1)}).r;`);
  };
  m.customProgramCacheKey = () => 'golgeli';
  return m;
}

// ---- cephe atlası (uzak ve yan cepheler) ----
// 8 tip (satır) × 8 çeşit (sütun); hücre 256 px, içerik 240 px (8 px'lik pay duvar rengi: mip'te komşu hücre karışmaz).
// Duvar alanı alfa 1 (köşe rengiyle boyanır), pencere, çerçeve, korkuluk alfa 0 (kendi rengi).
// Tipler: 0 klasik pencere, 1 balkon, 2 geniş pencere + panjur kutusu, 3 modern cam cephe, 4 zemin kat dükkân,
// 5 sağır duvar (yan), 6 arka cephe (kapatılmış mutfak balkonu), 7 eski bina (söveli, ahşap kepenkli)
const ATLAS = { n: 8, hucre: 256, ic: 240, pay: 8 };
function cepheAtlasi() {
  const { n: N, hucre: C, ic: IC, pay: PAY } = ATLAS, W = N * C;
  const [c, g] = kanvas(W, W), [mc, mg] = kanvas(W, W), r = rnd(41);
  g.fillStyle = '#ebebeb'; g.fillRect(0, 0, W, W);
  mg.fillStyle = '#fff'; mg.fillRect(0, 0, W, W);
  for (let t = 0; t < N; t++) for (let v = 0; v < N; v++) {
    const ox = v * C + PAY, oy = t * C + PAY;
    const X = (u) => ox + u * IC, Y = (w) => oy + (1 - w) * IC;
    const dik = (u0, w0, u1, w1) => [X(u0), Y(w1), (u1 - u0) * IC, (w1 - w0) * IC];
    const h = {
      r, v,
      el(u0, w0, u1, w1, renkK) { g.fillStyle = renkK; g.fillRect(...dik(u0, w0, u1, w1)); mg.fillStyle = '#000'; mg.fillRect(...dik(u0, w0, u1, w1)); },
      duvar(u0, w0, u1, w1, renkK) { g.fillStyle = renkK; g.fillRect(...dik(u0, w0, u1, w1)); },
      dikeyGr(u0, w0, u1, w1, ust, alt, duvarMi = false) { const gr = g.createLinearGradient(0, Y(w1), 0, Y(w0)); gr.addColorStop(0, ust); gr.addColorStop(1, alt); g.fillStyle = gr; g.fillRect(...dik(u0, w0, u1, w1)); if (!duvarMi) { mg.fillStyle = '#000'; mg.fillRect(...dik(u0, w0, u1, w1)); } },
      cerceve(u0, w0, u1, w1, k, renkK) { h.el(u0, w0, u1, w0 + k, renkK); h.el(u0, w1 - k, u1, w1, renkK); h.el(u0, w0, u0 + k * 0.85, w1, renkK); h.el(u1 - k * 0.85, w0, u1, w1, renkK); },
      elips(u, w, ru, rw, renkK) { g.fillStyle = renkK; g.beginPath(); g.ellipse(X(u), Y(w), ru * IC, rw * IC, 0, 0, Math.PI * 2); g.fill(); mg.fillStyle = '#000'; mg.beginPath(); mg.ellipse(X(u), Y(w), ru * IC, rw * IC, 0, 0, Math.PI * 2); mg.fill(); },
    };
    // duvarda ince sıva lekesi ve yağmur izleri
    for (let i = 0; i < 3; i++) h.duvar(r(), 0, r() * 0.2 + 0.02, 1, `rgba(90,80,70,${(0.02 + r() * 0.03).toFixed(3)})`);
    TIPLER[t](h, v, r);
  }
  // birleştir: renk + maske alfa; satırları ters çevir (tuvalin üstü v = 1)
  const a = g.getImageData(0, 0, W, W).data, m = mg.getImageData(0, 0, W, W).data;
  const veri = new Uint8Array(W * W * 4), gr = rnd(3);
  for (let y = 0; y < W; y++) {
    const kaynak = y * W * 4, hedef = (W - 1 - y) * W * 4;
    for (let x = 0; x < W * 4; x += 4) {
      const n = (gr() - 0.5) * 10;
      veri[hedef + x] = Math.max(0, Math.min(255, a[kaynak + x] + n));
      veri[hedef + x + 1] = Math.max(0, Math.min(255, a[kaynak + x + 1] + n));
      veri[hedef + x + 2] = Math.max(0, Math.min(255, a[kaynak + x + 2] + n));
      veri[hedef + x + 3] = m[kaynak + x];
    }
  }
  const t = new THREE.DataTexture(veri, W, W);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8; t.needsUpdate = true;
  return t;
}
// Pencere içi çeşitleri (u0..u1 × w0..w1): koyu cam, tül, yarım tül, panjur, kapalı panjur, yansıma, renkli perde, saksı
function pencereIci(h, u0, w0, u1, w1, v) {
  const cam = () => { h.dikeyGr(u0, w0, u1, w1, '#55606c', '#20262d'); };
  const tul = (a = u0, b = u1, renkK = '#d6d1c5') => { h.el(a, w0, b, w1, renkK); for (let u = a + 0.02; u < b; u += 0.03) h.el(u, w0, u + 0.008, w1, 'rgba(120,112,100,0.25)'); };
  switch (v) {
    case 0: cam(); break;
    case 1: tul(); break;
    case 2: cam(); tul(u0, (u0 + u1) / 2); break;
    case 3: cam(); h.el(u0, w0 + (w1 - w0) * 0.45, u1, w1, '#c9c6bd'); for (let w = w0 + (w1 - w0) * 0.45; w < w1; w += 0.018) h.el(u0, w, u1, w + 0.004, 'rgba(90,88,80,0.35)'); break;
    case 4: h.el(u0, w0, u1, w1, '#bebbb2'); for (let w = w0; w < w1; w += 0.018) h.el(u0, w, u1, w + 0.004, 'rgba(90,88,80,0.35)'); break;
    case 5: cam(); h.el(u0, w0 + (w1 - w0) * 0.55, u1, w0 + (w1 - w0) * 0.75, 'rgba(200,190,170,0.35)'); break;
    case 6: tul(u0, u1, '#c4a48c'); break;
    default: cam(); h.el(u0 + 0.04, w0, u0 + 0.12, w0 + 0.06, '#9a5232'); h.elips(u0 + 0.08, w0 + 0.09, 0.05, 0.04, '#4f6c36');
  }
}
const TIPLER = [
  // 0 klasik: 1300 × 1400 pencere, mermer denizlik, beyaz PVC
  (h, v, r) => {
    const u0 = 0.285, u1 = 0.715, w0 = 0.31, w1 = 0.79;
    h.duvar(u0 - 0.035, w0 - 0.02, u1 + 0.035, w1 + 0.04, 'rgba(0,0,0,0.04)');
    pencereIci(h, u0, w0, u1, w1, v);
    h.cerceve(u0, w0, u1, w1, 0.018, '#e8e8e4');
    if (v !== 4) h.el((u0 + u1) / 2 - 0.007, w0, (u0 + u1) / 2 + 0.007, w1, '#e8e8e4');
    h.el(u0 - 0.025, w0 - 0.022, u1 + 0.025, w0, '#d8d3c9');
    h.duvar(u0 - 0.025, w0 - 0.05, u1 + 0.025, w0 - 0.022, 'rgba(0,0,0,0.12)');
    h.duvar(u0, 0, u0 + 0.02, w0 - 0.05, 'rgba(70,60,50,0.06)'); h.duvar(u1 - 0.02, 0, u1, w0 - 0.05, 'rgba(70,60,50,0.06)');
    if (v === 5 || v === 2) { h.el(u1 + 0.05, w0 - 0.12, u1 + 0.24, w0 + 0.05, '#e9e9e5'); h.elips(u1 + 0.145, w0 - 0.035, 0.05, 0.05, '#5e6266'); } // klima dış ünitesi
  },
  // 1 balkon: girintinin gölgesi, kapı + pencere, korkuluk çeşitleri, eşyalar
  (h, v, r) => {
    h.duvar(0.06, 0.06, 0.94, 0.98, 'rgba(0,0,0,0.13)');
    h.duvar(0.06, 0.88, 0.94, 0.98, 'rgba(0,0,0,0.12)');
    const ic = v % 3;
    pencereIci(h, 0.5, 0.07, 0.68, 0.8, ic === 0 ? 0 : ic === 1 ? 1 : 6);
    pencereIci(h, 0.16, 0.36, 0.44, 0.8, ic === 2 ? 0 : 1);
    h.cerceve(0.5, 0.07, 0.68, 0.8, 0.014, '#e8e8e4'); h.cerceve(0.16, 0.36, 0.44, 0.8, 0.014, '#e8e8e4');
    const k = v % 4;
    if (k === 0) { h.duvar(0.05, 0.06, 0.95, 0.4, 'rgba(255,255,255,0.18)'); h.el(0.04, 0.4, 0.96, 0.43, '#cfc9be'); }
    else if (k === 1) { h.el(0.05, 0.38, 0.95, 0.41, '#2a2b2e'); for (let u = 0.06; u < 0.95; u += 0.035) h.el(u, 0.06, u + 0.008, 0.4, '#2a2b2e'); }
    else if (k === 2) { h.el(0.05, 0.06, 0.95, 0.96, 'rgba(70,82,92,0.85)'); h.dikeyGr(0.05, 0.4, 0.95, 0.96, 'rgba(140,150,160,0.9)', 'rgba(60,70,80,0.9)'); for (const u of [0.05, 0.27, 0.5, 0.73, 0.94]) h.el(u, 0.06, u + 0.012, 0.96, '#ececea'); h.el(0.05, 0.38, 0.95, 0.41, '#ececea'); h.el(0.05, 0.06, 0.95, 0.38, '#dcd8d0'); }
    else { h.el(0.05, 0.06, 0.95, 0.4, 'rgba(170,195,200,0.55)'); h.el(0.05, 0.39, 0.95, 0.41, '#8a8f94'); }
    if (v >= 4 && k !== 2) {
      if (v === 4 || v === 7) { h.el(0.1, 0.62, 0.9, 0.625, '#444'); for (let u = 0.14; u < 0.85; u += 0.13) h.el(u, 0.44, u + 0.08, 0.62, css(CAMASIR[Math.floor(r() * CAMASIR.length)].map((x) => Math.pow(x, 1 / 2.2) * 255))); }
      if (v === 5) { h.elips(0.2, 0.47, 0.06, 0.06, '#4f6c36'); h.elips(0.32, 0.46, 0.05, 0.05, '#5d7a40'); }
      if (v === 6) h.elips(0.82, 0.55, 0.07, 0.08, '#dcdcda');
    }
    h.duvar(0.03, 0, 0.97, 0.06, 'rgba(0,0,0,0.08)');
  },
  // 2 geniş pencere + panjur kutusu
  (h, v) => {
    const u0 = 0.2, u1 = 0.8, w0 = 0.32, w1 = 0.76;
    pencereIci(h, u0, w0, u1, w1, v);
    h.cerceve(u0, w0, u1, w1, 0.016, '#ececea');
    for (const u of [0.4, 0.6]) h.el(u - 0.006, w0, u + 0.006, w1, '#ececea');
    h.el(u0 - 0.01, w1, u1 + 0.01, w1 + 0.07, '#d9d7d1');
    h.el(u0 - 0.02, w0 - 0.02, u1 + 0.02, w0, '#cfc9be');
    h.duvar(u0 - 0.02, w0 - 0.045, u1 + 0.02, w0 - 0.02, 'rgba(0,0,0,0.1)');
  },
  // 3 modern: açık kaplama, boy pencere, antrasit doğrama, cam korkuluk
  (h, v) => {
    h.duvar(0, 0, 1, 1, 'rgba(255,255,255,0.25)');
    h.el(0, 0, 1, 0.06, '#d9dad6');
    pencereIci(h, 0.1, 0.07, 0.9, 0.93, [0, 0, 1, 5, 0, 2, 6, 0][v]);
    h.cerceve(0.1, 0.07, 0.9, 0.93, 0.014, '#3a3e43');
    h.el(0.497, 0.07, 0.507, 0.93, '#3a3e43');
    h.el(0.1, 0.07, 0.9, 0.42, 'rgba(185,210,215,0.35)'); h.el(0.1, 0.41, 0.9, 0.425, '#6a6f75');
  },
  // 4 zemin kat dükkân (hücre zemin katın tamamı): vitrin, boş tabela bandı; çeşitler: kepenk, tente, apartman girişi
  (h, v) => {
    const tabela = ['#e9e7e1', '#2f4f3e', '#283a5a', '#6e2f2b', '#d9c58a', '#5a5f66', '#e9e7e1', '#7d6a55'][v];
    h.duvar(0, 0, 1, 0.05, 'rgba(0,0,0,0.12)');
    if (v === 5) { // apartman girişi: camlı kapı, saçak, yan pencereler
      h.el(0.38, 0.03, 0.62, 0.68, '#2b3036'); h.cerceve(0.38, 0.03, 0.62, 0.68, 0.016, '#6d6a64'); h.el(0.497, 0.03, 0.503, 0.68, '#6d6a64');
      h.el(0.33, 0.7, 0.67, 0.75, '#cfcac0'); h.duvar(0.33, 0.66, 0.67, 0.7, 'rgba(0,0,0,0.18)');
      for (const u of [0.1, 0.74]) { h.el(u, 0.35, u + 0.16, 0.66, '#2a3037'); for (let q = u + 0.02; q < u + 0.16; q += 0.03) h.el(q, 0.35, q + 0.006, 0.66, '#3c3c3c'); }
      return;
    }
    if (v === 1 || v === 7) { h.el(0.06, 0.04, 0.94, 0.72, v === 7 ? '#8fa3b5' : '#bdbab3'); for (let w = 0.05; w < 0.72; w += 0.02) h.el(0.06, w, 0.94, w + 0.005, 'rgba(70,70,70,0.3)'); }
    else if (v === 2) { h.dikeyGr(0.06, 0.04, 0.94, 0.72, '#4a525b', '#1f2329'); h.el(0.06, 0.45, 0.94, 0.72, '#bdbab3'); for (let w = 0.45; w < 0.72; w += 0.02) h.el(0.06, w, 0.94, w + 0.005, 'rgba(70,70,70,0.3)'); }
    else {
      h.dikeyGr(0.06, 0.04, 0.94, 0.72, v === 6 ? '#8a7a64' : '#4a525b', v === 6 ? '#3c3328' : '#1d2127');
      for (let i = 0; i < 4; i++) h.el(0.1 + i * 0.2, 0.1, 0.24 + i * 0.2, 0.12, 'rgba(160,150,135,0.5)');
      h.cerceve(0.06, 0.04, 0.94, 0.72, 0.012, '#3a3d41'); h.el(0.43, 0.04, 0.44, 0.72, '#3a3d41');
    }
    h.el(0.04, 0.75, 0.96, 0.92, tabela);
    if (v === 3 || v === 4) { const k = v === 3 ? ['#b8463a', '#efe9df'] : ['#3f6b4a', '#efe9df']; for (let i = 0; i < 12; i++) h.el(0.04 + i * 0.077, 0.6, 0.04 + (i + 1) * 0.077, 0.74, k[i % 2]); h.duvar(0.04, 0.54, 0.96, 0.6, 'rgba(0,0,0,0.18)'); }
  },
  // 5 sağır (yan, kalkan duvar): lekeler, ara sıra küçük banyo penceresi, menfez, boru
  (h, v, r) => {
    h.duvar(0, 0, 1, 1, `rgba(${v % 2 ? '255,250,240' : '60,55,50'},${(0.03 + r() * 0.05).toFixed(3)})`);
    if (v === 3 || v === 7) { h.el(0.44, 0.58, 0.56, 0.74, '#9aa3a8'); h.cerceve(0.44, 0.58, 0.56, 0.74, 0.012, '#e3e3df'); if (v === 7) for (let u = 0.46; u < 0.56; u += 0.03) h.el(u, 0.58, u + 0.006, 0.74, '#3a3a3a'); }
    if (v === 4) h.el(0.45, 0.7, 0.55, 0.78, '#6e6f70');
    if (v === 5) h.el(0.84, 0, 0.86, 1, '#a9aaa6');
    if (v === 1) h.duvar(0.3, 0, 0.36, 1, 'rgba(70,60,50,0.08)');
  },
  // 6 arka cephe: kapatılmış mutfak balkonu (alüminyum doğrama), küçük pencere
  (h, v, r) => {
    h.el(0.08, 0.05, 0.6, 0.85, '#5c6874'); h.dikeyGr(0.08, 0.38, 0.6, 0.85, '#7d8a96', '#46525e');
    if (v % 3 === 1) h.el(0.12, 0.42, 0.56, 0.8, '#d8d2c6');
    if (v % 4 === 2) for (let u = 0.12; u < 0.55; u += 0.1) h.el(u, 0.5, u + 0.06, 0.72, css(CAMASIR[Math.floor(r() * 10)].map((x) => Math.pow(x, 1 / 2.2) * 255)));
    for (const u of [0.08, 0.21, 0.34, 0.47, 0.59]) h.el(u, 0.05, u + 0.012, 0.85, '#ececea');
    h.el(0.08, 0.37, 0.6, 0.39, '#ececea'); h.el(0.08, 0.05, 0.6, 0.37, '#d9d5cc'); h.el(0.08, 0.83, 0.6, 0.85, '#ececea');
    pencereIci(h, 0.7, 0.5, 0.88, 0.78, v === 3 ? 1 : 0); h.cerceve(0.7, 0.5, 0.88, 0.78, 0.014, '#ececea');
    h.el(0.69, 0.48, 0.89, 0.5, '#d4cfc5');
  },
  // 7 eski bina: söveli boy pencere, ahşap doğrama, kepenkler
  (h, v) => {
    const u0 = 0.34, u1 = 0.66, w0 = 0.26, w1 = 0.82;
    h.duvar(u0 - 0.05, w0 - 0.03, u1 + 0.05, w1 + 0.07, 'rgba(255,255,255,0.22)');
    h.duvar(u0 - 0.06, w1 + 0.07, u1 + 0.06, w1 + 0.1, 'rgba(0,0,0,0.08)');
    pencereIci(h, u0, w0, u1, w1, [0, 1, 0, 6, 3, 0, 1, 2][v]);
    h.cerceve(u0, w0, u1, w1, 0.02, '#6b4a33'); h.el(0.495, w0, 0.505, w1, '#6b4a33'); h.el(u0, 0.62, u1, 0.635, '#6b4a33');
    const kepenk = ['#4f6b4d', '#6e4a35', '#4f6b4d', '#5c6a75', '#6e4a35', '#4f6b4d', '#7a3b2e', '#5c6a75'][v];
    if (v % 3 !== 2) { h.el(u0 - 0.15, w0, u0 - 0.005, w1, kepenk); h.el(u1 + 0.005, w0, u1 + 0.15, w1, kepenk); for (let w = w0 + 0.02; w < w1; w += 0.03) { h.el(u0 - 0.15, w, u0 - 0.005, w + 0.006, 'rgba(0,0,0,0.25)'); h.el(u1 + 0.005, w, u1 + 0.15, w + 0.006, 'rgba(0,0,0,0.25)'); } }
    h.el(u0 - 0.04, w0 - 0.03, u1 + 0.04, w0, '#d4cfc5');
  },
];

// Atlas cephe malzemesi: hücre çeşidi gölgelendiricide seçilir (aks ve kat başına), mip için türevler sarılmamış uv'den
function cepheMalzemesi(atlas) {
  const m = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.9, envMapIntensity: 1.45 });
  const { n: N, ic: IC, hucre: C, pay: PAY } = ATLAS;
  m.onBeforeCompile = (sh) => {
    // vHucre düz (flat): ara değerlemedeki küçük yuvarlama farkı hash'i piksel başına değiştirip cepheyi karıncalandırıyordu
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 hucre;\nflat varying vec2 vHucre;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvHucre = hucre;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nflat varying vec2 vHucre;')
      .replace('#include <map_fragment>', `
        vec2 hk = mod(floor(vMapUv), 64.0), hf = fract(vMapUv);
        vec3 h3 = fract(vec3(hk.x * 0.1031, hk.y * 0.1137, mod(floor(vHucre.y + 0.5), 89.0) * 0.0973));
        h3 += dot(h3, h3.yzx + 33.33);
        float hs = fract((h3.x + h3.y) * h3.z); // küçük girdili hash (sin'siz)
        vec2 hb = vec2(min(floor(hs * ${N}.0), ${N - 1}.0), ${N - 1}.0 - floor(vHucre.x + 0.5));
        float olc = ${(IC / C).toFixed(6)} / ${N}.0;
        vec2 auv = (hb + ${(PAY / C).toFixed(6)} + hf * ${(IC / C).toFixed(6)}) / ${N}.0;
        vec4 hx = textureGrad(map, auv, dFdx(vMapUv) * olc, dFdy(vMapUv) * olc);
        diffuseColor.rgb *= mix(hx.rgb, hx.rgb * vColor.rgb, hx.a);`)
      .replace('#include <color_fragment>', '');
  };
  m.customProgramCacheKey = () => 'cepheAtlasi';
  return m;
}

// ---- tekrar eden dokular ----
function griDoku(boy, seed, taban, sacilma, leke = 0.02) {
  const [c, g] = kanvas(boy, boy), r = rnd(seed), img = g.createImageData(boy, boy);
  for (let i = 0; i < boy * boy; i++) {
    const v = taban + (r() - 0.5) * sacilma + (r() < leke ? -22 : 0);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return doku(c, { tekrar: true });
}
// Kilit taşı kaldırım (2 m'lik tekrar): 200 × 100 taşlar, derz ve taş başına ton
function kaldirimDoku() {
  const [c, g] = kanvas(512, 512), r = rnd(19), px = 512 / 2000;
  g.fillStyle = '#8f8a84'; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < 20; j++) for (let i = -1; i < 10; i++) {
    const x = (i * 200 + (j % 2) * 100) * px, y = j * 100 * px, v = 205 + (r() - 0.5) * 30;
    g.fillStyle = `rgb(${v},${v - 4},${v - 9})`; g.fillRect(x + 1.2, y + 1.2, 200 * px - 2.4, 100 * px - 2.4);
  }
  return doku(c, { tekrar: true });
}
// Bahçe zemini (8 m'lik tekrar): kuru çim ve toprak lekeleri
function zeminDoku() {
  const [c, g] = kanvas(256, 256), r = rnd(23);
  g.fillStyle = '#8f8a6a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const x = r() * 256, y = r() * 256, R = 4 + r() * 22, k = r();
    g.fillStyle = k < 0.45 ? 'rgba(98,112,64,0.35)' : k < 0.8 ? 'rgba(150,132,104,0.3)' : 'rgba(70,80,50,0.3)';
    for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) { g.beginPath(); g.arc(x + dx, y + dy, R, 0, Math.PI * 2); g.fill(); }
  }
  return doku(c, { tekrar: true });
}
// Marsilya kiremidi: 8 sütun × 6 sıra (1680 × 1980 mm tekrar); sıra başına bindirme gölgesi, kiremit başına ton, liken
function kiremitDoku() {
  const [c, g] = kanvas(512, 512), r = rnd(13), tw = 64, th = 512 / 6;
  for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) {
    const x = i * tw, y = j * th, yas = r();
    const b = yas < 0.12 ? [138, 88, 66] : [184 + (r() - 0.5) * 34, 88 + (r() - 0.5) * 22, 58 + (r() - 0.5) * 16];
    const gr = g.createLinearGradient(x, 0, x + tw, 0);
    gr.addColorStop(0, css(b.map((v) => v * 0.72))); gr.addColorStop(0.3, css(b.map((v) => v * 1.08)));
    gr.addColorStop(0.62, css(b.map((v) => v * 0.96))); gr.addColorStop(0.82, css(b.map((v) => v * 1.04))); gr.addColorStop(1, css(b.map((v) => v * 0.7)));
    g.fillStyle = gr; g.fillRect(x, y, tw, th);
    const sg = g.createLinearGradient(0, y, 0, y + th * 0.3);
    sg.addColorStop(0, 'rgba(40,15,8,0.55)'); sg.addColorStop(1, 'rgba(40,15,8,0)');
    g.fillStyle = sg; g.fillRect(x, y, tw, th * 0.3);
    g.fillStyle = 'rgba(255,220,190,0.18)'; g.fillRect(x, y + th - 4, tw, 3);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(205,205,175,${(0.15 + r() * 0.25).toFixed(2)})`; g.beginPath(); g.arc(x + r() * tw, y + r() * th, 1 + r() * 3, 0, Math.PI * 2); g.fill(); }
  }
  return doku(c, { tekrar: true });
}
// Ağaç kartları (iki yarı): kavak (dar, uzun) ve yuvarlak tepeli ağaç; yapraklar ışığa göre (sağ üst açık)
function agacDoku() {
  const [c, g] = kanvas(512, 512), r = rnd(77);
  const tepe = (cx, cy, rx, ry, n, boy) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const isik = 0.5 + 0.5 * (((x - cx) / rx) * 0.12 - ((y - cy) / ry) * 0.85) + (r() - 0.5) * 0.45; // yukarıdan (çapraz kartlar birleşimde ton atlamasın)
      const k = Math.max(0, Math.min(1, isik));
      g.fillStyle = css([40 + 70 * k, 58 + 82 * k, 30 + 40 * k]);
      g.beginPath(); g.ellipse(x, y, boy * (0.6 + r() * 0.6), boy * (0.45 + r() * 0.4), r() * 3, 0, Math.PI * 2); g.fill();
    }
  };
  g.fillStyle = '#4a3a2c'; g.fillRect(124, 360, 8, 152); g.fillRect(380, 400, 12, 112);
  tepe(128, 230, 46, 210, 2600, 7);
  tepe(386, 300, 112, 120, 2200, 9);
  return doku(c);
}

// ---- gökyüzü ----
// Gökyüzü fotoğrafının yönü: u = 0,44 (ev ve şemsiye diliminin başı) güneye 175°'ye gelir (sağır duvarların ardı)
const GOK_U0 = 0.44 - 175 / 360;
function gokKubbesi(tex, meta) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex }, u0: { value: GOK_U0 }, altK: { value: meta.altKenar }, parlak: { value: 1.16 },
      gunes: { value: new THREE.Vector3(...GUNES).normalize() }, pus: { value: new THREE.Color(SEHIR.pus) },
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
        col = mix(pus, col, smoothstep(altK, altK + 5.0, el) * 0.55 + 0.45 * step(altK, el));
        float c = max(dot(d, gunes), 0.0);
        col += vec3(1.0, 0.96, 0.88) * (pow(c, 12.0) * 0.22 + pow(c, 220.0) * 0.9);
        gl_FragColor = vec4(col * parlak, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(SEHIR.gok, 64, 32), mat);
  m.renderOrder = -3;
  m.frustumCulled = false;
  return m;
}

// ---- bulutlar ----
// Kümülüs kartları: kanvasta yoğunluk alanı (düz tabanlı, ortada yükselen köpükler + gürültü), kendi kendini gölgeleme
// (ışığa doğru birkaç örnek), alt taraf mavimsi gri. Atlas 2 × 2 (512 × 256); kart güneşe göre aynalanır.
function gurultu(seed) {
  const N = 256, T = new Float32Array(N * N), r = rnd(seed);
  for (let i = 0; i < N * N; i++) T[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = T[(yi & 255) * N + (xi & 255)], b = T[(yi & 255) * N + ((xi + 1) & 255)], c = T[((yi + 1) & 255) * N + (xi & 255)], d = T[((yi + 1) & 255) * N + ((xi + 1) & 255)];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function bulutAtlasi() {
  const W = 1024, H = 512, cw = 512, ch = 256;
  const [c, g] = kanvas(W, H), img = g.createImageData(W, H), n = gurultu(9);
  for (let k = 0; k < 4; k++) {
    const r = rnd(101 + k * 37), ox = (k % 2) * cw, oy = Math.floor(k / 2) * ch;
    const D = new Float32Array(cw * ch).fill(1), taban = ch * (0.8 + r() * 0.05), yay = 0.3 + r() * 0.1, kule = 0.5 + r() * 0.4;
    // gövde köpükleri (ortada yükselir), her birinin üst yarısında küçük kabarcıklar (karnabahar dokusu)
    const puf = [];
    for (let i = 0; i < 9; i++) {
      const t = (i / 8) * 2 - 1 + (r() - 0.5) * 0.18, e = Math.exp(-t * t * 2.2);
      const R = ch * (0.09 + 0.12 * e * (0.7 + r() * 0.5)), x = cw * (0.5 + t * yay), y = taban - R * 0.5 - ch * kule * 0.36 * e * (0.6 + r() * 0.4);
      puf.push([x, y, R]);
      for (let j = 0; j < 7; j++) { const a = Math.PI * (1.04 + r() * 0.92); puf.push([x + Math.cos(a) * R * 0.78, y + Math.sin(a) * R * 0.78, R * (0.24 + r() * 0.3)]); }
    }
    for (const [px, py, R] of puf) { // yumuşak birleşim: (1 − yoğunluk) çarpılır, yalnız köpüğün kutusunda
      for (let y = Math.max(0, Math.floor(py - R / 1.15)); y < Math.min(ch, Math.ceil(py + R / 1.15)); y++) for (let x = Math.max(0, Math.floor(px - R)); x < Math.min(cw, Math.ceil(px + R)); x++) {
        const q = 1 - Math.hypot(x - px, (y - py) * 1.15) / R;
        if (q > 0) D[y * cw + x] *= 1 - Math.min(1, q * 1.7);
      }
    }
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      let d = 1 - D[y * cw + x];
      const f = n((x + ox) / 20, (y + oy) / 20) * 0.45 + n((x + ox) / 8, (y + oy) / 8) * 0.33 + n((x + ox) / 3.5, (y + oy) / 3.5) * 0.22;
      d = d + (f - 0.5) * 1.0 * Math.min(1, d * 2.2);
      d *= Math.max(0, Math.min(1, (taban + 5 - y) / 12)); // düz taban
      D[y * cw + x] = d;
    }
    const L = [0.55, -0.83]; // ışık sağ üstten (tuvalde y aşağı)
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const d = D[y * cw + x], a0 = Math.max(0, Math.min(1, (d - 0.1) / 0.5)), a = a0 * a0 * (3 - 2 * a0);
      let occ = 0;
      for (let j = 1; j <= 5; j++) { const sx = Math.round(x + L[0] * j * 7), sy = Math.round(y + L[1] * j * 7); if (sx >= 0 && sy >= 0 && sx < cw && sy < ch) occ += Math.max(0, D[sy * cw + sx]); }
      const isik = Math.exp(-occ * 0.55), alt = Math.max(0, Math.min(1, (y - taban * 0.55) / (taban * 0.45)));
      const k2 = Math.min(1, 0.18 + isik * 0.9) * (1 - alt * 0.22);
      const o = ((oy + y) * W + ox + x) * 4;
      img.data[o] = 182 + (255 - 182) * k2; img.data[o + 1] = 190 + (254 - 190) * k2; img.data[o + 2] = 207 + (250 - 207) * k2;
      img.data[o + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return doku(c, { mip: true });
}
// [azimut°, taban yüksekliği°, genişlik°, atlas hücresi]: kuzey ve doğu yarısında, ufka yakın
const BULUTLAR = [[-58, 4.5, 24, 0], [-26, 2.6, 18, 1], [6, 6.5, 30, 2], [34, 3.2, 22, 3], [62, 8.5, 30, 1], [92, 3.0, 22, 2], [122, 5.5, 26, 0], [152, 2.4, 18, 3], [-8, 12, 22, 3], [48, 15, 24, 0], [110, 13, 20, 2]];
function bulutKartlari(tex) {
  const R = SEHIR.bulut, geos = [];
  for (const [az, eb, gen, k] of BULUTLAR) {
    const w = 2 * R * Math.tan((gen / 2) * DEG), h = w / 2, ec = eb * DEG + Math.atan(h / 2 / R);
    const a = az * DEG, dir = new THREE.Vector3(Math.sin(a) * Math.cos(ec), Math.cos(a) * Math.cos(ec), Math.sin(ec));
    const Z = dir.clone().negate(), X = new THREE.Vector3(Math.cos(a), -Math.sin(a), 0), Y = Z.clone().cross(X);
    const g = new THREE.PlaneGeometry(w, h);
    const u0 = (k % 2) * 0.5, v0 = k < 2 ? 0.5 : 0, ayna = az > 25; // güneş solunda kalan bulut aynalanır
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) { const uu = ayna ? 1 - uv.getX(i) : uv.getX(i); uv.setXY(i, u0 + uu * 0.5, v0 + uv.getY(i) * 0.5); }
    g.applyMatrix4(new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(dir.multiplyScalar(R)));
    geos.push(g);
  }
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.12, 1.12, 1.12) }));
  m.renderOrder = -2;
  m.frustumCulled = false;
  return m;
}

// ---- uzak şehir silüeti ----
// Silindir şeridi (yarıçap SEHIR.siluet, azimut −100°..185°, ufkun 2,5° altından 8° üstüne): uzak tepeler (üstünde
// sık evler), uzak ve orta şehir katmanları, minareler ve kubbeler, su kulesi, kuleli vinç. Pus rengine yakın; yakına
// gelen katman biraz koyu. Altı dolu (3B şehrin arkası).
function siluet() {
  const R = SEHIR.siluet, GOZ = 1550, A0 = -100, A1 = 185, EA = -2.5, EU = 8, W = 4096, H = 512;
  const zA = GOZ + R * Math.tan(EA * DEG), zU = GOZ + R * Math.tan(EU * DEG);
  const yE = (e) => H * (1 - (GOZ + R * Math.tan(e * DEG) - zA) / (zU - zA));
  const xA = (az) => ((az - A0) / (A1 - A0)) * W;
  const [c, g] = kanvas(W, H), r = rnd(31);
  const pus = [213, 216, 220];
  const ton = (k, sicak = 0) => css([pus[0] - 50 * k + sicak * 8, pus[1] - 44 * k + sicak * 4, pus[2] - 36 * k]);
  // tepeler: yumuşak sırt çizgisi, yamaçta sık küçük evler (kuzeydoğu ve doğuda yüksek)
  const sirt = (x) => { const az = A0 + (x / W) * (A1 - A0); return 0.7 + 1.7 * Math.pow(0.5 + 0.5 * Math.sin(x * 0.0023 + 1.1), 1.6) * (0.4 + 0.6 * Math.max(0, Math.sin((az + 10) * DEG))) + 0.25 * Math.sin(x * 0.011) * Math.sin(x * 0.0037); };
  g.fillStyle = ton(0.26); g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, yE(sirt(x)));
  g.lineTo(W, H); g.closePath(); g.fill();
  for (let i = 0; i < 5000; i++) {
    const x = r() * W, ust = yE(sirt(x)), y = ust + Math.pow(r(), 0.7) * (yE(-0.3) - ust);
    if (y < ust + 2) continue;
    g.fillStyle = r() < 0.6 ? ton(0.12, 1) : ton(0.32); g.fillRect(x, y, 2 + r() * 2, 1.5 + r());
  }
  // şehir katmanları: bloklar, çatı üstü depo ve anten, arada uzun bloklar
  const katman = (e0, e1, k, yogun, uzun) => {
    for (let x = -10; x < W;) {
      const w = 5 + r() * 24 * (1 + k), e = e0 + Math.pow(r(), 1.6) * (e1 - e0) + (r() < uzun ? 1.2 + r() * 1.8 : 0), ust = yE(e);
      g.fillStyle = ton(k + (r() - 0.5) * 0.06); g.fillRect(x, ust, w + 1, H - ust);
      g.fillStyle = ton(k - 0.06, 1); g.fillRect(x + w * 0.62, ust, w * 0.38, H - ust); // güneşe bakan yan biraz açık
      if (r() < yogun) { g.fillStyle = ton(k + 0.04); g.fillRect(x + w * (0.15 + r() * 0.5), ust - 3, 3 + r() * 3, 3); if (r() < 0.5) g.fillRect(x + w * r(), ust - 9, 1, 9); }
      x += w + (r() < 0.08 ? r() * 10 : 0);
    }
  };
  katman(-0.2, 1.0, 0.36, 0.25, 0.07);
  // minareler ve kubbeler, su kulesi, vinç
  const minare = (az, boy, k) => {
    const x = xA(az), alt = yE(0.4), ust = yE(boy);
    g.fillStyle = ton(k); g.fillRect(x - 1.5, ust, 3, alt - ust); g.fillRect(x - 3, ust + (alt - ust) * 0.22, 6, 2); g.fillRect(x - 2.5, ust + (alt - ust) * 0.45, 5, 2);
    g.beginPath(); g.moveTo(x - 2.2, ust); g.lineTo(x, ust - 9); g.lineTo(x + 2.2, ust); g.fill();
  };
  const cami = (az, k, r0) => {
    const x = xA(az), y0 = yE(0.55);
    g.fillStyle = ton(k); g.beginPath(); g.ellipse(x, y0, r0, r0 * 0.85, 0, Math.PI, 0); g.fill(); g.fillRect(x - r0 * 1.4, y0, r0 * 2.8, yE(-0.5) - y0);
    g.fillRect(x - 0.6, y0 - r0 * 0.85 - 4, 1.2, 4);
    minare(az - (r0 * 1.6) / W * (A1 - A0), 2.6 + r() * 0.8, k); minare(az + (r0 * 1.6) / W * (A1 - A0), 2.6 + r() * 0.8, k);
  };
  for (const [az, rr] of [[-62, 7], [-18, 9], [22, 6], [57, 11], [96, 7], [131, 8], [168, 6]]) cami(az, 0.42, rr);
  for (const az of [-40, 8, 74, 115, 150]) minare(az, 2.2 + r() * 1.2, 0.42);
  { const x = xA(83), alt = yE(0.3), ust = yE(2.6); g.fillStyle = ton(0.36); g.fillRect(x - 2, ust, 4, alt - ust); g.beginPath(); g.moveTo(x - 14, ust); g.lineTo(x + 14, ust); g.lineTo(x + 8, ust + 10); g.lineTo(x - 8, ust + 10); g.fill(); g.fillRect(x - 15, ust - 5, 30, 5); }
  for (const [az, boy, kol] of [[31, 3.6, 70], [139, 3.1, -55]]) {
    const x = xA(az), alt = yE(0.6), ust = yE(boy);
    g.fillStyle = ton(0.38); g.fillRect(x - 1.5, ust, 3, alt - ust); g.fillRect(Math.min(x, x + kol), ust, Math.abs(kol), 2); g.fillRect(Math.min(x, x - kol * 0.3), ust, Math.abs(kol * 0.3), 3);
    g.fillRect(x + kol * 0.7, ust + 2, 1, 14); g.fillRect(x - 1, ust - 8, 2, 8);
  }
  katman(-0.5, 0.45, 0.47, 0.45, 0.04);
  g.fillStyle = ton(0.5); g.fillRect(0, yE(-0.6), W, H);
  // 4096 × 512 şerit, 2048 × 1024 dokuya iki satır olarak (en çok 2048): sol yarı üstte, sağ yarı altta; arada 8 px
  // saydam boşluk (süzgeç bir yarının dibini öbürünün tepesine taşımasın)
  const [c2, g2] = kanvas(2048, 1024), SY = 508;
  g2.drawImage(c, 0, 0, 2048, H, 0, 0, 2048, SY);
  g2.drawImage(c, 2048, 0, 2048, H, 0, 1024 - SY, 2048, SY);
  const t = doku(c2, { mip: false });
  const N = 80, pos = [], uv = [], idx = [];
  for (let s = 0; s < 2; s++) {
    const v0 = s === 0 ? 1 - SY / 1024 : 0, v1 = s === 0 ? 1 : SY / 1024, b = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const a = (A0 + ((A1 - A0) * (s * N + i)) / (2 * N)) * DEG, x = R * Math.sin(a), y = R * Math.cos(a);
      pos.push(x, y, zA, x, y, zU); uv.push(i / N, v0, i / N, v1);
    }
    for (let i = 0; i < N; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  m.renderOrder = -1;
  m.frustumCulled = false;
  return m;
}

// ---- çatı eşyaları (her biri çatının gölge listesine de yazılır; c null olabilir) ----
function merdivenKulesi(T, c, x0, x1, y0, y1, z, h, kapi, renkK, pencere = null) {
  T.kutu('siva', x0, x1, y0, y1, z, z + h, renkK, 1000, 0.16);
  T.kutu('beton', x0 - 45, x1 + 45, y0 - 45, y1 + 45, z + h, z + h + 60, P.betonAcik, 1000);
  const d = { '-y': y0, '+y': y1, '-x': x0, '+x': x1 }[kapi.yon];
  const C = cerceve(T, kapi.yon, d);
  C.kutu('metal', kapi.a - 470, kapi.a + 470, 0, 25, z + 20, z + 2120, P.koyu);
  C.kutu('metal', kapi.a - 420, kapi.a + 420, 25, 45, z + 40, z + 2080, kapi.renk ?? P.kapi);
  C.kutu('metal', kapi.a + 250, kapi.a + 330, 45, 80, z + 1000, z + 1030, P.alu);
  C.kutu('beton', kapi.a - 700, kapi.a + 700, 0, 520, z + 2230, z + 2310, P.betonAcik);
  C.kutu('beton', kapi.a - 560, kapi.a + 560, 0, 380, z, z + 40, P.betonAcik);
  C.golge(kapi.a - 700, kapi.a + 700, 3, z + 1700, z + 2230, 0, 0.35);
  if (pencere) {
    const Cp = cerceve(T, pencere.yon, { '-y': y0, '+y': y1, '-x': x0, '+x': x1 }[pencere.yon]);
    Cp.kutu('cam', pencere.a - 350, pencere.a + 350, 0, 15, z + 1500, z + 2000, P.cam);
    Cp.kutu('beyaz', pencere.a - 390, pencere.a + 390, 0, 40, z + 1460, z + 1500, P.betonAcik);
  }
  c?.kutu(x0, x1, y0, y1, z, z + h + 60);
}
function makineDairesi(T, c, x0, x1, y0, y1, z, h, renkK, panjurYon) {
  T.kutu('siva', x0, x1, y0, y1, z, z + h, renkK, 1000, 0.16);
  T.kutu('beton', x0 - 45, x1 + 45, y0 - 45, y1 + 45, z + h, z + h + 60, P.betonAcik, 1000);
  const C = cerceve(T, panjurYon, { '-y': y0, '+y': y1, '-x': x0, '+x': x1 }[panjurYon]);
  const am = panjurYon[1] === 'y' ? (x0 + x1) / 2 : (y0 + y1) / 2;
  C.kutu('metal', am - 550, am + 550, 0, 20, z + h - 1100, z + h - 400, P.antrasit);
  for (let q = z + h - 1060; q < z + h - 420; q += 70) C.kutu('metal', am - 540, am + 540, 20, 50, q, q + 22, P.metal);
  c?.kutu(x0, x1, y0, y1, z, z + h + 60);
}
// Dik plastik depo (çelik sehpa üstünde, kubbe kapaklı)
function depoDik(T, c, x, y, z, r, h, renkK, ayak = 380) {
  if (ayak) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) T.kutu('metal', x + sx * r * 0.72 - 25, x + sx * r * 0.72 + 25, y + sy * r * 0.72 - 25, y + sy * r * 0.72 + 25, z, z + ayak, P.pas);
    T.kutu('metal', x - r * 0.8, x + r * 0.8, y - r * 0.8, y + r * 0.8, z + ayak - 50, z + ayak, P.pas);
  }
  const zb = z + ayak;
  T.silindir('beyaz', x, y, zb, zb + h, r, 20, renkK);
  T.silindir('beyaz', x, y, zb + h * 0.3, zb + h * 0.3 + 40, r + 12, 20, renkK.map((v) => v * 0.85));
  T.silindir('beyaz', x, y, zb + h * 0.7, zb + h * 0.7 + 40, r + 12, 20, renkK.map((v) => v * 0.85));
  T.silindir('beyaz', x, y, zb + h, zb + h + r * 0.3, r, 20, renkK, r * 0.4);
  c?.silindir(x, y, z, zb + h + r * 0.3, r);
}
// Yatık depo (beton kızaklar üstünde), ekseni x ya da y boyunca
function depoYatik(T, c, x, y, z, r, L, xBoyunca, renkK) {
  const g = new THREE.CylinderGeometry(r, r, L, 20);
  if (xBoyunca) g.rotateZ(Math.PI / 2);
  T.ekle('beyaz', g.translate(x, y, z + 220 + r), renkK);
  for (const s of [-1, 1]) {
    const o = s * L * 0.3;
    if (xBoyunca) T.kutu('beton', x + o - 120, x + o + 120, y - r * 0.8, y + r * 0.8, z, z + 220 + r * 0.4, P.betonAcik);
    else T.kutu('beton', x - r * 0.8, x + r * 0.8, y + o - 120, y + o + 120, z, z + 220 + r * 0.4, P.betonAcik);
  }
  if (c) { const [hx, hy] = xBoyunca ? [L / 2, r] : [r, L / 2]; c.kutu(x - hx, x + hx, y - hy, y + hy, z, z + 220 + 2 * r); }
}
// Güneş enerjili su ısıtıcısı: eğik kolektörler (cam yüz yon azimutuna bakar), arka üstte yatay beyaz depo, ayaklar.
// (x, y): kolektörlerin ön alt kenarının ortası
function gunesIsitici(T, c, x, y, z, yon = 180, panel = 2, egim = 40) {
  const f = yon * DEG, F = new THREE.Vector3(Math.sin(f), Math.cos(f), 0), U = new THREE.Vector3(Math.cos(f), -Math.sin(f), 0);
  const t = egim * DEG, S = new THREE.Vector3(0, 0, Math.sin(t)).addScaledVector(F, -Math.cos(t)), N = new THREE.Vector3(0, 0, Math.cos(t)).addScaledVector(F, Math.sin(t));
  const PW = 1000, PL = 1900, alt = 380, gen = panel * PW + (panel - 1) * 40;
  const O = new THREE.Vector3(x, y, z + alt);
  for (let i = 0; i < panel; i++) {
    const du = -gen / 2 + PW / 2 + i * (PW + 40);
    // (U, S, N) sol elli: matris yansıtır, yüzler ters döner (cam kutusu arka yüz sayılıp ayıklanıyordu) → x ekseni −U
    const M = new THREE.Matrix4().makeBasis(U.clone().negate(), S, N).setPosition(O.clone().addScaledVector(U, du).addScaledVector(S, PL / 2));
    T.matris('metal', new THREE.BoxGeometry(PW, PL, 70), M, P.alu);
    T.matris('kolektor', new THREE.BoxGeometry(PW - 60, PL - 60, 10).translate(0, 0, 36), M, P.kolektor);
  }
  const tepe = O.clone().addScaledVector(S, PL);
  const D = tepe.clone().addScaledVector(F, -250).add(new THREE.Vector3(0, 0, 210));
  T.matris('beyaz', new THREE.CylinderGeometry(240, 240, gen + 160, 18), new THREE.Matrix4().makeBasis(F, U, F.clone().cross(U)).setPosition(D), P.tank);
  const nokta = [];
  for (const s of [-1, 1]) {
    const a = O.clone().addScaledVector(U, s * (gen / 2 - 70)), b = a.clone().addScaledVector(S, PL).addScaledVector(F, -200);
    T.cubuk('metal', [a.x, a.y, z], [a.x, a.y, a.z], 22, 4, P.alu);
    T.cubuk('metal', [b.x, b.y, z], [b.x, b.y, D.z], 22, 4, P.alu);
    T.cubuk('metal', [a.x, a.y, z + 60], [b.x, b.y, D.z - 300], 16, 4, P.alu);
    nokta.push([a.x, a.y, a.z], [b.x, b.y, D.z + 240], [a.x, a.y, z], [b.x, b.y, z]);
  }
  c?.noktalar(nokta);
}
// TV anteni: direk, iki kat yagi (bom + elemanlar)
function anten(T, c, x, y, z, h, yon) {
  T.cubuk('metal', [x, y, z], [x, y, z + h], 22, 6, P.metal);
  const f = yon * DEG, F = [Math.sin(f), Math.cos(f)], Q = [Math.cos(f), -Math.sin(f)];
  for (let k = 0; k < 2; k++) {
    const zk = z + h - 120 - k * 620, L = 1500 - k * 350;
    const a = [x - F[0] * L * 0.3, y - F[1] * L * 0.3, zk], b = [x + F[0] * L * 0.7, y + F[1] * L * 0.7, zk];
    T.cubuk('metal', a, b, 13, 4, P.metal);
    const n = 7 - k * 2;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t, e = (560 - t * 280) / 2;
      T.cubuk('metal', [px - Q[0] * e, py - Q[1] * e, zk], [px + Q[0] * e, py + Q[1] * e, zk], 9, 3, P.metal);
    }
  }
  c?.cizgi([x, y, z], [x, y, z + h], 40);
}
// Çanak anten (Türksat yönüne, güneydoğu): ayak borusu, parabol, LNB kolu
function canak(T, c, x, y, z, cap, az = 155, el = 38, ayak = 650) {
  T.cubuk('metal', [x, y, z], [x, y, z + ayak], 26, 6, P.antrasit);
  const R = cap / 2, f = R * 1.15, nokta = [];
  for (let i = 0; i <= 6; i++) { const rr = (R * i) / 6; nokta.push(new THREE.Vector2(rr, (rr * rr) / (4 * f))); }
  const g = new THREE.LatheGeometry(nokta, 18);
  const yonV = new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.cos(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG));
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), yonV));
  const m = new THREE.Vector3(x, y, z + ayak + R * 0.55).addScaledVector(yonV, -120);
  T.ekle('metal', g.translate(m.x, m.y, m.z), P.canak);
  const lnb = m.clone().addScaledVector(yonV, R * 1.05), kol = m.clone().add(new THREE.Vector3(0, 0, -R * 0.85));
  T.cubuk('metal', [kol.x, kol.y, kol.z], [lnb.x, lnb.y, lnb.z], 10, 4, P.antrasit);
  T.kutu('metal', lnb.x - 45, lnb.x + 45, lnb.y - 45, lnb.y + 45, lnb.z - 45, lnb.z + 45, P.antrasit);
  c?.noktalar([[m.x - R, m.y, m.z + R * 0.6], [m.x + R, m.y, m.z + R * 0.6], [m.x, m.y - R, m.z - R * 0.6], [m.x, m.y + R, m.z - R * 0.6], [x, y, z]]);
}
// Sıvalı baca (beton şapkalı), üstünde kombi boruları
function baca(T, c, x, y, z, w, d, h, renkK, boru = 0) {
  T.kutu('siva', x - w / 2, x + w / 2, y - d / 2, y + d / 2, z, z + h, renkK, 1000, 0.12);
  const zt = z + h;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) T.kutu('beton', x + sx * (w / 2 - 40) - 30, x + sx * (w / 2 - 40) + 30, y + sy * (d / 2 - 40) - 30, y + sy * (d / 2 - 40) + 30, zt, zt + 170, P.beton);
  T.kutu('beton', x - w / 2 - 70, x + w / 2 + 70, y - d / 2 - 70, y + d / 2 + 70, zt + 170, zt + 230, P.beton);
  T.kutu('metal', x - w / 2 + 70, x + w / 2 - 70, y - d / 2 + 70, y + d / 2 - 70, zt - 20, zt + 2, renk(0x1a1a1a));
  for (let i = 0; i < boru; i++) {
    const bx = x - w / 2 + 120 + (i % 3) * ((w - 240) / 2), by = y + (i < 3 ? -1 : 1) * (d / 2 - 110);
    kombiBorusu(T, null, bx, by, zt + 230, 650 + i * 110);
  }
  c?.kutu(x - w / 2 - 70, x + w / 2 + 70, y - d / 2 - 70, y + d / 2 + 70, z, zt + 230 + (boru ? 700 : 0));
}
function kombiBorusu(T, c, x, y, z, h) {
  T.silindir('metal', x, y, z, z + h, 55, 10, P.alu);
  T.silindir('metal', x, y, z + h, z + h + 90, 95, 10, P.alu, 30);
  c?.silindir(x, y, z, z + h + 90, 60);
}
// Çamaşır ipi: iki T direk, dört ip, iplerde çamaşır
function camasir(T, c, x0, y0, x1, y1, z, r, doluluk = 0.6) {
  const L = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / L, dy = (y1 - y0) / L, px = -dy, py = dx, hz = z + 1750;
  for (const [x, y] of [[x0, y0], [x1, y1]]) {
    T.cubuk('metal', [x, y, z], [x, y, hz + 60], 24, 6, P.pas);
    T.cubuk('metal', [x - px * 640, y - py * 640, hz], [x + px * 640, y + py * 640, hz], 20, 4, P.pas);
    c?.cizgi([x, y, z], [x, y, hz], 50);
  }
  for (let i = 0; i < 4; i++) {
    const o = -525 + i * 350;
    T.cubuk('metal', [x0 + px * o, y0 + py * o, hz], [x1 + px * o, y1 + py * o, hz], 7, 3, P.ip);
    let t = 250 + r() * 300;
    while (t < L - 450) {
      const w = 260 + r() * 480, h = 260 + r() * 420;
      if (t + w > L - 150) break;
      if (r() < doluluk) {
        const cx = x0 + dx * (t + w / 2) + px * o, cy = y0 + dy * (t + w / 2) + py * o;
        const g = new THREE.BoxGeometry(w, 14, h).rotateZ(Math.atan2(dy, dx)).translate(cx, cy, hz - h / 2 - 10);
        T.ekle('beyaz', g, CAMASIR[Math.floor(r() * CAMASIR.length)]);
        c?.noktalar([[cx - dx * w / 2, cy - dy * w / 2, hz], [cx + dx * w / 2, cy + dy * w / 2, hz], [cx - dx * w / 2, cy - dy * w / 2, hz - h], [cx + dx * w / 2, cy + dy * w / 2, hz - h]]);
      }
      t += w + 60 + r() * 420;
    }
  }
}
// Klima dış ünitesi (pervane yüzü yon yönüne)
function klima(T, c, x, y, z, yon) {
  const yatay = yon[1] === 'y', [hx, hy] = yatay ? [430, 160] : [160, 430];
  T.kutu('beyaz', x - hx, x + hx, y - hy, y + hy, z, z + 600, renk(0xe8e8e4));
  const C = cerceve(T, yon, { '-y': y - hy, '+y': y + hy, '-x': x - hx, '+x': x + hx }[yon]);
  const am = yatay ? x : y;
  C.kutu('metal', am - 330, am + 70, 0, 8, z + 110, z + 510, renk(0x4a4d50));
  c?.kutu(x - hx, x + hx, y - hy, y + hy, z, z + 600);
}
// Saksı ve bitki (küçük alçak çokyüzlü yaprak kümesi)
function saksi(T, x, y, z, w, d, r) {
  T.kutu('beyaz', x - w / 2, x + w / 2, y - d / 2, y + d / 2, z, z + 300, P.saksi);
  const n = Math.max(1, Math.round(w / 300));
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(170 + r() * 110, 0).scale(1, 1, 0.9 + r() * 0.5);
    T.ekle('beyaz', g.translate(x - w / 2 + (i + 0.5) * (w / n), y + (r() - 0.5) * d * 0.3, z + 380 + r() * 120), P.yaprak.map((v) => v * (0.8 + r() * 0.4)));
  }
}
// Plastik sandalye (beyaz)
function sandalye(T, x, y, z, yonY = 1) {
  const R = renk(0xe9e9e4);
  T.kutu('beyaz', x - 230, x + 230, y - 230, y + 230, z + 420, z + 460, R);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) T.kutu('beyaz', x + sx * 200 - 22, x + sx * 200 + 22, y + sy * 200 - 22, y + sy * 200 + 22, z, z + 420, R);
  T.kutu('beyaz', x - 230, x + 230, y + yonY * 200 - 25, y + yonY * 200 + 25, z + 460, z + 880, R);
}

// ---- düz çatı (parapet + harpuşta) ve kırma çatı ----
function duzCati(T, A, x0, x1, y0, y1, z, { parapet = 800, kal = 200, renkK, tip = 'membran', mm = 100, tohum = 1, harpusta = true }) {
  const zp = z + parapet;
  T.kutu('siva', x0, x1, y0, y0 + kal, z - 20, zp, renkK, 1000);
  T.kutu('siva', x0, x1, y1 - kal, y1, z - 20, zp, renkK, 1000);
  T.kutu('siva', x0, x0 + kal, y0 + kal, y1 - kal, z - 20, zp, renkK, 1000);
  T.kutu('siva', x1 - kal, x1, y0 + kal, y1 - kal, z - 20, zp, renkK, 1000);
  const zh = harpusta ? 60 : 0;
  if (harpusta) {
    const o = 30, B = P.betonAcik;
    T.kutu('beton', x0 - o, x1 + o, y0 - o, y0 + kal + o, zp, zp + zh, B, 1000);
    T.kutu('beton', x0 - o, x1 + o, y1 - kal - o, y1 + o, zp, zp + zh, B, 1000);
    T.kutu('beton', x0 - o, x0 + kal + o, y0 + kal + o, y1 - kal - o, zp, zp + zh, B, 1000);
    T.kutu('beton', x1 - kal - o, x1 + o, y0 + kal + o, y1 - kal - o, zp, zp + zh, B, 1000);
  }
  const c = A.ekle(x0 + kal, x1 - kal, y0 + kal, y1 - kal, z, tip, mm, tohum);
  c.kutu(x0, x1, y0, y0 + kal, z, zp + zh, false); c.kutu(x0, x1, y1 - kal, y1, z, zp + zh, false);
  c.kutu(x0, x0 + kal, y0, y1, z, zp + zh, false); c.kutu(x1 - kal, x1, y0, y1, z, zp + zh, false);
  return c;
}
// Kırma (dört yana eğimli) kiremit çatı: saçak, mahya ve kırma mahyaları, alın tahtası, oluk; bacalar ve anten. Kütle
// gölge için iki kutuyla yaklaşık.
function kirmaCati(T, kutleler, x0, x1, y0, y1, z, { egim = 30, sacak = 600, ton = 1, r = rnd(1), baca: bacaSay = 2, anten: antenSay = 1, renkK = P.karsiSiva, isitici = false }) {
  const t = Math.tan(egim * DEG), X0 = x0 - sacak, X1 = x1 + sacak, Y0 = y0 - sacak, Y1 = y1 + sacak;
  const ze = z - sacak * t, W = X1 - X0, D = Y1 - Y0, yatay = W >= D, yarim = Math.min(W, D) / 2, zr = ze + yarim * t;
  const xc = (X0 + X1) / 2, yc = (Y0 + Y1) / 2;
  let a, b, yuzler;
  if (yatay) {
    a = [X0 + yarim, yc, zr]; b = [X1 - yarim, yc, zr];
    yuzler = [[[X0, Y0, ze], [X1, Y0, ze], b, a], [[X1, Y1, ze], [X0, Y1, ze], a, b], [[X0, Y1, ze], [X0, Y0, ze], a], [[X1, Y0, ze], [X1, Y1, ze], b]];
  } else {
    a = [xc, Y0 + yarim, zr]; b = [xc, Y1 - yarim, zr];
    yuzler = [[[X1, Y0, ze], [X1, Y1, ze], b, a], [[X0, Y1, ze], [X0, Y0, ze], a, b], [[X0, Y0, ze], [X1, Y0, ze], a], [[X1, Y1, ze], [X0, Y1, ze], b]];
  }
  const sn = Math.sin(egim * DEG), tonR = [ton, ton, ton];
  for (const k of yuzler) {
    const e = [k[1][0] - k[0][0], k[1][1] - k[0][1]], L = Math.hypot(...e), ex = e[0] / L, ey = e[1] / L;
    T.ekle('kiremit', yuz(k, [0, 0, 1], k.map((p) => [(p[0] * ex + p[1] * ey) / 1680, (p[2] - ze) / sn / 1980])), tonR);
  }
  const mahya = P.kiremitKoyu.map((v) => v * ton);
  T.cubuk('beyaz', a, b, 110, 6, mahya);
  for (const [p, q] of [[[X0, Y0, ze], yatay ? a : a], [[X1, Y0, ze], yatay ? b : a], [[X0, Y1, ze], yatay ? a : b], [[X1, Y1, ze], yatay ? b : b]]) T.cubuk('beyaz', p, q, 85, 5, mahya);
  // alın tahtası ve oluk
  const ALIN = renk(0x6f5a48);
  T.kutu('beyaz', X0 - 30, X1 + 30, Y0 - 30, Y0, ze - 200, ze + 20, ALIN); T.kutu('beyaz', X0 - 30, X1 + 30, Y1, Y1 + 30, ze - 200, ze + 20, ALIN);
  T.kutu('beyaz', X0 - 30, X0, Y0, Y1, ze - 200, ze + 20, ALIN); T.kutu('beyaz', X1, X1 + 30, Y0, Y1, ze - 200, ze + 20, ALIN);
  T.kutu('metal', X0 - 30, X1 + 30, Y0 - 130, Y0 - 30, ze - 150, ze - 40, P.metal); T.kutu('metal', X0 - 30, X1 + 30, Y1 + 30, Y1 + 130, ze - 150, ze - 40, P.metal);
  // saçak altı gölgesi (duvarın üst bandı)
  for (const [yon, d, a0, a1] of [['-y', y0, x0, x1], ['+y', y1, x0, x1], ['-x', x0, y0, y1], ['+x', x1, y0, y1]]) cerceve(T, yon, d).golge(a0, a1, 25, z - 900, z, 0, 0.4);
  const yuk = (x, y) => ze + t * Math.min(x - X0, X1 - x, y - Y0, Y1 - y); // çatı yüzeyinin kotu
  for (let i = 0; i < bacaSay; i++) {
    const bx = x0 + 1500 + r() * (x1 - x0 - 3000), by = y0 + 1500 + r() * (y1 - y0 - 3000);
    baca(T, null, bx, by, z - 200, 520, 520, yuk(bx, by) + 750 - z + 200 + r() * 300, renkK, r() < 0.4 ? 2 : 0);
  }
  for (let i = 0; i < antenSay; i++) { const tt = 0.25 + r() * 0.5; anten(T, null, a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt, zr - 60, 2200 + r() * 900, r() * 360); }
  if (isitici) {
    const ix = xc + (r() - 0.5) * (W * 0.3), iy = Y0 + D * 0.22;
    gunesIsitici(T, null, ix, iy, yuk(ix, iy) - 150, 180, 2, 40 - egim * 0.6);
  }
  kutleler.push([X0, X1, Y0, Y1, ze], [X0 + yarim * 0.5, X1 - yarim * 0.5, Y0 + yarim * 0.5, Y1 - yarim * 0.5, ze + (zr - ze) * 0.5]);
  return { zr, ze };
}

// Düz çatıyı donat (rastgele: merdiven kulesi, depolar, ısıtıcılar, antenler, çanak, bacalar)
function catiDonat(T, c, x0, x1, y0, y1, z, r, renkK, { yogun = 1, guneyYon = 180 } = {}) {
  const ix0 = x0 + 700, ix1 = x1 - 700, iy0 = y0 + 700, iy1 = y1 - 700, W = ix1 - ix0, D = iy1 - iy0;
  if (W < 2500 || D < 2500) return;
  const sx = ix0 + r() * (W - 2600), sy = iy0 + D * 0.45 + r() * (D * 0.55 - 4200);
  merdivenKulesi(T, c, sx, sx + 2600, sy, sy + 4000, z, 2600, { yon: '-y', a: sx + 1300 }, renkK);
  if (r() < 0.8 * yogun) depoDik(T, c, sx + 700, sy + 1400, z + 2660, 500, 1100, r() < 0.5 ? P.tank : renk(0x41709e), 300);
  if (r() < 0.6 * yogun) depoYatik(T, c, sx + 1800, sy + 2400, z + 2660, 500, 1600, false, r() < 0.5 ? renk(0xd9d1bd) : P.tank);
  const nIs = Math.floor(r() * 3 * yogun);
  for (let i = 0; i < nIs; i++) {
    const gx = ix0 + 1100 + r() * (W - 2200), gy = iy0 + 400 + r() * Math.max(10, D * 0.35);
    if (gx + 1100 > sx && gx - 1100 < sx + 2600 && gy + 2000 > sy) continue;
    gunesIsitici(T, c, gx, gy, z, guneyYon, r() < 0.7 ? 2 : 1, 38 + r() * 6);
  }
  for (let i = 0; i < 1 + Math.floor(r() * 2.5 * yogun); i++) anten(T, c, ix0 + r() * W, iy1 - r() * 600, z, 2200 + r() * 1200, r() * 360);
  if (r() < 0.7 * yogun) canak(T, c, ix0 + r() * W, iy0 + r() * 500, z, 600 + r() * 300);
  if (r() < 0.8) baca(T, c, ix0 + r() * W, iy1 - 300, z, 700, 600, 1400 + r() * 1200, renkK, Math.floor(r() * 4));
}

// Atlas cepheli bina: ön (sokak) cephe, zemin kat, arka cephe, yanlar; düz ya da kırma çatı
function atlasBina(T, A, kutleler, b, r) {
  const { x0, x1, y0, y1, onYon, zemin, kat, ust } = b;
  const L = x1 - x0, aks = L / Math.max(1, Math.round(L / (b.aksBoy ?? 3100)));
  const dOn = onYon === '-y' ? y0 : y1, dArka = onYon === '-y' ? y1 : y0, arkaYon = onYon === '-y' ? '+y' : '-y';
  T.cephe(onYon, dOn, x0, x1, Z0, zemin, x0, Z0, aks, zemin - Z0, b.tipZemin ?? 4, b.tohum, b.renk);
  T.cephe(onYon, dOn, x0, x1, zemin, ust, x0, zemin, aks, kat, b.tipOn, b.tohum, b.renk);
  T.cephe(arkaYon, dArka, x0, x1, Z0, ust, x0, zemin - kat, aks, kat, b.tipArka ?? 6, b.tohum + 7, b.renk);
  T.cephe('-x', x0, y0, y1, Z0, ust, y0, zemin - kat, 3000, kat, b.tipYan ?? 5, b.tohum + 3, b.renk);
  T.cephe('+x', x1, y0, y1, Z0, ust, y0, zemin - kat, 3000, kat, b.tipYan ?? 5, b.tohum + 5, b.renk);
  // kat bantları ve balkon levhaları (ön cephe kabartması)
  const C = cerceve(T, onYon, dOn);
  if (b.bant) for (let z = zemin; z < ust - 10; z += kat) C.kutu('siva', x0, x1, 0, 90, z - 160, z, b.renk.map((v) => v * 1.04), 1000);
  if (b.balkon) {
    const n = Math.round(L / aks);
    for (let i = 0; i < n; i++) {
      if ((i + b.tohum) % b.balkon !== 0) continue;
      const a0 = x0 + i * aks + 150, a1 = x0 + (i + 1) * aks - 150;
      for (let z = zemin; z < ust - kat + 10; z += kat) {
        C.kutu('beton', a0, a1, 0, 1150, z - 150, z, P.betonAcik, 1000);
        C.kutu('siva', a0, a1, 1080, 1170, z, z + 950, b.renk, 1000);
        C.kutu('siva', a0, a0 + 90, 0, 1170, z, z + 950, b.renk, 1000); C.kutu('siva', a1 - 90, a1, 0, 1170, z, z + 950, b.renk, 1000);
        C.golge(a0, a1, 4, z - 150 - 700, z - 150, 0, 0.32);
      }
    }
  }
  if (b.cati === 'kirma') {
    kirmaCati(T, kutleler, x0, x1, y0, y1, ust, { egim: 26 + r() * 8, sacak: 500 + r() * 200, ton: 0.85 + r() * 0.3, r, baca: 2 + Math.floor(r() * 3), anten: 1 + Math.floor(r() * 2), renkK: b.renk, isitici: r() < 0.5 });
  } else {
    kutleler.push([x0, x1, y0, y1, ust + 800]);
    const cekme = b.cekme ?? (r() < 0.3 && L > 9000);
    const c = duzCati(T, A, x0, x1, y0, y1, ust, { renkK: b.renk, tip: cekme ? 'karo' : ['membran', 'cakil', 'karo', 'boya', 'beton'][Math.floor(r() * 5)], mm: b.mm ?? 100, tohum: b.tohum });
    if (!cekme) { catiDonat(T, c, x0, x1, y0, y1, ust, r, b.renk, { yogun: b.yogun ?? 1 }); return; }
    // çekme kat: sokak yüzünden 2,7 m, arkadan ve yanlardan ~0,5 m içeride bir kat; önü teras (saksılar)
    const g0 = onYon === '-y' ? y0 + 2700 : y0 + 500, g1 = onYon === '-y' ? y1 - 500 : y1 - 2700, cx0 = x0 + 600, cx1 = x1 - 600, zk = ust + kat;
    T.cephe(onYon, onYon === '-y' ? g0 : g1, cx0, cx1, ust, zk, cx0, ust, aks, kat, b.tipOn === 7 ? 2 : b.tipOn, b.tohum + 11, b.renk);
    T.cephe(arkaYon, onYon === '-y' ? g1 : g0, cx0, cx1, ust, zk, cx0, ust, aks, kat, b.tipArka ?? 6, b.tohum + 12, b.renk);
    T.cephe('-x', cx0, g0, g1, ust, zk, g0, ust, 3000, kat, 5, b.tohum + 13, b.renk);
    T.cephe('+x', cx1, g0, g1, ust, zk, g0, ust, 3000, kat, 5, b.tohum + 14, b.renk);
    c.kutu(cx0, cx1, g0, g1, ust, zk + 560);
    kutleler.push([cx0, cx1, g0, g1, zk + 560]);
    const c2 = duzCati(T, A, cx0, cx1, g0, g1, zk, { renkK: b.renk, tip: 'membran', mm: b.mm ?? 100, tohum: b.tohum + 5, parapet: 500 });
    catiDonat(T, c2, cx0, cx1, g0, g1, zk, r, b.renk, { yogun: 0.7 });
    const ty = onYon === '-y' ? y0 + 900 : y1 - 900;
    for (let x = x0 + 1200; x < x1 - 1200; x += 1800 + r() * 1500) saksi(T, x, ty, ust, 700, 350, r);
  }
}

// Bir sıra bitişik bina (x0..x1): farklı genişlik, kat sayısı, renk, cephe tipi, çatı
function sira(T, A, kutleler, { x0, x1, yOn, derin, onYon, tohum, katlar = [3, 8], kirma = 0.3, mm = 100 }) {
  const r = rnd(tohum);
  let x = x0, i = 0;
  while (x < x1 - 3000) {
    let w = 9000 + r() * 7000;
    if (x1 - (x + w) < 7000) w = x1 - x;
    const n = katlar[0] + Math.floor(r() * (katlar[1] - katlar[0] + 1)), kat = 2800 + Math.round(r() * 3) * 100, zeminH = 3000 + Math.round(r() * 6) * 100;
    const zemin = Z0 + zeminH, ust = zemin + (n - 1) * kat;
    const y0 = onYon === '-y' ? yOn : yOn - derin, y1 = onYon === '-y' ? yOn + derin : yOn;
    const tipOn = [0, 0, 7, 2, 0, 3, 7, 1][Math.floor(r() * 8)];
    atlasBina(T, A, kutleler, {
      x0: x, x1: x + w, y0, y1, onYon, zemin, kat, ust, tipOn, tohum: tohum * 10 + i, tipArka: [6, 6, 0, 2, 7, 1][Math.floor(r() * 6)],
      renk: renk(PALET[Math.floor(r() * PALET.length)]), cati: r() < kirma ? 'kirma' : 'duz', mm,
      balkon: tipOn === 3 ? 1 : r() < 0.5 ? 2 + Math.floor(r() * 2) : 0, bant: r() < 0.5,
    }, r);
    x += w; i++;
  }
}

// ---- sokaklar ve zemin ----
function sokaklar(T) {
  const ka = Z0 + SEHIR.kaldirim, ASF = renk(0x3e3f42), KALD = renk(0xd2cdc6), BORDUR = renk(0xd9d6d0), CIZGI = renk(0xd9d8d2);
  const [as0, as1] = SEHIR.araSokak;
  // doğu-batı sokaklar: [yKaldirim0, yAsfalt0, yAsfalt1, yKaldirim1]
  for (const [k0, a0, a1, k1] of [[2600, 5080, 13180, 15680], [45000, 47500, 58500, 61000], [-42000, -39500, -32500, -30000]]) {
    T.kutu('asfalt', -90000, 130000, a0, a1, Z0 - 300, Z0, ASF, 3000);
    for (const [s0, s1] of [[-90000, as0], [as1, 130000]]) {
      T.kutu('kaldirim', s0, s1, k0, a0 - 150, Z0 - 300, ka, KALD, 2000);
      T.kutu('kaldirim', s0, s1, a1 + 150, k1, Z0 - 300, ka, KALD, 2000);
      T.kutu('kaldirim', s0, s1, a0 - 150, a0, Z0 - 300, ka + 10, BORDUR, 500);
      T.kutu('kaldirim', s0, s1, a1, a1 + 150, Z0 - 300, ka + 10, BORDUR, 500);
    }
    const yc = (a0 + a1) / 2;
    for (let x = -90000; x < 130000; x += 8000) if (x + 3000 < as0 || x > as1) T.kutu('asfalt', x, x + 3000, yc - 60, yc + 60, Z0, Z0 + 4, CIZGI);
    for (let i = 0; i < 9; i++) { const y = a0 + 400 + i * ((a1 - a0 - 800) / 8.5); T.kutu('asfalt', as0 - 3400, as0 - 400, y, y + 450, Z0, Z0 + 4, CIZGI); }
  }
  // ara sokak (kuzey-güney): asfalt kavşakta ana sokağın biraz altında (çakışmasın)
  T.kutu('asfalt', as0 + 2500, as1 - 2500, -90000, 130000, Z0 - 300, Z0 - 25, ASF, 3000);
  for (const [s0, s1] of [[-90000, -42000], [-30000, 2600], [15680, 45000], [61000, 130000]]) {
    T.kutu('kaldirim', as0, as0 + 2350, s0, s1, Z0 - 300, ka, KALD, 2000); T.kutu('kaldirim', as1 - 2350, as1, s0, s1, Z0 - 300, ka, KALD, 2000);
    T.kutu('kaldirim', as0 + 2350, as0 + 2500, s0, s1, Z0 - 300, ka + 10, BORDUR, 500); T.kutu('kaldirim', as1 - 2500, as1 - 2350, s0, s1, Z0 - 300, ka + 10, BORDUR, 500);
  }
  // bahçeler ve uzak zemin
  T.kutu('zemin', -150000, 150000, -150000, 150000, Z0 - 400, Z0 - 60, BEYAZ, 8000);
}

// Ağaç kartları (çapraz iki düzlem; normal yukarı: her açıdan aynı aydınlanır)
function agaclar(T, liste) {
  for (const [x, y, h, tur, ton] of liste) {
    const w = tur === 0 ? h * 0.32 : h * 0.95, u0 = tur === 0 ? 0 : 0.5;
    // iki yüzlü malzeme arka yüzün normalini ters çevirir (alttan aydınlanır, kartlar iki ton görünür): her kart iki kez,
    // iki yöne dolanımlı ve ikisinde de normal yukarı
    for (const a of [0.3, 0.3 + Math.PI / 2]) for (const s of [1, -1]) {
      const dx = Math.cos(a) * w / 2, dy = Math.sin(a) * w / 2;
      const g = yuz([[x - dx, y - dy, Z0 - 50], [x + dx, y + dy, Z0 - 50], [x + dx, y + dy, Z0 - 50 + h], [x - dx, y - dy, Z0 - 50 + h]], [-dy * s, dx * s, 0], [[u0, 0], [u0 + 0.5, 0], [u0 + 0.5, 1], [u0, 1]]);
      const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0, 1);
      T.ekle('agac', g, [ton * 0.4, ton * 0.43, ton * 0.36]); // normal yukarı: tam güneş alır; yaprakların kendi gölgesi yerine ton koyu
    }
  }
}

// ---- bizim bina: kuzey cephesi (sokağa), balkonlar; doğu ve batı yüzü sağır, güney arka cephe (atlas) ----
function bizimBina(T, kutleler) {
  const B = SEHIR.bizim, yf = B.y1, SIVA = P.bizimSiva, ust = B.ust;
  const C = cerceve(T, '+y', yf);
  C.kutu('siva', B.x0, B.x1, -250, 0, Z0, ust, SIVA, 1000);
  T.kutu('siva', B.x1 - 250, B.x1, B.y0, yf - 250, Z0, ust, SIVA, 1000);
  T.kutu('siva', B.x0, B.x0 + 250, B.y0, yf - 250, Z0, ust, SIVA, 1000);
  T.cephe('-y', B.y0, B.x0, B.x1, Z0, ust, B.x0, Z0, (B.x1 - B.x0) / 3, 3000, 6, 909, SIVA);
  C.kutu('beton', B.x0, B.x1, 0, 40, Z0, Z0 + 600, P.beton, 1000);
  for (const z of [-12000, -9000, -6000, -3000]) C.kutu('siva', B.x0, B.x1, 0, 60, z - 200, z, SIVA.map((v) => v * 1.03), 1000);
  const KASA = P.koyu, r = rnd(5);
  const pencere = (a, gen, zf, perde) => {
    const z0 = zf + 900, z1 = zf + 2300;
    C.kutu('beyaz', a - gen / 2 - 60, a + gen / 2 + 60, 0, 140, z0 - 50, z0, P.mermer);
    C.kutu(perde ? 'beyaz' : 'cam', a - gen / 2, a + gen / 2, 0, 20, z0, z1, perde ? P.perde : P.cam);
    for (const [p, q, s, t] of [[a - gen / 2 - 50, a + gen / 2 + 50, z0, z0 + 50], [a - gen / 2 - 50, a + gen / 2 + 50, z1 - 50, z1], [a - gen / 2 - 50, a - gen / 2, z0, z1], [a + gen / 2, a + gen / 2 + 50, z0, z1], [a - 20, a + 20, z0, z1]]) C.kutu('metal', p, q, 0, 60, s, t, KASA);
    C.golge(a - gen / 2 - 60, a + gen / 2 + 60, 2, z0 - 500, z0 - 50, 0, 0.18);
  };
  // zemin kat: apartman girişi (kapı, saçak), demirli pencereler
  C.kutu('cam', -2450, -1150, 0, 20, Z0 + 150, Z0 + 2400, P.vitrin);
  C.kutu('metal', -2500, -1100, 0, 60, Z0 + 2400, Z0 + 2480, KASA); C.kutu('metal', -2500, -2450, 0, 60, Z0 + 150, Z0 + 2400, KASA); C.kutu('metal', -1150, -1100, 0, 60, Z0 + 150, Z0 + 2400, KASA);
  C.kutu('beton', -2800, -800, 0, 1100, Z0 + 2650, Z0 + 2750, P.betonAcik);
  C.golge(-2800, -800, 2, Z0 + 2000, Z0 + 2650, 0, 0.35);
  for (const [a, gen] of [[-4750, 1400], [800, 1400], [2775, 900]]) { pencere(a, gen, Z0, false); for (let q = a - gen / 2 + 60; q < a + gen / 2; q += 130) C.kutu('metal', q, q + 18, 60, 90, Z0 + 900, Z0 + 2300, KASA); }
  // katlar: A ve B aksı pencere, C aksı balkon (orta katta odanın balkonu), D dar pencere
  const BK = SEHIR.balkon;
  for (const zf of [-12000, -9000, -6000, -3000]) {
    pencere(-4750, 1400, zf, r() < 0.4); pencere(-1725, 1400, zf, r() < 0.4); pencere(2775, 900, zf, r() < 0.3);
    const oda = zf === BK.z;
    C.kutu('beton', BK.x0, BK.x1, 0, BK.y1 - BK.y0, zf - 170, zf, P.betonAcik, 1000);
    if (oda) C.kutu('beyaz', BK.x0 + 20, BK.x1 - 20, 0, BK.y1 - BK.y0 - 20, zf, zf + 25, renk(0x8f7660));
    C.golge(BK.x0, BK.x1, 3, zf - 170 - 800, zf - 170, 0, 0.3);
    // korkuluk: koyu metal, 1000 yüksek, 115'te bir dikme
    const ky = BK.y1 - BK.y0 - 40;
    C.kutu('metal', BK.x0, BK.x1, ky - 22, ky + 22, zf + 1000, zf + 1045, KASA);
    for (const a of [BK.x0 + 22, BK.x1 - 22]) { C.kutu('metal', a - 22, a + 22, 20, ky, zf + 1000, zf + 1045, KASA); C.kutu('metal', a - 22, a + 22, ky - 22, ky + 22, zf, zf + 1000, KASA); C.kutu('metal', a - 8, a + 8, 20, ky, zf + 80, zf + 96, KASA); }
    for (let q = BK.x0 + 100; q < BK.x1 - 60; q += 115) C.kutu('metal', q - 8, q + 8, ky - 8, ky + 8, zf, zf + 1000, KASA);
    // cam, kapı ve kasalar (oda: x −150..1750, kapı 350..1250, denizlik 850, üst 2300)
    for (const [p, q, s] of [[BK.x0, 350, zf + 850], [350, 1250, zf + 20], [1250, 1750, zf + 850]]) {
      C.kutu(oda || r() < 0.5 ? 'beyaz' : 'cam', p, q, 0, 20, s, zf + 2300, oda || r() < 0.5 ? P.perde : P.cam);
      C.kutu('metal', p, q, 0, 60, s - 50, s, KASA);
      C.kutu('metal', p, p + 50, 0, 60, s, zf + 2300, KASA); C.kutu('metal', q - 50, q, 0, 60, s, zf + 2300, KASA);
    }
    C.kutu('metal', BK.x0, 1750, 0, 60, zf + 2300, zf + 2360, KASA);
    if (!oda && r() < 0.7) saksi(T, ...C.nokta(BK.x0 + 500, 1200, 0).slice(0, 2), zf, 700, 250, r);
  }
  kutleler.push([B.x0, B.x1, B.y0, yf, 0], [-6000, 3400, -2500, 2400, 3500]); // çatı odası (ana oturum kurar) gölge için
}

// ---- karşı bina (orta katla aynı: scripts/oda-blender.py karsi_kur) ve çatısı ----
function karsiBina(T, A, kutleler) {
  const K = SEHIR.karsi, yf = K.y, x0 = K.x0, x1 = K.x1, y1 = K.y1, zc = K.cati, zp = K.parapet - 60, r = rnd(11);
  const SIVA = P.karsiSiva, C = cerceve(T, '-y', yf);
  // gövde: zemin kat beton, üstte sıva (parapet dahil); yan ve arka duvarlar parapete kadar
  C.kutu('beton', x0, x1, -250, 0, Z0, -12000, P.beton, 1000);
  C.kutu('siva', x0, x1, -250, 0, -12000, zp, SIVA, 1000);
  T.kutu('siva', x0, x0 + 250, yf + 250, y1, Z0, zp, SIVA, 1000);
  T.kutu('siva', x1 - 250, x1, yf + 250, y1, Z0, zp, SIVA, 1000);
  T.kutu('siva', x0 + 250, x1 - 250, y1 - 250, y1, Z0, zp, SIVA, 1000);
  for (const [a0, a1, b0, b1] of [[x0 - 30, x1 + 30, yf - 30, yf + 280], [x0 - 30, x1 + 30, y1 - 280, y1 + 30], [x0 - 30, x0 + 280, yf + 280, y1 - 280], [x1 - 280, x1 + 30, yf + 280, y1 - 280]]) T.kutu('beton', a0, a1, b0, b1, zp, zp + 60, P.betonAcik, 1000);
  T.cephe('+y', y1, x0, x1, Z0, zp, x0, Z0, 4000, 3000, 6, 77, SIVA);
  // kat bantları (beton, 120 dışarı, 180 yüksek)
  for (const z of [-12000, -9000, -6000, -3000]) C.kutu('beton', x0, x1, 0, 120, z - 180, z, P.beton, 1000);
  C.golge(x0, x1, 2, Z0 + 2850 - 400, Z0 + 2850, 0, 0.2);
  // bölmeler: zemin katta dükkân, üstte (i + k) tekse balkon, değilse pencere
  for (let i = 2; i <= 7; i++) {
    const x = -18000 + 2000 + 4000 * i;
    C.k('cam', 3100, 30, 1900, x, 15, Z0 + 450, P.vitrin);
    for (const fx of [x - 1550, x + 1550]) C.k('metal', 60, 50, 1900, fx, 25, Z0 + 450, P.koyu);
    C.k('beyaz', 3100, 70, 380, x, 35, Z0 + 2400, P.pvc);
    C.k('metal', 3400, 60, 50, x, 30, Z0 + 2800, P.koyu);
    K.katlar.forEach((zf, k) => {
      if ((i + k) % 2 === 1) {
        C.k('beton', 2700, 1300, 170, x, 650, zf - 170, P.beton);
        C.golge(x - 1350, x + 1350, 3, zf - 170 - 750, zf - 170, 0, 0.3);
        const yz = zf + 1000, ky = 1260;
        C.k('metal', 2700, 45, 45, x, ky, yz, P.koyu);
        for (const sx of [-1, 1]) { C.k('metal', 45, 1250, 45, x + sx * 1327, 640, yz, P.koyu); C.k('metal', 45, 45, 1000, x + sx * 1327, ky, zf, P.koyu); }
        for (let b = x - 1300; b < x + 1300; b += 115) C.k('metal', 16, 16, 1000, b, ky, zf, P.koyu);
        for (const sx of [-1, 1]) for (let b = 130; b < 1200; b += 115) C.k('metal', 16, 16, 1000, x + sx * 1327, b, zf, P.koyu); // yan dikmeler
        if (r() < 0.7) { const sx = r() < 0.5 ? -1 : 1; saksi(T, ...C.nokta(x + sx * 750, 1060, 0).slice(0, 2), zf, 700, 240, r); }
        for (const [cx, cw, cz] of [[x - 700, 500, zf + 850], [x, 900, zf + 40], [x + 700, 500, zf + 850]]) {
          const ch = zf + 2300 - cz;
          C.k('beyaz', cw, 30, ch, cx, 15, cz, P.perde);
          for (let kx = cx - cw / 2 + 55; kx < cx + cw / 2 - 30; kx += 105) C.k('beyaz', 34, 14, ch - 20, kx, 37, cz + 10, P.perde.map((v) => v * 0.9));
        }
        for (const [fw, fh, fx, fz] of [[2020, 60, x, zf + 2300], [560, 60, x - 700, zf + 790], [560, 60, x + 700, zf + 790], [960, 40, x, zf], [60, 1510, x - 980, zf + 790], [60, 1510, x + 980, zf + 790], [60, 2300, x - 450, zf], [60, 2300, x + 450, zf]]) C.k('beyaz', fw, 70, fh, fx, 35, fz, P.pvc);
        C.k('metal', 22, 40, 170, x + 385, 85, zf + 980, P.koyu);
      } else {
        const gw = 1600, gh = 1500, gz = zf + 900;
        C.k('beyaz', gw + 200, 140, 50, x, 70, gz - 50, P.mermer);
        C.golge(x - gw / 2 - 100, x + gw / 2 + 100, 2, gz - 650, gz - 50, 0, 0.16);
        const perde = r() < 0.35;
        C.k(perde ? 'beyaz' : 'cam', gw, 30, gh, x, 15, gz, perde ? P.perde : P.cam);
        for (const [fw, fh, fx, fz] of [[gw + 120, 60, x, gz - 60], [gw + 120, 60, x, gz + gh], [60, gh, x - gw / 2 - 30, gz], [60, gh, x + gw / 2 + 30, gz], [40, gh, x, gz]]) C.k('beyaz', fw, 70, fh, fx, 35, fz, P.pvc);
      }
    });
  }
  // cephedeki eşyalar: iki klima dış ünitesi (pencere altında), balkon korkuluğunda çanak
  klima(T, null, -4000 + 1150, yf - 200, -9000 + 250, '-y');
  klima(T, null, 8000 - 1150, yf - 200, -6000 + 250, '-y');
  canak(T, null, 4000 + 1100, yf - 1350, -6000 + 700, 600, 160, 38, 250);
  canak(T, null, -8000 - 1000, yf - 1350, -9000 + 700, 550, 150, 38, 250);

  // ---- çatı (−3000): bitümlü membran; gölgeler dokuya pişer ----
  const c = A.ekle(x0 + 250, x1 - 250, yf + 250, y1 - 250, zc, 'membran', 26, 7);
  c.kutu(x0, x1, yf, yf + 250, zc, zp + 60, false); c.kutu(x0, x1, y1 - 250, y1, zc, zp + 60, false);
  c.kutu(x0, x0 + 250, yf, y1, zc, zp + 60, false); c.kutu(x1 - 250, x1, yf, y1, zc, zp + 60, false);
  // merdiven kulesi (arka parapete dayalı, kapısı güneye: bize bakar), üstünde depolar ve antenler
  merdivenKulesi(T, c, -1400, 1400, 22400, y1 - 250, zc, 2700, { yon: '-y', a: 150 }, SIVA.map((v) => v * 0.97), { yon: '+x', a: 23300 });
  const zt = zc + 2760;
  depoDik(T, c, -650, 24200, zt, 520, 1250, P.tank, 380);
  depoDik(T, c, 650, 25500, zt, 470, 1100, renk(0x3f6f9e), 380);
  anten(T, c, 1150, 26900, zt, 2600, 205);
  anten(T, c, -1150, 26950, zt, 2100, 190);
  // asansör makine dairesi (kulenin doğusunda, daha yüksek; panjur güneye)
  makineDairesi(T, c, 1400, 3700, 24300, y1 - 250, zc, 3000, SIVA.map((v) => v * 0.95), '-y');
  // güneş enerjili su ısıtıcıları (kolektörler güneye bakar)
  gunesIsitici(T, c, -7200, 19400, zc, 180, 2, 40);
  gunesIsitici(T, c, -4300, 19600, zc, 180, 2, 40);
  gunesIsitici(T, c, 7900, 20200, zc, 180, 2, 40);
  // antenler ve çanaklar
  anten(T, c, -9100, 26800, zc, 2900, 215);
  anten(T, c, 12900, 26700, zc, 2500, 200);
  anten(T, c, 5600, 16500, zc, 2300, 230);
  canak(T, c, -2700, 16450, zc, 820, 155, 38, 700);
  canak(T, c, 10700, 16500, zc, 650, 150, 38, 600);
  // kalorifer bacası (arka parapete dayalı), kombi boruları bloğu, küçük baca
  baca(T, c, 4900, 26750, zc, 1000, 1100, 3150, SIVA.map((v) => v * 0.93), 0);
  baca(T, c, -5200, 26800, zc, 800, 700, 1500, SIVA.map((v) => v * 0.93), 4);
  baca(T, c, 9250, 23300, zc, 500, 500, 1300, SIVA.map((v) => v * 0.93), 0);
  kombiBorusu(T, c, 11800, 24000, zc, 1200);
  kombiBorusu(T, c, 12050, 24000, zc, 1350);
  // çamaşır ipi (kulenin batısında), plastik sandalye, saksılar, klima
  camasir(T, c, -7000, 23400, -2600, 23400, zc, r, 0.65);
  sandalye(T, -2200, 21400, zc, 1);
  saksi(T, -900, 21700, zc, 900, 350, r);
  saksi(T, 1100, 21650, zc, 600, 300, r);
  klima(T, c, 11600, 21000, zc + 100, '-y');
  depoYatik(T, c, -8600, 23300, zc, 420, 1500, false, renk(0xd9d1bd));
  kutleler.push([x0, x1, yf, y1, zp + 60], [-1400, 1400, 22400, y1, zc + 2760], [1400, 3700, 24300, y1, zc + 3060]);
}

// ---- karşı sıranın komşuları ----
// D (doğu, x 14000..24000): yeni bina; boy pencereli antrasit doğrama, cam korkuluklu balkonlar, ahşap görünümlü
// şeritler; çatı terası (ahşap deck), geri çekilmiş çatı katı, pergola ve teras eşyaları
function binaD(T, A, kutleler) {
  const x0 = 14000, x1 = 24000, yf = 15680, y1 = 27680, zt = -2400, KAP = renk(0xe4e4e0), AH = renk(0x9a6a45), r = rnd(23);
  const C = cerceve(T, '-y', yf);
  C.kutu('siva', x0, x1, -250, 0, Z0, zt + 150, KAP, 1000);
  T.kutu('siva', x1 - 250, x1, yf, y1, Z0, zt + 150, KAP, 1000);
  T.kutu('siva', x0, x0 + 250, yf, y1, Z0, zt + 1100, KAP, 1000);
  T.cephe('+y', y1, x0, x1, Z0, zt, x0, Z0, 3333, 3000, 3, 55, KAP);
  // zemin kat: kafe vitrini
  C.kutu('cam', x0 + 300, x1 - 300, 0, 20, Z0 + 100, Z0 + 3000, P.vitrin);
  for (let q = x0 + 300; q <= x1 - 300; q += 1900) C.kutu('metal', q - 30, q + 30, 0, 70, Z0 + 100, Z0 + 3000, P.antrasit);
  C.kutu('metal', x0 + 200, x1 - 200, 0, 90, Z0 + 3000, Z0 + 3500, P.antrasit);
  // katlar: üç aks, boy pencere, balkon (cam korkuluk), aks aralarında ahşap şerit
  for (const zf of [-11400, -8400, -5400]) {
    for (let i = 0; i < 3; i++) {
      const a = x0 + 1667 + i * 3333;
      const perde = r() < 0.35;
      C.kutu(perde ? 'beyaz' : 'cam', a - 1300, a + 1300, 0, 20, zf + 60, zf + 2650, perde ? P.perde : P.cam);
      for (const q of [a - 1300, a, a + 1300]) C.kutu('metal', q - 30, q + 30, 0, 60, zf + 60, zf + 2650, P.antrasit);
      C.kutu('metal', a - 1330, a + 1330, 0, 60, zf + 2620, zf + 2700, P.antrasit);
      C.kutu('siva', a - 1500, a + 1500, 0, 1400, zf - 160, zf, KAP, 1000);
      C.golge(a - 1500, a + 1500, 3, zf - 160 - 700, zf - 160, 0, 0.28);
      C.kutu('camKorkuluk', a - 1480, a + 1480, 1340, 1360, zf, zf + 1100, BEYAZ);
      for (const s of [-1, 1]) C.kutu('camKorkuluk', a + s * 1480 - 10, a + s * 1480 + 10, 20, 1340, zf, zf + 1100, BEYAZ);
      C.kutu('metal', a - 1500, a + 1500, 1330, 1370, zf + 1100, zf + 1140, P.antrasit);
      if (r() < 0.5) saksi(T, ...C.nokta(a + 900, 1000, 0).slice(0, 2), zf, 500, 400, r);
    }
    for (const q of [x0 + 150, x0 + 3333, x0 + 6667, x1 - 150]) C.kutu('beyaz', q - 150, q + 150, 0, 40, zf - 160, zf + 2840, AH);
  }
  // teras: ahşap deck, ön kenarda cam korkuluk, doğuda E'nin duvarı
  const c = A.ekle(x0 + 250, x1 - 250, yf + 250, y1 - 250, zt, 'deck', 34, 31);
  C.kutu('camKorkuluk', x0 + 250, x1 - 250, -60, -40, zt + 150, zt + 1250, BEYAZ);
  C.kutu('metal', x0 + 250, x1 - 250, -70, -30, zt + 1250, zt + 1290, P.antrasit);
  c.kutu(x0, x0 + 250, yf, y1, zt, zt + 1100, false);
  // geri çekilmiş çatı katı: güney yüzü sürme cam, düz çatısında güneş panelleri, klimalar
  const px0 = 16500, py0 = 19200, pz = zt + 2800;
  T.kutu('siva', px0, x1 - 250, py0, y1 - 250, zt, pz, renk(0xf0efeb), 1000, 0.08);
  const Cp = cerceve(T, '-y', py0);
  Cp.kutu('cam', px0 + 500, x1 - 750, 0, 20, zt + 60, zt + 2500, P.cam);
  for (let q = px0 + 500; q <= x1 - 750; q += 1400) Cp.kutu('metal', q - 30, q + 30, 0, 60, zt + 60, zt + 2500, P.antrasit);
  Cp.kutu('metal', px0 + 470, x1 - 720, 0, 60, zt + 2500, zt + 2560, P.antrasit);
  Cp.golge(px0, x1 - 250, 2, zt + 2000, zt + 2800, 0, 0.25);
  const Cb = cerceve(T, '-x', px0); // batı yüzü: iki geniş pencere
  for (const a of [21000, 24800]) { Cb.kutu('cam', a - 1100, a + 1100, 0, 20, zt + 700, zt + 2300, P.cam); Cb.kutu('metal', a - 1140, a + 1140, 0, 50, zt + 660, zt + 2340, P.antrasit); Cb.kutu('metal', a - 20, a + 20, 20, 60, zt + 700, zt + 2300, P.antrasit); }
  T.kutu('siva', px0 - 20, x1 - 230, py0 - 20, y1 - 230, pz, pz + 300, renk(0xe6e5e0), 1000);
  const c2 = A.ekle(px0 + 100, x1 - 350, py0 + 100, y1 - 350, pz, 'boya', 60, 32);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const M = new THREE.Matrix4().makeRotationX(-0.25).setPosition(px0 + 1400 + i * 1800, py0 + 2200 + j * 2100, pz + 450);
    T.matris('kolektor', new THREE.BoxGeometry(1700, 1000, 40), M, renk(0x1b2333));
    c2.noktalar([[px0 + 550 + i * 1800, py0 + 1700 + j * 2100, pz + 300], [px0 + 2250 + i * 1800, py0 + 2700 + j * 2100, pz + 600], [px0 + 550 + i * 1800, py0 + 2700 + j * 2100, pz + 600], [px0 + 2250 + i * 1800, py0 + 1700 + j * 2100, pz + 300]]);
  }
  klima(T, c2, 22600, 26300, pz, '-y'); klima(T, c2, 21500, 26300, pz, '-y');
  depoDik(T, c2, 17400, 26200, pz, 420, 900, P.tank, 250);
  // pergola: dört dikme, iki ana kiriş, ahşap lata
  const g0 = 16500, g1 = 23500, h0 = 16400, h1 = py0, gz = zt + 2550;
  for (const [x, y] of [[g0, h0], [g1, h0], [g0, h1 - 60], [g1, h1 - 60]]) { T.kutu('metal', x - 60, x + 60, y - 60, y + 60, zt, gz, P.antrasit); c.kutu(x - 60, x + 60, y - 60, y + 60, zt, gz); }
  for (const y of [h0, h1 - 60]) { T.kutu('metal', g0 - 60, g1 + 60, y - 60, y + 60, gz, gz + 220, P.antrasit); c.kutu(g0 - 60, g1 + 60, y - 60, y + 60, gz, gz + 220, false); }
  for (let x = g0 + 150; x < g1; x += 450) { T.kutu('beyaz', x - 30, x + 30, h0 - 200, h1 + 100, gz + 220, gz + 400, AH); c.kutu(x - 30, x + 30, h0 - 200, h1 + 100, gz + 220, gz + 400, false); }
  // teras eşyaları: masa, sandalyeler, kanepe, saksılar
  T.kutu('beyaz', 18600, 20400, 17300, 18300, zt + 700, zt + 750, AH); T.kutu('metal', 19450, 19550, 17750, 17850, zt, zt + 700, P.antrasit);
  c.kutu(18600, 20400, 17300, 18300, zt, zt + 750);
  for (const [x, y] of [[18300, 17800], [20700, 17800], [19000, 16900], [19900, 16900]]) { T.kutu('beyaz', x - 220, x + 220, y - 220, y + 220, zt + 430, zt + 470, renk(0x3b3d40)); T.kutu('beyaz', x - 200, x + 200, y - 200, y + 200, zt, zt + 430, renk(0x3b3d40)); }
  T.kutu('beyaz', 21600, 23300, 18300, 19000, zt, zt + 420, renk(0xcfc8bb)); T.kutu('beyaz', 21600, 23300, 18850, 19050, zt + 420, zt + 800, renk(0xcfc8bb));
  c.kutu(21600, 23300, 18300, 19050, zt, zt + 800);
  for (let x = 14700; x < 23500; x += 2200) { saksi(T, x, 16200, zt, 1200, 450, r); c.kutu(x - 600, x + 600, 15975, 16425, zt, zt + 700); }
  kutleler.push([x0, x1, yf, y1, zt + 1100], [px0, x1, py0, y1, pz + 300]);
}

// E (köşe, x 24000..32000): 8 katlı, açık sarı, ortada çıkma (cumba); düz çatıda depolar, antenler, ısıtıcılar
function binaE(T, A, kutleler) {
  const x0 = 24000, x1 = 32000, yf = 15680, y1 = 27680, zemin = Z0 + 3600, kat = 2900, ust = zemin + 7 * kat, R = renk(0xe8dbad), r = rnd(29);
  T.cephe('-y', yf, x0, x1, Z0, zemin, x0, Z0, 4000, 3600, 4, 61, R);
  T.cephe('-y', yf, x0, x1, zemin, ust, x0, zemin, 2000, kat, 0, 61, R);
  T.cephe('+x', x1, yf, y1, Z0, zemin, yf, Z0, 4000, 3600, 4, 62, R);
  T.cephe('+x', x1, yf, y1, zemin, ust, yf, zemin, 3000, kat, 0, 63, R);
  T.cephe('-x', x0, yf, y1, Z0, ust, yf, zemin, 3000, kat, 5, 64, R);
  T.cephe('+y', y1, x0, x1, Z0, ust, x0, zemin, 2700, kat, 6, 65, R);
  // çıkma: ön yüz pencereli, yanları dar pencere, altı düz
  const c0 = 26000, c1 = 30000, cy = yf - 900;
  T.cephe('-y', cy, c0, c1, zemin + kat, ust, c0, zemin + kat, 2000, kat, 0, 66, R);
  T.cephe('-x', c0, cy, yf, zemin + kat, ust, cy, zemin + kat, 900, kat, 5, 67, R);
  T.cephe('+x', c1, cy, yf, zemin + kat, ust, cy, zemin + kat, 900, kat, 5, 68, R);
  T.kutu('siva', c0, c1, cy, yf, zemin + kat - 200, zemin + kat, R, 1000);
  cerceve(T, '-y', yf).golge(c0 - 200, c1 + 200, 3, zemin + kat - 900, zemin + kat - 200, 0, 0.35);
  kutleler.push([x0, x1, yf, y1, ust + 800], [c0, c1, cy, yf, ust]);
  const c = duzCati(T, A, x0, x1, yf, y1, ust, { renkK: R, tip: 'membran', mm: 90, tohum: 41 });
  merdivenKulesi(T, c, 27000, 29600, 22500, 27200, ust, 2600, { yon: '-y', a: 27600 }, R);
  depoDik(T, c, 27600, 24200, ust + 2660, 520, 1200, P.tank, 300);
  depoYatik(T, c, 28900, 25300, ust + 2660, 480, 1500, false, renk(0x41709e));
  gunesIsitici(T, c, 25600, 18800, ust, 180, 2, 40); gunesIsitici(T, c, 30300, 18900, ust, 180, 1, 40);
  anten(T, c, 24800, 26800, ust, 2700, 210); anten(T, c, 31100, 22000, ust, 2400, 200); anten(T, c, 29900, 17000, ust, 2000, 225);
  canak(T, c, 26300, 16500, ust, 750); canak(T, c, 31200, 25500, ust, 600, 160);
  baca(T, c, 25200, 27000, ust, 900, 800, 2400, R, 3);
  camasir(T, c, 24900, 20800, 24900, 24400, ust, r, 0.4);
}

// ---- bizim sıranın komşuları ----
// Doğu komşu (x 3600..14000, çatı −3000): doğu penceremizden yukarıdan görülür; çakıllı çatı, beton karo yürüme yolu,
// merdiven kulesi (kapısı batıya: bize), depolar, ısıtıcılar, antenler, çanaklar, baca, kombi boruları, çamaşır ipi
function doguKomsu(T, A, kutleler) {
  const { x0, x1, cati: zc } = SEHIR.doguKomsu, y0 = -12000, y1 = 2600, R = renk(0xd6dccb), r = rnd(37);
  const zemin = Z0 + 3000;
  T.cephe('+y', y1, x0, x1, Z0, zemin, x0, Z0, 3467, 3000, 4, 71, R);
  T.cephe('+y', y1, x0, x1, zemin, zc, x0, zemin, 3467, 3000, 1, 71, R);
  T.cephe('-y', y0, x0, x1, Z0, zc, x0, zemin, 3467, 3000, 6, 72, R);
  T.cephe('+x', x1, y0, y1, Z0, zc, y0, zemin, 3000, 3000, 5, 73, R);
  const c = duzCati(T, A, x0, x1, y0, y1, zc, { renkK: R, tip: 'cakil', mm: 26, tohum: 43, kal: 200 });
  kutleler.push([x0, x1, y0, y1, zc + 860]);
  // Doğu penceresinden (kamera x 2800, z 1600, 21° aşağı) çatının x 7200..14000, y −6000..2600 kısmı görünür: eşyalar orada
  c.yollar.push([3800, 11000, -4300, -3300], [6800, 7800, -12000, 2400]);
  merdivenKulesi(T, c, 11000, 13600, -6200, -1600, zc, 2700, { yon: '-x', a: -3800, renk: renk(0x5a4636) }, R.map((v) => v * 0.96), { yon: '+y', a: 12300 });
  const zt = zc + 2760;
  depoYatik(T, c, 12300, -2700, zt, 520, 1800, false, renk(0x3f6f9e));
  gunesIsitici(T, c, 12300, -6000, zt, 180, 2, 40); // kulenin üstünde
  depoDik(T, c, 8700, -7200, zc, 480, 1150, P.tank, 300);
  anten(T, c, 13200, -1900, zt, 2400, 200);
  gunesIsitici(T, c, 10000, 300, zc, 180, 2, 40);
  gunesIsitici(T, c, 9600, -10200, zc, 180, 2, 42);
  gunesIsitici(T, c, 5200, -9400, zc, 180, 1, 40);
  anten(T, c, 7700, 2000, zc, 2700, 210); anten(T, c, 13300, 1900, zc, 2300, 195);
  canak(T, c, 7800, 600, zc, 760, 155, 38, 650); canak(T, c, 13600, 300, zc, 600, 150, 38, 500);
  baca(T, c, 13150, -11150, zc, 900, 900, 2700, R.map((v) => v * 0.94), 2);
  baca(T, c, 8200, -5200, zc, 700, 600, 1500, R.map((v) => v * 0.94), 3);
  camasir(T, c, 8600, -1100, 8600, -4600, zc, r, 0.75);
  klima(T, c, 4700, 2050, zc, '-y'); klima(T, c, 5800, 2050, zc, '-y');
  saksi(T, 10650, -4700, zc, 400, 400, r); saksi(T, 10650, -2900, zc, 400, 400, r);
  sandalye(T, 9800, -3600, zc, -1);
  depoYatik(T, c, 5200, -6000, zc, 400, 1300, true, renk(0xd9d1bd));
}
// Batı komşu (x −18000..−6200, çatı −3000): karo kaplı çatı; bizim bina ve çatı odası gölge düşürür
function batiKomsu(T, A, kutleler) {
  const { x0, x1, cati: zc } = SEHIR.batiKomsu, y0 = -12000, y1 = 2600, R = renk(0xe3c79a), r = rnd(47);
  const zemin = Z0 + 3000;
  T.cephe('+y', y1, x0, x1, Z0, zemin, x0, Z0, 3933, 3000, 4, 81, R);
  T.cephe('+y', y1, x0, x1, zemin, zc, x0, zemin, 2950, 3000, 7, 81, R);
  T.cephe('-y', y0, x0, x1, Z0, zc, x0, zemin, 2950, 3000, 6, 82, R);
  T.cephe('-x', x0, y0, y1, Z0, zc, y0, zemin, 3000, 3000, 5, 83, R);
  const c = duzCati(T, A, x0, x1, y0, y1, zc, { renkK: R, tip: 'karo', mm: 40, tohum: 53 });
  kutleler.push([x0, x1, y0, y1, zc + 860]);
  merdivenKulesi(T, c, -13200, -10600, -6200, -1800, zc, 2700, { yon: '+y', a: -12000 }, R);
  depoDik(T, c, -12400, -4000, zc + 2760, 500, 1150, P.tank, 300);
  depoDik(T, c, -11300, -2900, zc + 2760, 450, 1000, renk(0xd9d1bd), 300);
  gunesIsitici(T, c, -15500, -9500, zc, 180, 2, 40); gunesIsitici(T, c, -8800, -9300, zc, 180, 2, 40);
  anten(T, c, -16800, 1900, zc, 2800, 205); anten(T, c, -9000, 2000, zc, 2400, 215);
  canak(T, c, -14300, 2000, zc, 700);
  baca(T, c, -7200, -11100, zc, 800, 800, 2100, R, 2);
  camasir(T, c, -16600, -2000, -16600, -6400, zc, r, 0.5);
}

// ---- dışarıyı kur ----
export async function disarisi(scene, { reduce = false } = {}) {
  const yukle = (ad) => new THREE.TextureLoader().loadAsync(KOK + 'cati/' + ad);
  const [gokTex, meta, ortamTex] = await Promise.all([yukle('gok.webp'), fetch(KOK + 'cati/gok.json').then((r) => r.json()), yukle('ortam.webp')]);
  // u sarmasında (fract) türev sıçrar, yanlış mip seçilir: gök ve ortam dokusunda mip yok (dikiş çizgisi)
  for (const t of [gokTex, ortamTex]) { t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  ortamTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = ortamTex;
  scene.environmentRotation?.set(Math.PI / 2, 0, 0); // dokular Y yukarı varsayar, sahne Z yukarı
  scene.background = new THREE.Color(SEHIR.pus);
  scene.fog = new THREE.Fog(SEHIR.pus, ...SEHIR.sis);
  // kamera uzağı: kubbe ve uzak şehir 30 m'nin ötesinde
  const onceki = scene.onBeforeRender;
  scene.onBeforeRender = function (renderer, s, kamera, ...geri) {
    if (kamera?.isPerspectiveCamera && kamera.far < SEHIR.kameraUzak) { kamera.far = SEHIR.kameraUzak; kamera.updateProjectionMatrix(); }
    return onceki.call(this, renderer, s, kamera, ...geri);
  };

  const sure = {}, an = () => performance.now();
  let t0 = an();
  const gok = gokKubbesi(gokTex, meta);
  const bulut = bulutKartlari(bulutAtlasi());
  sure.bulut = an() - t0; t0 = an();
  const sil = siluet();
  sure.siluet = an() - t0; t0 = an();

  // şehir
  const T = new Toplu(), A = new CatiAtlasi(), kutleler = [];
  sokaklar(T);
  bizimBina(T, kutleler);
  karsiBina(T, A, kutleler);
  binaD(T, A, kutleler);
  binaE(T, A, kutleler);
  doguKomsu(T, A, kutleler);
  batiKomsu(T, A, kutleler);
  // karşı sıranın batısı: B (5 katlı, kiremit kırma çatı, gül kurusu), daha batıda alçak ve yüksek iki bina
  atlasBina(T, A, kutleler, { x0: -22000, x1: -10000, y0: 15680, y1: 27680, onYon: '-y', zemin: Z0 + 3200, kat: 2800, ust: -600, tipOn: 0, tohum: 91, renk: renk(0xdeb5a3), cati: 'kirma', balkon: 2, bant: true }, rnd(91));
  atlasBina(T, A, kutleler, { x0: -34000, x1: -22000, y0: 15680, y1: 27680, onYon: '-y', zemin: Z0 + 3000, kat: 2900, ust: Z0 + 3000 + 3 * 2900, tipOn: 7, tohum: 92, renk: renk(0xcfd7c2), cati: 'duz', mm: 70 }, rnd(92));
  atlasBina(T, A, kutleler, { x0: -46000, x1: -34000, y0: 15680, y1: 27680, onYon: '-y', zemin: Z0 + 3400, kat: 2900, ust: Z0 + 3400 + 6 * 2900, tipOn: 2, tohum: 93, renk: renk(0xe0d6c4), cati: 'duz', balkon: 3 }, rnd(93));
  // bizim sıranın doğusu: F (kırma çatı, eski bina), G (köşe, yüksek); batısı
  atlasBina(T, A, kutleler, { x0: 14000, x1: 26000, y0: -12000, y1: 2600, onYon: '+y', zemin: Z0 + 3000, kat: 3000, ust: -6000, tipOn: 7, tohum: 94, renk: renk(0xdcae94), cati: 'kirma', bant: true }, rnd(94));
  atlasBina(T, A, kutleler, { x0: 26000, x1: 32000, y0: -12000, y1: 2600, onYon: '+y', zemin: Z0 + 3200, kat: 2900, ust: Z0 + 3200 + 3 * 2900, tipOn: 2, tohum: 95, renk: renk(0xd9d3bd), cati: 'duz', mm: 60, balkon: 2 }, rnd(95));
  atlasBina(T, A, kutleler, { x0: -30000, x1: -18000, y0: -12000, y1: 2600, onYon: '+y', zemin: Z0 + 3000, kat: 3000, ust: -3000, tipOn: 0, tohum: 96, renk: renk(0xe6c9c0), cati: 'kirma' }, rnd(96));
  atlasBina(T, A, kutleler, { x0: -46000, x1: -30000, y0: -12000, y1: 2600, onYon: '+y', zemin: Z0 + 3200, kat: 2900, ust: Z0 + 3200 + 5 * 2900, tipOn: 1, tohum: 97, renk: renk(0xd3dac4), cati: 'duz' }, rnd(97));
  // arka sıralar ve ara sokağın ötesi
  sira(T, A, kutleler, { x0: -46000, x1: 20000, yOn: 45000, derin: 12000, onYon: '+y', tohum: 201, katlar: [3, 4], kirma: 0.35 });
  // arka sıranın doğu ucunda yüksek blok (9 kat, modern cephe): ortadaki ufku kapatmadan çerçeveler
  atlasBina(T, A, kutleler, { x0: 20000, x1: 32000, y0: 33000, y1: 45000, onYon: '+y', zemin: Z0 + 3600, kat: 2950, ust: Z0 + 3600 + 8 * 2950, tipOn: 3, tipArka: 1, tipYan: 0, tohum: 98, renk: renk(0xdedcd4), cati: 'duz', cekme: false, yogun: 1.3 }, rnd(98));
  sira(T, A, kutleler, { x0: 44000, x1: 92000, yOn: 15680, derin: 12000, onYon: '-y', tohum: 202, katlar: [4, 8] });
  sira(T, A, kutleler, { x0: 44000, x1: 92000, yOn: 45000, derin: 12000, onYon: '+y', tohum: 203, katlar: [4, 9] });
  sira(T, A, kutleler, { x0: -60000, x1: 92000, yOn: 61000, derin: 12000, onYon: '-y', tohum: 204, katlar: [3, 5], kirma: 0.3 });
  sira(T, A, kutleler, { x0: 44000, x1: 92000, yOn: 2600, derin: 12000, onYon: '+y', tohum: 205, katlar: [3, 7] });
  sira(T, A, kutleler, { x0: 44000, x1: 92000, yOn: -30000, derin: 12000, onYon: '-y', tohum: 206, katlar: [4, 8] });
  sira(T, A, kutleler, { x0: -46000, x1: 32000, yOn: -30000, derin: 12000, onYon: '-y', tohum: 207, katlar: [4, 8] });
  sira(T, A, kutleler, { x0: -20000, x1: 92000, yOn: -42000, derin: 12000, onYon: '+y', tohum: 208, katlar: [4, 10], kirma: 0.2 });
  // bahçe ağaçları: arka bahçelerde kavaklar (çatıların üstünden görünür), yuvarlak ağaçlar; ara sokakta sıra ağaç
  const ra = rnd(61), agacListe = [];
  for (let x = -40000; x < 30000; x += 3500 + ra() * 5000) agacListe.push([x, 29000 + ra() * 3000, ra() < 0.55 ? 15000 + ra() * 7000 : 8000 + ra() * 3000, ra() < 0.55 ? 0 : 1, 0.8 + ra() * 0.35]);
  for (let x = -30000; x < 30000; x += 3000 + ra() * 5000) agacListe.push([x, -16500 + ra() * 3000, ra() < 0.5 ? 14000 + ra() * 6000 : 8000 + ra() * 3000, ra() < 0.5 ? 0 : 1, 0.8 + ra() * 0.35]);
  for (let x = 46000; x < 90000; x += 4000 + ra() * 5000) { agacListe.push([x, 29000 + ra() * 3000, 12000 + ra() * 8000, ra() < 0.5 ? 0 : 1, 0.85 + ra() * 0.3]); agacListe.push([x, -16000 + ra() * 2500, 9000 + ra() * 8000, ra() < 0.5 ? 0 : 1, 0.85 + ra() * 0.3]); }
  for (let y = -28000; y < 44000; y += 7000) if (y < 1000 || y > 17000) for (const x of [33300, 42700]) agacListe.push([x, y + ra() * 1500, 7500 + ra() * 2000, 1, 0.9 + ra() * 0.2]);
  agaclar(T, agacListe);

  sure.geometri = an() - t0; t0 = an();
  // dokular ve malzemeler
  const catiTex = A.ciz(T, kutleler);
  sure.catiAtlasi = an() - t0; t0 = an();
  const golgeTex = zeminGolgesi(kutleler);
  const cepheTex = cepheAtlasi();
  sure.cepheAtlasi = an() - t0; t0 = an();
  // envMapIntensity: gölgedeki cepheler (güney yüzler güneş almaz) yalnız gökten aydınlanır; gökyüzü payı biraz büyük
  const std = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, envMapIntensity: 1.45, ...o });
  const M = {
    siva: std({ map: griDoku(256, 3, 240, 16), roughness: 0.93 }),
    beton: std({ map: griDoku(256, 4, 226, 34, 0.04), roughness: 0.9 }),
    cam: std({ roughness: 0.12, metalness: 0.2 }),
    beyaz: std({ roughness: 0.62 }),
    metal: std({ roughness: 0.42, metalness: 0.55, side: THREE.DoubleSide }),
    kolektor: std({ roughness: 0.2, metalness: 0.1, envMapIntensity: 1.1 }),
    kiremit: std({ map: kiremitDoku(), roughness: 0.82 }),
    cati: new THREE.MeshStandardMaterial({ map: catiTex, roughness: 0.95, envMapIntensity: 1.45 }),
    cephe: cepheMalzemesi(cepheTex),
    asfalt: golgeli(std({ map: griDoku(256, 6, 232, 40, 0.06), roughness: 0.95 }), golgeTex),
    kaldirim: golgeli(std({ map: kaldirimDoku(), roughness: 0.9 }), golgeTex),
    zemin: golgeli(std({ map: zeminDoku(), roughness: 1 }), golgeTex),
    camKorkuluk: std({ color: 0xbfd5d8, transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false }),
    golge: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    agac: std({ map: agacDoku(), alphaTest: 0.5, roughness: 0.92 }),
  };
  const grup = new THREE.Group();
  grup.name = 'sehir';
  for (const [ad, liste] of Object.entries(T.l)) {
    const geo = mergeGeometries(liste);
    if (!geo) { console.warn('sehir: birleşmedi', ad); continue; }
    const m = new THREE.Mesh(geo, M[ad]);
    m.name = 'sehir-' + ad;
    m.castShadow = m.receiveShadow = false;
    m.matrixAutoUpdate = false;
    if (ad === 'golge') m.renderOrder = 1;
    grup.add(m);
  }
  sure.birlestir = an() - t0;
  scene.add(gok, bulut, sil, grup);
  return {
    grup,
    sure, // kurulum süreleri (ms), ölçüm için
    update(time) {
      if (!reduce) bulut.rotation.z = -time * 0.0009; // bulutlar çok yavaş kayar
    },
  };
}
