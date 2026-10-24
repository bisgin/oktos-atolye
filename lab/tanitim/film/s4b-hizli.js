// Sahne 4b, HIZLI GEÇİŞLER (v06; s4-frp'den sonra, s5-kalabalik'tan önce; iç kareler 0–491, ~8,2 sn). Kullanıcı notu:
// "fikirler birleşmeden önce ikişer saniyelik hızlı sahneler". Sorun sahnesi DEĞİL: Oktos ürünlerinin hayattaki hızlı
// görüntüleri. Düz kesmeler, her çekimde küçük bir kamera itişi ya da kayması (ölü kare yok); konuşma yok.
// #4b.1 (k0–155) Bahçıvan: genç bahçıvan (geniş kenarlı hasır şapka, önlük, sıvalı kollar) tezgâhta 8×8 fide kasasına fide
//      diker; elleri toprakta (parmak uçları toprak yığınının altında). Yanında altlıklı kasalar üst üste istif, en üsttekinin
//      her gözünde bir filiz. k60 başını kaldırıp gülümser; elinin tersiyle alnını siler, alnında toprak izi kalır.
//      Kasalar baskı ürünümüz gibi: dış duvarlarda katman çizgileri, her katta altlığın (taşma tablası) kenarı. Tezgâh ve
//      kasalar küçük bir perspektif izdüşümüyle (kamera3: Y yukarı, Z kameraya, mm) çizilir; ızgara gerçek kısalmayla okunur.
// #4b.2 (k156–263) Çanta süsü: süse yakın plan (ürün kahraman, kadraj boyunun ~%30'u): koyu bez çantanın fermuarı, halka,
//      çantanın kenarı; kişinin yüzü kadraj dışında, omzu ve askı görünür; arkada okul dolapları. k14'te kişi sola döner
//      (gövde kayar, hafif yatar); çanta askıdan, kedi silüetli süs fermuar sürgüsünden sarkaç gibi sallanıp söner (iki
//      zincirli sarkaç, kurulumda bir kez hesaplanır). Süs sedef dokulu (lilaAcik + açık parıltı bandı, salınımla kayar); en
//      yüksek salınımda kısa bir yıldız parıltısı, ortasında küçük turuncu tik (tik). Kamera çekim boyunca süse iter.
// #4b.3 (k264–371) Yayıncı: genç yayıncı masada, kulaklıklı; önde tripodlu kamera. k26 kameranın ışığı yanar (tik), arkadaki
//      raftaki kalın 3B "PİKSEL" harflerinin ardındaki pastel ışık güçlenir; kameraya bakar, gülümser, el sallar, konuşur.
//      Harfler ve maskot (özgün, piksel gözlü küp yaratık) renkli; kişi, oda ve kamera mono. Platform arayüzü ya da işareti yok.
// #4b.4 (k372–491) Maske: ayna karşısında genç bir cosplayer (özgün kostüm: pelerin, geometrik etekli kapelet, altıgen toka).
//      Kıpçak esinli yüz maskesini iki eliyle kenarından tutup yüzüne kaldırır, k34'te oturur (tik), eller iner; k54–68
//      aynaya döner. Ayna önce sırtını, dönünce maskeli yüzünü (aynalı) gösterir; küçük bir baş sallar; döndükten sonra
//      kamera aynadaki maskeli yansımaya iter (maske kapanışta büyük). Maske özgün desen:
//      alın çıkıntısı, kaş ve burun kabartması, bıyık kabartması, zikzak bant, perçinler; açık limon, kabartmalar şeftali.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye İÇ kare zamanlı tween ekler (ARALIK [0, SON]); her çekim kendi katmanında, kamerayı
// kendi ilk karesinde koyar; konturlar kaynar (8 fps). Bütün hareket 60 fps ve ctx.herKare ile kare numarasından hesaplanır
// (geri sarmada da aynı kare): kollar anahtar pozlar arasında her karede ara değerle (kol.js her karede yeniden çizilir),
// gövde, çanta, süs, maske ve baş da her karede. Ayrık kalanlar: yüz ifadesi, bakış, kamera ışığının yanışı, maskotun göz
// kırpması ve çizgi kaynaması. Turuncu yalnız #4b.2'deki parıltının tikinde.
import { kisiSVG, MONO, PALET, BOY, GOZ_Y, YAPI, yol, rng, oval } from '../insan.js';
import { kolSVG, kolIK, omuzlar, govdeKes, bilekBul, elNoktasi } from '../kol.js';
import { URUN_RENK } from './cizimler.js';

export const ARALIK = [0, 491];
const [BAS, SON] = ARALIK;
// Çekim sınırları (iç kare): bahçıvan, çanta süsü, yayıncı, maske
const K1 = 0, K2 = 156, K3 = 264, K4 = 372;
const D2R = Math.PI / 180;
const M = PALET.murekkep;
const f1 = (v) => (+v).toFixed(1);
const lerp = (a, b, t) => a + (b - a) * t;
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const aciDer = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;
// Kanalları t kadar koyultur (ürün renginin gölgeli yüzleri için)
const koyult = (h, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
// Tonlar: dünya mono (toprak, ahşap, porselen); ürünlerimiz paletin açık tonlarıyla (kullanıcı 2026-10-22): fide kasası nane,
// altlığı adaçayı, filizler hafif yeşil. Kasanın gölgede kalan yüzleri aynı tonun koyusu.
const NANE = URUN_RENK.nane, ADACAYI = URUN_RENK.adacayi;
const TON = {
  toprak: '#5f5a53', kasaUst: NANE, kasaOn: koyult(NANE, 0.05), kasaSol: NANE, kasaSag: koyult(NANE, 0.14), kasaKatman: koyult(NANE, 0.24),
  altUst: koyult(ADACAYI, 0.04), altOn: koyult(ADACAYI, 0.1), altSol: koyult(ADACAYI, 0.07), altSag: koyult(ADACAYI, 0.18), yaprak: '#d8d2c7',
  filiz: '#c6e2a4',
  ahsap: '#cfc9bd', ahsapOn: '#a59e91', ahsapK: '#8d867a', cizgi: '#8d867a', beyaz: '#f4f1ea', koyu: '#46423d',
};

// El titremeli kalem (s4-frp ile aynı kurgu): her çağrı kendi sabit sapmasını, kareye göre kaynamasını alır
function kalem(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}
// Dizge çizimleri (kişi kutusunda): cz açık çizgi, sk dolgulu kapalı şekil (dolgu konturdan kayık)
function dizge(tohum, kaynama, genlik = 1) {
  const s = kalem(tohum, kaynama, genlik);
  const cz = (pts, w = 4.2, renk = M, op = 1) => `<path d="${yol(pts, false, s())}" fill="none" stroke="${renk}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
  const sk = (pts, dolgu, w = 4.2, kay = [3, 3]) => {
    const d = yol(pts, true, s());
    return `<path d="${d}" fill="${dolgu}" transform="translate(${kay[0]} ${kay[1]})"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  return { cz, sk };
}
// Düz kenarlı çokgen: kenarları eşit aralıklı noktalara böler (Catmull-Rom kenarı şişirmesin, köşe sıkı yuvarlansın)
function kenarla(pts, ad = 24, kapali = true) {
  const out = [], n = pts.length;
  for (let i = 0; i < (kapali ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / ad));
    for (let j = 0; j < m; j++) out.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]);
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}
// Yuvarlak köşeli dikdörtgen (köşe yayları 4 nokta, kenarlar bölünmüş)
function yDortgen(x0, y0, x1, y1, r, ad = 24) {
  const k = [];
  const yay = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * D2R; k.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  yay(x1 - r, y0 + r, -90); yay(x1 - r, y1 - r, 0); yay(x0 + r, y1 - r, 90); yay(x0 + r, y0 + r, 180);
  return kenarla(k, ad, true);
}
const dYol = (pts) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';
// a→b doğrusu boyunca w enli bant (dörtgen)
const bant = (a, b, w) => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = [-(b[1] - a[1]) / l * w / 2, (b[0] - a[0]) / l * w / 2];
  return [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]];
};
// Beşinci derece yumuşak adım (ivmesi de sürekli: sarkacı sarsıntısız sürer)
const sm5 = (x) => { const t = sinir(x, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
// Kalın harf iskeletleri (birim: harf boyu; y aşağı, 0 tepe, 1 taban). e: eğri (noktalar olduğu gibi), yoksa düz kenarlar
// sıklaştırılır. İ'nin noktası sıfır boylu çizgidir (yuvarlak uç daire olur).
const HARF = {
  P: { en: 0.54, c: [{ p: [[0, 1], [0, 0]] }, { e: 1, p: [[0, 0], [0.3, 0], [0.52, 0.1], [0.54, 0.28], [0.44, 0.46], [0.24, 0.52], [0, 0.52]] }] },
  'İ': { en: 0, c: [{ p: [[0, 0], [0, 1]] }, { p: [[0, -0.32], [0.001, -0.32]] }] },
  K: { en: 0.54, c: [{ p: [[0, 0], [0, 1]] }, { p: [[0.52, 0], [0.04, 0.54]] }, { p: [[0.2, 0.4], [0.56, 1]] }] },
  S: { en: 0.52, c: [{ e: 1, p: [[0.5, 0.12], [0.34, 0], [0.12, 0.02], [0.02, 0.18], [0.12, 0.4], [0.38, 0.54], [0.52, 0.74], [0.42, 0.96], [0.18, 1], [0, 0.88]] }] },
  E: { en: 0.48, c: [{ p: [[0.48, 0], [0, 0], [0, 1], [0.48, 1]] }, { p: [[0, 0.5], [0.38, 0.5]] }] },
  L: { en: 0.46, c: [{ p: [[0, 0], [0, 1], [0.46, 1]] }] },
};

// ---------- Küçük perspektif kamera (mm; Y yukarı, Z kameraya doğru, yuvarlanma yok): P(nokta) → ekran, m(nokta) → px/mm
function kamera3(goz, hedef, f, [sx, sy]) {
  const n3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const fw = n3([hedef[0] - goz[0], hedef[1] - goz[1], hedef[2] - goz[2]]);
  const sg = n3([-fw[2], 0, fw[0]]);
  const up = [sg[1] * fw[2] - sg[2] * fw[1], sg[2] * fw[0] - sg[0] * fw[2], sg[0] * fw[1] - sg[1] * fw[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rel = (p) => [p[0] - goz[0], p[1] - goz[1], p[2] - goz[2]];
  return {
    goz,
    P: (p) => { const d = rel(p), z = dot(d, fw); return [sx + f * dot(d, sg) / z, sy - f * dot(d, up) / z]; },
    m: (p) => f / dot(rel(p), fw),
  };
}
// Yerel (u, y, v) → dünya: (X, Z) merkezli, Y ekseni çevresinde aci derece dönük
function yerel(X, Z, aci) {
  const c = Math.cos(aci * D2R), s = Math.sin(aci * D2R);
  const f = (u, y, v) => [X + u * c - v * s, y, Z + u * s + v * c];
  f.yon = (nu, nv) => [nu * c - nv * s, 0, nu * s + nv * c];
  return f;
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, W, H, yer } = ctx;
  let tohumSayac = 4100;
  const T = () => tohumSayac++;
  const C = (ust, pts, o = {}) => cizgi(ust, pts, { tohum: T(), ...o });
  const es = (e) => (typeof e === 'function' ? e : gsap.parseEase(e));
  const EO = es(E.EO), KMf = es(E.KM), P2IO = es('power2.inOut');
  // f karesinin [k0, k1] içindeki ilerlemesi (0→1, eğri e)
  const ilerle = (f, k0, k1, e = (x) => x) => e(sinir((f - k0) / (k1 - k0), 0, 1));
  let kayIndis = 0; // çekirdeğin son kaynama indisi (herKare çizimleri aynı çizimle yeniden kurar)
  ctx.kaynayanlar.add((i) => { kayIndis = i; });

  ctx.vurus('4b.1', 'Bahçıvan: fide diker, alnını siler', K1, K2 - 1);
  ctx.vurus('4b.2', 'Çanta süsü: döner, kedi süs sallanır, parıldar', K2, K3 - 1);
  ctx.vurus('4b.3', 'Yayıncı: kamera ışığı yanar, el sallar (PİKSEL)', K3, K4 - 1);
  ctx.vurus('4b.4', 'Maske: takar, aynaya döner, baş sallar', K4, SON);

  // Her çekim kendi katmanında: k0'da açılır, k1 + 1'de kapanır. Görünürlük tl.set ile değil, her karede kare numarasından
  // kurulur: ARALIK 0'dan başladığı için alt çizelgenin tam 0. anındaki set ve call'lar GSAP'ta uygulanmıyor (çocuk zamanı
  // 0'a yuvarlanıyor), tam filmde ilk kare boş kalıyordu (?ic=1 testi 1e-4'ten başladığı için görünmüyordu).
  const katmanlar = [];
  const katmanAc = (ad, k0, k1) => {
    const L = ctx.katman(ad, 10);
    gsap.set(L.div, { autoAlpha: 0 });
    katmanlar.push({ L, k0, k1, acik: false });
    return L;
  };
  ctx.herKare((f) => {
    for (const K of katmanlar) {
      const ac = f >= K.k0 && f <= K.k1;
      if (ac !== K.acik) { K.acik = ac; gsap.set(K.L.div, { autoAlpha: ac ? 1 : 0 }); }
    }
  });
  // Kamera: çekimin ilk karesinde A'ya koyulur, k1'e dek B'ye gider. A, B: [dünya x, dünya y (ekran ortasına), ölçek].
  // Ölçek ≥ 1 kalır ve kayma (1 − 1/ölçek)·W/2'yi geçmez: dünya kadrajı hep doldurur.
  const kamera = (k0, k1, A, B, ease = 'none') => {
    const a = ctx.odak(A[0], A[1], A[2]), b = ctx.odak(B[0], B[1], B[2]);
    ctx.kameraKoy(k0, a);
    tl.fromTo(ctx.kamera, a, { ...b, duration: k(k1 + 1 - k0), ease, immediateRender: false }, k(k0));
  };
  tl.set(ctx.itme, { x: 0, y: 0 }, k(BAS));
  // Bir grubun dönüşümünü yaz (herKare): öteleme, dönme (derece), ölçek
  const donustur = (g, x, y, r = 0, s = 1) => g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(r)}) scale(${(+s).toFixed(4)})`);

  // =========================================================================== #4b.1 BAHÇIVAN (k0–155)
  ctx.isaret(K1, 'kesme');
  const L1 = katmanAc('s4b-bahce', K1, K2 - 1);
  // Yerleşim (mm, Y yukarı, Z kameraya). Yatay: bahçıvan solda, istif sağ önde. Dikey: bahçıvan ortada, istif sağ önde.
  const B1 = yer({
    goz: [0, 850, 1050], hedef: [0, 0, 0], f: 1500, merkez: [960, 700],
    masa: { x0: -1600, x1: 1600, z0: -280, z1: 300 }, dikmeler: [-1180, 1180],
    kisi: { X: -300, s: 1.0 }, tepsi: { X: -300, Z: -50, aci: 3 }, yigin: { X: 430, Z: 95, aci: -11 },
    paket: { X: 60, Z: 170, aci: -18 }, yigin2: { X: -720, Z: 40 }, kurek: { X: -760, Z: 210, aci: 30 },
    sera: { x0: -60, x1: 1980, ad: 236, y1: 560 }, kam: [[990, 548, 1.16], [1002, 536, 1.22]],
  }, {
    // dikey: kamera daha yüksek ve dik; istif kasanın önünde, sağda (tezgâhın derinliği kadrajın boyunu doldurur)
    goz: [0, 1200, 1050], hedef: [0, 0, 160], f: 1850, merkez: [540, 1260],
    masa: { x0: -1100, x1: 1100, z0: -260, z1: 520 }, dikmeler: [-500, 500],
    kisi: { X: -40, s: 1.12 }, tepsi: { X: -40, Z: -60, aci: 3 }, yigin: { X: 120, Z: 300, aci: -9 },
    paket: { X: -250, Z: 380, aci: 14 }, yigin2: { X: -430, Z: -20 }, kurek: { X: -420, Z: 250, aci: 34 },
    sera: { x0: -40, x1: 1120, ad: 214, y1: 900 }, kam: [[560, 1080, 1.12], [568, 1058, 1.17]],
  });
  const K3D = kamera3(B1.goz, B1.hedef, B1.f, B1.merkez);
  const P3 = (x, y, z) => K3D.P([x, y, z]);
  const gArka = el(L1.svg, 'g'), gGovde = el(L1.svg, 'g'), gMasa = el(L1.svg, 'g'), gTepsi = el(L1.svg, 'g');
  const gKol = el(L1.svg, 'g'), gYigin = el(L1.svg, 'g');

  // ---------- Arka plan: seranın açık gri kayıtları (pus), tepeden sarkan bir sarmaşık
  {
    const S = B1.sera, ac = { kalinlik: 5, renk: '#d6d0c5', genlik: 0.8 };
    for (let x = S.x0; x <= S.x1; x += S.ad) C(gArka, kenarla([[x, -40], [x + 4, S.y1]], 60, false), ac);
    for (const y of [S.y1 * 0.12, S.y1 * 0.5]) C(gArka, kenarla([[S.x0 - 40, y], [S.x1 + 40, y + 6]], 60, false), ac);
    for (let x = S.x0; x < S.x1; x += S.ad * 2) C(gArka, [[x + 10, S.y1 * 0.12 + 8], [x + S.ad - 10, S.y1 * 0.5 - 8]], { ...ac, kalinlik: 3 });
    // sarmaşık: sol üstten sarkan dal, yapraklar açık gri
    const dal = [[S.x0 + S.ad * 0.4, -30], [S.x0 + S.ad * 0.55, S.y1 * 0.15], [S.x0 + S.ad * 0.42, S.y1 * 0.3], [S.x0 + S.ad * 0.6, S.y1 * 0.42]];
    C(gArka, dal, { kalinlik: 3, renk: '#bdb6a9' });
    dal.slice(1).forEach(([x, y], i) => {
      for (const yon of [-1, 1]) {
        const uc = [x + yon * 34, y + 18], o = [x + yon * 17, y + 9];
        C(gArka, [[x, y], [o[0] - 6, o[1] + 10 * yon], uc, [o[0] + 6, o[1] - 10 * yon]], { kapali: true, dolgu: '#e2ddd3', kalinlik: 2.6, renk: '#bdb6a9', kay: [0, 0] });
      }
      void i;
    });
  }

  // ---------- Tezgâh: ayaklar, ön kalınlık, üst yüz (tahtalar), dökülmüş toprak kırıntıları
  {
    const { x0, x1, z0, z1 } = B1.masa;
    // ayaklar kısa tutulur: dik bakışta uzun dikmeler kadrajın altında yana açılıyor
    for (const x of B1.dikmeler) C(gMasa, kenarla([P3(x - 34, -40, z1 - 40), P3(x + 34, -40, z1 - 40), P3(x + 34, -520, z1 - 40), P3(x - 34, -520, z1 - 40)], 40), { kapali: true, dolgu: TON.ahsapK, kalinlik: 4.4 });
    C(gMasa, kenarla([P3(x0, 0, z1), P3(x1, 0, z1), P3(x1, -44, z1), P3(x0, -44, z1)], 40), { kapali: true, dolgu: TON.ahsapOn, kalinlik: 4.4 });
    C(gMasa, kenarla([P3(x0, 0, z0), P3(x1, 0, z0), P3(x1, 0, z1), P3(x0, 0, z1)], 40), { kapali: true, dolgu: TON.ahsap, kalinlik: 4.4 });
    const nz = 4;
    for (let i = 1; i < nz; i++) { const z = lerp(z0, z1, i / nz); C(gMasa, kenarla([P3(x0, 0, z), P3(x1, 0, z)], 50, false), { kalinlik: 2.4, renk: TON.ahsapK, genlik: 0.6 }); }
    const r = rng(77);
    let d = '';
    for (let i = 0; i < 26; i++) {
      const p = P3(B1.tepsi.X + (r() - 0.5) * 620, 0, B1.tepsi.Z + 150 + r() * 120), rr = 1.6 + r() * 2.6;
      d += `M${f1(p[0] - rr)} ${f1(p[1])}a${f1(rr)} ${f1(rr * 0.7)} 0 1 0 ${f1(rr * 2)} 0a${f1(rr)} ${f1(rr * 0.7)} 0 1 0 ${f1(-rr * 2)} 0Z`;
    }
    el(gMasa, 'path', { d, fill: TON.toprak, opacity: 0.85 });
  }

  // ---------- Fide kasası (baskı ürünü): altlık + 8×8 gözlü kasa; kat kadar üst üste. Çizim sırası her katta: altlığın üst
  // yüzü → kasanın yan yüzleri (katman çizgili) ve üstü → altlığın yan yüzleri (kasanın dibini örten dudak).
  const HUC = 30, IC = 240, DIS = 250, ALT = 270, ALT_H = 14, ADIM = 52;
  function kutu3(ust, Lw, { a, b, y0, y1, renk, yanlar = true, ustYuz = true, katman = 0, kalinlik = 3.6 }) {
    const Q = (u, y, v) => K3D.P(Lw(u, y, v));
    const gor = (nu, nv, u, y, v) => { const n = Lw.yon(nu, nv), c = Lw(u, y, v), g = K3D.goz; return n[0] * (g[0] - c[0]) + n[2] * (g[2] - c[2]) > 0; };
    const ad = 22;
    if (yanlar) {
      const yuzler = [
        { p: [[-a, b], [a, b]], n: [0, 1], renk: renk.on },
        { p: [[-a, -b], [-a, b]], n: [-1, 0], renk: renk.sol },
        { p: [[a, b], [a, -b]], n: [1, 0], renk: renk.sag },
      ];
      for (const yz of yuzler) {
        const [[u0, v0], [u1, v1]] = yz.p;
        if (!gor(yz.n[0], yz.n[1], (u0 + u1) / 2, (y0 + y1) / 2, (v0 + v1) / 2)) continue;
        C(ust, kenarla([Q(u0, y1, v0), Q(u1, y1, v1), Q(u1, y0, v1), Q(u0, y0, v0)], ad), { kapali: true, dolgu: yz.renk, kalinlik, kay: [1.5, 1.5] });
        // baskı katman çizgileri (dış duvar boyunca yatay, ince ve açık: sayfa gibi okunmasın)
        for (let i = 1; i <= katman; i++) {
          const y = lerp(y0, y1, i / (katman + 1));
          C(ust, kenarla([Q(u0, y, v0), Q(u1, y, v1)], 30, false), { kalinlik: 1.1, renk: TON.kasaKatman, genlik: 0.35 });
        }
      }
    }
    if (ustYuz) C(ust, kenarla([Q(-a, y1, -b), Q(a, y1, -b), Q(a, y1, b), Q(-a, y1, b)], ad), { kapali: true, dolgu: renk.ust, kalinlik, kay: [1.5, 1.5] });
  }
  // Filiz: gövde + iki çenek yaprağı (tohumlu boy ve eğim); taban dünya noktası, ölçek o noktadaki px/mm
  function filiz(ust, w3, tohum, olc = 1) {
    const r = rng(tohum * 13 + 5), b = K3D.P(w3), mm = K3D.m(w3);
    const h = (13 + r() * 6) * mm * olc, eg = (r() - 0.5) * 0.5;
    const tp = [b[0] + h * eg * 0.4, b[1] - h];
    C(ust, [b, [b[0] + h * eg * 0.12, b[1] - h * 0.5], tp], { kalinlik: Math.max(1.6, 2.1 * mm), genlik: 0.4 });
    for (const yon of [-1, 1]) {
      const a = (-90 + yon * (50 + r() * 20)) * D2R, L = (8 + r() * 2.5) * mm * olc;
      const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], o = [tp[0] + d[0] * L * 0.5, tp[1] + d[1] * L * 0.5];
      C(ust, [tp, [o[0] + n[0] * L * 0.3, o[1] + n[1] * L * 0.3], [tp[0] + d[0] * L, tp[1] + d[1] * L], [o[0] - n[0] * L * 0.3, o[1] - n[1] * L * 0.3]],
        { kapali: true, dolgu: TON.filiz, kalinlik: Math.max(1.3, 1.7 * mm), genlik: 0.35, kay: [1, 1] });
    }
  }
  const RENK_KASA = { on: TON.kasaOn, sol: TON.kasaSol, sag: TON.kasaSag, ust: TON.kasaUst };
  const RENK_ALT = { on: TON.altOn, sol: TON.altSol, sag: TON.altSag, ust: TON.altUst };
  function kasaKur(ust, { X, Z, aci, kat = 1, dolu = () => false, tohum = 0 }) {
    const Lw = yerel(X, Z, aci), Q = (u, y, v) => K3D.P(Lw(u, y, v));
    const g = el(ust, 'g');
    const gl = ALT / 2;
    el(g, 'path', { d: dYol([[-gl, -gl], [gl, -gl], [gl, gl], [-gl, gl]].map(([u, v]) => Q(u + 24, 0, v + 30))), fill: '#000', opacity: 0.08 });
    const UST = kat * ADIM;
    for (let i = 0; i < kat; i++) {
      const y0 = i * ADIM;
      kutu3(g, Lw, { a: ALT / 2, b: ALT / 2, y0, y1: y0 + ALT_H, renk: RENK_ALT, yanlar: false });
      kutu3(g, Lw, { a: DIS / 2, b: DIS / 2, y0: y0 + 3, y1: y0 + ADIM, renk: RENK_KASA, katman: 3, ustYuz: i === kat - 1 });
      kutu3(g, Lw, { a: ALT / 2, b: ALT / 2, y0, y1: y0 + ALT_H, renk: RENK_ALT, ustYuz: false });
    }
    // gözler: toprak (kenarlar arası boşluk kasanın duvarı olarak okunur)
    const d = 3.4;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const u0 = -IC / 2 + c * HUC + d, u1 = u0 + HUC - 2 * d, v0 = -IC / 2 + r * HUC + d, v1 = v0 + HUC - 2 * d;
      C(g, kenarla([Q(u0, UST, v0), Q(u1, UST, v0), Q(u1, UST, v1), Q(u0, UST, v1)], 12), { kapali: true, dolgu: TON.toprak, kalinlik: 1.5, genlik: 0.4, kay: [0, 0] });
    }
    // filizler arkadan öne (öndeki sıra arkadakinin üstüne biner)
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (dolu(c, r)) filiz(g, Lw(-IC / 2 + (c + 0.5) * HUC, UST - 1, -IC / 2 + (r + 0.5) * HUC), tohum + r * 8 + c);
    const hucre = (c, r, dy = 0) => Q(-IC / 2 + (c + 0.5) * HUC, UST + dy, -IC / 2 + (r + 0.5) * HUC);
    return { g, Q, Lw, UST, hucre };
  }

  // Çalışılan kasa (bahçıvanın önünde): uzak dört sıra ve beşinci sıranın sağdaki iki gözü dikilmiş; (5, 4) dikilmek üzere
  const FC = 5, FR = 4;
  const TEP = kasaKur(gTepsi, { ...B1.tepsi, kat: 1, dolu: (c, r) => r < FR || (r === FR && c > FC), tohum: 300 });
  const fideG = el(gTepsi, 'g');
  filiz(fideG, TEP.Lw(-IC / 2 + (FC + 0.5) * HUC, TEP.UST - 1, -IC / 2 + (FR + 0.5) * HUC), 990);
  // Dikilen fidenin dibinde bastırılmış toprak
  {
    const p = TEP.hucre(FC, FR), mm = K3D.m(TEP.Lw(0, TEP.UST, 0));
    C(fideG, oval(p[0], p[1] + 1, 11 * mm, 4 * mm, 0, 360, 10, 2), { kapali: true, dolgu: '#4f4b45', kalinlik: 1.4, genlik: 0.3, kay: [0, 0] });
    fideG.insertBefore(fideG.lastChild, fideG.firstChild);
  }
  // Tohum paketi (tezgâhta yatık kâğıt; üstünde filiz çizimi), yedek toprak yığını, küçük kürek
  {
    const Lp = yerel(B1.paket.X, B1.paket.Z, B1.paket.aci), Q = (u, v) => K3D.P(Lp(u, 0.5, v));
    el(gTepsi, 'path', { d: dYol([Q(-42, -66), Q(52, -66), Q(52, 76), Q(-42, 76)]), fill: '#000', opacity: 0.07 });
    C(gTepsi, kenarla([Q(-48, -72), Q(48, -72), Q(48, 72), Q(-48, 72)], 16), { kapali: true, dolgu: TON.beyaz, kalinlik: 3.4, kay: [1.5, 1.5] });
    C(gTepsi, kenarla([Q(-48, -50), Q(48, -50)], 16, false), { kalinlik: 2, renk: TON.cizgi });
    C(gTepsi, [Q(0, 34), Q(-3, 8), Q(0, -16)], { kalinlik: 2.6 });
    for (const yon of [-1, 1]) C(gTepsi, [Q(0, -14), Q(yon * 14, -26), Q(yon * 26, -18), Q(yon * 12, -10)], { kapali: true, dolgu: TON.yaprak, kalinlik: 2.2, kay: [1, 1] });
    for (const [a, b] of [[-30, 50], [-30, 60]]) C(gTepsi, [Q(a, b), Q(a + (b === 50 ? 58 : 40), b)], { kalinlik: 2, renk: TON.cizgi });
    // yedek toprak yığını
    const Y = B1.yigin2, b0 = P3(Y.X, 0, Y.Z), mm = K3D.m([Y.X, 0, Y.Z]);
    const yg = [...oval(b0[0], b0[1], 150 * mm, 42 * mm, 0, 180, 10, 2)];
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = lerp(b0[0] - 150 * mm, b0[0] + 150 * mm, 1 - t); yg.push([x, b0[1] - 66 * mm * Math.sin(t * Math.PI) ** 0.8 - (i % 2) * 6 * mm]); }
    el(gTepsi, 'ellipse', { cx: f1(b0[0] + 26 * mm), cy: f1(b0[1] + 10 * mm), rx: f1(160 * mm), ry: f1(40 * mm), fill: '#000', opacity: 0.07 });
    C(gTepsi, yg, { kapali: true, dolgu: TON.toprak, kalinlik: 4 });
    for (const [dx, dy] of [[-60, -30], [10, -50], [70, -20]]) C(gTepsi, [[b0[0] + dx * mm, b0[1] + dy * mm], [b0[0] + (dx + 22) * mm, b0[1] + (dy - 6) * mm]], { kalinlik: 2, renk: '#8d867a' });
    // kürek: sap + uç (tezgâhta yatık)
    const Lk = yerel(B1.kurek.X, B1.kurek.Z, B1.kurek.aci), R = (u, v, y = 6) => K3D.P(Lk(u, y, v));
    C(gTepsi, kenarla([R(-150, -13), R(-40, -11), R(-40, 11), R(-150, 13)], 14), { kapali: true, dolgu: '#8d867a', kalinlik: 3.6 });
    C(gTepsi, [R(-40, 0), R(-20, 0)], { kalinlik: 5 });
    C(gTepsi, [R(-20, -30), R(40, -34), R(110, 0), R(40, 34), R(-20, 30)], { kapali: true, dolgu: '#bdb6a9', kalinlik: 3.6, kay: [1.5, 1.5] });
    C(gTepsi, [R(-14, 0), R(80, 0)], { kalinlik: 1.8, renk: TON.cizgi });
  }

  // İstif: üç kat altlıklı kasa; en üsttekinin her gözünde bir filiz
  kasaKur(gYigin, { ...B1.yigin, kat: 3, dolu: () => true, tohum: 500 });

  // ---------- Bahçıvan (insan.js + kol.js): gövde tezgâhın arkasında, kollar kasanın üstünde. Şapka, önlük, toprak izi
  // ve parmak uçlarındaki toprak bu modülde çizilir (kişinin kutu biriminde).
  const pB = ctx.rastgeleKisi(377, {
    kadin: true, yas: 'genc', sacStil: 'orgu', sac: 2, ten: 2, boy: 'orta', yapi: 'orta', yanak: 0.45, cil: true,
    yaka: 'v', giysi: 6, gozluk: null, sakal: null, kupe: false,
  });
  const EB = 108, KAL = 58, KESIT = 460;
  const [kx, kY] = P3(B1.kisi.X, 0, B1.masa.z0);
  const BH = (() => {
    const p = pB, s = B1.kisi.s, x0 = kx - BOY.en * s / 2, y0 = kY - KESIT * s + ctx.boyKaymasi(p) * s;
    const yap = (g) => el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * s, height: BOY.boy * s, x: x0, y: y0, overflow: 'visible' });
    const gB = el(gGovde, 'g'), gK = el(gKol, 'g');
    const sB = yap(gB), sK = yap(gK);
    const o = omuzlar(p, { kalinlik: KAL });
    const cx = 200, cy = GOZ_Y + 4, hw = p.yuzEn, hh = p.yuzBoy, tepe = cy - 6 - hh, gY = cy + hh;
    const h = { p, s, o, ifade: 'notr', bakis: [0, 0], sol: 'bas', sag: 'fideTut', leke: false, dy: 0, kutu: ([X, Y]) => [(X - x0) / s, (Y - y0) / s] };
    // Hasır şapka: geniş kenar (yanlara doğru hafif sarkık), taç, koyu bant, tepede kıvrım, hasır izleri
    const sapka = (kay) => {
      const { cz, sk } = dizge(p.tohum + 301, kay, 0.8);
      const by = cy - hh * 0.8, brx = hw + 88, bry = 20;
      const kenar = [];
      for (let a = 0; a < 360; a += 15) { const t = a * D2R, c = Math.cos(t); kenar.push([cx + brx * c, by + bry * Math.sin(t) + 12 * c * c]); }
      let str = sk(kenar, '#d8d2c7', 4.2);
      for (const a of [18, 42, 138, 162, 66, 114]) {
        const t = a * D2R, c = Math.cos(t), sn = Math.sin(t), q = (r) => [cx + brx * r * c, by + bry * r * sn + 12 * c * c * r];
        str += cz([q(0.74), q(0.92)], 2, M, 0.45);
      }
      const tac = [[cx - hw * 0.98, by], [cx - hw * 1.02, by - 26], [cx - hw * 0.86, tepe - 6], [cx - hw * 0.48, tepe - 28], [cx, tepe - 34], [cx + hw * 0.48, tepe - 28],
        [cx + hw * 0.86, tepe - 6], [cx + hw * 1.02, by - 26], [cx + hw * 0.98, by], [cx + hw * 0.6, by + bry * 0.5], [cx, by + bry * 0.62], [cx - hw * 0.6, by + bry * 0.5]];
      str += sk(tac, '#e2ddd3', 4.2);
      const bant = [[cx - hw * 1.01, by - 17], [cx - hw * 0.6, by - 17 + bry * 0.5], [cx, by - 17 + bry * 0.62], [cx + hw * 0.6, by - 17 + bry * 0.5], [cx + hw * 1.01, by - 17],
        [cx + hw * 0.98, by], [cx + hw * 0.6, by + bry * 0.5], [cx, by + bry * 0.62], [cx - hw * 0.6, by + bry * 0.5], [cx - hw * 0.98, by]];
      str += sk(bant, '#6f695f', 3.6, [2, 2]);
      str += cz([[cx - 16, tepe - 31], [cx, tepe - 23], [cx + 16, tepe - 31]], 2.6);
      for (const [u, v] of [[-0.55, 0.42], [-0.18, 0.25], [0.28, 0.3], [0.62, 0.5]]) str += cz([[cx + hw * u, tepe - 18 + v * 50], [cx + hw * (u + 0.13), tepe - 26 + v * 50]], 2, M, 0.4);
      return str;
    };
    // Önlük: göğüs parçası (cepli) ve boyun askıları; gövde kesiminin içinde
    const onluk = (kay) => {
      const { cz, sk } = dizge(p.tohum + 311, kay);
      let str = '';
      for (const yon of [-1, 1]) str += sk([[cx + yon * 56, gY + 100], [cx + yon * 44, gY + 98], [cx + yon * hw * 0.36, gY + 16], [cx + yon * hw * 0.5, gY + 18]], '#a59e91', 3.4, [2, 2]);
      str += sk(kenarla([[cx - 62, gY + 96], [cx + 62, gY + 96], [cx + 68, 900], [cx - 68, 900]], 40), '#a59e91', 4.2);
      str += cz(kenarla([[cx - 34, gY + 134], [cx + 34, gY + 134]], 20, false), 3);
      str += cz([[cx - 52, gY + 112], [cx + 50, gY + 112]], 1.8, '#5f5a53', 0.5);
      return str;
    };
    // Alında toprak izi (elin tersiyle silişten sonra)
    const leke = (kay) => dizge(p.tohum + 321, kay).cz([[cx - 26, cy - hh * 0.6], [cx - 4, cy - hh * 0.64], [cx + 22, cy - hh * 0.6]], 6, '#79756e', 0.6);
    // Parmak uçlarını örten toprak yığını ve kirli parmak uçları
    // P: parmakların ortası (avuç ile uç arası); yığın parmak uçlarını örter, kenarında kırıntılar
    // o: yığının boyu (0..1): el topraktan kalkarken küçülür, basarken büyür (parmak uçları toprağa girip çıkar)
    const yigin = (P, kay, tohum, o = 1) => {
      const { cz, sk } = dizge(tohum, kay, 0.6);
      const rx = EB * 0.24 * o, ry = EB * 0.085 * o, pts = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, ust = Math.sin(a) < 0, r = 1 + (ust ? 0.14 * Math.sin(a * 5) : 0);
        pts.push([P[0] + rx * r * Math.cos(a), P[1] + ry * r * Math.sin(a) * (ust ? 1.6 : 0.7)]);
      }
      let str = sk(pts, TON.toprak, 2.8 * Math.min(1, o + 0.3), [1.5, 1.5]);
      str += cz([[P[0] - rx * 0.45, P[1] - ry * 0.6], [P[0] - rx * 0.1, P[1] - ry * 0.9]], 1.8, '#8d867a');
      for (const [dx, dy, rr] of [[-rx * 1.25, ry * 0.4, 2.6], [rx * 1.3, ry * 0.1, 2.2], [rx * 0.4, ry * 1.6, 2]]) str += `<circle cx="${f1(P[0] + dx)}" cy="${f1(P[1] + dy)}" r="${f1(rr * o)}" fill="${TON.toprak}"/>`;
      return str;
    };
    const kirli = (P, a) => {
      const t = [Math.cos(a * D2R), Math.sin(a * D2R)], n = [-t[1], t[0]];
      return [[-6, -14], [-2, 0], [-7, 13]].map(([u, v], i) => `<ellipse cx="${f1(P[0] + t[0] * u + n[0] * v)}" cy="${f1(P[1] + t[1] * u + n[1] * v)}" rx="${7 - i}" ry="4.5" transform="rotate(${f1(a)} ${f1(P[0] + t[0] * u + n[0] * v)} ${f1(P[1] + t[1] * u + n[1] * v)})" fill="${TON.toprak}" opacity="0.75"/>`).join('');
    };
    // Fide (elde, kutu biriminde): toprak topağı tutma noktasında, gövde ve yapraklar elin yanından sola yukarı
    const fideElde = (P, kay) => {
      const { cz, sk } = dizge(991, kay, 0.6);
      let str = sk([[P[0] - 9, P[1] - 4], [P[0] + 9, P[1] - 4], [P[0] + 7, P[1] + 14], [P[0] - 7, P[1] + 14]], TON.toprak, 2.8, [1.5, 1.5]);
      const tp = [P[0] - 22, P[1] - 30];
      str += cz([[P[0] - 2, P[1] - 4], [P[0] - 12, P[1] - 18], tp], 3);
      for (const [dx, dy] of [[-22, -6], [6, -20]]) str += sk([tp, [tp[0] + dx * 0.5 - 4, tp[1] + dy * 0.5 - 4], [tp[0] + dx, tp[1] + dy], [tp[0] + dx * 0.5 + 4, tp[1] + dy * 0.5 + 4]], TON.filiz, 2.6, [1, 1]);
      return str;
    };
    // Kol pozları (kutu birimi). yon −1: ekranın solu, +1: sağı. Kasadaki hedefler ekrandan kutuya çevrilir.
    const S = (yon) => o[yon < 0 ? 'sol' : 'sag'];
    const elKasada = (yon, hedefE, { el: elAd = 'dayanma', ad = 'avuc', kisalma = 0.74, elAci = null, dis = 30, kalk = 0 } = {}) => {
      const sh = S(yon), hedef = h.kutu(hedefE);
      hedef[1] -= kalk;
      const dirsek = [lerp(sh[0], hedef[0], 0.42) + yon * dis, lerp(sh[1], hedef[1], 0.58)];
      const a = elAci ?? aciDer(dirsek, hedef), basparmak = -yon;
      const bilek = bilekBul({ el: elAd, hedef, elAci: a, elBoy: EB, basparmak, kisalma, ad });
      return { dirsek, bilek, el: elAd, elAci: a, basparmak, kisalma };
    };
    const yuz = (dx, dy) => [cx + dx, cy + dy];
    // Kasadaki eller: sol el sol gözlerde toprağı bastırır, sağ el (5, 4) gözüne fide diker (kollar gövdenin önünden çaprazlamaz)
    const POZ = {
      bas: (yon) => ({ ...elKasada(yon, TEP.hucre(1, 4)), toprak: true }),
      bas1: (yon) => ({ ...elKasada(yon, TEP.hucre(2, 5, -2)), toprak: true }),
      fideTut: (yon) => ({ ...elKasada(yon, TEP.hucre(FC, FR), { el: 'tutma', ad: 'tut', kisalma: 1, elAci: 96, kalk: 46 }), fide: true }),
      fideIn: (yon) => ({ ...elKasada(yon, TEP.hucre(FC, FR), { el: 'tutma', ad: 'tut', kisalma: 1, elAci: 92, kalk: 8 }), fide: true, toprak: true }),
      bas2: (yon) => ({ ...elKasada(yon, TEP.hucre(FC, FR + 1, -2)), toprak: true }),
      bas3: (yon) => ({ ...elKasada(yon, TEP.hucre(FC + 1, FR + 1, -2)), toprak: true }),
      // elin tersiyle alın silme: el sırtı izleyiciye, parmaklar alın boyunca öbür şakağa; bilek sağ şakaktan sola kayar
      kalk: (yon) => { const sh = S(yon); return { dirsek: [sh[0] + 62, sh[1] + 96], bilek: [sh[0] + 14, sh[1] - 52], el: 'acik', yuz: 'sirt', elAci: -104, kirli: true }; },
      // dirsek omuzdan biraz yüksek (çok kalkık üst kolda kol.js omuz kapağı kanat gibi açılıyor)
      alin0: () => ({ dirsek: [cx + 190, cy + 98], bilek: yuz(hw + 22, -34), el: 'acik', yuz: 'sirt', elAci: 190, kirli: true }),
      alin1: () => ({ dirsek: [cx + 166, cy + 96], bilek: yuz(hw * 0.56, -38), el: 'acik', yuz: 'sirt', elAci: 187, kirli: true }),
      alin2: () => ({ dirsek: [cx + 146, cy + 96], bilek: yuz(6, -39), el: 'acik', yuz: 'sirt', elAci: 184, kirli: true }),
      alin3: () => ({ dirsek: [cx + 126, cy + 98], bilek: yuz(-hw * 0.42, -37), el: 'acik', yuz: 'sirt', elAci: 181, kirli: true }),
      kalk2: (yon) => { const sh = S(yon); return { dirsek: [sh[0] + 56, sh[1] + 92], bilek: [sh[0] - 4, sh[1] - 44], el: 'acik', yuz: 'sirt', elAci: -70, kirli: true }; },
      kenar: (yon) => ({ ...elKasada(yon, TEP.Q(DIS / 2 - 4, TEP.UST, 30), { kisalma: 0.8 }), kirli: true }),
    };
    // Pozun tam tanımı: kolSVG'nin varsayılanları (yüz, başparmak yönü, kısalma) açıkça yazılır (ara değer için)
    const onbellek = new Map();
    h.tamPoz = (ad, yon) => {
      const anahtar = ad + yon;
      if (!onbellek.has(anahtar)) {
        const P = POZ[ad](yon), taraf = yon < 0 ? 'sol' : 'sag', yz = P.yuz || 'sirt';
        onbellek.set(anahtar, {
          dirsek: P.dirsek, bilek: P.bilek, el: P.el, elAci: P.elAci, yuz: yz,
          basparmak: P.basparmak ?? ((taraf === 'sag' ? 1 : -1) * (yz === 'avuc' ? 1 : -1)),
          kisalma: P.kisalma ?? (P.el === 'dayanma' ? 0.62 : 1), toprak: !!P.toprak, fide: !!P.fide, kirli: !!P.kirli,
        });
      }
      return onbellek.get(anahtar);
    };
    // Kare çizimi (her karede, ctx.herKare): D = { sol, sag: { P (kolSVG pozu), toprak (yığın boyu 0..1), kirli, fide },
    // dy, ifade, bakis, leke }. Gövde yalnız kaynama, ifade, bakış ya da leke değişince yeniden kurulur; kollar her karede.
    let son = 0, govdeAnahtar = '', kolAnahtar = '';
    ctx.kaynayanlar.add((i) => { son = Math.max(0, i); });
    h.ciz = (D) => {
      const gA = `${son}|${D.ifade}|${D.bakis}|${D.leke}`;
      if (gA !== govdeAnahtar) {
        govdeAnahtar = gA;
        const G = govdeKes(p, { id: 's4b-bahcivan', kaynama: son, tohum: p.tohum });
        sB.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: son, ifade: D.ifade, bakis: D.bakis, mono: true })}${onluk(son)}</g>${G.kontur}${D.leke ? leke(son) : ''}${sapka(son)}`;
      }
      const kA = `${son}|` + ['sol', 'sag'].map((t) => { const S = D[t], P = S.P; return [P.dirsek, P.bilek, P.elAci, P.kisalma].flat().map(f1).join(',') + P.el + S.toprak.toFixed(2) + S.kirli + S.fide; }).join('|');
      if (kA !== kolAnahtar) {
        kolAnahtar = kA;
        const ortak = { giysi: MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik: KAL, kaynama: son, kolBoyu: 'sivali' };
        let kol = '', ek = '';
        for (const yon of [-1, 1]) {
          const taraf = yon < 0 ? 'sol' : 'sag', S = D[taraf], P = S.P;
          const nokta = (ad) => elNoktasi({ el: P.el, bilek: P.bilek, elAci: P.elAci, elBoy: EB, basparmak: P.basparmak, kisalma: P.kisalma, ad });
          const tut = S.fide ? nokta('tut') : null;
          kol += kolSVG({ ...ortak, omuz: o[taraf], taraf, tohum: 61 + (yon < 0 ? 0 : 1), elBoy: EB, ...P, araya: tut ? fideElde(tut, son) : '' });
          const uc = nokta('uc'), avuc = nokta('avuc');
          if (S.toprak > 0.04) ek += yigin([lerp(avuc[0], uc[0], 0.8), lerp(avuc[1], uc[1], 0.8)], son, 70 + yon, S.toprak);
          if (S.kirli) ek += kirli(uc, P.elAci);
        }
        sK.innerHTML = kol + ek;
      }
      const tr = `translate(0 ${(+D.dy).toFixed(2)})`;
      gB.setAttribute('transform', tr); gK.setAttribute('transform', tr);
    };
    return h;
  })();

  // ---------- Zaman (60 fps): fideyi göze indirir (k0–10), k20'de bırakır, iki eliyle sırayla toprağı bastırır; k55 başını
  // kaldırır, k60 gülümser; k62'den elini kaldırır, k75'te alnına değer, elinin tersiyle alnını siler (k85'ten sonra alında
  // toprak izi); el kasanın kenarına iner. Her kare kare numarasının saf işlevi (geri sarmada da aynı kare).
  // Kol izi: [kare, poz, kalk]. Arka arkaya aynı poz = bekleme (o aralıkta el durur, teğet 0); öbür anahtarlarda
  // Catmull-Rom teğeti: silme hareketi (kalk → alin0…alin3 → kalk2) tek, hızı sürekli bir akış. kalk: aralıkta bileğin
  // yay gibi kalkması (kutu birimi): toprağa basan el gözden göze kalkıp iner. El biçimi (dayanma, açık, tutma) aralığın
  // ortasında değişir; toprak yığını el kalkarken küçülür, basarken büyür (arada parmak uçları kirli); elde fide yalnız iki
  // uçta da fide varsa (fide k20'de toprağa geçer: el o anda kalkar).
  const sm = (x) => { const t = sinir(x, 0, 1); return t * t * (3 - 2 * t); };
  function izKur(yon, liste) {
    const A = liste.map(([kare, ad, kalk = 0]) => ({ kare: K1 + kare, ad, kalk, P: BH.tamPoz(ad, yon) }));
    let once = null;
    for (const a of A) { // el açısı bir öncekine en yakın tura (açı sarımı: el kısa yoldan döner)
      let x = a.P.elAci;
      if (once != null) x += 360 * Math.round((once - x) / 360);
      a.v = [a.P.dirsek[0], a.P.dirsek[1], a.P.bilek[0], a.P.bilek[1], x, a.P.kisalma];
      once = x;
    }
    const n = A.length, ayni = (i, j) => i >= 0 && j < n && A[i].ad === A[j].ad;
    A.forEach((a, i) => {
      a.m = i === 0 || i === n - 1 || ayni(i - 1, i) || ayni(i, i + 1) ? a.v.map(() => 0)
        : a.v.map((_, q) => (A[i + 1].v[q] - A[i - 1].v[q]) / (A[i + 1].kare - A[i - 1].kare));
    });
    const durus = (a) => ({ P: a.P, toprak: a.P.toprak ? 1 : 0, kirli: a.P.kirli && !a.P.toprak, fide: a.P.fide });
    return (f) => {
      if (f <= A[0].kare) return durus(A[0]);
      if (f >= A[n - 1].kare) return durus(A[n - 1]);
      let i = 0;
      while (f >= A[i + 1].kare) i++;
      const a = A[i], b = A[i + 1];
      if (a.ad === b.ad) return durus(a);
      const dt = b.kare - a.kare, s = (f - a.kare) / dt, s2 = s * s, s3 = s2 * s;
      const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
      const v = a.v.map((x, q) => h00 * x + h10 * dt * a.m[q] + h01 * b.v[q] + h11 * dt * b.m[q]);
      const yay = b.kalk * Math.sin(Math.PI * s);
      const Q = s < 0.5 ? a.P : b.P;
      const P = { dirsek: [v[0], v[1] - yay * 0.5], bilek: [v[2], v[3] - yay], elAci: v[4], kisalma: v[5], el: Q.el, yuz: Q.yuz, basparmak: Q.basparmak };
      const toprak = (a.P.toprak ? 1 - sm(s / 0.35) : 0) + (b.P.toprak ? sm((s - 0.65) / 0.35) : 0);
      const kirli = toprak < 0.5 && (a.P.kirli || b.P.kirli || a.P.toprak || b.P.toprak);
      return { P, toprak, kirli, fide: a.P.fide && b.P.fide };
    };
  }
  // Sol el: sol gözlerde toprağı bastırır (sağ elle dönüşümlü); sağ el: fideyi indirir, bırakır, bastırır, alnını siler
  const izSol = izKur(-1, [[0, 'bas'], [21, 'bas'], [28, 'bas1', 16], [31, 'bas1'], [38, 'bas', 16], [41, 'bas'], [48, 'bas1', 16]]);
  const izSag = izKur(1, [[0, 'fideTut'], [10, 'fideIn'], [19, 'fideIn'], [26, 'bas2', 22], [27, 'bas2'], [34, 'bas3', 16], [37, 'bas3'],
    [44, 'bas2', 16], [47, 'bas2'], [54, 'bas3', 16], [62, 'bas3'], [70, 'kalk'], [75, 'alin0'], [80, 'alin1'], [85, 'alin2'], [90, 'alin3'],
    [95, 'kalk2'], [103, 'kenar']]);
  // Gövde inişi-kalkışı (kutu birimi): bastırırken hafifçe çöker, başını kaldırınca doğrulur; Catmull-Rom (hız sürekli)
  const DY = [[0, 0], [10, 2], [20, 4], [25, 2], [30, 4], [35, 2], [40, 4], [45, 2], [50, 3], [55, 0], [60, -3], [100, -2], [125, -4], [140, -2], [155, -2]];
  const dyIz = (f) => {
    const x = f - K1, n = DY.length;
    if (x <= DY[0][0]) return DY[0][1];
    if (x >= DY[n - 1][0]) return DY[n - 1][1];
    let i = 0;
    while (x >= DY[i + 1][0]) i++;
    const m = (j) => (j <= 0 || j >= n - 1 ? 0 : (DY[j + 1][1] - DY[j - 1][1]) / (DY[j + 1][0] - DY[j - 1][0]));
    const [t0, y0] = DY[i], [t1, y1] = DY[i + 1], dt = t1 - t0, s = (x - t0) / dt, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * y0 + (s3 - 2 * s2 + s) * dt * m(i) + (-2 * s3 + 3 * s2) * y1 + (s3 - s2) * dt * m(i + 1);
  };
  // Yüz (ayrık çizim, doğal anlarında): ekerken gözler kasada (kirp: göz kapakları inik); k55 başını kaldırır, k60 gülümser
  const YUZ1 = [[0, { ifade: 'kirp', bakis: [0, 2] }], [55, { ifade: 'notr', bakis: [1, -1] }], [60, { ifade: 'mutlu', bakis: [1, -1] }]];
  const durumB = (f) => {
    let y = YUZ1[0][1];
    for (const [kk, d] of YUZ1) if (f >= K1 + kk) y = d;
    return { sol: izSol(f), sag: izSag(f), dy: dyIz(f), ifade: y.ifade, bakis: y.bakis, leke: f >= K1 + 85 };
  };
  ctx.herKare((f) => { if (f >= K1 && f < K2) BH.ciz(durumB(f)); });
  ctx.isaret(K1 + 60, 'vurgu');
  ctx.isaret(K1 + 75, 'vurgu');
  gsap.set(fideG, { autoAlpha: 0 });
  tl.set(fideG, { autoAlpha: 0 }, k(K1));
  // 0. kare (alt çizelgenin 0. anı, yukarıdaki not): fide, itme ve kamera elle kurulur
  ctx.herKare((f) => {
    if (f !== K1) return;
    gsap.set(fideG, { autoAlpha: 0 });
    gsap.set(ctx.itme, { x: 0, y: 0 });
    gsap.set(ctx.kamera, ctx.odak(...B1.kam[0]));
  });
  tl.set(fideG, { autoAlpha: 1 }, k(K1 + 20));
  kamera(K1, K2 - 1, B1.kam[0], B1.kam[1]);

  // Kalın 3B harfler: iskelet çizgileri yuvarlak uçlu kalın kalemle; mürekkep kenar, yan yüz (derinlik) iskeletin sağ alta
  // kaydırılmış kopyaları, ön yüzde sol üstten ince parlama. Her iskeletin yolu kaynamada bir kez hesaplanır, kopyalara yazılır.
  function harfKur(ust, metin, { cx, taban, boy, renkler, tohum }) {
    const sw = boy * 0.24, cer = Math.max(4, boy * 0.034), der = boy * 0.09, adim = 4, yon = [0.74, 0.5];
    const hs = [...metin].map((h) => HARF[h]), ara = boy * 0.4;
    const gen = hs.reduce((t, h) => t + h.en * boy, 0) + ara * (hs.length - 1);
    const yT = taban - sw / 2 - cer - boy;
    const katlar = [0, 1, 2, 3, 4].map(() => el(ust, 'g')); // derinlik kenarı, yan yüz, ön kenar, ön yüz, parlama
    const izler = [];
    let x = cx - gen / 2;
    hs.forEach((h, j) => {
      const renk = renkler[j % renkler.length], yan = koyult(renk, 0.18);
      for (const k of h.c) {
        let pts = k.p.map(([u, v]) => [x + u * boy, yT + v * boy]);
        if (!k.e) pts = kenarla(pts, boy * 0.1, false);
        const yollar = [];
        const yap = (g, r, w, dx, dy, op = 1) => yollar.push(el(g, 'path', { fill: 'none', stroke: r, 'stroke-width': f1(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: `translate(${f1(dx)} ${f1(dy)})`, opacity: op }));
        for (let a = adim; a >= 1; a--) { const o = der * a / adim; yap(katlar[0], M, sw + 2 * cer, yon[0] * o, yon[1] * o); yap(katlar[1], yan, sw, yon[0] * o, yon[1] * o); }
        yap(katlar[2], M, sw + 2 * cer, 0, 0);
        yap(katlar[3], renk, sw, 0, 0);
        yap(katlar[4], '#ffffff', sw * 0.22, -sw * 0.16, -sw * 0.16, 0.55);
        izler.push({ pts, yollar, sp: ctx.sapma(tohum + izler.length * 5, 1.1) });
      }
      x += h.en * boy + ara;
    });
    const ciz = (i) => { for (const z of izler) { const d = yol(z.pts, false, z.sp(Math.max(0, i))); for (const p of z.yollar) p.setAttribute('d', d); } };
    ciz(kayIndis);
    ctx.kaynayanlar.add(ciz);
  }

  // Kol pozu karışımı (60 fps): eklemler doğrusal, el biçimi ve yüzü yarı yolda değişir
  const karis = (A, B, u) => ({
    ...(u < 0.5 ? A : B),
    dirsek: [lerp(A.dirsek[0], B.dirsek[0], u), lerp(A.dirsek[1], B.dirsek[1], u)],
    bilek: [lerp(A.bilek[0], B.bilek[0], u), lerp(A.bilek[1], B.bilek[1], u)],
    elAci: lerp(A.elAci, B.elAci, u), kisalma: lerp(A.kisalma ?? 1, B.kisalma ?? 1, u), basparmak: lerp(A.basparmak ?? 1, B.basparmak ?? 1, u),
  });

  // =========================================================================== #4b.2 ÇANTA SÜSÜ (k156–263)
  // Süse yakın plan (ürün kahraman): koyu bez çantanın fermuarı, halka ve sağ kenarı; kedi süs kadraj boyunun ~%30'u. Kişinin
  // yüzü kadrajın üstünde kalır; omuz, askı ve gövdenin sallanması görünür. k14'te kişi sola döner: gövde kayar, hafifçe
  // yatar. Çanta askı noktasından (S), süs fermuar sürgüsünden (Z) sarkaç gibi sallanır: iki zincirli sönümlü sarkaç, kutu
  // biriminde (ölçekten bağımsız), kurulumda bir kez 1/8 kare adımla hesaplanır, her kare tablodan okunur (geri sarmada da
  // aynı kare). Açılar mutlak (dikeyden); grup dönüşümlerinde üst grubun dönüşü çıkarılır. Kamera çekim boyunca süse iter.
  ctx.isaret(K2, 'kesme');
  const L2 = katmanAc('s4b-canta', K2, K3 - 1);
  const B2 = yer({
    kisi: { x: 482, yuzY: -75.6, s: 2.2 }, dolap: { x0: -60, ad: 236, y1: 1000, v: 150 }, kam: [[1000, 585, 1.1], [1010, 595, 1.22]],
  }, {
    kisi: { x: 28, yuzY: -4, s: 2.8 }, dolap: { x0: -40, ad: 224, y1: 1760, v: 420 }, kam: [[589, 900, 1.1], [630, 880, 1.2]],
  });
  {
    // arka plan: okul koridoru dolapları (açık gri; havalandırma yarıkları, kulp), altta zemin
    const D = B2.dolap, ac = '#d6d0c5';
    for (let x = D.x0, i = 0; x < W + 60; x += D.ad, i++) {
      C(L2.svg, kenarla([[x + 6, -40], [x + D.ad - 6, -40], [x + D.ad - 6, D.y1], [x + 6, D.y1]], 60), { kapali: true, dolgu: i % 2 ? '#e9e4db' : '#e3ded4', kalinlik: 4, renk: ac, kay: [0, 0] });
      for (let j = 0; j < 4; j++) C(L2.svg, [[x + D.ad * 0.32, D.v + j * 22], [x + D.ad * 0.68, D.v + j * 22]], { kalinlik: 3.4, renk: ac, genlik: 0.5 });
      C(L2.svg, [[x + D.ad - 32, D.y1 * 0.46], [x + D.ad - 32, D.y1 * 0.46 + 64]], { kalinlik: 6, renk: '#c4bdb1' });
    }
    C(L2.svg, kenarla([[-80, D.y1], [W + 80, D.y1], [W + 80, H + 80], [-80, H + 80]], 80), { kapali: true, dolgu: '#d8d2c7', kalinlik: 4.4, renk: '#bdb6a9', kay: [0, 0] });
  }
  const p2 = ctx.rastgeleKisi(4423, {
    kadin: true, yas: 'genc', sacStil: 'kivircik', sac: 1, ten: 3, giysi: 1, yaka: 'kapusonlu', yapi: 'orta', yanak: 0.3,
    yuzEn: 60, yuzBoy: 76, gozluk: null, sakal: null, kupe: 'halka', cil: true, piercing: ['burun'],
  });
  const k2 = B2.kisi, s2 = k2.s, x02 = k2.x - 200 * s2, y02 = k2.yuzY - (GOZ_Y + 4) * s2;
  // Yakın planda çizgiler kalınlaşmasın: kutu birimindeki kalınlık, kayma ve titreme s = 2 kişisinin dünyadaki değerine iner
  const ki2 = Math.min(1, 2 / s2);
  const C2 = (ust, pts, o = {}) => C(ust, pts, { ...o, kalinlik: (o.kalinlik ?? 5) * ki2, kay: (o.kay ?? [3, 3]).map((v) => v * ki2), genlik: (o.genlik ?? 1.2) * ki2 });
  const ince2 = (str) => (ki2 >= 1 ? str : str.replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${(w * ki2).toFixed(2)}"`)
    .replace(/translate\(3 3\)/g, `translate(${f1(3 * ki2)} ${f1(3 * ki2)})`));
  const gSal = el(L2.svg, 'g');
  const gK2 = el(gSal, 'g', { transform: `translate(${f1(x02)} ${f1(y02)}) scale(${s2})` });
  const gBeden2 = el(gK2, 'g'), gCanta = el(gK2, 'g');
  // Askı noktası S (sol omzun tepesi, ekranın sağı) ve süsün asıldığı fermuar sürgüsü Z (çantanın ön yüzünün üstünde: süs
  // koyu kumaşın önünde sallanır), kutu birimi. Kısa saplı bez çanta: ağzı koltuk altının biraz altında, gövdeye yaslı
  const S2 = [300, 306], Z2 = [440, 412];
  {
    const CANTA = '#57524b', CEP = '#5f5a53', ASKI = '#6f695f', DIKIS = '#8d867a';
    // gövde (altta hafif genişler), ön cep (üstü dikişli), kumaş kırışıkları, dokuma etiket
    C2(gCanta, kenarla([[244, 400], [520, 400], [534, 732], [232, 732]], 30), { kapali: true, dolgu: CANTA, kalinlik: 3.4, kay: [2, 2] });
    C2(gCanta, kenarla([[262, 560], [506, 560], [510, 712], [258, 712]], 30), { kapali: true, dolgu: CEP, kalinlik: 2.6, kay: [1.5, 1.5] });
    C2(gCanta, kenarla([[266, 572], [502, 572]], 30, false), { kalinlik: 1.4, renk: DIKIS, genlik: 0.4 }).yol.setAttribute('stroke-dasharray', `${f1(6 * ki2)} ${f1(5 * ki2)}`);
    C2(gCanta, [[300, 470], [292, 520], [296, 552]], { kalinlik: 1.6, renk: '#46423d', genlik: 0.5 });
    C2(gCanta, [[478, 476], [486, 520], [482, 552]], { kalinlik: 1.6, renk: '#46423d', genlik: 0.5 });
    C2(gCanta, kenarla([[276, 676], [328, 676], [328, 700], [276, 700]], 14), { kapali: true, dolgu: '#a59e91', kalinlik: 2, kay: [1, 1] });
    // fermuar bandı, metal dişler (sürgünün iki yanında), ağız dikişi
    C2(gCanta, kenarla([[250, 400], [514, 400], [514, 412], [250, 412]], 30), { kapali: true, dolgu: '#46423d', kalinlik: 2.2, kay: [0, 0] });
    C2(gCanta, kenarla([[254, 406], [510, 406]], 30, false), { kalinlik: 4.5, renk: '#bdb6a9', genlik: 0.3 }).yol.setAttribute('stroke-dasharray', `${f1(2.2 * ki2)} ${f1(2.6 * ki2)}`);
    C2(gCanta, kenarla([[248, 423], [516, 423]], 30, false), { kalinlik: 1.4, renk: DIKIS, genlik: 0.4 }).yol.setAttribute('stroke-dasharray', `${f1(6 * ki2)} ${f1(5 * ki2)}`);
    // askılar: iki bant omuzdan çantanın ön yüzüne iner, uçları çapraz dikişli yamalarla
    for (const [a, b] of [[[294, 300], [262, 446]], [[306, 300], [388, 446]]]) C2(gCanta, kenarla(bant(a, b, 16), 24), { kapali: true, dolgu: ASKI, kalinlik: 3, kay: [1.5, 1.5] });
    for (const x of [262, 388]) {
      C2(gCanta, kenarla([[x - 11, 434], [x + 11, 434], [x + 11, 458], [x - 11, 458]], 10), { kapali: true, dolgu: ASKI, kalinlik: 2.4, kay: [1, 1] });
      C2(gCanta, [[x - 7, 438], [x + 7, 454]], { kalinlik: 1.4, renk: DIKIS });
      C2(gCanta, [[x + 7, 438], [x - 7, 454]], { kalinlik: 1.4, renk: DIKIS });
    }
    // fermuar sürgüsü (açık metal; Z'nin hemen üstünde)
    C2(gCanta, yDortgen(Z2[0] - 9, Z2[1] - 13, Z2[0] + 9, Z2[1] + 2, 3, 6), { kapali: true, dolgu: '#cfc9bd', kalinlik: 2.4, kay: [1, 1] });
  }
  // Süs (yerel: Z, aşağı sarkar): çekecin dili, halka; oturan kedi silüeti (sivri kulaklar, boyun girintisi, kuyruğu önden
  // dolanıp ucu kalkık), kazınmış kapalı gözler, burun ve bıyıklar. Sedef: açık lila zeminde açık parıltı bandı (gradyan;
  // salınım açısıyla kayar), kenarda beyaz parlama çizgisi. Koyu kumaşın önünde açık süs: kontur net okunur.
  const gSus = el(gCanta, 'g');
  const sedef = el(el(L2.svg, 'defs'), 'linearGradient', { id: 's4b-sedef', x1: 0, y1: 0, x2: 1, y2: 1 });
  for (const [o, c] of [[0, URUN_RENK.lilaAcik], [0.36, '#f8f4fd'], [0.5, '#e6f3ee'], [0.64, '#f2e8f8'], [1, URUN_RENK.lilaAcik]]) el(sedef, 'stop', { offset: o, 'stop-color': c });
  let parlama2;
  const gPar = el(gSus, 'g');
  {
    const KAZI = koyult(URUN_RENK.lilaAcik, 0.35);
    C2(gSus, yDortgen(-5.5, -2, 5.5, 32, 4, 6), { kapali: true, dolgu: '#cfc9bd', kalinlik: 2.2, kay: [1, 1] });
    el(gSus, 'circle', { cx: 0, cy: 27, r: 2.4, fill: '#46423d' });
    const olc = 1, oy = 27, Q = (pts) => pts.map(([x, y]) => [x * olc, oy + y * olc]);
    C2(gSus, Q([[18, 112], [40, 121], [56, 113], [62, 98], [55, 91], [51, 102], [42, 110], [24, 106]]), { kapali: true, dolgu: 'url(#s4b-sedef)', kalinlik: 2.8, kay: [1, 1] });
    C2(gSus, Q([[0, 22], [6, 22], [16, 8], [22, 0], [24, 14], [25, 30], [28, 44], [24, 58], [14, 65], [20, 74], [30, 92], [32, 108], [24, 118], [0, 120],
      [-24, 118], [-32, 108], [-30, 92], [-20, 74], [-14, 65], [-24, 58], [-28, 44], [-25, 30], [-24, 14], [-22, 0], [-16, 8], [-6, 22]]),
    { kapali: true, dolgu: 'url(#s4b-sedef)', kalinlik: 3, kay: [1, 1] });
    // asma halkası (başın tepesinde, kulakların arasında) ve çekecin halkası
    C2(gSus, oval(0, 46, 3.5, 3.5, 0, 360, 8, 2), { kapali: true, kalinlik: 1.8, genlik: 0.3 });
    C2(gSus, oval(0, 36, 6, 6, 0, 360, 12, 2), { kapali: true, kalinlik: 2.2, genlik: 0.3 });
    for (const yon of [-1, 1]) {
      C2(gSus, Q([[yon * 16, 42], [yon * 11, 45], [yon * 6, 42]]), { kalinlik: 1.5, renk: KAZI, genlik: 0.3 });
      C2(gSus, Q([[yon * 13, 53], [yon * 27, 50]]), { kalinlik: 1.2, renk: KAZI, genlik: 0.2 });
      C2(gSus, Q([[yon * 13, 56], [yon * 26, 60]]), { kalinlik: 1.2, renk: KAZI, genlik: 0.2 });
    }
    C2(gSus, Q([[-3, 50], [3, 50], [0, 53]]), { kapali: true, dolgu: KAZI, kalinlik: 1.2, renk: KAZI, genlik: 0.2, kay: [0, 0] });
    parlama2 = C2(gSus, Q([[-24, 84], [-29, 98], [-27, 110]]), { kalinlik: 2.6, renk: '#ffffff', genlik: 0.3 });
    // parıltı: dört uçlu yıldız (dik durur: süsün dönüşü geri alınır), ortasında küçük turuncu tik
    const yil = [];
    for (let i = 0; i < 8; i++) { const a = (i * 45 - 90) * D2R, r = i % 2 ? 3.6 : 15; yil.push([r * Math.cos(a), r * Math.sin(a)]); }
    C2(gPar, yil, { kapali: true, dolgu: '#fbf9f5', kalinlik: 1.8, genlik: 0.2, kay: [0, 0] });
    C2(gPar, [[0, -2.6], [2.6, 0], [0, 2.6], [-2.6, 0]], { kapali: true, dolgu: '#94400f', kalinlik: 0.8, renk: '#94400f', genlik: 0.1, kay: [0, 0] });
    gSus.appendChild(gPar);
  }
  // ---------- Salınım (kutu birimi): gövde (dx, eğim) → askı S → çanta açısı ψ → sürgü Z → süs açısı θ; tablolar kare başına
  const N2 = K3 - K2;
  const salDx = (t) => -30 * sm5((t - 14) / 18) + 6.9 * sm5((t - 34) / 26);
  const salR = (t) => (-2.6 * sm5((t - 14) / 18) + 1.3 * sm5((t - 34) / 30)) * D2R;
  const P2 = [200, 800]; // eğilmenin dönme merkezi (kalça, kadraj dışı)
  const V2 = [Z2[0] - S2[0], Z2[1] - S2[1]];
  const Sdun = (t) => {
    const r = salR(t), x = S2[0] - P2[0], y = S2[1] - P2[1];
    return [P2[0] + x * Math.cos(r) - y * Math.sin(r) + salDx(t), P2[1] + x * Math.sin(r) + y * Math.cos(r)];
  };
  const DX2 = [], R2 = [], PSI = [], TH = [];
  {
    // çanta: ağır ve gövdeye yaslı (çok sönümlü); süs: kısa, az sönümlü. g = ω²L (kutu/kare²); pivotun ivmesi sanal kuvvet.
    // Açılar SVG dönüş yönünde (saat yönü +, y aşağı): sarkacın ucu pivot + L·(−sin, cos), sola ivmelenen pivot ucu sağa savurur
    const wb = 2 * Math.PI / 46, zb = 0.6, Lb = 400, wc = 2 * Math.PI / 28, zc = 0.07, Lc = 32;
    const gb = wb * wb * Lb, gc = wc * wc * Lc, alt = 8, dt = 1 / alt, h = 0.25;
    let psi = 0, dpsi = 0, th = 0, dth = 0;
    for (let n = 0; n < N2; n++) {
      DX2.push(salDx(n)); R2.push(salR(n) / D2R); PSI.push(psi / D2R); TH.push(th / D2R);
      for (let j = 0; j < alt; j++) {
        const t = n + j * dt, a = Sdun(t - h), b = Sdun(t), c = Sdun(t + h);
        const aS = [(a[0] - 2 * b[0] + c[0]) / h / h, (a[1] - 2 * b[1] + c[1]) / h / h];
        const ddpsi = -(1 - aS[1] / gb) * wb * wb * Math.sin(psi) + aS[0] / Lb * Math.cos(psi) - 2 * zb * wb * dpsi;
        const cs = Math.cos(psi), sn = Math.sin(psi), rv = [V2[0] * cs - V2[1] * sn, V2[0] * sn + V2[1] * cs];
        const aZ = [aS[0] - dpsi * dpsi * rv[0] - ddpsi * rv[1], aS[1] - dpsi * dpsi * rv[1] + ddpsi * rv[0]];
        const ddth = -(1 - aZ[1] / gc) * wc * wc * Math.sin(th) + aZ[0] / Lc * Math.cos(th) - 2 * zc * wc * dth;
        dpsi += ddpsi * dt; psi += dpsi * dt; dth += ddth * dt; th += dth * dt;
      }
    }
  }
  // En yüksek salınım: parıltı ve ses işareti orada
  let PK = 0;
  TH.forEach((v, i) => { if (Math.abs(v) > Math.abs(TH[PK])) PK = i; });
  ctx.isaret(K2 + PK, 'tik');
  // Yüz (ayrık; kadrajın üstünde, dikeyde çenesi görünür): önce önüne bakar; k12 sesi duyup sola bakar, k30 gülümser
  const YUZ2 = [[0, 'notr', [1, 0]], [12, 'notr', [-1, 0]], [30, 'mutlu', [-1, 0]], [74, 'mutlu', [-1, -1]]];
  const P2d = [x02 + P2[0] * s2, y02 + P2[1] * s2];
  let anahtar2 = '';
  ctx.herKare((f) => {
    if (f < K2 - 1 || f > K3) return;
    const n = sinir(f - K2, 0, N2 - 1);
    gSal.setAttribute('transform', `translate(${f1(DX2[n] * s2)} 0) rotate(${R2[n].toFixed(3)} ${f1(P2d[0])} ${f1(P2d[1])})`);
    gCanta.setAttribute('transform', `rotate(${(PSI[n] - R2[n]).toFixed(3)} ${S2[0]} ${S2[1]})`);
    gSus.setAttribute('transform', `translate(${Z2[0]} ${Z2[1]}) rotate(${(TH[n] - PSI[n]).toFixed(3)})`);
    // sedef: parıltı bandı salınımla kayar; süs en büyük salınımın yönüne savrulunca kenarı ışığı yakalar
    const u = TH[n] * D2R, a0 = -0.2 - u * 1.2;
    sedef.setAttribute('x1', a0.toFixed(3)); sedef.setAttribute('y1', a0.toFixed(3));
    sedef.setAttribute('x2', (a0 + 1.4).toFixed(3)); sedef.setAttribute('y2', (a0 + 1.4).toFixed(3));
    parlama2.g.setAttribute('opacity', (0.25 + 0.65 * sinir(TH[n] * Math.sign(TH[PK]) / 30, 0, 1)).toFixed(3));
    // parıltı: tepeye 3 karede çıkar, 2 kare durur, 9 karede söner (her karede)
    const sc = n < PK - 3 ? 0 : n <= PK ? EO((n - PK + 3) / 3) : 1 - ilerle(n, PK + 2, PK + 11, (x) => x * x);
    gPar.setAttribute('transform', `translate(24 63) rotate(${(-TH[n] + (n - PK) * 3).toFixed(2)}) scale(${Math.max(0.001, sc).toFixed(3)})`);
    gPar.setAttribute('opacity', sc > 0.01 ? 1 : 0);
    let y = YUZ2[0];
    for (const d of YUZ2) if (n >= d[0]) y = d;
    const a = `${kayIndis}|${y[1]}|${y[2]}`;
    if (a !== anahtar2) { anahtar2 = a; gBeden2.innerHTML = ince2(kisiSVG(p2, { kaynama: kayIndis, ifade: y[1], bakis: y[2], mono: true })); }
  });
  kamera(K2, K3 - 1, B2.kam[0], B2.kam[1]);

  // =========================================================================== #4b.3 YAYINCI (k264–371)
  // Genç yayıncı masada, kulaklıklı; önde tripodlu kamera (objektifi ona bakar). k26 kameranın ışığı yanar (tik), arkadaki
  // "PİKSEL" harflerinin ardındaki pastel ışık güçlenir; kameraya bakar, gülümser, el sallar (bilek ve el açısı her karede)
  // ve konuşur (ağız ayrık). Harfler ve maskot renkli; kişi, oda ve kamera mono. Sohbet arayüzü ya da platform işareti yok.
  ctx.isaret(K3, 'kesme');
  const L3 = katmanAc('s4b-yayin', K3, K4 - 1);
  const B3 = yer({
    kisi: { x: 720, kenar: 800, s: 1.7 }, raf: { x0: 880, x1: 2000, y: 440 }, harf: { cx: 1290, taban: 440, boy: 150 }, maskot: [1760, 440, 1],
    panel: { x0: 70, y0: 90, n: [3, 2], a: 124 }, kamera: [215, 790, 1], mik: [870, 470, -42], klavye: [720, 905], fare: [1060, 925],
    kam: [[960, 540, 1.05], [990, 520, 1.11]],
  }, {
    kisi: { x: 540, kenar: 1350, s: 1.7 }, raf: { x0: -40, x1: 1120, y: 560 }, harf: { cx: 470, taban: 560, boy: 120 }, maskot: [905, 560, 0.85],
    panel: { x0: 820, y0: 640, n: [2, 3], a: 116 }, kamera: [190, 1560, 1], mik: [690, 1010, -40], klavye: [540, 1455], fare: [835, 1475],
    kam: [[540, 1000, 1.1], [545, 980, 1.16]],
  });
  const defs3 = el(L3.svg, 'defs');
  for (const [id, renk] of [['s4b-isik1', '#e4d9f6'], ['s4b-isik2', URUN_RENK.seftali], ['s4b-lamba', '#fffdf6']]) {
    const g = el(defs3, 'radialGradient', { id });
    for (const [o, op] of [[0, 0.95], [0.5, 0.55], [1, 0]]) el(g, 'stop', { offset: o, 'stop-color': renk, 'stop-opacity': op });
  }
  {
    // duvarda ses yalıtım panelleri (oluklar sırayla yatay ve dikey)
    const Pn = B3.panel;
    for (let i = 0; i < Pn.n[0]; i++) for (let j = 0; j < Pn.n[1]; j++) {
      const x = Pn.x0 + i * Pn.a, y = Pn.y0 + j * Pn.a, a = Pn.a - 10, yat = (i + j) % 2;
      C(L3.svg, kenarla([[x, y], [x + a, y], [x + a, y + a], [x, y + a]], 30), { kapali: true, dolgu: yat ? '#ddd7cc' : '#d6d0c5', kalinlik: 3, renk: '#bdb6a9', kay: [0, 0] });
      for (let q = 1; q < 4; q++) { const t = q / 4; C(L3.svg, yat ? [[x + 8, y + a * t], [x + a - 8, y + a * t]] : [[x + a * t, y + 8], [x + a * t, y + a - 8]], { kalinlik: 2, renk: '#bdb6a9', genlik: 0.5 }); }
    }
  }
  // Harflerin ardındaki yumuşak pastel ışık (iki leke: lila ve şeftali); kamera ışığı yanınca güçlenir
  const H3 = B3.harf;
  const isik3 = el(L3.svg, 'g', { opacity: 0.5 });
  el(isik3, 'ellipse', { cx: H3.cx - H3.boy * 0.9, cy: H3.taban - H3.boy * 0.75, rx: H3.boy * 2.7, ry: H3.boy * 1.3, fill: 'url(#s4b-isik1)' });
  el(isik3, 'ellipse', { cx: H3.cx + H3.boy * 1.3, cy: H3.taban - H3.boy * 0.7, rx: H3.boy * 2.2, ry: H3.boy * 1.15, fill: 'url(#s4b-isik2)' });
  {
    // raf: ön kalınlık ve iki dirsek
    const R = B3.raf;
    C(L3.svg, kenarla([[R.x0, R.y], [R.x1, R.y], [R.x1, R.y + 26], [R.x0, R.y + 26]], 60), { kapali: true, dolgu: TON.ahsapOn, kalinlik: 4.2 });
    for (const t of [0.2, 0.72]) { const x = lerp(R.x0, R.x1, t); C(L3.svg, [[x, R.y + 26], [x, R.y + 72], [x - 44, R.y + 26]], { kapali: true, dolgu: TON.ahsapK, kalinlik: 3.4 }); }
  }
  harfKur(L3.svg, 'PİKSEL', { ...H3, renkler: ['gok', 'lila', 'nane', 'limon', 'seftali', 'mercan'].map((r) => URUN_RENK[r]), tohum: 5401 });
  // Maskot (özgün): piksel gözlü küp yaratık, tepede şeftali uçlu anten; yan yüzü derinlik verir
  const gozler3 = [];
  {
    const [mx, my, ms] = B3.maskot, gM = el(L3.svg, 'g', { transform: `translate(${mx} ${my}) scale(${ms})` });
    for (const sx of [-1, 1]) C(gM, yDortgen(sx * 22 - 13, -16, sx * 22 + 13, 0, 5, 8), { kapali: true, dolgu: koyult(NANE, 0.16), kalinlik: 3.6, kay: [1, 1] });
    C(gM, kenarla([[44, -104], [58, -96], [58, -22], [44, -12]], 16), { kapali: true, dolgu: koyult(NANE, 0.24), kalinlik: 3.6, kay: [0, 0] });
    C(gM, [[2, -110], [8, -132]], { kalinlik: 3.6 });
    C(gM, yDortgen(-1, -148, 17, -130, 3, 6), { kapali: true, dolgu: URUN_RENK.seftali, kalinlik: 3.4, kay: [1, 1] });
    C(gM, yDortgen(-48, -112, 48, -12, 20, 16), { kapali: true, dolgu: NANE, kalinlik: 4, kay: [2, 2] });
    for (const sx of [-1, 1]) gozler3.push(el(gM, 'rect', { x: sx * 16 - 6, y: -78, width: 12, height: 14, fill: M }));
    for (const [x, y] of [[-14, -52], [-7, -46], [0, -46], [7, -46], [14, -52]]) el(gM, 'rect', { x: x - 3.5, y: y - 3.5, width: 7, height: 7, fill: M });
    for (const sx of [-1, 1]) el(gM, 'ellipse', { cx: sx * 32, cy: -52, rx: 7, ry: 4.5, fill: URUN_RENK.mercan, opacity: 0.8 });
    C(gM, [[-36, -96], [-24, -102]], { kalinlik: 3.2, renk: '#ffffff' });
  }
  // Yayıncı (insan.js + kol.js): gövde masanın arkasında, kollar masanın üstünde
  const p3 = ctx.rastgeleKisi(5311, {
    kadin: false, yas: 'genc', sacStil: 'twist', sac: 0, ten: 4, giysi: 1, yaka: 'kapusonlu', yapi: 'orta', yanak: 0.15,
    yuzEn: 62, yuzBoy: 78, gozluk: null, sakal: null, kulaklik: true, kupe: false, cil: false, piercing: ['kas'],
  });
  const k3 = B3.kisi, s3 = k3.s, x03 = k3.x - 200 * s3, y03 = k3.kenar - 470 * s3;
  const gGovde3 = el(L3.svg, 'g'), gMasa3 = el(L3.svg, 'g'), gKol3 = el(L3.svg, 'g'), gIsik3 = el(L3.svg, 'g', { opacity: 0 }), gOn3 = el(L3.svg, 'g');
  const yap3 = (g) => el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * s3, height: BOY.boy * s3, x: x03, y: y03, overflow: 'visible' });
  const sGovde3 = yap3(gGovde3), sKol3 = yap3(gKol3);
  const kb3 = ([X, Y]) => [(X - x03) / s3, (Y - y03) / s3]; // dünya → kutu
  let fareG;
  {
    // masa (üst yüz), klavye (uzak kenarı dar yamuk, tuş sıraları), fare altlığı ve fare
    const ky = k3.kenar;
    C(gMasa3, kenarla([[-80, ky], [W + 80, ky], [W + 80, H + 80], [-80, H + 80]], 80), { kapali: true, dolgu: '#cfc9bd', kalinlik: 4.4, kay: [0, 0] });
    C(gMasa3, kenarla([[-80, ky + 12], [W + 80, ky + 12]], 80, false), { kalinlik: 2, renk: '#e2ddd3', genlik: 0.5 });
    const [kx, kyy] = B3.klavye;
    C(gMasa3, kenarla([[kx - 236, kyy - 44], [kx + 236, kyy - 44], [kx + 262, kyy + 48], [kx - 262, kyy + 48]], 30), { kapali: true, dolgu: '#e2ddd3', kalinlik: 3.6, kay: [2, 2] });
    for (let i = 0; i < 4; i++) {
      const t = (i + 0.6) / 4.4, y = lerp(kyy - 44, kyy + 48, t), w = lerp(236, 262, t) - 20;
      C(gMasa3, kenarla([[kx - w, y], [kx + w, y]], 40, false), { kalinlik: 9, renk: '#bdb6a9', genlik: 0.3 }).yol.setAttribute('stroke-dasharray', '16 7');
    }
    const [fx, fy] = B3.fare;
    C(gMasa3, yDortgen(fx - 90, fy - 42, fx + 90, fy + 46, 12, 30), { kapali: true, dolgu: '#bdb6a9', kalinlik: 3, kay: [0, 0] });
    fareG = el(gMasa3, 'g');
    C(fareG, oval(0, 0, 30, 22, 0, 360, 14, 2.2), { kapali: true, dolgu: '#e2ddd3', kalinlik: 3.4, kay: [1.5, 1.5] });
    C(fareG, [[0, -22], [0, -6]], { kalinlik: 2 });
  }
  {
    // mikrofon: masa kıskacından iki parçalı kol, kapsül (ızgara çizgileri, koyu bilezik)
    const [mx, my, ma] = B3.mik, ky = k3.kenar;
    const kis = [mx + 300, ky + 6], dz = [mx + 190, my + 150], uc = [mx + 30, my + 40];
    C(gOn3, kenarla([[kis[0] - 22, ky - 6], [kis[0] + 22, ky - 6], [kis[0] + 22, ky + 30], [kis[0] - 22, ky + 30]], 14), { kapali: true, dolgu: '#5f5a53', kalinlik: 3.6 });
    C(gOn3, [kis, dz], { kalinlik: 10, renk: '#6f695f' });
    C(gOn3, [dz, uc], { kalinlik: 9, renk: '#6f695f' });
    C(gOn3, oval(dz[0], dz[1], 11, 11, 0, 360, 10, 2), { kapali: true, dolgu: '#8d867a', kalinlik: 3 });
    const gm = el(gOn3, 'g', { transform: `translate(${mx} ${my}) rotate(${ma})` });
    C(gm, yDortgen(-25, -66, 25, 54, 22, 14), { kapali: true, dolgu: '#8d867a', kalinlik: 4, kay: [2, 2] });
    for (const y of [-46, -32, -18]) C(gm, [[-18, y], [18, y]], { kalinlik: 2, renk: '#5f5a53', genlik: 0.4 });
    C(gm, kenarla([[-26, 2], [26, 2], [26, 16], [-26, 16]], 12), { kapali: true, dolgu: '#5f5a53', kalinlik: 3, kay: [0, 0] });
  }
  // Kamera (önde, tripodda; objektif yayıncıya döner). Işık: tepede objektifle aynı yöne bakan küçük LED panel; yanınca
  // yüzü beyazlar, hale ve kısa ışınlar çıkar, yayıncının göğsüne doğru kenarı yumuşak bir ışık kaması düşer (gIsik3)
  let lamba3, hale3, isinlar3;
  {
    const [cx3, cy3, cs] = B3.kamera, gC = el(gOn3, 'g', { transform: `translate(${cx3} ${cy3}) scale(${cs})` });
    for (const [a, b] of [[[-10, 86], [-150, 430]], [[0, 86], [26, 460]], [[10, 86], [170, 420]]]) C(gC, kenarla(bant(a, b, 18), 40), { kapali: true, dolgu: '#6f695f', kalinlik: 4.4, kay: [1.5, 1.5] });
    C(gC, kenarla([[-40, 60], [40, 60], [30, 92], [-30, 92]], 20), { kapali: true, dolgu: '#5f5a53', kalinlik: 4.4 });
    hale3 = el(gC, 'circle', { cx: 70, cy: -103, r: 84, fill: 'url(#s4b-lamba)', opacity: 0 });
    C(gC, kenarla([[-84, -64], [-44, -64], [-44, -86], [-84, -86]], 20), { kapali: true, dolgu: '#6f695f', kalinlik: 4 });
    C(gC, [[14, -64], [14, -88]], { kalinlik: 7, renk: '#46423d' });
    C(gC, yDortgen(-24, -122, 62, -86, 6, 16), { kapali: true, dolgu: '#6f695f', kalinlik: 4, kay: [1.5, 1.5] });
    C(gC, yDortgen(-104, -64, 100, 64, 16, 30), { kapali: true, dolgu: '#5f5a53', kalinlik: 5, kay: [2, 2] });
    C(gC, kenarla([[100, -48], [178, -52], [178, 52], [100, 48]], 24), { kapali: true, dolgu: '#46423d', kalinlik: 5, kay: [2, 2] });
    for (const x of [124, 150]) C(gC, [[x, -48], [x, 48]], { kalinlik: 2.6, renk: '#8d867a' });
    C(gC, oval(180, 0, 14, 50, 0, 360, 16, 2), { kapali: true, dolgu: '#8d867a', kalinlik: 4.4, kay: [0, 0] });
    C(gC, yDortgen(-86, -40, -26, 30, 8, 14), { kapali: true, dolgu: '#8d867a', kalinlik: 3 });
    lamba3 = C(gC, kenarla([[62, -124], [76, -128], [76, -80], [62, -84]], 10), { kapali: true, dolgu: '#46423d', kalinlik: 3.6, kay: [0, 0] });
    for (const y of [-114, -104, -94]) C(gC, [[66, y], [72, y - 1]], { kalinlik: 2, renk: '#8d867a', genlik: 0.2 });
    isinlar3 = el(gC, 'g', { opacity: 0 });
    for (const a of [-50, -25, 0, 25, 50]) { const c = Math.cos(a * D2R), s = Math.sin(a * D2R); C(isinlar3, [[72 + c * 24, -104 + s * 24], [72 + c * 44, -104 + s * 44]], { kalinlik: 3.4, renk: '#8d867a' }); }
    // ışık kaması (dünya): panelin yüzünden yayıncıya doğru genişler, uzakta söner
    const E3 = [cx3 + 76 * cs, cy3 - 104 * cs], yuzY3 = k3.kenar - 470 * k3.s + (GOZ_Y + 4) * k3.s, uzak = k3.x + 210;
    const kg = el(defs3, 'linearGradient', { id: 's4b-kama', gradientUnits: 'userSpaceOnUse', x1: E3[0], y1: 0, x2: uzak, y2: 0 });
    for (const [o, op] of [[0, 0.6], [1, 0.06]]) el(kg, 'stop', { offset: o, 'stop-color': '#ffffff', 'stop-opacity': op });
    // kenarlar bulanık (sert çizgi yok); üst kenar çenenin altından geçer: ışık yüzü kesmez, göğse ve masaya düşer
    const fb = el(defs3, 'filter', { id: 's4b-kama-yumusak', x: '-30%', y: '-30%', width: '160%', height: '160%' });
    el(fb, 'feGaussianBlur', { stdDeviation: 14 });
    el(gIsik3, 'path', { d: dYol([[E3[0], E3[1] - 18], [uzak, yuzY3 + 125], [uzak, k3.kenar + 90], [E3[0], E3[1] + 18]]), fill: 'url(#s4b-kama)', filter: 'url(#s4b-kama-yumusak)' });
  }
  // Kollar (kutu birimi): sol el klavyede, sağ el farede; ışıktan sonra sol kol kalkar ve el sallar (bilek salınır, el
  // sırtı ve kenarı görünür: avuç izleyiciye dönmez)
  const KAL3 = 58, EB3 = 100, o3 = omuzlar(p3, { kalinlik: KAL3 });
  const DIN3 = {
    sol: { dirsek: [o3.sol[0] - 30, o3.sol[1] + 104], bilek: kb3([B3.klavye[0] - 150, B3.klavye[1] - 16]), el: 'dayanma', elAci: 22, kisalma: 0.6, basparmak: 1, yuz: 'sirt' },
    sag: { dirsek: [o3.sag[0] + 36, o3.sag[1] + 100], bilek: kb3([B3.fare[0] - 4, B3.fare[1] - 40]), el: 'dayanma', elAci: 82, kisalma: 0.6, yuz: 'sirt' },
  };
  const SAL3 = (n) => {
    const t = (n - 48) / 22 * Math.PI * 2, gen = 1 - 0.6 * ilerle(n, 88, 107);
    const bilek = [26 + 14 * Math.sin(t) * gen, 172 - 5 * Math.abs(Math.sin(t)) * gen];
    return { dirsek: kolIK(o3.sol, bilek, 136, 140, -1), bilek, el: 'acik', elAci: -96 + 20 * Math.sin(t + 0.7) * gen, yuz: 'sirt', basparmak: 0.6, kisalma: 1 };
  };
  const ISIK3 = 26;
  ctx.isaret(K3 + ISIK3, 'tik');
  // Yüz (ayrık): ekranına bakar; ışık yanınca kameraya döner, gülümser; k54–100 konuşur (ağız 5 karede bir açılır)
  const YUZ3 = [[0, 'notr', [0, 2]], [30, 'notr', [-1, 0]], [34, 'mutlu', [-1, 0]]];
  let anahtar3 = '';
  ctx.herKare((f) => {
    if (f < K3 - 1 || f > K4) return;
    const n = sinir(f - K3, 0, K4 - K3 - 1);
    const acik = n >= ISIK3;
    lamba3.dolgu.setAttribute('fill', acik ? '#fbf9f5' : '#46423d');
    hale3.setAttribute('opacity', acik ? (0.9 * ilerle(n, ISIK3, ISIK3 + 4, EO)).toFixed(3) : 0);
    gIsik3.setAttribute('opacity', acik ? ilerle(n, ISIK3, ISIK3 + 5, EO).toFixed(3) : 0);
    isinlar3.setAttribute('opacity', acik && n < ISIK3 + 14 ? 1 : 0);
    isik3.setAttribute('opacity', (0.5 + 0.5 * ilerle(n, ISIK3, ISIK3 + 12, EO)).toFixed(3));
    // maskot bir kez göz kırpar (ayrık)
    const kirp = n >= 70 && n < 75;
    for (const g of gozler3) { g.setAttribute('y', kirp ? -70 : -78); g.setAttribute('height', kirp ? 4 : 14); }
    // fare: ışıktan önce el fareyi hafifçe oynatır (her karede)
    const fx = n < ISIK3 ? 6 * Math.sin(n / 6) * (1 - n / ISIK3) : 0;
    fareG.setAttribute('transform', `translate(${f1(B3.fare[0] + fx)} ${B3.fare[1]})`);
    let y = YUZ3[0];
    for (const d of YUZ3) if (n >= d[0]) y = d;
    let ifade = y[1];
    if (n >= 54 && n < 100) ifade = Math.floor((n - 54) / 5) % 2 === 0 ? 'saskin' : 'merak';
    const sol = n < 34 ? DIN3.sol : n < 48 ? karis(DIN3.sol, SAL3(48), sm((n - 34) / 14)) : SAL3(n);
    const sag = { ...DIN3.sag, bilek: [DIN3.sag.bilek[0] + fx / s3, DIN3.sag.bilek[1]] };
    const ortak = { giysi: MONO.giysi[p3.giysi], ten: MONO.ten[p3.ten], kalinlik: KAL3, kaynama: kayIndis, elBoy: EB3, manset: 'ribana' };
    sKol3.innerHTML = kolSVG({ ...ortak, omuz: o3.sol, taraf: 'sol', tohum: 71, ...sol }) + kolSVG({ ...ortak, omuz: o3.sag, taraf: 'sag', tohum: 72, ...sag });
    const a = `${kayIndis}|${ifade}|${y[2]}`;
    if (a !== anahtar3) {
      anahtar3 = a;
      const G = govdeKes(p3, { id: 's4b-yayinci', kaynama: kayIndis, tohum: p3.tohum });
      sGovde3.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p3, { kaynama: kayIndis, ifade, bakis: y[2], mono: true })}</g>${G.kontur}`;
    }
  });
  kamera(K3, K4 - 1, B3.kam[0], B3.kam[1]);

  // =========================================================================== #4b.4 MASKE (k372–491)
  // Ayna karşısında genç bir cosplayer (özgün kostüm: tunik, arkada pelerin, omuzlarda geometrik etekli kapelet, altıgen
  // toka). Maskeyi iki eliyle kenarından tutup göğsünden yüzüne kaldırır, k34'te oturur (tik), eller iner; k54–68 aynaya
  // döner (önden arkaya; yatay basılma). Ayna önce sırtını (kollar başın yanında), dönünce maskeli yüzünü (aynalı) gösterir;
  // küçük bir baş sallar. Baş ve gövde kişinin aynı çiziminden iki kırpımla: baş sallanırken omuzlar yerinde kalır.
  ctx.isaret(K4, 'kesme');
  const L4 = katmanAc('s4b-maske', K4, SON);
  const B4 = yer({
    kisi: { x: 560, yuzY: 430, s: 2.0 }, ayna: { x0: 940, y0: 50, x1: 1580, y1: 1160 }, yans: { x: 1200, yuzY: 440, s: 1.15 },
    pano: [60, 70, 330, 300], pencere: [1370, 150, 1510, 420], kam: [[910, 560, 1.06], [960, 540, 1.1], [1190, 430, 1.85]],
  }, {
    kisi: { x: 360, yuzY: 1180, s: 2.0 }, ayna: { x0: 250, y0: 90, x1: 1040, y1: 1430 }, yans: { x: 680, yuzY: 760, s: 1.25 },
    pano: [30, 110, 230, 360], pencere: [830, 180, 970, 440], kam: [[540, 1000, 1.06], [560, 960, 1.1], [670, 745, 2.0]],
  });
  const defs4 = el(L4.svg, 'defs');
  const LIMON = URUN_RENK.limon, SEFTALI = URUN_RENK.seftali, PEL = '#a59e91', PEL_SIRT = '#8d867a', PEL_IC = '#5f5a53';
  const p4 = ctx.rastgeleKisi(6203, {
    kadin: true, yas: 'genc', sacStil: 'topuz', sac: 0, ten: 1, giysi: 5, yaka: 'balikci', yapi: 'orta', yanak: 0.2,
    yuzEn: 60, yuzBoy: 76, gozluk: null, sakal: null, kupe: false, cil: false, piercing: ['kulak'],
  });
  // Delikli kapalı şekil (dolgu çift-tek kuralıyla: delikten alttaki görünür); kaynar
  function delikli(ust, konturlar, { dolgu, kalinlik = 3.4, tohum, genlik = 0.9, kay = [2, 2] }) {
    const g = el(ust, 'g');
    const d = el(g, 'path', { fill: dolgu, 'fill-rule': 'evenodd', transform: `translate(${kay[0]} ${kay[1]})` });
    const c = el(g, 'path', { fill: 'none', stroke: M, 'stroke-width': kalinlik, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const sp = konturlar.map((_, j) => ctx.sapma(tohum + j * 7, genlik));
    const ciz = (i) => { const yd = konturlar.map((k, j) => yol(k, true, sp[j](Math.max(0, i)))).join(' '); d.setAttribute('d', yd); c.setAttribute('d', yd); };
    ciz(kayIndis);
    ctx.kaynayanlar.add(ciz);
    return g;
  }
  // Maske (kutu birimi, yüze oturmuş hali; tutulurken grubu kaydırılır). Kıpçak esinli özgün desen: alın çıkıntısı, kaş
  // kavisleri burun sırtında birleşir, bıyık kabartması alt kenarı kurar (ağız açıkta); zikzak alın bandı, perçinler, yanak
  // üçgenleri, metal parlaması. Zemin açık limon, kabartmalar şeftali.
  function maskeKur(ust, hw, hh) {
    const cx = 200, cy = GOZ_Y + 4, G = GOZ_Y, ay = cy + hh * 0.52, tepe = cy - 6 - hh;
    const ayna = (pts) => pts.map(([x, y]) => [2 * cx - x, y]);
    const yarim = [
      [cx, tepe - 12], [cx + 9, cy - hh * 0.9], [cx + 16, cy - hh * 0.8], [cx + hw * 0.62, cy - hh * 0.76], [cx + hw * 0.96, cy - hh * 0.5],
      [cx + hw * 1.06, cy - hh * 0.12], [cx + hw * 1.02, cy + hh * 0.16], [cx + hw * 0.9, cy + hh * 0.34], [cx + hw * 0.94, ay - 8],
      [cx + hw * 0.84, ay + 5], [cx + hw * 0.62, ay - 2], [cx + hw * 0.3, ay - 9], [cx, ay - 13],
    ];
    const dis = [...yarim, ...ayna(yarim.slice(1, -1)).reverse()];
    const goz = (yon) => { const gx = cx + yon * hw * 0.38; return [[gx - yon * 15, G + 2], [gx - yon * 6, G - 5], [gx + yon * 8, G - 6], [gx + yon * 16, G - 3], [gx + yon * 8, G + 5], [gx - yon * 6, G + 6]]; };
    delikli(ust, [dis, goz(-1), goz(1)], { dolgu: LIMON, kalinlik: 3.4, tohum: 6301 });
    const kab = { kapali: true, dolgu: SEFTALI, kalinlik: 2.6, kay: [1.5, 1.5], genlik: 0.6 };
    for (const yon of [-1, 1]) {
      C(ust, [[cx + yon * hw * 0.9, G - 8], [cx + yon * hw * 0.62, G - 25], [cx + yon * hw * 0.3, G - 27], [cx + yon * 5, G - 16], [cx + yon * 5, G - 9], [cx + yon * hw * 0.3, G - 16], [cx + yon * hw * 0.62, G - 14], [cx + yon * hw * 0.86, G - 2]], kab);
      C(ust, [[cx + yon * 3, G + 30], [cx + yon * hw * 0.32, ay - 17], [cx + yon * hw * 0.62, ay - 13], [cx + yon * hw * 0.8, ay - 22], [cx + yon * hw * 0.88, ay - 12], [cx + yon * hw * 0.62, ay - 5], [cx + yon * hw * 0.3, ay - 9], [cx + yon * 2, ay - 12]], kab);
    }
    C(ust, [[cx - 6, G - 12], [cx + 6, G - 12], [cx + 8, G + 20], [cx + 3, G + 28], [cx - 3, G + 28], [cx - 8, G + 20]], kab);
    C(ust, [[cx, cy - hh * 0.9 + 3], [cx + 7, cy - hh * 0.8], [cx, cy - hh * 0.7], [cx - 7, cy - hh * 0.8]], { ...kab, kalinlik: 2.2 });
    const zik = [];
    for (let i = 0; i <= 10; i++) zik.push([cx + hw * (-0.62 + i * 0.124), cy - hh * (i % 2 ? 0.56 : 0.65)]);
    C(ust, zik, { kalinlik: 2, genlik: 0.4 });
    for (const yon of [-1, 1]) {
      for (const [u, v] of [[0.92, -0.3], [0.99, 0.0], [0.86, 0.26]]) C(ust, oval(cx + yon * hw * u, cy + hh * v, 3, 3, 0, 360, 8, 2), { kapali: true, dolgu: koyult(LIMON, 0.14), kalinlik: 1.4, genlik: 0.2, kay: [0.5, 0.5] });
      const tx = cx + yon * hw * 0.64, ty = cy + hh * 0.1;
      C(ust, [[tx - 7, ty - 5], [tx + 7, ty - 5], [tx, ty + 6]], { kapali: true, kalinlik: 1.8, genlik: 0.3 });
    }
    C(ust, [[cx - hw * 0.72, cy - hh * 0.5], [cx - hw * 0.44, cy - hh * 0.62]], { kalinlik: 3.4, renk: '#ffffff', genlik: 0.3 });
    C(ust, [[cx + hw * 0.74, cy + hh * 0.02], [cx + hw * 0.8, cy + hh * 0.2]], { kalinlik: 3, renk: '#ffffff', genlik: 0.3 });
  }
  // Kişi figürü (kutu birimi). Sıra: pelerin arkası → (arkadan bakışta kollar) → gövde → pelerin, kapelet → baş → maske,
  // kayış → (önden kollar: maskeyi kenarından tutan eller en önde)
  function figur(ust, p, { id, x, yuzY, s }) {
    const hw = p.yuzEn * (YAPI[p.yapi] || YAPI.orta).yuz, hh = p.yuzBoy, cx = 200, cy = GOZ_Y + 4, ceneY = cy + hh;
    const gY = ceneY + (p.boy === 'uzun' ? 8 : 0), omuzY = gY + 40, x0 = x - cx * s, y0 = yuzY - cy * s;
    const kutu = el(ust, 'g');
    const defs = el(kutu, 'defs');
    const kirp = (ad, a, b) => { const c = el(defs, 'clipPath', { id: `${id}-${ad}`, clipPathUnits: 'userSpaceOnUse' }); el(c, 'rect', { x: -1200, y: a, width: 2800, height: b - a }); };
    kirp('bas', -1200, ceneY + 8); kirp('govde', ceneY - 2, 2400);
    // ince kırpım: boyun hattının altında yalnız |x − cx| < 120 kalır (insan.js'in yuvarlak dış omzu pelerinin dışına taşmasın)
    el(el(defs, 'clipPath', { id: `${id}-ince`, clipPathUnits: 'userSpaceOnUse' }), 'path', { d: `M-1200 -1200L1600 -1200L1600 ${gY}L${cx + 120} ${gY}L${cx + 120} 2400L${cx - 120} 2400L${cx - 120} ${gY}L-1200 ${gY}Z` });
    const gPelA = el(kutu, 'g'), gKolA = el(kutu, 'g'), gGovde = el(kutu, 'g', { 'clip-path': `url(#${id}-govde)` }), gPel = el(kutu, 'g');
    const gBasD = el(kutu, 'g'), gBas = el(gBasD, 'g', { 'clip-path': `url(#${id}-bas)` }), gEnse = el(gBasD, 'g'), gMaske = el(gBasD, 'g'), gKayis = el(gBasD, 'g');
    const gKolO = el(kutu, 'g');
    maskeKur(gMaske, hw, hh);
    // ense saçı (arkadan bakışta): topuzun altında saç enseye iner, başın arkasındaki açık oval küçülür, yalnız ince ense kalır
    C(gEnse, [[cx - hw - 4, cy + hh * 0.3], [cx - hw * 0.96, cy + hh * 0.62], [cx - hw * 0.62, cy + hh * 0.8], [cx - hw * 0.2, cy + hh * 0.86], [cx, cy + hh * 0.82],
      [cx + hw * 0.2, cy + hh * 0.86], [cx + hw * 0.62, cy + hh * 0.8], [cx + hw * 0.96, cy + hh * 0.62], [cx + hw + 4, cy + hh * 0.3], [cx, cy + hh * 0.24]],
    { kapali: true, dolgu: MONO.sac[p.sac], kalinlik: 3.6, kay: [1.5, 1.5] });
    for (const u of [-0.5, 0, 0.45]) C(gEnse, [[cx + u * hw, cy + hh * 0.36], [cx + u * hw * 0.9, cy + hh * 0.74]], { kalinlik: 2, renk: '#5f5a53', genlik: 0.4 });
    // kayış: maskeyi arkadan tutan deri bant ve tokası (yalnız arkadan bakışta)
    C(gKayis, [[cx - hw - 4, GOZ_Y - 14], [cx - hw * 0.5, GOZ_Y - 10], [cx, GOZ_Y - 9], [cx + hw * 0.5, GOZ_Y - 10], [cx + hw + 4, GOZ_Y - 14], [cx + hw + 4, GOZ_Y - 2], [cx + hw * 0.5, GOZ_Y + 2], [cx, GOZ_Y + 3], [cx - hw * 0.5, GOZ_Y + 2], [cx - hw - 4, GOZ_Y - 2]], { kapali: true, dolgu: '#5f5a53', kalinlik: 3, kay: [1, 1] });
    C(gKayis, kenarla([[cx - 9, GOZ_Y - 13], [cx + 9, GOZ_Y - 13], [cx + 9, GOZ_Y + 6], [cx - 9, GOZ_Y + 6]], 8), { kapali: true, dolgu: '#d8d2c7', kalinlik: 2.6, kay: [1, 1] });
    // Pelerin dizgeleri (kutu birimi, kaynar)
    const pelArka = (kay) => dizge(p.tohum + 401, kay).sk([[cx - 124, omuzY + 6], [cx - 230, 900], [cx + 230, 900], [cx + 124, omuzY + 6]], PEL_IC);
    // omuz yakası: boyundan omuz eklemlerinin iç yanına iner (kollar dışından çıkar); zikzak etek, iç dikiş, sıra üçgen süs
    const kapelet = (kay) => {
      const { cz, sk } = dizge(p.tohum + 411, kay);
      const etek = [];
      for (let i = 0; i <= 8; i++) etek.push([cx - 112 + i * 28, omuzY + (i % 2 ? 66 : 88)]);
      let str = sk([[cx + hw * 0.56, gY + 6], [cx + 96, omuzY + 2], [cx + 114, omuzY + 26], [cx + 116, omuzY + 76], ...etek.slice().reverse(),
        [cx - 116, omuzY + 76], [cx - 114, omuzY + 26], [cx - 96, omuzY + 2], [cx - hw * 0.56, gY + 6], [cx, gY + 28]], PEL);
      str += cz(etek.map(([ex, ey]) => [ex, ey - 16]), 1.8, '#e2ddd3', 0.9);
      for (let i = 0; i < 4; i++) { const ex = cx - 72 + i * 48, ey = omuzY + 40; str += cz([[ex - 8, ey - 5], [ex, ey + 6], [ex + 8, ey - 5]], 2.2, '#e2ddd3'); }
      return str;
    };
    const toka = (kay) => {
      const { cz, sk } = dizge(p.tohum + 421, kay, 0.6);
      const h6 = Array.from({ length: 6 }, (_, k) => { const a = (30 + k * 60) * D2R; return [cx + 16 * Math.cos(a), gY + 34 + 16 * Math.sin(a)]; });
      return sk(h6, '#d8d2c7', 3, [1.5, 1.5]) + cz([[cx, gY + 25], [cx + 7, gY + 34], [cx, gY + 43], [cx - 7, gY + 34], [cx, gY + 25]], 2);
    };
    const sirt = (kay) => {
      const { cz, sk } = dizge(p.tohum + 431, kay);
      let str = sk([[cx - hw * 0.6, gY + 4], [cx - 124, omuzY + 14], [cx - 215, 900], [cx + 215, 900], [cx + 124, omuzY + 14], [cx + hw * 0.6, gY + 4], [cx, gY + 12]], PEL_SIRT);
      for (const u of [-0.5, -0.1, 0.32]) str += cz([[cx + u * 110, omuzY + 130], [cx + u * 160, 620], [cx + u * 190, 880]], 2.4, PEL_IC, 0.8);
      return str;
    };
    const yanKontur = (kay) => { const { cz } = dizge(p.tohum + 441, kay); return [-1, 1].map((y) => cz([[cx + y * 118, omuzY + 16], [cx + y * 116, 600], [cx + y * 112, 900]])).join(''); };
    let anahtar = '', sonO = null, sonA = null;
    const F = { hw, hh, cx, cy, ceneY, omuzY };
    // kesik (önden, kollar kalkık): gövdenin yanı göğüs hattından kesilir (kol.js govdeKes), kol omuzdan çıkar. Öbür hallerde
    // ince kırpım: omuzlar pelerinin altında kalır, silüeti pelerin kurar (kostüm incelir)
    F.durum = ({ arka = false, ifade = 'notr', bakis = [0, 0], kolOn = '', kolArka = '', maske = null, kayis = false, bas = 0, sx = 1, ayna = false, dx = 0, kesik = false }) => {
      const a = `${kayIndis}|${arka}|${ifade}|${bakis}|${kesik}`;
      if (a !== anahtar) {
        anahtar = a;
        const k = kisiSVG(p, { kaynama: kayIndis, ifade, bakis, mono: true, arka });
        const G = kesik && !arka ? govdeKes(p, { id: `${id}-gk`, kaynama: kayIndis, tohum: p.tohum }) : null;
        gGovde.innerHTML = G ? G.tanim + `<g ${G.klip}>${k}</g>${G.kontur}` : `<g clip-path="url(#${id}-ince)">${k}</g>${arka ? '' : yanKontur(kayIndis)}`;
        gBas.innerHTML = k;
        gPelA.innerHTML = arka ? '' : pelArka(kayIndis);
        gPel.innerHTML = arka ? sirt(kayIndis) + kapelet(kayIndis) : kapelet(kayIndis) + toka(kayIndis);
      }
      if (kolOn !== sonO) { sonO = kolOn; gKolO.innerHTML = kolOn; }
      if (kolArka !== sonA) { sonA = kolArka; gKolA.innerHTML = kolArka; }
      gMaske.setAttribute('visibility', maske ? 'visible' : 'hidden');
      if (maske) gMaske.setAttribute('transform', `translate(0 ${f1(maske.dy)}) rotate(${f1(maske.r)} ${cx} ${cy})`);
      gKayis.setAttribute('visibility', kayis ? 'visible' : 'hidden');
      gEnse.setAttribute('visibility', arka ? 'visible' : 'hidden');
      gBasD.setAttribute('transform', `translate(${cx} ${f1(ceneY + bas)}) scale(1 ${(1 - bas * 0.007).toFixed(4)}) translate(${-cx} ${-ceneY})`);
      kutu.setAttribute('transform', `translate(${f1(x0 + dx)} ${f1(y0)}) scale(${s}) translate(${cx} 0) scale(${((ayna ? -1 : 1) * sx).toFixed(4)} 1) translate(${-cx} 0)`);
    };
    return F;
  }
  {
    // duvarda mantar pano: iğnelenmiş iki eskiz (maskenin ön çizimi, pelerin kalıbı)
    const [x0, y0, x1, y1] = B4.pano, w = x1 - x0, h = y1 - y0;
    C(L4.svg, kenarla([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 40), { kapali: true, dolgu: '#d8d2c7', kalinlik: 4, renk: '#8d867a' });
    C(L4.svg, kenarla([[x0 + w * 0.08, y0 + h * 0.1], [x0 + w * 0.52, y0 + h * 0.07], [x0 + w * 0.55, y0 + h * 0.86], [x0 + w * 0.1, y0 + h * 0.9]], 20), { kapali: true, dolgu: TON.beyaz, kalinlik: 3, kay: [2, 2] });
    const mx = x0 + w * 0.31, my = y0 + h * 0.46, r = w * 0.14;
    C(L4.svg, [[mx, my - r * 1.3], [mx + r, my - r * 0.6], [mx + r * 0.9, my + r * 0.5], [mx, my + r * 0.9], [mx - r * 0.9, my + r * 0.5], [mx - r, my - r * 0.6]], { kapali: true, kalinlik: 2.4, renk: '#6f695f' });
    for (const yon of [-1, 1]) C(L4.svg, [[mx + yon * r * 0.8, my - r * 0.2], [mx + yon * r * 0.4, my - r * 0.5], [mx, my - r * 0.25]], { kalinlik: 2, renk: '#6f695f' });
    C(L4.svg, kenarla([[x0 + w * 0.6, y0 + h * 0.16], [x0 + w * 0.92, y0 + h * 0.2], [x0 + w * 0.9, y0 + h * 0.8], [x0 + w * 0.62, y0 + h * 0.76]], 20), { kapali: true, dolgu: '#f4f1ea', kalinlik: 3, kay: [2, 2] });
    C(L4.svg, [[x0 + w * 0.68, y0 + h * 0.3], [x0 + w * 0.84, y0 + h * 0.3], [x0 + w * 0.88, y0 + h * 0.66], [x0 + w * 0.66, y0 + h * 0.64]], { kapali: true, kalinlik: 2, renk: '#8d867a' });
    for (const [px, py] of [[x0 + w * 0.3, y0 + h * 0.1], [x0 + w * 0.76, y0 + h * 0.19]]) el(L4.svg, 'circle', { cx: f1(px), cy: f1(py), r: 6, fill: '#6f695f' });
  }
  // Ayna: ahşap çerçeve (iç pah), cam; camın içinde yansıyan oda (pencere), yansıyan kişi, parlama şeritleri
  let gCam;
  {
    const A = B4.ayna;
    C(L4.svg, yDortgen(A.x0, A.y0, A.x1, A.y1, 80, 30), { kapali: true, dolgu: '#a59e91', kalinlik: 4.4, kay: [3, 3] });
    C(L4.svg, yDortgen(A.x0 + 12, A.y0 + 12, A.x1 - 12, A.y1 - 12, 70, 30), { kapali: true, kalinlik: 2, renk: '#8d867a', genlik: 0.6 });
    const cam = yDortgen(A.x0 + 30, A.y0 + 30, A.x1 - 30, A.y1 - 30, 56, 30);
    const kp = el(defs4, 'clipPath', { id: 's4b-cam' });
    el(kp, 'path', { d: dYol(cam) });
    gCam = el(L4.svg, 'g', { 'clip-path': 'url(#s4b-cam)' });
    el(gCam, 'path', { d: dYol(cam), fill: '#dbd6cd' });
    const [wx0, wy0, wx1, wy1] = B4.pencere;
    C(gCam, kenarla([[wx0, wy0], [wx1, wy0], [wx1, wy1], [wx0, wy1]], 30), { kapali: true, dolgu: '#eeeae2', kalinlik: 3, renk: '#a59e91', kay: [0, 0] });
    C(gCam, [[(wx0 + wx1) / 2, wy0], [(wx0 + wx1) / 2, wy1]], { kalinlik: 2.6, renk: '#a59e91' });
    C(gCam, [[wx0, lerp(wy0, wy1, 0.45)], [wx1, lerp(wy0, wy1, 0.45)]], { kalinlik: 2.6, renk: '#a59e91' });
    B4.cam = cam;
  }
  const YN = figur(gCam, p4, { id: 's4b-yans', ...B4.yans });
  {
    // camın parlama şeritleri (yansımanın üstünde, yarı saydam)
    const A = B4.ayna, w = A.x1 - A.x0;
    el(gCam, 'path', { d: dYol([[A.x0 + w * 0.66, A.y0], [A.x0 + w * 0.76, A.y0], [A.x0 + w * 0.3, A.y1], [A.x0 + w * 0.2, A.y1]]), fill: '#ffffff', opacity: 0.16 });
    el(gCam, 'path', { d: dYol([[A.x0 + w * 0.82, A.y0], [A.x0 + w * 0.85, A.y0], [A.x0 + w * 0.39, A.y1], [A.x0 + w * 0.36, A.y1]]), fill: '#ffffff', opacity: 0.22 });
    C(L4.svg, B4.cam, { kapali: true, kalinlik: 3, renk: '#6f695f', kay: [0, 0] });
  }
  const FG = figur(L4.svg, p4, { id: 's4b-cos', ...B4.kisi });
  // Kollar (kutu birimi): eller maskenin iki kenarını 'tutma' pozuyla kavrar (parmaklar maskenin önünde, avuç kenarın
  // dışında); dirsek göğüste aşağıdan yüzde yana ve yukarı açılır. Bırakınca eller kadrajın altına iner.
  const KAL4 = 52, EB4 = 88, o4 = omuzlar(p4, { kalinlik: KAL4 });
  const MK = (yon, dy, r) => {
    const hx = yon * (FG.hw * 1.04 - 7), hy = 6, a = r * D2R;
    return [200 + hx * Math.cos(a) - hy * Math.sin(a), FG.cy + hx * Math.sin(a) + hy * Math.cos(a) + dy];
  };
  const tut4 = (yon, dy, r, t) => {
    const elAci = (yon < 0 ? -12 : 192) + r, bs = yon < 0 ? 1 : -1;
    const bilek = bilekBul({ el: 'tutma', hedef: MK(yon, dy, r), elAci, elBoy: EB4, basparmak: bs, ad: 'tut' });
    const E0 = [200 + yon * 182, 492], E1 = [200 + yon * 244, 250];
    return { dirsek: [lerp(E0[0], E1[0], t) + yon * 42 * Math.sin(Math.PI * t), lerp(E0[1], E1[1], t)], bilek, el: 'tutma', elAci, basparmak: bs, kisalma: 1, yuz: 'sirt' };
  };
  const in4 = (yon) => ({ dirsek: [200 + yon * 176, 470], bilek: [200 + yon * 150, 650], el: 'acik', elAci: yon < 0 ? 96 : 84, basparmak: yon < 0 ? 1 : -1, kisalma: 1, yuz: 'sirt' });
  const OTUR = 34, DON0 = 54, DON1 = 68;
  const kol4 = (n, dy, r, t) => {
    const ortak = { giysi: MONO.giysi[p4.giysi], ten: MONO.ten[p4.ten], kalinlik: KAL4, kaynama: kayIndis, elBoy: EB4 };
    const u = ilerle(n, 40, 52, P2IO);
    let str = '';
    for (const yon of [-1, 1]) {
      const A = tut4(yon, dy, r, t);
      str += kolSVG({ ...ortak, omuz: yon < 0 ? o4.sol : o4.sag, taraf: yon < 0 ? 'sol' : 'sag', tohum: yon < 0 ? 81 : 82, ...(u > 0 ? karis(A, in4(yon), u) : A) });
    }
    return str;
  };
  ctx.isaret(K4 + OTUR, 'tik');
  ctx.herKare((f) => {
    if (f < K4 - 1 || f > SON + 1) return;
    const n = sinir(f - K4, 0, SON - K4);
    // maske: 6–34 göğüsten yüze kalkar, 34'te oturur (2,5 birim sekme)
    const t = ilerle(n, 6, OTUR, P2IO);
    const sek = n >= OTUR && n < OTUR + 8 ? -2.5 * Math.sin((n - OTUR) / 8 * Math.PI) : 0;
    const dy = 165 * (1 - t) + sek, r = 7 * (1 - t);
    // dönüş: yatay basılır (gövdenin derinliği kadar, %45'in altına inmez), yarı yolda önden arkaya geçer; aynaya doğru kayar
    const u = ilerle(n, DON0, DON1, KMf), arka = u >= 0.5, sx = 0.45 + 0.55 * Math.abs(Math.cos(Math.PI * u));
    const kollar = arka ? '' : kol4(n, dy, r, t);
    const bas = 7 * Math.sin(Math.PI * ilerle(n, 80, 96)) + 4 * Math.sin(Math.PI * ilerle(n, 100, 112));
    const yuz = n < 10 ? ['merak', [0, 2]] : ['kararli', [0, 0]];
    FG.durum({ arka, ifade: yuz[0], bakis: yuz[1], kolOn: kollar, maske: arka ? null : { dy, r }, kayis: arka, bas: arka ? bas : 0, sx, dx: 26 * u, kesik: true });
    YN.durum({ arka: !arka, ifade: n >= 98 ? 'mutlu' : 'kararli', bakis: [0, 0], kolArka: kollar, maske: arka ? { dy: 0, r: 0 } : null, kayis: !arka && n >= OTUR, bas: arka ? bas : 0, sx, ayna: arka, dx: -10 * u, kesik: false });
  });
  // Kamera: dönüşe dek hafif kayar; döndükten sonra (son ~50 kare) aynadaki maskeli yansımaya iter: maske kapanışta büyük
  {
    const [A, A2, B] = B4.kam.map((q) => ctx.odak(q[0], q[1], q[2]));
    ctx.kameraKoy(K4, A);
    tl.fromTo(ctx.kamera, A, { ...A2, duration: k(DON1), ease: 'none', immediateRender: false }, k(K4));
    tl.fromTo(ctx.kamera, A2, { ...B, duration: k(SON + 1 - K4 - DON1), ease: 'sine.inOut', immediateRender: false }, k(K4 + DON1));
  }
}
