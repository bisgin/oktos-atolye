"""Amaç: Araç şablonlarının baskı ölçümü (gram ve süre). Fiyat kataloğunun ham girdisidir; bu betik fiyat YAZMAZ.
Ne yapar:
  1. Her araç için tools/<arac>/index.html?atolye=1 açılır (Playwright + kurulu Edge, ekransız). Sayfanın kendi
     modülüyle bütün şablonlar kurulur: katı hacim (cm³) ve dış ölçü (mm) okunur (76 şablonun hepsi).
  2. Her araçtan hacim sırasına göre yayılan --ornek kadar şablon seçilir (en küçük, ara, en büyük); --ek ile
     belirli şablonlar eklenir (örneği olmayan tür için: aynı araç + aynı mod / vazo stili). Seçilen her
     şablon ?sablon=<id>&atolye=1 ile açılır, atölyenin "3MF indir" düğmesiyle dışa aktarılır.
  3. 3MF Bambu Studio CLI ile dilimlenir (--slice 0, --arrange 1). Profil zinciri ("inherits") betikte
     düzleştirilir; dolgu ve yoğunluk aşağıdaki VARSAYIM'a göre ezilir. Gram = gcode'daki filament uzunluğu ×
     kesit × yoğunluk; süre = result.json total_predication.
     Destek: önce desteksiz dilimlenir. Dilimleyici "floating regions / cantilever" uyarısı verirse (--destek uyarida,
     varsayılan) aynı model tree(auto) destekle yeniden dilimlenir; asıl gram/süre destekli olandır, desteksiz değerler
     "desteksiz" alt alanında ve önce→sonra farkı (%) yanında durur. --destek kapali eski davranış.
  4. İkinci yöntem: hacim × yoğunluk (%100 dolu katı). Hacim iki ayrı yoldan gelir: tarayıcı (manifold) ve
     3MF ağından işaretli dörtyüzlü toplamı (bu betik); ikisinin farkı elle kontrol sütunudur.
Girdi: çalışan yerel sunucu (scripts/serve.py, --port, varsayılan 8082), Bambu Studio (--bambu).
Çıktı: --cikti klasörüne (zorunlu; depo DIŞI bir klasör ver, ör. iş klasörünün fiyat/ alt klasörü) olcum.json; 3MF ve
dilimleme çıktıları --cikti/olcum-dosyalar/ altında. Önceki olcum.json varsa olcum_onceki.json'a alınır ve iki
koşunun farkı "tutarlilik" alanına yazılır. Tekrar çalıştırmak güvenlidir (aynı dosyaların üzerine yazar).
--dry-run: yalnız şablon taraması ve örnek seçimi; dışa aktarma, dilimleme ve yazma yok.
"""
import argparse
import asyncio
import json
import math
import re
import shutil
import struct
import subprocess
import sys
import time
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from playwright.async_api import async_playwright

ARACLAR = ["bin", "vase", "clicker", "text", "flip", "qr", "painter", "puzzle"]
BAMBU = Path(r"C:\Program Files\Bambu Studio")
VARSAYIM = {
    "yazici": "Bambu Lab A2L 0.4 nozzle",
    "islem": "0.20mm Standard @BBL A2L",
    "filament": "Bambu PLA Basic @BBL A2L 0.4 nozzle",
    "katman_mm": 0.2,
    "dolgu_yuzde": 15,
    "duvar": "profilin varsayılanı (2 duvar, üst 4 / alt 3 katman)",
    "destek": "uyarıda tree(auto): desteksiz dilimde 'floating/cantilever' uyarısı çıkan model destekle yeniden dilimlenir",
    "yogunluk_g_cm3": 1.24,
    "filament_cap_mm": 1.75,
    "parca_yerlesimi": "--arrange 1 (Bambu yerleştirir), tek tabla",
    "gram_tanimi": "dilimleyici: ekstrüde filament (etek dahil, purge yok); hacim: %100 dolu katı",
}


# ---------- Bambu profil düzleştirme ----------
def profil_bul(tur, ad):
    for f in (BAMBU / "resources" / "profiles" / "BBL" / tur).glob("*.json"):
        if f.stem == ad:
            return f
    raise FileNotFoundError(f"{tur}/{ad}")


def duzlestir(tur, ad):
    j = json.loads(profil_bul(tur, ad).read_text(encoding="utf-8"))
    if j.get("inherits"):
        taban = duzlestir(tur, j["inherits"])
        taban.update(j)
        j = taban
    return j


def profiller_yaz(klasor):
    klasor.mkdir(parents=True, exist_ok=True)
    m = duzlestir("machine", VARSAYIM["yazici"])
    p = duzlestir("process", VARSAYIM["islem"])
    f = duzlestir("filament", VARSAYIM["filament"])
    for j in (m, p, f):
        j.pop("inherits", None)
        j["from"] = "system"  # "User" olunca CLI uyumluluk denetimi reddediyor (-17)
    p["sparse_infill_density"] = f"{VARSAYIM['dolgu_yuzde']}%"
    f["filament_density"] = [str(VARSAYIM["yogunluk_g_cm3"])]
    f["filament_diameter"] = [str(VARSAYIM["filament_cap_mm"])]
    pd = dict(p, enable_support="1", support_type="tree(auto)")  # destekli işlem profili (aynı ayar + ağaç destek)
    yollar = {}
    for ad, j in (("makine", m), ("islem", p), ("filament", f), ("islem_destek", pd)):
        y = klasor / f"{ad}.json"
        y.write_text(json.dumps(j, ensure_ascii=False, indent=1), encoding="utf-8")
        yollar[ad] = y
    return (yollar["makine"], yollar["islem"], yollar["filament"]), (yollar["makine"], yollar["islem_destek"], yollar["filament"])


DESTEK_UYARI = re.compile(r"floating|cantilever", re.I)


def dilimle_destekli(model, cikis, profil, profil_destek, kip):
    d = dilimle(model, cikis, profil)
    if kip == "kapali" or "gram" not in d or not DESTEK_UYARI.search(d.get("uyari", "")):
        return dict(d, destekli=False) if "gram" in d else d
    ds = dilimle(model, cikis.with_name(cikis.name + "_destek"), profil_destek)
    if "gram" not in ds:
        return dict(d, destekli=False, destek_hata=ds.get("hata"))
    return dict(ds, destekli=True, desteksiz={k: d[k] for k in ("gram", "sure_dk", "filament_m", "uyari")},
                destek_fark_gram_yuzde=round((ds["gram"] - d["gram"]) / d["gram"] * 100, 1),
                destek_fark_sure_yuzde=round((ds["sure_dk"] - d["sure_dk"]) / d["sure_dk"] * 100, 1))


def dilimle(model, cikis, profil):
    makine, islem, filament = profil
    if cikis.exists():
        shutil.rmtree(cikis)
    cikis.mkdir(parents=True)
    komut = [str(BAMBU / "bambu-studio.exe"), "--slice", "0", "--arrange", "1", "--outputdir", str(cikis),
             "--load-settings", f"{makine};{islem}", "--load-filaments", str(filament), str(model)]
    t0 = time.time()
    for deneme in range(3):  # CLI arada takılıyor (aynı dosya ikinci denemede 2 sn'de dilimlendi)
        try:
            subprocess.run(komut, check=False, timeout=240, capture_output=True)
            break
        except subprocess.TimeoutExpired:
            subprocess.run(["taskkill", "/F", "/IM", "bambu-studio.exe"], capture_output=True)
            print("  dilimleyici zaman aşımı, yeniden:", model.name)
    else:
        return {"hata": "zaman aşımı (3 deneme)"}
    sonuc = json.loads((cikis / "result.json").read_text(encoding="utf-8"))
    if sonuc.get("return_code") != 0:
        return {"hata": sonuc.get("error_string")}
    plaka = sonuc["sliced_plates"][0]
    gcode = next(cikis.glob("*.gcode")).read_text(encoding="utf-8", errors="ignore")
    uzunluk = float(re.search(r"total filament length \[mm\] : ([\d.]+)", gcode).group(1))
    kesit = math.pi * (VARSAYIM["filament_cap_mm"] / 2) ** 2
    gram = uzunluk * kesit / 1000 * VARSAYIM["yogunluk_g_cm3"]
    return {"gram": round(gram, 2), "sure_dk": round(plaka["total_predication"] / 60, 1),
            "filament_m": round(uzunluk / 1000, 2), "dilim_sn": round(time.time() - t0, 1),
            "uyari": plaka.get("warning_message") or ""}


# ---------- 3MF ağından bağımsız hacim (elle kontrol yolu) ----------
def hacim_3mf(yol):
    z = zipfile.ZipFile(yol)
    kok = ET.fromstring(z.read("3D/3dmodel.model"))
    ns = {"m": "http://schemas.microsoft.com/3dmanufacturing/core/2015/02"}
    toplam = 0.0
    lo, hi = [math.inf] * 3, [-math.inf] * 3
    for nesne in kok.iterfind(".//m:object", ns):
        v = [(float(e.get("x")), float(e.get("y")), float(e.get("z"))) for e in nesne.iterfind(".//m:vertex", ns)]
        for p in v:
            for i in range(3):
                lo[i] = min(lo[i], p[i]); hi[i] = max(hi[i], p[i])
        for t in nesne.iterfind(".//m:triangle", ns):
            a, b, c = v[int(t.get("v1"))], v[int(t.get("v2"))], v[int(t.get("v3"))]
            toplam += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0])
                       + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6
    return abs(toplam) / 1000, [round(hi[i] - lo[i], 1) for i in range(3)]


# ---------- tarayıcı ----------
TARA_JS = """async () => {
  for (let i = 0; i < 400 && !window.__oktosReady; i++) await new Promise(r => setTimeout(r, 100));
  const m = await import('./app.js'); const i18 = await import('../../core/i18n.js');
  const T = m.TOOL; const out = [];
  for (const p of T.presets) {
    const s = { ...T.defaults, ...(p.mode ? { mode: p.mode } : {}), ...p.values };
    T.enforce(s);
    const parts = T.build(s).parts.filter(x => !x.ghost && x.result && !x.result.empty);
    let vol = 0; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const x of parts) { const o = x.offset || [0, 0, 0]; vol += x.result.volume;
      for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], x.result.box.min[k] + o[k]); hi[k] = Math.max(hi[k], x.result.box.max[k] + o[k]); } }
    out.push({ sablon: p.id, mod: p.mode || null, stil: s.style || null, ad: i18.t(p.label), hacim_cm3: Math.round(vol) / 1000,
      olcu_mm: hi.map((h, k) => Math.round((h - lo[k]) * 10) / 10), parca: parts.length });
  }
  return out;
}"""


async def tara(ctx, taban, arac):
    pg = await ctx.new_page()
    try:
        await pg.goto(f"{taban}/tools/{arac}/index.html?atolye=1", wait_until="load")
        await pg.wait_for_function("window.__oktosReady === true", timeout=120000)
        return await pg.evaluate(TARA_JS)
    finally:
        await pg.close()


async def disa_aktar(ctx, taban, arac, sablon, hedef):
    pg = await ctx.new_page()
    try:
        await pg.goto(f"{taban}/tools/{arac}/index.html?sablon={sablon}&atolye=1", wait_until="load")
        await pg.wait_for_function("window.__oktosReady === true && !document.querySelector('#dl-3mf').disabled", timeout=120000)
        await pg.wait_for_timeout(400)  # 140 ms gecikmeli son kurulum otursun
        hud = await pg.inner_text("#hud")
        async with pg.expect_download(timeout=120000) as d:
            await pg.click("#dl-3mf")
        await (await d.value).save_as(hedef)
        hacim = re.search(r"([\d.,]+)\s*cm³", hud)
        return float(hacim.group(1).replace(".", "").replace(",", ".")) if hacim else None
    finally:
        await pg.close()


def ornek_sec(liste, n):
    s = sorted(liste, key=lambda x: x["hacim_cm3"])
    if len(s) <= n:
        return [x["sablon"] for x in s]
    idx = sorted({round(i * (len(s) - 1) / (n - 1)) for i in range(n)})
    return [s[i]["sablon"] for i in idx]


async def ana(a):
    cikti = Path(a.cikti)
    dosyalar = cikti / "olcum-dosyalar"
    taban = f"http://127.0.0.1:{a.port}"
    sablonlar, ornekler = {}, []
    ek = [e.strip() for e in (a.ek or "").split(",") if e.strip()]
    async with async_playwright() as p:
        tar = await p.chromium.launch(channel="msedge", headless=True, args=["--ignore-gpu-blocklist"])
        ctx = await tar.new_context(accept_downloads=True)
        for arac in ARACLAR:
            for deneme in range(3):
                try:
                    sablonlar[arac] = await tara(ctx, taban, arac); break
                except Exception as e:
                    if deneme == 2: raise
                    print("  yeniden:", arac, e)
            secim = ornek_sec(sablonlar[arac], a.ornek)
            secim += [e.split("/", 1)[1] for e in ek if e.split("/", 1)[0] == arac and e.split("/", 1)[1] not in secim]
            print(f"{arac}: {len(sablonlar[arac])} şablon, örnek {secim}")
            if a.dry_run:
                continue
            (dosyalar / arac).mkdir(parents=True, exist_ok=True)
            for s in secim:
                hedef = dosyalar / arac / f"{s}.3mf"
                for deneme in range(3):
                    try:
                        hud_hacim = await disa_aktar(ctx, taban, arac, s, hedef); break
                    except Exception as e:
                        if deneme == 2: raise
                        print("  yeniden:", arac, s, e)
                ornekler.append({"arac": arac, "sablon": s, "hud_hacim_cm3": hud_hacim, "model": str(hedef)})
        await tar.close()
    toplam = sum(len(v) for v in sablonlar.values())
    print(f"toplam {toplam} şablon, {len(ornekler)} örnek")
    if a.dry_run:
        return
    profil, profil_destek = profiller_yaz(dosyalar / "_profil")
    rho = VARSAYIM["yogunluk_g_cm3"]
    for o in ornekler:
        sab = next(x for x in sablonlar[o["arac"]] if x["sablon"] == o["sablon"])
        h3, olcu3 = hacim_3mf(o["model"])
        d = dilimle_destekli(Path(o["model"]), dosyalar / o["arac"] / f"{o['sablon']}_dilim", profil, profil_destek, a.destek)
        o.update({"ad": sab["ad"], "olcu_mm": sab["olcu_mm"], "hacim_cm3_tarayici": sab["hacim_cm3"],
                  "hacim_cm3_3mf": round(h3, 3), "olcu_mm_3mf": olcu3,
                  "hacim_fark_yuzde": round((h3 - sab["hacim_cm3"]) / sab["hacim_cm3"] * 100, 2) if sab["hacim_cm3"] else None,
                  "gram_hacim": round(sab["hacim_cm3"] * rho, 1), "destekli": bool(d.get("destekli")), "dilimleyici": d})
        if "gram" in d:
            o["sapma_yuzde"] = round((o["gram_hacim"] - d["gram"]) / d["gram"] * 100, 1)
        ek_destek = (f", destekli (desteksiz {d['desteksiz']['gram']} g / {d['desteksiz']['sure_dk']} dk → "
                     f"{d['destek_fark_gram_yuzde']:+} % / {d['destek_fark_sure_yuzde']:+} %)") if d.get("destekli") else ""
        print(f"  {o['arac']}/{o['sablon']}: katı {o['gram_hacim']} g, dilim {d.get('gram')} g, {d.get('sure_dk')} dk, "
              f"sapma {o.get('sapma_yuzde')} %, hacim farkı {o['hacim_fark_yuzde']} %{ek_destek}")
    sap = [abs(o["sapma_yuzde"]) for o in ornekler if "sapma_yuzde" in o]
    cikis = {
        "uretici": "scripts/fiyat-olc.py", "tarih": time.strftime("%Y-%m-%d %H:%M"),
        "not": "Yalnız ölçüm; fiyat yok. Depo dışında durur.", "varsayim": VARSAYIM,
        "ozet": {"sablon": toplam, "ornek": len(ornekler), "dilimlenen": len(sap),
                 "destekli": sum(o["destekli"] for o in ornekler),
                 "uyari_kalan": sorted(f'{o["arac"]}/{o["sablon"]}' for o in ornekler if o["dilimleyici"].get("uyari")),
                 "sapma_ortalama_yuzde": round(sum(sap) / len(sap), 1) if sap else None,
                 "sapma_yontem": "(hacim×yoğunluk − dilimleyici) / dilimleyici; pozitif = hacim yöntemi fazla söyler"},
        "sablonlar": sablonlar, "ornekler": ornekler,
    }
    cikti.mkdir(parents=True, exist_ok=True)
    hedef = cikti / "olcum.json"
    if hedef.exists():
        onceki = json.loads(hedef.read_text(encoding="utf-8"))
        shutil.copy2(hedef, cikti / "olcum_onceki.json")
        eski = {(o["arac"], o["sablon"]): o for o in onceki.get("ornekler", [])}
        farklar = []
        for o in ornekler:
            e = eski.get((o["arac"], o["sablon"]))
            # destekli örnekte karşılaştırma aynı yöntemle: desteksiz ↔ desteksiz (eski koşular desteksizdi)
            yd = o["dilimleyici"].get("desteksiz", o["dilimleyici"])
            ed = e.get("dilimleyici", {}).get("desteksiz", e.get("dilimleyici", {})) if e else {}
            if e and "gram" in ed and "gram" in yd:
                farklar.append(max(abs(yd["gram"] - ed["gram"]),
                                   abs(yd["sure_dk"] - ed["sure_dk"]),
                                   abs(o["hacim_cm3_tarayici"] - e["hacim_cm3_tarayici"])))
        cikis["tutarlilik"] = {"onceki_tarih": onceki.get("tarih"), "karsilastirilan": len(farklar),
                               "en_buyuk_fark": max(farklar) if farklar else None}
        print("tutarlılık:", cikis["tutarlilik"])
    hedef.write_text(json.dumps(cikis, ensure_ascii=False, indent=1), encoding="utf-8")
    print("yazıldı:", hedef)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=8082)
    ap.add_argument("--ornek", type=int, default=4, help="araç başına örnek (en az 3)")
    ap.add_argument("--cikti", required=True, help="depo dışı çıktı klasörü")
    ap.add_argument("--ek", default="", help="yayılan seçime eklenecek örnekler, virgülle: arac/sablon (ör. vase/tulip,puzzle/picture); "
                    "eksik tür (aynı araç + aynı mod/stil) için")
    ap.add_argument("--destek", choices=["uyarida", "kapali"], default="uyarida",
                    help="uyarida: 'floating/cantilever' uyarılı modeli tree(auto) destekle yeniden dilimle (varsayılan)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.ornek < 3:
        sys.exit("--ornek en az 3")
    asyncio.run(ana(a))
