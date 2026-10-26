// Ürün bağdaştırıcıları: bölümün ürününü sitedeki aracın KENDİ geometri koduyla üretir (PS1 sahnesi için).
// Sözleşme (ps1.js çağırır):
//   anahtar(degerler) → dizge        (aynı geometriye giden değerler aynı anahtarı verir)
//   async hazirla(degerListesi)       (açılışta, tanitimHazir'dan önce: akışta uğranan bütün değerler üretilir)
//   geometri(degerler) → BufferGeometry  (önbellekten; hazırlanmamışsa eşzamanlı üretir)
//   bilgi(degerler) → dizge            (PS1 başlığının altındaki canlı ölçü satırı)
//   yukseklik                          (mm; "tam ölçü" yazısının çıktığı yer)
// Yeni ürün: aracın geometri işlevini içe aktar, değerleri aracın ayar nesnesine çevir, csg.scope() içinde üret.
import { initCSG, scope } from '../../../core/csg.js';
import { customBin } from '../../../tools/bin/geometry.js';
import { duzGeometri } from './ps1.js';

// Bölmeli organizer (tools/bin "Serbest kutu", köşeli). Bölmeler ölçüyle yeniden dağılır: ~100 mm'lik gözler
// (EN 300 → 3 sütun, 350'den sonra 4; BOY 200 → 2 satır, 250'den sonra 3). Duvarlar düşük çözünürlükte okunsun diye
// kalın (4 mm dış, 3 mm bölme); yine de basılabilir gerçek bir kutu.
const ORG = { shape: 'rect', h: 60, wall: 4, floor: 3, div: 3, r: 8, lip: false, shelf: false, scoop: false, holes: false };
const bolme = (v) => ({ cols: Math.max(1, Math.round(v.w / 100)), rows: Math.max(1, Math.round(v.d / 100)) });

function organizer() {
  const onbellek = new Map();
  const b = {
    yukseklik: ORG.h,
    anahtar: (v) => `${v.w}x${v.d}`,
    async hazirla(liste) {
      await initCSG();
      for (const v of liste) b.geometri(v);
    },
    geometri(v) {
      const a = b.anahtar(v);
      if (!onbellek.has(a)) {
        const r = scope(() => customBin({ ...ORG, w: v.w, d: v.d, ...bolme(v) }));
        onbellek.set(a, duzGeometri(r));
      }
      return onbellek.get(a);
    },
    bilgi(v) {
      const { cols, rows } = bolme(v);
      return `${v.w}×${v.d}×${ORG.h} mm · ${cols * rows} bölme`;
    },
  };
  return b;
}

export const BAGDASTIRICILAR = { organizer };
