// Kapanış sloganı (stil denemesi, filmin son satırı; ≈2 sn akış + ≥1,6 sn bekleme, 228 kare, 60 fps).
// Örgülü "Dokunulabilir hayaller" (orgu.js) tutmadı; yerine "OKTOS" ile AYNI yazı tipinde (Big Shoulders Display,
// değişken ağırlık 300–900, büyük harf) dinamik bir dizgi. Başlangıç = logo2'nin son karesi (logo tamam, "OKTOS" dizili,
// hareketsiz; yer, boy ve aralık logo2 ile aynı). Slogan "OKTOS"un altına, onun ≈0,46 katı boyda, ortaya gelir.
// EN "OKAY TO DO'S" (?dil=en): OKTOS = "OK TO (DO')S" kelime oyunu görünsün:
//   1. Slogan satırında harf yerleri ince boşluk çizgileriyle açılır (bulmaca boşluğu gibi, soldan sağa).
//   2. OKTOS'un kendi harflerinin kopyaları (O K T O S) sırayla aşağı düşer, küçülür, kendi boşluğuna oturur (inişte
//      küçük ezilme). Üstteki OKTOS olduğu gibi kalır. Satır bir an "OK _ _ TO _ _ S" okunur.
//   3. Eksik harfler (A Y D O) boşluk çizgisinin içinden yükselir (çizgi maske gibi), ince ağırlıktan (300) son
//      ağırlığına yaylanır; çizgi geri çekilir. Kesme işareti en son, vurgu renginde küçük bir tık olarak düşer.
//   4. OKTOS'tan gelen beş harf 900'de, eklenenler ince (480) kalır: bekleme boyunca OKTOS satırın içinde okunur.
//      Kapanışta beş harf soldan sağa bir dalga halinde bir kez nabız atar.
// TR "OLASILIKTAN GERÇEĞE" (?dil=tr):
//   1. "OLASILIKTAN" = olasılık: her harf ince (300) ve soluk üç hayalet kopyadan bir bulut; kopyalar 12 fps adımla
//      kaynar (yavaş gürültü, rastgele sıçrama değil) ve soldan sağa sırayla tek net harfte birleşir (480).
//   2. "GERÇEĞE" = gerçek: tek parça halinde üstten düşer, düşerken ağırlık kazanır (300 → 900), iner; inişte ≤%3
//      ezilip oturur (tık).
//   Yatay: tek satır. Dikey: iki satır (OLASILIKTAN / GERÇEĞE), telefonda okunurluk için.
// Aralıklar ölçülür: document.fonts.ready'den sonra canvas measureText ile her harfin ilerleyişi ve çift aralığı
// (kerning) SON ağırlıklarında hesaplanır, harfler bu yerlere tek tek konur (ağırlık değişirken ortalarından büyür).
// Türkçe işaretler (Ç, Ğ) hiçbir maskeye girmez; EN'deki tek maske (boşluk çizgisi) üstte 1,5 em pay bırakır.
// Bütün durum tek bir duraklatılmış GSAP akışında (tl.seek); kare(t) her anı baştan kurar (sırayla ilerletmek gerekmez).
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

// ---------- Eğriler (film.js / logo2.js ile aynı adlar)
const EO = CustomEase.create('EO', '0.16,1,0.3,1'); // yavaşlayarak oturur
const P2I = gsap.parseEase('power2.in'), P2O = gsap.parseEase('power2.out'), P2IO = gsap.parseEase('power2.inOut');
const P3IO = gsap.parseEase('power3.inOut');

// ---------- Yerleşim (logo ve "OKTOS" logo2.js ile aynı)
const D = DIKEY ? {
  logo: { cx: 540, cy: 840, s: 1.3 }, ad: { top: 1196, boyut: 176 },
} : {
  logo: { cx: 960, cy: 412, s: 1.0 }, ad: { top: 676, boyut: 132 },
};
const ORAN = 0.46;                       // slogan boyu / OKTOS boyu
const B = Math.round(D.ad.boyut * ORAN); // slogan yazı boyu (px): yatay 61, dikey 81
const IZ = 0.1;                          // slogan harf aralığı (em)
const ARA = 0.3;                         // OKTOS taban çizgisi → slogan büyük harf tepesi (OKTOS em'i)
const SATIR = 1.3;                       // dikey TR: iki satırın taban çizgileri arası (slogan em'i)
const AG = { ince: 300, hafif: 480, kalin: 900 };

// ---------- Zamanlama (kare)
const TOPLAM = 228;
const ZE = { // EN
  bos0: 8, bosAra: 1.5, bosSure: 12,             // boşluk çizgileri açılır
  dus0: 18, dusAra: 5, dusSure: 30, inis: 21,    // OKTOS kopyaları düşer (inis: kalkıştan inişe kare)
  dol0: 74, dolAra: [0, 4, 12, 16], dolSure: 22, // A Y D O yükselir
  apo: 98, apoSure: 14,                          // kesme işareti
  nabiz: 118, nabizAra: 3, nabizSure: 16,        // OKTOS harfleri dalga
};
const ZT = { // TR
  gor0: 6, gorAra: 1.5, gorSure: 12,             // hayalet bulut belirir
  top0: 30, topAra: 2.6, topSure: 32,            // harf harf birleşir
  netOnce: 9, netSure: 10,                       // net harf, birleşmenin bitmesinden bu kadar önce gelir
  ger0: 80, gerDus: 16, gerSure: 34,             // GERÇEĞE düşer (gerDus: düşüş, kalanı oturma)
};

// ---------- Yardımcılar
function rng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ara = (a, b, t) => a + (b - a) * t;
const kis = (x) => Math.max(0, Math.min(1, x));
const yumusak = (a, b, x) => { const t = kis((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const f1 = (v) => v.toFixed(1);
// Sönümlü ezilme: inişte 1, sonra salınarak 0 (pencere sonunda tam 0)
const ezilme = (t2, sure, tau = 2.2, om = 0.85) => t2 < 0 ? 0 : Math.exp(-t2 / tau) * Math.cos(t2 * om) * (1 - yumusak(0.45, 1, t2 / sure));

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

// Logo: logo2'nin son karesi (tek yol, ölçek 1)
const logoNokta = ([x, y]) => [D.logo.cx + (x - LOGO_ORTA[0]) * D.logo.s, D.logo.cy + (y - LOGO_ORTA[1]) * D.logo.s];
const logoYol = document.createElementNS(NS, 'path');
logoYol.setAttribute('fill', M); logoYol.setAttribute('fill-rule', 'evenodd');
logoYol.setAttribute('d', LOGO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => logoNokta([+x, +y]).map(f1).join(',')));
svg.appendChild(logoYol);

// ---------- Ölçü (canvas measureText; değişken ağırlık sayıyla verilir)
const tuval = document.createElement('canvas').getContext('2d');
const genislik = (metin, w, boy) => { tuval.font = `${w} ${boy}px ${YAZI}`; return tuval.measureText(metin).width; };
let TABAN = 0.885, BUYUK = 0.8; // em: satır kutusu (line-height 1) tepesinden taban çizgisine; büyük harf yüksekliği
function metrik() {
  tuval.font = `900 100px ${YAZI}`;
  const m = tuval.measureText('H');
  TABAN = ((100 - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent) / 100;
  BUYUK = m.actualBoundingBoxAscent / 100;
}
// Harfleri son ağırlıklarında dizer: x = harfin sol kenarı (satır başına göre). İlerleyiş + çift aralığı + iz.
// Ağırlığı farklı iki komşunun çift aralığı iki ağırlıktaki değerin ortalaması.
function diz(harfler, boy, iz) {
  const adv = harfler.map((h) => genislik(h.c, h.w, boy)), x = [];
  let imlec = 0;
  harfler.forEach((h, i) => {
    x.push(imlec);
    if (i === harfler.length - 1) return;
    const s = harfler[i + 1];
    const kern = (w) => genislik(h.c + s.c, w, boy) - genislik(h.c, w, boy) - genislik(s.c, w, boy);
    imlec += adv[i] + (h.w === s.w ? kern(h.w) : (kern(h.w) + kern(s.w)) / 2) + iz;
  });
  return { x, adv, en: imlec + adv[adv.length - 1] };
}

// ---------- Öğeler
function harfEl(ust, c, renk = M) {
  const e = document.createElement('span');
  e.className = 'sh'; e.textContent = c;
  e.style.fontSize = B + 'px';
  e.style.transformOrigin = `50% ${(TABAN * 100).toFixed(2)}%`; // taban çizgisinin ortası
  if (renk !== M) e.style.color = renk;
  ust.appendChild(e);
  return e;
}
// Harfi taban çizgisi ortası (cx, taban) olacak biçimde koyar; ölçek ve dönüş bu noktadan
function koy(e, cx, taban, { dx = 0, dy = 0, sx = 1, sy = 1, r = 0, w, op = 1 } = {}) {
  if (op <= 0.002) { e.style.visibility = 'hidden'; return; }
  e.style.visibility = 'visible';
  e.style.transform = `translate(${(cx + dx).toFixed(2)}px, ${(taban - TABAN * B + dy).toFixed(2)}px) translateX(-50%) rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  if (w !== undefined) e.style.fontWeight = w.toFixed(1);
  e.style.opacity = op >= 0.999 ? '' : op.toFixed(3);
}

// "OKTOS": logo2.js yaziKur ile aynı yapı (harfler .m > .h), son karedeki gibi yerinde
let adHarf = [], adTaban = 0, adOrta = W / 2;
function adKur() {
  const ad = document.createElement('p');
  ad.className = 'ad';
  Object.assign(ad.style, { top: D.ad.top + 'px', fontSize: D.ad.boyut + 'px' });
  const harfler = [...'OKTOS'].map((h) => { const m = document.createElement('span'); m.className = 'm'; const s = document.createElement('span'); s.className = 'h'; s.textContent = h; m.appendChild(s); ad.appendChild(m); return s; });
  yaziKat.appendChild(ad);
  adTaban = D.ad.top + TABAN * D.ad.boyut;
  adHarf = harfler.map((s) => { const adv = genislik(s.textContent, 900, D.ad.boyut); return { c: s.textContent, cx: s.offsetLeft + adv / 2, sol: s.offsetLeft, adv, taban: adTaban }; });
  adOrta = (adHarf[0].sol + adHarf[4].sol + adHarf[4].adv) / 2; // görünen harflerin ortası (son harfin izi hariç)
}

// ---------- Akış
const tl = gsap.timeline({ paused: true });
let ciz = () => {};
const durum = {};

// EN: OKAY TO DO'S
function kurEN() {
  const metin = [...'OKAY TO DO’S'];
  const miras = [0, 1, 5, 6, 11]; // OKTOS'un O K T O S harflerinin satırdaki yeri
  const HS = metin.map((c, i) => ({ c, i, miras: miras.includes(i), w: miras.includes(i) || c === '’' || c === ' ' ? AG.kalin : AG.hafif }));
  const d = diz(HS, B, IZ * B);
  const sol = adOrta - d.en / 2;
  const taban = adTaban + ARA * D.ad.boyut + BUYUK * B;
  HS.forEach((h, i) => { h.cx = sol + d.x[i] + d.adv[i] / 2; h.adv = d.adv[i]; });
  sloganKat.setAttribute('aria-label', "Okay to do's");

  // Boşluk çizgileri (harf yerleri; boşluk ve kesme işareti hariç): harfin enine göre, komşusuyla arada ≥0,22 em
  const BOS_KAL = Math.max(2, 0.055 * B), BOS_Y = taban + 0.085 * B;
  const yerler = HS.filter((h) => /[A-Z]/.test(h.c));
  const bos = yerler.map((h, i) => {
    const kom = [yerler[i - 1], yerler[i + 1]].filter(Boolean).map((o) => Math.abs(o.cx - h.cx));
    const en = Math.min(0.8 * h.adv, Math.min(...kom) - 0.22 * B);
    const e = document.createElement('div');
    e.className = 'bos';
    Object.assign(e.style, { width: f1(en) + 'px', height: f1(BOS_KAL) + 'px', visibility: 'hidden' });
    sloganKat.appendChild(e);
    return { h, e, en, ac: 0, kap: 0 };
  });
  // Eklenen harflerin şeridi: alt kenarı boşluk çizgisinin üstü (harf çizginin içinden çıkar); üstte 1,5 em pay
  const PAY = 1.5 * B;
  const serit = document.createElement('div');
  serit.className = 'serit';
  Object.assign(serit.style, { top: f1(taban - PAY) + 'px', width: W + 'px', height: f1(BOS_Y - (taban - PAY)) + 'px' });
  sloganKat.appendChild(serit);

  // OKTOS kopyalarının şeridi: üst kenarı OKTOS'un taban çizgisinin hemen altı. Kopya büyük harfin içinden değil,
  // altından sıyrılarak çıkar (üstteki harflerle üst üste binip leke yapmaz)
  const DUS_UST = adTaban + 0.03 * D.ad.boyut;
  const serit2 = document.createElement('div');
  serit2.className = 'serit';
  Object.assign(serit2.style, { top: f1(DUS_UST) + 'px', width: W + 'px', height: f1(H - DUS_UST) + 'px' });
  sloganKat.appendChild(serit2);
  const dus = miras.map((si, j) => ({ h: HS[si], o: adHarf[j], e: harfEl(serit2, HS[si].c), u: 0, nb: 0 }));
  const dolgu = HS.filter((h) => !h.miras && /[A-Z]/.test(h.c)).map((h) => ({ h, e: harfEl(serit, h.c), y: 0, w: 0 }));
  const apo = { h: HS[10], e: harfEl(sloganKat, '’', VURGU), v: 0 };
  dus.forEach((x) => { x.e.style.fontWeight = 900; });
  apo.e.style.fontWeight = 900;

  // Akış
  bos.forEach((b, i) => tl.fromTo(b, { ac: 0 }, { ac: 1, duration: k(ZE.bosSure), ease: 'none', immediateRender: false }, k(ZE.bos0 + i * ZE.bosAra)));
  dus.forEach((x, j) => {
    const t0 = ZE.dus0 + j * ZE.dusAra;
    tl.fromTo(x, { u: 0 }, { u: 1, duration: k(ZE.dusSure), ease: 'none', immediateRender: false }, k(t0));
    const b = bos.find((b) => b.h === x.h);
    tl.fromTo(b, { kap: 0 }, { kap: 1, duration: k(7), ease: 'none', immediateRender: false }, k(t0 + ZE.inis));
    tl.fromTo(x, { nb: 0 }, { nb: 1, duration: k(ZE.nabizSure), ease: 'none', immediateRender: false }, k(ZE.nabiz + j * ZE.nabizAra));
  });
  dolgu.forEach((x, m) => {
    const t0 = ZE.dol0 + ZE.dolAra[m];
    tl.fromTo(x, { y: 0 }, { y: 1, duration: k(ZE.dolSure), ease: 'back.out(1.5)', immediateRender: false }, k(t0));
    tl.fromTo(x, { w: 0 }, { w: 1, duration: k(ZE.dolSure + 6), ease: 'back.out(2.6)', immediateRender: false }, k(t0 + 2));
    const b = bos.find((b) => b.h === x.h);
    tl.fromTo(b, { kap: 0 }, { kap: 1, duration: k(9), ease: 'none', immediateRender: false }, k(t0 + 9));
  });
  tl.fromTo(apo, { v: 0 }, { v: 1, duration: k(ZE.apoSure), ease: 'none', immediateRender: false }, k(ZE.apo));

  const KUCUK = D.ad.boyut / B;
  ciz = () => {
    for (const b of bos) {
      const s = EO(b.ac) * (1 - P2I(b.kap));
      b.e.style.visibility = s > 0.002 ? 'visible' : 'hidden';
      b.e.style.transform = `translate(${f1(b.h.cx - b.en / 2)}px, ${f1(BOS_Y)}px) scaleX(${s.toFixed(4)})`;
      b.e.style.opacity = (0.34 * (b.kap > 0 ? 1 - P2O(b.kap) * 0.5 : 1)).toFixed(3);
    }
    for (const x of dus) {
      const tf = x.u * ZE.dusSure;
      if (tf <= 0) { koy(x.e, 0, 0, { op: 0 }); continue; }
      const a = kis(tf / ZE.inis);
      // Önce (şeridin üstünde, görünmezken) çabuk küçülür, sonra yerçekimi gibi hızlanarak düşer: büyük harfin altından
      // parça değil, küçük ve bütün bir harf sıyrılır. Yatayda yumuşak geçiş.
      const cx = ara(x.o.cx, x.h.cx, P2IO(a));
      const tb = ara(x.o.taban, taban, P2I(a));
      const olc = ara(KUCUK, 1, 0.82 * P2O(kis(tf / 10)) + 0.18 * P2IO(kis(tf / ZE.inis)));
      const ez = ezilme(tf - ZE.inis, ZE.dusSure - ZE.inis);
      const nb = x.nb > 0 && x.nb < 1 ? 1 + 0.06 * Math.sin(Math.PI * P2O(x.nb)) : 1;
      koy(x.e, cx, tb - DUS_UST, { sx: olc * (1 + 0.045 * ez) * nb, sy: olc * (1 - 0.07 * ez) * nb });
    }
    for (const x of dolgu) {
      // Şeridin içinde: yerel taban çizgisi PAY; başta tamamen çizginin altında
      const yv = x.y;
      koy(x.e, x.h.cx, PAY + (1 - yv) * 1.2 * B, { w: ara(AG.ince, AG.hafif, x.w), op: x.y > 0 ? 1 : 0 });
    }
    {
      const v = apo.v, a = kis(v * ZE.apoSure / 7);
      const ez = ezilme(v * ZE.apoSure - 7, ZE.apoSure - 7, 1.8, 1.0);
      koy(apo.e, apo.h.cx, taban, { dy: -0.55 * B * (1 - P2I(a)), r: -24 * (1 - P2O(a)), sx: (0.6 + 0.4 * P2O(a)) * (1 + 0.08 * ez), sy: (0.6 + 0.4 * P2O(a)) * (1 - 0.12 * ez), op: kis(v * ZE.apoSure / 3) });
    }
  };
  Object.assign(durum, { dil: 'en', B, taban, sol, en: d.en, harf: HS.map((h) => ({ c: h.c, w: h.w, cx: +h.cx.toFixed(2), adv: +h.adv.toFixed(2) })), adOrta, adTaban });
}

// TR: OLASILIKTAN GERÇEĞE
function kurTR() {
  const k1 = [...'OLASILIKTAN'], k2 = 'GERÇEĞE';
  const iz = IZ * B;
  const H1 = k1.map((c) => ({ c, w: AG.hafif }));
  const d1 = diz(H1, B, iz);
  const en2 = genislik(k2, AG.kalin, B) + (k2.length - 1) * iz; // GERÇEĞE tek parça (tarayıcının kendi çift aralığı)
  const kelimeAra = genislik(' ', AG.hafif, B) + 2 * iz;
  const taban0 = adTaban + ARA * D.ad.boyut + BUYUK * B;
  let sol1, taban1, orta2, taban2;
  if (DIKEY) { sol1 = adOrta - d1.en / 2; taban1 = taban0; orta2 = adOrta; taban2 = taban0 + SATIR * B; }
  else { const top = d1.en + kelimeAra + en2; sol1 = adOrta - top / 2; taban1 = taban2 = taban0; orta2 = sol1 + d1.en + kelimeAra + en2 / 2; }
  H1.forEach((h, i) => { h.cx = sol1 + d1.x[i] + d1.adv[i] / 2; h.adv = d1.adv[i]; });
  sloganKat.setAttribute('aria-label', 'Olasılıktan gerçeğe');

  // Hayalet bulut: harf başına 3 kopya, eksen çevresine eşit dağılmış yönler (bulut harfin yerinde ortalanır)
  const HAYALET = 3, H_OP = 0.3;
  const harfler = H1.map((h, i) => {
    const r = rng(101 + i * 37), a0 = r() * Math.PI * 2;
    const kopya = Array.from({ length: HAYALET }, (_, g) => ({
      e: harfEl(sloganKat, h.c), yon: a0 + (g * Math.PI * 2) / HAYALET + (r() - 0.5) * 0.9, rho: 0.55 + r() * 0.45,
      f: [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28], don: r() < 0.5 ? -1 : 1, hiz: 0.75 + r() * 0.5,
    }));
    return { h, kopya, net: harfEl(sloganKat, h.c), gor: 0, top: 0, nt: 0 };
  });
  harfler.forEach((x) => { x.net.style.fontWeight = AG.hafif; });
  const ger = document.createElement('span');
  ger.className = 'sh'; ger.textContent = k2;
  Object.assign(ger.style, { fontSize: B + 'px', letterSpacing: f1(iz) + 'px', transformOrigin: `50% ${(TABAN * 100).toFixed(2)}%` });
  sloganKat.appendChild(ger);
  const G = { u: 0 };

  harfler.forEach((x, i) => {
    tl.fromTo(x, { gor: 0 }, { gor: 1, duration: k(ZT.gorSure), ease: 'none', immediateRender: false }, k(ZT.gor0 + i * ZT.gorAra));
    const t0 = ZT.top0 + i * ZT.topAra;
    tl.fromTo(x, { top: 0 }, { top: 1, duration: k(ZT.topSure), ease: 'none', immediateRender: false }, k(t0));
    tl.fromTo(x, { nt: 0 }, { nt: 1, duration: k(ZT.netSure), ease: 'none', immediateRender: false }, k(t0 + ZT.topSure - ZT.netOnce));
  });
  tl.fromTo(G, { u: 0 }, { u: 1, duration: k(ZT.gerSure), ease: 'none', immediateRender: false }, k(ZT.ger0));

  ciz = (t) => {
    const adim = Math.floor(t * 12 + 1e-6) / 12; // kaynama: 12 fps
    for (const x of harfler) {
      const gen = 1 - P3IO(x.top);              // bulutun genliği
      const w = ara(AG.ince, AG.hafif, P2IO(x.top));
      const nt = P2IO(x.nt);
      const op = H_OP * EO(x.gor) * (1 - nt);
      for (const g of x.kopya) {
        const n = (fi, hz) => Math.sin(2 * Math.PI * hz * g.hiz * adim + g.f[fi]);
        const nx = 0.62 * Math.cos(g.yon) * g.rho + 0.38 * n(0, 0.9);
        const ny = 0.62 * Math.sin(g.yon) * g.rho + 0.38 * n(1, 0.7);
        const sc = 1 + gen * 0.06 * n(3, 0.6);
        koy(g.e, x.h.cx, taban1, { dx: gen * 0.12 * B * nx, dy: gen * 0.24 * B * ny, r: gen * 3 * g.don * n(2, 0.5), sx: sc, sy: sc, w, op });
      }
      koy(x.net, x.h.cx, taban1, { op: nt });
    }
    // GERÇEĞE: düşüş (ağırlık kazanır), iniş, ≤%3 ezilip oturma
    const tf = G.u * ZT.gerSure, a = kis(tf / ZT.gerDus);
    const ez = ezilme(tf - ZT.gerDus, ZT.gerSure - ZT.gerDus, 2.6, 0.75);
    koy(ger, orta2, taban2, { dx: iz / 2, dy: -(DIKEY ? 0.22 : 0.42) * B * (1 - P2I(a)), w: ara(AG.ince, AG.kalin, P2I(a)), sx: 1 + 0.018 * ez, sy: 1 - 0.03 * ez, op: kis(tf / 5) });
  };
  Object.assign(durum, { dil: 'tr', B, taban1, taban2, sol1, en1: d1.en, en2, orta2, harf: H1.map((h) => ({ c: h.c, cx: +h.cx.toFixed(2), adv: +h.adv.toFixed(2) })), adOrta, adTaban });
}

function sayacYaz(t) {
  if (sayac.hidden) return;
  sayac.textContent = `k ${String(Math.round(t * FPS)).padStart(3, '0')} · ${t.toFixed(2)} sn`;
}
function kareKur(t) {
  const tt = Math.max(0, Math.min(t, TOPLAM / FPS));
  tl.seek(tt, false);
  ciz(tt);
  sayacYaz(tt);
}

window.tanitim = { tl, kare: kareKur, sure: () => TOPLAM / FPS, durum, hatalar: [] };
if (CEKIM) { gsap.ticker.lagSmoothing(0); document.getElementById('tekrar').hidden = true; }
await Promise.all([
  document.fonts.load(`900 ${D.ad.boyut}px ${YAZI}`, 'OKTOS AYD’ LIĞÇ'),
  document.fonts.load(`300 ${B}px ${YAZI}`, 'OKTOS AYD’ LIĞÇ'),
]).catch(() => {});
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
