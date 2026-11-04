// Otomatik üretildi: scripts/urun-veri.py (depo dışındaki ürün envanteri, 2026-11-01). Elle düzenleme; betik yeniden yazar.
// Envanterden yalnız mağazada sayfası olan ürünler. durum: satista | stok-yok | sayfa-yok. fiyat: mağaza fiyatı (tek doğru yer mağaza).
// gorsel: ürün görseli (yoksa null; Blender renderı assets/urunler/ altına gelecek). Yuvada ürün yoksa (urun: 0) yuva gizli;
// oda: false olan yuva yalnız odada gizli (ürünleri /urunler/'de görünür).
// Diorama plakaları (grup: 'diorama', depo dışındaki site paketinden): mağaza sayfası yok (magaza, fiyat null); galeri: 6 görsel
// (kapak → ölçü), kucuk: galerinin 240 px küçük resimleri (aynı sırayla), gorsel: kapağın 600 px'i, olcu: mm
// (g genişlik, d derinlik, y yükseklik), parca: plaka sayısı, video: ürüne yakın kırpılmış dönüş videosu ya da null,
// video_boyut: videonun piksel boyutu (g, y), video_kapak: videonun ilk karesi (poster).
// Ürünler gerçek adları ve gerçek görselleriyle. ESKI_KIMLIK: eski kimlik → bugünkü (ürün sayfası yönlendirir).
export const URUN_VERI_TARIHI = "2026-11-01";

export const YUVALAR = [
  {
    "id": "sticker",
    "eski": "cekmece",
    "ad": {
      "tr": "Sticker'lar",
      "en": "Stickers"
    },
    "urun": 0
  },
  {
    "id": "anahtarlik",
    "eski": "anahtarlik",
    "ad": {
      "tr": "Kart anahtarlıklar",
      "en": "Card keychains"
    },
    "urun": 5
  },
  {
    "id": "figur",
    "eski": "kalemlik",
    "ad": {
      "tr": "Minifigürler",
      "en": "Minifigures"
    },
    "urun": 4
  },
  {
    "id": "raf",
    "eski": "modem",
    "ad": {
      "tr": "Diorama plakaları",
      "en": "Diorama plates"
    },
    "urun": 10
  },
  {
    "id": "kilic",
    "eski": "cerceve",
    "ad": {
      "tr": "Katana",
      "en": "Katana"
    },
    "urun": 1
  },
  {
    "id": "maske",
    "eski": "yapboz",
    "ad": {
      "tr": "Maske",
      "en": "Mask"
    },
    "urun": 1
  },
  {
    "id": "biblo",
    "eski": "saksilar",
    "ad": {
      "tr": "Balbal biblolar",
      "en": "Balbal figurines"
    },
    "urun": 3
  }
];

export const URUNLER = [
  {
    "id": "black-lotus",
    "ad": {
      "tr": "Black Lotus anahtarlık",
      "en": "Black Lotus keychain"
    },
    "yuva": "anahtarlik",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/black-lotus-anahtarlik-canta-takisi-magic-thr-gathering",
    "fiyat": "139 TL",
    "gorsel": "assets/oda/anahtarlik-black-lotus.webp"
  },
  {
    "id": "blastoise",
    "ad": {
      "tr": "Blastoise anahtarlık",
      "en": "Blastoise keychain"
    },
    "yuva": "anahtarlik",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/blastoise-anahtarlik-canta-takisi-pokemon",
    "fiyat": "109 TL",
    "gorsel": "assets/oda/anahtarlik-blastoise.webp"
  },
  {
    "id": "charizard",
    "ad": {
      "tr": "Charizard anahtarlık",
      "en": "Charizard keychain"
    },
    "yuva": "anahtarlik",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/charizard-anahtarlik-canta-takisi-pokemon",
    "fiyat": "149 TL",
    "gorsel": "assets/oda/anahtarlik-charizard.webp"
  },
  {
    "id": "dark-magician",
    "ad": {
      "tr": "Dark Magician anahtarlık",
      "en": "Dark Magician keychain"
    },
    "yuva": "anahtarlik",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/dark-magician-anahtarlik-canta-takisi-yu-gi-oh",
    "fiyat": "109 TL",
    "gorsel": "assets/oda/anahtarlik-dark-magician.webp"
  },
  {
    "id": "venusaur",
    "ad": {
      "tr": "Venusaur anahtarlık",
      "en": "Venusaur keychain"
    },
    "yuva": "anahtarlik",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/venasaur-anahtarlik-canta-takisi-pokemon",
    "fiyat": "109 TL",
    "gorsel": "assets/oda/anahtarlik-venusaur.webp"
  },
  {
    "id": "imperium-clankers",
    "ad": {
      "tr": "Grimdark Evrenleri · Imperium Clankers",
      "en": "Grimdark Universes · Imperium Clankers"
    },
    "yuva": "figur",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/imperium-clankers-tekli-figur-ve-altligi",
    "fiyat": "249 TL",
    "gorsel": "assets/urunler/magaza/imperium-clankers.webp"
  },
  {
    "id": "magnum-tanks",
    "ad": {
      "tr": "Grimdark Evrenleri · Magnum Tanks",
      "en": "Grimdark Universes · Magnum Tanks"
    },
    "yuva": "figur",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/grimdark-evrenleri-magnum-tanklari",
    "fiyat": "149–199 TL",
    "gorsel": "assets/urunler/magaza/magnum-tanks.webp"
  },
  {
    "id": "tcg-kutu",
    "ad": {
      "tr": "Pokémon TCG mini saklama kutusu",
      "en": "Pokémon TCG mini storage box"
    },
    "yuva": "figur",
    "durum": "stok-yok",
    "magaza": "https://oktosworkshop.com/pokemon-tcg-mini-saklama-kutusu",
    "fiyat": "299 TL",
    "gorsel": "assets/urunler/magaza/tcg-kutu.webp"
  },
  {
    "id": "ultra-on-cepheciler",
    "ad": {
      "tr": "Grimdark Evrenleri · Ultra Ön-Cepheciler",
      "en": "Grimdark Universes · Ultra Ön-Cepheciler"
    },
    "yuva": "figur",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/grimdark-evrenleri-ultra-on-cepheciler",
    "fiyat": "199 TL",
    "gorsel": "assets/urunler/magaza/ultra-on-cepheciler.webp"
  },
  {
    "id": "pokemon-karagoz-savasi",
    "ad": {
      "tr": "Pokémon Karagöz Savaşı: Pika-göz ve Haci-Squirtle",
      "en": "Pokémon Karagöz Battle: Pika-göz and Haci-Squirtle"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/pokemon-karagoz-savasi/kart.webp",
    "galeri": [
      "assets/urunler/diorama/pokemon-karagoz-savasi/1.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/2.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/3.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/4.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/5.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/pokemon-karagoz-savasi/k1.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/k2.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/k3.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/k4.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/k5.webp",
      "assets/urunler/diorama/pokemon-karagoz-savasi/k6.webp"
    ],
    "raf": "assets/urunler/diorama/pokemon-karagoz-savasi/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 11,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Karagöz perdesinin önünde bir Pokémon savaşı: sarıklı Pika-göz, sandığın üstündeki Hacivat külahlı Haci-Squirtle'a karşı. Önde oyunun savaş menüsü (\"Pika-göz ne yapacak?\", DAYAK / KESE / POKéMON / FİRAR) ve iki karakterin bilgi kutuları, iki yanda kırmızı kadife perdeler ve püsküllü saçak var. Arka duvarda iki ev ve lamba ışığıyla bir Karagöz perdesi çizili. Sticker'lar elle yapıştırılır; 11 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "A Pokémon battle in front of the Karagöz screen: Pika-göz in a turban faces Haci-Squirtle, who wears Hacivat's hat atop a chest. Up front sit the game's battle menu (\"Pika-göz ne yapacak?\", DAYAK / KESE / POKéMON / FİRAR) and both characters' status boxes, framed by red velvet curtains with a tasselled fringe. The back wall shows a Karagöz screen with two houses and lamplight. The stickers are applied by hand; 11 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (11 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (11 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/pokemon-karagoz-savasi/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 302
    },
    "video_kapak": "assets/urunler/diorama/pokemon-karagoz-savasi/donus.webp"
  },
  {
    "id": "doom-1993-koridoru",
    "ad": {
      "tr": "Doom (1993) Ahşap Koridor: Cacodemon ve Chaingunner",
      "en": "Doom (1993) Wooden Corridor: Cacodemon and Chaingunner"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/doom-1993-koridoru/kart.webp",
    "galeri": [
      "assets/urunler/diorama/doom-1993-koridoru/1.webp",
      "assets/urunler/diorama/doom-1993-koridoru/2.webp",
      "assets/urunler/diorama/doom-1993-koridoru/3.webp",
      "assets/urunler/diorama/doom-1993-koridoru/4.webp",
      "assets/urunler/diorama/doom-1993-koridoru/5.webp",
      "assets/urunler/diorama/doom-1993-koridoru/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/doom-1993-koridoru/k1.webp",
      "assets/urunler/diorama/doom-1993-koridoru/k2.webp",
      "assets/urunler/diorama/doom-1993-koridoru/k3.webp",
      "assets/urunler/diorama/doom-1993-koridoru/k4.webp",
      "assets/urunler/diorama/doom-1993-koridoru/k5.webp",
      "assets/urunler/diorama/doom-1993-koridoru/k6.webp"
    ],
    "raf": "assets/urunler/diorama/doom-1993-koridoru/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 72
    },
    "parca": 10,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Doom'un ahşap koridoru birinci şahıs bakışıyla: önde pompalı tüfek, eller ve namlu alevi, altta oyunun durum çubuğu (AMMO, HEALTH, ARMS, ARMOR). Yükseltilmiş taş zeminde bir Chaingunner duruyor, koridorun ortasında Cacodemon havada asılı. Arka duvar koridorun perspektifli devamını gösterir; iki yan duvar ve kaya tavan sahneyi bir kutu gibi çevreler. Sticker'lar elle yapıştırılır; 10 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "Doom's wooden corridor in first-person view: a shotgun, hands and muzzle flash up front, and the game's status bar (AMMO, HEALTH, ARMS, ARMOR) below. A Chaingunner stands on the raised stone floor while a Cacodemon floats mid-corridor. The back wall continues the corridor in perspective; two side walls and a rock ceiling box the scene in. The stickers are applied by hand; 10 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (10 plaka); ayrı parça yok, koridor tavanı yan duvarların tırnaklarına takılı gelir ve takılıp çıkarılabilir. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (10 plates); no loose parts: the corridor ceiling comes clipped onto the side walls' tabs and lifts off. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/doom-1993-koridoru/donus.mp4",
    "video_boyut": {
      "g": 314,
      "y": 202
    },
    "video_kapak": "assets/urunler/diorama/doom-1993-koridoru/donus.webp"
  },
  {
    "id": "mortal-kombat-the-pit",
    "ad": {
      "tr": "Mortal Kombat The Pit: Scorpion ve Sub-Zero, FINISH HIM Anı",
      "en": "Mortal Kombat The Pit: Scorpion and Sub-Zero, the FINISH HIM Moment"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/mortal-kombat-the-pit/kart.webp",
    "galeri": [
      "assets/urunler/diorama/mortal-kombat-the-pit/1.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/2.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/3.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/4.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/5.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/mortal-kombat-the-pit/k1.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/k2.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/k3.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/k4.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/k5.webp",
      "assets/urunler/diorama/mortal-kombat-the-pit/k6.webp"
    ],
    "raf": "assets/urunler/diorama/mortal-kombat-the-pit/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 7,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Mortal Kombat'ın The Pit köprüsünde FINISH HIM anı: Scorpion'un mızrak ipinin ucu Sub-Zero'nun göğsünde. Arkada mor gök, dağlar, iki heykel ve kemerli sur, üstte skor ve süre var; iki can barı duvarın önünde ayrı plakalarda asılı, Sub-Zero'nunki boş. Kırmızı FINISH HIM yazısı siyah tabelasıyla duvarda duruyor. Sticker'lar elle yapıştırılır; 7 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "The FINISH HIM moment on Mortal Kombat's The Pit bridge: the tip of Scorpion's spear rope is in Sub-Zero's chest. Behind them are a purple sky, mountains, two statues and an arched wall, with the score and timer on top; the two health bars hang on separate plates in front of the wall, Sub-Zero's empty. The red FINISH HIM sign stands on the wall with its black board. The stickers are applied by hand; 7 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (7 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (7 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/mortal-kombat-the-pit/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 302
    },
    "video_kapak": "assets/urunler/diorama/mortal-kombat-the-pit/donus.webp"
  },
  {
    "id": "super-mario-1-1",
    "ad": {
      "tr": "Super Mario 1-1: Bloğa Zıplayan Mario",
      "en": "Super Mario 1-1: Mario Jumping at the Block"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/super-mario-1-1/kart.webp",
    "galeri": [
      "assets/urunler/diorama/super-mario-1-1/1.webp",
      "assets/urunler/diorama/super-mario-1-1/2.webp",
      "assets/urunler/diorama/super-mario-1-1/3.webp",
      "assets/urunler/diorama/super-mario-1-1/4.webp",
      "assets/urunler/diorama/super-mario-1-1/5.webp",
      "assets/urunler/diorama/super-mario-1-1/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/super-mario-1-1/k1.webp",
      "assets/urunler/diorama/super-mario-1-1/k2.webp",
      "assets/urunler/diorama/super-mario-1-1/k3.webp",
      "assets/urunler/diorama/super-mario-1-1/k4.webp",
      "assets/urunler/diorama/super-mario-1-1/k5.webp",
      "assets/urunler/diorama/super-mario-1-1/k6.webp"
    ],
    "raf": "assets/urunler/diorama/super-mario-1-1/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 5,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Super Mario'nun 1-1 bölümünden bir an: Mario zıplamış, yumruğu tuğla sırasındaki bloğa değiyor ve bloğun üstünde mantar çıkmış. Zeminde çalı ve boru, kuşbakışı zemin blokları; arka duvarda gök ve üstte skor, altın, dünya ve süre göstergesi var. Sticker'lar elle yapıştırılır; 5 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "A moment from Super Mario's level 1-1: Mario has jumped, his fist hitting a block in the brick row, and a mushroom has popped out on top. A bush and a pipe stand on the ground among the floor blocks; the back wall shows the sky, with the score, coins, world and time bar on top. The stickers are applied by hand; 5 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (5 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (5 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/super-mario-1-1/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 302
    },
    "video_kapak": "assets/urunler/diorama/super-mario-1-1/donus.webp"
  },
  {
    "id": "duck-hunt",
    "ad": {
      "tr": "Duck Hunt (1984): Ördeği Kaldıran Köpek",
      "en": "Duck Hunt (1984): The Dog Holding Up the Duck"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/duck-hunt/kart.webp",
    "galeri": [
      "assets/urunler/diorama/duck-hunt/1.webp",
      "assets/urunler/diorama/duck-hunt/2.webp",
      "assets/urunler/diorama/duck-hunt/3.webp",
      "assets/urunler/diorama/duck-hunt/4.webp",
      "assets/urunler/diorama/duck-hunt/5.webp",
      "assets/urunler/diorama/duck-hunt/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/duck-hunt/k1.webp",
      "assets/urunler/diorama/duck-hunt/k2.webp",
      "assets/urunler/diorama/duck-hunt/k3.webp",
      "assets/urunler/diorama/duck-hunt/k4.webp",
      "assets/urunler/diorama/duck-hunt/k5.webp",
      "assets/urunler/diorama/duck-hunt/k6.webp"
    ],
    "raf": "assets/urunler/diorama/duck-hunt/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 7,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Duck Hunt'tan bir an: köpek, çimenlerin arkasından vurduğu ördeği kaldırıyor. Solda ağaç, sağda çalı, önde çimen bandı var; arka duvar düz NES gökyüzü. En önde oyunun alt paneli duruyor: tur, kalan fişek, vurulan ördek sayacı ve skor. Sticker'lar elle yapıştırılır; 7 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "A moment from Duck Hunt: the dog rises from behind the grass, holding up the duck it has shot. A tree on the left, a bush on the right and a strip of grass in front; the back wall is the plain NES sky. At the very front sits the game's bottom panel: round, shots left, duck counter and score. The stickers are applied by hand; 7 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (7 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (7 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/duck-hunt/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 302
    },
    "video_kapak": "assets/urunler/diorama/duck-hunt/donus.webp"
  },
  {
    "id": "undertale-karanliklar-efendisi",
    "ad": {
      "tr": "Undertale: Karanlıklar Efendisi ve Tahttaki Kedi",
      "en": "Undertale: The Lord of Darkness and the Cat on the Throne"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/undertale-karanliklar-efendisi/kart.webp",
    "galeri": [
      "assets/urunler/diorama/undertale-karanliklar-efendisi/1.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/2.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/3.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/4.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/5.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/undertale-karanliklar-efendisi/k1.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/k2.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/k3.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/k4.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/k5.webp",
      "assets/urunler/diorama/undertale-karanliklar-efendisi/k6.webp"
    ],
    "raf": "assets/urunler/diorama/undertale-karanliklar-efendisi/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 6,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Undertale tarzı bir savaş ekranı: yeşil ızgaralı siyah fonun önünde boynuzlu, kanatlı, dikenli taçlı bir taht ve oturağında siyah-beyaz bir kedi. Diyalog kutusunda \"Karanlıklar Efendisi sana yaklaşıyor\" yazıyor, altında LV 1 ve HP 20 / 20 var. Önde SAVAŞ, EYLEMLER, ÇANTA ve MERHAMET düğmeleri sıralanıyor; SAVAŞ seçili. Sticker'lar elle yapıştırılır; 6 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "An Undertale-style battle screen: against a black background with a green grid stands a horned, winged throne with a spiked crown, and a black-and-white cat sits on it. The dialogue box reads \"Karanlıklar Efendisi sana yaklaşıyor\" (the Lord of Darkness approaches you), with LV 1 and HP 20 / 20 below. The SAVAŞ, EYLEMLER, ÇANTA and MERHAMET buttons (fight, act, item, mercy) line up in front, with SAVAŞ selected. The stickers are applied by hand; 6 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (6 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (6 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/undertale-karanliklar-efendisi/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 302
    },
    "video_kapak": "assets/urunler/diorama/undertale-karanliklar-efendisi/donus.webp"
  },
  {
    "id": "itachi-nin-tahti",
    "ad": {
      "tr": "Naruto Shippuden: Itachi'nin Tahtı ve Sasuke",
      "en": "Naruto Shippuden: Itachi's Throne and Sasuke"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/itachi-nin-tahti/kart.webp",
    "galeri": [
      "assets/urunler/diorama/itachi-nin-tahti/1.webp",
      "assets/urunler/diorama/itachi-nin-tahti/2.webp",
      "assets/urunler/diorama/itachi-nin-tahti/3.webp",
      "assets/urunler/diorama/itachi-nin-tahti/4.webp",
      "assets/urunler/diorama/itachi-nin-tahti/5.webp",
      "assets/urunler/diorama/itachi-nin-tahti/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/itachi-nin-tahti/k1.webp",
      "assets/urunler/diorama/itachi-nin-tahti/k2.webp",
      "assets/urunler/diorama/itachi-nin-tahti/k3.webp",
      "assets/urunler/diorama/itachi-nin-tahti/k4.webp",
      "assets/urunler/diorama/itachi-nin-tahti/k5.webp",
      "assets/urunler/diorama/itachi-nin-tahti/k6.webp"
    ],
    "raf": "assets/urunler/diorama/itachi-nin-tahti/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 5,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Naruto Shippuden'den Uchiha sığınağı sahnesi: Itachi taş tahtının yanında, kılıcı önde uzanıyor; sağda Sasuke kılıcının kabzasını kavramış bekliyor. Çatlak taş duvar ve arkadaki flama sahnenin yeşil-gri tonunu tamamlar. Sticker'lar elle yapıştırılır; 5 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "The Uchiha hideout scene from Naruto Shippuden: Itachi sits by his stone throne with his sword stretched out in front, while Sasuke waits on the right, gripping his sword's hilt. A cracked stone wall and the banner behind complete the scene's green-grey palette. The stickers are applied by hand; 5 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (5 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (5 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/itachi-nin-tahti/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 302
    },
    "video_kapak": "assets/urunler/diorama/itachi-nin-tahti/donus.webp"
  },
  {
    "id": "iroh-un-agidi",
    "ad": {
      "tr": "Avatar: Iroh'un Ağıdı (Leaves from the Vine)",
      "en": "Avatar: Iroh's Lament (Leaves from the Vine)"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/iroh-un-agidi/kart.webp",
    "galeri": [
      "assets/urunler/diorama/iroh-un-agidi/1.webp",
      "assets/urunler/diorama/iroh-un-agidi/2.webp",
      "assets/urunler/diorama/iroh-un-agidi/3.webp",
      "assets/urunler/diorama/iroh-un-agidi/4.webp",
      "assets/urunler/diorama/iroh-un-agidi/5.webp",
      "assets/urunler/diorama/iroh-un-agidi/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/iroh-un-agidi/k1.webp",
      "assets/urunler/diorama/iroh-un-agidi/k2.webp",
      "assets/urunler/diorama/iroh-un-agidi/k3.webp",
      "assets/urunler/diorama/iroh-un-agidi/k4.webp",
      "assets/urunler/diorama/iroh-un-agidi/k5.webp",
      "assets/urunler/diorama/iroh-un-agidi/k6.webp"
    ],
    "raf": "assets/urunler/diorama/iroh-un-agidi/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 111
    },
    "parca": 9,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker; sol yan duvar ve ağacın üst kapağı sticker'sız PLA.",
      "en": "PLA plates (3D printed) + printed stickers; the left side wall and the tree's top cap are bare PLA."
    },
    "aciklama": {
      "tr": "Avatar: Son Hava Bükücü'den Iroh'un ağıdı: gün batımında büyük bir ağacın dibinde oturan Iroh, oğlu Lu Ten'i anıyor. Ağaç gövdesi ayrı bir plaka olarak öne çıkar, arkada turuncu gökyüzü ve uçuşan yapraklar görünür. Koyu üst ve yan çerçeve sahneyi bir pencere gibi kapatır. Sticker'lar elle yapıştırılır; 9 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "Iroh's lament from Avatar: The Last Airbender: at sunset Iroh sits at the foot of a great tree, remembering his son Lu Ten. The trunk stands out on its own plate, with an orange sky and drifting leaves behind. A dark top and side frame closes the scene like a window. The stickers are applied by hand; 9 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (9 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (9 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/iroh-un-agidi/donus.mp4",
    "video_boyut": {
      "g": 300,
      "y": 308
    },
    "video_kapak": "assets/urunler/diorama/iroh-un-agidi/donus.webp"
  },
  {
    "id": "rock-lee-ve-gaara",
    "ad": {
      "tr": "Naruto: Rock Lee, Gaara ve Kum Dikenleri",
      "en": "Naruto: Rock Lee, Gaara and the Sand Spikes"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/rock-lee-ve-gaara/kart.webp",
    "galeri": [
      "assets/urunler/diorama/rock-lee-ve-gaara/1.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/2.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/3.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/4.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/5.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/rock-lee-ve-gaara/k1.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/k2.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/k3.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/k4.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/k5.webp",
      "assets/urunler/diorama/rock-lee-ve-gaara/k6.webp"
    ],
    "raf": "assets/urunler/diorama/rock-lee-ve-gaara/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 5,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "Naruto'dan Rock Lee ile Gaara'nın dövüşü, manga paneli gibi: Lee öne atılırken arkasında su kabağıyla Gaara duruyor, en önde kum dikenleri yükseliyor. Mavi hız çizgileri ve ses efekti yazısı arka plakadadır. Rock Lee'nin plakası ince bir ayakla zemine bağlandığı için havada süzülür. Sticker'lar elle yapıştırılır; 5 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "Rock Lee's fight with Gaara from Naruto, drawn like a manga panel: Lee lunges forward while Gaara stands behind with his gourd, and sand spikes rise at the very front. Blue speed lines and a sound-effect word sit on the back plate. Rock Lee's plate rests on a thin leg, so he seems to float. The stickers are applied by hand; 5 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (5 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (5 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/rock-lee-ve-gaara/donus.mp4",
    "video_boyut": {
      "g": 288,
      "y": 270
    },
    "video_kapak": "assets/urunler/diorama/rock-lee-ve-gaara/donus.webp"
  },
  {
    "id": "kara-sakal-ve-hasir-sapkalilar",
    "ad": {
      "tr": "One Piece: Kara Sakal, Luffy, Zoro ve Nami",
      "en": "One Piece: Blackbeard, Luffy, Zoro and Nami"
    },
    "yuva": "raf",
    "grup": "diorama",
    "durum": "sayfa-yok",
    "magaza": null,
    "fiyat": null,
    "gorsel": "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/kart.webp",
    "galeri": [
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/1.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/2.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/3.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/4.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/5.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/6.webp"
    ],
    "kucuk": [
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/k1.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/k2.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/k3.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/k4.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/k5.webp",
      "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/k6.webp"
    ],
    "raf": "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/raf.webp",
    "olcu": {
      "g": 127,
      "d": 78,
      "y": 108
    },
    "parca": 7,
    "malzeme": {
      "tr": "PLA plakalar (3B baskı) + baskılı sticker.",
      "en": "PLA plates (3D printed) + printed stickers."
    },
    "aciklama": {
      "tr": "One Piece'ten Mock Town sahnesi: Kara Sakal elinde şişesiyle oturmuş \"People's dreams never end!\" diye haykırırken önünde Nami, Zoro ve Luffy duruyor. Söz, arka duvardan öne çıkan ayrı plakadaki manga balonlarında; arkada kırmızı ses efekti yazısı ve kasaba evleri var. Sticker'lar elle yapıştırılır; 7 PLA plaka katman katman dizilerek derinlik kazanır.",
      "en": "The Mock Town scene from One Piece: Blackbeard sits with a bottle in hand, shouting \"People's dreams never end!\", while Nami, Zoro and Luffy stand before him. The words sit in manga balloons on a separate plate that juts out from the back wall, with a red sound-effect word and town houses behind. The stickers are applied by hand; 7 PLA plates are layered for depth."
    },
    "kutu": {
      "tr": "1 adet kurulu diorama (7 plaka); ayrı parça yok. Koruyucu dolguyla karton kutuda gönderilir.",
      "en": "1 assembled diorama (7 plates); no loose parts. Shipped in a cardboard box with protective padding."
    },
    "video": "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/donus.mp4",
    "video_boyut": {
      "g": 288,
      "y": 282
    },
    "video_kapak": "assets/urunler/diorama/kara-sakal-ve-hasir-sapkalilar/donus.webp"
  },
  {
    "id": "katana-sebat",
    "ad": {
      "tr": "Katlanır katana Sebat",
      "en": "Folding katana Sebat"
    },
    "yuva": "kilic",
    "durum": "stok-yok",
    "magaza": "https://oktosworkshop.com/katlanir-katana-kilic-sebat-tasinabilir-japon-tarzi-dekoratif-kilic",
    "fiyat": "599 TL",
    "gorsel": "assets/urunler/magaza/katana-sebat.webp"
  },
  {
    "id": "skeleton-mask",
    "ad": {
      "tr": "Skeleton Mask · Tertip / Tedbir",
      "en": "Skeleton Mask · Tertip / Tedbir"
    },
    "yuva": "maske",
    "durum": "satista",
    "magaza": "https://oktosworkshop.com/skeleton-mask-tertip-tedbir",
    "fiyat": "799 TL",
    "gorsel": "assets/urunler/magaza/skeleton-mask.webp"
  },
  {
    "id": "akademi-atlisi",
    "ad": {
      "tr": "Akademi Atlısı",
      "en": "Akademi Atlısı"
    },
    "yuva": "biblo",
    "durum": "stok-yok",
    "magaza": "https://oktosworkshop.com/akademi-atlisi",
    "fiyat": "699 TL",
    "gorsel": "assets/urunler/magaza/akademi-atlisi.webp"
  },
  {
    "id": "kadere-kinali",
    "ad": {
      "tr": "Kadere Kınalı",
      "en": "Kadere Kınalı"
    },
    "yuva": "biblo",
    "durum": "stok-yok",
    "magaza": "https://oktosworkshop.com/kadere-kinali",
    "fiyat": "749 TL",
    "gorsel": "assets/urunler/magaza/kadere-kinali.webp"
  },
  {
    "id": "kapital-kagan",
    "ad": {
      "tr": "Kapital Kağan",
      "en": "Kapital Kağan"
    },
    "yuva": "biblo",
    "durum": "stok-yok",
    "magaza": "https://oktosworkshop.com/kapital-kagan",
    "fiyat": "799 TL",
    "gorsel": "assets/urunler/magaza/kapital-kagan.webp"
  }
];

export const ESKI_KIMLIK = {
  "agac-dibinde-agit": "iroh-un-agidi",
  "ahsap-koridor": "doom-1993-koridoru",
  "ates-ejderi": "charizard",
  "bloga-ziplayan-tesisatci": "super-mario-1-1",
  "cicek-sirtli": "venusaur",
  "kara-buyucu": "dark-magician",
  "karagoz-duellosu": "pokemon-karagoz-savasi",
  "kart-kutusu": "tcg-kutu",
  "kopruda-son-vurus": "mortal-kombat-the-pit",
  "korsan-kasabasi": "kara-sakal-ve-hasir-sapkalilar",
  "kum-dikenleri": "rock-lee-ve-gaara",
  "lotus": "black-lotus",
  "ordegi-kaldiran-kopek": "duck-hunt",
  "su-kaplumbagasi": "blastoise",
  "tahttaki-kedi": "undertale-karanliklar-efendisi",
  "tas-taht": "itachi-nin-tahti"
};
