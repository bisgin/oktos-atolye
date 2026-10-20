// Puzzle aracı: fotoğraflı düz yapboz (çerçeveli tabla isteğe bağlı) ve 3B şekil yapboz (küre, küp, yumurta, kalp).
// Şablon kimlikleri odadaki ve hikâye sahnesindeki yapbozlarla aynı (picture, relief, sphere, cube, egg, heart).
// Fotoğraf yalnız önizlemededir (bağlantıyla taşınmaz); sipariş mesajı fotoğrafın ayrıca gönderileceğini yazar.
import * as THREE from 'three';
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scope } from '../../core/csg.js';
import { t, getLang } from '../../core/i18n.js';
import { parcalar } from './geometry.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });
const PALET = ['#d4621f', '#c9b596', '#8fa58a', '#3f6fb0', '#d49a9a', '#e6b33a', '#2b3036']; // renkli 3B parçalar sırayla

const strings = {
  tr: {
    'puzzle.title': 'Puzzle Maker',
    'puzzle.lede': 'Fotoğrafını ya da sevdiğin bir şekli yapboz parçalarına böl. Bir şablon seç, ayarla, sipariş ver.',
    'mode.duz': 'Fotoğraf yapboz', 'mode.sekil': '3B şekil yapboz',
    'sec.resim': 'Fotoğraf', 'sec.olcu': 'Ölçü ve parçalar', 'sec.sekil': 'Şekil ve parçalar', 'sec.print': 'Baskı', 'sec.view': 'Görünüm',
    'p.dosya': 'Kendi fotoğrafını seç', 'p.dosya.h': 'Önizleme içindir; siparişte fotoğrafı ayrıca gönderirsin.',
    'p.resim': 'Örnek resim', 'rs.cuce': 'Cüce savaşçı', 'rs.aile': 'Aile', 'rs.manzara': 'Manzara', 'rs.yok': 'Resimsiz',
    'p.genislik': 'Genişlik', 'p.oran': 'Oran', 'or.foto': 'Fotoğraf',
    'p.sutun': 'Sütun', 'p.satir': 'Satır', 'p.cerceve': 'Çerçeveli tabla', 'p.cerceve.h': 'Parçalar bir tablaya oturur, duvara asılır',
    'p.sekil': 'Şekil', 'sk.sphere': 'Küre', 'sk.cube': 'Küp', 'sk.egg': 'Yumurta', 'sk.heart': 'Kalp',
    'p.boy': 'Boyut', 'p.renkli': 'Renkli parçalar', 'p.renkli.h': 'Her parça başka renk (karıştırması zevkli)',
    'p.color': 'Parça rengi', 'p.cerceveRenk': 'Tabla rengi', 'p.kalinlik': 'Parça kalınlığı', 'p.bosluk': 'Parça arası boşluk',
    'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'col.orange': 'Turuncu', 'col.sand': 'Kum', 'col.sage': 'Adaçayı', 'col.ink': 'Mürekkep', 'col.white': 'Beyaz',
    'col.blue': 'Mavi', 'col.red': 'Kırmızı', 'col.yellow': 'Sarı', 'col.walnut': 'Ceviz', 'col.wood': 'Açık ahşap',
    'info.pieces': 'Parça', 'info.piece': 'Bir parça',
    'n.small': 'Parçalar {d} mm: küçük parçalar zor tutulur, en az 15 mm önerilir.',
    'n.foto': 'Yüklenen fotoğraf bağlantıyla taşınmaz; önizlemede örnek resim var, fotoğrafını yeniden seç.',
    'n.sekil': '3B şekilde parçalar desteğe ihtiyaç duyabilir; atölye baskı yönünü ayarlar.',
    'order.foto': 'Fotoğraf: {ad} (mesajla ayrıca göndereceğim)',
    'order.fotoOrnek': 'Fotoğraf: kendi fotoğrafımı mesajla göndereceğim',
    'order.cuce': 'Resim: örnek cüce savaşçı çizimi',
    'pr.picture': 'Cüce savaşçı', 'pr.relief': 'Manzara', 'pr.sphere': 'Küre', 'pr.cube': 'Küp', 'pr.egg': 'Yumurta', 'pr.heart': 'Kalp',
  },
  en: {
    'puzzle.title': 'Puzzle Maker',
    'puzzle.lede': 'Cut your photo or a favourite shape into jigsaw pieces. Pick a preset, adjust, order it.',
    'mode.duz': 'Photo puzzle', 'mode.sekil': '3D shape puzzle',
    'sec.resim': 'Photo', 'sec.olcu': 'Size and pieces', 'sec.sekil': 'Shape and pieces', 'sec.print': 'Print', 'sec.view': 'View',
    'p.dosya': 'Choose your photo', 'p.dosya.h': 'For the preview only; you send the photo with your order.',
    'p.resim': 'Example picture', 'rs.cuce': 'Dwarf warrior', 'rs.aile': 'Family', 'rs.manzara': 'Landscape', 'rs.yok': 'No picture',
    'p.genislik': 'Width', 'p.oran': 'Ratio', 'or.foto': 'Photo',
    'p.sutun': 'Columns', 'p.satir': 'Rows', 'p.cerceve': 'Framed tray', 'p.cerceve.h': 'Pieces sit in a tray that hangs on the wall',
    'p.sekil': 'Shape', 'sk.sphere': 'Sphere', 'sk.cube': 'Cube', 'sk.egg': 'Egg', 'sk.heart': 'Heart',
    'p.boy': 'Size', 'p.renkli': 'Coloured pieces', 'p.renkli.h': 'Every piece in another colour (fun to mix)',
    'p.color': 'Piece colour', 'p.cerceveRenk': 'Tray colour', 'p.kalinlik': 'Piece thickness', 'p.bosluk': 'Gap between pieces',
    'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'col.orange': 'Orange', 'col.sand': 'Sand', 'col.sage': 'Sage', 'col.ink': 'Ink', 'col.white': 'White',
    'col.blue': 'Blue', 'col.red': 'Red', 'col.yellow': 'Yellow', 'col.walnut': 'Walnut', 'col.wood': 'Light wood',
    'info.pieces': 'Pieces', 'info.piece': 'One piece',
    'n.small': 'Pieces are {d} mm: small pieces are fiddly, 15 mm or more is recommended.',
    'n.foto': 'An uploaded photo does not travel with the link; the preview shows an example, choose your photo again.',
    'n.sekil': '3D shape pieces may need supports; the workshop sets the print orientation.',
    'order.foto': 'Photo: {ad} (I will send it separately)',
    'order.fotoOrnek': 'Photo: I will send my own photo separately',
    'order.cuce': 'Picture: the example dwarf warrior drawing',
    'pr.picture': 'Dwarf warrior', 'pr.relief': 'Landscape', 'pr.sphere': 'Sphere', 'pr.cube': 'Cube', 'pr.egg': 'Egg', 'pr.heart': 'Heart',
  },
};

const COLORS = [
  ['#ece9e2', 'col.white'], ['#d4621f', 'col.orange'], ['#b8372f', 'col.red'], ['#e6b33a', 'col.yellow'], ['#8fa58a', 'col.sage'],
  ['#3f6fb0', 'col.blue'], ['#2b3036', 'col.ink'], ['#c9b596', 'col.sand'], ['#dcc2a2', 'col.wood'], ['#b38e64', 'col.walnut'],
];

// Resimler: örnekler init'te, yüklenen dosya seçilince (yalnız bu sekmede; bağlantıyla taşınmaz). Cüce savaşçı:
// CC0 çizim (Wikimedia Commons, LadyofHats; kayıt assets/oda/KAYNAKLAR.md), örnek resimle sipariş verilebilir
const RESIM = { cuce: null, aile: null, manzara: null, yukle: null };
const ORAN = { cuce: 1040 / 780, aile: 1040 / 780, manzara: 1.5, yukle: 4 / 3 };
function dokuYap(kaynak) {
  const tex = kaynak instanceof HTMLCanvasElement ? new THREE.CanvasTexture(kaynak) : new THREE.Texture(kaynak);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
// Gün batımında dağlar (hikâye sahnesindeki kabartma yapbozun resmi)
function manzaraResmi() {
  const cv = document.createElement('canvas');
  cv.width = 768;
  cv.height = 512;
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#9fc1d8'); sky.addColorStop(0.6, '#f4e3c3'); sky.addColorStop(1, '#e9b07a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(W * 0.72, H * 0.35, 50, 0, Math.PI * 2); g.fill();
  const ridge = (base, amp, f, col, ph) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, base - amp * (Math.sin(x * f + ph) * 0.6 + Math.sin(x * f * 2.3 + ph) * 0.4));
    g.lineTo(W, H); g.fill();
  };
  ridge(H * 0.62, 60, 0.008, '#c27d55', 1); ridge(H * 0.74, 50, 0.013, '#8c4f3a', 3); ridge(H * 0.88, 34, 0.02, '#3d3a46', 5);
  return cv;
}
// onload ile (decode() arka plandaki sekmede çizim beklerken takılıyordu); 8 sn'de gelmezse vazgeçilir
function resimYukle(src) {
  return new Promise((ok, hata) => {
    const im = new Image(), sure = setTimeout(() => hata(new Error('resim zaman aşımı')), 8000);
    im.onload = () => { clearTimeout(sure); ok(im); };
    im.onerror = () => { clearTimeout(sure); hata(new Error('resim yüklenemedi')); };
    im.src = src;
  });
}
// Yüklenen fotoğraf en çok 1600 px'e küçültülür (önizleme için yeter, bellek şişmez)
async function dosyaOku(file, s) {
  const url = URL.createObjectURL(file);
  try {
    const im = await resimYukle(url), k = Math.min(1, 1600 / Math.max(im.width, im.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(im.width * k);
    cv.height = Math.round(im.height * k);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    RESIM.yukle = dokuYap(cv);
    ORAN.yukle = cv.width / cv.height;
    s.resim = 'yukle';
    s.fotoAd = file.name.slice(0, 60);
    s.oran = 'foto';
  } finally {
    URL.revokeObjectURL(url);
  }
}

const defaults = {
  mode: 'duz', resim: 'cuce', fotoAd: '', genislik: 240, oran: 'foto', yukseklik: 180, sutun: 4, satir: 3, cerceve: true,
  kalinlik: 4, bosluk: 0.4, sekil: 'sphere', boy: 90, renkli: true,
  color: '#ece9e2', cerceveRenk: '#b38e64', printer: 'p1s', edges: false,
};

// Kabuk şablonun color'ını ana renge yazar: values.color ile aynı
const P = (mode, id, values) => ({ id, mode, label: 'pr.' + id, color: values.color, values });
const presets = [
  P('duz', 'picture', { resim: 'cuce', genislik: 240, oran: 'foto', sutun: 4, satir: 3, cerceve: true, color: '#ece9e2', cerceveRenk: '#b38e64' }),
  P('duz', 'relief', { resim: 'manzara', genislik: 240, oran: 'foto', sutun: 4, satir: 3, cerceve: false, color: '#ece9e2' }),
  // 3B şekiller dolu basılır (ağırlık ve fiyat buna göre): varsayılan boylar masa üstü ölçüsünde
  P('sekil', 'sphere', { sekil: 'sphere', boy: 90, sutun: 3, satir: 3, renkli: true, color: '#d4621f' }),
  P('sekil', 'cube', { sekil: 'cube', boy: 64, sutun: 2, satir: 2, renkli: true, color: '#3f6fb0' }),
  P('sekil', 'egg', { sekil: 'egg', boy: 72, sutun: 3, satir: 3, renkli: true, color: '#e6b33a' }),
  P('sekil', 'heart', { sekil: 'heart', boy: 100, sutun: 3, satir: 3, renkli: true, color: '#b8372f' }),
];

const isDuz = (s) => s.mode === 'duz';
const isSekil = (s) => s.mode === 'sekil';

function schema() {
  return [
    { type: 'section', label: 'sec.resim', show: isDuz },
    { type: 'file', key: 'resim', label: 'p.dosya', hint: 'p.dosya.h', onFile: dosyaOku, show: isDuz },
    { type: 'segmented', key: 'resim', label: 'p.resim', options: [['cuce', 'rs.cuce'], ['aile', 'rs.aile'], ['manzara', 'rs.manzara'], ['yok', 'rs.yok']], show: isDuz },

    { type: 'section', label: 'sec.olcu', show: isDuz },
    { type: 'range', key: 'genislik', label: 'p.genislik', min: 80, max: 400, step: 5, unit: 'mm', show: isDuz },
    { type: 'segmented', key: 'oran', label: 'p.oran', options: [['foto', 'or.foto'], ['4:3', '4:3'], ['3:2', '3:2'], ['1:1', '1:1'], ['3:4', '3:4']], show: isDuz },
    { type: 'range', key: 'sutun', label: 'p.sutun', min: 2, max: 12, step: 1, show: isDuz },
    { type: 'range', key: 'satir', label: 'p.satir', min: 2, max: 12, step: 1, show: isDuz },
    { type: 'toggle', key: 'cerceve', label: 'p.cerceve', hint: 'p.cerceve.h', show: isDuz },

    { type: 'section', label: 'sec.sekil', show: isSekil },
    { type: 'segmented', key: 'sekil', label: 'p.sekil', options: [['sphere', 'sk.sphere'], ['cube', 'sk.cube'], ['egg', 'sk.egg'], ['heart', 'sk.heart']], show: isSekil },
    { type: 'range', key: 'boy', label: 'p.boy', min: 50, max: 200, step: 1, unit: 'mm', show: isSekil },
    { type: 'range', key: 'sutun', label: 'p.sutun', min: 2, max: 6, step: 1, show: isSekil },
    { type: 'range', key: 'satir', label: 'p.satir', min: 2, max: 6, step: 1, show: isSekil },
    { type: 'toggle', key: 'renkli', label: 'p.renkli', hint: 'p.renkli.h', show: isSekil },

    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', options: COLORS },
    { type: 'swatch', key: 'cerceveRenk', label: 'p.cerceveRenk', options: COLORS, show: (s) => isDuz(s) && s.cerceve },

    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.print' },
    { type: 'range', key: 'kalinlik', label: 'p.kalinlik', min: 3, max: 8, step: 0.5, unit: 'mm', show: isDuz },
    { type: 'range', key: 'bosluk', label: 'p.bosluk', min: 0.1, max: 0.8, step: 0.05, unit: 'mm' },
    { type: 'section', label: 'sec.view' },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (s.mode !== 'sekil') s.mode = 'duz';
  if (isDuz(s)) {
    if (s.resim === 'yukle' && !RESIM.yukle) { s.resim = 'cuce'; T('n.foto'); }
    const oran = s.oran === 'foto' ? (ORAN[s.resim] ?? 4 / 3) : ({ '4:3': 4 / 3, '3:2': 1.5, '1:1': 1, '3:4': 0.75 }[s.oran] ?? 4 / 3);
    s.yukseklik = Math.round(s.genislik / oran);
    const d = Math.min(s.genislik / s.sutun, s.yukseklik / s.satir);
    if (d < 15) T('n.small', { d: mm(d) });
  } else {
    const d = (s.boy + 2) / Math.min(s.sutun, s.satir);
    if (d < 15) T('n.small', { d: mm(d) });
    if (s.sekil !== 'cube' && s.sekil !== 'heart') T('n.sekil');
  }
  return notes;
}

function build(s) {
  const { liste, bilgi } = parcalar(s);
  const map = isDuz(s) && s.resim !== 'yok' ? RESIM[s.resim] ?? null : null, uvBox = [-bilgi.W / 2, -bilgi.H / 2, bilgi.W, bilgi.H];
  const parts = [];
  for (const p of liste) {
    const result = scope(p.fn);
    if (result.empty) continue; // şeklin dışında kalan köşe hücre
    const renk = p.renk === 'cerceve' ? s.cerceveRenk : isSekil(s) && s.renkli ? PALET[p.k % PALET.length] : s.color;
    parts.push({ result, name: p.ad, color: renk, ...(map && p.renk === 'parca' ? { map, uvBox } : {}) });
  }
  const n = parts.filter((p) => p.name.startsWith('parca')).length;
  const parca = isDuz(s) ? `${mm(s.genislik / s.sutun)} × ${mm(s.yukseklik / s.satir)} mm` : `${s.sutun} × ${s.satir}`;
  return { parts, info: [['info.pieces', `${n}`], ['info.piece', parca]] };
}

const fileName = (s) => `oktos_yapboz_${s.mode === 'duz' ? 'foto' : s.sekil}_${s.sutun}x${s.satir}`;
const orderLines = (s) => (isDuz(s) && s.resim !== 'yok'
  ? [s.resim === 'yukle' ? t('order.foto', { ad: s.fotoAd }) : s.resim === 'cuce' ? t('order.cuce') : t('order.fotoOrnek')] : []);

export const TOOL = {
  id: 'puzzle', strings, defaults, presets, schema, build, fileName, enforce, orderLines,
  modes: [['duz', 'mode.duz'], ['sekil', 'mode.sekil']],
  async init() {
    RESIM.manzara ||= dokuYap(manzaraResmi());
    // Örnek resimler gelmezse araç yine açılır (resimsiz önizleme)
    const yukle = async (ad, dosya) => {
      try { RESIM[ad] ||= dokuYap(await resimYukle(new URL(`../../assets/oda/${dosya}`, import.meta.url).href)); } catch (e) { console.warn(e); }
    };
    await Promise.all([yukle('cuce', 'yapboz-cuce.webp'), yukle('aile', 'yapboz-aile.webp')]);
  },
};

export function start() {
  return createTool(TOOL);
}
