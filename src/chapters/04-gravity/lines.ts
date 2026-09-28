/*
 * Hairlines — the chapter's "diagram drawn in light". Native 1-device-pixel GL lines with
 * per-vertex colour/alpha, optional dashes along a parameter aU, and a reveal clip (aU ≤ uReveal).
 * Additive, no depth write.
 */
import * as THREE from 'three'
import { COLORS } from '@/gl'

const vert = /* glsl */ `
  attribute vec3 aCol;
  attribute float aAlpha;
  attribute float aU;
  varying vec3 vCol;
  varying float vA;
  varying float vU;
  void main() {
    vCol = aCol;
    vA = aAlpha;
    vU = aU;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDash;     // dash period in aU units; 0 = solid
  uniform float uDashDuty; // fraction of the period that is drawn
  uniform float uReveal;
  varying vec3 vCol;
  varying float vA;
  varying float vU;
  void main() {
    if (vU > uReveal) discard;
    if (uDash > 0.0 && fract(vU / uDash) > uDashDuty) discard;
    gl_FragColor = vec4(uColor * vCol * vA * uOpacity, 1.0);
  }
`

export type LineMat = THREE.ShaderMaterial & {
  uniforms: {
    uColor: { value: THREE.Color }
    uOpacity: { value: number }
    uDash: { value: number }
    uDashDuty: { value: number }
    uReveal: { value: number }
  }
}

export function lineMaterial(color: THREE.ColorRepresentation = COLORS.field, opacity = 1, dash = 0, duty = 0.55): LineMat {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uDash: { value: dash },
      uDashDuty: { value: duty },
      uReveal: { value: 1e9 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  }) as LineMat
}

/** Accumulates line segments (pairs of vertices) with per-vertex colour, alpha and parameter u. */
export class Segs {
  pos: number[] = []
  col: number[] = []
  alpha: number[] = []
  u: number[] = []
  private c = new THREE.Color(1, 1, 1)
  color(c: THREE.ColorRepresentation) {
    this.c.set(c)
    return this
  }
  seg(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, a = 1, u1 = 0, u2 = 0, a2 = a) {
    this.pos.push(x1, y1, z1, x2, y2, z2)
    const { r, g, b } = this.c
    this.col.push(r, g, b, r, g, b)
    this.alpha.push(a, a2)
    this.u.push(u1, u2)
    return this
  }
  /** Polyline from a flat [x,y,z,…] list; u runs 0..1 along it (or uScale × arc length if given). */
  poly(pts: number[], a = 1, closed = false, uByLength = false) {
    const n = pts.length / 3
    let total = 0
    const cum = [0]
    for (let i = 1; i < n + (closed ? 1 : 0); i++) {
      const j = i % n
      const k = i - 1
      total += Math.hypot(pts[j * 3] - pts[k * 3], pts[j * 3 + 1] - pts[k * 3 + 1], pts[j * 3 + 2] - pts[k * 3 + 2])
      cum.push(total)
    }
    const m = closed ? n : n - 1
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % n
      const u1 = uByLength ? cum[i] : cum[i] / (total || 1)
      const u2 = uByLength ? cum[i + 1] : cum[i + 1] / (total || 1)
      this.seg(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2], a, u1, u2)
    }
    return this
  }
  get count() {
    return this.pos.length / 3
  }
  build(dynamic = false) {
    const g = new THREE.BufferGeometry()
    const P = new THREE.BufferAttribute(new Float32Array(this.pos), 3)
    const A = new THREE.BufferAttribute(new Float32Array(this.alpha), 1)
    if (dynamic) {
      P.setUsage(THREE.DynamicDrawUsage)
      A.setUsage(THREE.DynamicDrawUsage)
    }
    g.setAttribute('position', P)
    g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(this.col), 3))
    g.setAttribute('aAlpha', A)
    g.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(this.u), 1))
    return g
  }
}

/** Write a double-headed (or single) arrow's 5 (or 3) segments into a position array at vertex offset `o`. */
export function writeArrow(
  pos: Float32Array,
  o: number,
  cx: number,
  cy: number,
  cz: number,
  dx: number,
  dy: number,
  len: number,
  head = 0.26,
  double = true,
) {
  const l = Math.hypot(dx, dy) || 1
  const ux = dx / l
  const uy = dy / l
  const hx = ux * len * 0.5
  const hy = uy * len * 0.5
  const hl = len * head
  const c = 0.87758 // cos 0.5
  const s = 0.47943 // sin 0.5
  const ax = hl * (ux * c - uy * s)
  const ay = hl * (uy * c + ux * s)
  const bx = hl * (ux * c + uy * s)
  const by = hl * (uy * c - ux * s)
  const k = o * 3
  const tx = cx + hx
  const ty = cy + hy
  const sx = cx - hx
  const sy = cy - hy
  // shaft, then the two strokes of the head at the + end, then (optionally) at the − end
  pos[k] = sx; pos[k + 1] = sy; pos[k + 2] = cz
  pos[k + 3] = tx; pos[k + 4] = ty; pos[k + 5] = cz
  pos[k + 6] = tx; pos[k + 7] = ty; pos[k + 8] = cz
  pos[k + 9] = tx - ax; pos[k + 10] = ty - ay; pos[k + 11] = cz
  pos[k + 12] = tx; pos[k + 13] = ty; pos[k + 14] = cz
  pos[k + 15] = tx - bx; pos[k + 16] = ty - by; pos[k + 17] = cz
  if (double) {
    pos[k + 18] = sx; pos[k + 19] = sy; pos[k + 20] = cz
    pos[k + 21] = sx + ax; pos[k + 22] = sy + ay; pos[k + 23] = cz
    pos[k + 24] = sx; pos[k + 25] = sy; pos[k + 26] = cz
    pos[k + 27] = sx + bx; pos[k + 28] = sy + by; pos[k + 29] = cz
  }
}
