# Armut koltuğun geometrisi, sitenin core/cati-esya.js armut() işlevinin Python kopyası (2026-11-04, v6).
# Amaç: Blender'daki tv_armut klibi armudun GERÇEK yüzeyine otursun (v5 kalça eklemini oturak yüksekliğine koyuyordu,
#       karakter armuda ~130 mm gömülüyordu). Aynı tohum, aynı profil eğrileri (three.js SplineCurve: tekdüze Catmull-Rom,
#       yay uzunluğuyla getPointAt), aynı kıvrım ve oyma: yüzey sitedekiyle birebir (doku, biye ve kulp hariç).
# Girdi: armut_kur(seed) (sitede oda-portfolyo.js armut({ seed: 1 })).
# Çıktı: {'verts': [(x, y, z) mm, armudun yerelinde: orijin tabanın merkezi, önü −y, z yukarı], 'faces': [...], 'P': parametreler}
# Kullanım: exec(open('scripts/karakter-armut-geo.py').read()) (karakter-klip-eylem.py ve karakter-klip-inceleme.py). Yan etki yok.
import math

ARMUT_PROFIL = [[330, 0], [395, 22], [432, 75], [448, 170], [440, 300], [412, 440], [368, 580], [310, 710],
                [245, 825], [180, 920], [118, 995], [62, 1045], [22, 1070], [0, 1078]]
ARMUT_DILIM, ARMUT_NC, ARMUT_NR = 6, 16, 64


def _rnd(seed):
    s = [seed & 0xffffffff]
    def r():
        s[0] = (s[0] * 1664525 + 1013904223) & 0xffffffff
        return s[0] / 4294967296
    return r


def _yumus(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def _sirt(x):
    s = math.sin(x / 2)
    return 2 * math.sqrt(s * s + 0.015) - 1.3


def _sar(a): return math.atan2(math.sin(a), math.cos(a))


class _Spline:
    """three.js SplineCurve (2B, tekdüze Catmull-Rom) + Curve.getPointAt / getTangentAt (200 bölümlük yay tablosu)"""
    def __init__(self, pts):
        self.p = [tuple(map(float, q)) for q in pts]
        n = 200
        self.L = [0.0]
        prev = self.nokta(0)
        for i in range(1, n + 1):
            c = self.nokta(i / n)
            self.L.append(self.L[-1] + math.hypot(c[0] - prev[0], c[1] - prev[1])); prev = c

    @staticmethod
    def _cr(t, p0, p1, p2, p3):
        v0 = (p2 - p0) * 0.5; v1 = (p3 - p1) * 0.5; t2 = t * t; t3 = t * t2
        return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1

    def nokta(self, t):
        P = self.p; n = len(P); p = (n - 1) * t; i = int(math.floor(p)); w = p - i
        p0 = P[i if i == 0 else i - 1]; p1 = P[min(i, n - 1)]
        p2 = P[n - 1 if i > n - 2 else i + 1]; p3 = P[n - 1 if i > n - 3 else i + 2]
        return (self._cr(w, p0[0], p1[0], p2[0], p3[0]), self._cr(w, p0[1], p1[1], p2[1], p3[1]))

    def u2t(self, u):
        L = self.L; il = len(L); hedef = u * L[-1]
        lo, hi = 0, il - 1
        while lo <= hi:
            i = (lo + hi) // 2; c = L[i] - hedef
            if c < 0: lo = i + 1
            elif c > 0: hi = i - 1
            else: hi = i; break
        i = hi
        if i >= il - 1: return 1.0
        if L[i] == hedef: return i / (il - 1)
        return (i + (hedef - L[i]) / (L[i + 1] - L[i])) / (il - 1)

    def at(self, u): return self.nokta(self.u2t(u))

    def teg(self, u):
        t = self.u2t(u); a = self.nokta(max(0.0, t - 1e-4)); b = self.nokta(min(1.0, t + 1e-4))
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1.0
        return (dx / L, dy / L)


def armut_kur(seed=1):
    r = _rnd(seed * 7919 + 13); H = 1030 + r() * 70
    P = {'H': H, 'oz': 405 + r() * 50, 'sirt': 45 + r() * 30, 'yaslan': 110 + r() * 70, 'yan': (r() - 0.5) * 90,
         'f1': r() * 6.28, 'f2': r() * 6.28, 'f3': r() * 6.28, 'f4': r() * 6.28, 'f5': r() * 6.28, 'kulp': 0.25 + r() * 0.45}
    kat = []
    for _ in range(5):
        b = r() * math.pi
        kat.append({'th': r() * 6.28, 'z': 250 + r() * 600, 'R': 130 + r() * 120, 'cb': math.cos(b), 'sb': math.sin(b),
                    'dalga': 100 + r() * 60, 'faz': r() * 6.28, 'A': 5 + r() * 5})
    dolu = _Spline([(pr, pz * H / 1078) for pr, pz in ARMUT_PROFIL])
    oz, sr = P['oz'], P['sirt']
    ot = _Spline([(330, 0), (398, 22), (436, 80), (452, 175), (446, 270), (426, oz - 85), (395, oz - 30), (345, oz + 2),
                  (265, oz + 12), (180, oz + 5), (115, oz + 12), (sr + 22, oz + 55), (sr + 4, oz + 160), (sr - 4, 0.66 * H),
                  (sr - 14, 0.8 * H), (16, 0.94 * H), (0, H)])
    L2 = ot.L[-1]; dilim = 2 * math.pi / ARMUT_DILIM

    def ubul(rh, zh):
        en, ed = 0.0, 1e18
        for i in range(401):
            p = ot.at(i / 400); d = math.hypot(p[0] - rh, p[1] - zh)
            if d < ed: ed, en = d, i / 400
        return en
    uOt, uDiz, uSirt = ubul(220, oz + 8), ubul(395, oz - 30), ubul(sr + 22, oz + 55)

    def smax(a, b, k): return (a + b + math.sqrt((a - b) * (a - b) + k * k)) / 2

    def nokta(th, u):
        uu = min(1.0, max(0.0, u)); ut = min(0.999, max(0.001, u))
        qd = dolu.at(uu); td = dolu.teg(ut); qs = ot.at(uu); ts = ot.teg(ut)
        rr, z = qd; nr, nz = td[1], -td[0]
        yer = (((th / dilim + 0.5) % 1) + 1) % 1
        W = _yumus(25, 150, z) * (1 - _yumus(0.78 * H, 0.97 * H, z)) * min(1, rr / 120)
        dikis = min(yer, 1 - yer) * dilim * rr
        d = 15 * (rr / 440) * (math.pow(math.sin(math.pi * yer), 0.7) - 0.62) * W
        d -= 4.5 * math.exp(-((dikis / 9) ** 2)) * W
        d += 9 * (math.sin(th * 3 + z * 0.006 + P['f1']) * math.sin(z * 0.011 + th * 2 + P['f2']) + 0.5 * math.sin(th * 5 - z * 0.017 + P['f3'])) \
            * _yumus(20, 140, z) * (1 - _yumus(0.85 * H, H, z)) * min(1, rr / 150)
        k_ = _sirt(z * 0.045 + 2.2 * math.sin(th * 2 + P['f2']) + P['f3']) * 7 * _yumus(40, 120, z) * (1 - _yumus(260, 420, z))
        k_ += _sirt(th * 11 + 0.8 * math.sin(z * 0.01 + P['f5'])) * 8 * _yumus(0.66 * H, 0.86 * H, z) * (1 - _yumus(0.93 * H, 0.99 * H, z)) * min(1, rr / 160)
        for k in kat:
            da = _sar(th - k['th']) * rr; db = z - k['z']; m = math.exp(-(da * da + db * db) / (k['R'] * k['R']))
            if m > 0.01: k_ += _sirt(((da * k['cb'] + db * k['sb']) / k['dalga']) * 2 * math.pi + k['faz']) * k['A'] * m * (1 - _yumus(0.85 * H, 0.95 * H, z))
        d += k_
        r2 = max(0.0, rr + d * nr)
        x = r2 * math.sin(th); y = -r2 * math.cos(th); zz = z + d * nz
        ys = -qs[0]; kes = _yumus(0, 230, ys - y)
        y = smax(y, ys, 30)
        zz += kes * (qs[1] - z)
        sS = (uu - uOt) * L2; rho = math.hypot(x, sS); psi = math.atan2(sS, x)
        k2 = _sirt(psi * 7 + P['f4'] + rho * 0.004) * 10 * math.exp(-(((rho - 190) / 120) ** 2))
        k2 += _sirt(x / 32 + 1.5 * math.sin(P['f1'] + x * 0.01)) * 5 * math.exp(-((((uu - uDiz) * L2) / 55) ** 2))
        k2 -= 12 * math.exp(-((((uu - uSirt) * L2) / 32) ** 2)) * (0.7 + 0.3 * math.sin(x * 0.03 + P['f2']))
        k2 *= kes
        y -= ts[1] * k2; zz -= ts[0] * k2
        t = max(0.0, zz / H)
        return (x + P['yan'] * t * t, y + P['yaslan'] * math.pow(t, 2.2), max(0.0, zz))

    verts, faces = [], []
    NC, NR = ARMUT_NC, ARMUT_NR
    for k in range(ARMUT_DILIM):
        th0 = (k + 0.5) * dilim; taban = len(verts)
        for j in range(NR + 1):
            for i in range(NC + 1): verts.append(nokta(th0 + (i / NC) * dilim, j / NR))
        for j in range(NR):
            for i in range(NC):
                a = taban + j * (NC + 1) + i; c = a + NC + 1
                faces.append((a, a + 1, c + 1, c))
    return {'verts': verts, 'faces': faces, 'P': P}


# ---- v7 (2026-11-04, kullanıcı: "koltuk pofuduk olacak, karakter içine gömülecek") ----
# Oturuş sonrası armut EZİLİR. Site (oda ajanı) aynı dönüşümü three.js'te uygular; tek kaynak bu işlev ve meta'daki
# tv: karakter_meta.klip.armut_yat.armut.gomulu (aynı parametreler, aynı formül). Armudun yerelinde (mm; orijin tabanın
# merkezi, önü −y, z yukarı), her köşe v = (x, y, z) için ezilmiş köşe D(v); ezilme oranı t (0..1) ile
#   v' = v + t · (D(v) − v)        (ezilme_egrisi: klibin karesi → t)
# D(v):
#   1. z haritası (parçalı doğrusal, orijinal z → yeni z): [[0, 0], [zs, S], [H, B]] — zs oturağın üst yüzü (orta çizgi
#      r 120–240'ın en yükseği, seed 1: 475,6), H armudun tepesi, S hedef oturak (220), B hedef sırt yüksekliği (650).
#   2. şişme (hacim yana kaçar): s = 1 + siskinlik · sin(π · min(1, max(0, z / zs)))  (orijinal z ile);
#      x ← x · s;  y ← y · (y < 0 ? 1 + (s − 1) · on_carpan : s)   (ön yüz daha az şişer: ayaklar önünde)
#   3. sırt yatışı (yumuşak kesme): y ← y + k · w · ln(1 + exp((z' − S) / w))   (z' 1. adımın sonucu; w yumusak_mm)
#      k ölçülerek seçilir: sırtın ön yüzü (|x| < 40, oturağın arkası) S + 80 … B − 80 arasında dikeyden sirt_egim_derece.
#   v8.2 (2026-11-05, kullanıcı: "armudun baş kısmı oturunca daha çok yayılıp yassılsın; sırtı ve başı anatomik yerleşsin";
#   "içine gömülsün"): iki ek terim (sitede core/cati-esya.js armutEzAlani aynı formül):
#   4. üst yayılma: u = smoothstep(zs, H, z) (orijinal z); x ← x · (1 + ust_yayilma · u); y > 0 (arka) ← y · (1 + ust_yayilma · u)
#   5. çukur (ortası yanlarından derin çöker: armudun kolları kalçanın iki yanında yüksek kalır):
#      z' ← z' − cukur_mm · exp(−(x / cukur_r_mm)²) · smoothstep(0, cukur_z_mm, z)
#   Sırt daha alçak (sirt_mm 650 → 560) ve daha yatık (40° → 48°): baş ve sırt armudun yayılan tepesine yaslanır.
ARMUT_GOMULU = {'oturak_mm': 250.0, 'sirt_mm': 560.0, 'sirt_egim_derece': 48.0, 'siskinlik': 0.08, 'on_carpan': 0.4, 'yumusak_mm': 40.0,
                'ust_yayilma': 0.16, 'cukur_mm': 55.0, 'cukur_r_mm': 190.0, 'cukur_z_mm': 260.0}


def _ss(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a))) if b != a else (1.0 if x >= b else 0.0)
    return t * t * (3 - 2 * t)


def armut_oturak_z(verts):
    """oturağın üst yüzü: orta çizgide (|x| < 40) önde r 120–240 arası en yüksek nokta (mm)"""
    return max(v[2] for v in verts if abs(v[0]) < 40 and -240 <= v[1] <= -120)


def armut_ez(v, E, t=1.0):
    """tek köşe (x, y, z) → ezilmiş köşe; E = armut_ez_kur() parametreleri"""
    x, y, z = v
    if t <= 0: return (x, y, z)
    zs, H, S, B = E['zs'], E['H'], E['oturak_mm'], E['sirt_mm']
    z2 = z * S / zs if z <= zs else S + (z - zs) * (B - S) / (H - zs)
    s = 1 + E['siskinlik'] * math.sin(math.pi * min(1.0, max(0.0, z / zs)))
    x2 = x * s
    y2 = y * (1 + (s - 1) * E['on_carpan'] if y < 0 else s)
    uy = E.get('ust_yayilma', 0.0) * _ss(zs, H, z)
    x2 *= 1 + uy
    if y > 0: y2 *= 1 + uy
    z2 -= E.get('cukur_mm', 0.0) * math.exp(-(x / E.get('cukur_r_mm', 1.0)) ** 2) * _ss(0.0, E.get('cukur_z_mm', 1.0), z)
    w = E['yumusak_mm']; a = (z2 - S) / w
    y2 += E['k'] * w * (a + math.log1p(math.exp(-a)) if a > 30 else math.log1p(math.exp(a)))
    return (x + t * (x2 - x), y + t * (y2 - y), z + t * (z2 - z))


def armut_sirt_egim(verts):
    """sırtın ön yüzünün dikeyden açısı (derece): orta çizgide, oturağın arkasında, S + 80 … B − 80 bantlarında en öndeki y'ye doğru"""
    S, B = ARMUT_GOMULU['oturak_mm'], ARMUT_GOMULU['sirt_mm']
    mid = [v for v in verts if abs(v[0]) < 40]
    pts = []
    for z0 in range(int(S + 80), int(B - 80), 20):
        b = [v for v in mid if z0 <= v[2] < z0 + 20 and v[1] > -150]
        if b: pts.append((z0 + 10, min(q[1] for q in b)))
    n = len(pts); mz = sum(p[0] for p in pts) / n; my = sum(p[1] for p in pts) / n
    b_ = sum((p[0] - mz) * (p[1] - my) for p in pts) / sum((p[0] - mz) ** 2 for p in pts)
    return math.degrees(math.atan(b_))


def armut_ez_kur(A):
    """A = armut_kur(seed) → ezme parametreleri (zs, H ölçülür; k sırt açısı hedefe oturana dek aranır)"""
    E = dict(ARMUT_GOMULU); E['zs'] = armut_oturak_z(A['verts']); E['H'] = max(v[2] for v in A['verts'])
    lo, hi = 0.0, 2.0
    for _ in range(30):
        E['k'] = (lo + hi) / 2
        a = armut_sirt_egim([armut_ez(v, E) for v in A['verts']])
        if a < E['sirt_egim_derece']: lo = E['k']
        else: hi = E['k']
    E['k'] = round((lo + hi) / 2, 4)
    return E
