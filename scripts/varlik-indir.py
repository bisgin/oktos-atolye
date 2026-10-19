"""Oda sahnesinin dış kaynaklı varlıklarını (Poly Haven, CC0) indirir ve kaynak listesini yazar.

Amaç: Blender'da kullanılacak ham dosyaları (gökyüzü ışık haritası, PBR dokular, taranmış modeller) tek komutla,
doğrulanmış ve kayıtlı biçimde indirmek.
Girdi:  assets/oda/kaynak-listesi.json  (id, tur: hdri | doku | model, cozunurluk, not)
Çıktı:  kaynak/<id>/...  (ham dosyalar; depoya girmez, .gitignore)
        assets/oda/KAYNAKLAR.md  (ad, yazar, adres, lisans; depoya girer)
Kullanım: python scripts/varlik-indir.py [--dry-run]
  --dry-run: ne indirileceğini ve boyutunu yazar, hiçbir şey indirmez ve yazmaz.
Tekrar çalıştırmak güvenli: md5'i tutan dosya yeniden indirilmez. Dokuda yalnız renk, normal (OpenGL) ve pürüzlülük
haritaları alınır (yer değiştirme ve AO alınmaz: sitede kullanılmıyor).
"""
import argparse
import hashlib
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTE = os.path.join(ROOT, 'assets', 'oda', 'kaynak-listesi.json')
HEDEF = os.path.join(ROOT, 'kaynak')
KAYNAKLAR = os.path.join(ROOT, 'assets', 'oda', 'KAYNAKLAR.md')
UA = {'User-Agent': 'OktosWorkshop-varlik-indir/1.0 (oda sahnesi)'}  # Poly Haven API özel UA ister
DOKU_HARITALARI = {'Diffuse': 'diff', 'nor_gl': 'nor_gl', 'Rough': 'rough'}


def api(yol):
    with urllib.request.urlopen(urllib.request.Request('https://api.polyhaven.com/' + yol, headers=UA), timeout=60) as r:
        return json.load(r)


def dosyalar(v):
    """[(adres, md5, boyut, yerel yol)] listesi"""
    f = api('files/' + v['id'])
    res, kok = v['cozunurluk'], os.path.join(HEDEF, v['id'])
    out = []
    if v['tur'] == 'hdri':
        x = f['hdri'][res]['hdr']
        out.append((x['url'], x['md5'], x['size'], os.path.join(kok, os.path.basename(x['url']))))
    elif v['tur'] == 'doku':
        for harita in DOKU_HARITALARI:
            x = f[harita][res]['jpg']
            out.append((x['url'], x['md5'], x['size'], os.path.join(kok, os.path.basename(x['url']))))
    elif v['tur'] == 'model':
        g = f['gltf'][res]['gltf']
        out.append((g['url'], g['md5'], g['size'], os.path.join(kok, os.path.basename(g['url']))))
        for rel, x in g.get('include', {}).items():
            out.append((x['url'], x['md5'], x['size'], os.path.join(kok, rel)))
    return out


def md5(yol):
    h = hashlib.md5()
    with open(yol, 'rb') as fh:
        for parca in iter(lambda: fh.read(1 << 20), b''):
            h.update(parca)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    tum = json.load(open(LISTE, encoding='utf-8'))
    liste = tum['polyhaven']
    toplam, satirlar = 0, []
    for v in liste:
        bilgi = api('info/' + v['id'])
        yazar = ', '.join(bilgi.get('authors', {}).keys())
        satirlar.append(f"| `kaynak/{v['id']}/` ({v['tur']}, {v['cozunurluk']}) | https://polyhaven.com/a/{v['id']} | {yazar} | {v['not']} |")
        for adres, sum_, boyut, yerel in dosyalar(v):
            var = os.path.exists(yerel) and md5(yerel) == sum_
            if var:
                continue
            toplam += boyut
            print(f"{'(indirilecek) ' if a.dry_run else ''}{boyut / 1e6:6.2f} MB  {os.path.relpath(yerel, ROOT)}")
            if a.dry_run:
                continue
            os.makedirs(os.path.dirname(yerel), exist_ok=True)
            with urllib.request.urlopen(urllib.request.Request(adres, headers=UA), timeout=300) as r, open(yerel + '.part', 'wb') as fh:
                fh.write(r.read())
            if md5(yerel + '.part') != sum_:
                os.remove(yerel + '.part')
                sys.exit(f'md5 tutmadı: {adres}')
            os.replace(yerel + '.part', yerel)
    print(f"Toplam {'indirilecek' if a.dry_run else 'indirilen'}: {toplam / 1e6:.1f} MB")
    if a.dry_run:
        return
    with open(KAYNAKLAR, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('# Oda sahnesinin dış kaynaklı varlıkları\n\n'
                 'Bu varlıklar Oktos\'ta üretilmedi. Hepsi CC0 (kamu malı): ticari kullanım ve yeniden dağıtım serbest; '
                 'kaynak belirtmek zorunlu değil, yine de kayıt tutulur. Lisans: https://polyhaven.com/license\n'
                 'Ham dosyalar `kaynak/` altında durur (depoya girmez); sitede yalnız sıkıştırılmış çıktıları kullanılır. '
                 'Bu dosya `scripts/varlik-indir.py` ile yazılır, elle düzenleme.\n\n'
                 '| Ham dosya | Kaynak | Yazar | Kullanım |\n|---|---|---|---|\n')
        fh.write('\n'.join(satirlar) + '\n')
        diger = tum.get('diger', [])  # Poly Haven dışı (CC0 değil): elle indirilir, burada yalnız kaydı yazılır
        if diger:
            fh.write('\n## Diğer kaynaklar (CC0 değil)\n\n| Dosya | Kaynak | Yazar | Lisans | Kullanım |\n|---|---|---|---|---|\n')
            fh.write('\n'.join(f"| `{v['dosya']}` | {v['kaynak']} | {v['yazar']} | {v['lisans']} | {v['not']} |" for v in diger) + '\n')
    print('yazıldı:', os.path.relpath(KAYNAKLAR, ROOT))


if __name__ == '__main__':
    main()
