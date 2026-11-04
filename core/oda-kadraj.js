// Oda kadraj hesabı (2026-11-04 v7; kullanıcı kuralı "kamera odada duran bir insanın gözü"). v6'da kamera ön kesitin
// gerisine, yerden 260 mm'ye ya da tavana yakın inebiliyordu; kadrajın kenarında odanın dışı (ön kesit, boşluk) görünüyordu.
// v7 kuralları (bütün etkileşim kadrajları):
//  1. Kamera odanın içinde, bir insanın durup bakabileceği yerde: göz yüksekliği GOZ (1400–1700 mm), duvarlardan
//     DUVAR_PAY içeride, mobilya hacminin içinde ya da üstünde değil (kameranın altındaki sütun da boş: masanın, rafın
//     üstünde durulmaz).
//  2. Kadrajda odanın dışı 0: görüş piramidinden atılan her ışın odanın kutusundan bir duvardan, zeminden ya da tavandan
//     çıkar; ön kesitten (y = ROOM.y0, açık) çıkan ışın "oda dışı piksel"dir (disariOrani). Arka duvarın penceresi ve
//     balkon kapısı odanın parçası (oradan görünen balkon ve sokak sahnenin kendisi).
//  3. Odak ortada ve görünür: hedef nesnenin merkezi; kamera ile nesne arasında (merkez + 8 köşe) mobilya, duvar,
//     karakter gövdesi ya da planlanan gövde silindiri yok.
//  4. Görüş açısı sabit (motor ekran oranına göre verir, kadraj değiştirmez): yaklaşma kameranın yeriyle. Nesnenin
//     doluluğu (`doluluk`) uzaklıkla kurulur; oda sınırı izin vermezse en uzak yerden (doluluk büyür, kesilmez).
// Ölçüm: olcum() verilen kadrajda oda dışı piksel oranı, göz yüksekliği, odak nesnesinin karakter (gerçek deri ağı)
// ve mobilya tarafından örtülme oranı, nesnenin ekrandaki merkezi.
// disari(): her karede son güvenlik (core/story.js applyCamera → built.kameraDuzelt): kamera bir mobilya hacminin içine
// düşerse en kısa eksenden dışarı itilir; odanın içindeyken duvarların içinde tutulur. Genel plan (ön kesitin dışı)
// dokunulmaz.
// Birim mm, Z yukarı.
import * as THREE from 'three';
import { OLCU } from './oda-olcu.js';

const { ROOM } = OLCU;
export const GOZ = [1400, 1700];     // mm: göz yüksekliği aralığı (kullanıcı kuralı)
const DUVAR_PAY = 160;               // mm: kamera duvarlardan bu kadar içeride (insanın başı duvara değmez)
// Kameranın durabileceği hacim
export const ODA_IC = { min: [ROOM.x0 + DUVAR_PAY, ROOM.y0 + DUVAR_PAY, GOZ[0]], max: [ROOM.x1 - DUVAR_PAY, ROOM.y1 - DUVAR_PAY, GOZ[1]] };
const HACIM_PAY = 45;                // mm: mobilya kutusunun çevresinde kameranın girmeyeceği pay
const GOVDE_R = 115;                 // mm: karakter kemiği ışına bu kadar yakınsa ışın gövdeye çarpmış sayılır
const GOVDE_ANA = /kafa|head|boyun|neck|topuz|kulak|ear|g[oö]ğ[uü]s|chest|spine|omurga|kal[cç]a|hips|omuz|all[iı]k|ağız|burun|b[iı]y[iı]k|^dil$|g[oö]z|ka[sş]_|yanak|[cç]ene/i;
const GOVDE_KADRAJ_R = 200;
const DISLA = /kilim|tavan|zemin|supurgelik|perde_|kornis|huzme|toz|^kasa$|pervaz|karsi_|sokak_|balkon|korkuluk|dis_duvar|duvar_/i;

const V = () => new THREE.Vector3();
function karakterde(o) { for (let x = o; x; x = x.parent) if (x.name === 'karakter') return true; return false; }
function altinda(o, set) { for (let x = o; x; x = x.parent) if (set.has(x)) return true; return false; }
function saydam(m) {
  for (const x of [m].flat()) {
    if (!x || x.visible === false) return true;
    if (x.blending === THREE.AdditiveBlending || (x.transparent && (x.opacity ?? 1) < 0.6) || (x.transparent && x.depthWrite === false)) return true;
  }
  return false;
}

// Odanın kutusundan (iç yüzler) çıkış: kameradan d yönünde ilk çarpılan yüz. 'on' (ön kesit, açık) dışarısıdır.
// Kamera odanın kutusunun dışındaysa her ışın dışarı sayılır (duvarların arkası görünür)
function cikisYuzu(p, d) {
  let t = Infinity, yuz = null;
  const dene = (tt, ad) => { if (tt > 1e-6 && tt < t) { t = tt; yuz = ad; } };
  if (d.x > 1e-9) dene((ROOM.x1 - p.x) / d.x, 'sag'); else if (d.x < -1e-9) dene((ROOM.x0 - p.x) / d.x, 'sol');
  if (d.y > 1e-9) dene((ROOM.y1 - p.y) / d.y, 'arka'); else if (d.y < -1e-9) dene((ROOM.y0 - p.y) / d.y, 'on');
  if (d.z > 1e-9) dene((ROOM.h - p.z) / d.z, 'tavan'); else if (d.z < -1e-9) dene((0 - p.z) / d.z, 'zemin');
  return yuz;
}
const odaKutusunda = (p) => p.x > ROOM.x0 && p.x < ROOM.x1 && p.y > ROOM.y0 && p.y < ROOM.y1 && p.z > 0 && p.z < ROOM.h;
const kc = new THREE.PerspectiveCamera(40, 1.6, 10, 1e5), ndcV = V(), dirV = V();
function kameraKur(cam, pos, target, fov, aspect) {
  cam.fov = fov; cam.aspect = aspect; cam.updateProjectionMatrix();
  cam.up.set(0, 0, 1); cam.position.copy(pos); cam.lookAt(target); cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  return cam;
}
// Görüş piramidindeki ışınların kaçı odanın dışına (ön kesitten) çıkıyor: 0..1. nx × ny ızgara (piksel merkezleri)
export function disariOrani(pos, target, fov, aspect, nx = 32, ny = 18) {
  const p = pos.isVector3 ? pos : V().fromArray(pos), t = target.isVector3 ? target : V().fromArray(target);
  if (!odaKutusunda(p)) return 1;
  kameraKur(kc, p, t, fov, aspect);
  let n = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    ndcV.set(((i + 0.5) / nx) * 2 - 1, ((j + 0.5) / ny) * 2 - 1, 0.5).unproject(kc);
    dirV.copy(ndcV).sub(p).normalize();
    if (cikisYuzu(p, dirV) === 'on') n++;
  }
  return n / (nx * ny);
}

// scene: oda sahnesi; kemikler(): karakterin gövde kemikleri; aglar(): karakterin deri ağları (ölçüm)
export function kadrajAraci(scene, { kemikler: kemikFn = () => [] } = {}) {
  let kemikFn2 = kemikFn, agFn = () => [];
  const kemikler = () => kemikFn2().filter((b) => !/^elma/.test(b.name));
  let hacim = null, engelAg = null, kapak = undefined;
  const ray = new THREE.Raycaster(), tmp = V(), tmp2 = V();

  function topla() {
    hacim = []; engelAg = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || karakterde(o)) return;
      let gizli = false;
      for (let x = o; x; x = x.parent) if (x.visible === false) { gizli = true; break; }
      if (gizli) return;
      const ad = o.name || o.parent?.name || '';
      if (DISLA.test(ad)) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      const sz = b.getSize(tmp);
      const vekil = o.material?.visible === false;
      if (!vekil && !saydam(o.material)) engelAg.push(o);
      if (Math.max(sz.x, sz.y, sz.z) > 2400 || Math.min(sz.x, sz.y, sz.z) < 15 || b.max.z < 200) return;
      if (/buzdolabi_kapak|kapak_/.test(ad)) return;
      hacim.push(b.expandByScalar(HACIM_PAY));
    });
    kapak = scene.getObjectByName('buzdolabi_kapak') ?? null;
  }
  const kapakKutu = new THREE.Box3();
  function hacimler() {
    if (!hacim) topla();
    if (kapak) { kapakKutu.setFromObject(kapak).expandByScalar(HACIM_PAY); return [...hacim, kapakKutu]; }
    return hacim;
  }
  const icinde = (p) => hacimler().find((b) => b.containsPoint(p)) ?? null;
  // İnsan orada durabilir mi: başı (kamera) ve gövdesinin sütunu (bel, diz hizası) mobilya hacminde değil
  const sutun = V();
  const durulur = (p) => !icinde(p) && [1100, 750, 300].every((z) => !icinde(sutun.set(p.x, p.y, Math.min(z, p.z))));

  function disari(p) {
    hacimler();
    let degisti = false;
    if (p.y > ROOM.y0) {
      const x = THREE.MathUtils.clamp(p.x, ROOM.x0 + 60, ROOM.x1 - 60), y = Math.min(p.y, ROOM.y1 - 60), z = THREE.MathUtils.clamp(p.z, 60, ROOM.h - 60);
      if (x !== p.x || y !== p.y || z !== p.z) { p.set(x, y, z); degisti = true; }
    }
    for (let n = 0; n < 3; n++) {
      const b = icinde(p);
      if (!b) break;
      const s = [[0, b.min.x - p.x], [0, b.max.x - p.x], [1, b.min.y - p.y], [1, b.max.y - p.y], [2, b.max.z - p.z]];
      s.sort((a, c) => Math.abs(a[1]) - Math.abs(c[1]));
      const [ek, d] = s[0];
      p.setComponent(ek, p.getComponent(ek) + d + Math.sign(d || 1) * 2);
      degisti = true;
    }
    return degisti;
  }

  const kose = Array.from({ length: 8 }, V);
  function olc(pos, target, kutu, fov, aspect) {
    const cam = kameraKur(kc, pos, target, fov, aspect);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, arkada = false;
    for (let i = 0; i < 8; i++) {
      kose[i].set(i & 1 ? kutu.max.x : kutu.min.x, i & 2 ? kutu.max.y : kutu.min.y, i & 4 ? kutu.max.z : kutu.min.z);
      const p = tmp2.copy(kose[i]).applyMatrix4(cam.matrixWorldInverse);
      if (p.z > -20) arkada = true;
      kose[i].project(cam);
      x0 = Math.min(x0, kose[i].x); x1 = Math.max(x1, kose[i].x); y0 = Math.min(y0, kose[i].y); y1 = Math.max(y1, kose[i].y);
    }
    return { dol: Math.max((x1 - x0) / 2, (y1 - y0) / 2), en: (x1 - x0) / 2, boy: (y1 - y0) / 2, kayma: Math.max(Math.abs(x0 + x1), Math.abs(y0 + y1)) / 2,
      orta: [(x0 + x1) / 2, (y0 + y1) / 2], kesik: arkada || x0 < -1 || x1 > 1 || y0 < -1 || y1 > 1 };
  }

  function engelli(pos, nokta, { haric, haricOrnek, govde, govdeHaric, sanal }) {
    const yon = tmp.copy(nokta).sub(pos), uz = yon.length();
    yon.divideScalar(uz);
    ray.set(pos, yon); ray.near = 0; ray.far = uz - 6;
    for (const o of engelAg) {
      if (haric && altinda(o, haric)) continue;
      const h = ray.intersectObject(o, false);
      for (const x of h) {
        if (haricOrnek && x.object === haricOrnek.ag && x.instanceId === haricOrnek.id) continue;
        return o.name || o.parent?.name || 'ağ';
      }
    }
    if (govde) {
      for (const b of kemikler()) {
        if (govdeHaric?.has(b)) continue;
        const p = b.getWorldPosition(tmp2), t = p.clone().sub(pos).dot(yon);
        if (t < 0 || t > uz - 30) continue;
        const r = /kafa|head|topuz|kulak/i.test(b.name) ? 210 : 130; // olcum ile aynı küreler
        if (ray.ray.distanceSqToPoint(p) < r * r) return `kemik:${b.name}`;
      }
    }
    for (const c of sanal ?? []) {
      for (let z = c.z0; z <= c.z1; z += 100) {
        const p = tmp2.set(c.x, c.y, z), t = p.clone().sub(pos).dot(yon);
        if (t < 0 || t > uz - 30) continue;
        if (ray.ray.distanceSqToPoint(p) < c.r * c.r) return 'govde';
      }
    }
    return null;
  }
  const gcam = new THREE.PerspectiveCamera(30, 1.6, 10, 1e5);
  function govdeGorunur(pos, hedef, D, fov, aspect, haric, sanal = null, kemik = true, sinirNdc = 0.8) {
    kameraKur(gcam, pos, hedef, fov, aspect);
    const nok = [];
    if (kemik) for (const b of kemikler()) if (!haric?.has(b)) nok.push([b.getWorldPosition(V()), GOVDE_KADRAJ_R]);
    for (const c of sanal ?? []) for (let z = c.z0; z <= c.z1; z += 150) nok.push([V().set(c.x, c.y, z), c.r]);
    for (const [p, r] of nok) {
      const uz = p.distanceTo(pos);
      if (uz > D + 150) continue;
      const pay = r / (Math.max(uz, 50) * Math.tan((fov * Math.PI) / 360));
      p.project(gcam);
      if (p.z < 1 && Math.abs(p.x) - pay / aspect < sinirNdc && Math.abs(p.y) - pay < sinirNdc) return true;
    }
    return false;
  }
  const icerde = (p, s = ODA_IC) => p.x >= s.min[0] && p.x <= s.max[0] && p.y >= s.min[1] && p.y <= s.max[1] && p.z >= s.min[2] - 0.5 && p.z <= s.max[2] + 0.5;
  // Merkezden yatay az yönünde oda içinde (ODA_IC) en çok kaç mm gidilir
  function enUzakYatay(o, az) {
    const dx = Math.cos(az), dy = Math.sin(az);
    let t = Infinity;
    if (Math.abs(dx) > 1e-9) t = Math.min(t, ((dx > 0 ? ODA_IC.max[0] : ODA_IC.min[0]) - o.x) / dx);
    if (Math.abs(dy) > 1e-9) t = Math.min(t, ((dy > 0 ? ODA_IC.max[1] : ODA_IC.min[1]) - o.y) / dy);
    return Math.max(0, t);
  }

  // kutu: THREE.Box3 (odak nesnesi); haric: Set<Object3D> (ışında sayılmaz); haricOrnek: { ag, id }; govde: karakterin
  // kemikleri engel mi; sanal: planlanan gövde silindirleri [{ x, y, z0, z1, r }]; tercih: [dx, dy, dz] hedeften kameraya
  // istenen yön (yalnız yatay bileşeni kullanılır: yükseklik göz kuralından); doluluk: 0..1; fov, aspect: kameranın
  // (değişmez); enAz: kameranın nesnenin merkezine en az yatay uzaklığı; govdeKadraj: karakter gövdesi kadrajın
  // ortasında olmasın (true: NDC ±0,8; sayı: o sınır); kaydir(pos, target) → { pos, target }: motorun kadraja uyguladığı
  // öteleme (yan kart, alttaki kart); bütün denetimler ötelenmiş son kadrajda yapılır, dönen pos/target ötelenmemiştir.
  // Eski seçenekler (yukseklik, sinir, hedefZ) yok sayılır: kamera her zaman göz yüksekliğinde ve odanın içinde.
  function bul({ kutu, haric = null, haricOrnek = null, govde = true, sanal = null, tercih = [0, -1, 0.45], doluluk = 0.58, fov = 40, aspect = 1.6, enAz = 450, govdeKadraj = false, kaydir = null, enCok = 24, arkasi = null, gorunsun = null, disariPay = true } = {}) {
    hacimler();
    const merkez = kutu.getCenter(V()), ks = kutu.getSize(V());
    const tAz = Math.atan2(tercih[1], tercih[0]), yatayTercih = Math.hypot(tercih[0], tercih[1]) > 1e-3;
    const govdeHaric = new Set();
    if (govde) { const genis = kutu.clone().expandByScalar(130); for (const b of kemikler()) if (!GOVDE_ANA.test(b.name) && genis.containsPoint(b.getWorldPosition(tmp))) govdeHaric.add(b); }
    const kucuk = kutu.clone();
    kucuk.expandByVector(ks.clone().multiplyScalar(-0.2));
    const noktalar = [merkez.clone()];
    for (let i = 0; i < 8; i++) noktalar.push(V().set(i & 1 ? kucuk.max.x : kucuk.min.x, i & 2 ? kucuk.max.y : kucuk.min.y, i & 4 ? kucuk.max.z : kucuk.min.z));
    // Adaylar: yatay yön (10° adım) × kamera yüksekliği; puan: tercih edilen yöne açı + göz ortasına uzaklık
    const zler = kaydir ? [1550, 1450, 1650, 1400, 1700, 1800, 1950, 2100, 2250] : [1550, 1450, 1650, 1400, 1700];
    const adaylar = [];
    for (let a = 0; a < 360; a += 10) {
      const az = (a * Math.PI) / 180, fark = yatayTercih ? Math.abs(Math.atan2(Math.sin(az - tAz), Math.cos(az - tAz))) : 0;
      for (const z of zler) adaylar.push({ az, z, puan: fark + Math.abs(z - 1550) / 1500 });
    }
    adaylar.sort((a, b) => a.puan - b.puan);
    const sonuc = { red: {} };
    const red = (n) => { sonuc.red[n] = (sonuc.red[n] ?? 0) + 1; };
    let en = null, gecen = 0;
    const son = (p, t) => (kaydir ? kaydir(p, t) : { pos: p, target: t });
    let kalan = enCok;
    for (const { az, z, puan } of adaylar) {
      if (en && --kalan < 0) break; // ilk geçenden sonra en çok enCok aday daha
      const Dmax = enUzakYatay(merkez, az);
      if (Dmax < enAz) { red('oda'); continue; }
      const yer = (D) => V().set(merkez.x + Math.cos(az) * D, merkez.y + Math.sin(az) * D, z);
      // Doluluk: yatay uzaklığı izdüşüme göre ayarla
      let D = Math.min(Dmax, Math.max(enAz, ks.length() * 1.4)), m = null;
      for (let i = 0; i < 6; i++) {
        m = olc(yer(D), merkez, kutu, fov, aspect);
        const yeni = !m.kesik && m.dol > 0 ? D * (m.dol / doluluk) ** 0.9 : D * 1.5;
        D = Math.min(Dmax, Math.max(enAz, yeni));
      }
      // Kameranın yeri (insanın durduğu yer) mobilyanın üstüne düşerse aynı yönde geri çekilir (masanın önü, rafın önü)
      let pos0 = null, pos = null, hed = null, neden = 'oda';
      for (let Dk = D; Dk <= Dmax + 1; Dk = Dk < Dmax ? Math.min(Dmax, Dk + 120) : Dmax + 2) {
        const p0 = yer(Dk), S = son(p0.clone(), merkez.clone());
        const p = V().fromArray(S.pos.toArray ? S.pos.toArray() : S.pos), h = V().fromArray(S.target.toArray ? S.target.toArray() : S.target);
        if (!icerde(p)) { neden = 'oda'; continue; }
        if (!durulur(p)) { neden = 'hacim'; continue; }
        pos0 = p0; pos = p; hed = h; D = Dk;
        break;
      }
      if (!pos) { red(neden); continue; }
      // arkasi: kamera verilen noktanın (diz çöken Biggie) arkasında, bakış yönünün en az pay kadar gerisinde
      if (arkasi && (pos.x - arkasi.x) * arkasi.f[0] + (pos.y - arkasi.y) * arkasi.f[1] > -(arkasi.pay ?? 150)) { red('arkasi'); continue; }
      if (govde && kemikler().some((b) => !govdeHaric.has(b) && b.getWorldPosition(tmp2).distanceTo(pos) < 380)) { red('govde-ici'); continue; }
      if (sanal?.some((c) => Math.hypot(pos.x - c.x, pos.y - c.y) < c.r + 200)) { red('govde-ici'); continue; }
      m = olc(pos, hed, kutu, fov, aspect);
      if (m.kesik || m.dol > 0.92) { red('kesik'); continue; }
      // gorunsun: bu noktalar kadrajın verilen NDC bölgesinde (ör. diz çöken Biggie'nin sağ omzu kartın dışında görünsün)
      if (gorunsun) {
        const cam = kameraKur(kc, pos, hed, fov, aspect), g = gorunsun;
        if (!g.noktalar.every((n) => { const q = tmp2.fromArray(n).project(cam); return q.z < 1 && q.x >= (g.x0 ?? -0.9) && q.x <= (g.x1 ?? 0.9) && q.y >= (g.y0 ?? -0.9) && q.y <= (g.y1 ?? 0.9); })) { red('gorunsun'); continue; }
      }
      // pay: yakın plan salınımı (fare paralaksı, nefes) kadrajı birkaç derece döndürür
      if (disariOrani(pos, hed, fov * (disariPay ? 1.1 : 1), aspect * (disariPay ? 1.06 : 1), 40, 24) > 0) { red('disari'); continue; }
      let eng = null;
      for (const n of noktalar) { eng = engelli(pos, n, { haric, haricOrnek, govde, govdeHaric, sanal }); if (eng) break; }
      if (eng) { red(eng); continue; }
      if (govdeKadraj && govdeGorunur(pos, hed, pos.distanceTo(merkez), fov, aspect, govdeHaric, sanal, govde, typeof govdeKadraj === 'number' ? govdeKadraj : 0.8)) { red('govde-kadraj'); continue; }
      const w = Math.round((m.en * 2 * pos.distanceTo(hed) * Math.tan((fov * Math.PI) / 360) * aspect) / doluluk);
      const p2 = puan + 2.5 * Math.abs(Math.log(Math.max(0.05, m.dol) / doluluk));
      if (!en || p2 < en.puan) en = { pos: pos0.toArray().map(Math.round), target: merkez.toArray().map(Math.round), w, dol: +m.dol.toFixed(3), puan: +p2.toFixed(3) };
      if (++gecen >= 4 || p2 - puan < 0.15) break;
    }
    return en ? { ...en, red: sonuc.red } : { pos: null, red: sonuc.red };
  }

  // Verilen kadrajın ölçümü (test ve kare denetimi): { pos, target } (son kadraj, kameranın gerçek yeri)
  // kutu: odak nesnesinin kutusu; nesne: odak nesnesinin ağları (Object3D ya da dizi; örtülme ölçümü için); fov, aspect
  // Döner: { goz: göz yüksekliğinde mi, oda: odanın içinde (duvar payıyla) mı, durulur, disari: oda dışı piksel oranı,
  //   ortu: odak nesnesinin karakter tarafından örtülme oranı (deri ağına ışın), engel: başka eşyanın örtme oranı,
  //   orta: nesnenin ekrandaki merkezi (NDC), dol }
  function olcum({ pos, target }, { kutu = null, nesne = null, fov = 40, aspect = 1.6, nx = 28, ny = 18 } = {}) {
    hacimler();
    const p = V().fromArray(pos), t = V().fromArray(target);
    const r = {
      z: Math.round(p.z), goz: p.z >= GOZ[0] - 1 && p.z <= GOZ[1] + 1,
      // oda: kameranın kendisi odanın içinde (duvarlardan en az 60 mm: motorun son güvenliği disari() ile aynı; yakın plan
      // salınımı kamerayı hesaplanan yerden biraz kaydırabilir); odaPay: hesap payı (DUVAR_PAY) içinde
      oda: p.x >= ROOM.x0 + 59 && p.x <= ROOM.x1 - 59 && p.y >= ROOM.y0 + 59 && p.y <= ROOM.y1 - 59,
      odaPay: p.x >= ROOM.x0 + DUVAR_PAY - 1 && p.x <= ROOM.x1 - DUVAR_PAY + 1 && p.y >= ROOM.y0 + DUVAR_PAY - 1 && p.y <= ROOM.y1 - DUVAR_PAY + 1,
      durulur: durulur(p),
      disari: +disariOrani(p, t, fov, aspect, 48, 27).toFixed(4),
    };
    if (kutu) { const m = olc(p, t, kutu, fov, aspect); r.dol = +m.dol.toFixed(3); r.orta = m.orta.map((x) => +x.toFixed(3)); }
    const hedef = [];
    for (const o of [nesne].flat().filter(Boolean)) o.traverse((x) => { if (x.isMesh && x.visible !== false) hedef.push(x); });
    if (hedef.length && kutu) {
      // Karakter: gövde kemiklerinin küreleri (baş 210 mm, gövde 130 mm yarıçap). Deri ağına ışın atmak güvenilmedi:
      // three r162'de bu karakterin deri ağlarının sınır küresi 0 çıkıyor (köşe konumu kemik dönüşümüyle okunamıyor)
      const cam = kameraKur(kc, p, t, fov, aspect);
      const kure = kemikler().map((b) => [b.getWorldPosition(V()), /kafa|head|topuz|kulak/i.test(b.name) ? 210 : 130]);
      const kar = kure.length ? [1] : [];
      // Nesnenin ekrandaki kutusu (NDC), içinde ızgara
      let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
      for (let i = 0; i < 8; i++) {
        const k = V().set(i & 1 ? kutu.max.x : kutu.min.x, i & 2 ? kutu.max.y : kutu.min.y, i & 4 ? kutu.max.z : kutu.min.z).project(cam);
        x0 = Math.min(x0, k.x); x1 = Math.max(x1, k.x); y0 = Math.min(y0, k.y); y1 = Math.max(y1, k.y);
      }
      x0 = Math.max(-1, x0); x1 = Math.min(1, x1); y0 = Math.max(-1, y0); y1 = Math.min(1, y1);
      const rc = new THREE.Raycaster(), nd = new THREE.Vector2(), hset = new Set(hedef);
      let say = 0, kapali = 0, engel = 0;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        nd.set(x0 + ((i + 0.5) / nx) * (x1 - x0), y0 + ((j + 0.5) / ny) * (y1 - y0));
        rc.setFromCamera(nd, cam);
        const h = rc.intersectObjects(hedef, false)[0];
        if (!h) continue;
        say++;
        rc.far = h.distance - 2;
        if (kar.length && kure.some(([c, r]) => { const tt = c.clone().sub(rc.ray.origin).dot(rc.ray.direction); return tt > 0 && tt < h.distance - 2 && rc.ray.distanceSqToPoint(c) < r * r; })) { kapali++; rc.far = Infinity; continue; }
        const e = rc.intersectObjects(engelAg.filter((o) => !hset.has(o)), false).length;
        if (e) engel++;
        rc.far = Infinity;
      }
      r.ornek = say;
      r.ortu = say ? +(kapali / say).toFixed(3) : null;
      r.engel = say ? +(engel / say).toFixed(3) : null;
    }
    return r;
  }
  // Eski ölçüm (v6 testleri): hacim, oda, engel, doluluk
  function sina({ pos, target }, { kutu, haric = null, haricOrnek = null, govde = true, sanal = null, fov = 40, aspect = 1.6 } = {}) {
    hacimler();
    const p = V().fromArray(pos), t = V().fromArray(target), r = { oda: icerde(p), hacim: !!icinde(p), disari: disariOrani(p, t, fov, aspect) };
    if (kutu) {
      const m = olc(p, t, kutu, fov, aspect);
      r.dol = +m.dol.toFixed(3); r.kayma = +m.kayma.toFixed(3); r.kesik = m.kesik;
      const c = kutu.getCenter(V());
      r.engel = [c].map((n) => engelli(p, n, { haric, haricOrnek, govde, govdeHaric: new Set(), sanal })).filter(Boolean);
    }
    return r;
  }
  return { bul, sina, olcum, disari, disariOrani, icinde: (p) => !!icinde(p), durulur, yenile: () => { hacim = null; }, hacimler,
    kemikBagla: (f, ag) => { kemikFn2 = f ?? (() => []); if (ag) agFn = ag; } };
}
