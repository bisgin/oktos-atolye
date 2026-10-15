// Vazo ağı: halka × açı ızgarası doğrudan hesaplanır. Birim mm, Z yukarı, taban z=0.
// r(θ, u) = siluet yarıçapı · kesit(θ − burgu) + kaburga + dalga + organik + ağız; u = z / H.
// Her efekt kendi yükseklik bandında (başlangıç %, bitiş %, geçiş %) uygulanır.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => {
  if (e1 <= e0) return x >= e1 ? 1 : 0;
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const bell = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));

export const SIDES_CIRCLE = 13; // köşe kaydırıcısında 13 = ∞ (çember)

// ---------- siluet: yarıçap çarpanı f(u), yoğunlukla ölçeklenir ----------
export const PROFILES = {
  straight: () => 0,
  bulge: (u) => Math.sin(Math.PI * u),
  belly: (u) => bell(u, 0.32, 0.26),
  neck: (u) => -bell(u, 0.8, 0.17),
  hourglass: (u) => -Math.sin(Math.PI * u),
  amphora: (u) => 0.95 * bell(u, 0.42, 0.22) - 0.65 * bell(u, 0.88, 0.08),
  bottle: (u) => lerp(0.55, -0.55, smooth(0.5, 0.78, u)),
  tulip: (u) => 0.55 * bell(u, 0.33, 0.28) + 0.8 * smooth(0.75, 1, u) ** 2,
  bowl: (u) => (Math.sqrt(u) - u) * 2.4,
  wave: (u, s) => Math.sin(TAU * s.waveCycles * u),
};

// ---------- kesit: birim yarıçap r(θ), çevrel çap = 1 ----------
function polygon(th, n) {
  const a = TAU / n;
  const x = ((th % a) + a) % a - a / 2;
  return Math.cos(Math.PI / n) / Math.cos(x);
}

export function section(th, kind, n, round, depth, aspect) {
  const circle = n >= SIDES_CIRCLE;
  let r;
  switch (kind) {
    case 'ellipse': {
      const c = Math.cos(th), s = Math.sin(th);
      r = aspect / Math.sqrt((aspect * c) ** 2 + s * s);
      break;
    }
    case 'squircle': {
      const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)) / aspect, p = 4;
      r = (c ** p + s ** p) ** (-1 / p);
      r /= Math.SQRT2 ** (1 / 2); // köşe ~1 olacak şekilde
      break;
    }
    case 'star': {
      if (circle) { r = 1; break; }
      const f = ((th * n) / TAU) % 1;
      const tri = Math.abs(f - 0.5) * 2; // uçlarda 1, iç köşede 0
      r = 1 - depth * (1 - tri);
      break;
    }
    case 'flower': {
      if (circle) { r = 1; break; }
      r = 1 - depth * (0.5 - 0.5 * Math.cos(n * th));
      break;
    }
    case 'gear': {
      if (circle) { r = 1; break; }
      const tooth = 0.5 + 0.5 * Math.tanh(5 * Math.cos(n * th));
      r = 1 - depth * (1 - tooth);
      break;
    }
    case 'plus': {
      const w = clamp(aspect, 0.15, 0.6);
      const c = Math.abs(Math.cos(th)) || 1e-9, s = Math.abs(Math.sin(th)) || 1e-9;
      const tA = Math.min(1 / c, w / s), tB = Math.min(w / c, 1 / s);
      r = Math.min(Math.max(tA, tB), 1); // kol ucu 1
      break;
    }
    default: // köşeli (poligon)
      r = circle ? 1 : polygon(th, n);
  }
  // Köşe yuvarlatma: köşeli biçimleri ortalama yarıçaplı çembere doğru yumuşatır.
  if (round > 0 && !circle) {
    const mean = kind === 'poly' ? (1 + Math.cos(Math.PI / n)) / 2
      : kind === 'star' || kind === 'gear' ? 1 - depth / 2 : null;
    if (mean !== null) r = lerp(r, mean, round);
  }
  return r;
}

// ---------- bant ağırlığı ----------
function band(u, start, end, fade) {
  const a = start / 100, b = end / 100, f = Math.max(0.001, fade / 100);
  if (b <= a) return 0;
  return smooth(a - 0.0001, a + f, u) * (1 - smooth(b - f, b + 0.0001, u));
}
// Burgu bant içinde birikir: altında 0, bant içinde yumuşak artış, üstünde tam açı.
function bandProgress(u, start, end) {
  const a = start / 100, b = end / 100;
  if (b <= a) return u >= b ? 1 : 0;
  const t = clamp((u - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function ribWave(x, style) {
  const f = x - Math.floor(x);
  if (style === 'round') return 0.5 - 0.5 * Math.cos(TAU * f);
  if (style === 'flat') return smooth(0.25, 0.32, f) * (1 - smooth(0.68, 0.75, f));
  return 1 - Math.abs(2 * f - 1); // V
}

function makeNoise(seed) {
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const terms = [];
  for (let i = 0; i < 7; i++) terms.push({ k: 1 + Math.floor(rnd() * 6), m: 0.6 + rnd() * 2.4, p: rnd() * TAU, a: 0.4 + rnd() });
  const norm = terms.reduce((s, t) => s + t.a, 0);
  return (th, u, scale) => terms.reduce((s, t) => s + t.a * Math.sin(t.k * th + t.m * scale * u * TAU + t.p), 0) / norm;
}

// ---------- ağ üretimi ----------
export function radiusFn(s) {
  const H = s.height;
  const rb = s.dBottom / 2, rt = s.dTop / 2;
  const prof = PROFILES[s.profile] || PROFILES.straight;
  const noise = makeNoise(s.noiseSeed);
  const maxR = Math.max(rb, rt);
  return (th, u) => {
    const R = lerp(rb, rt, u) + s.intensity * maxR * prof(u, s);
    const tw = s.twistOn ? (s.twist * Math.PI / 180) * bandProgress(u, s.twS, s.twE) : 0;
    const t = th - tw - (s.rotate * Math.PI) / 180;
    let k = section(t, s.kind, s.sides, s.round, s.depth, s.aspect);
    if (s.blendTop) {
      const kt = section(t, s.topKind, s.topSides, s.round, s.depth, s.aspect);
      k = lerp(k, kt, smooth(0.05, 0.95, u));
    }
    let r = R * k;
    if (s.ribsOn) r += s.ribDepth * band(u, s.ribS, s.ribE, s.ribF) * ribWave((s.ribCount * t) / TAU + s.ribHelix * u, s.ribStyle);
    if (s.waveOn) r += s.waveAmp * band(u, s.wvS, s.wvE, s.wvF) * Math.sin(TAU * s.waveN * u);
    if (s.noiseOn) r += s.noiseAmp * band(u, s.nzS, s.nzE, s.nzF) * noise(t, u, s.noiseScale);
    if (s.flare) r += s.flare * smooth(1 - s.flareZone / 100, 1, u) ** 2;
    if (s.ruffleN > 0 && s.ruffleDepth > 0) r += s.ruffleDepth * smooth(1 - s.flareZone / 100, 1, u) ** 2 * Math.sin(s.ruffleN * th);
    return Math.max(r, 2);
  };
}

export function resolution(s) {
  const q = s._thumb || s._drag ? 'draft' : s.quality; // sürüklerken taslak
  let nT = q === 'draft' ? 96 : q === 'fine' ? 320 : 192;
  if (s.ribsOn) nT = Math.max(nT, Math.min(480, s.ribCount * 8));
  if (s.kind !== 'poly' && s.kind !== 'ellipse') nT = Math.max(nT, Math.min(480, s.sides * 16));
  const step = q === 'draft' ? 2.2 : q === 'fine' ? 0.6 : 1.1;
  let nZ = clamp(Math.ceil(s.height / step), 40, 700);
  const budget = q === 'fine' ? 900000 : 450000;
  const walls = s.style === 'hollow' ? 2 : 1;
  if (nT * nZ * 2 * walls > budget) nZ = Math.max(40, Math.floor(budget / (nT * 2 * walls)));
  return { nT, nZ };
}

// Halkanın 2B dış normalleri (CCW sıralı noktalar için).
function ringNormals(xs, ys, n) {
  const nx = new Float64Array(n), ny = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const a = (j - 1 + n) % n, b = (j + 1) % n;
    const tx = xs[b] - xs[a], ty = ys[b] - ys[a];
    const l = Math.hypot(tx, ty) || 1;
    nx[j] = ty / l; ny[j] = -tx / l;
  }
  return { nx, ny };
}

export function vaseMesh(s) {
  const { nT, nZ } = resolution(s);
  const H = s.height;
  const rf = radiusFn(s);
  const hollow = s.style === 'hollow';
  const base = hollow ? clamp(s.base, 0, H - 2) : 0;
  const wall = s.wall;
  const pos = [];
  const idx = [];
  const cos = new Float64Array(nT), sin = new Float64Array(nT);
  for (let j = 0; j < nT; j++) { cos[j] = Math.cos((TAU * j) / nT); sin[j] = Math.sin((TAU * j) / nT); }

  const ringAt = (z) => {
    const u = z / H;
    const xs = new Float64Array(nT), ys = new Float64Array(nT);
    for (let j = 0; j < nT; j++) {
      const r = rf((TAU * j) / nT, u);
      xs[j] = r * cos[j]; ys[j] = r * sin[j];
    }
    return { xs, ys };
  };
  const pushRing = (xs, ys, z) => {
    const start = pos.length / 3;
    for (let j = 0; j < nT; j++) pos.push(xs[j], ys[j], z);
    return start;
  };
  const quads = (a, b, flip) => {
    for (let j = 0; j < nT; j++) {
      const j1 = (j + 1) % nT;
      const p = a + j, q = a + j1, r = b + j1, t = b + j;
      if (flip) idx.push(p, r, q, p, t, r);
      else idx.push(p, q, r, p, r, t);
    }
  };
  const fan = (ring, z, up) => {
    const c = pos.length / 3;
    pos.push(0, 0, z);
    for (let j = 0; j < nT; j++) {
      const j1 = (j + 1) % nT;
      if (up) idx.push(c, ring + j, ring + j1);
      else idx.push(c, ring + j1, ring + j);
    }
  };

  // Dış yüzey
  const outer = [];
  for (let i = 0; i <= nZ; i++) {
    const z = (H * i) / nZ;
    const { xs, ys } = ringAt(z);
    outer.push(pushRing(xs, ys, z));
  }
  for (let i = 0; i < nZ; i++) quads(outer[i], outer[i + 1], false);

  if (!hollow) {
    fan(outer[0], 0, false);
    fan(outer[nZ], H, true);
    return { positions: new Float32Array(pos), indices: new Uint32Array(idx), nT, nZ };
  }

  // İç yüzey: her halkada 2B normal boyunca duvar kadar içeri.
  const inner = [];
  const nIn = Math.max(2, Math.round((nZ * (H - base)) / H));
  for (let i = 0; i <= nIn; i++) {
    const z = base + ((H - base) * i) / nIn;
    const { xs, ys } = ringAt(z);
    const { nx, ny } = ringNormals(xs, ys, nT);
    for (let j = 0; j < nT; j++) {
      const r = Math.hypot(xs[j], ys[j]);
      const d = Math.min(wall, r - 1);
      xs[j] -= nx[j] * d; ys[j] -= ny[j] * d;
    }
    inner.push(pushRing(xs, ys, z));
  }
  for (let i = 0; i < nIn; i++) quads(inner[i], inner[i + 1], true);
  // Ağız halkası (dış üst → iç üst), normal +z
  quads(outer[nZ], inner[nIn], false);

  if (base > 0) {
    fan(outer[0], 0, false);
    fan(inner[0], base, true);
  } else {
    // Altı açık saksı: dış alt halka iç alt halkaya bağlanır, normal −z.
    quads(outer[0], inner[0], true);
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx), nT, nZ };
}
