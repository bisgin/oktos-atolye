"""Amaç: Araç sayfalarını (tools/<id>/index.html) şablondan üretir; iskelet tekrarını önler.
- Atölyesi olan araçlar  → templates/tool.html  (hikâye sahnesi + atölye)
- Atölyesi henüz yok    → templates/story.html (yalnız hikâye sahnesi)
Girdi: şablonlar + aşağıdaki listeler. Metinler TR; çalışma anında core/i18n.js ve core/story-data.js çevirir.
Çıktı: tools/<id>/index.html. Var olan dosyanın üzerine yazar; --dry-run ile yalnız ne değişeceğini gösterir.
Tekrar çalıştırmak güvenlidir (aynı girdi → aynı çıktı)."""
import argparse
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent

ATOLYELER = [
    {
        "id": "bin",
        "title": "Kutu ve Organizer",
        "lede": "Çekmece, masa ve rafa ölçüyle organizer. Bir şablon seç, ölçünü gir, sipariş ver.",
        "desc": "Çekmece, masa ve raf için ölçüye özel kutu, bölmeli tepsi, kalemlik ve Gridfinity taban plakası. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
    {
        "id": "vase",
        "title": "Vazo Üreteci",
        "lede": "Köşe sayısını, siluetini ve dokusunu seç. Her efekti istediğin yükseklik aralığına uygula.",
        "desc": "Köşe sayısı, siluet, burgu, kaburga ve dokuyla vazo ve saksı tasarla. Efektleri istediğin yükseklik aralığına uygula, Oktos basıp göndersin.",
    },
]

# Hikâye başlığı ve alt metni core/story-data.js ile aynı (TR); arama motoru ve JS yüklenmeden önce görünür.
SAHNELER = [
    {"id": "clicker", "title": "Fidget Clicker", "storyTitle": "Tık. Bir nefes daha.",
     "desc": "Sevdiğin figürün içinde mavi bir anahtarın çıtırtısı. Toplantıda, derste, sıra beklerken."},
    {"id": "text", "title": "3D Yazı", "storyTitle": "Adın kapında dursun.",
     "desc": "İsimlik, tabela, anahtarlık, pasta süsü. Yazı tipini seç, kalınlığını ver, atölye bassın."},
    {"id": "flip", "title": "Text Flip", "storyTitle": "Bir yandan sen, öbür yandan o.",
     "desc": "İki kelime, tek heykel. Çevirdikçe öteki kelime belirir."},
    {"id": "qr", "title": "3D QR Kod", "storyTitle": "Misafirin şifre sormasın.",
     "desc": "Wi-Fi şifresi, menü ya da sayfan: hepsi tek bir karoda. Telefonu tutan bağlanır."},
    {"id": "painter", "title": "Filament Painter", "storyTitle": "Fotoğrafın ışıkta derinleşsin.",
     "desc": "Sevdiğin kareyi filament renkleriyle katman katman bas. Pencereye tuttuğunda dağlar öne çıkar."},
    {"id": "puzzle", "title": "Puzzle Maker", "storyTitle": "Bir model, yüz parça.",
     "desc": "Sevdiğin modeli yapboz parçalarına böl. Birlikte toplamak da hediyenin bir parçası olsun."},
]


def uret(sayfa, sablon):
    html = sablon
    for anahtar, deger in sayfa.items():
        html = html.replace("{{" + anahtar + "}}", deger)
    return html.replace("{{root}}", "../../")


def yaz(hedef, yeni, dry):
    eski = hedef.read_text(encoding="utf-8") if hedef.exists() else None
    if eski == yeni:
        print(f"aynı       {hedef.relative_to(KOK)}")
        return 0
    print(f"{'yazılacak' if dry else 'yazıldı  '}  {hedef.relative_to(KOK)}")
    if not dry:
        hedef.parent.mkdir(parents=True, exist_ok=True)
        hedef.write_text(yeni, encoding="utf-8", newline="\n")
    return 1


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # Windows konsolunda Türkçe karakterler bozulmasın
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true", help="yazmadan farkları göster")
    args = ap.parse_args()
    arac = (KOK / "templates" / "tool.html").read_text(encoding="utf-8")
    sahne = (KOK / "templates" / "story.html").read_text(encoding="utf-8")
    degisen = 0
    for s in ATOLYELER:
        degisen += yaz(KOK / "tools" / s["id"] / "index.html", uret(s, arac), args.dry_run)
    for s in SAHNELER:
        degisen += yaz(KOK / "tools" / s["id"] / "index.html", uret(s, sahne), args.dry_run)
    print(f"{degisen} sayfa {'değişecek' if args.dry_run else 'güncellendi'}.")
    # Doldurulmamış yer tutucu kaldıysa uyar
    for p in (KOK / "tools").glob("*/index.html"):
        if "{{" in p.read_text(encoding="utf-8"):
            print(f"UYARI: doldurulmamış yer tutucu → {p.relative_to(KOK)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
