// Çatı katı (portfolyo) kart içeriği ve ışık kutusu. Motorun yakın plan kartına (core/story.js onCard) bölgeye göre
// ek içerik koyar: ekranda süreç adımlarının listesi (seçilen adım TV'de oynar; TV'ye tıklamak da sıradaki adıma geçer),
// raflarda işlerin fotoğrafları (ışık kutusunda), 10 dioramanın ürün sayfası ve yazdığım 8 aracın bağlantıları ve "Fikrini anlat", hakkımda yazısı. Ayrıca bütün içeriği düz liste
// olarak veren erişilebilir bir katman (sahnesiz okunur).
// Görseller ve kayıtlar yalnız kart açılınca iner (loading="lazy"; kayıt ışık kutusunda istenince). Işık kutusu ve
// liste kipli: arkadaki sahne ve üst çubuk etkisiz (inert), sayfa kaydırması kilitli, kapanınca odak geri döner.
// Hareket azaltmada süreç kayıtları yerine ilk kareleri gösterilir.
import { RAF_ISLERI, ARACLAR, DIORAMALAR, SUREC, HAKKIMDA, SAYFA, CATI_STORY, fikirLinki } from './cati-veri.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ekran: () => TV denetçisi (core/cati-ekran.js: git, aktif, onDegis); sahne kurulunca gelir
// oda (v8, 2026-11-04; /oda/): oda yalnız portfolyo. Kitaplıkta yalnız raflardan işler (fotoğraf kartın içinde; ışık
// kutusu yok), dioramalar, araçlar ("Hizmetler") ve "Fikrini anlat" yok; armut durağında hakkımda yazısı; Biggie elindeki
// büstü gösterirken (pencere olayı 'oda-bust' { eser }) kitaplığın eki büstün bilgisine döner
export function catiPanel(root, { lang = 'tr', reduce = false, ekran = () => null, oda = false } = {}) {
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
  const baglanti = (a) => `<a class="cati-k cati-arac" href="${esc(a.href)}">
      <img src="${esc(a.gorsel)}" alt="" loading="lazy" decoding="async"><span>${esc(L(a.ad))}</span></a>`;
  // Oda kipi: fotoğraf kartın içinde (düğme değil, büyütülmez)
  const foto = (src, baslik, yazi) => `<figure class="cati-k cati-foto"><img src="${esc(src)}" alt="${esc(baslik)}" loading="lazy" decoding="async"><figcaption><b>${esc(baslik)}</b>${yazi ? ` <span>${esc(yazi)}</span>` : ''}</figcaption></figure>`;
  function bustIcerik(e) {
    return `<div class="cati-bust">${e.gorsel ? `<img src="${esc(e.gorsel)}" alt="${esc(L(e.ad))}" decoding="async">` : ''}
      <h3>${esc(L(e.ad))}</h3><p>${esc(L(e.desc))}</p>${e.olcu ? `<p class="cati-olcu">${esc(L(e.olcu))}</p>` : ''}</div>`;
  }
  function icerik(id) {
    if (oda && id === 'kitaplik') return `<p class="cati-ara">${esc(L(SAYFA.isler))}</p><div class="cati-izgara cati-izgara-foto">${RAF_ISLERI.map((g) => foto(g.gorsel, L(g.baslik), L(g.desc))).join('')}</div>`;
    if (oda && id === 'armut') return `<div class="cati-yazi">${HAKKIMDA[lang === 'en' ? 'en' : 'tr'].map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
    if (id === 'kitaplik') {
      const link = fikirLinki(lang);
      return `<p class="cati-ara">${esc(L(SAYFA.isler))}</p><div class="cati-izgara">${RAF_ISLERI.map((g) => kucuk(g.gorsel, L(g.baslik), L(g.baslik), L(g.desc))).join('')}</div>`
        // Dioramalar ve yazdığım araçlar: ışık kutusu değil, ürünün / aracın kendi sayfası (aynı sekmede)
        + `<p class="cati-ara">${esc(L(SAYFA.dioramalar))}</p><div class="cati-izgara">${DIORAMALAR.map(baglanti).join('')}</div>`
        + `<p class="cati-ara">${esc(L(SAYFA.araclar))}</p><div class="cati-izgara">${ARACLAR.map(baglanti).join('')}</div>`
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
  // v8 oda: Biggie büstü eline alınca kitaplığın eki büstün bilgisi olur; bırakınca raflardan işlere döner
  if (oda) addEventListener('oda-bust', (e) => {
    if (!ek || sonId !== 'kitaplik') return;
    const eser = e.detail?.eser;
    ek.innerHTML = eser ? bustIcerik(eser) : icerik('kitaplik');
    ek.classList.toggle('cati-ek-bust', !!eser);
  });
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
    ${bolum('kitaplik', `<ul>${RAF_ISLERI.map((g) => `<li><b>${esc(L(g.baslik))}</b>: ${esc(L(g.desc))}</li>`).join('')}</ul>
      <h4>${esc(L(SAYFA.dioramalar))}</h4><ul>${DIORAMALAR.map((a) => `<li><a href="${esc(a.href)}"><b>${esc(L(a.ad))}</b></a>: ${esc(L(a.desc))}</li>`).join('')}</ul>
      <h4>${esc(L(SAYFA.araclar))}</h4><ul>${ARACLAR.map((a) => `<li><a href="${esc(a.href)}"><b>${esc(L(a.ad))}</b></a>: ${esc(L(a.desc))}</li>`).join('')}</ul>`)}
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
