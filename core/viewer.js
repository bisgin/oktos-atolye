// Three.js görüntüleyici: Z yukarı, birim mm. Model düz gölgeli, isteğe bağlı kenar çizgileri.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class Viewer {
  // still: true → animasyon döngüsü yok, render() elle çağrılır (şablon küçük resimleri için).
  constructor(container, { still = false } = {}) {
    this.el = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.5, 20000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(220, -260, 200);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(150, -200, 300);
    this.scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.5));

    this.grid = new THREE.GridHelper(400, 40, 0x9aa3ad, 0xd4d9de);
    this.grid.rotation.x = Math.PI / 2;
    this.scene.add(this.grid);

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.material = new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.55, metalness: 0.0 });
    this.edgeMat = new THREE.LineBasicMaterial({ color: 0x1b1f24, transparent: true, opacity: 0.35 });
    this.showEdges = true;
    this.lastSize = null;

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    if (still) return;
    const loop = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    loop();
  }

  resize() {
    const w = this.el.clientWidth || 1;
    const h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderNow();
  }

  // Animasyon döngüsü duraklasa da (arka plandaki sekme) görüntü güncel kalsın.
  renderNow() {
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  setColor(hex) {
    this.material.color.set(hex);
  }

  // parts: [{ result (csg.scope çıktısı), color?, offset?: [x,y,z], ghost?: bool, smooth?: bool }]
  // Geometri indeksli kalır; düz gölge malzemede (flatShading) yapılır. Kenar çizgisi yalnız
  // açıkken hesaplanır (en pahalı adımdı); sonradan açılırsa toggleEdges üretir.
  show(parts, { refit = false } = {}) {
    // Geometri atılır; malzeme ATILMAZ: atılırsa gölgelendirici programı silinir ve her güncellemede
    // ~1 sn yeniden derlenir. Malzemeler renk + gölge türüne göre önbellekte yeniden kullanılır.
    for (const c of [...this.group.children]) {
      c.geometry?.dispose();
      this.group.remove(c);
    }
    const bb = new THREE.Box3();
    for (const p of parts) {
      const r = p.result;
      if (!r || r.empty) continue;
      const geo = new THREE.BufferGeometry();
      const pos = r.numProp === 3 ? r.positions : stripProps(r.positions, r.numProp);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex(new THREE.BufferAttribute(r.indices, 1));
      if (p.smooth) geo.computeVertexNormals();
      const mat = this.materialFor(p);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.ghost = !!p.ghost;
      if (p.offset) mesh.position.set(...p.offset);
      this.group.add(mesh);
      if (this.showEdges && !p.ghost) this.addEdges(mesh);
      geo.computeBoundingBox();
      bb.union(geo.boundingBox.clone().translate(mesh.position));
    }
    const size = bb.isEmpty() ? null : bb.getSize(new THREE.Vector3());
    if (size && (refit || !this.lastSize || size.distanceTo(this.lastSize) > size.length() * 0.5)) {
      this.fit(bb);
    }
    if (size) this.lastSize = size;
    this.renderNow();
  }

  materialFor(p) {
    this.mats ||= new Map();
    const key = p.ghost ? 'ghost' : `${p.smooth ? 's' : 'f'}|${p.color || ''}`;
    if (!this.mats.has(key)) {
      let m;
      if (p.ghost) m = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, roughness: 0.8, transparent: true, opacity: 0.45, flatShading: true });
      else {
        m = this.material.clone();
        m.flatShading = !p.smooth;
        if (p.color) m.color.set(p.color);
      }
      this.mats.set(key, m);
    }
    return this.mats.get(key);
  }

  addEdges(mesh) {
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), this.edgeMat);
    line.position.copy(mesh.position);
    line.userData.edge = true;
    this.group.add(line);
  }

  toggleEdges(on) {
    this.showEdges = on;
    const lines = this.group.children.filter((c) => c.userData.edge);
    if (on && !lines.length) {
      for (const m of this.group.children.filter((c) => c.isMesh && !c.userData.ghost)) this.addEdges(m);
    }
    for (const c of lines) c.visible = on;
    this.renderNow?.();
  }

  fit(bb) {
    if (!bb) {
      bb = new THREE.Box3().setFromObject(this.group);
      if (bb.isEmpty()) return;
    }
    const center = bb.getCenter(new THREE.Vector3());
    const r = bb.getSize(new THREE.Vector3()).length() / 2;
    // Üstte ölçü kutusu için pay: model biraz aşağıda ve uzakta durur.
    const dist = r / Math.sin((this.camera.fov * Math.PI) / 360) * 1.12;
    const dir = new THREE.Vector3(0.62, -0.78, 0.55).normalize();
    center.z += r * 0.08;
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(dir, dist);
    const g = Math.max(100, Math.ceil((r * 3) / 50) * 50);
    this.grid.scale.setScalar(g / 400);
    this.renderNow();
  }

  view(name) {
    const t = this.controls.target;
    const d = this.camera.position.distanceTo(t);
    const dirs = { iso: [0.62, -0.78, 0.55], top: [0, -0.001, 1], front: [0, -1, 0.001], right: [1, 0, 0.001] };
    const v = new THREE.Vector3(...dirs[name]).normalize();
    this.camera.position.copy(t).addScaledVector(v, d);
    this.renderNow();
  }

  snapshot() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }
}

function stripProps(arr, n) {
  const out = new Float32Array((arr.length / n) * 3);
  for (let i = 0, j = 0; i < arr.length; i += n, j += 3) {
    out[j] = arr[i]; out[j + 1] = arr[i + 1]; out[j + 2] = arr[i + 2];
  }
  return out;
}
