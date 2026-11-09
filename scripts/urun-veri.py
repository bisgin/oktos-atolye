# Amaç: depo dışındaki ürün envanterinden sitede görünecek ürünlerin verisini (core/urun-veri.js) yazmak. Oda yuvaları
#        (core/oda-urunler.js) ve /urunler/ sayfası bu tek dosyayı okur.
# Girdi:  python scripts/urun-veri.py --kaynak <envanter.json> [--diorama <site paketi> [--diorama-video <klasör>] [--videosuz]]
#                                      [--dry-run] [--dioramasiz]
#         Ürünler gerçek adları ve gerçek görselleriyle yazılır (2026-11-02 kullanıcı kararı: perde/bulanık görsel yok;
#         eski --perdesiz bayrağı zararsızca kabul edilir, etkisi yok).
#         --diorama: diorama plakalarının site paketi (urunler.csv + görseller; scripts/urun-diorama.py okur, görselleri
#         assets/urunler/diorama/ altına hazırlar). Çıktıda diorama varken --diorama verilmezse betik durur (girdiler düşmesin);
#         bilerek düşürmek için --dioramasiz. Video klasörü ya da bir ürünün dönüş videosu yoksa durur; --videosuz ile devam.
#         Kaynak yolları bilerek argümandır: depo herkese açık, yerel klasör yolu betiğe ve çıktıya girmez.
# Çıktı:  core/urun-veri.js (ES modülü: URUN_VERI_TARIHI, YUVALAR, URUNLER). Envanterden yalnız mağazada sayfası olan
#         ürünler yazılır (2026-11-01 kararı, geri alınabilir); sayfası olmayanlar depoya hiç girmez (ad, telif notu, kaynak
#         dahil). Diorama plakaları (2026-11-02) mağaza sayfası olmadan girer: ilandaki gerçek ad ve açıklama, mağaza adresi yok.
#         ESKI_KIMLIK: kaldırılan eski kimlik → bugünkü kimlik (ürün sayfası eski adresleri doğru ürüne yönlendirir).
#         Envanterin kaynak / not / neden sütunları ve önerilen fiyat ya da maliyet yazılmaz.
#         Sıra (/urunler/ ve ana sayfa yelpazesi bu sırayı okur): önce görselli ürünler, sonra görselsizler; her grupta
#         yuva sırası. Bir yuvanın kendi içindeki sırası
#         (odanın okuduğu) değişmez.
#         Yazım tek seferde: envanter, diorama paketi, görseller ve videolar önce doğrulanır, bütün çıktılar bellekte
#         üretilir; sorun varsa tek satırlık iletiyle ve hiçbir dosyaya dokunmadan durur (çıkış kodu 1). Sonra değişen
#         dosyalar (görseller, video, core/urun-veri.js) geçici klasöre yazılıp yerine taşınır.
#         Tekrar çalıştırmak güvenli: aynı girdi aynı dosyayı üretir; --dry-run yalnız özeti basar, dosyaya dokunmaz.
import argparse, importlib.util, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")  # sys.exit iletileri Türkçe
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = os.path.join(KOK, "core", "urun-veri.js")

# Oda yuvaları (docs/sayfa-haritasi.md "Oda durakları: karar"). eski: bugünkü durak kimliği (kadraj oradan taşınır).
YUVALAR = [
    ("sticker", "cekmece", "Sticker'lar", "Stickers"),
    ("anahtarlik", "anahtarlik", "Kart anahtarlıklar", "Card keychains"),
    ("figur", "kalemlik", "Minifigürler", "Minifigures"),
    ("raf", "modem", "Diorama plakaları", "Diorama plates"),
    ("kilic", "cerceve", "Katana", "Katana"),
    ("maske", "yapboz", "Maske", "Mask"),
    ("biblo", "saksilar", "Balbal biblolar", "Balbal figurines"),
]
# Odada gizli yuvalar (YUVALAR'a oda: false yazılır): ürünleri /urunler/'de görünür, odada işaretçi, kart ve tur durağı
# yok. raf 2026-11-04'te açıldı: rafta hafif plaka modeli (gerçek ölçü + kapak görseli, core/oda-urunler.js plakaModeli).
ODA_GIZLI = set()

# Mağaza adresinin son parçası → (kimlik, yuva, TR ad, EN ad). Mağaza başlıkları uzun ve SEO kokulu; sitede kısa ad.
URUN = {
    "black-lotus-anahtarlik-canta-takisi-magic-thr-gathering": ("black-lotus", "anahtarlik", "Black Lotus anahtarlık", "Black Lotus keychain"),
    "blastoise-anahtarlik-canta-takisi-pokemon": ("blastoise", "anahtarlik", "Blastoise anahtarlık", "Blastoise keychain"),
    "charizard-anahtarlik-canta-takisi-pokemon": ("charizard", "anahtarlik", "Charizard anahtarlık", "Charizard keychain"),
    "dark-magician-anahtarlik-canta-takisi-yu-gi-oh": ("dark-magician", "anahtarlik", "Dark Magician anahtarlık", "Dark Magician keychain"),
    "venasaur-anahtarlik-canta-takisi-pokemon": ("venusaur", "anahtarlik", "Venusaur anahtarlık", "Venusaur keychain"),
    "akademi-atlisi": ("akademi-atlisi", "biblo", "Akademi Atlısı", "Akademi Atlısı"),
    "kadere-kinali": ("kadere-kinali", "biblo", "Kadere Kınalı", "Kadere Kınalı"),
    "kapital-kagan": ("kapital-kagan", "biblo", "Kapital Kağan", "Kapital Kağan"),
    "grimdark-evrenleri-magnum-tanklari": ("magnum-tanks", "figur", "Grimdark Evrenleri · Magnum Tanks", "Grimdark Universes · Magnum Tanks"),
    "grimdark-evrenleri-ultra-on-cepheciler": ("ultra-on-cepheciler", "figur", "Grimdark Evrenleri · Ultra Ön-Cepheciler", "Grimdark Universes · Ultra Ön-Cepheciler"),
    "imperium-clankers-tekli-figur-ve-altligi": ("imperium-clankers", "figur", "Grimdark Evrenleri · Imperium Clankers", "Grimdark Universes · Imperium Clankers"),
    "pokemon-tcg-mini-saklama-kutusu": ("tcg-kutu", "figur", "Pokémon TCG mini saklama kutusu", "Pokémon TCG mini storage box"),
    "katlanir-katana-kilic-sebat-tasinabilir-japon-tarzi-dekoratif-kilic": ("katana-sebat", "kilic", "Katlanır katana Sebat", "Folding katana Sebat"),
    "skeleton-mask-tertip-tedbir": ("skeleton-mask", "maske", "Skeleton Mask · Tertip / Tedbir", "Skeleton Mask · Tertip / Tedbir"),
}
MAGAZA_KOK = "https://oktosworkshop.com/"  # sitede bağlantıya dönüşen adres yalnız bizim mağazamız (javascript:/dış adres girmesin)
MAGAZA_GORSEL = "assets/urunler/magaza"  # görseli olmayan ürünün mağaza görseli: <kimlik>.webp (≤ 120 KB)
DURUM = {"var": "satista", "stok yok": "stok-yok", "sayfa yok": "sayfa-yok"}

# Kaldırılan kimlikler (2026-11-01 telif perdesinin markasız kimlikleri) → bugünkü kimlik: eski bağlantılar kırılmasın.
ESKI_KIMLIK = {"lotus": "black-lotus", "su-kaplumbagasi": "blastoise", "ates-ejderi": "charizard",
               "kara-buyucu": "dark-magician", "cicek-sirtli": "venusaur", "kart-kutusu": "tcg-kutu"}


def magaza_kimlik(slug, ad):
    """Mağaza taraması (--magaza) için: adres son parçası + mağaza adı → (kimlik, yuva, TR ad, EN ad) ya da None.
    Önce URUN tablosu (kimlikler sabit kalsın); yoksa ürün türü adresten okunur (2026-11-09: mağazadaki bütün ürünler)."""
    if slug in URUN: return URUN[slug]
    if "-sticker" in slug:  # mağaza adı zaten kısa ve İngilizce (ör. "Be - Sweet")
        return (re.sub(r"-+", "-", slug.split("-sticker")[0]), "sticker", ad, ad)
    if "-anahtarlik-canta-takisi" in slug:
        oz = ad.split(" Anahtarlık")[0].strip()
        return (slug.split("-anahtarlik-canta-takisi")[0], "anahtarlik", f"{oz} anahtarlık", f"{oz} keychain")
    if slug.endswith("-evrim-silindiri-diorama"):  # evrim silindirleri: plaka paketinde yok, mağaza ilanıyla girer
        en = ad.replace("Evrim Silindiri", "Evolution Cylinder")
        en = re.sub(r"\((\d+)'(?:li|lü|lu|lı)\)", r"(set of \1)", en)
        return (slug[: -len("-diorama")], "raf", ad, en)
    return None


def fiyat_kisa(metin):
    # "149,00 TL – 199,00 TL" → "149–199 TL"; "139,00 TL" → "139 TL". Mağaza fiyatı; tek doğru yer mağaza.
    sayilar = [s.replace(",00", "") for s in re.findall(r"\d+(?:,\d+)?", metin or "")]
    if not sayilar: return None
    return f"{sayilar[0]}–{sayilar[-1]} TL" if len(sayilar) > 1 and sayilar[0] != sayilar[-1] else f"{sayilar[0]} TL"


def envanter_oku(yol):
    """envanter.json → sözlük; yoksa, bozuksa ya da biçimi beklenmedikse tek satırlık iletiyle durur (ham döküm yok)."""
    ad = os.path.basename(os.path.normpath(yol)) or yol
    try:
        with open(yol, encoding="utf-8") as f: env = json.load(f)
    except FileNotFoundError: sys.exit(f"envanter bulunamadı: {ad} (--kaynak ile envanter.json yolunu ver)")
    except IsADirectoryError: sys.exit(f"envanter bir klasör: {ad} (--kaynak ile envanter.json dosyasını ver)")
    except UnicodeDecodeError: sys.exit(f"envanter okunamadı: {ad} UTF-8 değil")
    except json.JSONDecodeError as e: sys.exit(f"envanter bozuk JSON: {ad}, satır {e.lineno} sütun {e.colno} ({e.msg})")
    except OSError as e: sys.exit(f"envanter açılamadı: {ad} ({e.strerror or e})")
    if not isinstance(env, dict) or not isinstance(env.get("urunler"), list):
        sys.exit(f"envanter biçimi beklenmedik: {ad} içinde 'urunler' listesi yok")
    if not all(isinstance(u, dict) for u in env["urunler"]): sys.exit(f"envanter biçimi beklenmedik: {ad} 'urunler' öğeleri nesne değil")
    return env


def _dio():
    tanim = importlib.util.spec_from_file_location("urun_diorama", os.path.join(KOK, "scripts", "urun-diorama.py"))
    dio = importlib.util.module_from_spec(tanim)
    tanim.loader.exec_module(dio)
    return dio


def vitrin(x):
    """Liste sırası: 0 görselli, 1 görselsiz (simge yer tutucusu)"""
    return 0 if x.get("gorsel") else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kaynak", help="envanter.json (depo dışında)")
    ap.add_argument("--magaza", help="magaza-tara.json (depo dışında; mağazadaki bütün ürünler, kaynak bu olur)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--perdesiz", action="store_true", help=argparse.SUPPRESS)  # eski bayrak: artık varsayılan, etkisi yok
    ap.add_argument("--diorama", help="diorama plakalarının site paketi (urunler.csv; depo dışında)")
    ap.add_argument("--diorama-video", help="dönüş videolarının klasörü (varsayılan <paket>/../../video)")
    ap.add_argument("--videosuz", action="store_true", help="video klasörü ya da bir dioramanın videosu yoksa durma, videosuz devam et")
    ap.add_argument("--dioramasiz", action="store_true", help="çıktıdaki diorama girdilerini bilerek düşür")
    a = ap.parse_args()
    eski = open(CIKTI, encoding="utf-8").read() if os.path.exists(CIKTI) else None
    if not a.diorama and not a.dioramasiz and eski and '"grup": "diorama"' in eski:
        sys.exit("Çıktıda diorama girdileri var: --diorama <site paketi> ver (bilerek düşürmek için --dioramasiz)")
    if not a.kaynak and not a.magaza: sys.exit("--kaynak <envanter.json> ya da --magaza <magaza-tara.json> ver")
    urunler, bilinmeyen, dio_magaza = [], [], {}
    if a.magaza:
        env = envanter_oku(a.magaza)
        tarih = (env.get("olusturma") or "")[:10]
        for u in env["urunler"]:
            url = (u.get("adres") or "").strip()
            if not url.startswith(MAGAZA_KOK): sys.exit(f"Mağaza adresi {MAGAZA_KOK} ile başlamıyor: {url[:60]}")
            durum = "satista" if u.get("stokta") == "evet" else "stok-yok"
            if u.get("planlı_sku"):  # plaka paketindeki diorama: paket girdisine mağaza adresi ve fiyatı eklenir
                dio_magaza[u["planlı_sku"]] = {"magaza": url, "fiyat": fiyat_kisa(u.get("fiyat")), "durum": durum}
                continue
            k = magaza_kimlik(u.get("slug", ""), u.get("ad", ""))
            if not k: bilinmeyen.append(u.get("slug", "")); continue
            kimlik, yuva, tr, en = k
            gorsel = f"assets/oda/anahtarlik-{kimlik}.webp" if yuva == "anahtarlik" else None
            if gorsel and not os.path.exists(os.path.join(KOK, gorsel)): gorsel = None
            if not gorsel and os.path.exists(os.path.join(KOK, MAGAZA_GORSEL, f"{kimlik}.webp")):
                gorsel = f"{MAGAZA_GORSEL}/{kimlik}.webp"
            urunler.append({"id": kimlik, "ad": {"tr": tr, "en": en}, "yuva": yuva, "durum": durum,
                            "magaza": url, "fiyat": fiyat_kisa(u.get("fiyat")), "gorsel": gorsel})
    else:
        env = envanter_oku(a.kaynak)
        tarih = (env.get("olusturma") or "")[:10]
    for u in ([] if a.magaza else env["urunler"]):
        url = (u.get("ikas_url") or "").strip()
        if not url: continue  # mağazada sayfası yok: depoya girmez
        if not url.startswith(MAGAZA_KOK): sys.exit(f"Mağaza adresi {MAGAZA_KOK} ile başlamıyor: {url[:60]}")
        yol = url.rstrip("/").rsplit("/", 1)[-1]
        if yol not in URUN: bilinmeyen.append(yol); continue
        kimlik, yuva, tr, en = URUN[yol]
        gorsel = f"assets/oda/anahtarlik-{kimlik}.webp" if yuva == "anahtarlik" else None
        if gorsel and not os.path.exists(os.path.join(KOK, gorsel)): gorsel = None
        if not gorsel and os.path.exists(os.path.join(KOK, MAGAZA_GORSEL, f"{kimlik}.webp")):
            gorsel = f"{MAGAZA_GORSEL}/{kimlik}.webp"  # mağaza ilanının kendi görseli (2026-11-03)
        urunler.append({"id": kimlik, "ad": {"tr": tr, "en": en}, "yuva": yuva, "durum": DURUM.get(u.get("satin_al"), "sayfa-yok"),
                        "magaza": url, "fiyat": fiyat_kisa(u.get("fiyat")), "gorsel": gorsel})
    if bilinmeyen:
        sys.exit(f"Eşlemesi olmayan mağaza adresi: {', '.join(bilinmeyen)} (URUN tablosuna ekle)")
    dio_sira, bekleyen = {}, []
    dio = _dio()  # yazım (yaz) ve diorama hazırlığı aynı modülde
    if a.diorama:  # diorama plakaları: ilandaki gerçek ad/açıklama + görseller (bellekte; yazım en sonda, hepsi birlikte)
        dioramalar, dozet, bekleyen = dio.hazirla(a.diorama, a.diorama_video, a.dry_run, a.videosuz)
        print("diorama:", json.dumps(dozet, ensure_ascii=False))
        sku_kimlik = {sku: t[0] for sku, t in dio.DIORAMA.items()}
        kimlik_magaza = {sku_kimlik[s]: m for s, m in dio_magaza.items() if s in sku_kimlik}
        if set(dio_magaza) - set(sku_kimlik): sys.exit(f"Paket dışı planlı SKU: {', '.join(sorted(set(dio_magaza) - set(sku_kimlik)))}")
        for g in dioramalar:  # mağazada yayına girmiş plaka: satın al düğmesi mağazaya gider
            g.update(kimlik_magaza.get(g["id"], {}))
        dio_sira = {g["id"]: i for i, g in enumerate(dioramalar)}  # yuvada paketin (SKU) sırası
        urunler += dioramalar
    if len({x["id"] for x in urunler}) != len(urunler): sys.exit("Aynı kimlikli iki ürün var")
    kimlikler = {x["id"] for x in urunler}
    eski_kimlik = {e: y for e, y in sorted({**ESKI_KIMLIK, **dio.ESKI_KIMLIK}.items()) if y in kimlikler and e not in kimlikler}
    sira = [y[0] for y in YUVALAR]
    urunler.sort(key=lambda x: (vitrin(x), sira.index(x["yuva"]), dio_sira.get(x["id"], 0), x["id"]))
    yuvalar = [{"id": i, "eski": e, "ad": {"tr": tr, "en": en}, "urun": sum(1 for x in urunler if x["yuva"] == i),
                **({"oda": False} if i in ODA_GIZLI else {})} for i, e, tr, en in YUVALAR]

    ozet = {y["id"]: y["urun"] for y in yuvalar}
    print(f"envanter {len(env['urunler'])} ürün → sitede {len(urunler)}; yuva başına: {json.dumps(ozet, ensure_ascii=False)}")
    print("durum:", {d: sum(1 for x in urunler if x["durum"] == d) for d in ("satista", "stok-yok", "sayfa-yok")})
    print("eski kimlik yönlendirmesi:", len(eski_kimlik))
    print("odada gizli yuva:", ", ".join(sorted(ODA_GIZLI)) or "yok")
    if a.dry_run: return

    js = ("// Otomatik üretildi: scripts/urun-veri.py (depo dışındaki ürün envanteri, " + tarih + "). Elle düzenleme; betik yeniden yazar.\n"
          "// Envanterden yalnız mağazada sayfası olan ürünler. durum: satista | stok-yok | sayfa-yok. fiyat: mağaza fiyatı (tek doğru yer mağaza).\n"
          "// gorsel: ürün görseli (yoksa null; Blender renderı assets/urunler/ altına gelecek). Yuvada ürün yoksa (urun: 0) yuva gizli;\n"
          "// oda: false olan yuva yalnız odada gizli (ürünleri /urunler/'de görünür).\n"
          + ("// Diorama plakaları (grup: 'diorama', depo dışındaki site paketinden): mağaza sayfası yok (magaza, fiyat null); galeri: 6 görsel\n"
             "// (kapak → ölçü), kucuk: galerinin 240 px küçük resimleri (aynı sırayla), gorsel: kapağın 600 px'i, olcu: mm\n"
             "// (g genişlik, d derinlik, y yükseklik), parca: plaka sayısı, video: ürüne yakın kırpılmış dönüş videosu ya da null,\n"
             "// video_boyut: videonun piksel boyutu (g, y), video_kapak: videonun ilk karesi (poster).\n"
             if dio_sira else "")
          + "// Ürünler gerçek adları ve gerçek görselleriyle. ESKI_KIMLIK: eski kimlik → bugünkü (ürün sayfası yönlendirir).\n" +
          f"export const URUN_VERI_TARIHI = {json.dumps(tarih)};\n\n"
          f"export const YUVALAR = {json.dumps(yuvalar, ensure_ascii=False, indent=2)};\n\n"
          f"export const URUNLER = {json.dumps(urunler, ensure_ascii=False, indent=2)};\n\n"
          f"export const ESKI_KIMLIK = {json.dumps(eski_kimlik, ensure_ascii=False, indent=2)};\n")
    yol = os.path.relpath(CIKTI, KOK).replace(os.sep, "/")
    n = dio.yaz([*bekleyen, (yol, js.encode("utf-8"))])  # hepsi doğrulandı: görseller, video ve veri birlikte
    print(f"yazılan dosya: {n}" + ("" if eski != js else f" (değişiklik yok: {yol})"))


if __name__ == "__main__":
    try:
        main()
    except OSError as e:  # disk/izin hatası: ham döküm yerine tek satır
        sys.exit(f"dosya hatası: {type(e).__name__}: {e.strerror or e}")
