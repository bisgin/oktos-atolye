"""Oda sahnesinin ortamını Blender'da kurar, ışığı dokulara pişirir ve tarayıcı için dışa aktarır (docs/oda-sahnesi.md).

Amaç: fotogerçekçi oda kabuğu (zemin, duvarlar, mermer pervazlar, pencere/kapı kasaları, sürgülü kanatlar, balkon,
korkuluk). Işık ve gölge Cycles ile önceden hesaplanıp dokuya yazılır ("pişirme"); tarayıcı yeniden hesaplamaz.
Ürünlerimiz bu dosyada yok: tarayıcıda canlı ışıkta durur. Cam, Blender'da açıklık olarak kalır (güneş geçsin);
tarayıcıda gerçek cam malzemesiyle çizilir.
Girdi:  core/oda-olcu.js (ölçüler ve güneş; tarayıcıyla ortak), kaynak/ (Poly Haven dokuları, gökyüzü ve çiçekler;
        scripts/varlik-indir.py)
Çıktı:  assets/oda/oda-ortam.glb   pişmiş, ışıksız malzemeli oda kabuğu (Draco + WebP)
        assets/oda/oda-pano.webp   ürünlerin yansıması için odanın 360° görüntüsü
        assets/oda/oda-gok.webp    balkonun ardındaki gökyüzü
        assets/oda/oda-bitki.glb   saksılardaki çiçekler (ışıklı malzeme, 2K doku)
        assets/oda/toprak-*.webp   saksı toprağı (renk, normal, pürüzlülük; 1K)
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


def secenekler():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser(prog='oda-blender')
    ap.add_argument('--final', action='store_true')
    ap.add_argument('--parca', default='ortam,gok,bitki,doku')
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
    return sc


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
        'tavan': Parca('tavan', M['tavan'], 1500, disa=False),
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
    # Oda kabuğu (ön duvar ve tavan yalnız pişirmede: ışığı kapatır, dışa aktarılmaz; kamera ön duvarın dışında durur)
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
    return {ad: p.nesne(sc) for ad, p in P.items()}, P


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


# ---------------------------------------------------------------- çiçekler
BITKILER = [  # (kaynak, nesne, yeni ad): saksılarımıza dikilecek çeşitler, tabanı orijinde, mm
    ('periwinkle_plant', 'periwinkle_plant_03_LOD0', 'cicek_a'),
    ('periwinkle_plant', 'periwinkle_plant_04_LOD0', 'cicek_b'),
]


def bitki_yaz(hedef):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    tut = []
    for kay in sorted({b[0] for b in BITKILER}):
        bpy.ops.import_scene.gltf(filepath=yol(KAYNAK, kay, f'{kay}_2k.gltf'))
    for kay, ad, yeni in BITKILER:
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
    disa_aktar(tut, hedef, isikli=True)


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
    cikti = {'ortam': ['oda-ortam.glb', 'oda-pano.webp', 'oda-ortam.json', '../../kaynak/oda.blend'], 'gok': ['oda-gok.webp'], 'bitki': ['oda-bitki.glb'],
             'doku': [f'{o}-{h}.webp' for _, o, _ in DOKULAR for h in ('renk', 'normal', 'puruz')]}
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
        meta.update({'olcek': OLCEK, 'kodlama': 'sqrt-srgb', 'gokDonus': rho, 'gunes': o['SUN']})
        if 'gok' in parca:
            gok_yaz(gok_img, yol(CIKTI, 'oda-gok.webp'))
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
            for ad in ('tavan', 'on_duvar'):  # pişirmede ışığı kapattılar; tarayıcıya gitmez
                nes[ad].hide_render = True
            disa_aktar(disa, yol(CIKTI, 'oda-ortam.glb'))
            pano_cek(sc, q, yol(CIKTI, 'oda-pano.webp'))
            meta.update({'ortam': 'oda-ortam.glb', 'pano': 'oda-pano.webp', 'panoYeri': list(PANO_YERI), 'kalite': kal,
                         'nesneler': [ob.name for ob in disa]})
    if 'doku' in parca:
        doku_yaz()
    if 'bitki' in parca:
        bitki_yaz(yol(CIKTI, 'oda-bitki.glb'))
        meta['bitki'] = {'dosya': 'oda-bitki.glb', 'cesitler': [b[2] for b in BITKILER]}
    meta['tarih'] = time.strftime('%Y-%m-%d %H:%M')
    json.dump(meta, open(meta_yol, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    log('bitti')


main()
