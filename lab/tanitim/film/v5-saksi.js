// Vinyet 5, İŞ KADINI ve SAKSI (D karakteri, #17–#20, k1104–1631). Kalıp v1-kanca.js ile aynı: kur(ctx), MUTLAK kare zamanları.
// #17 k1104–1115 v4'ündür (C'nin balonu kendi katmanında yükselir); bu katman k1116'da M20 ile açılır. Kapı montajı
//     M20 k1116, M21 k1128 (12'şer k düz kesme); k1140 D iner (30 fps düşüş + 12 fps ezilme), masa, dizüstü ve kupa belirir.
// #18 D masada. Balon #4'ün dilinde açılır; içinde düz silindir saksı 16 k'da çizilir; el yazısı "Bir saksı istiyorum."
//     El yazısı satırları en az 90 k (1,5 sn) ekranda, 16 k'da yazılır. "Biraz daha ince." saksının solunda durur
//     (notYeri'nde gülünç uzayan saksı yazının içinden geçerdi).
// #19 Saksı profilinde vurgu renkli Bézier tutamaçları (4 k arayla BO). D çeker: silindir bel verir (28 k KM) → fazla çeker,
//     saksı gülünç uzar (8 k hızlı + 10 k duraklama), kaşı kalkar (saskin) → geri iter: yivli ağız (28 k KM), onaylar (mutlu).
//     Biçimler nokta enterpolasyonuyla akar (aynı nokta sayısı); her dönüşümün en hızlı karesinde 1 k hayalet kontur (leke).
// #20 GERÇEK 2 (balonda, renkli yer tutucu): FDM nozulu alttan yukarı 40 k KM "basar"; döner tabla sabit hızla döner
//     (yivler kayar + yatay ölçek salınımı). Malzeme vuruşla değişir: PLA 48 k → taş tozu, reçine, epoksi 24'er k (dikey silme
//     çizgisi 12 k) → hızlı tur 4 × 6 k → k1584 D dokunur, %3 "tık" (BO), tabla durur. Oktos sesiyle çip satırı, etkin çipin altı vurgu.
// Saksı profili yereldir (tools/vase radiusFn fikri: r(u) = taban + yoğunluk × profil(u)); modül araca bağlı değil.
// Kol/el üreteçte yok: yer tutucu kalın, yuvarlak uçlu çizgiler (ctx.cizgi). Pozlar 12 fps (ctx.adim), hızlı aksiyon 30 fps.
export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, kisi, balon, odak, YERLESIM, vurus, W, H, PALET, MONO, BOY, VURGU, GRI, GRI2, BALON } = ctx;
  const yer = ctx.yer, adim = ctx.adim, M = PALET.murekkep;
  const SIFIR = { sap: () => 0 };
  const f1 = (v) => (+v).toFixed(1), f3 = (v) => (+v).toFixed(3);
  vurus(17, 'Balon yükselir, M20 M21, D iner', 1104, 1151);
  vurus(18, 'D masada, silindir saksı', 1152, 1247);
  vurus(19, 'Tutamaçlar: bel, uzama, yivli ağız', 1248, 1439);
  vurus(20, 'GERÇEK 2: saksı, 4 malzeme', 1440, 1631);

  const T0 = 1116, T1 = 1632; // k1104–1115 v4'ün (C'nin balonu yükselir); v5 M20 kesmesiyle açılır
  const L = ctx.katman('v5', 10);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(T0));
  tl.set(L.div, { autoAlpha: 0 }, k(T1));
  const gizle = (e, k0, k1) => { gsap.set(e, { autoAlpha: 0 }); tl.set(e, { autoAlpha: 0 }, 0); tl.set(e, { autoAlpha: 1 }, k(k0)); if (k1 != null) tl.set(e, { autoAlpha: 0 }, k(k1)); };

  // Adımlı eğri: değer ease'i izler ama yalnız `ara` karede bir değişir (5 k = 12 fps, 2 k = 30 fps)
  // Çokgen kenarlarını böl: Catmull-Rom köşeleri yuvarlamasın (dizüstü, kupa düz kenarlı kalsın)
  const kenar = (pts, n = 6) => {
    const p = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; for (let j = 0; j < n; j++) p.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
    return p;
  };
  const adimli = (ease, sure, ara = 5) => {
    const f = typeof ease === 'function' ? ease : gsap.parseEase(ease);
    const n = Math.max(1, Math.round(sure / ara));
    return (p) => f(Math.ceil(p * n - 1e-6) / n);
  };

  // ---------- Kişi (C → M20 → M21 → D), aynı yerde (YERLESIM: dört vinyette aynı dil)
  const Y = YERLESIM.kisi, YB = YERLESIM.balon, so = Y.olcek, kutuUst = Y.alt - BOY.boy * so;
  const sahneNok = (lx, ly) => [Y.x + (lx - BOY.en / 2) * so, kutuUst + ly * so]; // kişi kutusu → sahne
  const Dp = ctx.kisiParam('D');
  const bakBalon = yer([1, -1], [0, -1]);
  const ana = kisi(L.svg, ctx.MONTAJ[19], Y); // M20 ile açılır (C v4'te kalır)
  const poz = (kare, o) => tl.call(() => ana.poz(o), null, k(adim(kare)));
  const kes = (kare, o) => tl.call(() => ana.poz(o), null, k(kare)); // düz kesme: kare tam

  // ---------- Kol ve el (yer tutucu; masanın arkasında kalır, kalkınca öne çıkar). Dikey konumlar kişiye bağlı (DY)
  const omuz = sahneNok(330, 336);
  const DY = ctx.DIKEY ? Y.alt - 1926 : 0; // dikeyde kişi eski yerinden (H + 6) bu kadar yukarıda; masa ve el onunla gider
  const dy = (o) => Object.fromEntries(Object.entries(o).map(([a, [x, y]]) => [a, [x, y + DY]]));
  const KOL = yer({
    dinlen: [905, 1052], kalk: [985, 705], bel: [946, 728], hazir: [958, 748], uzat: [1000, 586], it: [984, 700], tikHazir: [1004, 652], tik: [1036, 618],
  }, dy({
    dinlen: [836, 1884], kalk: [884, 1442], bel: [848, 1462], hazir: [856, 1480], uzat: [896, 1330], it: [880, 1442], tikHazir: [890, 1422], tik: [916, 1386],
  }));
  const kolG = el(L.svg, 'g');
  const kol = { x: KOL.dinlen[0], y: KOL.dinlen[1] };
  const tenR = MONO.ten[Dp.ten], kolR = MONO.giysi[Dp.giysi];
  const kolDis = cizgi(kolG, [omuz, omuz, omuz], { kalinlik: 34, tohum: 551, genlik: 1.4 });
  const kolIc = cizgi(kolG, [omuz, omuz, omuz], { kalinlik: 23, renk: kolR, tohum: 552, genlik: 1.4 });
  // Dokunuş: parmak yerine elin önünde saksıya doğru 3 kısa "tık" çizgisi (tek parmak jesti yanlış okunmasın)
  const tikG = el(kolG, 'g');
  const tikH = [-1, 0, 1].map((i) => cizgi(tikG, [omuz, omuz], { kalinlik: 4.5, tohum: 556 + i }));
  const elH = cizgi(kolG, ctx.oval(0, 0, 22, 19, 0, 360, 10), { kapali: true, dolgu: tenR, kalinlik: 5, tohum: 555 });
  function kolUygula() {
    const S = omuz, P = [kol.x, kol.y];
    const dx = P[0] - S[0], dy = P[1] - S[1], uz = Math.hypot(dx, dy) || 1;
    let px = -dy / uz, py = dx / uz;
    if (px < 0) { px = -px; py = -py; } // dirsek dışa (sağa) bükülür
    const dir = [S[0] + dx * 0.5 + px * uz * 0.2, S[1] + dy * 0.5 + py * uz * 0.2];
    kolDis.pts = kolIc.pts = [S, dir, P];
    elH.pts = ctx.oval(P[0], P[1], 22, 19, 0, 360, 10);
    const a0 = Math.atan2(HEDEF[1] - P[1], HEDEF[0] - P[0]);
    tikH.forEach((h, i) => { const a = a0 + (i - 1) * 0.6; h.pts = [[P[0] + Math.cos(a) * 34, P[1] + Math.sin(a) * 34], [P[0] + Math.cos(a) * 54, P[1] + Math.sin(a) * 54]]; });
    for (const h of [kolDis, kolIc, elH, ...tikH]) h.ciz();
  }
  const BY = YB.c[1] - yer(330, 650); // balon eski merkezinden bu kadar aşağıda; saksı balona bağlı
  const HEDEF = yer([1420, 357 + BY], [540, 690 + BY]); // saksının ortası (sahnede)
  kolUygula();
  const kolGit = (k0, sure, hedef, ease = E.EO, ara = 5) =>
    tl.to(kol, { x: KOL[hedef][0], y: KOL[hedef][1], duration: k(sure), ease: adimli(ease, sure, ara), onUpdate: kolUygula }, k(k0));
  // Kol yalnız jest sırasında görünür (dinlenirken masanın arkasında); tık çizgileri yalnız dokunuşta
  gsap.set(kolG, { autoAlpha: 0 }); tl.set(kolG, { autoAlpha: 0 }, 0);
  tl.set(kolG, { autoAlpha: 1 }, k(1265)); tl.set(kolG, { autoAlpha: 0 }, k(1401));
  tl.set(kolG, { autoAlpha: 1 }, k(1569)); tl.set(kolG, { autoAlpha: 0 }, k(1615));
  gizle(tikG, 1585, 1593);

  // ---------- Masa, dizüstü, kupa (k1140'ta D ile birlikte)
  const masaG = el(L.svg, 'g');
  const mY = yer(944, 1792 + DY), onY = yer(1050, 1888 + DY);
  cizgi(masaG, [[-40, mY + 8], [W * 0.35, mY], [W * 0.7, mY - 3], [W + 40, mY + 4], [W + 40, H + 60], [-40, H + 60]], { kapali: true, dolgu: '#ddd7cc', kalinlik: 6, tohum: 561 });
  cizgi(masaG, [[-40, onY + 4], [W * 0.5, onY], [W + 40, onY + 3], [W + 40, H + 60], [-40, H + 60]], { kapali: true, dolgu: '#cbc4b7', kalinlik: 4.5, tohum: 562 });
  const LP = yer(
    { kapak: [[112, 966], [146, 788], [402, 798], [396, 968]], taban: [[86, 966], [424, 968], [436, 992], [74, 990]] },
    { kapak: [[58, 1812], [86, 1648], [318, 1656], [316, 1814]].map(([x, y]) => [x, y + DY]), taban: [[34, 1812], [342, 1814], [354, 1838], [22, 1836]].map(([x, y]) => [x, y + DY]) });
  const dizG = el(masaG, 'g');
  cizgi(dizG, kenar(LP.taban), { kapali: true, dolgu: GRI2, kalinlik: 5, tohum: 563 });
  cizgi(dizG, kenar(LP.kapak), { kapali: true, dolgu: GRI, kalinlik: 6, tohum: 564 }); // markasız kapak arkası
  const KP = yer([1032, 990], [930, 1842 + DY]), kx = KP[0], ky = KP[1];
  const kupG = el(masaG, 'g');
  cizgi(kupG, [[kx + 28, ky - 70], [kx + 58, ky - 64], [kx + 58, ky - 30], [kx + 27, ky - 22]], { kalinlik: 7, tohum: 565 });
  cizgi(kupG, kenar([[kx - 32, ky - 84], [kx + 32, ky - 84], [kx + 29, ky], [kx - 29, ky]], 5), { kapali: true, dolgu: '#e2ddd3', kalinlik: 6, tohum: 566 });
  cizgi(kupG, ctx.oval(kx, ky - 84, 32, 8, 0, 360, 12), { kapali: true, dolgu: '#8d867a', kalinlik: 4, tohum: 567 });
  cizgi(kupG, [[kx - 10, ky - 100], [kx - 18, ky - 122], [kx - 8, ky - 142], [kx - 16, ky - 164]], { kalinlik: 3.4, renk: GRI2, tohum: 568 });
  cizgi(kupG, [[kx + 12, ky - 102], [kx + 5, ky - 120], [kx + 14, ky - 138]], { kalinlik: 3.4, renk: GRI2, tohum: 569 });
  gizle(masaG, 1140);
  gsap.set(dizG, { svgOrigin: `${f1((LP.taban[0][0] + LP.taban[1][0]) / 2)} ${LP.taban[2][1]}`, autoAlpha: 0, scale: 0.6 });
  gsap.set(kupG, { svgOrigin: `${kx} ${ky}`, autoAlpha: 0, scale: 0.6 });
  tl.fromTo(dizG, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: k(14), ease: E.BO, immediateRender: false }, k(1144));
  tl.fromTo(kupG, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: k(14), ease: E.BO, immediateRender: false }, k(1148));

  // ---------- D'nin balonu ve saksı (balonun içinde: balonla birlikte büyür)
  const db = balon(L.svg, { c: YB.c, r: YB.r, noktalar: YERLESIM.noktalar, tohum: 23, koken: YERLESIM.balonKoken });
  const PO = yer([1420, 495 + BY], [540, 840 + BY]), PS = yer(1, 1.1);
  const sG = el(db.ic, 'g', { transform: `translate(${PO[0]} ${PO[1]}) scale(${PS})` });

  // Profil: NU nokta (alt → ağız), yarıçap r(u). Dört biçim aynı nokta sayısında (enterpolasyon = şekil dönüşümü)
  const TAU = Math.PI * 2, KU = 0.24, KA = 0.3, YIV = 12, NU = 25;
  const bell = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
  const yumus = (a, b, u) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
  const US = Array.from({ length: NU }, (_, i) => i / (NU - 1));
  const BICIM = [
    { h: 250, r: () => 86, f: 0 },                                                                           // S0 düz silindir
    { h: 262, r: (u) => 90 - 32 * bell(u, 0.5, 0.2) + 4 * yumus(0.8, 1, u), f: 0 },                          // S1 bel
    { h: 440, r: (u) => 80 - 52 * bell(u, 0.52, 0.22) + 8 * yumus(0.85, 1, u), f: 0 },                       // S2 gülünç uzun
    { h: 276, r: (u) => 74 + 12 * bell(u, 0.28, 0.22) - 14 * bell(u, 0.64, 0.14) + 26 * yumus(0.72, 1, u) ** 2, f: 1 }, // S3 yivli ağız
  ].map((b) => ({ h: b.h, r: US.map(b.r), f: b.f }));
  const bicim = (sv) => {
    const i = Math.min(BICIM.length - 2, Math.max(0, Math.floor(sv))), t = Math.min(1, Math.max(0, sv - i));
    const A = BICIM[i], B = BICIM[i + 1];
    return { h: A.h + (B.h - A.h) * t, r: A.r.map((v, j) => v + (B.r[j] - v) * t), f: A.f + (B.f - A.f) * t };
  };
  const rAt = (b, u) => { const j = Math.min(NU - 1.0001, Math.max(0, u * (NU - 1))), i = Math.floor(j), t = j - i; return b.r[i] + (b.r[i + 1] - b.r[i]) * t; };
  const rho = (b, th, rot) => b.r[NU - 1] * (1 + 0.06 * b.f * (1 - Math.cos(th) ** 8) * Math.cos(YIV * (th - rot))); // yivli ağız (yanlarda söner)
  function siluet(b, rot) {
    const p = [];
    for (let j = 0; j < NU; j++) p.push([b.r[j], -b.h * US[j]]);
    for (let i = 1; i < 16; i++) { const th = -Math.PI * i / 16, q = rho(b, th, rot); p.push([q * Math.cos(th), -b.h + KU * q * Math.sin(th)]); }
    for (let j = NU - 1; j >= 0; j--) p.push([-b.r[j], -b.h * US[j]]);
    for (let i = 1; i < 12; i++) { const th = Math.PI - Math.PI * i / 12; p.push([b.r[0] * Math.cos(th), KA * b.r[0] * Math.sin(th)]); }
    return p;
  }
  function agiz(b, rot) {
    const p = [];
    for (let i = 0; i < 72; i++) { const th = TAU * i / 72, q = rho(b, th, rot); p.push([q * Math.cos(th), -b.h + KU * q * Math.sin(th)]); }
    return p;
  }
  const B3 = bicim(3), H3 = B3.h, R3 = B3.r[NU - 1];

  // Katmanlar: gölge lekesi, döner tabla, saksı (dolgu → malzemeler → çizgiler), tutamaçlar, nozul, dokunma halkası
  const golgeE = el(sG, 'ellipse', { cx: 4, cy: 16, rx: 112, ry: 16, fill: '#e4dfd6' });
  const tablaG = el(sG, 'g');
  const saksiG = el(sG, 'g');
  const govdeDolgu = cizgi(saksiG, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: GRI, kalinlik: 0, tohum: 601, genlik: 0.6 });
  const defs = el(L.svg, 'defs');
  const silYol = el(el(defs, 'clipPath', { id: 'v5-sil' }), 'path');
  const baskiR = el(el(defs, 'clipPath', { id: 'v5-baski' }), 'rect', { x: -200, y: 60, width: 400, height: 0 });
  const silG = el(saksiG, 'g', { 'clip-path': 'url(#v5-sil)' });
  const baskiG = el(silG, 'g', { 'clip-path': 'url(#v5-baski)' });

  // ---------- Malzemeler (renkli düz yer tutucu; gerçek doku/model M3'te). Desenli olanlar dönüşle kayar (260 px periyot)
  const SX0 = -128, SX1 = 128, PER = 260, SK = ctx.SAKSI;
  const agizE = (renk, op = 1) => `<ellipse cx="0" cy="${-H3}" rx="${f1(R3 * 0.93)}" ry="${f1(KU * R3 * 0.93)}" fill="${renk}" opacity="${op}"/>`;
  const zemin = (renk, op = 1) => `<rect x="-170" y="-360" width="340" height="420" fill="${renk}" opacity="${op}"/>`;
  const katmanlar = [];
  for (let y = 40; y > -H3 - 40; y -= 6.5) katmanlar.push(`<path d="M-170 ${f1(y)} Q0 ${f1(y + 44)} 170 ${f1(y)}"/>`);
  const rs = ctx.rng(711), benek = [];
  for (let i = 0; i < 380; i++) {
    const c = ['#5f5a53', '#7d776e', '#efebe4', '#8d867a'][Math.floor(rs() * 4)];
    benek.push(`<circle cx="${f1(-130 + rs() * PER)}" cy="${f1(-340 + rs() * 400)}" r="${(0.9 + rs() * 2.1).toFixed(2)}" fill="${c}"/>`);
  }
  const ic = (d) => { const p = []; for (let j = 1; j < NU; j++) p.push([d * (B3.r[j] - 9), -H3 * US[j]]); return p; };
  const recIc = [-1, 1].map((d) => `<path d="${ctx.yol(ic(d), false, SIFIR)}" fill="none" stroke="#a8651a" stroke-width="2.4" opacity="0.5"/>`).join('');
  const rv = ctx.rng(733), damar = [];
  for (let i = 0; i < 5; i++) damar.push(`<ellipse cx="${f1(-130 + rv() * PER)}" cy="${f1(-300 + rv() * 320)}" rx="${f1(30 + rv() * 40)}" ry="${f1(14 + rv() * 20)}" fill="#d9d3c9" opacity="0.6"/>`);
  for (let i = 0; i < 8; i++) {
    let x = -130 + rv() * PER, y = -350;
    const egim = (0.2 + rv() * 0.4) * (rv() < 0.5 ? -1 : 1), pts = [];
    while (y < 60) { pts.push([x, y]); y += 16 + rv() * 16; x += egim * 18 + (rv() - 0.5) * 22; }
    const altin = i === 3;
    damar.push(`<path d="${ctx.yol(pts, false, SIFIR)}" fill="none" stroke="${altin ? SK.altinDamar : SK.damar}" stroke-width="${altin ? 2.6 : (1.2 + rv() * 2.4).toFixed(2)}" opacity="${altin ? 0.9 : 0.72}" stroke-linecap="round"/>`);
  }
  const MALZ = [
    { ad: 'PLA', taban: zemin('#5f9274') + `<g fill="none" stroke="#45735a" stroke-width="1.5" opacity="0.6">${katmanlar.join('')}</g>`, ust: agizE('#3e6650') },
    { ad: 'tas', taban: zemin('#b8b2a6'), desen: benek.join(''), ust: agizE('#857e72') },
    { ad: 'recine', taban: zemin('#e39a35', 0.5) + recIc, ust: `<rect x="-58" y="-360" width="13" height="420" fill="#fff" opacity="0.55"/><rect x="-36" y="-360" width="5" height="420" fill="#fff" opacity="0.4"/>` + agizE('#b8731c', 0.55) },
    { ad: 'epoksi', taban: zemin(SK.taban), desen: damar.join(''), ust: agizE(SK.agiz) }, // D'nin seçimi = ctx.SAKSI (v6 aynısını gösterir)
  ].map((m, i) => {
    const r = el(el(defs, 'clipPath', { id: `v5-m${i}` }), 'rect', { x: SX0, y: -600, width: i === 0 ? SX1 - SX0 : 0, height: 700 });
    const g = el(baskiG, 'g', { 'clip-path': `url(#v5-m${i})` });
    g.innerHTML = m.taban;
    let desen = null;
    if (m.desen) { desen = el(g, 'g'); desen.innerHTML = `<g>${m.desen}</g><g transform="translate(${PER} 0)">${m.desen}</g>`; }
    el(g, 'g').innerHTML = m.ust;
    return { ...m, r, g, desen };
  });
  // Ortak gölgelendirme (silindir hissi): solda parlak şerit, sağda gölge
  el(baskiG, 'g').innerHTML = '<rect x="-62" y="-360" width="17" height="420" fill="#fff" opacity="0.2"/><rect x="38" y="-360" width="130" height="420" fill="#000" opacity="0.07"/><rect x="68" y="-360" width="100" height="420" fill="#000" opacity="0.07"/>';

  // ---------- Doodle çizgileri (gerçek anında %40'a iner)
  const cizgiG = el(saksiG, 'g');
  const agizH = cizgi(cizgiG, [[0, 0], [1, 0], [0, 1]], { kapali: true, dolgu: GRI2, kalinlik: 4.5, tohum: 602, genlik: 0.6 });
  const yivH = Array.from({ length: YIV }, (_, i) => cizgi(cizgiG, [[0, 0], [0, 1]], { kalinlik: 3.4, tohum: 610 + i, genlik: 0.8 }));
  const govdeKontur = cizgi(cizgiG, [[0, 0], [1, 0], [0, 1]], { kapali: true, kalinlik: 5.5, tohum: 601, genlik: 0.6 });
  const hayalet = el(saksiG, 'path', { fill: 'none', stroke: M, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0 });
  const silCizgi = cizgi(saksiG, [[0, -H3 - 26], [0, 34]], { kalinlik: 5, tohum: 640 });
  gsap.set(silCizgi.g, { autoAlpha: 0 }); tl.set(silCizgi.g, { autoAlpha: 0 }, 0);

  // ---------- Döner tabla (yer tutucu): üst elips + ön bant + 4 işaret (dönüşü gösterir)
  const TR = 150, TRy = TR * KA, TK = 16;
  const bant = [];
  for (let i = 0; i <= 14; i++) { const th = Math.PI * i / 14; bant.push([TR * Math.cos(th), 4 + TRy * Math.sin(th)]); }
  for (let i = 14; i >= 0; i--) { const th = Math.PI * i / 14; bant.push([TR * Math.cos(th), 4 + TK + TRy * Math.sin(th)]); }
  cizgi(tablaG, bant, { kapali: true, dolgu: GRI2, kalinlik: 5, tohum: 650 });
  cizgi(tablaG, ctx.oval(0, 4, TR, TRy, 0, 360, 28), { kapali: true, dolgu: '#ddd7cc', kalinlik: 5, tohum: 651 });
  const isaret = [0, 1, 2, 3].map((i) => cizgi(tablaG, [[0, 0], [0, 1]], { kalinlik: 4, tohum: 652 + i }));

  // ---------- Bézier tutamaçları (vurgu): eksen + 3 çapa (alt, bel, ağız) ve kolları
  const tutG = el(sG, 'g');
  const eksen = el(tutG, 'path', { stroke: VURGU, 'stroke-width': 2.5, 'stroke-dasharray': '10 9', fill: 'none', opacity: 0 });
  const tut = [0, 12, 24].map((j, n) => {
    const dis = el(tutG, 'g'), icG = el(dis, 'g');
    const kollar = (n === 1 ? [1, -1] : [n === 0 ? 1 : -1]).map((yon) => ({
      yon, c: el(icG, 'line', { x1: 0, y1: 0, stroke: VURGU, 'stroke-width': 3, 'stroke-linecap': 'round' }),
      d: el(icG, 'circle', { r: 7.5, fill: BALON, stroke: VURGU, 'stroke-width': 3 }),
    }));
    el(icG, 'rect', { x: -8, y: -8, width: 16, height: 16, fill: VURGU, stroke: M, 'stroke-width': 2 });
    return { j, dis, icG, kollar, st: { s: 0 } };
  });
  const halka = el(tutG, 'circle', { r: 22, fill: 'none', stroke: VURGU, 'stroke-width': 3.5 });
  const halkaSt = { s: 0, i: 1 }, eksenSt = { a: 0 };
  function tutUygula(b) {
    for (const t of tut) {
      const j = t.j, x = b.r[j], y = -b.h * US[j];
      const j0 = Math.max(0, j - 1), j1 = Math.min(NU - 1, j + 1);
      let tx = b.r[j1] - b.r[j0], ty = -b.h * (US[j1] - US[j0]);
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      t.dis.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`);
      t.icG.setAttribute('transform', `scale(${f3(t.st.s)})`);
      t.icG.style.opacity = t.st.s > 0.01 ? 1 : 0;
      for (const kk of t.kollar) {
        const ex = tx * 56 * kk.yon, ey = ty * 56 * kk.yon;
        kk.c.setAttribute('x2', f1(ex)); kk.c.setAttribute('y2', f1(ey));
        kk.d.setAttribute('cx', f1(ex)); kk.d.setAttribute('cy', f1(ey));
      }
    }
    eksen.setAttribute('d', `M0 36 L0 ${f1(-b.h - 44)}`);
    eksen.setAttribute('opacity', f3(eksenSt.a * 0.7));
    const a = tut[halkaSt.i];
    halka.setAttribute('transform', `translate(${f1(b.r[a.j])} ${f1(-b.h * US[a.j])}) scale(${f3(halkaSt.s)})`);
    halka.style.opacity = halkaSt.s > 0.01 ? 1 : 0;
  }

  // ---------- Durum ve çizim (tüm saksı tek fonksiyondan; tween'ler durumu değiştirip bunu çağırır)
  const S = { s: 0, rot: 0, tik: 1, tablaS: 0.6, tablaA: 0 };
  function uygula() {
    const b = bicim(S.s);
    const sil = siluet(b, S.rot);
    govdeDolgu.pts = sil; govdeDolgu.ciz();
    govdeKontur.pts = sil; govdeKontur.ciz();
    silYol.setAttribute('d', ctx.yol(sil, true, SIFIR));
    agizH.pts = agiz(b, S.rot); agizH.ciz();
    yivH.forEach((h, i) => {
      const ph = (i + 0.5) * TAU / YIV + S.rot, sn = Math.sin(ph), cs = Math.cos(ph);
      const op = b.f * Math.min(1, Math.max(0, sn * 2.5));
      h.g.style.opacity = f3(op);
      if (op <= 0) return;
      const pts = [];
      for (let m = 0; m <= 5; m++) { const u = 0.58 + 0.42 * m / 5, r = rAt(b, u), K = KA + (KU - KA) * u; pts.push([r * cs, -b.h * u + K * r * sn]); }
      h.pts = pts; h.ciz();
    });
    tutUygula(b);
    // Dönüş: yatay ölçek salınımı (±%2) + desen kayması + tabla işaretleri
    const sx = 1 - 0.02 * (1 - Math.cos(2 * S.rot)) / 2;
    saksiG.setAttribute('transform', `scale(${f3(S.tik * sx)} ${f3(S.tik)})`);
    const kay = -(((S.rot * 85) % PER) + PER) % PER;
    for (const m of MALZ) if (m.desen) m.desen.setAttribute('transform', `translate(${f1(kay)} 0)`);
    tablaG.setAttribute('transform', `scale(${f3(S.tablaS * S.tik)})`);
    tablaG.style.opacity = f3(S.tablaA);
    isaret.forEach((h, i) => {
      const ph = i * Math.PI / 2 + S.rot, c = Math.cos(ph), sn = Math.sin(ph);
      h.pts = [[TR * 0.7 * c, 4 + TRy * 0.7 * sn], [TR * 0.9 * c, 4 + TRy * 0.9 * sn]]; h.ciz();
    });
  }
  uygula();

  // ---------- FDM nozulu (#20): kırpma alttan yukarı büyür, nozul zikzakla yükselir
  const nozDis = el(sG, 'g'), nozG = el(nozDis, 'g');
  cizgi(nozG, [[-34, -70], [34, -70], [34, -30], [-34, -30]], { kapali: true, dolgu: GRI, tohum: 661, kalinlik: 4.5 });
  cizgi(nozG, [[-20, -30], [20, -30], [6, -6], [-6, -6]], { kapali: true, dolgu: GRI2, tohum: 662, kalinlik: 4.5 });
  cizgi(nozG, [[0, -70], [0, -170]], { tohum: 663, kalinlik: 3 });
  const baski = { p: 0 };
  function baskiUygula() {
    const yTop = 44 - (44 + H3 + 40) * baski.p;
    baskiR.setAttribute('y', f1(yTop)); baskiR.setAttribute('height', f1(80 - yTop));
    const u = Math.min(1, Math.max(0, -yTop / H3)), rr = rAt(B3, u);
    const xN = Math.sin(baski.p * Math.PI * 11) * rr * 0.9;
    nozG.setAttribute('transform', `translate(${f1(xN)} ${f1(yTop - 2)}) scale(0.85)`);
  }
  baskiUygula();
  gizle(nozDis, 1440);
  const dalga = el(sG, 'circle', { cx: 0, cy: f1(-H3 * 0.5), r: 30, fill: 'none', stroke: VURGU, 'stroke-width': 5, opacity: 0 });

  // ---------- GERÇEK etiketi (animatik işareti). "Tamam, bu." notYeri'nde k1486'ya dek durur; etiket ondan sonra gelir
  const LBL = yer([1012, 168 + BY], [176, 488 + BY]);
  const etiket = ctx.gercekEtiket(L.svg, 'GERÇEK', LBL[0], LBL[1]);
  gizle(etiket, 1488);

  // ==================== #17 (1116–1151; 1104–1115 v4'te): kapı montajı M20, M21 düz kesme; D iner
  kes(T0, { p: ctx.MONTAJ[19], ifade: 'merak', bakis: [0, -1] });
  kes(1128, { p: ctx.MONTAJ[20], ifade: 'notr', bakis: [1, -1] });
  // k1140: D iner (30 fps düşüş, masanın arkasına), 12 fps ezilme ve toparlanma
  kes(1140, { p: Dp, ifade: 'notr', bakis: [0, 0] });
  const dus = yer(140, 140);
  gsap.set(ana.g, { svgOrigin: `${Y.x} ${Y.alt}` });
  tl.fromTo(ana.g, { y: -dus }, { y: 0, duration: k(6), ease: adimli('power2.in', 6, 2), immediateRender: false }, k(1140));
  tl.to(ana.g, { scaleX: 1.04, scaleY: 0.95, duration: k(5), ease: 'steps(1)' }, k(1145));
  tl.to(ana.g, { scaleX: 1, scaleY: 1, duration: k(10), ease: 'steps(2)' }, k(1150));
  poz(1150, { ifade: 'merak', bakis: bakBalon });

  // ==================== #18 (1152–1247): balon açılır, düz silindir saksı 16 k, "Bir saksı istiyorum."
  db.ac(1152);
  gizle(sG, 1180);
  tl.fromTo(govdeKontur.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: E.EO, immediateRender: false }, k(1180));
  tl.set(govdeKontur.yol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(1193));
  tl.fromTo(agizH.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(10), ease: E.EO, immediateRender: false }, k(1186));
  tl.set(agizH.yol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(1197));
  gsap.set([govdeDolgu.g, agizH.dolgu, golgeE], { opacity: 0 });
  tl.fromTo([govdeDolgu.g, agizH.dolgu, golgeE], { opacity: 0 }, { opacity: 1, duration: k(10), ease: 'none', immediateRender: false }, k(1186));
  const NY = YERLESIM.notYeri;
  const not1 = ctx.elYazisi(L.div, ctx.metin('Bir saksı istiyorum.', "I'd like a planter."), NY);
  // "Biraz daha ince." saksının solunda (uzayan saksı notYeri'nden geçer); 90 k ekranda kalması için orada durur
  const NY2 = yer({ x: 960, y: 300 + BY, boyut: 56 }, { x: 92, y: 560 + BY, boyut: 52 });
  const not2 = ctx.elYazisi(L.div, ctx.metin('Biraz daha ince.', 'A bit slimmer.'), NY2);
  const not3 = ctx.elYazisi(L.div, ctx.metin('Tamam, bu.', 'Yes, that one.'), NY);
  ctx.yazElYazisi(not1, 1176, 16); // satır kuralı: 16 k'da yazılır, 90 k ekranda
  poz(1180, { ifade: 'notr', bakis: bakBalon });
  poz(1226, { ifade: 'merak', bakis: bakBalon });

  // ==================== #19 (1248–1439): tutamaçlar; bel → gülünç uzama → yivli ağız
  ctx.silElYazisi(not1, 1266);
  tl.to(eksenSt, { a: 1, duration: k(8), ease: 'none', onUpdate: uygula }, k(1248));
  tut.forEach((t, i) => tl.to(t.st, { s: 1, duration: k(8), ease: E.BO, onUpdate: uygula }, k(1252 + i * 4)));
  ctx.yazElYazisi(not2, 1278, 16);
  poz(1250, { ifade: 'merak', bakis: bakBalon });
  // Bel: el kalkar (tutar), orta çapayı içe çeker; saksı 28 k KM ile bel verir
  kolGit(1264, 15, 'kalk');
  tl.to(halkaSt, { s: 1, duration: k(6), ease: E.BO, onUpdate: uygula }, k(1276));
  poz(1280, { ifade: 'merak', bakis: bakBalon });
  tl.to(S, { s: 1, duration: k(28), ease: E.KM, onUpdate: uygula }, k(1282));
  kolGit(1282, 28, 'bel', E.KM);
  const leke = (kare, sv) => {
    tl.set(hayalet, { attr: { d: ctx.yol(siluet(bicim(sv), 0), true, SIFIR) }, opacity: 0.35 }, k(kare));
    tl.set(hayalet, { opacity: 0 }, k(kare + 1));
  };
  leke(1295, 0.3);
  poz(1310, { ifade: 'mutlu', bakis: bakBalon });
  tl.to(halkaSt, { s: 0, duration: k(6), ease: E.EI, onUpdate: uygula }, k(1310));
  ctx.silElYazisi(not2, 1368);
  // Fazla çeker: hazırlık (el biraz iner), ağız çapası yukarı, 8 k hızlı (30 fps el), 10 k duraklama, kaş kalkar
  tl.call(() => { halkaSt.i = 2; uygula(); }, null, k(1318));
  tl.to(halkaSt, { s: 1, duration: k(6), ease: E.BO, onUpdate: uygula }, k(1320));
  poz(1320, { ifade: 'merak', bakis: [1, 0] });
  kolGit(1320, 6, 'hazir', 'power2.out', 2);
  tl.to(S, { s: 2, duration: k(8), ease: E.EO, onUpdate: uygula }, k(1330));
  kolGit(1330, 8, 'uzat', E.EO, 2);
  leke(1331, 1.12);
  poz(1340, { ifade: 'saskin', bakis: yer([1, -1], [0.5, -1]) });
  // Geri iter: 28 k KM, yivli ağız belirir
  poz(1350, { ifade: 'sikkin', bakis: bakBalon });
  tl.to(S, { s: 3, duration: k(28), ease: E.KM, onUpdate: uygula }, k(1350));
  kolGit(1350, 28, 'it', E.KM);
  leke(1363, 2.3);
  tl.to(halkaSt, { s: 0, duration: k(6), ease: E.EI, onUpdate: uygula }, k(1378));
  // Onaylar: mutlu, başını bir kez sallar (12 fps), el iner; "Tamam, bu."
  poz(1380, { ifade: 'mutlu', bakis: bakBalon });
  const sal = BOY.boy * so * 0.03;
  tl.to([ana.g, kolG], { y: sal, duration: k(6), ease: 'steps(2)' }, k(1385));
  tl.to([ana.g, kolG], { y: 0, duration: k(10), ease: 'steps(2)' }, k(1395));
  kolGit(1386, 15, 'dinlen');
  ctx.yazElYazisi(not3, 1382, 16);
  tl.to(eksenSt, { a: 0, duration: k(12), ease: E.EI, onUpdate: uygula }, k(1404));
  tut.forEach((t, i) => tl.to(t.st, { s: 0, duration: k(10), ease: E.EI, onUpdate: uygula }, k(1404 + i * 2)));
  ctx.silElYazisi(not3, 1472); // #20'ye taşar (k1486'da biter), etiket ondan sonra

  // ==================== #20 (1440–1631): GERÇEK 2 (balonda)
  poz(1440, { ifade: 'merak', bakis: bakBalon });
  tl.to(golgeE, { opacity: 0, duration: k(6), ease: 'none' }, k(1440));
  tl.fromTo(S, { tablaS: 0.6, tablaA: 0 }, { tablaS: 1, tablaA: 1, duration: k(12), ease: E.BO, onUpdate: uygula, immediateRender: false }, k(1440));
  tl.fromTo(baski, { p: 0 }, { p: 1, duration: k(40), ease: E.KM, onUpdate: baskiUygula, immediateRender: false }, k(1440));
  tl.to(nozDis, { y: -320, autoAlpha: 0, duration: k(10), ease: E.EI }, k(1480));
  // Mürekkep hat %40'a iner (30 k), gri doodle dolgusu söner (gerçek malzeme görünür)
  tl.to(cizgiG, { opacity: 0.4, duration: k(30), ease: 'none' }, k(1480));
  tl.to([govdeDolgu.g, agizH.dolgu], { opacity: 0, duration: k(10), ease: 'none' }, k(1480));
  // Tabla sabit hızla döner (2,4 sn'de bir tur); k1584 dokunuşla EO yavaşlayıp durur
  const OM = TAU / 144;
  tl.fromTo(S, { rot: 0 }, { rot: OM * 104, duration: k(104), ease: 'none', onUpdate: uygula, immediateRender: false }, k(1480));
  tl.to(S, { rot: OM * 104 + OM * 18 / 6.25, duration: k(18), ease: E.EO, onUpdate: uygula }, k(1584));
  // Malzeme geçişleri: dikey silme çizgisi 12 k (yeni malzeme solda, eski sağda kalır); hızlı tur düz kesme
  let etkin = 0;
  const silme = (k0, yeni) => {
    const eski = etkin; etkin = yeni;
    const st = { x: SX0 };
    tl.set(silCizgi.g, { autoAlpha: 1 }, k(k0));
    tl.fromTo(st, { x: SX0 }, {
      x: SX1, duration: k(12), ease: E.KM, immediateRender: false, onUpdate: () => {
        MALZ[yeni].r.setAttribute('x', SX0); MALZ[yeni].r.setAttribute('width', f1(st.x - SX0));
        MALZ[eski].r.setAttribute('x', f1(st.x)); MALZ[eski].r.setAttribute('width', f1(SX1 - st.x));
        silCizgi.pts = [[st.x, -H3 - 26], [st.x, 34]]; silCizgi.ciz();
      },
    }, k(k0));
    tl.set(silCizgi.g, { autoAlpha: 0 }, k(k0 + 12));
  };
  const kesme = (k0, yeni) => {
    const eski = etkin; etkin = yeni;
    tl.call(() => {
      MALZ[eski].r.setAttribute('width', 0);
      MALZ[yeni].r.setAttribute('x', SX0); MALZ[yeni].r.setAttribute('width', SX1 - SX0);
    }, null, k(k0));
  };
  const SECIM = Math.max(0, MALZ.findIndex((m) => m.ad === SK.malzeme)); // D'nin dokunduğu malzeme (ctx.SAKSI: epoksi); hızlı tur bunda biter
  silme(1488, 1); silme(1512, 2); silme(1536, 3);
  const tur = [0, 1, 2, 3].map((i) => (SECIM + 1 + i) % 4);
  tur.forEach((m, i) => kesme(1560 + i * 6, m));
  poz(1495, { ifade: 'mutlu', bakis: bakBalon });
  poz(1560, { ifade: 'merak', bakis: bakBalon });
  // k1584: D dokunur (el 30 fps ileri), dalga halkası, %3 tık (BO), tabla durur
  kolGit(1568, 12, 'tikHazir');
  poz(1575, { ifade: 'notr', bakis: bakBalon });
  kolGit(1584, 4, 'tik', 'power2.out', 2);
  kolGit(1590, 6, 'tikHazir', 'power2.out', 2);
  poz(1585, { ifade: 'mutlu', bakis: bakBalon });
  tl.fromTo(dalga, { attr: { r: 30 }, opacity: 1 }, { attr: { r: 150 }, opacity: 0, duration: k(16), ease: E.EO, immediateRender: false }, k(1584));
  tl.to(S, { tik: 1.03, duration: k(6), ease: E.BO, onUpdate: uygula }, k(1584));
  tl.to(S, { tik: 1, duration: k(8), ease: E.EO, onUpdate: uygula }, k(1590));
  kolGit(1600, 15, 'dinlen');
  poz(1605, { ifade: 'mutlu', bakis: [0, 0] });

  // ---------- Oktos sesi: çip satırı (yerel HTML; etkin çipin altı vurgu). ?yazi=0 ise yok
  if (ctx.YAZI) {
    if (!document.getElementById('v5-stil')) {
      const st = document.createElement('style');
      st.id = 'v5-stil';
      st.textContent = '.v5-cipler{display:flex;justify-content:center;align-items:flex-end;white-space:nowrap}'
        + '.v5-m{display:inline-block;overflow:hidden;padding:0 .06em .34em;vertical-align:bottom}'
        + '.v5-i{display:inline-block;position:relative}'
        + '.v5-c{position:absolute;left:0;right:.16em;bottom:-.24em;height:.2em;background:var(--vurgu);transform:scaleX(0);transform-origin:0 50%}'
        + '.v5-a{display:inline-block;padding:0 .35em;opacity:.55}';
      document.head.appendChild(st);
    }
    const ad = ctx.DIL === 'en' ? ['PLA', 'Stone', 'Resin', 'Epoxy'] : ['PLA', 'Taş tozu', 'Reçine', 'Epoksi'];
    const satir = document.createElement('div');
    satir.className = 'yz etiket v5-cipler';
    satir.lang = ctx.DIL; // büyük harf dile göre (EN'de "RESİN" olmasın)
    Object.assign(satir.style, yer({ left: '1080px', top: '806px', width: '700px', fontSize: '30px' }, { left: '40px', top: '236px', width: '1000px', fontSize: '32px' }));
    const icler = [], alt = [], maskeler = [];
    ad.forEach((a, i) => {
      if (i) { const m = document.createElement('span'); m.className = 'v5-m'; const s = document.createElement('span'); s.className = 'v5-i v5-a'; s.textContent = '·'; m.appendChild(s); satir.appendChild(m); maskeler.push(s); }
      const m = document.createElement('span'); m.className = 'v5-m';
      const s = document.createElement('span'); s.className = 'v5-i'; s.textContent = a;
      const c = document.createElement('span'); c.className = 'v5-c';
      s.appendChild(c); m.appendChild(s); satir.appendChild(m);
      icler.push(s); alt.push(c); maskeler.push(s);
    });
    ctx.yaziKatmani.appendChild(satir);
    gizle(satir, 1446, T1);
    gsap.set(icler, { opacity: 0.5 });
    tl.fromTo(maskeler, { yPercent: 110 }, { yPercent: 0, duration: k(34), ease: E.EO, stagger: k(4), immediateRender: false }, k(1446));
    const cipSec = (i, k0, sure) => {
      icler.forEach((s, j) => tl.to(s, { opacity: j === i ? 1 : 0.5, duration: k(sure), ease: 'none' }, k(k0)));
      alt.forEach((c, j) => tl.to(c, { scaleX: j === i ? 1 : 0, duration: k(sure), ease: j === i ? E.EO : E.EI }, k(k0)));
    };
    cipSec(0, 1452, 8); cipSec(1, 1488, 8); cipSec(2, 1512, 8); cipSec(3, 1536, 8);
    tur.forEach((m, i) => cipSec(m, 1560 + i * 6, 3));
    icler.forEach((s, j) => { if (j !== SECIM) tl.to(s, { opacity: 0.3, duration: k(8), ease: 'none' }, k(1586)); });
    tl.fromTo(icler[SECIM], { scale: 1.08 }, { scale: 1, duration: k(10), ease: E.BO, immediateRender: false }, k(1584));
    tl.to(maskeler, { yPercent: -110, duration: k(18), ease: E.EI, stagger: k(2) }, k(1598));
    tl.to(alt, { scaleX: 0, duration: k(8), ease: E.EI }, k(1604));
  }

  // ---------- Kamera. Balonun tepe tümseği elipsin ~120 px üstüne çıkar (BU, dünya): yatayda s = 1'de bile kadrajın
  // 30 px dışında kalıyordu. Bu yüzden kamera tepeyi sabit tutar, itiş aşağı ve yanlara açılır (ölü kare yok).
  // Yatay: M20 kesmesinde (k1116) tepe 6 px'e iner; #17–#19 doğrusal %4 itiş, #20'de 60 k KM ile %0,8 daha, sonra doğrusal.
  //   Balon s ≈ 1,05'te çip satırının (top 800) üstünde biter. Dikey: itiş %2 (balon kenarlara değmesin), k1410'dan
  //   40 k KM ile aşağı iner ve 0,97'ye çekilir: tepe çip satırının altına (UE) oturur, D'nin yüzü alt %20 bandına girmez.
  const BU = YB.c[1] - YB.r[1] - 120;
  if (ctx.DIKEY) {
    const P1 = [540, 970], UE = 304;
    ctx.kameraKoy(T0, { x: 0, y: 0, scale: 1 });
    tl.fromTo(ctx.kamera, odak(P1[0], P1[1], 1, P1[0], P1[1]), { ...odak(P1[0], P1[1], 1.02, P1[0], P1[1]), duration: k(1410 - T0), ease: 'none', immediateRender: false }, k(T0));
    ctx.kameraGit(1410, 40, odak(YB.c[0], BU, 0.97, YB.c[0], UE));
    tl.to(ctx.kamera, { ...odak(YB.c[0], BU, 0.978, YB.c[0], UE), duration: k(T1 - 1 - 1450), ease: 'none' }, k(1450));
  } else {
    const PX = 970, UE = 6, kam = (sc) => odak(PX, BU, sc, PX, UE);
    ctx.kameraKoy(T0, kam(1));
    tl.fromTo(ctx.kamera, kam(1), { ...kam(1.04), duration: k(1440 - T0), ease: 'none', immediateRender: false }, k(T0));
    ctx.kameraGit(1440, 60, kam(1.048));
    tl.to(ctx.kamera, { ...kam(1.052), duration: k(T1 - 1 - 1500), ease: 'none' }, k(1500));
  }
}
