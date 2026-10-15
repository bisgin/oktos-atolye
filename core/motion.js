// Sahne hareket yardımcıları: dağınık bir eşyayı kavisli bir yolla yerine "zıplatır" (toparlama animasyonları).
// Bütün pozlar nesnenin ebeveyninin yerel koordinatındadır (mm, Z yukarı). Önce parent.attach(obj), sonra hop().
import * as THREE from 'three';
import { gsap } from 'gsap';

const TAU = Math.PI * 2;
const X = new THREE.Vector3(1, 0, 0);
const tmpQ = new THREE.Quaternion();
const smooth = (x) => x * x * (3 - 2 * x);

// Poz kısaltması: pose([x, y, z], [rx, ry, rz]) → { pos, quat }
export function pose(p, r = [0, 0, 0], order = 'XYZ') {
  return { pos: new THREE.Vector3(...p), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(...r, order)) };
}

// Nesneye pozu anında uygular (hareket azaltma tercihi, başlangıç durumu).
export function setPose(obj, ps) {
  obj.position.copy(ps.pos);
  obj.quaternion.copy(ps.quat);
}

// Şu anki pozdan hedef poza zıplatma.
//   arc:    yay yüksekliği (mm). Yatay yol düşeyden önce biter (arrive), son kısımda eşya dikine düşer:
//           bölmeye, kalemliğe "yerine oturur" gibi girer.
//   spins:  uçuşta kaç tam takla (tam sayı; son duruş hedef pozla aynı kalsın diye)
//   axis:   takla ekseni (nesnenin kendi ekseni)
//   bounce: inişte sekme (mm)
export function hop(obj, to, { delay = 0, dur, arc = 70, arrive = 0.78, spins = 0, axis = X, bounce = 2.5, onLand } = {}) {
  const p0 = obj.position.clone(), q0 = obj.quaternion.clone();
  const p1 = to.pos.clone(), q1 = to.quat.clone();
  const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const d = dur ?? 0.5 + dist / 900;
  const st = { u: 0 };
  const tl = gsap.timeline({ delay });
  tl.to(st, {
    u: 1, duration: d, ease: 'none',
    onUpdate: () => {
      const u = st.u;
      const kx = smooth(Math.min(1, u / arrive));
      obj.position.x = p0.x + (p1.x - p0.x) * kx;
      obj.position.y = p0.y + (p1.y - p0.y) * kx;
      obj.position.z = p0.z + (p1.z - p0.z) * u + 4 * arc * u * (1 - u); // parabol: yerçekimi gibi
      const kr = smooth(Math.min(1, u / Math.min(0.95, arrive + 0.06)));
      obj.quaternion.slerpQuaternions(q0, q1, kr);
      if (spins) obj.quaternion.multiply(tmpQ.setFromAxisAngle(axis, spins * TAU * kr));
    },
  });
  if (bounce > 0) {
    tl.to(obj.position, { z: p1.z + bounce, duration: 0.08, ease: 'power2.out' })
      .to(obj.position, { z: p1.z, duration: 0.14, ease: 'bounce.out' });
  }
  if (onLand) tl.call(onLand);
  return tl;
}

// Yerindeki eşyanın küçük tepkisi (yakın plandayken yeniden tıklanınca): hafif zıplar, yerine oturur.
// Dinlenme yüksekliği bir kez saklanır (restZ): art arda tıklamada havadaki konumdan okunup birikmesin.
export function nudge(obj, { delay = 0, height = 5, dur = 0.14 } = {}) {
  const z0 = (obj.userData.restZ ??= obj.position.z);
  gsap.killTweensOf(obj.position);
  obj.position.z = z0;
  return gsap.timeline({ delay })
    .to(obj.position, { z: z0 + height, duration: dur, ease: 'power2.out' })
    .to(obj.position, { z: z0, duration: dur * 1.3, ease: 'bounce.out' });
}

// Dağınık eşyaları bir şablonun içine toparlar. items: [{ obj, home: pose, at?: başlama sn, ...hop seçenekleri }]
// Eşyalar önce şablon grubuna bağlanır (dünya pozu korunur), sonra sırayla zıplar. onDone: hepsi yerleşince.
// Bir kez çalışır; yeniden çağrılınca yerindeki eşyalar yalnız kıpırdar.
export function tidy(group, items, { reduced = false, start = 0.45, stagger = 0.07, onDone } = {}) {
  const st = group.userData.tidy ||= { state: 'messy' };
  if (st.state === 'done') {
    if (!reduced) items.forEach((it, i) => nudge(it.obj, { delay: i * 0.025, height: 3 + (i % 3) }));
    return null;
  }
  if (st.state === 'running') return null;
  for (const it of items) {
    it.obj.userData.restZ = it.home.pos.z; // kıpırdatma bu yüksekliğe döner
    group.attach(it.obj);
    // Artık şablonun parçası: tıklanınca ve vurgulanınca şablonla birlikte sayılır.
    it.obj.traverse((o) => { o.userData.hotspot = group.userData.hotspot ?? o.userData.hotspot; });
  }
  if (reduced) {
    for (const it of items) setPose(it.obj, it.home);
    st.state = 'done';
    onDone?.();
    return null;
  }
  st.state = 'running';
  const tl = gsap.timeline({ onComplete: () => { st.state = 'done'; onDone?.(); } });
  items.forEach((it, i) => {
    const { obj, home, at: when, ...opts } = it;
    tl.add(hop(obj, home, opts), when ?? start + i * stagger);
  });
  return tl;
}
