// M2 montaj testi: 2 sn (120 kare, 60 fps), plan §3 #2'nin ritmiyle. Yüzler film.js MONTAJ'dan M2–M12,
// stil katmanı sc1.js'ten (SÇ1 ile aynı göz çapası, ölçek, çizgi, kâğıt). Yazı yok.
// Ritim (hızlanır): M2–M3 18 k, M4–M6 12 k, M7–M12 8 k = 120 k. Düz kesme, göz çapası sabit, yüz başına 2 kaynama
// çizimi (yüzün ilk yarısı / ikinci yarısı), kamera 2 sn boyunca doğrusal %1,25 iter (planın 3,2 sn'de %2'si).
// Sorgu: ?yon=yatay|dikey ?etiket=1 (köşede yüz adı, yalnız inceleme) ?kagit=0 (gren yok) ?t=0.5 ?cek=1 (film-cek.py)
import { CAPA, CEKIM, q, FPS, sahneKur, stilKisi, montajKisi } from './sc1.js';

const SIRA = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const SURE = [18, 18, 12, 12, 12, 8, 8, 8, 8, 8, 8];
const TOPLAM = SURE.reduce((a, b) => a + b, 0); // 120
const ITME = 0.0125;

async function montaj() {
  const { kisi, itme, sahne } = sahneKur();
  // Her yüzün iki çizimi önceden hazırlanır (kare çekiminde yalnız innerHTML değişir)
  const t0 = performance.now();
  const cizim = SIRA.map((n, j) => {
    const p = montajKisi(n);
    const a = (j % 2) * 2; // komşu yüzler farklı kaynama tohumlarıyla
    return [stilKisi(n, { p, kaynama: a }), stilKisi(n, { p, kaynama: a + 1 })];
  });
  console.log(`montaj: ${SIRA.length * 2} çizim ${(performance.now() - t0).toFixed(0)} ms`);
  const etiket = q.get('etiket') === '1' ? Object.assign(document.createElement('div'), { className: 'etiket' }) : null;
  if (etiket) sahne.appendChild(etiket);

  const baslar = [];
  SURE.reduce((acc, s) => { baslar.push(acc); return acc + s; }, 0);
  let son = '';
  const kare = (t) => {
    const f = Math.min(TOPLAM - 1, Math.max(0, Math.floor(t * FPS + 1e-6)));
    let j = SURE.length - 1;
    while (baslar[j] > f) j--;
    const h = f - baslar[j] < SURE[j] / 2 ? 0 : 1;
    const anahtar = `${j}-${h}`;
    if (anahtar !== son) { kisi.innerHTML = cizim[j][h]; son = anahtar; }
    const s = 1 + ITME * f / TOPLAM;
    itme.setAttribute('transform', `translate(${CAPA.x} ${CAPA.y}) scale(${s.toFixed(5)}) translate(${-CAPA.x} ${-CAPA.y})`);
    if (etiket) etiket.textContent = `M${SIRA[j]} · k${f} · çizim ${h + 1}`;
  };
  window.tanitim = { kare, sure: () => TOPLAM / FPS };
  kare(0);
  if (CEKIM) window.tanitimHazir = true;
  else if (q.get('t') !== null) kare(+q.get('t'));
  else {
    const bas = performance.now();
    const dongu = () => { kare(((performance.now() - bas) / 1000 * +(q.get('hiz') || 1)) % (TOPLAM / FPS + 0.5)); requestAnimationFrame(dongu); };
    requestAnimationFrame(dongu);
  }
}

montaj().catch((e) => { console.error(e); document.getElementById('hata').textContent = e.message; });
