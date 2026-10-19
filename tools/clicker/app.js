// Fidget Clicker aracı: içine klavye anahtarı takılan figür anahtarlık (kedi, kalp, yıldız, yazılı kutu) ve aynı
// tasarımın MX uyumlu tuş başlığı. Şablon kimlikleri odadaki tuş setleriyle (kedi, kalp, yildiz, harf) ve hikâye
// sahnesindeki clicker'larla (cat, heart, star, boxed) aynı.
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scope } from '../../core/csg.js';
import { t, getLang } from '../../core/i18n.js';
import { hazirla, parcalar } from './geometry.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2 });

const strings = {
  tr: {
    'clicker.title': 'Fidget Clicker',
    'clicker.lede': 'Sevdiğin figürün içinde bir klavye anahtarının çıtırtısı; klavyene de aynı tasarımın tuşu. Seç, ayarla, sipariş ver.',
    'mode.anahtarlik': 'Clicker anahtarlık', 'mode.tus': 'Tuş başlığı',
    'sec.sekil': 'Figür', 'sec.tus': 'Tuş', 'sec.view': 'Görünüm',
    'p.sekil': 'Figür', 'sk.kedi': 'Kedi', 'sk.kalp': 'Kalp', 'sk.yildiz': 'Yıldız', 'sk.kutu': 'Kutu',
    'p.boy': 'Boyut', 'p.metin': 'Kutunun yazısı', 'p.u': 'Genişlik', 'p.motif': 'Motif',
    'mt.kedi': 'Kedi', 'mt.kalp': 'Kalp', 'mt.yildiz': 'Yıldız', 'mt.harf': 'Harf', 'mt.ok': 'Ok', 'p.harf': 'Harf ya da kısa yazı',
    'p.color': 'Kapak rengi', 'p.colorTus': 'Motif rengi', 'p.govde': 'Gövde rengi', 'p.govdeTus': 'Tuş rengi',
    'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'col.orange': 'Turuncu', 'col.cream': 'Krem', 'col.ink': 'Mürekkep', 'col.red': 'Kırmızı', 'col.pink': 'Pembe',
    'col.blue': 'Mavi', 'col.yellow': 'Sarı', 'col.sage': 'Adaçayı', 'col.white': 'Beyaz', 'col.sand': 'Kum',
    'info.anahtar': 'Anahtar', 'info.tus': 'Tuş', 'v.mx': 'MX uyumlu, 14 mm yuva',
    'n.anahtar': 'İçine Cherry MX uyumlu bir klavye anahtarı takılır (yarı saydam gösterilen); kapak anahtarın sapına oturur.',
    'n.tus': 'MX uyumlu sap (artı yuva). Klavyende tuşun yerine tak; {u} genişlikte.',
    'n.kucuk': 'Figür küçük: kapakta anahtara yer kalmaz, en az 34 mm olmalı.',
    'order.anahtar': 'Anahtar yuvası: Cherry MX uyumlu (14 mm)',
    'pr.cat': 'Kedi clicker', 'pr.heart': 'Kalp clicker', 'pr.star': 'Yıldız clicker', 'pr.boxed': 'Kutulu clicker',
    'pr.kedi': 'Kedi tuşu', 'pr.kalp': 'Kalp tuşu', 'pr.yildiz': 'Yıldız tuşu', 'pr.harf': 'Harf tuşu',
  },
  en: {
    'clicker.title': 'Fidget Clicker',
    'clicker.lede': 'The click of a keyboard switch inside a figure you love; the same design as a keycap. Pick, adjust, order.',
    'mode.anahtarlik': 'Clicker keychain', 'mode.tus': 'Keycap',
    'sec.sekil': 'Figure', 'sec.tus': 'Key', 'sec.view': 'View',
    'p.sekil': 'Figure', 'sk.kedi': 'Cat', 'sk.kalp': 'Heart', 'sk.yildiz': 'Star', 'sk.kutu': 'Box',
    'p.boy': 'Size', 'p.metin': 'Box lettering', 'p.u': 'Width', 'p.motif': 'Motif',
    'mt.kedi': 'Cat', 'mt.kalp': 'Heart', 'mt.yildiz': 'Star', 'mt.harf': 'Letter', 'mt.ok': 'Arrow', 'p.harf': 'Letter or short text',
    'p.color': 'Cap colour', 'p.colorTus': 'Motif colour', 'p.govde': 'Body colour', 'p.govdeTus': 'Key colour',
    'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'col.orange': 'Orange', 'col.cream': 'Cream', 'col.ink': 'Ink', 'col.red': 'Red', 'col.pink': 'Pink',
    'col.blue': 'Blue', 'col.yellow': 'Yellow', 'col.sage': 'Sage', 'col.white': 'White', 'col.sand': 'Sand',
    'info.anahtar': 'Switch', 'info.tus': 'Key', 'v.mx': 'MX compatible, 14 mm slot',
    'n.anahtar': 'A Cherry MX compatible keyboard switch goes inside (shown see-through); the cap sits on its stem.',
    'n.tus': 'MX compatible stem (cross socket). Swap it onto your keyboard; {u} wide.',
    'n.kucuk': 'The figure is small: no room for the switch under the cap, it needs at least 34 mm.',
    'order.anahtar': 'Switch slot: Cherry MX compatible (14 mm)',
    'pr.cat': 'Cat clicker', 'pr.heart': 'Heart clicker', 'pr.star': 'Star clicker', 'pr.boxed': 'Boxed clicker',
    'pr.kedi': 'Cat keycap', 'pr.kalp': 'Heart keycap', 'pr.yildiz': 'Star keycap', 'pr.harf': 'Letter keycap',
  },
};

const COLORS = [
  ['#d4621f', 'col.orange'], ['#f3efe6', 'col.cream'], ['#2b3036', 'col.ink'], ['#b8372f', 'col.red'], ['#e9b8b8', 'col.pink'],
  ['#3f6fb0', 'col.blue'], ['#e6b33a', 'col.yellow'], ['#8fa58a', 'col.sage'], ['#ece9e2', 'col.white'], ['#c9b596', 'col.sand'],
];

const defaults = {
  mode: 'anahtarlik', sekil: 'kedi', boy: 46, metin: 'OKTOS', u: 1, motif: 'kedi', harf: 'O',
  color: '#f3efe6', govde: '#d4621f', printer: 'p1s', edges: false,
};

// Kabuk şablonun color'ını ana renge yazar (kapak ya da motif): values.color ile aynı
const P = (mode, id, values) => ({ id, mode, label: 'pr.' + id, color: values.color, values });
const presets = [
  P('anahtarlik', 'cat', { sekil: 'kedi', boy: 46, color: '#f3efe6', govde: '#d4621f' }),
  P('anahtarlik', 'heart', { sekil: 'kalp', boy: 50, color: '#e9b8b8', govde: '#b8372f' }),
  P('anahtarlik', 'star', { sekil: 'yildiz', boy: 60, color: '#e6b33a', govde: '#3f6fb0' }),
  P('anahtarlik', 'boxed', { sekil: 'kutu', boy: 40, metin: 'OKTOS', color: '#2b3036', govde: '#f3efe6' }),
  P('tus', 'kedi', { motif: 'kedi', u: 1, color: '#f3efe6', govde: '#d4621f' }),
  P('tus', 'kalp', { motif: 'kalp', u: 1, color: '#b8372f', govde: '#e9b8b8' }),
  P('tus', 'yildiz', { motif: 'yildiz', u: 1, color: '#e6b33a', govde: '#3f6fb0' }),
  P('tus', 'harf', { motif: 'harf', harf: 'O', u: 1, color: '#ece9e2', govde: '#2b3036' }),
];

const isA = (s) => s.mode === 'anahtarlik';
const isT = (s) => s.mode === 'tus';
function schema() {
  return [
    { type: 'section', label: 'sec.sekil', show: isA },
    { type: 'segmented', key: 'sekil', label: 'p.sekil', hideLabel: true, options: [['kedi', 'sk.kedi'], ['kalp', 'sk.kalp'], ['yildiz', 'sk.yildiz'], ['kutu', 'sk.kutu']], show: isA },
    { type: 'range', key: 'boy', label: 'p.boy', min: 34, max: 70, step: 1, unit: 'mm', show: isA },
    { type: 'text', key: 'metin', label: 'p.metin', max: 8, show: (s) => isA(s) && s.sekil === 'kutu' },
    { type: 'section', label: 'sec.tus', show: isT },
    { type: 'segmented', key: 'motif', label: 'p.motif', options: [['kedi', 'mt.kedi'], ['kalp', 'mt.kalp'], ['yildiz', 'mt.yildiz'], ['harf', 'mt.harf'], ['ok', 'mt.ok']], show: isT },
    { type: 'text', key: 'harf', label: 'p.harf', max: 6, show: (s) => isT(s) && s.motif === 'harf' },
    { type: 'segmented', key: 'u', label: 'p.u', options: [[1, '1u'], [1.25, '1,25u'], [1.5, '1,5u'], [2, '2u'], [2.25, '2,25u']], show: isT },
    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', options: COLORS, show: isA },
    { type: 'swatch', key: 'color', label: 'p.colorTus', options: COLORS, show: isT },
    { type: 'swatch', key: 'govde', label: 'p.govde', options: COLORS, show: isA },
    { type: 'swatch', key: 'govde', label: 'p.govdeTus', options: COLORS, show: isT },
    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.view' },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (s.mode !== 'tus') s.mode = 'anahtarlik';
  s.u = [1, 1.25, 1.5, 2, 2.25].includes(Number(s.u)) ? Number(s.u) : 1;
  if (isA(s)) {
    if (s.boy < 34) { s.boy = 34; T('n.kucuk'); }
    T('n.anahtar');
  } else T('n.tus', { u: `${mm(s.u)}u` });
  return notes;
}

function build(s) {
  const renk = { color: s.color, govde: s.govde, anahtar: '#3f8fe0' };
  const parts = parcalar(s).map((p) => ({ result: scope(p.fn), name: p.ad, color: renk[p.renk], ...(p.ghost ? { ghost: true } : {}) })).filter((p) => !p.result.empty);
  return { parts, info: isA(s) ? [['info.anahtar', t('v.mx')]] : [['info.tus', `${mm(s.u)}u · ${mm(s.u * 19.05 - 1.05)} × 18 mm`]] };
}

const fileName = (s) => (isA(s) ? `oktos_clicker_${s.sekil}` : `oktos_tus_${s.motif}_${s.u}u`);
const orderLines = (s) => (isA(s) ? [t('order.anahtar')] : []);

export const TOOL = {
  id: 'clicker', strings, defaults, presets, schema, build, fileName, enforce, orderLines, init: hazirla,
  modes: [['anahtarlik', 'mode.anahtarlik'], ['tus', 'mode.tus']],
};

export function start() {
  return createTool(TOOL);
}
