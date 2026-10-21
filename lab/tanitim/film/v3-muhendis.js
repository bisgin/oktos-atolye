// Vinyet 3, mühendis (#10–#14, k624–959). Plan v04 §3. ÇÖZÜM YOK: organizer finalde (v6) gelir.
// Kesmeler: k624 ön görünüm (B yukarıdan iner, kadraj bel üstüne açılır, çekmeceyi çeker) → k660 hareket üstünden
// kuş bakışı (vidalar öne fırlar, çarpışır, kayar; k712 poşet devrilir) → k768 B'nin yüzü (balon hızlı açılır, organizer)
// → k816 kuş bakışı (organizer hattı %60, ölçü okları, "84 mm?" → "?", uymayan köşe) → k912 orta plan (iç çekiş,
// gözlük burna kayar, geç kalan vida düşer, göz kırpma; "?" balonda kalır) → #15'in başı k960–971 (B balona bakar,
// "?" balonu 12 k Eİ ile yükselip kaybolur) → k972 katmanlar gizli, kamera x0 y0 ölçek 1 (v4 M18 ile devralır).
// El yazıları çekim sınırlarını aştığı için (satır ≥ 1,5 sn) kameradan bağımsız, ekran sabit bir katmanda durur:
// "Bir organizer lazım." k774–880, ardından aynı katmanda "Sığar mı?" k880–972.
// Ön görünüm "kutu birimi"nde çizilir (B'nin insan.js kutusu 400×440, ölçek YERLESIM.kisi.olcek): masa B'nin sağında,
// çekmece masanın B'ye bakan ucundan sola (B'ye doğru) çekilir. Kişiler önden çizildiği için düz cephe görünüşü seçildi.
// Kuş bakışı çekmece-yerel "u" biriminde (≈ mm; iç 480×300, Gridfinity 42): vidalar tohumlu, belirlenebilir basit
// kinematikle yüklemede bir kez hesaplanır (gecikme 2–4 k, ileri itki, sürtünme, duvardan sekme, daire çarpışması).
// Yer tutucular (animatikte kabul): kol/el kalın yuvarlak uçlu çizgi; gövde altı, sandalye, kucak, masa düz gri şekil.
export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, kisi, balon, elYazisi, yazElYazisi, odak, kameraGit, kameraKoy,
    YERLESIM, vurus, W, H, MONO, PALET, VURGU, GRI, rng, yer, metin, adim, oval } = ctx;
  vurus(10, 'B iner, çekmeceyi çeker', 624, 671);
  vurus(11, 'Kuş bakışı: vidalar kayar', 672, 767);
  vurus(12, 'Organizer balonu', 768, 815);
  vurus(13, 'Sığar mı?', 816, 911);
  vurus(14, 'İç çekiş, geç kalan vida', 912, 959);

  const MUR = PALET.murekkep, VURGU_YAZI = '#94400f';
  const fn = (e) => (typeof e === 'function' ? e : gsap.parseEase(e));
  // Karakter hareketi 12 fps (5 k) ya da hızlı aksiyonda 30 fps (2 k): eğri adım adım örneklenir
  const adimli = (e, sure, ak = 5) => { const f = fn(e), n = Math.max(1, Math.round(sure / ak)); return (p) => f(Math.min(1, Math.floor(p * n + 1e-6) / n)); };
  const EOf = fn(E.EO);
  const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
  // Kapalı çokgeni eşit aralıklı noktalara böler: insan.js yol() düzgün Catmull-Rom'dur; seyrek köşe + uzun kenar
  // merceğe döner ya da köşede kanca yapar, eşit aralık bunu önler
  const yogun = (pts, aralik) => {
    const out = [];
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / aralik));
      for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
    });
    return out;
  };
  // (Yuvarlak köşeli) dikdörtgen noktaları (cizgi için, kapalı)
  const dikdortgen = (x0, y0, x1, y1, rc = 0) => {
    const p = [];
    if (!rc) p.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
    else {
      const kose = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = (a0 + i * 30) * Math.PI / 180; p.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a)]); } };
      kose(x1 - rc, y0 + rc, 270); kose(x1 - rc, y1 - rc, 0); kose(x0 + rc, y1 - rc, 90); kose(x0 + rc, y0 + rc, 180);
    }
    return yogun(p, sinir(Math.min(x1 - x0, y1 - y0) / 2.5, 4, 40));
  };

  // ---------- Katmanlar ve görünürlük (yalnız kendi pencerelerinde)
  const O = ctx.katman('v3', 10);       // ön görünüm
  const Ku = ctx.katman('v3-kus', 10);  // kuş bakışı
  // El yazısı katmanı: #yazi içinde, kameradan bağımsız (satırlar #12→#13→#14 kesmelerinin üstünden akar)
  const Yz = document.createElement('div');
  Object.assign(Yz.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
  Yz.dataset.ad = 'v3-el';
  ctx.yaziKatmani.appendChild(Yz);
  const pencere = (div, araliklar) => {
    gsap.set(div, { autoAlpha: 0 }); // ilk kare: kurulur kurulmaz gizli
    tl.set(div, { autoAlpha: 0 }, 0);
    for (const [a, b] of araliklar) { tl.set(div, { autoAlpha: 1 }, k(a)); tl.set(div, { autoAlpha: 0 }, k(b)); }
  };
  pencere(O.div, [[624, 660], [768, 816], [912, 972]]);
  pencere(Ku.div, [[660, 768], [816, 912]]);
  pencere(Yz, [[774, 972]]);

  // =====================================================================================================
  // ÖN GÖRÜNÜM (kutu birimi → dünya: translate(ox, oy) scale(S))
  // =====================================================================================================
  const Yk = YERLESIM.kisi, S = Yk.olcek;
  const kutu = `translate(${Yk.x - 200 * S} ${Yk.alt - 440 * S}) scale(${S})`;
  const bgP = el(O.svg, 'g'), bg = el(bgP, 'g', { transform: kutu });     // paralaks 0,25
  const mid = el(O.svg, 'g', { transform: kutu });                        // paralaks 1,0
  const fgP = el(O.svg, 'g'), fg = el(fgP, 'g', { transform: kutu });     // paralaks 1,4
  const dunya = el(O.svg, 'g');                                           // balon (dünya koordinatı)

  // --- Arka plan (0,25): delikli pano, raf, markasız kutular. Açık çizgi, geride kalsın
  const AR = '#a59e91';
  const pano = yer({ x0: 480, y0: 40, x1: 1000, y1: 330, raf: 380, rx0: 470, rx1: 1130 }, { x0: 60, y0: -200, x1: 620, y1: 10, raf: 300, rx0: 440, rx1: 760 });
  cizgi(bg, dikdortgen(pano.x0, pano.y0, pano.x1, pano.y1, 10), { kapali: true, dolgu: '#e6e1d7', renk: AR, kalinlik: 2.6, tohum: 301, kay: [2, 2] });
  {
    let d = '';
    for (let x = pano.x0 + 26; x < pano.x1 - 10; x += 32) for (let y = pano.y0 + 24; y < pano.y1 - 10; y += 32) d += `M${x} ${y}h0.1`;
    el(bg, 'path', { d, stroke: '#bdb6a9', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' });
    // Asılı cetvel ve çekiç (silüet)
    const cx = pano.x0 + 60, cy = pano.y0 + 50;
    cizgi(bg, dikdortgen(cx, cy, cx + 220, cy + 26, 3), { kapali: true, dolgu: '#ece8e0', renk: AR, kalinlik: 2.4, tohum: 302, kay: [1.5, 1.5] });
    let t = ''; for (let i = 1; i < 11; i++) t += `M${cx + i * 20} ${cy}v${i % 5 ? 8 : 14}`;
    el(bg, 'path', { d: t, stroke: AR, 'stroke-width': 2, fill: 'none' });
    const hx = pano.x0 + 330, hy = pano.y0 + 60;
    cizgi(bg, [[hx, hy], [hx + 10, hy + 150]], { renk: AR, kalinlik: 9, tohum: 303 });
    cizgi(bg, dikdortgen(hx - 34, hy - 18, hx + 40, hy + 14, 5), { kapali: true, dolgu: '#d8d2c7', renk: AR, kalinlik: 2.4, tohum: 304, kay: [1.5, 1.5] });
  }
  cizgi(bg, [[pano.rx0, pano.raf], [pano.rx1, pano.raf]], { renk: AR, kalinlik: 3.2, tohum: 305 });
  [[0, 70, 54], [80, 64, 40], [158, 90, 62]].forEach(([dx, en, boy], i) => {
    const x = pano.rx0 + 20 + dx;
    cizgi(bg, dikdortgen(x, pano.raf - boy, x + en, pano.raf), { kapali: true, dolgu: ['#e2ddd3', '#d8d2c7', '#e6e1d7'][i], renk: AR, kalinlik: 2.4, tohum: 306 + i, kay: [1.5, 1.5] });
  });

  // --- Ön plan (1,4): sarkan lamba (yalnız #10'da)
  {
    const L = yer({ x: 990, y: 170 }, { x: 535, y: -140 });
    cizgi(fg, [[L.x, L.y], [L.x + 4, L.y - 520]], { kalinlik: 4, tohum: 311 });
    cizgi(fg, [[L.x - 62, L.y + 86], [L.x - 30, L.y], [L.x + 30, L.y], [L.x + 62, L.y + 86]], { kapali: true, dolgu: MONO.giysi[5], kalinlik: 4.2, tohum: 312 });
  }

  // --- B: düşüş grubu (iner, ezilir) > yaslanma grubu (döner) > sandalye, kişi, gövde altı, gözlük; kucak
  const pB = { ...ctx.kisiParam('B'), gozluk: null }; // gözlük ayrı çizilir: burna kayabilsin
  cizgi(mid, dikdortgen(66, 226, 334, 660, 40), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 4.2, tohum: 321 }); // sandalye sırtı (sabit)
  const dusus = el(mid, 'g'), yasl = el(dusus, 'g');
  const B = kisi(yasl, pB, { x: 200, alt: 440, olcek: 1 });
  const giysi = MONO.giysi[pB.giysi];
  el(yasl, 'path', { d: 'M29.5 436 L370.5 436 L336 640 L64 640 Z', fill: giysi, transform: 'translate(3 3)' }); // gövde altı (alt kenar çizgisini örter)
  cizgi(yasl, [[28.6, 440], [47, 540], [65, 640]], { kalinlik: 4.2, tohum: 322 });
  cizgi(yasl, [[371.4, 440], [353, 540], [335, 640]], { kalinlik: 4.2, tohum: 323 });
  // Kuru göz kırpma (#14): insan.js 'kirp' gözleri gülümser gibi kavisli ve ağzı/kaşı nötre çevirir; burada 'sikkin'
  // yüzü (çatık kaş, düşük ağız) korunur, yalnız gözler ten rengi kapakla kapanır (düz çizgi)
  const kapakG = el(yasl, 'g');
  {
    const gx = pB.yuzEn * 0.38, ten = MONO.ten[pB.ten];
    for (const yon of [-1, 1]) {
      el(kapakG, 'ellipse', { cx: 200 + yon * gx, cy: 178.5, rx: 14, ry: 9.5, fill: ten });
      cizgi(kapakG, [[200 + yon * gx - 9, 179], [200 + yon * gx, 180], [200 + yon * gx + 9, 179.5]], { kalinlik: 3.6, genlik: 0.5, tohum: 330 + yon });
    }
    gsap.set(kapakG, { autoAlpha: 0 });
  }
  const gozG = el(yasl, 'g');
  {
    const gx = pB.yuzEn * 0.38;
    for (const yon of [-1, 1]) cizgi(gozG, oval(200 + yon * gx, 178, 18, 13, 0, 360, 14, 3.6), { kapali: true, kalinlik: 3.4, genlik: 0.8, tohum: 324 + yon });
    cizgi(gozG, [[200 - gx + 16, 176], [200, 173], [200 + gx - 16, 176]], { kalinlik: 3.2, genlik: 0.8, tohum: 327 });
  }
  cizgi(dusus, [[34, 604], [70, 588], [330, 588], [366, 604], [370, 650], [346, 672], [54, 672], [30, 650]], { kapali: true, dolgu: MONO.giysi[5], kalinlik: 4.2, tohum: 328 }); // kucak
  cizgi(dusus, [[200, 596], [201, 668]], { kalinlik: 2.6, tohum: 329 });

  // --- Çekmece (kapalıyken masanın sol ucunda; çekilince sola kayar) ve masa (üstte: çekmecenin içerdeki kısmını örter)
  const CEK_ON = 170; // ön görünüm çekiş mesafesi (kutu birimi)
  const cekO = el(mid, 'g');
  {
    const r = rng(331);
    for (let i = 0; i < 10; i++) { // çekmece kenarından taşan vida başları
      const x = 432 + i * 23 + (r() - 0.5) * 8, h = 7 + r() * 8, e = (r() - 0.5) * 8;
      cizgi(cekO, [[x, 544], [x + e, 541 - h]], { kalinlik: 3.4, tohum: 340 + i, genlik: 0.6 });
      cizgi(cekO, [[x + e - 5, 539 - h], [x + e + 5, 539 - h]], { kalinlik: 3.6, tohum: 360 + i, genlik: 0.6 });
    }
  }
  cizgi(cekO, dikdortgen(420, 538, 672, 604), { kapali: true, dolgu: '#cfc9bd', kalinlik: 4, genlik: 0.6, tohum: 332 });
  cizgi(cekO, dikdortgen(409, 529, 421, 613), { kapali: true, dolgu: '#b0a99c', kalinlik: 4, genlik: 0.5, tohum: 333 });
  cizgi(cekO, dikdortgen(396, 562, 409, 578), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 3, tohum: 334, kay: [2, 2] });
  const masa = el(mid, 'g');
  cizgi(masa, dikdortgen(420, 526, 1700, 614), { kapali: true, dolgu: '#bdb6a9', kalinlik: 4.2, genlik: 0.5, tohum: 335 });
  cizgi(masa, dikdortgen(404, 498, 1700, 526), { kapali: true, dolgu: '#a59e91', kalinlik: 4.2, genlik: 0.5, tohum: 336 });
  cizgi(masa, dikdortgen(424, 614, 452, 1300), { kapali: true, dolgu: '#a59e91', kalinlik: 4.2, genlik: 0.5, tohum: 337 });
  cizgi(masa, [[590, 452], [636, 452], [634, 498], [592, 498]], { kapali: true, dolgu: '#d8d2c7', kalinlik: 3.6, tohum: 338 }); // kupa
  cizgi(masa, [[636, 462], [652, 466], [652, 484], [635, 490]], { kalinlik: 3.4, tohum: 339 });

  // --- Kol yer tutucusu (#10): omuzdan çekmece koluna, iki kemikli basit IK, dirsek dışa
  const kolG = el(mid, 'g');
  const kolDis = cizgi(kolG, [[0, 0], [1, 1], [2, 2]], { kalinlik: 32, tohum: 371 });
  const kolIc = cizgi(kolG, [[0, 0], [1, 1], [2, 2]], { kalinlik: 23, renk: giysi, tohum: 371 });
  const el1 = cizgi(kolG, oval(0, 0, 15, 13, 0, 360, 10), { kapali: true, dolgu: MONO.ten[pB.ten], kalinlik: 3.6, tohum: 372, kay: [2, 2] });

  // --- Geç kalan vida (#14): çekmece ön kapağının üst köşesinde, yuvarlanıp düşer
  const gecG = el(mid, 'g');
  cizgi(gecG, [[-8, -3], [13, -3], [16, 0], [13, 3], [-8, 3]], { kapali: true, dolgu: '#b0a99c', kalinlik: 2.6, tohum: 381, kay: [1, 1], genlik: 0.4 });
  cizgi(gecG, dikdortgen(-14, -6, -8, 6), { kapali: true, dolgu: '#8d867a', kalinlik: 2.6, tohum: 382, kay: [1, 1], genlik: 0.4 });

  // --- Ön görünüm durumu (tween'ler bu nesneyi sürer; onCiz her şeyi ondan çizer)
  const bs = { dy: -150, sx: 1, sy: 1, rot: 0, gy: 0, L: 0, kol: 0, gx: 248, gyV: 520, gr: 0, gec: 0 };
  const omuz = () => {
    const a = bs.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const x = 312 - 200, y = 338 - 600;
    const xr = 200 + x * c - y * s, yr = 600 + x * s + y * c;
    return [200 + (xr - 200) * bs.sx, 668 + (yr - 668) * bs.sy + bs.dy];
  };
  const ik = (o, h, l1, l2) => {
    const dx = h[0] - o[0], dy = h[1] - o[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
    const a = Math.acos(sinir((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), t = Math.atan2(dy, dx) - a;
    return [o[0] + l1 * Math.cos(t), o[1] + l1 * Math.sin(t)];
  };
  function onCiz() {
    dusus.setAttribute('transform', `translate(0 ${bs.dy.toFixed(2)}) translate(200 668) scale(${bs.sx.toFixed(4)} ${bs.sy.toFixed(4)}) translate(-200 -668)`);
    yasl.setAttribute('transform', `rotate(${bs.rot.toFixed(3)} 200 600)`);
    gozG.setAttribute('transform', `translate(0 ${bs.gy.toFixed(2)})`);
    const dx = -CEK_ON * bs.L;
    // çekilirken kenardan taşan vidalar takırdar (kare tek/çift: ±1,4)
    const f = Math.round(tl.time() * 60), titre = bs.L > 0.02 && bs.L < 0.995 ? (f % 2 ? 1.4 : -1.4) : 0;
    cekO.setAttribute('transform', `translate(${dx.toFixed(2)} ${titre})`);
    kolG.style.visibility = bs.kol ? 'visible' : 'hidden';
    if (bs.kol) {
      const o = omuz(), h = [402 + dx, 570], d = ik(o, h, 150, 140);
      kolDis.pts = kolIc.pts = [o, d, h]; kolDis.ciz(); kolIc.ciz();
      el1.pts = oval(h[0], h[1], 15, 13, 0, 360, 10); el1.ciz();
    }
    gecG.style.visibility = bs.gec ? 'visible' : 'hidden';
    gecG.setAttribute('transform', `translate(${bs.gx.toFixed(2)} ${bs.gyV.toFixed(2)}) rotate(${bs.gr.toFixed(2)}) scale(1.5)`);
  }
  onCiz();
  const ayarla = (kare, deg) => { tl.set(bs, deg, k(kare)); tl.call(onCiz, null, k(kare)); };
  const git = (kare, sure, deg, ease) => tl.to(bs, { ...deg, duration: k(sure), ease, onUpdate: onCiz }, k(kare));
  const poz = (kare, o) => tl.call(() => B.poz(o), null, k(kare));

  // --- Kamera ve paralaks: ön plan ve arka plan, kameranın #10 bitiş durumuna göre 1,4 / 0,25 kat hareket eder
  // Dikey hedefler kutu birimine bağlı: YERLESIM.kisi.alt değişirse sahne onunla kayar (kutuY = kutunun dünyadaki üstü)
  const kutuY = Yk.alt - 440 * S;
  const kamSon = yer(odak(1150, 950, 0.8), odak(740, kutuY + 610, 0.88));
  // #14: balon (tümsekleriyle) kadrajın içinde, üstte ≥ 60 px pay; B ve çekilmiş çekmece görünür
  const kam14 = yer({ c: [960, 710], s: 0.64 }, { c: [460, kutuY + 355], s: 0.76 });
  kam14.dus = (kam14.c[1] + H / 2 / kam14.s - kutuY) / S + 24; // vidanın kadrajdan tam çıktığı y (kutu birimi)
  function paralaks() {
    const s = gsap.getProperty(ctx.kamera, 'scaleX'), x = gsap.getProperty(ctx.kamera, 'x'), y = gsap.getProperty(ctx.kamera, 'y');
    for (const [g, f] of [[bgP, 0.25], [fgP, 1.4]]) {
      const sf = kamSon.scale * Math.pow(s / kamSon.scale, f);
      const xf = kamSon.x + (x - kamSon.x) * f, yf = kamSon.y + (y - kamSon.y) * f;
      g.setAttribute('transform', `translate(${((xf - x) / s).toFixed(2)} ${((yf - y) / s).toFixed(2)}) scale(${(sf / s).toFixed(5)})`);
    }
  }
  const prx = { p: 0 };
  const kamYol = (k0, sure, hedef, ease = E.KM) => {
    kameraGit(k0, sure, hedef, ease);
    tl.fromTo(prx, { p: 0 }, { p: 1, duration: k(sure), ease: 'none', onUpdate: paralaks, immediateRender: false }, k(k0));
  };
  const kamKoy = (k0, hedef) => { kameraKoy(k0, hedef); tl.call(paralaks, null, k(k0)); };
  const BIRIM = { x: 0, y: 0, scale: 1 };

  // =====================================================================================================
  // #10 (k624–671): B iner, kadraj açılır (40 k KM), hazırlık 4 k, çekiş 20 k EO; k660 kuş bakışına kesme
  // =====================================================================================================
  kamKoy(624, BIRIM);
  ayarla(624, { dy: -150, sx: 1, sy: 1, rot: 0, gy: 0, L: 0, kol: 0, gec: 0 });
  poz(624, { ifade: 'notr', bakis: [0, 0] });
  tl.set(fgP, { autoAlpha: 1 }, k(624));
  tl.set(bgP, { autoAlpha: 0 }, k(624));
  tl.fromTo(bgP, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(16), ease: 'none', immediateRender: false }, k(630));
  git(624, 8, { dy: 0 }, adimli('power2.in', 8, 2));                           // yukarıdan oturur; düşüş yalnız hızlanır (30 fps)
  git(632, 2, { sx: 1.07, sy: 0.935 }, 'none');                                // oturma: ezilme (x·y ≈ 1)
  git(634, 10, { sx: 1, sy: 1 }, adimli(E.BO, 10, 5));
  kamYol(628, 40, kamSon);
  poz(640, { ifade: 'merak', bakis: [1, 1] });                                 // çekmeceye bakar
  ayarla(636, { kol: 1 });
  poz(adim(650), { ifade: 'notr', bakis: [1, 1] });
  git(650, 4, { rot: 2.5 }, adimli('power1.out', 4, 2));                       // hazırlık: çekmeceye doğru eğilir
  git(654, 10, { rot: -7 }, adimli(E.EO, 10, 2));                               // geriye yaslanır (hızlı aksiyon, 30 fps)
  tl.fromTo(bs, { L: 0 }, { L: 1, duration: k(20), ease: E.EO, onUpdate: onCiz, immediateRender: false }, k(654)); // çekiş
  tl.set(fgP, { autoAlpha: 0 }, k(660));

  // =====================================================================================================
  // KUŞ BAKIŞI (çekmece-yerel u; ekran = O + σ·(x, y + D))
  // =====================================================================================================
  const sig = yer(2.2, 2.0), YD = yer(212, 660);
  const OX = (W - 480 * sig) / 2, OY = YD - 336 * sig;
  const LB = 280, CEK0 = 654, CEK_K = 20, KC = 0.45;
  const D = (f) => LB * EOf(sinir((f - CEK0) / CEK_K, 0, 1));
  const ekran = (x, y, f = 2000) => [OX + sig * x, OY + sig * (y + D(f))];
  const ZEMIN = '#ebe7df';

  const cekG = el(Ku.svg, 'g');
  cizgi(cekG, dikdortgen(-14, -12, 494, 318, 6), { kapali: true, dolgu: '#b5b1aa', kalinlik: 2.6, genlik: 0.7, tohum: 401, kay: [1.5, 1.5] });
  cizgi(cekG, dikdortgen(0, 0, 480, 300, 3), { kapali: true, dolgu: ZEMIN, kalinlik: 2, genlik: 0.6, tohum: 402, kay: [0, 0] });
  cizgi(cekG, dikdortgen(-34, 316, 514, 338, 3), { kapali: true, dolgu: '#a59e91', kalinlik: 2.6, genlik: 0.7, tohum: 403, kay: [1.5, 1.5] });
  cizgi(cekG, dikdortgen(205, 338, 275, 350, 4), { kapali: true, dolgu: MONO.giysi[5], kalinlik: 2.2, genlik: 0.5, tohum: 404, kay: [1, 1] });
  const lekeG = el(cekG, 'g'), parcaG = el(cekG, 'g'), posetG = el(cekG, 'g'), dokulG = el(cekG, 'g'), orgG = el(cekG, 'g'), okG = el(cekG, 'g');
  // Masa (çekmecenin arkasını örter) ve kenar gölgesi
  el(Ku.svg, 'rect', { x: 0, y: YD, width: W, height: 16, fill: MUR, opacity: 0.1 });
  cizgi(Ku.svg, dikdortgen(-30, -30, W + 30, YD), { kapali: true, dolgu: GRI, kalinlik: 5, tohum: 405, kay: [0, 0] });
  const kolK = el(Ku.svg, 'g');
  const kolKD = cizgi(kolK, [[0, 0], [1, 1]], { kalinlik: 64, tohum: 406 });
  const kolKI = cizgi(kolK, [[0, 0], [1, 1]], { kalinlik: 50, renk: giysi, tohum: 406 });
  const elK = cizgi(kolK, oval(0, 0, 30, 26, 0, 360, 10), { kapali: true, dolgu: MONO.ten[pB.ten], kalinlik: 4.5, tohum: 407, kay: [3, 3] });

  // --- Parçalar (vida, somun, pul): tohumlu üretim
  const rs = rng(3301), U = (a, b) => a + (b - a) * rs();
  const P = [];
  P.push({ tur: 'vida', L: 112, w: 7, ozel: true, hx: 168, hy: 189, th0: 2.5 }); // uzun vida: kısa bölmeye düşecek
  P.push({ tur: 'vida', L: U(92, 102), w: 6.4 });
  P.push({ tur: 'vida', L: U(86, 96), w: 6 });
  for (let i = 0; i < 31; i++) { const L = 16 + 42 * Math.pow(rs(), 1.4); P.push({ tur: 'vida', L, w: 3.6 + L * 0.045 + U(-0.4, 0.4) }); }
  for (let i = 0; i < 14; i++) P.push({ tur: 'somun', R: U(6, 9.5) });
  for (let i = 0; i < 12; i++) P.push({ tur: 'pul', R: U(5.5, 9) });
  for (const p of P) {
    p.cr = p.tur === 'vida' ? sinir(p.L * 0.26, 4.5, 14) : p.R;
    p.im = p.ozel ? 0 : 1 / (p.tur === 'vida' ? p.L * p.w * 0.12 : p.R * p.R * 0.3); // ters kütle
  }
  // Başlangıç dağılımı: poşetin ve uzun vidanın yeri boş kalsın; çakışmalar gevşetilir
  const ozel = P[0];
  ozel.x0 = ozel.hx; ozel.kay = 26; ozel.y0 = ozel.hy - ozel.kay;
  const bosMu = (x, y, cr) => !(x + cr > 410 && y > 100 && y < 200) && Math.hypot(x - ozel.x0, y - ozel.y0) > cr + 30;
  for (const p of P) {
    if (p.ozel) continue;
    for (let t = 0; t < 40; t++) { p.x0 = U(p.cr, 480 - p.cr); p.y0 = U(p.cr + 6, 300 - p.cr - 6); if (bosMu(p.x0, p.y0, p.cr)) break; }
  }
  for (let it = 0; it < 60; it++) {
    for (let a = 1; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const pa = P[a], pb = P[b], dx = pb.x0 - pa.x0, dy = pb.y0 - pa.y0, m = (pa.cr + pb.cr) * 0.9, d = Math.hypot(dx, dy) || 0.01;
      if (d < m) { const o = (m - d) / 2; pa.x0 -= dx / d * o; pa.y0 -= dy / d * o; pb.x0 += dx / d * o; pb.y0 += dy / d * o; }
    }
    for (const p of P) if (!p.ozel) { p.x0 = sinir(p.x0, p.cr, 480 - p.cr); p.y0 = sinir(p.y0, p.cr + 4, 300 - p.cr - 4); }
  }
  for (const p of P) {
    if (p.ozel) { Object.assign(p, { lag: 3, fa: 661, fdur: 680 }); continue; }
    p.lag = U(2, 4); p.fa = 660 + Math.floor(U(0, 3.99)); p.fdur = U(675, 684);
    p.vb = U(2.5, 7) * (p.tur === 'vida' ? 1 : 1.25); p.sx = U(-0.32, 0.32); p.so = U(-1.4, 1.4); p.th0 = U(0, 360);
  }

  // --- Benzetim (k654–960, kare başına): faz A gecikmeli takip, faz B itki + sürtünme + duvar + çarpışma
  const FS = 654, FE = 960, NF = FE - FS + 1;
  const X = P.map(() => new Float32Array(NF)), Yy = P.map(() => new Float32Array(NF)), TH = P.map(() => new Float32Array(NF));
  {
    const yA = (p, f) => p.y0 + KC * (D(f - p.lag) - D(f));
    const st = P.map((p) => ({ x: p.x0, y: p.y0, th: p.th0, vx: 0, vy: 0, w: 0, mu: 0, faz: 0 }));
    for (let f = FS; f <= FE; f++) {
      const j = f - FS;
      P.forEach((p, i) => {
        const s = st[i];
        if (p.ozel) { // uzun vida: hedefe tam oturan, öngörülmüş yol (çarpışmada itilmez, iter)
          const q = f < p.fa ? 0 : Math.min(1, (f - p.fa) / (p.fdur - p.fa));
          s.y = Math.max(p.cr, p.hy - p.kay * (1 - q) * (1 - q) + KC * (D(f - p.lag) - D(f)));
          s.x = p.hx; s.th = p.th0; s.faz = 1;
          return;
        }
        if (f < p.fa) { s.y = Math.max(p.cr, yA(p, f)); s.x = p.x0; s.th = p.th0; return; }
        if (s.faz === 0) {
          s.faz = 1;
          s.y = Math.max(p.cr, yA(p, f));
          s.vy = yA(p, f) - yA(p, f - 1) + p.vb; s.vx = s.vy * p.sx; s.w = s.vy * p.so;
          s.mu = Math.hypot(s.vx, s.vy) / Math.max(4, p.fdur - f);
          return;
        }
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > 1e-6) { const o = Math.max(0, sp - s.mu) / sp; s.vx *= o; s.vy *= o; s.w *= o; }
        s.x += s.vx; s.y += s.vy; s.th += s.w;
      });
      if (f <= 704) { // çarpışma (daire), konum düzeltme + dürtü (sekme katsayısı 0,35)
        for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
          const A = st[a], Bq = st[b];
          const ia = A.faz ? P[a].im : 0, ib = Bq.faz ? P[b].im : 0;
          if (ia + ib === 0) continue;
          const dx = Bq.x - A.x, dy = Bq.y - A.y, m = P[a].cr + P[b].cr, d2 = dx * dx + dy * dy;
          if (d2 >= m * m) continue;
          const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, kk = (m - d) * 0.6 / (ia + ib);
          A.x -= nx * kk * ia; A.y -= ny * kk * ia; Bq.x += nx * kk * ib; Bq.y += ny * kk * ib;
          const vr = (Bq.vx - A.vx) * nx + (Bq.vy - A.vy) * ny;
          if (vr < 0) {
            const J = -1.35 * vr / (ia + ib);
            A.vx -= J * ia * nx; A.vy -= J * ia * ny; Bq.vx += J * ib * nx; Bq.vy += J * ib * ny;
            const mu = Math.max(A.mu, Bq.mu, 0.4); A.mu = Bq.mu = mu; // çarpışan durur
          }
        }
      }
      P.forEach((p, i) => { // duvarlar
        const s = st[i];
        if (!p.ozel && s.faz) {
          if (s.y > 300 - p.cr) { s.y = 300 - p.cr; s.vy = -0.25 * Math.abs(s.vy); }
          if (s.y < p.cr) { s.y = p.cr; s.vy = 0.25 * Math.abs(s.vy); }
          if (s.x < p.cr) { s.x = p.cr; s.vx = 0.3 * Math.abs(s.vx); }
          if (s.x > 480 - p.cr) { s.x = 480 - p.cr; s.vx = -0.3 * Math.abs(s.vx); }
        }
        X[i][j] = s.x; Yy[i][j] = s.y; TH[i][j] = s.th;
      });
    }
  }
  // Leke: hızlı vidada en hızlı 1–2 kare (ekran hızı eşiği), boy 2 × vida boyu, hareketin tersine
  const ESIK = 18; // çekmeceye göre ekran hızı (px/k): öne fırlayan vida
  const leke = P.map((p, i) => {
    if (p.tur !== 'vida' || p.ozel) return null;
    let enH = 0, enF = -1;
    const hiz = (f) => { const j = f - FS; return sig * Math.hypot(X[i][j] - X[i][j - 1], Yy[i][j] - Yy[i][j - 1]); };
    for (let f = 660; f <= 700; f++) { const v = hiz(f); if (v > enH) { enH = v; enF = f; } }
    if (enH < ESIK) return null;
    const kareler = new Set([enF]);
    if (hiz(enF + 1) > ESIK && hiz(enF + 1) > enH * 0.7) kareler.add(enF + 1);
    else if (enF > 660 && hiz(enF - 1) > ESIK) kareler.add(enF - 1);
    return { kareler, yol: el(lekeG, 'path', { fill: 'none', stroke: MUR, 'stroke-width': p.w * 1.3, 'stroke-linecap': 'round', opacity: 0.22, visibility: 'hidden' }) };
  });

  // --- Parça çizimleri (yerel u, merkez 0,0; konum ve açı kare başına)
  const vidaCiz = (ust, L, w, tohum) => {
    const g = el(ust, 'g'), hl = Math.max(3.5, w * 0.85), hw = w * 0.95, x0 = -L / 2, xb = x0 + hl, x1 = L / 2;
    cizgi(g, [[xb, -w / 2], [x1 - w * 0.6, -w / 2], [x1, 0], [x1 - w * 0.6, w / 2], [xb, w / 2]], { kapali: true, dolgu: '#b0a99c', kalinlik: 1.5, genlik: 0.3, tohum, kay: [0.8, 0.8] });
    let d = '';
    for (let x = xb + 3.5; x < x1 - w; x += 4.2) d += `M${x.toFixed(1)} ${(-w / 2 + 0.6).toFixed(1)}L${(x + 1.8).toFixed(1)} ${(w / 2 - 0.6).toFixed(1)}`;
    if (d) el(g, 'path', { d, stroke: MUR, 'stroke-width': 0.9, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 });
    cizgi(g, [[x0, -hw], [xb, -hw], [xb, hw], [x0, hw]], { kapali: true, dolgu: '#8d867a', kalinlik: 1.5, genlik: 0.3, tohum: tohum + 1, kay: [0.8, 0.8] });
    return g;
  };
  const somunCiz = (ust, R, tohum) => {
    const g = el(ust, 'g');
    cizgi(g, [0, 1, 2, 3, 4, 5].map((i) => [R * Math.cos((i * 60 + 30) * Math.PI / 180), R * Math.sin((i * 60 + 30) * Math.PI / 180)]), { kapali: true, dolgu: '#8d867a', kalinlik: 1.5, genlik: 0.3, tohum, kay: [0.8, 0.8] });
    cizgi(g, oval(0, 0, R * 0.46, R * 0.46, 0, 360, 8), { kapali: true, dolgu: ZEMIN, kalinlik: 1.2, genlik: 0.25, tohum: tohum + 1, kay: [0, 0] });
    return g;
  };
  const pulCiz = (ust, R, tohum) => {
    const g = el(ust, 'g');
    cizgi(g, oval(0, 0, R, R, 0, 360, 12), { kapali: true, dolgu: '#c2bcb1', kalinlik: 1.5, genlik: 0.3, tohum, kay: [0.8, 0.8] });
    cizgi(g, oval(0, 0, R * 0.42, R * 0.42, 0, 360, 8), { kapali: true, dolgu: ZEMIN, kalinlik: 1.2, genlik: 0.25, tohum: tohum + 1, kay: [0, 0] });
    return g;
  };
  // Çizim sırası karışık (üst üste binme doğal görünsün), uzun vida üstte
  const sira = P.map((_, i) => i).sort((a, b) => ((a * 7919) % 61) - ((b * 7919) % 61));
  sira.push(sira.splice(sira.indexOf(0), 1)[0]);
  const PG = [];
  for (const i of sira) {
    const p = P[i], t = 500 + i * 3;
    PG[i] = p.tur === 'vida' ? vidaCiz(parcaG, p.L, p.w, t) : p.tur === 'somun' ? somunCiz(parcaG, p.R, t) : pulCiz(parcaG, p.R, t);
  }

  // --- Poşet: sağ duvara dayalı durur, k700'de sallanır, k712'de devrilir (power2.in), 4 vida dökülür (6 k arayla)
  const PO = { b: [452, 150], t: [-0.988, 0.155], e: [0.155, 0.988], H: 82, a: 24 };
  const posetFi = (f) => {
    if (f < 700) return 0;
    if (f < 712) return (2 + (f - 700) * 0.5) * Math.sin(2 * Math.PI * (f - 700) / 6) * Math.PI / 180;
    if (f < 722) return 80 * Math.pow((f - 712) / 10, 2) * Math.PI / 180;
    if (f < 728) return (80 - 5 * Math.sin(Math.PI * (f - 722) / 6)) * Math.PI / 180;
    return 80 * Math.PI / 180;
  };
  const posetUst = (fi) => [PO.b[0] + PO.t[0] * PO.H * Math.sin(fi), PO.b[1] + PO.t[1] * PO.H * Math.sin(fi)];
  const posetGovde = cizgi(posetG, [[0, 0], [1, 0], [1, 1]], { kapali: true, dolgu: '#f4f1ea', kalinlik: 1.8, genlik: 0.5, tohum: 451, kay: [0.8, 0.8] });
  posetGovde.dolgu.setAttribute('fill-opacity', '0.85');
  const posetAgiz = cizgi(posetG, [[0, 0], [1, 0], [1, 1]], { kapali: true, dolgu: '#d8d2c7', kalinlik: 1.8, genlik: 0.4, tohum: 452, kay: [0, 0] });
  const posetIc = [0, 1].map((i) => cizgi(posetG, [[0, 0], [1, 1]], { kalinlik: 2.4, renk: '#8d867a', tohum: 453 + i, genlik: 0.3 }));
  function posetCiz(f) {
    const fi = posetFi(f), T = posetUst(fi), ol = 1 + PO.H * Math.cos(fi) / 220, a2 = PO.a * 1.1 * ol, [ex, ey] = PO.e, [b0, b1] = PO.b;
    posetGovde.pts = [[b0 - PO.a * ex, b1 - PO.a * ey], [b0 + PO.a * ex, b1 + PO.a * ey], [T[0] + a2 * ex, T[1] + a2 * ey], [T[0] - a2 * ex, T[1] - a2 * ey]];
    const kal = (3 + 5 * Math.cos(fi)) * ol, [tx, ty] = PO.t;
    posetAgiz.pts = [[T[0] - a2 * ex - kal * tx, T[1] - a2 * ey - kal * ty], [T[0] + a2 * ex - kal * tx, T[1] + a2 * ey - kal * ty], [T[0] + a2 * ex + kal * tx * 0.3, T[1] + a2 * ey + kal * ty * 0.3], [T[0] - a2 * ex + kal * tx * 0.3, T[1] - a2 * ey + kal * ty * 0.3]];
    posetIc.forEach((h, i) => {
      const u = 0.35 + i * 0.25, cx = b0 + (T[0] - b0) * u, cy = b1 + (T[1] - b1) * u, o = (i ? 6 : -7) * (0.4 + Math.sin(fi));
      h.pts = [[cx + ex * o - tx * 6, cy + ey * o - ty * 6], [cx + ex * o + tx * 6, cy + ey * o + ty * 6]];
    });
    for (const h of [posetGovde, posetAgiz, ...posetIc]) h.ciz();
  }
  // Dökülen 4 vida: ağızdan çıkar, düşer (power2.in), %40 sonra %15 seker, sürtünmeyle durur
  const DOK = [716, 722, 728, 734].map((f0, i) => {
    const r = rng(470 + i), R = (a, b) => a + (b - a) * r();
    const fi = posetFi(f0), T = posetUst(fi), h0 = PO.H * Math.cos(fi) * 0.85 + 7;
    const L = R(28, 44), w = R(4.5, 5.5), Tf = Math.max(5, 2.4 * Math.sqrt(h0));
    const v = [PO.t[0] * R(2.4, 3.6) + PO.e[0] * R(-0.9, 0.9), PO.t[1] * R(2.4, 3.6) + PO.e[1] * R(-0.9, 0.9)];
    const iz = [];
    let x = T[0] + PO.e[0] * R(-8, 8), y = T[1] + PO.e[1] * R(-8, 8), th = R(0, 360), w0 = R(-9, 9), vx = v[0], vy = v[1];
    const evre = [[Tf, h0, 'in'], [Tf * Math.sqrt(0.4), 0.4 * h0, 'sek'], [Tf * Math.sqrt(0.15), 0.15 * h0, 'sek']];
    let t = 0, ev = 0;
    for (let f = f0; f <= FE; f++) {
      let h = 0;
      if (ev < evre.length) {
        const [Tt, hh, tur] = evre[ev];
        if (tur === 'in') h = hh * (1 - (t / Tt) ** 2);
        else { const u = (t - Tt) / Tt; h = hh * (1 - u * u); }
        t++;
        if ((tur === 'in' && t > Tt) || (tur === 'sek' && t > 2 * Tt)) { ev++; t = 0; vx *= 0.55; vy *= 0.55; w0 *= 0.5; }
        x += vx; y += vy; th += w0;
      } else {
        const sp = Math.hypot(vx, vy);
        if (sp > 0.01) { const o = Math.max(0, sp - 0.3) / sp; vx *= o; vy *= o; x += vx; y += vy; }
      }
      iz.push([x, y, th, Math.max(0, h)]);
    }
    const g = el(dokulG, 'g', { visibility: 'hidden' });
    const golge = el(g, 'ellipse', { rx: L / 2, ry: w * 0.8, fill: MUR, opacity: 0.16 });
    const govde = vidaCiz(g, L, w, 480 + i * 3);
    return { f0, iz, g, golge, govde };
  });

  // --- Organizer hattı (#13): Gridfinity 42 u; kısa bölme uzun vidanın altında; sağ ön köşe çekmeceye sığmaz
  const BANT = [[0, 84, [2, 2, 3, 2, 2]], [84, 168, [3, 2, 2, 2, 2]], [168, 210, [3, 2, 2, 2, 2]], [210, 294, [2, 2, 2, 3, 2]]];
  const kutular = [];
  for (const [y0, y1, en] of BANT) { let x = 0; for (const n of en) { kutular.push([x, y0, x + n * 42, y1]); x += n * 42; } }
  const kisaK = kutular.find(([x0, y0]) => x0 === 126 && y0 === 168);
  const kotuK = kutular[kutular.length - 1]; kotuK[2] = 496; // 16 u taşar (sağ duvara biner)
  const orgIc = el(orgG, 'g');
  const icDikd = (b) => dikdortgen(b[0] + 2.5, b[1] + 2.5, b[2] - 2.5, b[3] - 2.5, 6);
  kutular.forEach((b, i) => { if (b !== kotuK && b !== kisaK) cizgi(orgIc, icDikd(b), { kapali: true, kalinlik: 2.2, genlik: 0.6, tohum: 600 + i }); });
  const kisaG = el(orgIc, 'g'), kotuG = el(orgIc, 'g');
  cizgi(kisaG, icDikd(kisaK), { kapali: true, kalinlik: 2.2, genlik: 0.6, tohum: 640 });
  const kisaV = cizgi(kisaG, icDikd(kisaK), { kapali: true, kalinlik: 3, renk: VURGU, genlik: 0.6, tohum: 641 });
  cizgi(kotuG, icDikd(kotuK), { kapali: true, kalinlik: 2.2, genlik: 0.6, tohum: 642 });
  const kotuV = cizgi(kotuG, icDikd(kotuK), { kapali: true, kalinlik: 3.2, renk: VURGU, genlik: 0.6, tohum: 643 });
  gsap.set([kisaV.g, kotuV.g], { opacity: 0 });
  // Ölçü okları (vurgu): kısa bölmenin eni (84) ve uzun vidanın boyu (112)
  const ok = (x0, x1, y, tohum) => {
    const g = el(okG, 'g'), parcalar = [];
    parcalar.push(cizgi(g, [[x0, y], [x1, y]], { kalinlik: 2.4, renk: VURGU, genlik: 0.4, tohum }));
    for (const [x, yon] of [[x0, 1], [x1, -1]]) {
      parcalar.push(cizgi(g, [[x + yon * 7, y - 5], [x, y], [x + yon * 7, y + 5]], { kalinlik: 2.4, renk: VURGU, genlik: 0.3, tohum: tohum + (yon > 0 ? 1 : 2) }));
      parcalar.push(cizgi(g, [[x, y - 9], [x, y + 9]], { kalinlik: 1.8, renk: VURGU, genlik: 0.3, tohum: tohum + (yon > 0 ? 3 : 4) }));
    }
    return { g, yollar: parcalar.map((h) => h.yol) };
  };
  const ok1 = ok(126, 210, 160, 660);
  const cth = Math.cos(ozel.th0 * Math.PI / 180), sth = Math.sin(ozel.th0 * Math.PI / 180);
  const ok2 = ok(0, 112, 0, 670);
  ok2.g.setAttribute('transform', `translate(${ozel.hx - 56 * cth - 15 * sth} ${ozel.hy - 56 * sth + 15 * cth}) rotate(${ozel.th0})`);

  // --- Kare başına kuş bakışı çizimi
  const kolAci = yer(70, 55) * Math.PI / 180;
  function kusCiz(f) {
    f = sinir(Math.round(f), FS, FE);
    const j = f - FS, Df = D(f);
    cekG.setAttribute('transform', `translate(${OX.toFixed(2)} ${(OY + sig * Df).toFixed(2)}) scale(${sig})`);
    P.forEach((p, i) => {
      PG[i].setAttribute('transform', `translate(${X[i][j].toFixed(2)} ${Yy[i][j].toFixed(2)}) rotate(${TH[i][j].toFixed(1)})`);
      const l = leke[i];
      if (!l) return;
      if (l.kareler.has(f) && j > 0) {
        const dx = X[i][j] - X[i][j - 1], dy = Yy[i][j] + Df - Yy[i][j - 1] - D(f - 1), d = Math.hypot(dx, dy) || 1, uz = p.L * 2;
        l.yol.setAttribute('d', `M${(X[i][j] - dx / d * uz).toFixed(1)} ${(Yy[i][j] - dy / d * uz).toFixed(1)}L${X[i][j].toFixed(1)} ${Yy[i][j].toFixed(1)}`);
        l.yol.setAttribute('visibility', 'visible');
      } else l.yol.setAttribute('visibility', 'hidden');
    });
    posetCiz(f);
    for (const dk of DOK) {
      if (f < dk.f0) { dk.g.setAttribute('visibility', 'hidden'); continue; }
      const [x, y, th, h] = dk.iz[f - dk.f0];
      dk.g.setAttribute('visibility', 'visible');
      dk.golge.setAttribute('transform', `translate(${(x + h * 0.3).toFixed(1)} ${(y + h * 0.4).toFixed(1)}) rotate(${th.toFixed(1)})`);
      dk.govde.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(1 + h / 220).toFixed(3)}) rotate(${th.toFixed(1)})`);
    }
    // El çekmece kolunda (yalnız #11)
    const [kx, ky] = ekran(240, 347, f);
    const son = [kx + Math.cos(kolAci) * 900, ky + Math.sin(kolAci) * 900];
    kolKD.pts = kolKI.pts = [[kx + Math.cos(kolAci) * 20, ky + Math.sin(kolAci) * 20], son];
    elK.pts = oval(kx, ky, 30, 26, 0, 360, 10);
    for (const h of [kolKD, kolKI, elK]) h.ciz();
  }
  kusCiz(FS);
  const kusPrx = { f: FS };
  tl.fromTo(kusPrx, { f: FS }, { f: FE, duration: k(FE - FS), ease: 'none', onUpdate: () => kusCiz(kusPrx.f), immediateRender: false }, k(FS));
  tl.set(kolK, { autoAlpha: 1 }, k(660));
  tl.set(kolK, { autoAlpha: 0 }, k(768));
  tl.set([orgG, okG], { autoAlpha: 0 }, 0);

  // =====================================================================================================
  // #11 (k672–767): kuş bakışı; kamera hafif iter (ölü kare yok). İçerik benzetimden, poşet k712
  // =====================================================================================================
  const cekMerkez = ekran(240, 150);
  kamKoy(660, BIRIM);
  kameraGit(660, 108, odak(cekMerkez[0], cekMerkez[1], 1.02, cekMerkez[0], cekMerkez[1]), 'none');

  // =====================================================================================================
  // #12 (k768–815): B'nin yüzü; balon hızlı açılır, organizer doodle'ı 16 k çizilir, "Bir organizer lazım."
  // =====================================================================================================
  kamKoy(768, BIRIM);
  kamYol(768, 48, odak(W / 2, H / 2, 1.015), 'none');
  ayarla(768, { dy: 0, sx: 1, sy: 1, rot: 0, gy: 0, kol: 0, gec: 0 });
  tl.set(bgP, { autoAlpha: 0.45 }, k(768)); // balonun arkası sade kalsın
  poz(768, { ifade: 'notr', bakis: [1, 1] });
  poz(adim(776), { ifade: 'merak', bakis: [1, -1] });
  poz(adim(800), { ifade: 'notr', bakis: [1, -1] });
  const BL = YERLESIM.balon;
  const bal = balon(dunya, { c: BL.c, r: BL.r, noktalar: YERLESIM.noktalar, tohum: 31, koken: YERLESIM.balonKoken });
  bal.ac(770, { hizli: true }); // noktalar 2 k arayla, bulut 8 k (k774–782)
  // Organizer doodle'ı (üstten görünüş, bölmeli)
  const dz = yer({ c: [1400, 392], en: 330, boy: 168 }, { c: [560, 662], en: 420, boy: 210 });
  const dX = (u) => dz.c[0] + (u - 0.5) * dz.en, dY = (v) => dz.c[1] + (v - 0.5) * dz.boy;
  const doodleG = el(bal.ic, 'g');
  const doodle = [
    cizgi(doodleG, dikdortgen(dX(0), dY(0), dX(1), dY(1), 14), { kapali: true, kalinlik: 5, genlik: 1.4, tohum: 701 }),
    cizgi(doodleG, [[dX(0), dY(0.5)], [dX(1), dY(0.5)]], { kalinlik: 4, genlik: 1.2, tohum: 702 }),
    ...[0.25, 0.5, 0.75].map((u, i) => cizgi(doodleG, [[dX(u), dY(0)], [dX(u), dY(0.5)]], { kalinlik: 4, genlik: 1.2, tohum: 703 + i })),
    ...[0.38, 0.7].map((u, i) => cizgi(doodleG, [[dX(u), dY(0.5)], [dX(u), dY(1)]], { kalinlik: 4, genlik: 1.2, tohum: 706 + i })),
  ];
  const minik = [[0.12, 0.25, -8], [0.62, 0.28, 12], [0.2, 0.76, 4], [0.84, 0.74, -14]].map(([u, v, a], i) => {
    const g = el(doodleG, 'g', { transform: `translate(${dX(u)} ${dY(v)}) rotate(${a})` });
    cizgi(g, [[-18, 0], [18, 0]], { kalinlik: 4.5, genlik: 0.8, tohum: 710 + i });
    cizgi(g, [[-18, -6], [-18, 6]], { kalinlik: 5, genlik: 0.6, tohum: 715 + i });
    return g;
  });
  const doodleYol = doodle.map((h) => h.yol);
  tl.set(doodleYol, { drawSVG: '0%' }, k(769));
  tl.set(minik, { autoAlpha: 0 }, k(769));
  tl.fromTo(doodleYol[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: k(8), ease: E.EO, immediateRender: false }, k(784));
  tl.fromTo(doodleYol.slice(1), { drawSVG: '0%' }, { drawSVG: '100%', duration: k(5), ease: E.EO, stagger: k(1.6), immediateRender: false }, k(790));
  tl.set(doodleYol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(801));
  tl.fromTo(minik, { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, stagger: k(2), immediateRender: false }, k(794));
  // Satır ≥ 1,5 sn: k774'te 16 k'da yazılır, #13'e taşar, k866'da silinir (k880'de tamamen gitmiş, "Sığar mı?" başlar)
  const not1 = elYazisi(Yz, metin('Bir organizer lazım.', 'I need an organizer.'), { x: YERLESIM.notYeri.x, y: YERLESIM.notYeri.y, boyut: yer(60, 64), aci: -3 });
  not1.style.paddingRight = '0.2em';
  yazElYazisi(not1, 774, 16);
  ctx.silElYazisi(not1, 866);

  // =====================================================================================================
  // #13 (k816–911): kuş bakışı; organizer hattı biner (%60), ölçü okları 8'er k, "84 mm?" → "?" (18 k),
  // uzun vida kısa bölmeden taşar, sağ ön köşe uymaz (2–3 px, 3 döngü titrer), "Sığar mı?"
  // =====================================================================================================
  const itE = ekran(yer((kisaK[0] + kisaK[2]) / 2, 248), yer((kisaK[1] + kisaK[3]) / 2, 189)); // dikeyde sağ ön köşe kadrajda kalsın
  kamKoy(816, BIRIM);
  kameraGit(816, 96, odak(itE[0], itE[1], 1.03, itE[0], itE[1]), 'none');
  tl.set(okG, { autoAlpha: 1 }, k(816));
  tl.fromTo(orgG, { autoAlpha: 0, scale: 1.08, transformOrigin: '50% 50%' }, { autoAlpha: 0.6, scale: 1, duration: k(12), ease: E.EO, immediateRender: false }, k(818));
  for (const o of [ok1, ok2]) tl.set(o.yollar, { drawSVG: '0%' }, k(800));
  tl.fromTo(ok1.yollar[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: k(8), ease: E.EO, immediateRender: false }, k(834));
  tl.fromTo(ok1.yollar.slice(1), { drawSVG: '0%' }, { drawSVG: '100%', duration: k(4), ease: E.EO, immediateRender: false }, k(840));
  tl.fromTo(ok2.yollar[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: k(8), ease: E.EO, immediateRender: false }, k(844));
  tl.fromTo(ok2.yollar.slice(1), { drawSVG: '0%' }, { drawSVG: '100%', duration: k(4), ease: E.EO, immediateRender: false }, k(850));
  tl.set([...ok1.yollar, ...ok2.yollar], { clearProps: 'strokeDasharray,strokeDashoffset' }, k(856));
  tl.to(kisaV.g, { opacity: 1, duration: k(6), ease: 'none' }, k(846));         // uzun vida kısa bölmeden taşar
  // "84 mm?" etiketi (vurgu yazısı, rakam ≥ 48 px): k836'da belirir, 26 k temiz okunur; k862'de 18 k karışır → "?".
  // Karışım tohumlu ve belirlenebilir (ScrambleText Math.random kullanır, kare kare çekimde her seferinde farklı çıkar):
  // 2 k'da bir yeni dizi (30 fps), dizi 6 → 1 harfe kısalır, sondaki "?" hep yerinde kalır.
  const etE = ekran(168, 150);
  const etiket = document.createElement('p');
  etiket.textContent = '84 mm?';
  Object.assign(etiket.style, { position: 'absolute', margin: 0, left: etE[0] + 'px', top: etE[1] + 'px', font: `600 ${yer(84, 80)}px/1 Caveat, cursive`, color: VURGU_YAZI, whiteSpace: 'nowrap', textShadow: `0 0 6px ${ZEMIN}, 0 0 6px ${ZEMIN}` });
  Ku.div.appendChild(etiket);
  gsap.set(etiket, { xPercent: -50, yPercent: -100, rotation: -2, transformOrigin: '50% 100%', autoAlpha: 0 });
  tl.set(etiket, { autoAlpha: 0 }, 0);
  tl.fromTo(etiket, { autoAlpha: 0 }, { autoAlpha: 1, duration: k(4), ease: 'none', immediateRender: false }, k(836));
  const KARIS_ADIM = 9, KARIS0 = 862;
  const karisDizi = (() => {
    const r = rng(3391), C = '0123456789m';
    return Array.from({ length: KARIS_ADIM }, (_, s) => {
      const n = Math.max(1, Math.round(6 - 5 * s / (KARIS_ADIM - 1)));
      let t = '';
      for (let i = 0; i < n - 1; i++) t += C[Math.floor(r() * C.length)];
      return t + '?';
    });
  })();
  const karis = { p: 0 };
  const karisUygula = () => {
    const s = Math.floor(karis.p * KARIS_ADIM + 1e-6);
    etiket.textContent = karis.p <= 0 ? '84 mm?' : s >= KARIS_ADIM ? '?' : karisDizi[s];
  };
  tl.fromTo(karis, { p: 0 }, { p: 1, duration: k(2 * KARIS_ADIM), ease: 'none', onUpdate: karisUygula, immediateRender: false }, k(KARIS0));
  tl.to(etiket, { scale: 1.5, duration: k(10), ease: E.BO }, k(KARIS0 + 2 * KARIS_ADIM)); // tek "?" kalınca büyür
  // Uymayan köşe: önce vurgu, sonra 3 döngü titreme (2 k adımlı, ±1,2 u ≈ 2,6 px)
  tl.to(kotuV.g, { opacity: 1, duration: k(4), ease: 'none' }, k(870));
  const titre = { p: 0 }, TITRE = [1.2, -1.2, 1.2, -1.2, 1.2, -1.2, 0];
  const titreUygula = () => kotuG.setAttribute('transform', `translate(${TITRE[Math.min(6, Math.floor(titre.p * 7))]} 0)`);
  tl.fromTo(titre, { p: 0 }, { p: 1, duration: k(14), ease: 'none', onUpdate: titreUygula, immediateRender: false }, k(874));
  tl.call(() => kotuG.removeAttribute('transform'), null, k(873));
  // "Sığar mı?": "Bir organizer lazım." silinince yazılır (k880, 12 k), #14'e taşar (B'nin solunda boş kâğıt; #13'te
  // çekmecenin solu/altı), k960'ta "?" balonuyla birlikte yükselip söner. Ekranda k880–972 (≥ 1,5 sn)
  const not2 = elYazisi(Yz, metin('Sığar mı?', 'Will it fit?'), yer({ x: 70, y: 540, boyut: 76, aci: -4 }, { x: 46, y: 1330, boyut: 72, aci: -4 }));
  not2.style.paddingRight = '0.2em'; // Caveat "?" kutudan taşıyor, yazma maskesi kesmesin
  yazElYazisi(not2, 880, 12);

  // =====================================================================================================
  // #14 (k912–959): orta plan; B iç çeker (kaş 6 k, omuz 4 k, doğrulma 20 k), gözlük 2–4 k geriden burna kayar,
  // geç kalan vida köşeden yuvarlanıp düşer (24 k power2.in), B bir kez göz kırpar (6 k); "?" balonda kalır
  // =====================================================================================================
  const k14 = odak(kam14.c[0], kam14.c[1], kam14.s);
  kamKoy(912, k14);
  kamYol(912, 60, odak(kam14.c[0], kam14.c[1], kam14.s * 1.019), 'none'); // #15'in ilk 12 k'sı dahil, ölü kare yok
  ayarla(912, { dy: 0, sx: 1, sy: 1, rot: 0, gy: 0, L: 1, kol: 0, gec: 1, gx: 248, gyV: 520, gr: 0 });
  poz(912, { ifade: 'notr', bakis: [0, 1] });
  poz(adim(917), { ifade: 'sikkin', bakis: [0, 1] });                         // kaş (6 k)
  git(916, 4, { dy: -9, sy: 1.012, sx: 0.988 }, adimli('power1.out', 4, 2));  // omuz kalkar (nefes)
  git(920, 20, { dy: 2, sy: 1, sx: 1 }, adimli(E.EO, 20, 5));                 // doğrulma / bırakış
  git(923, 20, { gy: 15 }, adimli(E.EO, 20, 5));                              // gözlük 3 k geriden burna kayar
  git(922, 8, { gx: 222, gyV: 526, gr: -40 }, adimli('power1.in', 8, 2));     // vida köşede yuvarlanır, kenardan devrilir
  git(930, 24, { gyV: kam14.dus, gx: 206, gr: -260 }, 'power2.in');           // düşer (çekmece kolunun solundan), 24 k'nın sonunda kadrajdan çıkar
  poz(940, { ifade: 'sikkin', bakis: [0, 1] });
  tl.set(kapakG, { autoAlpha: 0 }, 0);
  tl.set(kapakG, { autoAlpha: 1 }, k(950));                                   // tek, kuru göz kırpma (12 fps: 5 k)
  tl.set(kapakG, { autoAlpha: 0 }, k(adim(956)));
  poz(adim(956), { ifade: 'sikkin', bakis: [0, 0] });
  tl.set(doodleG, { opacity: 0.22 }, k(912));
  // "?" (vurgu) balonda belirir ve kalır
  const sor = yer({ c: [1360, 360], s: 210 }, { c: [540, 640], s: 240 });
  const sorG = el(bal.ic, 'g');
  const sorYol = cizgi(sorG, [[-0.3, -0.34], [-0.25, -0.6], [0, -0.72], [0.27, -0.62], [0.33, -0.38], [0.15, -0.16], [0.02, 0.02], [0, 0.2]].map(([x, y]) => [sor.c[0] + x * sor.s, sor.c[1] + y * sor.s]), { kalinlik: 15, renk: VURGU, genlik: 1.2, tohum: 721 });
  const sorNokta = cizgi(sorG, oval(sor.c[0], sor.c[1] + 0.42 * sor.s, 10, 10, 0, 360, 8), { kapali: true, dolgu: VURGU, renk: VURGU, kalinlik: 5, genlik: 0.8, tohum: 722, kay: [0, 0] });
  tl.set(sorG, { autoAlpha: 0 }, 0);
  tl.set(sorG, { autoAlpha: 1 }, k(912));
  tl.fromTo(sorYol.yol, { drawSVG: '0%' }, { drawSVG: '100%', duration: k(10), ease: E.EO, immediateRender: false }, k(912));
  tl.set(sorYol.yol, { clearProps: 'strokeDasharray,strokeDashoffset' }, k(923));
  tl.fromTo(sorNokta.g, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(918));
  tl.set(sorNokta.g, { scale: 0, transformOrigin: '50% 50%' }, k(912));

  // =====================================================================================================
  // #15'in başı (k960–971): B balona bakar; noktalar söner (6 k, 1 k arayla, başa yakın olan önce), "?" balonu
  // 12 k Eİ ile yükselip kaybolur, "Sığar mı?" onunla söner. k972'de v4 M18 kesmesiyle devralır
  // =====================================================================================================
  poz(960, { ifade: 'sikkin', bakis: yer([1, -1], [0, -1]) });
  tl.to(bal.noktalar, { autoAlpha: 0, scale: 0.4, duration: k(6), ease: E.EI, stagger: k(1) }, k(960));
  tl.to(bal.bulut, { y: -yer(460, 560), autoAlpha: 0, duration: k(12), ease: E.EI }, k(960));
  tl.to(not2, { autoAlpha: 0, y: -18, duration: k(12), ease: E.EI }, k(960));

  // ---------- Çıkış: kamera bir sonraki vinyete x0 y0 ölçek 1 bırakılır (katmanlar k972'de gizli)
  kameraKoy(972, BIRIM);
}
