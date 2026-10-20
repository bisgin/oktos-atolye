// Araç sayfası düzenleyicisi: sayfa doğrudan atölyeyle (şablon ve düzenleme ekranı) açılır. Araçlara giriş oda
// sahneleridir (lab/oda.html: ürüne tıklanınca "Bu şablonla tasarla" araca ?sablon= ile gelir); araçların kendi
// hikâye sahneleri 2026-10-20'de kalktı (kullanıcı kararı; kod _silinecek/arac-sahneleri-2026-10-20/ altında).
import { getLang, setLang, onLang } from './i18n.js';

function wireLang() {
  if (!document.body.dataset.langWired) {
    document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    document.body.dataset.langWired = '1';
  }
  syncLang();
}
function syncLang() {
  document.querySelectorAll('.lang button').forEach((b) => {
    const on = b.dataset.lang === getLang();
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

export async function bootTool({ tool }) {
  wireLang();
  onLang(syncLang);
  const { createTool } = await import('./tool-shell.js');
  const ws = createTool(tool, {});
  window.oktosPage = { workshop: () => ws }; // konsoldan hata ayıklama / akış testi için
  (await ws).reveal();
}
