// Çatı katı (portfolyo) metni ve içerik listesi. Kaynak: kullanıcının bitirme projesi sunumu (slayt metinleri), ürün
// inceleme paketleri ve ürün görsellerindeki yazılar; uydurma olgu yok. Görseller assets/cati/portfolyo/ altında
// (sunumdan ve ürün master karelerinden, yalnız kullanıcının kendi işleri). Ses: portfolyo birinci tekil ("ben"),
// ziyaretçiye "sen" (aşağıdaki oda "biz/atölye" sesinde). Biçim motorun beklediği gibi (core/story-data.js zone).
const zone = (tr, en, dtr, den, pin = null) => ({ tr, en, desc: { tr: dtr, en: den }, ...(pin ? { pin: { tr: pin[0], en: pin[1] } } : {}) });
const PORT = '../assets/cati/portfolyo/';

export const CATI_STORY = {
  live: true,
  href: 'index.html',
  name: { tr: 'Çatı katı', en: 'Top floor' },
  title: { tr: 'Modelden döküme, elimden çıkanlar.', en: 'My work, from model to cast.' },
  lede: {
    tr: 'Burası atölyenin çatı katı, benim köşem. Bir işe tıkla, nasıl yapıldığına yakından bak.',
    en: "This is the workshop's top floor, my own corner. Click a piece to see how it was made.",
  },
  hotspots: {
    teras: zone('Çatı katı', 'Upstairs', 'Burası benim köşem. Yaptığım işler, nasıl yaptığım, kim olduğum.',
      "My corner of the workshop: the work, how it's made, and who makes it.", ['Çatı', 'Upstairs']),
    eserler: zone('Modern Balbal', 'Modern Balbal', 'Her biri bir karakter. Taş tozuyla döker, elle bitiririm.',
      'Each one a character, cast in stone dust and finished by hand.', ['Balballar', 'Balbals']),
    galeri: zone('Diğer işler', 'Other work', 'Döküm, reçine, FDM: atölyeden çıkan başka işler.',
      'Casting, resin, FDM: more from the workshop.', ['Galeri', 'Gallery']),
    surec: zone('Süreç', 'Process', 'Dijital modelden döküme sekiz adım.', 'Eight steps from digital model to cast.', ['Süreç', 'Process']),
    hakkimda: zone('Hakkımda', 'About me', 'Kimim, ne yapıyorum, nasıl çalışıyorum.', 'Who I am, what I make, how I work.', ['Hakkımda', 'About']),
    biggie: zone('Biggie', 'Biggie', "Atölyenin maskotu bizzikoloşko, kısaca Biggie. Blender'da yeniden kuruldu; kilden elle yapılmış gibi duruyor.",
      'The workshop mascot, bizzikoloşko, or Biggie for short. Rebuilt in Blender, it looks like a little clay figure made by hand.', ['Biggie', 'Biggie']),
  },
};

export const SAYFA = {
  yukleniyor: { tr: 'Çatı katı hazırlanıyor', en: 'Setting up the top floor' },
  asagiKat: { tr: 'Odaya in', en: 'Down to the room' },
  liste: { tr: 'Listeyi göster', en: 'Show the list' },
  listeKapat: { tr: 'Kapat', en: 'Close' },
  listeBaslik: { tr: 'Çatı katında neler var', en: "What's on the top floor" },
  oynat: { tr: 'Kaydı oynat', en: 'Play the clip' },
  magaza: { tr: 'Mağazada gör', en: 'See in the shop' },
  ileri: { tr: 'Sıradaki', en: 'Next' },
};

// Modern Balbal serisi: üçü kaidede 3B model (scripts/portfolyo-model.py ile STL'den), Kapital Kağan'ın modeli yok
// (fotoğrafla). gorsel: ürün master karesi (yazısız).
export const ESERLER = [
  { id: 'kapital-kagan', model: null, gorsel: PORT + 'is-kapital-kagan.webp', detay: PORT + 'is-kapital-kagan-detay.webp',
    ad: { tr: 'Kapital Kağan', en: 'Kapital Kaghan' },
    desc: { tr: 'Gücü ve otoriteyi tek bir büste sığdırır.', en: 'Power and authority, compressed into a single bust.' },
    olcu: { tr: '18 cm · Ø 10 cm · 1,2 kg · taş tozu döküm, elle bitirme', en: '18 cm · Ø 10 cm · 1.2 kg · stone-dust cast, hand finished' } },
  { id: 'kadere-kinali', model: '../assets/cati/modeller/kadere-kinali.glb', ton: 0xe6cbbb, gorsel: PORT + 'is-kadere-kinali.webp', detay: PORT + 'is-kadere-kinali-detay.webp',
    ad: { tr: 'Kadere Kınalı', en: 'Kadere Kınalı' },
    desc: { tr: 'Erini cenge, yüreğini yangına süren; lakin kararsızlığa düşmeyip ruhunu ezeli bir sadakatle kendi kaderine kınalayan o taştan duruş.',
      en: 'Warriors sent to battle, a heart thrown into the fire, and no wavering: a stance of stone, its soul pledged to its own fate with age-old loyalty.' },
    olcu: { tr: '18 cm · Ø 10 cm · 1,3 kg · taş tozu döküm, elle bitirme', en: '18 cm · Ø 10 cm · 1.3 kg · stone-dust cast, hand finished' } },
  { id: 'akademi-atlisi', model: '../assets/cati/modeller/akademi-atlisi.glb', ton: 0xc9bfb8, gorsel: PORT + 'is-akademi-atlisi.webp', detay: PORT + 'is-akademi-atlisi-detay.webp',
    ad: { tr: 'Akademi Atlısı', en: 'Academy Rider' },
    desc: { tr: 'Bütün hayatını aile baskısıyla yarış atı gibi geçirdi.', en: 'A whole life spent like a racehorse, driven by family pressure.' },
    olcu: { tr: '18 cm · Ø 10 cm · 1,3 kg · taş tozu döküm, elle bitirme', en: '18 cm · Ø 10 cm · 1.3 kg · stone-dust cast, hand finished' } },
  { id: 'oguz-kagan', model: '../assets/cati/modeller/oguz-kagan.glb', ton: 0xd9d5cd, gorsel: null, detay: null,
    ad: { tr: 'Oğuz Kağan', en: 'Oghuz Kaghan' },
    desc: { tr: 'Serinin dördüncü karakteri. Taş tozu döküm, elle bitirme.', en: 'The fourth character in the series. Stone-dust cast, hand finished.' },
    olcu: null },
];

export const GALERI = [
  { id: 'balbal-ikili', gorsel: PORT + 'is-balbal-ikili.webp', baslik: { tr: 'İkili balbal', en: 'Balbal pair' },
    desc: { tr: 'Atölyede dökülmüş ikili balbal heykeli.', en: 'A paired balbal sculpture, cast in the workshop.' } },
  { id: 'dokum-cift', gorsel: PORT + 'is-dokum-cift.webp', baslik: { tr: 'Döküm çift', en: 'Cast pair' },
    desc: { tr: 'Biri bıyıklı, biri başörtülü: iki döküm heykel.', en: 'One with a moustache, one in a headscarf: two cast sculptures.' } },
  { id: 'saksilar', gorsel: PORT + 'is-saksilar.webp', baslik: { tr: 'Saksılar', en: 'Planters' },
    desc: { tr: 'FDM yazıcıda PLA ya da PETG ile basılmış saksılar.', en: 'Planters printed in PLA or PETG on the FDM printer.' } },
  { id: 'recine-zarlar', gorsel: PORT + 'is-recine-zarlar.webp', baslik: { tr: 'Reçine zarlar', en: 'Resin dice' },
    desc: { tr: 'Şeffaf reçineden dökülmüş zarlar.', en: 'Dice cast in clear resin.' } },
  { id: 'satranc', gorsel: PORT + 'is-satranc.webp', baslik: { tr: 'Satranç takımı', en: 'Chess set' },
    desc: { tr: '3B yazıcıda basılmış bir satranç takımı.', en: 'A 3D-printed chess set.' } },
];

const surec = (id, tr, en, dtr, den) => ({ id, kayit: `${PORT}surec-${id}.webp`, poster: `${PORT}surec-${id}-poster.webp`, ad: { tr, en }, desc: { tr: dtr, en: den } });
export const SUREC = [
  surec('01-modelleme', 'Sayısal modelleme', 'Digital modelling', "Biçimi sayısal heykel ve CAD ile kurar, dilimleyip G-code'a çeviririm.", 'I shape the form with digital sculpting and CAD, then slice it into G-code.'),
  surec('02-fdm', 'FDM baskı', 'FDM printing', 'PLA ve PETG ile basarım: prototip, kalıp kutusu, saksı.', 'PLA and PETG on the FDM printer: prototypes, mould boxes, planters.'),
  surec('03-uv-kur', 'Reçine baskı, UV kür', 'Resin printing, UV cure', 'Hassas ana modeli reçinede basar, desteklerini temizleyip UV ışıkta kürlerim.', 'I print fine master models in resin, strip the supports and cure them under UV.'),
  surec('04-gravur', 'Gravür, son işlem', 'Engraving and finishing', 'Yüzeyi gravürle işler, ana modeli kalıba hazırlarım.', 'I work the surface with an engraving tool and get the master ready for moulding.'),
  surec('05-kalip-kutusu', 'Kalıp kutusu', 'Mould box', "Ana modeli, FDM'de bastığım bir kalıp kutusunun içine yerleştiririm.", 'I set the master inside a mould box printed on the FDM printer.'),
  surec('06-silikon', 'RTV-2 silikon', 'RTV-2 silicone', 'İki bileşeni tartıp karıştırır, ana modelin üstüne dökerim: esnek, tekrar kullanılabilen bir kalıp çıkar.', 'I weigh and mix the two parts and pour them over the master, for a flexible mould that can be used again and again.'),
  surec('07-dokum', 'Döküm', 'Casting', 'Kalıba harç, alçı, reçine ya da taş tozu karışımı dökerim; taş görünümlü heykel de şeffaf parça da buradan çıkar.', 'I pour mortar, plaster, resin or a stone-dust mix into the mould: stone-look sculptures and clear pieces both start here.'),
  surec('08-ayni-kaliptan', 'Aynı kalıptan', 'Same mould, same form', 'Bir kalıp, aynı geometriyi tekrar tekrar verir.', 'One mould gives the same geometry, cast after cast.'),
];

export const HAKKIMDA = {
  tr: [
    "Ben İbrahim Arda Bişgin, Ankara'dayım. Eğitimim inşaat mühendisliği (AYBÜ) ve coğrafi bilgi sistemleri (AÖF) üzerine.",
    'Oktos Workshop, 3B tasarım, baskı ve kalıplama üzerine yürüttüğüm atölye. FDM ve reçine yazıcıda basıyor, RTV-2 silikonla kalıp alıyor, epoksi ve taş tozuyla döküyorum.',
    "Modelleri Blender ve Rhino'da kuruyor, Godot'ta da çalışıyorum. Hattım dijital modelden başlar, baskı ve kalıptan geçip dökümle biter. Şu an üzerinde çalıştığım bitirme projesi, bu bilgiyi 3B baskı kalıplarda dökülen çimento esaslı numunelere taşıyor.",
  ],
  en: [
    "I'm İbrahim Arda Bişgin, based in Ankara. My background is in civil engineering (AYBÜ) and GIS (AÖF).",
    'Oktos Workshop is where I do 3D design, printing and mould-making. I print on FDM and resin machines, make RTV-2 silicone moulds, and cast with epoxy and stone dust.',
    'I model in Blender and Rhino, and work in Godot too. My process starts with a digital model, goes through printing and moulding, and ends with a cast. Right now my graduation project carries this into the lab: cement-based specimens cast in 3D-printed moulds.',
  ],
};
