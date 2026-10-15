// Sayfa düzenleyicisi: hikâye sahnesi ↔ atölye geçişi.
// bootTool  → atölyesi olan araç (Organizer, Vazo): önce sahne, şablon seçilince atölye.
// bootStory → atölyesi henüz olmayan araç: yalnız sahne.
// Linkte ayar varsa (paylaşılan tasarım) sahne atlanır; "Sahneye dön" ile istenince açılır.
import { gsap } from 'gsap';
import { getLang, setLang, onLang, applyI18n } from './i18n.js';
import { STORIES, STORY_UI } from './story-data.js';

const html = document.documentElement;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1200 }) : setTimeout(f, 200));

function wireLang() {
  if (!document.body.dataset.langWired) {
    document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    document.body.dataset.langWired = '1';
  }
  syncLang();
}
function syncLang() {
  document.querySelectorAll('.lang button').forEach((b) => {
    const on = b.dataset.lang === getLang();
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

// Görünmez öğeye odak verilemez: giriş animasyonu öğeyi görünür yapınca odakla (en çok 2 sn bekle).
function focusWhenVisible(el, timeout = 2000) {
  if (!el) return;
  const t0 = performance.now();
  const tryFocus = () => {
    if (getComputedStyle(el).visibility === 'visible' && Number(getComputedStyle(el).opacity) > 0.5) el.focus({ preventScroll: true });
    else if (performance.now() - t0 < timeout) setTimeout(tryFocus, 60);
  };
  tryFocus();
}

function prepareRoot(root) {
  const veil = root.querySelector('.story-veil');
  if (veil) veil.dataset.loading = STORY_UI[getLang()].loading;
}

// ---------------------------------------------------------------------------------
export async function bootTool({ toolId, tool, home = '../../index.html' }) {
  wireLang();
  const root = document.getElementById('story');
  const back = document.getElementById('scene-back');
  const backLabel = back.querySelector('span');
  const setBackLabel = () => { backLabel.textContent = STORY_UI[getLang()].backToScene; };
  setBackLabel();
  back.hidden = true;

  let story = null;
  let ws = null; // atölye (createTool) sözü
  const workshop = async (opts) => {
    if (!ws) {
      const { createTool } = await import('./tool-shell.js');
      ws = createTool(tool, opts);
    }
    return ws;
  };

  // Sahneden atölyeye: perde kapalıyken atölye hazırlanır, sonra panel kayarak gelir.
  async function enterWorkshop(presetId) {
    let api;
    try {
      api = await workshop({ preset: presetId, deferThumbs: true });
    } catch (e) {
      console.error(e);
      html.classList.remove('story-on');
      return;
    }
    if (presetId && api.currentPreset() !== presetId) api.pick(presetId);
    html.classList.remove('story-on');
    api.reveal();
    const side = document.querySelector('.side');
    const stage = document.getElementById('stage');
    if (!reduced()) {
      gsap.fromTo(side, { x: 28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
      gsap.fromTo(stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out', clearProps: 'opacity,visibility' });
    }
    await gsap.to(root, { autoAlpha: 0, duration: reduced() ? 0.12 : 0.4, ease: 'power2.out' });
    root.hidden = true;
    gsap.set(root, { clearProps: 'opacity,visibility' });
    story?.pause();
    back.hidden = false;
    api.startThumbs();
    document.querySelector('.tool-title')?.focus({ preventScroll: true });
  }

  async function mount(mode) {
    prepareRoot(root);
    const { mountStory } = await import('./story.js');
    story = await mountStory(root, {
      toolId,
      lang: getLang(),
      homeHref: home,
      ...(mode ? { mode } : {}),
      onPick: (preset) => enterWorkshop(preset),
      onSkip: () => enterWorkshop(null),
      // Giriş bitince atölye arka planda hazırlansın: şablon seçimi beklemeden açılır.
      onReady: () => idle(() => workshop({ deferThumbs: true }).catch(() => {})),
    });
  }

  // Atölyeden sahneye: sahne katmanı açılır, kamera seçili şablondan ana kadraja çekilir.
  async function backToScene() {
    const api = ws ? await ws : null;
    const cur = api?.currentPreset() ?? null;
    back.hidden = true;
    root.hidden = false;
    html.classList.add('story-on');
    const fade = gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced() ? 0.1 : 0.25, ease: 'power1.out', clearProps: 'opacity,visibility' });
    if (!story) await mount(reduced() ? 'still' : 'short');
    else story.returnToScene(cur);
    await fade;
    focusWhenVisible(root.querySelector('.story-title'));
  }
  back.addEventListener('click', backToScene);
  // Konsoldan hata ayıklama / akış testi için
  window.oktosPage = { gsap, story: () => story, workshop: () => ws, enterWorkshop, backToScene };

  onLang(() => {
    syncLang();
    setBackLabel();
    if (!story) return;
    if (story.langGeometry && !root.hidden) { location.reload(); return; }
    story.setLang(getLang());
  });

  if (html.classList.contains('story-on')) {
    try {
      await mount();
    } catch (e) {
      // Sahne kurulamazsa sayfa boş kalmasın: doğrudan atölye.
      console.error(e);
      root.hidden = true;
      html.classList.remove('story-on');
      await enterWorkshop(null);
    }
  } else {
    root.hidden = true;
    const api = await workshop({});
    api.reveal();
    back.hidden = false;
  }
}

// ---------------------------------------------------------------------------------
export async function bootStory({ toolId, home = '../../index.html' }) {
  wireLang();
  applyI18n();
  html.lang = getLang();
  const root = document.getElementById('story');
  const setTitle = () => {
    document.title = `${STORIES[toolId].name[getLang()]} · Oktos Workshop`;
    document.querySelectorAll('[data-story-text]').forEach((el) => { el.textContent = STORY_UI[getLang()][el.dataset.storyText]; });
    document.querySelectorAll('[data-story-name]').forEach((el) => { el.textContent = STORIES[toolId].name[getLang()]; });
  };
  setTitle();
  prepareRoot(root);
  let story = null;
  window.oktosPage = { gsap, story: () => story };
  try {
    const { mountStory } = await import('./story.js');
    story = await mountStory(root, { toolId, lang: getLang(), homeHref: home });
  } catch (e) {
    console.error(e);
    root.classList.add('no-webgl');
  }
  onLang(() => {
    syncLang();
    html.lang = getLang();
    setTitle();
    if (story?.langGeometry) { location.reload(); return; }
    story?.setLang(getLang());
  });
}
