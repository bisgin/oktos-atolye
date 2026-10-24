// Fikir çizimleri (v06): sahnelerin düşünce balonlarında ve finalde logo inşasında kullanılan ORTAK doodle çizimler.
// Tek kaynak: aynı fikir her sahnede aynı çizgilerle görünür; s6-final bu çizgileri ayırıp logo kenarlarına taşır
// (biçim dönüşümü değil inşa). Bu yüzden çizimler çoğunlukla düz ya da az kavisli konturlardan kurulur.
// Biçim: birim kutu (merkez 0,0; x sağa, y aşağı; kapsam ±0,5), her çizim kontur dizisi { p: [[x,y],...], kapali, yumusak }.
// Noktalar KÖŞE noktalarıdır (logo inşası kenarları buradan okur). cizimKur çizerken köşelerin yanına nokta ekler (duz):
// ctx.cizgi Catmull-Rom olduğu için seyrek köşeli çokgen yastık gibi şişerdi. yumusak: true olanlar (oval, sarmal) olduğu gibi çizilir.
// Kullanım: cizimKur(ctx, ust, 'qrStandi', { c: [x, y], boy: 220, kalinlik: 5, tohum: 40 }) → ctx.cizgi tutamaçları
// (her birinde g, yol; DrawSVG ile sırayla çizilebilir). Sahne modülleri bu dosyayı DEĞİŞTİRMEZ; yeni çizim kendi modülünde durur.
// Renk (kullanıcı 2026-10-22: "ürettiğimiz şeylerin rengi biraz daha renkli ve açık görünsün; bütün video siyah beyaz"):
// Oktos'un üretebileceği her şey (balondaki fikirler, sahnedeki ürünler) URUN_RENK'in açık, yumuşak tonlarıyla dolar;
// kişiler ve mekân mono kalır. Kontur her zaman mürekkep. Kapalı konturun r alanı paletteki anahtardır.
import { oval } from '../insan.js';

export const URUN_RENK = {
  nane: '#bfe5d1', gok: '#bcd9f0', limon: '#f5e3a0', seftali: '#f7ccae', seftaliKoyu: '#eab48f',
  lila: '#d8cbf0', lilaAcik: '#ebe3f8', mercan: '#f4b9ad', mercanKoyu: '#e79c8e', adacayi: '#cfe3b6',
  beyaz: '#fbf9f5', koyu: '#4a4640',
};
// Sırayla kullanılacak açık tonlar (yeni ürün çizen modüller için): ürünler birbirinden ayrılsın
export const URUN_SIRA = ['gok', 'nane', 'limon', 'seftali', 'lila', 'mercan', 'adacayi'];
export const urunRengi = (ad) => URUN_RENK[ad] || ad;

const ALTIGEN = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26]];

export const CIZIMLER = {
  // Kafe (A): masaya konan çadır QR standı
  qrStandi: [
    { p: [[-0.32, 0.42], [-0.22, -0.42], [0.22, -0.42], [0.32, 0.42]], kapali: true, r: 'gok' },
    { p: [[-0.44, 0.42], [0.44, 0.42]] },
    { p: [[-0.15, -0.26], [0.15, -0.26], [0.15, 0.06], [-0.15, 0.06]], kapali: true, r: 'beyaz' },
    { p: [[-0.12, -0.23], [-0.04, -0.23], [-0.04, -0.15], [-0.12, -0.15]], kapali: true, r: 'koyu' },
    { p: [[0.04, -0.23], [0.12, -0.23], [0.12, -0.15], [0.04, -0.15]], kapali: true, r: 'koyu' },
    { p: [[-0.12, -0.05], [-0.04, -0.05], [-0.04, 0.03], [-0.12, 0.03]], kapali: true, r: 'koyu' },
    { p: [[0.02, -0.07], [0.12, -0.07]] },
    { p: [[0.04, 0.0], [0.12, 0.0]] },
    { p: [[-0.14, 0.22], [0.14, 0.22]] },
  ],
  // Kafe (A, 2026-10-25 K1): peçeteye karaladığı kendi yaratığı (boynuzlu, iri gözlü, oturan kedi-yaratık); QR standının yerine.
  // s1-kafe peçete karalaması, balondaki 3B hâli, kalabalık ve final aynı noktaları kullanır. Sıra: gövde (ön ayak arası
  // çentikli), kuyruk, baş (kedi kulaklı), iki boynuz, iki göz, iki bebek, ağız. 25 uzun kenar (gövde 8, kuyruk 3, baş 10,
  // boynuz 2 + 2); göz ve ağız kısa ayrıntı. Renk: limon gövde ve baş, şeftali boynuz (finalde lila d20 ve gök telefon
  // standıyla karışmasın)
  yaratik: [
    { p: [[-0.3, 0.46], [-0.03, 0.46], [0, 0.36], [0.03, 0.46], [0.3, 0.46], [0.34, 0.3], [0.26, 0.12], [0.18, -0.02], [-0.18, -0.02], [-0.26, 0.12], [-0.34, 0.3]], kapali: true, r: 'limon' },
    { p: [[0.31, 0.41], [0.46, 0.36], [0.47, 0.2], [0.36, 0.1]] },
    { p: [[-0.27, -0.03], [-0.36, -0.17], [-0.33, -0.32], [-0.38, -0.47], [-0.18, -0.38], [0.18, -0.38], [0.38, -0.47], [0.33, -0.32], [0.36, -0.17], [0.27, -0.03]], kapali: true, r: 'limon' },
    { p: [[-0.13, -0.385], [-0.04, -0.385], [-0.19, -0.52]], kapali: true, r: 'seftali' },
    { p: [[0.04, -0.385], [0.13, -0.385], [0.19, -0.52]], kapali: true, r: 'seftali' },
    { p: oval(-0.14, -0.21, 0.1, 0.11, 0, 360, 14), kapali: true, r: 'beyaz', yumusak: true },
    { p: oval(0.14, -0.21, 0.1, 0.11, 0, 360, 14), kapali: true, r: 'beyaz', yumusak: true },
    { p: oval(-0.16, -0.18, 0.05, 0.065, 0, 360, 10), kapali: true, r: 'koyu', yumusak: true },
    { p: oval(0.12, -0.18, 0.05, 0.065, 0, 360, 10), kapali: true, r: 'koyu', yumusak: true },
    { p: [[-0.06, -0.075], [-0.03, -0.05], [0, -0.075], [0.03, -0.05], [0.06, -0.075]] },
  ],
  // Atölye (B): üstten bölmeli vida organizeri
  organizer: [
    { p: [[-0.46, -0.3], [0.46, -0.3], [0.46, 0.3], [-0.46, 0.3]], kapali: true, r: 'nane' },
    { p: [[-0.15, -0.3], [-0.15, 0.3]] },
    { p: [[0.15, -0.3], [0.15, 0.3]] },
    { p: [[-0.15, 0.0], [0.15, 0.0]] },
    { p: [[-0.38, -0.18], [-0.24, -0.1]] },
    { p: [[0.24, 0.12], [0.38, 0.2]] },
    { p: [[-0.06, -0.16], [0.06, -0.16]] },
  ],
  // Balkon (D): gül ve laleli saksı (şık tasarım; klişe saksı sahnenin kendi çizimidir)
  saksi: [
    { p: [[-0.24, 0.06], [0.24, 0.06], [0.18, 0.48], [-0.18, 0.48]], kapali: true, r: 'seftali' },
    { p: [[-0.26, 0.06], [0.26, 0.06]] },
    { p: [[-0.1, 0.06], [-0.12, -0.24]] },
    { p: [[-0.22, -0.26], [-0.2, -0.44], [-0.15, -0.34], [-0.11, -0.46], [-0.07, -0.34], [-0.02, -0.44], [0.0, -0.26], [-0.11, -0.2]], kapali: true, r: 'mercan' },
    { p: [[0.08, 0.06], [0.12, -0.2]] },
    { p: [[0.12, -0.3], [0.2, -0.3], [0.2, -0.38], [0.12, -0.4], [0.05, -0.34], [0.09, -0.25], [0.2, -0.23], [0.26, -0.33]], yumusak: true },
    { p: [[0.1, -0.06], [0.24, -0.13], [0.13, -0.02]], yumusak: true },
  ],
  // FRP (E): d20 (v2-zar ile aynı biçim) ve d8
  d20: [
    { p: ALTIGEN, kapali: true, r: 'lila' },
    { p: [[-0.27, 0.16], [0, -0.3], [0.27, 0.16]], kapali: true, r: 'lilaAcik' },
    { p: [[0, -0.52], [-0.27, 0.16]] }, { p: [[0, -0.52], [0.27, 0.16]] },
    { p: [[-0.46, -0.26], [-0.27, 0.16]] }, { p: [[0.46, -0.26], [0.27, 0.16]] },
    { p: [[0, 0.52], [-0.27, 0.16]] }, { p: [[0, 0.52], [0.27, 0.16]] },
  ],
  d8: [
    { p: [[0, -0.54], [0.43, 0], [0, 0.54], [-0.43, 0]], kapali: true, r: 'limon' },
    { p: [[-0.43, 0], [0.1, 0.06], [0.43, 0]] },
    { p: [[0, -0.54], [0.1, 0.06], [0, 0.54]] },
  ],
  // FRP (E): kendi tasarımları piyon
  piyon: [
    { p: [[-0.26, 0.44], [0.26, 0.44], [0.2, 0.32], [-0.2, 0.32]], kapali: true, r: 'mercan' },
    { p: [[-0.16, 0.32], [-0.07, -0.04], [0.07, -0.04], [0.16, 0.32]], kapali: true, r: 'mercan' },
    { p: [[-0.13, -0.04], [0.13, -0.04], [0.13, -0.1], [-0.13, -0.1]], kapali: true, r: 'mercanKoyu' },
    { p: oval(0, -0.27, 0.15, 0.15, 0, 360, 14), kapali: true, r: 'mercan', yumusak: true },
  ],
  // FRP (E2): kutu oyunu kutusu (eğik bakış: kapak, ön yüz, yan yüz)
  kutuOyunu: [
    { p: [[-0.44, -0.12], [0.06, -0.36], [0.46, -0.16], [-0.04, 0.08]], kapali: true, r: 'limon' },
    { p: [[-0.44, -0.12], [-0.04, 0.08], [-0.04, 0.4], [-0.44, 0.18]], kapali: true, r: 'seftali' },
    { p: [[-0.04, 0.08], [0.46, -0.16], [0.46, 0.16], [-0.04, 0.4]], kapali: true, r: 'seftaliKoyu' },
    { p: oval(0.02, -0.14, 0.08, 0.04, 0, 360, 10), kapali: true, r: 'beyaz', yumusak: true },
    { p: [[-0.2, -0.13], [-0.1, -0.18], [-0.04, -0.14], [-0.14, -0.09]], kapali: true, r: 'mercan' },
  ],
  // Kalabalık: 3B yapboz parçası (kalınlık çizgisiyle)
  yapboz: [
    { p: [[-0.3, -0.3], [-0.06, -0.3], [-0.09, -0.4], [0, -0.47], [0.09, -0.4], [0.06, -0.3], [0.3, -0.3], [0.3, -0.06], [0.4, -0.09], [0.47, 0], [0.4, 0.09], [0.3, 0.06], [0.3, 0.3], [-0.3, 0.3]], kapali: true, r: 'adacayi' },
    { p: [[0.3, 0.3], [0.37, 0.37], [-0.23, 0.37], [-0.3, 0.3]] },
    { p: [[0.3, 0.06], [0.37, 0.13], [0.37, 0.37]] },
  ],
  // Kalabalık: telefon standı (yandan) ve yaslanan telefon
  telefonStandi: [
    { p: [[-0.42, 0.44], [0.32, 0.44], [0.32, 0.35], [-0.42, 0.35]], kapali: true, r: 'gok' },
    { p: [[-0.1, 0.35], [0.2, -0.4], [0.29, -0.36], [0.03, 0.35]], kapali: true, r: 'gok' },
    { p: [[-0.38, 0.35], [-0.38, 0.2], [-0.31, 0.2]] },
    { p: [[-0.29, 0.31], [0.07, -0.46], [0.16, -0.42], [-0.2, 0.35]], kapali: true, r: 'koyu' },
  ],
  // Kalabalık: Wi-Fi plakası (yalnız bir an görünür)
  wifiPlaka: [
    { p: [[-0.44, -0.3], [0.44, -0.3], [0.44, 0.3], [-0.44, 0.3]], kapali: true, r: 'nane' },
    { p: oval(0, 0.12, 0.3, 0.26, 225, 315, 8), yumusak: true },
    { p: oval(0, 0.12, 0.19, 0.16, 225, 315, 6), yumusak: true },
    { p: oval(0, 0.12, 0.05, 0.05, 0, 360, 8), kapali: true, r: 'koyu', yumusak: true },
  ],
};

// Köşelerin iki yanına (%14 ve %86) nokta ekler: Catmull-Rom kenarı düz, köşeyi sıkı yuvarlak çizer (s5-kalabalik ile aynı)
export function duz(pts, kapali = false) {
  const n = pts.length, son = kapali ? n : n - 1, d = [];
  for (let i = 0; i < son; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    d.push(a);
    for (const t of [0.14, 0.86]) d.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  if (!kapali) d.push(pts[n - 1]);
  return d;
}

// Çizimi sahneye kur: her kontur ayrı ctx.cizgi (kaynar). Dönüş: tutamaç dizisi (sırayla çizmek için h.yol'a DrawSVG)
// renkli: true (varsayılan) → kapalı konturlar r rengiyle dolar; dolgu verilirse hepsi o renkle dolar; renkli: false → dolgusuz
export function cizimKur(ctx, ust, ad, { c = [0, 0], boy = 200, kalinlik = 5, tohum = 40, renk, dolgu = null, renkli = true } = {}) {
  const tanim = CIZIMLER[ad];
  if (!tanim) throw new Error(`cizimler.js: '${ad}' yok`);
  return tanim.map((k, i) => ctx.cizgi(ust, (k.yumusak ? k.p : duz(k.p, !!k.kapali)).map(([x, y]) => [c[0] + x * boy, c[1] + y * boy]), {
    kapali: !!k.kapali, kalinlik, tohum: tohum + i, genlik: 1.0, renk,
    dolgu: k.kapali ? (dolgu ?? (renkli && k.r ? URUN_RENK[k.r] : null)) : null, kay: [2, 2],
  }));
}
