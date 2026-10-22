// Sahne 2, atölye ve organizer (v06 yenileme, #6–#9, k576–1355: ARALIK ile 300 kare uzadı). Kadro: B (kahraman), B2, B3,
// B4 (kadro.json; dört kasketli genç). SORUNDA BİTER: organizer yalnız düşüncede kalır; gerçek ürün yok. Renk (kullanıcı
// 2026-10-22): yalnız üretilebilecek şey (balondaki organizer) URUN_RENK'in açık tonuyla dolar; kişiler, mekân, vidalar mono.
// #6 (k576–759) Omuz üstü geniş plan: B4 önde, SIRTI DÖNÜK (insan.js arka görünüş), ötekilere konuşur (başı sallanır, konuşma
//    çizgileri); B3, B2 tezgâhın arkasında güler, karşılık verir; B taburede dinler. B4 sola, kadraj dışına yürür. B2 B'ye
//    döner: "M8 vida… 3 tane de M6 getirir misin kanka?". Kapıya yakın olan B3 önce gider ("Yazıcı ısındı!"), B2 ardından
//    (sözü sürerken): ikisi de sırtını döner, arka kapıya yürür (küçülür; kapı düzlemini geçince kapı boşluğuna kırpılır, sola
//    çıkar). Kimse kimsenin önünden geçmez, söz kuyrukları kesişmez. B kalkar: "Geliyorum!".
//    Yürüyüş 12 fps: her adımda omuzlar tahterevalli gibi iner kalkar (gövde boyun kökü çevresinde döner, baş dik kalır,
//    hafif ters eğilir), adım sekmesi, yana salınım; konum ve ölçek 60 fps. Konuşma balonlarının kuyruğu konuşanı izler.
// #7 (k760–839) B döner, dolaba yürür; kamera B'yi izleyerek orta plana yaklaşır.
// #8 (k840–1171) KUŞ BAKIŞI: dolabın üstü; B'nin sol eli (etli el, elEtli: gerçek ölçüde, kalın parmaklı, kaslı ön kol)
//    kulpa uzanır, parmaklar kulpu sarar (kulp elin 'araya' katmanında: kulpun ötesindeki parmaklar üstüne yeniden çizilir,
//    başparmak altta kalır), kısa hazırlık (çekmece 5 mm içeri), çekiş (çekmece
//    elle birlikte gelir; sonda dayanağa vurur, 6 mm geri seker: 'tik'). Vida, somun, pul 3B (three.js; toon gölge +
//    mürekkep kontur): çekmecenin ivmesiyle kayar, yuvarlanır (başlı vida koni gibi yay çizerek döner, diş izleri kayar),
//    birbirine ve duvarlara çarpar, durur. Fizik tohumlu ve önceden hesaplanır (kare kare çekimde aynı). Tuval tam olarak iç
//    tabana oturur: hiçbir parça en içteki dikdörtgenin dışında görünmez (sayısal denetim: export denetim). El bırakır,
//    çekilir. B çekmeceyi kesik çizgiyle ölçer: çizgi parça parça belirir (her parça 'tik'): 40 cm × 30 cm (iç ölçü =
//    çekmece-yerel mm). B: "Bir organizer alsam… buraya sığar mı?"
// #9 (k1172–1355) B'nin yüzü, yanında açık çekmece. Düşünce balonunda organizer (cizimler.js, nane), kenarlarında vurgu
//    renkli tutamaçlar (v5 saksı sahnesinin dili). B YALNIZ AKLIYLA biçimlendirir (kullanıcı 2026-10-22: parmakla değil):
//    balona bakar, kaşları odaklı; çekmecenin ölçüsü kesik çerçeve olarak belirir, iki yan kenar içe daralır, üst ve alt
//    uzar, bölmeler yeniden dağılır, ölçüye oturur. "Hazır almak yerine kendim tasarlayabilsem nasıl olur?" B düşüncelere
//    dalar (baş yana, bakış uzakta); sahne çözümsüz biter (k1356 s3-balkon).
// Katmanlar: 's2-atolye' (ön görünüş dünyası: #6, #7, #9), 's2-kus' (#8; kamera k840'tan sonra birim: ekran koordinatı;
// içinde alt svg, 3B tuval, üst svg sırasıyla).
// Kare hızı: kamera, yazı, nesne konumu, 3B parçalar 60 fps; karakter pozu, el pozu, yürüyüş adımı 12 fps (adim).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { kisiSVG, boyKaymasi, YAPI, MONO, PALET, GOZ_Y, rng, yol, oval } from '../insan.js';
import { CIZIMLER, URUN_RENK } from './cizimler.js';

export const ARALIK = [576, 1355];
// Parça taşma denetimi: her kayıtlı karede her parçanın 3B gövde köşelerinin iç tabandan (0..EN, 0..DER) en büyük taşması
// (mm; 0 olmalı) ve en küçük duvar payı. Sayfada: (await import('/lab/tanitim/film/s2-atolye.js')).denetim
export const denetim = { tasma: null, enAzPay: null, kare: null, parca: null, adet: 0 };

const D2R = Math.PI / 180;
const SIFIR = { sap: () => 0 };
const f1 = (v) => (+v).toFixed(1), f2 = (v) => (+v).toFixed(2), f3 = (v) => (+v).toFixed(3);
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// =====================================================================================================================
// ÇEKMECE FİZİĞİ (çekmece-yerel düzlem, mm; x sağa, y öne = ekranda aşağı). İç taban [0, EN] × [0, DER].
// Konum tabanlı çözücü (PBD): taban sürtünmesi ve ataletsel ivme hız düzeyinde, çarpışma ve duvar konumda, sekme ve teğet
// sürtünme yine hız düzeyinde. Vida: eksen boyunca kayar (statik eşikli), eksene dik yuvarlanır (2/3 ivme, yuvarlanma
// direnci); baş gövdeden kalın olduğu için koni gibi yuvarlanır: yalpa hızı = −dik hız / tepe uzaklığı.
// Her gövde dairelerle örtülür (vida boyunca dizili); daireler 3B gövdeyi kapsar, duvara PAY kadar yaklaşır.
// =====================================================================================================================
const EN = 400, DER = 300, PAY = 1.6, YER = 9810;

function parcalarKur(tohum) {
  const r = rng(tohum), U = (a, b) => a + (b - a) * r();
  const P = [];
  // L: toplam boy (baş dahil), rs: gövde yarıçapı, rh: baş köşe yarıçapı, hh: baş boyu, bas: 'alti' (altıgen) | 'yuvarlak'
  const vida = (L, rs, rh, hh, bas) => {
    const daire = [{ s: -L / 2 + hh / 2, r: Math.hypot(hh / 2, rh) }];
    const s0 = -L / 2 + hh + rs * 0.8, s1 = L / 2 - rs, n = Math.max(1, Math.ceil((s1 - s0) / (rs * 1.1)));
    for (let i = 0; i <= n; i++) daire.push({ s: s0 + (s1 - s0) * i / n, r: rs });
    const m = Math.PI * rs * rs * (L - hh) + Math.PI * rh * rh * hh * 0.85;
    P.push({ tur: 'vida', bas, L, rs, rh, hh, uc: rs * 1.3, daire, m, I: m * L * L / 12, sApex: -L / 2 + L * rh / (rh - rs), R: L / 2 + rh });
  };
  const somun = (rk, kal, del) => { const m = 2.6 * rk * rk * kal; P.push({ tur: 'somun', rk, kal, del, daire: [{ s: 0, r: rk + 0.5 }], m, I: m * rk * rk / 2, R: rk + 0.5 }); };
  const pul = (R, kal, del) => { const m = Math.PI * R * R * kal; P.push({ tur: 'pul', Rp: R, kal, del, daire: [{ s: 0, r: R + 0.4 }], m, I: m * R * R / 2, R: R + 0.4 }); };
  // Ölçüler gerçeğin ~1,2 katı (kuş bakışında okunur kalsın; çekmece ölçüsü 40 × 30 cm gerçek)
  const B = 1.2;
  for (let i = 0; i < 4; i++) vida(U(58, 82) * B, 4 * B, 7.5 * B, 5.5 * B, 'alti');        // M8 cıvata
  for (let i = 0; i < 6; i++) vida(U(30, 50) * B, 3 * B, 5.8 * B, 4.2 * B, 'alti');        // M6 cıvata
  for (let i = 0; i < 6; i++) vida(U(24, 40) * B, 2.6 * B, 5 * B, 3.4 * B, 'yuvarlak');    // M5 yıldız başlı
  for (let i = 0; i < 8; i++) vida(U(14, 26) * B, 2 * B, 3.9 * B, 2.8 * B, 'yuvarlak');    // M4
  for (let i = 0; i < 4; i++) somun(7.5 * B, 6.5 * B, 4.2 * B);
  for (let i = 0; i < 5; i++) somun(5.8 * B, 5 * B, 3.2 * B);
  for (let i = 0; i < 4; i++) somun(4 * B, 3.2 * B, 2.1 * B);
  for (let i = 0; i < 3; i++) pul(8.5 * B, 1.6 * B, 4.3 * B);
  for (let i = 0; i < 4; i++) pul(6.2 * B, 1.4 * B, 3.2 * B);
  for (let i = 0; i < 3; i++) pul(4.5 * B, 0.9 * B, 2.2 * B);
  // Kümeli dağılım (dağınık çekmece), sonra çakışmalar konumla çözülür
  const KUME = [[90, 90], [250, 70], [330, 190], [150, 210], [230, 150], [60, 240]];
  P.forEach((b, i) => {
    const c = KUME[Math.floor(r() * KUME.length)], a = r() * Math.PI * 2, d = Math.pow(r(), 0.7) * 95;
    Object.assign(b, { x: sinir(c[0] + Math.cos(a) * d, 30, EN - 30), y: sinir(c[1] + Math.sin(a) * d * 0.8, 30, DER - 30), th: r() * Math.PI * 2,
      vx: 0, vy: 0, w: 0, phi: r() * Math.PI * 2, im: 1 / b.m, ii: 1 / b.I, no: i });
  });
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) cift(P[i], P[j], null);
    for (const b of P) duvar(b, null);
  }
  return P;
}

// İki gövdenin daireleri arasındaki çakışma: kütle ve eylemsizlikle paylaştırılan konum düzeltmesi (kol: daire merkezi)
function cift(A, B, kayit) {
  const dx0 = B.x - A.x, dy0 = B.y - A.y, RR = A.R + B.R;
  if (dx0 * dx0 + dy0 * dy0 > RR * RR) return;
  const ca = Math.cos(A.th), sa = Math.sin(A.th), cb = Math.cos(B.th), sb = Math.sin(B.th);
  let en = null;
  for (const da of A.daire) for (const db of B.daire) {
    const ax = A.x + da.s * ca, ay = A.y + da.s * sa, bx = B.x + db.s * cb, by = B.y + db.s * sb;
    const dx = bx - ax, dy = by - ay, rr = da.r + db.r, d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) continue;
    const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d, C = rr - d;
    const rax = ax - A.x, ray = ay - A.y, rbx = bx - B.x, rby = by - B.y;
    const rna = rax * ny - ray * nx, rnb = rbx * ny - rby * nx;
    const l = C / (A.im + A.ii * rna * rna + B.im + B.ii * rnb * rnb);
    A.x -= A.im * l * nx; A.y -= A.im * l * ny; A.th -= A.ii * l * rna;
    B.x += B.im * l * nx; B.y += B.im * l * ny; B.th += B.ii * l * rnb;
    if (kayit && (!en || C > en.C)) en = { a: A, b: B, C, nx, ny, rax: rax + nx * da.r, ray: ray + ny * da.r, rbx: rbx - nx * db.r, rby: rby - ny * db.r };
  }
  if (en) kayit.push(en);
}
// Duvar: her daire iç tabanın PAY kadar içinde kalır; gövde başına her duvardan tek temas kaydı (çift sekme olmasın)
function duvar(B, kayit) {
  const ca = Math.cos(B.th), sa = Math.sin(B.th), en = {};
  for (const d of B.daire) {
    const cx = B.x + d.s * ca, cy = B.y + d.s * sa, r = d.r + PAY;
    const it = (yan, nx, ny, C) => {
      const rx = cx - B.x, ry = cy - B.y, rn = rx * ny - ry * nx, l = C / (B.im + B.ii * rn * rn);
      B.x += B.im * l * nx; B.y += B.im * l * ny; B.th += B.ii * l * rn;
      if (kayit && (!en[yan] || C > en[yan].C)) en[yan] = { a: null, b: B, C, nx, ny, rax: 0, ray: 0, rbx: rx - nx * d.r, rby: ry - ny * d.r };
    };
    if (cx < r) it('s', 1, 0, r - cx); else if (cx > EN - r) it('d', -1, 0, cx - EN + r);
    if (cy < r) it('u', 0, 1, r - cy); else if (cy > DER - r) it('a', 0, -1, cy - DER + r);
  }
  if (kayit) for (const c of Object.values(en)) kayit.push(c);
}
// Son güvence: dairelerin taşması (yuvarlama artığı) dönmesiz ötelemeyle sıfırlanır
function kilitle(B) {
  const ca = Math.cos(B.th), sa = Math.sin(B.th);
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (const d of B.daire) {
    const cx = B.x + d.s * ca, cy = B.y + d.s * sa, r = d.r + PAY;
    x0 = Math.max(x0, r - cx); x1 = Math.max(x1, cx - (EN - r)); y0 = Math.max(y0, r - cy); y1 = Math.max(y1, cy - (DER - r));
  }
  B.x += x0 - x1; B.y += y0 - y1;
}
const etki = (o, jx, jy, rx, ry) => { o.vx += o.im * jx; o.vy += o.im * jy; o.w += o.ii * (rx * jy - ry * jx); };
// Hız düzeyi: yaklaşan temasa sekme (e) ve teğet sürtünme (somun, pul temasla dönmeye başlar)
function sek(c) {
  const { a, b, nx, ny, rax, ray, rbx, rby } = c;
  const rel = (on) => {
    const vb = on ? [b.vx0 - b.w0 * rby, b.vy0 + b.w0 * rbx] : [b.vx - b.w * rby, b.vy + b.w * rbx];
    const va = !a ? [0, 0] : on ? [a.vx0 - a.w0 * ray, a.vy0 + a.w0 * rax] : [a.vx - a.w * ray, a.vy + a.w * rax];
    return [vb[0] - va[0], vb[1] - va[1]];
  };
  const [p0, p1] = rel(true), vnOnce = p0 * nx + p1 * ny;
  if (vnOnce > -25) return;
  const e = a ? 0.25 : 0.38;
  const [q0, q1] = rel(false), vnSon = q0 * nx + q1 * ny;
  const rnb = rbx * ny - rby * nx, rna = a ? rax * ny - ray * nx : 0;
  const ws = b.im + b.ii * rnb * rnb + (a ? a.im + a.ii * rna * rna : 0);
  const j = (-e * vnOnce - vnSon) / ws;
  if (j > 0) { etki(b, j * nx, j * ny, rbx, rby); if (a) etki(a, -j * nx, -j * ny, rax, ray); }
  const tx = -ny, ty = nx, [s0, s1] = rel(false), vt = s0 * tx + s1 * ty;
  const rtb = rbx * ty - rby * tx, rta = a ? rax * ty - ray * tx : 0;
  const wt = b.im + b.ii * rtb * rtb + (a ? a.im + a.ii * rta * rta : 0);
  const lim = 0.35 * (Math.max(0, j) + Math.max(0, -vnOnce) / ws);
  const jt = sinir(-vt / wt, -lim, lim);
  etki(b, jt * tx, jt * ty, rbx, rby); if (a) etki(a, -jt * tx, -jt * ty, rax, ray);
}
// Bir alt adım. ay: ataletsel ivme (çekmece çerçevesinde, y yönünde; mm/s²)
function adimAt(P, ay, dt) {
  const MS = 0.4, MK = 0.3, MR = 0.075; // statik, kinetik sürtünme; yuvarlanma direnci (diş pürüzlü)
  const yaklas = (v, d) => (v > d ? v - d : v < -d ? v + d : 0);
  for (const b of P) {
    if (b.tur === 'vida') {
      const ca = Math.cos(b.th), sa = Math.sin(b.th);
      let va = b.vx * ca + b.vy * sa, vn = -b.vx * sa + b.vy * ca;
      const fa = ay * sa, fn = ay * ca;
      if (Math.abs(va) < 3 && Math.abs(fa) < MS * YER) va = 0; else va = yaklas(va + fa * dt, MK * YER * dt);
      vn = yaklas(vn + fn * (2 / 3) * dt, MR * YER * dt);
      b.vx = va * ca - vn * sa; b.vy = va * sa + vn * ca;
      b.w += (-vn / b.sApex - b.w) * Math.min(1, 16 * dt);
    } else {
      if (Math.hypot(b.vx, b.vy) < 3 && Math.abs(ay) < MS * YER) { b.vx = 0; b.vy = 0; }
      else { b.vy += ay * dt; const v = Math.hypot(b.vx, b.vy), s = v > 0 ? Math.max(0, v - MK * YER * dt) / v : 0; b.vx *= s; b.vy *= s; }
      b.w = yaklas(b.w, 26 * dt);
    }
    b.px = b.x; b.py = b.y; b.pth = b.th; b.vx0 = b.vx; b.vy0 = b.vy; b.w0 = b.w;
    b.x += b.vx * dt; b.y += b.vy * dt; b.th += b.w * dt;
  }
  const tem = [];
  for (let it = 0; it < 4; it++) {
    const kay = it === 0 ? tem : null;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) cift(P[i], P[j], kay);
    for (const b of P) duvar(b, kay);
  }
  for (const b of P) { kilitle(b); b.vx = (b.x - b.px) / dt; b.vy = (b.y - b.py) / dt; b.w = (b.th - b.pth) / dt; }
  for (const c of tem) sek(c);
  for (const b of P) if (b.tur === 'vida') { const vn = -b.vx * Math.sin(b.th) + b.vy * Math.cos(b.th); b.phi += (vn - b.w * b.L / 2) / b.rh * dt; }
}
// Çekmece konumu D(kare, kesirli) → her kare için gövde pozları (x, y, th, phi)
function fizikKos(P, D, f0, f1, alt = 8) {
  const dt = 1 / (60 * alt), n = f1 - f0 + 1;
  const kayit = P.map(() => new Float32Array(n * 4));
  const kaydet = (j) => P.forEach((b, i) => kayit[i].set([b.x, b.y, b.th, b.phi], j * 4));
  const hiz = (t) => (D(t + 0.5 / alt) - D(t - 0.5 / alt)) * 60 * alt;
  let vOnce = hiz(f0);
  kaydet(0);
  for (let f = f0; f < f1; f++) {
    for (let a = 0; a < alt; a++) { const v = hiz(f + (a + 1) / alt); adimAt(P, -(v - vOnce) / dt, dt); vOnce = v; }
    kaydet(f - f0 + 1);
  }
  return kayit;
}
// 3B gövdenin üstten izdüşüm köşeleri (taşma denetimi): vida baş köşeleri, uç başlangıcı, sivri uç; somun köşeleri; pul çemberi
function koseler(b, x, y, th) {
  const ca = Math.cos(th), sa = Math.sin(th), p = (s, l) => [x + s * ca - l * sa, y + s * sa + l * ca];
  if (b.tur === 'vida') {
    const s0 = -b.L / 2, s1 = s0 + b.hh, su = b.L / 2 - b.uc;
    return [p(s0, b.rh), p(s0, -b.rh), p(s1, b.rh), p(s1, -b.rh), p(su, b.rs), p(su, -b.rs), p(b.L / 2, 0)];
  }
  const R = b.tur === 'somun' ? b.rk + 0.45 : b.Rp + 0.35, n = b.tur === 'somun' ? 6 : 24;
  return Array.from({ length: n }, (_, i) => { const a = th + i * Math.PI * 2 / n; return [x + R * Math.cos(a), y + R * Math.sin(a)]; });
}

// Gövde kesimi (s4-frp ile aynı: kol.js govdeKes() orta gövdeyi varsayar, B tosun); #9'da kol kalkmadığı için şimdilik boşta
function kalemUret(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}
function govdeKes(p, { sol, sag, id, kaynama, w = 4.2 }) {
  const M = PALET.murekkep, Y = YAPI[p.yapi] || YAPI.orta, en = Y.en, ek = p.boy === 'uzun' ? 8 : 0, om = Y.omuz;
  const cx = 200, ceneY = GOZ_Y + 4 + p.yuzBoy, omuzY = ceneY + ek + 40, y0 = omuzY + 10, gg = 108 * en;
  const yan = (yon) => [[cx + yon * 119 * en, omuzY + 14 - om * 0.5], [cx + yon * 126 * en, omuzY + 44 - om * 0.3], [cx + yon * (gg + 8), omuzY + 86],
    [cx + yon * (gg + 1), omuzY + 124], [cx + yon * gg, omuzY + 210], [cx + yon * (gg + 4), 560], [cx + yon * (gg + 9), 680]];
  const R = yan(1), L = yan(-1);
  const d = (pts) => yol(pts, false, SIFIR).replace(/^M/, 'L');
  const kd = `M-1000 -1000 L1400 -1000 ` +
    (sag ? `L1400 ${y0} L${cx + 119 * en} ${y0} ${d(R)} L${cx + gg + 9} 900 ` : `L1400 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} L${cx - 119 * en} ${y0} L-1000 ${y0} Z` : `L-1000 900 Z`);
  const s = kalemUret(p.tohum + 41, kaynama);
  const cz = (pts) => `<path d="${yol(pts, false, s())}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return { tanim: `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${kd}"/></clipPath></defs>`, klip: `clip-path="url(#${id})"`, kontur: (sag ? cz(R) : '') + (sol ? cz(L) : '') };
}

// =====================================================================================================================
// ETLİ EL (#8, kuş bakışı; kullanıcı 2026-10-22: "çekmeceyi tutan el sadece kemik tutmuş gibi görünüyor; biraz daha kalın
// insan eli gibi olsun"). kol.js elUstten'in yerine. El TEK dış hatla çizilir (s1-kafe organik elinin dili): bilekten serçe
// yanına, birbirine değen kalın parmaklar (aralarında yalnız uçta küçük çukur, geri kalanı ince ayrım çizgisi), işaret
// kökünden başparmak tümseğine, bileğe. Başparmak elin altında ayrı şekil (tutarken kulpun altına girer). Bilek geniş, ön
// kol kaslı (başparmak yanında karın), dirseğe doğru kalınlaşır; yen dirsek altına sıvanmış (kalın rulo). Boyut gerçeğe
// yakın: el boyu ~18 cm (kulp 16,8 cm). Yerel çerçeve: bilek (0,0), x parmaklara, y başparmak yanı, birim = el boyu.
// kivrim 0: açık el (uzun parmaklar, tırnaklar, boğum kırışıkları); 1: kulpu saran el (parmakların ilk boğumu görünür,
// uçları kulpun ardına kıvrılır; eklem tümsekleri belirgin). Işık sol üstten (vidaların gölgesiyle aynı): başparmak yanı gölgede.
// =====================================================================================================================
const yonV = (d) => [Math.cos(d * D2R), Math.sin(d * D2R)];
const dikV = (t) => [-t[1], t[0]];
const topla = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s];
// Parmaklar (serçeden işarete): b kök eklemi (MCP), a açık eldeki yön (derece, + başparmağa), r yarı kalınlık,
// l açık boy (kökten uca), lk kıvrık elde görünen boy (kökten orta eklemin tepesine)
const PARMAK = [
  { b: [0.47, -0.162], a: -10, r: 0.051, l: 0.35, lk: 0.2 },
  { b: [0.517, -0.054], a: -3.5, r: 0.057, l: 0.44, lk: 0.245 },
  { b: [0.534, 0.059], a: 1.5, r: 0.06, l: 0.47, lk: 0.26 },
  { b: [0.504, 0.171], a: 7, r: 0.058, l: 0.42, lk: 0.245 },
];
// Ön kol (bilekten geriye d; serçe yanına 5° kırık): başparmak yanında kas karnı, dirseğe doğru kalınlaşır
const KOL_D = [0.14, 0.28, 0.44, 0.6, 0.76, 0.92];
const KOL_R = [0.192, 0.212, 0.236, 0.252, 0.26, 0.262], KOL_U = [0.182, 0.19, 0.2, 0.211, 0.218, 0.222];
const kolEksen = (d) => [-d * Math.cos(5 * D2R), -d * Math.sin(5 * D2R)];
// El sırtının iki yanı (bilekten boğumlara): serçe yanı, başparmak yanı (işaret kökünde biter)
const EL_U = [[0.0, -0.176], [0.1, -0.196], [0.21, -0.213], [0.32, -0.219], [0.41, -0.216]];
const EL_R = [[0.0, 0.182], [0.12, 0.232], [0.24, 0.256], [0.35, 0.26], [0.445, 0.25]];
// Kalınlık profili (q: kökten uca 0..1): açık elde orta eklem hafif şişkin, uç incelir; kıvrık elde eklem tepesi dolgun
const profAcik = (q) => (q < 0.45 ? 1 + 0.04 * q / 0.45 : q < 0.72 ? 1.04 - 0.1 * (q - 0.45) / 0.27 : 0.94 - 0.06 * (q - 0.72) / 0.28);
const profKivrik = (q) => 1 + 0.06 * q;
function elGeometri(kv) {
  const F = PARMAK.map((p) => {
    const t = yonV(p.a * (1 - 0.75 * kv)), n = dikV(t), L = lerp(p.l, p.lk, kv);
    const R = (d) => p.r * lerp(profAcik(sinir(d / L, 0, 1)), profKivrik(sinir(d / L, 0, 1)), kv);
    const C = (d) => topla(p.b, t, d);
    const yan = (d, k) => topla(C(d), n, k * R(d));              // k +1: başparmak yanı, −1: serçe yanı
    const uM = C(L - R(L)), ur = R(L);
    const uc = [-90, -60, -30, 0, 30, 60, 90].map((f) => topla(topla(uM, t, Math.cos(f * D2R) * ur), n, Math.sin(f * D2R) * ur));
    return { ...p, t, n, L, R, C, yan, uM, ur, uc };
  });
  // İki parmak arasındaki çukur: açık elde perde (kökten ~0,09), kıvrıkta kısa parmağın uç yayının biraz gerisi
  const cukurD = (A, B) => lerp(0.09, Math.min(A.L - A.ur, B.L - B.ur) - 0.45 * Math.min(A.r, B.r), kv);
  // Dış hat ön kolun arkasından başlar (yen rulosunun altında), bilekte kesintisiz ele geçer: eldiven gibi dikiş olmasın
  const kolU = KOL_D.map((d, i) => topla(kolEksen(d), [0, 1], -KOL_U[i])).reverse();
  const kolR = KOL_D.map((d, i) => topla(kolEksen(d), [0, 1], KOL_R[i]));
  const hat = [...kolU, ...EL_U];
  const ayrim = [];
  F.forEach((f, i) => {
    const d0 = i === 0 ? 0.0 : cukurD(F[i - 1], f);
    // serçe yanından uca, uç yayı, başparmak yanından aşağı
    for (const q of [0, 0.4, 0.75]) { const d = lerp(d0, f.L - f.ur, q); hat.push(f.yan(d, -1)); }
    hat.push(...f.uc);
    const d1 = i === F.length - 1 ? 0.0 : cukurD(f, F[i + 1]);
    for (const q of [0.25, 0.6, 1]) { const d = lerp(f.L - f.ur, d1, q); if (q < 1 || i === F.length - 1) hat.push(f.yan(d, 1)); }
    if (i < F.length - 1) {
      const g = F[i + 1], a = f.yan(d1, 1), b = g.yan(d1, -1);
      const v = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      hat.push(v);
      // ayrım çizgisi: çukurdan köke doğru (iki parmağın değdiği yer)
      const a0 = f.yan(0.07, 1), b0 = g.yan(0.07, -1);
      ayrim.push([v, [(v[0] * 0.5 + (a0[0] + b0[0]) / 4), (v[1] * 0.5 + (a0[1] + b0[1]) / 4)], [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2]]);
    }
  });
  hat.push(...EL_R.slice().reverse(), ...kolR);
  // Gölge yanı (başparmak yanı): ön koldan işaret parmağının ucuna, dış hattın ~0,07 içine kadar şerit
  const iF = F[3];
  const golgeDis = [...kolR.slice().reverse(), ...EL_R, iF.yan(0.02, 1), iF.yan(iF.L * 0.5, 1), iF.yan(iF.L - iF.ur, 1), iF.uc[5], iF.uc[4]];
  const golgeIc = [iF.yan(iF.L - iF.ur, 0.3), iF.yan(iF.L * 0.5, 0.3), iF.yan(0.02, 0.3),
    ...EL_R.slice().reverse().map(([x, y]) => [x, y - 0.07]), ...kolR.map(([x, y]) => [x, y - 0.075])];
  // Başparmak: kök elin içinde (sırtın altında kalır), açık elde 34° dışa, tutarken kulpun altına uzanır
  const ba = lerp(33, 21, kv), bt = yonV(ba), bt2 = yonV(ba + lerp(-14, -6, kv)), bn = dikV(bt), bn2 = dikV(bt2);
  const bb = [0.11, 0.12], bl = lerp(0.52, 0.5, kv), br = 0.068;
  const bm = topla(bb, bt, bl * 0.5), bu = topla(bm, bt2, bl * 0.5 - br * 0.9);
  const basC = [bb, topla(bb, bt, bl * 0.25), bm, topla(bm, bt2, bl * 0.25), bu];
  const basR = [br * 1.14, br * 1.08, br * 1.03, br * 0.97, br * 0.9];
  return { hat, F, ayrim, golge: [...golgeDis, ...golgeIc], bas: { C: basC, R: basR, t2: bt2, n: bn, n2: bn2, u: bu, r: br * 0.9 } };
}
// Değişken kalınlıklı merkez çizgisinden kapsül (iki ucu yuvarlak)
function kapsulYap(C, R) {
  const L = [], Rr = [];
  for (let i = 0; i < C.length; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
    L.push(topla(C[i], n, R[i])); Rr.push(topla(C[i], n, -R[i]));
  }
  const yay = (c, t, r) => [30, 60, 90, 120, 150].map((f) => { const n = dikV(t); return topla(topla(c, n, r * Math.cos(f * D2R)), t, r * Math.sin(f * D2R)); });
  const son = C.length - 1;
  const t1 = (() => { const v = [C[son][0] - C[son - 1][0], C[son][1] - C[son - 1][1]], l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l]; })();
  const t0 = (() => { const v = [C[0][0] - C[1][0], C[0][1] - C[1][1]], l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l]; })();
  return [...L, ...yay(C[son], t1, R[son]), ...Rr.reverse(), ...yay(C[0], t0, R[0])];
}
// el: { merkez (kulpun tutulduğu nokta, ekran), aci (parmak yönü, derece), boy (el boyu, px), kivrim, ten, giysi, kaynama,
// tohum, kolUzun (px), araya (tutulan kulp dizgesi), ustBolge (ekran çokgeni: bu bölgedeki el kulpun üstünde yeniden çizilir) }
function elEtli({ merkez, aci = -90, boy = 340, kivrim = 1, ten, giysi, kaynama = 0, tohum = 7, kolUzun = 900, araya = '', ustBolge = null, w = 5, kay = [3, 3] }) {
  const tutX = 0.68;                                         // kulp, kıvrık parmakların orta ekleminin hemen gerisinde
  const c = Math.cos(aci * D2R), s = Math.sin(aci * D2R);
  const bilek = [merkez[0] - tutX * boy * c, merkez[1] - tutX * boy * s];
  const T = ([x, y]) => [bilek[0] + x * boy * c - y * boy * s, bilek[1] + x * boy * s + y * boy * c];
  const P = (pts) => pts.map(T);
  const R0 = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const sapT = Array.from({ length: 512 }, () => (R0() - 0.5) * 1.6), kayT = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let sayac = 0;
  const kalemS = (oran) => { const tb = (sayac++ * 37) % 400; return { sap: (i, e) => (sapT[(tb + i * 2 + e) % 512] + kayT[(tb + i * 2 + e + 3) % 512]) * oran }; };
  const M = PALET.murekkep, GOLGE = 'rgba(29,29,32,0.13)', ACIK = 'rgba(255,255,255,0.22)';
  const cz = (pts, ww, oran = 0.5, renk = M) => `<path d="${yol(P(pts), false, kalemS(oran))}" fill="none" stroke="${renk}" stroke-width="${f2(ww)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dolguD = (pts, renk, k = kay, oran = 0.5) => `<path d="${yol(P(pts), true, kalemS(oran))}" fill="${renk}" transform="translate(${k[0]} ${k[1]})"/>`;
  const sekil = (pts, renk, ww, oran = 0.5, k = kay) => { const d = yol(P(pts), true, kalemS(oran)); return `<path d="${d}" fill="${renk}" transform="translate(${k[0]} ${k[1]})"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${f2(ww)}" stroke-linecap="round" stroke-linejoin="round"/>`; };
  const out = [];
  // --- Yen (sıvanmış rulonun ardında, kadraj dışına); ön kol el ile tek dış hatta (aşağıda)
  const kolY = kolEksen;
  const dY0 = 0.9, dY1 = kolUzun / boy, yenR = 0.285;
  const yR0 = topla(kolY(dY0), [0, 1], yenR), yU0 = topla(kolY(dY0), [0, 1], -yenR), yR1 = topla(kolY(dY1), [0, 1], yenR + 0.02), yU1 = topla(kolY(dY1), [0, 1], -yenR - 0.02);
  out.push(dolguD([yU0, yU1, yR1, yR0], giysi, kay, 0.7) + cz([yU0, yU1], w * 1.05, 0.7) + cz([yR0, yR1], w * 1.05, 0.7));
  out.push(dolguD([yR0, yR1, topla(kolY(dY1), [0, 1], yenR * 0.5), topla(kolY(dY0), [0, 1], yenR * 0.45)], GOLGE, [0, 0], 0.4));
  // yen üstünde iki kumaş kırışığı
  for (const [d, k] of [[1.18, 1], [1.45, -1]]) {
    const m = kolY(d);
    out.push(cz([topla(m, [0, 1], k * yenR * 0.95), topla(topla(m, [0, 1], k * yenR * 0.35), [-1, 0], 0.05), topla(topla(m, [0, 1], -k * yenR * 0.05), [-1, 0], 0.12)], w * 0.5, 0.5));
  }
  // --- El
  const G = elGeometri(kivrim);
  // başparmak (elin altında; kökü el sırtının altında kalır)
  {
    const B = G.bas, pts = kapsulYap(B.C, B.R);
    out.push(sekil(pts, ten, w * 0.95, 0.5));
    // gölge yanı ve tırnak (açık elde)
    const n = B.C.length;
    const golge = [...B.C.map((p, i) => topla(p, B.n, B.R[i] * 0.97)), ...B.C.slice().reverse().map((p, i) => topla(p, B.n, B.R[n - 1 - i] * 0.3))];
    out.push(dolguD(golge, GOLGE, [0, 0], 0.4));
    if (kivrim < 0.6) {
      const u = B.u, t = B.t2, nn = B.n2, r = B.r;
      const tir = [topla(topla(u, t, r * 0.55), nn, -r * 0.42), topla(topla(u, t, r * 0.85), nn, 0), topla(topla(u, t, r * 0.55), nn, r * 0.42), topla(topla(u, t, -r * 0.35), nn, r * 0.4), topla(topla(u, t, -r * 0.35), nn, -r * 0.4)];
      out.push(sekil(tir, ACIK, w * 0.42, 0.25, [0, 0]));
    }
    // eklem kırışığı
    const m = B.C[2];
    out.push(cz([topla(m, B.n, -B.R[2] * 0.5), topla(topla(m, B.t2, 0.012), B.n, 0), topla(m, B.n, B.R[2] * 0.5)], w * 0.4, 0.3));
  }
  // ön kol + el sırtı + parmaklar (tek dış hat): dolgu kapalı, kontur yenin altında açık
  const dHat = yol(P(G.hat), true, kalemS(0.5)), dKon = dHat.replace(/Z$/, '');
  const elDolgu = `<path d="${dHat}" fill="${ten}" transform="translate(${kay[0]} ${kay[1]})"/>`;
  const elKontur = `<path d="${dKon}" fill="none" stroke="${M}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // ayrıntılar: gölge yanı, parmak ayrımları, kök eklem tümsekleri, kırışıklar, tırnaklar, tendonlar, ön kol kası
  const ay = [];
  ay.push(dolguD(G.golge, GOLGE, [0, 0], 0.4));
  for (const a of G.ayrim) ay.push(cz(a, w * 0.5, 0.35));
  G.F.forEach((f) => {
    // kök eklem (MCP) tümseği: yalnız tutarken (yumruk sırtında belirgin), kısa yayvan kavis; komşusuna değmez
    const b = f.b, t = f.t, n = f.n, r = f.r;
    if (kivrim > 0.5) ay.push(cz([topla(topla(b, n, -r * 0.5), t, 0.002), topla(b, t, 0.018), topla(topla(b, n, r * 0.5), t, 0.002)], w * 0.42, 0.2));
    if (kivrim > 0.5) {
      // kıvrık parmağın ucu kulpun ardına döner: uç yayı gölgede (aşağı bakan yüz)
      const dc = f.L - f.ur * 1.05;
      ay.push(dolguD([f.yan(dc, -0.97), ...f.uc, f.yan(dc, 0.97), topla(f.C(dc), t, f.ur * 0.35)], GOLGE, [0, 0], 0.3));
    } else {
      // açık parmak: orta eklemde iki, uç eklemde bir kırışık; tırnak
      const dP = f.L * 0.48, dD = f.L * 0.76;
      for (const dd of [dP - 0.012, dP + 0.012]) ay.push(cz([f.yan(dd, -0.5), topla(f.C(dd), t, 0.008), f.yan(dd, 0.5)], w * 0.32, 0.2));
      ay.push(cz([f.yan(dD, -0.4), topla(f.C(dD), t, 0.006), f.yan(dD, 0.4)], w * 0.3, 0.2));
      const u0 = f.L - f.ur - 0.062, u1 = f.L - f.ur * 0.35, k = 0.62;
      const tir = [f.yan(u0, -k), f.yan(u1, -k * 0.95), topla(f.C(u1), t, f.ur * 0.4), f.yan(u1, k * 0.95), f.yan(u0, k)];
      ay.push(sekil(tir, ACIK, w * 0.4, 0.2, [0, 0]));
    }
  });
  // bilekte kemik tümseği (serçe yanı), ön kolda kas kavsi (el sırtında tendon çizgisi yok: kemikli görünüyordu)
  ay.push(cz([[-0.07, -0.14], [-0.035, -0.12], [0.0, -0.135]], w * 0.36, 0.25));
  ay.push(cz([topla(kolY(0.7), [0, 1], 0.12), topla(kolY(0.48), [0, 1], 0.09), topla(kolY(0.3), [0, 1], 0.05)], w * 0.4, 0.4));
  out.push(elDolgu, ay.join(''), elKontur);
  // sıvanmış yen rulosu (ön kolun arka ucunu örter): kalın, dolgun bant, iki katlama çizgisi
  {
    const a0 = 0.8, a1 = 0.98, rr = 0.31;
    const ust = [0, 0.33, 0.66, 1].map((q) => topla(kolY(lerp(a0, a1, q)), [0, 1], rr * (1 + 0.04 * Math.sin(Math.PI * q))));
    const alt = [1, 0.66, 0.33, 0].map((q) => topla(kolY(lerp(a0, a1, q)), [0, 1], -rr * (1 + 0.04 * Math.sin(Math.PI * q))));
    const onY = [topla(kolY(a0 - 0.035), [0, 1], -rr * 0.55), topla(kolY(a0 - 0.05), [0, 1], 0), topla(kolY(a0 - 0.035), [0, 1], rr * 0.55)];
    out.push(sekil([...ust, ...alt, ...onY], giysi, w * 1.05, 0.6));
    out.push(dolguD([...ust, ...[1, 0.5, 0].map((q) => topla(kolY(lerp(a0, a1, q)), [0, 1], rr * 0.5))], GOLGE, [0, 0], 0.4));
    out.push(cz([topla(kolY(0.865), [0, 1], -rr * 0.92), topla(kolY(0.845), [0, 1], 0), topla(kolY(0.865), [0, 1], rr * 0.92)], w * 0.55, 0.5));
    out.push(cz([topla(kolY(0.93), [0, 1], -rr * 0.8), topla(kolY(0.915), [0, 1], -rr * 0.1)], w * 0.45, 0.5));
  }
  if (araya) {
    out.push(araya);
    if (ustBolge) {
      // kulpun üstüne binen kısım (parmaklar): aynı yol, kulpun yakın kenarının ötesine kırpılı
      out.push(`<defs><clipPath id="s2-el-ust" clipPathUnits="userSpaceOnUse"><path d="M${ustBolge.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z"/></clipPath></defs>`);
      out.push(`<g clip-path="url(#s2-el-ust)">${elDolgu}${ay.join('')}${elKontur}</g>`);
    }
  }
  return out.join('');
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, balon, odak, kameraGit, kameraKoy, vurus, isaret, W, H, VURGU, BALON, metin, yer, adim, DIKEY, DIL } = ctx;
  const [BAS, SON] = ARALIK;
  const MUR = PALET.murekkep, VURGU_YAZI = '#94400f', AR = '#8d867a';
  vurus(6, 'Atölye: sohbet, ayrılış, "Geliyorum!"', 576, 759);
  vurus(7, 'B dolaba yürür', 760, 839);
  vurus(8, 'Kuş bakışı: kulp, çekiş, vidalar, ölçü', 840, 1171);
  vurus(9, 'Düşünce: organizer akılla biçimlenir', 1172, 1355);
  isaret(576, 'kesme');
  isaret(578, 'konusma', { ad: 'sohbet' });
  isaret(642, 'konusma', { ad: 'B2: M8 vida' });
  isaret(672, 'konusma', { ad: 'B3: Yazıcı ısındı' });
  isaret(738, 'konusma', { ad: 'B: Geliyorum' });
  isaret(840, 'kesme');
  isaret(874, 'tik', { ad: 'kulp' });
  isaret(922, 'tik', { ad: 'çekmece dayanağa vurur' });
  isaret(926, 'tik', { ad: 'vidalar yuvarlanır' });
  isaret(1052, 'konusma', { ad: 'B: Bir organizer alsam' });
  isaret(1172, 'kesme');
  isaret(1174, 'dusunce');
  isaret(1202, 'vurgu', { ad: 'ölçü çerçevesi' });
  isaret(1216, 'vurgu', { ad: 'tutamaç: inceltir' });
  isaret(1252, 'vurgu', { ad: 'tutamaç: uzatır' });
  isaret(1306, 'sessizlik', { bitis: SON, ad: 'düşüncede asılı' });

  // ---------- Yardımcılar
  const fn = (e) => (typeof e === 'function' ? e : gsap.parseEase(e));
  const EOf = fn(E.EO), KMf = fn(E.KM), EIf = fn(E.EI);
  // Kapalı çokgeni eşit aralıklı noktalara böler (insan.js yol() Catmull-Rom: seyrek köşe merceğe döner)
  const yogun = (pts, aralik) => {
    const out = [];
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / aralik));
      for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
    });
    return out;
  };
  const dikdortgen = (x0, y0, x1, y1, rc = 0) => {
    const p = [];
    if (!rc) p.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
    else {
      const kose = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * D2R; p.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a)]); } };
      kose(x1 - rc, y0 + rc, 270); kose(x1 - rc, y1 - rc, 0); kose(x0 + rc, y1 - rc, 90); kose(x0 + rc, y0 + rc, 180);
    }
    return yogun(p, sinir(Math.min(x1 - x0, y1 - y0) / 2.5, 4, 40));
  };
  // Parçalı iz: [[kare, değer, eğri?], ...] → f(kare); basamak: son anahtarın değeri (12 fps poz)
  const iz = (...kf) => (f) => {
    if (f <= kf[0][0]) return kf[0][1];
    for (let i = 1; i < kf.length; i++) {
      const [k1, v1, e] = kf[i];
      if (f < k1) { const [k0, v0] = kf[i - 1]; const t = (f - k0) / (k1 - k0); return v0 + (v1 - v0) * (e ? fn(e)(t) : t); }
    }
    return kf[kf.length - 1][1];
  };
  const basamak = (...kf) => (f) => { let v = kf[0][1]; for (const [k0, v0] of kf) if (f >= k0) v = v0; return v; };
  // Kamera: ekran ↔ dünya; itiş: dünya noktası ekranda yerinde kalarak ölçek × oran
  const ekr = (kam, [wx, wy]) => [kam.x + wx * kam.scale, kam.y + wy * kam.scale];
  const cev = (kam, [sx, sy]) => [(sx - kam.x) / kam.scale, (sy - kam.y) / kam.scale];
  const cerceve = (x0, y0, gen) => { const s = W / gen; return { x: -x0 * s, y: -y0 * s, scale: s }; };
  const it = (kam, oran, m) => { const [sx, sy] = ekr(kam, m); return odak(m[0], m[1], kam.scale * oran, sx, sy); };
  // Kaynama indisi (çekirdek 8 fps döndürür)
  let kay = 0;
  ctx.kaynayanlar.add((i) => { kay = i; });
  const kalem = (tohum, i, genlik = 1) => {
    const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + i * 1013 + 1);
    const a = Array.from({ length: 96 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 96 }, () => (Rk() - 0.5) * 1.3);
    return { sap: (j, e) => (a[(j * 2 + e) % 96] + b[(j * 2 + e + 3) % 96]) * genlik };
  };
  const svgYap = (ust) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('width', W); s.setAttribute('height', H);
    ust.appendChild(s);
    return s;
  };
  const yalnizArada = (g, a, b) => { gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, 0); tl.set(g, { autoAlpha: 1 }, k(a)); if (b != null) tl.set(g, { autoAlpha: 0 }, k(b)); };

  // ---------- Katmanlar ve görünürlük (yalnız kendi pencerelerinde)
  const L = ctx.katman('s2-atolye', 10);
  const K = ctx.katman('s2-kus', 10);
  const pencere = (div, araliklar) => {
    gsap.set(div, { autoAlpha: 0 });
    tl.set(div, { autoAlpha: 0 }, 0);
    for (const [a, b] of araliklar) { tl.set(div, { autoAlpha: 1 }, k(a)); tl.set(div, { autoAlpha: 0 }, k(b)); }
  };
  pencere(L.div, [[BAS, 840], [1172, SON + 1]]);
  pencere(K.div, [[840, 1172]]);
  const icinde = (f, a, b) => f >= a && f < b;

  // =====================================================================================================
  // DÜNYA (ön görünüş). B4 önde ve sırtı dönük (tezgâhın bu yanında, gövdesi kadrajın altına taşar); B3, B2, B tezgâhın
  // arkasında. Arka duvarda solda kapı (gidenler buradan çıkar), raf, saat; sağda çekmeceli dolap (B oraya yürür).
  // Göz hizası: kamera göz hizasında, uzaklaşan kişinin gözü hemen hemen aynı yükseklikte kalır, kişi küçülür.
  // =====================================================================================================
  const Y = yer({
    kisi: {
      B4: { x: 300, hiza: 870, olcek: 1.3 },
      B3: { x: 640, hiza: 756, olcek: 0.9 },
      B2: { x: 900, hiza: 774, olcek: 0.92 },
      B: { x: 1170, hiza: 800, olcek: 1 },
    },
    otur: 64, bSon: 1330,
    kapi: { x0: 392, x1: 616, ust: 292, alt: 900, ufuk: 770 },
    tezgah: { x0: -120, x1: 1500, ust: 856, on: 984, alt: 1700 },
    mengene: [1060, 984], cekic: [720, 934], anahtar: [1330, 948], aletOlcek: 1,
    raf: { y: 300, x0: 720, x1: 1240 },
    saat: [1420, 236, 52],
    dolap: { x0: 1562, x1: 1852, ust: 590, alt: 1700, cek0: 606, cekH: 84, cekAra: 92, bizim: 2 },
    kam7: { x0: 1070, y0: 220, gen: 1097 },
    // yürüyüşler: B4 sola çıkar; B2, B3 kapıya (kapi.x orta) küçülerek gider, kapı düzleminde kırpılır, sola çıkar
    b4Git: -700, kapiX: 504, kapiS: 0.7, cikisX: 250,
    gel: { dx: 70, dy: -150, boyut: 48 },
    soz2: { x: 560, y: 150, boyut: 40 }, soz3: { x: 150, y: 120, boyut: 40 },
    k9: { s: 1.9, ekran: [500, 430] },
  }, {
    kisi: {
      B4: { x: 230, hiza: 1400, olcek: 1.45 },
      B3: { x: 460, hiza: 1145, olcek: 0.86 },
      B2: { x: 680, hiza: 1177, olcek: 0.9 },
      B: { x: 875, hiza: 1202, olcek: 1 },
    },
    otur: 64, bSon: 1040,
    kapi: { x0: 120, x1: 340, ust: 600, alt: 1200, ufuk: 1060 },
    tezgah: { x0: -60, x1: 1250, ust: 1180, on: 1500, alt: 2400 },
    mengene: [690, 1500], cekic: [560, 1330], anahtar: [930, 1300], aletOlcek: 1.3,
    raf: { y: 560, x0: 450, x1: 1000 },
    saat: [880, 330, 50],
    dolap: { x0: 1260, x1: 1500, ust: 870, alt: 2400, cek0: 888, cekH: 84, cekAra: 92, bizim: 2 },
    kam6: { x0: 80, y0: 250, gen: 980 }, kam7: { x0: 840, y0: 392, gen: 617 },
    b4Git: -640, kapiX: 230, kapiS: 0.7, cikisX: -40,
    gel: { dx: -230, dy: -300, boyut: 44 },
    soz2: { x: 330, y: 330, boyut: 40 }, soz3: { x: 128, y: 520, boyut: 40 },
    k9: { s: 2.2, ekran: [300, 1230] },
  });

  const P = { B: ctx.kisiParam('B'), B2: ctx.kisiParam('B2'), B3: ctx.kisiParam('B3'), B4: ctx.kisiParam('B4') };
  // Çizim sırası: arka duvar < düşünce (B'nin arkasında) < tezgâh arkasındakiler < tezgâh < önde B4 < B'nin kolu < sözler
  const gArka = el(L.svg, 'g'), gOrta = el(L.svg, 'g'), gKisi = el(L.svg, 'g'), gOn = el(L.svg, 'g'), gOnKisi = el(L.svg, 'g');
  const gKol = el(L.svg, 'g'), gSoz = el(L.svg, 'g');
  const defs = el(L.svg, 'defs');

  // ---------- Arka duvar: kapı (açıklık, içeride koridorun uzak duvarı, içe açılmış kanat), raf, saat
  const KP = Y.kapi;
  {
    cizgi(gArka, dikdortgen(KP.x0 - 18, KP.ust - 18, KP.x1 + 18, KP.alt, 3), { kapali: true, dolgu: '#d8d2c7', renk: AR, kalinlik: 3.2, genlik: 0.5, tohum: 121, kay: [2, 2] });
    cizgi(gArka, dikdortgen(KP.x0, KP.ust, KP.x1, KP.alt), { kapali: true, dolgu: '#c4bdb0', renk: AR, kalinlik: 3, genlik: 0.5, tohum: 122, kay: [0, 0] });
    cizgi(gArka, dikdortgen(KP.x0, KP.ufuk, KP.x1, KP.alt), { kapali: true, dolgu: '#d2ccc0', renk: AR, kalinlik: 2.4, genlik: 0.4, tohum: 123, kay: [0, 0] });
    // içeride: uzak duvarda soluk bir pano (koridor)
    const px = lerp(KP.x0, KP.x1, 0.22), pw = (KP.x1 - KP.x0) * 0.3;
    cizgi(gArka, dikdortgen(px, KP.ust + (KP.ufuk - KP.ust) * 0.32, px + pw, KP.ust + (KP.ufuk - KP.ust) * 0.62, 3), { kapali: true, dolgu: '#d2ccc0', renk: AR, kalinlik: 2.2, genlik: 0.4, tohum: 124, kay: [0, 0] });
    // içe açılmış kanat (sağ pervaza menteşeli): ince yamuk
    const kx = KP.x1, kw = (KP.x1 - KP.x0) * 0.2;
    cizgi(gArka, yogun([[kx, KP.ust + 2], [kx - kw, KP.ust + 22], [kx - kw, KP.alt], [kx, KP.alt]], 14), { kapali: true, dolgu: '#d8d2c7', renk: AR, kalinlik: 2.8, genlik: 0.4, tohum: 125, kay: [0, 0] });
    cizgi(gArka, oval(kx - kw * 0.55, lerp(KP.ust, KP.ufuk, 0.62), 4, 4, 0, 360, 8), { kapali: true, dolgu: AR, renk: AR, kalinlik: 2, genlik: 0.2, tohum: 126, kay: [0, 0] });
  }
  // Kapıdan geçen kişi kapı boşluğuna kırpılır (kapı düzleminin ardında)
  const kapiKlip = el(el(defs, 'clipPath', { id: 's2-kapi', clipPathUnits: 'userSpaceOnUse' }), 'rect', { x: KP.x0 + 2, y: -2000, width: KP.x1 - KP.x0 - 4, height: 2000 + KP.alt });
  void kapiKlip;
  const rafG = el(gArka, 'g');
  yalnizArada(rafG, BAS, 1172);
  {
    const R = Y.raf, gArka = rafG;
    cizgi(gArka, dikdortgen(R.x0, R.y, R.x1, R.y + 14, 3), { kapali: true, dolgu: '#d8d2c7', renk: AR, kalinlik: 3, tohum: 101, kay: [2, 2] });
    for (const x of [R.x0 + 60, R.x1 - 60]) cizgi(gArka, [[x, R.y + 14], [x, R.y + 52], [x - 30, R.y + 14]], { renk: AR, kalinlik: 3, tohum: 102 + x % 7 });
    const ge = (R.x1 - R.x0) / 870;
    const kutular = [[R.x0 + 30 * ge, 96, 64], [R.x0 + 140 * ge, 70, 46], [R.x0 + 400 * ge, 120, 58], [R.x1 - 260 * ge, 84, 72], [R.x1 - 150 * ge, 60, 40]];
    kutular.forEach(([x, en, boy], i) => cizgi(gArka, dikdortgen(x, R.y - boy, x + en * Math.min(1, ge + 0.2), R.y, 4), { kapali: true, dolgu: ['#e2ddd3', '#d8d2c7', '#e6e1d7', '#d8d2c7', '#e2ddd3'][i], renk: AR, kalinlik: 2.8, tohum: 110 + i, kay: [2, 2] }));
    const jx = R.x0 + 290 * ge;
    cizgi(gArka, dikdortgen(jx, R.y - 66, jx + 52, R.y, 10), { kapali: true, dolgu: '#ece8e0', renk: AR, kalinlik: 2.8, tohum: 118, kay: [2, 2] });
    cizgi(gArka, dikdortgen(jx - 3, R.y - 78, jx + 55, R.y - 64, 3), { kapali: true, dolgu: '#bdb6a9', renk: AR, kalinlik: 2.6, tohum: 119, kay: [1.5, 1.5] });
  }
  {
    const [sx, sy, sr] = Y.saat;
    cizgi(gArka, oval(sx, sy, sr, sr, 0, 360, 20, 2), { kapali: true, dolgu: '#ece8e0', renk: AR, kalinlik: 3.2, tohum: 131, kay: [2, 2] });
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r1 = sr * (i % 3 ? 0.82 : 0.74); cizgi(gArka, [[sx + Math.cos(a) * r1, sy + Math.sin(a) * r1], [sx + Math.cos(a) * sr * 0.9, sy + Math.sin(a) * sr * 0.9]], { renk: AR, kalinlik: 2.4, tohum: 140 + i, genlik: 0.3 }); }
    cizgi(gArka, [[sx, sy], [sx + sr * 0.18, sy - sr * 0.5]], { renk: MUR, kalinlik: 3.6, tohum: 153 });
    cizgi(gArka, [[sx, sy], [sx + sr * 0.6, sy + sr * 0.12]], { renk: MUR, kalinlik: 3, tohum: 154 });
  }
  // Dolap (ön görünüş) ve #9'daki açık çekmece
  const DL = Y.dolap;
  const cekY = (i) => DL.cek0 + i * DL.cekAra;
  const px0 = DL.x0 + 12, px1 = DL.x1 - 12, pcx = (px0 + px1) / 2;
  const kulpOn = (y0) => [pcx - 76, y0 + 14, pcx + 76, y0 + 25];
  {
    cizgi(gArka, dikdortgen(DL.x0, DL.ust, DL.x1, DL.alt, 4), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, genlik: 0.6, tohum: 201 });
    cizgi(gArka, dikdortgen(DL.x0 - 10, DL.ust - 18, DL.x1 + 10, DL.ust + 2, 4), { kapali: true, dolgu: '#a59e91', kalinlik: 4, genlik: 0.6, tohum: 202 });
    for (let i = 0; cekY(i) + DL.cekH < DL.alt - 8; i++) {
      const y0 = cekY(i);
      cizgi(gArka, dikdortgen(px0, y0, px1, y0 + DL.cekH, 5), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.4, genlik: 0.5, tohum: 210 + i * 3 });
      const [a, b, c, d] = kulpOn(y0);
      cizgi(gArka, dikdortgen(a, b, c, d, 5), { kapali: true, dolgu: '#6f695f', kalinlik: 2.8, genlik: 0.4, tohum: 211 + i * 3, kay: [1.5, 1.5] });
    }
  }
  const DP = 74, TW = 13;
  const cy0 = cekY(DL.bizim);
  const agiz = { x0: px0, x1: px1, ust: cy0 - DP, alt: cy0, ix0: px0 + TW, ix1: px1 - TW };
  const acikG = el(gArka, 'g');
  {
    cizgi(acikG, dikdortgen(agiz.x0, agiz.ust, agiz.x1, agiz.alt + 6), { kapali: true, dolgu: '#a59e91', kalinlik: 3.6, genlik: 0.5, tohum: 251 });
    cizgi(acikG, dikdortgen(agiz.ix0, agiz.ust + 9, agiz.ix1, agiz.alt + 6), { kapali: true, dolgu: '#ebe7df', kalinlik: 2.6, genlik: 0.5, tohum: 252, kay: [0, 0] });
    // dağınık içerik (önden-üstten bakış, y basık): öne yığılmış (çekmece dayanınca öne kaydılar)
    const r = rng(2601);
    for (let i = 0; i < 18; i++) {
      const x = lerp(agiz.ix0 + 14, agiz.ix1 - 14, r()), y = lerp(agiz.ust + 30, agiz.alt - 2, Math.pow(r(), 0.5)), a = r() * 180, L0 = 12 + r() * 24;
      const g = el(acikG, 'g', { transform: `translate(${f1(x)} ${f1(y)}) scale(1 0.55) rotate(${a.toFixed(0)})` });
      if (i % 3 === 2) cizgi(g, oval(0, 0, 6.5, 6.5, 0, 360, 6, 2), { kapali: true, dolgu: '#8d867a', kalinlik: 2, genlik: 0.3, tohum: 260 + i, kay: [1, 1] });
      else cizgi(g, [[-L0 / 2, -2.5], [L0 / 2, -2.5], [L0 / 2 + 3, 0], [L0 / 2, 2.5], [-L0 / 2, 2.5]], { kapali: true, dolgu: '#b0a99c', kalinlik: 2, genlik: 0.3, tohum: 260 + i, kay: [1, 1] });
    }
    cizgi(acikG, dikdortgen(px0 - 4, cy0, px1 + 4, cy0 + DL.cekH + 4, 5), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.8, genlik: 0.5, tohum: 254 });
    const [a, b, c, d] = kulpOn(cy0);
    cizgi(acikG, dikdortgen(a, b, c, d, 5), { kapali: true, dolgu: '#6f695f', kalinlik: 3, genlik: 0.4, tohum: 255, kay: [1.5, 1.5] });
  }
  yalnizArada(acikG, 1172);

  // =====================================================================================================
  // KİŞİLER. figur(): film.js kisi() gibi (kutu 400×440, hiza ile boy farkı); hareket grubu ic (konum, ölçek, eğilme),
  // içinde gövde ve baş iki kopya (bol: boyun kökünden kırpılır; yürürken gövde salınır, baş dik kalır). kol: B'nin #9 kolu
  // (gövde kol yanında govdeKes ile kesilir, kol ayrı svg'de). Dönüşümler her karede izlerden (herKare) hesaplanır.
  // =====================================================================================================
  const figurler = [];
  function figur(ust, ad, { x, hiza, olcek: o }, { kolUst = null } = {}) {
    const p = P[ad], alt = hiza + boyKaymasi(p) * o, x0 = x - 200 * o, y0 = alt - 440 * o;
    const g = el(ust, 'g'), ic = el(g, 'g'), govdeG = el(ic, 'g'), basG = el(ic, 'g');
    const yap = (u) => el(u, 'svg', { viewBox: '0 0 400 440', width: 400 * o, height: 440 * o, x: x0, y: y0, overflow: 'visible' });
    const sG = yap(govdeG), sB = yap(basG);
    const kolG = kolUst ? el(kolUst, 'g') : null, sK = kolG ? yap(kolG) : null;
    const gY = GOZ_Y + 4 + p.yuzBoy + (p.boy === 'uzun' ? 8 : 0), kesY = gY + 10;
    const id = `s2-${ad}`;
    const h = { ad, p, g, ic, govdeG, basG, kolG, o, x, alt, x0, y0, ifade: 'notr', bakis: [0, 0], arka: false, bol: false, kol: null, kesY };
    h.dunya = ([bx, by]) => [x0 + bx * o, y0 + by * o];
    h.goz = h.dunya([200, GOZ_Y]); h.boyun = h.dunya([200, kesY]); h.bel = h.dunya([200, 400]);
    const Yp = YAPI[p.yapi] || YAPI.orta;
    h.hw = p.yuzEn * Yp.yuz;
    h.agiz = (yon = 0) => h.dunya([200 + yon * h.hw * 0.55, GOZ_Y + 4 + p.yuzBoy * 0.52]);
    h.basMerkez = h.dunya([200, GOZ_Y - 10]);
    let son = 0;
    h.ciz = (i = kay) => {
      son = Math.max(0, i);
      const sv = kisiSVG(p, { kaynama: son, ifade: h.ifade, bakis: h.bakis, mono: true, arka: h.arka });
      if (h.kol) {
        const G = govdeKes(p, { sag: true, sol: false, id: `${id}-kes`, kaynama: son });
        sG.innerHTML = G.tanim + `<g ${G.klip}>${sv}</g>` + G.kontur; sB.innerHTML = '';
        h.kolCiz(); return;
      }
      if (sK) sK.innerHTML = '';
      if (!h.bol) { sG.innerHTML = sv; sB.innerHTML = ''; return; }
      sG.innerHTML = `<defs><clipPath id="${id}-g" clipPathUnits="userSpaceOnUse"><rect x="-500" y="${kesY - 1}" width="1400" height="1500"/></clipPath></defs><g clip-path="url(#${id}-g)">${sv}</g>`;
      sB.innerHTML = `<defs><clipPath id="${id}-b" clipPathUnits="userSpaceOnUse"><rect x="-500" y="-500" width="1400" height="${kesY + 501}"/></clipPath></defs><g clip-path="url(#${id}-b)">${sv}</g>`;
    };
    h.kolCiz = () => { if (sK) sK.innerHTML = h.kol ? h.kol(son) : ''; };
    h.poz = ({ ifade, bakis, arka, bol, kol } = {}) => {
      if (ifade) h.ifade = ifade; if (bakis) h.bakis = bakis; if (arka != null) h.arka = arka; if (bol != null) h.bol = bol;
      if (kol !== undefined) h.kol = kol;
      h.ciz();
    };
    // İzler (dünya birimi): x, dy kayması; s ölçek; sq yatay basılma (dönüş); egil derece (bel çevresinde); kalk (oturma);
    // salla baş derecesi (konuşurken); yuru: [[k0, k1, genlik]] adım pencereleri
    h.iz = { x: () => 0, dy: () => 0, s: () => 1, sq: () => 1, egil: () => 0, kalk: () => 0, salla: () => 0, yuru: [] };
    h.T = { ex: h.goz[0], ey: h.goz[1], sx: 1, sy: 1, egil: 0, Wx: h.bel[0], Wy: h.bel[1] };
    h.uygula = (f) => {
      const I = h.iz, f5 = Math.floor(f / 5) * 5;
      let dx = I.x(f), dy = I.dy(f) + I.kalk(f5), s = I.s(f), rock = 0, bas = I.salla(f5), bob = 0;
      const sq = I.sq(f5), egil = I.egil(f5);
      for (const [w0, w1, gen = 1] of I.yuru) if (f >= w0 && f < w1) {
        const n = Math.floor((f - w0) / 5), ad2 = Math.floor(n / 2), faz = n % 2, yon = ad2 % 2 ? 1 : -1;
        rock = yon * 4.4 * gen; bob = (faz ? -11 : 4) * gen; dx += yon * 3 * gen * s; bas += -yon * 1.3 * gen;
      }
      const [E0x, E0y] = h.goz, [W0x, W0y] = h.bel;
      const ex = E0x + dx, ey = E0y + dy + bob * o * s, sx = s * sq, sy = s;
      const Wx = ex + (W0x - E0x) * sx, Wy = ey + (W0y - E0y) * sy;
      const t = `translate(${f2(Wx)} ${f2(Wy)}) rotate(${f2(egil)}) translate(${f2(-Wx)} ${f2(-Wy)}) translate(${f2(ex)} ${f2(ey)}) scale(${f3(sx)} ${f3(sy)}) translate(${f2(-E0x)} ${f2(-E0y)})`;
      ic.setAttribute('transform', t);
      if (kolG) kolG.setAttribute('transform', t);
      const [Nx, Ny] = h.boyun;
      govdeG.setAttribute('transform', rock ? `rotate(${f2(rock)} ${f2(Nx)} ${f2(Ny)})` : '');
      basG.setAttribute('transform', bas ? `rotate(${f2(bas)} ${f2(Nx)} ${f2(Ny)})` : '');
      h.T = { ex, ey, sx, sy, egil, Wx, Wy };
    };
    // Dönüşümsüz dünya noktası → şimdiki yeri (eğilme dahil; gövde salınımı hariç)
    h.nokta = ([wx, wy]) => {
      const { ex, ey, sx, sy, egil, Wx, Wy } = h.T, [E0x, E0y] = h.goz;
      const x1 = ex + (wx - E0x) * sx, y1 = ey + (wy - E0y) * sy, a = egil * D2R, c = Math.cos(a), sn = Math.sin(a);
      return [Wx + (x1 - Wx) * c - (y1 - Wy) * sn, Wy + (x1 - Wx) * sn + (y1 - Wy) * c];
    };
    h.ciz(0);
    ctx.kaynayanlar.add((i) => h.ciz(i));
    figurler.push(h);
    return h;
  }
  // Konuşma çizgileri: yanakta (sırtı dönükte başın yanında) üç kısa çizgi (yelpaze), konuşma yönünde; baş grubunda
  function konusmaCizgisi(h, yon, tohum) {
    const o = h.o, [mx, my] = h.dunya([200 + yon * (h.hw + 26), GOZ_Y + 4 + h.p.yuzBoy * 0.4]);
    const g = el(h.basG, 'g');
    [-40, 0, 40].forEach((a, i) => {
      const r = (a + (yon > 0 ? 0 : 180)) * D2R, r0 = 15 * o, l = (i === 1 ? 22 : 17) * o;
      cizgi(g, [[mx + Math.cos(r) * r0, my + Math.sin(r) * r0], [mx + Math.cos(r) * (r0 + l), my + Math.sin(r) * (r0 + l)]], { kalinlik: 4.4 * o, tohum: tohum + i, genlik: 0.5 });
    });
    gsap.set(g, { autoAlpha: 0 });
    return g;
  }
  const poz = (h, kare, o) => tl.call(() => h.poz(o), null, k(kare));
  // Konuşma: k0..k1 arası 5 k'lık adımlarla çizgiler yanar/söner, ağız ifadeleri döner (12 fps)
  function konusur(h, cizg, k0, k1, { desen = [1, 1, 0, 1, 1, 0, 1, 0], ifadeler = ['merak', 'notr', 'mutlu', 'notr'], bakis = null, son = 'notr' } = {}) {
    let j = 0;
    for (let t = adim(k0); t < k1; t += 5, j++) {
      const on = desen[j % desen.length], ifade = on ? ifadeler[j % ifadeler.length] : 'notr';
      tl.set(cizg, { autoAlpha: on ? 1 : 0 }, k(t));
      if (!h.arkaSabit) tl.call(() => h.poz(bakis ? { ifade, bakis } : { ifade }), null, k(t));
    }
    tl.set(cizg, { autoAlpha: 0 }, k(adim(k1)));
    if (!h.arkaSabit) tl.call(() => h.poz({ ifade: son }), null, k(adim(k1)));
  }

  // Tezgâhın arkasındakiler (çizim sırası: B2 geçerken B3'ün ardında kalır), önde B4
  const B2 = figur(gKisi, 'B2', Y.kisi.B2);
  const B3 = figur(gKisi, 'B3', Y.kisi.B3);
  const B = figur(gKisi, 'B', Y.kisi.B, { kolUst: gKol });
  const B4 = figur(gOnKisi, 'B4', Y.kisi.B4);
  // B2, B3 orta derinlikte: renkleri %20 kâğıda çekilir (renk matrisi; saydamlık değil, arkadakiler içinden görünmez)
  {
    const a = 0.2, kg = [0xf1, 0xed, 0xe6].map((v) => (v / 255) * a), b = (1 - a).toFixed(3);
    const f = el(defs, 'filter', { id: 's2-pus-orta', 'color-interpolation-filters': 'sRGB', x: '-5%', y: '-5%', width: '110%', height: '110%' });
    el(f, 'feColorMatrix', { type: 'matrix', values: `${b} 0 0 0 ${kg[0].toFixed(4)} 0 ${b} 0 0 ${kg[1].toFixed(4)} 0 0 ${b} 0 ${kg[2].toFixed(4)} 0 0 0 1 0` });
    B2.ic.setAttribute('filter', 'url(#s2-pus-orta)');
    B3.ic.setAttribute('filter', 'url(#s2-pus-orta)');
  }

  // ---------- Tezgâh (tezgâh arkasındakilerin önünde, B4'ün arkasında): üst yüzey + ön yüz, mengene ve iki alet
  const aletG = el(gOn, 'g');
  {
    const T = Y.tezgah;
    cizgi(gOn, dikdortgen(T.x0, T.ust, T.x1, T.on, 0), { kapali: true, dolgu: '#e2ddd3', kalinlik: 4, genlik: 0.5, tohum: 301 });
    cizgi(gOn, dikdortgen(T.x0, T.on, T.x1, T.on + 30, 0), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, genlik: 0.5, tohum: 302 });
    cizgi(gOn, dikdortgen(T.x0 + 20, T.on + 30, T.x1 - 20, T.alt, 0), { kapali: true, dolgu: '#cfc9bd', kalinlik: 4, genlik: 0.5, tohum: 303 });
    for (const [x0, x1] of [[T.x0 + 160, T.x0 + 560], [T.x1 - 700, T.x1 - 300]]) {
      cizgi(gOn, dikdortgen(x0, T.on + 64, x1, T.on + 150, 4), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3, genlik: 0.4, tohum: 304 + x0 % 5, kay: [1.5, 1.5] });
      cizgi(gOn, [[(x0 + x1) / 2 - 40, T.on + 92], [(x0 + x1) / 2 + 40, T.on + 92]], { kalinlik: 5, tohum: 306 + x0 % 3 });
    }
    gOn.appendChild(aletG);
    const [mx, my] = Y.mengene, AO = Y.aletOlcek;
    const Mg = el(aletG, 'g', { transform: `translate(${mx} ${my}) scale(${AO}) translate(${-mx} ${-my})` });
    cizgi(Mg, dikdortgen(mx - 70, my - 16, mx + 54, my + 4, 4), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 311 });
    cizgi(Mg, dikdortgen(mx - 54, my - 66, mx + 28, my - 16, 6), { kapali: true, dolgu: '#a59e91', kalinlik: 3.6, tohum: 312 });
    cizgi(Mg, dikdortgen(mx - 66, my - 92, mx - 10, my - 64, 3), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 313 });
    cizgi(Mg, dikdortgen(mx - 4, my - 92, mx + 50, my - 64, 3), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6, tohum: 314 });
    cizgi(Mg, dikdortgen(mx + 28, my - 50, mx + 100, my - 40, 3), { kapali: true, dolgu: '#6f695f', kalinlik: 3, tohum: 315 });
    cizgi(Mg, [[mx + 100, my - 84], [mx + 100, my - 6]], { kalinlik: 6, tohum: 316 });
    for (const yy of [my - 88, my - 2]) cizgi(Mg, oval(mx + 100, yy, 7, 7, 0, 360, 8), { kapali: true, dolgu: '#6f695f', kalinlik: 2.8, tohum: 317, kay: [1, 1] });
    const [hx, hy] = Y.cekic;
    const C = el(aletG, 'g', { transform: `translate(${hx} ${hy}) rotate(-8) scale(${AO})` });
    cizgi(C, dikdortgen(-110, -7, 60, 7, 6), { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.4, tohum: 321 });
    cizgi(C, dikdortgen(52, -26, 86, 26, 4), { kapali: true, dolgu: '#6f695f', kalinlik: 3.4, tohum: 322 });
    const [ax, ay] = Y.anahtar;
    const A = el(aletG, 'g', { transform: `translate(${ax} ${ay}) rotate(6) scale(${AO})` });
    cizgi(A, dikdortgen(-90, -7, 70, 7, 6), { kapali: true, dolgu: '#a59e91', kalinlik: 3.2, tohum: 323 });
    cizgi(A, [[70, -6], [74, -20], [96, -22], [104, -10], [88, -6], [88, 6], [104, 10], [96, 22], [74, 20], [70, 6]], { kapali: true, dolgu: '#a59e91', kalinlik: 3.2, tohum: 324 });
  }
  yalnizArada(aletG, BAS, 1172);

  // =====================================================================================================
  // #6 (k576–759): sohbet; B4 çıkar; B2 ister ve kapıya gider; B3 ardından; B kalkar, "Geliyorum!"
  // =====================================================================================================
  const kapiDx = (h) => Y.kapiX - h.x, cikDx = (h) => Y.cikisX - h.x;
  const kapiS = (h) => Y.kapiS / h.o * 0.92;              // kapı düzlemindeki ölçek (her kişi aynı boyda görünür)
  // Başlangıç pozları
  poz(B4, BAS, { arka: true, bol: true });
  B4.arkaSabit = true;
  poz(B3, BAS, { ifade: 'mutlu', bakis: [-1, 0.5], arka: false, bol: true });
  poz(B2, BAS, { ifade: 'merak', bakis: [-1, 0.5], arka: false, bol: true });
  poz(B, BAS, { ifade: 'notr', bakis: [-1, 0.5], arka: false, bol: true, kol: null });
  for (const h of figurler) tl.set(h.g, { attr: { 'clip-path': 'none' } }, k(BAS));

  // B4: konuşur (baş sallanır, çizgiler sağda), sonra sola yürüyüp çıkar (hafif küçülerek: tezgâhın ucundan dolanır)
  const c4 = konusmaCizgisi(B4, 1, 401), c3 = konusmaCizgisi(B3, -1, 404), c2 = konusmaCizgisi(B2, -1, 407), c2b = konusmaCizgisi(B2, 1, 410), cB = konusmaCizgisi(B, -1, 413);
  konusur(B4, c4, BAS, 612, { desen: [1, 1, 0, 1, 1, 1, 0, 1] });
  konusur(B4, c4, 624, 636, { desen: [1, 0, 1] });
  B4.iz.salla = basamak([BAS, 0], [580, 1.6], [585, -0.8], [590, 1.8], [595, 0], [600, 1.4], [605, -1], [610, 0.6], [615, 0], [625, 1.4], [630, -0.6], [635, 0]);
  B4.iz.egil = basamak([BAS, 1.6], [612, 0.4], [625, 1.4], [636, 0]);
  B4.iz.x = iz([636, 0], [700, Y.b4Git, 'power1.in']);
  B4.iz.s = iz([636, 1], [700, 0.94]);
  B4.iz.yuru = [[636, 700, 1.1]];
  yalnizArada(B4.g, BAS, 702);

  // B3: B4'e güler, sonra gider
  konusur(B3, c3, 600, 632, { desen: [1, 1, 0, 1, 1, 0], ifadeler: ['mutlu', 'mutlu', 'notr', 'mutlu'], bakis: [-1, 0.5], son: 'mutlu' });
  B3.iz.egil = basamak([BAS, -1.2], [600, -3.2], [615, -1.8], [632, -0.6]);
  poz(B3, 646, { ifade: 'notr', bakis: [1, 0] });
  poz(B3, 663, { ifade: 'mutlu', bakis: [-1, 0] });
  poz(B3, 668, { arka: true });
  const B3KAPI = 728;
  B3.iz.sq = basamak([BAS, 1], [668, 0.9], [673, 1]);
  B3.iz.x = iz([672, 0], [B3KAPI, kapiDx(B3), 'power1.inOut'], [772, cikDx(B3), 'none']);
  B3.iz.s = iz([672, 1], [B3KAPI, kapiS(B3), 'power1.out']);
  B3.iz.dy = iz([672, 0], [B3KAPI, -16]);
  B3.iz.yuru = [[672, 772, 1]];
  tl.set(B3.g, { attr: { 'clip-path': 'url(#s2-kapi)' } }, k(B3KAPI));
  yalnizArada(B3.g, BAS, 774);

  // B2: B4'e takılır, B'ye döner ve ister; sırtını döner, kapıya gider (B3'ün ardından geçer)
  konusur(B2, c2, 616, 636, { desen: [1, 1, 0, 1], ifadeler: ['mutlu', 'notr', 'mutlu', 'notr'], bakis: [-1, 0.5] });
  B2.iz.egil = basamak([BAS, 1.4], [616, 3.2], [636, 0.8], [640, -1.6], [688, 0]);
  poz(B2, 640, { ifade: 'merak', bakis: [1, 0] });
  konusur(B2, c2b, 644, 688, { desen: [1, 1, 0, 1, 1, 1, 0, 1, 1], ifadeler: ['merak', 'notr', 'mutlu', 'notr'], bakis: [1, 0] });
  poz(B2, 688, { ifade: 'mutlu', bakis: [-1, 0] });
  poz(B2, 692, { arka: true });
  B2.iz.sq = basamak([BAS, 1], [692, 0.9], [697, 1]);
  const B2KAPI = 758;
  B2.iz.x = iz([696, 0], [B2KAPI, kapiDx(B2), 'power1.inOut'], [800, cikDx(B2), 'none']);
  B2.iz.s = iz([696, 1], [B2KAPI, kapiS(B2), 'power1.out']);
  B2.iz.dy = iz([696, 0], [B2KAPI, -12]);
  B2.iz.yuru = [[696, 800, 1]];
  tl.set(B2.g, { attr: { 'clip-path': 'url(#s2-kapi)' } }, k(B2KAPI));
  yalnizArada(B2.g, BAS, 802);

  // B: taburede dinler, güler; B2'ye bakar; gidenlere bakar; kalkar (12 fps), "Geliyorum!"; döner, dolaba yürür (#7)
  const dxYuru = Y.bSon - Y.kisi.B.x;
  poz(B, 600, { ifade: 'mutlu', bakis: [-1, 0.5] });
  poz(B, 625, { ifade: 'notr', bakis: [-1, 0.5] });
  poz(B, 640, { ifade: 'merak', bakis: [-1, 0] });
  poz(B, 660, { ifade: 'notr', bakis: [-1, 0] });
  poz(B, 700, { ifade: 'notr', bakis: [-1, -0.4] });
  poz(B, 725, { ifade: 'merak', bakis: [-1, 0] });
  poz(B, 735, { ifade: 'mutlu', bakis: [-1, 0] });
  konusur(B, cB, 738, 754, { desen: [1, 1, 1, 0], ifadeler: ['mutlu', 'mutlu', 'notr', 'mutlu'], bakis: [-1, 0], son: 'mutlu' });
  poz(B, 756, { ifade: 'notr', bakis: [1, 0] });
  poz(B, 830, { ifade: 'merak', bakis: [1, 1] });
  B.iz.kalk = basamak([BAS, Y.otur], [724, Y.otur + 8], [729, Y.otur * 0.42], [734, -8], [739, 0]);
  B.iz.egil = basamak([BAS, -1.4], [600, -2.6], [625, -1], [724, 1.6], [734, 0], [740, -2.4], [756, 0], [760, 0], [770, 2.6], [775, 3.4], [826, 1.2], [832, 0]);
  B.iz.sq = basamak([BAS, 1], [760, 0.93], [765, 1]);
  B.iz.x = iz([766, 0], [832, dxYuru, E.KM]);
  B.iz.yuru = [[766, 832, 0.9]];

  // ---------- Konuşma balonu (sesli söz): elle çizilmiş yuvarlak köşeli kutu, kuyruğu her karede konuşanın ağzına uzanır
  // (film.js konus() ile aynı çizim; kuyruk dinamik, en çok uzun px). kayFn verilirse balon (yazısıyla) birlikte kayar.
  const sozler = [];
  function soz(svgUst, divUst, satirlar, { x, y, boyut, tohum, kuyruk, kayFn = null, uzun = 170, bosluk = 0, aci = 0 }) {
    const dis = el(svgUst, 'g'), g = el(dis, 'g');
    const kap = document.createElement('div');
    kap.className = 'vk'; Object.assign(kap.style, { width: W + 'px', height: H + 'px' });
    divUst.appendChild(kap);
    const p = document.createElement('p');
    p.className = 'el-yazisi';
    p.innerHTML = satirlar.map((s) => `<span style="display:block;line-height:1.16;padding-right:0.15em">${s}</span>`).join('');
    Object.assign(p.style, { left: x + 'px', top: y + 'px', fontSize: boyut + 'px', transform: `rotate(${aci}deg)` });
    kap.appendChild(p);
    const w = p.offsetWidth || boyut * 6, hh = p.offsetHeight || boyut;
    const cx = x + w / 2, cy = y + hh / 2, rx = w / 2 + 26, ry = hh / 2 + 16;
    cizgi(g, oval(cx, cy, rx, ry, 0, 360, 30, 5.5), { kapali: true, dolgu: BALON, kalinlik: 4.5, tohum, genlik: 1.1, kay: [0, 0] });
    const kd = el(g, 'path', { fill: BALON });
    const k1 = cizgi(g, [[0, 0], [1, 1], [2, 2]], { kalinlik: 4.5, tohum: tohum + 1, genlik: 0.9 });
    const k2 = cizgi(g, [[0, 0], [1, 1]], { kalinlik: 4.5, tohum: tohum + 2, genlik: 0.9 });
    const Pk = (t) => { const c = Math.cos(t), sn = Math.sin(t); return [cx + rx * Math.sign(c) * Math.abs(c) ** (2 / 5.5), cy + ry * Math.sign(sn) * Math.abs(sn) ** (2 / 5.5)]; };
    const hb = { g, dis, kap, p, kutu: [cx - rx, cy - ry, cx + rx, cy + ry], satir: Array.from(p.querySelectorAll('span')) };
    hb.kuyrukKur = (uc0, [ox, oy] = [0, 0]) => {
      const uc = [uc0[0] - ox, uc0[1] - oy];
      // taban: konturun kuyruk yönündeki noktasının iki yanında sabit genişlik (geniş balonda kama gibi açılmasın)
      const a = Math.atan2((uc[1] - cy) / ry, (uc[0] - cx) / rx);
      const m0 = uc[1] > cy + ry * 0.7 ? [sinir(uc[0], cx - rx * 0.62, cx + rx * 0.62), cy + ry - 1] : Pk(a);
      let vx = uc[0] - m0[0], vy = uc[1] - m0[1];
      const L0 = Math.hypot(vx, vy) || 1, ux = vx / L0, uy = vy / L0, yarim = Math.min(24, rx * 0.3);
      const b1 = [m0[0] - uy * yarim - ux * 7, m0[1] + ux * yarim - uy * 7], b2 = [m0[0] + uy * yarim - ux * 7, m0[1] - ux * yarim - uy * 7];
      const boy = Math.min(uzun, Math.max(30, L0 - bosluk));
      const tip = [m0[0] + ux * boy, m0[1] + uy * boy], ic = (q) => [q[0] + (cx - q[0]) * 0.1, q[1] + (cy - q[1]) * 0.1];
      kd.setAttribute('d', `M${f1(ic(b1)[0])} ${f1(ic(b1)[1])}L${f1(b1[0])} ${f1(b1[1])}L${f1(tip[0])} ${f1(tip[1])}L${f1(b2[0])} ${f1(b2[1])}L${f1(ic(b2)[0])} ${f1(ic(b2)[1])}Z`);
      k1.pts = [b1, [(b1[0] + tip[0]) / 2 + (b2[1] - b1[1]) * 0.08, (b1[1] + tip[1]) / 2], tip]; k1.ciz();
      k2.pts = [b2, tip]; k2.ciz();
    };
    hb.guncelle = (f) => {
      const o = kayFn ? kayFn(f) : [0, 0];
      if (kayFn) { dis.setAttribute('transform', `translate(${f2(o[0])} ${f2(o[1])})`); kap.style.transform = `translate(${f2(o[0])}px, ${f2(o[1])}px)`; }
      if (kuyruk) hb.kuyrukKur(kuyruk(f), o);
    };
    gsap.set(g, { autoAlpha: 0, scale: 0.6, svgOrigin: `${f1(cx)} ${f1(cy + ry)}` });
    gsap.set(p, { autoAlpha: 0 });
    gsap.set(hb.satir, { clipPath: 'inset(-30% 100% -30% 0%)' });
    // ac(k0, [[k, süre], ...]): balon 8 k BO ile açılır, satırlar sırayla yazılır
    hb.ac = (k0, yazim) => {
      tl.fromTo(g, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(k0));
      tl.set(p, { autoAlpha: 1 }, k(k0 + 2));
      yazim.forEach(([a, s], i) => tl.fromTo(hb.satir[i], { clipPath: 'inset(-30% 100% -30% 0%)' }, { clipPath: 'inset(-30% 0% -30% 0%)', duration: k(s), ease: 'none', immediateRender: false }, k(a)));
    };
    hb.kapat = (k0, sure = 10) => { tl.to(g, { autoAlpha: 0, scale: 0.92, duration: k(sure), ease: E.EI }, k(k0)); tl.to(p, { autoAlpha: 0, duration: k(sure), ease: E.EI }, k(k0)); };
    sozler.push(hb);
    return hb;
  }
  const t2 = (tr, en) => (DIL === 'en' ? en : tr);
  // Kuyruk ucu: konuşanın başı (sırtı dönükken başın yanı); şimdiki dönüşümüyle
  const basUcu = (h, yon, kapiKare = Infinity) => (f) => {
    // önden: yanağın dışında biter (yüzün üstünden geçmesin); arkadan: başın tepesine
    const p = h.nokta(h.arka ? h.dunya([200 + yon * h.hw * 0.35, GOZ_Y - h.p.yuzBoy - 40]) : h.dunya([200 + yon * (h.hw + 30), GOZ_Y + 36]));
    return f >= kapiKare ? [Math.max(p[0], KP.x0 + 40), p[1]] : p;
  };
  const soz2 = soz(gSoz, L.div, t2(['M8 vida…', '3 tane de M6 getirir misin kanka?'], ['An M8 screw…', 'and three M6s, mate?']),
    { ...Y.soz2, tohum: 71, kuyruk: basUcu(B2, -1, B2KAPI), uzun: 700, bosluk: 14 });
  soz2.ac(642, [[646, 12], [662, 28]]);
  soz2.kapat(782);
  const soz3 = soz(gSoz, L.div, t2(['Yazıcı ısındı!'], ["Printer's warmed up!"]), { ...Y.soz3, tohum: 77, kuyruk: basUcu(B3, -1, B3KAPI), uzun: 700, bosluk: 14 });
  soz3.ac(672, [[676, 16]]);
  soz3.kapat(784);
  const gYon = 1, bAgiz = B.agiz(gYon);
  const gel = soz(gSoz, L.div, t2(['Geliyorum!'], ['Coming!']), {
    x: bAgiz[0] + Y.gel.dx, y: bAgiz[1] + Y.gel.dy, boyut: Y.gel.boyut, tohum: 61, uzun: 90,
    kuyruk: () => B.nokta(B.dunya([200 + gYon * (B.hw + 34), GOZ_Y + 46])), kayFn: () => { const [x1, y1] = B.nokta(B.goz); return [x1 - B.goz[0], y1 - B.goz[1]]; },
  });
  gel.ac(738, [[742, 14]]);
  gel.kapat(846);

  // ---------- Kamera #6–#7 (dünya). Geniş plan: hafif itiş; B yürürken orta plana yaklaşarak izler
  const K6 = Y.kam6 ? cerceve(Y.kam6.x0, Y.kam6.y0, Y.kam6.gen) : { x: 0, y: 0, scale: 1 };
  const K7 = cerceve(Y.kam7.x0, Y.kam7.y0, Y.kam7.gen);
  const bGozSon = [B.goz[0] + dxYuru, B.goz[1]];
  kameraKoy(BAS, K6);
  kameraGit(BAS, 200, it(K6, 1.018, [lerp(B2.goz[0], B.goz[0], 0.4), B.goz[1]]), 'none');
  kameraGit(776, 64, K7, E.KM);

  // =====================================================================================================
  // #8 (k840–1171): KUŞ BAKIŞI (ekran koordinatı; çekmece-yerel u = mm, iç EN × DER; ekran = (OX, OY) + σ·(x, y + D))
  // =====================================================================================================
  const KB = yer({ sig: 2.0, OX: 560, YD: 150, kx: 168 }, { sig: 2.2, OX: 100, YD: 430, kx: 160 });
  const sig = KB.sig, OX = KB.OX, OY = KB.YD - 314 * sig, LB = 322;
  // Çekmece konumu (mm, öne +): hazırlık 5 mm içeri, çekiş (yavaş başlar, hızlı biter: son hız ortalamanın 1,2 katı), dayanağa
  // vurur, 6 mm geri seker
  const Dd = (f) => {
    if (f < 884) return 0;
    if (f < 892) return -5 * Math.sin(((f - 884) / 8) * Math.PI / 2);
    if (f < 922) { const t = (f - 892) / 30; return -5 + (LB + 5) * t * t * (1.8 - 0.8 * t); }
    if (f < 932) { const t = (f - 922) / 10; return LB - 6 * Math.sin(Math.PI * t) * (1 - t * 0.3); }
    return LB;
  };
  const ekranK = (x, y, f) => [OX + sig * x, OY + sig * (y + Dd(f))];
  const ZEMIN = '#ebe7df';
  const uG = (ust, x, y, aci = 0) => el(ust, 'g', { transform: `translate(${OX + sig * x} ${OY + sig * y}) rotate(${aci}) scale(${sig})` });
  // Alt svg: yer, (yatayda) tezgâh, çekmece gövdesi ve iç taban
  el(K.svg, 'rect', { x: -3000, y: -3000, width: 8000, height: 8000, fill: '#e6e1d8' });
  if (!DIKEY) {
    const tx1 = OX - 46 * sig - 16, ty1 = OY + sig * 332;
    cizgi(K.svg, dikdortgen(-300, OY + sig * -30, tx1, ty1, 0), { kapali: true, dolgu: '#e2ddd3', kalinlik: 4.5, genlik: 0.5, tohum: 521, kay: [0, 0] });
    cizgi(K.svg, dikdortgen(-300, ty1 - 26, tx1, ty1, 0), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, genlik: 0.5, tohum: 522, kay: [0, 0] });
    const C = el(K.svg, 'g', { transform: `translate(200 ${OY + sig * 262}) rotate(34) scale(1.8)` });
    cizgi(C, dikdortgen(-110, -7, 60, 7, 6), { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.4, tohum: 523 });
    cizgi(C, dikdortgen(52, -26, 86, 26, 4), { kapali: true, dolgu: '#6f695f', kalinlik: 2.4, tohum: 524 });
  }
  const cekG = el(K.svg, 'g');
  cizgi(cekG, dikdortgen(-12, -12, EN + 12, DER + 12, 5), { kapali: true, dolgu: '#b5b1aa', kalinlik: 2.6, genlik: 0.7, tohum: 501, kay: [1.5, 1.5] });
  cizgi(cekG, dikdortgen(0, 0, EN, DER, 2), { kapali: true, dolgu: ZEMIN, kalinlik: 2, genlik: 0.5, tohum: 502, kay: [0, 0] });
  // tabanda hafif ahşap lifi (çok açık): yüzey boş kâğıt gibi durmasın
  [[40, 64, 150], [210, 104, 120], [70, 168, 110], [250, 214, 125], [120, 262, 90]].forEach(([x, y, L0], i) =>
    cizgi(cekG, [[x, y], [x + L0 * 0.35, y + 2.5], [x + L0 * 0.7, y - 1.5], [x + L0, y + 1.5]], { kalinlik: 1, renk: '#d9d3c8', genlik: 0.4, tohum: 506 + i }));
  // 3B tuval: tam iç taban (u 0..EN, 0..DER); parçalar, gölgeleri ve konturları bu dikdörtgenin dışına çizilemez
  const RES = 1.5;
  const tuval = document.createElement('canvas');
  Object.assign(tuval.style, { position: 'absolute', left: f1(OX) + 'px', top: f1(OY) + 'px', width: f1(EN * sig) + 'px', height: f1(DER * sig) + 'px', transformOrigin: '0 0' });
  K.div.appendChild(tuval);
  const KU = svgYap(K.div);                                   // üst svg: ön panel, dolabın üstü, ölçü, el, söz balonu
  // Ön panel, kulp ayakları ve kulp çubuğu (tutulurken çubuk elin 'araya' katmanında çizilir)
  const onG = el(KU, 'g');
  cizgi(onG, dikdortgen(-24, 312, EN + 24, 340, 4), { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.6, genlik: 0.7, tohum: 503, kay: [1.5, 1.5] });
  const KULP = { x0: 116, x1: 284, y0: 345, y1: 357 };
  for (const x of [130, 270]) cizgi(onG, dikdortgen(x - 5, 339, x + 5, 347, 2), { kapali: true, dolgu: '#6f695f', kalinlik: 1.8, genlik: 0.3, tohum: 504, kay: [0, 0] });
  const cubukG = el(onG, 'g');
  cizgi(cubukG, dikdortgen(KULP.x0, KULP.y0, KULP.x1, KULP.y1, 5), { kapali: true, dolgu: '#6f695f', kalinlik: 2.2, genlik: 0.4, tohum: 505, kay: [1, 1] });
  // Dolabın üstü (arka kenardan ön kenara; içerde kalan çekmeceyi örter), ön kenar şeridi, üç eşya
  const dolapUst = el(KU, 'g');
  cizgi(dolapUst, dikdortgen(OX - 40 * sig, OY + sig * -30, OX + (EN + 40) * sig, KB.YD, 0), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5, tohum: 506, kay: [0, 0] });
  cizgi(dolapUst, dikdortgen(OX - 40 * sig, KB.YD - 18, OX + (EN + 40) * sig, KB.YD, 0), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4, tohum: 507, kay: [0, 0] });
  {
    const ES = yer({ kupa: [350, 118], kalem: [64, 236, -16], defter: [222, 196, 5] }, { kupa: [318, 236], kalem: [104, 252, -20], defter: [168, 150, 4] });
    const kp = uG(dolapUst, ES.kupa[0], ES.kupa[1]);
    cizgi(kp, dikdortgen(36, -10, 62, 10, 8), { kapali: true, dolgu: '#e2ddd3', kalinlik: 2.2, genlik: 0.3, tohum: 531, kay: [1.5, 1.5] });
    cizgi(kp, oval(0, 0, 40, 40, 0, 360, 18, 2), { kapali: true, dolgu: '#ece8e0', kalinlik: 2.4, genlik: 0.3, tohum: 532, kay: [2, 2] });
    cizgi(kp, oval(0, 0, 31, 31, 0, 360, 16, 2), { kapali: true, dolgu: '#6f695f', kalinlik: 1.8, genlik: 0.25, tohum: 533, kay: [0, 0] });
    cizgi(kp, oval(-8, -9, 9, 5, 200, 320, 6), { kalinlik: 1.6, renk: '#ece8e0', genlik: 0.2, tohum: 534 });
    const kl = uG(dolapUst, ES.kalem[0], ES.kalem[1], ES.kalem[2]);
    cizgi(kl, [[-70, -5], [52, -5], [72, 0], [52, 5], [-70, 5]], { kapali: true, dolgu: '#d8d2c7', kalinlik: 1.8, genlik: 0.25, tohum: 535, kay: [1.2, 1.2] });
    cizgi(kl, dikdortgen(-82, -5, -70, 5, 2), { kapali: true, dolgu: '#a59e91', kalinlik: 1.6, genlik: 0.2, tohum: 536, kay: [0, 0] });
    cizgi(kl, [[52, -5], [52, 5]], { kalinlik: 1.4, genlik: 0.2, tohum: 537 });
    const df = uG(dolapUst, ES.defter[0], ES.defter[1], ES.defter[2]);
    cizgi(df, dikdortgen(-58, -42, 58, 42, 2), { kapali: true, dolgu: '#f4f1ea', kalinlik: 2, genlik: 0.3, tohum: 538, kay: [1.5, 1.5] });
    [-22, -8, 6, 20].forEach((yy, i) => cizgi(df, [[-42, yy], [[24, 36, 10, 30][i], yy + (i % 2 ? 1 : -1)]], { kalinlik: 1.4, renk: '#8d867a', genlik: 0.5, tohum: 540 + i }));
  }
  el(KU, 'rect', { x: OX - 40 * sig, y: KB.YD, width: (EN + 80) * sig, height: 12, fill: MUR, opacity: 0.08 });
  const olcuG = el(KU, 'g');
  const elG = el(KU, 'g');
  const cekCiz = (f) => {
    const t = `translate(${f2(OX)} ${f2(OY + sig * Dd(f))}) scale(${sig})`;
    cekG.setAttribute('transform', t); onG.setAttribute('transform', t);
    tuval.style.transform = `translate(0px, ${f2(sig * Dd(f))}px)`;
  };

  // ---------- Fizik (önceden, tohumlu) ve taşma denetimi
  const FS0 = 880, FS1 = 1010;
  const PR = parcalarKur(5207);
  const POZ0 = PR.map((b) => [b.x, b.y, b.th, b.phi]);
  const KAYIT = fizikKos(PR, Dd, FS0, FS1);
  {
    let tasma = -Infinity, pay = Infinity, kare = null, parca = null;
    for (let i = 0; i < PR.length; i++) for (let j = 0; j <= FS1 - FS0; j++) {
      const a = KAYIT[i].subarray(j * 4, j * 4 + 4);
      for (const [x, y] of koseler(PR[i], a[0], a[1], a[2])) {
        const t = Math.max(-x, -y, x - EN, y - DER), m = Math.min(x, y, EN - x, DER - y);
        if (t > tasma) { tasma = t; kare = FS0 + j; parca = i; }
        pay = Math.min(pay, m);
      }
    }
    // hareket özeti: yer değiştirme, yol, yalpa, yuvarlanma (vida dönüş sayısı)
    const n = FS1 - FS0;
    const ozet = PR.map((b, i) => {
      const A = KAYIT[i];
      let yolu = 0, yalpa = 0;
      for (let j = 1; j <= n; j++) { yolu += Math.hypot(A[j * 4] - A[j * 4 - 4], A[j * 4 + 1] - A[j * 4 - 3]); yalpa += Math.abs(A[j * 4 + 2] - A[j * 4 - 2]); }
      return { yer: Math.hypot(A[n * 4] - A[0], A[n * 4 + 1] - A[1]), yolu, yalpa: yalpa / D2R, tur: b.tur === 'vida' ? Math.abs(A[n * 4 + 3] - A[3]) / (2 * Math.PI) : 0 };
    });
    const ort = (a) => +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1);
    Object.assign(denetim, { tasma: +Math.max(0, tasma).toFixed(3), enAzPay: +pay.toFixed(2), kare, parca, adet: PR.length,
      ortYer: ort(ozet.map((o) => o.yer)), ortYol: ort(ozet.map((o) => o.yolu)), enYol: +Math.max(...ozet.map((o) => o.yolu)).toFixed(1),
      ortYalpa: ort(ozet.map((o) => o.yalpa)), ortTur: ort(ozet.filter((o, i) => PR[i].tur === 'vida').map((o) => o.tur)),
      duran: ozet.filter((o) => o.yolu < 8).length });
    if (tasma > 0) console.error(`s2-atolye: parça ${parca} k${kare}'de iç tabandan ${tasma.toFixed(2)} mm taşıyor`);
  }
  const pozAl = (i, f) => {
    if (f <= FS0) return POZ0[i];
    const j = Math.min(FS1, f) - FS0;
    return KAYIT[i].subarray(j * 4, j * 4 + 4);
  };

  // ---------- 3B: ortografik üstten kamera (çekmece-yerel mm; three Y = −u y), toon gölge, ters kabuk mürekkep kontur,
  // tabana düşen düz gölge. Diş: eğik çizgili doku (yuvarlanınca çizgiler eksen boyunca kayar), altıgen baş düz yüzlü.
  const UC = (() => {
    const renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(EN * sig * RES), Math.round(DER * sig * RES), false);
    renderer.setClearColor(0x000000, 0);
    const sahne = new THREE.Scene();
    const kam = new THREE.OrthographicCamera(0, EN, 0, -DER, 1, 1000);
    kam.position.set(0, 0, 500);
    sahne.add(new THREE.AmbientLight(0xffffff, 1.9));
    const gun = new THREE.DirectionalLight(0xffffff, 2.3);
    gun.position.set(-160, 220, 300);
    sahne.add(gun);
    const gm = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    gm.minFilter = gm.magFilter = THREE.NearestFilter; gm.needsUpdate = true;
    // diş dokusu: bir karo = bir tur (köşegen çizgi karodan karoya sürer)
    const dc = document.createElement('canvas'); dc.width = 32; dc.height = 64;
    const cx2 = dc.getContext('2d');
    cx2.fillStyle = '#ffffff'; cx2.fillRect(0, 0, 32, 64);
    cx2.strokeStyle = '#6f695f'; cx2.lineWidth = 10;
    for (const o of [-64, 0, 64]) { cx2.beginPath(); cx2.moveTo(-8, 64 + 8 + o); cx2.lineTo(40, -8 + o + 4); cx2.stroke(); }
    const dis = new THREE.CanvasTexture(dc);
    dis.colorSpace = THREE.SRGBColorSpace; dis.wrapS = dis.wrapT = THREE.RepeatWrapping;
    const ton = (renk, ek = {}) => new THREE.MeshToonMaterial({ color: renk, gradientMap: gm, ...ek });
    const mGovde = ton('#aaa396', { map: dis }), mUc = ton('#aaa396'), mBas = ton('#8d867a', { flatShading: true });
    const mYuv = ton('#8d867a'), mSomun = ton('#837c71', { flatShading: true }), mPul = ton('#b3ada1', { flatShading: true });
    const KAL = 1.3;
    const mKontur = new THREE.ShaderMaterial({
      uniforms: { kal: { value: KAL }, renk: { value: new THREE.Vector3(0x1d / 255, 0x1d / 255, 0x20 / 255) } },
      vertexShader: 'uniform float kal; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * kal, 1.0); }',
      fragmentShader: 'uniform vec3 renk; void main() { gl_FragColor = vec4(renk, 1.0); }',
      side: THREE.BackSide,
    });
    const mGolge = new THREE.MeshBasicMaterial({ color: MUR, transparent: true, opacity: 0.16, depthWrite: false });
    const kabuk = (geo) => { const g = geo.clone(); g.deleteAttribute('uv'); g.deleteAttribute('normal'); const m = mergeVertices(g, 1e-3); m.computeVertexNormals(); return m; };
    const eksenX = (geo) => geo.rotateZ(-Math.PI / 2);   // silindir ekseni Y → X (+X ucu)
    const ogeler = [];
    PR.forEach((b) => {
      const kok = new THREE.Group(), yaw = new THREE.Group(), roll = new THREE.Group(), golgeYaw = new THREE.Group();
      const parcalar = [];                                  // [geometri, malzeme]
      let zc = 0;
      if (b.tur === 'vida') {
        zc = b.rh * 0.94;
        const Ls = b.L - b.hh - b.uc, turlar = Ls / 3.6;
        const govde = eksenX(new THREE.CylinderGeometry(b.rs, b.rs, Ls, 18, 1, true));
        const uv = govde.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * turlar);
        govde.translate(-b.L / 2 + b.hh + Ls / 2, 0, 0);
        const uc = eksenX(new THREE.ConeGeometry(b.rs, b.uc, 18)); uc.translate(b.L / 2 - b.uc / 2, 0, 0);
        const bas = b.bas === 'alti' ? eksenX(new THREE.CylinderGeometry(b.rh, b.rh, b.hh, 6)) : eksenX(new THREE.CylinderGeometry(b.rh * 0.78, b.rh, b.hh, 20));
        bas.translate(-b.L / 2 + b.hh / 2, 0, 0);
        parcalar.push([govde, mGovde], [uc, mUc], [bas, b.bas === 'alti' ? mBas : mYuv]);
      } else {
        const sekil = new THREE.Shape(), del = new THREE.Path();
        if (b.tur === 'somun') for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; sekil[i ? 'lineTo' : 'moveTo'](b.rk * 0.94 * Math.cos(a), b.rk * 0.94 * Math.sin(a)); }
        else sekil.absarc(0, 0, b.Rp - 0.35, 0, Math.PI * 2, false);
        del.absarc(0, 0, b.del, 0, Math.PI * 2, true);
        sekil.holes.push(del);
        const kal = b.tur === 'somun' ? b.kal - 0.8 : Math.max(0.5, b.kal - 0.6);
        const geo = new THREE.ExtrudeGeometry(sekil, { depth: kal, bevelEnabled: true, bevelThickness: 0.4, bevelSize: b.tur === 'somun' ? 0.45 : 0.35, bevelSegments: 1, curveSegments: 20 });
        parcalar.push([geo, b.tur === 'somun' ? mSomun : mPul]);
      }
      for (const [geo, mal] of parcalar) {
        roll.add(new THREE.Mesh(geo, mal));
        const kb = kabuk(geo);
        roll.add(new THREE.Mesh(kb, mKontur));
        const gl = new THREE.Mesh(kb, mGolge); gl.scale.z = 0.002; gl.renderOrder = -1;
        golgeYaw.add(gl);
      }
      roll.position.z = zc;
      yaw.add(roll); kok.add(yaw);
      const golgeKok = new THREE.Group(); golgeKok.position.set(1.7, -2.1, 0.05); golgeKok.add(golgeYaw);
      sahne.add(kok); sahne.add(golgeKok);
      ogeler.push({ kok, yaw, roll, golgeKok, golgeYaw });
    });
    const KAYN = [1, 0.86, 1.14, 0.95];
    let sonCiz = null;
    return {
      ciz(f) {
        const anah = `${f}|${kay}`;
        if (anah === sonCiz) return;
        sonCiz = anah;
        mKontur.uniforms.kal.value = KAL * KAYN[((kay % 4) + 4) % 4];
        ogeler.forEach((o, i) => {
          const [x, y, th, phi] = pozAl(i, f);
          o.kok.position.set(x, -y, 0); o.golgeKok.position.set(x + 1.7, -y - 2.1, 0.05);
          o.yaw.rotation.z = -th; o.golgeYaw.rotation.z = -th;
          o.roll.rotation.x = PR[i].tur === 'vida' ? -phi : 0;
        });
        renderer.render(sahne, kam);
      },
    };
  })();

  // ---------- El (üstten; etli el, elEtli): uzanır, kulpu sarar, hazırlık, çekiş (çekmeceyle birlikte), tutar, bırakır, çekilir.
  // El boyu gerçek ölçüde (~18 cm × σ): eski el kulba göre küçük ve ince kalıyordu.
  const elBoy = yer(350, 380);
  const kulpU = [KB.kx, (KULP.y0 + KULP.y1) / 2];
  const G0 = (f) => ekranK(kulpU[0], kulpU[1], f);
  const elDur = (f) => {
    const o = { boy: elBoy, kivrim: 0.1, aci: -72, cubuk: false };
    const g = G0(f);
    if (f < 872) {
      // uzanış: alttan, yavaş (KM); sona doğru açık el kulpun hemen önünde (parmaklar kulpun üstüne gelecek)
      const t = KMf(sinir((f - 840) / 32, 0, 1)), bas = [g[0] - yer(250, 220), g[1] + yer(640, 980)], on = [g[0] - 6, g[1] + 30];
      o.m = [lerp(bas[0], on[0], t), lerp(bas[1], on[1], t)];
      o.aci = lerp(-54, -70, t);
    } else if (f < 884) {
      // sarma (12 fps): 872 parmaklar kulpun üstünde, kıvrılmaya başlar; 877 kulpu sarar, el hafif aşağı oturur
      o.cubuk = true;
      o.m = f < 877 ? [g[0] - 2, g[1] + 8] : [g[0], g[1]];
      o.aci = f < 877 ? -71 : -72;
      o.kivrim = f < 877 ? 0.45 : 1;
      o.boy = elBoy * (f < 877 ? 1.01 : 0.985);
    } else if (f < 962) {
      // hazırlık (884–892: çekmece 5 mm içeri, bilek sıkılır), çekiş ve tutuş: el kulpa kilitli
      o.cubuk = true; o.kivrim = 1; o.m = g;
      const ce = sinir((f - 892) / 30, 0, 1);
      o.aci = -72 - 6 * Math.sin(ce * Math.PI * 0.5) + (f >= 922 ? 2 * Math.exp(-(f - 922) / 6) : 0);
      o.boy = elBoy * (f < 892 ? 0.975 : 0.985 + 0.03 * ce);
    } else {
      // bırakır (962: parmaklar açılır, 967 açık), çekilir (966–990, Eİ)
      const t = EIf(sinir((f - 966) / 24, 0, 1));
      o.kivrim = f < 967 ? 0.5 : 0.12;
      o.m = [g[0] - 4 - yer(170, 150) * t, g[1] + 10 + yer(700, 1040) * t];
      o.aci = -76 + 18 * t; o.boy = elBoy * 1.015;
    }
    return o;
  };
  const cubukDizge = (f) => {
    const s = kalem(505, kay, 0.5), [a0, b0] = ekranK(KULP.x0, KULP.y0, f), [a1, b1] = ekranK(KULP.x1, KULP.y1, f);
    const d = yol(dikdortgen(a0, b0, a1, b1, 5 * sig), true, s);
    return `<path d="${d}" fill="#6f695f" transform="translate(2 2)"/><path d="${d}" fill="none" stroke="${MUR}" stroke-width="${f1(2.2 * sig)}" stroke-linejoin="round"/>`;
  };
  tl.set(cubukG, { autoAlpha: 1 }, k(840));
  tl.set(cubukG, { autoAlpha: 0 }, k(872));
  tl.set(cubukG, { autoAlpha: 1 }, k(962));
  let sonEl = '';
  function kusCiz(f) {
    cekCiz(f);
    UC.ciz(f);
    if (f >= 990) { if (sonEl) { elG.innerHTML = ''; sonEl = ''; } return; }
    const e = elDur(f);
    // kulpun yakın kenarının ötesi: parmaklar burada kulpun üstüne biner
    const kulpAlt = ekranK(KULP.x0, KULP.y1, f)[1] + 4;
    const dz = elEtli({
      merkez: e.m, aci: e.aci, boy: e.boy, kivrim: e.kivrim, ten: MONO.ten[P.B.ten], giysi: MONO.giysi[P.B.giysi],
      kaynama: kay, tohum: 7, kolUzun: yer(1000, 1400), araya: e.cubuk ? cubukDizge(f) : '',
      ustBolge: [[-3000, -3000], [6000, -3000], [6000, kulpAlt], [-3000, kulpAlt]], w: 5,
    });
    if (dz !== sonEl) { elG.innerHTML = dz; sonEl = dz; }
  }
  // Kamera: dolabın üstü (kulp alt üçte birde) → çekişle birlikte aşağı eğilir → açık çekmeceye yavaş itiş
  const gY0 = ekranK(kulpU[0], kulpU[1], 840)[1];
  const K8a = yer(odak(960, gY0, 1, 960, 700), odak(540, gY0, 1.08, 540, 1240));
  const K8 = { x: 0, y: 0, scale: 1 };
  const icMerkez = ekranK(EN / 2, DER / 2, 1000);
  kameraKoy(840, K8a);
  kameraGit(840, 44, it(K8a, 1.012, G0(840)), 'none');
  kameraGit(888, 44, K8, E.KM);
  kameraGit(932, 239, it(K8, 1.035, icMerkez), 'none');

  // ---------- Ölçü (vurgu): iç en ve iç boy, kesik çizgi parça parça ("pıt pıt"), uçlarda dayanak çizgileri, el yazısı ölçüler
  const OLC = { yA: 14, xA: 14, parca: 30, bosluk: 20 };
  const olcuParca = [];
  const ekranS = (x, y) => ekranK(x, y, 1100);
  const kesik = (a, b, n, tohum, k0, ara = 4) => {
    // a → b doğrusu boyunca n parça; her parça 'tik' ile belirir (BO); kâğıt rengi hale altta
    const L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L0, uy = (b[1] - a[1]) / L0;
    const top = n * OLC.parca + (n - 1) * OLC.bosluk, bas = (L0 - top) / 2;
    for (let i = 0; i < n; i++) {
      const s0 = bas + i * (OLC.parca + OLC.bosluk), s1 = s0 + OLC.parca;
      const p0 = ekranS(a[0] + ux * s0, a[1] + uy * s0), p1 = ekranS(a[0] + ux * s1, a[1] + uy * s1);
      const g = el(olcuG, 'g');
      el(g, 'path', { d: `M${f1(p0[0])} ${f1(p0[1])}L${f1(p1[0])} ${f1(p1[1])}`, stroke: ZEMIN, 'stroke-width': 12, 'stroke-linecap': 'round', fill: 'none', opacity: 0.9 });
      cizgi(g, [p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], p1], { kalinlik: 5, renk: VURGU, genlik: 0.4, tohum: tohum + i });
      const kk = k0 + i * ara;
      gsap.set(g, { autoAlpha: 0, scale: 0.2, svgOrigin: `${f1((p0[0] + p1[0]) / 2)} ${f1((p0[1] + p1[1]) / 2)}` });
      tl.set(g, { autoAlpha: 0, scale: 0.2 }, k(840));
      tl.fromTo(g, { autoAlpha: 1, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: k(5), ease: E.BO, immediateRender: false }, k(kk));
      isaret(kk, 'tik', { ad: 'ölçü pıt' });
      olcuParca.push(g);
    }
  };
  const dayanak = (p, yon, tohum, k0) => {
    // duvardaki kısa dik çizgi (ölçünün başı/sonu)
    const [x, y] = p, q0 = yon === 'y' ? ekranS(x, y - 9) : ekranS(x - 9, y), q1 = yon === 'y' ? ekranS(x, y + 9) : ekranS(x + 9, y);
    const g = el(olcuG, 'g');
    cizgi(g, [q0, q1], { kalinlik: 4.5, renk: VURGU, genlik: 0.3, tohum });
    yalnizArada(g, k0, 1172);
    return g;
  };
  const OLCU_EN = 990, OLCU_BOY = 1030;
  dayanak([0.8, OLC.yA], 'y', 561, OLCU_EN - 2); dayanak([EN - 0.8, OLC.yA], 'y', 562, OLCU_EN - 2);
  kesik([0, OLC.yA], [EN, OLC.yA], 8, 570, OLCU_EN);
  dayanak([OLC.xA, 0.8], 'x', 563, OLCU_BOY - 2); dayanak([OLC.xA, DER - 0.8], 'x', 564, OLCU_BOY - 2);
  kesik([OLC.xA, 0], [OLC.xA, DER], 6, 580, OLCU_BOY);
  const olcuYazi = (metinS, [x, y], k0, hiza = 'orta') => {
    const p = document.createElement('p');
    p.className = 'el-yazisi';
    p.textContent = metinS;
    const [sx, sy] = ekranS(x, y);
    Object.assign(p.style, { left: f1(sx) + 'px', top: f1(sy) + 'px', fontSize: Math.round(26 * sig) + 'px', color: VURGU_YAZI, textShadow: `0 0 6px ${ZEMIN}, 0 0 6px ${ZEMIN}, 0 0 3px ${ZEMIN}` });
    K.div.appendChild(p);
    gsap.set(p, { xPercent: hiza === 'orta' ? -50 : 0, yPercent: -50, autoAlpha: 0, scale: 0.4, transformOrigin: '50% 60%' });
    tl.set(p, { autoAlpha: 0, scale: 0.4 }, k(840));
    tl.to(p, { autoAlpha: 1, scale: 1, duration: k(10), ease: E.BO }, k(k0));
    return p;
  };
  olcuYazi('40 cm', [EN / 2, OLC.yA + 19], OLCU_EN + 34);
  olcuYazi('30 cm', [OLC.xA + 12, 66], OLCU_BOY + 26, 'sol');
  isaret(OLCU_EN + 34, 'vurgu', { ad: 'ölçü 40 cm' });
  isaret(OLCU_BOY + 26, 'vurgu', { ad: 'ölçü 30 cm' });

  // B'nin sözü (kuş bakışında; kuyruk kadraj altına, B'ye)
  const SB = yer({ x: 1424, y: 640, boyut: 44, uc: [1260, 1180] }, { x: 150, y: 1430, boyut: 56, uc: [470, 2080] });
  const sozK = soz(KU, K.div, t2(['Bir organizer alsam…', 'buraya sığar mı?'], ['If I bought an organizer…', 'would it fit in here?']),
    { x: SB.x, y: SB.y, boyut: SB.boyut, tohum: 81, kuyruk: () => SB.uc, uzun: 140 });
  sozK.ac(1052, [[1056, 14], [1072, 14]]);
  sozK.kapat(1164, 8);

  // =====================================================================================================
  // #9 (k1172–1355): B'nin yüzü ve açık çekmece; düşünce balonunda organizer YALNIZ AKILLA biçimlenir (kullanıcı 2026-10-22:
  // "parmağıyla düzeltmesin, sadece aklıyla yukarı baksın, yukarıda düzenleme olsun"). B'nin gerçek kolu kalkmaz: gözleri
  // balonda, kaşları odaklı ('kararli'). Tutamaçlar kendiliğinden işler: çekmecenin ölçüsü (kesik vurgu çerçevesi, 40 × 30
  // oranı) belirir; iki yan kenar birlikte içe daralır (incelir), üst ve alt kenar birlikte uzar, bölmeler yeniden dağılır
  // (orta yatay bölme boydan boya: altı göz), organizer ölçüye oturur ('tik': çerçeve dolar, söner). Organizer bir ürün:
  // URUN_RENK nane dolgu, gözlerin tabanı açık nane; kontur mürekkep. Kişiler, mekân, çekmece mono kalır.
  // =====================================================================================================
  const s9 = Y.k9.s;
  const K9 = odak(bGozSon[0], bGozSon[1], s9, Y.k9.ekran[0], Y.k9.ekran[1]);
  const D9 = (sx, sy) => cev(K9, [sx, sy]);
  kameraKoy(1172, K9);
  kameraGit(1172, 183, it(K9, 1.03, D9(...yer([900, 520], [540, 900]))), 'none');
  // Bakış balona (insan.js göz bebeği kayması küçük: okunsun diye ~3 kat verilir)
  const BAK = yer([3, -2.4], [1.6, -3]);
  tl.call(() => B.poz({ bol: false, kol: null, ifade: 'merak', bakis: [BAK[0] * 0.6, BAK[1] * 0.5] }), null, k(1172));
  poz(B, adim(1180), { ifade: 'merak', bakis: BAK });
  poz(B, adim(1200), { ifade: 'kararli', bakis: BAK });
  poz(B, adim(1250), { ifade: 'kararli', bakis: [BAK[0], BAK[1] * 1.15] });
  poz(B, adim(1296), { ifade: 'merak', bakis: BAK });

  // Düşünce balonu (ekrandaki yerinden dünyaya)
  const BY = yer({ c: [1262, 334], r: [474, 214], dots: [[664, 300, 9], [700, 268, 13], [746, 236, 17]], koken: '6% 70%' },
    { c: [560, 680], r: [450, 300], dots: [[520, 1050, 10], [560, 1014, 14], [610, 978, 18]], koken: '30% 98%' });
  const bal = balon(gOrta, { c: D9(...BY.c), r: [BY.r[0] / s9, BY.r[1] / s9], noktalar: BY.dots.map(([x, y, r]) => [...D9(x, y), r / s9]), tohum: 91, koken: BY.koken });
  bal.ac(1174, { hizli: true });

  // Organizer (cizimler.js 'organizer', üstten bölmeli): merkez sabit, en ve boy tutamaçlarla değişir; konturlar köşelerinden
  // yeniden kurulur (kalınlık sabit kalır). og.b: bölme dağılımı (0 cizimler.js, 1 yeni dağılım BOLME_B)
  const OB = yer({ c: [1030, 372], W0: 334, H0: 156, W1: 280, H1: 210 }, { c: [560, 786], W0: 420, H0: 150, W1: 336, H1: 252 });
  const [ocx, ocy] = D9(...OB.c);
  const og = { w: OB.W0 / s9, h: OB.H0 / s9, b: 0 };
  const u9 = (v) => v / s9 * 1.9;                              // ekran ölçüsü (×1,9 px) → dünya
  const SW = u9(3.6), DUVAR = u9(5.2);
  const BOLME_B = {
    1: [[-0.17, -0.3], [-0.17, 0.3]], 2: [[0.17, -0.3], [0.17, 0.3]], 3: [[-0.46, 0.02], [0.46, 0.02]],
    4: [[-0.4, -0.2], [-0.27, -0.12]], 5: [[0.27, 0.13], [0.4, 0.2]],
  };
  const TABAN = '#e1f3e9';                                       // gözlerin dibi: nanenin açığı
  const orgNokta = ([u, v], w = og.w, h = og.h) => [ocx + u / 0.92 * w, ocy + v / 0.6 * h];
  const konturNok = (kt, i) => (BOLME_B[i] ? kt.p.map((p, j) => [lerp(p[0], BOLME_B[i][j][0], og.b), lerp(p[1], BOLME_B[i][j][1], og.b)]) : kt.p);
  const orgG = el(gOrta, 'g');
  const ORG = CIZIMLER.organizer;
  const orgH = [cizgi(orgG, [[0, 0], [1, 1]], { kapali: true, kalinlik: SW, tohum: 940, genlik: 1, dolgu: URUN_RENK[ORG[0].r], kay: [1.5 / s9, 1.5 / s9] })];
  const tabanG = el(orgG, 'g');
  const taban = el(tabanG, 'path', { fill: TABAN });
  const duvarlar = [1, 2, 3].map(() => el(tabanG, 'path', { fill: 'none', stroke: URUN_RENK[ORG[0].r], 'stroke-width': f2(DUVAR), 'stroke-linecap': 'butt' }));
  ORG.slice(1).forEach((kt, j) => orgH.push(cizgi(orgG, [[0, 0], [1, 1]], { kapali: !!kt.kapali, kalinlik: SW, tohum: 941 + j, genlik: 1, dolgu: null })));
  // Tutamaçlar (vurgu; v5 dili): kenar ortasında kare çapa + kenar boyunca iki kol ve uçlarında halka; dışında hareket okları
  const tutG = el(gOrta, 'g');
  const DIS = { sag: [1, 0], sol: [-1, 0], ust: [0, -1], alt: [0, 1] };
  const TUT = ['sag', 'ust', 'sol', 'alt'].map((ad) => {
    const dis = el(tutG, 'g'), icG = el(dis, 'g'), dik = ad === 'sag' || ad === 'sol';
    const kol = u9(28), rr = u9(4.2), kw = u9(1.7), kare = u9(9);
    for (const yon of [-1, 1]) {
      const [ex, ey] = dik ? [0, yon * kol] : [yon * kol, 0];
      el(icG, 'line', { x1: 0, y1: 0, x2: f2(ex), y2: f2(ey), stroke: VURGU, 'stroke-width': f2(kw), 'stroke-linecap': 'round' });
      el(icG, 'circle', { cx: f2(ex), cy: f2(ey), r: f2(rr), fill: BALON, stroke: VURGU, 'stroke-width': f2(kw) });
    }
    el(icG, 'rect', { x: f2(-kare / 2), y: f2(-kare / 2), width: f2(kare), height: f2(kare), fill: VURGU, stroke: MUR, 'stroke-width': f2(kw * 0.7) });
    // ok: kenarın dışında iki köşeli ok (yerel +x yönüne bakar; döndürülür)
    const okG = el(dis, 'g'), okIc = el(okG, 'g');
    for (const x of [0, u9(9)]) el(okIc, 'path', { d: `M${f2(x - u9(5))} ${f2(-u9(7))}L${f2(x + u9(2))} 0L${f2(x - u9(5))} ${f2(u9(7))}`, fill: 'none', stroke: VURGU, 'stroke-width': f2(u9(2.4)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    return { ad, dis, icG, okG, okIc, st: { s: 0 }, ok: { s: 0, yon: 1 } };
  });
  const tutBul = (ad) => TUT.find((t) => t.ad === ad);
  const halkalar = [0, 1].map(() => ({ e: el(tutG, 'circle', { r: f2(u9(16)), fill: 'none', stroke: VURGU, 'stroke-width': f2(u9(2.4)), opacity: 0 }), st: { s: 0, ad: 'sag' } }));
  const tutYer = (ad) => [ocx + DIS[ad][0] * og.w / 2, ocy + DIS[ad][1] * og.h / 2];
  const hayalet = el(orgG, 'path', { fill: 'none', stroke: MUR, 'stroke-width': f2(SW * 0.9), 'stroke-linejoin': 'round', opacity: 0 });
  const yolD = (pts) => yol(pts, false, SIFIR);
  function orgUygula() {
    ORG.forEach((kt, i) => {
      const pts = konturNok(kt, i).map((p) => orgNokta(p));
      orgH[i].pts = kt.kapali ? yogun(pts, u9(6)) : pts;
      orgH[i].ciz();
    });
    // taban: duvar payı kadar içeride; bölme duvarları kendi çizgilerinin altında
    const ix = og.w / 2 - DUVAR * 0.62, iy = og.h / 2 - DUVAR * 0.62;
    taban.setAttribute('d', yol(yogun([[ocx - ix, ocy - iy], [ocx + ix, ocy - iy], [ocx + ix, ocy + iy], [ocx - ix, ocy + iy]], u9(10)), true, SIFIR));
    [1, 2, 3].forEach((i, j) => duvarlar[j].setAttribute('d', yolD(konturNok(ORG[i], i).map((p) => orgNokta(p)))));
    for (const t of TUT) {
      const [x, y] = tutYer(t.ad), [nx, ny] = DIS[t.ad];
      t.dis.setAttribute('transform', `translate(${f2(x)} ${f2(y)})`);
      t.icG.setAttribute('transform', `scale(${f3(t.st.s)})`);
      t.icG.style.opacity = t.st.s > 0.01 ? 1 : 0;
      // ok kenarın dışında (tutamak kolunun ötesinde); yon −1 içe (iter), +1 dışa (çeker)
      const aci = Math.atan2(ny * t.ok.yon, nx * t.ok.yon) / D2R, uz = u9(20) + u9(4) * (1 - t.ok.s);
      t.okG.setAttribute('transform', `translate(${f2(nx * uz)} ${f2(ny * uz)}) rotate(${f2(aci)})`);
      t.okIc.setAttribute('transform', `translate(${f2(t.ok.yon < 0 ? -u9(9) : 0)} 0) scale(${f3(Math.max(0.001, t.ok.s))})`);
      t.okG.style.opacity = t.ok.s > 0.01 ? Math.min(1, t.ok.s * 1.4) : 0;
    }
    for (const h of halkalar) {
      const [hx, hy] = tutYer(h.st.ad);
      h.e.setAttribute('transform', `translate(${f2(hx)} ${f2(hy)}) scale(${f3(h.st.s)})`);
      h.e.setAttribute('opacity', h.st.s > 0.01 ? 1 : 0);
    }
  }
  orgUygula();
  yalnizArada(orgG, 1172); yalnizArada(tutG, 1172);
  const orgYol = orgH.map((h) => h.yol), orgDolgu = [...orgH.filter((h) => h.dolgu).map((h) => h.dolgu), tabanG];
  tl.set(orgYol, { drawSVG: '0%' }, k(BAS));
  tl.set(orgDolgu, { autoAlpha: 0 }, k(BAS));
  tl.set(og, { w: OB.W0 / s9, h: OB.H0 / s9, b: 0, onComplete: orgUygula }, k(1172));
  tl.fromTo(orgYol[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: k(10), ease: E.EO, immediateRender: false }, k(1184));
  tl.fromTo(orgYol.slice(1), { drawSVG: '0%' }, { drawSVG: '100%', duration: k(6), ease: E.EO, stagger: k(2), immediateRender: false }, k(1190));
  tl.set(orgYol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(1206));
  tl.to(orgDolgu, { autoAlpha: 1, duration: k(6), ease: 'none' }, k(1192));
  TUT.forEach((t, i) => {
    tl.set(t.st, { s: 0, onComplete: orgUygula }, k(1172));
    tl.set(t.ok, { s: 0, onComplete: orgUygula }, k(1172));
    tl.to(t.st, { s: 1, duration: k(8), ease: E.BO, onUpdate: orgUygula }, k(1196 + i * 3));
  });

  // Ölçü çerçevesi (çekmecenin iç ölçüsü, 4:3; son biçimin biraz dışında): kesik vurgu çizgisi, parça parça belirir
  const PAY9 = u9(5);
  const hx0 = OB.W1 / s9 / 2 + PAY9, hy0 = OB.H1 / s9 / 2 + PAY9;
  const hedefG = el(gOrta, 'g');
  gOrta.insertBefore(hedefG, tutG);                              // çerçeve organizerin üstünde, tutamaçların altında
  const kesikler = [];
  {
    const kose = [[ocx - hx0, ocy - hy0], [ocx + hx0, ocy - hy0], [ocx + hx0, ocy + hy0], [ocx - hx0, ocy + hy0]];
    const parca = u9(9), bosluk = u9(6);
    kose.forEach((a, i) => {
      const b = kose[(i + 1) % 4], L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor((L0 + bosluk) / (parca + bosluk));
      const ux = (b[0] - a[0]) / L0, uy = (b[1] - a[1]) / L0, bas = (L0 - (n * parca + (n - 1) * bosluk)) / 2;
      for (let j = 0; j < n; j++) {
        const s0 = bas + j * (parca + bosluk), s1 = s0 + parca;
        const e = el(hedefG, 'line', { x1: f2(a[0] + ux * s0), y1: f2(a[1] + uy * s0), x2: f2(a[0] + ux * s1), y2: f2(a[1] + uy * s1), stroke: VURGU, 'stroke-width': f2(u9(2.4)), 'stroke-linecap': 'round' });
        kesikler.push(e);
      }
    });
  }
  // oturunca: kesik çerçeve düz çizgiye döner (aynı yerde), sonra söner
  const hedefDuz = el(hedefG, 'path', { d: yol(yogun([[ocx - hx0, ocy - hy0], [ocx + hx0, ocy - hy0], [ocx + hx0, ocy + hy0], [ocx - hx0, ocy + hy0]], u9(12)), true, SIFIR), fill: 'none', stroke: VURGU, 'stroke-width': f2(u9(3)), 'stroke-linejoin': 'round' });
  const HEDEF = 1202, INC = [1216, 26], UZA = [1252, 26], BOLME = [1282, 14], OTUR = 1298;
  gsap.set(kesikler, { autoAlpha: 0 }); gsap.set(hedefDuz, { autoAlpha: 0 });
  tl.set(kesikler, { autoAlpha: 0 }, k(BAS));
  tl.set(hedefDuz, { autoAlpha: 0 }, k(BAS));
  tl.set(hedefG, { autoAlpha: 1 }, k(BAS));
  tl.to(kesikler, { autoAlpha: 1, duration: k(2), ease: 'none', stagger: k(12) / kesikler.length }, k(HEDEF));
  tl.set(kesikler, { autoAlpha: 0 }, k(OTUR));
  tl.fromTo(hedefDuz, { autoAlpha: 1, attr: { 'stroke-width': f2(u9(5)) } }, { autoAlpha: 1, attr: { 'stroke-width': f2(u9(3)) }, duration: k(6), ease: E.EO, immediateRender: false }, k(OTUR));
  tl.to(hedefDuz, { autoAlpha: 0, duration: k(12), ease: E.EI }, k(OTUR + 10));
  isaret(OTUR, 'tik', { ad: 'ölçüye oturur' });

  // Biçimlendirme: tutamaçlar kendiliğinden işler (halka: tutulan tutamak; ok: yönü). İki yan birlikte içe (inceltir),
  // üst ve alt birlikte dışa (uzatır); en hızlı karede 1 k hayalet kontur (leke)
  const leke = (kare, w, h) => {
    const pts = [[-0.46, -0.3], [0.46, -0.3], [0.46, 0.3], [-0.46, 0.3]].map((p) => orgNokta(p, w, h));
    tl.set(hayalet, { attr: { d: yol(yogun(pts, 8), true, SIFIR) }, opacity: 0.32 }, k(kare));
    tl.set(hayalet, { opacity: 0 }, k(kare + 1));
  };
  const tutan = (adlar, [k0, sure], yon) => {
    halkalar.forEach((h, i) => {
      tl.set(h.st, { ad: adlar[i], onComplete: orgUygula }, k(k0 - 8));
      tl.to(h.st, { s: 1, duration: k(6), ease: E.BO, onUpdate: orgUygula }, k(k0 - 5));
      tl.to(h.st, { s: 0, duration: k(5), ease: E.EI, onUpdate: orgUygula }, k(k0 + sure + 2));
    });
    for (const ad of adlar) {
      const t = tutBul(ad);
      tl.set(t.ok, { yon, onComplete: orgUygula }, k(k0 - 8));
      tl.to(t.ok, { s: 1, duration: k(6), ease: E.BO, onUpdate: orgUygula }, k(k0 - 3));
      tl.to(t.ok, { s: 0, duration: k(6), ease: E.EI, onUpdate: orgUygula }, k(k0 + sure - 4));
    }
  };
  tl.set(halkalar.map((h) => h.st), { s: 0, onComplete: orgUygula }, k(1172));
  tutan(['sol', 'sag'], INC, -1);
  tl.to(og, { w: OB.W1 / s9, duration: k(INC[1]), ease: E.KM, onUpdate: orgUygula }, k(INC[0]));
  leke(INC[0] + 12, lerp(OB.W0, OB.W1, 0.42) / s9, OB.H0 / s9);
  tutan(['ust', 'alt'], UZA, 1);
  tl.to(og, { h: OB.H1 / s9, duration: k(UZA[1]), ease: E.KM, onUpdate: orgUygula }, k(UZA[0]));
  leke(UZA[0] + 12, OB.W1 / s9, lerp(OB.H0, OB.H1, 0.42) / s9);
  // bölmeler yeniden dağılır (orta yatay bölme boydan boya uzar, dikey bölmeler aralanır), sonra ölçüye oturur (sekme)
  tl.to(og, { b: 1, duration: k(BOLME[1]), ease: E.EO, onUpdate: orgUygula }, k(BOLME[0]));
  isaret(BOLME[0], 'vurgu', { ad: 'bölmeler dağılır' });
  tl.fromTo(orgG, { scale: 1.035, svgOrigin: `${f2(ocx)} ${f2(ocy)}` }, { scale: 1, svgOrigin: `${f2(ocx)} ${f2(ocy)}`, duration: k(10), ease: E.BO, immediateRender: false }, k(OTUR));
  TUT.forEach((t, i) => tl.to(t.st, { s: 0, duration: k(10), ease: E.EI, onUpdate: orgUygula }, k(OTUR + 4 + i * 2)));

  // El yazısı (balonun içinde, organizerin yanında/üstünde): üç satır sırayla
  const NY = yer({ x: 1250, y: 250, boyut: 44 }, { x: 210, y: 450, boyut: 50 });
  const notP = (() => {
    const [x, y] = D9(NY.x, NY.y);
    const satirlar = t2(['Hazır almak yerine', 'kendim tasarlayabilsem', 'nasıl olur?'], ['Instead of buying one,', 'what if I could', 'design it myself?']);
    const p = document.createElement('p');
    p.className = 'el-yazisi';
    p.innerHTML = satirlar.map((s) => `<span style="display:block;line-height:1.18;padding-right:0.2em">${s}</span>`).join('');
    Object.assign(p.style, { left: f1(x) + 'px', top: f1(y) + 'px', fontSize: f2(NY.boyut / s9) + 'px', transform: 'rotate(-2deg)' });
    L.div.appendChild(p);
    const sp = Array.from(p.querySelectorAll('span'));
    gsap.set(p, { autoAlpha: 0 }); gsap.set(sp, { clipPath: 'inset(-30% 100% -30% 0%)' });
    tl.set(p, { autoAlpha: 0 }, k(BAS));
    tl.set(p, { autoAlpha: 1 }, k(1206));
    [[1208, 20], [1232, 16], [1250, 14]].forEach(([a, s], i) => tl.fromTo(sp[i], { clipPath: 'inset(-30% 100% -30% 0%)' }, { clipPath: 'inset(-30% 0% -30% 0%)', duration: k(s), ease: 'none', immediateRender: false }, k(a)));
    return p;
  })();
  void notP;

  // Düşüncelere dalar: büst yana eğilir (12 fps, iki adım; önden yalnız baş dönünce boyunda ek yeri görünüyordu), bakış uzakta
  const egil6 = B.iz.egil, egil9 = basamak([1172, 0], [1306, -1.6], [1311, -3.2]);
  B.iz.egil = (f) => (f >= 1172 ? egil9(f) : egil6(f));
  poz(B, 1306, { ifade: 'ozlem', bakis: [-1, -1] });

  // =====================================================================================================
  // Her kare: kişi dönüşümleri, söz kuyrukları, kuş bakışı (3B + el)
  // =====================================================================================================
  ctx.herKare((f) => {
    if (f < BAS || f > SON) return;
    if (icinde(f, BAS, 840) || f >= 1172) {
      for (const h of figurler) h.uygula(f);
      for (const s of sozler) if (s.kap.parentNode === L.div) s.guncelle(f);
    } else {
      kusCiz(f);
      sozK.guncelle(f);
    }
  });
  // İlk durum (kur anında): kişiler başlangıç dönüşümünde
  for (const h of figurler) h.uygula(BAS);
  for (const s of sozler) s.guncelle(BAS);
  kusCiz(840);
}
