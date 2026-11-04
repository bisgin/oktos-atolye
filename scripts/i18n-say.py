# Amaç: TR metinlerinin EN karşılığı eksiğini saymak (yayın öncesi denetim, K6).
# Girdi:  python scripts/i18n-say.py [--json] [dosya ...]   (dosya verilmezse core/, tools/, araclar/, urunler/, oda/, index.html)
# Çıktı:  dosya başına iki sayım: (1) sözlükler (i18n.js ve addStrings: tr: { 'anahtar': … } / en: { … }) — TR'de olup
#         EN'de olmayan anahtarlar; (2) satır içi çift dilli nesneler ({ tr: …, en: … } ya da JSON "tr"/"en") — EN'i
#         olmayan ya da boş olanlar. --json makine-okunur özet basar. Salt okur; hiçbir dosyaya yazmaz.
import argparse, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VARSAYILAN = ["core", "tools", "araclar", "urunler", "oda", "index.html", "templates"]


def kapanis(s, i):
    """s[i] == '{' → eşleşen '}' konumu; dizge ve yorumları atlar."""
    d, j, n = 0, i, len(s)
    while j < n:
        c = s[j]
        if c in "'\"`":
            q, j = c, j + 1
            while j < n and s[j] != q:
                j += 2 if s[j] == "\\" else 1
        elif s.startswith("//", j):
            j = s.find("\n", j); j = n if j < 0 else j
        elif s.startswith("/*", j):
            j = s.find("*/", j) + 1 or n
        elif c == "{": d += 1
        elif c == "}":
            d -= 1
            if d == 0: return j
        j += 1
    return n


ANAHTAR = re.compile(r"""(?:^|[,{])\s*['"]([\w.\-]+)['"]\s*:""", re.M)  # satırda birden çok anahtar olabilir


def ust_anahtarlar(govde):
    """Sözlükteki 'anahtar': satırları (sözlüklerde iç içe nesne yok)."""
    return [m.group(1) for m in ANAHTAR.finditer(govde)]


def sozlukler(s):
    """tr: { … } blokları ve hemen ardından gelen en: { … } blokları → [(tr_anahtar, en_anahtar)]."""
    sonuc = []
    for m in re.finditer(r"(?<![\w\"'])tr\s*:\s*\{", s):
        a = m.end() - 1
        b = kapanis(s, a)
        govde = s[a + 1:b]
        if not re.search(r"^\s*['\"][\w.\-]+['\"]\s*:", govde, re.M): continue  # sözlük değil
        e = re.compile(r"(?<![\w\"'])en\s*:\s*\{").search(s, b)
        if not e or e.start() - b > 40: sonuc.append((ust_anahtarlar(govde), [])); continue
        ea = e.end() - 1
        sonuc.append((ust_anahtarlar(govde), ust_anahtarlar(s[ea + 1:kapanis(s, ea)])))
    return sonuc


CIFT = re.compile(r"""\{\s*["']?tr["']?\s*:""")
EN_DOLU = re.compile(r"""["']?en["']?\s*:\s*(?!null|''|""|undefined)\S""")


def satir_ici(s):
    eksik = []
    for m in CIFT.finditer(s):
        a = m.start(); b = kapanis(s, a)
        nesne = s[a:b + 1]
        if re.match(r"\{\s*[\"']?tr[\"']?\s*:\s*\{", nesne): continue  # sözlük bloğu
        if len(nesne) > 4000: continue
        if not EN_DOLU.search(nesne):
            eksik.append((s.count("\n", 0, a) + 1, re.sub(r"\s+", " ", nesne)[:80]))
    return eksik


def dosyalar(yollar):
    for y in yollar:
        tam = os.path.join(KOK, y)
        if os.path.isfile(tam): yield tam
        else:
            for d, _, fs in os.walk(tam):
                for f in sorted(fs):
                    if f.endswith((".js", ".html")): yield os.path.join(d, f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("yollar", nargs="*")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    rapor, top_soz, top_ici, top_anahtar = [], 0, 0, 0
    for f in dosyalar(a.yollar or VARSAYILAN):
        s = open(f, encoding="utf-8").read()
        rel = os.path.relpath(f, KOK).replace(os.sep, "/")
        soz_eksik = []
        for tr, en in sozlukler(s):
            top_anahtar += len(tr)
            soz_eksik += [k for k in tr if k not in set(en)]
        ici = satir_ici(s)
        if soz_eksik or ici:
            rapor.append({"dosya": rel, "sozluk_eksik": soz_eksik, "satir_ici_eksik": [{"satir": n, "ornek": o} for n, o in ici]})
        top_soz += len(soz_eksik); top_ici += len(ici)
    # Kullanılan anahtar (t('x') ve data-i18n="x") sözlükte TR ya da EN olarak var mı (dinamik önekler: 'durum.' gibi, sayılmaz)
    tr_k, en_k, kul = set(), set(), set()
    for f in dosyalar(VARSAYILAN):
        s = open(f, encoding="utf-8").read()
        for tr, en in sozlukler(s): tr_k |= set(tr); en_k |= set(en)
        kul |= set(re.findall(r"\bt\('([\w.\-]+)'", s)) | set(re.findall(r'data-i18n="([\w.\-]+)"', s))
    kul = {k for k in kul if not k.endswith((".", "-")) and not re.search(r"\.(webp|png|jpg|glb|json)$", k)}  # oda-ortam.js t() doku yükleyici
    tanimsiz = sorted(k for k in kul if k not in tr_k or k not in en_k)
    ozet = {"tr_anahtar": top_anahtar, "sozluk_en_eksik": top_soz, "satir_ici_en_eksik": top_ici,
            "kullanilan_anahtar": len(kul), "kullanilan_tanimsiz": tanimsiz, "dosyalar": rapor}
    if a.json: print(json.dumps(ozet, ensure_ascii=False, indent=1))
    else:
        print(f"TR sözlük anahtarı: {top_anahtar} · EN eksik: {top_soz} · satır içi EN eksik: {top_ici}"
              f" · kullanılan {len(kul)} anahtardan tanımsız: {len(tanimsiz)} {tanimsiz or ''}")
        for r in rapor:
            for k in r["sozluk_eksik"]: print(f"  {r['dosya']}: {k}")
            for x in r["satir_ici_eksik"]: print(f"  {r['dosya']}:{x['satir']}: {x['ornek']}")


if __name__ == "__main__":
    main()
