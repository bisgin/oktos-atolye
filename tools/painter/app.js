// Filament Painter aracı: fotoğraf ya da örnek manzara → filament renkleriyle katman katman rölyef (çerçeveli tablo,
// pencere ışıklığı, kartpostal). Şablon kimlikleri odadaki ve hikâye sahnesindeki rölyeflerle aynı.
// Renk değişim yükseklikleri bilgi satırında ve sipariş mesajında (atölye dilimleyicide bu katmanlarda renk değiştirir).
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scopeMany } from '../../core/csg.js';
import { t, getLang } from '../../core/i18n.js';
import { PALETLER, bantlar, degisimler, olcu, resimKoy, resimVar } from './geometry.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2 });
const ORAN = { mountain: 10 / 7, sea: 10 / 7, lake: 10 / 7, yukle: 4 / 3 };

const strings = {
  tr: {
    'painter.title': 'Filament Painter',
    'painter.lede': 'Sevdiğin kareyi filament renkleriyle katman katman bas. Bir şablon seç, fotoğrafını koy, sipariş ver.',
    'mode.cerceve': 'Çerçeveli tablo', 'mode.isiklik': 'Pencere ışıklığı', 'mode.kartpostal': 'Kartpostal',
    'sec.resim': 'Resim', 'sec.olcu': 'Ölçü', 'sec.renk': 'Filament renkleri', 'sec.katman': 'Katmanlar', 'sec.view': 'Görünüm',
    'p.dosya': 'Kendi fotoğrafını seç', 'p.dosya.h': 'Önizleme içindir; siparişte fotoğrafı ayrıca gönderirsin.',
    'p.resim': 'Örnek', 'rs.mountain': 'Dağlar', 'rs.sea': 'Deniz', 'rs.lake': 'Göl',
    'p.genislik': 'Genişlik', 'p.kenar': 'Kenar', 'p.ters': 'Ters çevir', 'p.ters.h': 'Koyu yerler kabarır (bazı fotoğraflarda daha iyi)',
    'p.kontrast': 'Kontrast', 'p.palet': 'Palet',
    'pl.sunset': 'Gün batımı', 'pl.lake': 'Göl', 'pl.sea': 'Deniz', 'pl.mono': 'Siyah beyaz', 'pl.sepya': 'Sepya',
    'p.taban': 'Taban kalınlığı', 'p.tepe': 'En yüksek nokta', 'p.katman': 'Katman yüksekliği',
    'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'info.boyut': 'Resim', 'info.degisim': 'Renk değişimi', 'info.katman': 'Katman',
    'n.foto': 'Yüklenen fotoğraf bağlantıyla taşınmaz; önizlemede örnek var, fotoğrafını yeniden seç.',
    'n.ince': 'Taban {t} mm: ışıklıkta ışık fazla geçer, tabloda kırılgan olabilir.',
    'n.isik': 'Işıklık pencereye asılır: ışık arkadan geçer, açık renkler parlar.',
    'order.renkler': 'Filamentler: {r}',
    'order.degisim': 'Renk değişimleri: {d}',
    'order.foto': 'Fotoğraf: {ad} (mesajla ayrıca göndereceğim)',
    'order.fotoOrnek': 'Resim: örnek ({r})',
    'pr.mountain': 'Gün batımı', 'pr.sea': 'Deniz', 'pr.lake': 'Göl', 'pr.window': 'Pencere ışıklığı', 'pr.card': 'Kartpostal',
  },
  en: {
    'painter.title': 'Filament Painter',
    'painter.lede': 'Print a favourite picture layer by layer in filament colours. Pick a preset, add your photo, order it.',
    'mode.cerceve': 'Framed relief', 'mode.isiklik': 'Window panel', 'mode.kartpostal': 'Postcard',
    'sec.resim': 'Picture', 'sec.olcu': 'Size', 'sec.renk': 'Filament colours', 'sec.katman': 'Layers', 'sec.view': 'View',
    'p.dosya': 'Choose your photo', 'p.dosya.h': 'For the preview only; you send the photo with your order.',
    'p.resim': 'Example', 'rs.mountain': 'Mountains', 'rs.sea': 'Sea', 'rs.lake': 'Lake',
    'p.genislik': 'Width', 'p.kenar': 'Border', 'p.ters': 'Invert', 'p.ters.h': 'Dark areas rise (better for some photos)',
    'p.kontrast': 'Contrast', 'p.palet': 'Palette',
    'pl.sunset': 'Sunset', 'pl.lake': 'Lake', 'pl.sea': 'Sea', 'pl.mono': 'Black and white', 'pl.sepya': 'Sepia',
    'p.taban': 'Base thickness', 'p.tepe': 'Highest point', 'p.katman': 'Layer height',
    'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'info.boyut': 'Picture', 'info.degisim': 'Colour changes', 'info.katman': 'Layers',
    'n.foto': 'An uploaded photo does not travel with the link; the preview shows an example, choose your photo again.',
    'n.ince': 'Base {t} mm: lets too much light through a window panel, may be fragile as a relief.',
    'n.isik': 'The panel hangs in a window: light shines through and the light colours glow.',
    'order.renkler': 'Filaments: {r}',
    'order.degisim': 'Colour changes: {d}',
    'order.foto': 'Photo: {ad} (I will send it separately)',
    'order.fotoOrnek': 'Picture: example ({r})',
    'pr.mountain': 'Sunset', 'pr.sea': 'Sea', 'pr.lake': 'Lake', 'pr.window': 'Window panel', 'pr.card': 'Postcard',
  },
};

// Yüklenen fotoğraf en çok 1200 px'e küçültülür (ızgara 0,5 mm; 250 mm genişlikte 500 nokta yeter)
function resimOku(file) {
  return new Promise((ok, hata) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1200 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
      cv.width = Math.round(im.width * k);
      cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      ok(cv);
    };
    im.onerror = () => { URL.revokeObjectURL(url); hata(new Error('resim okunamadı')); };
    im.src = url;
  });
}
async function dosyaSec(file, s) {
  const cv = await resimOku(file);
  resimKoy(cv);
  ORAN.yukle = cv.width / cv.height;
  s.resim = 'yukle';
  s.fotoAd = file.name.slice(0, 60);
}

const defaults = {
  mode: 'cerceve', resim: 'mountain', fotoAd: '', genislik: 160, kenar: 6, ters: false, kontrast: 1.1, palet: 'sunset',
  taban: 0.6, tepe: 3.2, katman: 0.08, color: '#1f2a3a', printer: 'p1s', edges: false,
};

// Kabuk şablonun color'ını ana renge yazar: paletin taban rengi
const P = (mode, id, values) => ({ id, mode, label: 'pr.' + id, color: PALETLER[values.palet][0][1], values: { ...values, color: PALETLER[values.palet][0][1] } });
const presets = [
  P('cerceve', 'mountain', { resim: 'mountain', palet: 'sunset', genislik: 160, kenar: 6, tepe: 3.2 }),
  P('cerceve', 'sea', { resim: 'sea', palet: 'sea', genislik: 160, kenar: 6, tepe: 3.2 }),
  P('cerceve', 'lake', { resim: 'lake', palet: 'lake', genislik: 160, kenar: 6, tepe: 3.2 }),
  P('isiklik', 'window', { resim: 'mountain', palet: 'sunset', genislik: 200, kenar: 8, tepe: 2.8 }),
  P('kartpostal', 'card', { resim: 'lake', palet: 'lake', tepe: 2.4 }),
];

const kartDegil = (s) => s.mode !== 'kartpostal';
function schema() {
  return [
    { type: 'section', label: 'sec.resim' },
    { type: 'file', key: 'resim', label: 'p.dosya', hint: 'p.dosya.h', onFile: dosyaSec },
    { type: 'segmented', key: 'resim', label: 'p.resim', options: [['mountain', 'rs.mountain'], ['sea', 'rs.sea'], ['lake', 'rs.lake']] },
    { type: 'range', key: 'kontrast', label: 'p.kontrast', min: 0.6, max: 2, step: 0.05 },
    { type: 'toggle', key: 'ters', label: 'p.ters', hint: 'p.ters.h' },
    { type: 'section', label: 'sec.olcu', show: kartDegil },
    { type: 'range', key: 'genislik', label: 'p.genislik', min: 60, max: 250, step: 5, unit: 'mm', show: kartDegil },
    { type: 'range', key: 'kenar', label: 'p.kenar', min: 0, max: 15, step: 1, unit: 'mm', show: kartDegil },
    { type: 'section', label: 'sec.renk' },
    { type: 'select', key: 'palet', label: 'p.palet', options: Object.keys(PALETLER).map((k) => [k, 'pl.' + k]) },
    { type: 'html', id: 'palet-onizleme' },
    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.katman' },
    { type: 'range', key: 'taban', label: 'p.taban', min: 0.4, max: 2, step: 0.04, unit: 'mm' },
    { type: 'range', key: 'tepe', label: 'p.tepe', min: 1.6, max: 6, step: 0.08, unit: 'mm' },
    { type: 'segmented', key: 'katman', label: 'p.katman', options: [[0.08, '0,08'], [0.12, '0,12'], [0.16, '0,16'], [0.2, '0,20']] },
    { type: 'section', label: 'sec.view' },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

const oran = (s) => ORAN[s.resim] ?? 10 / 7;
const renkAdi = (s, k) => PALETLER[s.palet]?.[k]?.[0] ?? '';

function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (!['cerceve', 'isiklik', 'kartpostal'].includes(s.mode)) s.mode = 'cerceve';
  if (!PALETLER[s.palet]) s.palet = 'sunset';
  s.color = PALETLER[s.palet][0][1];
  if (s.resim === 'yukle' && !resimVar()) { s.resim = 'mountain'; T('n.foto'); }
  s.tepe = Math.max(s.tepe, s.taban + 1);
  if (s.taban < 0.6) T('n.ince', { t: mm(s.taban) });
  if (s.mode === 'isiklik') T('n.isik');
  // Palet önizlemesi: dört renk, taban rengi solda
  const kutu = s._thumb ? null : document.getElementById('palet-onizleme'); // küçük resim hesabı paneli ezmesin
  if (kutu) kutu.innerHTML = `<div style="display:flex;gap:4px;margin-top:2px">${PALETLER[s.palet].map(([ad, hex]) => `<span title="${ad}" style="flex:1;height:22px;border-radius:5px;background:${hex};border:1px solid rgb(0 0 0 / .12)"></span>`).join('')}</div>`;
  return notes;
}

function build(s) {
  const palet = PALETLER[s.palet];
  const parts = scopeMany(() => bantlar(s, oran(s))).map((result, k) => ({ result, name: `renk_${k + 1}`, color: palet[k][1] })).filter((p) => !p.result.empty);
  const [W, H] = olcu(s, oran(s)), z = degisimler(s);
  return {
    parts,
    info: [['info.boyut', `${mm(W)} × ${mm(H)} mm`], ['info.degisim', `${z.slice(1).map((x) => mm(x)).join(' · ')} mm`], ['info.katman', `${Math.round(s.tepe / s.katman)} × ${mm(s.katman)} mm`]],
  };
}

const fileName = (s) => `oktos_painter_${s.mode}_${s.palet}`;
function orderLines(s) {
  const z = degisimler(s);
  return [
    t('order.renkler', { r: [0, 1, 2, 3].map((k) => renkAdi(s, k)).join(' → ') }),
    t('order.degisim', { d: z.slice(1).map((x, i) => `${mm(x)} mm (${renkAdi(s, i + 1)})`).join(', ') }),
    s.resim === 'yukle' ? t('order.foto', { ad: s.fotoAd }) : t('order.fotoOrnek', { r: t('rs.' + s.resim) }),
  ];
}

export const TOOL = {
  id: 'painter', strings, defaults, presets, schema, build, fileName, enforce, orderLines,
  modes: [['cerceve', 'mode.cerceve'], ['isiklik', 'mode.isiklik'], ['kartpostal', 'mode.kartpostal']],
};

export function start() {
  return createTool(TOOL);
}

