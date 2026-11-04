# Amaç: depo dışındaki diorama plakası site paketinden (urunler.csv + ürün başına 6 görsel + dönüş videosu)
#        sitenin ürün verisine diorama girdilerini ve görsellerini hazırlamak. scripts/urun-veri.py --diorama bu modülü
#        çağırır (core/urun-veri.js'i de aynı yazımla o yazar); tek başına yalnız görselleri/videoyu yazar ya da yerel yol taraması yapar.
# Girdi:  python scripts/urun-diorama.py --paket <site paketi> [--video <video klasörü>] [--videosuz] [--dry-run]
#             paket: urunler.csv (ayraç ';', utf-8-sig; sku, ad, aciklama_html, gorsel_1..6) ve <klasör>/1_kapak.jpg … 6_olcu.jpg
#             video: <klasör>_studyo_donus[_vNN]_onizleme_360p.mp4, en yüksek sürüm; --video verilmezse <paket>/../../video.
#             Video klasörü yoksa ya da bir ürünün videosu yoksa betik durur; videosuz devam yalnız açık --videosuz ile.
#         python scripts/urun-diorama.py --tara
#             core/urun-veri.js'teki diorama girdilerinde ve assets/urunler/diorama dosyalarının adında/baytlarında yerel
#             yol izi arar; sonucu JSON basar. Çıkış kodu: 0 temiz, 1 isabet var.
# Çıktı:  assets/urunler/diorama/<kimlik>/1.webp … 6.webp (en çok 1200 px, her biri ≤ 180 KB; kalite buna göre seçilir),
#         k1.webp … k6.webp (galeri küçük resmi, 240 px, ≤ 15 KB), kart.webp (600 px, kapaktan),
#         raf.webp (2026-11-04: odadaki raf için saydam ürün silueti; <paket>/../../urun/<klasör>/2_tam_karsi.jpg'den arka plan ayıklanır: GrabCut + aynı
#         stüdyodaki öteki çekimlerden arka plan levhası, raf_maskeleri(); kenar 1 px yumuşatılır, saydam olmayan kutuya
#         kırpılır; en uzun kenar 512 px, ≤ 60 KB; RNG sabit: aynı girdi aynı bayt; özetin raf_kesit'inde artık ölçümü),
#         donus.mp4 (ürüne yakın kırpılmış: örnek karelerde köşe renginden ayrışan piksellerin birleşik sınır kutusu + pay;
#         H.264 yuv420p, sessiz, üst verisiz, ≤ 1,5 MB) ve donus.webp (videonun ilk karesi, poster).
#         urun-veri.py'ye URUNLER girdileri (sözleşme: girdi()).
#         Yazım iki evreli: önce bütün ürünler, görseller (açılıp çözülür) ve videolar doğrulanır, bütün çıktılar bellekte
#         üretilir; hata varsa hiçbir dosyaya dokunulmadan durur. Sonra değişen dosyalar geçici klasöre yazılır ve yerine
#         taşınır (yaz()). urun-veri.py kendi çıktısını da aynı yazıma katar.
#         Kaynak yolu bilerek argümandır: depo herkese açık. Yerel yol, mağazanın planlı adresi (slug), fiyat, stok, SEO ve
#         etiket sütunları depoya girmez. TR ad ve açıklama paketteki gerçek ilandan, EN ad/açıklama ve kimlik DIORAMA
#         tablosundan; kutu ve malzeme paketten gelir.
#         Tekrar çalıştırmak güvenli: aynı girdi aynı baytları verir, değişmeyen dosya yeniden yazılmaz. --dry-run hiçbir
#         dosyaya dokunmaz (görselleri bellekte kodlayıp boyutları raporlar).
import argparse, csv, html, io, json, os, re, shutil, subprocess, sys, tempfile, unicodedata
import numpy as np
from PIL import Image, ImageChops, ImageFilter, ImageStat

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")  # sys.exit iletileri Türkçe
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEDEF = "assets/urunler/diorama"
VERI = os.path.join(KOK, "core", "urun-veri.js")
GALERI_PX, KART_PX, KUCUK_PX = 1200, 600, 240
GORSEL_KB, KUCUK_KB, AFIS_KB, VIDEO_KB = 180, 15, 40, 1536
RAF_PX, RAF_KB = 512, 60  # raf kesiti (saydam WebP)
RAF_KUTU = (0.12, 0.04, 0.76, 0.88)  # GrabCut ilk dikdörtgeni (görüntü oranı: x, y, en, boy); ürün tam karşıda, ortada
RAF_ESIK = 2.0  # raf kesitinde kenar artığı üst sınırı (%): aşan kesit yazılmaz
RAF_AYNI = 6  # levhadan farkı bunun altındaki piksel arka plandır (12 ürünün koyu zeminini de yiyordu); ölçüm eşiği 12 kalır
KALITE = range(88, 39, -4)  # WebP kalitesi: sınıra sığan ilk değer (88…56 aralığı eski çıktılarla aynı sırada denenir)
VIDEO_FPS_ORNEK, VIDEO_ESIK, VIDEO_PAY = 4, 28, 0.05  # kırpma: saniyede örnek kare, arka plan farkı eşiği, kenar payı

# SKU → kimlik, EN ad, EN açıklama. TR ad ve TR açıklama paketteki gerçek ilandan gelir (urunler.csv: ad sütunu " – 3B
# Baskı…" kuyruğu atılarak; aciklama_html'in ilk paragrafı düz metin). EN metin TR açıklamanın doğal çevirisidir, marka ve
# karakter adları aynen (2026-11-02 kullanıcı kararı: gerçek adlar, perde yok). Plaka sayısı paketteki "Parça sayısı" ile
# denetlenir. Yeni ürün pakete girerse buraya satır eklenir (yoksa betik durur).
DIORAMA = {
    "OKT-D-01": ("pokemon-karagoz-savasi", "Pokémon Karagöz Battle: Pika-göz and Haci-Squirtle",
                 "A Pokémon battle in front of the Karagöz screen: Pika-göz in a turban faces Haci-Squirtle, who wears Hacivat's hat atop a chest. "
                 "Up front sit the game's battle menu (\"Pika-göz ne yapacak?\", DAYAK / KESE / POKéMON / FİRAR) and both characters' status boxes, "
                 "framed by red velvet curtains with a tasselled fringe. The back wall shows a Karagöz screen with two houses and lamplight. "
                 "The stickers are applied by hand; 11 PLA plates are layered for depth."),
    "OKT-D-02": ("doom-1993-koridoru", "Doom (1993) Wooden Corridor: Cacodemon and Chaingunner",
                 "Doom's wooden corridor in first-person view: a shotgun, hands and muzzle flash up front, and the game's status bar (AMMO, HEALTH, ARMS, ARMOR) below. "
                 "A Chaingunner stands on the raised stone floor while a Cacodemon floats mid-corridor. "
                 "The back wall continues the corridor in perspective; two side walls and a rock ceiling box the scene in. "
                 "The stickers are applied by hand; 10 PLA plates are layered for depth."),
    "OKT-D-03": ("mortal-kombat-the-pit", "Mortal Kombat The Pit: Scorpion and Sub-Zero, the FINISH HIM Moment",
                 "The FINISH HIM moment on Mortal Kombat's The Pit bridge: the tip of Scorpion's spear rope is in Sub-Zero's chest. "
                 "Behind them are a purple sky, mountains, two statues and an arched wall, with the score and timer on top; the two health bars hang on separate plates in front of the wall, Sub-Zero's empty. "
                 "The red FINISH HIM sign stands on the wall with its black board. "
                 "The stickers are applied by hand; 7 PLA plates are layered for depth."),
    "OKT-D-08": ("super-mario-1-1", "Super Mario 1-1: Mario Jumping at the Block",
                 "A moment from Super Mario's level 1-1: Mario has jumped, his fist hitting a block in the brick row, and a mushroom has popped out on top. "
                 "A bush and a pipe stand on the ground among the floor blocks; the back wall shows the sky, with the score, coins, world and time bar on top. "
                 "The stickers are applied by hand; 5 PLA plates are layered for depth."),
    "OKT-D-13": ("duck-hunt", "Duck Hunt (1984): The Dog Holding Up the Duck",
                 "A moment from Duck Hunt: the dog rises from behind the grass, holding up the duck it has shot. "
                 "A tree on the left, a bush on the right and a strip of grass in front; the back wall is the plain NES sky. "
                 "At the very front sits the game's bottom panel: round, shots left, duck counter and score. "
                 "The stickers are applied by hand; 7 PLA plates are layered for depth."),
    "OKT-D-14": ("undertale-karanliklar-efendisi", "Undertale: The Lord of Darkness and the Cat on the Throne",
                 "An Undertale-style battle screen: against a black background with a green grid stands a horned, winged throne with a spiked crown, and a black-and-white cat sits on it. "
                 "The dialogue box reads \"Karanlıklar Efendisi sana yaklaşıyor\" (the Lord of Darkness approaches you), with LV 1 and HP 20 / 20 below. "
                 "The SAVAŞ, EYLEMLER, ÇANTA and MERHAMET buttons (fight, act, item, mercy) line up in front, with SAVAŞ selected. "
                 "The stickers are applied by hand; 6 PLA plates are layered for depth."),
    "OKT-D-A1": ("itachi-nin-tahti", "Naruto Shippuden: Itachi's Throne and Sasuke",
                 "The Uchiha hideout scene from Naruto Shippuden: Itachi sits by his stone throne with his sword stretched out in front, while Sasuke waits on the right, gripping his sword's hilt. "
                 "A cracked stone wall and the banner behind complete the scene's green-grey palette. "
                 "The stickers are applied by hand; 5 PLA plates are layered for depth."),
    "OKT-D-A3": ("iroh-un-agidi", "Avatar: Iroh's Lament (Leaves from the Vine)",
                 "Iroh's lament from Avatar: The Last Airbender: at sunset Iroh sits at the foot of a great tree, remembering his son Lu Ten. "
                 "The trunk stands out on its own plate, with an orange sky and drifting leaves behind. "
                 "A dark top and side frame closes the scene like a window. "
                 "The stickers are applied by hand; 9 PLA plates are layered for depth."),
    "OKT-D-A4": ("rock-lee-ve-gaara", "Naruto: Rock Lee, Gaara and the Sand Spikes",
                 "Rock Lee's fight with Gaara from Naruto, drawn like a manga panel: Lee lunges forward while Gaara stands behind with his gourd, and sand spikes rise at the very front. "
                 "Blue speed lines and a sound-effect word sit on the back plate. "
                 "Rock Lee's plate rests on a thin leg, so he seems to float. "
                 "The stickers are applied by hand; 5 PLA plates are layered for depth."),
    "OKT-D-A5": ("kara-sakal-ve-hasir-sapkalilar", "One Piece: Blackbeard, Luffy, Zoro and Nami",
                 "The Mock Town scene from One Piece: Blackbeard sits with a bottle in hand, shouting \"People's dreams never end!\", while Nami, Zoro and Luffy stand before him. "
                 "The words sit in manga balloons on a separate plate that juts out from the back wall, with a red sound-effect word and town houses behind. "
                 "The stickers are applied by hand; 7 PLA plates are layered for depth."),
}
# Eski kimlik (2026-11-02 ilk sürümün markasız kimlikleri) → bugünkü kimlik: ürün sayfası eski adresi doğru ürüne yönlendirir
ESKI_KIMLIK = {
    "karagoz-duellosu": "pokemon-karagoz-savasi", "ahsap-koridor": "doom-1993-koridoru", "kopruda-son-vurus": "mortal-kombat-the-pit",
    "bloga-ziplayan-tesisatci": "super-mario-1-1", "ordegi-kaldiran-kopek": "duck-hunt", "tahttaki-kedi": "undertale-karanliklar-efendisi",
    "tas-taht": "itachi-nin-tahti", "agac-dibinde-agit": "iroh-un-agidi", "kum-dikenleri": "rock-lee-ve-gaara",
    "korsan-kasabasi": "kara-sakal-ve-hasir-sapkalilar",
}

# Paketteki "Malzeme" ve "Kutu içeriği" maddelerinin EN karşılığı: kalıp ({n} = plaka sayısı) ya da birebir çeviri.
# Tanınmayan metin çıkarsa betik durur (çevirisi buraya eklenir).
KALIP_EN = [
    (r"1 adet kurulu diorama \((\d+) plaka\); ayrı parça yok\. Koruyucu dolguyla karton kutuda gönderilir\.",
     "1 assembled diorama ({0} plates); no loose parts. Shipped in a cardboard box with protective padding."),
    (r"PLA plakalar \(3B baskı\) \+ baskılı sticker\.", "PLA plates (3D printed) + printed stickers."),
]
CEVIRI_EN = {
    "1 adet kurulu diorama (10 plaka); ayrı parça yok, koridor tavanı yan duvarların tırnaklarına takılı gelir ve takılıp çıkarılabilir. Koruyucu dolguyla karton kutuda gönderilir.":
        "1 assembled diorama (10 plates); no loose parts: the corridor ceiling comes clipped onto the side walls' tabs and lifts off. Shipped in a cardboard box with protective padding.",
    "PLA plakalar (3B baskı) + baskılı sticker; sol yan duvar ve ağacın üst kapağı sticker'sız PLA.":
        "PLA plates (3D printed) + printed stickers; the left side wall and the tree's top cap are bare PLA.",
}

# Yerel yol izi (çıktıya girmemeli): genel desenler, kişiye ya da klasöre özgü ad yok. Metin sade() ile aranır.
YOL = [r"\b[a-z]:[\\/]", r"(^|[\\/])users[\\/]", r"/home/", r"drive'?i?m\b", r"\\\\[a-z0-9_.-]+\\"]
# Dosya baytlarında (EXIF/XMP/mp4 etiketi sızıntısı) aranan yerel yol izleri
BAYT = [r"users\\", r"users/", r"/home/", r"drive'"]


def sade(s):
    s = s.replace("İ", "I").replace("ı", "i").lower()
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def isabetler(metin, desenler=YOL):
    t = sade(metin)
    return [d for d in desenler if re.search(d, t)]


def _kisa(yol):
    return os.path.basename(os.path.normpath(yol)) or yol  # iletilerde tam yerel yol yok


# ---- paket ----
def _madde(html_metin, baslik):
    for li in re.findall(r"<li>(.*?)</li>", html_metin, re.S):
        duz = html.unescape(re.sub(r"<[^>]+>", "", li)).strip()
        if duz.startswith(baslik + ":"):
            return duz[len(baslik) + 1:].strip()
    return None


def _en(tr):
    if tr in CEVIRI_EN: return CEVIRI_EN[tr]
    for desen, en in KALIP_EN:
        m = re.fullmatch(desen, tr)
        if m: return en.format(*m.groups())
    sys.exit(f"EN karşılığı yok: {tr!r} (scripts/urun-diorama.py KALIP_EN / CEVIRI_EN'e ekle)")


def oku(paket):
    yol = os.path.join(paket, "urunler.csv")
    if not os.path.isfile(yol): sys.exit("urunler.csv bulunamadı (site paketinin klasörünü ver)")
    try:
        with open(yol, encoding="utf-8-sig", newline="") as f: satirlar = list(csv.DictReader(f, delimiter=";"))
    except (UnicodeDecodeError, csv.Error) as e:
        sys.exit(f"urunler.csv okunamadı ({type(e).__name__}: {e})")
    gerekli = {"sku", "ad", "aciklama_html", *(f"gorsel_{i}" for i in range(1, 7))}
    eksik_sutun = sorted(gerekli - set(satirlar[0].keys() if satirlar else gerekli))
    if eksik_sutun: sys.exit(f"urunler.csv'de sütun yok: {', '.join(eksik_sutun)}")
    if not satirlar: sys.exit("urunler.csv boş")
    bilinmeyen = [r["sku"] for r in satirlar if r["sku"] not in DIORAMA]
    if bilinmeyen: sys.exit(f"DIORAMA tablosunda olmayan SKU: {', '.join(bilinmeyen)} (kimlik, EN ad ve EN açıklama ekle)")
    eksik = sorted(set(DIORAMA) - {r["sku"] for r in satirlar})
    if eksik: print("uyarı: pakette olmayan SKU (atlandı):", ", ".join(eksik))
    return satirlar


def girdi(r, video):
    """Paketteki bir satır → URUNLER girdisi (alan adları sözleşmedir: /urunler/ ve ürün sayfası buna göre okur).
    video: (genişlik, yükseklik) ya da None."""
    kimlik, ad_en, ac_en = DIORAMA[r["sku"]]
    h = r["aciklama_html"]
    ad_tr = re.sub(r"\s+[–-]\s+3B\s+Bask[ıi].*$", "", (r["ad"] or "").strip())  # " – 3B Baskı Katmanlı Diorama" kuyruğu
    p1 = re.search(r"<p>(.*?)</p>", h, re.S)
    ac_tr = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", p1.group(1)))).strip() if p1 else ""
    if not ad_tr or not ac_tr: sys.exit(f"{r['sku']}: ilandaki ad ya da açıklamanın ilk paragrafı okunamadı")
    olcu = re.search(r"G × D × Y:\s*([\d,]+)\s*×\s*([\d,]+)\s*×\s*([\d,]+)\s*cm", _madde(h, "Ölçü") or "")
    parca = re.match(r"(\d+)\s+plaka", _madde(h, "Parça sayısı") or "")
    malzeme, kutu = _madde(h, "Malzeme"), _madde(h, "Kutu içeriği")
    if not (olcu and parca and malzeme and kutu): sys.exit(f"{r['sku']}: ölçü / parça / malzeme / kutu maddesi okunamadı")
    parca = int(parca.group(1))
    for metin, desen in ((ac_tr, r"(\d+) PLA plaka"), (ac_en, r"(\d+) PLA plates")):
        n = re.search(desen, metin)
        if not n or int(n.group(1)) != parca: sys.exit(f"{r['sku']}: açıklamadaki plaka sayısı paketle uyuşmuyor ({parca})")
    mm = lambda s: round(float(s.replace(",", ".")) * 10)
    yer = f"{HEDEF}/{kimlik}"
    return {"id": kimlik, "ad": {"tr": ad_tr, "en": ad_en}, "yuva": "raf", "grup": "diorama", "durum": "sayfa-yok",
            "magaza": None, "fiyat": None, "gorsel": f"{yer}/kart.webp", "galeri": [f"{yer}/{i}.webp" for i in range(1, 7)],
            "kucuk": [f"{yer}/k{i}.webp" for i in range(1, 7)], "raf": f"{yer}/raf.webp",
            "olcu": {"g": mm(olcu.group(1)), "d": mm(olcu.group(2)), "y": mm(olcu.group(3))}, "parca": parca,
            "malzeme": {"tr": malzeme, "en": _en(malzeme)}, "aciklama": {"tr": ac_tr, "en": ac_en},
            "kutu": {"tr": kutu, "en": _en(kutu)}, "video": f"{yer}/donus.mp4" if video else None,
            "video_boyut": {"g": video[0], "y": video[1]} if video else None,
            "video_kapak": f"{yer}/donus.webp" if video else None}


# ---- dosyalar ----
def _webp(kaynak, px, sinir_kb, ad):
    """Görsel (yol ya da PIL görüntüsü) → WebP baytı; en uzun kenar px, boyut sinir_kb'ı aşmayan en yüksek kalite."""
    im = (Image.open(kaynak) if isinstance(kaynak, str) else kaynak).convert("RGB")
    if max(im.size) > px:
        o = px / max(im.size)
        im = im.resize((round(im.width * o), round(im.height * o)), Image.LANCZOS)
    for q in KALITE:
        b = io.BytesIO()
        im.save(b, "WEBP", quality=q, method=6)  # üst veri (EXIF/ICC) yazılmaz
        if len(b.getvalue()) <= sinir_kb * 1024: return b.getvalue(), q
    sys.exit(f"{ad}: en düşük kalitede de {sinir_kb} KB'ı aşıyor")


def _grabcut(k):
    import cv2
    h, w = k.shape[:2]
    m = np.zeros((h, w), np.uint8)
    x, y, gw, gh = (round(v * d) for v, d in zip(RAF_KUTU, (w, h, w, h)))
    cv2.setRNGSeed(0)  # GrabCut'ın k-ortalaması: aynı girdi aynı maske
    cv2.grabCut(k, m, (x, y, gw, gh), np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_RECT)
    return _enbuyuk(((m == 1) | (m == 3)).astype(np.uint8))


def _enbuyuk(on):
    import cv2
    n, et, st, _ = cv2.connectedComponentsWithStats(on, 8)
    return (et == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8) if n > 1 else on


def _doldur(on):  # kapalı delikler (ürünün içinde arka plana benzeyen renk) ürüne katılır
    import cv2
    h, w = on.shape
    pad = np.zeros((h + 2, w + 2), np.uint8)
    pad[1:-1, 1:-1] = on * 255
    cv2.floodFill(pad, None, (0, 0), 128)
    return (pad[1:-1, 1:-1] != 128).astype(np.uint8)


def raf_maskeleri(yollar):
    """Tam karşı görseller → {yol: (RGB tam çözünürlük, alfa 0–255, ölçüm)}. Çekimler aynı stüdyoda aynı kamerayla
    alındığı için her ürünün arka plan levhası, aynı stüdyodaki DİĞER çekimlerin GrabCut'a göre arka plan olan
    piksellerinin ortancasıdır (sol üst köşeden kazanç uyumlu; aynı stüdyo: ortak arka plandaki fark ortancası en uyumlununkinin 1,5 katı (en az 3, en çok 8); levha gürültüsünün 3 katı > 15 ise
    levha kullanılmaz). Maske: GrabCut
    (yarım çözünürlük) → levhadan belirgin farklı yakın pikseller ürüne katılır (> 30), levhayla aynı olanlar atılır (< RAF_AYNI)
    → açma (5 px), en büyük parça, kapalı delik doldurma → büyütme, 1 px içe, 1,2 px yumuşatma.
    Ölçüm: artik_yuzde = saydam olmayan piksellerden 8 px kenar şeridinde levhayla aynı (< 12) olanların oranı (levhanın
    bilindiği yerde); grabcut_artik_yuzde: aynı ölçü yalnız GrabCut maskesinde (karşılaştırma için)."""
    import cv2
    S = 0.5
    tam = {y: np.asarray(Image.open(y).convert("RGB")) for y in yollar}
    yari = {y: cv2.resize(np.ascontiguousarray(v[:, :, ::-1]), None, fx=S, fy=S, interpolation=cv2.INTER_AREA) for y, v in tam.items()}
    gcm = {y: _grabcut(k) for y, k in yari.items()}
    F = {y: k.astype(np.float32) for y, k in yari.items()}
    kose = (slice(0, 60), slice(0, 120))
    sonuc = {}
    for y in yollar:
        # Aynı stüdyo: her aday çekimin bu çekimle ikisinin de arka plan olduğu piksellerdeki farkının ortancası
        # (gürültü); en uyumlu adayınkinin 1,5 katı (en az 3) içindekiler levhaya girer. Kazanç sol üst köşeden.
        aday = []
        for e in yollar:
            if e == y: continue
            a, b = F[y][kose].reshape(-1, 3), F[e][kose].reshape(-1, 3)
            kaz = a.mean(0) / np.maximum(b.mean(0), 1)
            ikisi = ~(gcm[y] | gcm[e]).astype(bool)
            aday.append((float(np.median(np.abs(F[y] - F[e] * kaz).max(-1)[ikisi])), e, kaz))
        enaz = min((g for g, _, _ in aday), default=99)
        yig = []
        for g, e, kaz in aday:
            if g > max(3, 1.5 * enaz) or g > 8: continue
            x = F[e] * kaz
            x[gcm[e].astype(bool)] = np.nan
            yig.append(x)
        on = _doldur(gcm[y])
        olcum = {"levha": bool(yig)}
        if yig:
            with np.errstate(all="ignore"):
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", RuntimeWarning)
                    L = np.nanmedian(np.stack(yig), axis=0)
            bil = ~np.isnan(L[..., 0])
            fark = np.nan_to_num(np.abs(F[y] - L).max(-1), nan=0)
            ilk = on.copy()
            yakin = cv2.dilate(on, np.ones((31, 31), np.uint8)).astype(bool)
            on[bil & (fark > 30) & yakin] = 1
            # Levhanın bu çekime göre gürültüsü (iki stüdyo çekimi arasında ışık farkı): eşik buna göre büyür
            gurultu = float(np.median(fark[bil & ~gcm[y].astype(bool)])) if (bil & ~gcm[y].astype(bool)).any() else 0
            esik = max(RAF_AYNI, 3 * gurultu)
            if esik > 15: bil = np.zeros_like(bil)  # levha bu çekime uymuyor: yalnız GrabCut + delik doldurma
            on[bil & (fark < esik)] = 0
            on = _doldur(_enbuyuk(cv2.morphologyEx(on, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))))

            def artik(m):
                # Kenar artığı: 8 px kenar şeridinde levhayla aynı (< 12) olan saydam olmayan piksel. Yalnız ayırt
                # edilebilen yerde sayılır: levhanın rengi oradaki ürünün yerel renginden (içten 9 px, σ 6) belirgin
                # farklıysa (> 25). Ürünün rengi arka plana çok yakınsa (koyu mor zemin, siyah panel) ölçülemez sayılır.
                kenar = (m - cv2.erode(m, np.ones((17, 17), np.uint8))).astype(bool)
                ic = cv2.erode(m, np.ones((19, 19), np.uint8)).astype(np.float32)
                yer = cv2.GaussianBlur(F[y] * ic[..., None], (0, 0), 6) / np.maximum(cv2.GaussianBlur(ic, (0, 0), 6), 1e-3)[..., None]
                ayirt = np.nan_to_num(np.abs(L - yer).max(-1), nan=0) > 25
                sec = bil & m.astype(bool)
                art = sec & kenar & (fark < 12)
                n = max(1, int(m.sum()))  # oran bütün ürün piksellerine göre (levhanın bilinmediği orta dahil)
                return round(float((art & ayirt).sum()) / n * 100, 2), round(float((art & ~ayirt).sum()) / n * 100, 2)
            (ga, _), (sa, belirsiz) = artik(ilk), artik(on)
            olcum.update(esik=round(esik, 1), kapsam_yuzde=round(float(bil.mean()) * 100, 1), grabcut_artik_yuzde=ga, artik_yuzde=sa,
                         olculemeyen_yuzde=belirsiz)
        rgb = tam[y]
        a = cv2.resize(on * 255, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_LINEAR)
        a = cv2.GaussianBlur(cv2.erode(a, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
        sonuc[y] = (rgb, a, olcum)
    return sonuc


def _raf_kesit(maske, ad):
    """(RGB, alfa, ölçüm) → (saydam WebP baytı, kalite). Saydam olmayan kutuya kırpılır (düzlem bu kutuyu g × y'ye yayar)."""
    rgb, a, _ = maske
    ys, xs = np.nonzero(a > 8)
    if not len(xs): sys.exit(f"{ad}: raf kesitinde ürün bulunamadı")
    im = Image.fromarray(np.dstack([rgb, a])[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")
    o = RAF_PX / max(im.size)
    if o < 1: im = im.resize((round(im.width * o), round(im.height * o)), Image.LANCZOS)
    for q in KALITE:
        b = io.BytesIO()
        im.save(b, "WEBP", quality=q, alpha_quality=90, method=6)
        if len(b.getvalue()) <= RAF_KB * 1024: return b.getvalue(), q
    sys.exit(f"{ad}: raf kesiti en düşük kalitede de {RAF_KB} KB'ı aşıyor")


def _ayni(yol, veri):
    tam = os.path.join(KOK, yol)
    if not os.path.isfile(tam): return None
    with open(tam, "rb") as f: return f.read() == veri


def yaz(bekleyen):
    """[(depo içi yol, bayt)] → yalnız değişenleri yazar: önce hepsi geçici klasöre (disk hatası burada çıkar, depoya
    dokunulmamış olur), sonra her dosya yerine taşınır. Döner: yazılan dosya sayısı."""
    degisen = [(y, v) for y, v in bekleyen if not _ayni(y, v)]
    if not degisen: return 0
    gecici = tempfile.mkdtemp(prefix="oktos-yazim-")
    try:
        hazir = []
        for i, (y, v) in enumerate(degisen):
            t = os.path.join(gecici, f"{i}.bin")
            with open(t, "wb") as f: f.write(v)
            hazir.append((t, os.path.join(KOK, y)))
        for t, hedef in hazir:
            os.makedirs(os.path.dirname(hedef), exist_ok=True)
            try: os.replace(t, hedef)
            except OSError:  # geçici klasör başka sürücüde: önce hedefin yanına kopyala, sonra yerine taşı
                shutil.copyfile(t, hedef + ".yeni"); os.replace(hedef + ".yeni", hedef)
    finally:
        shutil.rmtree(gecici, ignore_errors=True)
    return len(degisen)


def _video_bul(vdir, klasor):
    adaylar = []
    for f in os.listdir(vdir):
        m = re.fullmatch(re.escape(klasor) + r"_studyo_donus(?:_v(\d+))?_onizleme_360p\.mp4", f)
        if m: adaylar.append((int(m.group(1) or 1), f))
    return os.path.join(vdir, max(adaylar)[1]) if adaylar else None


def _calistir(arg, ne):
    s = subprocess.run(arg, capture_output=True)
    if s.returncode:
        son = (s.stderr.decode("utf-8", "replace").strip().splitlines() or ["?"])[-1]
        sys.exit(f"{ne}: {arg[0]} hata verdi ({s.returncode}): {son[:200]}")
    return s.stdout


def _kirpma(kaynak, ad):
    """Saniyede VIDEO_FPS_ORNEK kare: her karede dört köşenin renginden VIDEO_ESIK'ten çok ayrışan pikseller (medyan
    süzgeçli) → birleşik sınır kutusu + pay. Döner: (g, y, x, y0) çift sayılı, kare içinde."""
    bilgi = json.loads(_calistir(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                  "-of", "json", kaynak], ad))
    W, H = bilgi["streams"][0]["width"], bilgi["streams"][0]["height"]
    ham = _calistir(["ffmpeg", "-v", "error", "-i", kaynak, "-vf", f"fps={VIDEO_FPS_ORNEK}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], ad)
    n, kutu = len(ham) // (W * H * 3), None
    for i in range(n):
        im = Image.frombytes("RGB", (W, H), ham[i * W * H * 3:(i + 1) * W * H * 3])
        fark = None
        for b in ((0, 0, 8, 8), (W - 8, 0, W, 8), (0, H - 8, 8, H), (W - 8, H - 8, W, H)):  # köşeler arası degrade: en yakın köşe
            renk = tuple(round(x) for x in ImageStat.Stat(im.crop(b)).mean)
            f = ImageChops.difference(im, Image.new("RGB", im.size, renk)).convert("L")
            fark = f if fark is None else ImageChops.darker(fark, f)
        bb = fark.point(lambda v: 255 if v > VIDEO_ESIK else 0).filter(ImageFilter.MedianFilter(5)).getbbox()
        if bb: kutu = bb if kutu is None else (min(kutu[0], bb[0]), min(kutu[1], bb[1]), max(kutu[2], bb[2]), max(kutu[3], bb[3]))
    if not kutu: sys.exit(f"{ad}: videoda ürün bulunamadı (arka plandan ayrışan piksel yok)")
    pay = max(8, round(VIDEO_PAY * max(kutu[2] - kutu[0], kutu[3] - kutu[1])))
    x0, y0, x1, y1 = max(0, kutu[0] - pay), max(0, kutu[1] - pay), min(W, kutu[2] + pay), min(H, kutu[3] + pay)
    g, y = (x1 - x0) // 2 * 2, (y1 - y0) // 2 * 2  # yuv420p: çift boyut
    return g, y, x0 + ((x1 - x0) - g) // 2, y0 + ((y1 - y0) - y) // 2


def _video(kaynak, ad):
    """Dönüş videosu → (mp4 baytı, (g, y), poster webp baytı). Ürüne yakın kırpılır, H.264 yuv420p, sessiz; SEI (kodlayıcı
    imzası) ve kapsayıcı üst verisi atılır. Tek iş parçacığı: aynı girdi aynı baytları verir."""
    g, y, x, y0 = _kirpma(kaynak, ad)
    with tempfile.TemporaryDirectory() as d:
        cikti = os.path.join(d, "v.mp4")
        _calistir(["ffmpeg", "-v", "error", "-y", "-i", kaynak, "-map", "0:v:0", "-vf", f"crop={g}:{y}:{x}:{y0}",
                   "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-threads", "1",
                   "-bsf:v", "filter_units=remove_types=6", "-an", "-map_metadata", "-1", "-map_chapters", "-1",
                   "-fflags", "+bitexact", "-flags:v", "+bitexact", "-movflags", "+faststart", cikti], ad)
        with open(cikti, "rb") as f: veri = f.read()
        png = _calistir(["ffmpeg", "-v", "error", "-i", cikti, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], ad)
    if len(veri) > VIDEO_KB * 1024: sys.exit(f"{ad}: kırpılmış video {len(veri) // 1024} KB, sınır {VIDEO_KB} KB")
    afis, _ = _webp(Image.open(io.BytesIO(png)), max(g, y), AFIS_KB, ad + " posteri")
    return veri, (g, y), afis


def dogrula(paket, video_dir=None, videosuz=False):
    """Hiçbir dosyaya dokunmadan girdiyi denetler: paket satırları, her görselin varlığı ve çözülebilirliği, videolar.
    Döner: [(satır, 6 görsel yolu, video yolu ya da None)]. Sorun varsa tek satırlık iletiyle durur."""
    paket = os.path.abspath(paket)
    satirlar = oku(paket)
    if video_dir is None: video_dir = os.path.join(paket, os.pardir, os.pardir, "video")
    video_var = os.path.isdir(video_dir)
    if not video_var and not videosuz:
        sys.exit(f"video klasörü yok ({_kisa(video_dir)}; klasörü ver, videosuz devam etmek için --videosuz)")
    if video_var and not videosuz and not shutil.which("ffmpeg"):
        sys.exit("ffmpeg bulunamadı (videoyu kırpmak için gerekli; videosuz devam etmek için --videosuz)")
    plan, hata, videosuzlar = [], [], []
    for r in satirlar:
        kaynaklar = []
        for i in range(1, 7):
            ad = (r.get(f"gorsel_{i}") or "").strip()
            k = os.path.join(paket, *ad.split("/")) if ad else ""
            if not ad: hata.append(f"{r['sku']}: gorsel_{i} boş")
            elif not os.path.isfile(k): hata.append(f"{r['sku']}: görsel eksik ({os.path.basename(k)})")
            else:
                try:
                    with Image.open(k) as im: im.load()
                except Exception as e:  # kesik/bozuk dosya: Pillow OSError, UnidentifiedImageError, SyntaxError…
                    hata.append(f"{r['sku']}: görsel okunamadı ({os.path.basename(k)}: {e})")
            kaynaklar.append(k)
        klasor = (r.get("gorsel_1") or "").split("/")[0]
        vk = _video_bul(video_dir, klasor) if video_var and klasor else None
        if vk is None: videosuzlar.append(r["sku"])
        plan.append((r, kaynaklar, vk))
    if hata: sys.exit("; ".join(hata[:3]) + (f" (+{len(hata) - 3} sorun daha)" if len(hata) > 3 else ""))
    if videosuzlar and not videosuz:
        sys.exit(f"dönüş videosu yok: {', '.join(videosuzlar)} (videosuz devam etmek için --videosuz)")
    return plan, videosuzlar


def hazirla(paket, video_dir=None, kuru=False, videosuz=False):
    """Paket → (girdiler [SKU sırasıyla], özet, bekleyen [(yol, bayt)]). Hiçbir dosya yazmaz: önce dogrula(), sonra bütün
    çıktılar bellekte üretilir; yazmak için yaz(bekleyen). kuru yalnız özetin dilini belirler."""
    plan, videosuzlar = dogrula(paket, video_dir, videosuz)
    girdiler, dosyalar, bekleyen = [], [], []
    raf_olcum = {}
    # Raf kesitinin kaynağı Marangoz'un ürün klasöründeki tam karşı çekim (<paket>/../../urun/<klasör>/2_tam_karsi.jpg,
    # 1600 × 1200, hepsi aynı kadraj; paketteki kopyalar kare kırpılmış ve boyları farklı, levha için uygun değil)
    urun_dir = os.path.join(os.path.abspath(paket), os.pardir, os.pardir, "urun")
    rafk = {k[1]: os.path.join(urun_dir, os.path.basename(os.path.dirname(k[1])), "2_tam_karsi.jpg") for _, k, _ in plan}
    yok = [os.path.basename(os.path.dirname(v)) for v in rafk.values() if not os.path.isfile(v)]
    if yok: sys.exit(f"raf kesiti için tam karşı çekim yok (urun/<klasör>/2_tam_karsi.jpg): {len(yok)} ürün")
    rafm = raf_maskeleri(list(rafk.values()))  # raf kesitleri birlikte: arka plan levhası öteki çekimlerden
    for r, kaynaklar, vk in plan:
        ad = DIORAMA[r["sku"]][0]
        v = _video(vk, ad) if vk and not (videosuz and not shutil.which("ffmpeg")) else None
        g = girdi(r, v[1] if v else None)
        alanlar = [g["id"], *g["ad"].values(), *g["aciklama"].values(), *g["kutu"].values(), *g["malzeme"].values()]
        bulunan = sorted({d for a in alanlar for d in isabetler(a)})  # yerel yol sızıntısı: hiçbir şey yazılmadan önce
        if bulunan: sys.exit(f"{g['id']}: görünen metinde yerel yol izi: {bulunan}")
        uretim = [*((y, _webp(k, GALERI_PX, GORSEL_KB, os.path.basename(k))) for y, k in zip(g["galeri"], kaynaklar)),
                  *((y, _webp(k, KUCUK_PX, KUCUK_KB, os.path.basename(k))) for y, k in zip(g["kucuk"], kaynaklar)),
                  (g["gorsel"], _webp(kaynaklar[0], KART_PX, GORSEL_KB, os.path.basename(kaynaklar[0]))),
                  (g["raf"], _raf_kesit(rafm[rafk[kaynaklar[1]]], ad))]
        if v: uretim += [(g["video"], (v[0], None)), (g["video_kapak"], (v[2], None))]
        for yol, (veri, q) in uretim:
            ayni = _ayni(yol, veri)
            dosyalar.append({"yol": yol, "kb": round(len(veri) / 1024, 1), "q": q,
                             "durum": "aynı" if ayni else "değişti" if ayni is False else "yeni"})
            bekleyen.append((yol, veri))
        girdiler.append(g)
        raf_olcum[g["id"]] = rafm[rafk[kaynaklar[1]]][2]
    asan = {i: o["artik_yuzde"] for i, o in raf_olcum.items() if o.get("artik_yuzde", 0) > RAF_ESIK}
    if asan: sys.exit(f"raf kesitinde arka plan artığı %{RAF_ESIK}'yi aşıyor: {asan}")
    ids = {g["id"] for g in girdiler}
    if len(ids) != len(girdiler): sys.exit("DIORAMA tablosunda tekrarlanan kimlik")
    kok = os.path.join(KOK, HEDEF)
    sahipsiz = sorted(set(os.listdir(kok)) - ids) if os.path.isdir(kok) else []
    beklenen = {y for y, _ in bekleyen}
    sahipsiz_dosya = sorted(f"{i}/{f}" for i in ids if os.path.isdir(os.path.join(kok, i))
                            for f in os.listdir(os.path.join(kok, i)) if f"{HEDEF}/{i}/{f}" not in beklenen)
    kb = lambda s: [d["kb"] for d in dosyalar if re.search(s, d["yol"])]
    ozet = {"diorama": len(girdiler), "dosya": len(dosyalar), "video": sum(1 for g in girdiler if g["video"]),
            "videosuz": videosuzlar if videosuz else [],
            "durum": {s: sum(1 for d in dosyalar if d["durum"] == s) for s in ("yeni", "değişti", "aynı")},
            "galeri_kb_enbuyuk": max(kb(r"/\d\.webp$"), default=0), "kucuk_kb_enbuyuk": max(kb(r"/k\d\.webp$"), default=0),
            "video_kb_enbuyuk": max(kb(r"\.mp4$"), default=0), "raf_kb_enbuyuk": max(kb(r"/raf\.webp$"), default=0),
            "video_boyut": sorted({f"{g['video_boyut']['g']}×{g['video_boyut']['y']}" for g in girdiler if g["video_boyut"]}),
            "kalite": sorted({d["q"] for d in dosyalar if d["q"]}),
            "toplam_mb": round(sum(d["kb"] for d in dosyalar) / 1024, 2), "sahipsiz_klasor": sahipsiz,
            "sahipsiz_dosya": sahipsiz_dosya,
            "raf_artik_enbuyuk_yuzde": max((o.get("artik_yuzde", 0) for o in raf_olcum.values()), default=0),
            "raf_kesit": raf_olcum}
    return girdiler, ozet, bekleyen


# ---- tarama ----
def _js_dizi(metin, ad):
    m = re.search(r"export const " + ad + r" = (\[.*?\n\]);", metin, re.S)
    return json.loads(m.group(1)) if m else []


def _dizgeler(x, yol=""):
    if isinstance(x, str): yield yol, x
    elif isinstance(x, dict):
        for k, v in x.items(): yield from _dizgeler(v, f"{yol}.{k}" if yol else k)
    elif isinstance(x, list):
        for i, v in enumerate(x): yield from _dizgeler(v, f"{yol}[{i}]")


def tara():
    metin = open(VERI, encoding="utf-8").read()
    urunler = _js_dizi(metin, "URUNLER")
    dio = [u for u in urunler if u.get("grup") == "diorama"]
    isabet, alan = [], 0
    for u in dio:  # diorama girdisinin bütün alanları (kimlik, ad, açıklama, kutu, malzeme, yollar)
        for y, s in _dizgeler(u):
            alan += 1
            for d in isabetler(s): isabet.append({"kaynak": "diorama", "id": u["id"], "alan": y, "desen": d})
    dosya = 0
    kok = os.path.join(KOK, HEDEF)
    for d, _, fs in os.walk(kok):
        for f in fs:
            tam = os.path.join(d, f)
            ad = os.path.relpath(tam, KOK).replace(os.sep, "/")
            dosya += 1
            isabet += [{"kaynak": "dosya-adi", "id": ad, "alan": "ad", "desen": x} for x in isabetler(ad)]
            with open(tam, "rb") as fh: bayt = fh.read().decode("latin-1").lower()  # üst veri sızıntısı (EXIF/XMP/mp4 etiketi)
            for x in BAYT:
                if x in bayt: isabet.append({"kaynak": "dosya-bayt", "id": ad, "alan": "bayt", "desen": x})
    sonuc = {"tarih": re.search(r'URUN_VERI_TARIHI = "([^"]*)"', metin).group(1) if "URUN_VERI_TARIHI" in metin else None,
             "desen_sayisi": {"yol": len(YOL), "bayt": len(BAYT)},
             "taranan": {"diorama_girdi": len(dio), "diorama_alan": alan, "dosya": dosya},
             "isabet_sayisi": len(isabet), "isabet": isabet}
    print(json.dumps(sonuc, ensure_ascii=False, indent=2))
    return 1 if isabet else 0


def main():
    ap = argparse.ArgumentParser(description="Diorama plakaları: site paketinden görseller + girdiler (ilandaki gerçek ad); yerel yol taraması")
    ap.add_argument("--paket", help="site paketi klasörü (urunler.csv; depo dışında)")
    ap.add_argument("--video", help="dönüş videolarının klasörü (varsayılan <paket>/../../video)")
    ap.add_argument("--videosuz", action="store_true", help="video klasörü ya da bir ürünün videosu yoksa durma, videosuz devam et")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tara", action="store_true", help="core/urun-veri.js ve assets/urunler/diorama'da yerel yol taraması (JSON)")
    a = ap.parse_args()
    if a.tara: sys.exit(tara())
    if not a.paket: ap.error("--paket ya da --tara gerekli")
    girdiler, ozet, bekleyen = hazirla(a.paket, a.video, a.dry_run, a.videosuz)
    print(json.dumps(ozet, ensure_ascii=False))
    for g in girdiler:
        print(f"  {g['id']}: {g['ad']['tr']} · {g['olcu']['g']}×{g['olcu']['d']}×{g['olcu']['y']} mm · {g['parca']} plaka · video {'var' if g['video'] else 'yok'}")
    if a.dry_run: print("(dry-run: dosyaya dokunulmadı)"); return
    print("yazılan dosya:", yaz(bekleyen), "(yalnız görseller/video; core/urun-veri.js'i urun-veri.py yazar)")


if __name__ == "__main__":
    try:
        main()
    except OSError as e:  # disk/izin hatası: ham döküm yerine tek satır
        sys.exit(f"dosya hatası: {type(e).__name__}: {e.strerror or e}")
