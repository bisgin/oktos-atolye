// Kutu oyunu paneli (2026-11-04 v7): rafta seçilen kutunun dört yüzü dört sayfa (core/kutu-oyunlari.js). Yatay ekranda
// yakın plan kartının yerinde (sol kenar, koyu perdenin üstünde), telefonda ve dikey ekranda alttan yaprak (oda.css,
// root.dataset.panel). Kutunun iki yanında ok düğmeleri (DOM, klavyeyle ← →; Esc "Geri"), rafta üzerine gelinen kutunun
// adı ve tek satırı imlecin yanında (ipucu). Davranışı core/oda-sunum.js sürer: ac / sayfa / kapat / oklar / ipucu.
import { KUTU_OYUNLARI, SAYFA_BASLIK, kutuOyunu } from './kutu-oyunlari.js';

const OK = (yon) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${yon < 0 ? 'M15 5 8 12l7 7' : 'm9 5 7 7-7 7'}"/></svg>`;

export function kutuPaneli(root, { t, lang = 'tr', onOnceki, onSonraki, onGeri } = {}) {
  const L = (o) => (o ? o[lang] ?? o.tr ?? '' : '');
  const panel = document.createElement('section');
  panel.className = 'oda-kutu';
  panel.hidden = true;
  panel.setAttribute('aria-label', t('oda.kutu.panel'));
  panel.innerHTML = `<p class="ok-ust"><span class="ok-taslak"></span><span class="ok-sayac" aria-live="polite"></span></p>
    <h2 class="ok-ad"></h2><h3 class="ok-baslik"></h3><p class="ok-metin"></p>
    <figure class="ok-gorsel"><img alt="" hidden><figcaption></figcaption></figure>
    <div class="ok-alt"><button type="button" class="ok-geri"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg><span></span></button><span class="ok-ipucu"></span></div>`;
  const okSol = document.createElement('button'), okSag = document.createElement('button');
  okSol.type = okSag.type = 'button';
  okSol.className = 'oda-kutu-ok sol'; okSag.className = 'oda-kutu-ok sag';
  okSol.innerHTML = OK(-1); okSag.innerHTML = OK(1);
  okSol.setAttribute('aria-label', t('oda.kutu.onceki')); okSag.setAttribute('aria-label', t('oda.kutu.sonraki'));
  okSol.title = t('oda.kutu.onceki'); okSag.title = t('oda.kutu.sonraki');
  okSol.hidden = okSag.hidden = true;
  const ipucu = document.createElement('div');
  ipucu.className = 'oda-kutu-ipucu';
  ipucu.setAttribute('role', 'tooltip');
  ipucu.hidden = true;
  ipucu.innerHTML = '<b></b><span></span><small></small>';
  root.append(panel, okSol, okSag, ipucu);
  const $ = (s) => panel.querySelector(s);
  $('.ok-geri span').textContent = t('oda.kutu.geri');
  $('.ok-ipucu').textContent = t('oda.kutu.ipucu');
  const img = $('.ok-gorsel img'), cap = $('.ok-gorsel figcaption');
  img.addEventListener('error', () => { img.hidden = true; cap.hidden = false; });

  let oyun = null, sayfa = 0, sonOk = [-1e4, -1e4, -1e4];
  function ciz() {
    if (!oyun) return;
    const s = oyun.sayfalar[sayfa], N = oyun.sayfalar.length;
    $('.ok-taslak').textContent = oyun.taslak ? t('oda.kutu.taslak') : '';
    $('.ok-taslak').hidden = !oyun.taslak;
    $('.ok-sayac').textContent = t('oda.kutu.sayfa', { n: sayfa + 1, N });
    $('.ok-ad').textContent = L(oyun.ad);
    $('.ok-baslik').textContent = L(SAYFA_BASLIK[s.tur]);
    $('.ok-metin').textContent = L(s.metin);
    panel.dataset.sayfa = String(sayfa + 1);
    // Görsel: yalnız 2. ve 3. sayfada (katkı, üretim) ya da verilmişse; yoksa yer tutucu
    const gorselVar = s.gorsel || s.tur === 'katki' || s.tur === 'uretim';
    $('.ok-gorsel').hidden = !gorselVar;
    if (gorselVar) {
      cap.textContent = t('oda.kutu.gorselYok');
      if (s.gorsel) { img.hidden = false; cap.hidden = true; img.src = new URL(`../${s.gorsel}`, import.meta.url).href; img.alt = L(s.metin).slice(0, 80); }
      else { img.hidden = true; img.removeAttribute('src'); cap.hidden = false; }
    }
  }
  okSol.addEventListener('click', () => onOnceki?.());
  okSag.addEventListener('click', () => onSonraki?.());
  $('.ok-geri').addEventListener('click', () => onGeri?.());
  addEventListener('keydown', (e) => {
    if (panel.hidden || e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(document.activeElement?.tagName ?? '')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); onSonraki?.(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); onOnceki?.(); }
    else if (e.key === 'Escape') { e.preventDefault(); onGeri?.(); }
  });

  return {
    panel, okSol, okSag, ipucuEl: ipucu,
    get acik() { return !panel.hidden; },
    get oyun() { return oyun; },
    get sayfa() { return sayfa; },
    ac(no, s = 0) {
      oyun = kutuOyunu(no) ?? KUTU_OYUNLARI[0];
      sayfa = s;
      ciz();
      const ilk = panel.hidden;
      panel.hidden = false;
      root.classList.add('kutu-acik');
      if (ilk) panel.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    },
    sayfaYap(s) { if (!oyun) return; const N = oyun.sayfalar.length; sayfa = ((s % N) + N) % N; ciz(); },
    kapat() {
      oyun = null;
      panel.hidden = true;
      okSol.hidden = okSag.hidden = true;
      root.classList.remove('kutu-acik');
    },
    // Okları kutunun ekrandaki kutusunun iki yanına koy (r: { x0, x1, y } istemci px, sahne köküne göre); null gizler
    oklar(r, etkin = true) {
      if (!r || panel.hidden) { okSol.hidden = okSag.hidden = true; return; }
      okSol.hidden = okSag.hidden = false;
      if (okSol.disabled === etkin) okSol.disabled = okSag.disabled = !etkin;
      // Yalnız 1 px'ten büyük değişimde (kamera nefesi okları titretmesin)
      const x0 = Math.round(r.x0), x1 = Math.round(r.x1), y = Math.round(r.y);
      if (Math.abs(x0 - sonOk[0]) + Math.abs(x1 - sonOk[1]) + Math.abs(y - sonOk[2]) < 2) return;
      sonOk = [x0, x1, y];
      okSol.style.transform = `translate(${x0}px, ${y}px) translate(-100%, -50%)`;
      okSag.style.transform = `translate(${x1}px, ${y}px) translate(0, -50%)`;
    },
    // İpucu: kutu no ve imleç (sahne köküne göre px); no null gizler. dokun: dokunmatikte ikinci dokunuş bilgisi
    ipucu(no, x = 0, y = 0, { dokun = false } = {}) {
      if (no === null || no === undefined) { ipucu.hidden = true; ipucu.dataset.no = ''; return; }
      const o = kutuOyunu(no);
      if (!o) { ipucu.hidden = true; return; }
      ipucu.querySelector('b').textContent = L(o.ad);
      ipucu.querySelector('span').textContent = L(o.kisa);
      const sm = ipucu.querySelector('small');
      sm.textContent = dokun ? t('oda.kutu.dokun') : '';
      sm.hidden = !dokun;
      ipucu.dataset.no = String(no);
      ipucu.hidden = false;
      // İmlecin sağ altında; sağ kenara taşarsa soluna
      const w = ipucu.offsetWidth || 220, W = root.clientWidth;
      const px = x + 18 + w > W - 8 ? x - 18 - w : x + 18;
      ipucu.style.transform = `translate(${Math.max(8, px).toFixed(1)}px, ${(y + 16).toFixed(1)}px)`;
    },
    get ipucuNo() { return ipucu.hidden ? null : Number(ipucu.dataset.no); },
  };
}
