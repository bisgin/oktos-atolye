// Oda sahnesinin yer verisi: ürün yuvaları, sahne yerleri (eşyaların konumu) ve kamera durakları.
// core/oda-sahne.js bu yerlere dekoru ve ürünleri koyar. Birim mm, Z yukarı. Arka duvarın iç yüzü y = 1800; kamera
// odanın içinden, −y tarafından bakar. Mobilyanın ölçü ve yeri core/oda-olcu.js'te (Blender pişirmesiyle ortak).
import { OLCU, ON_DUVAR } from './oda-olcu.js';
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
// v8 (2026-11-04): oda yalnız portfolyo; görünen yuvaların ürünleri sahnede dekor (ilk ürünün modeli), işaretçi, kart ve
// tur durağı yok (core/oda-sahne.js). Askı panosu ve çerçeveler kalktı: anahtarlik, kilic, maske yuvaları sahnede yok.
export const GORUNEN = ZONES.filter((z) => z.urun > 0 && z.oda && !ETKILESIMSIZ.has(z.id));
// Yuva kimliği ya da eski durak kimliği → yuva (?odak=kalemlik gibi eski adresler de çalışsın); bulunamazsa null
export const yuvaBul = (id) => ZONES.find((z) => z.id === id) ?? ZONES.find((z) => z.yer === id) ?? null;

// Ürün yerleri: [x, y, z(taban), dönüş z]
export const A = {
  pedestal: [PEDESTAL.x, PEDESTAL.y, 0, 0], // çekmeceli dolap (üst çekmece −y yönünde açılır)
  tepsi: [PEDESTAL.x + 90, PEDESTAL.y + 210, PEDESTAL.h, 0], // dolabın üstünde, arkada, spot lambanın başının altında (dekor)
  pencup: [-1400, 1520, 740, 0],      // monitörün solunda (önceki yerde kalemler monitörün içine giriyordu)
  keyboard: [-1015, 1320, 740, 0.02], // v8.2: yaz klibinin parmak uçlarının altında (ölçüm: uçların ortası x −1003, y 1315)
  monitor: [MONITOR.x, MONITOR.y, 740, 0], // klavyenin arkasında (pilotta gerçekçi monitör)
  kartvizit: [-1385, 1395, 740, -0.22], // kalemliğin önü, kameraya hafif dönük
  clickers: [-760, 1235, 743, -0.35], // anahtarlık clicker: klavyenin önünde, mousepad'in üstünde (tuş setiyle aynı tasarım)
  modem: [-1110, 1690, 1328, 0.05],   // alt rafın solu (raflar masanın sağ yarısında: sol üst duvar başlığa kalır)
  qrHolder: [-950, 1700, 1328, -0.1],
  plakalar: [-760, 1690, 1328, 0],    // raf yuvası açıkken alt rafın ortasında tek diorama plakası (seçili; 2026-11-02)
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

// Kamera: giriş ve genel plan. v8 (2026-11-04, kullanıcı: "oda hiçbir zaman dışarıyı göstermesin; odayı bize doğru
// uzat, genel plan tüm odayı çevreleyerek görsün"): oda önde ON_DUVAR'a dek uzayıp kapandı (core/oda-sahne.js
// odayiUzat); genel plan ve giriş uçuşu bu kapalı hacmin içinden bakar. Asıl kadraj ekran oranına göre fitShot'ta.
export const SHOTS = {
  intro: { pos: [500, -4200, 2450], target: [0, 800, 900] },
  main: { pos: [150, -3500, 2300], target: [150, 800, 700] },
  portrait: { pos: [200, -8000, 1900], target: [200, 800, 700] }, // telefon (dikey)
};
// Genel plan ekran oranına göre (story.js built.fitShot(aspect, fov); oda-sahne altı işaretçinin yerini verir): kamera
// odanın ortasında (x işaretçilerin ortası), arkaya (−y) doğru adım adım çekilir; altı işaretçinin hepsi kadrajın iç
// bölgesinde (yatay NDC ±0,85, dikey ±0,8: kenardaki başlık ve kart şeridi altında kalmasın) kalınca durur. Kamera her
// zaman ön duvarın en az 300 mm içinde. Yükseklik adaylardan en alçak geçen (göz yüksekliğine yakın genel plan).
// Giriş uçuşu bunun 700 mm gerisinden ve yukarısından başlar (o da odanın içinde).
export function fitShot(aspect, fov, isaretler = null) {
  const pts = (isaretler?.length ? isaretler : GENEL_ISARET);
  // v8b (koordinatör, ekran görüntüsünden): dikey ekranda altı işaretçiyi tam genişlikte sığdırmak kamerayı ~8 m geri
  // atıyordu (oda ortada ince bir şerit, üstte ve altta boş tavan ve zemin bantları). Dikeyde kamera odanın içinde,
  // ön kesitin 600 mm gerisinde; oda ekranın yüksekliğini doldurur, odanın ortasına bakar; yanlardaki işaretçilere parmakla
  // yana kaydırarak bakılır (core/oda-sunum.js; sınırlar PORTRE_BAKIS)
  if (aspect < 0.9) {
    const xs0 = pts.map((p) => p[0]), cx0 = Math.round((Math.min(...xs0) + Math.max(...xs0)) / 2 / 50) * 50;
    // v8.2: görüş açısı genişledikçe kamera yaklaşır (58° → y −2400; her derece 25 mm öne; 70° → −2100)
    const yk = Math.min(-1300, -2400 + Math.max(0, fov - 58) * 25);
    return { main: { pos: [cx0, yk, 1450], target: [cx0, 800, 1150] }, intro: { pos: [cx0 + 250, yk - 600, 1750], target: [cx0 - 100, 800, 1300] } };
  }
  const tv = Math.tan((fov * Math.PI) / 360), th = tv * aspect;
  const xs = pts.map((p) => p[0]), cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2 / 50) * 50;
  const ty = 800, onSinir = ON_DUVAR.y + 300;
  const sigar = (pos, tgt) => {
    const f = [tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]], L = Math.hypot(...f);
    f.forEach((_, i) => { f[i] /= L; });
    const r = [f[1], -f[0], 0], rl = Math.hypot(r[0], r[1]); r[0] /= rl; r[1] /= rl;
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    return pts.every((a) => {
      const d = [a[0] - pos[0], a[1] - pos[1], a[2] - pos[2]], z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
      if (z < 300) return false;
      const x = (d[0] * r[0] + d[1] * r[1]) / z / th, y = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / z / tv;
      return Math.abs(x) <= 0.85 && Math.abs(y) <= 0.8;
    });
  };
  let main = null;
  for (let y = -1500; y >= onSinir && !main; y -= 100) {
    for (const z of [1700, 1900, 2100, 2300, 2450]) {
      for (const tz of [700, 900, 1100]) {
        const pos = [cx, y, z], target = [cx, ty, tz];
        if (sigar(pos, target)) { main = { pos, target }; break; }
      }
      if (main) break;
    }
  }
  // Sığmazsa (çok dar ekran) ön duvarın önünden, odanın orta yüksekliğinden: tavan ve zemin bantları eşit
  main ??= { pos: [cx, onSinir, 1550], target: [cx, ty, 1000] };
  const intro = { pos: [cx + 350, Math.max(onSinir, main.pos[1] - 700), Math.min(2500, main.pos[2] + 200)], target: [cx - 150, ty, main.target[2] + 200] };
  return { main, intro };
}
// Altı işaretçinin yaklaşık yeri (sahne kendi yerlerini verene dek yedek; core/oda-sahne.js hotspot anchor'ları)
const GENEL_ISARET = [[-1380, -560, 1150], [-1675, 520, 1980], [-1000, 1400, 1150], [1700, 850, 1000], [1980, -250, 1656], [1655, 142, 480]];

// Görüş açısı (derece, dikey; 2026-11-04 v7 kamera kuralı): ekran oranına göre sabit, etkileşimde değişmez (yaklaşma
// kameranın yeriyle). Oda içinde göz yüksekliğinden kadraj kurulabilsin diye geniş: yatay ekranda 42° (önce 30°: 4,2 m'lik
// odada kitaplık ve raf ancak duvarın dışından sığıyordu), kareye yakın 48°, dikey 58°
// v8.2 (kullanıcı: genel plan çok geride; daha yakından, daha geniş açı): üç seçenek denendi (yatay 42 / 55 / 65°, dikey
// 58 / 70 / 80°; Drive v8.2/oda karşılaştırma kareleri); seçilen yatay 55° (kamera −4200'den −3000'e), dikey 70°
// (genel plan −2100; yana kaydırma sürer). Yakın planlar aynı açıyla hesaplanır (oda-sahne odakKadraji)
export const FOV = { yatay: 55, kare: 60, dikey: 70 };

// Kenardan bakma sınırları (radyan, artı sola): solda dolap ve çerçeveler, sağda pencere ve buzdolabı
export const LOOK = { min: -0.52, max: 0.46, edge: 0.2, speed: 0.75 };
// v8b: dikey ekranda genel planda parmakla yana bakış sınırları (rad, artı sola): armut (sol ön) ve TV (sağ) kadraja girer
export const PORTRE_BAKIS = { min: -0.62, max: 0.62 };

// Yakın planlar (v8, 2026-11-04: oda yalnız portfolyo, altı durak). pos/target yalnız tercih edilen yön ve yedek: asıl
// kadraj o anki ekran oranı ve kart için core/oda-sahne.js odakKadraji'nde core/oda-kadraj.js bul ile hesaplanır (v7
// kamera kuralı: göz yüksekliği, oda içi, oda dışı piksel 0, Biggie odağı örtmez). w: telefonda sığacak genişlik.
// sabit: hesaplanmaz, verilen kadraj (masa: kullanıcının tarifi).
export const FOCUS = {
  // Kitaplık: v7: kadraj yalnız gözlerin bandı (z 650–2000; altı çekmece, üstü tepe)
  // v8.3: sabit (hesaplanan kadraj, Biggie durağı değişince kamerayı köşeye, kitaplığın yanına kaçırıyordu)
  kitaplik: { pos: [600, -1500, 1550], target: [-1890, 520, 1300], w: 1410, kutuZ: [650, 2000], sabit: true },
  // v8.3 (kullanıcı: ilk tıklamada kutular görünür açıda): rafın önüne ~37° (önceki kadraj rafın yüzünü sıyırıyordu);
  // Biggie rafın balkon ucunda (kadrajın solu), diz çöküp kutu alırken bakış çizgisinin yanında
  // v8.5 (kullanıcı çizimi: kamera rafın sağ ve ön tarafından, alçaktan rafa bakıyor; bütün kutular görünür, Biggie
  // kadrajın solunda): göz yüksekliğinin altında (1000), rafın −y ucunun önünden; yan kart ötelemesiyle (motor) Biggie
  // kartın sağında, rafın üstü (kutunun konacağı yer) ve üç göz birlikte. Kutu açılınca da bu kadraj (Biggie kıpırdamaz)
  oyunlar: { pos: [600, -1650, 1000], target: [1680, -20, 430], w: 1500, sabit: true, dikey: { pos: [500, -2300, 1250], target: [1700, -150, 380] } },
  ekran: { pos: [-900, -1900, 1600], target: [2075, -250, 1253], w: 2169 },
  // Armut (Hakkımda): TV tarafından, odanın içinden (v8: oda önde kapalı, köşedeki armuda da göz yüksekliğinden bakılır)
  armut: { pos: [300, -1700, 1550], target: [-1380, -560, 600], w: 1400 },
  // dikey (v8b): telefonda hesaplanan kadraj Biggie'yi ekranı dolduracak yakınlıkta veriyordu; odanın ortasından,
  // Biggie ve açık buzdolabı birlikte ekranın üst yarısında (kart altta)
  buzdolabi: { pos: [-1641, -1452, 1568], target: [1700, 850, 700], w: 1439, dikey: { pos: [-450, -1500, 1650], target: [1400, 600, 650] } },
  // Masa (v8, kullanıcı: masanın ~1,3 m (iki adım) sağında, göz yüksekliğinde; bütün masa ve çalışan Biggie)
  // dikey (telefon): masanın sağ önünden çapraz (yandan bütün masa dar ekrana ancak duvarın dışından sığıyordu)
  // v8.2 (kullanıcı): bir adım sola ve daha çapraz: monitörün ekranı okunur (video), Biggie ekranın önünü örtmez
  masa: { pos: [520, 380, 1600], target: [-950, 1450, 950], w: 1900, sabit: true, dikey: { pos: [450, -450, 1600], target: [-950, 1350, 950] } },
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
// v8 (2026-11-04): altı durak (armut, kitaplık, masa, buzdolabı, ekran, kutu oyunları) ve çöp (elma atışı; tıklanmaz).
// Ürün yuvalarının ve kara tahtanın durakları kalktı.
// Armut ve TV aynı oturuş: kök armudun ekseninden armut_yat.armut.eksen_mm önde (capa; armut core/oda-portfolyo.js
// PORT.armut (−1380, −560; v8.2), önü TV'ye, rz π/2 + 0,08 ≈ 95°). Armut: armut_yat → armut_uyukla döngüsü (gözler kapalı,
// uyuklar), kart Hakkımda. TV: armut_yat eller ensede karesine dek, orada durur (gözler açık, TV izler), kart Süreç
// (core/oda-sunum.js armutDurak / ekranDurak).
const ARMUT_CAPA = { anahtar: 'armut.eksen_mm', nokta: [-1380, -560], klip: 'armut_yat' }; // v8.2: armut 180 mm öne
export const BIGGIE_DURAK = [
  // Kitaplık (v8, kullanıcı: yüzü kitaplığa dönük; önce sırtını yaslıyordu): rafın +y ucunun önünde, kitaplığa bakar
  // (−x); kamera odanın içinden, Biggie odağın (gözler) önünde değil. Büste tıklanınca kitap_al_* ile eline alır
  // (core/oda-sunum.js bustAl)
  // v8.1 (kullanıcı: masanın ve sandalyenin içine giriyordu): kitaplığın ortasının önü, büstlerin (y ≈ 220) yanı; gövdesi
  // masadan (y ≥ 1100) ve sandalyeden uzak (sunum-test gövde sütunu denetimi)
  // v8.3: sandalye odada kalınca (masa_kalk: çekik, sırtı kitaplığa dönük) onun sırtından uzak, büstlerin yanında
  { id: 'kitaplik', yer: [-950, 160], yon: -90, klip: 'dur', sure: 3, kitapKlip: ['kitap_al_alt', 'kitap_al_orta', 'kitap_al_ust'],
    kadraj: { pos: [600, -1500, 1550], target: [-1702, 520, 1225], w: 1587 } },
  // Kutu oyunları rafı (v7): rafa tıklanınca Biggie rafın buzdolabı tarafında bekler; kutuya tıklanınca diz_cok →
  // kutu_al_diz (kutu rafın üstüne) → diz_bekle döngüsü; oklar kutu_cevir_sag/_sol, "Geri" kutu_rafa_birak → diz_kalk
  // v8.3 (kullanıcı): rafın balkon tarafındaki ucunun yanında (eski çöpün yeri), kameradan solda; kutuları örtmez
  // v8.5 (kullanıcı çizimi: buzdolabının önü ile rafın sol ucu arası): Biggie rafın +y (buzdolabı) ucunun önünde bekler,
  // yüzü rafın üstüne ve gözlerine (ψ 50°); buzdolabının köşesine (1550, 600) 228 mm, rafın köşesine (1695, 312) 304 mm
  // (yol bulma engelleri köşede kare büyüdüğü için y < 440 ve x < 1535 olmalı). Kutu seçilince buradan uzanıp alır, rafın
  // üstüne (ust: kutunun rafın üstündeki merkezi, x, y mm) koyar; kutu klipleri (kutuV85, klip ajanı v8.5) bu durağa göre
  // parametrik. Klipler gelmeden v7 akışı (gözün önüne yürüyüp diz çöker) sürer
  { id: 'oyunlar', yer: [1410, 420], yon: 50, klip: 'bekle', sure: 3, kutuDizi: ['diz_cok', 'kutu_al_diz', 'diz_kalk'],
    kutuV7: { bekle: 'diz_bekle', cevir: 'kutu_cevir_sag', cevirSol: 'kutu_cevir_sol', birak: 'kutu_rafa_birak', kalk: 'diz_kalk' },
    kutuV85: { al: 'kutu_uzan_al', bekle: 'kutu_uzan_bekle', cevir: 'kutu_uzan_cevir_sag', cevirSol: 'kutu_uzan_cevir_sol', birak: 'kutu_uzan_birak', ust: [1890, 140] },
    kadraj: { pos: [300, -1350, 1450], target: [1800, -150, 330], w: 1500 } },
  // TV: armuda oturur, 'bas' karesinde TV açılır, eller ensede izler. yer yalnız yedek (kök capa ile)
  { id: 'ekran', yer: [-865, -520], yon: 95, klip: 'armut_yat', sure: 10, oturus: true, izle: true,
    capa: ARMUT_CAPA, otur: [-1380, -560, 220], acAn: { meta: 'bas', kesir: 0.3 },
    kadraj: { pos: [-900, -1900, 1600], target: [1490, -279, 1153], w: 1855 } },
  // Armut (Hakkımda): armuda gömülür, gözlerini kapatıp uyuklar
  { id: 'armut', yer: [-865, -520], yon: 95, klip: 'armut_yat', sure: 10, oturus: true,
    capa: ARMUT_CAPA, otur: [-1380, -560, 220],
    kadraj: { pos: [300, -1700, 1550], target: [-1380, -560, 600], w: 1400 } },
  // Buzdolabı: meyve varken buzdolabi_ac (elmayı alır), bitince buzdolabi_bos; duruş kapağın süpürme yayının dışında
  // (core/oda-karakter.js buzDurus: meta durus_mm, yoksa menteşe kapak_en + pay uzaklığa uzatılır)
  // v8.3: masaya: elmayı alınca masaya gidip oturarak yer, oradan çöpe atar (core/oda-karakter.js masadaElma)
  { id: 'buzdolabi', yer: [1220, 300], yon: 90, klip: 'buzdolabi_ac', yedek: 'buzdolabi_bos', sure: 5, durus: { meta: 'durus_mm', pay: 190 }, masaya: true,
    tercih: [-0.4, -1, 0.4],
    kadraj: { pos: [-1641, -1452, 1568], target: [1580, 820, 725], w: 1439 } },
  // Çöp: elma_firlat bulunduğu yerden de atılır; bu nokta çöpe yürüyüp atmak içindir (işaretçi yok). Çöpün ağzı
  // api.nesne('cop').userData.agiz
  // v8.5 (kullanıcı: Biggie hiçbir durakta çöpün önünde beklemesin; çöp buzdolabının arkasındaki köşede (1950, 1650)):
  // atış yeri odanın ortasında, çöpe ~1,5 m, yüzü çöpe (ψ ≈ 116°); çöpün önünü (buzdolabı ile pencere arası) kapatmaz
  { id: 'cop', yer: [600, 1000], yon: 116, klip: 'elma_firlat', sure: 2.5,
    kadraj: { pos: [-1917, -1599, 1576], target: [1549, 332, 725], w: 1433 } },
  // Masa (v6): sandalyeye oturur, masaya kayar, yazar; monitörde masa-ekran.mp4 ('oturdu'; core/oda-monitor.js). Kamera
  // FOCUS.masa (sabit; masanın ~1,3 m sağı). v8: başka durağa tıklanınca kalk klibiyle kalkıp gider
  { id: 'masa', yer: [-960, 812.5], yon: 180, klip: 'otur', yedek: 'otur2', sure: null, masa: true,
    kadraj: { pos: [520, 380, 1600], target: [-950, 1450, 950], w: 1900 } },
];

export const LIGHTS = {
  center: [0, 1200, 900],
  key: [-1500, -2600, 3800],
  fill: [2400, -1200, 1500],
  rim: [600, 4400, 2800],
  shadowSpan: 3200,
  keyIntensity: 2.6,
};
