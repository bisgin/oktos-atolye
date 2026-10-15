// Sipariş ayarları. Boş bırakılan alan arayüzde gösterilmez.
// whatsapp: ülke koduyla, boşluksuz (örn. '905551112233'). Boşsa e-posta kullanılır; ikisi de boşsa
// "Sipariş hattı henüz ayarlanmadı" bildirimi çıkar.
export const ORDER = {
  whatsapp: '',
  email: '',
  currency: '₺',
  pricePerGram: null, // TL / gram (PLA). Örn. 3.5
  minPrice: null,     // en düşük sipariş tutarı, TL
  leadDays: null,     // teslim süresi metni, örn. '3–5'
};
