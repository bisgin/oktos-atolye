// Araç hikâyeleri ve sahne şablon adları (TR / EN). Üslup ve karar günlüğü: docs/uslup-karti.md
// live: araç atölyesi hazır mı. hotspots: sahnedeki tıklanabilir şablonların görünen adları;
// desc: yakın plan kartındaki tek cümle (şablonun gerçek ayarlarıyla tutarlı olmalı: tools/<id>/app.js).

export const STORY_UI = {
  tr: {
    cta: 'Hemen tasarla',
    hint: 'ya da sahnedeki bir şablonu seç',
    hintTouch: 'ya da aşağıdan bir şablon seç',
    pinAction: 'Tasarla',
    look: 'Yakından bak',
    designThis: 'Bu şablonla tasarla',
    back: 'Geri',
    soonCard: 'Bu araç atölyede hazırlanıyor.',
    lookAround: 'Fareyi gezdir, etrafına bak.',
    lookAroundTouch: 'Parmağını kaydır, etrafına bak.',
    soon: 'Yakında',
    soonToast: 'Bu araç atölyede hazırlanıyor. Şablonlarını şimdiden gezebilirsin.',
    soonHint: 'Atölyesi hazırlanıyor. Sahnedeki şablonları şimdiden gezebilirsin.',
    backToScene: 'Sahneye dön',
    allTools: 'Tüm araçlar',
    presetsLabel: 'Sahnedeki şablonlar',
    loading: 'Sahne hazırlanıyor…',
    noWebgl: 'Bu tarayıcı 3B sahneyi gösteremiyor. Şablonu aşağıdaki listeden seçebilirsin.',
    goingTo: '{name} atölyeye taşınıyor',
  },
  en: {
    cta: 'Start designing',
    hint: 'or pick a preset in the scene',
    hintTouch: 'or pick a preset below',
    pinAction: 'Design',
    look: 'Take a closer look',
    designThis: 'Design with this preset',
    back: 'Back',
    soonCard: 'This tool is still in the workshop.',
    lookAround: 'Move the mouse to look around.',
    lookAroundTouch: 'Drag to look around.',
    soon: 'Soon',
    soonToast: 'This tool is still in the workshop. You can already explore its presets.',
    soonHint: 'Its workshop is on the way. You can already explore the presets in the scene.',
    backToScene: 'Back to scene',
    allTools: 'All tools',
    presetsLabel: 'Presets in this scene',
    loading: 'Setting up the scene…',
    noWebgl: 'This browser can\'t show the 3D scene. Pick a preset from the list below.',
    goingTo: 'Taking {name} to the workshop',
  },
};

export const STORIES = {
  bin: {
    live: true,
    href: 'tools/bin/index.html',
    name: { tr: 'Kutu ve Organizer', en: 'Bins & Organizers' },
    title: { tr: 'Her şeyin bir yeri olsun.', en: 'A place for everything.' },
    lede: {
      tr: 'Çekmecene, masana, rafına göre ölçülmüş organizer. Ölçünü gir, gerisini atölye halletsin.',
      en: 'Organizers measured to your drawer, desk and shelf. Enter your size; the workshop handles the rest.',
    },
    hotspots: {
      pencup: { tr: 'Kalemlik', en: 'Pen cup',
        desc: { tr: 'Kalemler dik dursun, masa boş kalsın. Çapını ve boyunu kalemlerine göre ayarla.', en: 'Pens stand up, the desk stays clear. Set the diameter and height to fit your pens.' } },
      desk: { tr: 'Masa düzenleyici', en: 'Desk organizer',
        desc: { tr: 'Telefon, not kâğıdı, kalem: her birine bir bölme.', en: 'Phone, sticky notes, pens: a compartment for each.' } },
      screws: { tr: 'Vida ayırıcı', en: 'Screw sorter',
        desc: { tr: '25 bölme, üst üste istiflenir. Vida, somun ve pul her biri kendi yerinde.', en: '25 compartments that stack. Screws, nuts and washers each in their own place.' } },
      drawer: { tr: 'Çekmece içi', en: 'Drawer insert',
        desc: { tr: 'Çekmecenin iç ölçüsünü gir; bölmeler milimetresine oturur.', en: 'Enter your drawer\'s inner size; the compartments fit to the millimetre.' } },
      roundtray: { tr: 'Yuvarlak tepsi', en: 'Round tray',
        desc: { tr: 'Kapının yanına: anahtar, bozuk para, yüzük.', en: 'By the door: keys, coins, rings.' } },
      g4: { tr: 'Gridfinity kutular', en: 'Gridfinity bins',
        desc: { tr: '42 mm ızgaraya oturan modüler kutular; köşelerindeki mıknatısla plakaya tutunur.', en: 'Modular bins on the 42 mm grid; corner magnets hold them to the plate.' } },
      tools: { tr: 'Alet kutusu', en: 'Tool caddy',
        desc: { tr: 'Tornavidaların uçları aşağıda, sapları elinin altında.', en: 'Screwdrivers tip down, handles within reach.' } },
    },
  },
  vase: {
    live: true,
    href: 'tools/vase/index.html',
    name: { tr: 'Vazo Üreteci', en: 'Vase Generator' },
    title: { tr: 'Her çiçeğe kendi vazosu.', en: 'Every flower deserves its own vase.' },
    lede: {
      tr: 'Köşesini, kıvrımını, burgusunu sen seç. Pencerene yakışanı atölye bassın.',
      en: 'You choose the corners, the curve and the twist. The workshop prints the one that suits your window.',
    },
    hotspots: {
      twist: { tr: 'Burgulu kule', en: 'Twisted tower',
        desc: { tr: 'Altıgen kesit, 180° burgu. Işık her yüze başka düşer.', en: 'A hexagonal section with a 180° twist. Light falls differently on every face.' } },
      ribbed: { tr: 'Kaburgalı şişe', en: 'Ribbed bottle',
        desc: { tr: 'İnce boyun, kaburgalı gövde; tek dal çiçek için.', en: 'A slim neck and a ribbed body, made for a single stem.' } },
      hex: { tr: 'Altıgen saksı', en: 'Hex planter',
        desc: { tr: 'Sukulentler ve küçük bitkiler için; ağzı tabanından geniş.', en: 'For succulents and small plants; wider at the rim than at the base.' } },
      tulip: { tr: 'Lale', en: 'Tulip',
        desc: { tr: 'Beş yapraklı kesit, fırfırlı ağız. Lalelerle iyi anlaşır.', en: 'A five-petal section and a ruffled rim. It gets along with tulips.' } },
      flower: { tr: 'Çiçek kase', en: 'Flower bowl',
        desc: { tr: 'Geniş ağızlı kase; meyve ya da kuru çiçek için.', en: 'A wide-mouthed bowl for fruit or dried flowers.' } },
      tall: { tr: 'Uzun burgu, 50 cm', en: 'Tall twist, 50 cm',
        desc: { tr: 'Yere konan uzun vazo; burgu yalnız üstteki üçte ikide.', en: 'A tall floor vase; the twist runs only through the top two-thirds.' } },
    },
  },
  clicker: {
    live: false,
    href: 'tools/clicker/index.html',
    name: { tr: 'Fidget Clicker', en: 'Fidget Clicker' },
    title: { tr: 'Tık. Bir nefes daha.', en: 'Click. Breathe again.' },
    lede: {
      tr: 'Sevdiğin figürün içinde mavi bir anahtarın çıtırtısı. Toplantıda, derste, sıra beklerken.',
      en: 'The crisp click of a blue switch inside a figure you love. In meetings, lectures, queues.',
    },
    hotspots: {
      cat: { tr: 'Kedi clicker', en: 'Cat clicker',
        desc: { tr: 'Kafasına bas: mavi anahtar figürün içinde saklı.', en: 'Press its head: the blue switch hides inside the figure.' } },
      boxed: { tr: 'Kutulu clicker', en: 'Boxed clicker',
        desc: { tr: 'Üstü yazılı bir kutu; kapağı tıklar.', en: 'A box with lettering on top; the lid clicks.' } },
      star: { tr: 'Gömülü yıldız', en: 'Embedded star',
        desc: { tr: 'Anahtar gövdeye gömülü; dışarıdan yalnız biçim görünür.', en: 'The switch is embedded; only the shape shows.' } },
      switch: { tr: 'Mavi anahtar', en: 'Blue switch',
        desc: { tr: 'Alt gövde, mavi anahtar, üst kapak: üç parça, tek tık.', en: 'Base, blue switch, cap: three parts, one click.' } },
    },
  },
  text: {
    live: false,
    href: 'tools/text/index.html',
    name: { tr: '3D Yazı', en: '3D Text' },
    title: { tr: 'Adın kapında dursun.', en: 'Put your name on the door.' },
    lede: {
      tr: 'İsimlik, tabela, anahtarlık, pasta süsü. Yazı tipini seç, kalınlığını ver, atölye bassın.',
      en: 'Name plates, signs, keychains, cake toppers. Pick a typeface, set the depth; the workshop prints it.',
    },
    hotspots: {
      door: { tr: 'Kapı isimliği', en: 'Door plate',
        desc: { tr: 'Kapına kendi adını ya da odanın adını yaz.', en: 'Your name, or the room\'s, on the door.' } },
      sign: { tr: 'Masa tabelası', en: 'Desk sign',
        desc: { tr: 'Masanda ayakta duran harfler; kaide bir renk, yazı başka renk.', en: 'Letters that stand on your desk; the base in one colour, the text in another.' } },
      key: { tr: 'Anahtarlık', en: 'Keychain',
        desc: { tr: 'Halkasıyla birlikte: isim, baş harfler ya da bir tarih.', en: 'Ring included: a name, initials or a date.' } },
      cake: { tr: 'Pasta süsü', en: 'Cake topper',
        desc: { tr: 'Pastaya saplanan yazı: doğum günü, nişan, mezuniyet.', en: 'Lettering that stands in the cake: birthdays, engagements, graduations.' } },
    },
  },
  flip: {
    live: true,
    href: 'tools/flip/index.html',
    name: { tr: 'Text Flip', en: 'Text Flip' },
    title: { tr: 'Bir yandan sen, öbür yandan o.', en: 'One side you, the other side them.' },
    lede: {
      tr: 'İki kelime, tek heykel. Çevirdikçe öteki kelime belirir.',
      en: 'Two words, one sculpture. Turn it and the other word appears.',
    },
    hotspots: {
      family: { tr: 'ANNE / BABA', en: 'MOM / DAD',
        desc: { tr: 'Önden bir kelime, yandan öteki. Anneler ve Babalar Günü için.', en: 'One word from the front, the other from the side. For Mother\'s and Father\'s Day.' } },
      us: { tr: 'SEN / BEN', en: 'YOU / ME',
        desc: { tr: 'İki kısa kelime, iki kişi.', en: 'Two short words, two people.' } },
      sea: { tr: 'ADA / EGE', en: 'SEA / SUN',
        desc: { tr: 'Yer adları da olur.', en: 'Places and moods work too.' } },
    },
  },
  qr: {
    live: true,
    href: 'tools/qr/index.html',
    name: { tr: '3D QR Kod', en: '3D QR Code' },
    title: { tr: 'Misafirin şifre sormasın.', en: 'Guests stop asking for the password.' },
    lede: {
      tr: 'Wi-Fi şifresi, menü ya da sayfan: hepsi tek bir karoda. Telefonu tutan bağlanır.',
      en: 'Wi-Fi password, menu or page, all on one tile. Point a phone and you\'re in.',
    },
    hotspots: {
      wifi: { tr: 'Wi-Fi standı', en: 'Wi-Fi stand',
        desc: { tr: 'Misafir ağı için ayaklı karo; telefon kamerası yeter.', en: 'A standing tile for the guest network; a phone camera is all it takes.' } },
      menu: { tr: 'Menü karosu', en: 'Menu tile',
        desc: { tr: 'Her masaya menü ya da sipariş sayfası.', en: 'A menu or order page on every table.' } },
      card: { tr: 'Kartvizit', en: 'Business card',
        desc: { tr: 'Kartvizitinde sayfan ya da iletişim bilgin.', en: 'Your page or contact details on a business card.' } },
      key: { tr: 'QR anahtarlık', en: 'QR keychain',
        desc: { tr: 'Kaybolursa bulan seni arayabilsin.', en: 'If it\'s lost, whoever finds it can call you.' } },
    },
  },
  painter: {
    live: true,
    href: 'tools/painter/index.html',
    name: { tr: 'Filament Painter', en: 'Filament Painter' },
    title: { tr: 'Fotoğrafın ışıkta derinleşsin.', en: 'Let your photo deepen in the light.' },
    lede: {
      tr: 'Sevdiğin kareyi filament renkleriyle katman katman bas. Pencereye tuttuğunda dağlar öne çıkar.',
      en: 'Print a favourite picture layer by layer in filament colours. Hold it to the window and the mountains step forward.',
    },
    hotspots: {
      frame: { tr: 'Çerçeveli tablo', en: 'Framed relief',
        desc: { tr: 'Dört filament rengiyle, katman katman bir manzara.', en: 'A landscape in four filament colours, layer by layer.' } },
      window: { tr: 'Pencere ışıklığı', en: 'Window light panel',
        desc: { tr: 'Pencereye asınca ışık arkadan geçer, renkler derinleşir.', en: 'Hang it in a window: light passes through and the colours deepen.' } },
      card: { tr: 'Kartpostal', en: 'Postcard',
        desc: { tr: 'Kartpostal boyunda; şövalede ya da çerçevede.', en: 'Postcard-sized, for an easel or a frame.' } },
    },
  },
  puzzle: {
    live: true,
    href: 'tools/puzzle/index.html',
    name: { tr: 'Puzzle Maker', en: 'Puzzle Maker' },
    title: { tr: 'Bir model, yüz parça.', en: 'One model, a hundred pieces.' },
    lede: {
      tr: 'Sevdiğin modeli yapboz parçalarına böl. Birlikte toplamak da hediyenin bir parçası olsun.',
      en: 'Cut a favourite model into jigsaw pieces. Putting it back together is part of the gift.',
    },
    hotspots: {
      sphere: { tr: 'Küre yapboz', en: 'Sphere puzzle',
        desc: { tr: 'Küre dikine dokuz parçaya bölünür; tırnaklar birbirine kilitlenir.', en: 'A sphere cut into nine upright pieces; the knobs lock together.' } },
      relief: { tr: 'Kabartma yapboz', en: 'Relief puzzle',
        desc: { tr: 'Kabartma bir manzara, on iki parça.', en: 'A relief landscape in twelve pieces.' } },
      cube: { tr: 'Küp yapboz', en: 'Cube puzzle',
        desc: { tr: 'Dört sütun parça, tek küp.', en: 'Four column pieces, one cube.' } },
    },
  },
};

export const STORY_ORDER = ['bin', 'vase', 'clicker', 'text', 'flip', 'qr', 'painter', 'puzzle'];

// Ana sayfanın oda sahnesi (gri kutu aşaması, docs/oda-sahnesi.md). Bölge adı şeritte ve işaretçide; kartın büyük
// başlığı aracın adı (sayfa koyar); desc kartta başlığın altındaki kısa hikâye cümlesi. "taslak" yorumlu cümleler
// kullanıcı onayı bekliyor.
// pin: işaretçide görünen kısa ad (ürün); tr/en: şerit ve kart üstündeki bölge adı
const zone = (tr, en, dtr, den, pin = null) => ({ tr, en, desc: { tr: dtr, en: den }, ...(pin ? { pin: { tr: pin[0], en: pin[1] } } : {}) });
export const ODA_STORY = {
  live: true,
  href: 'index.html',
  name: { tr: 'Atölye odası', en: 'Workshop room' },
  title: { tr: 'Ölçünü gir, atölye bassın.', en: 'Enter your size. The workshop prints it.' },
  lede: {
    tr: 'Ürettiğimiz her şey bu odada. Birine tıkla, yakından bak.',
    en: 'Everything we make is in this room. Click one for a closer look.',
  },
  hotspots: {
    cekmece: zone('Çekmece', 'Drawer', 'Atölye için organizerler.', 'Organizers for the workshop.', ['Organizer', 'Organizer']),
    anahtarlik: zone('Anahtar tepsisi', 'Key tray', 'Anahtarın yanında kendi kartın: kart anahtarlıklarımız mağazada.', 'Your own card next to your keys: our card keychains are in the shop.', ['Kart anahtarlık', 'Card keychain']),
    kalemlik: zone('Kalemlik', 'Pen cup', 'Kalemler yerini bilsin.', 'Every pen knows its place.', ['Kalemlik', 'Pen cup']), // taslak (kullanıcının cümlesi yarım kaldı)
    klavye: zone("Klavye ve fidget'lar", 'Keyboard & fidgets', 'Klavyene kendi tuşunu tak, aynısı anahtarlıkta tıklasın.', 'Fit your own keycaps; the same design clicks on your keyring.', ['Tuş başlığı', 'Keycaps']),
    modem: zone('Modem', 'Router', STORIES.qr.title.tr, STORIES.qr.title.en, ['QR kod', 'QR code']),
    puzzle3d: zone('3B yapboz', '3D puzzle', STORIES.puzzle.title.tr, STORIES.puzzle.title.en, ['3B yapboz', '3D puzzle']),
    tabela: zone('Kapı plakası', 'Door sign', STORIES.text.title.tr, STORIES.text.title.en, ['3D yazı', '3D text']),
    saksilar: zone('Saksılar', 'Planters', 'Her bitkinize şık bir kıyafet.', 'A stylish outfit for every plant.', ['Saksı', 'Planter']),
    balkonMasa: zone('Balkon masası', 'Balcony table', 'Menü bir okutma uzağında.', 'The menu is one scan away.', ['QR menü', 'QR menu']), // taslak
    miknatis: zone('Buzdolabı kapağı', 'Fridge door', 'Kapakta senin yazın: not, harf, kalp.', 'Your words on the door: notes, letters, hearts.', ['Mıknatıs', 'Magnet']),
    buzdolabi: zone('Buzdolabı', 'Fridge', 'Pastaya, ekmeğe, kapağa: ne yazmak istersen.', 'On the cake, the bread, the lid: whatever you want to say.', ['Pasta süsü', 'Cake topper']), // taslak
    flip: zone('Flip heykeli', 'Flip sculpture', STORIES.flip.title.tr, STORIES.flip.title.en, ['Text Flip', 'Text Flip']),
    cerceve: zone('Rölyef çerçeve', 'Relief frame', STORIES.painter.title.tr, STORIES.painter.title.en, ['Rölyef', 'Relief']),
    yapboz: zone('Yapboz çerçevesi', 'Puzzle frame', 'Resmin parça parça yerine otursun.', 'Your picture, piece by piece.', ['Yapboz', 'Puzzle']), // taslak
  },
};
