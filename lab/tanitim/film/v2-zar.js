// Vinyet 2, ZAR (A karakteri, #4–#9, k240–623). Kalıp v1-kanca.js ile aynı: kur(ctx), MUTLAK kare zamanları.
// #4 Balon doğar, d6 doodle çizilir; el yazısı "Bir zar…" (k254, 16 k; k330'a dek kalır, satır 1,5 sn).
// #5 A başını iki kez sallar (16 k); d6 → d20 (altıgen dış hat sabit, iç çizgiler akar, ortada 1 k leke); set yaya
//    dağılır (6 k arayla, BO); el yazısı "FRP zarı olsun!" (k342, 16 k) ve altına 12 k'da vurgu çizgisi.
// #6 "+ şeffaf." notu düşer (alt çizgi 10 k); A gözlerini kısıp sırıtır ('kisik'); doodle zarlarda cam parıltısı çizgileri.
// #7 Bilinçli sessizlik: kaynama donar (balonda çekirdeğin .donuk'u, A ve çizgilerde pencereye bağlı .donuk),
//    kamera 24 k KM üstel ölçekle balona dalar; balon kırpılmaz (yatayda balonun tamamı kadraja sığar, dikeyde içerik).
// #8 GERÇEK 1 (yer tutucu): nozul zarların üstünden geçer, renkli yarı saydam zarlar yukarıdan aşağı dolar, kâğıda
//    renkli ışık lekesi düşer; mürekkep hat %40'ta kalır, 30 k'da söner; parıltı 40 k; k540'ta kamera geri çıkar.
// #9 Balon küçülüp A'nın başının üstünde kalır (18 k Eİ); kapı montajı M16, M17 (2 × 12 k düz kesme), balon yükselir.
// Kamera kadrajı balonun gerçek sınırından (konturun örneklenmiş noktaları) hesaplanır: YERLESIM değişse de kırpmaz.
// Zar şekilleri ve d6 → d20 dönüşüm mantığı lab/tanitim/zar.js'ten kopya. Nozul çizimi v1-kanca.js'ten kopya.
// Nesne dönüşümleri SVG transform özniteliğiyle (attr) canlandırılır: geri sarma ve kare kare çekimde durum kendiliğinden doğru.
// Animatik notu: kol/el yok (bu vinyette gerekmedi); GERÇEK 1 düz renkli yer tutucudur, 3B (three.js) sonra gelir.

// ---------- Doodle zarlar (birim boy, merkez 0,0). d6 ve d20'nin dış hattı aynı altıgen: dönüşüm iç çizgilerde
const ALTIGEN = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26], [0, -0.52]];
const ZAR = {
  d4: { dis: [[-0.5, 0.42], [0, -0.5], [0.5, 0.42], [-0.5, 0.42]], ic: [[[0, -0.5], [0.06, 0.12]], [[-0.5, 0.42], [0.06, 0.12], [0.5, 0.42]]] },
  d6: { dis: ALTIGEN, ic: [[[-0.46, -0.26], [0, -0.01], [0.46, -0.26]], [[0, -0.01], [0, 0.52]]] },
  d8: { dis: [[0, -0.54], [0.43, 0], [0, 0.54], [-0.43, 0], [0, -0.54]], ic: [[[-0.43, 0], [0.1, 0.06], [0.43, 0]], [[0, -0.54], [0.1, 0.06], [0, 0.54]]] },
  d10: { dis: [[0, -0.54], [0.45, -0.06], [0.37, 0.24], [0, 0.5], [-0.37, 0.24], [-0.45, -0.06], [0, -0.54]], ic: [[[-0.45, -0.06], [-0.16, 0.12], [0, 0.5]], [[0.45, -0.06], [0.16, 0.12], [0, 0.5]], [[-0.16, 0.12], [0, -0.54], [0.16, 0.12]], [[-0.16, 0.12], [0.16, 0.12]]] },
  d12: { dis: [[-0.18, -0.5], [0.18, -0.5], [0.44, -0.3], [0.52, 0.04], [0.36, 0.38], [0.04, 0.52], [-0.3, 0.44], [-0.5, 0.16], [-0.48, -0.2], [-0.18, -0.5]], ic: [[[0, -0.22], [0.22, -0.06], [0.14, 0.2], [-0.14, 0.2], [-0.22, -0.06], [0, -0.22]], [[0, -0.22], [0, -0.5]], [[0.22, -0.06], [0.5, -0.12]], [[0.14, 0.2], [0.3, 0.42]], [[-0.14, 0.2], [-0.3, 0.42]], [[-0.22, -0.06], [-0.5, -0.12]]] },
  d20: { dis: ALTIGEN, ic: [[[-0.27, 0.16], [0, -0.3], [0.27, 0.16], [-0.27, 0.16]], [[0, -0.52], [-0.27, 0.16]], [[0, -0.52], [0.27, 0.16]], [[-0.46, -0.26], [-0.27, 0.16]], [[0.46, -0.26], [0.27, 0.16]], [[0, 0.52], [-0.27, 0.16]], [[0, 0.52], [0.27, 0.16]]] },
};
const SIRA = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const PIP = [[0, -0.26], [0.2, 0.2], [-0.2, 0.2], [-0.24, 0.02]];
// Cam parıltısı: her zarın bir yüzünün içinde, iç çizgilere ve noktalara değmeyen iki kısa paralel çizgi
const PARILTI = {
  d4: [[[-0.24, 0.12], [-0.13, -0.08]], [[-0.15, 0.13], [-0.08, 0.01]]],
  d6: [[[0.27, 0.04], [0.37, -0.1]], [[0.31, 0.16], [0.4, 0.03]]],
  d8: [[[-0.22, -0.04], [-0.12, -0.2]], [[-0.13, -0.01], [-0.07, -0.11]]],
  d10: [[[-0.28, -0.08], [-0.18, -0.24]], [[-0.2, -0.02], [-0.14, -0.12]]],
  d12: [[[-0.1, 0.1], [-0.02, -0.06]], [[0.0, 0.13], [0.06, 0.03]]],
  d20: [[[-0.12, 0.08], [-0.04, -0.06]], [[-0.03, 0.11], [0.02, 0.03]]],
};
// GERÇEK 1 yer tutucu renkleri ve #8'deki dönüş açıları (15–20°). d20 yeşil: turuncu vurgu rengine (#bf5519) karışmasın
const RENK = ['#e8a33d', '#2fa59a', '#7f5bd6', '#e0607e', '#3f7fd6', '#3f9e45'];
const ACI = [16, -18, 20, -15, 17, -19];

const f2 = (v) => (+v).toFixed(2);
const tr = ([x, y]) => `translate(${f2(x)} ${f2(y)})`;
const poly = (pts, kapali = true) => 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L') + (kapali ? 'Z' : '');
const kenet = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function koyu(hex, t = 0.38) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - t)));
  return `rgb(${c.join(',')})`;
}

export function kur(ctx) {
  const { k, E, tl, gsap, el, YERLESIM, PALET, BOY, W, H, DIKEY, VURGU } = ctx;
  const M = PALET.murekkep;
  ctx.vurus(4, 'Balon, d6', 240, 287);
  ctx.vurus(5, 'd6 → d20, set', 288, 383);
  ctx.vurus(6, '+ şeffaf', 384, 455);
  ctx.vurus(7, 'Sessizlik, dalış', 456, 479);
  ctx.vurus(8, 'GERÇEK 1 · zar seti', 480, 575);
  ctx.vurus(9, 'Balon küçülür, M16 M17', 576, 623);

  // ---------- Katman: yalnız k240–623 görünür (v1 k240'ta gizlenir, v3 k624'te devralır)
  const L = ctx.katman('v2', 10);
  gsap.set(L.div, { autoAlpha: 0 });
  tl.set(L.div, { autoAlpha: 0 }, 0);
  tl.set(L.div, { autoAlpha: 1 }, k(240));
  tl.set(L.div, { autoAlpha: 0 }, k(624));
  const defs = el(L.svg, 'defs');

  // ---------- #7 sessizliği: k456–479 arası kaynama donar. Zamana bağlı (geri sarmada da doğru)
  const DON0 = k(456), DON1 = k(480);
  const donukMu = () => { const t = tl.time(); return t >= DON0 - 1e-4 && t < DON1 - 1e-4; };
  const dondur = (h) => { Object.defineProperty(h, 'donuk', { get: donukMu, set() {}, configurable: true }); return h; };

  // ---------- Yerleşim
  const Y = YERLESIM.kisi, BC = YERLESIM.balon.c, BR = YERLESIM.balon.r, NOT = YERLESIM.notYeri;
  const S = ctx.yer(112, 120);                                   // yaydaki zar boyu
  const HS = ctx.yer(180, 200);                                  // balonun ortasındaki tek zar (d6 / d20) boyu
  const MERKEZ = ctx.yer([BC[0], BC[1] + 8], [BC[0], BC[1] + 90]);
  // Yatay: tek "gülümseyen yay" (zar.js). Dikey: dar ekrana iki sıra yay (3 + 3)
  const YUVA = SIRA.map((_, i) => {
    if (!DIKEY) { const u = (i - 2.5) / 2.5; return [BC[0] + u * 330, BC[1] + 8 + 44 * u * u]; }
    const u = (i % 3) - 1;
    return [BC[0] + u * 175, BC[1] + (i < 3 ? -5 : 150) + 12 * u * u];
  });
  const sacUst = Y.alt - Y.olcek * (BOY.boy - 50);              // A'nın saçının tepesi (yaklaşık)

  // ---------- A (kişi). k240'ta v1'deki son pozla birebir: merak, bakış sağ üst
  const kisiSar = el(L.svg, 'g', { transform: 'rotate(0 0 0)' });
  const A = dondur(ctx.kisi(kisiSar, ctx.kisiParam('A'), Y));
  A.poz({ ifade: 'merak', bakis: [1, -1] });
  const poz = (n, o) => tl.call(() => A.poz(o), null, k(ctx.adim(n)));
  poz(240, { p: ctx.kisiParam('A'), ifade: 'merak', bakis: [1, -1] });

  // ---------- Balon (+ içeriği) tek sarmalayıcıda: #9'da birlikte küçülür
  const Wb = el(L.svg, 'g', { transform: 'translate(0 0) scale(1)' });
  const B = ctx.balon(Wb, { c: BC, r: BR, noktalar: YERLESIM.noktalar, tohum: 5, koken: YERLESIM.balonKoken });
  B.ac(240); // noktalar 240–256, bulut 250–264 (oturur)
  // #7 sessizliği: çekirdeğin balon.donuk'u. Değer çağrının konumundan değil oynatma kafasından okunur: geri sarmada da doğru
  for (const n of [456, 480]) tl.call(() => { B.donuk = donukMu(); }, null, k(n));

  // GERÇEK 1 katmanları balonun üstünde, doodle'ın altında: ışık lekeleri → renkli zarlar
  const lekeKat = el(Wb, 'g');
  const gKat = el(Wb, 'g');
  const zKat = el(Wb, 'g');

  // ---------- Doodle zarlar: konum (translate) > mürekkep saydamlığı > dönüş+ölçek > leke (ezme) > çizgiler
  const cizgiNit = (w) => ({ fill: 'none', stroke: M, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const zarlar = SIRA.map((ad, i) => {
    const pos = el(zKat, 'g', { transform: tr(MERKEZ) });
    const mur = el(pos, 'g');
    const tek = ad === 'd6' || ad === 'd20';
    const don = el(mur, 'g', { transform: tek ? `rotate(0) scale(${HS})` : 'rotate(-25) scale(40)' });
    const leke = el(don, 'g', { transform: 'scale(1 1)' });
    const dis = el(leke, 'path', cizgiNit(0.042));
    const ic = ZAR[ad].ic.map(() => el(leke, 'path', cizgiNit(0.032)));
    const pip = ad === 'd6' ? PIP.map(() => el(leke, 'circle', { r: 0, fill: M })) : [];
    const parG = el(leke, 'g');
    const par = PARILTI[ad].map(() => el(parG, 'path', cizgiNit(0.026)));
    gsap.set([pos, parG], { autoAlpha: 0 });
    return {
      ad, i, pos, mur, don, leke, dis, ic, pip, parG, par,
      spDis: ctx.sapma(300 + i * 10, 0.012), spIc: ic.map((_, j) => ctx.sapma(301 + i * 10 + j, 0.012)),
      spPip: ctx.sapma(200 + i, 0.012), spPar: par.map((_, j) => ctx.sapma(400 + i * 10 + j, 0.012)),
    };
  });
  const zarCiz = (n) => {
    if (donukMu()) return;
    for (const z of zarlar) {
      z.dis.setAttribute('d', ctx.yol(ZAR[z.ad].dis, false, z.spDis(n)));
      ZAR[z.ad].ic.forEach((pts, j) => z.ic[j].setAttribute('d', ctx.yol(pts, false, z.spIc[j](n))));
      z.pip.forEach((c, j) => { c.setAttribute('cx', f2(PIP[j][0] + z.spPip(n).sap(j, 0))); c.setAttribute('cy', f2(PIP[j][1] + z.spPip(n).sap(j, 1))); });
      PARILTI[z.ad].forEach((pts, j) => z.par[j].setAttribute('d', ctx.yol(pts, false, z.spPar[j](n))));
    }
  };
  zarCiz(0);
  ctx.kaynayanlar.add(zarCiz);
  const z6 = zarlar[1], z20 = zarlar[5];

  // ---------- El yazısı (karakterin sesi) ve vurgu alt çizgileri
  const ACI_Y = -3;
  const not1 = ctx.elYazisi(L.div, ctx.metin('Bir zar…', 'A die…'), { x: NOT.x, y: NOT.y, aci: ACI_Y });
  const not2 = ctx.elYazisi(L.div, ctx.metin('FRP zarı olsun!', 'RPG dice!'), { x: NOT.x, y: NOT.y, aci: ACI_Y });
  const not3 = ctx.elYazisi(L.div, ctx.metin('+ <b>şeffaf</b>.', '+ <b>clear</b>.'), { x: NOT.x + 30, y: NOT.y + 80, aci: ACI_Y });
  // Alt çizgi noktaları: <p>'nin kutusu, -3° dönüş (CSS köken 0 50%). Yazı tipi yüklü olsun diye çizimden hemen önce yeniden ölçülür
  const altNoktalar = (p, hedef) => {
    const x = parseFloat(p.style.left), y = parseFloat(p.style.top), h = p.offsetHeight || 62;
    const x0 = hedef === p ? 0 : hedef.offsetLeft, w = hedef.offsetWidth || 200, yy = h + 2;
    const ham = [[x0 - 6, yy + 1], [x0 + w * 0.35, yy - 2], [x0 + w * 0.7, yy], [x0 + w + 8, yy - 3]];
    const a = ACI_Y * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), oy = h / 2;
    return ham.map(([px, py]) => [x + px * c - (py - oy) * s, y + oy + px * s + (py - oy) * c]);
  };
  const alt2 = dondur(ctx.cizgi(L.svg, altNoktalar(not2, not2), { renk: VURGU, kalinlik: 5, tohum: 21 }));
  const b3 = not3.querySelector('b') || not3;
  const alt3 = dondur(ctx.cizgi(L.svg, altNoktalar(not3, b3), { renk: VURGU, kalinlik: 4.5, tohum: 22 }));
  gsap.set([alt2.g, alt3.g], { autoAlpha: 0 });
  const altCiz = (h, n, sure, p, hedef) => {
    tl.call(() => { h.pts = altNoktalar(p, hedef); h.ciz(); }, null, k(n - 1));
    tl.set(h.g, { autoAlpha: 1 }, k(n));
    tl.fromTo(h.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(sure), ease: E.EO, immediateRender: false }, k(n));
  };

  // ---------- Kamera: üstel ölçek (x, y ölçekle doğrusal → sabit bir dünya noktası çevresinde dalış)
  const kameraUstel = (n, sure, bas, son, ease = E.KM) => {
    const pr = { p: 0 };
    const uyg = () => {
      const s = bas.scale * Math.pow(son.scale / bas.scale, pr.p);
      const u = Math.abs(son.scale - bas.scale) < 1e-6 ? pr.p : (s - bas.scale) / (son.scale - bas.scale);
      gsap.set(ctx.kamera, { x: bas.x + (son.x - bas.x) * u, y: bas.y + (son.y - bas.y) * u, scale: s });
    };
    tl.fromTo(pr, { p: 0 }, { p: 1, duration: k(sure), ease, onUpdate: uyg, immediateRender: false }, k(n));
  };
  // Balonun gerçek sınırı: konturun örneklenmiş noktaları (getBBox Bézier kontrol noktalarını da sayıyor) + çizgi ve kaynama payı
  const sinir = (yolEl, pay = 6) => {
    const uz = yolEl.getTotalLength(), b = [Infinity, Infinity, -Infinity, -Infinity];
    for (let s = 0; s <= uz; s += 5) {
      const p = yolEl.getPointAtLength(s);
      b[0] = Math.min(b[0], p.x); b[1] = Math.min(b[1], p.y); b[2] = Math.max(b[2], p.x); b[3] = Math.max(b[3], p.y);
    }
    return [b[0] - pay, b[1] - pay, b[2] + pay, b[3] + pay];
  };
  const BAL = sinir(B.kontur);
  // Ölçek s'de P sabit noktalı itişin kaydırması: kutu kadraja (m payıyla) sığacak kadar düzeltilir, sığmazsa ortalanır
  const sigdir = (s, P, kutu, m) => {
    const eks = (p, a0, a1, Wx) => {
      const lo = m - s * a0, hi = Wx - m - s * a1;
      return lo > hi ? (Wx - s * (a0 + a1)) / 2 : Math.min(hi, Math.max(lo, p * (1 - s)));
    };
    return { scale: s, x: eks(P[0], kutu[0], kutu[2], W), y: eks(P[1], kutu[1], kutu[3], H) };
  };
  const K0 = { x: 0, y: 0, scale: 1 };
  ctx.kameraKoy(240, K0);
  // Ölü kare yok: #4–#6 boyunca balona doğru doğrusal %2 itiş. Balon kadraja değiyorsa kamera ilk 24 k'da (balon açılırken,
  // KM) o kadar kayar ("yukarı bakar"); itişin sonunda da balonun tamamı kadrajda kalır
  const KIT = sigdir(1.02, BC, BAL, 16);
  const KAY = [KIT.x - BC[0] * (1 - 1.02), KIT.y - BC[1] * (1 - 1.02)];
  {
    const pr = { p: 0 }, km = gsap.parseEase(E.KM), sure = 216, egil = 24;
    const uyg = () => {
      const s = Math.pow(1.02, pr.p), e = km(kenet(pr.p * sure / egil));
      gsap.set(ctx.kamera, { scale: s, x: BC[0] * (1 - s) + KAY[0] * e, y: BC[1] * (1 - s) + KAY[1] * e });
    };
    tl.fromTo(pr, { p: 0 }, { p: 1, duration: k(sure), ease: 'none', onUpdate: uyg, immediateRender: false }, k(240));
  }
  // #7 dalış hedefi: yatayda balonun tamamı kadrajı doldurur, kırpılmaz. Dikeyde dar ekran balonun yanlarını keser;
  // orada yazılar ve zarlar payıyla sığar, balonun üst ve alt kenarı kadrajı çevreler
  const ICERIK = [Infinity, Infinity, -Infinity, -Infinity];
  const ekle = (x0, y0, x1, y1) => {
    ICERIK[0] = Math.min(ICERIK[0], x0); ICERIK[1] = Math.min(ICERIK[1], y0); ICERIK[2] = Math.max(ICERIK[2], x1); ICERIK[3] = Math.max(ICERIK[3], y1);
  };
  for (const p of [not2, not3]) {                                // -3° dönüş: sağ uç w·sin3° kadar yükselir
    const x = parseFloat(p.style.left), y = parseFloat(p.style.top), w = p.offsetWidth || 400, h = p.offsetHeight || 70;
    ekle(x - 12, y - 0.06 * w, x + w + 12, y + h);
  }
  for (const [x, y] of YUVA) ekle(x - 0.62 * S, y - 0.62 * S, x + 0.62 * S, y + 0.62 * S);
  const dalKutu = DIKEY ? [ICERIK[0], BAL[1], ICERIK[2], BAL[3]] : BAL;
  const PAY = ctx.yer(20, 40);
  const sDal = Math.min((W - 2 * PAY) / (dalKutu[2] - dalKutu[0]), (H - 2 * PAY) / (dalKutu[3] - dalKutu[1]));
  const dalC = [(dalKutu[0] + dalKutu[2]) / 2, (dalKutu[1] + dalKutu[3]) / 2];
  const KTUT = ctx.odak(dalC[0], dalC[1], sDal);                 // #8 tutuşunun sonu (%1,5 itiş dahil sığar)
  const KDAL = ctx.odak(dalC[0], dalC[1], sDal / 1.015);

  // ==================== #4 (240–287): balon, d6, "Bir zar…"
  tl.set(z6.pos, { autoAlpha: 1 }, k(268));                                     // bulut oturduktan 4 k sonra
  tl.set([z6.dis, ...z6.ic], { drawSVG: '0%' }, k(268));                        // gecikmeli çizgiler önceden görünmesin
  tl.fromTo(z6.dis, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(12), ease: 'power2.inOut', immediateRender: false }, k(268));
  tl.fromTo(z6.ic, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(10), ease: 'power2.out', stagger: k(4), immediateRender: false }, k(272));
  tl.fromTo(z6.pip, { attr: { r: 0 } }, { attr: { r: 0.045 }, duration: k(8), ease: E.BO, stagger: k(2), immediateRender: false }, k(278));
  ctx.yazElYazisi(not1, 254, 16); // bulut %90'da; satır k254–344 (1,5 sn), k270–330 tam okunur

  // ==================== #5 (288–383): baş sallama, d6 → d20, set yaya dağılır, "FRP zarı olsun!"
  // Baş iki kez sallanır: 4 × 4 k (hızlı aksiyon, 2 k ızgarası), boyun çevresinde ±2,5° + bakış sağa sola
  const boyun = [Y.x, Y.alt - Y.olcek * (BOY.boy - 262)];
  const salla = (n, a, bakis) => {
    tl.set(kisiSar, { attr: { transform: `rotate(${a} ${f2(boyun[0])} ${f2(boyun[1])})` } }, k(n));
    if (bakis) tl.call(() => A.poz({ ifade: 'notr', bakis }), null, k(n));
  };
  salla(288, -2.5, [-1, 0]); salla(292, 2.5, [1, 0]); salla(296, -2.5, [-1, 0]); salla(300, 2.5, [1, 0]); salla(304, 0, null);
  poz(305, { ifade: 'merak', bakis: [1, -1] });
  // d6 → d20 (F0 = 300, 24 k KM): d6'nın iç çizgileri geri sarılır, d20'ninkiler akar; altıgen dış hat yerinde kalır
  tl.to(z6.ic, { drawSVG: '100% 100%', duration: k(16), ease: E.KM, stagger: k(2) }, k(300));
  tl.to(z6.pip, { attr: { r: 0 }, duration: k(8), ease: 'power2.in' }, k(300));
  gsap.set(z20.dis, { autoAlpha: 0 });
  tl.set(z20.dis, { autoAlpha: 0 }, k(240));
  tl.set(z20.ic, { drawSVG: '0%' }, k(300));
  tl.set(z20.pos, { autoAlpha: 1 }, k(300));
  tl.fromTo(z20.ic, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(18), ease: E.KM, stagger: k(1), immediateRender: false }, k(302));
  // Ortada 1 k leke (ezme-uzatma, x × y ≈ 1)
  for (const z of [z6, z20]) {
    tl.set(z.leke, { attr: { transform: 'scale(1.16 0.86)' } }, k(312));
    tl.set(z.leke, { attr: { transform: 'scale(1 1)' } }, k(313));
  }
  tl.set(z20.dis, { autoAlpha: 1 }, k(324));
  tl.set(z6.pos, { autoAlpha: 0 }, k(324));
  // "Bir zar…" baş sallamanın ve d20'nin üstünden k330'a dek kalır; "FRP zarı olsun!" set açılırken aynı yere yazılır
  ctx.silElYazisi(not1, 330);
  ctx.yazElYazisi(not2, 342, 16);
  altCiz(alt2, 360, 12, not2, not2);
  // Set açılır (S0 = 330): d20 yuvasına kayar; d4…d12 ortadan 6 k arayla yaya fırlar, BO ile ~%10 aşar
  const S0 = 330;
  tl.to(z20.pos, { attr: { transform: tr(YUVA[5]) }, duration: k(30), ease: E.EO }, k(S0));
  tl.to(z20.don, { attr: { transform: `rotate(0) scale(${S})` }, duration: k(30), ease: E.EO }, k(S0));
  [0, 1, 2, 3, 4].forEach((i, n) => {
    const z = zarlar[i], t1 = S0 + 6 * n;
    tl.set(z.pos, { autoAlpha: 1, attr: { transform: tr(MERKEZ) } }, k(t1));
    tl.set(z.don, { attr: { transform: 'rotate(-25) scale(40)' } }, k(t1));
    tl.set([z.dis, ...z.ic], { drawSVG: '0%' }, k(t1));
    tl.to(z.pos, { attr: { transform: tr(YUVA[i]) }, duration: k(24), ease: E.EO }, k(t1));
    tl.to(z.don, { attr: { transform: `rotate(0) scale(${S})` }, duration: k(24), ease: E.BO }, k(t1));
    tl.fromTo([z.dis, ...z.ic], { drawSVG: '0%' }, { drawSVG: '100%', duration: k(18), ease: 'power2.out', stagger: k(1), immediateRender: false }, k(t1));
    if (z.pip.length) tl.fromTo(z.pip, { attr: { r: 0 } }, { attr: { r: 0.045 }, duration: k(8), ease: E.BO, stagger: k(2), immediateRender: false }, k(t1 + 12));
  });
  poz(340, { ifade: 'saskin', bakis: [1, -1] });
  poz(365, { ifade: 'merak', bakis: [1, -1] });

  // ==================== #6 (384–455): "+ şeffaf." düşer, A gözlerini kısar ve sırıtır, cam parıltısı
  ctx.yazElYazisi(not3, 388, 16);
  tl.fromTo(not3, { y: -30 }, { y: 0, duration: k(12), ease: E.BO, immediateRender: false }, k(388));
  altCiz(alt3, 406, 10, not3, b3);
  poz(400, { ifade: 'kisik', bakis: [1, -1] }); // kısık göz + yan sırıtma; #8'deki geniş sırıtış ('mutlu') bundan ayrışır
  zarlar.forEach((z, j) => {
    const t = 412 + 4 * j;
    tl.set(z.par, { drawSVG: '0%' }, k(t));
    tl.set(z.parG, { autoAlpha: 1 }, k(t));
    tl.fromTo(z.par, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(8), ease: E.EO, stagger: k(2), immediateRender: false }, k(t));
  });

  // ==================== #7 (456–479): sessizlik; kamera balona dalar (24 k KM, üstel)
  kameraUstel(456, 24, KIT, KDAL, E.KM);

  // ==================== #8 (480–575): GERÇEK 1 (yer tutucu)
  for (const [p, h] of [[not2, alt2], [not3, alt3]]) {
    ctx.silElYazisi(p, 480);
    tl.to(h.g, { autoAlpha: 0, y: -18, duration: k(14), ease: E.EI }, k(480));
  }
  kameraUstel(480, 60, KDAL, KTUT, 'none');                                     // tutuşta %1,5 itiş
  // Renkli yarı saydam zarlar: dünya koordinatlı kırpma dikdörtgeni yukarıdan aşağı açılır (dolum)
  const gercek = SIRA.map((ad, i) => {
    const [x, y] = YUVA[i];
    const grad = el(defs, 'radialGradient', { id: `v2-isik-${i}` });
    el(grad, 'stop', { offset: '0', 'stop-color': RENK[i], 'stop-opacity': 0.8 });
    el(grad, 'stop', { offset: '0.55', 'stop-color': RENK[i], 'stop-opacity': 0.3 });
    el(grad, 'stop', { offset: '1', 'stop-color': RENK[i], 'stop-opacity': 0 });
    const isik = el(lekeKat, 'ellipse', { cx: f2(x + 0.18 * S), cy: f2(y + 0.5 * S), rx: f2(0.95 * S), ry: f2(0.3 * S), fill: `url(#v2-isik-${i})`, opacity: 0 });
    const kp = el(defs, 'clipPath', { id: `v2-dol-${i}` });
    const kr = el(kp, 'rect', { x: f2(x - 0.8 * S), y: f2(y - 0.8 * S), width: f2(1.6 * S), height: 0 });
    const dol = el(gKat, 'g', { 'clip-path': `url(#v2-dol-${i})` });
    const pos = el(dol, 'g', { transform: tr([x, y]) });
    const don = el(pos, 'g', { transform: `rotate(0) scale(${S})` });
    el(don, 'path', { d: poly(ZAR[ad].dis), fill: RENK[i], 'fill-opacity': 0.6, stroke: koyu(RENK[i]), 'stroke-width': 0.03, 'stroke-linejoin': 'round' });
    for (const pts of ZAR[ad].ic) el(don, 'path', { d: poly(pts, false), fill: 'none', stroke: '#fff', 'stroke-opacity': 0.6, 'stroke-width': 0.022, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    if (ad === 'd6') PIP.forEach(([px, py]) => el(don, 'circle', { cx: px, cy: py, r: 0.045, fill: '#fff', 'fill-opacity': 0.85 }));
    const pk = el(defs, 'clipPath', { id: `v2-par-${i}` });
    el(pk, 'path', { d: poly(ZAR[ad].dis) });
    const parG = el(don, 'g', { 'clip-path': `url(#v2-par-${i})` });
    const parilti = el(parG, 'path', { d: 'M-0.14 -0.8 L0.02 -0.8 L-0.12 0.8 L-0.28 0.8Z', fill: '#fff', 'fill-opacity': 0.75, transform: 'translate(-0.9 0)' });
    el(don, 'ellipse', { cx: -0.17, cy: -0.24, rx: 0.07, ry: 0.04, fill: '#fff', 'fill-opacity': 0.85, transform: 'rotate(-30 -0.17 -0.24)' });
    return { x, y, isik, kr, don, parilti };
  });
  // Nozul (v1'deki çizim): zar sırasının üstünden geçer. Yol: her zarın tepesinde soldan sağa; zarlar arası geçiş hızlı
  const NZ = ctx.yer(0.65, 0.8);
  const nozDis = el(Wb, 'g', { transform: 'translate(0 -320)' });
  const nozIc = el(nozDis, 'g');
  ctx.cizgi(nozIc, [[-34, -70], [34, -70], [34, -30], [-34, -30], [-34, -70]], { kapali: true, dolgu: ctx.GRI, tohum: 11, kalinlik: 4.5 });
  ctx.cizgi(nozIc, [[-20, -30], [20, -30], [6, -6], [-6, -6], [-20, -30]], { kapali: true, dolgu: ctx.GRI2, tohum: 12, kalinlik: 4.5 });
  ctx.cizgi(nozIc, [[0, -70], [0, -150]], { tohum: 13, kalinlik: 3 });
  gsap.set(nozDis, { autoAlpha: 0 });
  const ucY = (i) => YUVA[i][1] - 0.62 * S;
  const yolNz = [[YUVA[0][0] - 0.95 * S, ucY(0)]];
  SIRA.forEach((_, i) => { yolNz.push([YUVA[i][0] - 0.5 * S, ucY(i)], [YUVA[i][0] + 0.5 * S, ucY(i)]); });
  yolNz.push([YUVA[5][0] + 0.95 * S, ucY(5)]);
  const uz = [0];
  for (let j = 0; j < yolNz.length - 1; j++) {
    const d = Math.hypot(yolNz[j + 1][0] - yolNz[j][0], yolNz[j + 1][1] - yolNz[j][1]);
    uz.push(uz[j] + d * (j % 2 === 1 ? 1 : 0.45)); // tek j: zarın üstü; çift j: geçiş (daha hızlı)
  }
  const T = uz[uz.length - 1];
  const aralik = SIRA.map((_, i) => [uz[1 + 2 * i] / T, uz[2 + 2 * i] / T]);
  const nzNokta = (p) => {
    const u = p * T;
    let j = 0;
    while (j < uz.length - 2 && uz[j + 1] < u) j++;
    const t = (u - uz[j]) / Math.max(1e-6, uz[j + 1] - uz[j]);
    return [yolNz[j][0] + (yolNz[j + 1][0] - yolNz[j][0]) * t, yolNz[j][1] + (yolNz[j + 1][1] - yolNz[j][1]) * t];
  };
  const tarama = { p: 0 };
  const taramaUygula = () => {
    const [x, y] = nzNokta(tarama.p);
    nozIc.setAttribute('transform', `translate(${f2(x)} ${f2(y + 6 * NZ)}) scale(${NZ})`);
    gercek.forEach((g, i) => {
      const f = kenet((tarama.p - aralik[i][0]) / (aralik[i][1] - aralik[i][0]));
      g.kr.setAttribute('height', f2(f * 1.6 * S));
      g.isik.setAttribute('opacity', f2(f * 0.6));
      zarlar[i].mur.setAttribute('opacity', f2(1 - 0.6 * f)); // mürekkep hat %40'ta kalır
    });
  };
  taramaUygula();
  tl.set(nozDis, { autoAlpha: 1 }, k(480));
  tl.fromTo(nozDis, { attr: { transform: 'translate(0 -320)' } }, { attr: { transform: 'translate(0 0)' }, duration: k(8), ease: E.EO, immediateRender: false }, k(480));
  tl.fromTo(tarama, { p: 0 }, { p: 1, duration: k(40), ease: E.KM, onUpdate: taramaUygula, immediateRender: false }, k(486));
  tl.to(nozDis, { attr: { transform: 'translate(0 -460)' }, duration: k(10), ease: E.EI }, k(526));
  tl.to(nozDis, { autoAlpha: 0, duration: k(4), ease: 'none' }, k(532));
  tl.to(zKat, { autoAlpha: 0, duration: k(30), ease: 'none' }, k(530));            // mürekkep 30 k'da söner
  // Zarlar 1,6 sn'de 15–20° döner; parıltı soldan sağa 40 k'da geçer
  const xs = YUVA.map(([x]) => x), xMin = Math.min(...xs), xMax = Math.max(...xs);
  gercek.forEach((g, i) => {
    tl.fromTo(g.don, { attr: { transform: `rotate(0) scale(${S})` } }, { attr: { transform: `rotate(${ACI[i]}) scale(${S})` }, duration: k(96), ease: 'sine.inOut', immediateRender: false }, k(480));
    const gec = Math.round((g.x - xMin) / Math.max(1, xMax - xMin) * 24);
    tl.fromTo(g.parilti, { attr: { transform: 'translate(-0.9 0)' } }, { attr: { transform: 'translate(1 0)' }, duration: k(16), ease: 'power1.inOut', immediateRender: false }, k(520 + gec));
  });
  // Yer tutucu etiketi (animatik işareti; filmde yazı yok)
  const etiketY = ctx.yer(BC[1] + 150, BC[1] - 92);
  const etiket = ctx.gercekEtiket(Wb, 'GERÇEK', BC[0], etiketY);
  etiket.querySelector('text')?.setAttribute('text-anchor', 'middle');
  gsap.set(etiket, { autoAlpha: 0 });
  tl.set(etiket, { autoAlpha: 1 }, k(494));                                     // "+ şeffaf." söndükten sonra; 1,5 sn
  tl.to(etiket, { autoAlpha: 0, duration: k(8), ease: 'none' }, k(576));
  // k540: kamera geri çıkar (36 k KM, üstel); A önce şaşırır, sonra sırıtır
  kameraUstel(540, 36, KTUT, KIT, E.KM);                                        // itişin sonuna döner: balon yine tam görünür
  poz(540, { ifade: 'saskin', bakis: [1, -1] });
  poz(555, { ifade: 'mutlu', bakis: [1, -1] });

  // ==================== #9 (576–623): balon küçülür, başın üstünde kalır; kapı montajı M16, M17
  const KUC = ctx.yer({ c: [Y.x + 70, sacUst - 120], s: 0.3 }, { c: [Y.x + 40, sacUst - 130], s: 0.32 });
  const tx = KUC.c[0] - KUC.s * BC[0], ty = KUC.c[1] - KUC.s * BC[1];
  tl.fromTo(Wb, { attr: { transform: 'translate(0 0) scale(1)' } }, { attr: { transform: `translate(${f2(tx)} ${f2(ty)}) scale(${KUC.s})` }, duration: k(18), ease: E.EI, immediateRender: false }, k(576));
  tl.to(B.noktalar, { autoAlpha: 0, duration: k(8), ease: E.EI }, k(576));
  poz(580, { ifade: 'mutlu', bakis: [0, -1] }); // küçülen balona bakar
  // Ölü kare yok: A'nın gözüne doğru %1 itiş, kesmelerin üstünden sürer (k624'te v3 kamerayı kendisi koyar)
  const gozE = [KIT.x + KIT.scale * A.goz[0], KIT.y + KIT.scale * A.goz[1]];
  kameraUstel(576, 47, KIT, ctx.odak(A.goz[0], A.goz[1], KIT.scale * 1.01, gozE[0], gozE[1]), 'none');
  // Düz kesme: A'nın yerinde M16 (k600), M17 (k612); balon yükselip kadrajdan çıkar (#15 ile aynı dil)
  tl.call(() => A.poz({ p: ctx.MONTAJ[15], ifade: 'notr', bakis: [0, -1] }), null, k(600));
  tl.call(() => A.poz({ p: ctx.MONTAJ[16], ifade: 'merak', bakis: [1, 0] }), null, k(612));
  const YUK = ctx.yer(560, 1250);
  tl.to(Wb, { attr: { transform: `translate(${f2(tx)} ${f2(ty - YUK)}) scale(${KUC.s})` }, duration: k(22), ease: E.EI }, k(600));
  tl.to(Wb, { autoAlpha: 0, duration: k(6), ease: 'none' }, k(616));
}
