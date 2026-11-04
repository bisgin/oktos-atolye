// Masadaki monitörde tasarım döngüsü (2026-11-03 v5, kullanıcı isteği; senaryo biggie-sunum.md "03.11 güncelleme").
// Biggie masaya oturunca (karakter olayı 'oturdu') ekranda bir dioramanın dönüş videosu (assets/urunler/diorama/*/
// donus.mp4) döngüde oynar; kalkınca ('kalkti') durur ve ekran eski görüntüsüne döner. Her oturuşta sıradaki tasarımdan
// başlar. Video kanvasa ekran oranında (letterbox, koyu zemin) çizilir; kanvas yalnız monitör kadrajdayken ve video
// oynarken güncellenir (onBeforeRender), telefonda genel planda maliyet yok.
// Girdi: sahne (oda-esya.glb 'monitor_ekran' ağı). Çıktı: { basla(), dur(), get oynuyor, get sira }.
import * as THREE from 'three';

const TASARIMLAR = ['duck-hunt', 'super-mario-1-1', 'doom-1993-koridoru', 'itachi-nin-tahti', 'iroh-un-agidi',
  'mortal-kombat-the-pit', 'pokemon-karagoz-savasi', 'rock-lee-ve-gaara', 'kara-sakal-ve-hasir-sapkalilar', 'undertale-karanliklar-efendisi'];
const KOK = new URL('../assets/urunler/diorama/', import.meta.url);
const EN = 640, BOY = 360; // ekran 16:9

export function odaMonitoru(scene, { reduce = false } = {}) {
  let ekran = null, eskiMat = null, mat = null, video = null, tuval = null, g = null, doku = null;
  let sira = (() => { try { return Number(sessionStorage.getItem('oda-monitor-sira')) || 0; } catch { return 0; } })();
  let oynuyor = false;
  const bul = () => (ekran ??= scene.getObjectByName('monitor_ekran') ?? null);
  function hazirla() {
    if (mat || !bul()) return !!mat;
    eskiMat = ekran.material;
    tuval = document.createElement('canvas');
    tuval.width = EN; tuval.height = BOY;
    g = tuval.getContext('2d');
    doku = new THREE.CanvasTexture(tuval);
    doku.colorSpace = THREE.SRGBColorSpace;
    const ilk = eskiMat.map ?? eskiMat.emissiveMap;
    if (ilk) { doku.flipY = ilk.flipY; doku.wrapS = ilk.wrapS; doku.wrapT = ilk.wrapT; doku.repeat.copy(ilk.repeat); doku.offset.copy(ilk.offset); }
    mat = eskiMat.clone();
    mat.map = doku;
    mat.emissiveMap = doku;
    mat.emissive = new THREE.Color(0xffffff);
    mat.emissiveIntensity = eskiMat.emissiveIntensity || 1;
    video = document.createElement('video');
    Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
    const once = ekran.onBeforeRender;
    ekran.onBeforeRender = function (...a) {
      if (oynuyor && ekran.material === mat && video.readyState >= 2) ciz();
      return once?.apply(this, a);
    };
    return true;
  }
  function ciz() {
    g.fillStyle = '#121416'; g.fillRect(0, 0, EN, BOY);
    const vw = video.videoWidth || 1, vh = video.videoHeight || 1, k = Math.min(EN / vw, BOY / vh);
    g.drawImage(video, (EN - vw * k) / 2, (BOY - vh * k) / 2, vw * k, vh * k);
    doku.needsUpdate = true;
  }
  return {
    basla() {
      if (oynuyor || !hazirla()) return false;
      const ad = TASARIMLAR[sira % TASARIMLAR.length];
      sira = (sira + 1) % TASARIMLAR.length;
      try { sessionStorage.setItem('oda-monitor-sira', String(sira)); } catch { /* yoksay */ }
      oynuyor = true;
      video.src = new URL(`${ad}/donus.mp4`, KOK).href;
      g.fillStyle = '#121416'; g.fillRect(0, 0, EN, BOY); doku.needsUpdate = true;
      ekran.material = mat;
      if (!reduce) video.play().catch(() => {}); // hareket azaltmada ilk kare durur
      else video.addEventListener('loadeddata', () => ciz(), { once: true });
      return ad;
    },
    dur() {
      if (!oynuyor) return;
      oynuyor = false;
      video.pause();
      if (ekran && eskiMat) ekran.material = eskiMat;
    },
    get oynuyor() { return oynuyor; },
    get sira() { return sira; },
  };
}
