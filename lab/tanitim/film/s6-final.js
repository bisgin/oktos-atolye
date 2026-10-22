// Sahne 6, FİNAL (#6.1–#6.3, iç kare k2376–2997). Kalıp: s5-kalabalik.js (kur(ctx), MUTLAK kare zamanları).
// DEVİR (kesme yok): s5'in son karesindeki (k2375) sekiz balon SON_BALONLAR'dan (s5-kalabalik.js) aynı yerde, aynı boyda,
// aynı bulutla (ctx.balon, aynı tohum) ve aynı çizgilerle (cizimKur, aynı çizim tohumu ve kalınlık) AÇIK hâlde kurulur;
// kenarlara çekilmiş kalabalık da SON_KISILER'den aynı yerde, aynı ölçek ve pozla (s5'in gövde uzatmasıyla) kurulur.
// s5 katmanları k2376'da kapanır, bu katman açılır. Kamera odak(0,0,1) (dünya = ekran) ve sona dek sabit.
// KİŞİLER final boyunca ekranda kalır, hafifçe yaşar (12 fps: göz kırpma, baş sallama, sevinç sekmesi, omuz kıpırtısı):
// balonu sönen ortaya, inşaya bakar; ~30 k sonra gülümser; logo tamamlanınca gülümseme büyür (gözler de güler), sonra
// OKTOS'a ve slogana bakarlar; slogan oturunca yine. Ayrıntı: 13) Kişilerin takvimi.
// #6.1 HASAT (k2376–2669): stil/logo2.js'teki inşa filme uyarlandı (biçim dönüşümü değil yapım; logo2.js'e dokunulmaz).
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
//     Fikirlerin açık renkli dolguları (cizimler.js) ayrılma anında yerinde kalır, 8 k'da solar: uçan çizgiler ve logo mürekkep.
//   - Uçuş logo2 gibi: kopuştan sonra hemen yola çıkar, yolun ortasında döner ve doğrulur (sürü logonun 0°/45°/90°
//     doğrultularına dizilir), kaynama söner, incelir, boyu çubuğa yaklaşır (yumuşak kontur düzleşirken yay boyunu korur:
//     kısa kirişli eğri büzülmez); kenara parçanın dışından dikine gelir, hafifçe taşar, oturur, uçlar eklemlere
//     uzanır, eklemde kaynak noktası. Parça kapanınca mürekkep kenardan içe dolar (9 k), sonra kenar çizgisi incelir.
//   - Dalgalar üst üste biner (bir dalga inerken sonraki çift söner): inşa boyunca boş an kalmaz.
// #6.2 LOGO TAMAM (k2670): dikişler kalkar, tek logo yolu, %2 "tık" ('vurgu' doruk). k2676–2722 OKTOS (Big Shoulders
//      Display 900) harf harf maskeden yükselir (6 k arayla, 22 k EO). Yer ve boy FINAL_YER (yatay logo2 ile aynı).
// #6.3 SLOGAN (k2724–2997): stil/slogan.js filme uyarlandı (o dosyaya dokunulmaz; aşağıda sloganKur). Mürekkep logonun
//      ve OKTOS'un alt kenarlarından damla gibi kopar, düşer, harfe dönüşüp konar; bütün harfler Big Shoulders 900.
//      EN "OKAY TO DO'S", TR "YAPILABİLİR “ŞÖYLE BİR ŞEY”LER" (iki satır; tırnaklar vurgu renginde, sonda iki İ esner);
//      dil ctx.DIL. Slogan 274 k (TR akış ~181 k + ≥90 k son tutuş). Sona dek kararma yok: son kare logo + OKTOS +
//      slogan + gülümseyen kalabalık.
// SES İŞARETLERİ YÖNDEN BAĞIMSIZ (müzik tek ses dosyası): çubuk sırası ve bölünmesi yalnız logonun geometrisine bağlı,
// ilk varış sabit karede; parça kapanışları ve grup 'tik'leri iki yönde aynı karede. Slogan damlalarının konma kareleri
// iki yön birlikte planlanır (her damla yatayda ve dikeyde aynı karede konar).
// Bütün durum karenin saf işlevi (ciz(f)); tek bir vekil tween'in onUpdate'i çağırır: ileri ve geri sarma güvenli.
// Sorgu: ?yalniz=s5-kalabalik,s6-final&ic=1  ?yon=dikey  ?dil=en
import { CustomEase } from 'gsap/CustomEase.js';
import { SON_BALONLAR, SON_KISILER, govdeUzat, ARALIK as S5_ARALIK } from './s5-kalabalik.js';
import { CIZIMLER, cizimKur, duz } from './cizimler.js';
import { LOGO_D, LOGO_ORTA, LOGO_EKSEN, PARCA } from '../stil/logo-veri.js';
import { kisiSVG, YAPI } from '../insan.js';

// Bütün kareler s5'in son karesinden sonra (s5 devri 2351'den 2375'e uzadı: s6 iç kareleri de 24 k kaydı)
const BAS = S5_ARALIK[1] + 1; // 2376
const BEKLE = 22;     // devirden sonra sekiz fikir yerinde okunur; ilk çift ~BAS+19'da söner
const TAKAS = BAS + 294;   // logo tamam: dikişler kalkar, tek yol, %2 tık ('vurgu' doruk)
const AD = BAS + 300;      // OKTOS harf harf (son harf AD+46'da oturur)
const SLOGAN = BAS + 348;  // sloganın 0. karesi (logo2'nin son karesiyle aynı durgun kare)
const SLOGAN_SURE = 274; // akış + İ esnemesi (TR hareket ~181 k) + ≥90 k son tutuş (iki dilde aynı: müzik tek)
const SON = SLOGAN + SLOGAN_SURE - 1;
export const ARALIK = [BAS, SON]; // kadro.json'daki aralıktan uzun: s5 uzadı, slogan sığsın (çekirdek sonrakileri kaydırır)
const ILK_VARIS = BAS + BEKLE + 8 + 48; // ilk çubuğun varışı: yönden bağımsız (dalga planı yöne göre değişse de)
const LBOL = 165; // logo biriminde: bundan uzun çubuk aynalı çiftiyle bölünür (yönden bağımsız)

// Yerleşim: yatay logo2.js ile aynı yer ve boy (OKTOS'un altında slogana bir satır boş kalır). Dikey 150 px yukarıda
// (logo y 396–984, slogan ≤ ~1420): alt banttaki kalabalığa ve üstündeki balonlara yer kalsın (s5 SON_YER).
export const FINAL_YER = {
  yatay: { logo: { cx: 960, cy: 412, s: 1.0 }, ad: { top: 676, boyut: 132 } },
  dikey: { logo: { cx: 540, cy: 690, s: 1.3 }, ad: { top: 1046, boyut: 176 } },
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
  const KAYDIR = ctx.KAYDIR || 0; // iç kare + KAYDIR = film karesi (önceki sahneler uzarsa)
  const yonAd = DIKEY ? 'dikey' : 'yatay';
  const D = { ...FINAL_YER[yonAd], ince: INCE[yonAd], olcu: OLCU[yonAd] };
  const M = ctx.PALET.murekkep, KAGIT = ctx.KAGIT, VURGU = ctx.VURGU, KONTUR = 5;
  const EO = gsap.parseEase(E.EO), EI = gsap.parseEase(E.EI);
  const P2I = gsap.parseEase('power2.in'), P2O = gsap.parseEase('power2.out'), P2IO = gsap.parseEase('power2.inOut');
  const GERI = gsap.parseEase('back.out(1.7)'), GERI3 = gsap.parseEase('back.out(3)');
  const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];

  // Katman: BAS'ta açılır (s5'inkiler aynı karede kapanır); kamera devirdeki gibi
  const L = ctx.katman('s6-final', 13);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(BAS));
  ctx.kameraKoy(BAS, { x: 0, y: 0, scale: 1 });
  const tanim = el(L.svg, 'defs');
  const kisiKat = el(L.svg, 'g'); // kişiler en altta (s5'teki gibi: balonlar ve uçan çizgiler üstlerinden geçer)
  const balonKat = el(L.svg, 'g'), logoKap = el(L.svg, 'g'), dolguKat = el(logoKap, 'g'), dikisKat = el(logoKap, 'g');
  const cizgiKat = el(L.svg, 'g'), kaynakKat = el(L.svg, 'g');
  const logoYol = el(logoKap, 'path', { fill: M, 'fill-rule': 'evenodd', d: LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')) });

  // ---------- 0) Kişiler: s5'in son karesindeki kalabalık aynı yerde, aynı ölçekte, aynı pozla (SON_KISILER); final boyunca
  // ekranda kalır. Çizim bu modülde (saf: kisiCiz(f)); film.js'in kaynatması kapalı (donuk), kaynama aynı tabloyla.
  const solgun = (a) => {
    const id = `s6-solgun-${Math.round(a * 100)}`;
    if (!tanim.querySelector(`#${id}`)) {
      const fl = el(tanim, 'filter', { id, 'color-interpolation-filters': 'sRGB', x: '-5%', y: '-5%', width: '110%', height: '110%' });
      const tr = el(fl, 'feComponentTransfer');
      [0xf1, 0xed, 0xe6].forEach((v, i) => el(tr, `feFunc${'RGB'[i]}`, { type: 'linear', slope: a, intercept: ((1 - a) * v / 255).toFixed(4) }));
    }
    return `url(#${id})`;
  };
  const kisiler = SON_KISILER[yonAd].map((s) => {
    const kap = el(kisiKat, 'g', s.alfa < 1 ? { filter: solgun(s.alfa) } : {});
    const h = ctx.kisi(kap, s.p, { x: s.x, alt: s.alt, olcek: s.olcek });
    h.donuk = true;
    govdeUzat(ctx, h);
    return { ...s, h, anahtar: '', olaylar: [], kirpmalar: [], hareket: [] };
  });

  // ---------- 1) Balonlar: s5'in son karesindeki hâli. s5 balonu yerel (0,0)'da kurup sarmalayıcıyla taşır; aynısı.
  const SB = SON_BALONLAR[yonAd];
  const balonlar = SB.map((s, bi) => {
    const sar = el(balonKat, 'g', { transform: `translate(${s.c[0].toFixed(2)} ${s.c[1].toFixed(2)}) scale(${(1).toFixed(4)})`, 'data-s6': s.kod });
    const nYerel = s.noktalar.map(([x, y, r]) => [x - s.c[0], y - s.c[1], r]);
    const bal = ctx.balon(sar, { c: [0, 0], r: s.r, noktalar: nYerel, tohum: s.tohum });
    gsap.set(bal.bulut, { scale: 1, autoAlpha: 1 });
    bal.kontur.setAttribute('pathLength', 1000); // sönmede kesik çizgi oranı (kesik yokken görüntüyü değiştirmez)
    const cizimG = el(bal.ic, 'g');
    // Renkler cizimKur'dan (cizimler.js r): s5'in son karesindekiyle aynı dolgular
    const cizimH = cizimKur(ctx, cizimG, s.cizim, { c: [0, 0], boy: s.icBoy, kalinlik: s.kalinlik, tohum: s.cizimTohum });
    return { s, bi, c: s.c, sar, bal, nYerel, cizimG, cizimH, cizgiler: [], sonme: Infinity };
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

  // ---------- 3) Çubuklar; çok uzun olanlar (aynalı çiftiyle) bölünür. Yalnız logo geometrisine bağlı (yön ve balon
  // düzeni değiştirmez): çubuk sırası, varışlar ve ses işaretleri iki yönde aynı
  let cubuklar = cubuklariKur();
  const R0 = cubuklar.length;
  for (let koruma = 0; koruma < 60; koruma++) {
    const en = [...cubuklar].sort((a, b) => (b.t1 - b.t0) - (a.t1 - a.t0))[0];
    if (en.t1 - en.t0 <= LBOL || cubuklar.length >= 88) break;
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

  // ---------- 6) Mutlak zaman: ilk çubuk ILK_VARIS'te, son çubuk TAKAS'a göre (oturma + dolum + dikiş payı); ikisi de
  // yönden bağımsız. Uçuş süresi (F0) yöne göre değişir: sönme karesi ondan geri hesaplanır.
  pencereler.forEach((w) => {
    const ort = w.cubuklar.length ? w.cubuklar.reduce((a, c) => a + uzak(yakinUye(w.cift, c.orta).c, c.orta), 0) / w.cubuklar.length : 300;
    w.cift.F0 = Math.round(Math.max(36, Math.min(54, 30 + ort / (24 * Math.sqrt(D.olcu)))));
  });
  const A0 = ILK_VARIS;
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
    const sonme = Math.max(BAS + 14, ilk - Z.kopma - cift.F0);
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
  const { p: ad, harfler } = adKur(D, W, M);
  ad.dataset.s6 = 'ad';
  L.div.appendChild(ad);
  gsap.set(harfler, { yPercent: 110 });
  tl.set(harfler, { yPercent: 110 }, k(BAS));
  harfler.forEach((s, i) => {
    tl.fromTo(s, { yPercent: 110 }, { yPercent: 0, duration: k(22), ease: E.EO, immediateRender: false }, k(AD + i * 6));
    ctx.isaret(AD + i * 6 + 6, 'tik', { ad: 'oktos' });
  });

  // ---------- 12) Slogan: harfler OKTOS'un altında (HTML), damlalar logonun üstünde (SVG)
  const slogan = sloganKur(ctx, L.div, ad, L.svg);

  // ---------- 13) Kişilerin takvimi (12 fps ızgarası; yön ve dil değiştirmez, kare kare saf). İfadeler:
  //   merak: gözler açık, inşaya bakar | gülümse: yüz 'mutlu', gözler 'kisik' (açık, bakan) | mutlu: gözler de güler.
  //   'gülümse' iki çizimin birleşimi: göz bölgesi (iki küçük dikdörtgen) 'kisik' çiziminden, gerisi 'mutlu'dan. İkisinde
  //   kaynama ve sapma sırası göze dek aynı (göz başına bir yol), yani dikiş görünmez; kırpma da aynı yolla ('kirp').
  // Akış: s5'in son pozu (sahip kendi balonuna, öteki ortaya bakar) → balonu söner (ötekiler ilk sönmede) → ortaya, inşaya
  // bakar → ~30 k sonra gülümser → logo tamam (TAKAS): gülümseme büyür (mutlu) + sevinç sekmesi, ortadan dışa dalga →
  // OKTOS harfleri: çoğu harflere döner (gülümse), baş sallar → slogan: slogana bakar → slogan oturur: yine mutlu + sekme
  // → son tutuş: yarısı gülümseyerek bakar (göz kırpar), yarısı mutlu; arada küçük omuz kıpırtısı.
  const adimla = (n) => ctx.adim(n);
  const OD = [D.logo.cx, D.logo.cy];
  const yaziY = D.ad.top + D.ad.boyut * 0.55, sloganY = D.ad.top + D.ad.boyut * 1.55;
  const bak = (K, h) => { const dx = h[0] - K.yuz[0], dy = h[1] - K.yuz[1]; return [Math.abs(dx) < 50 ? 0 : Math.sign(dx), dy < -90 ? -1 : dy > 90 ? 1 : 0]; };
  const ilkSonme = Math.min(...balonlar.map((b) => b.sonme));
  const sloganIs = slogan.isaretler.map((i) => ({ ...i, kare: SLOGAN + i.kare }));
  const OTUR = sloganIs.find((i) => i.ek?.ad === 'slogan-otur').kare;
  const ESNE = sloganIs.filter((i) => i.ek?.ad === 'slogan-i').map((i) => i.kare);
  const dalga = (K, yay) => Math.round((Math.abs(K.x - W / 2) / (W / 2)) * yay); // ortadan dışa
  for (const K of kisiler) {
    const r = ctx.rng(K.p.tohum * 7 + 3), gec = Math.floor(r() * 3) * 5;
    const bal = balonlar.find((b) => b.s.kod === K.kod);
    const gul = (hedef) => ({ ifade: 'mutlu', goz: 'kisik', bakis: bak(K, hedef) });
    const O = K.olaylar;
    O.push([BAS - 1, { ifade: K.ifade, goz: null, bakis: K.bakis }]);
    const izle = bal ? bal.sonme + 4 : ilkSonme + 10 + gec;
    O.push([izle, { ifade: 'merak', goz: null, bakis: bak(K, OD) }]);
    O.push([izle + 26 + gec, gul(OD)]);
    const tamam = T.takas + 2 + dalga(K, 12);
    O.push([tamam, { ifade: 'mutlu', goz: null }]);
    K.hareket.push([tamam, 'sek']);
    // mutlu en az ~30 k sürsün (OKTOS'un ilk harfleri gülerek), sonra çoğu harflere döner, kimi baş sallar
    if (r() < 0.65) { O.push([AD + 30 + gec, gul([W / 2, yaziY])]); if (r() < 0.6) K.hareket.push([AD + 40 + gec * 2, 'bas']); }
    O.push([SLOGAN + 6 + gec, gul([W / 2, sloganY])]);
    const otur = OTUR + 2 + dalga(K, 10);
    O.push([otur, { ifade: 'mutlu', goz: null }]);
    K.hareket.push([otur, 'sek']);
    if (ESNE.length && r() < 0.5) K.hareket.push([ESNE[Math.floor(r() * ESNE.length)] + 4, 'bas']);
    if (r() < 0.5) O.push([otur + 34 + gec * 2, gul([W / 2, sloganY])]);
    K.hareket.push([otur + 70 + Math.floor(r() * 50), 'omuz']);
    K.olaylar = O.map(([f, d]) => [adimla(f), d]).sort((a, b) => a[0] - b[0]);
    K.hareket = K.hareket.map(([f, t]) => [adimla(f), t]).sort((a, b) => a[0] - b[0]);
    // Göz kırpma (yalnız açık gözle: merak, gülümse): 55–100 k arayla, bir ifade değişimine 10 k'dan yakın değil
    for (let f = BAS + 20 + Math.floor(r() * 40); f < SON - 8; f += 55 + Math.floor(r() * 45)) {
      const fa = adimla(f);
      if (K.olaylar.some(([kk]) => Math.abs(kk - fa) < 10)) continue;
      K.kirpmalar.push(fa);
    }
  }
  // Kare f'deki durum (12 fps): ifade, göz katmanı, bakış; kırpma; hareket (sekme, baş sallama, omuz) → dönüşüm
  const HAREKET = {
    sek: [[0, -9, 0], [5, -3, 0], [10, 0, 0]],          // sevinç: hafif sıçrar
    bas: [[0, 2, 1.6], [5, 1, -0.8], [10, 0, 0]],        // baş sallama: öne eğilir, geri gelir (boyun çevresinde)
    omuz: [[0, -4, 0], [5, 0, 0]],                       // omuz kıpırtısı
  };
  function kisiDurum(K, f) {
    const fq = adimla(f);
    let d = K.olaylar[0][1];
    for (const [kk, dd] of K.olaylar) { if (kk <= fq) d = dd; else break; }
    d = { ...d };
    const acik = d.goz === 'kisik' || (!d.goz && d.ifade !== 'mutlu');
    if (acik && K.kirpmalar.some((kk) => fq >= kk && fq < kk + 5)) { if (d.goz) d.goz = 'kirp'; else d.ifade = 'kirp'; }
    let dy = 0, don = 0;
    for (const [kk, tur] of K.hareket) {
      if (fq < kk) break;
      const adimlar = HAREKET[tur], j = fq - kk;
      for (const [a, y, r] of adimlar) if (j >= a) { dy = y; don = r; }
      if (j >= adimlar[adimlar.length - 1][0]) { dy = 0; don = 0; }
    }
    return { ...d, dy: dy * K.olcek, don };
  }
  const gozKutusu = (p) => {
    const gx = 0.38 * p.yuzEn * (YAPI[p.yapi] || YAPI.orta).yuz, G = ctx.GOZ_Y;
    return [-1, 1].map((y) => `M${(200 + y * gx - 14).toFixed(1)} ${G - 11}h28v20h-28Z`).join('');
  };
  function kisiCiz(K, f, ki) {
    const d = kisiDurum(K, f);
    const anahtar = `${d.ifade}|${d.goz}|${d.bakis}|${ki}`;
    if (anahtar !== K.anahtar) {
      K.anahtar = anahtar;
      const ciz = (ifade, bakis) => kisiSVG(K.p, { kaynama: ki, ifade, bakis: bakis || [0, 0], mono: true });
      if (!d.goz) K.h.svg.innerHTML = ciz(d.ifade, d.bakis);
      else {
        // Alttaki 'mutlu' çizim kırpılmaz; göz bölgesi üstüne biner (iki tümleyen kırpma kenarda kâğıt rengi dikiş bırakıyordu)
        const id = `s6k-${K.kod}`;
        K.h.svg.innerHTML = `<defs><clipPath id="${id}-g"><path d="${gozKutusu(K.p)}"/></clipPath></defs>`
          + `${ciz(d.ifade)}<g clip-path="url(#${id}-g)">${ciz(d.goz, d.bakis)}</g>`;
      }
    }
    const boyun = [K.x, K.yuz[1] + 70 * K.olcek];
    K.h.g.setAttribute('transform', d.dy || d.don ? `translate(0 ${d.dy.toFixed(1)}) rotate(${d.don} ${boyun[0].toFixed(1)} ${boyun[1].toFixed(1)})` : '');
  }

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
      for (const h of b.cizimH) { h.yol.style.display = ''; h.dolgu?.setAttribute('fill-opacity', 1); }
      return;
    }
    // Sönme: kontur kesik çizgiye, sonra noktalara ayrılır; buluta en yakın nokta önce küçülür; dolgu solar.
    // Çizim çizgilerine ayrılır (konturları artık uçan çizgiler taşır); renkli dolgular yerinde kalıp 8 k'da hızla solar,
    // logoya yalnız mürekkep gider
    const renk = 1 - P2O(kis(s / 8));
    b.cizimG.style.display = renk > 0.001 ? '' : 'none';
    for (const h of b.cizimH) { h.yol.style.display = 'none'; h.dolgu?.setAttribute('fill-opacity', renk.toFixed(3)); }
    const per = 1000 / 26, a = P2I(kis(s / 10));
    bal.kontur.setAttribute('stroke-dasharray', `${(per * (1 - a) + 0.01).toFixed(2)} ${(per * a).toFixed(2)}`);
    bal.kontur.setAttribute('stroke-width', (KONTUR * (1 - P2I(kis((s - 9) / 9)))).toFixed(2));
    bal.dolgu.setAttribute('fill-opacity', (1 - P2O(kis((s - 1) / 11))).toFixed(3));
    bal.noktalar.forEach((e, j) => e.setAttribute('transform', olcekle(b.nYerel[j], Math.max(0, 1 - EI(kis((s - 4 - (2 - j) * 3) / 8))))));
  }
  function ciz(fHam) {
    const f = Math.max(BAS, fHam), ki = kaynaIndis(f + KAYDIR); // kaynama film karesiyle (balonlar ve cizimKur gibi)
    for (const K of kisiler) kisiCiz(K, f, ki);
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
    slogan.ciz(f - SLOGAN);
  }
  ciz(BAS);
  const vekil = { f: BAS - 1 };
  tl.fromTo(vekil, { f: BAS - 1 }, { f: SON + 1, duration: k(SON + 2 - BAS), ease: 'none', immediateRender: false, onUpdate: () => ciz(vekil.f) }, k(BAS - 1));

  // ---------- Çekim kaydı ve ses işaretleri
  ctx.vurus('6.1', 'Hasat: sekiz fikir sökülür, çizgiler logoyu kurar', BAS, T.takas - 1);
  ctx.vurus('6.2', 'Logo tamam, OKTOS harf harf', T.takas, SLOGAN - 1);
  ctx.vurus('6.3', 'Slogan: mürekkep damlaları', SLOGAN, SON);
  for (const [grup, i0, i1] of GRUPLAR) {
    const ps = SIRA.slice(i0, i1).flat();
    ctx.isaret(Math.max(...ps.map((p) => parcalar[p].kapanis)), 'tik', { grup });
  }
  ctx.isaret(T.takas, 'vurgu', { ad: 'doruk' });
  ctx.isaret(SLOGAN, 'vurgu', { ad: 'slogan' });
  for (const i of slogan.isaretler) ctx.isaret(SLOGAN + i.kare, i.tur, i.ek);

  // İnceleme için (scripts/film-kare.py ile okunur)
  const oranlar = cizgiler.filter((h) => h.cubuk).map((h) => h.cubuk.L / h.L0);
  if (window.tanitim) window.tanitim.s6 = {
    cizgi: S, kullanilir, cubuk0: R0, cubuk: cubuklar.length, fazla: cizgiler.filter((h) => !h.cubuk).length, yetim: yetim.length,
    bekleyen, enUzunUcus: enUzun, enBuyukOran: +Math.max(...oranlar).toFixed(2), oran2: oranlar.filter((x) => x > 2 || x < 0.5).length,
    dalgalar: pencereler.map((w) => ({ uyeler: w.cift.uyeler.map((b) => b.s.kod), sonme: w.cift.uyeler[0].sonme, F0: w.cift.F0, t0: w.t0, t1: w.t1, cubuk: w.cubuklar.length,
      atanan: w.cift.uyeler.reduce((a, b) => a + b.cizgiler.filter((h) => h.cubuk).length, 0) })),
    plan: { maliyet: Math.round(plan.maliyet), kesisme: plan.kesisme }, planlar: planlar.sort((a, b) => a[1] - b[1]).slice(0, 10), T, kapanis: parcalar.map((p) => p.kapanis),
    slogan: slogan.durum,
    kisiler: kisiler.map((K) => ({ kod: K.kod, olay: K.olaylar.map(([f, d]) => `${f}:${d.goz ? 'gulumse' : d.ifade}`), kirp: K.kirpmalar, hareket: K.hareket.map(([f, t]) => `${f}:${t}`) })),
  };
}

// ---------- OKTOS: logo2 ile aynı yapı (harf .m maskesi > .h); görünür OKTOS ve slogan ölçüsü için görünmez kopyası
function adKur(D, W, renk) {
  const p = document.createElement('p');
  Object.assign(p.style, { position: 'absolute', left: '0px', top: D.ad.top + 'px', width: W + 'px', margin: '0', textAlign: 'center', color: renk,
    font: `900 ${D.ad.boyut}px/1 'Big Shoulders Display', sans-serif`, letterSpacing: '0.06em', textTransform: 'uppercase' });
  const harfler = [...'OKTOS'].map((c) => {
    const m = document.createElement('span');
    Object.assign(m.style, { display: 'inline-block', overflow: 'hidden', padding: '0.06em 0.01em 0.08em', margin: '-0.06em -0.01em -0.08em', verticalAlign: 'top' });
    const s = document.createElement('span');
    s.style.display = 'inline-block'; s.textContent = c;
    m.appendChild(s); p.appendChild(m);
    return s;
  });
  return { p, harfler };
}

// ---------- Slogan (stil/slogan.js'in filme uyarlaması; o dosya değişmez). Başlangıç = logo tamam, OKTOS dizili, durgun.
// Tek hareket dili mürekkep damlası: kenarda birikir (boncuk), sarkar, boynu incelir, kopar; kenarda kalan uç geri çekilir.
// Damla yerçekimiyle düşer, inişten hemen önce harfe dönüşür, konar (en çok %4 ezilme), gerekirse satır boyunca kayar.
// Damlalar OKTOS'un ALTINDAKİ katmanda (harf aralığından geçerken kenara değen kısmı OKTOS'un arkasında kalır).
// slogan.js'ten iki fark:
//   1. Konma kareleri İKİ YÖN BİRLİKTE planlanır: her damla, yatayda da dikeyde de çakışmasız olduğu ilk karede konar.
//      Müzik tek ses dosyası; konma ve kopma 'tik'leri iki yönde aynı karede kalır. Planın başı tam kareye yuvarlanır;
//      GERÇEĞE'nin konması tam kareye oturur (düşüşün başı kesirli olabilir).
//   2. Akış GSAP tween'i değil, sloganın yerel karesinin saf işlevi (damlanın yaşı = yerel kare − başlangıcı).
// Dönüş: { ciz(a) (a = yerel kare), isaretler (yerel kare), durum }.
const SL = { ORAN: 0.46, IZ: 0.06, SATIR: 1.3, Z: { topla: 8, ak: 11, sark: 7, cicek: 7, kayGec: 3 } };
// TR slogan (büyük harf, Türkçe noktalı İ; tipografik tırnaklar). Kullanıcı "Yapılabiiir" yazdı: standart yazım, İ'ler esner
const SATIR1 = 'YAPILABİLİR', SATIR2 = '“ŞÖYLE BİR ŞEY”LER';
// İ esnemesi (yerel kare, 2. satırın konmasından sonra): gec k bekler, kalk k'da %30 uzar (taban çizgisinden yukarı, %7
// incelir), sonra sönümlü yayla oturur (sure k'da biter); ikinci İ ara k sonra. Okunurluk: harf yerinde, yalnız boyu oynar
const ESNEME = { gec: 22, ara: 7, kalk: 7, sure: 26, boy: 0.3, en: 0.07 };
function esneme(t) {
  if (t <= 0 || t >= ESNEME.sure) return [1, 1];
  const P2O = (x) => 1 - (1 - x) * (1 - x);
  const u = t < ESNEME.kalk ? P2O(t / ESNEME.kalk) : Math.exp(-(t - ESNEME.kalk) / 3.2) * Math.cos((t - ESNEME.kalk) * 0.75);
  return [1 - ESNEME.en * u, 1 + ESNEME.boy * u];
}
function sloganKur(ctx, kat, onune, svgUst) {
  const { gsap, DIKEY, DIL } = ctx;
  const M = ctx.PALET.murekkep, VURGU = ctx.VURGU, YAZI = '"Big Shoulders Display"', NS = 'http://www.w3.org/2000/svg';
  const EO = gsap.parseEase(ctx.E.EO), KAY = CustomEase.create('S6KAY', '0.5,0,0.24,1'); // kayma: yumuşak kalkış, uzun sürtünme
  const P2I = gsap.parseEase('power2.in'), P2O = gsap.parseEase('power2.out');
  const ZS = SL.Z;
  const svgEl = (ust, ad, nit = {}) => { const e = document.createElementNS(NS, ad); for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v); ust.appendChild(e); return e; };
  const ezilme = (t2) => t2 < 0 ? 0 : Math.exp(-t2 / 2.4) * Math.cos(t2 * 0.8) * (1 - yumusak(6, 14, t2));

  // Ölçü (canvas measureText, 900)
  const tuval = document.createElement('canvas').getContext('2d');
  const olc = (metin, boy) => { tuval.font = `900 ${boy}px ${YAZI}`; return tuval.measureText(metin); };
  const genislik = (metin, boy) => olc(metin, boy).width;
  const mH = olc('H', 100);
  const TABAN = ((100 - (mH.fontBoundingBoxAscent + mH.fontBoundingBoxDescent)) / 2 + mH.fontBoundingBoxAscent) / 100;
  const BUYUK = mH.actualBoundingBoxAscent / 100;
  function diz(metin, boy, iz) {
    const h = [...metin], adv = h.map((c) => genislik(c, boy)), x = [];
    let imlec = 0;
    h.forEach((c, i) => { x.push(imlec); if (i < h.length - 1) imlec += adv[i] + (genislik(c + h[i + 1], boy) - adv[i] - genislik(h[i + 1], boy)) + iz; });
    return { h, x, adv, en: imlec + adv[adv.length - 1] };
  }
  function murekkep(c, boy) {
    const m = olc(c, boy);
    return { sol: -m.actualBoundingBoxLeft - m.width / 2, sag: m.actualBoundingBoxRight - m.width / 2, ust: -m.actualBoundingBoxAscent, alt: m.actualBoundingBoxDescent };
  }
  function altProfil(c, boy) {
    const w = Math.ceil(boy * 1.1), h = Math.ceil(boy * 1.3), ox = Math.ceil(boy * 0.05), by = Math.ceil(boy * 1.1);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.font = `900 ${boy}px ${YAZI}`; g.fillStyle = '#000'; g.fillText(c, ox, by);
    const v = g.getImageData(0, 0, w, h).data, alt = [];
    for (let x = 0; x < w; x++) {
      let y = -1;
      for (let yy = h - 1; yy >= 0; yy--) if (v[(yy * w + x) * 4 + 3] > 128) { y = yy; break; }
      if (y >= 0) alt.push({ x: x - ox + 0.5, y: y + 1 - by });
    }
    return alt;
  }

  // Yönün geometrisi: yazı boyu, fizik ölçeği, OKTOS harflerinin yeri ve alt profili (görünmez kopyadan), logo kenarları
  function geometri(dikey) {
    const D = FINAL_YER[dikey ? 'dikey' : 'yatay'], W = dikey ? 1080 : 1920, H = dikey ? 1920 : 1080;
    const B = Math.round(D.ad.boyut * SL.ORAN), OLC = D.ad.boyut / 132;
    const g = { dikey, D, W, H, B, OLC, G: 1.0 * OLC, R0: 0.16 * B, ARA: DIL === 'en' ? 1.0 : 0.55 };
    const { p, harfler } = adKur(D, W, M);
    p.style.visibility = 'hidden';
    kat.appendChild(p);
    g.adTaban = D.ad.top + TABAN * D.ad.boyut;
    g.adHarf = harfler.map((s) => {
      const c = s.textContent, m = olc(c, D.ad.boyut), sol = s.offsetLeft;
      return { c, sol, inkL: sol - m.actualBoundingBoxLeft, inkR: sol + m.actualBoundingBoxRight, profil: altProfil(c, D.ad.boyut).map((q) => ({ x: sol + q.x, y: g.adTaban + q.y })) };
    });
    p.remove();
    g.adOrta = (g.adHarf[0].sol + g.adHarf[4].sol + genislik('S', D.ad.boyut)) / 2;
    const LN = (x, y) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];
    g.AYAK = {
      sol: { alt: [LN(40, 472), LN(137.5, 472)], egikUst: LN(177.75, 431.75), ic: LN(137.5, 472), yanUst: LN(40, 358), dis: LN(40, 472), yon: 1 },
      sag: { alt: [LN(634, 472), LN(536.5, 472)], egikUst: LN(496.25, 431.75), ic: LN(536.5, 472), yanUst: LN(634, 358), dis: LN(634, 472), yon: -1 },
    };
    g.UC = { sol: LN(237.75, 491.75), sag: LN(436.25, 491.75) };
    g.bant = [D.ad.top + (TABAN - BUYUK) * D.ad.boyut, g.adTaban];
    return g;
  }
  // OKTOS harfinin altında damlanın asılacağı nokta: tabana oturan düz kısımdan, hedefe en yakın sütun
  function adDamlaNoktasi(g, o, hedefX) {
    const enAlt = Math.max(...o.profil.map((q) => q.y));
    const duzler = o.profil.filter((q) => q.y >= enAlt - 1.5), parca = [];
    for (const q of duzler) { const s = parca[parca.length - 1]; if (s && q.x - s.x1 <= 1.01) s.x1 = q.x; else parca.push({ x0: q.x, x1: q.x }); }
    let en = null;
    for (const s of parca) {
      const pay = Math.min(0.7 * g.R0, (s.x1 - s.x0) / 2);
      const x = Math.max(s.x0 + pay, Math.min(s.x1 - pay, hedefX)), d = Math.abs(x - hedefX) - (s.x1 - s.x0) * 0.01;
      if (!en || d < en.d) en = { x, d };
    }
    return [en.x, Math.max(...o.profil.filter((q) => Math.abs(q.x - en.x) <= 1).map((q) => q.y))];
  }

  // Damla planı (saf sayılar): kaynak yolu, harf, konma yeri ve karesi; başlangıç konma karesinden geri hesaplanır
  function damlaPlan(g, { yol, c, hedefX, taban, inisX, inisY, inis, kayBas, renk = M, oy = 0, kaynak = null, sutun = null, bant = null }) {
    const ak = yol.length > 1 ? ZS.ak : 0;
    const [ax, ay] = yol[yol.length - 1];
    const Lmax = 2.5 * g.R0, v0 = (Lmax - 0.9 * g.R0) * 2 / ZS.sark;
    const y0 = ay + Lmax, dy = inisY - y0;
    const tf = (-v0 + Math.sqrt(v0 * v0 + 2 * g.G * dy)) / g.G;
    const td = ZS.topla + ak + ZS.sark, tland = td + tf, t0 = inis - tland;
    const kay = kayBas === undefined ? inis + ZS.kayGec : kayBas;
    const mesafe = Math.abs(hedefX - inisX);
    const Ds = mesafe < 0.5 ? 0 : Math.round(8 + 1.6 * Math.sqrt(mesafe / g.OLC));
    const sure = Math.max(kay - t0 + Ds, tland + 16) + 1;
    let cicek = Math.min(ZS.cicek, tf * 0.5);
    if (bant) {
      const boy = g.R0 * 1.06 * 2 + g.R0 * 0.6, yHedef = bant[1] + boy + 2;
      const tau = (-v0 + Math.sqrt(v0 * v0 + 2 * g.G * Math.max(0, yHedef - y0))) / g.G;
      cicek = Math.max(2.5, Math.min(cicek, tf - tau));
    }
    kaynak = kaynak || `x${Math.round(ax / (2.5 * g.R0))}`;
    return { c, yol, ax, ay, Lmax, v0, y0, tf, td, tland, t0, inis, kay, Ds, sure, hedefX, inisX, inisY, taban, oy, renk, mk: murekkep(c, g.B), kaynak, sutun, bant, cicek };
  }
  // Damlanın a yaşındaki durumu (saf): boncuk, asılı, kalan, düşen şekil ve harf
  function damlaDurum(g, d, a) {
    const s = { boncuk: null, asili: null, kalan: null, dusen: null, harf: null }, R0 = g.R0;
    if (a <= 0) return s;
    const ak = d.yol.length > 1 ? ZS.ak : 0;
    if (a < ZS.topla + ak) {
      const r = R0 * EO(kis(a / ZS.topla));
      let p = d.yol[0];
      if (ak && a > ZS.topla) {
        const u = P2I(kis((a - ZS.topla) / ak));
        const L = d.yol.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - d.yol[i][0], q[1] - d.yol[i][1]), 0);
        let kalan = u * L;
        for (let i = 1; i < d.yol.length; i++) {
          const A = d.yol[i - 1], Bp = d.yol[i], l = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
          if (kalan <= l || i === d.yol.length - 1) { const t = l ? Math.min(1, kalan / l) : 1; p = [ara(A[0], Bp[0], t), ara(A[1], Bp[1], t), ara(A[2], Bp[2], t)]; break; }
          kalan -= l;
        }
      }
      const daral = ak ? yumusak(0.7, 1, kis((a - ZS.topla) / ak)) : yumusak(ZS.topla - 3, ZS.topla, a);
      s.boncuk = { x: p[0], y: p[1], rx: r * ara(1.3, 1.0, daral), ry: r, aci: p[2] - 90 };
      return s;
    }
    if (a < d.td) {
      const u = P2I(kis((a - ZS.topla - ak) / ZS.sark));
      s.asili = { wn: R0 * ara(1.7, 0.32, u), L: R0 * ara(0.9, 2.5, u), r: R0 * ara(1, 1.06, u) };
      return s;
    }
    const tau = a - d.td, geri = 1 - EO(kis(tau / 7));
    if (geri > 0.01) s.kalan = { wn: R0 * 0.32 * geri, L: R0 * 1.0 * geri, r: R0 * 0.42 * geri };
    if (tau < d.tf) {
      const yb = d.y0 + d.v0 * tau + 0.5 * g.G * tau * tau, v = d.v0 + g.G * tau;
      const x = d.sutun !== null
        ? d.sutun + (d.ax - d.sutun) * (1 - yumusak(d.y0, d.bant[0], yb)) + (d.inisX - d.sutun) * yumusak((d.bant[0] + d.bant[1]) / 2, d.taban - 0.7 * BUYUK * g.B, yb)
        : ara(d.ax, d.inisX, yumusak(0, 1, tau / d.tf));
      const m = kis((tau - (d.tf - d.cicek)) / d.cicek), sd = 1 - P2I(m);
      if (sd > 0.01) s.dusen = { x, yb, r: R0 * 1.06 * sd, T: R0 * (1.4 * Math.exp(-tau / 3) + 0.25 + 0.012 * v / g.OLC) * sd };
      if (m > 0) { const sl = 0.3 + 0.7 * P2O(m); s.harf = { x, taban: yb + (d.taban - d.inisY), sx: sl * (1 - 0.08 * (1 - m)), sy: sl * (1 + 0.1 * (1 - m)) }; }
      return s;
    }
    const qz = ezilme(a - d.tland), fx = d.t0 + a;
    s.harf = { x: d.Ds ? ara(d.inisX, d.hedefX, KAY(kis((fx - d.kay) / d.Ds))) : d.hedefX, taban: d.taban, sx: 1 + 0.025 * qz, sy: 1 - 0.04 * qz };
    return s;
  }
  // Satırdaki (ya da satıra inen) harfin ve düşen damlanın yatay mürekkep aralığı, f karesinde; satırda değilse null
  function satirAraligi(g, d, f) {
    const s = damlaDurum(g, d, Math.max(0, Math.min(d.sure, f - d.t0))), ust = d.taban - BUYUK * g.B;
    if (s.harf) { if (s.harf.taban + d.mk.alt * s.harf.sy < ust) return null; return [s.harf.x + d.mk.sol * s.harf.sx, s.harf.x + d.mk.sag * s.harf.sx]; }
    if (s.dusen && s.dusen.yb > ust) return [s.dusen.x - s.dusen.r, s.dusen.x + s.dusen.r];
    return null;
  }
  const sonOrtusme = (p, o) => Math.min(p.hedefX + p.mk.sag, o.hedefX + o.mk.sag) - Math.max(p.hedefX + p.mk.sol, o.hedefX + o.mk.sol);
  const izinli = (p, o) => Math.max(0, sonOrtusme(p, o));
  const degiyor = (a, b, izin) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > izin + 0.5;
  // Bu konma karesi bu yönde uygun mu: başlangıç ≥ 0, kaynak boş, yolunun hiçbir anında satırdaki başka harfe değmiyor
  function uygun(g, planlar, r, inis) {
    const p = damlaPlan(g, { ...r, inis });
    if (p.t0 < 0) return null;
    if (planlar.some((o) => (o.kaynak === p.kaynak || Math.abs(o.ax - p.ax) < 2.5 * g.R0) && p.t0 < o.t0 + o.td + 1 && o.t0 < p.t0 + p.td + 1)) return null;
    const son = Math.max(p.t0 + p.sure, ...planlar.map((o) => o.t0 + o.sure));
    for (let f = p.t0 + p.td; f <= son; f += 0.25) {
      const a = satirAraligi(g, p, f);
      if (!a) continue;
      for (const o of planlar) { const b = satirAraligi(g, o, f); if (b && degiyor(a, b, Math.max(izinli(p, o) - 1, sonOrtusme(p, o) - 0.4))) return null; }
    }
    return p;
  }
  // İki yönün istekleri sırayla, iki yönde de uygun olan ilk (tam) kareye konar; ardışık konmalar en az `aralik` kare arayla
  function planlaOrtak(istekler, ilk, aralik, sabit) {
    const P = { y: [...sabit.y], d: [...sabit.d] }, out = { y: [], d: [] };
    let t = Math.ceil(ilk);
    for (const r of istekler) {
      let bulundu = null;
      for (let inis = t; inis < t + 160 && !bulundu; inis++) {
        const py = uygun(GY, P.y, r.y, inis);
        if (!py) continue;
        const pd = uygun(GD, P.d, r.d, inis);
        if (pd) bulundu = { y: py, d: pd };
      }
      if (!bulundu) throw new Error(`slogan: '${r.y.c}' için iki yönde de çakışmasız konma bulunamadı`);
      for (const k of ['y', 'd']) { P[k].push(bulundu[k]); out[k].push(bulundu[k]); }
      t = bulundu.y.inis + aralik;
    }
    return out;
  }

  // Kaynak yolları (logo ayaklarının kenarları ve dokunaç uçları)
  const altYol = (g, taraf, oran) => { const [a, b] = g.AYAK[taraf].alt; return [[ara(a[0], b[0], oran), a[1], 90]]; };
  const egikYol = (g, taraf) => {
    const A = g.AYAK[taraf], n = A.yon > 0 ? 45 : 135, ust = [ara(A.ic[0], A.egikUst[0], 0.72), ara(A.ic[1], A.egikUst[1], 0.72)];
    return [[...ust, n], [A.ic[0], A.ic[1], ara(n, 90, 0.5)], [A.ic[0] - A.yon * 0.75 * g.R0, A.ic[1], 90]];
  };
  const yanYol = (g, taraf) => {
    const A = g.AYAK[taraf], n = A.yon > 0 ? 180 : 0, ust = [A.dis[0], ara(A.yanUst[1], A.dis[1], 0.4)];
    return [[...ust, n], [A.dis[0], A.dis[1], A.yon > 0 ? 135 : 45], [A.dis[0] + A.yon * 0.75 * g.R0, A.dis[1], 90]];
  };
  const ucYol = (g, taraf) => [[g.UC[taraf][0], g.UC[taraf][1] + 0.25 * g.R0, 90]];

  // ---------- Plan: iki yön birlikte (konma kareleri ortak), DOM yalnız bu yön için
  const GY = geometri(false), GD = geometri(true), g = DIKEY ? GD : GY;
  const isaretler = [];
  let planlar, ger = null;
  if (DIL === 'en') {
    // EN "OKAY TO DO'S": OKTOS'un O K T O S harflerinin altından birer damla (küçük "OKTOS" yankısı) → "OK · TO · S";
    // dokunaç uçlarından damlalar harf aralığından (O|K, O|S) süzülüp A Y / D O olur; kesme işareti en son, vurgu renginde
    const planEN = (g) => {
      const L = diz('OKAY TO DO’S', g.B, SL.IZ * g.B), capH = BUYUK * g.B;
      const sol = g.adOrta - L.en / 2, taban = g.adTaban + g.ARA * capH + capH;
      const yuva = L.h.map((c, i) => ({ c, x: sol + L.x[i] + L.adv[i] / 2 }));
      const miras = [0, 1, 5, 6, 11], inisler = [30, 35, 40, 45, 50], kayBas = 58;
      const mirasD = miras.map((yi, j) => {
        const [ax, ay] = adDamlaNoktasi(g, g.adHarf[j], yuva[yi].x);
        return damlaPlan(g, { yol: [[ax, ay, 90]], c: yuva[yi].c, hedefX: yuva[yi].x, taban, inisX: ax, inisY: taban, inis: inisler[j], kayBas: kayBas + j * 1.5 });
      });
      const bosluk = (i) => (g.adHarf[i].inkR + g.adHarf[i + 1].inkL) / 2;
      const sutun = { sol: bosluk(0), sag: bosluk(3) };
      const yerlesik = mirasD.map((d) => ({ x: d.hedefX, mk: d.mk }));
      const dolgu = [{ yi: 3, taraf: 'sol' }, { yi: 8, taraf: 'sag' }, { yi: 2, taraf: 'sol' }, { yi: 9, taraf: 'sag' }, { yi: 10, taraf: 'sag' }];
      const istek = dolgu.map((f) => {
        const y = yuva[f.yi], mk = murekkep(y.c, g.B), apo = y.c === '’';
        const solK = yerlesik.filter((o) => o.x < y.x).map((o) => o.x + o.mk.sag).reduce((a, b) => Math.max(a, b), -Infinity);
        const sagK = yerlesik.filter((o) => o.x > y.x).map((o) => o.x + o.mk.sol).reduce((a, b) => Math.min(a, b), Infinity);
        const inisX = Math.max(solK - mk.sol + 1.5, Math.min(sagK - mk.sag - 1.5, sutun[f.taraf]));
        yerlesik.push({ x: y.x, mk });
        return { yol: ucYol(g, f.taraf), c: y.c, hedefX: y.x, taban, inisX, inisY: apo ? taban + mk.alt : taban, renk: apo ? VURGU : M, oy: apo ? -(mk.ust + mk.alt) / 2 : 0,
          kaynak: 'uc-' + f.taraf, sutun: sutun[f.taraf], bant: g.bant };
      });
      return { mirasD, istek, sonMiras: Math.max(...mirasD.map((d) => d.kay + d.Ds)) };
    };
    const ey = planEN(GY), ed = planEN(GD);
    const dol = planlaOrtak(ey.istek.map((r, i) => ({ y: r, d: ed.istek[i] })), Math.max(ey.sonMiras, ed.sonMiras), 4, { y: ey.mirasD, d: ed.mirasD });
    planlar = DIKEY ? [...ed.mirasD, ...dol.d] : [...ey.mirasD, ...dol.y];
    // 'tik': beş OKTOS harfinin konması ve ilk üç eklenen harf (8); kesme işaretinin konması 'slogan-otur'
    ey.mirasD.forEach((d) => isaretler.push({ kare: d.inis, tur: 'tik', ek: { ad: 'slogan' } }));
    dol.y.slice(0, 3).forEach((d) => isaretler.push({ kare: d.inis, tur: 'tik', ek: { ad: 'slogan' } }));
    isaretler.push({ kare: dol.y[dol.y.length - 1].inis, tur: 'tik', ek: { ad: 'slogan-otur' } });
  } else {
    // TR "YAPILABİLİR “ŞÖYLE BİR ŞEY”LER": YAPILABİLİR'in 11 harfi logonun iki ayağının kenarlarından karışık sırayla
    // damlar, iki yandan ortaya sıraya girer; 2. satır tek parça 1. satırın altından sıyrılır, tek düşüşle oturur (tırnaklar
    // vurgu renginde). Sonra iki noktalı İ sırayla yukarı esner ve yaylanıp oturur: "yapılabiiir" (ses vurgusu)
    const planTR = (g) => {
      const L1 = diz(SATIR1, g.B, SL.IZ * g.B), capH = BUYUK * g.B;
      const taban1 = g.adTaban + g.ARA * capH + capH, taban2 = taban1 + SL.SATIR * g.B, sol1 = g.adOrta - L1.en / 2;
      const yuva = L1.h.map((c, i) => ({ c, x: sol1 + L1.x[i] + L1.adv[i] / 2 }));
      const solSira = [5, 4, 3, 2, 1, 0], sagSira = [6, 7, 8, 9, 10];
      const solKaynak = [['egik'], ['alt', 0.66], ['alt', 0.38], ['yan'], ['egik'], ['alt', 0.66]];
      const sagKaynak = [['egik'], ['alt', 0.66], ['alt', 0.38], ['yan'], ['egik']];
      const istek = [];
      for (let i = 0; i < Math.max(solSira.length, sagSira.length); i++) {
        for (const [sira, kaynak, taraf] of [[sagSira, sagKaynak, 'sag'], [solSira, solKaynak, 'sol']]) {
          if (i >= sira.length) continue;
          const [tur, oran] = kaynak[i], yi = sira[i];
          const yol = tur === 'alt' ? altYol(g, taraf, oran) : tur === 'egik' ? egikYol(g, taraf) : yanYol(g, taraf);
          istek.push({ yol, c: yuva[yi].c, hedefX: yuva[yi].x, taban: taban1, inisX: yol[yol.length - 1][0], inisY: taban1 });
        }
      }
      return { istek, taban1, taban2 };
    };
    const ty = planTR(GY), td = planTR(GD);
    const dol = planlaOrtak(ty.istek.map((r, i) => ({ y: r, d: td.istek[i] })), 38, 4, { y: [], d: [] });
    planlar = DIKEY ? dol.d : dol.y;
    // 2. satır: iki yönde aynı tam karede konar (son harf konduktan sonra, satırın son kayması biterken)
    const k2 = SATIR2;
    const gerHesap = (g, t, pl) => {
      const mk = murekkep(k2, g.B), bas = t.taban1 - mk.alt - 1, tf = Math.sqrt(2 * (t.taban2 - bas) / g.G);
      const sonKonma = Math.max(...pl.map((d) => d.t0 + d.tland)), sonKayma = Math.max(...pl.map((d) => d.kay + d.Ds));
      return { bas, tf, iste: Math.max(sonKonma + 6, sonKayma - tf) + tf };
    };
    const hy = gerHesap(GY, ty, dol.y), hd = gerHesap(GD, td, dol.d), h = DIKEY ? hd : hy, t = DIKEY ? td : ty;
    const inisG = Math.round(Math.max(hy.iste, hd.iste));
    ger = { taban1: t.taban1, bas: h.bas, tf: h.tf, t0: inisG - h.tf, tland: inisG, sure: h.tf + 18 };
    // İ esnemesi: 2. satır oturup ezilmesi bitince, soldaki İ önce, sağdaki ESNEME.ara k sonra (iki yönde aynı karede)
    planlar.filter((d) => d.c === 'İ').sort((a, b) => a.hedefX - b.hedefX).forEach((d, j) => { d.esne = inisG + ESNEME.gec + j * ESNEME.ara; });
    // 'tik': YAPILABİLİR'in 11 konmasından eşit aralıklı 8'i; 2. satırın konması 'slogan-otur'; İ'lerin esneme doruğu 'slogan-i'
    const konma = dol.y.map((d) => d.inis).sort((a, b) => a - b);
    [...new Set(Array.from({ length: 8 }, (_, j) => Math.round((j * (konma.length - 1)) / 7)))].forEach((i) => isaretler.push({ kare: konma[i], tur: 'tik', ek: { ad: 'slogan' } }));
    isaretler.push({ kare: inisG, tur: 'tik', ek: { ad: 'slogan-otur' } });
    planlar.filter((d) => d.esne != null).forEach((d) => isaretler.push({ kare: d.esne + ESNEME.kalk, tur: 'tik', ek: { ad: 'slogan-i' } }));
  }

  // ---------- DOM (bu yön): harfler OKTOS'un altında, damlalar logonun üstünde
  const sk = document.createElement('div');
  sk.dataset.s6 = 'slogan';
  sk.setAttribute('role', 'img');
  sk.setAttribute('aria-label', DIL === 'en' ? "Okay to do's" : 'Yapılabilir “şöyle bir şey”ler');
  Object.assign(sk.style, { position: 'absolute', left: '0px', top: '0px', width: g.W + 'px', height: g.H + 'px', pointerEvents: 'none' });
  kat.insertBefore(sk, onune);
  const damlaKat = svgEl(svgUst, 'g');
  const harfEl = (ust, c, renk = M) => {
    const e = document.createElement('span');
    e.textContent = c;
    Object.assign(e.style, { position: 'absolute', left: '0px', top: '0px', margin: '0', color: renk, whiteSpace: 'pre', font: `900 ${g.B}px/1 ${YAZI}, sans-serif`, fontKerning: 'normal', visibility: 'hidden' });
    ust.appendChild(e);
    return e;
  };
  const koy = (e, cx, taban, sx = 1, sy = 1, oy = 0, gor = true) => {
    if (!gor) { e.style.visibility = 'hidden'; return; }
    e.style.visibility = 'visible';
    e.style.transformOrigin = `50% ${f1(TABAN * g.B - oy)}px`;
    e.style.transform = `translate(${cx.toFixed(2)}px, ${(taban - TABAN * g.B).toFixed(2)}px) translateX(-50%) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  };
  const asiliD = (ax, ay, wn, L, r) => {
    const cy = ay + Math.max(L - r, 0), ust = ay - 3, h = cy - ust;
    return `M${f1(ax - wn / 2)} ${f1(ust)} C${f1(ax - wn / 2)} ${f1(ust + h * 0.55)} ${f1(ax - r)} ${f1(cy - r * 0.95)} ${f1(ax - r)} ${f1(cy)}`
      + ` A${f1(r)} ${f1(r)} 0 0 0 ${f1(ax + r)} ${f1(cy)} C${f1(ax + r)} ${f1(cy - r * 0.95)} ${f1(ax + wn / 2)} ${f1(ust + h * 0.55)} ${f1(ax + wn / 2)} ${f1(ust)}Z`;
  };
  const dusenD = (x, yb, r, T) => {
    const cy = yb - r, uc = cy - r - T;
    return `M${f1(x)} ${f1(uc)} C${f1(x + r * 0.28)} ${f1(uc + T * 0.55)} ${f1(x + r)} ${f1(cy - r * 0.75)} ${f1(x + r)} ${f1(cy)}`
      + ` A${f1(r)} ${f1(r)} 0 0 1 ${f1(x - r)} ${f1(cy)} C${f1(x - r)} ${f1(cy - r * 0.75)} ${f1(x - r * 0.28)} ${f1(uc + T * 0.55)} ${f1(x)} ${f1(uc)}Z`;
  };
  for (const d of planlar) {
    const ust = svgEl(damlaKat, 'g', { fill: d.renk });
    Object.assign(d, { boncuk: svgEl(ust, 'ellipse'), asili: svgEl(ust, 'path'), kalan: svgEl(ust, 'path'), dusen: svgEl(ust, 'path'), harf: harfEl(sk, d.c, d.renk) });
  }
  if (ger) {
    // GERÇEĞE 1. satırın taban çizgisinin altından sıyrılır (şerit maskesi), Ğ'nin şapkası son konumda maskenin altında kalır
    const serit = document.createElement('div');
    ger.seritUst = ger.taban1 + 1;
    Object.assign(serit.style, { position: 'absolute', left: '0px', top: f1(ger.seritUst) + 'px', width: g.W + 'px', height: f1(g.H - ger.seritUst) + 'px', overflow: 'hidden' });
    sk.appendChild(serit);
    // Tırnaklar vurgu renginde (filmin tek vurgu rengi: dilek alt çizgisi, son parça kaynakları)
    ger.e = harfEl(serit, '');
    ger.e.innerHTML = SATIR2.replace(/[“”]/g, (q) => `<span style="color:${VURGU}">${q}</span>`);
    ger.e.style.letterSpacing = f1(SL.IZ * g.B) + 'px';
    ger.orta = g.adOrta + SL.IZ * g.B / 2;
  }
  const yolYaz = (e, v) => { if (v) { e.setAttribute('d', v); e.style.display = ''; } else e.style.display = 'none'; };
  const ciz = (a) => {
    for (const d of planlar) {
      const s = damlaDurum(g, d, Math.max(0, Math.min(d.sure, a - d.t0)));
      if (s.boncuk) {
        const b = s.boncuk;
        for (const [n, v] of Object.entries({ cx: 0, cy: 0, rx: f1(b.rx), ry: f1(b.ry), transform: `translate(${f1(b.x)} ${f1(b.y)}) rotate(${f1(b.aci)})` })) d.boncuk.setAttribute(n, v);
        d.boncuk.style.display = '';
      } else d.boncuk.style.display = 'none';
      yolYaz(d.asili, s.asili && asiliD(d.ax, d.ay, s.asili.wn, s.asili.L, s.asili.r));
      yolYaz(d.kalan, s.kalan && asiliD(d.ax, d.ay, s.kalan.wn, s.kalan.L, s.kalan.r));
      yolYaz(d.dusen, s.dusen && dusenD(s.dusen.x, s.dusen.yb, s.dusen.r, s.dusen.T));
      if (s.harf) {
        const [ex, ey] = d.esne != null ? esneme(a - d.esne) : [1, 1];
        koy(d.harf, s.harf.x, s.harf.taban, s.harf.sx * ex, s.harf.sy * ey, d.oy);
      } else koy(d.harf, 0, 0, 1, 1, 0, false);
    }
    if (ger) {
      const ya = Math.max(0, Math.min(ger.sure, a - ger.t0));
      if (ya <= 0) { ger.e.style.visibility = 'hidden'; return; }
      const qz = ya < ger.tf ? 0 : ezilme(ya - ger.tf), taban = ger.bas + 0.5 * g.G * Math.min(ya, ger.tf) ** 2;
      ger.e.style.visibility = 'visible';
      ger.e.style.transformOrigin = `50% ${f1(TABAN * g.B)}px`;
      ger.e.style.transform = `translate(${ger.orta.toFixed(2)}px, ${(taban - TABAN * g.B - ger.seritUst).toFixed(2)}px) translateX(-50%) scale(${(1 + 0.02 * qz).toFixed(4)}, ${(1 - 0.04 * qz).toFixed(4)})`;
    }
  };
  // Hareketin sonu (iki yön): ondan sonra en az 90 k durgun bekleme kalmalı
  const hareketSonu = Math.max(...planlar.map((d) => (d.esne != null ? Math.max(d.t0 + d.sure, d.esne + ESNEME.sure) : d.t0 + d.sure)), ger ? ger.t0 + ger.sure : 0);
  const durum = { dil: DIL, hareketSonu: +hareketSonu.toFixed(1), bekleme: +(SLOGAN_SURE - hareketSonu).toFixed(1), konma: planlar.map((d) => [d.c, d.inis]), ger: ger && ger.tland };
  return { ciz, isaretler, durum };
}
