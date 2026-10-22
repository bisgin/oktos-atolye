// Çatı katı: duvardaki 75" OLED televizyon ve içindeki süreç sunumu (kaldırılan süreç rayının ve kartındaki süreç
// listesinin yerine). Ekran hep açık; sekiz adım doğrusal bir sırayla görünür, tıklayınca sıradakine geçer (8'den sonra
// 1'e döner). Solda adımın döngü videosu (assets/cati/ekran/surec-NN.mp4, scripts/ekran-dongu.py ile WebP'den), sağda
// numara, büyük harfli ad (altında kum rengi fosforlu şerit, fikir rafının kâğıt dilindeki gibi) ve açıklama, altta 8
// düğümlü zaman çizgisi. Metin yalnız core/cati-veri.js SUREC'ten (ad, desc); ekranın kendi iki satırı (etiket, ipucu)
// burada, değiştirmek için metin parametresi.
// Ekran iki katman: yazı katmanı (1920 × 1080; dokunmatik küçük ekranda 1280 × 720) yalnız adım değişince, geçişte ve
// yazı tipi gelince yeniden çizilir; video katmanı (yalnız video kutusu) en çok 24 fps, yalnız yeni video karesi gelince.
// Böylece her video karesinde tam ekran doku yüklenmez. İkisi de kendinden ışıklı (MeshBasicMaterial, ton eşlemesiz).
// Telefonda (dokunmatik küçük ekran) büyük yazılı 'kompakt' düzen: TV ekran genişliğinde görünürken açıklama ~12 px.
// API: oledEkran({ lang, reduce, adimlar, metin, kompakt, kanvasEn }) → { grup, ekran, git(i), ileri(), geri(),
// tikla(uv), aktif, onDegis(fn) → bırak, update(), kanvas() (kontrol için birleşik görüntü), dispose() }. Sahne
// tıklamada ekran ışınının uv'sini tikla'ya verir (zaman çizgisindeki düğüm o adıma, başka yer sıradakine götürür).
// Önünde çok hafif cam yansıması (sahnenin ortam haritası; toplamalı karışım, ekranı karartmaz).
// Hareket azaltmada video yok (yalnız afiş), geçiş yok. Otomatik oynatma reddedilirse afiş ya da videonun ilk karesi
// durur, ilk kullanıcı etkileşiminde yeniden denenir. update() çağrılmazsa (gizli sekme, sahne durmuş) hiçbir şey
// birikmez: geçişler duvar saatine bağlı, sıradaki çağrıda tamamlanır.
// Birim mm, Z yukarı. grup yerel çerçevede: duvar yüzeyi y = 0 (duvar +y'de), ekran yüzü −y'ye bakar, alt kenar z = 0,
// yatayda ortada. Sahneye koymak: grubu duvar yüzeyindeki noktaya taşı, yerel −y odaya bakacak biçimde döndür.
// Önizleme: .impeccable/onizleme/ekran.html (yerel).
import * as THREE from 'three';
import { SUREC } from './cati-veri.js';

const VIDEO_KOK = new URL('../assets/cati/ekran/', import.meta.url).href;

// ---- ölçüler (mm) ----
// 75" 16:9 panel: görüntü alanı 1660 × 934, dış ölçü 1671 × 963 (yan çerçeve 5,5, üst 8, alt 21). Duvardan öne doğru:
// askı plakası 5, askı kolları 17, arka elektronik gövde 18, panel 25 mm; ekran yüzü panelin 1,5 mm önünde.
export const OLED = {
  en: 1671, boy: 963, panel: 25,
  ekran: { en: 1660, boy: 934, alt: 21 },
  y: { plaka: -5, kol: -22, govde: -40, panel: -65, ekran: -66.5, cam: -68 },
};

// Ekranın kendi metni (adım metinleri SUREC'ten)
export const EKRAN_METIN = {
  baslik: { tr: 'Süreç', en: 'Process' },
  ipucu: { tr: 'Tıkla: sıradaki adım', en: 'Click: next step' },
};

// ---- ekran düzeni (1920 × 1080 birimde; küçük kanvasta ölçeklenir) ----
// genis: masaüstü. kompakt: telefon; TV ekran genişliğinde (~370 CSS px, ölçek ~0,19) görünür, yazılar büyür:
// açıklama 64 px → ~12 px, ad 140 px → ~27 px okunur.
const W = 1920, H = 1080;
const DUZEN = {
  genis: {
    m: 80,                                       // kenar boşluğu
    etiketY: 104,                                // sol üst etiket ve sağ üst ipucu taban çizgisi
    video: { x: 80, y: 150, w: 820, h: 640 },    // video kutusu (video oranı korunarak sığar, üste ve ortaya hizalı;
    sag: { x: 970, w: 870, y: 150, alt: 812 },   // 4:3 kayıtlar kutuyu doldurur), sağ sütun: numara, ad, açıklama
    cizgi: { y: 930, r: 30, rA: 44 },            // zaman çizgisi: düğüm yarıçapı, etkin düğüm
    p: { etiket: 32, no: 40, ad: 132, acik: [52, 40], dugum: [30, 40], dugumAd: 32, bar: 6 }, // punto (açıklama: en büyük, en küçük)
  },
  kompakt: {
    m: 72,
    etiketY: 110,
    video: { x: 72, y: 156, w: 820, h: 640 },
    sag: { x: 950, w: 898, y: 156, alt: 818 },
    cizgi: { y: 924, r: 38, rA: 54 },
    p: { etiket: 42, no: 50, ad: 140, acik: [64, 54], dugum: [40, 52], dugumAd: 44, bar: 10 },
  },
};
const SIYAH = '#000000', YAZI = '#f3eee5', SOLUK = 'rgba(243,238,229,0.62)', CIZGI = 'rgba(243,238,229,0.24)';
const MUREKKEP = '#1d1f22', KUM = '#e8c48c';
const GECIS = 250;                               // adım değişiminde çapraz solma (ms)
const VIDEO_FPS = 24;

const AD_FONT = (p) => `700 ${p}px "Big Shoulders Display", "Schibsted Grotesk", Arial, sans-serif`;
const YAZI_FONT = (p, k = 500) => `${k} ${p}px "Schibsted Grotesk", Arial, sans-serif`;
const MONO_FONT = (p, k = 500) => `${k} ${p}px "IBM Plex Mono", ui-monospace, monospace`;
// Kanvasa yazmadan önce sayfanın yazı tipleri (en çok 1,5 sn beklenir; gelmezse yedek yazı tipi)
const yaziTipleri = () => Promise.race([
  Promise.all([AD_FONT(120), YAZI_FONT(52), YAZI_FONT(32, 600), MONO_FONT(34)].map((f) => document.fonts?.load(f))),
  new Promise((r) => setTimeout(r, 1500)),
]).catch(() => {});

const kanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const buyuk = (s, lang) => s.toLocaleUpperCase(lang === 'en' ? 'en' : 'tr');
const yumusak = (t) => t * t * (3 - 2 * t);
function yuvarlakYol(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
// Başlığı genişliğe sığdırır: önce tek satırda en çok %25 küçültür, sığmazsa iki satıra böler ([satırlar, punto])
function sigdir(g, metin, en, maks) {
  for (let p = maks; p >= maks * 0.75; p -= 2) { g.font = AD_FONT(p); if (g.measureText(metin).width <= en) return [[metin], p]; }
  const k = metin.split(' ');
  const satir = k.length > 1 ? [k.slice(0, Math.ceil(k.length / 2)).join(' '), k.slice(Math.ceil(k.length / 2)).join(' ')] : [metin];
  for (let p = maks; p >= 40; p -= 2) { g.font = AD_FONT(p); if (satir.every((s) => g.measureText(s).width <= en)) return [satir, p]; }
  return [satir, 40];
}
// Metni genişliğe göre satırlara böler (geçerli g.font ile)
function sar(g, metin, en) {
  const out = [];
  let s = '';
  for (const k of metin.split(/\s+/)) {
    const t = s ? `${s} ${k}` : k;
    if (!s || g.measureText(t).width <= en) s = t; else { out.push(s); s = k; }
  }
  if (s) out.push(s);
  return out;
}
const harfAraligi = (g, px) => { if ('letterSpacing' in g) g.letterSpacing = `${px}px`; };

export function oledEkran({ lang = 'tr', reduce = false, adimlar = SUREC, metin, kompakt, kanvasEn } = {}) {
  const L = (o) => (typeof o === 'string' ? o : o?.[lang] ?? o?.tr ?? '');
  const M = { ...EKRAN_METIN, ...metin };
  const n = adimlar.length;
  const videoYolu = (a) => a.video ?? `${VIDEO_KOK}surec-${String(a.id).slice(0, 2)}.mp4`;

  // Dokunmatik küçük ekran (telefon): 1280 × 720 kanvas ve büyük yazılı düzen (ekran ölçüsü 0 gelirse bilinmiyor
  // sayılır). kompakt ve kanvasEn (1920 | 1280) verilirse onlar belirler.
  const kisa = Math.min(screen?.width || 0, screen?.height || 0);
  const kucuk = !!matchMedia?.('(pointer: coarse)').matches && kisa > 0 && kisa < 900;
  const D = DUZEN[(kompakt ?? kucuk) ? 'kompakt' : 'genis'];
  const s = (kanvasEn ?? (kucuk ? 1280 : W)) / W;
  const [cA, gA] = kanvas(Math.round(W * s), Math.round(H * s));
  const [cB, gB] = kanvas(Math.round(D.video.w * s), Math.round(D.video.h * s));
  const [eskiA, geA] = kanvas(cA.width, cA.height); // geçişte önceki görüntü
  const [eskiB, geB] = kanvas(cB.width, cB.height);
  const doku = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const tA = doku(cA), tB = doku(cB);

  // ---- model ----
  const grup = new THREE.Group();
  grup.name = 'oled-tv';
  const E = OLED.ekran, Y = OLED.y;
  const kutu = (w, d, h, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  const kenarM = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 0.6, roughness: 0.42 });
  const onM = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.3 });     // çerçeve: parlak siyah cam
  const arkaM = new THREE.MeshStandardMaterial({ color: 0x2c2e32, roughness: 0.72 });  // arka yüz ve gövde: koyu gri
  const askiM = new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.5, roughness: 0.55 });
  // Panel: kutu yüz sırası +x, −x, +y (arka), −y (ön), +z, −z
  const panel = new THREE.Mesh(new THREE.BoxGeometry(OLED.en, OLED.panel, OLED.boy), [kenarM, kenarM, arkaM, onM, kenarM, kenarM]);
  panel.position.set(0, Y.panel + OLED.panel / 2, OLED.boy / 2);
  panel.castShadow = panel.receiveShadow = true;
  grup.add(
    panel,
    kutu(1050, Y.kol - Y.govde, 500, 0, (Y.kol + Y.govde) / 2, 330, arkaM),             // elektronik gövde (alt yarıda)
    kutu(36, Y.plaka - Y.kol, 430, -200, (Y.plaka + Y.kol) / 2, 420, askiM),             // askı kolları (VESA 400)
    kutu(36, Y.plaka - Y.kol, 430, 200, (Y.plaka + Y.kol) / 2, 420, askiM),
    kutu(620, -Y.plaka, 120, 0, Y.plaka / 2, 560, askiM),                                // duvar plakası
  );
  // Ekran yüzü (tıklama hedefi): düzlem −y'ye bakar (rotateX(π/2): yerel y → z), u soldan sağa, v aşağıdan yukarı
  const ekranZ = E.alt + E.boy / 2;
  const ekran = new THREE.Mesh(new THREE.PlaneGeometry(E.en, E.boy).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: tA, toneMapped: false }));
  ekran.name = 'oled-ekran';
  ekran.position.set(0, Y.ekran, ekranZ);
  // Video katmanı: aynı düzlemde, video kutusunun üstünde (polygonOffset ile önde çizilir; tıklamayı ekrana bırakır)
  const mmX = E.en / W, mmZ = E.boy / H;
  const videoMesh = new THREE.Mesh(new THREE.PlaneGeometry(D.video.w * mmX, D.video.h * mmZ).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tB, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
  videoMesh.name = 'oled-video';
  videoMesh.position.set((D.video.x + D.video.w / 2 - W / 2) * mmX, Y.ekran, ekranZ + (H / 2 - D.video.y - D.video.h / 2) * mmZ);
  videoMesh.raycast = () => {};
  // Cam: sahnenin ortam haritasını çok hafif yansıtır; toplamalı karışım (ekranı karartmaz), ortam yoksa görünmez
  const cam = new THREE.Mesh(new THREE.PlaneGeometry(E.en, E.boy).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 1, roughness: 0.2, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
  }));
  cam.name = 'oled-cam';
  cam.position.set(0, Y.cam, ekranZ);
  cam.receiveShadow = true; // gölgedeki ekranda güneşin parlaması olmasın
  cam.raycast = () => {};
  grup.add(ekran, videoMesh, cam);

  // ---- durum ----
  let aktif = 0, yaziHazir = false, kirliA = true, kirliB = true;
  let gecis = null;                 // { t0 }
  let sonA = 0, sonB = 0;
  const dinleyiciler = new Set();
  const temizle = [];               // dispose'da çağrılacak dinleyici sökücüler
  const dinle = (hedef, olay, fn, sec) => { hedef.addEventListener(olay, fn, sec); temizle.push(() => hedef.removeEventListener(olay, fn, sec)); };

  // Afişler (küçük, hepsi baştan iner): video gelene kadar ve hareket azaltmada gösterilir
  const afisler = adimlar.map((a, i) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.decoding = 'async';
    im.onload = () => { if (i === aktif) kirliB = true; };
    im.src = new URL(a.poster, import.meta.url).href; // SUREC yolları core/ ile lab/ için aynı (bir alt klasör)
    return im;
  });

  // ---- video ----
  let video = null, yeniKare = true, bekleyenOynat = false;
  const rvfc = typeof HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  const oynat = () => {
    if (!video || document.hidden) return;
    video.play().then(() => { bekleyenOynat = false; }).catch(() => { bekleyenOynat = true; }); // reddedilirse afiş kalır
  };
  if (!reduce) {
    video = document.createElement('video');
    video.muted = video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    dinle(video, 'loadeddata', () => { kirliB = true; yeniKare = true; });
    if (rvfc) {
      const kareGeldi = () => { yeniKare = true; video?.requestVideoFrameCallback(kareGeldi); };
      video.requestVideoFrameCallback(kareGeldi);
    }
    // Otomatik oynatma reddedildiyse ilk kullanıcı etkileşiminde yeniden dene
    const etkilesim = () => { if (bekleyenOynat) oynat(); };
    for (const o of ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click']) dinle(window, o, etkilesim, { capture: true, passive: true });
    // Gizli sekmede dur, dönünce sürdür
    dinle(document, 'visibilitychange', () => { if (document.hidden) video.pause(); else oynat(); });
  }
  const videoYukle = () => {
    if (!video) return;
    video.src = videoYolu(adimlar[aktif]);
    oynat();
  };

  // Yazı tipleri gelince yazı katmanı çizilir; sonradan gelen yazı tipi de yeniden çizdirir
  yaziTipleri().then(() => { yaziHazir = true; kirliA = true; });
  if (document.fonts?.addEventListener) dinle(document.fonts, 'loadingdone', () => { kirliA = true; });

  // ---- çizim: yazı katmanı ----
  // Zaman çizgisi düğümlerinin x'i (1920 biriminde)
  const dugumX = (i) => D.m + D.cizgi.rA + i * (W - 2 * D.m - 2 * D.cizgi.rA) / Math.max(1, n - 1);
  function cizA() {
    const g = gA, a = adimlar[aktif];
    g.setTransform(s, 0, 0, s, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = SIYAH; g.fillRect(0, 0, W, H);
    if (!yaziHazir) return;
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';

    // Sol üst: etiket
    const P = D.p, k = P.etiket / 32;
    g.font = MONO_FONT(P.etiket); harfAraligi(g, 6);
    g.fillStyle = KUM; g.fillRect(D.m, D.etiketY - 22 * k, 14 * k, 14 * k);
    g.fillStyle = SOLUK; g.fillText(buyuk(L(M.baslik), lang), D.m + 32 * k, D.etiketY);
    harfAraligi(g, 0);

    // Sağ sütun: numara, ad (fosforlu şerit), açıklama
    const S = D.sag;
    g.font = MONO_FONT(P.no);
    const no = String(aktif + 1).padStart(2, '0'), noY = S.y + P.no * 0.85;
    g.fillStyle = KUM; g.fillText(no, S.x, noY);
    g.fillStyle = SOLUK; g.fillText(` / ${String(n).padStart(2, '0')}`, S.x + g.measureText(no).width, noY);

    const [satir, p] = sigdir(g, buyuk(L(a.ad), lang), S.w, P.ad);
    let by = noY + 36 + p * 0.8;
    for (const t of satir) {
      // Şerit harflerin alt kısmının arkasında (kâğıttaki gibi); koyu zeminde açık harf okunsun diye kum rengi kısık
      const w = g.measureText(t).width;
      g.globalAlpha = 0.58; g.fillStyle = KUM; g.fillRect(S.x - 6, by - p * 0.3, w + 14, p * 0.3); g.globalAlpha = 1;
      g.fillStyle = YAZI; g.fillText(t, S.x, by);
      by += p * 0.9;
    }
    // Açıklama: sütuna sığana kadar küçülür
    const ust = by - p * 0.9 + 52 + P.acik[0];
    let dp = P.acik[0], sat = [];
    for (; dp >= P.acik[1]; dp -= 2) {
      g.font = YAZI_FONT(dp);
      sat = sar(g, L(a.desc), S.w);
      if (ust + (sat.length - 1) * dp * 1.32 <= S.alt) break;
    }
    g.fillStyle = 'rgba(243,238,229,0.88)';
    sat.forEach((t, j) => g.fillText(t, S.x, ust + j * dp * 1.32));

    // Zaman çizgisi: geçmiş dolu, etkin kum renkli ve büyük, gelecek boş
    const C = D.cizgi;
    g.lineCap = 'round';
    for (let i = 0; i < n - 1; i++) {
      g.strokeStyle = i < aktif ? 'rgba(243,238,229,0.7)' : CIZGI;
      g.lineWidth = i < aktif ? 5 : 3;
      g.beginPath(); g.moveTo(dugumX(i), C.y); g.lineTo(dugumX(i + 1), C.y); g.stroke();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const x = dugumX(i), et = i === aktif, r = et ? C.rA : C.r;
      g.beginPath(); g.arc(x, C.y, r, 0, Math.PI * 2);
      if (et) {
        g.fillStyle = KUM; g.fill();
        g.strokeStyle = 'rgba(232,196,140,0.35)'; g.lineWidth = 4;
        g.beginPath(); g.arc(x, C.y, r + 12, 0, Math.PI * 2); g.stroke();
      } else if (i < aktif) {
        g.fillStyle = 'rgba(243,238,229,0.86)'; g.fill();
      } else {
        g.fillStyle = SIYAH; g.fill();
        g.strokeStyle = 'rgba(243,238,229,0.42)'; g.lineWidth = 3; g.stroke();
      }
      g.font = MONO_FONT(P.dugum[et ? 1 : 0]);
      g.fillStyle = et || i < aktif ? MUREKKEP : SOLUK;
      g.fillText(String(i + 1), x, C.y + 2);
    }
    // Düğüm adları: hepsi sığarsa hepsi, sığmazsa yalnız etkin adımın adı (kenarlara taşmadan)
    g.textBaseline = 'alphabetic';
    const ara = (W - 2 * D.m - 2 * C.rA) / Math.max(1, n - 1);
    g.font = YAZI_FONT(26, 500);
    const adlar = adimlar.map((x) => L(x.ad));
    const altY = C.y + C.rA + 14 + P.dugumAd;
    if (adlar.every((t) => g.measureText(t).width <= ara - 18)) {
      adlar.forEach((t, i) => { g.fillStyle = i === aktif ? YAZI : SOLUK; g.fillText(t, dugumX(i), altY); });
    } else {
      g.font = YAZI_FONT(P.dugumAd, 600);
      const t = adlar[aktif], w = g.measureText(t).width;
      const x = Math.min(Math.max(dugumX(aktif), D.m + w / 2), W - D.m - w / 2);
      g.fillStyle = YAZI; g.fillText(t, x, altY);
    }
    // Sağ üst: ipucu (sağ altta son düğümün adıyla çakışıyordu)
    g.textAlign = 'right';
    g.font = MONO_FONT(P.etiket); harfAraligi(g, 2);
    g.fillStyle = 'rgba(243,238,229,0.5)'; g.fillText(L(M.ipucu), W - D.m, D.etiketY);
    harfAraligi(g, 0);
    g.textAlign = 'left';
  }

  // ---- çizim: video katmanı ----
  function cizB() {
    const g = gB, V = D.video;
    g.setTransform(s, 0, 0, s, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = SIYAH; g.fillRect(0, 0, V.w, V.h);
    const vid = video && video.readyState >= 2 && video.videoWidth ? video : null;
    const af = afisler[aktif];
    const kaynak = vid || (af?.complete && af.naturalWidth ? af : null);
    if (!kaynak) return;
    const kw = vid ? vid.videoWidth : af.naturalWidth, kh = vid ? vid.videoHeight : af.naturalHeight;
    const kal = D.p.bar, bar = 16 + kal; // ilerleme çubuğuna yer (afişte de: video gelince boy değişmesin)
    const k = Math.min(V.w / kw, (V.h - bar) / kh), w = kw * k, h = kh * k, x = (V.w - w) / 2, y = 0;
    g.save();
    yuvarlakYol(g, x, y, w, h, 18); g.clip();
    g.drawImage(kaynak, x, y, w, h);
    g.restore();
    if (vid && Number.isFinite(vid.duration) && vid.duration > 0) {
      const u = (vid.currentTime % vid.duration) / vid.duration;
      g.fillStyle = 'rgba(243,238,229,0.16)'; yuvarlakYol(g, x, h + 14, w, kal, kal / 2); g.fill();
      g.fillStyle = KUM; yuvarlakYol(g, x, h + 14, Math.max(kal, w * u), kal, kal / 2); g.fill();
    }
  }

  // Geçiş: o anki iki katmanın görüntüsü saklanır, yeni görüntünün üstünde sönerek kaybolur
  function gecisBaslat() {
    if (reduce) return;
    geA.globalAlpha = geB.globalAlpha = 1;
    geA.clearRect(0, 0, eskiA.width, eskiA.height); geA.drawImage(cA, 0, 0);
    geB.clearRect(0, 0, eskiB.width, eskiB.height); geB.drawImage(cB, 0, 0);
    gecis = { t0: performance.now() };
  }
  const ustune = (g, eski, a) => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.drawImage(eski, 0, 0); g.globalAlpha = 1; };

  function update() {
    const simdi = performance.now();
    let e = 1;
    if (gecis) {
      e = Math.min(1, (simdi - gecis.t0) / GECIS);
      if (e < 1 && simdi - sonA < 1000 / 30) return; // geçiş 30 fps'yi geçmesin
    }
    const eskiPay = gecis ? 1 - yumusak(e) : 0; // önceki görüntünün opaklığı
    if (kirliA || gecis) {
      cizA();
      if (eskiPay > 0) ustune(gA, eskiA, eskiPay);
      tA.needsUpdate = true;
      kirliA = false;
      sonA = simdi;
    }
    // Video katmanı: geçişte her adımda, sonra yalnız yeni video karesinde (en çok 24 fps; kare bildirimi gelmezse 4 Hz)
    const oynuyor = video && video.readyState >= 2 && !video.paused;
    const vakit = simdi - sonB >= 1000 / VIDEO_FPS;
    if (kirliB || gecis || (oynuyor && vakit && (rvfc ? yeniKare || simdi - sonB > 250 : true))) {
      cizB();
      if (eskiPay > 0) ustune(gB, eskiB, eskiPay);
      tB.needsUpdate = true;
      kirliB = false; yeniKare = false;
      sonB = simdi;
    }
    if (gecis && e >= 1) gecis = null;
  }

  // ---- adımlar ----
  function git(i) {
    const yeni = ((Math.round(i) % n) + n) % n;
    if (yeni === aktif) return aktif;
    if (sonA) gecisBaslat(); // henüz hiç çizilmediyse (açılışta adım seçimi) geçiş yok
    aktif = yeni;
    kirliA = kirliB = true;
    videoYukle();
    for (const fn of dinleyiciler) fn(aktif, adimlar[aktif]);
    return aktif;
  }
  // Ekrana tıklama (ekran ışınının uv'si): zaman çizgisindeki bir düğümse o adıma, değilse sıradakine
  function tikla(uv) {
    if (uv) {
      const x = uv.x * W, y = (1 - uv.y) * H, ara = (W - 2 * D.m - 2 * D.cizgi.rA) / Math.max(1, n - 1);
      if (Math.abs(y - D.cizgi.y) < D.cizgi.rA + 20) {
        const i = Math.round((x - dugumX(0)) / ara);
        if (i >= 0 && i < n && Math.abs(x - dugumX(i)) < ara / 2) return git(i);
      }
    }
    return git(aktif + 1);
  }

  videoYukle();

  return {
    grup,
    ekran,
    git,
    ileri: () => git(aktif + 1),
    geri: () => git(aktif - 1),
    tikla,
    get aktif() { return aktif; },
    onDegis(fn) { dinleyiciler.add(fn); return () => dinleyiciler.delete(fn); },
    update,
    // Kontrol için: ekranın şu anki görüntüsü (iki katman birleşik, yeni kanvas)
    kanvas() {
      const [c, g] = kanvas(cA.width, cA.height);
      g.drawImage(cA, 0, 0);
      g.drawImage(cB, Math.round(D.video.x * s), Math.round(D.video.y * s));
      return c;
    },
    dispose() {
      temizle.forEach((f) => f());
      dinleyiciler.clear();
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); video = null; }
      afisler.forEach((im) => { im.onload = null; im.removeAttribute('src'); });
      tA.dispose(); tB.dispose();
      grup.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      for (const c of [cA, cB, eskiA, eskiB]) c.width = c.height = 0;
    },
  };
}
