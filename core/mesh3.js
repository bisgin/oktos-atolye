// csg.scope() sonucunu Three.js geometrisine çevirir (düz gölgeli, normalli). Görüntüleyici ve sahneler ortak kullanır.
import * as THREE from 'three';

export function positions3(r) {
  if (r.numProp === 3) return r.positions;
  const out = new Float32Array((r.positions.length / r.numProp) * 3);
  for (let i = 0, j = 0; i < r.positions.length; i += r.numProp, j += 3) {
    out[j] = r.positions[i]; out[j + 1] = r.positions[i + 1]; out[j + 2] = r.positions[i + 2];
  }
  return out;
}

// flat: true → köşeler keskin (baskı parçası görünümü). false → yumuşak (vazo, organik).
export function toGeometry(r, { flat = true } = {}) {
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions3(r), 3));
  geo.setIndex(new THREE.BufferAttribute(r.indices, 1));
  if (flat) geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}
