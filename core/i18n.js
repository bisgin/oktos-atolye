// Arayüz metinleri. TR varsayılan, EN ikinci dil. Araçlar kendi sözlüklerini addStrings ile ekler.
const dict = {
  tr: {
    'app.name': 'Oktos Workshop',
    'app.tagline': 'Tarayıcıda çalışan parametrik 3B baskı atölyesi',
    'nav.tools': 'Araçlar',
    'common.presets': 'Şablonlar',
    'common.export': 'Dışa aktar',
    'common.downloadSTL': 'STL indir',
    'common.download3MF': '3MF indir',
    'common.share': 'Bağlantıyı kopyala',
    'common.copied': 'Bağlantı kopyalandı',
    'common.reset': 'Sıfırla',
    'common.stats': 'Ölçüler',
    'common.notes': 'Notlar',
    'common.loading': 'Geometri motoru yükleniyor…',
    'common.building': 'Hesaplanıyor…',
    'common.error': 'Bu ayarlarla model üretilemedi. Bir değeri değiştirip tekrar dene.',
    'common.size': 'Boyut',
    'common.volume': 'Hacim',
    'common.weight': 'Ağırlık (PLA)',
    'common.triangles': 'Üçgen',
    'common.printer': 'Yazıcı tablası',
    'common.fits': 'Tablaya sığıyor',
    'common.noFit': 'Tablaya sığmıyor',
    'common.edges': 'Kenar çizgileri',
    'common.color': 'Önizleme rengi',
    'common.order': 'Sipariş ver',
    'common.orderWa': 'WhatsApp\'tan sipariş ver',
    'common.estPrice': 'Tahmini fiyat',
    'common.lead': 'Teslim: {d}',
    'common.copyManual': 'Bağlantı seçildi; kopyalamak için Ctrl+C.',
    'common.bootError': 'Atölye yüklenemedi. Bağlantını kontrol edip sayfayı yenile.',
    'order.hello': 'Merhaba Oktos, bu tasarımı sipariş etmek istiyorum.',
    'order.tool': 'Araç',
    'order.preset': 'Şablon',
    'order.custom': 'Kendi ölçüm',
    'order.weight': 'Tahmini ağırlık',
    'order.color': 'Renk',
    'order.design': 'Tasarım',
    'order.subject': 'Oktos Workshop siparişi',
    'order.notSet': 'Sipariş hattı henüz ayarlanmadı.',
    'common.workshopExport': 'Atölye: dışa aktar',
    'common.tooBig': 'Bu boyut tek parçada basılamıyor. Oktos parçalara bölüp birleştirerek basar.',
    'order.split': 'Not: tek parçaya sığmıyor, parçalı baskı gerekebilir.',
    'common.advanced': 'Atölye ayarları',
    'common.colorSw': 'Renk',
    'view.iso': 'İzometrik',
    'view.top': 'Üst',
    'view.front': 'Ön',
    'view.right': 'Sağ',
    'view.fit': 'Sığdır',
    'status.soon': 'Yakında',
    'status.live': 'Hazır',
    'oda.next': 'Sıradaki ürün',
    'oda.tpl': 'Şablonlar',
    'oda.prevTpl': 'Önceki şablon',
    'oda.nextTpl': 'Sonraki şablon',
    'oda.tplHint': '← → şablon değiştirir, Esc geri götürür.',
    'oda.tplHintTouch': 'Yana kaydır, şablon değişsin.',
    'oda.dust.saksilar': 'Sana özel saksıyı tasarla!',
    'oda.dust.cekmece': 'Sana özel organizeri tasarla!',
    'oda.dust.kalemlik': 'Sana özel kalemliği tasarla!',
    'oda.tur.baslik': 'Odana dair her şey',
    'oda.tur.basla': 'Çekmece organizeriyle başla',
    'oda.aracta': '{a} aracında açılır',
    'oda.aracYakinda': '{a} aracı yakında',
    'oda.magazada': "oktosworkshop.com'da satışta",
    'oda.dust.anahtarlik': 'Anahtarlığını mağazada bul!',
  },
  en: {
    'app.name': 'Oktos Workshop',
    'app.tagline': 'A parametric 3D-print workshop that runs in your browser',
    'nav.tools': 'Tools',
    'common.presets': 'Presets',
    'common.export': 'Export',
    'common.downloadSTL': 'Download STL',
    'common.download3MF': 'Download 3MF',
    'common.share': 'Copy link',
    'common.copied': 'Link copied',
    'common.reset': 'Reset',
    'common.stats': 'Dimensions',
    'common.notes': 'Notes',
    'common.loading': 'Loading geometry engine…',
    'common.building': 'Building…',
    'common.error': 'Could not build a model with these settings. Change a value and try again.',
    'common.size': 'Size',
    'common.volume': 'Volume',
    'common.weight': 'Weight (PLA)',
    'common.triangles': 'Triangles',
    'common.printer': 'Printer bed',
    'common.fits': 'Fits the bed',
    'common.noFit': 'Does not fit the bed',
    'common.edges': 'Edge lines',
    'common.color': 'Preview colour',
    'common.order': 'Order a print',
    'common.orderWa': 'Order on WhatsApp',
    'common.estPrice': 'Estimated price',
    'common.lead': 'Delivery: {d}',
    'common.copyManual': 'Link selected; press Ctrl+C to copy.',
    'common.bootError': 'The workshop could not load. Check your connection and reload the page.',
    'order.hello': 'Hello Oktos, I would like to order this design.',
    'order.tool': 'Tool',
    'order.preset': 'Preset',
    'order.custom': 'My own size',
    'order.weight': 'Estimated weight',
    'order.color': 'Colour',
    'order.design': 'Design',
    'order.subject': 'Oktos Workshop order',
    'order.notSet': 'The order line is not set up yet.',
    'common.workshopExport': 'Workshop: export',
    'common.tooBig': 'This size can\'t be printed in one piece. Oktos splits it and joins the parts.',
    'order.split': 'Note: too big for one piece, may need a split print.',
    'common.advanced': 'Workshop settings',
    'common.colorSw': 'Colour',
    'view.iso': 'Iso',
    'view.top': 'Top',
    'view.front': 'Front',
    'view.right': 'Right',
    'view.fit': 'Fit',
    'status.soon': 'Soon',
    'status.live': 'Ready',
    'oda.next': 'Next product',
    'oda.tpl': 'Templates',
    'oda.prevTpl': 'Previous template',
    'oda.nextTpl': 'Next template',
    'oda.tplHint': '← → switch templates, Esc goes back.',
    'oda.tplHintTouch': 'Swipe sideways to switch templates.',
    'oda.dust.saksilar': 'Design your own planter!',
    'oda.dust.cekmece': 'Design your own organizer!',
    'oda.dust.kalemlik': 'Design your own pen cup!',
    'oda.tur.baslik': 'Everything for your room',
    'oda.tur.basla': 'Start with the drawer organizer',
    'oda.aracta': 'Opens in {a}',
    'oda.aracYakinda': '{a} is coming soon',
    'oda.magazada': 'Sold at oktosworkshop.com',
    'oda.dust.anahtarlik': 'Find your keychain in the shop!',
  },
};

function readLang() {
  try { return localStorage.getItem('oktos.lang') || 'tr'; } catch (_) { return 'tr'; }
}

let lang = readLang();
const listeners = [];

export function addStrings(extra) {
  for (const l of Object.keys(extra)) Object.assign(dict[l] ||= {}, extra[l]);
}

export function t(key, vars) {
  let s = dict[lang]?.[key] ?? dict.tr[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export function getLang() { return lang; }

export function setLang(l) {
  lang = l;
  try { localStorage.setItem('oktos.lang', l); } catch (_) { /* gizli pencere */ }
  document.documentElement.lang = l;
  applyI18n();
  listeners.forEach((fn) => fn(l));
}

export function onLang(fn) { listeners.push(fn); }

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}
