"""Süreç kayıtlarını (hareketli WebP) çatı katı TV'si için kısa döngü videolarına (MP4, H.264) çevirir.

Amaç: core/cati-ekran.js'teki OLED ekran adımların kaydını tek bir <video> öğesinden kanvasa çizer; hareketli WebP
<video>'da oynamaz ve aynı kare sayısında MP4'ten birkaç kat büyüktür. Kaynak WebP'lere dokunulmaz.
Girdi:
  python scripts/ekran-dongu.py [--crf 26] [--sinir-kb 300] [--kaynak assets/cati/portfolyo] [--hedef assets/cati/ekran] [--zorla] [--dry-run]
    Kaynak: KAYNAK/surec-NN-*.webp (afişler, -poster.webp, alınmaz). Kare süreleri WebP'deki gerçek sürelerdir
    (PIL, her karede im.info['duration']).
Çıktı: HEDEF/surec-NN.mp4 (H.264 High, yuv420p, çift boyut, +faststart, ses yok) ve standart çıktıya JSON özet
  (her dosya için boyut, kare sayısı, fps, süre, kullanılan CRF, KB, durum). Dosya --sinir-kb'yi aşarsa CRF birer
  artırılarak (en çok 30) yeniden kodlanır.
  Kare hızı: kare sürelerini birikimli olarak en çok 4 ms hatayla ve her kareye en az bir video karesi düşecek biçimde
  karşılayan en düşük hız (12 fps kayıt 12 fps kalır; 200 ms + son kare 100 ms olan kayıt 10 fps olur). Kareler tekrar
  edilerek sabit hıza yayılır: döngünün toplam süresi kaynağınkiyle aynı, başa dönüşte kare eksilmez ya da çiftlenmez.
  Saydam pikseller OLED siyahının üstüne oturtulur; tek sayılı kenar 1 px kırpılır (ölçeklenmez).
Tekrar çalıştırmak güvenlidir: MP4'ün 'comment' etiketinde kaynağın SHA-1'i, CRF ve sınır yazılı; hepsi aynıysa dosya
atlanır (--zorla yeniden kodlar). Üzerine yazmadan önce --dry-run ile ne yapılacağı görülür (hiçbir şey yazılmaz).
Gereken: ffmpeg ve ffprobe (PATH'te), Pillow.
"""
import argparse
import glob
import hashlib
import json
import os
import re
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SURUM = 1  # kodlama ayarları değişince artır: eski çıktılar yeniden kodlanır
HIZLAR = [5, 6, 8, 10, 12, 15, 20, 24, 25, 30]


def kareler(yol):
    """WebP'nin karelerini (RGB, siyah zemin üstünde) ve sürelerini (ms) döndürür."""
    im = Image.open(yol)
    out, sure = [], []
    for i in range(getattr(im, 'n_frames', 1)):
        im.seek(i)
        im.load()  # Pillow süreyi kare çözülünce yazar
        d = im.info.get('duration') or 100
        k = im.convert('RGBA')
        zemin = Image.new('RGBA', k.size, (0, 0, 0, 255))
        zemin.alpha_composite(k)
        out.append(zemin.convert('RGB'))
        sure.append(d)
    return out, sure


def hiz_sec(sure):
    """Süreleri karşılayan en düşük sabit kare hızı ve her kaynak karesinin tekrar sayısı."""
    for fps in HIZLAR:
        t, n_once, tekrar, hata = 0, 0, [], 0
        for d in sure:
            t += d
            n = round(t * fps / 1000)
            hata = max(hata, abs(t - n * 1000 / fps))
            tekrar.append(n - n_once)
            n_once = n
        if min(tekrar) >= 1 and hata <= 4:
            return fps, tekrar
    fps = 30  # yedek: en yüksek hız, her kare en az bir kez
    return fps, [max(1, round(d * fps / 1000)) for d in sure]


def etiket_oku(yol):
    try:
        r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format_tags=comment', '-of', 'json', yol],
                           capture_output=True, text=True, timeout=30)
        return json.loads(r.stdout or '{}').get('format', {}).get('tags', {}).get('comment')
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def kodla(kare, tekrar, fps, crf, etiket, hedef):
    w, h = kare[0].size
    w2, h2 = w - w % 2, h - h % 2
    gecici = hedef + '.yaziliyor.mp4'
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w2}x{h2}', '-r', str(fps), '-i', '-',
           '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'film', '-crf', str(crf), '-profile:v', 'high',
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-map_metadata', '-1', '-metadata', f'comment={etiket}', gecici]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for k, n in zip(kare, tekrar):
            veri = k.crop((0, 0, w2, h2)).tobytes()
            for _ in range(n):
                p.stdin.write(veri)
        p.stdin.close()
    except BrokenPipeError:
        pass
    hata = p.stderr.read().decode('utf-8', 'replace')
    if p.wait() != 0:
        if os.path.exists(gecici):
            os.remove(gecici)
        raise RuntimeError(f'ffmpeg: {hata.strip()}')
    os.replace(gecici, hedef)  # yarım dosya hedefin yerine geçmez
    return w2, h2


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--kaynak', default=os.path.join(ROOT, 'assets', 'cati', 'portfolyo'))
    ap.add_argument('--hedef', default=os.path.join(ROOT, 'assets', 'cati', 'ekran'))
    ap.add_argument('--crf', type=int, default=26)
    ap.add_argument('--sinir-kb', type=int, default=300, help='dosya bunu aşarsa CRF 1 artırılıp yeniden kodlanır (en çok 30)')
    ap.add_argument('--zorla', action='store_true', help='etiket aynı olsa da yeniden kodla')
    ap.add_argument('--dry-run', action='store_true', help='hiçbir şey yazma, yalnız planı göster')
    a = ap.parse_args()

    kaynaklar = sorted(f for f in glob.glob(os.path.join(a.kaynak, 'surec-*.webp')) if not f.endswith('-poster.webp'))
    if not kaynaklar:
        print(json.dumps({'hata': 'kaynak bulunamadı', 'kaynak': a.kaynak}, ensure_ascii=False))
        return 1
    if not a.dry_run:
        os.makedirs(a.hedef, exist_ok=True)
    ozet = []
    for yol in kaynaklar:
        m = re.match(r'surec-(\d\d)-', os.path.basename(yol))
        if not m:
            continue
        hedef = os.path.join(a.hedef, f'surec-{m.group(1)}.mp4')
        sha = hashlib.sha1(open(yol, 'rb').read()).hexdigest()[:16]
        etiket = f'oktos-ekran-dongu v{SURUM} kaynak={sha} crf={a.crf} sinir={a.sinir_kb}'
        kayit = {'kaynak': os.path.relpath(yol, ROOT).replace('\\', '/'), 'hedef': os.path.relpath(hedef, ROOT).replace('\\', '/')}
        if os.path.exists(hedef) and not a.zorla and etiket_oku(hedef) == etiket:
            kayit.update(durum='atlandi', kb=round(os.path.getsize(hedef) / 1024, 1))
            ozet.append(kayit)
            continue
        kare, sure = kareler(yol)
        fps, tekrar = hiz_sec(sure)
        w, h = kare[0].size
        kayit.update(boyut=f'{w - w % 2}x{h - h % 2}', kare=len(kare), fps=fps, video_kare=sum(tekrar),
                     sure_sn=round(sum(tekrar) / fps, 3), kaynak_sure_sn=round(sum(sure) / 1000, 3))
        if a.dry_run:
            kayit['durum'] = 'yazilacak (dry-run)' + (' (üzerine)' if os.path.exists(hedef) else '')
        else:
            crf = a.crf
            while True:
                kodla(kare, tekrar, fps, crf, etiket, hedef)
                if os.path.getsize(hedef) <= a.sinir_kb * 1024 or crf >= max(30, a.crf):
                    break
                crf += 1  # sınırı aşan (gürültülü) kayıt bir basamak daha sıkıştırılır
            kayit.update(durum='yazildi', crf=crf, kb=round(os.path.getsize(hedef) / 1024, 1))
        ozet.append(kayit)
    print(json.dumps(ozet, ensure_ascii=False, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
