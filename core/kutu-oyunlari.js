// Kutu oyunları rafının içeriği (TV altındaki raf, core/oda-portfolyo.js OYUNLAR sırasıyla: no 0–7). Odada bir kutuya
// tıklanınca Biggie onu rafın üstüne koyar; panel (core/oda-kutu-panel.js) kutunun dört yüzünü dört sayfa olarak gösterir,
// oklar kutuyu çevirir (sayfalar döngüsel).
//
// DOLDURMA (kullanıcı): metinlerin hepsi şimdilik TASLAK yer tutucusudur, uydurma bilgi yoktur. Her oyun için:
//   ad, kisa      : rafta üzerine gelince imlecin yanında görünen ad ve tek satır
//   sayfalar[0]   : oyunun tanımı (ne, kaç kişi, kaç dakika...)
//   sayfalar[1]   : "Benim katkım" (tasarım, kural, kalıp, baskı... senin payın) + görsel
//   sayfalar[2]   : üretim / malzeme notu + görsel
//   sayfalar[3]   : künye (yayıncı, tasarımcılar, yıl, rol)
//   gorsel        : site köküne göre yol (ör. 'assets/oda/kutu-oyunlari/1-katki.webp'); null iken panelde "Görsel eklenecek"
//   taslak        : true iken panelde "Taslak" etiketi görünür; içerik bitince false yap
// Her metin { tr, en }. Sıra rafın gözlerine göre: 0–3 sol göz (yatay yığın), 4 orta göz (kapağı öne), 5–7 sağ göz (dik).
const yer = (n) => ({
  tanim: { tr: `Taslak: ${n}. oyunun tanımı buraya (ne tür bir oyun, kaç kişi, kaç dakika).`, en: `Draft: describe game ${n} here (what kind of game, how many players, how long).` },
  katki: { tr: `Taslak: bu oyunda benim katkım buraya (tasarım, kural, kalıp, baskı).`, en: `Draft: my contribution to this game goes here (design, rules, moulds, printing).` },
  uretim: { tr: `Taslak: üretim ve malzeme notu buraya (baskı, döküm, boya, kutu).`, en: `Draft: production and material notes go here (printing, casting, paint, box).` },
  kunye: { tr: `Taslak: künye buraya (yayıncı, tasarımcılar, yıl, rolüm).`, en: `Draft: credits go here (publisher, designers, year, my role).` },
});
const oyun = (no) => {
  const n = no + 1, y = yer(n);
  return {
    no, taslak: true,
    ad: { tr: `Kutu oyunu ${n}`, en: `Board game ${n}` },
    kisa: { tr: 'Taslak: tek satırlık tanım buraya.', en: 'Draft: one-line description here.' },
    sayfalar: [
      { tur: 'tanim', metin: y.tanim, gorsel: null },
      { tur: 'katki', metin: y.katki, gorsel: null },
      { tur: 'uretim', metin: y.uretim, gorsel: null },
      { tur: 'kunye', metin: y.kunye, gorsel: null },
    ],
  };
};
// Sayfa başlıkları (dört yüz)
export const SAYFA_BASLIK = {
  tanim: { tr: 'Oyun', en: 'The game' },
  katki: { tr: 'Benim katkım', en: 'My contribution' },
  uretim: { tr: 'Üretim ve malzeme', en: 'Production and materials' },
  kunye: { tr: 'Künye', en: 'Credits' },
};
// Her oyunu ayrı düzenle: oyun(i) yerine nesneyi doğrudan yaz (biçim yukarıda)
export const KUTU_OYUNLARI = [oyun(0), oyun(1), oyun(2), oyun(3), oyun(4), oyun(5), oyun(6), oyun(7)];
export const kutuOyunu = (no) => KUTU_OYUNLARI.find((o) => o.no === no) ?? null;
