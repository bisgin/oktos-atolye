// Kutu / bölmeli tepsi / taban plakası geometrisi. Birim mm, Z yukarı, model tablanın ortasında.
// Gridfinity ölçüleri açık standarttan (docs/arastirma-2026-10.md).
import * as C from '../../core/csg.js';

export const GF = {
  P: 42, U: 7, GAP: 0.5, R: 3.75, PLATE_R: 4,
  FOOT_H: 4.75,
  LIP_TOP: 4.0,          // 4.4 bıçak kenar, üstten 0.4 kırpılmış
  PLATE_H: 4.25,         // 4.65 cep, üstten 0.4 kırpılmış
  MAG_D: 6.5, MAG_H: 2.4, SCREW_D: 3, HOLE_OFF: 13,
};

// ---------- ortak parçalar ----------

// Bölme duvarları: iç alanı cols × rows eşit bölmeye ayırır.
function dividers(wi, di, cols, rows, t, z0, z1) {
  const out = [];
  const h = z1 - z0;
  if (h <= 0) return out;
  for (let k = 1; k < cols; k++) {
    const x = -wi / 2 + (k * (wi + t)) / cols - t;
    out.push(C.box(t, di + 0.2, h, x, -di / 2 - 0.1, z0));
  }
  for (let k = 1; k < rows; k++) {
    const y = -di / 2 + (k * (di + t)) / rows - t;
    out.push(C.box(wi + 0.2, t, h, -wi / 2 - 0.1, y, z0));
  }
  return out;
}

// Her satırın arka duvarına yaslı, altı 45° destekli etiket rafı.
function labelShelves(wi, di, rows, t, zTop) {
  const out = [];
  const pitch = (di + t) / rows;
  const dep = Math.min(12, pitch * 0.45);
  const th = 1.2;
  for (let j = 0; j < rows; j++) {
    const yb = -di / 2 + (j + 1) * pitch - t; // satırın arka kenarı
    const x0 = -wi / 2 - 0.1, x1 = wi / 2 + 0.1;
    const pts = [];
    for (const x of [x0, x1]) {
      pts.push([x, yb + 0.1, zTop], [x, yb - dep, zTop], [x, yb - dep, zTop - th], [x, yb + 0.1, zTop - th - dep]);
    }
    out.push(C.hullPts(pts));
  }
  return out;
}

// Her satırın önünde içbükey kepçe: parça çıkarmayı kolaylaştırır.
function scoops(wi, di, rows, t, zFloor, hCav) {
  const out = [];
  const pitch = (di + t) / rows;
  const r = Math.max(2, Math.min(pitch * 0.4, hCav * 0.6, 16));
  for (let j = 0; j < rows; j++) {
    const yf = -di / 2 + j * pitch; // satırın ön kenarı
    const block = C.box(wi + 0.2, r, r, -wi / 2 - 0.1, yf - 0.05, zFloor - 0.05);
    let rod = C.cyl(wi + 2, r, r, 64);
    rod = C.move(rod, 0, 0, -(wi + 2) / 2);
    rod = C.rot(rod, 0, 90, 0);
    rod = C.move(rod, 0, yf + r, zFloor + r);
    out.push(C.sub(block, rod));
  }
  return out;
}

// Bölme tabanlarında süzgeç delikleri.
function floorHoles(wi, di, cols, rows, t, z0, z1) {
  const out = [];
  const pw = (wi + t) / cols, pd = (di + t) / rows;
  const cw = pw - t, cd = pd - t;
  const step = 8, rad = 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = -wi / 2 + i * pw, y0 = -di / 2 + j * pd;
      const nx = Math.floor((cw - 6) / step) + 1, ny = Math.floor((cd - 6) / step) + 1;
      if (nx < 1 || ny < 1) continue;
      const ox = x0 + (cw - (nx - 1) * step) / 2, oy = y0 + (cd - (ny - 1) * step) / 2;
      for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
        if (out.length > 600) return out;
        out.push(C.cyl(z1 - z0, rad, rad, 16, ox + a * step, oy + b * step, z0));
      }
    }
  }
  return out;
}

// ---------- Serbest kutu ----------
export function customBin(s) {
  if (s.shape === 'round') return roundBin(s);
  const { w, d, h, wall, floor, div, cols, rows } = s;
  const r = Math.min(s.r, w / 2 - 1, d / 2 - 1);
  const wi = w - 2 * wall, di = d - 2 * wall;
  const ri = Math.max(0.3, r - wall);
  const LH = 2;

  let body = C.extrude(C.rrect(w, d, r), h);
  const cuts = [C.extrude(C.rrect(wi, di, ri), h + 2, floor)];
  if (s.lip) {
    // Üstte duvar LH kadar uzar; altta dış kenar içeri basamaklanır, kutular üst üste oturur.
    body = C.add(body, C.extrude(C.sub(C.rrect(w, d, r), C.rrect(wi, di, ri)), LH + 0.01, h - 0.01));
    const foot = C.rrect(w - 2 * (wall + 0.3), d - 2 * (wall + 0.3), Math.max(0.3, r - wall - 0.3));
    cuts.push(C.extrude(C.sub(C.rrect(w + 2, d + 2, r + 1), foot), LH, -0.01));
  }
  if (s.holes && !s._thumb) cuts.push(...floorHoles(wi, di, cols, rows, div, -1, floor + 1)); // küçük resimde delik atlanır (pahalı)
  body = C.subAll(body, cuts);

  const inside = [...dividers(wi, di, cols, rows, div, floor - 0.01, h)];
  if (s.shelf) inside.push(...labelShelves(wi, di, rows, div, h));
  if (s.scoop) inside.push(...scoops(wi, di, rows, div, floor - 0.01, h - floor));
  if (inside.length) {
    // İç parçalar dış duvarı taşmasın diye iç alana kırpılır.
    const clip = C.extrude(C.rrect(wi + 0.02, di + 0.02, ri), h - floor + 0.02, floor - 0.02);
    body = C.add(body, C.inter(C.union(inside), clip));
  }
  return body;
}

// Yuvarlak organizer / kalemlik: cols = dilim sayısı, rows = iç halka sayısı.
function roundBin(s) {
  const { w, h, wall, floor, div, cols, rows } = s;
  const R = w / 2, Ri = R - wall;
  const seg = 128;
  let body = C.extrude(C.circle2(R, seg), h);
  const cuts = [C.extrude(C.circle2(Ri, seg), h + 2, floor)];
  if (s.holes && !s._thumb) {
    for (let a = 0, n = 0; a < 6 && n < 300; a++) {
      const rr = (Ri - 4) * (a / 5);
      const k = a === 0 ? 1 : Math.floor((2 * Math.PI * rr) / 8);
      for (let i = 0; i < k; i++, n++) {
        const th = (i / k) * Math.PI * 2;
        cuts.push(C.cyl(floor + 2, 2, 2, 16, rr * Math.cos(th), rr * Math.sin(th), -1));
      }
    }
  }
  body = C.subAll(body, cuts);
  const inside = [];
  const hub = rows > 1 ? Ri / rows : 0;
  if (cols > 1) {
    for (let i = 0; i < cols; i++) {
      let b = C.box(Ri - hub + 0.2, div, h - floor, hub, -div / 2, floor - 0.01);
      inside.push(C.rot(b, 0, 0, (360 * i) / cols + 90));
    }
  }
  for (let k = 1; k < rows; k++) {
    const rr = (Ri * k) / rows;
    inside.push(C.extrude(C.sub(C.circle2(rr + div / 2, seg), C.circle2(rr - div / 2, seg)), h - floor, floor - 0.01));
  }
  if (inside.length) {
    const clip = C.extrude(C.circle2(Ri + 0.01, seg), h - floor + 0.02, floor - 0.02);
    body = C.add(body, C.inter(C.union(inside), clip));
  }
  return body;
}

// ---------- Gridfinity kutu ----------
const inset = (W, D, R, k, rMin = 0.8) => C.rrect(W - 2 * k, D - 2 * k, Math.max(rMin, R - k));

function gfFeet(gx, gy) {
  const s = GF.P - GF.GAP;
  const feet = [];
  for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) {
    const cx = (i - (gx - 1) / 2) * GF.P, cy = (j - (gy - 1) / 2) * GF.P;
    const a = C.rrect(s - 5.9, s - 5.9, 0.8), b = C.rrect(s - 4.3, s - 4.3, 1.6), c = C.rrect(s, s, GF.R);
    const foot = C.union([C.loft(a, 0, b, 0.8), C.extrude(b, 1.81, 0.8), C.loft(b, 2.6, c, GF.FOOT_H + 0.01)]);
    feet.push(C.move(foot, cx, cy, 0));
  }
  return feet;
}

function cellHoles(gx, gy, mode, d, h, z, cornersOnly) {
  if (mode === 'none') return [];
  const out = [];
  const o = GF.HOLE_OFF;
  for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) {
    const cx = (i - (gx - 1) / 2) * GF.P, cy = (j - (gy - 1) / 2) * GF.P;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (mode === 'corner') {
        const outerX = (sx < 0 && i === 0) || (sx > 0 && i === gx - 1);
        const outerY = (sy < 0 && j === 0) || (sy > 0 && j === gy - 1);
        if (!(outerX && outerY)) continue;
      }
      out.push(C.cyl(h, d / 2, d / 2, 32, cx + sx * o, cy + sy * o, z));
    }
  }
  return out;
}

export function gridBin(s) {
  const { gx, gy, gz, gwall: wall, gfloor, gdiv: div, gcols: cols, grows: rows } = s;
  const W = gx * GF.P - GF.GAP, D = gy * GF.P - GF.GAP, R = GF.R;
  const Hb = gz * GF.U;
  const zf = GF.FOOT_H + gfloor;
  const lip = s.lipStyle !== 'none';
  const top = lip ? Hb + GF.LIP_TOP : Hb;
  const wi = W - 2 * wall, di = D - 2 * wall;

  let body = C.union([...gfFeet(gx, gy), C.extrude(C.rrect(W, D, R), top - GF.FOOT_H + 0.01, GF.FOOT_H - 0.01)]);

  const cav = [];
  if (lip) {
    // Dudak cebi alttan üste: iç 2.6 → 45° → 0.7 → düz → 45° → 0.4 (kırpılmış bıçak kenar)
    const zs = Math.max(zf + 0.5, Hb - Math.max(0, 2.6 - wall));
    cav.push(C.extrude(inset(W, D, R, wall), zs - zf + 0.01, zf));
    if (wall < 2.6) cav.push(C.loft(inset(W, D, R, wall), zs, inset(W, D, R, 2.6), Hb));
    cav.push(C.loft(inset(W, D, R, 2.6), Hb - 0.01, inset(W, D, R, 0.7), Hb + 1.9));
    cav.push(C.extrude(inset(W, D, R, 0.7), 1.81, Hb + 1.9));
    cav.push(C.loft(inset(W, D, R, 0.7), Hb + 3.7, inset(W, D, R, 0.4), top + 0.01));
    cav.push(C.extrude(inset(W, D, R, 0.4), 1, top));
  } else {
    cav.push(C.extrude(inset(W, D, R, wall), top - zf + 1, zf));
  }
  cav.push(...cellHoles(gx, gy, s.magnets, GF.MAG_D, GF.MAG_H, -0.01));
  cav.push(...cellHoles(gx, gy, s.screws, GF.SCREW_D, 6, -0.01));
  body = C.subAll(body, cav);

  const zIn = lip ? Hb - 0.5 : Hb;
  const inside = [...dividers(wi, di, cols, rows, div, zf - 0.01, zIn)];
  if (s.gshelf) inside.push(...labelShelves(wi, di, rows, div, zIn));
  if (s.gscoop) inside.push(...scoops(wi, di, rows, div, zf - 0.01, zIn - zf));
  if (inside.length) {
    const clip = C.extrude(inset(W, D, R, wall - 0.01), zIn - zf + 0.02, zf - 0.02);
    body = C.add(body, C.inter(C.union(inside), clip));
  }
  return body;
}

// ---------- Taban plakası ----------
export function baseplate(s, gxOverride, gyOverride) {
  const gx = gxOverride ?? s.px, gy = gyOverride ?? s.py;
  const solid = s.plateStyle === 'solid';
  const zb = solid ? s.pfloor : 0;
  const top = zb + GF.PLATE_H;
  const gw = gx * GF.P, gd = gy * GF.P;
  const pad = s.fillPad && s.fitW && s.fitD;
  const W = pad ? Math.max(gw, s.fitW) : gw, D = pad ? Math.max(gd, s.fitD) : gd;

  let plate = C.extrude(C.rrect(W, D, GF.PLATE_R), top);
  const cuts = [];
  for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) {
    const cx = (i - (gx - 1) / 2) * GF.P, cy = (j - (gy - 1) / 2) * GF.P;
    const a = C.rrect(36.3, 36.3, 1.15), b = C.rrect(37.7, 37.7, 1.85), c = C.rrect(41.2, 41.2, 3.6);
    const pocket = [C.loft(a, zb - 0.01, b, zb + 0.7), C.extrude(b, 1.81, zb + 0.7), C.loft(b, zb + 2.5, c, top + 0.01), C.extrude(c, 1, top)];
    if (!solid) pocket.push(C.extrude(a, 1, -0.5));
    cuts.push(C.move(C.union(pocket), cx, cy, 0));
  }
  if (solid) {
    cuts.push(...cellHoles(gx, gy, s.pmag, GF.MAG_D, GF.MAG_H + 0.01, zb - GF.MAG_H));
    if (s.pscrew !== 'none') {
      // Havşa başlı vida: gövde Ø3.4 delik + üstte Ø7.4 koni.
      cuts.push(...cellHoles(gx, gy, s.pscrew, 3.4, zb + 1, -0.5));
      const cones = [];
      const o = GF.HOLE_OFF;
      for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) {
        const cx = (i - (gx - 1) / 2) * GF.P, cy = (j - (gy - 1) / 2) * GF.P;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          if (s.pscrew === 'corner') {
            const ox = (sx < 0 && i === 0) || (sx > 0 && i === gx - 1);
            const oy = (sy < 0 && j === 0) || (sy > 0 && j === gy - 1);
            if (!(ox && oy)) continue;
          }
          cones.push(C.cyl(2.01, 1.7, 3.7, 32, cx + sx * o, cy + sy * o, zb - 2));
        }
      }
      cuts.push(...cones);
    }
  }
  return C.subAll(plate, cuts);
}
