// Oda sahnesinin karakteri (bizzikoloşko). Ziyaretçiye üst kattan eşlik eder: ziyaretçi odaya inince (asagi) balkonun
// sağındaki yangın merdiveninden ya da ipten (her ziyarette rastgele) yavaşça iner, içeri girip kapı eşiğinde rastgele
// bir dans eder, masanın sağındaki katlı oyuncu koltuğunun sırtını açıp oturur, masaya kayar ve bilgisayar başında
// çalışır; boşta emote atar, tıklanınca ya da şablon değişince tepki verir. Ziyaretçi üst kata dönerse (yukari) kalkıp
// aynı yoldan tırmanır; yolda geri dönerse kaldığı yerden döner.
// Yakın planda ürünün önüne karakter ya da koltuk girerse ürün sade bir x-ray dairesinden görünür; kadrajı karakterin
// kapladığı duraklarda (masa başı) koltuğunu kenara çeker. Kamera içinden geçerse karakter seyrelir.
// Model ve klipler Blender'dan: assets/oda/karakter.glb (Draco; NLA izleri = klipler; sahnenin extras'ında
// "karakter_meta": kare aralıkları ve ölçüler, yoksa aşağıdaki varsayılanlar). Kemik ve düğüm adları Blender'dakiyle aynı.
// Birim mm, Z yukarı. Yön açısı ψ: karakterin baktığı yön (sin ψ, −cos ψ); ψ = 0 kameraya (−y), π/2 sağa, π masaya.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OLCU } from './oda-olcu.js';
import { A, ZONES } from './oda-yerler.js';

const DOSYA = new URL('../assets/oda/karakter.glb', import.meta.url);
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';
const { ROOM, GLASS, BALCONY, DESK, PEDESTAL, FRIDGE, SILL, CHAIR, ROBOT } = OLCU;
const TAU = Math.PI * 2;
const MASA_Z = 335; // masa başı kliplerinde kök yüksekliği (Blender eşlemesi z_site = 1,5 z + 335: eller klavyede, kalça koltukta)

// ---- Ayarlanabilir değerler ----
export const AYAR = {
  tempo: 1.15,           // karakterin bütün zamanı (klipler, yürüyüş, kayma, iniş) bu kat hızlı akar: ayak kaymaz (2026-10-20)
  // Masadaki gizli yerler (genel planda karakterin ardında kalanlar): fare buradaki ürünün üzerindeyse imleç dairesi
  // karakteri siler; biraz durursa karakter koltuğuyla birlikte o yeri açan yana döner (rad; + saat yönünün tersi,
  // yukarıdan bakınca). Anahtar sahne yeri (oda-yerler ZONES.yer): yuva kimliği yerine çevrilerek bakılır (donAcisi;
  // 2026-11-01: kalemlik → figur yuvası). kartvizit ve klavyede bugün yuva yok (dekor); açı yerin kendisine ait,
  // lab/karakter-test.js de bu yerlerle sınar. Yön ve açı genel plan kamerasından ölçüldü
  donDurak: { kalemlik: 0.6, kartvizit: 0.6, klavye: -0.75 },
  fareCap: 125,          // mm: imleç dairesinin çapı (ürünün uzaklığında)
  donBekle: 0.15,        // sn: imleç bu kadar durunca döner (üstünden geçerken dönmesin)
  donBirak: 0.4,         // sn: imleç ürünlerden bu kadar uzak kalınca geri döner (ürünler arası geçişte sallanmasın)
  donYay: 7,             // rad/sn: dönüşün yayı (kritik sönümlü, ~0,6 sn'de oturur)
  minderEz: 0.13,        // oturuşta minder bu oranda ezilip yaylanarak toparlanır
  donme: 0.2,            // rad: oturuşta oturak (karakterle) kendi ekseninde bu genlikle sönerek sallanır
  hizYuru: 406,         // mm/sn: yürüme döngüsünde basan ayağın hızı (Blender'da ölçüldü: 0,271 m/sn × 1,5)
  donus: 3.2,            // rad/sn: yürürken en hızlı dönüş
  donusYerinde: 3.6,     // rad/sn: durduğu yerde dönüş (yavaşı ağır çekim gibi duruyordu)
  hizKaydir: 330,        // mm/sn: koltukla kayma
  donusKaydir: 2.5,      // rad/sn
  pay: 160,              // yürürken engellerden pay (gövde yarıçapı; balkonda cephe ile bistro masa arası ~385 mm)
  gizliZ: 3000,          // iniş bu kalça yüksekliğinden başlar (üst kat: pencereden görünmez)
  hizliIn: 3.5,          // görünmeyen yükseklikte iniş/çıkış bu kat hızlı
  gorunurZ: [1100, 1900],// kalça bu aralıkta normal hızdan hızlıya geçer (açılıştan klavyeye ~50 → 30'lu sn, 2026-10-20)
  yakin: [850, 560],     // kamera karaktere bu uzaklıktan (mm) yaklaşınca seyrelir, ikincisinde tamamen kaybolur
  kenarYakin: 1250,      // kenara çekilmeyi gerektiren yakın planın kamerasına bu kadar yaklaşınca koltuk çekilir
  kenarOnce: 2.5,        // ya da kamera o durağa bu kadar saniyede varacak hızla yaklaşıyorsa (tıklamayla uçuş)
  kenarPay: 0.85,        // ... ve genel plandaki uzaklığının bu katından yakındaysa
  kenarHiz: 3.0,         // kenara kaçarken koltuk bu kat hızlı kayar (dönüşte normal)
  kenarBekle: 1.2,       // gerek kalmayınca masaya dönmeden önce, sn
  dansBekle: [0.3, 0.4], // eşikte dans öncesi ve sonrası duruş, sn
  dansSure: 4.0,         // dans en fazla bu kadar sürer (karakter saniyesi; uzun dans yarıda yumuşakça biter)
  oturHiz: 1.25,         // uzun oturma klibi (Koltuğa Oturma) bu kat hızlı
  bosta: [9, 18],        // masada iki emote arası, sn (rastgele)
  tepkiAra: 12,          // iki tepki arası en az, sn
  sablonTepki: 0.3,      // şablon değişince tepki olasılığı
  // (açık sırtın menteşedeki yatıklığı OLCU.CHAIR.sirtDik: Blender'ın sırt açma klibiyle ortak)
  yatirEnCok: 1.2,       // rad: emote'ta (inanamama) sırtın ek yaslanması en çok (oyuncu koltuğu; kafa sırttan taşmasın)
  salinim: 0.001,        // rad/mm: oturanın göğsü yana kaydıkça oturağın döndüğü açı (çok hafif)
  salinimEnCok: 0.05,    // rad
  salinimYay: [30, 5],   // oturak salınımının yay sertliği ve sönümü (~0,9 Hz, hafif aşar)
  xrRenk: [0.2, 0.22, 0.24], // x-ray dairesinin çizgisi (doğrusal, ton eşlemeden önce)
  isik: 1.6,             // karakter malzemelerinin ortam ışığı çarpanı (loş oda)
  // ---- Rehberli sunum (core/oda-sunum.js, senaryo biggie-sunum.md, 2026-11-03) ----
  elmaSayi: 2,           // buzdolabındaki elma (sayfa yenilenince yeniden 2)
  isirik: 3,             // bir elma bu kadar ısırıkta biter
  ilkIsirik: 2.5,        // sn: elma eline gelince ilk ısırığa dek (v8.2)
  xrayYok: true,        // v8.3: x-ray deliği hiçbir aksiyonda yok
  isirikAra: 17,         // sn (karakter saniyesi): iki ısırık başlangıcı arası; yürürken de sürer (v8.2: elma ~1 dk, araları duraklı)
  elmaAgirlik: 6,        // elma_ye üst gövde katmanının ağırlığı (alttaki yürüyüşe karşı; kollar ~%85 elmada)
  elmaAl: 0.45,          // buzdolabi_ac klibinin bu kesrinde elma ele geçer (meta 'al' karesi varsa o)
  firlatAn: 0.42,        // elma_firlat klibinin bu kesrinde elma elden çıkar (meta 'birak' karesi varsa o)
  ucus: 0.85,            // sn: elmanın çöpe uçuşu
  ucusTepe: 520,         // mm: yayın en yüksek noktası, iki ucun yükseğinin üstünde
  kapakAci: -1.75,       // rad: buzdolabı kapağı bu kadar açılır (menteşe z ekseni)
  durakSure: 2.4,        // sn: duraktaki klip yoksa (yer tutucu 'dur') o kadar bekler
};
// Sunumda karakterin beklediği yer: eşikten içeri bir adım, odanın ortası, yüzü kameraya
const SUNUM_BEKLE = { x: 520, y: 760, psi: -0.25 };
// v8.2: elmayı yediği köşe (armudun sağ önü, yüzü odaya); çöpe ~2,9 m
const ELMA_KOSE = { x: -650, y: -900, psi: 0.9 };
// Elmanın atıldığı çöp kutusu: buzdolabının kameraya bakan (−y) yanı. Sahnede 'cop' adlı nesne varsa onun ağzı
// kullanılır (core/oda-sahne.js), yoksa bu geçici nokta (ağız merkezi, mm)
const COP_GECICI = { x: OLCU.FRIDGE.x - 20, y: OLCU.FRIDGE.y - OLCU.FRIDGE.w / 2 - 190, z: 420, r: 150 };
// Sözleşmedeki klip henüz GLB'de yoksa: ayakta duran yer tutucu. Masa başı klipleri (kafa_salla, bekle, sevin...)
// kökü 335 mm kaldırır ve oturuş pozundadır: ayakta yer tutucu olamaz
const YER_TUTUCU = { egil_bak: 'dur', yaslan: 'dur', kumanda: 'dur', kutu_al: 'dur', buzdolabi_ac: 'dur', buzdolabi_bos: 'dur', elma_firlat: 'dur',
  // v5 klipleri (2026-11-03; Blender ajanı üretiyor, meta notu senaryo/klip-meta-v5.md)
  tv_armut: 'dur', diz_cok: 'dur', kutu_al_diz: 'dur', diz_kalk: 'dur', kitap_al: 'dur',
  // v7 (2026-11-04; Blender ajanı üretiyor, senaryo/klip-meta-v5.md "v7"): yoksa yer tutucu YOK ('' = klip oynamaz, karakter
  // o anki pozunda kalır: diz pozunda beklerken ayağa kalkmasın); kutuyu site kendisi çevirir / rafa geri kaydırır
  diz_bekle: '', kutu_cevir_sag: '', kutu_cevir_sol: '', kutu_rafa_birak: '', armut_yat: '', armut_uyukla: '', armut_kalk: '' };
// Kökü yere indiren ama ayakta başlayıp biten v5/v7 klipleri: oturuş klibi denetiminden (kök z > 100) muaf
const OTURUS_SERBEST = new Set(['tv_armut', 'diz_cok', 'kutu_al_diz', 'diz_kalk', 'diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol', 'kutu_rafa_birak', 'armut_yat', 'armut_uyukla', 'armut_kalk']);
// v7: yarıda bırakılan pozun kapanış klibi (diz pozundan kalk, armuttan kalk)
const CIKIS_KLIP = { diz_cok: 'diz_kalk', kutu_al_diz: 'diz_kalk', diz_bekle: 'diz_kalk', kutu_cevir_sag: 'diz_kalk', kutu_cevir_sol: 'diz_kalk', kutu_rafa_birak: 'diz_kalk', armut_yat: 'armut_kalk', armut_uyukla: 'armut_kalk' };
const UST_GOVDE_DISI = /kal[cç]a|ayak|bacak|diz|uyluk|bald[iı]r|k[oö]k|root/i; // elma_ye katmanından atılan kemikler
// Fare altındaki yuvanın (ya da doğrudan sahne yerinin) dönüş açısı; masadaki gizli yerlerden değilse undefined
const donAcisi = (zone) => (zone ? AYAR.donDurak[zone] ?? AYAR.donDurak[ZONES.find((z) => z.id === zone)?.yer] : undefined);

// Varsayılan klip bilgisi (kareler Blender'daki gibi 1'den; GLB'deki karakter_meta bunların üstüne yazar).
// dongu/son: iniş klibinde döngü ve iniş bitişi; tekrar: döngülü klip; z: kökün yerden yüksekliği (mm, sabit ya da
// [[kare, değer], ...]); koltuk: koltuk merkezinin kökün kaç mm arkasında olduğu; sirt: sırt katlılığı (1 katlı, 0 dik);
// kayma: kökün klip boyunca bakış yönünde yürüdüğü mm (karakter yerinde canlanır, yerini site kaydırır); tut: koltuğun
// köke tutturulduğu kare aralığı; don: tutarken koltuğun kendi ekseninde dönüşü (rad); kavrama: sırt açmaya koltuğun
// kaç mm arkasında başlanır. Sırt açmanın değerleri scripts/karakter-klipler.py SA ve KAVRAMA'dan gelir (GLB meta'sı);
// buradakiler yalnız meta'sız dosya için. Koltuğun çekildiği yer bunlardan türetilir (cekilmisKoltuk).
const MASA = { z: MASA_Z, koltuk: 33 };
const VARSAYILAN = {
  fps: 30,
  kalca: null, kafa: null,                      // kemik adları (boşsa addan tahmin)
  merdiven: { mesafe: 300, en: 460, ilk: 106.5, aralik: 124.5 }, // kökten merdiven düzlemine, basamaklar (mm)
  ip: { mesafe: 170 },
  klip: {
    merdiven: { dongu: [1, 49], son: [49, 144] },
    ip: { dongu: [1, 73], son: [73, 252] },
    yuru: { tekrar: true }, dur: { tekrar: true },
    dans_twist: {}, dans_tavuk: {}, dans_lahana: {}, dans_runningman: {},
    sirt_ac: { sirt: [[82, 1], [114, 0]], kayma: [[1, 0], [14, 100], [24, 100], [74, -550], [80, -550], [100, -710]], tut: [22, 78], kavrama: 600 },
    otur: { z: [[42, 0], [81, MASA_Z]], koltuk: [[1, 205], [145, 205], [161, 33]] },
    kalk: { z: [[1, MASA_Z], [30, MASA_Z], [72, 0]], koltuk: [[1, 33], [22, 205]] },
    kaydir: { tekrar: true, ...MASA },
    yaz: { tekrar: true, ...MASA }, fare: { tekrar: true, ...MASA }, muzik: { tekrar: true, ...MASA }, bekle: { tekrar: true, ...MASA },
    // yatir: sırtın ek yaslanması (rad). inanamama'da kafa sırtın ~45 cm gerisine iner (ölçüldü 2026-10-20): sırt
    // ~69° yatmazsa kafa arkasından taşar
    inanamama: { ...MASA, yatir: [[16, 0], [28, 0.3], [37, 0.68], [43, 1.0], [48, 1.2], [80, 1.2], [85, 1.0], [91, 0.6], [97, 0.25], [104, 0]] },
    kafa_salla: { ...MASA }, sevin: { ...MASA }, uzan: { ...MASA }, cekil: { ...MASA },
  },
};
const DANSLAR = ['dans_twist', 'dans_tavuk', 'dans_lahana', 'dans_runningman'];
// Masa başında boşta: ağırlıklı rastgele dizi ([ad, sn]: döngülü klip o kadar sürer)
const EMOTE = [
  [4, [['fare', 10]]], // v8.2: fareyle çalışır (fare klibi yaz'ın 1. karesinden başlar, ona döner; 2 tur)
  [3, ['kafa_salla']],
  [2, ['cekil', ['bekle', 5], 'uzan']],
  [1, ['sevin']],
  [1, ['inanamama']],
];
const KENAR_KLIP = ['muzik', 'bekle']; // kenarda beklerken (ilk bulunan): taburede müzik dinleme

// ---- Yerler ----
// Merdiven (yangın kaçışı: üst katın balkonundan iner) ve ip balkonun arka sağında, korkuluğun önünde: ana kadrajdan
// kapı boşluğunun sağ yarısında görünür (sağ pencere ana kadrajın dışında kalır). Karakter merdivene yüzü korkuluğa
// dönük iner; sonra sağ duvar şeridinden (kadraj dışı) dolaşıp cephe ile bistro masa arasından kapıya gelir.
const INIS_X = 1560, INIS_Y = BALCONY.y1 - 40; // merdiven düzlemi / ipin sarktığı yer
const YER = {
  esik: { x: (GLASS.door0 + GLASS.door1) / 2, y: ROOM.y1 - 240, psi: 0 },   // balkon kapısının iç eşiği, yüzü kameraya
  masa: { x: -960, y: 812.5, psi: Math.PI },                                // masa başı (Blender eşlemesi), yüzü monitöre
  // Yakın planda koltuğu çektiği yer: masanın sağ ucunun önü, sol pencerenin yanı; yüzü odaya. Masa başı yakın plan
  // kameralarının görüşü ve aralarındaki uçuşlar dışında (en yakın uçuş ~0,6 m); kenar yeri kadrajına giren bir
  // durakta (biblo: pervazdaki saksılar) karakter kenarda beklemez
  kenar: { x: 100, y: 1050, psi: 0.35 },
};
// Oturma yeri: koltuk masadan düz geri çekilir (katlı sırt kalkarken masaya değmesin), dönmez; karakter önüne geçip
// masaya bakarak oturur, sonra masaya kayar. Çekiş sırt açma klibinden: koltuğun köke tutturulduğu aralıkta (tut) kök
// bakış yönünde ne kadar yürürse (kayma; geri yürüyüş eksi) koltuk o kadar gelir. Karakter koltuğa arkasından bakar
function cekilmisKoltuk({ kayma, tut }) {
  const cek = anahtar(kayma, tut[1]) - anahtar(kayma, tut[0]), [fx, fy] = yon(CHAIR.rz + Math.PI);
  return { x: CHAIR.x + fx * cek, y: CHAIR.y + fy * cek, rz: CHAIR.rz };
}
// Yol düğümleri: balkon (merdiven önü, cephe ile bistro masa arasındaki geçit, kapı önü), eşik, odanın açık zemini
const DUGUM = [
  [1780, 3150], [1775, 2260], [1500, 2165], [1150, 2160], [800, 2160], [800, 1560], [450, 1260], [120, 1040], [80, 1380],
  [120, 620], [-200, 380], [-650, 420], [-1150, 560], [600, 520], [1000, 300],
  // v7: çekilmiş sandalyenin solundan (kitaplıkla arasından) geçiş. v8: armut sol duvarın önüne (−1560, −560) taşındı;
  // ilk düğüm armudun engelinden (420 + pay 160) dışarı alındı, armudun önüne bir düğüm (TV / Hakkımda oturuşu)
  [-1100, 30], [-1460, 650], [-700, -820], // v8.2: armut (−1380, −560): düğümler engelinin (420 + pay) dışında
  [-300, 100], [-1250, 150], [-1494, 240], // v8.3: odada kalan sandalyenin (masa_kalk: çekik) güneyinden kitaplığa
  [-450, 900], [-1150, 900], // v8.3: masanın önü boyunca (sandalye odada kalınca masadan kalkış iki yana)
];
// Geri çekilmiş koltuğun sağından önüne (arkasından oturma yerine); koltuk dairesine (300 + pay) ~3 cm payla
const koltukDugumleri = (k) => [[k.x + 550, k.y - 330], [k.x + 450, k.y + 270]];
// Engeller: k = kutu [x0, x1, y0, y1], d = daire [x, y, r]. Koltuk ayrıca (yerinde duruyorsa) daire olarak eklenir.
const CEPHE = ROOM.y1 + ROOM.wall + 45; // duvarın dış yüzü ve önündeki açık sürgü kanatları
export const SABIT_ENGEL = [
  { k: [ROOM.x0 - 200, GLASS.door0 + 30, ROOM.y1, CEPHE] },                       // arka duvar ve sol kanat
  { k: [GLASS.door1 - 30, ROOM.x1 + 200, ROOM.y1, CEPHE] },                       // kapının sağı
  { k: [GLASS.x0 - SILL.over / 2, GLASS.door0, ROOM.y1 - SILL.inset - SILL.depth / 2, ROOM.y1] }, // pervazlar
  { k: [GLASS.door1, GLASS.x1 + SILL.over / 2, ROOM.y1 - SILL.inset - SILL.depth / 2, ROOM.y1] },
  { k: [DESK.x0, DESK.x1, DESK.y0, DESK.y1] },
  { k: [PEDESTAL.x - PEDESTAL.w / 2, PEDESTAL.x + PEDESTAL.w / 2, PEDESTAL.y - PEDESTAL.d / 2, PEDESTAL.y + PEDESTAL.d / 2] },
  { k: [FRIDGE.x - FRIDGE.d / 2, ROOM.x1, FRIDGE.y - FRIDGE.w / 2, FRIDGE.y + FRIDGE.w / 2] },
  { k: [BALCONY.x1, BALCONY.x1 + 200, ROOM.y1, BALCONY.y1] },                    // balkonun sağ duvarı
  { k: [BALCONY.x0 - 200, BALCONY.x1, BALCONY.y1 - 30, BALCONY.y1 + 100] },      // korkuluk
  { k: [BALCONY.x0 - 200, BALCONY.x0 + 30, ROOM.y1, BALCONY.y1] },
  { k: [INIS_X - 290, INIS_X + 290, INIS_Y - 30, BALCONY.y1] },                  // merdiven
  ...(ROBOT ? [{ d: [ROBOT.x, ROBOT.y, ROBOT.r ?? 170] }] : []),                   // robot süpürge
  { d: [A.table[0], A.table[1], 300] },                                           // bistro masa
  { k: [A.table[0] - 700, A.table[0] - 260, A.table[1] - 280, A.table[1] + 160] }, // rattan sandalyeler (440 mm kare)
  { k: [A.table[0] + 260, A.table[0] + 700, A.table[1] - 130, A.table[1] + 310] },
];

// ---- küçük yardımcılar ----
const yon = (psi) => [Math.sin(psi), -Math.cos(psi)];
const aciOf = (dx, dy) => Math.atan2(dx, -dy);
const fark = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const kenet = (v, a, b) => Math.min(b, Math.max(a, v));
const yumusak = (u) => u * u * (3 - 2 * u);
const aralik = (v, a, b) => yumusak(kenet((v - a) / (b - a), 0, 1));
const rastgele = ([a, b]) => a + Math.random() * (b - a);
// Ziyaret başına seçimler (iniş aracı, dans, oturuş) bir önceki ziyaretin aynısını tekrarlamaz: son seçim tarayıcıda
// saklanır, seçenek birden çoksa o dışarıda bırakılıp kalanlardan rastgele seçilir (depolama yoksa düz rastgele)
function tekrarsiz(ad, secenekler) {
  if (!secenekler.length) return undefined;
  const k = `oktos.karakter.son.${ad}`;
  let son = null;
  try { son = localStorage.getItem(k); } catch { /* gizli pencere ya da kapalı depolama */ }
  const aday = secenekler.length > 1 ? secenekler.filter((x) => x !== son) : secenekler;
  const sec = aday[Math.floor(Math.random() * aday.length)];
  try { localStorage.setItem(k, sec); } catch { /* yoksay */ }
  return sec;
}
// Anahtarlı değer: sayı ya da [[kare, değer], ...] (aralarda yumuşak geçiş, uçlarda sabit)
function anahtar(k, f) {
  if (k === undefined || k === null) return 0;
  if (typeof k === 'number') return k;
  if (f <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (f > k[i][0]) continue;
    const [f0, v0] = k[i - 1], [f1, v1] = k[i];
    return v0 + (v1 - v0) * yumusak((f - f0) / (f1 - f0 || 1));
  }
  return k[k.length - 1][1];
}
function birlestir(a, b) { // derin birleştirme (dizi ve sayı üzerine yazılır)
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? birlestir(a[k], v) : v;
  return o;
}

// ---- yol bulma: görüş grafiği (düğümler + başlangıç + hedef), kısa yol, sonra kestirme ----
function kutuKeser(a, b, [x0, x1, y0, y1], p) {
  x0 -= p; x1 += p; y0 -= p; y1 += p;
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [pp, q] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
    if (pp === 0) { if (q < 0) return false; continue; }
    const r = q / pp;
    if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 <= t1;
}
const kutuUzak = (p, [x0, x1, y0, y1]) => Math.hypot(Math.max(x0 - p.x, 0, p.x - x1), Math.max(y0 - p.y, 0, p.y - y1));
function noktaParca(c, a, b) { // c'nin ab parçasına uzaklığı
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
  const t = kenet(((c.x - a.x) * dx + (c.y - a.y) * dy) / L, 0, 1);
  return Math.hypot(a.x + dx * t - c.x, a.y + dy * t - c.y);
}
function serbest(a, b, E, pay) {
  for (const e of E) {
    if (e.k) {
      // Uç noktası engelin payındaysa (koltuğun dibinde durmak, merdivenden inmek) pay o noktanın uzaklığına iner:
      // yol oradan uzaklaşabilir ama engelin daha içine giremez
      const p = Math.min(pay, kutuUzak(a, e.k) - 5, kutuUzak(b, e.k) - 5);
      if (p < 0) continue; // nokta engelin tam içinde
      if (kutuKeser(a, b, e.k, p)) return false;
    } else {
      const c = { x: e.d[0], y: e.d[1] };
      // Uç noktası dairenin içindeyse (koltuğun önünde durmak) daire o noktaya kadar küçülür: yol daha içeri giremez
      const r = Math.min(e.d[2] + pay, Math.hypot(a.x - c.x, a.y - c.y) - 5, Math.hypot(b.x - c.x, b.y - c.y) - 5);
      if (noktaParca(c, a, b) < r) return false;
    }
  }
  return true;
}
// dugum: [[x, y], ...] (DUGUM ve karakterin koltuk düğümleri)
export function yolBul(bas, son, E, dugum, pay = AYAR.pay) {
  if (serbest(bas, son, E, pay)) return [son];
  // v8.3: engelin payının içinde kalan düğüm atılır (serbest uç noktada payı küçültür: odada kalan sandalyenin
  // dairesindeki düğüm yolu sandalyenin içinden geçiriyordu)
  const icerde = ([x, y]) => E.some((e) => (e.k ? kutuUzak({ x, y }, e.k) < pay : Math.hypot(x - e.d[0], y - e.d[1]) < e.d[2] + pay));
  const N = [bas, ...dugum.filter((p) => !icerde(p)).map(([x, y]) => ({ x, y })), son], n = N.length;
  const uz = Array(n).fill(Infinity), once = Array(n).fill(-1), bitti = Array(n).fill(false);
  uz[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!bitti[i] && uz[i] < Infinity && (u < 0 || uz[i] < uz[u])) u = i;
    if (u < 0 || u === n - 1) break;
    bitti[u] = true;
    for (let v = 0; v < n; v++) {
      if (bitti[v] || v === u) continue;
      const d = uz[u] + Math.hypot(N[v].x - N[u].x, N[v].y - N[u].y);
      if (d < uz[v] && serbest(N[u], N[v], E, pay)) { uz[v] = d; once[v] = u; }
    }
  }
  if (once[n - 1] < 0) { console.warn('karakter: yol bulunamadı, düz gidiyor', bas, son); return [son]; } // takılıp kalmasın
  const yol = [];
  for (let i = n - 1; i > 0; i = once[i]) yol.unshift(N[i]);
  // Kestirme: görebildiği en uzak noktaya doğrudan
  const kisa = [];
  let o = bas;
  for (let i = 0; i < yol.length;) {
    let j = yol.length - 1;
    while (j > i && !serbest(o, yol[j], E, pay)) j--;
    kisa.push(yol[j]);
    o = yol[j];
    i = j + 1;
  }
  return kisa;
}

// ---- x-ray: karakter ve koltuk malzemelerine ekran dairesi (içi kesik, kenarında ince çizgi) ve seyrelme ----
const XR = {
  xrMerkez: { value: new THREE.Vector2() }, xrYaricap: { value: 0 }, xrGuc: { value: 0 }, xrSol: { value: 1 },
  xrRenk: { value: new THREE.Color(...AYAR.xrRenk) },
};
function xrayYama(mat) {
  if (mat.userData.xray) return mat;
  mat.userData.xray = true;
  const eski = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    eski?.call(mat, sh, r);
    Object.assign(sh.uniforms, XR);
    sh.fragmentShader = 'uniform vec2 xrMerkez; uniform float xrYaricap; uniform float xrGuc; uniform float xrSol; uniform vec3 xrRenk;\n' + sh.fragmentShader
      .replace('void main() {', `float xrBayer(vec2 p) {
        ivec2 i = ivec2(mod(p, 4.0));
        float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
        return (m[i.x + i.y * 4] + 0.5) / 16.0;
      }
      void main() {
        float xrD = distance(gl_FragCoord.xy, xrMerkez), xrR = xrYaricap * xrGuc;
        if (xrSol < 0.999 && xrBayer(gl_FragCoord.xy) >= xrSol) discard;   // kamera içinden geçerken seyrelme
        if (xrR > 1.0 && xrD < xrR - 1.2) discard;                         // daire: ürün görünür`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        if (xrR > 1.0) gl_FragColor.rgb = mix(gl_FragColor.rgb, xrRenk, 0.9 * (1.0 - smoothstep(0.0, 1.6, abs(xrD - xrR))));`);
  };
  mat.customProgramCacheKey = () => 'oda-karakter-xray';
  mat.needsUpdate = true;
  return mat;
}

// ---- yükleme ----
let yukleyici = null;
function gltf() {
  // Kendi yükleme yöneticisi: oda onu beklemediği için açılıştaki ilerleme çubuğuna girmez
  if (!yukleyici) { const y = new THREE.LoadingManager(); yukleyici = new GLTFLoader(y).setDRACOLoader(new DRACOLoader(y).setDecoderPath(DRACO)); }
  return yukleyici;
}

// Karakteri yükler (dosya yoksa null). opts: { reduce, zorla: 'merdiven' | 'ip' (iniş aracı), dosya }
// Draco çözücüsünün işçileri yüklemeden sonra kapanır (odanın kendi yükleyicisinin işçileri ayrı; telefonda bellek)
export async function karakterKur(opts = {}) {
  let g;
  try { g = await gltf().loadAsync(opts.dosya ? String(opts.dosya) : DOSYA.href); } catch (e) { console.info('karakter yüklenmedi:', e?.message ?? e); return null; }
  finally { yukleyici?.dracoLoader?.dispose(); yukleyici = null; }
  return karakterOlustur(g, opts);
}

// Odaya karakter ekler (oda sayfası). Sahne modülünü sarar: karakter sahneyle aynı anda yüklenmeye başlar ama odayı
// bekletmez; oda açılınca, perde kalkarken üst kattan iner. Geç gelirse de iner (görünmeyen yükseklikten başladığı için
// geciktiği fark edilmez). Hareket azaltmada ve masada başlatmada oda onu bekler (sonradan masada belirmesin).
// Dosya yoksa ya da yüklenemezse oda onsuz açılır.
//   const kar = odaKarakteri(odaScene, { reduce });
//   const story = await mountStory(root, { sceneModule: kar.sahne, ... });
//   kar.bagla(story).then((k) => ...);   // k: karakter ya da null
// opts: { reduce, zorla: 'merdiven' | 'ip', masada: masada oturarak başlar, sunum: rehberli sunum (core/oda-sunum.js):
// dansın ardından masaya değil odanın ortasına gelip bekler, tıklanan durağa gider }
export function odaKarakteri(sahneModulu, { reduce = false, zorla = null, masada = false, sunum = false } = {}) {
  const bekle = reduce || masada;
  let karakter = null, sahneEsi = null, kuruldu;
  const sahnede = new Promise((r) => { kuruldu = r; }); // karakter sahneye eklenince (gelmeyecekse null)
  const sahne = {
    ...sahneModulu,
    async buildScene(a) {
      const yukle = karakterKur({ reduce, zorla, sunum }).catch((e) => { console.error('karakter', e); return null; });
      const b = await sahneModulu.buildScene(a);
      sahneEsi = a.scene;
      const ekle = (k) => { if (k) { karakter = k; k.sahneye(a.scene, b); } kuruldu(k); };
      if (bekle) ekle(await yukle); else yukle.then(ekle);
      return b;
    },
  };
  return {
    sahne,
    get karakter() { return karakter; },
    // Denetleyici kurulunca çağrılır: karakter tıklamalara ve kameraya bağlanır, hemen gelir
    async bagla(story) {
      const k = await sahnede;
      if (!k) return null;
      // Oda çizilmeye başladıktan sonra geldiyse gölgelendiricileri önceden derle: inerken ilk görünüşünde takılmasın
      // story.derle yalnız isinma açıkken var (oda varsayılanı; çizim hedefine uygun program); yoksa eski yol aynen
      if (!bekle) await (story.derle ? story.derle(k.nesne, sahneEsi) : story.renderer?.compileAsync?.(k.nesne, story.camera, sahneEsi))?.catch(() => {});
      k.bagla(story);
      if (bekle) k.masayaKoy(); else k.asagi();
      return k;
    },
  };
}

// Aynı malzemeli deri parçaları tek ağda birleşir (34 parça → 9) ve hepsi tek iskeleti paylaşır: telefonda çizim
// çağrısı (gölgeyle iki katı) ve karede güncellenen kemik dokusu az olsun. Dokulu malzemenin parçalarına dokunulmaz
function birlestirParcalar(model) {
  const gruplar = new Map();
  let iskelet = null;
  model.traverse((o) => {
    if (!o.isSkinnedMesh || Array.isArray(o.material)) return;
    iskelet ??= o.skeleton;
    const k = `${o.material.uuid}|${o.parent?.uuid}`;
    if (!gruplar.has(k)) gruplar.set(k, []);
    gruplar.get(k).push(o);
  });
  const ayni = (sk) => sk === iskelet || (sk.bones.length === iskelet.bones.length && sk.bones.every((b, i) => b === iskelet.bones[i]));
  for (const g of gruplar.values()) {
    const ilk = g[0];
    const dokulu = Object.values(ilk.material).some((v) => v?.isTexture);
    if (g.length < 2 || dokulu || !g.every((o) => ayni(o.skeleton))) { for (const o of g) if (ayni(o.skeleton)) o.bind(iskelet, o.bindMatrix); continue; }
    const geos = g.map((o) => {
      const x = o.geometry.clone();
      for (const ad of Object.keys(x.attributes)) if (!['position', 'normal', 'skinIndex', 'skinWeight'].includes(ad)) x.deleteAttribute(ad);
      return x;
    });
    const geo = geos.every((x) => x.index) ? mergeGeometries(geos) : null; // tür uyuşmazsa null: parçalar kalır
    geos.forEach((x) => x.dispose());
    if (!geo) { for (const o of g) o.bind(iskelet, o.bindMatrix); continue; }
    const m = new THREE.SkinnedMesh(geo, ilk.material);
    m.name = ilk.material.name || ilk.name;
    m.bind(iskelet, ilk.bindMatrix);
    ilk.parent.add(m);
    for (const o of g) { o.removeFromParent(); o.geometry.dispose(); }
  }
}

// Yüklenmiş glTF'ten karakter (test için ayrı: node'da sahte glTF ile de çalışır)
export function karakterOlustur(g, { reduce = false, zorla = null, sunum: sunumAcik = false } = {}) {
  let ek = {};
  try { ek = JSON.parse(g.scene.userData?.karakter_meta ?? '{}'); } catch (_) { /* bozuk meta: varsayılan */ }
  const M = birlestir(VARSAYILAN, ek), fps = M.fps;
  const koltukYeri = cekilmisKoltuk(M.klip.sirt_ac), dugum = [...DUGUM, ...koltukDugumleri(koltukYeri)];
  const kare2sn = (f) => (f - 1) / fps;

  // Düğüm ağacı: yer (zeminde konum, ψ) → govde (yükseklik) → model (metre → mm)
  const yer = new THREE.Group(), govde = new THREE.Group(), model = g.scene;
  yer.name = 'karakter';
  model.scale.setScalar(1000);
  birlestirParcalar(model);
  govde.add(model);
  yer.add(govde);
  const meshler = [], kemikSet = new Set(), malzemeler = new Set();
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false; // iskelet bağlama pozundan çok uzağa gider (merdiven, oturma)
    for (const m of [o.material].flat()) {
      if (malzemeler.has(m)) continue; // ortak malzeme bir kez
      malzemeler.add(m);
      m.envMapIntensity = (m.envMapIntensity ?? 1) * AYAR.isik;
      xrayYama(m);
    }
    if (o.isSkinnedMesh) o.skeleton.bones.forEach((b) => kemikSet.add(b));
    meshler.push(o);
  });
  // Yalnız gövdeyi taşıyan kemikler (IK hedefleri, dirsek/diz hedefleri, tutma ve kök noktaları gövdenin dışında durur:
  // yakınlık, örtme ve tıklama ölçümüne girmez)
  const kemikler = [...kemikSet].filter((b) => !/IK|hedef|tutma|kök|kulaklık/i.test(b.name));
  const adla = (ad, re) => (ad && model.getObjectByName(ad)) || kemikler.find((b) => re.test(b.name)) || null;
  const kalca = adla(M.kalca, /hips$|kal[cç]a/i) ?? kemikler[0] ?? null;
  const kafa = adla(M.kafa, /head$|kafa$/i);
  const gogus = adla(null, /chest$|spine2$|g[oö]ğ[uü]s$/i) ?? kafa;

  // Klipler
  const mixer = new THREE.AnimationMixer(model);
  const akt = new Map(); // ad → { act, clip, oynadi, ofz }
  for (const clip of g.animations) akt.set(clip.name, { act: mixer.clipAction(clip), clip, oynadi: false, ofz: undefined });
  const var_ = (ad) => akt.has(ad);
  // Oturma klibi ziyaret başına rastgele: Koltuğa Oturma (otur) ya da Oturmaya Geçiş (otur2), dosyada hangisi varsa
  const oturAd = tekrarsiz('otur', ['otur', 'otur2'].filter(var_)) ?? 'otur';

  // Kalça yüksekliği tablosu (iniş kliplerinde: döngüde ne kadar indiğini ve görünürlüğü ölçmek için). Ayrı bir mixer
  // klibi kare kare uygular; kök sıfırda olduğundan kalçanın dünya z'si doğrudan mm
  const kalcaTablo = {};
  if (kalca) {
    const olc = new THREE.AnimationMixer(model), v = new THREE.Vector3();
    for (const ad of ['merdiven', 'ip']) {
      const a = akt.get(ad);
      if (!a) continue;
      const act = olc.clipAction(a.clip).play(), n = Math.ceil(a.clip.duration * fps) + 1, z = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        act.time = Math.min(i / fps, a.clip.duration);
        olc.update(0);
        yer.updateMatrixWorld(true);
        z[i] = kalca.getWorldPosition(v).z;
      }
      kalcaTablo[ad] = z;
      olc.stopAllAction();
      olc.uncacheRoot(model);
    }
  }
  const kalcaZ = (ad, t) => {
    const z = kalcaTablo[ad];
    if (!z) return 700;
    const f = kenet(t * fps, 0, z.length - 1), i = Math.floor(f), u = f - i;
    return z[i] + (z[Math.min(i + 1, z.length - 1)] - z[i]) * u;
  };

  // ---- durum ----
  const ben = { x: 0, y: 0, psi: 0, yer: 'ust', arac: null, inis: null, dansBorcu: true, gorunur: false };
  const koltuk = { obj: null, sirt: null, sirtKatli: -Math.PI / 2, ust: null, ust0: 0, katlama: 0, x: CHAIR.x, y: CHAIR.y, rz: CHAIR.rz, bagli: false, minder: [], minderTaban: 0, minderBoy: 0 };
  let story = null, sahne = null, saat = 0, nesil = 0, kilit = Promise.resolve(), simdiki = null;
  let bakis = null; // null | 'kamera' | 'urun': kafa o yana döner
  let tepkiler = [], sonTepki = -99, uzerinde = false;
  const kareler = new Set();
  // Sunum olayları (core/oda-sunum.js dinler): dans-basla, dans-bitti, bekliyor, vardi, eylem-bitti, elma-al,
  // buzdolabi-bos, isirik, elma-bitti, kobe, isabet, oturdu
  const dinleyiciler = new Set();
  const olay = (ad, v) => { for (const f of dinleyiciler) { try { f(ad, v); } catch (e) { console.error('karakter olay', e); } } };
  const sunum = { aktif: !!sunumAcik, yerTutucu: new Set() };
  const kare = (fn) => new Promise((ok) => { kareler.add((dt) => { const r = fn(dt); if (r) { ok(r); return true; } return false; }); });
  const bekle = (sn, d) => { let t = 0; return kare((dt) => (d && !d() ? 'iptal' : (t += dt) >= sn ? 'tamam' : null)).then((r) => r === 'tamam'); };

  // Klibe geçiş: önceki klipten yumuşak geçiş. Döngüsüz klipte söz bitişte (kesilirse false) döner; döngülüde sure
  // verilirse o kadar sonra, verilmezse hemen.
  function oynat(ad, { tekrar, solma = 0.35, hiz = 1, sure, onBasla, bas = 0 } = {}, d = null) {
    const a = akt.get(ad);
    if (!a) { onBasla?.(); return Promise.resolve(!d || d()); }
    const m = M.klip[ad] || {}, dongu = tekrar ?? !!m.tekrar, act = a.act;
    if (!(simdiki === a && dongu)) {
      act.reset();
      act.setLoop(dongu ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      act.clampWhenFinished = !dongu;
      act.timeScale = hiz;
      act.setEffectiveWeight(1);
      act.play();
      if (bas) act.time = bas; // v8.2: klibin ortasından
      if (simdiki && simdiki !== a) {
        // Çıkan klip kendi solmasının ortasındaysa (yarıda kesilen geçiş) o ağırlıktan söner: three.js fadeOut'u 1'den
        // başlatır, kısa bir sıçrama yapardı
        const o = simdiki.act, w = o.getEffectiveWeight();
        o.stopFading().setEffectiveWeight(w);
        o.crossFadeTo(act, solma, false);
      } else if (!simdiki) act.fadeIn(solma);
    }
    a.oynadi = true;
    a.ofz = a.ofIleri = a.ofKoltuk = undefined;
    a.indi = false;
    a.kayma = anahtar(m.kayma ?? 0, 1);
    a.tutulan = null;
    simdiki = a;
    onBasla?.();
    if (dongu && !sure) return Promise.resolve(true);
    let t = 0;
    return kare((dt) => {
      if (d && !d()) return 'iptal';
      t += dt;
      if (dongu) return t >= sure ? 'tamam' : null;
      if (sure && t >= sure) return 'tamam'; // döngüsüz klip yarıda biter (dans)
      return act.paused || act.time >= a.clip.duration - 1e-4 ? 'tamam' : null;
    }).then((r) => r === 'tamam');
  }
  // Kesilmeyen klip (otur, kalk, sırt açma): yeni görev bitmesini bekler
  function kilitli(ad, opts) { const p = oynat(ad, opts); kilit = p; return p; }

  // ---- yürüme: yol boyunca, dönerek; sonda istenen yöne döner ----
  function engeller() {
    const c = copNoktasi(), E = [...SABIT_ENGEL, ...ekEngel, { d: [c.x, c.y, c.r] }]; // sahnenin ek engelleri, çöp kutusu
    // v8.2: oturmaya gitmiyorken sandalye dairesi 420 (çekilmiş sandalyenin yüksek, eğik sırtı 300'lük dairenin dışına
    // taşıyordu: yürürken baş sırtın kutusundaydı; sunum-test gövde sütunu). Oturmaya giderken 300 (oturma yeri içinde kalmasın)
    if (koltuk.bagli || !koltuk.obj) return E;
    const uz = Math.hypot(ben.x - koltuk.x, ben.y - koltuk.y); // Biggie dairenin içinde başlamasın (yol bulunamaz)
    // v8.3: sandalye artık odada kalıyor: daire yıldız ayağın yarıçapı (~340); 420 armutla arasındaki geçidi kapatıyordu
    // v8.3: masa_kalk sandalyeyi çekik (−90°) bırakır; sırtı dönme ekseninden ~380 mm taşar: yürürken engel sandalyenin
    // kendi kutusu (ayağın dışı biraz içeride), Biggie onun payında başlıyorsa (yeni kalktı) daire
    if (!ben.oturacak && koltuk.obj && uz > 520) {
      const b = new THREE.Box3().setFromObject(koltuk.obj);
      return [...E, { k: [b.min.x + 30, b.max.x - 30, b.min.y + 30, b.max.y - 30] }];
    }
    return [...E, { d: [koltuk.x, koltuk.y, ben.oturacak ? 300 : Math.max(300, Math.min(340, uz - AYAR.pay - 20))] }];
  }
  async function yuru(hedef, d, { son = 'dur' } = {}) {
    const E = engeller(), yol = yolBul({ x: ben.x, y: ben.y }, hedef, E, dugum);
    await oynat('yuru', { solma: 0.3 });
    const a = akt.get('yuru');
    let i = 0, t = 0;
    ben.yolKalan = () => yol.slice(i); // v8.5: robot süpürge Biggie'nin yürüdüğü yolun kalanından uzak durur
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      t += dt;
      const p = yol[i], dx = p.x - ben.x, dy = p.y - ben.y, uz = Math.hypot(dx, dy), sonNokta = i === yol.length - 1;
      // Düğüme varmadan sonrakine dönmek köşeyi keser: yalnız oradan sonraki düğüme yol açıksa (balkondaki dar geçit)
      if (!sonNokta && (uz < 40 || (uz < 160 && serbest(ben, yol[i + 1], E, AYAR.pay)))) { i++; return null; }
      if (sonNokta && uz < 25) {
        ben.x = p.x; ben.y = p.y;
        if (hedef.psi === undefined) return 'tamam';
        const e = fark(ben.psi, hedef.psi); // vardı: yerinde döner
        if (Math.abs(e) < 0.04) { ben.psi = hedef.psi; return 'tamam'; }
        ben.psi += kenet(e, -AYAR.donusYerinde * dt, AYAR.donusYerinde * dt);
        if (a) a.act.timeScale = 0.85;
        return null;
      }
      const e = fark(ben.psi, aciOf(dx, dy));
      ben.psi += kenet(e, -AYAR.donus * dt, AYAR.donus * dt);
      const k = Math.max(0, Math.cos(e)) ** 2 * Math.min(1, t / 0.35) * (sonNokta ? Math.min(1, 0.35 + uz / 260) : 1);
      const h = AYAR.hizYuru * k;
      ben.x += Math.sin(ben.psi) * h * dt;
      ben.y -= Math.cos(ben.psi) * h * dt;
      if (a) a.act.timeScale = 0.6 + 0.4 * k; // yavaşlarken adım da yavaşlar (ayak az kayar)
      return null;
    });
    if (a) a.act.timeScale = 1;
    ben.yolKalan = null;
    if (r !== 'tamam') return false;
    if (son) await oynat(son, { tekrar: true, solma: 0.35 });
    return d();
  }

  // ---- koltukla kayma: kök ve koltuk birlikte, eğri üzerinde döne döne ----
  async function kaydir(hedef, d, { hiz = 1 } = {}) {
    const b = { x: ben.x, y: ben.y, psi: ben.psi }, de = fark(b.psi, hedef.psi);
    const uz = Math.hypot(hedef.x - b.x, hedef.y - b.y);
    if (uz < 5 && Math.abs(de) < 0.02) return true;
    // Kontrol noktası: iki ucun ortası, bakış yönünün tersine biraz çekilmiş (koltuk geri itilip döner)
    const [fx, fy] = yon(b.psi), c = { x: (b.x + hedef.x) / 2 - fx * uz * 0.25, y: (b.y + hedef.y) / 2 - fy * uz * 0.25 };
    const T = Math.max(uz / AYAR.hizKaydir, Math.abs(de) / AYAR.donusKaydir) / hiz + 0.4;
    if (var_('kaydir')) await oynat('kaydir', { solma: 0.4 });
    else if (simdiki?.clip.name !== 'otur' && KENAR_KLIP.some(var_)) await oynat(KENAR_KLIP.find(var_), { tekrar: true, solma: 0.4 });
    let t = 0;
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      t += dt;
      const u = yumusak(Math.min(1, t / T)), v = 1 - u;
      ben.x = v * v * b.x + 2 * v * u * c.x + u * u * hedef.x;
      ben.y = v * v * b.y + 2 * v * u * c.y + u * u * hedef.y;
      ben.psi = b.psi + de * u;
      return t >= T ? 'tamam' : null;
    });
    return r === 'tamam' && d();
  }

  // ---- iniş / çıkış: iniş klibi elle sürülür (döngü kareleri tekrar eder, kök döngü başına iner) ----
  const arac = { merdiven: null, ip: null }; // sahnedeki merdiven ve ip (sahneye eklenince)
  function inisYeri(ad) { // kök: merdivenin / ipin önünde, yüzü korkuluğa (+y)
    const ms = ad === 'ip' ? M.ip.mesafe : M.merdiven.mesafe;
    return { x: INIS_X, y: INIS_Y - ms, psi: Math.PI };
  }
  function inisKur(ad) {
    const a = akt.get(ad), k = M.klip[ad];
    const [da, db] = k.dongu.map(kare2sn), [sa, sb] = k.son.map(kare2sn).map((x) => Math.min(x, a.clip.duration));
    const H = (t) => kalcaZ(ad, t);
    const dus = Math.max(1, H(da) - H(db)), ek = H(sa) - H(db), L = db - da;
    const n = Math.max(1, Math.ceil((AYAR.gizliZ - (H(da) + ek)) / dus) + 1);
    const T = n * L + (sb - sa);
    const durum = (tau) => {
      if (tau < n * L) { const c = Math.floor(tau / L); return { zaman: da + (tau - c * L), ofz: ek + (n - 1 - c) * dus }; }
      return { zaman: sa + (tau - n * L), ofz: 0 };
    };
    return { ad, a, T, durum, H, tau: 0 };
  }
  // Merdiven / ip üst kattan kayarak iner, toplanırken yukarı çekilir (hareket azaltmada inip çıkılmaz: hiç çağrılmaz)
  function araciGoster(ad, acik, d = null) {
    const o = arac[ad];
    if (!o) return Promise.resolve();
    o.visible = true;
    const hedef = acik ? 0 : 2600, z0 = o.position.z;
    let t = 0;
    return kare((dt) => {
      if (d && !d()) return 'iptal'; // yeni görev aracı yeniden indiriyor: toplama yarıda kalır
      t += dt;
      const u = Math.min(1, t / 0.9);
      o.position.z = z0 + (hedef - z0) * (acik ? 1 - (1 - u) ** 3 : u * u);
      if (u >= 1) { o.visible = acik; return 'tamam'; }
      return null;
    });
  }
  // Yön: +1 iner, −1 çıkar. Bitince true (yerde ya da üstte)
  async function merdivende(yonu, d) {
    const s = ben.inis;
    s.yon = yonu;
    if (simdiki !== s.a) {
      s.a.act.reset();
      s.a.act.setLoop(THREE.LoopRepeat, Infinity);
      s.a.act.timeScale = 0; // zamanı biz veririz
      s.a.act.setEffectiveWeight(1);
      s.a.act.play();
      if (simdiki) simdiki.act.crossFadeTo(s.a.act, 0.4, false);
      s.a.oynadi = true;
      simdiki = s.a;
    }
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      const { zaman } = s.durum(s.tau), z = s.H(zaman) + s.durum(s.tau).ofz;
      const k = 1 + (AYAR.hizliIn - 1) * aralik(z, AYAR.gorunurZ[0], AYAR.gorunurZ[1]);
      s.tau = kenet(s.tau + yonu * dt * k, 0, s.T);
      return (yonu > 0 && s.tau >= s.T) || (yonu < 0 && s.tau <= 0) ? 'tamam' : null;
    });
    return r === 'tamam';
  }
  async function in_(d) {
    if (ben.yer === 'ust') {
      const ad = zorla ?? tekrarsiz('inis', ['ip', 'merdiven'].filter(var_)) ?? 'merdiven';
      if (!var_(ad)) { yereKoy(inisYeri(ad)); ben.yer = 'zemin'; ben.gorunur = true; return d(); } // klip yoksa yere konur
      ben.arac = ad;
      ben.inis = inisKur(ad);
      Object.assign(ben, inisYeri(ad));
      await araciGoster(ad, true);
      if (!d()) return false;
      ben.yer = 'merdiven';
      ben.gorunur = true;
    }
    if (!(await merdivende(1, d))) return false;
    ben.yer = 'zemin';
    ben.inis.a.ofz = 0;
    return d();
  }
  async function cik(d) {
    if (ben.yer === 'ust') return true;
    if (ben.yer === 'zemin') {
      const ad = ben.arac ?? (var_('merdiven') ? 'merdiven' : 'ip');
      if (!var_(ad)) { ben.yer = 'ust'; ben.gorunur = false; return d(); }
      ben.arac = ad;
      if (!(await yuru(inisYeri(ad), d, { son: null }))) return false;
      if (!arac[ad]?.visible) await araciGoster(ad, true);
      ben.inis = inisKur(ad);
      ben.inis.tau = ben.inis.T;
      ben.yer = 'merdiven';
    }
    if (!(await merdivende(-1, d))) return false;
    ben.yer = 'ust';
    ben.gorunur = false;
    ben.dansBorcu = true;
    await araciGoster(ben.arac, false, d);
    if (!d()) return false; // toplanırken geri inmesi istendi: araç ve aracın adı yeni inişin
    ben.arac = null;
    return true;
  }

  // ---- koltuk ----
  const koltukYuz = () => koltuk.rz + Math.PI;           // koltuğa oturanın ψ'si (koltuğun önü yerel +y)
  function kavrama() { // katlı koltuğun arkasında, ona bakarak (masaya itilmiş koltuğu kendine çeker)
    const psi = koltukYuz(), [fx, fy] = yon(psi), g = M.klip.sirt_ac.kavrama;
    return { x: koltuk.x - fx * g, y: koltuk.y - fy * g, psi: fark(0, psi) };
  }
  function oturmaYeri(ad = oturAd) { // koltuk arkasında kalacak şekilde önünde, koltuğun baktığı yöne bakarak (klibin başı)
    const psi = koltukYuz(), [fx, fy] = yon(psi), g = anahtar(M.klip[ad]?.koltuk ?? M.klip.otur.koltuk, 1);
    return { x: koltuk.x + fx * g, y: koltuk.y + fy * g, psi };
  }
  // Klibin gövde kaymasını ('ileri') köke aktarır: görüntü değişmez, sonraki klipler (kayma, yazma) kendi eşlemesinde
  // başlar. Kök ileri o kadar kayar, koltuk kökün arkasında o kadar yakına gelir
  function govdeyiKokeAktar(ad) {
    const a = akt.get(ad), m = M.klip[ad];
    if (!a || !m?.ileri) return;
    const f = a.act.time * fps + 1, o = anahtar(m.ileri, f), [fx, fy] = yon(ben.psi);
    ben.x += fx * o;
    ben.y += fy * o;
    a.ofIleri = 0;
    if (m.koltuk !== undefined) a.ofKoltuk = anahtar(m.koltuk, f) + o;
  }
  // Oturuş etkisi (klibin iniş karesinde): minder ezilip yaylanarak toparlanır (karakter onunla çöker), oturak karakterle
  // birlikte kendi ekseninde sönerek sallanır. Yön rastgele; hareket azaltmada yok
  let etki = null;
  function oturmaEtkisi() { if (!reduce && koltuk.ust) etki = { t0: saat, yon: Math.random() < 0.5 ? -1 : 1 }; }
  // Bu karenin etkisi: ez minderin ezilme oranı, sw oturağın sallanması (rad); etki yoksa null
  function oturmaEtkisiKaresi() {
    if (!etki) return null;
    const t = saat - etki.t0;
    const ez = t > 1.6 ? 0 : AYAR.minderEz * Math.exp(-t / 0.2) * Math.cos((2 * Math.PI * t) / 0.42) * Math.min(1, t / 0.05);
    const sw = t > 2.6 ? 0 : AYAR.donme * etki.yon * Math.exp(-t / 0.6) * Math.sin((2 * Math.PI * t) / 1.3);
    if (t > 2.6) etki = null;
    return { ez, sw };
  }
  // Oturak salınımı: oturanın göğsü yana kaydıkça (emote, yazarken kıpırdanma) oturak çok hafif döner, yaylanarak
  // durulur. Yavaş değişen ortalamaya göre ölçülür: yalnız hareket salındırır, duruş değil. Hareket azaltmada yok
  const salin = { a: 0, v: 0, taban: null }, gv = new THREE.Vector3();
  function salinimHesapla(dt) {
    let hedef = 0;
    if (koltuk.bagli && gogus && !reduce) {
      // Göğsün yana kayması oturak dönüşü katılmadan, bu karenin kökünde ölçülür: yer henüz önceki karenin dönüşümünde,
      // göğüs yere göre okunup bu karenin köküne taşınır (gövdenin ileri ve yukarı kayması yana etmez)
      const l = yer.worldToLocal(gogus.getWorldPosition(gv)), c = Math.cos(ben.psi), s = Math.sin(ben.psi);
      const gx = ben.x + c * l.x - s * l.y, gy = ben.y + s * l.x + c * l.y;
      const [fx, fy] = yon(ben.psi), yan = (gx - koltuk.x) * fy - (gy - koltuk.y) * fx;
      salin.taban = salin.taban === null ? yan : salin.taban + (yan - salin.taban) * Math.min(1, dt * 0.7);
      hedef = kenet((yan - salin.taban) * AYAR.salinim, -AYAR.salinimEnCok, AYAR.salinimEnCok);
    } else salin.taban = null;
    const [k, c] = AYAR.salinimYay;
    salin.v += (k * (hedef - salin.a) - c * salin.v) * dt;
    salin.a += salin.v * dt;
  }
  // Üzerine gelince dönme: genel planda fare masadaki gizli ürünün (bugün kalemliğin yerindeki figur yuvası) üzerinde
  // durunca karakter koltuğuyla birlikte o ürünü açan yana döner, fare gidince geri döner (tıklama gerekmez). Masadayken
  // (kenarda ya da kayarken değil), yakın plan yokken; dokunmatikte fare yok
  // Giriş donBekle sonra (dönük değilken), dönükken başka ürüne geçiş hemen, çıkış donBirak sonra
  const donus = { a: 0, v: 0, zone: null, t0: 0, hedef: 0, son: -9, odak: null, zorla: null };
  function donusHedefi() {
    if (story && story.focusedId !== donus.odak) { donus.odak = story.focusedId; fare.zone = null; } // imleç bayat kalmasın
    if (donus.zorla !== null && ben.yer === 'koltuk') return (donus.hedef = donus.zorla); // v8.3: oturarak atış
    const z = donAcisi(fare.zone) !== undefined ? fare.zone : null;
    if (z !== donus.zone) { donus.zone = z; donus.t0 = saat; }
    if (reduce || !story || story.focusedId || ben.yer !== 'koltuk' || !koltuk.bagli
      || Math.hypot(ben.x - YER.masa.x, ben.y - YER.masa.y) > 30) return (donus.hedef = 0);
    if (z && (donus.hedef !== 0 || saat - donus.t0 >= AYAR.donBekle)) { donus.hedef = donAcisi(z); donus.son = saat; }
    else if (!z && donus.hedef !== 0 && saat - donus.son > AYAR.donBirak) donus.hedef = 0;
    return donus.hedef;
  }
  const donuk = () => donusHedefi() !== 0;
  function donusHesapla(dt) {
    const h = donusHedefi(), w = AYAR.donYay;
    donus.v += (w * w * (h - donus.a) - 2 * w * donus.v) * dt;
    donus.a += donus.v * dt;
  }
  function oturuYer() { // oturmuşken kökün bulunduğu yer (kalkmadan önce buraya kayar)
    const r = koltukYeri, psi = r.rz + Math.PI, [fx, fy] = yon(psi), g = anahtar(M.klip.otur.koltuk, 1);
    return { x: r.x + fx * g, y: r.y + fy * g, psi: fark(0, psi) };
  }

  // ---- görevler ----
  function yonet(hedef) {
    const nes = ++nesil, d = () => nes === nesil;
    (async () => {
      await kilit;
      if (!d()) return;
      try { await (typeof hedef === 'function' ? hedef(d) : hedef === 'oda' ? odayaGel(d) : yukariCik(d)); } catch (e) { console.error('karakter', e); }
    })();
  }
  // Dans başlarken ve bitince olay yayılır (sunumun yazıları dansın üstünde); dans yoksa ya da yarıda kesilirse de biter
  async function dansEt(d) {
    const varolan = DANSLAR.filter(var_);
    ben.dansBorcu = false;
    olay('dans-basla', { klip: varolan.length ? 'dans' : null });
    if (!varolan.length) { olay('dans-bitti', { tamam: true }); return true; }
    bakis = 'kamera';
    const ok = await oynat(tekrarsiz('dans', varolan), { solma: 0.4, sure: AYAR.dansSure }, d);
    bakis = null;
    olay('dans-bitti', { tamam: ok });
    if (!ok) return false;
    await oynat('dur', { tekrar: true, solma: 0.45 });
    return bekle(AYAR.dansBekle[1], d);
  }
  // v6: yarıda kesilen durak eyleminin kapanışı (yeni görev yürümeden önce; kesilmez, sonraki görev de bekler).
  // Klibin meta'sında çıkış bölümü (cikis: [kare, kare]; tv_armut armuttan kalkış, egil_bak doğrulma) varsa oraya atlanır
  // ve sonuna dek oynar (oturmadan önce kesildiyse atlanmaz: yumuşak geçiş yeter); diz pozundaysa (diz_cok,
  // kutu_al_diz) diz_kalk oynar, diz_kalk sürüyorsa biter
  const DIZ = new Set(['diz_cok', 'kutu_al_diz']);
  async function eylemKapat() {
    const a = simdiki, ad = a?.clip.name, m = (ad && M.klip[ad]) || {};
    if (!a || ad === 'yuru' || ad === 'dur') return;
    const bitti = () => a.act.time >= a.clip.duration - 1e-3;
    let p = null;
    const ck = CIKIS_KLIP[ad];
    if (ck && var_(ck)) p = oynat(ck, { solma: 0.25, tekrar: false });
    else if ((ad === 'diz_kalk' || ad === 'armut_kalk') && !bitti()) p = kare(() => (simdiki !== a || bitti() ? 'tamam' : null));
    else if (Array.isArray(m.cikis) && !m.tekrar && !bitti()) {
      const f = a.act.time * fps + 1, c0 = m.cikis[0];
      if (f < c0) {
        const otur = typeof m.oturdu === 'number' ? m.oturdu : c0 * 0.25;
        if (f < otur * 0.6) return; // henüz inmedi: yürüyüşe geçiş yeter
        a.act.time = kare2sn(c0) - 1 / fps;
      }
      p = kare(() => (simdiki !== a || bitti() ? 'tamam' : null));
    }
    if (!p) return;
    kilit = p;
    olay('eylem-kapat', { klip: ad, cikis: ck ?? null });
    await p;
  }
  // Yerdeyken (merdivende ya da üstteyse önce iner; koltuktaysa kalkar)
  async function yereIn(d) {
    await eylemKapat();
    if (ben.yer === 'ust' || ben.yer === 'merdiven') { if (!(await in_(d))) return false; }
    if (ben.yer === 'koltuk') {
      if (yeniOturus) { await masaKalk(); if (sunum.aktif) ben.yeniKalkti = true; return d(); }
      if (!(await kaydir(oturuYer(), d))) return false;
      kalktiOlayi();
      await kilitli('kalk', { solma: 0.3 });
      koltuk.bagli = false;
      ben.yer = 'zemin';
      if (sunum.aktif) ben.yeniKalkti = true;
    }
    return d();
  }
  // ---- v8.3 (Blender masa_otur / masa_kalk; kullanıcı: sihirli kayma ve sandalyenin çevresinde dolaşma yok) ----
  // Kök klip boyunca masa durağında (YER.masa, bakış masaya); gövde klibin içinde yürür. Biggie önce gövdenin klipteki
  // başlangıç yerine (govde_yol) yürür, kök masa durağına alınır, klip oynar; sandalye her karede koltuk_yol'da
  // ([kare, [x, y] karakter yereli mm, rz derece, + sola, 0 = önü masaya]), kökün yüksekliği klibin z'sinden. Kalkınca
  // sandalye klibin bıraktığı yerde odada kalır (çekik, −90°); yeniden oturulunca koltuk_yol'da sandalyenin şimdiki
  // duruşuna en yakın kareden (sandalyeyi çekme adımı atlanır) devam eder
  const yeniOturus = var_('masa_otur') && var_('masa_kalk') && Array.isArray(M.klip.masa_otur?.koltuk_yol);
  function yolAnahtar(yol, f) {
    let i = 0;
    while (i < yol.length - 1 && yol[i + 1][0] <= f) i++;
    const a = yol[i], b = yol[Math.min(i + 1, yol.length - 1)], u = b[0] > a[0] ? kenet((f - a[0]) / (b[0] - a[0]), 0, 1) : 0;
    return { x: a[1][0] + (b[1][0] - a[1][0]) * u, y: a[1][1] + (b[1][1] - a[1][1]) * u, rz: (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * u };
  }
  const yerelMasa = (v) => yerelDunya(v, YER.masa.x, YER.masa.y, YER.masa.psi);
  function koltukYolu(m, f) {
    const p = yolAnahtar(m.koltuk_yol, f), w = yerelMasa([p.x, p.y]);
    return { x: w[0], y: w[1], rz: YER.masa.psi + Math.PI + (p.rz * Math.PI) / 180 };
  }
  // Klip oynarken sandalye koltuk_yol'da (klip değişince ya da bitince bırakır)
  function koltukSur(ad) {
    const a = akt.get(ad), m = M.klip[ad];
    return kare(() => {
      if (simdiki !== a) return 'tamam';
      Object.assign(koltuk, koltukYolu(m, a.act.time * fps + 1));
      return a.act.time >= a.clip.duration - 1e-3 ? 'tamam' : null;
    });
  }
  // Sandalyenin şimdiki duruşuna en yakın masa_otur karesi (oturmadan önceki bölümde: 'sicrama'ya dek)
  function oturusKaresi() {
    const m = M.klip.masa_otur, son = (m.sicrama?.[0] ?? 72) - 4;
    let en = 1, enD = Infinity;
    for (const [f] of m.koltuk_yol) {
      if (f > son) break;
      const p = koltukYolu(m, f), dd = Math.hypot(p.x - koltuk.x, p.y - koltuk.y) + 300 * Math.abs(fark(p.rz, koltuk.rz));
      if (dd < enD) { enD = dd; en = f; }
    }
    return enD < 120 ? en : null;
  }
  async function masaOtur(d) {
    const m = M.klip.masa_otur;
    let fs = oturusKaresi();
    if (fs === null) fs = 1; // sandalye beklenmedik bir yerdeyse: klibin başı (sandalye yola oturur)
    const g = m.govde_yol ? yolAnahtar(m.govde_yol, fs) : { x: m.baslangic_govde_mm?.[0] ?? -600, y: m.baslangic_govde_mm?.[1] ?? 60 };
    const w = yerelMasa([g.x, g.y]);
    if (!(await yuru({ x: w[0], y: w[1], psi: YER.masa.psi }, d, { son: 'dur' }))) return false;
    // Kök masa durağına (gövde yerinde kalır: klibin bu karesinde gövde kökün yerelinde g'de), anında geçiş
    Object.assign(ben, { x: YER.masa.x, y: YER.masa.y, psi: YER.masa.psi });
    ben.masaGecis = true;
    koltuk.bagli = false;
    ben.yer = 'koltuk';
    const p = kilitli('masa_otur', { solma: 0.05, bas: fs > 1 ? kare2sn(fs) : 0 });
    koltukSur('masa_otur');
    const ok = await p;
    ben.masaGecis = false;
    koltuk.bagli = true;
    if (!ok || !d()) return false;
    return true;
  }
  async function masaKalk() {
    const m = M.klip.masa_kalk;
    if (Math.hypot(ben.x - YER.masa.x, ben.y - YER.masa.y) > 20) await kaydir(YER.masa, () => true); // kenara çekilmişse
    Object.assign(ben, { x: YER.masa.x, y: YER.masa.y, psi: YER.masa.psi });
    ben.masaGecis = true;
    koltuk.bagli = false;
    const an = m.kalkmaya_basla ? kare2sn(m.kalkmaya_basla) : 0;
    let t = 0;
    kare((dt) => ((t += dt) >= an ? (olay('kalkti'), 'tamam') : null));
    const p = kilitli('masa_kalk', { solma: 0.3 });
    koltukSur('masa_kalk');
    await p;
    // Gövde klibin sonunda kökün yerelinde bitis_govde_mm'de: kök oraya, ayakta duruşa anında
    const w = yerelMasa(m.bitis_govde_mm ?? [-600, 60]);
    Object.assign(ben, { x: w[0], y: w[1] });
    Object.assign(koltuk, koltukYolu(m, 1e4));
    ben.yer = 'zemin';
    ben.masaGecis = false;
    await oynat('dur', { tekrar: true, solma: 0.05 });
  }
  // v6: sunumda masadan kalkınca sandalye çekilmiş yerinde (masanın ~0,7 m önünde) kalıyor, kitaplık ile oda arasındaki
  // geçidi kapatıyordu (yol bulunamadı, Biggie içinden yürüdü). Biggie 0,7 m uzaklaşınca sandalye masanın altına geri
  // kayar ve katlanır (ilk hâli; sonraki oturuşta sırt açma klibiyle yeniden çekilir)
  let koltukNesil = 0;
  function koltukToparla() {
    if (!koltuk.obj || !koltuk.ev) return;
    const ns = ++koltukNesil;
    let t = -1, b = null;
    kare((dt) => {
      if (ns !== koltukNesil || koltuk.bagli) return 'tamam';
      // v8.1: Biggie hem sandalyeden hem sandalyenin masa altındaki yerinden uzaklaşınca (yoksa toparlanan sandalye onun içinden geçiyordu)
      // v8.2: sandalyenin masa altına gideceği yolun (şimdiki yer → ev) her noktasına uzaklık 750'den az iken başlamaz
      if (t < 0) {
        const ax = koltuk.x, ay = koltuk.y, bx = koltuk.ev.x - ax, by = koltuk.ev.y - ay, L2 = bx * bx + by * by || 1;
        const u = Math.min(1, Math.max(0, ((ben.x - ax) * bx + (ben.y - ay) * by) / L2));
        if (Math.hypot(ben.x - (ax + bx * u), ben.y - (ay + by * u)) < 750) return null;
        t = 0; b = { x: koltuk.x, y: koltuk.y, rz: koltuk.rz, k: koltuk.katlama }; }
      t = Math.min(1, t + dt / 1.2);
      const u = yumusak(t);
      koltuk.x = b.x + (koltuk.ev.x - b.x) * u; koltuk.y = b.y + (koltuk.ev.y - b.y) * u;
      koltuk.rz = b.rz + fark(b.rz, koltuk.ev.rz) * u; koltuk.katlama = b.k + (1 - b.k) * u;
      return t >= 1 ? 'tamam' : null;
    });
  }
  async function odayaGel(d) {
    if (reduce) { masayaKoy(); return; }
    if (ben.yer === 'ust' || ben.yer === 'merdiven') { if (!(await in_(d))) return; }
    if (ben.yer === 'zemin') {
      if (ben.dansBorcu) {
        if (!(await yuru(YER.esik, d))) return;
        if (!(await bekle(AYAR.dansBekle[0], d))) return;
        if (!(await dansEt(d))) return;
      }
      // Rehberli sunum: masaya değil odanın ortasına gelir, bekler (tıklanan durağa durakaGit götürür)
      if (sunum.aktif) {
        if (!(await yuru(SUNUM_BEKLE, d))) return;
        olay('bekliyor');
        await bosta(d);
        return;
      }
      if (!(await koltugaOtur(d))) return;
    }
    if (ben.yer === 'koltuk') {
      if (!(await kaydir(YER.masa, d))) return;
      await masaDongusu(d);
    }
  }
  // Yerden sandalyeye: katlıysa çekip sırtını açar, oturur (sunumda masa durağı da bunu kullanır)
  async function koltugaOtur(d) {
    koltukNesil++; // süren geri kayma durur (sandalye o anki yerinden çekilir)
    ben.oturacak = true;
    try { return await koltugaOtur0(d); } finally { ben.oturacak = false; }
  }
  async function koltugaOtur0(d) {
    if (elma.elde && !elma.masada) { if (!(await firsat(d, { bekle: true }))) return false; } // masaya elmayla oturmaz (v8.3: masada yemeye gidiyorsa oturur)
    if (yeniOturus && koltuk.obj) return masaOtur(d);
    if (koltuk.obj && koltuk.katlama > 0.5) { // katlı: arkasına gidip masadan düz çeker, sonra sırtını açar
      if (!(await yuru(kavrama(), d))) return false;
      if (var_('sirt_ac')) await kilitli('sirt_ac'); // klip koltuğu kendisi çeker (kayma, tut)
      else Object.assign(koltuk, koltukYeri); // klip yoksa (eski dosya) koltuk çekilmiş yerinde açılır
      koltuk.katlama = 0;
      if (!d()) return false;
    }
    if (koltuk.obj) {
      if (!(await yuru(oturmaYeri(), d))) return false;
      await kilitli(oturAd, { solma: 0.3, hiz: oturAd === 'otur' ? AYAR.oturHiz : 1, onBasla: () => { koltuk.bagli = true; ben.yer = 'koltuk'; } });
      govdeyiKokeAktar(oturAd);
      if (!d()) return false;
    }
    return true;
  }
  async function yukariCik(d) {
    bakis = null;
    if (ben.yer === 'koltuk') {
      if (yeniOturus) await masaKalk();
      else {
        if (!(await kaydir(oturuYer(), d))) return;
        kalktiOlayi();
        await kilitli('kalk', { solma: 0.3 });
        koltuk.bagli = false;
        ben.yer = 'zemin';
      }
      if (!d()) return;
    }
    await cik(d);
  }

  // 'kalkti' (sunum: monitör durur) kalk klibinin kalkmaya_basla karesinde (meta sinir; yoksa hemen)
  function kalktiOlayi() {
    const f = M.klip.kalk?.sinir?.kalkmaya_basla, an = var_('kalk') && f ? kare2sn(f) : 0;
    let t = 0;
    if (!an) { olay('kalkti'); return; }
    kare((dt) => ((t += dt) >= an ? (olay('kalkti'), 'tamam') : null));
  }
  // ---- rehberli sunum: durağa gidip eylem, elma, çöp (core/oda-sunum.js) ----
  // Sözleşmedeki klip yoksa ayakta yer tutucu (YER_TUTUCU); hangi adların eksik olduğu sunum.yerTutucu'da
  const klipAd = (ad) => {
    if (!ad) return var_('dur') ? 'dur' : null;
    if (var_(ad)) return ad;
    sunum.yerTutucu.add(ad);
    const y = YER_TUTUCU[ad] ?? 'dur';
    return var_(y) ? y : null;
  };
  // Duraktaki eylem: döngülü klip (yer tutucu 'dur') sure kadar, döngüsüz klip sonuna dek; kesilirse false
  function eylem(ad, d, { sure = AYAR.durakSure } = {}) {
    let k = klipAd(ad);
    // Masa başı klibi (kökü koltuk yüksekliğine kaldırır, oturuş pozu: bekle, kafa_salla...) ayakta oynamaz: 'dur'
    if (k && k !== 'dur' && !OTURUS_SERBEST.has(k) && anahtar(M.klip[k]?.z ?? 0, 1) > 100) { sunum.yerTutucu.add(`${ad}(oturuş klibi)`); k = var_('dur') ? 'dur' : null; }
    if (!k) return bekle(sure, d);
    return M.klip[k]?.tekrar ? oynat(k, { solma: 0.35, tekrar: true, sure }, d) : oynat(k, { solma: 0.35, tekrar: false }, d);
  }
  const klipSure = (ad, sure) => { const k = klipAd(ad); return k && !M.klip[k]?.tekrar ? akt.get(k).clip.duration : sure; };
  // Boşta: ayakta bekler; elma bittiyse ilk fırsatta çöpe atar
  async function bosta(d) {
    await oynat('dur', { tekrar: true, solma: 0.4 });
    while (d()) {
      if (elma.elde && elma.bitti && !elma.atiliyor) { if (!(await firsat(d))) return; await oynat('dur', { tekrar: true, solma: 0.4 }); continue; }
      if (!(await kare(() => (!d() ? 'iptal' : elma.elde && elma.bitti ? 'uyan' : null)))) return;
    }
  }
  // D: { id, yer: [x, y] mm, yon: derece (ψ: 0 kameraya, 90 sağa, 180 masaya), klip, sure }
  async function durakGorevi(D, d) {
    // v6: masa durağı (bilgisayar): sandalyeye oturur, masaya kayar, yazar ('oturdu': sunum monitörü açar). Sonraki
    // durakta yereIn kaldırır ('kalkti': monitör durur)
    if (D.masa) {
      if (ben.yer !== 'koltuk') {
        if (!(await yereIn(d))) return;
        ben.dansBorcu = false;
        if (!(await koltugaOtur(d))) return;
      }
      olay('vardi', { id: D.id });
      if (!(await kaydir(YER.masa, d))) return;
      await masaDongusu(d);
      return;
    }
    if (!(await yereIn(d))) return;
    ben.dansBorcu = false;
    const psi = fark(0, ((D.yon ?? 0) * Math.PI) / 180);
    let hx = D.yer[0], hy = D.yer[1];
    // Buzdolabı (v5): klibin meta'sında menteşe (karakter yerelinde mm: −y ileri, +x sol) varsa Biggie kapağın gerçek
    // menteşesine göre durur: eli kolu klipteki yerde tutsun
    const mm = D.id === 'buzdolabi' ? M.klip[klipAd(elma.kalan > 0 ? D.klip ?? 'buzdolabi_ac' : D.yedek ?? 'buzdolabi_bos')]?.mentese : null;
    // Çapa (v5): klibin meta'sındaki yerel nokta (ör. tv_armut armut.eksen_mm) dünyadaki noktaya otursun
    const cv = D.capa ? metaYol(M.klip[D.capa.klip ?? D.klip] ?? {}, D.capa.anahtar) : null;
    if (Array.isArray(cv) && var_(D.capa.klip ?? D.klip)) [hx, hy] = kokYeri(D.capa.nokta, cv, psi);
    else if (Array.isArray(mm) && kapakBul()) {
      const h = kapakObj.getWorldPosition(new THREE.Vector3()), [fx, fy] = yon(psi), lx = -fy, ly = fx, v = buzDurus(D, mm);
      hx = h.x - (v[0] * lx - v[1] * fx); hy = h.y - (v[0] * ly - v[1] * fy);
    }
    // v8.1 (kullanıcı: kitaplığa giderken masanın ve sandalyenin içinden geçiyordu): masadan yeni kalktıysa önce masaya
    // paralel, hedefin tarafına bir adım (çekilmiş sandalye arkasında, yol bulma onun dairesinin içinden başlıyordu)
    if (ben.yeniKalkti) {
      ben.yeniKalkti = false;
      // v8.3: masaya paralel (y aynı): sandalye arkasında (AYAR.koltukBirak), adım onun önünden geçmesin
      const yan = Math.sign(hx - ben.x) || -1, ara = { x: kenet(ben.x + yan * 480, ROOM.x0 + 600, ROOM.x1 - 400), y: ben.y - 25 };
      // v8.3: adım yürüyüşün payıyla serbest değilse (sandalye o yanda) yapılmaz: yol bulma adımı sandalyenin
      // arkasından dolaştırıp onun içinden geri getiriyordu
      const E = engeller(), ic = E.some((e) => (e.k ? kutuUzak(ara, e.k) < AYAR.pay : Math.hypot(ara.x - e.d[0], ara.y - e.d[1]) < e.d[2] + AYAR.pay));
      if (!ic && serbest(ben, ara, E, AYAR.pay)) { if (!(await yuru(ara, d, { son: null }))) return; } // adımın ucu engelde değil (serbest uçta payı küçültür)
    }
    if (!(await yuru({ x: hx, y: hy, psi }, d, { son: null }))) return;
    olay('vardi', { id: D.id });
    const ok = D.id === 'buzdolabi' ? await buzdolabiGorevi(D, d) : D.dizi ? await diziOyna(D.dizi, d) : await eylem(D.klip, d, { sure: D.sure ?? AYAR.durakSure });
    if (!ok || !d()) { D.iptal?.(); return; }
    // v8.2 (kullanıcı): elmayı alınca odanın uzak köşesine (armut tarafı) yürür, orada duraklayarak yer; bitince oradan
    // çöpe atar (bosta → firsat)
    if (D.id === 'buzdolabi' && elma.elde && !elma.bitti && sunum.aktif) {
      // v8.3 (kullanıcı): elmayı alınca masaya gider, sandalyesine oturur, orada ısırarak yer; bitince oturduğu yerden
      // çöpe atar ("Kobe!"), sonra çalışmaya döner
      if (D.masaya) { olay('eylem-bitti', { id: D.id }); if (await masadaElma(d)) await masaDongusu(d); return; }
      if (!(await yuru(ELMA_KOSE, d, { son: 'dur' }))) return;
    }
    olay('eylem-bitti', { id: D.id });
    // v7: eylemden sonra pozunda bekler (diz_bekle, armut_uyukla); sunum komut() ile yeni klip dizisi gönderir (kutuyu
    // çevir, rafa bırak). Son komut (son: true) bitince ayakta boşta; başka durağa gidilirse iptal (kapanışı eylemKapat)
    if (D.tut) {
      const sonuc = await tutBekle(D.tut, d);
      if (!d()) { D.iptal?.(); return; }
      if (sonuc !== 'son') return;
    }
    await bosta(d);
  }
  // Pozunda bekleme ve komut kuyruğu (v7)
  let tutan = null;
  async function tutBekle(T, d) {
    const S = { klip: T.klip ?? null, kuyruk: [] };
    tutan = S;
    const dongu = () => (S.klip && var_(S.klip) ? oynat(S.klip, { tekrar: true, solma: 0.3 }) : Promise.resolve(true));
    await dongu();
    // bolum: [kare, kare] o anki klibin bu bölümü döngüde (ör. tv_armut dongu; v7 klipleri gelmeden armutta bekleme)
    if (Array.isArray(T.bolum) && simdiki) {
      const a = simdiki, t0 = kare2sn(T.bolum[0]), t1 = kare2sn(T.bolum[1]);
      kare(() => { if (tutan !== S || simdiki !== a || S.serbest) return 'tamam'; if (a.act.time >= t1) a.act.time = t0 + ((a.act.time - t0) % Math.max(1e-3, t1 - t0)); return null; }); // v8: kalanla (bölüm kısa olunca taşma birikmesin)
    }
    olay('tutuyor', { klip: S.klip, var: !!(S.klip && var_(S.klip)) });
    let sonuc = 'iptal';
    try {
      while (d()) {
        const r = await kare(() => (!d() ? 'iptal' : S.kuyruk.length ? 'is' : null));
        if (r !== 'is') break;
        const is = S.kuyruk.shift();
        S.serbest = true; // v8: bolum döngüsü bırakır (devam eden klip kaldığı yerden sürer: büstü rafa koyma)
        const ok = await diziOyna(is.dizi, d);
        is.coz(!!ok && d());
        if (!ok || !d()) break;
        if (is.son) { sonuc = 'son'; break; }
        await dongu();
      }
    } finally {
      if (tutan === S) tutan = null;
      for (const is of S.kuyruk.splice(0)) is.coz(false);
    }
    return sonuc;
  }
  // v6: buzdolabı duruşu (menteşenin karakter yerelindeki yeri, mm: +x sol, −y ileri). Meta'nın klipteki menteşesi gövdeyi
  // kapağın süpürme yayının içine koyuyordu (menteşeye 456 mm, kapak 500 mm: kapak karakterin içinden geçti). Sıra:
  // 1) klibin meta'sında D.durus.meta anahtarı (Blender ajanının yeni duruş ofseti; ör. buzdolabi_ac.durus_mm) olduğu
  // gibi; 2) yoksa meta menteşesi aynı yönde, menteşeye uzaklık kapak_en + gövde payı olana dek uzatılır (site yedeği)
  function buzDurus(D, mm) {
    const k = klipAd(elma.kalan > 0 ? D.klip ?? 'buzdolabi_ac' : D.yedek ?? 'buzdolabi_bos'), m = M.klip[k] ?? {};
    const yeni = D.durus?.meta ? metaYol(m, D.durus.meta) : null;
    if (Array.isArray(yeni)) { buzDurusKaynak = 'meta'; return yeni; }
    const en = (m.kapak_en ?? 500) + (D.durus?.pay ?? 190), L = Math.hypot(mm[0], mm[1]) || 1;
    buzDurusKaynak = L < en ? 'site' : 'klip';
    return L < en ? [mm[0] * (en / L), mm[1] * (en / L), mm[2] ?? 0] : mm;
  }
  let buzDurusKaynak = null;
  // Meta'da nokta yollu değer ('kumanda.tut.0'); yoksa undefined
  const metaYol = (m, yol) => String(yol).split('.').reduce((o, k) => (o == null ? undefined : o[k]), m);
  // Karakter yerelindeki nokta (mm: −y ileri, +x sol; meta biçimi) → dünya, kök (x, y) ve bakış psi için
  const yerelDunya = (v, x = ben.x, y = ben.y, psi = ben.psi) => { const [fx, fy] = yon(psi); return [x + v[0] * -fy - v[1] * fx, y + v[0] * fx - v[1] * fy, v[2] ?? 0]; };
  // Meta'daki yerel nokta dünyada `nokta`ya gelsin diye kökün duracağı yer
  const kokYeri = (nokta, v, psi) => { const w = yerelDunya([v[0], v[1], 0], 0, 0, psi); return [nokta[0] - w[0], nokta[1] - w[1]]; };
  // Klip dizisi (v5: diz_cok → kutu_al_diz → diz_kalk; kitap_al): her adım { klip, sure (yer tutucuda), anlar: [[an, f]] }.
  // an: { meta: 'al', kesir: 0.35 } → klibin meta karesi (karakter_meta'da varsa) ya da süresinin kesri; f(api) o anda
  // çağrılır (eşyayı ele alma, bırakma, kamera). Kesilirse kalan anlar çağrılmaz (durağın iptal'i toparlar)
  async function diziOyna(dizi, d) {
    for (const A of dizi) {
      // v8.2: yürüme adımı ({ yuru: { x, y, psi }, son }): durakta pozunda beklerken başka yere yürür (elinde büst; sunum
      // kolları IK ile tutar), varınca son klibi ('dur') döngüde
      if (A.yuru) {
        if (!(await yuru(A.yuru, d, { son: A.son ?? 'dur' }))) return false;
        continue;
      }
      const k = klipAd(A.klip), m = M.klip[k] ?? {}, sure = klipSure(A.klip, A.sure ?? AYAR.durakSure);
      // devam (v8): klip zaten çalıyorsa (bolum'da duran poz) yeniden başlamaz, kaldığı yerden sonuna dek sürer; anlar klibin
      // kendi zamanında (geçmiş anlar atlanır)
      const surer = A.devam && simdiki && simdiki.clip.name === k ? simdiki : null;
      // bas (v8.2): klip bu kareden başlar (anlar klibin zamanında; öncekiler atlanır)
      const bas = !surer && A.bas && k === A.klip ? kare2sn(A.bas) : 0;
      let t = surer ? surer.act.time : bas;
      const anlar = (A.anlar ?? []).map(([an, f]) => { const v = k === A.klip && an.meta ? metaYol(m, an.meta) : null; return [typeof v === 'number' ? kare2sn(v) : (an.kesir ?? 0) * sure, f]; }).filter((x) => x[0] >= t).sort((a, b) => a[0] - b[0]);
      if (anlar.length) kare((dt) => {
        if (!d()) return 'iptal';
        t += dt;
        while (anlar.length && t >= anlar[0][0]) { try { anlar.shift()[1](); } catch (e) { console.error('dizi anı', e); } }
        return anlar.length ? null : 'tamam';
      });
      // kadar (v7): döngüsüz klip yalnız bu kareye dek (sonra oynamayı sürdürür; tut.bolum döngüsü devralır)
      const oyna = surer ? kare(() => (!d() ? 'iptal' : simdiki !== surer || surer.act.time >= surer.clip.duration - 1e-3 ? 'tamam' : null)).then((r) => r === 'tamam')
        : bas ? oynat(k, { solma: 0.35, tekrar: false, bas }, d)
        : A.kadar && k === A.klip ? oynat(k, { solma: 0.35, tekrar: false, sure: kare2sn(A.kadar) }, d) : eylem(A.klip, d, { sure });
      if (!(await oyna)) return false;
      while (anlar.length && d()) { try { anlar.shift()[1](); } catch (e) { console.error('dizi anı', e); } } // yer tutucu erken bittiyse
    }
    return d();
  }
  // Buzdolabı: elma varsa kapağı açıp bir elma alır (sayaç düşer); bittiyse açar, bakar, eli boş kapatır; eli doluysa bakar
  async function buzdolabiGorevi(D, d) {
    const sure = D.sure ?? AYAR.durakSure;
    if (elma.elde) return eylem(null, d, { sure: 1.2 });
    const bos = elma.kalan <= 0, ad = bos ? D.yedek ?? 'buzdolabi_bos' : D.klip ?? 'buzdolabi_ac';
    kapakEsle(ad, sure, d);
    let alindi = false;
    if (!bos) {
      const m = M.klip[klipAd(ad)] ?? {}, an = m.al ? kare2sn(m.al) : klipSure(ad, sure) * AYAR.elmaAl;
      let t = 0;
      kare((dt) => { if (!d()) return 'iptal'; if ((t += dt) < an) return null; alindi = true; elmaAl(); return 'tamam'; });
    }
    const ok = await eylem(ad, d, { sure });
    if (!ok) kapak(false); // kesildiyse kapak kapanır (eşlemede kapanış klibin içinde)
    if (bos) olay('buzdolabi-bos');
    return ok && (bos || alindi);
  }
  // Kapak klibe eşli (v5, 2026-11-03): GLB meta'sında klibin 'kapak' eğrisi ([[kare, rad], ...]: rotation.z farkı) varsa kapak her
  // karede klibin zamanından okunur (el ile birlikte); yoksa el çekiş karesinde ('cek', yoksa klibin %12'si) açılmaya
  // başlar, el itiş karesinde ('it', yoksa bitişten 0,6 sn önce) kapanmaya başlar: klip bitince kapak kapalıdır
  function kapakEsle(ad, sure, d) {
    const k = klipAd(ad), m = M.klip[k] ?? {}, a = akt.get(k);
    if (k === ad && Array.isArray(m.kapak) && a) {
      if (!kapakBul()) return;
      kare(() => {
        if (simdiki !== a || !d()) { kapak(false); return 'tamam'; }
        // Meta değeri kapağın rotation.z farkı (rad, − açılır; Blender ajanının notu); 0..1 verilmişse açıklık oranı
        const v = anahtar(m.kapak, a.act.time * fps + 1), rad = m.kapak.some(([, x]) => x < 0 || x > 1) ? v : AYAR.kapakAci * kenet(v, 0, 1);
        kapakAcik = rad / AYAR.kapakAci;
        kapakObj.rotation.z = kapakRz0 + rad;
        return a.act.time >= a.clip.duration - 1e-3 ? 'tamam' : null;
      });
      return;
    }
    const L = klipSure(ad, sure), ac = k === ad && m.cek ? kare2sn(m.cek) : L * 0.12, kapa = k === ad && m.it ? kare2sn(m.it) : Math.max(ac + 0.8, L - 0.6);
    let t = 0, n = 0;
    kare((dt) => {
      if (!d()) return 'tamam';
      t += dt;
      if (n === 0 && t >= ac) { kapak(true, 0.45); n = 1; }
      if (n === 1 && t >= kapa) { kapak(false, 0.5); n = 2; }
      return n === 2 ? 'tamam' : null;
    });
  }
  // Buzdolabı kapağı (oda-esya.glb 'buzdolabi_kapak', orijini menteşede): açılır / kapanır, kesilmez
  let kapakObj, kapakRz0 = 0, kapakAcik = 0, kapakNesil = 0;
  const kapakBul = () => { if (kapakObj === undefined) { kapakObj = sahne?.getObjectByName('buzdolabi_kapak') ?? null; if (kapakObj) kapakRz0 = kapakObj.rotation.z; } return kapakObj; };
  function kapak(ac, sn = 0.55) {
    if (!kapakBul()) return;
    const a0 = kapakAcik, a1 = ac ? 1 : 0, ns = ++kapakNesil;
    let t = 0;
    kare((dt) => {
      if (ns !== kapakNesil) return 'tamam'; // yeni hareket başladı
      t = Math.min(1, t + dt / sn);
      kapakAcik = a0 + (a1 - a0) * yumusak(t);
      kapakObj.rotation.z = kapakRz0 + AYAR.kapakAci * kapakAcik;
      return t >= 1 ? 'tamam' : null;
    });
  }
  // ---- elma: elde taşınır, ısırıldıkça küçülür; üst gövde katmanı (elma_ye) yürüyüşle karışır ----
  const elma = { kalan: AYAR.elmaSayi, elde: null, isirik: 0, t: 0, bitti: false, atiliyor: false, atilan: 0, isabet: [] };
  const elKemik = kemikler.find((b) => /^el\.?R$|righthand$|hand_?r$/i.test(b.name)) ?? null;
  // ---- elma (v5, 2026-11-03): GLB'nin içinde. el.R altında elma_g0 (bütün), elma_g1–g3 (ısırıklar), elma_kocan; görünürlük
  // kemik ölçeği. buzdolabi_ac ve elma_firlat kendi kanallarıyla gösterir; öteki her klipte site her karede ölçeği yazar:
  // elde elma varsa elma_ye katmanının karesine göre (elma_adim) tek kemik 1, yoksa hepsi 0 (alttaki klip ile katman
  // karışırken yarım ölçek görünmesin; meta notu). Uçan koçan sitede (elma_firlat 'birak' karesinde rig koçanı 0'a iner).
  const ELMA_KLIP = new Set(['buzdolabi_ac', 'elma_firlat', 'elma_firlat_otur']);
  const elmaKemikAd = Array.isArray(M.elma_kemik) ? M.elma_kemik : ['elma_g0', 'elma_g1', 'elma_g2', 'elma_g3', 'elma_kocan'];
  const elmaKemik = elmaKemikAd.map((ad) => model.getObjectByName(ad) ?? null);
  const glbElma = elmaKemik.some(Boolean);
  const EY = M.klip.elma_ye ?? {};
  const elmaAdim = EY.elma_adim ?? { g0: [1, 20], g1: [20, 80], g2: [80, 140], g3: [140, 200], kocan: [200, 241] };
  const isirikKare = Array.isArray(EY.isirik) ? EY.isirik : [20, 80, 140, 200];
  AYAR.isirik = isirikKare.length; // ısırık sayısı klipten (v5: 4)
  // v8.2: Blender'ın yeni elma dizisi (elma_tut ↻, elma_tut_yuru ↻, elma_isir_1…4) varsa eski elma_ye katmanı kurulmaz
  const yeniElma = var_('elma_isir_1') && var_('elma_tut');
  const ELMA_IX = { g0: 0, g1: 1, g2: 2, g3: 3, kocan: 4 };
  if (yeniElma) AYAR.isirik = [1, 2, 3, 4].filter((k) => var_(`elma_isir_${k}`)).length;
  const elmaHepsi = [];
  model.traverse((o) => { if (o.isBone && /^elma/.test(o.name)) elmaHepsi.push(o); });
  let elmaKatman = null;
  if (akt.has('elma_ye') && !yeniElma) {
    const c = akt.get('elma_ye').clip;
    // Üst gövde; elma kemiklerinin kanalları atılır (görünürlüğü site yazar)
    const izler = c.tracks.filter((t) => { const ad = t.name.slice(0, t.name.lastIndexOf('.')); return !UST_GOVDE_DISI.test(ad) && !/^elma/.test(ad); });
    const act = mixer.clipAction(new THREE.AnimationClip('elma_ye_ust', c.duration, izler));
    act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true;
    act.timeScale = 0; // zamanı elmaKaresi yazar
    act.setEffectiveWeight(0).play();
    elmaKatman = { act, w: 0, kare: 1 };
  }
  // Mixer'dan sonra: elma kemiklerinin ölçeği
  function elmaGorunurluk() {
    if (!glbElma) return;
    // Elmalı klipte kanal klibin; geçişte (alttaki klibin 0'ıyla karışırken) yarım ölçek görünmesin: var ya da yok
    if (simdiki && ELMA_KLIP.has(simdiki.clip.name)) { for (const k of elmaKemik) if (k) k.scale.setScalar(k.scale.x > 0.01 ? 1 : 0); return; }
    let gor = -1;
    if (yeniElma) { if (elma.elde && (!elma.atiliyor || (elma.oturarak && !elma.birakti))) gor = elma.gor ?? 0; }
    else if (elma.elde && !elma.atiliyor) {
      const f = elmaKatman ? elmaKatman.kare : 1;
      gor = ['g0', 'g1', 'g2', 'g3', 'kocan'].findIndex((a) => { const r = elmaAdim[a]; return r && f >= r[0] && f < r[1]; });
      if (gor < 0) gor = f >= (elmaAdim.kocan?.[0] ?? 200) ? 4 : 0;
    }
    elmaKemik.forEach((b, i) => { if (b) b.scale.setScalar(i === gor ? 1 : 0); });
  }
  // Site elması yalnız GLB'de elma yoksa (eski dosya); uçan koçan her zaman sitede
  let elmaGeo = null;
  function elmaYap({ kocan = false } = {}) {
    // Kemiğin yerel birimi metre (model 1000 ölçekli): elma ~76 mm, sapıyla; koçan Ø 30 × 62
    if (!elmaGeo) {
      const govdeG = new THREE.SphereGeometry(0.038, 20, 14).scale(1, 1, 0.9);
      elmaGeo = { govde: govdeG, sap: new THREE.CylinderGeometry(0.0025, 0.003, 0.02, 6).rotateX(Math.PI / 2).translate(0, 0, 0.04),
        kocan: new THREE.SphereGeometry(0.015, 14, 10).scale(1, 1, 2.05) };
    }
    const g = new THREE.Group();
    g.name = 'elma';
    const kabuk = new THREE.Mesh(kocan ? elmaGeo.kocan : elmaGeo.govde, new THREE.MeshStandardMaterial({ color: kocan ? 0xe9dcae : 0xb8231c, roughness: kocan ? 0.7 : 0.38 }));
    const sap = new THREE.Mesh(elmaGeo.sap, new THREE.MeshStandardMaterial({ color: 0x5a3b1c, roughness: 0.9 }));
    kabuk.castShadow = sap.castShadow = true;
    g.add(kabuk, sap);
    g.userData.kabuk = kabuk;
    return g;
  }
  const elYerel = (v) => (Array.isArray(v) ? new THREE.Vector3(v[0] / 1000, v[1] / 1000, v[2] / 1000) : new THREE.Vector3(0, 0.075, 0.035));
  function elmaAl() {
    let g;
    if (glbElma) g = new THREE.Group(); // işaret: elmanın kendisi rig'de
    else {
      g = elmaYap();
      if (elKemik) { elKemik.add(g); g.position.copy(elYerel(EY.elma?.el_yerel)); } else { g.scale.setScalar(1000); g.position.set(0, -250, 950); yer.add(g); }
    }
    Object.assign(elma, { elde: g, isirik: 0, t: 0, bitti: false, atiliyor: false, k: 1, gor: 0, bekle: AYAR.ilkIsirik, isiriyor: null, isirdi: false });
    if (elmaKatman) { elmaKatman.act.reset().setEffectiveWeight(0).play(); elmaKatman.act.timeScale = 0; elmaKatman.kare = 1; }
    elma.kalan--;
    olay('elma-al', { kalan: elma.kalan });
  }
  // ---- v8.2: üst gövde katmanı (meta katman 'ust': bust_tut, bust_tut_yuru, elma_tut, elma_tut_yuru, elma_isir_1…4).
  // Altta çalan klibin (dur, yuru) üstüne üst gövdeyi yazar (kalça, bacak, kök kanalları atılır; elma kemiklerinin ölçeği
  // site yazar). Altta yuru çalarken klibin eşlikçisi (ad + '_yuru', meta eslik 'yuru') yürüyüşün zamanıyla oynar.
  // Ağırlık: karıştırıcı ağırlıkları normalleştirir; katmanın payı w olsun diye etkin ağırlık w / (1 − w)
  const ustA = new Map(); // klip adı → { act, w, sure } | null
  function ustAct(ad) {
    if (ustA.has(ad)) return ustA.get(ad);
    const a = akt.get(ad);
    let u = null;
    if (a) {
      const izler = a.clip.tracks.filter((t) => { const k = t.name.slice(0, t.name.lastIndexOf('.')); return !UST_GOVDE_DISI.test(k) && !(/^elma/.test(k) && /scale$/.test(t.name)); });
      const act = mixer.clipAction(new THREE.AnimationClip(ad + '_ust', a.clip.duration, izler));
      act.setLoop(THREE.LoopRepeat, Infinity); act.timeScale = 0; act.setEffectiveWeight(0).play();
      u = { act, w: 0, sure: a.clip.duration };
    }
    ustA.set(ad, u);
    return u;
  }
  const ust = { ad: null, t: 0, tekrar: true, bitti: null, oynayan: null };
  // ad: katman klibi (null: katman kapanır, 0,3 sn'de söner). tekrar false: bir kez; söz bitince true (değişirse false)
  function ustKatman(ad, { tekrar = true } = {}) {
    if (ad && !var_(ad)) ad = null;
    const b = ust.bitti;
    Object.assign(ust, { ad, t: 0, tekrar, bitti: null });
    b?.(false);
    if (!ad || tekrar) return Promise.resolve(!!ad);
    return new Promise((ok) => { ust.bitti = ok; });
  }
  function ustKaresi(dt) {
    let hedef = null;
    if (ust.ad) {
      ust.t += dt;
      const es = simdiki?.clip.name === 'yuru' && var_(ust.ad + '_yuru') ? ust.ad + '_yuru' : null;
      const u = ustAct(es ?? ust.ad);
      if (u) {
        hedef = u;
        if (es) u.act.time = simdiki.act.time % u.sure; // eşlik: yürüyüşle aynı karede
        else if (ust.tekrar) u.act.time = ust.t % u.sure;
        else {
          u.act.time = Math.min(ust.t, u.sure - 1e-4);
          if (ust.t >= u.sure && ust.bitti) { const b = ust.bitti; ust.bitti = null; b(true); }
        }
      }
    }
    ust.oynayan = hedef;
    for (const u of ustA.values()) {
      if (!u) continue;
      u.w = kenet(u.w + (u === hedef ? 1 : -1) * dt / (reduce ? 0.01 : 0.3), 0, 1);
      u.act.setEffectiveWeight(u.w < 1e-3 ? 0 : Math.min(400, u.w / Math.max(1e-3, 1 - u.w)));
    }
  }
  // Isırık klibi elma kemiklerini çevirir (elma_don_derece: ısırığın yeri ağza); elma_tut (elma_serbest) onlara anahtar
  // yazmaz: ısırıktan kalan dönüş korunur (alttaki klip sıfırına çekmesin)
  const elmaDonuk = new Map();
  function ustSonrasi() {
    if (!yeniElma || !elma.elde) { elmaDonuk.clear(); return; }
    if (/^elma_isir/.test(ust.ad ?? '')) { for (const b of elmaHepsi) elmaDonuk.set(b, [b.quaternion.clone(), b.position.clone()]); return; }
    if (/^elma_tut/.test(ust.ad ?? '') && elmaDonuk.size) for (const [b, [q, p]] of elmaDonuk) { b.quaternion.copy(q); b.position.copy(p); }
  }
  // v8.2 (kullanıcı: elma ~1 dk, dağınık): elde tutar (elma_tut; yürürken elma_tut_yuru), arada bir ısırır
  // (elma_isir_k; 'isirik' karesinde ısırık, elma_adim ile görünen parça), dört ısırıkta koçan kalır; bitince firsat
  // (bosta) çöpe döner ve fırlatır. Aralar AYAR.isirikAra (ısırık başlangıçları arası)
  function elmaPlani(dt) {
    if (!elma.elde || elma.atiliyor || reduce) { if (/^elma_(tut|isir)/.test(ust.ad ?? '')) ustKatman(null); return; }
    if (simdiki && ELMA_KLIP.has(simdiki.clip.name)) return; // buzdolabi_ac kendi kanallarıyla
    // v8.3: masada oturuyorsa Blender'ın oturuş klipleri (elma_tut_otur ↻, elma_isir_otur_k; bütün gövde, alttaki klip
    // olarak); ayaktayken üst gövde katmanı (elma_tut / elma_tut_yuru, elma_isir_k)
    const otur = ben.yer === 'koltuk' && !ben.masaGecis && var_('elma_tut_otur');
    const tutAd = otur ? 'elma_tut_otur' : 'elma_tut', isirAd = (k) => (otur ? `elma_isir_otur_${k}` : `elma_isir_${k}`);
    const tut = () => {
      if (otur) { if (ust.ad) ustKatman(null); if (simdiki?.clip.name !== tutAd) oynat(tutAd, { tekrar: true, solma: 0.35 }); }
      else if (ust.ad !== tutAd) ustKatman(tutAd);
    };
    if (elma.isiriyor) {
      const ad = elma.isiriyor, m = M.klip[ad] ?? {}, oturKlip = /_otur_/.test(ad);
      const calan = oturKlip ? simdiki?.clip.name === ad : ust.ad === ad;
      const t = !calan ? Infinity : oturKlip ? simdiki.act.time : ust.t, f = t * fps + 1;
      for (const [g, r] of Object.entries(m.elma_adim ?? {})) if (ELMA_IX[g] !== undefined && f >= r[0] && t < Infinity) elma.gor = Math.max(elma.gor ?? 0, ELMA_IX[g]);
      if (!elma.isirdi && f >= (m.isirik ?? 20) && t < Infinity) {
        elma.isirdi = true;
        elma.isirik++;
        olay('isirik', { n: elma.isirik });
      }
      if (!calan || t >= klipSure(ad, 3) - 1e-3) {
        if (!elma.isirdi) { elma.isirdi = true; elma.isirik++; olay('isirik', { n: elma.isirik }); } // yarıda kesildiyse de sayılır
        elma.isiriyor = null;
        elma.k++;
        elma.bekle = Math.max(1, AYAR.isirikAra - klipSure('elma_isir_1', 3));
        if (elma.isirik >= AYAR.isirik) { elma.bitti = true; olay('elma-bitti'); }
        tut();
      }
      return;
    }
    tut();
    if (elma.bitti) return;
    elma.bekle -= dt;
    if (elma.bekle > 0) return;
    const ad = isirAd(Math.min(elma.k, 4));
    if (!var_(ad)) { elma.bekle = 1; return; }
    elma.isiriyor = ad;
    elma.isirdi = false;
    if (otur) oynat(ad, { tekrar: false, solma: 0.3 });
    else ustKatman(ad, { tekrar: false });
  }
  function elmaKaresi(dt) {
    if (elmaKatman) {
      const h = elma.elde && !elma.bitti && !elma.atiliyor ? 1 : 0;
      elmaKatman.w += (h - elmaKatman.w) * Math.min(1, dt * 4);
      elmaKatman.act.setEffectiveWeight(elmaKatman.w < 0.01 ? 0 : elmaKatman.w * AYAR.elmaAgirlik);
    }
    if (yeniElma) { elmaPlani(dt); return; }
    if (!elma.elde || elma.bitti || elma.atiliyor || reduce) return;
    // Isırıklar klibin karelerinde (isirik); hız isirikAra'dan (klipte iki ısırık arası 60 kare = 2 sn)
    const aralik = (isirikKare[1] ?? 80) - (isirikKare[0] ?? 20) || 60, hiz = aralik / fps / AYAR.isirikAra;
    const f0 = elmaKatman ? elmaKatman.kare : 1 + elma.t * fps;
    const f1 = f0 + dt * fps * hiz;
    if (elmaKatman) { elmaKatman.kare = f1; elmaKatman.act.time = Math.min((f1 - 1) / fps, elmaKatman.act.getClip().duration); }
    elma.t += dt * hiz;
    for (const fk of isirikKare) {
      if (f0 < fk && f1 >= fk) {
        elma.isirik++;
        if (!glbElma) { const u = elma.isirik / AYAR.isirik; elma.elde.userData.kabuk.scale.set(1 - 0.5 * u, 1 - 0.5 * u, 1 - 0.15 * u); }
        olay('isirik', { n: elma.isirik });
        if (elma.isirik >= AYAR.isirik) { elma.bitti = true; olay('elma-bitti'); }
      }
    }
  }
  // Çöp kutusunun ağzı: sunum verdiyse (sahnenin çöp kovası, userData.agiz) o; sahnede 'cop' adlı nesne varsa onun
  // üstü; yoksa geçici nokta
  let ekEngel = [], copFn = null;
  function copNoktasi() {
    const v = copFn?.();
    if (v) return v;
    const o = sahne?.getObjectByName('cop');
    if (!o) return COP_GECICI;
    const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3());
    return { x: c.x, y: c.y, z: b.max.z, r: Math.max(80, Math.min(b.max.x - b.min.x, b.max.y - b.min.y) / 2) };
  }
  // En yakın fırsatta çöpe: çöpe döner, "kobe" balonu, elma_firlat; elma elden çıkınca yay çizerek çöpün ağzına iner
  // (her zaman isabet: yay iki ucun arasında kurulur). Atış kesilmez (kilit); bekle: elma bitene dek yemeye devam eder
  async function firsat(d, { bekle: bitir = false } = {}) {
    if (!elma.elde || elma.atiliyor) return d();
    if (!elma.bitti) {
      if (!bitir) return d();
      if ((await kare(() => (!d() ? 'iptal' : elma.bitti ? 'tamam' : null))) !== 'tamam') return false;
    }
    const c = copNoktasi();
    if (!(await yuru({ x: ben.x, y: ben.y, psi: aciOf(c.x - ben.x, c.y - ben.y) }, d, { son: null }))) return false;
    elma.atiliyor = true;
    olay('kobe', { cop: c });
    const ad = 'elma_firlat', m = M.klip[klipAd(ad)] ?? {}, an = m.birak ? kare2sn(m.birak) : klipSure(ad, 1.4) * AYAR.firlatAn;
    let t = 0;
    const birak = kare((dt) => ((t += dt) >= an ? 'tamam' : null)).then(() => elmaUcur(c));
    const p = eylem(ad, () => true, { sure: 1.4 }).then(() => birak);
    kilit = p;
    await p;
    return d();
  }
  function elmaUcur(c, { tepe = null } = {}) {
    let g = elma.elde;
    if (!g) return Promise.resolve();
    if (glbElma) { // rig koçanı birak karesinde 0'a iner: aynı yerde site koçanı uçar
      g = elmaYap({ kocan: true });
      g.children[1].visible = false;
      if (elKemik) { elKemik.add(g); g.position.copy(elYerel(M.klip.elma_firlat?.kocan?.el_yerel)); } else { g.scale.setScalar(1000); g.position.set(ben.x, ben.y, 1200); sahne.add(g); }
      elma.elde = g;
    }
    yer.updateMatrixWorld(true);
    sahne.attach(g); // dünya dönüşümü korunur
    // v8.2 (kullanıcı): balistik yay (yerçekimi), uzaktan çöpün ağzına: uçuş süresi uzaklıktan, ilk hız ağızdaki hedefe
    // tam iner diye çözülür (p2 = p0 + v·T + ½·g·T²)
    // v8.3 (kullanıcı: bombeli, yavaş; tepe tavanın 500 mm altını geçmez): tepe yüksekliği H seçilir (iki ucun üstünden
    // uzaklığın 0,35'i kadar, en çok ROOM.h − 500), dikey hız ondan, uçuş süresi çıkış + iniş, yatay hız d / T
    const p0 = g.position.clone(), p2 = new THREE.Vector3(c.x, c.y, c.z + 30), G = -9810;
    const dYat = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    const H = Math.min(ROOM.h - 500, tepe ? Math.max(tepe, Math.max(p0.z, p2.z) + 150) : Math.max(p0.z, p2.z) + Math.max(250, dYat * 0.35));
    const vz = Math.sqrt(2 * -G * Math.max(1, H - p0.z)), T = (vz + Math.sqrt(2 * -G * Math.max(1, H - p2.z))) / -G;
    const v0 = new THREE.Vector3((p2.x - p0.x) / T, (p2.y - p0.y) / T, vz);
    elma.yay = { tepe: Math.round(H), T: +T.toFixed(2), d: Math.round(dYat) };
    const dus = c.z - 160; // ağızdan içeri
    let t = 0;
    return kare((dt) => {
      t += dt;
      const u = Math.min(1, t / T);
      if (u < 1) {
        const tt = u * T;
        g.position.set(p0.x + v0.x * tt, p0.y + v0.y * tt, p0.z + v0.z * tt + 0.5 * G * tt * tt);
        g.rotation.x += dt * 9; g.rotation.y += dt * 5;
        return null;
      }
      g.position.z = Math.max(dus, g.position.z - dt * 1800); // ağızdan kutuya düşer
      if (g.position.z > dus) return null;
      const isabet = Math.hypot(g.position.x - c.x, g.position.y - c.y) <= c.r;
      elma.isabet.push(isabet);
      elma.atilan++;
      g.removeFromParent();
      g.traverse((o) => o.material?.dispose?.());
      Object.assign(elma, { elde: null, bitti: false, atiliyor: false, isirik: 0 });
      olay('isabet', { isabet, x: Math.round(g.position.x), y: Math.round(g.position.y) });
      return 'tamam';
    });
  }

  // v8.3: masada elma: sandalyeye oturur (masaya kayar), oturuş beklemesinde elma katmanı (elma_tut / elma_isir_k) yer;
  // bitince oturarakAt
  async function masadaElma(d) {
    elma.masada = true;
    try { return await masadaElma0(d); } finally { elma.masada = false; }
  }
  async function masadaElma0(d) {
    if (ben.yer !== 'koltuk') {
      if (!(await yereIn(d))) return false;
      if (!(await koltugaOtur(d))) return false;
    }
    if (!(await kaydir(YER.masa, d))) return false;
    olay('oturdu');
    await oynat(var_('elma_tut_otur') ? 'elma_tut_otur' : var_('bekle') ? 'bekle' : 'yaz', { tekrar: true, solma: 0.4 });
    olay('masada-elma');
    if ((await kare(() => (!d() ? 'iptal' : !elma.elde || elma.bitti ? 'tamam' : null))) !== 'tamam') return false;
    if (elma.elde) return oturarakAt(d);
    return d();
  }
  // Oturduğu yerden çöpe (v8.3): koltukla çöpe doğru döner (en çok 75°), "Kobe!" balonu, elma_firlat'ın üst gövdesi katman
  // olarak (bacaklar oturuşta); 'birak' karesinde koçan bombeli yayla kovaya (elmaUcur)
  async function oturarakAt(d) {
    const c = copNoktasi();
    // v8.3 Blender elma_firlat_otur: gövde ve baş çöpe döner (klip), 'birak' karesinde koçan klibin tepe_z_mm'sine çıkan
    // bombeli yayla kovaya
    if (var_('elma_firlat_otur')) {
      const m = M.klip.elma_firlat_otur, an = kare2sn(m.birak ?? 28);
      Object.assign(elma, { atiliyor: true, oturarak: true, birakti: false });
      olay('kobe', { cop: c });
      let t = 0;
      const birak = kare((dt) => ((t += dt) >= an ? 'tamam' : null)).then(() => { elma.birakti = true; return elmaUcur(c, { tepe: m.tepe_z_mm }); });
      await kilitli('elma_firlat_otur', { solma: 0.3 });
      await birak;
      elma.oturarak = false;
      return d();
    }
    donus.zorla = kenet(fark(ben.psi, aciOf(c.x - ben.x, c.y - ben.y)), -1.3, 1.3);
    if (!(await bekle(1.0, d))) { donus.zorla = null; return false; }
    Object.assign(elma, { atiliyor: true, oturarak: true, birakti: false });
    olay('kobe', { cop: c });
    const m = M.klip[klipAd('elma_firlat')] ?? {}, an = m.birak ? kare2sn(m.birak) : 0.8;
    let t = 0;
    const birak = kare((dt) => ((t += dt) >= an ? 'tamam' : null)).then(() => { elma.birakti = true; return elmaUcur(c); });
    await ustKatman('elma_firlat', { tekrar: false });
    ustKatman(null);
    await birak;
    elma.oturarak = false;
    await bekle(0.6, d);
    donus.zorla = null;
    return d();
  }

  // Masa başı: yazar; ara ara emote; tepki; kadrajı kaplıyorsa kenara çekilir. Hareket azaltmada başlamaz (masayaKoy,
  // odayaGel): karakter masada hareketsiz oturur
  let sonEmote = null; // masada art arda aynı emote gelmesin
  async function masaDongusu(d) {
    await oynat('yaz', { solma: 0.5 });
    olay('oturdu');
    let sonraki = saat + rastgele(AYAR.bosta);
    // Emote ve tepki kenar gereğinde yarıda kesilir (yoksa tıklayınca karakter 10 sn'yi aşan klibi bitirmeden kaçmıyordu)
    const dk = () => d() && !kenarGerek();
    while (d()) {
      if (kenarGerek()) {
        if (!(await kenaraCekil(d))) return;
        await oynat('yaz', { solma: 0.5 });
        sonraki = saat + rastgele(AYAR.bosta);
        continue;
      }
      if (donuk()) { // fare gizli üründe: koltukla dönerken yazmayı bırakır, fare gidince yazmaya döner
        await oynat('bekle', { tekrar: true, solma: 0.35 });
        if (!(await kare(() => (!d() || kenarGerek() || !donuk() ? 'uyan' : null))) || !d()) return;
        if (!kenarGerek()) await oynat('yaz', { solma: 0.4 });
        sonraki = Math.max(sonraki, saat + 3);
        continue;
      }
      const tp = tepkiler.shift();
      if (tp) { if (!(await dizi([tp], dk))) { if (!d()) return; continue; } await oynat('yaz', { solma: 0.5 }); sonraki = saat + rastgele(AYAR.bosta); continue; }
      if (saat >= sonraki) {
        // Ağırlıklı rastgele emote; bir önceki emote art arda gelmez
        const havuz = EMOTE.length > 1 ? EMOTE.filter(([, s]) => s !== sonEmote) : EMOTE;
        const top = havuz.reduce((s, [w]) => s + w, 0);
        let r = Math.random() * top, sec = havuz[0][1];
        for (const [w, s] of havuz) { if ((r -= w) < 0) { sec = s; break; } }
        sonEmote = sec;
        if (!(await dizi(sec, dk))) { if (!d()) return; continue; }
        const sonAd = [sec[sec.length - 1]].flat()[0];
        await oynat('yaz', { solma: sonAd === 'fare' ? fareSolma() : 0.5 });
        sonraki = saat + rastgele(AYAR.bosta);
        continue;
      }
      const r = await kare(() => (!d() || kenarGerek() || tepkiler.length || saat >= sonraki || donuk() ? 'uyan' : null));
      if (!r) return;
    }
  }
  // v8.5 (Blender fare klibi: avuç 12. karede farede): yaz ↔ fare harmanı meta fare.giris_solma_sn (yoksa 0,15 sn); 0,45 sn
  // harmanda el havada süzülüyor gibi okunuyordu
  const fareSolma = () => { const v = M.klip.fare?.fare?.giris_solma_sn; return typeof v === 'number' && v >= 0 ? v : 0.15; };
  async function dizi(sira, d) {
    for (const x of sira) {
      const [ad, sure] = Array.isArray(x) ? x : [x];
      if (!var_(ad)) continue;
      if (!(await oynat(ad, { solma: ad === 'fare' ? fareSolma() : 0.45, ...(sure ? { tekrar: true, sure } : { tekrar: false }) }, d))) return false;
    }
    return true;
  }
  async function kenaraCekil(d) {
    const kk = KENAR_KLIP.find(var_) ?? 'bekle';
    if (!(await kaydir(YER.kenar, d, { hiz: AYAR.kenarHiz }))) return false;
    await oynat(kk, { tekrar: true, solma: 0.5 });
    bakis = 'urun';
    let bos = 0, beklemede = true;
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      const tp = tepkiler.shift();
      if (tp) { oynat(tp, { solma: 0.4, tekrar: false }).then(() => beklemede && d() && oynat(kk, { tekrar: true, solma: 0.5 })); }
      bos = kenarGerek() ? 0 : bos + dt;
      return bos > AYAR.kenarBekle ? 'tamam' : null;
    });
    beklemede = false;
    bakis = null;
    if (r !== 'tamam') return false;
    return kaydir(YER.masa, d);
  }

  // Hareketsiz yerleştirme (hareket azaltma; lab ?karakter=masa)
  function yereKoy(p) { ben.x = p.x; ben.y = p.y; ben.psi = p.psi; }
  function masayaKoy() {
    nesil++;
    kareler.clear(); // eski görevlerin kare işleri (kilitli klip dahil) bırakılır
    kilit = Promise.resolve();
    for (const ad of ['merdiven', 'ip']) if (arac[ad]) arac[ad].visible = false;
    yereKoy(YER.masa);
    bakis = null; tepkiler = []; etki = null;
    Object.assign(salin, { a: 0, v: 0, taban: null });
    Object.assign(donus, { a: 0, v: 0, hedef: 0 });
    ben.yer = 'koltuk';
    ben.gorunur = true;
    ben.dansBorcu = false;
    koltuk.katlama = 0;
    koltuk.bagli = true;
    const a = akt.get('yaz') ?? akt.get('bekle');
    if (a) {
      mixer.stopAllAction();
      akt.forEach((x) => { x.oynadi = false; });
      a.act.reset().setEffectiveWeight(1).play();
      a.act.timeScale = reduce ? 0 : 1;
      a.oynadi = true;
      simdiki = a;
    }
    if (!reduce) { const nes = nesil; masaDongusu(() => nes === nesil); }
  }

  // ---- kenara çekilme gereği: kadrajı masa başındaki karakterin kapladığı yakın planlar ----
  let kenarlar = null, kenarHesap = -99, kenarGorunur = new Set();
  const tmpKam = new THREE.PerspectiveCamera(), v3 = new THREE.Vector3();
  function kenarDuraklari() {
    if (!story) return [];
    if (kenarlar && saat - kenarHesap < 1) return kenarlar;
    kenarHesap = saat;
    const D = YER.masa, [fx, fy] = yon(D.psi);
    // Masa başındaki oturan karakterin kabaca noktaları: kalça, göğüs, kafa, omuzlar, dizler
    const N = [[0, 0, 620], [0, 0, 900], [0, -20, 1150], [170, 0, 980], [-170, 0, 980], [110, 300, 620], [-110, 300, 620]]
      .map(([sx, ileri, z]) => new THREE.Vector3(D.x + fy * -sx + fx * ileri, D.y + fx * sx + fy * ileri, z));
    const cam = story.camera;
    tmpKam.fov = cam.fov; tmpKam.aspect = cam.aspect; tmpKam.near = cam.near; tmpKam.far = cam.far; tmpKam.up.set(0, 0, 1);
    tmpKam.updateProjectionMatrix();
    kenarlar = [];
    kenarGorunur = new Set();
    const ana = new THREE.Vector3(...story.shotOf(null).pos); // genel planın kamerası
    const K = YER.kenar, [kx, ky] = yon(K.psi), NK = [[0, 600], [0, 900], [0, 1150], [-0.3, 500]].map(([ileri, z]) => new THREE.Vector3(K.x + kx * ileri * 1000, K.y + ky * ileri * 1000, z));
    for (const h of story.hotspots) {
      const s = story.shotOf(h.id);
      tmpKam.position.set(...s.pos);
      tmpKam.lookAt(...s.target);
      tmpKam.updateMatrixWorld(true);
      let yakin = 0, enYakin = Infinity;
      for (const p of N) {
        const uz = p.distanceTo(tmpKam.position);
        enYakin = Math.min(enYakin, uz);
        v3.copy(p).project(tmpKam);
        if (v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1 && uz < 1000) yakin++;
      }
      if (yakin >= 3 || enYakin < 450) kenarlar.push({ id: h.id, pos: new THREE.Vector3(...s.pos), u0: ana.distanceTo(tmpKam.position) });
      // Bu durağın kadrajına kenar yeri giriyor mu (oturan karakterin birkaç noktası)
      if (NK.some((p) => { v3.copy(p).project(tmpKam); return v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05 && p.distanceTo(tmpKam.position) < 4000; })) kenarGorunur.add(h.id);
    }
    return kenarlar;
  }
  // Gerek: yakın plan o durakta, kamera durağın yakınında ya da ona hızla yaklaşıyor (varış süresi kısa). Kare başına bir
  // kez hesaplanır (yaklaşma hızı iki kare arasındaki uzaklık farkından)
  let kenarSon = { saat: -1, sonuc: false }, uzOnce = null;
  function kenarGerek() {
    if (!story || ben.yer !== 'koltuk') return false;
    if (kenarSon.saat === saat) return kenarSon.sonuc;
    const ks = kenarDuraklari(), fid = story.focusedId, c = story.camera.position;
    const uz = new Map(ks.map((k) => [k.id, k.pos.distanceTo(c)])), dt = uzOnce ? saat - uzOnce.saat : 0;
    let sonuc = ks.some((k) => k.id === fid);
    // Yakınlık ve yaklaşma hızı girişten sonra: giriş uçuşu genel plana gider (yakın plana yaklaşıyor sanılmasın).
    // Kenar yeri odaktaki kadraja giriyorsa orada beklenmez
    if (!sonuc && story.ready !== false && !(fid && kenarGorunur.has(fid))) {
      sonuc = [...uz.values()].some((u) => u < AYAR.kenarYakin);
      // Yaklaşma hızı aynı durağın iki ölçümünden (liste ekran oranı değişince yeniden kurulur, sırası kayabilir); kamera
      // genel plandakinden belirgin yakına gelmeden sayılmaz: genel planda kameranın küçük ileri kaymaları (başla
      // düğmesinin önizlemesi, turun oturması) masa durağına yaklaşmak sanılmasın
      if (!sonuc && uzOnce && dt > 0) sonuc = ks.some((k) => {
        const u = uz.get(k.id), v = ((uzOnce.uz.get(k.id) ?? u) - u) / dt;
        return u < k.u0 * AYAR.kenarPay && v > 300 && u / v < AYAR.kenarOnce;
      });
    }
    uzOnce = { saat, uz };
    kenarSon = { saat, sonuc };
    return sonuc;
  }

  // ---- her kare ----
  // Sıra: görevler (yürüme, kayma, iniş, klip bitişleri) → klipler → kökün ve koltuğun yeri → oturağın sallanması ve
  // dönüşü → karakterin ve koltuğun dönüşümleri (karede tek yerde yazılır) → kafa bakışı
  const qTmp = new THREE.Quaternion(), qYaw = new THREE.Quaternion(), qPitch = new THREE.Quaternion(), qPar = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1), sag = new THREE.Vector3(), kafaW = new THREE.Vector3(), hedefW = new THREE.Vector3();
  const bak = { k: 0, yaw: 0, pitch: 0 }, kafaTaban = new THREE.Quaternion(), qInv = new THREE.Quaternion();
  let kafaDegisti = false;
  const kareSonlari = new Set(); // v8.1: klip karıştırıldıktan sonra çalışan işler (core/oda-sunum.js büst tutuşu, IK)
  function update(t, dt) {
    dt *= AYAR.tempo;
    saat += dt;
    if (kafaDegisti) { kafa.quaternion.copy(kafaTaban); kafaDegisti = false; } // klip kafayı yazmasa da bakış birikmesin
    for (const f of [...kareler]) if (f(dt)) kareler.delete(f);
    inisZamani();
    elmaKaresi(dt);
    ustKaresi(dt);
    mixer.update(dt);
    ustSonrasi();
    elmaGorunurluk();
    const k = kliplerdenOku();
    kokuKaydir();
    let oe = null, don = 0;
    if (koltuk.obj) {
      koltuguTasi(k);
      oe = oturmaEtkisiKaresi();
      salinimHesapla(dt);
      donusHesapla(dt);
      don = (oe ? oe.sw : 0) + salin.a + donus.a;
    }
    karakteriYaz(k, oe, don);
    if (koltuk.obj) koltuguYaz(k, oe, don);
    kafaCevir(dt);
    for (const f of kareSonlari) { try { f(dt); } catch (e) { console.error('kare sonu', e); } } // v8.1: sunumun IK'sı (büst tutuşu)
  }
  // İnişte klibin zamanını ve kökün ek yüksekliğini biz veririz
  function inisZamani() {
    if (!ben.inis || ben.yer !== 'merdiven') return;
    const s = ben.inis, r = s.durum(s.tau);
    s.a.act.time = r.zaman;
    s.a.ofz = r.ofz;
  }
  // Açık kliplerin ağırlıklı ortalaması: kökün yüksekliği (masa klipleri kökü koltuk yüksekliğine kaldırır, iniş kendi
  // yüksekliğini verir), gövdenin köke göre ileri kayması (otur2'nin başı), koltuğun kökün kaç mm arkasında olduğu
  // (koltuğu taşıyan klipler; yoksa null), sırtın katlılığı (sırt açma; yoksa null) ve ek yaslanması (emote). Kalça
  // koltuğa indiği karede oturuş etkisi başlar
  function kliplerdenOku() {
    let zT = 0, zW = 0, iT = 0, kT = 0, kW = 0, sirt = null, yatir = 0;
    for (const [ad, a] of akt) {
      const w = a.oynadi && a.act.enabled ? a.act.getEffectiveWeight() : 0;
      if (w < 1e-3) continue;
      const m = M.klip[ad] || {}, f = a.act.time * fps + 1;
      zT += w * (a.ofz ?? anahtar(m.z ?? 0, f));
      zW += w;
      iT += w * (a.ofIleri ?? anahtar(m.ileri ?? 0, f));
      if (m.koltuk !== undefined) { kT += w * (a.ofKoltuk ?? anahtar(m.koltuk, f)); kW += w; }
      if (m.yatir) yatir += w * anahtar(m.yatir, f);
      if (m.inis && !a.indi && w > 0.5 && f >= m.inis) { a.indi = true; oturmaEtkisi(); } // kalça koltuğa indi
      if (ad === 'sirt_ac' && w > 0.5) sirt = anahtar(m.sirt ?? 0, f);
    }
    return { z: zW ? zT / zW : 0, ileri: zW ? iT / zW : 0, koltuk: kW > 0 ? kT / kW : null, sirt, yatir };
  }
  // Kök kayması ve koltuğu tutma (sırt açma): klip yerinde canlanır, yürüyüşü ve koltuğun çekilmesini site verir
  function kokuKaydir() {
    for (const [ad, a] of akt) {
      const m = M.klip[ad];
      if (!m || (!m.kayma && !m.tut) || !a.oynadi || !a.act.enabled) continue; // geçişte de: kayma sıçramasın
      const f = a.act.time * fps + 1, [fx, fy] = yon(ben.psi);
      if (m.kayma) {
        const v = anahtar(m.kayma, f), dv = v - (a.kayma ?? v);
        ben.x += fx * dv;
        ben.y += fy * dv;
        a.kayma = v;
      }
      if (m.tut && koltuk.obj) {
        const ic = f >= m.tut[0] && f <= m.tut[1];
        if (ic && !a.tutulan) { // tutulduğu an koltuğun köke göre yeri (karakterin yerel düzleminde)
          const dx = koltuk.x - ben.x, dy = koltuk.y - ben.y;
          a.tutulan = { ileri: dx * fx + dy * fy, yan: dx * fy - dy * fx, drz: fark(ben.psi + Math.PI, koltuk.rz) };
        }
        if (ic && a.tutulan) {
          const t = a.tutulan;
          koltuk.x = ben.x + fx * t.ileri + fy * t.yan;
          koltuk.y = ben.y + fy * t.ileri - fx * t.yan;
          koltuk.rz = ben.psi + Math.PI + t.drz + anahtar(m.don ?? 0, f);
        }
      }
    }
  }
  // Koltuğun yeri: katlılığı sırt açmadan; bağlıyken kökün arkasında, kliplerin söylediği uzaklıkta, oturanın yönünde
  function koltuguTasi(k) {
    if (k.sirt !== null) koltuk.katlama = k.sirt;
    if (koltuk.bagli && k.koltuk !== null) {
      const [fx, fy] = yon(ben.psi);
      koltuk.x = ben.x - fx * k.koltuk;
      koltuk.y = ben.y - fy * k.koltuk;
      koltuk.rz = ben.psi + Math.PI;
    }
  }
  // Karakterin dönüşümü: kök zeminde (konum, yön); oturan karakter oturakla birlikte koltuğun ekseni çevresinde döner.
  // Gövde kökün üstünde: kliplerin yüksekliği (oturuşta minderle çöker), ileri kayma yerel −y (bakış yönü)
  function karakteriYaz(k, oe, don) {
    if (koltuk.ust && koltuk.bagli && Math.abs(don) >= 1e-5) {
      const c = Math.cos(don), s = Math.sin(don), px = ben.x - koltuk.x, py = ben.y - koltuk.y;
      yer.position.set(koltuk.x + c * px - s * py, koltuk.y + s * px + c * py, 0);
      yer.rotation.z = ben.psi + don;
    } else {
      yer.position.set(ben.x, ben.y, 0);
      yer.rotation.z = ben.psi;
    }
    yer.visible = ben.gorunur;
    govde.position.z = k.z - (oe && koltuk.bagli ? koltuk.minderBoy * oe.ez : 0);
    govde.position.y = -k.ileri;
  }
  // Koltuğun dönüşümü: katlıyken sırt öne yatık, piston inik (masanın altına sığar); açılınca sırt dikilir, oturak
  // kalkar; emote'ta sırt geriye yaslanır (katlıyken değil); oturak kendi ekseninde döner; oturuşta minder tabanı sabit
  // ezilir
  function koltuguYaz(k, oe, don) {
    const o = koltuk.obj;
    o.position.x = koltuk.x;
    o.position.y = koltuk.y;
    o.rotation.z = koltuk.rz;
    const yat = Math.min(AYAR.yatirEnCok, k.yatir) * (1 - koltuk.katlama);
    if (koltuk.sirt) koltuk.sirt.rotation.x = CHAIR.sirtDik + (koltuk.sirtKatli - CHAIR.sirtDik) * koltuk.katlama + yat;
    if (koltuk.ust) { koltuk.ust.position.z = koltuk.ust0 * koltuk.katlama; koltuk.ust.rotation.z = don; }
    if (oe) for (const p of koltuk.minder) { p.m.scale.z = 1 - oe.ez; p.m.position.z = p.z0 + koltuk.minderTaban * oe.ez; }
  }
  // Kafa bakışı: kameraya (dans ederken, üzerine gelinince) ya da yakın plandaki ürüne (kenardayken); klibin üstüne eklenir
  function kafaCevir(dt) {
    const hedef = reduce || !story ? null : uzerinde && Math.abs(donus.a) < 0.1 ? 'kamera' : bakis; // dönükken kameraya bakmaz
    bak.k += ((hedef ? 1 : 0) - bak.k) * Math.min(1, dt * 3);
    if (!kafa || bak.k < 0.01 || !story) return;
    kafaTaban.copy(kafa.quaternion);
    kafaDegisti = true;
    yer.updateMatrixWorld(true);
    kafa.getWorldPosition(kafaW);
    if (hedef === 'urun') { if (xr.urun && xr.urunId === story.focusedId) hedefW.copy(xr.urun); } else if (hedef) hedefW.copy(story.camera.position);
    const dx = hedefW.x - kafaW.x, dy = hedefW.y - kafaW.y;
    const psiG = yer.rotation.z; // görünen yön (oturak dönüşü dahil)
    const yaw = kenet(fark(psiG, aciOf(dx, dy)), -0.75, 0.75), pitch = kenet(Math.atan2(hedefW.z - kafaW.z, Math.hypot(dx, dy)), -0.35, 0.35);
    bak.yaw += (yaw - bak.yaw) * Math.min(1, dt * 4);
    bak.pitch += (pitch - bak.pitch) * Math.min(1, dt * 4);
    const [fx, fy] = yon(psiG);
    sag.set(fy, -fx, 0);
    qPitch.setFromAxisAngle(sag, bak.pitch * bak.k * 0.8);
    qYaw.setFromAxisAngle(Z, bak.yaw * bak.k);
    qTmp.multiplyQuaternions(qYaw, qPitch); // dünyada ek dönüş → kemiğin yerel uzayına: P⁻¹ q P L
    kafa.parent.getWorldQuaternion(qPar);
    qInv.copy(qPar).invert();
    kafa.quaternion.premultiply(qTmp.premultiply(qInv).multiply(qPar));
  }

  // ---- x-ray ve seyrelme: kamera güncellendikten sonra, çizimden hemen önce ----
  const bufBoy = new THREE.Vector2(), pUrun = new THREE.Vector3(), pE = new THREE.Vector3(), pB = new THREE.Vector3(), kutu = new THREE.Box3();
  const xr = { guc: 0, sol: 1, kareNo: -1, urun: null, urunId: null, urunT: -9, t: 0, haric: new Set() };
  const fare = { x: 0, y: 0, zone: null, t: 0 }; // genel planda imleç (istemci koordinatı) ve altındaki ürün
  const fareDelikte = () => donAcisi(fare.zone) !== undefined;
  let kareNo = 0;
  function xrayHesapla(cam) {
    // v6: elden yakın planda (core/oda-sunum.js xrayKilit) gövde seyrelmez, daire açılmaz: yarı saydam gövde eldeki eşyayı
    // örtüyordu; kamera açısı gövdeyi eşyanın arkasında tutar
    // v8.3 (kullanıcı: "göremiyorsak sorun kamerada"): x-ray deliği ve seyrelme kapalı; kadrajlar Biggie'nin işi
    // ve nesneyi örtmeyeceği açıda (core/oda-yerler.js, core/oda-sunum.js)
    if (!story || !ben.gorunur || xr.kilit || AYAR.xrayYok) { XR.xrGuc.value = 0; XR.xrSol.value = 1; xr.sol = 1; xr.guc = 0; return; }
    const r = story.renderer;
    r.getDrawingBufferSize(bufBoy);
    const W = bufBoy.x, H = bufBoy.y, simdi = performance.now() / 1000, dt = Math.min(0.1, simdi - xr.t || 0.016);
    xr.t = simdi;
    // Seyrelme: kamera karakterin bir kemiğine çok yaklaştıysa (yakın plan uçuşu içinden geçiyor)
    let enYakin = Infinity;
    for (const b of kemikler) enYakin = Math.min(enYakin, b.getWorldPosition(pE).distanceTo(cam.position));
    const solHedef = reduce ? (enYakin < AYAR.yakin[0] ? 0 : 1) : aralik(enYakin, AYAR.yakin[1], AYAR.yakin[0]);
    xr.sol += (solHedef - xr.sol) * Math.min(1, dt * 14); // ~0,2 sn'de oturur (kare hızından bağımsız)
    XR.xrSol.value = xr.sol > 0.97 ? 1 : xr.sol;
    // Daire: yakın plandaki ürünün önünde karakterden ya da koltuktan bir parça varsa
    // v8: Biggie'nin kendisinin konu olduğu duraklarda (armutta uyur, masada çalışır...) daire açılmaz (xrayHaric)
    const id = story.focusedId && !xr.haric.has(story.focusedId) ? story.focusedId : null;
    let ortu = false, rpx = 0;
    if (id) {
      if (xr.urunId !== id || saat - xr.urunT > 0.4) { xr.urun = story.api?.center(id) ?? null; xr.urunId = id; xr.urunT = saat; }
      if (xr.urun) {
        pUrun.copy(xr.urun).project(cam);
        const uzU = cam.position.distanceTo(xr.urun);
        const pxPerMm = H / 2 / (Math.tan((cam.fov * Math.PI) / 360) * uzU);
        rpx = kenet(150 * pxPerMm, 0.16 * Math.min(W, H), 0.34 * Math.min(W, H));
        const cx = (pUrun.x * 0.5 + 0.5) * W, cy = (pUrun.y * 0.5 + 0.5) * H;
        XR.xrMerkez.value.set(cx, cy);
        const dene = (p, yariMm) => {
          const uz = p.distanceTo(cam.position);
          if (uz > uzU - 40) return false;
          pE.copy(p).project(cam);
          if (pE.z > 1) return false;
          const px = (pE.x * 0.5 + 0.5) * W, py = (pE.y * 0.5 + 0.5) * H, pay = (yariMm * H) / 2 / (Math.tan((cam.fov * Math.PI) / 360) * uz);
          return Math.hypot(px - cx, py - cy) < rpx + pay;
        };
        for (const b of kemikler) if (dene(b.getWorldPosition(pB), 90)) { ortu = true; break; }
        if (!ortu && koltuk.obj) {
          kutu.setFromObject(koltuk.obj);
          for (let i = 0; i < 8 && !ortu; i++) ortu = dene(pB.set(i & 1 ? kutu.max.x : kutu.min.x, i & 2 ? kutu.max.y : kutu.min.y, i & 4 ? kutu.max.z : kutu.min.z), 60);
          if (!ortu) ortu = dene(kutu.getCenter(pB), 200);
        }
      }
    } else if (fareDelikte()) {
      // Genel planda fare masadaki gizli ürünün (figur yuvası) üzerinde: imlecin çevresinde ürünün uzaklığında
      // ~12 cm'lik daire karakteri ve koltuğu siler, arkadaki ürün görünür (karakter orada değilse daire görünmez)
      if (xr.urunId !== fare.zone || saat - xr.urunT > 0.4) { xr.urun = story.api?.center(fare.zone) ?? null; xr.urunId = fare.zone; xr.urunT = saat; }
      const uzU = xr.urun ? cam.position.distanceTo(xr.urun) : 1500, rc = r.domElement.getBoundingClientRect();
      rpx = Math.max(18, ((AYAR.fareCap / 2) * H) / 2 / (Math.tan((cam.fov * Math.PI) / 360) * uzU));
      XR.xrMerkez.value.set(((fare.x - rc.left) / rc.width) * W, (1 - (fare.y - rc.top) / rc.height) * H);
      ortu = true;
    }
    xr.guc +=((ortu ? 1 : 0) - xr.guc) * (reduce ? 1 : Math.min(1, dt * 10));
    XR.xrGuc.value = xr.guc < 0.01 ? 0 : xr.guc;
    XR.xrYaricap.value = rpx || XR.xrYaricap.value;
  }

  // ---- tıklama ve üzerine gelme: kemik noktalarına ışın uzaklığı ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function isinda(e) {
    if (!story || !ben.gorunur) return null;
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, story.camera);
    let en = null;
    for (const b of kemikler) {
      b.getWorldPosition(pE);
      const t = pE.clone().sub(ray.ray.origin).dot(ray.ray.direction);
      if (t <= 0) continue;
      if (ray.ray.distanceSqToPoint(pE) < 150 * 150 && (!en || t < en)) en = t;
    }
    return en;
  }
  function tepki(tur) {
    if (reduce || saat - sonTepki < AYAR.tepkiAra) return;
    if (ben.yer !== 'koltuk') return;
    if (tur === 'sablon' && Math.random() > AYAR.sablonTepki) return;
    sonTepki = saat;
    tepkiler = [tur === 'tik' ? (Math.random() < 0.6 ? 'sevin' : 'kafa_salla') : Math.random() < 0.5 ? 'sevin' : 'inanamama'];
  }

  // ---- dışarıya ----
  return {
    nesne: yer,
    // Sahneye ekler: koltuğu bulur (sırtını katlar), merdiveni ve ipi kurar, sahnenin karesine ve odaklarına bağlanır
    sahneye(scene, built) {
      sahne = scene;
      scene.add(yer);
      const k = scene.getObjectByName('koltuk');
      if (k) {
        koltuk.obj = k;
        koltuk.x = k.position.x; koltuk.y = k.position.y; koltuk.rz = k.rotation.z;
        koltuk.ev = { x: koltuk.x, y: koltuk.y, rz: koltuk.rz }; // masanın altındaki ilk yeri (sunumda kalkınca geri döner)
        // Koltuğun malzemeleri kopyalanır (aynı GLB'deki başka eşyalarla ortak olabilir), x-ray yalnız koltuğa
        const kopya = new Map();
        const kop = (m) => { if (!kopya.has(m)) kopya.set(m, xrayYama(m.clone())); return kopya.get(m); };
        k.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(kop) : kop(o.material); });
        // Masanın altına itilmiş hâli GLB'de (scripts/oda-blender.py koltuk_kur): sırt menteşede öne katlı, oturak inik
        const s = k.getObjectByName('koltuk_sirt'), u = k.getObjectByName('koltuk_ust');
        if (s) { koltuk.sirt = s; if (Math.abs(s.rotation.x) > 0.8) koltuk.sirtKatli = s.rotation.x; }
        if (u) { koltuk.ust = u; koltuk.ust0 = u.position.z; }
        // Minder (oturak, kenarı, paneli, kanatlar): oturuşta tabanı sabit ezilir; çöküş oturağın üstüne göre (kanatsız)
        koltuk.minder = [];
        u?.traverse((o) => { if (o.isMesh && /^koltuk_oturak/.test(o.name)) koltuk.minder.push({ m: o, z0: o.position.z }); });
        if (koltuk.minder.length) {
          const b = new THREE.Box3(), ust = new THREE.Box3();
          for (const p of koltuk.minder) {
            p.m.geometry.computeBoundingBox();
            b.union(p.m.geometry.boundingBox);
            if (!/kanat/.test(p.m.name)) ust.union(p.m.geometry.boundingBox);
          }
          koltuk.minderTaban = b.min.z;
          koltuk.minderBoy = ust.max.z - b.min.z;
        }
        koltuk.katlama = 0; // v8.3 (kullanıcı): başlangıçta masaya itilmiş, sırtı açık (katlı değil)
      }
      // Merdiven (yangın kaçışı, balkonun sağ duvarında) ve ip: üst kattan iner, yukarı toplanır
      const metal = new THREE.MeshStandardMaterial({ color: 0x2a2b2d, metalness: 0.7, roughness: 0.42 });
      // Merdiven düzlemi xz (karakter +y'ye bakarak iner); basamaklar Blender'daki klibin basamaklarıyla aynı yükseklikte
      const MD = M.merdiven, boy = 3800, w = MD.en, parca = []; // tek ağ: ~40 parça tek çizim
      for (const sx of [-1, 1]) parca.push(new THREE.BoxGeometry(36, 24, boy).translate((sx * w) / 2, 0, boy / 2));
      for (let z = MD.ilk; z < boy; z += MD.aralik) parca.push(new THREE.CylinderGeometry(12, 12, w, 12).rotateZ(Math.PI / 2).translate(0, 0, z)); // silindir Y ekseninde: x'e çevir
      for (let z = 200; z < boy; z += 900) for (const sx of [-1, 1]) parca.push(new THREE.BoxGeometry(20, 50, 20).translate((sx * w) / 2, 30, z)); // korkuluğa tutturma
      const mr = new THREE.Mesh(mergeGeometries(parca), metal);
      parca.forEach((x) => x.dispose());
      mr.castShadow = true;
      mr.receiveShadow = true;
      mr.position.set(INIS_X, INIS_Y, 2600);
      mr.visible = false;
      const ip = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, boy, 10).rotateX(Math.PI / 2).translate(0, 0, boy / 2 + 40),
        new THREE.MeshStandardMaterial({ color: 0x9a8058, roughness: 0.92 }));
      ip.castShadow = true;
      ip.position.set(INIS_X + (M.ip.yan ?? 0), INIS_Y, 2600); // klipte ip kökün 240 mm önünde, 18 mm yanında
      ip.visible = false;
      scene.add(mr, ip);
      arac.merdiven = mr;
      arac.ip = ip;
      // Sahnenin karesine eklenir; x-ray kamera güncellendikten sonra, çizimden hemen önce hesaplanır
      const u0 = built.update?.bind(built);
      built.update = (t, dt) => { kareNo++; u0?.(t, dt); update(t, dt ?? 1 / 60); };
      const eski = scene.onBeforeRender;
      scene.onBeforeRender = (r, s, cam, rt) => {
        eski?.call(scene, r, s, cam, rt);
        if (xr.kareNo === kareNo) return; // bir karede birden çok çizim (ara görüntü geçişleri)
        xr.kareNo = kareNo;
        xrayHesapla(cam);
      };
    },
    // Denetleyici kurulunca: kamera, odak ve tıklamalar
    bagla(s) {
      story = s;
      kenarlar = null;
      const host = s.renderer?.domElement?.parentElement;
      if (!host) return;
      let sonHover = 0, asagiNokta = null;
      host.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || performance.now() - sonHover < 90) return;
        sonHover = performance.now();
        uzerinde = isinda(e) !== null;
      });
      // İmleç dairesi: konum her harekette, altındaki ürün ~60 ms'de bir (yakın planda kapalı; dokunmatikte fare yok)
      host.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        fare.x = e.clientX;
        fare.y = e.clientY;
        if (performance.now() - fare.t < 60) return;
        fare.t = performance.now();
        fare.zone = s.focusedId ? null : s.hit?.(e.clientX, e.clientY) ?? null;
      });
      host.addEventListener('pointerleave', () => { uzerinde = false; fare.zone = null; });
      host.addEventListener('pointerdown', (e) => { asagiNokta = [e.clientX, e.clientY]; }, true);
      // Karaktere tıklama ürüne gitmesin (önündeyse): yakalama evresinde durdurulur. İmleç dairesi açıkken ürün
      // görünür: tıklama ürüne gider
      host.addEventListener('pointerup', (e) => {
        if (!asagiNokta || Math.hypot(e.clientX - asagiNokta[0], e.clientY - asagiNokta[1]) > 8) return;
        if (fareDelikte()) return;
        const t = isinda(e);
        if (t === null) return;
        const z = s.hit?.(e.clientX, e.clientY), c = z && s.api?.center(z);
        if (c && c.distanceTo(s.camera.position) < t) return; // ürün önde
        e.stopPropagation();
        tepki('tik');
        uzerinde = true;
      }, true);
      // Şablon değişince ara sıra tepki (panelin onChange'i korunur)
      if (s.api) {
        let oc = s.api.onChange;
        const sar = (z, i) => { oc?.(z, i); tepki('sablon'); };
        Object.defineProperty(s.api, 'onChange', { configurable: true, get: () => sar, set: (f) => { oc = f; } });
      }
    },
    asagi() { yonet('oda'); },
    // Rehberli sunum (core/oda-sunum.js): olayları dinle (ad, veri) → bırakma işlevi; durağa git (D: BIGGIE_DURAK
    // girdisi; sunum kapalıysa ya da hareket azaltmada false); çalışmaya dön: sunum biter, sandalyesine gidip oturur
    dinle(f) { dinleyiciler.add(f); return () => dinleyiciler.delete(f); },
    durakaGit(D) { if (reduce || !sunum.aktif || !D) return false; yonet((d) => durakGorevi(D, d)); return true; },
    // v7: durakta pozunda beklerken (D.tut) klip dizisi gönder ({ klip, sure, anlar } listesi, diziOyna biçimi); son: true
    // ise bitince bekleme biter. Söz: dizi tamamlandıysa true; bekleme yoksa ya da kesildiyse false
    komut(dizi, { son = false } = {}) {
      if (!tutan) return Promise.resolve(false);
      return new Promise((coz) => tutan.kuyruk.push({ dizi, son, coz }));
    },
    get tutuyor() { return !!tutan; },
    // v8: durakta pozunda beklerken (tutan) yerinde psi yönüne döner (sure sn, yumuşak); büstü odaya göstermek için
    don(psi, sure = 0.8) {
      if (!tutan) return Promise.resolve(false);
      const S = tutan, b = ben.psi, de = fark(b, psi);
      let t = 0;
      return kare((dt) => { if (tutan !== S) return 'iptal'; t = Math.min(1, t + dt / Math.max(0.01, sure)); ben.psi = b + de * yumusak(t); return t >= 1 ? 'tamam' : null; }).then((r) => r === 'tamam');
    },
    // v8.2: kök yerinde (dx, dy) mm kayar (sure sn, yumuşak; büst rafın önünden geri adım: core/oda-sunum.js)
    kay(dx, dy, sure = 0.3) {
      const x0 = ben.x, y0 = ben.y, n = nesil;
      let t = 0;
      return kare((dt) => { if (n !== nesil) return 'iptal'; t = Math.min(1, t + dt / Math.max(0.01, sure)); const u = yumusak(t); ben.x = x0 + dx * u; ben.y = y0 + dy * u; return t >= 1 ? 'tamam' : null; }).then((r) => r === 'tamam');
    },
    // Çalan klip ve zamanı (sn, kare): armudun ezilmesi klibe bağlanır (core/oda-sunum.js)
    klipZamani() { const a = simdiki; return a ? { ad: a.clip.name, t: a.act.time, sure: a.clip.duration, kare: a.act.time * fps + 1, agirlik: a.act.getEffectiveWeight() } : null; },
    // Deri ağları (kadraj ölçümünde örtülme: core/oda-kadraj.js olcum)
    deriAglari() { const l = []; yer.traverse((o) => { if (o.isSkinnedMesh && o.visible) l.push(o); }); return l; },
    calismayaDon() { sunum.aktif = false; if (reduce) return; yonet('oda'); },
    get sunumda() { return sunum.aktif; },
    // Sahnenin sunuma özgü ek bilgisi: engel (yol bulma: [{ k } | { d }], core/oda-portfolyo.js ENGEL), cop() → { x, y, z, r }
    sunumAyar({ engel, cop } = {}) { if (engel) ekEngel = engel.filter((e) => e.k || e.d); if (cop) copFn = cop; },
    get elma() { return { kalan: elma.kalan, elde: !!elma.elde, isirik: elma.isirik, bitti: elma.bitti, atilan: elma.atilan, isabet: [...elma.isabet], yay: elma.yay ?? null }; },
    get yerTutucu() { return [...sunum.yerTutucu]; },
    // Sağ el kemiği (v5: eşya ele alınır; kemiğin yerel birimi metre): yoksa null
    get elKemigi() { return elKemik; },
    // v6: gövdeyi taşıyan kemikler (kadraj hesabında ışın engeli; core/oda-kadraj.js) ve x-ray kilidi (elden yakın plan)
    get govdeKemikleri() { return kemikler; },
    xrayKilit(on) { xr.kilit = !!on; },
    // v8.1: her karede klip karıştırıldıktan (ve baş çevrildikten) sonra f(dt); döner: bırakma işlevi
    kareSonu(f) { kareSonlari.add(f); return () => kareSonlari.delete(f); },
    // v8: bu durak kimliklerinde yakın plan dairesi (gövdenin seyrelmesi) yok
    xrayHaric(ids) { xr.haric = new Set(ids ?? []); },
    kemik: (ad) => model.getObjectByName(ad) ?? null,
    // v8.2: üst gövde katmanı (bust_tut ↻; yürürken eşlikçisi bust_tut_yuru): ad | null; { tekrar: false } bir kez
    ustKatman: (ad, o) => ustKatman(ad, o),
    get ustKlip() { return ust.ad; },
    get ustOynayan() { for (const [ad, u] of ustA) if (u && u === ust.oynayan) return { ad, w: +u.w.toFixed(2), kare: +(u.act.time * fps + 1).toFixed(1) }; return null; },
    meta: (ad) => M.klip[ad] ?? null,
    klipVar: (ad) => var_(ad),
    yerelDunya: (v) => yerelDunya(v),
    elNoktasi(v = new THREE.Vector3()) { yer.updateMatrixWorld(true); return elKemik ? elKemik.getWorldPosition(v) : v.set(ben.x, ben.y, 950); },
    // Ekranda kafanın üstü (balon için): dünya noktası
    kafaUstu(v = new THREE.Vector3()) { yer.updateMatrixWorld(true); return kafa ? kafa.getWorldPosition(v).add(new THREE.Vector3(0, 0, 260)) : v.set(ben.x, ben.y, 1650); },
    kalcaNoktasi(v = new THREE.Vector3()) { return kalca ? kalca.getWorldPosition(v) : v.set(ben.x, ben.y, 700); },
    yukari() { if (reduce) { nesil++; ben.gorunur = false; ben.yer = 'ust'; return; } yonet('yukari'); },
    masayaKoy,
    // v8.5: yürürken yolun kalan düğümleri ([{ x, y }]; robot süpürge bunlardan uzak durur), yürümüyorsa null
    get yolKalan() { return ben.yolKalan?.() ?? null; },
    get durum() { return { yer: ben.yer, x: Math.round(ben.x), y: Math.round(ben.y), psi: +ben.psi.toFixed(2), arac: ben.arac, klip: simdiki?.clip.name ?? null, koltuk: { katlama: koltuk.katlama, bagli: koltuk.bagli } }; },
    debug: {
      ben, koltuk, koltukYeri, YER, M, akt, oturAd, engeller, serbest: (a, b, E = engeller()) => serbest(a, b, E, AYAR.pay),
      yolBul: (a, b, E = engeller()) => yolBul(a, b, E, dugum), kenarDuraklari, XR, update, fare, donus,
      bekleyen: () => kareler.size,
      AYAR, elmaDurum: elma, sunum, copNoktasi, get buzDurusKaynak() { return buzDurusKaynak; }, xr: () => ({ ...xr, sol: XR.xrSol.value, guc: XR.xrGuc.value }), // süren kare işleri (görevlerin bekleyişleri): iptalden sonra birikmemeli
    },
  };
}
