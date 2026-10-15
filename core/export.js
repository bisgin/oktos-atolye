// Dışa aktarma: binary STL ve 3MF (her parça ayrı nesne + renk; Bambu / Prusa / Orca açar).
import { makeZip } from './zip.js';

function pos3(r) {
  if (r.numProp === 3) return r.positions;
  const out = new Float32Array((r.positions.length / r.numProp) * 3);
  for (let i = 0, j = 0; i < r.positions.length; i += r.numProp, j += 3) {
    out[j] = r.positions[i]; out[j + 1] = r.positions[i + 1]; out[j + 2] = r.positions[i + 2];
  }
  return out;
}

// parts: [{ result, offset?: [x,y,z] }]
export function toSTL(parts) {
  const tris = parts.reduce((s, p) => s + p.result.triCount, 0);
  const buf = new ArrayBuffer(84 + tris * 50);
  const dv = new DataView(buf);
  const header = 'Oktos Workshop STL';
  for (let i = 0; i < header.length; i++) dv.setUint8(i, header.charCodeAt(i));
  dv.setUint32(80, tris, true);
  let o = 84;
  for (const p of parts) {
    const P = pos3(p.result);
    const I = p.result.indices;
    const [ox, oy, oz] = p.offset || [0, 0, 0];
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
      o += 12;
      for (const v of [a, b, c]) {
        dv.setFloat32(o, P[v] + ox, true); dv.setFloat32(o + 4, P[v + 1] + oy, true); dv.setFloat32(o + 8, P[v + 2] + oz, true);
        o += 12;
      }
      dv.setUint16(o, 0, true);
      o += 2;
    }
  }
  return new Blob([buf], { type: 'model/stl' });
}

// parts: [{ result, name, color: '#rrggbb', offset? }]
export function to3MF(parts) {
  const colors = [...new Set(parts.map((p) => (p.color || '#d9822b').toUpperCase()))];
  let objects = '';
  let items = '';
  parts.forEach((p, i) => {
    const P = pos3(p.result);
    const I = p.result.indices;
    const [ox, oy, oz] = p.offset || [0, 0, 0];
    const v = [];
    for (let k = 0; k < P.length; k += 3) {
      v.push(`<vertex x="${(P[k] + ox).toFixed(4)}" y="${(P[k + 1] + oy).toFixed(4)}" z="${(P[k + 2] + oz).toFixed(4)}"/>`);
    }
    const t = [];
    for (let k = 0; k < I.length; k += 3) t.push(`<triangle v1="${I[k]}" v2="${I[k + 1]}" v3="${I[k + 2]}"/>`);
    const ci = colors.indexOf((p.color || '#d9822b').toUpperCase());
    objects += `<object id="${i + 2}" name="${esc(p.name || 'part' + (i + 1))}" type="model" pid="1" pindex="${ci}"><mesh><vertices>${v.join('')}</vertices><triangles>${t.join('')}</triangles></mesh></object>`;
    items += `<item objectid="${i + 2}"/>`;
  });
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Application">Oktos Workshop</metadata>
<resources><basematerials id="1">${colors.map((c, i) => `<base name="color${i + 1}" displaycolor="${c}FF"/>`).join('')}</basematerials>${objects}</resources>
<build>${items}</build>
</model>`;
  const ct = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
  const zip = makeZip([
    { name: '[Content_Types].xml', data: ct },
    { name: '_rels/.rels', data: rels },
    { name: '3D/3dmodel.model', data: model },
  ]);
  return new Blob([zip], { type: 'model/3mf' });
}

function esc(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

export function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
