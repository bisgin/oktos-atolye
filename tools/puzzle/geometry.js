// Puzzle katıları (mm, Z yukarı). İki mod:
//   duz:   fotoğraflı düz yapboz: W × H levha, sütun × satır mantar tırnaklı parça, isteğe bağlı çerçeveli tabla
//   sekil: 3B şekil yapboz: küre, küp, yumurta ya da kalp dik prizmalarla parçalara bölünür (tırnaklar kilitlenir)
// Parça kesimi tools/puzzle/scene.js jigsaw'dan (oda ve hikâye sahnesi de onu kullanır); parçalar arası boşluk
// her kenardan yarısı kadar içeri çekilerek verilir.
import * as C from '../../core/csg.js';
import { jigsaw } from './scene.js';

const TOHUM = { sphere: 11, cube: 5, egg: 17, heart: 13, duz: 7 };

// Kalp silüeti (XY, ortası orijinde), genişliği yaklaşık w
function kalp(w) {
  const k = w / 34, pts = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    pts.push([16 * Math.sin(t) ** 3 * k, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * k]);
  }
  return pts;
}

// Düz yapbozun hücreleri: birim ızgara cw × ch'ye gerilir (dikdörtgen hücrede tırnak da biraz uzar)
function hucreler(nx, ny, cw, ch, tohum) {
  return jigsaw(nx, ny, 1, tohum).map((c) => ({ ...c, poly: c.poly.map(([x, y]) => [x * cw, y * ch]) }));
}

// Parça listesi: [{ ad, renk: 'parca'|'cerceve', k (parça sırası), fn() → Manifold }]; bilgi: { n, W, H, D }
export function parcalar(s) {
  const out = [], bosluk = s.bosluk / 2;
  if (s.mode === 'duz') {
    const W = s.genislik, H = s.yukseklik, t = s.kalinlik, taban = s.cerceve ? 1.6 : 0, kenar = 8;
    const cs = hucreler(s.sutun, s.satir, W / s.sutun, H / s.satir, TOHUM.duz);
    cs.forEach((c, k) => out.push({ ad: `parca_${k + 1}`, renk: 'parca', k, fn: () => C.extrude(C.offset2(C.polys2([c.poly]), -bosluk), t, taban) }));
    if (s.cerceve) out.push({
      ad: 'cerceve', renk: 'cerceve', k: -1,
      fn: () => C.sub(C.extrude(C.rrect(W + 2 * kenar, H + 2 * kenar, 6), taban + t - 1), C.extrude(C.rrect(W + 0.8, H + 0.8, 1), 40, taban)),
    });
    return { liste: out, bilgi: { n: cs.length, W, H } };
  }
  // 3B şekil: ızgara şekli taşacak kadar büyük (kenar parçalar şeklin dışını da keser), boş kalan hücre atlanır
  const S = s.boy, n = Math.max(s.sutun, s.satir), hucre = (S + 2) / Math.min(s.sutun, s.satir);
  const cs = jigsaw(s.sutun, s.satir, hucre, TOHUM[s.sekil] ?? 7);
  const sekil = () => {
    if (s.sekil === 'cube') return C.box(S, S, S, -S / 2, -S / 2, 0);
    if (s.sekil === 'egg') return C.move(C.scale(C.sphere(S / 2, 72), [1, 1, 1.32]), 0, 0, (S / 2) * 1.32);
    if (s.sekil === 'heart') return C.extrude(C.polys2([kalp(S)]), Math.max(10, S * 0.22)); // çift-tek kural: çizim yönü fark etmez
    return C.move(C.sphere(S / 2, 72), 0, 0, S / 2);
  };
  cs.forEach((c, k) => out.push({ ad: `parca_${k + 1}`, renk: 'parca', k, fn: () => C.inter(sekil(), C.extrude(C.offset2(C.polys2([c.poly]), -bosluk), S * 2, -S / 2)) }));
  return { liste: out, bilgi: { n: cs.length, W: S, H: S, izgara: n } };
}
