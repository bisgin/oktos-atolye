// Kaydırmalı tur (docs/oda-sahnesi.md): sayfa kaydırıldıkça kamera duraktan durağa gider; tıklamak gerekmez.
// Genel planda altta "Odana dair her şey", üstünde "Çekmece organizeriyle başla" düğmesi: üzerine gelince kamera
// organizere biraz yaklaşır, tıklayınca ilk durağa kayar. Durakta bölgenin kartı açılır (uçuşsuz: kamerayı kaydırma
// sürer) ve şablonlar kendiliğinden birkaç kez değişir; dokunulunca ya da tuşa basılınca döngü durur. Tıklanan bölge
// turdaysa sayfa o durağa kayar; turda değilse motor eskisi gibi yakınlaşır, ilk kaydırmada tura dönülür.
// Hareket azaltmada kaydırma yumuşatılmaz, kamera durak durak kesilir; şablonlar kendiliğinden değişmez.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true }); // telefonda adres çubuğu açılıp kapanınca zıplamasın

const AYAR = {
  durakBoyu: 0.9,       // duraklar arası kaydırma, ekran yüksekliği kesri
  yumusak: 0.7,         // kameranın kaydırmaya yetişme süresi, sn
  gir: 0.08, cik: 0.2,  // durağa bu yakınlıkta girilir (kart açılır), bu uzaklıkta çıkılır (durak aralığı kesri)
  bakis: 0.14,          // "başla" düğmesinin üzerine gelince kameranın ilk durağa yaklaşma payı
  ilkBekle: 1.4,        // durakta ilk şablon değişimine kadar, sn
  aralik: 1.9,          // şablon değişimleri arası, sn
  kac: 2,               // kaç kez değişir (2: ziyaretçi 3 şablon görür)
};
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const yumusat = gsap.parseEase('power2.inOut');

// duraklar: [null (genel plan), 'cekmece', ...]; metin: { baslik, basla }; bekle: kamerayı hemen sürme (?odak= çekimi)
export function odaTuru(root, story, { duraklar, metin, reduce = false, bekle = false }) {
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

  function poz(p) {
    const k = Math.max(0, Math.min(Math.floor(p), N - 2)), f = yumusat(Math.min(Math.max(p - k, 0), 1));
    const a = story.shotOf(duraklar[k]), b = story.shotOf(duraklar[k + 1]);
    return { pos: lerp(a.pos, b.pos, f), target: lerp(a.target, b.target, f) };
  }
  function uygula() {
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
      surmeyeDon();
      const hedef = self.progress * (N - 1);
      if (reduce) { il.p = Math.round(hedef); uygula(); return; }
      gsap.to(il, { p: hedef, duration: AYAR.yumusak, ease: 'power3.out', overwrite: 'auto', onUpdate: uygula });
    },
  });
  const git = (s) => scrollTo({ top: st.start + ((st.end - st.start) * s) / (N - 1), behavior: reduce ? 'auto' : 'smooth' });

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
  root.addEventListener('pointerdown', donguDur, { signal: ac.signal });
  addEventListener('keydown', donguDur, { signal: ac.signal });
  addEventListener('resize', () => requestAnimationFrame(uygula), { signal: ac.signal });

  return {
    // Motor girişi bitince: kamerayı tur sürer (sayfa önceki kaydırma konumunda açıldıysa o durağa)
    hazir() {
      if (bekle) return;
      story.drive(true);
      il.p = st.progress * (N - 1);
      uygula();
    },
    // Tıklama kısayolu (story onActivate): turdaki bölgede sayfa o durağa kayar; geri isteği (h = null) genel plana
    sec(h) {
      if (!h) { git(0); return true; }
      const s = duraklar.indexOf(h.id);
      if (s > 0) { git(s); return true; }
      donguDur();
      story.drive(false);
      return false;
    },
    ileri() { git((Math.round(il.p) + 1) % N); },
    git,
    destroy() {
      ac.abort();
      donguDur();
      st.kill();
      alan.remove();
      giris.remove();
      delete root.dataset.tur;
      document.documentElement.classList.remove('oda-tur-on');
    },
  };
}
