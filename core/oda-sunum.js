// Biggie'li rehberli sunum (senaryo: biggie-sunum.md, 2026-11-03). Odanın açılışını, Biggie'nin duraklara gidişini, elma
// balonunu ve "Çalışmaya dön"ü yönetir; kamerayı kaydırmalı tur (core/oda-tur.js) ile paylaşır, karakterin kendisi
// core/oda-karakter.js'te (durakaGit, calismayaDon, olaylar).
//  1. Açılış: Biggie üst kattan iner, eşikte dans eder; dansın üstünde altta "Arda Bişgin" ve unvan yavaşça belirir, birlikte
//     kaybolur; ardından "Burası da atölyesi..." cümlesi. Biggie odanın ortasında bekler, kamera genel plana gelir, tur
//     başlar. Telefonda (dikey) kamera açılış boyunca Biggie'yi yakın plandan izler. ?giris=yukleme: yazılar oda
//     yüklenirken başlar (varsayılan ?giris=dans: dansın üstünde). Yazılar yalnız opacity/transform (WAAPI: bileştirici
//     iş parçacığında, oda yüklenirken de akar). Hareket azaltmada yazılar kısa fade, dans ve kamera hareketi yok.
//     Ziyaretçi dokunur, kaydırır ya da tuşa basarsa açılış hemen biter.
//  2. Tıklanan durağa Biggie yürür, duraktaki klibi oynatır; kamera durağın yakın planına gelir (ürün yuvasında tur,
//     yuvasız durakta bu modül). Yoldayken başka yere tıklanırsa yeni hedefe döner.
//  3. Elma: karakterde (2 elma, ısırık, çöpe atış); burada yalnız "kobe" balonu.
//  4. Bütün duraklar gezilince ya da 90 sn hareketsizlikte "Çalışmaya dön": Biggie sandalyesine oturur, sonraki
//     tıklamalarda duraklar Biggie'siz sunulur.
// Durak listesi core/oda-yerler.js BIGGIE_DURAK'tan ({ id, yer: [x, y], yon: derece, klip, sure }; isteğe bağlı yuva:
// ürün yuvası kimliği, nokta: [x, y, z] bakılan şey, kamera: { pos, target }); eksik duraklar aşağıdaki geçici
// noktalardan. Yuvasız durağa tıklanınca pencereye 'oda-sunum-durak' olayı yayılır (detail: { id }): kart açmak için.
import * as THREE from 'three';
import { gsap } from 'gsap';
import * as YERLER from './oda-yerler.js';
import * as PORTF from './oda-portfolyo.js'; // ENGEL (yol bulma), çöp kovası (sahne api.nesne('cop').userData.agiz)
import { odaMonitoru } from './oda-monitor.js'; // v5: Biggie masaya oturunca monitörde tasarım döngüsü
import { kutuPaneli } from './oda-kutu-panel.js'; // v7: kutu oyunu paneli (dört yüz = dört sayfa), oklar, ipucu
import { armutEzici } from './oda-armut.js'; // v7: armut Biggie yatınca içine göçer

const AYAR = {
  isimGir: 1.4,          // sn: "Arda Bişgin" belirir (yavaş)
  unvanGecik: 0.45,      // sn: unvan satırı adın bu kadar ardından
  isimKal: 1.6,          // sn: iki satır tam göründükten sonra en az (dans daha uzunsa dans bitene dek)
  cik: 0.8,              // sn: birlikte kaybolma
  cumleGir: 1.0, cumleKal: 3.6,
  azGir: 0.25,           // hareket azaltmada fade
  dansBekle: 45,         // sn: dans başlamazsa (karakter geç ya da hiç) yazılar yine de başlar
  kameraDon: 1.8,        // sn: telefonda takipten genel plana
  durakUcus: 1.5,        // sn: yuvasız durağa kamera
  hareketsiz: 90,        // sn: bu kadar dokunulmazsa "Çalışmaya dön"
  balon: 1.5,            // sn: "kobe" balonu
  takipYay: 2.4,         // 1/sn: telefonda takip kamerasının yumuşaklığı
};
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'; // animate skill: güçlü ease-out (giriş/çıkış)

// Geçici duraklar (BIGGIE_DURAK gelene dek; yer: Biggie'nin durduğu nokta, mm; yon: ψ derece, 0 kameraya, 90 sağa,
// 180 masaya, −90 sola). Ürün yuvası olanlar yuva kimliğiyle aynı adda
export const GECICI_DURAK = [
  { id: 'anahtarlik', yer: [-1680, 900], yon: 180, klip: 'egil_bak', sure: 2.4 },
  { id: 'figur', yer: [-1420, 880], yon: 180, klip: 'egil_bak', sure: 2.4 },
  { id: 'raf', yer: [-430, 900], yon: 195, klip: 'egil_bak', sure: 2.4 },
  { id: 'biblo', yer: [100, 1250], yon: 180, klip: 'egil_bak', sure: 2.4 },
  { id: 'maske', yer: [1150, 650], yon: 90, klip: null, sure: 2.0 },
  { id: 'kitaplik', yer: [-1450, 520], yon: -90, klip: 'yaslan', sure: 3.0 },
  { id: 'hakkimda', yer: [-1550, -360], yon: -90, klip: null, sure: 2.0 },
  { id: 'oyunlar', yer: [1380, -520], yon: 90, klip: 'kutu_al', sure: 3.0 },
  { id: 'ekran', yer: [1250, -150], yon: 90, klip: 'kumanda', sure: 3.0 },
  { id: 'buzdolabi', yer: [1260, 850], yon: 90, klip: 'buzdolabi_ac', sure: 2.4 },
  { id: 'cop', yer: [1450, 330], yon: 70, klip: null, sure: 1.6 },
  { id: 'masa', yer: [-930, 760], yon: 180, klip: null, sure: 1.0 },
];
// Tur sonu sayılmayanlar (çöp elmanın yeri, masa "Çalışmaya dön"ün kendisi)
const TUR_DISI = new Set(['cop', 'masa']);

export function biggieDuraklari() {
  const asil = Array.isArray(YERLER.BIGGIE_DURAK) ? YERLER.BIGGIE_DURAK : [];
  const kimlik = new Set(asil.map((d) => d.id));
  const gecici = GECICI_DURAK.filter((d) => !kimlik.has(d.id));
  return { liste: [...asil, ...gecici], gecici: gecici.map((d) => d.id) };
}

// root: .story.oda; t: i18n; giris: 'dans' | 'yukleme'; reduce
export function odaSunumu(root, { t, giris = 'dans', reduce = false, lang = 'tr' } = {}) {
  const { liste: DURAK, gecici } = biggieDuraklari();
  const t0 = performance.now(), simdi = () => Math.round(performance.now() - t0);
  const zaman = {}, kayit = [];
  const isaret = (ad) => { zaman[ad] ??= simdi(); };
  const logla = (ad, v) => { kayit.push({ t: simdi(), ad, ...(v || {}) }); };
  let story = null, tur = null, karakter = null, hazirCb = null, hazirOldu = false;
  let karDurum = 'bekliyor'; // bekliyor | var | yok (dosya yok, ?karakter=0)
  let acilis = 'bekliyor'; // bekliyor | yazi | bitti
  let aktif = true;        // Biggie sunuyor ("Çalışmaya dön"e dek)
  const ziyaret = new Set();
  const portre = () => innerWidth / innerHeight < 0.9;

  // ---- katmanlar (oda/index.html) ----
  const kat = root.querySelector('.oda-acilis'), isim = kat?.querySelector('.oa-isim'), unvan = kat?.querySelector('.oa-unvan'), cumle = kat?.querySelector('.oa-cumle');
  const calisBtn = root.querySelector('.oda-calisma'), balon = root.querySelector('.oda-balon');
  if (isim) { isim.textContent = t('oda.sunum.ad'); unvan.textContent = t('oda.sunum.unvan'); cumle.textContent = t('oda.sunum.cumle'); }
  if (calisBtn) calisBtn.textContent = t('oda.sunum.calisma');
  if (balon) balon.textContent = t('oda.sunum.kobe');
  root.classList.add('sunum-acilis');

  // Yazı hareketleri: WAAPI (bileştirici iş parçacığında; ana iş parçacığı oda kurarken de akar), yalnız opacity/transform
  const anim = (el, gir, sure, gecik = 0) => {
    if (!el) return Promise.resolve();
    const kf = reduce ? [{ opacity: gir ? 0 : 1 }, { opacity: gir ? 1 : 0 }]
      : gir ? [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }]
        : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }];
    const a = el.animate(kf, { duration: (reduce ? AYAR.azGir : sure) * 1000, delay: gecik * 1000, easing: EASE_OUT, fill: 'both' });
    return a.finished.catch(() => {});
  };
  const sure = (s) => new Promise((r) => setTimeout(r, s * 1000));

  // ---- açılış ----
  let isimBasladi = false, isimTamOldu = null, dansBitti = false, dansBittiCb = null, kesildi = false;
  async function isimGoster() {
    if (isimBasladi || kesildi) return;
    isimBasladi = true;
    acilis = 'yazi';
    kat?.removeAttribute('hidden');
    isaret('isimBasla');
    logla('isim-basla');
    await Promise.all([anim(isim, true, AYAR.isimGir), anim(unvan, true, AYAR.isimGir, reduce ? 0 : AYAR.unvanGecik)]);
    if (kesildi) return;
    isaret('isimTam');
    isimTamOldu = performance.now();
    // dans modunda dans bitene dek kalır (en az isimKal); yükleme modunda isimKal
    await sure(AYAR.isimKal);
    if (giris === 'dans' && !dansBitti && zaman.dansBasla !== undefined) await new Promise((r) => { dansBittiCb = r; setTimeout(r, 8000); });
    if (kesildi) return;
    isaret('isimCik');
    await Promise.all([anim(isim, false, AYAR.cik), anim(unvan, false, AYAR.cik)]);
    isaret('isimBitti');
    logla('isim-bitti');
    if (kesildi) return;
    isaret('cumleBasla');
    logla('cumle-basla');
    kameraGenel();
    await anim(cumle, true, AYAR.cumleGir);
    await sure(AYAR.cumleKal);
    if (kesildi) return;
    isaret('cumleCik');
    await anim(cumle, false, AYAR.cik);
    isaret('cumleBitti');
    logla('cumle-bitti');
    acilisBitir();
  }
  if (giris === 'yukleme') isimGoster();
  // Dans modu yedeği: karakter yoksa ya da dans uzun süre başlamazsa yazılar oda hazır olunca / süre dolunca başlar
  let yedek = null;

  // Telefonda takip kamerası: Biggie'nin kalçasına odanın içinden bakar (balkonda kapı boşluğundan)
  let takip = false;
  const kv = new THREE.Vector3(), tPos = new THREE.Vector3(), tHed = new THREE.Vector3();
  function takipKaresi(_, dms) {
    if (!takip || !story?.driven || !karakter) return;
    const p = karakter.kalcaNoktasi(kv), dt = Math.min(0.1, (dms || 16) / 1000);
    const hed = [p.x, p.y, Math.max(p.z, 650) + 220];
    const pos = [p.x * 0.6 - 120, Math.min(Math.max(p.y - 2300, -900), 300), 1380];
    const v = story.view(), k = 1 - Math.exp(-AYAR.takipYay * dt);
    tPos.fromArray(v.pos).lerp(kv.fromArray(pos), k);
    const ph = tPos.toArray();
    tHed.fromArray(v.target).lerp(kv.fromArray(hed), k);
    story.setView(ph, tHed.toArray());
  }
  gsap.ticker.add(takipKaresi);
  function takipBasla() {
    if (takip || !portre() || reduce || !karakter || !story || acilis === 'bitti' || zaman.cumleBasla) return;
    story.drive(true);
    takip = true;
    isaret('takip');
  }
  let genelTw = null;
  function kameraGenel() {
    if (!takip) return;
    takip = false;
    if (!story?.driven) return;
    const bas = story.view(), son = story.shotOf(null), o = { u: 0 };
    genelTw = gsap.to(o, {
      u: 1, duration: reduce ? 0.01 : AYAR.kameraDon, ease: 'power2.inOut',
      onUpdate: () => { const f = (a, b) => a.map((x, i) => x + (b[i] - x) * o.u); story.setView(f(bas.pos, son.pos), f(bas.target, son.target)); },
      onComplete: () => { genelTw = null; isaret('kameraGenel'); },
    });
  }
  function acilisBitir() {
    if (acilis === 'bitti') return;
    acilis = 'bitti';
    isaret('acilisBitti');
    logla('acilis-bitti');
    root.classList.remove('sunum-acilis');
    clearTimeout(yedek);
    kameraGenel();
    const bitir = () => { if (hazirOldu && hazirCb) { const cb = hazirCb; hazirCb = null; cb(); } hareketsizSayac(); };
    if (genelTw) genelTw.eventCallback('onComplete', () => { genelTw = null; isaret('kameraGenel'); bitir(); }); else bitir();
  }
  // Ziyaretçi araya girerse açılış hemen biter: yazılar hızla söner, tur başlar
  function kes() {
    if (acilis === 'bitti') return;
    kesildi = true;
    logla('acilis-kesildi');
    for (const el of [isim, unvan, cumle]) if (el) { el.getAnimations().forEach((a) => a.cancel()); }
    takip = false;
    genelTw?.kill(); genelTw = null;
    acilis = 'bitti';
    isaret('acilisBitti');
    root.classList.remove('sunum-acilis');
    clearTimeout(yedek);
    if (hazirOldu && hazirCb) { const cb = hazirCb; hazirCb = null; cb(); }
    hareketsizSayac();
  }
  root.addEventListener('pointerdown', kes, true);
  addEventListener('scroll', () => root.classList.remove('sunum-durakta'), { passive: true });
  addEventListener('wheel', kes, { passive: true });
  addEventListener('keydown', kes);

  // ---- karakter olayları ----
  let balonSon = 0;
  function olay(ad, v) {
    logla(ad, v);
    if (ad === 'dans-basla') { isaret('dansBasla'); if (giris === 'dans') isimGoster(); }
    else if (ad === 'dans-bitti') { isaret('dansBitti'); dansBitti = true; dansBittiCb?.(); }
    else if (ad === 'kobe') balonGoster();
    else if (ad === 'oturdu') { const t = monitor?.basla(); if (t) logla('monitor-basla', { tasarim: t }); }
    else if (ad === 'kalkti') { if (monitor?.oynuyor) logla('monitor-dur'); monitor?.dur(); }
    else if (ad === 'eylem-bitti' && v?.id === sonIstek) sonBitti = true;
    else if (ad === 'tutuyor') kutuTutuyor();
  }

  // ---- v5 (2026-11-03): eşyayı ele alma, rafın kutuları, kitaplığın eserleri, TV'de armut ----
  let monitor = null;
  const V = () => new THREE.Vector3();
  // Eşya el kemiğine bağlanır (dünya duruşu korunur), sonra avucun önüne kayar (kemik birimi metre). El kemiği yoksa
  // eşya yerinde kalır, bırakılırken doğrudan hedefe kayar
  // kemik: el kemiğinin adı (yoksa el.R); tut: eşyanın merkezi kemiğin yerelinde (metre; meta mm / 1000)
  // q: eşyanın kemiğin yerelindeki dönüşü (v6 meta el_yerel_q, Blender sırası [w, x, y, z]); verilirse ona da döner
  function eleAl(obj, tut = [0, 0.09, 0.05], kemik = null, q = null) {
    const el = (kemik && karakter?.kemik?.(kemik)) || karakter?.elKemigi;
    if (!el || !obj) return false;
    gsap.killTweensOf(obj.position); gsap.killTweensOf(obj.quaternion);
    el.attach(obj);
    gsap.to(obj.position, { x: tut[0], y: tut[1], z: tut[2], duration: reduce ? 0.01 : 0.3, ease: 'power2.out' });
    if (Array.isArray(q) && q.length === 4) {
      const q0 = obj.quaternion.clone(), q1 = new THREE.Quaternion(q[1], q[2], q[3], q[0]).normalize(), o = { u: 0 };
      gsap.to(o, { u: 1, duration: reduce ? 0.01 : 0.3, ease: 'power2.out', onUpdate: () => obj.quaternion.slerpQuaternions(q0, q1, o.u) });
    }
    return true;
  }
  function birak(obj, ust, p, q, sn = 0.4) {
    if (!obj || !ust) return;
    gsap.killTweensOf(obj.position);
    ust.attach(obj);
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), o = { u: 0 };
    gsap.to(o, { u: 1, duration: reduce ? 0.01 : sn, ease: 'power2.inOut', onUpdate: () => { obj.position.lerpVectors(p0, p, o.u); obj.quaternion.slerpQuaternions(q0, q, o.u); } });
  }
  // ---- v7 (2026-11-04): kutu oyunları. Rafa tıklanınca kamera rafa, Biggie rafın yanında bekler; kutuya tıklanınca
  // Biggie gelir, diz çöker, kutuyu gözünden alıp rafın ÜSTÜNE koyar, dizlerinin üstünde bekler (diz_bekle). Panel kutunun
  // dört yüzünü dört sayfa olarak gösterir; sağ ok Biggie'ye kutuyu 90° çevirtir (kutu_cevir_sag) ve panel sonraki sayfaya
  // geçer, sol ok tersi. "Geri": kutuyu rafa geri bırakır (kutu_rafa_birak), kalkar (diz_kalk). Panel açıkken başka kutuya
  // tıklanırsa önce açık olan geri konur, sonra yenisi alınır. Klipler gelmeden: diz pozunda kalır, kutuyu site çevirir ve
  // rafa geri kaydırır (oda-karakter YER_TUTUCU '').
  // Kamera: kutu rafın üstünde, Biggie'yi sağ omzunun arkasından gösteren açı (Biggie +x'e bakar: arkası −x, sağı −y);
  // core/oda-kadraj.js bul (göz yüksekliği, oda içi, diz çökmüş gövde silindiri kutuyu örtmez)
  const KS = { aktif: null };
  let kutuP = null;
  const Rz = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
  const V7 = () => durakBul('oyunlar')?.kutuV7 ?? { bekle: 'diz_bekle', cevir: 'kutu_cevir_sag', cevirSol: 'kutu_cevir_sol', birak: 'kutu_rafa_birak', kalk: 'diz_kalk' };
  // Kutunun gözünün ortası (dünya y): rafın üç gözü (core/oda-portfolyo.js oyunRafi: çerçeve 38, ara 16, göz 339)
  function gozY(m) {
    const y = new THREE.Box3().setFromObject(m).getCenter(V()).y, R = PORTF.PORT?.oyunRafi ?? { y: -250, en: 1125 };
    let en = y, enD = Infinity;
    for (let i = 0; i < 3; i++) { const xc = -R.en / 2 + 38 + i * (339 + 16) + 339 / 2, gy = -xc + R.y; if (Math.abs(gy - y) < enD) { enD = Math.abs(gy - y); en = gy; } }
    return en;
  }
  // Eşyayı noktalar boyunca kaydırır (raf gözü ile üstü arasında: tahtanın içinden geçmesin), sonunda q'ya döner
  function yolla(obj, ust, noktalar, q, sn, bitti = null) {
    if (!obj || !ust) return;
    gsap.killTweensOf(obj.position); gsap.killTweensOf(obj.quaternion);
    if (obj.parent !== ust) ust.attach(obj);
    const yol = [obj.position.clone(), ...noktalar.map((p) => p.clone())], q0 = obj.quaternion.clone();
    const uz = []; let top = 0;
    for (let i = 1; i < yol.length; i++) { top += yol[i].distanceTo(yol[i - 1]); uz.push(top); }
    const o = { u: 0 };
    gsap.to(o, { u: 1, duration: reduce ? 0.01 : sn, ease: 'power2.inOut', onUpdate: () => {
      const s = o.u * top;
      let i = 0; while (i < uz.length - 1 && uz[i] < s) i++;
      const a = i ? uz[i - 1] : 0, k = (s - a) / Math.max(1e-6, uz[i] - a);
      obj.position.lerpVectors(yol[i], yol[i + 1], Math.min(1, Math.max(0, k)));
      obj.quaternion.slerpQuaternions(q0, q, o.u);
    }, onComplete: () => bitti?.() });
  }
  // Rafın önü (dünya x) ve kutunun gözle üst arasındaki yolu
  const rafOnX = () => { const D0 = durakBul('oyunlar'), b = D0 && kutuOf(D0); return b ? b.min.x : 1695; };
  function rafaKoy(K, sn = 0.9) {
    const p = K.P.yuva.p, onX = rafOnX() - 60 - K.P.kalin, cur = K.m.getWorldPosition(V());
    const yol = cur.z > (PORTF.OYUN_RAFI_UST ?? 420) - 20 ? [V().set(onX - 120, cur.y, cur.z + 30), V().set(onX - 120, p.y, p.z + 10), V().set(p.x - 140, p.y, p.z), p] : [V().set(Math.min(cur.x, onX - 120), p.y, p.z + 10), p];
    yolla(K.m, K.ust, yol, K.P.yuva.q, sn, () => { K.ustte = false; });
  }
  function rafUstuneKoy(K, sn = 1.0) {
    const onX = rafOnX() - 60 - K.P.kalin, p = K.P.yuva.p, h = K.hedefP;
    yolla(K.m, K.ust, [V().set(p.x - 140, p.y, p.z), V().set(onX - 120, p.y, p.z + 10), V().set(onX - 120, h.y, h.z + 40), h], K.hedefQ, sn, () => { K.ustte = true; });
  }
  // Panelin kart modu: yan kart (masaüstü) ya da alttaki yaprak (telefon); kadraj buna göre ötelenir
  function kartModu() {
    if (!story) return null;
    const yan = root.dataset.panel === 'side' && story.camera.aspect >= 0.9;
    if (kutuP?.acik) return yan ? 'side' : 'bottom';
    return yan && story.focusedId ? 'side' : null;
  }
  function kaydirma(mod) {
    if (!mod || !story) return null;
    const cam = story.camera, Z = new THREE.Vector3(0, 0, 1);
    return (pos, t) => {
      const d = pos.clone().sub(t), L = d.length(); d.divideScalar(L);
      const halfH = L * Math.tan((cam.fov * Math.PI) / 360);
      if (mod === 'side') { const sag = V().crossVectors(d.clone().negate(), Z).normalize(), s = -0.16 * 2 * halfH * cam.aspect; return { pos: pos.clone().addScaledVector(sag, s), target: t.clone().addScaledVector(sag, s) }; }
      // Alttaki yaprak: kutu ekranın üst yarısında; kamera yerinde (göz yüksekliği), yalnız bakış aşağı döner
      const up = Z.clone().addScaledVector(d, -d.z).normalize(), s = -0.42 * halfH;
      return { pos: pos.clone(), target: t.clone().addScaledVector(up, s) };
    };
  }
  // Kutu sahnesinin kadrajı (kutu rafın üstünde; Biggie diz çökmüş, sağ omzunun arkasından)
  function kutuKadraji(K, { gercek = false } = {}) {
    const P = K.P, s = Math.max(...(P.olcu ?? [300, 300, 80])), hb = new THREE.Box3().setFromCenterAndSize(K.hedefP, V().set(s, s, P.kalin));
    const [bx, by] = K.yer;
    // Diz çökmüş Biggie: baş kulaklıkla ~1,15 m'ye, omuzlar ~0,3 m yana (gerçek kemikler beklemeye geçince: kutuTutuyor)
    // kutu_cevir_*'de Biggie kutunun üstüne eğilir (baş ve omuzlar kökün ~300 mm önü, z ~0,9 m): o hacim de ışın engeli
    // (gerçek kemikler bekleme pozunda; eğilme sonra geldiği için her zaman eklenir)
    const egil = { x: bx + 250, y: by, z0: 500, z1: 1050, r: 200 };
    const sanal = gercek ? [egil] : [{ x: bx, y: by, z0: 0, z1: 1150, r: 320 }, egil];
    const tumKutu = new Set([...(story?.api?.portfolyo?.parcalar?.()?.oyun ?? [K.m]), story?.api?.model?.('oyunlar')].filter(Boolean));
    const kd = kaydirma(kartModu());
    // Kamera Biggie'nin gerisinde (+x'e bakıyor: en az 150 mm geride), sağında (tercih −y); gövde silindiri ışın engeli
    // Biggie görünsün: sağ omzu (diz çökmüşken ~0,8 m, gövdenin 0,19 m sağında) kadrajın içinde (yan kartta kartın yarısına dek)
    const mod = kartModu(), omuz = { noktalar: [[bx + 40, by - 190, 820]], ...(mod === 'side' ? { x0: -0.75, x1: 0.92, y0: -0.85, y1: 0.85 } : mod === 'bottom' ? { x0: -0.92, x1: 0.92, y0: -0.05, y1: 0.9 } : {}) };
    // v7 (Blender klipleri): kutu_cevir_*'de Biggie kutunun üstüne eğildiği için tam omzunun arkasından bakan kamera kutuyu
    // kaybediyordu. Sıra: sağ yanından, kutunun hizasından (sağ omzu ön planda, kutu ötesinde, eğilince de açık) → sağ
    // omzunun arkası → gövde silindiri dar → Biggie görünmeden
    const o = { haric: tumKutu, govde: gercek, sanal, kaydir: kd, gorunsun: omuz };
    const arka = { x: bx, y: by, f: [1, 0], pay: 150 };
    const k = kadrajAra([hb], { ...o, tercih: [0.15, -1, 0], doluluk: 0.34 }) ?? kadrajAra([hb], { ...o, tercih: [0.15, -1, 0], doluluk: 0.26 })
      ?? kadrajAra([hb], { ...o, tercih: [-1, -0.7, 0], arkasi: arka, doluluk: 0.3 })
      ?? (gercek ? null : kadrajAra([hb], { ...o, tercih: [0.15, -1, 0], sanal: [{ x: bx, y: by, z0: 0, z1: 1050, r: 250 }, egil], doluluk: 0.3 }))
      ?? kadrajAra([hb], { ...o, tercih: [0.15, -1, 0], gorunsun: null, doluluk: 0.3 });
    return k ? kartKaydir(k, kartModu()) : null;
  }
  // Kutunun kaydı (rafın üstündeki yeri klibin ust_merkez'inden: kökün 594,7 mm önü, eller orada)
  function kutuKaydi(m) {
    const D0 = durakBul('oyunlar'), P = m.userData.parca, [, koy] = D0.kutuDizi ?? ['diz_cok', 'kutu_al_diz'];
    const km = karakter?.meta?.(koy)?.kutu ?? {}, gy = gozY(m);
    const K = { m, P, ust: m.parent, sayfa: 0, don: 0, ustte: false, elde: false, bekleyen: 0, durum: 'aliniyor', km };
    P.olcu ??= (() => { const b = new THREE.Box3().setFromObject(m).getSize(V()); return [b.x, b.y, b.z]; })();
    K.yer = [rafOnX() - (km.raf_on_mm ?? 451), gy];
    const ileri = Array.isArray(km.ust_merkez) ? -km.ust_merkez[1] : 594.7;
    K.hedefP = new THREE.Vector3(K.yer[0] + ileri, gy, (PORTF.OYUN_RAFI_UST ?? 420) + P.kalin / 2 + 1);
    K.q0 = P.ustQ.clone();
    K.hedefQ = K.q0.clone();
    return K;
  }
  // kutu_al_diz'in anları: al (42) kutu el.R'ye (el_yerel/el_yerel_q), birak (100) rafın üstüne
  function alAnlari(K) {
    const km = K.km, ey = Array.isArray(km.el_yerel) ? km.el_yerel.map((v) => v / 1000) : [0, 0.1, 0.05];
    return [
      [{ meta: 'al', kesir: 0.3 }, () => { K.elde = eleAl(K.m, ey, km.kemik ?? 'el.R', km.el_yerel_q); logla('kutu-al', { no: K.P.no + 1 }); }],
      [{ meta: 'birak', kesir: 0.75 }, () => {
        if (K.elde) birak(K.m, K.ust, K.hedefP, K.hedefQ, 0.35); else rafUstuneKoy(K, 0.8);
        K.elde = false; K.ustte = true; K.durum = 'ustte';
        logla('kutu-ustte', { no: K.P.no + 1 });
      }],
    ];
  }
  // kutu_rafa_birak'ın anları: al (52) üstten el.R'ye, birak (110) gözüne
  function birakAnlari(K) {
    const km = karakter?.meta?.(V7().birak)?.kutu ?? {}, ey = Array.isArray(km.el_yerel) ? km.el_yerel.map((v) => v / 1000) : null;
    return [
      [{ meta: 'al', kesir: 0.12 }, () => { K.cevir = null; if (ey) K.elde = eleAl(K.m, ey, km.kemik ?? 'el.R', km.el_yerel_q); }],
      [{ meta: 'birak', kesir: 0.2 }, () => { rafaKoy(K, K.elde ? 0.35 : 1.0); K.elde = false; }],
    ];
  }
  function kutuIptal(K) {
    if (K.durum === 'rafta') return;
    if (K.elde || K.ustte || K.m.parent !== K.ust) rafaKoy(K, 0.5);
    K.elde = false; K.durum = 'rafta'; K.cevir = null;
    if (KS.aktif === K) { KS.aktif = null; kutuP?.kapat(); }
    logla('kutu-iptal', { no: K.P.no + 1 });
  }
  function kutuPaneliAc(K) {
    KS.aktif = K;
    kutuP?.ac(K.P.no, 0);
    kutuP?.ipucu(null);
    root.classList.add('sunum-durakta');
    const kk = kutuKadraji(K);
    if (kk) kameraUc(kk, AYAR.durakUcus);
    logla('kutu-sec', { no: K.P.no + 1, kadraj: kk ? kk.pos : null });
  }
  function kutuAl(m) {
    const D0 = durakBul('oyunlar'), raf = D0 && kutuOf(D0), P = m?.userData.parca;
    if (!D0 || !raf || !P) return;
    const v7 = V7(), [al, koy] = D0.kutuDizi ?? ['diz_cok', 'kutu_al_diz'];
    const K = kutuKaydi(m);
    kutuPaneliAc(K);
    if (!aktif || !karakter) { rafUstuneKoy(K, 1.0); K.durum = 'ustte'; return; } // Biggie'siz: kutu kendisi rafın üstüne
    const D = { ...D0, yer: K.yer, yon: 90, tut: { klip: v7.bekle }, kutular: [K], dizi: [
      { klip: al, sure: 0.9 },
      { klip: koy, sure: 2.2, anlar: alAnlari(K) },
    ] };
    D.iptal = () => { for (const X of D.kutular) kutuIptal(X); };
    K.D = D;
    biggieGitsin(D);
  }
  // Kutuya tıklama (sahnede ya da test). Açık kutu varsa: aynı gözdeyse Biggie dizlerinin üstünde kalır, zincir
  // kutu_rafa_birak → kutu_al_diz (Blender v7 zinciri, uçlar aynı poz); başka gözdeyse geri koyar, kalkar, yeni göze gider
  function kutuSec(m) {
    if (!m?.userData.parca) return;
    const K = KS.aktif;
    if (K?.m === m) { kutuP?.ac(K.P.no, K.sayfa); return; }
    if (K && aktif && karakter?.tutuyor && K.durum === 'ustte' && K.D && Math.abs(gozY(m) - K.yer[1]) < 60) {
      const K2 = kutuKaydi(m), v7 = V7(), [, koy] = durakBul('oyunlar').kutuDizi ?? ['diz_cok', 'kutu_al_diz'];
      K.durum = 'donuyor';
      K2.D = K.D; K.D.kutular.push(K2);
      logla('kutu-geri', { no: K.P.no + 1 });
      kutuPaneliAc(K2);
      karakter.komut([{ klip: v7.birak, sure: 1.4, anlar: [...birakAnlari(K), [{ meta: 'birak', kesir: 0.9 }, () => { K.durum = 'rafta'; logla('kutu-rafta', { no: K.P.no + 1 }); }]] },
        { klip: koy, sure: 2.2, anlar: alAnlari(K2) }]);
      return;
    }
    if (K) { kutuGeri({ sonra: () => kutuAl(m) }); return; }
    kutuAl(m);
  }
  // Sağ (+1) / sol (−1): sayfa ve kutunun yüzü. Sağ: Biggie'nin sağındaki yüz öne gelir (dünya z ekseninde −90°).
  // Biggie diz pozunda bekliyorsa kutuyu klip döndürür: kutu_cevir_sag/_sol meta'sı kutu.don [[kare, derece]] (dikey eksen,
  // + yukarıdan saat yönünün tersi) her karede kutuya uygulanır (kutuKaresi), eller kutu.elde aralıklarında kutudadır.
  // Klip yoksa ya da Biggie'siz sunumda kutuyu site çevirir
  function kutuCevir(yon) {
    const K = KS.aktif;
    if (!K) return;
    K.sayfa = (((K.sayfa + yon) % 4) + 4) % 4;
    K.don += yon;
    K.hedefQ = Rz((-K.don * Math.PI) / 2).multiply(K.q0);
    kutuP?.sayfaYap(K.sayfa);
    logla('kutu-sayfa', { sayfa: K.sayfa + 1, yon });
    hareketsizSayac();
    if (!K.ustte) return; // rafın üstüne konarken yeni yönüyle konur
    const dondur = (sn) => {
      const q0 = K.m.quaternion.clone(), q1 = K.hedefQ.clone(), o = { u: 0 };
      gsap.killTweensOf(K.m.quaternion);
      gsap.to(o, { u: 1, duration: reduce ? 0.01 : sn, ease: 'power2.inOut', onUpdate: () => K.m.quaternion.slerpQuaternions(q0, q1, o.u) });
    };
    const v7 = V7(), klip = yon > 0 ? v7.cevir : v7.cevirSol, don = karakter?.meta?.(klip)?.kutu?.don;
    if (aktif && karakter?.tutuyor && karakter.klipVar(klip) && Array.isArray(don)) {
      K.bekleyen++;
      karakter.komut([{ klip, sure: 1.33, anlar: [[{ kesir: 0 }, () => { gsap.killTweensOf(K.m.quaternion); K.cevir = { klip, don, bas: K.m.quaternion.clone() }; logla('kutu-cevir', { klip }); }]] }])
        .then(() => { K.cevir = null; K.bekleyen = Math.max(0, K.bekleyen - 1); if (!K.bekleyen && K.ustte) dondur(0.12); }); // son yön: kayma birikmesin
    } else dondur(0.4);
  }
  // Geri: kutu rafa geri, Biggie kalkar; sonra: ardından yapılacak (başka kutuyu almak)
  let geriBekleyen = null; // { K, sonra, t }: Biggie kutuyu koyup diz pozunda beklemeye geçince geri koyar
  function kutuGeri({ sonra = null } = {}) {
    const K = KS.aktif;
    if (!K) { sonra?.(); return; }
    KS.aktif = null;
    if (!sonra) { kutuP?.kapat(); kameraUc(story.shotOf('oyunlar'), 1.1); }
    logla('kutu-geri', { no: K.P.no + 1 });
    // Biggie kutuyu alıyor ya da rafın üstüne koyuyor (bekleme henüz başlamadı): beklemeye geçince geri koyar (en çok 8 sn)
    if (aktif && karakter && K.D && (K.elde || K.ustte) && K.durum !== 'rafta' && !karakter.tutuyor && sonIstek === 'oyunlar') {
      geriBekleyen = { K, sonra, t: performance.now() };
      return;
    }
    geriKoy(K, sonra);
  }
  function geriKoy(K, sonra) {
    const v7 = V7();
    if (aktif && karakter?.tutuyor && K.durum === 'ustte') {
      K.durum = 'donuyor';
      karakter.komut([
        { klip: v7.birak, sure: 1.4, anlar: birakAnlari(K) },
        { klip: v7.kalk, sure: 0.9 },
      ], { son: true }).then((ok) => { if (!ok && K.durum !== 'rafta') rafaKoy(K, 0.3); K.durum = 'rafta'; logla('kutu-rafta', { no: K.P.no + 1 }); sonra?.(); });
      return;
    }
    // Biggie yoksa (ya da beklemeden çıktıysa): kutu kendisi geri, Biggie (sunumdaysa) rafın yanına
    if (K.durum !== 'rafta') { if (K.elde || K.ustte || K.m.parent !== K.ust) rafaKoy(K, 0.6); K.durum = 'rafta'; }
    logla('kutu-rafta', { no: K.P.no + 1 });
    if (sonra) sonra();
    else if (aktif && karakter) biggieGitsin(durakBul('oyunlar'));
  }
  // Biggie diz pozunda beklemeye geçti: bekleyen geri komutu, ya da kadrajı gerçek gövdeyle yeniden kur
  function kutuTutuyor() {
    if (geriBekleyen) { const g = geriBekleyen; geriBekleyen = null; geriKoy(g.K, g.sonra); return; }
    const K = KS.aktif;
    if (!K || !story) return;
    const k = kutuKadraji(K, { gercek: true }), v = story.view();
    if (k && Math.hypot(...k.pos.map((x, i) => x - v.pos[i])) > 120) { kameraUc(k, 0.9); logla('kutu-kadraj-gercek', { pos: k.pos.map(Math.round) }); }
  }
  // Panel ve kutunun durumu her karede: oklar kutunun iki yanında; rafın kadrajından çıkılırsa panel kapanır
  const okKose = Array.from({ length: 8 }, V);
  function kutuKaresi() {
    if (!kutuP || !story) return;
    const K = KS.aktif;
    if (geriBekleyen && performance.now() - geriBekleyen.t > 8000) { const g = geriBekleyen; geriBekleyen = null; g.K.durum = 'ustte'; karakter && biggieGitsin(durakBul('oyunlar')); g.sonra?.(); }
    if (!K) { kutuP.oklar(null); return; }
    // Kutuyu klip döndürüyor: o karenin açısı (kutu.don) çevirmenin başındaki duruşa eklenir
    if (K.cevir) {
      const kz = karakter?.klipZamani?.();
      if (kz?.ad === K.cevir.klip) K.m.quaternion.copy(Rz((egriDeger(K.cevir.don, kz.kare) * Math.PI) / 180).multiply(K.cevir.bas));
    }
    if (story.focusedId !== 'oyunlar' && !durakTw && !aktif) { kutuGeri(); return; }
    const b = new THREE.Box3().setFromObject(K.m), cam = story.camera, rc = story.renderer.domElement.getBoundingClientRect(), hr = root.getBoundingClientRect();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = okKose[i].set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(cam);
      const sx = (p.x * 0.5 + 0.5) * rc.width + rc.left - hr.left, sy = (-p.y * 0.5 + 0.5) * rc.height + rc.top - hr.top;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const W = hr.width, pay = 14;
    kutuP.oklar({ x0: Math.max(56, x0 - pay), x1: Math.min(W - 56, x1 + pay), y: Math.min(Math.max(60, (y0 + y1) / 2), hr.height - 60) }, K.ustte || !aktif || !karakter);
  }
  // Kitaplıktan eser (büst, vaso) ya da kitap: eline alır, kamera elinden yakın plan, yerine koyar.
  // v6 (kullanıcı itirazı: kamera elin arkasından bakıyordu, yarı saydam gövde eşyayı örtüyordu): kadraj eldeki eşyanın
  // kutusundan (core/oda-kadraj.js bul: eşya kadrajın ~%55'i, kamera ile eşya arasında gövde kemiği, raf, duvar yok,
  // kamera mobilya hacminde değil); kamera eli izler (ofset sabit), x-ray kilitli (gövde seyrelmez)
  let yakinTw = null, yakinAktif = false, yakinOfs = [0, -650, 60], yakinHed = [0, 0, 0], yakinDonus = null;
  const KAM = () => story?.api?.kadraj ?? null;
  const ODA_IC_X0 = -2010, ODA_IC_X1 = 2010; // yan duvarların 90 mm içi (core/oda-kadraj.js ODA_IC)
  // Kadraj ara: kutular sırayla denenir (ilk bulunan); bulunamazsa null
  function kadrajAra(kutular, o = {}) {
    const K = KAM(), cam = story?.camera;
    if (!K || !cam) return null;
    // v7: kart ötelemesi (yan kart / alttaki yaprak) denetimde hesaba katılır; dönen kadraj ötelenmemiş (kartKaydir uygular)
    const kaydir = 'kaydir' in o ? o.kaydir : kaydirma(kartModu());
    for (const kutu of kutular) {
      const k = K.bul({ kutu, fov: cam.fov, aspect: cam.aspect, doluluk: 0.58, ...o, kaydir });
      if (k?.pos) { logla('kadraj', { pos: k.pos, dol: k.dol }); return k; }
    }
    logla('kadraj-yok', {});
    return null;
  }
  // Yan kart açıkken (masaüstü, story focusShift) kadraj kartın tersine kayar: eşya kartın yanındaki alanın ortasında;
  // kutu paneli telefonda alttayken kadraj aşağı kayar (kutu ekranın üst yarısında). v7: kadraj bu ötelemeyle denetlenir
  // (kadrajAra → bul kaydir), burada aynısı uygulanır
  function kartKaydir(k, mod = kartModu()) {
    const f = kaydirma(mod);
    if (!f) return k;
    const r = f(V().fromArray(k.pos), V().fromArray(k.target));
    return { ...k, pos: r.pos.toArray(), target: r.target.toArray() };
  }
  // Küçük eşyaya tıklanınca kamera eşyanın kadrajına (yuvasızDurak gibi, kartı açarak: story.focusTo uçuşsuz)
  function parcaKamera(kutular, o = {}) {
    if (!story) return null;
    // Sıra: gövde kadrajda değil → gövde yalnız eşyanın önünde değil → (son çare) gövdesiz
    const k = kadrajAra(kutular, o) ?? kadrajAra(kutular, { ...o, govdeKadraj: false }) ?? kadrajAra(kutular, { ...o, sanal: null, govde: false, govdeKadraj: false });
    if (!k) return null;
    kameraUc(kartKaydir(k), AYAR.durakUcus);
    return k;
  }
  function kameraUc(son, sure) {
    if (!story.driven) story.drive(true);
    const bas = story.view(), o = { u: 0 };
    durakTw?.kill();
    durakTw = gsap.to(o, {
      u: 1, duration: reduce ? 0.01 : sure, ease: 'power2.inOut',
      onUpdate: () => { const f = (a, b) => a.map((x, i) => x + (b[i] - x) * o.u); story.setView(f(bas.pos, son.pos), f(bas.target, son.target)); },
      onComplete: () => { durakTw = null; },
    });
  }
  function elYakin(ac, obj = null) {
    if (!story || !karakter) return;
    yakinTw?.kill();
    if (ac) {
      if (!story.driven) story.drive(true);
      durakTw?.kill(); durakTw = null;
      if (!yakinAktif) yakinDonus = story.view();
      yakinAktif = true;
      karakter.xrayKilit?.(true);
      const h = karakter.elNoktasi(V());
      const kutu = obj ? new THREE.Box3().setFromObject(obj) : new THREE.Box3().setFromCenterAndSize(h.clone(), V().set(150, 150, 220));
      // Tercih: Biggie'nin yanından (kameranın bulunduğu taraftan), eşyanın biraz üstünden
      const gor = V().fromArray(story.view().pos).sub(h).setZ(0).normalize();
      // Önce gövdenin kadraja girmediği açı (eşya kitaplığın önünde, Biggie onun önünde: çoğunlukla yandan, rafın yüzü boyunca)
      const hr = obj ? new Set([obj]) : null, yk = [0.12, 0.26, 0.4, 0.55, 0.72, 0.9];
      // Tercih sırası: kameranın bulunduğu yan, sonra rafın yüzü boyunca iki yan, sonra odanın içi
      let k = null;
      for (const t of [[gor.x, gor.y, 0.5], [0, 1, 0.5], [0, -1, 0.5], [1, 0, 0.5]]) if ((k = kadrajAra([kutu], { haric: hr, doluluk: 0.55, tercih: t, enAz: 280, govdeKadraj: true, yukseklik: yk }))) break;
      // Bulunamazsa gövde yalnız kadrajın kenarında (eşyanın bulunduğu orta bölge temiz), en son yalnız ışın engeli
      if (!k) for (const t of [[gor.x, gor.y, 0.5], [0, 1, 0.5], [0, -1, 0.5]]) if ((k = kadrajAra([kutu], { haric: hr, doluluk: 0.5, tercih: t, enAz: 280, govdeKadraj: 0.45, yukseklik: yk }))) break;
      k ??= kadrajAra([kutu], { haric: hr, doluluk: 0.45, tercih: [gor.x, gor.y, 0.5], enAz: 280 });
      const c = kutu.getCenter(V());
      if (k) { yakinOfs = k.pos.map((x, i) => x - h.getComponent(i)); yakinHed = [c.x - h.x, c.y - h.y, c.z - h.z]; }
      else { yakinOfs = [gor.x * 700, gor.y * 700, 250]; yakinHed = [0, 0, 0]; }
      const bas = story.view(), o = { u: 0 }, hv = V();
      yakinTw = gsap.to(o, { u: 1, duration: reduce ? 0.01 : 0.9, ease: 'power2.inOut', onUpdate: () => {
        const e = karakter.elNoktasi(hv), hp = [e.x, e.y, e.z];
        const pp = hp.map((x, i) => x + yakinOfs[i]), tt = hp.map((x, i) => x + yakinHed[i]);
        story.setView(bas.pos.map((x, i) => x + (pp[i] - x) * o.u), bas.target.map((x, i) => x + (tt[i] - x) * o.u));
      } });
      return;
    }
    if (!yakinAktif) return;
    yakinAktif = false;
    karakter.xrayKilit?.(false);
    const bas = story.view(), son = yakinDonus ?? story.shotOf('kitaplik'), o = { u: 0 };
    yakinTw = gsap.to(o, { u: 1, duration: reduce ? 0.01 : 0.8, ease: 'power2.inOut', onUpdate: () => {
      const f = (a, b) => a.map((x, i) => x + (b[i] - x) * o.u);
      story.setView(f(bas.pos, son.pos), f(bas.target, son.target));
    } });
  }
  gsap.ticker.add(() => {
    if (!yakinAktif || yakinTw?.isActive() || !karakter || !story) return;
    const h = karakter.elNoktasi(V()), hp = [h.x, h.y, h.z];
    story.setView(hp.map((x, i) => x + yakinOfs[i]), hp.map((x, i) => x + yakinHed[i]));
  });
  // Ziyaretçi kaydırırsa (tur kamerayı geri alır) eşya kamerası ve el takibi bırakılır
  const kameraBirak = () => { if (!yakinAktif && !durakTw) return; durakTw?.kill(); durakTw = null; if (yakinAktif) { yakinAktif = false; yakinTw?.kill(); karakter?.xrayKilit?.(false); } };
  addEventListener('wheel', kameraBirak, { passive: true });
  addEventListener('touchmove', kameraBirak, { passive: true });
  function kitapDurak(hit) {
    const D0 = durakBul('kitaplik');
    if (!D0) return;
    if (!aktif || !karakter) { biggieGitsin(D0); return; }
    let obj, ust, geri;
    const kitapK = hit.kitap ? kitapKutu(hit.kitap, hit.id) : null;
    if (hit.kitap) { // kitap: örneği gizle, yerine tek kitap ağı koy
      const im = hit.kitap, id = hit.id, m4 = new THREE.Matrix4(), bos = new THREE.Matrix4().makeScale(0, 0, 0), c = new THREE.Color();
      im.getMatrixAt(id, m4);
      const mat = im.material.clone(); if (im.instanceColor) { im.getColorAt(id, c); mat.color.copy(c); }
      obj = new THREE.Mesh(im.geometry, mat);
      obj.castShadow = true;
      m4.decompose(obj.position, obj.quaternion, obj.scale);
      ust = im.parent; ust.add(obj);
      im.setMatrixAt(id, bos); im.instanceMatrix.needsUpdate = true;
      const p = obj.position.clone(), q = obj.quaternion.clone();
      geri = (sn) => { birak(obj, ust, p, q, sn); setTimeout(() => { im.setMatrixAt(id, m4); im.instanceMatrix.needsUpdate = true; obj.removeFromParent(); mat.dispose(); }, (reduce ? 0 : sn) * 1000 + 30); };
    } else {
      obj = hit.eser; ust = obj.parent;
      const p = obj.position.clone(), q = obj.quaternion.clone();
      geri = (sn) => birak(obj, ust, p, q, sn);
    }
    const wp = hit.merkez ?? new THREE.Box3().setFromObject(obj).getCenter(V());
    // v5: üç klip (raf 400 / 1000 / 1600; meta raf_nokta z: elin uzandığı yükseklik): eşyanın merkezine en yakını. Kök
    // kitaplığın önünden raf_on_mm geride, y raf_nokta'nın yan kaymasıyla düzeltilir
    const klip = kitapKlibi(wp.z), km = karakter.meta?.(klip) ?? {}, rn = km.nesne?.raf_nokta ?? [-45, -340, 1000];
    const onX = kutuOf(D0)?.max.x ?? -1705;
    const yer = [onX + (km.raf_on_mm ?? 280), Math.min(820, Math.max(80, wp.y + rn[0]))];
    // v6: kamera önce eşyanın raftaki kadrajına (Biggie'nin duracağı yer ışın engeli), göster anında elden yakın plan
    const ek = kitapK ?? new THREE.Box3().setFromObject(obj);
    parcaKamera([ek], { haric: new Set([obj]), govde: false, govdeKadraj: true, haricOrnek: hit.kitap ? { ag: hit.kitap, id: hit.id } : null,
      sanal: [{ x: yer[0], y: yer[1], z0: 100, z1: 1450, r: 230 }], tercih: [1, -0.6, 0.35] });
    let elde = false, bitti = false;
    const D = {
      ...D0, yer, yon: -90, dizi: [
        { klip, sure: 5, anlar: [
          [{ meta: 'al', kesir: 0.2 }, () => { elde = eleAl(obj, [0, 0, 0], km.nesne?.kemik ?? 'tutma.R'); logla('kitap-al', { tur: hit.kitap ? 'kitap' : 'eser', klip }); }],
          [{ meta: 'goster.0', kesir: 0.4 }, () => elYakin(true, obj)],
          [{ meta: 'goster.1', kesir: 0.68 }, () => elYakin(false)],
          [{ meta: 'koy', kesir: 0.83 }, () => { elYakin(false); bitti = true; geri(0.4); logla('kitap-birak'); }],
        ] },
      ],
      iptal: () => { if (!bitti) { elYakin(false); geri(0.25); } elde = false; },
    };
    biggieGitsin(D);
  }
  function kitapKutu(im, id) {
    const m4 = new THREE.Matrix4();
    im.getMatrixAt(id, m4);
    if (!im.geometry.boundingBox) im.geometry.computeBoundingBox();
    return im.geometry.boundingBox.clone().applyMatrix4(m4.premultiply(im.matrixWorld));
  }
  const KITAP_KLIP = ['kitap_al_alt', 'kitap_al_orta', 'kitap_al_ust'];
  // mm: üst klip en çok ~1395'e uzanır; merkezi bunun üstündeki eşya (kitaplığın en üst gözü, z 1865+) tıklanmaz
  // (gerekçe klip-meta-v5.md: gözleri indirmek kitaplığı yeniden kurmak demek; 3. göz üst klip + kısa kayma ile yetişir)
  const ELIN_UST = 1750;
  function kitapKlibi(z) {
    let en = null, enD = Infinity;
    for (const k of KITAP_KLIP) {
      const m = karakter?.meta?.(k);
      if (!m || !karakter.klipVar(k)) continue;
      const d = Math.abs((m.nesne?.raf_nokta?.[2] ?? m.raf_mm) - z);
      if (d < enD) { en = k; enD = d; }
    }
    return en ?? 'kitap_al';
  }
  // Tıklanan küçük eşya (portfolyo parçaları): { kutu } | { kitap, id } | { eser } | null
  const parcaRay = new THREE.Raycaster();
  function parcaBul(x, y) {
    const pp = story?.api?.portfolyo?.parcalar?.();
    if (!pp) return null;
    const hedef = [...pp.oyun, ...pp.eser, ...(pp.kitap ? [pp.kitap] : [])];
    if (!hedef.length) return null;
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    parcaRay.setFromCamera(new THREE.Vector2(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1), story.camera);
    const h = parcaRay.intersectObjects(hedef, true)[0];
    if (!h) return null;
    if (h.object === pp.kitap) {
      const b = pp.kitap.userData.kitaplar?.[h.instanceId];
      if (b && b.dunya[2] > ELIN_UST) return null;
      return { kitap: pp.kitap, id: h.instanceId, merkez: b ? new THREE.Vector3(...b.dunya) : null };
    }
    let o = h.object;
    while (o && !o.userData.parca) o = o.parent;
    if (!o) return null;
    if (o.userData.parca.tur === 'oyun') return { kutu: o };
    return new THREE.Box3().setFromObject(o).getCenter(V()).z > ELIN_UST ? null : { eser: o };
  }
  // Ekrandaki noktada karakter eşyanın önünde mi (deri ağına ışın; test ve tıklanabilirlik)
  function karakterOnde(x, y, obj) {
    const ag = karakter?.deriAglari?.() ?? [];
    if (!ag.length) return false;
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    parcaRay.setFromCamera(new THREE.Vector2(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1), story.camera);
    const h = parcaRay.intersectObject(obj, true)[0];
    if (!h) return false;
    parcaRay.far = h.distance;
    const k = parcaRay.intersectObjects(ag, false).length > 0;
    parcaRay.far = Infinity;
    return k;
  }
  // ---- v7 (2026-11-04, Blender v7 klipleri): TV durağı armut_yat → armut_uyukla döngüsü (eller ensede) → başka başlıkta
  // armut_kalk (oda-karakter eylemKapat). Kök armudun eksenine göre (meta armut_yat.armut.eksen_mm [0, 515, 0];
  // oda-karakter durakGorevi capa). TV 'bas' karesinde (46) açılır; 'oturdu' (39) karesinde kamera armuda (kamera kuralı).
  // Kumanda yok (klip kumandasız). Eski tv_armut yedeği kaldırıldı (klip GLB'de yok)
  function ekranDurak(D) {
    const tvAc = () => { story?.api?.portfolyo?.ekran?.ileri?.(); logla('tv-ac'); };
    return { ...D, klip: 'armut_yat', capa: { ...D.capa, klip: 'armut_yat' }, tut: { klip: 'armut_uyukla' }, dizi: [{ klip: 'armut_yat', sure: 5, anlar: [
      [{ meta: 'bas', kesir: 0.3 }, tvAc],
      [{ meta: 'oturdu', kesir: 0.26 }, () => armutKamera(true)],
    ] }], iptal: () => { armutta = false; } };
  }
  // ---- armudun ezilmesi (core/oda-armut.js): Blender'la ortak formül (meta armut.gomulu), ezilme t'si çalan klibin
  // armut.ezilme_egrisi'nden ([[kare, t]]; armut_yat 0 → 1, armut_uyukla 1, armut_kalk 1 → 0). Başka klipte (yarıda
  // kesilip yürüyüşe geçildiyse) t yavaşça 0'a döner
  let ezici = null, ezU = 0, ezBekle = false;
  const ARMUT_KLIP = ['armut_yat', 'armut_uyukla', 'armut_kalk'];
  function egriDeger(e, f) {
    if (f <= e[0][0]) return e[0][1];
    for (let i = 1; i < e.length; i++) if (f <= e[i][0]) { const [a, va] = e[i - 1], [b, vb] = e[i]; return va + ((vb - va) * (f - a)) / Math.max(1e-6, b - a); }
    return e[e.length - 1][1];
  }
  function ezilmeHedef(kz) {
    if (!ARMUT_KLIP.includes(kz.ad)) return null;
    const e = karakter.meta(kz.ad)?.armut?.ezilme_egrisi;
    return Array.isArray(e) && e.length ? egriDeger(e, kz.kare) : kz.ad === 'armut_uyukla' ? 1 : null;
  }
  let ezZorla = null; // test ve kare: ezilmeyi elle ver (0..1) ya da null
  function armutKaresi(dms) {
    const a = story?.api?.portfolyo?.armut;
    if (!a) return;
    const kz = karakter?.klipZamani?.();
    const egri = ezZorla ?? (kz ? ezilmeHedef(kz) : null), dt = Math.min(0.1, (dms || 16) / 1000);
    // Kurulum (köşe birleştirme + ilk eğme) açılış yazıları sürerken değil: açılış bitince boşta ya da ilk ezilmede
    if (!ezici) {
      if (!egri && (acilis !== 'bitti' || ezBekle)) return;
      const kur = () => { ezici ??= armutEzici(a, karakter?.meta?.('armut_yat')?.armut?.gomulu ?? null); };
      if (!egri) { ezBekle = true; (window.requestIdleCallback ?? ((f) => setTimeout(f, 200)))(kur, { timeout: 3000 }); return; }
      kur();
      if (!ezici) return;
    }
    // Armut klibi çalarken t doğrudan eğriden (karakterin gömülmesiyle aynı kare); değilse yavaşça 0'a
    if (egri !== null) ezU = egri;
    else { ezU += (0 - ezU) * (1 - Math.exp(-dt * 2)); if (ezU < 0.002) ezU = 0; }
    ezici.ayarla(ezU);
  }
  let armutta = false;
  function armutKamera(ac) {
    if (!story || !karakter) return;
    if (!ac) { armutta = false; return; }
    if (story.focusedId && story.focusedId !== 'ekran') return;
    const k = armutKadraji();
    if (!k) return;
    armutta = true;
    kameraUc(kartKaydir(k), 1.4);
  }
  // Armuttaki Biggie'nin kadrajı (kamera kuralı): armut + yatan Biggie (kalçadan başa); TV tarafından
  function armutKadraji() {
    const a = story.api?.portfolyo?.armut, A = PORTF.PORT?.armut;
    if (!a || !A) return null;
    const kutu = new THREE.Box3().setFromObject(a);
    kutu.max.z = Math.min(kutu.max.z, 1000);
    const on = [Math.sin(A.rz), -Math.cos(A.rz)]; // armudun önü (dünya)
    const o = { haric: new Set([a]), govde: false, tercih: [on[0], on[1], 0] };
    return kadrajAra([kutu], { ...o, doluluk: 0.6 }) ?? kadrajAra([kutu], { ...o, doluluk: 0.45 }) ?? kadrajAra([kutu], { ...o, tercih: [on[0] - on[1], on[1] + on[0], 0], doluluk: 0.45 });
  }
  // "kobe" balonu: Biggie'nin kafasının üstünde (ekrana izdüşüm her karede)
  function balonGoster() {
    if (!balon || !story) return;
    balonSon = performance.now() + AYAR.balon * 1000;
    balon.hidden = false;
    balon.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translate(-50%, -100%) scale(0.9)' }, { opacity: 1, transform: 'translate(-50%, -100%) scale(1)' }],
      { duration: reduce ? 150 : 220, easing: EASE_OUT, fill: 'both' });
  }
  const bv = new THREE.Vector3();
  gsap.ticker.add(() => {
    if (!balon || balon.hidden || !karakter || !story) return;
    if (performance.now() > balonSon) {
      balon.hidden = true;
      return;
    }
    karakter.kafaUstu(bv).project(story.camera);
    const rc = story.renderer.domElement.getBoundingClientRect(), hr = root.getBoundingClientRect();
    balon.style.left = `${((bv.x * 0.5 + 0.5) * rc.width + rc.left - hr.left).toFixed(1)}px`;
    balon.style.top = `${((-bv.y * 0.5 + 0.5) * rc.height + rc.top - hr.top).toFixed(1)}px`;
  });

  // ---- duraklar ----
  const hotspotOf = (D) => D.yuva ?? (story?.hotspots?.some((h) => h.id === D.id) ? D.id : null);
  const durakBul = (id) => DURAK.find((D) => D.id === id || D.yuva === id) ?? null;
  // v6 (kullanıcı itirazı: sıradaki başlığa geçilince Biggie gitmiyordu): istasyona hangi yoldan gelinirse gelinsin
  // (işaretçi, şerit, kaydırmalı tur, "sıradaki" düğmesi, sahnede tıklama) Biggie oraya yürür ve eylemini kendisi başlatır.
  // Tur aynı durağı yeniden odaklarsa (kaydırma titremesi, tıklamanın kendi uçuşu) Biggie yeniden başlamaz; ziyaretçi aynı
  // durağa yeniden tıklarsa eylem bittiyse yeniden oynar
  let sonIstek = null, sonBitti = false;
  function istasyon(id, { tur: turdan = false } = {}) {
    const D = durakBul(id);
    if (!D) return;
    if (sonIstek === D.id && aktif && (turdan || !sonBitti)) return;
    // v7: kutu oyunları rafına gelinince Biggie kutu almaz, rafın yanında bekler (kutuya tıklanınca kutuSec). Kutu açıkken
    // rafa yeniden gelinirse (tur titremesi) Biggie diz pozunda kalır
    if (D.id === 'oyunlar' && KS.aktif) return;
    biggieGitsin(D);
  }
  // Başka istasyon: kutu paneli kapanır; Biggie gidince durağın iptal'i kutuyu rafa geri koyar (Biggie'siz sunumda hemen)
  function kutuPaneliBirak() {
    if (KS.aktif) { const K = KS.aktif; KS.aktif = null; if (!aktif || !karakter) { K.durum = 'rafta'; rafaKoy(K, 0.6); } }
    if (kutuP?.acik) kutuP.kapat();
  }
  function biggieGitsin(D) {
    if (!D) return;
    if (D.id !== 'oyunlar') kutuPaneliBirak();
    sonIstek = D.id; sonBitti = false;
    if (!TUR_DISI.has(D.id)) ziyaret.add(D.id);
    logla('durak', { id: D.id, biggie: aktif, dizi: D.dizi ? D.dizi.map((a) => a.klip) : undefined });
    if (aktif && karakter) karakter.durakaGit(D.id === 'ekran' && !D.dizi ? ekranDurak(D) : D);
    hareketsizSayac();
    turSonu();
  }
  // Durağın baktığı şey: sahnenin nesnesi (story.api.nesne: buzdolabi, cop, masa, portfolyo eşyaları), yoksa nokta,
  // o da yoksa Biggie'nin önü
  const kutuOf = (D) => { const o = story?.api?.nesne?.(D.id); return o ? new THREE.Box3().setFromObject(o) : null; };
  function noktaOf(D) {
    const b = kutuOf(D);
    if (b && !b.isEmpty()) return b.getCenter(new THREE.Vector3()).toArray();
    if (D.nokta) return D.nokta;
    const psi = ((D.yon ?? 0) * Math.PI) / 180;
    return [D.yer[0] + Math.sin(psi) * 450, D.yer[1] - Math.cos(psi) * 450, 900];
  }
  // Yuvasız durağın kadrajı: verilmişse kamera, yoksa durağın baktığı şeyle Biggie'nin arası, genel plan yönünden
  // v6: yuvasız istasyonun (buzdolabı, çöp, masa) kadrajı nesnenin ve Biggie'nin kutusundan (core/oda-kadraj.js):
  // kamera mobilyanın dışında, buzdolabında açık kapağın kutusu da kadrajda (yan-önden kapak ve Biggie birlikte)
  function istasyonKadraji(D, o = {}) {
    if (!D || !story?.api?.kadraj) return null;
    const kutu = new THREE.Box3(), nb = kutuOf(D);
    if (nb && !nb.isEmpty()) kutu.union(nb);
    if (D.id === 'buzdolabi') { // gövdenin yerine kapak (açık hâli) ve dolabın ön yüzü: yan-önden kapak ile Biggie
      const kp = story.scene.getObjectByName('buzdolabi_kapak');
      kutu.makeEmpty();
      if (kp) { const rz = kp.rotation.z; kp.rotation.z = rz - 1.8; kp.updateMatrixWorld(true); kutu.union(new THREE.Box3().setFromObject(kp)); kp.rotation.z = rz; kp.updateMatrixWorld(true); }
      if (nb) kutu.union(new THREE.Box3(V().set(nb.min.x, nb.min.y, 250), V().set(nb.min.x + 150, nb.max.y, nb.max.z)));
      kutu.min.z = Math.max(kutu.min.z, 250);
    }
    const [bx, by] = D.yer;
    const no = story.api.nesne?.(D.id), haric = new Set(no ? [no] : []);
    const kp = D.id === 'buzdolabi' && story.scene.getObjectByName('buzdolabi_kapak');
    if (kp) haric.add(kp);
    // v7 (kural: karakter odak nesnesini örtmez): önce nesnenin kendisi odak, Biggie gövde silindiri olarak ışın engeli
    // ve başı kadrajda görünür; olmazsa eski biçim (nesne + Biggie birlikte kadrajın konusu)
    if (!kutu.isEmpty() && !D.masa) {
      const sanal = [{ x: bx, y: by, z0: 0, z1: 1450, r: 230 }];
      // Klipte kök yan adım atıyorsa (buzdolabı v6: yaklas_kok_mm, karakter yerelinde +x sol, −y ileri) oraya da gövde
      const yk = karakter?.meta?.(D.klip)?.yaklas_kok_mm;
      if (Array.isArray(yk)) { const p = ((D.yon ?? 0) * Math.PI) / 180, fx = Math.sin(p), fy = -Math.cos(p); sanal.push({ x: bx - yk[0] * fy - yk[1] * fx, y: by + yk[0] * fx - yk[1] * fy, z0: 0, z1: 1450, r: 230 }); }
      const k = kadrajAra([kutu], { govde: false, haric, doluluk: 0.6, tercih: D.tercih ?? [-0.55, -1, 0.42], sanal, gorunsun: { noktalar: [[bx, by, 1250]] }, ...o })
        ?? kadrajAra([kutu], { govde: false, haric, doluluk: 0.6, tercih: D.tercih ?? [-0.55, -1, 0.42], sanal, ...o });
      if (k) return k;
    }
    // Biggie: göğsünden yukarısı kesin (bacaklar kadraj kenarında kalabilir; oda-yerler BIGGIE_DURAK sözleşmesi)
    kutu.union(new THREE.Box3(V().set(bx - 200, by - 200, D.masa ? 600 : 650), V().set(bx + 200, by + 200, D.masa ? 1300 : 1450)));
    return kadrajAra([kutu], { govde: false, haric, doluluk: 0.72, tercih: D.tercih ?? [-0.55, -1, 0.42], ...o });
  }
  function durakKadraji(D) {
    if (!hotspotOf(D) && D.hesapla !== false) { const h = istasyonKadraji(D); if (h) return { pos: h.pos, target: h.target }; }
    const k = D.kamera ?? D.kadraj; // BIGGIE_DURAK kadraj: { pos, target, w }; telefonda w sığana dek geri çekilir
    if (k) {
      if (!k.w) return k;
      const cam = story.camera, th = Math.tan((cam.fov * Math.PI) / 360) * cam.aspect, gerek = k.w / 2 / th;
      const d = k.pos.map((x, i) => x - k.target[i]), L = Math.hypot(...d) || 1, f = Math.max(1, gerek / L);
      return { pos: k.target.map((x, i) => x + d[i] * f), target: [...k.target] };
    }
    const n = noktaOf(D);
    const m = [(D.yer[0] + n[0]) / 2, (D.yer[1] + n[1]) / 2, 850];
    const g = story.shotOf(null).pos, dx = g[0] - m[0], dy = g[1] - m[1], L = Math.hypot(dx, dy) || 1;
    // Biggie (boy ~1,4 m) ile baktığı şey kadraja sığsın: dikeyde 1,9 m, yatayda ikisinin arası + 1,4 m
    const cam = story.camera, tv = Math.tan((cam.fov * Math.PI) / 360), th = tv * cam.aspect;
    const gen = Math.hypot(n[0] - D.yer[0], n[1] - D.yer[1]) + 1400;
    const uz = Math.max(1250 / tv, gen / 2 / th, 2200);
    return { pos: [m[0] + (dx / L) * uz, m[1] + (dy / L) * uz, 1500], target: [m[0], m[1], 900] };
  }
  let durakTw = null;
  function yuvasizDurak(D) {
    if (!story) return;
    story.blur(); // açık kart kapanır; kaydırmalı turun süren tıklama uçuşu da biter (core/oda-tur.js)
    if (!story.driven) story.drive(true);
    const bas = story.view(), son = durakKadraji(D), o = { u: 0 };
    durakTw?.kill();
    durakTw = gsap.to(o, {
      u: 1, duration: reduce ? 0.01 : AYAR.durakUcus, ease: 'power2.inOut',
      onUpdate: () => { const f = (a, b) => a.map((x, i) => x + (b[i] - x) * o.u); story.setView(f(bas.pos, son.pos), f(bas.target, son.target)); },
      onComplete: () => { durakTw = null; },
    });
    root.classList.add('sunum-durakta'); // turun genel plan yazısı bu kadrajda görünmesin; kaydırınca kalkar
    dispatchEvent(new CustomEvent('oda-sunum-durak', { detail: { id: D.id } }));
    biggieGitsin(D);
  }
  // Ekranda tıklanan yer (ürün yuvası değilse): ışının değdiği ilk yuvasız durak nesnesinin kutusu (sahnenin
  // tıklanmaz nesneleri de: kutuyla bakılır); nesnesi olmayan durakta değdiği yüzeye en yakın nokta (600 mm içinde)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), kv2 = new THREE.Vector3();
  function yuvasizBul(x, y) {
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    ndc.set(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, story.camera);
    let en = null, enT = Infinity;
    for (const D of DURAK) {
      if (hotspotOf(D)) continue;
      const b = kutuOf(D), p = b && ray.ray.intersectBox(b, kv2);
      if (p) { const t = p.distanceTo(ray.ray.origin); if (t < enT) { en = D; enT = t; } }
    }
    if (en) return en;
    const hedefler = [];
    story.scene.traverse((o) => { if (o.isMesh && o.visible && !o.isSkinnedMesh && o.name !== 'elma') hedefler.push(o); });
    const isabet = ray.intersectObjects(hedefler, false).find((i) => { let o = i.object; while (o) { if (o.name === 'karakter') return false; o = o.parent; } return true; });
    if (!isabet) return null;
    let enUz = 600;
    for (const D of DURAK) {
      if (hotspotOf(D) || kutuOf(D)) continue;
      const n = noktaOf(D), uz = Math.hypot(isabet.point.x - n[0], isabet.point.y - n[1], (isabet.point.z - n[2]) * 0.5);
      if (uz < enUz) { en = D; enUz = uz; }
    }
    return en;
  }

  // ---- tur sonu: "Çalışmaya dön" ----
  let hareketsiz = null;
  function hareketsizSayac() {
    clearTimeout(hareketsiz);
    if (!aktif || reduce) return;
    hareketsiz = setTimeout(() => { logla('hareketsiz'); butonGoster(); }, AYAR.hareketsiz * 1000);
  }
  function turSonu() {
    const gerek = DURAK.filter((D) => !TUR_DISI.has(D.id));
    if (gerek.every((D) => ziyaret.has(D.id))) butonGoster();
  }
  function butonGoster() {
    if (!calisBtn || !aktif || !karakter || reduce || !calisBtn.hidden) return;
    calisBtn.hidden = false;
    isaret('calismaButon');
    logla('calisma-buton');
    calisBtn.animate([{ opacity: 0, transform: 'translate(-50%, 8px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 260, easing: EASE_OUT, fill: 'both' });
  }
  calisBtn?.addEventListener('click', () => {
    if (!aktif) return;
    aktif = false;
    clearTimeout(hareketsiz);
    logla('calismaya-don');
    calisBtn.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease', fill: 'both' }).finished.then(() => { calisBtn.hidden = true; });
    karakter?.calismayaDon();
    // Kamera masaya: Biggie'nin oturuşu görünsün (tur yeniden kaydırılınca sürer)
    if (story) yuvasizDurak({ ...durakBul('masa'), id: 'masa' });
  });

  return {
    zaman, kayit, ziyaret, durak: DURAK, gecici, t0, // t0: performance.now() kökü (zaman ve kayit ms bundan)
    get acilis() { return acilis; },
    get aktif() { return aktif; },
    // Motor kurulunca
    bagla(s, tr) {
      story = s;
      tur = tr;
      const ag = () => karakter?.deriAglari?.() ?? [];
      if (karakter) s.api?.kadraj?.kemikBagla(() => karakter.govdeKemikleri ?? [], ag);
      s.api?.kameraBagla?.(s.camera, root); // v7: yakın plan kadrajları bu kameranın oranı ve açısıyla (oda-sahne odakKadraji)
      // v7: kutu oyunu paneli, oklar ve ipucu
      kutuP = kutuPaneli(root, { t, lang, onOnceki: () => kutuCevir(-1), onSonraki: () => kutuCevir(1), onGeri: () => kutuGeri() });
      gsap.ticker.add((_, dms) => { kutuKaresi(); armutKaresi(dms); golgeSeyrek(); });
      // v7 (telefon kare süresi): dikey ekranda yakın plandayken gölge haritası iki karede bir yenilenir (duran eşyaların
      // gölgesi değişmez; yalnız Biggie'ninki 15 Hz). Yakın plan kadrajı göz yüksekliğinden odanın daha çoğunu gösterdiği
      // için çizim 136 → 220 çağrıya çıkmıştı (scripts/oda-kare-olc.py)
      let gk = 0;
      function golgeSeyrek() {
        const sm = s.renderer?.shadowMap;
        if (!sm?.enabled) return;
        if (s.camera.aspect < 0.9 && s.focusedId) { sm.autoUpdate = false; if ((gk++ & 1) === 0) sm.needsUpdate = true; }
        else if (!sm.autoUpdate) sm.autoUpdate = true;
      }
      // Yuvasız duraklara tıklama: sürüklemeyle karışmasın; ürün yuvası (story.hit) tur ve onActivate'e kalır
      const host = s.renderer?.domElement?.parentElement;
      let asagi = null;
      host?.addEventListener('pointerdown', (e) => { asagi = [e.clientX, e.clientY]; });
      monitor = odaMonitoru(s.scene, { reduce });
      // v7: rafın kadrajında (ya da kutu açıkken) fare bir kutunun üzerindeyse adı ve tek satırı imlecin yanında
      let ipT = 0, ipDokun = null;
      const rafta = () => s.focusedId === 'oyunlar' || !!KS.aktif;
      host?.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || !kutuP) return;
        if (!rafta()) { if (kutuP.ipucuNo !== null) kutuP.ipucu(null); return; }
        const hr = root.getBoundingClientRect(), x = e.clientX - hr.left, y = e.clientY - hr.top;
        if (performance.now() - ipT < 50) { if (kutuP.ipucuNo !== null) kutuP.ipucu(kutuP.ipucuNo, x, y); return; }
        ipT = performance.now();
        const P = parcaBul(e.clientX, e.clientY);
        const no = P?.kutu?.userData.parca?.no;
        kutuP.ipucu(no ?? null, x, y);
        host.style.cursor = no !== undefined ? 'pointer' : '';
      });
      host?.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; kutuP?.ipucu(null); host.style.cursor = ''; }); // dokunuş bitince de leave gelir
      host?.addEventListener('pointerup', (e) => {
        if (!asagi || Math.hypot(e.clientX - asagi[0], e.clientY - asagi[1]) > 8) return;
        // v5: küçük eşya (rafın kutusu, kitaplığın eseri ya da kitabı): motor rafa/kitaplığa yakınlaşır (hotspot), Biggie o eşyaya
        const P = parcaBul(e.clientX, e.clientY);
        if (P) {
          const durak = P.kutu ? 'oyunlar' : 'kitaplik';
          if (s.focusedId !== durak && !s.busy) { if (!s.driven) s.drive(true); s.focusTo(durak); }
          if (P.kutu) {
            // v7: dokunmatikte ilk dokunuş kutunun tanımını gösterir, aynı kutuya ikinci dokunuş seçer
            let no = P.kutu.userData.parca?.no, m = P.kutu;
            // İkinci dokunuş ilkinin yakınındaysa (parmak 40 px kayabilir, yığındaki komşu kutuya değebilir) ipucundaki kutu
            if (e.pointerType === 'touch' && ipDokun && kutuP?.ipucuNo !== null && Math.hypot(e.clientX - ipDokun[0], e.clientY - ipDokun[1]) < 40) {
              no = kutuP.ipucuNo; m = story.api.portfolyo.parcalar().oyun.find((x) => x.userData.parca?.no === no) ?? m;
            }
            if (e.pointerType === 'touch' && kutuP && kutuP.ipucuNo !== no && KS.aktif?.m !== m) {
              const hr = root.getBoundingClientRect();
              kutuP.ipucu(no, e.clientX - hr.left, e.clientY - hr.top, { dokun: true });
              ipDokun = [e.clientX, e.clientY];
              logla('kutu-ipucu', { no: no + 1, dokun: true });
              return;
            }
            ipDokun = null;
            kutuP?.ipucu(null);
            kutuSec(m);
          } else kitapDurak(P);
          return;
        }
        if (e.pointerType === 'touch') kutuP?.ipucu(null);
        if (s.busy) return;
        if (s.hit?.(e.clientX, e.clientY)) return;
        const D = yuvasizBul(e.clientX, e.clientY);
        if (D) yuvasizDurak(D);
      });
    },
    karakter(k) {
      karakter = k;
      karDurum = k ? 'var' : 'yok';
      if (!k) { if (giris === 'dans' && hazirOldu) isimGoster(); return; }
      k.dinle(olay);
      story?.api?.kadraj?.kemikBagla(() => k.govdeKemikleri ?? [], () => k.deriAglari?.() ?? []);
      k.sunumAyar({
        engel: Array.isArray(PORTF.ENGEL) ? PORTF.ENGEL : [],
        cop: () => { const a = story?.api?.nesne?.('cop')?.userData?.agiz; return a ? { x: a[0], y: a[1], z: a[2], r: (PORTF.PORT?.cop?.r ?? 130) - 20 } : null; },
      });
      logla('karakter');
      if (hazirOldu && acilis !== 'bitti') takipBasla();
    },
    // Motor girişi bitince (onReady): tur başlatma açılışın sonuna ertelenir. cb tur.hazir
    hazir(cb) {
      hazirOldu = true;
      hazirCb = cb;
      isaret('hazir');
      if (acilis === 'bitti') { hazirCb = null; cb(); return; }
      // Telefonda Biggie yakın plan: kamera sayfanın (açılış boyunca takip)
      takipBasla();
      if (giris === 'dans') {
        if (reduce || karDurum === 'yok') isimGoster();
        else yedek = setTimeout(isimGoster, AYAR.dansBekle * 1000);
      }
    },
    // Ürün yuvasına tıklama (story onActivate): Biggie o durağa gider (kamera turun)
    tikla(id) { if (id) istasyon(id); },
    // Kaydırmalı tur bir durağa vardı (core/oda-tur.js onDurak): Biggie o istasyona
    turDurak(id) { if (id) istasyon(id, { tur: true }); },
    // Test ve demo: durağa doğrudan (yuvalıysa turla, yuvasızsa bu modülle)
    git(id) {
      const D = durakBul(id);
      if (!D) return false;
      const h = hotspotOf(D);
      if (h && story) { story.focus(h); return true; } // motor → onActivate → tikla + tur
      sonIstek = null; // test ve demo: aynı durak yeniden de sunulur
      yuvasizDurak(D);
      return true;
    },
    kes,
    // Test ve demo (v5): rafın i. kutusu, kitaplığın i. eseri ya da i. kitabı tıklanmış gibi
    parca(tur, i = 0) {
      const pp = story?.api?.portfolyo?.parcalar?.();
      if (!pp) return false;
      if (tur === 'kutu' && pp.oyun[i]) { kutuSec(pp.oyun[i]); return true; }
      if (tur === 'eser' && pp.eser[i]) { kitapDurak({ eser: pp.eser[i] }); return true; }
      if (tur === 'kitap' && pp.kitap && i < pp.kitap.count) { kitapDurak({ kitap: pp.kitap, id: i }); return true; }
      return false;
    },
    get monitor() { return monitor; },
    // Ölçüm (v6): istasyonun kadrajını hesapla (kutu: nesne + Biggie silindiri)
    kadrajHesapla: (id, o = {}) => istasyonKadraji(durakBul(id), o),
    // v7 test ve kare: kutu oyunu (oklar, geri, durum), armudun ezilmesi, kutu sahnesinin kadrajı
    kutuOk: (yon) => kutuCevir(yon > 0 ? 1 : -1),
    kutuGeri: () => kutuGeri(),
    get kutu() { const K = KS.aktif; return K ? { no: K.P.no, sayfa: K.sayfa + 1, ustte: K.ustte, durum: K.durum, panel: !!kutuP?.acik, tutuyor: !!karakter?.tutuyor, q: K.m.quaternion.toArray().map((x) => +x.toFixed(3)), z: Math.round(K.m.getWorldPosition(V()).z) } : null; },
    kutuIpucu: (no, x = 200, y = 200, o = {}) => kutuP?.ipucu(no, x, y, o),
    // i. kutunun ekranda tıklanabilir bir noktası (istemci px; kutunun yüzünde 5 × 5 ızgarada ışının ilk değdiği kutu o ise) ya da null
    kutuNokta(i) {
      const m = story?.api?.portfolyo?.parcalar?.()?.oyun?.[i];
      if (!m) return null;
      const b = new THREE.Box3().setFromObject(m), rc = story.renderer.domElement.getBoundingClientRect(), p = V();
      for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) for (const fz of [0.5, 0.8, 0.2]) {
        p.set(b.min.x + (b.max.x - b.min.x) * fx, b.min.y + (b.max.y - b.min.y) * fy, b.min.z + (b.max.z - b.min.z) * fz).project(story.camera);
        if (Math.abs(p.x) > 0.95 || Math.abs(p.y) > 0.95) continue;
        const x = rc.left + (p.x * 0.5 + 0.5) * rc.width, y = rc.top + (-p.y * 0.5 + 0.5) * rc.height;
        const el = document.elementFromPoint(x, y);
        if (el !== story.renderer.domElement) continue;
        if (parcaBul(x, y)?.kutu === m && !karakterOnde(x, y, m)) return [Math.round(x), Math.round(y)];
      }
      return null;
    },
    kutuKadraji: (gercek = true) => (KS.aktif ? kutuKadraji(KS.aktif, { gercek }) : null),
    get kutuPanel() { return kutuP; },
    armutZorla(u) { ezZorla = u === null || u === undefined ? null : +u; },
    get armut() { return ezici ? { u: +ezU.toFixed(3), oturak: Math.round(ezici.oturak()), sirt: ezici.sirt().map(Math.round) } : null; },
    kameraUc: (k, sn = 1) => kameraUc(k, sn),
  };
}
