// Sahne 4, FRP MASASI (v06 yenileme; k1536–2225, ARALIK ile 210 kare uzadı). Kadro (kadro.json): E (DM; kısa, zayıf,
// gözlüklü), E2 (punk: mohawk, deri ceket), E3 (tosun, sakallı), E4 (başörtülü, gözlüklü). Soldan sağa E4, E3, E, E2 (E3,
// E'nin hemen yanında); aralar geniş, masa yassı (alçak elips): dördü tek karede rahat görünür. E perdenin ardında yüksek
// tabureye oturur (perde uzadı, E çökmüş görünmesin). Masada elle çizilmiş savaş haritası ve KATLANIR KÂĞIT figürler
// (kart, tabanı arkaya kıvrılıp dik durdurulmuş: şövalye, büyücü, canavar). Marka yok; ekranda "FRP zarı" denir.
// #14 (k1536–1671) Genel plan, sohbet: E3 bir şey anlatır (eller havada), omuz silker; espri: E4 elini ağzına kapatıp güler,
//     E2 geriye yaslanıp E3'ü gösterir, masaya vurur (kâğıt figürler sallanır), E3 E'nin omzuna iki kez vurur. E zarları
//     yumruğunda sallar (30 fps titreme), herkes öne eğilir; k1656 atar. Dikeyde kamera çiftten çifte kayar (E4+E3 → E+E2).
// #15 (k1672–1799) Kesme: 3B yakın plan (three.js; toon gölge + mürekkep konturu, harita dokusu aynı çizgi dilinde). İki tavla
//     zarı haritaya düşer, takla atar, seker, yavaşlayıp durur: hep yek. Fizik önceden hesaplı ve tohumsuz (yuvarlatılmış küp,
//     darbe tabanlı katı cisim, 1200 Hz), ekranda %85 hızla (hafif ağır çekim). Bir zar şövalyeyi devirir: kart yüzüstü kapanır,
//     kıvrık tabanı havada kalır; öbür figürler darbelerle titrer. Darbe izleri ve 'zar' işaretleri gerçek çarpma anlarından.
// #16 (k1800–2039) Kesme: E3 ve E. Hep yek: söylenirler. E3 devrilen kâğıdı alır, kâğıt elinde boynunu büker: "Keşke
//     piyonlarımız gerçek olsa…" (k1838). Kamera E'ye kayar; E: "Keşke FRP zarlarımız olsa… kendimiz tasarlayabildiğimiz…".
// #17 (k2040–2225) E elini çenesine götürür; düşünce balonunda 3B zarlar döner (d20, d12, d8, d6, d4; her biri başka tasarım).
//     E mırıldanır: "Taştan mı olsa…" (zarlar yukarıdan aşağı benekli taşa, mermere, arduvaza döner) "…reçineden mi?"
//     (yarı saydam reçine: iç kenarlar görünür, pırıltılar; renk çok düşük doygunlukta). Çözüm yok; sahne balonla biter.
// Sözleşme: kur(ctx) yalnız ctx.tl'ye İÇ (mutlak) kare zamanlı tween ekler; 3B tuvaller ctx.herKare ile her karede
// deterministik çizilir (fizik ve dönüşler kare numarasından). window'a bir şey yazılmaz. three.js yüklenemez ya da WebGL
// açılamazsa 3B çekimler düşer: yakın plan yerine 2B masada zarlar iner, balonda zarlar düz çizim kalır.
// Kişiler çekirdeğin ctx.kisi'si yerine burada kurulur: gövde (masanın altında) ve kollar (masanın üstünde) ayrı svg'de.
// kol.js omuzlar() orta gövdeyi varsaydığından omuz ve gövde kesimi yapıya (insan.js YAPI) göre burada düzeltilir.
import { kisiSVG, YAPI, BOY, GOZ_Y, MONO, PALET, yol, rng, oval } from '../insan.js';
import { kolSVG, bilekBul, elNoktasi } from '../kol.js';
import { URUN_RENK, URUN_SIRA } from './cizimler.js';

// three.js (importmap) ve eklentileri: yüklenemezse sahne 2B sürer
let THREE = null, RoundedBoxGeometry = null, LineSegments2 = null, LineSegmentsGeometry = null, LineMaterial = null;
try {
  THREE = await import('three');
  [{ RoundedBoxGeometry }, { LineSegments2 }, { LineSegmentsGeometry }, { LineMaterial }] = await Promise.all([
    import('three/addons/geometries/RoundedBoxGeometry.js'), import('three/addons/lines/LineSegments2.js'),
    import('three/addons/lines/LineSegmentsGeometry.js'), import('three/addons/lines/LineMaterial.js')]);
} catch (e) { console.warn('s4-frp: three.js yüklenemedi, 3B çekimler düşer', e); THREE = null; }

// Caveat ancak bir öğe kullanınca indirilir; balonlar yazı genişliği ölçülerek kurulur (yedek yazı tipiyle ölçülürse ~%40 geniş)
try { await document.fonts.load('600 62px Caveat', 'Keşke piyonlarımız gerçek olsa… FRP zarlarımız kendimiz tasarlayabildiğimiz Taştan mı olsa reçineden mi? If only our pawns were real we had RPG dice ones designed ourselves Stone or resin'); } catch { /* yoksa yedekle sürer */ }

const BAS = 1536, SON = 2225;
export const ARALIK = [BAS, SON];
// Çekim sınırları ve anahtar kareler
const KY = 1672;   // 3B yakın plan başlar (zarlar havada)
const KO = 1800;   // orta plan: E3 + E
const K_E3 = 1838; // "Keşke piyonlarımız…"
const K_E = 1928;  // "Keşke FRP zarlarımız…"
const K_CENE = 2040, K_BALON = 2046, K_TAS = 2104;
const M = PALET.murekkep;
const D2R = Math.PI / 180;
const EB = 116;                 // el boyu (kutu birimi; kol.js önerisi: yüz boyunun ~%75'i)
const DERI = '#46423d';         // insan.js deri ceketin mono tonu (E2'nin kolları da deri)
const SIFIR = { sap: () => 0 };
const f1 = (v) => (+v).toFixed(1);
const f3 = (v) => (+v).toFixed(3);
const TON = { kagit: '#f4f1ea', acik: '#e2ddd3', orta: '#b5b1aa', koyu: '#8d867a', harita: '#ece7dd', cizgi: '#5f5a53', izgara: '#d6d0c5' };

// El titremeli kalem (kol.js kalemKur kopyası): her çağrı kendi sabit sapmasını, kareye göre kaynamasını alır
function kalem(tohum, kaynama, genlik = 1) {
  const R = rng(tohum * 31 + 7), Rk = rng(tohum * 97 + kaynama * 1013 + 1);
  const a = Array.from({ length: 512 }, () => (R() - 0.5) * 1.6), b = Array.from({ length: 512 }, () => (Rk() - 0.5) * 1.3);
  let n = 0;
  return () => { const t = (n++ * 37) % 400; return { sap: (i, e) => (a[(t + i * 2 + e) % 512] + b[(t + i * 2 + e + 3) % 512]) * genlik }; };
}

// Düz kenar: her kenarın uçlarına r px yakın ara nokta (uzun kenara orta nokta) eklenir; Catmull-Rom kenarı şişirmez
function duz(pts, kapali = true, r = 5) {
  const n = pts.length, out = [], m = kapali ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = Math.min(0.3, r / L);
    const ara = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out.push(a, ara(u));
    if (L > 8 * r) out.push(ara(0.5));
    out.push(ara(1 - u));
  }
  if (!kapali) out.push(pts[n - 1]);
  return out;
}
const ov = (x, y, rx, ry, n = 14) => oval(x, y, rx, ry, 0, 360, n, 2);

// ---------- Gövde ölçüleri (yapıya göre): omuz eklemleri, omuz eğiminin bittiği nokta
function omuzlar(p, kalinlik) {
  const Y = YAPI[p.yapi] || YAPI.orta, ek = p.boy === 'uzun' ? 8 : 0;
  const omuzY = GOZ_Y + 4 + p.yuzBoy + ek + 40, r0 = kalinlik / 2, dx = 160 * Y.en - r0 + 2;
  const y = omuzY + 18 + r0 - Y.omuz * 0.5;
  return { sol: [200 - dx, y], sag: [200 + dx, y], ucu: (yon) => [200 + yon * 119 * Y.en, omuzY + 14 - Y.omuz * 0.5], omuzY };
}
// Gövde kesimi (kol.js govdeKes'in yapıya uyarlanmış kopyası): kol çizilen yanda pelerin silüeti göğüs hattından kesilir
function govdeKes(p, { sol, sag, id, kaynama, w = 4.2 }) {
  const Y = YAPI[p.yapi] || YAPI.orta, en = Y.en, ek = p.boy === 'uzun' ? 8 : 0, om = Y.omuz;
  const cx = 200, ceneY = GOZ_Y + 4 + p.yuzBoy, omuzY = ceneY + ek + 40, y0 = omuzY + 10, gg = 108 * en;
  const yan = (yon) => [[cx + yon * 119 * en, omuzY + 14 - om * 0.5], [cx + yon * 126 * en, omuzY + 44 - om * 0.3], [cx + yon * (gg + 8), omuzY + 86],
    [cx + yon * (gg + 1), omuzY + 124], [cx + yon * gg, omuzY + 210], [cx + yon * (gg + 4), 560], [cx + yon * (gg + 9), 680]];
  const R = yan(1), L = yan(-1);
  const d = (pts) => yol(pts, false, SIFIR).replace(/^M/, 'L');
  const kd = `M-1000 -1000 L1400 -1000 ` +
    (sag ? `L1400 ${y0} L${cx + 119 * en} ${y0} ${d(R)} L${cx + gg + 9} 900 ` : `L1400 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} L${cx - 119 * en} ${y0} L-1000 ${y0} Z` : `L-1000 900 Z`);
  const hw = p.yuzEn;
  const gd = `M${cx - hw * 0.5} ${ceneY + 10} L${cx + hw * 0.5} ${ceneY + 10} L${cx + 118 * en} ${omuzY + 14} ` +
    (sag ? `${d(R)} L${cx + gg + 9} 900 ` : `L${cx + 164 * en} ${omuzY + 56} L${cx + 180 * en} 900 `) +
    (sol ? `L${cx - gg - 9} 900 ${d(L.slice().reverse())} ` : `L${cx - 180 * en} 900 L${cx - 164 * en} ${omuzY + 56} `) + `L${cx - 118 * en} ${omuzY + 14} Z`;
  const s = kalem(p.tohum + 41, kaynama);
  const cz = (pts) => `<path d="${yol(pts, false, s())}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {
    tanim: `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${kd}"/></clipPath><clipPath id="${id}-g" clipPathUnits="userSpaceOnUse"><path d="${gd}"/></clipPath></defs>`,
    klip: `clip-path="url(#${id})"`, kontur: (sag ? cz(R) : '') + (sol ? cz(L) : ''),
  };
}
const aciDer = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R;

// ---------- Kâğıt figür çizimleri (kart birimi: u ∈ [−0,5; 0,5] sağa, v ∈ [0; 1] yukarı). 2B sahnede ve 3B dokuda aynı.
// d: dolgu tonu (TON anahtarı), k: kapalı, w: çizgi kalınlığı çarpanı. Genel fantastik figürler (tanınır karakter değil).
const FIGUR = {
  sovalye: [
    { p: [[-0.2, 0.08], [0.2, 0.08], [0.25, 0.47], [0.12, 0.56], [-0.12, 0.56], [-0.25, 0.47]], k: 1, d: 'orta' },
    { p: ov(0, 0.68, 0.13, 0.12), k: 1, d: 'acik' },
    { p: [[-0.09, 0.67], [0.09, 0.67]], w: 0.7 },
    { p: [[0.02, 0.8], [0.1, 0.89], [0.21, 0.86]], w: 0.8 },
    { p: [[0.31, 0.14], [0.33, 0.88]] }, { p: [[0.23, 0.31], [0.42, 0.33]] },
    { p: ov(-0.21, 0.35, 0.15, 0.18), k: 1, d: 'koyu' },
    { p: [[-0.21, 0.24], [-0.21, 0.46]], w: 0.6 }, { p: [[-0.3, 0.36], [-0.12, 0.36]], w: 0.6 },
  ],
  buyucu: [
    { p: [[-0.25, 0.08], [0.25, 0.08], [0.13, 0.56], [-0.13, 0.56]], k: 1, d: 'orta' },
    { p: ov(0, 0.63, 0.11, 0.1), k: 1, d: 'acik' },
    { p: [[-0.1, 0.6], [0.1, 0.6], [0, 0.38]], k: 1, d: 'kagit' },
    { p: [[-0.24, 0.7], [0.24, 0.7], [0.05, 0.98]], k: 1, d: 'koyu' },
    { p: [[-0.3, 0.1], [-0.31, 0.8]] }, { p: ov(-0.31, 0.85, 0.07, 0.07), k: 1, d: 'kagit' },
  ],
  canavar: [
    { p: [[-0.22, 0.08], [0.22, 0.08], [0.27, 0.42], [-0.27, 0.42]], k: 1, d: 'koyu' },
    { p: ov(0, 0.57, 0.21, 0.17), k: 1, d: 'orta' },
    { p: [[-0.15, 0.69], [-0.29, 0.88], [-0.05, 0.73]], k: 1, d: 'acik' },
    { p: [[0.15, 0.69], [0.29, 0.88], [0.05, 0.73]], k: 1, d: 'acik' },
    { p: ov(-0.08, 0.6, 0.03, 0.035, 8), k: 1, d: 'cizgi' }, { p: ov(0.08, 0.6, 0.03, 0.035, 8), k: 1, d: 'cizgi' },
    { p: [[-0.11, 0.51], [-0.055, 0.48], [0, 0.51], [0.055, 0.48], [0.11, 0.51]], w: 0.7 },
    { p: [[-0.25, 0.36], [-0.39, 0.6], [-0.33, 0.66]] }, { p: [[0.25, 0.36], [0.39, 0.6], [0.33, 0.66]] },
  ],
};

// ---------- 2B tavla zarı (noktalı d6): altıgen (üst yüz + iki yan yüz), her yüzde noktalar
const ALTI = [[0, -0.52], [0.46, -0.26], [0.46, 0.26], [0, 0.52], [-0.46, 0.26], [-0.46, -0.26]];
const YUZ = {
  ust: [[0, -0.52], [0.46, -0.26], [0, -0.01], [-0.46, -0.26]],
  sol: [[-0.46, -0.26], [0, -0.01], [0, 0.52], [-0.46, 0.26]],
  sag: [[0, -0.01], [0.46, -0.26], [0.46, 0.26], [0, 0.52]],
};
const PIP = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
function yuzNokta(q, u, v) {
  const s = 0.5 + 0.3 * u, t = 0.5 + 0.3 * v;
  const a = (1 - s) * (1 - t), b = s * (1 - t), c = s * t, d = (1 - s) * t;
  return [a * q[0][0] + b * q[1][0] + c * q[2][0] + d * q[3][0], a * q[0][1] + b * q[1][1] + c * q[2][1] + d * q[3][1]];
}

// ---------- Zar fiziği: yuvarlatılmış küp (8 köşe küresi, yarıçap rr) + yatay düzlem (y = 0). Kütle 1, kenar 1: küpün
// eylemsizliği yönden bağımsız (I = 1/6), dünya çerçevesinde skaler kalır. Darbe tabanlı ardışık çözüm (geri sekme yalnız ilk
// turda), Coulomb sürtünmesi, temas varken dönme ve kayma sönümü; uyuyunca durur. Tohum yok: aynı girdi, aynı yol.
// Döner: 60 fps kareler [{ p, q }], darbeler [{ f (kare), hiz, p }].
function zarSim({ p0, v0, w0, q0, g = 70, e = 0.5, mu = 0.25, rr = 0.13, dt = 1 / 1200, sure = 2.4, ic = 8 }) {
  const h = 0.5 - rr, invI = 6;
  const p = [...p0], v = [...v0], w = [...w0], q = [...q0];
  const C = [];
  for (const a of [-h, h]) for (const b of [-h, h]) for (const c of [-h, h]) C.push([a, b, c]);
  const don = (q, x) => {
    const [qx, qy, qz, qw] = q, [x0, y0, z0] = x;
    const ix = qw * x0 + qy * z0 - qz * y0, iy = qw * y0 + qz * x0 - qx * z0, iz = qw * z0 + qx * y0 - qy * x0, iw = -qx * x0 - qy * y0 - qz * z0;
    return [ix * qw - iw * qx - iy * qz + iz * qy, iy * qw - iw * qy - iz * qx + ix * qz, iz * qw - iw * qz - ix * qy + iy * qx];
  };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const kareler = [], darbeler = [];
  const adim = Math.round(1 / 60 / dt), N = Math.round(sure * 60);
  let uyku = 0, uyudu = false;
  for (let f = 0; f < N; f++) {
    kareler.push({ p: [...p], q: [...q] });
    if (uyudu) continue;
    for (let s = 0; s < adim; s++) {
      v[1] -= g * dt;
      for (let i = 0; i < 3; i++) p[i] += v[i] * dt;
      const [qx, qy, qz, qw] = q, [wx, wy, wz] = w;
      q[0] += 0.5 * dt * (wx * qw + wy * qz - wz * qy);
      q[1] += 0.5 * dt * (wy * qw + wz * qx - wx * qz);
      q[2] += 0.5 * dt * (wz * qw + wx * qy - wy * qx);
      q[3] += 0.5 * dt * (-wx * qx - wy * qy - wz * qz);
      const ql = Math.hypot(...q); for (let i = 0; i < 4; i++) q[i] /= ql;
      const tem = [];
      for (const c of C) { const r = don(q, c); const y = p[1] + r[1] - rr; if (y < 0) tem.push({ r: [r[0], r[1] - rr, r[2]], d: -y }); }
      for (let it = 0; it < ic; it++) {
        for (const t of tem) {
          const r = t.r, vn = v[1] + w[2] * r[0] - w[0] * r[2];
          if (vn >= 0) continue;
          const rn = crs(r, [0, 1, 0]), kn = 1 + invI * (rn[0] ** 2 + rn[1] ** 2 + rn[2] ** 2);
          const ee = it === 0 && vn < -1.5 ? e : 0;
          if (it === 0 && vn < -4) darbeler.push({ f: f + s / adim, hiz: -vn, p: [p[0] + r[0], 0, p[2] + r[2]] });
          const jn = -(1 + ee) * vn / kn;
          v[1] += jn;
          const tq = crs(r, [0, jn, 0]); for (let i = 0; i < 3; i++) w[i] += invI * tq[i];
          const vx = v[0] + w[1] * r[2] - w[2] * r[1], vz = v[2] + w[0] * r[1] - w[1] * r[0], vt = Math.hypot(vx, vz);
          if (vt > 1e-7) {
            const tt = [vx / vt, 0, vz / vt], rt = crs(r, tt), kt = 1 + invI * (rt[0] ** 2 + rt[1] ** 2 + rt[2] ** 2);
            const jt = Math.max(-mu * jn, -vt / kt);
            v[0] += tt[0] * jt; v[2] += tt[2] * jt;
            const tq2 = crs(r, [tt[0] * jt, 0, tt[2] * jt]); for (let i = 0; i < 3; i++) w[i] += invI * tq2[i];
          }
        }
      }
      if (tem.length) {
        const d = Math.max(...tem.map((t) => t.d)); if (d > 0.002) p[1] += (d - 0.002) * 0.6;
        const sn = 1 - 2.2 * dt; for (let i = 0; i < 3; i++) w[i] *= sn; v[0] *= 1 - 0.5 * dt; v[2] *= 1 - 0.5 * dt;
      }
      if (tem.length >= 3 && Math.hypot(...v) < 0.12 && Math.hypot(...w) < 0.35) uyku += dt; else uyku = 0;
      if (uyku > 0.12) { uyudu = true; break; }
    }
  }
  const tek = [];
  for (const d of darbeler) if (!tek.length || d.f - tek[tek.length - 1].f > 4) tek.push(d); else tek[tek.length - 1].hiz = Math.max(tek[tek.length - 1].hiz, d.hiz);
  return { kareler, darbeler: tek };
}
const qEuler = (x, y, z) => {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2), s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3];
};
// Atışlar (deneme ile seçildi: ilk değme ~k15, ~70 kare yuvarlanma, düz yüzde durur). Son konum (x, z) sahneye taşınır.
const ATISLAR = [
  { p0: [-1.8, 3.4, -11], v0: [1.0, -2, 13], w0: [12, 3, -5], e0: [0.4, 0.8, 0.2], hedef: [-1.35, 0.25] },
  { p0: [1.6, 3.8, -11.6], v0: [-0.7, -1.5, 13.5], w0: [-9, -6, 10], e0: [1.1, 0.3, 0.9], hedef: [1.35, -0.55] },
];

export function kur(ctx) {
  const { k, E, tl, gsap, el, cizgi, W, H, DIKEY, VURGU, BALON, KAGIT, adim } = ctx;
  const ka = (n) => k(adim(n)); // 12 fps poz ızgarası
  ctx.vurus(14, 'Sohbet, E zarları atar', BAS, KY - 1);
  ctx.vurus(15, 'Yakın plan: tavla zarları (3B)', KY, KO - 1);
  ctx.vurus(16, '"Keşke piyonlarımız…", "Keşke FRP zarlarımız…"', KO, K_CENE - 1);
  ctx.vurus(17, 'Düşünce: dönen zarlar, taş mı reçine mi', K_CENE, SON);

  // ---------- Katmanlar: oda < sahne (kişiler, masa, kollar, perde, zarlar) < balonlar < 3B yakın plan < 3B izleri
  const L0 = ctx.katman('s4-frp-oda', 9), L = ctx.katman('s4-frp', 10), LB = ctx.katman('s4-frp-balon', 11);
  const L3 = ctx.katman('s4-frp-3b', 12), L3s = ctx.katman('s4-frp-3b-iz', 13);
  for (const K of [L0, L, LB, L3, L3s]) {
    gsap.set(K.div, { autoAlpha: 0 });
    tl.set(K.div, { autoAlpha: 0 }, 0);
  }
  const sahnede = () => { const t = tl.time(); return t >= k(BAS) - 0.02 && t < k(SON + 1); };

  // ---------- Yerleşim (dünya). Masa: yassı oval üst yüz; kişiler uzak kenarın arkasında, kenar göğüslerini keser.
  const MASA = { c: [960, 905], r: [930, 150] };
  const kenarY = (x) => MASA.c[1] - MASA.r[1] * Math.sqrt(Math.max(0, 1 - ((x - MASA.c[0]) / MASA.r[0]) ** 2));
  const KESIT = 460; // masa uzak kenarı orta boylu kişinin kutusunda bu yükseklikten geçer (göğüs ortası)
  // yuk: oturma yüksekliği (dünya px): E perdenin ardında tabureye oturur
  const YER = { E4: { x: 300, s: 1.08 }, E3: { x: 745, s: 1.08 }, E: { x: 1185, s: 1.08, yuk: 64 }, E2: { x: 1625, s: 1.06 } };

  // ---------- Gruplar (L): gövdeler < masa < kollar < perde < figürler, zarlar < efekt
  const gGovde = el(L.svg, 'g'), gMasa = el(L.svg, 'g'), gKol = el(L.svg, 'g'), gPerde = el(L.svg, 'g');
  const gFigur = el(L.svg, 'g'), gZar = el(L.svg, 'g'), gEfekt = el(L.svg, 'g');
  const oyuncular = [];
  function oyuncu(ad, { kalinlik = 64, giysi = null, manset = 'duz', kolBoyu = 'uzun', ozel = null }) {
    const p = ctx.kisiParam(ad), { x, s, yuk = 0 } = YER[ad];
    const kY = kenarY(x);
    const y0 = kY - KESIT * s + ctx.boyKaymasi(p) * s - yuk, x0 = x - BOY.en * s / 2;
    const gB = el(gGovde, 'g'), gK = el(gKol, 'g');
    const yap = (g) => el(g, 'svg', { viewBox: `0 0 ${BOY.en} ${BOY.boy}`, width: BOY.en * s, height: BOY.boy * s, x: x0, y: y0, overflow: 'visible' });
    const sB = yap(gB), sK = yap(gK);
    const o = omuzlar(p, kalinlik);
    const id = `s4-${ad}`;
    const h = {
      ad, p, s, x, x0, y0, ifade: 'notr', bakis: [0, 0], kol: { sol: 'masa', sag: 'masa' }, titre: [0, 0], o, kalinlik,
      dunya: ([u, v]) => [x0 + u * s, y0 + v * s],
      kutu: ([X, Y]) => [(X - x0) / s, (Y - y0) / s],
      kenar: (kY - y0) / s,   // masa uzak kenarının bu kişinin kutusundaki yüksekliği
      araya: '',               // tutulan nesne (kol.js araya: parmakların arasında)
    };
    let son = 0;
    h.ciz = (i) => {
      if (i != null) { son = Math.max(0, i); if (!sahnede()) return; }
      const ortak = { giysi: giysi || MONO.giysi[p.giysi], ten: MONO.ten[p.ten], kalinlik, kaynama: son, manset, kolBoyu, golge: { klip: `url(#${id}-g)` } };
      const kol = (yon) => {
        const ad2 = h.kol[yon < 0 ? 'sol' : 'sag'];
        if (!ad2) return '';
        const P = (ozel && ozel(h, yon, ad2, son)) || POZ[ad2]?.(h, yon);
        if (!P) return '';
        const taraf = yon < 0 ? 'sol' : 'sag', omuz = o[taraf];
        return kolSVG({ ...ortak, omuz, omuzUcu: o.ucu(yon), taraf, tohum: p.tohum % 50 + (yon < 0 ? 1 : 2), elBoy: EB, ...P });
      };
      const sol = kol(-1), sag = kol(1);
      const G = govdeKes(p, { sol: !!sol, sag: !!sag, id, kaynama: son });
      sB.innerHTML = G.tanim + `<g ${G.klip}>${kisiSVG(p, { kaynama: son, ifade: h.ifade, bakis: h.bakis, mono: true })}</g>` + G.kontur;
      sK.innerHTML = sol + sag;
    };
    h.poz = ({ ifade, bakis, kol, titre } = {}) => {
      if (ifade) h.ifade = ifade; if (bakis) h.bakis = bakis; if (kol) Object.assign(h.kol, kol); if (titre) h.titre = titre;
      h.ciz();
    };
    // Eğilme ve doğrulma: masadaki temas noktası çevresinde (gövde + kollar birlikte); zip: gülme sarsıntısı (dy'ye eklenir)
    h.d = { dx: 0, dy: 0, aci: 0, s: 1, px: x, py: kY, zip: 0 };
    h.uygula = () => {
      const d = h.d;
      const t = `translate(${f1(d.dx)} ${f1(d.dy + d.zip)}) rotate(${f3(d.aci)} ${f1(d.px)} ${f1(d.py)}) translate(${f1(d.px)} ${f1(d.py)}) scale(${f3(d.s)}) translate(${f1(-d.px)} ${f1(-d.py)})`;
      gB.setAttribute('transform', t); gK.setAttribute('transform', t);
    };
    // Duruş tween'i (12 fps adımlı ya da verilen eğri): İÇ kare zamanlı
    h.dur = (n0, sure, hedef, ease = null) => tl.to(h.d, { ...hedef, duration: k(sure), ease: ease || `steps(${Math.max(1, Math.round(sure / 5))})`, onUpdate: h.uygula }, k(n0));
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    oyuncular.push(h);
    return h;
  }

  // ---------- Kol pozları (kutu birimi). yon −1: ekranın solu (kişinin sağ eli), +1: sağı (sol eli). S: omuz eklemi;
  // kn: masa kenarı. Başparmak kuralı (kişi izleyiciye dönük; kol.js'te basparmak +1: başparmak, parmak yönünün saat
  // yönü yanında): izleyici AVCU görüyorsa basparmak −yon, EL SIRTINI görüyorsa +yon. Yani avucu izleyiciye dönük kalkık
  // elde başparmak içe (yüze), sırtı dönük kalkık elde dışa; masaya düz basan elde (sırt görünür) başparmaklar içe,
  // birbirine bakar. kol.js yumruk, işaret ve çene pozları avuç yanından çizilir (başparmak önden geçer): −yon.
  const S = (h, yon) => h.o[yon < 0 ? 'sol' : 'sag'];
  const masaEl = (h, yon, dirsek, hedef, kisalma = 0.74) => {
    const elAci = aciDer(dirsek, hedef), basparmak = yon; // avuç masada, el sırtı görünür
    const bilek = bilekBul({ el: 'dayanma', hedef, elAci, elBoy: EB, basparmak, kisalma, ad: 'avuc' });
    return { dirsek, bilek, el: 'dayanma', elAci, basparmak, kisalma };
  };
  const POZ = {
    // ön kol masada, el düz; iki el yan yana, başparmaklar ortada buluşur (üst üste binmez)
    masa: (h, yon) => { const [sx] = S(h, yon), kn = h.kenar; return masaEl(h, yon, [sx + yon * 14, kn + 44], [200 + yon * 44, kn + 114]); },
    // masaya vurmuş el (biraz dışarıda)
    vur: (h, yon) => { const [sx] = S(h, yon), kn = h.kenar; return masaEl(h, yon, [sx + yon * 34, kn + 36], [200 + yon * 70, kn + 100], 0.8); },
    // vurmaya kalkmış el (avuç aşağı, masanın üstünde): bilekten öne (izleyiciye) bükülür, el sırtı ön kolun önünde görünür
    vurHazir: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 44, sy + 150], bilek: [sx + yon * 40, sy + 30], el: 'dayanma', elAci: yon < 0 ? 64 : 116, basparmak: yon, kisalma: 0.85, elOnde: true }; },
    // anlatırken kalkan el (avuç izleyiciye, parmaklar yukarı)
    anlat: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 30, h.kenar + 6], bilek: [sx - yon * 4, sy - 60], el: 'acik', yuz: 'avuc', elAci: -90 + yon * 12, basparmak: -yon }; },
    anlat2: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 70, h.kenar - 40], bilek: [sx + yon * 84, sy - 104], el: 'acik', yuz: 'avuc', elAci: -90 + yon * 30, basparmak: -yon }; },
    // omuz silkme: avuçlar yukarı, eller iki yanda
    silk: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 40, sy + 140], bilek: [sx + yon * 128, sy + 78], el: 'acik', yuz: 'avuc', elAci: yon > 0 ? -28 : -152, basparmak: -yon, kisalma: 0.86 }; },
    // dışarı doğru gösterme (işaret parmağı)
    isaret: (h, yon) => { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 80, sy + 104], bilek: [sx + yon * 172, sy + 34], el: 'isaret', elAci: yon > 0 ? -12 : 192, basparmak: -yon }; },
    // gülerken eli ağzında (el sırtı izleyiciye, parmaklar içeri)
    agiz: (h, yon) => {
      const [sx] = S(h, yon), elAci = yon < 0 ? -4 : -176, basparmak = yon;
      const bilek = bilekBul({ el: 'acik', hedef: [200 + yon * 4, GOZ_Y + 14 + h.p.yuzBoy * 0.56], elAci, elBoy: EB, basparmak, ad: 'avuc' });
      return { dirsek: [sx + yon * 24, h.kenar + 4], bilek, el: 'acik', yuz: 'sirt', elAci, basparmak };
    },
    // eli çenede (parmak sırtları çeneyi taşır, dirsek masada)
    // (avuç yanı izleyiciye: başparmak içte, çene hattında; yumruğun ucu çenenin altına biraz biner, boyunda kalmaz)
    cene: (h, yon) => {
      const [sx] = S(h, yon), elAci = yon > 0 ? -116 : -64, basparmak = -yon;
      const bilek = bilekBul({ el: 'cene', hedef: [200 - yon * 2, GOZ_Y + 4 + h.p.yuzBoy - 6], elAci, elBoy: EB, basparmak, ad: 'cene' });
      return { dirsek: [sx + yon * 26, h.kenar + 10], bilek, el: 'cene', elAci, basparmak };
    },
  };

  // ---------- E3'ün elindeki kâğıt şövalye (kol.js araya: parmakların arasında, kutu birimi). Taban 'tutma' pozunun tut
  // noktasında, kart yukarı uzanır; bukum 0 → dik, 1 → ~95° yana yığılmış (kâğıt zayıf, boynunu büker).
  const kart = { b: -1 };
  // kart yüzün yanında, çene ile göz hizası arasında (okunsun diye masadaki figürden biraz büyük)
  const TUT = { bilek: (h) => { const [sx, sy] = S(h, 1); return [sx - 30, sy - 22]; }, dirsek: (h) => { const [sx, sy] = S(h, 1); return [sx + 52, sy + 118]; }, elAci: -64 };
  const kartElde = (h, bukum, kaynama) => {
    const [bx, by] = elNoktasi({ el: 'tutma', bilek: TUT.bilek(h), elAci: TUT.elAci, elBoy: EB, basparmak: 1, ad: 'tut' });
    const Hc = 108, ww = Hc * 0.62, th = bukum * 1.65;
    const C = (v) => {
      if (th < 1e-3) return [[bx, by - Hc * v], [0, -1]];
      const R = Hc / th, a = th * v;
      return [[bx + R * (1 - Math.cos(a)), by - R * Math.sin(a)], [Math.sin(a), -Math.cos(a)]];
    };
    // yana yığılan kart izleyiciye yan döner: en 0,7'ye kısalır
    const nk = ([u, v]) => { const [p, tg] = C(v), n = [-tg[1], tg[0]]; return [p[0] + n[0] * u * ww * 0.7, p[1] + n[1] * u * ww * 0.7]; };
    const s = kalem(777, kaynama, 0.6);
    const kenar = [];
    for (let i = 0; i <= 8; i++) kenar.push(nk([-0.5, i / 8]));
    for (let i = 8; i >= 0; i--) kenar.push(nk([0.5, i / 8]));
    const yolS = (pts, kapali, dolgu, w) => { const d = yol(pts, kapali, s()); return (dolgu ? `<path d="${d}" fill="${dolgu}" transform="translate(1.5 1.5)"/>` : '') + `<path d="${d}" fill="none" stroke="${M}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; };
    let str = yolS(kenar, true, TON.kagit, 3.2);
    for (const f of FIGUR.sovalye) str += yolS(f.p.map(nk), !!f.k, f.d ? (f.d === 'cizgi' ? TON.cizgi : TON[f.d]) : null, 2.4 * (f.w || 1));
    return str;
  };

  // ---------- Kişiler
  const E4 = oyuncu('E4', { kalinlik: 56, manset: 'gomlek' });
  const E3 = oyuncu('E3', {
    kalinlik: 74, kolBoyu: 'sivali',
    ozel: (h, yon, ad, kaynama) => {
      const [sx, sy] = S(h, yon);
      // E'nin omzuna vurma: el E'nin sol omuz başında (E'nin kutusundan E3'ün kutusuna). Sol el, avuç omuzda: el sırtı
      // görünür, başparmak omzun önüne (aşağı) düşer (basparmak +yon)
      if (ad === 'omuz' || ad === 'omuzKalk') {
        const hedef = h.kutu(EE.dunya(EE.o.ucu(-1)));
        const kalk = ad === 'omuzKalk' ? -26 : 0, elAci = 64;
        const bilek = bilekBul({ el: 'acik', hedef: [hedef[0] + 6, hedef[1] + 10 + kalk], elAci, elBoy: EB, basparmak: yon, ad: 'avuc' });
        return { dirsek: [sx + 18, sy + 132], bilek, el: 'acik', yuz: 'sirt', elAci, basparmak: yon };
      }
      // masadaki devrik kâğıda uzanma / tutup kaldırma (kâğıt parmakların arasında: h.araya). Tutma pozu el sırtından
      // görünür (parmaklar kâğıdın önünden sarar, başparmak arkada): basparmak +yon. Uzanırken dirsek yüksekte: kol
      // omuzdan kâğıda iner (alçak dirsekte kısalan ön kolun sıvalı yeni ele biniyordu)
      if (ad === 'uzan') {
        const hedef = h.kutu(DEVRIK.tut), elAci = 70;
        const bilek = bilekBul({ el: 'tutma', hedef, elAci, elBoy: EB, basparmak: yon, ad: 'tut' });
        return { dirsek: [sx + 44, sy + 96], bilek, el: 'tutma', elAci, basparmak: yon };
      }
      if (ad === 'tut') return { dirsek: TUT.dirsek(h), bilek: TUT.bilek(h), el: 'tutma', elAci: TUT.elAci, basparmak: yon, araya: kart.b < 0 ? '' : kartElde(h, kart.b, kaynama) };
      return null;
    },
  });
  // E'nin kolları perdenin ardında (çizilmez); atış ve jestler sol kolla (yatayda E3'ün yanı)
  const ATIS = { salla: [[66, 215], [34, 362], -96], kaldir: [[60, 186], [28, 334], -80], at: [[104, 236], [40, 372], 100], at2: [[104, 258], [46, 380], 108] };
  const EE = oyuncu('E', {
    kalinlik: 56, manset: 'ribana',
    ozel: (h, yon, ad) => {
      const [tx, ty] = h.titre;
      if (ad === 'salla' || ad === 'kaldir') {
        const [[bx, by], d, a] = ATIS[ad];
        return { dirsek: d, bilek: [bx + (ad === 'salla' ? tx : 0), by + (ad === 'salla' ? ty : 0)], el: 'yumruk', elAci: a, elBoy: EB * 0.95, basparmak: -yon };
      }
      if (ad === 'at' || ad === 'at2') { const [bilek, dirsek, elAci] = ATIS[ad]; return { dirsek, bilek, el: 'acik', elAci, basparmak: yon, yuz: 'sirt' }; }
      // konuşurken avuç yukarı, zarları gösterir (el perdenin üstünde)
      // konuşurken açık avuç yana ve yukarı ("keşke…"); el perdenin üstünde
      if (ad === 'goster') { const [sx, sy] = S(h, yon); return { dirsek: [sx + yon * 40, h.kenar - 20], bilek: [sx + yon * 66, sy - 30], el: 'acik', yuz: 'avuc', elAci: yon < 0 ? -128 : -52, basparmak: -yon, kisalma: 0.9 }; }
      return null;
    },
  });
  const E2 = oyuncu('E2', { kalinlik: 64, giysi: DERI });
  EE.kol = { sol: null, sag: null };

  // ---------- Oda (L0): duvar saati ve raf (yalnız genel planda görünür; balonlara değmez)
  {
    const ust = el(L0.svg, 'g');
    const kutuN = (x0, y0, x1, y1) => duz([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true, 4);
    const SA = { c: [150, 130], r: 46 }, [sx, sy] = SA.c;
    cizgi(ust, oval(sx, sy, SA.r, SA.r, 0, 360, 22, 2), { kapali: true, dolgu: '#e6e1d8', kalinlik: 4.5, tohum: 501 });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, r0 = SA.r * 0.72, r1 = SA.r * 0.86;
      cizgi(ust, [[sx + r0 * Math.cos(a), sy + r0 * Math.sin(a)], [sx + r1 * Math.cos(a), sy + r1 * Math.sin(a)]], { kalinlik: 3, tohum: 502 + i });
    }
    cizgi(ust, [[sx, sy], [sx + SA.r * 0.32, sy - SA.r * 0.3]], { kalinlik: 4.5, tohum: 507 });
    const yelkovan = el(ust, 'g');
    cizgi(yelkovan, [[sx, sy], [sx, sy - SA.r * 0.7]], { kalinlik: 3.4, tohum: 508 });
    tl.fromTo(yelkovan, { rotation: -20, svgOrigin: `${sx} ${sy}` }, { rotation: 50, svgOrigin: `${sx} ${sy}`, duration: k(SON - BAS), ease: 'none', immediateRender: false }, k(BAS));
    const [rx0, ry0] = [1660, 200];
    cizgi(ust, kutuN(rx0, ry0, rx0 + 240, ry0 + 14), { kapali: true, dolgu: MONO.giysi[4], kalinlik: 4, tohum: 510 });
    [[0, 70, 22, 2], [24, 84, 18, 5], [44, 62, 26, 1], [72, 76, 20, 3]].forEach(([dx, hh, ww, g], i) =>
      cizgi(ust, kutuN(rx0 + 12 + dx, ry0 - hh, rx0 + 12 + dx + ww, ry0), { kapali: true, dolgu: MONO.giysi[g], kalinlik: 3.4, tohum: 511 + i }));
    cizgi(ust, kutuN(rx0 + 128, ry0 - 46, rx0 + 228, ry0), { kapali: true, dolgu: MONO.giysi[6], kalinlik: 3.6, tohum: 520 });
  }

  // ---------- Masa (gMasa): üst yüz, ön kalınlık, ayaklar (dikey kadrajda görünür), harita
  const gTabla = el(gMasa, 'g');
  {
    const [cx, cy] = MASA.c, [rx, ry] = MASA.r;
    for (const [yon, i] of [[-1, 0], [1, 1]]) {
      const x = cx + yon * rx * 0.58, y = cy + ry * 0.8 + 30;
      cizgi(gTabla, duz([[x - 26, y - 10], [x + 26, y - 10], [x + 20, y + 620], [x - 20, y + 620]], true, 5), { kapali: true, dolgu: '#8d867a', kalinlik: 5, tohum: 535 + i });
    }
    const alt = oval(cx, cy, rx, ry, 0, 180, 26, 2.1).map(([x, y]) => [x, y + 36]);
    cizgi(gTabla, [...oval(cx, cy, rx, ry, 0, 180, 26, 2.1), ...alt.reverse()], { kapali: true, dolgu: '#a59e91', kalinlik: 5, tohum: 530 });
    cizgi(gTabla, oval(cx, cy, rx, ry, 0, 360, 52, 2.1), { kapali: true, dolgu: '#cfc9bd', kalinlik: 5, tohum: 531 });
  }
  // Harita: perspektif kâğıt; (u, v) ∈ [0, 1] çift doğrusal (yassı masada ince bir şerit)
  const HQ = [[540, 788], [1370, 784], [1416, 884], [494, 888]];
  const hp = (u, v) => {
    const a = (1 - u) * (1 - v), b = u * (1 - v), c = u * v, d = (1 - u) * v;
    return [a * HQ[0][0] + b * HQ[1][0] + c * HQ[2][0] + d * HQ[3][0], a * HQ[0][1] + b * HQ[1][1] + c * HQ[2][1] + d * HQ[3][1]];
  };
  {
    const kenar = [];
    for (let i = 0; i < 10; i++) kenar.push(hp(i / 10, 0));
    for (let i = 0; i < 3; i++) kenar.push(hp(1, i / 3));
    for (let i = 0; i < 10; i++) kenar.push(hp(1 - i / 10, 1));
    for (let i = 0; i < 3; i++) kenar.push(hp(0, 1 - i / 3));
    cizgi(gTabla, kenar, { kapali: true, dolgu: TON.harita, kalinlik: 4, tohum: 540 });
    const izg = { kalinlik: 2, renk: TON.izgara, tohum: 541, genlik: 0.6 };
    for (let i = 1; i < 12; i++) cizgi(gTabla, [hp(i / 12, 0.04), hp(i / 12, 0.96)], { ...izg, tohum: 541 + i });
    for (const v of [0.34, 0.67]) cizgi(gTabla, [hp(0.02, v), hp(0.98, v)], { ...izg, tohum: 560 + v * 10 });
    const ince = { kalinlik: 2.8, renk: TON.cizgi, tohum: 570, genlik: 0.8 };
    cizgi(gTabla, [hp(0.06, 0.3), hp(0.15, 0.2), hp(0.24, 0.32), hp(0.21, 0.66), hp(0.11, 0.72), hp(0.05, 0.52)], { ...ince, kapali: true, dolgu: '#d6d1c7', tohum: 571 });
    for (const [u, v, i] of [[0.47, 0.42, 0], [0.53, 0.3, 1], [0.59, 0.44, 2]]) cizgi(gTabla, [hp(u - 0.04, v + 0.16), hp(u, v - 0.1), hp(u + 0.04, v + 0.16)], { ...ince, tohum: 572 + i });
    for (const [u, v, i] of [[0.3, 0.78, 0], [0.34, 0.86, 1], [0.27, 0.88, 2]]) cizgi(gTabla, oval(...hp(u, v), 8, 4, 0, 360, 8), { ...ince, kapali: true, tohum: 575 + i });
    const yolG = el(gTabla, 'g', { 'stroke-dasharray': '10 9' });
    cizgi(yolG, [hp(0.03, 0.9), hp(0.25, 0.86), hp(0.44, 0.62), hp(0.7, 0.58), hp(0.9, 0.32)], { ...ince, tohum: 578 });
    cizgi(gTabla, [hp(0.88, 0.14), hp(0.94, 0.36)], { ...ince, kalinlik: 3.4, tohum: 579 });
    cizgi(gTabla, [hp(0.94, 0.14), hp(0.88, 0.36)], { ...ince, kalinlik: 3.4, tohum: 580 });
  }

  // ---------- Kâğıt figürler (gFigur): kart + arkaya kıvrık taban (yandan görünür), alt gölge. dn: kartın dönüklüğü
  // (−1…1; taban kanadı dönük yanda görünür). Sallanma: grup tabanın ortası çevresinde döner (12 fps).
  const kartNokta = (BL, BR, TR, TL) => ([u, v]) => {
    const s = u + 0.5, a = (1 - s) * (1 - v), b = s * (1 - v), c = s * v, d = (1 - s) * v;
    return [a * BL[0] + b * BR[0] + c * TR[0] + d * TL[0], a * BL[1] + b * BR[1] + c * TR[1] + d * TL[1]];
  };
  const figurCiz = (ust, ad, kn, tohum, w = 3) => FIGUR[ad].map((f, i) => cizgi(ust, f.p.map(kn), {
    kapali: !!f.k, dolgu: f.d ? (f.d === 'cizgi' ? TON.cizgi : TON[f.d]) : null, kalinlik: w * (f.w || 1), tohum: tohum + i, genlik: 0.7, kay: [1.5, 1.5],
  }));
  function kagitFigur(ad, { taban: [x, y], boy, dn = 0.3, tohum }) {
    const g = el(gFigur, 'g'), ww = boy * 0.64, c = Math.cos(dn * 0.9), sn = Math.sin(dn * 0.9);
    const BL = [x - ww / 2 * c, y + ww / 2 * sn * 0.2], BR = [x + ww / 2 * c, y - ww / 2 * sn * 0.2];
    const TL = [BL[0], BL[1] - boy], TR = [BR[0], BR[1] - boy];
    const D = [sn * boy * 0.5, -boy * 0.13];   // arkaya kıvrık taban kanadı: arkaya (yukarı) ve dönük yana
    el(g, 'ellipse', { cx: x + D[0] * 0.4 + 3, cy: y - 2, rx: ww * 0.62, ry: boy * 0.09, fill: '#000', opacity: 0.09 });
    cizgi(g, duz([BL, BR, [BR[0] + D[0], BR[1] + D[1]], [BL[0] + D[0], BL[1] + D[1]]], true, 3), { kapali: true, dolgu: '#ddd7cc', kalinlik: 3, tohum, kay: [1.5, 1.5] });
    cizgi(g, duz([BL, BR, TR, TL], true, 3), { kapali: true, dolgu: TON.kagit, kalinlik: 3.4, tohum: tohum + 1, kay: [1.5, 1.5] });
    const kn = kartNokta(BL, BR, TR, TL);
    cizgi(g, duz([kn([-0.42, 0.04]), kn([0.42, 0.04]), kn([0.42, 0.96]), kn([-0.42, 0.96])], true, 2), { kapali: true, kalinlik: 1.6, renk: TON.koyu, tohum: tohum + 2, genlik: 0.5 });
    figurCiz(g, ad, kn, tohum + 3, Math.max(1.6, boy / 26));
    gsap.set(g, { svgOrigin: `${x} ${y}` });
    return { g, x, y };
  }
  const FB = 86; // figür boyu (dünya px; okunsun diye gerçekten biraz büyük)
  // E3'ün elleri ile perde arasında ve perdenin önünde (kolların üstüne binmesinler)
  const FIGURLER = {
    buyucu: kagitFigur('buyucu', { taban: [884, 858], boy: FB, dn: 0.4, tohum: 590 }),
    sovalye: kagitFigur('sovalye', { taban: [1046, 846], boy: FB, dn: 0.2, tohum: 610 }),
    canavar: kagitFigur('canavar', { taban: [1316, 856], boy: FB * 1.04, dn: -0.35, tohum: 630 }),
  };
  // Devrik şövalye (yakın plandan sonra): yüzüstü kart (boş sırtı) + havaya kalkmış taban kanadı
  const DEVRIK = (() => {
    const g = el(gFigur, 'g'), [x, y] = [972, 872], ww = FB * 0.64;
    const BL = [x - ww / 2, y - 4], BR = [x + ww / 2, y + 3], dz = FB * 0.3;
    el(g, 'ellipse', { cx: x + 3, cy: y + dz * 0.5 + 2, rx: ww * 0.66, ry: dz * 0.62, fill: '#000', opacity: 0.08 });
    cizgi(g, duz([BL, BR, [BR[0] + 6, BR[1] + dz], [BL[0] + 4, BL[1] + dz]], true, 3), { kapali: true, dolgu: '#e8e3da', kalinlik: 3.2, tohum: 650, kay: [1.5, 1.5] });
    cizgi(g, duz([BL, BR, [BR[0] - 2, BR[1] - FB * 0.26], [BL[0] - 2, BL[1] - FB * 0.26]], true, 3), { kapali: true, dolgu: '#ddd7cc', kalinlik: 3.2, tohum: 651, kay: [1.5, 1.5] });
    gsap.set(g, { autoAlpha: 0 });
    return { g, tut: [x - 4, y - FB * 0.24] };
  })();

  // ---------- DM perdesi (gPerde): E'nin önünde üç kanat (orta düz, yan kanatlar öne açılır), markasız; v06: daha uzun
  {
    const cx = YER.E.x, s = YER.E.s, by = kenarY(cx) + 22 * s;
    const w = 98 * s, hO = 142 * s, kw = 80 * s, hY = 128 * s, ky = 22 * s;
    const P = [[cx - w - kw, by + ky], [cx - w, by], [cx + w, by], [cx + w + kw, by + ky]];
    const T = [[P[0][0] + 2 * s, P[0][1] - hY], [P[1][0], P[1][1] - hO], [P[2][0], P[2][1] - hO], [P[3][0] - 2 * s, P[3][1] - hY]];
    const kanat = (i, renk, tohum) => cizgi(gPerde, duz([P[i], P[i + 1], T[i + 1], T[i]], true, 5), { kapali: true, dolgu: renk, kalinlik: 4.5, tohum });
    kanat(0, '#8d867a', 680); kanat(2, '#8d867a', 681); kanat(1, '#a59e91', 682);
    const ic = (u, v) => [P[1][0] + (P[2][0] - P[1][0]) * u, P[1][1] - hO * v];
    cizgi(gPerde, duz([ic(0.08, 0.14), ic(0.92, 0.14), ic(0.92, 0.86), ic(0.08, 0.86)], true, 4), { kapali: true, kalinlik: 2.4, renk: '#6f695f', tohum: 683 });
    // perdenin ön yüzünde sade bir süs: çapraz kılıçlar yerine düz bir kalkan silüeti (markasız)
    const [kx, ky2] = ic(0.5, 0.52);
    cizgi(gPerde, [[kx - 22, ky2 - 26], [kx + 22, ky2 - 26], [kx + 20, ky2 + 4], [kx, ky2 + 28], [kx - 20, ky2 + 4]], { kapali: true, kalinlik: 2.6, renk: '#6f695f', tohum: 684 });
  }

  // ---------- 2B zarlar (gZar): uçuş (k1656–1671) ve masada duruş (yakın plandan sonra; hep yek)
  const ZS = 30;
  const zarYap = (tohum) => {
    const g = el(gZar, 'g');
    const golge = el(g, 'ellipse', { rx: ZS * 0.42, ry: ZS * 0.13, fill: '#000', opacity: 0 });
    const govde = el(g, 'g');
    const nit = (w) => ({ fill: 'none', stroke: M, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const yuzler = { ust: el(govde, 'path', { fill: '#f4f1ea' }), sol: el(govde, 'path', { fill: '#dcd6cb' }), sag: el(govde, 'path', { fill: '#c4beb3' }) };
    for (const [ad, q] of Object.entries(YUZ)) yuzler[ad].setAttribute('d', 'M' + q.map(([x, y]) => `${f3(x)} ${f3(y)}`).join(' L') + 'Z');
    const ic = el(govde, 'path', nit(0.06));
    const dis = el(govde, 'path', nit(0.09));
    const pip = Array.from({ length: 18 }, () => el(govde, 'ellipse', { rx: 0.055, ry: 0.05, fill: M }));
    const sp = ctx.sapma(tohum, 0.012);
    const h = { g, golge, govde, deger: [1, 2, 3] };
    h.ciz = (i = 0) => {
      const s = sp(i);
      dis.setAttribute('d', yol(duz(ALTI, true, 0.04), true, s));
      ic.setAttribute('d', yol([[-0.46, -0.26], [-0.2, -0.115], [0, -0.01], [0.2, -0.115], [0.46, -0.26]], false, s) + ' ' + yol([[0, -0.01], [0, 0.26], [0, 0.52]], false, s));
      let j = 0;
      ['ust', 'sol', 'sag'].forEach((ad, fi) => {
        for (const [u, v] of PIP[h.deger[fi]]) {
          const [x, y] = yuzNokta(YUZ[ad], u, v);
          pip[j].setAttribute('cx', f3(x)); pip[j].setAttribute('cy', f3(y)); pip[j].setAttribute('opacity', 1); j++;
        }
      });
      for (; j < pip.length; j++) pip[j].setAttribute('opacity', 0);
    };
    h.koy = (x, y, aci = 0, sx = 1, sy = 1, golge = 0.14) => {
      h.govde.setAttribute('transform', `translate(${f1(x)} ${f1(y - ZS * 0.5)}) rotate(${f1(aci)}) scale(${f1(ZS * sx)} ${f1(ZS * sy)})`);
      h.golge.setAttribute('cx', f1(x + 3)); h.golge.setAttribute('cy', f1(y + ZS * 0.04)); h.golge.setAttribute('opacity', f3(golge));
    };
    h.ciz(0);
    ctx.kaynayanlar.add(h.ciz);
    gsap.set(g, { autoAlpha: 0 });
    return h;
  };
  const zar2 = [zarYap(700), zarYap(707)];
  // Uçuş: E'nin açılan elinden haritaya doğru yay (kesmede havadalar); masada son yerleri
  const ELUC = (() => { const [b, , a] = ATIS.at, u = EB * 0.85; return EE.dunya([b[0] + u * Math.cos(a * D2R), b[1] + u * Math.sin(a * D2R) - 10]); })();
  const ZAR_SON = [[1080, 874, -8, [1, 4, 2]], [1172, 866, 12, [1, 3, 5]]];
  const TAKLA = [[2, 5, 4], [6, 4, 1], [3, 1, 5], [5, 6, 3], [4, 2, 6], [2, 3, 1], [6, 5, 4], [3, 6, 2]];
  const ucus = { n: 1656 };
  const ucusUygula = (n) => {
    zar2.forEach((z, i) => {
      const t0 = 1657 + i * 2, u = Math.max(0, Math.min(1, (n - t0) / 22));
      const A = [ELUC[0] + i * 12, ELUC[1] + i * 6], B = [960 + i * 80, 826 + i * 12];
      const x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u - 150 * u * (1 - u) * 4 * 0.5;
      const ni = Math.floor((n - t0) / 2);
      const d = TAKLA[(ni + i * 3 + 64) % TAKLA.length];
      if (String(z.deger) !== String(d)) { z.deger = d; z.ciz(); }
      z.koy(x, y, 30 * ni + i * 40, 1, 1, 0.03 + 0.05 * u);
    });
  };
  tl.fromTo(ucus, { n: 1656 }, { n: 1672, duration: k(16), ease: 'none', onUpdate: () => ucusUygula(ucus.n), immediateRender: false }, k(1656));
  zar2.forEach((z, i) => { tl.set(z.g, { autoAlpha: 0 }, k(BAS)); tl.set(z.g, { autoAlpha: 1 }, k(1657 + i * 2)); });
  // masada duruş (yakın plandan sonra)
  tl.call(() => zar2.forEach((z, i) => { const [x, y, a, d] = ZAR_SON[i]; z.deger = d; z.ciz(); z.koy(x, y, a, 1, 1, 0.16); }), null, k(KO));

  // ---------- Balonlar (LB). Konuşma balonu: çekirdeğin konus() çizgisiyle aynı (süperelips, kuyruk); satırlar
  // (<span class="sat">) sırayla yazılır. tabanX: kuyruk tabanının alt kenardaki x'i (verilirse).
  function soz(metin, { x, y, boyut = 50, kuyruk, tohum = 9, pay = [28, 18], taban = 24, tabanX = null }) {
    const g = el(LB.svg, 'g');
    const p = ctx.elYazisi(LB.div, metin, { x, y, boyut, aci: 0 });
    const w = p.offsetWidth || boyut * 6, hh = p.offsetHeight || boyut;
    const b = { cx: x + w / 2, cy: y + hh / 2, rx: w / 2 + pay[0], ry: hh / 2 + pay[1] };
    const govde = cizgi(g, oval(b.cx, b.cy, b.rx, b.ry, 0, 360, 30, 5.5), { kapali: true, dolgu: BALON, kalinlik: 4.5, tohum, genlik: 1.1, kay: [0, 0] });
    const kd = el(g, 'path', { fill: BALON });
    const k1 = cizgi(g, [[0, 0], [0, 0], [0, 0]], { kalinlik: 4.5, tohum: tohum + 1, genlik: 0.9 });
    const k2 = cizgi(g, [[0, 0], [0, 0]], { kalinlik: 4.5, tohum: tohum + 2, genlik: 0.9 });
    const guncelle = () => {
      govde.pts = oval(b.cx, b.cy, b.rx, b.ry, 0, 360, 30, 5.5); govde.ciz();
      const P = (t) => { const c = Math.cos(t), sn = Math.sin(t); return [b.cx + b.rx * Math.sign(c) * Math.abs(c) ** (2 / 5.5), b.cy + b.ry * Math.sign(sn) * Math.abs(sn) ** (2 / 5.5)]; };
      let b1, b2;
      if (tabanX != null) {
        const ust = kuyruk[1] < b.cy, yon = ust ? -1 : 1;
        const kenarYy = (xx) => { const u = Math.min(0.995, Math.abs((xx - b.cx) / b.rx)); return b.cy + yon * b.ry * Math.pow(1 - Math.pow(u, 5.5), 1 / 5.5); };
        b1 = [tabanX - taban, kenarYy(tabanX - taban)]; b2 = [tabanX + taban, kenarYy(tabanX + taban)];
      } else {
        const a = Math.atan2((kuyruk[1] - b.cy) / b.ry, (kuyruk[0] - b.cx) / b.rx);
        const q = P(a), q1 = P(a + 0.01), q0 = P(a - 0.01), tl0 = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
        const t = [(q1[0] - q0[0]) / tl0, (q1[1] - q0[1]) / tl0];
        b1 = [q[0] - t[0] * taban, q[1] - t[1] * taban]; b2 = [q[0] + t[0] * taban, q[1] + t[1] * taban];
      }
      const ic = (z) => [z[0] + (b.cx - z[0]) * 0.1, z[1] + (b.cy - z[1]) * 0.1];
      kd.setAttribute('d', `M${ic(b1).map(f1).join(' ')} L${b1.map(f1).join(' ')} L${kuyruk.map(f1).join(' ')} L${b2.map(f1).join(' ')} L${ic(b2).map(f1).join(' ')}Z`);
      k1.pts = [b1, [(b1[0] + kuyruk[0]) / 2 + (b2[1] - b1[1]) * 0.08, (b1[1] + kuyruk[1]) / 2], kuyruk]; k1.ciz();
      k2.pts = [b2, kuyruk]; k2.ciz();
    };
    guncelle();
    gsap.set(g, { autoAlpha: 0, scale: 0.6, svgOrigin: `${kuyruk[0]} ${kuyruk[1]}` });
    gsap.set(p, { autoAlpha: 0 });
    const satirlar = [...p.querySelectorAll('.sat')];
    gsap.set(satirlar, { clipPath: 'inset(-30% 100% -30% 0%)' });
    const hb = { g, p, b, guncelle, w, h: hh };
    hb.ac = (k0, sureler = [16]) => {
      tl.set(g, { autoAlpha: 0 }, k(BAS));
      tl.set(p, { autoAlpha: 0 }, k(BAS));
      tl.fromTo(g, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: k(8), ease: E.BO, immediateRender: false }, k(k0));
      tl.set(p, { autoAlpha: 1, clipPath: 'inset(-40% -10% -40% -10%)' }, k(k0 + 4));
      let t = k0 + 4;
      satirlar.forEach((sp, i) => {
        // bitişte sağ pay −12%: Caveat'ın son harfi kutudan taşar, kırpılmasın
        tl.fromTo(sp, { clipPath: 'inset(-30% 100% -30% 0%)' }, { clipPath: 'inset(-30% -12% -30% 0%)', duration: k(sureler[i] ?? 16), ease: 'none', immediateRender: false }, k(t));
        t += (sureler[i] ?? 16) + 6;
      });
    };
    hb.kapat = (k0, sure = 10) => {
      tl.to(g, { autoAlpha: 0, scale: 0.9, duration: k(sure), ease: E.EI }, k(k0));
      tl.to(p, { autoAlpha: 0, duration: k(sure), ease: E.EI }, k(k0));
    };
    return hb;
  }
  const sat = (...s) => s.map((x) => `<span class="sat" style="display:inline-block">${x}</span>`).join('<br>');
  // Kişinin ağız hizasında, yüz konturunun hemen dışında bir nokta (dünya): konuşma balonunun kuyruk ucu (yüzü kesmesin)
  const agiz = (h, yon = -1, ek = [0, 0]) => {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz;
    const [X, Yy] = h.dunya([200 + yon * (hw + 16), GOZ_Y + 4 + h.p.yuzBoy * 0.5]);
    return [X + ek[0], Yy + ek[1]];
  };

  // ---------- Kamera anahtarları. Yatay: kutu kadraja sığar. Dikey: çiftten çifte kayar (dördü yan yana küçük kalırdı).
  const sigdir = ([x0, y0, x1, y1]) => { const s = Math.min(W / (x1 - x0), H / (y1 - y0)); return ctx.odak((x0 + x1) / 2, (y0 + y1) / 2, s); };
  const mo = ([cx, cy, s]) => ctx.odak(cx, cy, s);
  const KAM = DIKEY ? {
    // dikeyde iki kişilik ve tek kişilik çekimler: kenar komşunun yüzünden geçmez (E3 yüzü x 660–830, E2 1545–1705)
    genis: mo([530, 450, 1.12]), genis2: mo([548, 446, 1.14]),
    cift2: mo([1400, 440, 1.14]), salla: mo([1188, 470, 1.55]), at: mo([1188, 500, 1.53]),
    orta: mo([765, 520, 1.6]), orta2: mo([1188, 470, 1.55]),
    ruya: mo([1185, 128, 1.5]), ruya2: mo([1185, 122, 1.53]),
  } : {
    // itişlerde kadraj kenarı yüzün ortasından geçmesin: E4 (sağ kenarı x ≈ 410) ya tümüyle içeride ya dışarıda
    genis: sigdir([40, 70, 1880, 1105]), genis2: mo([960, 586, 1.075]),
    cift2: null, salla: mo([1142, 522, 1.38]), at: mo([1146, 548, 1.38]),
    orta: mo([978, 486, 1.7]), orta2: mo([982, 480, 1.72]),
    ruya: mo([1185, 240, 1.45]), ruya2: mo([1185, 238, 1.48]),
  };
  const itis = (o, c) => { const wx = (W / 2 - o.x) / o.scale, wy = (H / 2 - o.y) / o.scale; return ctx.odak(wx, wy, o.scale * c); };
  const kamGit = (n0, sure, a, b, ease = E.KM) => tl.fromTo(ctx.kamera, a, { ...b, duration: k(sure), ease, immediateRender: false }, k(n0));

  // =========================================================================== #14 (1536–1671): sohbet, atış
  ctx.isaret(BAS, 'kesme');
  for (const K of [L0, L, LB]) { tl.set(K.div, { autoAlpha: 1 }, k(BAS)); tl.set(K.div, { autoAlpha: 0 }, k(SON + 1)); }
  tl.set(ctx.itme, { x: 0, y: 0 }, k(BAS));
  ctx.kameraKoy(BAS, KAM.genis);
  if (DIKEY) {
    kamGit(BAS, 30, KAM.genis, KAM.genis2, 'none');
    kamGit(1566, 28, KAM.genis2, KAM.cift2);
    kamGit(1594, 18, KAM.cift2, itis(KAM.cift2, 1.02), 'none');
    kamGit(1612, 30, itis(KAM.cift2, 1.02), KAM.salla);
  } else {
    kamGit(BAS, 76, KAM.genis, KAM.genis2, 'none');
    kamGit(1612, 30, KAM.genis2, KAM.salla);
  }
  kamGit(1642, 30, KAM.salla, KAM.at, 'power1.inOut');
  const bas = (h, o) => tl.call(() => h.poz(o), null, k(BAS));
  bas(E4, { ifade: 'merak', bakis: [3, 0], kol: { sol: 'masa', sag: 'masa' } });
  bas(E3, { ifade: 'saskin', bakis: [2, 0], kol: { sol: 'anlat', sag: 'anlat' } });
  bas(EE, { ifade: 'merak', bakis: [-3, 0], kol: { sol: null, sag: null }, titre: [0, 0] });
  bas(E2, { ifade: 'merak', bakis: [-3, 0], kol: { sol: 'masa', sag: 'masa' } });
  tl.call(() => { E3.araya = ''; for (const h of oyuncular) { Object.assign(h.d, { dx: 0, dy: 0, aci: 0, s: 1, zip: 0 }); h.uygula(); } }, null, k(BAS));
  for (const h of oyuncular) h.uygula();
  const P = (n, h, o) => tl.call(() => h.poz(o), null, ka(n));
  // E3 anlatır: ağız açılıp kapanır, eller değişir; 1551 espri (omuz silker)
  P(1541, E3, { ifade: 'merak', kol: { sol: 'anlat2', sag: 'anlat' } });
  P(1546, E3, { ifade: 'saskin', kol: { sol: 'anlat', sag: 'anlat2' } });
  P(1551, E3, { ifade: 'mutlu', kol: { sol: 'silk', sag: 'silk' } });
  P(1546, E2, { ifade: 'kisik', bakis: [-3, 0] });
  P(1551, EE, { ifade: 'kisik', bakis: [-3, 0] });
  // gülüşme (1556–1600): E2 geriye yaslanıp E3'ü gösterir, E4 elini ağzına kapatır, E başını sallar
  P(1556, E2, { ifade: 'mutlu', kol: { sol: 'isaret' } });
  P(1556, E4, { ifade: 'mutlu', kol: { sag: 'agiz' } });
  P(1556, EE, { ifade: 'mutlu' });
  P(1561, E3, { ifade: 'mutlu', kol: { sol: 'masa', sag: 'silk' }, bakis: [3, -1] });
  P(1571, E3, { kol: { sag: 'masa' } });
  E2.dur(1556, 10, { aci: -3.5, dy: -10 });
  const gul = (h, n0, n1, gen, faz = 0) => { for (let n = n0, i = faz; n < n1; n += 5, i++) tl.call(() => { h.d.zip = i % 2 ? gen : 0; h.uygula(); }, null, ka(n)); tl.call(() => { h.d.zip = 0; h.uygula(); }, null, ka(n1)); };
  gul(E2, 1556, 1600, -5); gul(E4, 1561, 1606, 4, 1); gul(EE, 1561, 1596, 3); gul(E3, 1566, 1601, 4, 1);
  // gülme çizgileri (başın yanında üç kısa çizgi, 12 fps yanıp söner)
  const gulmeCizgi = (h, yon, n0, n1, tohum) => {
    const Y = YAPI[h.p.yapi] || YAPI.orta, hw = h.p.yuzEn * Y.yuz;
    const [ax, ay] = h.dunya([200 + yon * (hw + 26), GOZ_Y - 10]), g = el(gEfekt, 'g');
    [-0.55, 0, 0.55].forEach((a, i) => {
      const L = 20 * h.s, r0 = 8 * h.s, dx = Math.cos(a) * yon, dy = Math.sin(a);
      cizgi(g, [[ax + dx * r0, ay + dy * r0], [ax + dx * (r0 + L), ay + dy * (r0 + L)]], { kalinlik: 3.6, tohum: tohum + i });
    });
    gsap.set(g, { autoAlpha: 0 });
    tl.set(g, { autoAlpha: 0 }, k(BAS));
    for (let n = n0, i = 0; n < n1; n += 5, i++) tl.set(g, { autoAlpha: i % 3 === 2 ? 0 : 1 }, ka(n));
    tl.set(g, { autoAlpha: 0 }, ka(n1));
    return g;
  };
  // (E2 sola dönük güler: çizgiler sağında; E4 sağa dönük: solunda)
  gulmeCizgi(E2, 1, 1561, 1596, 720); gulmeCizgi(E4, -1, 1566, 1601, 724);
  // E2 masaya vurur (1576 kalkar, 1582 vurur): darbe çizgileri, figürler sallanır, 'tik'
  P(1576, E2, { kol: { sol: 'vurHazir' } });
  P(1581, E2, { kol: { sol: 'vur' } });
  ctx.isaret(1582, 'tik');
  {
    const [vx, vy] = E2.dunya([200 - 70, E2.kenar + 100]);
    const g = el(gEfekt, 'g');
    [[-50, -6, -84, -18], [-44, 18, -78, 28], [40, -10, 72, -24], [-10, -30, -16, -60]]
      .forEach(([a, b, c, d], i) => cizgi(g, [[vx + a, vy + b], [vx + c, vy + d]], { kalinlik: 4, tohum: 730 + i }));
    gsap.set(g, { autoAlpha: 0 });
    tl.set(g, { autoAlpha: 0 }, k(BAS));
    tl.set(g, { autoAlpha: 1, scale: 0.7, svgOrigin: `${vx} ${vy}` }, ka(1581));
    tl.set(g, { scale: 1.1 }, ka(1586));
    tl.set(g, { autoAlpha: 0 }, ka(1591));
  }
  // figürler sallanır (12 fps, sönümlü)
  Object.values(FIGURLER).forEach((f, i) => {
    tl.set(f.g, { rotation: 0, y: 0 }, k(BAS));
    [[1581, 7, -3], [1586, -5, 0], [1591, 3, 0], [1596, -1, 0], [1601, 0, 0]].forEach(([n, r, y]) => tl.set(f.g, { rotation: r * (i % 2 ? -1 : 1), y }, ka(n + i)));
  });
  P(1586, E2, { kol: { sol: 'masa' } });
  E2.dur(1601, 10, { aci: 0, dy: 0 });
  // E3, E'nin omzuna iki kez vurur (gülerek)
  P(1586, E3, { kol: { sag: 'omuzKalk' }, bakis: [3, 0] });
  P(1591, E3, { kol: { sag: 'omuz' } });
  P(1596, E3, { kol: { sag: 'omuzKalk' } });
  P(1601, E3, { kol: { sag: 'omuz' } });
  P(1608, E3, { kol: { sag: 'masa' }, ifade: 'merak' });
  EE.dur(1591, 4, { dy: 6 }, 'none'); EE.dur(1596, 4, { dy: 0 }, 'none'); EE.dur(1601, 4, { dy: 6 }, 'none'); EE.dur(1606, 4, { dy: 0 }, 'none');
  P(1601, E4, { kol: { sag: 'masa' }, ifade: 'merak', bakis: [3, 0] });
  // E zarları yumruğunda sallar (30 fps titreme), herkes öne eğilir, gözler yumrukta
  P(1611, EE, { kol: { sol: 'salla' }, ifade: 'kisik', bakis: [-2, -1] });
  P(1616, E3, { ifade: 'saskin', bakis: [3, -2] });
  P(1616, E4, { ifade: 'merak', bakis: [3, -1] });
  P(1621, E2, { ifade: 'merak', bakis: [-3, -1] });
  P(1631, E2, { ifade: 'kisik' });
  E3.dur(1612, 30, { aci: 2, dy: 8, s: 1.02 }); E4.dur(1616, 30, { aci: 1.6, dy: 8, s: 1.02 }); E2.dur(1614, 30, { aci: -2.2, dy: 8, s: 1.02 });
  for (let n = 1614, i = 0; n < 1648; n += 2, i++) {
    const tt = [[0, -7], [3, 5], [-2, -6], [2, 6]][i % 4];
    tl.call(() => EE.poz({ titre: tt }), null, k(n));
  }
  // atış: kaldırır (1648), açar (1656), el yere doğru (1662), sonra perdenin ardına çekilir
  tl.call(() => EE.poz({ kol: { sol: 'kaldir' }, titre: [0, 0], ifade: 'kararli', bakis: [-2, 1] }), null, k(1648));
  EE.dur(1648, 4, { dy: -6 }, 'none');
  tl.call(() => EE.poz({ kol: { sol: 'at' } }), null, k(1656));
  tl.call(() => EE.poz({ kol: { sol: 'at2' } }), null, k(1662));
  for (const [h, b] of [[E3, [3, 2]], [E4, [3, 2]], [E2, [-3, 2]]]) P(1661, h, { ifade: 'saskin', bakis: b });

  // =========================================================================== #15 (1672–1799): 3B yakın plan
  ctx.isaret(KY, 'kesme');
  const yakin = THREE ? yakinPlanKur() : null;
  if (yakin) {
    for (const K of [L0, L, LB]) { tl.set(K.div, { autoAlpha: 0 }, k(KY)); tl.set(K.div, { autoAlpha: 1 }, k(KO)); }
    for (const K of [L3, L3s]) { tl.set(K.div, { autoAlpha: 1 }, k(KY)); tl.set(K.div, { autoAlpha: 0 }, k(KO)); }
    ctx.kameraKoy(KY, ctx.odak(W / 2, H / 2, 1));
    ctx.herKare(yakin.ciz);
    for (const d of yakin.darbeler) if (d.hiz > 6) ctx.isaret(d.n, 'zar');
    ctx.isaret(yakin.devrik, 'tik');
    ctx.isaret(yakin.durus - 8, 'sessizlik', { bitis: yakin.durus + 6 });
  } else {
    // 3B yoksa: masaya yaklaşan 2B çekim; zarlar haritaya iner, şövalye devrilir
    ctx.kameraKoy(KY, mo([1000, 760, 2.2]));
    kamGit(KY, 128, mo([1000, 760, 2.2]), mo([1010, 790, 2.5]), 'power1.out');
    tl.call(() => zar2.forEach((z, i) => { const [x, y, a, d] = ZAR_SON[i]; z.deger = d; z.ciz(); z.koy(x, y, a, 1, 1, 0.16); }), null, k(1700));
    tl.set(FIGURLER.sovalye.g, { autoAlpha: 0 }, k(1704)); tl.set(DEVRIK.g, { autoAlpha: 1 }, k(1704));
    ctx.isaret(1700, 'zar');
  }
  // yakın plandan sonra: şövalye masada devrik
  tl.set(FIGURLER.sovalye.g, { autoAlpha: 1 }, k(BAS));
  tl.set(DEVRIK.g, { autoAlpha: 0 }, k(BAS));
  tl.set(FIGURLER.sovalye.g, { autoAlpha: 0 }, k(KO));
  tl.set(DEVRIK.g, { autoAlpha: 1 }, k(KO));

  // =========================================================================== #16 (1800–2039): "Keşke…" sözleri
  ctx.isaret(KO, 'kesme');
  ctx.kameraKoy(KO, KAM.orta);
  kamGit(KO, 122, KAM.orta, itis(KAM.orta, 1.025), 'none');
  tl.call(() => {
    E3.poz({ ifade: 'sikkin', bakis: [3, 2], kol: { sol: 'masa', sag: 'masa' } });
    EE.poz({ ifade: 'sikkin', bakis: [-2, 2], kol: { sol: null, sag: null }, titre: [0, 0] });
    E4.poz({ ifade: 'sikkin', bakis: [3, 2], kol: { sol: 'masa', sag: 'masa' } });
    E2.poz({ ifade: 'sikkin', bakis: [-3, 2], kol: { sol: 'masa', sag: 'masa' } });
    for (const h of oyuncular) { Object.assign(h.d, { dx: 0, dy: 0, aci: 0, s: 1, zip: 0 }); h.uygula(); }
  }, null, k(KO));
  // E3 devrik kâğıda uzanır, alır; kâğıt elinde boynunu büker (12 fps)
  P(1806, E3, { kol: { sag: 'uzan' }, ifade: 'sikkin', bakis: [3, 3] });
  E3.dur(1806, 10, { aci: 2.5, dy: 10, s: 1.02 });
  tl.call(() => { kart.b = -1; }, null, k(BAS));
  tl.set(DEVRIK.g, { autoAlpha: 0 }, ka(1816));
  tl.call(() => { kart.b = 0; E3.poz({ kol: { sag: 'tut' }, ifade: 'merak', bakis: [1, -3] }); }, null, ka(1816));
  E3.dur(1816, 10, { aci: 0, dy: 0, s: 1 });
  [[1826, 0.2], [1831, 0.55], [1836, 1.05], [1841, 0.86], [1846, 0.97], [1851, 0.93]].forEach(([n, b]) =>
    tl.call(() => { kart.b = b; E3.poz({}); }, null, ka(n)));
  ctx.isaret(1836, 'tik');
  P(1836, E3, { ifade: 'sikkin', bakis: [1, -3] });
  P(1842, E3, { ifade: 'ozlem', bakis: [2, -2] });
  P(1826, EE, { ifade: 'merak', bakis: [-3, -1] });
  P(1836, E4, { ifade: 'kirp' }); P(1841, E4, { ifade: 'merak', bakis: [3, -1] });
  P(1846, E2, { ifade: 'merak', bakis: [-3, -1] });
  // "Keşke piyonlarımız gerçek olsa…" (E3)
  // balon E3'ün sol üstünde; kuyruk yüzün sol yanına iner (başın üstünden geçmesin)
  const S1 = ctx.yer({ x: 448, y: 214, tx: 600 }, { x: 560, y: 120, tx: 700 });
  const soz1 = soz(ctx.metin(sat('Keşke piyonlarımız', 'gerçek olsa…'), sat('If only our pawns', 'were real…')),
    { x: S1.x, y: S1.y, boyut: ctx.yer(46, 48), kuyruk: agiz(E3, -1, [-6, -4]), tohum: 740, tabanX: S1.tx });
  soz1.ac(K_E3, [16, 12]);
  ctx.isaret(K_E3, 'konusma');
  soz1.kapat(1922, 8);
  // E'ye kayış; E: "Keşke FRP zarlarımız olsa… / kendimiz tasarlayabildiğimiz…"
  kamGit(1920, 26, itis(KAM.orta, 1.025), KAM.orta2);
  kamGit(1946, 84, KAM.orta2, itis(KAM.orta2, 1.03), 'none');
  P(1921, EE, { ifade: 'ozlem', bakis: [-1, 3] });
  P(1931, EE, { ifade: 'saskin', kol: { sag: 'goster' } });
  P(1941, EE, { ifade: 'ozlem' });
  P(1956, EE, { ifade: 'merak', bakis: [-3, 0] });
  P(1971, EE, { ifade: 'ozlem' });
  P(1996, EE, { kol: { sag: null }, bakis: [-1, -1] });
  P(1926, E3, { ifade: 'merak', bakis: [3, 0] });
  P(1931, E2, { ifade: 'merak', bakis: [-3, 0] });
  P(1936, E4, { ifade: 'merak', bakis: [3, 0] });
  const S2 = ctx.yer({ x: 806, y: 214, tx: 1010 }, { x: 880, y: 20, tx: 1010 });
  const soz2 = soz(DIKEY
    ? ctx.metin(sat('Keşke FRP', 'zarlarımız olsa…', 'kendimiz', 'tasarlayabildiğimiz…'), sat('If only we had', 'real RPG dice…', 'ones we designed', 'ourselves…'))
    : ctx.metin(sat('Keşke FRP zarlarımız olsa…', 'kendimiz tasarlayabildiğimiz…'), sat('If only we had real RPG dice…', 'ones we designed ourselves…')),
  { x: S2.x, y: S2.y, boyut: ctx.yer(46, 48), kuyruk: agiz(EE, -1, [-10, -4]), tohum: 760, tabanX: S2.tx });
  soz2.ac(K_E, DIKEY ? [10, 12, 8, 16] : [20, 22]);
  ctx.isaret(K_E, 'konusma');
  soz2.kapat(2044, 8);

  // =========================================================================== #17 (2040–2225): düşünce, dönen zarlar
  ctx.isaret(K_CENE, 'vurgu');
  kamGit(2030, 40, itis(KAM.orta2, 1.03), KAM.ruya);
  kamGit(2070, SON - 2070, KAM.ruya, KAM.ruya2, 'none');
  // E3 kâğıdı masaya bırakır
  tl.call(() => { kart.b = -1; E3.poz({ kol: { sag: 'masa' } }); }, null, ka(2031));
  tl.set(DEVRIK.g, { autoAlpha: 1 }, ka(2031));
  P(2036, EE, { kol: { sol: 'cene' }, ifade: 'ozlem', bakis: [2, -3] });
  P(2046, EE, { ifade: 'merak' });
  P(2056, E3, { ifade: 'merak', bakis: [3, -1] });
  P(2061, E2, { ifade: 'merak', bakis: [-3, -1] });
  P(2066, E4, { ifade: 'merak', bakis: [3, -1] });
  // Bulut: E'nin başının üstünde, noktalar başından çıkar
  const BL = ctx.yer(
    { c: [1185, 40], r: [404, 96], n: [[1226, 338, 9], [1240, 302, 12], [1258, 264, 15]], koken: '56% 96%' },
    { c: [1185, -186], r: [300, 228], n: [[1240, 320, 10], [1262, 262, 14], [1240, 196, 18], [1216, 128, 22]], koken: '50% 98%' });
  const B = ctx.balon(LB.svg, { c: BL.c, r: BL.r, noktalar: BL.n, tohum: 37, koken: BL.koken });
  tl.set(B.g, { autoAlpha: 1 }, k(BAS));
  const bulutOturur = Math.round(B.ac(K_BALON) * ctx.FPS);
  ctx.isaret(K_BALON, 'dusunce');
  // Balonun içi: 3B zarlar (yoksa düz çizim)
  const ZARLAR = ['d20', 'd12', 'd8', 'd6', 'd4'];
  // zarlar bulutun iç elipsini biraz taşabilir: tümsekler elipsin dışına şişer
  const ICR = [BL.c[0] - BL.r[0] * (DIKEY ? 0.86 : 1.0), BL.c[1] - BL.r[1] * (DIKEY ? 0.78 : 1.0), BL.c[0] + BL.r[0] * (DIKEY ? 0.86 : 1.0), BL.c[1] + BL.r[1] * (DIKEY ? 0.78 : 1.0)];
  const POP = ZARLAR.map((_, i) => bulutOturur + 2 + i * 6);
  const TAS = ZARLAR.map((_, i) => K_TAS + 8 + i * 3), RECINE = ZARLAR.map((_, i) => K_TAS + 34 + i * 3);
  const balonZar = THREE ? balonZarKur(ICR) : null;
  if (balonZar) {
    tl.set(balonZar.div, { autoAlpha: 0 }, k(BAS));
    tl.set(balonZar.div, { autoAlpha: 1 }, k(bulutOturur));
    ctx.herKare(balonZar.ciz);
  } else {
    // düz çizim yedeği: zarların altıgen silüetleri sırayla belirir
    ZARLAR.forEach((ad, i) => {
      const [x0, y0, x1, y1] = ICR, c = [x0 + (x1 - x0) * (0.1 + i * 0.2), (y0 + y1) / 2], g = el(B.ic, 'g');
      cizgi(g, oval(c[0], c[1], 60, 60, 0, 360, [3, 6, 4, 6, 3][i] * 2, 2), { kapali: true, dolgu: URUN_RENK[URUN_SIRA[i]], kalinlik: 5, tohum: 800 + i });
      gsap.set(g, { autoAlpha: 0 }); tl.set(g, { autoAlpha: 0 }, k(BAS)); tl.set(g, { autoAlpha: 1 }, k(POP[i]));
    });
  }
  POP.forEach((n) => ctx.isaret(n + 4, 'tik'));
  ctx.isaret(TAS[0], 'vurgu');
  ctx.isaret(RECINE[0], 'vurgu');
  // "Taştan mı olsa… / reçineden mi?" (E mırıldanır; eli çenesinde)
  const S3 = ctx.yer({ x: 768, y: 236, tx: 976 }, { x: 870, y: 268, tx: 1000 });
  const soz3 = soz(ctx.metin(sat('Taştan mı olsa…', 'reçineden mi?'), sat('Stone…', 'or resin?')),
    { x: S3.x, y: S3.y, boyut: ctx.yer(40, 44), kuyruk: agiz(EE, -1, [-8, -2]), tohum: 780, pay: [22, 14], tabanX: S3.tx });
  soz3.ac(K_TAS, [16, 16]);
  ctx.isaret(K_TAS, 'konusma');
  P(K_TAS, EE, { ifade: 'merak', bakis: [2, -3] });
  P(K_TAS + 40, EE, { ifade: 'ozlem', bakis: [2, -3] });
  P(K_TAS + 70, EE, { ifade: 'merak' });
  P(K_TAS + 20, E3, { ifade: 'kisik', bakis: [3, -1] });
  P(K_TAS + 50, E2, { ifade: 'kisik', bakis: [-3, -1] });

  // ===========================================================================================================
  // 3B YAKIN PLAN: tavla zarları haritada. Dünya: x sağa, y yukarı, z kameraya doğru; birim = zar kenarı (~16 mm).
  function yakinPlanKur() {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
    L3.div.insertBefore(cv, L3.svg);
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); } catch (e) { console.warn('s4-frp: WebGL yok', e); cv.remove(); return null; }
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(KAGIT);
    sc.fog = new THREE.Fog(KAGIT, 16, 34);
    const kam = new THREE.PerspectiveCamera(DIKEY ? 50 : 30, W / H, 0.1, 90);
    // Toon: üç ton (gölge %66, ara %83, ışık %100); ışık şiddetleri π ile (fiziksel ışık: Lambert /π)
    const grad = new THREE.DataTexture(new Uint8Array([0, 128, 255]), 3, 1, THREE.RedFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
    sc.add(new THREE.AmbientLight(0xffffff, 0.66 * Math.PI));
    const gun = new THREE.DirectionalLight(0xffffff, 0.34 * Math.PI);
    gun.position.set(-5, 10, 4); gun.target.position.set(0, 0, -3);
    gun.castShadow = true; gun.shadow.mapSize.set(2048, 2048);
    Object.assign(gun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 30 });
    gun.shadow.camera.updateProjectionMatrix();
    gun.shadow.bias = -0.0006; gun.shadow.normalBias = 0.02;
    sc.add(gun, gun.target);
    const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
    const doku = (c, { tekrar = null } = {}) => {
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());
      if (tekrar) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(tekrar, tekrar); }
      return t;
    };
    const tuval = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // Tuvalde doodle çizgi: insan.js yol() → Path2D; dolgu konturdan kayık (baskı kayması)
    const tc = (g, pts, kapali, sp, { dolgu = null, renk = M, w = 6, kay = 0 } = {}) => {
      const p = new Path2D(yol(pts, kapali, sp));
      if (dolgu) { g.save(); g.translate(kay, kay); g.fillStyle = dolgu; g.fill(p); g.restore(); }
      if (w) { g.lineWidth = w; g.strokeStyle = renk; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(p); }
    };
    const titrek = (tohum, gen) => { const sp = ctx.sapma(tohum, gen); return sp(0); };

    // --- Masa (geniş, açık ahşap tonu) ve harita kâğıdı (ızgaralı savaş haritası, aynı doodle dili)
    {
      const c = tuval(512, 512), g = c.getContext('2d');
      g.fillStyle = '#cfc9bd'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9; i++) tc(g, Array.from({ length: 9 }, (_, j) => [j * 64, i * 58 + 18 + Math.sin(j * 0.9 + i) * 6]), false, titrek(900 + i, 2), { renk: '#c2bcb1', w: 3 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon({ map: doku(c, { tekrar: 10 }) }));
      m.rotation.x = -Math.PI / 2; m.position.y = -0.004; m.receiveShadow = true; sc.add(m);
    }
    const HS = [10, 14], HC = [0, -3.4], PXU = 150; // harita boyu (x, z), merkezi, birim başına piksel
    {
      const c = tuval(HS[0] * PXU, HS[1] * PXU), g = c.getContext('2d'), U = (x, z) => [(x - HC[0] + HS[0] / 2) * PXU, (z - HC[1] + HS[1] / 2) * PXU];
      g.fillStyle = TON.harita; g.fillRect(0, 0, c.width, c.height);
      // ızgara (1,5 birim ≈ 1 inç)
      for (let x = -HS[0] / 2 + 0.5; x < HS[0] / 2; x += 1.5) tc(g, [U(x, HC[1] - 6.8), U(x + 0.03, HC[1]), U(x, HC[1] + 6.8)], false, titrek(910 + x * 3, 2.5), { renk: TON.izgara, w: 4 });
      for (let z = -HS[1] / 2 + 0.6; z < HS[1] / 2; z += 1.5) tc(g, [U(-4.8, HC[1] + z), U(0, HC[1] + z + 0.03), U(4.8, HC[1] + z)], false, titrek(930 + z * 3, 2.5), { renk: TON.izgara, w: 4 });
      const ince = { renk: TON.cizgi, w: 7 };
      // göl, nehir, dağlar, orman, kesik yol, kule, X
      tc(g, ov(...U(-3.0, -6.4), 1.6 * PXU, 1.0 * PXU, 18), true, titrek(940, 4), { ...ince, dolgu: '#d6d1c7', kay: 6 });
      tc(g, [U(-1.6, -6.2), U(-0.6, -5.4), U(-0.9, -4.2), U(0.2, -3.2), U(1.6, -2.9), U(2.6, -1.6), U(4.9, -1.2)], false, titrek(941, 4), ince);
      tc(g, [U(-1.3, -6.5), U(-0.3, -5.6), U(-0.6, -4.4), U(0.5, -3.5), U(1.8, -3.2), U(2.8, -1.9), U(4.9, -1.6)], false, titrek(942, 4), ince);
      [[1.6, -7.6], [2.6, -7.2], [3.5, -7.8]].forEach(([x, z], i) => tc(g, [U(x - 0.6, z + 0.5), U(x, z - 0.6), U(x + 0.6, z + 0.5)], false, titrek(943 + i, 4), { ...ince, w: 8 }));
      [[-3.6, -2.4], [-3.0, -1.6], [-3.9, -1.2], [-2.6, -2.8]].forEach(([x, z], i) => { tc(g, ov(...U(x, z), 0.42 * PXU, 0.36 * PXU, 12), true, titrek(950 + i, 3), { ...ince, dolgu: '#d6d1c7', kay: 5 }); });
      g.setLineDash([26, 22]);
      tc(g, [U(-4.6, 2.6), U(-2.4, 1.6), U(-0.6, 0.4), U(0.9, -0.6), U(2.9, 0.3), U(4.4, -0.2)], false, titrek(960, 4), ince);
      g.setLineDash([]);
      tc(g, [U(3.2, -5.6), U(3.9, -4.6)], false, titrek(961, 3), { ...ince, w: 9 }); tc(g, [U(3.9, -5.6), U(3.2, -4.6)], false, titrek(962, 3), { ...ince, w: 9 });
      tc(g, [U(-1.4, 1.6), U(-0.8, 1.6), U(-0.8, 0.8), U(-1.4, 0.8)], true, titrek(963, 3), { ...ince, dolgu: '#d6d1c7', kay: 5 });
      // kenar (kâğıt sınırı)
      tc(g, [[6, 6], [c.width / 2, 4], [c.width - 6, 6], [c.width - 4, c.height / 2], [c.width - 6, c.height - 6], [c.width / 2, c.height - 4], [6, c.height - 6], [4, c.height / 2]], true, titrek(964, 3), { renk: M, w: 10 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(HS[0], HS[1]), toon({ map: doku(c) }));
      m.rotation.x = -Math.PI / 2; m.position.set(HC[0], 0, HC[1]); m.receiveShadow = true; sc.add(m);
    }
    // --- DM perdesi (uzakta, sise karışır): üç kanat + mürekkep kenarları
    const cizgiMat = (px, o = {}) => new LineMaterial({ color: new THREE.Color(M), linewidth: px, resolution: new THREE.Vector2(W, H), ...o });
    const kenarCiz = (geo, px, o) => new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 20)), cizgiMat(px, o));
    {
      const g = new THREE.Group(), m = toon({ color: '#a59e91' }), mY = toon({ color: '#8d867a' });
      // kanat: menteşe (grup kökeni) kanadın bir kenarında; ofs kanadın ortasına
      const kanat = (w, mat, ofs) => {
        const geo = new THREE.BoxGeometry(w, 3.6, 0.12); geo.translate(ofs, 1.8, 0);
        const k1 = new THREE.Mesh(geo, mat); k1.castShadow = true;
        const gg = new THREE.Group(); gg.add(k1, kenarCiz(geo, 2.4)); return gg;
      };
      g.add(kanat(4.8, m, 0));
      const sol = kanat(3.6, mY, -1.8); sol.position.x = -2.4; sol.rotation.y = 0.5; g.add(sol);
      const sag = kanat(3.6, mY, 1.8); sag.position.x = 2.4; sag.rotation.y = -0.5; g.add(sag);
      g.position.set(0.6, 0, -15); sc.add(g);
    }
    // --- Kâğıt figürler: kart (önde resim, arkada boş kâğıt) + arkaya kıvrık taban kanadı. Grup kökeni katlama çizgisinde.
    const KW = 1.5, KH = 2.4, KD = 0.75;
    const kartDoku = (ad, on) => {
      const c = tuval(384, 614), g = c.getContext('2d'), K = (u, v) => [(u + 0.5) * 384, (1 - v) * 614];
      const R = 20;
      g.fillStyle = on ? TON.kagit : '#e9e4db'; g.beginPath(); g.roundRect(4, 4, 376, 606, R); g.fill();
      tc(g, [[8, 8], [192, 6], [376, 8], [378, 307], [376, 606], [192, 608], [8, 606], [6, 307]], true, titrek(970, 2), { renk: M, w: 9 });
      if (!on) {
        // kartın sırtı: ince çerçeve ve seyrek çapraz tarama (yüzüstü düşünce "kartın arkası" okunsun)
        tc(g, [[36, 36], [348, 36], [348, 578], [36, 578]], true, titrek(975, 2), { renk: TON.koyu, w: 4 });
        g.save(); g.beginPath(); g.rect(40, 40, 304, 534); g.clip();
        for (let i = -6; i < 10; i++) tc(g, [[36 + i * 52, 578], [36 + i * 52 + 312, 36]], false, titrek(976 + i, 2), { renk: TON.izgara, w: 5 });
        g.restore();
        return c;
      }
      tc(g, [K(-0.42, 0.04), K(0.42, 0.04), K(0.42, 0.96), K(-0.42, 0.96)].flatMap((p, i, a) => { const q = a[(i + 1) % 4]; return [p, [p[0] * 0.86 + q[0] * 0.14, p[1] * 0.86 + q[1] * 0.14], [p[0] * 0.14 + q[0] * 0.86, p[1] * 0.14 + q[1] * 0.86]]; }), true, titrek(971, 2), { renk: TON.koyu, w: 4 });
      FIGUR[ad].forEach((f, i) => tc(g, f.p.map(([u, v]) => K(u, v)), !!f.k, titrek(972 + i, 2.5), { dolgu: f.d ? (f.d === 'cizgi' ? TON.cizgi : TON[f.d]) : null, w: 9 * (f.w || 1), kay: 5 }));
      return c;
    };
    const tabanDoku = () => {
      const c = tuval(384, 192), g = c.getContext('2d');
      g.fillStyle = '#e4dfd5'; g.fillRect(0, 0, 384, 192);
      tc(g, [[8, 8], [376, 8], [376, 184], [8, 184]], true, titrek(990, 2), { renk: M, w: 9 });
      return c;
    };
    const figurYap = (ad) => {
      const kok = new THREE.Group(), govde = new THREE.Group();
      kok.rotation.order = 'YXZ';
      const kart = new THREE.PlaneGeometry(KW, KH, 12, 1);
      const pos = kart.attributes.position; // hafif kâğıt kıvrımı
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / (KW / 2); pos.setZ(i, 0.07 * (1 - x * x)); }
      kart.computeVertexNormals(); kart.translate(0, KH / 2, 0);
      const on = new THREE.Mesh(kart, toon({ map: doku(kartDoku(ad, true)), side: THREE.FrontSide }));
      const arka = new THREE.Mesh(kart.clone(), toon({ map: doku(kartDoku(ad, false)), side: THREE.BackSide }));
      const kanatGeo = new THREE.PlaneGeometry(KW, KD); kanatGeo.rotateX(-Math.PI / 2); kanatGeo.translate(0, 0.004, -KD / 2);
      const kanat = new THREE.Mesh(kanatGeo, toon({ map: doku(tabanDoku()), side: THREE.DoubleSide }));
      for (const m of [on, arka, kanat]) { m.castShadow = true; m.receiveShadow = true; m.material.shadowSide = THREE.DoubleSide; }
      govde.add(on, arka, kanat); kok.add(govde); sc.add(kok);
      return { kok, govde };
    };
    // --- Tavla zarları: yuvarlatılmış küp, yüzlerde noktalar (dokuyla), mürekkep konturu (ters kabuk)
    const pipDoku = (n) => {
      const c = tuval(256, 256), g = c.getContext('2d');
      g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 256, 256);
      const R = rng(1000 + n), r0 = n === 1 ? 30 : 23;
      for (const [u, v] of PIP[n]) {
        g.beginPath(); g.ellipse(128 + u * 64, 128 + v * 64, r0 * (0.94 + R() * 0.12), r0 * (0.94 + R() * 0.12), R() * 3, 0, Math.PI * 2);
        g.fillStyle = M; g.fill();
      }
      return c;
    };
    // BoxGeometry yüz sırası: +x, −x, +y, −y, +z, −z → karşılıklı yüzler toplamı 7
    const DEGER = [3, 4, 1, 6, 2, 5];
    const yuzMat = DEGER.map((n) => toon({ map: doku(pipDoku(n)) }));
    const zarGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.13);
    const kabukMat = new THREE.MeshBasicMaterial({ color: M, side: THREE.BackSide });
    const zarlar = ATISLAR.map((a) => {
      const sim = zarSim({ ...a, q0: qEuler(...a.e0) });
      const K = sim.kareler, son = K[K.length - 1];
      const ofs = [a.hedef[0] - son.p[0], a.hedef[1] - son.p[2]];
      K.forEach((kk) => { kk.p[0] += ofs[0]; kk.p[2] += ofs[1]; });
      sim.darbeler.forEach((d) => { d.p[0] += ofs[0]; d.p[2] += ofs[1]; });
      const kok = new THREE.Group(), ic = new THREE.Mesh(zarGeo, yuzMat), kabuk = new THREE.Mesh(zarGeo, kabukMat);
      ic.castShadow = true; kabuk.scale.setScalar(1.075);
      // son karede yukarı bakan yerel eksen: 1 yüzü (+y) oraya döndürülür (hep yek)
      const qs = new THREE.Quaternion(...son.q).invert(), yukari = new THREE.Vector3(0, 1, 0).applyQuaternion(qs);
      const eks = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((v) => new THREE.Vector3(...v));
      const enIyi = eks.reduce((a2, b) => (b.dot(yukari) > a2.dot(yukari) ? b : a2));
      const ici = new THREE.Group(); ici.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), enIyi);
      ici.add(ic, kabuk); kok.add(ici); sc.add(kok);
      return { kok, ici, kabuk, K, darbeler: sim.darbeler };
    });
    const HIZ = 0.85; // ekranda fizik hızı (hafif ağır çekim)
    const simKare = (n) => (n - KY) * HIZ;
    const durum = (z, fs) => {
      const K = z.K, i = Math.max(0, Math.min(K.length - 1, Math.floor(fs))), j = Math.min(K.length - 1, i + 1), t = Math.max(0, Math.min(1, fs - i));
      const p = K[i].p.map((v, a) => v + (K[j].p[a] - v) * t);
      const q = new THREE.Quaternion(...K[i].q).slerp(new THREE.Quaternion(...K[j].q), t);
      return { p, q };
    };
    // sim karesi → film karesi
    const filmKare = (fs) => KY + fs / HIZ;
    // --- Şövalye, 1. zarın 2. değmesinden 5 kare sonra, zarın gidişinin solunda ve biraz önünde durur; o an devrilir
    const A = zarlar[0], dA = A.darbeler[Math.min(1, A.darbeler.length - 1)], fh = dA.f + 5;
    const ph = durum(A, fh).p, fh1 = durum(A, fh + 3).p;
    const yonA = [fh1[0] - ph[0], fh1[2] - ph[2]], yl = Math.hypot(...yonA) || 1, ileri = [yonA[0] / yl, yonA[1] / yl];
    // gidişin solu (zarın bakışıyla): (−dz, dx)
    const sovalye = figurYap('sovalye');
    sovalye.kok.position.set(ph[0] - ileri[1] * 1.22 + ileri[0] * 0.4, 0, ph[2] + ileri[0] * 1.22 + ileri[1] * 0.4);
    sovalye.kok.rotation.y = 0.18;
    const buyucu = figurYap('buyucu'); buyucu.kok.position.set(-3.4, 0, -3.6); buyucu.kok.rotation.y = 0.5;
    const canavar = figurYap('canavar'); canavar.kok.position.set(3.5, 0, -2.8); canavar.kok.rotation.y = -0.55; canavar.kok.scale.setScalar(1.06);
    const figurler = [sovalye, buyucu, canavar];
    const devrik = Math.round(filmKare(fh));
    // --- Darbe izleri (2B, L3s): çarpma noktasında dört kısa çizgi; 7 kare görünür
    const tumDarbe = zarlar.flatMap((z) => z.darbeler.filter((d) => d.hiz > 5).map((d) => ({ ...d, n: Math.round(filmKare(d.f)) })));
    const izler = tumDarbe.map((d, i) => {
      const g = el(L3s.svg, 'g');
      [[-1, -0.25], [-0.4, -1], [0.4, -1], [1, -0.25]].forEach(([dx, dy], j) => cizgi(g, [[dx * 22, dy * 14], [dx * 44, dy * 30]], { kalinlik: 4.5, tohum: 1100 + i * 5 + j }));
      g.setAttribute('opacity', 0);
      return { g, d };
    });
    const v3 = new THREE.Vector3();
    const ekran = (x, y, z) => { v3.set(x, y, z).project(kam); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; };
    // --- Kamera yolu: girişte geniş (zarlar uzaktan gelir), sonra son zarlara doğru KM ile iner; hafif el kamerası
    const ortaSon = [(ATISLAR[0].hedef[0] + ATISLAR[1].hedef[0]) / 2, 0.5, (ATISLAR[0].hedef[1] + ATISLAR[1].hedef[1]) / 2];
    const KP = DIKEY
      ? { p0: [-0.5, 10.5, 5.2], p1: [ortaSon[0], 8.4, ortaSon[2] + 5.0], t0: [-0.6, 0, -5], t1: [ortaSon[0], 0.3, ortaSon[2] - 0.2] }
      : { p0: [-0.6, 6.4, 6.4], p1: [ortaSon[0] + 0.5, 4.2, ortaSon[2] + 4.6], t0: [0, 0.3, -4.6], t1: [ortaSon[0], 0.35, ortaSon[2]] };
    const km = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const qTop = new THREE.Quaternion();
    const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const ciz = (n) => {
      if (n < KY - 1 || n > KO) return;
      const fs = simKare(n);
      for (const z of zarlar) { const d = durum(z, fs); z.kok.position.set(...d.p); z.kok.quaternion.copy(d.q); }
      // kaynama: kontur kabuğu 8 fps'te çok az oynar (dört çizim)
      // kabuk dünyada biraz yukarı kaydırılır: masaya gömülen alt kenarın konturu da görünsün
      const ki = Math.floor(n * 8 / 60) % 4;
      for (const z of zarlar) {
        z.kabuk.scale.setScalar(1.072 + [0, 0.006, -0.003, 0.004][ki]);
        qTop.copy(z.kok.quaternion).multiply(z.ici.quaternion).invert();
        z.kabuk.position.set(0, 0.034, 0).applyQuaternion(qTop);
      }
      // şövalyenin devrilmesi: öne (+z) yüzüstü kapanır (yerçekimi: açı t²), seker, oturur; biraz döner ve kayar
      const tf = (n - devrik) / 11;
      let ax = 0, yaw = 0, kay = 0;
      if (tf > 0) {
        if (tf < 1) { ax = Math.PI / 2 * tf * tf; yaw = -0.4 * tf; kay = 0.25 * tf; } else {
          const u = Math.min(1, (tf - 1) * 11 / 7);
          ax = Math.PI / 2 - 0.16 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0); yaw = -0.4; kay = 0.25;
        }
      }
      sovalye.govde.rotation.set(ax, 0, 0);
      sovalye.kok.rotation.y = 0.18 + yaw;
      sovalye.govde.position.z = kay;
      // öbür figürler: yakın darbelerde sönümlü titreme
      for (const f of [buyucu, canavar]) {
        let a = 0;
        for (const d of tumDarbe) {
          const dt = (n - d.n) / 60; if (dt < 0) continue;
          const uz = Math.hypot(d.p[0] - f.kok.position.x, d.p[2] - f.kok.position.z);
          a += d.hiz * 0.0045 / (1 + uz * uz * 0.25) * Math.exp(-dt * 6) * Math.sin(dt * 38);
        }
        f.govde.rotation.x = a;
      }
      // kamera
      const t = km(Math.max(0, Math.min(1, (n - KY) / (KO - KY))));
      const el1 = [Math.sin(n * 0.05) * 0.03, Math.sin(n * 0.037 + 1) * 0.02, 0];
      kam.position.set(...lerp3(KP.p0, KP.p1, t).map((v, i) => v + el1[i]));
      kam.lookAt(...lerp3(KP.t0, KP.t1, t));
      kam.updateMatrixWorld();
      // darbe izleri
      for (const { g, d } of izler) {
        const u = (n - d.n) / 7;
        if (u < 0 || u > 1) { g.setAttribute('opacity', 0); continue; }
        const [x, y] = ekran(d.p[0], 0, d.p[2]), s = (0.7 + u * 0.6) * Math.min(1.6, 0.5 + d.hiz / 20);
        g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${f3(s)})`);
        g.setAttribute('opacity', f3(1 - u * u));
      }
      r.render(sc, kam);
    };
    // zarların ikisi de durduğu kare (sessizlik işareti için)
    const sonHareket = (z) => { const K = z.K; let i = K.length - 1; while (i > 0 && Math.hypot(...K[i].p.map((v, a) => v - K[i - 1].p[a])) < 1e-4) i--; return i; };
    const durus = Math.round(filmKare(Math.max(...zarlar.map(sonHareket))));
    ciz(KY);
    return { ciz, darbeler: tumDarbe, devrik, durus };
  }

  // ===========================================================================================================
  // 3B BALON ZARLARI: d20, d12, d8, d6, d4. Kendi gölgelendiricileri (ışıksız sahne): toon üç ton, malzeme süpürmesi
  // (kâğıt → taş → reçine; nesne y'sinde yukarıdan aşağı, sınırda ince mürekkep bandı). Reçinede arka yüzler ve gizli
  // kenarlar görünür (yarı saydam), pırıltılar zamanla yanıp söner. Tüm renkler sRGB değerleriyle (çıkışta dönüşüm yok).
  function balonZarKur([x0, y0, x1, y1]) {
    const w = x1 - x0, h = y1 - y0, PR = 2;
    const div = document.createElement('div');
    Object.assign(div.style, { position: 'absolute', left: x0 + 'px', top: y0 + 'px', width: w + 'px', height: h + 'px', pointerEvents: 'none' });
    const cv = document.createElement('canvas'); cv.width = Math.round(w * PR); cv.height = Math.round(h * PR);
    Object.assign(cv.style, { width: w + 'px', height: h + 'px', display: 'block' });
    div.appendChild(cv); LB.div.appendChild(div);
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { console.warn('s4-frp: WebGL yok', e); div.remove(); return null; }
    r.setPixelRatio(1); r.setSize(cv.width, cv.height, false); r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    const kam = new THREE.PerspectiveCamera(22, w / h, 0.1, 100);
    kam.position.set(0, 0, 20); kam.lookAt(0, 0, 0);
    // ekranda görünen yarım genişlik (birim) z = 0'da
    const yariY = Math.tan(11 * D2R) * 20, yariX = yariY * w / h;
    const vs = `varying vec3 vN; varying vec3 vNo; varying vec3 vP; varying vec3 vV;
      void main(){ vP = position; vNo = normal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
    const fs = `uniform float uTas, uRec, uArka, uZaman, uTohum, uDamar, uPip, uYari;
      uniform vec3 uKagit, uTas1, uTas2, uRecR;
      varying vec3 vN; varying vec3 vNo; varying vec3 vP; varying vec3 vV;
      float h3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float gur(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float pip(vec3 n, vec3 p){
        vec3 a = abs(n); vec2 uv; float v;
        if (a.x > a.y && a.x > a.z) { uv = p.yz; v = n.x > 0.0 ? 3.0 : 4.0; } else if (a.y > a.z) { uv = p.xz; v = n.y > 0.0 ? 1.0 : 6.0; } else { uv = p.xy; v = n.z > 0.0 ? 2.0 : 5.0; }
        uv /= uYari; float d = 9.0, o = 0.5;
        if (v == 1.0 || v == 3.0 || v == 5.0) d = min(d, length(uv));
        if (v >= 2.0) { d = min(d, length(uv - vec2(o, o))); d = min(d, length(uv + vec2(o, o))); }
        if (v >= 4.0) { d = min(d, length(uv - vec2(o, -o))); d = min(d, length(uv + vec2(o, -o))); }
        if (v == 6.0) { d = min(d, length(uv - vec2(o, 0.0))); d = min(d, length(uv + vec2(o, 0.0))); }
        return 1.0 - smoothstep(0.13, 0.16, d);
      }
      void main(){
        vec3 n = normalize(vN); if (uArka > 0.5) n = -n;
        vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
        float d = dot(n, L);
        float ton = d > 0.42 ? 1.0 : (d > -0.08 ? 0.86 : 0.72);
        float yT = mix(1.0, -1.0, uTas) * uYari * 1.25, yR = mix(1.0, -1.0, uRec) * uYari * 1.25;
        float tT = step(yT, vP.y), tR = step(yR, vP.y);
        vec3 c = uKagit;
        // taş: benekli (granit) ya da damarlı (mermer)
        vec3 q = vP / uYari;
        // benekler yuvarlak: hücre içinde merkeze uzaklık (3B hücre, yüzeyle kesişimi daire)
        vec3 c1 = q * 26.0, c2 = q * 19.0;
        float g1 = gur(q * 3.0 + uTohum);
        float b1 = step(0.78, h3(floor(c1) + uTohum)) * step(length(fract(c1) - 0.5), 0.3 + 0.12 * h3(floor(c1) + 5.0));
        float b2 = step(0.9, h3(floor(c2) + uTohum + 3.1)) * step(length(fract(c2) - 0.5), 0.26);
        vec3 tas = mix(uTas1 * 0.94, uTas1 * 1.05, g1);
        tas = mix(tas, uTas2, b1 * (1.0 - uDamar));
        tas = mix(tas, vec3(0.95, 0.94, 0.92), b2 * (1.0 - uDamar));
        float dm = abs(sin(q.x * 2.6 + gur(q * 1.6 + uTohum) * 5.0 + q.y * 1.4));
        tas = mix(tas, uTas2, (1.0 - smoothstep(0.03, 0.09, dm)) * uDamar);
        c = mix(c, tas, tT);
        // reçine: hafif girdap, kenarda parlama (fresnel), yanıp sönen pırıltılar
        vec3 V = normalize(vV);
        float fr = pow(1.0 - abs(dot(n, V)), 2.0);
        float dal = sin(q.x * 3.0 + sin(q.y * 2.4 + uTohum) * 2.0 + q.z * 1.8);
        vec3 rec = mix(uRecR * 0.94, uRecR * 1.06, 0.5 + 0.5 * dal);
        vec3 hq = floor(q * 9.0) + uTohum + 7.0;
        float pir = step(0.93, h3(hq)) * smoothstep(0.2, 1.0, sin(uZaman * 5.0 + h3(hq + 1.7) * 40.0)) * (1.0 - smoothstep(0.08, 0.2, length(fract(q * 9.0) - 0.5)));
        rec += vec3(pir) * 0.55 + vec3(fr) * 0.3;
        c = mix(c, rec, tR);
        c *= ton;
        // d6 noktaları (her malzemede)
        c = mix(c, vec3(0.16, 0.15, 0.15), pip(vNo, vP) * uPip);
        float a = mix(1.0, mix(0.42, 0.78, fr), tR);
        if (uArka > 0.5) { c *= 0.78; a = tR * 0.55; }
        float bant = (1.0 - smoothstep(0.0, 0.045 * uYari, abs(vP.y - yT))) * step(0.001, uTas) * step(uTas, 0.999);
        bant = max(bant, (1.0 - smoothstep(0.0, 0.045 * uYari, abs(vP.y - yR))) * step(0.001, uRec) * step(uRec, 0.999));
        c = mix(c, vec3(0.114, 0.114, 0.125), bant * 0.9);
        gl_FragColor = vec4(c, a);
      }`;
    const v3 = (hex) => { const c = new THREE.Color(hex); c.convertLinearToSRGB(); return new THREE.Vector3(c.r, c.g, c.b); };
    // Tasarımlar (kullanıcı 2026-10-22: ürettiğimiz şeyler açık renkli): her zar paletten başka bir açık tonla başlar, taşta
    // hepsi açık gri-bej benekli granite döner (ton ve benek yoğunluğu az farklı), reçinede başka bir pastel ton (yarı saydam)
    const TASARIM = DIKEY ? [
      { tur: 'd20', x: 0, y: 0.62, boy: 1.55 }, { tur: 'd12', x: -1.68, y: 0.3, boy: 1.15 }, { tur: 'd8', x: 1.66, y: 0.3, boy: 1.1 },
      { tur: 'd6', x: -0.8, y: -1.15, boy: 0.95 }, { tur: 'd4', x: 0.85, y: -1.15, boy: 1.05 },
    ] : [
      { tur: 'd20', x: 0, y: 0.1, boy: 1.65 }, { tur: 'd12', x: -1.95, y: 0.15, boy: 1.3 }, { tur: 'd8', x: 1.95, y: 0.1, boy: 1.25 },
      { tur: 'd6', x: -3.7, y: 0.0, boy: 1.0 }, { tur: 'd4', x: 3.75, y: -0.05, boy: 1.15 },
    ];
    // reçine arka yüzlerle üst üste biner ve koyulaşır: pastel ton %25 beyaza açılarak verilir
    const U = URUN_RENK, acik = (h) => '#' + [1, 3, 5].map((j) => Math.round(parseInt(h.slice(j, j + 2), 16) * 0.75 + 255 * 0.25).toString(16).padStart(2, '0')).join('');
    const RENK = [
      { kagit: U.lila, tas1: '#ddd6ca', tas2: '#8d867a', damar: 0, rec: acik(U.mercan) },      // d20: lila → bej granit → mercan reçine
      { kagit: U.gok, tas1: '#e2dcd1', tas2: '#9a9286', damar: 0, rec: acik(U.nane) },        // d12: gök → açık granit → nane reçine
      { kagit: U.limon, tas1: '#d6cfc3', tas2: '#857e72', damar: 0, rec: acik(U.gok) },       // d8: limon → kum granit → gök reçine
      { kagit: U.nane, tas1: '#e0dad0', tas2: '#948c80', damar: 0, rec: acik(U.lila) },       // d6: nane → açık granit → lila reçine
      { kagit: U.seftali, tas1: '#d9d2c6', tas2: '#8a8377', damar: 0, rec: acik(U.limon) },   // d4: şeftali → bej granit → limon reçine
    ];
    const GEO = {
      d20: (s) => new THREE.IcosahedronGeometry(s * 0.62), d12: (s) => new THREE.DodecahedronGeometry(s * 0.62),
      d8: (s) => new THREE.OctahedronGeometry(s * 0.66), d6: (s) => new THREE.BoxGeometry(s * 0.82, s * 0.82, s * 0.82),
      d4: (s) => new THREE.TetrahedronGeometry(s * 0.72),
    };
    // boy birimi yüksekliğe göre; yatay dizide x aralığı genişliğe yayılır (d4 ve d6 balonun kenarlarına yakın)
    const birim = Math.min(yariX / 4.6, yariY / 1.6) * (DIKEY ? 1.7 : 1.12);
    const kx = DIKEY ? birim : Math.max(birim, yariX * 0.74 / 3.75);
    const zarlar = TASARIM.map((t, i) => {
      const s = t.boy * birim, geo = GEO[t.tur](s);
      const R2 = RENK[i];
      const uni = () => ({
        uTas: { value: 0 }, uRec: { value: 0 }, uArka: { value: 0 }, uZaman: { value: 0 }, uTohum: { value: i * 3.7 + 1 },
        uDamar: { value: R2.damar }, uPip: { value: t.tur === 'd6' ? 1 : 0 }, uYari: { value: t.tur === 'd6' ? s * 0.41 : s * 0.6 },
        uKagit: { value: v3(R2.kagit) }, uTas1: { value: v3(R2.tas1) }, uTas2: { value: v3(R2.tas2) }, uRecR: { value: v3(R2.rec) },
      });
      const matOn = new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: vs, fragmentShader: fs, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const matArka = new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: vs, fragmentShader: fs, transparent: true, side: THREE.BackSide, depthWrite: false });
      matArka.uniforms.uArka.value = 1;
      const on = new THREE.Mesh(geo, matOn), arka = new THREE.Mesh(geo, matArka);
      arka.renderOrder = 0; on.renderOrder = 1;
      const kenarGeo = new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 10));
      const cm = new LineMaterial({ color: new THREE.Color(M), linewidth: 3.6 * PR, resolution: new THREE.Vector2(cv.width, cv.height) });
      const cmGizli = new LineMaterial({ color: new THREE.Color(M), linewidth: 2.0 * PR, resolution: new THREE.Vector2(cv.width, cv.height), transparent: true, opacity: 0, depthTest: false });
      const kenar = new LineSegments2(kenarGeo, cm), gizli = new LineSegments2(kenarGeo, cmGizli);
      kenar.renderOrder = 2; gizli.renderOrder = 3;
      const g = new THREE.Group(); g.add(arka, on, gizli, kenar);
      g.position.set(t.x * kx, t.y * birim, 0);
      sc.add(g);
      // dönüş ekseni ve hızı (tohumlu, sabit)
      const RR = rng(4100 + i * 17), eksen = new THREE.Vector3(RR() - 0.5, 1, RR() - 0.5).normalize(), hiz = (0.55 + RR() * 0.35) * (i % 2 ? -1 : 1), faz = RR() * 6;
      return { g, matOn, matArka, cm, cmGizli, eksen, hiz, faz, i };
    });
    const qq = new THREE.Quaternion(), egik = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, 0.3, 0.12));
    const sure01 = (n, a, d) => Math.max(0, Math.min(1, (n - a) / d));
    const cikis = (u) => { const c1 = 1.70158, c3 = c1 + 1; return u <= 0 ? 0 : 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
    const ciz = (n) => {
      if (n < K_BALON || n > SON + 1) return;
      const ki = Math.floor(n * 8 / 60) % 4;
      for (const z of zarlar) {
        const pop = sure01(n, POP[z.i], 12), tas = sure01(n, TAS[z.i], 18), rec = sure01(n, RECINE[z.i], 18);
        const sk = cikis(pop);
        z.g.scale.setScalar(Math.max(0.0001, sk));
        // giriş dönüşü hızlı başlar, sonra sabit hıza iner
        const t = (n - POP[z.i]) / 60, aci = z.faz + z.hiz * t * 2.2 + (1 - Math.min(1, pop * 1.4)) * 2.5 * Math.sign(z.hiz);
        qq.setFromAxisAngle(z.eksen, aci); z.g.quaternion.copy(egik).multiply(qq);
        for (const m of [z.matOn, z.matArka]) { m.uniforms.uTas.value = tas; m.uniforms.uRec.value = rec; m.uniforms.uZaman.value = n / 60; }
        z.cm.linewidth = (3.6 + [0, 0.35, -0.2, 0.2][ki]) * PR;
        z.cmGizli.opacity = rec * 0.32;
      }
      r.render(sc, kam);
    };
    ciz(K_BALON);
    return { div, ciz };
  }
}
