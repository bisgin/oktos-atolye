"""Amaç: Oktos Workshop'u yerelde önbelleksiz sunar (değişiklikler yenilemede hemen görünür).
Girdi: port (varsayılan 8080), kök klasör (varsayılan bu script'in bir üstü).
Çıktı: http://localhost:<port> adresinde statik sunucu. Hiçbir dosyayı değiştirmez."""
import functools
import http.server
import sys
from pathlib import Path


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent
    handler = functools.partial(NoCache, directory=str(root))
    print(f"Oktos Workshop -> http://localhost:{port}  (durdurmak icin Ctrl+C)")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
