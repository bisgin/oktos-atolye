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
  focusDur: 1.15,       // şablona yakınlaşma, sn
  focusYaw: 0.24,       // yakın planda fareyle nesne etrafında dönüş (yatay, radyan)
  focusPitch: 0.1,      // (dikey, radyan)
  parallaxYaw: 0.032,   // fareyle kamera kayması (yatay, radyan)
  parallaxPitch: 0.016, // (dikey, radyan)
  breathe: 0.004,       // boşta hafif nefes alma salınımı (radyan)
  damping: 0.055,       // kamera yumuşatma katsayısı (küçük = daha yumuşak)
  hoverLift: 7,         // üzerine gelinen nesne kaç mm yükselir
  settleRise: 28,       // girişte nesneler kaç mm yukarıdan oturur
  wordStagger: 0.045,   // başlık kelimeleri arası gecikme, sn
  outline: 0xd4621f,    // vurgu çizgisi rengi (atölye turuncusu)
  dprMax: 2,
  dprLow: 2,            // telefon (2026-10-18: 1,5 bulanıktı; çözünürlük adım adım artırılıyor)
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
// Araç dışı sahne (oda): story metni (STORIES biçiminde) ve sceneModule dışarıdan verilir. onCard(h | null, card):
// yakın plan kartı dolunca ve kapanınca (sayfa kart başlığını canlandırabilir).
// onActivate(h): sayfa kamerayı kendisi sürerken (drive) tıklanan bölge ya da geri isteği (h = null) önce sayfaya
// sorulur; true dönerse motor yakınlaşmaz (oda: kaydırmalı tur o durağa kayar).
export async function mountStory(root, { toolId, lang = 'tr', mode = pickMode(toolId), onPick, onSkip, onReady, onCard, onActivate, sceneModule, story: storyOverride, homeHref = 'index.html' } = {}) {
  const story = storyOverride || STORIES[toolId];
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
  // Telefonda ve zayıf cihazda (düşük kalite) sahne vurgu çizgisini kullanmıyorsa (outlineFocus: false; dokunmatikte
  // üzerine gelme de yok) ara görüntü geçişleri atlanır: tuval doğrudan çizilir, kenar yumuşatma tuvalin kendisinden
  if (composer && quality === 'low' && built.outlineFocus === false) { composer.dispose?.(); composer = null; outline = null; }
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
  // Fotogerçekçi sahne (oda pilotu): ışık pişmiş ortamla aynı fiziksel birimde; diğer lambalar kapatılabilir,
  // ton eşleme ve pozlama sahneden gelir. Verilmezse araç sahnelerinin kil ışığı aynen kalır.
  if (lights.keyColor) key.color.setRGB(...lights.keyColor);
  if (lights.hemi !== undefined) hemi.intensity = lights.hemi;
  if (lights.fillIntensity !== undefined) fill.intensity = lights.fillIntensity;
  if (lights.rimIntensity !== undefined) rim.intensity = lights.rimIntensity;
  if (renderer && lights.toneMapping === 'agx') renderer.toneMapping = THREE.AgXToneMapping;
  if (renderer && lights.exposure) renderer.toneMappingExposure = lights.exposure;

  // Etkileşimli şablonlar. h.extra: şablona ait sayılan başka nesneler (ör. masadaki dağınık vidalar);
  // tıklanınca o şablona yakınlaşılır. h.focusRadius: yakın planda kadraja girecek yarıçap (mm).
  const hotspots = built.hotspots.map((h, i) => {
    const box = new THREE.Box3().setFromObject(h.object);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    for (const root of [h.object, ...(h.extra || [])]) root.traverse((o) => { o.userData.hotspot = h.id; });
    return {
      ...h, index: i, box, center: c, size,
      // Sahne anchor'ı Vector3 olarak verirse aynı nesne kullanılır: sahne onu sonradan taşıyabilir.
      anchor: h.anchor?.isVector3 ? h.anchor : h.anchor ? new THREE.Vector3(...h.anchor) : new THREE.Vector3(c.x, c.y, box.max.z + 18),
      base: h.object.position.clone(),
      lift: 0, liftTarget: 0,
      name: story.hotspots?.[h.id]?.[lang] || h.id,
      desc: story.hotspots?.[h.id]?.desc?.[lang] || '',
      live: story.live && !!h.preset,
    };
  });

  // ---- dikey ekran kadrajı ----
  // Sahneler yatay ekran için kurgulanır. Dikey ekranda yatay görüş açısı yarıya iner: kamera geri
  // çekilir, şablonların ortasına döner ve nesneler başlığın altına insin diye bakış biraz yükselir.
  {
    const w = canvasHost.clientWidth || innerWidth, h = canvasHost.clientHeight || innerHeight;
    const aspect = w / h;
    if (aspect < 0.9 && built.portraitShot) shots.main = { pos: [...built.portraitShot.pos], target: [...built.portraitShot.target] };
    else if (aspect < 0.9 && hotspots.length) {
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

  // Yakın planda fare (ya da parmak) kamerayı nesnenin etrafında gezdirir: etrafa bakılabilsin.
  const orbit = { k: 0 };
  // Kenardan bakma (sahne isterse: built.look = { min, max, edge, speed }): fare tuvalin sol ya da sağ kenar
  // şeridindeyken kamera yerinde durup başını o yana çevirir; ortaya dönünce olduğu yerde kalır (ürünler imlecin
  // altından kaymaz). Açı radyan, artı sola. Yakın planda etkisi söner; hareket azaltmada kapalı.
  const look = built.look ? { yaw: 0, turn: 0, cue: '', edge: 0.2, speed: 0.8, ...built.look } : null;
  function applyCamera(t) {
    par.x += (par.tx - par.x) * TUNE.damping;
    par.y += (par.ty - par.y) * TUNE.damping;
    orbit.k += ((focused ? 1 : 0) - orbit.k) * 0.06;
    // Hareket azaltma tercihinde fareye bağlı kayma yok; yakın planda etrafa bakmak yine mümkün.
    const pYaw = par.on ? TUNE.parallaxYaw : 0, pPitch = par.on ? TUNE.parallaxPitch : 0;
    const yawAmp = pYaw + (TUNE.focusYaw - pYaw) * orbit.k;
    const pitchAmp = pPitch + (TUNE.focusPitch - pPitch) * orbit.k;
    const breathe = par.on ? Math.sin(t * 0.21) * TUNE.breathe : 0;
    tmpOff.copy(rig.pos).sub(rig.target);
    q.setFromAxisAngle(Z, -par.x * yawAmp + breathe);
    tmpOff.applyQuaternion(q);
    tmpRight.crossVectors(tmpOff, Z).normalize();
    q.setFromAxisAngle(tmpRight, par.y * pitchAmp);
    tmpOff.applyQuaternion(q);
    camera.position.copy(rig.target).add(tmpOff);
    camera.lookAt(rig.target);
    const yaw = look ? look.yaw * (1 - orbit.k) : 0;
    if (yaw) camera.lookAt(tmpOff.copy(rig.target).sub(camera.position).applyAxisAngle(Z, yaw).add(camera.position));
  }

  function flyTo(shot, dur, ease = EASE_IN_OUT) {
    const from = { px: rig.pos.x, py: rig.pos.y, pz: rig.pos.z, tx: rig.target.x, ty: rig.target.y, tz: rig.target.z };
    const to = { px: shot.pos[0], py: shot.pos[1], pz: shot.pos[2], tx: shot.target[0], ty: shot.target[1], tz: shot.target[2] };
    return gsap.to(from, {
      ...to, duration: dur, ease,
      onUpdate: () => { rig.pos.set(from.px, from.py, from.pz); rig.target.set(from.tx, from.ty, from.tz); },
    });
  }

  // Bir şablona yakın plan: ana kameranın yönünden, nesneyi ve biraz çevresini kadraja alan mesafe.
  // Sahne isterse (focusShots) kendi açısını verir; h.focusElev bakışın en az ne kadar yukarıdan
  // olacağını söyler (0.42 ≈ 25°, 0.9 ≈ 64°: bölmelerin içi görünsün diye).
  // Yatay ekranda kart sol kenardaysa (sahne built.focusShift verir: ekran genişliğinin kesri) nesne sağa kayar.
  // Kartın yanda mı altta mı olduğu tek yerde, resize()'da karar verilir (sideCard, root.dataset.panel).
  let sideCard = false;
  function focusShot(h) {
    let pos, center;
    const custom = built.focusShots?.[h.id];
    if (custom) {
      pos = new THREE.Vector3(...custom.pos);
      center = new THREE.Vector3(...custom.target);
      // custom.w: kadraja yatayda sığması gereken genişlik (mm). Dar ekranda (telefon dikey) kamera bakış doğrultusunda
      // o genişlik sığana kadar geri çekilir; geniş ekranda zaten sığar, açı değişmez
      if (custom.w) {
        const gerek = custom.w / 2 / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect), d = pos.distanceTo(center);
        if (gerek > d) pos.sub(center).multiplyScalar(gerek / d).add(center);
      }
    } else {
      const dir = new THREE.Vector3(...shots.main.pos).sub(new THREE.Vector3(...shots.main.target)).normalize();
      const elev = h.focusElev ?? 0.42;
      if (dir.z < elev) {
        const flat = Math.hypot(dir.x, dir.y) || 1;
        const k = Math.sqrt(1 - elev * elev) / flat;
        dir.set(dir.x * k, dir.y * k, elev);
      }
      dir.normalize();
      const radius = h.focusRadius || Math.max(h.size.x, h.size.y, h.size.z) * 0.62 + 40;
      const wide = camera.aspect < 0.9 ? 1.5 : 1.25; // dikey ekranda biraz daha geniş
      const dist = (radius / Math.sin((camera.fov * Math.PI) / 360)) * wide;
      // focusCenter: animasyonla büyüyen nesnede (çiçek açar) kadrajın ortası, büyümüş hâle göre verilir.
      center = (h.focusCenter ? new THREE.Vector3(...h.focusCenter) : h.center).clone();
      pos = center.clone().addScaledVector(dir, dist);
    }
    const dir = pos.clone().sub(center), dist = dir.length();
    dir.divideScalar(dist);
    const halfH = dist * Math.tan((camera.fov * Math.PI) / 360);
    if (camera.aspect < 0.9 || (built.focusShift && !sideCard)) {
      // Kart alttan tam genişlik açılır (dikey ekran; yan panelli sahnede telefon ve dar pencere): kadraj aşağı kayar,
      // nesne kartın üstünde kalır.
      const up = new THREE.Vector3(0, 0, 1).addScaledVector(dir, -dir.z).normalize();
      center.addScaledVector(up, -0.4 * halfH);
      pos.addScaledVector(up, -0.4 * halfH);
    } else if (built.focusShift) {
      // Kamera ve hedef birlikte sola: nesne ekranda sağa kayar
      const right = new THREE.Vector3().crossVectors(dir.clone().negate(), Z).normalize();
      const shift = -built.focusShift * 2 * halfH * camera.aspect;
      center.addScaledVector(right, shift);
      pos.addScaledVector(right, shift);
    }
    return { pos: pos.toArray(), target: center.toArray() };
  }

  // ---- DOM: işaretçiler, şablon şeridi ve yakın plan kartı ----
  function labelHotspot(h, pin, chip) {
    const kisa = story.hotspots?.[h.id]?.pin?.[lang] || h.name; // sahne kısa ad verdiyse işaretçide o
    pin.innerHTML = `<span class="pin-dot"></span><span class="pin-label"><b>${kisa}</b><i>${ui.look}</i></span>`;
    pin._lw = 0; // not genişliği yeniden ölçülsün (üst üste binme denetimi)
    chip.innerHTML = `<span class="chip-name">${h.name}</span><span class="chip-act">${h.live ? ui.look : ui.soon}</span>`;
    chip.setAttribute('aria-label', `${h.name}, ${ui.look}`);
  }
  let card = root.querySelector('.story-card');
  if (!card) {
    card = document.createElement('div');
    card.className = 'story-card';
    root.insertBefore(card, stripEl);
  }
  card.setAttribute('role', 'group');
  card.innerHTML = `<h2 class="sc-title" id="sc-title-${toolId}"></h2><p class="sc-desc"></p>
    <div class="sc-actions"><button type="button" class="sc-go"></button><span class="sc-soon"></span><button type="button" class="sc-back"></button></div>
    <p class="sc-hint"></p>`;
  card.setAttribute('aria-labelledby', `sc-title-${toolId}`);
  card.hidden = true;
  const scTitle = card.querySelector('.sc-title'), scDesc = card.querySelector('.sc-desc');
  const scGo = card.querySelector('.sc-go'), scSoon = card.querySelector('.sc-soon'), scBack = card.querySelector('.sc-back');
  const scHint = card.querySelector('.sc-hint');
  function fillCard(h) {
    scTitle.textContent = h.name;
    scDesc.textContent = h.desc || '';
    scGo.textContent = (h.preset === 'magaza' && h.cta?.[lang]) || ui.designThis; // mağaza ürünü: "Mağazada gör"
    scGo.hidden = !h.live;
    scSoon.textContent = h.live ? '' : ui.soonCard;
    scSoon.hidden = h.live;
    scBack.textContent = ui.back;
    scHint.textContent = coarse ? ui.lookAroundTouch : ui.lookAround;
  }
  // Sayfanın kart kancası (onCard) hata atarsa odak akışı yarıda kalmasın (sahne canlanması, kart açılışı)
  function cardHook(h) {
    try { onCard?.(h, card); } catch (e) { console.error('onCard', e); }
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
    pin.style.setProperty('--i', h.index); // nabız sırası
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
      el.addEventListener('click', (e) => activate(h, e.detail === 0));
    }
  }
  scGo.addEventListener('click', () => { if (focused && !busy) pick(focused); });
  scBack.addEventListener('click', () => { if (busy) return; if (driven && onActivate?.(null)) return; unfocus(true); });

  // ---- vurgulama ----
  let hovered = null;
  let focused = null; // yakın plandaki şablon
  let flight = null;  // süren kamera uçuşu (yenisi başlarken durdurulur)
  let driven = false; // kamera sayfanın elinde (kaydırmalı tur): yakın plan uçuşsuz, tıklamalar önce sayfaya
  // force: yakın plandan çıkarken hover zaten boş olsa da vurgu ve sahne canlandırması sıfırlansın.
  function setHover(h, force = false) {
    if (hovered === h && !force) return;
    hovered = h;
    // Yakın planda nesne yükselmez (düşen parçalar hedefini kaçırmasın). noLift: mobilya ve duvardaki
    // nesneler (dolap, buzdolabı, çerçeve) hiç yükselmez; sahne kendi davetini verir (çekmece aralanır).
    for (const x of hotspots) x.liftTarget = x === h && !focused && !x.noLift ? TUNE.hoverLift : 0;
    // built.outlineFocus === false: yakın plandaki ürüne çizgi çekilmez (yalnız genel planda üzerine gelince)
    if (outline) outline.selectedObjects = focused && built.outlineFocus === false ? [] : h ? [h.object] : focused ? [focused.object] : [];
    pinBtns.forEach((p, i) => p.classList.toggle('on', hotspots[i] === h));
    chipBtns.forEach((c, i) => c.classList.toggle('on', hotspots[i] === h));
    if (renderer) renderer.domElement.style.cursor = h ? 'pointer' : '';
    // Yakın plandayken sahne için "üzerinde durulan" yakındaki şablondur: canlandırması sürer.
    built.onHover?.(h?.id ?? focused?.id ?? null);
  }

  // ---- yakın plan / ana sahne / seçim ----
  let busy = false;
  let state = 'intro';
  let lastPointer = 'mouse';
  const copyEls = () => root.querySelectorAll('.story-copy > *');

  // Tıklama (işaretçi, nesne ya da şerit): önce yakınlaş, animasyonu oynat, kartı göster.
  // Atölyeye geçiş karttaki "Bu şablonla tasarla" düğmesiyle.
  function activate(h, fromKeyboard = false) {
    if (busy) return;
    if (driven && onActivate?.(h)) return;
    // Yakın plandayken yeniden tıklama: küçük bir tepki (hareket azaltma tercihinde yok)
    if (focused === h) { built.onPoke?.(h.id, { reduced: mode === 'still' }); return; }
    focusOn(h, fromKeyboard);
  }

  function focusOn(h, fromKeyboard = false, fly = true) {
    if (intro.progress() < 1) intro.progress(1); // giriş bitmeden seçildiyse girişi tamamla
    const prev = focused;
    focused = h;
    state = 'focus';
    pinBtns.forEach((p, i) => p.classList.toggle('is-cur', hotspots[i] === h));
    // Üzerine gelince yükselen nesne hemen yerine iner: sahne eşyaları şablona bağlanırken
    // grup havadaysa sonra masanın içine gömülürler.
    for (const x of hotspots) {
      x.liftTarget = 0;
      x.lift = 0;
      x.object.position.z = x.base.z + (x.settle || 0);
    }
    h.object.updateMatrixWorld(true);
    hovered = null;
    setHover(h);
    flight?.kill();
    if (fly) flight = flyTo(focusShot(h), mode === 'still' ? 0.001 : TUNE.focusDur, 'power3.inOut');
    chipBtns.forEach((c, i) => c.classList.toggle('focused', hotspots[i] === h));
    root.classList.add('is-focused');
    // Önceki açılış/kapanış akışları (gecikmeli olanlar dahil) öldürülür: yarışıp kartı gizlemesinler.
    gsap.killTweensOf([card, ...copyEls()]);
    gsap.to(copyEls(), { autoAlpha: 0, y: -10, duration: mode === 'still' ? 0.1 : 0.3, ease: 'power2.in' });
    fillCard(h);
    card.hidden = false;
    cardHook(h);
    const quick = mode === 'still' || fromKeyboard;
    gsap.fromTo(card, { autoAlpha: 0, y: 14 }, {
      autoAlpha: 1, y: 0, duration: mode === 'still' ? 0.1 : 0.45, ease: 'power3.out', delay: quick ? 0 : 0.35,
      // Klavyeyle gelindiyse odak, kart görünür olunca karttaki ilk düğmeye geçer.
      onComplete: () => { if (fromKeyboard && focused === h) (h.live ? scGo : scBack).focus({ preventScroll: true }); },
    });
    live.textContent = `${h.name}. ${h.desc || ''}`;
    if (prev && prev !== h) built.onUnfocus?.(prev.id);
    built.onFocus?.(h.id, { reduced: mode === 'still' });
  }

  function unfocus(fromCard = false, fly = true) {
    if (!focused) return;
    const h = focused;
    focused = null;
    state = 'main';
    chipBtns.forEach((c) => c.classList.remove('focused'));
    pinBtns.forEach((p) => p.classList.remove('is-cur'));
    root.classList.remove('is-focused');
    setHover(null, true);
    if (lastPointer === 'touch') { par.tx = 0; par.ty = 0; } // parmakla çevrilen bakış ana kadraja dönsün
    gsap.killTweensOf([card, ...copyEls()]);
    cardHook(null);
    gsap.to(card, { autoAlpha: 0, y: 10, duration: 0.25, ease: 'power2.in', onComplete: () => { if (!focused) card.hidden = true; } });
    gsap.to(copyEls(), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.2 });
    flight?.kill();
    if (fly) flight = flyTo(shots.main, mode === 'still' ? 0.001 : TUNE.focusDur, 'power2.inOut');
    built.onUnfocus?.(h.id);
    if (fromCard) chipBtns[h.index]?.focus({ preventScroll: true });
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
    if (busy) return; // çift tıklama: atölyeye bir kez geçilir
    if (h.disari && h.preset === 'magaza') { window.open(h.disari, '_blank', 'noopener'); return; } // mağaza ürünü: yeni sekmede
    if (!h.live) {
      if (focused !== h) focusOn(h);
      toast(ui.soonToast);
      return;
    }
    busy = true;
    markSeen(toolId);
    live.textContent = ui.goingTo.replace('{name}', h.name);
    const still = mode === 'still';
    const preset = h.preset; // uçuş sürerken şablon değişse de tıklanan şablon açılır
    const tl = gsap.timeline({ onComplete: () => onPick?.(preset, h) });
    tl.to(copyEls(), { autoAlpha: 0, y: -14, duration: still ? 0.15 : 0.35, ease: 'power2.in', stagger: still ? 0 : 0.04, overwrite: 'auto' }, 0)
      .to([pinsEl, stripEl, card], { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 0);
    // Yakın plandaysak kamera zaten orada: biraz daha sokulur; değilse nesneye uçar.
    if (!still) {
      const s = focusShot(h);
      const p = new THREE.Vector3(...s.pos), tg = new THREE.Vector3(...s.target);
      const closer = { pos: tg.clone().lerp(p, focused === h ? 0.78 : 1).toArray(), target: s.target };
      flight?.kill();
      flight = flyTo(closer, focused === h ? 0.8 : TUNE.pickDur);
      tl.add(flight, 0.05);
    }
    const veilAt = still ? 0.1 : (focused === h ? 0.45 : TUNE.pickDur - 0.3);
    tl.to(veil, { autoAlpha: 1, duration: still ? 0.15 : 0.42, ease: 'power1.in' }, veilAt);
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
  const targets = hotspots.flatMap((h) => [h.object, ...(h.extra || [])]);
  function hitAt(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets, true)[0];
    return hit ? hotspots.find((h) => h.id === hit.object.userData.hotspot) : null;
  }
  if (renderer) {
    const el = renderer.domElement;
    let downAt = null;
    // Dokunmatik: yakın planda parmakla etrafa bakma (sürükleme farkı kadar döner). Sahne built.touchOrbit = false
    // derse kapalı: kaydırma sayfanındır (oda: şablon değiştirir).
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      lastPointer = e.pointerType;
      downAt = [e.clientX, e.clientY];
      drag = e.pointerType === 'touch' && focused && built.touchOrbit !== false ? { x: e.clientX, y: e.clientY, tx: par.tx, ty: par.ty } : null;
    });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      if (e.pointerType === 'touch') {
        if (!drag) return;
        par.tx = THREE.MathUtils.clamp(drag.tx + ((e.clientX - drag.x) / r.width) * 2.4, -1, 1);
        par.ty = THREE.MathUtils.clamp(drag.ty + ((e.clientY - drag.y) / r.height) * 2.4, -1, 1);
        return;
      }
      par.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      par.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (look) { // kenar şeridinde ne kadar derindeyse o kadar hızlı döner (0 ortada, 1 en kenarda)
        const fx = (e.clientX - r.left) / r.width, ed = look.edge;
        look.turn = fx < ed ? (ed - fx) / ed : fx > 1 - ed ? -(fx - (1 - ed)) / ed : 0;
      }
      if ((state === 'main' || state === 'focus') && !busy) setHover(hitAt(e.clientX, e.clientY));
    });
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'touch') { par.tx = 0; par.ty = 0; if (look) look.turn = 0; }
      setHover(null);
    });
    el.addEventListener('pointercancel', () => { drag = null; downAt = null; });
    el.addEventListener('pointerup', (e) => {
      drag = null;
      if (!downAt || (state !== 'main' && state !== 'focus') || busy) return;
      const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
      downAt = null;
      if (moved > 8) return;
      const h = hitAt(e.clientX, e.clientY);
      if (h) activate(h);
      else if (focused && !driven) unfocus(card.contains(document.activeElement));
    });
  }
  // Atölyeye geçerken yok sayılır. Odak karttaysa şeritteki düğmeye döner (gizlenen kartta kalmasın).
  const onKey = (e) => {
    if (e.key !== 'Escape' || busy) return;
    if (driven && onActivate?.(null)) return;
    unfocus(card.contains(document.activeElement));
  };
  addEventListener('keydown', onKey);

  // ---- boyut ----
  let viewW = 1, viewH = 1; // her karede DOM'dan okunmasın diye (zorunlu yerleşim hesabı)
  function resize() {
    const w = canvasHost.clientWidth || 1, h = canvasHost.clientHeight || 1;
    viewW = w; viewH = h;
    camera.aspect = w / h;
    // Dar ekranda geniş sahne sığsın diye görüş açısını büyüt.
    camera.fov = w / h < 0.8 ? (built.portraitFov || 46) : w / h < 1.2 ? 38 : 30;
    camera.updateProjectionMatrix();
    // Yatay telefonda (kısa ve geniş ekran) alttan açılan kart ekranı kaplıyordu: dokunmatikte de kart yanda
    const kisaYatay = w / h >= 1.4 && h <= 560;
    sideCard = !!built.focusShift && w / h >= 0.9 && (kisaYatay || !matchMedia('(pointer: coarse), (max-width: 720px)').matches);
    if (built.focusShift) root.dataset.panel = sideCard ? 'side' : 'bottom';
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
    if (look) {
      const canTurn = mode !== 'still' && !focused && state === 'main';
      if (canTurn && look.turn) {
        look.yaw = THREE.MathUtils.clamp(look.yaw + look.turn * Math.abs(look.turn) * look.speed * dt, look.min, look.max);
      }
      // Dönülebilecek yön sayfaya bildirilir (kenarda ipucu gösterebilir); sınıra gelince söner
      const cue = !canTurn ? '' : look.turn > 0 && look.yaw < look.max ? 'left' : look.turn < 0 && look.yaw > look.min ? 'right' : '';
      if (cue !== look.cue) { look.cue = cue; root.dataset.look = cue; }
    }
    applyCamera(t);
    if (renderer) {
      if (composer) composer.render(dt); else renderer.render(scene, camera);
      const w = viewW, hh = viewH;
      const order = [];
      hotspots.forEach((h, i) => {
        v.copy(h.anchor);
        v.z += h.lift + h.settle;
        v.project(camera);
        const vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
        const p = pinBtns[i];
        const px = ((v.x + 1) / 2) * w, py = ((1 - v.y) / 2) * hh;
        p.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        p.classList.toggle('off', !vis);
        const left = px > w * 0.68; // sağ kenara yakınsa not sola açılır
        p.classList.toggle('left', left);
        if (vis) order.push({ i, px, py, left, depth: v.z });
      });
      // Üst üste binen notlar: kameraya yakın olan kalır, arkadakinde yalnız nokta görünür.
      order.sort((a, b) => a.depth - b.depth);
      const placed = [];
      for (const o of order) {
        const p = pinBtns[o.i];
        if (!p._lw) p._lw = p.querySelector('.pin-label')?.offsetWidth || 0;
        const lw = p._lw || 90;
        const pad = p.classList.contains('mini') ? 8 : 2; // eşikte titremesin
        const x0 = o.left ? o.px - 13 - lw : o.px + 13, y0 = o.py - 14;
        const hit = placed.some((q) => x0 - pad < q[2] && x0 + lw + pad > q[0] && y0 - pad < q[3] && y0 + 26 + pad > q[1]);
        p.classList.toggle('mini', hit);
        if (!hit) placed.push([x0, y0, x0 + lw, y0 + 26]);
      }
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
  hotspots.forEach((h) => { h.settle = mode === 'full' && !h.noLift ? TUNE.settleRise : 0; });
  gsap.set('.story-copy > *', { autoAlpha: 1, y: 0 });
  gsap.set([pinsEl, stripEl], { autoAlpha: 0 });
  gsap.set(words, { yPercent: mode === 'full' ? 112 : 0 });
  gsap.set([ledeEl, ctaEl.parentElement], { autoAlpha: mode === 'still' ? 1 : 0, y: mode === 'full' ? 14 : 0 });
  if (mode === 'short') gsap.set(titleEl, { autoAlpha: 0 });
  root.setAttribute('aria-busy', 'false');
  live.textContent = '';
  start();

  // Giriş bitince sahne "görüldü" sayılır (bir sonraki ziyaret kısa giriş) ve sayfaya haber verilir.
  const intro = gsap.timeline({ onComplete: () => {
    if (state === 'intro') state = 'main';
    root.classList.add('pins-ready'); // notların noktaları iki kez nabız atar
    markSeen(toolId);
    onReady?.();
  } });
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
      if (focused) built.onUnfocus?.(focused.id);
      focused = null;
      state = 'main';
      gsap.killTweensOf(card);
      cardHook(null);
      card.hidden = true;
      gsap.set(card, { clearProps: 'opacity,visibility,transform' });
      root.classList.remove('is-focused');
      chipBtns.forEach((c) => c.classList.remove('focused'));
      pinBtns.forEach((p) => p.classList.remove('is-cur'));
      setHover(null, true);
      root.hidden = false;
      start();
      const h = hotspots.find((x) => x.preset === fromPreset);
      if (h && mode !== 'still') { const s = focusShot(h); rig.pos.set(...s.pos); rig.target.set(...s.target); }
      flight?.kill();
      flight = flyTo(shots.main, mode === 'still' ? 0.001 : 1.0, 'power3.out');
      gsap.timeline({ onComplete: () => { if (state !== 'focus') state = 'main'; } })
        .to(veil, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .add(flight, 0)
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
        h.desc = story.hotspots?.[h.id]?.desc?.[l] || '';
        labelHotspot(h, pinBtns[i], chipBtns[i]);
      });
      if (focused) { fillCard(focused); cardHook(focused); }
    },
    // Dışarıdan yakın plan (oda sahnesinde telefonun döngü düğmesi): o bölgeye uçar, kartı açar.
    focus(id) { const h = hotspots.find((x) => x.id === id); if (h && !busy) activate(h); },
    unfocus() { if (!busy) unfocus(); },
    get focusedId() { return focused?.id ?? null; },
    // Sayfanın sürdüğü kamera (kaydırmalı tur). drive(true): uçuşlar durur, kamerayı setView verir; focusTo/blur kartı
    // ve sahne canlanmasını uçuşsuz açıp kapar; shotOf(id) o bölgenin yakın plan kadrajı (id yoksa genel plan).
    drive(on) { driven = !!on; if (driven) { flight?.kill(); if (intro.progress() < 1) intro.progress(1); } root.toggleAttribute('data-driven', driven); },
    get driven() { return driven; },
    // Ekran noktasındaki bölge (yoksa null): sayfa sürüklemenin üründen mi başladığını sorar
    hit(x, y) { return hitAt(x, y)?.id ?? null; },
    shotOf(id) { const h = id && hotspots.find((x) => x.id === id); return h ? focusShot(h) : { pos: [...shots.main.pos], target: [...shots.main.target] }; },
    view() { return { pos: rig.pos.toArray(), target: rig.target.toArray() }; },
    setView(pos, target) { rig.pos.set(...pos); rig.target.set(...target); },
    focusTo(id) { const h = hotspots.find((x) => x.id === id); if (h && focused !== h && !busy) focusOn(h, false, false); },
    blur() { if (focused && !busy) unfocus(false, false); },
    get ready() { return intro.progress() >= 1; },
    get busy() { return busy; }, // atölyeye geçiş sürüyor (sayfa girdileri beklesin)
    // Sahnenin kendi denetimi (oda: yakın planda şablon değiştirme, built.api)
    api: built.api || null,
    // Yakın plandaki şablon değişince "Bu şablonla tasarla" yeni şablonu açar; şablonu olmayan bölgede atölye yakında.
    setPreset(id, preset) {
      const h = hotspots.find((x) => x.id === id);
      if (!h) return;
      h.preset = preset;
      h.live = story.live && !!preset;
      if (focused === h) {
        scGo.textContent = (preset === 'magaza' && h.cta?.[lang]) || ui.designThis;
        scGo.hidden = !h.live;
        scSoon.textContent = h.live ? '' : ui.soonCard;
        scSoon.hidden = h.live;
      }
    },
    // Konsoldan kadraj ayarı ve kare kare doğrulama: debug.seek(0.4) girişi %40'a sarar ve bir kare çizer.
    debug: {
      rig, shots, flyTo, TUNE, intro, look,
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
