/*
 * The Hanson cross-section of the Fermat curve  z₁ⁿ + z₂ⁿ = 1  in ℂ²  (content/06-calabi-yau.md › Lab › Model).
 *
 *   θ = x + iy,  x ∈ [−X, X],  y ∈ [0, π/2]
 *   u = cosh θ = cosh x·cos y + i·sinh x·sin y
 *   v = −i sinh θ = cosh x·sin y − i·sinh x·cos y          (u² + v² = 1)
 *   z₁ = ω^{k₁}·u^{2/n},  z₂ = ω^{k₂}·v^{2/n},  ω = e^{2πi/n}  ⇒  z₁ⁿ + z₂ⁿ = 1 exactly
 *
 * Everything here is float64 on the CPU. Exact endpoint values of (cos y, sin y) at y = 0 and y = π/2
 * keep the branch points crack-free (cos(π/2) = 6e-17 would become ~4e-6 after the 2/n power).
 *
 * Projection ℝ⁴ → ℝ³ (Hanson):  P_α = (Re z₁, Re z₂, cos α·Im z₁ + sin α·Im z₂), z up;
 * three.js (Y up):  W = S·(P.x, P.z, −P.y).  Squash (cartoon of moduli), applied after projection:
 *   D_s(W) = R_Y(κ·s·W.y) · diag(1 + 0.45s, 1 − 0.30s, 1 + 0.15s) · W,   κ = 0.9
 * The same maps live in GLSL (see cyShaders.ts); keep the two in step.
 */

export type Degree = 3 | 4 | 5 | 6
export const DEGREES: Degree[] = [3, 4, 5, 6]

export const XMAX = 1.0 // Hanson's xiMax
export const S_WORLD = 0.8 // scene scale S
export const KAPPA = 0.9
export const HALF_PI = Math.PI / 2

/**
 * Samples per patch (NX odd so x = 0 is a grid line: the loop and the branch points live there).
 * Triangles = n²·2·(NX−1)(NY−1). At n = 6 the high tier drops to 45×23 so that the surface plus its
 * depth prepass (drawn while a string is wrapped) stays within the scene budget (≈ 139k triangles).
 */
export function patchGrid(tier: 'low' | 'medium' | 'high', n: number): [number, number] {
  if (tier === 'high') return n >= 6 ? [45, 23] : [49, 25]
  return tier === 'medium' ? [41, 21] : [25, 13]
}

const cp = new Float64Array(2)
/** Principal power w^e of w = re + i·im (0 at w = 0). */
function cpow(re: number, im: number, e: number, out: Float64Array) {
  const r = Math.hypot(re, im)
  if (r === 0) {
    out[0] = 0
    out[1] = 0
    return
  }
  const a = Math.atan2(im, re) * e
  const m = Math.pow(r, e)
  out[0] = m * Math.cos(a)
  out[1] = m * Math.sin(a)
}

/** p4 = (Re z1, Im z1, Re z2, Im z2) of the base patch (k1 = k2 = 0) at (x, y), given exact (cos y, sin y). */
export function evalP4(n: number, x: number, cy: number, sy: number, out: Float64Array, o = 0) {
  const ch = Math.cosh(x)
  const sh = Math.sinh(x)
  const e = 2 / n
  cpow(ch * cy, sh * sy, e, cp)
  out[o] = cp[0]
  out[o + 1] = cp[1]
  cpow(ch * sy, -sh * cy, e, cp)
  out[o + 2] = cp[0]
  out[o + 3] = cp[1]
}

const cosY = (y: number) => (y === 0 ? 1 : y === HALF_PI ? 0 : Math.cos(y))
const sinY = (y: number) => (y === 0 ? 0 : y === HALF_PI ? 1 : Math.sin(y))

const fa = new Float64Array(4)
const fb = new Float64Array(4)
const H = 1e-4

/** ∂p4/∂x and ∂p4/∂y by central differences (one-sided at the domain edges). */
export function tangents(n: number, x: number, y: number, tx: Float64Array, ty: Float64Array, o = 0) {
  const x0 = Math.max(-XMAX, x - H)
  const x1 = Math.min(XMAX, x + H)
  evalP4(n, x0, cosY(y), sinY(y), fa)
  evalP4(n, x1, cosY(y), sinY(y), fb)
  for (let c = 0; c < 4; c++) tx[o + c] = (fb[c] - fa[c]) / (x1 - x0)
  const y0 = Math.max(0, y - H)
  const y1 = Math.min(HALF_PI, y + H)
  evalP4(n, x, cosY(y0), sinY(y0), fa)
  evalP4(n, x, cosY(y1), sinY(y1), fb)
  for (let c = 0; c < 4; c++) ty[o + c] = (fb[c] - fa[c]) / (y1 - y0)
}

export interface PatchData {
  n: number
  nx: number
  ny: number
  p4: Float32Array
  tx: Float32Array
  ty: Float32Array
  uv: Float32Array
  position: Float32Array
  index: Uint16Array
}

/** The base patch (k1 = k2 = 0): one mesh, drawn n² times with per-instance phase rotations. */
export function buildBasePatch(n: number, nx: number, ny: number): PatchData {
  const count = nx * ny
  const p4 = new Float32Array(count * 4)
  const tx = new Float32Array(count * 4)
  const ty = new Float32Array(count * 4)
  const uv = new Float32Array(count * 2)
  const position = new Float32Array(count * 3)
  const q = new Float64Array(4)
  const a = new Float64Array(4)
  const b = new Float64Array(4)
  for (let j = 0; j < ny; j++) {
    const y = j === ny - 1 ? HALF_PI : (HALF_PI * j) / (ny - 1)
    for (let i = 0; i < nx; i++) {
      const x = i === (nx - 1) / 2 ? 0 : -XMAX + (2 * XMAX * i) / (nx - 1)
      const k = j * nx + i
      evalP4(n, x, cosY(y), sinY(y), q)
      tangents(n, x, y, a, b)
      for (let c = 0; c < 4; c++) {
        p4[k * 4 + c] = q[c]
        tx[k * 4 + c] = a[c]
        ty[k * 4 + c] = b[c]
      }
      uv[k * 2] = i / (nx - 1)
      uv[k * 2 + 1] = j / (ny - 1)
      position[k * 3] = S_WORLD * q[0]
      position[k * 3 + 1] = S_WORLD * (Math.SQRT1_2 * q[1] + Math.SQRT1_2 * q[3])
      position[k * 3 + 2] = -S_WORLD * q[2]
    }
  }
  const index = new Uint16Array((nx - 1) * (ny - 1) * 6)
  let t = 0
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a0 = j * nx + i
      const a1 = a0 + 1
      const b0 = a0 + nx
      const b1 = b0 + 1
      index[t++] = a0
      index[t++] = a1
      index[t++] = b1
      index[t++] = a0
      index[t++] = b1
      index[t++] = b0
    }
  return { n, nx, ny, p4, tx, ty, uv, position, index }
}

/** Rotate (re, im) by angle a, in place in a Float64Array/Float32Array at o. */
function rotC(arr: Float64Array | Float32Array, o: number, a: number) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const re = arr[o]
  const im = arr[o + 1]
  arr[o] = c * re - s * im
  arr[o + 1] = s * re + c * im
}

/**
 * The n boundary circles (rims x = ±X of every patch), as line-segment pairs in p4 with a dash
 * coordinate. They are where the drawing is cut off; the surface continues outward to infinity.
 */
export function buildRims(n: number, ny: number) {
  const segs = 2 * n * n * (ny - 1)
  const p4 = new Float32Array(segs * 2 * 4)
  const dash = new Float32Array(segs * 2)
  const q = new Float64Array(4)
  let v = 0
  for (let k1 = 0; k1 < n; k1++)
    for (let k2 = 0; k2 < n; k2++)
      for (const x of [-XMAX, XMAX]) {
        for (let j = 0; j < ny - 1; j++) {
          for (const jj of [j, j + 1]) {
            const y = jj === ny - 1 ? HALF_PI : (HALF_PI * jj) / (ny - 1)
            evalP4(n, x, cosY(y), sinY(y), q)
            rotC(q, 0, (2 * Math.PI * k1) / n)
            rotC(q, 2, (2 * Math.PI * k2) / n)
            for (let c = 0; c < 4; c++) p4[v * 4 + c] = q[c]
            dash[v] = jj / (ny - 1)
            v++
          }
        }
      }
  return { p4, dash }
}

/** Branch points A_k = (ω^k, 0) and B_k = (0, ω^k): where n pieces meet. p4 for 2n points (A's then B's). */
export function branchPoints(n: number) {
  const out = new Float64Array(2 * n * 4)
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n
    out.set([Math.cos(a), Math.sin(a), 0, 0], k * 4)
    out.set([0, 0, Math.cos(a), Math.sin(a)], (n + k) * 4)
  }
  return out
}

/**
 * Loop "a": a closed path along x = 0 through four patches, A₀ → B₀ → A₁ → B₁ → A₀.
 *   seg 0: patch (0,0), y: 0 → π/2   seg 1: patch (1,0), y: π/2 → 0
 *   seg 2: patch (1,1), y: 0 → π/2   seg 3: patch (0,1), y: π/2 → 0
 * On x = 0: z1 = ω^{k1}(cos y)^{2/n}, z2 = ω^{k2}(sin y)^{2/n}. Non-contractible on the compact slice for
 * every n ≥ 3 (simplicial homology, refereed). Returns p4 plus surface tangents (for the normal offset).
 */
export const LOOP_PER_SEG = 65
export const LOOP_COUNT = 4 * LOOP_PER_SEG // = HANDOFF.H2.count: the Thread's points map 1:1
export function buildLoop(n: number) {
  const p4 = new Float64Array(LOOP_COUNT * 4)
  const tx = new Float64Array(LOOP_COUNT * 4)
  const ty = new Float64Array(LOOP_COUNT * 4)
  const segs: [number, number, boolean][] = [
    [0, 0, true],
    [1, 0, false],
    [1, 1, true],
    [0, 1, false],
  ]
  const q = new Float64Array(4)
  // The (cos y)^{2/n} parametrization bunches points away from the branch points, so each segment is
  // resampled at equal arc length (in ℝ⁴) — the Thread that later lies on the loop stays evenly beaded.
  const DENSE = 1024
  const ys = new Float64Array(DENSE + 1)
  const arc = new Float64Array(DENSE + 1)
  const prev = new Float64Array(4)
  for (let d = 0; d <= DENSE; d++) {
    const f = d / DENSE
    ys[d] = d === DENSE ? HALF_PI : HALF_PI * (0.5 - 0.5 * Math.cos(Math.PI * f))
    evalP4(n, 0, cosY(ys[d]), sinY(ys[d]), q)
    arc[d] = d === 0 ? 0 : arc[d - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2], q[3] - prev[3])
    prev.set(q)
  }
  const total = arc[DENSE]
  const yAtArc = (t: number) => {
    const target = t * total
    let lo = 0
    let hi = DENSE
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (arc[mid] < target) lo = mid
      else hi = mid
    }
    const w = (target - arc[lo]) / Math.max(1e-12, arc[hi] - arc[lo])
    return ys[lo] + w * (ys[hi] - ys[lo])
  }
  let i = 0
  for (const [k1, k2, up] of segs) {
    for (let m = 0; m < LOOP_PER_SEG; m++) {
      // half-open segments (the next segment starts at this one's end point)
      const f = m / LOOP_PER_SEG
      const y = m === 0 ? (up ? 0 : HALF_PI) : yAtArc(up ? f : 1 - f)
      evalP4(n, 0, cosY(y), sinY(y), q)
      // keep y strictly inside for the tangent (the normal at a branch point is taken from its neighbour)
      const ys = Math.min(HALF_PI - 2e-3, Math.max(2e-3, y))
      const a = new Float64Array(4)
      const b = new Float64Array(4)
      tangents(n, 0, ys, a, b)
      const r1 = (2 * Math.PI * k1) / n
      const r2 = (2 * Math.PI * k2) / n
      for (const arr of [q, a, b]) {
        rotC(arr, 0, r1)
        rotC(arr, 2, r2)
      }
      p4.set(q, i * 4)
      tx.set(a, i * 4)
      ty.set(b, i * 4)
      i++
    }
  }
  return { p4, tx, ty }
}

/** Project p4 → world (Y up) with hidden angle alpha and squash s. Mirrors cyShaders.ts exactly. */
export function projectP4(p: ArrayLike<number>, o: number, alpha: number, s: number, out: { x: number; y: number; z: number }) {
  const pz = Math.cos(alpha) * p[o + 1] + Math.sin(alpha) * p[o + 3]
  const Wx = S_WORLD * p[o]
  const Wy = S_WORLD * pz
  const Wz = -S_WORLD * p[o + 2]
  squashInto(Wx, Wy, Wz, s, out)
}

export function squashInto(Wx: number, Wy: number, Wz: number, s: number, out: { x: number; y: number; z: number }) {
  const Vx = Wx * (1 + 0.45 * s)
  const Vy = Wy * (1 - 0.3 * s)
  const Vz = Wz * (1 + 0.15 * s)
  const ph = KAPPA * s * Wy
  const c = Math.cos(ph)
  const sn = Math.sin(ph)
  out.x = c * Vx + sn * Vz
  out.y = Vy
  out.z = -sn * Vx + c * Vz
}

/** Unit surface normal at loop point i (projected tangents through the squash Jacobian). */
const JA = new Float64Array(3)
const JB = new Float64Array(3)
// Jacobian of (squash ∘ projection) applied to a p4 tangent, into out (allocation-free)
function jacT(t: Float64Array, o: number, ca: number, sa: number, s: number, Wx: number, Wy: number, Wz: number, out: Float64Array) {
  const tx = S_WORLD * t[o]
  const ty = S_WORLD * (ca * t[o + 1] + sa * t[o + 3])
  const tz = -S_WORLD * t[o + 2]
  const d0 = 1 + 0.45 * s
  const d1 = 1 - 0.3 * s
  const d2 = 1 + 0.15 * s
  const ph = KAPPA * s * Wy
  const c = Math.cos(ph)
  const sn = Math.sin(ph)
  const k = KAPPA * s * ty
  const Vx = Wx * d0
  const Vz = Wz * d2
  out[0] = c * tx * d0 + sn * tz * d2 + (-sn * Vx + c * Vz) * k
  out[1] = ty * d1
  out[2] = -sn * tx * d0 + c * tz * d2 + (-c * Vx - sn * Vz) * k
}

export function loopNormal(loop: { p4: Float64Array; tx: Float64Array; ty: Float64Array }, i: number, alpha: number, s: number, out: { x: number; y: number; z: number }) {
  const ca = Math.cos(alpha)
  const sa = Math.sin(alpha)
  const o = i * 4
  const p = loop.p4
  const Wx = S_WORLD * p[o]
  const Wy = S_WORLD * (ca * p[o + 1] + sa * p[o + 3])
  const Wz = -S_WORLD * p[o + 2]
  jacT(loop.tx, o, ca, sa, s, Wx, Wy, Wz, JA)
  jacT(loop.ty, o, ca, sa, s, Wx, Wy, Wz, JB)
  const nx = JA[1] * JB[2] - JA[2] * JB[1]
  const ny = JA[2] * JB[0] - JA[0] * JB[2]
  const nz = JA[0] * JB[1] - JA[1] * JB[0]
  const l = Math.hypot(nx, ny, nz) || 1
  out.x = nx / l
  out.y = ny / l
  out.z = nz / l
}

/** Topology readouts per degree (content pack › Model › 3). */
export const TOPO: Record<
  Degree,
  { parent: string; short: string; real: number; fixed: number; chi: string; g: number; trap: string; gen: string }
> = {
  // trap: does the parent have loops a string cannot shrink? (n ≥ 4: simply connected, by Lefschetz)
  3: { parent: 'Elliptic curve (a torus)', short: 'torus', real: 2, fixed: 0, chi: '0', g: 1, trap: 'Yes (torus)', gen: '6D rule only' },
  4: { parent: 'K3 surface', short: 'K3', real: 4, fixed: 1, chi: '24', g: 3, trap: 'None', gen: '6D rule only' },
  5: { parent: 'Quintic threefold', short: 'quintic', real: 6, fixed: 2, chi: '−200', g: 6, trap: 'None', gen: '100 · obs. 3' },
  6: { parent: 'Sextic fourfold', short: 'sextic', real: 8, fixed: 3, chi: '2610', g: 10, trap: 'None', gen: '6D rule only' },
}

/** Hanson's ViewPoint {2.9, 1.0, 1.4} (z up) → Y-up direction (2.9, 1.4, −1.0): the group rotation that brings it to +Z. */
export const HANSON_YAW = -Math.atan2(2.9, -1.0) // −109.03°: yaw that puts the view direction in the YZ plane
export const HANSON_PITCH = Math.atan2(1.4, Math.hypot(2.9, 1.0)) // 24.5°
