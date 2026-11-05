// Biggie'nin büstü tutuşu (v8.1, 2026-11-05; kullanıcı: "alış animasyonu güzel, eller ve parmaklar yanlış"). Klip
// (kitap_al_*) karede kolları ve elleri yazdıktan sonra çalışma anında üzerine yazılır; karakter.glb yeniden kurulmaz:
//  - sağ el büstü alttan tutar: avuç yukarı, avucun yüzü büstün tabanının biraz altında, parmaklar Biggie'nin önüne;
//  - sol el büstün belinde (v8.2; önce arkadan): avuç büstün sol yanına dönük, parmaklar öne;
//  - kollar iki kemikli IK ile (üst kol, ön kol; dirsek aşağı ve dışa), el yönü avucun çatısından (parmak kökleri, bilek);
//  - parmaklar büste doğru kıvrılır ama her eklem büstün yerel kutusunun dışında kalır (kutunun dışı büstün dışıdır):
//    alttaki elde eklemler tabanın altında, arkadakinde arka yüzün dışında; kıvrım bunu bozacaksa o parmakta azalır;
//  - boyun ve baş büste döner (boyun %40, baş %60; en çok 20°: büyük baş fazla eğilince yüzü kameradan saklıyordu).
// Ağırlık w (0..1) her şeyi kliple karıştırır (sunum alırken ve bırakırken 0,5 sn'de açıp kapatır). Klibin yazdığı
// kemikler her karede karıştırıcıdan yeniden gelir (bu kemiklerin hepsi kitap_al_* kliplerinde canlı): üst üste binmez.
// Birim: dünya mm. Girdi: karakterin modeli (kemikler adla bulunur; three.js addaki noktayı atar: 'tutma.R' → 'tutmaR').
import * as THREE from 'three';

const V = () => new THREE.Vector3();
const Q = () => new THREE.Quaternion();
const ZEK = new THREE.Vector3(0, 0, 1);
const PARMAK = [1, 2, 3, 4];

export function bustTutusu(model) {
  // Ad önce kemiklerde aranır ('kafa' adında bir ağ da var: getObjectByName ilk bulduğunu, ağı veriyordu)
  const kemikler = new Map();
  model.traverse?.((o) => { if (o.isBone && !kemikler.has(o.name)) kemikler.set(o.name, o); });
  const k = (ad) => kemikler.get(ad) ?? model.getObjectByName(ad) ?? null;
  const el = (y) => ({
    ust: k(`üst_kol${y}`), on: k(`ön_kol${y}`), el: k(`el${y}`),
    parmak: PARMAK.map((i) => [1, 2, 3].map((j) => k(`parmak_${i}_${j}${y}`))),
    bas: [1, 2, 3].map((j) => k(`başparmak_${j}${y}`)),
  });
  const R = el('R'), L = el('L'), boyun = k('boyun'), kafa = k('kafa'), gozL = k('göz_kökL'), gozR = k('göz_kökR');
  const tamam = [R, L].every((h) => h.ust && h.on && h.el && h.parmak.every((p) => p.every(Boolean)));
  const wp = (o, v = V()) => o.getWorldPosition(v);
  const tq = Q(), tq2 = Q(), I = Q();
  // Kemiği dünyada from → to yönüne (w kadar) döndürür
  function cevir(bone, from, to, w) {
    if (from.lengthSq() < 1e-9 || to.lengthSq() < 1e-9) return;
    tq.setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
    if (w < 1) tq.slerpQuaternions(I, tq, w);
    dunyaDon(bone, tq);
  }
  // Kemiğin dünya dönüşünü q ile önden çarpar (çocuklar birlikte döner)
  function dunyaDon(bone, q) {
    const bw = bone.getWorldQuaternion(Q()), pw = bone.parent.getWorldQuaternion(tq2);
    bone.quaternion.copy(pw.invert().multiply(q.clone().multiply(bw)));
    bone.updateMatrixWorld(true);
  }
  // İki kemikli IK: bilek hedefe, dirsek kutup noktasının tarafında
  function ik(h, hedef, kutup, w) {
    const S = wp(h.ust), E = wp(h.on), W = wp(h.el);
    const a = S.distanceTo(E), b = E.distanceTo(W);
    const st = hedef.clone().sub(S);
    const d = THREE.MathUtils.clamp(st.length(), Math.abs(a - b) + 1, a + b - 1);
    const dir = st.normalize();
    const cosA = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const pk = kutup.clone().sub(S);
    pk.addScaledVector(dir, -pk.dot(dir));
    if (pk.lengthSq() < 1e-6) pk.set(0, 0, -1);
    pk.normalize();
    const E2 = S.clone().addScaledVector(dir, a * cosA).addScaledVector(pk, a * sinA);
    cevir(h.ust, E.clone().sub(S), E2.sub(S), w);
    const E3 = wp(h.on), W3 = wp(h.el), T3 = S.clone().addScaledVector(dir, d);
    cevir(h.on, W3.sub(E3), T3.sub(E3), w);
  }
  // Avucun çatısı (dünya): d parmak yönü, s yan (işaret → serçe), n avucun normali (işaret: işaretli)
  function cati(h, isaret) {
    const e = wp(h.el), k1 = wp(h.parmak[0][0]), k4 = wp(h.parmak[3][0]), k2 = wp(h.parmak[1][0]), k3 = wp(h.parmak[2][0]);
    const kok = k2.clone().add(k3).multiplyScalar(0.5);
    const d = kok.clone().sub(e).normalize();
    const s = k4.clone().sub(k1);
    s.addScaledVector(d, -s.dot(d)).normalize();
    const n = V().crossVectors(d, s).multiplyScalar(isaret);
    const avuc = e.clone().add(kok).multiplyScalar(0.5); // avucun ortası: bilekle parmak köklerinin arası
    return { e, d, s, n, avuc };
  }
  // Avuç normalinin işareti: parmak ucu kökten avuç yönüne kıvrılır (tutuş pozunda parmaklar hafif kıvrık)
  const isaretler = new Map();
  function isaretOf(h) {
    if (isaretler.has(h)) return isaretler.get(h);
    const c = cati(h, 1), kok = wp(h.parmak[1][0]), uc = wp(h.parmak[1][2]), v = uc.sub(kok);
    const ix = v.dot(c.n) >= 0 ? 1 : -1;
    isaretler.set(h, ix);
    return ix;
  }
  // El yönü: (d, n) çatısını (d2, n2)'ye çevirir
  const m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), qa = Q();
  function eliYonelt(h, d2, n2, w) {
    const c = cati(h, isaretOf(h));
    const b1 = V().crossVectors(c.d, c.n), b2 = V().crossVectors(d2, n2);
    m1.makeBasis(c.d, c.n, b1);
    m2.makeBasis(d2, n2, b2);
    qa.setFromRotationMatrix(m2.multiply(m1.transpose()));
    if (w < 1) qa.slerpQuaternions(I, qa, w);
    dunyaDon(h.el, qa);
  }
  // Parmak kıvrımı: her eklem avuç normaline doğru aci kadar; dis(p) > 0 ise eklem büstün dışında (kutu)
  // Parmak kıvrımı: her zincirin eklemleri avuç normaline doğru döner. Açı, tutuşun başında bir kez büstün kendi ağına
  // karşı seçilir (aday açılar büyükten küçüğe, gerekirse parmak açılır: eksi): zincirin bütün eklemleri ve parmak ucu
  // (son kemiğin ucu: önceki parçanın uzantısı) büstün DIŞINDA (ışın parite sınaması, büst ağının iki yüzü). Sonraki
  // karelerde seçilen açı (büst ±40° dönerken eller onunla döner; ağ sınaması her karede yapılmaz: telefon bütçesi)
  const secilen = new Map(), ekOfs = new Map();
  let kareNo = 0;
  // a0'dan başlayıp ACIK (10°) adımlarla önce açılır, sonra (eksi yönde yetmezse) öbür yöne: klibin kavrayışı büstün içine
  // girebiliyordu
  const ACIK = THREE.MathUtils.degToRad(10), ADAY = [0, -1, -2, -3, -4, -5, -6, 1, 2, 3];
  function zinciriKivir(z, n, a, w) {
    for (let j = 0; j < z.length - 1; j++) {
      const p = wp(z[j]), c = wp(z[j + 1]), seg = c.clone().sub(p).normalize();
      const np = n.clone().addScaledVector(seg, -n.dot(seg));
      if (np.lengthSq() < 1e-6) continue;
      np.normalize();
      const to = seg.clone().multiplyScalar(Math.cos(a)).addScaledVector(np, Math.sin(a));
      cevir(z[j], seg, to, w);
    }
  }
  const uclari = (z) => { const pts = z.map((b) => wp(b)), n = pts.length; return [...pts, pts[n - 1].clone().add(pts[n - 1].clone().sub(pts[n - 2]).multiplyScalar(0.9))]; };
  // Zincirin göreli açısı (eksen sırası, açı) bir kez seçilir: ilk tamamen dışarıda kalan, yoksa en az eklemi içeride
  function zincirSec(z, eksen, w, icinde) {
    let sec = secilen.get(z);
    if (sec === undefined && icinde) {
      let enAz = Infinity;
      sec = [0, 0];
      dis: for (let e = 0; e < eksen.length; e++) {
        for (const k of ADAY) {
          if (e && !k) continue;
          const yedek = z.map((b) => b.quaternion.clone());
          zinciriKivir(z, eksen[e], ACIK * k, 1);
          const say = uclari(z).filter(icinde).length;
          z.forEach((b, i) => b.quaternion.copy(yedek[i]));
          z[0].updateMatrixWorld(true);
          if (say < enAz) { enAz = say; sec = [e, ACIK * k]; }
          if (!say) break dis;
        }
      }
      secilen.set(z, sec);
    }
    if (Array.isArray(sec)) zinciriKivir(z, eksen[Math.min(sec[0], eksen.length - 1)], sec[1], w);
  }
  function kivir(h, n, aci, w, icinde, basAci = aci) {
    const zincirler = [...h.parmak.map((z) => [z, aci]), [h.bas, basAci]];
    for (const [z, a0] of zincirler) {
      let a = secilen.get(z);
      if (a === undefined && icinde) {
        // Adaylar: önce büste doğru kıvrık (a0), sonra düz, sonra açık; ilk tamamen dışarıda kalan, yoksa en az eklemi içeride
        let enIyi = 0, enAz = Infinity;
        for (const k of ADAY) {
          const yedek = z.map((b) => b.quaternion.clone());
          zinciriKivir(z, n, a0 + ACIK * k, 1);
          const say = uclari(z).filter(icinde).length;
          z.forEach((b, i) => b.quaternion.copy(yedek[i]));
          z[0].updateMatrixWorld(true);
          if (say < enAz) { enAz = say; enIyi = a0 + ACIK * k; }
          if (!say) break;
        }
        a = enIyi;
        secilen.set(z, a);
      }
      zinciriKivir(z, n, a ?? 0, w);
    }
  }
  // Baş ve boyun nesneye: yatayda büste döner (boyun %40, baş %60, en çok 35°) ve sabit bir açıyla öne eğilir. Eğimi
  // kafa → göz vektörüyle hesaplamak büyük başı yana büküyordu (o vektör başın bakışı değil)
  let BAS_EGIM = 0.3; // rad: baş büste eğik (boyun %40, baş %60)
  function bak(hedef, w) {
    if (!kafa) return;
    const gozOrta = gozL && gozR ? wp(gozL).add(wp(gozR)).multiplyScalar(0.5) : null;
    if (!gozOrta) return;
    const kp = wp(kafa), f = gozOrta.sub(kp).setZ(0), t = hedef.clone().sub(kp).setZ(0);
    if (f.lengthSq() < 1 || t.lengthSq() < 1) return;
    let a = Math.atan2(f.x * t.y - f.y * t.x, f.x * t.x + f.y * t.y);
    a = THREE.MathUtils.clamp(a, -0.61, 0.61) * w;
    for (const [b, pay] of [[boyun, 0.4], [kafa, 0.6]]) if (b) dunyaDon(b, Q().setFromAxisAngle(ZEK, a * pay));
    // ve öne eğilir (büst çenesinin altında): başın sağ ekseni çevresinde BAS_EGIM
    const ileri = t.normalize(), sagE = V().set(ileri.y, -ileri.x, 0);
    if (BAS_EGIM) for (const [b, e] of [[boyun, 0.4], [kafa, 0.6]]) if (b) dunyaDon(b, Q().setFromAxisAngle(sagE, -e * BAS_EGIM * w));
  }

  // Büstün yerel kutusu (kabın yerelinde; ön yüzü yerel −y: raftaki kap odaya dönük)
  let yerelKutu = null, yerelNesne = null;
  const ters = new THREE.Matrix4();
  function kutuOf(obj) {
    if (yerelNesne === obj && yerelKutu) return yerelKutu;
    obj.updateMatrixWorld(true);
    ters.copy(obj.matrixWorld).invert();
    const b = new THREE.Box3();
    obj.traverse((o) => { if (o.isMesh) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(ters.clone().multiply(o.matrixWorld))); } });
    yerelNesne = obj; yerelKutu = b;
    return b;
  }

  const durum = { w: 0, son: null };
  const agCache = { obj: null, agl: [] }, isinR = new THREE.Raycaster(), isin = isinR.ray;
  const YONLER = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)];
  // obj: büstün kabı (dünya dönüşü kare başında yazılmış); on: Biggie'nin bakış yönü (dünya, yatay); w: ağırlık
  // Karıştırıcı bazı kemikleri her karede yazmıyor (donan klipte boyun, baş): IK'nın döndürmesi birikiyordu. Her karede
  // önce: kemik geçen karenin IK sonrası değerinde duruyorsa (karıştırıcı yazmadı) IK öncesi değerine döner; sonra IK
  // öncesi kaydedilir, IK uygulanır, sonrası kaydedilir
  const dokunulan = [R, L].flatMap((h) => [h.ust, h.on, h.el, ...h.parmak.flat(), ...h.bas]).concat([boyun, kafa]).filter(Boolean);
  const once = new Map(), sonra = new Map();
  function geriAl() {
    let degisti = false;
    for (const b of dokunulan) {
      const o = once.get(b), sn = sonra.get(b);
      if (o && sn && b.quaternion.equals(sn)) { b.quaternion.copy(o); degisti = true; }
    }
    if (degisti) model.updateMatrixWorld(true);
    once.clear(); sonra.clear();
  }
  // Büstün ölçeri (kare ve parmak ortak): yerel kutu, dünya yönleri, kutu dışı uzaklığı ve ağ içi sınaması
  function olcer(obj) {
    const kb = kutuOf(obj), mw = obj.matrixWorld;
    const loc = (x, y, z) => V().set(x, y, z).applyMatrix4(mw);
    const cx = (kb.min.x + kb.max.x) / 2, cy = (kb.min.y + kb.max.y) / 2, cz = (kb.min.z + kb.max.z) / 2, boy = kb.max.z - kb.min.z;
    const merkez = loc(cx, cy, cz);
    // Dünya yönleri: büstün yukarısı, önü (yerel −y)
    const qd = obj.getWorldQuaternion(Q()), yuk = V().set(0, 0, 1).applyQuaternion(qd), onB = V().set(0, -1, 0).applyQuaternion(qd);
    // Yerel kutuya göre dışarıda mı (mm; + dışarı): tabanın altı ya da arka yüzün dışı ya da yanları
    const tersM = mw.clone().invert();
    const disKutu = (p) => {
      const l = p.clone().applyMatrix4(tersM);
      return Math.max(kb.min.x - l.x, l.x - kb.max.x, kb.min.y - l.y, l.y - kb.max.y, kb.min.z - l.z, l.z - kb.max.z);
    };
    // Büstün ağına göre içeride mi (ışın paritesi: iki yönde de tek sayıda kesişim); yalnız tutuşun başında
    const icinde = (p) => {
      const agl = (agCache.obj === obj ? agCache.agl : (agCache.agl = [], obj.traverse((o) => { if (o.isMesh) agCache.agl.push(o); }), agCache.obj = obj, agCache.agl));
      if (disKutu(p) > 1) return false;
      let tek = 0;
      for (const yon of YONLER) {
        isin.set(p, yon); let n = 0;
        for (const m of agl) { const sd = m.material.side; m.material.side = THREE.DoubleSide; const h = []; m.raycast(isinR, h); m.material.side = sd; n += h.length; }
        if (n % 2 === 1) tek++;
      }
      return tek >= 2;
    };
    return { kb, mw, loc, tersM, disKutu, icinde, qd, yuk, onB, merkez, cx, cy, boy };
  }
  // v8.2 (Blender bust_tut klibi): kolları ve elleri klip yazar; burada yalnız parmaklar büstün ağının dışına alınır
  // (klipte sol el parmakları büste ~23 mm giriyordu). Her zincir klibin pozundan göreli açılır ya da kıvrılır (aday
  // açılar kivir'deki gibi; seçim bir kez, 30 karede bir yalnız seçilen açı yeniden sınanır: telefon bütçesi)
  function parmak(obj, w) {
    if (!tamam || !obj || w < 1e-3) return null;
    model.updateMatrixWorld(true);
    const { icinde, tersM } = olcer(obj);
    kareNo++;
    for (const h of [R, L]) {
      const zs = [...h.parmak, h.bas], c = cati(h, isaretOf(h));
      if (w > 0.98 && !((kareNo + (h === R ? 0 : 15)) % 30) && zs.every((z) => secilen.has(z))) {
        for (const z of zs) if (uclari(z).some(icinde)) secilen.delete(z);
      }
      // Parmaklar avuç normaline doğru (kıvrılır / açılır); başparmak ayrıca yana (avucun yan ekseni, iki yön): başparmağın
      // ucu avuç normali çevresinde dönünce büstten çıkmıyordu
      const eksen = [c.n, c.s, c.s.clone().negate()];
      for (const z of zs) zincirSec(z, z === h.bas ? eksen : [c.n], w, w > 0.98 ? icinde : null);
    }
    durum.icindeSay = () => [R, L].map((h) => [...h.parmak, h.bas].flatMap((z) => uclari(z)).filter(icinde).length);
    durum.icindeAd = () => [R, L].map((h) => [...h.parmak, h.bas].flatMap((z) => uclari(z).map((p, i) => [z[Math.min(i, z.length - 1)].name + (i === z.length ? '_uc' : ''), p])).filter(([, p]) => icinde(p)).map(([n, p]) => { const l = p.clone().applyMatrix4(tersM); return [n, Math.round(l.x), Math.round(l.y), Math.round(l.z)]; }));
    return true;
  }
  function kare(obj, on, w) {
    geriAl();
    if (!tamam || !obj || w < 1e-3) return null;
    model.updateMatrixWorld(true);
    for (const b of dokunulan) once.set(b, b.quaternion.clone());
    const { kb, loc, tersM, disKutu, icinde, qd, yuk, onB, merkez, cx, cy, boy } = olcer(obj);
    const f = V().set(on.x, on.y, 0).normalize();
    // Sağ el: alttan. Avucun yüzü tabanın 16 mm altında, büstün ortasının altında; parmaklar Biggie'nin önüne
    // Bir parmak eklemi ya da ucu büstün ağının içinde kalırsa el 6 mm daha dışarı alınır (en çok 50 mm) ve o elin
    // açıları yeniden seçilir
    const ekle = (h) => (ekOfs.get(h) ?? 0);
    // Büst ±40° döndükçe ağı elin altında değişir: yarım saniyede bir yeniden bakılır (her karede değil: telefon bütçesi)
    const sina = (h) => {
      if (w <= 0.98 || ekle(h) >= 50 || (kareNo + (h === R ? 0 : 7)) % 15) return;
      const zs = [...h.parmak, h.bas];
      if (!zs.every((z) => secilen.has(z))) return;
      if (zs.some((z) => uclari(z).some(icinde))) { ekOfs.set(h, ekle(h) + 6); zs.forEach((z) => secilen.delete(z)); }
    };
    kareNo++;
    const ofs = (h) => ekle(h);
    const altNokta = loc(cx, cy, kb.min.z).addScaledVector(yuk, -40 - ofs(R));
    yerlestir(R, altNokta, f, yuk, w, V().copy(wp(R.ust)).add(V().set(0, 0, -300)).addScaledVector(f, -80).addScaledVector(yan(f, 1), 160));
    // v8.2 (kullanıcı): alttaki el açık avuç (kıvrım 0; parmak açısı yine büstün dışında kalacak biçimde seçilir)
    kivir(R, yuk, 0, w, w > 0.98 ? icinde : null, 0);
    sina(R);
    // Sol el: büstün belinde (v8.2): avuç büstün sol yanına (yerel +x: Biggie'nin solu) yüksekliğin %45'inde, 30 mm dışarıda;
    // parmaklar öne (büstün yüzüne doğru), kıvrık
    const solYan = V().set(1, 0, 0).applyQuaternion(qd).setZ(0).normalize();
    const belNokta = loc(kb.max.x, cy, kb.min.z + boy * 0.45).addScaledVector(solYan, 30 + ofs(L));
    const belD = onB.clone().setZ(0).normalize(), belN = solYan.clone().negate();
    yerlestir(L, belNokta, belD, belN, w, V().copy(wp(L.ust)).add(V().set(0, 0, -300)).addScaledVector(f, -60).addScaledVector(yan(f, -1), 180));
    kivir(L, belN, THREE.MathUtils.degToRad(12), w, w > 0.98 ? icinde : null, THREE.MathUtils.degToRad(8));
    sina(L);
    bak(merkez, w);
    // Ölçüm (test): parmak eklemlerinin büst kutusuna en yakın uzaklığı (mm; + dışarıda)
    durum.icindeSay = () => [R, L].map((h) => [...h.parmak, h.bas].flatMap((z) => uclari(z)).filter(icinde).length);
    durum.icindeAd = () => [R, L].map((h) => [...h.parmak, h.bas].flatMap((z) => uclari(z).map((p, i) => [z[Math.min(i, z.length - 1)].name + (i === z.length ? '_uc' : ''), p])).filter(([, p]) => icinde(p)).map(([n, p]) => { const l = p.clone().applyMatrix4(tersM); return [n, Math.round(l.x), Math.round(l.y), Math.round(l.z)]; }));
    durum.kutu = [kb.min.toArray().map(Math.round), kb.max.toArray().map(Math.round)];
    const enAzEl = (h) => { let m = Infinity, ad = ''; for (const z of [...h.parmak, h.bas]) for (const b of z) { const d = disKutu(wp(b)); if (d < m) { m = d; ad = b.name; } } return [Math.round(m), ad]; };
    const [sagE, sagA] = enAzEl(R), [solE, solA] = enAzEl(L);
    for (const b of dokunulan) sonra.set(b, b.quaternion.clone());
    durum.w = w;
    durum.son = { enAzParmak: Math.min(sagE, solE), sagParmak: [sagE, sagA], solParmak: [solE, solA], sagHata: Math.round(wp(R.el).distanceTo(R.hedefBilek ?? wp(R.el))), solHata: Math.round(wp(L.el).distanceTo(L.hedefBilek ?? wp(L.el))),
      sag: wp(R.el).toArray().map(Math.round), sol: wp(L.el).toArray().map(Math.round), merkez: merkez.toArray().map(Math.round) };
    return durum.son;
  }
  // Biggie'nin sağı (isaret 1) / solu (−1), yatay
  const yan = (f, isaret) => V().set(f.y, -f.x, 0).multiplyScalar(isaret);
  // El: avuç yüzü hedefte, parmaklar d2, avuç normali n2 (yüzeye doğru)
  function yerlestir(h, yuzey, d2, n2, w, kutup) {
    const ix = isaretOf(h), c = cati(h, ix);
    // Avucun ortasının bileğe göre yeri, şimdiki çatıda → istenen çatıda
    const v = c.avuc.clone().sub(c.e), b1 = V().crossVectors(c.d, c.n), b2 = V().crossVectors(d2, n2);
    const vd = d2.clone().multiplyScalar(v.dot(c.d)).addScaledVector(n2, v.dot(c.n)).addScaledVector(b2, v.dot(b1));
    // Avucun ortası yüzeyin 14 mm gerisinde (elin kalınlığı), bilek oradan avuç vektörü kadar geride
    const bilek = yuzey.clone().addScaledVector(n2, -24).sub(vd);
    h.hedefBilek = bilek;
    ik(h, bilek, kutup, w);
    eliYonelt(h, d2, n2, w);
  }
  return { kare, parmak, get tamam() { return tamam; }, get son() { return durum.son; }, sifirla() { yerelNesne = null; isaretler.clear(); secilen.clear(); ekOfs.clear(); }, icindeSay: () => durum.icindeSay?.() ?? null, icindeAd: () => [durum.icindeAd?.(), durum.kutu], set basEgim(v) { BAS_EGIM = v; } };
}
