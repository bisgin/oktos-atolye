// Sipariş ayarları. Boş bırakılan alan arayüzde gösterilmez.
// whatsapp: ülke koduyla, boşluksuz (0543 486 90 70 → 905434869070). Boşsa e-posta kullanılır;
// ikisi de boşsa "Sipariş hattı henüz ayarlanmadı" bildirimi çıkar.
// Fiyat tahmini = max(minPrice, gram × pricePerGram). Gram, PLA yoğunluğuyla (1.24) %100 dolu hesaplanır;
// gerçek baskıda doluluk düşük olduğu için tahmin üst sınıra yakındır. (Kullanıcı kararı 2026-10-15.)
export const ORDER = {
  whatsapp: '905434869070',
  email: '',
  currency: '₺',
  pricePerGram: 2,    // TL / gram (kg başı 2.000 TL)
  minPrice: 400,      // en düşük sipariş tutarı, TL
  lead: { tr: '1 hafta', en: '1 week' }, // teslim süresi
  // ikas tasarım paketleri (kullanıcı kararı 2026-11-03). Açıkken "Sipariş ver" aracın paket sınıfının
  // (core/paket-sinif.js) mağaza sayfasını açar, tasarım bağlantısını panoya kopyalar; parçalı/özel sipariş
  // her durumda WhatsApp. Kapalıyken bugünkü WhatsApp akışı. Paket sayfaları yayına girince tek satır: true.
  paketlerYayinda: false,
  paketler: {
    bronz: 'https://oktosworkshop.com/oktos-tasarim-paketi-bronz',
    gumus: 'https://oktosworkshop.com/oktos-tasarim-paketi-gumus',
    altin: 'https://oktosworkshop.com/oktos-tasarim-paketi-altin',
    platin: 'https://oktosworkshop.com/oktos-tasarim-paketi-platin',
  },
};
