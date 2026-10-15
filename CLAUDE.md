# Oktos Workshop: proje kuralları

- Commit mesajlarında yapay zekâ imzası YOK: `Co-Authored-By`, "Generated with", emoji yazılmaz. PR açıklamaları da aynı. (Kesin kural.)
- Repo gizli. Herkese açmak kullanıcı kararıdır.
- Derleme aracı yok: düz ES modülleri + importmap (CDN, sürümü sabit). Node gerektiren bir şey ekleme.
- Birim her yerde mm, Z ekseni yukarı. Dışa aktarılan model watertight (manifold) olmalı.
- Başka sitelerin kodu / STL'i / görseli kopyalanmaz. Gridfinity ölçüleri açık standarttır.
- Arayüz metinleri `core/i18n.js` içinde, TR varsayılan + EN.
- Ticari model: yerel sipariş (tasarla → Oktos basıp gönderir). İndirme düğmesi şimdilik açık; sipariş akışı sonra eklenecek.
- manifold nesneleri WASM belleğinde yaşar: geometri `csg.scope()` içinde üretilir, ara nesneler otomatik silinir.

## Skill haritası (bu projede etkin, 2026-10-15)
Her iş türünde ilgili skill'i çağır, önce Gotchas bölümünü oku.

| İş | Skill / ajan |
|---|---|
| Arayüz tasarımı, panel, şablon kartı, mobil düzen | `impeccable` (projenin tek tasarım skill'i; `frontend-design` yerine bu) |
| Three.js önizleme ışığı, ana sayfa hareketi, WebGL efektleri | `creative-coding` |
| Arayüz metni TR/EN, buton/hata mesajı, Hakkımızda | `anlati-yazimi` |
| Şablon kartı render'ı, tanıtım videosu (blender-mcp gerekir) | `blender-studyo` |
| Atölyede çıkan bir tasarımı ürün olarak listeye hazırlamak | `urun-hatti` |
| Yerel sipariş akışı → sipariş notları | `oktos-siparis` |
| Puzzle / masa oyunu organizer şablonları (kart kutusu, token tepsisi) | `tabletop-game-designer` |
| Godot'ta etkileşimli önizleme gerekirse | `godot-studyo` |
| Harita araçları (arazi, blok) için level/arazi kuramı | `level-tasarimi` |
| Yayın öncesi güvenlik + hata denetimi | `yazilim-denetcisi` |
| Araç bitince kod incelemesi | `code-review`, `simplify`; ajanlar `senior-reviewer`, `qa-quality-control` |

## Gotchas
- [2026-10-15] `bisgin/oktos-workshop` adı zaten Documents\Oktos çalışma alanı reposuna ait → Atölye sitesi oraya konmaz (o repo hiç açılmamalı) → Site ayrı repo adıyla açılır.
- [2026-10-15] Bilgisayarda Node yok → Vite planı düştü → Derlemesiz ES modülü + importmap; yerel sunucu `scripts/serve.ps1` (Python).
