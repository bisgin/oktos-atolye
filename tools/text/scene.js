// 3D Yazı hikâye sahnesi: ev girişi. Kapıda isimlik, konsolda masa tabelası ve pasta süsü,
// duvardaki askılıkta anahtarlık. Yazılar sitenin yazı tipiyle (Türkçe harfler dahil) katı model.
import * as THREE from 'three';
import { initCSG } from '../../core/csg.js';
import { solid, fonts, textSolid, standUp, plate, C } from '../../core/scene-kit.js';

const BACK = 400;

export async function buildScene({ scene, P, lang }) {
  await initCSG();
  const fs = await fonts(700);
  const { PALETTE: K } = P;
  const pla = (c) => P.clay(c, { rough: 0.5, env: 0.75 });
  const W = lang === 'en'
    ? { door: 'STUDIO', sign: 'HELLO', key: 'OKTOS', cake: 'HAPPY BIRTHDAY' }
    : { door: 'ATÖLYE', sign: 'MERHABA', key: 'OKTOS', cake: 'İYİ Kİ DOĞDUN' };

  scene.add(P.room({ back: BACK, w: 7000, d: 5200 }));
  const put = (o, x, y, z = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.z = rz; scene.add(o); return o; };
  const hotspots = [];

  // ---- Kapı + isimlik ----
  const DX = 820;
  put(P.door({ w: 860, h: 2050 }), DX, BACK - 30, 0);
  {
    // Levha XZ düzleminde ortalı (z −48..48), ön yüzü −Y; yazı ön yüzden 4 mm taşar.
    const g = new THREE.Group();
    g.add(solid(() => standUp(plate(300, 96, 6, 12), 6), pla(K.paper)));
    g.add(solid(() => {
      const t = textSolid(fs, W.door, 56, 4, { spacing: 2 });
      return C.move(standUp(t.solid, 4), 0, -4, -t.cap / 2);
    }, pla(K.ink)));
    put(g, DX, BACK - 30 - 22 - 7, 1480);
    hotspots.push({ id: 'door', preset: 'door', object: g });
  }
  put(P.plant({ kind: 'leafy', size: 2.2, seed: 14, pot: K.terracotta }), DX + 620, 120, 0);

  // ---- Konsol ----
  const CX = -20, CT = 780, CY = BACK - 190;
  {
    const con = new THREE.Group();
    const cm = P.clay(K.woodDark, { rough: 0.65 });
    con.add(P.mesh(P.rbox(980, 360, 30, 5), cm).translateZ(CT - 30));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      con.add(P.mesh(P.rbox(34, 34, CT - 30, 4), P.clay(K.ink, { rough: 0.5, metal: 0.3 })).translateX(sx * 450).translateY(sy * 150));
    }
    con.add(P.mesh(P.rbox(940, 320, 16, 3), cm).translateZ(180));
    put(con, CX, CY, 0);
    put(P.books({ count: 4, seed: 6, lean: false }), CX - 420, CY + 20, 196);
  }

  // ---- Masa tabelası: kaide + dik harfler ----
  {
    const g = new THREE.Group();
    const t = { w: 0 };
    g.add(solid(() => {
      const ts = textSolid(fs, W.sign, 44, 10, { spacing: 1 });
      t.w = ts.width;
      return C.move(standUp(ts.solid, 10), 0, -5, 12);
    }, pla(K.accent)));
    g.add(solid(() => C.move(plate(t.w + 30, 40, 12, 8), 0, 0, 0), pla(K.ink)));
    put(g, CX + 230, CY - 40, CT, -0.12);
    hotspots.push({ id: 'sign', preset: 'sign', object: g });
  }

  // ---- Pasta + pasta süsü ----
  {
    const g = new THREE.Group();
    const cake = P.cake();
    g.add(cake);
    const topper = solid(() => {
      const ts = textSolid(fs, W.cake, 30, 3, { spacing: 0.5 });
      const w = ts.width;
      const bar = C.move(plate(w + 10, 6, 3, 2), 0, -2.7, 0); // harflerin tabanına 0.3 mm biner
      const sticks = [-w * 0.3, w * 0.3].map((x) => C.move(C.box(4, 60, 3, -2, -60, 0), x, 0, 0));
      return C.move(standUp(C.union([ts.solid, bar, ...sticks]), 3), 0, -1.5, 52);
    }, pla(K.yellow));
    topper.position.z = cake.userData.top - 40;
    g.add(topper);
    put(g, CX - 230, CY - 30, CT, 0.08);
    hotspots.push({ id: 'cake', preset: 'iyi', object: g, anchor: [CX - 230, CY - 30, CT + 260] });
  }

  // ---- Anahtar askılığı + anahtarlık ----
  {
    const board = new THREE.Group();
    board.add(P.mesh(P.rbox(300, 24, 100, 6), P.clay(K.woodLight, { rough: 0.7 })));
    for (let i = 0; i < 3; i++) {
      const hook = P.mesh(P.cyl(4, 4, 30, 12), P.metal(K.ink, 0.4));
      hook.rotation.x = Math.PI / 2;
      hook.position.set(-90 + i * 90, -12, 40);
      board.add(hook);
    }
    put(board, 165, BACK - 12, 1350);
    // Etiket XY'de kurulur (üstte delikli kulak), sonra yazıyla birlikte aynı dönüşle dikilir.
    const lift = (m) => C.move(C.rot(m, 90, 0, 0), 0, 4, 0);
    const tag = solid(() => lift(C.sub(
      C.union([plate(92, 34, 4, 9), C.move(plate(24, 20, 4, 7), 0, 22, 0)]),
      C.cyl(10, 4.2, 4.2, 24, 0, 24, -3),
    )), pla(K.blue));
    const word = solid(() => {
      const ts = textSolid(fs, W.key, 17, 2, { spacing: 0.6 });
      return lift(C.move(ts.solid, 0, -ts.cap / 2, 4));
    }, pla(0xf3efe6));
    const ring = P.mesh(new THREE.TorusGeometry(12, 1.8, 10, 28), P.metal(K.steel, 0.3));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 2, 36);
    // Salınım ekseni kancanın ucu: halka tepesi (z=48) orijine gelsin.
    const swing = new THREE.Group();
    const body = new THREE.Group();
    body.add(tag, word, ring);
    body.position.z = -48;
    swing.add(body);
    const g = new THREE.Group();
    g.add(swing);
    g.userData.swing = swing;
    put(g, 165, BACK - 50, 1390);
    hotspots.push({ id: 'key', preset: 'key', object: g });
  }

  const keyGroup = hotspots.find((h) => h.id === 'key').object;
  let hoverId = null;
  return {
    shots: {
      intro: { pos: [-1600, -4200, 2400], target: [200, 220, 1150] },
      main: { pos: [1080, -2050, 1420], target: [260, 220, 1000] },
    },
    lights: { center: [300, 150, 1000], shadowSpan: 1700, key: [-1200, -1500, 2700] },
    hotspots,
    langGeometry: true, // sahnedeki 3B yazılar dile bağlı
    onHover(id) { hoverId = id; },
    update(t) {
      // Anahtarlık askıda hafifçe sallanır; üzerine gelince biraz daha.
      const amp = hoverId === 'key' ? 0.12 : 0.04;
      keyGroup.userData.swing.rotation.y = Math.sin(t * 1.6) * amp;
    },
  };
}
