// Tanıtım filmi animatiği (v06) çekirdeği: sahne, tek zaman çizelgesi, kamera, yazı, düşünce ve konuşma balonu, karakterler, sayaç.
// Yapı v06 (yerel çalışma notları): 48 sn = 2880 kare, 60 fps. Kanca → kafe → atölye → balkon → FRP masası → kalabalık "keşke"
// → balon konturlarından logo inşası → OKTOS + örgü şişiyle "Dokunulabilir hayaller". Sahneler sorunda biter, çözüm gösterilmez.
// Kadro (genç, 16–30), kanca yüzleri, sahne aralıkları ve kareler tek kaynaktan: film/kadro.json (scripts/film-ses.py de okur).
// Sahneler ayrı modüllerdir (lab/tanitim/film/*.js); her biri `export function kur(ctx)` ile zaman çizelgesine
// kendi tween'lerini MUTLAK kare zamanlarıyla ekler (ctx.k(kare) → saniye). Bir modül hata verirse yalnız o vinyet düşer.
// Animatik: gri yer tutucu şekiller, gerçek yazılar; "GERÇEK" anları renkli yer tutucu + etiket (3B sonra gelir).
// Kare hızı katmanları: kamera, yazı, nesne konumu 60 fps; karakter pozu 12 fps (ctx.adim ile); kaynama 8 fps / 4 çizim.
// Sorgu: ?yon=yatay|dikey ?dil=tr|en ?yazi=0 (yazısız, site sürümü) ?sayac=0 ?t=12.5 (kareyi dondur) ?hiz=0.5
//        ?yalniz=v1-kanca,v2-zar (yalnız bu modüller) ?cek=1 (scripts/film-cek.py kare kare çekim)
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin.js';
import { SplitText } from 'gsap/SplitText.js';
import { CustomEase } from 'gsap/CustomEase.js';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin.js';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
import { kisiSVG, rastgeleKisi, boyKaymasi, yol, oval, rng, PALET, MONO, BOY, GOZ_Y } from './insan.js';

gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, SplitText, CustomEase, ScrambleTextPlugin, MotionPathPlugin);
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const DIKEY = q.get('yon') === 'dikey' || (!q.has('yon') && !CEKIM && innerHeight > innerWidth);
const W = DIKEY ? 1080 : 1920, H = DIKEY ? 1920 : 1080;
const DIL = q.get('dil') === 'en' ? 'en' : 'tr';
const YAZI = q.get('yazi') !== '0';
const KADRO = await (await fetch(new URL('./film/kadro.json', import.meta.url))).json();
const FPS = 60, TOPLAM = KADRO.toplam;
const k = (n) => n / FPS; // kare → saniye
const NS = 'http://www.w3.org/2000/svg';

// ---------- Eğriler (plan: EO, BO, Eİ, KM)
const E = {
  EO: CustomEase.create('EO', '0.16,1,0.3,1'),    // yavaşlayarak oturur (giriş)
  BO: 'back.out(1.7)',                              // ~%10 aşar
  EI: CustomEase.create('EI', '0.7,0,0.84,0'),     // çıkış
  KM: CustomEase.create('KM', '0.65,0,0.35,1'),    // kamera, şekil dönüşümü
};
const VURGU = '#bf5519', GRI = '#cfc9bd', GRI2 = '#b5b1aa', KAGIT = '#f1ede6', BALON = '#fbf9f5';

// ---------- Sahne
const sahne = document.getElementById('sahne'), kamera = document.getElementById('kamera'), itme = document.getElementById('itme');
const yaziKatmani = document.getElementById('yazi'), sayac = document.getElementById('sayac'), hataEl = document.getElementById('hata');
for (const el of [sahne, kamera, itme, yaziKatmani]) Object.assign(el.style, { width: W + 'px', height: H + 'px' });
function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();
if (q.get('sayac') === '0' || CEKIM && q.get('sayac') !== '1') sayac.hidden = true;
gsap.set([kamera, itme], { transformOrigin: '0 0', x: 0, y: 0, scale: 1 });

// ---------- Zaman çizelgesi ve kaynama (8 fps, 4 çizim)
const tl = gsap.timeline({ paused: true });
let kare = -1;
const kaynayanlar = new Set();
function kaynat(i) { if (i === kare) return; kare = i; for (const f of kaynayanlar) f(i); }
const kaynaIndis = (t) => Math.floor(t * 8) % 4;
gsap.ticker.add((t) => { if (!CEKIM) kaynat(kaynaIndis(t)); });
const sapma = (tohum, genlik = 1.2) => {
  const tablo = [0, 1, 2, 3].map((i) => { const r = rng(tohum * 131 + i * 977); return Array.from({ length: 512 }, () => (r() - 0.5) * 2 * genlik); });
  return (i) => ({ sap: (j, e) => tablo[((i % 4) + 4) % 4][(j * 2 + e) % 512] });
};
const SIFIR = { sap: () => 0 };

// ---------- Çekim kaydı (sayaç için) ve ses işaretleri (scripts/film-ses.py müziği bunlara oturtur: tanitim.isaretler)
const vuruslar = [];
function vurus(no, ad, k0, k1) { vuruslar.push({ no, ad, k0, k1 }); }
// tur: 'kesme' (sahne/çekim kesmesi), 'konusma' (sesli söz başlar), 'dusunce' (düşünce balonu açılır), 'tik' (küçük mekanik
// ses: kapak, çekmece, vida), 'zar', 'sessizlik' (k..bitis arası müzik susar), 'vurgu' (müzikte asılı/çözülen an), 'nota' (nota: 'D5')
const isaretler = [];
function isaret(kare, tur, ek = {}) { isaretler.push({ kare: Math.round(kare), tur, ...ek }); }
function sayacYaz(t) {
  if (sayac.hidden) return;
  const n = Math.round(t * FPS), v = vuruslar.find((x) => n >= x.k0 && n <= x.k1);
  sayac.textContent = `k ${String(n).padStart(4, '0')} · ${t.toFixed(2)} sn${v ? ` · #${v.no} ${v.ad}` : ''}`;
}

// ---------- Katman: kameranın içinde, tam sahne boyunda bir div + svg (z sırası ekleme sırası ya da z)
function katman(ad, z = 0) {
  const div = document.createElement('div');
  div.className = 'vk'; div.dataset.ad = ad;
  Object.assign(div.style, { width: W + 'px', height: H + 'px', zIndex: z });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
  div.appendChild(svg);
  itme.appendChild(div);
  return { div, svg };
}
function el(ust, ad, nit = {}) {
  const e = document.createElementNS(NS, ad);
  for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v);
  ust.appendChild(e);
  return e;
}

// Kaynayan doodle çizgi: noktalar → yol; dolgu konturdan 3 px kayık (baskı kayması). pts sonradan değişebilir (h.pts = ...)
function cizgi(ust, pts, { kapali = false, dolgu = null, kalinlik = 5, renk = PALET.murekkep, tohum = 1, genlik = 1.2, kay = [3, 3] } = {}) {
  const g = el(ust, 'g');
  const d = dolgu ? el(g, 'path', { fill: dolgu, transform: `translate(${kay[0]} ${kay[1]})` }) : null;
  const c = el(g, 'path', { fill: 'none', stroke: renk, 'stroke-width': kalinlik, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const sp = sapma(tohum, genlik);
  const h = { g, dolgu: d, yol: c, pts, donuk: false };
  h.ciz = (i = kare) => {
    if (h.donuk) return;
    const yolD = yol(h.pts, kapali, i < 0 ? SIFIR : sp(i));
    c.setAttribute('d', yolD);
    if (d) d.setAttribute('d', yolD);
  };
  h.ciz(Math.max(0, kare));
  kaynayanlar.add(h.ciz);
  return h;
}

// ---------- Karakterler (insan.js, tek renkli). Konuşan kadro kadro.json'dan (kisiler.<kod>.p); kanca yüzleri kadro.montaj.
const KISI = Object.fromEntries(Object.entries(KADRO.kisiler).map(([ad, v]) => [ad, v.p]));
const MONTAJ = [
  { kel: 1, p: { sacStil: 'kel', sac: 6, sakal: 'biyik', gozluk: 'kare', kalem: true, yas: 'yasli', ten: 2 } },           // M1
  { p: { sacStil: 'topuz', yas: 'genc', ten: 5, yuzEn: 52, yuzBoy: 66, gozluk: null, sakal: null } },                  // M2 çocuk
  { p: { sacStil: 'basortusu', ten: 3, yelek: true, gozluk: null, sakal: null } },                                     // M3
  { p: { sacStil: 'kivircik', sakal: 'kirli', ten: 6, gozluk: null } },                                               // M4
  { p: { sacStil: 'bob', sac: 5, isitme: true, ten: 1, yas: 'orta', gozluk: null, sakal: null } },                     // M5
  { p: { sacStil: 'yan', ten: 4, kulaklik: true, gozluk: null, sakal: null } },                                       // M6
  { p: { sacStil: 'topuz', ten: 6, gozluk: null, sakal: null, kupe: true } },                                         // M7
  { p: { sacStil: 'yan', sac: 3, cil: true, ten: 0, yas: 'genc', gozluk: null, sakal: null } },                        // M8
  { p: { sacStil: 'basortusu', yas: 'yasli', ten: 4, ortu: 4, gozluk: null, sakal: null } },                          // M9
  { p: { sacStil: 'bere', sakal: 'sakal', ten: 2, gozluk: null } },                                                   // M10
  { p: { sacStil: 'bob', ten: 5, yas: 'genc', gozluk: null, sakal: null } },                                          // M11
  { p: { sacStil: 'kel', sakal: 'sakal', sac: 5, yas: 'yasli', ten: 5, gozluk: null } },                               // M12
  { p: { sacStil: 'uzun', ten: 3, gozluk: null, sakal: null } },                                                      // M13
  { p: { sacStil: 'kivircik', gozluk: 'yuvarlak', ten: 1, yas: 'genc', yuzEn: 54, sakal: null } },                     // M14
  { p: { sacStil: 'kisa', sac: 5, ten: 6, yas: 'orta', gozluk: null, sakal: null } },                                 // M15
  { p: { sacStil: 'basortusu', ten: 2, ortu: 2, gozluk: null, sakal: null } },                                        // M16
  { p: { sacStil: 'uzun', ten: 4, kupe: true, gozluk: null, sakal: null } },                                          // M17
  { p: { sacStil: 'kisa', ten: 3, cil: true, yaka: 'kapusonlu', yas: 'genc', gozluk: null, sakal: null } },            // M18
  { p: { sacStil: 'uzun', sac: 6, ten: 6, yas: 'yasli', yaka: 'v', gozluk: null, sakal: null } },                      // M19
  { p: { sacStil: 'kel', sac: 0, ten: 0, gozluk: 'kare', sakal: null } },                                             // M20
  { p: { sacStil: 'bere', sakal: 'biyik', sac: 6, ten: 5, yas: 'yasli', gozluk: null } },                              // M21
].map((m, i) => rastgeleKisi(100 + i * 13, m.p));
// v06: kanca yüzleri genç kadrodan (kadro.json montaj); yoksa eski liste kalır
if (KADRO.montaj?.length) KADRO.montaj.forEach((m, i) => { MONTAJ[i] = rastgeleKisi(m.tohum ?? 100 + i * 13, m); });
const kisiParam = (ad) => rastgeleKisi(KISI[ad].tohum, KISI[ad]);

// Kişi: üst katmana (svg) iç içe svg olarak konur. (x, alt) = göğüs ortası ve alt kenar; olcek 1 = 400×440 px.
// hiza: ortak zemindeki kişiler için 'orta' boylu birinin kutu alt kenarı; verilirse alt = hiza + boyKaymasi(p) × olcek
// (kısa biri aşağıda, uzun biri yukarıda durur; gövde kutunun 420 birim altına dek uzar, kenarı görünmez).
// Pozu 12 fps'te değiştir: ctx.tl.call(() => kisi.poz({ ifade: 'merak', bakis: [1, -1] }), null, ctx.k(kare)).
function kisi(ust, p, { x = W / 2, alt = H, olcek = 1.9, hiza = null } = {}) {
  if (hiza != null) alt = hiza + boyKaymasi(p) * olcek;
  const g = el(ust, 'g');
  const s = el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * olcek, height: BOY.boy * olcek, x: x - (BOY.en * olcek) / 2, y: alt - BOY.boy * olcek, overflow: 'visible' });
  const h = { g, svg: s, p, ifade: p.ifade || 'notr', bakis: [0, 0], donuk: false, olcek, x, alt };
  // Göz çizgisinin sahnedeki yeri (montajda kamera bu noktaya kilitlenir)
  h.goz = [x, alt - BOY.boy * olcek + GOZ_Y * olcek];
  h.ciz = (i = kare) => { if (!h.donuk) s.innerHTML = kisiSVG(h.p, { kaynama: Math.max(0, i), ifade: h.ifade, bakis: h.bakis, mono: true }); };
  h.poz = ({ p: yeni, ifade, bakis } = {}) => { if (yeni) h.p = yeni; if (ifade) h.ifade = ifade; if (bakis) h.bakis = bakis; h.ciz(); };
  h.ciz(Math.max(0, kare));
  kaynayanlar.add(h.ciz);
  return h;
}

// ---------- Düşünce balonu: düzensiz tümsekli bulut + 3 nokta. ac(k0): noktalar 4 k arayla (8 k, BO), bulut 14 k BO,
// kıvrımlar 12 k DrawSVG. kapat(k0): 18 k Eİ. hizli: true → noktalar 2 k arayla, bulut 8 k (plan #12)
function balon(ust, { c, r, noktalar, tohum = 5, koken = '20% 90%' }) {
  const g = el(ust, 'g');
  const nk = noktalar.map(() => el(g, 'path', { fill: BALON, stroke: PALET.murekkep, 'stroke-width': 4.5 }));
  const bg = el(g, 'g');
  const dolgu = el(bg, 'path', { fill: BALON });
  const kontur = el(bg, 'path', { fill: 'none', stroke: PALET.murekkep, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const ic = el(bg, 'g'); // içerik buraya (balonla birlikte büyür)
  const sp = sapma(tohum, 1.6);
  const n = 11, rr = rng(tohum * 7 + 77), wv = Array.from({ length: n }, () => 0.75 + rr() * 0.5), top = wv.reduce((a, b) => a + b, 0);
  const aci = []; let acc = 0;
  for (let i = 0; i < n; i++) { aci.push(acc / top * Math.PI * 2 - Math.PI * 0.62); acc += wv[i]; }
  const yolu = (ss) => {
    const P = (a) => [c[0] + r[0] * Math.cos(a), c[1] + r[1] * Math.sin(a)];
    const N = (a) => { const x = Math.cos(a) / r[0], y = Math.sin(a) / r[1], l = Math.hypot(x, y); return [x / l, y / l]; };
    const f = (v) => v.toFixed(1);
    const uc = aci.map((a, i) => { const p0 = P(a); return [p0[0] + ss.sap(i * 6, 0), p0[1] + ss.sap(i * 6, 1)]; });
    let d = `M${f(uc[0][0])} ${f(uc[0][1])}`;
    for (let i = 0; i < n; i++) {
      const a0 = aci[i], a1 = i + 1 < n ? aci[i + 1] : aci[0] + Math.PI * 2;
      const p0 = P(a0), p1 = P(a1), n0 = N(a0), n1 = N(a1), b = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 0.62;
      const j = (q0, m) => [q0[0] + ss.sap(i * 6 + m, 0), q0[1] + ss.sap(i * 6 + m, 1)];
      const c1 = j([p0[0] + n0[0] * b + (p1[0] - p0[0]) * 0.08, p0[1] + n0[1] * b + (p1[1] - p0[1]) * 0.08], 1);
      const c2 = j([p1[0] + n1[0] * b - (p1[0] - p0[0]) * 0.08, p1[1] + n1[1] * b - (p1[1] - p0[1]) * 0.08], 2);
      const q1 = uc[(i + 1) % n];
      d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(q1[0])} ${f(q1[1])}`;
    }
    return d + 'Z';
  };
  const durum = { donuk: false };
  const ciz = (i = kare) => {
    if (durum.donuk) return;
    const d = yolu(i < 0 ? SIFIR : sp(i));
    dolgu.setAttribute('d', d); kontur.setAttribute('d', d);
    noktalar.forEach(([x, y, rad], j) => nk[j].setAttribute('d', yol(oval(x, y, rad, rad * 0.86, 0, 360, 10), true, sapma(tohum * 3 + j, 0.8)(Math.max(0, i)))));
  };
  ciz(Math.max(0, kare));
  kaynayanlar.add(ciz);
  gsap.set(nk, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(bg, { scale: 0.3, autoAlpha: 0, transformOrigin: koken });
  const h = { g, bulut: bg, ic, dolgu, kontur, noktalar: nk, c, r, yolu: () => yolu(SIFIR), ciz };
  // h.donuk = true: kaynama durur (bilinçli sessizlik); zaman çizelgesinde tl.call ile aç/kapat
  Object.defineProperty(h, 'donuk', { get: () => durum.donuk, set: (v) => { durum.donuk = v; } });
  h.ac = (k0, { hizli = false } = {}) => {
    const t0 = k(k0);
    tl.fromTo(nk, { scale: 0 }, { scale: 1, duration: k(hizli ? 6 : 8), ease: E.BO, stagger: k(hizli ? 2 : 4), immediateRender: false }, t0);
    const tb = t0 + k(hizli ? 4 : 10);
    tl.fromTo(bg, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: k(hizli ? 8 : 14), ease: 'back.out(1.2)', immediateRender: false }, tb); // ~%5 aşma: kadraj kenarına taşmasın
    tl.fromTo(kontur, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, tb);
    tl.set(kontur, { clearProps: 'strokeDasharray,strokeDashoffset' }, tb + k(13));
    return tb + k(hizli ? 8 : 14); // bulutun oturduğu an (sn)
  };
  h.kapat = (k0, sure = 18) => {
    tl.to([bg, ...nk], { autoAlpha: 0, scale: 0.6, duration: k(sure), ease: E.EI, stagger: 0 }, k(k0));
  };
  return h;
}

// ---------- El yazısı (karakterin sesi, Caveat, kaynar değil, yazılır): kameranın içindeki bir katmanda
function elYazisi(katmanDiv, metin, { x, y, boyut = 62, aci = -3 } = {}) {
  const p = document.createElement('p');
  p.className = 'el-yazisi';
  p.innerHTML = metin[DIL] ?? metin.tr;
  Object.assign(p.style, { left: x + 'px', top: y + 'px', fontSize: boyut + 'px', transform: `rotate(${aci}deg)`, clipPath: 'inset(-30% 100% -30% 0%)' });
  katmanDiv.appendChild(p);
  return p;
}
function yazElYazisi(p, k0, sure = 28) {
  tl.fromTo(p, { clipPath: 'inset(-30% 100% -30% 0%)', autoAlpha: 1 }, { clipPath: 'inset(-30% 0% -30% 0%)', duration: k(sure), ease: 'none', immediateRender: false }, k(k0));
}
function silElYazisi(p, k0) { tl.to(p, { autoAlpha: 0, y: -18, duration: k(14), ease: E.EI }, k(k0)); }

// ---------- Konuşma balonu (sesli söz; düşünce balonu ise iç ses): elle çizilmiş yuvarlak köşeli kutu + kuyruk, içinde Caveat.
// konus(L, metin, { x, y, kuyruk: [x, y], boyut, aci, tohum }) → { g, p, ac(k0, yazSure), kapat(k0) }. (x, y) yazının sol üstü,
// kuyruk konuşanın ağzına bakan uç (dünya koordinatı). Balon 8 k BO ile kuyruk ucundan açılır, yazı 4 k sonra yazılır.
function konus(L, metin, { x, y, kuyruk = null, boyut = 52, aci = 0, tohum = 9, dolgu = BALON, pay = [26, 16] } = {}) {
  const g = el(L.svg, 'g');
  const p = elYazisi(L.div, metin, { x, y, boyut, aci });
  const w = p.offsetWidth || boyut * 6, h = p.offsetHeight || boyut;
  const cx = x + w / 2, cy = y + h / 2, rx = w / 2 + pay[0], ry = h / 2 + pay[1];
  const govde = oval(cx, cy, rx, ry, 0, 360, 30, 5.5); // süperelips: yuvarlak köşeli kutu
  cizgi(g, govde, { kapali: true, dolgu, kalinlik: 4.5, tohum, genlik: 1.1, kay: [0, 0] });
  let uc = [cx, cy + ry];
  if (kuyruk) {
    // Kuyruk tabanı: konturun kuyruk yönüne en yakın noktasının iki yanı; taban şeridi dolguyla örtülür (kontur kesilir)
    const a = Math.atan2((kuyruk[1] - cy) / ry, (kuyruk[0] - cx) / rx), d = 0.16;
    const P = (t) => { const c = Math.cos(t), sn = Math.sin(t); return [cx + rx * Math.sign(c) * Math.abs(c) ** (2 / 5.5), cy + ry * Math.sign(sn) * Math.abs(sn) ** (2 / 5.5)]; };
    const b1 = P(a - d), b2 = P(a + d), ic = (q) => [q[0] + (cx - q[0]) * 0.12, q[1] + (cy - q[1]) * 0.12];
    uc = kuyruk;
    el(g, 'path', { d: `M${ic(b1).join(' ')} L${b1.join(' ')} L${kuyruk.join(' ')} L${b2.join(' ')} L${ic(b2).join(' ')}Z`, fill: dolgu });
    cizgi(g, [b1, [(b1[0] + kuyruk[0]) / 2 + (b2[1] - b1[1]) * 0.08, (b1[1] + kuyruk[1]) / 2], kuyruk], { kalinlik: 4.5, tohum: tohum + 1, genlik: 0.9 });
    cizgi(g, [b2, kuyruk], { kalinlik: 4.5, tohum: tohum + 2, genlik: 0.9 });
  }
  gsap.set(g, { autoAlpha: 0, scale: 0.6, svgOrigin: `${uc[0]} ${uc[1]}` });
  gsap.set(p, { autoAlpha: 0 });
  const hb = { g, p, kutu: [cx - rx, cy - ry, cx + rx, cy + ry] };
  hb.ac = (k0, yazSure = 16) => {
    tl.fromTo(g, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(k0));
    yazElYazisi(p, k0 + 4, yazSure);
  };
  hb.kapat = (k0, sure = 10) => {
    tl.to(g, { autoAlpha: 0, scale: 0.9, duration: k(sure), ease: E.EI }, k(k0));
    tl.to(p, { autoAlpha: 0, duration: k(sure), ease: E.EI }, k(k0));
  };
  return hb;
}

// ---------- Oktos'un sesi: HTML yazı katmanı (kameradan bağımsız). Kelimeler maskeden 34 k EO, 4 k arayla açılır,
// 18 k Eİ ile yukarı çıkar. stil: 'baslik' | 'cumle' | 'etiket'. yer: { left, top, right, bottom, width, align }
const yazilar = [];
function yazi(metin, k0, k1, { stil = 'cumle', yer = {}, boyut } = {}) {
  if (!YAZI) return null;
  const p = document.createElement('p');
  p.className = `yz ${stil}`;
  p.innerHTML = metin[DIL] ?? metin.tr;
  for (const [a, v] of Object.entries(yer)) p.style[a === 'align' ? 'textAlign' : a] = typeof v === 'number' ? v + 'px' : v;
  if (boyut) p.style.fontSize = boyut + 'px';
  yaziKatmani.appendChild(p);
  yazilar.push({ p, k0, k1 });
  return p;
}
function yazilariKur() {
  for (const { p, k0, k1 } of yazilar) {
    const sp = SplitText.create(p, { type: 'words', mask: 'words' });
    // Maske dolgulu: İ, Ö, Ü noktaları ve Ğ kavisi kırpılmasın; dolgu payı yüzünden gizli konum %150
    gsap.set(sp.masks, { padding: '0.12em 0.05em 0.14em', margin: '-0.12em -0.05em -0.14em' });
    gsap.set(p, { autoAlpha: 0 });
    gsap.set(sp.words, { yPercent: 150 });
    tl.set(p, { autoAlpha: 0 }, 0);
    tl.set(p, { autoAlpha: 1 }, k(k0));
    tl.fromTo(sp.words, { yPercent: 150 }, { yPercent: 0, duration: k(34), ease: E.EO, stagger: k(4), immediateRender: false }, k(k0));
    if (k1 != null) tl.to(sp.words, { yPercent: -150, duration: k(18), ease: E.EI, stagger: k(2) }, k(k1));
  }
}

// ---------- Kamera: dünya noktası (cx, cy), ölçek s ile ekranda (sx, sy)'ye gelsin (köken 0 0)
const odak = (cx, cy, s, sx = W / 2, sy = H / 2) => ({ x: sx - s * cx, y: sy - s * cy, scale: s });
function kameraGit(k0, sure, hedef, ease = E.KM) { tl.to(kamera, { ...hedef, duration: k(sure), ease }, k(k0)); }
function kameraKoy(k0, hedef) { tl.set(kamera, hedef, k(k0)); }

// ---------- Yer tutucu "GERÇEK" işareti (animatikte 3B'nin geleceği yer)
function gercekEtiket(ust, metin, x, y) {
  const g = el(ust, 'g');
  const t = el(g, 'text', { x, y, 'font-family': 'Schibsted Grotesk, sans-serif', 'font-weight': 700, 'font-size': 20, 'letter-spacing': '2', fill: VURGU });
  t.textContent = metin;
  return g;
}

// ---------- Ortak yerleşim (dört vinyette aynı dil): karakter, balon, noktalar
const YERLESIM = DIKEY ? {
  kisi: { x: 540, alt: H - 94, olcek: 1.9 }, balon: { c: [540, 610], r: [470, 300] },
  noktalar: [[770, 1112, 12], [750, 1050, 18], [702, 990, 24]], balonKoken: '62% 98%', notYeri: { x: 250, y: 390 },
} : {
  kisi: { x: 580, alt: H + 6, olcek: 1.9 }, balon: { c: [1360, 350], r: [450, 266] },
  noktalar: [[792, 470, 12], [846, 420, 18], [910, 360, 26]], balonKoken: '22% 88%', notYeri: { x: 1052, y: 118 },
};

// ---------- Vinyetler arası ortak tanımlar
// C'nin istediği figür: Biggie benzeri tıknaz, iri başlı, kulaklıklı (tanınır bir oyun karakteri ya da piyon değil).
// Birim şekil: taban y=0, tepe y≈-1, genişlik ±0,4; kullanırken boyla ölçekle. v4 (kesik silüet), v5, v6 (gerçek nesne) aynısını kullanır.
const FIGUR = [
  { p: oval(0, -0.05, 0.36, 0.065, 0, 360, 16), kapali: true },                                                               // kaide
  { p: [[-0.19, -0.5], [0, -0.52], [0.19, -0.5], [0.28, -0.32], [0.3, -0.12], [0, -0.1], [-0.3, -0.12], [-0.28, -0.32]], kapali: true }, // gövde
  { p: [[-0.27, -0.42], [-0.38, -0.3], [-0.36, -0.22]] }, { p: [[0.27, -0.42], [0.38, -0.3], [0.36, -0.22]] },                // kısa kollar
  { p: oval(0, -0.71, 0.23, 0.21, 0, 360, 16), kapali: true },                                                                // iri baş
  { p: oval(0, -0.71, 0.29, 0.28, 194, 346, 10) },                                                                            // kulaklık bandı
  { p: oval(-0.28, -0.68, 0.06, 0.1, 0, 360, 10), kapali: true }, { p: oval(0.28, -0.68, 0.06, 0.1, 0, 360, 10), kapali: true },
];
// D'nin #20'de dokunduğu malzeme (kullanıcı kararı: 4. malzeme mermer desenli epoksi). v6 saksıyı bu renkle gösterir.
const SAKSI = { malzeme: 'epoksi', taban: '#e8e2d8', agiz: '#d5cfc5', damar: '#5f5a53', altinDamar: '#c39a3e' };

// ---------- Bağlam (modüllere verilen sözleşme)
const ctx = {
  W, H, DIKEY, DIL, YAZI, FPS, TOPLAM, k, E, tl, gsap, VURGU, GRI, GRI2, KAGIT, BALON, PALET, MONO, BOY, GOZ_Y,
  kamera, itme, yaziKatmani, katman, el, cizgi, sapma, yol, oval, rng, kaynayanlar,
  KISI, MONTAJ, kisiParam, kisi, balon, elYazisi, yazElYazisi, silElYazisi, yazi, odak, kameraGit, kameraKoy,
  gercekEtiket, YERLESIM, vurus, isaret, FIGUR, SAKSI, KADRO, konus, boyKaymasi, rastgeleKisi,
  yer: (yatay, dikey) => (DIKEY ? dikey : yatay),
  metin: (tr, en) => ({ tr, en }),
  // 12 fps adım: karakter pozu değişiklikleri bu ızgaraya oturur (5 karede bir)
  adim: (n) => Math.round(n / 5) * 5,
};

// ---------- Modülleri yükle (her biri kendi vinyetini kurar)
const MODULLER = ['v1-kanca', 's1-kafe', 's2-atolye', 's3-balkon', 's4-frp', 's5-kalabalik', 's6-final'];
const SECILI = q.get('yalniz') ? q.get('yalniz').split(',') : MODULLER;
const hatalar = [];
async function kur() {
  for (const m of MODULLER) {
    if (!SECILI.includes(m)) continue;
    try {
      const mod = await import(`./film/${m}.js`);
      mod.kur(ctx);
    } catch (e) {
      console.error(m, e);
      hatalar.push(`${m}: ${e.message}`);
    }
  }
  yazilariKur();
  tl.to({}, { duration: k(1) }, k(TOPLAM - 1)); // süre en az TOPLAM kare
  hataEl.textContent = hatalar.join('\n');
}

// ---------- Kare kare çekim ve oynatma
function kareKur(t) {
  tl.seek(Math.max(t, 1e-4), false); // seek(0) 0. sn'deki set'leri uygulamıyor (ilk kare)
  kaynat(kaynaIndis(t));
  sayacYaz(t);
}
gsap.ticker.add(() => { if (!CEKIM) sayacYaz(tl.time()); });
if (CEKIM) { gsap.ticker.lagSmoothing(0); document.getElementById('tekrar').hidden = true; }
window.tanitim = { tl, kare: kareKur, sure: () => tl.duration(), hatalar, vuruslar, isaretler, ctx };
await document.fonts.ready;
// Caveat ve Big Shoulders bir öğe kullanana dek indirilmez; fonts.ready onları beklemez. Balon ve el yazısı genişliği gerçek
// yazı tipiyle ölçülsün diye sahneler kurulmadan önce yüklenir (Türkçe harfler dahil)
try {
  await Promise.all([
    document.fonts.load('600 62px Caveat', 'Aa ÇçĞğİıÖöŞşÜü?!…'),
    document.fonts.load('900 112px "Big Shoulders Display"', 'OKTOS ÇĞİÖŞÜ'),
    document.fonts.load('300 112px "Big Shoulders Display"', 'OLASILIKTAN'),
    document.fonts.load('600 64px "Schibsted Grotesk"', 'Aa ÇçĞğİıÖöŞşÜü'),
  ]);
} catch { /* yazı tipi gelmezse yedekle sürer */ }
await kur();
tl.seek(1e-4, false); // 0. saniyedeki set'ler hemen uygulansın: ilk boyanan kare de doğru olsun
kaynat(0);
if (CEKIM) window.tanitimHazir = true;
else if (q.get('t') !== null) {
  // İleri sararken çağrılar sırayla çalışsın: kare kare ilerle
  const hedef = +q.get('t');
  for (let t = 0; t < hedef; t = Math.min(hedef, t + 1 / FPS)) tl.seek(t, false);
  kareKur(hedef);
} else {
  tl.timeScale(+(q.get('hiz') || 1));
  tl.play(0);
  document.getElementById('tekrar').addEventListener('click', () => location.reload());
}
