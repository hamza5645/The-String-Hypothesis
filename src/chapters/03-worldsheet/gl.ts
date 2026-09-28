/*
 * Chapter 03 — materials and geometry for the spacetime diagram (Scene-only: imports three).
 * Axes: world X, Z = the two space directions we keep (physics x, y); world Y = time (ct). 1 unit = 1 ℓ.
 */
import * as THREE from 'three'
import { COLORS } from '@/gl'

const dprHook = (m: THREE.ShaderMaterial) => {
  m.onBeforeRender = (renderer) => {
    m.uniforms.uDpr.value = renderer.getPixelRatio()
  }
  return m
}

/* ───────────────────────── Implicit worldsheet (pants, handle) ───────────────────────── */

const sheetVert = /* glsl */ `
  uniform float uTScale;
  uniform float uTPivot;
  varying vec3 vL;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 p = position;
    p.y = uTPivot + (p.y - uTPivot) * uTScale;          // Beat 5: c_w(t) = c_1.5(5 + (t−5)·1.5/w) — exact
    vec3 n = normalize(vec3(normal.x, normal.y / uTScale, normal.z));
    vL = p;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalMatrix * n;
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const sheetFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uWarm;
  uniform vec3 uCore;
  uniform float uFill;
  uniform float uFresnel;
  uniform float uOpacity;
  uniform float uRing;
  uniform float uRingAlpha;
  uniform float uLineWidth;
  uniform float uDpr;
  uniform vec2 uTRange;
  uniform float uFade;
  uniform vec4 uNow;       // plane t = t0 + a·x + b·y (local), intensity
  uniform vec2 uRingTilt;  // (a, b) of this observer's "now": the ring family is their family of nows
  uniform vec4 uNow2;      // lower/upper window of the NOW band: xy = t range where the band shows
  varying vec3 vL;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float t = vL.y;
    if (t < uTRange.x || t > uTRange.y) discard;
    float fade = smoothstep(uTRange.x, uTRange.x + uFade, t) * (1.0 - smoothstep(uTRange.y - uFade, uTRange.y, t));
    // constant-time rings = the current observer's nows t − a·x − b·y = const (horizontal when untilted)
    float g = (t - uRingTilt.x * vL.x - uRingTilt.y * vL.z) / uRing;
    float fw = max(fwidth(g), 1e-5);
    float d = abs(fract(g - 0.5) - 0.5) / fw;
    float ring = 1.0 - clamp(d / max(uLineWidth * uDpr, 0.5), 0.0, 1.0);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
    vec3 col = uColor * (uFill + fres * uFresnel) + uColor * ring * uRingAlpha;
    if (uNow.w > 0.0) {
      float h = t - uNow.x - uNow.y * vL.x - uNow.z * vL.z;
      float w = max(0.025, 1.3 * fwidth(h));
      float I = exp(-(h / w) * (h / w));
      col = mix(col, uWarm * 0.6, I * uNow.w);
    }
    gl_FragColor = vec4(col * uOpacity * fade, 1.0);
  }
`
export type SheetMaterial = THREE.ShaderMaterial & {
  uniforms: Record<
    'uColor' | 'uWarm' | 'uCore' | 'uFill' | 'uFresnel' | 'uOpacity' | 'uRing' | 'uRingAlpha' | 'uLineWidth' | 'uDpr' | 'uTRange' | 'uFade' | 'uNow' | 'uNow2' | 'uRingTilt' | 'uTScale' | 'uTPivot',
    { value: any } // eslint-disable-line @typescript-eslint/no-explicit-any
  >
}
export function createSheetMaterial() {
  const m = new THREE.ShaderMaterial({
    vertexShader: sheetVert,
    fragmentShader: sheetFrag,
    uniforms: {
      uColor: { value: new THREE.Color(COLORS.field) },
      uWarm: { value: new THREE.Color(COLORS.filament) },
      uCore: { value: new THREE.Color(COLORS.filamentCore) },
      uFill: { value: 0.055 },
      uFresnel: { value: 0.35 },
      uOpacity: { value: 1 },
      uRing: { value: 0.5 },
      uRingAlpha: { value: 0.42 },
      uLineWidth: { value: 0.75 },
      uDpr: { value: 1 },
      uTRange: { value: new THREE.Vector2(0, 10) },
      uFade: { value: 0.6 },
      uNow: { value: new THREE.Vector4(0, 0, 0, 0) },
      uNow2: { value: new THREE.Vector4(0, 0, 0, 0) },
      uRingTilt: { value: new THREE.Vector2(0, 0) },
      uTScale: { value: 1 },
      uTPivot: { value: 5 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return dprHook(m) as SheetMaterial
}

/* ───────────────────────── Floor: the space plane at ct = 0 ───────────────────────── */

const floorVert = /* glsl */ `
  varying vec2 vW;
  varying vec2 vQ;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xz;
    vQ = position.xy * 2.0;          // −1..1 across the plane
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const floorFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDpr;
  varying vec2 vW;
  varying vec2 vQ;
  void main() {
    vec2 fw = max(fwidth(vW), vec2(1e-5));
    vec2 d = abs(fract(vW - 0.5) - 0.5) / fw;
    float line = 1.0 - clamp(min(d.x, d.y) / (0.7 * uDpr), 0.0, 1.0);
    vec2 d5 = abs(fract(vW / 5.0 - 0.5) - 0.5) * 5.0 / fw;
    float major = 1.0 - clamp(min(d5.x, d5.y) / (0.9 * uDpr), 0.0, 1.0);
    float r = length(vQ);
    float fade = 1.0 - smoothstep(0.45, 1.0, r);
    float a = (line * 0.85 + major * 0.5 + 0.05) * fade;
    gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
  }
`
export function createFloorMaterial() {
  const m = new THREE.ShaderMaterial({
    vertexShader: floorVert,
    fragmentShader: floorFrag,
    uniforms: { uColor: { value: new THREE.Color(COLORS.field) }, uOpacity: { value: 0 }, uDpr: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return dprHook(m)
}

/* ───────────────────────── NOW plane: t = t0 + a·x + b·y over a 7×4 rectangle ───────────────────────── */

const nowVert = /* glsl */ `
  uniform vec3 uPlane;   // t0, a, b
  varying vec2 vP;
  varying float vT;
  void main() {
    vec3 p = vec3(position.x, 0.0, -position.y);   // PlaneGeometry lies in XY → put it in XZ (x, y_phys)
    p.y = uPlane.x + uPlane.y * p.x + uPlane.z * p.z;
    vP = p.xz;
    vT = p.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const nowFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFill;
  uniform vec2 uHalf;
  uniform vec2 uClip;
  uniform float uDpr;
  varying vec2 vP;
  varying float vT;
  void main() {
    if (vT < uClip.x || vT > uClip.y) discard;
    vec2 g = vP / 0.5;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 d = abs(fract(g - 0.5) - 0.5) / fw;
    float grid = 1.0 - clamp(min(d.x, d.y) / (0.6 * uDpr), 0.0, 1.0);
    vec2 e = (uHalf - abs(vP)) / max(fwidth(vP), vec2(1e-5));
    float border = 1.0 - clamp(min(e.x, e.y) / (0.9 * uDpr), 0.0, 1.0);
    float clipEdge = min(vT - uClip.x, uClip.y - vT) / max(fwidth(vT), 1e-5);
    border = max(border, (1.0 - clamp(clipEdge / (0.9 * uDpr), 0.0, 1.0)) * 0.6);
    float a = uFill + grid * 0.16 + border * 0.75;
    gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
  }
`
export function createNowMaterial() {
  const m = new THREE.ShaderMaterial({
    vertexShader: nowVert,
    fragmentShader: nowFrag,
    uniforms: {
      uColor: { value: new THREE.Color(COLORS.field) },
      uOpacity: { value: 0 },
      uFill: { value: 0.08 },
      uPlane: { value: new THREE.Vector3(5, 0, 0) },
      uHalf: { value: new THREE.Vector2(3.5, 2) },
      uClip: { value: new THREE.Vector2(0.3, 9.7) },
      uDpr: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return dprHook(m)
}

/* ───────────────────────── Lines ───────────────────────── */

export function lineMaterial(color: THREE.ColorRepresentation = COLORS.field, opacity = 1) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
}

/** A polyline (THREE.Line) from a point array; mutate geometry positions + needsUpdate to animate. */
export function makeLine(pts: Float32Array | number[], mat: THREE.Material) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pts instanceof Float32Array ? pts : new Float32Array(pts), 3))
  const l = new THREE.Line(g, mat)
  l.frustumCulled = false
  return l
}
export function makeSegments(pts: Float32Array | number[], mat: THREE.Material) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pts instanceof Float32Array ? pts : new Float32Array(pts), 3))
  const l = new THREE.LineSegments(g, mat)
  l.frustumCulled = false
  return l
}

/** Crosshair-ring marker in its own XY plane (billboard it to the camera): unit ring + 4 outer ticks. */
export function markerPoints() {
  const p: number[] = []
  const n = 40
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    p.push(Math.cos(a0), Math.sin(a0), 0, Math.cos(a1), Math.sin(a1), 0)
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2
    p.push(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0, Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0)
  }
  return new Float32Array(p)
}

/** Light-cone glyph: a hairline double cone, 45° half-angle, total height 2h, apex at the origin. */
export function lightConePoints(h = 0.6, gens = 8) {
  const p: number[] = []
  const n = 48
  for (const y of [-h, h]) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2
      const a1 = ((i + 1) / n) * Math.PI * 2
      p.push(h * Math.cos(a0), y, h * Math.sin(a0), h * Math.cos(a1), y, h * Math.sin(a1))
    }
  }
  for (let k = 0; k < gens; k++) {
    const a = (k / gens) * Math.PI * 2
    p.push(-h * Math.cos(a), -h, -h * Math.sin(a), h * Math.cos(a), h, h * Math.sin(a))
  }
  return new Float32Array(p)
}

/* ───────────────────────── Parametric worldsheets (uv for IsoGrid) ───────────────────────── */

/** Grid surface: P(u, v) for u, v ∈ [0, 1], with uv = (u, v). */
export function paramSurface(nu: number, nv: number, P: (u: number, v: number, out: THREE.Vector3) => void) {
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3)
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2)
  const nrm = new Float32Array((nu + 1) * (nv + 1) * 3)
  const v3 = new THREE.Vector3()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const e = 1e-3
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const u = i / nu
      const v = j / nv
      const k = j * (nu + 1) + i
      P(u, v, v3)
      pos.set([v3.x, v3.y, v3.z], k * 3)
      uv.set([u, v], k * 2)
      P(Math.min(1, u + e), v, a)
      P(Math.max(0, u - e), v, b)
      const du = a.clone().sub(b)
      P(u, Math.min(1, v + e), a)
      P(u, Math.max(0, v - e), b)
      const dv = a.clone().sub(b)
      const n = du.cross(dv).normalize()
      nrm.set([n.x || 0, n.y || 1, n.z || 0], k * 3)
    }
  const idx: number[] = []
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const k = j * (nu + 1) + i
      idx.push(k, k + 1, k + nu + 2, k, k + nu + 2, k + nu + 1)
    }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}
