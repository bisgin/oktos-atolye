# Oktos Workshop

Tarayıcıda çalışan parametrik 3B baskı atölyesi. Müşteri tasarlar, Oktos basıp gönderir.
Sunucu yok, kurulum yok: geometri kullanıcının tarayıcısında hesaplanır.

## Araçlar

| Araç | Atölye | Hikâye sahnesi |
|---|---|---|
| Kutu ve Organizer (serbest, Gridfinity, taban plakası) | Hazır | Masa + çekmece + raf |
| Vazo Üreteci (köşe sayısı 3 → ∞, yükseklik bantlı efektler) | Hazır | Pencere önü + konsol |
| Fidget Clicker (Outemu / MX anahtarlı) | Planlandı | Masa köşesi |
| 3D Yazı | Planlandı | Ev girişi |
| Text Flip | Planlandı | Konsol + döner tabla |
| 3D QR Kod | Planlandı | Oturma odası |
| Filament Painter | Planlandı | Pencere + çerçeve |
| Puzzle Maker | Planlandı | Sehpa |

## Çalıştırma

```powershell
./scripts/serve.ps1
```

Sonra `http://localhost:8080` adresini aç (Python 3 gerekir; sunucu önbelleksizdir).
Dosyaları doğrudan çift tıklayarak açmak çalışmaz: ES modülleri bir sunucu ister.

- Her araç sayfası önce hikâye sahnesiyle açılır (ilk ziyaret tam giriş, sonrakiler kısa); şablon seçilince atölye.
  Ayar içeren paylaşım linki sahneyi atlar; üst çubuktaki `Sahneye dön` sahneyi açar.
- Sahne laboratuvarı (yeni sahne denemek için): `http://localhost:8080/lab/sahne.html?arac=bin`,
  `mod`: full / short / still. Giriş tekrar görmek için tarayıcıda `oktos.story.<araç>` anahtarını sil.
- Atölye görünümü (STL/3MF dışa aktarma, üçgen sayısı, yazıcı tablası): araç linkine `?atolye=1` ekle.
- Sipariş hattı: `core/order-config.js` (WhatsApp numarası, gram fiyatı, en düşük tutar, teslim süresi).

## Yapı

```
index.html            Ana sayfa: araçlar ve hikâye başlıkları
templates/            tool.html (sahne + atölye), story.html (yalnız sahne) → python scripts/sayfalar.py (--dry-run)
core/                 Ortak çekirdek
  tool-shell.js       Araç kabuğu: panel, şablonlar, ölçüler, sipariş, paylaşım, dil
  ui.js               Panel bileşenleri (erişilebilir): kaydırıcı, seçim, anahtar, kartela, katlanır bölüm
  viewer.js           Three.js görüntüleyici (Z yukarı, mm)
  csg.js              manifold-3d başlatma + katı model yardımcıları
  export.js, zip.js   STL / 3MF yazıcı (atölye için)
  page.js             Sayfa düzenleyicisi: sahne ↔ atölye geçişi (bootTool), yalnız sahne (bootStory)
  story.js            Hikâye sahnesi motoru: kamera, ışık, vurgulama, giriş ve geçiş animasyonları
  story-data.js       Hikâye metinleri ve sahne şablon adları (TR / EN)
  props.js            Kodla üretilen sahne eşyaları (masa, çekmece, bitki, lamba…)
  scene-kit.js, font3d.js, mesh3.js   Sahne yardımcıları, 3B yazı (Schibsted Grotesk), ağ çevirici
  i18n.js, share.js, order-config.js, style.css, story.css
tools/<araç>/         app.js (araç tanımı), geometry.js, scene.js (hikâye sahnesi), index.html (üretilir)
lab/sahne.html        Sahne laboratuvarı (onaydan önce deneme)
docs/                 Araştırma, üslup kartı
scripts/              serve.ps1 / serve.py, sayfalar.py
```

## Kütüphaneler (CDN, sürümü sabit)

- three.js 0.162.0 (MIT) · manifold-3d 2.5.1 (Apache-2.0) · GSAP 3.15.0 (Standard no-charge license)
- opentype.js 1.3.4 (MIT) · Schibsted Grotesk @fontsource 5.3.0 (OFL-1.1) · qrcode-generator 1.4.4 (MIT)

## Notlar

- Gridfinity, Zack Freedman'ın açık standardıdır. Bu proje onunla uyumludur, bağlantılı değildir.
- Başka sitelerin kodu, STL dosyaları ve görselleri kullanılmaz; yalnızca özellik fikirleri incelenmiştir.
- Sahnelerdeki bütün eşyalar kodla üretilir; dışarıdan model veya görsel kullanılmaz.
