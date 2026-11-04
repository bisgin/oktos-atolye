// ÜRETİLMİŞ DOSYA, elle düzenleme: python scripts/paket-sinif-uret.py --katalog <katalog.json>
// Şablon → ikas tasarım paketi sınıfı (yalnız sınıf adı; fiyat/maliyet depoya girmez).
// oran: özel tasarımda katı gram → tahmini baskı gramı, bant: o gramın üst sınırına göre sınıf (son sınıf sınırsız).
// Katalog tarihi: 2026-11-03 01:29
export const PAKET_SINIF = {
 "sira": ["bronz","gumus","altin","platin"],
 "tabla": [325,320,320],
 "sablon": {
  "bin": {"tray":"bronz","desk":"altin","screws":"altin","drawer":"altin","pencup":"gumus","pencup3":"gumus","roundtray":"gumus","tools":"altin","cards":"bronz","g1":"bronz","g2":"bronz","g3":"bronz","g4":"bronz","g5":"bronz","g6":"bronz","p1":"bronz","p2":"bronz","p3":"bronz","p4":"gumus","p5":"gumus"},
  "vase": {"twist":"gumus","tall":"ozel","ribbed":"gumus","star":"altin","hex":"gumus","silk":"altin","amphora":"gumus","tulip":"altin","square":"gumus","flower":"gumus","organic":"altin","morph":"gumus"},
  "clicker": {"cat":"bronz","heart":"bronz","star":"bronz","boxed":"bronz","kedi":"bronz","kalp":"bronz","yildiz":"bronz","harf":"bronz"},
  "text": {"plate":"bronz","letters":"ozel","round":"bronz","door":"bronz","sign":"bronz","key":"bronz","harfler":"bronz","not":"bronz","kalp":"bronz","iyi":"bronz","mutlu":"bronz"},
  "flip": {"family":"gumus","us":"gumus","sea":"gumus","ask":"gumus"},
  "qr": {"wifi":"bronz","wifi_turuncu":"bronz","menu":"bronz","card":"bronz","card_turuncu":"bronz","card_ahsap":"bronz","card_koyu":"bronz","key":"bronz","key_yuvarlak":"bronz","coaster":"bronz"},
  "painter": {"mountain":"bronz","sea":"bronz","lake":"gumus","window":"gumus","card":"bronz"},
  "puzzle": {"picture":"altin","relief":"gumus","sphere":"altin","cube":"gumus","egg":"gumus","heart":"bronz"}
 },
 "oran": {
  "bin": {"katiDilim":0.636,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "bin:plate": {"katiDilim":0.635,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "bin:custom": {"katiDilim":0.874,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "bin:grid": {"katiDilim":0.51,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "vase": {"katiDilim":0.281,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "vase:hollow": {"katiDilim":0.906,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "vase:solid": {"katiDilim":0.195,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "clicker": {"katiDilim":0.471,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "clicker:tus": {"katiDilim":1.204,"bant":[["bronz",48.8],["gumus",109.9],["altin",219.8]]},
  "clicker:anahtarlik": {"katiDilim":0.443,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "text": {"katiDilim":0.558,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "text:anahtarlik": {"katiDilim":0.604,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "text:miknatis": {"katiDilim":0.556,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "text:plaka": {"katiDilim":0.555,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "flip": {"katiDilim":0.55,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "qr": {"katiDilim":0.582,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "qr:key": {"katiDilim":0.796,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "qr:card": {"katiDilim":0.529,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "qr:stand": {"katiDilim":0.647,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "painter": {"katiDilim":0.853,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "painter:kartpostal": {"katiDilim":0.932,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "painter:cerceve": {"katiDilim":0.814,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "painter:isiklik": {"katiDilim":0.884,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "puzzle": {"katiDilim":0.37,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "puzzle:sekil": {"katiDilim":0.342,"bant":[["bronz",60],["gumus",150],["altin",350]]},
  "puzzle:duz": {"katiDilim":0.472,"bant":[["bronz",60],["gumus",150],["altin",350]]}
 }
};
