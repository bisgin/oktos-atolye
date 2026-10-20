# Oda sahnesi: tasarım ve üretim hattı

Taslak, 2026-10-17. **Durum:** hat C seçildi; Aşama 1 (gri kutu) onaylandı. Aşama 2 kuruldu, onay bekliyor:
12 bölgenin hepsinde araçların gerçek şablonları, odakta şablon değiştirme, kenar paneli ve toz yazısı
(`core/oda-panel.js`). Deneme `lab/oda.html`.
2026-10-17: v1 `oda-sahnesi` dalına commitlendi. Yön değişti: ürünlerimiz dışında her şey fotogerçekçi olacak
(gerçek çiçek ve toprak, ışık huzmeleri, monitör, buzdolabı, cam bardak). Balkon kapısı sürgülü (iki kanat ortadan
açılır, pencerelerin önünde durur). Önce tek bölgede pilot (pencere kenarı saksıları), gri kutuyla yan yana.
Pilot (önizleme kalitesi) kuruldu: `lab/oda.html?pilot=1`, yan yana `lab/oda-pilot.html`. Oda kabuğu, mermer
pervazlar, kasalar ve balkon Blender'da Poly Haven dokularıyla kurulup sabah güneşiyle pişirildi
(`scripts/oda-blender.py`); balkonun ardında gerçek gökyüzü, ürünlerin yansıması odanın 360° görüntüsünden, kapı ve
pencerelerden güneş huzmeleri, saksıda toprak (saksının kendi kesitinden) ve gerçek çiçek (Poly Haven cezayir
menekşesi). Mobilya şimdilik gri kutu. Son kalite pişirme yapıldı (2048/1024 px, 1024 örnek, RTX 3060'ta 3 dk);
sitenin indirdiği pilot dosyaları ~1 MB (+ Draco çözücüsü 0,25 MB). Sıradaki: mobilya ve eşyalar fotogerçekçi
(monitör, mini buzdolabı ve pasta, cam bardak, masa, raflar), güller Sketchfab CC-BY ile.
Eşyalar başladı: klavyenin arkasında 24" monitör (ekranında Kutu aracının sayfası), gerçekçi mini buzdolabı (kapak
menteşede açılır, içte ışık yanar, cam raf, kapak rafları) ve içinde Poly Haven CC0 çilekli pasta (süsümüz üstüne
batar). Gri kutu mobilya pişirmeye gölge vekili olarak girdi (zemin ve duvarda temas gölgesi), son kalite pişti.
Balkon masasında kupanın yerine cam Türk çay bardağı, demli çay ve porselen tabak (kodla, gerçek cam malzemesi).
Ekmek için Poly Haven'da somun yok: hamburger ekmeği (CC0) ya da Sketchfab'dan somun seçilecek.
2026-10-18 geri bildirim turu: ahşap süpürgelik ve kilim (desen koddan: basamaklı göller, zikzak bordür) pişirmede;
masa altında kasa, priz ve fiş, beyaz kablo kanalı, kablolu fare, keçe mousepad; balkonun ardında Poly Haven
'balcony' manzarası (ufuk 0,22 rad aşağı: görüntünün kendi korkuluğu döşemenin ardında); balkonda antoryum ve gazanya
(gri top ağaç ve lavantanın yerine); balkon masası yakın planı kapı boşluğundan; rölyef küçük çerçeveyle monitörün sol
üstünde; işaretçiler ürünün tepesinde, tek kelime; çekmece 10, kalemlik 8 şablon (ölçü farkı olanlar araçta birebir
açılır: sablonDegeri). Buzdolabının üst rafında sırlı taş tabakta Türk somunu ve beyaz peynir (Blender'da kodla
modellendi, procedural doku orada pişer; "Gluten yok" etiketi somuna batar); çay bardağı klasik ince belli ölçülerde
(Ø 50 gövde, Ø 38 bel, Ø 56 ağız, boy 96). Son kalite pişirme yapıldı (süpürgelik, kilim, gölge vekilleriyle).
Bekleyen: yapbozda aile fotoğrafı (Unsplash adayları kullanıcıda).
2026-10-18 ikinci tur: tek sahne ve tek sayfa (`lab/oda.html`, pilot varsayılan; gri kutu ve yan yana sayfalar
kaldırıldı). Duvarlar canlı güneşte görünmez gölge vekiliyle kapandı (kasa ve monitöre güneş vurmuyor), huzme oda
ışığına göre kısıldı ve durdu, oda içi 0,75 ile loşlaştı (balkon parlak kalır), pozlama 3,6. Manzara 4K
HDRI'den: pencereden görünen yön aralığı tam çözünürlükte ayrı kesit (`oda-gok-yakin.webp`). Telefonda ekran
çözünürlüğü 2. Çekmece yakın planı uzaktan ve önden; çekmece şablonları Kutu paletinden ayrı renklerde.
Kaydırmalı tur ilk denemesi (`core/oda-tur.js`): genel plan → çekmece → masa üstü; genel planda altta "Odana dair
her şey", üstünde "Çekmece organizeriyle başla" (üzerine gelince kamera biraz yaklaşır), durakta kart açılır ve
3 şablon kendiliğinden döner; tıklama kısayol. Perde B yolu: iki yan pencerede pilili tül (Blender'da ışığı süzer,
önizleme kalitesinde pişti; tarayıcıda etek rüzgârla odaya salınır), balkon kapısı açık; tavan da pişip dışa
aktarıldı, telefonun dikey kadrajı odanın içinden. Mobil uyarlama: yatay telefonda kart yanda ve sıkışık (üst çubuk
44 px, döngü düğmesi sağ altta), dokunma hedefleri 44 px, telefonda ara görüntü geçişleri yok (tuval doğrudan
çizilir), yakın planda tur yazısı söner.
2026-10-18 baştan tur: tur bütün bölgeleri gezer (3B yapboz ve yapboz tepsisi kalktı), her durağın kendi kadrajı
(FOCUS; çekmece açık hâliyle çapraz yukarıdan), kart koyu (beyaz perde yok), başlık ürünün adı, araç adı altta;
kalemlik monitörün soluna, lamba köşede dolabın üstünde uzun spot, dolap masanın önüyle hizalı; modemde şablona göre
yer; buzdolabı kapalı başlar; odadaki saksı hep içi boş ve topraklı; monitör titremesi giderildi. Sırada: çekmeceyi
dolduran organizerler, klavyede tuş başlıkları, buzdolabı mıknatısları ve içecekler, oyuncu koltuğu, balkonun
karşısında bina.
2026-10-19: çekmeceyi dolduran 6 organizer (tablaya sığan modüller, tam açılan çekmece); klavyede tuş başlığı
setleri (Esc, Enter, yukarı ok: kedi, kalp, yıldız, harf) ve önünde aynı tasarımın anahtarlık clicker'ı; buzdolabı iki
durak: kapak kapalıyken 3D Yazı mıknatısları (harfler, "Süt al!" notu, kalp ve yıldız), açılınca kapak raflarında
markasız içecekler (kutular ve cam şişe; raflar 9 cm derin). Oyuncu koltuğu (Blender'da modellendi: siyah, turuncu
şeritli, kanatlı yüksek sırt) masanın sağ yarısına itilmiş; genel planda monitörü, klavyeyi ve saksıları kapatmaz,
saksılar durağı sağdan bakar. Balkonun karşısı Blender'da kuruldu ve odayla birlikte pişer: oda 2. katta; aşağıda
sokak (asfalt, kaldırımlar), 14 m ötede dükkânlı zemin kat ve balkonlu, perdeli üç katlı karşı bina; balkonumuzun
altında kendi cephemiz. HDRI yalnız binanın üstündeki gökyüzünde kalır. Yapbozda aile fotoğrafı (Unsplash, kayıt
KAYNAKLAR.md'de).
2026-10-19 (devam): kalemlikler farklı kalemlerle (kurşun, tükenmez, keçeli, fosforlu) ve her şablonda bölmelere
dizili, kalem ağız hizasında duvara değmez. Koltuk yarış koltuğu silüetinde (dar başlık, geniş omuz, kanatlı oturak),
masanın sağ önünde dönük; kasa masanın altında sola alındı. Buzdolabında ekmek ve peynir kalktı, pasta üst rafta, iki
raf Poly Haven yiyecekleriyle dolu (sürahi, süt, konserve, meyve; doku 256–512 px, en çok ~2.500 üçgen). QR üç ürünü
birlikte gösterir (Wi-Fi standı, kartvizit, duvara yaslı anahtarlık; ikişer şablon): şablon yalnız kendi ürününü
değiştirir, seçili ürün kalkıp dikelir (`COKLU`, oda-sahne çoklu yuva). Yakın planlara `w` (sığacak genişlik): telefonda
kamera geri çekilir, klavye ve QR kenardan taşmaz. Üst çubuk ve şablon şeridi koyu, sol üstte beyaz Oktos logosu.
2026-10-19 (öğleden sonra): tıklamayla durağa geçiş artık aradaki durakların üzerinden geçmez: sayfa anında atlar, kamera
doğrudan gider ve varışta 2 sn'de %10 yaklaşır (`core/oda-tur.js` GECIS). Dört varyant ve eski davranış
`?kamera=a|b|c|d|eski`, kendiliğinden oynayan demo `&demo=1`; kullanıcı A'yı (doğrudan) seçti, karşılaştırma sayfası
kaldırıldı (_silinecek/kamera-2026-10-19).
Çekmeceli dolabın üstünde anahtar tepsisi (yeni durak `anahtarlik`, çekmeceden sonra): Kutu aracının mürekkep rengi
tepsisi, Blender'da modellenmiş çelik halka ve üç anahtar, halkaya takılı kart anahtarlık. Mağazadaki kart
anahtarlıklar lisanslı kart kopyası (Pokémon, Magic, Yu-Gi-Oh!) olduğu için sahnede yeniden üretilmez: kartın yüzü
Oktos tasarımı (koyu, turuncu, krem şablon), düğme "Mağazada gör" oktosworkshop.com/anahtarlik'i yeni sekmede açar.
3D QR aracı açıldı (tools/qr: masa standı, kartvizit, anahtarlık, bardak altlığı; 8 şablon odadakilerle aynı kimlikte):
modem ve balkon masası durakları "Yakında" değil, araçta açılır. Kalan beş araç (Clicker, 3D Yazı, Flip, Painter,
Puzzle) sırada; ana sayfadaki hazır bilgisi artık core/story-data.js `live`'dan. Text Flip aracı açıldı (tools/flip:
iki kelime, harf boyu, köşegen ya da yuvarlak taban, harf ve taban ayrı renk; şablonlar odadaki family/us/sea + ask).
QR anahtarlık modem rafından anahtar tepsisine taşındı: tepside kart anahtarlıklar (mağaza) ve QR anahtarlıklar (3D QR
aracının key / key_yuvarlak şablonu) sırayla değişir; düğme şablona göre "Mağazada gör" ya da "Bu şablonla tasarla"
(şablonun `arac`'ı). Modem rafında Wi-Fi standı ve kartvizit kaldı. Araçlarda tahmini fiyat kendiliğinden hesaplanmaz:
ziyaretçi "Hazır" der, fiyat ve "Sipariş ver" o zaman çıkar; tasarım değişince yeniden "Hazır". STL düğmesi kalktı
(atölyeye ?atolye=1 ile 3MF).
Puzzle Maker aracı açıldı (tools/puzzle): fotoğraflı düz yapboz (aile fotoğrafı ya da manzara örneği, kendi fotoğrafı
yalnız önizlemede, sipariş mesajı fotoğrafın ayrıca gönderileceğini yazar; çerçeveli tabla isteğe bağlı) ve 3B şekil
yapboz (küre, küp, yumurta, kalp; renkli parçalar). Odadaki yapboz çerçevesi 'picture' şablonuyla araçta açılır.
2026-10-20: şablonun ve duvardaki yapbozun resmi CC0 bir cüce savaşçı çizimi (Wikimedia Commons, LadyofHats; 4:3
kırpılıp sıcak çift tona çevrildi, kayıt KAYNAKLAR.md); örnek resimle sipariş verilebilir, aile fotoğrafı araçta seçenek.
Filament Painter aracı açıldı (tools/painter): fotoğraf ya da örnek manzara → katmanlı rölyef (çerçeveli tablo, pencere
ışıklığı, A6 kartpostal); beş palet, dört filament rengi, renk değişim yükseklikleri bilgi satırında ve sipariş
mesajında; katı bir kez kurulup değişim yüksekliklerinden dört renk gövdesine bölünür (csg.scopeMany). Odadaki rölyef
çerçeve araçta açılır. 3D Yazı aracı açıldı (tools/text): plaka (düz, yuvarlak, harf harf; vida deliği), masa tabelası,
pasta süsü (arkada birleştiren zemin, iki çubuk), mıknatıs (harf harf, not levhası, kalp/yıldız; yuva harfin içinde en
geniş noktada), anahtarlık; yazı ağırlığı 500/700/900. Kapı plakası, buzdolabı kapağı ve pasta süsü araçta açılır.
Fidget Clicker aracı açıldı (tools/clicker): içine MX uyumlu klavye anahtarı takılan figür anahtarlık (kedi, kalp,
yıldız, yazılı kutu; kapak sapa oturur, 4 mm basma yolu) ve MX uyumlu tuş başlığı (1u–2,25u, motifli). Sekiz aracın
hepsi açık; odada ve ana sayfada "Yakında" yok. MX ölçüleri: plaka yuvası 14 mm, tuş yuvası artı 4,1 × 1,17 (+0,1 pay);
plaka altındaki anahtar gövdesi için resmî ölçü bulunamadı (boşluk 9 mm): ilk siparişten önce deneme baskısı.
Yakın planda ürünü sürükleyerek çevirme (fare ve parmak; sürükleme ürünün üstünden başlamalı, başka yerden yatay
kaydırma şablon değiştirir): kalemlik, saksı, balkon masası, pasta ±40°; QR rafında seçili ürün; Flip tablası iki
kelimeyi gösterecek kadar; duvardaki çerçeveler ve kapı plakası döndükçe duvardan ayrılır. Klavye, çekmece, kapak
mıknatısları ve halkadaki kart sabit. Odadaki QR standı ve kartviziti, balkon menüsü ve altlık, pasta süsü, kapı
plakası ve rölyef artık araçların kendi üreteciyle kurulur (oda-urunler aracModeli): odada görünen, araçta açılanın
aynısı; kapalı katılar, renk parçaları ayrı.
2026-10-19 revizyon: anahtar tepsisi spot lambanın başının altında, dolabın arkasında ve düz; halka ortada, kart öne
sarkar, anahtarlar arkaya yelpaze. Tepside oktosworkshop.com'daki beş kart anahtarlık (Charizard, Black Lotus,
Venusaur, Blastoise, Dark Magician; yüzleri ürün fotoğrafından), "Satın al" seçili ürünün sayfasını açar; QR
anahtarlıklar tepsiden kalktı. Aile fotoğrafı yapbozu sağ duvarda buzdolabının üstüne, rölyef çerçevesi 1,6 kat
büyüyüp sol duvarın ortasına taşındı. Koltuk dik ve masaya ortalı, masanın altına itilmiş: piston en altta, sırt bel
hizasındaki menteşeden öne katlı (klavye genel planda görünür). Buzdolabı ile balkon duvarı arasında robot süpürge:
altında kırmızı ışık (zemine pişer), üstte sarı ve mavi durum ışıkları ara ara yanar. Karşı binanın katları bizimkiyle
aynı hizada; tam karşıdaki balkon bizim katta, kapısı bizimki gibi (ortada kapı, iki yanda cam; kapalı, perdeler çekili).
Ana sayfanın tek sahnesi: ev ofisi ve açık balkon. Ürettiğimiz her şey kendi doğal yerinde
durur; ziyaretçi bakar, tıklar, şablonları değiştirir, araca geçer. Görsel referanslar: sade ev ofisi (yatay
aynalanmış) ve açık balkon (ahşap zemin, bistro masa, büyük saksılar).

## Mekân (genel plan, kameradan)

- **Arka duvar, sol:** masa; sol ucunda çekmeceli dolap. Masanın üstünde duvarda iki üç şık raf.
- **Arka duvar, orta-sağ:** cam balkon kapısı, açık. Üstünde "Oksijen alma alanı" plakası. İki yanında pencere
  kenarı (saksılar). Masanın yanındaki pencere balkona kısa yol olur (kamera oradan geçer).
- **Sağ:** mini buzdolabı.
- **Kapının ardında:** açık balkon; ahşap zemin, siyah korkuluk, bistro masa, iki sandalye, büyük saksılar.

## Bölgeler ve ürünler

| Bölge | Ürün (araç) | Odakta olan | Şablon değişimi | Cümle |
|---|---|---|---|---|
| Çekmece | Kutu: çekmece içi, vida ayırıcı, Gridfinity | Çekmece açılır, vidalar yağıp bölmelere dizilir | Yalnız çekmeceye uyanlar | Atölye için organizerler. |
| Masa üstü | Kutu: kalemlik; yuvarlak tepsi (içinde yapboz parçaları) | Kalemler kalemliğe düşer | Kalemlik şablonları | *(açık: mesaj kesik)* |
| Klavye yanı | Clicker: anahtarlık fidget'lar (klavyenin sağında) | Tıklama dalgası | Kedi, kalp, yıldız, kutu | Tık. Bir nefes daha. |
| Raflar | QR: modem ve Wi-Fi tutucu (solda); Puzzle: 3B yapboz (sağda) | Kod yağar; 3B yapboz parça parça toplanır | QR karoları; küre, küp, yumurta, kalp | Misafirin şifre sormasın. / Bir model, yüz parça. |
| Çerçeveler | Painter rölyefi ve boş yapboz çerçevesi yan yana | Rölyef katman katman basılır; tepsideki yapboz parçaları uçup çerçeveye yerleşir | Manzaralar | Fotoğrafın ışıkta derinleşsin. |
| Balkon kapısı | 3D Yazı: "Oksijen alma alanı" plakası | Harfler düşüp dizilir | Tabela şablonları | Adın kapında dursun. |
| Pencere kenarı, balkon | Vazo: saksılar (bitkiler içinde) | Çiçek yerinde kalır, saksı değişir; birkaç şablondan sonra tozdan "Sana özel saksıyı tasarla!" yazısı | Vazo şablonları | Her bitkinize şık bir kıyafet. |
| Balkon masası | QR: menü standı, bardak altlığı | Altlık dönerek yatar, kod yağar | Menü, kartvizit | *(taslak yazılacak)* |
| Mini buzdolabı | 3D Yazı: üst rafta "İyi ki doğdun" pasta süsü (raflar yiyecekle dolu); üstünde Text Flip | Kapak açılır; Flip tablası döner | Yazılar; kelime çiftleri | Bir yandan sen, öbür yandan o. (Flip) |

Kaplar ve ürünler bizim baskı modellerimiz; hazır model yalnız içine konanlar için (bitki, yiyecek), kaynağı ve
lisansıyla (proje kuralı).

## Etkileşim

- **Genel plan:** kamera odanın içinden arka duvara bakar. Fare ekranın dış kenarlarına (%20) gidince kamera o
  yana döner; orta sabit kalır (ürünler imlecin altından kaymaz). Üzerine gelince ürün hafif kalkar, çekmece
  birkaç santim açılır (davet).
- **Tıklama:** kamera bölgeye yaklaşır. Kenarda aracın başlığı (eski vitrinin yazı stili ve harf hareketi), hikâye
  cümlesi ve "Bu şablonla tasarla" belirir; bölgenin hareketi oynar.
- **Odakta şablon:** paneldeki seçici (‹ ad n/N ›), klavye okları, dokunmatikte yana kaydırma ya da ürüne yeniden
  tıklama aynı yere sıradaki şablonu getirir (eski küçülüp kaybolur, yeni yerine oturur; saksıda bitki yerinde
  kalır). "Bu şablonla tasarla" seçili şablonu açar. Atölyesi hazır bölgelerde (çekmece, kalemlik, saksılar) üç
  değişimden sonra ipucu satırının yerinde tozdan bir çağrı yazısı oluşur ("Sana özel saksıyı tasarla!"); zerreler
  ürünün ekrandaki yerinden kalkar, yazı bir düğme olarak kalır. Değişim sürerken (~0,2 sn) yeni istek yok sayılır,
  basılı tutulan ok tekrar etmez; atölyeye geçiş başlayınca şablon sabitlenir.
- **Kenar paneli:** yatay ekranda sol kenarda, zeminsiz; okunurluğu soldan açılan perde verir, ürün ekranın sağına
  kayar (`focusShift`). Üstte bölgenin adı, büyük başlıkta aracın adı (harf hareketiyle), hikâye cümlesi, seçici.
  Telefonda ve dikey ekranda kart alttan açılır.
- **Telefon:** tek bölge görünür; alttaki döngü düğmesi sıradakine götürür, sondan başa döner. Dikey düzen ayrıca
  iyileştirilecek.
- **Hareket azaltma:** dönme ve uçma yok; geçişler ışık kısılarak.

## Görsel dil

Araç sahnelerinin sade stili, referansların paleti: açık gri-bej duvar, kırık beyaz masa, siyah metal, koyu
raflar, ahşap balkon zemini, toprak saksı tonları. Sıcak gün ışığı, yumuşak gölge.

## Üretim hattı

### Ortak temel (her seçenekte)

- **Motor:** `core/story.js` genişletilir, yeni motor yazılmaz. Zaten olan: tıklanabilir ürün noktaları, üzerine
  gelince kaldırma, odak, kart, hareket azaltma, dikey kadraj. Eklenecek: fareyle bakış, odakta şablon
  değiştirme, kenar başlık ve cümle, telefonda döngü, toz yazı.
- **Ürünler:** araçların kendi üreticileri (gerçek şablon geometrisi), çalışma anında üretilir.
- **Yerler:** her bölgenin ürün yeri, genel ve odak kamera pozu tek veri dosyasında (`core/oda-yerler.js`).
- **Vitrinden geri gelecekler** (`_silinecek/vitrin-2026-10-16/`): başlık hareketleri, vida yağmuru ve bölmeye
  yığılma, mekanik klavye.
- **Metin:** `core/story-data.js` ve `core/i18n.js`, TR ve EN.

### Seçenekler (ortam nasıl üretilecek)

- **A. Tamamı kodla** (bugünkü araç sahneleri gibi): tek hat, küçük indirme, ürün ile oda aynı ışıkta. Gerçekçilik
  sınırlı (kumaş, bitki, ahşap zor); yerleşim kod sayılarıyla, yavaş.
- **B. Oda Blender'da, ürünler kodla:** oda, balkon, mobilya ve bitkiler Blender 5.2.2'de; ışık dokulara pişirilir
  (yumuşak gölge, köşe kararması). GLB olarak dışa aktarılır (WebP doku, Draco sıkıştırma; ikisini de kurulu
  Blender ve three 0.162 destekliyor). Ürün yerleri ve kamera durakları Blender'da adlandırılmış boş nesneler;
  kod onları adıyla bulur. Ürünlerin ışığı tutsun diye Blender'dan odanın 360° panoraması alınıp ortam ışığı
  yapılır. Referanslara en yakın; yerleşimi Blender'da düzenleyebilirsin; çalışma anında hafif. İndirme ~3–6 MB
  büyür; pişmiş oda ile canlı ışıktaki ürün arasında fark riski; her değişiklikte dışa aktarma adımı.
- **C. Önce gri kutu kodla, ortam sonra Blender'da (öneri):** etkileşim gri kutu odada kurulur ve onaylanır;
  yerler veri dosyasında. Sonra ortam Blender'da aynı adlı yerlerle yapılır, kod değişmez, yalnız odanın kaynağı
  değişir. Etkileşim ile görünüş ayrı onaylanır, çöpe giden iş en az.

### Aşamalar (C ile, tahmini)

1. Gri kutu oda, fareyle bakış, iki bölgede odak (çekmece, balkon), telefonda döngü: 3–4 saat. Kutu sahnesiyle
   yan yana gösterilir.
2. Bütün bölgeler, odakta şablon değiştirme, kenar başlık ve cümleler: 1–2 gün.
3. Ortam Blender'da, ışık pişirme, dışa aktarma betiği (`scripts/oda-disa-aktar.py`, `--dry-run` ile): 1–2 gün.
4. Efektler (vida yağmuru, yapboz uçuşu, toz yazı) ve son ışık: 1 gün.
5. Telefon dikey düzeni.

## Karakter (bizzikoloşko)

Ziyaretçiye üst kattan eşlik eden karakter (`core/oda-karakter.js`, model `assets/oda/karakter.glb`, Blender'dan
`scripts/karakter-blender.py`). 2026-10-19'dan beri odanın varsayılan parçası (oda ana sayfa olmayacak; kullanıcı
kararı): `odaKarakteri(odaScene, { reduce })` sahne modülünü sarar, sayfa `kar.sahne`'yi mountStory'ye verir ve kurulunca
`kar.bagla(story)` der. Karakter odayla aynı anda yüklenmeye başlar ama odayı bekletmez ve açılış çubuğuna girmez; perde
kalkarken (giriş uçuşu sürerken) üst kattan inmeye başlar, geç yüklendiyse geldiği an (görünmeyen yükseklikten başladığı
için fark edilmez). Hareket azaltmada oda onu bekler, karakter masada oturur. Dosya yoksa oda onsuz açılır. Lab:
`?karakter=0` kapalı, `=masa` masada başlar, `=ip` | `=merdiven` iniş aracı; `?kat=1` üst kat denemesi (üst kat henüz
yok: sayfanın en üstünde yukarı kaydırmak üst kata çıkmak sayılır).

- **Gelir:** üst kattan yangın merdiveni ya da ip (her ziyarette rastgele) balkonun arka sağında kayarak iner (giriş
  uçuşu sırasında görünür); karakter ana kadrajda kapı boşluğunun sağ yarısında görünerek yavaşça iner (görünmeyen
  yükseklikte hızlı; ayakları giriş biterken kadraja girer). Sağ duvar şeridinden (kadraj dışı) dolaşıp cephe ile bistro
  masa arasından kapıya gelir, eşikte rastgele bir dans eder (en çok ~4 sn; iniş, dans ve oturuş art arda aynısı
  gelmez). Açılıştan yazmaya 34–37 sn (2026-10-20; önce ~50). Dikey telefonda genel plan yalnız
  masayı ve sol pencereyi gösterir: iniş ve dans kadraj dışında kalır, karakter sağdan girip oturur.
- **Koltuk:** masanın altına itilmiş, sırtı öne katlı koltuğu arkadan tutup 65 cm düz geri çeker (katlı sırt kalkarken
  masa tablasına değmesin), bırakıp bir adım geri çekilirken sırtını açar (oturak kalkar), koltuğun sağından önüne geçip
  masaya bakarak oturur ve masaya kayar; koltuk hiç dönmez (2026-10-20; önce yana çevrilip oturduktan sonra kendiliğinden
  dönüyordu). Masada yazar; 9–18 sn'de bir emote, şablon değişince ara sıra tepki, tıklanınca sevinir; üzerine gelinince
  kameraya bakar. Oturanın göğsü yana kaydıkça oturak çok hafif döner, yaylanarak durulur (`AYAR.salinim`); inanamama
  emote'unda kafa sırtın ~45 cm gerisine iner, oyuncu koltuğunun sırtı ~69°'ye kadar yaslanır (`yatir` meta,
  `AYAR.yatirEnCok`).
- **Yakın planlar:** kadrajı masa başındaki karakterin kapladığı duraklar kendiliğinden bulunur (şu an kalemlik,
  kartvizit, klavye, modem, çerçeve); kamera bunlara yaklaşırken (varışı tahmin ederek) koltuğuyla kenara (masanın sağ
  ucunun önü, pencere yanı) kayıp müzik dinler, gerek kalmayınca döner. Kenar yeri kadrajına giren durakta (saksılar)
  masada kalır. Ürünün önüne karakter ya da koltuk girerse ürün sade bir x-ray dairesinden görünür; kamera karakterin
  içinden geçerken karakter seyrelir.
- **İmleç dairesi (genel plan):** fare kartvizit, kalemlik ya da tuşların üzerindeyse imlecin çevresinde, ürünün
  uzaklığında ~12 cm'lik bir daire karakteri ve koltuğu siler, arkadaki ürün görünür; tıklama ürüne gider
  (`AYAR.fareDelik`, `AYAR.fareCap`; dokunmatikte yok, yakın planda eski daire geçerli). İmleç bu ürünlerde ~0,15 sn
  durunca karakter koltuğuyla birlikte döner (kalemlik, kartvizit saat yönünün tersine ~35°, tuşlar saat yönünde ~43°;
  `AYAR.donDurak`), yazmayı bırakıp bekler, fare gidince döner. Ölçüm (2026-10-20): genel plan kamerasından kalemlik ve
  kartvizit koltuk sırtının (54 cm geniş) tam arkasında; dönüş ürünü açmaz, görünürlüğü daire sağlar.
- **Oturuş:** ziyaret başına iki klipten biri rastgele: Koltuğa Oturma (`otur`) ya da Oturmaya Geçiş (`otur2`, Mixamo
  "Stand To Sit": koltuğun önünden geri oturur, daha çevik). `otur2`'nin başında kalça kökün ~20 cm önünde: gövde
  `ileri` kadar geri kaydırılır, klip bitince kayma köke aktarılır (görüntü değişmez). Kalça koltuğa indiği karede
  (`inis`) minder ezilip yaylanarak toparlanır (karakter onunla çöker), oturak karakterle birlikte kendi ekseninde
  sönerek sallanır (`AYAR.minderEz`, `AYAR.donme`).
- **Hız:** karakterin bütün zamanı `AYAR.tempo` (1,15) kat hızlı akar: klipler, yürüyüş, kayma ve iniş birlikte
  hızlanır, ayak kaymaz (2026-10-19 %10, 2026-10-20 %15). Yakın plan gelince masadaki emote yarıda kesilir, koltuk
  ~1,3 sn'de kenara kayar.
- **Gider:** üst kata dönülünce koltukla oturma yerine kayar, kalkar, aynı yoldan tırmanır; yolda geri dönülürse kaldığı
  yerden döner. Hareket azaltmada masada hareketsiz oturur.
- **Ölçek ve eşleme:** Blender'da rig 1,5 (boy ~1,4 m). Masa başı klipleri kökü 335 mm kaldırır (eller klavyede,
  kalça yüksek koltuğun oturağında; ayaklar sarkar); oturmada kök kalça inerken yükselir.
- **Koltuk klipleri:** sırt açma (arkadan kavrar, 65 cm çeker, bırakıp geri adım atarken sırtı kaldırır: sırt, kök
  kayması ve tutma GLB meta'sında) ve koltukla kayma (eller kolçakta, bacaklar sallanır: yüksek koltukta ayaklar yere değmez)
  sitenin koltuğuna göre Blender'da kurulur (`scripts/karakter-klipler.py`).
- **Çizim yükü:** aynı malzemeli deri parçaları yüklemede tek ağda birleşir ve tek iskeleti paylaşır (38 çizim → 13),
  merdiven tek ağ; karakter ve merdiven gölgeyle birlikte ~28 çizim, ~150 bin üçgen ekler.
- **Kaynak:** model kullanıcının Tripo hesabından üretilip Blender'da yeniden kuruldu; hareketler Mixamo (Adobe;
  projede ücretsiz kullanım, tek başına dağıtım yasak). Model Tripo'da ücretli plan aktifken üretildi (ticari kullanım; kullanıcı beyanı). Lisans kaydı `assets/oda/KAYNAKLAR.md`'de.

## Açık konular

- Yatay telefonda (kısa ekran) alttan açılan kart sahnenin çoğunu örtüyor; Aşama 5'te kısa ekrana dar yan panel.
- Taslak cümleler onay bekliyor: kalemlik "Kalemler yerini bilsin.", balkon masası "Menü bir okutma uzağında.",
  buzdolabı "Pastaya, ekmeğe, kapağa: ne yazmak istersen.", yapboz çerçevesi "Resmin parça parça yerine otursun."
- Text Flip'in yeri: varsayılan buzdolabının üstü.
- Ekmek ve pasta: hazır model mi, yerinde üretim mi (görsel dile göre).

## Riskler

- **Görsel beklenti:** referanslar fotogerçekçi; C ve B bu farkı kapatır, A kapatmaz.
- **Telefonda yükleme:** bölgeler odaklanınca kurulur, genel planda hafif yer tutucular.
- **Fareyle bakış:** yalnız kenarlarda döner, orta sabit.
