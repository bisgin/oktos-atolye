// Sosyal medya serisi: 15 sn, dikey 1080×1920, 60 fps, Türkçe. Bir bölüm = film sahnesinin kesiti → KIRILMA (meme
// montaj dili) → PS1 ürün sahnesi (ürün 360° döner; Oktos'un atölye cihazı ölçüyü ve malzemeyi canlı uyarlar) → "CANLANDI."
// damgası + ikinci patlama → kâğıt zeminde logo, OKTOS ve çağrı. Film sahneleri sorunda biter; seri bölümü ÜRÜNLE biter.
// Mimari:
//   - Kesit: film.html iframe'de (?yon=dikey&cek=1&yalniz=<modül>&ic=1: modülün İÇ kareleri). Bu sayfa iframe'in
//     tanitim.kare(t)'sini bölümün kesim listesiyle sürer (düz kesme); film dosyalarına dokunulmaz.
//   - Efektler (seri/patlama.js) SVG, PS1 sahnesi (seri/ps1.js) three.js; ürün aracın geometri koduyla (seri/urunler.js).
//   - Bölüm verisi seri/bolumler.js. Her şey karenin saf işlevi: kare(t) aynı t için aynı görüntü.
// Çekim sözleşmesi (scripts/film-cek.py, film-kare.py): ?cek=1 → window.tanitim = { kare(t), sure(), isaretler() },
// hazır olunca window.tanitimHazir = true. Ses: scripts/seri-ses.py tanitim.isaretler()'i okur.
// Sorgu: ?bolum=atolye (varsayılan) ?cek=1 ?t=9.2 (kareyi dondur) ?hiz=0.5 ?sayac=1
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';
import { BOLUMLER, MALZEMELER, SERI, zamanCizelgesi, kaynakKaresi, seriKaresi } from './seri/bolumler.js';
import { BAGDASTIRICILAR } from './seri/urunler.js';
import { ps1Kur, rng } from './seri/ps1.js';
import { patlama, hitmarker, odakCizgileri } from './seri/patlama.js';
import { LOGO_D, LOGO_ORTA } from './stil/logo-veri.js';

gsap.registerPlugin(CustomEase);
const EO = CustomEase.create('EO', '0.16,1,0.3,1'); // filmle aynı "yavaşlayarak oturur"
const BO = gsap.parseEase('back.out(1.7)');
const q = new URLSearchParams(location.search);
const CEKIM = q.has('cek');
const BOLUM_ID = q.get('bolum') || 'atolye';
const B = BOLUMLER[BOLUM_ID];
if (!B || B.taslak) {
  document.getElementById('hata').textContent = B ? `bölüm taslak (kesim, odak ve bağdaştırıcı eksik): ${BOLUM_ID}` : `bölüm yok: ${BOLUM_ID}`;
  throw new Error(document.getElementById('hata').textContent);
}
const W = 1080, H = 1920, FPS = SERI.fps;
const Z = zamanCizelgesi(B);
const hatalar = [];
const $ = (id) => document.getElementById(id);
const sahne = $('sahne'), sars = $('sars'), kesitKap = $('kesitKap'), ifr = $('kesit'), efekt = $('efekt');
const damga = $('damga'), kizartma = $('kizartma'), final = $('final'), sayac = $('sayac'), hataEl = $('hata');
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const ara = (x, a, b) => sinir((x - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const f2 = (v) => v.toFixed(2);

function sigdir() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  sahne.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
}
addEventListener('resize', sigdir);
sigdir();
if (q.get('sayac') === '1') sayac.hidden = false;
if (Z.K + SERI.kirilma >= Z.damga) hatalar.push(`kesit çok uzun (${Z.K} k): PS1'e yer kalmadı`);

// ---------- 1) Kesit: film iframe'i (hazır olunca tanitim nesnesi)
ifr.src = `film.html?yon=dikey&cek=1&yalniz=${encodeURIComponent(B.kesit.modul)}&ic=1`;
async function kesitHazir() {
  const t0 = performance.now();
  for (;;) {
    const w = ifr.contentWindow;
    if (w && w.tanitimHazir === true && w.tanitim) return w.tanitim;
    if (performance.now() - t0 > 90000) throw new Error('kesit iframe 90 sn içinde hazır olmadı');
    await new Promise((r) => setTimeout(r, 100));
  }
}
let FT = null, sonKaynak = -1;
// Isınma (önlem): GSAP "to" tween'leri başlangıç değerini ilk çizildikleri anda kaydeder; açılışta sahnenin bütün aralığı
// bir kez kare kare oynatılır (filmin kendi çekimi gibi), sonraki atlamalar aynı kayıtlı değerleri kullanır. Denetim
// (2026-10-26): aynı kare farklı sıralarla çekildiğinde fark yalnız tek tük piksel (deep-fry eşiği).
function kesitIsit() {
  // Filmin kamera katmanı will-change: transform taşır: tarayıcı taramayı geçmişe göre (kimi karede yeniden, kimi karede
  // eski ölçekten büyüterek) yapar, kesim atlamalarında aynı kare farklı çıkar. Yalnız bu iframe'de kapatılır (dosyaya
  // dokunulmaz): her kare o anki ölçeğinde taranır.
  for (const id of ['kamera', 'itme']) { const e = ifr.contentDocument.getElementById(id); if (e) e.style.willChange = 'auto'; }
  const s = (FT.sahneler?.() || []).find((x) => x.m === B.kesit.modul);
  const [a, z] = s ? [s.bas, s.son] : [0, Math.max(...B.kesit.kesimler.flat())];
  const t0 = performance.now();
  for (let m = a; m <= z; m++) FT.kare(m / FPS);
  FT.kare(1e-4);
  sonKaynak = 0;
  return Math.round(performance.now() - t0);
}
function kesitSur(m) {
  if (m === sonKaynak) return;
  // Geri sarmada baştan ileri (filmin tl.call'ları sırayla çalışsın: kare(t) her yönden aynı görüntü)
  if (m < sonKaynak) FT.kare(1e-4);
  FT.kare(m / FPS);
  sonKaynak = m;
}

// ---------- 2) Efekt katmanları
const odak = B.kirilma.odak;
const P1 = patlama(efekt, { merkez: odak, Rmax: 1150, buyume: 7, tohum: 3, bitis: { tur: 'delik', bas: 10, sure: 18 }, son: 40 });
const HM = hitmarker(efekt);
const OC = odakCizgileri(efekt, { merkez: odak });
const DAMGA_MERKEZ = [540, 880];
const P2 = patlama(efekt, { merkez: DAMGA_MERKEZ, Rmax: 1150, buyume: 9, tohum: 8, bitis: { tur: 'kapla', bas: 6, sure: 12 }, son: 40, cekirdek: '#f1ede6' });
damga.querySelector('span').textContent = B.metin.damga;
const VURUS = B.kirilma.vurus.map(([r, dx, dy]) => ({ x: odak[0] + dx, y: odak[1] + dy, t0: Z.kirilma + r }));

// ---------- 3) Final kartı: logo (stil/logo-veri.js, filmin s6-final'iyle aynı kaynak), OKTOS (Big Shoulders 900), çağrı
const LOGO = { cx: 540, cy: 690, s: 1.3 }, AD = { top: 1046 }, CAGRI_Y = 1300;
$('logo').setAttribute('d', LOGO_D);
const harfler = [...'OKTOS'].map((c) => {
  const m = document.createElement('span'); m.className = 'm';
  const h = document.createElement('span'); h.className = 'h'; h.textContent = c;
  m.appendChild(h); $('ad').appendChild(m);
  return h;
});
$('ad').style.top = AD.top + 'px';
const cagriParca = (B.metin.cagri || SERI.cagri).split(' · ');
const cagriKelime = [];
cagriParca.forEach((parca, i) => {
  if (i) { const s = document.createElement('span'); s.className = 'm'; s.innerHTML = '<span class="h">&nbsp;·&nbsp;</span>'; $('cagri').appendChild(s); cagriKelime.push(s.firstChild); }
  parca.split(' ').forEach((k, j) => {
    const m = document.createElement('span'); m.className = 'm';
    const h = document.createElement('span'); h.className = 'h' + (i ? ' v' : ''); h.textContent = k;
    m.appendChild(h); $('cagri').appendChild(m); cagriKelime.push(h);
    if (j < parca.split(' ').length - 1) $('cagri').appendChild(document.createTextNode(' '));
  });
});
$('cagri').style.top = CAGRI_Y + 'px';

// ---------- 4) Kare: bütün durum f'nin saf işlevi
let ps1 = null;
function kare(t) {
  const f = sinir(Math.round(t * FPS), 0, Z.toplam - 1);
  const r = f - Z.kirilma, p = f - Z.ps1, d = f - Z.damga, e = f - Z.final;

  // Kesit (kırılmada son kare donar); PS1 patlamanın deliğinden görünür (tuval delikle kırpılır), delik ekranı aşınca
  // kesit gizlenir. PS1 damga altında da sürer.
  const pt = r - 8, delik = P1.delik(pt), delikTam = P1.delikTam(pt);
  const kesitGorunur = r < 0 || !delikTam;
  kesitKap.style.display = kesitGorunur ? '' : 'none';
  if (kesitGorunur && FT) kesitSur(kaynakKaresi(B.kesit.kesimler, Math.min(f, Z.K - 1)));
  // Zoom punch (kırılma): odağa 3 karede vurur, sonra yavaş sürünür; hafif eğilir
  let zoom = 1, egim = 0;
  if (r >= 0) { zoom = 1 + (B.kirilma.zoom - 1) * EO(ara(r, 0, 4)) + 0.05 * ara(r, 4, 16); egim = -2.2 * EO(ara(r, 0, 4)); }
  kesitKap.style.transformOrigin = `${odak[0]}px ${odak[1]}px`;
  kesitKap.style.transform = zoom !== 1 ? `scale(${zoom.toFixed(4)}) rotate(${egim.toFixed(2)}deg)` : '';

  const ps1Gorunur = (delik || delikTam) && e < 0;
  const tuval = $('ps1');
  tuval.style.visibility = ps1Gorunur ? 'visible' : 'hidden';
  tuval.style.clipPath = delik && !delikTam ? `path('${delik}')` : '';
  if (ps1Gorunur && ps1) {
    const mozaik = p < 10 ? Math.round(lerp(16, 1, ara(p, -16, 10) ** 0.8)) : 1;
    const beyaz = d >= 3 && d < 8 ? 0.22 * (1 - (d - 3) / 5) : 0;
    ps1.ciz(p, { mozaik, beyaz });
  }

  // Efektler
  OC.ciz(r >= 0 && r < 12 ? 1 - r / 12 : 0, f);
  HM.ciz(VURUS, f);
  P1.ciz(pt);
  P2.ciz(e >= 0 ? -1 : d - 10); // final kâğıdı gelince söner

  // Damga: 3 karede çakılır (2,6 → 1), tutar, sonra içinden geçilir (büyür, söner)
  if (d >= 0 && d < 28) {
    damga.style.display = 'block';
    const slam = ara(d, 0, 3), cik = ara(d, 18, 26);
    const s = lerp(2.6, 1, slam * slam) * (1 + 0.9 * cik * cik) * (d >= 3 && d < 6 ? 1 - 0.04 * (1 - (d - 3) / 3) : 1);
    const rot = lerp(-16, -7, slam);
    const w = damga.offsetWidth, h = damga.offsetHeight;
    damga.style.transform = `translate(${DAMGA_MERKEZ[0] - w / 2}px, ${DAMGA_MERKEZ[1] - h / 2}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    damga.style.opacity = f2(1 - cik);
  } else damga.style.display = 'none';

  // Ekran: vuruş karesi (siyah-beyaz ters, 2 kare), deep-fry, sarsıntı
  const vurusKaresi = r >= 0 && r < 2;
  const kiz = Math.max(r >= 3 && r < 19 ? 1 - ara(r, 14, 19) : 0, d >= 3 && d < 12 ? 1 - ara(d, 8, 12) : 0);
  let filtre = 'none';
  if (vurusKaresi) filtre = 'grayscale(1) contrast(6) invert(1)';
  else if (kiz > 0) filtre = `sepia(${f2(0.45 * kiz)}) saturate(${f2(1 + 3.2 * kiz)}) contrast(${f2(1 + 0.6 * kiz)}) brightness(${f2(1 - 0.06 * kiz)}) hue-rotate(${f2(-14 * kiz)}deg)${kiz > 0.45 ? ' url(#kizart)' : ''}`;
  sars.style.filter = filtre;
  kizartma.style.opacity = f2(0.3 * kiz);
  const genlik = Math.max(r >= 0 && r < 18 ? 30 * (1 - r / 18) : 0, d >= 3 && d < 14 ? 26 * (1 - (d - 3) / 11) : 0);
  if (genlik > 0) {
    const rr = rng(1000 + f);
    sars.style.transform = `translate(${f2((rr() - 0.5) * 2 * genlik)}px, ${f2((rr() - 0.5) * 2 * genlik)}px) rotate(${f2((rr() - 0.5) * genlik * 0.04)}deg) scale(1.06)`;
  } else sars.style.transform = '';

  // Final: logo sıçrar, OKTOS harf harf maskeden yükselir, çağrı kelime kelime
  if (e >= 0) {
    final.style.display = 'block';
    const lk = 0.82 + 0.18 * BO(ara(e, 0, 14));
    $('logoKap').setAttribute('transform', `translate(${LOGO.cx} ${LOGO.cy}) scale(${(LOGO.s * lk).toFixed(4)}) translate(${-LOGO_ORTA[0]} ${-LOGO_ORTA[1]})`);
    harfler.forEach((h, i) => { h.style.transform = `translateY(${f2(110 * (1 - EO(ara(e, 4 + i * 4, 22 + i * 4))))}%)`; });
    cagriKelime.forEach((h, i) => { h.style.transform = `translateY(${f2(150 * (1 - EO(ara(e, 16 + i * 3, 40 + i * 3))))}%)`; });
  } else final.style.display = 'none';

  if (!sayac.hidden) sayac.textContent = `k ${String(f).padStart(3, '0')} · ${(f / FPS).toFixed(2)} sn · ${r < 0 ? 'kesit ' + kaynakKaresi(B.kesit.kesimler, f) : p < 0 ? 'kırılma' : d < 0 ? 'ps1 ' + p : e < 0 ? 'damga' : 'final'}`;
}

// ---------- 5) Ses işaretleri (scripts/seri-ses.py): seri karesi → olay
function isaretleriKur() {
  const L = [];
  const ekle = (kare, tur, ek = {}) => { if (kare >= 0 && kare < Z.toplam) L.push({ kare, tur, ...ek }); };
  // Kesitteki film işaretleri (iç kare → seri karesi)
  for (const m of FT.isaretler || []) {
    const tur = B.kesit.sesler[m.tur];
    if (!tur) continue;
    const k = seriKaresi(B.kesit.kesimler, m.kare);
    if (k == null) continue;
    ekle(k, /vida/.test(m.ad || '') ? 'vida' : tur, { ad: m.ad });
  }
  // Kırılma
  ekle(Z.kirilma, 'woosh', { ad: 'zoom' });
  ekle(Z.kirilma, 'boom');
  for (const v of VURUS) ekle(v.t0, 'hit');
  ekle(Z.kirilma + 8, 'patlama');
  ekle(Z.kirilma + 20, 'mozaik');
  // PS1
  ekle(Z.ps1 + 2, 'panel');
  for (const i of ps1.akis.isaretler) ekle(Z.ps1 + i.p, i.tur, { deger: i.deger, ad: i.ad });
  // Damga
  ekle(Z.damga + 3, 'woosh', { ad: 'damga' });
  ekle(Z.damga + 3, 'damga');
  ekle(Z.damga + 10, 'patlama', { ad: 'ikinci' });
  // Final
  ekle(Z.final, 'logo');
  harfler.forEach((_, i) => ekle(Z.final + 4 + i * 4 + 5, 'harf', { deger: i }));
  ekle(Z.final + 18, 'cagri');
  return L.sort((a, b) => a.kare - b.kare);
}

// ---------- 6) Kurulum ve sözleşme
let ISARET = [];
window.tanitim = { kare, sure: () => Z.toplam / FPS, isaretler: () => ISARET, hatalar, bolum: BOLUM_ID, zaman: Z };
try {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('900 220px "Big Shoulders Display"', 'OKTOS CANLANDI. ÇĞİÖŞÜ'),
    document.fonts.load('600 56px "Schibsted Grotesk"', 'Fikrini getir · oktosworkshop.com ÇĞİÖŞÜçğıöşü'),
  ]);
} catch { /* yazı tipi gelmezse yedekle sürer */ }
// Çağrı satırı 980 px'e sığsın
{ const c = $('cagri'); c.style.display = 'block'; final.style.display = 'block'; const w = c.scrollWidth; if (w > 980) c.style.fontSize = (56 * 980 / w).toFixed(1) + 'px'; final.style.display = 'none'; }
try {
  [FT, ps1] = await Promise.all([
    kesitHazir(),
    ps1Kur({
      canvas: $('ps1'), urun: B.urun, bagdastirici: BAGDASTIRICILAR[B.urun.bagdastirici](),
      malzemeAdlari: Object.fromEntries(Object.entries(MALZEMELER).map(([k, v]) => [k, v.ad])), sure: Z.ps1Sure,
    }),
  ]);
  for (const h of FT.hatalar || []) hatalar.push('film: ' + h);
  window.tanitim.isinmaMs = kesitIsit();
  ISARET = isaretleriKur();
} catch (err) {
  console.error(err);
  hatalar.push(String(err?.message || err));
}
hataEl.textContent = hatalar.join('\n');
kare(0);
if (CEKIM) window.tanitimHazir = true;
else if (q.get('t') !== null) kare(+q.get('t'));
else {
  const hiz = +(q.get('hiz') || 1), t0 = performance.now();
  const dongu = () => { kare((((performance.now() - t0) / 1000) * hiz) % (Z.toplam / FPS)); requestAnimationFrame(dongu); };
  requestAnimationFrame(dongu);
}
