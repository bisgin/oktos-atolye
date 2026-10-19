// 3D Yazı katıları (mm, Z yukarı; hepsi tablaya yatık basılır, masa tabelası ayakta). Biçimler:
//   plaka:      düz ya da yuvarlak plaka üstünde kabarık yazı; ya da yalnız harfler (harf harf, duvara)
//   masa:       kaidenin üstünde ayakta duran harfler
//   pasta:      yazının arkasında birleştiren zemin (i, ö, ü noktaları kopmasın) ve iki çubuk
//   miknatis:   harf harf ya da not levhası ya da kalp/yıldız; arkada mıknatıs yuvası
//   anahtarlik: delikli kulaklı levha, kabarık yazı
// Yazı tipi Schibsted Grotesk (OFL), Türkçe harflerle (core/font3d.js); ağırlıklar init'te yüklenir.
import * as C from '../../core/csg.js';
import { loadFont, textPolys } from '../../core/font3d.js';

const AGIRLIK = [500, 700, 900];
const yazilar = {};
export async function hazirla() {
  await Promise.all(AGIRLIK.map(async (w) => { try { yazilar[w] ||= await loadFont(w); } catch (e) { console.warn('yazı tipi', w, e); } }));
}
const font = (s) => yazilar[s.agirlik] || yazilar[700];

// Yazı: ortası x = 0, taban çizgisi y = 0. kesit() katıyı yalnız istenince kurar (scope içinde; ölçüm sızdırmaz).
// Glifler mıknatıs harfleri için ayrı ayrı; ic: harfin içinde kenarlara en uzak nokta (mıknatıs yuvası, O'nun ortası boş)
function yazi(s, metin, boy, aralik = s.aralik) {
  const t = textPolys(font(s), metin, boy, { spacing: aralik * boy });
  const ox = t.width / 2, kay = (p) => p.map(([x, y]) => [x - ox, y]);
  return {
    kesit: () => C.polys2(t.polys.map(kay)), width: t.width, cap: t.cap,
    glifler: t.glyphs.filter((g) => g.box).map((g) => {
      const polys = g.polys.map(kay);
      return { ch: g.ch, kesit: () => C.polys2(polys), ic: icNokta(polys) };
    }),
  };
}
// Çokgen kümesinin içinde (çift-tek) kenarlara en uzak örnek nokta: [x, y, uzaklık]
function icNokta(polys) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of polys) for (const [x, y] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const icinde = (x, y) => {
    let c = false;
    for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i], [xj, yj] = p[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const uzak = (x, y) => {
    let m = Infinity;
    for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [ax, ay] = p[j], [bx, by] = p[i], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L));
      m = Math.min(m, Math.hypot(x - ax - u * dx, y - ay - u * dy));
    }
    return m;
  };
  let en = [(x0 + x1) / 2, (y0 + y1) / 2, 0];
  for (let i = 1; i < 14; i++) for (let j = 1; j < 14; j++) {
    const x = x0 + ((x1 - x0) * i) / 14, y = y0 + ((y1 - y0) * j) / 14;
    if (!icinde(x, y)) continue;
    const d = uzak(x, y);
    if (d > en[2]) en = [x, y, d];
  }
  return en;
}

const kalp = (k) => Array.from({ length: 72 }, (_, i) => {
  const t = (i / 72) * Math.PI * 2;
  return [-16 * Math.sin(t) ** 3 * k, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * k];
});
const yildiz = (R, r) => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });
// Mıknatıs yuvası: tabandan (z = 0) mıknatıs boyu + 0,2 mm, çap + 0,2 mm (sıkı oturur)
const yuva = (s, x, y) => C.cyl(s.mH + 0.2, s.mCap / 2 + 0.1, s.mCap / 2 + 0.1, 32, x, y, -0.01);

// Durum → [{ ad, renk: 'color'|'govde'|'palet', k?, fn() → Manifold }]
export function parcalar(s) {
  const out = [], metin = s.metin.trim() || 'OKTOS', ekle = (ad, renk, fn, k = 0) => out.push({ ad, renk, fn, k });
  const d = s.derinlik, t = s.kalinlik;

  if (s.mode === 'plaka') {
    const y = yazi(s, metin, s.boy), pad = s.boy * 0.45, W = y.width + 2 * pad, H = y.cap + 2 * pad;
    if (s.stil === 'harf') { // harf harf: plaka yok, harfler duvara yapıştırılır
      ekle('harfler', 'color', () => C.move(C.extrude(y.kesit(), t + d), 0, -y.cap / 2, 0));
      return out;
    }
    const r = s.stil === 'yuvarlak' ? H / 2 : Math.min(8, H / 4);
    ekle('plaka', 'govde', () => {
      const p = C.extrude(C.rrect(W + (s.stil === 'yuvarlak' ? H * 0.4 : 0), H, r), t);
      return s.delik ? C.subAll(p, [-1, 1].map((sx) => C.cyl(t + 2, 2.2, 2.2, 24, sx * (W / 2 - pad * 0.45 + (s.stil === 'yuvarlak' ? H * 0.2 : 0)), 0, -1))) : p;
    });
    ekle('yazi', 'color', () => C.move(C.extrude(y.kesit(), d), 0, -y.cap / 2, t));
    return out;
  }

  if (s.mode === 'masa') { // harfler ayakta (yüzü −y), kaide altta
    const y = yazi(s, metin, s.boy), dz = Math.max(6, d * 2.5);
    ekle('kaide', 'govde', () => C.move(C.extrude(C.rrect(y.width + 20, dz + 22, 4), 8), 0, 2, 0));
    ekle('harfler', 'color', () => C.move(C.rot(C.extrude(y.kesit(), dz), 90, 0, 0), 0, dz / 2 + 2, 8 - 0.4));
    return out;
  }

  if (s.mode === 'pasta') {
    const y = yazi(s, metin, s.boy), bag = Math.max(1.6, s.boy * 0.07);
    ekle('zemin', 'govde', () => {
      const ust = C.extrude(C.offset2(y.kesit(), bag), 2);
      const cubuk = [-0.28, 0.28].map((k) => C.box(3, 50, 2, y.width * k - 1.5, -50 + bag, 0));
      const kopru = C.box(y.width * 0.56 + 3, 3, 2, -(y.width * 0.56 + 3) / 2, -1 + bag - 2, 0);
      return C.union([ust, ...cubuk, kopru]);
    });
    ekle('yazi', 'color', () => C.extrude(y.kesit(), d, 2));
    return out;
  }

  if (s.mode === 'miknatis') {
    if (s.mstil === 'not') {
      const y = yazi(s, metin, s.boy), W = Math.max(y.width + 24, 70), H = y.cap + 34;
      ekle('levha', 'govde', () => C.subAll(C.extrude(C.rrect(W, H, 8), t), [-1, 1].map((sx) => yuva(s, sx * W * 0.3, 0))));
      ekle('yazi', 'color', () => C.move(C.extrude(y.kesit(), d), 0, -y.cap / 2, t));
      return out;
    }
    if (s.mstil === 'sekil') {
      const S = s.boy / 30, sekiller = [kalp(1.3 * S), yildiz(24 * S, 10 * S), kalp(0.8 * S), yildiz(16 * S, 7 * S)];
      sekiller.forEach((p, k) => ekle(`sekil_${k + 1}`, 'palet', () => C.move(C.sub(C.extrude(C.polys2([p]), t + 2), yuva(s, 0, 0)), (k - 1.5) * 52 * S, 0, 0), k));
      return out;
    }
    // harf harf: her harf ayrı mıknatıs (noktalı harfte nokta harfle birleşir: ince bağ)
    const y = yazi(s, metin, s.boy, Math.max(s.aralik, 0.12));
    y.glifler.forEach((g, k) => ekle(`harf_${k + 1}`, 'palet', () => {
      const kes = C.offset2(C.offset2(g.kesit(), 1.2), -1.2); // yakın parçalar (i'nin noktası) birleşsin
      return C.sub(C.move(C.extrude(kes, t + 2), 0, -y.cap / 2, 0), yuva(s, g.ic[0], g.ic[1] - y.cap / 2));
    }, k));
    return out;
  }

  // anahtarlık: levha, solda delikli kulak, kabarık yazı
  const y = yazi(s, metin, s.boy), pad = s.boy * 0.4, W = y.width + 2 * pad, H = y.cap + 2 * pad;
  ekle('levha', 'govde', () => C.sub(
    C.union([C.extrude(C.rrect(W, H, Math.min(6, H / 3)), t), C.move(C.extrude(C.circle2(H * 0.42, 48), t), -W / 2, 0, 0)]),
    C.cyl(t + 2, Math.max(2.4, H * 0.14), Math.max(2.4, H * 0.14), 32, -W / 2 - H * 0.08, 0, -1),
  ));
  ekle('yazi', 'color', () => C.move(C.extrude(y.kesit(), d), 0, -y.cap / 2, t));
  return out;
}

// Mıknatıs harflerinde en dar harfin içi (yuva sığıyor mu): mm
export function enDarHarf(s) {
  const g = yazi(s, s.metin.trim() || 'OKTOS', s.boy).glifler;
  return g.length ? Math.min(...g.map((x) => x.ic[2] * 2)) : Infinity;
}

// Yazının ölçüsü (bilgi satırı için)
export function olcu(s) {
  const y = yazi(s, s.metin.trim() || 'OKTOS', s.boy);
  return { w: y.width, h: y.cap };
}
