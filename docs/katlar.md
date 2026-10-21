# Katlar: çatı katı, oda, bodrum

Kullanıcı kararı (2026-10-21): site üç katlı bir bina olarak kurulur.

| Kat | Ne | Durum |
|---|---|---|
| Çatı katı (cam teras odası) | Portfolyo: fikir rafı (7 alan + "Senin fikrin"), süreç, hakkımda, Biggie. Gökyüzü anlatısı ayrı giriş videosuna taşınıyor (başka iş) | `lab/cati.html` (gri kutu teras odası, 2026-10-21) |
| Orta kat | Mevcut oda (`lab/oda.html`): yalnız şu an satılan ürünlerin (anahtarlık vb.) odası olacak | Bugünkü hâliyle; araçlar ileride bodruma taşınır |
| Bodrum | Depo gibi bir 3B atölye: çalışan SLA ve FDM yazıcılar, seri üretim makineleri, **araçlar** (hizmet) burada | Sırada (gri kutu, odayla yan yana) |

**Temel ilke:** Biggie her zaman kullanıcının bulunduğu kata gelir. Aşağı kaydırınca iner, yukarı kaydırınca çıkar:
merdivenle, iple ya da yeni hareketlerle (robot süpürgenin üstünde, havada sendeleyerek). Hızla birkaç kat atlanırsa
Biggie doğrudan hedef kata gider (planlanan; henüz yok).

## Çatı katı: cam teras odası (gri kutu, 2026-10-21)

Plan: çalışma alanının portfolyo planları, "çatı teras planı" bölüm 4 (ölçüler mm, +x doğu, +y kuzey, z yukarı).

- Sahne `core/cati-sahne.js` (motor `core/story.js`, oda ile aynı sahne sözleşmesi), metin ve içerik `core/cati-veri.js`,
  kart içeriği, ışık kutusu ve düz liste `core/cati-panel.js`, görünüm `core/cati.css`, sayfa `lab/cati.html`.
- **Işık canlı** (pişirme yok): güneş `core/oda-olcu.js` SUN (kuzey-kuzeydoğu, 42°), gölgeli tek ışık; ortam ışığı
  gökyüzünün küçük panoramasından. Camlar gölge düşürmez; kiriş gölgeleri kilime ve güney duvarına çizgi düşürür.
- **Oda:** iç hacim x −3500…3400, y −2500…2400, kirişlerin altı 2750. Güney ve batıda iç duvar; kuzey ve doğuda parapetin
  üstünde sürgülü pencere (üçer kanat bir yana toplu, açıklıkta cam yok, kuzeydoğu köşesi açık); kirişli cam tavan
  (iniş bölmesi x 350…1750, y −2500…−1100 açık, camı yandaki bölmenin üstünde). Bütün kasalar ve kirişler tek ağ.
  Kuzeybatıda merdiven kovası: kapısı açık, kuzeye inen 7 basamak (odaya iniş).
- **Fikir rafı:** kuzey parapetin önünde 2×4 gözlü vitrin (1900 × 380 × 1000, göz içi 440). Gözler `ALANLAR` sırasıyla:
  kutu oyunları, plakalar, figürler, anahtarlıklar / stant ve vitrinler, ev ürünleri, endüstriyel ön-mühendislik, senin
  fikrin. Her gözde kendinden ışıklı başlık kâğıdı, döner kaide (odakta döner) ve titreyen hayalet çizim (3 çeşit,
  saniyede 10 kez). Kartta alt kalemler, o alandan eski işlerin fotoğrafları ve "Fikrini anlat" (WhatsApp hazır mesajı,
  `fikirLinki`). **Gerçek ürün gelince yalnız veri değişir:** `ALANLAR[i].yuva.model` = GLB yolu; sahne onu kaideye
  sığdırır (340 × 300 × 360), hayalet söner. Üstünde süreç rayı (4 ışıklı kart: tasarım, FDM, reçine, kalıp ve döküm).
- **Köşe ve eşyalar (yer tutucu, dış varlık yok):** kodla Anadolu motifli kilim (elibelinde, koçboynuzu, göz; 12,5 mm
  ilmek ızgarası, CanvasTexture), armut koltuk (deforme küre) ve üstünde Biggie (`muzik` klibi, kök z 215), 50 cm
  kitaplık (kitaplar tek InstancedMesh), teleskop (tripod, pirinç tüp; kuzeydoğuya 20° yukarı), kutu oyunu rafı
  (markasız kutular, kapakta doodle; tek atlas), şövalede kara tahta (hakkımda), iki saksı (aloe, antoryum), kilimin
  çevresinde tur atan robot süpürge (hareket azaltmada durur).
- **Kamera:** genel plan oda içinden (güney duvarının önünden kuzeye); telefonda ayrı kadraj (`PORTRE`). Kapalı odada
  geri çekilecek yer olmadığı için sahne görüş açısını kendisi verir (`fov` 50, `squareFov` 50, `portraitFov` 58) ve
  kamera sınırı verir (`cameraBounds`: iç hacmin 150 mm içi; motor yakın plan geri çekmesinde ve sürülen kamerada dışarı
  çıkmaz). Masaüstünde yan kart için motor kamerayı yatayda kaydırır (uzak durakta ~0,5 m): yeni durağı `story.shotOf(id)`
  ile ölç.
- **Tur:** genel plan → süreç → 8 göz → pencere köşesi (Biggie; kitaplık ve teleskop da buraya götürür) → hakkımda →
  merdiven ("Odaya in"). Gözlerin işaretçisi yok (başlık kâğıtta), şeritte ve kaydırmada erişilir.
- **Metin** yalnız kullanıcının sunumundan, ürün paketlerinden ve çatı planındaki alan listesinden; alan metinlerinde sayı
  ve iddia yok. Biggie için "sculpt" denmez ("kil gibi duruyor").
- **Sıradaki (onay bekleyen):** armut, teleskop, raf ve bitkilerin gerçek modelleri (lisans listesi rapor ve plan
  dosyasında), "basılarak belirme" animasyonu, kendini çizen doodle, gökten iniş (`core/gok-inis.js`).
- **Portfolyoya girmeyenler:** tasarımı kullanıcıya ait olduğu doğrulanmayan işler, kullanıcı karar verene kadar
  dışarıda kalır (liste yerelde, çalışma alanının portfolyo notlarında).

## Sıradaki aşamalar (plan: çatı katı iş akışı, 2026-10-21)

1. Telefonda dene: çatı ↔ oda geçişi (ayrı sayfa mı, tek sayfada iki sahne mi) ölçümle seçilir.
2. Robot uçuşu odada: üçüncü iniş aracı (`core/oda-karakter.js` inisKur kalıbı; hava dinamiği yayla).
3. Motor ve kat yöneticisi: `story.js` çoklu örnek düzeltmeleri, kat geçişi, Biggie'nin kat kat gelişi.
4. Bodrum atölyesi (araçlar), sonra orta katın mağazaya dönüşümü.
