// Sahnesiz 2B sayfaların ortak metni ve küçük yardımcıları: giriş (index.html), Oluştur (araclar/), Hazır ürünler
// (urunler/) ve bütün 2B sayfalarda aynı üst çubuk (Hizmetler · Ürünler · Portfolyo; 2026-11-04 kullanıcı kararı, Hizmetler = araclar/, Portfolyo = oda/) (araç sayfalarına templates/tool.html üzerinden girer). Portfolyo 2026-11-03'ten beri odada: bağlantısı oda/?odak=kitaplik (/portfolyo/ yönlendirir).
// core/i18n.js'e yazılmaz; metinler addStrings ile eklenir. Üslup: kısa, sen hitabı, ünlem yok; araçlar "Oluştur" diye
// anılır ("kendin tasarla" denmez). Araç adı, hikâye cümlesi ve "hazır" durumu core/story-data.js'ten (STORIES) gelir.
import { addStrings, applyI18n, getLang, setLang, onLang, t } from './i18n.js';
import { ORDER } from './order-config.js';
import { guvenliAdres } from './guvenli-adres.js';

addStrings({
  tr: {
    'nav.olustur': 'Hizmetler',
    'nav.urunler': 'Ürünler',
    'nav.portfolyo': 'Portfolyo',
    // Giriş: üst bant orta kata (oda/) açılır; altında iki yol
    'giris.title': 'Oktos Workshop · tasarım ve 3B baskı atölyesi',
    'giris.meta': 'Oktos bir tasarım ve 3B baskı atölyesi. Odayı gez, hazır ürünlerden seç ya da organizer, vazo, QR ve daha fazlasını ölçünle oluştur.',
    'giris.h1': 'Atölyenin orta katı.',
    'giris.lede': 'Tasarlayıp bastığımız parçalar bu odada, yerli yerinde. Dolaş, beğendiğine yakından bak.',
    'giris.gir': 'Odaya gir',
    'giris.gir.not': '3B oda, girince yüklenir.',
    'giris.foto': 'Atölyenin odası: masa, monitör, raflar ve balkona açılan kapı.',
    'giris.yollar': 'Hazırını seç ya da ölçünle oluştur.',
    'giris.intro': 'Oktos bir tasarım ve 3B baskı atölyesi: parçayı tasarlar, basar, kapına gönderir.',
    'giris.olustur': 'Oluştur',
    'giris.baslik': 'Oktos Workshop: tasarım ve 3B baskı atölyesi',
    'giris.olustur.d': 'Ölçünü gir, atölye bassın.',
    'giris.olustur.n': '{n} araç',
    'giris.urun': 'Hazır ürünler',
    'giris.urun.d': 'Atölyenin tasarlayıp bastığı parçalardan seç.',
    'giris.urun.n': '{n} ürün',
    // Oluştur (araç listesi; bugüne dek ana sayfadaydı)
    'araclar.title': 'Oluştur',
    'araclar.h1': 'Ölçünü gir, atölye bassın.',
    'araclar.intro': 'Organizer, vazo, kalemlik, clicker. Bir şablon seç, ölçünü gir, önizle; baskıyı Oktos yapar. Kurulum yok, üyelik yok.',
    'araclar.aria': 'Araçlar',
    'araclar.adimlar': 'Sipariş yolu',
    'araclar.sablonlar': '{ad} şablonları',
    'araclar.sablon': '{sablon} şablonuyla aç',
    'araclar.adim1': 'Aracı aç, bir şablon seç',
    'araclar.adim1.d': 'Her araç hazır şablonlarla açılır.',
    'araclar.adim2': 'Ölçüne göre ayarla',
    'araclar.adim2.d': 'Değişiklik önizlemede hemen görünür.',
    'araclar.adim3': 'Hazır de, sipariş ver',
    'araclar.adim3.d': 'Fiyatı gör, WhatsApp\'tan gönder; atölye basıp yollar.',
    'arac.bin.d': 'Bölmeli tepsi, kalemlik, Gridfinity kutu ve taban plakası.',
    'arac.vase.d': 'Köşe sayısı, siluet, burgu ve dokuyla vazo ve saksı.',
    'arac.clicker.d': 'Her modelin içine mavi anahtarlı tıklama mekanizması.',
    'arac.text.d': 'İsimlik, tabela, anahtarlık; yazı tipi ve kaide seçimi.',
    'arac.flip.d': 'Bir yandan bir kelime, öbür yandan başka bir kelime.',
    'arac.qr.d': 'Link, Wi-Fi ya da telefon için iki renkli QR karo.',
    'arac.painter.d': 'Fotoğrafı renk katmanlı kabartmaya çevir.',
    'arac.puzzle.d': 'Herhangi bir modeli yapboz parçalarına böl.',
    // Hazır ürünler
    'urunler.title': 'Hazır ürünler',
    'urunler.intro': 'Atölyede tasarlanıp basılan parçalar. Satıştakiler mağazada; stokta olmayanı WhatsApp\'tan sipariş et, atölye hazırlasın.',
    'urunler.gruplar': 'Ürün grupları',
    'urunler.tum': 'Tümü',
    'urunler.sayi': '{n} ürün',
    'urunler.sayi1': '{n} ürün',
    'urunler.not': 'Fiyat ve stok mağazadan, {tarih} itibarıyla. Güncelini mağaza sayfasında görürsün.',
    'urunler.bos': 'Şu an listede ürün yok.',
    'durum.satista': 'Satışta',
    'durum.stok-yok': 'Stokta yok',
    'durum.sayfa-yok': 'Siparişle',
    'urun.al': 'Satın al',
    'urun.siparis': 'Sipariş ver',
    'urun.oda': 'Odada gör',
    'urun.alAria': '{ad}: mağazada satın al (yeni sekme)',
    'urun.siparisAria': '{ad}: WhatsApp\'tan sipariş ver (yeni sekme)',
    'urun.odaAria': '{ad}: odada gör',
    'urun.mesaj': 'Merhaba Oktos, bu ürünü sipariş etmek istiyorum.',
    'urun.mesajAd': 'Ürün: {ad}',
    'urun.mesajSayfa': 'Mağaza sayfası: {url}',
    // Tek ürün sayfası (urunler/urun.html?id=<id>)
    'urun.title': 'Ürün',
    'urun.iz': 'Konum',
    'urun.bulunamadi': 'Ürün bulunamadı',
    'urun.bulunamadi.d': 'Adres eksik ya da bu ürün artık listede değil.',
    'urun.yuklenemedi': 'Ürün bilgisi yüklenemedi. Sayfayı yenile.',
    'urun.listeyeDon': 'Tüm ürünlere dön',
    'urun.galeri': '{ad}: görseller',
    'urun.onceki': 'Önceki görsel',
    'urun.sonraki': 'Sonraki görsel',
    'urun.gorselSec': 'Görsel {i}: {etiket}',
    'urun.gorsel': '{ad}, görsel {i}',
    // Diorama görsel sırası: 1 kapak, 2 tam karşıdan, 3 üç çeyrek, 4 detay, 5 raf yüksekliğinden, 6 ölçü
    'urun.gorsel.1': '{ad}, kapak',
    'urun.gorsel.2': '{ad}, tam karşıdan',
    'urun.gorsel.3': '{ad}, üç çeyrek açıdan',
    'urun.gorsel.4': '{ad}, yakın detay',
    'urun.gorsel.5': '{ad}, raf yüksekliğinden',
    'urun.gorsel.6': '{ad}, ölçüleriyle',
    'urun.gorunum.1': 'Kapak',
    'urun.gorunum.2': 'Tam karşıdan',
    'urun.gorunum.3': 'Üç çeyrek',
    'urun.gorunum.4': 'Detay',
    'urun.gorunum.5': 'Raf yüksekliğinden',
    'urun.gorunum.6': 'Ölçü',
    'urun.ozel': 'Siparişe özel üretilir.',
    'urun.ozellik': 'Özellikler',
    'urun.olcu': 'Ölçü (G × D × Y)',
    'urun.olcuDeger': '{g} × {d} × {y} cm',
    'urun.parca': 'Parça',
    'urun.parcaDeger': '{n} parça',
    'urun.malzeme': 'Malzeme',
    'urun.kutu': 'Kutuda',
    'urun.hakkinda': 'Hakkında',
    'urun.video': 'Yakından bak',
    'urun.videoAria': '{ad}: kısa video, sessiz',
    'urun.meta': '{ad}. Oktos atölyesinde tasarlanıp basılır. {durum}.',
  },
  en: {
    'nav.olustur': 'Services',
    'nav.urunler': 'Products',
    'nav.portfolyo': 'Portfolio',
    'giris.title': 'Oktos Workshop · design and 3D-print workshop',
    'giris.meta': 'Oktos is a design and 3D-print workshop. Tour the room, pick a ready-made piece, or create organizers, vases, QR tiles and more to your size.',
    'giris.h1': 'The workshop\'s middle floor.',
    'giris.lede': 'The pieces we design and print, each in its place in this room. Look around and get close to what you like.',
    'giris.gir': 'Enter the room',
    'giris.gir.not': 'The 3D room loads when you enter.',
    'giris.foto': 'The workshop\'s room: desk, monitor, shelves and the door to the balcony.',
    'giris.yollar': 'Pick a ready-made piece, or create one to your size.',
    'giris.intro': 'Oktos is a design and 3D-print workshop: it designs the piece, prints it and ships it to your door.',
    'giris.olustur': 'Create',
    'giris.baslik': 'Oktos Workshop: a design and 3D-print workshop',
    'giris.olustur.d': 'Enter your size; the workshop prints it.',
    'giris.olustur.n': '{n} tools',
    'giris.urun': 'Ready-made products',
    'giris.urun.d': 'Choose from pieces the workshop designed and printed.',
    'giris.urun.n': '{n} products',
    'araclar.title': 'Create',
    'araclar.h1': 'Enter your size. The workshop prints it.',
    'araclar.intro': 'Organizers, vases, pen cups, clickers. Pick a preset, enter your size, preview it; Oktos prints it. No install, no sign-up.',
    'araclar.aria': 'Tools',
    'araclar.adimlar': 'How ordering works',
    'araclar.sablonlar': '{ad} templates',
    'araclar.sablon': 'Open with the {sablon} template',
    'araclar.adim1': 'Open a tool, pick a template',
    'araclar.adim1.d': 'Every tool opens with ready templates.',
    'araclar.adim2': 'Fit it to your size',
    'araclar.adim2.d': 'Changes show in the preview right away.',
    'araclar.adim3': 'Tap Ready, then order',
    'araclar.adim3.d': 'See the price, send it on WhatsApp; the workshop prints and ships.',
    'arac.bin.d': 'Split trays, pen cups, Gridfinity bins and baseplates.',
    'arac.vase.d': 'Vases and planters by side count, silhouette, twist and texture.',
    'arac.clicker.d': 'A blue-switch click mechanism inside any model.',
    'arac.text.d': 'Name plates, signs and keychains with font and base options.',
    'arac.flip.d': 'One word from one side, another from the other.',
    'arac.qr.d': 'Two-colour QR tiles for links, Wi-Fi or phone numbers.',
    'arac.painter.d': 'Turn a photo into a colour-layered relief.',
    'arac.puzzle.d': 'Cut any model into jigsaw pieces.',
    'urunler.title': 'Ready-made products',
    'urunler.intro': 'Pieces designed and printed in the workshop. In-stock ones are in the shop; order the rest on WhatsApp and the workshop makes it for you.',
    'urunler.gruplar': 'Product groups',
    'urunler.tum': 'All',
    'urunler.sayi': '{n} products',
    'urunler.sayi1': '{n} product',
    'urunler.not': 'Prices and stock from the shop as of {tarih}. The shop page has the latest.',
    'urunler.bos': 'No products listed right now.',
    'durum.satista': 'In stock',
    'durum.stok-yok': 'Out of stock',
    'durum.sayfa-yok': 'Made to order',
    'urun.al': 'Buy',
    'urun.siparis': 'Order',
    'urun.oda': 'See in the room',
    'urun.alAria': '{ad}: buy in the shop (new tab)',
    'urun.siparisAria': '{ad}: order on WhatsApp (new tab)',
    'urun.odaAria': '{ad}: see in the room',
    'urun.mesaj': 'Hello Oktos, I would like to order this product.',
    'urun.mesajAd': 'Product: {ad}',
    'urun.mesajSayfa': 'Shop page: {url}',
    'urun.title': 'Product',
    'urun.iz': 'Breadcrumb',
    'urun.bulunamadi': 'Product not found',
    'urun.bulunamadi.d': 'The address is incomplete, or this product is no longer listed.',
    'urun.yuklenemedi': 'Product details could not load. Reload the page.',
    'urun.listeyeDon': 'Back to all products',
    'urun.galeri': '{ad}: images',
    'urun.onceki': 'Previous image',
    'urun.sonraki': 'Next image',
    'urun.gorselSec': 'Image {i}: {etiket}',
    'urun.gorsel': '{ad}, image {i}',
    'urun.gorsel.1': '{ad}, cover',
    'urun.gorsel.2': '{ad}, straight on',
    'urun.gorsel.3': '{ad}, three-quarter view',
    'urun.gorsel.4': '{ad}, close-up detail',
    'urun.gorsel.5': '{ad}, at shelf height',
    'urun.gorsel.6': '{ad}, with dimensions',
    'urun.gorunum.1': 'Cover',
    'urun.gorunum.2': 'Straight on',
    'urun.gorunum.3': 'Three-quarter',
    'urun.gorunum.4': 'Detail',
    'urun.gorunum.5': 'At shelf height',
    'urun.gorunum.6': 'Dimensions',
    'urun.ozel': 'Printed for you when you order.',
    'urun.ozellik': 'Details',
    'urun.olcu': 'Size (W × D × H)',
    'urun.olcuDeger': '{g} × {d} × {y} cm',
    'urun.parca': 'Parts',
    'urun.parcaDeger': '{n} parts',
    'urun.malzeme': 'Material',
    'urun.kutu': 'In the box',
    'urun.hakkinda': 'About',
    'urun.video': 'A closer look',
    'urun.videoAria': '{ad}: short video, no sound',
    'urun.meta': '{ad}. Designed and printed in the Oktos workshop. {durum}.',
  },
});

// Ürünün ana eylemi: Hazır ürünler listesi (urunler/) ve tek ürün sayfası (urunler/urun.html) ortak kullanır.
// Satışta ve mağaza sayfası varsa mağaza ("Satın al", yeni sekme); değilse WhatsApp hazır mesajı ("Sipariş ver"; araç
// sayfalarıyla aynı hat: core/order-config.js; WhatsApp yoksa e-posta, ikisi de yoksa href null → düğme kapalı).
export function siparisAdresi(u, ad) {
  const satir = [t('urun.mesaj'), t('urun.mesajAd', { ad })];
  if (u.magaza) satir.push(t('urun.mesajSayfa', { url: u.magaza }));
  const msg = satir.join('\n');
  if (ORDER.whatsapp) return `https://wa.me/${ORDER.whatsapp}?text=${encodeURIComponent(msg)}`;
  if (ORDER.email) return `mailto:${ORDER.email}?subject=${encodeURIComponent(t('order.subject'))}&body=${encodeURIComponent(msg)}`;
  return null;
}

// Mağaza adresi yalnız https + oktosworkshop.com ise kullanılır (core/guvenli-adres.js; oda da aynısını kullanır)
export { guvenliAdres };

export function urunEylemi(u, ad) {
  u = { ...u, magaza: guvenliAdres(u.magaza) };
  const satista = u.durum === 'satista' && !!u.magaza;
  return {
    satista,
    href: satista ? u.magaza : siparisAdresi(u, ad),
    etiket: t(satista ? 'urun.al' : 'urun.siparis'),
    aria: t(satista ? 'urun.alAria' : 'urun.siparisAria', { ad }),
  };
}

// Eylem düğmesi HTML'i (adres yoksa kapalı görünen düğme; başlığında neden yazar)
export function eylemDugmesi(u, ad, sinif = 'btn primary') {
  const e = urunEylemi(u, ad);
  return e.href
    ? `<a class="${sinif}" data-eylem="al" href="${kacis(e.href)}" target="_blank" rel="noopener" aria-label="${kacis(e.aria)}">${e.etiket}</a>`
    : `<span class="${sinif} is-off" data-eylem="al" title="${kacis(t('order.notSet'))}">${e.etiket}</span>`;
}

// "Odada gör" adresi; yuva odada gizliyse (YUVALAR'da oda: false) ya da yuva bilinmiyorsa null (bağlantı gösterilmez).
// kok: sayfanın site köküne göre yolu ('../' urunler/ altından). Oda 2026-11-02'den beri oda/ (lab/oda.html yönlendirme).
export function odaAdresi(u, yuvalar, kok = '../') {
  const y = yuvalar.find((x) => x.id === u.yuva);
  return y && y.oda !== false ? `${kok}oda/?odak=${encodeURIComponent(u.yuva)}` : null;
}

// Araç simgeleri (32 × 32, çizgi; bugüne dek index.html içindeydi)
export const ARAC_SIMGE = {
  bin: '<path d="M4 9h24v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 9v17M20 9v17M4 17h24"/>',
  vase: '<path d="M12 4h8M13 4c0 4-6 6-6 13 0 5 4 10 9 10s9-5 9-10c0-7-6-9-6-13"/>',
  clicker: '<rect x="6" y="14" width="20" height="12" rx="2"/><rect x="11" y="7" width="10" height="7" rx="1.5"/><path d="M16 4v3"/>',
  text: '<path d="M6 8V6h20v2M16 6v20M12 26h8"/>',
  flip: '<path d="M6 8h9v16H6zM17 8h9v16h-9z"/><path d="M15 16h2"/>',
  qr: '<rect x="5" y="5" width="9" height="9" rx="1"/><rect x="18" y="5" width="9" height="9" rx="1"/><rect x="5" y="18" width="9" height="9" rx="1"/><path d="M18 18h3v3M24 18h3M18 24v3h3M24 24h3v3"/>',
  painter: '<rect x="4" y="6" width="24" height="20" rx="2"/><path d="m4 21 7-7 5 5 4-4 8 8"/><circle cx="21" cy="11" r="2"/>',
  puzzle: '<path d="M6 6h8v3a2 2 0 1 0 4 0V6h8v8h-3a2 2 0 1 0 0 4h3v8h-8v-3a2 2 0 1 0-4 0v3H6v-8h3a2 2 0 1 0 0-4H6z"/>',
};

// Ürün yuvası simgeleri: görseli olmayan ürünün yer tutucusu (aynı çizgi dili)
export const YUVA_SIMGE = {
  sticker: '<path d="M6 6h20v12l-8 8H6z"/><path d="M26 18h-6a2 2 0 0 0-2 2v6"/>',
  anahtarlik: '<circle cx="11" cy="8" r="4.5"/><path d="m13.5 11.5 2 2.5"/><rect x="13" y="14" width="13" height="14" rx="2"/>',
  figur: '<circle cx="16" cy="8" r="4"/><path d="M10 26v-8a6 6 0 0 1 12 0v8"/><path d="M6 26h20"/>',
  raf: '<path d="M4 13h24M4 25h24"/><rect x="7" y="5" width="7" height="8" rx="1"/><rect x="17" y="16" width="9" height="9" rx="1"/>',
  kilic: '<path d="M12 20 26 6"/><path d="m8 17 7 7"/><path d="m5 27 6-6"/>',
  maske: '<path d="M6 9c0-2.5 4-4 10-4s10 1.5 10 4v7c0 6-5 11-10 11S6 22 6 16z"/><ellipse cx="12" cy="14" rx="2.5" ry="2"/><ellipse cx="20" cy="14" rx="2.5" ry="2"/><path d="M13 21h6"/>',
  biblo: '<path d="M11 27V12a5 5 0 0 1 10 0v15z"/><path d="M14 13h.5M17.5 13h.5M14 18h4"/><path d="M7 27h18"/>',
};

export const OK_SIMGE = '<path d="M5 12h14M13 6l6 6-6 6"/>';

export const svg = (yol, vb = 32) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true" focusable="false">${yol}</svg>`;

// Metne girecek değerler (ürün adı vb.) için
export const kacis = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 2B sayfa: dil düğmelerini bağlar; açılışta ve her dil değişiminde ciz(lang) çağırır, sonra data-i18n metinlerini yazar.
export function siteSayfasi(ciz) {
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const tazele = () => {
    const lang = getLang();
    document.documentElement.lang = lang;
    ciz(lang);
    applyI18n();
    document.querySelectorAll('.lang button').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  };
  onLang(tazele);
  tazele();
}
