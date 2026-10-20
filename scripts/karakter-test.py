"""Oda karakterinin başsız durum makinesi testini görünmez Edge'de koşar (lab/karakter-test.html).

Amaç: core/oda-karakter.js'i (iniş → masa, kenar ↔ üzerine gelince dönme, iptal, kalk ↔ otur, hareket azaltma) Node'suz
ve tarayıcı paneline bağlı kalmadan sınamak. Sayfa sahte glTF (gerçek GLB'nin meta'sı ve klip süreleri) ve sahte kare
saatiyle çalışır, sonucu bu betiğin kendi sunucusuna POST eder.
Girdi:  python scripts/karakter-test.py [--json] [--bekle 120] [--dry-run]
Çıktı:  her kontrol için bir satır (ya da --json ile makine-okunur sonuç); çıkış kodu 0 geçti, 1 kaldı, 2 sonuç gelmedi.
        Hiçbir dosya yazmaz. Kendi geçici Edge profilini kullanır; iş bitince yalnız o profille açık kalan Edge süreçlerini
        kapatır (kullanıcının kendi Edge'ine dokunmaz). Ağ: three.js CDN'den (lab/oda.html ile aynı sürüm).
Elle: python scripts/serve.py 8080 ile http://localhost:8080/lab/karakter-test.html açılır (sonuç sayfada).
"""
import argparse
import functools
import http.server
import json
import os
import subprocess
import sys
import tempfile
import threading
import time

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
PROFIL = os.path.join(tempfile.gettempdir(), 'oktos-karakter-test-edge')
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Sunucu(http.server.SimpleHTTPRequestHandler):
    """Depoyu önbelleksiz sunar; sayfanın sonucunu POST /sonuc ile alır"""
    sonuc = None
    geldi = threading.Event()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass

    def do_POST(self):
        if self.path != '/sonuc':
            self.send_error(404)
            return
        n = int(self.headers.get('Content-Length', 0))
        Sunucu.sonuc = json.loads(self.rfile.read(n) or b'null')
        self.send_response(204)
        self.end_headers()
        Sunucu.geldi.set()


def edge_kapat():
    ps = ("Get-CimInstance Win32_Process -Filter \"Name = 'msedge.exe'\" | "
          "Where-Object { $_.CommandLine -like '*oktos-karakter-test-edge*' } | "
          "ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }")
    subprocess.run(['powershell', '-NoProfile', '-Command', ps], capture_output=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--json', action='store_true', help='sonucu JSON olarak yaz')
    ap.add_argument('--bekle', type=int, default=120, help='sonuç için en çok saniye')
    ap.add_argument('--dry-run', action='store_true', help='komutu yazar, çalıştırmaz')
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Sunucu, directory=KOK))
    url = f'http://127.0.0.1:{srv.server_address[1]}/lab/karakter-test.html?bildir=1'
    cmd = [EDGE, '--headless=new', f'--user-data-dir={PROFIL}', '--no-first-run', '--disable-extensions', url]
    if a.dry_run:
        print(' '.join(cmd))
        return 0
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    t0 = time.time()
    try:
        # msedge.exe başlatıcısı tarayıcıyı arka planda bırakıp hemen döner (scripts/sayfa-cek.py notu): sonuç beklenir
        subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        geldi = Sunucu.geldi.wait(a.bekle)
    finally:
        edge_kapat()
        srv.shutdown()
    if not geldi or not Sunucu.sonuc:
        print(f'SONUÇ GELMEDİ ({a.bekle} sn): sayfa açılmadı ya da modül yüklenmedi (CDN?). Elle: {url.split("?")[0]}')
        return 2
    o = Sunucu.sonuc
    if a.json:
        print(json.dumps(o, ensure_ascii=False, indent=1))
    else:
        son = None
        for r in o['sonuc']:
            if r['grup'] != son:
                print(f"\n{r['grup']}")
                son = r['grup']
            print(f"  {'GEÇTİ' if r['gecti'] else 'KALDI'}  {r['ad']}" + (f"  ({r['ayrinti']})" if r['ayrinti'] and not r['gecti'] else ''))
        print(f"\n{'KALDI' if o['kaldi'] else 'GEÇTİ'}: {o['gecti']} geçti, {o['kaldi']} kaldı "
              f"(sayfada {o['sn']} sn, toplam {time.time() - t0:.1f} sn)")
    return 1 if o['kaldi'] else 0


if __name__ == '__main__':
    sys.exit(main())
