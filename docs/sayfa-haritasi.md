# Sayfa haritası: bugün ve hedef

Taslak, 2026-11-01. Site iskeleti planının C1 kontrol noktası. Kodu değiştirmez; C5 için iş listesi verir.

**2026-11-02 (K2):** oda `lab/oda.html`'den `oda/index.html`'e (`/oda/`) taşındı; noindex kalktı. `lab/oda.html` artık
yalnız yönlendirme (noindex, canonical `../oda/`; sorgu ve # korunur: `lab/oda.html?odak=anahtarlik#x` →
`oda/?odak=anahtarlik#x`). Üst çubuktaki "Oda" (`araclar/`, `urunler/`, `urunler/urun.html`, 8 araç sayfası
`templates/tool.html` üzerinden) ve çatıdaki "Odaya in" `oda/`'ya gider. İki yön: ürün sayfası → oda "Odada gör"
(`oda/?odak=<yuva>`, `core/site-metin.js` `odaAdresi`); oda → ürün sayfası yakın plan kartında "Ürün sayfası"
(`urunler/urun.html?id=<ürün>`, `core/oda-panel.js`; seçici değişince adres de değişir). Aşağıdaki "Önce" bölümü
2026-11-01'in kaydıdır, eski yolları olduğu gibi tutar.

## Amaç

Sitenin hangi sayfasında ve oda sahnesinin hangi durağında bugün ne olduğunu, hedefte nerede ne duracağını tek yerde
toplar. Hedefin özü: orta kat (oda) yalnız sattığımız ürünleri gösterir; araçlar sahnesiz, 2B bir alana çıkar ve
reklamdan doğrudan açılır; satılan ürünlerin ayrı bir 2B listesi olur; çatı ve bodrum şimdilik askıda.

## Kaynak kararlar

- **2026-10-15:** Ticari model yalnız yerel sipariş. Müşteri STL/3MF indirmez; "Sipariş ver" WhatsApp'a hazır mesaj açar.
- **2026-10-16:** Ana sayfada 3B vitrin yok; ana sayfa araç listesidir.
- **2026-10-19:** Oda ana sayfa olmayacak (karakter kararıyla birlikte).
- **2026-10-21:** Üç katlı bina: çatı portfolyo, orta kat satılan ürünler, bodrum araçlar. Aşağıdaki 29–30.10 kararları
  bunu günceller: araçlar bodruma değil, sahnesiz 2B alana gider.
- **2026-10-29 (Sb627):** Tasarımı hızla bitirmek için şimdilik yalnız orta kat. Sattığımız ürünler (anahtarlık, sticker,
  plakalar) orta kattaki sahnenin rafına yerleşir, ziyaretçi tıklayıp inceler; plakaların tamamı Blender'da. Araç
  arayüzleri sahnesiz, sıradan kullanıcının kolay eriştiği bir alanda; reklamlardaki "tıkla · oluşturmaya başla ·
  sipariş ver" üçlüsü doğrudan bu arayüzlere gider.
- **2026-10-29 (Sff97):** Seçilen yol "Ayrı /urunler sayfası, binadan bağlantı". Üst ve alt kat ertelendi; orta kat
  durur. Araçlar ve siparişe giden bütün tasarımlar 2B, sahnesiz alanda durur.
- **2026-10-30 (Sedab):** Orta kat = oda, satılan ürünler. Çatı askıda; onun yerine araç alanı yapılır.
- **2026-10-30:** Ürün görseli Blender render görseli olur. Maliyet dilimleyiciden çıkarılır, "önerilen" olarak gösterilir.
- **Kalıcı:** Oktos fason ya da toplu üretici değil; ön mühendis ve tasarımcı. "Kendin tasarla" söylemi yok. Müşteri
  STL indirmez.

## Önce: bugünkü durum

### Sayfalar

| Yol | Ne gösteriyor | Bağlandığı araç / ürün | Kaynak dosya |
|---|---|---|---|
| `/` (`index.html`) | 2B araç listesi: başlık "Ölçünü gir, atölye bassın.", 8 araç satırı (ad, hikâye cümlesi, kısa açıklama, "hazır" etiketi). Odaya ya da çatıya bağlantı yok. | 8 araç sayfası (aşağıdaki araç tablosu) | `index.html`, `core/story-data.js` (`STORIES`, `live`), `core/i18n.js` |
| `/tools/<id>/index.html` (8 sayfa) | Sahnesiz araç: şablonlar, ayarlar, "Hazır" deyince tahmini fiyat ve "Sipariş ver"; bağlantı kopyalama. `?sablon=<id>` şablonu seçer, `?atolye=1` 3MF dışa aktarmayı gösterir. | Kendi aracı | `templates/tool.html` → `scripts/sayfalar.py`; `tools/<id>/app.js`; `core/page.js`, `core/tool-shell.js`, `core/order-config.js` |
| `/lab/oda.html` (noindex) | Orta kat: fotogerçekçi oda, genel plan ve 14 durak, kaydırmalı tur, Biggie. Yalnız doğrudan adresle ve çatıdaki "Odaya in" ile açılır. | 13 durak bir araca, 1 durak mağazaya (aşağıdaki durak tablosu) | `lab/oda.html`, `core/oda-yerler.js` (`ZONES`, `A`, `FOCUS`), `core/oda-urunler.js` (`TEMPLATES`), `core/oda-sahne.js`, `core/oda-tur.js`, `core/oda-panel.js`, `core/story-data.js` (`ODA_STORY`) |
| `/portfolyo/` (`portfolyo/index.html`; 2026-11-09'da `lab/cati.html`'den taşındı, eski adres sorgu ve #'le yönlendirir) | Çatı katı portfolyosu: raflar, OLED'de süreç, hakkımda, Biggie. "Odaya in" → `oda/`. | Araç ya da ürün yok | `portfolyo/index.html`, `core/cati-*.js`, `docs/katlar.md` |
| `/lab/giris-ab.html` (noindex) | Açılış denemesi | Yok | `lab/giris-ab.html` |
| `/lab/karakter-test.html` (noindex) | Karakter durum makinesi testi; ziyaretçi sayfası değil | Yok | `lab/karakter-test.js`, `scripts/karakter-test.py` |
| `/lab/tanitim/…` (noindex, 13 sayfa) | Tanıtım filmi ve sosyal medya serisinin üretim sayfaları: `index`, `film`, `seri`, `zar`, `stil/` altında 9 | Yok | `lab/tanitim/` |
| `/templates/tool.html` | Araç sayfası şablonu; yayında ama ziyaretçi sayfası değil | Yok | `scripts/sayfalar.py` |
| Dış: oktosworkshop.com ürün sayfaları | Mağaza (ikas) | 5 kart anahtarlık; odadaki `anahtarlik` durağının "Satın al" düğmesi yeni sekmede açar | `core/oda-urunler.js` (`TEMPLATES.anahtarlik[].url`) |

### Oda durakları (orta kat, `lab/oda.html`)

Tur sırası `[genel plan, ...ZONES]`: genel plan durak sayılmaz, 14 durak var. Parantezdeki sayı odadaki şablon sayısı.
Durakta "Bu şablonla tasarla" `tools/<araç>/index.html?sablon=<şablon>` açar; ölçü farkı olan şablonda ölçüler adrese
yazılır (`sablonDegeri`).

| Durak | Sıra | Ne gösteriyor | Bağlandığı araç / ürün | Kaynak (yer · şablon) |
|---|---|---|---|---|
| (genel plan) | 0 | Odanın tamamı; altta "Odana dair her şey", üstte "Çekmece organizeriyle başla" | Yok | `SHOTS.main`, `i18n` `oda.tur.*` |
| `cekmece` | 1 | Çekmeceli dolabın açılan çekmecesinde organizerler (6) | Kutu ve Organizer (`bin`: drawer, tray, p3) | `A.pedestal` · `TEMPLATES.cekmece` |
| `anahtarlik` | 2 | Dolabın üstündeki anahtar tepsisi, halkada kart anahtarlık (5) | Mağaza: kart anahtarlık ürün sayfası ("Satın al") | `A.tepsi` · `TEMPLATES.anahtarlik` |
| `kalemlik` | 3 | Monitörün solunda kalemlik, içinde kalemler (8) | `bin` (pencup, pencup3, tray) | `A.pencup` · `TEMPLATES.kalemlik` |
| `kartvizit` | 4 | Kalemliğin önünde ayaklı kartvizit (4) | 3D QR Kod (`qr`: card) | `A.kartvizit` · `TEMPLATES.kartvizit` |
| `klavye` | 5 | Klavyede tuş başlığı setleri, önünde aynı tasarımın clicker anahtarlığı (4) | Fidget Clicker (`clicker`: tus) | `A.keyboard`, `A.clickers` · `TEMPLATES.klavye` |
| `modem` | 6 | Masanın üstündeki alt rafta modem ve Wi-Fi standı (2) | `qr` (wifi) | `A.modem`, `A.qrHolder` · `TEMPLATES.modem` |
| `cerceve` | 7 | Sol duvarda rölyef çerçeve (3) | Filament Painter (`painter`: cerceve) | `A.frameA` · `TEMPLATES.cerceve` |
| `yapboz` | 8 | Sağ duvarda, buzdolabının üstünde resimli yapboz çerçevesi (1) | Puzzle Maker (`puzzle`: picture) | `A.frameB` · `TEMPLATES.yapboz` |
| `tabela` | 9 | Balkon kapısının üstünde "Oksijen alma alanı" plakası (3) | 3D Yazı (`text`: plaka) | `A.sign` · `TEMPLATES.tabela` |
| `saksilar` | 10 | Pencere kenarlarında saksılar ve çiçekler (7) | Vazo Üreteci (`vase`) | `A.sillL`, `A.sillR` · `TEMPLATES.saksilar` |
| `balkonMasa` | 11 | Balkondaki bistro masada menü standı ve bardak altlığı (2) | `qr` (menu, coaster) | `A.table` · `TEMPLATES.balkonMasa` |
| `miknatis` | 12 | Buzdolabının kapalı kapağında mıknatıslar (3) | `text` (miknatis) | `A.fridge` · `TEMPLATES.miknatis` |
| `buzdolabi` | 13 | Açılan buzdolabının üst rafında pasta süsü (2) | `text` (pasta) | `A.fridge` · `TEMPLATES.buzdolabi` |
| `flip` | 14 | Buzdolabının üstünde Text Flip heykeli (3) | Text Flip (`flip`) | `A.fridge` · `TEMPLATES.flip` |

### Araçların giriş noktaları

Araç sayfalarının yolu hedefte de değişmez; son sütun hedefteki girişi gösterir.

| Araç | Doğrudan yol | Ana sayfa (`/`) | Oda durağı (bugün) | Araçtaki şablon · mod | Hedefte giriş |
|---|---|---|---|---|---|
| Kutu ve Organizer (`bin`) | `tools/bin/` | 1. satır | `cekmece`, `kalemlik` | 20 · custom, grid, plate | `/araclar/`, reklam bağlantısı |
| Vazo Üreteci (`vase`) | `tools/vase/` | 2. satır | `saksilar` | 12 · tek mod | `/araclar/`, reklam bağlantısı |
| Fidget Clicker (`clicker`) | `tools/clicker/` | 3. satır | `klavye` | 8 · anahtarlik, tus | `/araclar/`, reklam bağlantısı |
| 3D Yazı (`text`) | `tools/text/` | 4. satır | `tabela`, `miknatis`, `buzdolabi` | 11 · plaka, masa, pasta, miknatis, anahtarlik | `/araclar/`, reklam bağlantısı |
| Text Flip (`flip`) | `tools/flip/` | 5. satır | `flip` | 4 · tek mod | `/araclar/`, reklam bağlantısı |
| 3D QR Kod (`qr`) | `tools/qr/` | 6. satır | `kartvizit`, `modem`, `balkonMasa` | 10 · stand, card, key, coaster | `/araclar/`, reklam bağlantısı |
| Filament Painter (`painter`) | `tools/painter/` | 7. satır | `cerceve` | 5 · cerceve, isiklik, kartpostal | `/araclar/`, reklam bağlantısı |
| Puzzle Maker (`puzzle`) | `tools/puzzle/` | 8. satır | `yapboz` | 6 · duz, sekil | `/araclar/`, reklam bağlantısı |

### Bugünkü durumda göze çarpanlar

- Orta katta 14 durağın 13'ü araç durağı; satılan ürün yalnız anahtar tepsisinde (`anahtarlik`).
- Odanın metni araç diliyle konuşuyor: `ODA_STORY.lede` "Ürettiğimiz her şey bu odada", tur çağrısı "Çekmece
  organizeriyle başla".
- Artık girdi: `ODA_STORY.hotspots.puzzle3d` ve `TEMPLATES.puzzle3d` (3B yapboz durağı 2026-10-18'de kalktı).
- `docs/oda-sahnesi.md` "Bölgeler ve ürünler" tablosu eski (raflarda 3B yapboz, eski QR yerleri); `docs/katlar.md`
  bodrumu araç katı olarak anlatıyor. İkisi 29–30.10 kararlarıyla güncellenecek.
- Ana sayfadan odaya ve çatıya yol yok; ikisi de `lab/` altında ve noindex.

## Sonra: hedef

### Kat → sayfa

| Kat / alan | Sayfa (yol) | İçerik | Araç / ürün | Giriş noktası |
|---|---|---|---|---|
| Giriş (2B) | `/` | 2B kalır (3B vitrin yok kararı). İki büyük yol: "Oluştur" (araçlar) ve "Hazır ürünler"; altında "Odayı gez" (soru 4) | Yok | Doğrudan adres, arama, sosyal medya profili |
| Araç alanı (2B, sahnesiz) | `/araclar/` (yeni) | 8 aracın listesi: bugün ana sayfadaki liste buraya taşınır, şablon küçük resimleriyle | 8 araç | `/`, üst çubuk, araç sayfasının üst çubuğu |
| Araç alanı (2B, sahnesiz) | `/tools/<id>/` (8 sayfa, yol değişmez) | Şablon → ayar → "Hazır" → fiyat → "Sipariş ver" | Tek araç | `/araclar/`; reklam doğrudan `tools/<id>/index.html?sablon=<şablon>` (tıkla · oluşturmaya başla · sipariş ver) |
| Ürün alanı (2B) | `/urunler/` (yeni) | Satılan ürünlerin listesi: Blender render görseli, ad, grup, durum (satışta / stokta yok / sipariş üzerine), fiyat (soru 3), düğme (soru 2), "Odada gör"; grup sekmeleri | Envanterdeki ürünler (görünürlük soru 1) | `/`, üst çubuk, odadaki yakın plan kartında "Tüm ürünler" |
| Orta kat | `/oda/` (`oda/index.html`; 2026-11-02'de taşındı, `lab/oda.html` yönlendirir) | Fotogerçekçi oda, genel plan ve 7 ürün yuvası (5'i görünür), Biggie; kartta "Ürün sayfası" | Ürün grupları (eşleme tablosu); araç durağı yok | `/` "Odayı gez"; `/urunler/` ve ürün sayfası "Odada gör" (`oda/?odak=<yuva>`); üst çubuk "Oda"; çatıda "Odaya in" |
| Çatı katı | `/portfolyo/` (2026-11-09; `lab/cati.html` yönlendirir) | Portfolyo (kullanıcı kararı: oktos.org = oda + portfolyo + araçlar) | Yok | Üst çubuk "Portfolyo" |
| Bodrum | Yok | Askıda. Araçlar bodrum yerine `/araclar/` alanına çıktı; atölye sahnesi sonraki bir karar | Yok | Yok |

Bütün 2B sayfalarda aynı üst çubuk: Oluştur · Ürünler · Oda · Portfolyo (TR/EN). Araç sayfalarına bağlantı `templates/tool.html`
üzerinden girer (elle yazılmaz).

### Oda durakları: karar

Her ürün yuvası bugünkü anahtar tepsisinin kalıbını kullanır: yuvadaki seçici (‹ ad n/N ›) gruptaki ürünleri dolaşır,
karttaki düğme ürünün durumuna göre değişir (soru 2). Kalkan duraklarda nesne tıklanamaz dekor olarak kalabilir
(işaretçi, kart ve seçici yok); kalıp kalmayacağı C5'te kareye bakılarak seçilir. Yeni kimlikler öneridir; bugünkü
kadrajlar (`FOCUS`) eski kimlikten taşınır.

| Durak (bugün) | Araç | Karar | Yeni yuva · ürün | Gerekçe |
|---|---|---|---|---|
| `cekmece` | `bin` | Ürün yuvasına döner | `sticker` · çekmecede sticker'lar | Düz ürün yukarıdan iyi okunur; çekmecenin açılışı ve kadrajı hazır; tur yine buradan başlar |
| `anahtarlik` | mağaza | Kalır | `anahtarlik` · 5 kart anahtarlık | Bugün satışta; "Satın al" mağaza sayfasını açıyor |
| `kalemlik` | `bin` | Ürün yuvasına döner | `figur` · minifigürler ve TCG kutusu | Masa üstü, göz hizası; küçük ürün için yakın kadraj hazır |
| `kartvizit` | `qr` | Kalkar | Yok | Sipariş üzerine tasarlanan araç çıktısı, stoktaki ürün değil |
| `klavye` | `clicker` | Kalkar | Yok | Araç çıktısı; klavye dekor olarak kalır |
| `modem` | `qr` | Ürün yuvasına döner | `raf` · diorama plakaları ve figürlü dioramalar | 29.10 kararı: plakalar orta kattaki rafa; raf masanın üstünde, kadrajı hazır |
| `cerceve` | `painter` | Ürün yuvasına döner | `kilic` · katlanır katana, duvar askısında | Duvarda asılı uzun ürün için tek geniş yer |
| `yapboz` | `puzzle` | Ürün yuvasına döner | `maske` · Skeleton Mask, duvarda | Satışta; duvarda asılı durması doğal |
| `tabela` | `text` | Kalkar | Yok | Araç çıktısı |
| `saksilar` | `vase` | Ürün yuvasına döner | `biblo` · balbal biblolar, pencere kenarında | Işıklı pervaz heykele uygun; saksılar dekor kalır |
| `balkonMasa` | `qr` | Kalkar | Yok | Araç çıktısı; çay takımı dekor kalır |
| `miknatis` | `text` | Kalkar | Yok | Araç çıktısı |
| `buzdolabi` | `text` | Kalkar | Yok | Araç çıktısı (pasta süsü) |
| `flip` | `flip` | Kalkar | Yok | Araç çıktısı |

Sonuç: 14 durak → 7 ürün yuvası. Orta katta araç durağı 13 → 0.

### Ürün → yuva eşlemesi

Kaynak: depo dışındaki ürün envanteri (2026-11-01, 78 ürün, 6 grup). "Satışta" mağazada sepete eklenebilir demek;
"sayfa yok" mağazada ürün sayfası yok demek. Envanterin kaynak ve not sütunları depoya girmez (yerel yol, iç not).

| Grup (tür) | Ürün | Satışta / stok yok / sayfa yok | Mağaza sayfası | Orta kattaki yer | 2B listede | Telif notu |
|---|---|---|---|---|---|---|
| `plaka-oyun` | 6 sticker diorama: Pokémon Karagöz, Doom 1993, Mortal Kombat The Pit, Super Mario 1-1, Duck Hunt, Undertale | 0 / 0 / 6 | Yok | Raf (`raf`) | Evet, görünürlük soru 1 | **Var:** Yüksek 3, Orta 3 |
| `plaka-anime` | 4 sticker diorama: Itachi'nin Tahtı, Iroh'un Ağıdı, Rock Lee ve Gaara, Kara Sakal | 0 / 0 / 4 | Yok | Raf (`raf`) | Evet, görünürlük soru 1 | **Var:** Yüksek 3, Orta 1 |
| `plaka-pokemon` | 14 Pokémon evrim plakası (8 üçlü, 5 ikili, 1 Eevee sekizli) | 0 / 0 / 14 | Yok | Raf (`raf`); sığmazsa soru 5 | Evet, görünürlük soru 1 | Notta yok; içerik Pokémon karakterleri |
| `anahtarlık` | 5 kart anahtarlık: Charizard, Black Lotus, Venusaur, Blastoise, Dark Magician (109–149 TL) | 5 / 0 / 0 | 5 | Anahtar tepsisi (`anahtarlik`, değişmez) | Evet | Notta yok; kart yüzleri lisanslı oyun kartları |
| `sticker` | 37 sticker: 21 afiş, 16 chibi | 0 / 0 / 37 | Yok | Çekmece (`sticker`) | Evet, görünürlük soru 1 | Notta yok; çoğunda lisanslı karakter (Pokémon, One Piece, Adventure Time vb.) |
| `diğer` | 12 ürün, alt kırılım aşağıda | 4 / 5 / 3 | 9 | Birden çok yuva (aşağıda) | Evet, görünürlük soru 1 | **Var:** 3 figürlü diorama Yüksek |

`diğer` grubunun alt kırılımı:

| Alt grup | Ürün | Durum | Orta kattaki yer |
|---|---|---|---|
| Figürlü diorama | 3: Hezarfen Squirtle, Kaplumbağa Terbiyecisi, One Piece | Sayfa yok; telif Yüksek | Raf (`raf`) |
| Minifigür | 3 Grimdark Evrenleri: Magnum Tanks, Ultra Ön-Cepheciler, Imperium Clankers (149–249 TL) | Satışta | Masa üstü (`figur`) |
| Biblo (balbal) | 3: Akademi Atlısı, Kadere Kınalı, Kapital Kağan (699–799 TL) | Stok yok | Pencere kenarı (`biblo`) |
| Katana | 1: Katlanır Katana Kılıç Sebat (599 TL) | Stok yok | Sol duvar (`kilic`) |
| Kart kutusu | 1: Pokemon TCG Mini Saklama Kutusu (299 TL) | Stok yok; adında marka | Masa üstü (`figur`) |
| Maske | 1: Skeleton Mask, Tertip / Tedbir (799 TL) | Satışta | Sağ duvar (`maske`) |

Telif özeti: notunda telif riski yazan 13 ürün var: Yüksek 9 (plaka-oyun 3, plaka-anime 3, figürlü diorama 3), Orta 4
(plaka-oyun 3, plaka-anime 1). Notunda yazmayan ama başkasının karakterini ya da markasını taşıyanlar: plaka-pokemon,
sticker'ların çoğu, kart anahtarlıklar, TCG kutusu. Sitede gösterim kararı kullanıcıda (soru 1).

Envanterde olmayan: ürün sunumu planında ilk aile sayılan Türk temalı diorama plakaları (Tepegöz, Dede Korkut,
Yerebatan). Envantere girerse bu tabloya satır olarak, odada `raf` yuvasına girer.

### Ölçüm: önce → sonra

| Ölçü | Önce | Sonra |
|---|---|---|
| Oda durağı | 14 | 7 |
| Orta katta araç durağı | 13 | 0 |
| Orta katta satılan ürün yuvası | 1 | 7 |
| Araçlara 2B giriş | `/` listesi | `/araclar/` (+ `/`'den yol) |
| Ürün listesi sayfası | Yok | `/urunler/` |
| Eşlenen envanter grubu | 0 / 6 | 6 / 6 (78 ürün) |

## Sorular (2026-11-01: varsayılanlar seçildi, geri alınabilir)

Kullanıcı yokken beş sorunun varsayılanı seçildi; kullanıcı onayı bekliyor. Seçimler ve iki koşul:

- Soru 1: yalnız mağazada sayfası olan 14 ürün. Bu 14 ürünün hiçbiri plaka ya da sticker değil; ilk yayında `raf` ve
  `sticker` yuvaları gizli kalır (boş raf gösterilmez). Plakaların rafta olması kararıyla çelişir; plaka grubu
  açıldığında raf gelir.
- Soru 2: satışta "Satın al", ötekiler "Sipariş ver".
- Soru 3: yalnız mağaza fiyatı. Koşul: `?atolye=1` gizlemez, yalnız göstermez; depo herkese açık olduğu için önerilen
  fiyat ve maliyet depoya girmez, yerelde kalır.
- Soru 4: `/` 2B giriş.
- Soru 5: rafta seçici; ikinci raf yok. Plaka grubu açılana kadar geçersiz.

Soruların ilk hâli:

1. **Hangi ürünler sitede görünsün?** · Neden: repo ve site herkese açık; 64 ürünün mağazada sayfası yok ve bunların
   çoğu notunda telif riski taşıyor ya da başkasının karakterini içeriyor. · Varsayılan: ilk yayında yalnız bugün
   oktosworkshop.com'da yayında olan 14 ürün (satışta 9, stok yok 5) görünür; kalan 64 ürün veride `goster: false` ile
   durur, ne rafta ne listede görünür; senin onayınla grup grup açılır.
2. **Mağaza sayfası olmayan ya da stokta olmayan ürünün düğmesi ne olsun?** · Neden: ziyaretçinin satın alma yolu ve
   ticari model (yerel sipariş) buna bağlı. · Varsayılan: satışta → "Satın al" (mağaza sayfası, yeni sekme; bugünkü
   tepsi davranışı); stok yok → "Sipariş ver" (WhatsApp hazır mesajı, `core/order-config.js`); sayfa yok → "Sipariş ver".
3. **Fiyat kime görünsün?** · Neden: 30.10 kararı maliyeti dilimleyiciden "önerilen" olarak gösterir; yanlış fiyat
   müşteriye gitmemeli. · Varsayılan: mağaza fiyatı olan 14 üründe mağaza fiyatı (fiyatın tek yeri mağaza); olmayanlarda
   sitede fiyat yok, "Sipariş ver"; önerilen fiyat yalnız atölye görünümünde (`?atolye=1`), onaylarsan mağazaya girer.
4. **Ana sayfa (`/`) ne açsın, yol adları uygun mu?** · Neden: reklam ve arama trafiği ilk buraya gelir; C1'in açık
   sorusu. · Varsayılan: `/` 2B giriş: "Oluştur" (`/araclar/`) ve "Hazır ürünler" (`/urunler/`) iki büyük yol, altında
   "Odayı gez" (`/oda/`); araç sayfaları `tools/<id>/`'de kalır ki reklam bağlantıları kırılmasın.
5. **Plakaların tamamı rafa sığmazsa ne olsun?** · Neden: rafa girecek 27 diorama var (24 plaka ürünü + 3 figürlü);
   bugünkü raf iki kat, 1000 mm; plaka ölçüleri envanterde yok. Blender işi ve sahne yükü ürün sayısıyla büyür.
   · Varsayılan: `raf` yuvası gruptaki ürünleri seçiciyle dolaştırır, rafta aynı anda sığdığı kadarı görünür; hepsi 2B
   listede. Sığmazsa sol duvara ikinci bir raf ünitesi (`kilic` yuvasının yanına) Blender'da eklenir.

## Sıradaki adımlar (C5: araçlar orta kattan çıkar, yerine satılan ürünler)

1. **Ürün verisi:** `scripts/urun-veri.py` (yeni): envanter dosyasının yolu argümanla verilir, `core/urun-veri.js`
   yazar (kimlik, ad, grup, durum, mağaza yolu, mağaza fiyatı, `goster`, görsel yolu). Kaynak ve not sütunları atılır;
   `--dry-run` var, tekrar çalıştırmak güvenli. Oda yuvaları ve `/urunler/` aynı veriyi okur.
2. **Oda verisi ve sahne:** `core/oda-yerler.js` (`ZONES` 14 → 7, `tool` yerine ürün grubu; `FOCUS` yeni kimliklere),
   `core/oda-urunler.js` (`TEMPLATES` yuva başına ürün listesi, anahtarlık kalıbıyla; `puzzle3d` silinir),
   `core/oda-sahne.js` (hotspot listesi), `core/story-data.js` (`ODA_STORY`) ve `core/i18n.js` (`oda.tur.basla`,
   `oda.next`), `core/oda-karakter.js` (`AYAR.donDurak`: `kalemlik`, `kartvizit`, `klavye` anahtarları), `lab/oda.html`
   (`onPick` araç yerine ürün düğmesi, demo durak listesi). Ardından `python scripts/karakter-test.py`.
3. **Blender:** `scripts/oda-blender.py` yeni yuvaların boş nesneleri (raf, çekmece, duvar, pervaz); plakalar ve ürünler
   için render betiği `scripts/urun-render.py` (yeni): önce 360p önizleme, onaydan sonra GPU final; çıktı
   `assets/urunler/`, lisans ve kaynak kaydıyla.
4. **2B sayfalar:** `urunler/index.html` (yeni; `core/urun-veri.js`'ten kart ızgarası, grup sekmeleri, soru 2–3'teki
   düğme ve fiyat kuralı), `araclar/index.html` (yeni; bugün `index.html`'deki araç listesi, `STORIES` tek kaynak),
   `index.html` giriş; üst çubuk `templates/tool.html` → `python scripts/sayfalar.py --dry-run`, sonra çalıştır.
5. **Doğrulama:** 8 araç sayfası `?sablon=` ile açılıyor; `ZONES`'ta araç alanı kalmadı (araç durağı 0); her ürün
   düğmesi doğru adresi açıyor; `python scripts/sayfa-cek.py` ile masaüstü ve telefon karesi; `docs/katlar.md` ve
   `docs/oda-sahnesi.md` yeni duruma göre güncellenir.
