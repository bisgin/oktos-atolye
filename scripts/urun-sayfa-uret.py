# Amaç: her ürün için paylaşım tarayıcılarının (WhatsApp, Facebook, X, Telegram; JS çalıştırmazlar) okuyabileceği statik
#        sayfa ve önizleme görseli üretmek. Tek ürün sayfası urunler/urun.html?id=<id> JS ile dolar; paylaşım önizlemesi
#        boş kalır. Bu betik urun.html'in kopyasını urunler/<id>/index.html olarak yazar: <head>'de ürünün başlığı,
#        açıklaması, og:* ve twitter:* etiketleri dolu; <base href="../"> ile bütün göreli yollar urunler/'den çözülür,
#        kimlik <meta name="oktos:urun">'dan okunur (urun.html bunu bilir). Sayfa aynı içeriği yükler, yönlendirme yok.
#        Liste ve oda bağlantıları (urun.html?id=) değişmez; ikisi de çalışır, standart adres (canonical) statik sayfadır.
# Girdi:  python scripts/urun-sayfa-uret.py [--dry-run] [--kok https://oktos.org]
#         Veri core/urun-veri.js (URUNLER), şablon urunler/urun.html, kapak görselleri depodaki ürün görselleri.
# Çıktı:  urunler/<id>/index.html (24 ürün) + assets/urunler/og/<id>.jpg (1200 × 630, ≤ 120 KB). Görseli olmayan ürünün
#         kartında görsel yerine odanın fotoğrafı (assets/giris/og.jpg) durur. Tekrar çalıştırmak güvenli: içerik aynıysa
#         dosyaya dokunmaz; --dry-run yalnız ne yazılacağını basar. Listeden çıkan ürünün klasörü silinmez, "sahipsiz" diye
#         bildirilir (silme kullanıcı kararı).
import argparse, html, io, json, os, re, sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SABLON = os.path.join(KOK, "urunler", "urun.html")
VERI = os.path.join(KOK, "core", "urun-veri.js")
OG_DIR = "assets/urunler/og"
W, H, SINIR_KB = 1200, 630, 120
KAGIT, MUREKKEP, MUREKKEP2, VURGU = (234, 237, 235), (29, 33, 38), (79, 86, 96), (148, 64, 15)  # core/style.css --paper, --ink, --ink-2, --accent-ink
DURUM = {"satista": "Satışta", "stok-yok": "Stokta yok", "sayfa-yok": "Siparişle"}
YAZI = [os.path.join((os.environ.get("WINDIR") or os.path.join(os.environ.get("SystemDrive", "C:") + os.sep, "Windows")), "Fonts", f) for f in ("segoeuib.ttf", "segoeui.ttf")]


def veri():
    s = open(VERI, encoding="utf-8").read()
    m = re.search(r"export const URUNLER = (\[.*?\n\]);", s, re.S)
    if not m: sys.exit("core/urun-veri.js içinde URUNLER bulunamadı")
    return json.loads(m.group(1))


def meta_metni(u, ad):
    """urun.html metaMetni ile aynı kural: açıklamanın ilk cümleleri (~155 harf), yoksa ad + durum."""
    a = re.sub(r"\s+", " ", ((u.get("aciklama") or {}).get("tr") or "")).strip()
    if a:
        s = ""
        for c in re.findall(r"[^.!?]+[.!?]*", a):
            if len(s + c) > 155 and s: break
            s += c
        s = s.strip()
        return s if len(s) <= 160 else re.sub(r"\s+\S*$", "", s[:157]) + "…"
    return f"{ad}. Oktos atölyesinde tasarlanıp basılır. {DURUM.get(u.get('durum'), 'Hazır ürünler')}."


def kapak(u):
    g = (u.get("galeri") or [None])[0] or u.get("gorsel")
    return os.path.join(KOK, g) if g and os.path.exists(os.path.join(KOK, g)) else None


def satirla(d, metin, font, genislik, en_cok):
    kelimeler, satirlar, s = metin.split(), [], ""
    for k in kelimeler:
        dene = (s + " " + k).strip()
        if d.textlength(dene, font=font) <= genislik or not s: s = dene
        else: satirlar.append(s); s = k
    if s: satirlar.append(s)
    if len(satirlar) > en_cok:
        satirlar = satirlar[:en_cok]
        while d.textlength(satirlar[-1] + "…", font=font) > genislik and " " in satirlar[-1]: satirlar[-1] = satirlar[-1].rsplit(" ", 1)[0]
        satirlar[-1] += "…"
    return satirlar


def og_gorsel(u, ad):
    """1200 × 630 kart: solda ürünün kapağı (yüksekliğe sığar), sağda ad, durum ve marka. JPEG, ≤ 120 KB."""
    im = Image.new("RGB", (W, H), KAGIT)
    k = kapak(u)
    kaynak = Image.open(k).convert("RGB") if k else Image.open(os.path.join(KOK, "assets", "giris", "og.jpg")).convert("RGB")
    if k:
        # Arka: kapağın bulanık, açık tonlu genişletmesi (kart ürünün renginde); ön: kapak yüksekliğe sığar
        arka = kaynak.resize((W, int(W * kaynak.height / kaynak.width))).crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(40))
        im = Image.blend(arka, im, 0.72)
        olc = H / kaynak.height
        on = kaynak.resize((round(kaynak.width * olc), H), Image.LANCZOS)
        im.paste(on, (0, 0)); sol = on.width
    else:
        sol = 560  # odanın fotoğrafından sol kesit (masa ve raflar)
        on = kaynak.resize((round(kaynak.width * H / kaynak.height), H), Image.LANCZOS).crop((0, 0, sol, H))
        im.paste(on, (0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((sol, 0, W, H), fill=KAGIT)
    x, gen = sol + 56, W - sol - 56 - 56
    f_ad = ImageFont.truetype(YAZI[0], 54 if sol < 640 else 46)
    f_kucuk, f_marka = ImageFont.truetype(YAZI[1], 26), ImageFont.truetype(YAZI[0], 28)
    satirlar = satirla(d, ad, f_ad, gen, 5)
    yuk = f_ad.size * 1.12
    y = (H - len(satirlar) * yuk) / 2 - 20
    durum = DURUM.get(u.get("durum"))
    if durum:
        d.text((x, y - 50), durum.replace("i", "İ").upper(), font=f_kucuk, fill=VURGU)  # Türkçe büyük İ
    for s in satirlar:
        d.text((x, y), s, font=f_ad, fill=MUREKKEP); y += yuk
    d.text((x, H - 72), "Oktos Workshop", font=f_marka, fill=MUREKKEP)
    d.text((x + d.textlength("Oktos Workshop  ", font=f_marka), H - 70), "oktos.org", font=f_kucuk, fill=MUREKKEP2)
    for q in (86, 82, 78, 74, 70, 65, 60, 55, 50):
        b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
        if b.tell() <= SINIR_KB * 1024: return b.getvalue(), q
    sys.exit(f"{u['id']}: önizleme görseli {SINIR_KB} KB altına inmedi")


def sayfa(sablon, u, ad, aciklama, kok):
    url = f"{kok}/urunler/{u['id']}/"
    gorsel = f"{kok}/{OG_DIR}/{u['id']}.jpg"
    e = lambda s: html.escape(s, quote=True)
    bas = (f'<base href="../">\n'
           f'<meta name="oktos:urun" content="{e(u["id"])}">\n'
           f'<link rel="canonical" href="{e(url)}">\n')
    meta = (f'<meta property="og:type" content="product">\n'
            f'<meta property="og:site_name" content="Oktos Workshop">\n'
            f'<meta property="og:locale" content="tr_TR">\n'
            f'<meta property="og:url" content="{e(url)}">\n'
            f'<meta property="og:title" content="{e(ad)}">\n'
            f'<meta property="og:description" content="{e(aciklama)}">\n'
            f'<meta property="og:image" content="{e(gorsel)}">\n'
            f'<meta property="og:image:width" content="{W}">\n'
            f'<meta property="og:image:height" content="{H}">\n'
            f'<meta property="og:image:alt" content="{e(ad)}">\n'
            f'<meta name="twitter:card" content="summary_large_image">\n'
            f'<meta name="twitter:title" content="{e(ad)}">\n'
            f'<meta name="twitter:description" content="{e(aciklama)}">\n'
            f'<meta name="twitter:image" content="{e(gorsel)}">\n')
    s = sablon
    s, n1 = re.subn(r'(<meta charset="utf-8">\n)', lambda m: m.group(1) + bas, s, count=1)
    s, n2 = re.subn(r"<title>.*?</title>", lambda m: f"<title>{e(ad)} · Oktos Workshop</title>", s, count=1)
    s, n3 = re.subn(r'<meta name="description" content="[^"]*">\n', lambda m: f'<meta name="description" content="{e(aciklama)}">\n' + meta, s, count=1)
    if (n1, n2, n3) != (1, 1, 1): sys.exit("urunler/urun.html beklenen başlık düzeninde değil (charset / title / description)")
    s = s.replace("<!doctype html>", "<!doctype html>\n<!-- Otomatik üretildi: scripts/urun-sayfa-uret.py (şablon urunler/urun.html). Elle düzenleme. -->", 1)
    return s


def yaz(yol, veri, kuru):
    tam = os.path.join(KOK, yol)
    if os.path.exists(tam) and open(tam, "rb").read() == veri: return "aynı"
    if kuru: return "yazılacak"
    os.makedirs(os.path.dirname(tam), exist_ok=True)
    gecici = tam + ".yeni"
    with open(gecici, "wb") as f: f.write(veri)
    os.replace(gecici, tam)
    return "yazıldı"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--kok", default="https://oktos.org", help="sitenin kök adresi (index.html og:image ile aynı)")
    a = ap.parse_args()
    kok = a.kok.rstrip("/")
    sablon = open(SABLON, encoding="utf-8").read()
    urunler = veri()
    durum, ozet = {}, []
    for u in urunler:
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,80}", u["id"]): sys.exit(f"kimlik klasör adı olamaz: {u['id']!r}")
        ad = (u.get("ad") or {}).get("tr") or u["id"]
        aciklama = meta_metni(u, ad)
        jpg, q = og_gorsel(u, ad)
        s1 = yaz(f"{OG_DIR}/{u['id']}.jpg", jpg, a.dry_run)
        s2 = yaz(f"urunler/{u['id']}/index.html", sayfa(sablon, u, ad, aciklama, kok).encode("utf-8"), a.dry_run)
        for s in (s1, s2): durum[s] = durum.get(s, 0) + 1
        ozet.append({"id": u["id"], "og_kb": round(len(jpg) / 1024, 1), "q": q, "kapak": bool(kapak(u)), "gorsel": s1, "sayfa": s2})
    kimlikler = {u["id"] for u in urunler}
    sahipsiz = sorted(d for d in os.listdir(os.path.join(KOK, "urunler")) if os.path.isdir(os.path.join(KOK, "urunler", d)) and d not in kimlikler)
    print(json.dumps({"urun": len(urunler), "durum": durum, "sahipsiz_klasor": sahipsiz, "en_buyuk_kb": max(o["og_kb"] for o in ozet),
                      "kapaksiz": [o["id"] for o in ozet if not o["kapak"]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
