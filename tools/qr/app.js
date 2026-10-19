// 3D QR aracı: Wi-Fi standı, menü standı, kartvizit, anahtarlık, bardak altlığı. Ayarlar, şablonlar, kurallar.
// Şablon kimlikleri odadaki şablonlarla aynı (core/oda-urunler.js: modem ve balkon masası), oda ?sablon= ile açar.
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scope } from '../../core/csg.js';
import { clamp } from '../../core/ui.js';
import { getLang } from '../../core/i18n.js';
import { hazirla, parcalar, matris, hucre } from './geometry.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });

const strings = {
  tr: {
    'qr.title': '3D QR Kod',
    'qr.lede': 'Wi-Fi şifresi, menü ya da sayfan tek bir karoda. Bir şablon seç, içeriğini yaz, sipariş ver.',
    'mode.stand': 'Masa standı', 'mode.card': 'Kartvizit', 'mode.key': 'Anahtarlık', 'mode.coaster': 'Bardak altlığı',
    'sec.content': 'İçerik', 'sec.shape': 'Biçim ve ölçü', 'sec.print': 'Baskı', 'sec.view': 'Görünüm',
    'p.icerik': 'İçerik türü', 'ic.url': 'Bağlantı', 'ic.wifi': 'Wi-Fi', 'ic.text': 'Metin',
    'p.url': 'Bağlantı (adres)', 'p.ssid': 'Ağ adı', 'p.sifre': 'Şifre', 'p.metin': 'Metin',
    'p.guvenlik': 'Güvenlik', 'gv.wpa': 'WPA/WPA2', 'gv.wep': 'WEP', 'gv.yok': 'Şifresiz',
    'p.gizli': 'Gizli ağ', 'p.gizli.h': 'Ağ adı yayınlanmıyorsa',
    'p.shape': 'Biçim', 'sh.square': 'Kare', 'sh.round': 'Yuvarlak',
    'p.size': 'Kod boyu', 'p.cap': 'Altlık çapı', 'p.baslik': 'Yazı',
    'p.icKaro': 'Ayrı zemin', 'p.icKaro.h': 'Kod, gövdeden farklı renk bir karonun üstünde',
    'p.standli': 'Ayaklı', 'p.standli.h': 'Kart eğik bir kaideye oturur',
    'p.color': 'Kod rengi', 'p.zemin': 'Zemin rengi', 'p.govde': 'Gövde rengi',
    'p.ecc': 'Hata düzeltme', 'p.modH': 'Kod kabartması', 'p.tileT': 'Karo kalınlığı', 'p.r': 'Köşe yarıçapı',
    'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'col.orange': 'Turuncu', 'col.sand': 'Kum', 'col.sage': 'Adaçayı', 'col.ink': 'Mürekkep', 'col.white': 'Beyaz',
    'col.blue': 'Mavi', 'col.red': 'Kırmızı', 'col.yellow': 'Sarı', 'col.cream': 'Krem', 'col.wood': 'Açık ahşap',
    'col.walnut': 'Ceviz', 'col.dark': 'Koyu', 'col.rust': 'Kiremit',
    'info.modules': 'Kare sayısı', 'info.cell': 'Bir kare', 'info.content': 'İçerik',
    'n.small': 'Kareler {c} mm: telefon okumakta zorlanabilir. Kodu büyüt ya da içeriği kısalt.',
    'n.contrast': 'Kod ile zemin renkleri birbirine yakın; telefon okuyamayabilir.',
    'n.dark': 'Açık kod koyu zeminde: bazı telefonlar ters renkli kodu okumaz.',
    'n.empty': 'İçerik boş; örnek adres kullanıldı.',
    'pr.wifi': 'Wi-Fi standı', 'pr.wifiTuruncu': 'Misafir Wi-Fi', 'pr.menu': 'Menü standı', 'pr.card': 'Kartvizit',
    'pr.cardKoyu': 'Koyu kartvizit', 'pr.key': 'QR anahtarlık', 'pr.keyRound': 'Yuvarlak anahtarlık', 'pr.coaster': 'Bardak altlığı',
  },
  en: {
    'qr.title': '3D QR Code',
    'qr.lede': 'Wi-Fi password, menu or your page on one tile. Pick a preset, type the content, order it.',
    'mode.stand': 'Desk stand', 'mode.card': 'Business card', 'mode.key': 'Keychain', 'mode.coaster': 'Coaster',
    'sec.content': 'Content', 'sec.shape': 'Shape and size', 'sec.print': 'Print', 'sec.view': 'View',
    'p.icerik': 'Content type', 'ic.url': 'Link', 'ic.wifi': 'Wi-Fi', 'ic.text': 'Text',
    'p.url': 'Link (address)', 'p.ssid': 'Network name', 'p.sifre': 'Password', 'p.metin': 'Text',
    'p.guvenlik': 'Security', 'gv.wpa': 'WPA/WPA2', 'gv.wep': 'WEP', 'gv.yok': 'Open',
    'p.gizli': 'Hidden network', 'p.gizli.h': 'If the network name is not broadcast',
    'p.shape': 'Shape', 'sh.square': 'Square', 'sh.round': 'Round',
    'p.size': 'Code size', 'p.cap': 'Coaster diameter', 'p.baslik': 'Label',
    'p.icKaro': 'Separate background', 'p.icKaro.h': 'The code sits on a tile in another colour',
    'p.standli': 'With stand', 'p.standli.h': 'The card sits in an angled base',
    'p.color': 'Code colour', 'p.zemin': 'Background colour', 'p.govde': 'Body colour',
    'p.ecc': 'Error correction', 'p.modH': 'Code relief', 'p.tileT': 'Tile thickness', 'p.r': 'Corner radius',
    'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'col.orange': 'Orange', 'col.sand': 'Sand', 'col.sage': 'Sage', 'col.ink': 'Ink', 'col.white': 'White',
    'col.blue': 'Blue', 'col.red': 'Red', 'col.yellow': 'Yellow', 'col.cream': 'Cream', 'col.wood': 'Light wood',
    'col.walnut': 'Walnut', 'col.dark': 'Dark', 'col.rust': 'Rust',
    'info.modules': 'Modules', 'info.cell': 'One module', 'info.content': 'Content',
    'n.small': 'Modules are {c} mm: phones may struggle. Make the code bigger or the content shorter.',
    'n.contrast': 'Code and background colours are too close; phones may not read it.',
    'n.dark': 'Light code on a dark background: some phones cannot read inverted codes.',
    'n.empty': 'Content is empty; an example address is used.',
    'pr.wifi': 'Wi-Fi stand', 'pr.wifiTuruncu': 'Guest Wi-Fi', 'pr.menu': 'Menu stand', 'pr.card': 'Business card',
    'pr.cardKoyu': 'Dark business card', 'pr.key': 'QR keychain', 'pr.keyRound': 'Round keychain', 'pr.coaster': 'Coaster',
  },
};

const COLORS = [
  ['#2b3036', 'col.ink'], ['#26292e', 'col.dark'], ['#94400f', 'col.rust'], ['#d4621f', 'col.orange'], ['#b8372f', 'col.red'], ['#3f6fb0', 'col.blue'],
  ['#8fa58a', 'col.sage'], ['#e6b33a', 'col.yellow'], ['#c9b596', 'col.sand'], ['#dcc2a2', 'col.wood'], ['#b38e64', 'col.walnut'],
  ['#f4f2ec', 'col.cream'], ['#ece9e2', 'col.white'],
];

const defaults = {
  mode: 'stand', icerik: 'wifi', url: 'https://oktosworkshop.com', ssid: 'Oktos Misafir', sifre: 'ornek-sifre',
  guvenlik: 'WPA', gizli: false, metin: 'Bulan lütfen arasın', ecc: 'M',
  size: 70, cap: 92, shape: 'square', baslik: 'Wi-Fi', icKaro: false, standli: true,
  tileT: 2.4, modH: 1.2, r: 4,
  color: '#2b3036', zemin: '#f4f2ec', govde: '#dcc2a2', printer: 'p1s', edges: false,
};

// Kabuk şablonun color'ını durumun ana rengine yazar: burada ana renk kod rengidir (values.color ile aynı olmalı)
const P = (mode, id, label, values) => ({ id, mode, label, color: values.color, values });
const presets = [
  P('stand', 'wifi', 'pr.wifi', { icerik: 'wifi', size: 70, baslik: 'Wi-Fi', color: '#2b3036', zemin: '#f4f2ec', govde: '#dcc2a2' }),
  P('stand', 'wifi_turuncu', 'pr.wifiTuruncu', { icerik: 'wifi', size: 70, baslik: 'Misafir', color: '#94400f', zemin: '#f4f2ec', govde: '#2b3036' }),
  P('stand', 'menu', 'pr.menu', { icerik: 'url', size: 74, baslik: 'Menü', color: '#94400f', zemin: '#f4f2ec', govde: '#2b3036' }),
  P('card', 'card', 'pr.card', { icerik: 'url', size: 40, icKaro: false, standli: true, baslik: 'Oktos Workshop', color: '#2b3036', govde: '#f4f2ec' }),
  P('card', 'card_koyu', 'pr.cardKoyu', { icerik: 'url', size: 40, icKaro: true, standli: true, baslik: 'Oktos Workshop', color: '#2b3036', zemin: '#f4f2ec', govde: '#26292e' }),
  P('key', 'key', 'pr.key', { icerik: 'url', size: 40, shape: 'square', icKaro: false, color: '#2b3036', govde: '#e6b33a' }),
  P('key', 'key_yuvarlak', 'pr.keyRound', { icerik: 'url', size: 38, shape: 'round', icKaro: true, color: '#2b3036', zemin: '#f4f2ec', govde: '#8fa58a' }),
  P('coaster', 'coaster', 'pr.coaster', { icerik: 'url', size: 54, cap: 92, color: '#2b3036', zemin: '#f4f2ec', govde: '#b38e64' }),
];

const BOY = { stand: [40, 120], card: [30, 46], key: [24, 50] }; // kod boyu aralığı (mm); altlıkta çapa göre
const boyMax = (s) => (s.mode === 'coaster' ? Math.floor(s.cap * 0.62) : BOY[s.mode][1]);
const boyMin = (s) => (s.mode === 'coaster' ? 36 : BOY[s.mode][0]);
const isWifi = (s) => s.icerik === 'wifi';
const ayriZemin = (s) => s.mode === 'stand' || s.mode === 'coaster' || s.icKaro;

function schema() {
  return [
    { type: 'section', label: 'sec.content' },
    { type: 'segmented', key: 'icerik', label: 'p.icerik', hideLabel: true, options: [['url', 'ic.url'], ['wifi', 'ic.wifi'], ['text', 'ic.text']] },
    { type: 'text', key: 'url', label: 'p.url', max: 300, show: (s) => s.icerik === 'url' },
    { type: 'text', key: 'ssid', label: 'p.ssid', max: 32, show: isWifi },
    { type: 'segmented', key: 'guvenlik', label: 'p.guvenlik', options: [['WPA', 'gv.wpa'], ['WEP', 'gv.wep'], ['nopass', 'gv.yok']], show: isWifi },
    { type: 'text', key: 'sifre', label: 'p.sifre', max: 63, show: (s) => isWifi(s) && s.guvenlik !== 'nopass' },
    { type: 'toggle', key: 'gizli', label: 'p.gizli', hint: 'p.gizli.h', show: isWifi },
    { type: 'text', key: 'metin', label: 'p.metin', max: 300, show: (s) => s.icerik === 'text' },

    { type: 'section', label: 'sec.shape' },
    { type: 'segmented', key: 'shape', label: 'p.shape', options: [['square', 'sh.square'], ['round', 'sh.round']], show: (s) => s.mode === 'key' },
    { type: 'range', key: 'size', label: 'p.size', min: boyMin, max: boyMax, step: 1, unit: 'mm' },
    { type: 'range', key: 'cap', label: 'p.cap', min: 70, max: 120, step: 1, unit: 'mm', show: (s) => s.mode === 'coaster' },
    { type: 'text', key: 'baslik', label: 'p.baslik', max: 24, show: (s) => s.mode === 'stand' || s.mode === 'card' },
    { type: 'toggle', key: 'icKaro', label: 'p.icKaro', hint: 'p.icKaro.h', show: (s) => s.mode === 'card' || s.mode === 'key' },
    { type: 'toggle', key: 'standli', label: 'p.standli', hint: 'p.standli.h', show: (s) => s.mode === 'card' },

    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', options: COLORS },
    { type: 'swatch', key: 'zemin', label: 'p.zemin', options: COLORS, show: ayriZemin },
    { type: 'swatch', key: 'govde', label: 'p.govde', options: COLORS },

    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.print' },
    { type: 'segmented', key: 'ecc', label: 'p.ecc', options: [['L', 'L'], ['M', 'M'], ['Q', 'Q'], ['H', 'H']] },
    { type: 'range', key: 'modH', label: 'p.modH', min: 0.4, max: 3, step: 0.1, unit: 'mm' },
    { type: 'range', key: 'tileT', label: 'p.tileT', min: 1.6, max: 5, step: 0.1, unit: 'mm' },
    { type: 'range', key: 'r', label: 'p.r', min: 0, max: 10, step: 0.5, unit: 'mm', show: (s) => s.mode === 'stand' || (s.mode === 'key' && s.shape === 'square') },
    { type: 'section', label: 'sec.view' },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

// Göreli parlaklık (WCAG): kod ile zemin arasındaki karşıtlığı ölçmek için
function parlaklik(hex) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (!BOY[s.mode] && s.mode !== 'coaster') s.mode = 'stand';
  s.size = clamp(s.size, boyMin(s), boyMax(s));
  if (s.icerik === 'url' && !s.url.trim()) T('n.empty');
  const c = hucre(s, s.size);
  if (c < 1.2) T('n.small', { c: mm(c) });
  const zemin = ayriZemin(s) ? s.zemin : s.govde, a = parlaklik(s.color), b = parlaklik(zemin);
  const oran = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  if (oran < 4) T('n.contrast'); // telefon parlaklığa bakar: turuncu (#d4621f) kremde ~3,3, sınırda kalıyordu
  else if (a > b) T('n.dark');
  return notes;
}

function build(s) {
  const renk = { color: s.color, zemin: s.zemin, govde: s.govde };
  const parts = parcalar(s).map((p) => ({ result: scope(p.fn), name: p.ad, color: renk[p.renk] }));
  const n = matris(s).n;
  return { parts, info: [['info.modules', `${n} × ${n}`], ['info.cell', `${mm(hucre(s, s.size))} mm`]] };
}

const fileName = (s) => `oktos_qr_${s.mode}_${s.size}`;

export const TOOL = {
  id: 'qr', strings, defaults, presets, schema, build, fileName, enforce, init: hazirla,
  modes: [['stand', 'mode.stand'], ['card', 'mode.card'], ['key', 'mode.key'], ['coaster', 'mode.coaster']],
};

export function start() {
  return createTool(TOOL);
}
