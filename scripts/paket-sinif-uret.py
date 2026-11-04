"""Amaç: Fiyat kataloğundan (depo dışı katalog.json) araç kabuğunun okuduğu paket SINIFI tablosunu üretir: core/paket-sinif.js.
Depoya yalnız sınıf adları (bronz/gumus/altin/platin, parçalı = ozel) ve özel tasarım tahmini için ölçü oranları
(katı→dilim gram oranı, gram bantları, tabla) girer. Fiyat, maliyet, süre, kâr GİRMEZ (repo herkese açık).
Girdi: --katalog YOL (katalog-uret.py çıktısı; yerel yol depoya yazılmaz, argümanla verilir).
Çıktı: core/paket-sinif.js (üzerine yazar; --dry-run yalnız farkı/özeti basar). Tekrar çalıştırmak güvenlidir.
"""
import argparse
import json
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
HEDEF = KOK / "core" / "paket-sinif.js"
ASCII = {"bronz": "bronz", "gümüş": "gumus", "altın": "altin", "platin": "platin", "özel sipariş": "ozel"}
YASAK = ("fiyat", "maliyet", "onerilen", "sabit", "egim", "dk_gram", "kar")


def uret(k):
    sablon = {}
    for r in k["sablonlar"]:
        sablon.setdefault(r["arac"], {})[r["sablon"]] = ASCII[r["paket"]]
    ot = k["ozel_tahmin"]
    oran = {anahtar: {"katiDilim": o["kati_dilim"],
                      "bant": [[ASCII[b["paket"]], round(b["gram_en_cok"], 1)] for b in o["bantlar"][:-1]]}
            for anahtar, o in ot["oran"].items()}
    veri = {"sira": [ASCII[p["ad"]] for p in ot["paketler"]], "tabla": ot["tabla_mm"], "sablon": sablon, "oran": oran}
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    satirlar = [f' "sira": {j(veri["sira"])},', f' "tabla": {j(veri["tabla"])},', ' "sablon": {']
    satirlar += [f'  "{a}": {j(s)},' for a, s in sablon.items()]
    satirlar[-1] = satirlar[-1].rstrip(",")
    satirlar += [" },", ' "oran": {']
    satirlar += [f'  "{a}": {j(o)},' for a, o in oran.items()]
    satirlar[-1] = satirlar[-1].rstrip(",")
    metin = "{\n" + "\n".join(satirlar) + "\n }\n}"
    assert json.loads(metin) == veri
    for y in YASAK:
        if f'"{y}' in metin:
            raise SystemExit(f"depoya fiyat/maliyet alanı sızıyor: {y}")
    return veri, ("// ÜRETİLMİŞ DOSYA, elle düzenleme: python scripts/paket-sinif-uret.py --katalog <katalog.json>\n"
                  "// Şablon → ikas tasarım paketi sınıfı (yalnız sınıf adı; fiyat/maliyet depoya girmez).\n"
                  "// oran: özel tasarımda katı gram → tahmini baskı gramı, bant: o gramın üst sınırına göre sınıf (son sınıf sınırsız).\n"
                  f"// Katalog tarihi: {k.get('tarih', '?')}\n"
                  f"export const PAKET_SINIF = {metin};\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--katalog", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    veri, js = uret(json.loads(Path(a.katalog).read_text(encoding="utf-8")))
    sayim = {}
    for arac in veri["sablon"].values():
        for s in arac.values():
            sayim[s] = sayim.get(s, 0) + 1
    eski = HEDEF.read_text(encoding="utf-8") if HEDEF.exists() else ""
    print(json.dumps({"sablon": sum(sayim.values()), "dagilim": sayim, "degisti": eski != js, "dry_run": a.dry_run},
                     ensure_ascii=False))
    if not a.dry_run and eski != js:
        HEDEF.write_text(js, encoding="utf-8", newline="\n")
    sys.exit(0)
