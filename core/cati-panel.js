// Çatı katı (portfolyo) kart içeriği ve ışık kutusu. Motorun yakın plan kartına (core/story.js onCard) bölgeye göre
// ek içerik koyar: ekranda süreç adımlarının listesi (seçilen adım TV'de oynar; TV'ye tıklamak da sıradaki adıma geçer),
// raflarda işlerin fotoğrafları (ışık kutusunda) ve "Fikrini anlat", hakkımda yazısı. Ayrıca bütün içeriği düz liste
// olarak veren erişilebilir bir katman (sahnesiz okunur).
// Görseller ve kayıtlar yalnız kart açılınca iner (loading="lazy"; kayıt ışık kutusunda istenince). Işık kutusu ve
// liste kipli: arkadaki sahne ve üst çubuk etkisiz (inert), sayfa kaydırması kilitli, kapanınca odak geri döner.
// Hareket azaltmada süreç kayıtları yerine ilk kareleri gösterilir.
import { RAF_ISLERI, SUREC, HAKKIMDA, SAYFA, CATI_STORY, fikirLinki } from './cati-veri.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ekran: () => TV denetçisi (core/cati-ekran.js: git, aktif, onDegis); sahne kurulunca gelir
export function catiPanel(root, { lang = 'tr', reduce = false, ekran = () => null } = {}) {
  const L = (o) => (o ? o[lang] ?? o.tr ?? '' : '');
  let ek = null, sonId = null;
  const ust = () => document.querySelector('.topbar');
  // Kipli katman açıkken arkası etkisiz ve kaydırılamaz (tur ilerlemesin)
  let kipSayisi = 0;
  const kip = (ac) => {
    kipSayisi = Math.max(0, kipSayisi + (ac ? 1 : -1));
    const on = kipSayisi > 0;
    if (ust()) ust().inert = on;
    root.inert = on;
    document.documentElement.style.overflow = on ? 'hidden' : '';
  };
  const odakla = (el) => { if (el?.isConnected && !el.closest('[inert]')) { el.focus({ preventScroll: true }); return true; } return false; };

  // ---- ışık kutusu ----
  const kutu = document.createElement('div');
  kutu.className = 'cati-kutu';
  kutu.hidden = true;
  kutu.setAttribute('role', 'dialog');
  kutu.setAttribute('aria-modal', 'true');
  kutu.setAttribute('aria-labelledby', 'cati-kutu-ad');
  kutu.innerHTML = `<figure><img alt=""><figcaption><b id="cati-kutu-ad"></b><span></span></figcaption></figure>
    <button type="button" class="cati-kapat">${esc(L(SAYFA.listeKapat))}</button>`;
  document.body.appendChild(kutu);
  const kImg = kutu.querySelector('img'), kB = kutu.querySelector('figcaption b'), kS = kutu.querySelector('figcaption span');
  const kapatBtn = kutu.querySelector('.cati-kapat');
  let onceOdak = null;
  function kutuAc(src, baslik, yazi) {
    onceOdak = document.activeElement;
    kImg.src = src;
    kB.textContent = baslik;
    kS.textContent = yazi || '';
    kutu.hidden = false;
    kip(true);
    kapatBtn.focus();
  }
  function kutuKapat() {
    if (kutu.hidden) return;
    kutu.hidden = true;
    kImg.removeAttribute('src'); // kayıt oynamayı bıraksın
    kip(false);
    odakla(onceOdak) || odakla(root.querySelector('.story-card:not([hidden]) .cati-k[data-src]')) || odakla(document.getElementById('liste-ac'));
  }
  kapatBtn.addEventListener('click', kutuKapat);
  kutu.addEventListener('click', (e) => { if (e.target === kutu) kutuKapat(); });
  // Odak kutuda kalır (tek odaklanabilir öğe: Kapat)
  kutu.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); kapatBtn.focus(); } });
  // Escape önce ışık kutusunu kapatır (motor Escape'te yakın plandan çıkar: o dinleyiciye gitmesin)
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !kutu.hidden) { e.stopImmediatePropagation(); kutuKapat(); } }, true);

  // ---- kart ekleri ----
  // Küçük resim düğmesi: tıklanınca src ışık kutusunda açılır; önizleme ayrıysa (süreç kaydının ilk karesi) o görünür
  const kucuk = (src, baslik, alt, yazi, sinif = '', onizleme = src) => `<button type="button" class="cati-k ${sinif}" data-src="${esc(src)}" data-baslik="${esc(baslik)}" data-yazi="${esc(yazi)}">
      <img src="${esc(onizleme)}" alt="" loading="lazy" decoding="async"><span>${esc(alt)}</span></button>`;
  function icerik(id) {
    if (id === 'kitaplik') {
      const link = fikirLinki(lang);
      return `<p class="cati-ara">${esc(L(SAYFA.isler))}</p><div class="cati-izgara">${RAF_ISLERI.map((g) => kucuk(g.gorsel, L(g.baslik), L(g.baslik), L(g.desc))).join('')}</div>`
        + (link ? `<a class="cati-in cati-fikir" href="${esc(link)}" target="_blank" rel="noopener">${esc(L(SAYFA.fikrini))}</a>` : '');
    }
    if (id === 'ekran') {
      const a = ekran()?.aktif ?? 0;
      return `<p class="cati-ara">${esc(L(SAYFA.adimlar))}</p><ol class="cati-adim-liste">${SUREC.map((s, i) => `<li><button type="button" data-adim="${i}"${i === a ? ' aria-current="step"' : ''}>
        <span>${String(i + 1).padStart(2, '0')}</span>${esc(L(s.ad))}</button></li>`).join('')}</ol>`;
    }
    if (id === 'hakkimda') return `<div class="cati-yazi">${HAKKIMDA[lang === 'en' ? 'en' : 'tr'].map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
    return '';
  }
  function onCard(h, card) {
    const kartta = card.contains(document.activeElement);
    ek?.remove();
    ek = null;
    if (!h) {
      kutuKapat(); // kart kapanırken ışık kutusu açık kalmasın
      // Odak kartın içindeydiyse boşa düşmesin: o bölgenin şerit çipine, yoksa liste düğmesine
      if (kartta && sonId) {
        const ad = L(CATI_STORY.hotspots[sonId]);
        const cip = [...root.querySelectorAll('.story-strip .chip')].find((c) => c.offsetParent && c.querySelector('.chip-name')?.textContent === ad);
        odakla(cip) || odakla(document.getElementById('liste-ac'));
      }
      sonId = null;
      return;
    }
    sonId = h.id;
    ekranaBagla();
    // Portfolyoda 'atölyede hazırlanıyor' notu yok
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
      const adim = e.target.closest('button[data-adim]');
      if (adim) ekran()?.git(Number(adim.dataset.adim));
    });
  }
  // TV adımı değişince (tıklama, kart) listedeki etkin adım güncellenir
  let bagli = false;
  function ekranaBagla() {
    const e = ekran();
    if (!e || bagli) return;
    bagli = true;
    e.onDegis((i) => ek?.querySelectorAll('button[data-adim]').forEach((b) => {
      if (Number(b.dataset.adim) === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    }));
  }

  // ---- düz liste (sahnesiz okuma, ekran okuyucu, arama motoru) ----
  const liste = document.createElement('section');
  liste.className = 'cati-liste';
  liste.hidden = true;
  liste.setAttribute('role', 'dialog');
  liste.setAttribute('aria-modal', 'true');
  liste.setAttribute('aria-labelledby', 'cati-liste-baslik');
  const bolum = (id, govde) => `<section><h3>${esc(L(CATI_STORY.hotspots[id]))}</h3><p>${esc(L(CATI_STORY.hotspots[id].desc))}</p>${govde}</section>`;
  liste.innerHTML = `<div class="cati-liste-ic">
    <h2 id="cati-liste-baslik" tabindex="-1">${esc(L(SAYFA.listeBaslik))}</h2>
    ${bolum('hakkimda', `<div class="cati-yazi">${HAKKIMDA[lang === 'en' ? 'en' : 'tr'].map((p) => `<p>${esc(p)}</p>`).join('')}</div>`)}
    ${bolum('ekran', `<ol>${SUREC.map((s) => `<li><b>${esc(L(s.ad))}</b>: ${esc(L(s.desc))}</li>`).join('')}</ol>`)}
    ${bolum('kitaplik', `<ul>${RAF_ISLERI.map((g) => `<li><b>${esc(L(g.baslik))}</b>: ${esc(L(g.desc))}</li>`).join('')}</ul>`)}
    ${bolum('biggie', '')}
    <button type="button" class="cati-kapat">${esc(L(SAYFA.listeKapat))}</button></div>`;
  document.body.appendChild(liste);
  const listeKapatBtn = liste.querySelector('.cati-kapat');
  const listeAc = () => {
    if (!liste.hidden) return;
    liste.hidden = false;
    kip(true);
    liste.querySelector('h2').focus();
  };
  const listeKapat = () => {
    if (liste.hidden) return;
    liste.hidden = true;
    kip(false);
    odakla(document.getElementById('liste-ac'));
  };
  listeKapatBtn.addEventListener('click', listeKapat);
  // Sekme listenin içinde döner (başlık → Kapat)
  liste.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const ilk = liste.querySelector('h2');
    if (!e.shiftKey && document.activeElement === listeKapatBtn) { e.preventDefault(); ilk.focus(); }
    if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); listeKapatBtn.focus(); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !liste.hidden) { e.stopImmediatePropagation(); listeKapat(); } }, true);

  return { onCard, listeAc };
}
