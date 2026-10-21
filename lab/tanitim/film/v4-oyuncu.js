// Vinyet 4, OYUNCU (#15–#16, k972–1115). C: 40'lar erkek, ten 6, kısa sakal, dolgun beden, oyun kulaklığı, tekerlekli sandalye.
// #15 (k960–1007) k960–971 v3'ündür (B'nin "?" balonu kendi katmanında yükselir). Bu katman k972'de M18 ile açılır: kamera
//     göz çapasında (düz kesme), montaj boyunca %2 iter; M19 (k984), 12'şer k düz kesme; C iner (k996, baş 6 k'da 12 fps
//     adımla oturur, k1005'te göz kırpar). Raf ve sandalye C ile birlikte gelir (montajda kâğıt boş).
// #16 (k1008–1103) Kamera 24 k KM ile genel plana açılır: C rafın önünde; sandalyenin kolçağı ve tekerlek kavsi yer tutucu
//     çizgi; eli çenesinde (kol/el yer tutucusu: kalın, yuvarlak uçlu çizgi + yumruk). Rafta logosuz gri kutular (üstlerinde
//     kendi doodle desenlerimiz), markasız kitaplar ve boşlukta kesik çizgili figür silüeti (ctx.FIGUR; kesik çizgi 12 fps'te
//     kayar). Bakış önce boşluğa, sonra balona (12'şer k EO, 12 fps adım).
//     Balon (YERLESIM): 3 eskiz 24'er k düz kesme (k1032 robot, k1056 pelerinli, k1080 ctx.FIGUR); ilk ikisi karalanır,
//     üçüncüsü 14 k'da vurgu renginde halkalanır; "?" baştan beri balonda ve sonda kalır. ÇÖZÜM YOK.
//     El yazısı "Rafıma bir figür…" k1022'de 16 k'da yazılır; devirde balonla yükselir (k1022–1112 tam okunur: 1,5 sn).
// #16→#17 devri (k1104–1115): balon son içeriğiyle (halkalı figür + "?" + el yazısı) 12 k Eİ ile yükselir, son 4 k'da söner; C bakışıyla izler.
//     Katman k1116'da gizlenir; v5 o karede M20 ile başlar (C'yi yeniden kurmaz).
// Sözleşme (v1-kanca kalıbı): kur(ctx) yalnız ctx.tl'ye MUTLAK kare zamanlı tween ekler; window'a bir şey yazmaz.
export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, kisi, balon, odak, yer, oval, MONTAJ, kisiParam, YERLESIM, vurus, W, H, DIKEY, PALET, MONO, BOY, GOZ_Y, VURGU, FIGUR } = ctx;
  const MUR = PALET.murekkep;
  const K = { bas: 960, m18: 972, m19: 984, c: 996, v16: 1008, e1: 1032, e2: 1056, e3: 1080, kalk: 1104, son: 1116 };
  vurus(15, '"?" yükselir · kapı · C iner', K.bas, K.v16 - 1);
  vurus(16, 'C: rafıma bir figür', K.v16, K.kalk - 1);

  const L = ctx.katman('v4', 10);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 1 }, k(K.m18));
  tl.set(L.div, { autoAlpha: 0 }, k(K.son));

  // ---------- Yerel yardımcılar
  let tohumSayac = 400;
  const T = () => tohumSayac++;
  // Köşe başına iki nokta: Catmull-Rom kenarı şişirmez, köşe hafif yuvarlak kalır
  const kose = (x0, y0, x1, y1, r = 5) => [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
  const elips = (cx, cy, rx, ry, a0 = 0, a1 = 360, n = 16) => oval(cx, cy, rx, ry, a0, a1, n, 2);
  // Birim şekil (taban 0, tepe -1) → sahne: x + u·boy, alt + v·boy
  const harita = (x, alt, boy) => (pts) => pts.map(([u, v]) => [x + u * boy, alt + v * boy]);
  const eo = gsap.parseEase(E.EO);

  // ---------- Yerleşim (dört ana karakterle aynı: YERLESIM.kisi, YERLESIM.balon)
  const Y = YERLESIM.kisi;
  const Cp = kisiParam('C');
  const ustK = Y.alt - BOY.boy * Y.olcek, sy = (ly) => ustK + ly * Y.olcek;
  const gx = Y.x, gy = sy(GOZ_Y);
  const ceneY = sy(GOZ_Y + 10 + Cp.yuzBoy); // sakalın alt ucu (yaklaşık)
  const A_Y = Y.alt - yer(146, 126);        // kolçağın üstü (kişiye bağlı: YERLESIM değişirse birlikte kayar)

  // ---------- Dekor: raf, kutular, kitaplar, kesik silüet, sandalye (C ile birlikte k996'da gelir; montajda kâğıt boş)
  const set = el(L.svg, 'g');
  gsap.set(set, { autoAlpha: 0 });
  tl.set(set, { autoAlpha: 1 }, k(K.c));
  const RAF = yer({
    tahta: [596, 862], dikme: [36, 1470, 1888], x1: 1920,
    kutu: [
      // üst raf
      [56, 596, 128, 168, 'dalga', '#d8d2c7'], [196, 596, 104, 118, 'nokta', '#bdb6a9'], [308, 596, 84, 86, 'serit', '#cfc9bd'],
      [772, 596, 124, 100, 'ucgen', '#cfc9bd'] /* balon noktalarının altında kalsın */, [910, 596, 196, 58, 'serit', '#e2ddd3'], [924, 538, 168, 54, 'dalga', '#bdb6a9'],
      [1120, 596, 138, 184, 'halka', '#d8d2c7'], [1272, 596, 160, 116, 'dag', '#cfc9bd'], [1494, 596, 158, 166, 'nokta', '#bdb6a9'],
      [1666, 596, 196, 108, 'dalga', '#d8d2c7'],
      // orta raf
      [52, 862, 206, 54, 'serit', '#cfc9bd'], [62, 808, 186, 50, 'dalga', '#e2ddd3'], [72, 758, 170, 48, 'nokta', '#bdb6a9'],
      [1300, 862, 132, 206, 'halka', '#cfc9bd'],
      [1492, 862, 222, 56, 'serit', '#d8d2c7'], [1502, 806, 202, 52, 'dag', '#cfc9bd'], [1512, 754, 182, 50, 'dalga', '#bdb6a9'],
      [1734, 862, 128, 128, 'ucgen', '#e2ddd3'],
      // alt raf
      [1494, 1100, 186, 196, 'dalga', '#cfc9bd'], [1694, 1100, 168, 168, 'nokta', '#d8d2c7'],
    ],
    // Markasız kitaplar (sırtları düz, yazısız): [x, alt, en, boy, dolgu, eğim°]; son kitap sağdaki kutuya yaslanır
    kitap: [[1134, 862, 30, 150, '#a59e91', 0], [1166, 862, 26, 128, '#cfc9bd', 0], [1194, 862, 36, 162, '#bdb6a9', 0], [1236, 862, 28, 138, '#d8d2c7', 13]],
    figur: { x: 1036, alt: 862, boy: 204 }, // balonun alt kıvrımlarının dışında kalsın
  }, {
    tahta: [1170, 1450], dikme: [22, 1058], x1: 1080,
    kutu: [
      [40, 1170, 150, 168, 'dalga', '#d8d2c7'], [200, 1170, 118, 118, 'nokta', '#bdb6a9'], [328, 1170, 196, 58, 'serit', '#e2ddd3'],
      [342, 1112, 168, 54, 'dalga', '#bdb6a9'], /* x 530–800 boş: baş ve balon noktaları (başın sağında) buradan geçer */
      [812, 1170, 100, 92, 'ucgen', '#d8d2c7'], [922, 1170, 128, 64, 'dag', '#cfc9bd'], [930, 1106, 112, 54, 'serit', '#bdb6a9'],
      [36, 1450, 250, 58, 'serit', '#cfc9bd'], [46, 1392, 228, 54, 'dalga', '#e2ddd3'], [58, 1338, 204, 50, 'nokta', '#bdb6a9'],
    ],
    kitap: [[750, 1450, 28, 130, '#a59e91', 0], [780, 1450, 24, 112, '#cfc9bd', 0], [806, 1450, 30, 140, '#bdb6a9', 0]],
    figur: { x: 944, alt: 1450, boy: 212 },
  });
  const AHSAP = MONO.giysi[6];
  for (const x of RAF.dikme) cizgi(set, kose(x - 12, -60, x + 12, H + 60, 4), { kapali: true, dolgu: AHSAP, tohum: T() });
  for (const y of RAF.tahta) cizgi(set, kose(-40, y, RAF.x1 + 40, y + 18, 4), { kapali: true, dolgu: AHSAP, tohum: T() });

  // Kutu yüzündeki desen: yalnız kendi soyut doodle'larımız (logo, yazı, tanınır işaret yok)
  function desen(ad, x0, y0, x1, y1) {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, m = Math.min(w, h);
    const ince = (ek = {}) => ({ kalinlik: 3.2, tohum: T(), genlik: 0.8, ...ek });
    if (ad === 'dalga') {
      const p = []; for (let i = 0; i <= 6; i++) p.push([x0 + w * (0.16 + 0.68 * i / 6), cy + (i % 2 ? -1 : 1) * Math.min(h * 0.16, 11)]);
      cizgi(set, p, ince());
    } else if (ad === 'halka') {
      cizgi(set, elips(cx, cy, m * 0.3, m * 0.3, 0, 360, 14), ince({ kapali: true }));
      cizgi(set, elips(cx, cy, m * 0.12, m * 0.12, 0, 360, 10), ince({ kapali: true }));
    } else if (ad === 'nokta') {
      for (let i = 0; i < 3; i++) el(set, 'circle', { cx: x0 + w * (0.3 + 0.2 * i), cy: cy + (i % 2 ? -1 : 1) * h * 0.1, r: Math.max(3, m * 0.06), fill: MUR });
    } else if (ad === 'serit') {
      for (const f of [0.36, 0.64]) cizgi(set, [[x0 + w * 0.12, y0 + h * f], [x1 - w * 0.12, y0 + h * f]], ince());
    } else if (ad === 'ucgen') {
      const r = m * 0.3;
      cizgi(set, [[cx, cy - r], [cx + r * 0.5, cy], [cx + r, cy + r * 0.8], [cx, cy + r * 0.8], [cx - r, cy + r * 0.8], [cx - r * 0.5, cy]], ince({ kapali: true }));
    } else if (ad === 'dag') {
      cizgi(set, [[x0 + w * 0.14, cy + h * 0.2], [x0 + w * 0.36, cy - h * 0.2], [cx, cy + h * 0.06], [x1 - w * 0.3, cy - h * 0.26], [x1 - w * 0.14, cy + h * 0.2]], ince());
    }
  }
  function kutu(x, alt, en, boy, ds, dolgu) {
    const y0 = alt - boy;
    cizgi(set, kose(x, y0, x + en, alt, 5), { kapali: true, dolgu, tohum: T(), kalinlik: 4.5 });
    const kapak = boy > 70;
    if (kapak) cizgi(set, [[x + 4, y0 + boy * 0.24], [x + en - 4, y0 + boy * 0.24]], { kalinlik: 3.2, tohum: T(), genlik: 0.8 });
    desen(ds, x, kapak ? y0 + boy * 0.24 : y0, x + en, alt);
  }
  // Kitap (markasız): sırt dikdörtgeni + iki ince sırt bandı; eğim° > 0 sağa yaslanır (sağ alt köşe çevresinde döner)
  function kitap(x, alt, en, boy, dolgu, egim = 0) {
    const a = egim * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), px = egim > 0 ? x + en : x;
    const R = (pts) => pts.map(([u, v]) => [px + (u - px) * c - (v - alt) * s, alt + (u - px) * s + (v - alt) * c]);
    cizgi(set, R(kose(x, alt - boy, x + en, alt, 3)), { kapali: true, dolgu, tohum: T(), kalinlik: 4.5 });
    for (const f of [0.16, 0.84]) cizgi(set, R([[x + 5, alt - boy * f], [x + en - 5, alt - boy * f]]), { kalinlik: 3, tohum: T(), genlik: 0.6 });
  }
  for (const b of RAF.kutu) kutu(...b);
  for (const b of RAF.kitap) kitap(...b);
  // Kesik çizgili silüet = C'nin istediği figür (ctx.FIGUR; vurgu rengi = istek işareti). Kesik çizgi 12 fps'te kayar: 5 k'da bir 8 px
  const kesik = (() => {
    const M = harita(RAF.figur.x, RAF.figur.alt, RAF.figur.boy);
    return FIGUR.map((s) => {
      const y = cizgi(set, M(s.p), { kapali: !!s.kapali, renk: VURGU, kalinlik: 4.5, tohum: T(), genlik: 0.9 }).yol;
      y.setAttribute('stroke-dasharray', '13 11');
      return y;
    });
  })();
  tl.fromTo(kesik, { strokeDashoffset: 0 }, { strokeDashoffset: -8 * 24, duration: k(120), ease: 'steps(24)', immediateRender: false }, k(K.c - 1));

  // Tekerlekli sandalye (sıradan ayrıntı): iki yanda kolçak yastığı + ön dikme, tekerleğin üst kavsi, çember, jant telleri
  const SAN = yer({ ic: 262, dis: 478, dikme: 452, teker: 478, rx: 212, ry: 340 }, { ic: 262, dis: 478, dikme: 452, teker: 470, rx: 190, ry: 320 });
  for (const yon of [-1, 1]) {
    const tx = Y.x + yon * SAN.teker, ty = A_Y + 22 + SAN.ry;
    for (const a of [232, 258, 284, 310]) {
      const r = a * Math.PI / 180;
      cizgi(set, [[tx, ty], [tx + Math.cos(r) * (SAN.rx - 30), ty + Math.sin(r) * (SAN.ry - 34)]], { kalinlik: 3, tohum: T(), genlik: 0.8 });
    }
    cizgi(set, elips(tx, ty, SAN.rx, SAN.ry, 194, 346, 18), { kalinlik: 6, tohum: T() });                    // lastik
    cizgi(set, elips(tx, ty, SAN.rx - 20, SAN.ry - 22, 198, 342, 16), { kalinlik: 3.6, tohum: T() });        // jant kenarı
    cizgi(set, elips(tx + yon * 24, ty + 6, SAN.rx - 38, SAN.ry - 50, 204, 336, 16), { kalinlik: 4.5, tohum: T() }); // itme çemberi
    const xd = Y.x + yon * SAN.dikme;
    cizgi(set, kose(xd - 9, A_Y + 20, xd + 9, H + 60, 4), { kapali: true, dolgu: MONO.giysi[3], tohum: T(), kalinlik: 4.5 });
    const x0 = Y.x + yon * SAN.ic, x1 = Y.x + yon * SAN.dis;
    cizgi(set, kose(Math.min(x0, x1), A_Y, Math.max(x0, x1), A_Y + 28, 12), { kapali: true, dolgu: MONO.giysi[4], tohum: T() });
  }

  // ---------- Kişi: M18 → M19 → C (aynı yer, aynı göz çapası; düz kesme)
  const kis = kisi(L.svg, MONTAJ[17], Y);

  // ---------- Kol ve el (yer tutucu): kolçaktaki dirsekten çeneye kalın, yuvarlak uçlu çizgi + yumruk. 12 fps poz
  const kolG = el(L.svg, 'g');
  gsap.set(kolG, { autoAlpha: 0 });
  tl.set(kolG, { autoAlpha: 1 }, k(1010));
  const dirsek = [Y.x + 340, A_Y + 6];
  const KOL = { kalk: [Y.x + 220, A_Y - 70], cene: [Y.x + 40, ceneY + 30] };
  // Yen gövdeden bir ton açık: önde duran kol gövdeden ayrılsın (animatik okunurluğu)
  const TEN = MONO.ten[Cp.ten], YEN = MONO.giysi[4], CIZ_ACIK = MONO.ten[2];
  // Yol: dirsek → yen ucu (kumaş), yen ucu → yumruk (bilek, ten). Yumruk iri ve hafif yatık; içinde yatay parmak kıvrımları
  const kolYolu = ([fx, fy]) => {
    const dx = fx - dirsek[0], dy = fy - dirsek[1], l = Math.hypot(dx, dy), u = [dx / l, dy / l];
    const yen = [fx - u[0] * 100, fy - u[1] * 100];
    return {
      yen: [dirsek, [(dirsek[0] + yen[0]) / 2 + 6, (dirsek[1] + yen[1]) / 2 + 10], yen],
      bilek: [[yen[0] - u[0] * 8, yen[1] - u[1] * 8], [fx - u[0] * 18, fy - u[1] * 18]],
    };
  };
  const tup = (renk, en, tohum) => [cizgi(kolG, [[0, 0], [0, 1]], { kalinlik: en + 11, renk: MUR, tohum }), cizgi(kolG, [[0, 0], [0, 1]], { kalinlik: en, renk, tohum })];
  const bilek = tup(TEN, 30, 905), yen = tup(YEN, 44, 901);
  yen[1].g.setAttribute('transform', 'translate(2 2)'); // baskı kayması
  const yumruk = cizgi(kolG, elips(0, 0, 46, 37), { kapali: true, dolgu: TEN, tohum: 902 });
  const parmak = [0, 1, 2].map((i) => cizgi(kolG, [[0, 0], [0, 1]], { kalinlik: 3.4, tohum: 903 + i, genlik: 0.6, renk: CIZ_ACIK }));
  function kolPoz(ad) {
    const [fx, fy] = KOL[ad], Y2 = kolYolu(KOL[ad]);
    for (const h of bilek) h.pts = Y2.bilek;
    for (const h of yen) h.pts = Y2.yen;
    yumruk.pts = elips(fx, fy, 46, 37);
    parmak.forEach((h, i) => { const y = fy - 6 + i * 12, w = 30 - i * 4; h.pts = [[fx - w, y], [fx + w * 0.2, y + 2], [fx + w, y - 1]]; });
    for (const h of [...bilek, ...yen, yumruk, ...parmak]) h.ciz();
  }
  kolPoz('kalk'); // ilk poz kurulumda (katman k1010'a dek gizli)

  // ---------- C'nin balonu (YERLESIM) ve içi: el yazısı, "?", 3 eskiz
  const BL = YERLESIM.balon;
  const bal = balon(L.svg, { c: BL.c, r: BL.r, noktalar: YERLESIM.noktalar, tohum: 47, koken: YERLESIM.balonKoken });
  bal.ac(K.v16); // noktalar k1008'den, bulut k1032'de oturur

  // "?" işareti (vurgu rengi): kanca + nokta, kaynar
  function soru(ust, x, y, boy, kalinlik = 8) {
    const g = el(ust, 'g'), M = harita(x, y, boy);
    cizgi(g, M([[-0.24, -0.24], [-0.2, -0.38], [-0.04, -0.47], [0.16, -0.44], [0.26, -0.3], [0.2, -0.14], [0.05, -0.04], [0, 0.08], [0, 0.18]]), { kalinlik, renk: VURGU, tohum: T(), genlik: 1 });
    cizgi(g, M(elips(0, 0.38, 0.065, 0.065, 0, 360, 10)), { kapali: true, dolgu: VURGU, renk: VURGU, kalinlik: kalinlik * 0.6, tohum: T(), genlik: 0.6, kay: [0, 0] });
    return g;
  }
  const SORU = yer({ x: 1652, y: 362, boy: 150 }, { x: 832, y: 702, boy: 150 });
  const sq = soru(bal.ic, SORU.x, SORU.y, SORU.boy, 9);
  gsap.set(sq, { scale: 0, transformOrigin: '50% 50%' });
  tl.fromTo(sq, { scale: 0 }, { scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(1036));
  // Halka bitince "?" bir kez kabarır: çözüm yok, soru yerinde
  tl.to(sq, { scale: 1.18, rotation: 8, duration: k(4), ease: E.EO }, k(1097));
  tl.to(sq, { scale: 1, rotation: 0, duration: k(5), ease: 'power1.inOut' }, k(1101));

  // Satır kuralı: 16 k'da yazılır (k1022–1037), devirde balonla birlikte yükselir; k1022–1112 tam okunur (90 k = 1,5 sn)
  const not = ctx.elYazisi(L.div, ctx.metin('Rafıma bir figür…', 'A figure for my shelf…'), { x: YERLESIM.notYeri.x, y: YERLESIM.notYeri.y });
  ctx.yazElYazisi(not, 1022, 16);

  // Eskizler (birim şekil, taban 0, tepe -1): robot, pelerinli kalkanlı, ctx.FIGUR (= raftaki kesik silüet)
  const ROBOT = [
    { p: elips(0, -0.05, 0.34, 0.06), kapali: true },
    { p: [[-0.1, -0.1], [-0.1, -0.22]] }, { p: [[0.1, -0.1], [0.1, -0.22]] },
    { p: kose(-0.2, -0.58, 0.2, -0.22, 0.04), kapali: true },
    { p: [[-0.2, -0.5], [-0.32, -0.4], [-0.31, -0.28]] }, { p: [[0.2, -0.5], [0.31, -0.58], [0.35, -0.7]] },
    { p: kose(-0.15, -0.86, 0.15, -0.62, 0.04), kapali: true },
    { p: [[0, -0.86], [0, -0.95]] }, { p: elips(0, -0.975, 0.03, 0.03, 0, 360, 8), kapali: true },
    { p: elips(-0.06, -0.75, 0.022, 0.022, 0, 360, 8), kapali: true }, { p: elips(0.06, -0.75, 0.022, 0.022, 0, 360, 8), kapali: true },
  ];
  const PELERIN = [
    { p: elips(0, -0.05, 0.34, 0.06), kapali: true },
    { p: [[0, -0.7], [0.13, -0.4], [0.27, -0.12], [0, -0.1], [-0.27, -0.12], [-0.13, -0.4]], kapali: true },
    { p: elips(0, -0.79, 0.11, 0.11), kapali: true },
    { p: elips(-0.2, -0.42, 0.14, 0.14), kapali: true }, { p: elips(-0.2, -0.42, 0.045, 0.045, 0, 360, 10), kapali: true },
    { p: [[0.23, -0.96], [0.27, -0.5], [0.3, -0.06]] },
  ];
  const TIKNAZ = [
    ...FIGUR,
    { p: elips(-0.08, -0.72, 0.022, 0.022, 0, 360, 8), kapali: true }, { p: elips(0.08, -0.72, 0.022, 0.022, 0, 360, 8), kapali: true },
    { p: [[-0.07, -0.63], [0, -0.6], [0.07, -0.63]] },
  ];
  // Karalama: sık, eğik gidip gelen tarama (kalem bastırılarak)
  const KARALAMA = Array.from({ length: 14 }, (_, i) => [(i % 2 ? 0.42 : -0.42) + (i % 3) * 0.02, -0.95 + i * 0.07 + (i % 2 ? -0.03 : 0.03)]);
  const HALKA = Array.from({ length: 27 }, (_, i) => {
    const a = (-112 + 400 * i / 26) * Math.PI / 180, b = 1 + 0.07 * i / 26;
    return [Math.cos(a) * 0.52 * b, -0.5 + Math.sin(a) * 0.6 * b];
  });
  const ES = yer({ x: 1310, alt: 514, boy: 262 }, { x: 472, alt: 842, boy: 262 });
  function eskiz(sekiller, e, { karala = false, halkala = false, kalir = false } = {}) {
    const g = el(bal.ic, 'g'), M = harita(ES.x, ES.alt, ES.boy);
    gsap.set(g, { autoAlpha: 0 });
    tl.set(g, { autoAlpha: 1 }, k(e));
    if (!kalir) tl.set(g, { autoAlpha: 0 }, k(e + 24)); // 24 k düz kesme; sonuncusu balonla birlikte yükselir
    const hs = sekiller.map((s) => cizgi(g, M(s.p), { kapali: !!s.kapali, kalinlik: 4.5, tohum: T() })), yollar = hs.map((h) => h.yol);
    // DrawSVG yolun boyunu başta ölçer: çizilirken kaynama donar (yoksa ucunda nokta kalıyor), bitince sürer
    const don = (liste, k0, k1) => { tl.call(() => liste.forEach((h) => { h.donuk = true; }), null, k(k0)); tl.call(() => liste.forEach((h) => { h.donuk = false; h.ciz(); }), null, k(k1)); };
    don(hs, e, e + 13);
    tl.fromTo(yollar, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(6), ease: 'power1.out', stagger: { amount: k(6) }, immediateRender: false }, k(e));
    tl.set(yollar, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(e + 13));
    const ek = (pts, k0, sure, ease, stil) => {
      const ag = el(g, 'g');
      gsap.set(ag, { autoAlpha: 0 });
      tl.set(ag, { autoAlpha: 1 }, k(k0));
      const h = cizgi(ag, M(pts), { tohum: T(), ...stil }), y = h.yol;
      don([h], k0, k0 + sure + 1);
      tl.fromTo(y, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(sure), ease, immediateRender: false }, k(k0));
      tl.set(y, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(k0 + sure + 1));
    };
    if (karala) ek(KARALAMA, e + 13, 8, 'power1.in', { kalinlik: 6, genlik: 1.6 });
    if (halkala) ek(HALKA, e + 6, 14, 'power1.inOut', { kalinlik: 6, renk: VURGU, genlik: 1.2 });
  }
  eskiz(ROBOT, K.e1, { karala: true });
  eskiz(PELERIN, K.e2, { karala: true });
  eskiz(TIKNAZ, K.e3, { halkala: true, kalir: true });

  // ---------- #16→#17 devri (k1104–1115): balon son içeriğiyle yükselip kaybolur (12 k Eİ; v2 #9 / v3 #15 ile aynı dil)
  const YUK = yer(800, 1200), SON_SOL = 4; // Eİ: ilk karelerde yavaş, sonda kadrajdan hızla çıkar
  gsap.set(bal.g, { svgOrigin: `${BL.c[0]} ${BL.c[1]}` });
  tl.to(bal.noktalar, { autoAlpha: 0, duration: k(6), ease: E.EI, stagger: k(1) }, k(K.kalk));
  tl.fromTo(bal.g, { y: 0, scale: 1 }, { y: -YUK, scale: 0.8, duration: k(12), ease: E.EI, immediateRender: false }, k(K.kalk));
  tl.fromTo(bal.g, { autoAlpha: 1 }, { autoAlpha: 0, duration: k(SON_SOL), ease: 'none', immediateRender: false }, k(K.son - SON_SOL));
  // El yazısı balonun içinde yazıldı: onunla birlikte yükselir ve söner
  tl.fromTo(not, { y: 0 }, { y: -YUK, duration: k(12), ease: E.EI, immediateRender: false }, k(K.kalk));
  tl.to(not, { autoAlpha: 0, duration: k(SON_SOL), ease: 'none' }, k(K.son - SON_SOL));

  // ---------- Kamera: k972 düz kesme ile göz çapası → montajda %2 itiş → genel plana açılış (24 k KM; el yazısı k1022'de okunur olsun) → %1,5 itiş (k1116'ya dek)
  // Yatay genel planda sahne 24 px aşağıda durur: bu balonun (tohum 47) tepe kıvrımı YERLESIM'de kenara değiyor
  const DY = yer(24, 0);
  const GENIS = () => ({ x: 0, y: DY, scale: 1 });
  // Kapı montajı #9 (v2) ve #17 (v5) ile aynı dil: YERLESIM kadrajı, ölçek 1; göz çapası çevresinde %1 itiş
  const MONT = () => odak(gx, gy, 1.01, gx, gy + DY);
  ctx.kameraKoy(K.m18, GENIS());
  tl.fromTo(ctx.kamera, GENIS(), { ...MONT(), duration: k(K.v16 - K.m18), ease: 'none', immediateRender: false }, k(K.m18));
  tl.fromTo(ctx.kamera, MONT(), { ...GENIS(), duration: k(24), ease: E.KM, immediateRender: false }, k(K.v16));
  // Son itiş yatayda üst kenara sabitlenir: balonun tepe kıvrımları kadrajdan taşmasın
  const ITME = yer([W / 2, 0], [W / 2, H / 2]);
  tl.fromTo(ctx.kamera, GENIS(), { ...odak(ITME[0], ITME[1], 1.015, ITME[0], ITME[1] + DY), duration: k(K.son - K.v16 - 24), ease: 'none', immediateRender: false }, k(K.v16 + 24));

  // ---------- Oyunculuk (12 fps: poz değişimleri 5 k ızgarasında; kesmeler tam karede)
  const poz = (kare, v) => tl.call(() => kis.poz(v), null, k(kare));
  function bakisGit(k0, a, b, ifade) { // 12 k EO, 12 fps örnekleme
    [0, 5, 10].forEach((d, i) => {
      const f = eo(Math.min(1, (d + 2) / 12));
      const v = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      poz(k0 + d, i === 0 && ifade ? { ifade, bakis: v } : { bakis: v });
    });
  }
  // #15 (bu katmanın payı k972'den başlar)
  poz(K.m18, { p: MONTAJ[17], ifade: 'notr', bakis: [0, 0] });
  poz(K.m19, { p: MONTAJ[18], ifade: 'merak', bakis: [-1, 0] });
  poz(K.c, { p: Cp, ifade: 'notr', bakis: [0, 0] });
  const inis = BOY.boy * Y.olcek * 0.05;
  tl.fromTo(kis.g, { y: -inis }, { y: 0, duration: k(6), ease: 'steps(2)', immediateRender: false }, k(K.c)); // C iner
  poz(1005, { ifade: 'kirp' }); // oturunca bir kez göz kırpar (5 k; k1010'da bakış başlar)
  // #16
  const BAKIS_RAF = yer([1, 0.5], [1, -0.4]), BAKIS_BALON = yer([1, -1], [0.3, -1]);
  bakisGit(1010, [0, 0], BAKIS_RAF, 'merak');
  tl.call(() => kolPoz('kalk'), null, k(1010));
  tl.call(() => kolPoz('cene'), null, k(1015));
  bakisGit(1030, BAKIS_RAF, BAKIS_BALON);
  poz(1050, { ifade: 'sikkin' });  // 1. eskiz karalanıyor
  poz(1060, { ifade: 'merak' });   // 2. eskiz
  poz(1075, { ifade: 'sikkin' });  // 2. eskiz karalanıyor
  poz(1085, { ifade: 'merak' });   // 3. eskiz
  poz(1090, { ifade: 'mutlu' });   // halka: "bu olabilir"
  poz(1100, { ifade: 'merak' });   // ama "?" yerinde
  // Devir: balon yükselirken bakış onu izler, sonra iç çeker
  poz(1105, { bakis: yer([0.6, -1], [0.2, -1]) });
  poz(1110, { ifade: 'sikkin', bakis: [0, -1] });
}
