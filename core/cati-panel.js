// Çatı katı (portfolyo) kart içeriği ve ışık kutusu. Motorun yakın plan kartına (core/story.js onCard) bölgeye göre
// ek içerik koyar: eserlerin fotoğrafları ve ölçüleri, galeri baskıları, süreç adımları (kayıt ışık kutusunda oynar),
// hakkımda yazısı. Ayrıca bütün içeriği düz liste olarak veren erişilebilir bir katman (sahnesiz okunur).
// Görseller ve kayıtlar yalnız kart açılınca iner (loading="lazy" ve ışık kutusunda istenince).
import { ESERLER, GALERI, SUREC, HAKKIMDA, SAYFA, CATI_STORY } from './cati-veri.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function catiPanel(root, { lang = 'tr' } = {}) {
  const L = (o) => (o ? o[lang] ?? o.tr ?? '' : '');
  let ek = null;

  // ---- ışık kutusu ----
  const kutu = document.createElement('div');
  kutu.className = 'cati-kutu';
  kutu.hidden = true;
  kutu.setAttribute('role', 'dialog');
  kutu.setAttribute('aria-modal', 'true');
  kutu.innerHTML = `<figure><img alt=""><figcaption><b></b><span></span></figcaption></figure>
    <button type="button" class="cati-kapat">${esc(L(SAYFA.listeKapat))}</button>`;
  document.body.appendChild(kutu);
  const kImg = kutu.querySelector('img'), kB = kutu.querySelector('figcaption b'), kS = kutu.querySelector('figcaption span');
  const kapatBtn = kutu.querySelector('.cati-kapat');
  let onceOdak = null;
  function kutuAc(src, baslik, yazi) {
    onceOdak = document.activeElement;
    kImg.src = src;
    kImg.alt = baslik;
    kB.textContent = baslik;
    kS.textContent = yazi || '';
    kutu.hidden = false;
    kapatBtn.focus();
  }
  function kutuKapat() {
    kutu.hidden = true;
    kImg.removeAttribute('src'); // kayıt oynamayı bıraksın
    onceOdak?.focus?.();
  }
  kapatBtn.addEventListener('click', kutuKapat);
  kutu.addEventListener('click', (e) => { if (e.target === kutu) kutuKapat(); });
  // Escape önce ışık kutusunu kapatır (motor Escape'te yakın plandan çıkar: o dinleyiciye gitmesin)
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !kutu.hidden) { e.stopImmediatePropagation(); kutuKapat(); } }, true);

  // ---- kart ekleri ----
  // Küçük resim düğmesi: tıklanınca src ışık kutusunda açılır; önizleme ayrıysa (süreç kaydının ilk karesi) o görünür
  const kucuk = (src, baslik, alt, yazi, sinif = '', onizleme = src) => `<button type="button" class="cati-k ${sinif}" data-src="${esc(src)}" data-baslik="${esc(baslik)}" data-yazi="${esc(yazi)}">
      <img src="${esc(onizleme)}" alt="" loading="lazy" decoding="async"><span>${esc(alt)}</span></button>`;
  function icerik(id) {
    if (id === 'eserler') {
      return `<div class="cati-izgara">${ESERLER.map((e) => e.gorsel
        ? kucuk(e.gorsel, L(e.ad), L(e.ad), [L(e.desc), L(e.olcu)].filter(Boolean).join(' · '))
        : `<div class="cati-k yok"><span>${esc(L(e.ad))}</span><small>${esc(L(e.desc))}</small></div>`).join('')}</div>`;
    }
    if (id === 'galeri') return `<div class="cati-izgara">${GALERI.map((g) => kucuk(g.gorsel, L(g.baslik), L(g.baslik), L(g.desc))).join('')}</div>`;
    if (id === 'surec') {
      return `<ol class="cati-adimlar">${SUREC.map((s, i) => {
        const ad = `${String(i + 1).padStart(2, '0')} ${L(s.ad)}`;
        return `<li>${kucuk(s.kayit, ad, ad, L(s.desc), 'kayit', s.poster)}</li>`;
      }).join('')}</ol>`;
    }
    if (id === 'hakkimda') return `<div class="cati-yazi">${HAKKIMDA[lang === 'en' ? 'en' : 'tr'].map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
    return '';
  }
  function onCard(h, card) {
    ek?.remove();
    ek = null;
    if (!h) return;
    // Portfolyoda 'atölyede hazırlanıyor' notu yok; düğme yalnız mağazadaki eserlerde (Mağazada gör)
    const soon = card.querySelector('.sc-soon');
    if (soon) soon.hidden = true;
    const html = icerik(h.id);
    if (!html) return;
    ek = document.createElement('div');
    ek.className = 'cati-ek';
    ek.innerHTML = html;
    card.querySelector('.sc-actions')?.before(ek);
    ek.addEventListener('click', (e) => {
      const b = e.target.closest('.cati-k[data-src]');
      if (b) kutuAc(b.dataset.src, b.dataset.baslik, b.dataset.yazi);
    });
  }

  // ---- düz liste (sahnesiz okuma, ekran okuyucu, arama motoru) ----
  const liste = document.createElement('section');
  liste.className = 'cati-liste';
  liste.hidden = true;
  liste.setAttribute('aria-labelledby', 'cati-liste-baslik');
  const bolum = (id, govde) => `<section><h3>${esc(L(CATI_STORY.hotspots[id]))}</h3><p>${esc(L(CATI_STORY.hotspots[id].desc))}</p>${govde}</section>`;
  liste.innerHTML = `<div class="cati-liste-ic">
    <h2 id="cati-liste-baslik">${esc(L(SAYFA.listeBaslik))}</h2>
    ${bolum('hakkimda', `<div class="cati-yazi">${HAKKIMDA[lang === 'en' ? 'en' : 'tr'].map((p) => `<p>${esc(p)}</p>`).join('')}</div>`)}
    ${bolum('eserler', `<ul>${ESERLER.map((e) => `<li><b>${esc(L(e.ad))}</b>: ${esc(L(e.desc))}${e.olcu ? ` <small>${esc(L(e.olcu))}</small>` : ''}</li>`).join('')}</ul>`)}
    ${bolum('galeri', `<ul>${GALERI.map((g) => `<li><b>${esc(L(g.baslik))}</b>: ${esc(L(g.desc))}</li>`).join('')}</ul>`)}
    ${bolum('surec', `<ol>${SUREC.map((s) => `<li><b>${esc(L(s.ad))}</b>: ${esc(L(s.desc))}</li>`).join('')}</ol>`)}
    ${bolum('biggie', '')}
    <button type="button" class="cati-kapat">${esc(L(SAYFA.listeKapat))}</button></div>`;
  document.body.appendChild(liste);
  const listeAc = () => { liste.hidden = false; liste.querySelector('h2').setAttribute('tabindex', '-1'); liste.querySelector('h2').focus(); };
  liste.querySelector('.cati-kapat').addEventListener('click', () => { liste.hidden = true; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !liste.hidden) { e.stopImmediatePropagation(); liste.hidden = true; } }, true);

  return { onCard, listeAc };
}
