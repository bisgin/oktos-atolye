"""Amaç: "Oluştur" sayfasındaki (araclar/) araç kartları için şablon küçük resimlerini üretir.
Yeni çizim yok: araç kabuğunun kendi küçük resim üretimi (core/tool-shell.js thumbsFor → viewer.snapshot,
220×220 saydam PNG) kullanılır. Her şablon için tools/<id>/index.html?sablon=<id> açılır, şablon ızgarasındaki
resim alınır, WebP'ye çevrilir.
Girdi: çalışan yerel sunucu (scripts/serve.py), --port (varsayılan 8082), aşağıdaki SECIM listesi
(her aracın ilk şablonu reklam bağlantısındaki "en güçlü" şablondur).
Çıktı: assets/araclar/<arac>-<sablon>.webp (≤ 25 KB) + assets/araclar/kucuk-resimler.json
({arac: [{id, ad: {tr, en}, resim}]}). --dry-run yalnız ne yazılacağını gösterir. Aynı girdi → aynı çıktı;
tekrar çalıştırmak güvenlidir (dosyaların üzerine yazar).
"""
import argparse
import asyncio
import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

KOK = Path(__file__).resolve().parent.parent
HEDEF = KOK / "assets" / "araclar"
SINIR = 25 * 1024
SECIM = {
    "bin": ["desk", "screws", "pencup3"],
    "vase": ["twist", "star", "amphora"],
    "clicker": ["cat", "heart", "kedi"],
    "text": ["door", "sign", "iyi"],
    "flip": ["family", "ask", "us"],
    "qr": ["wifi", "card_turuncu", "coaster"],
    "painter": ["mountain", "window", "card"],
    "puzzle": ["picture", "sphere", "heart"],
}


def webp(png_bytes):
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    bbox = im.getchannel("A").getbbox()  # boş kenarları kırp, kareye tamamla
    if bbox:
        im = im.crop(bbox)
        k = int(max(im.size) * 1.08)
        kare = Image.new("RGBA", (k, k), (0, 0, 0, 0))
        kare.paste(im, ((k - im.width) // 2, (k - im.height) // 2))
        im = kare.resize((160, 160), Image.LANCZOS)
    for q in (82, 72, 62, 50):
        b = io.BytesIO()
        im.save(b, "WEBP", quality=q, method=6)
        if b.tell() <= SINIR:
            return b.getvalue()
    raise RuntimeError("25 KB sınırına inmedi")


async def tek(ctx, taban, arac, sablon):
    pg = await ctx.new_page()
    try:
        await pg.goto(f"{taban}/tools/{arac}/index.html?sablon={sablon}", wait_until="load")
        sec = f'#presets .preset[data-id="{sablon}"] .thumb img'
        await pg.wait_for_selector(sec, state="attached", timeout=90000)
        src = await pg.get_attribute(sec, "src")
        ad = await pg.evaluate(f"""async () => {{ const m = await import('./app.js'); const i = await import('../../core/i18n.js');
            const p = m.TOOL.presets.find(x => x.id === '{sablon}'); const tr = i.t(p.label);
            i.setLang('en'); const en = i.t(p.label); i.setLang('tr'); return {{ tr, en }}; }}""")
        return base64.b64decode(src.split(",", 1)[1]), ad
    finally:
        await pg.close()


async def ana(arg):
    taban = f"http://127.0.0.1:{arg.port}"
    liste = {}
    async with async_playwright() as p:
        tarayici = await p.chromium.launch(channel="msedge", headless=True)
        ctx = await tarayici.new_context()
        for arac, sablonlar in SECIM.items():
            liste[arac] = []
            for s in sablonlar:
                for deneme in range(3):  # serve.py yük altında bağlantıyı arada reddediyor
                    try:
                        png, ad = await tek(ctx, taban, arac, s)
                        break
                    except Exception:
                        if deneme == 2:
                            raise
                veri = webp(png)
                ad_dosya = f"{arac}-{s}.webp"
                liste[arac].append({"id": s, "ad": ad, "resim": ad_dosya})
                print(f"{'yazılacak' if arg.dry_run else 'yazıldı  '}  assets/araclar/{ad_dosya}  {len(veri) / 1024:.1f} KB  {ad['tr']}")
                if not arg.dry_run:
                    HEDEF.mkdir(parents=True, exist_ok=True)
                    (HEDEF / ad_dosya).write_bytes(veri)
        await tarayici.close()
    if not arg.dry_run:
        (HEDEF / "kucuk-resimler.json").write_text(json.dumps(liste, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{sum(len(v) for v in liste.values())} küçük resim, {len(liste)} araç")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=8082)
    ap.add_argument("--dry-run", action="store_true")
    sys.exit(asyncio.run(ana(ap.parse_args())))
