"""Amaç: laboratuvar sayfasının ürettiği kareyi (PNG) diske yazar. Tarayıcı panelindeki gerçek tarayıcıdan tam
çözünürlüklü görüntü almak için: görünmez Edge'de hazır model (glTF) taşıyan setler boş geliyor, panelin kendi ekran
görüntüsü ise küçültülüyor.
Girdi: port (varsayılan 8091). Sayfa, POST http://127.0.0.1:8091/<ad> ile gövdede PNG gönderir
  (ör. konsoldan: fetch("http://127.0.0.1:8091/ad", { method: "POST", body: pngBlob })).
Çıktı: .impeccable/review/<ad>.png (yerel klasör, depoya girmez). Aynı ad yeniden gelirse üstüne yazar.
Güvenlik: yalnız 127.0.0.1'i dinler; ad yalnız harf, rakam, - ve _; gövde PNG imzasıyla başlamalı, en çok 20 MB.
Durdurmak: Ctrl+C (ya da arka plan görevini durdur).
"""
import http.server
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / '.impeccable' / 'review'
PNG = b'\x89PNG\r\n\x1a\n'
LIMIT = 20 * 1024 * 1024


class Receiver(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_POST(self):
        name = self.path.strip('/')
        size = int(self.headers.get('Content-Length') or 0)
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', name) or not 0 < size <= LIMIT:
            return self.reply(400, 'gecersiz ad ya da boyut')
        body = self.rfile.read(size)
        if not body.startswith(PNG):
            return self.reply(400, 'PNG degil')
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / f'{name}.png').write_bytes(body)
        print(f'yazildi: .impeccable/review/{name}.png ({size // 1024} KB)', flush=True)
        self.reply(200, 'ok')

    def reply(self, code, text):
        self.send_response(code)
        self.cors()
        self.end_headers()
        self.wfile.write(text.encode())

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8091
    print(f'kare alicisi -> http://127.0.0.1:{port}  ({OUT})', flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Receiver).serve_forever()
