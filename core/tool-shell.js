// Ortak araç kabuğu: düzen, görüntüleyici, panel, şablonlar, ölçüler, sipariş, paylaşım, dil.
// Araç şunları verir:
//   id, strings, defaults, modes?: [[id, labelKey]], schema(state), presets: [{id, mode?, label, color, values}]
//   enforce(state) → notlar (değerleri yerinde düzeltir)
//   build(state) → { parts: [{ result, name, color?, ghost?, offset? }], info: [[labelKey, text]] }
// Dışa aktarma (STL/3MF) müşteriye kapalıdır; atölye için ?atolye=1 ile görünür.
import { initCSG } from './csg.js';
import { Viewer } from './viewer.js';
import { buildPanel, buildPresetGrid, toast } from './ui.js';
import { t, addStrings, applyI18n, setLang, getLang, onLang } from './i18n.js';
import { decodeState, shareURL } from './share.js';
import { toSTL, to3MF, download } from './export.js';
import { ORDER } from './order-config.js';

export const PRINTERS = [
  ['p1s', 'Bambu P1S / X1C / A1', [256, 256, 256]],
  ['a1mini', 'Bambu A1 mini', [180, 180, 180]],
  ['h2d', 'Bambu H2D', [350, 320, 325]],
  ['mk4', 'Prusa MK4', [250, 210, 220]],
  ['ender3', 'Ender 3 / K1', [220, 220, 250]],
  ['k1max', 'K1 Max', [300, 300, 300]],
  ['m7pro', 'Photon Mono M7 Pro', [223, 126, 230]],
];

const fmtNum = (n, d = 1) => n.toLocaleString(getLang() === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: d });

// opts.preset: açılışta uygulanacak şablon (sahneden gelince). opts.deferThumbs: küçük resimleri
// sayfa isteyene kadar çizme (sahne açıkken işlemciyi meşgul etmesin).
export async function createTool(tool, opts = {}) {
  addStrings(tool.strings);
  const $ = (s) => document.querySelector(s);
  const state = { ...tool.defaults, ...decodeState(location.search, tool.defaults) };
  const params = new URLSearchParams(location.search);
  const workshop = params.get('atolye') === '1';
  const stage = $('#stage');
  const hud = $('#hud');
  const busy = $('#busy');
  const errBox = $('#err');
  const notesEl = $('#notes');
  const srStatus = $('#sr-status');
  const orderBtn = $('#order');
  const shareBtn = $('#share');
  const orderMeta = $('#order-meta');
  const exportsEl = $('#exports');

  // Metinler motor yüklenmeden önce doğru dilde görünsün.
  const localizeDoc = () => {
    document.documentElement.lang = getLang();
    applyI18n();
    const title = t(tool.id + '.title');
    document.title = `${title} · ${t('app.name')}`;
    document.querySelector('meta[name=description]')?.setAttribute('content', t(tool.id + '.lede'));
    orderBtn.textContent = ORDER.whatsapp ? t('common.orderWa') : t('common.order');
  };
  const syncLangButtons = () => document.querySelectorAll('.lang button').forEach((b) => {
    const on = b.dataset.lang === getLang();
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  // Dil düğmeleri sayfada bir kez bağlanır (sayfa sahneyle birlikte zaten bağlamış olabilir).
  if (!document.body.dataset.langWired) {
    document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    document.body.dataset.langWired = '1';
  }
  syncLangButtons();
  localizeDoc();
  exportsEl.hidden = !workshop;
  setReady(false);

  const viewer = new Viewer(stage);
  window.oktos = { viewer, state }; // konsoldan hata ayıklama için
  viewer.setColor(state.color);
  viewer.showEdges = !!state.edges; // kapalıyken kenar hiç hesaplanmaz (en pahalı adım)
  busy.textContent = t('common.loading');
  busy.classList.add('on');
  await initCSG();

  // Mod düğmeleri: seçim değişince odak yeni seçili düğmede kalır.
  const modesEl = $('#modes');
  const renderModes = () => {
    if (!tool.modes) { modesEl.hidden = true; return; }
    modesEl.innerHTML = tool.modes.map(([id, l]) =>
      `<button type="button" data-m="${id}" class="${state.mode === id ? 'on' : ''}" aria-pressed="${state.mode === id}">${t(l)}</button>`).join('');
  };
  modesEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.m === state.mode) return;
    const hadFocus = modesEl.contains(document.activeElement);
    state.mode = b.dataset.m;
    const first = tool.presets.find((p) => p.mode === state.mode);
    if (first && !state._touched?.[state.mode]) applyPreset(first, false);
    renderAll(true);
    if (hadFocus) modesEl.querySelector(`[data-m="${state.mode}"]`)?.focus();
  });

  // Şablonlar: aynı modda şablon seçmek paneli yeniden kurmaz, yalnız değerleri günceller (odak korunur).
  const presetRoot = $('#presets');
  let grid = null;
  const thumbs = {};
  const renderPresets = () => {
    const list = tool.presets.filter((p) => !p.mode || p.mode === state.mode);
    grid = buildPresetGrid(presetRoot, list, (p) => {
      applyPreset(p, true);
      panel?.refresh();
      markPreset();
      schedule(true);
    });
    for (const p of list) if (thumbs[p.id]) grid.setThumb(p.id, thumbs[p.id]);
    markPreset();
  };
  const presetMatches = (p) => Object.entries(p.values).every(([k, v]) => JSON.stringify(state[k]) === JSON.stringify(v));
  const currentPreset = () => tool.presets.find((p) => (!p.mode || p.mode === state.mode) && presetMatches(p));
  const markPreset = () => grid?.mark(currentPreset()?.id);
  // Şablon = tam tasarım: önce varsayılanlara dön (görünüm tercihleri korunur), sonra şablonun değerleri.
  // Böylece önceki şablondan kalan alakasız değerler (istif, kepçe…) yeni şablona taşınmaz.
  function applyPreset(p, setColor) {
    const keep = { mode: p.mode || state.mode, color: state.color, printer: state.printer, edges: state.edges, quality: state.quality };
    for (const k of Object.keys(tool.defaults)) if (!(k in keep)) state[k] = tool.defaults[k];
    Object.assign(state, keep, p.values);
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
  let lastStats = null;
  let refitNext = true;
  let srTimer = null;
  function schedule(refit = false) {
    refitNext ||= refit;
    clearTimeout(timer);
    busy.textContent = t('common.building');
    busy.classList.add('on');
    timer = setTimeout(rebuild, state._drag ? 40 : 140); // sürüklerken taslak hızlı, bırakınca tam
  }

  function rebuild() {
    const notes = tool.enforce(state) || [];
    panel?.refresh();
    markPreset();
    try {
      const t0 = performance.now();
      const out = tool.build(state);
      const t1 = performance.now();
      last = out;
      errBox.hidden = true;
      viewer.show(out.parts.map((p) => ({ ...p, color: p.color || state.color })), { refit: refitNext });
      window.oktos.timing = { build: Math.round(t1 - t0), show: Math.round(performance.now() - t1), drag: !!state._drag };
      refitNext = false;
      renderStats(out);
      setReady(true);
      window.__oktosReady = true;
    } catch (e) {
      console.error(e);
      last = null;
      errBox.textContent = t('common.error');
      errBox.hidden = false;
      setReady(false);
    }
    // Müşteri için tabla bilgisi yerine çözüm: Oktos büyük parçayı bölerek basar.
    if (lastStats && !lastStats.fits && !workshop) notes.push({ k: 'common.tooBig' });
    state._notes = notes;
    renderNotes();
    busy.classList.remove('on');
    const url = new URL(shareURL(state, tool.defaults));
    if (workshop) url.searchParams.set('atolye', '1');
    history.replaceState(null, '', url);
    // Ekran okuyucu: ayarlar oturduktan sonra tek bir özet.
    clearTimeout(srTimer);
    srTimer = setTimeout(() => { if (lastStats) srStatus.textContent = lastStats.summary; }, 900);
  }

  function renderNotes() {
    notesEl.innerHTML = (state._notes || []).map((n) => `<li>${typeof n === 'string' ? n : t(n.k, n.v)}</li>`).join('');
  }

  function setReady(on) {
    for (const b of [orderBtn, shareBtn, ...document.querySelectorAll('#exports button')]) b.disabled = !on;
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
    const grams = Math.round((vol / 1000) * 1.24);
    const pr = PRINTERS.find((p) => p[0] === state.printer) || PRINTERS[0];
    const fits = size[2] <= pr[2][2] && ((size[0] <= pr[2][0] && size[1] <= pr[2][1]) || (size[1] <= pr[2][0] && size[0] <= pr[2][1]));
    const sizeText = `${fmtNum(size[0])} × ${fmtNum(size[1])} × ${fmtNum(size[2])} mm`;
    // Üçüncü öğe true → ikincil bilgi, dar ekranda gizlenir. Teknik satırlar yalnız atölye görünümünde.
    const rows = [
      [t('common.size'), sizeText],
      [t('common.weight'), `${grams} g`],
      ...(out.info || []).map(([k, v]) => [t(k), v, true]),
      ...(workshop ? [[t('common.volume'), `${fmtNum(vol / 1000)} cm³`, true], [t('common.triangles'), fmtNum(tris, 0), true]] : []),
    ];
    hud.innerHTML = rows.map(([k, v, minor]) => `<span${minor ? ' class="minor"' : ''}>${k} <b>${v}</b></span>`).join('') +
      (workshop ? `<span class="${fits ? 'good' : 'bad'}">${fits ? t('common.fits') : t('common.noFit')}: ${pr[1]}</span>` : '');
    lastStats = { size, sizeText, grams, fits, summary: `${t('common.size')} ${sizeText}, ${t('common.weight')} ${grams} g` };
    renderOrderMeta();
  }

  // Sipariş: tahmini fiyat ve teslim süresi (ayarlıysa).
  function priceOf(grams) {
    if (!ORDER.pricePerGram) return null;
    return Math.max(ORDER.minPrice || 0, Math.ceil(grams * ORDER.pricePerGram));
  }
  function renderOrderMeta() {
    if (!lastStats) return;
    const parts = [];
    const price = priceOf(lastStats.grams);
    if (price) parts.push(`${t('common.estPrice')} ${fmtNum(price, 0)} ${ORDER.currency}`);
    const lead = ORDER.lead?.[getLang()] || ORDER.lead?.tr;
    if (lead) parts.push(t('common.lead', { d: lead }));
    orderMeta.textContent = parts.join(' · ');
    orderMeta.hidden = !parts.length;
  }

  function colorName() {
    const item = tool.schema(state).find((x) => x.key === 'color');
    const opt = item?.options?.find(([v]) => v === state.color);
    return opt ? t(opt[1]) : state.color;
  }

  function orderMessage() {
    const p = currentPreset();
    const url = shareURL(state, tool.defaults);
    const lines = [
      t('order.hello'),
      `${t('order.tool')}: ${t(tool.id + '.title')}`,
      `${t('order.preset')}: ${p ? t(p.label) : t('order.custom')}`,
      `${t('common.size')}: ${lastStats.sizeText}`,
      `${t('order.weight')}: ${lastStats.grams} g PLA`,
      `${t('order.color')}: ${colorName()}`,
      ...(lastStats.fits ? [] : [t('order.split')]),
      `${t('order.design')}: ${url}`,
    ];
    return lines.join('\n');
  }

  orderBtn.addEventListener('click', () => {
    if (!last || !lastStats) return;
    const msg = orderMessage();
    if (ORDER.whatsapp) {
      window.open(`https://wa.me/${ORDER.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    } else if (ORDER.email) {
      location.href = `mailto:${ORDER.email}?subject=${encodeURIComponent(t('order.subject'))}&body=${encodeURIComponent(msg)}`;
    } else {
      toast(t('order.notSet'));
    }
  });

  // Görünüm çubuğu
  $('#viewbar').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view === 'fit') viewer.fit();
    else viewer.view(b.dataset.view);
  });

  // Paylaşım: pano olmazsa seçili bir metin kutusu (engelleyici pencere yok).
  shareBtn.addEventListener('click', async () => {
    const url = shareURL(state, tool.defaults);
    try {
      await navigator.clipboard.writeText(url);
      toast(t('common.copied'));
    } catch (_) {
      const box = $('#share-fallback');
      box.hidden = false;
      const inp = box.querySelector('input');
      inp.value = url;
      inp.focus();
      inp.select();
      toast(t('common.copyManual'));
    }
  });

  // Atölye dışa aktarma (yalnız ?atolye=1)
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

  function renderAll(refit = false) {
    renderModes();
    renderPresets();
    renderPanel();
    applyI18n();
    schedule(refit);
  }

  onLang(() => {
    syncLangButtons();
    localizeDoc();
    renderModes(); renderPresets(); renderPanel(); renderNotes();
    if (last) renderStats(last);
  });

  // ?sablon=<id>: sahneden ya da bir bağlantıdan gelen şablonu uygula.
  const fromScene = opts.preset || params.get('sablon');
  const scenePreset = fromScene && tool.presets.find((p) => p.id === fromScene);
  if (scenePreset) {
    if (scenePreset.mode) state.mode = scenePreset.mode;
    applyPreset(scenePreset, true);
  }

  // Şablon küçük resimleri: yalnız açık modunkiler, boşta kalan zamanlarda tek tek çizilir.
  // Tek bir gizli görüntüleyici yeniden kullanılır. (Değişkenler çağrıdan ÖNCE tanımlı olmalı.)
  let thumbViewer = null;
  let thumbQueue = Promise.resolve();
  const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 400 }) : setTimeout(r, 30)));

  renderAll(true);
  let thumbsOn = !opts.deferThumbs;
  if (thumbsOn) thumbsFor(state.mode);
  modesEl.addEventListener('click', () => { if (thumbsOn) thumbsFor(state.mode); });

  function thumbsFor(mode) {
    const todo = tool.presets.filter((p) => (!p.mode || p.mode === mode) && !thumbs[p.id]);
    thumbQueue = thumbQueue.then(async () => {
      if (!todo.length) return;
      if (!thumbViewer) {
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;left:-9999px;top:0;width:220px;height:220px;';
        box.setAttribute('aria-hidden', 'true');
        document.body.appendChild(box);
        thumbViewer = new Viewer(box, { still: true });
        thumbViewer.grid.visible = false;
        thumbViewer.renderer.setClearColor(0x000000, 0);
        thumbViewer.toggleEdges(tool.defaults.edges !== false);
      }
      for (const p of todo) {
        await idle();
        if (thumbs[p.id]) continue;
        try {
          const s = { ...tool.defaults, ...(p.mode ? { mode: p.mode } : {}), ...p.values, _thumb: true };
          tool.enforce(s);
          const out = tool.build(s);
          thumbViewer.setColor(p.color || s.color);
          thumbViewer.show(out.parts.filter((x) => !x.ghost).map((x) => ({ ...x, color: p.color || s.color })), { refit: true });
          thumbViewer.resize();
          thumbs[p.id] = thumbViewer.snapshot();
          grid?.setThumb(p.id, thumbs[p.id]);
        } catch (e) { console.warn('thumb', p.id, e); }
      }
    });
  }

  // Sayfanın (sahne ↔ atölye) kullandığı dış arayüz.
  return {
    state,
    viewer,
    // Bir şablonu uygular; mod değişiyorsa paneli yeniden kurar.
    pick(id) {
      const p = tool.presets.find((x) => x.id === id);
      if (!p) return;
      const modeChanged = p.mode && p.mode !== state.mode;
      if (p.mode) state.mode = p.mode;
      applyPreset(p, true);
      if (modeChanged) renderAll(true);
      else { panel?.refresh(); markPreset(); schedule(true); }
      if (thumbsOn) thumbsFor(state.mode);
    },
    currentPreset: () => currentPreset()?.id ?? null,
    startThumbs() { thumbsOn = true; thumbsFor(state.mode); },
    // Gizliyken boyutlanan görünümü tazeler (sahneden atölyeye geçişte).
    reveal() { viewer.resize(); viewer.fit(); },
  };
}
