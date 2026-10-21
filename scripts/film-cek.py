# Amaç: tanıtım filmi sahnelerini (lab/tanitim/*.html) kare kare çekip 60 fps videoya çevirmek.
# Sayfa ?cek=1 ile açılır; sayfa window.tanitim.kare(t) (t anını eksiksiz kurar) ve tanitim.sure() vermeli,
# hazır olunca window.tanitimHazir = true yapar. Her kare görüntüsü alınır, ffmpeg H.264 MP4 (+faststart) yazar.
# Girdi:  python scripts/film-cek.py lab/tanitim/zar.html CIKTI_ADI [--fps 60] [--en 1920 --boy 1080] [--webm] [--gorunur]
#         (yerel sunucu açık olmalı: python scripts/serve.py 8080)
# Çıktı:  .impeccable/film/<CIKTI_ADI>.mp4 (+ .webm), kareler .impeccable/film/<CIKTI_ADI>-kare/ (yerel, depoya girmez)
# Gerekenler: playwright (pip), kurulu Microsoft Edge (ayrı tarayıcı indirilmez), ffmpeg (winget Gyan.FFmpeg).
# Tekrar çalıştırmak güvenli: kare klasörünü ve videoyu baştan yazar. --dry-run yalnız ne yapacağını yazar.
import argparse, glob, os, shutil, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ffmpeg_yolu():
    yol = shutil.which("ffmpeg")
    if yol:
        return yol
    aday = glob.glob(os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg*", "*", "bin", "ffmpeg.exe"))
    if aday:
        return aday[0]
    sys.exit("ffmpeg bulunamadı (winget install Gyan.FFmpeg)")


def main():
    a = argparse.ArgumentParser()
    a.add_argument("sayfa")
    a.add_argument("ad")
    a.add_argument("--fps", type=int, default=60)
    a.add_argument("--en", type=int, default=1920)
    a.add_argument("--boy", type=int, default=1080)
    a.add_argument("--port", type=int, default=8080)
    a.add_argument("--webm", action="store_true")
    a.add_argument("--gorunur", action="store_true", help="Edge penceresi açık çeksin (ekransız WebGL sorun çıkarırsa)")
    a.add_argument("--dry-run", action="store_true")
    o = a.parse_args()

    cikis = os.path.join(KOK, ".impeccable", "film")
    kare_dir = os.path.join(cikis, o.ad + "-kare")
    url = f"http://127.0.0.1:{o.port}/{o.sayfa.replace(os.sep, '/')}?cek=1"
    if o.dry_run:
        print(f"çekilecek: {url} {o.en}x{o.boy} {o.fps} fps → {kare_dir} → {o.ad}.mp4")
        return
    shutil.rmtree(kare_dir, ignore_errors=True)
    os.makedirs(kare_dir, exist_ok=True)

    from playwright.sync_api import sync_playwright
    t0 = time.time()
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge", headless=not o.gorunur, args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization"])
        pg = b.new_page(viewport={"width": o.en, "height": o.boy}, device_scale_factor=1)
        hatalar = []
        pg.on("pageerror", lambda e: hatalar.append(str(e)))
        pg.goto(url)
        pg.wait_for_function("window.tanitimHazir === true", timeout=90000)
        sure = pg.evaluate("tanitim.sure()")
        n = int(round(sure * o.fps))
        print(f"süre {sure:.2f} sn, {n} kare")
        for i in range(n):
            pg.evaluate(f"tanitim.kare({i / o.fps})")
            pg.screenshot(path=os.path.join(kare_dir, f"k_{i:05d}.png"), type="png")
            if i % 60 == 0:
                print(f"  {i}/{n}  ({time.time() - t0:.0f} sn)")
        b.close()
    if hatalar:
        print("SAYFA HATALARI:", *hatalar[:5], sep="\n  ")

    ff = ffmpeg_yolu()
    giris = ["-framerate", str(o.fps), "-i", os.path.join(kare_dir, "k_%05d.png")]
    mp4 = os.path.join(cikis, o.ad + ".mp4")
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *giris, "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], check=True)
    print(f"yazıldı: {mp4} ({os.path.getsize(mp4) / 1024:.0f} KB)")
    if o.webm:
        webm = os.path.join(cikis, o.ad + ".webm")
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *giris, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0",
                        "-row-mt", "1", "-pix_fmt", "yuv420p", webm], check=True)
        print(f"yazıldı: {webm} ({os.path.getsize(webm) / 1024:.0f} KB)")
    print(f"toplam {time.time() - t0:.0f} sn")


if __name__ == "__main__":
    main()
