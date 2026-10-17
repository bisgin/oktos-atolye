# Oda sahnesi: tasarım ve üretim hattı

Taslak, 2026-10-17. **Durum:** hat C seçildi; Aşama 1 (gri kutu) onaylandı. Aşama 2 kuruldu, onay bekliyor:
12 bölgenin hepsinde araçların gerçek şablonları, odakta şablon değiştirme, kenar paneli ve toz yazısı
(`core/oda-panel.js`). Deneme `lab/oda.html`, yan yana `lab/oda-yan-yana.html`. Ana sayfanın tek sahnesi: ev ofisi ve açık balkon. Ürettiğimiz her şey kendi doğal yerinde
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
| Mini buzdolabı | 3D Yazı: "İyi ki doğdun" pasta süsü, "Gluten yok" etiketli ekmek; üstünde Text Flip | Kapak açılır; Flip tablası döner | Yazılar; kelime çiftleri | Bir yandan sen, öbür yandan o. (Flip) |

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
