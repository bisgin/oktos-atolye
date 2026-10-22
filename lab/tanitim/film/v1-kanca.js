// Vinyet 1, kanca (#1–#2, k0–191). Referans modül: diğer vinyetler bu kalıpla yazılır.
// #1 (k0–23) Kalem ilk yüzü (M1) çizer: kişi svg'sinin konturları DrawSVG ile sırayla, yüzün ortasından dışa (yüz ovali,
//    burun, kaşlar, ağız, kulaklar, boyun, yaka, omuzlar); kalem ucu çizilen konturun ucunu izler, her kontur bitince
//    dolgusu 3 k'da gelir. İlk karede kalem hareket hâlinde ve yüz ovali başlamış. Çizim 0,4 sn kaynamaz (donuk kopya);
//    k24'te kesmeyle kaynayan kişiye (montaj) geçilir, kalem kesmeyle kalkar.
// #2 (k24–191) Montaj M2–M15: göz çizgisi sabit, düz kesme; 18 → 12 → 8 kare (hızlanır). k36 yazı girer, k150 çıkar. k96 %2 nefes.
//    Son yüz A (M15 = kadro.json A). v1 katmanı k192'de gizlenir: s1-kafe A'yı aynı ekran yerinde ve ölçekte devralır,
//    kamera oradan kafeye geri çekilir.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye MUTLAK zamanlı tween ekler; ortak öğeler için window'a bir şey yazmaz.
import { kisiSVG } from '../insan.js';

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, kisi, yazi, odak, MONTAJ, YERLESIM, vurus, W, H, DIKEY, BOY, MONO, GRI, GRI2 } = ctx;
  vurus(1, 'Kalem ilk yüzü çizer', 0, 23);
  vurus(2, 'Montaj', 24, 191);

  const L = ctx.katman('v1', 10);
  const Y = YERLESIM.kisi;
  const ana = kisi(L.svg, MONTAJ[0], Y);
  const [gx, gy] = ana.goz;
  // Bu katman yalnız kancada görünür; s1-kafe A'yı aynı yerde kendi katmanında sürdürür (k192'de devir)
  tl.set(L.div, { autoAlpha: 1 }, 0);
  tl.set(L.div, { autoAlpha: 0 }, k(192));

  // Kamera: montaj boyunca yüze yakın, yüz ortada; 3,2 sn boyunca doğrusal %2 itiş
  const S = DIKEY ? 1.5 : 1.3, hedefY = H * (DIKEY ? 0.62 : 0.5); // dikeyde gövde alt kenarı doldursun
  const K0 = odak(gx, gy, S, W / 2, hedefY);
  tl.set(ctx.kamera, K0, 0);
  tl.fromTo(ctx.kamera, K0, { ...odak(gx, gy, S * 1.02, W / 2, hedefY), duration: k(192), ease: 'none', immediateRender: false }, 0);

  // ---------- #1 Kalem: M1'in donuk kopyası (kaynamaz) kontur kontur çizilir; kaynayan kişi k24'te devralır
  const o = Y.olcek, x0 = Y.x - (BOY.en * o) / 2, y0 = Y.alt - BOY.boy * o;
  const dunya = ([bx, by]) => [x0 + bx * o, y0 + by * o]; // kişi kutusu → sahne
  const cizim = el(L.svg, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * o, height: BOY.boy * o, x: x0, y: y0, overflow: 'visible' });
  cizim.innerHTML = kisiSVG(MONTAJ[0], { kaynama: 0, ifade: 'notr', bakis: [0, 0], mono: true });
  gsap.set(ana.g, { autoAlpha: 0 });
  tl.set(ana.g, { autoAlpha: 0 }, 0);
  tl.set(ana.g, { autoAlpha: 1 }, k(24));
  tl.set(cizim, { autoAlpha: 1 }, 0);
  tl.set(cizim, { autoAlpha: 0 }, k(24));

  // Kadrajın alt kenarı (kutu birimi): bunun altındaki kontur parçaları ekranda değil, kalem onları çizmez
  const altKenar = ((H - K0.y) / S - y0) / o - 6;
  const parcalar = [...cizim.children];
  const yollar = parcalar.filter((e) => e.tagName === 'path');
  const konturlar = yollar.filter((p) => p.getAttribute('fill') === 'none' && !p.dataset.uzatma);
  const dolgular = new Map(); // d → dolgu yolu (insan.js sekil(): önce dolgu, sonra aynı d ile kontur)
  for (const p of yollar) if (p.getAttribute('fill') !== 'none' && !p.dataset.uzatma) dolgular.set(p.getAttribute('d'), p);
  const tekDolgular = [...dolgular.values()].filter((d) => !konturlar.some((c) => c.getAttribute('d') === d.getAttribute('d'))); // saç tonu gibi
  const noktalar = parcalar.filter((e) => e.tagName === 'circle' || e.tagName === 'ellipse');

  // Görünür koşular: konturun ekranda kalan [a, b] kesitleri (uzunluk oranı); kapalı gövde yolunda iki koşu olur
  const kosular = (p) => {
    const uz = p.getTotalLength(), n = 80, ic = [];
    for (let i = 0; i <= n; i++) ic.push(p.getPointAtLength((uz * i) / n).y < altKenar);
    const r = [];
    let bas = null;
    ic.forEach((v, i) => {
      if (v && bas === null) bas = i;
      if ((!v || i === n) && bas !== null) { r.push([bas / n, (v ? i : i - 1) / n]); bas = null; }
    });
    return { uz, r };
  };
  // Sıra: yüzün ortasından dışa; büyük ve ortadaki önce (yüz ovali), sonra küçük ayrıntılar, en son gövde
  const F = [200, ctx.GOZ_Y];
  const sirali = konturlar.map((p) => {
    const b = p.getBBox(), m = [b.x + b.width / 2, b.y + b.height / 2];
    return { p, ...kosular(p), anahtar: Math.hypot(m[0] - F[0], m[1] - F[1]) - 0.35 * Math.max(b.width, b.height) };
  }).filter((s) => s.r.length).sort((a, b) => a.anahtar - b.anahtar);

  // Parçalar (kalemin izlediği sıra). İki koşulu (gövde) yol: kopyayla iki ayrı kesit, tek hamlede çizilir:
  // sol omuz alttan boyuna (ters), boyun ve sağ omuz yukarıdan aşağı (ikinci koşu, ters) → kalem kesintisiz döner.
  const hamle = [], kopyalar = [];
  for (const s of sirali) {
    if (s.r.length === 2 && s.r[0][0] === 0 && s.r[1][1] === 1) {
      const kopya = s.p.cloneNode(); s.p.after(kopya); kopyalar.push(kopya);
      hamle.push({ el: s.p, uz: s.uz, a: s.r[0][1], b: 0, ana: s.p });
      hamle.push({ el: kopya, uz: s.uz, a: 1, b: s.r[1][0], ana: s.p });
    } else for (const [a, b] of s.r) hamle.push({ el: s.p, uz: s.uz, a, b, ana: s.p });
  }
  // Yüz ovali tersten (sağdan tepeye, sola): ilk karede çizilen yay kalemin gövdesinin altında kalmaz
  if (hamle[0].a === 0 && hamle[0].b === 1) Object.assign(hamle[0], { a: 1, b: 0 });
  // Süre görünür uzunlukla orantılı: k0'dan k20,5'e (dolgular k24'teki kesmeden önce otursun); yüz ovali k0'da %20 çizilmiş başlar
  const ARA = 0.35, BITIS = 20.5, ILK = 0.2;
  const boy = hamle.map((h, i) => Math.max(14, Math.abs(h.b - h.a) * h.uz) * (i ? 1 : 1.6)); // yüz ovali biraz ağır
  const birim = (BITIS - ARA * (hamle.length - 1)) / boy.reduce((t, v) => t + v, 0);
  let t = 0;
  for (const [i, h] of hamle.entries()) { h.t0 = t; h.t1 = t + Math.max(1, boy[i] * birim); t = h.t1 + ARA; }
  const olc = BITIS / hamle[hamle.length - 1].t1; // en kısa süre sınırı taşırırsa sığdır
  for (const h of hamle) { h.t0 *= olc; h.t1 *= olc; }
  const yuzde = (v) => `${(v * 100).toFixed(2)}%`;
  const kesit = (h, f) => { const c = h.a + (h.b - h.a) * f; return `${yuzde(Math.min(h.a, c))} ${yuzde(Math.max(h.a, c))}`; };
  const kolay = gsap.parseEase('sine.inOut');
  gsap.set([...konturlar, ...kopyalar], { drawSVG: '0%' });
  tl.set([...konturlar, ...kopyalar], { drawSVG: '0%' }, 0);
  hamle.forEach((h, i) => {
    const f0 = i === 0 ? ILK : 0;
    tl.fromTo(h.el, { drawSVG: kesit(h, f0) }, { drawSVG: kesit(h, 1), duration: k(h.t1 - h.t0), ease: 'sine.inOut', immediateRender: false }, k(h.t0));
  });
  // Dolgular kontur bitince (3 k); saç tonu ve noktalar yüzden sonra, allık en son
  // (opacity özniteliği olan parça, örn. saç tonu, allık: kendi saydamlığına döner; CSS opacity özniteliği ezer)
  const dolguGel = (els, n, sure = 3) => {
    for (const e of [els].flat()) {
      const hedef = +(e.getAttribute('opacity') ?? 1);
      gsap.set(e, { autoAlpha: 0 }); tl.set(e, { autoAlpha: 0 }, 0);
      tl.to(e, { autoAlpha: hedef, duration: k(sure), ease: 'none' }, k(n));
    }
  };
  for (const p of new Set(hamle.map((h) => h.ana))) {
    const d = dolgular.get(p.getAttribute('d'));
    if (d) dolguGel(d, Math.min(22, Math.max(...hamle.filter((h) => h.ana === p).map((h) => h.t1))));
  }
  const yuzBitti = hamle[0].t1;
  dolguGel(tekDolgular, yuzBitti, 5);
  noktalar.forEach((n, i) => {
    const r = +(n.getAttribute('r') || n.getAttribute('rx') || 0), soluk = +(n.getAttribute('opacity') ?? 1) < 0.1;
    dolguGel(n, soluk ? 16 : r > 4 ? yuzBitti + 2 : yuzBitti + 1 + (i % 7) * 0.8, soluk ? 6 : 2);
  });

  // Kalem (tek renk, mono): uç (0,0), gövde +x yönünde (sağ üste yatık); kâğıda düşen gölgesi yanında
  const KALEM_ACI = -58;
  const kalem = el(L.svg, 'g');
  const golge = el(kalem, 'g', { opacity: 0.13, transform: `translate(22 26) rotate(${KALEM_ACI})` });
  const govde = el(kalem, 'g', { transform: `rotate(${KALEM_ACI})` });
  const r = 17; // gövde yarı kalınlığı
  const sekil = (ust, pts, dolgu, tohum, kal = 5) => cizgi(ust, pts, { kapali: true, dolgu, tohum, kalinlik: kal, genlik: 0.8, kay: [2, 2] });
  el(golge, 'path', { d: `M0 0 L52 ${-r} L300 ${-r} L318 -8 L318 8 L300 ${r} L52 ${r} Z`, fill: MONO.sac[0] });
  sekil(govde, [[268, -r], [298, -r], [306, -10], [306, 10], [298, r], [268, r]], MONO.ten[1], 31);   // silgi
  sekil(govde, [[240, -r - 1], [270, -r - 1], [270, r + 1], [240, r + 1]], MONO.giysi[4], 32);       // bilezik
  cizgi(govde, [[250, -r + 3], [250, r - 3]], { tohum: 33, kalinlik: 3, genlik: 0.5 });
  cizgi(govde, [[260, -r + 3], [260, r - 3]], { tohum: 34, kalinlik: 3, genlik: 0.5 });
  sekil(govde, [[52, -r], [240, -r], [240, r], [52, r]], GRI2, 35);                                     // altıgen gövde
  cizgi(govde, [[58, -5], [236, -5]], { tohum: 36, kalinlik: 3, genlik: 0.5, renk: MONO.sac[3] });     // yüz kenarı
  sekil(govde, [[2, 0], [52, -r], [52, r]], MONO.giysi[0], 37);                                       // yontulmuş tahta
  sekil(govde, [[0, 0], [17, -6], [17, 6]], MONO.sac[0], 38, 4);                                       // grafit uç
  cizgi(govde, [[52, -r], [44, -8], [52, -2], [44, 6], [52, r]], { tohum: 39, kalinlik: 3, genlik: 0.5 }); // yontu dalgası

  // Kalem ucu: etkin hamlenin çizilen ucunda; hamleler arasında bir sonrakinin başına kayar; sonda kalkar
  const uc = (h, f) => { const p = h.el.getPointAtLength(h.uz * (h.a + (h.b - h.a) * f)); return dunya([p.x, p.y]); };
  const kalemYeri = (n) => {
    const son = hamle[hamle.length - 1];
    if (n >= son.t1) { const [x, y] = uc(son, 1), u = Math.min(1, (n - son.t1) / 2); return [x + 70 * u, y - 120 * u, u]; }
    for (let i = 0; i < hamle.length; i++) {
      const h = hamle[i];
      if (n < h.t0) { const p = uc(hamle[i - 1], 1), q = uc(h, 0), u = (n - hamle[i - 1].t1) / (h.t0 - hamle[i - 1].t1); return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, 0.4]; }
      if (n <= h.t1) return [...uc(h, kolay((n - h.t0) / (h.t1 - h.t0)) * (1 - (i ? 0 : ILK)) + (i ? 0 : ILK)), 0];
    }
    return [...uc(son, 1), 0];
  };
  const kalemDurum = { n: 0 };
  const kalemKoy = () => {
    const [x, y, kalk] = kalemYeri(kalemDurum.n);
    // havadayken gölge açılır ve kalem hafif büyür (kâğıttan kalkar)
    kalem.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(1 + 0.06 * kalk).toFixed(3)})`);
    golge.setAttribute('transform', `translate(${(22 + 26 * kalk).toFixed(1)} ${(26 + 30 * kalk).toFixed(1)}) rotate(${KALEM_ACI})`);
  };
  kalemKoy();
  tl.fromTo(kalemDurum, { n: 0 }, { n: 23, duration: k(23), ease: 'none', onUpdate: kalemKoy, immediateRender: false }, 0);
  tl.set(kalem, { autoAlpha: 1 }, 0);
  tl.set(kalem, { autoAlpha: 0 }, k(24));

  // #2 Montaj: M2–M3 18 k, M4–M12 12 k, M13–M15 8 k; ifade ve bakış hafifçe değişir (ölü kare yok)
  const sure = [18, 18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 8, 8, 8];
  const ifadeler = ['notr', 'merak', 'mutlu', 'notr', 'sikkin', 'merak', 'notr', 'mutlu', 'notr', 'merak', 'notr', 'mutlu', 'notr', 'merak'];
  const bakislar = [[0, 0], [1, 0], [-1, 0], [0, 1], [1, -1], [0, 0], [-1, -1], [0, 0], [1, 0], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0]];
  t = 24;
  for (let i = 1; i <= 14; i++) {
    const j = i - 1;
    tl.call(() => ana.poz({ p: MONTAJ[i], ifade: ifadeler[j], bakis: bakislar[j] }), null, k(t));
    ctx.isaret(t, 'kesme');
    t += sure[j];
  }
  // geri sarmada ilk yüz dönsün
  tl.call(() => ana.poz({ p: MONTAJ[0], ifade: 'notr', bakis: [0, 0] }), null, k(0.5));
  // k96 %2 nefes (göz noktası çevresinde)
  tl.to(ana.g, { scale: 1.02, duration: k(12), ease: 'sine.inOut', yoyo: true, repeat: 1, svgOrigin: `${gx} ${gy}` }, k(96));
  yazi(ctx.metin('Herkesin aklında bir şey var.', 'Everyone has something in mind.'), 36, 150, {
    stil: 'cumle',
    yer: DIKEY ? { left: 90, top: 210, width: 900 } : { left: 1260, top: 400, width: 560 },
  });
  void E; void GRI;
}
