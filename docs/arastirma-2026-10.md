# Araştırma notları (Ekim 2026)

Kaynaklar: printpal.io/tools (bin, vase, fidget-clicker, desk-pal, puzzle, qr, 3d-text,
text-flip, hueforge-painter, fiyat sayfası), app.3dsynth.app (Mesh Sculptor), vasedjinn.com,
huggingface.co/docs/hub/spaces-zerogpu. Yalnızca özellik ve davranış incelendi; kod kopyalanmadı.

## Ortak bulgu
- Yapay zekâsız tüm araçlar tarayıcıda: three.js 0.162 + manifold-3d 2.5.1 (WASM boolean).
- "Kredi" yalnızca indirme düğmesinde istemci tarafı bir bayrak. Gerçek kredi yalnızca AI araçlarında.
- AI figür araçları = sabit istemle görsel düzenleme + image-to-3D API + baskı son işlemi.

## Bin / Sorting Tray / Baseplate
Modlar: Serbest kutu, Gridfinity kutu, Taban plakası.

Gridfinity sabitleri (açık standart):
- Izgara 42 mm, yükseklik birimi 7 mm, kutu taban ölçüsü 42·n − 0.5, köşe r 3.75 (plaka r 4).
- Ayak 4.75 mm: z0 → W−5.9 r0.8 | z0.8 → W−4.3 r1.6 | z2.6 → W−4.3 r1.6 | z4.75 → W r3.75.
- Plaka cebi: 4.65 yüksek (tepeden 0.4 kırpılıp 4.25).
- Mıknatıs Ø6.5 × 2.4 (6×2 mıknatıs), M3 vida Ø3, havşa Ø3.4 / Ø7.4. Delik merkezi hücre merkezinden ±13.

Serbest kutu aralıkları: W/D 20–400, H 5–200, duvar 0.8–6, taban 0.4–6, bölme 0.8–6,
köşe r 0–20, sütun/satır 1–12 (bölme ≥ 5 mm). Seçenekler: istif dudağı, etiket rafı, ön kepçe,
taban delikleri, serbest yerleştirilen duvar / raf / kepçe.

Kullanılabilirlik fikirleri: kaydırıcı + sayı kutusu çifti, geçersiz değer reddedilmez kıstırılır
ve kısa not çıkar, şablon kartı mevcut değerlerle eşleşince vurgulanır, yazıcı tablası uyum
kontrolü, canlı hacim/ağırlık, paylaşılabilir URL.

## Vazo (3 sitenin birleşimi)
- Gövde: yükseklik, alt/üst çap, duvar, taban (0 = altı açık saksı), içi dolu "vase mode".
- Siluet: hazır eğriler + sürüklenebilir özel eğri (tablo görünümü, sarkma renklendirmesi).
- Kesit: çember, elips, süper-elips, N-gen (köşe sayısı + köşe yuvarlatma), yıldız, artı, çiçek,
  dişli, sinüs lob, SVG; altta/üstte farklı kesit ve aralarında geçiş.
- Efekt yığını: burgu, lob, kaburga/kanat, kafes, dalga, organik gürültü, dokular.
- HER efekt için başlangıç/bitiş yüksekliği + yüksekliğe göre güç eğrisi (3dSynth modeli).
- Ağız: genişleme, eğik kesim, fırfır. Şablon kartları: renk + yüzey (mat/ipek) + canlı önizleme.
- Kullanıcı isteği: köşe sayısı göstergesi 3 → 4 → … → 12 → ∞ (çember).

## Fidget Clicker
- Model kesim düzleminden ikiye bölünür; alt yarıdan anahtar gövdesi, üst yarıdan tuş yuvası oyulur.
- Modlar: Normal, Kutu içinde (yazılı), Gömülü.
- Bizde: Outemu Blue (MX uyumlu) anahtar kullanılacak. Plaka kesiği 14 × 14 mm (MX standardı).
  Ölçüler ilk taslaktan sonra test baskısıyla doğrulanacak.

## Diğer araçlar (kısa)
- 3D QR: qrcode modülleri → kabartma / düz iki renk, çerçeve, stand, delik. Kolay.
- Text Flip: harf çiftlerinin dik ekstrüzyonlarının kesişimi. Kolay.
- 3D Yazı: opentype.js → şekil → ekstrüzyon, alt plaka, anahtarlık deliği. Kolay–orta.
- Filament Painter: görsel → yükseklik haritası, renk katmanı kartları (alttan üste), katman
  yüksekliğine kilitli renk değişim yükseklikleri. Sağda 340 px panel. Kolay–orta.
- Puzzle: hücre başına tırnaklı 2B profil ekstrüzyonu ∩ model. Watertight olmayan girdi sorunu.
- Desk Pal: ESP32-S3 1.28" yuvarlak ekran için kafa kabuğu. Zor; önce hazır kafa + STL.

## AI araçları kararı
- Şimdilik yok. HF ZeroGPU ziyaretçi başına 2–5 dk/gün, demo için uygun, ürün için değil.
- Yerel Hunyuan3D-2.1 yalnız şekil RTX 3060 12 GB'a sığar; Tencent lisansı AB/UK/KR'de geçersiz.
- Ücretli API (fal/Replicate) iş başına ~$0.15–0.20.
