"""Amaç: 8 aracın sipariş akışını uçtan uca sınar (müşteri STL indirmez; "Sipariş ver" WhatsApp'a hazır mesaj açar).
Her araç × her şablon için tools/<id>/index.html?sablon=<id> açılır ve şu adımlar denetlenir:
  ac        sayfa açıldı, model kuruldu (window.__oktosReady)
  sablon    istenen şablon seçili (ızgarada .on) ve doğru modda
  hazir     "Hazır" → "Sipariş ver" görünür, tahmini fiyat (₺) yazılı
  fiyat     paneldeki fiyat = kuralla hesaplanan = mesajdaki "Tahmini fiyat" satırı. Kural core/tool-shell.js priceOf'tan,
            birim fiyat ve alt sınır core/order-config.js'ten okunur: max(minPrice, ceil(gram × pricePerGram)); gram paneldeki ağırlık
  olcu      mesajdaki "Boyut" satırı paneldeki ölçüyle birebir aynı
  gizli     Wi-Fi şablonlarında sahte şifre girilir: şifre mesajda (bağlantı dahil) 0 kez, "ayrıca iletilecek" notu var, önizleme şifreli
  cift      "Sipariş ver"e hızlı çift tık tek pencere açar
  siparis   "Sipariş ver" → wa.me/<core/order-config.js numarası>?text=… adresi oluştu (window.open yakalanır, AÇILMAZ)
  mesaj     mesajda araç adı, şablon adı (Özel değil), ölçü (… × … × … mm), renk adları (ham #kod değil), paneldeki yazılı metinler ve tasarım bağlantısı var
  baglanti  mesajdaki tasarım bağlantısı açılınca aynı tasarım gelir (aynı ölçü, aynı şablon)
  tasma     sayfa yatayda taşmıyor (1440 px; her aracın ilk şablonunda ayrıca 390 px)
  konsol    konsol hatası ve sayfa hatası 0
Kip (--kip): "whatsapp" (varsayılan; core/order-config.js'te paketlerYayinda: false olmalı) ya da "paket"
  (order-config.js tarayıcıya giderken paketlerYayinda: true yapılır, dosyaya dokunulmaz). Paket kipinde paket sınıflı
  şablonda ikas paket akışı denetlenir; parçalı/özel sipariş şablonları yine yukarıdaki WhatsApp adımlarından geçer:
  hazir     "Sipariş ver" görünür, panelde "Tasarım paketi: <ad>" yazılı, düğme WhatsApp demiyor
  siparis   açılan adres = order-config.js paketler[<sınıf>] (sınıf core/paket-sinif.js'ten; --katalog verilirse
            depo dışı katalog.json'daki paketle de karşılaştırılır), yalnız https://oktosworkshop.com
  pano      panoya yazılan metin tasarım bağlantısını içerir, "sipariş notuna yapıştır" bildirimi çıktı
  gizli     Wi-Fi şifresi pano metninde 0 kez, "ayrıca iletilecek" notu var
  baglanti  panodaki bağlantı aynı tasarımı açar
Girdi: çalışan yerel sunucu (scripts/serve.py), --port (varsayılan 8082), --arac (virgüllü süzgeç), --paralel,
--kip, --katalog.
Çıktı: JSON [{arac, sablon, adim, sonuc: "gecti"|"kaldi", hata}] + özet; --cikti yolu (varsayılan .impeccable/siparis-akis.json).
Görünmez Edge (Playwright channel=msedge) her çalıştırmada kendi geçici profilini açar; hiçbir şey yazmaz/silmez,
tekrar çalıştırmak güvenlidir. Çıkış kodu: kalan adım varsa 1.
"""
import argparse
import asyncio
import json
import math
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs

from playwright.async_api import async_playwright

KOK = Path(__file__).resolve().parent.parent
ARACLAR = ["bin", "vase", "clicker", "text", "flip", "qr", "painter", "puzzle"]


def fiyat_kurali():
    """order-config.js'ten birim fiyat ve alt sınır; tool-shell.js priceOf kuralı beklenen biçimde değilse durur."""
    cfg = (KOK / "core" / "order-config.js").read_text(encoding="utf-8")
    kabuk = (KOK / "core" / "tool-shell.js").read_text(encoding="utf-8")
    birim = float(re.search(r"pricePerGram:\s*([\d.]+)", cfg).group(1))
    alt = float(re.search(r"minPrice:\s*([\d.]+)", cfg).group(1))
    kural = re.search(r"function priceOf\(grams\)\s*\{(.*?)\n  \}", kabuk, re.S)
    if not kural or "Math.max(ORDER.minPrice || 0, Math.ceil(grams * ORDER.pricePerGram))" not in kural.group(1):
        raise SystemExit("priceOf kuralı değişmiş: betikteki beklenen fiyat hesabını güncelle (core/tool-shell.js)")
    return lambda gram: int(max(alt, math.ceil(gram * birim)))


def sayi(metin):
    """'1.234 ₺' / '400 ₺' → 1234 / 400 (tr ve en binlik ayıracı)."""
    m = re.search(r"(\d[\d.,]*)\s*₺", metin or "")
    return int(re.sub(r"[.,]", "", m.group(1))) if m else None


SAHTE_SIFRE = "Gizli-Test-4821"


def wa_numarasi():
    m = re.search(r"whatsapp:\s*'(\d+)'", (KOK / "core" / "order-config.js").read_text(encoding="utf-8"))
    return m.group(1) if m else ""


ACILIS = """
window.__acilan = [];
window.open = (u) => { window.__acilan.push(String(u)); return null; };
window.__pano = [];
try { Object.defineProperty(navigator, 'clipboard', { configurable: true,
  value: { writeText: async (s) => { window.__pano.push(String(s)); } } }); } catch (e) {}
"""
PAKET_AD = {"bronz": "Bronz", "gumus": "Gümüş", "altin": "Altın", "platin": "Platin"}
KATALOG_ASCII = {"bronz": "bronz", "gümüş": "gumus", "altın": "altin", "platin": "platin", "özel sipariş": "ozel"}


def paket_tablosu(katalog=""):
    """core/paket-sinif.js (şablon → sınıf) + order-config.js (sınıf → adres); katalog verilirse sınıflar karşılaştırılır."""
    js = (KOK / "core" / "paket-sinif.js").read_text(encoding="utf-8")
    sinif = json.loads(js[js.index("{"):js.rindex("}") + 1])["sablon"]
    cfg = (KOK / "core" / "order-config.js").read_text(encoding="utf-8")
    adres = dict(re.findall(r"(\w+):\s*'(https://[^']+)'", cfg.split("paketler:", 1)[1]))
    fark = []
    if katalog:
        for r in json.loads(Path(katalog).read_text(encoding="utf-8"))["sablonlar"]:
            if sinif.get(r["arac"], {}).get(r["sablon"]) != KATALOG_ASCII[r["paket"]]:
                fark.append(f"{r['arac']}/{r['sablon']}: katalog={r['paket']} depo={sinif.get(r['arac'], {}).get(r['sablon'])}")
    return sinif, adres, fark


def bayrak(acik):
    """order-config.js tarayıcıya giderken paketlerYayinda istenen değere çekilir (dosyaya dokunulmaz)."""
    async def yonlendir(route):
        r = await route.fetch()
        govde = re.sub(r"paketlerYayinda:\s*(true|false)", f"paketlerYayinda: {'true' if acik else 'false'}", await r.text())
        await route.fulfill(response=r, body=govde)
    return yonlendir


async def sablonlari_al(ctx, taban, arac):
    pg = await ctx.new_page()
    try:
        await pg.goto(f"{taban}/tools/{arac}/index.html", wait_until="load")
        await pg.wait_for_function("window.__oktosReady === true", timeout=60000)
        return await pg.evaluate("""async () => { const m = await import('./app.js');
            return m.TOOL.presets.map(p => ({ id: p.id, mode: p.mode || '' })); }""")
    finally:
        await pg.close()


async def paket_akisi(pg, ctx, ekle, h, arac, sablon, paket, wifi, genislik, hatalar):
    """Paket kipi, paket sınıflı şablon: mağaza sayfası açılır, tasarım bağlantısı panoya yazılır."""
    sinif, beklenen_adres = paket
    ad = PAKET_AD.get(sinif, "?")
    ok = h["order"] and f"Tasarım paketi: {ad}" in h["meta"] and "WhatsApp" not in h["etiket"] and "₺" not in h["meta"]
    ekle("hazir", ok, "" if ok else f"sipariş_görünür={h['order']} meta='{h['meta']}' etiket='{h['etiket']}' beklenen={ad}")
    await pg.dblclick("#order")
    await pg.wait_for_timeout(300)
    acilan = await pg.evaluate("window.__acilan")
    ekle("cift", len(acilan) == 1, "" if len(acilan) == 1 else f"çift tıkta {len(acilan)} pencere")
    url = acilan[-1] if acilan else ""
    u = urlparse(url)
    ok = url == beklenen_adres and u.scheme == "https" and u.netloc == "oktosworkshop.com"
    ekle("siparis", ok, "" if ok else f"adres='{url[:120]}' beklenen='{beklenen_adres}' ({sinif})")
    if genislik > 600:
        ekle("_acilan", True, sinif)
    pano = await pg.evaluate("window.__pano")
    bildirim = await pg.evaluate("() => document.querySelector('.toast')?.textContent || ''")
    metin = pano[-1] if pano else ""
    bm = re.search(r"(?:Tasarım|Design)\s*:\s*(\S+)", metin)
    ok = len(pano) == 1 and bm is not None and f"/tools/{arac}/" in bm.group(1) and "sipariş notuna yapıştır" in bildirim
    ekle("pano", ok, "" if ok else f"pano={len(pano)} metin='{metin[:160]}' bildirim='{bildirim}'")
    if wifi:
        n = metin.count(SAHTE_SIFRE) + metin.count("sifre=")
        notu = re.search(r"Wi-Fi (şifresi ayrıca|password will be sent separately)", metin) is not None
        ok = n == 0 and notu
        ekle("gizli", ok, "" if ok else f"şifre isabeti={n} not={notu} pano='{metin[:200]}'")
    boyut = await pg.evaluate("() => document.querySelector('#hud b')?.textContent || ''")
    if bm and genislik > 600:
        pg2 = await ctx.new_page()
        pg2.on("console", lambda m: hatalar.append("baglanti: " + m.text) if m.type == "error" else None)
        try:
            await pg2.goto(bm.group(1), wait_until="load")
            await pg2.wait_for_function("window.__oktosReady === true && !document.getElementById('busy').classList.contains('on')", timeout=60000)
            d2 = await pg2.evaluate("""() => ({ boyut: document.querySelector('#hud b')?.textContent || '',
                on: [...document.querySelectorAll('#presets .preset.on')].map(b => b.dataset.id) })""")
            ok = d2["boyut"] == boyut and d2["on"] == [sablon["id"]]
            ekle("baglanti", ok, "" if ok else f"önce {boyut} [{sablon['id']}] → bağlantı {d2['boyut']} {d2['on']}")
        except Exception as e:
            ekle("baglanti", False, str(e).splitlines()[0])
        finally:
            await pg2.close()
    t = await pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    ekle("tasma", t <= 0, "" if t <= 0 else f"{t} px taşma")


async def sina(ctx, taban, arac, sablon, numara, genislik, fiyat, kip="whatsapp", tablo=None, adresler=None):
    sonuc = []
    ekle = lambda adim, ok, hata="": sonuc.append({"arac": arac, "sablon": sablon["id"], "genislik": genislik,
                                                   "adim": adim, "sonuc": "gecti" if ok else "kaldi", "hata": hata})
    hatalar = []
    pg = await ctx.new_page()
    await pg.set_viewport_size({"width": genislik, "height": 900 if genislik > 600 else 844})
    pg.on("console", lambda m: hatalar.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: hatalar.append("pageerror: " + str(e)))
    await pg.add_init_script(ACILIS)
    await pg.route("**/core/order-config.js", bayrak(kip == "paket"))
    sinif = (tablo or {}).get(arac, {}).get(sablon["id"]) if kip == "paket" else None
    paket = (sinif, (adresler or {}).get(sinif, "")) if sinif and sinif != "ozel" else None
    try:
        try:
            await pg.goto(f"{taban}/tools/{arac}/index.html?sablon={sablon['id']}", wait_until="load")
            await pg.wait_for_function("window.__oktosReady === true", timeout=60000)
            await pg.wait_for_function("!document.getElementById('busy').classList.contains('on') && !document.getElementById('hazir').disabled", timeout=30000)
            ekle("ac", True)
        except Exception as e:
            ekle("ac", False, str(e).splitlines()[0])
            return sonuc
        durum = await pg.evaluate("""() => ({
            on: [...document.querySelectorAll('#presets .preset.on')].map(b => b.dataset.id),
            mode: window.oktos?.state?.mode || '',
            label: document.querySelector('#presets .preset.on .pl')?.textContent?.trim() || '',
            title: document.querySelector('h1.tool-title')?.textContent?.trim() || '',
            metinler: [...document.querySelectorAll('#panel input[type=text]')].filter(i => i.offsetParent && i.value.trim() && !/^(Şifre|Password)/.test(i.closest('label')?.textContent?.trim() || '')).map(i => i.value.trim()),
            err: !document.getElementById('err').hidden })""")
        ok = durum["on"] == [sablon["id"]] and (not sablon["mode"] or durum["mode"] == sablon["mode"]) and not durum["err"]
        ekle("sablon", ok, "" if ok else f"seçili={durum['on']} mod={durum['mode']} hata_kutusu={durum['err']}")

        # Wi-Fi: sahte şifre yazılır; önizleme şifreyle çalışır, mesaj ve bağlantı şifresiz olmalı
        wifi = await pg.evaluate("() => window.oktos?.state?.icerik === 'wifi' && window.oktos.state.guvenlik !== 'nopass'")
        if wifi:
            await pg.locator("#panel .ctl-text:visible", has_text=re.compile(r"Şifre|Password")).locator("input").fill(SAHTE_SIFRE)
            await pg.wait_for_function(f"window.oktos.state.sifre === '{SAHTE_SIFRE}'", timeout=5000)
            await pg.wait_for_function("!document.getElementById('busy').classList.contains('on') && !document.getElementById('hazir').hidden && !document.getElementById('hazir').disabled", timeout=30000)

        await pg.click("#hazir")
        await pg.wait_for_timeout(150)
        h = await pg.evaluate("""() => ({ order: !document.getElementById('order').hidden && !document.getElementById('order').disabled,
            meta: document.getElementById('order-meta').hidden ? '' : document.getElementById('order-meta').textContent,
            etiket: document.getElementById('order').textContent.trim() })""")
        if paket:
            await paket_akisi(pg, ctx, ekle, h, arac, sablon, paket, wifi, genislik, hatalar)
            return sonuc
        ok = h["order"] and "₺" in h["meta"] and re.search(r"\d", h["meta"]) is not None
        ekle("hazir", ok, "" if ok else f"sipariş_görünür={h['order']} fiyat='{h['meta']}'")
        panel = await pg.evaluate("() => [...document.querySelectorAll('#hud span')].map(s => s.textContent.trim())")
        gm = next((m for m in (re.search(r"(\d+)\s*g$", x) for x in panel) if m), None)
        beklenen = fiyat(int(gm.group(1))) if gm else None

        await pg.dblclick("#order")
        await pg.wait_for_timeout(300)
        acilan = await pg.evaluate("window.__acilan")
        ekle("cift", len(acilan) == 1, "" if len(acilan) == 1 else f"çift tıkta {len(acilan)} pencere")
        url = acilan[-1] if acilan else ""
        u = urlparse(url)
        ok = u.scheme == "https" and u.netloc == "wa.me" and u.path == f"/{numara}" and "text" in parse_qs(u.query)
        ekle("siparis", ok, "" if ok else f"adres='{url[:120]}'")
        if genislik > 600:
            ekle("_acilan", True, "whatsapp")
        mesaj = parse_qs(u.query).get("text", [""])[0]
        eksik = []
        if not durum["title"] or durum["title"] not in mesaj: eksik.append(f"araç adı ({durum['title']})")
        if not durum["label"] or f": {durum['label']}" not in mesaj: eksik.append(f"şablon ({durum['label'] or 'seçili yok'})")
        if not re.search(r"\d[\d.,]* × \d[\d.,]* × \d[\d.,]* mm", mesaj): eksik.append("ölçü")
        if not re.search(r"(renk|rengi|colour|filament)", mesaj, re.I): eksik.append("renk")
        ham = re.findall(r"^[^:\n]+:\s*#[0-9a-fA-F]{3,8}\s*$", mesaj, re.M)
        if ham: eksik.append(f"renk adı yerine ham kod ({'; '.join(ham)})")
        for metin in durum["metinler"]:
            if metin not in mesaj: eksik.append(f"yazılan metin ({metin})")
        if f"/tools/{arac}/" not in mesaj: eksik.append("tasarım bağlantısı")
        ekle("mesaj", not eksik, ("eksik: " + ", ".join(eksik) + " | mesaj: " + mesaj.replace("\n", " / ")[:300]) if eksik else "")

        boyut = await pg.evaluate("() => document.querySelector('#hud b')?.textContent || ''")
        # fiyat: panel = kural = mesaj
        fs = re.search(r"^(?:Tahmini fiyat|Estimated price):\s*(.+)$", mesaj, re.M)
        p_panel, p_mesaj = sayi(h["meta"]), (sayi(fs.group(1)) if fs else None)
        ok = beklenen is not None and p_panel == beklenen and p_mesaj == beklenen
        ekle("fiyat", ok, "" if ok else f"ağırlık={gm.group(1) if gm else '?'} g beklenen={beklenen} panel={p_panel} mesaj={p_mesaj}")
        # ölçü: mesajdaki Boyut satırı = paneldeki
        om = re.search(r"^(?:Boyut|Size):\s*(.+)$", mesaj, re.M)
        ok = bool(boyut) and om is not None and om.group(1).strip() == boyut.strip()
        ekle("olcu", ok, "" if ok else f"panel='{boyut}' mesaj='{om.group(1) if om else ''}'")
        if wifi:
            n = mesaj.count(SAHTE_SIFRE) + mesaj.count("sifre=")
            notu = re.search(r"Wi-Fi (şifresi ayrıca|password will be sent separately)", mesaj) is not None
            onizleme = await pg.evaluate(f"window.oktos.state.sifre === '{SAHTE_SIFRE}'")
            ok = n == 0 and notu and onizleme
            ekle("gizli", ok, "" if ok else f"şifre isabeti={n} not={notu} önizleme_şifreli={onizleme}")
        bm = re.search(r"(?:Tasarım|Design)\s*:\s*(\S+)", mesaj)
        if bm and genislik > 600:
            pg2 = await ctx.new_page()
            pg2.on("console", lambda m: hatalar.append("baglanti: " + m.text) if m.type == "error" else None)
            try:
                await pg2.goto(bm.group(1), wait_until="load")
                await pg2.wait_for_function("window.__oktosReady === true && !document.getElementById('busy').classList.contains('on')", timeout=60000)
                d2 = await pg2.evaluate("""() => ({ boyut: document.querySelector('#hud b')?.textContent || '',
                    on: [...document.querySelectorAll('#presets .preset.on')].map(b => b.dataset.id) })""")
                ok = d2["boyut"] == boyut and d2["on"] == [sablon["id"]]
                ekle("baglanti", ok, "" if ok else f"önce {boyut} [{sablon['id']}] → bağlantı {d2['boyut']} {d2['on']} ({bm.group(1)[:160]})")
            except Exception as e:
                ekle("baglanti", False, str(e).splitlines()[0])
            finally:
                await pg2.close()
        elif genislik > 600:
            ekle("baglanti", False, "mesajda tasarım bağlantısı yok")

        t = await pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        ekle("tasma", t <= 0, "" if t <= 0 else f"{t} px taşma")
    except Exception as e:
        ekle("akis", False, str(e).splitlines()[0])
    finally:
        ekle("konsol", not hatalar, " || ".join(dict.fromkeys(hatalar))[:500])
        await pg.close()
    return sonuc


async def ana(arg):
    taban = f"http://127.0.0.1:{arg.port}"
    numara = wa_numarasi()
    fiyat = fiyat_kurali()
    tablo, adresler, katalog_fark = paket_tablosu(arg.katalog)
    araclar = arg.arac.split(",") if arg.arac else ARACLAR
    t0 = time.time()
    async with async_playwright() as p:
        tarayici = await p.chromium.launch(channel="msedge", headless=True)
        ctx = await tarayici.new_context()
        isler = []
        sablon_sayisi = {}
        for a in araclar:
            liste = await sablonlari_al(ctx, taban, a)
            sablon_sayisi[a] = len(liste)
            for i, s in enumerate(liste):
                isler.append((a, s, 1440))
                if i == 0:
                    isler.append((a, s, 390))
        sem = asyncio.Semaphore(arg.paralel)

        # serve.py (ThreadingHTTPServer, bekleme kuyruğu 5) yük altında bağlantıyı arada reddediyor
        # (ERR_CONNECTION_REFUSED): bu sitenin değil test sunucusunun hatası; o şablon bir kez yeniden sınanır.
        async def tek(a, s, g):
            async with sem:
                for deneme in range(2):
                    r = await sina(ctx, taban, a, s, numara, g, fiyat, arg.kip, tablo, adresler)
                    # ECONNREFUSED: order-config.js yönlendirmesi (route.fetch) aynı reddi bu adla bildirir
                    if not any(("CONNECTION_REFUSED" in x["hata"] or "ECONNREFUSED" in x["hata"]) for x in r):
                        break
                    yeniden.append(f"{a}/{s['id']}@{g}")
                    await asyncio.sleep(1)
                return r

        yeniden = []

        sonuclar = [r for grup in await asyncio.gather(*(tek(*i) for i in isler)) for r in grup]
        # Her şablonun depoda bir paket sınıfı olmalı; katalogla fark varsa kalır.
        for a, s, g in (isler if arg.kip == "paket" else []):
            if g == 1440:
                var = s["id"] in tablo.get(a, {})
                sonuclar.append({"arac": a, "sablon": s["id"], "genislik": g, "adim": "sinif", "sonuc": "gecti" if var else "kaldi",
                                 "hata": "" if var else "core/paket-sinif.js'te sınıf yok (paket-sinif-uret.py)"})
        for f in katalog_fark:
            sonuclar.append({"arac": f.split("/")[0], "sablon": f.split("/")[1].split(":")[0], "genislik": 0, "adim": "katalog",
                             "sonuc": "kaldi", "hata": f})
        await tarayici.close()
    kalan = [r for r in sonuclar if r["sonuc"] == "kaldi"]
    ozet = {"tarih": time.strftime("%Y-%m-%d %H:%M:%S"), "sure_sn": round(time.time() - t0, 1), "whatsapp": numara,
            "sablon_sayisi": sablon_sayisi, "toplam_sablon": sum(sablon_sayisi.values()),
            "adim": len(sonuclar), "hata": len(kalan), "sunucu_yeniden": yeniden, "kip": arg.kip,
            "katalog_karsilastirma": bool(arg.katalog),
            "acilan": dict(__import__("collections").Counter(r["hata"] for r in sonuclar if r["adim"] == "_acilan"))}
    sonuclar = [r for r in sonuclar if r["adim"] != "_acilan"]
    ozet["adim"] = len(sonuclar)
    cikti = Path(arg.cikti)
    cikti.parent.mkdir(parents=True, exist_ok=True)
    cikti.write_text(json.dumps({"ozet": ozet, "sonuclar": sonuclar}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(ozet, ensure_ascii=False))
    for r in kalan:
        print(f"KALDI {r['arac']}/{r['sablon']}@{r['genislik']} {r['adim']}: {r['hata']}")
    return 1 if kalan else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=8082)
    ap.add_argument("--arac", default="")
    ap.add_argument("--paralel", type=int, default=3)
    ap.add_argument("--cikti", default="")
    ap.add_argument("--kip", choices=["whatsapp", "paket"], default="whatsapp")
    ap.add_argument("--katalog", default="", help="depo dışı katalog.json: şablon sınıflarını onunla da karşılaştır")
    a = ap.parse_args()
    a.cikti = a.cikti or str(KOK / ".impeccable" / ("siparis-akis.json" if a.kip == "whatsapp" else "siparis-akis-paket.json"))
    sys.exit(asyncio.run(ana(a)))
