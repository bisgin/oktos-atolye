// Şemadan panel üretir. Her kontrol state[key]'i okur/yazar; değişiklikte onChange(key) çağrılır.
// Şema öğeleri:
//   { type: 'section', label }
//   { type: 'range', key, label, min, max, step, unit?, show?(s), max?(s) / min?(s) fonksiyon olabilir }
//   { type: 'select', key, label, options: [[value, labelKey]], show? }
//   { type: 'segmented', key, label, options: [[value, labelKey]], show? }
//   { type: 'toggle', key, label, hint?, show? }
//   { type: 'html', id, show? }
import { t } from './i18n.js';

const val = (v, s) => (typeof v === 'function' ? v(s) : v);

export function buildPanel(root, schema, state, onChange) {
  root.innerHTML = '';
  const rows = [];
  let section = root;

  for (const item of schema) {
    if (item.type === 'section') {
      const det = document.createElement('section');
      det.className = 'panel-section';
      det.innerHTML = `<h3>${t(item.label)}</h3>`;
      root.appendChild(det);
      section = det;
      rows.push({ item, el: det });
      continue;
    }
    const row = document.createElement('div');
    row.className = 'ctl ctl-' + item.type;
    section.appendChild(row);
    const rec = { item, el: row };

    if (item.type === 'range') {
      // fmt(s) verilirse sayı kutusu yerine okunur metin gösterilir (örn. köşe sayısı 13 → ∞).
      row.innerHTML = `<label><span>${t(item.label)}</span><span class="num">${item.fmt ? '<output></output>' : '<input type="number">'}<em>${item.unit ?? ''}</em></span></label><input type="range">`;
      const rng = row.querySelector('input[type=range]');
      const num = row.querySelector('input[type=number]') || row.querySelector('output');
      const set = (raw) => {
        const s = state;
        let v = Number(raw);
        if (!Number.isFinite(v)) return;
        v = clamp(v, val(item.min, s), val(item.max, s));
        state[item.key] = v;
        onChange(item.key);
      };
      rng.addEventListener('input', () => set(rng.value));
      if (!item.fmt) num.addEventListener('change', () => set(num.value));
      rec.sync = () => {
        const s = state;
        for (const inp of item.fmt ? [rng] : [num, rng]) {
          inp.min = val(item.min, s); inp.max = val(item.max, s); inp.step = item.step ?? 1;
        }
        rng.value = s[item.key];
        if (item.fmt) num.textContent = item.fmt(s[item.key], s);
        else if (document.activeElement !== num) num.value = round(s[item.key], item.step ?? 1);
      };
    } else if (item.type === 'select') {
      row.innerHTML = `<label><span>${t(item.label)}</span><select></select></label>`;
      const sel = row.querySelector('select');
      rec.fill = () => {
        sel.innerHTML = item.options.map(([v, l]) => `<option value="${v}">${t(l)}</option>`).join('');
      };
      rec.fill();
      sel.addEventListener('change', () => { state[item.key] = parseLike(sel.value, state[item.key]); onChange(item.key); });
      rec.sync = () => { sel.value = String(state[item.key]); };
    } else if (item.type === 'segmented') {
      row.innerHTML = `<span class="lbl">${t(item.label)}</span><div class="seg" role="group"></div>`;
      const seg = row.querySelector('.seg');
      seg.innerHTML = item.options.map(([v, l]) => `<button type="button" data-v="${v}">${t(l)}</button>`).join('');
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state[item.key] = parseLike(b.dataset.v, state[item.key]);
        onChange(item.key);
      });
      rec.sync = () => {
        seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(state[item.key])));
      };
    } else if (item.type === 'toggle') {
      row.innerHTML = `<label class="tgl"><input type="checkbox"><span class="sw"></span><span>${t(item.label)}${item.hint ? `<small>${t(item.hint)}</small>` : ''}</span></label>`;
      const cb = row.querySelector('input');
      cb.addEventListener('change', () => { state[item.key] = cb.checked; onChange(item.key); });
      rec.sync = () => { cb.checked = !!state[item.key]; };
    } else if (item.type === 'html') {
      row.id = item.id;
    }
    rows.push(rec);
  }

  // Bölüm: kendi show() koşulu doğru VE en az bir görünür kontrolü varsa görünür.
  const refresh = () => {
    let sec = null;
    let anyChild = false;
    const close = () => { if (sec) sec.el.hidden = !(anyChild && (!sec.item.show || sec.item.show(state))); };
    for (const r of rows) {
      if (r.item.type === 'section') { close(); sec = r; anyChild = false; continue; }
      const vis = r.item.show ? !!r.item.show(state) : true;
      r.el.hidden = !vis;
      if (vis) { anyChild = true; r.sync?.(); }
    }
    close();
  };
  refresh();
  return { refresh };
}

// Şablon kartları. presets: [{ id, label, color, desc? , thumb? }]
export function buildPresetGrid(root, presets, onPick) {
  root.innerHTML = '';
  root.className = 'preset-grid';
  for (const p of presets) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.dataset.id = p.id;
    b.innerHTML = `<span class="thumb" style="--c:${p.color}">${p.thumb ? `<img alt="" src="${p.thumb}">` : ''}</span><span class="pl">${t(p.label)}</span>`;
    b.addEventListener('click', () => onPick(p));
    root.appendChild(b);
  }
  return {
    mark(id) { root.querySelectorAll('.preset').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); },
    setThumb(id, url) {
      const img = root.querySelector(`.preset[data-id="${id}"] .thumb`);
      if (img) img.innerHTML = `<img alt="" src="${url}">`;
    },
  };
}

export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, step) => { const d = (String(step).split('.')[1] || '').length; return Number(v).toFixed(d); };
function parseLike(raw, prev) {
  if (typeof prev === 'number') return Number(raw);
  if (typeof prev === 'boolean') return raw === 'true';
  return raw;
}
