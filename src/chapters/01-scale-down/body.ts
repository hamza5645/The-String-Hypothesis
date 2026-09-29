// A procedural, neutral human figure built from tapered capsules and ellipsoids (no mesh fetch:
// the site ships under a strict CSP). Surface points are sampled once, keeping only points on the
// union's outer surface, so the figure reads as a hollow hologram "made of points".
//
// World frame (meters): the index-finger pad is at the origin, facing the camera (+z). The figure
// stands to the lower left, right arm raised, reaching toward the point of light.

import * as THREE from 'three'
import { rng } from '@/core/math'

/** Sampling frame of a capsule, built once per primitive (after its final transform). */
type CapFrame = { axis: THREE.Vector3; L: number; u: THREE.Vector3; v: THREE.Vector3; lat: number; capA: number; capB: number }
type Cap = { kind: 'cap'; a: THREE.Vector3; b: THREE.Vector3; ra: number; rb: number; w: number; part: number; frame?: CapFrame }
type Ell = { kind: 'ell'; c: THREE.Vector3; r: THREE.Vector3; m: THREE.Matrix3; mi: THREE.Matrix3; w: number; part: number }
/** A smooth lofted surface (torso): superellipse rings along y, Catmull-Rom radii, placed by M. */
type Loft = { kind: 'loft'; rings: number[][]; p: number; M: THREE.Matrix4; Mi: THREE.Matrix4; w: number; part: number; segA?: number[]; segTot?: number }
type Prim = Cap | Ell | Loft

/** part ids: 0 body, 1 hand, 2 index finger (the zoom target) */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function cap(a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number, part = 0, w = 1): Cap {
  return { kind: 'cap', a, b, ra, rb, w, part }
}
function ell(c: THREE.Vector3, r: THREE.Vector3, basis: THREE.Matrix3 | null, part = 0, w = 1): Ell {
  const m = basis ? basis.clone() : new THREE.Matrix3()
  const mi = m.clone().transpose() // orthonormal basis: inverse = transpose
  return { kind: 'ell', c, r, m, mi, w, part }
}

/* ───────────── hand (hand frame: X along the fingers, Z palmar/toward camera, thumb at −Y) ───────────── */

const DEG = Math.PI / 180
/** The zoom target: the index finger's pad (front surface of its distal phalanx), in the hand frame. */
const PAD_LOCAL = new THREE.Vector3()

function handPrims(): Prim[] {
  const P: Prim[] = []
  // wrist, palm, thenar and hypothenar pads
  P.push(ell(V(-0.012, 0.0, -0.002), V(0.032, 0.029, 0.019), null, 1, 2))
  P.push(ell(V(0.05, 0.004, -0.001), V(0.052, 0.044, 0.0165), null, 1, 2))
  P.push(ell(V(0.03, -0.028, 0.006), V(0.032, 0.02, 0.0165), null, 1, 2))
  P.push(ell(V(0.04, 0.03, 0.004), V(0.036, 0.016, 0.014), null, 1, 2))
  // fingers: base (MCP), spread angle in the palm plane, palmar curl per segment, segment lengths, radii.
  // A pointing hand: the index finger stays extended (its pad is the zoom target); the other three
  // fold into a loose fist, and the thumb rests across the folded middle finger.
  const fingers = [
    { base: V(0.094, -0.027, 0.0), spread: -4, curl: [3, 5, 3], len: [0.043, 0.025, 0.021], r: [0.0098, 0.0092, 0.0088, 0.0081], part: 2 },
    { base: V(0.097, -0.006, 0.0), spread: 1, curl: [68, 96, 58], len: [0.045, 0.028, 0.021], r: [0.0096, 0.009, 0.0086, 0.0079], part: 1 },
    { base: V(0.093, 0.014, 0.0), spread: 3, curl: [74, 98, 58], len: [0.042, 0.026, 0.02], r: [0.0091, 0.0086, 0.0081, 0.0075], part: 1 },
    { base: V(0.085, 0.031, 0.0), spread: 7, curl: [80, 96, 54], len: [0.034, 0.02, 0.018], r: [0.0082, 0.0076, 0.0071, 0.0066], part: 1 },
  ]
  for (const f of fingers) {
    let p = f.base.clone()
    let ang = 0
    for (let k = 0; k < 3; k++) {
      ang += f.curl[k] * DEG
      const d = V(Math.cos(ang) * Math.cos(f.spread * DEG), Math.sin(f.spread * DEG), Math.sin(ang)).normalize()
      const q = p.clone().addScaledVector(d, f.len[k])
      // the extended index finger gets far more points: it is where the zoom lands
      P.push(cap(p, q, f.r[k], f.r[k + 1], f.part === 2 && k > 0 ? 2 : f.part === 2 ? 1 : f.part, f.part === 2 && k > 0 ? 34 : f.part === 2 ? 6 : 3))
      if (f.part === 2 && k === 2) {
        // pad centre: 60% along the distal phalanx, on its palmar (+Z) surface
        const t = 0.6
        const axisPt = p.clone().lerp(q, t)
        const rr = f.r[k] + (f.r[k + 1] - f.r[k]) * t
        const nrm = V(-d.z, 0, d.x).normalize() // d rotated toward +Z (palmar side)
        PAD_LOCAL.copy(axisPt).addScaledVector(nrm, rr)
      }
      p = q
    }
    // knuckle: a soft round head at the base of each folded finger
    if (f.part === 1) P.push(ell(f.base.clone().add(V(0.002, 0, 0.002)), V(0.012, 0.011, 0.011), null, 1, 3))
  }
  // thumb: from the thenar pad, across the palm, resting on the folded middle finger
  const t0 = V(0.02, -0.034, 0.006)
  const t1 = t0.clone().add(V(0.03, -0.008, 0.02))
  const t2 = t1.clone().add(V(0.026, 0.009, 0.014))
  const t3 = t2.clone().add(V(0.019, 0.013, 0.005))
  P.push(cap(t0, t1, 0.0128, 0.0108, 1, 3))
  P.push(cap(t1, t2, 0.0108, 0.0096, 1, 3))
  P.push(cap(t2, t3, 0.0096, 0.0086, 1, 3))
  return P
}

/** Hand → world: fingers point up-right (30°), palm faces the camera, index side turned 10° forward. */
function handToWorld() {
  if (PAD_LOCAL.lengthSq() === 0) handPrims()
  const uf = V(Math.cos(30 * DEG), Math.sin(30 * DEG), 0)
  const zh = V(0, 0, 1)
  const yh = zh.clone().cross(uf)
  const R = new THREE.Matrix4().makeBasis(uf, yh, zh)
  const tilt = new THREE.Matrix4().makeRotationX(-10 * DEG)
  R.multiply(tilt)
  const pad = PAD_LOCAL.clone().applyMatrix4(R)
  // translate so the pad lands on the origin, then nudge so its surface faces +z exactly at the origin
  const T = new THREE.Matrix4().makeTranslation(-pad.x, -pad.y, -pad.z)
  return T.multiply(R)
}

function transformPrims(P: Prim[], M: THREE.Matrix4) {
  const m3 = new THREE.Matrix3().setFromMatrix4(M)
  for (const p of P) {
    if (p.kind === 'cap') {
      p.a.applyMatrix4(M)
      p.b.applyMatrix4(M)
    } else if (p.kind === 'loft') {
      p.M.premultiply(M)
      p.Mi.copy(p.M).invert()
    } else {
      p.c.applyMatrix4(M)
      p.m.premultiply(m3)
      p.mi.copy(p.m).transpose()
    }
  }
  return P
}

/* ───────────── body (body frame: floor at y = 0, facing +z, figure's right = −x) ───────────── */

function bodyPrims(): Prim[] {
  const P: Prim[] = []
  P.push(ell(V(0, 1.61, 0.012), V(0.076, 0.104, 0.092), null)) // head
  P.push(ell(V(0, 1.545, 0.048), V(0.048, 0.038, 0.044), null)) // jaw
  P.push(cap(V(0, 1.4, -0.012), V(0, 1.53, 0.004), 0.052, 0.047)) // neck
  // torso: one smooth lofted surface from the hips to the base of the neck (y, half-width, half-depth,
  // z offset); the top rings slope down to the shoulders instead of ending in a flat shelf
  P.push({
    kind: 'loft',
    rings: [
      [0.8, 0.095, 0.075, 0.0],
      [0.86, 0.15, 0.1, -0.005],
      [0.94, 0.172, 0.112, -0.01],
      [1.02, 0.16, 0.103, 0.0],
      [1.1, 0.14, 0.095, 0.006],
      [1.19, 0.148, 0.104, 0.01],
      [1.28, 0.166, 0.112, 0.012],
      [1.34, 0.168, 0.106, 0.004],
      [1.39, 0.15, 0.092, -0.006],
      [1.425, 0.112, 0.074, -0.012],
      [1.45, 0.07, 0.058, -0.012],
      [1.465, 0.052, 0.05, -0.01],
    ],
    p: 2.3,
    M: new THREE.Matrix4(),
    Mi: new THREE.Matrix4(),
    w: 1,
    part: 0,
  })
  // trapezius slopes (neck → shoulder) and rounded deltoid caps: no boxy shoulder
  const slope = (a: number) => new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationZ(a))
  P.push(ell(V(-0.095, 1.428, -0.022), V(0.085, 0.03, 0.055), slope(0.32)))
  P.push(ell(V(0.095, 1.428, -0.022), V(0.085, 0.03, 0.055), slope(-0.32)))
  P.push(ell(V(-0.178, 1.382, -0.008), V(0.056, 0.07, 0.06), null))
  P.push(ell(V(0.178, 1.382, -0.008), V(0.056, 0.07, 0.06), null))
  // legs (slight contrapposto)
  P.push(cap(V(-0.09, 0.93, 0), V(-0.1, 0.5, 0.025), 0.086, 0.056))
  P.push(cap(V(0.09, 0.93, 0), V(0.105, 0.5, 0.0), 0.086, 0.056))
  P.push(cap(V(-0.1, 0.5, 0.025), V(-0.105, 0.085, -0.01), 0.052, 0.034))
  P.push(cap(V(0.105, 0.5, 0.0), V(0.12, 0.085, -0.015), 0.052, 0.034))
  P.push(cap(V(-0.105, 0.07, -0.03), V(-0.12, 0.03, 0.14), 0.036, 0.028))
  P.push(cap(V(0.12, 0.07, -0.035), V(0.15, 0.03, 0.125), 0.036, 0.028))
  // left arm, relaxed
  P.push(cap(V(0.19, 1.39, -0.01), V(0.235, 1.13, -0.03), 0.046, 0.037))
  P.push(cap(V(0.235, 1.13, -0.03), V(0.255, 0.885, 0.02), 0.036, 0.027))
  P.push(ell(V(0.258, 0.8, 0.03), V(0.022, 0.07, 0.035), null))
  return P
}

export interface Cloud {
  positions: Float32Array
  /** outward surface normal at each point (lets the shader dim surfaces that face away: a solid read) */
  normals: Float32Array
  starts: Float32Array
  rands: Float32Array
  count: number
}

/** Right arm, raised: the shoulder sits behind, left of and below the wrist, so the arm rises on a
 *  diagonal toward the light instead of lying across the chest; elbow from two-bone IK. */
function armJoints() {
  const M = handToWorld()
  const W = V(-0.02, 0, -0.002).applyMatrix4(M)
  const S = W.clone().add(V(-0.43, -0.17, -0.2))
  const a = 0.29
  const b = 0.265
  const d = Math.min(W.distanceTo(S), a + b - 1e-3)
  const u = W.clone().sub(S).normalize()
  const pole = V(0.05, -1, 0.15)
  const v = pole.sub(u.clone().multiplyScalar(pole.dot(u))).normalize()
  const ca = (a * a + d * d - b * b) / (2 * a * d)
  const sa = Math.sqrt(Math.max(0, 1 - ca * ca))
  const E = S.clone().addScaledVector(u, a * ca).addScaledVector(v, a * sa)
  return { S, E, W }
}

function buildPrims(withBody: boolean): Prim[] {
  const H = transformPrims(handPrims(), handToWorld())
  const { S, E, W } = armJoints()
  if (!withBody) {
    // the forearm near the wrist (along the same forearm as the whole figure), so the hand does not float
    const back = E.clone().sub(W).normalize()
    H.push(cap(W.clone().addScaledVector(back, 0.2), W, 0.034, 0.028, 1, 2))
    return H
  }
  const arm: Prim[] = [cap(S, E, 0.046, 0.037), cap(E, W, 0.036, 0.028)]
  // body: faces right, 20° toward the camera; its right side (local −x) points at the camera
  const f = V(0.94, 0, 0.34).normalize()
  const xl = V(0, 1, 0).cross(f).normalize() // local +x (figure's left)
  const Rb = new THREE.Matrix4().makeBasis(xl, V(0, 1, 0), f)
  const shoulderLocal = V(-0.19, 1.39, -0.01)
  const sw = shoulderLocal.clone().applyMatrix4(Rb)
  const Tb = new THREE.Matrix4().makeTranslation(S.x - sw.x, S.y - sw.y, S.z - sw.z)
  const B = transformPrims(bodyPrims(), Tb.multiply(Rb))
  return [...B, ...arm, ...H]
}

/* ───────────── sampling ───────────── */

const cr = (a: number, b: number, c: number, d: number, t: number) =>
  0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)

/** Loft cross-section at segment i, local t: [y, rx, rz, cz]. */
function loftAt(L: Loft, i: number, t: number, out: number[]) {
  const R = L.rings
  const n = R.length
  const g = (k: number) => R[Math.max(0, Math.min(n - 1, k))]
  out[0] = R[i][0] + (R[i + 1][0] - R[i][0]) * t
  for (let c = 1; c < 4; c++) out[c] = Math.max(0.001, cr(g(i - 1)[c], g(i)[c], g(i + 1)[c], g(i + 2)[c], t))
  return out
}
const sec = [0, 0, 0, 0]
const se = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / p)

function insideLoft(L: Loft, pw: THREE.Vector3) {
  tmp.copy(pw).applyMatrix4(L.Mi)
  const R = L.rings
  if (tmp.y <= R[0][0] || tmp.y >= R[R.length - 1][0]) return false
  let i = 0
  while (i < R.length - 2 && tmp.y > R[i + 1][0]) i++
  const t = (tmp.y - R[i][0]) / (R[i + 1][0] - R[i][0])
  loftAt(L, i, t, sec)
  const x = Math.abs(tmp.x / sec[1])
  const z = Math.abs((tmp.z - sec[3]) / sec[2])
  return Math.pow(x, L.p) + Math.pow(z, L.p) < 0.9
}

const tmp = new THREE.Vector3()
const tmp2 = new THREE.Vector3()

function insideOther(p: THREE.Vector3, P: Prim[], self: number) {
  for (let j = 0; j < P.length; j++) {
    if (j === self) continue
    const q = P[j]
    if (q.kind === 'loft') {
      if (insideLoft(q, p)) return true
    } else if (q.kind === 'cap') {
      tmp.subVectors(q.b, q.a)
      const L2 = tmp.lengthSq()
      let t = L2 > 0 ? tmp2.subVectors(p, q.a).dot(tmp) / L2 : 0
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const r = q.ra + (q.rb - q.ra) * t
      tmp2.copy(q.a).addScaledVector(tmp, t)
      if (p.distanceToSquared(tmp2) < (r - 0.0015) * (r - 0.0015)) return true
    } else {
      tmp.subVectors(p, q.c).applyMatrix3(q.mi)
      const x = tmp.x / q.r.x
      const y = tmp.y / q.r.y
      const z = tmp.z / q.r.z
      if (x * x + y * y + z * z < 0.93) return true
    }
  }
  return false
}

function area(p: Prim) {
  if (p.kind === 'loft') {
    let a = 0
    for (let i = 0; i < p.rings.length - 1; i++) {
      const r0 = p.rings[i]
      const r1 = p.rings[i + 1]
      const per = Math.PI * (r0[1] + r0[2] + r1[1] + r1[2]) * 0.5
      a += per * Math.hypot(r1[0] - r0[0], Math.max(r1[1], r1[2]) - Math.max(r0[1], r0[2]))
    }
    return a
  }
  if (p.kind === 'cap') {
    const L = p.a.distanceTo(p.b)
    return Math.PI * (p.ra + p.rb) * L + 2 * Math.PI * (p.ra * p.ra + p.rb * p.rb)
  }
  const { x, y, z } = p.r
  const pp = 1.6075
  return 4 * Math.PI * Math.pow((Math.pow(x * y, pp) + Math.pow(x * z, pp) + Math.pow(y * z, pp)) / 3, 1 / pp)
}

/** Per-segment lateral areas of a loft (computed once per primitive, not per sample). */
function loftSegs(p: Loft) {
  if (!p.segA) {
    const R = p.rings
    p.segA = []
    p.segTot = 0
    for (let i = 0; i < R.length - 1; i++) {
      const a = Math.PI * (R[i][1] + R[i][2] + R[i + 1][1] + R[i + 1][2]) * 0.5 * Math.hypot(R[i + 1][0] - R[i][0], Math.max(R[i + 1][1], R[i + 1][2]) - Math.max(R[i][1], R[i][2]))
      p.segA.push(a)
      p.segTot += a
    }
  }
  return p.segA
}

function capFrame(p: Cap): CapFrame {
  if (!p.frame) {
    const axis = new THREE.Vector3().subVectors(p.b, p.a)
    const L = axis.length()
    axis.divideScalar(L || 1)
    const ux = Math.abs(axis.x) < 0.9 ? V(1, 0, 0) : V(0, 1, 0)
    const u = ux.sub(axis.clone().multiplyScalar(ux.dot(axis))).normalize()
    const v = axis.clone().cross(u)
    p.frame = { axis, L, u, v, lat: Math.PI * (p.ra + p.rb) * L, capA: 2 * Math.PI * p.ra * p.ra, capB: 2 * Math.PI * p.rb * p.rb }
  }
  return p.frame
}

function samplePrim(p: Prim, r: () => number, out: THREE.Vector3, nrm: THREE.Vector3) {
  if (p.kind === 'loft') {
    // rejection-sample the lateral surface: segment by its area, then uniform (t, θ) weighted by perimeter
    const R = p.rings
    const segA = loftSegs(p)
    let k = r() * p.segTot!
    let i = 0
    while (i < segA.length - 1 && k > segA[i]) k -= segA[i++]
    for (let tries = 0; tries < 8; tries++) {
      const t = r()
      loftAt(p, i, t, sec)
      const per = sec[1] + sec[2]
      const mx = Math.max(R[i][1] + R[i][2], R[i + 1][1] + R[i + 1][2]) * 1.15
      if (r() * mx > per) continue
      break
    }
    const th = 2 * Math.PI * r()
    const cx = se(Math.cos(th), p.p)
    const cz = se(Math.sin(th), p.p)
    out.set(sec[1] * cx, sec[0], sec[3] + sec[2] * cz).applyMatrix4(p.M)
    // superellipse gradient ∝ (sign·|x/a|^(p−1)/a, sign·|z/b|^(p−1)/b)
    nrm.set((Math.sign(cx) * Math.pow(Math.abs(cx), p.p - 1)) / sec[1], 0, (Math.sign(cz) * Math.pow(Math.abs(cz), p.p - 1)) / sec[2]).transformDirection(p.M)
    return
  }
  if (p.kind === 'ell') {
    const z = 2 * r() - 1
    const a = 2 * Math.PI * r()
    const s = Math.sqrt(1 - z * z)
    out.set(s * Math.cos(a) * p.r.x, s * Math.sin(a) * p.r.y, z * p.r.z).applyMatrix3(p.m).add(p.c)
    nrm.set((s * Math.cos(a)) / p.r.x, (s * Math.sin(a)) / p.r.y, z / p.r.z).applyMatrix3(p.m).normalize()
    return
  }
  const { axis, L, u, v, lat, capA, capB } = capFrame(p)
  const k = r() * (lat + capA + capB)
  const th = 2 * Math.PI * r()
  if (k < lat) {
    // lateral: t weighted by the local radius
    let t = r()
    if (Math.abs(p.rb - p.ra) > 1e-6) {
      const ra = p.ra
      const dr = p.rb - p.ra
      const q = r() * (ra + dr / 2)
      t = (-ra + Math.sqrt(ra * ra + 2 * dr * q)) / dr
    }
    const rr = p.ra + (p.rb - p.ra) * t
    out.copy(p.a).addScaledVector(axis, t * L).addScaledVector(u, rr * Math.cos(th)).addScaledVector(v, rr * Math.sin(th))
    nrm.copy(u).multiplyScalar(Math.cos(th)).addScaledVector(v, Math.sin(th))
  } else {
    const atA = k < lat + capA
    const rr = atA ? p.ra : p.rb
    const c = atA ? p.a : p.b
    const zz = r() // hemisphere pointing away from the segment
    const s = Math.sqrt(1 - zz * zz)
    const sign = atA ? -1 : 1
    out.copy(c).addScaledVector(axis, sign * zz * rr).addScaledVector(u, rr * s * Math.cos(th)).addScaledVector(v, rr * s * Math.sin(th))
    nrm.subVectors(out, c).normalize()
  }
}

/** What to sample: plain data, so it can be posted to the worker (figure.worker.ts). */
export interface FigureSpec {
  withBody: boolean
  count: number
  seed: number
  /** centre and radius of the loose sphere the points assemble from */
  swirl: { x: number; y: number; z: number; r: number }
}

/**
 * Sample `count` surface points. rands: x = assembly delay, y = shimmer phase, z = size, w = brightness.
 * Resumable: `run(until)` works until performance.now() passes `until` and returns the cloud once it is
 * complete (null before), so a main-thread fallback can spread the work over idle slices.
 */
export function createSampler({ withBody, count, seed, swirl }: FigureSpec) {
  const P = buildPrims(withBody)
  const r = rng(seed)
  const weights = P.map((p) => area(p) * (withBody ? 1 : p.w))
  const total = weights.reduce((a, b) => a + b, 0)
  const cdf: number[] = []
  let acc = 0
  for (const w of weights) cdf.push((acc += w / total))
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const starts = new Float32Array(count * 3)
  const rands = new Float32Array(count * 4)
  const p = new THREE.Vector3()
  const nv = new THREE.Vector3()
  let n = 0
  let guard = 0
  const run = (until: number): Cloud | null => {
    while (n < count && guard < count * 8) {
      if ((guard & 255) === 0 && performance.now() > until) return null
      guard++
      const x = r()
      let i = 0
      while (i < cdf.length - 1 && cdf[i] < x) i++
      samplePrim(P[i], r, p, nv)
      if (insideOther(p, P, i)) continue
      positions[n * 3] = p.x
      positions[n * 3 + 1] = p.y
      positions[n * 3 + 2] = p.z
      normals[n * 3] = nv.x
      normals[n * 3 + 1] = nv.y
      normals[n * 3 + 2] = nv.z
      // loose sphere
      const z = 2 * r() - 1
      const a = 2 * Math.PI * r()
      const s = Math.sqrt(1 - z * z)
      const rad = swirl.r * (0.75 + 0.5 * r())
      starts[n * 3] = swirl.x + s * Math.cos(a) * rad
      starts[n * 3 + 1] = swirl.y + z * rad
      starts[n * 3 + 2] = swirl.z + s * Math.sin(a) * rad
      // assemble from the fingertip outward: points near the target arrive first
      const dist = Math.min(1, p.length() / 1.9)
      rands[n * 4] = Math.min(1, 0.55 * dist + 0.45 * r())
      rands[n * 4 + 1] = r()
      rands[n * 4 + 2] = r()
      rands[n * 4 + 3] = 0.55 + 0.45 * r()
      n++
    }
    return { positions, normals, starts, rands, count: n }
  }
  return { run }
}
