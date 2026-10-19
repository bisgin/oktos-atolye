// 3B yazı için yazı tipleri (OFL-1.1, @fontsource): Schibsted Grotesk 5.3.0 (varsayılan) ve el yazısı Dancing Script
// 5.2.8 ('el': pasta süsü, not). latin + latin-ext birlikte yüklenir, böylece Ş Ğ İ ı dahil tüm Türkçe harfler çıkar.
// Harfler çokgenlere (mm, y yukarı) çevrilir. El yazısında harfler üst üste biner: kesiti NonZero kuralıyla al.
import opentype from 'opentype';

const AILE = {
  schibsted: 'https://cdn.jsdelivr.net/npm/@fontsource/schibsted-grotesk@5.3.0/files/schibsted-grotesk',
  el: 'https://cdn.jsdelivr.net/npm/@fontsource/dancing-script@5.2.8/files/dancing-script',
};
const cache = new Map();

export async function loadFont(weight = 700, aile = 'schibsted') {
  const key = `${aile}|${weight}`;
  if (!cache.has(key)) {
    cache.set(key, Promise.all(['latin', 'latin-ext'].map(async (sub) => {
      const res = await fetch(`${AILE[aile] || AILE.schibsted}-${sub}-${weight}-normal.woff`);
      return opentype.parse(await res.arrayBuffer());
    })));
  }
  return cache.get(key);
}

function glyphFor(fonts, ch) {
  for (const f of fonts) {
    const g = f.charToGlyph(ch);
    if (g && g.index !== 0) return { f, g };
  }
  return { f: fonts[0], g: fonts[0].charToGlyph(ch) };
}

// opentype yol komutlarını kapalı çokgenlere çevirir (eğriler örneklenir, y ekseni çevrilir).
function toPolys(commands, steps = 6) {
  const polys = [];
  let cur = null, x = 0, y = 0;
  const push = (px, py) => cur.push([px, -py]);
  for (const c of commands) {
    if (c.type === 'M') { cur = []; polys.push(cur); x = c.x; y = c.y; push(x, y); }
    else if (c.type === 'L') { x = c.x; y = c.y; push(x, y); }
    else if (c.type === 'Q') {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        push(u * u * x + 2 * u * t * c.x1 + t * t * c.x, u * u * y + 2 * u * t * c.y1 + t * t * c.y);
      }
      x = c.x; y = c.y;
    } else if (c.type === 'C') {
      for (let i = 1; i <= steps + 2; i++) {
        const t = i / (steps + 2), u = 1 - t;
        push(u * u * u * x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          u * u * u * y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y);
      }
      x = c.x; y = c.y;
    }
  }
  // Tekrarlanan son noktayı ve çok kısa konturları ayıkla.
  return polys.map((p) => {
    const a = p[0], b = p[p.length - 1];
    if (p.length > 1 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) p.pop();
    return p;
  }).filter((p) => p.length >= 3);
}

// size: harf boyu (em), mm. Dönüş: { glyphs: [{ ch, polys, x0, adv, box }], polys (hepsi), width, cap }
export function textPolys(fonts, text, size, { spacing = 0 } = {}) {
  const glyphs = [];
  let x = 0;
  for (const ch of text) {
    const { f, g } = glyphFor(fonts, ch);
    const scale = size / f.unitsPerEm;
    const polys = toPolys(g.getPath(x, 0, size).commands);
    const adv = g.advanceWidth * scale;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of polys) for (const [px, py] of p) {
      minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    glyphs.push({ ch, polys, x0: x, adv, box: polys.length ? { minX, maxX, minY, maxY } : null });
    x += adv + spacing;
  }
  const f0 = fonts[0];
  return {
    glyphs,
    polys: glyphs.flatMap((g) => g.polys),
    width: Math.max(0, x - spacing),
    cap: ((f0.tables.os2?.sCapHeight || f0.unitsPerEm * 0.7) / f0.unitsPerEm) * size,
  };
}
