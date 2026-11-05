// Biggie'li rehberli sunum (senaryo: biggie-sunum.md, 2026-11-03; v8 2026-11-04). Odanın açılışını, Biggie'nin duraklara
// gidişini, elma balonunu ve kamerayı yönetir; karakterin kendisi core/oda-karakter.js'te (durakaGit, komut, olaylar).
//  1. Açılış: Biggie üst kattan iner, eşikte dans eder; dansın üstünde altta "Arda Bişgin" ve unvan yavaşça belirir, birlikte
//     kaybolur; ardından "Burası da atölyesi..." cümlesi. Biggie odanın ortasında bekler, kamera genel plana gelir.
//     Telefonda (dikey) kamera açılış boyunca Biggie'yi yakın plandan izler. ?giris=yukleme: yazılar oda yüklenirken
//     başlar (varsayılan ?giris=dans: dansın üstünde). Yazılar yalnız opacity/transform (WAAPI). Hareket azaltmada yazılar
//     kısa fade, dans ve kamera hareketi yok. Ziyaretçi dokunur, kaydırır ya da tuşa basarsa açılış hemen biter.
//  2. v8: kamera hep sayfanın (story.drive). Altı işaretçiden birine (ya da eşyanın kendisine) tıklanınca sec(id): kart
//     açılır, kamera durağın kadrajına uçar (story.shotOf; core/oda-sahne.js odakKadraji, kamera kuralı), Biggie oraya
//     yürüyüp eylemini yapar. Oturuyorsa (masa, armut) önce kalkar. "Geri" ya da Esc: elde büst varsa yerine koyar, yoksa
//     genel plana döner (Biggie olduğu yerde kalır). "Çalışmaya dön" ve kaydırmalı tur kalktı.
//     Duraklar: armut (uyuklar, gözler kapalı; kart Hakkımda), kitaplık (yüzü rafa; büstün noktasına tıklanınca eline alır,
//     çevirerek bakar, kartta büstün bilgisi; Geri: yerine koyar), masa (oturup yazar; monitörde masa-ekran.mp4),
//     buzdolabı (elma), ekran (armuda oturup TV izler; kart Süreç), kutu oyunları (v7 kutu sahnesi).
//  3. Elma: karakterde (2 elma, ısırık, çöpe atış); burada yalnız "kobe" balonu.
// Durak listesi core/oda-yerler.js BIGGIE_DURAK'tan ({ id, yer: [x, y], yon: derece, klip, sure, ... }).
import * as THREE from 'three';
import { gsap } from 'gsap';
import * as YERLER from './oda-yerler.js';
import * as PORTF from './oda-portfolyo.js'; // ENGEL (yol bulma), çöp kovası (sahne api.nesne('cop').userData.agiz)
import { odaMonitoru } from './oda-monitor.js'; // v5: Biggie masaya oturunca monitörde tasarım döngüsü
import { kutuPaneli } from './oda-kutu-panel.js'; // v7: kutu oyunu paneli (dört yüz = dört sayfa), oklar, ipucu
import { armutEzici } from './oda-armut.js'; // v7: armut Biggie yatınca içine göçer
import { bustTutusu } from './oda-ik.js'; // v8.1: büstü alttan ve arkadan tutan eller, başı büste

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
  balon: 1.5,            // sn: "kobe" balonu
  takipYay: 2.4,         // 1/sn: telefonda takip kamerasının yumuşaklığı
};
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'; // animate skill: güçlü ease-out (giriş/çıkış)

// Geçici duraklar (BIGGIE_DURAK gelene dek; yer: Biggie'nin durduğu nokta, mm; yon: ψ derece, 0 kameraya, 90 sağa,
// 180 masaya, −90 sola). Ürün yuvası olanlar yuva kimliğiyle aynı adda
export const GECICI_DURAK = []; // v8: bütün duraklar core/oda-yerler.js BIGGIE_DURAK'ta

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
  let aktif = true;        // Biggie sunuyor (v8: her zaman; "Çalışmaya dön" kalktı)
  const ziyaret = new Set();
  const portre = () => innerWidth / innerHeight < 0.9;

  // ---- katmanlar (oda/index.html) ----
  const kat = root.querySelector('.oda-acilis'), isim = kat?.querySelector('.oa-isim'), unvan = kat?.querySelector('.oa-unvan'), cumle = kat?.querySelector('.oa-cumle');
  const balon = root.querySelector('.oda-balon');
  if (isim) { isim.textContent = t('oda.sunum.ad'); unvan.textContent = t('oda.sunum.unvan'); cumle.textContent = t('oda.sunum.cumle'); }
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
    const bitir = () => { if (hazirOldu && hazirCb) { const cb = hazirCb; hazirCb = null; cb(); } };
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
    else if (ad === 'oturdu') { masada = true; monitorGuncelle(); fareEvi(); }
    else if (ad === 'kalkti') { masada = false; monitorGuncelle(); }
    else if (ad === 'eylem-bitti' && v?.id === sonIstek) sonBitti = true;
    else if (ad === 'tutuyor') { kutuTutuyor(); bustTutuyor(); }
    else if (ad === 'elma-al') buzElmalari(v?.kalan ?? 0);
  }

  // v8.3: buzdolabının üst rafındaki elmalar kalan sayısınca görünür
  function buzElmalari(kalan) { for (let i = 0; i < 2; i++) { const o = story?.scene?.getObjectByName(`buz_elma_${i}`); if (o) o.visible = i < kalan; } }
  // v8.3 (kullanıcı): buzdolabı durak değil, tıklanabilir: genel plana dönülür (oradan izlenir), Biggie elmayı alıp masada
  // yer; elinde elma varken ya da elma kalmadıysa yine gider (buzdolabi_bos)
  function buzdolabinaGit() {
    if (!aktif || !karakter) return false;
    if (karakter.elma?.elde) return false;
    if (story.focusedId || bust.aktif || KS.aktif) geri();
    sonIstek = 'buzdolabi';
    biggieGitsin(durakBul('buzdolabi'));
    logla('buzdolabi-tik', { kalan: karakter.elma?.kalan });
    return true;
  }
  const buzRay = new THREE.Raycaster();
  function buzdolabiVurur(x, y) {
    const o = story?.api?.nesne?.('buzdolabi') ?? story?.scene?.getObjectByName('buzdolabi_kapak');
    if (!o) return false;
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    buzRay.setFromCamera(new THREE.Vector2(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1), story.camera);
    // Yalnız buzdolabının kendisine (ve kapağına) ışın; önündeki eşya örtse de tıklama buzdolabı sayılır
    const kp = story.scene.getObjectByName('buzdolabi_kapak');
    return buzRay.intersectObject(o, true).length > 0 || (!!kp && buzRay.intersectObject(kp, true).length > 0);
  }

  // ---- v5 (2026-11-03): eşyayı ele alma, rafın kutuları, kitaplığın eserleri, TV'de armut ----
  let monitor = null;
  const V = () => new THREE.Vector3();
  // Eşya el kemiğine bağlanır (dünya duruşu korunur), sonra avucun önüne kayar (kemik birimi metre). El kemiği yoksa
  // eşya yerinde kalır, bırakılırken doğrudan hedefe kayar
  // kemik: el kemiğinin adı (yoksa el.R); tut: eşyanın merkezi kemiğin yerelinde (metre; meta mm / 1000)
  // q: eşyanın kemiğin yerelindeki dönüşü (v6 meta el_yerel_q, Blender sırası [w, x, y, z]); verilirse ona da döner
  function eleAl(obj, tut = [0, 0.09, 0.05], kemik = null, q = null, sn = 0.3) {
    // three.js kemik adlarındaki noktayı atar (Blender 'tutma.R' → 'tutmaR')
    const el = (kemik && (karakter?.kemik?.(kemik) ?? karakter?.kemik?.(kemik.replace(/\./g, '')))) || karakter?.elKemigi;
    if (!el || !obj) return false;
    gsap.killTweensOf(obj.position); gsap.killTweensOf(obj.quaternion);
    el.attach(obj);
    gsap.to(obj.position, { x: tut[0], y: tut[1], z: tut[2], duration: reduce ? 0.01 : sn, ease: 'power2.out' });
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
  // v8.2 (kullanıcı: kutu küçük rafın içinden geçmesin): kutu gözüne ya da gözünden yalnız yatay kayar (tahtanın 10 mm
  // üstünde); yükselip alçalması rafın önünde, kutunun bütünü rafın ön yüzünün dışındayken (merkez: ön yüz − yarı en
  // büyük kenar − 30). Yol noktaları dünyada; raf grubu dünya kökünde
  // Dışarıdaki x: kutunun bütünü (dönerken köşegeni dahil) rafın ön yüzünün dışında
  const disX = (K) => { const s = [...(K.P.olcu ?? [300, 300, 80])].sort((a, b) => b - a); return rafOnX() - Math.hypot(s[0], s[1]) / 2 - 30; }; // en büyük iki kenarın köşegeni
  function rafaKoy(K, sn = 0.9) {
    const p = K.P.yuva.p, dx = disX(K), cur = K.m.getWorldPosition(V()), qs = K.m.getWorldQuaternion(new THREE.Quaternion());
    const ust = (PORTF.OYUN_RAFI_UST ?? 420) + 40 + Math.max(...(K.P.olcu ?? [300])) / 2;
    // 1) dönmeden rafın önüne (üstündeyse rafın üstünden yatay, yükselerek); 2) rafın önünde, dışarıda dönüp gözünün
    // yüksekliğine iner; 3) gözün içine dönmeden kayar, iner
    const a = [V().set(dx, cur.y, Math.max(cur.z, cur.z > (PORTF.OYUN_RAFI_UST ?? 420) - 20 ? ust : cur.z))];
    const b = [V().set(dx, p.y, p.z + 2)], c = [V().set(p.x, p.y, p.z + 2), p];
    yolla(K.m, K.ust, a, qs, sn * 0.3, () => yolla(K.m, K.ust, b, K.P.yuva.q, sn * 0.35, () => yolla(K.m, K.ust, c, K.P.yuva.q, sn * 0.35, () => { K.ustte = false; })));
  }
  function rafUstuneKoy(K, sn = 1.0) {
    const dx = disX(K), p = K.P.yuva.p, h = K.hedefP, ust = (PORTF.OYUN_RAFI_UST ?? 420) + 40 + K.P.kalin;
    // Gözden dönmeden çıkar, dönüş rafın önünde
    // Gözden dönmeden çıkar; rafın önünde (dışarıda) yükselirken döner; rafın üstüne dönmeden gelir
    const ust2 = (PORTF.OYUN_RAFI_UST ?? 420) + 40 + Math.max(...(K.P.olcu ?? [300])) / 2;
    yolla(K.m, K.ust, [V().set(p.x, p.y, p.z + 2), V().set(dx, p.y, p.z + 2)], K.P.yuva.q, sn * 0.3,
      () => yolla(K.m, K.ust, [V().set(dx, h.y, Math.max(h.z + 40, ust2))], K.hedefQ, sn * 0.35,
        () => { // rafın üstüne inişin yüksekliği kutunun bu duruştaki gerçek kutusundan (vitrin kutusu hafif eğik: kalınlığı büyük)
          const q0 = K.m.quaternion.clone(); K.m.quaternion.copy(K.hedefQ); K.m.updateMatrixWorld(true);
          const bb = new THREE.Box3().setFromObject(K.m), alt = (PORTF.OYUN_RAFI_UST ?? 420) + 1 - (bb.min.z - K.m.getWorldPosition(V()).z);
          K.m.quaternion.copy(q0); K.m.updateMatrixWorld(true);
          K.hedefP.z = Math.max(K.hedefP.z, alt);
          yolla(K.m, K.ust, [V().set(h.x, h.y, h.z + 40), h], K.hedefQ, sn * 0.35, () => { K.ustte = true; });
        }));
  }
  // Panelin kart modu: yan kart (masaüstü) ya da alttaki yaprak (telefon); kadraj buna göre ötelenir
  function kartModu() {
    if (!story) return null;
    const yan = root.dataset.panel === 'side' && story.camera.aspect >= 0.9;
    if (kutuP?.acik) return yan ? 'side' : 'bottom';
    // v8: telefonda durağın kartı alttan açılır (armut, büst kadrajı): eşya ekranın üst yarısında
    return story.focusedId ? (yan ? 'side' : 'bottom') : null;
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
      // v8.2: kutu ele bağlanmaz; 'al'dan 'birak'a dek site kutuyu gözünden yatay çıkarıp rafın önünden üstüne taşır
      // (klibin eli rafın içinden geçiyordu; kutu_al_diz Blender'da yenileniyor)
      [{ meta: 'al', kesir: 0.3 }, () => { const m = karakter?.meta?.(durakBul('oyunlar').kutuDizi?.[1] ?? 'kutu_al_diz') ?? {}; const sn = m.al && m.birak ? Math.max(0.8, (m.birak - m.al) / 30) : 1.6; rafUstuneKoy(K, reduce ? 0.01 : sn); K.elde = false; logla('kutu-al', { no: K.P.no + 1 }); }],
      [{ meta: 'birak', kesir: 0.75 }, () => {
        K.elde = false; K.ustte = true; K.durum = 'ustte';
        logla('kutu-ustte', { no: K.P.no + 1 });
      }],
    ];
  }
  // kutu_rafa_birak'ın anları: al (52) üstten el.R'ye, birak (110) gözüne
  function birakAnlari(K) {
    const km = karakter?.meta?.(V7().birak)?.kutu ?? {}, ey = Array.isArray(km.el_yerel) ? km.el_yerel.map((v) => v / 1000) : null;
    return [
      // v8.2: kutu ele bağlanmaz; site rafın üstünden önüne, oradan gözüne yatay kaydırır
      [{ meta: 'al', kesir: 0.12 }, () => { K.cevir = null; rafaKoy(K, reduce ? 0.01 : 1.4); K.elde = false; }],
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
      // v8 büst: kadrajın konusu büst ve Biggie'nin yüzü birlikte (büstü eline alıp bakan Biggie; kamera çok yaklaşmasın)
      if (obj?.userData?.parca?.bust && karakter.kafaUstu) kutu.expandByPoint(karakter.kafaUstu(V()).add(V().set(0, 0, -120)));
      // Tercih: Biggie'nin yanından (kameranın bulunduğu taraftan), eşyanın biraz üstünden
      const gor = V().fromArray(story.view().pos).sub(h).setZ(0).normalize();
      // Önce gövdenin kadraja girmediği açı (eşya kitaplığın önünde, Biggie onun önünde: çoğunlukla yandan, rafın yüzü boyunca)
      const hr = obj ? new Set([obj]) : null, yk = [0.12, 0.26, 0.4, 0.55, 0.72, 0.9];
      // Tercih sırası: kameranın bulunduğu yan, sonra rafın yüzü boyunca iki yan, sonra odanın içi
      let k = null;
      // v8 büst: Biggie odaya dönük, büst önünde; kamera önünden (gövde kadrajın konusu, ışın engeli değil)
      const bustMu = !!obj?.userData?.parca?.bust;
      if (bustMu) {
        // v8.1: kamera tam önünden, insan gözünün en alçak yüksekliğinden (1400; Biggie kısa, yukarıdan bakınca büyük başı
        // yüzünü saklıyordu), 1,6 m geriden; büst ve yüz birlikte. Odanın içinde (kök kitaplığın önünde, yüzü odaya)
        // v8.3 (kullanıcı: büst ve yüz birlikte): büstün yüzü Biggie'nin önünden soluna 50° (Blender bust.yaw_derece);
        // kamera ikisinin arasında (önünden 26° sola), 1,5 m: Biggie'nin yüzü ve büstün yüzü birlikte
        const yaw = ((karakter.meta?.('bust_tut')?.bust?.yaw_derece ?? 50) * Math.PI) / 180;
        const psi = (karakter.durum?.psi ?? 0) + yaw * 0.52, cc = kutu.getCenter(V());
        k = { pos: [cc.x + Math.sin(psi) * 1500, cc.y - Math.cos(psi) * 1500, 1350] };
      }
      if (!k) for (const t of [[gor.x, gor.y, 0.5], [0, 1, 0.5], [0, -1, 0.5], [1, 0, 0.5]]) if ((k = kadrajAra([kutu], { haric: hr, doluluk: 0.55, tercih: t, enAz: 280, govdeKadraj: true, yukseklik: yk }))) break;
      // Bulunamazsa gövde yalnız kadrajın kenarında (eşyanın bulunduğu orta bölge temiz), en son yalnız ışın engeli
      if (!k) for (const t of [[gor.x, gor.y, 0.5], [0, 1, 0.5], [0, -1, 0.5]]) if ((k = kadrajAra([kutu], { haric: hr, doluluk: 0.5, tercih: t, enAz: 280, govdeKadraj: 0.45, yukseklik: yk }))) break;
      k ??= kadrajAra([kutu], { haric: hr, doluluk: 0.45, tercih: [gor.x, gor.y, 0.5], enAz: 280 });
      const c = kutu.getCenter(V());
      // Telefonda kart alttan açılır: bakış konunun altına iner, büst ve yüz ekranın üst yarısında kalır
      if (k && bustMu && portre()) { const L = Math.hypot(k.pos[0] - c.x, k.pos[1] - c.y, k.pos[2] - c.z); c.z -= 0.5 * L * Math.tan((story.camera.fov * Math.PI) / 360); }
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
  // ---- Kitaplıktaki büstler (v8; v8.2 Blender klipleriyle). Kitaplık durağındayken her büstün üstünde küçük bir nokta
  // (yalnız büstler tıklanır). Büste tıklanınca Biggie büstün önüne gelir (kök, klibin raf_nokta'sı büstün tabanına
  // otursun diye: rafın önünden raf_on_mm geride, yüzü rafa) ve bust_al_alt / bust_al_orta ile alır: 'al' karesine dek
  // büst rafta, sonra klibin bust.yol'unda (karakter yereli, taban merkezi; dönmez), klip bitince sağ elin soketinde
  // (bust.kemik el.R, el_yerel / el_yerel_q; büstün o anki açısı sokete göre korunur: kendi ekseninde dönmez). Üst gövde
  // katmanı bust_tut (yürürken bust_tut_yuru) ile armut tarafına yürür, orada bekler; kamera elden yakın plan, kartta büstün
  // bilgisi ('oda-bust' → core/cati-panel.js). "Geri": rafın önüne döner, bust_birak_* ile koyar (yol'da; raftan geçmez:
  // Blender ölçüsü + sunum-test denetimi). Parmaklar büstün ağının dışında (core/oda-ik.js parmak: klibin pozundan göreli)
  const bust = { aktif: null };
  const bustOlay = (eser) => dispatchEvent(new CustomEvent('oda-bust', { detail: { eser: eser ?? null } }));
  // Büstün yüksekliğine en yakın raf_mm'li klip (bust_al_alt 725, bust_al_orta 1105)
  const bustKlibi = (z, tur) => ['alt', 'orta'].map((k) => `bust_${tur}_${k}`).filter((k) => karakter?.klipVar?.(k))
    .sort((a, b) => Math.abs((karakter.meta(a)?.raf_mm ?? 0) - z) - Math.abs((karakter.meta(b)?.raf_mm ?? 0) - z))[0] ?? null;
  function bustAl(obj) {
    const D0 = durakBul('kitaplik'), eser = obj?.userData?.parca?.eser;
    if (!D0 || !obj || !eser) return;
    if (bust.aktif?.obj === obj) return;
    if (bust.aktif) { bustBirakHemen(); }
    const kb = new THREE.Box3().setFromObject(obj), taban = V().set((kb.min.x + kb.max.x) / 2, (kb.min.y + kb.max.y) / 2, kb.min.z);
    const klip = aktif && karakter ? bustKlibi(taban.z, 'al') : null, birak = klip ? bustKlibi(taban.z, 'birak') : null;
    if (!klip || !birak || !karakter.klipVar('bust_tut')) { bust.aktif = { obj, eser, yok: true, durum: 'elde' }; bustOlay(eser); logla('bust-panel', { eser: eser.id }); return; }
    // Kök: yüzü rafa (ψ −90°: ileri −x dünya, yerel +x (sol) = −y dünya); yerel (v0, v1) → dünya (+v1, −v0)
    const rn = karakter.meta(klip).bust?.raf_nokta ?? [-15, -380, taban.z];
    const yer = [taban.x - rn[1], taban.y + rn[0]];
    const B = bust.aktif = { obj, ust: obj.parent, p: obj.position.clone(), q: obj.quaternion.clone(), q0w: obj.getWorldQuaternion(new THREE.Quaternion()),
      yari: (kb.max.z - kb.min.z) / 2, tabanZ: kb.min.z, klip, birak, eser, durum: 'aliyor', yer, w: 0 };
    logla('bust-sec', { eser: eser.id, klip });
    const D = {
      ...D0, yer, yon: -90, dizi: [{ klip, sure: 3, anlar: [
        [{ meta: 'al', kesir: 0.3 }, () => { if (bust.aktif === B) { story.scene.attach(obj); karakter.kay?.(BUST_GERI, 0, reduce ? 0.01 : 0.3); logla('bust-al', { eser: eser.id, klip }); } }],
        [{ meta: 'tutuldu', kesir: 0.75 }, () => { if (bust.aktif === B) B.durum = 'tutuldu'; }],
      ] }],
      tut: { klip: null },
      iptal: () => { if (bust.aktif === B) { elYakin(false); karakter.ustKatman?.(null); bustRafa(B, 0.4); bustOlay(null); } },
    };
    sonIstek = null;
    biggieGitsin(D);
    kameraUc(KITAP_ALIS, 1.2);
  }
  // v8.3 (kullanıcı: x-ray deliği yok, "göremiyorsak sorun kamerada"): alış ve koyuş kitaplığın önündeki yandan; Biggie
  // (kök y ≈ 205) bakış çizgisinin ~400 mm sağında, büst (x −1805) ve rafı ile birlikte görünür
  const KITAP_ALIS = { pos: [-1150, -950, 1550], target: [-1650, 320, 1000] };
  // v8.2 (kullanıcı): büst elindeyken Biggie odanın armut tarafına yürür ve orada bekler (masaya, sandalyeye girmeden:
  // yol bulma; sunum-test gövde sütunu denetimi)
  // armudun sağ önü, yüzü kameraya (genel plan) dönük. v8.3: sandalye odada kalınca (−700, 360) yatık sırtından uzak
  const BUST_BEKLE = { x: -600, y: -380, psi: 0.55 };
  // Klibin yolu büstü rafın önünden ancak ~30 mm çıkarıp öyle indiriyor (Blender'ın rafı bizim gözün tahtalarından sığ):
  // Biggie alırken 'al' karesinde 115 mm geri adım kayar, bırakırken o kadar geriden gelip büst gözünün yüksekliğine
  // çıkınca (bırak klibinin 47. karesi) öne kayar. Büst rafın önünü geçmeden tahtanın hizasında inip kalkmaz
  const BUST_GERI = 160, BIRAK_KAY = 46 / 30; // v8.3: 160 (v8.3 soketinde büst 50° dönük, göğüs hizasında rafın önüne taşıyordu)
  function bustTutuyor() {
    const B = bust.aktif;
    if (!B || B.yok || (B.durum !== 'tutuldu' && B.durum !== 'aliyor') || !karakter?.komut) return;
    B.durum = 'yuruyor';
    karakter.ustKatman('bust_tut');
    logla('bust-yuru', { eser: B.eser.id });
    karakter.komut([{ yuru: BUST_BEKLE, son: 'dur' }]).then((ok) => {
      if (bust.aktif !== B || !ok) return;
      B.durum = 'elde';
      bustOlay(B.eser);
      setTimeout(() => { if (bust.aktif === B && B.durum === 'elde') elYakin(true, B.obj); }, reduce ? 0 : 450);
      logla('bust-elde', { eser: B.eser.id });
    });
  }
  // Büst yerine: alış yerine yürür (yüzü rafa; katman sürer), bust_birak_* (başı bust_tut pozu) yol'uyla rafa koyar
  function bustGeri() {
    const B = bust.aktif;
    if (!B) return;
    bustOlay(null);
    if (B.yok) { bust.aktif = null; return; }
    if (['elde', 'yuruyor'].includes(B.durum) && karakter?.tutuyor) yakinDonus = KITAP_ALIS;
    elYakin(false);
    if (!['elde', 'yuruyor'].includes(B.durum) || !karakter?.tutuyor) { // daha almadan: durağa yeniden gönder, iptal yerine koyar
      biggieGitsin(durakBul('kitaplik'));
      return;
    }
    B.durum = 'donuyor';
    yakinDonus = KITAP_ALIS; // yakın plandan kitaplığın yanındaki koyuş kadrajına
    logla('bust-geri', { eser: B.eser.id });
    karakter.komut([{ yuru: { x: B.yer[0] + BUST_GERI, y: B.yer[1], psi: -Math.PI / 2 }, son: 'dur' }]).then((ok) => {
      if (!ok || bust.aktif !== B) return;
      B.durum = 'koyuyor';
      karakter.ustKatman(null);
      karakter.komut([{ klip: B.birak, sure: 3, anlar: [
        [{ kesir: BIRAK_KAY / 2.7 }, () => karakter.kay?.(-BUST_GERI, 0, reduce ? 0.01 : 0.25)],
        [{ meta: 'koy', kesir: 0.7 }, () => logla('bust-birak', { eser: B.eser.id })],
      ] }], { son: true }).then((ok2) => {
        if (bust.aktif === B) bustRafa(B, ok2 ? 0.15 : 0.3);
        if (story.focusedId === 'kitaplik' && !bust.aktif) kameraUc(story.shotOf('kitaplik'), 1);
      });
    });
  }
  // Büst rafındaki yerine (klibin yolu orada biter; kesildiyse ya da kök birkaç mm kaydıysa kısa kayma). Rafın dışındaysa
  // önce gözün önüne (tabanı tahtanın 15 mm üstünde), sonra yatay içeri, sonra iner
  function bustRafa(B, sn) {
    if (bust.aktif === B) bust.aktif = null;
    const ust = B.ust, raf = ust.localToWorld(B.p.clone()), simdi = B.obj.getWorldPosition(V()), onX = -1705;
    const kb = new THREE.Box3().setFromObject(B.obj), yari = (kb.max.x - kb.min.x) / 2;
    const ara = kb.min.x < onX ? [V().set(raf.x, raf.y, Math.max(simdi.z, raf.z + 2))] : [V().set(onX + yari + 60, raf.y, raf.z + 15), V().set(raf.x, raf.y, raf.z + 15)];
    yolla(B.obj, ust, [...ara, raf].map((w) => ust.worldToLocal(w)), B.q, reduce ? 0.01 : sn * 1.6);
  }
  function bustBirakHemen() {
    const B = bust.aktif;
    if (!B) return;
    bust.aktif = null;
    bustOlay(null);
    if (!B.yok) { elYakin(false); karakter?.ustKatman?.(null); bustRafa(B, 0.3); }
  }
  // Her karede klip karıştırıldıktan sonra (karakter.kareSonu): büstün yeri klipten. Kip: 'raf' (al karesinden önce),
  // 'yol' (al / bırak kliplerinde, karakter yereli), 'soket' (elde). Kip değişince 0,25 sn'de geçer (yol sonu ile soket
  // arası ≤ hata_mm)
  const bq = new THREE.Quaternion(), bq2 = new THREE.Quaternion(), bv2 = new THREE.Vector3(), bv3 = new THREE.Vector3();
  const yolNokta = (yol, f) => {
    if (!Array.isArray(yol) || !yol.length) return null;
    let i = 0;
    while (i < yol.length - 1 && yol[i + 1][0] <= f) i++;
    const [f0, a] = yol[i], [f1, b] = yol[Math.min(i + 1, yol.length - 1)], u = f1 > f0 ? Math.min(1, Math.max(0, (f - f0) / (f1 - f0))) : 0;
    return a.map((x, k) => x + (b[k] - x) * u);
  };
  let tutus = null;
  function bustKaresi(dt) {
    const B = bust.aktif;
    if (!B || B.yok || B.obj.parent !== story.scene) return;
    const kz = karakter.klipZamani(), m = kz ? karakter.meta(kz.ad) : null;
    let kip = 'soket', f = 0;
    if (kz && (kz.ad === B.klip || kz.ad === B.birak) && kz.agirlik > 0.5) { kip = 'yol'; f = kz.kare; }
    if (kz?.ad === B.klip && f < (m?.al ?? 26)) kip = 'raf';
    if (kip === 'raf') return;
    const sk = karakter.meta('bust_tut')?.bust ?? {}, el = karakter.kemik('elR') ?? karakter.elKemigi;
    karakter.elNoktasi(bv2); // dünya matrisleri bu kareye
    let p = null, q = null;
    // v8.3: soketin dönüşü büstün yönünü de içerir (bust.yaw_derece 50: yüzü kameraya yarı dönük); büstün kabı Blender'ın
    // modeliyle aynı düzende (ön yüz yerel −y, z büstün ekseni). Rafta yüzü Biggie'ye; alırken dönüşü klibin eli verir
    const ey = sk.el_yerel ?? [0, 0, 0], eq = sk.el_yerel_q ?? [0, 0, 0, 1];
    const qs = el ? bq.set(eq[0], eq[1], eq[2], eq[3]).premultiply(el.getWorldQuaternion(bq2)) : null;
    if (kip === 'soket' && el) {
      q = qs;
      p = el.localToWorld(bv3.set(ey[0] / 1000, ey[1] / 1000, ey[2] / 1000));
    } else if (kip === 'yol') {
      const n = yolNokta(m?.bust?.yol, f);
      if (n) { const w = karakter.yerelDunya(n); p = bv3.set(w[0], w[1], n[2]); }
      if (!qs) q = B.q0w;
      else if (kz.ad === B.klip) {
        // Raftaki açıdan (±10°) sokete: büst gözün içindeyken (45. kareye dek) dik (yalnız soketin yatay açısı; eğilip
        // tahtaya değmesin), sonra soketin tam dönüşüne
        const on = V().set(0, -1, 0).applyQuaternion(qs).setZ(0), dik = new THREE.Quaternion().setFromAxisAngle(V().set(0, 0, 1), Math.atan2(-on.x, on.y) + Math.PI);
        q = B.q0w.clone().slerp(dik, THREE.MathUtils.clamp((f - (m?.al ?? 26)) / 6, 0, 1)).slerp(qs, THREE.MathUtils.clamp((f - 45) / 8, 0, 1));
      }
      else { // bırakırken: tek el karesinden 'koy'a dek elin açısından raftaki açısına (koyarken dik ve rafa dönük)
        const t0 = m?.tek_el ?? 31, t1 = Math.min(m?.koy ?? 57, 45); // gözün içine girmeden (47. kare) dik
        q = qs.clone().slerp(B.q0w, THREE.MathUtils.clamp((f - t0) / Math.max(1, t1 - t0), 0, 1));
      }
    }
    if (!p) return;
    // taban merkezi → kabın orijini (büstün ortası: kabın yerel z'sinde yarı boy yukarı)
    // İtme (büstün yerelinde, yatay): parmak seçimi bir eklemi büstün dışına çıkaramadıysa (sol başparmak klipte ~10 mm
    // içeride) büst o noktadan uzağa birkaç mm kayar (sağ avuç tabanın altında kalır); en çok 30 mm
    B.itme ??= new THREE.Vector3();
    const hedef = p.clone().add(V().set(B.itme.x, B.itme.y, B.yari).applyQuaternion(q));
    if (B.kip !== kip) { B.kip = kip; B.gec = 0; B.p0 = B.obj.position.clone(); B.q0 = B.obj.quaternion.clone(); }
    B.gec = Math.min(1, B.gec + dt / (reduce ? 0.01 : 0.25));
    const u = B.gec * B.gec * (3 - 2 * B.gec);
    B.obj.position.lerpVectors(B.p0, hedef, u);
    B.obj.quaternion.slerpQuaternions(B.q0, q, u);
    B.obj.updateMatrixWorld(true);
    if (kip === 'yol') rafKilavuzu(B); // elde (soket) göğüs hizasında: göze sıkıştırma yalnız al/bırak yolunda
    B.w = kip === 'soket' ? u : 0;
    // Parmaklar büstün ağının dışında (yalnız elde; kolları ve elleri klip yazar)
    if (kip === 'soket') {
      const karKok = story.scene.getObjectByName('karakter');
      tutus ??= bustTutusu({ getObjectByName: (ad) => karakter.kemik(ad), traverse: (fn) => karKok?.traverse(fn), updateMatrixWorld: () => karakter.elNoktasi(bv2) });
      if (!B.ikBasladi) { tutus.sifirla(); B.ikBasladi = true; }
      B.ik = tutus.parmak(B.obj, u);
      B.sayac = (B.sayac ?? 0) + 1;
      if (u > 0.98 && !(B.sayac % (B.temiz ? 30 : 8)) && B.itme.length() < 30) {
        const ic = (tutus.icindeAd?.()?.[0] ?? []).flat();
        B.temiz = !ic.length;
        if (ic.length) {
          const d = ic.reduce((t, [, x, y]) => t.add(V().set(x, y, 0)), V()).normalize().multiplyScalar(-4);
          B.itme.add(d);
        }
      }
    }
  }
  // v8.2 (Blender fare klibi): fare klibi oynarken fare masada klibin yolu kadar kayar (fare.yol − fare.merkez_mm, karakter
  // yereli; yükseklik ve açı yerinde); klip bitince evine döner
  // Oturunca farenin evi klibin merkezine (fare.merkez_mm; el oraya uzanır): mat geniş, fare onun üstünde kalır
  function fareEvi() {
    const g = story?.scene?.getObjectByName('fare_grubu'), mc = karakter?.meta?.('fare')?.fare?.merkez_mm;
    if (!g?.userData.ev || !mc || g.userData.evKlip) return;
    const w = karakter.yerelDunya([mc[0], mc[1], 0]);
    g.userData.ev.set(Math.min(w[0], -620), w[1], g.userData.ev.z); // mat x −560'ta biter: fare onun üstünde kalsın
    g.position.copy(g.userData.ev);
    // v8.3: fare klipteki gibi Biggie'nin bakışına göre fare.yaw_derece (−14°) dönük (karakterin yereli ile dünya aynı açıyla döner)
    const yaw = karakter.meta('fare')?.fare?.yaw_derece;
    if (typeof yaw === 'number') g.rotation.z = (yaw * Math.PI) / 180;
    g.userData.evKlip = true;
  }
  function fareKaresi() {
    const kz = karakter?.klipZamani?.(), g = story?.scene?.getObjectByName('fare_grubu');
    if (!g?.userData.ev) return;
    const m = kz?.ad === 'fare' && kz.agirlik > 0.5 ? karakter.meta('fare')?.fare : null, n = m ? yolNokta(m.yol, kz.kare) : null, mc = m?.merkez_mm;
    if (!n || !mc) { if (g.userData.kaydi) { g.position.copy(g.userData.ev); g.userData.kaydi = false; } return; }
    const a = karakter.yerelDunya([n[0], n[1], 0]), b = karakter.yerelDunya([mc[0], mc[1], 0]);
    g.position.set(g.userData.ev.x + a[0] - b[0], g.userData.ev.y + a[1] - b[1], g.userData.ev.z);
    g.userData.kaydi = true;
  }
  // Raf kılavuzu (v8.2, kullanıcı: büst rafın içinden geçmesin): büstün kutusu kitaplığın önünden içerideyken (x < raf
  // önü) gözünün iç yüksekliğine sıkıştırılır (tabanı gözün tahtasının, tepesi üst tahtanın 2 mm içinde); klip eli rafın
  // içinde yukarı-aşağı oynatsa da büst tahtaya girmez
  const RAF_GOZ = [700, 1080, 1460, 1840, 2325], RAF_T = 25, kb3 = new THREE.Box3();
  function rafKilavuzu(B) {
    const onX = -1705; // kitaplığın ön yüzü (core/oda-portfolyo.js: DUVAR_SOL + derinlik)
    kb3.setFromObject(B.obj);
    if (kb3.min.x >= onX - 1) return;
    const i = RAF_GOZ.findIndex((z) => Math.abs(z + RAF_T - B.tabanZ) < 30);
    if (i < 0) return;
    const alt = RAF_GOZ[i] + RAF_T + 2, ust = (RAF_GOZ[i + 1] ?? 9e9) - 2;
    const dz = Math.max(0, alt - kb3.min.z) + Math.min(0, ust - kb3.max.z);
    if (Math.abs(dz) < 0.01) return;
    const w = B.obj.getWorldPosition(new THREE.Vector3());
    w.z += dz;
    B.obj.position.copy(B.obj.parent.worldToLocal(w));
    B.obj.updateMatrixWorld(true);
  }
  // Noktalar: kitaplık durağındayken (kart açık, elde büst yok) her büstün tepesinin biraz üstünde
  const noktaKat = root.querySelector('.oda-bust-noktalar');
  const noktalar = new Map(); // büst → düğme
  const nv = new THREE.Vector3(), nb = new THREE.Box3();
  function noktaKaresi() {
    if (!noktaKat || !story) return;
    const goster = story.focusedId === 'kitaplik' && !bust.aktif && !durakTw && !yakinAktif;
    const bustler = goster ? (story.api?.portfolyo?.parcalar?.()?.eser ?? []).filter((o) => o.userData.parca?.bust) : [];
    noktaKat.hidden = !bustler.length;
    if (!bustler.length) return;
    const rc = story.renderer.domElement.getBoundingClientRect(), hr = root.getBoundingClientRect();
    for (const o of bustler) {
      let b = noktalar.get(o);
      if (!b) {
        const e = o.userData.parca.eser;
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'oda-bust-nokta';
        b.setAttribute('aria-label', e.ad?.[lang] ?? e.ad?.tr ?? e.id);
        b.title = b.getAttribute('aria-label');
        b.addEventListener('click', (ev) => { ev.stopPropagation(); bustAl(o); });
        noktaKat.appendChild(b);
        noktalar.set(o, b);
      }
      nb.setFromObject(o);
      nv.set((nb.min.x + nb.max.x) / 2, (nb.min.y + nb.max.y) / 2, nb.max.z + 45).project(story.camera);
      const gor = nv.z < 1 && Math.abs(nv.x) < 0.98 && Math.abs(nv.y) < 0.98;
      b.hidden = !gor;
      if (gor) b.style.transform = `translate(${((nv.x * 0.5 + 0.5) * rc.width + rc.left - hr.left).toFixed(1)}px, ${((-nv.y * 0.5 + 0.5) * rc.height + rc.top - hr.top).toFixed(1)}px)`;
    }
  }
  gsap.ticker.add(noktaKaresi);
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
  // Tıklanan küçük eşya (portfolyo parçaları): { kutu } | { bust } | null. v8: yalnız o durağın kadrajındayken (genel
  // planda işaretçilerden başka tıklanan şey yok): kutu oyunları rafında kutular, kitaplıkta büstler (vazo, kitap dekor)
  const parcaRay = new THREE.Raycaster();
  function parcaBul(x, y) {
    const pp = story?.api?.portfolyo?.parcalar?.();
    if (!pp) return null;
    const odak = story.focusedId;
    const hedef = [...(odak === 'oyunlar' || KS.aktif ? pp.oyun : []), ...(odak === 'kitaplik' ? pp.eser.filter((o) => o.userData.parca?.bust) : [])];
    if (!hedef.length) return null;
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    parcaRay.setFromCamera(new THREE.Vector2(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1), story.camera);
    const h = parcaRay.intersectObjects(hedef, true)[0];
    if (!h) return null;
    let o = h.object;
    while (o && !o.userData.parca) o = o.parent;
    if (!o) return null;
    if (o.userData.parca.tur === 'oyun') return { kutu: o };
    return new THREE.Box3().setFromObject(o).getCenter(V()).z > ELIN_UST ? null : { bust: o };
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
  // v8: armut ve TV aynı oturuş (BIGGIE_DURAK capa). Armut (Hakkımda): armut_yat sonuna dek (gözler 'gozler_kapali'
  // karesinde kapanır), sonra armut_uyukla döngüsü (gözler kapalı, başı düşer); 'oturdu' karesinde kamera armuda. TV
  // (D.izle): armut_yat 'eller_ensede' karesinin 10 kare sonrasına dek (gözler açık, eller ensede), orada durur
  // (tut.bolum: poz sabit); 'bas' karesinde TV açılır, kamera TV'nin kadrajında kalır (Süreç)
  function oturusDurak(D) {
    const m = karakter?.meta?.('armut_yat') ?? {};
    const tvAc = () => { story?.api?.portfolyo?.ekran?.ileri?.(); logla('tv-ac'); };
    const temel = { ...D, klip: 'armut_yat', capa: { ...D.capa, klip: 'armut_yat' }, iptal: () => { armutta = false; } };
    if (D.izle) {
      const dur = (m.eller_ensede ?? 96) + 10;
      return { ...temel, tut: { klip: null, bolum: [dur, dur + 0.5] }, dizi: [{ klip: 'armut_yat', sure: 5, kadar: dur, anlar: [[{ meta: 'bas', kesir: 0.3 }, tvAc]] }] };
    }
    return { ...temel, tut: { klip: 'armut_uyukla' }, dizi: [{ klip: 'armut_yat', sure: 5, anlar: [
      [{ meta: 'oturdu', kesir: 0.26 }, () => armutKamera(true)],
      [{ meta: 'gozler_kapali', kesir: 0.9 }, () => logla('gozler-kapali')],
    ] }] };
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
    if (story.focusedId !== 'armut') return; // v8: yalnız armut durağında (TV'de kamera ekranda kalır)
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
    // v8: kadrajın konusu armut + üstünde yatan Biggie (ayakları armudun ~0,9 m önüne uzanır); kamera önden ve odanın
    // ortasından (−y), uyuyan yüz görünsün
    kutu.expandByPoint(V().set(A.x + on[0] * 950, A.y + on[1] * 950, 250));
    const o = { haric: new Set([a]), govde: false, tercih: [on[0] + 0.35, on[1] - 0.6, 0] };
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
  const durakBul = (id) => DURAK.find((D) => D.id === id || D.yuva === id) ?? null;
  // Aynı durağa yeniden gelinirse (Geri'den sonra yeniden tıklama) Biggie eylemi bitmediyse (uyuklama, oturuş) yeniden
  // başlamaz; bittiyse yeniden oynar
  let sonIstek = null, sonBitti = false;
  function istasyon(id) {
    const D = durakBul(id);
    if (!D) return;
    if (sonIstek === D.id && aktif && !sonBitti) return;
    // v7: kutu oyunları rafına gelinince Biggie kutu almaz, rafın yanında bekler (kutuya tıklanınca kutuSec). Kutu açıkken
    // rafa yeniden gelinirse Biggie diz pozunda kalır
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
    if (D.id !== 'cop') ziyaret.add(D.id);
    logla('durak', { id: D.id, biggie: aktif, dizi: D.dizi ? D.dizi.map((a) => a.klip) : undefined });
    // v8: masada ya da armutta oturuyorsa karakter önce kalkar (oda-karakter durakGorevi → yereIn / eylemKapat)
    if (aktif && karakter) karakter.durakaGit(D.oturus && !D.dizi ? oturusDurak(D) : D);
  }
  // ---- v8: durak seçimi ve "Geri" (oda/index.html onActivate → sec) ----
  let aktifDurak = null;
  function sec(id) {
    if (!story) return false;
    if (id === null) { geri(); return true; }
    if (!story.hotspots?.some((h) => h.id === id)) return false;
    if (id === aktifDurak && story.focusedId === id) { // aynı durağa yeniden tıklama
      if (id === 'ekran') story.api?.portfolyo?.ekran?.ileri?.(); // ekran: sıradaki süreç adımı
      return true;
    }
    if (bust.aktif) bustBirakHemen();
    aktifDurak = id;
    if (!story.driven) story.drive(true);
    story.focusTo(id); // kart (uçuşsuz)
    root.classList.add('sunum-durakta');
    kameraUc(story.shotOf(id), AYAR.durakUcus);
    logla('sec', { id });
    monitorGuncelle();
    istasyon(id);
    return true;
  }
  // Geri: eldeki büst ya da açık kutu önce yerine (durakta kalınır); yoksa genel plan (Biggie olduğu yerde kalır)
  function geri() {
    if (!story) return;
    if (bust.aktif) { bustGeri(); logla('geri', { bust: true }); return; }
    if (KS.aktif) { kutuGeri(); logla('geri', { kutu: true }); return; } // açık kutu: rafa (kamera rafta kalır)
    if (kutuP?.acik) kutuP.kapat();
    aktifDurak = null;
    if (yakinAktif) { yakinAktif = false; yakinTw?.kill(); karakter?.xrayKilit?.(false); }
    story.blur();
    root.classList.remove('sunum-durakta');
    if (!story.driven) story.drive(true);
    kameraUc(story.shotOf(null), AYAR.durakUcus);
    logla('geri', { bust: false });
    monitorGuncelle();
  }
  // Masadaki monitör (v8): masa durağı açıkken ya da Biggie masada otururken masa-ekran.mp4 oynar, yoksa durur
  let masada = false;
  function monitorGuncelle() {
    if (!monitor) return;
    const ac = aktifDurak === 'masa' || masada;
    if (ac && !monitor.oynuyor) { const t = monitor.basla(); if (t) logla('monitor-basla', { tasarim: t }); }
    else if (!ac && monitor.oynuyor) { monitor.dur(); logla('monitor-dur'); }
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
  let durakTw = null, kaydirIpucu = null;

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
      // Durağın eşyalarına tıklama (kutu, büst): sürüklemeyle karışmasın; altı durağın kendisi motorun (story.hit → onActivate)
      const host = s.renderer?.domElement?.parentElement;
      let asagi = null;
      host?.addEventListener('pointerdown', (e) => { asagi = [e.clientX, e.clientY]; });
      // v8.3: buzdolabına tıklama yakalama evresinde (Biggie önünde dururken karakterin tıklama tepkisi olayı
      // durduruyordu); nokta Biggie'nin deri ağının üstündeyse karakterin tepkisi kalır
      let buzAsagi = null;
      host?.addEventListener('pointerdown', (e) => { buzAsagi = [e.clientX, e.clientY]; }, true);
      host?.addEventListener('pointerup', (e) => {
        if (!buzAsagi || Math.hypot(e.clientX - buzAsagi[0], e.clientY - buzAsagi[1]) > 8) return;
        buzAsagi = null;
        if (parcaBul(e.clientX, e.clientY) || !buzdolabiVurur(e.clientX, e.clientY)) return;
        const o = story.api?.nesne?.('buzdolabi');
        if (o && karakterOnde(e.clientX, e.clientY, o)) return;
        buzdolabinaGit();
      }, true);
      monitor = odaMonitoru(s.scene, { reduce });
      // v8b: dikey ekranda genel plan odanın ortasına bakar; parmakla yana kaydırınca kamera yerinde sağa sola döner
      // (story look.yaw; sınırlar oda-yerler PORTRE_BAKIS: armut ve TV kadraja girer). Kapalı odada her yön odanın içi
      const bak = s.debug?.look;
      if (bak && s.camera.aspect < 0.9) Object.assign(bak, YERLER.PORTRE_BAKIS ?? {});
      let panB = null;
      host?.addEventListener('pointerdown', (e) => { panB = e.pointerType === 'touch' && bak && s.camera.aspect < 0.9 && !s.focusedId ? { x: e.clientX, yaw: bak.yaw } : null; });
      host?.addEventListener('pointermove', (e) => {
        if (!panB || e.pointerType !== 'touch' || s.focusedId) return;
        const w = host.clientWidth || 390;
        bak.yaw = THREE.MathUtils.clamp(panB.yaw + ((e.clientX - panB.x) / w) * 1.3, bak.min, bak.max);
        if (Math.abs(e.clientX - panB.x) > 12) kaydirIpucu?.classList.add('gizli');
      });
      host?.addEventListener('pointerup', () => { panB = null; });
      host?.addEventListener('pointercancel', () => { panB = null; });
      kaydirIpucu = s.camera.aspect < 0.9 && !reduce ? (() => { const el = document.createElement('p'); el.className = 'oda-kaydir'; el.textContent = t('oda.kaydir'); root.appendChild(el); return el; })() : null;
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
        // Küçük eşya (yalnız o durağın kadrajında: rafın kutusu, kitaplığın büstü): Biggie o eşyaya
        const P = parcaBul(e.clientX, e.clientY);
        if (P) {
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
          } else bustAl(P.bust);
          return;
        }
        if (e.pointerType === 'touch') kutuP?.ipucu(null);
      });
    },
    karakter(k) {
      karakter = k;
      karDurum = k ? 'var' : 'yok';
      if (!k) { if (giris === 'dans' && hazirOldu) isimGoster(); return; }
      k.dinle(olay);
      k.xrayHaric?.(['armut', 'masa', 'buzdolabi', 'ekran', 'oyunlar']); // v8: bu duraklarda konu Biggie'nin kendisi
      k.kareSonu?.((dt) => { bustKaresi(dt); fareKaresi(); }); // v8.1: büst tutuşu (IK); v8.2: fare elde
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
    // v8: açılış bitince (oda/index.html baslat) kamera sayfanın, genel plana oturur
    basla() {
      if (!story) return;
      if (!story.driven) story.drive(true);
      const v = story.view(), g = story.shotOf(null);
      if (Math.hypot(...v.pos.map((x, i) => x - g.pos[i])) > 30) kameraUc(g, reduce ? 0.01 : 1.2);
      logla('basla');
    },
    // v8: durak seçimi (işaretçi, eşyanın kendisi, klavye şeridi; id null: Geri / Esc). Döner: işlendi mi
    sec,
    get aktifDurak() { return aktifDurak; },
    // Test (v8.1): büst elde iken büstün ağının İÇİNDE kalan parmak eklemi / ucu sayısı [sağ el, sol el]
    bustParmakIcinde: () => tutus?.icindeSay?.() ?? null,
    bustParmakAd: () => tutus?.icindeAd?.() ?? null,
    get tutus() { return tutus; },
    get bust() { const B = bust.aktif; return B ? { ad: B.eser.id, durum: B.durum, aci: +(B.aci ?? 0).toFixed(2), elde: B.kip === 'soket' && (B.w ?? 0) > 0.5, kip: B.kip ?? null, w: +(B.w ?? 0).toFixed(2), ik: B.ik ?? null, tamam: tutus?.tamam ?? null } : null; },
    // Test ve demo: durağa doğrudan (işaretçi tıklanmış gibi; sonIstek sıfırlanır: aynı durak yeniden de sunulur)
    git(id) {
      if (!durakBul(id) || !story) return false;
      sonIstek = null;
      if (id === aktifDurak) aktifDurak = null;
      if (id === 'cop') { biggieGitsin(durakBul(id)); return true; }
      if (id === 'buzdolabi') return buzdolabinaGit(); // v8.3: durak değil (genel plandan)
      return sec(id);
    },
    geri,
    kes,
    buzdolabiVurur, // test: ekrandaki nokta buzdolabına mı (v8.3)
    // Test ve demo: rafın i. kutusu ya da kitaplığın i. büstü (v8) tıklanmış gibi
    parca(tur, i = 0) {
      const pp = story?.api?.portfolyo?.parcalar?.();
      if (!pp) return false;
      if (tur === 'kutu' && pp.oyun[i]) { kutuSec(pp.oyun[i]); return true; }
      if (tur === 'bust') { const b = pp.eser.filter((o) => o.userData.parca?.bust)[i]; if (b) { bustAl(b); return true; } }
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
