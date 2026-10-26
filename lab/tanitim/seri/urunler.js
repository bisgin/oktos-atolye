// Ürün bağdaştırıcıları: bölümün ürününü sitedeki aracın KENDİ geometri koduyla üretir (PS1 sahnesi için).
// Sözleşme (ps1.js çağırır):
//   anahtar(degerler) → dizge        (aynı geometriye giden değerler aynı anahtarı verir)
//   async hazirla(degerListesi)       (açılışta, tanitimHazir'dan önce: akışta uğranan bütün değerler üretilir)
//   geometri(degerler) → BufferGeometry ya da [{ g, sabit?: '#renk' }]  (önbellekten; sabit: malzemeden bağımsız parça)
//   bilgi(degerler) → dizge            (PS1 başlığının altındaki canlı ölçü satırı)
//   isteğe bağlı: susle(grup, { THREE, renkMalzeme, ustEkle }) → guncelle(v, p) (ürünle dönen süs), numarali (zar
//   numarası katmanı), uvOlcek (doku ölçeği çarpanı: küçük üründe doku sıklaşsın)
// Yeni ürün: aracın geometri işlevini içe aktar, değerleri aracın ayar nesnesine çevir, csg.scope() içinde üret.
import * as THREE from 'three';
import * as C from '../../../core/csg.js';
import { initCSG, scope } from '../../../core/csg.js';
import { customBin } from '../../../tools/bin/geometry.js';
import { TOOL as VAZO } from '../../../tools/vase/app.js';
import { radiusFn } from '../../../tools/vase/geometry.js';
import { hazirla as qrHazirla, parcalar as qrParcalar } from '../../../tools/qr/geometry.js';
import { duzGeometri, rng } from './ps1.js';

// Değer → geometri önbelleği (bağdaştırıcı başına)
function onbellekli(anahtar, uret) {
  const m = new Map();
  return (v) => {
    const a = anahtar(v);
    if (!m.has(a)) m.set(a, uret(v));
    return m.get(a);
  };
}

// =====================================================================================================================
// ORGANİZER (tools/bin "Serbest kutu", köşeli). Bölmeler ölçüyle yeniden dağılır: ~100 mm'lik gözler (EN 300 → 3 sütun,
// 350'den sonra 4; BOY 200 → 2 satır, 250'den sonra 3). Duvarlar düşük çözünürlükte okunsun diye kalın (4 mm dış, 3 mm
// bölme); yine de basılabilir gerçek bir kutu.
// =====================================================================================================================
const ORG = { shape: 'rect', h: 60, wall: 4, floor: 3, div: 3, r: 8, lip: false, shelf: false, scoop: false, holes: false };
const bolme = (v) => ({ cols: Math.max(1, Math.round(v.w / 100)), rows: Math.max(1, Math.round(v.d / 100)) });

function organizer() {
  const anahtar = (v) => `${v.w}x${v.d}`;
  const geometri = onbellekli(anahtar, (v) => duzGeometri(scope(() => customBin({ ...ORG, w: v.w, d: v.d, ...bolme(v) }))));
  return {
    yukseklik: ORG.h, anahtar, geometri,
    async hazirla(liste) { await initCSG(); for (const v of liste) geometri(v); },
    bilgi(v) { const { cols, rows } = bolme(v); return `${v.w}×${v.d}×${ORG.h} mm · ${cols * rows} bölme`; },
  };
}

// =====================================================================================================================
// SAKSI (tools/vase: aracın kendi TOOL.build'i, oda sahnesiyle aynı yol). Sekizgen, hafif burgulu, kum saati siluet:
// BOY yüksekliği, BEL ortadaki daralmayı verir (bel çapı → siluet yoğunluğu). Taslak çözünürlük (PS1'e uygun az halka).
// Süs: ağzın 14 mm altında toprak (saksının kendi yarıçap işlevinden), içinde düşük poligon lale ve gül (filmdeki gibi).
// =====================================================================================================================
const SAKSI = {
  style: 'hollow', base: 3, wall: 2.6, dBottom: 100, dTop: 136, profile: 'hourglass', kind: 'poly', sides: 8, round: 0.3,
  twistOn: true, twist: 30, twS: 0, twE: 100, ribsOn: false, waveOn: false, noiseOn: false, blendTop: false, flare: 0, ruffleN: 0, rotate: 0,
};
const saksiAyari = (v) => {
  // Bel çapı → kum saati yoğunluğu: ortadaki yarıçap = ortalama − yoğunluk × en büyük yarıçap
  const orta = (SAKSI.dBottom + SAKSI.dTop) / 4, enb = Math.max(SAKSI.dBottom, SAKSI.dTop) / 2;
  const s = { ...VAZO.defaults, ...SAKSI, height: v.h, intensity: Math.max(0, (orta - v.bel / 2) / enb), _thumb: true };
  VAZO.enforce(s);
  return s;
};

function saksi() {
  const anahtar = (v) => `${v.h}|${v.bel}`;
  const geometri = onbellekli(anahtar, (v) => duzGeometri(VAZO.build(saksiAyari(v)).parts[0].result));
  // Toprak: ağzın 14 mm altında, saksının kendi yarıçap işlevinden (duvar kadar içeride), 24 köşeli yelpaze
  const toprak = onbellekli(anahtar, (v) => {
    const s = saksiAyari(v), rf = radiusFn(s), z = v.h - 14, u = z / v.h, n = 24, pos = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const r0 = rf(a0, u) - s.wall * 1.3, r1 = rf(a1, u) - s.wall * 1.3;
      pos.push(0, 0, z, r0 * Math.cos(a0), r0 * Math.sin(a0), z, r1 * Math.cos(a1), r1 * Math.sin(a1), z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
    g.setAttribute('aUst', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(1), 1));
    return g;
  });
  return {
    yukseklik: 170, anahtar, geometri,
    async hazirla(liste) { await initCSG(); for (const v of liste) { geometri(v); toprak(v); } },
    bilgi(v) { return `${v.h} mm boy · ${v.bel} mm bel · 8 köşe`; },
    // Düşük poligon lale ve gül: gövde (ince kutu), iki yaprak (yassı sekizyüzlü), çiçek başı; toprakla birlikte yükselir
    susle(grup, { renkMalzeme, ustEkle }) {
      const sus = new THREE.Group(), toprakAg = new THREE.Mesh(undefined, renkMalzeme('#3b2a20', { ortam: 0.6 }));
      grup.add(sus, toprakAg);
      const ag = (geo, renk, x, y, z, rx = 0, ry = 0, rz = 0, ayar = {}) => {
        const g = ustEkle(geo.toNonIndexed());
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, renkMalzeme(renk, { ortam: 0.55, ...ayar }));
        m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
        sus.add(m);
        return m;
      };
      const yesil = '#4f7a3a', koyuYesil = '#3c6130';
      const sap = (x, y, boy) => ag(new THREE.BoxGeometry(3.4, 3.4, boy), yesil, x, y, boy / 2);
      const yaprak = (x, y, z, aci) => ag(new THREE.OctahedronGeometry(1, 0).scale(5, 15, 1.6), koyuYesil, x, y, z, 0.5, 0, aci);
      // Lale: altı köşeli açık kupa (dışa açılan kesik koni) + iç taç
      sap(-20, 8, 104); yaprak(-26, 8, 34, 0.6); yaprak(-14, 10, 46, -0.7);
      ag(new THREE.CylinderGeometry(15, 7, 28, 6, 1, true).rotateX(Math.PI / 2), '#e2563f', -20, 8, 116, 0, 0, 0, { side: THREE.DoubleSide });
      ag(new THREE.ConeGeometry(8, 14, 6).rotateX(Math.PI / 2), '#f0a03a', -20, 8, 112);
      // Gül: sıkıştırılmış yirmiyüzlü + üstte küçük tomurcuk
      sap(18, -6, 92); yaprak(24, -8, 40, -0.5); yaprak(12, -2, 58, 0.8);
      ag(new THREE.IcosahedronGeometry(14, 0).scale(1, 1, 0.78), '#c8304a', 18, -6, 100);
      ag(new THREE.IcosahedronGeometry(7, 0), '#e04866', 18, -6, 109);
      return (v) => { const z = v.h - 14; sus.position.z = z; toprakAg.geometry = toprak(v); };
    },
  };
}

// =====================================================================================================================
// ZAR SETİ (aracı yok: geometri burada). d4, d6, d8, d10 (beşgen yamuk yüzlü), d12, d20; düz yüzlü çokyüzlüler.
// KENAR: yuvarlatma yarıçapı (köşeleri içe alınmış çokyüzlünün köşelerine küre dizilip dışbükey zarf alınır: yüzler
// aynı düzlemde kalır, kenarlar yuvarlanır; manifold hull). Numaralar kendi piksel yazı tipimizle, yüz başına (aNum).
// =====================================================================================================================
const PHI = (1 + Math.sqrt(5)) / 2;
const isaretli = (dizi) => dizi.flatMap((p) => {
  const out = [[]];
  for (const c of p) { const n = []; for (const o of out) { if (c === 0) n.push([...o, 0]); else n.push([...o, c], [...o, -c]); } out.splice(0, out.length, ...n); }
  return out;
});
const d10Koseleri = () => {
  const H = 1.05, a = Math.PI / 5, c = (H * (1 - Math.cos(a))) / (1 + Math.cos(a)), k = [[0, 0, H], [0, 0, -H]];
  for (let i = 0; i < 10; i++) k.push([Math.cos(i * a), Math.sin(i * a), i % 2 ? -c : c]);
  return k;
};
// R: çevrel yarıçap / BOYUT; num: numara kutusunun yüz yarıçapına oranı; n0: ilk numara
const ZARLAR = [
  { ad: 'd20', k: [...isaretli([[0, 1, PHI]]), ...isaretli([[1, PHI, 0]]), ...isaretli([[PHI, 0, 1]])], R: 0.66, num: 1.0, n0: 1 },
  { ad: 'd4', k: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], R: 0.78, num: 0.9, n0: 1 },
  { ad: 'd6', k: isaretli([[1, 1, 1]]), R: 0.66, num: 0.85, n0: 1 },
  { ad: 'd8', k: isaretli([[1, 0, 0]]).concat(isaretli([[0, 1, 0]]), isaretli([[0, 0, 1]])), R: 0.66, num: 1.0, n0: 1 },
  { ad: 'd10', k: d10Koseleri(), R: 0.64, num: 0.7, n0: 0 },
  { ad: 'd12', k: [...isaretli([[1, 1, 1]]), ...isaretli([[0, 1 / PHI, PHI]]), ...isaretli([[1 / PHI, PHI, 0]]), ...isaretli([[PHI, 0, 1 / PHI]])], R: 0.64, num: 0.95, n0: 1 },
];
const birim = (k) => { const R = Math.max(...k.map((p) => Math.hypot(...p))); return k.map((p) => p.map((x) => x / R)); };
// Fibonacci küre noktaları (yuvarlatmada köşe başına)
const KURE = Array.from({ length: 26 }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / 26, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
  return [r * Math.cos(a), y, r * Math.sin(a)];
});
const v3 = (p) => new THREE.Vector3(...p);

// Keskin çokyüzlünün yüzleri: zarfın üçgenleri normaline göre gruplanır → { n, c (yüz ortası), R (yüz yarıçapı) }
function yuzler(k) {
  const r = scope(() => C.hullPts(k)), P = r.positions, I = r.indices, np = r.numProp, Y = [];
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((j) => v3([P[I[t + j] * np], P[I[t + j] * np + 1], P[I[t + j] * np + 2]]));
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (!Y.some((y) => y.n.dot(n) > 0.999)) Y.push({ n });
  }
  for (const y of Y) {
    const d = Math.max(...k.map((p) => v3(p).dot(y.n)));
    const ust = k.map(v3).filter((p) => Math.abs(p.dot(y.n) - d) < 1e-4);
    y.c = ust.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(ust.length);
    y.R = Math.max(...ust.map((p) => p.distanceTo(y.c)));
    y.d = d;
  }
  // Belirlenimci sıra: üstten alta, sonra açıya göre
  return Y.sort((a, b) => b.n.z - a.n.z || Math.atan2(a.n.y, a.n.x) - Math.atan2(b.n.y, b.n.x));
}

function zar() {
  let ONCE = null; // keskin çokyüzlülerin yüzleri (manifold açılınca, hazirla'da)
  const anahtar = (v) => `${v.b}|${v.k}`;
  const tek = (z, i, boyut, kenar) => {
    const R = z.R * boyut, ri = Math.min(...z.Y.map((y) => y.d)) * R, r = Math.min(kenar, ri * 0.7);
    const f = (ri - r) / ri; // köşeler içe alınır, küreler yüzleri yerinde tutar
    const nokta = z.k.flatMap((p) => (r > 0 ? KURE.map((q) => p.map((x, j) => x * R * f + q[j] * r)) : [p.map((x) => x * R)]));
    const m = scope(() => C.hullPts(nokta));
    // Yerleşim: tohumlu bir yüz aşağı bakar, rastgele yön; altısı bir halkada (tabla dönünce hiçbiri sürekli örtülmez)
    const rr = rng(97 + i * 13), dus = z.Y[Math.floor(rr() * z.Y.length)].n;
    const q = new THREE.Quaternion().setFromUnitVectors(dus, new THREE.Vector3(0, 0, -1));
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rr() * Math.PI * 2));
    const halka = 46, aci = (i / 6) * Math.PI * 2 + 0.3;
    const yer = new THREE.Vector3(halka * Math.cos(aci), halka * Math.sin(aci), 0);
    return { m, q, yer, z, R };
  };
  const geometri = onbellekli(anahtar, (v) => {
    const zarlar = ONCE.map((z, i) => tek(z, i, v.b, v.k));
    const pos = [], nor = [], uv = [], ust = [], num = [], nuv = [];
    for (const { m, q, yer, z, R } of zarlar) {
      const P = m.positions, I = m.indices, np = m.numProp;
      // tabana oturt: dönmüş köşelerin en alttaki z'si 0
      let zmin = Infinity;
      for (let i = 0; i < P.length; i += np) zmin = Math.min(zmin, v3([P[i], P[i + 1], P[i + 2]]).applyQuaternion(q).z);
      for (let t = 0; t < I.length; t += 3) {
        const L = [0, 1, 2].map((j) => v3([P[I[t + j] * np], P[I[t + j] * np + 1], P[I[t + j] * np + 2]]));
        const n = L[1].clone().sub(L[0]).cross(L[2].clone().sub(L[0])).normalize();
        const yi = z.Y.findIndex((y) => y.n.dot(n) > 0.999);
        const y = yi >= 0 ? z.Y[yi] : null, numara = y ? z.n0 + yi : -1;
        // yüz düzleminde numara ekseni
        let ex = null, ey = null, S = 1, c = null;
        if (y) {
          const ref = Math.abs(y.n.z) < 0.95 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
          ex = ref.clone().cross(y.n).normalize(); ey = y.n.clone().cross(ex);
          S = y.R * R * z.num; c = y.c.clone().multiplyScalar(R);
        }
        const nd = n.clone().applyQuaternion(q);
        for (const p of L) {
          const w = p.clone().applyQuaternion(q).add(yer); w.z -= zmin;
          pos.push(w.x, w.y, w.z); nor.push(nd.x, nd.y, nd.z);
          // malzeme dokusu: zarın kendi çerçevesinde kutu izdüşümü (dönerken doku zara yapışık)
          const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
          if (az >= ax && az >= ay) uv.push(p.x, p.y); else if (ax >= ay) uv.push(p.y, p.z); else uv.push(p.x, p.z);
          ust.push(nd.z > 0.7 ? 1 : 0);
          if (y) { const d = p.clone().sub(c); num.push(numara + 1); nuv.push(d.dot(ex) / S + 0.5, d.dot(ey) / S + 0.5); }
          else { num.push(0); nuv.push(0, 0); }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv.map((x) => x / 24), 2));
    g.setAttribute('aUst', new THREE.Float32BufferAttribute(ust, 1));
    g.setAttribute('aNum', new THREE.Float32BufferAttribute(num, 1));
    g.setAttribute('aNumUv', new THREE.Float32BufferAttribute(nuv, 2));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  });
  return {
    yukseklik: 24, anahtar, geometri, numarali: true,
    async hazirla(liste) {
      await initCSG();
      ONCE = ZARLAR.map((z) => { const k = birim(z.k); return { ...z, k, Y: yuzler(k) }; });
      for (const v of liste) geometri(v);
    },
    bilgi(v) { return `6 zar · d4-d20 · ${v.b} mm`; },
  };
}

// =====================================================================================================================
// QR STANDI (tools/qr masa standı). Kod ve başlık aracın kendi parçalarından (qrcode-generator, kendi yazı tipi);
// karo ve kaide burada aynı ölçülerle kurulur, tek farkla: karonun eni (EN) koddan bağımsız (araçta karo kare).
// BOY: kod boyu S (karo boyu = 11 alt pay + S + %28 başlık). MALZEME kaideye; karo krem, kod mürekkep.
// =====================================================================================================================
const QR = { mode: 'stand', icerik: 'url', url: 'https://oktosworkshop.com', ecc: 'M', baslik: 'Sipariş', tileT: 2.4, modH: 1.2, r: 4 };
const DIK = 75, YUVA_Z = 3, YUVA_PAY = 11; // tools/qr/geometry.js ile aynı (orada dışa açık değil)
const dik = (m) => C.move(C.rot(m, DIK, 0, 0), 0, 0, YUVA_Z);

function qr() {
  const anahtar = (v) => `${v.S}|${v.en}`;
  const geometri = onbellekli(anahtar, (v) => {
    const s = { ...QR, size: v.S }, S = v.S, t = s.tileT, E = v.en, H = YUVA_PAY + S + S * 0.28;
    const arac = Object.fromEntries(qrParcalar(s).map((p) => [p.ad, p]));
    const kaide = scope(() => {
      const govde = C.extrude(C.rrect(E + 14, 32, 6), 12);
      const yuva = dik(C.box(E + 0.6, 20.3, t + 0.5, -(E + 0.6) / 2, -0.3, -0.25));
      return C.sub(C.move(govde, 0, 2, 0), yuva);
    });
    const karo = scope(() => dik(C.move(C.extrude(C.rrect(E, H, s.r), t), 0, H / 2, 0)));
    return [
      { g: duzGeometri(kaide) },
      { g: duzGeometri(karo), sabit: '#f1ede6' },
      { g: duzGeometri(scope(arac.kod.fn)), sabit: '#25282d' },
      { g: duzGeometri(scope(arac.baslik.fn)), sabit: '#25282d' },
    ];
  });
  return {
    yukseklik: 100, anahtar, geometri,
    async hazirla(liste) { await initCSG(); await qrHazirla(); for (const v of liste) geometri(v); },
    bilgi(v) { return `${v.en}×${Math.round(YUVA_PAY + v.S * 1.28)} mm karo · kod ${v.S} mm`; },
  };
}

export const BAGDASTIRICILAR = { organizer, saksi, zar, qr };
