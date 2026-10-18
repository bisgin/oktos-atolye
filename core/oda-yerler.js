// Oda sahnesinin yer verisi: bölgeler (hangi araç, hangi şablon), ürünlerin yerleri ve kamera durakları.
// Gri kutu (core/oda-sahne.js) bu yerlere yer tutucu ve gerçek şablon koyar. Ortam Blender'dan gelince aynı adlı
// boş nesneler (Empty) bu yerlerin yerini alır; bölge kimlikleri ve sıra değişmez (docs/oda-sahnesi.md).
// Birim mm, Z yukarı. Arka duvarın iç yüzü y = 1800; kamera odanın içinden, −y tarafından bakar.
// Mobilyanın ölçü ve yeri core/oda-olcu.js'te (Blender pişirmesiyle ortak); burada ondan türetilir.
import { OLCU } from './oda-olcu.js';
const { PEDESTAL, FRIDGE, MONITOR } = OLCU;

// Bölgeler. Telefondaki döngü bu sırayla gezer: çekmeceden başlar, odayı dolaşır, çerçevelerden çekmeceye döner.
// preset: "Bu şablonla tasarla" ile açılacak şablon (yalnız atölyesi hazır araçlarda).
export const ZONES = [
  { id: 'cekmece', tool: 'bin', preset: 'drawer' },
  { id: 'kalemlik', tool: 'bin', preset: 'pencup' },
  { id: 'klavye', tool: 'clicker' },
  { id: 'modem', tool: 'qr' },
  { id: 'puzzle3d', tool: 'puzzle' },
  { id: 'tabela', tool: 'text' },
  { id: 'saksilar', tool: 'vase', preset: 'hex' },
  { id: 'balkonMasa', tool: 'qr' },
  { id: 'buzdolabi', tool: 'text' },
  { id: 'flip', tool: 'flip' },
  { id: 'cerceve', tool: 'painter' },
  { id: 'yapboz', tool: 'puzzle' },
];

// Ürün yerleri: [x, y, z(taban), dönüş z]
export const A = {
  pedestal: [PEDESTAL.x, PEDESTAL.y, 0, 0], // çekmeceli dolap (üst çekmece −y yönünde açılır)
  pencup: [-1180, 1600, 740, 0],      // lambadan uzakta: yakın planda lambanın kolu kalemliği örtmesin
  tray: [-1400, 1560, 740, 0],        // yuvarlak tepsi: içinde yapboz parçaları
  keyboard: [-930, 1330, 740, 0.02],
  monitor: [MONITOR.x, MONITOR.y, 740, 0], // klavyenin arkasında (pilotta gerçekçi monitör)
  clickers: [-470, 1340, 740, -0.2],  // klavyenin ve farenin sağında anahtarlık fidget'lar
  modem: [-1110, 1690, 1328, 0.05],   // alt rafın solu (raflar masanın sağ yarısında: sol üst duvar başlığa kalır)
  qrHolder: [-950, 1700, 1328, -0.1],
  puzzle3d: [-420, 1690, 1328, 0],    // alt rafın sağı
  frameA: [-1440, 1785, 1390, 0],     // arka duvar, monitörün sol üstü: Painter rölyefi (küçük çerçeve, raf ucunun solunda)
  frameB: [-2095, 920, 1050, 0],      // sol duvar, yatay çerçeve: resimli yapboz
  sign: [800, 1800, 2320, 0],         // balkon kapısının üstü (duvar yüzü, plakanın alt kenarı)
  sillL: [100, 1690, 850, 0],         // sol pencere kenarı
  sillR: [1500, 1690, 850, 0],        // sağ pencere kenarı
  planterL: [120, 3180, 0, 0],        // balkon: korkuluk önü
  planterR: [1720, 3120, 0, 0],
  table: [900, 2650, 0, 0],           // bistro masa (üstü 722)
  fridge: [FRIDGE.x, FRIDGE.y, 0, 0],  // sağ duvar, ön yüzü −x
};

// Kamera: giriş ve genel plan. Genel planda masa ile balkon kapısı görünür; sol ve sağ kenar bakışla açılır.
export const SHOTS = {
  intro: { pos: [600, -3000, 2250], target: [-300, 1500, 1100] },
  main: { pos: [0, -1850, 1600], target: [-400, 1650, 1000] },
};
// Kenardan bakma sınırları (radyan, artı sola): solda dolap ve çerçeveler, sağda pencere ve buzdolabı
export const LOOK = { min: -0.52, max: 0.46, edge: 0.2, speed: 0.75 };

// Kendi açısını isteyen yakın planlar (geri kalanı genel planın yönünden hesaplanır)
export const FOCUS = {
  saksilar: { pos: [-180, 760, 1330], target: [30, 1690, 960] },    // sol pencere kenarı: değişen saksı ortada
  buzdolabi: { pos: [380, 260, 1020], target: [1660, 860, 300] },   // ön yüzüne karşıdan; ortada alt raftaki pasta
  cerceve: { pos: [-1440, 1080, 1520], target: [-1440, 1785, 1515] }, // monitörün sol üstündeki çerçeveye karşıdan
  yapboz: { pos: [-1000, 920, 1330], target: [-2090, 920, 1310] },
  flip: { pos: [1355, 592, 1041], target: [1825, 850, 880] },      // heykele önden, alçaktan: ilk kelime okunur
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
