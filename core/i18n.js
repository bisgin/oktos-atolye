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
    'common.orderSoon': 'Sipariş akışı yakında: tasarla, Oktos basıp göndersin.',
    'view.iso': 'İzometrik',
    'view.top': 'Üst',
    'view.front': 'Ön',
    'view.right': 'Sağ',
    'view.fit': 'Sığdır',
    'status.soon': 'Yakında',
    'status.live': 'Hazır',
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
    'common.orderSoon': 'Ordering is coming soon: design it, Oktos prints and ships it.',
    'view.iso': 'Iso',
    'view.top': 'Top',
    'view.front': 'Front',
    'view.right': 'Right',
    'view.fit': 'Fit',
    'status.soon': 'Soon',
    'status.live': 'Ready',
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
