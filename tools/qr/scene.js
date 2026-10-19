// 3D QR hikâye sahnesi: oturma odası köşesi. Konsolda modem ve Wi-Fi standı; kafe masasında menü
// karosu, fincanlar, kartvizit ve QR anahtarlık. Kodlar gerçektir (telefonla okunur).
// Yakınlaşınca kodun üstünden telefon taraması gibi bir çizgi geçer (onFocus).
import * as THREE from 'three';
import { gsap } from 'gsap';
import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';
import { initCSG } from '../../core/csg.js';
import { solid, fonts, textSolid, plate, C } from '../../core/scene-kit.js';

const BACK = 400;

export async function buildScene({ scene, P, lang }) {
  await initCSG();
  const fs = await fonts(700);
  const { PALETTE: K } = P;
  const white = P.clay(0xf4f2ec, { rough: 0.55 });
  const ink = P.clay(K.ink, { rough: 0.5 });

  // QR karo: taban levha + kabarık modüller (örnekli kutular). Karo XY'de yatar, kodu +Z'ye bakar.
  // header: üstte kabartma yazı şeridi (örn. "Wi-Fi").
  function qrTile(text, { size = 80, header = null, color = K.ink, base = white, corner = 6 } = {}) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    const quiet = 2;
    const cell = size / (n + quiet * 2);
    const headH = header ? size * 0.28 : 0;
    const g = new THREE.Group();
    const H = size + headH;
    const tile = P.mesh(P.rbox(size, H, 3, corner), base);
    tile.position.y = headH / 2;
    g.add(tile);
    let count = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) count++;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(cell * 1.001, cell * 1.001, 1.4), P.clay(color, { rough: 0.45 }), count);
    im.castShadow = true; im.receiveShadow = true;
    const o = new THREE.Object3D();
    let k = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!q.isDark(r, c)) continue;
      o.position.set(-size / 2 + (quiet + c + 0.5) * cell, size / 2 - (quiet + r + 0.5) * cell, 3.7);
      o.updateMatrix();
      im.setMatrixAt(k++, o.matrix);
    }
    g.add(im);
    if (header) {
      const word = solid(() => {
        const t = textSolid(fs, header, headH * 0.62, 1.4, { spacing: 0.4 });
        return C.move(t.solid, 0, size / 2 + headH * 0.5 - t.cap / 2 - 1, 3);
      }, P.clay(color, { rough: 0.45 }));
      g.add(word);
    }
    // Tarama çizgisi: başta gizli, yakınlaşınca kodun üstünden geçer.
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 1.06, Math.max(1.6, cell * 1.4)),
      new THREE.MeshBasicMaterial({ color: 0xff9a52, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    scan.position.set(0, -size / 2, 5.8);
    scan.visible = false;
    scan.renderOrder = 6;
    g.add(scan);
    g.userData.h = H;
    g.userData.size = size;
    g.userData.scan = scan;
    return g;
  }
  function scanTile(tile) {
    const s = tile?.userData.scan;
    if (!s) return;
    const half = tile.userData.size / 2;
    // Önceki tarama yarıda kalırsa akışın kendisi öldürülür: eski bitişi yeni taramayı gizlemesin.
    tile.userData.scanTl?.kill();
    s.visible = true;
    s.position.y = -half;
    s.material.opacity = 0;
    tile.userData.scanTl = gsap.timeline({ delay: 0.45, onComplete: () => { s.visible = false; } })
      .to(s.material, { opacity: 0.9, duration: 0.15 }, 0)
      .to(s.position, { y: half, duration: 0.85, ease: 'power1.inOut' }, 0)
      .to(s.position, { y: -half, duration: 0.85, ease: 'power1.inOut' })
      .to(s.material, { opacity: 0, duration: 0.25 }, '-=0.25');
  }
  const tiles = {};

  // Karoyu dik bir kaideye yaslar (arkaya 14° eğik), ön yüzü −Y.
  function standing(tileGroup, { baseW = 90, color = K.woodLight } = {}) {
    const g = new THREE.Group();
    const holder = new THREE.Group();
    tileGroup.position.y = tileGroup.userData.size / 2; // karonun alt kenarı tutucunun orijininde
    holder.add(tileGroup);
    holder.rotation.x = Math.PI / 2 - 0.25;           // yukarı + 14° geriye; yüzü −Y
    holder.position.set(0, -4, 12);                   // kaidenin üstündeki yuvaya
    g.add(P.mesh(P.rbox(baseW, 46, 14, 5), P.clay(color, { rough: 0.7 })), holder);
    return g;
  }

  scene.add(P.room({ back: BACK, w: 7000, d: 5200 }));
  const put = (o, x, y, z = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.z = rz; scene.add(o); return o; };
  const hotspots = [];

  // ---- Duvar konsolu: modem + Wi-Fi standı + bitki ----
  const SX = -120, ST = 700, SY = BACK - 170;
  {
    const con = new THREE.Group();
    con.add(P.mesh(P.rbox(900, 320, 28, 5), P.clay(K.woodLight, { rough: 0.7 })).translateZ(ST - 28));
    for (const sx of [-1, 1]) {
      const leg = P.mesh(P.rbox(28, 280, ST - 28, 4), P.clay(K.ink, { rough: 0.5, metal: 0.3 }));
      leg.position.set(sx * 420, 0, 0);
      con.add(leg);
    }
    put(con, SX, SY, 0);
    put(P.router(), SX - 230, SY + 30, ST, 0.1);
    put(P.plant({ kind: 'succulent', size: 0.9, pot: K.terracotta }), SX + 330, SY + 40, ST);
    const wifi = qrTile('WIFI:T:WPA;S:Oktos Misafir;P:atolye-2026;;', { size: 92, header: 'Wi-Fi', color: K.ink });
    const st = standing(wifi, { baseW: 104 });
    put(st, SX + 40, SY - 30, ST, -0.12);
    tiles.wifi = wifi;
    hotspots.push({ id: 'wifi', preset: 'wifi', object: st });
  }

  // ---- Kafe masası: menü karosu, fincanlar, kartvizit, anahtarlık ----
  const TX = 720, TY = -420, TT = 740;
  put(P.rug({ r: 1100, color: 0xd5d0c4, ring: 0xc6bfae }), TX - 100, TY + 50, 0);
  put(P.coffeeTable({ r: 420, h: TT, color: K.wood }), TX, TY, 0);
  {
    const menu = qrTile('https://oktosworkshop.com', { size: 110, header: lang === 'en' ? 'MENU' : 'MENÜ', color: K.accent });
    const st = standing(menu, { baseW: 124, color: K.ink });
    put(st, TX - 40, TY + 140, TT, -0.35);
    tiles.menu = menu;
    hotspots.push({ id: 'menu', preset: 'menu', object: st });
  }
  put(P.cafeCup(), TX - 230, TY - 40, TT, 0.4);
  put(P.cafeCup(), TX + 170, TY + 60, TT, -0.9);
  {
    const g = new THREE.Group();
    const card = P.mesh(P.rbox(85, 55, 1.2, 3, 1), P.clay(0xf6f3ec, { rough: 0.7 }));
    g.add(card);
    const q = qrTile('https://oktosworkshop.com', { size: 40, color: K.ink, corner: 2 });
    q.scale.set(1, 1, 0.5);
    q.position.set(-18, 0, 1);
    g.add(q);
    const name = solid(() => {
      const t = textSolid(fs, 'OKTOS', 9, 0.6, { spacing: 0.3 });
      return C.move(t.solid, 20, 4, 1.2);
    }, ink);
    g.add(name);
    const card2 = P.mesh(P.rbox(85, 55, 1.2, 3, 1), P.clay(K.sage, { rough: 0.7 }));
    card2.position.set(6, -8, -1.3);
    card2.rotation.z = -0.25;
    g.add(card2);
    put(g, TX + 40, TY - 170, TT + 1.3, 0.3);
    tiles.card = q;
    hotspots.push({ id: 'card', preset: 'card', object: g });
  }
  {
    const g = new THREE.Group();
    const tagQ = qrTile('https://oktosworkshop.com', { size: 36, color: K.ink, base: P.clay(K.yellow, { rough: 0.5 }), corner: 5 });
    g.add(tagQ);
    const ring = P.mesh(new THREE.TorusGeometry(12, 1.8, 10, 28), P.metal(K.steel, 0.3));
    ring.position.set(0, 30, 1.5);
    g.add(ring);
    const key = P.key({ color: K.brass });
    key.position.set(10, 48, 0.5);
    key.rotation.z = 0.9;
    g.add(key);
    put(g, TX + 230, TY - 120, TT, -0.5);
    tiles.key = tagQ;
    hotspots.push({ id: 'key', preset: 'key', object: g });
  }
  put(P.phone(), TX + 250, TY - 260 + 60, TT, 0.6);

  return {
    shots: {
      intro: { pos: [-1600, -4400, 2500], target: [200, 0, 900] },
      main: { pos: [1230, -1950, 1330], target: [340, -60, 760] },
    },
    lights: { center: [350, -50, 750], shadowSpan: 1600, key: [-1000, -1600, 2500] },
    hotspots,
    langGeometry: true, // sahnedeki 3B yazılar dile bağlı
    onFocus(id, { reduced } = {}) { if (!reduced) scanTile(tiles[id]); },
    onPoke(id, { reduced } = {}) { if (!reduced) scanTile(tiles[id]); },
  };
}
