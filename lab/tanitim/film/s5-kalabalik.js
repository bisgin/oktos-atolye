// Sahne 5, KALABALIK "KEŞKE" (#5.1–#5.4, k2016–2375). Kalıp: v1-kanca.js (kur(ctx), MUTLAK kare zamanları).
// Mekân yok, düz kâğıt. Kamera kadrajın ALT kenarına kilitli: kafalar hep alttan çıkar; yakından (yatay 1,8, dikey 1,75)
// 1,1'e geri çekilir (sine.out: sahne doldukça açılır), devirde 1'e oturur. Kişiler iki sıra (arka sıra küçük, kâğıda doğru
// açılmış: opak soluk filtre). Herkesin bir düşünce balonu var, çoğu yalnız çizim.
// Yatay: her balon sahibinin başının üstünde (ön sıra alt bantta, arka sıra üst bantta), elle kaydırılmış ve boyları
// biraz farklı: ızgara değil, sık bir bulut. Dikey: YÜKSELEN YIĞIN. Balon sahibinin başının üstünde doğar (kuyruk başa
// iner); aynı şeritte (üç şerit) yeni bir fikir doğunca şerit bir basamak yukarı itilir, eski balonun kuyruğu kısalıp
// yan şeritlerde dışa-aşağı (sahiplerin yanına) döner. Fikirler kalabalığın üstünde birikir, yığın kamera geri çekildikçe gökyüzünü doldurur (orta şerit yarım
// basamak yukarıda: petek dizilişi).
// #5.1 (k2016) Kesme. N1 (yeni yüz) çıkar, balonunda basamaklı figür vitrini (üç kademe, figür yuvaları, isim şeridi).
//      k2024 kameraya döner, sorar (konuşma balonu, yazı k2030–2120): "Bunu canlandırabilir miyiz?". Söz kapanırken N2
//      çıkar, yapbozunu düşünür; E çıkar, ona bakar. Dikeyde N1'in balonu kamera geri çekilirken yükselir (ekranda üstte
//      kalır), kamera konuşma balonundan (sağ) N2'nin yapbozuna (sol şerit) kayar.
// #5.2 (k2126) N2 el yazısıyla: "Yapboz yapsam, 3B olur mu?". Kalabalık ~10 k arayla dolar: E (d20), B (organizer),
//      E4 (zar kulesi), A (kafede peçeteye çizdiği yaratık), N4 (Text Flip), E3 (piyon), N5 (kulaklık askısı),
//      N3 (Ankara Kalesi bloğu).
// #5.3 (k2226) Kalabalığın dileği, en üstte: "Keşke şöyle olsa…" (turuncu alt çizgi: dilek işareti), herkes yukarı,
//      fikirlerine bakar. Son gelenler: N6 (telefon standı), D (saksı), B3 (3B isim → kapı plakası), E2 (kutu oyunu),
//      Garson (kupa altlığı). Fikir değişir: zar kulesi → deste kutusu, Text Flip → fidget, kulaklık askısı → kablo klipsi.
// #5.4 DEVİR (k2312–2375, 64 k; kadro.json'daki 40 k'dan uzun, ARALIK): yedi balon söner; kalabalık kaybolmaz, ortadan
//      ikiye ayrılıp ritimle kenarlara çekilir (60 fps, küçük adım sekmeleri; yatayda sol/sağ alt köşeler, dikeyde altta
//      iki köşe, biraz geri çekilerek). Önce yürüdükleri yana, varınca yukarı bakarlar (merak). Sekiz balon (qrStandi,
//      organizer, saksi, d20, piyon, kutuOyunu, yapboz, telefonStandi; cizimler.js) sahiplerinin başlarının üstüne süzülüp
//      son boyuna büyür: alt kat bağlı kuyrukla, üst kat kısa kuyrukla sahibine doğru. Orta logoya, OKTOS'a, slogana boş.
//      k2375'te kamera odak(0,0,1): dünya = ekran. Son yerleşim SON_BALONLAR ve SON_KISILER (s6 bunları okur).
// Ölçek: her balon kendi tasarım boyunda (anahtar balonlarda SON boyunda) yerel (0,0) merkezli kurulur; kalabalıkta bir
// sarmalayıcı onu küçültür (kontur kalınlıkları tutarlı kalır), devirde sarmalayıcı birim dönüşüme gider. Balonun yeri,
// ölçeği ve kuyruğu tek bir vekil nesnede (pr) durur; itme ve devir tween'leri onu sürer, uygula() çizer.
// Gövde uzatma: insan.js gövdesi kutunun 860 birim altında biter; üst sıralarda bu kenar görünmesin diye gövde aşağı uzatılır.
// Renk (kullanıcı 2026-10-22): fikirler URUN_RENK'in açık tonlarıyla dolar, kontur mürekkep, kişiler mono. Ortak çizimler
// rengini cizimler.js'ten alır; bu modülün çizimlerine renk, komşu balonlarda (yatay iki sıra ve dikey üç şerit, son dizilişte
// ve doğum anında) aynı ton yan yana gelmeyecek biçimde verildi. Dolgu, konturu çizilirken belirir; fikir değişince söner.
// Tek ayrık: Ankara Kalesi bloğu taş tozu dökümü (kullanıcı 2026-10-25: açık gri-bej pastel); tonları aşağıda TAS'ta.
// Sorgu: ?yalniz=s5-kalabalik  ?yon=dikey  ?dil=en
import { cizimKur, CIZIMLER, URUN_RENK } from './cizimler.js';
import { oval, MONO, YAPI, rng, rastgeleKisi, boyKaymasi, BOY } from '../insan.js';

// Caveat ancak bir öğe kullanınca indirilir; document.fonts.ready onu beklemez. Konuşma balonu ve el yazısı genişliği
// ölçülerek yerleşir: ölçüm yedek yazı tipiyle yapılırsa kutu ve yer kayar. Bu yüzden modül yüklenirken yazı tipini iste.
try { await document.fonts.load('600 62px Caveat', 'Bunu canlandırabilir miyiz? Keşke şöyle olsa… Can we bring this to life?'); } catch { /* yoksa yedekle sürer */ }
// Kişi parametreleri modül düzeyinde de gerekir (son yerleşim, SON_KISILER, balon kuyrukları kurulumdan önce hesaplanır)
const KADRO = await (await fetch(new URL('./kadro.json', import.meta.url))).json();

// Devir 64 k (kadro.json'daki 40 k'dan uzun: kalabalık kenarlara ritimle çekilsin); s6 bir sonraki karede başlar
const BAS = 2016, SON = 2375, DEVIR = 2312;
export const ARALIK = [BAS, SON];
// Okunan üç satır: her biri yazılmaya başladığı andan silinmeye dek en az 90 k (tam yazılı ~70 k) ekranda
const SOZ1 = [2026, 2120], SATIR2 = 2126, SATIR2_SIL = 2218, KESKE = 2226, KESKE_SIL = 2316;
const KALINLIK = 4.4; // balon içi çizim konturu (tasarım boyunda)
const NBSP = ' '; // satır sonundaki ?'nin kuyruğu yazma maskesinde (clip-path) kırpılmasın

// ---------- Yeni fikir çizimleri (cizimler.js ile aynı dil: birim kutu, merkez 0,0, y aşağı, kapsam ±0,5)
// duz(): köşelerin yakınına nokta ekler; Catmull-Rom yolu kenarı düz, köşeyi sıkı yuvarlak çizer (yastık gibi şişmez).
function duz(pts, kapali = false) {
  const n = pts.length, son = kapali ? n : n - 1, d = [];
  for (let i = 0; i < son; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    d.push(a);
    for (const t of [0.14, 0.86]) d.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  if (!kapali) d.push(pts[n - 1]);
  return d;
}
// r: dolgu rengi (URUN_RENK ya da TAS anahtarı; yalnız kapalı konturda). Kontur sırası ve noktaları değişmedi (çizim ritmi aynı).
const C = (p, r) => ({ p: duz(p, true), kapali: true, r });  // köşeli kapalı kontur
const A = (p) => ({ p: duz(p) });                           // köşeli açık çizgi
const Y = (p, kapali = false, r) => ({ p, kapali, r });     // yumuşak (nokta dizisi olduğu gibi)
// Taş tozu (kale bloğu): ön yüz, kaya, yan yüz. Balon içi (#fbf9f5) ve kâğıttan (#f1ede6) ayrılacak kadar koyu, pastel.
const TAS = { tas: '#e2dacb', tasKoyu: '#d3c9b7', tasYan: '#c5baa6' };
const dolguRengi = (r) => URUN_RENK[r] ?? TAS[r];

// Basamaklı figür vitrini (N1): eğik bakış (derinlik sağ-yukarı, kademe başına 0,09 / −0,07). Kademe = ön yüz (gök) +
// basamak yüzü (beyaz: üstten ışık). Her basamakta üç yuva; birinde minik figür, ötekiler boş (gök oyuk). En altta isim
// şeridi. Figürler jenerik: yuvarlak baş, çan gövde (tanınan bir oyuncak dili değil); biri sivri şapkalı.
const VD = [0.09, -0.07];
const VK = [ // kademe: ön yüzün sol x'i, alt y'si, yüksekliği (genişlik 0,62)
  { x: -0.44, y: 0.44, h: 0.2 },
  { x: -0.35, y: 0.17, h: 0.15 },
  { x: -0.26, y: -0.05, h: 0.15 },
];
const VG = 0.62;
const vOn = ({ x, y, h }) => [[x, y - h], [x + VG, y - h], [x + VG, y], [x, y]];
const vBasamak = ({ x, y, h }) => [[x, y - h], [x + VG, y - h], [x + VG + VD[0], y - h + VD[1]], [x + VD[0], y - h + VD[1]]];
// Yuva merkezleri (basamağın orta derinliğinde): kademe başına üç
const vYuva = (i, j) => { const { x, y, h } = VK[i]; return [x + VD[0] / 2 + VG / 2 + (j - 1) * 0.2, y - h + VD[1] / 2]; };
const vFigur = ([fx, fy], r, sapka) => [
  C([[fx - 0.045, fy - 0.09], [fx + 0.045, fy - 0.09], [fx + 0.062, fy], [fx - 0.062, fy]], r),          // çan gövde
  Y(oval(fx, fy - 0.135, 0.052, 0.052, 0, 360, 12), true, r),                                            // iri baş
  ...(sapka ? [C([[fx - 0.048, fy - 0.175], [fx + 0.048, fy - 0.175], [fx + 0.01, fy - 0.27]], r)] : []), // sivri şapka
];
const YUVA_OVAL = (p) => Y(oval(p[0], p[1], 0.045, 0.018, 0, 360, 12), true, 'gok');

const YENI = {
  vitrin: [
    ...VK.flatMap((k) => [C(vOn(k), 'gok'), C(vBasamak(k), 'beyaz')]),
    // Sağ yan yüz: merdiven profili (tek parça)
    C([[0.18, 0.44], [0.18, 0.24], [0.27, 0.17], [0.27, 0.02], [0.36, -0.05], [0.36, -0.2], [0.45, -0.27], [0.45, 0.23]], 'gok'),
    // İsim şeridi ve isim karalaması
    C([[-0.36, 0.29], [0.1, 0.29], [0.1, 0.39], [-0.36, 0.39]], 'beyaz'),
    Y([[-0.31, 0.345], [-0.26, 0.315], [-0.22, 0.36], [-0.17, 0.315], [-0.12, 0.36], [-0.07, 0.32], [-0.02, 0.355], [0.04, 0.33]]),
    // Boş yuvalar (figürlü üç yuva hariç: alt sol, orta sağ, üst orta)
    ...[[0, 1], [0, 2], [1, 0], [1, 1], [2, 0], [2, 2]].map(([i, j]) => YUVA_OVAL(vYuva(i, j))),
    ...vFigur(vYuva(0, 0), 'limon'),
    ...vFigur(vYuva(1, 2), 'mercan', true),
    ...vFigur(vYuva(2, 1), 'nane'),
  ],
  // Ankara Kalesi bloğu (N3): avuç içi kadar taş tozu döküm. Ön yüz kale silüeti (mazgallı surlar, sol kule, yüksek iç
  // kale, sağ kule) kayalık tepenin üstünde; sağda bloğun kalınlığı. İç kalede kapı kemeri, kulelerde mazgal yarıkları.
  // Yalnız kale (başka yapı yok).
  kale: [
    C([[-0.44, 0.22],
      [-0.44, 0.04], [-0.39, 0.04], [-0.39, 0.09], [-0.34, 0.09], [-0.34, 0.04], [-0.29, 0.04], [-0.29, 0.09], [-0.24, 0.09], // alçak sur
      [-0.24, -0.16], [-0.19, -0.16], [-0.19, -0.11], [-0.15, -0.11], [-0.15, -0.16], [-0.1, -0.16], [-0.1, -0.02],        // sol kule
      [-0.06, -0.02], [-0.06, -0.07], [-0.01, -0.07], [-0.01, -0.02], [0.02, -0.02],                                    // ara sur
      [0.02, -0.42], [0.07, -0.42], [0.07, -0.37], [0.115, -0.37], [0.115, -0.42], [0.165, -0.42], [0.165, -0.37],       // iç kale
      [0.21, -0.37], [0.21, -0.42], [0.26, -0.42], [0.26, 0.05],
      [0.31, 0.05], [0.31, -0.14], [0.355, -0.14], [0.355, -0.09], [0.395, -0.09], [0.395, -0.14], [0.44, -0.14],        // sağ kule
      [0.44, 0.15], [0.34, 0.18], [0.22, 0.12], [0.08, 0.19], [-0.06, 0.14], [-0.2, 0.22], [-0.32, 0.17]], 'tas'),         // kaya çizgisi
    C([[-0.44, 0.22], [-0.32, 0.17], [-0.2, 0.22], [-0.06, 0.14], [0.08, 0.19], [0.22, 0.12], [0.34, 0.18], [0.44, 0.15], [0.44, 0.4], [-0.44, 0.4]], 'tasKoyu'),
    C([[0.44, -0.14], [0.49, -0.18], [0.49, 0.36], [0.44, 0.4]], 'tasYan'),
    Y([[0.1, 0.17], [0.1, 0.08], [0.14, 0.04], [0.18, 0.08], [0.18, 0.14]]), // kapı kemeri
    A([[0.14, -0.29], [0.14, -0.2]]), A([[-0.17, -0.06], [-0.17, 0.02]]), A([[0.375, -0.05], [0.375, 0.03]]), // mazgal yarıkları
    A([[-0.3, 0.27], [-0.24, 0.31]]), A([[0.13, 0.28], [0.2, 0.31]]), // kaya çatlakları
  ],
  // Kupa altlığı: altıgen altlık (eğik bakış, kalınlıklı) + üstünde kupa ve buhar
  kupaAltligi: [
    C([[-0.46, 0.24], [-0.24, 0.13], [0.24, 0.13], [0.46, 0.24], [0.24, 0.35], [-0.24, 0.35]], 'lila'),
    A([[-0.46, 0.24], [-0.46, 0.31], [-0.24, 0.42], [0.24, 0.42], [0.46, 0.31], [0.46, 0.24]]),
    A([[-0.19, -0.3], [-0.18, 0.21], [0.18, 0.21], [0.19, -0.3]]),
    Y(oval(0, -0.3, 0.19, 0.055, 0, 360, 14), true, 'seftaliKoyu'), // sütlü kahve
    Y([[0.19, -0.2], [0.31, -0.18], [0.33, -0.04], [0.3, 0.07], [0.18, 0.09]]),
    Y([[-0.06, -0.38], [-0.02, -0.43], [-0.06, -0.49]]),
    Y([[0.06, -0.38], [0.1, -0.43], [0.06, -0.49]]),
  ],
  // 3B isim yazısı: blok harfler "ADA" kalın kaide üstünde (harflerin derinlik izi yok: harf işareti gibi okunuyordu)
  isimYazisi: [
    A([[-0.44, 0.16], [-0.33, -0.22]]), A([[-0.33, -0.22], [-0.22, 0.16]]), A([[-0.39, 0.03], [-0.27, 0.03]]),
    Y([[-0.13, -0.22], [-0.13, 0.16], [-0.02, 0.16], [0.06, 0.1], [0.08, -0.03], [0.06, -0.16], [-0.02, -0.22]], true),
    A([[0.15, 0.16], [0.26, -0.22]]), A([[0.26, -0.22], [0.37, 0.16]]), A([[0.2, 0.03], [0.32, 0.03]]),
    C([[-0.48, 0.2], [0.42, 0.2], [0.5, 0.3], [-0.4, 0.3]], 'lila'),
    A([[-0.48, 0.2], [-0.48, 0.27], [-0.4, 0.37], [0.5, 0.37], [0.5, 0.3]]),
  ],
  // İsimli kapı plakası: ipte asılı yuvarlak köşeli plaka, vida delikleri, isim karalaması
  kapiPlakasi: [
    Y(oval(0, 0.08, 0.44, 0.24, 0, 360, 26, 4.6), true, 'mercan'),
    A([[-0.3, -0.13], [0, -0.42]]), A([[0, -0.42], [0.3, -0.13]]),
    Y(oval(0, -0.43, 0.035, 0.035, 0, 360, 8), true),
    Y([[-0.26, 0.1], [-0.2, 0.0], [-0.14, 0.12], [-0.07, 0.01], [0.0, 0.12], [0.07, 0.02], [0.13, 0.11], [0.19, 0.04]]),
    A([[-0.24, 0.2], [0.16, 0.2]]),
    Y(oval(-0.36, 0.08, 0.03, 0.03, 0, 360, 8), true, 'beyaz'), Y(oval(0.36, 0.08, 0.03, 0.03, 0, 360, 8), true, 'beyaz'), // vida başları
  ],
  // Text Flip: iki yüzünde iki ayrı harf okunan blok (önden A, yandan B) + altında döner tabla oku (çevirince öteki
  // kelime). Dişli blok ve bakış okları 100 px'te tarak gibi okunuyordu.
  textFlip: [
    C([[0, -0.06], [-0.36, -0.24], [-0.36, 0.2], [0, 0.38]], 'lila'),
    C([[0, -0.06], [0.36, -0.24], [0.36, 0.2], [0, 0.38]], 'lilaAcik'), // iki yüz iki ton: blok okunsun
    A([[-0.36, -0.24], [0, -0.42], [0.36, -0.24]]),
    A([[-0.29, 0.21], [-0.18, -0.08], [-0.07, 0.3]]), A([[-0.25, 0.13], [-0.11, 0.2]]),
    A([[0.1, 0.32], [0.1, -0.02]]),
    Y([[0.1, -0.02], [0.21, -0.06], [0.27, -0.01], [0.24, 0.08], [0.1, 0.13], [0.25, 0.11], [0.29, 0.19], [0.24, 0.27], [0.1, 0.32]]),
    Y(oval(0, 0.36, 0.48, 0.1, 18, 162, 12)),
    A([[-0.46, 0.4], [-0.4, 0.47]]), A([[-0.46, 0.4], [-0.37, 0.37]]),
  ],
  // Fidget clicker: kedi biçimli anahtarlık, ortasında klavye tuşu (dış ve üst yüz), bıyıklar, sağ üstte "tık" çizgileri.
  // (Düğmeli küp küçükken zar ya da kutu gibi okunuyordu; kulaklar ve tuş başlığı clicker'ı tanıtır.)
  fidget: [
    Y([[-0.33, 0.3], [-0.38, 0.06], [-0.35, -0.16], [-0.34, -0.43], [-0.15, -0.27], [0.15, -0.27], [0.34, -0.43], [0.35, -0.16], [0.38, 0.06], [0.33, 0.3], [0.17, 0.39], [-0.17, 0.39]], true, 'lila'),
    C([[-0.16, -0.12], [0.16, -0.12], [0.16, 0.2], [-0.16, 0.2]], 'lilaAcik'),
    C([[-0.1, -0.08], [0.1, -0.08], [0.1, 0.1], [-0.1, 0.1]], 'beyaz'), // tuş başlığı
    A([[-0.24, 0.1], [-0.47, 0.06]]), A([[-0.24, 0.18], [-0.46, 0.23]]),
    A([[0.24, 0.1], [0.47, 0.06]]), A([[0.24, 0.18], [0.46, 0.23]]),
    A([[0.42, -0.3], [0.49, -0.38]]), A([[0.45, -0.19], [0.54, -0.22]]),
  ],
  // Zar kulesi: kule (ön, üst, yan), çıkış kemeri, içteki rampalar, önde tepsi ve düşen zar
  zarKulesi: [
    C([[-0.22, -0.4], [0.14, -0.4], [0.14, 0.3], [-0.22, 0.3]], 'limon'),
    A([[-0.22, -0.4], [-0.12, -0.49], [0.24, -0.49], [0.14, -0.4]]),
    A([[0.24, -0.49], [0.24, 0.22], [0.14, 0.3]]),
    Y([[-0.14, 0.3], [-0.14, 0.17], [-0.08, 0.11], [0.0, 0.11], [0.06, 0.17], [0.06, 0.3]]),
    A([[-0.17, -0.28], [0.08, -0.17]]), A([[0.09, -0.05], [-0.16, 0.05]]),
    A([[-0.22, 0.3], [-0.42, 0.3], [-0.36, 0.42], [0.38, 0.42], [0.3, 0.3], [0.14, 0.3]]),
    C([[-0.33, 0.34], [-0.27, 0.29], [-0.21, 0.34], [-0.27, 0.39]], 'beyaz'), // zar
  ],
  // Deste kutusu: önü ve yanı, içinden çıkan iki kart, önde baklava işareti
  desteKutusu: [
    C([[-0.3, -0.02], [0.18, -0.02], [0.18, 0.44], [-0.3, 0.44]], 'limon'),
    A([[0.18, -0.02], [0.3, -0.12], [0.3, 0.34], [0.18, 0.44]]),
    A([[-0.3, -0.02], [-0.2, -0.12], [-0.17, -0.12]]), A([[0.13, -0.12], [0.3, -0.12]]),
    A([[-0.22, -0.02], [-0.22, -0.32], [0.1, -0.32], [0.1, -0.02]]),
    A([[-0.16, -0.32], [-0.12, -0.42], [0.2, -0.38], [0.15, -0.12]]),
    C([[-0.06, 0.12], [0.0, 0.04], [0.06, 0.12], [0.0, 0.2]], 'mercan'), // baklava
  ],
  // Kulaklık askısı: oval kaide, dikme, üst kol; bant kolun üstüne oturur, kulaklıklar dikmenin iki yanında aşağı sarkar
  // (kulaklıklar yukarıda kalınca terazi gibi okunuyordu)
  // Kulak yastıkları iri ve içe dönük: küçükken bant + küçük kaplar terazi ya da şemsiye gibi okunuyordu
  kulaklikAskisi: [
    Y(oval(0, 0.42, 0.26, 0.06, 0, 360, 16), true, 'limon'),
    A([[0, 0.36], [0, -0.3]]), A([[-0.11, -0.32], [0.11, -0.32]]),
    Y(oval(0, 0.0, 0.29, 0.36, 194, 346, 14)),
    Y(oval(0, 0.0, 0.23, 0.28, 198, 342, 12)),
    Y(oval(-0.28, 0.06, 0.1, 0.16, 0, 360, 14), true, 'limon'), Y(oval(0.28, 0.06, 0.1, 0.16, 0, 360, 14), true, 'limon'),
    A([[-0.19, -0.05], [-0.19, 0.17]]), A([[0.19, -0.05], [0.19, 0.17]]),
  ],
  // Kablo klipsi: klips gövdesinin içinden geçen üç kablo, sağ uçlarında fişler, sol uçları sarkar. (Önden kesit
  // halkaları pasta, yandan çizim boru dirseği gibi okunuyordu; fiş ucu "kablo" dedirtir.)
  kabloKlipsi: [
    Y(oval(0, 0, 0.13, 0.25, 0, 360, 18, 4.2), true, 'nane'),
    Y([[-0.13, -0.12], [-0.3, -0.13], [-0.42, -0.08], [-0.47, 0.04]]),
    Y([[-0.13, 0.0], [-0.28, 0.01], [-0.38, 0.08], [-0.41, 0.2]]),
    Y([[-0.13, 0.12], [-0.25, 0.14], [-0.31, 0.24], [-0.33, 0.36]]),
    A([[0.13, -0.12], [0.3, -0.12]]), A([[0.13, 0.0], [0.3, 0.0]]), A([[0.13, 0.12], [0.3, 0.12]]),
    C([[0.3, -0.16], [0.4, -0.16], [0.4, -0.08], [0.3, -0.08]], 'koyu'), A([[0.4, -0.12], [0.48, -0.12]]),
    C([[0.3, -0.04], [0.4, -0.04], [0.4, 0.04], [0.3, 0.04]], 'koyu'), A([[0.4, 0.0], [0.48, 0.0]]),
    C([[0.3, 0.08], [0.4, 0.08], [0.4, 0.16], [0.3, 0.16]], 'koyu'), A([[0.4, 0.12], [0.48, 0.12]]),
  ],
};
// Yalnız dolgu olan yüzler: açık çizgiyle çizilmiş yüzeyler (kalınlık bandı, yan yüz, tepsi) ya da önündeki nesnenin
// arkasını örten yüz (kupa). Çizgisi yoktur; k numaralı konturun hemen altına girer ve o kontur çizilirken belirir.
const YUZ = {
  kupaAltligi: [
    { k: 0, r: 'lila', p: [[-0.46, 0.24], [-0.46, 0.31], [-0.24, 0.42], [0.24, 0.42], [0.46, 0.31], [0.46, 0.24], [0.24, 0.35], [-0.24, 0.35]] },
    { k: 2, r: 'beyaz', p: [[-0.19, -0.3], [-0.18, 0.21], [0.18, 0.21], [0.19, -0.3]] }, // kupa altlığın arka kenarını örter
  ],
  isimYazisi: [{ k: 7, r: 'lila', p: [[-0.48, 0.2], [-0.4, 0.3], [0.5, 0.3], [0.5, 0.37], [-0.4, 0.37], [-0.48, 0.27]] }],
  zarKulesi: [
    { k: 0, r: 'limon', p: [[0.14, -0.4], [0.24, -0.49], [0.24, 0.22], [0.14, 0.3]] },
    { k: 0, r: 'limon', p: [[-0.42, 0.3], [-0.36, 0.42], [0.38, 0.42], [0.3, 0.3]] },
  ],
  desteKutusu: [{ k: 0, r: 'limon', p: [[0.18, -0.02], [0.3, -0.12], [0.3, 0.34], [0.18, 0.44]] }],
};
// ---------- Kişiler: kadro.json'dan önceki sahnelerin kişileri + 6 yeni genç yüz (insan.js parametreleri)
const YENI_YUZ = {
  N1: { tohum: 521, kadin: true, yas: 'genc', sacStil: 'twist', sac: 0, ten: 5, boy: 'orta', yapi: 'zayif', kupe: 'halka', piercing: ['burun'], yaka: 'bisiklet', giysi: 6, gozluk: null, sakal: null, cil: false },
  N2: { tohum: 522, kadin: false, yas: 'genc', sacStil: 'kazik', sac: 0, ten: 2, boy: 'uzun', yapi: 'tosun', yanak: 0.6, sakal: 'keci', yaka: 'kapusonlu', giysi: 3, gozluk: null, kupe: false, cil: false },
  N3: { tohum: 523, kadin: true, yas: 'genc', sacStil: 'uzun', sac: 1, ten: 1, boy: 'kisa', yapi: 'orta', yanak: 0.5, piercing: ['burun'], yaka: 'balikci', giysi: 4, gozluk: null, sakal: null, kupe: true, cil: true },
  N4: { tohum: 524, kadin: false, yas: 'genc', sacStil: 'undercut', sac: 0, ten: 3, boy: 'orta', yapi: 'zayif', piercing: ['dudak', 'kulak'], ceket: 'deri', yaka: 'bisiklet', giysi: 0, gozluk: null, sakal: null, kupe: false, cil: false },
  N5: { tohum: 525, kadin: true, yas: 'genc', sacStil: 'orgu', sac: 0, ten: 6, boy: 'orta', yapi: 'tosun', yanak: 0.4, yaka: 'kapusonlu', giysi: 2, gozluk: null, sakal: null, kupe: 'halka', cil: false },
  N6: { tohum: 526, kadin: false, yas: 'genc', sacStil: 'kisa', sapka: 'bere', bereRenk: 5, sac: 1, ten: 6, boy: 'kisa', yapi: 'orta', sakal: 'sakal', yaka: 'balikci', giysi: 3, gozluk: 'kare', kupe: false, cil: false },
};

// ---------- Akış (iki yönde aynı): kafa çıkışı, balon açılışı, fikir, fikir değişimi [kare, yeni çizim]
// Ritim: N1 tek başına sorar (1,3 sn); E tepki olarak çıkar (balonu sonra), N2 yapbozunu düşünür; sonra ~10 k arayla dolar.
const AKIS = {
  N1: { cik: 2010, balon: 2020, hizli: true, cizim: 'vitrin' }, // kesmeden önce kalkar: ilk karede kafa yükseliyor
  N2: { cik: 2098, balon: 2112, cizim: 'yapboz' },             // N1'in sözü kapanırken (k2112) fikri gelir
  E: { cik: 2118, balon: 2140, cizim: 'd20' },                 // önce N1'e ve N2'ye bakar, fikri sonra gelir
  B: { cik: 2142, balon: 2150, cizim: 'organizer' },
  E4: { cik: 2152, balon: 2160, cizim: 'zarKulesi', degis: [2244, 'desteKutusu'] },
  A: { cik: 2162, balon: 2170, cizim: 'qrStandi' },
  N4: { cik: 2172, balon: 2180, cizim: 'textFlip', degis: [2258, 'fidget'] },
  E3: { cik: 2182, balon: 2190, cizim: 'piyon' },
  N5: { cik: 2192, balon: 2200, cizim: 'kulaklikAskisi', degis: [2272, 'kabloKlipsi'] },
  N3: { cik: 2202, balon: 2214, cizim: 'kale' },                // önce çevresine bakar, sonra düşünür (N5'ten 10 k sonra)
  N6: { cik: 2222, balon: 2230, cizim: 'telefonStandi' },       // doğrudan telefon standını düşünür
  D: { cik: 2232, balon: 2240, cizim: 'saksi' },
  B3: { cik: 2246, balon: 2254, cizim: 'isimYazisi', degis: [2288, 'kapiPlakasi'] },
  E2: { cik: 2260, balon: 2268, cizim: 'kutuOyunu' },
  Garson: { cik: 2274, balon: 2282, cizim: 'kupaAltligi' },
};
// Balon ve çizim tohumları (SON_BALONLAR ile aynı: s6 aynı bulutu ve aynı çizgileri kurabilsin)
// Sıra sabit (ilk sürümdeki gibi): akış değişse de tohumlar, dolayısıyla bulutların ve çizgilerin biçimi değişmez
const TOHUM_SIRA = ['N1', 'E', 'N2', 'B', 'N3', 'E3', 'A', 'E4', 'N4', 'N5', 'N6', 'D', 'B3', 'E2', 'Garson'];
const TOHUM = Object.fromEntries(TOHUM_SIRA.map((kod, i) => [kod, { balon: 540 + i * 7, cizim: 600 + i * 20 }]));

// Kalabalık balonlarının tasarım boyu (anahtar olmayanlar) ve çizim boyu; dikeyde ×1,12. Çizim, balonun iç elipsine
// köşeleri değecek kadar büyük (kalabalıkta balon ~200 px; çizim ~%60'tayken 100 px'e iniyor, okunmuyordu)
const TASARIM = {
  vitrin: { r: [140, 112], ic: 196 }, kale: { r: [140, 110], ic: 200 }, kupaAltligi: { r: [150, 104], ic: 185 },
  isimYazisi: { r: [158, 100], ic: 205 }, textFlip: { r: [148, 112], ic: 200 }, zarKulesi: { r: [140, 110], ic: 195 },
  kulaklikAskisi: { r: [140, 112], ic: 195 },
};
// İkinci fikrin çizim boyu (aynı balona sığsın)
const IKINCI_BOY = { desteKutusu: 200, fidget: 205, kabloKlipsi: 215, kapiPlakasi: 205 };
// Kalabalıkta balon boyu çarpanı: hepsi aynı boyda olunca ikon duvarı gibi okunuyordu
const BOY_CARPAN = { N1: 1.12, E: 1.02, N2: 1.06, B: 0.96, E4: 0.94, A: 1.0, N4: 0.92, E3: 1.04, N5: 0.95, N3: 1.0, N6: 0.97, D: 1.03, B3: 0.93, E2: 0.98, Garson: 0.94 };

// ---------- Kalabalığın yerleşimi (iki yön; kurulum yön seçer). Sıra: ölçek o, yüz merkezi cy ('orta' boylu), soluk alfa,
// balon bandı (y, yalnız yatay). kod: [sıra, x, yatayda balon kayması [dx, dy] | dikeyde şerit (0 sol, 1 orta, 2 sağ)]
// Yatay kaymalar elle: bantlar düz bir sıra gibi değil, sık bir bulut gibi dursun; uçtakiler kadraja girsin.
const SIRA_T = {
  yatay: {
    on: { o: 0.86, cy: 880, alfa: 1, bant: 618 },
    arka: { o: 0.66, cy: 760, alfa: 0.76, bant: 398 },
  },
  // Dikey: iki sıra sık ve alçak (arka sıranın yüzleri ön sıranın başları arasından görünür): gökyüzü yığına kalır
  dikey: {
    on: { o: 0.86, cy: 1738, alfa: 1 },
    arka: { o: 0.68, cy: 1628, alfa: 0.76 },
  },
};
const SIRA_DIZI = ['arka', 'on']; // arkadan öne (z sırası)
const YERLER_T = {
  yatay: {
    E2: ['on', 175, [58, 34]], B: ['on', 400, [-2, -30]], D: ['on', 625, [-6, 30]], N1: ['on', 850, [0, -8]],
    E: ['on', 1075, [12, 22]], N2: ['on', 1300, [-6, -18]], A: ['on', 1525, [-10, 26]], Garson: ['on', 1750, [-48, -26]],
    N4: ['arka', 287, [18, 22]], E4: ['arka', 512, [-12, -28]], E3: ['arka', 737, [10, 8]], N3: ['arka', 962, [0, -34]],
    N6: ['arka', 1187, [-12, 16]], B3: ['arka', 1412, [12, -18]], N5: ['arka', 1637, [4, 26]],
  },
  // Doğum sırasıyla şeritler dönüşümlü dolar (N2 sol, N1 orta, E sağ; sonra B, E4, A, N4, E3, N5…): üç sütun birlikte büyür
  dikey: {
    B: ['on', 105, 0], N3: ['on', 255, 0], E2: ['on', 400, 1], N1: ['on', 540, 1], A: ['on', 690, 2], E: ['on', 840, 2], Garson: ['on', 985, 2],
    B3: ['arka', 70, 0], N4: ['arka', 190, 0], N2: ['arka', 320, 0], E4: ['arka', 450, 1], N6: ['arka', 570, 1], E3: ['arka', 690, 1], N5: ['arka', 830, 2], D: ['arka', 970, 2],
  },
};
const KONUSAN = new Set(['N1', 'N2']); // konuşanlar her sırada tam koyu

// ---------- DEVİR (k2312–SON): kalabalık ortadan ikiye ayrılıp kenarlara çekilir (kaybolmaz); sekiz büyük balon
// sahiplerinin başlarının üstünde, sahiplerine bağlı kalır. Son karedeki yerleşim (dünya koordinatı; kamera odak(0,0,1),
// dünya = ekran) s6'ya geçer: SON_BALONLAR (balonlar) ve SON_KISILER (kişiler). Orta logoya, OKTOS'a ve slogana boş
// (s6 FINAL_YER: yatay logo x 663–1257, y 186–638, yazı y ≤ 955, satır 2 x 703–1217; dikey logo y 396–984, yazı y ≤ 1420).
//   Kişiler: sıraları (ölçek, soluk filtre) aynı kalır, sıra içi soldan sağa düzen korunur (kimse kimsenin içinden
//   geçmez). m: ölçek çarpanı (1: yalnız kayma). satir: son yüz merkezi ('orta' boylu). x: son göğüs ortası.
//   Balonlar iki katta: alt kat (önde) sahibine BAĞLI kuyrukla (noktalar başa iner); üst kat (arkada) kısa kuyrukla,
//   sahibine doğru (s5 dikey yığınındaki itilmiş balonlar gibi). Liste sırası z sırasıdır: önce üst kat. Aynalı çiftler
//   x = W/2'ye göre simetrik (s6 dalgaları çift çift hasat eder). r: son boy; rKal: kalabalıktaki boy (eski tasarım
//   boyu: kalabalık görüntüsü değişmesin). Tümsekler yatayda r'nin ~20 px, dikeyde ~36 px dışına taşar; kenar payı ≥ 35 px.
const SON_YER = {
  yatay: {
    m: 1, satir: { on: 880, arka: 760 },
    x: {
      E2: 70, B: 215, D: 362, N1: 505, N4: 140, E4: 288, E3: 432, N3: 566,
      E: 1415, N2: 1560, A: 1705, Garson: 1850, N6: 1356, B3: 1495, N5: 1640,
    },
    balonlar: [
      { kod: 'E2', cizim: 'kutuOyunu', c: [222, 186], r: [130, 94], icBoy: 190, rKal: 152, kisa: true },
      { kod: 'E3', cizim: 'piyon', c: [560, 192], r: [124, 96], icBoy: 180, rKal: 142, kisa: true },
      { kod: 'N6', cizim: 'telefonStandi', c: [1360, 192], r: [126, 94], icBoy: 172, rKal: 146, kisa: true },
      { kod: 'N2', cizim: 'yapboz', c: [1698, 186], r: [128, 96], icBoy: 176, rKal: 150, kisa: true },
      { kod: 'B', cizim: 'organizer', c: [190, 484], r: [134, 92], icBoy: 190, rKal: 156 },
      { kod: 'D', cizim: 'saksi', c: [470, 494], r: [124, 94], icBoy: 172, rKal: 144 },
      { kod: 'E', cizim: 'd20', c: [1450, 494], r: [128, 92], icBoy: 166, rKal: 148 },
      { kod: 'A', cizim: 'qrStandi', c: [1730, 484], r: [126, 96], icBoy: 170, rKal: 146 },
    ],
  },
  // Dikey: kalabalık altta kalır, ortadan açılıp köşelere yığılır (sol 8, sağ 7; N6 sola, N1 sağa geçer: sahipler 4/4) ve
  // biraz geri çekilir (m 0,9: ortada ~180 px boşluk). Balonlar kalabalığın üstünde iki kat (logonun altı ile başlar
  // arası; OKTOS ve slogan o bantta balonlar söndükten sonra gelir); ızgara gibi durmasın diye yer ve boy elle kaydırıldı.
  dikey: {
    m: 0.9, satir: { on: 1752, arka: 1640 },
    x: {
      B3: 35, N4: 135, N2: 235, E4: 335, N6: 430, B: 85, N3: 228, E2: 368,
      N1: 680, A: 805, E: 925, Garson: 1030, E3: 742, N5: 866, D: 985,
    },
    balonlar: [
      { kod: 'N2', cizim: 'yapboz', c: [168, 1110], r: [114, 82], icBoy: 162, rKal: 160, kisa: true },
      { kod: 'N6', cizim: 'telefonStandi', c: [410, 1124], r: [108, 80], icBoy: 150, rKal: 156, kisa: true },
      { kod: 'A', cizim: 'qrStandi', c: [670, 1124], r: [108, 84], icBoy: 152, rKal: 154, kisa: true },
      { kod: 'E', cizim: 'd20', c: [912, 1110], r: [114, 82], icBoy: 150, rKal: 156, kisa: true },
      { kod: 'B', cizim: 'organizer', c: [176, 1392], r: [118, 80], icBoy: 168, rKal: 160 },
      { kod: 'E2', cizim: 'kutuOyunu', c: [416, 1372], r: [112, 82], icBoy: 164, rKal: 168 },
      { kod: 'E3', cizim: 'piyon', c: [664, 1372], r: [110, 84], icBoy: 160, rKal: 154 },
      { kod: 'D', cizim: 'saksi', c: [904, 1392], r: [114, 84], icBoy: 160, rKal: 160 },
    ],
  },
};
const yuvarla = (v) => Math.round(v * 10) / 10;
const yonu = (a, b) => Math.sign(Math.round((b - a) / 40)); // bakış yönü (-1, 0, 1)
// Kişi parametresi (film.js kisiParam ile aynı: kadro.json kisiler.<kod>.p; yeni yüzler YENI_YUZ)
const kisiP = (kod) => (YENI_YUZ[kod] ? rastgeleKisi(YENI_YUZ[kod].tohum, YENI_YUZ[kod]) : rastgeleKisi(KADRO.kisiler[kod].p.tohum, KADRO.kisiler[kod].p));
// Kişinin sahnedeki yeri (film.js kisi() ile aynı hesap: hiza = cy + (BOY.boy − 176)·o, alt = hiza + boyKaymasi·o)
function kisiYeri(p, x, cy, o) {
  const alt = cy + (BOY.boy - 176) * o + boyKaymasi(p) * o, y0 = alt - BOY.boy * o;
  return { x, alt, o, ust: y0 + basUstu(p) * o, yuz: [x, y0 + 176 * o] };
}
// Kuyruk noktaları, balonun yerel koordinatında (ölçek s ile bölünmüş): c balon merkezi, r tasarım yarıçapı, bas sahibin
// baş tepesi [x, y]. m: 0 bağlı (noktalar başa iner) … 1 kısa (balonun dibinde, başa doğru). yan: dikey yığında kısa
// kuyruğun döndüğü yön (dışa-aşağı), yanAg ağırlığıyla. Sıra [uzak (küçük), orta, yakın (büyük)]: ctx.balon ilkini önce açar.
function kuyruk(c, r, s, bas, m, yan = null, yanAg = 1) {
  const rc = [r[0] * s, r[1] * s];
  const hedef = [bas[0] + (c[0] - bas[0]) * 0.25, bas[1] - 10]; // başın tepesi (sahibe doğru biraz kayık)
  const dx = hedef[0] - c[0], dy = hedef[1] - c[1], l = Math.hypot(dx, dy) || 1;
  let u = [dx / l, dy / l];
  // Dikey yığın: yukarı itilen balonun kısa kuyruğu yan şeritlerde dışa-aşağı döner (sahiplerin yanı; dik inen nokta
  // alttaki balona değip "düşünce zinciri" gibi okunuyordu). Orta şerit aşağı bakar.
  const ag = yan ? m * yanAg : 0;
  if (ag > 0) { const v = [u[0] + (yan[0] - u[0]) * ag, u[1] + (yan[1] - u[1]) * ag], lv = Math.hypot(v[0], v[1]); u = [v[0] / lv, v[1] / lv]; }
  const ek = 1 / Math.hypot(u[0] / rc[0], u[1] / rc[1]), Lk = Math.max(60, l - ek);
  const buyut = Math.min(1.5, Math.max(1, Lk / 170)); // uzun izde noktalar iri: seyrek ve küçükken asılı leke gibi
  const bagli = [[0.84 * Lk, 5.5 * buyut], [0.53 * Lk, 8 * buyut], [0.22 * Lk, 11 * buyut]], kisa = [[46, 4.5], [29, 6.5], [13, 9]];
  return bagli.map(([d0, r0], j) => {
    const d = d0 + (kisa[j][0] - d0) * m, rad = r0 + (kisa[j][1] - r0) * m;
    return [u[0] * (ek + d) / s, u[1] * (ek + d) / s, rad / s];
  });
}
// Son yerleşim (yön başına): kişiler (ilk ve son yer) ve balonlar
const SON_HESAP = Object.fromEntries(Object.keys(SON_YER).map((yon) => {
  const Y0 = SON_YER[yon], S = SIRA_T[yon], W = yon === 'dikey' ? 1080 : 1920;
  const kisiler = {};
  for (const sira of SIRA_DIZI) {
    for (const [kod, [s, x0]] of Object.entries(YERLER_T[yon])) {
      if (s !== sira) continue;
      const p = kisiP(kod), o = S[s].o;
      kisiler[kod] = { kod, p, sira: s, alfa: KONUSAN.has(kod) ? 1 : S[s].alfa, ilk: kisiYeri(p, x0, S[s].cy, o), son: kisiYeri(p, Y0.x[kod], Y0.satir[s], o * Y0.m) };
    }
  }
  const balonlar = Y0.balonlar.map((b) => {
    const K = kisiler[b.kod].son;
    const noktalar = kuyruk(b.c, b.r, 1, [K.x, K.ust], b.kisa ? 1 : 0).map(([x, y, rad]) => [yuvarla(b.c[0] + x), yuvarla(b.c[1] + y), yuvarla(rad)]);
    return { ...b, noktalar };
  });
  // Son bakış (k SON, s6 bununla başlar): sahip kendi balonuna, ötekiler ortaya (logonun geleceği yere) yukarı bakar
  for (const K of Object.values(kisiler)) {
    const bal = balonlar.find((b) => b.kod === K.kod);
    K.ifade = 'merak';
    K.bakis = [yonu(K.son.x, bal ? bal.c[0] : W / 2), -1];
  }
  return [yon, { kisiler, balonlar }];
}));
export const SON_BALONLAR = Object.fromEntries(Object.entries(SON_HESAP).map(([yon, Y0]) => [yon, Y0.balonlar.map((b) => ({
  cizim: b.cizim, c: b.c, r: b.r, icBoy: b.icBoy, noktalar: b.noktalar,
  // Son çizim balonun ikinci fikriyse (degis) tohumu +10 (kurulumdaki fikirCiz ile aynı): finalde kayma olmasın
  tohum: TOHUM[b.kod].balon, cizimTohum: TOHUM[b.kod].cizim + (AKIS[b.kod]?.degis?.[1] === b.cizim ? 10 : 0), kalinlik: KALINLIK, kod: b.kod,
  kat: b.kisa ? 'ust' : 'alt',
}))]));
// s6 kişileri aynı yerde kurar (z sırası: dizi sırası = s5'teki DOM sırası, arkadan öne). x, alt, olcek: film.js kisi()
// girdileri (hiza değil, alt verilir); alfa < 1: kâğıda açma filtresi (solgun); ifade ve bakış: s5'in son pozu; ust: baş
// tepesi; yuz: yüz merkezi. Kol pozu yok (s5'te kol kullanılmıyor). govdeUzat: s6 da gövdeyi aşağı uzatır (aşağıda).
export const SON_KISILER = Object.fromEntries(Object.entries(SON_HESAP).map(([yon, Y0]) => [yon, Object.values(Y0.kisiler).map((K) => ({
  kod: K.kod, p: K.p, sira: K.sira, x: K.son.x, alt: K.son.alt, olcek: K.son.o, alfa: K.alfa, // yuvarlanmaz: devirde piksel aynı
  ifade: K.ifade, bakis: K.bakis, ust: yuvarla(K.son.ust), yuz: K.son.yuz.map(yuvarla),
}))]));

// ---------- Kişi geometrisi (kutu birimi; insan.js ile aynı ölçüler)
// Saçın, şapkanın en üst noktası (kutu y): yüzün tepesi 176 − yuzBoy, saç stiline göre yukarı taşar
function basUstu(p) {
  const hh = p.yuzBoy, tepe = 176 - hh;
  const sac = { kivircik: 14 + 0.37 * hh, mohawk: 84, topuz: 47, kisa: 15, uzun: 15, bob: 15, yan: 17, twist: 18 + 0.2 * hh,
    orgu: 11, geri: 19, undercut: 33, kazik: 2, basortusu: 17, bere: 27, kel: 2 }[p.sacStil] ?? 15;
  const sapka = { kasket: 30, bere: 23 }[p.sapka] ?? 0;
  return tepe - Math.max(sac, sapka);
}

// ---------- Gövde uzatma: insan.js gövdesi kutu y 860'ta biter; üst sıralarda kenar görünmesin diye aşağı sürer.
// h: film.js kisi() dönüşü. s6 da aynı kişileri bununla kurar (devirde görüntü birebir aynı kalsın).
export function govdeUzat(ctx, h) {
  const { el } = ctx;
  const p = h.p, o = h.olcek, Ex = (YAPI[p.yapi] || YAPI.orta).en, cx = 200;
  const g = el(h.g, 'g', { transform: `translate(${(h.x - BOY.en * o / 2).toFixed(1)} ${(h.alt - BOY.boy * o).toFixed(1)}) scale(${o})` });
  const deri = p.ceket === 'deri', blazer = !!p.ceket && !deri;
  const renk = deri ? '#46423d' : MONO.giysi[p.giysi];
  const sol = cx - 176 * Ex - 2, sag = cx + 176 * Ex + 2, ust = 850, alt = 2600;
  el(g, 'path', { d: `M${sol + 3} ${ust}L${sag + 3} ${ust}L${sag + 3} ${alt}L${sol + 3} ${alt}Z`, fill: renk });
  const cizgi = (x, w = 4.2, ek = {}) => el(g, 'path', { d: `M${x} ${ust + 8}L${x} ${alt}`, fill: 'none', stroke: ctx.PALET.murekkep, 'stroke-width': w, 'stroke-linecap': 'round', ...ek });
  cizgi(sol); cizgi(sag);
  if (blazer) { cizgi(cx - 9); cizgi(cx + 9); }
  if (deri) cizgi(cx + 16, 7, { 'stroke-dasharray': '1.6 4.4' });
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, kisi, balon, odak, W, H, yer, metin, BOY, DIKEY } = ctx;
  ctx.vurus('5.1', 'Kafalar alttan çıkar: "Bunu canlandırabilir miyiz?"', BAS, SATIR2 - 1);
  ctx.vurus('5.2', 'Kalabalık dolar: yapboz', SATIR2, KESKE - 1);
  ctx.vurus('5.3', '"Keşke şöyle olsa…"', KESKE, DEVIR - 1);
  ctx.vurus('5.4', 'Devir: kalabalık kenarlara çekilir, sekiz balon sahiplerinin üstünde', DEVIR, SON);
  ctx.isaret(BAS, 'kesme');

  // Katmanlar: kişiler, balonlar (kişilerin üstünde), sözler (en üstte)
  const LK = ctx.katman('s5-kalabalik', 10), LB = ctx.katman('s5-balonlar', 11), LY = ctx.katman('s5-sozler', 12);
  for (const K of [LK, LB, LY]) {
    gsap.set(K.div, { autoAlpha: 0 });
    tl.set(K.div, { autoAlpha: 0 }, 0);
    tl.set(K.div, { autoAlpha: 1 }, k(BAS));
    tl.set(K.div, { autoAlpha: 0 }, k(SON + 1)); // s6 aynı karede aynı kişileri ve balonları kendi katmanında kurar
  }

  // ---------- Yerleşim (yön başına; tablolar modül düzeyinde: SIRA_T, YERLER_T, SON_YER)
  const yonAd = DIKEY ? 'dikey' : 'yatay';
  const SB = yer(0.6, 0.56); // kalabalıkta balon sarmalayıcısının ölçeği
  const SIRA = SIRA_T[yonAd], YERLER = YERLER_T[yonAd], SONH = SON_HESAP[yonAd];
  // Dikey yığın: şerit x'leri, doğum (yuva 0) y'si, basamak; orta şerit yarım basamak yukarıda (petek)
  const SERIT_X = [290, 545, 800], DOGUM_Y = 1395, BASAMAK = 198, SERIT_KAY = [0, 97, 0];
  const yuvaY = (c, j) => (j === 0 ? DOGUM_Y : DOGUM_Y - j * BASAMAK - SERIT_KAY[c]);
  // Açılışın kahramanı N1: balonu büyük, solda ve yüksekte doğar (sağ altta konuşma balonuna yer); kamera geri çekilirken
  // hemen yükselmeye başlar (ekranda yerinde durur: kadrajın üstü ilk saniyelerde boş kalmasın), küçülerek yığının tepesine
  // katılır. Söz biterken kuyruğu kısalır: başa uzanan seyrek nokta izi kadrajın ortasında asılı kalmasın.
  const N1_DIKEY = { dogum: [455, 1060], yuksel: [2026, 2190, 820], olc: 1.5, kisal: 2104 };

  const ANAHTAR = Object.fromEntries(SONH.balonlar.map((b) => [b.kod, b])); // sekiz büyük balon (son yer, boy, kuyruk)
  const TB = DIKEY ? 1.12 : 1; // tasarım boyu çarpanı (dikeyde balonlar daha büyük)

  // ---------- Fikir çizimi: cizimler.js'te varsa cizimKur (s6 ile aynı çizgiler ve renkler), yoksa bu modülün çizimleri.
  // Dönüş: [{ yol, dolgu, j }]; j kontur sırası (dolgu o kontur çizilirken belirir). Dolgu cizimKur gibi 2 px kayık.
  function fikirCiz(ust, ad, { boy, tohum }) {
    if (CIZIMLER[ad]) return cizimKur(ctx, ust, ad, { c: [0, 0], boy, kalinlik: KALINLIK, tohum }).map((h, j) => ({ yol: h.yol, dolgu: h.dolgu, j }));
    const tanim = YENI[ad], yuzler = YUZ[ad] || [], olc = (pts) => pts.map(([x, y]) => [x * boy, y * boy]);
    const ortak = { kalinlik: KALINLIK, genlik: 1.0, kay: [2, 2] };
    const out = [];
    tanim.forEach((c, i) => {
      yuzler.forEach((y, n) => {
        if (y.k !== i) return;
        const h = ctx.cizgi(ust, olc(duz(y.p, true)), { ...ortak, kapali: true, tohum: tohum + 50 + n, dolgu: dolguRengi(y.r) });
        h.yol.remove(); // yalnız dolgu
        out.push({ yol: null, dolgu: h.dolgu, j: i });
      });
      const h = ctx.cizgi(ust, olc(c.p), { ...ortak, kapali: !!c.kapali, tohum: tohum + i, dolgu: c.kapali && c.r ? dolguRengi(c.r) : null });
      out.push({ yol: h.yol, dolgu: h.dolgu, j: i });
    });
    return out;
  }
  const parca = (ad, hs) => ({ ad, yollar: hs.filter((h) => h.yol).map((h) => h.yol), dolgular: hs.filter((h) => h.dolgu) });

  // ---------- Soluk figüran: saydamlık yerine kâğıda doğru açma filtresi (opak kalır; üst üste binen figüranlar birbirinin
  // içinden görünmez). çıkış = giriş × a + kâğıt × (1 − a), sRGB'de.
  const solgun = (a) => {
    const id = `s5-solgun-${Math.round(a * 100)}`;
    if (!LK.svg.querySelector(`#${id}`)) {
      const f = el(el(LK.svg, 'defs'), 'filter', { id, 'color-interpolation-filters': 'sRGB', x: '-5%', y: '-5%', width: '110%', height: '110%' });
      const tr = el(f, 'feComponentTransfer');
      const kagit = [0xf1, 0xed, 0xe6].map((v) => v / 255);
      ['R', 'G', 'B'].forEach((c, i) => el(tr, `feFunc${c}`, { type: 'linear', slope: a, intercept: ((1 - a) * kagit[i]).toFixed(4) }));
    }
    return `url(#${id})`;
  };

  // ---------- Kişileri kur (arkadan öne)
  const KISI = {};
  for (const sira of SIRA_DIZI) {
    for (const [kod, [s, x, kay]] of Object.entries(YERLER)) {
      if (s !== sira) continue;
      const S = SIRA[s];
      const { p, alfa, son } = SONH.kisiler[kod]; // p: ctx.kisiParam(kod) ya da YENI_YUZ ile aynı
      const kap = el(LK.svg, 'g', alfa < 1 ? { filter: solgun(alfa) } : {});
      const h = kisi(kap, p, { x, olcek: S.o, hiza: S.cy + (BOY.boy - 176) * S.o });
      govdeUzat(ctx, h);
      const y0 = h.alt - BOY.boy * S.o; // kutunun üst kenarı (dünya)
      const ust = y0 + basUstu(p) * S.o, agizY = y0 + (182 + 0.52 * p.yuzBoy) * S.o;
      const yuzYari = p.yuzEn * (YAPI[p.yapi] || YAPI.orta).yuz * (1 + 0.1 * (p.yanak || 0)) * S.o;
      // cur: devirde kabın canlı dönüşümü (öteleme + ölçek); balon kuyrukları başın o anki yerine bakar
      KISI[kod] = { kod, h, p, kap, son, x, sira: s, S, kay: kay ?? [0, 0], ust, agiz: [x, agizY], yuzYari, yuzY: y0 + 176 * S.o, cur: { tx: 0, ty: 0, m: 1 } };
    }
  }

  // ---------- Çıkış: kafa kadrajın altından BO ile (60 fps, her karede); başlangıçta kadraj altında bekler
  for (const K of Object.values(KISI)) {
    const a = AKIS[K.kod];
    const dy = H + 40 - K.ust;
    gsap.set(K.h.g, { y: dy });
    tl.fromTo(K.h.g, { y: dy }, { y: 0, duration: k(16), ease: E.BO, immediateRender: false }, k(a.cik));
  }

  // ---------- Balonlar. Vekil pr = { x, y (dünya merkezi), s (sarmalayıcı ölçeği), m (kuyruk: 0 başa bağlı, 1 kısa),
  // d (devir: 0 → 1 son noktalara) }; uygula(b) sarmalayıcıyı, kuyruğu ve bulutu ondan kurar.
  const BALON = {};
  // Kuyruk: başın o anki yerine (devirde sahibi kayarken izler); dikey yığında kısa kuyruk dışa-aşağı döner (devirde söner)
  const kuyrukYerel = (b) => {
    const { pr, K } = b, c = K.cur;
    const yan = DIKEY && b.serit !== 1 && b.serit != null ? [b.serit === 0 ? -0.72 : 0.72, 0.69] : null;
    return kuyruk([pr.x, pr.y], b.r, pr.s, [c.m * K.x + c.tx, c.m * K.ust + c.ty], pr.m, yan, 1 - pr.d);
  };
  const uygula = (b) => {
    const { pr } = b;
    b.sar.setAttribute('transform', `translate(${pr.x.toFixed(2)} ${pr.y.toFixed(2)}) scale(${pr.s.toFixed(4)})`);
    const kq = kuyrukYerel(b);
    b.noktalar.forEach((n, j) => { for (let q = 0; q < 3; q++) n[q] = kq[j][q] + ((b.sonYerel?.[j][q] ?? kq[j][q]) - kq[j][q]) * pr.d; });
    b.bal.ciz();
    if (b.tasiyici) b.tasiyici.style.transform = `translate(${(pr.x - b.dogum[0]).toFixed(2)}px, ${(pr.y - b.dogum[1]).toFixed(2)}px)`;
  };

  // Doğum yerleri. Yatay: sıra bandı + elle kayma (kuyruk en az 52 px kalsın diye gerekirse yukarı). Dikey: şeridin doğum
  // yuvası (balon kendi kaymasıyla); itme takvimi aşağıda.
  const kodlar = Object.keys(AKIS).sort((a, b) => AKIS[a].balon - AKIS[b].balon);
  const titre = (kod, n) => { const r = rng(TOHUM[kod].balon * 17 + n); return () => r() * 2 - 1; };
  for (const kod of kodlar) {
    const K = KISI[kod], a = AKIS[kod], an = ANAHTAR[kod];
    const r = an ? an.r : TASARIM[a.cizim].r.map((v) => v * TB);
    const icBoy = an ? an.icBoy : TASARIM[a.cizim].ic * TB;
    // Büyük balonlar son boylarında kurulur; kalabalıkta eski tasarım boyları (rKal) kadar görünsün diye ölçek düzeltilir
    const s = SB * (DIKEY && kod === 'N1' ? N1_DIKEY.olc : BOY_CARPAN[kod]) * (an ? an.rKal / an.r[0] : 1), rc = [r[0] * s, r[1] * s];
    let x, y, serit = null, kayD = [0, 0];
    if (DIKEY) {
      serit = K.kay;
      const t = titre(kod, 1);
      kayD = [t() * 30, t() * 8]; // şerit çizgisi düz bir sütun gibi okunmasın
      x = kod === 'N1' ? N1_DIKEY.dogum[0] : SERIT_X[serit] + kayD[0];
      y = (kod === 'N1' ? N1_DIKEY.dogum[1] : DOGUM_Y) + kayD[1];
    } else {
      x = K.x + K.kay[0];
      y = Math.min(K.S.bant + K.kay[1], K.ust - 52 - rc[1]);
    }
    BALON[kod] = { kod, K, a, an, r, icBoy, serit, kayD, pr: { x, y, s, m: 0, d: 0 }, dogum: [x, y] };
  }
  // z sırası: yatayda arka sıranın balonları altta; dikeyde doğum sırası (yeni balon üstte, eski kuyruklar arkasında kalır)
  const zSira = (b) => (DIKEY ? 0 : SIRA_DIZI.indexOf(b.K.sira));
  const sirali = Object.values(BALON).sort((x, y) => zSira(x) - zSira(y) || x.a.balon - y.a.balon);
  for (const b of sirali) {
    const { a, an, r, icBoy } = b, T = TOHUM[b.kod];
    b.sar = el(LB.svg, 'g', { 'data-s5': b.kod });
    b.noktalar = [[0, 0, 1], [0, 0, 1], [0, 0, 1]]; // ctx.balon bu diziyi okur; uygula() yerinde değiştirir
    b.noktalar.splice(0, 3, ...kuyrukYerel(b).map((n) => [...n]));
    const u0 = b.noktalar[2]; // sahibine bakan kenardan büyür
    const l0 = Math.hypot(u0[0], u0[1]) || 1;
    const koken = `${(50 + (u0[0] / l0) * 42).toFixed(0)}% ${(50 + (u0[1] / l0) * 42).toFixed(0)}%`;
    b.bal = balon(b.sar, { c: [0, 0], r, noktalar: b.noktalar, tohum: T.balon, koken });
    b.bal.bulut.setAttribute('data-s5bulut', b.kod);
    b.cizimler = [parca(a.cizim, fikirCiz(b.bal.ic, a.cizim, { boy: icBoy, tohum: T.cizim }))];
    if (a.degis) {
      const ad2 = a.degis[1], boy2 = an && an.cizim === ad2 ? an.icBoy : (IKINCI_BOY[ad2] ?? icBoy) * TB;
      b.cizimler.push(parca(ad2, fikirCiz(b.bal.ic, ad2, { boy: boy2, tohum: T.cizim + 10 })));
    }
    if (an) b.sonYerel = an.noktalar.map(([x, y, rad]) => [x - an.c[0], y - an.c[1], rad]);
    uygula(b);
  }

  // ---------- Dikey yığın: şeritte yeni fikir doğunca (3 k önce) şeridin eski balonları bir yuva yukarı itilir (16 k EO);
  // doğum yuvasından ayrılanın kuyruğu kısalır. N1 yüksekte doğduğu için yuvası onu geçene dek yerinde kalır, ama altına
  // ilk fikir gelince kuyruğu kısalır (yoksa yeni balonun içinden geçerdi).
  const yuvaPlan = {}; // kod → planlanan y (takvim boyunca)
  if (DIKEY) {
    for (let c = 0; c < 3; c++) {
      const serit = kodlar.filter((kod) => BALON[kod].serit === c);
      serit.forEach((kod) => { yuvaPlan[kod] = BALON[kod].pr.y; });
      if (c === BALON.N1.serit) {
        const b = BALON.N1, [t0, t1, yHedef] = N1_DIKEY.yuksel;
        tl.to(b.pr, { x: SERIT_X[c] + b.kayD[0], y: yHedef + b.kayD[1], s: SB * BOY_CARPAN.N1, duration: k(t1 - t0), ease: 'sine.inOut', onUpdate: () => uygula(b) }, k(t0));
        tl.to(b.pr, { m: 1, duration: k(16), ease: E.EO, onUpdate: () => uygula(b) }, k(N1_DIKEY.kisal));
        b.kisaldi = true;
        yuvaPlan.N1 = yHedef + b.kayD[1];
      }
      serit.forEach((yeni, i) => {
        if (i === 0) return;
        const t0 = AKIS[yeni].balon - 3;
        serit.slice(0, i).forEach((kod, j) => {
          const b = BALON[kod], hedef = yuvaY(c, i - j) + b.kayD[1];
          const ilk = i - j === 1 || (kod === 'N1' && b.pr.m === 0 && !b.kisaldi);
          const ek = {};
          if (ilk && !b.kisaldi) { ek.m = 1; b.kisaldi = true; }
          if (hedef < yuvaPlan[kod] - 0.5) { ek.y = hedef; yuvaPlan[kod] = hedef; }
          if (Object.keys(ek).length) tl.to(b.pr, { ...ek, duration: k(16), ease: E.EO, onUpdate: () => uygula(b) }, k(t0));
        });
      });
    }
  }
  // Balonun verilen karedeki yeri (yazıları ve devri hesaplamak için; dikey takvim sonrası)
  const sonYer = (b) => [DIKEY && b.kod === 'N1' ? SERIT_X[b.serit] + b.kayD[0] : b.pr.x, DIKEY ? yuvaPlan[b.kod] : b.pr.y];

  // Balon açılışı + çizimin çizilmesi (konturlar 2 k arayla, 7 k EO); fikir değişimi: geri sarılır, yenisi çizilir.
  // Sıfır boylu çizgi yuvarlak uçla NOKTA çizer (DrawSVG 0% ve 100% 100%): her kontur kendi çizimi başlayana dek gizli,
  // geri sarılan eski çizim bitince gizlenir (yoksa fikri değişen balonda eski çizimin uç noktaları kalıyordu).
  const tumYollar = (b) => b.cizimler.flatMap((c) => c.yollar);
  const tumDolgular = (b) => b.cizimler.flatMap((c) => c.dolgular.map((h) => h.dolgu));
  // Dolgu kendi konturu %60 çizilmişken 5 k'da belirir: renk çizgiyle birlikte gelir, çizimden önce görünmez
  const ciz = (c, t0, sure, ara) => {
    tl.fromTo(c.yollar, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(sure), ease: E.EO, stagger: k(ara), immediateRender: false }, k(t0));
    c.yollar.forEach((y, i) => tl.set(y, { visibility: 'visible' }, k(t0 + i * ara)));
    c.dolgular.forEach((h) => tl.fromTo(h.dolgu, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(5), ease: 'none', immediateRender: false }, k(t0 + h.j * ara + sure * 0.6)));
  };
  for (const b of Object.values(BALON)) {
    const { a, bal } = b;
    gsap.set(tumYollar(b), { visibility: 'hidden' });
    gsap.set(tumDolgular(b), { autoAlpha: 0 });
    tl.set(tumYollar(b), { drawSVG: '0%', visibility: 'hidden' }, k(a.balon));
    tl.set(tumDolgular(b), { autoAlpha: 0 }, k(a.balon));
    bal.ac(a.balon, { hizli: !!a.hizli });
    ctx.isaret(a.balon, 'dusunce');
    const c0 = b.cizimler[0];
    ciz(c0, a.balon + (a.hizli ? 6 : 10), a.hizli ? 5 : 7, a.hizli ? 1.5 : 2);
    if (a.degis) {
      // Fikir değişir: eski çizim geri sarılırken dolgusu söner (eski renk yeni çizimin ardında kalmasın)
      const [kd] = a.degis, c1 = b.cizimler[1];
      tl.to(c0.yollar, { drawSVG: '100% 100%', duration: k(5), ease: E.EI, stagger: k(0.6) }, k(kd));
      tl.fromTo(c0.dolgular.map((h) => h.dolgu), { autoAlpha: 1 }, { autoAlpha: 0, duration: k(5), ease: E.EI, immediateRender: false }, k(kd));
      tl.set(c0.yollar, { visibility: 'hidden' }, k(kd + 5 + 0.6 * c0.yollar.length));
      ciz(c1, kd + 7, 7, 2);
    }
  }

  // ---------- Kamera: alt kenar sabit (kafalar hep alttan çıkar), S0 → 1,1 geri çekilir (sine.out); devirde 1.
  // Dikeyde x ilgiyi izler: N1'in sağındaki konuşma balonu (585) → N2'nin sol şeritteki yapbozu (520) → E'nin d20'si (545).
  const S0 = yer(1.8, 1.75), S1 = 1.1, kamEase = gsap.parseEase('sine.out');
  const yumusak = (a, b, t, t0, t1) => { const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))); return a + (b - a) * u * u * (3 - 2 * u); };
  const kamKX = (kare) => (DIKEY
    ? (kare < 2118 ? yumusak(585, 520, kare, 2088, 2118) : kare < 2148 ? yumusak(520, 545, kare, 2118, 2148) : yumusak(545, 540, kare, 2148, DEVIR))
    : 900 + 60 * kamEase((kare - BAS) / (DEVIR - BAS)));
  const kam = (kare) => {
    const e = kamEase(Math.min(1, Math.max(0, (kare - BAS) / (DEVIR - BAS))));
    return odak(kamKX(kare), H, S0 + (S1 - S0) * e, W / 2, H);
  };
  tl.set(ctx.kamera, kam(BAS), k(BAS));
  const kp = { t: BAS };
  tl.fromTo(kp, { t: BAS }, { t: DEVIR, duration: k(DEVIR - BAS), ease: 'none', immediateRender: false, onUpdate: () => gsap.set(ctx.kamera, kam(kp.t)) }, k(BAS));
  tl.to(ctx.kamera, { ...odak(W / 2, H, 1, W / 2, H), duration: k(SON - DEVIR), ease: E.EO }, k(DEVIR)); // = { x:0, y:0, scale:1 }

  // Kameranın verilen karede gösterdiği dünya alanı [sol, sağ, üst] (yazıları görünür alana sıkıştırmak için)
  const gorunur = (kare) => { const c = kam(kare); return [-c.x / c.scale, (W - c.x) / c.scale, -c.y / c.scale]; };
  const sigdir = (x, w, kare, pay = 24) => { const [sl, sg] = gorunur(kare); return Math.max(sl + pay, Math.min(sg - pay - w, x)); };

  // ---------- Pozlar (ayrık çizim: ifade ve bakış; 12 fps ızgarasına değil, yazıldıkları karede): anahtar kareler + göz kırpmaları
  const POZ = {};
  const pz = (kod, kare, d) => (POZ[kod] ||= []).push([kare, d]);
  const yon = (a, b) => Math.sign(Math.round((b - a) / 40)); // bakış yönü (-1, 0, 1)
  for (const K of Object.values(KISI)) {
    const a = AKIS[K.kod], b = BALON[K.kod];
    pz(K.kod, a.cik, { ifade: 'merak', bakis: [0, 0] });
    pz(K.kod, a.balon + 2, { ifade: 'ozlem', bakis: [yon(K.x, b.dogum[0]), -1] });
    // Fikrini kurduktan sonra: satır 2 sürerken N2'nin balonuna, sonra genel olarak yukarı
    const t1 = a.balon + 34;
    if (t1 < KESKE && K.kod !== 'N1') pz(K.kod, t1, t1 < SATIR2_SIL - 4 && K.kod !== 'N2' ? { ifade: 'merak', bakis: [yon(K.x, BALON.N2.dogum[0]), -1] } : { ifade: 'notr', bakis: [0, -1] });
  }
  // #5.1 N1 kameraya döner ve sorar (ağız 5 k'da bir); sonra balonuna bakar
  pz('N1', SOZ1[0] - 2, { ifade: 'merak', bakis: [0, 0] });
  ['saskin', 'merak', 'saskin', 'notr', 'saskin', 'merak'].forEach((f, i) => pz('N1', SOZ1[0] + 4 + i * 5, { ifade: f }));
  pz('N1', 2070, { ifade: 'ozlem', bakis: [yon(KISI.N1.x, BALON.N1.dogum[0]), -1] });
  // #5.2 N2 yapbozuna bakar, düşünür; N1 ona döner; E çıkar, önce N1'e, sonra N2'nin yapbozuna bakar
  pz('N2', 2126, { ifade: 'merak', bakis: [0, -1] });
  pz('N1', 2118, { ifade: 'merak', bakis: [yon(KISI.N1.x, BALON.N2.dogum[0]), -1] });
  pz('E', 2118, { ifade: 'merak', bakis: [yon(KISI.E.x, KISI.N1.x), 0] });
  pz('E', 2130, { ifade: 'merak', bakis: [yon(KISI.E.x, BALON.N2.dogum[0]), -1] });
  // N3 önce çevresine bakar, sonra düşünür
  pz('N3', 2206, { ifade: 'merak', bakis: [-1, 0] });
  pz('N3', 2211, { ifade: 'merak', bakis: [1, 0] });
  // #5.3 "Keşke…": herkes yukarı, fikirlerine bakar (özlem); 5 k arayla üç dalga
  for (const K of Object.values(KISI)) {
    const t = Math.max(KESKE + 4 + (Math.round(K.x / 37) % 3) * 5, AKIS[K.kod].balon + 16);
    pz(K.kod, t, { ifade: 'ozlem', bakis: [yon(K.x, sonYer(BALON[K.kod])[0]), -1] });
  }
  // Devir: kalabalık ortadan açılır. Önce yürüdükleri yana bakarlar (merak), varınca yukarı: sahipler kendi balonuna,
  // ötekiler ortaya (logonun geleceği yer). Son poz SON_KISILER'de (s6 aynısıyla başlar); gülümseme s6'da
  for (const K of Object.values(KISI)) {
    const sn = SONH.kisiler[K.kod];
    pz(K.kod, DEVIR + 3, { ifade: 'merak', bakis: [Math.sign(Math.round((sn.son.x - K.x) / 40)), 0] });
    pz(K.kod, DEVIR + 34 + (Math.round(K.x / 53) % 3) * 5, { ifade: sn.ifade, bakis: sn.bakis });
  }

  const kirpKare = new Map(); // aynı 5 karelik dilimde en çok iki kişi göz kırpar
  for (const K of Object.values(KISI)) {
    const liste = POZ[K.kod].map(([kare, d]) => [kare, d]).sort((x, y) => x[0] - y[0]);
    // Göz kırpma (6 k, ~0,1 sn): 70–110 k arayla; bir anahtar kareye 10 k'dan yakınsa ya da o dilimde iki kırpma varsa atla
    const r = ctx.rng(K.p.tohum * 13 + 5), kirpmalar = [];
    for (let f = AKIS[K.kod].cik + 40 + Math.floor(r() * 40); f < DEVIR - 6; f += 70 + Math.floor(r() * 40)) {
      const dilim = Math.round(f / 5);
      if (liste.some(([kk]) => Math.abs(kk - f) < 10) || (kirpKare.get(dilim) || 0) >= 2) continue;
      kirpKare.set(dilim, (kirpKare.get(dilim) || 0) + 1);
      kirpmalar.push(f);
    }
    const olaylar = [...liste.map(([kk, d]) => ({ kk, d })), ...kirpmalar.flatMap((kk) => [{ kk, kirp: true }, { kk: kk + 6, geri: true }])].sort((x, y) => x.kk - y.kk);
    let durum = { ifade: 'merak', bakis: [0, 0] };
    for (const o of olaylar) {
      if (o.d) { durum = { ...durum, ...o.d }; const d = { ...durum }; tl.call(() => K.h.poz(d), null, k(o.kk)); }
      else if (o.kirp) tl.call(() => K.h.poz({ ifade: 'kirp' }), null, k(o.kk));
      else { const d = { ...durum }; tl.call(() => K.h.poz(d), null, k(o.kk)); }
    }
  }

  // ---------- Sözler: ölçüp yerleştir (yazının sol üstü), sonra kur
  const olc = (m, boyut) => { const p = ctx.elYazisi(LY.div, m, { x: 0, y: 0, boyut }); const o = [p.offsetWidth, p.offsetHeight]; p.remove(); return o; };
  // #5.1 "Bunu canlandırabilir miyiz?" (konuşma balonu, k2026–2130; yazı k2030–2046). Yatay: N1'in yüzünün solunda, iki satır.
  // Dikey: başının sağ üstünde, üç satır (düşünce balonu sol üstte, noktaları kutunun solundan iner; kuyruk başın yanına).
  {
    const K = KISI.N1;
    const m = yer(metin('Bunu canlandırabilir<br>miyiz?', 'Can we bring<br>this to life?'), metin('Bunu<br>canlandırabilir<br>miyiz?', 'Can we<br>bring this<br>to life?'));
    const boyut = yer(44, 36), [w, h] = olc(m, boyut);
    const x = yer(K.x - K.yuzYari - 56 - 26 - w, K.x + 34);
    const y = yer(K.yuzY - h - 6, K.ust - 64 - h);
    const kuyrukUc = yer([K.x - K.yuzYari - 10, K.agiz[1] - 6], [K.x + K.yuzYari * 1.05, K.ust + 50]);
    const kb = ctx.konus(LY, m, { x: sigdir(x, w, 2034, 50), y, kuyruk: kuyrukUc, boyut, tohum: 571, aci: yer(-2, -3) });
    kb.g.setAttribute('data-s5soz', 'konusma');
    kb.ac(SOZ1[0], 16);
    ctx.isaret(SOZ1[0], 'konusma');
    kb.kapat(SOZ1[1]); // yazı k2030'dan sönmeye dek 90 k ekranda (tam yazılı 74 k)
  }
  // #5.2 "Yapboz yapsam, 3B olur mu?" (el yazısı, N2'nin balonunun üstünde, k2126–2232: 92 k + sönme, beş kelime). Dikeyde yazı
  // balona bağlı bir taşıyıcıda: şerit itildikçe balonla birlikte yükselir (sol şeritte N2'nin üstü hep boş).
  {
    const b = BALON.N2, [bx, by] = b.dogum, rcy = b.r[1] * b.pr.s;
    b.tasiyici = document.createElement('div');
    Object.assign(b.tasiyici.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
    LY.div.appendChild(b.tasiyici);
    const m = yer(metin(`Yapboz yapsam, 3B olur mu?${NBSP}`, `A puzzle… could it be 3D?${NBSP}`), metin(`Yapboz yapsam,<br>3B olur mu?${NBSP}`, `A puzzle…<br>could it be 3D?${NBSP}`));
    const boyut = yer(46, 46), [w, h] = olc(m, boyut);
    const p = ctx.elYazisi(b.tasiyici, m, { x: sigdir(bx - w / 2, w, SATIR2), y: by - rcy * 1.2 - 10 - h, boyut, aci: -3 });
    p.dataset.s5soz = 'yapboz';
    ctx.yazElYazisi(p, SATIR2, 22);
    ctx.silElYazisi(p, SATIR2_SIL);
  }
  // #5.3 "Keşke şöyle olsa…" (el yazısı, kalabalığın dileği: yığının / bulutun tepesinde, k2226–2330) + turuncu alt çizgi
  {
    const tepe = DIKEY ? BALON.N1 : BALON.N3, [tx, ty] = sonYer(tepe), rcy = tepe.r[1] * tepe.pr.s;
    const m = metin('Keşke şöyle olsa…', 'If only…');
    const boyut = yer(56, 60), [w, h] = olc(m, boyut);
    const x = sigdir(tx - w / 2, w, KESKE), y = ty - rcy * 1.22 - 14 - h, ACI = -2;
    const p = ctx.elYazisi(LY.div, m, { x, y, boyut, aci: ACI });
    p.dataset.s5soz = 'keske';
    ctx.yazElYazisi(p, KESKE, 20);
    ctx.isaret(KESKE, 'vurgu', { not: 'kalabalığın dileği' });
    ctx.silElYazisi(p, KESKE_SIL);
    // Alt çizgi (dilek işareti, filmin tek vurgu rengi): yazı bitince çekilir, yazıyla birlikte söner
    const a = ACI * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), oy = h / 2;
    const don = ([px, py]) => [x + px * ca - (py - oy) * sa, y + oy + px * sa + (py - oy) * ca];
    const yy = h * 0.98, ww = w * 0.9;
    const altG = el(LY.svg, 'g');
    const alt = ctx.cizgi(altG, [[-4, yy + 2], [ww * 0.38, yy - 2], [ww * 0.72, yy + 1], [ww + 6, yy - 3]].map(don), { renk: ctx.VURGU, kalinlik: 5, tohum: 588, genlik: 0.9 });
    tl.set(alt.yol, { drawSVG: '0%' }, k(BAS));
    tl.fromTo(alt.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, k(KESKE + 20));
    tl.to(altG, { autoAlpha: 0, y: -18, duration: k(14), ease: E.EI }, k(KESKE_SIL));
  }

  // ---------- DEVİR (k2312–SON): kalabalık ortadan ikiye ayrılır, kenarlara çekilir (kaybolmaz); sekiz balon sahiplerinin
  // başının üstünde kalır. k SON'da kamera odak(0,0,1): dünya = ekran; s6 aynı yerleşimi kendi katmanında kurar.
  ctx.isaret(DEVIR, 'vurgu');
  const merkez = [W / 2, H / 2];
  const anahtarlar = SONH.balonlar.map((an) => BALON[an.kod]); // z sırası: önce üst kat (arkada), sonra alt kat (önde)
  const digerleri = Object.values(BALON).filter((b) => !b.an)
    .sort((x, y) => Math.hypot(sonYer(x)[0] - merkez[0], sonYer(x)[1] - merkez[1]) - Math.hypot(sonYer(y)[0] - merkez[0], sonYer(y)[1] - merkez[1]));
  // Yedi balon söner (ortadan dışa, yarım k arayla, 12 k): sahipleri kalır, ortaya bakar
  digerleri.forEach((b, i) => b.bal.kapat(DEVIR + Math.floor(i / 2), 12));
  // Anahtar balonlar en üste (son z sırasıyla). İkinci kalem geçişinin (kontur2) kesik çizgisi s6'daki gibi kaynama 0'ın yol
  // boyuyla yeniden kurulur: açılışta başka bir kaynama karesinde ölçülmüştü, devirde ince çizgi birkaç px kayıyordu
  tl.call(() => anahtarlar.forEach((b) => {
    LB.svg.appendChild(b.sar);
    b.bal.ciz(0); gsap.set(b.bal.kontur2, { drawSVG: '4% 92%' }); b.bal.ciz();
  }), null, k(DEVIR));
  // Kişiler (60 fps, her karede): ortadakiler önce kalkar (yer açılsın), dışa doğru 0,6 k arayla; hepsi son 6 k'dan önce
  // durur (devir anında herkes yerinde). Ritim: yol boyunca ~170 px'te bir küçük sekme (adım); yerinde kalan da bir kez kıpırdar.
  // Dönüşüm kabın üstünde (öteleme + ölçek m): çıkış tween'i h.g'de, filtre kapta (renk; dönüşümden bağımsız).
  const Y0 = SON_YER[yonAd];
  const kayanlar = Object.values(KISI).sort((x, y) => Math.abs(x.x - W / 2) - Math.abs(y.x - W / 2));
  kayanlar.forEach((K, i) => {
    const sn = K.son, m = Y0.m;
    K.hedef = { tx: sn.x - m * K.h.x, ty: (sn.alt - BOY.boy * sn.o) - m * (K.h.alt - BOY.boy * K.h.olcek), m };
    K.t0 = DEVIR + 2 + Math.round(i * 0.6);
    K.D = SON - 6 - K.t0;
    K.adimSay = Math.max(1, Math.round(Math.abs(K.hedef.tx) / 170));
  });
  const P2IO = gsap.parseEase('power2.inOut');
  const kis = (v) => Math.max(0, Math.min(1, v));
  const yurut = (fHam) => {
    const f = Math.max(DEVIR, Math.min(SON, fHam));
    for (const K of kayanlar) {
      const uq = kis((f - K.t0) / K.D), u = P2IO(uq), h = K.hedef;
      const sek = -Math.abs(Math.sin(Math.PI * K.adimSay * uq)) * 7 * K.S.o;
      K.cur = { tx: h.tx * u, ty: h.ty * u + sek, m: 1 + (h.m - 1) * u };
      K.kap.setAttribute('transform', `translate(${K.cur.tx.toFixed(2)} ${K.cur.ty.toFixed(2)}) scale(${K.cur.m.toFixed(4)})`);
    }
    for (const b of anahtarlar) uygula(b);
  };
  const dv = { f: DEVIR - 1 };
  tl.fromTo(dv, { f: DEVIR - 1 }, { f: SON + 1, duration: k(SON + 2 - DEVIR), ease: 'none', immediateRender: false, onUpdate: () => yurut(dv.f) }, k(DEVIR - 1));
  // Balonlar sahiplerinin üstüne süzülür (6 k geç kalkar: sahiplerini izler, onlardan önce durur). Alt kat bağlı kuyrukla
  // (m 0), üst kat kısa kuyrukla (m 1) sahibine doğru; ölçek → 1 (son boy), noktalar SON_BALONLAR'a (d → 1)
  for (const b of anahtarlar) {
    tl.to(b.pr, { x: b.an.c[0], y: b.an.c[1], s: 1, d: 1, m: b.an.kisa ? 1 : 0, duration: k(SON - 10 - DEVIR), ease: 'power2.inOut', onUpdate: () => uygula(b) }, k(DEVIR + 6));
  }
}
