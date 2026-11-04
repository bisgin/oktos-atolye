// Gölge vekili (telefon katmanı, 2026-11-03; ölçüm scripts/oda-kare-olc.py): duran eşyaların gölgesi birkaç çizimde.
// Gölge haritası her yenilendiğinde gölge düşüren her ağ ayrı çizilir (odada ~395 ağ; telefon taklidinde karenin ~%25'i).
// Burada duran ağlar dünya konumlarıyla "yalnız derinlik" vekil ağlarında birleşir (paket başına en çok PAKET ağ). Vekil
// ayrı bir katmanda (1) durur; three.js (r162) gölge geçişinde de ana kameranın katmanlarına baktığı için katman yalnız
// gölge haritası çizilirken açılır (ana geçişin listesi ondan önce kurulmuştur): ana kamera vekili hiç çizmez. Asıl ağlar
// ekranda aynen çizilir ama gölge düşürmez. Görüntü aynı kalır (gölge aynı biçimden gelir).
// Hareket: ağlar tek tek izlenir (bölüm = ağ). Bir ağ kıpırdarsa
// (dünya matrisi ya da görünürlüğü değişir, sahneden çıkar) paketi o karede dağılır, ağlar yeniden kendi gölgesini
// düşürür; paketteki öteki ağlar hemen yeniden paketlenir, kıpırdayan ağ `bekle` sn durgun kalınca. İki kez kıpırdayan
// ağ bir daha paketlenmez (sürekli oynayan: koltuk, perde, buzdolabı kapağı). Deri (iskelet), biçim anahtarı (morph),
// kesik saydamlık (alphaTest: yaprak) ve dokuyla kesilen ağlar paketlenmez: gölgeleri biçimden değil dokudan gelir.
// Kullanım (core/story.js): const v = golgeVekili(THREE, scene, renderer); her karede çizimden önce v.kare(t).
const PAKET = 48;

export function golgeVekili(THREE, scene, renderer, { bekle = 3, katman = 1 } = {}) {
  const sm = renderer.shadowMap, cizGolge = sm.render;
  sm.render = function (isiklar, sahne, kamera, ...a) {
    const acik = kamera.layers.isEnabled(katman);
    kamera.layers.enable(katman);
    try { return cizGolge.call(this, isiklar, sahne, kamera, ...a); } finally { if (!acik) kamera.layers.disable(katman); }
  };
  // bölüm: { k, uyeler: [{ o, m }], paket (null | paket), durgun (sn), oynadi (sayı) }; paket: { bolumler, vekil: [Mesh] }
  const bolumler = new Map();
  const yasakli = new Set();
  const goruyor = (o) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === scene) return true; } return false; };
  const uygun = (o) => {
    if (!o.isMesh || !o.castShadow || o.isSkinnedMesh || o.isInstancedMesh || o.userData.golgeVekili) return false;
    if (o.morphTargetInfluences?.length || !o.geometry?.attributes.position) return false;
    for (const m of [o.material].flat()) if (!m || m.alphaTest > 0 || m.alphaMap || m.displacementMap || m.visible === false) return false;
    return true;
  };
  // Bölüm ağın kendisi: sahnenin kökünde her şeyi taşıyan büyük gruplarda bir parça hep oynuyor (perde, buzdolabı kapağı,
  // süpürge); grup grup izlenince bütün grup paketlenemiyordu (395 ağın 111'i). Paket yine çok ağı tek çizimde toplar
  const bolumOf = (o) => o;
  // Durgunluk payı: odada çoğu eşyanın matrisi her karede ~1e-5 mm titriyor (yumuşatılmış yükseltmenin artığı); gölgede
  // görünmeyecek fark sayılmaz (konum 0,05 mm, dönüş/ölçek 1e-4)
  const ayni = (m, e) => {
    for (let i = 0; i < 16; i++) if (Math.abs(m[i] - e[i]) > (i >= 12 && i <= 14 ? 0.05 : 1e-4)) return false;
    return true;
  };
  // Görünürlük (üst zinciri yürümek) altı karede bir sınanır; matris her karede
  let kareNo = 0;
  const yerinde = (b, tam = true) => b.uyeler.every((u) => ayni(u.o.matrixWorld.elements, u.m) && (!tam || goruyor(u.o)));
  // Derinlik çiziminde yön (three r162 WebGLShadowMap, PCF): shadowSide yoksa malzemenin yüzünün tersi
  const TERS = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };
  const yuz = (o) => { const m = [o.material].flat()[0]; return m.shadowSide ?? TERS[m.side]; };
  const malzemeler = new Map();
  // Vekilin kendi malzemesi: derinlik malzemesi shadowSide'ı aynen alır (tersi alınmasın diye shadowSide verilir)
  const malzeme = (side) => {
    if (!malzemeler.has(side)) malzemeler.set(side, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side, shadowSide: side }));
    return malzemeler.get(side);
  };
  const v = new THREE.Vector3();
  function vekilAg(uyeler, side) {
    let nv = 0, ni = 0;
    for (const { o } of uyeler) { const g = o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let pv = 0, pi = 0;
    for (const { o } of uyeler) {
      const g = o.geometry, p = g.attributes.position, n = p.count, taban = pv, e = o.matrixWorld.elements;
      for (let i = 0; i < n; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        pos[pv * 3] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        pos[pv * 3 + 1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        pos[pv * 3 + 2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
        pv++;
      }
      if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[pi++] = a[i] + taban; } else for (let i = 0; i < n; i++) idx[pi++] = taban + i;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, malzeme(side));
    m.castShadow = true;
    m.layers.set(katman);
    m.matrixAutoUpdate = false;
    m.userData.golgeVekili = true;
    m.name = 'golge-vekili';
    scene.add(m);
    return m;
  }
  function paketKur(liste) {
    const paket = { bolumler: liste, vekil: [] };
    const gruplar = new Map();
    for (const b of liste) for (const u of b.uyeler) { const s = yuz(u.o); if (!gruplar.has(s)) gruplar.set(s, []); gruplar.get(s).push(u); }
    for (const [side, uyeler] of gruplar) {
      paket.vekil.push(vekilAg(uyeler, side));
      for (const u of uyeler) u.o.castShadow = false;
    }
    for (const b of liste) b.paket = paket;
  }
  function paketDagit(paket) {
    for (const m of paket.vekil) { scene.remove(m); m.geometry.dispose(); }
    for (const b of paket.bolumler) { b.paket = null; for (const u of b.uyeler) u.o.castShadow = true; }
  }
  // Sahnedeki aday ağları bölümlere toplar (paketsiz ve yasaksız bölümler)
  function topla() {
    const yeni = new Map();
    scene.traverse((o) => {
      if (!uygun(o) || !goruyor(o)) return;
      const k = bolumOf(o);
      if (!k || yasakli.has(k) || bolumler.get(k)?.paket) return;
      if (!yeni.has(k)) yeni.set(k, []);
      yeni.get(k).push({ o, m: Float32Array.from(o.matrixWorld.elements) });
    });
    return yeni;
  }
  let sonTarama = -1e9;
  const hazir = []; // paketlenmeyi bekleyen durgun bölümler: karede bir paket (birleştirme uzun görev olmasın)
  function kare(t) {
    // Paketli bölüm kıpırdadı mı: paketi dağılır, öteki bölümleri hemen yeniden sıraya girer
    const dagilan = new Set(), tam = kareNo++ % 6 === 0;
    for (const b of bolumler.values()) {
      if (!b.paket || dagilan.has(b.paket) || yerinde(b, tam)) continue;
      dagilan.add(b.paket);
      paketDagit(b.paket);
      b.oynadi++;
      if (b.oynadi >= 2) { yasakli.add(b.k); bolumler.delete(b.k); } else b.durgun = Infinity; // taramada yeniden ölçülür
    }
    for (const p of dagilan) for (const b of p.bolumler) if (bolumler.get(b.k) === b && b.durgun !== Infinity && yerinde(b)) hazir.push(b);
    // Karede bir paket: durgun bölümlerden en çok PAKET ağ
    if (hazir.length) {
      const liste = [];
      let n = 0;
      while (hazir.length && n < PAKET) {
        const b = hazir.shift();
        if (b.paket || bolumler.get(b.k) !== b || !yerinde(b)) continue;
        liste.push(b);
        n += b.uyeler.length;
      }
      if (liste.length) paketKur(liste);
    }
    // Saniyede bir tarama; aynı üyelerle `bekle` sn durgun kalan bölüm sıraya girer
    if (t - sonTarama < 1) return;
    sonTarama = t;
    for (const [k, uyeler] of topla()) {
      const b = bolumler.get(k);
      const ayniUyeler = b && b.durgun !== Infinity && b.uyeler.length === uyeler.length && b.uyeler.every((u, i) => u.o === uyeler[i].o && ayni(u.m, uyeler[i].m));
      if (!ayniUyeler) { bolumler.set(k, { k, uyeler, paket: null, durgun: t, oynadi: b?.oynadi || 0 }); continue; }
      if (t - b.durgun >= bekle && !hazir.includes(b)) hazir.push(b);
    }
  }
  return {
    kare,
    // Kontrol: bölüm, paketli bölüm, paketlenen ağ, vekil çizimi, yasaklı bölüm
    get durum() {
      const paketler = new Set();
      let paketli = 0, uye = 0;
      for (const b of bolumler.values()) if (b.paket) { paketli++; uye += b.uyeler.length; paketler.add(b.paket); }
      let cizim = 0;
      for (const p of paketler) cizim += p.vekil.length;
      return { bolum: bolumler.size, paketli, uye, paket: paketler.size, vekilCizim: cizim, yasakli: yasakli.size };
    },
  };
}
