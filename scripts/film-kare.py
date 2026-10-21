# Amaç: tanıtım filmi sayfasının (lab/tanitim/*.html, window.tanitim API'si) seçilen karelerini PNG olarak çekmek ve
#       inceleme için tek bir pafta (küçük resim ızgarası, kare numaralı) yazmak. Tam video çekmeden vinyet denetimi.
# Girdi:  python scripts/film-kare.py "lab/tanitim/film.html?yon=dikey&yalniz=v2-zar" AD --kareler 240,300,384
#         [--aralik 240:479:24] (başlangıç:bitiş:adım, bitiş dahil) [--port 8080] [--sayac] [--sutun 4] [--kucuk 480]
#         Yön sorgudan okunur (yon=dikey → 1080×1920, yoksa 1920×1080). Kareler artan sırada çekilir (tl.call'lar ileri
#         sarılırken sırayla çalışır). Yerel sunucu açık olmalı: python scripts/serve.py 8080
# Çıktı:  .impeccable/kare/<AD>/k_NNNN.png ve .impeccable/kare/<AD>/pafta.png (yerel, depoya girmez);
#         sayfa hataları ve tanitim.hatalar ekrana ve <AD>/hatalar.json'a yazılır.
# Tekrar çalıştırmak güvenli: <AD> klasörünü baştan yazar. --dry-run yalnız ne yapacağını yazar.
import argparse, json, os, shutil, sys, time

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def kare_listesi(o):
    s = set()
    if o.kareler:
        s.update(int(x) for x in o.kareler.split(",") if x.strip())
    for a in o.aralik or []:
        b, e, d = (int(x) for x in a.split(":"))
        s.update(range(b, e + 1, d))
    return sorted(s)


def pafta(yollar, kareler, cikti, sutun, kucuk):
    from PIL import Image, ImageDraw, ImageFont
    ilk = Image.open(yollar[0])
    w = kucuk
    h = round(ilk.height * w / ilk.width)
    satir = (len(yollar) + sutun - 1) // sutun
    P = Image.new("RGB", (sutun * (w + 8) + 8, satir * (h + 30) + 8), (40, 40, 44))
    d = ImageDraw.Draw(P)
    try:
        f = ImageFont.truetype("consola.ttf", 18)
    except OSError:
        f = ImageFont.load_default()
    for i, (y, n) in enumerate(zip(yollar, kareler)):
        im = Image.open(y).convert("RGB").resize((w, h), Image.LANCZOS)
        x0, y0 = 8 + (i % sutun) * (w + 8), 8 + (i // sutun) * (h + 30)
        P.paste(im, (x0, y0 + 22))
        d.text((x0, y0), f"k{n}  {n / 60:.2f} sn", fill=(235, 230, 220), font=f)
    P.save(cikti)


def main():
    a = argparse.ArgumentParser()
    a.add_argument("sayfa")
    a.add_argument("ad")
    a.add_argument("--kareler")
    a.add_argument("--aralik", action="append")
    a.add_argument("--port", type=int, default=8080)
    a.add_argument("--sayac", action="store_true", help="animatik sayacını karede göster")
    a.add_argument("--sutun", type=int, default=4)
    a.add_argument("--kucuk", type=int, default=480, help="paftadaki küçük resim genişliği (px)")
    a.add_argument("--dry-run", action="store_true")
    o = a.parse_args()

    kareler = kare_listesi(o)
    if not kareler:
        sys.exit("kare yok: --kareler ya da --aralik ver")
    dikey = "yon=dikey" in o.sayfa
    en, boy = (1080, 1920) if dikey else (1920, 1080)
    yol = o.sayfa.replace(os.sep, "/")
    url = f"http://127.0.0.1:{o.port}/{yol}{'&' if '?' in yol else '?'}cek=1" + ("&sayac=1" if o.sayac else "")
    hedef = os.path.join(KOK, ".impeccable", "kare", o.ad)
    if o.dry_run:
        print(f"çekilecek: {url} {en}x{boy}, {len(kareler)} kare ({kareler[0]}…{kareler[-1]}) → {hedef}")
        return
    shutil.rmtree(hedef, ignore_errors=True)
    os.makedirs(hedef, exist_ok=True)

    from playwright.sync_api import sync_playwright
    t0 = time.time()
    yollar, hatalar = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge", headless=True, args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization"])
        pg = b.new_page(viewport={"width": en, "height": boy}, device_scale_factor=1)
        pg.on("pageerror", lambda e: hatalar.append(str(e)))
        pg.on("console", lambda m: hatalar.append("konsol: " + m.text) if m.type == "error" else None)
        pg.goto(url)
        pg.wait_for_function("window.tanitimHazir === true", timeout=90000)
        hatalar += [f"modül: {h}" for h in pg.evaluate("tanitim.hatalar || []")]
        for n in kareler:
            pg.evaluate(f"tanitim.kare({n / 60})")
            y = os.path.join(hedef, f"k_{n:04d}.png")
            pg.screenshot(path=y, type="png")
            yollar.append(y)
        b.close()
    pafta(yollar, kareler, os.path.join(hedef, "pafta.png"), o.sutun, o.kucuk)
    with open(os.path.join(hedef, "hatalar.json"), "w", encoding="utf-8") as f:
        json.dump(hatalar, f, ensure_ascii=False, indent=1)
    if hatalar:
        print("HATALAR:", *hatalar[:10], sep="\n  ")
    print(f"{len(yollar)} kare → {hedef}\\pafta.png ({time.time() - t0:.0f} sn)")


if __name__ == "__main__":
    main()
