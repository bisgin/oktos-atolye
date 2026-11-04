// Mağaza adresi denetimi: yalnız https + mağaza alan adı (oktosworkshop.com, www.oktosworkshop.com) bağlantıya dönüşür.
// Başka alan adı (https://evil.com), javascript:, data:, boş ya da bozuk değer → null; çağıran WhatsApp siparişine düşer.
// Ortak kullanım: core/site-metin.js (2B sayfalar), core/oda-panel.js ve core/oda-sahne.js (oda).
const MAGAZA_ALANLARI = new Set(['oktosworkshop.com', 'www.oktosworkshop.com']);

export function guvenliAdres(s) {
  if (typeof s !== 'string' || !s.trim()) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && MAGAZA_ALANLARI.has(u.hostname) && !u.username && !u.password && !u.port ? u.href : null;
  } catch (_) { return null; }
}
