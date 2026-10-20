// Oda sahnesinin ölçüleri ve güneşi: tarayıcı (core/oda-sahne.js) ve Blender (scripts/oda-blender.py) aynı dosyayı
// okur, oda iki yerde ayrı tanımlanıp kaymaz. Aşağıdaki nesne geçerli JSON kalmalı (çift tırnaklı anahtar, içinde yorum
// yok, sonda virgül yok): Blender betiği "export const OLCU = " ile ardından gelen ilk satır başı "};" arasını okur.
// Birim mm, Z yukarı; arka duvarın iç yüzü y = ROOM.y1, balkon onun arkasında.
// SUN: güneşin geldiği yön. azimuth: +y'den (balkon tarafı) +x'e doğru derece; elevation: ufuktan derece. Sabah güneşi
// balkondan odaya, kameraya doğru girer: huzmeler kameradan görünür, saksılar arkadan ışık alır.
// CHAIR.sirtDik: oyuncu koltuğunun sırtı açılınca menteşede geriye yatıklığı (rad; katlı hâli −90°). Karakter
// (core/oda-karakter.js) ve sırt açma klibi (scripts/karakter-klipler.py) aynı değeri okur.
export const OLCU = {
  "ROOM": { "x0": -2100, "x1": 2100, "y0": -1800, "y1": 1800, "h": 2700, "wall": 120 },
  "GLASS": { "x0": -150, "x1": 1750, "door0": 350, "door1": 1250, "sill": 850, "head": 2300 },
  "BALCONY": { "x0": -150, "x1": 1950, "y1": 3420 },
  "DESK": { "x0": -1570, "x1": -250, "y0": 1100, "y1": 1780, "top": 740, "t": 28 },
  "SILL": { "over": 60, "depth": 220, "t": 40, "inset": 100 },
  "SHELF": { "x": -760, "y": 1680, "w": 1000, "d": 240, "t": 28, "z": [1300, 1690], "brackets": [-1220, -300] },
  "PEDESTAL": { "x": -1790, "y": 1440, "w": 440, "d": 680, "h": 740 },
  "FRIDGE": { "x": 1825, "y": 850, "w": 500, "d": 550, "h": 850, "shelf": 440, "floor": 68 },
  "MONITOR": { "x": -930, "y": 1610, "w": 545, "h": 320, "lift": 120 },
  "PC": { "x": -1380, "y": 1480, "w": 200, "d": 440, "h": 440 },
  "MAT": { "x": -855, "y": 1340, "w": 590, "d": 220, "t": 3 },
  "MOUSE": { "x": -650, "y": 1345 },
  "RACEWAY": { "x": -760, "z0": 110, "z1": 980 },
  "SOCKET": { "x": -560, "z": 300 },
  "RUG": { "x": -200, "y": -150, "w": 1700, "d": 2300 },
  "CHAIR": { "x": -930, "y": 1040, "rz": 0, "sirtDik": 0.14 },
  "ROBOT": { "x": 1830, "y": 1460, "rz": 2.4, "r": 170 },
  "SKIRTING": { "h": 80, "t": 14 },
  "SUN": { "azimuth": 25, "elevation": 42, "color": [1.0, 0.93, 0.84], "strength": 4.5 }
};

// Güneşe doğru birim vektör (ışık bunun tersi yönde ilerler)
export function toSun({ azimuth, elevation } = OLCU.SUN) {
  const a = (azimuth * Math.PI) / 180, e = (elevation * Math.PI) / 180;
  return [Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)];
}
