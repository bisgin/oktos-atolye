# Oktos Workshop

Tarayıcıda çalışan parametrik 3B baskı araçları atölyesi. Sunucu yok, kurulum yok:
her şey kullanıcının tarayıcısında hesaplanır, STL / 3MF olarak indirilir.

## Araçlar

| Araç | Durum |
|---|---|
| Kutu, Bölmeli Tepsi ve Taban Plakası (Gridfinity uyumlu) | İlk sürüm |
| Vazo Üreteci | Planlandı |
| Fidget Clicker (Outemu / MX anahtarlı) | Planlandı |
| 3D Yazı, Text Flip, 3D QR | Planlandı |
| Filament Painter | Planlandı |
| Puzzle, Desk Pal, Harita araçları | Sonra |

## Çalıştırma

```powershell
./scripts/serve.ps1
```

Sonra tarayıcıda `http://localhost:8080` adresini aç. (Python 3 gerekir.)
Dosyaları doğrudan çift tıklayarak açmak çalışmaz: ES modülleri bir sunucu ister.

## Yapı

```
index.html          Ana sayfa: araç kartları
core/               Ortak çekirdek
  csg.js            manifold-3d başlatma + katı model yardımcıları
  viewer.js         Three.js görüntüleyici (Z yukarı, mm)
  export.js         STL (binary) ve 3MF yazıcı
  zip.js            Bağımlılıksız, sıkıştırmasız zip yazıcı (3MF için)
  ui.js             Panel bileşenleri: kaydırıcı+sayı, seçim, anahtar, şablon kartı
  i18n.js           TR / EN metinler
  share.js          Ayarları URL'ye yazma / okuma
  style.css         Ortak görünüm
tools/<araç>/       Her araç kendi klasöründe (index.html + geometri + şablonlar)
docs/               Araştırma notları ve teknik şartnameler
scripts/            Yardımcı scriptler
```

## Kütüphaneler (CDN, sürümü sabit)

- three.js 0.162.0 (MIT)
- manifold-3d 2.5.1 (Apache-2.0)

## Notlar

- Gridfinity, Zack Freedman'ın açık standardıdır. Bu proje onunla uyumludur, bağlantılı değildir.
- Başka sitelerin kodu, STL dosyaları ve görselleri kullanılmaz; yalnızca özellik fikirleri incelenmiştir.
