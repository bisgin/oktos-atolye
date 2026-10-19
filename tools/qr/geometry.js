// 3D QR katıları (mm, Z yukarı): QR karosu, kabarık modüller, başlık yazısı ve gövde (masa standı kaidesi, kartvizit,
// anahtarlık, bardak altlığı). Her renk ayrı katı (çok renkli baskıda ayrı gövde). QR matrisi qrcode-generator'dan
// (UTF-8: Türkçe harfli Wi-Fi adı doğru kodlanır); koyu modüller satır satır birleşen dikdörtgenlerden tek kesit olur.
import * as C from '../../core/csg.js';
import { loadFont, textPolys } from '../../core/font3d.js';

const QR_URL = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';
const SESSIZ = 2; // modül: kodun çevresindeki boş pay (karo kenarı ya da gövde bunu genişletir)
let qrLib = null, yazi = null;

// build eşzamanlıdır: kütüphane ve yazı tipi önceden bir kez yüklenir (tool.init)
export async function hazirla() {
  if (!qrLib) {
    qrLib = (await import(QR_URL)).default;
    qrLib.stringToBytes = qrLib.stringToBytesFuncs['UTF-8'];
  }
  if (!yazi) yazi = await loadFont(700);
}

// QR içeriği: bağlantı, Wi-Fi (WIFI:T;S;P;H; biçimi, \ ; , : " kaçışlı) ya da düz metin
const kac = (v) => String(v ?? '').replace(/([\\;,:"])/g, '\\$1');
export function icerikMetni(s) {
  if (s.icerik === 'wifi') {
    const T = s.guvenlik === 'nopass' ? 'nopass' : s.guvenlik;
    return `WIFI:T:${T};S:${kac(s.ssid)};${T === 'nopass' ? '' : `P:${kac(s.sifre)};`}${s.gizli ? 'H:true;' : ''};`;
  }
  if (s.icerik === 'text') return s.metin || ' ';
  return s.url || 'https://oktosworkshop.com';
}

// Matris (aynı içerik ve düzeltme seviyesi için önbellekte): { n, dark(r, c) }
const onbellek = new Map();
export function matris(s) {
  const anahtar = `${s.ecc}|${icerikMetni(s)}`;
  if (!onbellek.has(anahtar)) {
    const q = qrLib(0, s.ecc);
    q.addData(icerikMetni(s));
    q.make();
    const n = q.getModuleCount(), bit = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) bit.push(q.isDark(r, c));
    if (onbellek.size > 40) onbellek.clear();
    onbellek.set(anahtar, { n, dark: (r, c) => bit[r * n + c] });
  }
  return onbellek.get(anahtar);
}
export const hucre = (s, S) => S / (matris(s).n + 2 * SESSIZ);

// Koyu modüllerin kesiti: kenarı S (sessiz pay dahil) olan karenin ortası (cx, cy)
function modulKesit(M, S, cx, cy) {
  const cell = S / (M.n + 2 * SESSIZ), polys = [];
  for (let r = 0; r < M.n; r++) {
    for (let c = 0; c < M.n;) {
      if (!M.dark(r, c)) { c++; continue; }
      let e = c;
      while (e < M.n && M.dark(r, e)) e++;
      const x0 = cx - S / 2 + (SESSIZ + c) * cell, x1 = cx - S / 2 + (SESSIZ + e) * cell;
      const y1 = cy + S / 2 - (SESSIZ + r) * cell, y0 = y1 - cell;
      polys.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
      c = e;
    }
  }
  return C.polys2(polys);
}

// Yazı kesiti: (cx, taban) ortalı; genişlik enFazla'yı aşmasın diye boyu küçülür
function yaziKesit(metin, boy, cx, taban, enFazla) {
  const olc = textPolys(yazi, metin, 1, { spacing: 0.04 });
  const b = Math.min(boy, enFazla / Math.max(olc.width, 0.01));
  const t = textPolys(yazi, metin, b, { spacing: 0.04 * b });
  return { kesit: C.polys2(t.polys.map((p) => p.map(([x, y]) => [x - t.width / 2 + cx, y + taban]))), cap: t.cap, boy: b };
}

// Dik duran parçalar: düz çizimin (alt kenarı y = 0, yüzü +z) 75° döndürülüp kaidenin eğik yuvasına oturtulmuşu.
// Kaide W + 14 genişlikte; yuva 0,25 mm boşluklu, tabanda 2,8 mm et kalır.
const DIK = 75, YUVA_Z = 3, YUVA_PAY = 11; // YUVA_PAY: dik parçanın yuvaya giren ve kaideden görünmeyen alt payı (mm)
const dik = (m) => C.move(C.rot(m, DIK, 0, 0), 0, 0, YUVA_Z);
function kaide(W, t) {
  const govde = C.extrude(C.rrect(W + 14, 32, 6), 12);
  const yuva = dik(C.box(W + 0.6, 20.3, t + 0.5, -(W + 0.6) / 2, -0.3, -0.25)); // C.box: (x, y, z) alt köşe
  return C.sub(C.move(govde, 0, 2, 0), yuva);
}

// Durum → parça listesi: [{ ad, renk: 'color'|'zemin'|'govde', fn() → Manifold }]. Renk anahtarı durumdaki rengi seçer.
export function parcalar(s) {
  const M = matris(s), t = s.tileT, mh = s.modH, out = [];
  const ekle = (ad, renk, fn) => out.push({ ad, renk, fn });

  if (s.mode === 'stand') {
    // Karonun altı yuvaya girer (~9 mm): kod bu payın üstünde başlar, yoksa köşe deseni kaidede kalır, okunmaz
    const S = s.size, alt = YUVA_PAY, headH = s.baslik ? S * 0.28 : 0, H = alt + S + headH;
    ekle('kaide', 'govde', () => kaide(S, t));
    ekle('karo', 'zemin', () => dik(C.move(C.extrude(C.rrect(S, H, s.r), t), 0, H / 2, 0)));
    ekle('kod', 'color', () => dik(C.extrude(modulKesit(M, S, 0, alt + S / 2), mh, t)));
    if (headH) ekle('baslik', 'color', () => {
      const y = yaziKesit(s.baslik, headH * 0.62, 0, 0, S - 8);
      return dik(C.move(C.extrude(y.kesit, mh, t), 0, alt + S + (headH - y.cap) / 2 - 1, 0));
    });
    return out;
  }

  if (s.mode === 'card') {
    const W = 85, H = 55, S = s.size, qx = W / 2 - S / 2 - 3, qy = H / 2 + (s.standli ? 3 : 0); // ayaklıda alt kenar yuvada
    const tf = s.standli ? dik : (m) => m;
    if (s.standli) ekle('kaide', 'govde', () => kaide(W, 1.6));
    ekle('kart', 'govde', () => tf(C.move(C.extrude(C.rrect(W, H, 3), 1.6), 0, H / 2, 0)));
    const z0 = s.icKaro ? 2.2 : 1.6;
    if (s.icKaro) ekle('karo', 'zemin', () => tf(C.move(C.extrude(C.rrect(S, S, 1.5), 0.6, 1.6), qx, qy, 0)));
    ekle('kod', 'color', () => tf(C.extrude(modulKesit(M, S, qx, qy), mh, z0)));
    if (s.baslik) ekle('yazi', 'color', () => {
      const alan = W - S - 14, y = yaziKesit(s.baslik, 6.5, -W / 2 + 5 + alan / 2, 0, alan);
      return tf(C.move(C.extrude(y.kesit, mh, 1.6), 0, qy - y.cap / 2, 0));
    });
    return out;
  }

  if (s.mode === 'key') {
    const S = s.size, yuvarlak = s.shape === 'round';
    const R = yuvarlak ? S * 0.73 : (S + 6) / 2, kulakY = R + 4, z0 = s.icKaro ? t + 0.6 : t;
    ekle('govde', 'govde', () => {
      const dis = yuvarlak ? C.circle2(R, 96) : C.rrect(S + 6, S + 6, Math.min(s.r + 2, S / 2));
      const kulak = C.move(C.extrude(C.circle2(6.5, 48), t), 0, kulakY, 0);
      return C.sub(C.union([C.extrude(dis, t), kulak]), C.cyl(t + 2, 2.6, 2.6, 32, 0, kulakY + 0.5, -1));
    });
    if (s.icKaro) ekle('karo', 'zemin', () => C.extrude(C.rrect(S, S, 2), 0.6, t));
    ekle('kod', 'color', () => C.extrude(modulKesit(M, S, 0, 0), mh, z0));
    return out;
  }

  // Bardak altlığı: yuvarlak gövde, ortada karo
  const R = s.cap / 2, S = s.size, gt = Math.max(t, 4);
  ekle('govde', 'govde', () => C.extrude(C.circle2(R, 128), gt));
  ekle('karo', 'zemin', () => C.extrude(C.rrect(S, S, 2), 0.6, gt));
  ekle('kod', 'color', () => C.extrude(modulKesit(M, S, 0, 0), mh, gt + 0.6));
  return out;
}
