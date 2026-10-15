# Oktos Workshop: proje kuralları

- Commit mesajlarında yapay zekâ imzası YOK: `Co-Authored-By`, "Generated with", emoji yazılmaz. PR açıklamaları da aynı. (Kesin kural.)
- Repo gizli. Herkese açmak kullanıcı kararıdır.
- Derleme aracı yok: düz ES modülleri + importmap (CDN, sürümü sabit). Node gerektiren bir şey ekleme.
- Birim her yerde mm, Z ekseni yukarı. Dışa aktarılan model watertight (manifold) olmalı.
- Başka sitelerin kodu / STL'i / görseli kopyalanmaz. Gridfinity ölçüleri açık standarttır.
- Arayüz metinleri `core/i18n.js` içinde, TR varsayılan + EN.
- Ticari model: yalnız yerel sipariş (2026-10-15 kullanıcı kararı). Müşteriye STL/3MF indirme YOK; "Sipariş ver" WhatsApp'a hazır mesaj açar (core/order-config.js). Atölye için dışa aktarma ?atolye=1 ile görünür (gizleme, güvenlik değil).
- Araç sayfaları elle yazılmaz: 	emplates/tool.html + python scripts/sayfalar.py (önce --dry-run).
- Hikâye sahneleri: motor core/story.js, eşyalar core/props.js, metin core/story-data.js (üslup: docs/uslup-karti.md), her aracın sahnesi 	ools/<id>/scene.js. Yeni sahne önce lab/sahne.html?arac=<id> üzerinde kurulur, onaydan sonra araca bağlanır (creative-coding kuralı).
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
- [2026-10-15] `python -m http.server` modülleri önbelleğe aldırıyor, yeni export "bulunamadı" hatası veriyor → Önbellek başlığı yok → Her zaman `scripts/serve.py` (Cache-Control: no-store) kullan.
- [2026-10-15] Uzun vazo "kesik" göründü → Model değil, dar ekranda iki satırlık ölçü kutusu tepeyi örtüyordu → Önce `window.oktos.viewer` ile NDC ölç, sonra düzelt. Telefonda ikincil ölçüler gizli (`.minor`).
- [2026-10-15] Tarayıcı paneli arka plandayken requestAnimationFrame durur, ekran görüntüsü eski kare gösterir → Görüntüleyici her değişiklikte `renderNow()` çağırır.
- [2026-10-15] Vazo ağı elle üretiliyor → `fromMesh` (manifold) ağ kapalı değilse hata fırlatır; bu doğrulamanın kendisidir. İç duvar 2B normal ofsetiyle üretilir; çok derin yıldız/dişli iç köşede kendini kesebilir (manifold bunu yakalamaz) → Derinlik üst sınırı 0.6.
- [2026-10-15] Görüntüleyicide her güncellemede eski malzeme `dispose` edildi → Gölgelendirici programı silinip her seferinde ~1 sn yeniden derlendi → Malzemeleri renk + gölge türüne göre önbellekte tut, atma (`viewer.materialFor`).
- [2026-10-15] Vazo kenar çizgisi kapalıyken bile her çizimde hesaplanıyordu (donmanın asıl kaynağı) → Görüntüleyici `showEdges = true` ile başlıyordu → Kabuk açılışta `viewer.showEdges = state.edges` yapar; kenar yalnız açıkken üretilir.
- [2026-10-15] `.tgl input { position:absolute }` konumlu üst öğe olmadan → masaüstünde anahtara tıklayınca pencere ~1160 px kayıp ekran boşaldı → `.tgl { position: relative }`. Gizli girdiye her zaman konumlu kap ver.
- [2026-10-15] Konsoldan (javascript_tool) `await import('/tools/...')` içe aktarma haritasını görmedi ("manifold-3d" çözülemedi) → Ölçümü sayfanın kendisine yaptır (`window.oktos.timing`).
- [2026-10-15] Tarayıcı panelinde kullanıcı da geziniyordu, test için onun sekmesini yönlendirdim → Testi her zaman `tabs_create` ile açılan kendi sekmende yap.
- [2026-10-15] Sahne kadrajında nesneleri kaydırırken kamerayı da aynı miktarda kaydırdım, ekranda hiçbir şey değişmedi → Kompozisyon için nesne ile kamera hedefinin farkını değiştir, ikisini birlikte değil.
- [2026-10-15] `thumbsFor()` çağrısı, kullandığı `let thumbQueue` tanımından önce çalıştı (TDZ hatası) → küçük resimler sessizce boş kaldı → `let/const` durumu her zaman ilk çağrıdan önce tanımla; konsol hatalarını her sayfa testinde oku.
- [2026-10-15] Geçişte görünmez (opacity 0 / visibility hidden) öğeye `focus()` boşa gitti → `page.js` `focusWhenVisible` ile öğe görünür olunca odaklar.
- [2026-10-15] Yatay için kurulan sahneler dikey telefonda kenarlardan kesildi → `story.js` dikey oranda kamerayı geri çekip şablonların ortasına çevirir; yeni sahnede ayrıca ayar gerekmez, ama dikeyde mutlaka bak.
- [2026-10-15] Şablon seçimi önceki şablonun alakasız değerlerini taşıyordu (istif, kepçe) → `applyPreset` önce varsayılanlara döner (renk, yazıcı, kenar, kalite korunur), sonra şablonu yazar.
- [2026-10-15] Tarayıcı paneli gizliyken requestAnimationFrame hiç çalışmaz; GSAP akışları ilerlemez → Test için `oktosPage.gsap.ticker.lagSmoothing(0)` + `setInterval(() => gsap.ticker.tick(), 16)`; görüntü için `story().debug.seek(p)`.