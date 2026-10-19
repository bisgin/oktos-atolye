// 3D Yazı aracı: kapı plakası, masa tabelası, pasta süsü, buzdolabı mıknatısı, anahtarlık. Ayarlar, şablonlar, kurallar.
// Şablon kimlikleri odadaki (tabela, mıknatıs, pasta süsü) ve hikâye sahnesindeki ürünlerle aynı; oda ?sablon= ile açar.
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scope } from '../../core/csg.js';
import { getLang } from '../../core/i18n.js';
import { hazirla, parcalar, olcu, enDarHarf } from './geometry.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });
const PALET = ['#d4621f', '#3f6fb0', '#e6b33a', '#b8372f', '#8fa58a', '#d49a9a', '#2b3036']; // renkli mıknatıslar sırayla

const strings = {
  tr: {
    'text.title': '3D Yazı',
    'text.lede': 'Kapı plakası, masa tabelası, pasta süsü, mıknatıs, anahtarlık. Yazını yaz, biçimini seç, sipariş ver.',
    'mode.plaka': 'Plaka', 'mode.masa': 'Masa tabelası', 'mode.pasta': 'Pasta süsü', 'mode.miknatis': 'Mıknatıs', 'mode.anahtarlik': 'Anahtarlık',
    'sec.yazi': 'Yazı', 'sec.bicim': 'Biçim', 'sec.olcu': 'Ölçü', 'sec.miknatis': 'Mıknatıs yuvası', 'sec.view': 'Görünüm',
    'p.metin': 'Yazın', 'p.agirlik': 'Kalınlık', 'ag.500': 'Orta', 'ag.700': 'Kalın', 'ag.900': 'Çok kalın',
    'p.boy': 'Yazı boyu', 'p.aralik': 'Harf aralığı', 'p.derinlik': 'Yazı kabartması', 'p.kalinlik': 'Gövde kalınlığı',
    'p.stil': 'Plaka', 'st.plaka': 'Düz plaka', 'st.yuvarlak': 'Yuvarlak', 'st.harf': 'Harf harf',
    'p.delik': 'Vida deliği', 'p.delik.h': 'İki uçta; yapıştırılacaksa kapalı kalsın',
    'p.mstil': 'Mıknatıs', 'ms.harf': 'Harf harf', 'ms.not': 'Not levhası', 'ms.sekil': 'Kalp ve yıldız',
    'p.renkli': 'Renkli', 'p.renkli.h': 'Her parça başka renk', 'p.mCap': 'Mıknatıs çapı', 'p.mH': 'Mıknatıs kalınlığı',
    'p.color': 'Yazı rengi', 'p.govde': 'Gövde rengi', 'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'col.orange': 'Turuncu', 'col.sand': 'Kum', 'col.sage': 'Adaçayı', 'col.ink': 'Mürekkep', 'col.white': 'Beyaz', 'col.cream': 'Krem',
    'col.blue': 'Mavi', 'col.red': 'Kırmızı', 'col.yellow': 'Sarı', 'col.wood': 'Açık ahşap', 'col.rose': 'Gül', 'col.walnut': 'Ceviz',
    'info.yazi': 'Yazı', 'info.parca': 'Parça',
    'n.small': 'Yazı küçük: ince çizgiler kırılabilir, en az 12 mm önerilir.',
    'n.empty': 'Yazı boş; örnek yazı kullanıldı.',
    'n.dar': 'En dar harfe {c} mm mıknatıs sığmıyor: yazıyı büyüt ya da daha küçük mıknatıs seç.',
    'n.nokta': 'Noktalı harflerde (i, ö, ü) nokta ayrı küçük parça olur.',
    'pr.plate': 'Düz plaka', 'pr.letters': 'Harf harf', 'pr.round': 'Yuvarlak plaka', 'pr.door': 'Kapı isimliği',
    'pr.sign': 'Masa tabelası', 'pr.key': 'Anahtarlık', 'pr.harfler': 'Harf mıknatısları', 'pr.not': 'Not mıknatısı',
    'pr.kalp': 'Kalp ve yıldız', 'pr.iyi': 'İyi ki doğdun', 'pr.nice': 'Nice yıllara',
  },
  en: {
    'text.title': '3D Text',
    'text.lede': 'Door plates, desk signs, cake toppers, magnets, keychains. Type your words, pick a form, order it.',
    'mode.plaka': 'Plate', 'mode.masa': 'Desk sign', 'mode.pasta': 'Cake topper', 'mode.miknatis': 'Magnet', 'mode.anahtarlik': 'Keychain',
    'sec.yazi': 'Text', 'sec.bicim': 'Form', 'sec.olcu': 'Size', 'sec.miknatis': 'Magnet pocket', 'sec.view': 'View',
    'p.metin': 'Your text', 'p.agirlik': 'Weight', 'ag.500': 'Medium', 'ag.700': 'Bold', 'ag.900': 'Heavy',
    'p.boy': 'Text size', 'p.aralik': 'Letter spacing', 'p.derinlik': 'Text relief', 'p.kalinlik': 'Body thickness',
    'p.stil': 'Plate', 'st.plaka': 'Flat plate', 'st.yuvarlak': 'Rounded', 'st.harf': 'Letters only',
    'p.delik': 'Screw holes', 'p.delik.h': 'At both ends; leave off if you glue it',
    'p.mstil': 'Magnet', 'ms.harf': 'Letter by letter', 'ms.not': 'Note plate', 'ms.sekil': 'Hearts and stars',
    'p.renkli': 'Colourful', 'p.renkli.h': 'Every piece another colour', 'p.mCap': 'Magnet diameter', 'p.mH': 'Magnet thickness',
    'p.color': 'Text colour', 'p.govde': 'Body colour', 'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'col.orange': 'Orange', 'col.sand': 'Sand', 'col.sage': 'Sage', 'col.ink': 'Ink', 'col.white': 'White', 'col.cream': 'Cream',
    'col.blue': 'Blue', 'col.red': 'Red', 'col.yellow': 'Yellow', 'col.wood': 'Light wood', 'col.rose': 'Rose', 'col.walnut': 'Walnut',
    'info.yazi': 'Text', 'info.parca': 'Pieces',
    'n.small': 'Small text: thin strokes can break, 12 mm or more is recommended.',
    'n.empty': 'Text is empty; an example is used.',
    'n.dar': 'A {c} mm magnet does not fit the narrowest letter: enlarge the text or pick a smaller magnet.',
    'n.nokta': 'On dotted letters (i, ö, ü) the dot becomes a separate small piece.',
    'pr.plate': 'Flat plate', 'pr.letters': 'Letters only', 'pr.round': 'Rounded plate', 'pr.door': 'Door plate',
    'pr.sign': 'Desk sign', 'pr.key': 'Keychain', 'pr.harfler': 'Letter magnets', 'pr.not': 'Note magnet',
    'pr.kalp': 'Hearts and stars', 'pr.iyi': 'Happy birthday', 'pr.nice': 'Many more',
  },
};

const COLORS = [
  ['#2b3036', 'col.ink'], ['#f3efe6', 'col.cream'], ['#ece9e2', 'col.white'], ['#d4621f', 'col.orange'], ['#b8372f', 'col.red'],
  ['#e6b33a', 'col.yellow'], ['#8fa58a', 'col.sage'], ['#3f6fb0', 'col.blue'], ['#d49a9a', 'col.rose'], ['#c9b596', 'col.sand'],
  ['#dcc2a2', 'col.wood'], ['#b38e64', 'col.walnut'],
];

// Şablon yazıları sayfanın diline göre (odadaki yazılarla aynı)
const YAZI = getLang() === 'en'
  ? { plate: 'Fresh air zone', door: 'STUDIO', sign: 'HELLO', key: 'OKTOS', harfler: 'OKTOS', not: 'BUY MILK!', iyi: 'Happy birthday', nice: 'Many more' }
  : { plate: 'Oksijen alma alanı', door: 'ATÖLYE', sign: 'MERHABA', key: 'OKTOS', harfler: 'OKTOS', not: 'SÜT AL!', iyi: 'İyi ki doğdun', nice: 'Nice yıllara' };

const defaults = {
  mode: 'plaka', metin: YAZI.door, agirlik: 700, boy: 30, aralik: 0.04, derinlik: 2, kalinlik: 4, stil: 'plaka', delik: false,
  mstil: 'harf', renkli: true, mCap: 6, mH: 2, color: '#2b3036', govde: '#f3efe6', printer: 'p1s', edges: false,
};

// Kabuk şablonun color'ını ana renge (yazı) yazar: values.color ile aynı
const P = (mode, id, values) => ({ id, mode, label: 'pr.' + id, color: values.color, values });
const presets = [
  P('plaka', 'plate', { metin: YAZI.plate, stil: 'plaka', boy: 24, color: '#f3efe6', govde: '#2b3036' }),
  P('plaka', 'letters', { metin: YAZI.plate, stil: 'harf', boy: 40, color: '#2b3036' }),
  P('plaka', 'round', { metin: YAZI.plate, stil: 'yuvarlak', boy: 24, color: '#2b3036', govde: '#ece5d8' }),
  P('plaka', 'door', { metin: YAZI.door, stil: 'plaka', boy: 30, color: '#2b3036', govde: '#f2efe7' }),
  P('masa', 'sign', { metin: YAZI.sign, boy: 34, color: '#d4621f', govde: '#dcc2a2' }),
  P('anahtarlik', 'key', { metin: YAZI.key, boy: 14, color: '#f3efe6', govde: '#3f6fb0' }),
  P('miknatis', 'harfler', { metin: YAZI.harfler, mstil: 'harf', boy: 56, renkli: true, mCap: 6, color: '#d4621f' }), // 6 × 2 mm mıknatıs
  P('miknatis', 'not', { metin: YAZI.not, mstil: 'not', boy: 18, color: '#2b3036', govde: '#f6f1e4' }),
  P('miknatis', 'kalp', { mstil: 'sekil', boy: 30, renkli: true, color: '#b8372f' }),
  P('pasta', 'iyi', { metin: YAZI.iyi, boy: 26, color: '#e6b33a', govde: '#e6b33a' }),
  P('pasta', 'nice', { metin: YAZI.nice, boy: 26, color: '#f3efe6', govde: '#d4621f' }),
];

const is = (...m) => (s) => m.includes(s.mode);
const mHarf = (s) => s.mode === 'miknatis' && s.mstil === 'harf';
function schema() {
  return [
    { type: 'section', label: 'sec.yazi', show: (s) => !(s.mode === 'miknatis' && s.mstil === 'sekil') },
    { type: 'text', key: 'metin', label: 'p.metin', max: 40, show: (s) => !(s.mode === 'miknatis' && s.mstil === 'sekil') },
    { type: 'segmented', key: 'agirlik', label: 'p.agirlik', options: [[500, 'ag.500'], [700, 'ag.700'], [900, 'ag.900']], show: (s) => !(s.mode === 'miknatis' && s.mstil === 'sekil') },
    { type: 'section', label: 'sec.bicim', show: is('plaka', 'miknatis') },
    { type: 'segmented', key: 'stil', label: 'p.stil', options: [['plaka', 'st.plaka'], ['yuvarlak', 'st.yuvarlak'], ['harf', 'st.harf']], show: is('plaka') },
    { type: 'toggle', key: 'delik', label: 'p.delik', hint: 'p.delik.h', show: (s) => s.mode === 'plaka' && s.stil !== 'harf' },
    { type: 'segmented', key: 'mstil', label: 'p.mstil', options: [['harf', 'ms.harf'], ['not', 'ms.not'], ['sekil', 'ms.sekil']], show: is('miknatis') },
    { type: 'toggle', key: 'renkli', label: 'p.renkli', hint: 'p.renkli.h', show: (s) => s.mode === 'miknatis' && s.mstil !== 'not' },
    { type: 'section', label: 'sec.olcu' },
    { type: 'range', key: 'boy', label: 'p.boy', min: 8, max: 120, step: 1, unit: 'mm' },
    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', options: COLORS, show: (s) => !(s.mode === 'miknatis' && s.mstil !== 'not' && s.renkli) },
    { type: 'swatch', key: 'govde', label: 'p.govde', options: COLORS, show: (s) => !(s.mode === 'plaka' && s.stil === 'harf') && !(s.mode === 'miknatis' && s.mstil !== 'not') },
    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.olcu' },
    { type: 'range', key: 'aralik', label: 'p.aralik', min: -0.05, max: 0.4, step: 0.01 },
    { type: 'range', key: 'derinlik', label: 'p.derinlik', min: 0.6, max: 8, step: 0.2, unit: 'mm' },
    { type: 'range', key: 'kalinlik', label: 'p.kalinlik', min: 1.6, max: 10, step: 0.2, unit: 'mm' },
    { type: 'section', label: 'sec.miknatis', show: is('miknatis') },
    { type: 'range', key: 'mCap', label: 'p.mCap', min: 4, max: 20, step: 1, unit: 'mm', show: is('miknatis') },
    { type: 'range', key: 'mH', label: 'p.mH', min: 1, max: 5, step: 0.5, unit: 'mm', show: is('miknatis') },
    { type: 'section', label: 'sec.view' },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (!['plaka', 'masa', 'pasta', 'miknatis', 'anahtarlik'].includes(s.mode)) s.mode = 'plaka';
  s.agirlik = [500, 700, 900].includes(Number(s.agirlik)) ? Number(s.agirlik) : 700;
  if (!String(s.metin ?? '').trim()) T('n.empty');
  if (s.boy < 12) T('n.small');
  if (s.mode === 'miknatis') s.kalinlik = Math.max(s.kalinlik, s.mH + 1.2); // yuvanın üstünde en az 1,2 mm et
  if (mHarf(s)) {
    if (enDarHarf(s) < s.mCap + 1.6) T('n.dar', { c: mm(s.mCap) });
    if (/[iıjöüğçşİ!?:;]/.test(s.metin)) T('n.nokta');
  } else if (s.mode === 'plaka' && s.stil === 'harf' && /[iöüğçşİ!?:;]/.test(s.metin)) T('n.nokta');
  return notes;
}

function build(s) {
  const renk = { color: s.color, govde: s.govde };
  const parts = parcalar(s).map((p) => ({
    result: scope(p.fn), name: p.ad,
    color: p.renk === 'palet' ? (s.renkli ? PALET[p.k % PALET.length] : s.color) : renk[p.renk],
  })).filter((p) => !p.result.empty);
  const o = olcu(s);
  return { parts, info: [['info.yazi', `${mm(o.w)} × ${mm(o.h)} mm`], ['info.parca', `${parts.length}`]] };
}

const ascii = (w) => w.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase().slice(0, 24);
const fileName = (s) => `oktos_yazi_${s.mode}_${ascii(s.metin) || 'yazi'}`;

export const TOOL = {
  id: 'text', strings, defaults, presets, schema, build, fileName, enforce, init: hazirla,
  modes: [['plaka', 'mode.plaka'], ['masa', 'mode.masa'], ['pasta', 'mode.pasta'], ['miknatis', 'mode.miknatis'], ['anahtarlik', 'mode.anahtarlik']],
};

export function start() {
  return createTool(TOOL);
}
