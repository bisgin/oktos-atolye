"""Çatı katının saksı bitkilerini (Poly Haven, CC0) tek, küçük bir GLB'ye çevirir.

Amaç: çatı sahnesi (core/cati-sahne.js saksilar) bitkileri oda sahnesinin büyük bitki/yiyecek dosyası yerine yalnız
kendi bitkileriyle yüklesin: metre → mm, tabanı orijinde, doku en çok 1K (WebP), yaprak üçgenleri inceltilmiş, Draco.
Girdi:  kaynak/<id>/<id>_<çöz>.gltf (scripts/varlik-indir.py indirir; kaynak/ depoya girmez). Listede olup kaynağı
        bulunmayan bitki atlanır (log'a yazılır).
Çıktı:  assets/cati/bitkiler.glb (düğüm adları BITKILER'deki yeni adlar; çatı sahnesi bu adlarla arar)
Kullanım: blender -b --factory-startup --python scripts/cati-bitki.py -- [--dry-run]
  --dry-run: hangi kaynağın bulunduğunu ve neyin yazılacağını yazar, dosya yazmaz.
Tekrar çalıştırmak güvenli: çıktı her seferinde baştan yazılır (üzerine yazar; --dry-run ile önce bak).
"""
import os
import sys

import bpy
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(ROOT, 'kaynak')
HEDEF = os.path.join(ROOT, 'assets', 'cati', 'bitkiler.glb')
# (kaynak, çözünürlük, nesne, yeni ad, en çok üçgen)
BITKILER = [
    ('anthurium_botany_01', '2k', 'anthurium_botany_01_a', 'antoryum_a', 9000),
    ('anthurium_botany_01', '2k', 'anthurium_botany_01_c', 'antoryum_c', 6000),
    ('periwinkle_plant', '2k', 'periwinkle_plant_01_LOD0', 'menekse', 6000),
    ('calathea_orbifolia_01', '1k', None, 'kalatya', 9000),
    ('pachira_aquatica_01', '1k', None, 'pachira', 12000),
    ('fern_02', '1k', None, 'egrelti', 9000),
]
DOKU = 1024


def log(*a):
    print('[cati-bitki]', *a, flush=True)


def kaynak_yolu(kay, res):
    return os.path.join(KAYNAK, kay, f'{kay}_{res}.gltf')


def main():
    kuru = '--dry-run' in sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else False
    var = [b for b in BITKILER if os.path.exists(kaynak_yolu(b[0], b[1]))]
    for b in BITKILER:
        log(('var  ' if b in var else 'YOK  ') + b[0], '→', b[3])
    if kuru or not var:
        log('kuru çalıştırma' if kuru else 'hiç kaynak yok', '; yazılacak:', os.path.relpath(HEDEF, ROOT))
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    tut = []
    for kay, res in sorted({(b[0], b[1]) for b in var}):
        once = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=kaynak_yolu(kay, res))
        yeni = [o for o in bpy.data.objects if o not in once and o.type == 'MESH']
        for k2, r2, ad, yad, ucgen in [b for b in var if b[0] == kay]:
            # Nesne adı verilmediyse en çok üçgenli nesne (tek bitkili kaynaklarda saksı ayrıysa o atlanır: adında pot geçen)
            if ad:
                ob = bpy.data.objects.get(ad)
            else:
                aday = [o for o in yeni if 'pot' not in o.name.lower() and 'soil' not in o.name.lower()]
                ob = max(aday, key=lambda o: len(o.data.polygons)) if aday else None
            if not ob:
                log('bulunamadı', kay, ad)
                continue
            mw = ob.matrix_world.copy()
            ob.parent = None
            ob.matrix_world = Matrix.Scale(1000, 4) @ mw  # metre → mm
            bpy.context.view_layer.update()
            bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
            c = Vector(((min(v.x for v in bb) + max(v.x for v in bb)) / 2, (min(v.y for v in bb) + max(v.y for v in bb)) / 2, min(v.z for v in bb)))
            ob.matrix_world = Matrix.Translation(-c) @ ob.matrix_world
            ob.name = yad
            n = len(ob.data.polygons)
            if n > ucgen:
                d = ob.modifiers.new('incelt', 'DECIMATE')
                d.ratio = ucgen / n
            boy = max(v.z for v in bb) - min(v.z for v in bb)
            log(f'{yad}: {n} yüz → ~{min(n, ucgen)}, boy {boy:.0f} mm')
            tut.append(ob)
    for ob in list(bpy.context.scene.objects):
        if ob not in tut:
            bpy.data.objects.remove(ob, do_unlink=True)
    for ob in tut:
        for m in ob.data.materials:
            if not m or not m.node_tree:
                continue
            for nd in m.node_tree.nodes:
                if nd.type == 'TEX_IMAGE' and nd.image and nd.image.size[0] > DOKU:
                    nd.image.scale(DOKU, DOKU)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in tut:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = tut[0]
    os.makedirs(os.path.dirname(HEDEF), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=HEDEF, export_format='GLB', use_selection=True, export_yup=False, export_apply=True,
        export_normals=True, export_texcoords=True, export_materials='EXPORT', export_extras=False,
        export_image_format='WEBP', export_image_quality=82,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14, export_draco_texcoord_quantization=12, export_draco_normal_quantization=10,
        export_cameras=False, export_lights=False,
    )
    log(f'yazıldı {os.path.relpath(HEDEF, ROOT)} {os.path.getsize(HEDEF) / 1e6:.2f} MB')


main()
