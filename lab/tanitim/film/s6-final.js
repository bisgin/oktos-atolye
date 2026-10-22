// Sahne 6, FİNAL (#6.1–#6.3, k2352–2879). Kalıp: s5-kalabalik.js (kur(ctx), MUTLAK kare zamanları).
// DEVİR (kesme yok): s5'in son karesindeki (k2351) sekiz balon SON_BALONLAR'dan (s5-kalabalik.js) aynı yerde, aynı boyda,
// aynı bulutla (ctx.balon, aynı tohum) ve aynı çizgilerle (cizimKur, aynı çizim tohumu ve kalınlık) AÇIK hâlde kurulur.
// s5 katmanları k2352'de kapanır, bu katman açılır. Kamera odak(0,0,1) (dünya = ekran) ve sona dek sabit.
// #6.1 HASAT (k2352–2645): stil/logo2.js'teki inşa filme uyarlandı (biçim dönüşümü değil yapım; logo2.js'e dokunulmaz).
//   - Logo 29 dışbükey parça (stil/logo-veri.js); kenarlar aynı doğrudaki "çubuk"lara toplanır, çok uzun çubuk aynalı
//     çiftiyle T-eklemden bölünür. Çubuklar logo2 sırasıyla gelir: dıştan içe (köşe, yan, alt kancalar, çarpı, halka),
//     aynalı çiftler aynı karede; son parça halkanın içindeki küçük karo (kaynak noktaları vurgu renginde).
//   - Çizgiler CIZIMLER'in HAM köşe noktalarından çıkar: her köşeli kenar bir çizgi (cizimKur'un duz noktalarıyla ve aynı
//     kaynama tablosuyla: sönme anındaki takas görünmez), yumuşak kontur bir eğri (kapalıysa iki yarım).
//   - Balonlar AYNA ÇİFTİ hâlinde dört dalgada hasat edilir. Dalga pencereleri çubuk sırasını bölüşür; çiftlerin
//     pencerelere sırası bütün sıralamalar denenerek seçilir: maliyet = toplam yol + henüz sönmemiş balonun içinden geçen
//     ya da onun altına inen yol + dolmuş logo parçasının üstünden geçen yol + son dalga en üstteki çiftse ceza (logo2'de
//     halka yalnız yukarıdan yağıyordu). Yatayda halka yanlardaki çiftten kapanır; dikeyde halkanın yanındaki çift yan
//     kancaları kurmak için erken söner, halka üst köşelerden çapraz gelir.
//   - Atama: Macar algoritması; maliyet = yol + açı + boy oranı (2,2 katını aşan uzama ağır) + dalga penceresi dışı.
//     Kısa ayrıntılar (QR'ın küçük kareleri gibi) logoya gitmez: balon sönerken yerinde kısalıp erir.
//   - Balon sönünce (kontur noktalara ayrılır) çizim eklemlerinden açılır, çizgiler 8–30 k içinde tek tek kalkar (logo2'de
//     sökülen parçalar 40–80 k enkaz gibi asılı kalıyordu); varış farkını uçuş süresi karşılar: geç gelecek çizgi yavaş süzülür.
//   - Uçuş logo2 gibi: kopuştan sonra hemen yola çıkar, yolun ortasında döner ve doğrulur (sürü logonun 0°/45°/90°
//     doğrultularına dizilir), kaynama söner, incelir, boyu çubuğa yaklaşır (yumuşak kontur düzleşirken yay boyunu korur:
//     kısa kirişli eğri büzülmez); kenara parçanın dışından dikine gelir, hafifçe taşar, oturur, uçlar eklemlere
//     uzanır, eklemde kaynak noktası. Parça kapanınca mürekkep kenardan içe dolar (9 k), sonra kenar çizgisi incelir.
//   - Dalgalar üst üste biner (bir dalga inerken sonraki çift söner): inşa boyunca boş an kalmaz.
// #6.2 LOGO TAMAM (k2646): dikişler kalkar, tek logo yolu, %2 "tık" ('vurgu' doruk). k2652–2698 OKTOS (Big Shoulders
//      Display 900) harf harf maskeden yükselir (6 k arayla, 22 k EO). Yer ve boy logo2 ile aynı (FINAL_YER).
// #6.3 SLOGAN (k2700–2879): ayrıldı; yeni slogan (stil/slogan.*) hazır olunca buraya taşınır. Şimdilik logo ve OKTOS
//      durur, OKTOS'un altında bir satır boş ('vurgu' slogan k2700). Sona dek kararma yok: son kare logo + OKTOS (+ slogan).
// Bütün durum karenin saf işlevi (ciz(f)); tek bir vekil tween'in onUpdate'i çağırır: ileri ve geri sarma güvenli.
// Sorgu: ?yalniz=s5-kalabalik,s6-final  ?yon=dikey  ?dil=en
import { SON_BALONLAR } from './s5-kalabalik.js';
import { CIZIMLER, cizimKur, duz } from './cizimler.js';
import { LOGO_D, LOGO_ORTA, LOGO_EKSEN, PARCA } from '../stil/logo-veri.js';

const BAS = 2352, SON = 2879;
const BEKLE = 22;     // devirden sonra sekiz fikir yerinde okunur; ilk çift k2374'te söner
const TAKAS = 2646;   // logo tamam: dikişler kalkar, tek yol, %2 tık ('vurgu' doruk)
const AD = 2652;      // OKTOS harf harf (son harf k2698'de oturur)
const SLOGAN = 2700;  // k2700–2879 slogana ayrıldı (yeni slogan gelince buraya taşınır)

// Yerleşim: logo2.js ile aynı yer ve boy (OKTOS'un altında slogana bir satır boş kalır)
export const FINAL_YER = {
  yatay: { logo: { cx: 960, cy: 412, s: 1.0 }, ad: { top: 676, boyut: 132 } },
  dikey: { logo: { cx: 540, cy: 840, s: 1.3 }, ad: { top: 1196, boyut: 176 } },
};
const INCE = { yatay: 2.8, dikey: 3.4 }, OLCU = { yatay: 1, dikey: 1.25 };

// Montaj sırası (logo2 ile aynı: dıştan içe, aynalı çiftler aynı dilimde) ve motif grupları (ses işareti 'tik')
const SIRA = [[21, 22], [27, 28], [15, 16], [7, 8], [11, 12], [3, 4], [25, 26], [23, 24], [19, 20], [17, 18], [13, 14], [9, 10], [5, 6], [0, 1], [2]];
const GRUPLAR = [['kose', 0, 3], ['yan', 3, 6], ['alt', 6, 9], ['carpi', 9, 12], ['halka', 12, 15]];
const Z = {
  varisAra: 2, dilimAra: 3, sonNefes: 8, // göreli varış birimleri (sonra hasat aralığına ölçeklenir)
  kopma: 8, yayilma: 22,                 // kalkıştan önce kopuş; bir balonun çizgileri sönmeden 8..30 k sonra, tek tek kalkar
  Fmin: 28, Fmax: 96,                    // uçuş süresi sınırları
  sonme: 22, eri: 12,                    // balonun sönmesi; fazla çizginin erimesi
  oturma: 4, dolum: 9, incelme: 8, dikis: 6,
};

// ---------- Yardımcılar
const ara = (a, b, t) => a + (b - a) * t;
const kis = (x) => Math.max(0, Math.min(1, x));
const yumusak = (a, b, x) => { const t = kis((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const f1 = (v) => v.toFixed(1);
const uzak = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const aciSar = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; };
const olcekle = ([x, y], s) => `translate(${f1(x)} ${f1(y)}) scale(${s.toFixed(4)}) translate(${f1(-x)} ${f1(-y)})`;
const kutu = (pts) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return { x0: a, y0: b, x1: c, y1: d, en: c - a, boy: d - b }; };
// Kaynama indisi (film.js kaynaIndis ile aynı: 8 fps, 4 çizim); kare sayısı kayan noktada bir tık eksik kalmasın
const kaynaIndis = (f) => Math.floor(f * 8 / 60 + 1e-6) % 4;
// Noktalardan yumuşak yol (Catmull-Rom → kübik Bézier; insan.js yol() ile aynı biçim, sapmasız)
function yolD(v) {
  const n = v.length;
  if (n < 2) return '';
  const P = (i) => v[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f1(v[0][0])} ${f1(v[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}
const cokgenD = (poly) => 'M' + poly.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L') + 'Z';
// Dışbükey çokgenin iç teğet yarıçapı (yaklaşık; logo2 ile aynı)
function icYaricap(poly) {
  const kb = kutu(poly);
  let en = 0;
  for (let i = 1; i < 24; i++) for (let j = 1; j < 24; j++) {
    const p = [kb.x0 + (kb.en * i) / 24, kb.y0 + (kb.boy * j) / 24];
    let d = Infinity, ic = true;
    poly.forEach((a, n) => {
      const b = poly[(n + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey);
      const sd = (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) / L;
      d = Math.min(d, Math.abs(sd));
      if (n === 0) ic = sd; else if (Math.sign(sd) !== Math.sign(ic)) ic = false;
    });
    if (ic !== false) en = Math.max(en, d);
  }
  return en;
}
// Noktanın doğru parçasına uzaklığı ve parça üstündeki konumu (0..L)
function parcaUstu(p, a, b) {
  const ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey);
  return { t: ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L, d: Math.abs((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / L, L };
}
// Macar algoritması (kare maliyet matrisi, en küçük toplam): satır i → sütun
function macar(C) {
  const n = C.length, INF = 1e18;
  const u = new Float64Array(n + 1), v = new Float64Array(n + 1), p = new Int32Array(n + 1), yol = new Int32Array(n + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(n + 1).fill(INF), used = new Uint8Array(n + 1);
    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = INF, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) {
        const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; yol[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = yol[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const sonuc = new Array(n);
  for (let j = 1; j <= n; j++) sonuc[p[j] - 1] = j - 1;
  return sonuc;
}
// Küçük kümelerin bütün sıralamaları (dalga planı için; en çok 5 çift)
const siralamalar = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => siralamalar([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));

// ---------- Çubuklar: parça kenarlarını taşıyan doğru parçaları (logo birimi; logo2 ile aynı)
const dNokta = (d, t) => [d.u[0] * t - d.u[1] * d.c, d.u[1] * t + d.u[0] * d.c];
function cubuklariKur() {
  const dogrular = new Map();
  PARCA.forEach((poly, pi) => poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    let ux = b[0] - a[0], uy = b[1] - a[1];
    const L = Math.hypot(ux, uy);
    ux /= L; uy /= L;
    if (ux < -1e-9 || (Math.abs(ux) < 1e-9 && uy < 0)) { ux = -ux; uy = -uy; }
    const c = -uy * a[0] + ux * a[1];
    const anahtar = `${ux.toFixed(4)} ${uy.toFixed(4)} ${c.toFixed(2)}`;
    if (!dogrular.has(anahtar)) dogrular.set(anahtar, { u: [ux, uy], c, ara: [] });
    const ta = a[0] * ux + a[1] * uy, tb = b[0] * ux + b[1] * uy;
    dogrular.get(anahtar).ara.push({ t0: Math.min(ta, tb), t1: Math.max(ta, tb), pi });
  }));
  const kose = PARCA.flat();
  const out = [];
  for (const d of dogrular.values()) {
    d.ara.sort((x, y) => x.t0 - y.t0);
    d.kose = [...new Set(kose.filter((p) => Math.abs(-d.u[1] * p[0] + d.u[0] * p[1] - d.c) < 1e-3).map((p) => +(p[0] * d.u[0] + p[1] * d.u[1]).toFixed(4)))];
    let cur = null;
    for (const a of d.ara) {
      if (cur && a.t0 <= cur.t1 + 1e-6) cur.t1 = Math.max(cur.t1, a.t1);
      else { if (cur) out.push(cur); cur = { d, t0: a.t0, t1: a.t1 }; }
    }
    out.push(cur);
  }
  return out;
}
const cubukUc = (c) => [dNokta(c.d, c.t0), dNokta(c.d, c.t1)];
const aynaNokta = ([x, y]) => [2 * LOGO_EKSEN - x, y];
function aynaBul(c, liste) {
  const [a, b] = cubukUc(c).map(aynaNokta);
  return liste.find((o) => { const [p, r] = cubukUc(o); return (uzak(p, a) < 0.05 && uzak(r, b) < 0.05) || (uzak(p, b) < 0.05 && uzak(r, a) < 0.05); }) || null;
}
// Ortaya en yakın T-eklemden (yoksa ortadan) ikiye böl
function bol(c, liste) {
  const L = c.t1 - c.t0, orta = (c.t0 + c.t1) / 2;
  const aday = c.d.kose.filter((t) => t > c.t0 + 0.3 * L && t < c.t1 - 0.3 * L).sort((x, y) => Math.abs(x - orta) - Math.abs(y - orta));
  const ts = aday.length ? aday[0] : orta;
  liste.splice(liste.indexOf(c), 1, { d: c.d, t0: c.t0, t1: ts }, { d: c.d, t0: ts, t1: c.t1 });
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, W, H, DIKEY } = ctx;
  const yonAd = DIKEY ? 'dikey' : 'yatay';
  const D = { ...FINAL_YER[yonAd], ince: INCE[yonAd], olcu: OLCU[yonAd] };
  const M = ctx.PALET.murekkep, KAGIT = ctx.KAGIT, VURGU = ctx.VURGU, KONTUR = 5;
  const EO = gsap.parseEase(E.EO), EI = gsap.parseEase(E.EI);
  const P2I = gsap.parseEase('power2.in'), P2O = gsap.parseEase('power2.out'), P2IO = gsap.parseEase('power2.inOut');
  const GERI = gsap.parseEase('back.out(1.7)'), GERI3 = gsap.parseEase('back.out(3)');
  const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];

  // Katman: k2352'de açılır (s5'inkiler aynı karede kapanır); kamera devirdeki gibi
  const L = ctx.katman('s6-final', 13);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(BAS));
  ctx.kameraKoy(BAS, { x: 0, y: 0, scale: 1 });
  const tanim = el(L.svg, 'defs');
  const balonKat = el(L.svg, 'g'), logoKap = el(L.svg, 'g'), dolguKat = el(logoKap, 'g'), dikisKat = el(logoKap, 'g');
  const cizgiKat = el(L.svg, 'g'), kaynakKat = el(L.svg, 'g');
  const logoYol = el(logoKap, 'path', { fill: M, 'fill-rule': 'evenodd', d: LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')) });

  // ---------- 1) Balonlar: s5'in k2351'deki hâli. s5 balonu yerel (0,0)'da kurup sarmalayıcıyla taşır; aynısı.
  const SB = SON_BALONLAR[yonAd];
  const balonlar = SB.map((s, bi) => {
    const sar = el(balonKat, 'g', { transform: `translate(${s.c[0].toFixed(2)} ${s.c[1].toFixed(2)}) scale(${(1).toFixed(4)})`, 'data-s6': s.kod });
    const nYerel = s.noktalar.map(([x, y, r]) => [x - s.c[0], y - s.c[1], r]);
    const bal = ctx.balon(sar, { c: [0, 0], r: s.r, noktalar: nYerel, tohum: s.tohum });
    gsap.set(bal.bulut, { scale: 1, autoAlpha: 1 });
    bal.kontur.setAttribute('pathLength', 1000); // sönmede kesik çizgi oranı (kesik yokken görüntüyü değiştirmez)
    const cizimG = el(bal.ic, 'g');
    cizimKur(ctx, cizimG, s.cizim, { c: [0, 0], boy: s.icBoy, kalinlik: s.kalinlik, tohum: s.cizimTohum });
    return { s, bi, c: s.c, sar, bal, nYerel, cizimG, cizgiler: [], sonme: Infinity };
  });

  // ---------- 2) Çizgiler: CIZIMLER'in ham köşelerinden. Köşeli kenar = 4 nokta (köşe, %14, %86, köşe: cizimKur'un duz
  // noktaları), kaynama sapması cizimKur'un tablosundan aynı nokta indisiyle → sönme anında çizim değişmeden çizgilere ayrılır.
  const cizgiler = [];
  let cizgiTohum = 9000;
  function cizgiKur(b, P, ix, sp, egri) {
    const r = ctx.rng(cizgiTohum++);
    const A = P[0], B = P[P.length - 1];
    const th0 = Math.atan2(B[1] - A[1], B[0] - A[0]), m0 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + uzak(P[i - 1], P[i]));
    const Lyay = cum[cum.length - 1], L0 = egri ? Lyay : uzak(A, B);
    const ux = Math.cos(th0), uy = Math.sin(th0);
    const R = P.map((p) => { const dx = p[0] - m0[0], dy = p[1] - m0[1]; return [dx * ux + dy * uy, -dx * uy + dy * ux]; }); // kiriş çerçevesinde dinlenme
    const S = cum.map((v) => v / Lyay); // düzleşmiş hâlde yay boyunca konum (0..1)
    const jit = [0, 1, 2, 3].map((ki) => { const t = sp(ki); return ix.map((j) => [t.sap(j, 0), t.sap(j, 1)]); });
    // Sönmede eklemden ayrılış: çizim ortasından dışa (biraz saparak), küçük dönüş
    const my = [m0[0] - b.c[0], m0[1] - b.c[1]], ml = Math.hypot(my[0], my[1]);
    const ma = Math.atan2(my[1], my[0]) + (r() - 0.5) * 0.7;
    const yon = ml < 3 ? (() => { const a = r() * 6.28; return [Math.cos(a), Math.sin(a)]; })() : [Math.cos(ma), Math.sin(ma)];
    const yolEl = el(cizgiKat, 'path', { fill: 'none', stroke: M, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const h = {
      b, yolEl, P, R, S, jit, L0, th0, m0, egri, w0: b.s.kalinlik,
      pop: { yon, gevsek: (2.5 + r() * 2.5) * D.olcu, don: (r() - 0.5) * 0.07, suzul: (0.015 + r() * 0.02) * D.olcu, kopma: (8 + r() * 6) * D.olcu, don2: (r() - 0.5) * 0.22 },
      cubuk: null,
    };
    b.cizgiler.push(h);
    cizgiler.push(h);
  }
  for (const b of balonlar) {
    const { s } = b;
    CIZIMLER[s.cizim].forEach((kn, i) => {
      const kapali = !!kn.kapali;
      const pts = (kn.yumusak ? kn.p : duz(kn.p, kapali)).map(([x, y]) => [s.c[0] + x * s.icBoy, s.c[1] + y * s.icBoy]);
      const sp = ctx.sapma(s.cizimTohum + i, 1.0);
      let diziler;
      if (!kn.yumusak) {
        const n = kn.p.length, son = kapali ? n : n - 1;
        diziler = Array.from({ length: son }, (_, e) => [3 * e, 3 * e + 1, 3 * e + 2, kapali ? (3 * e + 3) % (3 * n) : 3 * e + 3]);
      } else {
        const m = pts.length, yar = Math.floor(m / 2), sira = (a, b2) => Array.from({ length: b2 - a + 1 }, (_, j) => a + j);
        diziler = kapali ? [sira(0, yar), [...sira(yar, m - 1), 0]] : [sira(0, m - 1)];
      }
      for (const ix of diziler) cizgiKur(b, ix.map((j) => pts[j]), ix, sp, !!kn.yumusak);
    });
  }
  const S = cizgiler.length;
  const ESIK = 22 * D.olcu; // bundan kısa çizgi logoya gitmez (kullanılabilir sayısında da)
  const kullanilir = cizgiler.filter((h) => h.L0 >= ESIK).length;

  // ---------- 3) Çubuklar; çok uzun olanlar (aynalı çiftiyle) bölünür, kullanılabilir çizgi sayısını aşmadan
  let cubuklar = cubuklariKur();
  const R0 = cubuklar.length;
  const LBOL = 165 * D.olcu / D.logo.s; // logo biriminde
  for (let koruma = 0; koruma < 60; koruma++) {
    const en = [...cubuklar].sort((a, b) => (b.t1 - b.t0) - (a.t1 - a.t0))[0];
    if (en.t1 - en.t0 <= LBOL || cubuklar.length + 2 > kullanilir - 4) break;
    const m = aynaBul(en, cubuklar);
    bol(en, cubuklar);
    if (m && m !== en) bol(m, cubuklar);
  }
  cubuklar.forEach((c, i) => {
    c.no = i;
    [c.a, c.b] = cubukUc(c);
    c.p0 = logoNokta(c.a); c.p1 = logoNokta(c.b);
    c.orta = [(c.p0[0] + c.p1[0]) / 2, (c.p0[1] + c.p1[1]) / 2];
    c.L = uzak(c.p0, c.p1);
    c.th = Math.atan2(c.p1[1] - c.p0[1], c.p1[0] - c.p0[0]);
    c.parcalar = new Set(c.d.ara.filter((a) => Math.min(a.t1, c.t1) - Math.max(a.t0, c.t0) > 0.5).map((a) => a.pi));
  });
  cubuklar.forEach((c) => { c.ayna = aynaBul(c, cubuklar); });
  const gerekli = PARCA.map((_, pi) => cubuklar.filter((c) => c.parcalar.has(pi)));

  // ---------- 4) Göreli varış (logo2 ile aynı): dilim dilim; dilim içinde mevcut yapıya en çok değen çubuk (çifti) önce
  const degiyor = (p, c) => { const r = parcaUstu(p, c.a, c.b); return r.d < 0.5 && r.t > -0.5 && r.t < r.L + 0.5; };
  const dilimBasG = new Array(PARCA.length).fill(0);
  const gelen = [];
  let imlec = 0;
  SIRA.forEach((dilim, di) => {
    if (dilim.includes(2)) imlec += Z.sonNefes;
    const bas = imlec;
    const yeni = [...new Set(dilim.flatMap((p) => gerekli[p]))].filter((c) => c.v === undefined);
    const gruplar = [], alindi = new Set();
    for (const c of yeni) {
      if (alindi.has(c)) continue;
      const g = c.ayna && c.ayna !== c && yeni.includes(c.ayna) ? [c, c.ayna] : [c];
      g.forEach((x) => alindi.add(x));
      gruplar.push(g);
    }
    while (gruplar.length) {
      let enIyi = null;
      for (const g of gruplar) {
        const c = g[0];
        const temas = [c.a, c.b].filter((p) => gelen.some((o) => degiyor(p, o))).length + gelen.filter((o) => [o.a, o.b].some((p) => degiyor(p, c))).length;
        const skor = Math.min(temas, 3) * 1000 + (c.a[1] + c.b[1]) / 2;
        if (!enIyi || skor > enIyi.skor) enIyi = { g, skor };
      }
      enIyi.g.forEach((c) => { c.v = imlec; c.dilim = di; gelen.push(c); });
      gruplar.splice(gruplar.indexOf(enIyi.g), 1);
      imlec += Z.varisAra;
    }
    for (const p of dilim) dilimBasG[p] = bas;
    imlec += Z.dilimAra;
  });
  const vMin = Math.min(...cubuklar.map((c) => c.v)), vMax = Math.max(...cubuklar.map((c) => c.v));

  // ---------- 5) Dalgalar: balonların ayna çiftleri; her çift çubuk sırasının bir penceresini besler
  const aynaBalon = balonlar.map((b, i) => {
    let en = -1, ed = Infinity;
    balonlar.forEach((o, j) => { if (j !== i) { const d = uzak([W - b.c[0], b.c[1]], o.c); if (d < ed) { ed = d; en = j; } } });
    return en;
  });
  const ciftler = [], eslesti = new Set();
  balonlar.forEach((b, i) => {
    if (eslesti.has(i)) return;
    const j = aynaBalon[i];
    const uyeler = j >= 0 && aynaBalon[j] === i && !eslesti.has(j) ? [b, balonlar[j]] : [b];
    uyeler.forEach((x) => eslesti.add(x.bi));
    ciftler.push({ uyeler, y: uyeler.reduce((a, x) => a + x.c[1], 0) / uyeler.length, kullanilir: uyeler.reduce((a, x) => a + x.cizgiler.filter((h) => h.L0 >= ESIK).length, 0) });
  });
  ciftler.forEach((c) => c.uyeler.forEach((b) => { b.cift = c; }));
  const yakinUye = (cift, p) => cift.uyeler.reduce((a, b) => (uzak(b.c, p) < uzak(a.c, p) ? b : a));
  const sirali = [...cubuklar].sort((a, b) => a.v - b.v || a.orta[0] - b.orta[0]);
  const enUst = ciftler.reduce((a, c) => (c.y < a.y ? c : a));
  const pencereKur = (plan) => {
    const top = plan.reduce((a, c) => a + c.kullanilir, 0), out = [];
    let i0 = 0, birikim = 0;
    plan.forEach((c, w) => {
      birikim += c.kullanilir;
      let i1 = w === plan.length - 1 ? sirali.length : Math.round(sirali.length * birikim / top);
      while (i1 > i0 && i1 < sirali.length && sirali[i1].v === sirali[i1 - 1].v) i1++; // aynı karede gelenleri bölme
      out.push({ cift: c, cubuklar: sirali.slice(i0, i1) });
      i0 = i1;
    });
    return out;
  };
  // Uçuş yolu kesişmeleri: henüz sönmemiş balonun içinden geçen çizgi karalama gibi okunur; kapanmış (dolmuş) logo
  // parçasının üstünden geçen çizgi siyahın içinde kaybolup öbür yanda belirir
  const balonKesiyor = (a, b, bal) => {
    const rx = bal.s.r[0] * 1.15, ry = bal.s.r[1] * 1.15; // bulut tümsekleri dahil
    const A = [(a[0] - bal.c[0]) / rx, (a[1] - bal.c[1]) / ry], dx = (b[0] - a[0]) / rx, dy = (b[1] - a[1]) / ry;
    const t = kis(-(A[0] * dx + A[1] * dy) / ((dx * dx + dy * dy) || 1));
    return Math.hypot(A[0] + dx * t, A[1] + dy * t) < 1;
  };
  const parcaEkran = PARCA.map((poly) => poly.map(logoNokta));
  const icinde = (p, poly) => {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      if (Math.abs(c) < 1e-9) continue;
      if (!s) s = Math.sign(c); else if (Math.sign(c) !== s) return false;
    }
    return true;
  };
  const parcaKapanisG = PARCA.map((_, pi) => Math.max(dilimBasG[pi], ...gerekli[pi].map((c) => c.v)));
  const planMaliyeti = (p) => {
    let m = 0, kesisme = 0;
    p.forEach((w, wi) => {
      const sonraki = p.slice(wi + 1).flatMap((x) => x.cift.uyeler);
      const v0 = w.cubuklar.length ? Math.min(...w.cubuklar.map((c) => c.v)) : 0;
      const kapali = parcaEkran.filter((_, pi) => parcaKapanisG[pi] < v0);
      for (const c of w.cubuklar) {
        const a = yakinUye(w.cift, c.orta).c, b = c.orta;
        m += uzak(a, b);
        for (const bal of sonraki) {
          if (balonKesiyor(a, b, bal)) { m += 600; kesisme++; }
          if ([c.p0, c.orta, c.p1].some((q) => balonKesiyor(q, q, bal))) { m += 800; kesisme++; } // çubuk duran balonun altına iner
        }
        for (let i = 1; i <= 20; i++) {
          const t = 0.05 + 0.8 * (i / 20), q = [ara(a[0], b[0], t), ara(a[1], b[1], t)];
          if (kapali.some((poly) => icinde(q, poly))) { m += 60; kesisme++; }
        }
      }
    });
    return { m, kesisme };
  };
  let plan = null;
  const planlar = [];
  for (const s of siralamalar(ciftler)) {
    const p = pencereKur(s);
    let { m: maliyet, kesisme } = planMaliyeti(p);
    // Son dalga en üstteki çift olmasın (logo2'de halka yalnız yukarıdan yağıyordu); ama bu, yolu duran balonlardan ya da
    // dolmuş logodan geçirmekten iyidir (dikeyde halkanın yanındaki çift erken sönmek zorunda: o zaman halka üst köşelerden
    // çapraz gelir)
    if (ciftler.length > 1 && s[s.length - 1] === enUst) maliyet += 3000;
    planlar.push([s.map((c) => c.uyeler.map((b) => b.s.kod).join('')).join(' '), Math.round(maliyet), kesisme]);
    if (!plan || maliyet < plan.maliyet) plan = { pencereler: p, maliyet, kesisme };
  }
  const pencereler = plan.pencereler;

  // ---------- 6) Mutlak zaman: ilk çift BAS + BEKLE'de söner; son çubuk TAKAS'a göre (oturma + dolum + dikiş payı)
  pencereler.forEach((w) => {
    const ort = w.cubuklar.length ? w.cubuklar.reduce((a, c) => a + uzak(yakinUye(w.cift, c.orta).c, c.orta), 0) / w.cubuklar.length : 300;
    w.cift.F0 = Math.round(Math.max(36, Math.min(54, 30 + ort / (24 * Math.sqrt(D.olcu)))));
  });
  const A0 = BAS + BEKLE + Z.kopma + pencereler[0].cift.F0;
  const Ason = TAKAS - (Z.oturma + Z.dolum + 3 + Z.dikis);
  const olc = (Ason - A0) / ((vMax - vMin) || 1);
  for (const c of cubuklar) c.varis = Math.round(A0 + (c.v - vMin) * olc);
  const kapanis = PARCA.map((_, pi) => Math.max(Math.round(A0 + (dilimBasG[pi] - vMin) * olc), ...gerekli[pi].map((c) => c.varis)) + Z.oturma);
  pencereler.forEach((w) => {
    w.t0 = w.cubuklar.length ? Math.min(...w.cubuklar.map((c) => c.varis)) : 0;
    w.t1 = w.cubuklar.length ? Math.max(...w.cubuklar.map((c) => c.varis)) : 0;
    w.cift.pencere = w;
  });

  // ---------- 7) Atama (Macar): yol + açı + boy oranı + dalga penceresi dışı; fazla çizgi erir (kısası ucuz)
  const n = Math.max(S, cubuklar.length), Dn = Math.max(W, H) / 4, LOG22 = Math.log(2.2);
  const C = [];
  for (let i = 0; i < n; i++) {
    const h = cizgiler[i];
    if (!h) { C.push(Array.from({ length: n }, (_, j) => (j < cubuklar.length ? 1e3 : 0))); continue; } // çizgisiz çubuk (olmamalı)
    const w = h.b.cift.pencere;
    const satir = cubuklar.map((c) => {
      const dAci = Math.abs(aciSar(2 * (h.th0 - c.th))) / 2; // yönsüz açı farkı (0..π/2)
      const oran = Math.abs(Math.log(c.L / h.L0));
      const erken = Math.max(0, w.t0 - c.varis), gec = Math.max(0, c.varis - w.t1);
      let v = uzak(h.m0, c.orta) / Dn + 0.45 * (dAci / (Math.PI / 2)) + 0.8 * oran + 2.5 * Math.max(0, oran - LOG22) + 0.08 * erken + 0.03 * gec;
      if (h.L0 < ESIK) v += 3; // kısa ayrıntı logoya gitmez (yalnız başka yol yoksa)
      return v;
    });
    const at = 0.15 + 1.6 * kis((h.L0 / D.olcu - 15) / 85);
    for (let j = cubuklar.length; j < n; j++) satir.push(at);
    C.push(satir);
  }
  const atama = macar(C);
  cizgiler.forEach((h, i) => { h.cubuk = cubuklar[atama[i]] || null; if (h.cubuk) h.cubuk.cizgi = h; });

  // ---------- 8) Sönme (çift birlikte), kalkış (sönmeden 8..22 k sonra, erken varan önce), uçuş süresi
  for (const cift of ciftler) {
    const atanmis = cift.uyeler.flatMap((b) => b.cizgiler.filter((h) => h.cubuk));
    const ilk = atanmis.length ? Math.min(...atanmis.map((h) => h.cubuk.varis)) : cift.pencere.t0;
    const sonme = Math.max(BAS + BEKLE, ilk - Z.kopma - cift.F0);
    cift.uyeler.forEach((b) => { b.sonme = sonme; });
  }
  let bekleyen = 0, enUzun = 0;
  for (const b of balonlar) {
    const at = b.cizgiler.filter((h) => h.cubuk).sort((x, y) => x.cubuk.varis - y.cubuk.varis);
    const adim = at.length > 1 ? Math.min(2.5, Z.yayilma / (at.length - 1)) : 0;
    at.forEach((h, r) => {
      const v = h.cubuk.varis;
      let kalkis = b.sonme + Z.kopma + Math.round(r * adim);
      if (v - kalkis < Z.Fmin) kalkis = Math.max(b.sonme + Z.kopma, v - Z.Fmin);
      if (v - kalkis > Z.Fmax) { kalkis = v - Z.Fmax; bekleyen++; }
      h.kalkis = kalkis;
      h.F = Math.max(8, v - kalkis);
      enUzun = Math.max(enUzun, h.F);
    });
  }

  // ---------- Çizginin kare f'deki duruşu: merkez c, açı th, düz boy L, kıvrım k (1 dinlenme, 0 düz), kaynama genliği amp,
  // kalınlık w. Sönmeden önce çizgi çizilmez (cizimKur'un çizimi görünür).
  function durus(h, f) {
    const sonme = h.b.sonme, p = h.pop, tau = f - sonme;
    const patlak = (t) => {
      const ee = GERI3(kis(t / 10)), ek = h.cubuk ? GERI(kis((sonme + t - (h.kalkis - Z.kopma)) / Z.kopma)) : 0;
      const m = p.gevsek * ee + p.suzul * Math.max(0, t) + p.kopma * ek;
      return { c: [h.m0[0] + p.yon[0] * m, h.m0[1] + p.yon[1] * m], th: h.th0 + p.don * ee + p.don2 * ek };
    };
    if (!h.cubuk) {
      const s = 1 - P2I(kis(tau / Z.eri)), pp = patlak(tau);
      return { c: pp.c, th: pp.th, L: h.L0 * s, k: 1, amp: 1, w: h.w0 * s };
    }
    if (f < h.kalkis) { const pp = patlak(tau); return { c: pp.c, th: pp.th, L: h.L0, k: 1, amp: 1, w: h.w0 }; }
    const cb = h.cubuk;
    if (f < cb.varis) {
      // Hermite: kopuştan sonra hemen yola çıkar (başlangıç hızı v0; logo2'deki gibi sıfırdan başlayınca uzun uçuşta
      // çizgi ilk üçte birde yerinde asılı kalıyordu), varışta v1 hızıyla kenara değer
      const u = (f - h.kalkis) / h.F, v0 = 0.45, v1 = h.v1, gg = (v0 + v1 - 2) * u * u * u + (3 - 2 * v0 - v1) * u * u + v0 * u;
      const [P0, P1, P2, P3] = h.bez, mt = 1 - gg;
      const c = [0, 1].map((i) => mt * mt * mt * P0[i] + 3 * mt * mt * gg * P1[i] + 3 * mt * gg * gg * P2[i] + gg * gg * gg * P3[i]);
      // Önce açılır (yön korunur), dönüş ve doğrulma yolun ortasında, çizgiler birbirinden ayrılmışken: varıştan çok önce
      // logonun 0°/45°/90° doğrultularına dizilir. (Geç dönen çizgiler hedefte birbirini tarıyor, kalkışta dönenler balonun
      // yerinde düğümleniyordu.) Uçarken incelir: sürü hafif okunur.
      const th = h.thK + h.dTh * yumusak(0.15, 0.6, u);
      const L = h.L0 * Math.pow(cb.L / h.L0, yumusak(0.12, 0.7, u)) - h.kisa * yumusak(0.55, 1, u);
      return { c, th, L, k: 1 - yumusak(0.05, 0.45, u), amp: 1 - yumusak(0.3, 0.85, u), w: ara(h.w0, D.ince, yumusak(0.08, 0.6, u)) };
    }
    // Oturdu: sönümlü yay (geliş yönünde taşar, geri gelir); boy eklemlere uzanır; parçalar dolunca incelir
    const t2 = f - cb.varis, om = (2 * Math.PI) / 9;
    const disp = h.yayA * Math.exp(-t2 / 3.5) * Math.sin(om * t2);
    const w = D.ince * (1 - yumusak(cb.doluBitis, cb.doluBitis + Z.incelme, f));
    return { c: [cb.orta[0] + h.gelis[0] * disp, cb.orta[1] + h.gelis[1] * disp], th: h.thT, L: cb.L - h.kisa * Math.exp(-t2 / 1.6), k: 0, amp: 0, w, oturdu: true };
  }
  function cizgiCiz(h, f, ki) {
    if (f < h.b.sonme) { h.yolEl.style.display = 'none'; return; }
    const z = durus(h, f);
    if (z.w <= 0.02 || z.L <= 0.3) { h.yolEl.style.display = 'none'; return; }
    h.yolEl.style.display = '';
    h.yolEl.setAttribute('stroke-width', z.w.toFixed(2));
    const cs = Math.cos(z.th), sn = Math.sin(z.th);
    if (z.oturdu) {
      h.yolEl.setAttribute('d', `M${f1(z.c[0] - cs * z.L / 2)} ${f1(z.c[1] - sn * z.L / 2)} L${f1(z.c[0] + cs * z.L / 2)} ${f1(z.c[1] + sn * z.L / 2)}`);
      return;
    }
    // Kıvrık (dinlenme) ile düz hâl arası: düz hâlde noktalar yay boyunca dizilir (eğri düzleşirken büzülmez)
    const sx = z.L / h.L0, J = h.jit[ki];
    const P = h.R.map(([rx, ry], i) => {
      const qx = (1 - z.k) * (h.S[i] - 0.5) * z.L + z.k * rx * sx, qy = z.k * ry * sx;
      return [z.c[0] + qx * cs - qy * sn + J[i][0] * z.amp, z.c[1] + qx * sn + qy * cs + J[i][1] * z.amp];
    });
    h.yolEl.setAttribute('d', yolD(P));
  }

  // ---------- 9) Uçuş eğrisi (kübik Bézier): patlak konumdan dışa savrularak çıkar; kenara dikine, kapatacağı ilk parçanın
  // DIŞINDAN yaklaşır (içeriden gelen çizgi komşu kenarları keser, "#" gibi görünür)
  for (const h of cizgiler) {
    if (!h.cubuk) continue;
    const cb = h.cubuk;
    const z = durus(h, h.kalkis - 1e-6);
    const P0 = z.c, P3 = cb.orta, dist = uzak(P0, P3) || 1;
    const hedefYon = [(P3[0] - P0[0]) / dist, (P3[1] - P0[1]) / dist];
    let d0 = [h.pop.yon[0] * 0.4 + hedefYon[0], h.pop.yon[1] * 0.4 + hedefYon[1]];
    const dl = Math.hypot(d0[0], d0[1]) || 1; d0 = [d0[0] / dl, d0[1] / dl];
    const P1 = [P0[0] + d0[0] * 0.3 * dist, P0[1] + d0[1] * 0.3 * dist];
    const ilk = [...cb.parcalar].sort((x, y) => kapanis[x] - kapanis[y])[0];
    const pm = PARCA[ilk].map(logoNokta).reduce((a, p, _, A) => [a[0] + p[0] / A.length, a[1] + p[1] / A.length], [0, 0]);
    let nrm = [-Math.sin(cb.th), Math.cos(cb.th)];
    if (nrm[0] * (pm[0] - P3[0]) + nrm[1] * (pm[1] - P3[1]) > 0) nrm = [-nrm[0], -nrm[1]];
    const kol = Math.min(0.28 * dist, 90 * D.olcu);
    h.bez = [P0, P1, [P3[0] + nrm[0] * kol, P3[1] + nrm[1] * kol], P3];
    h.gelis = [-nrm[0], -nrm[1]];
    h.v1 = 1.3;
    h.thK = z.th;
    let dTh = aciSar(cb.th - h.thK);
    if (Math.abs(dTh) > Math.PI / 2) dTh = aciSar(dTh + Math.PI);
    h.dTh = dTh; h.thT = h.thK + dTh;
    h.yayA = Math.min((3 * kol * h.v1) / h.F / ((2 * Math.PI) / 9), 4 * D.olcu);
    h.kisa = Math.min(0.12 * cb.L, 9 * D.olcu);
  }
  // Çizgisi kalmayan çubuk (olmamalı): varışta kendiliğinden çizilir
  const yetim = cubuklar.filter((c) => !c.cizgi).map((c) => ({ c, el: el(cizgiKat, 'path', { fill: 'none', stroke: M, 'stroke-linecap': 'round' }) }));

  // ---------- 10) Parçalar (kapanış, mürekkep dolumu), dikişler, kaynak noktaları
  const parcalar = PARCA.map((poly, pi) => {
    const ekran = poly.map(logoNokta), kid = `s6-parca-${pi}`;
    el(el(tanim, 'clipPath', { id: kid }), 'path', { d: cokgenD(ekran) });
    const dEl = el(el(dolguKat, 'g', { 'clip-path': `url(#${kid})` }), 'path', { fill: 'none', stroke: M, 'stroke-linejoin': 'miter', d: cokgenD(ekran) });
    return { pi, el: dEl, kapanis: kapanis[pi], ic: icYaricap(ekran), dolu: kapanis[pi] + Z.dolum };
  });
  for (const c of cubuklar) c.doluBitis = Math.max(...[...c.parcalar].map((p) => parcalar[p].dolu));
  const dikisler = [];
  for (const d of new Set(cubuklar.map((c) => c.d))) {
    for (let i = 0; i < d.ara.length; i++) for (let j = i + 1; j < d.ara.length; j++) {
      const a = d.ara[i], b = d.ara[j], t0 = Math.max(a.t0, b.t0), t1 = Math.min(a.t1, b.t1);
      if (t1 - t0 < 0.5 || a.pi === b.pi) continue;
      const p0 = logoNokta(dNokta(d, t0)), p1 = logoNokta(dNokta(d, t1));
      const e = el(dikisKat, 'path', { d: `M${f1(p0[0])} ${f1(p0[1])} L${f1(p1[0])} ${f1(p1[1])}`, stroke: KAGIT, 'stroke-width': (1.3 * D.olcu).toFixed(2), fill: 'none' });
      dikisler.push({ el: e, bas: Math.max(parcalar[a.pi].dolu, parcalar[b.pi].dolu) });
    }
  }
  const kaynaklar = [], anahtarlar = new Set(), sonParca = SIRA[SIRA.length - 1];
  for (const c of [...cubuklar].sort((x, y) => x.varis - y.varis)) {
    const noktalar = [];
    for (const p of [c.a, c.b]) if (cubuklar.some((o) => o !== c && o.varis <= c.varis && degiyor(p, o))) noktalar.push(p);
    for (const o of cubuklar) if (o !== c && o.varis < c.varis) for (const p of [o.a, o.b]) { const r = parcaUstu(p, c.a, c.b); if (r.d < 0.5 && r.t > 1 && r.t < r.L - 1) noktalar.push(p); }
    for (const p of noktalar) {
      const an = `${p[0].toFixed(1)} ${p[1].toFixed(1)} ${c.varis}`;
      if (anahtarlar.has(an)) continue;
      anahtarlar.add(an);
      const vurgu = sonParca.some((sp) => c.parcalar.has(sp));
      const g = el(kaynakKat, 'g');
      const [x, y] = logoNokta(p);
      const halka = el(g, 'circle', { fill: 'none', stroke: vurgu ? VURGU : M, cx: f1(x), cy: f1(y) });
      const nokta = el(g, 'circle', { fill: vurgu ? VURGU : M, cx: f1(x), cy: f1(y) });
      kaynaklar.push({ g, halka, nokta, f0: c.varis + 1, vurgu });
    }
  }
  const T = { son: Math.max(...parcalar.map((p) => p.dolu)) };
  T.dikis = T.son + 3;
  T.takas = T.dikis + Z.dikis;

  // ---------- 11) OKTOS: logo2 ile aynı yapı (harf .m maskesi > .h), yer ve boy aynı; harf harf maskeden yükselir
  const ad = document.createElement('p');
  ad.dataset.s6 = 'ad';
  Object.assign(ad.style, { position: 'absolute', left: '0px', top: D.ad.top + 'px', width: W + 'px', margin: '0', textAlign: 'center', color: M,
    font: `900 ${D.ad.boyut}px/1 'Big Shoulders Display', sans-serif`, letterSpacing: '0.06em', textTransform: 'uppercase' });
  const harfler = [...'OKTOS'].map((c) => {
    const m = document.createElement('span');
    Object.assign(m.style, { display: 'inline-block', overflow: 'hidden', padding: '0.06em 0.01em 0.08em', margin: '-0.06em -0.01em -0.08em', verticalAlign: 'top' });
    const s = document.createElement('span');
    s.style.display = 'inline-block'; s.textContent = c;
    m.appendChild(s); ad.appendChild(m);
    return s;
  });
  L.div.appendChild(ad);
  gsap.set(harfler, { yPercent: 110 });
  tl.set(harfler, { yPercent: 110 }, k(BAS));
  harfler.forEach((s, i) => {
    tl.fromTo(s, { yPercent: 110 }, { yPercent: 0, duration: k(22), ease: E.EO, immediateRender: false }, k(AD + i * 6));
    ctx.isaret(AD + i * 6 + 6, 'tik', { ad: 'oktos' });
  });

  // ---------- Kare kurulumu (saf: yalnız f'ye bağlı)
  function balonCiz(b, f) {
    const s = f - b.sonme, { bal } = b;
    if (s >= Z.sonme) { b.sar.style.display = 'none'; return; }
    b.sar.style.display = '';
    if (s < 0) {
      // Açık: devirdeki hâl (geri sarınca da)
      bal.kontur.removeAttribute('stroke-dasharray');
      bal.kontur.setAttribute('stroke-width', KONTUR);
      bal.dolgu.setAttribute('fill-opacity', 1);
      bal.noktalar.forEach((e, j) => e.setAttribute('transform', olcekle(b.nYerel[j], 1)));
      b.cizimG.style.display = '';
      return;
    }
    // Sönme: kontur kesik çizgiye, sonra noktalara ayrılır; buluta en yakın nokta önce küçülür; dolgu solar
    b.cizimG.style.display = 'none';
    const per = 1000 / 26, a = P2I(kis(s / 10));
    bal.kontur.setAttribute('stroke-dasharray', `${(per * (1 - a) + 0.01).toFixed(2)} ${(per * a).toFixed(2)}`);
    bal.kontur.setAttribute('stroke-width', (KONTUR * (1 - P2I(kis((s - 9) / 9)))).toFixed(2));
    bal.dolgu.setAttribute('fill-opacity', (1 - P2O(kis((s - 1) / 11))).toFixed(3));
    bal.noktalar.forEach((e, j) => e.setAttribute('transform', olcekle(b.nYerel[j], Math.max(0, 1 - EI(kis((s - 4 - (2 - j) * 3) / 8))))));
  }
  function ciz(fHam) {
    const f = Math.max(BAS, fHam), ki = kaynaIndis(f);
    for (const b of balonlar) balonCiz(b, f);
    for (const h of cizgiler) cizgiCiz(h, f, ki);
    for (const y of yetim) {
      const g = kis((f - y.c.varis + 8) / 8), w = D.ince * (1 - yumusak(y.c.doluBitis, y.c.doluBitis + Z.incelme, f));
      y.el.style.display = g > 0 && w > 0.02 ? '' : 'none';
      const a = [ara(y.c.orta[0], y.c.p0[0], g), ara(y.c.orta[1], y.c.p0[1], g)], bb = [ara(y.c.orta[0], y.c.p1[0], g), ara(y.c.orta[1], y.c.p1[1], g)];
      y.el.setAttribute('d', `M${f1(a[0])} ${f1(a[1])} L${f1(bb[0])} ${f1(bb[1])}`);
      y.el.setAttribute('stroke-width', w.toFixed(2));
    }
    for (const p of parcalar) {
      if (f < p.kapanis) { p.el.style.display = 'none'; continue; }
      p.el.style.display = '';
      const v = kis((f - p.kapanis) / Z.dolum);
      if (v >= 1) { p.el.setAttribute('fill', M); p.el.setAttribute('stroke-width', 0); continue; }
      p.el.setAttribute('fill', 'none');
      p.el.setAttribute('stroke-width', ara(D.ince, 2 * p.ic + 4, P2I(v)).toFixed(2));
    }
    for (const d of dikisler) {
      const a = yumusak(d.bas, d.bas + 6, f) * (1 - yumusak(T.dikis, T.dikis + Z.dikis, f));
      d.el.style.display = a > 0.01 ? '' : 'none';
      d.el.setAttribute('opacity', (0.75 * a).toFixed(3));
    }
    for (const q of kaynaklar) {
      const t = f - q.f0;
      if (t < 0 || t > 14) { q.g.style.display = 'none'; continue; }
      q.g.style.display = '';
      const R = D.ince * (q.vurgu ? 2.1 : 1.55);
      q.nokta.setAttribute('r', Math.max(0, R * (t < 2 ? P2O(t / 2) : 1 - P2I(kis((t - 2) / 9)))).toFixed(2));
      const hv = kis(t / 10);
      q.halka.setAttribute('r', ara(R * 1.2, R * (q.vurgu ? 2.8 : 3.6), P2O(hv)).toFixed(2));
      q.halka.setAttribute('stroke-width', (1.6 * D.olcu * (1 - hv)).toFixed(2));
      q.halka.setAttribute('opacity', (1 - hv).toFixed(3));
    }
    // Takas: parçalar ve çizgiler yerine tek logo yolu (dikiş yok); %2 tık, logo yerinde kalır
    const takas = f >= T.takas;
    logoYol.style.display = takas ? '' : 'none';
    dolguKat.style.display = takas ? 'none' : '';
    cizgiKat.style.display = takas ? 'none' : '';
    const tk = f - T.takas;
    const s = tk < 0 ? 1 : tk < 5 ? 1 + 0.02 * P2O(tk / 5) : 1 + 0.02 * (1 - P2IO(kis((tk - 5) / 14)));
    logoKap.setAttribute('transform', olcekle([D.logo.cx, D.logo.cy], s));
  }
  ciz(BAS);
  const vekil = { f: BAS - 1 };
  tl.fromTo(vekil, { f: BAS - 1 }, { f: SON + 1, duration: k(SON + 2 - BAS), ease: 'none', immediateRender: false, onUpdate: () => ciz(vekil.f) }, k(BAS - 1));

  // ---------- Çekim kaydı ve ses işaretleri
  ctx.vurus('6.1', 'Hasat: sekiz fikir sökülür, çizgiler logoyu kurar', BAS, T.takas - 1);
  ctx.vurus('6.2', 'Logo tamam, OKTOS harf harf', T.takas, SLOGAN - 1);
  ctx.vurus('6.3', 'Slogan (yer ayrıldı: OKTOS altında bir satır)', SLOGAN, SON);
  for (const [grup, i0, i1] of GRUPLAR) {
    const ps = SIRA.slice(i0, i1).flat();
    ctx.isaret(Math.max(...ps.map((p) => parcalar[p].kapanis)), 'tik', { grup });
  }
  ctx.isaret(T.takas, 'vurgu', { ad: 'doruk' });
  ctx.isaret(SLOGAN, 'vurgu', { ad: 'slogan' });

  // İnceleme için (scripts/film-kare.py ile okunur)
  const oranlar = cizgiler.filter((h) => h.cubuk).map((h) => h.cubuk.L / h.L0);
  if (window.tanitim) window.tanitim.s6 = {
    cizgi: S, kullanilir, cubuk0: R0, cubuk: cubuklar.length, fazla: cizgiler.filter((h) => !h.cubuk).length, yetim: yetim.length,
    bekleyen, enUzunUcus: enUzun, enBuyukOran: +Math.max(...oranlar).toFixed(2), oran2: oranlar.filter((x) => x > 2 || x < 0.5).length,
    dalgalar: pencereler.map((w) => ({ uyeler: w.cift.uyeler.map((b) => b.s.kod), sonme: w.cift.uyeler[0].sonme, F0: w.cift.F0, t0: w.t0, t1: w.t1, cubuk: w.cubuklar.length,
      atanan: w.cift.uyeler.reduce((a, b) => a + b.cizgiler.filter((h) => h.cubuk).length, 0) })),
    plan: { maliyet: Math.round(plan.maliyet), kesisme: plan.kesisme }, planlar: planlar.sort((a, b) => a[1] - b[1]).slice(0, 10), T, kapanis: parcalar.map((p) => p.kapanis),
  };
}
