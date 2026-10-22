// Vinyet 1, kanca (#1–#2, k0–191). Referans modül: diğer vinyetler bu kalıpla yazılır.
// #1 (k0–23) İlk yüz (M1) ilk karede ekranda, montajın ilk yüzü gibi 24 k kalır (kalemle çizme açılışı 2026-10-22'de
//    kullanıcı isteğiyle kaldırıldı; kesme kareleri ve kanca notaları değişmedi).
// #2 (k24–191) Montaj M2–M15: göz çizgisi sabit, düz kesme; 18 → 12 → 8 kare (hızlanır). k36 yazı girer, k150 çıkar. k96 %2 nefes.
//    Son yüz A (M15 = kadro.json A). v1 katmanı k192'de gizlenir: s1-kafe A'yı aynı ekran yerinde ve ölçekte devralır,
//    kamera oradan kafeye geri çekilir.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye MUTLAK zamanlı tween ekler; ortak öğeler için window'a bir şey yazmaz.
export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, kisi, yazi, odak, MONTAJ, YERLESIM, vurus, W, H, DIKEY, BOY, MONO, GRI, GRI2 } = ctx;
  vurus(1, 'İlk yüz', 0, 23);
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

  // #1 (k0–23) İlk yüz (M1) ilk karede hazır; kamera itişi ilk kareden sürer (kalemle çizim kullanıcı isteğiyle kalktı)
  ctx.isaret(0, 'kesme');

  // #2 Montaj: M2–M3 18 k, M4–M12 12 k, M13–M15 8 k; ifade ve bakış hafifçe değişir (ölü kare yok)
  const sure = [18, 18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 8, 8, 8];
  const ifadeler = ['notr', 'merak', 'mutlu', 'notr', 'sikkin', 'merak', 'notr', 'mutlu', 'notr', 'merak', 'notr', 'mutlu', 'notr', 'merak'];
  const bakislar = [[0, 0], [1, 0], [-1, 0], [0, 1], [1, -1], [0, 0], [-1, -1], [0, 0], [1, 0], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0]];
  let t = 24;
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
