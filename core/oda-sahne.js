// Oda sahnesi (docs/oda-sahnesi.md): ev ofisi ve açık balkon; orta kat, yalnız satılan ürünler (2026-11-01). Ürün
// yuvaları core/oda-yerler.js ZONES'ta (ürün verisinden); görünen her yuva bir işaretçi, yakın plan ve tur durağıdır.
// Yakın plandayken ürün değişir (api.show): modeli olan ürün (kart anahtarlık) yuvada kendi modeliyle durur, eski model
// küçülüp kaybolur, yenisi yerine oturur; modeli olmayan üründe yuvada sahne yerinin dekoru çapa olarak kalır. Sahne
// yerlerinde (eski araç durakları) dekor durur, tıklanmaz (core/oda-urunler.js DEKOR).
// Pilot (options.pilot): oda kabuğu, pervazlar, kasalar ve balkon Blender'da pişmiş GLB'den gelir (core/oda-ortam.js,
// scripts/oda-blender.py); camlar gerçek cam, ışık sabah güneşi ve huzmeler, saksıda toprak ve gerçek çiçek.
// Davranış: çekmece (gizli sticker yuvası açılınca) üzerine gelince aralanır, yakınlaşınca açılır.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { initCSG } from './csg.js';
import { ZONES, GORUNEN, A, RAF_KAY, SHOTS, LOOK, FOCUS, LIGHTS, fitShot, BIGGIE_DURAK, FOV } from './oda-yerler.js';
import { DEKOR, dekorModeli, urunleri, urunModeli, binModel, vaseModel, OZEL_TUSLAR } from './oda-urunler.js';
import { OLCU, toSun, ON_DUVAR } from './oda-olcu.js';
import { portfolyoIskelet } from './oda-portfolyo.js';
import { kadrajAraci } from './oda-kadraj.js';
import { PORTFOLYO_DURAK } from './story-data.js';

const TAU = Math.PI * 2;
const { ROOM, GLASS, BALCONY, DESK, SILL, SHELF, PEDESTAL, FRIDGE } = OLCU; // GLASS: pencere | kapı | pencere
const FRAME = { w: 680, h: 520 };      // sağ duvarda, buzdolabının üstünde cüce savaşçı yapbozu
const FRAME_K = { w: 512, h: 400 };    // sol duvarda rölyef çerçevesi (önceki 320 × 250'nin 1,6 katı)
const yieldMain = () => globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));
export const options = { pilot: false, portfolyo: true }; // sayfa sahne kurulmadan önce açar (portfolyo: false ölçüm için)

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
    meta, kabuk, pano, gok, cicek, esya, huzme, perde, golge: O.golgeYuzeyi, cayTakimi: O.cayTakimi, buhar: O.buhar,
    saksi: { toprak: O.toprakMalzemesi(), malzeme: (renk) => P_.clay(renk, { rough: 0.36, env: 1 }) },
    // Güneş: pişirmedekiyle aynı yön, renk ve güç (fiziksel birimler); ortam ışığı 360° görüntüden, diğer lambalar kapalı
    isik: { ...LIGHTS, key: [c[0] + sun[0] * dist, c[1] + sun[1] * dist, c[2] + sun[2] * dist], keyIntensity: meta.gunes.strength, keyColor: meta.gunes.color,
      hemi: 0, fillIntensity: 0, rimIntensity: 0, toneMapping: 'agx', exposure: 3.6 }, // loş oda: güneş lekesi parlak, köşeler karanlık
  };
}
let P_ = null; // props.js (buildScene'e gelir; pilot malzemesi için)

// v8 (2026-11-04, kullanıcı: "odayı bize doğru uzat", genel plan odanın içinden, oda dört yanıyla görünsün): pişmiş kabuk
// Blender'da y = ROOM.y0'da açık kesitle biter. Zemin, tavan, yan duvarlar ve süpürgelik ön kenarlarından ON_DUVAR.y'ye
// dek uzatılır: uzantının köşeleri ön kenardaki köşenin dokusunu (UV) taşır, pişmiş ışık kenardan olduğu gibi sürer
// (aynı malzeme, dikiş yok). Önü duvarla kapanır: duvarın dokusu sol duvarın ön kenar sütunu (yükseklikle değişen ışık),
// önünde süpürgelik. Ağların yalnız ön kenarı okunur; Blender'daki topolojiye bağlı değil (kenarı y = en küçük y olan
// her üçgen kenarı uzar; bütünüyle o düzlemde duran kesit yüzleri uzamaz).
function odayiUzat(kok, scene) {
  kok.updateMatrixWorld(true);
  const Y = ON_DUVAR.y, v = new THREE.Vector3();
  const kenar = {}; // ağ adı → ön kenar köşeleri [{ p, uv }]
  for (const ad of ['zemin', 'tavan', 'duvar_sol', 'duvar_sag', 'supurgelik']) {
    const m = kok.getObjectByName(ad);
    if (!m?.isMesh || !m.geometry.attributes.uv) continue;
    const g = m.geometry, pos = g.attributes.position, uv = g.attributes.uv, n = pos.count;
    const w = Array.from({ length: n }, (_, i) => v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
    // Ön kenar: ağın en küçük y'si ya da odanın kesiti (ROOM.y0): tavan kutusu duvarın dışına (−1920) taşar, alt yüzü −1800'de
    const yMin = Math.min(...w.map((p) => p.y)), duzlem = (i) => (Math.abs(w[i].y - yMin) < 1 ? yMin : Math.abs(w[i].y - ROOM.y0) < 1 ? ROOM.y0 : null);
    const on = (i) => duzlem(i) !== null;
    // Uzantının dokusu ön kenarın ~0,35 m içinden okunur (pişirmede açık kesitin hemen kenarı koyu ve çizgili): aynı x/z'deki
    // içerideki köşeye doğru UV doğrusal kaydırılır (zemin, duvar ve tavan tek dörtgen; süpürgelikte aynı kenar)
    const tri = g.index ? g.index.array : Array.from({ length: n }, (_, i) => i);
    const komsu = Array.from({ length: n }, () => new Set()); // aynı yüzün köşeleri (üçgen komşuluğu: UV aynı yüzden)
    for (let t = 0; t < tri.length; t += 3) for (const a of [tri[t], tri[t + 1], tri[t + 2]]) for (const b of [tri[t], tri[t + 1], tri[t + 2]]) komsu[a].add(b);
    const icUV = (i) => {
      let q = -1;
      const y0 = w[i].y;
      for (const k of komsu[i]) if (Math.abs(w[k].x - w[i].x) < 1 && Math.abs(w[k].z - w[i].z) < 1 && w[k].y > y0 + 100 && (q < 0 || w[k].y < w[q].y)) q = k;
      if (q < 0) return [uv.getX(i), uv.getY(i)];
      const f = Math.min(1, 350 / (w[q].y - y0));
      return [uv.getX(i) + (uv.getX(q) - uv.getX(i)) * f, uv.getY(i) + (uv.getY(q) - uv.getY(i)) * f];
    };
    const ic = new Map(), icOf = (i) => { if (!ic.has(i)) ic.set(i, icUV(i)); return ic.get(i); };
    const P = [], U = [], gorulen = new Set();
    kenar[ad] = [];
    for (let t = 0; t < tri.length; t += 3) {
      const [a, b, c] = [tri[t], tri[t + 1], tri[t + 2]];
      if (on(a) && on(b) && on(c) && duzlem(a) === duzlem(b) && duzlem(b) === duzlem(c)) continue; // kesit yüzü
      for (const [i, j] of [[a, b], [b, c], [c, a]]) {
        if (!on(i) || duzlem(i) !== duzlem(j)) continue;
        const k = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (gorulen.has(k)) continue;
        gorulen.add(k);
        // Tavan: kutusu duvarın dışına (−1920) taşar; −1920…−1800 şeridinin dokusu atlasın kenarı (gri çizgi). Uzantı tavanın
        // 1 mm altından ve odanın 2 mm içinden başlar: o şeridi aşağıdan örter (dikiş görünmez)
        const pi = w[i], pj = w[j], y0 = ad === 'tavan' ? ROOM.y0 + 2 : duzlem(i), dz = ad === 'tavan' && pi.z < ROOM.h + 1 ? -1 : 0;
        for (const [q, yy] of [[pi, y0], [pj, y0], [pj, Y], [pi, y0], [pj, Y], [pi, Y]]) P.push(q.x, yy, q.z + dz);
        // v8.2 (kullanıcı: uzantı duvarları başka renkte görünüyordu): duvar, zemin ve süpürgelikte uzantı kenarın KENDİ dokusunu
        // taşır (dikişte ton birebir aynı); yalnız tavanda kenar atlasın kenarına denk geldiği için içerideki UV
        const uvOf = (q) => (ad === 'tavan' ? icOf(q) : [uv.getX(q), uv.getY(q)]);
        for (const q of [i, j, j, i, j, i]) U.push(...uvOf(q));
        kenar[ad].push({ p: pi, uv: uvOf(i) }, { p: pj, uv: uvOf(j) });
      }
    }
    if (!P.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    m.material.side = THREE.DoubleSide; // uzantının yüz yönü kenara göre değişebilir (ışıksız malzeme, maliyet yok)
    const ek = new THREE.Mesh(geo, m.material);
    ek.name = `${ad}_uzanti`;
    ek.raycast = () => {};
    scene.add(ek);
  }
  // Ön duvar: sol duvarın ön kenarındaki dokuyu yüksekliğe göre (z 0 → h) taşır; önünde süpürgelik
  const sol = kenar.duvar_sol, dv = kok.getObjectByName('duvar_sol');
  if (sol?.length && dv) {
    const alt = sol.reduce((a, b) => (b.p.z < a.p.z ? b : a)), ust = sol.reduce((a, b) => (b.p.z > a.p.z ? b : a));
    const x0 = ROOM.x0, x1 = ROOM.x1, h = ROOM.h;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([x0, Y, 0, x1, Y, 0, x1, Y, h, x0, Y, 0, x1, Y, h, x0, Y, h], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([...alt.uv, ...alt.uv, ...ust.uv, ...alt.uv, ...ust.uv, ...ust.uv], 2));
    const on = new THREE.Mesh(geo, dv.material);
    on.name = 'duvar_on';
    on.raycast = () => {};
    scene.add(on);
  }
  const sp = kenar.supurgelik, sm = kok.getObjectByName('supurgelik');
  if (sp?.length && sm) {
    const k = sp.reduce((a, b) => (b.p.z > a.p.z ? b : a)), S = OLCU.SKIRTING, x0 = ROOM.x0, x1 = ROOM.x1, yo = Y + S.t;
    const P = [x0, yo, 0, x1, yo, 0, x1, yo, S.h, x0, yo, 0, x1, yo, S.h, x0, yo, S.h, // ön yüz
      x0, Y, S.h, x1, Y, S.h, x1, yo, S.h, x0, Y, S.h, x1, yo, S.h, x0, yo, S.h]; // üst yüz
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(Array.from({ length: 12 }, () => k.uv).flat(), 2));
    const m = new THREE.Mesh(geo, sm.material);
    m.name = 'supurgelik_on';
    m.raycast = () => {};
    scene.add(m);
  }
}

export async function buildScene({ scene, P, lang = 'tr', hafif = false }) {
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
    // v8: gri kutu da önde ON_DUVAR'a dek uzar ve önden kapanır (pişmiş kabukta odayiUzat)
    const [L, yc] = span(ON_DUVAR.y, ROOM.y1);
    box(ROOM.x1 - ROOM.x0, L, 20, 0, yc, -20, M.floor, { r: 0, cast: false });
    box(W, L, ROOM.h, ROOM.x0 - W / 2, yc, 0, M.wall, { r: 0, cast: false });
    box(W, L, ROOM.h, ROOM.x1 + W / 2, yc, 0, M.wall, { r: 0, cast: false });
    box(ROOM.x1 - ROOM.x0 + 2 * W, W, ROOM.h, 0, ON_DUVAR.y - W / 2, 0, M.wall, { r: 0, cast: false });
    box(ROOM.x1 - ROOM.x0, L, 20, 0, yc, ROOM.h, M.wall, { r: 0, cast: false });
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
  const lamba = place(P.lamp({ a1: 0, l1: 640, a2: 1.45, l2: 240, tilt: -0.5 }), [PEDESTAL.x - PEDESTAL.w / 2 + 85, ROOM.y1 - 95, PEDESTAL.h, -0.24]);
  if (pilot) { // Spot lamba altındaki tepsiye yanar: kart anahtarlıkların epoksisi parlar, loş köşede renkler canlı (yalnız canlı eşyalar)
    lamba.updateWorldMatrix(true, false);
    const spot = new THREE.SpotLight(0xffe2b0, 0.9, 0, 0.3, 0.55, 0);
    spot.position.copy(lamba.localToWorld(lamba.userData.spot.pos.clone()));
    spot.target.position.set(A.tepsi[0], A.tepsi[1], A.tepsi[2]);
    scene.add(spot, spot.target);
  }

  // ---- dekor ve ürün yuvaları ----
  // Her sahne yerinde dekor durur (DEKOR: eski durağın ilk şablonu, tıklanmaz). Görünen bir yuvanın yerindeyse
  // (ZONES.yer) yuva orada kurulur: seçici yuvanın ürünlerini dolaşır; modeli olan ürün yuvada kendi modeliyle durur,
  // modeli olmayanda dekor çapa olarak kalır.
  const slots = {};
  const YUVA_YERI = Object.fromEntries(GORUNEN.map((z) => [z.yer, z.id])); // sahne yeri → görünen yuva
  const yerOf = (id) => ZONES.find((z) => z.id === id)?.yer ?? null;    // yuva → sahne yeri
  const KURULACAK = Object.keys(DEKOR).length + 1; // dekorlu yerler + anahtar halkası (açılış çubuğu)
  let kurulan = 0;
  let cayBuhari = null; // balkondaki çaydan yükselen buhar (update'te tıklar)
  const ledler = []; // robot süpürgenin sarı ve mavi durum ışığı (malzemeleri)
  const duvarlar = {}, donen = {}; // yakın planda çevirme: sahne yeri → duvardaki nesne; yuva → { obj, rz0, pos0, w, aci }
  let klavyeBilgi = null; // klavye kurulunca: tuş yerleri ve anahtarlığın yeri (klavye dekoru için)
  const agiz = (m) => m?.userData.soil ?? m?.userData.h; // bitki toprağa (yoksa saksının ağzına) oturur
  const tag = (o, zone) => { o.traverse((x) => { x.userData.hotspot = zone; }); return o; };
  async function ilerle() {
    dispatchEvent(new CustomEvent('oda-kurulum', { detail: ++kurulan / KURULACAK })); // açılış çubuğu
    await yieldMain();
  }
  // Ürünün modeli; modeli olmayan üründe yuvanın dekoru. Önbellekte üretimin sözü (promise) durur: önceden üretme ile
  // gösterme yarışsa da aynı model iki kez üretilmez
  function model(zone, i) {
    const s = slots[zone], u = s.urunler[i];
    if (!s.cache.has(u.id)) {
      const p = urunModeli(u, { kart: pilot?.esya.kart_anahtarlik }).then((m) => (m ? tag(m, zone) : s.dekor));
      p.catch(() => s.cache.delete(u.id)); // üretilemediyse sonraki istekte yeniden denenir
      s.cache.set(u.id, p);
    }
    return s.cache.get(u.id);
  }
  // Yakın plandaki yuvanın komşu ürünleri boşta önceden üretilir: ilk gösterimde takılma olmasın
  function prefetch(zone) {
    const s = slots[zone], n = s?.urunler.length;
    if (!s || n < 2) return;
    for (const d of [1, -1]) model(zone, (s.index + d + n) % n);
  }
  // Yuva: host'ta dekor (çapa; yoksa null) ve ilk ürünün modeli
  async function yuvaKur(zone, host, dekor, { plant = null } = {}) {
    const s = (slots[zone] = { host, plant, dekor, urunler: urunleri(zone), cache: new Map(), index: 0, model: dekor, busy: false });
    if (s.urunler.length) {
      const m = await model(zone, 0);
      if (m && m !== dekor) {
        if (dekor) host.remove(dekor);
        host.add(m);
        s.model = m;
      }
    }
    if (plant && agiz(s.model) != null) plant.position.z = agiz(s.model);
    return s;
  }
  // Sahne yeri: dekoru kurar; görünen bir yuvanın yeriyse yuvayı da
  async function yerlestir(yer, host, { plant = null } = {}) {
    const m = await dekorModeli(yer, { lang, saksi: pilot?.saksi, pasta: pilot?.cicek.pasta, klavye: klavyeBilgi });
    host.add(m);
    if (plant) plant.position.z = agiz(m);
    if (YUVA_YERI[yer]) await yuvaKur(YUVA_YERI[yer], host, m, { plant });
    await ilerle();
    return m;
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
  await yerlestir('cekmece', place(new THREE.Group(), [0, -10, 10], drawer)); // organizer; sticker yuvasının yeri

  // ---- masanın üstü: kalemlik (monitörün solunda; figur yuvasının çapası) ----
  const penZone = new THREE.Group();
  scene.add(penZone);
  await yerlestir('kalemlik', place(new THREE.Group(), A.pencup, penZone));
  // Kalemliğin önünde ayaklı kartvizit (dekor)
  const kvZone = new THREE.Group();
  scene.add(kvZone);
  await yerlestir('kartvizit', place(new THREE.Group(), A.kartvizit, kvZone));

  // ---- klavye (hafif eğik, arkası ayaklı): Esc, Enter ve yukarı ok boş (MX anahtarı); dekoru o tuşlara başlık takar
  // ve klavyenin önüne aynı tasarımın anahtarlığını koyar ----
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
  await yerlestir('klavye', kb);

  // ---- alt rafta modem ve üstünde QR Wi-Fi standı (dekor); raf yuvası görünürse (diorama plakaları, 2026-11-04)
  // seçili plaka rafın ortasında (A.plakalar, bir seferde tek plaka), modem ve standı sağ uca kayar (RAF_KAY) ----
  const modemZone = new THREE.Group();
  scene.add(modemZone);
  const rafYuva = YUVA_YERI.modem ? place(new THREE.Group(), A.plakalar, modemZone) : null;
  const kay = (a) => (rafYuva ? [a[0] + RAF_KAY, ...a.slice(1)] : a);
  // Modem kompakt ev modemi ölçüsünde (2026-11-03: 230 → 120 mm; 127 mm'lik diorama plakası yanında 2 kat büyük
  // görünüyordu, kullanıcı: plaka modemle aynı ya da biraz büyük olmalı)
  const MODEM = { w: 120, d: 110, h: 30 };
  {
    const modem = place(new THREE.Group(), kay(A.modem), modemZone);
    box(MODEM.w, MODEM.d, MODEM.h, 0, 0, 0, M.dark, { parent: modem, r: 6 });
    for (const x of [-46, 46]) place(P.mesh(P.cyl(4, 4, 110, 8), M.dark), [x, 40, 24], modem);
  }
  const qrYeri = place(new THREE.Group(), [-160, -15, MODEM.h], place(new THREE.Group(), kay(A.qrHolder), modemZone));
  if (rafYuva) {
    qrYeri.add(await dekorModeli('modem', { lang }));
    await yuvaKur(YUVA_YERI.modem, rafYuva, null);
    await ilerle();
  } else await yerlestir('modem', qrYeri);

  // ---- balkon kapısının üstünde 3D Yazı plakası ("Oksijen alma alanı"; dekor) ----
  const sign = place(new THREE.Group(), A.sign);
  await yerlestir('tabela', sign);

  // ---- v8 (2026-11-04, kullanıcı kararı): sağ duvardaki çerçeveler (Painter rölyefi, resimli yapboz ve onun maske
  // yuvası) kalktı; oda yalnız portfolyo. Kodu git geçmişinde (frameOf, A.frameA/frameB) ----

  // ---- saksılar: soldaki pervaz saksısı biblo yuvasının çapası (bitki yerinde kalır), yanında ikinci saksı ----
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
    await yerlestir('saksilar', hero, { plant });
    // Yanında çiçekli ikinci saksı. (Sağ pervazdaki boş saksı ve balkondaki büyük saksılar kullanıcı isteğiyle kalktı.)
    const v = place(vaseModel('tulip', {}, pilot?.saksi), [A.sillL[0] + 115, A.sillL[1], A.sillL[2]], pots);
    const cicekB = pilot ? pilot.cicek.cicek_b : sprout(0.8);
    if (cicekB) { cicekB.position.z = agiz(v); v.add(cicekB); }
  }

  // ---- balkon masası: bistro masa ve rattan sandalyeler, kupa ve QR menü standı (hepsi dekor) ----
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
    if (pilot) cayBuhari = place(pilot.buhar(), [A.table[0] - 120, A.table[1] - 60, 722 + 100], tableDecor); // sıcak çaydan buhar
  }
  const tableItems = new THREE.Group();
  scene.add(tableItems);
  await yerlestir('balkonMasa', place(new THREE.Group(), [A.table[0] + 80, A.table[1] + 60, 722, -0.3], tableItems));

  // ---- mini buzdolabı (sağ duvar, ön yüzü −x): üst rafta pastada süs, iki raf yiyecekle dolu, kapakta mıknatıslar;
  // üstünde tablada Text Flip (hepsi dekor; kapak kapalı durur) ----
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
  // Raflarda yiyecek (pilot, Poly Haven CC0; düşük çözünürlük): üst rafta tabakta pasta (yuva), alt rafta hasır sepette
  // meyveler, yanında süt ve konserveler. Buzdolabının yerel düzlemi: x derinlik (ön −x; kapak raflarına çarpmasın diye
  // x > −150), y genişlik
  if (pilot) {
    const O = await import('./oda-ortam.js');
    // Kopya bir kabın içinde: düğümün kendi konumu (tabanı orijine getiren kayma, limonda 52 mm) korunur
    const koy = (ad, x, y, z, rz = 0, ust = fridge) => { if (pilot.cicek[ad]) place(new THREE.Group().add(pilot.cicek[ad].clone()), [x, y, z, rz], ust); };
    const sepet = place(O.meyveSepeti(), [40, -110, F.floor, 0.3], fridge);
    // v8.3 (kullanıcı): buzdolabında yalnız iki elma (üst rafta, gerçek boy); sepette elma yok
    for (const [ad, x, y, z, rz] of [['yiyecek_nar', -18, 22, 8, 0.6],
      ['yiyecek_limon', 40, 34, 8, 0.4], ['yiyecek_misket', -52, 8, 8, 2.1], ['yiyecek_kivi', 6, -54, 8, 0.8], ['yiyecek_misket', 8, 6, 52, 0.3]]) koy(ad, x, y, z, rz, sepet);
    koy('yiyecek_sut', 125, 150, F.floor, 0.25);
    koy('yiyecek_fasulye', 0, 180, F.floor);
    koy('yiyecek_domates', -60, 80, F.floor, 1.1);
  }
  // v8.3 (kullanıcı): üst raftaki pasta (yuva) kalktı; yerinde iki elma, Ø 80 mm (Poly Haven yiyecek_elma ölçeklenir).
  // Biggie bir elma alınca biri gizlenir (core/oda-sunum.js 'elma-al' → buzElmalari)
  if (pilot?.cicek.yiyecek_elma) {
    for (const [i, y] of [[0, -60], [1, 45]]) {
      const e = pilot.cicek.yiyecek_elma.clone(), b = new THREE.Box3().setFromObject(e), sz = b.getSize(new THREE.Vector3());
      e.scale.multiplyScalar(80 / Math.max(sz.x, sz.y, 1));
      e.position.z -= new THREE.Box3().setFromObject(e).min.z; // tabanı grubun z 0'ında (rafın üstü)
      const g = place(new THREE.Group().add(e), [-20 + i * 30, y, F.shelf + 2, i * 1.7], fridge);
      g.name = `buz_elma_${i}`;
    }
  }
  let door; // menteşe arka köşede
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
  await yerlestir('miknatis', kapakYuzu);
  // Kapak raflarında markasız içecekler (pilot): üst rafta üç kutu, altta cam su şişesi ve kutu (kapağın yerel düzleminde)
  if (pilot) {
    const O = await import('./oda-ortam.js');
    for (const [serit, y] of [[0xb8372f, -340], [0xd4621f, -268], [0x5f8f55, -196]]) place(O.icecekKutusu(serit), [52, y, 565], door);
    place(O.suSisesi(), [52, -330, 285], door); // cam su şişesi
    place(O.icecekKutusu(0x3f6fb0), [52, -250, 285], door);
  }
  // (Kapak açılınca yanan iç ışık buzdolabı durağıyla kalktı, 2026-11-01; kodu git geçmişinde.)
  // Monitör klavyenin arkasında (pilot): ekranında Kutu aracının sayfası; masa altı (kasa, priz, kablo kanalı, fare,
  // mousepad) dünya koordinatında gelir
  if (pilot) {
    place(pilot.esya.monitor, A.monitor);
    scene.add(pilot.esya.masa_alti);
    // v8.2 (kullanıcı): fare avucunu doldursun: fare ve tekerleği tabanının ortası çevresinde 1,8 kat (kablo yerinde);
    // 'fare' grubu sunum'da fare klibi oynarken ele bağlanır (core/oda-sunum.js fareKaresi)
    {
      const ma = pilot.esya.masa_alti, fare = ma.getObjectByName('fare'), tek = ma.getObjectByName('fare_tekerlek');
      if (fare) {
        ma.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(fare), c = b.getCenter(new THREE.Vector3());
        const g = new THREE.Group();
        g.name = 'fare_grubu';
        g.position.set(c.x, c.y, b.min.z);
        scene.add(g);
        g.updateMatrixWorld(true);
        for (const o of [fare, tek].filter(Boolean)) g.attach(o);
        // v8.4 (kullanıcı): siyah ergonomik sağ el faresi, kablosuz; biçim OLCU.MOUSE.form (fare klibi aynı yüzeye eli
        // oturtur: scripts/karakter-klip-v84.py). Eski ağlar gizli; taban merkezi grubun orijini, önü +y
        fare.visible = false; if (tek) tek.visible = false;
        const kablo = ma.getObjectByName('fare_kablosu'); if (kablo) kablo.visible = false;
        g.add(ergonomikFare(OLCU.MOUSE.form));
        g.scale.setScalar(OLCU.MOUSE.form.olcek);
        g.userData.ev = g.position.clone();
      }
    }
    if (pilot.perde) scene.add(pilot.perde);
    // Oyuncu koltuğu: masanın sağ önünde, halının üstünde (durak kameralarının önüne girmez)
    if (pilot.esya.koltuk) place(pilot.esya.koltuk, [OLCU.CHAIR.x, OLCU.CHAIR.y, 0, OLCU.CHAIR.rz]);
    // Robot süpürge buzdolabı ile balkon duvarı arasında; durum ışıkları update'te yanıp söner
    if (pilot.esya.supurge) {
      place(pilot.esya.supurge, [OLCU.ROBOT.x, OLCU.ROBOT.y, 0, OLCU.ROBOT.rz]);
      for (const ad of ['supurge_led_sari', 'supurge_led_mavi']) {
        const m = pilot.esya.supurge.getObjectByName(ad);
        if (!m?.isMesh) continue;
        m.material = m.material.clone(); // ışık rengi: dışa aktarım şiddeti 0 olan ışığı siyah yazar
        m.material.emissive.setHex(ad.endsWith('sari') ? 0xffb21a : 0x2a78ff);
        ledler.push(m.material);
      }
    }
  }
  const flipZone = place(new THREE.Group(), [A.fridge[0], A.fridge[1], F.h, -Math.PI / 2 + 0.5]);
  flipZone.add(P.mesh(P.cyl(90, 90, 12, 32), M.dark));
  await yerlestir('flip', place(new THREE.Group(), [0, 0, 12], flipZone));

  // ---- pilot: pişmiş kabuk, gökyüzü, yansıma, huzmeler, ürün gölgesinin pişmiş mermere düşmesi ----
  if (pilot) {
    scene.add(pilot.kabuk, pilot.gok, pilot.huzme);
    odayiUzat(pilot.kabuk, scene); // v8: oda öne uzar, önden kapanır (kamera hiçbir yerde odanın dışını görmez)
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

  // ---- dolabın üstünde, spot lambanın altında anahtar tepsisi (Kutu aracının tepsisi, mürekkep rengi; dekor): içinde
  // Blender'dan halka ve üç anahtar. Kart anahtarlıklar 2026-11-03'ten beri duvardaki askı panosunda (aşağıda); tepsi
  // kaldı: lamba onu aydınlatıyor, dolabın üstü boş kalmıyor ve anahtarın asıl yeri ----
  const tepsi = place(new THREE.Group(), A.tepsi);
  place(binModel('tray', { w: 250, d: 220, h: 18, cols: 1, rows: 1, r: 14, wall: 2.2, floor: 2, color: '#2b3036' }), [0, 0, 0], tepsi);
  // Simetrik düzen: halka arkada ortada, kart öne (kameraya) sarkar; anahtarlar halkada kayıp arkaya yelpaze olur
  // (Blender'daki açılar ev 15°, kapı 105°, kilit 195°; burada ev 25°, kapı 155°, kilit 90°)
  const anahtarlar = place(pilot?.esya.anahtarlik ?? new THREE.Group(), [0, 36, 2, 0], tepsi); // kart ön duvarın ardında kalmasın
  const KAY = { anahtar_ev: 10, anahtar_kapi: 50, anahtar_kilit_bas: -105, anahtar_kilit_agiz: -105 };
  for (const o of anahtarlar.children) if (KAY[o.name]) o.rotation.z = THREE.MathUtils.degToRad(KAY[o.name]);

  // ---- v8 (2026-11-04, kullanıcı kararı): arka duvardaki kart anahtarlık askı panosu (anahtarlik yuvası) kalktı; kart
  // anahtarlıklar Ürünler sekmesinde. Dolabın üstündeki anahtar tepsisi dekor olarak kaldı. Kodu git geçmişinde ----

  // ---- v8.1 (2026-11-05, kullanıcı isteği): tavan lambası. Odanın ortasında, kilimin üstünde kısa sarkıt: tavanda
  // basık göbek, 240 mm kordon, mat koyu kubbe başlık (alt kenarı z ≈ 2310: genel planda ve durak kadrajlarında başların
  // çok üstünde). Işık yalnız başlığın içi ve ampulün yumuşak sıcak parıltısı (ışıyan malzeme); yeni ışık ve gölge yok
  // (telefon bütçesi). Kadraj hesabında engel sayılır (core/oda-kadraj.js), tıklanmaz ----
  {
    const L = { x: -200, y: -150, kordon: 240, r: 175, boy: 135 };
    const lamba = new THREE.Group();
    lamba.name = 'sarkit_lamba';
    const koyu = new THREE.MeshStandardMaterial({ color: 0x3a2f27, roughness: 0.82, metalness: 0.05, envMapIntensity: 0.5 });
    const ic = new THREE.MeshStandardMaterial({ color: 0x1c1712, emissive: 0xffb36a, emissiveIntensity: 0.45, roughness: 0.9, side: THREE.BackSide });
    const ampul = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffe2b0, emissiveIntensity: 3.2, roughness: 0.4 });
    const ust = ROOM.h;
    const gobek = new THREE.Mesh(new THREE.CylinderGeometry(55, 60, 18, 32).rotateX(Math.PI / 2).translate(0, 0, ust - 9), koyu);
    const kordon = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, L.kordon, 8).rotateX(Math.PI / 2).translate(0, 0, ust - 18 - L.kordon / 2), koyu);
    // Kubbe: dış yüz mat koyu, iç yüz sıcak ışıyan (aynı eğri, tek kat; arka yüz)
    const tepe = ust - 18 - L.kordon, prof = [];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * (Math.PI / 2); prof.push(new THREE.Vector2(Math.max(14, Math.sin(a) * L.r), -(1 - Math.cos(a)) * L.boy)); }
    const kubbe = new THREE.LatheGeometry(prof, 40).rotateX(Math.PI / 2).translate(0, 0, tepe);
    const dis = new THREE.Mesh(kubbe, koyu), icYuz = new THREE.Mesh(kubbe, ic);
    const amp = new THREE.Mesh(new THREE.SphereGeometry(32, 20, 14).translate(0, 0, tepe - L.boy + 45), ampul);
    for (const m of [gobek, kordon, dis, icYuz, amp]) { m.castShadow = false; m.receiveShadow = false; lamba.add(m); }
    lamba.position.set(L.x, L.y, 0);
    scene.add(lamba);
  }

  // ---- portfolyo köşesi (2026-11-03, çatı katından taşındı; core/oda-portfolyo.js): sol duvarda kitaplık ve kara tahta
  // (hakkımda); sağ duvarda 55" ekran (süreç), altında kutu oyunu rafı, önünde kilim; buzdolabının önünde çöp. Burada
  // yalnız iskelet (görünmez hacimler, işaretçi yerleri); eşyalar sahne hazır olunca api.portfolyo.yukle() ile ----
  const port = options.portfolyo ? portfolyoIskelet(scene, { lang, hafif }) : { nesne: {}, yerler: {}, ekran: null, update() {}, doldur: async () => null };

  // ---- yakın planda ürünü sürükleyerek çevirme (oda-panel sürüklemeyi verir); sahne yerine göre ----
  // dik: yuva kendi dikey ekseninde ±40°; duvar: çerçeve döndükçe duvardan ayrılır (yarı eni × |sin| + 8 mm, gömülmesin).
  // Çekmece organizeri ve halkadaki kart yerlerine sabit: dönmez.
  const DONER = { kalemlik: 'dik', saksilar: 'dik', cerceve: 'duvar', yapboz: 'duvar' }; // raftaki plaka sırası dönmez
  const donTuru = (zone) => DONER[yerOf(zone)];
  const donenNesne = (zone) => (donTuru(zone) === 'duvar' ? duvarlar[yerOf(zone)] : slots[zone].host);
  function donmeyiBirak(zone, dur = 0.5) {
    const d = donen[zone];
    if (!d) return;
    delete donen[zone];
    gsap.to(d.obj.rotation, { z: d.rz0, duration: dur, ease: 'power3.out', overwrite: true });
    gsap.to(d.obj.position, { x: d.pos0.x, y: d.pos0.y, z: d.pos0.z, duration: dur, ease: 'power3.out', overwrite: true });
  }
  function dondur(zone, aci) {
    const tur = donTuru(zone);
    if (!tur || !slots[zone]) return 0;
    const o = donenNesne(zone);
    let d = donen[zone];
    if (!d) {
      const kutu = new THREE.Box3().setFromObject(o), boy = kutu.getSize(new THREE.Vector3());
      d = donen[zone] = { obj: o, rz0: o.rotation.z, pos0: o.position.clone(), w: Math.max(boy.x, boy.y), aci: 0 };
    }
    gsap.killTweensOf([o.rotation, o.position]);
    d.aci = THREE.MathUtils.clamp(aci, -0.7, 0.7);
    o.rotation.z = d.rz0 + d.aci;
    if (tur === 'duvar') { // duvarın normali: nesnenin yerel −y'si (ön yüzü odaya)
      const cik = (d.w / 2) * Math.abs(Math.sin(d.aci)) + 8 * Math.min(1, Math.abs(d.aci) * 4);
      o.position.set(d.pos0.x + Math.sin(d.rz0) * cik, d.pos0.y - Math.cos(d.rz0) * cik, d.pos0.z);
    }
    return d.aci;
  }

  // ---- davranış ----
  const openDrawer = (k, dur) => gsap.to(drawer.position, { y: DRAWER_Y - k, duration: dur, ease: 'power3.out', overwrite: true });
  let focusedId = null;

  // Ürün değişimi: modeli değişen yuvada eski model küçülüp kaybolur, yenisi biraz yukarıdan büyüyerek yerine oturur;
  // model aynı kalıyorsa (dekor çapası) yalnız bilgi değişir. Değişim sürerken (model üretilirken ve eski model
  // küçülürken) gelen istek yok sayılır, o anki ürün döner: basılı tutulan ok modelleri yanıp söndürmesin. Her değişimde
  // hemen api.onChange(yuva, bilgi) çağrılır (sayfanın seçicisi; değişim üründen de gelebilir).
  const info = (zone) => {
    const s = slots[zone], u = s.urunler[s.index];
    return { index: s.index, count: s.urunler.length, id: u?.id ?? null, name: u?.ad ?? null, durum: u?.durum ?? null,
      magaza: u?.magaza ?? null, fiyat: u?.fiyat ?? null, gorsel: u?.gorsel ?? null };
  };
  // Kadraj hesabı ve kamera güvenliği (v6, core/oda-kadraj.js): sunum eşya yakın planlarını bununla kurar; motor her
  // karede kamerayı mobilya hacimlerinin dışında tutar (kameraDuzelt)
  const kadraj = kadrajAraci(scene);
  // v7 (2026-11-04, kamera kuralı: göz yüksekliği, oda içi, oda dışı piksel 0, karakter örtmez): yakın plan kadrajları
  // o anki ekran oranı ve kartın yeri (yan / alt) için core/oda-kadraj.js bul ile hesaplanır, motorun kart ötelemesi
  // (core/story.js focusShot) denetimde hesaba katılır. Sonuç önbellekte (kimlik + oran + açı + kart); hesap olmazsa
  // FOCUS'taki sabit kadraj. Kamera sayfa bağlanınca gelir (api.kameraBagla; core/oda-sunum.js)
  let kam = null;
  const odakOnbellek = new Map();
  const Zv = new THREE.Vector3(0, 0, 1);
  function odakKadraji(id) {
    const st = FOCUS[id];
    if (st?.sabit) return kam?.camera && kam.camera.aspect < 0.9 && st.dikey ? st.dikey : st; // v8: sabit kadraj (masa) hesaplanmaz
    if (!kam?.camera || !st) return st;
    if (st.dikey && kam.camera.aspect < 0.9) return st.dikey; // v8b: telefona özel sabit kadraj (buzdolabı)
    const cam = kam.camera, panel = kam.root?.dataset.panel || (cam.aspect < 0.9 ? 'bottom' : 'side');
    const anahtar = `${id}|${cam.aspect.toFixed(2)}|${cam.fov}|${panel}|${port.dolu ? 1 : 0}`;
    if (odakOnbellek.has(anahtar)) return odakOnbellek.get(anahtar) ?? st;
    let k = null;
    try {
      const kutu = api.kutu(id);
      // kutuZ: çok uzun eşyada (kitaplık 2,35 m) kadrajın konusu yalnız bu yükseklik bandı (oda içinden bütünü sığmıyor)
      if (kutu && st.kutuZ) { kutu.min.z = Math.max(kutu.min.z, st.kutuZ[0]); kutu.max.z = Math.min(kutu.max.z, st.kutuZ[1]); }
      if (kutu && !kutu.isEmpty()) {
        const fov = cam.fov, aspect = cam.aspect, tv = Math.tan((fov * Math.PI) / 360), alt = aspect < 0.9 || panel !== 'side';
        // Motorun yakın plan ötelemesi (story.js focusShot: alttaki kartta kadraj aşağı, yan kartta sola)
        const kaydir = (pos, c) => {
          const dir = pos.clone().sub(c), L = dir.length(); dir.divideScalar(L);
          const halfH = L * tv;
          if (alt) { const up = Zv.clone().addScaledVector(dir, -dir.z).normalize(); c.addScaledVector(up, -0.4 * halfH); } // altKaydirma 'hedef': kamera yerinde
          else { const sag = new THREE.Vector3().crossVectors(dir.clone().negate(), Zv).normalize(), s = -0.16 * 2 * halfH * aspect; c.addScaledVector(sag, s); pos.addScaledVector(sag, s); }
          return { pos, target: c };
        };
        // Duraktaki Biggie: durduğu yer ve eşyaya doğru eğildiği yer (egil_bak gövdeyi ~0,4 m öne taşır)
        const D = BIGGIE_DURAK.find((d) => d.id === id || d.yuva === id);
        let sanal = null;
        if (D?.yer) {
          const c = kutu.getCenter(new THREE.Vector3()), dx = c.x - D.yer[0], dy = c.y - D.yer[1], L = Math.hypot(dx, dy) || 1, e = Math.min(420, L * 0.6);
          sanal = [{ x: D.yer[0], y: D.yer[1], z0: 0, z1: 1450, r: 240 }, { x: D.yer[0] + (dx / L) * e * 0.5, y: D.yer[1] + (dy / L) * e * 0.5, z0: 600, z1: 1450, r: 270 },
            { x: D.yer[0] + (dx / L) * e, y: D.yer[1] + (dy / L) * e, z0: 600, z1: 1400, r: 240 }];
        }
        const o = api.model(id), haric = new Set(o ? [o] : []);
        const tercih = [st.pos[0] - st.target[0], st.pos[1] - st.target[1], 0];
        const ara = (ek) => kadraj.bul({ kutu, haric, govde: false, sanal, tercih, doluluk: 0.58, fov, aspect, kaydir, ...ek });
        k = ara({ govdeKadraj: 0.8 });
        if (!k?.pos) k = ara({});
        if (!k?.pos) k = ara({ sanal: null, doluluk: 0.75 });
        // Kart ötelemesiyle hiçbir yer odada kalmıyorsa (kitaplık gibi büyük eşya, kamera uzak duvarda): ötelemesiz kadraj
        // bulunur, motorun ötelemesi önceden geri alınır (eşya ortada, kartın bir kısmı üstüne biner; kamera odada kalır)
        if (!k?.pos) {
          const gec = (x) => (x?.pos ? x : null);
          const k2 = gec(ara({ kaydir: null, doluluk: 0.75 })) ?? gec(ara({ kaydir: null, sanal: null, doluluk: 0.8 }))
            ?? gec(ara({ kaydir: null, sanal: null, doluluk: 0.8, disariPay: false })); // salınım payı olmadan (kitaplık: uzak köşe)
          if (k2?.pos) {
            const p = new THREE.Vector3(...k2.pos), t = new THREE.Vector3(...k2.target), s = kaydir(p.clone(), t.clone());
            k = { ...k2, pos: p.clone().sub(s.pos.clone().sub(p)).toArray().map(Math.round), target: t.clone().sub(s.target.clone().sub(t)).toArray().map(Math.round) };
          }
        }
      }
    } catch (e) { console.error('kadraj', id, e); }
    const v = k?.pos ? { pos: k.pos, target: k.target } : null;
    odakOnbellek.set(anahtar, v);
    return v ?? st;
  }
  const odakVekil = new Proxy(FOCUS, { get: (t, id) => (typeof id === 'string' && id in t ? odakKadraji(id) : t[id]) });
  const api = {
    kadraj,
    kameraBagla(camera, root) { kam = { camera, root }; odakOnbellek.clear(); },
    odakKadraji,
    // Ürünün (ya da portfolyo durağının) dünya sınır kutusu (v6 kadraj ölçümü)
    kutu: (zone) => { const o = slots[zone]?.model ?? istasyonNesne(zone); return o ? new THREE.Box3().setFromObject(o) : null; },
    model: (zone) => slots[zone]?.model ?? istasyonNesne(zone),
    urunler: (zone) => slots[zone]?.urunler ?? [],
    current: (zone) => (slots[zone] ? info(zone) : null),
    show,
    onChange: null,
    // Yakın planda sürükleyerek çevirme: donebilir(yuva), donus(yuva) şimdiki açı, dondur(yuva, açı) → uygulanan açı
    donebilir: (zone) => !!donTuru(zone),
    donus: (zone) => donen[zone]?.aci ?? 0,
    dondur,
    // Ürünün (ya da çapasının) dünyadaki ortası: sayfa ve karakter ekrana izdüşürür. Portfolyo durağında nesnenin ortası
    center: (zone) => {
      const o = slots[zone]?.model ?? istasyonNesne(zone);
      return o ? new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()) : null;
    },
    // Portfolyo köşesi: TV denetçisi (core/cati-ekran.js; kart adım listesini buradan sürer) ve Biggie'nin işaretçisiz
    // durakları için nesneler (sunum tıklamayı bunlarla yakalar): buzdolabi, cop (userData.agiz: elmanın düşeceği yer), masa
    portfolyo: { get ekran() { return port.ekran; }, yukle: (derle) => port.doldur(derle).then((r) => { kadraj.yenile(); return r; }), get dolu() { return !!port.dolu; }, parcalar: () => port.parcalar?.() ?? null, get armut() { return port.armut ?? null; } },
    nesne: (id) => (id === 'cop' ? port.nesne.cop : istasyonNesne(id)) ?? slots[id]?.host ?? null,
  };
  async function show(zone, index, { reduced = false } = {}) {
    const s = slots[zone], n = s?.urunler.length;
    if (!s || s.busy || !n) return s ? info(zone) : null;
    const i = ((index % n) + n) % n;
    if (i === s.index) return info(zone);
    s.busy = true;
    try {
      const host = s.host, old = s.model, next = (await model(zone, i)) ?? old;
      s.index = i;
      s.model = next;
      if (next === old || !next) {
        measure(zone);
        api.onChange?.(zone, info(zone));
        return info(zone);
      }
      const olcek = (m) => [m.scale];
      if (old) gsap.killTweensOf(olcek(old));
      gsap.killTweensOf([...olcek(next), next.position]);
      host.add(next);
      const az = agiz(next);
      if (reduced || !old) {
        if (old) host.remove(old);
        olcek(next).forEach((x) => x.setScalar(1));
        next.position.z = 0;
        if (s.plant && az != null) s.plant.position.z = az;
        measure(zone);
        api.onChange?.(zone, info(zone));
      } else {
        gsap.to(olcek(old), { x: 0.001, y: 0.001, z: 0.001, duration: 0.2, ease: 'power2.in', onComplete: () => { if (s.model !== old) host.remove(old); olcek(old).forEach((x) => x.setScalar(1)); } });
        olcek(next).forEach((x) => x.setScalar(0.55));
        next.position.z = 24;
        gsap.to(olcek(next), { x: 1, y: 1, z: 1, duration: 0.5, delay: 0.12, ease: 'back.out(1.7)' });
        gsap.to(next.position, { z: 0, duration: 0.5, delay: 0.12, ease: 'power3.out', onComplete: () => { if (s.model === next) measure(zone); } });
        if (s.plant && az != null) gsap.to(s.plant.position, { z: az, duration: 0.5, delay: 0.1, ease: 'power3.out', overwrite: true });
        api.onChange?.(zone, info(zone));
        await new Promise((r) => gsap.delayedCall(0.22, r)); // eski model küçülene kadar kilit
      }
    } finally {
      s.busy = false;
    }
    if (focusedId === zone) gsap.delayedCall(0.5, () => { if (focusedId === zone) prefetch(zone); });
    return info(zone);
  }

  // İşaretçinin yeri yuvadaki modelin (ürün ya da çapa) tepesi (sahne yer vermediyse): ürün değişince yeniden ölçülür,
  // kısa modelde havada kalmasın. Motor Vector3 olarak verilen yeri kendisi kopyalamaz, her karede okur.
  const anchors = {}, box3 = new THREE.Box3(), mid = new THREE.Vector3();
  function measure(zone) {
    const a = anchors[zone];
    if (!a) return;
    a.object.updateWorldMatrix(true, false); // üst gruplar (tepsi, anahtarlar…) sahne hiç çizilmeden de doğru yerde
    box3.setFromObject(a.object).getCenter(mid);
    a.v.set(mid.x, mid.y, box3.max.z + 18);
  }
  // v8 (2026-11-04, kullanıcı kararı: oda yalnız portfolyo, genel planda tam altı işaretçi): ürün yuvalarının
  // işaretçisi, kartı ve tur durağı yok (ürünler masada, pervazda dekor olarak durur, tıklanmaz; Ürünler sekmesinde).
  // İşaretçiler: armut (Hakkımda), kitaplık, masa, buzdolabı, ekran (Süreç), kutu oyunları (PORTFOLYO_DURAK sırası).
  // Masa ve buzdolabının tıklama hacmi görünmez kutu (masa: tabla + monitör; buzdolabı: gövde)
  const FOV_SEC = (() => { const q = new URLSearchParams(globalThis.location?.search ?? '').get('fov'); const v = q ? q.split(',').map(Number) : []; return [v[0] || FOV.yatay, v[1] || v[0] || FOV.kare, v[2] || FOV.dikey]; })();
  const vekilM = new THREE.MeshBasicMaterial({ visible: false });
  const hacim = (x0, x1, y0, y1, z0, z1) => {
    const g = new THREE.Group(), m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), vekilM);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    g.add(m);
    scene.add(g);
    return g;
  };
  const masaHacmi = hacim(DESK.x0, DESK.x1, DESK.y0, DESK.y1, 0, DESK.top + OLCU.MONITOR.lift + OLCU.MONITOR.h + 60);
  const ISTASYON = {
    masa: { nesne: masaHacmi, anchor: [-800, 1450, DESK.top + OLCU.MONITOR.lift + OLCU.MONITOR.h + 130] },
    buzdolabi: { nesne: fridge, anchor: [FRIDGE.x - 120, FRIDGE.y, FRIDGE.h + 200] },
  };
  const istasyonNesne = (id) => ISTASYON[id]?.nesne ?? port.nesne[id] ?? null;
  const isaretler = () => PORTFOLYO_DURAK.map((id) => ({ id, object: istasyonNesne(id), anchor: ISTASYON[id]?.anchor ?? port.yerler[id] })).filter((x) => x.object && x.anchor);
  // Telefon katmanı (hafif; core/story.js): geçirgen cam yerine saydam cam (core/oda-ortam.js camSadelestir; geçirgenlik
  // geçişi her karede sahneyi iki kez çizdiriyordu). Masaüstü aynı kalır
  if (hafif && pilot) (await import('./oda-ortam.js')).camSadelestir(scene);
  return {
    shots: SHOTS,
    lights: pilot ? pilot.isik : LIGHTS,
    look: LOOK,
    // v7: yakın planda fareyle dönüş kısık (motor 0,24 rad: kamera hesaplanan yerden 14° dönüp odanın dışını gösterebiliyordu)
    focusYaw: 0.05, focusPitch: 0.03,
    altKaydirma: 'hedef', // v7: alttaki kartta kamera göz yüksekliğinde kalır, yalnız bakış aşağı (core/story.js focusShot)
    focusShots: odakVekil, // v7: kimliğe göre o anki ekran için hesaplanır (odakKadraji), olmazsa FOCUS
    // v7: görüş açısı sabit ve geniş (kullanıcı kuralı: yakınlaşma kameranın yeriyle, zoom yok); oda-yerler FOV
    // ?fov=yatay,kare,dikey (deneme: genel plan seçenekleri; v8.2)
    fov: FOV_SEC[0], squareFov: FOV_SEC[1],
    focusShift: 0.16, // yatay ekranda yakın plandaki ürün sağa kayar: sol kenarda başlık paneli
    touchOrbit: false, // dokunmatikte yakın planda yana kaydırma ürün değiştirir (etrafa bakma yok)
    langGeometry: true,
    golgeVekili: hafif,
    kameraDuzelt: (p) => kadraj.disari(p), // v6: kamera hiçbir karede mobilya hacminin içine girmez // telefon katmanı: duran eşyaların gölgesi bölüm başına tek çizim (core/golge-vekili.js)
    update(t) {
      pilot?.perde?.userData.tick(t);
      cayBuhari?.userData.tick(t);
      port.update(t); // ekranın süreç videosu ve geçişleri
      // Süpürge ışıkları: sarı 6 sn'de bir iki kez çakar, mavi 9 sn'de bir yavaşça yanıp söner
      if (ledler.length === 2) {
        const s = t % 6, m = t % 9;
        ledler[0].emissiveIntensity = (s < 0.18 || (s > 0.36 && s < 0.54)) ? 6 : 0;
        ledler[1].emissiveIntensity = m > 4 && m < 5.6 ? 5 * Math.sin(((m - 4) / 1.6) * Math.PI) : 0;
      }
    },
    // Telefonun dikey ekranı: genel motor kamerayı odanın dışına çekip tepeden gökyüzünü gösteriyordu; oda kendi
    // kadrajını verir (içeriden, geniş açıyla: masa, raflar ve sol pencere)
    portraitShot: SHOTS.portrait,
    portraitFov: FOV_SEC[2],
    // v8: genel plan ekran oranına göre odanın içinden; altı işaretçi de kadrajda (oda-yerler fitShot)
    // Ek noktalar: armudun ve kutu rafının alt kısmı da kadrajda (yalnız işaretçi değil, eşyanın kendisi görünsün)
    fitShot: (aspect, fov) => fitShot(aspect, fov, [...isaretler().map((x) => x.anchor), [-1380, -560, 250], [1800, -700, 150], [1800, 200, 150],
      ...[-1, 1].flatMap((sx) => [[sx * 2050, ROOM.y1, 2600], [sx * 2050, ROOM.y1, 60]])]), // arka duvarın dört köşesi: oda dört yanıyla
    // v8: kamera hiçbir zaman odanın dışında değil (motorun setView ve yakın plan geri çekilmesi bu kutuda durur)
    cameraBounds: { min: [ROOM.x0 + 160, ON_DUVAR.y + 160, 300], max: [ROOM.x1 - 160, ROOM.y1 - 160, ROOM.h - 150] },
    outlineFocus: !pilot, // gerçekçi sahnede yakın plandaki ürünün çevresine çizgi çekilmez (yaprakları tek tek çiziyordu)
    // Yalnız görünen yuvalar (ürünü olan), ZONES sırasıyla (şerit ve tur). Kadrajlar FOCUS'ta (oda-yerler)
    // Ardından portfolyo durakları (PORTFOLYO_DURAK sırası; ürün seçicisi ve düğmesi yok: preset yok)
    hotspots: [
      ...isaretler().map(({ id, object, anchor }) => ({ id, tool: 'urun', object, noLift: true, anchor })),
    ],
    // Sayfanın ürün seçicisi buradan konuşur (story denetleyicisinde api)
    api,
    // Yakın plandaki ürüne yeniden tıklamak sıradaki ürünü getirir; ekrana yeniden tıklamak sıradaki süreç adımını
    onPoke(id, { reduced } = {}) {
      if (id === 'ekran') { port.ekran?.ileri(); return; }
      if (slots[id]) show(id, slots[id].index + 1, { reduced });
    },
    // Üzerine gelince çekmece aralanır (davet; çekmecede yuva varsa); yakın plandayken dokunulmaz
    onHover(id) { if (yerOf(focusedId) !== 'cekmece') openDrawer(yerOf(id) === 'cekmece' ? 60 : 0, 0.35); },
    onFocus(id, { reduced } = {}) {
      focusedId = id;
      pilot?.huzme.userData.guc(0.25, reduced ? 0.01 : 0.8, gsap); // yakın planda huzme kısılır (pus ürünü örtmesin)
      gsap.delayedCall(reduced ? 0.1 : 1.3, () => { if (focusedId === id) prefetch(id); }); // kamera uçuşu bitince
      if (yerOf(id) === 'cekmece') openDrawer(590, reduced ? 0.01 : 0.9); // tam açılan ray: içi bütünüyle görünür
    },
    onUnfocus(id) {
      if (focusedId === id) focusedId = null;
      donmeyiBirak(id);
      if (!focusedId) pilot?.huzme.userData.guc(1, 0.8, gsap);
      if (yerOf(id) === 'cekmece') openDrawer(0, 0.5);
    },
  };
}

// v8.4: siyah ergonomik sağ el faresi (kablosuz). F = OLCU.MOUSE.form (gerçek mm; önü +y, sağı +x, taban merkezi orijin).
// Sırt arkada yüksek, öne alçalır, sağa eğimli (egim), kenarlar yuvarlanır (kenar); sol yanda başparmak oluğu. Yüzey tuş
// ekinin merkezi (0, ys) çevresinde açısal ağ: sağ tuş 0–90°, sol tuş 90–180°, gövde 180–360°; aralarındaki yarık (yarik,
// tekerlek bölgesinde genişler) koyu iç kabuğu gösterir. Python ikizi: scripts/karakter-klip-v84.py (fare_ust, fare_oluk, fare_R).
function ergonomikFare(F) {
  const g = new THREE.Group();
  g.name = 'fare_ergonomik';
  const aY = (y) => F.a_on + (F.a_arka - F.a_on) * (0.5 - (0.5 * y) / F.b);
  const sOf = (x, y) => ((Math.abs(x) / aY(y)) ** F.n + (Math.abs(y) / F.b) ** F.n) ** (1 / F.n);
  const ust = (x, y) => {
    const s = sOf(x, y);
    if (s >= 1) return 0;
    const t = y - F.yp;
    const hl = t >= 0 ? 1 - F.on_dus * (t / (F.b - F.yp)) ** 2 : 1 - F.arka_dus * (t / (F.b + F.yp)) ** 2;
    return F.H * hl * (1 - (F.egim * x) / aY(y)) * Math.sqrt(1 - s ** F.kenar);
  };
  const oluk = (x, y, z) => (x >= 0 ? 1 : 1 - F.oluk * Math.exp(-(((y - F.oluk_y) / F.oluk_yy) ** 2)) * Math.exp(-((((z - F.taban) / F.H - F.oluk_z) / F.oluk_zz) ** 2)));
  const Rcache = new Map();
  const R = (th) => {
    const k = th.toFixed(5);
    if (Rcache.has(k)) return Rcache.get(k);
    let lo = 0, hi = 2 * F.b;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (sOf(m * Math.cos(th), F.ys + m * Math.sin(th)) < 1) lo = m; else hi = m;
    }
    Rcache.set(k, lo);
    return lo;
  };
  const nokta = (th, rho, kx = 1, kz = 1) => {
    const r = R(th), x = rho * r * Math.cos(th), y = F.ys + rho * r * Math.sin(th), z = F.taban + ust(x, y) * kz;
    return [x * oluk(x, y, z) * kx, y, z];
  };
  const N = 30, rh = Array.from({ length: N + 1 }, (_, i) => Math.sin((Math.PI / 2) * (i / N)));
  // Yarığın yarı genişliği (mm) bir sınır açısında ve halkada: ortadaki yarık tekerleğin yanında genişler
  const yarik = (phi, rho) => {
    if (Math.abs(phi - Math.PI / 2) < 1e-6) {
      const y = F.ys + rho * R(phi);
      if (Math.abs(y - (F.ys + F.teker_y)) < F.teker_r + 1) return F.teker_w / 2 + 0.6;
    }
    return F.yarik;
  };
  // Parça: [a, b] açı aralığı, iki uçta yarık kadar içeri; çok küçük halkalar atlanır
  const parca = (a, b, M) => {
    const pos = [], idx = [];
    let onceki = -1;
    for (let i = 1; i <= N; i++) {
      const rho = rh[i], da = Math.asin(Math.min(0.99, yarik(a, rho) / (rho * R(a)))), db = Math.asin(Math.min(0.99, yarik(b, rho) / (rho * R(b))));
      const t0 = a + da, t1 = b - db;
      if (t1 - t0 < 0.05) { onceki = -1; continue; }
      const bas = pos.length / 3;
      for (let j = 0; j <= M; j++) pos.push(...nokta(t0 + ((t1 - t0) * j) / M, rho));
      if (onceki >= 0) for (let j = 0; j < M; j++) idx.push(onceki + j, bas + j, bas + j + 1, onceki + j, bas + j + 1, onceki + j + 1);
      onceki = bas;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  };
  const govdeM = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.7 });
  const tusM = new THREE.MeshStandardMaterial({ color: 0x232327, roughness: 0.36 });
  const ic = new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.9 });
  g.add(new THREE.Mesh(parca(Math.PI, 2 * Math.PI, 64), govdeM), new THREE.Mesh(parca(Math.PI / 2, Math.PI, 32), tusM), new THREE.Mesh(parca(0, Math.PI / 2, 32), tusM));
  // İç kabuk (yarıklardan görünen koyu yüzey): aynı yüzey biraz içeride
  {
    const M = 96, pos = [], idx = [];
    pos.push(0, F.ys, F.taban + ust(0, F.ys) * 0.96);
    for (let i = 1; i <= N; i++) for (let j = 0; j < M; j++) pos.push(...nokta((2 * Math.PI * j) / M, rh[i], 0.985, 0.96));
    const ix = (i, j) => 1 + (i - 1) * M + (j % M);
    for (let j = 0; j < M; j++) idx.push(0, ix(1, j), ix(1, j + 1));
    for (let i = 1; i < N; i++) for (let j = 0; j < M; j++) idx.push(ix(i, j), ix(i + 1, j), ix(i + 1, j + 1), ix(i, j), ix(i + 1, j + 1), ix(i, j + 1));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, ic));
  }
  // Taban: dış çizgiden taban kalınlığında koyu dilim
  {
    const sh = new THREE.Shape();
    for (let j = 0; j <= 96; j++) {
      const th = (2 * Math.PI * j) / 96, r = R(th) * 0.99, x = r * Math.cos(th), y = F.ys + r * Math.sin(th);
      if (j === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    }
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: F.taban, bevelEnabled: false, curveSegments: 1 }), new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.8 })));
  }
  // Tekerlek: yarığın genişlediği yerde, üstü yüzeyden 1,2 mm çıkar
  const ty = F.ys + F.teker_y, teker = new THREE.Mesh(new THREE.CylinderGeometry(F.teker_r, F.teker_r, F.teker_w, 24), new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.85 }));
  teker.rotation.z = Math.PI / 2;
  teker.position.set(0, ty, F.taban + ust(0, ty) + 1.2 - F.teker_r);
  g.add(teker);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
