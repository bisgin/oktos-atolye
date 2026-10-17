// Filament Painter hikâye sahnesi: pencereye asılı arkadan ışıklı panel, duvarda çerçeveli rölyef,
// şövalede kartpostal. Rölyefler kodla çizilen manzaralardan üretilir: parlaklık → yükseklik,
// 4 filament rengi katman bantlarıyla (HueForge mantığı).
// Yakınlaşınca: pencere paneli bir kez daha parlar; rölyef ve kartpostal katman katman yeniden basılır.
import * as THREE from 'three';
import { gsap } from 'gsap';

const BACK = 400;
const WIN = { x: 620, w: 900, z0: 900, z1: 2100 };

// ---- prosedürel manzara (gri tonlu: 0 koyu, 1 açık). Oda sahnesi de kullanır. ----
export function landscape(kind, W, H, seed = 1) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#d8d8d8'); sky.addColorStop(0.55, '#f2f2f2'); sky.addColorStop(1, '#ffffff');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sunX = kind === 'sea' ? W * 0.62 : W * 0.7, sunY = kind === 'sea' ? H * 0.42 : H * 0.36;
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(sunX, sunY, H * 0.11, 0, Math.PI * 2); g.fill();
  const ridge = (base, amp, freq, shade, ph) => {
    g.fillStyle = shade;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x++) {
      const y = base - amp * (0.6 * Math.sin(x * freq + ph) + 0.3 * Math.sin(x * freq * 2.7 + ph * 1.9) + 0.15 * Math.sin(x * freq * 6.1 + ph * 0.7));
      g.lineTo(x, y);
    }
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  if (kind === 'sea') {
    g.fillStyle = '#9a9a9a'; g.fillRect(0, H * 0.55, W, H * 0.45);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = i % 2 ? '#c8c8c8' : '#7a7a7a';
      const y = H * 0.58 + i * H * 0.045;
      g.fillRect(0, y, W, H * 0.012);
    }
    g.fillStyle = '#ececec';
    g.fillRect(sunX - H * 0.04, H * 0.56, H * 0.08, H * 0.4);
    ridge(H * 0.62, H * 0.05, 0.05, '#4a4a4a', seed);
  } else {
    ridge(H * 0.52, H * 0.16, 0.032, '#b4b4b4', seed);
    ridge(H * 0.64, H * 0.13, 0.045, '#7c7c7c', seed + 2);
    ridge(H * 0.78, H * 0.1, 0.06, '#3c3c3c', seed + 4);
    if (kind === 'lake') {
      g.fillStyle = '#a8a8a8'; g.fillRect(0, H * 0.82, W, H * 0.18);
      g.fillStyle = '#e6e6e6'; g.fillRect(sunX - H * 0.05, H * 0.84, H * 0.1, H * 0.14);
    }
  }
  return g.getImageData(0, 0, W, H);
}

// Gri görüntü → katmanlı rölyef ağı (XY'de, +Z yüzeye bakar). Yükseklik katman adımına yuvarlanır.
export function reliefGeometry(img, w, h, { base = 0.8, top = 6, layers = 18, colors }) {
  const W = img.width, H = img.height;
  const pos = new Float32Array(W * H * 3);
  const col = new Float32Array(W * H * 3);
  const cs = colors.map((c) => new THREE.Color(c));
  const bands = cs.length;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i;
    const L = img.data[k * 4] / 255;
    const step = Math.round(L * layers) / layers;
    const z = base + step * (top - base);
    pos[k * 3] = (i / (W - 1) - 0.5) * w;
    pos[k * 3 + 1] = (0.5 - j / (H - 1)) * h;
    pos[k * 3 + 2] = z;
    const b = Math.min(bands - 1, Math.floor(step * bands * 0.999));
    col[k * 3] = cs[b].r; col[k * 3 + 1] = cs[b].g; col[k * 3 + 2] = cs[b].b;
  }
  const idx = [];
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.userData.relief = { base, top, colors: cs, cols: W, rows: H }; // katman bilgisi (oda sahnesi rölyefi katman katman basabilir)
  return geo;
}

export const FILAMENTS = {
  sunset: [0x1f2a3a, 0x8c3b3b, 0xd8803a, 0xf4e3c3],
  lake: [0x18303a, 0x3f6f74, 0x9fc1b5, 0xf3efe2],
  sea: [0x1d2b46, 0x2f6aa0, 0x8cc3d8, 0xf6f1e4],
};

export async function buildScene({ scene, P }) {
  const { PALETTE: K } = P;
  const put = (o, x, y, z = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.z = rz; scene.add(o); return o; };
  // Rölyefi dikey çevirir: yüzeyi −Y'ye bakar, alt kenarı z=0.
  const stand = (m, h) => { const g = new THREE.Group(); m.rotation.x = Math.PI / 2; m.position.z = h / 2; g.add(m); return g; };

  scene.add(P.room({ back: BACK, w: 7600, d: 5600, window: WIN }));
  const shaft = P.lightShaft({ w: WIN.w * 0.95, h: WIN.z1 - WIN.z0, len: 2300, opacity: 0.085 });
  shaft.position.set(WIN.x, BACK - 20, WIN.z0);
  scene.add(shaft);
  const motes = P.dust({ count: 150, box: [900, 1300, 1400] });
  motes.position.set(WIN.x + 120, BACK - 800, 450);
  scene.add(motes);
  const hotspots = [];
  let panelMat = null;
  const layered = {}; // id → katman katman büyüyecek rölyef ağı

  // ---- Pencere ışıklığı: arkadan ışık almış gibi parlak (ışıksız malzeme), iki ipe asılı ----
  {
    const img = landscape('lake', 150, 100, 3);
    const geo = reliefGeometry(img, 360, 240, { colors: FILAMENTS.lake.map((c) => new THREE.Color(c).multiplyScalar(1.18).getHex()) });
    const panel = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
    panelMat = panel.material;
    const g = stand(panel, 240);
    const frameMat = P.clay(K.ink, { rough: 0.5 });
    // İnce siyah kenar: panel x −180..180, z 0..240 aralığında.
    const rim = new THREE.Group();
    for (const [w, h, x, z] of [[372, 8, 0, -4], [372, 8, 0, 236], [8, 248, -182, -4], [8, 248, 182, -4]]) {
      const b = P.mesh(P.rbox(w, 8, h, 2), frameMat);
      b.position.set(x, 0, z);
      rim.add(b);
    }
    g.add(rim);
    for (const sx of [-1, 1]) {
      const s = P.mesh(P.cyl(0.8, 0.8, 330, 6), P.clay(0x8a8a8a, { rough: 0.6 }), { cast: false });
      s.position.set(sx * 150, 0, 240);
      g.add(s);
    }
    put(g, WIN.x, BACK - 70, 1340, 0);
    hotspots.push({ id: 'window', preset: null, object: g, anchor: [WIN.x, BACK - 70, 1620] });
  }

  // ---- Duvarda çerçeveli rölyef + altında konsol ----
  const FX = 1520;
  {
    const img = landscape('mountain', 160, 112, 7);
    const geo = reliefGeometry(img, 420, 294, { colors: FILAMENTS.sunset });
    const relief = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, envMapIntensity: 0.6 }));
    relief.castShadow = true; relief.receiveShadow = true;
    layered.frame = relief;
    const g = new THREE.Group();
    const r = stand(relief, 294);
    r.position.set(0, -8, 26);
    g.add(r);
    const fr = P.frame({ w: 480, h: 346, depth: 30, border: 26, color: K.woodDark });
    g.add(fr);
    put(g, FX, BACK - 18, 1200, 0);
    hotspots.push({ id: 'frame', preset: null, object: g });
  }
  {
    const con = new THREE.Group();
    con.add(P.mesh(P.rbox(820, 340, 30, 5), P.clay(K.woodLight, { rough: 0.7 })).translateZ(730));
    con.add(P.mesh(P.rbox(780, 300, 520, 4), P.clay(0xe6e1d6, { rough: 0.7 })).translateZ(200));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) con.add(P.mesh(P.cyl(14, 10, 200, 14), P.clay(K.woodDark, { rough: 0.7 })).translateX(sx * 360).translateY(sy * 130));
    put(con, FX, BACK - 180, 0);
  }

  // ---- Şövalede kartpostal ----
  {
    const img = landscape('sea', 120, 80, 5);
    const geo = reliefGeometry(img, 150, 100, { top: 4, colors: FILAMENTS.sea });
    const card = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, envMapIntensity: 0.6 }));
    card.castShadow = true;
    layered.card = card;
    const g = new THREE.Group();
    const easel = new THREE.Group();
    const em = P.clay(K.woodLight, { rough: 0.7 });
    for (const sx of [-1, 1]) { const l = P.mesh(P.rbox(8, 8, 190, 2), em); l.rotation.y = sx * 0.16; l.position.set(sx * 40, 0, 0); easel.add(l); }
    const back = P.mesh(P.rbox(8, 8, 180, 2), em); back.rotation.x = -0.4; back.position.set(0, 36, 0); easel.add(back);
    easel.add(P.mesh(P.rbox(170, 18, 8, 2), em).translateZ(40).translateY(-6));
    g.add(easel);
    const c = stand(card, 100);
    c.rotation.x = -0.18;
    c.position.set(0, -2, 48);
    g.add(c);
    put(g, FX + 180, BACK - 200, 760, -0.3);
    hotspots.push({ id: 'card', preset: null, object: g });
  }
  put(P.books({ count: 4, seed: 12, lean: false }), FX - 330, BACK - 190, 760, 0);
  put(P.plant({ kind: 'leafy', size: 2.4, seed: 4, pot: K.paper }), -300, 150, 0);
  put(P.mug({ color: K.terracotta }), FX - 120, BACK - 230, 760, 0.6);

  // Yakın plan canlandırması. Art arda tıklamada önceki akış öldürülür (aynı değerlerde yarışmasınlar).
  const running = {};
  function focusFx(id) {
    running[id]?.kill();
    if (id === 'window') {
      if (!panelMat) return;
      running[id] = gsap.timeline({ delay: 0.4 })
        .to(panelMat.color, { r: 1.4, g: 1.4, b: 1.4, duration: 0.9, ease: 'sine.inOut' }, 0)
        .to(shaft.material, { opacity: 0.16, duration: 0.9, ease: 'sine.inOut' }, 0)
        .to(panelMat.color, { r: 1, g: 1, b: 1, duration: 1.4, ease: 'sine.inOut' })
        .to(shaft.material, { opacity: 0.085, duration: 1.4, ease: 'sine.inOut' }, '<');
      return;
    }
    // Rölyef düzleşir, sonra 18 adımda yeniden yükselir: yazıcı katman katman basıyormuş gibi.
    const m = layered[id];
    if (!m) return;
    running[id] = gsap.timeline({ delay: 0.4 })
      .to(m.scale, { z: 0.06, duration: 0.3, ease: 'power2.in' })
      .to(m.scale, { z: 1, duration: 1.9, ease: 'steps(18)' });
  }

  return {
    shots: {
      intro: { pos: [-1500, -5000, 2400], target: [450, 200, 1250] },
      main: { pos: [1560, -2950, 1500], target: [700, 220, 1150] },
    },
    lights: { center: [950, 200, 1100], shadowSpan: 1900, key: [-550, -1600, 2600], rim: [WIN.x, BACK + 2200, 2600] },
    hotspots,
    update(t) { motes.userData.update(t); },
    onFocus(id, { reduced } = {}) { if (!reduced) focusFx(id); },
    onPoke(id, { reduced } = {}) { if (!reduced) focusFx(id); },
  };
}
