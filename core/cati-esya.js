// Çatı katı eşyaları (kodla kurulur; dış model ve doku yok, dokular kanvasla çizilir):
//  - teleskop(): kafes gövdeli büyük Dobson (18", f/4,2 sınıfı). Huş kontrplak ayna kutusu (içinde açıkta ana ayna),
//    iki büyük yükseklik yatağı (Ø 620, kenarı kara laminat), rocker box ve zemin tablası (teflon pedler), 8 siyah eloksal
//    kafes borusu, üst kafes (iki halka, ışık perdesi, örümcek ayaklı 45° ikinci ayna, odaklayıcı ve göz merceği, 8×50
//    arayıcı dürbün, kırmızı nokta bulucu), mercek rafı ve iki basamaklı gözlem taburesi. Ana ayna düzlem yansıtıcı:
//    ikinci aynayı, örümceği, kafes borularını keskin yansıtır (görünürken her karede teleskobun kendi katmanını bir kez
//    daha çizer; AYNA_KATMANI).
//  - armut(): Türkiye'deki armut koltuk (6 dilimli, biyeli dikişler, tepede tutma kulpu). Önü oturulmuş (çökük), tepesi
//    arkaya yatık; kumaş kıvrımları köşe kaydırmasıyla, iplik dokusu kanvastan normal haritasıyla (keten ya da kadife).
//  - camSehpa(): yuvarlak temperli cam içecek sehpası (pirinç ayaklar, alt cam raf), üstünde çay takımı ve şeker kâsesi,
//    alt rafta kitap.
// Her eşya malzemeye göre birleştirilir (eşya başına birkaç çizim çağrısı). Birim mm, Z yukarı, +x doğu, +y kuzey; her
// eşyanın orijini zemindeki taban merkezi. Önizleme .impeccable/onizleme/esya.html (yerel); sahneye bağlamak
// core/cati-sahne.js'in işi.
import * as THREE from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const D2R = Math.PI / 180;

// ---- yardımcılar ----
const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const doku = (c, { tekrar = true, srgb = true } = {}) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (tekrar) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};
// Tohumlu rastgele (her açılışta aynı biçim)
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const yumus = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const v3 = (a) => (a.isVector3 ? a : new THREE.Vector3(...a));
const ile = (...m) => m.reduce((a, b) => a.clone().multiply(b));
const otele = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
// Şekil (x, y) düzleminde çizilip z boyunca çekilen levhayı yana çevirir: şeklin x'i → y, y'si → z, kalınlık → x
const YANA = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);

// İki nokta arasında silindir (boru, ayak, mil); r1 a ucunda, r2 b ucunda
function cubuk(a, b, r1, r2 = r1, seg = 12) {
  const A = v3(a), B = v3(b), L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2, r1, L, seg).translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  return g.translate(A.x, A.y, A.z);
}
// Profili Z ekseni çevresinde döndürür ([yarıçap, yükseklik] çiftleri)
function donme(profil, seg = 64) {
  const g = new THREE.LatheGeometry(profil.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2); // three.js Y ekseninde döndürür; sahne Z yukarı
  return g;
}
// Yuvarlak uçlu oluk deliği (şekil deliği): ya..yb arasında, zc ekseninde, yarıçap rr
const oluk = (ya, yb, zc, rr) => new THREE.Path().absarc(ya, zc, rr, Math.PI / 2, Math.PI * 1.5, false).lineTo(yb, zc - rr)
  .absarc(yb, zc, rr, -Math.PI / 2, Math.PI / 2, false).closePath();
// Birleştirmeye hazır geometri: indekssiz, yalnız konum, normal, uv (renk istenirse o da)
function hazir(g, renk = false) {
  const h = g.index ? g.toNonIndexed() : g;
  const kal = renk ? ['position', 'normal', 'uv', 'color'] : ['position', 'normal', 'uv'];
  for (const ad of Object.keys(h.attributes)) if (!kal.includes(ad)) h.deleteAttribute(ad);
  if (!h.attributes.uv) h.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(h.attributes.position.count * 2), 2));
  h.clearGroups();
  return h;
}
// Geometrinin malzeme gruplarını ayrı geometrilere böler (ExtrudeGeometry: 0 kapak, 1 yan; Box: 0..5 = +x −x +y −y +z −z;
// Cylinder: 0 yan, 1 üst kapak, 2 alt kapak)
function grupla(g) {
  const ni = g.index ? g.toNonIndexed() : g, sonuc = {};
  for (const gr of ni.groups) {
    const parca = new THREE.BufferGeometry();
    for (const [ad, at] of Object.entries(ni.attributes)) {
      const n = at.itemSize;
      parca.setAttribute(ad, new THREE.BufferAttribute(at.array.slice(gr.start * n, (gr.start + gr.count) * n), n));
    }
    (sonuc[gr.materialIndex] ??= []).push(parca);
  }
  for (const k in sonuc) sonuc[k] = sonuc[k].length > 1 ? mergeGeometries(sonuc[k]) : sonuc[k][0];
  return sonuc;
}
// Malzeme adına göre geometri toplar; sonunda her malzemeye tek ağ (bir çizim çağrısı)
function kova() {
  const p = {};
  return {
    ekle(ad, g, M = null) { const h = hazir(g); if (M) h.applyMatrix4(M); (p[ad] ??= []).push(h); },
    aglar(mats, golgesiz = []) {
      return Object.entries(p).map(([ad, geos]) => {
        const m = new THREE.Mesh(mergeGeometries(geos), mats[ad]);
        m.name = ad; m.castShadow = !golgesiz.includes(ad); m.receiveShadow = true;
        return m;
      });
    },
  };
}

// ---- kontrplak ----
// Huş kontrplak: yüzde açık huş damarı (doku 600 mm), kesik kenarda 1,5 mm'lik katlar (doku 24 mm'de 16 kat)
const HUS_MM = 600, KAT_MM = 24;
let husDoku = null;
function husDokulari() {
  if (husDoku) return husDoku;
  const [c, g] = kanvas(512, 512), r = rnd(11);
  g.fillStyle = '#d8c09a'; g.fillRect(0, 0, 512, 512);
  // geniş ton bantları (soyma kaplamanın dalgası), sarmalı (doku kenarlardan ek yeri vermez)
  for (let i = 0; i < 46; i++) {
    const y = r() * 512, h = 8 + r() * 46;
    g.fillStyle = r() < 0.5 ? `rgba(150,105,60,${0.03 + r() * 0.05})` : `rgba(255,244,222,${0.04 + r() * 0.06})`;
    for (const dy of [0, -512]) g.fillRect(0, y + dy, 512, h);
  }
  // ince damar çizgileri: u boyunca dalgalı, periyodik (sarmalı)
  for (let i = 0; i < 170; i++) {
    const y0 = r() * 512, faz = r() * 6.28, A = 1.5 + r() * 7, k = (1 + Math.floor(r() * 3)) * 2 * Math.PI / 512;
    g.strokeStyle = `rgba(118,80,44,${0.05 + r() * 0.13})`; g.lineWidth = 0.5 + r() * 1.3;
    for (const dy of [0, -512, 512]) {
      g.beginPath();
      for (let x = 0; x <= 512; x += 8) { const y = y0 + dy + A * Math.sin(x * k + faz); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
  }
  // seyrek küçük benekler (huşun göz izleri)
  for (let i = 0; i < 60; i++) {
    const x = r() * 512, y = r() * 512, w = 2 + r() * 5;
    g.fillStyle = `rgba(110,70,35,${0.12 + r() * 0.2})`;
    g.beginPath(); g.ellipse(x, y, w, w * 0.4, 0, 0, Math.PI * 2); g.fill();
  }
  const [c2, g2] = kanvas(256, 512), r2 = rnd(12);
  for (let k = 0; k < 16; k++) {
    const y = k * 32;
    g2.fillStyle = k % 2 ? '#e0c9a0' : '#bf9f72'; g2.fillRect(0, y, 256, 32);  // açık: boyuna damar, koyu: enine (uç damar)
    g2.fillStyle = 'rgba(80,50,22,0.5)'; g2.fillRect(0, y, 256, 3);            // tutkal çizgisi
  }
  for (let i = 0; i < 900; i++) { g2.fillStyle = `rgba(90,60,30,${r2() * 0.18})`; g2.fillRect(r2() * 256, r2() * 512, 1 + r2() * 6, 1.5); }
  return (husDoku = { yuz: doku(c), kenar: doku(c2) });
}
// Pahlı kontrplak levha (yuvarlatılmış kutu): kalınlık ekseni en kısa kenar; yüzler 'hus', kesik kenarlar 'husKenar'
function levha(K, [x0, x1], [y0, y1], [z0, z1], M = null, { pah = 2.5, kenar = 'husKenar' } = {}) {
  const boy = [x1 - x0, y1 - y0, z1 - z0], ince = boy.indexOf(Math.min(...boy));
  const g = new RoundedBoxGeometry(boy[0], boy[1], boy[2], 1, Math.min(pah, boy[ince] / 2 - 0.5));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const p = g.attributes.position, uv = g.attributes.uv, v = [0, 0, 0];
  for (const gr of g.groups) {
    const n = gr.materialIndex >> 1, diger = [0, 1, 2].filter((a) => a !== n);
    const [a, b] = boy[diger[0]] >= boy[diger[1]] ? diger : [diger[1], diger[0]]; // damar uzun kenar boyunca
    const boyunca = diger.find((e) => e !== ince);
    for (let i = gr.start; i < gr.start + gr.count; i++) {
      v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
      if (n === ince) uv.setXY(i, v[a] / HUS_MM, v[b] / HUS_MM);
      else uv.setXY(i, v[boyunca] / 300, v[ince] / KAT_MM);
    }
  }
  const parca = grupla(g);
  K.ekle('hus', mergeGeometries([parca[ince * 2], parca[ince * 2 + 1]]), M);
  K.ekle(kenar, mergeGeometries([0, 1, 2].filter((e) => e !== ince).flatMap((e) => [parca[e * 2], parca[e * 2 + 1]])), M);
}
// Şekilli kontrplak levha: şekil (x, y) düzleminde, kalınlık z boyunca 0..kalin; kenar pahı yuvarlak görünsün diye yan
// yüzlerin normalleri toCreasedNormals ile yumuşatılır (kapak düz kalır, yoksa geniş yüz yastık gibi gölgelenir)
function sekilLevha(K, sekil, kalin, M, { pah = 2.5, yuz = 'hus', kenar = 'husKenar', egri = 32 } = {}) {
  const g = new THREE.ExtrudeGeometry(sekil, { depth: kalin - 2 * pah, bevelEnabled: true, bevelThickness: pah, bevelSize: pah, bevelOffset: -pah, bevelSegments: 2, curveSegments: egri });
  g.translate(0, 0, pah);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (const gr of g.groups) for (let i = gr.start; i < gr.start + gr.count; i++) {
    if (gr.materialIndex === 0) uv.setXY(i, p.getX(i) / HUS_MM, p.getY(i) / HUS_MM);
    else uv.setXY(i, uv.getX(i) / 300, p.getZ(i) / KAT_MM);
  }
  const parca = grupla(g);
  K.ekle(yuz, parca[0], M);
  K.ekle(kenar, toCreasedNormals(parca[1], 0.9), M);
}

// ---- ortak malzemeler (eşyalar arasında paylaşılır) ----
// Cam: saydam ama yansıması sönmez. Olağan saydamlıkta yansıma da opaklıkla çarpılıp kayboluyor; burada renk opaklıkla
// çarpılmaz (önceden çarpılmış karışım: arka plan × (1 − a) + yansıma) ve a kenara doğru (Fresnel) artar. Geçirgenlik
// (transmission) kullanılmaz: ek bir sahne çizimi ister ve ardındaki ikinci camı çizmez (CLAUDE.md gotcha).
function camMalzeme({ renk = 0x000000, opak = 0.06, kenar = 0.6, puruz = 0.03, parlak = 1.3 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: renk, roughness: puruz, metalness: 0, transparent: true, opacity: opak, depthWrite: false, envMapIntensity: parlak, premultipliedAlpha: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.camKenar = { value: kenar };
    sh.fragmentShader = 'uniform float camKenar;\n' + sh.fragmentShader
      .replace('#include <opaque_fragment>', `float camF = pow( 1.0 - clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 ), 4.0 );
gl_FragColor = vec4( outgoingLight, clamp( diffuseColor.a + camF * camKenar, 0.0, 1.0 ) );`)
      .replace('#include <premultiplied_alpha_fragment>', '');
  };
  m.customProgramCacheKey = () => 'oktos-cam';
  return m;
}
let ortak = null;
function ortakMalzeme() {
  if (ortak) return ortak;
  const { yuz, kenar } = husDokulari();
  return (ortak = {
    hus: new THREE.MeshStandardMaterial({ map: yuz, roughness: 0.5, envMapIntensity: 0.8 }),       // vernikli huş
    husKenar: new THREE.MeshStandardMaterial({ map: kenar, roughness: 0.62, envMapIntensity: 0.8 }),
    siyah: new THREE.MeshStandardMaterial({ color: 0x17181a, metalness: 0.55, roughness: 0.32 }),  // siyah eloksal, boya
    mat: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.95, side: THREE.DoubleSide }), // keçe, perde, kauçuk
    alu: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.28 }),
    pirinc: new THREE.MeshStandardMaterial({ color: 0xc29a52, metalness: 1, roughness: 0.24 }),
    teflon: new THREE.MeshStandardMaterial({ color: 0xefeee9, roughness: 0.42 }),
    laminat: new THREE.MeshStandardMaterial({ color: 0x242528, roughness: 0.48, metalness: 0.1 }),  // yatak kenarı (kara laminat)
    lens: new THREE.MeshStandardMaterial({ color: 0x0c1822, roughness: 0.04, metalness: 0.5 }),     // kaplamalı mercek camı
    camKenar: new THREE.MeshStandardMaterial({ color: 0x93a89f, roughness: 0.28 }),                 // aynaların cam kenarı
    ayna2: new THREE.MeshStandardMaterial({ color: 0xe2e6e9, metalness: 1, roughness: 0.04 }),     // ikinci ayna
  });
}

// =====================================================================================================================
// ---- teleskop: kafes gövdeli Dobson ----
// Tüp çerçevesi: y = tüp ekseni (gökyüzüne), z = tüpün "üstü", x = sağ (gözlemcinin tarafı); orijin yükseklik ekseni.
// Rocker çerçevesi: az ile z çevresinde döner (önü +y); tüp yükseklik ekseninde (x) el kadar kalkar.
const DOB = {
  eksen: 960,                                   // yükseklik ekseni zeminden (yatakların merkezi)
  kutu: { yari: 280, s0: -430, s1: 110, t: 18 }, // ayna kutusu: dış yarı genişlik, eksen boyunca alt/üst kenar, levha
  ayna: { r: 228, yuz: -300, kalin: 40, sehim: 7 }, // ana ayna Ø 457 mm (18"), parabolün çukuru 7 mm
  yatak: { r: 310, t: 25 },                     // yükseklik yatakları Ø 620
  halka: { s: [1420, 1680], dis: 262, ic: 222, t: 20 }, // üst kafes halkaları (Ø 524)
  boru: { r: 16, alt: 30, ust: 1385, kose: 227, bag: 242 }, // kafes boruları Ø 32
  odak: { s: 1560, fi: 65 },                    // ikinci ayna ve odaklayıcı: eksen boyunca yeri; tepeden sağa açısı (°)
  tabure: 280,                                  // taburenin merkezi göz merceğinin önünden bu kadar dışarıda
};

// Ana aynanın yansıma kamerasının gördüğü katman (teleskobun ağları ve sahnenin ışıkları bu katmana da eklenir)
export const AYNA_KATMANI = 7;
// Reflector gölgelendiricisi, rengi doğrudan çarpar (asıl gölgelendiricinin "overlay" karışımı HDR'de tutarsız)
const AYNA_SHADER = {
  name: 'OktosAyna',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } },
  vertexShader: Reflector.ReflectorShader.vertexShader,
  fragmentShader: /* glsl */`
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    varying vec4 vUv;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      gl_FragColor = vec4( texture2DProj( tDiffuse, vUv ).rgb * color, 1.0 );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

// ayna: false ise ana ayna düz parlak metal (düşük kalitede, ör. telefonda: Reflector'ın ek çizimi olmasın)
export function teleskop({ az = 45, el = 30, ayna: yansitici = true } = {}) {
  const T = DOB, Mz = ortakMalzeme(), K = kova(), fi = T.odak.fi * D2R;
  const mDon = new THREE.Matrix4().makeRotationZ(-az * D2R);                 // +y → (sin az, cos az)
  const mYuk = ile(otele(0, 0, T.eksen), new THREE.Matrix4().makeRotationX(el * D2R));
  const mTup = ile(mDon, mYuk);
  const aci = (d) => new THREE.Matrix4().makeRotationY(d); // tüp çevresinde: +z'den +x'e

  // zemin tablası (sabit): Ø 740, üç kauçuk ayak, üstünde üç teflon ped (rocker bunların üstünde döner)
  sekilLevha(K, new THREE.Shape().absarc(0, 0, 370, 0, Math.PI * 2, false), 20, otele(0, 0, 20), { egri: 72 });
  for (let i = 0; i < 3; i++) {
    const a = (90 + i * 120) * D2R, c = Math.cos(a), s = Math.sin(a);
    K.ekle('mat', new THREE.CylinderGeometry(30, 33, 19, 24).rotateX(Math.PI / 2).translate(c * 300, s * 300, 9.5));
    K.ekle('teflon', new RoundedBoxGeometry(50, 50, 6, 1, 1.5).translate(c * 290, s * 290, 43));
  }

  // rocker box: taban, iki yan duvar (yatakların oturduğu yay oyuğu), ön ve arka tahta
  levha(K, [-330, 330], [-350, 350], [47, 67], mDon);
  const Rn = 322, ust = 780, y1 = Math.sqrt(Rn * Rn - (T.eksen - ust) ** 2);
  const yan = new THREE.Shape().moveTo(-350, 67).lineTo(350, 67).lineTo(350, ust).lineTo(y1, ust);
  yan.absarc(0, T.eksen, Rn, Math.atan2(ust - T.eksen, y1), Math.atan2(ust - T.eksen, -y1), true);
  yan.lineTo(-350, ust).closePath();
  yan.holes.push(oluk(-287, -233, 658, 18), oluk(233, 287, 658, 18)); // tutma oyukları
  for (const x of [290, -310]) sekilLevha(K, yan, 20, ile(mDon, otele(x, 0, 0), YANA));
  levha(K, [-290, 290], [330, 350], [67, 420], mDon);
  levha(K, [-290, 290], [-350, -330], [67, 420], mDon);
  // yatakların bastığı teflon pedler (oyukta ±40°)
  for (const sx of [1, -1]) for (const a of [-50, -130]) {
    const ar = a * D2R;
    K.ekle('teflon', new RoundedBoxGeometry(20, 60, 10, 1, 1.5).rotateX(ar - Math.PI / 2).translate(sx * 300, 316 * Math.cos(ar), T.eksen + 316 * Math.sin(ar)), mDon);
  }
  // mercek rafı (sağ duvarın dışında, gözlemcinin tarafı): dört göz merceği
  levha(K, [311, 372], [-210, 210], [560, 578], mDon);
  levha(K, [311, 329], [-210, 210], [470, 560], mDon);
  for (let i = 0; i < 4; i++) {
    const y = -150 + i * 100, r = 22 + (i % 2) * 4;
    K.ekle('siyah', cubuk([346, y, 578.5], [346, y, 630 + i * 4], r), mDon);
    K.ekle('mat', cubuk([346, y, 592], [346, y, 612], r + 1.5), mDon);
    K.ekle('lens', new THREE.CircleGeometry(r * 0.45, 20).translate(346, y, 631 + i * 4), mDon);
  }

  // ---- tüp ----
  const B = T.kutu, iB = B.yari - B.t;
  levha(K, [iB, B.yari], [B.s0, B.s1], [-B.yari, B.yari], mTup);
  levha(K, [-B.yari, -iB], [B.s0, B.s1], [-B.yari, B.yari], mTup);
  levha(K, [-iB, iB], [B.s0, B.s1], [iB, B.yari], mTup);
  levha(K, [-iB, iB], [B.s0, B.s1], [-B.yari, -iB], mTup);
  levha(K, [-iB, iB], [B.s0, B.s0 + B.t], [-iB, iB], mTup); // arka kapak
  // içi siyah keçe kaplı (duvarlardan 1,5 mm içeride)
  const kc = iB - 1.5, ks0 = B.s0 + B.t + 1, ks1 = B.s1 - 2, kh = ks1 - ks0, km = (ks0 + ks1) / 2;
  K.ekle('mat', new THREE.PlaneGeometry(2 * kc, kh).rotateX(Math.PI).translate(0, km, kc), mTup);
  K.ekle('mat', new THREE.PlaneGeometry(2 * kc, kh).translate(0, km, -kc), mTup);
  K.ekle('mat', new THREE.PlaneGeometry(2 * kc, kh).rotateY(-Math.PI / 2).translate(kc, km, 0), mTup);
  K.ekle('mat', new THREE.PlaneGeometry(2 * kc, kh).rotateY(Math.PI / 2).translate(-kc, km, 0), mTup);
  K.ekle('mat', new THREE.PlaneGeometry(2 * kc, 2 * kc).rotateX(-Math.PI / 2).translate(0, ks0, 0), mTup);
  // arkada fan ve üç pirinç kolimasyon düğmesi
  K.ekle('mat', new THREE.CylinderGeometry(70, 70, 24, 32).translate(0, B.s0 - 12.5, 0), mTup);
  for (const a of [0, 120, 240]) K.ekle('pirinc', new THREE.CylinderGeometry(24, 24, 22, 24).translate(0, B.s0 - 12, 175), ile(mTup, aci(a * D2R)));
  // köşe blokları (kafes boruları burada sıkışır), dışta pirinç sıkma düğmeleri
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    levha(K, [Math.min(sx * 192, sx * iB), Math.max(sx * 192, sx * iB)], [0, B.s1], [Math.min(sz * 192, sz * iB), Math.max(sz * 192, sz * iB)], mTup);
    K.ekle('pirinc', cubuk([sx * 227, 55, sz * B.yari], [sx * 227, 55, sz * (B.yari + 14)], 8), mTup);
    K.ekle('pirinc', cubuk([sx * 227, 55, sz * (B.yari + 14)], [sx * 227, 55, sz * (B.yari + 26)], 20, 20, 20), mTup);
  }
  // yükseklik yatakları: kutunun iki yanında, eksen merkezli Ø 620 yay (130°..320°: el 0..90'da iki ped de üstünde kalır)
  const yat = new THREE.Shape().absarc(0, 0, T.yatak.r, 130 * D2R, 320 * D2R, false); yat.closePath();
  for (const x of [B.yari + 1, -B.yari - 1 - T.yatak.t]) sekilLevha(K, yat, T.yatak.t, ile(mTup, otele(x, 0, 0), YANA), { kenar: 'laminat', egri: 64 });
  for (const sx of [1, -1]) for (const [y, z] of [[-60, -60], [-200, -40], [-60, -200], [-170, -170]]) {
    const x = sx * (B.yari + 1 + T.yatak.t);
    K.ekle('alu', cubuk([x, y, z], [x + sx * 5, y, z], 9, 9, 6), mTup);
  }

  // ana ayna: yüzü düzlem yansıtıcı (aşağıda, ayrı ağ), cam gövde, üç alüminyum tutucu
  const A = T.ayna;
  K.ekle('camKenar', new THREE.CylinderGeometry(A.r, A.r, A.kalin, 72, 1, true).translate(0, A.yuz - A.kalin / 2, 0), mTup);
  for (const a of [30, 150, 270]) {
    K.ekle('alu', new THREE.BoxGeometry(16, 50, 8).translate(0, A.yuz - 20, A.r + 6), ile(mTup, aci(a * D2R)));
    K.ekle('alu', new THREE.BoxGeometry(16, 4, 20).translate(0, A.yuz + 3.5, A.r + 1), ile(mTup, aci(a * D2R)));
  }

  // kafes: 8 boru (4 çift); alt uçlar köşe bloklarında, üst uçlar halkanın altındaki 4 bağlantıda çift çift buluşur
  const R = T.boru;
  for (let k = 0; k < 4; k++) {
    const tc = k * Math.PI / 2;
    const U = new THREE.Vector3(Math.sin(tc) * R.bag, R.ust, Math.cos(tc) * R.bag), tan = new THREE.Vector3(Math.cos(tc), 0, -Math.sin(tc));
    for (const sg of [1, -1]) {
      const tk = tc + sg * Math.PI / 4, Lc = new THREE.Vector3(Math.sin(tk) * R.kose * Math.SQRT2, R.alt, Math.cos(tk) * R.kose * Math.SQRT2);
      const ustU = U.clone().addScaledVector(tan, -sg * 22);
      const yon = new THREE.Vector3(ustU.x - Lc.x, 0, ustU.z - Lc.z).normalize();
      K.ekle('siyah', cubuk(Lc.clone().addScaledVector(yon, 18), ustU, R.r, R.r, 14), mTup);
    }
    K.ekle('alu', new RoundedBoxGeometry(72, 46, 38, 1, 3).translate(0, 1396, R.bag), ile(mTup, aci(tc)));
    K.ekle('siyah', cubuk([0, 1396, R.bag + 19], [0, 1396, R.bag + 40], 11), ile(mTup, aci(tc)));
  }

  // üst kafes: iki halka, aralarında 6 alüminyum dikme, odaklayıcının karşısında siyah ışık perdesi
  const H = T.halka;
  const halka = new THREE.Shape().absarc(0, 0, H.dis, 0, Math.PI * 2, false);
  halka.holes.push(new THREE.Path().absarc(0, 0, H.ic, 0, Math.PI * 2, true));
  for (const s of H.s) sekilLevha(K, halka, H.t, ile(mTup, otele(0, s, 0), new THREE.Matrix4().makeRotationX(-Math.PI / 2)), { egri: 80 });
  for (let k = 0; k < 6; k++) {
    const a = (25 + 60 * k) * D2R, x = Math.sin(a) * 242, z = Math.cos(a) * 242;
    K.ekle('alu', cubuk([x, H.s[0] + H.t, z], [x, H.s[1], z], 7, 7, 10), mTup);
  }
  K.ekle('mat', new THREE.CylinderGeometry(258, 258, H.s[1] - H.s[0] - H.t, 28, 1, true, (T.odak.fi + 115) * D2R, 130 * D2R).translate(0, (H.s[0] + H.t + H.s[1]) / 2, 0), mTup);

  // odaklayıcı tahtası, Crayford odaklayıcı ve göz merceği (gözlemciye dönük, tepeden sağa 65°)
  const mF = ile(mTup, aci(fi)), oy = T.odak.s;
  levha(K, [-85, 85], [H.s[0], H.s[1] + H.t], [H.dis + 1, H.dis + 13], mF);
  K.ekle('siyah', new RoundedBoxGeometry(90, 100, 54, 2, 6).translate(0, oy, H.dis + 14 + 27), mF);
  K.ekle('alu', cubuk([0, oy, 330], [0, oy, 386], 31, 31, 32), mF);
  K.ekle('siyah', cubuk([0, oy, 386], [0, oy, 400], 35, 35, 32), mF);
  K.ekle('siyah', cubuk([0, oy, 400], [0, oy, 470], 27, 27, 32), mF);
  K.ekle('mat', cubuk([0, oy, 415], [0, oy, 452], 28.5, 28.5, 32), mF);
  K.ekle('mat', new THREE.CylinderGeometry(25, 26, 20, 32, 1, true).rotateX(Math.PI / 2).translate(0, oy, 480), mF); // göz lastiği (açık)
  K.ekle('lens', new THREE.CircleGeometry(13, 24).translate(0, oy, 471), mF);
  for (const sx of [1, -1]) {
    K.ekle('alu', cubuk([sx * 45, oy - 32, 300], [sx * 62, oy - 32, 300], 6), mF);
    K.ekle('alu', cubuk([sx * 62, oy - 32, 300], [sx * 78, oy - 32, 300], 19, 19, 24), mF);
  }

  // ikinci ayna: 45° eliptik düz ayna (küçük eksen 90 mm), eğik kesilmiş tutucu, sap ve 4 ayaklı örümcek
  const f = new THREE.Vector3(Math.sin(fi), 0, Math.cos(fi)), Y = new THREE.Vector3(0, 1, 0);
  const ns = f.clone().sub(Y).normalize(), mb = f.clone().add(Y).normalize(), w = mb.clone().cross(ns);
  const mS = ile(mTup, new THREE.Matrix4().makeBasis(w, mb, ns).setPosition(0, oy, 0));
  const ay2 = grupla(new THREE.CylinderGeometry(45, 45, 14, 40).rotateX(Math.PI / 2).translate(0, 0, -7).scale(1, Math.SQRT2, 1));
  K.ekle('ayna2', ay2[1], mS);
  K.ekle('camKenar', mergeGeometries([ay2[0], ay2[2]]), mS);
  const tut = new THREE.CylinderGeometry(47, 47, 1, 32).translate(0, 0.5, 0), tp = tut.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, tp.getY(i) > 0.5 ? 1645 : oy + 15 * Math.SQRT2 + tp.getX(i) * f.x + tp.getZ(i) * f.z);
  tut.computeVertexNormals();
  K.ekle('siyah', tut, mTup);
  K.ekle('siyah', cubuk([0, 1645, 0], [0, 1667, 0], 8), mTup);
  K.ekle('siyah', cubuk([0, 1666, 0], [0, 1690, 0], 14, 14, 16), mTup);
  for (let k = 0; k < 4; k++) K.ekle('siyah', new THREE.BoxGeometry(1.4, 22, H.ic - 14).translate(0, 1678, (H.ic + 14) / 2), ile(mTup, aci((T.odak.fi + 45 + 90 * k) * D2R)));

  // 8×50 arayıcı dürbün (tepeden sola 40°): iki dikme, iki halka, gövde, çiy siperli objektif
  const mB = ile(mTup, aci(-40 * D2R)), bz = 340;
  for (const y of [1490, 1630]) {
    K.ekle('alu', new THREE.BoxGeometry(22, 18, 50).translate(0, y, H.dis + 1 + 25), mB);
    K.ekle('alu', new THREE.TorusGeometry(31, 5, 8, 28).rotateX(Math.PI / 2).translate(0, y, bz), mB);
  }
  K.ekle('siyah', cubuk([0, 1470, bz], [0, 1650, bz], 24, 24, 24), mB);
  K.ekle('siyah', cubuk([0, 1640, bz], [0, 1700, bz], 24, 33, 28), mB);
  K.ekle('mat', new THREE.CylinderGeometry(33.5, 33.5, 40, 28, 1, true).translate(0, 1720, bz), mB);
  K.ekle('lens', new THREE.CircleGeometry(30, 28).rotateX(-Math.PI / 2).translate(0, 1701, bz), mB);
  K.ekle('siyah', cubuk([0, 1432, bz], [0, 1470, bz], 15, 18, 20), mB);
  K.ekle('mat', cubuk([0, 1414, bz], [0, 1433, bz], 18, 16, 20), mB);

  // kırmızı nokta bulucu (tepede): küçük köprü tahtası, gövde, eğik pencere
  const mK = ile(mTup, aci(0));
  levha(K, [-40, 40], [H.s[0], H.s[1] + H.t], [H.dis + 1, H.dis + 11], mK);
  K.ekle('siyah', new RoundedBoxGeometry(44, 110, 34, 2, 5).translate(0, 1585, H.dis + 12 + 17), mK);
  K.ekle('lens', new THREE.BoxGeometry(40, 2.5, 38).rotateX(-0.6).translate(0, 1648, H.dis + 40), mK);
  K.ekle('siyah', new THREE.BoxGeometry(44, 6, 26).translate(0, 1636, H.dis + 30), mK);

  // göz merceği ve gözlem taburesi (iki basamaklı, katlanır): mercek yüksekte, tabure onun önünde dışarıda
  const E = new THREE.Vector3(0, oy, 490).applyMatrix4(ile(mYuk, aci(fi)));
  const fD = f.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), el * D2R);
  const fh = new THREE.Vector2(fD.x, fD.y).normalize();
  const tPos = new THREE.Vector2(E.x, E.y).addScaledVector(fh, T.tabure);
  const mT = ile(mDon, otele(tPos.x, tPos.y, 0), new THREE.Matrix4().makeRotationZ(Math.atan2(fh.x, -fh.y)));
  taburesi(K, mT);

  const g = new THREE.Group();
  g.name = 'teleskop';
  g.add(...K.aglar(Mz));
  // Ana ayna: düzlem yansıtıcı (three/addons Reflector). Gerçek bir Newton aynası gibi ikinci aynayı, örümceği, kafes
  // borularını ve üst kafesi doğru paralaksla ve keskin gösterir. Küp kamera denendi: aynaya 2–3 m'den bakınca küp
  // dokusunun bir tekseli ekranda ~5 piksel oluyor, yansıma basamaklı çıkıyordu. Maliyet: ayna görünürken her karede
  // yalnız teleskobun kendi katmanı (AYNA_KATMANI) ve ışıklar, ekranın yarı çözünürlüğünde (en çok 1024) bir kez daha
  // çizilir (~12 çizim çağrısı). Arka planda sahnenin arka plan rengi görünür (oda yansımaz). Yüz görselde düz; gerçek
  // parabolün 7 mm çukuru gözle seçilmez.
  if (!yansitici) {
    const duz = new THREE.Mesh(new THREE.CircleGeometry(A.r - 0.5, 48), new THREE.MeshStandardMaterial({ color: 0xd8dade, metalness: 1, roughness: 0.06 }));
    ile(mTup, otele(0, A.yuz - 1, 0), new THREE.Matrix4().makeRotationX(-Math.PI / 2)).decompose(duz.position, duz.quaternion, duz.scale);
    duz.name = 'ayna';
    g.add(duz);
  }
  const ayna = yansitici ? new Reflector(new THREE.CircleGeometry(A.r - 0.5, 72), { shader: AYNA_SHADER, color: 0xe2e2e2, textureWidth: 512, textureHeight: 512, multisample: 4 }) : null;
  if (ayna) {
    ile(mTup, otele(0, A.yuz - 1, 0), new THREE.Matrix4().makeRotationX(-Math.PI / 2)).decompose(ayna.position, ayna.quaternion, ayna.scale);
    ayna.name = 'ayna';
    ayna.camera.layers.set(AYNA_KATMANI);
    for (const m of g.children) m.layers.enable(AYNA_KATMANI);
    const yansit = ayna.onBeforeRender, boyut = new THREE.Vector2();
    let isiklar = false;
    ayna.onBeforeRender = (renderer, scene, camera, ...kalan) => {
      if (!isiklar) { isiklar = true; scene.traverse((o) => { if (o.isLight) o.layers.enable(AYNA_KATMANI); }); }
      const rt = ayna.getRenderTarget(), b = renderer.getDrawingBufferSize(boyut);
      const w = Math.max(256, Math.min(1024, Math.round(b.x / 2))), h = Math.max(1, Math.round((w * b.y) / b.x));
      if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
      yansit(renderer, scene, camera, ...kalan);
    };
    g.add(ayna);
  }
  g.userData.mercek = E.clone().applyMatrix4(mDon);                        // göz merceğinin üstü (göz buraya gelir)
  g.userData.ayak = new THREE.Vector3(tPos.x, tPos.y, 0).applyMatrix4(mDon); // taburenin taban merkezi
  g.userData.ayna = new THREE.Vector3(0, A.yuz - A.sehim, 0).applyMatrix4(mTup); // ana aynanın merkezi
  g.userData.yon = new THREE.Vector3(0, 1, 0).transformDirection(mTup);     // tüpün baktığı yön
  return g;
}
// İki basamaklı katlanır gözlem taburesi (huş): yan levhalar (altı kemerli), iki basamak (üstte tutma oyuğu), arka tahta.
// Yerel önü −y (alçak basamak), arkası +y (teleskoba dönük); taban z = 0, üst basamak 500 mm
function taburesi(K, M) {
  const yanT = new THREE.Shape().moveTo(-240, 0).lineTo(-180, 0).quadraticCurveTo(-15, 130, 150, 0).lineTo(205, 0)
    .lineTo(182, 500).lineTo(-30, 500).lineTo(-240, 250).closePath();
  for (const x of [200, -218]) sekilLevha(K, yanT, 18, ile(M, otele(x, 0, 0), YANA));
  levha(K, [-200, 200], [-236, -46], [232, 250], M);
  const ustB = new THREE.Shape().moveTo(-200, -26).lineTo(200, -26).lineTo(200, 178).lineTo(-200, 178).closePath();
  ustB.holes.push(oluk(-50, 50, 128, 16));
  sekilLevha(K, ustB, 18, ile(M, otele(0, 0, 482)));
  levha(K, [-200, 200], [158, 176], [300, 481], M);
  levha(K, [-200, 200], [-236, -218], [150, 231], M);
}

// =====================================================================================================================
// ---- armut koltuk ----
// Dinlenme profili (yarıçap, yükseklik): yere oturan taban dikişi Ø 660, en geniş yer ~Ø 900 (yerden 17 cm), tepede kulp.
// Altı dilim (panel) tabandan tepeye uzanır; ön dilim tam önde. Biçim tohumla değişir: yaslanma, çukur, kıvrımlar.
const ARMUT_PROFIL = [[330, 0], [395, 22], [432, 75], [448, 170], [440, 300], [412, 440], [368, 580], [310, 710],
  [245, 825], [180, 920], [118, 995], [62, 1045], [22, 1070], [0, 1078]];
const DILIM = 6, KUMAS_MM = 40; // panel sayısı; iplik dokusunun bir karesi (mm)
// Kumaş kıvrımı: yuvarlak sırt, dar çukur (sıkışan kumaş katlanır); çukur hafif yumuşatılır (türevi kırılmasın, yüzey
// katlanmasın); ortalaması ~0
const sirt = (x) => { const s = Math.sin(x / 2); return 2 * Math.sqrt(s * s + 0.015) - 1.3; };
const sar = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Kumaş dokusu (renk çarpanı + normal haritası), tür başına bir kez: keten (düz örgü, kalın iplikli), kadife (ezik hav)
const kumasDoku = {};
function kumasDokusu(tur) {
  if (kumasDoku[tur]) return kumasDoku[tur];
  const N = 256, r = rnd(tur === 'keten' ? 71 : 83), Hh = new Float32Array(N * N), Lm = new Float32Array(N * N);
  // sarmalı değer gürültüsü (G × G ızgara)
  const gurultu = (G) => {
    const k = Array.from({ length: G * G }, r);
    return (x, y) => {
      const gx = (x / N) * G, gy = (y / N) * G, x0 = Math.floor(gx), y0 = Math.floor(gy), tx = gx - x0, ty = gy - y0;
      const at = (i, j) => k[((j % G + G) % G) * G + ((i % G + G) % G)], sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
    };
  };
  if (tur === 'keten') {
    const P = 8, n = N / P, kalin = () => 0.72 + r() * 0.42;
    // her ipliğin kalınlığı boyunca değişir (keten düğümleri: yer yer kalınlaşan uzun parçalar)
    const iplik = () => { const t = kalin(), d = []; let x = 0; while (x < N) { const L = 12 + r() * 60, k = r() < 0.25 ? 1.35 + r() * 0.3 : 1; for (let i = 0; i < L && x < N; i++, x++) d.push(t * k); } return d; };
    const atki = Array.from({ length: n }, iplik), cozgu = Array.from({ length: n }, iplik), nz = gurultu(32);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const ci = Math.floor(x / P), cj = Math.floor(y / P), fx = ((x % P) + 0.5) / P, fy = ((y % P) + 0.5) / P;
      const tw = atki[cj][x], tc = cozgu[ci][y], ust = (ci + cj) & 1;
      const hw = tw * (1 - (2 * fy - 1) ** 2) * (ust ? 1 : 0.55), hc = tc * (1 - (2 * fx - 1) ** 2) * (ust ? 0.55 : 1);
      const h = Math.max(hw, hc);
      Hh[y * N + x] = h;
      Lm[y * N + x] = 0.8 + 0.1 * h + 0.07 * (ust ? tw - 1 : tc - 1) + 0.06 * (nz(x, y) - 0.5) + (r() - 0.5) * 0.05;
    }
  } else {
    const a = gurultu(6), b = gurultu(18), c = gurultu(64);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      Hh[y * N + x] = 0.55 * a(x, y) + 0.3 * b(x, y) + 0.15 * c(x, y);
      Lm[y * N + x] = 0.86 + 0.14 * (0.6 * a(x + 40, y + 90) + 0.4 * b(x, y)) + (r() - 0.5) * 0.04;
    }
  }
  const [c1, g1] = kanvas(N, N), [c2, g2] = kanvas(N, N), im1 = g1.createImageData(N, N), im2 = g2.createImageData(N, N);
  const guc = tur === 'keten' ? 2.2 : 3.5, H = (x, y) => Hh[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4, l = Math.max(0, Math.min(1, Lm[y * N + x])) * 255;
    im1.data[i] = im1.data[i + 1] = im1.data[i + 2] = l; im1.data[i + 3] = 255;
    // tuval y'si aşağı, doku v'si yukarı: dH/dv = −dH/dy
    const nx = -(H(x + 1, y) - H(x - 1, y)) * guc, ny = (H(x, y + 1) - H(x, y - 1)) * guc, L = Math.hypot(nx, ny, 1);
    im2.data[i] = (nx / L * 0.5 + 0.5) * 255; im2.data[i + 1] = (ny / L * 0.5 + 0.5) * 255; im2.data[i + 2] = (1 / L * 0.5 + 0.5) * 255; im2.data[i + 3] = 255;
  }
  g1.putImageData(im1, 0, 0); g2.putImageData(im2, 0, 0);
  return (kumasDoku[tur] = { map: doku(c1), normal: doku(c2, { srgb: false }) });
}

export function armut({ renk = 0xc8962e, seed = 1, kumas = seed % 2 ? 'kadife' : 'keten' } = {}) {
  const r = rnd(seed * 7919 + 13), H = 1030 + r() * 70; // tepe yüksekliği
  const P = {
    oz: 405 + r() * 50,           // oturağın yüksekliği
    sirt: 45 + r() * 30,          // sırtlığın ön yüzü (eksenden öne, mm)
    yaslan: 110 + r() * 70,       // tepenin arkaya kayması
    yan: (r() - 0.5) * 90,        // tepenin yana kayması
    f1: r() * 6.28, f2: r() * 6.28, f3: r() * 6.28, f4: r() * 6.28, f5: r() * 6.28,
    kulp: 0.25 + r() * 0.45,      // kulp arkaya yatıklığı (rad)
    kat: Array.from({ length: 5 }, () => {
      const b = r() * Math.PI;
      return { th: r() * 6.28, z: 250 + r() * 600, R: 130 + r() * 120, cb: Math.cos(b), sb: Math.sin(b), dalga: 100 + r() * 60, faz: r() * 6.28, A: 5 + r() * 5 };
    }),
  };
  // İki profil: dolu armut (yanlar ve arka) ve oturulmuş ön (diz yastığı, neredeyse yatay oturak, dik sırtlık). Yüzey bir
  // açıda ikisinin karışımı (önde oturulmuş, yanlara doğru dolu): kollar kendiliğinden yükselir, yüzey kendini kesmez
  const dolu = new THREE.SplineCurve(ARMUT_PROFIL.map(([pr, pz]) => new THREE.Vector2(pr, pz * H / 1078)));
  const oz = P.oz, sr = P.sirt;
  const oturulmus = new THREE.SplineCurve([[330, 0], [398, 22], [436, 80], [452, 175], [446, 270], [426, oz - 85], [395, oz - 30],
    [345, oz + 2], [265, oz + 12], [180, oz + 5], [115, oz + 12], [sr + 22, oz + 55], [sr + 4, oz + 160], [sr - 4, 0.66 * H],
    [sr - 14, 0.8 * H], [16, 0.94 * H], [0, H]].map(([pr, pz]) => new THREE.Vector2(pr, pz)));
  const L1 = dolu.getLength(), L2 = oturulmus.getLength(), dilim = 2 * Math.PI / DILIM;
  // oturulmuş profilde oturağın ortası, diz yastığı ve sırt kıvrımı (u değerleri)
  const uBul = (rHedef, zHedef) => { let en = 0, ed = Infinity; for (let i = 0; i <= 400; i++) { const p = oturulmus.getPointAt(i / 400), d = Math.hypot(p.x - rHedef, p.y - zHedef); if (d < ed) { ed = d; en = i / 400; } } return en; };
  const uOt = uBul(220, oz + 8), uDiz = uBul(395, oz - 30), uSirt = uBul(sr + 22, oz + 55);
  const out = new THREE.Vector3(), q = new THREE.Vector2(), tg = new THREE.Vector2();
  let ao = 1, rDin = 0, Lu = 0;
  // Yüzey noktası: th önden (−y) saat yönünün tersine açı, u profil boyunca 0..1 (yay uzunluğu oranı). Önce dolu armut
  // (panel şişkinliği, dikiş, boncuk yumruları, kıvrımlar), sonra oturulmuş ön oyulur: her yatay kesitte ön, oturulmuş
  // profilin yarıçapında bir düzlemle (yumuşak) kesilir, kesilen noktalar oturulmuş profilin yüksekliğine iner. Geniş
  // oturak ve düz sırtlık böyle çıkar; kenarlarda kesme biter, kollar dolu armutta kalır. Noktalar yalnız geriye ve
  // aşağı gider, x değişmez: kesit kapalı ve dışbükey kalır, yüzey kendini kesmez.
  const smax = (a, b, k) => (a + b + Math.sqrt((a - b) * (a - b) + k * k)) / 2;
  function nokta(th, u) {
    const uu = Math.min(1, Math.max(0, u)), ut = Math.min(0.999, Math.max(0.001, u));
    const qd = dolu.getPointAt(uu), td = dolu.getTangentAt(ut), qs = oturulmus.getPointAt(uu), ts = oturulmus.getTangentAt(ut);
    const rr = qd.x, z = qd.y, nr = td.y, nz = -td.x;
    rDin = rr; Lu = L1;
    const yer = (((th / dilim + 0.5) % 1) + 1) % 1;             // panel içinde 0..1 (dikişler 0 ve 1)
    const W = yumus(25, 150, z) * (1 - yumus(0.78 * H, 0.97 * H, z)) * Math.min(1, rr / 120);
    const dikis = Math.min(yer, 1 - yer) * dilim * rr;           // dikişe uzaklık (mm)
    let d = 15 * (rr / 440) * (Math.pow(Math.sin(Math.PI * yer), 0.7) - 0.62) * W; // panel şişkinliği
    d -= 4.5 * Math.exp(-((dikis / 9) ** 2)) * W;                 // dikişte çekme
    // boncukların yumruları (düşük frekans)
    d += 9 * (Math.sin(th * 3 + z * 0.006 + P.f1) * Math.sin(z * 0.011 + th * 2 + P.f2) + 0.5 * Math.sin(th * 5 - z * 0.017 + P.f3)) * yumus(20, 140, z) * (1 - yumus(0.85 * H, H, z)) * Math.min(1, rr / 150);
    // kıvrımlar: altta yatay sarkma, tepede kulpa toplanan, rastgele çapraz
    let kat = sirt(z * 0.045 + 2.2 * Math.sin(th * 2 + P.f2) + P.f3) * 7 * yumus(40, 120, z) * (1 - yumus(260, 420, z));
    kat += sirt(th * 11 + 0.8 * Math.sin(z * 0.01 + P.f5)) * 8 * yumus(0.66 * H, 0.86 * H, z) * (1 - yumus(0.93 * H, 0.99 * H, z)) * Math.min(1, rr / 160);
    for (const k of P.kat) {
      const da = sar(th - k.th) * rr, db = z - k.z, m = Math.exp(-(da * da + db * db) / (k.R * k.R));
      if (m > 0.01) kat += sirt(((da * k.cb + db * k.sb) / k.dalga) * 2 * Math.PI + k.faz) * k.A * m * (1 - yumus(0.85 * H, 0.95 * H, z));
    }
    d += kat;
    const r2 = Math.max(0, rr + d * nr);
    const x = r2 * Math.sin(th);
    let y = -r2 * Math.cos(th), zz = z + d * nz;
    // oturulmuş ön: kesit, oturulmuş profilin yarıçapındaki düzleme (y = −r) kadar geri itilir, kesilen nokta iner
    const ys = -qs.x, kes = yumus(0, 230, ys - y); // geniş geçiş: hızlı inen satır alttakinin altına düşmesin
    y = smax(y, ys, 30);
    zz += kes * (qs.y - z);
    // oturağın kıvrımları (oyuğun normali boyunca): ortada ışınsal, diz yastığında küçük, sırt dibinde yatay kırışık
    const sS = (uu - uOt) * L2, rho = Math.hypot(x, sS), psi = Math.atan2(sS, x);
    let kat2 = sirt(psi * 7 + P.f4 + rho * 0.004) * 10 * Math.exp(-(((rho - 190) / 120) ** 2));
    kat2 += sirt(x / 32 + 1.5 * Math.sin(P.f1 + x * 0.01)) * 5 * Math.exp(-((((uu - uDiz) * L2) / 55) ** 2));
    kat2 -= 12 * Math.exp(-((((uu - uSirt) * L2) / 32) ** 2)) * (0.7 + 0.3 * Math.sin(x * 0.03 + P.f2));
    kat2 *= kes;
    y -= ts.y * kat2; zz -= ts.x * kat2;
    // tepe arkaya (ve biraz yana) yatık
    const t = Math.max(0, zz / H);
    out.set(x + P.yan * t * t, y + P.yaslan * Math.pow(t, 2.2), Math.max(0, zz));
    ao = 1 - 0.22 * Math.exp(-((dikis / 14) ** 2)) * W - 0.016 * Math.max(0, -kat) - 0.016 * Math.max(0, -kat2) - 0.35 * Math.exp(-zz / 45)
      - 0.2 * kes * Math.exp(-((((uu - uSirt) * L2) / 80) ** 2)) - 0.06 * kes;
    ao = Math.max(0.45, Math.min(1, ao));
    return out;
  }
  // dilimler ayrı ızgara: dikişte normaller kırılır (panel çizgisi), uv paneli kendi düzleminde açar
  const NC = 16, NR = 64, pos = [], uvs = [], col = [], idx = [];
  for (let k = 0; k < DILIM; k++) {
    const th0 = (k + 0.5) * dilim, taban = pos.length / 3;
    for (let j = 0; j <= NR; j++) {
      const u = j / NR;
      for (let i = 0; i <= NC; i++) {
        const p = nokta(th0 + (i / NC) * dilim, u);
        pos.push(p.x, p.y, p.z);
        uvs.push(((i / NC) - 0.5) * dilim * rDin / KUMAS_MM, (u * Lu) / KUMAS_MM);
        col.push(ao, ao, ao);
      }
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const a = taban + j * (NC + 1) + i, c = a + NC + 1;
      idx.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }
  const govde = new THREE.BufferGeometry();
  govde.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  govde.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  govde.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  govde.setIndex(idx);
  govde.computeVertexNormals();
  const parcalar = [govde];
  // yüzey normali (sayısal): biye ve kulp yüzeye otursun
  const normal = (th, u) => {
    const a = nokta(th + 0.01, u).clone().sub(nokta(th - 0.01, u)), b = nokta(th, u + 0.004).clone().sub(nokta(th, u - 0.004));
    return a.cross(b).normalize();
  };
  const boru = (noktalar, kapali, seg, rb, renkAo) => {
    const egri = new THREE.CatmullRomCurve3(noktalar, kapali, 'centripetal'), g = new THREE.TubeGeometry(egri, seg, rb, 6, kapali);
    const uv = g.attributes.uv, uz = egri.getLength();
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * uz) / KUMAS_MM, (uv.getY(i) * 2 * Math.PI * rb) / KUMAS_MM);
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * 3).fill(renkAo), 3));
    return g;
  };
  // dikiş biyeleri (her dikişte, tabandan tepeye yakın) ve taban biyesi
  for (let k = 0; k < DILIM; k++) {
    const th = (k + 0.5) * dilim, nk = [];
    for (let j = 0; j <= 36; j++) {
      const u = 0.012 + (j / 36) * 0.955, p = nokta(th, u).clone().addScaledVector(normal(th, u), 2.5);
      nk.push(p.setZ(Math.max(p.z, 4.5))); // biye zeminin altına inmesin (yarıçap 4,2)
    }
    parcalar.push(boru(nk, false, 72, 4.2, 0.62));
  }
  const tabanNk = [];
  for (let i = 0; i < 48; i++) { const th = (i / 48) * Math.PI * 2; tabanNk.push(nokta(th, 0.006).clone().addScaledVector(normal(th, 0.006), 2.5).setZ(5.2)); }
  parcalar.push(boru(tabanNk, true, 120, 5, 0.5));
  // tutma kulpu: tepede kumaş şerit halka (34 mm eninde), uçları dikişe gömülü, arkaya yatık
  const tepe = nokta(0, 1).clone(), merkez = new THREE.Vector3();
  for (let i = 0; i < 12; i++) merkez.add(nokta((i / 12) * Math.PI * 2, 0.93));
  merkez.divideScalar(12);
  const nt = tepe.clone().sub(merkez).normalize(), xl = new THREE.Vector3(1, 0, 0).addScaledVector(nt, -nt.x).normalize();
  nt.applyAxisAngle(xl, -P.kulp);
  const kulp = new THREE.TorusGeometry(46, 2.6, 6, 22, Math.PI).scale(1, 1, 6.5);
  kulp.applyMatrix4(new THREE.Matrix4().makeBasis(xl, nt, xl.clone().cross(nt)).setPosition(tepe.clone().addScaledVector(nt, -14)));
  kulp.setAttribute('color', new THREE.Float32BufferAttribute(new Array(kulp.attributes.position.count * 3).fill(0.9), 3));
  parcalar.push(kulp);

  const { map, normal: nmap } = kumasDokusu(kumas), kadife = kumas === 'kadife';
  const mat = new THREE.MeshPhysicalMaterial({
    color: renk, map, normalMap: nmap, normalScale: new THREE.Vector2(0.7, 0.7), vertexColors: true,
    roughness: kadife ? 0.8 : 0.93, sheen: kadife ? 1 : 0.35, sheenRoughness: kadife ? 0.38 : 0.75,
    sheenColor: new THREE.Color(renk).lerp(new THREE.Color(0xffffff), kadife ? 0.4 : 0.25), envMapIntensity: 0.9,
  });
  const m = new THREE.Mesh(mergeGeometries(parcalar.map((g) => hazir(g, true))), mat);
  m.castShadow = m.receiveShadow = true;
  m.name = 'armut';
  const g = new THREE.Group();
  g.name = 'armut';
  g.add(m);
  return g;
}

// =====================================================================================================================
// ---- cam içecek sehpası ----
// Temperli cam tabla Ø 480 × 10 mm (pahlı, kenarı yeşilimsi), 550 mm; alt cam raf Ø 406 × 8 mm. Pirinç tel çerçeve: üç
// hafif açık ayak, tablanın ve rafın altında halka (camlar halkaların 1 mm üstünde). Üstte iki ince belli çay bardağı
// (tabaklı, kaşıklı), şeker kâsesi; alt rafta kitap. Ayaklar pirinç pabuçla doğrudan zemine basar.
const SEHPA = { boy: 550, r: 240, kalin: 10, rafZ: 196.5, rafR: 203, rafKalin: 8 };

// Çay takımı profilleri (core/oda-ortam.js cayTakimi ile aynı ölçüler)
const TABAK = [[0, 0], [30, 0], [32, 1.5], [40, 3], [48, 6], [54, 10], [56, 12], [55.4, 13], [53, 11.6], [46, 8.6], [36, 6], [26, 4.5], [24, 4], [0, 4]];
const BARDAK = [[0, 0], [20, 0], [21.2, 0.8], [21.6, 2.5], [22.5, 6], [24.5, 13], [25.2, 20], [24.6, 27], [22.4, 34],
  [20, 41], [19, 48], [19.2, 54], [20.5, 62], [22.8, 72], [25.4, 83], [27.4, 92], [28, 96], [27.6, 96.6], [26.8, 96],
  [26.2, 92], [24.2, 83], [21.6, 72], [19.3, 62], [18, 54], [17.8, 48], [18.8, 41], [21.2, 34], [23.4, 27], [24, 20], [23.3, 13],
  [21.4, 8], [19, 7], [0, 7]];
const CAY = [[0, 7.2], [18.8, 7.2], [21.2, 8.2], [23.1, 13], [23.8, 20], [23.2, 27], [21, 34], [18.6, 41], [17.6, 48],
  [17.8, 54], [19.1, 62], [21.4, 72], [23.3, 80], [23.8, 82.5]];
const KASE = [[0, 0], [27, 0], [29, 2], [37, 10], [44, 24], [46.5, 39], [46, 41.5], [44.6, 40.6], [42.6, 25.5], [35.6, 12], [27.5, 5.5], [0, 5.5]];

let sehpaMat = null;
function sehpaMalzeme() {
  if (sehpaMat) return sehpaMat;
  return (sehpaMat = {
    camYuz: camMalzeme({ renk: 0x030504, opak: 0.07, kenar: 0.55, parlak: 1.5 }),
    camKenar: camMalzeme({ renk: 0x4f8a6c, opak: 0.62, kenar: 0.3, puruz: 0.08, parlak: 1 }),
    bardak: camMalzeme({ renk: 0x000000, opak: 0.05, kenar: 0.7, puruz: 0.02, parlak: 1.6 }),
    // Çay opak: geçirgen cam ardındaki ikinci saydam katman olmasın; üst yüz ayrı, koyu ve parlak (güneşte pembe olmasın)
    cay: new THREE.MeshPhysicalMaterial({ color: 0x6a1a07, roughness: 0.12, envMapIntensity: 0.6 }),
    cayUst: new THREE.MeshPhysicalMaterial({ color: 0x3a0a04, roughness: 0.03, envMapIntensity: 0.45 }),
    porselen: new THREE.MeshPhysicalMaterial({ color: 0xf3f1ec, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 }),
    seker: new THREE.MeshStandardMaterial({ color: 0xf7f5ef, roughness: 0.95 }),
    kapak: new THREE.MeshStandardMaterial({ color: 0x6e2a25, roughness: 0.62 }),
    sayfa: new THREE.MeshStandardMaterial({ color: 0xeee6d3, roughness: 0.85 }),
  });
}

export function camSehpa() {
  const S = SEHPA, Mz = { ...ortakMalzeme(), ...sehpaMalzeme() }, K = kova(), r = rnd(29);
  // cam tablalar: yüzler bir ağ, pahlı kenarlar bir ağ (ikisi de saydam; gölge düşürmez)
  const yuzler = [], kenarlar = [], pah = 2;
  for (const [cr, z0, t] of [[S.rafR, S.rafZ, S.rafKalin], [S.r, S.boy - S.kalin, S.kalin]]) {
    yuzler.push(hazir(new THREE.CircleGeometry(cr - pah, 72).rotateX(Math.PI).translate(0, 0, z0)));
    yuzler.push(hazir(new THREE.CircleGeometry(cr - pah, 72).translate(0, 0, z0 + t)));
    kenarlar.push(hazir(donme([[cr - pah, z0], [cr - 0.6, z0 + 0.6], [cr, z0 + pah], [cr, z0 + t - pah], [cr - 0.6, z0 + t - 0.6], [cr - pah, z0 + t]], 96)));
  }
  // pirinç çerçeve: üst halka (cam 1 mm üstünde), üç ayak (tabanda keçeli pabuç), alt halka ve ayaklara kolları
  const ust = S.boy - S.kalin - 1 - 6, alt = S.rafZ - 1 - 5;
  K.ekle('pirinc', new THREE.TorusGeometry(200, 6, 8, 80).translate(0, 0, ust));
  K.ekle('pirinc', new THREE.TorusGeometry(196, 5, 8, 80).translate(0, 0, alt));
  const ayakR = (z) => 222 - 22 * (z - 8) / (ust - 8);
  for (let k = 0; k < 3; k++) {
    const a = (90 + 120 * k) * D2R, c = Math.cos(a), s = Math.sin(a);
    K.ekle('pirinc', cubuk([c * 222, s * 222, 8], [c * 200, s * 200, ust], 7, 6.5, 14));
    K.ekle('pirinc', cubuk([c * 222, s * 222, 0], [c * 222, s * 222, 9], 11, 10, 18));
    K.ekle('pirinc', cubuk([c * 199, s * 199, alt], [c * (ayakR(alt) - 4), s * (ayakR(alt) - 4), alt], 4.5, 4.5, 10));
  }
  // çay takımı: iki tabak (yaldız yaldızlı kenar), iki bardak, çay, kaşık
  const zT = S.boy + 1, bardaklar = [];
  for (const [x, y, rz] of [[-95, -55, 0.3], [70, -95, 2.1]]) {
    const M = ile(otele(x, y, zT), new THREE.Matrix4().makeRotationZ(rz));
    K.ekle('porselen', donme(TABAK, 48), M);
    K.ekle('pirinc', new THREE.TorusGeometry(55.2, 0.9, 4, 64).translate(0, 0, 12.4), M);
    bardaklar.push(hazir(donme(BARDAK, 48).translate(0, 0, 4).applyMatrix4(M)));
    K.ekle('cay', donme(CAY, 40).translate(0, 0, 4), M);
    K.ekle('cayUst', new THREE.CircleGeometry(23.8, 40).translate(0, 0, 4 + 82.5), M);
    // kaşık: tabağın kenarına yaslı, sapı dışarı taşar
    K.ekle('alu', new THREE.SphereGeometry(1, 16, 8).scale(7.5, 12, 2.2).translate(0, -38, 9.2), ile(M, new THREE.Matrix4().makeRotationX(-0.08)));
    K.ekle('alu', cubuk([0, -50, 11], [0, -108, 22], 1.6, 2.2, 8), M);
  }
  // şeker kâsesi ve kesme şekerler
  const Mk = otele(55, 95, zT);
  K.ekle('porselen', donme(KASE, 40), Mk);
  for (let i = 0; i < 7; i++) {
    const kat = i < 4 ? 0 : 1, a = i * 1.7 + r(), rr = kat ? 10 + r() * 6 : 17;
    K.ekle('seker', new RoundedBoxGeometry(15, 15, 15, 1, 1.4)
      .rotateZ(r() * 6).rotateX((r() - 0.5) * (kat ? 0.9 : 0.15)).translate(Math.cos(a) * rr, Math.sin(a) * rr, 6.5 + 7.5 + kat * 13), Mk);
  }
  // alt rafta kitap (ciltli: iki kapak, sırt, sayfalar)
  const Mb = ile(otele(-15, 20, S.rafZ + S.rafKalin + 1), new THREE.Matrix4().makeRotationZ(0.35));
  K.ekle('kapak', new RoundedBoxGeometry(160, 230, 2.6, 1, 1).translate(0, 0, 1.3), Mb);
  K.ekle('kapak', new RoundedBoxGeometry(160, 230, 2.6, 1, 1).translate(0, 0, 22.7), Mb);
  K.ekle('kapak', new RoundedBoxGeometry(7, 230, 24, 1, 2.5).translate(-77, 0, 12), Mb);
  K.ekle('sayfa', new THREE.BoxGeometry(150, 223, 18.8).translate(1, 0, 12), Mb);

  const g = new THREE.Group();
  g.name = 'camSehpa';
  g.add(...K.aglar(Mz));
  const camY = new THREE.Mesh(mergeGeometries(yuzler), Mz.camYuz), camK = new THREE.Mesh(mergeGeometries(kenarlar), Mz.camKenar);
  const bardak = new THREE.Mesh(mergeGeometries(bardaklar), Mz.bardak);
  bardak.renderOrder = 1; // masanın camından sonra çizilsin (yukarıdan bakışta önde)
  for (const m of [camY, camK, bardak]) { m.castShadow = false; m.receiveShadow = false; }
  camY.name = 'camYuz'; camK.name = 'camKenar'; bardak.name = 'bardak';
  g.add(camY, camK, bardak);
  return g;
}
