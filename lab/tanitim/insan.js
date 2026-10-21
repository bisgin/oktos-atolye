// Doodle insan üreteci (tanıtım filmi, deneme): aynı çizgi dilinde, farklı demografilerde baş-omuz portreleri (SVG).
// Her kişi bir parametre nesnesidir (rastgeleKisi(tohum) ya da elle); kisiSVG(p, { kaynama }) SVG <g> içeriği döndürür.
// Çizgi dili: koyu mürekkep kontur, düz renk dolgu konturdan biraz kaymış (baskı kayması), noktalar elle çizilmiş gibi
// hafif sapmalı; "kaynama" her karede noktaları çok az oynatır (12 kare/sn'de 3 çizim döner).
// Göz çizgisi her kişide aynı yükseklikte (montajda bakış sabit kalsın diye): GOZ_Y.
// v05 kadro parçaları: sacStil 'twist' | 'orgu' | 'geri', sapka: 'kasket', kupe: 'halka', zincir, kordon, atki (+ atkiRenk),
// ifade 'ozlem' (düşünür, mutlu değil) ve 'kararli'.
// v06 genç kadro (hepsi isteğe bağlı; verilmezse çizim eskisiyle birebir aynı): yapi 'zayif' | 'orta' | 'tosun', yanak 0..1,
// boy 'kisa' | 'orta' | 'uzun' (zemin kayması boyKaymasi(p) ile sahneye), sacStil 'mohawk' | 'undercut' | 'kazik',
// sakal 'keci', piercing ['burun', 'kas', 'dudak', 'kulak'], ceket 'deri' (ceket: true blazer olarak kalır),
// sapka 'bere' (kaşların üstünde biten fitilli balıkçı bere, renk bereRenk; eski sacStil 'bere' aynen durur).
// Gövde artık BOY.boy + 420'ye iner (ortak zeminde kaydırılan kişinin alt kenarı görünmesin).
export const BOY = { en: 400, boy: 440 };
export const GOZ_Y = 178;
export const PALET = {
  murekkep: '#1d1d20',
  kagit: '#f1ede6',
  ten: ['#f4d6bf', '#eac0a0', '#d9a57f', '#bf8760', '#9c6845', '#744a33', '#553526'],
  sac: ['#1f1b1a', '#3a2a22', '#664632', '#9b6239', '#d6b46e', '#a3a29d', '#e8e4dc'],
  giysi: ['#e8c48c', '#d4621f', '#3f6c8f', '#5e7d5a', '#7a4c6d', '#33363d', '#c79f9b', '#8a9a5b'],
  basortusu: ['#7a4c6d', '#3f6c8f', '#c79f9b', '#5e7d5a', '#d9c7a7', '#33363d'],
};
// Tek renkli "fikir dünyası": sıcak griler (ten tonu çeşitliliği gri değerlerle korunur). Tam renk yalnız gerçek ürüne.
export const MONO = {
  // Renkli ten paletinin göreli parlaklığıyla eşlenmiş sıcak griler (koyu ten orta griye çekilmesin)
  ten: ['#e0dcd5', '#cdc9c2', '#b5b1aa', '#98948d', '#79756e', '#59554e', '#423e37'],
  sac: ['#2a2826', '#45413c', '#5f5a53', '#7d776e', '#a8a196', '#c2bcb1', '#e6e2da'],
  giysi: ['#e2ddd3', '#cfc9bd', '#bdb6a9', '#a59e91', '#8d867a', '#6f695f', '#d8d2c7', '#b0a99c'],
  basortusu: ['#bdb6a9', '#a59e91', '#8d867a', '#cfc9bd', '#d8d2c7', '#6f695f'],
};
// Deri ceket: mürekkepten açık, konturu okunur koyu ton
const DERI = { renk: '#2f2a28', mono: '#46423d' };

// Vücut yapısı: gövde eni, boyun eni ve yüz eni çarpanı; tosunun omzu biraz daha yuvarlak (omuz: dış omuz noktası yukarı)
export const YAPI = {
  zayif: { en: 0.82, boyun: 0.88, yuz: 0.96, omuz: 0 },
  orta: { en: 1, boyun: 1, yuz: 1, omuz: 0 },
  tosun: { en: 1.22, boyun: 1.3, yuz: 1.05, omuz: 8 },
};
// Üreteç zemini bilmez: ortak zemin çizgisinde duran kişilere sahne bu y kaymasını (kutu birimi, aşağı +) ekler
export function boyKaymasi(p) { return { kisa: 46, uzun: -46 }[p.boy] || 0; }
// Kol/sahne için gövde ölçüsü (kol.js omuzlar() şimdilik 'orta' gövdeyi varsayar: omuz x = 200 ± 160·en, y + boyunEk)
export function govdeOlcusu(p) {
  const y = YAPI[p.yapi] || YAPI.orta;
  return { en: y.en, boyun: y.boyun, boyunEk: p.boy === 'uzun' ? 8 : 0 };
}

// Tohumlu rastgele (mulberry32)
export function rng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sec = (r, dizi) => dizi[Math.floor(r() * dizi.length) % dizi.length];

// Noktalardan yumuşak yol (Catmull-Rom → kübik Bézier). Her noktaya sapma (el titremesi) + kaynama.
export function yol(pts, kapali, s) {
  const n = pts.length;
  if (n < 2) return '';
  const v = pts.map(([x, y], i) => [x + s.sap(i, 0), y + s.sap(i, 1)]);
  const P = (i) => (kapali ? v[(i + n) % n] : v[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${v[0][0].toFixed(1)} ${v[0][1].toFixed(1)}`;
  const son = kapali ? n : n - 1;
  for (let i = 0; i < son; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return kapali ? d + 'Z' : d;
}

// Elips/oval noktaları (ekran koordinatı, y aşağı). a0..a1 derece, 0 = sağ, 90 = alt.
export function oval(cx, cy, rx, ry, a0 = 0, a1 = 360, adim = 16, ust = 2.4) {
  const p = [];
  const n = Math.max(2, Math.round(adim * Math.abs(a1 - a0) / 360));
  for (let i = 0; i <= n; i++) {
    if (a1 - a0 === 360 && i === n) break;
    const t = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
    const c = Math.cos(t), sn = Math.sin(t);
    // süperelips: ust > 2 köşeli, < 2 sivri
    p.push([cx + rx * Math.sign(c) * Math.abs(c) ** (2 / ust), cy + ry * Math.sign(sn) * Math.abs(sn) ** (2 / ust)]);
  }
  return p;
}

export function rastgeleKisi(tohum, zorla = {}) {
  const r = rng(tohum * 7919 + 13);
  const kadin = r() < 0.5;
  const yas = sec(r, ['genc', 'genc', 'orta', 'orta', 'yasli']);
  const basortusu = kadin && r() < 0.22;
  const sacStil = basortusu ? 'basortusu'
    : kadin ? sec(r, ['uzun', 'bob', 'topuz', 'kivircik', 'kisa', 'uzun'])
      : sec(r, yas === 'yasli' ? ['kel', 'kisa', 'yan', 'kel'] : ['kisa', 'yan', 'kivircik', 'kisa', 'bere', 'kel']);
  const sacRenk = yas === 'yasli' ? sec(r, [5, 6, 5]) : sec(r, [0, 0, 1, 1, 2, 3, 4]);
  const p = {
    tohum, kadin, yas, sacStil,
    ten: Math.floor(r() * PALET.ten.length),
    sac: sacRenk,
    giysi: Math.floor(r() * PALET.giysi.length),
    ortu: Math.floor(r() * PALET.basortusu.length),
    yuzEn: 56 + r() * 14, yuzBoy: 72 + r() * 12, cene: r() * 0.35, ust: 2.1 + r() * 0.7,
    gozluk: r() < (yas === 'yasli' ? 0.6 : 0.25) ? sec(r, ['yuvarlak', 'kare']) : null,
    sakal: !kadin && r() < 0.4 ? sec(r, ['sakal', 'biyik', 'kirli']) : null,
    yaka: sec(r, ['bisiklet', 'v', 'gomlek', 'kapusonlu', 'balikci']),
    kupe: kadin && !basortusu && r() < 0.4,
    cil: r() < 0.18,
    isitme: r() < 0.07,
    kulaklik: false, kalem: false, yelek: false, ceket: false,
    ifade: 'notr', bakis: [0, 0],
  };
  return Object.assign(p, zorla);
}

// p: kişi parametreleri. Seçenekler: kaynama (0,1,2: aynı kişinin üç çizimi), ifade, bakis
export function kisiSVG(p, { kaynama = 0, ifade = p.ifade, bakis = p.bakis, mono = false } = {}) {
  const M = PALET.murekkep;
  const R = rng(p.tohum * 31 + 7);
  const sapmaTablosu = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6);
  const Rk = rng(p.tohum * 97 + kaynama * 1013 + 1);
  const kaynaTablosu = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let sayac = 0;
  // Her yol çağrısı kendi noktalarına sabit sapma + kareye göre kaynama alır
  const s = () => {
    const taban = (sayac++ * 37) % 400;
    return { sap: (i, k) => sapmaTablosu[(taban + i * 2 + k) % 512] + kaynaTablosu[(taban + i * 2 + k + 3) % 512] };
  };
  // Her kişide çizilen yeni parçalar (gövde uzatması) ayrı sayaçla: eski parçaların sapma sırası değişmesin
  let sayacEk = 0;
  const sEk = () => {
    const taban = (211 + sayacEk++ * 53) % 400;
    return { sap: (i, k) => sapmaTablosu[(taban + i * 2 + k) % 512] + kaynaTablosu[(taban + i * 2 + k + 3) % 512] };
  };
  const cizgi = (d, w = 4.2, renk = M) => `<path d="${d}" fill="none" stroke="${renk}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Döndürülmüş elips noktaları (twist, örgü halkası): merkez, yarıçaplar, açı (derece)
  const donOval = (x, y, rx, ry, aci, n = 10) => oval(0, 0, rx, ry, 0, 360, n).map(([u, v]) => {
    const t = aci * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
    return [x + u * c - v * sn, y + u * sn + v * c];
  });
  // Dolgu konturdan kaymış (baskı kayması)
  const dolgu = (d, renk, kay = [3, 3]) => `<path d="${d}" fill="${renk}" transform="translate(${kay[0]} ${kay[1]})"/>`;
  let sonS; // son sekil'in sapması: köşesine sonradan parça eklemek için (kose)
  const sekil = (pts, renk, w = 4.2) => { sonS = s(); const d = yol(pts, true, sonS); return dolgu(d, renk) + cizgi(d, w); };
  const kose = (pts, i) => [pts[i][0] + sonS.sap(i, 0), pts[i][1] + sonS.sap(i, 1)];
  const halka = (x, y, r, w = 2.6) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="none" stroke="${PALET.murekkep}" stroke-width="${w}"/>`;
  const boncuk = (x, y, r = 2.6) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${PALET.murekkep}"/>`;

  const Y = YAPI[p.yapi] || YAPI.orta, nb = Y.boyun;
  const cx = 200, cy = GOZ_Y + 4, hw = p.yuzEn * Y.yuz, hh = p.yuzBoy;
  const PL = mono ? MONO : PALET;
  const ten = PL.ten[p.ten], sac = PL.sac[p.sac], giysi = PL.giysi[p.giysi], ortu = PL.basortusu[p.ortu];
  const VURGU1 = mono ? MONO.giysi[0] : PALET.giysi[0], VURGU2 = mono ? MONO.giysi[4] : PALET.giysi[1];
  const ceneY = cy + hh;
  // Giysi çizgisi: uzun boyluda boyun 8 birim uzar, giysi ve omuz onunla iner (yüz yerinde kalır)
  const gY = ceneY + (p.boy === 'uzun' ? 8 : 0);
  const deri = p.ceket === 'deri', blazer = !!p.ceket && !deri;
  // Yanak: göz çizgisinin altında yüz dışa şişer (en çok ağız hizasında), çene yumuşar. yk = 0 → çarpan 1
  const yk = Math.max(0, Math.min(1, p.yanak || 0));
  const sis = (y) => { if (!yk) return 1; const z = ((y - cy) / hh - 0.42) / 0.32; return 1 + yk * 0.13 * Math.exp(-z * z); };
  const kulakKay = (sis(cy + 8) - 1) * hw; // şişen yanak kulağı örtmesin: kulak ve küpe dışa kayar
  const parca = [];

  // --- Arka katman: uzun saç / başörtüsü dökümü
  if (p.sacStil === 'uzun') parca.push(sekil([[cx - hw - 6, cy - hh * 0.6], [cx - hw - 16, cy + hh * 0.4], [cx - hw - 10, ceneY + 48], [cx - hw * 0.4, ceneY + 58], [cx + hw * 0.4, ceneY + 58], [cx + hw + 10, ceneY + 48], [cx + hw + 16, cy + hh * 0.4], [cx + hw + 6, cy - hh * 0.6], [cx, cy - hh - 10]], sac));
  if (p.sacStil === 'bob') parca.push(sekil([[cx - hw - 8, cy - hh * 0.5], [cx - hw - 14, cy + hh * 0.35], [cx - hw - 4, ceneY - 6], [cx - hw * 0.5, ceneY + 4], [cx + hw * 0.5, ceneY + 4], [cx + hw + 4, ceneY - 6], [cx + hw + 14, cy + hh * 0.35], [cx + hw + 8, cy - hh * 0.5], [cx, cy - hh - 12]], sac));

  // --- Gövde ve yaka. Yapı: omuz/gövde x uzaklıkları Y.en ile, boyun Y.boyun (nb) ile ölçeklenir; tosunun dış omzu yukarıda
  const omuzY = gY + 40, E = Y.en;
  const govde = [[cx - hw * 0.5 * nb, gY + 14], [cx - 118 * E, omuzY + 14 - Y.omuz * 0.5], [cx - 162 * E, omuzY + 52 - Y.omuz], [cx - 176 * E, BOY.boy + 170], [cx + 176 * E, BOY.boy + 170], [cx + 162 * E, omuzY + 52 - Y.omuz], [cx + 118 * E, omuzY + 14 - Y.omuz * 0.5], [cx + hw * 0.5 * nb, gY + 14]];
  // Boyun önce, gövde üstüne biner
  parca.push(sekil([[cx - hw * 0.38 * nb, ceneY - 18], [cx - hw * 0.42 * nb, gY + 22], [cx + hw * 0.42 * nb, gY + 22], [cx + hw * 0.38 * nb, ceneY - 18]], ten));
  const govdeRenk = deri ? (mono ? DERI.mono : DERI.renk) : giysi;
  parca.push(sekil(govde, govdeRenk));
  // Uzatma: alt köşelerden BOY.boy + 420'ye düz iner; dolgu alt konturu (köşelerin altında) örter, görünür kutu değişmez
  const altY = BOY.boy + 420;
  // (data-uzatma: sahne ya da test bu parçaları ayırt edebilsin)
  const u = (str) => str.replace('<path ', '<path data-uzatma="1" ');
  const uzat = ([lx, ly], [rx, ry], renk) => {
    parca.push(u(dolgu(`M${lx.toFixed(1)} ${(ly - 8).toFixed(1)}L${(lx - 2).toFixed(1)} ${altY}L${(rx + 2).toFixed(1)} ${altY}L${rx.toFixed(1)} ${(ry - 8).toFixed(1)}Z`, renk)));
    parca.push(u(cizgi(yol([[lx, ly], [lx - 1, (ly + altY) / 2], [lx - 2, altY]], false, sEk()))));
    parca.push(u(cizgi(yol([[rx, ry], [rx + 1, (ry + altY) / 2], [rx + 2, altY]], false, sEk()))));
  };
  uzat(kose(govde, 3), kose(govde, 4), govdeRenk);
  const yaka = p.yaka;
  // Deri ceketin açık V'sinden görünen tişört (yaka çizgisi bunun üstüne çizilir)
  if (deri) parca.push(sekil([[cx - 42 * nb, gY + 8], [cx + 42 * nb, gY + 8], [cx + 16, gY + 138], [cx - 16, gY + 138]], giysi));
  if (yaka === 'v') parca.push(cizgi(yol([[cx - hw * 0.45, gY + 16], [cx, gY + 58], [cx + hw * 0.45, gY + 16]], false, s())));
  if (yaka === 'bisiklet') parca.push(cizgi(yol([[cx - hw * 0.55, gY + 14], [cx, gY + 32], [cx + hw * 0.55, gY + 14]], false, s())));
  if (yaka === 'balikci') parca.push(sekil([[cx - hw * 0.5, gY + 2], [cx - hw * 0.56, gY + 30], [cx, gY + 38], [cx + hw * 0.56, gY + 30], [cx + hw * 0.5, gY + 2]], giysi));
  if (yaka === 'gomlek' || blazer) {
    parca.push(sekil([[cx - hw * 0.5, gY + 8], [cx - hw * 0.72, gY + 34], [cx - 6, gY + 46], [cx - hw * 0.2, gY + 18]], '#f4f1ea'));
    parca.push(sekil([[cx + hw * 0.5, gY + 8], [cx + hw * 0.72, gY + 34], [cx + 6, gY + 46], [cx + hw * 0.2, gY + 18]], '#f4f1ea'));
  }
  if (blazer) {
    // Blazer yakaları ve düğme (yaka çizgileri uzatmada da sürer)
    parca.push(cizgi(yol([[cx - hw * 0.62, gY + 28], [cx - 34, gY + 104], [cx - 8, BOY.boy + 170]], false, s())));
    parca.push(cizgi(yol([[cx + hw * 0.62, gY + 28], [cx + 34, gY + 104], [cx + 8, BOY.boy + 170]], false, s())));
    parca.push(`<circle cx="${cx + 4}" cy="${gY + 128}" r="4.5" fill="${M}"/>`);
    for (const yon of [-1, 1]) parca.push(u(cizgi(yol([[cx + yon * 8, BOY.boy + 166], [cx + yon * 9, altY]], false, sEk()))));
  }
  if (yaka === 'kapusonlu') {
    parca.push(cizgi(yol([[cx - 88 * nb, omuzY + 6], [cx - 40 * nb, gY + 26], [cx, gY + 34], [cx + 40 * nb, gY + 26], [cx + 88 * nb, omuzY + 6]], false, s())));
    parca.push(cizgi(yol([[cx - 16, gY + 34], [cx - 20, gY + 82]], false, s()), 3.4));
    parca.push(cizgi(yol([[cx + 16, gY + 34], [cx + 20, gY + 82]], false, s()), 3.4));
  }
  if (deri) {
    // Deri ceket: geniş sivri yakalar (uçlarında trok), V'nin dibinden inen fermuar, göğüste rozet, omuzlarda parlama
    for (const yon of [-1, 1]) {
      parca.push(sekil([[cx + yon * 30 * nb, gY + 4], [cx + yon * 104 * E, gY + 32], [cx + yon * 90 * E, gY + 92], [cx + yon * 64 * E, gY + 80], [cx + yon * 10, gY + 142], [cx + yon * 26 * nb, gY + 62]], mono ? DERI.mono : DERI.renk));
      for (const [x, y] of [[86, 80], [92, 40]]) parca.push(`<circle cx="${(cx + yon * x * E).toFixed(1)}" cy="${gY + y}" r="3.4" fill="${VURGU1}" stroke="${M}" stroke-width="2.2"/>`);
      parca.push(cizgi(yol([[cx + yon * 138 * E, omuzY + 30 - Y.omuz * 0.6], [cx + yon * 112 * E, omuzY + 16 - Y.omuz * 0.4]], false, s()), 3.2, mono ? '#8d867a' : '#6b625c'));
    }
    const fer = [[cx + 4, gY + 140], [cx + 12, gY + 250], [cx + 16, altY]];
    parca.push(`<path d="${yol(fer, false, s())}" fill="none" stroke="${M}" stroke-width="7" stroke-dasharray="1.6 4.4"/>`);
    parca.push(sekil([[cx + 1, gY + 146], [cx + 11, gY + 146], [cx + 12, gY + 166], [cx + 2, gY + 166]], VURGU1, 2.6));
    parca.push(sekil(oval(cx - 122 * E, gY + 126, 11, 11, 0, 360, 10), VURGU1, 3));
    parca.push(halka(cx - 122 * E, gY + 126, 4.5, 2.2));
  }
  if (p.yelek) {
    const yE = (x) => x * E; // yelek gövdeyle genişler
    const YL = [[cx - yE(150), omuzY + 40], [cx - 70, gY + 30], [cx - 30, BOY.boy + 170], [cx - yE(168), BOY.boy + 170]];
    const YR = [[cx + yE(150), omuzY + 40], [cx + 70, gY + 30], [cx + 30, BOY.boy + 170], [cx + yE(168), BOY.boy + 170]];
    parca.push(sekil(YL, VURGU2)); const yl = [kose(YL, 3), kose(YL, 2)];
    parca.push(sekil(YR, VURGU2)); const yr = [kose(YR, 2), kose(YR, 3)];
    parca.push(cizgi(yol([[cx - yE(140), omuzY + 92], [cx - 52, omuzY + 92]], false, s()), 6, '#f1ede6'));
    parca.push(cizgi(yol([[cx + 52, omuzY + 92], [cx + yE(140), omuzY + 92]], false, s()), 6, '#f1ede6'));
    uzat(yl[0], yl[1], VURGU2); uzat(yr[0], yr[1], VURGU2);
  }

  // Boyun takıları (v05 kadrosu): okul kartı kordonu, ucu boş zincir, atkı
  if (p.kordon) {
    for (const yon of [-1, 1]) parca.push(cizgi(yol([[cx + yon * hw * 0.48, gY + 16], [cx + yon * 26, gY + 92], [cx + yon * 9, gY + 140]], false, s()), 3.2));
    parca.push(sekil([[cx - 24, gY + 138], [cx + 24, gY + 138], [cx + 25, gY + 196], [cx - 23, gY + 197]], '#f4f1ea', 3.4));
    parca.push(sekil([[cx - 14, gY + 150], [cx - 1, gY + 150], [cx - 1, gY + 168], [cx - 14, gY + 168]], PL.giysi[2], 2.4));
    parca.push(cizgi(yol([[cx + 4, gY + 154], [cx + 16, gY + 154]], false, s()), 2.4));
    parca.push(cizgi(yol([[cx + 4, gY + 163], [cx + 13, gY + 163]], false, s()), 2.4));
  }
  if (p.zincir) {
    parca.push(`<path d="${yol([[cx - hw * 0.62, gY + 14], [cx - hw * 0.34, gY + 52], [cx, gY + 64], [cx + hw * 0.34, gY + 52], [cx + hw * 0.62, gY + 14]], false, s())}" fill="none" stroke="${M}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="1 7"/>`);
    parca.push(`<circle cx="${cx}" cy="${gY + 72}" r="6.5" fill="none" stroke="${M}" stroke-width="3"/>`);
  }
  if (p.atki) {
    const ak = PL.giysi[p.atkiRenk ?? 1];
    parca.push(sekil([[cx + hw * 0.18, gY + 26], [cx + hw * 0.62, gY + 30], [cx + hw * 0.7, gY + 150], [cx + hw * 0.24, gY + 156]], ak, 3.8));
    for (let i = 0; i < 4; i++) parca.push(cizgi(yol([[cx + hw * (0.26 + i * 0.13), gY + 154 - i], [cx + hw * (0.26 + i * 0.13), gY + 170 - i]], false, s()), 2.6));
    parca.push(sekil([[cx - hw * 0.72, gY - 4], [cx - hw * 0.2, gY + 10], [cx + hw * 0.2, gY + 10], [cx + hw * 0.72, gY - 4], [cx + hw * 0.82, gY + 26], [cx + hw * 0.3, gY + 42], [cx - hw * 0.3, gY + 42], [cx - hw * 0.82, gY + 26]], ak, 3.8));
    parca.push(cizgi(yol([[cx - hw * 0.4, gY + 14], [cx - hw * 0.46, gY + 34]], false, s()), 2.4));
    parca.push(cizgi(yol([[cx + hw * 0.1, gY + 16], [cx + hw * 0.06, gY + 38]], false, s()), 2.4));
  }

  // Başörtüsü boynu ve göğsü örter: gövdenin önünde, yüzün arkasında
  if (p.sacStil === 'basortusu') parca.push(sekil([[cx, cy - hh - 22], [cx + hw + 24, cy - hh * 0.55], [cx + hw + 30, cy + hh * 0.3], [cx + hw + 44, ceneY + 44], [cx + 124, ceneY + 96], [cx, ceneY + 110], [cx - 124, ceneY + 96], [cx - hw - 44, ceneY + 44], [cx - hw - 30, cy + hh * 0.3], [cx - hw - 24, cy - hh * 0.55]], ortu));

  // İki yandan örgü: kulak arkasından omuzun önüne sarkan halkalar (yüz üst ucunu örter)
  if (p.sacStil === 'orgu') for (const yon of [-1, 1]) {
    for (let i = 0; i < 6; i++) parca.push(sekil(donOval(cx + yon * (hw + 10 + i * 3), cy + 6 + i * 21, 14 - i * 0.6, 13, yon * (20 - i * 2)), sac, 3.6));
    parca.push(sekil(donOval(cx + yon * (hw + 28), cy + 132, 7, 6, 0, 8), PL.giysi[1], 3));
  }

  // --- Kulaklar
  if (p.sacStil !== 'basortusu') {
    for (const yon of [-1, 1]) parca.push(sekil([[cx + yon * (hw + kulakKay - 4), cy - 10], [cx + yon * (hw + kulakKay + 12), cy - 8], [cx + yon * (hw + kulakKay + 14), cy + 10], [cx + yon * (hw + kulakKay + 4), cy + 22]], ten, 3.6));
  }
  if (p.isitme) parca.push(sekil([[cx + hw + kulakKay + 8, cy - 14], [cx + hw + kulakKay + 18, cy - 10], [cx + hw + kulakKay + 16, cy + 6]], '#c9c4bb', 3));
  if (p.kupe === 'halka') for (const yon of [-1, 1]) parca.push(`<circle cx="${cx + yon * (hw + kulakKay + 9)}" cy="${cy + 42}" r="15" fill="none" stroke="${M}" stroke-width="3.6"/>`);
  else if (p.kupe) for (const yon of [-1, 1]) parca.push(`<circle cx="${cx + yon * (hw + kulakKay + 8)}" cy="${cy + 30}" r="5" fill="${VURGU1}" stroke="${M}" stroke-width="3"/>`);
  // Kulak kepçesi boyunca küçük halkalar + lob taşı (tek kulak, ekranın solu); saç kulağı örterse onları da örter
  const pc = p.piercing || [];
  if (pc.includes('kulak') && p.sacStil !== 'basortusu') {
    const kx = cx - hw - kulakKay;
    parca.push(halka(kx - 13, cy - 3, 3.6), halka(kx - 14.5, cy + 7, 3.6), boncuk(kx - 8, cy + 18, 2.6));
  }

  // --- Yüz (yanak: alt yüz şişer, çene daralması yumuşar)
  const ceneK = p.cene * (1 - 0.6 * yk);
  const yuz = oval(cx, cy - 6, hw, hh, 0, 360, 22, p.ust).map(([x, y]) => {
    const alt = Math.max(0, (y - cy) / hh); // çene daralması
    return [cx + (x - cx) * (1 - ceneK * alt * alt) * sis(y), y];
  });
  parca.push(sekil(yuz, ten));

  // --- Saç (ön) ve başlıklar
  const tepe = cy - 6 - hh;
  const tel = (a, b, c) => parca.push(cizgi(yol([a, b, c], false, s()), 2.4));
  if (p.sacStil === 'kisa' || p.sacStil === 'uzun' || p.sacStil === 'bob') {
    parca.push(sekil([[cx - hw - 4, cy - 2], [cx - hw - 8, cy - hh * 0.55], [cx - hw * 0.55, tepe - 12], [cx + hw * 0.3, tepe - 14], [cx + hw + 8, cy - hh * 0.55], [cx + hw + 4, cy - 2], [cx + hw - 6, cy - hh * 0.42], [cx + hw * 0.2, cy - hh * 0.62], [cx - hw * 0.3, cy - hh * 0.5], [cx - hw + 6, cy - hh * 0.38]], sac));
  }
  if (p.sacStil === 'yan') {
    parca.push(sekil([[cx - hw - 4, cy - 4], [cx - hw - 6, cy - hh * 0.6], [cx - hw * 0.3, tepe - 16], [cx + hw * 0.6, tepe - 8], [cx + hw + 8, cy - hh * 0.5], [cx + hw + 4, cy - 6], [cx + hw - 8, cy - hh * 0.5], [cx - hw * 0.1, cy - hh * 0.72], [cx - hw * 0.6, cy - hh * 0.36]], sac));
  }
  if (p.sacStil === 'topuz') {
    parca.push(sekil(oval(cx + 4, tepe - 22, 30, 24, 0, 360, 12), sac));
    parca.push(sekil([[cx - hw - 4, cy - 2], [cx - hw - 6, cy - hh * 0.6], [cx - hw * 0.4, tepe - 8], [cx + hw * 0.4, tepe - 8], [cx + hw + 6, cy - hh * 0.6], [cx + hw + 4, cy - 2], [cx + hw - 8, cy - hh * 0.46], [cx, cy - hh * 0.66], [cx - hw + 8, cy - hh * 0.46]], sac));
  }
  if (p.sacStil === 'kivircik') {
    const k = [];
    for (let i = 0; i <= 20; i++) {
      const a = (172 + i * 196 / 20) * Math.PI / 180, rr = (i % 2 ? 1.0 : 1.12);
      k.push([cx + (hw + 26) * rr * Math.cos(a), cy - hh * 0.25 + (hh + 18) * rr * Math.sin(a)]);
    }
    k.push([cx + hw - 6, cy - hh * 0.3], [cx + hw * 0.3, cy - hh * 0.56], [cx - hw * 0.3, cy - hh * 0.5], [cx - hw + 6, cy - hh * 0.3]);
    parca.push(sekil(k, sac));
  }
  if (p.sacStil === 'kel') {
    for (const yon of [-1, 1]) parca.push(sekil([[cx + yon * (hw + 2), cy - hh * 0.35], [cx + yon * (hw + 10), cy - hh * 0.1], [cx + yon * (hw + 4), cy + 6], [cx + yon * (hw - 6), cy - hh * 0.2]], sac, 3.4));
    if (!p.sapka) parca.push(cizgi(yol([[cx - 20, tepe + 22], [cx - 6, tepe + 16]], false, s()), 2.6));
  }
  if (p.sacStil === 'twist') {
    // Kısa twist: sıkı taban + başın tepesinde dışa bakan küçük kıvrık tutamlar
    parca.push(sekil([[cx - hw - 4, cy - hh * 0.2], [cx - hw - 6, cy - hh * 0.62], [cx - hw * 0.5, tepe - 6], [cx + hw * 0.5, tepe - 6], [cx + hw + 6, cy - hh * 0.62], [cx + hw + 4, cy - hh * 0.2], [cx + hw - 8, cy - hh * 0.48], [cx, cy - hh * 0.6], [cx - hw + 8, cy - hh * 0.48]], sac));
    for (let i = 0; i <= 8; i++) {
      const a = (196 + i * 148 / 8) * Math.PI / 180;
      const x = cx + (hw + 4) * Math.cos(a), y = cy - hh * 0.2 + (hh + 6) * Math.sin(a);
      parca.push(sekil(donOval(x, y, 8, 17, (a * 180 / Math.PI) + 90), sac, 3.2));
    }
  }
  if (p.sacStil === 'orgu') {
    // Ortadan ayrılmış düz saç; örgüler kulak arkasından iner (yukarıda)
    parca.push(sekil([[cx - hw - 6, cy - 2], [cx - hw - 8, cy - hh * 0.6], [cx - hw * 0.4, tepe - 10], [cx + hw * 0.4, tepe - 10], [cx + hw + 8, cy - hh * 0.6], [cx + hw + 6, cy - 2], [cx + hw - 6, cy - hh * 0.44], [cx + 4, cy - hh * 0.7], [cx - 4, cy - hh * 0.7], [cx - hw + 6, cy - hh * 0.44]], sac));
    parca.push(cizgi(yol([[cx, tepe - 8], [cx + 2, cy - hh * 0.7]], false, s()), 2.6));
  }
  if (p.sacStil === 'geri') {
    // Geriye taranmış saç: yüksek alın çizgisi, tepeye doğru geriye kıvrılan tarak izleri
    parca.push(sekil([[cx - hw - 2, cy - hh * 0.25], [cx - hw - 6, cy - hh * 0.72], [cx - hw * 0.45, tepe - 18], [cx + hw * 0.45, tepe - 18], [cx + hw + 6, cy - hh * 0.72], [cx + hw + 2, cy - hh * 0.25], [cx + hw - 6, cy - hh * 0.58], [cx + hw * 0.3, cy - hh * 0.8], [cx - hw * 0.3, cy - hh * 0.8], [cx - hw + 6, cy - hh * 0.58]], sac));
    for (const u of [-0.5, -0.15, 0.2, 0.52]) parca.push(cizgi(yol([[cx + hw * u, cy - hh * 0.82], [cx + hw * u * 0.9, tepe - 4], [cx + hw * u * 0.7, tepe - 14]], false, s()), 2.4));
  }
  if (p.sacStil === 'bere') {
    parca.push(sekil([[cx - hw - 10, cy - hh * 0.3], [cx - hw - 8, cy - hh * 0.75], [cx - hw * 0.4, tepe - 26], [cx + hw * 0.4, tepe - 26], [cx + hw + 8, cy - hh * 0.75], [cx + hw + 10, cy - hh * 0.3]], giysi === PL.giysi[1] ? PL.giysi[2] : PL.giysi[1]));
    parca.push(cizgi(yol([[cx - hw - 9, cy - hh * 0.5], [cx, cy - hh * 0.6], [cx + hw + 9, cy - hh * 0.5]], false, s())));
  }
  if (p.sacStil === 'basortusu') {
    // Yüzü çevreleyen ön bant
    parca.push(sekil([[cx - hw - 8, cy + hh * 0.2], [cx - hw - 10, cy - hh * 0.5], [cx - hw * 0.45, tepe - 14], [cx + hw * 0.45, tepe - 14], [cx + hw + 10, cy - hh * 0.5], [cx + hw + 8, cy + hh * 0.2], [cx + hw - 4, cy - hh * 0.4], [cx, cy - hh * 0.62], [cx - hw + 4, cy - hh * 0.4]], ortu));
    parca.push(cizgi(yol([[cx - hw - 6, cy + hh * 0.3], [cx - hw * 0.6, ceneY + 6], [cx, ceneY + 14], [cx + hw * 0.6, ceneY + 6], [cx + hw + 6, cy + hh * 0.3]], false, s()), 3.4));
  }
  // Kazınmış kafa derisi (mohawk, undercut, kazık): saç çizgisinin üstü saç renginde ton + kıl noktaları.
  // Saç çizgisi alnın ortasında cy − 0,6·hh, şakaklarda cy − 0,27·hh. Kazık (asker tıraşı) koyu ton, ince açık noktalı;
  // mohawk/undercut yanları açık ton, mürekkep noktalı (koyu tende açık nokta).
  if (['mohawk', 'undercut', 'kazik'].includes(p.sacStil)) {
    const kazik = p.sacStil === 'kazik';
    const hat = (x) => cy - hh * 0.6 + ((x - cx) / hw) ** 2 * hh * 0.38;
    const ici = (x, y) => (Math.abs(x - cx) / (hw - 5)) ** p.ust + (Math.abs(y - cy + 6) / (hh - 5)) ** p.ust < 1;
    const ton = [...oval(cx, cy - 6, hw - 2.5, hh - 2.5, 188, 352, 16, p.ust)];
    for (let i = 0; i <= 10; i++) { const x = cx + hw * 0.93 * (1 - i / 5); ton.push([x, Math.min(hat(x), cy - hh * 0.2)]); }
    parca.push(`<path d="${yol(ton, true, s())}" fill="${sac}" opacity="${kazik ? 0.72 : 0.24}"/>`);
    const Rn = rng(p.tohum * 53 + 11), acik = kazik ? p.sac < 4 : p.ten >= 4;
    const ara = kazik ? 11 : 9;
    for (let y = cy - 6 - hh + 9, j = 0; y < cy - hh * 0.2; y += ara - 0.5, j++) {
      for (let x = cx - hw + (j % 2) * ara / 2; x < cx + hw; x += ara) {
        const nx = x + (Rn() - 0.5) * 4, ny = y + (Rn() - 0.5) * 4;
        if (!ici(nx, ny) || ny > hat(nx) - 3) continue;
        if (p.sacStil === 'mohawk' && Math.abs(nx - cx) < hw * 0.36) continue;
        parca.push(`<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${kazik ? 1.2 : 1.4}" fill="${acik ? '#e6e2da' : M}" opacity="${kazik ? 0.3 : acik ? 0.5 : 0.45}"/>`);
      }
    }
  }
  if (p.sacStil === 'mohawk') {
    // Ortada ibik: alındaki saç çizgisinden tepeye şerit, tepede üç sivri tutam
    const t = tepe;
    parca.push(sekil([[cx - hw * 0.22, cy - hh * 0.6], [cx - hw * 0.3, cy - hh * 0.86], [cx - hw * 0.34, t - 12], [cx - hw * 0.36, t - 34], [cx - hw * 0.3, t - 62], [cx - hw * 0.12, t - 46], [cx, t - 82], [cx + hw * 0.1, t - 48], [cx + hw * 0.3, t - 66], [cx + hw * 0.36, t - 34], [cx + hw * 0.34, t - 12], [cx + hw * 0.3, cy - hh * 0.86], [cx + hw * 0.22, cy - hh * 0.6], [cx, cy - hh * 0.65]], sac));
    tel([cx - hw * 0.12, cy - hh * 0.72], [cx - hw * 0.18, t - 12], [cx - hw * 0.24, t - 44]);
    tel([cx + hw * 0.1, cy - hh * 0.74], [cx + hw * 0.12, t - 16], [cx + hw * 0.04, t - 56]);
  }
  if (p.sacStil === 'undercut') {
    // Yanlar kazınmış (sol şakak açıkta); üstte kabarık saç sağa taranır, sivri perçemi sağ şakağa düşer, kaşın üstünde biter
    parca.push(sekil([[cx - hw * 0.62, cy - hh * 0.64], [cx - hw * 0.72, cy - hh * 0.92], [cx - hw * 0.5, tepe - 18], [cx - hw * 0.08, tepe - 32], [cx + hw * 0.45, tepe - 22], [cx + hw * 0.86, tepe], [cx + hw + 4, cy - hh * 0.62], [cx + hw * 0.94, cy - hh * 0.36], [cx + hw * 0.74, cy - hh * 0.52], [cx + hw * 0.56, cy - hh * 0.45], [cx + hw * 0.36, cy - hh * 0.6], [cx + hw * 0.08, cy - hh * 0.6], [cx - hw * 0.25, cy - hh * 0.7]], sac));
    tel([cx - hw * 0.45, cy - hh * 0.76], [cx, tepe - 16], [cx + hw * 0.62, tepe - 4]);
    tel([cx - hw * 0.2, cy - hh * 0.72], [cx + hw * 0.3, cy - hh * 0.88], [cx + hw * 0.82, cy - hh * 0.56]);
    tel([cx - hw * 0.5, cy - hh * 0.66], [cx - hw * 0.56, cy - hh * 0.86], [cx - hw * 0.48, tepe - 12]); // ayrım: kazınmış yanla uzun üst arasındaki kenar
  }

  // Saç teli dokusu (dolgu kask gibi durmasın; tel() yukarıda tanımlı)
  if (['kisa', 'uzun', 'bob', 'topuz'].includes(p.sacStil)) {
    tel([cx - hw * 0.15, tepe - 8], [cx - hw * 0.38, tepe + 4], [cx - hw * 0.52, cy - hh * 0.5]);
    tel([cx + hw * 0.35, tepe - 6], [cx + hw * 0.32, tepe + 8], [cx + hw * 0.18, cy - hh * 0.6]);
  }
  if (p.sacStil === 'yan') {
    tel([cx + hw * 0.5, tepe - 2], [cx + hw * 0.1, tepe + 6], [cx - hw * 0.25, cy - hh * 0.62]);
    tel([cx + hw * 0.8, cy - hh * 0.62], [cx + hw * 0.55, cy - hh * 0.66], [cx + hw * 0.3, cy - hh * 0.7]);
  }
  if (p.sacStil === 'uzun' || p.sacStil === 'bob') for (const yon of [-1, 1]) tel([cx + yon * (hw + 4), cy - hh * 0.2], [cx + yon * (hw + 8), cy + hh * 0.3], [cx + yon * (hw + 6), ceneY - (p.sacStil === 'bob' ? 14 : -20)]);

  // Kasket: yassı tepe, alnın üstünde öne bakan siper bandı, tepede düğme
  if (p.sapka === 'kasket') {
    const ks = giysi === PL.giysi[4] ? PL.giysi[2] : PL.giysi[4];
    parca.push(sekil([[cx - hw - 10, cy - hh * 0.56], [cx - hw - 8, cy - hh * 0.92], [cx - hw * 0.3, tepe - 24], [cx + hw * 0.55, tepe - 20], [cx + hw + 12, cy - hh * 0.88], [cx + hw + 12, cy - hh * 0.56]], ks));
    parca.push(sekil([[cx - hw - 12, cy - hh * 0.62], [cx + hw + 14, cy - hh * 0.62], [cx + hw * 0.82, cy - hh * 0.44], [cx - hw * 0.8, cy - hh * 0.44]], ks));
    parca.push(cizgi(yol([[cx - hw * 0.6, cy - hh * 0.66], [cx, tepe - 18]], false, s()), 2.4));
    parca.push(`<circle cx="${cx - 4}" cy="${tepe - 24}" r="5" fill="${M}"/>`);
  }
  // Balıkçı bere (genç kadro): başı saran taç + kıvrık, fitilli manşet; kaşların epey üstünde biter. Renk bereRenk (giysi
  // dizini, varsayılan koyu). Eski sacStil 'bere' olduğu gibi kalır.
  if (p.sapka === 'bere') {
    const br = PL.giysi[p.bereRenk ?? 5];
    parca.push(sekil([[cx - hw - 7, cy - hh * 0.6], [cx - hw - 4, cy - hh * 0.92], [cx - hw * 0.45, tepe - 16], [cx + hw * 0.1, tepe - 22], [cx + hw * 0.55, tepe - 14], [cx + hw + 4, cy - hh * 0.92], [cx + hw + 7, cy - hh * 0.6]], br));
    parca.push(sekil([[cx - hw - 9, cy - hh * 0.8], [cx, cy - hh * 0.86], [cx + hw + 9, cy - hh * 0.8], [cx + hw + 8, cy - hh * 0.46], [cx, cy - hh * 0.5], [cx - hw - 8, cy - hh * 0.46]], br));
    for (let i = -3; i <= 3; i++) {
      const x = cx + i * hw * 0.28, e = (i * 0.28) ** 2;
      parca.push(cizgi(yol([[x, cy - hh * (0.8 - 0.06 * e)], [x, cy - hh * (0.54 - 0.04 * e)]], false, s()), 2.2));
    }
  }

  // --- Yaş izleri, çil
  if (p.yas === 'yasli') {
    for (const yon of [-1, 1]) parca.push(cizgi(yol([[cx + yon * hw * 0.62, cy - 4], [cx + yon * hw * 0.78, cy + 2]], false, s()), 2.4));
    parca.push(cizgi(yol([[cx - 18, cy - hh * 0.42], [cx + 16, cy - hh * 0.44]], false, s()), 2.2));
  }
  if (p.cil) for (const yon of [-1, 1]) for (let i = 0; i < 3; i++) parca.push(`<circle cx="${cx + yon * (hw * 0.42 + i * 7)}" cy="${cy + 16 + (i % 2) * 5}" r="1.8" fill="${mono ? '#7d776e' : '#9c6845'}"/>`);
  // Allık
  for (const yon of [-1, 1]) parca.push(`<ellipse cx="${cx + yon * hw * 0.55 * sis(cy + 22)}" cy="${cy + 22}" rx="${12 + yk * 5}" ry="${7 + yk * 2}" fill="${mono ? '#000' : '#e46a4f'}" opacity="${mono ? 0.05 : 0.18}"/>`);

  // --- Gözler, kaşlar, burun, ağız (ifadeye göre)
  const [bx, by] = bakis;
  const gozX = hw * 0.38;
  const kas = { notr: [0, 0], merak: [-5, 3], kizgin: [4, -6], sikkin: [3, 4], mutlu: [-3, 0], saskin: [-8, 0], kisik: [3, -2], ozlem: [-8, 2], kararli: [4, -1] }[ifade] || [0, 0];
  for (const yon of [-1, 1]) {
    const gx = cx + yon * gozX;
    if (ifade === 'mutlu') parca.push(cizgi(yol([[gx - 7, GOZ_Y + 2], [gx, GOZ_Y - 4], [gx + 7, GOZ_Y + 2]], false, s()), 3.6));
    else if (ifade === 'kirp') parca.push(cizgi(yol([[gx - 7, GOZ_Y + 1], [gx, GOZ_Y + 3], [gx + 7, GOZ_Y + 1]], false, s()), 3.6));
    else if (ifade === 'kisik') { parca.push(cizgi(yol([[gx - 8, GOZ_Y - 1], [gx, GOZ_Y - 3], [gx + 8, GOZ_Y - 1]], false, s()), 3.6)); parca.push(`<ellipse cx="${(gx + bx * 3).toFixed(1)}" cy="${(GOZ_Y + 1).toFixed(1)}" rx="4.2" ry="2.4" fill="${M}"/>`); }
    else parca.push(`<ellipse cx="${(gx + bx * 3).toFixed(1)}" cy="${(GOZ_Y + by * 2).toFixed(1)}" rx="4.6" ry="${ifade === 'saskin' ? 6.2 : 5.2}" fill="${M}"/>`);
    if (ifade === 'sikkin') parca.push(cizgi(yol([[gx - 9, GOZ_Y - 3], [gx + 9, GOZ_Y - 3]], false, s()), 3.2));
    // Kaş: iç uç (merkeze yakın) kas[1] ile, dış uç kas[0] ile oynar
    const ic = gx - yon * 10, dis = gx + yon * 10;
    parca.push(cizgi(yol([[ic, GOZ_Y - 20 + kas[0]], [gx, GOZ_Y - 24 + kas[0] * 0.5 - (ifade === 'saskin' ? 4 : 0)], [dis, GOZ_Y - 20 + (yon > 0 ? kas[1] : kas[1])]], false, s()), 3.8, p.sacStil === 'basortusu' || p.sac >= 5 ? M : M));
  }
  if (p.gozluk) {
    const gr = 16;
    for (const yon of [-1, 1]) {
      const gx = cx + yon * gozX;
      parca.push(cizgi(p.gozluk === 'yuvarlak' ? yol(oval(gx, GOZ_Y, gr, gr - 1, 0, 360, 14), true, s()) : yol(oval(gx, GOZ_Y, gr + 2, gr - 3, 0, 360, 14, 3.6), true, s()), 3.4));
    }
    parca.push(cizgi(yol([[cx - gozX + gr, GOZ_Y - 2], [cx, GOZ_Y - 5], [cx + gozX - gr, GOZ_Y - 2]], false, s()), 3.2));
  }
  parca.push(cizgi(yol([[cx + 2, GOZ_Y + 6], [cx + 8, GOZ_Y + 26], [cx - 4, GOZ_Y + 30]], false, s()), 3.6));
  const ay = cy + hh * 0.52;
  const sakalR = sac === PALET.sac[6] ? '#d8d4cb' : sac;
  const sisle = (pts) => (yk ? pts.map(([x, y]) => [cx + (x - cx) * sis(y), y]) : pts); // sakal şişen yanağı izler
  if (p.sakal === 'sakal') parca.push(sekil(sisle([[cx - hw + 2, cy + 6], [cx - hw * 0.8, ceneY - 18], [cx - hw * 0.3, ceneY + 6], [cx + hw * 0.3, ceneY + 6], [cx + hw * 0.8, ceneY - 18], [cx + hw - 2, cy + 6], [cx + hw * 0.5, ay - 6], [cx, ay - 12], [cx - hw * 0.5, ay - 6]]), sakalR));
  // Keçi sakalı: alt dudağın altından çenenin biraz altına inen tutam + bıyık
  if (p.sakal === 'keci') parca.push(sekil([[cx - 17, ay + 14], [cx - 15, ceneY - 6], [cx, ceneY + 8], [cx + 15, ceneY - 6], [cx + 17, ay + 14], [cx, ay + 17]], sakalR, 3.4));
  if (p.sakal === 'biyik' || p.sakal === 'sakal' || p.sakal === 'keci') parca.push(sekil([[cx - 24, ay - 6], [cx - 8, ay - 14], [cx, ay - 11], [cx + 8, ay - 14], [cx + 24, ay - 6], [cx, ay - 4]], sac === PALET.sac[6] ? '#d8d4cb' : sac, 3.4));
  if (p.sakal === 'kirli') for (let i = 0; i < 14; i++) parca.push(`<circle cx="${(cx - hw * 0.6 + (i % 7) * hw * 0.2).toFixed(1)}" cy="${(ceneY - 22 + Math.floor(i / 7) * 10 + (i % 2) * 3).toFixed(1)}" r="1.5" fill="${M}" opacity="0.55"/>`);
  const agiz = {
    notr: [[cx - 14, ay], [cx, ay + 2], [cx + 14, ay]],
    mutlu: [[cx - 20, ay - 4], [cx, ay + 10], [cx + 20, ay - 4]],
    merak: [[cx - 10, ay + 2], [cx + 4, ay], [cx + 12, ay - 3]],
    sikkin: [[cx - 16, ay + 4], [cx, ay - 1], [cx + 16, ay + 4]],
    kizgin: [[cx - 14, ay + 4], [cx, ay], [cx + 14, ay + 4]],
    saskin: null,
    kirp: [[cx - 14, ay], [cx, ay + 2], [cx + 14, ay]],
    kisik: [[cx - 18, ay + 1], [cx + 2, ay + 6], [cx + 20, ay - 5]],
    ozlem: [[cx - 11, ay + 3], [cx, ay + 1], [cx + 11, ay + 3]],     // özlem: küçük, hafif aşağı (mutlu değil)
    kararli: [[cx - 15, ay + 1], [cx, ay + 1], [cx + 15, ay]],       // kararlı: düz, sıkı
  }[ifade];
  if (agiz) parca.push(cizgi(yol(agiz, false, s()), 3.8));
  else parca.push(sekil(oval(cx, ay + 2, 8, 10, 0, 360, 10), mono ? '#5f5a53' : '#7a3b2e', 3.4));
  // Yüz piercingleri: burun kanadında halka, sol kaşta iki boncuklu çubuk, alt dudak köşesinde halka (ağzın ifadesine göre)
  if (pc.includes('burun')) parca.push(halka(cx + 12, GOZ_Y + 27, 3.8)); // burun kanadını sarar, açık ağza değmez
  if (pc.includes('kas')) parca.push(boncuk(cx - gozX - 7, GOZ_Y - 31, 2.8), boncuk(cx - gozX - 9, GOZ_Y - (p.gozluk ? 17 : 14), 2.8)); // gözlükte alt boncuk çerçeveye değmesin
  if (pc.includes('dudak')) parca.push(halka(cx - 8, ({ mutlu: ay + 8, saskin: ay + 12, kisik: ay + 4 }[ifade] ?? ay + 2.5) + 4, 4.4));

  // --- Aksesuarlar
  if (p.kulaklik) {
    parca.push(cizgi(yol([[cx - hw - 14, cy - 4], [cx - hw * 0.8, tepe - 18], [cx, tepe - 30], [cx + hw * 0.8, tepe - 18], [cx + hw + 14, cy - 4]], false, s()), 8, M));
    for (const yon of [-1, 1]) parca.push(sekil(oval(cx + yon * (hw + 14), cy + 4, 13, 22, 0, 360, 12, 2.6), VURGU2));
  }
  if (p.kalem) parca.push(`<g transform="rotate(-62 ${cx + hw + 12} ${cy - 22})">${sekil([[cx + hw - 30, cy - 26], [cx + hw + 52, cy - 26], [cx + hw + 64, cy - 22], [cx + hw + 52, cy - 18], [cx + hw - 30, cy - 18]], VURGU1, 3)}</g>`);

  return parca.join('');
}
