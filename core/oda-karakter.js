// Oda sahnesinin karakteri (bizzikoloşko). Ziyaretçiye üst kattan eşlik eder: ziyaretçi odaya inince (asagi) balkonun
// sağındaki yangın merdiveninden ya da ipten (her ziyarette rastgele) yavaşça iner, içeri girip kapı eşiğinde rastgele
// bir dans eder, masanın sağındaki katlı oyuncu koltuğunun sırtını açıp oturur, masaya kayar ve bilgisayar başında
// çalışır; boşta emote atar, tıklanınca ya da şablon değişince tepki verir. Ziyaretçi üst kata dönerse (yukari) kalkıp
// aynı yoldan tırmanır; yolda geri dönerse kaldığı yerden döner.
// Yakın planda ürünün önüne karakter ya da koltuk girerse ürün sade bir x-ray dairesinden görünür; kadrajı karakterin
// kapladığı duraklarda (masa başı) koltuğunu kenara çeker. Kamera içinden geçerse karakter seyrelir.
// Model ve klipler Blender'dan: assets/oda/karakter.glb (Draco; NLA izleri = klipler; sahnenin extras'ında
// "karakter_meta": kare aralıkları ve ölçüler, yoksa aşağıdaki varsayılanlar). Kemik ve düğüm adları Blender'dakiyle aynı.
// Birim mm, Z yukarı. Yön açısı ψ: karakterin baktığı yön (sin ψ, −cos ψ); ψ = 0 kameraya (−y), π/2 sağa, π masaya.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OLCU } from './oda-olcu.js';
import { A } from './oda-yerler.js';

const DOSYA = new URL('../assets/oda/karakter.glb', import.meta.url);
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/gltf/';
const { ROOM, GLASS, BALCONY, DESK, PEDESTAL, FRIDGE, SILL, CHAIR, ROBOT } = OLCU;
const TAU = Math.PI * 2;
const MASA_Z = 335; // masa başı kliplerinde kök yüksekliği (Blender eşlemesi z_site = 1,5 z + 335: eller klavyede, kalça koltukta)

// ---- Ayarlanabilir değerler ----
export const AYAR = {
  tempo: 1.1,            // karakterin bütün zamanı (klipler, yürüyüş, kayma, iniş) bu kat hızlı akar: ayak kaymaz (2026-10-19)
  fareDelik: ['kartvizit', 'kalemlik', 'klavye'], // genel planda fare bu ürünlerin üzerindeyse imleç dairesi karakteri siler
  fareCap: 125,          // mm: imleç dairesinin çapı (ürünün uzaklığında)
  minderEz: 0.13,        // oturuşta minder bu oranda ezilip yaylanarak toparlanır
  donme: 0.2,            // rad: oturuşta oturak (karakterle) kendi ekseninde bu genlikle sönerek sallanır
  hizYuru: 406,         // mm/sn: yürüme döngüsünde basan ayağın hızı (Blender'da ölçüldü: 0,271 m/sn × 1,5)
  donus: 3.2,            // rad/sn: yürürken en hızlı dönüş
  donusYerinde: 2.6,     // rad/sn: durduğu yerde dönüş
  hizKaydir: 330,        // mm/sn: koltukla kayma
  donusKaydir: 1.5,      // rad/sn
  pay: 160,              // yürürken engellerden pay (gövde yarıçapı; balkonda cephe ile bistro masa arası ~385 mm)
  gizliZ: 3400,          // iniş bu kalça yüksekliğinden başlar (üst kat: pencereden görünmez)
  hizliIn: 2.4,          // görünmeyen yükseklikte iniş/çıkış bu kat hızlı
  gorunurZ: [1700, 2700],// kalça bu aralıkta normal hızdan hızlıya geçer
  yakin: [850, 560],     // kamera karaktere bu uzaklıktan (mm) yaklaşınca seyrelir, ikincisinde tamamen kaybolur
  kenarYakin: 1250,      // kenara çekilmeyi gerektiren yakın planın kamerasına bu kadar yaklaşınca koltuk çekilir
  kenarOnce: 2.5,        // ya da kamera o durağa bu kadar saniyede varacak hızla yaklaşıyorsa (tıklamayla uçuş)
  kenarPay: 0.85,        // ... ve genel plandaki uzaklığının bu katından yakındaysa
  kenarHiz: 2.2,         // kenara kaçarken koltuk bu kat hızlı kayar (dönüşte normal)
  kenarBekle: 1.2,       // gerek kalmayınca masaya dönmeden önce, sn
  dansBekle: [0.6, 1.0], // eşikte dans öncesi ve sonrası duruş, sn
  bosta: [9, 18],        // masada iki emote arası, sn (rastgele)
  tepkiAra: 12,          // iki tepki arası en az, sn
  sablonTepki: 0.3,      // şablon değişince tepki olasılığı
  sirtDik: 0.14,         // koltuk sırtı açılınca menteşede bu kadar geriye yatık durur (rad; katlı hâli GLB'de −90°)
  xrRenk: [0.2, 0.22, 0.24], // x-ray dairesinin çizgisi (doğrusal, ton eşlemeden önce)
  isik: 1.6,             // karakter malzemelerinin ortam ışığı çarpanı (loş oda)
};

// Varsayılan klip bilgisi (kareler Blender'daki gibi 1'den; GLB'deki karakter_meta bunların üstüne yazar).
// dongu/son: iniş klibinde döngü ve iniş bitişi; tekrar: döngülü klip; z: kökün yerden yüksekliği (mm, sabit ya da
// [[kare, değer], ...]); koltuk: koltuk merkezinin kökün kaç mm arkasında olduğu; sirt: sırt katlılığı (1 katlı, 0 dik);
// cevir: klip yokken koltuğun yer tutucuyla çevrildiği kare aralığı; kayma: kökün klip boyunca bakış yönünde yürüdüğü
// mm (karakter yerinde canlanır, yerini site kaydırır); tut: koltuğun köke tutturulduğu kare aralığı; don: tutarken
// koltuğun kendi ekseninde dönüşü (rad); kavrama: sırt açmaya koltuğun kaç mm arkasında başlanır.
const MASA = { z: MASA_Z, koltuk: 33 };
const VARSAYILAN = {
  fps: 30,
  kalca: null, kafa: null,                      // kemik adları (boşsa addan tahmin)
  merdiven: { mesafe: 300, en: 460, ilk: 106.5, aralik: 124.5 }, // kökten merdiven düzlemine, basamaklar (mm)
  ip: { mesafe: 170 },
  klip: {
    merdiven: { dongu: [1, 49], son: [49, 144] },
    ip: { dongu: [1, 73], son: [73, 252] },
    yuru: { tekrar: true }, dur: { tekrar: true },
    dans_twist: {}, dans_tavuk: {}, dans_lahana: {}, dans_runningman: {},
    sirt_ac: { sirt: [[40, 1], [80, 0]], cevir: [10, 110] },
    otur: { z: [[42, 0], [81, MASA_Z]], koltuk: [[1, 205], [145, 205], [161, 33]] },
    kalk: { z: [[1, MASA_Z], [30, MASA_Z], [72, 0]], koltuk: [[1, 33], [22, 205]] },
    kaydir: { tekrar: true, ...MASA },
    yaz: { tekrar: true, ...MASA }, muzik: { tekrar: true, ...MASA }, bekle: { tekrar: true, ...MASA },
    kafa_salla: { ...MASA }, sevin: { ...MASA }, inanamama: { ...MASA }, uzan: { ...MASA }, cekil: { ...MASA },
  },
};
const DANSLAR = ['dans_twist', 'dans_tavuk', 'dans_lahana', 'dans_runningman'];
// Masa başında boşta: ağırlıklı rastgele dizi ([ad, sn]: döngülü klip o kadar sürer)
const EMOTE = [
  [3, ['kafa_salla']],
  [2, ['cekil', ['bekle', 5], 'uzan']],
  [1, ['sevin']],
  [1, ['inanamama']],
];
const KENAR_KLIP = ['muzik', 'bekle']; // kenarda beklerken (ilk bulunan): taburede müzik dinleme

// ---- Yerler ----
// Merdiven (yangın kaçışı: üst katın balkonundan iner) ve ip balkonun arka sağında, korkuluğun önünde: ana kadrajdan
// kapı boşluğunun sağ yarısında görünür (sağ pencere ana kadrajın dışında kalır). Karakter merdivene yüzü korkuluğa
// dönük iner; sonra sağ duvar şeridinden (kadraj dışı) dolaşıp cephe ile bistro masa arasından kapıya gelir.
const INIS_X = 1560, INIS_Y = BALCONY.y1 - 40; // merdiven düzlemi / ipin sarktığı yer
const YER = {
  esik: { x: (GLASS.door0 + GLASS.door1) / 2, y: ROOM.y1 - 240, psi: 0 },   // balkon kapısının iç eşiği, yüzü kameraya
  masa: { x: -960, y: 812.5, psi: Math.PI },                                // masa başı (Blender eşlemesi), yüzü monitöre
  // Yakın planda koltuğu çektiği yer: masanın sağ ucunun önü, sol pencerenin yanı; yüzü odaya. Masa başı yakın plan
  // kameralarının görüşü ve aralarındaki uçuşlar dışında (en yakın uçuş ~0,6 m); kenar yeri kadrajına giren bir
  // durakta (saksılar) karakter kenarda beklemez
  kenar: { x: 100, y: 1050, psi: 0.35 },
  // Oturma yeri: koltuk masadan çekilip yüzü sağa (+x) döner; karakter önünde durup oturur, sonra masaya döner
  koltuk: { x: CHAIR.x, y: CHAIR.y - 240, rz: -Math.PI / 2 },
};
// Yol düğümleri: balkon (merdiven önü, cephe ile bistro masa arasındaki geçit, kapı önü), eşik, odanın açık zemini
const DUGUM = [
  [1780, 3085], [1775, 2300], [1500, 2165], [1150, 2160], [800, 2160], [800, 1560], [450, 1260], [120, 1040], [80, 1380],
  [120, 620], [-200, 380], [-650, 420], [-1150, 560], [600, 520], [1000, 300],
];
// Engeller: k = kutu [x0, x1, y0, y1], d = daire [x, y, r]. Koltuk ayrıca (yerinde duruyorsa) daire olarak eklenir.
const CEPHE = ROOM.y1 + ROOM.wall + 45; // duvarın dış yüzü ve önündeki açık sürgü kanatları
const SABIT_ENGEL = [
  { k: [ROOM.x0 - 200, GLASS.door0 + 30, ROOM.y1, CEPHE] },                       // arka duvar ve sol kanat
  { k: [GLASS.door1 - 30, ROOM.x1 + 200, ROOM.y1, CEPHE] },                       // kapının sağı
  { k: [GLASS.x0 - SILL.over / 2, GLASS.door0, ROOM.y1 - SILL.inset - SILL.depth / 2, ROOM.y1] }, // pervazlar
  { k: [GLASS.door1, GLASS.x1 + SILL.over / 2, ROOM.y1 - SILL.inset - SILL.depth / 2, ROOM.y1] },
  { k: [DESK.x0, DESK.x1, DESK.y0, DESK.y1] },
  { k: [PEDESTAL.x - PEDESTAL.w / 2, PEDESTAL.x + PEDESTAL.w / 2, PEDESTAL.y - PEDESTAL.d / 2, PEDESTAL.y + PEDESTAL.d / 2] },
  { k: [FRIDGE.x - FRIDGE.d / 2, ROOM.x1, FRIDGE.y - FRIDGE.w / 2, FRIDGE.y + FRIDGE.w / 2] },
  { k: [BALCONY.x1, BALCONY.x1 + 200, ROOM.y1, BALCONY.y1] },                    // balkonun sağ duvarı
  { k: [BALCONY.x0 - 200, BALCONY.x1, BALCONY.y1 - 30, BALCONY.y1 + 100] },      // korkuluk
  { k: [BALCONY.x0 - 200, BALCONY.x0 + 30, ROOM.y1, BALCONY.y1] },
  { k: [INIS_X - 290, INIS_X + 290, INIS_Y - 30, BALCONY.y1] },                  // merdiven
  ...(ROBOT ? [{ d: [ROBOT.x, ROBOT.y, ROBOT.r ?? 170] }] : []),                   // robot süpürge
  { d: [A.table[0], A.table[1], 300] },                                           // bistro masa
  { k: [A.table[0] - 700, A.table[0] - 260, A.table[1] - 280, A.table[1] + 160] }, // rattan sandalyeler (440 mm kare)
  { k: [A.table[0] + 260, A.table[0] + 700, A.table[1] - 130, A.table[1] + 310] },
];

// ---- küçük yardımcılar ----
const yon = (psi) => [Math.sin(psi), -Math.cos(psi)];
const aciOf = (dx, dy) => Math.atan2(dx, -dy);
const fark = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const kenet = (v, a, b) => Math.min(b, Math.max(a, v));
const yumusak = (u) => u * u * (3 - 2 * u);
const aralik = (v, a, b) => yumusak(kenet((v - a) / (b - a), 0, 1));
const rastgele = ([a, b]) => a + Math.random() * (b - a);
// Ziyaret başına seçimler (iniş aracı, dans, oturuş) bir önceki ziyaretin aynısını tekrarlamaz: son seçim tarayıcıda
// saklanır, seçenek birden çoksa o dışarıda bırakılıp kalanlardan rastgele seçilir (depolama yoksa düz rastgele)
function tekrarsiz(ad, secenekler) {
  if (!secenekler.length) return undefined;
  const k = `oktos.karakter.son.${ad}`;
  let son = null;
  try { son = localStorage.getItem(k); } catch { /* gizli pencere ya da kapalı depolama */ }
  const aday = secenekler.length > 1 ? secenekler.filter((x) => x !== son) : secenekler;
  const sec = aday[Math.floor(Math.random() * aday.length)];
  try { localStorage.setItem(k, sec); } catch { /* yoksay */ }
  return sec;
}
// Anahtarlı değer: sayı ya da [[kare, değer], ...] (aralarda yumuşak geçiş, uçlarda sabit)
function anahtar(k, f) {
  if (k === undefined || k === null) return 0;
  if (typeof k === 'number') return k;
  if (f <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (f > k[i][0]) continue;
    const [f0, v0] = k[i - 1], [f1, v1] = k[i];
    return v0 + (v1 - v0) * yumusak((f - f0) / (f1 - f0 || 1));
  }
  return k[k.length - 1][1];
}
function birlestir(a, b) { // derin birleştirme (dizi ve sayı üzerine yazılır)
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? birlestir(a[k], v) : v;
  return o;
}

// ---- yol bulma: görüş grafiği (düğümler + başlangıç + hedef), kısa yol, sonra kestirme ----
function kutuKeser(a, b, [x0, x1, y0, y1], p) {
  x0 -= p; x1 += p; y0 -= p; y1 += p;
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [pp, q] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
    if (pp === 0) { if (q < 0) return false; continue; }
    const r = q / pp;
    if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 <= t1;
}
const kutuUzak = (p, [x0, x1, y0, y1]) => Math.hypot(Math.max(x0 - p.x, 0, p.x - x1), Math.max(y0 - p.y, 0, p.y - y1));
function noktaParca(c, a, b) { // c'nin ab parçasına uzaklığı
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
  const t = kenet(((c.x - a.x) * dx + (c.y - a.y) * dy) / L, 0, 1);
  return Math.hypot(a.x + dx * t - c.x, a.y + dy * t - c.y);
}
function serbest(a, b, E, pay) {
  for (const e of E) {
    if (e.k) {
      // Uç noktası engelin payındaysa (koltuğun dibinde durmak, merdivenden inmek) pay o noktanın uzaklığına iner:
      // yol oradan uzaklaşabilir ama engelin daha içine giremez
      const p = Math.min(pay, kutuUzak(a, e.k) - 5, kutuUzak(b, e.k) - 5);
      if (p < 0) continue; // nokta engelin tam içinde
      if (kutuKeser(a, b, e.k, p)) return false;
    } else {
      const c = { x: e.d[0], y: e.d[1] };
      // Uç noktası dairenin içindeyse (koltuğun önünde durmak) daire o noktaya kadar küçülür: yol daha içeri giremez
      const r = Math.min(e.d[2] + pay, Math.hypot(a.x - c.x, a.y - c.y) - 5, Math.hypot(b.x - c.x, b.y - c.y) - 5);
      if (noktaParca(c, a, b) < r) return false;
    }
  }
  return true;
}
export function yolBul(bas, son, E, pay = AYAR.pay) {
  if (serbest(bas, son, E, pay)) return [son];
  const N = [bas, ...DUGUM.map(([x, y]) => ({ x, y })), son], n = N.length;
  const uz = Array(n).fill(Infinity), once = Array(n).fill(-1), bitti = Array(n).fill(false);
  uz[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!bitti[i] && uz[i] < Infinity && (u < 0 || uz[i] < uz[u])) u = i;
    if (u < 0 || u === n - 1) break;
    bitti[u] = true;
    for (let v = 0; v < n; v++) {
      if (bitti[v] || v === u) continue;
      const d = uz[u] + Math.hypot(N[v].x - N[u].x, N[v].y - N[u].y);
      if (d < uz[v] && serbest(N[u], N[v], E, pay)) { uz[v] = d; once[v] = u; }
    }
  }
  if (once[n - 1] < 0) return [son]; // yol yok: düz git (engel yanlış tanımlı olabilir; takılıp kalmasın)
  const yol = [];
  for (let i = n - 1; i > 0; i = once[i]) yol.unshift(N[i]);
  // Kestirme: görebildiği en uzak noktaya doğrudan
  const kisa = [];
  let o = bas;
  for (let i = 0; i < yol.length;) {
    let j = yol.length - 1;
    while (j > i && !serbest(o, yol[j], E, pay)) j--;
    kisa.push(yol[j]);
    o = yol[j];
    i = j + 1;
  }
  return kisa;
}

// ---- x-ray: karakter ve koltuk malzemelerine ekran dairesi (içi kesik, kenarında ince çizgi) ve seyrelme ----
const XR = {
  xrMerkez: { value: new THREE.Vector2() }, xrYaricap: { value: 0 }, xrGuc: { value: 0 }, xrSol: { value: 1 },
  xrRenk: { value: new THREE.Color(...AYAR.xrRenk) },
};
function xrayYama(mat) {
  if (mat.userData.xray) return mat;
  mat.userData.xray = true;
  const eski = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    eski?.call(mat, sh, r);
    Object.assign(sh.uniforms, XR);
    sh.fragmentShader = 'uniform vec2 xrMerkez; uniform float xrYaricap; uniform float xrGuc; uniform float xrSol; uniform vec3 xrRenk;\n' + sh.fragmentShader
      .replace('void main() {', `float xrBayer(vec2 p) {
        ivec2 i = ivec2(mod(p, 4.0));
        float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
        return (m[i.x + i.y * 4] + 0.5) / 16.0;
      }
      void main() {
        float xrD = distance(gl_FragCoord.xy, xrMerkez), xrR = xrYaricap * xrGuc;
        if (xrSol < 0.999 && xrBayer(gl_FragCoord.xy) >= xrSol) discard;   // kamera içinden geçerken seyrelme
        if (xrR > 1.0 && xrD < xrR - 1.2) discard;                         // daire: ürün görünür`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        if (xrR > 1.0) gl_FragColor.rgb = mix(gl_FragColor.rgb, xrRenk, 0.9 * (1.0 - smoothstep(0.0, 1.6, abs(xrD - xrR))));`);
  };
  mat.customProgramCacheKey = () => 'oda-karakter-xray';
  mat.needsUpdate = true;
  return mat;
}

// ---- yükleme ----
let yukleyici = null;
function gltf() {
  // Kendi yükleme yöneticisi: oda onu beklemediği için açılıştaki ilerleme çubuğuna girmez
  if (!yukleyici) { const y = new THREE.LoadingManager(); yukleyici = new GLTFLoader(y).setDRACOLoader(new DRACOLoader(y).setDecoderPath(DRACO)); }
  return yukleyici;
}

// Karakteri yükler (dosya yoksa null). opts: { reduce, zorla: 'merdiven' | 'ip' (iniş aracı), dosya }
// Draco çözücüsünün işçileri yüklemeden sonra kapanır (odanın kendi yükleyicisinin işçileri ayrı; telefonda bellek)
export async function karakterKur(opts = {}) {
  let g;
  try { g = await gltf().loadAsync(opts.dosya ? String(opts.dosya) : DOSYA.href); } catch (e) { console.info('karakter yüklenmedi:', e?.message ?? e); return null; }
  finally { yukleyici?.dracoLoader?.dispose(); yukleyici = null; }
  return karakterOlustur(g, opts);
}

// Odaya karakter ekler (oda sayfası). Sahne modülünü sarar: karakter sahneyle aynı anda yüklenmeye başlar ama odayı
// bekletmez; oda açılınca, perde kalkarken üst kattan iner. Geç gelirse de iner (görünmeyen yükseklikten başladığı için
// geciktiği fark edilmez). Hareket azaltmada ve masada başlatmada oda onu bekler (sonradan masada belirmesin).
// Dosya yoksa ya da yüklenemezse oda onsuz açılır.
//   const kar = odaKarakteri(odaScene, { reduce });
//   const story = await mountStory(root, { sceneModule: kar.sahne, ... });
//   kar.bagla(story).then((k) => ...);   // k: karakter ya da null
// opts: { reduce, zorla: 'merdiven' | 'ip', masada: masada oturarak başlar }
export function odaKarakteri(sahneModulu, { reduce = false, zorla = null, masada = false } = {}) {
  const bekle = reduce || masada;
  let karakter = null, sahneEsi = null, kuruldu;
  const sahnede = new Promise((r) => { kuruldu = r; }); // karakter sahneye eklenince (gelmeyecekse null)
  const sahne = {
    ...sahneModulu,
    async buildScene(a) {
      const yukle = karakterKur({ reduce, zorla }).catch((e) => { console.error('karakter', e); return null; });
      const b = await sahneModulu.buildScene(a);
      sahneEsi = a.scene;
      const ekle = (k) => { if (k) { karakter = k; k.sahneye(a.scene, b); } kuruldu(k); };
      if (bekle) ekle(await yukle); else yukle.then(ekle);
      return b;
    },
  };
  return {
    sahne,
    get karakter() { return karakter; },
    // Denetleyici kurulunca çağrılır: karakter tıklamalara ve kameraya bağlanır, hemen gelir
    async bagla(story) {
      const k = await sahnede;
      if (!k) return null;
      // Oda çizilmeye başladıktan sonra geldiyse gölgelendiricileri önceden derle: inerken ilk görünüşünde takılmasın
      if (!bekle) await story.renderer?.compileAsync?.(k.nesne, story.camera, sahneEsi).catch(() => {});
      k.bagla(story);
      if (bekle) k.masayaKoy(); else k.asagi();
      return k;
    },
  };
}

// Aynı malzemeli deri parçaları tek ağda birleşir (34 parça → 9) ve hepsi tek iskeleti paylaşır: telefonda çizim
// çağrısı (gölgeyle iki katı) ve karede güncellenen kemik dokusu az olsun. Dokulu malzemenin parçalarına dokunulmaz
function birlestirParcalar(model) {
  const gruplar = new Map();
  let iskelet = null;
  model.traverse((o) => {
    if (!o.isSkinnedMesh || Array.isArray(o.material)) return;
    iskelet ??= o.skeleton;
    const k = `${o.material.uuid}|${o.parent?.uuid}`;
    if (!gruplar.has(k)) gruplar.set(k, []);
    gruplar.get(k).push(o);
  });
  const ayni = (sk) => sk === iskelet || (sk.bones.length === iskelet.bones.length && sk.bones.every((b, i) => b === iskelet.bones[i]));
  for (const g of gruplar.values()) {
    const ilk = g[0];
    const dokulu = Object.values(ilk.material).some((v) => v?.isTexture);
    if (g.length < 2 || dokulu || !g.every((o) => ayni(o.skeleton))) { for (const o of g) if (ayni(o.skeleton)) o.bind(iskelet, o.bindMatrix); continue; }
    const geos = g.map((o) => {
      const x = o.geometry.clone();
      for (const ad of Object.keys(x.attributes)) if (!['position', 'normal', 'skinIndex', 'skinWeight'].includes(ad)) x.deleteAttribute(ad);
      return x;
    });
    const geo = geos.every((x) => x.index) ? mergeGeometries(geos) : null; // tür uyuşmazsa null: parçalar kalır
    geos.forEach((x) => x.dispose());
    if (!geo) { for (const o of g) o.bind(iskelet, o.bindMatrix); continue; }
    const m = new THREE.SkinnedMesh(geo, ilk.material);
    m.name = ilk.material.name || ilk.name;
    m.bind(iskelet, ilk.bindMatrix);
    ilk.parent.add(m);
    for (const o of g) { o.removeFromParent(); o.geometry.dispose(); }
  }
}

// Yüklenmiş glTF'ten karakter (test için ayrı: node'da sahte glTF ile de çalışır)
export function karakterOlustur(g, { reduce = false, zorla = null } = {}) {
  let ek = {};
  try { ek = JSON.parse(g.scene.userData?.karakter_meta ?? '{}'); } catch (_) { /* bozuk meta: varsayılan */ }
  const M = birlestir(VARSAYILAN, ek), fps = M.fps;
  const kare2sn = (f) => (f - 1) / fps;

  // Düğüm ağacı: yer (zeminde konum, ψ) → govde (yükseklik) → model (metre → mm)
  const yer = new THREE.Group(), govde = new THREE.Group(), model = g.scene;
  yer.name = 'karakter';
  model.scale.setScalar(1000);
  birlestirParcalar(model);
  govde.add(model);
  yer.add(govde);
  const meshler = [], kemikSet = new Set(), malzemeler = new Set();
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false; // iskelet bağlama pozundan çok uzağa gider (merdiven, oturma)
    for (const m of [o.material].flat()) {
      if (malzemeler.has(m)) continue; // ortak malzeme bir kez
      malzemeler.add(m);
      m.envMapIntensity = (m.envMapIntensity ?? 1) * AYAR.isik;
      xrayYama(m);
    }
    if (o.isSkinnedMesh) o.skeleton.bones.forEach((b) => kemikSet.add(b));
    meshler.push(o);
  });
  // Yalnız gövdeyi taşıyan kemikler (IK hedefleri, dirsek/diz hedefleri, tutma ve kök noktaları gövdenin dışında durur:
  // yakınlık, örtme ve tıklama ölçümüne girmez)
  const kemikler = [...kemikSet].filter((b) => !/IK|hedef|tutma|kök|kulaklık/i.test(b.name));
  const adla = (ad, re) => (ad && model.getObjectByName(ad)) || kemikler.find((b) => re.test(b.name)) || null;
  const kalca = adla(M.kalca, /hips$|kal[cç]a/i) ?? kemikler[0] ?? null;
  const kafa = adla(M.kafa, /head$|kafa$/i);

  // Klipler
  const mixer = new THREE.AnimationMixer(model);
  const akt = new Map(); // ad → { act, clip, oynadi, ofz }
  for (const clip of g.animations) akt.set(clip.name, { act: mixer.clipAction(clip), clip, oynadi: false, ofz: undefined });
  const var_ = (ad) => akt.has(ad);
  // Oturma klibi ziyaret başına rastgele: Koltuğa Oturma (otur) ya da Oturmaya Geçiş (otur2), dosyada hangisi varsa
  const oturAd = tekrarsiz('otur', ['otur', 'otur2'].filter(var_)) ?? 'otur';

  // Kalça yüksekliği tablosu (iniş kliplerinde: döngüde ne kadar indiğini ve görünürlüğü ölçmek için). Ayrı bir mixer
  // klibi kare kare uygular; kök sıfırda olduğundan kalçanın dünya z'si doğrudan mm
  const kalcaTablo = {};
  if (kalca) {
    const olc = new THREE.AnimationMixer(model), v = new THREE.Vector3();
    for (const ad of ['merdiven', 'ip']) {
      const a = akt.get(ad);
      if (!a) continue;
      const act = olc.clipAction(a.clip).play(), n = Math.ceil(a.clip.duration * fps) + 1, z = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        act.time = Math.min(i / fps, a.clip.duration);
        olc.update(0);
        yer.updateMatrixWorld(true);
        z[i] = kalca.getWorldPosition(v).z;
      }
      kalcaTablo[ad] = z;
      olc.stopAllAction();
      olc.uncacheRoot(model);
    }
  }
  const kalcaZ = (ad, t) => {
    const z = kalcaTablo[ad];
    if (!z) return 700;
    const f = kenet(t * fps, 0, z.length - 1), i = Math.floor(f), u = f - i;
    return z[i] + (z[Math.min(i + 1, z.length - 1)] - z[i]) * u;
  };

  // ---- durum ----
  const ben = { x: 0, y: 0, psi: 0, yer: 'ust', arac: null, inis: null, dansBorcu: true, gorunur: false };
  const koltuk = { obj: null, sirt: null, sirtKatli: -Math.PI / 2, ust: null, ust0: 0, katlama: 0, x: CHAIR.x, y: CHAIR.y, rz: CHAIR.rz, bagli: false, cevir: null, cevirK: null, minder: [], minderTaban: 0, minderBoy: 0 };
  let story = null, sahne = null, saat = 0, nesil = 0, kilit = Promise.resolve(), simdiki = null;
  let bakis = null; // null | 'kamera' | 'urun': kafa o yana döner
  let tepkiler = [], sonTepki = -99, uzerinde = false;
  const kareler = new Set();
  const kare = (fn) => new Promise((ok) => { kareler.add((dt) => { const r = fn(dt); if (r) { ok(r); return true; } return false; }); });
  const bekle = (sn, d) => { let t = 0; return kare((dt) => (d && !d() ? 'iptal' : (t += dt) >= sn ? 'tamam' : null)).then((r) => r === 'tamam'); };

  // Klibe geçiş: önceki klipten yumuşak geçiş. Döngüsüz klipte söz bitişte (kesilirse false) döner; döngülüde sure
  // verilirse o kadar sonra, verilmezse hemen.
  function oynat(ad, { tekrar, solma = 0.35, hiz = 1, sure, onBasla } = {}, d = null) {
    const a = akt.get(ad);
    if (!a) { onBasla?.(); return Promise.resolve(!d || d()); }
    const m = M.klip[ad] || {}, dongu = tekrar ?? !!m.tekrar, act = a.act;
    if (!(simdiki === a && dongu)) {
      act.reset();
      act.setLoop(dongu ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      act.clampWhenFinished = !dongu;
      act.timeScale = hiz;
      act.setEffectiveWeight(1);
      act.play();
      if (simdiki && simdiki !== a) simdiki.act.crossFadeTo(act, solma, false);
      else if (!simdiki) act.fadeIn(solma);
    }
    a.oynadi = true;
    a.ofz = a.ofIleri = a.ofKoltuk = undefined;
    a.indi = false;
    a.kayma = anahtar(m.kayma ?? 0, 1);
    a.tutulan = null;
    simdiki = a;
    onBasla?.();
    if (dongu && !sure) return Promise.resolve(true);
    let t = 0;
    return kare((dt) => {
      if (d && !d()) return 'iptal';
      t += dt;
      if (dongu) return t >= sure ? 'tamam' : null;
      return act.paused || act.time >= a.clip.duration - 1e-4 ? 'tamam' : null;
    }).then((r) => r === 'tamam');
  }
  // Kesilmeyen klip (otur, kalk, sırt açma): yeni görev bitmesini bekler
  function kilitli(ad, opts) { const p = oynat(ad, opts); kilit = p; return p; }

  // ---- yürüme: yol boyunca, dönerek; sonda istenen yöne döner ----
  function engeller() {
    return koltuk.bagli || !koltuk.obj ? SABIT_ENGEL : [...SABIT_ENGEL, { d: [koltuk.x, koltuk.y, 300] }];
  }
  async function yuru(hedef, d, { son = 'dur' } = {}) {
    const yol = yolBul({ x: ben.x, y: ben.y }, hedef, engeller());
    await oynat('yuru', { solma: 0.3 });
    const a = akt.get('yuru');
    let i = 0, t = 0;
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      t += dt;
      const p = yol[i], dx = p.x - ben.x, dy = p.y - ben.y, uz = Math.hypot(dx, dy), sonNokta = i === yol.length - 1;
      if (!sonNokta && uz < 160) { i++; return null; }
      if (sonNokta && uz < 25) {
        ben.x = p.x; ben.y = p.y;
        if (hedef.psi === undefined) return 'tamam';
        const e = fark(ben.psi, hedef.psi); // vardı: yerinde döner
        if (Math.abs(e) < 0.04) { ben.psi = hedef.psi; return 'tamam'; }
        ben.psi += kenet(e, -AYAR.donusYerinde * dt, AYAR.donusYerinde * dt);
        if (a) a.act.timeScale = 0.6;
        return null;
      }
      const e = fark(ben.psi, aciOf(dx, dy));
      ben.psi += kenet(e, -AYAR.donus * dt, AYAR.donus * dt);
      const k = Math.max(0, Math.cos(e)) ** 2 * Math.min(1, t / 0.35) * (sonNokta ? Math.min(1, 0.35 + uz / 260) : 1);
      const h = AYAR.hizYuru * k;
      ben.x += Math.sin(ben.psi) * h * dt;
      ben.y -= Math.cos(ben.psi) * h * dt;
      if (a) a.act.timeScale = 0.6 + 0.4 * k; // yavaşlarken adım da yavaşlar (ayak az kayar)
      return null;
    });
    if (a) a.act.timeScale = 1;
    if (r !== 'tamam') return false;
    if (son) await oynat(son, { tekrar: true, solma: 0.35 });
    return d();
  }

  // ---- koltukla kayma: kök ve koltuk birlikte, eğri üzerinde döne döne ----
  async function kaydir(hedef, d, { hiz = 1 } = {}) {
    const b = { x: ben.x, y: ben.y, psi: ben.psi }, de = fark(b.psi, hedef.psi);
    const uz = Math.hypot(hedef.x - b.x, hedef.y - b.y);
    if (uz < 5 && Math.abs(de) < 0.02) return true;
    // Kontrol noktası: iki ucun ortası, bakış yönünün tersine biraz çekilmiş (koltuk geri itilip döner)
    const [fx, fy] = yon(b.psi), c = { x: (b.x + hedef.x) / 2 - fx * uz * 0.25, y: (b.y + hedef.y) / 2 - fy * uz * 0.25 };
    const T = Math.max(uz / AYAR.hizKaydir, Math.abs(de) / AYAR.donusKaydir) / hiz + 0.4;
    if (var_('kaydir')) await oynat('kaydir', { solma: 0.4 });
    else if (simdiki?.clip.name !== 'otur' && KENAR_KLIP.some(var_)) await oynat(KENAR_KLIP.find(var_), { tekrar: true, solma: 0.4 });
    let t = 0;
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      t += dt;
      const u = yumusak(Math.min(1, t / T)), v = 1 - u;
      ben.x = v * v * b.x + 2 * v * u * c.x + u * u * hedef.x;
      ben.y = v * v * b.y + 2 * v * u * c.y + u * u * hedef.y;
      ben.psi = b.psi + de * u;
      return t >= T ? 'tamam' : null;
    });
    return r === 'tamam' && d();
  }

  // ---- iniş / çıkış: iniş klibi elle sürülür (döngü kareleri tekrar eder, kök döngü başına iner) ----
  const arac = { merdiven: null, ip: null }; // sahnedeki merdiven ve ip (sahneye eklenince)
  function inisYeri(ad) { // kök: merdivenin / ipin önünde, yüzü korkuluğa (+y)
    const ms = ad === 'ip' ? M.ip.mesafe : M.merdiven.mesafe;
    return { x: INIS_X, y: INIS_Y - ms, psi: Math.PI };
  }
  function inisKur(ad) {
    const a = akt.get(ad), k = M.klip[ad];
    const [da, db] = k.dongu.map(kare2sn), [sa, sb] = k.son.map(kare2sn).map((x) => Math.min(x, a.clip.duration));
    const H = (t) => kalcaZ(ad, t);
    const dus = Math.max(1, H(da) - H(db)), ek = H(sa) - H(db), L = db - da;
    const n = Math.max(1, Math.ceil((AYAR.gizliZ - (H(da) + ek)) / dus) + 1);
    const T = n * L + (sb - sa);
    const durum = (tau) => {
      if (tau < n * L) { const c = Math.floor(tau / L); return { zaman: da + (tau - c * L), ofz: ek + (n - 1 - c) * dus }; }
      return { zaman: sa + (tau - n * L), ofz: 0 };
    };
    return { ad, a, T, durum, H, tau: 0 };
  }
  function araciGoster(ad, acik, hemen = false) { // merdiven / ip üst kattan kayarak iner, toplanırken yukarı çekilir
    const o = arac[ad];
    if (!o) return Promise.resolve();
    o.visible = true;
    const hedef = acik ? 0 : 2600, z0 = o.position.z;
    if (hemen || reduce) { o.position.z = hedef; o.visible = acik; return Promise.resolve(); }
    let t = 0;
    return kare((dt) => {
      t += dt;
      const u = Math.min(1, t / 0.9);
      o.position.z = z0 + (hedef - z0) * (acik ? 1 - (1 - u) ** 3 : u * u);
      if (u >= 1) { o.visible = acik; return 'tamam'; }
      return null;
    });
  }
  // Yön: +1 iner, −1 çıkar. Bitince true (yerde ya da üstte)
  async function merdivende(yonu, d) {
    const s = ben.inis;
    s.yon = yonu;
    if (simdiki !== s.a) {
      s.a.act.reset();
      s.a.act.setLoop(THREE.LoopRepeat, Infinity);
      s.a.act.timeScale = 0; // zamanı biz veririz
      s.a.act.setEffectiveWeight(1);
      s.a.act.play();
      if (simdiki) simdiki.act.crossFadeTo(s.a.act, 0.4, false);
      s.a.oynadi = true;
      simdiki = s.a;
    }
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      const { zaman } = s.durum(s.tau), z = s.H(zaman) + s.durum(s.tau).ofz;
      const k = 1 + (AYAR.hizliIn - 1) * aralik(z, AYAR.gorunurZ[0], AYAR.gorunurZ[1]);
      s.tau = kenet(s.tau + yonu * dt * k, 0, s.T);
      return (yonu > 0 && s.tau >= s.T) || (yonu < 0 && s.tau <= 0) ? 'tamam' : null;
    });
    return r === 'tamam';
  }
  async function in_(d) {
    if (ben.yer === 'ust') {
      const ad = zorla ?? tekrarsiz('inis', ['ip', 'merdiven'].filter(var_)) ?? 'merdiven';
      if (!var_(ad)) { yereKoy(inisYeri(ad)); ben.yer = 'zemin'; ben.gorunur = true; return d(); } // klip yoksa yere konur
      ben.arac = ad;
      ben.inis = inisKur(ad);
      Object.assign(ben, inisYeri(ad));
      await araciGoster(ad, true);
      if (!d()) return false;
      ben.yer = 'merdiven';
      ben.gorunur = true;
    }
    if (!(await merdivende(1, d))) return false;
    ben.yer = 'zemin';
    ben.inis.a.ofz = 0;
    return d();
  }
  async function cik(d) {
    if (ben.yer === 'ust') return true;
    if (ben.yer === 'zemin') {
      const ad = ben.arac ?? (var_('merdiven') ? 'merdiven' : 'ip');
      if (!var_(ad)) { ben.yer = 'ust'; ben.gorunur = false; return d(); }
      ben.arac = ad;
      if (!(await yuru(inisYeri(ad), d, { son: null }))) return false;
      if (!arac[ad]?.visible) await araciGoster(ad, true);
      ben.inis = inisKur(ad);
      ben.inis.tau = ben.inis.T;
      ben.yer = 'merdiven';
    }
    if (!(await merdivende(-1, d))) return false;
    ben.yer = 'ust';
    ben.gorunur = false;
    ben.dansBorcu = true;
    await araciGoster(ben.arac, false);
    ben.arac = null;
    return d();
  }

  // ---- koltuk ----
  const koltukYuz = () => koltuk.rz + Math.PI;           // koltuğa oturanın ψ'si (koltuğun önü yerel +y)
  function kavrama() { // katlı koltuğun arkasında, ona bakarak (masaya itilmiş koltuğu kendine çeker)
    const psi = koltukYuz(), [fx, fy] = yon(psi), g = M.klip.sirt_ac?.kavrama ?? 600;
    return { x: koltuk.x - fx * g, y: koltuk.y - fy * g, psi: fark(0, psi) };
  }
  function oturmaYeri(ad = oturAd) { // koltuk arkasında kalacak şekilde önünde, koltuğun baktığı yöne bakarak (klibin başı)
    const psi = koltukYuz(), [fx, fy] = yon(psi), g = anahtar(M.klip[ad]?.koltuk ?? M.klip.otur?.koltuk ?? 205, 1);
    return { x: koltuk.x + fx * g, y: koltuk.y + fy * g, psi };
  }
  // Klibin gövde kaymasını ('ileri') köke aktarır: görüntü değişmez, sonraki klipler (kayma, yazma) kendi eşlemesinde
  // başlar. Kök ileri o kadar kayar, koltuk kökün arkasında o kadar yakına gelir
  function govdeyiKokeAktar(ad) {
    const a = akt.get(ad), m = M.klip[ad];
    if (!a || !m?.ileri) return;
    const f = a.act.time * fps + 1, o = anahtar(m.ileri, f), [fx, fy] = yon(ben.psi);
    ben.x += fx * o;
    ben.y += fy * o;
    a.ofIleri = 0;
    if (m.koltuk !== undefined) a.ofKoltuk = anahtar(m.koltuk, f) + o;
  }
  // Oturuş etkisi (klibin iniş karesinde): minder ezilip yaylanarak toparlanır (karakter onunla çöker), oturak karakterle
  // birlikte kendi ekseninde sönerek sallanır. Yön rastgele; hareket azaltmada yok
  let etki = null;
  function oturmaEtkisi() { if (!reduce && koltuk.ust) etki = { t0: saat, yon: Math.random() < 0.5 ? -1 : 1 }; }
  function oturmaEtkisiUygula() {
    const t = saat - etki.t0;
    const ez = t > 1.6 ? 0 : AYAR.minderEz * Math.exp(-t / 0.2) * Math.cos((2 * Math.PI * t) / 0.42) * Math.min(1, t / 0.05);
    const sw = t > 2.6 ? 0 : AYAR.donme * etki.yon * Math.exp(-t / 0.6) * Math.sin((2 * Math.PI * t) / 1.3);
    for (const p of koltuk.minder) { p.m.scale.z = 1 - ez; p.m.position.z = p.z0 + koltuk.minderTaban * ez; } // taban sabit
    koltuk.ust.rotation.z = sw;
    if (koltuk.bagli) { // karakter oturakla: çöker ve koltuğun ekseni çevresinde döner
      govde.position.z -= koltuk.minderBoy * ez;
      const c = Math.cos(sw), s = Math.sin(sw), px = ben.x - koltuk.x, py = ben.y - koltuk.y;
      yer.position.set(koltuk.x + c * px - s * py, koltuk.y + s * px + c * py, 0);
      yer.rotation.z = ben.psi + sw;
    }
    if (t > 2.6) etki = null;
  }
  function oturuYer() { // oturmuşken kökün bulunduğu yer (kalkmadan önce buraya kayar)
    const r = { x: YER.koltuk.x, y: YER.koltuk.y, rz: YER.koltuk.rz }, psi = r.rz + Math.PI, [fx, fy] = yon(psi);
    const g = anahtar(M.klip.otur?.koltuk ?? 205, 1);
    return { x: r.x + fx * g, y: r.y + fy * g, psi: fark(0, psi) };
  }

  // ---- görevler ----
  function yonet(hedef) {
    const nes = ++nesil, d = () => nes === nesil;
    (async () => {
      await kilit;
      if (!d()) return;
      try { await (hedef === 'oda' ? odayaGel(d) : yukariCik(d)); } catch (e) { console.error('karakter', e); }
    })();
  }
  async function odayaGel(d) {
    if (reduce) { masayaKoy(); return; }
    if (ben.yer === 'ust' || ben.yer === 'merdiven') { if (!(await in_(d))) return; }
    if (ben.yer === 'zemin') {
      if (ben.dansBorcu) {
        if (!(await yuru(YER.esik, d))) return;
        if (!(await bekle(AYAR.dansBekle[0], d))) return;
        const varolan = DANSLAR.filter(var_);
        ben.dansBorcu = false;
        if (varolan.length) {
          bakis = 'kamera';
          const ok = await oynat(tekrarsiz('dans', varolan), { solma: 0.4 }, d);
          bakis = null;
          if (!ok) return;
          await oynat('dur', { tekrar: true, solma: 0.45 });
          if (!(await bekle(AYAR.dansBekle[1], d))) return;
        }
      }
      if (koltuk.obj && koltuk.katlama > 0.5) { // katlı: arkasına gidip masadan çeker, sırtını açar, sağa çevirir
        if (!(await yuru(kavrama(), d))) return;
        if (var_('sirt_ac')) await kilitli('sirt_ac'); // klip koltuğu kendisi çeker ve çevirir (kayma, tut, don)
        else { // klip yoksa: durduğu yerde sırt açılır, koltuk oturma yerine kayıp döner (yer tutucu)
          koltuk.cevir = { x: koltuk.x, y: koltuk.y, rz: koltuk.rz };
          let t = 0;
          kilit = kare((dt) => { t += dt; koltuk.katlama = 1 - aralik(t, 0.2, 1.2); koltuk.cevirK = aralik(t, 1.2, 2.0); return t >= 2.0 ? 'tamam' : null; });
          await kilit;
          koltuk.cevirK = null;
          koltuk.cevir = null;
          Object.assign(koltuk, { x: YER.koltuk.x, y: YER.koltuk.y, rz: YER.koltuk.rz });
        }
        koltuk.katlama = 0;
        if (!d()) return;
      }
      if (koltuk.obj) {
        if (!(await yuru(oturmaYeri(), d))) return;
        await kilitli(oturAd, { solma: 0.3, onBasla: () => { koltuk.bagli = true; ben.yer = 'koltuk'; } });
        govdeyiKokeAktar(oturAd);
        if (!d()) return;
      }
    }
    if (ben.yer === 'koltuk') {
      if (!(await kaydir(YER.masa, d))) return;
      await masaDongusu(d);
    }
  }
  async function yukariCik(d) {
    bakis = null;
    if (ben.yer === 'koltuk') {
      if (!(await kaydir(oturuYer(), d))) return;
      await kilitli('kalk', { solma: 0.3 });
      koltuk.bagli = false;
      ben.yer = 'zemin';
      if (!d()) return;
    }
    await cik(d);
  }

  // Masa başı: yazar; ara ara emote; tepki; kadrajı kaplıyorsa kenara çekilir
  let sonEmote = null; // masada art arda aynı emote gelmesin
  async function masaDongusu(d) {
    await oynat('yaz', { solma: 0.5 });
    let sonraki = saat + rastgele(AYAR.bosta);
    while (d()) {
      if (kenarGerek()) {
        if (!(await kenaraCekil(d))) return;
        await oynat('yaz', { solma: 0.5 });
        sonraki = saat + rastgele(AYAR.bosta);
        continue;
      }
      const tp = tepkiler.shift();
      if (tp) { if (!(await dizi([tp], d))) return; await oynat('yaz', { solma: 0.5 }); sonraki = saat + rastgele(AYAR.bosta); continue; }
      if (saat >= sonraki) {
        // Ağırlıklı rastgele emote; bir önceki emote art arda gelmez
        const havuz = EMOTE.length > 1 ? EMOTE.filter(([, s]) => s !== sonEmote) : EMOTE;
        const top = havuz.reduce((s, [w]) => s + w, 0);
        let r = Math.random() * top, sec = havuz[0][1];
        for (const [w, s] of havuz) { if ((r -= w) < 0) { sec = s; break; } }
        sonEmote = sec;
        if (!(await dizi(sec, d))) return;
        await oynat('yaz', { solma: 0.5 });
        sonraki = saat + rastgele(AYAR.bosta);
        continue;
      }
      const r = await kare(() => (!d() || kenarGerek() || tepkiler.length || saat >= sonraki ? 'uyan' : null));
      if (!r) return;
    }
  }
  async function dizi(sira, d) {
    for (const x of sira) {
      const [ad, sure] = Array.isArray(x) ? x : [x];
      if (!var_(ad)) continue;
      if (!(await oynat(ad, { solma: 0.45, ...(sure ? { tekrar: true, sure } : { tekrar: false }) }, d))) return false;
    }
    return true;
  }
  async function kenaraCekil(d) {
    const kk = KENAR_KLIP.find(var_) ?? 'bekle';
    if (reduce) { yereKoy(YER.kenar); await oynat(kk, { solma: 0.01 }); } else if (!(await kaydir(YER.kenar, d, { hiz: AYAR.kenarHiz }))) return false;
    await oynat(kk, { tekrar: true, solma: 0.5 });
    bakis = 'urun';
    let bos = 0;
    const r = await kare((dt) => {
      if (!d()) return 'iptal';
      const tp = tepkiler.shift();
      if (tp) { oynat(tp, { solma: 0.4, tekrar: false }).then(() => d() && oynat(kk, { tekrar: true, solma: 0.5 })); }
      bos = kenarGerek() ? 0 : bos + dt;
      return bos > AYAR.kenarBekle ? 'tamam' : null;
    });
    bakis = null;
    if (r !== 'tamam') return false;
    if (reduce) { yereKoy(YER.masa); return true; }
    return kaydir(YER.masa, d);
  }

  // Hareketsiz yerleştirme (hareket azaltma; lab ?karakter=masa)
  function yereKoy(p) { ben.x = p.x; ben.y = p.y; ben.psi = p.psi; }
  function masayaKoy() {
    nesil++;
    kareler.clear(); // eski görevlerin kare işleri (kilitli klip dahil) bırakılır
    kilit = Promise.resolve();
    for (const ad of ['merdiven', 'ip']) if (arac[ad]) arac[ad].visible = false;
    yereKoy(YER.masa);
    ben.yer = 'koltuk';
    ben.gorunur = true;
    ben.dansBorcu = false;
    koltuk.katlama = 0;
    koltuk.bagli = true;
    const a = akt.get('yaz') ?? akt.get('bekle');
    if (a) {
      mixer.stopAllAction();
      akt.forEach((x) => { x.oynadi = false; });
      a.act.reset().setEffectiveWeight(1).play();
      a.act.timeScale = reduce ? 0 : 1;
      a.oynadi = true;
      simdiki = a;
    }
    if (!reduce) { const nes = nesil; masaDongusu(() => nes === nesil); }
  }

  // ---- kenara çekilme gereği: kadrajı masa başındaki karakterin kapladığı yakın planlar ----
  let kenarlar = null, kenarHesap = -99, kenarGorunur = new Set();
  const tmpKam = new THREE.PerspectiveCamera(), v3 = new THREE.Vector3();
  function kenarDuraklari() {
    if (!story) return [];
    if (kenarlar && saat - kenarHesap < 1) return kenarlar;
    kenarHesap = saat;
    const D = YER.masa, [fx, fy] = yon(D.psi);
    // Masa başındaki oturan karakterin kabaca noktaları: kalça, göğüs, kafa, omuzlar, dizler
    const N = [[0, 0, 620], [0, 0, 900], [0, -20, 1150], [170, 0, 980], [-170, 0, 980], [110, 300, 620], [-110, 300, 620]]
      .map(([sx, ileri, z]) => new THREE.Vector3(D.x + fy * -sx + fx * ileri, D.y + fx * sx + fy * ileri, z));
    const cam = story.camera;
    tmpKam.fov = cam.fov; tmpKam.aspect = cam.aspect; tmpKam.near = cam.near; tmpKam.far = cam.far; tmpKam.up.set(0, 0, 1);
    tmpKam.updateProjectionMatrix();
    kenarlar = [];
    kenarGorunur = new Set();
    const ana = new THREE.Vector3(...story.shotOf(null).pos); // genel planın kamerası
    const K = YER.kenar, [kx, ky] = yon(K.psi), NK = [[0, 600], [0, 900], [0, 1150], [-0.3, 500]].map(([ileri, z]) => new THREE.Vector3(K.x + kx * ileri * 1000, K.y + ky * ileri * 1000, z));
    for (const h of story.hotspots) {
      const s = story.shotOf(h.id);
      tmpKam.position.set(...s.pos);
      tmpKam.lookAt(...s.target);
      tmpKam.updateMatrixWorld(true);
      let yakin = 0, enYakin = Infinity;
      for (const p of N) {
        const uz = p.distanceTo(tmpKam.position);
        enYakin = Math.min(enYakin, uz);
        v3.copy(p).project(tmpKam);
        if (v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1 && uz < 1000) yakin++;
      }
      if (yakin >= 3 || enYakin < 450) kenarlar.push({ id: h.id, pos: new THREE.Vector3(...s.pos), u0: ana.distanceTo(tmpKam.position) });
      // Bu durağın kadrajına kenar yeri giriyor mu (oturan karakterin birkaç noktası)
      if (NK.some((p) => { v3.copy(p).project(tmpKam); return v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05 && p.distanceTo(tmpKam.position) < 4000; })) kenarGorunur.add(h.id);
    }
    return kenarlar;
  }
  // Gerek: yakın plan o durakta, kamera durağın yakınında ya da ona hızla yaklaşıyor (varış süresi kısa). Kare başına bir
  // kez hesaplanır (yaklaşma hızı iki kare arasındaki uzaklık farkından)
  let kenarSon = { saat: -1, sonuc: false }, uzOnce = null;
  function kenarGerek() {
    if (!story || ben.yer !== 'koltuk') return false;
    if (kenarSon.saat === saat) return kenarSon.sonuc;
    const ks = kenarDuraklari(), fid = story.focusedId, c = story.camera.position;
    const uz = new Map(ks.map((k) => [k.id, k.pos.distanceTo(c)])), dt = uzOnce ? saat - uzOnce.saat : 0;
    let sonuc = ks.some((k) => k.id === fid);
    // Yakınlık ve yaklaşma hızı girişten sonra: giriş uçuşu genel plana gider (yakın plana yaklaşıyor sanılmasın).
    // Kenar yeri odaktaki kadraja giriyorsa orada beklenmez
    if (!sonuc && story.ready !== false && !(fid && kenarGorunur.has(fid))) {
      sonuc = [...uz.values()].some((u) => u < AYAR.kenarYakin);
      // Yaklaşma hızı aynı durağın iki ölçümünden (liste ekran oranı değişince yeniden kurulur, sırası kayabilir); kamera
      // genel plandakinden belirgin yakına gelmeden sayılmaz: genel planda kameranın küçük ileri kaymaları (başla
      // düğmesinin önizlemesi, turun oturması) masa durağına yaklaşmak sanılmasın
      if (!sonuc && uzOnce && dt > 0) sonuc = ks.some((k) => {
        const u = uz.get(k.id), v = ((uzOnce.uz.get(k.id) ?? u) - u) / dt;
        return u < k.u0 * AYAR.kenarPay && v > 300 && u / v < AYAR.kenarOnce;
      });
    }
    uzOnce = { saat, uz };
    kenarSon = { saat, sonuc };
    return sonuc;
  }

  // ---- her kare ----
  const qTmp = new THREE.Quaternion(), qYaw = new THREE.Quaternion(), qPitch = new THREE.Quaternion(), qPar = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1), sag = new THREE.Vector3(), kafaW = new THREE.Vector3(), hedefW = new THREE.Vector3();
  const bak = { k: 0, yaw: 0, pitch: 0 }, kafaTaban = new THREE.Quaternion(), qInv = new THREE.Quaternion();
  let kafaDegisti = false;
  function update(t, dt) {
    dt *= AYAR.tempo;
    saat += dt;
    if (kafaDegisti) { kafa.quaternion.copy(kafaTaban); kafaDegisti = false; } // klip kafayı yazmasa da bakış birikmesin
    for (const f of [...kareler]) if (f(dt)) kareler.delete(f);
    // İnişte klibin zamanını ve kökün ek yüksekliğini biz veririz
    if (ben.inis && ben.yer === 'merdiven') {
      const s = ben.inis, r = s.durum(s.tau);
      s.a.act.time = r.zaman;
      s.a.ofz = r.ofz;
    }
    mixer.update(dt);
    // Kök: zeminde konum ve yön; yükseklik açık kliplerin ağırlıklı ortalaması (masa klipleri kökü koltuk yüksekliğine
    // kaldırır, iniş kendi yüksekliğini verir). Koltuk bağlıysa koltuğu taşıyan kliplerin söylediği yerde
    let zT = 0, zW = 0, iT = 0, kT = 0, kW = 0, sirtK = null, cevirK = null;
    for (const [ad, a] of akt) {
      const w = a.oynadi && a.act.enabled ? a.act.getEffectiveWeight() : 0;
      if (w < 1e-3) continue;
      const m = M.klip[ad] || {}, f = a.act.time * fps + 1;
      zT += w * (a.ofz ?? anahtar(m.z ?? 0, f));
      zW += w;
      iT += w * (a.ofIleri ?? anahtar(m.ileri ?? 0, f)); // gövdenin köke göre ileri kayması (otur2'nin başı)
      if (m.koltuk !== undefined) { kT += w * (a.ofKoltuk ?? anahtar(m.koltuk, f)); kW += w; }
      if (m.inis && !a.indi && w > 0.5 && f >= m.inis) { a.indi = true; oturmaEtkisi(); } // kalça koltuğa indi
      if (ad === 'sirt_ac' && w > 0.5) { sirtK = anahtar(m.sirt ?? 0, f); cevirK = m.cevir ? aralik(f, m.cevir[0], m.cevir[1]) : 0; }
    }
    // Kök kayması ve koltuğu tutma (sırt açma): klip yerinde canlanır, yürüyüşü ve koltuğun çekilip dönmesini site verir
    for (const [ad, a] of akt) {
      const m = M.klip[ad];
      if (!m || (!m.kayma && !m.tut) || !a.oynadi || !a.act.enabled) continue; // geçişte de: kayma sıçramasın
      const f = a.act.time * fps + 1, [fx, fy] = yon(ben.psi);
      if (m.kayma) {
        const v = anahtar(m.kayma, f), dv = v - (a.kayma ?? v);
        ben.x += fx * dv;
        ben.y += fy * dv;
        a.kayma = v;
      }
      if (m.tut && koltuk.obj) {
        const ic = f >= m.tut[0] && f <= m.tut[1];
        if (ic && !a.tutulan) { // tutulduğu an koltuğun köke göre yeri (karakterin yerel düzleminde)
          const dx = koltuk.x - ben.x, dy = koltuk.y - ben.y;
          a.tutulan = { ileri: dx * fx + dy * fy, yan: dx * fy - dy * fx, drz: fark(ben.psi + Math.PI, koltuk.rz) };
        }
        if (ic && a.tutulan) {
          const t = a.tutulan;
          koltuk.x = ben.x + fx * t.ileri + fy * t.yan;
          koltuk.y = ben.y + fy * t.ileri - fx * t.yan;
          koltuk.rz = ben.psi + Math.PI + t.drz + anahtar(m.don ?? 0, f);
        }
      }
    }
    yer.position.set(ben.x, ben.y, 0);
    yer.rotation.z = ben.psi;
    govde.position.z = zW ? zT / zW : 0;
    govde.position.y = zW ? -iT / zW : 0; // yerel −y bakış yönü
    yer.visible = ben.gorunur;
    if (koltuk.obj) {
      if (sirtK !== null) koltuk.katlama = sirtK;
      if (cevirK === null && koltuk.cevirK != null) cevirK = koltuk.cevirK;
      if (koltuk.cevir && cevirK !== null) { // sırt açılınca koltuğu biraz itip oturma yönüne çevirir
        const c = koltuk.cevir;
        koltuk.x = c.x + (YER.koltuk.x - c.x) * cevirK;
        koltuk.y = c.y + (YER.koltuk.y - c.y) * cevirK;
        koltuk.rz = c.rz + fark(c.rz, YER.koltuk.rz) * cevirK;
      }
      if (koltuk.bagli && kW > 0) {
        const g = kT / kW, [fx, fy] = yon(ben.psi);
        koltuk.x = ben.x - fx * g;
        koltuk.y = ben.y - fy * g;
        koltuk.rz = ben.psi + Math.PI;
      }
      koltuk.obj.position.x = koltuk.x;
      koltuk.obj.position.y = koltuk.y;
      koltuk.obj.rotation.z = koltuk.rz;
      // Katlı: sırt öne yatık, piston inik (masanın altına sığar); açılınca sırt dikilir, oturak kalkar
      if (koltuk.sirt) koltuk.sirt.rotation.x = AYAR.sirtDik + (koltuk.sirtKatli - AYAR.sirtDik) * koltuk.katlama;
      if (koltuk.ust) koltuk.ust.position.z = koltuk.ust0 * koltuk.katlama;
      if (etki) oturmaEtkisiUygula();
    }
    kafaCevir(dt);
  }
  // Kafa bakışı: kameraya (dans ederken, üzerine gelinince) ya da yakın plandaki ürüne (kenardayken); klibin üstüne eklenir
  function kafaCevir(dt) {
    const hedef = reduce || !story ? null : uzerinde ? 'kamera' : bakis;
    bak.k += ((hedef ? 1 : 0) - bak.k) * Math.min(1, dt * 3);
    if (!kafa || bak.k < 0.01 || !story) return;
    kafaTaban.copy(kafa.quaternion);
    kafaDegisti = true;
    yer.updateMatrixWorld(true);
    kafa.getWorldPosition(kafaW);
    if (hedef === 'urun') { if (xr.urun && xr.urunId === story.focusedId) hedefW.copy(xr.urun); } else if (hedef) hedefW.copy(story.camera.position);
    const dx = hedefW.x - kafaW.x, dy = hedefW.y - kafaW.y;
    const yaw = kenet(fark(ben.psi, aciOf(dx, dy)), -0.75, 0.75), pitch = kenet(Math.atan2(hedefW.z - kafaW.z, Math.hypot(dx, dy)), -0.35, 0.35);
    bak.yaw += (yaw - bak.yaw) * Math.min(1, dt * 4);
    bak.pitch += (pitch - bak.pitch) * Math.min(1, dt * 4);
    const [fx, fy] = yon(ben.psi);
    sag.set(fy, -fx, 0);
    qPitch.setFromAxisAngle(sag, bak.pitch * bak.k * 0.8);
    qYaw.setFromAxisAngle(Z, bak.yaw * bak.k);
    qTmp.multiplyQuaternions(qYaw, qPitch); // dünyada ek dönüş → kemiğin yerel uzayına: P⁻¹ q P L
    kafa.parent.getWorldQuaternion(qPar);
    qInv.copy(qPar).invert();
    kafa.quaternion.premultiply(qTmp.premultiply(qInv).multiply(qPar));
  }

  // ---- x-ray ve seyrelme: kamera güncellendikten sonra, çizimden hemen önce ----
  const bufBoy = new THREE.Vector2(), pUrun = new THREE.Vector3(), pE = new THREE.Vector3(), pB = new THREE.Vector3(), kutu = new THREE.Box3();
  const xr = { guc: 0, sol: 1, kareNo: -1, urun: null, urunId: null, urunT: -9, t: 0 };
  const fare = { x: 0, y: 0, zone: null, t: 0 }; // genel planda imleç (istemci koordinatı) ve altındaki ürün
  const fareDelikte = () => !!fare.zone && AYAR.fareDelik.includes(fare.zone);
  let kareNo = 0;
  function xrayHesapla(cam) {
    if (!story || !ben.gorunur) { XR.xrGuc.value = 0; XR.xrSol.value = 1; return; }
    const r = story.renderer;
    r.getDrawingBufferSize(bufBoy);
    const W = bufBoy.x, H = bufBoy.y, simdi = performance.now() / 1000, dt = Math.min(0.1, simdi - xr.t || 0.016);
    xr.t = simdi;
    // Seyrelme: kamera karakterin bir kemiğine çok yaklaştıysa (yakın plan uçuşu içinden geçiyor)
    let enYakin = Infinity;
    for (const b of kemikler) enYakin = Math.min(enYakin, b.getWorldPosition(pE).distanceTo(cam.position));
    const solHedef = reduce ? (enYakin < AYAR.yakin[0] ? 0 : 1) : aralik(enYakin, AYAR.yakin[1], AYAR.yakin[0]);
    xr.sol += (solHedef - xr.sol) * Math.min(1, dt * 14); // ~0,2 sn'de oturur (kare hızından bağımsız)
    XR.xrSol.value = xr.sol > 0.97 ? 1 : xr.sol;
    // Daire: yakın plandaki ürünün önünde karakterden ya da koltuktan bir parça varsa
    const id = story.focusedId;
    let ortu = false, rpx = 0;
    if (id) {
      if (xr.urunId !== id || saat - xr.urunT > 0.4) { xr.urun = story.api?.center(id) ?? null; xr.urunId = id; xr.urunT = saat; }
      if (xr.urun) {
        pUrun.copy(xr.urun).project(cam);
        const uzU = cam.position.distanceTo(xr.urun);
        const pxPerMm = H / 2 / (Math.tan((cam.fov * Math.PI) / 360) * uzU);
        rpx = kenet(150 * pxPerMm, 0.16 * Math.min(W, H), 0.34 * Math.min(W, H));
        const cx = (pUrun.x * 0.5 + 0.5) * W, cy = (pUrun.y * 0.5 + 0.5) * H;
        XR.xrMerkez.value.set(cx, cy);
        const dene = (p, yariMm) => {
          const uz = p.distanceTo(cam.position);
          if (uz > uzU - 40) return false;
          pE.copy(p).project(cam);
          if (pE.z > 1) return false;
          const px = (pE.x * 0.5 + 0.5) * W, py = (pE.y * 0.5 + 0.5) * H, pay = (yariMm * H) / 2 / (Math.tan((cam.fov * Math.PI) / 360) * uz);
          return Math.hypot(px - cx, py - cy) < rpx + pay;
        };
        for (const b of kemikler) if (dene(b.getWorldPosition(pB), 90)) { ortu = true; break; }
        if (!ortu && koltuk.obj) {
          kutu.setFromObject(koltuk.obj);
          for (let i = 0; i < 8 && !ortu; i++) ortu = dene(pB.set(i & 1 ? kutu.max.x : kutu.min.x, i & 2 ? kutu.max.y : kutu.min.y, i & 4 ? kutu.max.z : kutu.min.z), 60);
          if (!ortu) ortu = dene(kutu.getCenter(pB), 200);
        }
      }
    } else if (fareDelikte()) {
      // Genel planda fare masadaki ürünün (kartvizit, kalemlik, tuşlar) üzerinde: imlecin çevresinde ürünün uzaklığında
      // ~12 cm'lik daire karakteri ve koltuğu siler, arkadaki ürün görünür (karakter orada değilse daire görünmez)
      if (xr.urunId !== fare.zone || saat - xr.urunT > 0.4) { xr.urun = story.api?.center(fare.zone) ?? null; xr.urunId = fare.zone; xr.urunT = saat; }
      const uzU = xr.urun ? cam.position.distanceTo(xr.urun) : 1500, rc = r.domElement.getBoundingClientRect();
      rpx = Math.max(18, ((AYAR.fareCap / 2) * H) / 2 / (Math.tan((cam.fov * Math.PI) / 360) * uzU));
      XR.xrMerkez.value.set(((fare.x - rc.left) / rc.width) * W, (1 - (fare.y - rc.top) / rc.height) * H);
      ortu = true;
    }
    xr.guc +=((ortu ? 1 : 0) - xr.guc) * (reduce ? 1 : Math.min(1, dt * 10));
    XR.xrGuc.value = xr.guc < 0.01 ? 0 : xr.guc;
    XR.xrYaricap.value = rpx || XR.xrYaricap.value;
  }

  // ---- tıklama ve üzerine gelme: kemik noktalarına ışın uzaklığı ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function isinda(e) {
    if (!story || !ben.gorunur) return null;
    const el = story.renderer.domElement, rc = el.getBoundingClientRect();
    ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, story.camera);
    let en = null;
    for (const b of kemikler) {
      b.getWorldPosition(pE);
      const t = pE.clone().sub(ray.ray.origin).dot(ray.ray.direction);
      if (t <= 0) continue;
      if (ray.ray.distanceSqToPoint(pE) < 150 * 150 && (!en || t < en)) en = t;
    }
    return en;
  }
  function tepki(tur) {
    if (reduce || saat - sonTepki < AYAR.tepkiAra) return;
    if (ben.yer !== 'koltuk') return;
    if (tur === 'sablon' && Math.random() > AYAR.sablonTepki) return;
    sonTepki = saat;
    tepkiler = [tur === 'tik' ? (Math.random() < 0.6 ? 'sevin' : 'kafa_salla') : Math.random() < 0.5 ? 'sevin' : 'inanamama'];
  }

  // ---- dışarıya ----
  return {
    nesne: yer,
    // Sahneye ekler: koltuğu bulur (sırtını katlar), merdiveni ve ipi kurar, sahnenin karesine ve odaklarına bağlanır
    sahneye(scene, built) {
      sahne = scene;
      scene.add(yer);
      const k = scene.getObjectByName('koltuk');
      if (k) {
        koltuk.obj = k;
        koltuk.x = k.position.x; koltuk.y = k.position.y; koltuk.rz = k.rotation.z;
        // Koltuğun malzemeleri kopyalanır (aynı GLB'deki başka eşyalarla ortak olabilir), x-ray yalnız koltuğa
        const kopya = new Map();
        const kop = (m) => { if (!kopya.has(m)) kopya.set(m, xrayYama(m.clone())); return kopya.get(m); };
        k.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(kop) : kop(o.material); });
        // Masanın altına itilmiş hâli GLB'de (scripts/oda-blender.py koltuk_kur): sırt menteşede öne katlı, oturak inik
        const s = k.getObjectByName('koltuk_sirt'), u = k.getObjectByName('koltuk_ust');
        if (s) { koltuk.sirt = s; if (Math.abs(s.rotation.x) > 0.8) koltuk.sirtKatli = s.rotation.x; }
        if (u) { koltuk.ust = u; koltuk.ust0 = u.position.z; }
        // Minder (oturak, kenarı, paneli, kanatlar): oturuşta tabanı sabit ezilir; çöküş oturağın üstüne göre (kanatsız)
        koltuk.minder = [];
        u?.traverse((o) => { if (o.isMesh && /^koltuk_oturak/.test(o.name)) koltuk.minder.push({ m: o, z0: o.position.z }); });
        if (koltuk.minder.length) {
          const b = new THREE.Box3(), ust = new THREE.Box3();
          for (const p of koltuk.minder) {
            p.m.geometry.computeBoundingBox();
            b.union(p.m.geometry.boundingBox);
            if (!/kanat/.test(p.m.name)) ust.union(p.m.geometry.boundingBox);
          }
          koltuk.minderTaban = b.min.z;
          koltuk.minderBoy = ust.max.z - b.min.z;
        }
        koltuk.katlama = reduce ? 0 : 1; // ilk gelişte katlı (hareket azaltmada karakter zaten masada oturur)
      }
      // Merdiven (yangın kaçışı, balkonun sağ duvarında) ve ip: üst kattan iner, yukarı toplanır
      const metal = new THREE.MeshStandardMaterial({ color: 0x2a2b2d, metalness: 0.7, roughness: 0.42 });
      // Merdiven düzlemi xz (karakter +y'ye bakarak iner); basamaklar Blender'daki klibin basamaklarıyla aynı yükseklikte
      const MD = M.merdiven, boy = 3800, w = MD.en, parca = []; // tek ağ: ~40 parça tek çizim
      for (const sx of [-1, 1]) parca.push(new THREE.BoxGeometry(36, 24, boy).translate((sx * w) / 2, 0, boy / 2));
      for (let z = MD.ilk; z < boy; z += MD.aralik) parca.push(new THREE.CylinderGeometry(12, 12, w, 12).rotateZ(Math.PI / 2).translate(0, 0, z)); // silindir Y ekseninde: x'e çevir
      for (let z = 200; z < boy; z += 900) for (const sx of [-1, 1]) parca.push(new THREE.BoxGeometry(20, 50, 20).translate((sx * w) / 2, 30, z)); // korkuluğa tutturma
      const mr = new THREE.Mesh(mergeGeometries(parca), metal);
      parca.forEach((x) => x.dispose());
      mr.castShadow = true;
      mr.receiveShadow = true;
      mr.position.set(INIS_X, INIS_Y, 2600);
      mr.visible = false;
      const ip = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, boy, 10).rotateX(Math.PI / 2).translate(0, 0, boy / 2 + 40),
        new THREE.MeshStandardMaterial({ color: 0x9a8058, roughness: 0.92 }));
      ip.castShadow = true;
      ip.position.set(INIS_X + (M.ip.yan ?? 0), INIS_Y, 2600); // klipte ip kökün 240 mm önünde, 18 mm yanında
      ip.visible = false;
      scene.add(mr, ip);
      arac.merdiven = mr;
      arac.ip = ip;
      // Sahnenin karesine eklenir; x-ray kamera güncellendikten sonra, çizimden hemen önce hesaplanır
      const u0 = built.update?.bind(built);
      built.update = (t, dt) => { kareNo++; u0?.(t, dt); update(t, dt ?? 1 / 60); };
      const eski = scene.onBeforeRender;
      scene.onBeforeRender = (r, s, cam, rt) => {
        eski?.call(scene, r, s, cam, rt);
        if (xr.kareNo === kareNo) return; // bir karede birden çok çizim (ara görüntü geçişleri)
        xr.kareNo = kareNo;
        xrayHesapla(cam);
      };
    },
    // Denetleyici kurulunca: kamera, odak ve tıklamalar
    bagla(s) {
      story = s;
      kenarlar = null;
      const host = s.renderer?.domElement?.parentElement;
      if (!host) return;
      let sonHover = 0, asagiNokta = null;
      host.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || performance.now() - sonHover < 90) return;
        sonHover = performance.now();
        uzerinde = isinda(e) !== null;
      });
      // İmleç dairesi: konum her harekette, altındaki ürün ~60 ms'de bir (yakın planda kapalı; dokunmatikte fare yok)
      host.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        fare.x = e.clientX;
        fare.y = e.clientY;
        if (performance.now() - fare.t < 60) return;
        fare.t = performance.now();
        fare.zone = s.focusedId ? null : s.hit?.(e.clientX, e.clientY) ?? null;
      });
      host.addEventListener('pointerleave', () => { uzerinde = false; fare.zone = null; });
      host.addEventListener('pointerdown', (e) => { asagiNokta = [e.clientX, e.clientY]; }, true);
      // Karaktere tıklama ürüne gitmesin (önündeyse): yakalama evresinde durdurulur. İmleç dairesi açıkken ürün
      // görünür: tıklama ürüne gider
      host.addEventListener('pointerup', (e) => {
        if (!asagiNokta || Math.hypot(e.clientX - asagiNokta[0], e.clientY - asagiNokta[1]) > 8) return;
        if (fareDelikte()) return;
        const t = isinda(e);
        if (t === null) return;
        const z = s.hit?.(e.clientX, e.clientY), c = z && s.api?.center(z);
        if (c && c.distanceTo(s.camera.position) < t) return; // ürün önde
        e.stopPropagation();
        tepki('tik');
        uzerinde = true;
      }, true);
      // Şablon değişince ara sıra tepki (panelin onChange'i korunur)
      if (s.api) {
        let oc = s.api.onChange;
        const sar = (z, i) => { oc?.(z, i); tepki('sablon'); };
        Object.defineProperty(s.api, 'onChange', { configurable: true, get: () => sar, set: (f) => { oc = f; } });
      }
    },
    asagi() { yonet('oda'); },
    yukari() { if (reduce) { nesil++; ben.gorunur = false; ben.yer = 'ust'; return; } yonet('yukari'); },
    masayaKoy,
    get durum() { return { yer: ben.yer, x: Math.round(ben.x), y: Math.round(ben.y), psi: +ben.psi.toFixed(2), arac: ben.arac, klip: simdiki?.clip.name ?? null, koltuk: { katlama: koltuk.katlama, bagli: koltuk.bagli } }; },
    debug: { ben, koltuk, M, akt, oturAd, engeller, serbest: (a, b, E = engeller()) => serbest(a, b, E, AYAR.pay), yolBul: (a, b) => yolBul(a, b, engeller()), kenarDuraklari, XR, update },
  };
}
