// Oda sahnesinin yer verisi: bölgeler (hangi araç, hangi şablon), ürünlerin yerleri ve kamera durakları.
// Gri kutu (core/oda-sahne.js) bu yerlere yer tutucu ve gerçek şablon koyar. Ortam Blender'dan gelince aynı adlı
// boş nesneler (Empty) bu yerlerin yerini alır; bölge kimlikleri ve sıra değişmez (docs/oda-sahnesi.md).
// Birim mm, Z yukarı. Arka duvarın iç yüzü y = 1800; kamera odanın içinden, −y tarafından bakar.
// Mobilyanın ölçü ve yeri core/oda-olcu.js'te (Blender pişirmesiyle ortak); burada ondan türetilir.
import { OLCU } from './oda-olcu.js';
const { PEDESTAL, FRIDGE, MONITOR } = OLCU;

// Bölgeler. Kaydırmalı tur ve telefondaki döngü bu sırayla gezer: çekmeceden başlar, masa ve duvarlar, kapı ve
// pencere, balkon, buzdolabı. preset: "Bu şablonla tasarla" ile açılacak şablon (yalnız atölyesi hazır araçlarda).
// 3B yapboz 2026-10-18'de rafa kalktı (kullanıcı kararı).
export const ZONES = [
  { id: 'cekmece', tool: 'bin', preset: 'drawer' },
  { id: 'anahtarlik', tool: 'magaza' }, // dolabın üstündeki tepsi: kart anahtarlık mağazada satılır (araç değil)
  { id: 'kalemlik', tool: 'bin', preset: 'pencup' },
  { id: 'kartvizit', tool: 'qr' }, // kalemliğin önünde masada kartvizit (QR aracının kartvizit şablonları)
  { id: 'klavye', tool: 'clicker' },
  { id: 'modem', tool: 'qr' },
  { id: 'cerceve', tool: 'painter' },
  { id: 'yapboz', tool: 'puzzle' },
  { id: 'tabela', tool: 'text' },
  { id: 'saksilar', tool: 'vase', preset: 'hex' },
  { id: 'balkonMasa', tool: 'qr' },
  { id: 'miknatis', tool: 'text' },
  { id: 'buzdolabi', tool: 'text' },
  { id: 'flip', tool: 'flip' },
];

// Ürün yerleri: [x, y, z(taban), dönüş z]
export const A = {
  pedestal: [PEDESTAL.x, PEDESTAL.y, 0, 0], // çekmeceli dolap (üst çekmece −y yönünde açılır)
  tepsi: [PEDESTAL.x + 5, PEDESTAL.y - 185, PEDESTAL.h, -0.18], // dolabın üstünde, lambanın önünde anahtar tepsisi
  pencup: [-1400, 1520, 740, 0],      // monitörün solunda (önceki yerde kalemler monitörün içine giriyordu)
  keyboard: [-930, 1330, 740, 0.02],
  monitor: [MONITOR.x, MONITOR.y, 740, 0], // klavyenin arkasında (pilotta gerçekçi monitör)
  kartvizit: [-1385, 1395, 740, -0.22], // kalemliğin önü, kameraya hafif dönük
  clickers: [-760, 1235, 743, -0.35], // anahtarlık clicker: klavyenin önünde, mousepad'in üstünde (tuş setiyle aynı tasarım)
  modem: [-1110, 1690, 1328, 0.05],   // alt rafın solu (raflar masanın sağ yarısında: sol üst duvar başlığa kalır)
  qrHolder: [-950, 1700, 1328, -0.1],
  frameA: [-1440, 1785, 1390, 0],     // arka duvar, monitörün sol üstü: Painter rölyefi (küçük çerçeve, raf ucunun solunda)
  frameB: [-2095, 920, 1050, 0],      // sol duvar, yatay çerçeve: resimli yapboz
  sign: [800, 1800, 2320, 0],         // balkon kapısının üstü (duvar yüzü, plakanın alt kenarı)
  sillL: [100, 1655, 850, 0],         // sol pencere kenarı (arkasında tül: saksı ona değmesin)
  sillR: [1500, 1655, 850, 0],        // sağ pencere kenarı
  planterL: [120, 3180, 0, 0],        // balkon: korkuluk önü
  planterR: [1720, 3120, 0, 0],
  table: [900, 2650, 0, 0],           // bistro masa (üstü 722)
  fridge: [FRIDGE.x, FRIDGE.y, 0, 0],  // sağ duvar, ön yüzü −x
};

// Kamera: giriş ve genel plan. Genel planda masa ile balkon kapısı görünür; sol ve sağ kenar bakışla açılır.
export const SHOTS = {
  intro: { pos: [600, -3000, 2250], target: [-300, 1500, 1100] },
  main: { pos: [0, -1850, 1600], target: [-400, 1650, 1000] },
  portrait: { pos: [-350, -1550, 1500], target: [-700, 1500, 1150] }, // telefon (dikey): odanın içinden
};
// Kenardan bakma sınırları (radyan, artı sola): solda dolap ve çerçeveler, sağda pencere ve buzdolabı
export const LOOK = { min: -0.52, max: 0.46, edge: 0.2, speed: 0.75 };

// Yakın planlar: her durağın kendi açısı (kaydırmalı turun durakları). Yatay ekranda motor kadrajı kartın tersine,
// dikey ekranda yukarı kaydırır. Çekmece açık hâliyle: içi çapraz yukarıdan, organizer ortada. w: yatayda sığması
// gereken genişlik (mm); telefonda kamera bu genişlik sığana kadar geri çekilir (story.js focusShot).
export const FOCUS = {
  cekmece: { pos: [-930, -220, 1900], target: [-1790, 860, 560] },  // tam açık çekmece (590 mm dışarıda)
  anahtarlik: { pos: [-1560, 900, 1130], target: [-1790, 1255, 745], w: 330 }, // tepsiye önden, yukarıdan
  kalemlik: { pos: [-950, 640, 1180], target: [-1290, 1500, 830] },   // masa üstü: kalemlik, monitörün solu
  kartvizit: { pos: [-1235, 1060, 960], target: [-1385, 1400, 775], w: 220 }, // yakından, çapraz yukarıdan
  klavye: { pos: [-785, 630, 1195], target: [-910, 1300, 760], w: 440 }, // klavyenin tamamı (Esc'ten oka) ve önündeki anahtarlık
  modem: { pos: [-1100, 860, 1530], target: [-1110, 1690, 1390], w: 360 }, // alt raf: modem ve üstündeki Wi-Fi standı
  tabela: { pos: [800, 560, 1650], target: [800, 1790, 2370], w: 700 }, // kapının üstündeki plaka (odanın içinden, aşağıdan)
  saksilar: { pos: [330, 480, 1260], target: [-20, 1650, 1080] },   // pervazdaki saksılar ve çiçekleri, arkada tül (sağdan: koltuk solda kalır)
  miknatis: { pos: [690, 610, 1100], target: [1530, 850, 650], w: 480 }, // kapalı kapağa karşıdan: mıknatıslar
  buzdolabi: { pos: [380, 260, 1020], target: [1660, 860, 300], w: 640 }, // ön yüzüne karşıdan: üst rafta pasta, iki raf dolu
  cerceve: { pos: [-1440, 1080, 1520], target: [-1440, 1785, 1515], w: 380 }, // monitörün sol üstündeki çerçeveye karşıdan
  yapboz: { pos: [-860, 900, 1320], target: [-2090, 920, 1300], w: 720 },
  flip: { pos: [1355, 592, 1041], target: [1825, 850, 880], w: 380 }, // heykele önden, alçaktan: ilk kelime okunur
  balkonMasa: { pos: [760, 1640, 1460], target: [900, 2620, 760] }, // odanın içinden, kapı boşluğundan masaya (kasaya çarpmaz)
};

export const LIGHTS = {
  center: [0, 1200, 900],
  key: [-1500, -2600, 3800],
  fill: [2400, -1200, 1500],
  rim: [600, 4400, 2800],
  shadowSpan: 3200,
  keyIntensity: 2.6,
};
