// Oda karakterinin başsız durum makinesi testi (core/oda-karakter.js): iniş → masa, kenar ↔ üzerine gelince dönme,
// iptal (nesil), kalk ↔ otur, hareket azaltma. Sahte glTF: gerçek GLB'nin meta'sı ve klip adları/süreleri (yalnız JSON
// bölümü okunur, ağlar çözülmez), birkaç kemik ve yapay iniş eğrisi; sahte oda (katlı koltuk) ve sahte denetleyici
// (kamera, odak, duraklar). Saat sahte: her kare 1/60 sn, iki kare arasında bekleyen sözler boşaltılır (tarayıcının iki
// karesi arası gibi). Rastgele tohumlu; karakterin son seçimleri (localStorage) test bitince geri yazılır.
// Sayfa: lab/karakter-test.html (sonuç sayfada ve window.sonuc'ta). Görünmez Edge'de: python scripts/karakter-test.py
import * as THREE from 'three';
import { karakterOlustur, AYAR } from '../core/oda-karakter.js';
import { OLCU } from '../core/oda-olcu.js';
import { ENGEL, PORT } from '../core/oda-portfolyo.js';
import { BIGGIE_DURAK } from '../core/oda-yerler.js';

const KARE = 1 / 60;
const sonuc = [];
let grup = '';
const kontrol = (ad, kosul, ayrinti = '') => {
  sonuc.push({ grup, ad, gecti: !!kosul, ayrinti: typeof ayrinti === 'string' ? ayrinti : JSON.stringify(ayrinti) });
  return !!kosul;
};
const uzak = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fark = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
const DANS = /^dans_/;
// İzdeki klipler bu sırayla geçiyor mu (aralarında başkaları olabilir); öğe ad ya da düzenli ifade
function sirali(iz, beklenen) {
  let i = 0;
  for (const e of iz) if (i < beklenen.length && (typeof beklenen[i] === 'string' ? e.klip === beklenen[i] : beklenen[i].test(e.klip ?? ''))) i++;
  return i === beklenen.length;
}
const klipler = (iz) => iz.map((e) => e.klip).filter((k, i, a) => k !== a[i - 1]).join(' → ');

// İki kare arası: bekleyen bütün sözler (görevlerin await zinciri) boşalır. MessageChannel zamanlayıcı gibi kısılmaz
const kanal = new MessageChannel();
let uyan = null;
kanal.port1.onmessage = () => uyan?.();
const bosalt = () => new Promise((r) => { uyan = r; kanal.port2.postMessage(0); });

function tohumla(tohum) {
  let x = tohum;
  const asil = Math.random;
  Math.random = () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
  return () => { Math.random = asil; };
}

// ---- gerçek GLB'den yalnız meta ve klip süreleri ----
let bilgi = null;
async function glbBilgi() {
  const b = await (await fetch('../assets/oda/karakter.glb')).arrayBuffer();
  const dv = new DataView(b), n = dv.getUint32(12, true); // ilk bölüm JSON: uzunluk 12'de, veri 20'den
  const j = JSON.parse(new TextDecoder().decode(new Uint8Array(b, 20, n)));
  const sure = {};
  for (const a of j.animations ?? []) sure[a.name] = Math.max(...a.samplers.map((s) => j.accessors[s.input].max[0]));
  return { meta: j.scenes[0].extras?.karakter_meta ?? '{}', sure };
}

// ---- sahte glTF: kök → kalça → göğüs → kafa; klipler kalçanın yüksekliğini sürer ----
function sahteGltf() {
  const M = JSON.parse(bilgi.meta), fps = M.fps ?? 30;
  const scene = new THREE.Group();
  scene.userData.karakter_meta = bilgi.meta;
  const kemik = (ad, z, ust) => { const b = new THREE.Bone(); b.name = ad; b.position.z = z; ust?.add(b); return b; };
  const kok = kemik('kök', 0), kalca = kemik(M.kalca ?? 'kalça', 0.6, kok), gogus = kemik('göğüs', 0.25, kalca);
  const kafa = kemik(M.kafa ?? 'kafa', 0.3, gogus);
  const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2), n = geo.attributes.position.count;
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from({ length: n * 4 }, (_, i) => (i % 4 ? 0 : 1)), 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array.from({ length: n * 4 }, (_, i) => (i % 4 ? 0 : 1)), 4));
  const govde = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial());
  govde.add(kok);
  govde.bind(new THREE.Skeleton([kok, kalca, gogus, kafa]));
  scene.add(govde);
  // İniş kliplerinde kalça döngü boyunca 250 mm iner, son bölümde ayakta duruş yüksekliğine gelir (karakter birimi m)
  const animations = Object.entries(bilgi.sure).map(([ad, T]) => {
    const k = M.klip?.[ad], yol = `${kalca.name}.position`;
    const iz = k?.dongu
      ? new THREE.VectorKeyframeTrack(yol, [0, Math.min((k.dongu[1] - 1) / fps, T * 0.9), T], [0, 0, 1.0, 0, 0, 0.75, 0, 0, 0.6])
      : new THREE.VectorKeyframeTrack(yol, [0, T], [0, 0, 0.6, 0, 0, 0.6]);
    return new THREE.AnimationClip(ad, T, [iz]);
  });
  return { scene, animations };
}
// Sahte oda: masanın altına itilmiş katlı koltuk (sırt öne katlı, oturak inik), oda-blender.py'deki adlarla
function sahteOda() {
  const scene = new THREE.Scene(), C = OLCU.CHAIR;
  const koltuk = new THREE.Group(), ust = new THREE.Group(), sirt = new THREE.Group();
  koltuk.name = 'koltuk'; ust.name = 'koltuk_ust'; sirt.name = 'koltuk_sirt';
  koltuk.position.set(C.x, C.y, 0);
  koltuk.rotation.z = C.rz;
  ust.position.z = -70;
  sirt.rotation.x = -Math.PI / 2;
  const oturak = new THREE.Mesh(new THREE.BoxGeometry(500, 500, 80).translate(0, 0, 40), new THREE.MeshStandardMaterial());
  oturak.name = 'koltuk_oturak';
  ust.add(oturak, sirt);
  koltuk.add(ust);
  scene.add(koltuk);
  return scene;
}
// Sahte denetleyici: genel plan uzakta; klavye durağı masa başındaki karakteri kaplar (kenar gerekir), saksı kaplamaz
function sahteHikaye() {
  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 10, 60000);
  camera.up.set(0, 0, 1);
  const shots = {
    genel: { pos: [0, -4200, 1700], target: [-300, 1000, 900] },
    klavye: { pos: [-860, 420, 1250], target: [-855, 1340, 760] },
    saksi: { pos: [1300, 600, 1500], target: [1300, 1700, 900] },
  };
  camera.position.set(...shots.genel.pos);
  return { camera, focusedId: null, ready: true, hotspots: [{ id: 'klavye' }, { id: 'saksi' }], shotOf: (id) => shots[id ?? 'genel'] };
}

// Bir karakter ve onu kare kare süren saat. iz: klip ve yer değiştikçe { t, klip, yer } (t sahte saatin saniyesi)
function kur({ zorla = 'merdiven', otur = 'otur', reduce = false } = {}) {
  localStorage.setItem('oktos.karakter.son.otur', otur === 'otur' ? 'otur2' : 'otur'); // iki seçenekten öteki seçilir
  const k = karakterOlustur(sahteGltf(), { reduce, zorla });
  const hikaye = sahteHikaye();
  k.sahneye(sahteOda(), {});
  k.bagla(hikaye);
  const D = k.debug, iz = [];
  let t = 0;
  const adim = async () => {
    D.update(t, KARE);
    await bosalt();
    t += KARE;
    const d = k.durum, son = iz[iz.length - 1];
    if (!son || son.klip !== d.klip || son.yer !== d.yer) iz.push({ t, klip: d.klip, yer: d.yer });
  };
  const s = {
    k, D, hikaye, iz,
    get t() { return t; },
    async sure(sn) { for (let i = 0; i < Math.round(sn / KARE); i++) await adim(); },
    async kadar(f, sn = 60) { for (let i = 0; i < Math.round(sn / KARE) && !f(); i++) await adim(); return !!f(); },
  };
  return s;
}

// ---- senaryolar ----
async function inisMasa(zorla) {
  grup = `İniş → masa (${zorla})`;
  const s = kur({ zorla }), { k, D } = s, sa = D.M.klip.sirt_ac;
  k.asagi();
  let basta = null;
  await s.kadar(() => (basta ??= k.durum.klip === 'sirt_ac' ? { uz: uzak(D.ben, D.koltuk) } : null), 90);
  await s.kadar(() => k.durum.klip !== 'sirt_ac', 20);
  const birakti = { x: D.koltuk.x, y: D.koltuk.y };
  const vardi = await s.kadar(() => k.durum.klip === 'yaz', 60);
  kontrol('yaz klibine varır', vardi, `${s.t.toFixed(1)} sn (sahte iniş eğrisiyle)`);
  kontrol('sıra: iniş → dans → sırt açma → otur → kaydır → yaz', sirali(s.iz, [zorla, DANS, 'sirt_ac', /^otur2?$/, 'kaydir', 'yaz']), klipler(s.iz));
  kontrol('sırt açma kavrama uzaklığından başlar (meta)', basta && Math.abs(basta.uz - sa.kavrama) < 1, `${basta?.uz.toFixed(1)} mm, meta ${sa.kavrama}`);
  kontrol('klibin bıraktığı yer = türetilen koltuk yeri', uzak(birakti, D.koltukYeri) < 1, `${uzak(birakti, D.koltukYeri).toFixed(2)} mm`);
  kontrol('koltuk masadan düz çekildi', Math.abs(D.koltukYeri.x - OLCU.CHAIR.x) < 1e-6 && OLCU.CHAIR.y - D.koltukYeri.y > 300, D.koltukYeri);
  kontrol('masa başında, koltuk bağlı', uzak(D.ben, D.YER.masa) < 1 && D.koltuk.bagli && D.koltuk.katlama === 0, k.durum);
  kontrol('açık sırt OLCU.CHAIR.sirtDik', Math.abs(D.koltuk.sirt.rotation.x - OLCU.CHAIR.sirtDik) < 1e-9, D.koltuk.sirt.rotation.x);
  kontrol('tek bekleyen kare işi (masa döngüsü)', D.bekleyen() === 1, D.bekleyen());
}

async function kenarDonme() {
  grup = 'Kenar ↔ üzerine gelince dönme';
  const s = kur(), { k, D, hikaye } = s, Y = D.YER, n = k.nesne;
  k.masayaKoy();
  await s.sure(0.5);
  D.fare.zone = 'kalemlik';
  await s.sure(0.1);
  kontrol('üstünden geçerken dönmez (donBekle)', D.donus.hedef === 0, D.donus.hedef);
  await s.sure(1.5);
  kontrol('fare gizli üründe: koltukla döner, yazmayı bırakır', Math.abs(D.donus.a - AYAR.donDurak.kalemlik) < 0.03 && k.durum.klip === 'bekle', `${D.donus.a.toFixed(3)} ${k.durum.klip}`);
  kontrol('dönüş yere yazılır: oturak ekseni çevresinde, ψ + dönüş', Math.abs(n.rotation.z - D.ben.psi - D.donus.a) < 1e-6
    && Math.abs(uzak(n.position, D.koltuk) - uzak(D.ben, D.koltuk)) < 1e-6 && Math.abs(D.koltuk.ust.rotation.z - D.donus.a) < 1e-6,
  `ψ ${D.ben.psi.toFixed(3)} yer ${n.rotation.z.toFixed(3)} oturak ${D.koltuk.ust.rotation.z.toFixed(3)}`);
  // Yakın plan gelince (dönükken): dönüş bırakılır, koltuk kenara kayar
  hikaye.focusedId = 'klavye';
  const t0 = s.t;
  const vardi = await s.kadar(() => uzak(D.ben, Y.kenar) < 5 && k.durum.klip !== 'kaydir', 5);
  const T = (Math.max(uzak(Y.masa, Y.kenar) / AYAR.hizKaydir, Math.abs(fark(Y.masa.psi, Y.kenar.psi)) / AYAR.donusKaydir) / AYAR.kenarHiz + 0.4) / AYAR.tempo;
  kontrol('yakın planda kenara kayar (~1,3 sn)', vardi && Math.abs(s.t - t0 - T) < 0.1, `${(s.t - t0).toFixed(2)} sn, beklenen ${T.toFixed(2)}`);
  kontrol('imleç sıfırlandı, dönüş hedefi yok', D.fare.zone === null && D.donus.hedef === 0, `${D.fare.zone} ${D.donus.hedef}`);
  D.fare.zone = 'kalemlik';
  await s.sure(1);
  kontrol('yakın plandayken fare döndürmez', D.donus.hedef === 0 && Math.abs(D.donus.a) < 0.05 && k.durum.klip === 'muzik', `${D.donus.a.toFixed(3)} ${k.durum.klip}`);
  // Yakın plan gidince masaya döner; dönme yeniden çalışır
  hikaye.focusedId = null;
  const dondu = await s.kadar(() => uzak(D.ben, Y.masa) < 1 && k.durum.klip === 'yaz', 8);
  kontrol('yakın plan gidince masaya döner', dondu, `${k.durum.klip} ${uzak(D.ben, Y.masa).toFixed(0)} mm`);
  D.fare.zone = 'klavye';
  await s.sure(1.5);
  kontrol('masada yeniden döner (klavye: saat yönünde)', Math.abs(D.donus.a - AYAR.donDurak.klavye) < 0.03, D.donus.a.toFixed(3));
  D.fare.zone = null;
  await s.sure(0.2);
  kontrol('fare kısa ayrılınca dönük kalır (donBirak)', D.donus.hedef === AYAR.donDurak.klavye, D.donus.hedef);
  await s.sure(1.5);
  kontrol('fare gidince geri döner, yazmaya döner', Math.abs(D.donus.a) < 0.03 && k.durum.klip === 'yaz', `${D.donus.a.toFixed(3)} ${k.durum.klip}`);
  hikaye.focusedId = 'saksi';
  await s.sure(2);
  kontrol('karakteri kaplamayan durakta masada kalır', uzak(D.ben, Y.masa) < 1 && k.durum.klip === 'yaz', k.durum);
  kontrol('tek bekleyen kare işi', D.bekleyen() === 1, D.bekleyen());
}

async function iptal() {
  grup = 'İptal (nesil)';
  let s = kur({ zorla: 'merdiven' }), { k, D } = s;
  k.asagi();
  await s.kadar(() => k.durum.yer === 'merdiven' && D.ben.inis.tau > D.ben.inis.T * 0.5, 60);
  const tau0 = D.ben.inis.tau;
  k.yukari();
  await s.sure(0.5);
  kontrol('merdivenin ortasında yukarı: kaldığı yerden tırmanır', D.ben.inis.tau < tau0 && k.durum.yer === 'merdiven', `τ ${tau0.toFixed(2)} → ${D.ben.inis.tau.toFixed(2)}`);
  const ustte = await s.kadar(() => k.durum.yer === 'ust', 60);
  kontrol('üst kata varır, görünmez', ustte && !D.ben.gorunur, k.durum);
  await s.sure(0.2);
  kontrol('araç toplanıyor', D.ben.arac === 'merdiven', D.ben.arac);
  const i0 = s.iz.length;
  k.asagi(); // toplanırken
  let vardi = await s.kadar(() => k.durum.klip === 'yaz', 120);
  const yeni = s.iz.slice(i0);
  kontrol('toplanırken aşağı: aynı araçla iner, dans eder, oturur', vardi && D.ben.arac === 'merdiven' && sirali(yeni, ['merdiven', DANS, 'sirt_ac', /^otur2?$/, 'yaz']), klipler(yeni));
  kontrol('tek bekleyen kare işi', D.bekleyen() === 1, D.bekleyen());

  s = kur({ zorla: 'ip' }); ({ k, D } = s);
  k.asagi();
  await s.kadar(() => k.durum.yer === 'zemin' && k.durum.klip === 'yuru', 60);
  await s.sure(1);
  k.yukari();
  const merdivende = await s.kadar(() => k.durum.yer === 'merdiven', 30);
  const inisY = OLCU.BALCONY.y1 - 40 - D.M.ip.mesafe;
  kontrol('yürürken yukarı: iniş yerine döner', merdivende && Math.abs(D.ben.y - inisY) < 1, `y ${D.ben.y.toFixed(1)}, beklenen ${inisY}`);
  const ust2 = await s.kadar(() => k.durum.yer === 'ust' && D.ben.arac === null, 60);
  kontrol('tırmanır, ip toplanır, dans etmeden', ust2 && !s.iz.some((e) => DANS.test(e.klip ?? '')), klipler(s.iz));

  s = kur(); ({ k, D } = s);
  k.asagi(); k.yukari(); k.asagi(); // aynı karede: yalnız son görev yürür
  vardi = await s.kadar(() => k.durum.klip === 'yaz', 120);
  kontrol('art arda aşağı, yukarı, aşağı: bir kez iner, oturur', vardi && s.iz.filter((e) => DANS.test(e.klip ?? '')).length === 1 && D.bekleyen() === 1, klipler(s.iz));
}

async function kalkOtur(otur) {
  grup = `Kalk ↔ otur (${otur})`;
  let s = kur({ otur }), { k, D } = s;
  kontrol('oturma klibi', D.oturAd === otur, D.oturAd);
  k.masayaKoy();
  await s.sure(0.5);
  k.yukari();
  await s.kadar(() => k.durum.klip === 'kalk', 15);
  await s.sure(0.3);
  let i0 = s.iz.length, kalkEn = 0;
  const kalkT = D.akt.get('kalk').clip.duration;
  k.asagi(); // kalkarken
  const vardi = await s.kadar(() => {
    if (k.durum.klip === 'kalk') kalkEn = Math.max(kalkEn, D.akt.get('kalk').act.time);
    return k.durum.klip === 'yaz';
  }, 60);
  let yeni = s.iz.slice(i0);
  kontrol('kalkarken aşağı: kalkış biter, yeniden oturur', vardi && kalkEn >= kalkT - 0.05 && sirali(yeni, [otur, 'kaydir', 'yaz'])
    && !yeni.some((e) => /merdiven|^ip$|sirt_ac|dans_/.test(e.klip ?? '')), `${klipler(yeni)}; kalk ${kalkEn.toFixed(2)}/${kalkT.toFixed(2)} sn`);
  kontrol('masa başında, koltuk klibin dediği uzaklıkta', uzak(D.ben, D.YER.masa) < 1 && D.koltuk.bagli
    && Math.abs(uzak(D.koltuk, D.ben) - Math.abs(D.M.klip.yaz.koltuk)) < 1, `${uzak(D.koltuk, D.ben).toFixed(1)} mm`);

  s = kur({ otur }); ({ k, D } = s);
  k.asagi();
  await s.kadar(() => k.durum.klip === otur, 90);
  await s.sure(0.3);
  i0 = s.iz.length;
  let oturEn = 0;
  const oturT = D.akt.get(otur).clip.duration;
  k.yukari(); // otururken
  const ustte = await s.kadar(() => {
    if (k.durum.klip === otur) oturEn = Math.max(oturEn, D.akt.get(otur).act.time);
    return k.durum.yer === 'ust' && D.ben.arac === null;
  }, 90);
  yeni = s.iz.slice(i0);
  kontrol('otururken yukarı: oturuş biter, kalkıp tırmanır', ustte && oturEn >= oturT - 0.05 && sirali(yeni, ['kalk', 'yuru', 'merdiven']),
    `${klipler(yeni)}; ${otur} ${oturEn.toFixed(2)}/${oturT.toFixed(2)} sn`);
  kontrol('koltuk bırakıldı', !D.koltuk.bagli, D.koltuk.bagli);
}

// ---- v7 klip sözleşmesi (GLB'nin kendisinden): armut_* ve diz zinciri klipleri, meta alanları, zincir uçlarının aynı poz olması ----
// Uç uyumu GLB'nin hayvan verisinden bağımsız ölçülür: A klibinin son örneği ile B'nin ilk örneği, kanal kanal (kanal klipte
// yoksa düğümün dinlenme değeri). Dönüş: en büyük açı (derece); yer: en büyük fark (karakter birimi × 1500 = mm).
async function glbKanallar() {
  const b = await (await fetch('../assets/oda/karakter.glb')).arrayBuffer();
  const dv = new DataView(b), n = dv.getUint32(12, true);
  const j = JSON.parse(new TextDecoder().decode(new Uint8Array(b, 20, n)));
  const binBas = 20 + n + 8;
  const oku = (ai) => {
    const a = j.accessors[ai], v = j.bufferViews[a.bufferView], k = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
    const bas = binBas + (v.byteOffset ?? 0) + (a.byteOffset ?? 0), adim = v.byteStride ?? k * 4, out = [];
    for (let i = 0; i < a.count; i++) { const e = []; for (let c = 0; c < k; c++) e.push(dv.getFloat32(bas + i * adim + c * 4, true)); out.push(e); }
    return out;
  };
  const klip = {};
  for (const a of j.animations ?? []) {
    const ch = {};
    for (const c of a.channels) {
      if (c.target.path === 'scale' || c.target.path === 'weights') continue;
      const s = a.samplers[c.sampler], o = oku(s.output);
      ch[`${c.target.node}/${c.target.path}`] = { ilk: o[0], son: o[o.length - 1] };
    }
    klip[a.name] = ch;
  }
  return { j, klip };
}
function ucFarki(G, a, b) {
  const A = G.klip[a], B = G.klip[b];
  let der = 0, mm = 0, nerede = '';
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const [nd, yol] = k.split('/'), node = G.j.nodes[+nd];
    const dn = yol === 'rotation' ? (node.rotation ?? [0, 0, 0, 1]) : (node.translation ?? [0, 0, 0]);
    const x = A[k]?.son ?? dn, y = B[k]?.ilk ?? dn;
    if (yol === 'rotation') {
      const d = Math.min(1, Math.abs(x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3])), aci = (2 * Math.acos(d) * 180) / Math.PI;
      if (aci > der) { der = aci; nerede = node.name; }
    } else {
      const u = Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 1500;
      if (u > mm) mm = u;
    }
  }
  return { der, mm, nerede };
}
async function sozlesme7() {
  grup = 'Klip sözleşmesi v7 (GLB)';
  const M = JSON.parse(bilgi.meta), K = M.klip ?? {}, S = bilgi.sure;
  const yeni = ['armut_yat', 'armut_uyukla', 'armut_kalk', 'diz_bekle', 'kutu_cevir_sag', 'kutu_cevir_sol', 'kutu_rafa_birak'];
  kontrol('yeni klipler GLB\'de (animasyon + meta)', yeni.every((a) => S[a] > 0 && K[a]), yeni.filter((a) => !(S[a] > 0 && K[a])).join(', '));
  kontrol('tv_armut kalktı, takma adı armut_* üçlüsü', !S.tv_armut && JSON.stringify(M.takma_ad?.tv_armut) === JSON.stringify(['armut_yat', 'armut_uyukla', 'armut_kalk']), M.takma_ad);
  const g = K.armut_yat?.armut?.gomulu ?? {};
  // v8.2 (05.11): armut daha alçak ve yatık ezilir (oturak 250, sırt 560, 48°), tepe yayılır (ust_yayilma), ortası çukur (cukur_mm)
  kontrol('armut.gomulu v8.2: oturak 250, sırt 560, sırt 45–52°, yayılma ve çukur', g.oturak_mm === 250 && g.sirt_mm === 560 && g.sirt_egim_derece >= 45 && g.sirt_egim_derece <= 52
    && g.ust_yayilma > 0 && g.cukur_mm > 0 && g.z_harita?.length === 3 && g.z_harita[1][0] > 400 && g.z_harita[2][0] > g.z_harita[1][0], g);
  const yeni82 = ['bust_al_alt', 'bust_al_orta', 'bust_birak_alt', 'bust_birak_orta', 'bust_tut', 'bust_tut_yuru', 'fare', 'elma_isir_1', 'elma_isir_2', 'elma_isir_3', 'elma_isir_4', 'elma_tut', 'elma_tut_yuru'];
  kontrol('v8.2 klipleri GLB\'de (animasyon + meta), soketler', yeni82.every((a) => S[a] > 0 && K[a]) && K.bust_tut?.bust?.el_yerel?.length === 3 && K.fare?.fare?.el_yerel_q?.length === 4
    && K.yaz?.tus?.length > 50, yeni82.filter((a) => !(S[a] > 0 && K[a])).join(', '));
  const egri = (a) => K[a]?.armut?.ezilme_egrisi ?? [];
  const tekdu = (e, yon) => e.every((p, i) => i === 0 || (yon > 0 ? p[1] >= e[i - 1][1] - 1e-9 : p[1] <= e[i - 1][1] + 1e-9));
  const icinde = (e, a) => e.every(([f, t]) => f >= 1 && (f - 1) / 30 <= S[a] + 2 / 30 + 1e-6 && t >= 0 && t <= 1);
  const ey = egri('armut_yat'), eu = egri('armut_uyukla'), ek = egri('armut_kalk');
  kontrol('ezilme_egrisi armut_yat: 0 → 1, azalmaz', ey.length > 10 && ey[0][1] === 0 && ey.at(-1)[1] === 1 && tekdu(ey, 1) && icinde(ey, 'armut_yat'), ey.length);
  kontrol('ezilme_egrisi armut_uyukla: hep 1', eu.length >= 2 && eu.every((p) => p[1] === 1), eu);
  kontrol('ezilme_egrisi armut_kalk: 1 → 0, artmaz', ek.length > 10 && ek[0][1] === 1 && ek.at(-1)[1] === 0 && tekdu(ek, -1) && icinde(ek, 'armut_kalk'), ek.length);
  kontrol('döngüler: armut_uyukla, diz_bekle tekrar', K.armut_uyukla?.tekrar === true && K.diz_bekle?.tekrar === true);
  for (const [a, yon] of [['kutu_cevir_sag', -1], ['kutu_cevir_sol', 1]]) {
    const d = K[a]?.kutu?.don ?? [], el = K[a]?.kutu?.elde ?? {};
    const sure = Object.values(el).flat().every(([x, y]) => x >= 1 && y > x && (y - 1) / 30 <= S[a] + 1e-6);
    kontrol(`${a}: kutu 0 → ${90 * yon}°, tekdüze, eller elde aralığında`, d.length > 10 && d[0][1] === 0 && d.at(-1)[1] === 90 * yon && tekdu(d, yon) && sure
      && Object.keys(el).length === 2 && S[a] >= 1 && S[a] <= 1.6, `${d.at(-1)?.[1]} ${JSON.stringify(el)} ${S[a]?.toFixed(2)} sn`);
  }
  const kb = K.kutu_rafa_birak?.kutu ?? {}, ka = K.kutu_al_diz?.kutu ?? {};
  kontrol('kutu_rafa_birak: raftan alır, kutu_al_diz\'in gözüne koyar', K.kutu_rafa_birak?.al < K.kutu_rafa_birak?.birak
    && JSON.stringify(kb.ust_merkez) === JSON.stringify(ka.ust_merkez) && JSON.stringify(kb.ic_merkez) === JSON.stringify(ka.ic_merkez), kb);
  const G = await glbKanallar();
  const ciftler = [['diz_cok', 'kutu_al_diz'], ['kutu_al_diz', 'diz_bekle'], ['diz_bekle', 'diz_bekle'], ['diz_bekle', 'kutu_cevir_sag'], ['kutu_cevir_sag', 'diz_bekle'],
    ['diz_bekle', 'kutu_cevir_sol'], ['kutu_cevir_sol', 'diz_bekle'], ['diz_bekle', 'kutu_rafa_birak'], ['kutu_rafa_birak', 'kutu_al_diz'], ['kutu_rafa_birak', 'diz_kalk'],
    ['diz_bekle', 'diz_kalk'], ['armut_yat', 'armut_uyukla'], ['armut_uyukla', 'armut_uyukla'], ['armut_uyukla', 'armut_kalk']];
  for (const [a, b] of ciftler) {
    if (!G.klip[a] || !G.klip[b]) { kontrol(`uç uyumu ${a} → ${b}`, false, 'klip yok'); continue; }
    const f = ucFarki(G, a, b);
    kontrol(`uç uyumu ${a} → ${b} (≤ 2°, ≤ 5 mm)`, f.der <= 2 && f.mm <= 5, `${f.der.toFixed(2)}° (${f.nerede}), ${f.mm.toFixed(1)} mm`);
  }
}

// v8 (2026-11-04): armut sol duvarın önüne taşındı, kara tahta kalktı. Odanın ortasından (sunumda Biggie'nin beklediği
// yer) her durağın duruş yerine engellere (PORT ENGEL dahil) değmeyen yol var; armudun oturuş kökü (eksenin 515 mm önü)
// armut engelinin dışında
async function yolV8() {
  grup = 'Yol ve engeller (v8)';
  const { k, D } = kur({ zorla: 'merdiven' });
  k.sunumAyar({ engel: ENGEL });
  const E = D.engeller(), bas = { x: 520, y: 760 };
  const A = PORT.armut, on = [Math.sin(A.rz), -Math.cos(A.rz)], kok = { x: A.x + on[0] * 515, y: A.y + on[1] * 515 };
  const hedefler = { armut: kok, ...Object.fromEntries(BIGGIE_DURAK.filter((d) => !d.capa && d.id !== 'masa').map((d) => [d.id, { x: d.yer[0], y: d.yer[1] }])) };
  const yok = [];
  for (const [id, h] of Object.entries(hedefler)) {
    const yol = D.yolBul(bas, h, E);
    if (!yol || !yol.length) yok.push(id);
  }
  kontrol('ortadan her durağa yol var (armut kökü, kitaplık, kutu oyunları, buzdolabı, çöp)', !yok.length, yok);
  kontrol('armudun oturuş kökü armudun engelinin (420 mm) dışında', Math.hypot(kok.x - A.x, kok.y - A.y) > 420, kok);
  kontrol('kara tahta engeli ve durağı yok', !ENGEL.some((e) => e.ad === 'tahta') && !BIGGIE_DURAK.some((d) => d.id === 'hakkimda'));
}

async function azalt() {
  grup = 'Hareket azaltma';
  const s = kur({ reduce: true }), { k, D, hikaye } = s;
  k.asagi();
  await s.sure(0.5);
  kontrol('aşağı: doğrudan masada, masa döngüsü başlamaz', k.durum.yer === 'koltuk' && uzak(D.ben, D.YER.masa) < 1 && D.bekleyen() === 0, `${k.durum.yer} bekleyen ${D.bekleyen()}`);
  hikaye.focusedId = 'klavye';
  await s.sure(3);
  kontrol('yakın planda kenara çekilmez', uzak(D.ben, D.YER.masa) < 1, k.durum);
  k.yukari();
  await s.sure(0.2);
  kontrol('yukarı: görünmez, üstte', k.durum.yer === 'ust' && !D.ben.gorunur && D.bekleyen() === 0, k.durum);
}

// ---- çalıştır ----
function goster(o) {
  document.getElementById('ozet').textContent = `${o.kaldi ? 'KALDI' : 'GEÇTİ'}: ${o.gecti} geçti, ${o.kaldi} kaldı (${o.sn} sn)`;
  const liste = document.getElementById('liste');
  let son = null;
  for (const r of o.sonuc) {
    if (r.grup !== son) { const h = document.createElement('div'); h.className = 'grup'; h.textContent = r.grup; liste.append(h); son = r.grup; }
    const d = document.createElement('div');
    d.className = `s ${r.gecti ? 'g' : 'k'}`;
    const b = document.createElement('b'), ad = document.createElement('span'), ay = document.createElement('span');
    b.textContent = r.gecti ? '✓' : '✗';
    ad.textContent = r.ad;
    ay.className = 'ay';
    ay.textContent = r.ayrinti;
    d.append(b, ad, ay);
    liste.append(d);
  }
}
async function calistir() {
  const anahtarlar = ['otur', 'dans', 'inis'].map((a) => `oktos.karakter.son.${a}`);
  const sakli = anahtarlar.map((a) => localStorage.getItem(a));
  const uyari = [], eski = { warn: console.warn, error: console.error };
  console.warn = (...a) => { uyari.push(a.map(String).join(' ')); eski.warn(...a); };
  console.error = (...a) => { uyari.push(a.map((x) => x?.stack ?? String(x)).join(' ')); eski.error(...a); };
  const geri = tohumla(20261020), t0 = performance.now();
  try {
    bilgi = await glbBilgi();
    const senaryo = [() => inisMasa('merdiven'), () => inisMasa('ip'), kenarDonme, iptal, () => kalkOtur('otur'), () => kalkOtur('otur2'), azalt, sozlesme7, yolV8];
    for (const f of senaryo) {
      try { await f(); } catch (e) { kontrol('beklenmeyen hata', false, e?.stack ?? String(e)); }
    }
    grup = 'Genel';
    kontrol('konsolda uyarı ya da hata yok (görev hataları console.error ile yutulur)', uyari.length === 0, uyari.slice(0, 3).join(' | '));
  } catch (e) {
    grup = 'Genel';
    kontrol('GLB bilgisi okunur', false, e?.stack ?? String(e));
  } finally {
    geri();
    Object.assign(console, eski);
    anahtarlar.forEach((a, i) => (sakli[i] === null ? localStorage.removeItem(a) : localStorage.setItem(a, sakli[i])));
  }
  const o = { gecti: sonuc.filter((r) => r.gecti).length, kaldi: sonuc.filter((r) => !r.gecti).length, sn: +((performance.now() - t0) / 1000).toFixed(1), sonuc };
  goster(o);
  window.sonuc = o;
  if (new URLSearchParams(location.search).has('bildir')) await fetch('/sonuc', { method: 'POST', body: JSON.stringify(o) }).catch(() => {});
}
calistir();
