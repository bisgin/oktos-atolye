"""Masa ekranı döngüsü, 2. adım: Blender karelerini Blender-benzeri arayüz çerçevesine oturtur, MP4 + poster + pafta yazar.

Amaç: scripts/masa-ekran-video.py'nin saydam viewport karelerini koyu gri degrade arka planın üstüne koyar, kenarlara
  sade bir arayüz çizer (üst menü şeridi, sol araç çubuğu, sağ özellik şeridi, alt durum satırı; logo/marka çizimi yok),
  H.264 olarak kodlar. 360p önizleme içindir (final ayrı, onaydan sonra).
Girdi:
  python scripts/masa-ekran-kurgu.py [--kareler %TEMP%/masa-ekran-kareler] [--crf 26] [--drive KLASOR] [--drive-yok]
Çıktı (üzerine yazar; aynı girdiden aynı sonuç):
  assets/oda/masa-ekran.mp4  (640x376, 30 fps, 240 kare, yuv420p, +faststart, ses yok)
  assets/oda/masa-ekran.webp (ilk kare afişi)
  KLASOR/masa-ekran.mp4, masa-ekran.webp, masa-ekran-pafta.png (0, 2, 4, 6 sn) — varsayılan OKTOS_EKRAN_KLASOR ortam değişkeni
  Standart çıktıya JSON özet.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("--kareler", default=os.path.join(tempfile.gettempdir(), "masa-ekran-kareler"))
ap.add_argument("--crf", type=int, default=26)
ap.add_argument("--drive", default=os.environ.get("OKTOS_EKRAN_KLASOR"))
ap.add_argument("--drive-yok", action="store_true")
a = ap.parse_args()

W, H = 640, 376
UST, ALT, SOL, SAG = 20, 14, 30, 96          # çerçeve kalınlıkları (px)
VW, VH = W - SOL - SAG, H - UST - ALT          # viewport: 514 x 342

kareler = sorted(glob.glob(os.path.join(a.kareler, "v_*.png")))
if len(kareler) != 240:
    sys.exit(f"240 kare bekleniyordu, {len(kareler)} bulundu: {a.kareler}")

def yazi(boy):
    for ad in ("segoeui.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", ad), boy)
        except OSError:
            pass
    return ImageFont.load_default()

F = yazi(10)
FK = yazi(9)

# Viewport arka planı: dikey degrade #3a3a3a -> #2b2b2b
def degrade(w, h, ust=(0x3a,) * 3, alt=(0x2b,) * 3):
    im = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line([(0, y), (w, y)], fill=tuple(round(u + (v - u) * t) for u, v in zip(ust, alt)))
    return im

ARKA = degrade(VW, VH)
# Izgaranın ufka doğru solması: ufuk bölgesinde viewport'u arka plana karıştıran maske (Blender ızgarası da uzakta söner)
SOLMA = Image.new("L", (VW, VH), 0)
ds = ImageDraw.Draw(SOLMA)
for y in range(VH):
    t = y / VH
    ds.line([(0, y), (VW, y)], fill=round(255 * max(0.0, min(1.0, (t - 0.20) / 0.40))))

# Çerçeve (sabit katman)
CERCEVE = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(CERCEVE)
PANEL, KENAR, METIN, SOLUK = (0x30, 0x30, 0x30, 255), (0x1d, 0x1d, 0x1d, 255), (0xd6, 0xd6, 0xd6, 255), (0x9a, 0x9a, 0x9a, 255)
d.rectangle([0, 0, W, UST - 1], fill=(0x23, 0x23, 0x23, 255))
x = 8
for k in ("File", "Edit", "Render", "Window", "Help"):
    d.text((x, 4), k, font=F, fill=METIN); x += d.textlength(k, font=F) + 10
x += 8
for i, k in enumerate(("Layout", "Modeling", "Sculpting", "UV Editing", "Shading", "Animation")):
    tw = d.textlength(k, font=F)
    if i == 1:
        d.rounded_rectangle([x - 5, 3, x + tw + 5, UST - 4], radius=3, fill=(0x47, 0x47, 0x47, 255))
    d.text((x, 4), k, font=F, fill=METIN if i == 1 else SOLUK); x += tw + 13
# sol araç çubuğu
d.rectangle([0, UST, SOL - 1, H - ALT - 1], fill=PANEL)
d.line([(SOL - 1, UST), (SOL - 1, H - ALT)], fill=KENAR)
y = UST + 8
for i in range(8):
    if i in (2, 6):
        y += 6
    renk = (0x4a, 0x6f, 0xa5, 255) if i == 0 else (0x48, 0x48, 0x48, 255)
    d.rounded_rectangle([6, y, SOL - 7, y + 17], radius=3, fill=renk)
    d.rectangle([11, y + 5, SOL - 12, y + 12], outline=(0xc8, 0xc8, 0xc8, 255))
    y += 22
# sağ özellik şeridi
d.rectangle([W - SAG, UST, W, H - ALT - 1], fill=PANEL)
d.line([(W - SAG, UST), (W - SAG, H - ALT)], fill=KENAR)
d.text((W - SAG + 8, UST + 5), "Scene Collection", font=FK, fill=METIN)
for i, k in enumerate(("Camera", "Light", "KadereKinali")):
    yy = UST + 20 + i * 14
    if i == 2:
        d.rectangle([W - SAG + 2, yy - 1, W - 3, yy + 11], fill=(0x33, 0x4d, 0x80, 255))
    d.rectangle([W - SAG + 12, yy + 2, W - SAG + 18, yy + 8], fill=(0xe0, 0x9a, 0x40, 255) if i == 2 else SOLUK)
    d.text((W - SAG + 23, yy), k, font=FK, fill=METIN)
d.line([(W - SAG + 4, UST + 68), (W - 4, UST + 68)], fill=KENAR)
satirlar = (("Location", "0 m"), ("Rotation", None), ("Scale", "1.000"))
for i, (k, v) in enumerate(satirlar):
    yy = UST + 76 + i * 19
    d.text((W - SAG + 6, yy + 2), k, font=FK, fill=SOLUK)
    d.rounded_rectangle([W - 44, yy, W - 5, yy + 13], radius=3, fill=(0x54, 0x54, 0x54, 255))
    if v:
        d.text((W - 41, yy + 1), v, font=FK, fill=METIN)
# alt durum satırı
d.rectangle([0, H - ALT, W, H], fill=(0x23, 0x23, 0x23, 255))
d.text((8, H - ALT + 1), "Select    Rotate View    Object", font=FK, fill=SOLUK)
d.text((W - 70, H - ALT + 1), "Objects 1/3", font=FK, fill=SOLUK)
# viewport içi başlık
VPYAZI = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
dv = ImageDraw.Draw(VPYAZI)
dv.text((8, 6), "User Perspective", font=FK, fill=(0xe6, 0xe6, 0xe6, 230))
dv.text((8, 18), "(1) KadereKinali", font=FK, fill=(0xc8, 0xc8, 0xc8, 200))
# küçük eksen göstergesi (sağ üst)
cx, cy = VW - 22, 24
dv.line([(cx, cy), (cx + 13, cy + 4)], fill=(0xd8, 0x4a, 0x5a, 255), width=2); dv.ellipse([cx + 10, cy + 1, cx + 17, cy + 8], fill=(0xd8, 0x4a, 0x5a, 255))
dv.line([(cx, cy), (cx - 7, cy + 8)], fill=(0x8b, 0xc3, 0x3a, 255), width=2); dv.ellipse([cx - 11, cy + 5, cx - 4, cy + 12], fill=(0x8b, 0xc3, 0x3a, 255))
dv.line([(cx, cy), (cx, cy - 13)], fill=(0x4a, 0x8c, 0xe0, 255), width=2); dv.ellipse([cx - 4, cy - 17, cx + 3, cy - 10], fill=(0x4a, 0x8c, 0xe0, 255))

IZ = Image.open(os.path.join(a.kareler, "izgara.png")).convert("RGBA").resize((VW, VH), Image.LANCZOS)
IZ.putalpha(Image.composite(IZ.getchannel("A"), Image.new("L", IZ.size, 0), SOLMA).point(lambda p: round(p * 0.75)))
ZEMIN = ARKA.convert("RGBA")
ZEMIN.alpha_composite(IZ)

def kare(yol, i):
    v = Image.open(yol).convert("RGBA").resize((VW, VH), Image.LANCZOS)
    vp = ZEMIN.copy()
    vp.alpha_composite(v)
    vp.alpha_composite(VPYAZI)
    tam = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    tam.paste(vp, (SOL, UST))
    tam.alpha_composite(CERCEVE)
    ImageDraw.Draw(tam).text((W - 41, UST + 76 + 19 + 1), f"{i * 360 / len(kareler):.0f}°", font=FK, fill=METIN)  # tablanın açısı
    return tam.convert("RGB")

is_dir = tempfile.mkdtemp(prefix="masa-ekran-kurgu-")
for i, k in enumerate(kareler):
    kare(k, i).save(os.path.join(is_dir, f"k_{i:04d}.png"))

oda = os.path.join(KOK, "assets", "oda")
mp4 = os.path.join(oda, "masa-ekran.mp4")
webp = os.path.join(oda, "masa-ekran.webp")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", os.path.join(is_dir, "k_%04d.png"),
                "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
                "-g", "60", "-movflags", "+faststart", "-an", mp4], check=True)
Image.open(os.path.join(is_dir, "k_0000.png")).save(webp, "WEBP", quality=82, method=6)

# Pafta: 0, 2, 4, 6 sn (kare 0, 60, 120, 180), 2x2
pafta_yol = os.path.join(is_dir, "masa-ekran-pafta.png")
pafta = Image.new("RGB", (W * 2 + 6, H * 2 + 6), (0x11, 0x11, 0x11))
for j, f in enumerate((0, 60, 120, 180)):
    pafta.paste(Image.open(os.path.join(is_dir, f"k_{f:04d}.png")), ((j % 2) * (W + 6), (j // 2) * (H + 6)))
pafta.save(pafta_yol)

ozet = {"mp4": mp4, "mp4_kb": round(os.path.getsize(mp4) / 1024, 1), "webp": webp,
        "webp_kb": round(os.path.getsize(webp) / 1024, 1), "crf": a.crf, "is_klasoru": is_dir, "pafta": pafta_yol}
if not a.drive_yok and a.drive:
    os.makedirs(a.drive, exist_ok=True)
    for kaynak in (mp4, webp, pafta_yol):
        shutil.copy2(kaynak, os.path.join(a.drive, os.path.basename(kaynak)))
    ozet["drive"] = a.drive
print(json.dumps(ozet, ensure_ascii=False, indent=1))
