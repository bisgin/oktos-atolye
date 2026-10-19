// Filament Painter katıları (mm, Z yukarı): resmin parlaklığı yüksekliğe çevrilir (açık = kalın), yükseklik katman
// adımına yuvarlanır; dört filament rengi belli yüksekliklerde değişir (HueForge mantığı: koyu taban, üste doğru
// açılan renkler). Katı bu yüksekliklerden dört renk bandına bölünür: önizleme baskının kendisini, 3MF renk başına
// gövdeyi verir. Biçim: çerçeveli tablo (kabarık kenar), pencere ışıklığı (düz kenar, iki asma deliği), kartpostal.
import * as C from '../../core/csg.js';
import { landscape } from './scene.js';

// Paletler koyudan açığa (taban rengi ilk); adlar sipariş mesajı ve bilgi satırı için
export const PALETLER = {
  sunset: [['Lacivert', '#1f2a3a'], ['Bordo', '#8c3b3b'], ['Turuncu', '#d8803a'], ['Krem', '#f4e3c3']],
  lake: [['Petrol', '#18303a'], ['Çam yeşili', '#3f6f74'], ['Mint', '#9fc1b5'], ['Kırık beyaz', '#f3efe2']],
  sea: [['Gece mavisi', '#1d2b46'], ['Deniz mavisi', '#2f6aa0'], ['Açık mavi', '#8cc3d8'], ['Kırık beyaz', '#f6f1e4']],
  mono: [['Siyah', '#1d1f22'], ['Koyu gri', '#5b5f66'], ['Açık gri', '#a7abb0'], ['Beyaz', '#f2f2ee']],
  sepya: [['Kahve', '#2b1d14'], ['Tarçın', '#7a4f2c'], ['Bal', '#c79a63'], ['Krem', '#f3e6cc']],
};
const ORNEK = { mountain: ['mountain', 7], sea: ['sea', 5], lake: ['lake', 3] };
export const KARTPOSTAL = [148, 105]; // A6, mm

let yuklenen = null; // kullanıcının seçtiği resim (canvas); bağlantıyla taşınmaz
export const resimVar = () => !!yuklenen;
export function resimKoy(cv) { yuklenen = cv; }

// Gri ızgara (0 koyu .. 1 açık), nx × ny; yüklenen resim hedef oranına ortadan kırpılır (kaplama)
const griOnbellek = new Map();
function griIzgara(s, nx, ny) {
  const anahtar = `${s.resim}|${nx}|${ny}|${s.kontrast}|${s.ters}|${s.resim === 'yukle' ? s.fotoAd : ''}`;
  if (griOnbellek.has(anahtar)) return griOnbellek.get(anahtar);
  let data;
  if (s.resim === 'yukle' && yuklenen) {
    const cv = document.createElement('canvas');
    cv.width = nx;
    cv.height = ny;
    const g = cv.getContext('2d'), hedef = nx / ny, oran = yuklenen.width / yuklenen.height;
    const [sw, sh] = oran > hedef ? [yuklenen.height * hedef, yuklenen.height] : [yuklenen.width, yuklenen.width / hedef];
    g.drawImage(yuklenen, (yuklenen.width - sw) / 2, (yuklenen.height - sh) / 2, sw, sh, 0, 0, nx, ny);
    data = g.getImageData(0, 0, nx, ny).data;
  } else {
    const [tur, tohum] = ORNEK[s.resim] || ORNEK.mountain;
    data = landscape(tur, nx, ny, tohum).data;
  }
  const L = new Float32Array(nx * ny);
  for (let k = 0; k < nx * ny; k++) {
    let v = (0.2126 * data[k * 4] + 0.7152 * data[k * 4 + 1] + 0.0722 * data[k * 4 + 2]) / 255;
    v = Math.min(1, Math.max(0, (v - 0.5) * s.kontrast + 0.5));
    L[k] = s.ters ? 1 - v : v;
  }
  if (griOnbellek.size > 12) griOnbellek.clear();
  griOnbellek.set(anahtar, L);
  return L;
}

// Rölyef ölçüsü: kartpostalda sabit, diğerlerinde genişlik ve resmin oranı
export function olcu(s, oran) {
  if (s.mode === 'kartpostal') return KARTPOSTAL;
  return [s.genislik, Math.round(s.genislik / oran)];
}

// Renk değişim yükseklikleri (katman adımına oturur): [0, z1, z2, z3]
export function degisimler(s) {
  const n = Math.max(4, Math.round((s.tepe - s.taban) / s.katman));
  return [0, ...[1, 2, 3].map((k) => +(s.taban + Math.round((k / 4) * n) * s.katman).toFixed(3))];
}

// Yükseklik alanı: üst yüzey ızgara, alt yüzey merkezden yelpaze, yan duvarlar; kapalı ağ (fromMesh doğrular)
function yukseklikKati(s, W, H, adim) {
  const nx = Math.max(2, Math.round(W / adim) + 1), ny = Math.max(2, Math.round(H / adim) + 1);
  const L = griIzgara(s, nx, ny), lh = s.katman, n = Math.round((s.tepe - s.taban) / lh);
  const pos = new Float32Array((nx * ny + 2 * (nx + ny) - 4 + 1) * 3), idx = [];
  const ust = (i, j) => j * nx + i;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = ust(i, j);
    pos[k * 3] = -W / 2 + (i * W) / (nx - 1);
    pos[k * 3 + 1] = H / 2 - (j * H) / (ny - 1);
    pos[k * 3 + 2] = s.taban + Math.round(L[k] * n) * lh;
  }
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = ust(i, j), b = ust(i + 1, j), c = ust(i, j + 1), d = ust(i + 1, j + 1);
    idx.push(a, c, b, b, c, d);
  }
  // Çevre, yukarıdan bakınca saat yönünün tersine: alt kenar → sağ → üst → sol
  const cevre = [];
  for (let i = 0; i < nx; i++) cevre.push(ust(i, ny - 1));
  for (let j = ny - 2; j >= 0; j--) cevre.push(ust(nx - 1, j));
  for (let i = nx - 2; i >= 0; i--) cevre.push(ust(i, 0));
  for (let j = 1; j < ny - 1; j++) cevre.push(ust(0, j));
  let v = nx * ny;
  const alt = cevre.map((t) => { pos[v * 3] = pos[t * 3]; pos[v * 3 + 1] = pos[t * 3 + 1]; pos[v * 3 + 2] = 0; return v++; });
  const merkez = v; // pos zaten 0,0,0
  for (let k = 0; k < cevre.length; k++) {
    const k2 = (k + 1) % cevre.length;
    idx.push(merkez, alt[k2], alt[k]);                                   // alt yüz (−z)
    idx.push(alt[k], alt[k2], cevre[k2], alt[k], cevre[k2], cevre[k]);  // yan duvar (dışa)
  }
  return C.fromMesh(pos, new Uint32Array(idx));
}

// Kenar: çerçevede rölyefin üstüne çıkan çerçeve, ışıklıkta taban kalınlığında düz kenar ve iki asma deliği
function kenarli(s, W, H, govde) {
  if (s.mode === 'kartpostal' || !s.kenar) return govde;
  const k = s.kenar, cerceve = s.mode === 'cerceve';
  const yuk = cerceve ? s.tepe + 0.8 : s.taban + 1;
  let kenar = C.sub(C.extrude(C.rrect(W + 2 * k, H + 2 * k, 3), yuk), C.extrude(C.rrect(W - 0.4, H - 0.4, 0.5), yuk + 2, -1));
  if (!cerceve) kenar = C.subAll(kenar, [-1, 1].map((sx) => C.cyl(yuk + 2, 1.8, 1.8, 24, sx * (W / 2 - 4), H / 2 + k / 2, -1)));
  return C.union([govde, kenar]);
}

// Dört renk bandı (C.scopeMany içinde): katı bir kez kurulur, değişim yüksekliklerinden alttan üste bölünür
export function bantlar(s, oran) {
  const [W, H] = olcu(s, oran), adim = s._thumb ? 1.6 : s._drag ? 1.2 : 0.5, z = degisimler(s);
  let kalan = kenarli(s, W, H, yukseklikKati(s, W, H, adim));
  const out = [];
  for (let k = 0; k < 3; k++) {
    const [ust, alt] = C.splitZ(kalan, z[k + 1]);
    out.push(alt);
    kalan = ust;
  }
  out.push(kalan);
  return out;
}
