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
import { fonts, textSolid, standUp, solid, C } from './scene-kit.js';
import { ZONES, A, SHOTS, LOOK, FOCUS, LIGHTS } from './oda-yerler.js';
import { TEMPLATES, buildTemplate, binModel, vaseModel } from './oda-urunler.js';
import { OLCU, toSun } from './oda-olcu.js';

const TAU = Math.PI * 2;
const { ROOM, GLASS, BALCONY, DESK, SILL } = OLCU; // GLASS: pencere | kapı | pencere
const FRAME = { w: 680, h: 520 }; // sol duvardaki yatay çerçeveler
const yieldMain = () => globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));
export const options = { pilot: false }; // sayfa sahne kurulmadan önce açar

// Pilotun dosyaları (scripts/oda-blender.py çıktıları) ve ışık ayarı; yalnız pilot açıkken yüklenir
async function pilotYukle() {
  const O = await import('./oda-ortam.js');
  const meta = await O.ortamMeta();
  const [kabuk, pano, gok, cicek] = await Promise.all([O.odaKabugu(meta), O.panoDokusu(meta), O.gokKubbesi(meta), O.cicekler(meta)]);
  const sun = toSun(meta.gunes), G = GLASS, yd = ROOM.y1 + ROOM.wall; // huzmeler duvarın dış yüzünden başlar
  const huzme = O.huzmeler([
    { x0: G.door0, x1: G.door1, z0: 0, z1: G.head, y: yd },
    { x0: G.x0, x1: G.door0, z0: G.sill, z1: G.head, y: yd },
    { x0: G.door1, x1: G.x1, z0: G.sill, z1: G.head, y: yd },
  ], sun);
  const c = LIGHTS.center, dist = 5000;
  return {
    meta, kabuk, pano, gok, cicek, huzme, golge: O.golgeYuzeyi,
    saksi: { toprak: O.toprakMalzemesi(), malzeme: (renk) => P_.clay(renk, { rough: 0.36, env: 1 }) },
    // Güneş: pişirmedekiyle aynı yön, renk ve güç (fiziksel birimler); ortam ışığı 360° görüntüden, diğer lambalar kapalı
    isik: { ...LIGHTS, key: [c[0] + sun[0] * dist, c[1] + sun[1] * dist, c[2] + sun[2] * dist], keyIntensity: meta.gunes.strength, keyColor: meta.gunes.color,
      hemi: 0, fillIntensity: 0, rimIntensity: 0, toneMapping: 'agx', exposure: 5.5 },
  };
}
let P_ = null; // props.js (buildScene'e gelir; pilot malzemesi için)

export async function buildScene({ scene, P, lang = 'tr' }) {
  P_ = P;
  await initCSG();
  const fs = await fonts(700);
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
  for (const z of [1300, 1690]) { // iki duvar rafı masanın sağ yarısında, ince siyah konsollarla
    box(1000, 240, 28, -760, 1680, z, M.shelf, { r: 3 });
    for (const x of [-1220, -300]) box(14, 200, 110, x, 1690, z - 110, M.metal, { r: 1 });
  }
  box(240, 170, 110, -480, 1700, 1718, M.dark, { r: 4 }); // üst rafta kutu (dekor)
  place(P.lamp({ l1: 300, l2: 260 }), [-1520, 1660, DESK.top, 0.7]);

  // ---- yuvalar: bölgenin ürünü burada; şablon değişince yalnız yuvadaki model değişir ----
  const slots = {};
  const agiz = (m) => m.userData.soil ?? m.userData.h; // bitki toprağa (yoksa saksının ağzına) oturur
  const tag = (o, zone) => o.traverse((x) => { x.userData.hotspot = zone; });
  // Önbellekte üretimin sözü (promise) durur: önceden üretme ile gösterme yarışsa da aynı şablon iki kez üretilmez
  function model(zone, id) {
    const s = slots[zone];
    if (!s.cache.has(id)) {
      const p = buildTemplate(zone, id, { lang, saksi: pilot?.saksi }).then((m) => { tag(m, zone); return m; });
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
    s.model = await model(zone, TEMPLATES[zone][0].id);
    host.add(s.model);
    if (plant) plant.position.z = agiz(s.model);
    await yieldMain();
    return s;
  }

  // ---- çekmeceli dolap; üst çekmece raylı, −y yönünde açılır; içinde Kutu aracının çekmeceye uyan şablonları ----
  const PED = { w: 440, d: 600, h: 740 };
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

  // ---- masanın üstü: kalemlik yuvası; yanında yuvarlak tepsi (içinde yapboz parçaları, ileride çerçeveye uçacak) ----
  const penZone = new THREE.Group();
  scene.add(penZone);
  await slot('kalemlik', place(new THREE.Group(), A.pencup, penZone));
  {
    const tray = place(binModel('roundtray'), A.tray, penZone);
    const r = P.rng(5), mat = P.clay(0xe6b33a, { rough: 0.6 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.3, rr = i ? 46 : 0;
      box(26, 26, 6, Math.cos(a) * rr, Math.sin(a) * rr, 2, mat, { parent: tray, r: 2 }).rotation.z = r() * TAU;
    }
  }

  // ---- klavye (dekor, hafif eğik, arkası ayaklı) ve sağında anahtarlık fidget yuvası ----
  const kbZone = new THREE.Group();
  scene.add(kbZone);
  {
    const kbHost = place(new THREE.Group(), A.keyboard, kbZone), kb = P.mechKeyboard();
    kb.rotation.x = 0.1;
    kb.position.z = (kb.userData.size.d / 2) * Math.sin(0.1);
    kbHost.add(kb);
    for (const sx of [-1, 1]) box(26, 10, 11, sx * (kb.userData.size.w / 2 - 32), 50, 0, P.clay(0x2a2c30, { rough: 0.7 }), { parent: kbHost });
  }
  await slot('klavye', place(new THREE.Group(), A.clickers, kbZone));

  // ---- rafta modem (dekor) ve QR yuvası (solda), 3B yapboz yuvası (sağda) ----
  const modemZone = new THREE.Group();
  scene.add(modemZone);
  {
    const modem = place(new THREE.Group(), A.modem, modemZone);
    box(230, 150, 36, 0, 0, 0, M.dark, { parent: modem, r: 8 });
    for (const x of [-80, 80]) place(P.mesh(P.cyl(5, 5, 150, 8), M.dark), [x, 55, 30], modem);
  }
  await slot('modem', place(new THREE.Group(), A.qrHolder, modemZone));
  const puzzleZone = place(new THREE.Group(), A.puzzle3d);
  await slot('puzzle3d', puzzleZone);

  // ---- balkon kapısının üstünde 3D Yazı plakası ("Oksijen alma alanı") ----
  const sign = place(new THREE.Group(), A.sign);
  await slot('tabela', sign);

  // ---- sol duvarda iki yatay çerçeve: Painter rölyefi ve resimli yapboz ----
  const frameOf = (at) => {
    const f = place(new THREE.Group(), at);
    box(FRAME.w, 30, FRAME.h, 0, 0, 0, M.dark, { parent: f, r: 4 });
    box(FRAME.w - 60, 6, FRAME.h - 60, 0, -16, 30, tone(0xefe9df, 0.8), { parent: f, r: 2 });
    f.rotation.z = Math.PI / 2; // ön yüzü odaya (+x)
    return f;
  };
  const frameA = frameOf(A.frameA), frameB = frameOf(A.frameB);
  await slot('cerceve', place(new THREE.Group(), [0, -20, FRAME.h / 2], frameA));
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
    const olive = place(vaseModel('hex'), A.planterL, pots); // zeytin ağacı
    olive.scale.setScalar(2.8);
    const tree = place(new THREE.Group(), [A.planterL[0], A.planterL[1], 300], pots);
    tree.add(P.mesh(P.cyl(12, 20, 950, 10), M.trunk));
    [[0, 0, 1180, 230], [-120, 40, 1050, 170], [130, -30, 1080, 180], [30, 90, 1320, 160]].forEach(([x, y, z, rr]) => {
      tree.add(P.mesh(new THREE.SphereGeometry(rr, 14, 10), M.leaf).translateX(x).translateY(y).translateZ(z));
    });
    const bowl = place(vaseModel('flower'), A.planterR, pots); // lavanta
    bowl.scale.setScalar(2.4);
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
    place(P.mug({ color: 0xe8e2d6 }), [A.table[0] - 120, A.table[1] - 60, 722], tableDecor);
  }
  const tableItems = new THREE.Group();
  scene.add(tableItems);
  await slot('balkonMasa', place(new THREE.Group(), [A.table[0] + 80, A.table[1] + 60, 722, -0.3], tableItems));

  // ---- mini buzdolabı (sağ duvar, ön yüzü −x): alt rafta pasta süsü yuvası, üst rafta "Gluten yok" etiketli ekmek;
  // üstünde döner tablada Text Flip yuvası ----
  const F = { d: 550, w: 500, h: 850 };
  const fridge = place(new THREE.Group(), A.fridge);
  box(20, F.w, F.h, F.d / 2 - 10, 0, 0, M.fridge, { parent: fridge, r: 4 });
  for (const sy of [-1, 1]) box(F.d, 20, F.h, 0, sy * (F.w / 2 - 10), 0, M.fridge, { parent: fridge, r: 4 });
  box(F.d, F.w, 20, 0, 0, F.h - 20, M.fridge, { parent: fridge, r: 4 });
  box(F.d, F.w, 60, 0, 0, 0, M.fridge, { parent: fridge, r: 4 });
  box(F.d - 50, F.w - 50, 10, 10, 0, 430, M.inner, { parent: fridge, r: 2 });
  box(F.d - 40, F.w - 40, 8, 10, 0, 60, M.inner, { parent: fridge, r: 2 });
  {
    // Ekmek ve üstüne batırılmış etiket: "Gluten yok" (3D Yazı)
    const bread = place(new THREE.Group(), [-40, 0, 440, -Math.PI / 2], fridge);
    box(220, 110, 90, 0, 0, 0, tone(0xd9b77e, 0.9), { parent: bread, r: 30 });
    const label = lang === 'en' ? 'Gluten free' : 'Gluten yok';
    bread.add(solid(() => {
      const t = textSolid(fs, label, 19, 2, { spacing: 0.4 });
      const card = standUp(C.extrude(C.rrect(t.width + 14, t.cap + 14, 3), 2), 2);
      return C.move(C.union([card, C.move(standUp(t.solid, 2), 0, -2, -t.cap / 2), C.box(2.4, 2.4, 44, -1.2, -1.2, -44 - (t.cap + 14) / 2)]), 20, -20, 132);
    }, P.clay(0xe6b33a, { rough: 0.5 })));
  }
  await slot('buzdolabi', place(new THREE.Group(), [-40, 0, 68, -Math.PI / 2], fridge));
  const door = place(new THREE.Group(), [-F.d / 2, F.w / 2, 0], fridge); // menteşe arka köşede
  box(24, F.w, F.h - 10, -12, -F.w / 2, 5, M.fridge, { parent: door, r: 6 });
  box(16, 20, 220, -30, -F.w + 40, 380, M.metal, { parent: door, r: 6 });
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
    for (const [a, b] of [[GLASS.x0, GLASS.door0], [GLASS.door1, GLASS.x1]]) {
      const [w, x] = span(a, b);
      scene.add(pilot.golge(w + SILL.over, SILL.depth, x, ROOM.y1 - SILL.inset, GLASS.sill + 0.4));
    }
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
    return { index: s.index, count: TEMPLATES[zone].length, id: t.id, name: t.name, preset: t.preset };
  };
  const api = {
    templates: (zone) => TEMPLATES[zone] || [],
    current: (zone) => (slots[zone] ? info(zone) : null),
    show,
    onChange: null,
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
      const next = await model(zone, list[i].id), old = s.model;
      s.index = i;
      s.model = next;
      gsap.killTweensOf([next.scale, next.position]);
      s.host.add(next);
      if (reduced) {
        s.host.remove(old);
        next.scale.setScalar(1);
        next.position.z = 0;
        if (s.plant) s.plant.position.z = agiz(next);
        measure(zone);
        api.onChange?.(zone, info(zone));
      } else {
        gsap.killTweensOf(old.scale);
        gsap.to(old.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.2, ease: 'power2.in', onComplete: () => { if (s.model !== old) s.host.remove(old); old.scale.setScalar(1); } });
        next.scale.setScalar(0.55);
        next.position.z = 24;
        gsap.to(next.scale, { x: 1, y: 1, z: 1, duration: 0.5, delay: 0.12, ease: 'back.out(1.7)' });
        gsap.to(next.position, { z: 0, duration: 0.5, delay: 0.12, ease: 'power3.out', onComplete: () => { if (s.model === next) measure(zone); } });
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
      anchors[id] = { v: new THREE.Vector3(), object };
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
    update(t) { pilot?.huzme.userData.tick(t); },
    outlineFocus: !pilot, // gerçekçi sahnede yakın plandaki ürünün çevresine çizgi çekilmez (yaprakları tek tek çiziyordu)
    hotspots: [
      hs('cekmece', drawer, { extra: [pedestal], noLift: true, focusCenter: [px, DRAWER_Y - 390, 560], focusRadius: 330, focusElev: 0.82, anchor: [px, DRAWER_Y - 200, 900] }),
      hs('kalemlik', penZone, { focusCenter: [A.pencup[0] - 50, A.pencup[1], 800], focusRadius: 200, focusElev: 0.5 }),
      hs('klavye', kbZone, { focusCenter: [A.clickers[0] - 60, A.clickers[1], 765], focusRadius: 150, focusElev: 0.55 }),
      hs('modem', modemZone, { focusRadius: 240 }),
      hs('puzzle3d', puzzleZone, { focusRadius: 170 }),
      hs('tabela', sign, { noLift: true, focusRadius: 480 }),
      hs('saksilar', pots, { noLift: true, anchor: [A.sillL[0], A.sillL[1], 1180] }),
      hs('balkonMasa', tableItems, { extra: [tableDecor], focusRadius: 340, focusElev: 0.55 }),
      hs('buzdolabi', fridge, { noLift: true }),
      hs('flip', flipZone, { focusRadius: 200 }),
      hs('cerceve', frameA, { noLift: true }),
      hs('yapboz', frameB, { noLift: true }),
    ],
    // Sayfanın şablon seçicisi buradan konuşur (story denetleyicisinde api)
    api,
    // Yakın plandaki ürüne yeniden tıklamak sıradaki şablonu getirir
    onPoke(id, { reduced } = {}) { if (slots[id]) show(id, slots[id].index + 1, { reduced }); },
    // Üzerine gelince çekmece aralanır (davet); yakın plandayken dokunulmaz
    onHover(id) { if (focusedId !== 'cekmece') openDrawer(id === 'cekmece' ? 60 : 0, 0.35); },
    onFocus(id, { reduced } = {}) {
      focusedId = id;
      gsap.delayedCall(reduced ? 0.1 : 1.3, () => { if (focusedId === id) prefetch(id); }); // kamera uçuşu bitince
      if (id === 'cekmece') openDrawer(380, reduced ? 0.01 : 0.8);
      if (id === 'buzdolabi') openDoor(-1.75, reduced ? 0.01 : 0.9);
      if (id === 'flip' && !reduced) turn(-Math.PI / 2, 1.1); // ikinci kelime kameraya döner
    },
    onUnfocus(id) {
      if (focusedId === id) focusedId = null;
      if (id === 'cekmece') openDrawer(0, 0.5);
      if (id === 'buzdolabi') openDoor(0, 0.6);
      if (id === 'flip') turn(0, 0.8);
    },
  };
}
