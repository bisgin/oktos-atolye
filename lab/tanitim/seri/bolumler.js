// Sosyal medya serisinin bölüm tanımları (saf veri). Her bölüm 900 kare (15 sn, 60 fps, dikey 1080×1920):
//   1) KESİT   0 – K        : film sahnesinin kesiti; film.html iframe'de, iç kareleri kesim listesiyle sürülür (düz kesme).
//   2) KIRILMA K – K+36     : vuruş karesi, zoom punch, hitmarker, kısa deep-fry, doodle patlama; delikten PS1 dünyası.
//   3) PS1     K+36 – 780   : ürün 360° döner; Oktos'un atölye cihazının ekranı (PS1 / retro oyun menüsü, ustanın aleti)
//                            ölçüyü ve malzemeyi kaydırır, ürün canlı değişir. Söylenen: "her ölçüye ve malzemeye
//                            uyarlarız" (Oktos uyarlar; müşteriye "kendin ayarla" ya da araç çağrışımı YOK).
//   4) DAMGA   780 – 810    : damga metni, ikinci patlama; patlamanın kâğıt çekirdeği ekranı kaplar.
//   5) FİNAL   810 – 900    : kâğıt zemin, logo, OKTOS, tek satır çağrı.
// K = kesimlerin toplam uzunluğu (bu bölümde 540). Süreler (KIRILMA 36, DAMGA 30, FİNAL 90) sabit; PS1 aradaki her şey.
// Yeni bölüm için doldurulacak alanlar: kesit (modül + kesimler + sesler), kirilma.odak (kesitin son karesinde ürünün
// ekran yeri), urun (bağdaştırıcı adı urunler.js'te, metinler, kaydırıcılar, malzeme sırası, akış kareleri), metin.
// Akış kareleri PS1 başına görelidir (p = kare − PS1 başı).
// Pilot dört bölüm (kullanıcı 2026-10-26): atölye/organizer (ön mühendislik), balkon/saksı (tasarım), FRP/zar (niş oyun),
// kafe/QR standı. Hepsi aynı dil; toplu satış ya da "işletmelere paket" söylemi yok; kapanış çağrısı aynı.

export const SERI = {
  fps: 60,
  toplam: 900,
  kirilma: 36,
  damga: 30,
  final: 90,
  // Final kartı çağrısı (bölümde metin.cagri ile ezilebilir). " · " sonrası vurgu renginde. Müşteri işi Oktos'a bırakır:
  // "kendin tasarla" ya da araç çağrışımı yapan metin yok (kullanıcı 2026-10-26).
  cagri: 'Fikrini getir · oktosworkshop.com',
};

// Malzemeler (ps1.js dokuları ve ışık ayarları bu anahtarlarla kurulur). Ad PS1 menüsünde büyük harfle yazılır.
export const MALZEMELER = {
  pla: { ad: 'PLA mat' },
  petg: { ad: 'PETG parlak' },
  recine: { ad: 'Şeffaf reçine' },
  seffaf: { ad: 'Şeffaf reçine' }, // zar: PS1 dilinde sıralı desenli yarı saydam
  renkli: { ad: 'Renkli reçine' },
  tas: { ad: 'Taş tozu' },
  mermer: { ad: 'Mermer epoksi' },
};

export const BOLUMLER = {
  atolye: {
    ad: 'Atölye / organizer',
    kesit: {
      modul: 's2-atolye',
      // Film İÇ kareleri [baş, son] (son dahil), düz kesme. #8 kuş bakışı: el kadraja girer, kulpa uzanır, çekiş, vidalar
      // dağılır, el çekilir (912–1050); el gidince söz "Bir organizer alsam… buraya sığar mı?" (1058–1170; yazı 1068'den
      // ~1,7 sn).
      // #9 yüz + düşünce: balon açılır (1208–1236), organizer ve not "Hazır almak yerine kendim tasarlayabilsem nasıl
      // olur?" (1246–1380; not 1258'den sona dek ekranda), gözle tartma ölçüsü; nefes kısaltıldı (1380→1392); tutamaçlar
      // organizeri 40 × 30'a oturtur (otur 'tik' k1512), 4 kare sonra kırılma.
      kesimler: [[912, 1050], [1058, 1170], [1208, 1236], [1246, 1380], [1392, 1515]],
      // Kesitteki film işaretlerinden sese girenler (tanitim.isaretler'e eşlenir): tur → seri sesi
      sesler: { tik: 'tik', dusunce: 'dusunce' },
    },
    kirilma: {
      // Kesitin son karesinde (k1515) balondaki organizerin ekran ortası: zoom punch, hitmarker ve patlama buradan
      odak: [592, 787],
      zoom: 1.5,
      // Hitmarker'lar (kırılma başına göre kare, odaktan kayma px)
      vurus: [[2, 0, 0], [5, 46, -38], [8, -42, 30]],
    },
    urun: {
      bagdastirici: 'organizer',
      // PS1 ekranı: Oktos'un atölye cihazı (müşterinin değil). cihaz üst etiket, panel başlığı, durum satırı
      cihaz: 'OKTOS TEZGÂHI',
      baslik: 'ORGANİZER',
      panel: 'UYARLAMA',
      tamOlcu: 'TAM ÖLÇÜ!',
      // Panelin alt satırı: [PS1 karesinden itibaren, metin] (yanıp sönen nokta ile)
      durum: [[0, 'ÇEKMECEYE UYARLANIYOR'], [110, 'ÖLÇÜ TAMAM'], [124, 'MALZEMEYE UYARLANIYOR']],
      // Çekmece iç ölçüsü (filmdeki gözle tartma: 40 × 30 cm): döner tablada kesik çizgi; ürün ona oturur
      cerceve: [400, 300],
      // Kaydırıcılar sırayla işler (imleç satır satır iner). Değer adım adım kayar, her adım bir 'tık'.
      // k: [başla, bitir] PS1'e göreli kare; min/max yalnız çubuk göstergesi için.
      kaydiricilar: [
        { id: 'w', etiket: 'EN', bas: 300, son: 400, adim: 10, min: 200, max: 500, birim: 'MM', k: [22, 62] },
        { id: 'd', etiket: 'BOY', bas: 200, son: 300, adim: 10, min: 100, max: 400, birim: 'MM', k: [70, 110] },
      ],
      malzeme: { etiket: 'MALZEME', sira: ['pla', 'petg', 'recine', 'tas', 'mermer'], k: [124, 142, 160, 178] },
      // İmlecin satır değiştirdiği kareler (EN → BOY → MALZEME)
      imlec: [0, 66, 116],
      // "TAM ÖLÇÜ!" (iki kaydırıcı da bitip ürün çerçeveye oturunca)
      tam: 110,
      // Dönüş: PS1 boyunca tam tur (+ başlangıç açısı, derece)
      donusBaslangic: -32,
    },
    metin: {
      damga: 'CANLANDI.',
      // cagri: 'Fikrini getir · oktosworkshop.com', (bölüme özel çağrı gerekirse)
    },
  },
  // ---------- Balkon / saksı (tasarım sütunu)
  balkon: {
    ad: 'Balkon / saksı (tasarım)',
    kesit: {
      modul: 's3-balkon',
      // #11 kapı ve güneş (1226–1345: kapıya yürür, kanat açılır, ışık, balkona çıkar, güneşte gülümser), #12 çiçekler:
      // "Çiçeklerim çok güzel…" (yazı ~1365'ten 1500'e), kırık ağızdan topak düşer (1436), kaş iner. #13: çene elde, düşünce
      // balonu, "Keşke bunlara da güzel kıyafetler giydirebilsem…" (~1530'dan sona), saksı balonda üç kez biçimlenir; son
      // biçim (uzun ince, lila) oturunca 1676'da kırılma. "Keşke böyle bir aracım olsaydı…" (1690+) BİLEREK dışarıda:
      // araç çağrışımı yok (kullanıcı 2026-10-26).
      kesimler: [[1226, 1500], [1506, 1676]],
      sesler: { tik: 'tik', dusunce: 'dusunce', toprak: 'toprak' },
    },
    kirilma: { odak: [710, 670], zoom: 1.5, vurus: [[2, 0, 0], [5, 40, -60], [8, -36, 52]] },
    urun: {
      bagdastirici: 'saksi',
      cihaz: 'OKTOS TEZGÂHI', baslik: 'SAKSI', panel: 'UYARLAMA',
      durum: [[0, 'ÇİÇEKLERE UYARLANIYOR'], [150, 'MALZEMEYE UYARLANIYOR']],
      kamera: { mesafe: 640, aci: 14, hedefZ: 128, fov: 50, kaydir: 34 },
      tabla: { R: 118 },
      renk: { pla: '#c4683f', petg: '#2f7d6d' }, // pişmiş toprak rengi PLA, koyu yeşil parlak PETG
      kaydiricilar: [
        { id: 'h', etiket: 'BOY', bas: 110, son: 170, adim: 10, min: 60, max: 220, birim: 'MM', k: [22, 70] },
        { id: 'bel', etiket: 'BEL', bas: 118, son: 78, adim: 5, min: 40, max: 140, birim: 'MM', k: [80, 136] },
      ],
      malzeme: { etiket: 'MALZEME', sira: ['pla', 'tas', 'mermer', 'petg'], k: [150, 192, 234] },
      imlec: [0, 76, 144],
      tam: null,
      donusBaslangic: -20,
    },
    metin: { damga: 'CANLANDI.' },
  },
  // ---------- FRP masası / zar seti (niş oyun sütunu)
  frp: {
    ad: 'FRP masası / zar (niş oyun)',
    kesit: {
      modul: 's4-frp',
      // #14 E zarları yumruğunda sallar, herkes eğilir, atar (1664–1747); #15 3B yakın plan: tavla zarları düşer, seker,
      // durur (1752–1900). #16 E3 kartı alır, "Keşke piyonlarımız gerçek olsa…" (~2025'ten), E: "Keşke FRP zarlarımız
      // olsa…" iki satır yazılınca (2125) 64 kare tutulur (yavaş itiş): üçüncü satır ("kendimiz tasarlayabildiğimiz…")
      // BİLEREK dışarıda (kullanıcı 2026-10-26: "kendin tasarla" çağrışımı yok). #17'den: üçü düşünür, E'nin balonunda
      // zarlar taştan reçineye döner (2310–2424); kırılma E'nin zar balonuna vurur.
      kesimler: [[1664, 1747], [1752, 1900], [2012, 2125, 64], [2310, 2424]],
      tutOdak: [600, 470],
      sesler: { tik: 'tik', dusunce: 'dusunce', zar: 'zar' },
    },
    kirilma: { odak: [840, 825], zoom: 1.55, vurus: [[2, 0, 0], [5, -60, 30], [8, 54, -36]] },
    urun: {
      bagdastirici: 'zar',
      cihaz: 'OKTOS TEZGÂHI', baslik: 'ZAR SETİ', panel: 'UYARLAMA',
      durum: [[0, 'OYUNA UYARLANIYOR'], [124, 'MALZEMEYE UYARLANIYOR']],
      kamera: { mesafe: 250, aci: 34, hedefZ: 6, fov: 50, kaydir: 44 },
      tabla: { R: 74, ust: '#2c3a36' }, // koyu oyun keçesi: şeffaf zar ve numaralar seçilsin
      kaydiricilar: [
        { id: 'b', etiket: 'BOYUT', bas: 16, son: 24, adim: 1, min: 10, max: 30, birim: 'MM', k: [20, 60] },
        { id: 'k', etiket: 'KENAR', bas: 0, son: 3, adim: 0.5, min: 0, max: 4, birim: 'MM', ondalik: 1, k: [70, 106] },
      ],
      malzeme: { etiket: 'MALZEME', sira: ['seffaf', 'renkli', 'mermer', 'tas'], k: [124, 150, 176] },
      imlec: [0, 66, 116],
      tam: null,
      donusBaslangic: 10,
    },
    metin: { damga: 'CANLANDI.' },
  },
  // ---------- Kafe / QR standı
  kafe: {
    ad: 'Kafe / QR standı',
    kesit: {
      modul: 's1-kafe',
      // #4 A elini kaldırır, "Bakar mısınız?" (282'den), garson güler, görmez (236–372); ikinci deneme "Bakar mısınız?!",
      // el havada asılı (376–474). #5 yüz asılır, el yanağa (490–596); düşünce balonu, masa, QR standı, "Şurada bir QR
      // olsa da sipariş verebilsem…" (~660'tan), vurgu halkası, tutuş (604–797).
      kesimler: [[236, 372], [376, 474], [490, 596], [604, 797]],
      sesler: { tik: 'tik', dusunce: 'dusunce' },
    },
    kirilma: { odak: [440, 710], zoom: 1.5, vurus: [[2, 0, 0], [5, 50, -40], [8, -46, 36]] },
    urun: {
      bagdastirici: 'qr',
      cihaz: 'OKTOS TEZGÂHI', baslik: 'QR STANDI', panel: 'UYARLAMA',
      durum: [[0, 'MASAYA UYARLANIYOR'], [122, 'MALZEMEYE UYARLANIYOR']],
      kamera: { mesafe: 370, aci: 15, hedefZ: 56, fov: 50, kaydir: 36 },
      tabla: { R: 96 },
      renk: { pla: '#5a8fcf' }, // balondaki standın mavisi
      kaydiricilar: [
        // BOY: kod boyu S değişir, menüde karonun boyu yazar (alt pay 11 + kod + başlık %28: tools/qr ile aynı)
        { id: 'S', etiket: 'BOY', bas: 50, son: 74, adim: 4, min: 30, max: 100, birim: 'MM', k: [20, 56], goster: (S) => Math.round(11 + S * 1.28) },
        { id: 'en', etiket: 'EN', bas: 80, son: 110, adim: 5, min: 50, max: 140, birim: 'MM', k: [66, 104] },
      ],
      malzeme: { etiket: 'MALZEME', sira: ['pla', 'petg', 'mermer', 'tas'], k: [122, 144, 166] },
      imlec: [0, 62, 110],
      tam: null,
      donusBaslangic: -24,
    },
    metin: { damga: 'CANLANDI.' },
  },
};

// Kesim: [baş, son] ya da [baş, son, tut] (son kare tut kadar daha bekler; yavaş itişle). Uzunluk = son − baş + 1 + tut.
const kesimBoyu = ([b, s, t = 0]) => s - b + 1 + t;
export function kesitUzunlugu(kesimler) {
  return kesimler.reduce((a, k) => a + kesimBoyu(k), 0);
}
// Seri karesi → kaynak (film iç) karesi
export function kaynakKaresi(kesimler, f) {
  let n = Math.max(0, f);
  for (const k of kesimler) {
    const L = kesimBoyu(k);
    if (n < L) return Math.min(k[0] + n, k[1]);
    n -= L;
  }
  return kesimler[kesimler.length - 1][1]; // kesitten sonrası: son kare donar (kırılmanın donuk karesi)
}
// Seri karesi bir tutmanın içindeyse ilerleme (0–1), değilse null
export function tutmaIlerleme(kesimler, f) {
  let o = 0;
  for (const [b, s, t = 0] of kesimler) {
    const L = s - b + 1;
    if (t > 0 && f >= o + L && f < o + L + t) return (f - o - L + 1) / t;
    o += L + t;
  }
  return null;
}
// Kaynak karesi → seri karesi (ses işaretleri için; kesitte yoksa null)
export function seriKaresi(kesimler, m) {
  let o = 0;
  for (const k of kesimler) {
    if (m >= k[0] && m <= k[1]) return o + (m - k[0]);
    o += kesimBoyu(k);
  }
  return null;
}

// Bölümün mutlak zaman çizelgesi (seri kareleri)
export function zamanCizelgesi(bolum) {
  const K = kesitUzunlugu(bolum.kesit.kesimler);
  const kir = K, ps1 = K + SERI.kirilma, dam = SERI.toplam - SERI.final - SERI.damga, fin = SERI.toplam - SERI.final;
  return { K, kirilma: kir, ps1, damga: dam, final: fin, toplam: SERI.toplam, ps1Sure: dam - ps1 };
}
