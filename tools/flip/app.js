// Text Flip aracı: iki kelime, tek heykel. Önden birinci, yandan ikinci kelime okunur (her harf çifti, önden ve yandan
// çekilmiş iki harfin kesişimi; tools/flip/scene.js flipLayout/flipPiece). Harfler ve taban ayrı renk.
// Şablon kimlikleri odadaki Flip şablonlarıyla aynı (core/oda-urunler.js), oda ?sablon= ile açar.
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import * as C from '../../core/csg.js';
import { plate } from '../../core/scene-kit.js';
import { loadFont } from '../../core/font3d.js';
import { getLang } from '../../core/i18n.js';
import { flipLayout, flipPiece } from './scene.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });
const EN_UZUN = 8; // harf: daha uzun kelime heykeli bölmeli basılacak kadar uzatır, hesap da ağırlaşır
let yazi = null;

const strings = {
  tr: {
    'flip.title': 'Text Flip',
    'flip.lede': 'İki kelime, tek heykel: önden biri, yandan öteki okunur. Kelimelerini yaz, sipariş ver.',
    'sec.words': 'Kelimeler', 'sec.shape': 'Ölçü ve taban', 'sec.view': 'Görünüm',
    'p.w1': 'Önden okunan', 'p.w2': 'Yandan okunan', 'p.buyuk': 'Büyük harf', 'p.buyuk.h': 'Harfler büyük yazılır (en sağlam heykel)',
    'p.size': 'Harf boyu', 'p.taban': 'Taban', 'tb.diag': 'Köşegen', 'tb.round': 'Yuvarlak', 'p.tabanT': 'Taban kalınlığı',
    'p.color': 'Harf rengi', 'p.tabanRenk': 'Taban rengi', 'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'col.orange': 'Turuncu', 'col.sand': 'Kum', 'col.sage': 'Adaçayı', 'col.ink': 'Mürekkep', 'col.white': 'Beyaz',
    'col.blue': 'Mavi', 'col.red': 'Kırmızı', 'col.yellow': 'Sarı', 'col.cream': 'Krem', 'col.wood': 'Açık ahşap', 'col.walnut': 'Ceviz',
    'info.front': 'Önden', 'info.side': 'Yandan', 'info.letters': 'Harf',
    'n.len': 'Kelimeler farklı uzunlukta: kısa kelimenin bittiği yerde yalnız uzun kelimenin harfi durur.',
    'n.empty': 'Bir kelime boş; örnek kelime kullanıldı.',
    'n.long': 'En çok {n} harf; fazlası kesildi.',
    'n.thin': 'Harf boyu küçük: ince harfler kırılabilir, en az 40 mm önerilir.',
    'pr.family': 'ANNE / BABA', 'pr.us': 'SEN / BEN', 'pr.sea': 'ADA / EGE', 'pr.ask': 'AŞK / BİZ',
  },
  en: {
    'flip.title': 'Text Flip',
    'flip.lede': 'Two words, one sculpture: one reads from the front, the other from the side. Type yours, order it.',
    'sec.words': 'Words', 'sec.shape': 'Size and base', 'sec.view': 'View',
    'p.w1': 'Front word', 'p.w2': 'Side word', 'p.buyuk': 'Capitals', 'p.buyuk.h': 'Letters in capitals (sturdiest sculpture)',
    'p.size': 'Letter size', 'p.taban': 'Base', 'tb.diag': 'Diagonal', 'tb.round': 'Round', 'p.tabanT': 'Base thickness',
    'p.color': 'Letter colour', 'p.tabanRenk': 'Base colour', 'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'col.orange': 'Orange', 'col.sand': 'Sand', 'col.sage': 'Sage', 'col.ink': 'Ink', 'col.white': 'White',
    'col.blue': 'Blue', 'col.red': 'Red', 'col.yellow': 'Yellow', 'col.cream': 'Cream', 'col.wood': 'Light wood', 'col.walnut': 'Walnut',
    'info.front': 'Front', 'info.side': 'Side', 'info.letters': 'Letters',
    'n.len': 'The words differ in length: where the short word ends, only the long word\'s letter stands.',
    'n.empty': 'A word is empty; an example word is used.',
    'n.long': 'At most {n} letters; the rest was cut.',
    'n.thin': 'Small letters can break; 40 mm or more is recommended.',
    'pr.family': 'MOM / DAD', 'pr.us': 'YOU / ME', 'pr.sea': 'SEA / SUN', 'pr.ask': 'LOVE / HOME',
  },
};

const COLORS = [
  ['#d4621f', 'col.orange'], ['#b8372f', 'col.red'], ['#e6b33a', 'col.yellow'], ['#8fa58a', 'col.sage'], ['#3f6fb0', 'col.blue'],
  ['#2b3036', 'col.ink'], ['#c9b596', 'col.sand'], ['#dcc2a2', 'col.wood'], ['#b38e64', 'col.walnut'], ['#f4f2ec', 'col.cream'], ['#ece9e2', 'col.white'],
];

// Şablonlar sayfanın diline göre (odadaki Flip şablonlarıyla aynı kelimeler)
const KELIME = getLang() === 'en'
  ? { family: ['MOM', 'DAD'], us: ['YOU', 'ME'], sea: ['SEA', 'SUN'], ask: ['LOVE', 'HOME'] }
  : { family: ['ANNE', 'BABA'], us: ['SEN', 'BEN'], sea: ['ADA', 'EGE'], ask: ['AŞK', 'BİZ'] };

const defaults = {
  w1: KELIME.family[0], w2: KELIME.family[1], buyuk: true, size: 60, taban: 'diag', tabanT: 4,
  color: '#d4621f', tabanRenk: '#2b3036', printer: 'p1s', edges: true,
};

// Kabuk şablonun color'ını ana renge (harfler) yazar: values.color ile aynı
const P = (id, values) => ({ id, label: 'pr.' + id, color: values.color, values: { w1: KELIME[id][0], w2: KELIME[id][1], ...values } });
const presets = [
  P('family', { size: 60, taban: 'diag', color: '#d4621f', tabanRenk: '#2b3036' }),
  P('us', { size: 60, taban: 'round', color: '#8fa58a', tabanRenk: '#dcc2a2' }),
  P('sea', { size: 60, taban: 'diag', color: '#3f6fb0', tabanRenk: '#f4f2ec' }),
  P('ask', { size: 60, taban: 'round', color: '#b8372f', tabanRenk: '#2b3036' }),
];

function schema() {
  return [
    { type: 'section', label: 'sec.words' },
    { type: 'text', key: 'w1', label: 'p.w1', max: EN_UZUN },
    { type: 'text', key: 'w2', label: 'p.w2', max: EN_UZUN },
    { type: 'toggle', key: 'buyuk', label: 'p.buyuk', hint: 'p.buyuk.h' },
    { type: 'section', label: 'sec.shape' },
    { type: 'range', key: 'size', label: 'p.size', min: 25, max: 120, step: 1, unit: 'mm' },
    { type: 'segmented', key: 'taban', label: 'p.taban', options: [['diag', 'tb.diag'], ['round', 'tb.round']] },
    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', options: COLORS },
    { type: 'swatch', key: 'tabanRenk', label: 'p.tabanRenk', options: COLORS },
    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.shape' },
    { type: 'range', key: 'tabanT', label: 'p.tabanT', min: 2, max: 10, step: 0.5, unit: 'mm' },
    { type: 'section', label: 'sec.view' },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

// Kelimeyi temizler: baştaki/sondaki boşluk, büyük harf (dile göre: i → İ), en çok EN_UZUN harf
const temiz = (w, s) => {
  const k = String(w ?? '').trim();
  return (s.buyuk ? k.toLocaleUpperCase(getLang() === 'tr' ? 'tr-TR' : 'en-GB') : k).slice(0, EN_UZUN);
};
function kelimeler(s) {
  return [temiz(s.w1, s) || KELIME.family[0], temiz(s.w2, s) || KELIME.family[1]];
}

function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (!String(s.w1 ?? '').trim() || !String(s.w2 ?? '').trim()) T('n.empty');
  if (String(s.w1 ?? '').trim().length > EN_UZUN || String(s.w2 ?? '').trim().length > EN_UZUN) T('n.long', { n: EN_UZUN });
  const [a, b] = kelimeler(s);
  if ([...a].length !== [...b].length) T('n.len');
  if (s.size < 40) T('n.thin');
  return notes;
}

function build(s) {
  const [a, b] = kelimeler(s);
  const L = flipLayout(yazi, a, b, s.size), t = s.tabanT;
  const uzun = (L.n - 1) * L.pitch * Math.SQRT2 + L.pitch * 1.6;
  const harfler = C.scope(() => {
    const p = [];
    for (let i = 0; i < L.n; i++) {
      const k = flipPiece(L, i);
      if (k) p.push(C.move(k, i * L.pitch - L.mid, i * L.pitch - L.mid, t));
    }
    return C.union(p);
  });
  const taban = C.scope(() => (s.taban === 'round'
    ? C.extrude(C.circle2(Math.max(uzun / 2, L.pitch * 0.9), 128), t)
    : C.rot(plate(uzun, L.pitch * 0.9, t, 3), 0, 0, 45)));
  return {
    parts: [{ result: taban, name: 'taban', color: s.tabanRenk }, { result: harfler, name: 'harfler', color: s.color }],
    info: [['info.front', a], ['info.side', b], ['info.letters', `${L.n} · ${mm(s.size)} mm`]],
  };
}

const ascii = (w) => w.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();
const fileName = (s) => { const [a, b] = kelimeler(s); return `oktos_flip_${ascii(a)}_${ascii(b)}`; };

export const TOOL = {
  id: 'flip', strings, defaults, presets, schema, build, fileName, enforce,
  init: async () => { yazi ||= await loadFont(700); },
};

export function start() {
  return createTool(TOOL);
}
