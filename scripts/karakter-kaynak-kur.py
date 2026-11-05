# Karakterin dışa aktarım kaynağını kurar: Drive'daki bizzikoloşko.blend (orijinal, değiştirilmez) açılır, sitenin
# koltuğuna göre kurulan klipler (scripts/karakter-klipler.py: Sırt Açma, Koltukla Kayma), sunumun eylem klipleri
# (scripts/karakter-klip-eylem.py, v8.2: karakter-rig-v82.py + karakter-klip-v82.py) ve oturma geçişlerinin meta düzeltmesi (scripts/karakter-klip-otur.py) eklenir, oturma kliplerinde
# kalça ölçülür (yazdırılır) ve çalışma kopyası kaynak/karakter/ altına kaydedilir (depoya girmez).
# Kullanım (depo kökünden):
#   blender -b "<Drive>/bizzikoloşko.blend" --python scripts/karakter-kaynak-kur.py -- kaynak/karakter/bizzikolosko_site.blend
# Sonra: blender -b --factory-startup --python scripts/karakter-blender.py -- kaynak/karakter/bizzikolosko_site.blend assets/oda/karakter.glb
import bpy, os, sys, json

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
CIKTI = os.path.abspath(arg[0] if arg else 'kaynak/karakter/bizzikolosko_site.blend')
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# v8.2: rig iyileştirmesi (ön kol burgu + dirsek yardımcı kemikleri, ağırlık yumuşatma, karın kemiği) kliplerden ÖNCE
exec(open(os.path.join(KOK, 'scripts', 'karakter-rig-v82.py'), encoding='utf-8').read())
rig_v82()
# v8.5: kazağın manşeti bilekte elle birlikte (sağ kol "kopuk" görünüyordu; karakter-rig-v85.py)
exec(open(os.path.join(KOK, 'scripts', 'karakter-rig-v85.py'), encoding='utf-8').read())
bilek_v85()
exec(open(os.path.join(KOK, 'scripts', 'karakter-klipler.py'), encoding='utf-8').read())
ayak_duzelt()   # v8.3: Durma ve Yürüme'de ayak uçları ~7° dışa (ördek duruşu yok); bütün klipler bundan sonra kurulur
koltuk_al(os.path.join(KOK, 'assets', 'oda', 'oda-esya.glb'))
sirt_ac()
kaydir()
# Biggie'li sunumun eylem klipleri (buzdolabı, elma, yaslanma, eğilme, kumanda, kutu) ve oturma geçişlerinin meta düzeltmesi
for ek in ('karakter-armut-geo.py', 'karakter-klip-eylem.py', 'karakter-klip-otur.py'):
    exec(open(os.path.join(KOK, 'scripts', ek), encoding='utf-8').read())
eylemleri_kur()
otur_duzelt()
# v8.2: büst, fare, klavye basışları, elma dizisi (scripts/karakter-klip-v82.py)
exec(open(os.path.join(KOK, 'scripts', 'karakter-klip-v82.py'), encoding='utf-8').read())
for k in ('IK_kol.L', 'IK_kol.R', 'IK_bacak.L', 'IK_bacak.R'): rig[k] = 0.0   # FK klipler (Klavye Tuşlama) IK'sız ölçülür
# v8.3: büst tutuşu, fare, oturarak elma, masaya oturma/kalkma (karakter-klip-v83.py v82'nin işlevlerini ezer)
exec(open(os.path.join(KOK, 'scripts', 'karakter-klip-v83.py'), encoding='utf-8').read())
# v8.4: büst tutuşunda iki kol göğsün dışında, sağ bilek düz; siyah ergonomik fare ve avuçla kavrayış (karakter-klip-v84.py v83'ün işlevlerini ezer)
exec(open(os.path.join(KOK, 'scripts', 'karakter-klip-v84.py'), encoding='utf-8').read())
# v8.5: fareye hızlı ve kavrayış biçimli giriş (v82_fare'yi ezer), buzdolabında gövde açıklığın dışında (buzdolabi'yi ezer)
exec(open(os.path.join(KOK, 'scripts', 'karakter-klip-v85.py'), encoding='utf-8').read())
for a in (buzdolabi('buzdolabi_ac', False), buzdolabi('buzdolabi_bos', True)): print('EYLEM_V85', a.name, tuple(a.frame_range))
for a in v82_bust() + v82_fare() + v82_klavye() + v82_elma() + v83_elma_otur() + v83_masa(): print('EYLEM_V82', a.name, tuple(a.frame_range), a.get('site_meta', '')[:200])
OLCUM_V7.setdefault('zincir', {}).update(zincir_olc([('bust_al_alt', 'bust_tut'), ('bust_al_orta', 'bust_tut'), ('bust_tut', 'bust_tut'),
    ('bust_tut', 'bust_birak_alt'), ('bust_tut', 'bust_birak_orta'), ('fare', 'fare'), ('elma_tut', 'elma_tut'), ('elma_tut', 'elma_isir_1'),
    ('elma_isir_1', 'elma_tut'), ('elma_isir_2', 'elma_isir_3'), ('elma_isir_4', 'elma_tut'), ('elma_tut', 'elma_firlat'),
    ('elma_tut_otur', 'elma_isir_otur_1'), ('elma_isir_otur_1', 'elma_tut_otur'), ('elma_isir_otur_4', 'elma_tut_otur'), ('elma_tut_otur', 'elma_firlat_otur'),
    ('elma_firlat_otur', 'Klavye Tuşlama'), ('masa_otur', 'Klavye Tuşlama'), ('Klavye Tuşlama', 'masa_kalk')]))
OLCUM_V82['v83'] = OLCUM_V83
OLCUM_V82['v84'] = OLCUM_V84
OLCUM_V82['v85'] = OLCUM_V85
bpy.context.scene['olcum_v82'] = json.dumps(OLCUM_V82, ensure_ascii=False)
print('OLCUM_V82', json.dumps(OLCUM_V82, ensure_ascii=False))
bpy.context.scene['olcum_v7'] = json.dumps(OLCUM_V7, ensure_ascii=False)

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
