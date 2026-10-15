// Vazo Üreteci: ayarlar, şablonlar, kurallar.
import { createTool, PRINTERS } from '../../core/tool-shell.js';
import { scope, fromMesh } from '../../core/csg.js';
import { vaseMesh, resolution, SIDES_CIRCLE } from './geometry.js';

const strings = {
  tr: {
    'vase.title': 'Vazo Üreteci',
    'vase.lede': 'Köşe sayısını, siluetini ve dokusunu seç. Her efekti istediğin yükseklik aralığına uygula.',
    'sec.body': 'Gövde', 'sec.silhouette': 'Siluet', 'sec.section': 'Kesit', 'sec.twist': 'Burgu', 'sec.ribs': 'Kaburga',
    'sec.wave': 'Dalga', 'sec.noise': 'Organik', 'sec.rim': 'Ağız', 'sec.view': 'Görünüm',
    'p.height': 'Yükseklik', 'p.dBottom': 'Alt çap', 'p.dTop': 'Üst çap', 'p.style': 'Model',
    'st.hollow': 'İçi boş', 'st.solid': 'Vazo modu (dolu)', 'p.wall': 'Duvar', 'p.base': 'Taban',
    'p.profile': 'Siluet', 'p.intensity': 'Yoğunluk', 'p.waveCycles': 'Dalga sayısı',
    'pf.straight': 'Düz', 'pf.bulge': 'Şişkin', 'pf.belly': 'Alçak göbek', 'pf.neck': 'Boyunlu', 'pf.hourglass': 'Kum saati',
    'pf.amphora': 'Amfora', 'pf.bottle': 'Şişe', 'pf.tulip': 'Lale', 'pf.bowl': 'Kase', 'pf.wave': 'Dalgalı',
    'p.kind': 'Kesit biçimi', 'k.poly': 'Köşeli', 'k.ellipse': 'Elips', 'k.squircle': 'Yumuşak kare', 'k.star': 'Yıldız',
    'k.flower': 'Çiçek', 'k.plus': 'Artı', 'k.gear': 'Dişli',
    'p.sides': 'Köşe sayısı', 'p.points': 'Kol sayısı', 'p.petals': 'Yaprak sayısı', 'p.teeth': 'Diş sayısı',
    'p.round': 'Köşe yuvarlatma', 'p.depth': 'Derinlik', 'p.aspect': 'En / boy oranı', 'p.arm': 'Kol kalınlığı', 'p.rotate': 'Döndür',
    'p.blendTop': 'Üstte farklı kesit', 'p.blendTop.h': 'Alttaki kesit yukarı doğru buna dönüşür',
    'p.topKind': 'Üst kesit', 'p.topSides': 'Üst köşe sayısı',
    'p.on': 'Açık', 'p.twistOn': 'Burgu ekle', 'p.ribsOn': 'Kaburga ekle', 'p.waveOn': 'Dalga ekle', 'p.noiseOn': 'Organik doku ekle', 'sec.model': 'Model', 'p.twist': 'Toplam açı', 'p.from': 'Başlangıç', 'p.to': 'Bitiş', 'p.fade': 'Yumuşak geçiş',
    'p.ribCount': 'Kaburga sayısı', 'p.ribDepth': 'Derinlik', 'p.ribStyle': 'Profil', 'rs.v': 'Keskin', 'rs.round': 'Yuvarlak', 'rs.flat': 'Düz',
    'p.ribHelix': 'Sarmal tur',
    'p.waveAmp': 'Genlik', 'p.waveN': 'Dalga sayısı',
    'p.noiseAmp': 'Miktar', 'p.noiseScale': 'Ölçek', 'p.noiseSeed': 'Tohum',
    'p.flare': 'Ağız açılması', 'p.flareZone': 'Ağız bölgesi', 'p.ruffleN': 'Fırfır sayısı', 'p.ruffleDepth': 'Fırfır derinliği',
    'p.quality': 'Ağ çözünürlüğü', 'q.draft': 'Taslak', 'q.normal': 'Normal', 'q.fine': 'İnce',
    'p.color': 'Renk', 'p.printer': 'Yazıcı', 'p.edges': 'Kenar çizgileri',
    'col.terra': 'Terrakota', 'col.sand': 'Kum', 'col.sage': 'Adaçayı', 'col.ink': 'Siyah', 'col.white': 'Beyaz', 'col.blue': 'Gece mavisi', 'col.gold': 'Altın', 'col.rose': 'Gül',
    'info.res': 'Çözünürlük',
    'n.vasemode': 'Vazo modu: dilimleyicide "spiral vazo" seçeneğini aç, duvarı nozul belirler.',
    'n.open': 'Taban 0: altı açık saksı ya da kılıf.',
    'n.dia': 'Duvar, en dar yarıçaptan kalın olamaz; duvar inceltildi.',
    'n.band': 'Bitiş, başlangıçtan büyük olmalı; bitiş kaydırıldı.',
    'n.overhang': 'Ağız açılması dik bir çıkıntı yaratıyor; 45°\'den sert açılar destek isteyebilir.',
    'pr.twist': 'Burgulu kule', 'pr.tall': 'Uzun burgu 50 cm', 'pr.ribbed': 'Kaburgalı şişe', 'pr.star': 'Yıldız vazo',
    'pr.hex': 'Altıgen saksı', 'pr.silk': 'İpek dalga', 'pr.amphora': 'Amfora', 'pr.tulip': 'Lale', 'pr.square': 'Kare minimal',
    'pr.flower': 'Çiçek kase', 'pr.organic': 'Organik', 'pr.morph': 'Üçgenden çembere',
  },
  en: {
    'vase.title': 'Vase Generator',
    'vase.lede': 'Pick the side count, silhouette and texture. Apply each effect to the height range you choose.',
    'sec.body': 'Body', 'sec.silhouette': 'Silhouette', 'sec.section': 'Cross-section', 'sec.twist': 'Twist', 'sec.ribs': 'Ribs',
    'sec.wave': 'Waves', 'sec.noise': 'Organic', 'sec.rim': 'Rim', 'sec.view': 'View',
    'p.height': 'Height', 'p.dBottom': 'Bottom diameter', 'p.dTop': 'Top diameter', 'p.style': 'Model',
    'st.hollow': 'Hollow', 'st.solid': 'Vase mode (solid)', 'p.wall': 'Wall', 'p.base': 'Base',
    'p.profile': 'Silhouette', 'p.intensity': 'Intensity', 'p.waveCycles': 'Wave cycles',
    'pf.straight': 'Straight', 'pf.bulge': 'Bulge', 'pf.belly': 'Low belly', 'pf.neck': 'Necked', 'pf.hourglass': 'Hourglass',
    'pf.amphora': 'Amphora', 'pf.bottle': 'Bottle', 'pf.tulip': 'Tulip', 'pf.bowl': 'Bowl', 'pf.wave': 'Wavy',
    'p.kind': 'Section shape', 'k.poly': 'Polygon', 'k.ellipse': 'Ellipse', 'k.squircle': 'Squircle', 'k.star': 'Star',
    'k.flower': 'Flower', 'k.plus': 'Cross', 'k.gear': 'Gear',
    'p.sides': 'Side count', 'p.points': 'Points', 'p.petals': 'Petals', 'p.teeth': 'Teeth',
    'p.round': 'Corner rounding', 'p.depth': 'Depth', 'p.aspect': 'Aspect ratio', 'p.arm': 'Arm width', 'p.rotate': 'Rotate',
    'p.blendTop': 'Different top section', 'p.blendTop.h': 'The bottom section morphs into this one',
    'p.topKind': 'Top section', 'p.topSides': 'Top side count',
    'p.on': 'On', 'p.twistOn': 'Add twist', 'p.ribsOn': 'Add ribs', 'p.waveOn': 'Add waves', 'p.noiseOn': 'Add organic texture', 'sec.model': 'Model', 'p.twist': 'Total angle', 'p.from': 'Start', 'p.to': 'End', 'p.fade': 'Soft blend',
    'p.ribCount': 'Rib count', 'p.ribDepth': 'Depth', 'p.ribStyle': 'Profile', 'rs.v': 'Sharp', 'rs.round': 'Round', 'rs.flat': 'Flat',
    'p.ribHelix': 'Helix turns',
    'p.waveAmp': 'Amplitude', 'p.waveN': 'Wave count',
    'p.noiseAmp': 'Amount', 'p.noiseScale': 'Scale', 'p.noiseSeed': 'Seed',
    'p.flare': 'Rim flare', 'p.flareZone': 'Rim zone', 'p.ruffleN': 'Ruffle count', 'p.ruffleDepth': 'Ruffle depth',
    'p.quality': 'Mesh resolution', 'q.draft': 'Draft', 'q.normal': 'Normal', 'q.fine': 'Fine',
    'p.color': 'Colour', 'p.printer': 'Printer', 'p.edges': 'Edge lines',
    'col.terra': 'Terracotta', 'col.sand': 'Sand', 'col.sage': 'Sage', 'col.ink': 'Black', 'col.white': 'White', 'col.blue': 'Night blue', 'col.gold': 'Gold', 'col.rose': 'Rose',
    'info.res': 'Resolution',
    'n.vasemode': 'Vase mode: turn on "spiral vase" in your slicer; the nozzle sets the wall.',
    'n.open': 'Base 0: open-bottom planter or sleeve.',
    'n.dia': 'The wall can\'t be thicker than the narrowest radius; it was thinned.',
    'n.band': 'End must be above start; end was moved.',
    'n.overhang': 'The rim flare makes a steep overhang; angles past 45° may need support.',
    'pr.twist': 'Twisted tower', 'pr.tall': 'Tall twist 50 cm', 'pr.ribbed': 'Ribbed bottle', 'pr.star': 'Star vase',
    'pr.hex': 'Hex planter', 'pr.silk': 'Silk wave', 'pr.amphora': 'Amphora', 'pr.tulip': 'Tulip', 'pr.square': 'Square minimal',
    'pr.flower': 'Flower bowl', 'pr.organic': 'Organic', 'pr.morph': 'Triangle to circle',
  },
};

const COLORS = [
  ['#b8613f', 'col.terra'], ['#c9b596', 'col.sand'], ['#8fa58a', 'col.sage'], ['#24272b', 'col.ink'],
  ['#ece9e2', 'col.white'], ['#2c3e66', 'col.blue'], ['#c49a3c', 'col.gold'], ['#d49a9a', 'col.rose'],
];

const defaults = {
  color: '#b8613f', printer: 'p1s', edges: false, quality: 'normal',
  height: 180, dBottom: 76, dTop: 84, style: 'hollow', wall: 2, base: 3,
  profile: 'bulge', intensity: 0.2, waveCycles: 2,
  kind: 'poly', sides: 6, round: 0.15, depth: 0.25, aspect: 0.7, rotate: 0,
  blendTop: false, topKind: 'poly', topSides: SIDES_CIRCLE,
  twistOn: true, twist: 75, twS: 0, twE: 100,
  ribsOn: false, ribCount: 24, ribDepth: 2, ribStyle: 'v', ribHelix: 0, ribS: 5, ribE: 100, ribF: 3,
  waveOn: false, waveAmp: 1.5, waveN: 8, wvS: 0, wvE: 100, wvF: 5,
  noiseOn: false, noiseAmp: 2, noiseScale: 3, noiseSeed: 7, nzS: 0, nzE: 100, nzF: 10,
  flare: 0, flareZone: 15, ruffleN: 0, ruffleDepth: 6,
};

// Şablon: değerleri varsayılanların üstüne yazar; burada yazılmayan efektler kapalı sayılır.
const OFF = { twistOn: false, ribsOn: false, waveOn: false, noiseOn: false, blendTop: false, flare: 0, ruffleN: 0, round: 0, rotate: 0 };
const P = (id, label, color, v) => ({ id, label, color, values: { ...OFF, ...v } });
const presets = [
  P('twist', 'pr.twist', '#24272b', { height: 200, dBottom: 70, dTop: 70, style: 'hollow', profile: 'straight', intensity: 0, kind: 'poly', sides: 6, round: 0.15, twistOn: true, twist: 180, twS: 0, twE: 100 }),
  P('tall', 'pr.tall', '#c9b596', { height: 500, dBottom: 120, dTop: 110, style: 'hollow', profile: 'belly', intensity: 0.18, kind: 'star', sides: 8, depth: 0.18, round: 0.2, twistOn: true, twist: 240, twS: 33, twE: 100 }),
  P('ribbed', 'pr.ribbed', '#8fa58a', { height: 210, dBottom: 80, dTop: 34, style: 'hollow', profile: 'bottle', intensity: 0.3, kind: 'poly', sides: SIDES_CIRCLE, ribsOn: true, ribCount: 36, ribDepth: 2.2, ribStyle: 'round', ribHelix: 0, ribS: 4, ribE: 70, ribF: 6 }),
  P('star', 'pr.star', '#2c3e66', { height: 170, dBottom: 90, dTop: 100, style: 'solid', profile: 'bulge', intensity: 0.12, kind: 'star', sides: 5, depth: 0.32, round: 0.1, twistOn: true, twist: 72, twS: 0, twE: 100 }),
  P('hex', 'pr.hex', '#b8613f', { height: 120, dBottom: 110, dTop: 140, style: 'hollow', base: 3, profile: 'straight', intensity: 0, kind: 'poly', sides: 6, round: 0.25 }),
  P('silk', 'pr.silk', '#d49a9a', { height: 190, dBottom: 70, dTop: 90, style: 'solid', profile: 'neck', intensity: 0.25, kind: 'flower', sides: 7, depth: 0.12, waveOn: true, waveAmp: 1.4, waveN: 14, wvS: 10, wvE: 90, wvF: 15, twistOn: true, twist: 60, twS: 0, twE: 100 }),
  P('amphora', 'pr.amphora', '#c49a3c', { height: 230, dBottom: 60, dTop: 64, style: 'hollow', profile: 'amphora', intensity: 0.55, kind: 'poly', sides: SIDES_CIRCLE, flare: 6, flareZone: 10 }),
  P('tulip', 'pr.tulip', '#ece9e2', { height: 180, dBottom: 56, dTop: 70, style: 'solid', profile: 'tulip', intensity: 0.4, kind: 'flower', sides: 5, depth: 0.2, ruffleN: 5, ruffleDepth: 5, flareZone: 18 }),
  P('square', 'pr.square', '#24272b', { height: 160, dBottom: 80, dTop: 80, style: 'hollow', profile: 'straight', intensity: 0, kind: 'squircle', aspect: 1 }),
  P('flower', 'pr.flower', '#d49a9a', { height: 90, dBottom: 90, dTop: 170, style: 'hollow', profile: 'bowl', intensity: 0.12, kind: 'flower', sides: 8, depth: 0.16, twistOn: true, twist: 45, twS: 20, twE: 100 }),
  P('organic', 'pr.organic', '#8fa58a', { height: 200, dBottom: 80, dTop: 70, style: 'solid', profile: 'belly', intensity: 0.25, kind: 'poly', sides: SIDES_CIRCLE, noiseOn: true, noiseAmp: 4, noiseScale: 2.5, noiseSeed: 11, nzS: 0, nzE: 100, nzF: 10 }),
  P('morph', 'pr.morph', '#2c3e66', { height: 200, dBottom: 90, dTop: 80, style: 'hollow', profile: 'straight', intensity: 0, kind: 'poly', sides: 3, round: 0.2, blendTop: true, topKind: 'poly', topSides: SIDES_CIRCLE, twistOn: true, twist: 60, twS: 0, twE: 100 }),
];

const sidesFmt = (v) => (v >= SIDES_CIRCLE ? '∞' : String(v));
const countLabel = (s) => ({ star: 'p.points', flower: 'p.petals', gear: 'p.teeth' }[s.kind] || 'p.sides');
const usesCount = (k) => ['poly', 'star', 'flower', 'gear'].includes(k);
const KINDS = [['poly', 'k.poly'], ['ellipse', 'k.ellipse'], ['squircle', 'k.squircle'], ['star', 'k.star'], ['flower', 'k.flower'], ['plus', 'k.plus'], ['gear', 'k.gear']];

// Bir efektin yükseklik bandı: başlangıç %, bitiş %, yumuşak geçiş %.
const bandItems = (on, s0, e0, f0) => [
  { type: 'range', key: s0, label: 'p.from', min: 0, max: 95, step: 1, unit: '%', show: (s) => s[on] },
  { type: 'range', key: e0, label: 'p.to', min: 5, max: 100, step: 1, unit: '%', show: (s) => s[on] },
  ...(f0 ? [{ type: 'range', key: f0, label: 'p.fade', min: 0, max: 30, step: 1, unit: '%', show: (s) => s[on] }] : []),
];

function schema() {
  return [
    { type: 'section', label: 'sec.body' },
    { type: 'range', key: 'height', label: 'p.height', min: 20, max: 500, step: 1, unit: 'mm' },
    { type: 'range', key: 'dBottom', label: 'p.dBottom', min: 10, max: 300, step: 1, unit: 'mm' },
    { type: 'range', key: 'dTop', label: 'p.dTop', min: 10, max: 300, step: 1, unit: 'mm' },

    { type: 'section', label: 'sec.section' },
    { type: 'select', key: 'kind', label: 'p.kind', options: KINDS },
    { type: 'range', key: 'sides', label: 'p.sides', min: 3, max: SIDES_CIRCLE, step: 1, fmt: sidesFmt, show: (s) => s.kind === 'poly' },
    { type: 'range', key: 'sides', label: 'p.points', min: 3, max: 24, step: 1, show: (s) => s.kind === 'star' },
    { type: 'range', key: 'sides', label: 'p.petals', min: 3, max: 24, step: 1, show: (s) => s.kind === 'flower' },
    { type: 'range', key: 'sides', label: 'p.teeth', min: 6, max: 60, step: 1, show: (s) => s.kind === 'gear' },
    // Çember (∞) seçilince satır gizlenmez, pasifleşir: sürüklerken düzen zıplamasın.
    { type: 'range', key: 'round', label: 'p.round', min: 0, max: 1, step: 0.05, show: (s) => ['poly', 'star', 'gear'].includes(s.kind), disabled: (s) => s.kind === 'poly' && s.sides >= SIDES_CIRCLE },
    { type: 'range', key: 'depth', label: 'p.depth', min: 0.02, max: 0.6, step: 0.01, show: (s) => ['star', 'flower', 'gear'].includes(s.kind) },
    { type: 'range', key: 'aspect', label: 'p.aspect', min: 0.3, max: 1, step: 0.01, show: (s) => s.kind === 'ellipse' || s.kind === 'squircle' },
    { type: 'range', key: 'aspect', label: 'p.arm', min: 0.15, max: 0.6, step: 0.01, show: (s) => s.kind === 'plus' },
    { type: 'range', key: 'rotate', label: 'p.rotate', min: 0, max: 180, step: 1, unit: '°' },
    { type: 'toggle', key: 'blendTop', label: 'p.blendTop', hint: 'p.blendTop.h' },
    { type: 'select', key: 'topKind', label: 'p.topKind', options: KINDS, show: (s) => s.blendTop },
    { type: 'range', key: 'topSides', label: 'p.topSides', min: 3, max: SIDES_CIRCLE, step: 1, fmt: sidesFmt, show: (s) => s.blendTop && usesCount(s.topKind) },

    { type: 'section', label: 'sec.silhouette' },
    { type: 'select', key: 'profile', label: 'p.profile', options: ['straight', 'bulge', 'belly', 'neck', 'hourglass', 'amphora', 'bottle', 'tulip', 'bowl', 'wave'].map((k) => [k, 'pf.' + k]) },
    { type: 'range', key: 'intensity', label: 'p.intensity', min: 0, max: 0.8, step: 0.01, show: (s) => s.profile !== 'straight' },
    { type: 'range', key: 'waveCycles', label: 'p.waveCycles', min: 1, max: 8, step: 1, show: (s) => s.profile === 'wave' },

    { type: 'section', label: 'sec.twist' },
    { type: 'toggle', key: 'twistOn', label: 'p.twistOn' },
    { type: 'range', key: 'twist', label: 'p.twist', min: -720, max: 720, step: 5, unit: '°', show: (s) => s.twistOn },
    ...bandItems('twistOn', 'twS', 'twE'),

    { type: 'section', label: 'sec.ribs' },
    { type: 'toggle', key: 'ribsOn', label: 'p.ribsOn' },
    { type: 'range', key: 'ribCount', label: 'p.ribCount', min: 2, max: 120, step: 1, show: (s) => s.ribsOn },
    { type: 'range', key: 'ribDepth', label: 'p.ribDepth', min: 0.2, max: 8, step: 0.1, unit: 'mm', show: (s) => s.ribsOn },
    { type: 'segmented', key: 'ribStyle', label: 'p.ribStyle', options: [['v', 'rs.v'], ['round', 'rs.round'], ['flat', 'rs.flat']], show: (s) => s.ribsOn },
    { type: 'range', key: 'ribHelix', label: 'p.ribHelix', min: -3, max: 3, step: 0.05, show: (s) => s.ribsOn },
    ...bandItems('ribsOn', 'ribS', 'ribE', 'ribF'),

    { type: 'section', label: 'sec.wave' },
    { type: 'toggle', key: 'waveOn', label: 'p.waveOn' },
    { type: 'range', key: 'waveAmp', label: 'p.waveAmp', min: 0.2, max: 8, step: 0.1, unit: 'mm', show: (s) => s.waveOn },
    { type: 'range', key: 'waveN', label: 'p.waveN', min: 1, max: 40, step: 1, show: (s) => s.waveOn },
    ...bandItems('waveOn', 'wvS', 'wvE', 'wvF'),

    { type: 'section', label: 'sec.noise' },
    { type: 'toggle', key: 'noiseOn', label: 'p.noiseOn' },
    { type: 'range', key: 'noiseAmp', label: 'p.noiseAmp', min: 0.2, max: 12, step: 0.1, unit: 'mm', show: (s) => s.noiseOn },
    { type: 'range', key: 'noiseScale', label: 'p.noiseScale', min: 0.5, max: 8, step: 0.1, show: (s) => s.noiseOn },
    { type: 'range', key: 'noiseSeed', label: 'p.noiseSeed', min: 1, max: 99, step: 1, show: (s) => s.noiseOn },
    ...bandItems('noiseOn', 'nzS', 'nzE', 'nzF'),

    { type: 'section', label: 'sec.rim' },
    { type: 'range', key: 'flare', label: 'p.flare', min: -15, max: 30, step: 0.5, unit: 'mm' },
    { type: 'range', key: 'flareZone', label: 'p.flareZone', min: 5, max: 40, step: 1, unit: '%' },
    { type: 'range', key: 'ruffleN', label: 'p.ruffleN', min: 0, max: 12, step: 1 },
    { type: 'range', key: 'ruffleDepth', label: 'p.ruffleDepth', min: 0, max: 30, step: 0.5, unit: 'mm', show: (s) => s.ruffleN > 0 },

    { type: 'section', label: 'common.colorSw' },
    { type: 'swatch', key: 'color', label: 'p.color', hideLabel: true, options: COLORS },

    { type: 'advanced', label: 'common.advanced' },
    { type: 'section', label: 'sec.model' },
    { type: 'segmented', key: 'style', label: 'p.style', options: [['hollow', 'st.hollow'], ['solid', 'st.solid']] },
    { type: 'range', key: 'wall', label: 'p.wall', min: 0.8, max: 6, step: 0.1, unit: 'mm', show: (s) => s.style === 'hollow' },
    { type: 'range', key: 'base', label: 'p.base', min: 0, max: 8, step: 0.5, unit: 'mm', show: (s) => s.style === 'hollow' },
    { type: 'section', label: 'sec.view' },
    { type: 'segmented', key: 'quality', label: 'p.quality', options: [['draft', 'q.draft'], ['normal', 'q.normal'], ['fine', 'q.fine']] },
    { type: 'select', key: 'printer', label: 'p.printer', options: PRINTERS.map(([id, name]) => [id, name]) },
    { type: 'toggle', key: 'edges', label: 'p.edges' },
  ];
}

function enforce(s) {
  const notes = [];
  const N = (k) => notes.push({ k });
  for (const [a, b] of [['twS', 'twE'], ['ribS', 'ribE'], ['wvS', 'wvE'], ['nzS', 'nzE']]) {
    if (s[b] <= s[a]) { s[b] = Math.min(100, s[a] + 5); if (!s._thumb) N('n.band'); }
  }
  if (s.kind === 'gear' && s.sides < 6) s.sides = 6;
  if ((s.kind === 'star' || s.kind === 'flower') && s.sides > 24) s.sides = 24;
  const minR = Math.min(s.dBottom, s.dTop) / 2;
  if (s.style === 'hollow' && s.wall > minR / 2) { s.wall = Math.max(0.8, Math.floor((minR / 2) * 10) / 10); N('n.dia'); }
  if (s.style === 'solid') N('n.vasemode');
  else if (s.base === 0) N('n.open');
  const zoneH = (s.height * s.flareZone) / 100;
  if (Math.abs(s.flare) > zoneH * 0.9) N('n.overhang');
  return notes;
}

function build(s) {
  const m = vaseMesh(s);
  const r = scope(() => fromMesh(m.positions, m.indices));
  const res = resolution(s);
  return { parts: [{ result: r, name: 'vase', smooth: true }], info: [['info.res', `${res.nT} × ${res.nZ}`]] };
}

const fileName = (s) => `oktos_vazo_${s.kind}${s.kind === 'poly' ? (s.sides >= SIDES_CIRCLE ? 'cember' : s.sides) : ''}_${s.height}mm`;

// Araç tanımı: atölye (createTool) ve hikâye sahnesi (scene.js) aynı tanımı kullanır.
export const TOOL = { id: 'vase', strings, defaults, presets, schema, build, fileName, enforce };

export function start() {
  return createTool(TOOL);
}
