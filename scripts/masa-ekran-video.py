"""Masa ekranı döngüsü, 1. adım (Blender): Kadere Kınalı büstünü "Blender viewport" görünümünde döner tabla olarak çizer.

Amaç: Oda sahnesindeki masa monitörü için Biggie Blender'da çalışıyormuş gibi görünen 8 sn'lik kusursuz döngünün
  3B katmanı. Büst 240 karede tam 360° döner (kare 241 = kare 1, bu yüzden döngü dikişsiz). Zemin ızgarası ince
  çizgi geometrisidir (overlay render'a çıkmaz). Motor: Workbench, Studio ışık, gri kil (hızlı, viewport'un kendisi).
  Arka plan saydam bırakılır; degrade, ızgara solması ve arayüz çerçevesi 2. adımda (masa-ekran-kurgu.py) eklenir.
Girdi:
  blender.exe -b --factory-startup -P scripts/masa-ekran-video.py -- [--model GLB] [--cikti KLASOR] [--w 1044] [--h 688]
  Varsayılan model: assets/cati/modeller/kadere-kinali.glb (Draco; Blender glTF içe aktarıcısı açar).
Çıktı: KLASOR/v_0001.png ... v_0240.png (RGBA, viewport alanı, 2x boyut; 2. adım küçültür). Var olanların üzerine
  yazar (aynı girdiden aynı kareler; tekrar çalıştırmak güvenli). Varsayılan KLASOR: %TEMP%/masa-ekran-kareler.
"""
import argparse
import math
import os
import sys
import tempfile

import bpy
from mathutils import Vector

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--model", default=os.path.join(KOK, "assets", "cati", "modeller", "kadere-kinali.glb"))
ap.add_argument("--cikti", default=os.path.join(tempfile.gettempdir(), "masa-ekran-kareler"))
ap.add_argument("--w", type=int, default=1044)
ap.add_argument("--h", type=int, default=688)
ap.add_argument("--kare", type=int, default=240)
a = ap.parse_args(argv)
os.makedirs(a.cikti, exist_ok=True)

# Boş sahne
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# Model
bpy.ops.import_scene.gltf(filepath=a.model)
meshler = [o for o in sc.objects if o.type == "MESH"]
if not meshler:
    raise SystemExit("Modelde mesh yok: " + a.model)
# Portfolyo GLB'leri Z yukarı yazılır (export_yup=False); içe aktarıcı Y yukarı sanıp döndürür -> X'te -90° geri
from mathutils import Matrix
bpy.context.view_layer.update()
for o in [o for o in sc.objects if o.parent is None]:
    o.matrix_world = Matrix.Rotation(-math.pi / 2, 4, "X") @ o.matrix_world
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in meshler for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
boy = mx.z - mn.z
olcek = 2.6 / boy  # büst 2,6 birim yüksekliğe
merkez = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))

tabla = bpy.data.objects.new("Tabla", None)
sc.collection.objects.link(tabla)
kokler = [o for o in sc.objects if o.parent is None and o is not tabla]
for o in kokler:
    o.parent = tabla
    o.matrix_parent_inverse.identity()
    o.location = (o.location - merkez) * olcek
    o.scale = o.scale * olcek
for o in meshler:
    o.color = (0.80, 0.80, 0.80, 1.0)

# Döner tabla: kare 1 -> 0°, kare N+1 -> 360° (doğrusal), böylece N kare dikişsiz döner
tabla.rotation_euler = (0, 0, 0)
tabla.keyframe_insert("rotation_euler", index=2, frame=1)
tabla.rotation_euler = (0, 0, 2 * math.pi)
tabla.keyframe_insert("rotation_euler", index=2, frame=a.kare + 1)
try:
    for fc in tabla.animation_data.action.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
except AttributeError:  # katmanlı eylem API'si
    for lay in tabla.animation_data.action.layers:
        for st in lay.strips:
            for cb in st.channelbags:
                for fc in cb.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation = "LINEAR"

# Zemin ızgarası: ince şerit geometri (1 birim aralık, eksenler kırmızı/yeşil)
def serit(ad, p0, p1, gen, renk):
    d = (p1 - p0).normalized()
    n = Vector((-d.y, d.x, 0)) * gen / 2
    me = bpy.data.meshes.new(ad)
    me.from_pydata([p0 - n, p0 + n, p1 + n, p1 - n], [], [(0, 1, 2, 3)])
    ob = bpy.data.objects.new(ad, me)
    ob.color = renk
    sc.collection.objects.link(ob)

R = 10
GRI = (0.42, 0.42, 0.42, 1)
for i in range(-R, R + 1):
    if i == 0:
        continue
    serit(f"gx{i}", Vector((-R, i, 0)), Vector((R, i, 0)), 0.012, GRI)
    serit(f"gy{i}", Vector((i, -R, 0)), Vector((i, R, 0)), 0.012, GRI)
serit("eksenX", Vector((-R, 0, 0.0005)), Vector((R, 0, 0.0005)), 0.02, (0.62, 0.18, 0.22, 1))
serit("eksenY", Vector((0, -R, 0.0005)), Vector((0, R, 0.0005)), 0.02, (0.36, 0.55, 0.12, 1))

# Kamera: hafif yukarıdan, viewport perspektifi
cam_d = bpy.data.cameras.new("Kam")
cam_d.lens = 50
cam = bpy.data.objects.new("Kam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
hedef = Vector((0, 0, 1.25))
cam.location = Vector((0, -7.6, 3.4))
cam.rotation_euler = (hedef - cam.location).to_track_quat("-Z", "Y").to_euler()

# Workbench, Studio ışık, nesne rengi, saydam arka plan
for motor in ("BLENDER_WORKBENCH", "WORKBENCH"):
    try:
        sc.render.engine = motor
        break
    except TypeError:
        pass
sh = sc.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.cavity_type = "WORLD"
sh.show_specular_highlight = True
sc.display.render_aa = "16"
sc.render.film_transparent = True
sc.render.resolution_x = a.w
sc.render.resolution_y = a.h
sc.render.resolution_percentage = 100
sc.render.fps = 30
sc.frame_start = 1
sc.frame_end = a.kare
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.filepath = os.path.join(a.cikti, "v_####")
print("MOTOR", sc.render.engine, "STUDIO", sh.studio_light, "OLCEK", round(olcek, 4))
# İki geçiş: ızgara durağan olduğundan tek kare (izgara.png); büst ızgarasız 240 kare. 2. adım ızgarayı ufka doğru
# söndürüp büstü üstüne koyar (büst zeminde durur, önündeki zemin büstün altına düşer: örtme sırası doğru).
izgara = [o for o in sc.objects if o.name.startswith(("gx", "gy", "eksen"))]
for o in sc.objects:
    if o.type == "MESH":
        o.hide_render = o not in izgara
sc.frame_set(1)
sc.render.filepath = os.path.join(a.cikti, "izgara.png")
bpy.ops.render.render(write_still=True)
for o in sc.objects:
    if o.type == "MESH":
        o.hide_render = o in izgara
sc.render.filepath = os.path.join(a.cikti, "v_####")
bpy.ops.render.render(animation=True)
print("BITTI", a.cikti)
