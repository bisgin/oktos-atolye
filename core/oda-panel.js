// Oda sahnesinin yakın plan paneli (oda/index.html, /oda/). Motor kartı açınca (onCard) kartı doldurur: büyük başlıkta
// yuvanın kısa adı (ürün tonunda), hikâye cümlesi, ürün seçici (‹ ad n/N ›; tek ürünlü yuvada oklar yok), fiyat ve durum
// satırı (ürün görseli varsa yanında), düğme, yanında "Ürün sayfası" ve altta "Tüm ürünler" bağlantısı (2026-11-01:
// anahtar tepsisinin kalıbı bütün yuvalarda). Düğme ürünün durumuna göre: satışta "Satın al" (mağaza sayfası), stokta
// yok ya da mağaza sayfası yok "Sipariş ver" (WhatsApp'a hazır mesaj, core/order-config.js). İkisini de motor yeni
// sekmede açar (core/story.js pick: preset 'magaza' + disari). "Ürün sayfası" (2026-11-02) seçili ürünün 2B sayfasına
// gider (urunler/urun.html?id=<ürün kimliği>), seçici değişince adresi de değişir. Fiyat yalnız mağaza fiyatı
// (core/urun-veri.js). Ürün klavye oklarıyla, dokunmatikte yana kaydırarak ya da ürüne yeniden tıklayarak değişir;
// ürünün üstünden başlayan sürükleme onu çevirir.
import { ODA_STORY, PORTFOLYO_DURAK } from './story-data.js';
import { ORDER } from './order-config.js';
import { t } from './i18n.js';
import { guvenliAdres } from './guvenli-adres.js';

export const URUN_TONU = '#e8c48c'; // başlığın tonu (işaretçilerin rengi core/oda.css'te aynı)
// 2B ürün listesi ve tek ürün sayfası; sayfaya göre göreli (oda/index.html; eski lab/oda.html aynı derinlikte, yönlendirir)
const TUM_URUNLER = '../urunler/index.html';
const URUN_SAYFASI = '../urunler/urun.html';
const SWIPE = 40; // px: bundan kısa yatay kaydırma ürün değiştirmez
const coarse = () => matchMedia('(pointer: coarse)').matches;
const ARROW = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

// "Sipariş ver" adresi: WhatsApp'a hazır mesaj (ürünün adı ve varsa mağaza sayfası); hat yoksa e-posta, o da yoksa mağaza
export function siparisAdresi(urun, lang = 'tr') {
  const magaza = guvenliAdres(urun.magaza);
  const msg = [t('oda.siparisMesaj', { ad: urun.name?.[lang] || urun.name?.tr || '' }), magaza].filter(Boolean).join('\n');
  if (ORDER.whatsapp) return `https://wa.me/${ORDER.whatsapp}?text=${encodeURIComponent(msg)}`;
  if (ORDER.email) return `mailto:${ORDER.email}?subject=${encodeURIComponent(t('order.subject'))}&body=${encodeURIComponent(msg)}`;
  return magaza;
}

export function odaPanel(root, { lang = 'tr', reduce = false } = {}) {
  let story = null, card = null, els = null, zone = null, stepping = false;

  // Kartın motorun kurduğu iskeletine eklenenler: ürün seçici, fiyat ve durum satırı, "Tüm ürünler"
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
    const urun = document.createElement('div');
    urun.className = 'sc-urun';
    urun.innerHTML = '<img class="sc-gorsel" alt="" decoding="async" hidden><p><b class="sc-fiyat"></b><span class="sc-durum"></span></p>';
    tpl.after(urun);
    const gorsel = urun.querySelector('.sc-gorsel');
    gorsel.addEventListener('error', () => { gorsel.hidden = true; }); // kırık resim gösterilmez
    const tum = document.createElement('a');
    tum.className = 'sc-tum';
    tum.href = TUM_URUNLER;
    tum.innerHTML = `<span>${t('oda.tumUrunler')}</span>${ARROW('M5 12h14M13 6l6 6-6 6')}`;
    card.querySelector('.sc-actions').after(tum);
    // Ürün sayfası: ürün düğmesinin yanında ikincil bağlantı (adresi refresh yazar; kimliği olmayan üründe gizli)
    const sayfa = document.createElement('a');
    sayfa.className = 'sc-sayfa';
    sayfa.hidden = true;
    sayfa.innerHTML = `<span>${t('oda.urunSayfasi')}</span>${ARROW('M5 12h14M13 6l6 6-6 6')}`;
    card.querySelector('.sc-go').after(sayfa);
    els = {
      tpl, prev, next, urun, gorsel, tum, sayfa, name: tpl.querySelector('.sc-tpl-name span'), n: tpl.querySelector('.sc-tpl-name small'),
      fiyat: urun.querySelector('.sc-fiyat'), durum: urun.querySelector('.sc-durum'),
      title: card.querySelector('.sc-title'), hint: card.querySelector('.sc-hint'), go: card.querySelector('.sc-go'),
    };
  }

  // Seçici, fiyat ve durum, görsel ve düğme o anki ürüne göre
  function refresh(cur) {
    const many = !!cur && cur.count > 1;
    els.tpl.hidden = !cur?.name;
    els.prev.hidden = els.next.hidden = !many;
    els.tpl.classList.toggle('tek', !many);
    if (cur?.name) {
      els.name.textContent = cur.name[lang] || cur.name.tr;
      els.n.textContent = many ? `${cur.index + 1}/${cur.count}` : '';
    }
    els.fiyat.textContent = cur?.fiyat ?? '';
    els.fiyat.hidden = !cur?.fiyat;
    els.durum.textContent = cur?.durum ? t('oda.durum.' + cur.durum) : '';
    els.urun.hidden = !cur?.fiyat && !cur?.durum;
    const src = cur?.gorsel ? new URL(`../${cur.gorsel}`, import.meta.url).href : null;
    if (src && els.gorsel.getAttribute('src') !== src) { els.gorsel.hidden = false; els.gorsel.src = src; }
    else if (!src) { els.gorsel.hidden = true; els.gorsel.removeAttribute('src'); }
    // Satışta → mağaza sayfası; stok yok ya da sayfa yok → sipariş (WhatsApp)
    const magaza = guvenliAdres(cur?.magaza); // yalnız oktosworkshop.com; değilse WhatsApp siparişine düşer
    const satista = cur?.durum === 'satista' && !!magaza;
    const adres = cur ? (satista ? magaza : siparisAdresi(cur, lang)) : null;
    story.setPreset(zone, adres ? 'magaza' : null, adres);
    els.go.textContent = t(satista ? 'oda.satinAl' : 'oda.siparis');
    // Ürün sayfası: seçili ürünün kimliğiyle (seçici, ok, kaydırma ya da turun döngüsü değiştirince burası yeniden yazılır)
    if (cur?.id) {
      els.sayfa.href = `${URUN_SAYFASI}?id=${encodeURIComponent(cur.id)}`;
      els.sayfa.setAttribute('aria-label', t('oda.urunSayfasiAria', { ad: cur.name?.[lang] || cur.name?.tr || '' }));
      els.sayfa.hidden = false;
    } else {
      els.sayfa.removeAttribute('href');
      els.sayfa.hidden = true;
    }
  }

  function onCard(h, c) {
    if (!els) build(c);
    if (!h || !story) { zone = null; return; }
    zone = h.id;
    card.style.setProperty('--c', URUN_TONU);
    els.title.textContent = ODA_STORY.hotspots?.[zone]?.pin?.[lang] || h.name; // kısa ad; uzun adı şerit söyler
    const cur = story.api.current(zone);
    // Portfolyo durağı (kitaplık, kutu oyunları, ekran, hakkımda; 2026-11-03): ürün seçici, fiyat, düğme ve "Tüm ürünler"
    // yok; kartın ek içeriğini core/cati-panel.js koyar (oda/index.html)
    const portfolyo = !cur && PORTFOLYO_DURAK.includes(zone);
    els.tum.hidden = portfolyo;
    if (portfolyo) {
      els.tpl.hidden = els.urun.hidden = els.sayfa.hidden = true;
      const soon = card.querySelector('.sc-soon');
      if (soon) soon.hidden = true;
      els.hint.textContent = zone === 'ekran' && !coarse() ? t('oda.ekranHint') : '';
      els.hint.hidden = !els.hint.textContent;
      return;
    }
    refresh(cur);
    // İpucu: ürünü çok olan yuvada nasıl değiştirileceği; dokunmatikte etrafa bakma kapalı (kaydırma ürün değiştirir)
    if (cur?.count > 1) els.hint.textContent = t(coarse() ? 'oda.tplHintTouch' : 'oda.tplHint');
    else if (coarse()) els.hint.textContent = '';
    const donIpucu = t('oda.donHint'), ipucu = els.hint.textContent.replace(donIpucu, '').trim(); // önceki yuvadan kalmasın
    els.hint.textContent = story.api.donebilir?.(zone) ? [ipucu, donIpucu].filter(Boolean).join(' ') : ipucu;
    els.hint.hidden = !els.hint.textContent;
  }

  async function step(d) {
    if (!zone || stepping || story.busy) return;
    const cur = story.api.current(zone);
    if (!cur || cur.count < 2) return;
    stepping = true;
    try { await story.api.show(zone, cur.index + d, { reduced: reduce }); } finally { stepping = false; }
  }

  // Değişim nereden gelirse gelsin (seçici, ok, kaydırma, ürüne tıklama, turun kendiliğinden döngüsü) kart güncellenir
  function changed(z, info) {
    if (z === zone) refresh(info);
  }

  return {
    onCard,
    // Denetleyici kurulunca: sahnenin değişim haberi, klavye okları, dokunmatik kaydırma, sürükleyerek çevirme. Dönen
    // işlev hepsini söker (sahne yeniden kurulursa ya da sayfa paneli bırakırsa).
    attach(s) {
      story = s;
      story.api.onChange = changed;
      const ac = new AbortController(), on = { signal: ac.signal };
      addEventListener('keydown', (e) => {
        if (!zone || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        step(e.key === 'ArrowRight' ? 1 : -1); // basılı tutmak tekrar etmez: her basış bir ürün
      }, on);
      const area = root.querySelector('.story-canvas');
      let sw = null, don = null;
      // Ürünün üstünden başlayan sürükleme ürünü çevirir (fare ve parmak); başka yerden başlayan yatay kaydırma
      // (dokunmatik) ürün değiştirir. Sürüklemeden bırakılan tıklama motorda kalır (sıradaki ürün).
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
        els?.tpl.remove();
        els?.urun.remove();
        els?.tum.remove();
        els?.sayfa.remove();
        els = null;
        story = null;
      };
    },
  };
}
