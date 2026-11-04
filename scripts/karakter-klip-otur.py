# Oturma geçişlerinin düzeltmesi (otur, otur2, kalk; 2026-11-03, kullanıcı: "sandalyesine gider, oturma animasyonları
# düzeltilmeli"). Klipler Mixamo'nun alçak sandalye oturuşları; sitenin oyuncu koltuğu karakterin boyuna göre yüksek
# (oturak üstü 540 mm, ayakta kalça 459 mm). Site gövdeyi klibin meta'sına göre taşır: z (gövde yüksekliği), ileri
# (gövdenin köke göre kayması, yerel −y; klip sonunda köke aktarılır), koltuk (koltuk merkezinin kökün arkasındaki mm'si).
# Ölçüm (scripts/karakter-klip-olc.py, önce):
#   - Koltuk kökün 184,5 mm arkasında: oturağın ön kenarı kökün 76 mm ÖNÜNDE, ayakta duran karakterin kalçası oturağın
#     içinde başlıyor (otur ve otur2'de klip başından, kalk'ta sonunda).
#   - Gövde 55–81. karelerde (otur) yavaşça 335 mm yükseliyor: ayaklar yerden kalkıp süzülüyor, popo oturağın ön
#     yüzünden 156–161 mm aşağıdan geçiyor.
#   - Oturunca kalça koltuk merkezinin 70 mm arkasında (masa pozunda 14,5 mm önünde): sırt koltuk sırtına 48 mm giriyor
#     (masa pozunda 18–29); geçişte masa pozuna kayınca koltuk sıçrıyor gibi görünüyor.
# Düzeltme (yalnız meta; klip kareleri aynı): koltuk dünyada yerinde durur (kökün 480/500 mm arkasında, oturağın ön
# kenarı popodan ~40 mm geride); karakter oturmaya başlarken kısa bir sıçrayışla yükselir (gövde 7 karede ~110 mm,
# 23 karede 335 mm), aynı anda 'ileri' ile geriye, oturağın üstüne süzülür ve iner (inis karesinde minder ezilir).
# Oturuşta kalça koltuk merkezine masa pozundaki gibi yakın (sırt girişi masa pozu düzeyinde). Kalkarken koltuk
# altından geri kayar (tekerlekli), karakter öne, yere sıçrar; koltuk otur'un başladığı yere (480) döner.
# Kullanım: karakter-kaynak-kur.py exec eder (karakter-klipler.py'den sonra) ve otur_duzelt() çağırır.
import bpy, json

OTUR_META = {
    # otur (Koltuğa Oturma, 164 kare): 52–75 sıçrayış, 58–80 geriye; 134–164 koltukla birlikte masaya doğru kayar
    'Koltuğa Oturma': {'z': [[52, 0], [59, 110], [67, 290], [75, 335]], 'ileri': [[58, 0], [80, -274]],
                       'koltuk': [[1, 480], [134, 480], [164, 266.5]], 'inis': 77,
                       'sinir': {'oturmaya_basla': 52, 'oturdu': 77, 'masada': 164}},
    # otur2 (Oturmaya Geçiş, 68 kare): klip başında kalça kökün 204 mm önünde (gövde geri kaydırılır); 8–36 sıçrayış
    'Oturmaya Geçiş': {'z': [[8, 0], [14, 140], [21, 310], [28, 340], [36, 327.5]], 'ileri': [[1, -204], [19, -204], [44, -507.5]],
                       'koltuk': 500, 'inis': 44, 'sinir': {'oturmaya_basla': 8, 'oturdu': 44, 'masada': 68}},
    # kalk (Koltuktan Kalkma, 176 kare): 1–24 kalça koltukla geri kayar; 62–89 koltuk geri kayarken yere iner
    'Koltuktan Kalkma': {'z': [[62, 335], [70, 350], [80, 180], [89, 0]], 'koltuk': [[1, -7.5], [24, 205], [60, 205], [86, 480]],
                         'sinir': {'kalkmaya_basla': 62, 'ayakta': 89, 'bitti': 176}},
}


def otur_duzelt():
    for ad, m in OTUR_META.items():
        act = bpy.data.actions['Hareket - ' + ad]
        act['site_meta'] = json.dumps(m)
        print('OTUR', ad, act['site_meta'])
