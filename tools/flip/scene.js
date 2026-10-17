// Text Flip hikâye sahnesi: konsolda üç heykel. Her harf çifti gerçek geometriyle kesiştirilir:
// birinci harf önden (XZ), ikinci harf yandan (YZ) çekilir, kesişimleri iki kelimeyi birden taşır.
// Ana heykel döner tablada durur, kameraya sırayla iki kelimeyi gösterir.
import * as THREE from 'three';
import { initCSG } from '../../core/csg.js';
import { solid, fonts, plate, C } from '../../core/scene-kit.js';
import { textPolys } from '../../core/font3d.js';

const BACK = 400;

// Harfi kendi kutusunda ortalanmış çokgen olarak döndürür (taban çizgisi y=0).
function glyph(fs, ch, size) {
  const t = textPolys(fs, ch, size);
  const b = t.glyphs[0].box;
  if (!b) return null;
  const cx = (b.minX + b.maxX) / 2;
  return { polys: t.polys.map((p) => p.map(([x, y]) => [x - cx, y])), w: b.maxX - b.minX, h: b.maxY };
}

// Heykelin yerleşimi: harf yuvaları köşegen boyunca (i·p, i·p), ortadaki yuva orijinde. Yalnız yazı tipi
// hesabıdır (scope gerekmez). Oda sahnesi (core/oda-urunler.js) heykeli bu parçalardan kurar.
export function flipLayout(fs, w1, w2, size) {
  const n = Math.max(w1.length, w2.length);
  const A = [...w1.padEnd(n)].map((c) => glyph(fs, c, size));
  const B = [...w2.padEnd(n)].map((c) => glyph(fs, c, size));
  const pitch = Math.max(...[...A, ...B].filter(Boolean).map((g) => g.w)) * 1.02;
  return { n, A, B, pitch, depth: pitch * 1.6, mid: ((n - 1) * pitch) / 2 };
}

// i. yuvanın parçası, yuvanın ortasında; taban çizgisi z=0 (scope içinde). İki harf de yoksa null.
// Ön kelime −Y'den, ikinci kelime +X'ten okunur.
export function flipPiece(L, i) {
  const a = L.A[i], b = L.B[i], d = L.depth;
  const front = a ? C.move(C.rot(C.extrude(C.polys2(a.polys), d), 90, 0, 0), 0, d / 2, 0) : null;
  let side = b ? C.move(C.rot(C.extrude(C.polys2(b.polys), d), 90, 0, 0), 0, d / 2, 0) : null;
  if (side) side = C.rot(side, 0, 0, 90);
  if (front && side) return C.inter(front, side);
  return front || side; // kısa kelimede yuva tek harfle dolar
}

// Köşegen taban levhası, ortası orijinde (scope içinde).
export function flipBase(L) {
  const len = (L.n - 1) * L.pitch * Math.SQRT2 + L.pitch * 1.6;
  return C.rot(plate(len, L.pitch * 0.9, 4, 3), 0, 0, 45);
}

// İki kelimeli heykel, tek katı (scope içinde çağrılır). Tabanın ortası orijinde.
export function flipSolid(fs, w1, w2, size) {
  const L = flipLayout(fs, w1, w2, size);
  const pieces = [];
  for (let i = 0; i < L.n; i++) {
    const p = flipPiece(L, i);
    if (p) pieces.push(C.move(p, i * L.pitch - L.mid, i * L.pitch - L.mid, 4));
  }
  return C.union([flipBase(L), ...pieces]);
}

export async function buildScene({ scene, P, lang }) {
  await initCSG();
  const fs = await fonts(700);
  const { PALETTE: K } = P;
  const pla = (c) => P.clay(c, { rough: 0.48, env: 0.8 });
  const pairs = lang === 'en'
    ? { family: ['MOM', 'DAD'], us: ['YOU', 'ME'], sea: ['SEA', 'SUN'] }
    : { family: ['ANNE', 'BABA'], us: ['SEN', 'BEN'], sea: ['ADA', 'EGE'] };

  scene.add(P.room({ back: BACK, w: 7000, d: 5200 }));
  const put = (o, x, y, z = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.z = rz; scene.add(o); return o; };

  // Alçak konsol
  const CX = 250, CT = 620, CY = BACK - 200;
  {
    const con = new THREE.Group();
    con.add(P.mesh(P.rbox(1300, 380, CT - 120, 6), P.clay(0xe9e4da, { rough: 0.7 })).translateZ(120));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) con.add(P.mesh(P.cyl(16, 11, 120, 16), P.clay(K.woodDark, { rough: 0.7 })).translateX(sx * 600).translateY(sy * 150));
    for (const sx of [-1, 0, 1]) con.add(P.mesh(P.rbox(5, 5, CT - 170, 1), P.clay(0xcfc8bb, { rough: 0.7 })).translateX(sx * 216 + 108 * (sx === 0 ? 0 : 0)).translateY(-190).translateZ(145));
    put(con, CX, CY, 0);
  }

  // Kameranın yatay yönü: heykelleri doğru açıyla çevirmek için.
  const MAIN = { pos: [930, -1450, 1120], target: [120, 170, 715] };
  const phi = Math.atan2(MAIN.pos[1] - CY, MAIN.pos[0] - CX);
  const faceWord1 = phi + Math.PI / 2; // yerel −Y kameraya bakar → 1. kelime okunur
  const faceWord2 = phi;               // yerel +X kameraya bakar → 2. kelime okunur

  const hotspots = [];
  const tt = P.turntable({ r: 150 });
  put(tt, CX, CY - 10, CT);
  const spin = tt.userData.spin;
  {
    const [w1, w2] = pairs.family;
    const s = solid(() => flipSolid(fs, w1, w2, 78), pla(K.accent));
    s.position.z = 8;
    spin.add(s);
    hotspots.push({ id: 'family', preset: null, object: tt });
  }
  {
    const [w1, w2] = pairs.us;
    const g = new THREE.Group();
    g.add(solid(() => flipSolid(fs, w1, w2, 46), pla(K.ink)));
    put(g, CX - 380, CY + 20, CT, faceWord2);
    hotspots.push({ id: 'us', preset: null, object: g });
  }
  {
    const [w1, w2] = pairs.sea;
    const g = new THREE.Group();
    g.add(solid(() => flipSolid(fs, w1, w2, 46), pla(K.blue)));
    put(g, CX + 390, CY + 10, CT, faceWord1);
    hotspots.push({ id: 'sea', preset: null, object: g });
  }

  // Hikâyeyi tamamlayan eşyalar
  put(P.giftBox({ color: K.sage, ribbon: K.rose }), CX - 540, CY - 40, CT, 0.4);
  put(P.plant({ kind: 'leafy', size: 1.1, seed: 31, pot: K.paper }), CX + 570, CY + 60, CT);
  {
    const fr = P.frame({ w: 300, h: 380, depth: 22, border: 20, color: K.woodLight });
    put(fr, CX - 120, BACK - 15, 1150);
  }

  let hoverId = null;
  return {
    shots: {
      intro: { pos: [-1300, -3300, 1900], target: [0, 200, 850] },
      main: MAIN,
    },
    lights: { center: [CX, CY, 800], shadowSpan: 1300, key: [-900, -1600, 2400] },
    hotspots,
    langGeometry: true, // sahnedeki 3B yazılar dile bağlı
    onHover(id) { hoverId = id; },
    update(t) {
      // Döner tabla: 2.4 sn bekle, 1.1 sn dön, 2.4 sn bekle, geri dön. Üzerine gelince hızlanır.
      const period = hoverId === 'family' ? 4.2 : 7;
      const u = (t % period) / period;
      const hold = 0.34, turn = 0.16;
      let k;
      if (u < hold) k = 0;
      else if (u < hold + turn) { const x = (u - hold) / turn; k = x * x * (3 - 2 * x); }
      else if (u < 2 * hold + turn) k = 1;
      else { const x = (u - 2 * hold - turn) / (1 - 2 * hold - turn); k = 1 - x * x * (3 - 2 * x); }
      spin.rotation.z = faceWord1 + (faceWord2 - faceWord1) * k;
    },
  };
}
