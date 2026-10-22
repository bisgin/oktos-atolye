# Katlar: çatı katı, oda, bodrum

Kullanıcı kararı (2026-10-21): site üç katlı bir bina olarak kurulur.

| Kat | Ne | Durum |
|---|---|---|
| Çatı katı (teras odası) | Portfolyo: raflarda tasarım çalışmaları ve kutu oyunları, OLED'de süreç, hakkımda, Biggie. Gökyüzü anlatısı ayrı giriş videosuna taşınıyor (başka iş) | `lab/cati.html` (2026-10-22: gerçek çatı, şehir, batı duvarı) |
| Orta kat | Mevcut oda (`lab/oda.html`): yalnız şu an satılan ürünlerin (anahtarlık vb.) odası olacak | Bugünkü hâliyle; araçlar ileride bodruma taşınır |
| Bodrum | Depo gibi bir 3B atölye: çalışan SLA ve FDM yazıcılar, seri üretim makineleri, **araçlar** (hizmet) burada | Sırada (gri kutu, odayla yan yana) |

**Temel ilke:** Biggie her zaman kullanıcının bulunduğu kata gelir. Aşağı kaydırınca iner, yukarı kaydırınca çıkar:
merdivenle, iple ya da yeni hareketlerle (robot süpürgenin üstünde, havada sendeleyerek). Hızla birkaç kat atlanırsa
Biggie doğrudan hedef kata gider (planlanan; henüz yok).

## Çatı katı: teras odası (2026-10-22, kullanıcı geri bildirimiyle yeniden kuruldu)

İlk gri kutu teras (cam tavan, fikir rafı, merdiven kovası) commit `895b309`'da. Ölçüler mm, +x doğu, +y kuzey, z yukarı,
döşeme z = 0.

- **Dosyalar:** sahne `core/cati-sahne.js` (oda kabuğu, çatı, cam cepheler, batı duvarı, saksılar, Biggie; motor
  `core/story.js`), dışarısı `core/cati-sehir.js` (gökyüzü, bulutlar, şehir, sokak, silüet), kilim `core/cati-kilim.js`,
  teleskop / armut koltuk / cam sehpa `core/cati-esya.js`, 75" OLED ve süreç sunumu `core/cati-ekran.js` (döngüler
  `assets/cati/ekran/`, `scripts/ekran-dongu.py`), metin `core/cati-veri.js`, kart ve liste `core/cati-panel.js`,
  görünüm `core/cati.css`, sayfa `lab/cati.html`. Sahne modülü biri yüklenemezse onsuz (gri kutuyla) açılır.
- **Bina ve şehir:** çatı katı orta kattaki odanın 3 kat üstünde: çatı (x, y, z) = oda (x, y + 680, z − 9000). Sokak
  z −15000; karşı bina (orta katta balkondan görünen bina) tam karşıda, ön yüzü y 15680, çatısı −3000 (bizden aşağıda:
  çatısı görünür). Bizim bina x −6200…3600, kuzey cephesi y 2600; doğu komşu bitişik ve bir kat alçak.
- **Çatı:** manzaraya (kuzeye) yükselen tek eğimli çatı: kirişlerin altı güney duvarında 2600, kuzey cephede 3200 (~7°).
  Lamine kirişler (120 × 300, 1200 aralık) kuzey-güney, üstünde aşıklar (80 × 160, 600 aralık) doğu-batı, üstünde
  kuzey-güney lambri, yalıtım ve dikişli sac. Saçak kuzeyde y 4000'e (cepheden 1,4 m), doğuda 0,9 m, batı ve güneyde 0,35 m;
  alın ve kenar sacları. Kuzey ve doğu cephede ince çelik başlık kirişi; kuzeyde başlığın üstünde kirişlerin arası
  cam: içeriden kirişlerin saçağa uzandığı ve saçak altı görünür. İki çatı penceresi (armut köşesi ve odanın ortası).
  Eğimli parçalar `egimli()` (plan aralığı + kirişin altından dik ofset), duvar tepeleri `egimeKes()`.
- **Cepheler:** kuzey (x −1500…3400) ve doğu tam boy sürgü: kanatlar bir yana toplu, açıklıkta 1000 mm cam korkuluk;
  kapıların üstünde sabit cam (doğuda çatı eğimine uyan yamuk). Kuzeyin batı kesimi kapalı, küçük pencereli.
- **Işık canlı** (pişirme yok): güneş `core/oda-olcu.js` SUN, gölgeli; ortam ışığı gökyüzü panoramasından. Ortam ışığı
  engel tanımadığı için duvar, döşeme, tavan ve mobilyanın köşe rengine "ışık payı" yazılır (`isikPayi`: açıklıklara
  uzaklık ve yön): TV köşesi pencereden uzak ve gölgede kalır.
- **Batı duvarı:** iki kitaplık (1100 × 380 × 2350; altta iki çekmece, dört göz: kutu oyunları, kitaplar, tasarım
  çalışmaları: Modern Balbal büstleri `assets/cati/modeller/`, vazo aracının vazoları), aralarında 75" OLED (hep açık;
  süreç sunumu: 8 adım, zaman çizgisi, döngü video; TV'ye tıklamak sıradaki adım, kartta adım listesi), üstte köprü
  dolap, altta konsol.
- **Doğu köşesi:** büyük kilim (3200 × 2200, Türk motifli, kodla), üç armut koltuk, cam içecek sehpası; kuzey açıklıkta
  kafes gövdeli Dobson teleskop, yanında ayakta Biggie (`dur`; yeniden tıklayınca dans). Şövalede kara tahta (hakkımda).
- **Saksılar:** vazo aracının şablonları (ölçüsü büyütülmüş, renkleri farklı, toprakla dolu; `vaseModel`), bitkiler
  `assets/cati/bitkiler.glb` (Poly Haven CC0; `scripts/cati-bitki.py` ile Blender'da, kaynak `kaynak/`).
- **Kamera:** genel plan güney duvarının önünden kuzeye; kenardan bakma sola ~75° döner (TV duvarı). Telefonda ayrı
  kadraj (`PORTRE`). Sahne görüş açısını (`fov`, `squareFov`, `portraitFov`) ve kamera sınırını (`cameraBounds`) kendisi
  verir. Yeni durağı `story.shotOf(id)` ile ölç (masaüstünde yan kart için motor kamerayı kaydırır).
- **Tur:** genel plan → ekran (süreç) → raflar → armut köşesi (Biggie, teleskop) → hakkımda. "Odaya in" sağ altta.
- **Metin** yalnız kullanıcının sunumundan, ürün paketlerinden ve kullanıcının çatı geri bildiriminden. Biggie için
  "sculpt" denmez ("kil gibi duruyor").
- **Portfolyoya girmeyenler:** tasarımı kullanıcıya ait olduğu doğrulanmayan işler, kullanıcı karar verene kadar
  dışarıda kalır (liste yerelde, çalışma alanının portfolyo notlarında).

## Sıradaki aşamalar (plan: çatı katı iş akışı, 2026-10-21)

1. Telefonda dene: çatı ↔ oda geçişi (ayrı sayfa mı, tek sayfada iki sahne mi) ölçümle seçilir.
2. Robot uçuşu odada: üçüncü iniş aracı (`core/oda-karakter.js` inisKur kalıbı; hava dinamiği yayla).
3. Motor ve kat yöneticisi: `story.js` çoklu örnek düzeltmeleri, kat geçişi, Biggie'nin kat kat gelişi.
4. Bodrum atölyesi (araçlar), sonra orta katın mağazaya dönüşümü.
