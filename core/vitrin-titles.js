// Vitrin başlıklarının hareket imzaları. Her araç başlığı, fare üstündeyken (klavye odağında, dokunmatikte
// seçiliyken) kendi işini anlatan döngüsel bir hareketle oynar; ayrılınca harfler yumuşakça yerine oturur.
// Açılıştan sonra sekizi sırayla birer kez oynar (tanıtım), kullanıcı ilk hareketi yapınca durur.
// Harfler SplitText ile ayrılır: ekran okuyucu tam adı okur (aria-label), harfler gizlidir.
// Hareket azaltmada hiçbir şey bölünmez ve oynamaz; başlık yalnız renk değiştirir (CSS).
// Her döngü bir turdur: dinlenme hâlinden başlar, dinlenme hâlinde biter (tekrarlarken dikiş görünmez).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText.js';
import { EASE_OUT, EASE_IN_OUT } from './eases.js';

gsap.registerPlugin(SplitText);

const UPPER = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ', LOWER = 'abcçdefgğhıijklmnoöprsştuüvyz';
const pick = (s) => s[Math.floor(Math.random() * s.length)];
const REST = { x: 0, y: 0, rotation: 0, rotationX: 0, rotationY: 0, scale: 1, scaleY: 1 };
const PAINT = ['#f4e3c3', '#e08a3c', '#b4523c']; // Painter: filament katmanları (aracın rengi ilk katman)

// QR: rastgele kare modül deseni (8×8); harfin üstüne maske olur, harf modüllere dağılmış görünür.
let qrPattern = null;
function qrMask() {
  if (qrPattern) return qrPattern;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (Math.random() < 0.58) g.fillRect(x * 8, y * 8, 8, 8);
  return (qrPattern = `url(${c.toDataURL()})`);
}

const LOOPS = {
  // Kutu ve Organizer: harfler bölmelerinden fırlar, karışık sırayla yerlerine "tık" diye oturur
  bin: (ch) => gsap.timeline()
    .to(ch, { y: '-0.42em', rotation: () => gsap.utils.random(-16, 16), duration: 0.26, ease: 'power2.out', stagger: { each: 0.03, from: 'random' } })
    .to(ch, { y: 0, rotation: 0, duration: 0.45, ease: 'back.out(2.4)', stagger: { each: 0.04, from: 'random' } }, '>-0.05')
    .to({}, { duration: 0.6 }),

  // Vazo Üreteci: harfler soldan sağa bir dalga hâlinde torna gibi kendi ekseninde döner
  vase: (ch) => gsap.timeline()
    .set(ch, { transformPerspective: 260 })
    .to(ch, { rotationY: 360, duration: 0.95, ease: EASE_IN_OUT, stagger: 0.055 })
    .set(ch, { rotationY: 0 })
    .to({}, { duration: 0.5 }),

  // Fidget Clicker: rastgele harfler tuş gibi basılır (tık, tık … tık-tık-tık), sonunda bütün tuşlar birlikte
  clicker(ch) {
    const tl = gsap.timeline();
    const press = (targets, at, each = 0) => tl
      .to(targets, { y: '0.12em', scaleY: 0.76, transformOrigin: '50% 100%', duration: 0.06, ease: 'power2.out', stagger: each }, at)
      .to(targets, { y: 0, scaleY: 1, duration: 0.24, ease: 'back.out(4)', stagger: each }, at + 0.06);
    [0, 0.2, 0.4, 0.78, 0.9, 1.02, 1.14].forEach((t) => press(ch[Math.floor(Math.random() * ch.length)], t));
    press(ch, 1.5, 0.012);
    return tl.to({}, { duration: 0.5 });
  },

  // 3D Yazı: harfler derinlik kazanır, derinlik bir yandan öbür yana döner (dönen 3B yazı gibi)
  text: (ch, el) => gsap.timeline()
    .to(el, { '--dx': 1.1, '--dy': 1.3, duration: 0.5, ease: EASE_OUT })
    .to(ch, { y: '-0.06em', duration: 0.25, ease: EASE_IN_OUT, stagger: { each: 0.04, yoyo: true, repeat: 1 } }, 0)
    .to(el, { '--dx': -1.1, duration: 0.8, ease: EASE_IN_OUT }, 0.6)
    .to(el, { '--dx': 0, '--dy': 0, duration: 0.5, ease: EASE_IN_OUT }, 1.45)
    .to({}, { duration: 0.35 }),

  // Text Flip: havalimanı tabelası; her harf iki kez başka bir harfe çevrilir, sonra kendine döner
  flip(ch) {
    ch.forEach((c) => { c.style.width = `${c.offsetWidth}px`; c.style.textAlign = 'center'; });
    const tl = gsap.timeline().set(ch, { transformPerspective: 300 });
    ch.forEach((c, i) => {
      const orig = c.dataset.ch, abc = orig === orig.toLowerCase() ? LOWER : UPPER;
      const flipTo = (t, letter) => tl
        .to(c, { rotationX: -90, duration: 0.06, ease: 'power1.in' }, t)
        .call(() => { c.textContent = letter; }, null, t + 0.06)
        .fromTo(c, { rotationX: 90 }, { rotationX: 0, duration: 0.06, ease: 'power1.out', immediateRender: false }, t + 0.06);
      const at = i * 0.07;
      flipTo(at, pick(abc));
      flipTo(at + 0.13, pick(abc));
      flipTo(at + 0.26, orig);
    });
    return tl.to({}, { duration: 0.7 });
  },

  // 3D QR Kod: harfler soldan sağa taramayla QR modüllerine dağılır, modüller irileşir, sonra yeniden harf olur
  qr: (ch) => {
    const g = ch.map((c) => c.firstElementChild);
    return gsap.timeline()
      .to(g, { opacity: 0, duration: 0.16, ease: 'none', stagger: 0.05 })
      .to(ch, { '--px': 1, duration: 0.16, ease: 'none', stagger: 0.05 }, 0)
      .to(ch, { '--cell': '1.9em', duration: 0.45, ease: EASE_IN_OUT, stagger: 0.03 }, 0.25)
      .to(ch, { '--cell': '1.1em', '--px': 0, duration: 0.2, ease: 'none', stagger: 0.05 }, 0.95)
      .to(g, { opacity: 1, duration: 0.2, ease: 'none', stagger: 0.05 }, 0.95)
      .to({}, { duration: 0.35 });
  },

  // Filament Painter: harflerin içinden filament renk katmanları aşağıdan yukarı akar, sonra aracın rengine döner
  painter: (ch, el, color) => gsap.timeline({ onStart: () => el.classList.add('is-painting') })
    .fromTo(el, { '--bp': '0em' }, { '--bp': '-2.4em', duration: 1.8, ease: 'none' }, 0)
    .to(el, { '--b2': PAINT[0], '--b3': PAINT[1], '--b4': PAINT[2], duration: 0.35, ease: EASE_OUT }, 0)
    .to(el, { '--b2': color, '--b3': color, '--b4': color, duration: 0.35, ease: EASE_IN_OUT }, 1.45),

  // Puzzle Maker: harfler parça parça ayrılır, kenarlardan ortaya doğru yerine kilitlenir, "tık"
  puzzle: (ch) => gsap.timeline()
    .to(ch, {
      x: (i) => `${(i - (ch.length - 1) / 2) * 0.05}em`, y: () => `${gsap.utils.random(-0.12, 0.12)}em`,
      rotation: () => gsap.utils.random(-18, 18), duration: 0.3, ease: EASE_OUT, stagger: { each: 0.02, from: 'center' },
    })
    .to(ch, { x: 0, y: 0, rotation: 0, duration: 0.42, ease: 'back.out(2.6)', stagger: { each: 0.03, from: 'edges' } }, '+=0.22')
    .to(ch, { scale: 1.06, duration: 0.07, ease: 'power2.out' }, '>-0.04')
    .to(ch, { scale: 1, duration: 0.2, ease: EASE_OUT })
    .to({}, { duration: 0.55 }),
};

// Tek bir başlığa (oda sahnesinde yakın plan kartının başlığı) aracın harf hareketini uygular: harfleri böler,
// döngüyü cycles kez oynatır. Hareket azaltmada hiçbir şey yapmaz. Dönüş: { stop() } — akışı durdurur, harfleri
// yerine koyar ve bölmeyi geri alır (başlık metni değişmeden önce çağrılmalı).
export function playTitle(el, id, { cycles = 1, color = '' } = {}) {
  if (!LOOPS[id] || matchMedia('(prefers-reduced-motion: reduce)').matches) return { stop() {} };
  const split = SplitText.create(el, { type: 'words,chars', tag: 'span', wordsClass: 'v-wd', charsClass: 'v-ch', propIndex: true });
  split.chars.forEach((c) => { c.dataset.ch = c.textContent; });
  if (id === 'qr') {
    el.style.setProperty('--qr', qrMask());
    split.chars.forEach((c) => { c.innerHTML = `<span class="v-g">${c.textContent}</span>`; });
  }
  const tl = LOOPS[id](split.chars, el, color).repeat(cycles - 1);
  return {
    stop() {
      tl.kill();
      gsap.killTweensOf([el, ...split.chars]);
      el.classList.remove('is-painting');
      ['--dx', '--dy', '--b2', '--b3', '--b4', '--bp', '--qr'].forEach((k) => el.style.removeProperty(k));
      if (el.contains(split.chars[0])) split.revert(); // metin bu arada değiştiyse eskisini geri yazma
    },
  };
}

// titles: başlık bağlantıları (.v-title[data-id] > .v-name > .v-text). Dönüş: { play, stop, relabel, teaser, destroy }
export function titleMotion(titles, { reduced = false } = {}) {
  const noop = () => {};
  if (reduced) return { play: noop, stop: noop, relabel: noop, teaser: () => ({ stop: noop }), destroy: noop };
  const st = new Map(); // id → { el (.v-text), split, chars, color, tl }

  function split(a) {
    const id = a.dataset.id, el = a.querySelector('.v-text');
    if (!el || !LOOPS[id]) return;
    const old = st.get(id);
    if (old) {
      // SplitText aynı öğeyi yeniden bölerken önce ilk hâline döner (eski dildeki ad geri gelir):
      // sayfanın yazdığı yeni adı al, eskiyi kendimiz geri al, adı yeniden yaz
      old.tl?.kill();
      const text = el.textContent;
      old.split.revert();
      el.textContent = text;
    }
    el.removeAttribute('aria-label'); // eski dildeki ad kalmasın; SplitText yenisini yazar
    const split = SplitText.create(el, { type: 'words,chars', tag: 'span', wordsClass: 'v-wd', charsClass: 'v-ch', propIndex: true });
    split.chars.forEach((c) => { c.dataset.ch = c.textContent; });
    if (id === 'qr') {
      a.style.setProperty('--qr', qrMask());
      split.chars.forEach((c) => { c.innerHTML = `<span class="v-g">${c.textContent}</span>`; });
    }
    st.set(id, { el, split, chars: split.chars, color: a.style.getPropertyValue('--c').trim(), tl: null });
  }
  titles.forEach(split);

  const teasing = new Set(); // tanıtımın oynattığı başlıklar (kullanıcının başlattığı döngü buradan çıkar)
  // Döngüyü başlat: cycles -1 sonsuz (fare üstünde kaldıkça), yoksa o kadar tur oynayıp durur
  function play(id, { cycles = -1, teaser = false } = {}) {
    const s = st.get(id);
    if (!s) return;
    if (teaser) teasing.add(id); else teasing.delete(id);
    stop(id, { quick: true });
    s.tl = LOOPS[id](s.chars, s.el, s.color).repeat(cycles < 0 ? -1 : cycles - 1);
    s.tl.eventCallback('onComplete', () => { s.tl = null; teasing.delete(id); settle(id); });
  }
  // Durdur: harfler bulundukları yerden yumuşakça yerine oturur
  function stop(id, { quick = false } = {}) {
    const s = st.get(id);
    if (!s?.tl) return;
    s.tl.kill();
    s.tl = null;
    settle(id, quick ? 0 : 0.32);
  }
  function settle(id, dur = 0.32) {
    const { el, chars, color } = st.get(id);
    gsap.to(chars, { ...REST, duration: dur, ease: EASE_OUT, overwrite: true });
    if (id === 'flip') chars.forEach((c) => { c.textContent = c.dataset.ch; gsap.set(c, { clearProps: 'width,textAlign' }); });
    if (id === 'qr') {
      gsap.to(chars.map((c) => c.firstElementChild), { opacity: 1, duration: dur, overwrite: true });
      gsap.to(chars, { '--px': 0, '--cell': '1.1em', duration: dur });
    }
    if (id === 'text') gsap.to(el, { '--dx': 0, '--dy': 0, duration: dur, ease: EASE_OUT, overwrite: true });
    if (id === 'painter') {
      gsap.to(el, { '--b2': color, '--b3': color, '--b4': color, duration: dur, overwrite: true, onComplete: () => el.classList.remove('is-painting') });
    }
  }
  // Dil değişince: sayfa yeni adı yazdı, harfler yeniden bölünür
  function relabel() { titles.forEach((a) => { stop(a.dataset.id, { quick: true }); split(a); }); }

  // Tanıtım: sekiz başlık sırayla birer tur oynar; stop() hemen bitirir (yalnız kendi oynattıklarını durdurur)
  function teaser(order, { gap = 1.5, delay = 0.6 } = {}) {
    const tl = gsap.timeline({ delay });
    order.forEach((id, i) => tl.call(() => play(id, { cycles: 1, teaser: true }), null, i * gap));
    return { stop() { tl.kill(); teasing.forEach((id) => stop(id)); teasing.clear(); } };
  }

  return {
    play, stop, relabel, teaser,
    destroy() { st.forEach((s) => { s.tl?.kill(); s.split.revert(); }); st.clear(); },
  };
}
