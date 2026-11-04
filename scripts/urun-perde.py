# Amaç: telifli karakter ya da marka taşıyan ürün görsellerinin "perdeli" sürümünü üretmek: görsel güçlü bulanıklaşır,
#        ortasından OKTOS şeridi geçer. Ürünün biçimi ve rengi okunur, karakter ve kart adı okunmaz (2026-11-01 kararı,
#        geri alınabilir: scripts/urun-veri.py --perdesiz olduğu gibi görsellere döner).
# Girdi:  python scripts/urun-perde.py --anahtarliklar [--dry-run]
#             assets/oda/anahtarlik-<id>.webp → assets/urunler/perdeli/<markasız kimlik>.webp (sitedeki kart anahtarlıklar)
#         python scripts/urun-perde.py --tek KAYNAK CIKTI [--bolge x0,y0,x1,y1] [--dry-run]
#             tek görsel; --bolge verilirse yalnız o bölge (oran 0–1) bulanıklaşır, şerit bölgenin ortasından geçer
# Çıktı:  WebP (--tek'te uzantıya göre PNG/WebP). Kaynağa dokunulmaz. Tekrar çalıştırmak güvenli: aynı girdi aynı çıktıyı
#         verir; değişmeyen dosya yeniden yazılmaz. --dry-run yalnız ne yapılacağını basar.
import argparse, hashlib, io, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# kaynak görselin kimliği → perdeli görselin markasız kimliği (scripts/urun-veri.py PERDE ile aynı)
ANAHTARLIK = {"black-lotus": "lotus", "blastoise": "su-kaplumbagasi", "charizard": "ates-ejderi", "dark-magician": "kara-buyucu", "venusaur": "cicek-sirtli"}
YAZI = "OKTOS"
FONT = os.path.join((os.environ.get("WINDIR") or os.path.join(os.environ.get("SystemDrive", "C:") + os.sep, "Windows")), "Fonts", "segoeuib.ttf")


def perdele(im, bolge=(0, 0, 1, 1)):
    im = im.convert("RGB")
    w, h = im.size
    x0, y0, x1, y1 = (round(bolge[0] * w), round(bolge[1] * h), round(bolge[2] * w), round(bolge[3] * h))
    parca = im.crop((x0, y0, x1, y1))
    r = max(6, round(0.06 * max(parca.size)))
    bulanik = parca.filter(ImageFilter.GaussianBlur(r)).filter(ImageFilter.GaussianBlur(r // 2))
    if bolge != (0, 0, 1, 1):  # bölge kenarı yumuşak geçsin
        maske = Image.new("L", parca.size, 0)
        ImageDraw.Draw(maske).rounded_rectangle((2 * r, 2 * r, parca.width - 2 * r, parca.height - 2 * r), radius=r * 2, fill=255)  # kenarda 0: iz kalmaz
        maske = maske.filter(ImageFilter.GaussianBlur(r))
        parca.paste(bulanik, (0, 0), maske)
        bulanik = parca
    im.paste(bulanik, (x0, y0))
    # Şerit: bölgenin dikey ortasında, tam genişlik; koyu yarı saydam zemin, açık yazı, ince vurgu çizgisi
    sh = max(18, round(0.13 * (y1 - y0)))
    sy = (y0 + y1) // 2 - sh // 2
    katman = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(katman)
    d.rectangle((x0, sy, x1, sy + sh), fill=(20, 20, 22, 205))
    d.rectangle((x0, sy + sh - max(2, sh // 14), x1, sy + sh), fill=(191, 85, 25, 255))  # --accent #bf5519
    font = ImageFont.truetype(FONT, round(sh * 0.46))
    aralik = round(sh * 0.12)
    gen = sum(font.getbbox(c)[2] for c in YAZI) + aralik * (len(YAZI) - 1)
    x = (x0 + x1) // 2 - gen // 2
    ust = sy + (sh - font.getbbox("O")[3]) // 2 - round(sh * 0.04)
    for c in YAZI:
        d.text((x, ust), c, font=font, fill=(241, 239, 234, 255))
        x += font.getbbox(c)[2] + aralik
    return Image.alpha_composite(im.convert("RGBA"), katman).convert("RGB")


def yaz(im, cikti, kuru):
    tampon = io.BytesIO()
    bicim = "PNG" if cikti.lower().endswith(".png") else "WEBP"
    im.save(tampon, bicim, **({"quality": 86, "method": 6} if bicim == "WEBP" else {"optimize": True}))
    veri = tampon.getvalue()
    if os.path.exists(cikti) and hashlib.sha256(open(cikti, "rb").read()).digest() == hashlib.sha256(veri).digest():
        return "değişmedi"
    if kuru: return "yazılacak"
    os.makedirs(os.path.dirname(cikti), exist_ok=True)
    open(cikti, "wb").write(veri)
    return "yazıldı"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anahtarliklar", action="store_true")
    ap.add_argument("--tek", nargs=2, metavar=("KAYNAK", "CIKTI"))
    ap.add_argument("--bolge", default="0,0,1,1")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    isler = []
    if a.anahtarliklar:
        isler += [(os.path.join(KOK, "assets", "oda", f"anahtarlik-{i}.webp"), os.path.join(KOK, "assets", "urunler", "perdeli", f"{y}.webp"), (0, 0, 1, 1)) for i, y in ANAHTARLIK.items()]
    if a.tek:
        isler.append((a.tek[0], a.tek[1], tuple(float(v) for v in a.bolge.split(","))))
    if not isler: ap.error("--anahtarliklar ya da --tek ver")
    for kaynak, cikti, bolge in isler:
        durum = yaz(perdele(Image.open(kaynak), bolge), cikti, a.dry_run)
        print(f"{durum}: {os.path.relpath(cikti, KOK) if cikti.startswith(KOK) else os.path.basename(cikti)}")


if __name__ == "__main__":
    main()
