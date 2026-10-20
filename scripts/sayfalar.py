"""Amaç: Araç sayfalarını (tools/<id>/index.html) templates/tool.html şablonundan üretir; iskelet tekrarını önler.
Araç sayfası doğrudan atölyeyle (şablon ve düzenleme ekranı) açılır; araçlara giriş oda sahneleridir
(2026-10-20 kullanıcı kararı: araç hikâye sahneleri kalktı).
Girdi: şablon + aşağıdaki liste. Metinler TR; çalışma anında core/i18n.js çevirir.
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
    {
        "id": "clicker",
        "title": "Fidget Clicker",
        "lede": "Sevdiğin figürün içinde bir klavye anahtarının çıtırtısı; klavyene de aynı tasarımın tuşu. Seç, ayarla, sipariş ver.",
        "desc": "İçine klavye anahtarı takılan figür anahtarlık (kedi, kalp, yıldız, yazılı kutu) ve aynı tasarımın MX uyumlu tuş başlığı. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
    {
        "id": "text",
        "title": "3D Yazı",
        "lede": "Kapı plakası, masa tabelası, pasta süsü, mıknatıs, anahtarlık. Yazını yaz, biçimini seç, sipariş ver.",
        "desc": "Kapı plakası, masa tabelası, pasta süsü, buzdolabı mıknatısı ve anahtarlık: kendi yazınla 3B baskı. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
    {
        "id": "flip",
        "title": "Text Flip",
        "lede": "İki kelime, tek heykel: önden biri, yandan öteki okunur. Kelimelerini yaz, sipariş ver.",
        "desc": "İki kelime, tek heykel: önden biri, yandan öteki okunur. Anneler ve Babalar Günü, isimler, yer adları. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
    {
        "id": "qr",
        "title": "3D QR Kod",
        "lede": "Wi-Fi şifresi, menü ya da sayfan tek bir karoda. Bir şablon seç, içeriğini yaz, sipariş ver.",
        "desc": "Wi-Fi standı, menü standı, kartvizit, anahtarlık ve bardak altlığı: telefonla okunan 3B baskılı QR kod. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
    {
        "id": "painter",
        "title": "Filament Painter",
        "lede": "Sevdiğin kareyi filament renkleriyle katman katman bas. Bir şablon seç, fotoğrafını koy, sipariş ver.",
        "desc": "Fotoğrafını filament renkleriyle katman katman rölyef olarak bas: çerçeveli tablo, pencere ışıklığı, kartpostal. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
    {
        "id": "puzzle",
        "title": "Puzzle Maker",
        "lede": "Fotoğrafını ya da sevdiğin bir şekli yapboz parçalarına böl. Bir şablon seç, ayarla, sipariş ver.",
        "desc": "Fotoğrafını ya da küre, küp, yumurta, kalp gibi bir şekli yapboz parçalarına böl. Tarayıcıda tasarla, Oktos basıp göndersin.",
    },
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
    degisen = 0
    for s in ATOLYELER:
        degisen += yaz(KOK / "tools" / s["id"] / "index.html", uret(s, arac), args.dry_run)
    print(f"{degisen} sayfa {'değişecek' if args.dry_run else 'güncellendi'}.")
    # Doldurulmamış yer tutucu kaldıysa uyar
    for p in (KOK / "tools").glob("*/index.html"):
        if "{{" in p.read_text(encoding="utf-8"):
            print(f"UYARI: doldurulmamış yer tutucu → {p.relative_to(KOK)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
