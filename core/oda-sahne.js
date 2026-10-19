// Oda sahnesi (docs/oda-sahnesi.md): ev ofisi ve açık balkon (şimdilik gri kutu: düz bloklar). Her bölgenin
// ürünü bir yuvada durur; yuvadaki model araçların gerçek şablonu (core/oda-urunler.js). Yakın plandayken şablon
// değişir (api.show): eski model küçülüp kaybolur, yenisi yerine oturur; saksıda bitki yerinde kalır, yeni saksının
// ağzına iner. Yerler ve kamera core/oda-yerler.js'ten.
// Pilot (options.pilot, lab: ?pilot=1): oda kabuğu, pervazlar, kasalar ve balkon Blender'da pişmiş GLB'den gelir
// (core/oda-ortam.js, scripts/oda-blender.py); camlar gerçek cam, ışık sabah güneşi ve huzmeler, saksıda toprak ve
// gerçek çiçek. Mobilya şimdilik gri kutu.
// Davranış: çekmece üzerine gelince aralanır, yakınlaşınca açılır; buzdolabının kapağı yakınlaşınca açılır.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { initCSG } from './csg.js';
import { ZONES, A, SHOTS, LOOK, FOCUS, LIGHTS } from './oda-yerler.js';
import { TEMPLATES, COKLU, buildTemplate, binModel, vaseModel, OZEL_TUSLAR } from './oda-urunler.js';
import { OLCU, toSun } from './oda-olcu.js';

const TAU = Math.PI * 2;
const { ROOM, GLASS, BALCONY, DESK, SILL, SHELF, PEDESTAL, FRIDGE } = OLCU; // GLASS: pencere | kapı | pencere
const FRAME = { w: 680, h: 520 };      // sol duvardaki yapboz çerçevesi
const FRAME_K = { w: 320, h: 250 };    // monitörün sol üstündeki rölyef çerçevesi
const yieldMain = () => globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));
export const options = { pilot: false }; // sayfa sahne kurulmadan önce açar

// Pilotun dosyaları (scripts/oda-blender.py çıktıları) ve ışık ayarı; yalnız pilot açıkken yüklenir
async function pilotYukle() {
  const O = await import('./oda-ortam.js');
  const meta = await O.ortamMeta();
  const [kabuk, pano, gok, cicek, esya] = await Promise.all([O.odaKabugu(meta), O.panoDokusu(meta), O.gokKubbesi(meta), O.cicekler(meta), O.esyalar(meta)]);
  const sun = toSun(meta.gunes), G = GLASS, yd = ROOM.y1 + ROOM.wall; // huzmeler duvarın dış yüzünden başlar
  const huzme = O.huzmeler([
    { x0: G.door0, x1: G.door1, z0: 0, z1: G.head, y: yd },
    { x0: G.x0, x1: G.door0, z0: G.sill, z1: G.head, y: yd },
    { x0: G.door1, x1: G.x1, z0: G.sill, z1: G.head, y: yd },
  ], sun, { yogunluk: 0.015 }); // havada hafif bir iz: oda ışığı ~0,03; daha güçlüsü sağ yarıyı sütlü bir perdeyle örtüyordu
  const c = LIGHTS.center, dist = 5000, PD = meta.esya.perde ?? { ust: 90, alt: 12 };
  // Tül perde iki yan pencerede: ışığın süzülmesi pişmiş dokuda, burada kumaş rüzgârla salınır
  const perde = esya.perde ? O.perdeTul(esya.perde, { zUst: G.head + PD.ust, zAlt: G.sill + PD.alt }) : null;
  return {
    meta, kabuk, pano, gok, cicek, esya, huzme, perde, golge: O.golgeYuzeyi, cayTakimi: O.cayTakimi,
    saksi: { toprak: O.toprakMalzemesi(), malzeme: (renk) => P_.clay(renk, { rough: 0.36, env: 1 }) },
    // Güneş: pişirmedekiyle aynı yön, renk ve güç (fiziksel birimler); ortam ışığı 360° görüntüden, diğer lambalar kapalı
    isik: { ...LIGHTS, key: [c[0] + sun[0] * dist, c[1] + sun[1] * dist, c[2] + sun[2] * dist], keyIntensity: meta.gunes.strength, keyColor: meta.gunes.color,
      hemi: 0, fillIntensity: 0, rimIntensity: 0, toneMapping: 'agx', exposure: 3.6 }, // loş oda: güneş lekesi parlak, köşeler karanlık
  };
}
let P_ = null; // props.js (buildScene'e gelir; pilot malzemesi için)

export async function buildScene({ scene, P, lang = 'tr' }) {
  P_ = P;
  await initCSG();
  const pilot = options.pilot ? await pilotYukle() : null;
  const kabuk = !pilot; // gri kutu oda kabuğu (pilotta GLB'den gelir)
  const tone = (c, rough = 0.85) => P.clay(c, { rough, env: 0.45 });
  const M = {
    wall: tone(0xdcd8d1), floor: tone(0xb9b3a9), deck: tone(0x9a8e7d), top: tone(0xebe8e2, 0.6),
    metal: P.clay(0x2a2b2d, { rough: 0.45, env: 0.6 }), ped: tone(0xa9a49c, 0.7), front: tone(0xb4afa7, 0.7),
    shelf: tone(0x4b4c4e, 0.7), fridge: tone(0xd2d0cb, 0.5), inner: tone(0xf1efea, 0.5), dark: tone(0x3a3c3f, 0.6),
    rattan: tone(0xc8b28a, 0.9), city: tone(0xcfd6dc, 0.95), leaf: tone(0x7b8a57, 0.9), trunk: tone(0x6b5a46, 0.9),
    lav: tone(0x8f7fb8, 0.8), stem: tone(0x7f8c62, 0.9),
    glass: P.clay(0xbfd3dc, { rough: 0.08, env: 1, transparent: true, opacity: 0.2 }),
  };
  if (pilot) M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 6, ior: 1.5, envMapIntensity: 1 });
  // Kutu (tabanı z'de, XY'de ortalı); parent yoksa sahneye eklenir
  const box = (w, d, h, x, y, z, mat, { r = 2, parent = scene, cast = true } = {}) => {
    const m = P.mesh(P.rbox(w, d, h, r), mat, { cast });
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const place = (o, [x, y, z, rz = 0], parent = scene) => { o.position.set(x, y, z); o.rotation.z = rz; parent.add(o); return o; };
  const span = (a, b) => [b - a, (a + b) / 2];

  // ---- oda kabuğu: duvarlar gölge düşürmez (ışık balkona da ulaşsın; gerçek ışık Blender'da pişirilecek) ----
  const W = ROOM.wall, by = ROOM.y1 + W / 2;
  if (kabuk) {
    box(ROOM.x1 - ROOM.x0, ROOM.y1 - ROOM.y0, 20, 0, 0, -20, M.floor, { r: 0, cast: false });
    box(W, ROOM.y1 - ROOM.y0, ROOM.h, ROOM.x0 - W / 2, 0, 0, M.wall, { r: 0, cast: false });
    box(W, ROOM.y1 - ROOM.y0, ROOM.h, ROOM.x1 + W / 2, 0, 0, M.wall, { r: 0, cast: false });
    { const [w, x] = span(ROOM.x0 - W, GLASS.x0); box(w, W, ROOM.h, x, by, 0, M.wall, { r: 0, cast: false }); }
    { const [w, x] = span(GLASS.x1, ROOM.x1 + W); box(w, W, ROOM.h, x, by, 0, M.wall, { r: 0, cast: false }); }
    { const [w, x] = span(GLASS.x0, GLASS.x1); box(w, W, ROOM.h - GLASS.head, x, by, GLASS.head, M.wall, { r: 0, cast: false }); }
  }
  for (const [a, b] of [[GLASS.x0, GLASS.door0], [GLASS.door1, GLASS.x1]]) { // pencere: alt duvar, cam, içeri taşan pervaz
    const [w, x] = span(a, b);
    box(w, 8, GLASS.head - GLASS.sill, x, by, GLASS.sill, M.glass, { r: 1, cast: false });
    if (!kabuk) continue;
    box(w, W, GLASS.sill, x, by, 0, M.wall, { r: 0, cast: false });
    box(w + SILL.over, SILL.depth, SILL.t, x, ROOM.y1 - SILL.inset, GLASS.sill - SILL.t, M.top, { cast: false });
  }
  if (kabuk) {
    box(40, W + 20, GLASS.head, GLASS.door0 + 20, by, 0, M.metal, { r: 1 });
    box(40, W + 20, GLASS.head, GLASS.door1 - 20, by, 0, M.metal, { r: 1 });
    box(GLASS.door1 - GLASS.door0, W + 20, 40, (GLASS.door0 + GLASS.door1) / 2, by, GLASS.head - 40, M.metal, { r: 1 });
  }
  {
    // Sürgülü kapı, ortadan açılır: iki kanat duvarın dış yüzündeki raylarda kayıp iki yandaki pencerelerin önünde
    // durur. Açıkken balkona taşmaz (menteşeli kanat sandalyelere giriyordu).
    const LW = (GLASS.door1 - GLASS.door0) / 2 + 20, LH = GLASS.head - 20, ty = ROOM.y1 + W + 26;
    const leaf = (cx) => {
      const g = place(new THREE.Group(), [cx, ty, 0]);
      box(LW - 60, 8, LH - 70, 0, 0, 35, M.glass, { r: 1, parent: g, cast: false });
      if (!kabuk) return; // kanat kasaları pilotta GLB'de
      for (const [w, h, x, z] of [[LW, 40, 0, 0], [LW, 40, 0, LH - 40], [36, LH, -LW / 2 + 18, 0], [36, LH, LW / 2 - 18, 0]]) {
        box(w, 30, h, x, 0, z, M.metal, { r: 1, parent: g });
      }
    };
    leaf(GLASS.door0 - LW / 2 + 30); // sol kanat sol pencerenin önünde
    leaf(GLASS.door1 + LW / 2 - 30); // sağ kanat sağ pencerenin önünde
    if (kabuk) for (const z of [0, GLASS.head]) box(GLASS.x1 - GLASS.x0, 46, 14, (GLASS.x0 + GLASS.x1) / 2, ty, z, M.metal, { r: 1 }); // alt ve üst ray
  }

  // ---- balkon: ahşap zemin, siyah korkuluk, sağda binanın duvarı, uzakta sisli şehir (pilotta GLB ve gökyüzü) ----
  if (kabuk) {
    const y0 = ROOM.y1 + W;
    const [bw, bcx] = span(BALCONY.x0, BALCONY.x1), [bd, bcy] = span(y0, BALCONY.y1);
    box(bw, bd, 60, bcx, bcy, -60, M.deck, { r: 0, cast: false });
    for (let x = BALCONY.x0 + 75; x < BALCONY.x1; x += 150) box(6, bd, 2, x, bcy, 0, M.dark, { r: 0, cast: false });
    for (const [w, d, x, y] of [[bw, 40, bcx, BALCONY.y1 - 20], [40, bd, BALCONY.x0 + 20, bcy]]) {
      box(w, d, 40, x, y, 1010, M.metal, { r: 2 });
      box(w, d, 30, x, y, 70, M.metal, { r: 2 });
    }
    const bars = [];
    for (let x = BALCONY.x0 + 80; x < BALCONY.x1 - 20; x += 120) bars.push([x, BALCONY.y1 - 20]);
    for (let y = y0 + 80; y < BALCONY.y1 - 40; y += 120) bars.push([BALCONY.x0 + 20, y]);
    const im = new THREE.InstancedMesh(P.rbox(18, 18, 910, 2), M.metal, bars.length);
    const o = new THREE.Object3D();
    bars.forEach(([x, y], i) => { o.position.set(x, y, 100); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = true;
    scene.add(im);
    box(W, bd, ROOM.h, BALCONY.x1 + W / 2, bcy, 0, M.wall, { r: 0, cast: false });
    const r = P.rng(21);
    for (let i = 0; i < 18; i++) {
      const w = 500 + r() * 900, h = 2500 + r() * 6500;
      box(w, 700, h, -5200 + i * 700 + r() * 250, 5400 + r() * 1300, -500, M.city, { r: 0, cast: false });
    }
  }

  // ---- çalışma köşesi (referans: sade ev ofisi, yatay aynalanmış) ----
  {
    const [w, x] = span(DESK.x0, DESK.x1), [d, y] = span(DESK.y0, DESK.y1);
    box(w, d, DESK.t, x, y, DESK.top - DESK.t, M.top, { r: 4 });
    for (const lx of [DESK.x0 + 20, DESK.x1 - 20]) for (const ly of [DESK.y0 + 20, DESK.y1 - 20]) box(28, 28, DESK.top - DESK.t, lx, ly, 0, M.metal, { r: 1 });
    box(w - 40, 24, 40, x, DESK.y1 - 20, DESK.top - DESK.t - 40, M.metal, { r: 1 });
  }
  for (const z of SHELF.z) { // iki duvar rafı masanın sağ yarısında, ince siyah konsollarla
    box(SHELF.w, SHELF.d, SHELF.t, SHELF.x, SHELF.y, z, M.shelf, { r: 3 });
    for (const x of SHELF.brackets) box(14, 200, 110, x, SHELF.y + 10, z - 110, M.metal, { r: 1 });
  }
  box(240, 170, 110, -480, 1700, 1718, M.dark, { r: 4 }); // üst rafta kutu (dekor)
  // Lamba: duvar köşesinde, dolabın üstünde dik ve uzun; spot başı masaya bakar
  place(P.lamp({ a1: 0, l1: 640, a2: 1.45, l2: 240, tilt: -0.5 }), [PEDESTAL.x - PEDESTAL.w / 2 + 85, ROOM.y1 - 95, PEDESTAL.h, -0.24]);

  // ---- yuvalar: bölgenin ürünü burada; şablon değişince yalnız yuvadaki model değişir ----
  const slots = {};
  const duvarlar = {}, donen = {}; // yakın planda çevirme: bölge → duvardaki nesne; bölge → { obj, rz0, pos0, w, aci }
  let klavyeBilgi = null; // klavye kurulunca: tuş yerleri ve anahtarlığın yeri (klavye şablonları için)
  const agiz = (m) => m.userData.soil ?? m.userData.h; // bitki toprağa (yoksa saksının ağzına) oturur
  const tag = (o, zone) => o.traverse((x) => { x.userData.hotspot = zone; });
  // Önbellekte üretimin sözü (promise) durur: önceden üretme ile gösterme yarışsa da aynı şablon iki kez üretilmez
  function model(zone, id) {
    const s = slots[zone];
    if (!s.cache.has(id)) {
      const p = buildTemplate(zone, id, { lang, saksi: pilot?.saksi, pasta: pilot?.cicek.pasta, klavye: klavyeBilgi, kart: pilot?.esya.kart_anahtarlik }).then((m) => { tag(m, zone); return m; });
      p.catch(() => s.cache.delete(id)); // üretilemediyse sonraki istekte yeniden denenir
      s.cache.set(id, p);
    }
    return s.cache.get(id);
  }
  // Yakın plandaki bölgenin komşu şablonları boşta önceden üretilir: ilk gösterimde takılma olmasın
  function prefetch(zone) {
    const s = slots[zone], list = TEMPLATES[zone];
    if (!s || list.length < 2) return;
    for (const d of [1, -1]) model(zone, list[(s.index + d + list.length) % list.length].id);
  }
  async function slot(zone, host, { plant = null } = {}) {
    const s = (slots[zone] = { host, plant, cache: new Map(), index: 0, model: null, busy: false });
    const list = TEMPLATES[zone];
    if (COKLU[zone]) {
      // Çoklu yuva (QR): her ürün kendi yerinde, ilk şablonuyla. Ürün düğümü: kok (yer) → mentese (ön kenarda, dikelme
      // ekseni) → ic (modeli kenara göre geri kaydırır) → model
      s.coklu = {};
      for (const [urun, c] of Object.entries(COKLU[zone])) {
        const t = list.find((x) => x.urun === urun);
        const u = { ...c, kok: place(new THREE.Group(), c.yer, host), mentese: new THREE.Group(), ic: new THREE.Group(), id: t.id };
        u.kok.add(u.mentese);
        u.mentese.add(u.ic);
        u.model = await model(zone, t.id);
        u.ic.add(u.model);
        u.mentese.rotation.x = c.dur ?? 0;
        kenar(u);
        s.coklu[urun] = u;
      }
      s.model = s.coklu[list[0].urun].model;
    } else {
      s.model = await model(zone, list[0].id);
      host.add(s.model);
    }
    if (plant) plant.position.z = agiz(s.model);
    dispatchEvent(new CustomEvent('oda-kurulum', { detail: Object.keys(slots).length / ZONES.length })); // açılış çubuğu
    await yieldMain();
    return s;
  }
  // Çoklu yuvada dikelme ekseni modelin ön kenarında: kenar orada kalır, arkası kalkar (yatan anahtarlık kameraya döner)
  function kenar(u) {
    const y = u.model.userData.onKenar ?? 0;
    u.mentese.position.y = y;
    u.ic.position.y = -y;
  }
  // Seçili ürünü öne çıkarır (yalnız yakın planda; genel planda hepsi yerinde). Diğerleri yerinde kalır, silinmez.
  function isaretle(zone, { reduced = false } = {}) {
    const s = slots[zone];
    if (!s?.coklu) return;
    const secili = focusedId === zone ? TEMPLATES[zone][s.index].urun : null, d = reduced ? 0.01 : 0.45;
    for (const [urun, u] of Object.entries(s.coklu)) {
      const on = urun === secili;
      gsap.to(u.mentese.rotation, { x: on ? u.egim : u.dur ?? 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to(u.kok.position, { z: u.yer[2] + (on ? u.kalk : 0), duration: d, ease: 'power3.out', overwrite: true });
    }
  }

  // ---- çekmeceli dolap; üst çekmece raylı, −y yönünde açılır; içinde Kutu aracının çekmeceye uyan şablonları ----
  const PED = PEDESTAL;
  const [px, py] = A.pedestal;
  const pedestal = new THREE.Group();
  box(PED.w, PED.d, 470, 0, 0, 0, M.ped, { parent: pedestal, r: 3 });
  for (const z of [15, 245]) box(PED.w - 16, 12, 220, 0, -PED.d / 2 - 2, z, M.front, { parent: pedestal });
  box(PED.w, PED.d, 20, 0, 0, PED.h - 20, M.ped, { parent: pedestal, r: 3 });
  for (const sx of [-1, 1]) box(18, PED.d, PED.h - 490, sx * (PED.w / 2 - 9), 0, 470, M.ped, { parent: pedestal });
  box(PED.w, 16, PED.h - 490, 0, PED.d / 2 - 8, 470, M.ped, { parent: pedestal });
  place(pedestal, [px, py, 0]);
  const drawer = new THREE.Group();
  {
    const DR = { w: PED.w - 40, d: PED.d - 40 };
    box(PED.w - 16, 16, 215, 0, -PED.d / 2 - 6, 0, M.front, { parent: drawer, r: 3 });
    box(140, 14, 14, 0, -PED.d / 2 - 22, 160, M.metal, { parent: drawer, r: 6 });
    box(DR.w, DR.d, 10, 0, -10, 0, M.inner, { parent: drawer, r: 1 });
    for (const sx of [-1, 1]) box(10, DR.d, 120, sx * (DR.w / 2 - 5), -10, 10, M.inner, { parent: drawer, r: 1 });
    box(DR.w, 10, 120, 0, DR.d / 2 - 15, 10, M.inner, { parent: drawer, r: 1 });
  }
  place(drawer, [px, py, 490]);
  const DRAWER_Y = py;
  await slot('cekmece', place(new THREE.Group(), [0, -10, 10], drawer));

  // ---- masanın üstü: kalemlik yuvası (monitörün solunda) ----
  const penZone = new THREE.Group();
  scene.add(penZone);
  await slot('kalemlik', place(new THREE.Group(), A.pencup, penZone));

  // ---- klavye (hafif eğik, arkası ayaklı): Esc, Enter ve yukarı ok boş (MX anahtarı); yuvası klavyenin kendisi,
  // şablon o tuşlara başlık takar ve klavyenin sağına aynı tasarımın anahtarlığını koyar ----
  const kbZone = new THREE.Group();
  scene.add(kbZone);
  const kbHost = place(new THREE.Group(), A.keyboard, kbZone), kb = P.mechKeyboard({ skip: OZEL_TUSLAR });
  if (pilot) kbHost.position.z += OLCU.MAT.t; // pilotta mousepad'in üstünde
  kb.rotation.x = 0.1;
  kb.position.z = (kb.userData.size.d / 2) * Math.sin(0.1);
  kbHost.add(kb);
  for (const sx of [-1, 1]) box(26, 10, 11, sx * (kb.userData.size.w / 2 - 32), 50, 0, P.clay(0x2a2c30, { rough: 0.7 }), { parent: kbHost });
  kbZone.updateMatrixWorld(true);
  klavyeBilgi = {
    keys: kb.userData.keys, capZ: kb.userData.capZ,
    yer: kb.matrixWorld.clone().invert().multiply(new THREE.Matrix4().compose(new THREE.Vector3(A.clickers[0], A.clickers[1], A.clickers[2]),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), A.clickers[3]), new THREE.Vector3(1, 1, 1))),
  };
  await slot('klavye', kb);

  // ---- rafta modem (dekor) ve QR yuvası: Wi-Fi standı modemin üstünde, kartvizit sağında, anahtarlık en sağda ----
  const modemZone = new THREE.Group();
  scene.add(modemZone);
  {
    const modem = place(new THREE.Group(), A.modem, modemZone);
    box(230, 150, 36, 0, 0, 0, M.dark, { parent: modem, r: 8 });
    for (const x of [-80, 80]) place(P.mesh(P.cyl(5, 5, 150, 8), M.dark), [x, 55, 30], modem);
  }
  await slot('modem', place(new THREE.Group(), A.qrHolder, modemZone));

  // ---- balkon kapısının üstünde 3D Yazı plakası ("Oksijen alma alanı") ----
  const sign = place(new THREE.Group(), A.sign);
  duvarlar.tabela = sign;
  await slot('tabela', sign);

  // ---- sol duvarda iki yatay çerçeve: Painter rölyefi ve resimli yapboz ----
  const frameOf = (at, F2, rz) => {
    const f = place(new THREE.Group(), at);
    box(F2.w, 30, F2.h, 0, 0, 0, M.dark, { parent: f, r: 4 });
    box(F2.w - 40, 6, F2.h - 40, 0, -16, 20, tone(0xefe9df, 0.8), { parent: f, r: 2 });
    f.rotation.z = rz; // ön yüzü odaya
    return f;
  };
  const frameA = frameOf(A.frameA, FRAME_K, 0), frameB = frameOf(A.frameB, FRAME, Math.PI / 2);
  duvarlar.cerceve = frameA;
  duvarlar.yapboz = frameB;
  const rolyef = place(new THREE.Group(), [0, -20, FRAME_K.h / 2], frameA);
  // Rölyef Painter aracından gerçek ölçüde (248 mm + kenar): çerçevenin 280 × 210 mm arkalığına sığar
  await slot('cerceve', rolyef);
  await slot('yapboz', place(new THREE.Group(), [0, -20, FRAME.h / 2], frameB));

  // ---- saksılar: soldaki pervaz saksısı yuva (bitki yerinde kalır), diğerleri sabit; balkonda büyük saksılar ----
  const pots = new THREE.Group();
  scene.add(pots);
  const sprout = (k = 1) => { // saksıda küçük yeşillik (içerik, yer tutucu)
    const s = P.mesh(new THREE.SphereGeometry(48 * k, 16, 10), M.leaf);
    s.scale.z = 0.7;
    return s;
  };
  {
    const hero = place(new THREE.Group(), [A.sillL[0] - 115, A.sillL[1], A.sillL[2]], pots);
    const plant = pilot?.cicek.cicek_a ?? sprout();
    hero.add(plant);
    await slot('saksilar', hero, { plant });
    for (const [id, at, k, cicek] of [['tulip', [A.sillL[0] + 115, A.sillL[1], A.sillL[2]], 0.8, 'cicek_b'], ['ribbed', A.sillR, 0.6, null]]) {
      const v = place(vaseModel(id, {}, pilot?.saksi), at, pots), s = (pilot && cicek ? pilot.cicek[cicek] : null) ?? (pilot ? null : sprout(k));
      if (!s) continue;
      s.position.z = agiz(v);
      v.add(s);
    }
    const olive = place(vaseModel('hex', {}, pilot?.saksi), A.planterL, pots); // büyük saksı (bizim baskımız)
    olive.scale.setScalar(2.8);
    const bowl = place(vaseModel('flower', {}, pilot?.saksi), A.planterR, pots); // kase saksı
    bowl.scale.setScalar(2.4);
    if (pilot) { // gerçek bitkiler (Poly Haven CC0): antoryum ve gazanya, toprağa oturur
      place(pilot.cicek.balkon_bitki, [A.planterL[0], A.planterL[1], agiz(olive) * 2.8 - 6], pots);
      place(pilot.cicek.balkon_cicek, [A.planterR[0], A.planterR[1], agiz(bowl) * 2.4 - 4], pots);
    }
  }
  if (!pilot) { // gri kutu: top yapraklı zeytin ve çubuk lavanta
    const tree = place(new THREE.Group(), [A.planterL[0], A.planterL[1], 300], pots);
    tree.add(P.mesh(P.cyl(12, 20, 950, 10), M.trunk));
    [[0, 0, 1180, 230], [-120, 40, 1050, 170], [130, -30, 1080, 180], [30, 90, 1320, 160]].forEach(([x, y, z, rr]) => {
      tree.add(P.mesh(new THREE.SphereGeometry(rr, 14, 10), M.leaf).translateX(x).translateY(y).translateZ(z));
    });
    const lav = place(new THREE.Group(), [A.planterR[0], A.planterR[1], 200], pots);
    const r = P.rng(8);
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU, rr = r() * 120, len = 280 + r() * 120, lean = 0.25 + r() * 0.2;
      const st = new THREE.Group();
      st.add(P.mesh(P.cyl(3, 3, len, 6), M.stem));
      place(P.mesh(P.cyl(8, 6, 70, 8), M.lav), [0, 0, len], st);
      st.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0);
      st.rotation.set(-Math.sin(a) * lean, Math.cos(a) * lean, 0);
      lav.add(st);
    }
  }

  // ---- balkon masası: bistro masa ve rattan sandalyeler (dekor), kupa; QR yuvası (menü / altlık) ----
  const tableDecor = new THREE.Group();
  scene.add(tableDecor);
  {
    const t = place(new THREE.Group(), A.table, tableDecor);
    t.add(P.mesh(P.cyl(220, 220, 14, 40), M.metal));
    place(P.mesh(P.cyl(24, 24, 700, 16), M.metal), [0, 0, 14], t);
    place(P.mesh(P.cyl(300, 300, 22, 48), M.dark), [0, 0, 700], t);
    for (const [dx, dy, rz] of [[-480, -60, -Math.PI / 2 + 0.15], [480, 90, Math.PI / 2 + 0.1]]) {
      const ch = place(new THREE.Group(), [A.table[0] + dx, A.table[1] + dy, 0, rz], tableDecor);
      box(440, 440, 40, 0, 0, 430, M.rattan, { parent: ch, r: 10 });
      box(440, 40, 420, 0, -200, 470, M.rattan, { parent: ch, r: 10 });
      for (const lx of [-200, 200]) for (const ly of [-200, 200]) box(22, 22, 430, lx, ly, 0, M.metal, { parent: ch, r: 2 });
    }
    // Pilotta kupanın yerine cam çay bardağı (gerçek cam, demli çay, porselen tabak)
    place(pilot ? pilot.cayTakimi() : P.mug({ color: 0xe8e2d6 }), [A.table[0] - 120, A.table[1] - 60, 722], tableDecor);
  }
  const tableItems = new THREE.Group();
  scene.add(tableItems);
  await slot('balkonMasa', place(new THREE.Group(), [A.table[0] + 80, A.table[1] + 60, 722, -0.3], tableItems));

  // ---- mini buzdolabı (sağ duvar, ön yüzü −x): üst rafta pasta süsü yuvası, iki raf yiyecekle dolu; üstünde döner
  // tablada Text Flip yuvası ----
  const F = FRIDGE;
  const fridge = place(new THREE.Group(), A.fridge);
  if (pilot) fridge.add(pilot.esya.buzdolabi); // gerçekçi model (raf ve taban yuvaların yüksekliğinde)
  else {
    box(20, F.w, F.h, F.d / 2 - 10, 0, 0, M.fridge, { parent: fridge, r: 4 });
    for (const sy of [-1, 1]) box(F.d, 20, F.h, 0, sy * (F.w / 2 - 10), 0, M.fridge, { parent: fridge, r: 4 });
    box(F.d, F.w, 20, 0, 0, F.h - 20, M.fridge, { parent: fridge, r: 4 });
    box(F.d, F.w, 60, 0, 0, 0, M.fridge, { parent: fridge, r: 4 });
    box(F.d - 50, F.w - 50, 10, 10, 0, F.shelf - 10, M.inner, { parent: fridge, r: 2 });
    box(F.d - 40, F.w - 40, 8, 10, 0, F.floor - 8, M.inner, { parent: fridge, r: 2 });
  }
  // Raflarda yiyecek (pilot, Poly Haven CC0; düşük çözünürlük): üstte pastanın iki yanında meyve, altta sürahi, süt,
  // konserve ve meyve. Buzdolabının yerel düzlemi: x derinlik (ön −x; kapak raflarına çarpmasın diye x > −150), y genişlik
  if (pilot) {
    // Kopya bir kabın içinde: düğümün kendi konumu (tabanı orijine getiren kayma, limonda 52 mm) korunur
    const koy = (ad, x, y, z, rz = 0) => { if (pilot.cicek[ad]) place(new THREE.Group().add(pilot.cicek[ad].clone()), [x, y, z, rz], fridge); };
    koy('yiyecek_nar', 120, 160, F.shelf, 0.6);
    koy('yiyecek_elma', 130, -165, F.shelf, 1.2);
    koy('yiyecek_limon', -70, -170, F.shelf, 0.4);
    koy('yiyecek_misket', -90, 175, F.shelf, 2.1);
    koy('yiyecek_misket', -30, 190, F.shelf, 0.3);
    koy('yiyecek_surahi', 95, -80, F.floor, Math.PI / 2 + 0.15);
    koy('yiyecek_sut', 125, 150, F.floor, 0.25);
    koy('yiyecek_fasulye', 0, 180, F.floor);
    koy('yiyecek_domates', -50, 75, F.floor, 1.1);
    koy('yiyecek_kivi', -95, -165, F.floor, 0.8);
    koy('yiyecek_kivi', -130, -100, F.floor, 2.6);
    koy('yiyecek_elma', -60, -40, F.floor, 3.0);
  }
  await slot('buzdolabi', place(new THREE.Group(), [-40, 0, F.shelf, -Math.PI / 2], fridge));
  let door; // menteşe arka köşede; yakın planda açılır
  if (pilot) door = pilot.esya.buzdolabi.getObjectByName('buzdolabi_kapak');
  else {
    door = place(new THREE.Group(), [-F.d / 2, F.w / 2, 0], fridge);
    box(24, F.w, F.h - 10, -12, -F.w / 2, 5, M.fridge, { parent: door, r: 6 });
    box(16, 20, 220, -30, -F.w + 40, 380, M.metal, { parent: door, r: 6 });
  }
  // Kapağın ön yüzünde mıknatıs yuvası (kapakla birlikte döner). Yerel düzlem: x sağa (−y), y yukarı (z), z dışarı (−x)
  const kapakYuzu = new THREE.Group();
  kapakYuzu.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0)));
  kapakYuzu.position.set(-26.5, -F.w / 2, 0);
  door.add(kapakYuzu);
  await slot('miknatis', kapakYuzu);
  // Kapak raflarında markasız içecekler (pilot): üst rafta üç kutu, altta şişe ve kutu (kapağın yerel düzleminde)
  if (pilot) {
    const O = await import('./oda-ortam.js');
    for (const [renk, y] of [[0xb3181d, -340], [0xef7d1a, -268], [0x2a2224, -196]]) place(O.icecekKutusu(renk), [52, y, 565], door);
    place(O.camSise(), [52, -330, 285], door);
    place(O.icecekKutusu(0x6aa84f), [52, -250, 285], door);
  }
  // Kapak açılınca iç ışık yanar (pilot). Sahne mm: nokta ışığın gücü bu yüzden büyük (ışık mesafenin karesiyle söner).
  const icIsik = pilot ? place(new THREE.PointLight(0xfff3e4, 0, 700, 2), [-60, 0, F.h - 120], fridge) : null;
  // Monitör klavyenin arkasında (pilot): ekranında Kutu aracının sayfası; masa altı (kasa, priz, kablo kanalı, fare,
  // mousepad) dünya koordinatında gelir
  if (pilot) {
    place(pilot.esya.monitor, A.monitor);
    scene.add(pilot.esya.masa_alti);
    if (pilot.perde) scene.add(pilot.perde);
    // Oyuncu koltuğu: masanın sağ önünde, halının üstünde (durak kameralarının önüne girmez)
    if (pilot.esya.koltuk) place(pilot.esya.koltuk, [OLCU.CHAIR.x, OLCU.CHAIR.y, 0, OLCU.CHAIR.rz]);
  }
  const flipZone = place(new THREE.Group(), [A.fridge[0], A.fridge[1], F.h, -Math.PI / 2 + 0.5]);
  flipZone.add(P.mesh(P.cyl(90, 90, 12, 32), M.dark));
  const spin = place(new THREE.Group(), [0, 0, 12], flipZone);
  await slot('flip', spin);

  // ---- pilot: pişmiş kabuk, gökyüzü, yansıma, huzmeler, ürün gölgesinin pişmiş mermere düşmesi ----
  if (pilot) {
    scene.add(pilot.kabuk, pilot.gok, pilot.huzme);
    scene.environment = pilot.pano;
    scene.environmentRotation.set(Math.PI / 2, 0, 0); // Blender Z yukarı → three.js eşdikdörtgen Y yukarı
    scene.fog = null;
    // Duvar gölge vekilleri: pişmiş kabuk canlı güneşte gölge düşürmez; güneş eşyalara (kasa, monitör, buzdolabı)
    // duvarın içinden vurmasın diye arka duvar açıklıkların dışında, sağ duvar ve tavan görünmez kutularla kapanır
    const vekil = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const duvar = (w, d, h, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), vekil);
      m.position.set(x, y, z + h / 2);
      m.castShadow = true;
      scene.add(m);
    };
    const yw = ROOM.y1 + W / 2, top = ROOM.h + W;
    { const [w, x] = span(ROOM.x0 - W - 600, GLASS.x0); duvar(w, W, top, x, yw, 0); }
    { const [w, x] = span(GLASS.x1, ROOM.x1 + W + 600); duvar(w, W, top, x, yw, 0); }
    { const [w, x] = span(GLASS.x0, GLASS.x1); duvar(w, W, top - GLASS.head, x, yw, GLASS.head); }
    for (const [a, b] of [[GLASS.x0, GLASS.door0], [GLASS.door1, GLASS.x1]]) { const [w, x] = span(a, b); duvar(w, W, GLASS.sill, x, yw, 0); }
    duvar(W, ROOM.y1 - ROOM.y0 + 2 * W, top, ROOM.x1 + W / 2, (ROOM.y0 + ROOM.y1) / 2, 0); // sağ duvar (güneş +x yanından)
    duvar(ROOM.x1 - ROOM.x0 + 2 * W, ROOM.y1 - ROOM.y0 + 2 * W, W, 0, (ROOM.y0 + ROOM.y1) / 2, ROOM.h); // tavan
    for (const [a, b] of [[GLASS.x0, GLASS.door0], [GLASS.door1, GLASS.x1]]) {
      const [w, x] = span(a, b);
      scene.add(pilot.golge(w + SILL.over, SILL.depth, x, ROOM.y1 - SILL.inset, GLASS.sill + 0.4));
    }
  }

  // ---- dolabın üstünde anahtar tepsisi (Kutu aracının tepsisi, mürekkep rengi): içinde Blender'dan halka ve üç
  // anahtar, halkaya takılı kart anahtarlık yuvası (şablon yalnız kartı değiştirir; kart mağazada satılır) ----
  const tepsi = place(new THREE.Group(), A.tepsi);
  place(binModel('tray', { w: 230, d: 160, h: 22, cols: 1, rows: 1, r: 14, wall: 2.2, floor: 2, color: '#2b3036' }), [0, 0, 0], tepsi);
  // Anahtarlar tepsinin uzun kenarına göre döner: kart ve kapı anahtarı enine, ev ve kilit anahtarı boyuna yatar
  const anahtarlar = place(pilot?.esya.anahtarlik ?? new THREE.Group(), [-12, -2, 2, 1.31], tepsi);
  // Kart halkanın 285°'sine takılı (Blender: kart −y'ye sarkar; kulağı halkadan 18 mm dışarıda)
  await slot('anahtarlik', place(new THREE.Group(), [18 * Math.cos(4.974), 18 * Math.sin(4.974), 0, 4.974 + Math.PI / 2], anahtarlar));

  // ---- yakın planda ürünü sürükleyerek çevirme (oda-panel sürüklemeyi verir) ----
  // dik: yuva kendi dikey ekseninde ±40°; coklu: QR rafında seçili ürün; tabla: Flip döner tablası (iki kelimeyi de
  // gösterecek kadar); duvar: çerçeve ve plaka döndükçe duvardan ayrılır (yarı eni × |sin| + 8 mm, gömülmesin).
  // Klavye tuşları, çekmece organizeri, kapaktaki mıknatıslar ve halkadaki kart yerlerine sabit: dönmez.
  const DONER = { kalemlik: 'dik', saksilar: 'dik', balkonMasa: 'dik', buzdolabi: 'dik', modem: 'coklu', flip: 'tabla', cerceve: 'duvar', yapboz: 'duvar', tabela: 'duvar' };
  const donenNesne = (zone) => {
    const tur = DONER[zone], s = slots[zone];
    if (tur === 'coklu') return s.coklu[TEMPLATES[zone][s.index].urun].kok;
    if (tur === 'duvar') return duvarlar[zone];
    if (tur === 'tabla') return s.host;
    return s.host;
  };
  function donmeyiBirak(zone, dur = 0.5) {
    const d = donen[zone];
    if (!d) return;
    delete donen[zone];
    if (DONER[zone] === 'tabla') return; // tabla odaktan çıkınca kendi döner (turn)
    gsap.to(d.obj.rotation, { z: d.rz0, duration: dur, ease: 'power3.out', overwrite: true });
    gsap.to(d.obj.position, { x: d.pos0.x, y: d.pos0.y, z: d.pos0.z, duration: dur, ease: 'power3.out', overwrite: true });
  }
  function dondur(zone, aci) {
    const tur = DONER[zone];
    if (!tur || !slots[zone]) return 0;
    const o = donenNesne(zone);
    let d = donen[zone];
    if (d && d.obj !== o) { donmeyiBirak(zone, 0.3); d = null; } // QR rafında seçim değişti
    if (!d) {
      const kutu = new THREE.Box3().setFromObject(o), boy = kutu.getSize(new THREE.Vector3());
      d = donen[zone] = { obj: o, rz0: o.rotation.z, pos0: o.position.clone(), w: Math.max(boy.x, boy.y), aci: tur === 'tabla' ? o.rotation.z : 0 };
    }
    gsap.killTweensOf([o.rotation, o.position]);
    d.aci = tur === 'tabla' ? THREE.MathUtils.clamp(aci, -2.4, 0.8) : THREE.MathUtils.clamp(aci, -0.7, 0.7);
    o.rotation.z = tur === 'tabla' ? d.aci : d.rz0 + d.aci;
    if (tur === 'duvar') { // duvarın normali: nesnenin yerel −y'si (ön yüzü odaya)
      const cik = (d.w / 2) * Math.abs(Math.sin(d.aci)) + 8 * Math.min(1, Math.abs(d.aci) * 4);
      o.position.set(d.pos0.x + Math.sin(d.rz0) * cik, d.pos0.y - Math.cos(d.rz0) * cik, d.pos0.z);
    }
    return d.aci;
  }

  // ---- davranış ----
  const openDrawer = (k, dur) => gsap.to(drawer.position, { y: DRAWER_Y - k, duration: dur, ease: 'power3.out', overwrite: true });
  const openDoor = (a, dur) => gsap.to(door.rotation, { z: a, duration: dur, ease: 'power3.out', overwrite: true });
  const turn = (a, dur) => gsap.to(spin.rotation, { z: a, duration: dur, ease: 'power2.inOut', overwrite: true });
  let focusedId = null;

  // Şablon değişimi: eski model küçülüp kaybolur, yenisi biraz yukarıdan büyüyerek yerine oturur. Saksıda bitki yeni
  // saksının ağız yüksekliğine kayar. Değişim sürerken (model üretilirken ve eski model küçülürken) gelen istek yok
  // sayılır, o anki şablon döner: basılı tutulan ok modelleri yanıp söndürmesin. Her değişimde hemen
  // api.onChange(bölge, bilgi) çağrılır (sayfanın seçicisi; değişim üründen de gelebilir).
  const info = (zone) => {
    const s = slots[zone], t = TEMPLATES[zone][s.index];
    return { index: s.index, count: TEMPLATES[zone].length, id: t.id, name: t.name, preset: t.preset, arac: t.arac };
  };
  const api = {
    templates: (zone) => TEMPLATES[zone] || [],
    current: (zone) => (slots[zone] ? info(zone) : null),
    show,
    onChange: null,
    // Yakın planda sürükleyerek çevirme: donebilir(bölge), donus(bölge) şimdiki açı, dondur(bölge, açı) → uygulanan açı
    donebilir: (zone) => !!DONER[zone],
    donus: (zone) => donen[zone]?.aci ?? (DONER[zone] === 'tabla' && slots[zone] ? slots[zone].host.rotation.z : 0),
    dondur,
    // Ürünün dünyadaki ortası: sayfa ekrana izdüşürür (toz yazısının zerreleri buradan kalkar)
    center: (zone) => (slots[zone] ? new THREE.Box3().setFromObject(slots[zone].model).getCenter(new THREE.Vector3()) : null),
  };
  async function show(zone, index, { reduced = false } = {}) {
    const s = slots[zone], list = TEMPLATES[zone];
    if (!s || s.busy) return s ? info(zone) : null;
    const i = ((index % list.length) + list.length) % list.length;
    if (i === s.index) return info(zone);
    s.busy = true;
    try {
      // Çoklu yuvada yalnız şablonun ürünü değişir (öbürleri yerinde kalır); ürün zaten bu şablondaysa yalnız öne çıkar
      const u = s.coklu?.[list[i].urun], host = u ? u.ic : s.host, old = u ? u.model : s.model;
      const next = u && u.id === list[i].id ? old : await model(zone, list[i].id);
      const simdiki = () => (u ? u.model : s.model);
      s.index = i;
      s.model = next;
      if (u) { u.model = next; u.id = list[i].id; isaretle(zone, { reduced }); }
      if (next === old) {
        measure(zone);
        api.onChange?.(zone, info(zone));
        return info(zone);
      }
      if (u) kenar(u);
      // Parçalı şablon (klavyedeki tuş başlıkları): her parça kendi yerinde küçülür/büyür, grup merkezine kaymaz
      const olcek = (m) => (m.userData.parcali ? m.children.map((c) => c.scale) : [m.scale]);
      gsap.killTweensOf([...olcek(next), next.position]);
      host.add(next);
      if (reduced) {
        host.remove(old);
        olcek(next).forEach((x) => x.setScalar(1));
        next.position.z = 0;
        if (s.plant) s.plant.position.z = agiz(next);
        measure(zone);
        api.onChange?.(zone, info(zone));
      } else {
        gsap.killTweensOf(olcek(old));
        gsap.to(olcek(old), { x: 0.001, y: 0.001, z: 0.001, duration: 0.2, ease: 'power2.in', onComplete: () => { if (simdiki() !== old) host.remove(old); olcek(old).forEach((x) => x.setScalar(1)); } });
        olcek(next).forEach((x) => x.setScalar(0.55));
        next.position.z = 24;
        gsap.to(olcek(next), { x: 1, y: 1, z: 1, duration: 0.5, delay: 0.12, ease: 'back.out(1.7)' });
        gsap.to(next.position, { z: 0, duration: 0.5, delay: 0.12, ease: 'power3.out', onComplete: () => { if (simdiki() === next) measure(zone); } });
        if (s.plant) gsap.to(s.plant.position, { z: agiz(next), duration: 0.5, delay: 0.1, ease: 'power3.out', overwrite: true });
        api.onChange?.(zone, info(zone));
        await new Promise((r) => gsap.delayedCall(0.22, r)); // eski model küçülene kadar kilit
      }
    } finally {
      s.busy = false;
    }
    if (focusedId === zone) gsap.delayedCall(0.5, () => { if (focusedId === zone) prefetch(zone); });
    return info(zone);
  }

  // İşaretçinin yeri ürünün tepesi (sahne yer vermediyse): şablon değişince yeniden ölçülür, kısa şablonda havada
  // kalmasın. Motor Vector3 olarak verilen yeri kendisi kopyalamaz, her karede okur.
  // İşaretçi ürünün kendisinin (yuvadaki modelin) tepesinde; yuvası olmayan bölgede bölgenin tepesinde
  const anchors = {}, box3 = new THREE.Box3(), mid = new THREE.Vector3();
  function measure(zone) {
    const a = anchors[zone];
    if (!a) return;
    box3.setFromObject(a.object).getCenter(mid);
    a.v.set(mid.x, mid.y, box3.max.z + 18);
  }
  const Z = Object.fromEntries(ZONES.map((z) => [z.id, z]));
  const hs = (id, object, opts = {}) => {
    if (!opts.anchor) {
      anchors[id] = { v: new THREE.Vector3(), object: slots[id]?.host ?? object };
      measure(id);
      opts = { ...opts, anchor: anchors[id].v };
    }
    return { id, tool: Z[id].tool, preset: TEMPLATES[id][0].preset, object, ...opts };
  };
  return {
    shots: SHOTS,
    lights: pilot ? pilot.isik : LIGHTS,
    look: LOOK,
    focusShots: FOCUS,
    focusShift: 0.16, // yatay ekranda yakın plandaki ürün sağa kayar: sol kenarda başlık paneli
    touchOrbit: false, // dokunmatikte yakın planda yana kaydırma şablon değiştirir (etrafa bakma yok)
    langGeometry: true,
    update(t) { pilot?.perde?.userData.tick(t); },
    // Telefonun dikey ekranı: genel motor kamerayı odanın dışına çekip tepeden gökyüzünü gösteriyordu; oda kendi
    // kadrajını verir (içeriden, geniş açıyla: masa, raflar ve sol pencere)
    portraitShot: SHOTS.portrait,
    portraitFov: 58,
    outlineFocus: !pilot, // gerçekçi sahnede yakın plandaki ürünün çevresine çizgi çekilmez (yaprakları tek tek çiziyordu)
    hotspots: [
      // Sıra ZONES'la aynı (şerit ve tur). Kadrajlar FOCUS'ta (oda-yerler)
      hs('cekmece', drawer, { extra: [pedestal], noLift: true, anchor: [px, DRAWER_Y - PED.d / 2 + 60, PED.h + 50] }), // kapalı çekmecenin üstünde
      // Mağaza ürünü: düğme mağazayı yeni sekmede açar
      hs('anahtarlik', tepsi, { noLift: true, cta: { tr: 'Mağazada gör', en: 'View in shop' }, disari: 'https://oktosworkshop.com/anahtarlik' }),
      hs('kalemlik', penZone),
      hs('klavye', kbZone),
      hs('modem', modemZone),
      hs('cerceve', frameA, { noLift: true }),
      hs('yapboz', frameB, { noLift: true }),
      hs('tabela', sign, { noLift: true }),
      hs('saksilar', pots, { noLift: true }),
      hs('balkonMasa', tableItems, { extra: [tableDecor] }),
      hs('miknatis', kapakYuzu, { noLift: true }),
      hs('buzdolabi', fridge, { noLift: true, anchor: [A.fridge[0] - F.d / 2 - 30, A.fridge[1] - 60, F.h - 140] }), // kapağın önünde (pasta içeride)
      hs('flip', flipZone),
    ],
    // Sayfanın şablon seçicisi buradan konuşur (story denetleyicisinde api)
    api,
    // Yakın plandaki ürüne yeniden tıklamak sıradaki şablonu getirir
    onPoke(id, { reduced } = {}) { if (slots[id]) show(id, slots[id].index + 1, { reduced }); },
    // Üzerine gelince çekmece aralanır (davet); yakın plandayken dokunulmaz
    onHover(id) { if (focusedId !== 'cekmece') openDrawer(id === 'cekmece' ? 60 : 0, 0.35); },
    onFocus(id, { reduced } = {}) {
      focusedId = id;
      pilot?.huzme.userData.guc(0.25, reduced ? 0.01 : 0.8, gsap); // yakın planda huzme kısılır (pus ürünü örtmesin)
      gsap.delayedCall(reduced ? 0.1 : 1.3, () => { if (focusedId === id) prefetch(id); }); // kamera uçuşu bitince
      if (id === 'cekmece') openDrawer(590, reduced ? 0.01 : 0.9); // tam açılan ray: organizerin tamamı görünür
      if (id === 'miknatis') openDoor(0, reduced ? 0.01 : 0.6); // mıknatıslar kapalı kapakta
      if (id === 'buzdolabi') { // kapalı başlar: kapağı bir an görünür, sonra açılır, iç ışık yanar
        const bekle = reduced ? 0 : 1.4;
        gsap.delayedCall(bekle, () => {
          if (focusedId !== id) return;
          openDoor(-1.75, reduced ? 0.01 : 0.9);
          if (icIsik) gsap.to(icIsik, { intensity: 14000, duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.15, overwrite: true });
        });
      }
      if (id === 'flip' && !reduced) turn(-Math.PI / 2, 1.1); // ikinci kelime kameraya döner
      isaretle(id, { reduced }); // QR: seçili ürün öne çıkar
    },
    onUnfocus(id) {
      if (focusedId === id) focusedId = null;
      donmeyiBirak(id);
      if (!focusedId) pilot?.huzme.userData.guc(1, 0.8, gsap);
      if (id === 'cekmece') openDrawer(0, 0.5);
      if (id === 'buzdolabi') {
        openDoor(0, 0.6);
        if (icIsik) gsap.to(icIsik, { intensity: 0, duration: 0.3, overwrite: true });
      }
      if (id === 'flip') turn(0, 0.8);
      isaretle(id); // QR: ürünler yerine oturur
    },
  };
}
