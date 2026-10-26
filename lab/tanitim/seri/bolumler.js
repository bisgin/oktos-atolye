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
  // ---------- Taslaklar (iskelet hazır; kesim, odak ve bağdaştırıcı doldurulunca açılır). seri.js taslağı çalıştırmaz.
  balkon: {
    taslak: true,
    ad: 'Balkon / saksı (tasarım)',
    kesit: { modul: 's3-balkon', kesimler: null, sesler: { tik: 'tik', dusunce: 'dusunce' } },
    urun: { bagdastirici: 'saksi', baslik: 'SAKSI', not: 'tools/vase geometrisi; kaydırıcılar ör. BOY, ÇAP, MALZEME' },
    metin: { damga: 'CANLANDI.' },
  },
  frp: {
    taslak: true,
    ad: 'FRP masası / zar (niş oyun)',
    kesit: { modul: 's4-frp', kesimler: null, sesler: { tik: 'tik', dusunce: 'dusunce', zar: 'tik' } },
    urun: { bagdastirici: 'zar', baslik: 'ZAR', not: 'ürün ve geometri kaynağı belirlenecek (zar kulesi / tepsisi?)' },
    metin: { damga: 'CANLANDI.' },
  },
  kafe: {
    taslak: true,
    ad: 'Kafe / QR standı',
    kesit: { modul: 's1-kafe', kesimler: null, sesler: { tik: 'tik', dusunce: 'dusunce' } },
    urun: { bagdastirici: 'qr', baslik: 'QR STANDI', not: 'tools/qr masa standı; kaydırıcılar ör. EN, BOY, MALZEME' },
    metin: { damga: 'CANLANDI.' },
  },
};

// Kesim listesinin toplam uzunluğu ve seri karesi → kaynak (film iç) karesi
export function kesitUzunlugu(kesimler) {
  return kesimler.reduce((a, [b, s]) => a + (s - b + 1), 0);
}
export function kaynakKaresi(kesimler, f) {
  let n = Math.max(0, f);
  for (const [b, s] of kesimler) {
    const L = s - b + 1;
    if (n < L) return b + n;
    n -= L;
  }
  const son = kesimler[kesimler.length - 1];
  return son[1]; // kesitten sonrası: son kare donar (kırılmanın donuk karesi)
}
// Kaynak karesi → seri karesi (ses işaretleri için; kesitte yoksa null)
export function seriKaresi(kesimler, m) {
  let o = 0;
  for (const [b, s] of kesimler) {
    if (m >= b && m <= s) return o + (m - b);
    o += s - b + 1;
  }
  return null;
}

// Bölümün mutlak zaman çizelgesi (seri kareleri)
export function zamanCizelgesi(bolum) {
  const K = kesitUzunlugu(bolum.kesit.kesimler);
  const kir = K, ps1 = K + SERI.kirilma, dam = SERI.toplam - SERI.final - SERI.damga, fin = SERI.toplam - SERI.final;
  return { K, kirilma: kir, ps1, damga: dam, final: fin, toplam: SERI.toplam, ps1Sure: dam - ps1 };
}
