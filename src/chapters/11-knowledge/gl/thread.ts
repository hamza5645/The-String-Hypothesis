import * as THREE from 'three'
import { claimById } from '../data'

/*
 * The map's Thread (Model §6): a centripetal Catmull–Rom spline (α = 0.5) through
 *   T0 → D1 → D2 → D3 → D4 → D5 → D7 → D8 → C1 → C2 → C3 → S1 → T_end,
 * resampled to 320 points of equal arc length. Its end frays from arc fraction 0.85 into three
 * strands (decorative, ANALOGY). Rendered with a Filament-style ribbon whose every vertex obeys
 * the evidence ceiling (no ghost floor), plus a growth mask g ∈ [0, 1].
 */

export const T0: [number, number, number] = [0.0, 1.2, 1.9]
export const T_END: [number, number, number] = [-0.3, 6.25, -0.6]
const PATH = ['D1', 'D2', 'D3', 'D4', 'D5', 'D7', 'D8', 'C1', 'C2', 'C3', 'S1']
export const THREAD_N = 320
export const FRAY_START = 0.85
export const FRAY_N = 56

function catmullRom(ctrl: THREE.Vector3[], perSeg: number) {
  const n = ctrl.length
  const P = (i: number) => {
    if (i < 0) return ctrl[0].clone().multiplyScalar(2).sub(ctrl[1])
    if (i >= n) return ctrl[n - 1].clone().multiplyScalar(2).sub(ctrl[n - 2])
    return ctrl[i]
  }
  const out: THREE.Vector3[] = []
  const bounds: number[] = [0] // dense index of each control point
  const tj = (ti: number, a: THREE.Vector3, b: THREE.Vector3) => ti + Math.pow(Math.max(a.distanceTo(b), 1e-6), 0.5)
  const A1 = new THREE.Vector3()
  const A2 = new THREE.Vector3()
  const A3 = new THREE.Vector3()
  const B1 = new THREE.Vector3()
  const B2 = new THREE.Vector3()
  for (let s = 0; s < n - 1; s++) {
    const p0 = P(s - 1)
    const p1 = P(s)
    const p2 = P(s + 1)
    const p3 = P(s + 2)
    const t0 = 0
    const t1 = tj(t0, p0, p1)
    const t2 = tj(t1, p1, p2)
    const t3 = tj(t2, p2, p3)
    for (let k = 0; k < perSeg; k++) {
      const t = t1 + ((t2 - t1) * k) / perSeg
      A1.copy(p0).multiplyScalar((t1 - t) / (t1 - t0)).addScaledVector(p1, (t - t0) / (t1 - t0))
      A2.copy(p1).multiplyScalar((t2 - t) / (t2 - t1)).addScaledVector(p2, (t - t1) / (t2 - t1))
      A3.copy(p2).multiplyScalar((t3 - t) / (t3 - t2)).addScaledVector(p3, (t - t2) / (t3 - t2))
      B1.copy(A1).multiplyScalar((t2 - t) / (t2 - t0)).addScaledVector(A2, (t - t0) / (t2 - t0))
      B2.copy(A2).multiplyScalar((t3 - t) / (t3 - t1)).addScaledVector(A3, (t - t1) / (t3 - t1))
      out.push(B1.clone().multiplyScalar((t2 - t) / (t2 - t1)).addScaledVector(B2, (t - t1) / (t2 - t1)))
    }
    bounds.push(out.length)
  }
  out.push(ctrl[n - 1].clone())
  return { dense: out, bounds }
}

export interface ThreadGeo {
  /** 320 resampled points (xyz) */
  pts: Float32Array
  /** unit horizontal normal and binormal per point (for ripple + fray) */
  nrm: Float32Array
  bin: Float32Array
  /** arc fraction of each claim on the Thread, by claim id (plus 'T0', 'END') */
  g: Record<string, number>
  length: number
}

export function buildThread(): ThreadGeo {
  const ctrl = [new THREE.Vector3(...T0), ...PATH.map((id) => new THREE.Vector3(...claimById(id).pos)), new THREE.Vector3(...T_END)]
  const { dense, bounds } = catmullRom(ctrl, 64)
  const cum = [0]
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + dense[i].distanceTo(dense[i - 1]))
  const L = cum[cum.length - 1]
  const g: Record<string, number> = { T0: 0, END: 1 }
  PATH.forEach((id, k) => (g[id] = cum[bounds[k + 1]] / L))
  const pts = new Float32Array(THREAD_N * 3)
  let j = 0
  for (let i = 0; i < THREAD_N; i++) {
    const s = (i / (THREAD_N - 1)) * L
    while (j < cum.length - 2 && cum[j + 1] < s) j++
    const f = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j])
    const a = dense[j]
    const b = dense[j + 1]
    pts[i * 3] = a.x + (b.x - a.x) * f
    pts[i * 3 + 1] = a.y + (b.y - a.y) * f
    pts[i * 3 + 2] = a.z + (b.z - a.z) * f
  }
  const nrm = new Float32Array(THREAD_N * 3)
  const bin = new Float32Array(THREAD_N * 3)
  const T = new THREE.Vector3()
  const N = new THREE.Vector3()
  const B = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < THREAD_N; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(THREAD_N - 1, i + 1)
    T.set(pts[i1 * 3] - pts[i0 * 3], pts[i1 * 3 + 1] - pts[i0 * 3 + 1], pts[i1 * 3 + 2] - pts[i0 * 3 + 2]).normalize()
    N.crossVectors(T, up)
    if (N.lengthSq() < 1e-6) N.set(1, 0, 0)
    N.normalize()
    B.crossVectors(T, N).normalize()
    nrm.set([N.x, N.y, N.z], i * 3)
    bin.set([B.x, B.y, B.z], i * 3)
  }
  return { pts, nrm, bin, g, length: L }
}

// ───────────────────────── ribbon material (Filament look + per-vertex ceiling) ─────────────────────────

const vert = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uWidth;
  uniform float uMinPx;
  uniform float uCeilY;
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aU;
  attribute float aW;
  attribute float aAl;
  varying float vSide;
  varying float vU;
  varying float vHalfPx;
  varying float vVis;
  varying float vAl;
  void main() {
    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 c = mvp * vec4(position, 1.0);
    vec4 p = mvp * vec4(aPrev, 1.0);
    vec4 n = mvp * vec4(aNext, 1.0);
    float aspect = uResolution.x / uResolution.y;
    vec2 cs = c.xy / c.w; cs.x *= aspect;
    vec2 ps = p.xy / p.w; ps.x *= aspect;
    vec2 ns = n.xy / n.w; ns.x *= aspect;
    vec2 d1 = cs - ps;
    vec2 d2 = ns - cs;
    float l1 = length(d1);
    float l2 = length(d2);
    vec2 dir;
    if (l1 < 1e-7) dir = d2 / max(l2, 1e-7);
    else if (l2 < 1e-7) dir = d1 / l1;
    else dir = normalize(d1 / l1 + d2 / l2);
    vec2 normal = vec2(-dir.y, dir.x);
    float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
    float halfNdc = 0.5 * uWidth * aW * ws * projectionMatrix[1][1] / max(c.w, 1e-5);
    float minNdc = uMinPx * aW * 2.0 / uResolution.y;
    float h = max(halfNdc, minNdc);
    vHalfPx = h * uResolution.y * 0.5;
    vec2 off = normal * h * aSide;
    off.x /= aspect;
    c.xy += off * c.w;
    gl_Position = c;
    vSide = aSide;
    vU = aU;
    vVis = 1.0 - smoothstep(uCeilY - 0.12, uCeilY + 0.12, position.y);
    vAl = aAl;
  }
`

const frag = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uGlow;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uGrowth;
  uniform float uDpr;
  uniform float uTime;
  varying float vSide;
  varying float vU;
  varying float vHalfPx;
  varying float vVis;
  varying float vAl;
  void main() {
    float grow = 1.0 - smoothstep(uGrowth - 0.004, uGrowth + 0.0005, vU);
    float a = grow * vVis * vAl;
    if (a < 0.002) discard;
    float d = abs(vSide);
    float dpx = d * vHalfPx;
    float corePx = max(vHalfPx * 0.14, 0.5 * uDpr);
    float core = 1.0 - smoothstep(corePx - 0.6 * uDpr, corePx + 0.6 * uDpr, dpx);
    float halo = exp(-d * d * 4.2) * (1.0 - d);
    float sh = 1.0 + 0.18 * sin(vU * 60.0 - uTime * 1.6);
    vec3 col = uCore * core * 0.85 + uGlow * halo * 1.05 * sh;
    gl_FragColor = vec4(col * uIntensity * uOpacity * a, 1.0);
  }
`

export interface Ribbon {
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  /** write strip points (xyz per point) then call upload() */
  strips: { pts: Float32Array; start: number; n: number }[]
  upload(): void
}

/** Strips: [main (THREAD_N), fray A (FRAY_N), fray B (FRAY_N)] with u ranges and width/alpha profiles. */
export function createRibbon(): Ribbon {
  const specs = [
    { n: THREAD_N, u0: 0, u1: 1, w: (s: number) => (s < FRAY_START ? 1 : 1 - 0.45 * ((s - FRAY_START) / (1 - FRAY_START))), al: (s: number) => (s < FRAY_START ? 1 : 1 - ((s - FRAY_START) / (1 - FRAY_START)) ** 1.3) },
    { n: FRAY_N, u0: FRAY_START, u1: 1, w: () => 0.55, al: (s: number) => 1 - ((s - FRAY_START) / (1 - FRAY_START)) },
    { n: FRAY_N, u0: FRAY_START, u1: 1, w: () => 0.55, al: (s: number) => 1 - ((s - FRAY_START) / (1 - FRAY_START)) },
  ]
  const total = specs.reduce((a, s) => a + s.n, 0)
  const V = total * 2
  const pos = new Float32Array(V * 3)
  const prev = new Float32Array(V * 3)
  const next = new Float32Array(V * 3)
  const side = new Float32Array(V)
  const uu = new Float32Array(V)
  const ww = new Float32Array(V)
  const al = new Float32Array(V)
  const index: number[] = []
  const strips: Ribbon['strips'] = []
  let base = 0
  for (const sp of specs) {
    for (let j = 0; j < sp.n; j++) {
      const s = sp.u0 + ((sp.u1 - sp.u0) * j) / (sp.n - 1)
      for (let k = 0; k < 2; k++) {
        const v = (base + j) * 2 + k
        side[v] = k ? 1 : -1
        uu[v] = s
        ww[v] = sp.w(s)
        al[v] = sp.al(s)
      }
      if (j < sp.n - 1) {
        const a = (base + j) * 2
        index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
      }
    }
    strips.push({ pts: new Float32Array(sp.n * 3), start: base, n: sp.n })
    base += sp.n
  }
  const g = new THREE.BufferGeometry()
  const aPos = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)
  const aPrev = new THREE.BufferAttribute(prev, 3).setUsage(THREE.DynamicDrawUsage)
  const aNext = new THREE.BufferAttribute(next, 3).setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('position', aPos)
  g.setAttribute('aPrev', aPrev)
  g.setAttribute('aNext', aNext)
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  g.setAttribute('aU', new THREE.BufferAttribute(uu, 1))
  g.setAttribute('aW', new THREE.BufferAttribute(ww, 1))
  g.setAttribute('aAl', new THREE.BufferAttribute(al, 1))
  g.setIndex(index)
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)

  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uWidth: { value: 0.075 },
      uMinPx: { value: 1.6 },
      uCeilY: { value: 1e3 },
      uCore: { value: new THREE.Color('#FFE9CC') },
      uGlow: { value: new THREE.Color('#FFC98A') },
      uIntensity: { value: 1.25 },
      uOpacity: { value: 1 },
      uGrowth: { value: 1 },
      uDpr: { value: 1 },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  const size = new THREE.Vector2()
  let minPx = 1.6
  material.onBeforeRender = (renderer) => {
    renderer.getDrawingBufferSize(size)
    material.uniforms.uResolution.value.copy(size)
    const dpr = renderer.getPixelRatio()
    material.uniforms.uDpr.value = dpr
    material.uniforms.uMinPx.value = minPx * dpr
  }
  Object.defineProperty(material, 'minPx', { set: (v: number) => (minPx = v), get: () => minPx })

  const upload = () => {
    for (const st of strips) {
      const P = st.pts
      for (let j = 0; j < st.n; j++) {
        const jp = Math.max(0, j - 1)
        const jn = Math.min(st.n - 1, j + 1)
        for (let k = 0; k < 2; k++) {
          const o = ((st.start + j) * 2 + k) * 3
          pos[o] = P[j * 3]
          pos[o + 1] = P[j * 3 + 1]
          pos[o + 2] = P[j * 3 + 2]
          prev[o] = P[jp * 3]
          prev[o + 1] = P[jp * 3 + 1]
          prev[o + 2] = P[jp * 3 + 2]
          next[o] = P[jn * 3]
          next[o + 1] = P[jn * 3 + 1]
          next[o + 2] = P[jn * 3 + 2]
        }
      }
    }
    aPos.needsUpdate = true
    aPrev.needsUpdate = true
    aNext.needsUpdate = true
  }
  return { geometry: g, material, strips, upload }
}
