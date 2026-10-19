// Oda sahnesinin yakın plan paneli (lab/oda.html; ana sayfaya taşınınca da aynı). Motor kartı açınca (onCard) kartı
// doldurur: büyük başlıkta görünen ürünün adı (aracın renginde, harf hareketiyle bir tur), hikâye cümlesi, şablon
// seçici (‹ ad n/N ›), altta hangi araçta açılacağı. Şablon klavye oklarıyla, dokunmatikte yana kaydırarak ya da ürüne yeniden tıklayarak
// değişir. Atölyesi hazır bölgelerde (Kutu, Vazo) üç değişimden sonra ipucu satırının yerinde tozdan bir çağrı yazısı
// oluşur ("Sana özel saksıyı tasarla!") ve gerçek bir düğme olarak kalır.
import { gsap } from 'gsap';
import { STORIES, ODA_STORY } from './story-data.js';
import { playTitle } from './vitrin-titles.js';
import { t } from './i18n.js';

// Araçların filament rengi (başlığın ve toz yazısının tonu, harf hareketi)
export const TOOL_TONE = { magaza: '#e8c48c', bin: '#ef8a46', vase: '#e3a093', clicker: '#74a7f2', text: '#ecc659', flip: '#a7cf9f', qr: '#c9d2dc', painter: '#6fc3bb', puzzle: '#ef6f62' };
const DUST_AFTER = 3; // kaç şablon değişiminden sonra çağrı yazısı gelir
const SWIPE = 40; // px: bundan kısa yatay kaydırma şablon değiştirmez
const coarse = () => matchMedia('(pointer: coarse)').matches;
const ARROW = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

export function odaPanel(root, { lang = 'tr', reduce = false } = {}) {
  let story = null, card = null, els = null;
  let zone = null, tool = null, titleFx = null, dustFx = null, stepping = false;
  const counts = new Map(); // bölge → şablon değişim sayısı (sayfa açık kaldıkça)
  // Atölyesi hazır bölge: şablonlarından biri aracı açabiliyor (düğmeyle aynı kaynak: şablonun preset'i)
  const dusty = (z) => story.api.templates(z).some((x) => x.preset);

  // Kartın motorun kurduğu iskeletine eklenenler: şablon seçici, araç satırı, toz düğmesi
  function build(c) {
    card = c;
    const tpl = document.createElement('div');
    tpl.className = 'sc-tpl';
    tpl.setAttribute('role', 'group');
    tpl.setAttribute('aria-label', t('oda.tpl'));
    tpl.innerHTML = `<button type="button" class="sc-step">${ARROW('M15 5 8 12l7 7')}</button>
      <p class="sc-tpl-name" aria-live="polite"><span></span> <small></small></p>
      <button type="button" class="sc-step">${ARROW('m9 5 7 7-7 7')}</button>`;
    const [prev, next] = tpl.querySelectorAll('.sc-step');
    prev.setAttribute('aria-label', t('oda.prevTpl'));
    next.setAttribute('aria-label', t('oda.nextTpl'));
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    card.querySelector('.sc-desc').after(tpl);
    const arac = document.createElement('p');
    arac.className = 'sc-arac';
    card.querySelector('.sc-actions').after(arac);
    const dust = document.createElement('button');
    dust.type = 'button';
    dust.className = 'oda-dust';
    dust.hidden = true;
    dust.innerHTML = `<span class="dust-text"></span>${ARROW('M5 12h14M13 6l6 6-6 6')}`;
    dust.addEventListener('click', () => { if (zone) story.pick(zone); });
    card.append(dust);
    els = {
      arac, tpl, name: tpl.querySelector('.sc-tpl-name span'), n: tpl.querySelector('.sc-tpl-name small'),
      title: card.querySelector('.sc-title'), hint: card.querySelector('.sc-hint'), dust, dustText: dust.querySelector('.dust-text'),
    };
  }

  // Seçicinin yazısı ve "Bu şablonla tasarla"nın hedefi o anki şablona göre
  function refresh(cur) {
    const many = !!cur && cur.count > 1;
    els.tpl.hidden = !many;
    if (many) {
      els.name.textContent = cur.name[lang] || cur.name.tr;
      els.n.textContent = `${cur.index + 1}/${cur.count}`;
    }
    story.setPreset(zone, cur?.preset ?? null);
    // Araç satırı şablona göre: mağaza ürünü satışta, araç şablonu kendi aracında (tepside ikisi bir arada)
    const arac = cur?.arac || tool;
    els.arac.textContent = arac === 'magaza' || cur?.preset === 'magaza' ? t('oda.magazada')
      : t(cur?.preset ? 'oda.aracta' : 'oda.aracYakinda').replace('{a}', STORIES[arac].name[lang]);
  }

  function onCard(h, c) {
    titleFx?.stop();
    titleFx = null;
    dustFx?.cancel();
    dustFx = null;
    if (!els) build(c);
    if (!h || !story) { zone = null; return; }
    zone = h.id;
    tool = h.tool;
    const tone = TOOL_TONE[tool];
    card.style.setProperty('--c', tone);
    // Başlık görünen ürün (işaretçideki kısa ad); araç adı altta, hangi araçta açılacağıyla
    els.title.textContent = ODA_STORY.hotspots?.[zone]?.pin?.[lang] || h.name;
    els.title.dataset.tool = tool;
    if (!reduce) titleFx = playTitle(els.title, tool, { cycles: 1, color: tone });
    const cur = story.api.current(zone);
    refresh(cur);
    // İpucu: şablonu çok olan bölgede nasıl değiştirileceği; dokunmatikte etrafa bakma kapalı (kaydırma şablonundur)
    if (cur?.count > 1) els.hint.textContent = t(coarse() ? 'oda.tplHintTouch' : 'oda.tplHint');
    else if (coarse()) els.hint.textContent = '';
    const donIpucu = t('oda.donHint'), ipucu = els.hint.textContent.replace(donIpucu, '').trim(); // önceki bölgeden kalmasın
    els.hint.textContent = story.api.donebilir?.(zone) ? [ipucu, donIpucu].filter(Boolean).join(' ') : ipucu;
    // Çağrı yazısı bu bölgede bir kez oluştuysa artık yerinde durur
    const done = dusty(zone) && (counts.get(zone) || 0) >= DUST_AFTER;
    if (done) els.dustText.textContent = t('oda.dust.' + zone);
    els.dust.hidden = !done;
    els.hint.hidden = done || !els.hint.textContent;
    if (done) fitDust();
  }

  // Toz yazısı tek satırdır (zerreler bir kerede örneklenir): karta sığmazsa yazı küçülür
  function fitDust() {
    els.dust.style.fontSize = '';
    const cs = getComputedStyle(card);
    const room = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const w = els.dust.scrollWidth;
    if (w > room) els.dust.style.fontSize = `${(parseFloat(getComputedStyle(els.dust).fontSize) * room) / w}px`;
  }

  async function step(d) {
    if (!zone || stepping || story.busy) return; // atölyeye geçerken şablon değişmez
    const cur = story.api.current(zone);
    if (!cur || cur.count < 2) return;
    stepping = true;
    try { await story.api.show(zone, cur.index + d, { reduced: reduce }); } finally { stepping = false; }
  }

  // Değişim nereden gelirse gelsin (seçici, ok, kaydırma, ürüne tıklama) seçici ve sayaç güncellenir
  function changed(z, info) {
    if (z !== zone) return;
    refresh(info);
    const n = (counts.get(z) || 0) + 1;
    counts.set(z, n);
    if (n === DUST_AFTER && dusty(z)) dustIn();
  }

  function dustIn() {
    els.dustText.textContent = t('oda.dust.' + zone);
    els.hint.hidden = true;
    els.dust.hidden = false;
    fitDust();
    root.querySelector('.story-live').textContent = els.dustText.textContent;
    if (reduce) { els.dust.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' }); return; }
    // Zerreler ürünün ekrandaki yerinden kalkar. Kart hâlâ açılıyorsa (kayıyorsa) hedefler kart oturunca ölçülür.
    const z = zone;
    let call = null;
    const go = () => {
      if (zone !== z) return;
      if (gsap.isTweening(card)) { call = gsap.delayedCall(0.05, go); return; }
      const c = story.api.center(z)?.project(story.camera);
      dustFx = dustText(els.dustText, root, c && c.z < 1 ? [(c.x + 1) / 2, (1 - c.y) / 2] : null);
    };
    dustFx = { cancel() { call?.kill(); } };
    go();
  }

  return {
    onCard,
    // Denetleyici kurulunca: sahnenin değişim haberi, klavye okları, dokunmatik kaydırma. Dönen işlev hepsini söker
    // (sahne yeniden kurulursa ya da sayfa paneli bırakırsa).
    attach(s) {
      story = s;
      story.api.onChange = changed;
      const ac = new AbortController(), on = { signal: ac.signal };
      addEventListener('keydown', (e) => {
        if (!zone || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        step(e.key === 'ArrowRight' ? 1 : -1); // basılı tutmak tekrar etmez: her basış bir şablon
      }, on);
      const area = root.querySelector('.story-canvas');
      let sw = null, don = null;
      // Ürünün üstünden başlayan sürükleme ürünü çevirir (fare ve parmak); başka yerden başlayan yatay kaydırma
      // (dokunmatik) şablon değiştirir. Sürüklemeden bırakılan tıklama motorda kalır (sıradaki şablon).
      area.addEventListener('pointerdown', (e) => {
        sw = e.pointerType === 'touch' && zone ? [e.clientX, e.clientY] : null;
        don = null;
        if (zone && story.api.donebilir?.(zone) && story.hit?.(e.clientX, e.clientY) === zone) {
          don = { x: e.clientX, a0: story.api.donus(zone), id: e.pointerId, oynadi: false };
          sw = null;
        }
      }, on);
      area.addEventListener('pointermove', (e) => {
        if (!don || e.pointerId !== don.id) return;
        const dx = e.clientX - don.x;
        if (!don.oynadi && Math.abs(dx) < 6) return;
        if (!don.oynadi) { don.oynadi = true; area.setPointerCapture?.(e.pointerId); root.classList.add('oda-donuyor'); }
        story.api.dondur(zone, don.a0 + (dx / area.clientWidth) * 3.2); // ekran eninin yarısı ≈ 90°
      }, on);
      const donBitir = () => { don = null; root.classList.remove('oda-donuyor'); };
      area.addEventListener('pointercancel', () => { sw = null; donBitir(); }, on);
      area.addEventListener('pointerup', (e) => {
        donBitir();
        if (!sw) return;
        const dx = e.clientX - sw[0], dy = e.clientY - sw[1];
        sw = null;
        if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1); // sola kaydır: sıradaki
      }, on);
      return () => {
        ac.abort();
        if (story.api.onChange === changed) story.api.onChange = null;
        onCard(null);
        els?.arac.remove();
        els?.tpl.remove();
        els?.dust.remove();
        els = null;
        story = null;
      };
    },
  };
}

// Toz yazısı: zerreler ürünün ekrandaki yerinden (from: tuvalin kesri olarak [x, y]; yoksa panelin karşı yanı) kalkıp
// yazının piksellerine konar, harfler soldan sağa oluşur; hepsi konunca gerçek yazı belirir, tuval söner (bir kez,
// ~1,7 sn). Yazı ölçüsü ve taban çizgisi DOM'dakiyle aynı alınır: geçişte yazı yerinden oynamaz.
function dustText(label, root, from) {
  const box = root.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(label);
  const lr = range.getBoundingClientRect();
  const cs = getComputedStyle(label);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const dpr = Math.min(devicePixelRatio || 1, 2);

  // 1) Yazının pikselleri
  const off = document.createElement('canvas');
  off.width = Math.ceil(lr.width) + 8;
  off.height = Math.ceil(lr.height) + 8;
  const o = off.getContext('2d', { willReadFrequently: true });
  o.font = font;
  const m = o.measureText(label.textContent);
  o.fillText(label.textContent, 4, 4 + (m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent));
  const data = o.getImageData(0, 0, off.width, off.height).data;
  const gap = coarse() ? 3 : 2;
  const pts = [];
  for (let y = 0; y < off.height; y += gap) {
    for (let x = 0; x < off.width; x += gap) if (data[(y * off.width + x) * 4 + 3] > 120) pts.push([lr.left - box.left - 4 + x, lr.top - box.top - 4 + y]);
  }

  // 2) Zerreler: kalkış yeri ürünün çevresi, gecikme harfin soldan konumuna göre (yazı soldan sağa oluşur)
  const fallback = root.dataset.panel === 'side' ? [0.66, 0.5] : [0.5, 0.34];
  const [ox, oy] = [box.width * (from || fallback)[0], box.height * (from || fallback)[1]];
  const spread = Math.min(box.width, box.height) * 0.14;
  const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])) || x0 + 1;
  const parts = pts.map(([tx, ty]) => {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
    return {
      sx: ox + Math.cos(a) * r, sy: oy + Math.sin(a) * r, tx, ty,
      delay: 0.5 * ((tx - x0) / (x1 - x0 || 1)) + Math.random() * 0.22,
      dur: 0.8 + Math.random() * 0.35,
      swirl: (Math.random() - 0.5) * 90, // yol boyunca yana sapma (px)
    };
  });
  const end = Math.max(...parts.map((p) => p.delay + p.dur));

  const cv = document.createElement('canvas');
  cv.className = 'oda-dust-fx';
  cv.width = Math.round(box.width * dpr);
  cv.height = Math.round(box.height * dpr);
  cv.setAttribute('aria-hidden', 'true');
  root.append(cv);
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  g.fillStyle = cs.color;
  const show = [label, label.nextElementSibling].filter(Boolean); // yazı ve ok birlikte belirir
  show.forEach((el) => { el.style.opacity = '0'; });
  const ease = (p) => 1 - (1 - p) ** 3;
  const size = gap * 0.9;
  let raf = 0, t0 = performance.now(), done = false;

  function frame(now) {
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, box.width, box.height);
    for (const p of parts) {
      const k = Math.min(1, Math.max(0, (t - p.delay) / p.dur));
      if (k <= 0) continue;
      const e = ease(k), bend = Math.sin(k * Math.PI) * p.swirl;
      const dx = p.tx - p.sx, dy = p.ty - p.sy, len = Math.hypot(dx, dy) || 1;
      g.globalAlpha = Math.min(1, k * 3);
      g.fillRect(p.sx + dx * e - (dy / len) * bend, p.sy + dy * e + (dx / len) * bend, size, size);
    }
    if (t < end) { raf = requestAnimationFrame(frame); return; }
    finish();
  }
  // Konunca gerçek yazı belirir, zerreler söner
  function finish() {
    if (done) return;
    done = true;
    show.forEach((el) => {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      el.style.opacity = '';
    });
    cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' }).onfinish = () => cv.remove();
  }
  raf = requestAnimationFrame(frame);
  return {
    cancel() {
      cancelAnimationFrame(raf);
      done = true;
      show.forEach((el) => { el.style.opacity = ''; });
      cv.remove();
    },
  };
}
