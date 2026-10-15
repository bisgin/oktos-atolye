// Araç hikâyeleri ve sahne şablon adları (TR / EN). Üslup ve karar günlüğü: docs/uslup-karti.md
// live: araç atölyesi hazır mı. hotspots: sahnedeki tıklanabilir şablonların görünen adları.

export const STORY_UI = {
  tr: {
    cta: 'Hemen tasarla',
    hint: 'ya da sahnedeki bir şablonu seç',
    hintTouch: 'ya da aşağıdan bir şablon seç',
    pinAction: 'Tasarla',
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
      pencup: { tr: 'Kalemlik', en: 'Pen cup' },
      desk: { tr: 'Masa düzenleyici', en: 'Desk organizer' },
      screws: { tr: 'Vida ayırıcı', en: 'Screw sorter' },
      drawer: { tr: 'Çekmece içi', en: 'Drawer insert' },
      roundtray: { tr: 'Yuvarlak tepsi', en: 'Round tray' },
      g4: { tr: 'Gridfinity kutular', en: 'Gridfinity bins' },
      tools: { tr: 'Alet kutusu', en: 'Tool caddy' },
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
      twist: { tr: 'Burgulu kule', en: 'Twisted tower' },
      ribbed: { tr: 'Kaburgalı şişe', en: 'Ribbed bottle' },
      hex: { tr: 'Altıgen saksı', en: 'Hex planter' },
      tulip: { tr: 'Lale', en: 'Tulip' },
      flower: { tr: 'Çiçek kase', en: 'Flower bowl' },
      tall: { tr: 'Uzun burgu, 50 cm', en: 'Tall twist, 50 cm' },
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
      cat: { tr: 'Kedi clicker', en: 'Cat clicker' },
      boxed: { tr: 'Kutulu clicker', en: 'Boxed clicker' },
      star: { tr: 'Gömülü yıldız', en: 'Embedded star' },
      switch: { tr: 'Mavi anahtar', en: 'Blue switch' },
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
      door: { tr: 'Kapı isimliği', en: 'Door plate' },
      sign: { tr: 'Masa tabelası', en: 'Desk sign' },
      key: { tr: 'Anahtarlık', en: 'Keychain' },
      cake: { tr: 'Pasta süsü', en: 'Cake topper' },
    },
  },
  flip: {
    live: false,
    href: 'tools/flip/index.html',
    name: { tr: 'Text Flip', en: 'Text Flip' },
    title: { tr: 'Bir yandan sen, öbür yandan o.', en: 'One side you, the other side them.' },
    lede: {
      tr: 'İki kelime, tek heykel. Çevirdikçe öteki kelime belirir.',
      en: 'Two words, one sculpture. Turn it and the other word appears.',
    },
    hotspots: {
      family: { tr: 'ANNE / BABA', en: 'MOM / DAD' },
      us: { tr: 'SEN / BEN', en: 'YOU / ME' },
      sea: { tr: 'ADA / EGE', en: 'SEA / SUN' },
    },
  },
  qr: {
    live: false,
    href: 'tools/qr/index.html',
    name: { tr: '3D QR Kod', en: '3D QR Code' },
    title: { tr: 'Misafirin şifre sormasın.', en: 'Guests stop asking for the password.' },
    lede: {
      tr: 'Wi-Fi şifresi, menü ya da sayfan: hepsi tek bir karoda. Telefonu tutan bağlanır.',
      en: 'Wi-Fi password, menu or page, all on one tile. Point a phone and you\'re in.',
    },
    hotspots: {
      wifi: { tr: 'Wi-Fi standı', en: 'Wi-Fi stand' },
      menu: { tr: 'Menü karosu', en: 'Menu tile' },
      card: { tr: 'Kartvizit', en: 'Business card' },
      key: { tr: 'QR anahtarlık', en: 'QR keychain' },
    },
  },
  painter: {
    live: false,
    href: 'tools/painter/index.html',
    name: { tr: 'Filament Painter', en: 'Filament Painter' },
    title: { tr: 'Fotoğrafın ışıkta derinleşsin.', en: 'Let your photo deepen in the light.' },
    lede: {
      tr: 'Sevdiğin kareyi filament renkleriyle katman katman bas. Pencereye tuttuğunda dağlar öne çıkar.',
      en: 'Print a favourite picture layer by layer in filament colours. Hold it to the window and the mountains step forward.',
    },
    hotspots: {
      frame: { tr: 'Çerçeveli tablo', en: 'Framed relief' },
      window: { tr: 'Pencere ışıklığı', en: 'Window light panel' },
      card: { tr: 'Kartpostal', en: 'Postcard' },
    },
  },
  puzzle: {
    live: false,
    href: 'tools/puzzle/index.html',
    name: { tr: 'Puzzle Maker', en: 'Puzzle Maker' },
    title: { tr: 'Bir model, yüz parça.', en: 'One model, a hundred pieces.' },
    lede: {
      tr: 'Sevdiğin modeli yapboz parçalarına böl. Birlikte toplamak da hediyenin bir parçası olsun.',
      en: 'Cut a favourite model into jigsaw pieces. Putting it back together is part of the gift.',
    },
    hotspots: {
      sphere: { tr: 'Küre yapboz', en: 'Sphere puzzle' },
      relief: { tr: 'Kabartma yapboz', en: 'Relief puzzle' },
      cube: { tr: 'Küp yapboz', en: 'Cube puzzle' },
    },
  },
};

export const STORY_ORDER = ['bin', 'vase', 'clicker', 'text', 'flip', 'qr', 'painter', 'puzzle'];
