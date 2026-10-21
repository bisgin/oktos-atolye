# Katlar: çatı katı, oda, bodrum

Kullanıcı kararı (2026-10-21): site üç katlı bir bina olarak kurulur.

| Kat | Ne | Durum |
|---|---|---|
| Gökyüzü + çatı katı | Kullanıcıyı gökyüzü karşılar, aşağı kaydırınca çatı terası: kullanıcının **portfolyosu** (işler, süreç, hakkımda), Biggie | `lab/cati.html` (ilk sürüm, 2026-10-21) |
| Orta kat | Mevcut oda (`lab/oda.html`): yalnız şu an satılan ürünlerin (anahtarlık vb.) odası olacak | Bugünkü hâliyle; araçlar ileride bodruma taşınır |
| Bodrum | Depo gibi bir 3B atölye: çalışan SLA ve FDM yazıcılar, **araçlar** (hizmet) burada | Sırada (gri kutu, odayla yan yana) |

**Temel ilke:** Biggie her zaman kullanıcının bulunduğu kata gelir. Aşağı kaydırınca iner, yukarı kaydırınca çıkar:
merdivenle, iple ya da yeni hareketlerle (robot süpürgenin üstünde, havada sendeleyerek). Hızla birkaç kat atlanırsa
Biggie doğrudan hedef kata gider (planlanan; henüz yok).

## Çatı katı (ilk sürüm)

- Sahne `core/cati-sahne.js` (motor `core/story.js`, oda ile aynı sahne sözleşmesi), metin ve içerik `core/cati-veri.js`,
  kart içeriği, ışık kutusu ve düz liste `core/cati-panel.js`, görünüm `core/cati.css`, sayfa `lab/cati.html`.
- **Işık canlı** (pişirme yok, Blender gerekmez): güneş `core/oda-olcu.js` SUN ile aynı (odanın sabahı), gölgeli tek
  ışık; ortam ışığı gökyüzünün küçük panoramasından (`assets/cati/ortam.webp`). Kare başına ~60–100 çizim, ≤260 bin
  üçgen (oda ~830 çizim).
- **Gökyüzü** odanın penceresindeki gökle aynı (Poly Haven 'balcony', CC0): `assets/cati/gok.webp` 6°–90° bandı. Fotoğrafın
  alt kısmındaki ev, şemsiye ve serviler bir dilimde (u 0,44–0,86); o dilim sahnede güneyde ve batıda terastan 12 m
  yükselen komşu blokun arkasında kalır. Güneş kuzey-kuzeydoğudan (az 25°, 42°) geldiği için blok terası gölgelemez;
  gökyüzündeki fotoğraf güneşi de blokun arkasında kalır, sahnenin güneşine hafif bir parlama eklenir (gölgelendirici).
  Dilim dışındaki ince engeller içten dolduruldu, ufkun altı (19° altı) şehir pusuna çevrildi; uzakta pus içinde
  boyanmış bir silüet kartı (bloklar, minare).
- **Teras** (7,2 × 5,2 m, karo, parapet 1,05 m): merdiven kovası (kapısı güneye), üstünde su deposu, güneş kolektörü,
  TV anteni. Portfolyo: sergi masasında Modern Balbal heykelleri (Kadere Kınalı, Akademi Atlısı, Oğuz Kağan; STL'den
  `scripts/portfolyo-model.py`), çamaşır ipinde mandallı baskılar (galeri), kovanın duvarında 8 adımlık süreç panosu,
  şövalede kara tahta (hakkımda), Biggie ve robotu (Biggie'ye yakın planda yeniden tıklamak bir dans oynatır).
- **Tur:** gökyüzü → teras → eserler → galeri → süreç → hakkımda → Biggie. Kart içeriği kart açılınca iner; süreç
  kayıtları (animasyonlu WebP) ışık kutusunda oynar. "Listeyi göster" bütün metni düz liste olarak verir; sağ altta
  "Odaya in" düğmesi odaya (`lab/oda.html`) götürür (şimdilik ayrı sayfa).
- **Metin** yalnız kullanıcının bitirme projesi sunumundan, ürün inceleme paketlerinden ve ürün görsellerindeki
  yazılardan (uydurma yok). Biggie için "sculpt" denmez ("kil gibi duruyor").
- **Portfolyoya girmeyenler** (kullanıcı kararına kadar): Warhammer tarzı minyatürler (kırmızı liste), kaynağı belirsiz
  ejderha, köpekbalığı, şeffaf figürler, kafatası maske (satın alınmış STL olabilir).

## Sıradaki aşamalar (plan: çatı katı iş akışı, 2026-10-21)

1. Telefonda dene: çatı ↔ oda geçişi (ayrı sayfa mı, tek sayfada iki sahne mi) ölçümle seçilir.
2. Robot uçuşu odada: üçüncü iniş aracı (`core/oda-karakter.js` inisKur kalıbı; hava dinamiği yayla).
3. Motor ve kat yöneticisi: `story.js` çoklu örnek düzeltmeleri, kat geçişi, Biggie'nin kat kat gelişi.
4. Bodrum atölyesi (araçlar), sonra orta katın mağazaya dönüşümü.
