// Vinyet 1, kanca (#1–#3, k0–239). Referans modül: diğer vinyetler bu kalıpla yazılır.
// #1 FDM nozulu ilk yüzü (M1) alttan üste katman katman "basar" (ilk karede hareket var).
// #2 Montaj M2–M15: göz çizgisi sabit, düz kesme; 18 → 12 → 8 kare (hızlanır). k36 yazı girer, k150 çıkar. k96 %2 nefes.
// #3 A durur: başı %3 iner, göz kırpar, bakışı sağ üste kayar; kamera 36 k KM ile geri çekilir (balona yer açılır).
// Sözleşme: kur(ctx) yalnız ctx.tl'ye MUTLAK zamanlı tween ekler; ortak öğeler için window'a bir şey yazmaz.
export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, kisi, yazi, odak, MONTAJ, kisiParam, YERLESIM, vurus, W, H, DIKEY } = ctx;
  vurus(1, 'Nozul ilk yüzü basar', 0, 23);
  vurus(2, 'Montaj', 24, 191);
  vurus(3, 'A durur, bakar', 192, 239);

  const L = ctx.katman('v1', 10);
  const Y = YERLESIM.kisi;
  const ana = kisi(L.svg, MONTAJ[0], Y);
  const [gx, gy] = ana.goz;
  // Bu katman yalnız kancada görünür; v2 A'yı aynı yerde kendi katmanında sürdürür (k240'ta devir)
  tl.set(L.div, { autoAlpha: 1 }, 0);
  tl.set(L.div, { autoAlpha: 0 }, k(240));

  // Kamera: montaj boyunca yüze yakın, yüz ortada; 3,2 sn boyunca doğrusal %2 itiş
  const S = DIKEY ? 1.5 : 1.3, hedefY = H * (DIKEY ? 0.62 : 0.5); // dikeyde gövde alt kenarı doldursun
  tl.set(ctx.kamera, odak(gx, gy, S, W / 2, hedefY), 0);
  tl.fromTo(ctx.kamera, odak(gx, gy, S, W / 2, hedefY), { ...odak(gx, gy, S * 1.02, W / 2, hedefY), duration: k(192), ease: 'none', immediateRender: false }, 0);

  // #1 Nozul: kırpma dikdörtgeni alttan üste büyür; nozul kenarda sağa sola gidip gelerek yükselir
  const ust = Y.alt - ctx.BOY.boy * Y.olcek * 0.86, en = ctx.BOY.en * Y.olcek;
  const kirp = el(el(L.svg, 'defs'), 'clipPath', { id: 'v1-baski' });
  const dik = el(kirp, 'rect', { x: Y.x - en / 2, y: Y.alt, width: en, height: 0 });
  ana.g.setAttribute('clip-path', 'url(#v1-baski)');
  const nozul = el(L.svg, 'g');
  cizgi(nozul, [[-34, -70], [34, -70], [34, -30], [-34, -30], [-34, -70]], { kapali: true, dolgu: ctx.GRI, tohum: 11, kalinlik: 4.5 });
  cizgi(nozul, [[-20, -30], [20, -30], [6, -6], [-6, -6], [-20, -30]], { kapali: true, dolgu: ctx.GRI2, tohum: 12, kalinlik: 4.5 });
  cizgi(nozul, [[0, -70], [0, -150]], { tohum: 13, kalinlik: 3 });
  const baski = { p: 0.08 };
  const uygula = () => {
    const yKenar = Y.alt - (Y.alt - ust) * baski.p;
    dik.setAttribute('y', yKenar); dik.setAttribute('height', Y.alt - yKenar + 2);
    const xOrt = Y.x + Math.sin(baski.p * Math.PI * 9) * en * 0.32;
    nozul.setAttribute('transform', `translate(${xOrt.toFixed(1)} ${(yKenar - 2).toFixed(1)})`);
  };
  uygula();
  tl.fromTo(baski, { p: 0.08 }, { p: 1, duration: k(24), ease: E.KM, onUpdate: uygula, immediateRender: false }, 0);
  tl.to(nozul, { y: '-=420', autoAlpha: 0, duration: k(10), ease: E.EI }, k(24));
  tl.call(() => ana.g.removeAttribute('clip-path'), null, k(24));
  tl.call(() => ana.g.setAttribute('clip-path', 'url(#v1-baski)'), null, k(0.5)); // geri sarmada kırpma dönsün

  // #2 Montaj: M2–M3 18 k, M4–M12 12 k, M13–M15 8 k; ifade ve bakış hafifçe değişir (ölü kare yok)
  const sure = [18, 18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 8, 8, 8];
  const ifadeler = ['notr', 'merak', 'mutlu', 'notr', 'sikkin', 'merak', 'notr', 'mutlu', 'notr', 'merak', 'notr', 'mutlu', 'notr', 'merak'];
  const bakislar = [[0, 0], [1, 0], [-1, 0], [0, 1], [1, -1], [0, 0], [-1, -1], [0, 0], [1, 0], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0]];
  let t = 24;
  for (let i = 1; i <= 14; i++) {
    const j = i - 1;
    tl.call(() => ana.poz({ p: MONTAJ[i], ifade: ifadeler[j], bakis: bakislar[j] }), null, k(t));
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

  // #3 A durur (k192): başı %3 iner (6 k, 12 fps adım), göz kırpar (7 k), bakış sağ üste (8 k); kamera geri çekilir
  const A = kisiParam('A');
  tl.call(() => ana.poz({ p: A, ifade: 'notr', bakis: [0, 0] }), null, k(192));
  const in3 = ctx.BOY.boy * Y.olcek * 0.03;
  tl.to(ana.g, { y: in3, duration: k(6), ease: 'steps(2)' }, k(192));
  tl.call(() => ana.poz({ ifade: 'kirp' }), null, k(ctx.adim(200)));
  tl.call(() => ana.poz({ ifade: 'notr' }), null, k(ctx.adim(207)));
  tl.call(() => ana.poz({ ifade: 'merak', bakis: [1, -1] }), null, k(ctx.adim(212)));
  tl.to(ana.g, { y: 0, duration: k(10), ease: 'steps(2)' }, k(214));
  tl.to(ctx.kamera, { x: 0, y: 0, scale: 1, duration: k(36), ease: E.KM }, k(204));
}
