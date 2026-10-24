# Amaç: tanıtım filmi sahnelerini (lab/tanitim/*.html) kare kare çekip 60 fps videoya çevirmek.
# Sayfa ?cek=1 ile açılır; sayfa window.tanitim.kare(t) (t anını eksiksiz kurar) ve tanitim.sure() vermeli,
# hazır olunca window.tanitimHazir = true yapar. Her kare görüntüsü alınır, ffmpeg H.264 MP4 (+faststart) yazar.
# Girdi:  python scripts/film-cek.py lab/tanitim/zar.html CIKTI_ADI [--fps 60] [--en 1920 --boy 1080] [--webm] [--gorunur]
#         [--tavan 1.2M] (bit hızı tavanı, web teslimi) [--olcek 720x1280] (çıktıyı küçült) [--poster] (ilk kare WebP)
#         Sayfa yolu sorgu içerebilir: "lab/tanitim/zar.html?yon=dikey"
#         (yerel sunucu açık olmalı: python scripts/serve.py 8080)
# Çıktı:  .impeccable/film/<CIKTI_ADI>.mp4 (+ .webm), kareler .impeccable/film/<CIKTI_ADI>-kare/ (yerel, depoya girmez)
# Gerekenler: playwright (pip), kurulu Microsoft Edge (ayrı tarayıcı indirilmez), ffmpeg (winget Gyan.FFmpeg).
# Tekrar çalıştırmak güvenli: kare klasörünü ve videoyu baştan yazar. --dry-run yalnız ne yapacağını yazar.
# --devam: klasörü silmez, yalnız eksik kareleri çeker. Tarayıcı çekim sırasında düşerse betik kendisi de 3 kez yeniden açar.
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
    a.add_argument("--tavan", help="bit hızı tavanı (ör. 1.2M); verilmezse CRF 18")
    a.add_argument("--olcek", help="çıktı boyutu, ör. 720x1280")
    a.add_argument("--poster", action="store_true", help="ilk kareyi WebP poster olarak yaz")
    a.add_argument("--devam", action="store_true", help="kare klasörünü silme, yalnız eksik kareleri çek (yarıda kalan çekim)")
    a.add_argument("--dry-run", action="store_true")
    o = a.parse_args()

    cikis = os.path.join(KOK, ".impeccable", "film")
    kare_dir = os.path.join(cikis, o.ad + "-kare")
    yol = o.sayfa.replace(os.sep, '/')
    url = f"http://127.0.0.1:{o.port}/{yol}{'&' if '?' in yol else '?'}cek=1"
    if o.dry_run:
        print(f"çekilecek: {url} {o.en}x{o.boy} {o.fps} fps → {kare_dir} → {o.ad}.mp4")
        return
    if not o.devam:
        shutil.rmtree(kare_dir, ignore_errors=True)
    os.makedirs(kare_dir, exist_ok=True)

    from playwright.sync_api import sync_playwright, Error as PwHata
    t0 = time.time()
    hatalar = []
    kare_yolu = lambda i: os.path.join(kare_dir, f"k_{i:05d}.png")
    with sync_playwright() as p:
        # Tarayıcı dışarıdan kapanırsa (2026-10-25: iki çekim aynı saniyede düştü) yeniden açıp eksik kareden sürer.
        # Kareler deterministik (tanitim.kare(t) anı eksiksiz kurar), yani yarıda kalan çekime devam etmek güvenli.
        for deneme in range(4):
            b = None
            try:
                b = p.chromium.launch(channel="msedge", headless=not o.gorunur, args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization"])
                pg = b.new_page(viewport={"width": o.en, "height": o.boy}, device_scale_factor=1)
                pg.on("pageerror", lambda e: hatalar.append(str(e)))
                pg.goto(url)
                pg.wait_for_function("window.tanitimHazir === true", timeout=90000)
                sure = pg.evaluate("tanitim.sure()")
                n = int(round(sure * o.fps))
                for fazla in glob.glob(os.path.join(kare_dir, "k_*.png")):  # süre kısalmışsa artakalan kareler videoya girmesin
                    if int(os.path.basename(fazla)[2:7]) >= n:
                        os.remove(fazla)
                eksik = [i for i in range(n) if not (os.path.exists(kare_yolu(i)) and os.path.getsize(kare_yolu(i)) > 0)]
                # var olan son kare yazılırken kesilmiş olabilir: onu da yeniden çek
                if eksik and eksik[0] > 0:
                    eksik.insert(0, eksik[0] - 1)
                print(f"süre {sure:.2f} sn, {n} kare; çekilecek {len(eksik)}")
                for j, i in enumerate(eksik):
                    pg.evaluate(f"tanitim.kare({i / o.fps})")
                    pg.screenshot(path=kare_yolu(i), type="png")
                    if j % 60 == 0:
                        print(f"  {i}/{n}  ({time.time() - t0:.0f} sn)")
                b.close()
                break
            except PwHata as e:
                print(f"tarayıcı düştü ({str(e).splitlines()[0][:120]}); yeniden açılıyor ({deneme + 1}/3)")
                try:
                    if b:
                        b.close()
                except PwHata:
                    pass
                if deneme == 3:
                    sys.exit("çekim tamamlanamadı; --devam ile yeniden çalıştır")
    if hatalar:
        print("SAYFA HATALARI:", *hatalar[:5], sep="\n  ")

    ff = ffmpeg_yolu()
    giris = ["-framerate", str(o.fps), "-i", os.path.join(kare_dir, "k_%05d.png")]
    mp4 = os.path.join(cikis, o.ad + ".mp4")
    vf = ["-vf", "scale=" + o.olcek.replace("x", ":") + ":flags=lanczos"] if o.olcek else []
    kalite = ["-crf", "20", "-maxrate", o.tavan, "-bufsize", str(float(o.tavan.rstrip("Mm")) * 2) + "M"] if o.tavan else ["-crf", "18"]
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *giris, *vf, "-c:v", "libx264", "-preset", "slow", *kalite,
                    "-tune", "animation", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], check=True)
    print(f"yazıldı: {mp4} ({os.path.getsize(mp4) / 1024:.0f} KB)")
    if o.poster:
        poster = os.path.join(cikis, o.ad + "-poster.webp")
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", os.path.join(kare_dir, "k_00000.png"), *vf,
                        "-c:v", "libwebp", "-quality", "80", poster], check=True)
        print(f"yazıldı: {poster} ({os.path.getsize(poster) / 1024:.0f} KB)")
    if o.webm:
        webm = os.path.join(cikis, o.ad + ".webm")
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *giris, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0",
                        "-row-mt", "1", "-pix_fmt", "yuv420p", webm], check=True)
        print(f"yazıldı: {webm} ({os.path.getsize(webm) / 1024:.0f} KB)")
    print(f"toplam {time.time() - t0:.0f} sn")


if __name__ == "__main__":
    main()
