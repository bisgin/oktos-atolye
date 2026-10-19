# Karakterin dışa aktarım kaynağını kurar: Drive'daki bizzikoloşko.blend (orijinal, değiştirilmez) açılır, sitenin
# koltuğuna göre kurulan klipler (scripts/karakter-klipler.py: Sırt Açma, Koltukla Kayma) eklenir, oturma kliplerinde
# kalça ölçülür (yazdırılır) ve çalışma kopyası kaynak/karakter/ altına kaydedilir (depoya girmez).
# Kullanım (depo kökünden):
#   blender -b "<Drive>/bizzikoloşko.blend" --python scripts/karakter-kaynak-kur.py -- kaynak/karakter/bizzikolosko_site.blend
# Sonra: blender -b --factory-startup --python scripts/karakter-blender.py -- kaynak/karakter/bizzikolosko_site.blend assets/oda/karakter.glb
import bpy, os, sys

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
CIKTI = os.path.abspath(arg[0] if arg else 'kaynak/karakter/bizzikolosko_site.blend')
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

exec(open(os.path.join(KOK, 'scripts', 'karakter-klipler.py'), encoding='utf-8').read())
koltuk_al(os.path.join(KOK, 'assets', 'oda', 'oda-esya.glb'))
sirt_ac()
kaydir()

# Ölçüm: kalçanın armatür uzayında y (arka +) ve z'si (Blender birimi; sitede × 1,5 × 1000 mm)
def kalca(ad, f):
    act = bpy.data.actions[ad]
    rig.animation_data.action = act
    if act.slots: rig.animation_data.action_slot = act.slots[0]
    bpy.context.scene.frame_set(f)
    h = rig.pose.bones['kalça'].head
    return round(h.y, 4), round(h.z, 4)
for ad, son in (('Hareket - Oturmaya Geçiş', 68), ('Hareket - Koltuğa Oturma', 164)):
    print('OLCU', ad, [(f, *kalca(ad, f)) for f in range(1, son + 1, 4)] + [(son, *kalca(ad, son))])
print('OLCU yaz', kalca('Hareket - Klavye Tuşlama', 1), 'bekle', kalca('Hareket - Masada Bekleme', 1))

rig.animation_data.action = bpy.data.actions['Hareket - Durma']
os.makedirs(os.path.dirname(CIKTI), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=CIKTI, copy=True)
print('KAYDEDILDI', CIKTI)
