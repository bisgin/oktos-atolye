// Çatı katı (portfolyo) metni ve içerik listesi. Kaynak: kullanıcının bitirme projesi sunumu (slayt metinleri), ürün
// inceleme paketleri, ürün görsellerindeki yazılar ve çatı planındaki alan listesi (planlar, 2026-10-21); uydurma olgu
// yok, alan metinlerinde sayı ve iddia yok (hizmet tanımı). Görseller assets/cati/portfolyo/ altında (yalnız kullanıcının
// kendi işleri). Ses: portfolyo birinci tekil ("ben"), ziyaretçiye "sen" (aşağıdaki oda "biz/atölye" sesinde). Biçim
// motorun beklediği gibi (core/story-data.js zone).
import { ORDER } from './order-config.js';

const zone = (tr, en, dtr, den, pin = null) => ({ tr, en, desc: { tr: dtr, en: den }, ...(pin ? { pin: { tr: pin[0], en: pin[1] } } : {}) });
const PORT = '../assets/cati/portfolyo/';

// Modern Balbal serisi (Figürler alanının işleri; heykel modelleri assets/cati/modeller/, gözün ilk adayı, şimdi konmuyor).
// gorsel: ürün master karesi (yazısız).
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

// Atölyeden çıkan diğer işler (fotoğraf); her biri ait olduğu alanın kartında
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
const galeri = (id) => GALERI.find((g) => g.id === id);
const eser = (e) => ({ gorsel: e.gorsel, baslik: e.ad, desc: { tr: [e.desc.tr, e.olcu?.tr].filter(Boolean).join(' · '), en: [e.desc.en, e.olcu?.en].filter(Boolean).join(' · ') } });

// Fikir rafı: 2×4 gözlü vitrin, 7 alan + "Senin fikrin" (sıra gözlerin sırası: üst sıra soldan sağa, sonra alt sıra).
// Her gözde başlık (arka kâğıt), alt kalemler ve sonradan gerçek ürünün konacağı boş yuva. Gerçek ürün gelince yalnız
// yuva değişir: model (GLB yolu; döner kaidenin üstüne sığdırılır, hayalet çizim söner). isler: o alandaki eski işlerin
// fotoğrafları (kartta). doodle: hayalet çizimin adı (core/cati-sahne.js HAYALET).
const alan = (id, doodle, [tr, en], [altTr, altEn], [mTr, mEn], isler = []) => ({
  id, doodle, baslik: { tr, en }, alt: { tr: altTr, en: altEn }, metin: { tr: mTr, en: mEn }, isler, yuva: { model: null },
});
export const ALANLAR = [
  alan('kutu', 'kutu', ['Kutu oyunları', 'Board games'], ['insert, jeton, zar', 'inserts, tokens, dice'],
    ['Oyununun kutusuna göre bölmeli insert, jeton ve zar tasarlayıp basarım.', "I design and print inserts, tokens and dice that fit your game's box."],
    [galeri('recine-zarlar'), galeri('satranc')]),
  alan('plaka', 'plaka', ['Plakalar', 'Plaques & signs'], ['tabela, isimlik, kabartma', 'signs, nameplates, reliefs'],
    ['Tabela, isimlik ve kabartmalı plakaları ölçüsüne göre modelleyip basarım.', 'Signs, nameplates and relief plaques, modelled to size and printed.']),
  alan('figur', 'figur', ['Figürler', 'Figures'], ['figür, heykelcik, kaide', 'figures, statuettes, bases'],
    ['Figür ve heykelcikleri modeller, basar ya da kalıbını alıp dökerim. Modern Balbal serisi burada.', 'I model figures and statuettes, then print them or mould and cast them. The Modern Balbal series lives here.'],
    [...ESERLER.filter((e) => e.gorsel).map(eser), galeri('dokum-cift')]),
  alan('anahtarlik', 'anahtarlik', ['Anahtarlıklar', 'Keychains'], ["isimli, QR'lı, tıklayan", 'named, QR, clicky'],
    ['İsimli, QR kodlu ya da tıklayan anahtarlıklar. Atölyenin araçlarıyla kendin de tasarlayabilirsin.', "Named, QR-coded or clicky keychains. You can also design one yourself with the workshop's tools."]),
  alan('stant', 'stant', ['Stant ve vitrinler', 'Stands & displays'], ['masa standı, figür vitrini', 'desk stands, display cases'],
    ['Figürüne, ürününe ya da koleksiyonuna göre stant ve vitrin.', 'Stands and display cases built around your figure, product or collection.']),
  alan('ev', 'ev', ['Ev ürünleri', 'Home goods'], ['vazo, saksı, düzenleyici', 'vases, planters, organisers'],
    ['Vazo, saksı ve düzenleyiciler; ölçüsü ve rengi sana göre.', 'Vases, planters and organisers, sized and coloured to suit you.'],
    [galeri('saksilar')]),
  alan('endustri', 'endustri', ['Endüstriyel ön-mühendislik', 'Industrial pre-engineering'], ['prototip, tolerans, kalıp tasarımı', 'prototypes, tolerances, mould design'],
    ['Parçanın ilk prototipini modelleyip basarım; montajı ve ölçüleri elde birlikte deneriz.', 'I model and print a first prototype of your part, so we can test the fit and dimensions together.']),
  alan('fikir', 'fikir', ['Senin fikrin', 'Your idea'], ['Sıradaki sayfa senin.', 'The next page is yours.'],
    ['Aklındakini anlat; ölçüsünü, malzemesini ve yolunu birlikte buluruz.', "Tell me what you have in mind; we'll work out the size, material and method together."]),
];

// Süreç rayı: vitrinin üstündeki 4 ışıklı kart (sıra soldan sağa)
export const SUREC_RAYI = [
  { id: 'tasarim', ad: { tr: 'Tasarım', en: 'Design' } },
  { id: 'fdm', ad: { tr: 'FDM baskı', en: 'FDM print' } },
  { id: 'recine', ad: { tr: 'Reçine baskı', en: 'Resin print' } },
  { id: 'kalip', ad: { tr: 'Kalıp ve döküm', en: 'Mould & cast' } },
];

export const CATI_STORY = {
  live: true,
  href: 'index.html',
  name: { tr: 'Çatı katı', en: 'Top floor' },
  title: { tr: '3B bir fikrin var mı? Gerçeğe dönüştürelim.', en: 'Got an idea in 3D? Let’s make it real.' },
  lede: {
    tr: 'Burası atölyenin çatı katı, benim köşem. Raftaki bir göze tıkla: o alanda neler yaptığıma yakından bak.',
    en: "This is the workshop's top floor, my own corner. Click a slot on the shelf to see what I make in that area.",
  },
  hotspots: {
    surec: zone('Süreç', 'Process', 'Dijital modelden döküme sekiz adım.', 'Eight steps from digital model to cast.', ['Süreç', 'Process']),
    ...Object.fromEntries(ALANLAR.map((a) => [a.id, zone(a.baslik.tr, a.baslik.en, a.metin.tr, a.metin.en)])),
    biggie: zone('Biggie', 'Biggie', "Atölyenin maskotu bizzikoloşko, kısaca Biggie. Blender'da yeniden kuruldu; kilden elle yapılmış gibi duruyor.",
      'The workshop mascot, bizzikoloşko, or Biggie for short. Rebuilt in Blender, it looks like a little clay figure made by hand.', ['Biggie', 'Biggie']),
    hakkimda: zone('Hakkımda', 'About me', 'Kimim, ne yapıyorum, nasıl çalışıyorum.', 'Who I am, what I make, how I work.', ['Hakkımda', 'About']),
    merdiven: zone('Merdiven', 'Stairs', 'Merdivenden aşağıda oda var.', 'The stairs lead down to the room.', ['Aşağı', 'Down']),
  },
};

export const SAYFA = {
  yukleniyor: { tr: 'Çatı katı hazırlanıyor', en: 'Setting up the top floor' },
  asagiKat: { tr: 'Odaya in', en: 'Down to the room' },
  liste: { tr: 'Listeyi göster', en: 'Show the list' },
  listeKapat: { tr: 'Kapat', en: 'Close' },
  listeBaslik: { tr: 'Çatı katında neler var', en: "What's on the top floor" },
  rafBaslik: { tr: 'Fikir rafı', en: 'Idea shelf' },
  oynat: { tr: 'Kaydı oynat', en: 'Play the clip' },
  magaza: { tr: 'Mağazada gör', en: 'See in the shop' },
  ileri: { tr: 'Sıradaki', en: 'Next' },
  fikrini: { tr: 'Fikrini anlat', en: 'Tell me your idea' },
  basla: { tr: 'Kaydır, süreçten başla', en: 'Scroll to start with the process' },
  isler: { tr: 'Bu alandan işler', en: 'Work from this area' },
};

// "Fikrini anlat": mevcut sipariş hattı (WhatsApp, core/order-config.js); alanın adı hazır mesajda
export function fikirLinki(a, lang = 'tr') {
  const L = (o) => o[lang] ?? o.tr;
  const msg = lang === 'en'
    ? `Hello Oktos, I'm writing from the idea shelf on the top floor.\nArea: ${L(a.baslik)}\nMy idea: `
    : `Merhaba Oktos, çatı katındaki fikir rafından yazıyorum.\nAlan: ${L(a.baslik)}\nFikrim: `;
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
