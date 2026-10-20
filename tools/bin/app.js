// Kutu, Bölmeli Tepsi ve Taban Plakası aracı: ayarlar, şablonlar, kurallar.
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scope } from '../../core/csg.js';
import { clamp } from '../../core/ui.js';
import { getLang } from '../../core/i18n.js';

const mm = (n) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });
import { customBin, gridBin, baseplate, GF } from './geometry.js';

const strings = {
  tr: {
    'bin.title': 'Kutu ve Organizer',
    'bin.lede': 'Çekmece, masa ve rafa ölçüyle organizer. Bir şablon seç, ölçünü gir, sipariş ver.',
    'mode.custom': 'Serbest kutu', 'mode.grid': 'Gridfinity kutu', 'mode.plate': 'Taban plakası',
    'sec.shape': 'Biçim', 'sec.size': 'Ölçü', 'sec.layout': 'Bölmeler', 'sec.walls': 'Duvar ve taban',
    'sec.features': 'Özellikler', 'sec.holes': 'Mıknatıs ve vida', 'sec.fit': 'Çekmeceye sığdır', 'sec.view': 'Görünüm',
    'p.shape': 'Biçim', 'shape.rect': 'Köşeli', 'shape.round': 'Yuvarlak',
    'p.w': 'Genişlik', 'p.d': 'Derinlik', 'p.h': 'Yükseklik', 'p.dia': 'Çap',
    'p.cols': 'Sütun', 'p.rows': 'Satır', 'p.sectors': 'Dilim', 'p.rings': 'Halka',
    'p.wall': 'Dış duvar', 'p.floor': 'Taban', 'p.div': 'Bölme duvarı', 'p.r': 'Köşe yarıçapı',
    'p.lip': 'İstiflenebilir', 'p.lip.h': 'Kutular üst üste oturur',
    'p.label': 'Etiket rafı', 'p.label.h': 'Her satırın arkasında eğik raf',
    'p.scoop': 'Ön kepçe', 'p.scoop.h': 'Küçük parçaları çıkarmak kolaylaşır',
    'p.holes': 'Taban delikleri', 'p.holes.h': 'Süzgeç / hafiflik',
    'p.gx': 'Genişlik (hücre)', 'p.gy': 'Derinlik (hücre)', 'p.gz': 'Yükseklik (7 mm birim)',
    'p.gfloor': 'Taban kalınlığı', 'p.lipStyle': 'İstif dudağı', 'lip.std': 'Standart', 'lip.none': 'Yok',
    'p.magnets': 'Mıknatıs yuvası', 'p.screws': 'Vida deliği', 'opt.none': 'Yok', 'opt.corner': 'Köşeler', 'opt.all': 'Hepsi',
    'p.showPlate': 'Plakayı göster', 'p.showPlate.h': 'Önizlemede altına taban plakası koyar',
    'p.px': 'Genişlik (hücre)', 'p.py': 'Derinlik (hücre)', 'p.plateStyle': 'Plaka tipi',
    'ps.thin': 'İnce çerçeve', 'ps.solid': 'Dolu', 'p.pfloor': 'Alt kalınlık',
    'p.fitW': 'Çekmece genişliği', 'p.fitD': 'Çekmece derinliği', 'p.fillPad': 'Boşluğu doldur', 'p.fillPad.h': 'Plaka çekmeceyi tam kaplar, ızgara ortalanır',
    'p.color': 'Renk', 'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri', 'u.cell': 'hücre', 'u.h7': '× 7 mm',
    'col.orange': 'Turuncu', 'col.sand': 'Kum', 'col.sage': 'Adaçayı', 'col.ink': 'Mürekkep', 'col.white': 'Beyaz', 'col.blue': 'Mavi', 'col.red': 'Kırmızı',
    'info.cells': 'Bölme', 'info.inner': 'Bölme içi', 'info.grid': 'Izgara',
    'n.lip': 'İstif için duvar en az 1.2 mm, taban en az 2.6 mm yapıldı.',
    'n.cols': 'Bölmeler 5 mm\'den dar olamaz; sütun/satır sayısı kıstırıldı.',
    'n.gcols': 'Bölmeler 8 mm\'den dar olamaz; sütun/satır sayısı kıstırıldı.',
    'n.shallow': '1 birim çok sığ; kutu neredeyse yalnızca ayaktan oluşur.',
    'n.magFloor': 'Mıknatıs yuvası için alt kalınlık en az 3 mm yapıldı.',
    'n.solid': 'Mıknatıs ve vida yalnızca dolu plakada olur; plaka dolu yapıldı.',
    'n.fit': 'Çekmeceye {x} × {y} hücre sığar.',
    'n.radius': 'Köşe yarıçapı kutu boyutuna göre küçültüldü.',
    'n.round': 'Yuvarlak kutuda istif, etiket rafı ve kepçe yok.',
    'pr.tray': 'Küçük tepsi', 'pr.desk': 'Masa düzenleyici', 'pr.screws': 'Vida ayırıcı', 'pr.drawer': 'Çekmece içi',
    'pr.pencup': 'Kalemlik', 'pr.pencup3': 'Bölmeli kalemlik', 'pr.roundtray': 'Yuvarlak tepsi', 'pr.tools': 'Alet kutusu', 'pr.cards': 'Kart kutusu',
    'pr.g1': '1×1 mıknatıslı', 'pr.g2': '2×1 etiketli', 'pr.g3': '2×2 yüksek', 'pr.g4': '3×2 bölmeli', 'pr.g5': 'Vida kutusu', 'pr.g6': '4×2 alçak tepsi',
    'pr.p1': '2×2 plaka', 'pr.p2': '4×4 plaka', 'pr.p3': '5×3 plaka', 'pr.p4': 'Mıknatıslı 3×3', 'pr.p5': 'Çekmece 25×20',
  },
  en: {
    'bin.title': 'Bins & Organizers',
    'bin.lede': 'Made-to-measure organizers for drawers, desks and shelves. Pick a preset, enter your size, place an order.',
    'mode.custom': 'Custom bin', 'mode.grid': 'Gridfinity bin', 'mode.plate': 'Baseplate',
    'sec.shape': 'Shape', 'sec.size': 'Size', 'sec.layout': 'Compartments', 'sec.walls': 'Walls & floor',
    'sec.features': 'Features', 'sec.holes': 'Magnets & screws', 'sec.fit': 'Fit to drawer', 'sec.view': 'View',
    'p.shape': 'Shape', 'shape.rect': 'Square', 'shape.round': 'Round',
    'p.w': 'Width', 'p.d': 'Depth', 'p.h': 'Height', 'p.dia': 'Diameter',
    'p.cols': 'Columns', 'p.rows': 'Rows', 'p.sectors': 'Sectors', 'p.rings': 'Rings',
    'p.wall': 'Outer wall', 'p.floor': 'Floor', 'p.div': 'Divider', 'p.r': 'Corner radius',
    'p.lip': 'Stackable', 'p.lip.h': 'Bins sit on top of each other',
    'p.label': 'Label shelf', 'p.label.h': 'Angled shelf at the back of each row',
    'p.scoop': 'Front scoop', 'p.scoop.h': 'Makes small parts easy to grab',
    'p.holes': 'Floor holes', 'p.holes.h': 'Drainage / lighter print',
    'p.gx': 'Width (cells)', 'p.gy': 'Depth (cells)', 'p.gz': 'Height (7 mm units)',
    'p.gfloor': 'Floor thickness', 'p.lipStyle': 'Stacking lip', 'lip.std': 'Standard', 'lip.none': 'None',
    'p.magnets': 'Magnet pockets', 'p.screws': 'Screw holes', 'opt.none': 'None', 'opt.corner': 'Corners', 'opt.all': 'All',
    'p.showPlate': 'Show baseplate', 'p.showPlate.h': 'Adds a baseplate under the preview',
    'p.px': 'Width (cells)', 'p.py': 'Depth (cells)', 'p.plateStyle': 'Plate type',
    'ps.thin': 'Thin frame', 'ps.solid': 'Solid', 'p.pfloor': 'Bottom thickness',
    'p.fitW': 'Drawer width', 'p.fitD': 'Drawer depth', 'p.fillPad': 'Fill the gap', 'p.fillPad.h': 'Plate covers the whole drawer, grid centred',
    'p.color': 'Colour', 'p.printer': 'Printer', 'p.edges': 'Edge lines', 'u.cell': 'cells', 'u.h7': '× 7 mm',
    'col.orange': 'Orange', 'col.sand': 'Sand', 'col.sage': 'Sage', 'col.ink': 'Ink', 'col.white': 'White', 'col.blue': 'Blue', 'col.red': 'Red',
    'info.cells': 'Compartments', 'info.inner': 'Inside', 'info.grid': 'Grid',
    'n.lip': 'Stacking needs a wall of at least 1.2 mm and a floor of at least 2.6 mm; raised.',
    'n.cols': 'Compartments can\'t be narrower than 5 mm; columns/rows were capped.',
    'n.gcols': 'Compartments can\'t be narrower than 8 mm; columns/rows were capped.',
    'n.shallow': '1 unit is very shallow; the bin is almost all foot.',
    'n.magFloor': 'Magnet pockets need a bottom of at least 3 mm; raised.',
    'n.solid': 'Magnets and screws need a solid plate; switched to solid.',
    'n.fit': '{x} × {y} cells fit in the drawer.',
    'n.radius': 'Corner radius reduced to fit the bin.',
    'n.round': 'Round bins have no stacking, label shelf or scoop.',
    'pr.tray': 'Small tray', 'pr.desk': 'Desk organizer', 'pr.screws': 'Screw sorter', 'pr.drawer': 'Drawer insert',
    'pr.pencup': 'Pen cup', 'pr.pencup3': 'Split pen cup', 'pr.roundtray': 'Round tray', 'pr.tools': 'Tool caddy', 'pr.cards': 'Card box',
    'pr.g1': '1×1 magnetic', 'pr.g2': '2×1 labelled', 'pr.g3': '2×2 tall', 'pr.g4': '3×2 split', 'pr.g5': 'Screw box', 'pr.g6': '4×2 low tray',
    'pr.p1': '2×2 plate', 'pr.p2': '4×4 plate', 'pr.p3': '5×3 plate', 'pr.p4': 'Magnetic 3×3', 'pr.p5': 'Drawer 25×20',
  },
};

const COLORS = [
  ['#d4621f', 'col.orange'], ['#c9b596', 'col.sand'], ['#8fa58a', 'col.sage'], ['#2b3036', 'col.ink'],
  ['#ece9e2', 'col.white'], ['#3f6fb0', 'col.blue'], ['#b8372f', 'col.red'],
];

const defaults = {
  mode: 'custom', color: '#d4621f', printer: 'p1s', edges: true,
  // serbest
  shape: 'rect', w: 100, d: 80, h: 30, cols: 3, rows: 2, wall: 1.6, floor: 1.6, div: 1.2, r: 4,
  lip: false, shelf: false, scoop: false, holes: false,
  // gridfinity
  gx: 2, gy: 1, gz: 3, gwall: 1.2, gfloor: 2.25, gdiv: 1.2, gcols: 1, grows: 1,
  lipStyle: 'std', magnets: 'none', screws: 'none', gshelf: true, gscoop: true, showPlate: true,
  // plaka
  px: 4, py: 4, plateStyle: 'thin', pfloor: 1, pmag: 'none', pscrew: 'none', fitW: 0, fitD: 0, fillPad: false,
};

const C = (mode, id, label, color, values) => ({ id, mode, label, color, values });
const presets = [
  C('custom', 'tray', 'pr.tray', '#d4621f', { shape: 'rect', w: 100, d: 80, h: 30, cols: 3, rows: 2, r: 4, wall: 1.6, floor: 1.6, lip: false, shelf: false, scoop: false, holes: false }),
  C('custom', 'desk', 'pr.desk', '#2b3036', { shape: 'rect', w: 220, d: 110, h: 60, cols: 4, rows: 1, r: 6, wall: 2, floor: 2, lip: false, shelf: false, scoop: false, holes: false }),
  C('custom', 'screws', 'pr.screws', '#3f6fb0', { shape: 'rect', w: 150, d: 150, h: 28, cols: 5, rows: 5, r: 3, wall: 1.6, floor: 2.6, lip: true, shelf: false, scoop: true, holes: false }),
  C('custom', 'drawer', 'pr.drawer', '#c9b596', { shape: 'rect', w: 250, d: 200, h: 40, cols: 4, rows: 3, r: 3, wall: 1.6, floor: 1.6, lip: false, shelf: false, scoop: false, holes: true }),
  C('custom', 'pencup', 'pr.pencup', '#8fa58a', { shape: 'round', w: 80, h: 100, cols: 1, rows: 1, wall: 2, floor: 2, holes: false }),
  C('custom', 'pencup3', 'pr.pencup3', '#b8372f', { shape: 'round', w: 100, h: 95, cols: 3, rows: 1, wall: 2, floor: 2, holes: false }),
  C('custom', 'roundtray', 'pr.roundtray', '#ece9e2', { shape: 'round', w: 160, h: 30, cols: 6, rows: 2, wall: 1.8, floor: 1.6, holes: false }),
  C('custom', 'tools', 'pr.tools', '#d4621f', { shape: 'rect', w: 220, d: 90, h: 70, cols: 3, rows: 1, r: 5, wall: 2, floor: 2, lip: false, shelf: true, scoop: false, holes: false }),
  C('custom', 'cards', 'pr.cards', '#2b3036', { shape: 'rect', w: 98, d: 74, h: 45, cols: 2, rows: 1, r: 3, wall: 1.6, floor: 1.6, lip: false, shelf: false, scoop: true, holes: false }),
  C('grid', 'g1', 'pr.g1', '#d4621f', { gx: 1, gy: 1, gz: 3, gcols: 1, grows: 1, lipStyle: 'std', magnets: 'all', screws: 'none', gshelf: false, gscoop: false, gfloor: 2.25 }),
  C('grid', 'g2', 'pr.g2', '#c9b596', { gx: 2, gy: 1, gz: 3, gcols: 1, grows: 1, lipStyle: 'std', magnets: 'none', screws: 'none', gshelf: true, gscoop: true, gfloor: 2.25 }),
  C('grid', 'g3', 'pr.g3', '#3f6fb0', { gx: 2, gy: 2, gz: 6, gcols: 1, grows: 1, lipStyle: 'std', magnets: 'none', screws: 'none', gshelf: false, gscoop: false, gfloor: 2.25 }),
  C('grid', 'g4', 'pr.g4', '#8fa58a', { gx: 3, gy: 2, gz: 3, gcols: 3, grows: 2, lipStyle: 'std', magnets: 'corner', screws: 'none', gshelf: false, gscoop: true, gfloor: 2.25 }),
  C('grid', 'g5', 'pr.g5', '#2b3036', { gx: 2, gy: 2, gz: 3, gcols: 3, grows: 3, lipStyle: 'std', magnets: 'all', screws: 'all', gshelf: false, gscoop: true, gfloor: 2.25 }),
  C('grid', 'g6', 'pr.g6', '#ece9e2', { gx: 4, gy: 2, gz: 2, gcols: 1, grows: 1, lipStyle: 'none', magnets: 'none', screws: 'none', gshelf: false, gscoop: false, gfloor: 1.25 }),
  C('plate', 'p1', 'pr.p1', '#2b3036', { px: 2, py: 2, plateStyle: 'thin', pfloor: 1, pmag: 'none', pscrew: 'none', fillPad: false }),
  C('plate', 'p2', 'pr.p2', '#d4621f', { px: 4, py: 4, plateStyle: 'thin', pfloor: 1, pmag: 'none', pscrew: 'none', fillPad: false }),
  C('plate', 'p3', 'pr.p3', '#c9b596', { px: 5, py: 3, plateStyle: 'thin', pfloor: 1, pmag: 'none', pscrew: 'none', fillPad: false }),
  C('plate', 'p4', 'pr.p4', '#3f6fb0', { px: 3, py: 3, plateStyle: 'solid', pfloor: 3, pmag: 'all', pscrew: 'none', fillPad: false }),
  C('plate', 'p5', 'pr.p5', '#8fa58a', { px: 5, py: 4, plateStyle: 'solid', pfloor: 2, pmag: 'none', pscrew: 'corner', fitW: 250, fitD: 200, fillPad: true }),
];

const isC = (s) => s.mode === 'custom';
const isRect = (s) => isC(s) && s.shape === 'rect';
const isRound = (s) => isC(s) && s.shape === 'round';
const isG = (s) => s.mode === 'grid';
const isP = (s) => s.mode === 'plate';

// Temel katman: müşterinin karar verdiği şeyler (biçim, ölçü, bölme, özellik, renk).
// "Atölye ayarları": duvar/taban kalınlıkları, yazıcı, görünüm (katlanır, kapalı başlar).
function schema() {
  return [
    { type: 'section', label: 'sec.shape', show: isC },
    { type: 'segmented', key: 'shape', label: 'p.shape', hideLabel: true, options: [['rect', 'shape.rect'], ['round', 'shape.round']], show: isC },

    { type: 'section', label: 'sec.size' },
    { type: 'range', key: 'w', label: 'p.w', min: 20, max: 400, step: 1, unit: 'mm', show: isRect },
    { type: 'range', key: 'w', label: 'p.dia', min: 20, max: 300, step: 1, unit: 'mm', show: isRound },
    { type: 'range', key: 'd', label: 'p.d', min: 20, max: 400, step: 1, unit: 'mm', show: isRect },
    { type: 'range', key: 'h', label: 'p.h', min: 5, max: 200, step: 1, unit: 'mm', show: isC },
    { type: 'range', key: 'gx', label: 'p.gx', min: 1, max: 8, step: 1, unit: 'u.cell', show: isG },
    { type: 'range', key: 'gy', label: 'p.gy', min: 1, max: 8, step: 1, unit: 'u.cell', show: isG },
    { type: 'range', key: 'gz', label: 'p.gz', min: 1, max: 14, step: 1, unit: 'u.h7', show: isG },
    { type: 'range', key: 'px', label: 'p.px', min: 1, max: 10, step: 1, unit: 'u.cell', show: isP },
    { type: 'range', key: 'py', label: 'p.py', min: 1, max: 10, step: 1, unit: 'u.cell', show: isP },
    { type: 'segmented', key: 'plateStyle', label: 'p.plateStyle', options: [['thin', 'ps.thin'], ['solid', 'ps.solid']], show: isP },

    { type: 'section', label: 'sec.fit', show: isP },
    { type: 'range', key: 'fitW', label: 'p.fitW', min: 0, max: 600, step: 1, unit: 'mm', show: isP },
    { type: 'range', key: 'fitD', label: 'p.fitD', min: 0, max: 600, step: 1, unit: 'mm', show: isP },
    { type: 'toggle', key: 'fillPad', label: 'p.fillPad', hint: 'p.fillPad.h', show: isP },

    { type: 'section', label: 'sec.layout', show: (s) => !isP(s) },
    { type: 'range', key: 'cols', label: 'p.cols', min: 1, max: 12, step: 1, show: isRect },
    { type: 'range', key: 'rows', label: 'p.rows', min: 1, max: 12, step: 1, show: isRect },
    { type: 'range', key: 'cols', label: 'p.sectors', min: 1, max: 12, step: 1, show: isRound },
    { type: 'range', key: 'rows', label: 'p.rings', min: 1, max: 4, step: 1, show: isRound },
    { type: 'range', key: 'gcols', label: 'p.cols', min: 1, max: 12, step: 1, show: isG },
    { type: 'range', key: 'grows', label: 'p.rows', min: 1, max: 12, step: 1, show: isG },

    { type: 'section', label: 'sec.features', show: (s) => !isP(s) },
    { type: 'toggle', key: 'lip', label: 'p.lip', hint: 'p.lip.h', show: isRect },
    { type: 'toggle', key: 'shelf', label: 'p.label', hint: 'p.label.h', show: isRect },
    { type: 'toggle', key: 'scoop', label: 'p.scoop', hint: 'p.scoop.h', show: isRect },
    { type: 'toggle', key: 'holes', label: 'p.holes', hint: 'p.holes.h', show: isC },
    { type: 'segmented', key: 'lipStyle', label: 'p.lipStyle', options: [['std', 'lip.std'], ['none', 'lip.none']], show: isG },
    { type: 'toggle', key: 'gshelf', label: 'p.label', hint: 'p.label.h', show: isG },
    { type: 'toggle', key: 'gscoop', label: 'p.scoop', hint: 'p.scoop.h', show: isG },

    { type: 'section', label: 'sec.holes', show: (s) => isG(s) || isP(s) },
    { type: 'segmented', key: 'magnets', label: 'p.magnets', options: [['none', 'opt.none'], ['corner', 'opt.corner'], ['all', 'opt.all']], show: isG },
    { type: 'segmented', key: 'screws', label: 'p.screws', options: [['none', 'opt.none'], ['corner', 'opt.corner'], ['all', 'opt.all']], show: isG },
    { type: 'segmented', key: 'pmag', label: 'p.magnets', options: [['none', 'opt.none'], ['corner', 'opt.corner'], ['all', 'opt.all']], show: isP },
    { type: 'segmented', key: 'pscrew', label: 'p.screws', options: [['none', 'opt.none'], ['corner', 'opt.corner'], ['all', 'opt.all']], show: isP },

    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', hideLabel: true, options: COLORS },

    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.walls' },
    { type: 'range', key: 'wall', label: 'p.wall', min: 0.8, max: 6, step: 0.1, unit: 'mm', show: isC },
    { type: 'range', key: 'floor', label: 'p.floor', min: 0.4, max: 6, step: 0.1, unit: 'mm', show: isC },
    { type: 'range', key: 'div', label: 'p.div', min: 0.8, max: 6, step: 0.1, unit: 'mm', show: isC },
    { type: 'range', key: 'r', label: 'p.r', min: 0, max: 20, step: 0.5, unit: 'mm', show: isRect },
    { type: 'range', key: 'gwall', label: 'p.wall', min: 0.8, max: 4, step: 0.1, unit: 'mm', show: isG },
    { type: 'range', key: 'gfloor', label: 'p.gfloor', min: 1, max: 8, step: 0.05, unit: 'mm', show: isG },
    { type: 'range', key: 'gdiv', label: 'p.div', min: 0.8, max: 4, step: 0.1, unit: 'mm', show: isG },
    { type: 'range', key: 'pfloor', label: 'p.pfloor', min: 1, max: 8, step: 0.1, unit: 'mm', show: (s) => isP(s) && s.plateStyle === 'solid' },
    { type: 'section', label: 'sec.view' },
    { type: 'toggle', key: 'showPlate', label: 'p.showPlate', hint: 'p.showPlate.h', show: isG },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

// Değerleri baskıya uygun aralığa çeker, kullanıcıya not döndürür.
let lastFit = '';
function enforce(s) {
  const notes = [];
  const T = (k, v) => notes.push({ k, v });
  if (s.mode === 'custom') {
    if (s.lip && s.shape === 'rect' && (s.wall < 1.2 || s.floor < 2.6)) { s.wall = Math.max(1.2, s.wall); s.floor = Math.max(2.6, s.floor); T('n.lip'); }
    if (s.shape === 'rect') {
      const maxC = Math.max(1, Math.floor((s.w - 2 * s.wall + s.div) / (5 + s.div)));
      const maxR = Math.max(1, Math.floor((s.d - 2 * s.wall + s.div) / (5 + s.div)));
      if (s.cols > maxC || s.rows > maxR) { s.cols = Math.min(s.cols, maxC); s.rows = Math.min(s.rows, maxR); T('n.cols'); }
      const rMax = Math.max(0, Math.min(20, Math.min(s.w, s.d) / 2 - 1));
      if (s.r > rMax) { s.r = rMax; T('n.radius'); }
    } else {
      s.rows = clamp(s.rows, 1, 4);
    }
    s.floor = Math.min(s.floor, s.h - 1);
  } else if (s.mode === 'grid') {
    const W = s.gx * GF.P - GF.GAP, D = s.gy * GF.P - GF.GAP;
    const maxC = Math.max(1, Math.floor((W - 2 * s.gwall + s.gdiv) / (8 + s.gdiv)));
    const maxR = Math.max(1, Math.floor((D - 2 * s.gwall + s.gdiv) / (8 + s.gdiv)));
    if (s.gcols > maxC || s.grows > maxR) { s.gcols = Math.min(s.gcols, maxC); s.grows = Math.min(s.grows, maxR); T('n.gcols'); }
    s.gfloor = clamp(s.gfloor, 1, Math.max(1, s.gz * GF.U - GF.FOOT_H - 1));
    if (s.gz === 1) T('n.shallow');
  } else {
    if ((s.pmag !== 'none' || s.pscrew !== 'none') && s.plateStyle !== 'solid') { s.plateStyle = 'solid'; T('n.solid'); }
    if (s.pmag !== 'none' && s.pfloor < 3) { s.pfloor = 3; T('n.magFloor'); }
    if (s.fitW >= 42 && s.fitD >= 42) {
      const fx = Math.floor(s.fitW / GF.P), fy = Math.floor(s.fitD / GF.P);
      const key = `${s.fitW}x${s.fitD}`;
      if (key !== lastFit) { s.px = clamp(fx, 1, 10); s.py = clamp(fy, 1, 10); lastFit = key; }
      T('n.fit', { x: fx, y: fy });
    }
  }
  return notes;
}

function build(s) {
  if (s.mode === 'plate') {
    const r = scope(() => baseplate(s));
    return { parts: [{ result: r, name: 'baseplate' }], info: [['info.grid', `${s.px} × ${s.py}`]] };
  }
  if (s.mode === 'grid') {
    const r = scope(() => gridBin(s));
    const parts = [{ result: r, name: 'bin' }];
    if (s.showPlate) parts.push({ result: scope(() => baseplate({ ...s, plateStyle: 'thin', fillPad: false }, s.gx, s.gy)), ghost: true });
    const W = s.gx * GF.P - GF.GAP, D = s.gy * GF.P - GF.GAP;
    const cw = (W - 2 * s.gwall - (s.gcols - 1) * s.gdiv) / s.gcols;
    const cd = (D - 2 * s.gwall - (s.grows - 1) * s.gdiv) / s.grows;
    return { parts, info: [['info.cells', `${s.gcols * s.grows}`], ['info.inner', `${mm(cw)} × ${mm(cd)} mm`]] };
  }
  const r = scope(() => customBin(s));
  const info = [['info.cells', `${s.shape === 'round' ? Math.max(1, s.cols) * s.rows : s.cols * s.rows}`]];
  if (s.shape === 'rect') {
    const cw = (s.w - 2 * s.wall - (s.cols - 1) * s.div) / s.cols;
    const cd = (s.d - 2 * s.wall - (s.rows - 1) * s.div) / s.rows;
    info.push(['info.inner', `${mm(cw)} × ${mm(cd)} mm`]);
  }
  return { parts: [{ result: r, name: 'bin' }], info };
}

function fileName(s) {
  if (s.mode === 'plate') return `oktos_plaka_${s.px}x${s.py}`;
  if (s.mode === 'grid') return `oktos_gridfinity_${s.gx}x${s.gy}x${s.gz}`;
  return s.shape === 'round' ? `oktos_yuvarlak_${s.w}x${s.h}` : `oktos_kutu_${s.w}x${s.d}x${s.h}`;
}

// Araç tanımı: atölye (createTool) ve oda sahnesinin ürün modelleri aynı tanımı kullanır.
export const TOOL = {
  id: 'bin', strings, defaults, presets, schema, build, fileName,
  modes: [['custom', 'mode.custom'], ['grid', 'mode.grid'], ['plate', 'mode.plate']],
  enforce,
};

export function start() {
  return createTool(TOOL);
}
