"""Yerel sunucudaki bir sayfanın ekran görüntüsünü görünmez Edge ile alır (3B sahneli sayfalar dahil).

Amaç: sahne ve yerleşim denemelerini (lab/oda.html gibi) tarayıcı paneline bağlı kalmadan, tam çözünürlükte
karşılaştırmak. Panelin kendi ekran görüntüsü küçültülür; bu betik sayfayı gerçek boyutunda çizer.
Girdi:
  python scripts/sayfa-cek.py YOL AD [--boyut 1280x800] [--bekle 12000]
    YOL: sunucuya göre adres, ör. "lab/oda.html?mod=still&odak=cekmece"; AD: çıktı adı
  python scripts/sayfa-cek.py --toplu cekimler.json [--sayfa karsilastirma]
    cekimler.json: [{"yol": "...", "ad": "...", "boyut": "1280x800", "bekle": 12000}, ...]
Çıktı: .impeccable/review/AD.png (yerel klasör, depoya girmez); --sayfa ile çekimler etiketli tek PNG'de.
  --dry-run: komutları yazar, hiçbir şey çalıştırmaz ve yazmaz. Aynı adla yeniden çalıştırmak dosyanın üstüne yazar.
Not: sanal zaman glTF dokularının çözülmesini beklemez; hazır model taşıyan sayfayı tarayıcı panelinde doğrula.
Gereken: yerel sunucu (python scripts/serve.py 8080; başka çalışma kopyası için --port) ve Microsoft Edge. Her
çalıştırma kendi geçici Edge profilini kullanır (aynı anda birden çok çekim çakışmaz); iş bitince yalnız o profille açık
kalan Edge süreçlerini kapatır (kullanıcının kendi Edge'ine dokunmaz).
"""
import argparse
import json
import os
import subprocess
import sys
import shutil
import tempfile
import time

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
PROFILE_AD = f'oktos-sayfa-edge-{os.getpid()}'
PROFILE = os.path.join(tempfile.gettempdir(), PROFILE_AD)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '.impeccable', 'review')
HOST = 'http://localhost:8080/'  # --port ile değişir


def capture(shot, dry):
    w, h = shot.get('boyut', '1280x800').split('x')
    path = os.path.join(OUT, shot['ad'] + '.png')
    # SwiftShader bayrakları (--use-angle=swiftshader) Edge 155'te tarayıcıyı görüntü yazmadan kapatıyor: verilmez
    cmd = [EDGE, '--headless=new', f'--user-data-dir={PROFILE}', '--no-first-run', '--hide-scrollbars', f'--window-size={w},{h}',
           f'--virtual-time-budget={shot.get("bekle", 12000)}', f'--screenshot={path}', HOST + shot['yol'].lstrip('/')]
    if dry:
        print(' '.join(cmd))
        return path
    before = os.path.getmtime(path) if os.path.exists(path) else None
    try:
        subprocess.run(cmd, capture_output=True, timeout=150)
    except subprocess.TimeoutExpired:
        print('zaman aşımı:', shot['ad'])
    # msedge.exe başlatıcısı (Edge 155) tarayıcıyı arka planda bırakıp hemen döner: görüntünün yazılıp boyutunun
    # sabitlenmesi, sonra profilin serbest kalması beklenir (yoksa sonraki çekim ya da temizlik onu yarıda keser)
    fresh = wait_written(path, before)
    wait_profile_free()
    print(('yazıldı: ' if fresh else 'YAZILMADI (eski dosya duruyor ya da hiç yok): ') + os.path.relpath(path, ROOT))
    return path


def wait_written(path, before, limit=150):
    t0, last = time.time(), -1
    while time.time() - t0 < limit:
        if os.path.exists(path) and os.path.getmtime(path) != before:
            size = os.path.getsize(path)
            if size and size == last:
                return True
            last = size
        time.sleep(0.5)
    return False


def wait_profile_free(limit=30):
    ps = ("@(Get-CimInstance Win32_Process -Filter \"Name = 'msedge.exe'\" | "
          "Where-Object { $_.CommandLine -like '*" + PROFILE_AD + "*' }).Count")
    t0 = time.time()
    while time.time() - t0 < limit:
        out = subprocess.run(['powershell', '-NoProfile', '-Command', ps], capture_output=True, text=True).stdout.strip()
        if out in ('', '0'):
            return
        time.sleep(1)


def cleanup():
    ps = ("Get-CimInstance Win32_Process -Filter \"Name = 'msedge.exe'\" | "
          "Where-Object { $_.CommandLine -like '*" + PROFILE_AD + "*' } | "
          "ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }")
    subprocess.run(['powershell', '-NoProfile', '-Command', ps], capture_output=True)
    shutil.rmtree(PROFILE, ignore_errors=True)


def sheet(paths, labels, name):
    from PIL import Image, ImageDraw, ImageFont
    pairs = [(Image.open(p).convert('RGB'), label) for p, label in zip(paths, labels) if os.path.exists(p)]
    if not pairs:
        return
    cols = 2 if len(pairs) > 1 else 1
    tw = 960 if cols == 2 else pairs[0][0].width
    th = round(tw * pairs[0][0].height / pairs[0][0].width)
    rows = (len(pairs) + cols - 1) // cols
    out = Image.new('RGB', (cols * tw, rows * (th + 34)), (24, 26, 28))
    g = ImageDraw.Draw(out)
    font = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 20)
    for i, (im, label) in enumerate(pairs):
        x, y = (i % cols) * tw, (i // cols) * (th + 34)
        out.paste(im.resize((tw, th)), (x, y + 34))
        g.text((x + 8, y + 5), label, font=font, fill=(239, 235, 228))
    path = os.path.join(OUT, name + '.png')
    out.save(path)
    print('sayfa:', os.path.relpath(path, ROOT))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('yol', nargs='?')
    ap.add_argument('ad', nargs='?')
    ap.add_argument('--boyut', default='1280x800')
    ap.add_argument('--bekle', type=int, default=12000)
    ap.add_argument('--toplu')
    ap.add_argument('--sayfa')
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    global HOST
    HOST = f'http://localhost:{a.port}/'
    if a.toplu:
        shots = json.load(open(a.toplu, encoding='utf-8'))
    elif a.yol and a.ad:
        shots = [{'yol': a.yol, 'ad': a.ad, 'boyut': a.boyut, 'bekle': a.bekle}]
    else:
        ap.error('YOL ve AD ya da --toplu gerekli')
    if not a.dry_run:
        os.makedirs(OUT, exist_ok=True)
    try:
        paths = [capture(s, a.dry_run) for s in shots]
    finally:
        if not a.dry_run:
            cleanup()
    if a.sayfa and not a.dry_run:
        sheet(paths, [s.get('etiket', s['ad']) for s in shots], a.sayfa)


if __name__ == '__main__':
    sys.exit(main())
