import * as THREE from 'three'
import { COLORS } from '@/gl'

/*
 * Chapter-local GPU primitives.
 *  - BraneMaterial: the D-brane sheet. IsoGrid language (hairline grid every 0.5 ℓ_s, fresnel rim, brighter
 *    edges) plus what the brane has to *do*: dents where a string pulls on it, plane-wave ripples, a merge
 *    flash, and a "painted in by the endpoints" mask (a first-visit-time texture compared in the shader).
 *  - StringBatch: many open/closed strings in ONE draw call — the Filament ribbon (crisp core + soft halo)
 *    with per-vertex width/alpha/tint and the on-brane slab clip applied per vertex.
 *  - HairBatch: immediate-mode Field hairlines (1 draw call) for every diagram mark.
 *  - createHairMaterial: static hairline sets with a reveal along each line (RR lattice, gravity lines).
 */

export const rgb = (hex: string): [number, number, number] => {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b]
}
export const FIELD = rgb(COLORS.field)
export const INK = rgb(COLORS.ink)
export const INK2 = rgb(COLORS.ink2)
export const INK3 = rgb(COLORS.ink3)
export const WARM = rgb(COLORS.filament)
export const WARM_CORE = rgb(COLORS.filamentCore)

/* ───────────── screen-space fade behind the narrative column (shared uniforms) ───────────── */

/** axis 0 = x (desktop column on the left), 1 = y from the bottom (phones); from/to in drawing-buffer px. */
export const FADE = {
  uFadeAxis: { value: 0 },
  uFadeFrom: { value: 0 },
  uFadeTo: { value: 1 },
  uFadeAmt: { value: 0 },
  /** right-edge vignette (desktop): keeps the stage quiet under the chapter rail */
  uEdgeFrom: { value: 1e6 },
  uEdgeTo: { value: 2e6 },
  uEdgeAmt: { value: 0 },
}
const fadeGLSL = /* glsl */ `
  uniform float uFadeAxis;
  uniform float uFadeFrom;
  uniform float uFadeTo;
  uniform float uFadeAmt;
  uniform float uEdgeFrom;
  uniform float uEdgeTo;
  uniform float uEdgeAmt;
  float screenFade() {
    float c = uFadeAxis < 0.5 ? gl_FragCoord.x : gl_FragCoord.y;
    float e = 1.0 - uEdgeAmt * smoothstep(uEdgeFrom, uEdgeTo, gl_FragCoord.x);
    return mix(1.0, smoothstep(uFadeFrom, uFadeTo, c), uFadeAmt) * e;
  }
`

/* ───────────────────────────── Brane sheet ───────────────────────────── */

const braneVert = /* glsl */ `
  uniform float uTime;
  uniform float uRipple;
  uniform vec3 uDent0;
  uniform vec3 uDent1;
  uniform float uSigma;
  varying vec2 vXZ;
  varying vec3 vN;
  varying vec3 vV;
  const vec2 K1 = vec2(1.45, 0.42);
  const vec2 K2 = vec2(-0.55, 1.62);
  const vec2 K3 = vec2(-1.21, -1.05);
  void main() {
    vec3 p = position;
    vec2 xz = p.xz;
    float s2 = 2.0 * uSigma * uSigma;
    vec2 d0 = xz - uDent0.xy;
    vec2 d1 = xz - uDent1.xy;
    float g0 = uDent0.z * exp(-dot(d0, d0) / s2);
    float g1 = uDent1.z * exp(-dot(d1, d1) / s2);
    // h(x,z,t) = 0.08 · Σ sin(k·r − ωt), |k| ≈ 1.2–2, ω ≈ 1.5–2.2
    float a1 = dot(K1, xz) - 1.5 * uTime;
    float a2 = dot(K2, xz) - 1.9 * uTime + 1.3;
    float a3 = dot(K3, xz) - 2.2 * uTime + 2.1;
    float r = 0.08 * uRipple;
    float h = g0 + g1 + r * (sin(a1) + sin(a2) + sin(a3));
    vec2 grad = -g0 * d0 / (uSigma * uSigma) - g1 * d1 / (uSigma * uSigma) + r * (cos(a1) * K1 + cos(a2) * K2 + cos(a3) * K3);
    p.y += h;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec4 mv = viewMatrix * wp;
    vXZ = xz;
    vN = normalize(mat3(viewMatrix) * normalize(vec3(-grad.x, 1.0, -grad.y)));
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const braneFrag = /* glsl */ `
  ${fadeGLSL}
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGrid;
  uniform float uEdge;
  uniform float uFill;
  uniform float uFresnel;
  uniform float uDpr;
  uniform sampler2D uPaint;
  uniform float uPaintOn;
  uniform float uPaintTau;
  uniform float uComplete;
  uniform float uFlash;
  uniform float uFlashR;
  uniform vec3 uFlashAt;
  uniform float uSoft;
  varying vec2 vXZ;
  varying vec3 vN;
  varying vec3 vV;
  const float HALF = 5.0;
  void main() {
    vec2 g = vXZ / 0.5;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float lw = 0.75 * uDpr;
    float line = 1.0 - clamp(min(gd.x, gd.y) / lw, 0.0, 1.0);
    // fade grid lines where they would alias into a wash (grazing views)
    line *= 1.0 - smoothstep(0.35, 0.8, max(fw.x, fw.y));
    vec2 e = HALF - abs(vXZ);
    vec2 efw = max(fwidth(vXZ), vec2(1e-5));
    float edge = 1.0 - clamp(min(e.x / efw.x, e.y / efw.y) / (1.3 * uDpr), 0.0, 1.0);
    float mask = 1.0;
    if (uPaintOn > 0.5) {
      float tf = texture2D(uPaint, vXZ / (2.0 * HALF) + 0.5).r;
      float paint = smoothstep(tf, tf + 0.05, uPaintTau) * step(tf, 0.999);
      mask = mix(paint, 1.0, uComplete);
    }
    // soft border (the on-brane slice): the sheet reads as unbounded instead of a framed panel
    float m = max(abs(vXZ.x), abs(vXZ.y));
    mask *= mix(1.0, smoothstep(HALF, HALF - 2.2, m), uSoft);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
    float fl = uFlash * exp(-pow((length(vXZ - uFlashAt.xy) - uFlashR) / 0.16, 2.0)) * (0.35 + 0.65 * line + 0.4 * fres);
    vec3 col = uColor * ((uFill + line * uGrid + fres * uFresnel) * mask + edge * uEdge + fl);
    gl_FragColor = vec4(col * uOpacity * screenFade(), 1.0);
  }
`

export type BraneMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number }
    uRipple: { value: number }
    uDent0: { value: THREE.Vector3 }
    uDent1: { value: THREE.Vector3 }
    uSigma: { value: number }
    uColor: { value: THREE.Color }
    uOpacity: { value: number }
    uGrid: { value: number }
    uEdge: { value: number }
    uFill: { value: number }
    uFresnel: { value: number }
    uDpr: { value: number }
    uPaint: { value: THREE.Texture | null }
    uPaintOn: { value: number }
    uPaintTau: { value: number }
    uComplete: { value: number }
    uFlash: { value: number }
    uFlashR: { value: number }
    uFlashAt: { value: THREE.Vector3 }
    uSoft: { value: number }
    uFadeAxis: { value: number }
    uFadeFrom: { value: number }
    uFadeTo: { value: number }
    uFadeAmt: { value: number }
    uEdgeFrom: { value: number }
    uEdgeTo: { value: number }
    uEdgeAmt: { value: number }
  }
}

export function createBraneMaterial(): BraneMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: braneVert,
    fragmentShader: braneFrag,
    uniforms: {
      uTime: { value: 0 },
      uRipple: { value: 0 },
      uDent0: { value: new THREE.Vector3() },
      uDent1: { value: new THREE.Vector3() },
      uSigma: { value: 0.35 },
      uColor: { value: new THREE.Color(COLORS.field) },
      uOpacity: { value: 1 },
      uGrid: { value: 0.14 },
      uEdge: { value: 0.4 },
      uFill: { value: 0.018 },
      uFresnel: { value: 0.1 },
      uDpr: { value: 1 },
      uPaint: { value: null },
      uPaintOn: { value: 0 },
      uPaintTau: { value: 1 },
      uComplete: { value: 1 },
      uFlash: { value: 0 },
      uFlashR: { value: 0 },
      uFlashAt: { value: new THREE.Vector3() },
      uSoft: { value: 0 },
      ...FADE,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }) as BraneMaterial
  m.onBeforeRender = (renderer) => {
    m.uniforms.uDpr.value = renderer.getPixelRatio()
  }
  return m
}

/** 10 × 10 sheet in the xz-plane (normal +y). */
export function createBraneGeometry(seg: number) {
  const g = new THREE.PlaneGeometry(10, 10, seg, seg)
  g.rotateX(-Math.PI / 2)
  return g
}

/* ───────────────────────────── String batch ───────────────────────────── */

const stringVert = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uMinPx;
  uniform float uTaper;
  uniform float uSlabOn;
  uniform float uSlabY;
  uniform float uSlabH;
  uniform float uSlabW;
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aU;
  attribute float aW;
  attribute float aA;
  attribute float aTint;
  attribute float aClip;
  varying float vSide;
  varying float vHalfPx;
  varying float vTaper;
  varying float vA;
  varying float vTint;
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
    float halfNdc = 0.5 * aW * projectionMatrix[1][1] / max(c.w, 1e-5);
    float minNdc = uMinPx * 2.0 / uResolution.y;
    float tp = aU < 0.0 ? 1.0 : smoothstep(0.0, uTaper, aU) * smoothstep(0.0, uTaper, 1.0 - aU);
    vTaper = tp;
    float h = max(halfNdc, minNdc) * mix(0.25, 1.0, tp);
    vHalfPx = h * uResolution.y * 0.5;
    vec2 off = normal * h * aSide;
    off.x /= aspect;
    c.xy += off * c.w;
    gl_Position = c;
    vSide = aSide;
    float fade = 1.0;
    if (uSlabOn > 0.5 && aClip > 0.5) fade = 1.0 - smoothstep(uSlabH, uSlabH + uSlabW, abs(position.y - uSlabY));
    vA = aA * fade;
    vTint = aTint;
  }
`
const stringFrag = /* glsl */ `
  ${fadeGLSL}
  uniform vec3 uCoreW;
  uniform vec3 uGlowW;
  uniform vec3 uCoreI;
  uniform vec3 uGlowI;
  uniform float uCoreFrac;
  uniform float uDpr;
  varying float vSide;
  varying float vHalfPx;
  varying float vTaper;
  varying float vA;
  varying float vTint;
  void main() {
    if (vA < 0.002) discard;
    float d = abs(vSide);
    float dpx = d * vHalfPx;
    float corePx = max(vHalfPx * uCoreFrac, 0.55 * uDpr);
    float core = 1.0 - smoothstep(corePx - 0.7 * uDpr, corePx + 0.7 * uDpr, dpx);
    float halo = exp(-d * d * 5.5) * (1.0 - d);
    vec3 cc = mix(uCoreW, uCoreI, vTint);
    vec3 gc = mix(uGlowW, uGlowI, vTint);
    vec3 col = cc * core + gc * halo * 0.62;
    gl_FragColor = vec4(col * vA * mix(0.4, 1.0, vTaper) * screenFade(), 1.0);
  }
`

/** Max points per string (a closed string uses one extra wrap column). */
export const SP = 72
const COLS = SP + 1

export class StringBatch {
  readonly cap: number
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private used = 0
  private pos: Float32Array
  private prev: Float32Array
  private next: Float32Array
  private u: Float32Array
  private w: Float32Array
  private a: Float32Array
  private tint: Float32Array
  private clip: Float32Array
  private geo: THREE.BufferGeometry

  constructor(cap: number) {
    this.cap = cap
    const nv = cap * COLS * 2
    this.pos = new Float32Array(nv * 3)
    this.prev = new Float32Array(nv * 3)
    this.next = new Float32Array(nv * 3)
    this.u = new Float32Array(nv)
    this.w = new Float32Array(nv)
    this.a = new Float32Array(nv)
    this.tint = new Float32Array(nv)
    this.clip = new Float32Array(nv)
    const side = new Float32Array(nv)
    for (let v = 0; v < nv; v++) side[v] = v % 2 === 0 ? -1 : 1
    const idx = new Uint32Array(cap * (COLS - 1) * 6)
    let k = 0
    for (let s = 0; s < cap; s++)
      for (let j = 0; j < COLS - 1; j++) {
        const a = (s * COLS + j) * 2
        idx[k++] = a
        idx[k++] = a + 1
        idx[k++] = a + 2
        idx[k++] = a + 2
        idx[k++] = a + 1
        idx[k++] = a + 3
      }
    const g = new THREE.BufferGeometry()
    const dyn = (arr: Float32Array, n: number) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('position', dyn(this.pos, 3))
    g.setAttribute('aPrev', dyn(this.prev, 3))
    g.setAttribute('aNext', dyn(this.next, 3))
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
    g.setAttribute('aU', dyn(this.u, 1))
    g.setAttribute('aW', dyn(this.w, 1))
    g.setAttribute('aA', dyn(this.a, 1))
    g.setAttribute('aTint', dyn(this.tint, 1))
    g.setAttribute('aClip', dyn(this.clip, 1))
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    g.setDrawRange(0, 0)
    this.geo = g
    this.material = new THREE.ShaderMaterial({
      vertexShader: stringVert,
      fragmentShader: stringFrag,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMinPx: { value: 1 },
        uTaper: { value: 0.06 },
        uSlabOn: { value: 0 },
        uSlabY: { value: 0 },
        uSlabH: { value: 100 },
        uSlabW: { value: 0.3 },
        uCoreW: { value: new THREE.Color(COLORS.filamentCore) },
        uGlowW: { value: new THREE.Color(COLORS.filament) },
        uCoreI: { value: new THREE.Color('#FFFFFF') },
        uGlowI: { value: new THREE.Color(COLORS.ink) },
        uCoreFrac: { value: 0.2 },
        uDpr: { value: 1 },
        ...FADE,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(g, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 3
  }

  setView(width: number, height: number, dpr: number, minPx = 1) {
    const u = this.material.uniforms
    u.uResolution.value.set(width * dpr, height * dpr)
    u.uDpr.value = dpr
    u.uMinPx.value = minPx * dpr
  }

  setSlab(on: boolean, y: number, h: number, w: number) {
    const u = this.material.uniforms
    u.uSlabOn.value = on ? 1 : 0
    u.uSlabY.value = y
    u.uSlabH.value = h
    u.uSlabW.value = w
  }

  begin() {
    this.used = 0
  }

  get count() {
    return this.used
  }

  /**
   * Add one string: n points (xyz) from pts. closed → loop. width in world units.
   * alpha may exceed 1 (brightness). tint 0 = warm filament, 1 = ink (unresolved). clip: obeys the slab clip.
   */
  add(pts: Float32Array, n: number, closed: boolean, width: number, alpha: number, tint = 0, clip = true) {
    if (this.used >= this.cap || n < 2 || alpha <= 0.002) return
    const s = this.used++
    const P = pts
    const base = s * COLS * 2
    const m = closed ? n + 1 : n
    for (let j = 0; j < COLS; j++) {
      let i: number
      let ip: number
      let inx: number
      if (j < m) {
        if (closed) {
          i = j % n
          ip = (i - 1 + n) % n
          inx = (i + 1) % n
        } else {
          i = j
          ip = Math.max(i - 1, 0)
          inx = Math.min(i + 1, n - 1)
        }
      } else {
        i = ip = inx = closed ? 0 : n - 1
      }
      const uu = closed ? -1 : i / (n - 1)
      for (let sd = 0; sd < 2; sd++) {
        const v = base + j * 2 + sd
        const o = v * 3
        this.pos[o] = P[i * 3]
        this.pos[o + 1] = P[i * 3 + 1]
        this.pos[o + 2] = P[i * 3 + 2]
        this.prev[o] = P[ip * 3]
        this.prev[o + 1] = P[ip * 3 + 1]
        this.prev[o + 2] = P[ip * 3 + 2]
        this.next[o] = P[inx * 3]
        this.next[o + 1] = P[inx * 3 + 1]
        this.next[o + 2] = P[inx * 3 + 2]
        this.u[v] = uu
        this.w[v] = width
        this.a[v] = alpha
        this.tint[v] = tint
        this.clip[v] = clip ? 1 : 0
      }
    }
  }

  end() {
    const g = this.geo
    const nv = this.used * COLS * 2
    g.setDrawRange(0, this.used * (COLS - 1) * 6)
    if (!nv) return
    for (const name of ['position', 'aPrev', 'aNext', 'aU', 'aW', 'aA', 'aTint', 'aClip']) {
      const at = g.getAttribute(name) as THREE.BufferAttribute
      at.clearUpdateRanges()
      at.addUpdateRange(0, nv * at.itemSize)
      at.needsUpdate = true
    }
  }

  dispose() {
    this.geo.dispose()
    this.material.dispose()
  }
}

/* ───────────────────────────── Hairlines ───────────────────────────── */

const hairVert = /* glsl */ `
  attribute vec4 aCol;
  attribute float aClip;
  attribute float aT;
  uniform float uSlabOn;
  uniform float uSlabY;
  uniform float uSlabH;
  uniform float uSlabW;
  varying vec4 vCol;
  varying float vT;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float fade = 1.0;
    if (uSlabOn > 0.5 && aClip > 0.5) fade = 1.0 - smoothstep(uSlabH, uSlabH + uSlabW, abs(wp.y - uSlabY));
    vCol = vec4(aCol.rgb, aCol.a * fade);
    vT = aT;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`
const hairFrag = /* glsl */ `
  ${fadeGLSL}
  uniform float uOpacity;
  uniform float uReveal;
  varying vec4 vCol;
  varying float vT;
  void main() {
    if (vT > uReveal) discard;
    gl_FragColor = vec4(vCol.rgb * vCol.a * uOpacity * screenFade(), 1.0);
  }
`

export type HairMaterial = THREE.ShaderMaterial & {
  uniforms: { uOpacity: { value: number }; uReveal: { value: number }; uSlabOn: { value: number }; uSlabY: { value: number }; uSlabH: { value: number }; uSlabW: { value: number } }
}

export function createHairMaterial(): HairMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: hairVert,
    fragmentShader: hairFrag,
    uniforms: {
      uOpacity: { value: 1 },
      uReveal: { value: 2 },
      uSlabOn: { value: 0 },
      uSlabY: { value: 0 },
      uSlabH: { value: 100 },
      uSlabW: { value: 0.3 },
      ...FADE,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }) as HairMaterial
}

/** Build a static hairline set: segments as flat arrays. */
export function staticHair(pos: number[], col: number[], t: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 4))
  g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(t), 1))
  g.setAttribute('aClip', new THREE.BufferAttribute(new Float32Array(t.length), 1))
  return g
}

type C3 = readonly [number, number, number]

export class HairBatch {
  readonly cap: number
  readonly lines: THREE.LineSegments
  readonly material: HairMaterial
  private n = 0
  private pos: Float32Array
  private col: Float32Array
  private clip: Float32Array
  private geo: THREE.BufferGeometry
  /** default slab-clip flag for subsequent segments */
  clipMode = 0

  constructor(cap: number) {
    this.cap = cap
    this.pos = new Float32Array(cap * 2 * 3)
    this.col = new Float32Array(cap * 2 * 4)
    this.clip = new Float32Array(cap * 2)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aClip', new THREE.BufferAttribute(this.clip, 1).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(cap * 2), 1))
    g.setDrawRange(0, 0)
    this.geo = g
    this.material = createHairMaterial()
    this.lines = new THREE.LineSegments(g, this.material)
    this.lines.frustumCulled = false
    this.lines.renderOrder = 2
  }

  begin() {
    this.n = 0
  }

  seg(ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: C3, a: number, a2 = a) {
    if (this.n >= this.cap || (a <= 0.002 && a2 <= 0.002)) return
    const i = this.n++
    const p = i * 6
    this.pos[p] = ax
    this.pos[p + 1] = ay
    this.pos[p + 2] = az
    this.pos[p + 3] = bx
    this.pos[p + 4] = by
    this.pos[p + 5] = bz
    const q = i * 8
    this.col[q] = c[0]
    this.col[q + 1] = c[1]
    this.col[q + 2] = c[2]
    this.col[q + 3] = a
    this.col[q + 4] = c[0]
    this.col[q + 5] = c[1]
    this.col[q + 6] = c[2]
    this.col[q + 7] = a2
    this.clip[i * 2] = this.clip[i * 2 + 1] = this.clipMode
  }

  /** Dashed segment. */
  dash(ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: C3, a: number, dash = 0.14, gap = 0.1) {
    const L = Math.hypot(bx - ax, by - ay, bz - az)
    if (L < 1e-6) return
    const step = dash + gap
    for (let s = 0; s < L; s += step) {
      const e = Math.min(L, s + dash)
      const t0 = s / L
      const t1 = e / L
      this.seg(ax + (bx - ax) * t0, ay + (by - ay) * t0, az + (bz - az) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1, az + (bz - az) * t1, c, a)
    }
  }

  /** Horizontal circle (in a y = const plane). */
  ring(x: number, y: number, z: number, r: number, c: C3, a: number, segs = 20) {
    let px = x + r
    let pz = z
    for (let k = 1; k <= segs; k++) {
      const th = (k / segs) * Math.PI * 2
      const nx = x + r * Math.cos(th)
      const nz = z + r * Math.sin(th)
      this.seg(px, y, pz, nx, y, nz, c, a)
      px = nx
      pz = nz
    }
  }

  /** Arrowhead at b pointing along (b − a); two barbs in the plane containing `up`. */
  head(ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: C3, a: number, size = 0.12, ux = 0, uy = 1, uz = 0) {
    let dx = bx - ax
    let dy = by - ay
    let dz = bz - az
    const L = Math.hypot(dx, dy, dz) || 1
    dx /= L
    dy /= L
    dz /= L
    // side = dir × up
    let sx = dy * uz - dz * uy
    let sy = dz * ux - dx * uz
    let sz = dx * uy - dy * ux
    const sl = Math.hypot(sx, sy, sz)
    if (sl < 1e-4) {
      sx = 1
      sy = sz = 0
    } else {
      sx /= sl
      sy /= sl
      sz /= sl
    }
    const bxx = bx - dx * size
    const byy = by - dy * size
    const bzz = bz - dz * size
    const w = size * 0.55
    this.seg(bx, by, bz, bxx + sx * w, byy + sy * w, bzz + sz * w, c, a)
    this.seg(bx, by, bz, bxx - sx * w, byy - sy * w, bzz - sz * w, c, a)
  }

  end() {
    const g = this.geo
    g.setDrawRange(0, this.n * 2)
    if (!this.n) return
    for (const [name, size] of [
      ['position', 3],
      ['aCol', 4],
      ['aClip', 1],
    ] as const) {
      const at = g.getAttribute(name) as THREE.BufferAttribute
      at.clearUpdateRanges()
      at.addUpdateRange(0, this.n * 2 * size)
      at.needsUpdate = true
    }
  }

  dispose() {
    this.geo.dispose()
    this.material.dispose()
  }
}

/* ───────────────────────────── Beads / dots ───────────────────────────── */

export class DotBatch {
  readonly cap: number
  readonly positions: Float32Array
  readonly sizes: Float32Array
  readonly colors: Float32Array
  readonly alphas: Float32Array
  n = 0
  constructor(cap: number) {
    this.cap = cap
    this.positions = new Float32Array(cap * 3)
    this.sizes = new Float32Array(cap)
    this.colors = new Float32Array(cap * 3)
    this.alphas = new Float32Array(cap)
  }
  begin() {
    this.n = 0
  }
  add(x: number, y: number, z: number, size: number, c: C3, a: number) {
    if (this.n >= this.cap || a <= 0.003) return
    const i = this.n++
    this.positions[i * 3] = x
    this.positions[i * 3 + 1] = y
    this.positions[i * 3 + 2] = z
    this.sizes[i] = size
    this.colors[i * 3] = c[0]
    this.colors[i * 3 + 1] = c[1]
    this.colors[i * 3 + 2] = c[2]
    this.alphas[i] = a
  }
  /** Zero the unused tail and flag the attributes of a THREE.Points built on these arrays. */
  end(points: THREE.Points | null) {
    for (let i = this.n; i < this.cap; i++) this.alphas[i] = 0
    if (!points) return
    const g = points.geometry
    ;(g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    ;(g.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true
    ;(g.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true
    ;(g.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true
  }
}
