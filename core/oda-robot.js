// Robot süpürge (v8.5, 2026-11-05; kullanıcı: "odayı süpürsün: yavaşça zeminde tur atsın, dönsün, istasyonuna geri
// gelsin; eşyalara, halı püskülü dışındaki engellere ve Biggie'ye çarpmasın; yan fırça dönsün; kırmızı ışık robotun
// kendisinde"). Model oda-esya.glb 'supurge' kökü (scripts/oda-blender.py supurge_kur: orijin zeminde, önü yerel +y,
// Ø 340); istasyon OLCU.ROBOT (sağ duvarın ön köşesi; core/oda-karakter.js SABIT_ENGEL orada bir daire tutar).
// Tur: ROTA, istasyondan çıkıp istasyona dönen kırık çizgi; köşelerde yerinde döner, düz kısımda yavaş gider. Rota odanın
// açık zemininde, her noktası durağan engellerden (kitaplık, armut, masa, dolap, buzdolabı, küçük raf, kilim, çöp,
// duvarlar, sandalyenin iki duruşu, Biggie'nin bekleme yeri) robotun yarıçapı + pay kadar uzak (lab/karakter-test.js
// "Robot süpürge" denetimi rotaPayi ile ölçer). Hareketli engeller her karede: Biggie (kökü ve yürüdüğü yolun kalanı:
// sunum bağlar) ve sandalye. Önü kapalıysa durur; 3 sn'den uzun kapalı kalırsa döner, rotayı geri sarar (istasyona öbür
// yandan döner). Hareket azaltmada istasyonda durur (fırça da durur). Pişmiş zemindeki eski kırmızı hale silindi
// (scripts/oda-hale-sil.py); ışık artık robotun altında canlı bir halka (zemine eklenen saydam ışık).
import * as THREE from 'three';
import { OLCU } from './oda-olcu.js';

const { ROBOT } = OLCU;
export const ROBOT_R = ROBOT.r ?? 170;
// Rota (mm): istasyon → ön şerit (armudun önü; kilimin köşesinden duvar dibinden dolanır) → armudun sağı → oda ortası (çekilmiş sandalyenin ve kitaplık durağının
// güneyi) → masanın sağ ucu → arka duvar boyunca (balkon kapısının önü; pencere pervazları duvarda, 850 mm yukarıda) →
// buzdolabının önü ve geri → Biggie'nin bekleme yerinin (520, 760) kuzeyi → oda ortası → kilimin solu → ön şerit (kilimin
// püskülleri üstünden) → istasyon
export const ROTA = [
  [ROBOT.x, ROBOT.y], [ROBOT.x, -1580], [-1550, -1580], [-700, -1050], [-650, -50], [-300, 300], [-20, 950], [0, 1560],
  [1340, 1560], [1320, 800], [1300, 1250], [0, 1250], [0, 300], [300, -1580], [ROBOT.x, -1580], [ROBOT.x, ROBOT.y],
];
export const ROBOT_AYAR = {
  hiz: 170,          // mm/sn: düz kısımda
  ivme: 220,         // mm/sn²
  donus: 1.1,        // rad/sn: köşede yerinde dönüş
  fircaHiz: 9,       // rad/sn: yan fırça (giderken)
  ilkBekle: 6,       // sn: sayfa açıldıktan sonra istasyondan ilk çıkış
  istasyonBekle: 40, // sn: tur bitince istasyonda (şarj)
  biggiePay: 300,    // mm: Biggie'nin gövde yarıçapı (uzanırken, diz çökerken geniş)
  yolPay: 170,       // mm: Biggie'nin yürüdüğü yolun yarı genişliği
  sandalyePay: 360,  // mm: sandalyenin yıldız ayağı ve sırtı
  ileri: 120,        // mm: önünün kapalı sayılacağı mesafe (bir sonraki konum)
  geriDon: 3,        // sn: önü bu kadar kapalı kalırsa döner
};

// Rotanın her parçasının engellere en kısa uzaklığı (robotun merkezinden; test): E = [{ k: [x0, x1, y0, y1] } | { d: [x, y, r] }]
export function rotaPayi(E, rota = ROTA) {
  const kutuUzak = (p, [x0, x1, y0, y1]) => Math.hypot(Math.max(x0 - p[0], 0, p[0] - x1), Math.max(y0 - p[1], 0, p[1] - y1)) * (p[0] > x0 && p[0] < x1 && p[1] > y0 && p[1] < y1 ? -1 : 1);
  let en = { pay: Infinity, parca: -1, engel: null };
  for (let i = 0; i < rota.length - 1; i++) {
    const a = rota[i], b = rota[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(L / 20));
    for (let s = 0; s <= n; s++) {
      const p = [a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n];
      for (const e of E) {
        const u = e.k ? kutuUzak(p, e.k) : Math.hypot(p[0] - e.d[0], p[1] - e.d[1]) - e.d[2];
        if (u < en.pay) en = { pay: Math.round(u), parca: i, engel: e.ad ?? (e.k ? e.k : e.d), nokta: p.map(Math.round) };
      }
    }
  }
  return en;
}

// Altındaki kırmızı ışık: zemine düşen halka (modelin kendi halkası gövdenin altında, gözükmüyor). Saydam, eklemeli
function isikHalkasi(r) {
  const N = 256, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d'), im = g.createImageData(N, N), R = r + 90, h = N / 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = (Math.hypot(x + 0.5 - h, y + 0.5 - h) / h) * R; // mm
    // İnce parlak halka tamponun hemen dışında (gövde r, tampon r + 3), çevresinde yumuşak hale (pişmiş eski halenin profili)
    const v = 0.85 * Math.exp(-(((d - (r + 6)) / 5) ** 2)) + 0.16 * Math.exp(-(((d - (r + 6)) / 22) ** 2)) + 0.04 * Math.exp(-(((d - r) / 70) ** 2));
    const i = (y * N + x) * 4, k = Math.min(1, v) * (d < R ? 1 : 0);
    im.data[i] = 255; im.data[i + 1] = 40; im.data[i + 2] = 22; im.data[i + 3] = Math.round(255 * k);
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R), new THREE.MeshBasicMaterial({
    map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  m.position.z = 8; // kilimlerin (~5,5 mm) üstünde; gövdenin (tampon z 14) altında
  m.renderOrder = 2;
  m.name = 'supurge_hale';
  m.raycast = () => {}; // tıklanmaz
  return m;
}

// kok: sahnedeki 'supurge' grubu (yerleştirilmiş); scene: hareketli engeller için ('karakter', 'koltuk')
export function robotSurucu(kok, scene, { reduce = false } = {}) {
  const A = ROBOT_AYAR;
  // Yan fırça: üç kıl ve göbek gövdenin önünde (yerel −118, 112) bir eksen çevresinde döner (ağların orijini kökte)
  const firca = new THREE.Group();
  firca.position.set(-118, 112, 0);
  const kil = [];
  kok.traverse((o) => { if (o.isMesh && /^supurge_firca(\d*|_gobek)$/.test(o.name)) kil.push(o); });
  for (const o of kil) { firca.add(o); o.position.set(118, -112, 0); }
  kok.add(firca);
  kok.add(isikHalkasi(ROBOT_R));
  const alt = kok.getObjectByName('supurge_alt_isik');
  if (alt?.material) { alt.material = alt.material.clone(); alt.material.emissive?.setRGB(1, 0.06, 0.03); alt.material.emissiveIntensity = 3; }

  const ist = { x: ROBOT.x, y: ROBOT.y, psi: ROBOT.rz ?? 0 }; // psi: modelin rotation.z
  const b = { x: ist.x, y: ist.y, yon: ist.psi + Math.PI / 2 }; // yon: gidiş yönü (atan2; önü yerel +y = rz + π/2)
  let durum = 'istasyon', bekle = A.ilkBekle, i = 0, ileri = 1, v = 0, kapali = 0, tur = 0, biggieFn = null, sonT = null, sonEngel = null;
  const hedefNo = () => (ileri > 0 ? i + 1 : i);
  const aci = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  // Hareketli engeller: Biggie (kök + yolun kalanı) ve sandalye
  const kv = new THREE.Vector3(), kb = new THREE.Box3();
  function biggie() {
    const f = biggieFn?.();
    if (f) return f;
    const o = scene.getObjectByName('karakter');
    return o?.visible ? { x: o.position.x, y: o.position.y, yol: null } : null;
  }
  const parcaUzak = (p, a, c) => {
    const dx = c.x - a.x, dy = c.y - a.y, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
    return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
  };
  // p'de hareketli engellere kalan pay (mm; eksi: payın içinde) ve en yakın engelin adı. Önü kapalı: bir sonraki konumda
  // pay eksi ve şimdikinden küçük (uzaklaşan hareket serbest: Biggie arkasından gelince robot kaçabilir, ona dönmez)
  function payOf(p) {
    let en = Infinity, ad = null;
    const al = (u, n) => { if (u < en) { en = u; ad = n; } };
    const B = biggie();
    if (B) {
      al(Math.hypot(p.x - B.x, p.y - B.y) - (ROBOT_R + A.biggiePay), 'biggie');
      let a = { x: B.x, y: B.y };
      for (const c of B.yol ?? []) { al(parcaUzak(p, a, c) - (ROBOT_R + A.yolPay), 'biggie-yol'); a = c; }
    }
    const k = scene.getObjectByName('koltuk');
    if (k) { k.getWorldPosition(kv); al(Math.hypot(p.x - kv.x, p.y - kv.y) - (ROBOT_R + A.sandalyePay), 'sandalye'); }
    // Buzdolabının kapağı açıkken süpürdüğü alan (menteşe (1550, 1100), kapak 500 mm)
    const kp = scene.getObjectByName('buzdolabi_kapak');
    if (kp && Math.abs(kp.rotation.z) > 0.05) {
      kb.setFromObject(kp);
      al(Math.hypot(Math.max(kb.min.x - p.x, 0, p.x - kb.max.x), Math.max(kb.min.y - p.y, 0, p.y - kb.max.y)) - (ROBOT_R + 40), 'kapak');
    }
    return { pay: en, ad };
  }
  function yaz() {
    kok.position.set(b.x, b.y, 0);
    kok.rotation.z = b.yon - Math.PI / 2;
  }
  yaz();
  function update(t) {
    const dt = sonT === null ? 0 : Math.min(0.1, Math.max(0, t - sonT));
    sonT = t;
    if (reduce || !dt) return;
    if (durum === 'istasyon') {
      if ((bekle -= dt) > 0) return;
      durum = 'don'; i = 0; ileri = 1; v = 0; kapali = 0;
    }
    // don: yerinde hedef noktaya döner; yerles: istasyonda duvara döner, sonra şarj
    if (durum === 'don' || durum === 'yerles') {
      firca.rotation.z += dt * A.fircaHiz * (durum === 'don' ? 0.5 : 0.2);
      const h = ROTA[hedefNo()];
      const hy = durum === 'yerles' ? ist.psi + Math.PI / 2 : Math.atan2(h[1] - b.y, h[0] - b.x), e = aci(hy - b.yon), s = A.donus * dt;
      b.yon += Math.abs(e) <= s ? e : Math.sign(e) * s;
      yaz();
      if (Math.abs(e) <= s) {
        if (durum === 'yerles') { durum = 'istasyon'; bekle = A.istasyonBekle; tur++; i = 0; ileri = 1; b.yon = aci(b.yon); }
        else durum = 'git';
      }
      return;
    }
    const h = ROTA[hedefNo()], dx = h[0] - b.x, dy = h[1] - b.y, L = Math.hypot(dx, dy);
    // git: düz kısım (hızlanır, varırken yavaşlar); önü kapalıysa durur
    firca.rotation.z += dt * A.fircaHiz;
    const fx = Math.cos(b.yon), fy = Math.sin(b.yon);
    const p1 = payOf({ x: b.x + fx * A.ileri, y: b.y + fy * A.ileri });
    if (p1.pay < 0 && p1.pay <= payOf(b).pay) {
      sonEngel = p1.ad;
      v = 0; kapali += dt;
      if (kapali > A.geriDon) { // döner, rotayı geri sarar
        ileri = -ileri; kapali = 0;
        // bulunduğu parçanın öbür ucuna (geri yönde i parçanın başı, ileri yönde sonu)
        durum = 'don';
      }
      return;
    }
    kapali = 0;
    v = Math.min(A.hiz, v + A.ivme * dt, Math.sqrt(2 * A.ivme * Math.max(0, L)) + 10);
    const adim = Math.min(L, v * dt);
    b.x += fx * adim; b.y += fy * adim;
    yaz();
    if (L - adim < 1) { // vardı: sıradaki parçaya döner; rotanın iki ucu da istasyon
      b.x = h[0]; b.y = h[1]; v = 0;
      const son = ileri > 0 ? i + 1 >= ROTA.length - 1 : i <= 0;
      if (son) { durum = 'yerles'; b.x = ist.x; b.y = ist.y; yaz(); return; }
      i += ileri > 0 ? 1 : -1;
      durum = 'don';
    }
  }
  return {
    update,
    kok,
    // Sunum Biggie'yi bağlar: f() → { x, y, yol: [{ x, y }, ...] | null } | null
    biggieBagla(f) { biggieFn = f; },
    // Yol bulma için (Biggie): robotun şimdiki yeri ve yarıçapı
    konum: () => ({ x: b.x, y: b.y, r: ROBOT_R }),
    get durum() { return { durum, x: Math.round(b.x), y: Math.round(b.y), yon: +b.yon.toFixed(2), i, ileri, tur, kapali: +kapali.toFixed(2), engel: sonEngel, firca: +firca.rotation.z.toFixed(2) }; },
    // Test: zamanı ileri sar (sn, adım 1/30)
    ilerlet(sn) { const t0 = sonT ?? 0; for (let k = 1; k <= Math.round(sn * 30); k++) update(t0 + k / 30); },
  };
}
