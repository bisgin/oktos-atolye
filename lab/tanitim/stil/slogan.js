// Kapanış sloganı (stil denemesi, filmin son satırı; ≈2 sn akış + ≥1,5 sn bekleme, 60 fps).
// İkinci tur (kullanıcı: "akıcılık iyi değil, harfler logonun siyah kenarlarından düşebilir, doğal, 60 fps, OKTOS ile
// uygun kalınlıkta; son çıktıda ince harf var gibi"). Bu yüzden:
//   - Bütün slogan harfleri Big Shoulders Display 900 (OKTOS ile aynı kalınlık), OKTOS'un ≈0,46 katı boyda. İnce harf,
//     kalınlık geçişi, titreyen hayalet kopya, 12 fps adım YOK. Her şey her karede sürekli hesaplanır.
//   - Tek hareket dili: MÜREKKEP DAMLASI. Kenarda mürekkep birikir (boncuk), sarkar ve uzar, boynu incelir, kopar;
//     kenarda kalan küçük uç kenara geri çekilir (iz kalmaz). Damla yerçekimiyle hızlanarak düşer (y = v0·t + g·t²/2),
//     inişten hemen önce harfe dönüşür (damla küçülür, harf damlanın içinden büyür), konar: en çok %4 ezilir, yumuşak
//     oturur. Gerekirse satır boyunca sürtünmeyle kayıp yerine girer (yavaş başlar, uzun yavaşlar).
//   - Damlalar OKTOS yazısının ALTINDAKİ katmanda: harflerin arasındaki boşluktan geçerken kenarlara değen kısmı
//     OKTOS'un arkasında kalır, OKTOS'un önünden hiçbir şey geçmez. Logo ve OKTOS son karede logo2 ile birebir.
// EN "OKAY TO DO'S" (?dil=en), kelime oyunu hareketle okunur:
//   1. OKTOS'un O K T O S harflerinin alt kenarında birer damla birikir, düşer ve tam altına küçük O K T O S olarak konar
//      (bir an küçük bir "OKTOS" yankısı). Beşi birlikte, ufak gecikmeyle kayıp "OK · TO · S" düzenine girer, aralar açılır.
//   2. Logonun iki dokunaç ucundan (logonun en alt noktaları) damlalar düşer, OKTOS'un harf aralarından (O|K, O|S)
//      süzülür, OKTOS'un altına çıkınca harfe dönüşür, açılan yerlere A Y / D O olarak konar, yerine kayar. Aynı uçta
//      bir damla kopmadan sonraki birikmez. Kesme işareti en son, vurgu renginde tek damla.
// TR "OLASILIKTAN GERÇEĞE" (?dil=tr), iki satır:
//   1. "OLASILIKTAN" = olasılık: harfler logonun iki ayağının farklı kenarlarından (alt kenar, eğik iç kenar boyunca akıp
//      köşeden, dış yan kenar boyunca akıp dış köşeden) karışık sırayla damlar; iki yandan ortaya doğru sıraya girer.
//   2. "GERÇEĞE" = gerçek: tek parça halinde OLASILIKTAN satırının altından sıyrılır, tek ve kararlı bir düşüşle ikinci
//      satıra oturur (tek tık, en çok %4 ezilme).
// Aralıklar ölçülür: document.fonts.ready'den sonra canvas measureText ile ilerleyiş ve çift aralığı (kerning);
// OKTOS harflerinin mürekkep sınırı ve alt profili ekran dışı tuvalde piksel taranarak bulunur.
// Konma kareleri planla() ile seçilir: istenen ritimde (≥4 kare arayla) ve hiçbir harf yolunun hiçbir anında satırdaki
// başka bir harfe değmeyecek ilk kare (çift aralığından gelen son örtüşme hariç). Uzunluk: hareketin sonu + ≥1,5 sn.
// Bütün durum tek bir duraklatılmış GSAP akışında (her damlanın yaşı bir ara değer; tl.seek); kare(t) her anı baştan
// kurar. tanitim.denetle() her karede harf çakışmasını ve konum sıçramasını ölçer.
// Sorgu: ?yon=yatay|dikey ?dil=tr|en ?t=2.4 (kareyi dondur) ?hiz=0.5 ?sayac=0 ?cek=1 (scripts/film-cek.py, film-kare.py)
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';
import { LOGO_D, LOGO_ORTA } from './logo-veri.js';

gsap.registerPlugin(CustomEase);
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const DIL = q.get('dil') === 'en' ? 'en' : 'tr';
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const FPS = 60;
const k = (n) => n / FPS; // kare → saniye
const NS = 'http://www.w3.org/2000/svg';
const M = '#1d1d20', VURGU = '#bf5519';
const YAZI = '"Big Shoulders Display"';

// ---------- Eğriler
const EO = CustomEase.create('EO', '0.16,1,0.3,1');   // yavaşlayarak oturur (film.js ile aynı)
const KAY = CustomEase.create('KAY', '0.5,0,0.24,1'); // kayma: yumuşak kalkış, uzun sürtünme
const P2I = gsap.parseEase('power2.in'), P2O = gsap.parseEase('power2.out');

// ---------- Yerleşim (logo ve "OKTOS" logo2.js ile aynı)
const D = DIKEY ? {
  logo: { cx: 540, cy: 840, s: 1.3 }, ad: { top: 1196, boyut: 176 },
} : {
  logo: { cx: 960, cy: 412, s: 1.0 }, ad: { top: 676, boyut: 132 },
};
const ORAN = 0.46;                       // slogan boyu / OKTOS boyu
const B = Math.round(D.ad.boyut * ORAN); // slogan yazı boyu (px): yatay 61, dikey 81
const IZ = 0.06;                         // harf aralığı (em), OKTOS ile aynı
const ARA = DIL === 'en' ? 1.0 : 0.55;   // OKTOS taban çizgisi → slogan büyük harf tepesi (slogan büyük harf yüksekliği)
const SATIR = 1.3;                       // TR: iki satırın taban çizgileri arası (slogan em'i)
const OLC = D.ad.boyut / 132;            // dikeyde fizik ölçeği
const G = 1.0 * OLC;                     // yerçekimi (px/kare²)
const R0 = 0.16 * B;                     // damla yarıçapı
const Z = { topla: 8, ak: 11, sark: 7, cicek: 7, kayGec: 3 }; // damla evreleri (kare)
let TOPLAM = 228; // kurulumda: hareketin bitişi + ≥1,5 sn bekleme (en çok 240)

// ---------- Yardımcılar
const ara = (a, b, t) => a + (b - a) * t;
const kis = (x) => Math.max(0, Math.min(1, x));
const yumusak = (a, b, x) => { const t = kis((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const f1 = (v) => v.toFixed(1);
// Konma ezilmesi: inişte 1, sönümlü salınımla 0 (14 karede tam 0)
const ezilme = (t2) => t2 < 0 ? 0 : Math.exp(-t2 / 2.4) * Math.cos(t2 * 0.8) * (1 - yumusak(6, 14, t2));
function el(ust, ad, nit = {}) {
  const e = document.createElementNS(NS, ad);
  for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v);
  ust.appendChild(e);
  return e;
}

// ---------- Sahne
const sahne = document.getElementById('sahne'), svg = document.getElementById('cizim');
const yaziKat = document.getElementById('yazi'), sloganKat = document.getElementById('slogan');
const sayac = document.getElementById('sayac'), hataEl = document.getElementById('hata');
for (const e of [sahne, yaziKat, sloganKat]) Object.assign(e.style, { width: W + 'px', height: H + 'px' });
svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();
if (q.get('sayac') === '0' || CEKIM) sayac.hidden = true;
document.documentElement.lang = DIL;

// Logo: logo2'nin son karesi (tek yol, ölçek 1); damlalar logonun üstünde (siyah üstüne siyah: dikişsiz), OKTOS'un altında
const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];
el(svg, 'path', { fill: M, 'fill-rule': 'evenodd', d: LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')) });
const damlaKat = el(svg, 'g');

// ---------- Ölçü
const tuval = document.createElement('canvas').getContext('2d');
const olc = (metin, boy) => { tuval.font = `900 ${boy}px ${YAZI}`; return tuval.measureText(metin); };
const genislik = (metin, boy) => olc(metin, boy).width;
let TABAN = 0.885, BUYUK = 0.8; // em: satır kutusu (line-height 1) tepesinden taban çizgisine; büyük harf yüksekliği
function metrik() {
  const m = olc('H', 100);
  TABAN = ((100 - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent) / 100;
  BUYUK = m.actualBoundingBoxAscent / 100;
}
// Harfleri dizer: x = harfin sol kenarı (satır başına göre). İlerleyiş + çift aralığı + iz.
function diz(metin, boy, iz) {
  const h = [...metin], adv = h.map((c) => genislik(c, boy)), x = [];
  let imlec = 0;
  h.forEach((c, i) => {
    x.push(imlec);
    if (i < h.length - 1) imlec += adv[i] + (genislik(c + h[i + 1], boy) - adv[i] - genislik(h[i + 1], boy)) + iz;
  });
  return { h, x, adv, en: imlec + adv[adv.length - 1] };
}
// Harfin mürekkep sınırı (ortasına göre) ve dikey sınırı (taban çizgisine göre; yukarı eksi)
function murekkep(c, boy) {
  const m = olc(c, boy);
  return { sol: -m.actualBoundingBoxLeft - m.width / 2, sag: m.actualBoundingBoxRight - m.width / 2, ust: -m.actualBoundingBoxAscent, alt: m.actualBoundingBoxDescent };
}
// OKTOS harfinin alt profili: her sütunda en alttaki mürekkep (taban çizgisine göre), ekran dışı tuvalde piksel taraması
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

// ---------- "OKTOS": logo2.js yaziKur ile aynı yapı (harfler .m > .h), son karedeki gibi yerinde
let adHarf = [], adTaban = 0, adOrta = W / 2;
function adKur() {
  const ad = document.createElement('p');
  ad.className = 'ad';
  Object.assign(ad.style, { top: D.ad.top + 'px', fontSize: D.ad.boyut + 'px' });
  const harfler = [...'OKTOS'].map((h) => { const m = document.createElement('span'); m.className = 'm'; const s = document.createElement('span'); s.className = 'h'; s.textContent = h; m.appendChild(s); ad.appendChild(m); return s; });
  yaziKat.appendChild(ad);
  adTaban = D.ad.top + TABAN * D.ad.boyut;
  adHarf = harfler.map((s) => {
    const c = s.textContent, m = olc(c, D.ad.boyut), sol = s.offsetLeft;
    return { c, sol, inkL: sol - m.actualBoundingBoxLeft, inkR: sol + m.actualBoundingBoxRight, profil: altProfil(c, D.ad.boyut).map((p) => ({ x: sol + p.x, y: adTaban + p.y })) };
  });
  adOrta = (adHarf[0].sol + adHarf[4].sol + genislik('S', D.ad.boyut)) / 2; // görünen harflerin ortası (son harfin izi hariç)
}
// OKTOS harfinin altında damlanın asılacağı nokta: tabana oturan düz kısımdan, hedefe en yakın sütun
function adDamlaNoktasi(o, hedefX) {
  const enAlt = Math.max(...o.profil.map((p) => p.y));
  const duz = o.profil.filter((p) => p.y >= enAlt - 1.5);
  // düz sütunları ardışık parçalara ayır, damla sığan (≥1,4 R0) parçalar içinde hedefe en yakın nokta
  const parca = [];
  for (const p of duz) { const s = parca[parca.length - 1]; if (s && p.x - s.x1 <= 1.01) s.x1 = p.x; else parca.push({ x0: p.x, x1: p.x }); }
  let en = null;
  for (const s of parca) {
    const pay = Math.min(0.7 * R0, (s.x1 - s.x0) / 2);
    const x = Math.max(s.x0 + pay, Math.min(s.x1 - pay, hedefX));
    const d = Math.abs(x - hedefX) - (s.x1 - s.x0) * 0.01;
    if (!en || d < en.d) en = { x, d };
  }
  const x = en.x;
  const y = Math.max(...o.profil.filter((p) => Math.abs(p.x - x) <= 1).map((p) => p.y));
  return [x, y];
}

// ---------- Logo kaynak kenarları (logo birimi → ekran). Ayak: alt kenar, eğik iç kenar (köşeye iner), dış yan kenar
const LN = (x, y) => logoNokta([x, y]);
const AYAK = {
  sol: { alt: [LN(40, 472), LN(137.5, 472)], egikUst: LN(177.75, 431.75), ic: LN(137.5, 472), yanUst: LN(40, 358), dis: LN(40, 472), yon: 1 },
  sag: { alt: [LN(634, 472), LN(536.5, 472)], egikUst: LN(496.25, 431.75), ic: LN(536.5, 472), yanUst: LN(634, 358), dis: LN(634, 472), yon: -1 },
};
const UC = { sol: LN(237.75, 491.75), sag: LN(436.25, 491.75) };

// ---------- Damla şekilleri (SVG yol). Boncuk: kenar üstünde elips (yarısı mürekkebin içinde, görünmez)
function asiliD(ax, ay, wn, L, r) {
  // Kenarda asılı damla: boyun (wn) kenarın 3 px içinden başlar, ampul merkezi ay + L − r
  const cy = ay + Math.max(L - r, 0), ust = ay - 3, h = cy - ust;
  return `M${f1(ax - wn / 2)} ${f1(ust)} C${f1(ax - wn / 2)} ${f1(ust + h * 0.55)} ${f1(ax - r)} ${f1(cy - r * 0.95)} ${f1(ax - r)} ${f1(cy)}`
    + ` A${f1(r)} ${f1(r)} 0 0 0 ${f1(ax + r)} ${f1(cy)} C${f1(ax + r)} ${f1(cy - r * 0.95)} ${f1(ax + wn / 2)} ${f1(ust + h * 0.55)} ${f1(ax + wn / 2)} ${f1(ust)}Z`;
}
function dusenD(x, yb, r, T) {
  // Serbest damla: ampulün altı yb, yukarı sivrilen kuyruk T
  const cy = yb - r, uc = cy - r - T;
  return `M${f1(x)} ${f1(uc)} C${f1(x + r * 0.28)} ${f1(uc + T * 0.55)} ${f1(x + r)} ${f1(cy - r * 0.75)} ${f1(x + r)} ${f1(cy)}`
    + ` A${f1(r)} ${f1(r)} 0 0 1 ${f1(x - r)} ${f1(cy)} C${f1(x - r)} ${f1(cy - r * 0.75)} ${f1(x - r * 0.28)} ${f1(uc + T * 0.55)} ${f1(x)} ${f1(uc)}Z`;
}

// ---------- Harf öğesi
function harfEl(c, renk = M) {
  const e = document.createElement('span');
  e.className = 'sh'; e.textContent = c;
  e.style.fontSize = B + 'px';
  if (renk !== M) e.style.color = renk;
  sloganKat.appendChild(e);
  return e;
}
// Harfi taban çizgisi ortası (cx, taban) olacak biçimde koyar; ölçek (oy: dönüşüm merkezinin tabandan yüksekliği, px)
function koy(e, cx, taban, sx = 1, sy = 1, oy = 0, gor = true) {
  if (!gor) { e.style.visibility = 'hidden'; return; }
  e.style.visibility = 'visible';
  e.style.transformOrigin = `50% ${f1(TABAN * B - oy)}px`;
  e.style.transform = `translate(${(cx).toFixed(2)}px, ${(taban - TABAN * B).toFixed(2)}px) translateX(-50%) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
}

// ---------- Damla: kaynak → boncuk → (kenar boyunca akış) → sarkma → kopma → düşüş → harfe dönüşüm → konma → kayma
const tl = gsap.timeline({ paused: true });
const damlalar = [];
// Plan (saf sayılar): kaynak yolu [[x, y, dış normal açısı]...] (son nokta asılma noktası), harf, konma yeri ve karesi.
// Kopmadaki hız sarkmanın son hızıdır (konum ve hız sürekli); başlangıç karesi konma karesinden geri hesaplanır.
function damlaPlan({ yol, c, hedefX, taban, inisX, inisY, inis, kayBas, renk = M, oy = 0, kaynak = null, sutun = null, bant = null }) {
  const ak = yol.length > 1 ? Z.ak : 0;
  const [ax, ay] = yol[yol.length - 1];
  const Lmax = 2.5 * R0;
  const v0 = (Lmax - 0.9 * R0) * 2 / Z.sark;
  const y0 = ay + Lmax, dy = inisY - y0;
  const tf = (-v0 + Math.sqrt(v0 * v0 + 2 * G * dy)) / G; // düşüş süresi (kare, kesirli)
  const td = Z.topla + ak + Z.sark;                       // kopma (damla yaşı)
  const tland = td + tf, t0 = inis - tland;
  const kay = kayBas === undefined ? inis + Z.kayGec : kayBas;
  const mesafe = Math.abs(hedefX - inisX);
  const Ds = mesafe < 0.5 ? 0 : Math.round(8 + 1.6 * Math.sqrt(mesafe / OLC)); // uzun kayma daha uzun sürer (ivme düşük)
  const sure = Math.max(kay - t0 + Ds, tland + 16) + 1;
  // Harfe dönüşüm inişten en çok Z.cicek kare önce başlar; damla bir engel bandından (OKTOS) geçiyorsa, damlanın
  // tepesi bandın altına çıkmadan başlamaz (harf OKTOS'un arkasında açılmasın)
  let cicek = Math.min(Z.cicek, tf * 0.5);
  if (bant) {
    const boy = R0 * 1.06 * 2 + R0 * 0.6; // ampul + kısa kuyruk
    const yHedef = bant[1] + boy + 2, tau = (-v0 + Math.sqrt(v0 * v0 + 2 * G * Math.max(0, yHedef - y0))) / G;
    cicek = Math.max(2.5, Math.min(cicek, tf - tau));
  }
  // Kaynak anahtarı: aynı asılma noktasında (≈2,5 R0 içinde) iki damla aynı anda birikmesin
  kaynak = kaynak || `x${Math.round(ax / (2.5 * R0))}`;
  return { c, yol, ax, ay, Lmax, v0, y0, tf, td, tland, t0, inis, kay, Ds, sure, hedefX, inisX, inisY, taban, oy, renk, mk: murekkep(c, B), yas: 0, kaynak, sutun, bant, cicek };
}
function damlaDom(d) {
  const g = el(damlaKat, 'g', { fill: d.renk });
  Object.assign(d, { boncuk: el(g, 'ellipse'), asili: el(g, 'path'), kalan: el(g, 'path'), dusen: el(g, 'path'), harf: harfEl(d.c, d.renk) });
  if (d.t0 < 0) throw new Error(`damla ${d.c} çok erken başlıyor (t0=${d.t0.toFixed(1)})`);
  tl.fromTo(d, { yas: 0 }, { yas: d.sure, duration: k(d.sure), ease: 'none', immediateRender: false }, k(d.t0));
  damlalar.push(d);
  return d;
}
// Satırdaki (ya da satıra inen) harfin ve düşen damlanın yatay mürekkep aralığı, f karesinde; satırda değilse null
function satirAraligi(d, f) {
  const s = damlaDurum(d, Math.max(0, Math.min(d.sure, f - d.t0)));
  const ust = d.taban - BUYUK * B;
  if (s.harf) {
    const alt = s.harf.taban + d.mk.alt * s.harf.sy;
    if (alt < ust) return null;
    return [s.harf.x + d.mk.sol * s.harf.sx, s.harf.x + d.mk.sag * s.harf.sx];
  }
  if (s.dusen && s.dusen.yb > ust) return [s.dusen.x - s.dusen.r, s.dusen.x + s.dusen.r];
  return null;
}
// İki harfin son dizilişteki mürekkep kutusu örtüşmesi (çift aralığı yüzünden, ör. TA); bunu aşan değme çakışmadır
function sonOrtusme(p, o) { // işaretli: artı örtüşme, eksi boşluk
  const a0 = p.hedefX + p.mk.sol, a1 = p.hedefX + p.mk.sag, b0 = o.hedefX + o.mk.sol, b1 = o.hedefX + o.mk.sag;
  return Math.min(a1, b1) - Math.max(a0, b0);
}
const izinli = (p, o) => Math.max(0, sonOrtusme(p, o));
const degiyor = (a, b, izin) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > izin + 0.5;
// Sıralı istekleri çakışmasız konma karelerine yerleştirir: her biri önceki konmadan en az `aralik` kare sonra ve
// satırdaki hiçbir harfe (yolunun hiçbir anında) değmeyecek ilk karede konar
function planla(istekler, ilk, aralik, sabit = []) {
  const planlar = [...sabit];
  let t = ilk;
  for (const r of istekler) {
    let bulundu = null;
    for (let inis = t; inis < t + 120 && !bulundu; inis += 1) {
      const p = damlaPlan({ ...r, inis });
      if (p.t0 < 0) continue;
      if (planlar.some((o) => (o.kaynak === p.kaynak || Math.abs(o.ax - p.ax) < 2.5 * R0) && p.t0 < o.t0 + o.td + 1 && o.t0 < p.t0 + p.td + 1)) continue;
      const son = Math.max(p.t0 + p.sure, ...planlar.map((o) => o.t0 + o.sure));
      let temiz = true;
      for (let f = p.t0 + p.td; f <= son && temiz; f += 0.25) {
        const a = satirAraligi(p, f);
        if (!a) continue;
        for (const o of planlar) { const b = satirAraligi(o, f); if (b && degiyor(a, b, Math.max(izinli(p, o) - 1, sonOrtusme(p, o) - 0.4))) { temiz = false; break; } } // örnekler arası 1 px pay (son dizilişi bozmadan)
      }
      if (temiz) bulundu = p;
    }
    if (!bulundu) throw new Error(`${r.c} için çakışmasız konma bulunamadı`);
    planlar.push(bulundu);
    t = bulundu.inis + aralik;
  }
  return planlar.slice(sabit.length);
}
// Damlanın a yaşındaki durumu (saf): boncuk, asılı, kalan, düşen şekil ve harf
function damlaDurum(d, a) {
  const s = { boncuk: null, asili: null, kalan: null, dusen: null, harf: null };
  if (a <= 0) return s;
  const ak = d.yol.length > 1 ? Z.ak : 0;
  if (a < Z.topla + ak) {
    // Boncuk: önce birikir (büyür), sonra kenar boyunca hızlanarak köşeye akar
    const r = R0 * EO(kis(a / Z.topla));
    let p = d.yol[0];
    if (ak && a > Z.topla) {
      const u = P2I(kis((a - Z.topla) / ak));
      const L = d.yol.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - d.yol[i][0], q[1] - d.yol[i][1]), 0);
      let kalan = u * L;
      for (let i = 1; i < d.yol.length; i++) {
        const A = d.yol[i - 1], Bp = d.yol[i], l = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
        if (kalan <= l || i === d.yol.length - 1) { const t = l ? Math.min(1, kalan / l) : 1; p = [ara(A[0], Bp[0], t), ara(A[1], Bp[1], t), ara(A[2], Bp[2], t)]; break; }
        kalan -= l;
      }
    }
    // Asılma noktasına varırken boncuk sarkan damlanın başlangıç enine daralır (biçim sürekli)
    const daral = ak ? yumusak(0.7, 1, kis((a - Z.topla) / ak)) : yumusak(Z.topla - 3, Z.topla, a);
    s.boncuk = { x: p[0], y: p[1], rx: r * ara(1.3, 1.0, daral), ry: r, aci: p[2] - 90 };
    return s;
  }
  if (a < d.td) {
    const u = P2I(kis((a - Z.topla - ak) / Z.sark));
    s.asili = { wn: R0 * ara(1.7, 0.32, u), L: R0 * ara(0.9, 2.5, u), r: R0 * ara(1, 1.06, u) };
    return s;
  }
  // Kopma sonrası: kenarda kalan uç geri çekilir
  const tau = a - d.td;
  const geri = 1 - EO(kis(tau / 7));
  if (geri > 0.01) s.kalan = { wn: R0 * 0.32 * geri, L: R0 * 1.0 * geri, r: R0 * 0.42 * geri };
  if (tau < d.tf) {
    const yb = d.y0 + d.v0 * tau + 0.5 * G * tau * tau, v = d.v0 + G * tau;
    let x;
    if (d.sutun !== null) {
      x = d.sutun + (d.ax - d.sutun) * (1 - yumusak(d.y0, d.bant[0], yb)) + (d.inisX - d.sutun) * yumusak((d.bant[0] + d.bant[1]) / 2, d.taban - 0.7 * BUYUK * B, yb);
    } else x = ara(d.ax, d.inisX, yumusak(0, 1, tau / d.tf));
    const M7 = d.cicek, m = kis((tau - (d.tf - M7)) / M7);
    const sd = 1 - P2I(m);
    if (sd > 0.01) s.dusen = { x, yb, r: R0 * 1.06 * sd, T: R0 * (1.4 * Math.exp(-tau / 3) + 0.25 + 0.012 * v / OLC) * sd };
    if (m > 0) {
      const sl = 0.3 + 0.7 * P2O(m);
      s.harf = { x, taban: yb + (d.taban - d.inisY), sx: sl * (1 - 0.08 * (1 - m)), sy: sl * (1 + 0.1 * (1 - m)) };
    }
    return s;
  }
  // Kondu: ezilme (≤%4) ve kayma
  const t2 = a - d.tland, qz = ezilme(t2);
  const fx = d.t0 + a; // mutlak kare
  const x = d.Ds ? ara(d.inisX, d.hedefX, KAY(kis((fx - d.kay) / d.Ds))) : d.hedefX;
  s.harf = { x, taban: d.taban, sx: 1 + 0.025 * qz, sy: 1 - 0.04 * qz };
  return s;
}
function damlaCiz(d) {
  const s = damlaDurum(d, d.yas);
  if (s.boncuk) {
    const b = s.boncuk;
    Object.entries({ cx: 0, cy: 0, rx: f1(b.rx), ry: f1(b.ry), transform: `translate(${f1(b.x)} ${f1(b.y)}) rotate(${f1(b.aci)})` }).forEach(([a, v]) => d.boncuk.setAttribute(a, v));
    d.boncuk.style.display = '';
  } else d.boncuk.style.display = 'none';
  const yolYaz = (e, v) => { if (v) { e.setAttribute('d', v); e.style.display = ''; } else e.style.display = 'none'; };
  yolYaz(d.asili, s.asili && asiliD(d.ax, d.ay, s.asili.wn, s.asili.L, s.asili.r));
  yolYaz(d.kalan, s.kalan && asiliD(d.ax, d.ay, s.kalan.wn, s.kalan.L, s.kalan.r));
  yolYaz(d.dusen, s.dusen && dusenD(s.dusen.x, s.dusen.yb, s.dusen.r, s.dusen.T));
  if (s.harf) koy(d.harf, s.harf.x, s.harf.taban, s.harf.sx, s.harf.sy, d.oy);
  else koy(d.harf, 0, 0, 1, 1, 0, false);
  return s;
}

// Kaynak yolları
const altYol = (taraf, oran) => { const [a, b] = AYAK[taraf].alt; return [[ara(a[0], b[0], oran), a[1], 90]]; };
const egikYol = (taraf) => {
  const A = AYAK[taraf], n = A.yon > 0 ? 45 : 135, ust = [ara(A.ic[0], A.egikUst[0], 0.72), ara(A.ic[1], A.egikUst[1], 0.72)];
  return [[...ust, n], [A.ic[0], A.ic[1], ara(n, 90, 0.5)], [A.ic[0] - A.yon * 0.75 * R0, A.ic[1], 90]];
};
const yanYol = (taraf) => {
  const A = AYAK[taraf], n = A.yon > 0 ? 180 : 0, ust = [A.dis[0], ara(A.yanUst[1], A.dis[1], 0.4)];
  return [[...ust, n], [A.dis[0], A.dis[1], A.yon > 0 ? 135 : 45], [A.dis[0] + A.yon * 0.75 * R0, A.dis[1], 90]];
};
const ucYol = (taraf) => [[UC[taraf][0], UC[taraf][1] + 0.25 * R0, 90]];

// ---------- Akışlar
let ger = null; // TR: GERÇEĞE
const durum = {};
const capH = () => BUYUK * B;

function kurEN() {
  const L = diz('OKAY TO DO’S', B, IZ * B);
  const sol = adOrta - L.en / 2;
  const taban = adTaban + ARA * capH() + capH();
  const yuva = L.h.map((c, i) => ({ c, x: sol + L.x[i] + L.adv[i] / 2 }));
  sloganKat.setAttribute('aria-label', "Okay to do's");
  // 1) OKTOS'tan: O K T O S (yuva 0 1 5 6 11); her biri kendi büyük harfinin altından, hedefe en yakın düz noktadan
  const miras = [0, 1, 5, 6, 11], inisler = [30, 35, 40, 45, 50], kayBas = 58;
  const mirasD = miras.map((yi, j) => {
    const [ax, ay] = adDamlaNoktasi(adHarf[j], yuva[yi].x);
    return damlaPlan({ yol: [[ax, ay, 90]], c: yuva[yi].c, hedefX: yuva[yi].x, taban, inisX: ax, inisY: taban, inis: inisler[j], kayBas: kayBas + j * 1.5 });
  });
  // 2) Dokunaç uçlarından: harf aralığından süzülür (O|K ve O|S boşluğu), komşuların arasına konar, yerine kayar
  const bosluk = (i) => (adHarf[i].inkR + adHarf[i + 1].inkL) / 2;
  const sutun = { sol: bosluk(0), sag: bosluk(3) };
  const yerlesik = mirasD.map((d) => ({ x: d.hedefX, mk: d.mk }));
  const dolgu = [{ yi: 3, taraf: 'sol' }, { yi: 8, taraf: 'sag' }, { yi: 2, taraf: 'sol' }, { yi: 9, taraf: 'sag' }, { yi: 10, taraf: 'sag' }];
  const istek = dolgu.map((f) => {
    const y = yuva[f.yi], mk = murekkep(y.c, B), apo = y.c === '’';
    // Konma yeri: aralığın hizası, iki yanındaki yerleşik harfe değmeyecek biçimde
    const solK = yerlesik.filter((o) => o.x < y.x).map((o) => o.x + o.mk.sag).reduce((a, b) => Math.max(a, b), -Infinity);
    const sagK = yerlesik.filter((o) => o.x > y.x).map((o) => o.x + o.mk.sol).reduce((a, b) => Math.min(a, b), Infinity);
    const inisX = Math.max(solK - mk.sol + 1.5, Math.min(sagK - mk.sag - 1.5, sutun[f.taraf]));
    yerlesik.push({ x: y.x, mk });
    return { yol: ucYol(f.taraf), c: y.c, hedefX: y.x, taban, inisX, inisY: apo ? taban + mk.alt : taban, renk: apo ? VURGU : M, oy: apo ? -(mk.ust + mk.alt) / 2 : 0,
      kaynak: 'uc-' + f.taraf, sutun: sutun[f.taraf], bant: [D.ad.top + (TABAN - BUYUK) * D.ad.boyut, adTaban] };
  });
  const sonMiras = Math.max(...mirasD.map((d) => d.kay + d.Ds));
  [...mirasD, ...planla(istek, sonMiras, 4, mirasD)].forEach(damlaDom);
  TOPLAM = Math.min(240, Math.ceil(Math.max(...damlalar.map((d) => d.t0 + d.sure)) + 96));
  Object.assign(durum, { dil: 'en', B, taban, sol, en: L.en, adOrta, adTaban, sutun, yuva: yuva.map((y) => +y.x.toFixed(1)), oktos: adHarf.map((o) => [+o.inkL.toFixed(1), +o.inkR.toFixed(1)]) });
}

function kurTR() {
  const L1 = diz('OLASILIKTAN', B, IZ * B), k2 = 'GERÇEĞE';
  const en2 = genislik(k2, B) + (k2.length - 1) * IZ * B;
  const taban1 = adTaban + ARA * capH() + capH(), taban2 = taban1 + SATIR * B;
  const sol1 = adOrta - L1.en / 2;
  const yuva = L1.h.map((c, i) => ({ c, x: sol1 + L1.x[i] + L1.adv[i] / 2 }));
  sloganKat.setAttribute('aria-label', 'Olasılıktan gerçeğe');
  // Karışık sıra: iki ayaktan dönüşümlü; her yanda ortadaki yuva önce (yandan gelen harf yerleşiklerin önünden geçmez).
  // Kaynak her yanda içten dışa: eğik iç kenardan akıp iç köşeden, alt kenarın iki noktasından, dış yan kenardan akıp
  // dış köşeden (dört ayrı nokta, ≈2,7 R0 arayla; aynı noktada iki damla aynı anda birikmez). Konma kareleri planla() ile: dönüşümlü ritim (≥4 kare), hiçbir anda çakışma yok.
  const solSira = [5, 4, 3, 2, 1, 0], sagSira = [6, 7, 8, 9, 10];
  const solKaynak = [['egik'], ['alt', 0.66], ['alt', 0.38], ['yan'], ['egik'], ['alt', 0.66]];
  const sagKaynak = [['egik'], ['alt', 0.66], ['alt', 0.38], ['yan'], ['egik']];
  const istek = [];
  for (let i = 0; i < Math.max(solSira.length, sagSira.length); i++) {
    for (const [sira, kaynak, taraf] of [[sagSira, sagKaynak, 'sag'], [solSira, solKaynak, 'sol']]) {
      if (i >= sira.length) continue;
      const [tur, oran] = kaynak[i], yi = sira[i];
      const yol = tur === 'alt' ? altYol(taraf, oran) : tur === 'egik' ? egikYol(taraf) : yanYol(taraf);
      istek.push({ yol, c: yuva[yi].c, hedefX: yuva[yi].x, taban: taban1, inisX: yol[yol.length - 1][0], inisY: taban1 });
    }
  }
  planla(istek, 38, 4).forEach(damlaDom);
  // GERÇEĞE: tek parça; 1. satırın taban çizgisinin altından sıyrılır (şerit maskesi; üstte Ç'nin kancası da gizli
  // başlar), yerçekimiyle tek düşüşte 2. satıra konar. Ğ'nin şapkası son konumda maskenin altında kalır.
  const serit = document.createElement('div');
  serit.className = 'serit';
  const seritUst = taban1 + 1;
  Object.assign(serit.style, { top: f1(seritUst) + 'px', width: W + 'px', height: f1(H - seritUst) + 'px' });
  sloganKat.appendChild(serit);
  const e = document.createElement('span');
  e.className = 'sh'; e.textContent = k2;
  Object.assign(e.style, { fontSize: B + 'px', letterSpacing: f1(IZ * B) + 'px' });
  serit.appendChild(e);
  const mk = murekkep(k2, B);
  const bas = taban1 - mk.alt - 1, mesafe = taban2 - bas, tf = Math.sqrt(2 * mesafe / G);
  // Son harf konduktan kısa süre sonra başlar; satırın son kayması biterken iner (tek, kararlı düşüş)
  const sonKonma = Math.max(...damlalar.map((d) => d.t0 + d.tland)), sonKayma = Math.max(...damlalar.map((d) => d.kay + d.Ds));
  const t0 = Math.round(Math.max(sonKonma + 6, sonKayma - tf));
  ger = { e, seritUst, orta: adOrta + IZ * B / 2, bas, tf, t0, tland: t0 + tf, yas: 0, sure: tf + 18 };
  tl.fromTo(ger, { yas: 0 }, { yas: ger.sure, duration: k(ger.sure), ease: 'none', immediateRender: false }, k(t0));
  TOPLAM = Math.min(240, Math.ceil(t0 + ger.sure + 92));
  Object.assign(durum, { dil: 'tr', B, taban1, taban2, sol1, en1: L1.en, en2, adOrta, adTaban, gerInis: +ger.tland.toFixed(1), yuva: yuva.map((y) => +y.x.toFixed(1)) });
}
function gerDurum(a) {
  if (!ger || a <= 0) return null;
  if (a < ger.tf) return { taban: ger.bas + 0.5 * G * a * a, sx: 1, sy: 1 };
  const qz = ezilme(a - ger.tf); // tek tık
  return { taban: ger.bas + 0.5 * G * ger.tf * ger.tf, sx: 1 + 0.02 * qz, sy: 1 - 0.04 * qz };
}
function gerCiz() {
  if (!ger) return;
  const s = gerDurum(ger.yas);
  if (!s) { ger.e.style.visibility = 'hidden'; return; }
  ger.e.style.visibility = 'visible';
  ger.e.style.transformOrigin = `50% ${f1(TABAN * B)}px`;
  ger.e.style.transform = `translate(${ger.orta.toFixed(2)}px, ${(s.taban - TABAN * B - ger.seritUst).toFixed(2)}px) translateX(-50%) scale(${s.sx.toFixed(4)}, ${s.sy.toFixed(4)})`;
}

function ciz() {
  for (const d of damlalar) damlaCiz(d);
  gerCiz();
}

// ---------- Denetim: her karede (1/4 kare adımla) satırdaki harflerin çakışması; tam karelerde konum sıçraması
function denetle() {
  const satir = [], cakisma = [];
  const kayit = damlalar.map(() => []);
  for (let f = 0; f <= TOPLAM; f += 0.25) {
    const durumlar = damlalar.map((d) => damlaDurum(d, Math.max(0, Math.min(d.sure, f - d.t0))));
    // satırda (ya da satıra inen) harf ve damlalar; her çift için son dizilişin örtüşmesini aşan değme
    const iz = damlalar.map((d) => satirAraligi(d, f));
    for (let i = 0; i < iz.length; i++) for (let j = i + 1; j < iz.length; j++) {
      if (!iz[i] || !iz[j]) continue;
      const izin = izinli(damlalar[i], damlalar[j]);
      if (degiyor(iz[i], iz[j], izin)) cakisma.push({ f, harf: [damlalar[i].c, damlalar[j].c], derinlik: +(Math.min(iz[i][1], iz[j][1]) - Math.max(iz[i][0], iz[j][0]) - izin).toFixed(2) });
    }
    if (Number.isInteger(f)) durumlar.forEach((s, i) => {
      const h = s.harf, dd = s.dusen;
      const dl = damlalar[i];
      kayit[i].push(h ? [h.x, h.taban - (dl.taban - dl.inisY)] : dd ? [dd.x, dd.yb] : null);
    });
    if (Number.isInteger(f)) satir.push(f);
  }
  // Sıçrama: ardışık iki karede hız farkı (ivme); konma anı (çarpma) ayrı sayılır
  const sonuc = damlalar.map((d, i) => {
    const p = kayit[i];
    let vMax = 0, aMax = 0, aMaxCarpma = 0, aKare = -1;
    for (let f = 2; f < p.length; f++) {
      if (!p[f] || !p[f - 1] || !p[f - 2]) continue;
      const v1 = [p[f][0] - p[f - 1][0], p[f][1] - p[f - 1][1]], v0 = [p[f - 1][0] - p[f - 2][0], p[f - 1][1] - p[f - 2][1]];
      const v = Math.hypot(...v1), a = Math.hypot(v1[0] - v0[0], v1[1] - v0[1]);
      vMax = Math.max(vMax, v);
      const carpma = Math.abs(f - (d.t0 + d.tland)) < 2.5;
      if (carpma) aMaxCarpma = Math.max(aMaxCarpma, a);
      else if (a > aMax) { aMax = a; aKare = f; }
    }
    return { c: d.c, inis: +(d.t0 + d.tland).toFixed(1), vMax: +vMax.toFixed(2), ivmeMax: +aMax.toFixed(2), ivmeKare: aKare, carpma: +aMaxCarpma.toFixed(2) };
  });
  let gerSonuc = null;
  if (ger) {
    let vMax = 0, aMax = 0, onceki = null, oncekiV = null;
    for (let f = 0; f <= TOPLAM; f++) {
      const s = gerDurum(Math.max(0, Math.min(ger.sure, f - ger.t0)));
      const y = s ? s.taban : null;
      if (y !== null && onceki !== null) {
        const v = y - onceki; vMax = Math.max(vMax, Math.abs(v));
        if (oncekiV !== null && Math.abs(f - ger.tland) > 2.5) aMax = Math.max(aMax, Math.abs(v - oncekiV));
        oncekiV = v;
      }
      onceki = y;
    }
    gerSonuc = { vMax: +vMax.toFixed(2), ivmeMax: +aMax.toFixed(2) };
  }
  return { g: G, cakisma: cakisma.slice(0, 12), cakismaSayisi: cakisma.length, harf: sonuc, ger: gerSonuc, sonKonma: Math.max(...damlalar.map((d) => d.t0 + d.tland + (d.Ds ? d.kay - d.t0 - d.tland + d.Ds : 0))) };
}

function sayacYaz(t) {
  if (sayac.hidden) return;
  sayac.textContent = `k ${String(Math.round(t * FPS)).padStart(3, '0')} · ${t.toFixed(2)} sn`;
}
function kareKur(t) {
  const tt = Math.max(0, Math.min(t, TOPLAM / FPS));
  tl.seek(tt, false);
  ciz();
  sayacYaz(tt);
}

window.tanitim = { tl, kare: kareKur, sure: () => TOPLAM / FPS, durum, denetle, hatalar: [] };
if (CEKIM) { gsap.ticker.lagSmoothing(0); document.getElementById('tekrar').hidden = true; }
await document.fonts.load(`900 ${D.ad.boyut}px ${YAZI}`, 'OKTOS AYD’ LIĞÇE').catch(() => {});
await document.fonts.ready;
try {
  metrik();
  adKur();
  if (DIL === 'en') kurEN(); else kurTR();
  tl.to({}, { duration: k(1) }, k(TOPLAM - 1)); // akışın sonu = TOPLAM
} catch (e) { console.error(e); hataEl.textContent = e.message; window.tanitim.hatalar.push(String(e && e.stack || e)); }
kareKur(0);
if (CEKIM) window.tanitimHazir = true;
else if (q.get('t') !== null) kareKur(+q.get('t'));
else {
  const hiz = +(q.get('hiz') || 1);
  let t0 = null;
  const dongu = (simdi) => {
    if (t0 === null) t0 = simdi;
    const t = ((simdi - t0) / 1000) * hiz;
    kareKur(t);
    if (t < TOPLAM / FPS) requestAnimationFrame(dongu);
  };
  requestAnimationFrame(dongu);
  document.getElementById('tekrar').addEventListener('click', () => location.reload());
}
