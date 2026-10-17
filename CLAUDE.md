# Oktos Workshop: proje kuralları

- Commit mesajlarında yapay zekâ imzası YOK: `Co-Authored-By`, "Generated with", emoji yazılmaz. PR açıklamaları da aynı. (Kesin kural.)
- Repo herkese açık (GitHub Pages yayını için, 2026-10-15 kullanıcı kararı). Parola, anahtar, yerel klasör yolu ve kişisel veri commit edilmez; `.impeccable/` raporları yerelde kalır.
- Derleme aracı yok: düz ES modülleri + importmap (CDN, sürümü sabit). Node gerektiren bir şey ekleme.
- Birim her yerde mm, Z ekseni yukarı. Dışa aktarılan model watertight (manifold) olmalı.
- Başka sitelerin kodu / STL'i / görseli kopyalanmaz. Gridfinity ölçüleri açık standarttır.
- Arayüz metinleri `core/i18n.js` içinde, TR varsayılan + EN.
- Ticari model: yalnız yerel sipariş (2026-10-15 kullanıcı kararı). Müşteriye STL/3MF indirme YOK; "Sipariş ver" WhatsApp'a hazır mesaj açar (core/order-config.js). Atölye için dışa aktarma ?atolye=1 ile görünür (gizleme, güvenlik değil).
- Araç sayfaları elle yazılmaz: `templates/tool.html` + `python scripts/sayfalar.py` (önce `--dry-run`).
- Hikâye sahneleri: motor `core/story.js`, eşyalar `core/props.js`, toparlama/zıplatma hareketleri `core/motion.js`, metin `core/story-data.js` (üslup: `docs/uslup-karti.md`), her aracın sahnesi `tools/<id>/scene.js`. Yeni sahne önce `lab/sahne.html?arac=<id>` üzerinde kurulur, onaydan sonra araca bağlanır (creative-coding kuralı).
- Sahnelerde kaplar ve ürünler (saksı, vazo, organizer, tabla) hep bizim baskı modellerimiz (araçların kendi çıktısı); hazır model kullanılırsa yalnız içine konanlar için (çiçek, yiyecek), kaynağı ve lisansı yazılarak (2026-10-16 kullanıcı kararı).
- Ana sayfada 3B vitrin yok (2026-10-16 kullanıcı kararı: araç sayfalarındaki hikâye sahneleri daha iyi). Ana sayfa araç listesidir; denenen vitrin `_silinecek/vitrin-2026-10-16/` altında durur (başlık hareketleri `core/vitrin-titles.js` ve eğriler `core/eases.js` oda için geri alındı).
- Oda sahnesi (ana sayfa adayı, tasarım ve hat: `docs/oda-sahnesi.md`): sahne `core/oda-sahne.js` (şimdilik gri kutu; her bölgenin ürünü bir yuvada, `api.show` şablonu değiştirir), şablon listeleri ve modeller `core/oda-urunler.js`, yerler ve kamera `core/oda-yerler.js`, yakın plan paneli (seçici, oklar, kaydırma, toz yazısı) `core/oda-panel.js`, metin `ODA_STORY` (`core/story-data.js`) ve `oda.*` (`core/i18n.js`), görünüm `core/oda.css`; motor `core/story.js` (kenardan bakma `built.look`; `focusShift` verilen sahnede kartın yanda mı altta mı olduğuna `resize()` karar verir ve `root.dataset.panel`'e yazar, CSS ve sayfa bunu okur; `touchOrbit`, `api`, `setPreset`, `busy`, `story` ve `onCard` seçenekleri, `noLift`). Deneme `lab/oda.html` (`?mod=still`, `?bak=0.4`, `?odak=cekmece`, `?adim=3`, çekimde `?cek=1`), Kutu sahnesiyle yan yana `lab/oda-yan-yana.html`; tam çözünürlüklü çekim `python scripts/sayfa-cek.py YOL AD` (`--toplu`, `--sayfa`).
- Sahne etkileşimi: tıklanan şablona kamera yaklaşır, sahne `onFocus(id)` ile canlanır (vidalar ayırıcıya düşer, çiçek açar), kartta "Bu şablonla tasarla". Yakın plan ayarı hotspot'ta: `focusRadius`, `focusElev`, `focusCenter`, `extra`.
- manifold nesneleri WASM belleğinde yaşar: geometri `csg.scope()` içinde üretilir, ara nesneler otomatik silinir.

## Skill haritası (bu projede etkin, 2026-10-16)
Her iş türünde ilgili skill'i çağır, önce Gotchas bölümünü oku.

| İş | Skill / ajan |
|---|---|
| Arayüz tasarımı, panel, şablon kartı, mobil düzen | `impeccable` (projenin tek tasarım skill'i; `frontend-design` yerine bu) |
| Three.js önizleme ışığı, ana sayfa hareketi, WebGL efektleri | `creative-coding` |
| Fotorealistik sahne: HDRI ve ortam ışığı, gölge, PBR malzeme, son işlem, ton eşleme | `threejs-impl-lighting`, `threejs-impl-shadows`, `threejs-syntax-loaders`, `threejs-syntax-materials`, `threejs-impl-post-processing`, `threejs-core-renderer` |
| Three.js'te siyah ekran, yanlış renk, düşük FPS, bellek | `threejs-errors-rendering`, `threejs-errors-performance` |
| GSAP API: zaman çizelgesi, SplitText (kinetik tipografi), CustomEase, yardımcılar | `gsap-core`, `gsap-timeline`, `gsap-plugins`, `gsap-utils`, `gsap-performance` (ne zaman ve nasıl hareket: `animate`) |
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
- [2026-10-15] Kullanıcının çalışma alanı reposu ayrıdır ve özel kalır (adı bu herkese açık repoda yazılmaz) → Atölye sitesi oraya konmaz → Site ayrı repo adıyla açılır.
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
- [2026-10-15] Gizli panelde ekran görüntüsü WebGL karesini göstermedi → Kareyi `renderer.domElement.toDataURL()` ile al, `.story-canvas` içine `<img>` olarak koy; animasyon zamanını `gsap.globalTimeline.pause()` + `.time(T + t)` ile kare kare ilerlet.
- [2026-10-15] Yatay kayan şablon şeridi, ızgaranın `1fr` sütununu içeriği kadar (924 px) genişletti → telefonda sayfa taştı, sabit sahne katmanı ekrandan geniş kuruldu, başlık kesildi → Izgara sütunları `minmax(0, 1fr)`; kayan içerik ekleyince telefonda `document.documentElement.scrollWidth` ölç.
- [2026-10-15] Yakın planda bölmeli kutunun içi görünmedi (duvarlar örttü); çapraz dizili vidalar bakış yönüne paralel kalıp dik duruyormuş gibi göründü → Hotspot `focusElev` ile yukarıdan bak; uzun eşyaları bakış yönüne dik diz.
- [2026-10-15] Parlak odada SpotLight ile "yalayan ışık" ton eşlemede kayboldu (ortalama parlaklık ~%5 değişti) → Vurguyu ışıkla değil nesnenin kendi hareketiyle ver (ölçek, renk çarpanı).
- [2026-10-15] Kartın gecikmeli açılışı (delay 0.35) ile kapanışın `onComplete: hidden` yarıştı; hızlı "Geri → başka şablon"da kart kayboldu → GSAP `overwrite: 'auto'` henüz başlamamış gecikmeli tween'i öldürmez → Aç/kapa başında `gsap.killTweensOf(...)`, `onComplete` içinde durumu yeniden kontrol et.
- [2026-10-15] Üzerine gelince 7 mm yükselen şablona tıklanınca eşyalar gruba havadayken bağlandı, grup inince masaya gömüldü → `focusOn` önce kaldırmayı sıfırlar, sonra `onFocus` (tidy/attach) çalışır.
- [2026-10-16] Sayfa testinde `window.gsap` yok, zaman ilerletilemedi → gsap modülün içinde → Konsolda importmap'teki tam URL ile `import()` et (aynı modül örneği gelir), sonra `globalTimeline.pause()` + `time(T + x)`. Testten sonra sayfayı yenile (duraklatılmış zaman sayfayı dondurur).
- [2026-10-16] Zamanı küçük adımlarla ilerleten test döngüsü sonsuza girdi, sekme dondu (kapatmak gerekti) → Duraklatılmış `globalTimeline` kendi süresinin ötesine ilerlemiyor → Önce uzun boş bir tween ekle (`gsap.to({}, { duration: 1e5 })`), döngüye "zaman ilerlemiyorsa dur" koruması koy, işi 45 sn altı parçalara böl.
- [2026-10-16] Sahnede gölge hiç düşmedi → DirectionalLight gölge kamerasının sınırları değişti ama `updateProjectionMatrix()` çağrılmadı, gölge varsayılan 10×10'luk alanda kaldı → Gölge kamerası ayarından sonra her zaman `shadow.camera.updateProjectionMatrix()`.
- [2026-10-16] Gizli tarayıcı panelinde `screen` 0×0 döner (kalite tespiti 0'ı küçük ekran sayarsa masaüstü düşük kaliteye düşer) → 0'ı "bilinmiyor" say. Panel hareket azaltmayı ve dokunmayı taklit edemez: dokunma için `PointerEvent('pointerdown', { pointerType: 'touch' })` + `click()`.
- [2026-10-16] Toz bulutu görünmedi → `PointsMaterial.size` dünya biriminde (mm): 1,3 m'den 17 mm'lik zerre ~6 px; masada doğan zerrenin alt yarısı derinlik testinde gizlenir → Zerre 30–90 mm yumuşak leke olsun, masanın biraz üstünden başlasın.
- [2026-10-16] Bash heredoc içinde tek tırnaklı JS bloğu komutu bozdu ("unexpected EOF") → Uzun kod bloğunu Write ile dosyaya yaz, küçük bir Python betiğiyle yerine koy. (2026-10-17'de tekrarladı: ikinci kez.)
- [2026-10-16] Lab dosyasını düzenleyince panel file:// sekmesi açıp öne aldı; test sekmesinde rAF durdu, ölçüm boş döndü → Ölçmeden önce `tabs_select` ile test sekmesini öne al.
- [2026-10-16] Yapboz parçası kayıp durduktan sonra yerine zıplarken önce geri sıçradı → `hop()` başlangıç yerini kurulduğu an okur; kayma bitmeden kurulmuştu → Kayma bitince kur, aynı akışa ekle (`tl.call(() => tl.add(hop(...), tl.time()))`): sıfırlamada birlikte durur.
- [2026-10-16] Dil değişince sayfanın betiği durdu → `id="x"` öğesi tarayıcıda `window.x` adıyla da erişilir; nesne kurulmadan `window.x?.setLang` öğeyi bulup hata attı → Sayfa nesnesini kendi değişkeninde tut; id'li öğe adlarını global değişken gibi kullanma.
- [2026-10-16] Kod bloğunu Python ile yerine koyunca bir yorum satırı "/ Dik duran" diye bozuldu → Git Bash (MSYS) `//` ile başlayan argümanı yol sanıp tek `/`'ye çevirdi, bitiş işareti bir karakter kaydı → İşaret metnini `//` ile başlatma (yorumun ilk kelimesinden başlat) ya da `MSYS_NO_PATHCONV=1` ver.
- [2026-10-16] Görünmez Edge (`--headless --virtual-time-budget`) ile çekimde glTF modelli sahne boş geldi → Sanal zaman modelin dokularının çözülmesini beklemiyor → Modelli sahneyi tarayıcı panelinde doğrula.
- [2026-10-16] Kedi başı ve harf eğrileri köşeli göründü → `solid()` düz gölgeleme verir (her üçgen ayrı normal) → Eğrili parçada normalleri `toCreasedNormals` (three/addons BufferGeometryUtils) ile yeniden hesapla, kırılma açısı 0,5 rad: eğri yumuşar, kesik kenar keskin kalır; pahlı kenarı yuvarlak göstermek için 0,9.
- [2026-10-16] Peynir dilimi mumunda dikey şeritler çıktı → Dilim ile teker aynı yarıçapta kesişti, çakışan yüzeyden ince üçgenler kaldı → CSG'de çakışan yüzey bırakma: kesen şekli biraz büyük al, yüzey tek katıdan gelsin.
- [2026-10-16] Cilalı yüzeyin arkasından gelen ışık (kenar ışığı, ters ışık) masayı griye boyadı → Cila alçak açıda güçlü yansıtır → Ana ışığı yandan ver, arka ışığı zayıf tut; biçimi ortam ışığını kısarak belirginleştir.
- [2026-10-17] Görünmez Edge çekimi görüntü yazmadı → Edge 155'te `msedge.exe` başlatıcısı tarayıcıyı arka planda bırakıp hemen dönüyor, betik döner dönmez profili kapatıyordu; `--use-angle=swiftshader` verilince de hiç yazmıyor → `scripts/sayfa-cek.py` görüntünün yazılıp boyutunun sabitlenmesini ve profilin serbest kalmasını bekler, SwiftShader bayrağı vermez.
- [2026-10-17] Görünmez Edge çekiminde yakın plan perdesi, işaretçi ve hap yarı saydam çıktı; `--bekle` 45 sn'ye çıkınca da değişmedi → Görünmez tarayıcıda kareler seyrek çizilir: GSAP her geç kareyi 33 ms sayar (lagSmoothing), CSS geçişleri de bitmeden çekim alınır → Çekim adresine `cek=1` ekle (lab/oda.html geçişleri kapatır, `gsap.ticker.lagSmoothing(0)`); hareketin kendisini tarayıcı panelinde doğrula.
- [2026-10-17] Oda genel planında sayfa başlığı raflara bindi → Geniş odada başlığa boş duvar kalmıyor → Odada başlık görünmez (ekran okuyucu ve arama motoru için sayfada kalır), sol üstte yalnız kısa cümle hapı.
- [2026-10-15] Yayın izleyicisi boş döndü: PowerShell 5.1, `gh --jq '.status + " " + .commit'` içindeki çift tırnakları yerel programa geçirirken düşürdü, sorgu sessizce bozuldu → `--jq` ifadesini tek alanlı tut (`--jq .status`) ya da Bash kullan; yayını ayrıca canlı dosyayla doğrula.
- [2026-10-15] PowerShell çift tırnaklı dizgede ters tırnak + t sekmeye döndü ("`templates" bozuldu); Türkçe kıvrık tırnak (“ ”) ayrıştırma hatası verdi → Metin değişikliğini Write/Edit aracıyla yap; PowerShell'de yalnız tek tırnaklı, kısa değiştirmeler.
