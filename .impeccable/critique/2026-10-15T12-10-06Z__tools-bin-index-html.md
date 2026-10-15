---
target: Oktos Workshop araç arayüzü (Kutu aracı + vazo + ana sayfa)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
target_identity: "file:C:\\Users\\ardab\\oktos-workshop\\tools\\bin\\index.html"
target_fingerprint: "sha256:19a5c949c2a92437d9d0d6cd0195ab7d97e77c8c5ce089debe0b18021404df0a"
target_path: "C:\\Users\\ardab\\oktos-workshop\\tools\\bin\\index.html"
timestamp: 2026-10-15T12-10-06Z
slug: tools-bin-index-html
---
Method: dual-agent (A: tasarım incelemesi · B: dedektör + tarayıcı kanıtı) + C: teknik denetim

## Tasarım sağlığı (Nielsen, A) — 24/40 Kabul edilebilir
| # | Kural | Puan | Ana sorun |
|---|---|---|---|
| 1 | Sistem durumu | 3 | İndirme geri bildirimi yok; notlar kontrolden uzakta |
| 2 | Gerçek dünya | 2 | ×42, ×7, Vazo modu, Üçgen, Bambu P1S jargonu |
| 3 | Kullanıcı denetimi | 2 | Geri al / sıfırla yok; kıstırma geri dönmüyor |
| 4 | Tutarlılık | 3 | Etiket rafı liste/anahtar; EN'de notlar Türkçe |
| 5 | Hata önleme | 3 | Sığmayan parça indirilebiliyor, böl önerisi yok |
| 6 | Tanıma | 3 | Şablon değiştirildi durumu yok |
| 7 | Esneklik | 2 | Kısayol, geri alma, katlama yok |
| 8 | Sadelik | 2 | Tüm bölümler açık ve eşit; 6/8 araç Yakında |
| 9 | Hatadan kurtulma | 2 | Notlar altta, kayboluyor; sığmıyor çözümsüz |
| 10 | Yardım | 2 | Gridfinity, sipariş, baskı anlatılmıyor |

## Teknik denetim (C) — 12/20 Kabul edilebilir
Erişilebilirlik 2 · Performans 2 · Tema 3 · Mobil 2 · Bütünlük 3

## Özgünlük
İskelet kategori standardı; ayrıntılar Oktos'a özgü. İş modeli (yerel atölye, fiyat, süre) görünmüyor.
Dedektör: CLI 1 bulgu (tight-leading, yanlış alarm); tarayıcı 23 (22 low-contrast --ink-3 #7a8089, 1 skipped-heading).

## Öncelikli sorunlar
- [P0] Sipariş ver çıkmaz sokak → shape
- [P0] .tgl input position:absolute → anahtara tıklayınca ekran boşalıyor; adsız kaydırıcılar, aria-pressed yok, odak kaybı → harden
- [P1] Panel maker'a konuşuyor, müşteriye değil; temel/ileri ayrımı yok → distill
- [P1] Mobilde kontrollere %28 alan; dokunma alanları 20-40 px → adapt
- [P1] Yeniden hesaplama 0,26-1,7 sn donma (%72 görünmeyen kenar); açılışta 3,6 sn küçük resim → optimize

## Profiller
Jordan: jargon, sipariş yakında. Casey: 584/812 px sabit öğe, 1,1 mm/px kaydırıcı. Sam: anahtar Tab'ı ekranı boşaltıyor, adsız kaydırıcı. Alex: geri alma yok, 1970 px katlanmayan panel.

## Küçük gözlemler
EN'de title/notlar Türkçe; sayı biçimi karışık; sessiz yükleme hataları; prompt() yedeği; URL doğrulaması yok; OG meta yok; sayfa iskeleti kopya; ölçek hissi yok.

## Sorular
Sipariş tek düğme olsa sayfa ne göstermeli? Akış neden ölçüyle başlamıyor? Ücretsiz STL siparişi yiyor mu?
