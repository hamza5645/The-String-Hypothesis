import * as THREE from 'three'

/*
 * Hairlines — many screen-space line segments in ONE draw call (instanced quads).
 * Crisp anti-aliased width in CSS px, optional soft glow, dashes (per world unit), per-group
 * draw-on reveal and alpha (uniform arrays), and the evidence-ceiling visibility of Model §3:
 *   a(y_ref) = 1 − smoothstep(y_c − 0.12, y_c + 0.12, y_ref), faded to a dashed Ink-3 ghost if `ghost`.
 * y_ref is either fixed per polyline (e.g. the higher endpoint of a strut) or the vertex height.
 */

export const GROUPS = 20

export interface LineOpts {
  color?: string
  alpha?: number
  /** core width, CSS px */
  width?: number
  /** glow radius, CSS px (0 = none) */
  glow?: number
  group?: number
  /** dashes per world unit (0 = solid) */
  dash?: number
  /** ceiling reference: a fixed height, 'max' (highest vertex of the polyline), 'vertex' (per vertex), or 'none' */
  yref?: number | 'max' | 'vertex' | 'none'
  /** draw a dashed ghost above the ceiling instead of vanishing */
  ghost?: boolean
}

const hexRGB = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export class LineBuilder {
  a: number[] = []
  b: number[] = []
  color: number[] = []
  style: number[] = []
  extra: number[] = []
  ref: number[] = []
  count = 0

  /** Add a polyline. `t` (reveal parameter) runs 0→1 along it unless given per point. */
  add(pts: ArrayLike<number>[] | number[][], o: LineOpts = {}, closed = false, tParam?: number[]) {
    const n = pts.length
    if (n < 2) return this
    const [r, g, bl] = hexRGB(o.color ?? '#86A8D8')
    const alpha = o.alpha ?? 1
    let ymax = -1e9
    for (const p of pts) ymax = Math.max(ymax, p[1])
    const yr = o.yref ?? 'max'
    const refVal = typeof yr === 'number' ? yr : yr === 'max' ? ymax : 0
    const refMode = yr === 'vertex' ? 1 : yr === 'none' ? 2 : 0
    const segs = closed ? n : n - 1
    // cumulative length for dash distance and default reveal param
    const cum = [0]
    for (let i = 1; i <= segs; i++) {
      const p = pts[(i - 1) % n]
      const q = pts[i % n]
      cum.push(cum[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]))
    }
    const total = cum[segs] || 1
    for (let i = 0; i < segs; i++) {
      const p = pts[i]
      const q = pts[(i + 1) % n]
      this.a.push(p[0], p[1], p[2])
      this.b.push(q[0], q[1], q[2])
      this.color.push(r, g, bl, alpha)
      this.style.push(o.width ?? 1, o.glow ?? 0, o.group ?? 0, o.dash ?? 0)
      const t0 = tParam ? tParam[i] : cum[i] / total
      const t1 = tParam ? tParam[(i + 1) % tParam.length] : cum[i + 1] / total
      this.extra.push(t0, t1, cum[i], cum[i + 1])
      this.ref.push(refVal, refMode, o.ghost ? 1 : 0)
      this.count++
    }
    return this
  }

  build() {
    return lineGeometry(this)
  }
}

/**
 * LineBuilder's layout in preallocated typed arrays, for big static line sets (the landscape terrain):
 * open polylines from flat xyz, no per-point arrays. build() wraps the arrays without copying, so one
 * instance can be cached and rebuilt into a geometry on every mount.
 */
export class TypedLines {
  a: Float32Array
  b: Float32Array
  color: Float32Array
  style: Float32Array
  extra: Float32Array
  ref: Float32Array
  count = 0

  constructor(segments: number) {
    this.a = new Float32Array(segments * 3)
    this.b = new Float32Array(segments * 3)
    this.color = new Float32Array(segments * 4)
    this.style = new Float32Array(segments * 4)
    this.extra = new Float32Array(segments * 4)
    this.ref = new Float32Array(segments * 3)
  }

  /** Add an open polyline of `n` points (xyz packed); the reveal parameter runs 0→1 along it, as in LineBuilder.add. */
  add(xyz: ArrayLike<number>, n: number, o: LineOpts = {}) {
    if (n < 2) return this
    const [r, g, bl] = hexRGB(o.color ?? '#86A8D8')
    const alpha = o.alpha ?? 1
    const yr = o.yref ?? 'max'
    let ymax = -1e9
    for (let i = 0; i < n; i++) ymax = Math.max(ymax, xyz[i * 3 + 1])
    const refVal = typeof yr === 'number' ? yr : yr === 'max' ? ymax : 0
    const refMode = yr === 'vertex' ? 1 : yr === 'none' ? 2 : 0
    let total = 0
    for (let i = 1; i < n; i++) total += Math.hypot(xyz[i * 3] - xyz[i * 3 - 3], xyz[i * 3 + 1] - xyz[i * 3 - 2], xyz[i * 3 + 2] - xyz[i * 3 - 1])
    total = total || 1
    let c0 = 0
    for (let i = 0; i < n - 1; i++) {
      const p = i * 3
      const q = p + 3
      const c1 = c0 + Math.hypot(xyz[q] - xyz[p], xyz[q + 1] - xyz[p + 1], xyz[q + 2] - xyz[p + 2])
      const k = this.count++
      const k3 = k * 3
      const k4 = k * 4
      this.a[k3] = xyz[p]
      this.a[k3 + 1] = xyz[p + 1]
      this.a[k3 + 2] = xyz[p + 2]
      this.b[k3] = xyz[q]
      this.b[k3 + 1] = xyz[q + 1]
      this.b[k3 + 2] = xyz[q + 2]
      this.color[k4] = r
      this.color[k4 + 1] = g
      this.color[k4 + 2] = bl
      this.color[k4 + 3] = alpha
      this.style[k4] = o.width ?? 1
      this.style[k4 + 1] = o.glow ?? 0
      this.style[k4 + 2] = o.group ?? 0
      this.style[k4 + 3] = o.dash ?? 0
      this.extra[k4] = c0 / total
      this.extra[k4 + 1] = c1 / total
      this.extra[k4 + 2] = c0
      this.extra[k4 + 3] = c1
      this.ref[k3] = refVal
      this.ref[k3 + 1] = refMode
      this.ref[k3 + 2] = o.ghost ? 1 : 0
      c0 = c1
    }
    return this
  }

  build() {
    return lineGeometry(this)
  }
}

/** Instance attributes, one instance per segment (plain arrays are copied, typed ones used as they are). */
interface LineArrays {
  a: ArrayLike<number>
  b: ArrayLike<number>
  color: ArrayLike<number>
  style: ArrayLike<number>
  extra: ArrayLike<number>
  ref: ArrayLike<number>
  count: number
}

function lineGeometry(d: LineArrays) {
  const f32 = (x: ArrayLike<number>) => (x instanceof Float32Array ? x : new Float32Array(x))
  const g = new THREE.InstancedBufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0], 3))
  g.setIndex([0, 2, 1, 1, 2, 3])
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(f32(d.a), 3))
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(f32(d.b), 3))
  g.setAttribute('aColor', new THREE.InstancedBufferAttribute(f32(d.color), 4))
  g.setAttribute('aStyle', new THREE.InstancedBufferAttribute(f32(d.style), 4))
  g.setAttribute('aExtra', new THREE.InstancedBufferAttribute(f32(d.extra), 4))
  g.setAttribute('aRef', new THREE.InstancedBufferAttribute(f32(d.ref), 3))
  g.instanceCount = d.count
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  return g
}

const vert = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute vec4 aColor;
  attribute vec4 aStyle;
  attribute vec4 aExtra;
  attribute vec3 aRef;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uReveal[${GROUPS}];
  uniform float uAlpha[${GROUPS}];
  uniform float uCeilY;
  uniform float uGlowScale;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vD;
  varying float vCore;
  varying float vGlow;
  varying float vT;
  varying float vReveal;
  varying float vDist;
  varying float vDash;
  varying float vVis;
  varying float vGhost;
  void main() {
    vec2 aCorner = position.xy;
    vec4 ca = projectionMatrix * modelViewMatrix * vec4(aA, 1.0);
    vec4 cb = projectionMatrix * modelViewMatrix * vec4(aB, 1.0);
    vec2 hres = uRes * 0.5;
    vec2 sa = ca.xy / max(ca.w, 1e-4) * hres;
    vec2 sb = cb.xy / max(cb.w, 1e-4) * hres;
    vec2 d = sb - sa;
    float len = length(d);
    vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float core = max(aStyle.x, 0.0) * uDpr;
    float glow = aStyle.y * uDpr * uGlowScale;
    float hw = max(core, uDpr) * 0.5 + glow + uDpr;
    vec4 c = aCorner.x < 0.5 ? ca : cb;
    vec2 s = (aCorner.x < 0.5 ? sa : sb) + nrm * aCorner.y * hw;
    c.xy = s / hres * c.w;
    gl_Position = c;
    vD = aCorner.y * hw;
    vCore = core;
    vGlow = glow;
    int g = int(aStyle.z + 0.5);
    vReveal = uReveal[g];
    vAlpha = aColor.a * uAlpha[g];
    vColor = aColor.rgb;
    vT = mix(aExtra.x, aExtra.y, aCorner.x);
    vDist = mix(aExtra.z, aExtra.w, aCorner.x);
    vDash = aStyle.w;
    float yref = aRef.y > 0.5 && aRef.y < 1.5 ? mix(aA.y, aB.y, aCorner.x) : aRef.x;
    vVis = aRef.y > 1.5 ? 1.0 : 1.0 - smoothstep(uCeilY - 0.12, uCeilY + 0.12, yref);
    vGhost = aRef.z;
  }
`

const frag = /* glsl */ `
  uniform float uDpr;
  uniform float uOpacity;
  uniform float uMaskX;
  uniform vec3 uGhostColor;
  uniform float uGhostAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vD;
  varying float vCore;
  varying float vGlow;
  varying float vT;
  varying float vReveal;
  varying float vDist;
  varying float vDash;
  varying float vVis;
  varying float vGhost;
  void main() {
    if (vT > vReveal + 1e-4) discard;
    float ad = abs(vD);
    float w = max(vCore, uDpr);
    float cov = (1.0 - smoothstep(w * 0.5 - 0.5 * uDpr, w * 0.5 + 0.5 * uDpr, ad)) * (vCore / w);
    float glow = vGlow > 0.0 ? exp(-(ad * ad) / (vGlow * vGlow) * 2.2) * 0.42 : 0.0;
    float dash = vDash > 0.0 ? step(fract(vDist * vDash), 0.56) : 1.0;
    float a = (cov + glow) * vAlpha * dash * vVis;
    float gdash = step(fract(vDist * 7.0), 0.5);
    float ghost = vGhost * (1.0 - vVis) * cov * gdash * uGhostAlpha;
    vec3 col = vColor * a + uGhostColor * ghost;
    // bright hairlines dim as they pass under the narrative column (desktop)
    float mask = uMaskX > 0.0 ? mix(0.22, 1.0, smoothstep(uMaskX - 110.0 * uDpr, uMaskX + 40.0 * uDpr, gl_FragCoord.x)) : 1.0;
    gl_FragColor = vec4(col * uOpacity * mask, 1.0);
  }
`

export type LineMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uRes: { value: THREE.Vector2 }
    uDpr: { value: number }
    uReveal: { value: number[] }
    uAlpha: { value: number[] }
    uCeilY: { value: number }
    uGlowScale: { value: number }
    uOpacity: { value: number }
    uGhostColor: { value: THREE.Color }
    uGhostAlpha: { value: number }
  }
}

export function createLineMaterial(): LineMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uReveal: { value: new Array(GROUPS).fill(1) },
      uAlpha: { value: new Array(GROUPS).fill(1) },
      uCeilY: { value: 1e3 },
      uGlowScale: { value: 1 },
      uOpacity: { value: 1 },
      uGhostColor: { value: new THREE.Color('#5C6270') },
      uGhostAlpha: { value: 0.16 },
      uMaskX: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  m.onBeforeRender = (renderer) => {
    const size = renderer.getDrawingBufferSize(tmpV2)
    m.uniforms.uRes.value.copy(size)
    const dpr = renderer.getPixelRatio()
    m.uniforms.uDpr.value = dpr
    ;(m.uniforms as { uMaskX: { value: number } }).uMaskX.value = screenMask.x * dpr
  }
  return m as LineMaterial
}
const tmpV2 = new THREE.Vector2()

/** Right edge (CSS px) of the narrative column this frame; 0 = no mask. Set by the director. */
export const screenMask = { x: 0 }

/** Circle polyline (horizontal, in the xz-plane at height y). */
export function circlePts(r: number, y: number, n = 128, a0 = 0, a1 = Math.PI * 2, cx = 0, cz = 0): number[][] {
  const out: number[][] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    out.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)])
  }
  return out
}
