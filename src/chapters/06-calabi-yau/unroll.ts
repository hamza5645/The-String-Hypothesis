import * as THREE from 'three'
import { COLORS } from '@/gl'

/*
 * Torus ⇄ flat square (Opening → Beat 1). One grid mesh (U, V) ∈ [0,1]², shaped in the vertex shader:
 *   ring:  arclength s₁ = (U − ½)·L₁, curvature k₁ = (1 − a)·2π/L₁, L₁ = mix(2πR, W, a)
 *          C(s₁) = (sin k₁s₁ / k₁,  y₀ − (1 − cos k₁s₁)/k₁),  y₀ = R(1 − a)      (a = 0: circle of radius R)
 *   tube:  arclength s₂ = (V − ½)·L₂, curvature k₂ = (1 − b)·2π/L₂, L₂ = mix(2πρ, H, b), around the front point
 *          D(s₂) = N·sin k₂s₂ / k₂ + Z·(z₀ − (1 − cos k₂s₂)/k₂),  z₀ = ρ(1 − b)
 *   point = C + D.   a: the ring opens (torus → straight tube), then b: the tube opens (→ flat W × H sheet).
 * The reverse of the classic "roll a square into a cylinder, bend it into a torus": the square's opposite
 * edges are exactly the seams that were glued. The Thread on the outer equator (V = ¾) is carried along.
 */

const UNROLL = /* glsl */ `
  uniform float uR;
  uniform float uRho;
  uniform float uA;
  uniform float uB;
  uniform float uW;
  uniform float uH;
  vec3 unroll(vec2 q) {
    float TAU = 6.2831853;
    // the ring's length shrinks ahead of its opening (ease-out), so the half-open arc stays compact
    float L1 = mix(TAU * uR, uW, 1.0 - (1.0 - uA) * (1.0 - uA));
    float k1 = (1.0 - uA) * TAU / L1;
    float s1 = (q.x - 0.5) * L1;
    float y0 = uR * (1.0 - uA);
    float ks = k1 * s1;
    vec2 C = k1 > 1e-5 ? vec2(sin(ks) / k1, y0 - (1.0 - cos(ks)) / k1) : vec2(s1, y0);
    vec3 N = vec3(sin(ks), cos(ks), 0.0);
    float rho = max(uRho, 1e-4);
    float L2 = mix(TAU * rho, uH, uB);
    float k2 = (1.0 - uB) * TAU / L2;
    float s2 = (q.y - 0.5) * L2;
    float z0 = rho * (1.0 - uB);
    float kt = k2 * s2;
    vec2 D = k2 > 1e-5 ? vec2(sin(kt) / k2, z0 - (1.0 - cos(kt)) / k2) : vec2(s2, z0);
    return vec3(C, 0.0) + N * D.x + vec3(0.0, 0.0, 1.0) * D.y;
  }
`

const vert = /* glsl */ `
  ${UNROLL}
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec3 p = unroll(uv);
    vec3 du = unroll(uv + vec2(1e-3, 0.0)) - unroll(uv - vec2(1e-3, 0.0));
    vec3 dv = unroll(uv + vec2(0.0, 1e-3)) - unroll(uv - vec2(0.0, 1e-3));
    vec3 n = cross(du, dv);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalMatrix * n;
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uEdgeCol;
  uniform vec2 uGrid;
  uniform float uLineW;
  uniform float uDpr;
  uniform float uOpacity;
  uniform float uFlat;      // 0 torus look … 1 flat diagram look
  uniform vec2 uEdge;       // glow of the (left,right) and (bottom,top) edge pairs
  uniform vec2 uZip;        // position of the travelling "zip" light along each pair
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 V = normalize(vV);
    float nl = length(vN);
    vec3 N = nl > 1e-6 ? vN / nl : vec3(0.0, 0.0, 1.0);
    float fres = pow(1.0 - abs(dot(N, V)), 2.5);
    vec2 g = vUv * uGrid;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float lw = max(uLineW * uDpr, 0.5);
    float line = max(1.0 - clamp(gd.x / lw, 0.0, 1.0), 1.0 - clamp(gd.y / lw, 0.0, 1.0));
    vec3 col = uColor * (mix(0.04, 0.025, uFlat) + fres * mix(0.55, 0.0, uFlat)) + uColor * line * mix(0.38, 0.5, uFlat);
    // matched edges of the flat torus
    vec2 ew = fwidth(vUv) * 2.5 * uDpr;
    float eU = (1.0 - smoothstep(0.0, ew.x, vUv.x)) + (1.0 - smoothstep(0.0, ew.x, 1.0 - vUv.x));
    float eV = (1.0 - smoothstep(0.0, ew.y, vUv.y)) + (1.0 - smoothstep(0.0, ew.y, 1.0 - vUv.y));
    float zU = exp(-pow((vUv.y - uZip.x) / 0.05, 2.0));
    float zV = exp(-pow((vUv.x - uZip.y) / 0.05, 2.0));
    col += uEdgeCol * (eU * uEdge.x * (0.55 + 1.6 * zU) + eV * uEdge.y * (0.55 + 1.6 * zV));
    gl_FragColor = vec4(col * uOpacity, 1.0);
  }
`

export type UnrollMaterial = THREE.ShaderMaterial & { uniforms: Record<string, THREE.IUniform> }

export function createUnrollMaterial(): UnrollMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uR: { value: 1.3 },
      uRho: { value: 0 },
      uA: { value: 0 },
      uB: { value: 0 },
      uW: { value: 3.6 },
      uH: { value: 3.6 },
      uColor: { value: new THREE.Color(COLORS.field) },
      uEdgeCol: { value: new THREE.Color('#BFD4F2') },
      uGrid: { value: new THREE.Vector2(24, 12) },
      uLineW: { value: 0.7 },
      uDpr: { value: 1 },
      uOpacity: { value: 0 },
      uFlat: { value: 0 },
      uEdge: { value: new THREE.Vector2() },
      uZip: { value: new THREE.Vector2(-1, -1) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  m.onBeforeRender = (r) => {
    m.uniforms.uDpr.value = r.getPixelRatio()
  }
  return m as UnrollMaterial
}

/** CPU mirror of unroll() (for the Thread riding the surface). */
export function unrollPoint(U: number, V: number, R: number, rho: number, a: number, b: number, W: number, Hh: number, out: THREE.Vector3) {
  const TAU = Math.PI * 2
  const L1 = R * TAU + (W - R * TAU) * (1 - (1 - a) * (1 - a))
  const k1 = ((1 - a) * TAU) / L1
  const s1 = (U - 0.5) * L1
  const y0 = R * (1 - a)
  const ks = k1 * s1
  const Cx = k1 > 1e-5 ? Math.sin(ks) / k1 : s1
  const Cy = k1 > 1e-5 ? y0 - (1 - Math.cos(ks)) / k1 : y0
  const Nx = Math.sin(ks)
  const Ny = Math.cos(ks)
  const r = Math.max(rho, 1e-4)
  const L2 = r * TAU + (Hh - r * TAU) * b
  const k2 = ((1 - b) * TAU) / L2
  const s2 = (V - 0.5) * L2
  const z0 = r * (1 - b)
  const kt = k2 * s2
  const Dx = k2 > 1e-5 ? Math.sin(kt) / k2 : s2
  const Dy = k2 > 1e-5 ? z0 - (1 - Math.cos(kt)) / k2 : z0
  out.set(Cx + Nx * Dx, Cy + Ny * Dx, Dy)
  return out
}

/** A (U, V) grid for the unroll mesh. */
export function createUnrollGeometry(nu = 128, nv = 48) {
  const g = new THREE.PlaneGeometry(1, 1, nu, nv)
  return g
}

/* ── Hairlines: 1 px GL lines with optional dashes and a staggered "grow" (for the 6-axis star, plot axes) ── */

const lineVert = /* glsl */ `
  attribute vec3 aStart;
  attribute float aT;
  attribute float aDashed;
  attribute float aSeg;
  uniform float uGrow;
  uniform float uStagger;
  varying float vT;
  varying float vDashed;
  varying float vFade;
  void main() {
    float g = clamp((uGrow - aSeg * uStagger) / max(1.0 - uStagger * 6.0, 0.2), 0.0, 1.0);
    vec3 p = mix(aStart, position, g);
    vT = aT * g;
    vDashed = aDashed;
    vFade = aDashed > 0.5 ? 1.0 - 0.75 * aT * g : 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const lineFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDashes;
  varying float vT;
  varying float vDashed;
  varying float vFade;
  void main() {
    if (vDashed > 0.5 && fract(vT * uDashes) > 0.5) discard;
    gl_FragColor = vec4(uColor * uOpacity * vFade, 1.0);
  }
`

export interface HairSeg {
  a: [number, number, number]
  b: [number, number, number]
  dashed?: boolean
}

/** Build a LineSegments of hairlines; animate with material.uniforms.uGrow / uOpacity. */
export function createHairlines(segs: HairSeg[], color: THREE.ColorRepresentation = COLORS.field, dashes = 10) {
  const n = segs.length
  const pos = new Float32Array(n * 6)
  const start = new Float32Array(n * 6)
  const t = new Float32Array(n * 2)
  const dashed = new Float32Array(n * 2)
  const seg = new Float32Array(n * 2)
  segs.forEach((s, i) => {
    pos.set(s.a, i * 6)
    pos.set(s.b, i * 6 + 3)
    start.set(s.a, i * 6)
    start.set(s.a, i * 6 + 3)
    t[i * 2] = 0
    t[i * 2 + 1] = 1
    dashed[i * 2] = dashed[i * 2 + 1] = s.dashed ? 1 : 0
    seg[i * 2] = seg[i * 2 + 1] = i
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aStart', new THREE.BufferAttribute(start, 3))
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1))
  g.setAttribute('aDashed', new THREE.BufferAttribute(dashed, 1))
  g.setAttribute('aSeg', new THREE.BufferAttribute(seg, 1))
  const m = new THREE.ShaderMaterial({
    vertexShader: lineVert,
    fragmentShader: lineFrag,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uDashes: { value: dashes },
      uGrow: { value: 1 },
      uStagger: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const obj = new THREE.LineSegments(g, m)
  obj.frustumCulled = false
  obj.raycast = () => {}
  return obj as THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>
}
