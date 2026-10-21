# Çatı katı portfolyosunun heykel modelleri: kullanıcının döküm heykel STL'ini web için hafifletir ve kil/taş tozu
# döküm görünümü için girintilere koyu yıkama (vertex rengi, "dirty vertex colors") işler. Model mm, Z yukarı, tabanı
# z = 0'da ve XY'de ortalı; GLB Draco ile sıkışık, malzeme tek: taban rengi vertex renginden (tarayıcı tonla çarpar).
# Kullanım (depo kökünden; girdi yolu yerel, depoya yazılmaz):
#   blender -b --factory-startup --python scripts/portfolyo-model.py -- <girdi.stl> <cikti.glb> [--ucgen 12000] [--onizleme kare.png]
# Tekrar çalıştırmak güvenli: çıktının üzerine yazar (kaynak STL'e dokunmaz).
import bpy, bmesh, sys, math, os
from mathutils import Vector

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
GIRDI, CIKTI = arg[0], arg[1]
UCGEN = int(arg[arg.index('--ucgen') + 1]) if '--ucgen' in arg else 12000  # sergi masasında ~13 cm görünür: 12 bin yeter
ONIZLEME = arg[arg.index('--onizleme') + 1] if '--onizleme' in arg else None

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.wm.stl_import(filepath=GIRDI)
ob = bpy.context.selected_objects[0]
# Kaynak STL'in adı GLB'ye girmesin: nesne ve örgü çıktının adını alır
ob.name = ob.data.name = os.path.splitext(os.path.basename(CIKTI))[0]
bpy.context.view_layer.objects.active = ob
me = ob.data
ilk = len(me.polygons)

# Hafiflet: üçgen sayısı hedefe (kenar çöktürme)
if ilk > UCGEN:
    m = ob.modifiers.new('hafiflet', 'DECIMATE')
    m.ratio = UCGEN / ilk
    bpy.ops.object.modifier_apply(modifier=m.name)

# Tabana otur, XY'de ortala (mm)
bm = bmesh.new(); bm.from_mesh(me)
xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]; zs = [v.co.z for v in bm.verts]
kay = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
for v in bm.verts: v.co -= kay
bm.to_mesh(me); bm.free()
boy = (max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))

bpy.ops.object.shade_smooth()

# Girinti yıkaması: kirli vertex rengi (açıklar beyaz, girintiler koyu)
renk = me.color_attributes.new('yikama', 'BYTE_COLOR', 'POINT')
me.color_attributes.active_color = renk
bpy.ops.object.mode_set(mode='VERTEX_PAINT')
bpy.ops.paint.vertex_color_dirt(blur_strength=1.0, blur_iterations=2, clean_angle=math.pi, dirt_angle=0.0, dirt_only=False, normalize=True)
bpy.ops.object.mode_set(mode='OBJECT')

mat = bpy.data.materials.new('dokum')
mat.use_nodes = True
nt = mat.node_tree
bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
ca = nt.nodes.new('ShaderNodeVertexColor')
ca.layer_name = 'yikama'
nt.links.new(ca.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.88
me.materials.clear(); me.materials.append(mat)

if ONIZLEME:
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = 480, 360
    sc.render.filepath = ONIZLEME
    sc.world = bpy.data.worlds.new('d'); sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    h = max(boy)
    cam = bpy.data.objects.new('kam', bpy.data.cameras.new('kam')); sc.collection.objects.link(cam)
    cam.data.clip_start, cam.data.clip_end = 1, 100000
    cam.location = (h * 0.9, -h * 2.2, h * 0.75)
    yon = Vector((0, 0, boy[2] * 0.5)) - cam.location
    cam.rotation_euler = yon.to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    gun = bpy.data.objects.new('gun', bpy.data.lights.new('gun', 'SUN')); sc.collection.objects.link(gun)
    gun.data.energy = 3.5; gun.rotation_euler = (math.radians(50), 0, math.radians(35))
    bpy.ops.render.render(write_still=True)

bpy.ops.export_scene.gltf(filepath=CIKTI, export_format='GLB', use_selection=False, export_yup=False, export_apply=True,
                          export_vertex_color='ACTIVE', export_normals=True, export_texcoords=False, export_materials='EXPORT',
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_color_quantization=8)
print(f'MODEL {CIKTI} ilk {ilk} son {len(me.polygons)} boy {boy[0]:.1f} x {boy[1]:.1f} x {boy[2]:.1f}')
