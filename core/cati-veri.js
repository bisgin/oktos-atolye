// Çatı katı (portfolyo) metni ve içerik listesi. Kaynak: kullanıcının bitirme projesi sunumu (slayt metinleri), ürün
// inceleme paketleri, ürün görsellerindeki yazılar ve kullanıcının çatı katı geri bildirimi (2026-10-22: raflarda tasarım
// çalışmaları ve kutu oyunları, ekranda süreç); uydurma olgu yok. Görseller assets/cati/portfolyo/ altında (yalnız
// kullanıcının kendi işleri). Ses: portfolyo birinci tekil ("ben"), ziyaretçiye "sen" (aşağıdaki oda "biz/atölye" sesinde). Biçim
// motorun beklediği gibi (core/story-data.js zone).
import { ORDER } from './order-config.js';

const zone = (tr, en, dtr, den, pin = null) => ({ tr, en, desc: { tr: dtr, en: den }, ...(pin ? { pin: { tr: pin[0], en: pin[1] } } : {}) });
const PORT = '../assets/cati/portfolyo/';

// Modern Balbal serisi (heykel modelleri assets/cati/modeller/: kitaplığın raflarında büst olarak durur).
// gorsel: ürün master karesi (yazısız); kitaplık kartında.
export const ESERLER = [
  { id: 'kapital-kagan', model: null, gorsel: PORT + 'is-kapital-kagan.webp', detay: PORT + 'is-kapital-kagan-detay.webp',
    ad: { tr: 'Kapital Kağan', en: 'Kapital Kaghan' },
    desc: { tr: 'Gücü ve otoriteyi tek bir büste sığdırır.', en: 'Power and authority, compressed into a single bust.' },
    olcu: { tr: '18 cm · Ø 10 cm · 1,2 kg · taş tozu döküm, elle bitirme', en: '18 cm · Ø 10 cm · 1.2 kg · stone-dust cast, hand finished' } },
  { id: 'kadere-kinali', model: '../assets/cati/modeller/kadere-kinali.glb', ton: 0xe6cbbb, gorsel: PORT + 'is-kadere-kinali.webp', detay: PORT + 'is-kadere-kinali-detay.webp',
    ad: { tr: 'Kadere Kınalı', en: 'Kadere Kınalı' },
    desc: { tr: 'Erini cenge, yüreğini yangına süren; lakin kararsızlığa düşmeyip ruhunu ezelî bir sadakatle kendi kaderine kınalayan o taştan duruş…',
      en: 'She sent her man to battle and her heart into the fire, yet never wavered: a stance of stone that hennaed its soul to its own fate, with timeless loyalty.' },
    olcu: { tr: '18 cm · Ø 10 cm · 1,3 kg · taş tozu döküm, elle bitirme', en: '18 cm · Ø 10 cm · 1.3 kg · stone-dust cast, hand finished' } },
  { id: 'akademi-atlisi', model: '../assets/cati/modeller/akademi-atlisi.glb', ton: 0xc9bfb8, gorsel: PORT + 'is-akademi-atlisi.webp', detay: PORT + 'is-akademi-atlisi-detay.webp',
    ad: { tr: 'Akademi Atlısı', en: 'Academy Rider' },
    desc: { tr: 'Bütün hayatını aile baskısıyla yarış atı gibi geçirdi.', en: 'A whole life spent like a racehorse, driven by family pressure.' },
    olcu: { tr: '18 cm · Ø 10 cm · 1,3 kg · taş tozu döküm, elle bitirme', en: '18 cm · Ø 10 cm · 1.3 kg · stone-dust cast, hand finished' } },
  { id: 'oguz-kagan', model: '../assets/cati/modeller/oguz-kagan.glb', ton: 0xd9d5cd, gorsel: null, detay: null,
    ad: { tr: 'Oğuz Kağan', en: 'Oghuz Kaghan' },
    desc: { tr: 'Serinin bir başka karakteri.', en: 'Another character from the series.' },
    olcu: null },
];

// Atölyeden çıkan diğer işler (fotoğraf); kitaplık kartında
export const GALERI = [
  { id: 'dokum-cift', gorsel: PORT + 'is-dokum-cift.webp', baslik: { tr: 'Kapital Kağan ve Kadere Kınalı', en: 'Kapital Kaghan and Kadere Kınalı' },
    desc: { tr: 'Serinin iki karakteri yan yana.', en: 'Two characters from the series, side by side.' } },
  { id: 'saksilar', gorsel: PORT + 'is-saksilar.webp', baslik: { tr: 'Saksılar', en: 'Planters' },
    desc: { tr: 'FDM yazıcıda PLA ya da PETG ile basılmış saksılar.', en: 'Planters printed in PLA or PETG on the FDM printer.' } },
  { id: 'recine-zarlar', gorsel: PORT + 'is-recine-zarlar.webp', baslik: { tr: 'Reçine zarlar', en: 'Resin dice' },
    desc: { tr: 'Şeffaf reçineden dökülmüş zarlar.', en: 'Dice cast in clear resin.' } },
  { id: 'satranc', gorsel: PORT + 'is-satranc.webp', baslik: { tr: 'Satranç takımı', en: 'Chess set' },
    desc: { tr: '3B yazıcıda basılmış bir satranç takımı.', en: 'A 3D-printed chess set.' } },
];
const eser = (e) => ({ gorsel: e.gorsel, baslik: e.ad, desc: { tr: [e.desc.tr, e.olcu?.tr].filter(Boolean).join(' · '), en: [e.desc.en, e.olcu?.en].filter(Boolean).join(' · ') } });
// Kitaplıktaki tasarım çalışmaları (kartta fotoğraflar; raflarda büstler, vazolar ve oyun kutuları durur)
export const RAF_ISLERI = [...ESERLER.filter((e) => e.gorsel).map(eser), ...GALERI];

export const CATI_STORY = {
  live: true,
  href: 'index.html',
  name: { tr: 'Çatı katı', en: 'Top floor' },
  title: { tr: '3B bir fikrin var mı? Gerçeğe dönüştürelim.', en: 'Got an idea in 3D? Let’s make it real.' },
  lede: {
    tr: 'Burası atölyenin çatı katı, benim köşem. Ekranda süreci adım adım izle, raflarda şimdiye kadarki işlerime bak.',
    en: "This is the workshop's top floor, my own corner. Follow the process step by step on the screen, and look over my work so far on the shelves.",
  },
  hotspots: {
    ekran: zone('Süreç', 'Process', 'Dijital modelden döküme sekiz adım. Ekrana tıkla: sıradaki adım.', 'Eight steps from digital model to cast. Click the screen for the next step.', ['Süreç', 'Process']),
    kitaplik: zone('Raflar', 'Shelves', 'Şimdiye kadarki tasarım çalışmalarım ve kutu oyunları: Modern Balbal serisinin büstleri, vazolar, oyun kutuları.',
      'My design work so far, and board games: busts from the Modern Balbal series, vases, game boxes.', ['Raflar', 'Shelves']),
    biggie: zone('Biggie', 'Biggie', "Atölyenin maskotu bizzikoloşko, kısaca Biggie. Blender'da yeniden kuruldu; kilden elle yapılmış gibi duruyor.",
      'The workshop mascot, bizzikoloşko, or Biggie for short. Rebuilt in Blender, it looks like a little clay figure made by hand.', ['Biggie', 'Biggie']),
    hakkimda: zone('Hakkımda', 'About me', 'Kimim, ne yapıyorum, nasıl çalışıyorum.', 'Who I am, what I make, how I work.', ['Hakkımda', 'About']),
  },
};

export const SAYFA = {
  yukleniyor: { tr: 'Çatı katı hazırlanıyor', en: 'Setting up the top floor' },
  asagiKat: { tr: 'Odaya in', en: 'Down to the room' },
  liste: { tr: 'Listeyi göster', en: 'Show the list' },
  listeKapat: { tr: 'Kapat', en: 'Close' },
  listeBaslik: { tr: 'Çatı katında neler var', en: "What's on the top floor" },
  rafBaslik: { tr: 'Raflar', en: 'Shelves' },
  oynat: { tr: 'Kaydı oynat', en: 'Play the clip' },
  magaza: { tr: 'Mağazada gör', en: 'See in the shop' },
  ileri: { tr: 'Sıradaki', en: 'Next' },
  fikrini: { tr: 'Fikrini anlat', en: 'Tell me your idea' },
  basla: { tr: 'Kaydır, süreçten başla', en: 'Scroll to start with the process' },
  isler: { tr: 'Raflardan işler', en: 'Work from the shelves' },
  adimlar: { tr: 'Adımlar (ekranda oynar)', en: 'Steps (play on the screen)' },
};

// "Fikrini anlat": mevcut sipariş hattı (WhatsApp, core/order-config.js)
export function fikirLinki(lang = 'tr') {
  const msg = lang === 'en' ? "Hello Oktos, I'm writing from the top floor.\nMy idea: " : 'Merhaba Oktos, çatı katından yazıyorum.\nFikrim: ';
  return ORDER.whatsapp ? `https://wa.me/${ORDER.whatsapp}?text=${encodeURIComponent(msg)}` : null;
}

const surec = (id, tr, en, dtr, den) => ({ id, kayit: `${PORT}surec-${id}.webp`, poster: `${PORT}surec-${id}-poster.webp`, ad: { tr, en }, desc: { tr: dtr, en: den } });
export const SUREC = [
  surec('01-modelleme', 'Sayısal modelleme', 'Digital modelling', "Biçimi sayısal heykel ve CAD ile kurar, dilimleyip G-code'a çeviririm.", 'I shape the form with digital sculpting and CAD, then slice it into G-code.'),
  surec('02-fdm', 'FDM baskı', 'FDM printing', 'PLA ve PETG ile basarım: prototip, kalıp kutusu, saksı.', 'PLA and PETG on the FDM printer: prototypes, mould boxes, planters.'),
  surec('03-uv-kur', 'Reçine baskı, UV kür', 'Resin printing, UV cure', 'Küçük ve hassas parçaları reçinede basar, desteklerini temizleyip UV ışıkta kürlerim.', 'I print small, fine parts in resin, strip the supports and cure them under UV.'),
  surec('04-gravur', 'Gravür, son işlem', 'Engraving and finishing', 'Yüzeyi gravürle işler, parçayı son işleme hazırlarım.', 'I work the surface with an engraving tool and get the piece ready for finishing.'),
  surec('05-kalip-kutusu', 'Kalıp kutusu', 'Mould box', "Ana modeli, FDM'de bastığım bir kalıp kutusunun içine yerleştiririm.", 'I set the master inside a mould box printed on the FDM printer.'),
  surec('06-silikon', 'RTV-2 silikon', 'RTV-2 silicone', 'İki bileşeni tartıp karıştırır, ana modelin üstüne dökerim: esnek, tekrar kullanılabilen bir kalıp çıkar.', 'I weigh and mix the two parts and pour them over the master, for a flexible mould that can be used again and again.'),
  surec('07-dokum', 'Döküm', 'Casting', 'Kalıba harç, alçı, reçine ya da taş tozu karışımı dökerim; taş görünümlü heykel de şeffaf parça da buradan çıkar.', 'I pour mortar, plaster, resin or a stone-dust mix into the mould: stone-look sculptures and clear pieces both start here.'),
  surec('08-ayni-kaliptan', 'Aynı kalıptan', 'Same mould, same form', 'Bir kalıp, aynı geometriyi tekrar tekrar verir.', 'One mould gives the same geometry, cast after cast.'),
];

// Ad, okullar ve şehir kullanıcının kendi verdiği profil bilgisinden; atölye ve hat sunumdan.
export const HAKKIMDA = {
  tr: [
    "Ben İbrahim Arda Bişgin, Ankara'dayım. Eğitimim inşaat mühendisliği (AYBÜ) ve coğrafi bilgi sistemleri (AÖF) üzerine.",
    'Oktos Workshop, 3B tasarım, baskı ve kalıplama üzerine yürüttüğüm atölye. FDM ve reçine yazıcıda basıyor, RTV-2 silikonla kalıp alıyor, epoksi ve taş tozuyla döküyorum.',
    "Modelleri Blender ve Rhino'da kuruyor, Godot'ta da çalışıyorum. Hattım dijital modelden başlar, baskı ve kalıptan geçip dökümle biter. Bitirme projesi için önerdiğim konu bu bilgiyi laboratuvara taşıyor: 3B baskı kalıplarda dökülen çimento esaslı numuneler.",
  ],
  en: [
    "I'm İbrahim Arda Bişgin, based in Ankara. My background is in civil engineering (AYBÜ) and GIS (AÖF).",
    'Oktos Workshop is where I do 3D design, printing and mould-making. I print on FDM and resin machines, make RTV-2 silicone moulds, and cast with epoxy and stone dust.',
    'I model in Blender and Rhino, and work in Godot too. My process starts with a digital model, goes through printing and moulding, and ends with a cast. My proposed graduation project takes this into the lab: cement-based specimens cast in 3D-printed moulds.',
  ],
};
