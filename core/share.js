// Ayarları URL'ye yazar / okur. Yalnızca varsayılandan farklı değerler saklanır, link kısa kalır.
export function encodeState(state, defaults) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) {
    if (k.startsWith('_')) continue;
    const d = defaults[k];
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
    const dv = typeof d === 'object' ? JSON.stringify(d) : String(d);
    if (val !== dv) p.set(k, val);
  }
  return p.toString();
}

export function decodeState(search, defaults) {
  const p = new URLSearchParams(search);
  const out = {};
  for (const [k, raw] of p) {
    if (!(k in defaults)) continue;
    const d = defaults[k];
    if (typeof d === 'number') { const n = Number(raw); if (Number.isFinite(n)) out[k] = n; }
    else if (typeof d === 'boolean') out[k] = raw === 'true';
    else if (typeof d === 'object') { try { out[k] = JSON.parse(raw); } catch (_) { /* bozuk link */ } }
    else out[k] = raw;
  }
  return out;
}

export function shareURL(state, defaults) {
  const q = encodeState(state, defaults);
  return location.origin + location.pathname + (q ? '?' + q : '');
}
