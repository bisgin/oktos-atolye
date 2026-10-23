# Amaç: tam çekimi (scripts/film-cek.py) yeniden yapmadan, filmde değişen kare aralıklarını yeniden çekip kare klasörüne
#       yazmak ve videoyu klasörden yeniden kodlamak. İsteğe bağlı: sesi bindirip sesli video ve telefon boyu kopya üretmek.
# Girdi:  python scripts/film-yenile.py "lab/tanitim/film.html?yon=dikey" KAYNAK_AD --aralik 432:797 [--aralik a:b ...]
#         [--sahne s1-kafe] (aralıklar o sahnenin İÇ kareleri; tanitim.sahneler() ile film karesine çevrilir)
#         [--cikis YENI_AD] (video adı; verilmezse KAYNAK_AD) [--tavan 5M] [--ses .impeccable/ses/film-ses-v10.wav]
#         [--telefon] (720p ya da 1280×720, ~2,4 Mb/sn, telefona gönderim için ≤ 30 MB) [--port 8080] [--dry-run]
#         KAYNAK_AD: .impeccable/film/<KAYNAK_AD>-kare/ klasörü (film-cek.py'nin bıraktığı kareler) var olmalı.
#         Yön sorgudan okunur (yon=dikey → 1080×1920). Yerel sunucu açık olmalı: python scripts/serve.py 8080
# Çıktı:  kare klasöründe yalnız verilen aralıkların PNG'leri değişir; .impeccable/film/<CIKIS>.mp4 (+ -sesli.mp4, -telefon.mp4)
# Güvenlik: sayfanın toplam kare sayısı klasördekiyle aynı değilse (kurgu süresi değişmiş) DURUR: o zaman tam çekim gerekir.
# Tekrar çalıştırmak güvenli: aynı kareleri yeniden yazar. --dry-run yalnız ne yapacağını yazar.
import argparse, glob, os, shutil, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILM = os.path.join(KOK, ".impeccable", "film")


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
    a.add_argument("kaynak")
    a.add_argument("--aralik", action="append", required=True, help="a:b (bitiş dahil)")
    a.add_argument("--sahne", help="aralıklar bu modülün iç kareleri")
    a.add_argument("--cikis")
    a.add_argument("--tavan", default="6M")
    a.add_argument("--ses")
    a.add_argument("--telefon", action="store_true")
    a.add_argument("--port", type=int, default=8080)
    a.add_argument("--dry-run", action="store_true")
    o = a.parse_args()

    dikey = "yon=dikey" in o.sayfa
    en, boy = (1080, 1920) if dikey else (1920, 1080)
    kare_dir = os.path.join(FILM, o.kaynak + "-kare")
    if not os.path.isdir(kare_dir):
        sys.exit(f"kare klasörü yok: {kare_dir} (önce film-cek.py ile tam çekim)")
    mevcut = len(glob.glob(os.path.join(kare_dir, "k_*.png")))
    yol = o.sayfa.replace(os.sep, "/")
    url = f"http://127.0.0.1:{o.port}/{yol}{'&' if '?' in yol else '?'}cek=1"
    cikis = o.cikis or o.kaynak

    from playwright.sync_api import sync_playwright
    t0 = time.time()
    with sync_playwright() as p:
        b = p.chromium.launch(channel="msedge", headless=True, args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization"])
        pg = b.new_page(viewport={"width": en, "height": boy}, device_scale_factor=1)
        hatalar = []
        pg.on("pageerror", lambda e: hatalar.append(str(e)))
        pg.goto(url)
        pg.wait_for_function("window.tanitimHazir === true", timeout=90000)
        hatalar += pg.evaluate("tanitim.hatalar || []")
        toplam = int(round(pg.evaluate("tanitim.sure()") * 60))
        if toplam != mevcut:
            b.close()
            sys.exit(f"DURDU: sayfa {toplam} kare, klasör {mevcut} kare. Kurgu süresi değişmiş; tam çekim gerekir (film-cek.py).")
        kaydir = 0
        if o.sahne:
            s = [x for x in pg.evaluate("tanitim.sahneler()") if x["m"] == o.sahne]
            if not s:
                b.close()
                sys.exit(f"sahne yok: {o.sahne}")
            kaydir = s[0]["kaydir"]
        kareler = sorted({n + kaydir for r in o.aralik for n in range(int(r.split(":")[0]), int(r.split(":")[1]) + 1)})
        kareler = [n for n in kareler if 0 <= n < toplam]
        print(f"{len(kareler)} kare yeniden çekilecek (film k{kareler[0]}–k{kareler[-1]}, kayma {kaydir}) → {kare_dir}")
        if o.dry_run:
            b.close()
            return
        for i, n in enumerate(kareler):
            pg.evaluate(f"tanitim.kare({n / 60})")
            pg.screenshot(path=os.path.join(kare_dir, f"k_{n:05d}.png"), type="png")
            if i % 120 == 0:
                print(f"  {i}/{len(kareler)} ({time.time() - t0:.0f} sn)")
        b.close()
    if hatalar:
        print("SAYFA HATALARI:", *hatalar[:5], sep="\n  ")

    ff = ffmpeg_yolu()
    giris = ["-framerate", "60", "-i", os.path.join(kare_dir, "k_%05d.png")]
    mp4 = os.path.join(FILM, cikis + ".mp4")
    buf = str(float(o.tavan.rstrip("Mm")) * 2) + "M"
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *giris, "-c:v", "libx264", "-preset", "slow", "-crf", "20",
                    "-maxrate", o.tavan, "-bufsize", buf, "-tune", "animation", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], check=True)
    print(f"yazıldı: {mp4} ({os.path.getsize(mp4) // 1024} KB)")
    if o.ses:
        sesli = os.path.join(FILM, cikis + "-sesli.mp4")
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-i", o.ses, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", sesli], check=True)
        print(f"yazıldı: {sesli} ({os.path.getsize(sesli) // 1024} KB)")
        if o.telefon:
            tel = os.path.join(FILM, cikis + "-telefon.mp4")
            olcek = "720:1280" if dikey else "1280:720"
            subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", sesli, "-vf", f"scale={olcek}:flags=lanczos",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "2.4M", "-bufsize", "4.8M", "-pix_fmt", "yuv420p",
                            "-r", "60", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tel], check=True)
            print(f"yazıldı: {tel} ({os.path.getsize(tel) // 1024} KB)")
    print(f"toplam {time.time() - t0:.0f} sn")


if __name__ == "__main__":
    main()
