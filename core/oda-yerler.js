// Oda sahnesinin yer verisi: ürün yuvaları, sahne yerleri (eşyaların konumu) ve kamera durakları.
// core/oda-sahne.js bu yerlere dekoru ve ürünleri koyar. Birim mm, Z yukarı. Arka duvarın iç yüzü y = 1800; kamera
// odanın içinden, −y tarafından bakar. Mobilyanın ölçü ve yeri core/oda-olcu.js'te (Blender pişirmesiyle ortak).
import { OLCU } from './oda-olcu.js';
import { YUVALAR } from './urun-veri.js';
const { PEDESTAL, FRIDGE, MONITOR } = OLCU;

// Ürün yuvaları (2026-11-01, docs/sayfa-haritasi.md "Oda durakları: karar"): orta kat yalnız satılan ürünleri gösterir,
// araç durağı yok. Sıra ve ürün sayısı ürün verisinden (core/urun-veri.js ← scripts/urun-veri.py); kaydırmalı tur, şerit
// ve telefondaki döngü bu sırayla gezer. yer: yuvanın sahnedeki yeri (eski durak kimliği): çapa nesnesi orada durur.
// urun: yuvadaki ürün sayısı; 0 olan yuva gizli (işaretçi, kart, seçici ve tur durağı yok). oda: false olan yuva da
// odada gizli, ürünleri /urunler/'de görünür (2026-11-04'ten beri hiçbiri; raf açıldı).
// Eski 14 duraktan yuvası olmayan yedisi (kartvizit, klavye, tabela, balkonMasa, miknatis, buzdolabi, flip) sahnede
// tıklanmaz dekor olarak kalır.
export const ZONES = YUVALAR.map(({ id, eski, urun, oda }) => ({ id, yer: eski, urun, oda: oda !== false }));
// Etkileşimsiz yuvalar (2026-11-03 kullanıcı kararı, senaryo biggie-sunum.md: sunulmayan hiçbir şeyle etkileşim yok):
// katana yuvası kalktı (işaretçi, kart, tur durağı yok); sol duvardaki rölyef çerçeve dekor olarak kaldı
export const ETKILESIMSIZ = new Set(['kilic']);
export const GORUNEN = ZONES.filter((z) => z.urun > 0 && z.oda && !ETKILESIMSIZ.has(z.id));
// Yuva kimliği ya da eski durak kimliği → yuva (?odak=kalemlik gibi eski adresler de çalışsın); bulunamazsa null
export const yuvaBul = (id) => ZONES.find((z) => z.id === id) ?? ZONES.find((z) => z.yer === id) ?? null;

// Ürün yerleri: [x, y, z(taban), dönüş z]
export const A = {
  pedestal: [PEDESTAL.x, PEDESTAL.y, 0, 0], // çekmeceli dolap (üst çekmece −y yönünde açılır)
  tepsi: [PEDESTAL.x + 90, PEDESTAL.y + 210, PEDESTAL.h, 0], // dolabın üstünde, arkada, spot lambanın başının altında (dekor)
  // Kart anahtarlık askı panosu (2026-11-03): arka duvarda dolabın üstü, lamba başının (z ~1450) üstünde, rafların solunda
  // (raf x −1260'tan başlar); duvar yüzü ve panonun alt kenarı
  pano: [-1460, 1800, 1520, 0],
  pencup: [-1400, 1520, 740, 0],      // monitörün solunda (önceki yerde kalemler monitörün içine giriyordu)
  keyboard: [-930, 1330, 740, 0.02],
  monitor: [MONITOR.x, MONITOR.y, 740, 0], // klavyenin arkasında (pilotta gerçekçi monitör)
  kartvizit: [-1385, 1395, 740, -0.22], // kalemliğin önü, kameraya hafif dönük
  clickers: [-760, 1235, 743, -0.35], // anahtarlık clicker: klavyenin önünde, mousepad'in üstünde (tuş setiyle aynı tasarım)
  modem: [-1110, 1690, 1328, 0.05],   // alt rafın solu (raflar masanın sağ yarısında: sol üst duvar başlığa kalır)
  qrHolder: [-950, 1700, 1328, -0.1],
  plakalar: [-760, 1690, 1328, 0],    // raf yuvası açıkken alt rafın ortasında tek diorama plakası (seçili; 2026-11-02)
  // Painter rölyefi (büyük çerçeve; taban yüksekliği; dekor). 2026-11-03: sol duvar kitaplığa kaldı, rölyef sağ duvarın
  // önüne (ekranın önü) taşındı; ön yüzü odaya (x işaretine göre döner)
  frameA: [2095, -1250, 1150, 0],
  frameB: [2095, 850, 1200, 0],       // sağ duvar, buzdolabının (ve üstündeki Flip'in) üstü: resimli yapboz
  sign: [800, 1800, 2320, 0],         // balkon kapısının üstü (duvar yüzü, plakanın alt kenarı)
  sillL: [100, 1655, 850, 0],         // sol pencere kenarı (arkasında tül: saksı ona değmesin)
  sillR: [1500, 1655, 850, 0],        // sağ pencere kenarı
  planterL: [120, 3180, 0, 0],        // balkon: korkuluk önü
  planterR: [1720, 3120, 0, 0],
  table: [900, 2650, 0, 0],           // bistro masa (üstü 722)
  fridge: [FRIDGE.x, FRIDGE.y, 0, 0],  // sağ duvar, ön yüzü −x
};

// Raf yuvası açıkken modem ve QR standı rafın ortasındaki plakaya yer açmak için alt rafın sağ ucuna kayar (mm)
export const RAF_KAY = 690;

// Kamera: giriş ve genel plan. Genel planda masa ile balkon kapısı görünür; sol ve sağ kenar bakışla açılır.
export const SHOTS = {
  intro: { pos: [600, -3000, 2250], target: [-300, 1500, 1100] },
  main: { pos: [0, -1850, 1600], target: [-400, 1650, 1000] },
  portrait: { pos: [-350, -1550, 1500], target: [-700, 1500, 1150] }, // telefon (dikey): odanın içinden
};
// Genel plan ekran oranına göre (story.js built.fitShot): beş ürün işaretçisinin hepsi kadrajda kalsın (2026-11-02).
// En geniş ikili yan duvarlarda: katana (sol, x −2090) ve maske (sağ, x 2090), ikisi de y ≈ 860. Kamera odanın ortasında
// (x 0) ve bu ikisi yatay görüşe pay ile sığana kadar geride durur: masaüstünde ön kesitin ~2,5 m gerisinden içeri
// bakar (kesit kenarları kadraj dışında). Giriş uçuşu bunun da gerisinden başlar. Dikey ekranda uygulanmaz: yan
// duvarlar 4,2 m arayla karşılıklı, dar ekranda ancak maket gibi uzaktan sığarlar.
// 2026-11-03: portfolyo köşesi yan duvarların önüne (kitaplık y −30…1070, ekran y −860…360, kara tahta y −660…−60)
// geldi; kadraj kenarı y 860'tan −400'e (kamera ~1,3 m geri): kitaplık, ekran ve altındaki oyun rafı genel planda görünür
const KENAR = { x: 2090, y: -400 };
export function fitShot(aspect, fov) {
  // Dikey ekranda (telefon, dikey tablet) eski içeriden kadraj kalır (portraitShot, portraitFov): uzaktan maket görünümü
  // gökyüzü ve boş bant bırakıyordu (2026-11-02 kullanıcı kararı)
  if (aspect < 0.9) return null;
  const yatay = Math.tan((fov * Math.PI) / 360) * aspect; // yatay yarım görüşün tanjantı
  const t = Math.min(1, Math.max(0, (aspect - 0.46) / (1.6 - 0.46))); // 0 telefon, 1 geniş masaüstü
  const pay = 1.24 - 0.12 * t; // dar ekranda perspektif kenardakileri daha çok dışa iter
  const d = Math.max(5160, (KENAR.x * pay) / yatay);
  const z = 1450 + 250 * t, tz = 700 + 100 * t;
  const main = { pos: [0, KENAR.y - d, z], target: [0, 1650, tz] };
  const intro = { pos: [600, KENAR.y - d - 1300, z + 600], target: [-200, 1650, tz + 100] };
  return { main, intro };
}

// Görüş açısı (derece, dikey; 2026-11-04 v7 kamera kuralı): ekran oranına göre sabit, etkileşimde değişmez (yaklaşma
// kameranın yeriyle). Oda içinde göz yüksekliğinden kadraj kurulabilsin diye geniş: yatay ekranda 42° (önce 30°: 4,2 m'lik
// odada kitaplık ve raf ancak duvarın dışından sığıyordu), kareye yakın 48°, dikey 58°
export const FOV = { yatay: 42, kare: 48, dikey: 58 };

// Kenardan bakma sınırları (radyan, artı sola): solda dolap ve çerçeveler, sağda pencere ve buzdolabı
export const LOOK = { min: -0.52, max: 0.46, edge: 0.2, speed: 0.75 };

// Yakın planlar: her yuvanın kendi açısı (kaydırmalı turun durakları); kadrajlar eski duraklardan taşındı (2026-11-01).
// Yatay ekranda motor kadrajı kartın tersine, dikey ekranda yukarı kaydırır. w: yatayda sığması gereken genişlik (mm);
// telefonda kamera bu genişlik sığana kadar geri çekilir (story.js focusShot). Gizli yuvaların (sticker, raf) kadrajı da
// hazır durur: ürünü gelince açılır.
export const FOCUS = {
  sticker: { pos: [-930, -220, 1900], target: [-1790, 860, 560] },  // eski cekmece: tam açık çekmece (590 mm dışarıda)
  // v6 (2026-11-04, kullanıcı itirazı: yakın planlar elle verilmişti, ürün küçük ya da Biggie'nin arkasında kalıyordu):
  // anahtarlik, figur, raf, maske, biblo, oyunlar, hakkimda nesnenin sınır kutusundan hesaplandı (core/oda-kadraj.js bul:
  // ürün kadrajın %58'i, merkezde (yan kart kaydırması motorda), kamera ile ürün arasında mobilya, duvar ve duraktaki
  // Biggie (BIGGIE_DURAK yeri, gövde silindiri) yok, kamera mobilya hacminde değil; tercih eski açının yönü). w: masaüstü
  // kadrajındaki yatay genişlik / 0,58 (telefonda motor bu genişliğe göre geri çeker)
  anahtarlik: { pos: [-1354, 745, 1792], target: [-1460, 1753, 1670], w: 556 }, // duvardaki askı panosu (bütün kartlar)
  figur: { pos: [-1950, 1000, 1450], target: [-1400, 1520, 829], w: 184 }, // v7: soldan (Biggie sağında eğilir)   // masa üstü, monitörün solu
  // raf: alt rafın ortasında tek plaka. 2026-11-04 yakınlaştı (plaka 1440'ta genişliğin ≥%25'i, 390'da yüksekliğin ≥%20'si);
  // sağ uçtaki modem ve QR standı yakın planda tamamen kadraj dışında kalır (kenardan kesik görünmesin)
  raf: { pos: [-717, 1284, 1491], target: [-760, 1690, 1382], w: 300 },
  kilic: { pos: [-1000, 650, 1560], target: [-2090, 860, 1450], w: 620 }, // eski cerceve: sol duvara karşıdan, hafif çapraz
  maske: { pos: [811, 582, 1615], target: [2072, 850, 1460], w: 895 }, // buzdolabının üstündeki duvar (Biggie kadrajın dışında)
  biblo: { pos: [404, 1351, 1048], target: [-15, 1655, 910], w: 322 },   // pervaz: sağdan, alçaktan (önündeki Biggie örtmesin)
  // Portfolyo köşesi (2026-11-03; yerleri core/oda-portfolyo.js PORT). Nesnenin kutusu masaüstünde (30°, 16:10) NDC
  // ±0,86'ya sığacak uzaklıkta; w telefonda (58°, 390 × 844) aynı payla sığacak genişlik; kamera odanın içinde (x ±1980, y ≥ −1750: ön kesitten
  // dışarı çıkınca kadrajın kenarında dışarısı görünüyordu) (.impeccable/kadraj-olc.js)
  // v7: kadraj yalnız gözlerin bandı (z 650–2000; altı çekmece, üstü tepe): bütünü oda içinden oda dışı göstermeden sığmıyor
  kitaplik: { pos: [1920, -1750, 1469], target: [-1890, 520, 1300], w: 1410, kutuZ: [650, 2000] },
  // kitaplik (2,35 m) oda içinde 30° görüşle sığmıyor: en uzak köşeden (eski kadraj, doluluk ~%89, Biggie yaslanır)
  // oyunlar: raf + rafın +y ucundaki kutunun önünde diz çöken Biggie birlikte (oda-sunum istasyon; kadrajın %62'si)
  oyunlar: { pos: [-1669, -1750, 1481], target: [1700, -250, 500], w: 2240 },
  // ekran: TV kadrajın %58'i, odanın ortasından (armut ön sol köşede, Biggie armutta otururken kadrajın solunda kalır)
  ekran: { pos: [-316, -758, 1903], target: [2075, -250, 1253], w: 2169 },
  hakkimda: { pos: [607, -1542, 1743], target: [-2047, -360, 1393], w: 1097 },
};

// ---- Biggie'li sunumun durakları (senaryo: C:\Oktos\calisma\oktos-dijital-site\senaryo\biggie-sunum.md, "Durak
// sözleşmesi"; sunum core/oda-sunum.js'te, bu dosya yalnız veri) ----
// id: durak (ürün yuvası, portfolyo durağı ya da işaretçisiz yer: buzdolabi, cop, masa). nesne: oda-sahne api.nesne(id)
// ile alınan sahne nesnesi. yer: Biggie'nin duracağı nokta [x, y] (mm, zemin). yon: bakış (derece; karakterin psi'si:
// 0 kameraya (−y), 90 +x, 180 +y (arka duvar), −90 −x). klip: klip sözleşmesindeki ad (assets/oda/karakter.glb; yeni
// kliplerden henüz gelmeyen olursa sunum 'bekle' ile durur). yedek: aynı durakta ikinci durumun klibi. sure: önerilen
// süre (sn; null: döngüde kalır). kadraj: Biggie gelince kamera (story.js focusShots biçimi: pos, target, w). Kutu =
// ürünün kutusu + Biggie'nin gövdesi (yer ± 220 mm, z 700…1450: göğüsten yukarısı kesin, bacaklar kadraj kenarında kalabilir); masaüstünde NDC ±0,86, telefonda w ile (390 ve 1440
// genişlikte kesilme 0; .impeccable/kadraj-olc.js). Yer noktaları yeni engellere (core/oda-portfolyo.js ENGEL) en az
// karakterin payı (160 mm) uzakta; yol düğümleri sunum işinde.
export const BIGGIE_DURAK = [
  { id: 'anahtarlik', yer: [-1560, 800], yon: 170, klip: 'egil_bak', sure: 4,
    kadraj: { pos: [67, -1646, 1571], target: [-1544, 1190, 1260], w: 1416 } },
  { id: 'raf', yer: [-400, 880], yon: 200, klip: 'egil_bak', sure: 4,
    kadraj: { pos: [60, -1261, 1495], target: [-508, 1196, 1075], w: 1283 } },
  // v7 (kamera kuralı: Biggie odağı örtmez): figürün önünden sağa alındı, çapraz bakar; kamera soldan
  { id: 'figur', yer: [-1060, 830], yon: 210, klip: 'egil_bak', sure: 4,
    kadraj: { pos: [-390, -1020, 1403], target: [-1400, 1100, 1075], w: 1111 } },
  // v7: pervazın önünden sola (masanın ucu), çapraz bakar; kamera sağdan
  { id: 'biblo', yer: [-250, 1000], yon: 160, klip: 'egil_bak', sure: 4,
    kadraj: { pos: [668, -689, 1336], target: [60, 1379, 1075], w: 882 } },
  // Maske satıştaki ürün; senaryoda Biggie eylemi yok: yanında bekler
  { id: 'maske', yer: [1150, 900], yon: 90, klip: 'bekle', sure: 3,
    kadraj: { pos: [-856, -840, 1508], target: [1503, 855, 1177], w: 1463 } },
  // Kitaplık: sırtı kitaplığa yaslanır (yüzü odaya)
  // Tek esere ya da kitaba tıklanınca (v5) core/oda-sunum.js eşyanın önünde kitap_al kurar (eline alır, kamera elinden
  // yakın plan, yerine koyar)
  // v7: kitaplığın ortasından +y ucuna (önünde durduğu raf kadrajın kenarında; tam ortada kitaplığın %17'sini örtüyordu)
  { id: 'kitaplik', yer: [-1530, 930], yon: 90, klip: 'yaslan', sure: 5, kitapKlip: ['kitap_al_alt', 'kitap_al_orta', 'kitap_al_ust'],
    kadraj: { pos: [1896, -1750, 1365], target: [-1702, 520, 1225], w: 1587 } },
  // Kutu oyunları rafı (v5): rafa (bütününe) tıklanınca kutu_al; tek kutuya tıklanınca core/oda-sunum.js kutunun
  // önünde diz_cok → kutu_al_diz → diz_kalk dizisini kurar (kutu ele, sonra rafın üstüne; raf üstü z 420)
  // v7 (2026-11-04): rafa tıklanınca Biggie kutu almaz, rafın buzdolabı tarafında bekler (kutuların önünü örtmez); kutuya
  // tıklanınca diz_cok → kutu_al_diz (kutu rafın üstüne) → diz_bekle döngüsü; oklar kutu_cevir_sag, "Geri"
  // kutu_rafa_birak → diz_kalk (core/oda-sunum.js kutuSec). bekleYer: rafın yanındaki bekleme noktası
  { id: 'oyunlar', yer: [1300, 450], yon: 30, klip: 'bekle', sure: 3, kutuDizi: ['diz_cok', 'kutu_al_diz', 'diz_kalk'],
    kutuV7: { bekle: 'diz_bekle', cevir: 'kutu_cevir_sag', cevirSol: 'kutu_cevir_sol', birak: 'kutu_rafa_birak', kalk: 'diz_kalk' },
    kadraj: { pos: [-1950, -1150, 1600], target: [1623, 0, 725], w: 1808 } },
  // TV (v5, 2026-11-03 kullanıcı isteği): Biggie armut koltuğa oturup TV'yi açar. yer: armudun önü (yüzü TV'ye, +x);
  // tv_armut klibi kökü geri (−x) kaydırıp oturtur. otur: oturma noktası (armudun oturağı, dünya mm; core/oda-portfolyo.js
  // PORT.armut); acAn: TV'nin açıldığı an (klip meta'sı 'ac' karesi, yoksa sürenin kesri)
  // v5 meta: kök armudun ekseninden eksen_mm ([−7, 392]: 392 mm önünde); capa ile kök hesaplanır (yer yalnız yedek)
  // v7: armut odanın içinde (PORT.armut (−300, −200), önü TV'ye, rz 1,55): klip armut_yat → armut_uyukla → armut_kalk,
  // kök armudun ekseninden armut_yat.armut.eksen_mm (515 mm) önde (capa); yer yalnız yedek
  { id: 'ekran', yer: [215, -211], yon: 89, klip: 'armut_yat', sure: 10, oturus: true,
    capa: { anahtar: 'armut.eksen_mm', nokta: [-300, -200], klip: 'armut_yat' }, otur: [-300, -200, 220], acAn: { meta: 'bas', kesir: 0.3 },
    kadraj: { pos: [-1322, -1091, 1371], target: [1490, -279, 1153], w: 1855 } },
  // Buzdolabı: meyve varken buzdolabi_ac (elmayı alır; elma_ye üst gövdede yürürken de sürer), bitince buzdolabi_bos
  // v6: duruş kapağın süpürme yayının dışında (core/oda-karakter.js buzDurus): meta'da durus_mm (menteşenin karakter
  // yerelindeki yeri, mm; Blender ajanı yazacak) varsa o, yoksa klibin menteşesi kapak_en + pay (190) uzaklığa uzatılır
  // (yer: o yedeğin sonucu, yalnız kadraj ve meta'sız dosya için)
  { id: 'buzdolabi', yer: [1220, 300], yon: 90, klip: 'buzdolabi_ac', yedek: 'buzdolabi_bos', sure: 5, durus: { meta: 'durus_mm', pay: 190 },
    tercih: [-0.4, -1, 0.4], // v6 kadraj (oda-sunum istasyonKadraji): sol-önden (kameranın tarafı); açık kapak, dolabın içi ve Biggie
    kadraj: { pos: [-1641, -1452, 1568], target: [1580, 820, 725], w: 1439 } },
  // Çöp: elma_firlat bulunduğu yerden de atılır (her zaman isabet); bu nokta çöpe yürüyüp atmak içindir. Çöpün ağzı
  // api.nesne('cop').userData.agiz (dünya, mm)
  { id: 'cop', yer: [1250, 250], yon: 108, klip: 'elma_firlat', sure: 2.5,
    kadraj: { pos: [-1917, -1599, 1576], target: [1549, 332, 725], w: 1433 } },
  // Masa: "Çalışmaya dön" (oturma yeri core/oda-karakter.js YER.masa; otur ya da otur2, sonra yaz döngüsü)
  // v6: masa: true → Biggie sandalyeye oturur, masaya kayar, yazar; monitörde tasarım döngüsü ('oturdu')
  { id: 'masa', yer: [-960, 812.5], yon: 180, klip: 'otur', yedek: 'otur2', sure: null, masa: true,
    kadraj: { pos: [-211, -1642, 1566], target: [-935, 1146, 1025], w: 1560 } },
  // Öneri (senaryodaki durak listesinde yok): hakkımda tahtasının önünde bekler
  // v6: armut tahtanın önünden kalktı (ön sol köşeye); Biggie kitaplığın önü ile tahtanın arasında, yüzü tahtaya çapraz
  // (tahtanın kadrajında kamera ile tahta arasında kalmasın)
  { id: 'hakkimda', yer: [-1430, 180], yon: -50, klip: 'bekle', sure: 3, oneri: true,
    kadraj: { pos: [1185, -1387, 1476], target: [-1672, -360, 1263], w: 1198 } },
];

export const LIGHTS = {
  center: [0, 1200, 900],
  key: [-1500, -2600, 3800],
  fill: [2400, -1200, 1500],
  rim: [600, 4400, 2800],
  shadowSpan: 3200,
  keyIntensity: 2.6,
};
