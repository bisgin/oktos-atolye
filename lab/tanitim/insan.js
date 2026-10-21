// Doodle insan üreteci (tanıtım filmi, deneme): aynı çizgi dilinde, farklı demografilerde baş-omuz portreleri (SVG).
// Her kişi bir parametre nesnesidir (rastgeleKisi(tohum) ya da elle); kisiSVG(p, { kaynama }) SVG <g> içeriği döndürür.
// Çizgi dili: koyu mürekkep kontur, düz renk dolgu konturdan biraz kaymış (baskı kayması), noktalar elle çizilmiş gibi
// hafif sapmalı; "kaynama" her karede noktaları çok az oynatır (12 kare/sn'de 3 çizim döner).
// Göz çizgisi her kişide aynı yükseklikte (montajda bakış sabit kalsın diye): GOZ_Y.
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
  const cizgi = (d, w = 4.2, renk = M) => `<path d="${d}" fill="none" stroke="${renk}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Dolgu konturdan kaymış (baskı kayması)
  const dolgu = (d, renk, kay = [3, 3]) => `<path d="${d}" fill="${renk}" transform="translate(${kay[0]} ${kay[1]})"/>`;
  const sekil = (pts, renk, w = 4.2) => { const d = yol(pts, true, s()); return dolgu(d, renk) + cizgi(d, w); };

  const cx = 200, cy = GOZ_Y + 4, hw = p.yuzEn, hh = p.yuzBoy;
  const PL = mono ? MONO : PALET;
  const ten = PL.ten[p.ten], sac = PL.sac[p.sac], giysi = PL.giysi[p.giysi], ortu = PL.basortusu[p.ortu];
  const VURGU1 = mono ? MONO.giysi[0] : PALET.giysi[0], VURGU2 = mono ? MONO.giysi[4] : PALET.giysi[1];
  const ceneY = cy + hh;
  const parca = [];

  // --- Arka katman: uzun saç / başörtüsü dökümü
  if (p.sacStil === 'uzun') parca.push(sekil([[cx - hw - 6, cy - hh * 0.6], [cx - hw - 16, cy + hh * 0.4], [cx - hw - 10, ceneY + 48], [cx - hw * 0.4, ceneY + 58], [cx + hw * 0.4, ceneY + 58], [cx + hw + 10, ceneY + 48], [cx + hw + 16, cy + hh * 0.4], [cx + hw + 6, cy - hh * 0.6], [cx, cy - hh - 10]], sac));
  if (p.sacStil === 'bob') parca.push(sekil([[cx - hw - 8, cy - hh * 0.5], [cx - hw - 14, cy + hh * 0.35], [cx - hw - 4, ceneY - 6], [cx - hw * 0.5, ceneY + 4], [cx + hw * 0.5, ceneY + 4], [cx + hw + 4, ceneY - 6], [cx + hw + 14, cy + hh * 0.35], [cx + hw + 8, cy - hh * 0.5], [cx, cy - hh - 12]], sac));

  // --- Gövde ve yaka
  const omuzY = ceneY + 40;
  const govde = [[cx - hw * 0.5, ceneY + 14], [cx - 118, omuzY + 14], [cx - 162, omuzY + 52], [cx - 176, BOY.boy + 170], [cx + 176, BOY.boy + 170], [cx + 162, omuzY + 52], [cx + 118, omuzY + 14], [cx + hw * 0.5, ceneY + 14]];
  // Boyun önce, gövde üstüne biner
  parca.push(sekil([[cx - hw * 0.38, ceneY - 18], [cx - hw * 0.42, ceneY + 22], [cx + hw * 0.42, ceneY + 22], [cx + hw * 0.38, ceneY - 18]], ten));
  if (p.sacStil !== 'basortusu' || true) parca.push(sekil(govde, giysi));
  const yaka = p.yaka;
  if (yaka === 'v') parca.push(cizgi(yol([[cx - hw * 0.45, ceneY + 16], [cx, ceneY + 58], [cx + hw * 0.45, ceneY + 16]], false, s())));
  if (yaka === 'bisiklet') parca.push(cizgi(yol([[cx - hw * 0.55, ceneY + 14], [cx, ceneY + 32], [cx + hw * 0.55, ceneY + 14]], false, s())));
  if (yaka === 'balikci') parca.push(sekil([[cx - hw * 0.5, ceneY + 2], [cx - hw * 0.56, ceneY + 30], [cx, ceneY + 38], [cx + hw * 0.56, ceneY + 30], [cx + hw * 0.5, ceneY + 2]], giysi));
  if (yaka === 'gomlek' || p.ceket) {
    parca.push(sekil([[cx - hw * 0.5, ceneY + 8], [cx - hw * 0.72, ceneY + 34], [cx - 6, ceneY + 46], [cx - hw * 0.2, ceneY + 18]], '#f4f1ea'));
    parca.push(sekil([[cx + hw * 0.5, ceneY + 8], [cx + hw * 0.72, ceneY + 34], [cx + 6, ceneY + 46], [cx + hw * 0.2, ceneY + 18]], '#f4f1ea'));
  }
  if (p.ceket) {
    // Blazer yakaları ve düğme
    parca.push(cizgi(yol([[cx - hw * 0.62, ceneY + 28], [cx - 34, ceneY + 104], [cx - 8, BOY.boy + 170]], false, s())));
    parca.push(cizgi(yol([[cx + hw * 0.62, ceneY + 28], [cx + 34, ceneY + 104], [cx + 8, BOY.boy + 170]], false, s())));
    parca.push(`<circle cx="${cx + 4}" cy="${ceneY + 128}" r="4.5" fill="${M}"/>`);
  }
  if (yaka === 'kapusonlu') {
    parca.push(cizgi(yol([[cx - 88, omuzY + 6], [cx - 40, ceneY + 26], [cx, ceneY + 34], [cx + 40, ceneY + 26], [cx + 88, omuzY + 6]], false, s())));
    parca.push(cizgi(yol([[cx - 16, ceneY + 34], [cx - 20, ceneY + 82]], false, s()), 3.4));
    parca.push(cizgi(yol([[cx + 16, ceneY + 34], [cx + 20, ceneY + 82]], false, s()), 3.4));
  }
  if (p.yelek) {
    parca.push(sekil([[cx - 150, omuzY + 40], [cx - 70, ceneY + 30], [cx - 30, BOY.boy + 170], [cx - 168, BOY.boy + 170]], VURGU2));
    parca.push(sekil([[cx + 150, omuzY + 40], [cx + 70, ceneY + 30], [cx + 30, BOY.boy + 170], [cx + 168, BOY.boy + 170]], VURGU2));
    parca.push(cizgi(yol([[cx - 140, omuzY + 92], [cx - 52, omuzY + 92]], false, s()), 6, '#f1ede6'));
    parca.push(cizgi(yol([[cx + 52, omuzY + 92], [cx + 140, omuzY + 92]], false, s()), 6, '#f1ede6'));
  }

  // Başörtüsü boynu ve göğsü örter: gövdenin önünde, yüzün arkasında
  if (p.sacStil === 'basortusu') parca.push(sekil([[cx, cy - hh - 22], [cx + hw + 24, cy - hh * 0.55], [cx + hw + 30, cy + hh * 0.3], [cx + hw + 44, ceneY + 44], [cx + 124, ceneY + 96], [cx, ceneY + 110], [cx - 124, ceneY + 96], [cx - hw - 44, ceneY + 44], [cx - hw - 30, cy + hh * 0.3], [cx - hw - 24, cy - hh * 0.55]], ortu));

  // --- Kulaklar
  if (p.sacStil !== 'basortusu') {
    for (const yon of [-1, 1]) parca.push(sekil([[cx + yon * (hw - 4), cy - 10], [cx + yon * (hw + 12), cy - 8], [cx + yon * (hw + 14), cy + 10], [cx + yon * (hw + 4), cy + 22]], ten, 3.6));
  }
  if (p.isitme) parca.push(sekil([[cx + hw + 8, cy - 14], [cx + hw + 18, cy - 10], [cx + hw + 16, cy + 6]], '#c9c4bb', 3));
  if (p.kupe) for (const yon of [-1, 1]) parca.push(`<circle cx="${cx + yon * (hw + 8)}" cy="${cy + 30}" r="5" fill="${VURGU1}" stroke="${M}" stroke-width="3"/>`);

  // --- Yüz
  const yuz = oval(cx, cy - 6, hw, hh, 0, 360, 22, p.ust).map(([x, y]) => {
    const alt = Math.max(0, (y - cy) / hh); // çene daralması
    return [cx + (x - cx) * (1 - p.cene * alt * alt), y];
  });
  parca.push(sekil(yuz, ten));

  // --- Saç (ön) ve başlıklar
  const tepe = cy - 6 - hh;
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
    parca.push(cizgi(yol([[cx - 20, tepe + 22], [cx - 6, tepe + 16]], false, s()), 2.6));
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

  // Saç teli dokusu (dolgu kask gibi durmasın)
  const tel = (a, b, c) => parca.push(cizgi(yol([a, b, c], false, s()), 2.4));
  if (['kisa', 'uzun', 'bob', 'topuz'].includes(p.sacStil)) {
    tel([cx - hw * 0.15, tepe - 8], [cx - hw * 0.38, tepe + 4], [cx - hw * 0.52, cy - hh * 0.5]);
    tel([cx + hw * 0.35, tepe - 6], [cx + hw * 0.32, tepe + 8], [cx + hw * 0.18, cy - hh * 0.6]);
  }
  if (p.sacStil === 'yan') {
    tel([cx + hw * 0.5, tepe - 2], [cx + hw * 0.1, tepe + 6], [cx - hw * 0.25, cy - hh * 0.62]);
    tel([cx + hw * 0.8, cy - hh * 0.62], [cx + hw * 0.55, cy - hh * 0.66], [cx + hw * 0.3, cy - hh * 0.7]);
  }
  if (p.sacStil === 'uzun' || p.sacStil === 'bob') for (const yon of [-1, 1]) tel([cx + yon * (hw + 4), cy - hh * 0.2], [cx + yon * (hw + 8), cy + hh * 0.3], [cx + yon * (hw + 6), ceneY - (p.sacStil === 'bob' ? 14 : -20)]);

  // --- Yaş izleri, çil
  if (p.yas === 'yasli') {
    for (const yon of [-1, 1]) parca.push(cizgi(yol([[cx + yon * hw * 0.62, cy - 4], [cx + yon * hw * 0.78, cy + 2]], false, s()), 2.4));
    parca.push(cizgi(yol([[cx - 18, cy - hh * 0.42], [cx + 16, cy - hh * 0.44]], false, s()), 2.2));
  }
  if (p.cil) for (const yon of [-1, 1]) for (let i = 0; i < 3; i++) parca.push(`<circle cx="${cx + yon * (hw * 0.42 + i * 7)}" cy="${cy + 16 + (i % 2) * 5}" r="1.8" fill="${mono ? '#7d776e' : '#9c6845'}"/>`);
  // Allık
  for (const yon of [-1, 1]) parca.push(`<ellipse cx="${cx + yon * hw * 0.55}" cy="${cy + 22}" rx="12" ry="7" fill="${mono ? '#000' : '#e46a4f'}" opacity="${mono ? 0.05 : 0.18}"/>`);

  // --- Gözler, kaşlar, burun, ağız (ifadeye göre)
  const [bx, by] = bakis;
  const gozX = hw * 0.38;
  const kas = { notr: [0, 0], merak: [-5, 3], kizgin: [4, -6], sikkin: [3, 4], mutlu: [-3, 0], saskin: [-8, 0], kisik: [3, -2] }[ifade] || [0, 0];
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
  if (p.sakal === 'sakal') parca.push(sekil([[cx - hw + 2, cy + 6], [cx - hw * 0.8, ceneY - 18], [cx - hw * 0.3, ceneY + 6], [cx + hw * 0.3, ceneY + 6], [cx + hw * 0.8, ceneY - 18], [cx + hw - 2, cy + 6], [cx + hw * 0.5, ay - 6], [cx, ay - 12], [cx - hw * 0.5, ay - 6]], sac === PALET.sac[6] ? '#d8d4cb' : sac));
  if (p.sakal === 'biyik' || p.sakal === 'sakal') parca.push(sekil([[cx - 24, ay - 6], [cx - 8, ay - 14], [cx, ay - 11], [cx + 8, ay - 14], [cx + 24, ay - 6], [cx, ay - 4]], sac === PALET.sac[6] ? '#d8d4cb' : sac, 3.4));
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
  }[ifade];
  if (agiz) parca.push(cizgi(yol(agiz, false, s()), 3.8));
  else parca.push(sekil(oval(cx, ay + 2, 8, 10, 0, 360, 10), mono ? '#5f5a53' : '#7a3b2e', 3.4));

  // --- Aksesuarlar
  if (p.kulaklik) {
    parca.push(cizgi(yol([[cx - hw - 14, cy - 4], [cx - hw * 0.8, tepe - 18], [cx, tepe - 30], [cx + hw * 0.8, tepe - 18], [cx + hw + 14, cy - 4]], false, s()), 8, M));
    for (const yon of [-1, 1]) parca.push(sekil(oval(cx + yon * (hw + 14), cy + 4, 13, 22, 0, 360, 12, 2.6), VURGU2));
  }
  if (p.kalem) parca.push(`<g transform="rotate(-62 ${cx + hw + 12} ${cy - 22})">${sekil([[cx + hw - 30, cy - 26], [cx + hw + 52, cy - 26], [cx + hw + 64, cy - 22], [cx + hw + 52, cy - 18], [cx + hw - 30, cy - 18]], VURGU1, 3)}</g>`);

  return parca.join('');
}
