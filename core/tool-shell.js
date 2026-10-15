// Ortak araç kabuğu: düzen, görüntüleyici, panel, şablonlar, ölçüler, dışa aktarma, paylaşım, dil.
// Araç şunları verir:
//   id, strings, defaults, modes?: [[id, labelKey]], schema(state), presets: [{id, mode?, label, color, values}]
//   enforce(state) → notlar (değerleri yerinde düzeltir)
//   build(state) → { parts: [{ result, name, color?, ghost?, offset? }], info: [[labelKey, text]] }
import { initCSG } from './csg.js';
import { Viewer } from './viewer.js';
import { buildPanel, buildPresetGrid, toast } from './ui.js';
import { t, addStrings, applyI18n, setLang, getLang, onLang } from './i18n.js';
import { decodeState, shareURL } from './share.js';
import { toSTL, to3MF, download } from './export.js';

export const PRINTERS = [
  ['p1s', 'Bambu P1S / X1C / A1', [256, 256, 256]],
  ['a1mini', 'Bambu A1 mini', [180, 180, 180]],
  ['h2d', 'Bambu H2D', [350, 320, 325]],
  ['mk4', 'Prusa MK4', [250, 210, 220]],
  ['ender3', 'Ender 3 / K1', [220, 220, 250]],
  ['k1max', 'K1 Max', [300, 300, 300]],
  ['m7pro', 'Photon Mono M7 Pro', [223, 126, 230]],
];

export async function createTool(tool) {
  addStrings(tool.strings);
  document.documentElement.lang = getLang();

  const $ = (s) => document.querySelector(s);
  const state = { ...tool.defaults, ...decodeState(location.search, tool.defaults) };
  const stage = $('#stage');
  const hud = $('#hud');
  const busy = $('#busy');
  const errBox = $('#err');
  const notesEl = $('#notes');

  // Dil düğmeleri
  document.querySelectorAll('.lang button').forEach((b) => {
    b.classList.toggle('on', b.dataset.lang === getLang());
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });

  const viewer = new Viewer(stage);
  viewer.setColor(state.color);
  busy.textContent = t('common.loading');
  busy.classList.add('on');
  await initCSG();

  // Mod düğmeleri
  const modesEl = $('#modes');
  const renderModes = () => {
    if (!tool.modes) { modesEl.hidden = true; return; }
    modesEl.innerHTML = tool.modes.map(([id, l]) => `<button type="button" data-m="${id}" class="${state.mode === id ? 'on' : ''}">${t(l)}</button>`).join('');
  };
  modesEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.m === state.mode) return;
    state.mode = b.dataset.m;
    const first = tool.presets.find((p) => p.mode === state.mode);
    if (first && !state._touched?.[state.mode]) applyPreset(first, false);
    renderAll(true);
  });

  // Şablonlar
  const presetRoot = $('#presets');
  let grid = null;
  const thumbs = {};
  const renderPresets = () => {
    const list = tool.presets.filter((p) => !p.mode || p.mode === state.mode);
    grid = buildPresetGrid(presetRoot, list, (p) => { applyPreset(p, true); renderAll(true); });
    for (const p of list) if (thumbs[p.id]) grid.setThumb(p.id, thumbs[p.id]);
    markPreset();
  };
  const presetMatches = (p) => Object.entries(p.values).every(([k, v]) => JSON.stringify(state[k]) === JSON.stringify(v));
  const markPreset = () => {
    const hit = tool.presets.find((p) => (!p.mode || p.mode === state.mode) && presetMatches(p));
    grid?.mark(hit?.id);
  };
  function applyPreset(p, setColor) {
    Object.assign(state, p.values);
    if (setColor && p.color) { state.color = p.color; viewer.setColor(p.color); }
  }

  // Panel
  let panel = null;
  const renderPanel = () => {
    panel = buildPanel($('#panel'), tool.schema(state), state, onChange);
  };

  function onChange(key) {
    state._touched = { ...(state._touched || {}), [state.mode]: true };
    if (key === 'color') viewer.setColor(state.color);
    if (key === 'edges') viewer.toggleEdges(state.edges);
    schedule();
  }

  // Yeniden hesaplama (140 ms gecikmeli)
  let timer = null;
  let last = null;
  let refitNext = true;
  function schedule(refit = false) {
    refitNext ||= refit;
    clearTimeout(timer);
    busy.textContent = t('common.building');
    busy.classList.add('on');
    timer = setTimeout(rebuild, 140);
  }

  function rebuild() {
    const notes = tool.enforce(state) || [];
    panel?.refresh();
    markPreset();
    try {
      const out = tool.build(state);
      last = out;
      errBox.hidden = true;
      viewer.show(out.parts.map((p) => ({ ...p, color: p.color || state.color })), { refit: refitNext });
      refitNext = false;
      renderStats(out);
    } catch (e) {
      console.error(e);
      last = null;
      errBox.hidden = false;
    }
    notesEl.innerHTML = notes.map((n) => `<li>${typeof n === 'string' ? n : t(n.k, n.v)}</li>`).join('');
    busy.classList.remove('on');
    history.replaceState(null, '', shareURL(state, tool.defaults));
  }

  function renderStats(out) {
    const solid = out.parts.filter((p) => !p.ghost && p.result && !p.result.empty);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    let vol = 0;
    let tris = 0;
    for (const p of solid) {
      const o = p.offset || [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p.result.box.min[i] + o[i]);
        max[i] = Math.max(max[i], p.result.box.max[i] + o[i]);
      }
      vol += p.result.volume;
      tris += p.result.triCount;
    }
    const size = min.map((m, i) => max[i] - m);
    const pr = PRINTERS.find((p) => p[0] === state.printer) || PRINTERS[0];
    const fits = size[2] <= pr[2][2] && ((size[0] <= pr[2][0] && size[1] <= pr[2][1]) || (size[1] <= pr[2][0] && size[0] <= pr[2][1]));
    const f = (n) => n.toFixed(1).replace(/\.0$/, '');
    const rows = [
      [t('common.size'), `${f(size[0])} × ${f(size[1])} × ${f(size[2])} mm`],
      [t('common.volume'), `${(vol / 1000).toFixed(1)} cm³`],
      [t('common.weight'), `${Math.round((vol / 1000) * 1.24)} g`],
      ...(out.info || []).map(([k, v]) => [t(k), v]),
      [t('common.triangles'), tris.toLocaleString()],
    ];
    hud.innerHTML = rows.map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('') +
      `<span class="${fits ? 'good' : 'bad'}">${fits ? t('common.fits') : t('common.noFit')}: ${pr[1]}</span>`;
  }

  // Görünüm çubuğu
  $('#viewbar').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view === 'fit') viewer.fit();
    else viewer.view(b.dataset.view);
  });

  // Dışa aktarma
  const fileBase = () => tool.fileName ? tool.fileName(state) : tool.id;
  const solidParts = () => (last?.parts || []).filter((p) => !p.ghost && p.result && !p.result.empty);
  $('#dl-stl').addEventListener('click', () => {
    const parts = solidParts();
    if (parts.length) download(toSTL(parts), fileBase() + '.stl');
  });
  $('#dl-3mf').addEventListener('click', () => {
    const parts = solidParts().map((p) => ({ ...p, color: p.color || state.color }));
    if (parts.length) download(to3MF(parts), fileBase() + '.3mf');
  });
  $('#share').addEventListener('click', async () => {
    const url = shareURL(state, tool.defaults);
    try { await navigator.clipboard.writeText(url); toast(t('common.copied')); } catch (_) { prompt('URL', url); }
  });
  $('#order').addEventListener('click', () => toast(t('common.orderSoon')));

  function renderAll(refit = false) {
    renderModes();
    renderPresets();
    renderPanel();
    applyI18n();
    schedule(refit);
  }

  onLang(() => {
    document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === getLang()));
    renderModes(); renderPresets(); renderPanel(); applyI18n();
    if (last) renderStats(last);
  });

  renderAll(true);
  makeThumbs();

  // Şablon küçük resimleri: her şablon ayrı bir sessiz görüntüleyicide bir kez çizilir.
  async function makeThumbs() {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-9999px;top:0;width:220px;height:220px;';
    document.body.appendChild(box);
    const v = new Viewer(box, { still: true });
    v.grid.visible = false;
    v.renderer.setClearColor(0x000000, 0);
    v.toggleEdges(true);
    // Önce açık modun şablonları çizilir, gerisi arkadan gelir.
    const order = [...tool.presets].sort((a, b) => (b.mode === state.mode) - (a.mode === state.mode));
    for (const p of order) {
      await new Promise((r) => setTimeout(r, 30));
      try {
        const s = { ...tool.defaults, ...(p.mode ? { mode: p.mode } : {}), ...p.values };
        tool.enforce(s);
        const out = tool.build(s);
        v.setColor(p.color || s.color);
        v.show(out.parts.filter((x) => !x.ghost), { refit: true });
        v.resize();
        thumbs[p.id] = v.snapshot();
        grid?.setThumb(p.id, thumbs[p.id]);
      } catch (e) { console.warn('thumb', p.id, e); }
    }
    v.renderer.dispose();
    box.remove();
  }

  return { state, viewer };
}
