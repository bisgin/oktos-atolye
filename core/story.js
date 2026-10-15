// Hikâye sahnesi motoru: her aracın girişindeki 3B sahne, yazı geçişleri ve şablon seçimi.
// Sahne içeriği araç klasöründeki scene.js'ten gelir (buildScene). Metin ve düğmeler DOM'da kalır
// (SEO ve ekran okuyucu); 3B tuval yalnızca görseldir.
//
// Akış modları:  full  → ilk ziyaret: yazı animasyonu + kamera turu
//                short → tekrar ziyaret: kısa giriş
//                still → hareket azaltma tercihi: kamera hareketi yok, yalnız kısa geçişler
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STORIES, STORY_UI } from './story-data.js';
import * as P from './props.js';

// ---- Ayarlanabilir değerler (ince ayar buradan) ----
export const TUNE = {
  introDur: 2.9,        // giriş kamera turu, sn
  shortDur: 1.3,        // tekrar ziyarette kısa giriş, sn
  pickDur: 1.3,         // şablona uçuş, sn
  focusDur: 0.95,       // dokunmatikte şablona yakınlaşma, sn
  parallaxYaw: 0.032,   // fareyle kamera kayması (yatay, radyan)
  parallaxPitch: 0.016, // (dikey, radyan)
  breathe: 0.004,       // boşta hafif nefes alma salınımı (radyan)
  damping: 0.055,       // kamera yumuşatma katsayısı (küçük = daha yumuşak)
  hoverLift: 7,         // üzerine gelinen nesne kaç mm yükselir
  settleRise: 28,       // girişte nesneler kaç mm yukarıdan oturur
  wordStagger: 0.045,   // başlık kelimeleri arası gecikme, sn
  outline: 0xd4621f,    // vurgu çizgisi rengi (atölye turuncusu)
  dprMax: 2,
  dprLow: 1.5,
};

const EASE_IN_OUT = 'power3.inOut';
const EASE_OUT = 'expo.out';

function detectQuality() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 700;
  const cores = navigator.hardwareConcurrency || 4;
  return coarse || small || cores <= 4 ? 'low' : 'high';
}

export function pickMode(toolId) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'still';
  try { return localStorage.getItem('oktos.story.' + toolId) ? 'short' : 'full'; } catch (_) { return 'full'; }
}

export function markSeen(toolId) {
  try { localStorage.setItem('oktos.story.' + toolId, '1'); } catch (_) { /* gizli pencere */ }
}

// Başlığı kelimelere böler: her kelime taşmayı gizleyen bir kabın içinde kayarak gelir.
function splitWords(el, text) {
  el.textContent = '';
  el.setAttribute('aria-label', text);
  const words = text.split(' ');
  const inners = [];
  words.forEach((w, i) => {
    const outer = document.createElement('span');
    outer.className = 'sw';
    outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'swi';
    inner.textContent = w;
    outer.appendChild(inner);
    el.appendChild(outer);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    inners.push(inner);
  });
  return inners;
}

// ---------------------------------------------------------------------------------
export async function mountStory(root, { toolId, lang = 'tr', mode = pickMode(toolId), onPick, onSkip, onReady, sceneModule, homeHref = 'index.html' } = {}) {
  const story = STORIES[toolId];
  let ui = STORY_UI[lang] || STORY_UI.tr;
  const $ = (s) => root.querySelector(s);
  const canvasHost = $('.story-canvas');
  const titleEl = $('.story-title');
  const ledeEl = $('.story-lede');
  const ctaEl = $('.story-cta');
  const altEl = $('.story-alt'); // atölyesi olmayan araçta "Tüm araçlar" bağlantısı
  const hintEl = $('.story-hint');
  const pinsEl = $('.story-pins');
  const stripEl = $('.story-strip');
  const veil = $('.story-veil');
  const live = $('.story-live');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const quality = detectQuality();

  // ---- metin ----
  const words = splitWords(titleEl, story.title[lang]);
  function applyCopy() {
    ledeEl.textContent = story.lede[lang];
    ctaEl.textContent = ui.cta;
    ctaEl.hidden = !story.live;
    if (altEl) {
      altEl.hidden = story.live;
      altEl.textContent = ui.allTools;
      altEl.href = homeHref;
    }
    hintEl.textContent = !story.live ? ui.soonHint : coarse ? ui.hintTouch : ui.hint;
    stripEl.setAttribute('aria-label', ui.presetsLabel);
  }
  applyCopy();
  root.setAttribute('aria-busy', 'true');
  live.textContent = ui.loading;

  // ---- WebGL ----
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: quality === 'low', powerPreference: 'high-performance' });
  } catch (e) {
    root.classList.add('no-webgl');
    live.textContent = ui.noWebgl;
  }

  const scene = new THREE.Scene();
  const bg = new THREE.Color(0xe9ece9);
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 3800, 9000);
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 30000);
  camera.up.set(0, 0, 1);

  let composer = null, outline = null;
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'low' ? TUNE.dprLow : TUNE.dprMax));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    canvasHost.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    try {
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: quality === 'low' ? 2 : 4 });
      composer = new EffectComposer(renderer, rt);
      composer.addPass(new RenderPass(scene, camera));
      outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
      outline.visibleEdgeColor.set(TUNE.outline);
      outline.hiddenEdgeColor.set(0x8a3f14);
      outline.edgeStrength = 4;
      outline.edgeThickness = 1.2;
      outline.edgeGlow = 0;
      composer.addPass(outline);
      composer.addPass(new OutputPass());
    } catch (e) {
      console.warn('composer', e);
      composer = null;
    }
  }

  // ---- ışıklar (atölye kili) ----
  const hemi = new THREE.HemisphereLight(0xf1f4fb, 0xcfc3b2, 0.72);
  hemi.position.set(0, 0, 1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffeed6, 2.9);
  key.castShadow = true;
  key.shadow.mapSize.set(quality === 'low' ? 1024 : 2048, quality === 'low' ? 1024 : 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 1.2;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xe4edff, 0.55);
  scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  scene.add(rim, rim.target);

  // ---- sahne içeriği ----
  const mod = sceneModule || (await import(`../tools/${toolId}/scene.js`));
  const built = await mod.buildScene({ THREE, scene, P, quality, lang, story });
  const shots = built.shots;
  const lights = built.lights || {};
  const center = new THREE.Vector3(...(lights.center || shots.main.target));
  key.position.set(...(lights.key || [center.x - 1400, center.y - 900, center.z + 2200]));
  key.target.position.copy(center);
  const span = lights.shadowSpan || 1600;
  Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 100, far: 8000 });
  key.shadow.camera.updateProjectionMatrix();
  fill.position.set(...(lights.fill || [center.x + 1800, center.y - 1200, center.z + 900]));
  fill.target.position.copy(center);
  rim.position.set(...(lights.rim || [center.x + 400, center.y + 1800, center.z + 1600]));
  rim.target.position.copy(center);
  if (lights.keyIntensity) key.intensity = lights.keyIntensity;

  // Etkileşimli şablonlar
  const hotspots = built.hotspots.map((h, i) => {
    const box = new THREE.Box3().setFromObject(h.object);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    h.object.traverse((o) => { o.userData.hotspot = h.id; });
    return {
      ...h, index: i, box, center: c, size,
      anchor: h.anchor ? new THREE.Vector3(...h.anchor) : new THREE.Vector3(c.x, c.y, box.max.z + 18),
      base: h.object.position.clone(),
      lift: 0, liftTarget: 0,
      name: story.hotspots?.[h.id]?.[lang] || h.id,
      live: story.live && !!h.preset,
    };
  });

  // ---- dikey ekran kadrajı ----
  // Sahneler yatay ekran için kurgulanır. Dikey ekranda yatay görüş açısı yarıya iner: kamera geri
  // çekilir, şablonların ortasına döner ve nesneler başlığın altına insin diye bakış biraz yükselir.
  {
    const w = canvasHost.clientWidth || innerWidth, h = canvasHost.clientHeight || innerHeight;
    const aspect = w / h;
    if (aspect < 0.9 && hotspots.length) {
      const k = aspect < 0.65 ? 1 : 0.6;
      const c = new THREE.Vector3();
      hotspots.forEach((x) => c.add(x.center));
      c.divideScalar(hotspots.length);
      const t0 = new THREE.Vector3(...shots.main.target), p0 = new THREE.Vector3(...shots.main.pos);
      const dist = p0.distanceTo(t0);
      const target = t0.clone().lerp(c, 0.75 * k);
      const pull = 1 + 0.8 * k;
      const pos = target.clone().add(p0.clone().sub(t0).multiplyScalar(pull));
      const lift = 0.1 * k * dist * pull;
      target.z += lift; pos.z += lift;
      shots.main = { pos: pos.toArray(), target: target.toArray() };
    }
  }

  // ---- kamera düzeneği: temel poz (tween) + paralaks (sönümlü) ----
  const rig = {
    pos: new THREE.Vector3(...(mode === 'full' ? shots.intro.pos : shots.main.pos)),
    target: new THREE.Vector3(...(mode === 'full' ? shots.intro.target : shots.main.target)),
  };
  if (mode === 'short') rig.pos.lerp(new THREE.Vector3(...shots.intro.pos), 0.12);
  const par = { x: 0, y: 0, tx: 0, ty: 0, on: mode !== 'still' };
  const Z = new THREE.Vector3(0, 0, 1);
  const tmpOff = new THREE.Vector3(), tmpRight = new THREE.Vector3(), q = new THREE.Quaternion();

  function applyCamera(t) {
    par.x += (par.tx - par.x) * TUNE.damping;
    par.y += (par.ty - par.y) * TUNE.damping;
    const breathe = par.on ? Math.sin(t * 0.21) * TUNE.breathe : 0;
    tmpOff.copy(rig.pos).sub(rig.target);
    q.setFromAxisAngle(Z, -par.x * TUNE.parallaxYaw + breathe);
    tmpOff.applyQuaternion(q);
    tmpRight.crossVectors(tmpOff, Z).normalize();
    q.setFromAxisAngle(tmpRight, par.y * TUNE.parallaxPitch);
    tmpOff.applyQuaternion(q);
    camera.position.copy(rig.target).add(tmpOff);
    camera.lookAt(rig.target);
  }

  function flyTo(shot, dur, ease = EASE_IN_OUT) {
    const from = { px: rig.pos.x, py: rig.pos.y, pz: rig.pos.z, tx: rig.target.x, ty: rig.target.y, tz: rig.target.z };
    const to = { px: shot.pos[0], py: shot.pos[1], pz: shot.pos[2], tx: shot.target[0], ty: shot.target[1], tz: shot.target[2] };
    return gsap.to(from, {
      ...to, duration: dur, ease,
      onUpdate: () => { rig.pos.set(from.px, from.py, from.pz); rig.target.set(from.tx, from.ty, from.tz); },
    });
  }

  // Bir şablona yakın plan: ana kameranın yönünden, nesneyi kadraja sığdıran mesafe.
  function focusShot(h) {
    const dir = new THREE.Vector3(...shots.main.pos).sub(new THREE.Vector3(...shots.main.target)).normalize();
    dir.z = Math.max(dir.z, 0.42);
    dir.normalize();
    const radius = Math.max(h.size.x, h.size.y, h.size.z) * 0.62 + 40;
    const dist = radius / Math.sin((camera.fov * Math.PI) / 360) * 1.05;
    const pos = h.center.clone().addScaledVector(dir, dist);
    return { pos: pos.toArray(), target: h.center.toArray() };
  }

  // ---- DOM: işaretçiler ve şablon şeridi ----
  function labelHotspot(h, pin, chip) {
    const act = h.live ? ui.pinAction : ui.soon;
    pin.innerHTML = `<span class="pin-dot"></span><span class="pin-label"><b>${h.name}</b><i>${h.live ? act + ' →' : act}</i></span>`;
    chip.innerHTML = `<span class="chip-name">${h.name}</span><span class="chip-act">${act}</span>`;
    chip.setAttribute('aria-label', `${h.name}, ${act}`);
  }
  const pinBtns = [];
  const chipBtns = [];
  pinsEl.innerHTML = '';
  stripEl.innerHTML = '';
  for (const h of hotspots) {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'pin';
    pin.tabIndex = -1; // klavye için şerit yeterli; işaretçi fare kolaylığıdır
    pin.setAttribute('aria-hidden', 'true');
    pinsEl.appendChild(pin);
    pinBtns.push(pin);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (h.live ? '' : ' soon');
    stripEl.appendChild(chip);
    chipBtns.push(chip);
    labelHotspot(h, pin, chip);

    for (const el of [pin, chip]) {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') setHover(h); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') setHover(null); });
      el.addEventListener('focus', () => setHover(h));
      el.addEventListener('blur', () => setHover(null));
      el.addEventListener('click', () => activate(h, el === chip && coarse));
    }
  }

  // ---- vurgulama ----
  let hovered = null;
  let focused = null; // dokunmatikte ilk dokunuşla yakınlaşılan şablon
  function setHover(h) {
    if (hovered === h) return;
    hovered = h;
    for (const x of hotspots) x.liftTarget = x === h ? TUNE.hoverLift : 0;
    if (outline) outline.selectedObjects = h ? [h.object] : [];
    pinBtns.forEach((p, i) => p.classList.toggle('on', hotspots[i] === h));
    chipBtns.forEach((c, i) => c.classList.toggle('on', hotspots[i] === h));
    if (renderer) renderer.domElement.style.cursor = h ? 'pointer' : '';
    built.onHover?.(h?.id ?? null);
  }

  // ---- ana sahneye dönüş / seçim ----
  let busy = false;
  let state = 'intro';

  function activate(h, touchChip) {
    if (busy) return;
    if (coarse && focused !== h && touchChip !== false) {
      // Dokunmatik: ilk dokunuş yakınlaştırır, ikinci dokunuş seçer.
      focusOn(h);
      return;
    }
    pick(h);
  }

  function focusOn(h) {
    focused = h;
    setHover(h);
    flyTo(focusShot(h), state === 'main' && mode !== 'still' ? TUNE.focusDur : 0.001);
    chipBtns.forEach((c, i) => c.classList.toggle('focused', hotspots[i] === h));
    root.classList.add('is-focused');
  }

  function unfocus() {
    if (!focused) return;
    focused = null;
    chipBtns.forEach((c) => c.classList.remove('focused'));
    root.classList.remove('is-focused');
    setHover(null);
    flyTo(shots.main, mode === 'still' ? 0.001 : TUNE.focusDur, 'power2.inOut');
  }

  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function pick(h) {
    if (!h.live) {
      focusOn(h);
      toast(ui.soonToast);
      return;
    }
    busy = true;
    markSeen(toolId);
    live.textContent = ui.goingTo.replace('{name}', h.name);
    const still = mode === 'still';
    const tl = gsap.timeline({ onComplete: () => onPick?.(h.preset, h) });
    tl.to('.story-copy > *', { autoAlpha: 0, y: -14, duration: still ? 0.15 : 0.35, ease: 'power2.in', stagger: still ? 0 : 0.04 }, 0)
      .to([pinsEl, stripEl], { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 0);
    if (!still) tl.add(flyTo(focusShot(h), TUNE.pickDur), 0.05);
    tl.to(veil, { autoAlpha: 1, duration: still ? 0.15 : 0.42, ease: 'power1.in' }, still ? 0.1 : TUNE.pickDur - 0.3);
  }

  ctaEl.addEventListener('click', () => {
    markSeen(toolId);
    const still = mode === 'still';
    gsap.timeline({ onComplete: () => onSkip?.() })
      .to('.story-copy > *', { autoAlpha: 0, y: -12, duration: still ? 0.12 : 0.3, ease: 'power2.in', stagger: still ? 0 : 0.03 })
      .to(veil, { autoAlpha: 1, duration: still ? 0.12 : 0.35, ease: 'power1.in' }, still ? 0.05 : 0.15);
  });

  // ---- işaretçi (fare / dokunma) ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const targets = hotspots.map((h) => h.object);
  function hitAt(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets, true)[0];
    return hit ? hotspots.find((h) => h.id === hit.object.userData.hotspot) : null;
  }
  if (renderer) {
    const el = renderer.domElement;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      par.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (e.pointerType !== 'touch' && state === 'main' && !busy) setHover(hitAt(e.clientX, e.clientY));
    });
    el.addEventListener('pointerleave', () => { par.tx = 0; par.ty = 0; if (!focused) setHover(null); });
    let downAt = null;
    el.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => {
      if (!downAt || state !== 'main' || busy) return;
      const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
      downAt = null;
      if (moved > 8) return;
      const h = hitAt(e.clientX, e.clientY);
      if (h) activate(h, e.pointerType === 'touch' ? undefined : false);
      else unfocus();
    });
  }
  const onKey = (e) => { if (e.key === 'Escape') unfocus(); };
  addEventListener('keydown', onKey);

  // ---- boyut ----
  function resize() {
    const w = canvasHost.clientWidth || 1, h = canvasHost.clientHeight || 1;
    camera.aspect = w / h;
    // Dar ekranda geniş sahne sığsın diye görüş açısını büyüt.
    camera.fov = w / h < 0.8 ? 46 : w / h < 1.2 ? 38 : 30;
    camera.updateProjectionMatrix();
    if (!renderer) return;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    outline?.resolution.set(w, h);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvasHost);
  resize();

  // ---- döngü ----
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  let raf = 0;
  let running = false;
  function frame() {
    raf = requestAnimationFrame(frame);
    draw(Math.min(clock.getDelta(), 0.05), clock.elapsedTime);
  }
  function draw(dt, t) {
    for (const h of hotspots) {
      h.lift += (h.liftTarget - h.lift) * Math.min(1, dt * 12);
      h.object.position.z = h.base.z + h.settle + h.lift;
    }
    built.update?.(t, dt);
    applyCamera(t);
    if (renderer) {
      if (composer) composer.render(dt); else renderer.render(scene, camera);
      const w = canvasHost.clientWidth, hh = canvasHost.clientHeight;
      hotspots.forEach((h, i) => {
        v.copy(h.anchor);
        v.z += h.lift + h.settle;
        v.project(camera);
        const vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
        const p = pinBtns[i];
        p.style.transform = `translate3d(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * hh}px, 0)`;
        p.classList.toggle('off', !vis);
      });
    }
  }
  function start() {
    if (running || !renderer) return;
    running = true;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? stop() : root.hidden ? null : start());
  document.addEventListener('visibilitychange', onVis);

  // ---- giriş koreografisi ----
  hotspots.forEach((h) => { h.settle = mode === 'full' ? TUNE.settleRise : 0; });
  gsap.set('.story-copy > *', { autoAlpha: 1, y: 0 });
  gsap.set([pinsEl, stripEl], { autoAlpha: 0 });
  gsap.set(words, { yPercent: mode === 'full' ? 112 : 0 });
  gsap.set([ledeEl, ctaEl.parentElement], { autoAlpha: mode === 'still' ? 1 : 0, y: mode === 'full' ? 14 : 0 });
  if (mode === 'short') gsap.set(titleEl, { autoAlpha: 0 });
  root.setAttribute('aria-busy', 'false');
  live.textContent = '';
  start();

  // Giriş bitince sahne "görüldü" sayılır (bir sonraki ziyaret kısa giriş) ve sayfaya haber verilir.
  const intro = gsap.timeline({ onComplete: () => { state = 'main'; markSeen(toolId); onReady?.(); } });
  if (mode === 'full') {
    intro.to(veil, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 0)
      .add(flyTo(shots.main, TUNE.introDur), 0.05)
      .to(words, { yPercent: 0, duration: 1.15, ease: EASE_OUT, stagger: TUNE.wordStagger }, 0.55)
      .to(ledeEl, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 1.15)
      .to(ctaEl.parentElement, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.4);
    hotspots.forEach((h, i) => {
      intro.to(h, { settle: 0, duration: 1.0, ease: 'power3.out' }, 0.9 + i * 0.09);
    });
    intro.to([pinsEl, stripEl], { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, TUNE.introDur - 0.35)
      .from(chipBtns, { y: 12, autoAlpha: 0, duration: 0.5, ease: 'power3.out', stagger: 0.045 }, TUNE.introDur - 0.35);
  } else if (mode === 'short') {
    intro.to(veil, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 0)
      .add(flyTo(shots.main, TUNE.shortDur, 'power2.out'), 0)
      .to([titleEl, ledeEl, ctaEl.parentElement], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0.15)
      .to([pinsEl, stripEl], { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 0.5);
  } else {
    intro.set(veil, { autoAlpha: 0 }).set([pinsEl, stripEl], { autoAlpha: 1 });
  }

  // ---- denetleyici ----
  return {
    hotspots: hotspots.map((h) => ({ id: h.id, preset: h.preset, name: h.name, live: h.live })),
    mode,
    renderer, scene, camera,
    pick: (id) => { const h = hotspots.find((x) => x.id === id || x.preset === id); if (h) pick(h); },
    // Atölyeden sahneye dönüş: perde açılır, kamera ana kadraja geri çekilir.
    returnToScene(fromPreset) {
      busy = false;
      focused = null;
      root.classList.remove('is-focused');
      chipBtns.forEach((c) => c.classList.remove('focused'));
      setHover(null);
      root.hidden = false;
      start();
      const h = hotspots.find((x) => x.preset === fromPreset);
      if (h && mode !== 'still') { const s = focusShot(h); rig.pos.set(...s.pos); rig.target.set(...s.target); }
      gsap.timeline({ onComplete: () => { state = 'main'; } })
        .to(veil, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .add(flyTo(shots.main, mode === 'still' ? 0.001 : 1.0, 'power3.out'), 0)
        .to('.story-copy > *', { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 }, 0.3)
        .to([pinsEl, stripEl], { autoAlpha: 1, duration: 0.4 }, 0.6);
    },
    pause: stop,
    resume: start,
    // Sahnede dile bağlı 3B yazı varsa (3D Yazı, Text Flip, QR) dil değişince sayfa sahneyi yeniden kurmalı.
    langGeometry: !!built.langGeometry,
    // Metinleri yeni dilde yazar (animasyonsuz).
    setLang(l) {
      lang = l;
      ui = STORY_UI[l] || STORY_UI.tr;
      splitWords(titleEl, story.title[l]);
      applyCopy();
      hotspots.forEach((h, i) => {
        h.name = story.hotspots?.[h.id]?.[l] || h.id;
        labelHotspot(h, pinBtns[i], chipBtns[i]);
      });
    },
    // Konsoldan kadraj ayarı ve kare kare doğrulama: debug.seek(0.4) girişi %40'a sarar ve bir kare çizer.
    debug: {
      rig, shots, flyTo, TUNE, intro,
      seek(p) { intro.pause(); intro.progress(p); for (const h of hotspots) h.lift = h.liftTarget; draw(0, intro.time()); },
    },
    destroy() {
      stop();
      ro.disconnect();
      removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose?.(); });
      composer?.dispose?.();
      renderer?.dispose();
      renderer?.domElement.remove();
      pinsEl.innerHTML = '';
      stripEl.innerHTML = '';
    },
  };
}
