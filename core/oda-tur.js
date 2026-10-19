// Kaydırmalı tur (docs/oda-sahnesi.md): sayfa kaydırıldıkça kamera duraktan durağa gider; tıklamak gerekmez.
// Genel planda altta "Odana dair her şey", üstünde "Çekmece organizeriyle başla" düğmesi: üzerine gelince kamera
// organizere biraz yaklaşır, tıklayınca ilk durağa kayar. Durakta bölgenin kartı açılır (uçuşsuz: kamerayı kaydırma
// sürer) ve şablonlar kendiliğinden birkaç kez değişir; dokunulunca ya da tuşa basılınca döngü durur. Tıklanan bölge
// turdaysa sayfa o durağa anında atlar, kamera aradaki durakların üzerinden geçmeden doğrudan gider ve varışta yavaşça
// yaklaşır (gecis: 'a' doğrudan, 'b' kararma, 'c' genel plandan, 'd' kavisli; 'eski': sayfa kayar, kamera yolu izler).
// Turda olmayan bölgede motor eskisi gibi yakınlaşır, ilk kaydırmada tura dönülür.
// Hareket azaltmada kaydırma yumuşatılmaz, kamera durak durak kesilir; şablonlar kendiliğinden değişmez.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true }); // telefonda adres çubuğu açılıp kapanınca zıplamasın

const AYAR = {
  durakBoyu: 0.75,      // duraklar arası kaydırma, ekran yüksekliği kesri (11 durak: ~8 ekran)
  yumusak: 0.7,         // kameranın kaydırmaya yetişme süresi, sn
  gir: 0.08, cik: 0.2,  // durağa bu yakınlıkta girilir (kart açılır), bu uzaklıkta çıkılır (durak aralığı kesri)
  bakis: 0.14,          // "başla" düğmesinin üzerine gelince kameranın ilk durağa yaklaşma payı
  ilkBekle: 1.4,        // durakta ilk şablon değişimine kadar, sn
  aralik: 1.9,          // şablon değişimleri arası, sn
  kac: 2,               // kaç kez değişir (2: ziyaretçi 3 şablon görür)
};
// Tıklamayla durağa geçiş: kamera kadrajın biraz gerisine gelir, sonra yavaşça yaklaşır
const GECIS = {
  geri: 0.1,            // varış noktası kadrajdan bu kesir kadar geride (0.1: %10 uzak)
  yaklas: 2.0,          // yavaş yaklaşma süresi, sn
  kisa: 0.9, uzun: 1.7, // uçuş süresi uzaklığa göre bu aralıkta (sn); 4 m oda boyu ~uzun
  kararma: 0.22,        // B: ekranın kararma süresi, sn (açılma iki katı)
  yay: 0.35,            // D: yolun ortasında kameranın yükselmesi, iki nokta arası uzaklığın kesri
  tavan: 2400,          // D: yayın tepesi en çok bu yükseklikte (mm; oda 2700, kamera tavanı delmesin)
};
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const yumusat = gsap.parseEase('power2.inOut');
// Kameranın hedefe uzaklığı k katına iner/çıkar (aynı doğrultuda)
const uzaklas = (v, k) => ({ pos: v.target.map((t, i) => t + (v.pos[i] - t) * k), target: [...v.target] });
const ara = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));

// duraklar: [null (genel plan), 'cekmece', ...]; metin: { baslik, basla }; bekle: kamerayı hemen sürme (?odak= çekimi)
export function odaTuru(root, story, { duraklar, metin, reduce = false, bekle = false, gecis = 'a' }) {
  const N = duraklar.length;
  document.documentElement.classList.add('oda-tur-on');
  root.dataset.tur = '';
  // Kaydırma alanı: sahne sabit durur, sayfa bu boy kadar kayar
  const alan = document.createElement('div');
  alan.className = 'oda-tur-alan';
  alan.setAttribute('aria-hidden', 'true');
  alan.style.height = `calc(100svh + ${((N - 1) * AYAR.durakBoyu * 100).toFixed(0)}svh)`;
  root.after(alan);
  // Genel plandaki yazılar
  const giris = document.createElement('div');
  giris.className = 'oda-tur-giris';
  giris.innerHTML = '<button type="button" class="ot-basla"><span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><p class="ot-baslik"></p>';
  const basla = giris.querySelector('.ot-basla');
  basla.querySelector('span').textContent = metin.basla;
  giris.querySelector('.ot-baslik').textContent = metin.baslik;
  root.appendChild(giris);

  const il = { p: 0, bak: 0 }; // p: 0..N-1 (durak), bak: "başla" önizleme payı
  let dongu = null, harman = null;
  let ucus = null; // tıklamayla süren geçiş: { tl, s, kaydir } (kaydırma bu sürede kamerayı sürmez)
  const perde = document.createElement('div'); // B varyantında kararan örtü
  perde.className = 'oda-perde';
  perde.setAttribute('aria-hidden', 'true');
  root.querySelector('.story-canvas')?.after(perde);

  function poz(p) {
    const k = Math.max(0, Math.min(Math.floor(p), N - 2)), f = yumusat(Math.min(Math.max(p - k, 0), 1));
    const a = story.shotOf(duraklar[k]), b = story.shotOf(duraklar[k + 1]);
    return { pos: lerp(a.pos, b.pos, f), target: lerp(a.target, b.target, f) };
  }
  function uygula() {
    if (ucus) return; // tıklama geçişi kamerayı kendisi sürüyor
    giris.classList.toggle('gizli', il.p > 0.04);
    if (!story.driven) return;
    let v = poz(Math.min(il.p + il.bak, N - 1));
    if (harman) v = { pos: lerp(harman.from.pos, v.pos, harman.k), target: lerp(harman.from.target, v.target, harman.k) };
    story.setView(v.pos, v.target);
    const s = Math.round(il.p), d = Math.abs(il.p - s);
    if (s > 0 && d < AYAR.gir) {
      if (story.focusedId !== duraklar[s]) { story.focusTo(duraklar[s]); donguBaslat(duraklar[s]); }
    } else if (story.focusedId && (s === 0 || d > AYAR.cik)) {
      donguDur();
      story.blur();
    }
  }
  // Motor eskisi gibi yakınlaştıysa (turda olmayan bölge) ilk kaydırmada kamera yumuşakça tura döner
  function surmeyeDon() {
    if (story.driven || !story.ready) return;
    const from = story.view();
    story.blur();
    story.drive(true);
    harman = { from, k: 0 };
    gsap.to(harman, { k: 1, duration: reduce ? 0.01 : 0.6, ease: 'power2.out', onUpdate: uygula, onComplete: () => { harman = null; } });
  }

  const st = ScrollTrigger.create({
    trigger: alan, start: 'top top', end: 'bottom bottom',
    snap: { snapTo: 1 / (N - 1), duration: reduce ? 0 : { min: 0.25, max: 0.8 }, delay: 0.12, ease: 'power1.inOut' },
    onUpdate(self) {
      if (ucus) {
        if (Math.abs(self.scroll() - ucus.kaydir) < 4) return; // geçişin kendi atlaması
        iptal(); // ziyaretçi geçiş sürerken kaydırdı: kaydırma yeniden sürer
        il.p = self.progress * (N - 1);
      }
      surmeyeDon();
      const hedef = self.progress * (N - 1);
      if (reduce) { il.p = Math.round(hedef); uygula(); return; }
      gsap.to(il, { p: hedef, duration: AYAR.yumusak, ease: 'power3.out', overwrite: 'auto', onUpdate: uygula });
    },
  });
  const kaydirma = (s) => st.start + ((st.end - st.start) * s) / (N - 1);
  const git = (s) => scrollTo({ top: kaydirma(s), behavior: reduce ? 'auto' : 'smooth' });

  // Tıklamayla durağa geçiş: sayfa anında o durağa atlar (kaydırma kamerayı sürmez), kamera seçilen varyantla gider,
  // varışta kart açılır ve kamera yavaşça yaklaşır; bitince kaydırma yeniden sürer (kadraj aynı, sıçrama yok)
  const gor = (v) => story.setView(v.pos, v.target);
  function yol(a, b, dur, ease, yay = 0) {
    const o = { t: 0 }, tepe = yay ? lerp(a.pos, b.pos, 0.5).map((x, i) => (i === 2 ? Math.min(x + yay, GECIS.tavan) : x)) : null;
    return gsap.to(o, {
      t: 1, duration: dur, ease,
      onUpdate: () => {
        const t = o.t, pos = tepe // ikinci derece Bézier: ortada yükselen yay
          ? a.pos.map((x, i) => (1 - t) * (1 - t) * x + 2 * (1 - t) * t * tepe[i] + t * t * b.pos[i])
          : lerp(a.pos, b.pos, t);
        gor({ pos, target: lerp(a.target, b.target, t) });
      },
    });
  }
  function atla(s) {
    if (gecis === 'eski') { git(s); return; }
    iptal();
    donguDur();
    const id = duraklar[s], son = story.shotOf(id), bas = story.view();
    if (reduce) { il.p = s; scrollTo({ top: kaydirma(s), behavior: 'instant' }); uygula(); return; }
    const uzak = uzaklas(son, 1 + GECIS.geri), d = ara(bas.pos, uzak.pos);
    const sure = Math.min(GECIS.uzun, GECIS.kisa + d / 4000);
    if (story.focusedId) story.blur();
    giris.classList.toggle('gizli', s > 0);
    const tl = gsap.timeline({ onComplete: () => { ucus = null; il.p = s; uygula(); } });
    ucus = { tl, s, kaydir: kaydirma(s) };
    scrollTo({ top: ucus.kaydir, behavior: 'instant' });
    const var_ = () => { // varış: kart açılır, yavaş yaklaşma
      if (id && story.focusedId !== id) { story.focusTo(id); donguBaslat(id); }
    };
    if (gecis === 'b') {
      tl.to(perde, { opacity: 1, duration: GECIS.kararma, ease: 'power1.in' })
        .add(() => { gor(uzak); var_(); })
        .to(perde, { opacity: 0, duration: GECIS.kararma * 2, ease: 'power1.out' })
        .add(yol(uzak, son, GECIS.yaklas, 'sine.out'), '<');
    } else if (gecis === 'c' && s > 0) {
      const genel = story.shotOf(null);
      tl.add(yol(bas, genel, Math.min(1, sure * 0.6), 'power2.inOut'))
        .add(yol(genel, uzak, sure, 'power2.inOut'))
        .add(var_, '-=0.25')
        .add(yol(uzak, son, GECIS.yaklas, 'sine.out'), '-=0.05');
    } else {
      tl.add(yol(bas, uzak, sure, 'power2.inOut', gecis === 'd' ? d * GECIS.yay : 0))
        .add(var_, '-=0.25')
        .add(yol(uzak, son, GECIS.yaklas, 'sine.out'), '-=0.05');
    }
  }
  function iptal() {
    if (!ucus) return;
    ucus.tl.kill();
    ucus = null;
    gsap.to(perde, { opacity: 0, duration: 0.2, overwrite: true });
  }
  // Demo (?demo=1): tıklamaları sırayla kendisi yapar; dokunulunca ya da tuşa basılınca durur
  let demoSira = null;
  function demo(sira, aralik = 6) {
    let i = 0;
    const adim = () => { atla(Math.max(0, duraklar.indexOf(sira[i++ % sira.length]))); demoSira = gsap.delayedCall(aralik, adim); };
    demoSira = gsap.delayedCall(1.2, adim);
  }
  const demoDur = () => { demoSira?.kill(); demoSira = null; };

  const bak = (v) => gsap.to(il, { bak: reduce ? 0 : v, duration: 0.6, ease: 'power2.out', overwrite: 'auto', onUpdate: uygula });
  basla.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch' && il.p < 0.04) bak(AYAR.bakis); });
  basla.addEventListener('pointerleave', () => bak(0));
  basla.addEventListener('click', () => { bak(0); git(1); });

  function donguBaslat(id) {
    donguDur();
    if (reduce || !story.api?.current(id)) return;
    let kalan = AYAR.kac;
    const adim = () => {
      if (story.focusedId !== id || kalan-- <= 0) { dongu = null; return; }
      const c = story.api.current(id);
      story.api.show(id, (c.index + 1) % c.count);
      dongu = gsap.delayedCall(AYAR.aralik, adim);
    };
    dongu = gsap.delayedCall(AYAR.ilkBekle, adim);
  }
  function donguDur() { dongu?.kill(); dongu = null; }
  // Ziyaretçi kendisi dokunur ya da tuşa basarsa (oklarla şablon değiştirme dahil) döngü durur
  const ac = new AbortController();
  root.addEventListener('pointerdown', () => { donguDur(); demoDur(); }, { signal: ac.signal });
  addEventListener('keydown', () => { donguDur(); demoDur(); }, { signal: ac.signal });
  addEventListener('resize', () => requestAnimationFrame(uygula), { signal: ac.signal });

  return {
    // Motor girişi bitince: kamerayı tur sürer (sayfa önceki kaydırma konumunda açıldıysa o durağa)
    hazir() {
      if (bekle) return;
      story.drive(true);
      il.p = st.progress * (N - 1);
      uygula();
    },
    // Tıklama kısayolu (story onActivate): turdaki bölgeye doğrudan geçiş; geri isteği (h = null) genel plana
    sec(h) {
      if (!h) { atla(0); return true; }
      const s = duraklar.indexOf(h.id);
      if (s > 0) { atla(s); return true; }
      donguDur();
      story.drive(false);
      return false;
    },
    ileri() { git((Math.round(il.p) + 1) % N); },
    git,
    demo,
    destroy() {
      ac.abort();
      donguDur();
      demoDur();
      iptal();
      perde.remove();
      st.kill();
      alan.remove();
      giris.remove();
      delete root.dataset.tur;
      document.documentElement.classList.remove('oda-tur-on');
    },
  };
}
