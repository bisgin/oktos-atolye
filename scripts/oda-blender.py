"""Oda sahnesinin ortamını Blender'da kurar, ışığı dokulara pişirir ve tarayıcı için dışa aktarır (docs/oda-sahnesi.md).

Amaç: fotogerçekçi oda kabuğu (zemin, duvarlar, mermer pervazlar, pencere/kapı kasaları, sürgülü kanatlar, balkon,
korkuluk). Işık ve gölge Cycles ile önceden hesaplanıp dokuya yazılır ("pişirme"); tarayıcı yeniden hesaplamaz.
Ürünlerimiz bu dosyada yok: tarayıcıda canlı ışıkta durur. Cam, Blender'da açıklık olarak kalır (güneş geçsin);
tarayıcıda gerçek cam malzemesiyle çizilir.
Girdi:  core/oda-olcu.js (ölçüler ve güneş; tarayıcıyla ortak), kaynak/ (Poly Haven dokuları, gökyüzü ve çiçekler;
        scripts/varlik-indir.py), kaynak/ekran/kutu.png (monitör ekranı: Kutu aracının sayfası, scripts/sayfa-cek.py ile)
Çıktı:  assets/oda/oda-ortam.glb   pişmiş, ışıksız malzemeli oda kabuğu (Draco + WebP)
        assets/oda/oda-pano.webp   ürünlerin yansıması için odanın 360° görüntüsü
        assets/oda/oda-gok.webp    balkonun ardındaki gökyüzü
        assets/oda/oda-bitki.glb   saksılardaki çiçekler (ışıklı malzeme, 2K doku)
        assets/oda/toprak-*.webp   saksı toprağı (renk, normal, pürüzlülük; 1K)
        assets/oda/oda-esya.glb    canlı ışıkta duran eşyalar: monitör, mini buzdolabı (kapağı ayrı düğüm, menteşede),
                                   masa altı, buzdolabındaki tabak (somun, beyaz peynir; procedural doku burada pişer)
        assets/oda/oda-ortam.json  tarayıcının okuyacağı ayarlar (doku ölçeği, gök dönüşü, kalite)
        kaynak/oda.blend           düzenlenebilir sahne (pişirmeden önceki hâli; depoya girmez)
Kullanım:
  blender -b --factory-startup --python scripts/oda-blender.py -- [--final] [--parca ortam,gok,bitki] [--dry-run]
  Varsayılan önizleme kalitesidir (512 px, 64 örnek, birkaç dakika). --final: 2048 px, 1024 örnek (GPU; yalnız
  önizleme onaylandıktan sonra çalıştırılır). --dry-run: kurulacakları ve yazılacak dosyaları söyler, hiçbir şey
  yazmaz. Tekrar çalıştırmak güvenli: çıktıların üstüne yazar.
Doku kodlaması: pişen ışık doğrusal değerdir; güneş lekesi ile gölgedeki duvar arasında ~100 kat fark var. 8 bitte
karanlıklar birkaç basamağa sıkışmasın diye dokuya sqrt(ışık × ölçek) sRGB olarak yazılır; tarayıcı sRGB'yi çözer,
karesini alır, ölçeğe böler (core/oda-ortam.js) ve ürünlerle aynı ton eşlemeden geçirir. Ölçekler oda-ortam.json'da.
"""
import argparse
import json
import math
import os
import sys
import time

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(ROOT, 'kaynak')
CIKTI = os.path.join(ROOT, 'assets', 'oda')
GOK_SINIR = 6.0       # gökyüzü haritasındaki güneş diski kırpılır: doğrudan ışığı güneş lambası verir
OLCEK = {'ortam': 0.6, 'gok': 1 / GOK_SINIR, 'pano': 1 / GOK_SINIR}  # ışık × ölçek ≤ 1 (en parlak güneş lekesi ~1,5)
KALITE = {
    'onizleme': {'ornek': 128, 'buyuk': 1024, 'kucuk': 512, 'pano': (1024, 512), 'pano_ornek': 64},
    'final': {'ornek': 1024, 'buyuk': 2048, 'kucuk': 1024, 'pano': (1024, 512), 'pano_ornek': 512},
}
PANO_YERI = (100, 1350, 1050)  # yansıma görüntüsünün çekildiği nokta (pilot: pencere kenarı saksıları)
# Balkonun ardındaki manzara (yalnız görünüm): Poly Haven 'balcony'. u: görüntünün kameranın baktığı +y yönüne gelecek
# yatay konumu (0..1); 0,10 tarlalar ve ağaçlar (ev ve yakın balkon arkada kalır)
MANZARA = {'id': 'balcony', 'coz': '4k', 'u': 0.03, 'yukselt': 0.22}  # yukselt (radyan): görüntünün kendi korkuluğu ufkun altına insin
# Pencere ve kapıdan görünen yön aralığı (sahne azimutu atan2(y, x) ve yükseklik, derece): bu kısım manzaranın tam
# çözünürlüğünde ayrı dokuya kesilir (oda-gok-yakin.webp); kalanı küçük tam görüntüden (oda-gok.webp)
GOK_YAKIN = {'azimut': (15, 165), 'yukseklik': (-50, 50)}


def secenekler():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser(prog='oda-blender')
    ap.add_argument('--final', action='store_true')
    ap.add_argument('--parca', default='ortam,gok,bitki,doku,esya')
    ap.add_argument('--dry-run', action='store_true')
    return ap.parse_args(argv)


def olcu_oku():
    s = open(os.path.join(ROOT, 'core', 'oda-olcu.js'), encoding='utf-8').read()
    bas = s.index('\nexport const OLCU = ') + len('\nexport const OLCU = ')  # satır başı: yorumdaki anılış sayılmaz
    return json.loads(s[bas:s.index('\n};', bas) + 2])


def gunese(sun):
    a, e = math.radians(sun['azimuth']), math.radians(sun['elevation'])
    return Vector((math.sin(a) * math.cos(e), math.cos(a) * math.cos(e), math.sin(e)))


def yol(*p):
    return os.path.join(*p)


def log(*a):
    print('[oda]', *a, flush=True)


# ---------------------------------------------------------------- doku kodlama (doğrusal → sRGB 8 bit)
def srgb(x):
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def kodla_kaydet(piksel, w, h, hedef, olcek, bicim='PNG', kalite=90):
    """piksel: doğrusal RGBA float (w*h*4). sqrt(ışık × ölçek) değerini sRGB 8 bit dosyaya yazar."""
    p = piksel.reshape(-1, 4).copy()
    p[:, :3] = srgb(np.sqrt(np.clip(p[:, :3] * olcek, 0.0, 1.0)))
    p[:, 3] = 1.0
    img = bpy.data.images.new(os.path.basename(hedef), w, h, alpha=False, float_buffer=False)
    img.colorspace_settings.name = 'sRGB'
    img.pixels.foreach_set(p.ravel().astype(np.float32))
    img.filepath_raw = hedef
    img.file_format = bicim
    if bicim in ('WEBP', 'JPEG'):
        bpy.context.scene.render.image_settings.quality = kalite
    img.save()
    return img


# ---------------------------------------------------------------- sahne, dünya, güneş
def sahne_kur(q):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = q['ornek']
    sc.view_settings.view_transform = 'AgX'  # yalnız Blender'da bakarken; pişen dokuya dönüşüm uygulanmaz
    aygit(sc)
    return sc


def aygit(sc):
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences
        pr.compute_device_type = 'OPTIX'
        pr.get_devices()
        for d in pr.devices:
            d.use = d.type == 'OPTIX'
        sc.cycles.device = 'GPU'
        log('aygıt: GPU (OptiX)')
    except Exception as e:  # GPU yoksa işlemci (yavaş ama çalışır)
        sc.cycles.device = 'CPU'
        log('aygıt: CPU', e)


def gok_donusu(hdr):
    """Gökyüzü haritasındaki güneşin yönü ile bizim güneşimizin yatay açı farkı (radyan): harita bununla döndürülür."""
    img = bpy.data.images.load(hdr, check_existing=True)
    w, h = img.size
    p = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(p)
    lum = p.reshape(h, w, 4)[:, :, :3].sum(axis=2)
    y, x = np.unravel_index(int(np.argmax(lum)), lum.shape)
    # Blender eşdikdörtgen düzeni (deneyle ölçüldü): u = 0,5 − atan2(y, x)/2π, v = 0,5 + asin(z)/π (v alttan)
    u, v = (x + 0.5) / w, (y + 0.5) / h
    phi, theta = (0.5 - u) * 2 * math.pi, (v - 0.5) * math.pi
    d = Vector((math.cos(theta) * math.cos(phi), math.cos(theta) * math.sin(phi), math.sin(theta)))
    return img, d


def dunya_kur(sc, o):
    hdr = yol(KAYNAK, 'qwantani_morning_puresky', 'qwantani_morning_puresky_2k.hdr')
    img, dh = gok_donusu(hdr)
    ds = gunese(o['SUN'])
    rho = math.atan2(dh.y, dh.x) - math.atan2(ds.y, ds.x)  # Rz(rho) · bizim yön = haritadaki yön
    w = bpy.data.worlds.new('gokyuzu')
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value[2] = rho
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = img
    sinir = nt.nodes.new('ShaderNodeVectorMath')
    sinir.operation = 'MINIMUM'
    sinir.inputs[1].default_value = (GOK_SINIR, GOK_SINIR, GOK_SINIR)
    bg = nt.nodes.new('ShaderNodeBackground')
    out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    nt.links.new(env.outputs['Color'], sinir.inputs[0])
    nt.links.new(sinir.outputs['Vector'], bg.inputs['Color'])
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    # Güneş: sabah, sıcak; açısı biraz geniş (gölge kenarı yumuşak)
    L = bpy.data.lights.new('gunes', 'SUN')
    L.energy = o['SUN']['strength']
    L.color = o['SUN']['color']
    L.angle = math.radians(1.5)
    ob = bpy.data.objects.new('gunes', L)
    sc.collection.objects.link(ob)
    ob.rotation_euler = ds.to_track_quat('Z', 'Y').to_euler()
    log(f'gök dönüşü {math.degrees(rho):.1f}°, güneş {o["SUN"]["azimuth"]}°/{o["SUN"]["elevation"]}°')
    return img, rho


# ---------------------------------------------------------------- malzemeler
def doku(ad, harita, renkli):
    i = bpy.data.images.load(yol(KAYNAK, ad, f'{ad}_{harita}_2k.jpg'), check_existing=True)
    i.colorspace_settings.name = 'sRGB' if renkli else 'Non-Color'
    return i


def pbr(ad, kaynak, ton=(1, 1, 1), puruz=None, doygunluk=1.0):
    m = bpy.data.materials.new(ad)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    d = nt.nodes.new('ShaderNodeTexImage')
    d.image = doku(kaynak, 'diff', True)
    carp = nt.nodes.new('ShaderNodeMix')
    carp.data_type = 'RGBA'
    carp.blend_type = 'MULTIPLY'
    carp.inputs['Factor'].default_value = 1.0
    carp.inputs[7].default_value = (*ton, 1)  # B rengi (RGBA girişi)
    renk = d.outputs['Color']
    if doygunluk != 1.0:  # dokunun rengini nötrler (bej sıva güneşte turuncuya kaçıyordu)
        hs = nt.nodes.new('ShaderNodeHueSaturation')
        hs.inputs['Saturation'].default_value = doygunluk
        nt.links.new(renk, hs.inputs['Color'])
        renk = hs.outputs['Color']
    nt.links.new(renk, carp.inputs[6])
    nt.links.new(carp.outputs[2], bsdf.inputs['Base Color'])
    r = nt.nodes.new('ShaderNodeTexImage')
    r.image = doku(kaynak, 'rough', False)
    nt.links.new(r.outputs['Color'], bsdf.inputs['Roughness'])
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = doku(kaynak, 'nor_gl', False)
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(n.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    if puruz is not None:
        nt.links.remove(bsdf.inputs['Roughness'].links[0])
        bsdf.inputs['Roughness'].default_value = puruz
    return m


def boya(ad, renk, puruz=0.5):
    m = bpy.data.materials.new(ad)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*renk, 1)
    bsdf.inputs['Roughness'].default_value = puruz
    return m


# ---------------------------------------------------------------- geometri: kutular (JS'teki box ile aynı: tabanı z, XY ortalı)
class Parca:
    """Aynı malzemeli kutuları tek nesnede toplar (tek pişirme dokusu)."""

    def __init__(self, ad, malzeme, karo=1000, pah=0.0, disa=True, cozunurluk='buyuk', sil=()):
        self.ad, self.malzeme, self.karo, self.pah, self.disa, self.coz = ad, malzeme, karo, pah, disa, cozunurluk
        self.sil = set(sil)  # hiç görünmeyen yüzlerin yönü ('+x', '-z' ...): silinir, pişirme dokusu boşa gitmez
        self.bm = bmesh.new()

    def kutu(self, w, d, h, x, y, z):
        x0, x1, y0, y1, z0, z1 = x - w / 2, x + w / 2, y - d / 2, y + d / 2, z, z + h
        v = [self.bm.verts.new(c) for c in ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                                             (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))]
        for f in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
            self.bm.faces.new([v[i] for i in f])

    def nesne(self, sc):
        if self.sil:
            self.bm.normal_update()
            yon = lambda n: max(('+x', n.x), ('-x', -n.x), ('+y', n.y), ('-y', -n.y), ('+z', n.z), ('-z', -n.z), key=lambda t: t[1])[0]
            bmesh.ops.delete(self.bm, geom=[f for f in self.bm.faces if yon(f.normal) in self.sil], context='FACES')
        me = bpy.data.meshes.new(self.ad)
        self.bm.to_mesh(me)
        self.bm.free()
        ob = bpy.data.objects.new(self.ad, me)
        sc.collection.objects.link(ob)
        me.materials.append(self.malzeme)
        # Doku koordinatı: kutu izdüşümü, dünya ölçüsünde (karo mm'de bir tekrar)
        uv = me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            n = poly.normal
            ax = max(range(3), key=lambda i: abs(n[i]))
            for li in poly.loop_indices:
                p = me.vertices[me.loops[li].vertex_index].co
                a, b = ((p.y, p.z), (p.x, p.z), (p.x, p.y))[ax]
                uv.data[li].uv = (a / self.karo, b / self.karo)
        me.uv_layers.new(name='BakeUV')
        if self.pah:
            bv = ob.modifiers.new('pah', 'BEVEL')
            bv.width = self.pah
            bv.segments = 2
            bv.limit_method = 'ANGLE'
        return ob


def ortam_kur(sc, o):
    R, G, B, S = o['ROOM'], o['GLASS'], o['BALCONY'], o['SILL']
    W = R['wall']
    by = R['y1'] + W / 2
    sp = lambda a, b: (b - a, (a + b) / 2)
    M = {
        'siva': pbr('siva', 'beige_wall_001', ton=(1.12, 1.12, 1.12), doygunluk=0.3),   # kırık beyaz boyalı sıva
        'tavan': pbr('tavan', 'beige_wall_001', ton=(1.2, 1.2, 1.2), doygunluk=0.2),
        'zemin': pbr('zemin', 'wood_floor'),
        'deck': pbr('deck', 'wood_floor', ton=(0.78, 0.74, 0.7)),
        'mermer': pbr('mermer', 'marble_01'),
        'koyu': boya('koyu_boya', (0.022, 0.022, 0.024), 0.45),
    }
    P = {
        'zemin': Parca('zemin', M['zemin'], 1400, sil=('-z', '+x', '-x', '+y', '-y')),
        'tavan': Parca('tavan', M['tavan'], 1500, cozunurluk='kucuk', sil=('+z',)),  # telefonun dikey kadrajında görünür
        'on_duvar': Parca('on_duvar', M['siva'], 1500, disa=False),
        'duvar_sol': Parca('duvar_sol', M['siva'], 1500, cozunurluk='kucuk', sil=('-x', '+z', '-z', '+y', '-y')),
        'duvar_sag': Parca('duvar_sag', M['siva'], 1500, cozunurluk='kucuk', sil=('+x', '+z', '-z', '+y', '-y')),
        'duvar_arka': Parca('duvar_arka', M['siva'], 1500, sil=('+y', '+z')),  # iç yüz ve açıklıkların kenarları kalır
        'pervaz': Parca('pervaz', M['mermer'], 700, pah=2.0, cozunurluk='kucuk'),
        'kasa': Parca('kasa', M['koyu'], 1000, pah=1.5, cozunurluk='kucuk'),
        'balkon_zemin': Parca('balkon_zemin', M['deck'], 1400, cozunurluk='kucuk', sil=('-z',)),
        'korkuluk': Parca('korkuluk', M['koyu'], 1000, cozunurluk='kucuk'),
        'balkon_duvar': Parca('balkon_duvar', M['siva'], 1500, cozunurluk='kucuk', sil=('+x', '+z', '-z')),
    }
    # Oda kabuğu (ön duvar yalnız pişirmede: ışığı kapatır, dışa aktarılmaz; kamera ön duvarın dışında durur)
    P['zemin'].kutu(R['x1'] - R['x0'], R['y1'] - R['y0'], 20, 0, 0, -20)
    P['tavan'].kutu(R['x1'] - R['x0'] + 2 * W, R['y1'] - R['y0'] + 2 * W, 40, 0, 0, R['h'])
    P['on_duvar'].kutu(R['x1'] - R['x0'] + 2 * W, W, R['h'], 0, R['y0'] - W / 2, 0)
    P['duvar_sol'].kutu(W, R['y1'] - R['y0'], R['h'], R['x0'] - W / 2, 0, 0)
    P['duvar_sag'].kutu(W, R['y1'] - R['y0'], R['h'], R['x1'] + W / 2, 0, 0)
    a = P['duvar_arka']
    w, x = sp(R['x0'] - W, G['x0']); a.kutu(w, W, R['h'], x, by, 0)
    w, x = sp(G['x1'], R['x1'] + W); a.kutu(w, W, R['h'], x, by, 0)
    w, x = sp(G['x0'], G['x1']); a.kutu(w, W, R['h'] - G['head'], x, by, G['head'])
    # Pencereler: alt duvar, mermer pervaz, kasa (cam açıklık kalır)
    for x0, x1 in ((G['x0'], G['door0']), (G['door1'], G['x1'])):
        w, x = sp(x0, x1)
        a.kutu(w, W, G['sill'], x, by, 0)
        P['pervaz'].kutu(w + S['over'], S['depth'], S['t'], x, R['y1'] - S['inset'], G['sill'] - S['t'])
        k, fh = P['kasa'], G['head'] - G['sill']
        for fw, fd, fz_h, fx, fz in ((w, 60, 50, x, G['sill']), (w, 60, 50, x, G['head'] - 50), (50, 60, fh, x0 + 25, G['sill']), (50, 60, fh, x1 - 25, G['sill']), (30, 50, fh, x, G['sill'])):
            k.kutu(fw, fd, fz_h, fx, by, fz)
    # Kapı kasası ve sürgülü kanatlar (iki kanat ortadan açılır, pencerelerin önünde durur)
    k = P['kasa']
    k.kutu(40, W + 20, G['head'], G['door0'] + 20, by, 0)
    k.kutu(40, W + 20, G['head'], G['door1'] - 20, by, 0)
    k.kutu(G['door1'] - G['door0'], W + 20, 40, (G['door0'] + G['door1']) / 2, by, G['head'] - 40)
    LW, LH, ty = (G['door1'] - G['door0']) / 2 + 20, G['head'] - 20, R['y1'] + W + 26
    for cx in (G['door0'] - LW / 2 + 30, G['door1'] + LW / 2 - 30):
        for fw, fh, fx, fz in ((LW, 40, 0, 0), (LW, 40, 0, LH - 40), (36, LH, -LW / 2 + 18, 0), (36, LH, LW / 2 - 18, 0)):
            k.kutu(fw, 30, fh, cx + fx, ty, fz)
    for z in (0, G['head']):
        k.kutu(G['x1'] - G['x0'], 46, 14, (G['x0'] + G['x1']) / 2, ty, z)
    # Balkon: döşeme, korkuluk, yan duvar
    y0 = R['y1'] + W
    bw, bcx = sp(B['x0'], B['x1'])
    bd, bcy = sp(y0, B['y1'])
    P['balkon_zemin'].kutu(bw, bd, 60, bcx, bcy, -60)
    kk = P['korkuluk']
    for w2, d2, x2, y2 in ((bw, 40, bcx, B['y1'] - 20), (40, bd, B['x0'] + 20, bcy)):
        kk.kutu(w2, d2, 40, x2, y2, 1010)
        kk.kutu(w2, d2, 30, x2, y2, 70)
    xx = B['x0'] + 80
    while xx < B['x1'] - 20:
        kk.kutu(18, 18, 910, xx, B['y1'] - 20, 100)
        xx += 120
    yy = y0 + 80
    while yy < B['y1'] - 40:
        kk.kutu(18, 18, 910, B['x0'] + 20, yy, 100)
        yy += 120
    P['balkon_duvar'].kutu(W, bd, R['h'], B['x1'] + W / 2, bcy, 0)
    # Süpürgelik: duvar diplerinde ahşap (kapı boşluğunda kesilir; ön duvar görünmez)
    SK = o['SKIRTING']
    sk = P['supurgelik'] = Parca('supurgelik', pbr('supurgelik', 'wood_floor', ton=(0.8, 0.74, 0.68)), 600, pah=1.0, cozunurluk='kucuk', sil=('-z',))
    sk.kutu(SK['t'], R['y1'] - R['y0'], SK['h'], R['x0'] + SK['t'] / 2, 0, 0)
    sk.kutu(SK['t'], R['y1'] - R['y0'], SK['h'], R['x1'] - SK['t'] / 2, 0, 0)
    for a0, a1 in ((R['x0'], G['door0']), (G['door1'], R['x1'])):
        w, x = sp(a0, a1)
        sk.kutu(w, SK['t'], SK['h'], x, R['y1'] - SK['t'] / 2, 0)
    # Gölge vekilleri: tarayıcıda gri kutu ya da canlı ışıklı eşya olan mobilya; pişirmede zemine ve duvara temas
    # gölgesi ve yansıyan ışık versin diye kaba kutular (dışa aktarılmaz, kendileri pişmez)
    V = {'beyaz': Parca('vekil_beyaz', boya('vekil_beyaz', (0.75, 0.75, 0.73), 0.5), disa=False),
         'koyu': Parca('vekil_koyu', boya('vekil_koyu', (0.05, 0.05, 0.055), 0.5), disa=False),
         'gri': Parca('vekil_gri', boya('vekil_gri', (0.45, 0.44, 0.42), 0.6), disa=False)}
    D, PE, F, SH, MO = o['DESK'], o['PEDESTAL'], o['FRIDGE'], o['SHELF'], o['MONITOR']
    w, x = sp(D['x0'], D['x1']); d, y = sp(D['y0'], D['y1'])
    V['beyaz'].kutu(w, d, D['t'], x, y, D['top'] - D['t'])
    for lx in (D['x0'] + 20, D['x1'] - 20):
        for ly in (D['y0'] + 20, D['y1'] - 20):
            V['koyu'].kutu(28, 28, D['top'] - D['t'], lx, ly, 0)
    V['gri'].kutu(PE['w'], PE['d'], PE['h'], PE['x'], PE['y'], 0)
    V['beyaz'].kutu(F['d'], F['w'], F['h'] - 20, F['x'], F['y'], 20)
    for z in SH['z']:
        V['koyu'].kutu(SH['w'], SH['d'], SH['t'], SH['x'], SH['y'], z)
    V['koyu'].kutu(240, 170, 110, -480, 1700, SH['z'][1] + SH['t'])          # üst raftaki kutu
    V['koyu'].kutu(MO['w'], 30, MO['h'], MO['x'], MO['y'] + 10, D['top'] + MO['lift'])  # monitör
    V['koyu'].kutu(230, 170, 8, MO['x'], MO['y'] + 20, D['top'])
    PC = o['PC']
    V['koyu'].kutu(PC['w'], PC['d'], PC['h'], PC['x'], PC['y'], 0)  # masa altındaki kasa
    CH = o['CHAIR']  # oyuncu koltuğu: oturak ve ayak (kaba; dönüşü yok sayılır)
    V['koyu'].kutu(500, 500, 100, CH['x'], CH['y'], 460)
    V['koyu'].kutu(560, 560, 40, CH['x'], CH['y'], 40)
    V['koyu'].kutu(60, 60, 400, CH['x'], CH['y'], 60)
    for ad, p in V.items():
        P['vekil_' + ad] = p
    nes = {ad: p.nesne(sc) for ad, p in P.items()}
    nes['kilim'] = kilim_kur(sc, o)
    P['kilim'] = Parca('kilim', None, disa=True, cozunurluk='buyuk')  # yalnız pişirme ayarı için (nesneyi kilim_kur kurdu)
    perde_kur(o, isikli=True)  # tül ışığı süzer (dışa aktarılmaz, kendisi pişmez; tarayıcıya oda-esya.glb ile gider)
    return nes, P


# ---------------------------------------------------------------- kilim: deseni koddan (lisans derdi yok)
def kilim_deseni(w, h, tohum=7):
    """Dokuma kilim deseni (RGB doğrusal, h × w): kökboya kırmızısı zemin, abraş (renk dalgası), bordürde zikzak,
    ortada basamaklı göl motifleri. Kilim dokunduğu için kenarlar basamaklı: hesap 'ilmek' hücrelerinde yapılır."""
    rng = np.random.default_rng(tohum)
    hucre = 6
    gw, gh = -(-w // hucre), -(-h // hucre)  # yukarı yuvarla: büyütülüp kırpılınca tam w × h kalsın
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    u, v = (xx + 0.5) / gw, (yy + 0.5) / gh
    lin = lambda c: np.array([(x / 255) ** 2.2 for x in c], np.float32)
    KIR, LAC, KREM, HAR, YES, KOY = lin((150, 38, 28)), lin((28, 36, 64)), lin((232, 216, 184)), lin((204, 146, 54)), lin((74, 98, 72)), lin((60, 22, 20))
    img = np.empty((gh, gw, 3), np.float32)
    img[:] = KIR
    img *= (0.92 + 0.08 * np.sin(v[..., None] * 37 + rng.random() * 6)) * (0.97 + 0.03 * rng.random((gh, 1, 1)))  # abraş
    kx, ky = np.minimum(u, 1 - u) * gw, np.minimum(v, 1 - v) * gh   # kenara uzaklık (hücre)
    kenar = np.minimum(kx, ky)
    B1, B2, B3 = 4, 14, 17
    img[kenar < B3] = HAR
    bant = (kenar >= B1) & (kenar < B2)
    img[bant] = LAC
    yol = np.where(kx < ky, yy, xx) % 12                        # bordürde zikzak (koşan köpek)
    zig = np.abs(yol - 6) + B1 + 1
    img[bant & (kenar < zig) & (kenar > zig - 3)] = KREM
    img[kenar < B1] = KOY
    # Ortada üç göl (basamaklı iç içe baklavalar), aralarda küçük göz motifleri
    cx = gw / 2
    for i, cy in enumerate((gh * 0.25, gh * 0.5, gh * 0.75)):
        d = np.abs(xx - cx) / (gw * 0.30) + np.abs(yy - cy) / (gh * 0.115)
        for r, renk in ((1.0, LAC), (0.82, KREM), (0.66, HAR if i % 2 else YES), (0.48, KIR), (0.32, LAC), (0.16, KREM)):
            img[(d < r) & (kenar >= B3 + 2)] = renk
        for dx in (-1, 1):
            g2 = np.abs(xx - (cx + dx * gw * 0.36)) + np.abs(yy - cy)
            img[(g2 < 4) & (kenar >= B3 + 2)] = KREM
            img[(g2 < 2) & (kenar >= B3 + 2)] = LAC
    img = np.repeat(np.repeat(img, hucre, axis=0), hucre, axis=1)[:h, :w]
    # Atkı ve çözgü dokusu: ince çizgiler
    ty, tx = np.mgrid[0:img.shape[0], 0:img.shape[1]]
    img *= (0.93 + 0.07 * (np.sin(ty * np.pi / 3) * 0.5 + 0.5))[..., None]
    img *= (0.97 + 0.03 * (np.sin(tx * np.pi / 2) * 0.5 + 0.5))[..., None]
    return img


def kilim_kur(sc, o):
    RG = o['RUG']
    w, d = RG['w'], RG['d']
    px_w, px_h = 1024, int(1024 * d / w)
    dz = kilim_deseni(px_w, px_h)
    img = bpy.data.images.new('kilim_deseni', px_w, px_h, alpha=False, float_buffer=True)
    rgba = np.concatenate([dz[::-1], np.ones((px_h, px_w, 1), np.float32)], axis=2)  # Blender pikselleri alttan
    img.pixels.foreach_set(rgba.ravel())
    m = bpy.data.materials.new('kilim')
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = img
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.95
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for vv in bm.verts:
        vv.co = Vector((RG['x'] + vv.co.x * w, RG['y'] + vv.co.y * d, 3 + vv.co.z * 6))
    me = bpy.data.meshes.new('kilim')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('kilim', me)
    sc.collection.objects.link(ob)
    me.materials.append(m)
    uv = me.uv_layers.new(name='UVMap')
    for poly in me.polygons:  # üst yüz 0..1 (desen), diğerleri kenarın rengini alır
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = ((co.x - RG['x']) / w + 0.5, (co.y - RG['y']) / d + 0.5)
    me.uv_layers.new(name='BakeUV')
    return ob


# ---------------------------------------------------------------- pişirme
def sec(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


def uv_ac(ob):
    sec(ob)
    ob.data.uv_layers.active = ob.data.uv_layers['BakeUV']
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    ob.data.uv_layers['UVMap'].active_render = True  # malzeme dokuları karo koordinatını kullanır


def pisir(ob, boyut, q):
    img = bpy.data.images.new('pis_' + ob.name, boyut, boyut, alpha=False, float_buffer=True)
    for m in ob.data.materials:
        n = m.node_tree.nodes.new('ShaderNodeTexImage')
        n.image = img
        uvn = m.node_tree.nodes.new('ShaderNodeUVMap')
        uvn.uv_map = 'BakeUV'
        m.node_tree.links.new(uvn.outputs['UV'], n.inputs['Vector'])
        m.node_tree.nodes.active = n
    sec(ob)
    t = time.time()
    bpy.ops.object.bake(type='COMBINED', pass_filter={'DIRECT', 'INDIRECT', 'DIFFUSE', 'EMIT'}, margin=max(4, boyut // 128),
                        margin_type='EXTEND', use_clear=True, target='IMAGE_TEXTURES')
    p = np.empty(boyut * boyut * 4, np.float32)
    img.pixels.foreach_get(p)
    hedef = yol(KAYNAK, 'pis', ob.name + '.png')
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    out = kodla_kaydet(p, boyut, boyut, hedef, OLCEK['ortam'])
    log(f'pişti {ob.name} {boyut}px {time.time() - t:.0f} sn, ortalama ışık {float(p.reshape(-1, 4)[:, :3].mean()):.3f}')
    return out


def isiksiz(ob, img):
    """Pişmiş dokuyu doğrudan çıkışa bağlar: glTF'ye KHR_materials_unlit olarak yazılır (tarayıcıda ışık hesabı yok)."""
    m = bpy.data.materials.new('pis_' + ob.name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    uvn = nt.nodes.new('ShaderNodeUVMap')
    uvn.uv_map = 'BakeUV'
    tx = nt.nodes.new('ShaderNodeTexImage')
    tx.image = img
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(uvn.outputs['UV'], tx.inputs['Vector'])
    nt.links.new(tx.outputs['Color'], out.inputs['Surface'])
    ob.data.materials.clear()
    ob.data.materials.append(m)
    ob.data.uv_layers.remove(ob.data.uv_layers['UVMap'])  # tek doku koordinatı kalsın (glTF'de TEXCOORD_0)


def pano_cek(sc, q, hedef):
    cam = bpy.data.cameras.new('pano')
    cam.type = 'PANO'
    cam.panorama_type = 'EQUIRECTANGULAR'
    cam.clip_start, cam.clip_end = 5, 100000  # sahne mm: varsayılan 100 birim kırpma kameraya 10 cm ötesini göstermiyordu
    ob = bpy.data.objects.new('pano', cam)
    sc.collection.objects.link(ob)
    ob.location = PANO_YERI
    ob.rotation_euler = (math.pi / 2, 0, -math.pi / 2)  # Blender eşdikdörtgen düzeni: yatay ortası +x yönü
    sc.camera = ob
    sc.render.resolution_x, sc.render.resolution_y = q['pano']
    sc.render.resolution_percentage = 100
    sc.cycles.samples = q['pano_ornek']
    sc.render.image_settings.file_format = 'OPEN_EXR'
    exr = yol(KAYNAK, 'pis', 'pano.exr')
    sc.render.filepath = exr
    t = time.time()
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(exr)
    w, h = img.size
    p = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(p)
    kodla_kaydet(p, w, h, hedef, OLCEK['pano'], 'WEBP', 88)
    log(f'pano {w}x{h} {time.time() - t:.0f} sn')


def disa_aktar(nesneler, hedef, isikli=False):
    bpy.ops.object.select_all(action='DESELECT')
    for ob in nesneler:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = nesneler[0]
    bpy.ops.export_scene.gltf(
        filepath=hedef, export_format='GLB', use_selection=True, export_yup=False, export_apply=True,
        export_normals=isikli, export_texcoords=True, export_materials='EXPORT', export_extras=True,
        export_image_format='WEBP', export_image_quality=85 if isikli else 82,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14, export_draco_texcoord_quantization=12, export_draco_normal_quantization=10,
        export_cameras=False, export_lights=False,
    )
    log(f'yazıldı {os.path.relpath(hedef, ROOT)} {os.path.getsize(hedef) / 1e6:.2f} MB')


# ---------------------------------------------------------------- gökyüzü (balkonun ardı)
def gok_yaz(img, hedef):
    w, h = img.size
    p = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(p)
    p = p.reshape(-1, 4)
    p[:, :3] = np.minimum(p[:, :3], GOK_SINIR)
    kodla_kaydet(p.ravel(), w, h, hedef, OLCEK['gok'], 'WEBP', 86)
    log(f'gök {w}x{h} yazıldı')


def gok_kirp(img, hedef, rho, lift):
    """Görünen yön aralığını (GOK_YAKIN) kaynak çözünürlüğünde keser. Tarayıcı kubbesi aynı eşlemeyi kullanır:
    u = 0,5 − (φ + rho)/2π (mod 1), v = 0,5 + (θ + lift)/π. Döner: kesitin dokudaki yeri (u0, du, v0, v1)."""
    w, h = img.size
    p = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(p)
    p = p.reshape(h, w, 4)  # Blender: satır 0 alttadır (v = 0)
    p[..., :3] = np.minimum(p[..., :3], GOK_SINIR)
    f0, f1 = (math.radians(a) for a in GOK_YAKIN['azimut'])
    t0, t1 = (math.radians(a) for a in GOK_YAKIN['yukseklik'])
    u0 = (0.5 - (f1 + rho) / (2 * math.pi)) % 1.0
    c0, cw = int(round(u0 * w)), int(round((f1 - f0) / (2 * math.pi) * w))
    r0 = int(round(min(max(0.5 + (t0 + lift) / math.pi, 0.0), 1.0) * h))
    r1 = int(round(min(max(0.5 + (t1 + lift) / math.pi, 0.0), 1.0) * h))
    k = np.ascontiguousarray(p[r0:r1][:, np.arange(c0, c0 + cw) % w])
    kodla_kaydet(k.ravel(), cw, r1 - r0, hedef, OLCEK['gok'], 'WEBP', 86)
    log(f'gök yakın kesit {cw}x{r1 - r0} ({w}x{h} kaynaktan)')
    return {'u0': c0 / w, 'du': cw / w, 'v0': r0 / h, 'v1': r1 / h}


# ---------------------------------------------------------------- çiçekler
BITKILER = [  # (kaynak, çözünürlük, nesne, yeni ad): ürünlerimizin içine konanlar (çiçek, yiyecek); tabanı orijinde, mm
    ('periwinkle_plant', '2k', 'periwinkle_plant_03_LOD0', 'cicek_a'),
    ('periwinkle_plant', '2k', 'periwinkle_plant_04_LOD0', 'cicek_b'),
    ('strawberry_chocolate_cake', '1k', 'strawberry_chocolate_cake', 'pasta'),  # pasta süsümüz üstüne batar
    ('anthurium_botany_01', '2k', 'anthurium_botany_01_b', 'balkon_bitki'),    # balkondaki büyük saksı
    ('flower_gazania', '2k', 'flower_gazania_h_LOD0', 'balkon_cicek'),         # balkondaki kase saksı
]


def bitki_yaz(hedef):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    tut = []
    for kay, res in sorted({(b[0], b[1]) for b in BITKILER}):
        bpy.ops.import_scene.gltf(filepath=yol(KAYNAK, kay, f'{kay}_{res}.gltf'))
    for kay, _, ad, yeni in BITKILER:
        ob = bpy.data.objects[ad]
        ob.matrix_world = Matrix.Scale(1000, 4) @ ob.matrix_world  # metre → mm
        bpy.context.view_layer.update()
        bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
        c = Vector(((min(v.x for v in bb) + max(v.x for v in bb)) / 2, (min(v.y for v in bb) + max(v.y for v in bb)) / 2, min(v.z for v in bb)))
        ob.matrix_world = Matrix.Translation(-c) @ ob.matrix_world
        ob.name = yeni
        tut.append(ob)
    for ob in list(bpy.context.scene.objects):
        if ob not in tut:
            bpy.data.objects.remove(ob, do_unlink=True)
    # Uzaktan görünen balkon bitkilerinde 1K doku yeter (dosya küçülür); yakından bakılan çiçek ve pasta olduğu gibi
    for ob in tut:
        if not ob.name.startswith('balkon_'):
            continue
        for m in ob.data.materials:
            for n in m.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image and n.image.size[0] > 1024:
                    n.image.scale(1024, 1024)
    disa_aktar(tut, hedef, isikli=True)


# ---------------------------------------------------------------- eşyalar: canlı ışıkta (yansıma ister, kapağı hareket eder)
def malzeme(ad, renk, puruz=0.5, metal=0.0, kaplama=0.0, kaplama_puruz=0.08, isik=None, isik_guc=0.0, isik_doku=None, cam=False):
    m = bpy.data.materials.new(ad)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*renk, 1)
    b.inputs['Roughness'].default_value = puruz
    b.inputs['Metallic'].default_value = metal
    if kaplama:
        b.inputs['Coat Weight'].default_value = kaplama
        b.inputs['Coat Roughness'].default_value = kaplama_puruz
    if cam:
        b.inputs['Transmission Weight'].default_value = 1.0
        b.inputs['IOR'].default_value = 1.5
    if isik_doku:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = bpy.data.images.load(isik_doku)
        nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = isik_guc
    elif isik:
        b.inputs['Emission Color'].default_value = (*isik, 1)
        b.inputs['Emission Strength'].default_value = isik_guc
    return m


def yk(ad, w, d, h, x, y, z, malz, pah=3.0, seg=3, ust=None):
    """Yuvarlatılmış kutu (tabanı z, XY ortalı): pah kenarı yumuşatır, düz yüzler düz kalır."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((x + v.co.x * w, y + v.co.y * d, z + h / 2 + v.co.z * h))
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(malz)
    if pah:
        bv = ob.modifiers.new('pah', 'BEVEL')
        bv.width = pah
        bv.segments = seg
        bv.limit_method = 'ANGLE'
        bv.harden_normals = True
        for poly in me.polygons:
            poly.use_smooth = True
    if ust:
        ob.parent = ust
    return ob


def silindir(ad, r, h, x, y, z, malz, ust=None, seg=32, eksen='z'):
    """eksen 'z': tabanı z'de, yukarı h; 'y' ya da 'x': merkezi (x, y, z), o eksen boyunca h (düğme, fiş, tekerlek).
    Nesnenin orijini dünya merkezinde kalır: döndürmek için nesneyi değil köşeleri çevir."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h)
    for v in bm.verts:
        a, b, c = v.co.x, v.co.y, v.co.z
        if eksen == 'z':
            v.co = Vector((x + a, y + b, z + h / 2 + c))
        elif eksen == 'y':
            v.co = Vector((x + a, y + c, z + b))
        else:
            v.co = Vector((x + c, y + b, z + a))
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(malz)
    if ust:
        ob.parent = ust
    return ob


def bos(ad, yer=(0, 0, 0), ust=None):
    ob = bpy.data.objects.new(ad, None)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = yer
    if ust:
        ob.parent = ust
    return ob


def ekran_yuzu(ad, w, h, x, y, z, malz, ust):
    """Ön yüzü −y'ye bakan dikdörtgen (doku koordinatı 0..1): monitör ekranı."""
    me = bpy.data.meshes.new(ad)
    v = [(x - w / 2, y, z), (x + w / 2, y, z), (x + w / 2, y, z + h), (x - w / 2, y, z + h)]
    me.from_pydata(v, [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap')
    for li, c in zip(me.polygons[0].loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[li].uv = c
    me.materials.append(malz)
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = ust
    return ob


def monitor_kur(o):
    """24" monitör: ince siyah çerçeve, alüminyum ayak; ekranda Kutu aracının sayfası. Orijin ayağın altı, ekran −y."""
    MO = o['MONITOR']
    alu = malzeme('alu', (0.78, 0.79, 0.8), puruz=0.32, metal=1.0)
    siyah = malzeme('siyah_plastik', (0.018, 0.018, 0.02), puruz=0.42)
    ekran = malzeme('ekran', (0.005, 0.005, 0.006), puruz=0.08, kaplama=1.0, kaplama_puruz=0.03,
                    isik_doku=yol(KAYNAK, 'ekran', 'kutu.png'), isik_guc=0.35)
    kok = bos('monitor')
    yk('monitor_ayak', 230, 170, 8, 0, 20, 0, alu, pah=3, ust=kok)
    yk('monitor_boyun', 52, 16, 300, 0, 46, 8, alu, pah=4, ust=kok)
    z0 = MO['lift']
    yk('monitor_govde', MO['w'] - 25, 26, MO['h'] - 40, 0, 26, z0 + 20, siyah, pah=10, ust=kok)
    yk('monitor_cerceve', MO['w'], 9, MO['h'], 0, 4, z0, siyah, pah=2, ust=kok)
    # Ekran çerçevenin ön yüzünden (y = −0,5) 2 mm önde: 0,1 mm'de uzaktan derinlik ayrımı yetmiyor, çerçeve ekranı titretiyordu
    ekran_yuzu('monitor_ekran', MO['w'] - 8, MO['h'] - 22, 0, -2.5, z0 + 16, ekran, kok)
    return kok


def buzdolabi_kur(o):
    """Mini buzdolabı (yer ve ölçü oda-olcu FRIDGE): yuvalar gri kutudakiyle aynı yükseklikte (raf, taban).
    Orijin gövdenin alt ortası, ön yüzü −x; kapak ayrı düğüm, orijini menteşede (tarayıcı döndürür)."""
    F = o['FRIDGE']
    d, w, h = F['d'], F['w'], F['h']
    govde_m = malzeme('buzdolabi_boya', (0.86, 0.86, 0.84), puruz=0.28, kaplama=0.6, kaplama_puruz=0.12)
    ic_m = malzeme('buzdolabi_ic', (0.93, 0.93, 0.92), puruz=0.38)
    conta = malzeme('conta', (0.32, 0.32, 0.33), puruz=0.7)
    cam = malzeme('raf_cami', (0.95, 0.97, 0.97), puruz=0.04, cam=True)
    alu = bpy.data.materials.get('alu') or malzeme('alu', (0.78, 0.79, 0.8), puruz=0.32, metal=1.0)
    siyah = bpy.data.materials.get('siyah_plastik') or malzeme('siyah_plastik', (0.018, 0.018, 0.02), puruz=0.42)
    lamba = malzeme('ic_lamba', (0.9, 0.9, 0.9), puruz=0.3, isik=(1.0, 0.97, 0.92), isik_guc=4.0)
    kok = bos('buzdolabi')
    # Gövde: kabuk, ön yüzü açık (iç oyuk kesilir; kesik yüzler iç kaplama malzemesini alır)
    g = yk('buzdolabi_govde', d, w, h - 20, 0, 0, 20, govde_m, pah=0, ust=kok)
    oy = yk('_oyuk', d - 20 + 2, w - 40, h - 20 - F['floor'] - 35, -11 - 1, 0, F['floor'], ic_m, pah=0)
    bo = g.modifiers.new('oyuk', 'BOOLEAN')
    bo.operation = 'DIFFERENCE'
    bo.object = oy
    bo.solver = 'EXACT'
    try:
        bo.material_mode = 'TRANSFER'
    except Exception:
        pass
    bpy.context.view_layer.objects.active = g
    bpy.ops.object.modifier_apply(modifier='oyuk')
    bpy.data.objects.remove(oy, do_unlink=True)
    bv = g.modifiers.new('pah', 'BEVEL')
    bv.width, bv.segments, bv.limit_method, bv.harden_normals = 8.0, 3, 'ANGLE', True
    for poly in g.data.polygons:
        poly.use_smooth = True
    # Cam raf (üstü raf yuvasının yüksekliğinde) ve ön çıtası, iç lamba, termostat düğmesi, ayaklar
    yk('buzdolabi_raf', d - 60, w - 44, 6, -15, 0, F['shelf'] - 6, cam, pah=1, ust=kok)
    yk('buzdolabi_raf_cita', 10, w - 44, 14, -d / 2 + 22, 0, F['shelf'] - 10, ic_m, pah=2, ust=kok)
    yk('buzdolabi_lamba', 60, 70, 8, 40, w / 2 - 70, h - 66, lamba, pah=2, ust=kok)
    silindir('buzdolabi_dugme', 17, 14, 120, -w / 2 + 34, h - 74, ic_m, ust=kok)
    for sx in (-1, 1):
        for sy in (-1, 1):
            silindir('buzdolabi_ayak', 14, 20, sx * (d / 2 - 40), sy * (w / 2 - 40), 0, siyah, ust=kok)
    # Kapak: menteşe arka köşede (gri kutudaki gibi -d/2, +w/2); dış panel, iç kaplama, conta, iki kapak rafı, kulp
    kp = bos('buzdolabi_kapak', (-d / 2, w / 2, 0), ust=kok)
    yk('kapak_panel', 26, w, h - 24, -13, -w / 2, 22, govde_m, pah=6, ust=kp)
    yk('kapak_ic', 10, w - 60, h - 110, 5, -w / 2, 60, ic_m, pah=4, ust=kp)
    for fw, fd, fh, fx, fy, fz in ((8, w - 20, 14, 2, -w / 2, 30), (8, w - 20, 14, 2, -w / 2, h - 34), (8, 14, h - 60, 2, -17, 34), (8, 14, h - 60, 2, -w + 17, 34)):
        yk('kapak_conta', fw, fd, fh, fx, fy, fz, conta, pah=2, ust=kp)
    # Kapak rafları ~9 cm derin (içecek kutusu Ø 66 sığsın): taban iç kaplamadan (x = 10) çıtaya, çıta önde
    for z in (280, 560):
        yk('kapak_rafi', 8, w - 110, 56, 96, -w / 2, z, ic_m, pah=2, ust=kp)
        yk('kapak_rafi_taban', 90, w - 110, 5, 55, -w / 2, z, ic_m, pah=1.5, ust=kp)
    yk('kapak_kulp', 14, 20, 320, -40, -w + 36, 360, alu, pah=3, ust=kp)
    for z in (372, 668):
        yk('kapak_kulp_ayak', 14, 16, 12, -30, -w + 36, z, alu, pah=2, ust=kp)
    return kok


def kablo(ad, noktalar, r, malz, ust):
    """Noktalardan geçen yumuşak kablo (Bezier eğrisi, kesit yarıçapı r) → örgü."""
    cu = bpy.data.curves.new(ad, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.resolution_u = 10
    sp_ = cu.splines.new('BEZIER')
    sp_.bezier_points.add(len(noktalar) - 1)
    for bp, co in zip(sp_.bezier_points, noktalar):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(ad, cu)
    bpy.context.scene.collection.objects.link(ob)
    cu.materials.append(malz)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.parent = ust
    return ob


def masa_alti_kur(o):
    """Dünya koordinatında (kök orijinde): kasa, priz ve fiş, kablo kanalı, kablolar, fare, mousepad."""
    D, PC, MT, MS, RW, SO, MO, R = o['DESK'], o['PC'], o['MAT'], o['MOUSE'], o['RACEWAY'], o['SOCKET'], o['MONITOR'], o['ROOM']
    yw = R['y1']  # arka duvarın iç yüzü
    siyah = bpy.data.materials.get('siyah_plastik') or malzeme('siyah_plastik', (0.018, 0.018, 0.02), puruz=0.42)
    kasa_m = malzeme('kasa_metal', (0.025, 0.025, 0.028), puruz=0.5, metal=0.4)
    on_m = malzeme('kasa_on', (0.012, 0.012, 0.014), puruz=0.3)
    beyaz = malzeme('beyaz_plastik', (0.86, 0.86, 0.84), puruz=0.42)
    kablo_m = malzeme('kablo', (0.02, 0.02, 0.022), puruz=0.6)
    kece = malzeme('kece', (0.06, 0.062, 0.066), puruz=0.95)
    led = malzeme('led', (0.9, 0.95, 1.0), puruz=0.3, isik=(0.75, 0.88, 1.0), isik_guc=3.0)
    kok = bos('masa_alti')
    # Kasa: gövde, ön panel, havalandırma yarıkları, güç düğmesi (ışıklı halka), ayaklar
    yk('kasa_govde', PC['w'], PC['d'], PC['h'] - 12, PC['x'], PC['y'], 12, kasa_m, pah=4, ust=kok)
    fy = PC['y'] - PC['d'] / 2
    yk('kasa_on', PC['w'] - 10, 6, PC['h'] - 24, PC['x'], fy - 2, 18, on_m, pah=2, ust=kok)
    for i in range(9):
        yk('kasa_yarik', PC['w'] - 70, 3, 5, PC['x'], fy - 5.5, 60 + i * 16, siyah, pah=1, ust=kok)
    silindir('kasa_dugme', 9, 4, PC['x'], fy - 6, PC['h'] - 50, siyah, ust=kok, eksen='y')
    silindir('kasa_led', 10.5, 1.5, PC['x'], fy - 4.5, PC['h'] - 50, led, ust=kok, eksen='y')
    for sx in (-1, 1):
        for sy in (-1, 1):
            yk('kasa_ayak', 30, 30, 12, PC['x'] + sx * (PC['w'] / 2 - 25), PC['y'] + sy * (PC['d'] / 2 - 30), 0, siyah, pah=3, ust=kok)
    # Priz (Schuko) ve fiş; güç kablosu kasanın arkasından prize
    yk('priz', 82, 10, 82, SO['x'], yw - 5, SO['z'] - 41, beyaz, pah=4, ust=kok)
    silindir('fis', 20, 26, SO['x'], yw - 23, SO['z'], beyaz, ust=kok, eksen='y')
    by = PC['y'] + PC['d'] / 2
    kablo('guc_kablosu', [(PC['x'] + 50, by + 5, 140), (PC['x'] - 20, by + 60, 30), (SO['x'] - 10, yw - 60, 120), (SO['x'], yw - 36, SO['z'])], 3.5, kablo_m, kok)
    # Kablo kanalı: monitörün arkasından yere kadar beyaz şerit (masanın arkasındaki boşluktan geçer)
    yk('kablo_kanali', 24, 14, RW['z1'] - RW['z0'], RW['x'], yw - 7, RW['z0'], beyaz, pah=2, ust=kok)
    yk('kanal_kapak_ust', 26, 16, 8, RW['x'], yw - 8, RW['z1'] - 4, beyaz, pah=2, ust=kok)
    yk('kanal_kapak_alt', 26, 16, 8, RW['x'], yw - 8, RW['z0'] - 4, beyaz, pah=2, ust=kok)
    mz = D['top'] + MO['lift'] + 120
    kablo('monitor_kablosu', [(MO['x'] + 30, MO['y'] + 40, mz), (MO['x'] + 110, MO['y'] + 120, mz - 40), (RW['x'] - 4, yw - 20, RW['z1'] - 30), (RW['x'], yw - 9, RW['z1'] - 10)], 3.0, kablo_m, kok)
    kablo('kasa_kablolari', [(RW['x'], yw - 9, RW['z0'] + 10), (RW['x'] + 40, yw - 40, 40), (PC['x'] - 60, by + 40, 90), (PC['x'] - 40, by + 2, PC['h'] - 90)], 4.0, kablo_m, kok)
    # Mousepad (klavye ve farenin altında) ve kablolu fare; kablo masanın arkasından kanala girer
    yk('mousepad', MT['w'], MT['d'], MT['t'], MT['x'], MT['y'], D['top'], kece, pah=1.2, ust=kok)
    zt = D['top'] + MT['t']
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0)
    for vv in bm.verts:
        z = max(vv.co.z, -0.55)
        vv.co = Vector((MS['x'] + vv.co.x * 31, MS['y'] + vv.co.y * 57, zt + (z + 0.55) * 22))
    me = bpy.data.meshes.new('fare')
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(malzeme('fare', (0.03, 0.03, 0.034), puruz=0.38, kaplama=0.4, kaplama_puruz=0.2))
    fo = bpy.data.objects.new('fare', me)
    bpy.context.scene.collection.objects.link(fo)
    fo.parent = kok
    silindir('fare_tekerlek', 4, 7, MS['x'], MS['y'] + 26, zt + 28, siyah, ust=kok, eksen='x')
    kablo('fare_kablosu', [(MS['x'], MS['y'] + 56, zt + 6), (MS['x'] - 10, MS['y'] + 160, zt + 2), (RW['x'] + 60, yw - 60, zt + 2), (RW['x'] + 12, yw - 8, zt - 10)], 1.6, kablo_m, kok)
    return kok


# ---------------------------------------------------------------- kahvaltı tabağı (buzdolabının üst rafı): somun, beyaz peynir
def soket(dugum, kimlik, cikis=False):
    return next(s for s in (dugum.outputs if cikis else dugum.inputs) if s.identifier == kimlik)


class Agac:
    """Procedural doku ağacını kısa yazmak için düğüm kurucu. Koordinat nesne uzayı (mm): ölçek 1/mm."""

    def __init__(self, nt):
        self.nt = nt
        self.tc = nt.nodes.new('ShaderNodeTexCoord').outputs['Object']

    def bagla(self, kaynak, hedef):
        if isinstance(kaynak, (int, float)):
            hedef.default_value = kaynak
        elif isinstance(kaynak, tuple):
            hedef.default_value = (*kaynak, 1)
        else:
            self.nt.links.new(kaynak, hedef)

    def gurultu(self, olcek, detay=4.0, puruz=0.55):
        n = self.nt.nodes.new('ShaderNodeTexNoise')
        self.bagla(self.tc, n.inputs['Vector'])
        n.inputs['Scale'].default_value, n.inputs['Detail'].default_value, n.inputs['Roughness'].default_value = olcek, detay, puruz
        return n.outputs['Fac']

    def hucre(self, olcek, rastgele=1.0):
        n = self.nt.nodes.new('ShaderNodeTexVoronoi')
        self.bagla(self.tc, n.inputs['Vector'])
        n.inputs['Scale'].default_value, n.inputs['Randomness'].default_value = olcek, rastgele
        return n.outputs['Distance']

    def aralik(self, deger, a, b, c=0.0, d=1.0):
        n = self.nt.nodes.new('ShaderNodeMapRange')
        self.bagla(deger, n.inputs['Value'])
        for ad, v in (('From Min', a), ('From Max', b), ('To Min', c), ('To Max', d)):
            n.inputs[ad].default_value = v
        return n.outputs['Result']

    def islem(self, tur, a, b=0.0):
        n = self.nt.nodes.new('ShaderNodeMath')
        n.operation = tur
        self.bagla(a, n.inputs[0])
        self.bagla(b, n.inputs[1])
        return n.outputs[0]

    def rampa(self, deger, duraklar):
        """duraklar: [(konum, (r, g, b)), ...] artan sırada; ilk ve son uçlara, aradakiler yeni durak."""
        n = self.nt.nodes.new('ShaderNodeValToRGB')
        self.bagla(deger, n.inputs['Fac'])
        el = n.color_ramp.elements
        (p0, c0), (p1, c1) = duraklar[0], duraklar[-1]
        el[0].position, el[0].color = p0, (*c0, 1)
        el[1].position, el[1].color = p1, (*c1, 1)
        for p, c in duraklar[1:-1]:
            el.new(p).color = (*c, 1)
        return n.outputs['Color']

    def karis(self, f, a, b, tur='MIX'):
        n = self.nt.nodes.new('ShaderNodeMix')
        n.data_type, n.blend_type = 'RGBA', tur
        for kimlik, x in (('Factor_Float', f), ('A_Color', a), ('B_Color', b)):
            self.bagla(x, soket(n, kimlik))
        return soket(n, 'Result_Color', cikis=True)

    def nitelik(self, ad):
        n = self.nt.nodes.new('ShaderNodeAttribute')
        n.attribute_name = ad
        return n.outputs['Fac']


def ekmek_agaci(A):
    """Somun kabuğu: tabanda soluk, yanlarda altın, tepede koyu; yarıkta açık renkli yırtık iç; altta un serpintisi."""
    ust, yarik = A.nitelik('ust'), A.nitelik('yarik')
    kat = A.rampa(ust, [(0.0, (0.66, 0.49, 0.29)), (0.16, (0.57, 0.32, 0.11)), (0.55, (0.40, 0.19, 0.055)), (1.0, (0.27, 0.115, 0.032))])
    benek = A.aralik(A.gurultu(0.055, 6.0, 0.62), 0.3, 0.72, 0.8, 1.16)
    kabuk = A.karis(1.0, kat, A.karis(1.0, (1, 1, 1), benek, 'MULTIPLY'), 'MULTIPLY')
    ic = A.rampa(A.gurultu(0.16, 5.0), [(0.3, (0.70, 0.50, 0.26)), (0.7, (0.84, 0.67, 0.42))])
    yf = A.aralik(A.islem('ADD', yarik, A.aralik(A.gurultu(0.09, 3.0), 0.3, 0.7, -0.25, 0.25)), 0.32, 0.62)
    renk = A.karis(yf, kabuk, ic)
    un_bolge = A.aralik(ust, 0.05, 0.45, 0.75, 0.0)
    un = A.islem('MULTIPLY', A.aralik(A.gurultu(0.035, 3.0), 0.5, 0.68), un_bolge)
    un = A.islem('MAXIMUM', un, A.islem('MULTIPLY', A.aralik(A.hucre(0.45), 0.0, 0.09, 0.9, 0.0), un_bolge))
    renk = A.karis(un, renk, (0.90, 0.85, 0.76))
    # Kabartı: ince kabarcıklar (hücre) ve gözenek; yarıkta daha pürüzlü yırtık
    yuk = A.islem('ADD', A.gurultu(0.22, 8.0, 0.6), A.islem('MULTIPLY', A.hucre(0.09, 0.9), 0.55))
    yuk = A.islem('ADD', yuk, A.islem('MULTIPLY', A.gurultu(0.6, 6.0, 0.7), yf))
    return renk, yuk, 1.1


def peynir_agaci(A):
    """Beyaz peynir: kırık beyaz, hafif sarımsı lekeler, küçük düzensiz gözenekler (koyu, çukur)."""
    ton = A.rampa(A.gurultu(0.07, 4.0), [(0.35, (0.79, 0.77, 0.67)), (0.7, (0.92, 0.905, 0.84))])
    goz = A.islem('MULTIPLY', A.aralik(A.hucre(0.28, 1.0), 0.0, 0.14, 1.0, 0.0), A.aralik(A.gurultu(0.05, 2.0), 0.38, 0.55))
    renk = A.karis(A.islem('MULTIPLY', goz, 0.85), ton, (0.55, 0.53, 0.46))
    yuk = A.islem('SUBTRACT', A.islem('MULTIPLY', A.gurultu(0.5, 5.0, 0.6), 0.35), goz)
    return renk, yuk, 0.8


def pisir_doku(sc, ob, boyut, kurucu, ad, puruz, kaplama=0.0):
    """Procedural renk ve kabartıyı dokuya pişirir (renk: EMIT, kabartı: teğet uzayı NORMAL) ve nesneye bu dokularla
    sade bir PBR malzeme verir (glTF: baseColor + normal; tarayıcıda canlı ışıkta)."""
    sec(ob)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.01, correct_aspect=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    m = bpy.data.materials.new('_pis_' + ad)
    m.use_nodes = True
    nt = m.node_tree
    A = Agac(nt)
    renk, yuk, mesafe = kurucu(A)
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    A.bagla(renk, b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 1.0
    bu = nt.nodes.new('ShaderNodeBump')
    bu.inputs['Distance'].default_value = mesafe
    A.bagla(yuk, bu.inputs['Height'])
    A.bagla(bu.outputs['Normal'], b.inputs['Normal'])
    ob.data.materials.clear()
    ob.data.materials.append(m)
    gor = {}
    for tur, renkli in (('EMIT', True), ('NORMAL', False)):
        img = bpy.data.images.new(f'{ad}_{"renk" if renkli else "normal"}', boyut, boyut, alpha=False)
        img.colorspace_settings.name = 'sRGB' if renkli else 'Non-Color'
        tx = nt.nodes.new('ShaderNodeTexImage')
        tx.image = img
        nt.nodes.active = tx
        sc.render.bake.normal_space = 'TANGENT'
        bpy.ops.object.bake(type=tur, margin=8, margin_type='EXTEND', use_clear=True, target='IMAGE_TEXTURES')
        img.pack()
        gor[tur] = img
    # Dışa aktarılacak malzeme: pişmiş renk + normal haritası, sabit pürüzlülük
    s = bpy.data.materials.new(ad)
    s.use_nodes = True
    nt = s.node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    tr = nt.nodes.new('ShaderNodeTexImage')
    tr.image = gor['EMIT']
    nt.links.new(tr.outputs['Color'], b.inputs['Base Color'])
    tn = nt.nodes.new('ShaderNodeTexImage')
    tn.image = gor['NORMAL']
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = puruz
    if kaplama:
        b.inputs['Coat Weight'].default_value = kaplama
        b.inputs['Coat Roughness'].default_value = 0.3
    ob.data.materials.clear()
    ob.data.materials.append(s)
    for nit in [a.name for a in ob.data.color_attributes]:
        ob.data.color_attributes.remove(ob.data.color_attributes[nit])


def yumusak(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def somun_kur(ad, L, W, Ht, Hb, yer, aci, ust):
    """Türk somunu: oval gövde, tepesinde boylamasına açılmış yarık ("kulaklı"), altı düz ve soluk.
    Köşe nitelikleri (doku pişirmesi için): ust 0 taban → 1 tepe, yarik 1 yarığın içi. Etiket yeri döner."""
    from mathutils import noise
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=112, v_segments=64, radius=1.0)
    sb = lambda t, p: math.copysign(abs(t) ** p, t)
    ca, sa = math.cos(aci), math.sin(aci)
    ust_l, yarik_l, etiket = [], [], None
    bm.verts.index_update()
    for v in bm.verts:
        sx, sy, sz = v.co  # küre kutupları ±z: ekmeğin uçları (+x / −x)
        x, y = sb(sz, 0.9) * L / 2, sb(sx, 0.8) * W / 2
        z = Hb + sb(sy, 0.8) * (Ht if sy > 0 else Hb)
        t = abs(x) / (L / 2)
        pen = yumusak(0.84, 0.5, t) * yumusak(0.35, 0.75, sy)  # yarık yalnız tepede ve uçlara varmadan
        yc = 2.5 * noise.noise(Vector((x * 0.02, 3.1, 0.7)))
        g = math.exp(-((y - yc) / 8.0) ** 2) * pen
        z += -14.0 * g + 4.5 * math.exp(-((abs(y - yc) - 15.0) / 6.5) ** 2) * pen
        nv = Vector((x / (L / 2) ** 2, y / (W / 2) ** 2, (z - Hb) / (Ht if z > Hb else Hb) ** 2))
        p = Vector((x, y, z)) + nv.normalized() * 2.4 * noise.noise(Vector((x, y, z)) * 0.017)
        if sy < -0.2:
            p.z = max(p.z, 0.0)  # taban rafa otursun
        ust_l.append(yumusak(0.08, 0.95, p.z / (Ht + Hb)))
        yarik_l.append(math.exp(-((y - yc) / 11.0) ** 2) * pen)
        if sy > 0.8 and (etiket is None or (x - 60) ** 2 + (y + 17) ** 2 < etiket[0]):
            etiket = ((x - 60) ** 2 + (y + 17) ** 2, p.copy())
        v.co = Vector((yer[0] + ca * p.x - sa * p.y, yer[1] + sa * p.x + ca * p.y, yer[2] + p.z))
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    for nad, deger in (('ust', ust_l), ('yarik', yarik_l)):
        ca_ = me.color_attributes.new(nad, 'FLOAT_COLOR', 'POINT')
        for i, d in enumerate(deger):
            ca_.data[i].color = (d, d, d, 1)
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = ust
    e = etiket[1]
    return ob, (yer[0] + ca * e.x - sa * e.y, yer[1] + sa * e.x + ca * e.y, yer[2] + e.z)


def peynir_kur(ad, w, d, h, yer, aci, ust, r=3.0, tohum=0.0):
    """Beyaz peynir kalıbı: kenarları yumuşak, yüzeyi hafif ufalanmış (gürültüyle) kutu."""
    from mathutils import noise
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=18, use_grid_fill=True)
    hx, hy, hz = w / 2, d / 2, h / 2
    ca, sa = math.cos(aci), math.sin(aci)
    for v in bm.verts:
        p = Vector((v.co.x * w, v.co.y * d, v.co.z * h))
        q = Vector((max(-hx + r, min(hx - r, p.x)), max(-hy + r, min(hy - r, p.y)), max(-hz + r, min(hz - r, p.z))))
        dv = p - q
        n = dv.normalized() if dv.length > 1e-6 else Vector((0, 0, 1))
        p = q + n * r if dv.length > 1e-6 else p
        p += n * 1.2 * noise.noise((p + Vector((tohum, tohum, tohum))) * 0.1)
        p.z = max(p.z + hz, 0.0)
        v.co = Vector((yer[0] + ca * p.x - sa * p.y, yer[1] + sa * p.x + ca * p.y, yer[2] + p.z))
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = ust
    return ob


def tabak_kur(ad, profil, malz, ust, adim=128):
    """Dönme gövdesi (profil: [(yarıçap, z), ...] mm, eksenden eksene kapalı yol)."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in profil]
    es = [bm.edges.new((a, b)) for a, b in zip(vs, vs[1:])]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=adim, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.01)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(ad)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(malz)
    ob = bpy.data.objects.new(ad, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = ust
    return ob


TABAK = [(0, 6.0), (95, 6.0), (108, 6.8), (120, 9.2), (132, 13.0), (142, 17.0), (148, 19.4), (150.5, 20.2), (152, 19.6),
         (152.4, 18.4), (151.2, 17.2), (146, 15.6), (134, 11.4), (120, 7.4), (106, 4.6), (92, 3.4), (86, 3.2), (84, 1.2),
         (82, 0.0), (74, 0.0), (72, 1.2), (70, 3.0), (0, 3.0)]  # Ø 305 mm sırlı taş tabak: düz orta, yükselen kenar, taban halkası


def kahvalti_kur(sc):
    """Buzdolabının üst rafındaki tabak (orijin tabağın alt ortası; ön yüzü −y, tarayıcı rafın yönüne çevirir):
    somun ve beyaz peynir. Dokular procedural, buradaki Cycles ile pişer. Kökün 'etiket' özelliği (glTF extras →
    three.js userData): "Gluten yok" etiketinin ekmeğe batacağı nokta."""
    kok = bos('kahvalti')
    tabak_kur('tabak', TABAK, malzeme('tabak_sir', (0.075, 0.12, 0.17), puruz=0.25, kaplama=0.8, kaplama_puruz=0.05), kok)
    somun, et = somun_kur('somun', 226, 106, 70, 12, (0, 24, 6), 0.12, kok)
    p1 = peynir_kur('peynir', 80, 54, 36, (-14, -66, 6), -0.22, kok, r=1.8, tohum=1.7)
    p2 = peynir_kur('peynir_dilim', 52, 36, 13, (54, -54, 6), 0.48, kok, r=1.5, tohum=5.3)
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 16
    aygit(sc)
    pisir_doku(sc, somun, 1024, ekmek_agaci, 'somun_kabuk', 0.62)
    for p in (p1, p2):
        pisir_doku(sc, p, 512, peynir_agaci, p.name + '_doku', 0.42, kaplama=0.25)
    kok['etiket'] = [round(c, 1) for c in et]
    log(f'kahvaltı tabağı: etiket yeri {list(kok["etiket"])}')
    return kok


# ---------------------------------------------------------------- perde (iki yan pencerede ince tül; kapı açık)
PERDE = {'y': 1774, 'dalga': 72, 'derin': 15, 'ust': 90, 'alt': 12, 'tasma': 100}  # mm: duvar önü, pli aralığı ve derinliği,
# kasanın üstünden kornişe, pervaza boşluk, pencerenin dış yanından taşma (kapı tarafında taşmaz)


def perde_yerleri(o):
    G = o['GLASS']
    return [(G['x0'] - PERDE['tasma'], G['door0']), (G['door1'], G['x1'] + PERDE['tasma'])]


def perde_malzemesi(isikli):
    """Pişirme için: ışığın yarısından fazlası doğrudan geçer (Transparent: doğrudan ışık sayılır, temiz pişer),
    kalanı tülde saçılır ve yansır. Dışa aktarma için sade beyaz (tarayıcı kendi tül gölgelendiricisini koyar)."""
    if not isikli:
        return malzeme('perde', (0.92, 0.9, 0.86), puruz=0.9)
    m = bpy.data.materials.new('perde_tul')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    gec = nt.nodes.new('ShaderNodeBsdfTransparent')
    sac = nt.nodes.new('ShaderNodeBsdfTranslucent')
    yan = nt.nodes.new('ShaderNodeBsdfDiffuse')
    for n in (sac, yan):
        n.inputs['Color'].default_value = (0.92, 0.9, 0.86, 1)
    k1 = nt.nodes.new('ShaderNodeMixShader')
    k1.inputs['Fac'].default_value = 0.5
    nt.links.new(sac.outputs[0], k1.inputs[1])
    nt.links.new(yan.outputs[0], k1.inputs[2])
    k2 = nt.nodes.new('ShaderNodeMixShader')
    k2.inputs['Fac'].default_value = 0.45  # 0,55 geçirgen
    nt.links.new(gec.outputs[0], k2.inputs[1])
    nt.links.new(k1.outputs[0], k2.inputs[2])
    nt.links.new(k2.outputs[0], out.inputs['Surface'])
    return m


def perde_kur(o, isikli=False):
    """Pilili tül panelleri ve kornişler (dünya koordinatı, kök orijinde). Köşe z'si kornişten aşağı: tarayıcı rüzgârı
    buna göre verir (üst sabit, etek salınır)."""
    G = o['GLASS']
    m, koyu = perde_malzemesi(isikli), (bpy.data.materials.get('siyah_plastik') or malzeme('siyah_plastik', (0.018, 0.018, 0.02), puruz=0.42))
    kok = bos('perde')
    zt, zb = G['head'] + PERDE['ust'], G['sill'] + PERDE['alt']
    for i, (xa, xb) in enumerate(perde_yerleri(o)):
        nx, nz = int((xb - xa) / 9), 40
        bm = bmesh.new()
        sira = []
        for j in range(nz + 1):
            v = j / nz
            satir = []
            for k in range(nx + 1):
                u = k / nx
                x = xa + u * (xb - xa)
                y = PERDE['y'] + PERDE['derin'] * math.sin(2 * math.pi * (x - xa) / PERDE['dalga']) * (1 + 0.3 * (1 - v))
                satir.append(bm.verts.new((x, y, zb + v * (zt - zb))))
            sira.append(satir)
        for j in range(nz):
            for k in range(nx):
                bm.faces.new((sira[j][k], sira[j][k + 1], sira[j + 1][k + 1], sira[j + 1][k]))
        me = bpy.data.meshes.new(f'perde_{i}')
        bm.to_mesh(me)
        bm.free()
        for poly in me.polygons:
            poly.use_smooth = True
        me.materials.append(m)
        ob = bpy.data.objects.new(f'perde_{i}', me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = kok
        silindir(f'kornis_{i}', 9, xb - xa + 40, (xa + xb) / 2, PERDE['y'] + 6, zt + 22, koyu, ust=kok, eksen='x', seg=16)
    return kok


# ---------------------------------------------------------------- oyuncu koltuğu (masanın sağ önü, halının üstünde)
def dondur(ob, rz):
    """Köşeleri dünya merkezi (nesne orijini) çevresinde z ekseninde döndürür (yk / silindir nesneleri için)."""
    ob.data.transform(Matrix.Rotation(rz, 4, 'Z'))
    return ob


def koltuk_kur(o):
    """Oyuncu koltuğu: beş kollu tekerlekli ayak, amortisör, kenarları kabarık oturak, kanatlı yüksek sırt (geriye eğik),
    boyun ve bel yastığı, kolçaklar. Siyah suni deri, Oktos turuncusu şeritler. Orijin zeminde, ayağın ortası; ön yüzü +y
    (tarayıcı CHAIR.rz kadar döndürür)."""
    deri = malzeme('deri_siyah', (0.022, 0.022, 0.025), puruz=0.42, kaplama=0.35, kaplama_puruz=0.3)
    serit = malzeme('deri_turuncu', (0.66, 0.13, 0.025), puruz=0.45, kaplama=0.3, kaplama_puruz=0.3)
    metal = malzeme('koltuk_metal', (0.06, 0.06, 0.065), puruz=0.25, metal=1.0)
    siyah = bpy.data.materials.get('siyah_plastik') or malzeme('siyah_plastik', (0.018, 0.018, 0.02), puruz=0.42)
    kok = bos('koltuk')
    # Ayak: beş kol, uçlarında tekerlek
    for k in range(5):
        a = math.radians(90 + 72 * k)
        dondur(yk('koltuk_kol', 300, 48, 30, 165, 0, 62, metal, pah=8, ust=kok), a)
        dondur(silindir('koltuk_teker', 27, 22, 300, 0, 28, siyah, ust=kok, eksen='y', seg=20), a)
    silindir('koltuk_gobek', 46, 40, 0, 0, 58, metal, ust=kok)
    silindir('koltuk_amortisor', 26, 340, 0, 0, 90, metal, ust=kok)
    silindir('koltuk_kilif', 33, 170, 0, 0, 92, siyah, ust=kok)
    yk('koltuk_mekanizma', 230, 230, 30, 0, 0, 430, siyah, pah=6, ust=kok)
    # Oturak: ortası alçak, kenarları kabarık; üstünde iki turuncu şerit
    yk('koltuk_oturak', 500, 500, 90, 0, 10, 460, deri, pah=30, ust=kok)
    for sx in (-1, 1):
        yk('koltuk_oturak_kenar', 80, 480, 46, sx * 215, 10, 525, deri, pah=24, ust=kok)
        yk('koltuk_oturak_serit', 26, 420, 6, sx * 110, 20, 548, serit, pah=3, ust=kok)
    # Kolçaklar
    for sx in (-1, 1):
        yk('koltuk_kolcak_ayak', 40, 60, 210, sx * 285, -10, 470, siyah, pah=8, ust=kok)
        yk('koltuk_kolcak', 90, 260, 30, sx * 285, 10, 680, siyah, pah=10, ust=kok)
    # Sırt: oturağın arkasında, 12° geriye eğik (kendi düğümünde)
    sirt = bos('koltuk_sirt', (0, -215, 545), ust=kok)
    sirt.rotation_euler[0] = math.radians(-12)
    yk('koltuk_sirt_pano', 500, 100, 820, 0, 0, 0, deri, pah=34, ust=sirt)
    for sx in (-1, 1):
        yk('koltuk_sirt_kanat', 70, 120, 560, sx * 228, 18, 90, deri, pah=30, ust=sirt)
        yk('koltuk_sirt_serit', 26, 4, 640, sx * 150, 51, 90, serit, pah=2, ust=sirt)
        yk('koltuk_kemer_yuvasi', 60, 4, 110, sx * 115, 51, 650, siyah, pah=10, ust=sirt)
    yk('koltuk_boyun_yastigi', 300, 70, 140, 0, 82, 640, deri, pah=30, ust=sirt)
    yk('koltuk_boyun_serit', 300, 4, 18, 0, 118, 702, serit, pah=6, ust=sirt)
    yk('koltuk_bel_yastigi', 340, 80, 160, 0, 86, 130, deri, pah=34, ust=sirt)
    return kok


def esya_yaz(o, hedef):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    kok = [monitor_kur(o), buzdolabi_kur(o), masa_alti_kur(o), kahvalti_kur(bpy.context.scene), perde_kur(o), koltuk_kur(o)]
    bpy.ops.object.select_all(action='DESELECT')
    for k in kok:
        k.select_set(True)
        for c in k.children_recursive:
            c.select_set(True)
    bpy.context.view_layer.objects.active = kok[0]
    bpy.ops.export_scene.gltf(
        filepath=hedef, export_format='GLB', use_selection=True, export_yup=False, export_apply=True,
        export_normals=True, export_texcoords=True, export_materials='EXPORT', export_extras=True,
        export_image_format='WEBP', export_image_quality=85,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_cameras=False, export_lights=False,
    )
    log(f'yazıldı {os.path.relpath(hedef, ROOT)} {os.path.getsize(hedef) / 1e6:.2f} MB')


# ---------------------------------------------------------------- tarayıcıda canlı ışıkta kullanılan dokular
DOKULAR = [('farm_soil', 'toprak', 512)]  # (kaynak, çıktı öneki, piksel): WebP; saksı ağzı ~12 cm, 512 px yeter


def doku_yaz():
    for kay, onek, px in DOKULAR:
        for harita, ad in (('diff', 'renk'), ('nor_gl', 'normal'), ('rough', 'puruz')):
            src = bpy.data.images.load(yol(KAYNAK, kay, f'{kay}_{harita}_2k.jpg'))
            src.scale(px, px)
            # Tek kanallı (gri) haritalar WebP'ye yazılamıyor: üç kanallı yeni görüntüye kopyalanır (değerler aynen)
            p = np.empty(px * px * 4, np.float32)
            src.pixels.foreach_get(p)
            img = bpy.data.images.new(f'{onek}-{ad}', px, px, alpha=False, float_buffer=False)
            img.colorspace_settings.name = 'sRGB' if harita == 'diff' else 'Non-Color'
            img.pixels.foreach_set(p)
            hedef = yol(CIKTI, f'{onek}-{ad}.webp')
            img.filepath_raw = hedef
            img.file_format = 'WEBP'
            bpy.context.scene.render.image_settings.quality = 82
            img.save()
            log(f'doku {os.path.basename(hedef)} {os.path.getsize(hedef) / 1e3:.0f} KB')


# ---------------------------------------------------------------- ana akış
def main():
    a = secenekler()
    kal = 'final' if a.final else 'onizleme'
    q, o = KALITE[kal], olcu_oku()
    parca = set(a.parca.split(','))
    cikti = {'ortam': ['oda-ortam.glb', 'oda-pano.webp', 'oda-ortam.json', '../../kaynak/oda.blend'], 'gok': ['oda-gok.webp', 'oda-gok-yakin.webp'], 'bitki': ['oda-bitki.glb'],
             'doku': [f'{o}-{h}.webp' for _, o, _ in DOKULAR for h in ('renk', 'normal', 'puruz')], 'esya': ['oda-esya.glb']}
    log(f'kalite {kal}: {q}')
    for p in sorted(parca):
        log(f'parça {p} → ' + ', '.join(os.path.normpath(yol('assets/oda', f)) for f in cikti[p]))
    if a.dry_run:
        log('--dry-run: hiçbir şey yazılmadı')
        return
    os.makedirs(CIKTI, exist_ok=True)
    meta_yol = yol(CIKTI, 'oda-ortam.json')
    meta = json.load(open(meta_yol, encoding='utf-8')) if os.path.exists(meta_yol) else {}
    if parca & {'ortam', 'gok'}:
        sc = sahne_kur(q)
        gok_img, rho = dunya_kur(sc, o)
        meta.update({'olcek': OLCEK, 'kodlama': 'sqrt-srgb', 'gunes': o['SUN']})
        if 'gok' in parca:  # manzara ayrı görüntüden; pişirmenin ışığı sabah gökyüzünde kalır
            m_img = bpy.data.images.load(yol(KAYNAK, MANZARA['id'], f"{MANZARA['id']}_{MANZARA['coz']}.hdr"))
            meta['gokDonus'] = (0.5 - MANZARA['u']) * 2 * math.pi - math.pi / 2  # +y yönüne u gelsin (deneyle ölçülen düzen)
            meta['gokYukselt'] = MANZARA['yukselt']
            meta['gokYakin'] = {'dosya': 'oda-gok-yakin.webp', **gok_kirp(m_img, yol(CIKTI, 'oda-gok-yakin.webp'), meta['gokDonus'], MANZARA['yukselt'])}
            if m_img.size[0] > 2048:
                m_img.scale(2048, 1024)  # tam görüntü yalnız kesitin dışı için: 2K yeter
            gok_yaz(m_img, yol(CIKTI, 'oda-gok.webp'))
            meta['gok'] = 'oda-gok.webp'
        if 'ortam' in parca:
            nes, P = ortam_kur(sc, o)
            for ob in nes.values():
                uv_ac(ob)
            bpy.ops.wm.save_as_mainfile(filepath=yol(KAYNAK, 'oda.blend'))  # pişirmeden önceki düzenlenebilir hâl
            disa = [nes[ad] for ad, p in P.items() if p.disa]
            for ob in disa:
                ob.data.uv_layers.active = ob.data.uv_layers['BakeUV']
                img = pisir(ob, q[P[ob.name].coz], q)
                isiksiz(ob, img)
            disa_aktar(disa, yol(CIKTI, 'oda-ortam.glb'))
            pano_cek(sc, q, yol(CIKTI, 'oda-pano.webp'))
            meta.update({'ortam': 'oda-ortam.glb', 'pano': 'oda-pano.webp', 'panoYeri': list(PANO_YERI), 'kalite': kal,
                         'nesneler': [ob.name for ob in disa]})
    if 'doku' in parca:
        doku_yaz()
    if 'esya' in parca:
        esya_yaz(o, yol(CIKTI, 'oda-esya.glb'))
        meta['esya'] = {'dosya': 'oda-esya.glb', 'koklar': ['monitor', 'buzdolabi', 'masa_alti', 'kahvalti', 'perde', 'koltuk'], 'perde': PERDE}
    if 'bitki' in parca:
        bitki_yaz(yol(CIKTI, 'oda-bitki.glb'))
        meta['bitki'] = {'dosya': 'oda-bitki.glb', 'cesitler': [b[3] for b in BITKILER]}
    meta['tarih'] = time.strftime('%Y-%m-%d %H:%M')
    json.dump(meta, open(meta_yol, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    log('bitti')


main()
