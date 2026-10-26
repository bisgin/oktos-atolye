// Seri efektleri (kendi çizimimiz; bilinen bir meme görseli ya da sesi kopyalanmaz). Hepsi SVG, ekran uzayında
// (1080×1920), her biri kare sayısının SAF işlevi: ciz(t) aynı t için aynı çizimi verir (kare kare çekim).
// Dil filmle aynı: mürekkep kontur, dolgu konturdan kayık (baskı kayması), çizgiler 8 fps "kaynar" (burada 4 karede bir,
// patlama enerjik olsun).
//  - patlama: dikenli doodle patlama (dış turuncu, orta limon, kâğıt çekirdek), şok halkası, hız çizgileri, savrulan
//    parçalar. İki bitiş: 'delik' (ortadan delik açılır, altta yeni dünya görünür; deliğin kenarı mürekkep) ya da
//    'kapla' (kâğıt çekirdek ekranı kaplar: sonraki sahne kâğıt).
//  - hitmarker: dört çapraz çizgi (beyaz, mürekkep kenarlı), açılışta 1,5 → 1 sıçrar, söner.
//  - odakCizgileri: kenardan merkeze sivrilen hız çizgileri (zoom punch'ın çizgisi).
import { rng } from './ps1.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (ust, ad, nit = {}) => { const e = document.createElementNS(NS, ad); for (const [a, v] of Object.entries(nit)) e.setAttribute(a, v); ust.appendChild(e); return e; };
const f1 = (v) => v.toFixed(1);
const sinir = (v, a, b) => Math.min(b, Math.max(a, v));
const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, x)));
const kareIn = (x) => { const t = sinir(x, 0, 1); return t * t; };

export const RENK = { murekkep: '#1d1d20', turuncu: '#e0662a', koyu: '#94400f', limon: '#ffd34d', kagit: '#fbf9f5', zemin: '#f1ede6' };

// Kaynayan çokgen: köşeler + kenar ortaları tohumlu kayar (adım = kaynama karesi). Kapalı yol.
function titrekYol(pts, tohum, adim, genlik) {
  const r = rng(tohum * 977 + adim * 131);
  const j = () => (r() - 0.5) * 2 * genlik;
  let d = '';
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const a = [p[0] + j(), p[1] + j()];
    const m = [(p[0] + q[0]) / 2 + j() * 1.4, (p[1] + q[1]) / 2 + j() * 1.4];
    d += (i ? 'L' : 'M') + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(m[0]) + ' ' + f1(m[1]);
  });
  return d + 'Z';
}
// Dikenli yıldız: n diken, dış yarıçap R·(dış ± sapma), iç yarıçap R·ic
function yildiz(c, R, n, dis, ic, tohum, don = 0) {
  const r = rng(tohum), pts = [];
  for (let i = 0; i < n; i++) {
    const a0 = don + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.18, a1 = a0 + Math.PI / n + (r() - 0.5) * 0.12;
    const Ro = R * (dis + (r() - 0.5) * 0.3), Ri = R * (ic + (r() - 0.5) * 0.08);
    pts.push([c[0] + Ro * Math.cos(a0), c[1] + Ro * Math.sin(a0)], [c[0] + Ri * Math.cos(a1), c[1] + Ri * Math.sin(a1)]);
  }
  return pts;
}
const daire = (c, R, n = 18) => Array.from({ length: n }, (_, i) => [c[0] + R * Math.cos((i / n) * Math.PI * 2), c[1] + R * Math.sin((i / n) * Math.PI * 2)]);

// ---------- Patlama
// opt: merkez, Rmax (px), buyume (kare), tohum, bitis: { tur: 'delik'|'kapla', bas, sure }, son (kare: sonra gizli)
export function patlama(ust, { merkez, Rmax = 1100, buyume = 8, tohum = 1, bitis = null, son = 40, kaynamaAdim = 4, kaplaR = 1500, delikR = 1500, cekirdek = RENK.kagit, cekOran = 0.3 }) {
  const id = 'pm' + tohum;
  const g = el(ust, 'g');
  const defs = el(g, 'defs');
  const mask = el(defs, 'mask', { id, maskUnits: 'userSpaceOnUse', x: -500, y: -500, width: 2080, height: 2920 });
  el(mask, 'rect', { x: -500, y: -500, width: 2080, height: 2920, fill: '#fff' });
  const delikYol = el(mask, 'path', { fill: '#000' });
  const ana = el(g, 'g', { mask: `url(#${id})` });
  const halka = el(ana, 'circle', { fill: 'none', stroke: RENK.murekkep });
  const cizgiler = el(ana, 'g', { stroke: RENK.murekkep, 'stroke-linecap': 'round' });
  const katman = (dolgu, golge, kalin) => ({
    golge: el(ana, 'path', { fill: golge }), dolgu: el(ana, 'path', { fill: dolgu }),
    kontur: el(ana, 'path', { fill: 'none', stroke: RENK.murekkep, 'stroke-width': kalin, 'stroke-linejoin': 'round' }),
  });
  const dis = katman(RENK.turuncu, RENK.koyu, 14), orta = katman(RENK.limon, '#d9a321', 11), cek = katman(cekirdek, '#d8d0c3', 9);
  const parcaG = el(g, 'g');
  const delikKenar = el(g, 'path', { fill: 'none', stroke: RENK.murekkep, 'stroke-width': 12, 'stroke-linejoin': 'round' });
  // Savrulan parçalar (tohumlu): yön, hız, dönüş, biçim, renk
  const r = rng(tohum * 31 + 7);
  const PR = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + (r() - 0.5) * 0.35, tur = i % 3;
    const boy = 22 + r() * 36, renk = [RENK.turuncu, RENK.limon, RENK.murekkep, RENK.kagit][i % 4];
    const e = el(parcaG, 'path', { fill: renk, stroke: RENK.murekkep, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    return { a, v: 1400 + r() * 1300, don: (r() - 0.5) * 0.5, tur, boy, e };
  });
  const N = 20, cizgiVeri = Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2 + (r() - 0.5) * 0.2, L: 0.25 + r() * 0.3 }));
  const cizgiEl = cizgiVeri.map(() => el(cizgiler, 'line'));
  const c = merkez;

  function ciz(t) {
    const gor = t >= 0 && t <= son;
    g.style.display = gor ? '' : 'none';
    if (!gor) return;
    const adim = Math.floor(t / kaynamaAdim);
    const R = Rmax * expoOut(t / buyume) * (1 + 0.012 * Math.max(0, t - buyume));
    // Kapla: kâğıt çekirdek büyür (ekranı örter)
    let cekR = R * cekOran;
    if (bitis?.tur === 'kapla') cekR = cekR + (kaplaR - cekR) * kareIn((t - bitis.bas) / bitis.sure);
    const kat = (k, pts, tohumK, gen) => {
      const d = titrekYol(pts, tohumK, adim, gen);
      k.dolgu.setAttribute('d', d); k.kontur.setAttribute('d', d);
      k.golge.setAttribute('d', d); k.golge.setAttribute('transform', 'translate(12 14)');
    };
    kat(dis, yildiz(c, R, 13, 1.02, 0.58, tohum), tohum, 6 + R * 0.012);
    kat(orta, yildiz(c, R * 0.74, 11, 1.0, 0.56, tohum + 5, 0.3), tohum + 1, 5 + R * 0.01);
    kat(cek, daire(c, cekR, 22), tohum + 2, 4 + cekR * 0.012);
    // Şok halkası: hızla genişler, incelir, söner
    const hs = expoOut(t / (buyume + 6));
    halka.setAttribute('cx', c[0]); halka.setAttribute('cy', c[1]);
    halka.setAttribute('r', f1(Rmax * 0.62 * hs + 40));
    halka.setAttribute('stroke-width', f1(Math.max(0, 22 * (1 - hs))));
    halka.setAttribute('opacity', f1(1 - hs * 0.6));
    // Hız çizgileri: patlamanın dışında, dışa kaçar, kısalır
    const cg = sinir(1 - t / (buyume + 10), 0, 1);
    cizgiVeri.forEach((v, i) => {
      const r0 = R * 1.08 + 30, r1 = r0 + Rmax * v.L * cg;
      const e = cizgiEl[i];
      e.setAttribute('x1', f1(c[0] + r0 * Math.cos(v.a))); e.setAttribute('y1', f1(c[1] + r0 * Math.sin(v.a)));
      e.setAttribute('x2', f1(c[0] + r1 * Math.cos(v.a))); e.setAttribute('y2', f1(c[1] + r1 * Math.sin(v.a)));
      e.setAttribute('stroke-width', f1(10 * cg));
    });
    // Parçalar: dışa savrulur (hız azalır), döner
    PR.forEach((p, i) => {
      const s = p.v * (1 - Math.exp(-t / 9)) * 0.6, x = c[0] + s * Math.cos(p.a), y = c[1] + s * Math.sin(p.a), b = p.boy * (0.6 + 0.4 * expoOut(t / 4));
      const pts = p.tur === 0 ? [[0, -b], [b * 0.9, b * 0.6], [-b * 0.9, b * 0.6]] : p.tur === 1 ? [[-b, -b * 0.6], [b, -b * 0.6], [b * 0.7, b * 0.6], [-b * 0.7, b * 0.6]] : yildiz([0, 0], b, 4, 1, 0.42, tohum + i);
      p.e.setAttribute('d', titrekYol(pts, tohum + 40 + i, adim, 2));
      p.e.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1((p.don * t * 60) % 360)})`);
    });
    // Delik: ortadan açılır, kenarı mürekkep (altta yeni dünya)
    const d = delik(t);
    if (d) {
      delikYol.setAttribute('d', d);
      delikKenar.setAttribute('d', d);
      delikKenar.style.display = '';
    } else { delikYol.setAttribute('d', ''); delikKenar.style.display = 'none'; }
  }
  // Delik yolu (ekran px): yeni dünyanın tuvali bununla kırpılır (clip-path); delik yoksa null
  function delik(t) {
    if (bitis?.tur !== 'delik' || t < bitis.bas || t > son) return null;
    const h = delikR * kareIn((t - bitis.bas) / bitis.sure) + 10;
    return titrekYol(daire(c, h, 26), tohum + 9, Math.floor(t / kaynamaAdim), 8 + h * 0.015);
  }
  const delikTam = (t) => bitis?.tur === 'delik' && t >= bitis.bas + bitis.sure;
  return { g, ciz, delik, delikTam };
}

// ---------- Hitmarker: liste [{ x, y, t0, olcek }], f mutlak kare
export function hitmarker(ust) {
  const g = el(ust, 'g');
  const havuz = [];
  const yeni = () => {
    const h = el(g, 'g');
    const alt = el(h, 'path', { stroke: RENK.murekkep, 'stroke-width': 22, 'stroke-linecap': 'square', fill: 'none' });
    const ust2 = el(h, 'path', { stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'square', fill: 'none' });
    return { h, alt, ust2 };
  };
  const d = (() => {
    let s = '';
    for (const a of [45, 135, 225, 315]) {
      const r = (a * Math.PI) / 180, r0 = 24, r1 = 62;
      s += `M${f1(r0 * Math.cos(r))} ${f1(r0 * Math.sin(r))}L${f1(r1 * Math.cos(r))} ${f1(r1 * Math.sin(r))}`;
    }
    return s;
  })();
  function ciz(liste, f) {
    while (havuz.length < liste.length) havuz.push(yeni());
    havuz.forEach((h, i) => {
      const m = liste[i], t = m ? f - m.t0 : -1;
      if (!m || t < 0 || t > 12) { h.h.style.display = 'none'; return; }
      h.h.style.display = '';
      const s = (m.olcek ?? 1) * (t < 3 ? 1.5 - 0.5 * (t / 3) : 1);
      h.alt.setAttribute('d', d); h.ust2.setAttribute('d', d);
      h.h.setAttribute('transform', `translate(${f1(m.x)} ${f1(m.y)}) scale(${s.toFixed(3)})`);
      h.h.setAttribute('opacity', t > 8 ? f1(1 - (t - 8) / 4) : '1');
    });
  }
  return { ciz };
}

// ---------- Odak çizgileri (zoom punch): kenardan merkeze doğru sivrilen mürekkep kamaları
export function odakCizgileri(ust, { merkez, n = 46, tohum = 3 }) {
  const g = el(ust, 'g', { fill: RENK.murekkep });
  const yol = el(g, 'path');
  function ciz(guc, f) {
    if (guc <= 0.01) { g.style.display = 'none'; return; }
    g.style.display = '';
    const r = rng(tohum * 53 + Math.floor(f / 2)); // 2 karede bir yeniden çizilir (titrek)
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.12, gen = (0.014 + r() * 0.03) * guc;
      const ic = 330 + r() * 260 + (1 - guc) * 500, dis = 1700;
      const p = (rad, aa) => `${f1(merkez[0] + rad * Math.cos(aa))} ${f1(merkez[1] + rad * Math.sin(aa))}`;
      d += `M${p(dis, a - gen)}L${p(ic, a)}L${p(dis, a + gen)}Z`;
    }
    yol.setAttribute('d', d);
    g.setAttribute('opacity', sinir(guc, 0, 1).toFixed(2));
  }
  return { ciz };
}
