// Şemadan panel üretir. Her kontrol state[key]'i okur/yazar; değişiklikte onChange(key) çağrılır.
// Şema öğeleri:
//   { type: 'section', label }
//   { type: 'range', key, label, min, max, step, unit?, show?(s), max?(s) / min?(s) fonksiyon olabilir }
//   { type: 'select', key, label, options: [[value, labelKey]], show? }
//   { type: 'segmented', key, label, options: [[value, labelKey]], show? }
//   { type: 'toggle', key, label, hint?, show? }
//   { type: 'swatch', key, label, options: [[hex, labelKey]] }   renk kartelası
//   { type: 'advanced', label }   sonraki tüm bölümler katlanır "Atölye ayarları" içine girer
//   { type: 'text', key, label, max?, placeholder?, show? }   tek satır metin (yazdıkça 250 ms sonra uygulanır)
//   { type: 'file', key, label, accept?, hint?, onFile(file, state) → Promise, show? }   dosya seç (ör. fotoğraf)
//   { type: 'html', id, show? }
// Her kontrol disabled?(s) alabilir: gizlemek yerine pasifleştirir (düzen zıplamaz).
import { t } from './i18n.js';

const val = (v, s) => (typeof v === 'function' ? v(s) : v);
let uid = 0;
const nid = (p) => `${p}-${++uid}`;
const advOpen = new Map(); // katlanır bölümün açık/kapalı durumu yeniden kurulumda korunur

export function buildPanel(root, schema, state, onChange) {
  root.innerHTML = '';
  const rows = [];
  let section = root;
  let container = root;

  for (const item of schema) {
    if (item.type === 'advanced') {
      const det = document.createElement('details');
      det.className = 'panel-adv';
      det.open = advOpen.get(item.label) ?? false;
      det.innerHTML = `<summary>${t(item.label)}</summary>`;
      det.addEventListener('toggle', () => advOpen.set(item.label, det.open));
      root.appendChild(det);
      container = det;
      section = det;
      continue;
    }
    if (item.type === 'section') {
      const det = document.createElement('section');
      det.className = 'panel-section';
      det.innerHTML = `<h3>${t(item.label)}</h3>`;
      container.appendChild(det);
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
      // Kaydırıcı etiketin dışında durduğu için adını aria-labelledby ile alır ("Genişlik mm").
      const lid = nid('l'), uidUnit = nid('u');
      row.innerHTML = `<label><span id="${lid}">${t(item.label)}</span><span class="num">${item.fmt ? '<output></output>' : '<input type="number">'}<em id="${uidUnit}">${item.unit ? t(item.unit) : ''}</em></span></label><input type="range" aria-labelledby="${lid} ${uidUnit}">`;
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
      // Sürüklerken _drag işareti: araç taslak çözünürlükte hesaplar; bırakınca tam çözünürlük.
      rng.addEventListener('input', () => { state._drag = true; set(rng.value); });
      rng.addEventListener('change', () => { state._drag = false; set(rng.value); });
      if (!item.fmt) num.addEventListener('change', () => { state._drag = false; set(num.value); });
      rec.sync = () => {
        const s = state;
        const dis = item.disabled ? !!item.disabled(s) : false;
        row.classList.toggle('is-disabled', dis);
        for (const inp of item.fmt ? [rng] : [num, rng]) {
          inp.min = val(item.min, s); inp.max = val(item.max, s); inp.step = item.step ?? 1;
          inp.disabled = dis;
        }
        rng.value = s[item.key];
        if (item.fmt) {
          num.textContent = item.fmt(s[item.key], s);
          rng.setAttribute('aria-valuetext', num.textContent);
        } else if (document.activeElement !== num) num.value = round(s[item.key], item.step ?? 1);
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
      const lid = nid('g');
      row.innerHTML = `<span class="lbl${item.hideLabel ? ' sr-only' : ''}" id="${lid}">${t(item.label)}</span><div class="seg" role="group" aria-labelledby="${lid}"></div>`;
      const seg = row.querySelector('.seg');
      seg.innerHTML = item.options.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="false">${t(l)}</button>`).join('');
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state[item.key] = parseLike(b.dataset.v, state[item.key]);
        onChange(item.key);
      });
      rec.sync = () => {
        seg.querySelectorAll('button').forEach((b) => {
          const on = b.dataset.v === String(state[item.key]);
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
      };
    } else if (item.type === 'swatch') {
      const lid = nid('s');
      row.innerHTML = `<span class="lbl${item.hideLabel ? ' sr-only' : ''}" id="${lid}">${t(item.label)}</span><div class="swatches" role="group" aria-labelledby="${lid}"></div>`;
      const box = row.querySelector('.swatches');
      box.innerHTML = item.options.map(([v, l]) =>
        `<button type="button" class="sw-btn" data-v="${v}" style="--c:${v}" aria-pressed="false" aria-label="${t(l)}" title="${t(l)}"></button>`).join('');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state[item.key] = b.dataset.v;
        onChange(item.key);
      });
      rec.sync = () => box.querySelectorAll('button').forEach((b) => {
        const on = b.dataset.v === String(state[item.key]);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    } else if (item.type === 'toggle') {
      row.innerHTML = `<label class="tgl"><input type="checkbox"><span class="sw"></span><span>${t(item.label)}${item.hint ? `<small>${t(item.hint)}</small>` : ''}</span></label>`;
      const cb = row.querySelector('input');
      cb.addEventListener('change', () => { state[item.key] = cb.checked; onChange(item.key); });
      rec.sync = () => { cb.checked = !!state[item.key]; };
    } else if (item.type === 'text') {
      row.innerHTML = `<label><span>${t(item.label)}</span><input type="text" maxlength="${item.max ?? 200}" spellcheck="false" autocomplete="off" autocapitalize="off"></label>`;
      const inp = row.querySelector('input');
      if (item.placeholder) inp.placeholder = t(item.placeholder);
      let bekle = null;
      const uygula = () => { clearTimeout(bekle); if (state[item.key] === inp.value) return; state[item.key] = inp.value; onChange(item.key); };
      inp.addEventListener('input', () => { clearTimeout(bekle); bekle = setTimeout(uygula, 250); });
      inp.addEventListener('change', uygula);
      rec.sync = () => { if (document.activeElement !== inp) inp.value = state[item.key] ?? ''; };
    } else if (item.type === 'file') {
      row.innerHTML = `<label class="dosya"><span>${t(item.label)}</span><input type="file" accept="${item.accept || 'image/*'}"></label>${item.hint ? `<small>${t(item.hint)}</small>` : ''}`;
      const inp = row.querySelector('input');
      inp.addEventListener('change', async () => {
        const f = inp.files?.[0];
        if (!f) return;
        await item.onFile(f, state);
        onChange(item.key);
      });
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
    mark(id) {
      root.querySelectorAll('.preset').forEach((b) => {
        b.classList.toggle('on', b.dataset.id === id);
        b.setAttribute('aria-pressed', String(b.dataset.id === id));
      });
    },
    setThumb(id, url) {
      const img = root.querySelector(`.preset[data-id="${id}"] .thumb`);
      if (img) img.innerHTML = `<img alt="" src="${url}">`;
    },
  };
}

// Bildirim: kalıcı bir durum bölgesi (ekran okuyucu her mesajı okur). Süre metin uzunluğuna göre.
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), Math.max(2600, msg.length * 55));
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, step) => { const d = (String(step).split('.')[1] || '').length; return Number(v).toFixed(d); };
function parseLike(raw, prev) {
  if (typeof prev === 'number') return Number(raw);
  if (typeof prev === 'boolean') return raw === 'true';
  return raw;
}
