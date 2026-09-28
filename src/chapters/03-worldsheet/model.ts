/*
 * Chapter 03 · Worldsheets — the physics model (content/03-worldsheet.md › Lab › Model).
 * Pure math, no three.js: shared by the Scene (3D) and the Overlay (lab readouts, inset).
 *
 * Units: 1 unit = 1 ℓ (a string-scale unit, not to scale). Time is drawn as ct in the same unit,
 * so light moves at 45°. Physics coordinates (x, y, t) map to world (X = x, Y = t, Z = y).
 */

/* ───────────────────────── 1. The pants surface (implicit) ───────────────────────── */

/** Level of the implicit surface Φ = L (inside: Φ > L). */
export const L = 0.25
/** c(t) = 1.2 [1 + tanh((t − 5)/1.6)] — half the distance between the two leg centres. */
export const cPants = (t: number) => 1.2 * (1 + Math.tanh((t - 5) / 1.6))
/** dc/dt = (1.2/1.6)·sech²((t − 5)/1.6). */
export const dcPants = (t: number) => {
  const s = 1 / Math.cosh((t - 5) / 1.6)
  return 0.75 * s * s
}
/** Φ(x, y, t) = e^{−[(x−c)² + y²]} + e^{−[(x+c)² + y²]}. */
export const phiPants = (x: number, y: number, t: number) => {
  const c = cPants(t)
  const ey = Math.exp(-y * y)
  return ey * (Math.exp(-(x - c) * (x - c)) + Math.exp(-(x + c) * (x + c)))
}

/** Untilted pinch: c(t*) = √ln 8 → t* = 5 + 1.6·atanh(√ln8/1.2 − 1). */
export const T_STAR = 5 + 1.6 * Math.atanh(Math.sqrt(Math.log(8)) / 1.2 - 1)
export const WAIST_R = Math.sqrt(Math.log(8)) // 1.442
export const LEG_R = Math.sqrt(Math.log(4)) // 1.18

/** Near the crotch the surface is a graph t = T(x, y): 40-step bisection of Φ(x, y, T) = L on [3, 8]. */
export function crotchT(x: number, y: number) {
  let lo = 3
  let hi = 8
  for (let i = 0; i < 40; i++) {
    const m = 0.5 * (lo + hi)
    if (phiPants(x, y, m) > L) lo = m
    else hi = m
  }
  return 0.5 * (lo + hi)
}

/** ∇T by implicit differentiation at (x, y, T(x, y)): T_x = −Φ_x/Φ_t, T_y = −Φ_y/Φ_t. Writes into out[0..1]. */
function gradT(x: number, y: number, out: Float64Array, o: number) {
  const t = crotchT(x, y)
  const c = cPants(t)
  const dc = dcPants(t)
  const ey = Math.exp(-y * y)
  const e1 = ey * Math.exp(-(x - c) * (x - c))
  const e2 = ey * Math.exp(-(x + c) * (x + c))
  const px = -2 * (x - c) * e1 - 2 * (x + c) * e2
  const py = -2 * y * (e1 + e2)
  const pt = 2 * dc * ((x - c) * e1 - (x + c) * e2)
  out[o] = -px / pt
  out[o + 1] = -py / pt
  return t
}

export interface Split {
  x: number
  y: number
  /** ct of the split event */
  t: number
  /** plane offset t₀* at which this slicing sees the split */
  t0: number
}

const g0 = new Float64Array(2)
const gx = new Float64Array(4)
/**
 * The split point for a slicing (Model 3): tangency ∂T = tanθ·(cos φ, sin φ), solved by 2-D Newton with
 * central differences (h = 10⁻³), 8 iterations. Warm-start from `seed` when given (smooth animations).
 */
export function solveSplit(theta: number, phi: number, out: Split, seed?: { x: number; y: number }) {
  const k = Math.tan(theta)
  const a = k * Math.cos(phi)
  const b = k * Math.sin(phi)
  let x = seed ? seed.x : 0
  let y = seed ? seed.y : 0
  if (k < 1e-9) {
    x = 0
    y = 0
  } else {
    const h = 1e-3
    for (let it = 0; it < 8; it++) {
      gradT(x, y, g0, 0)
      const fx = g0[0] - a
      const fy = g0[1] - b
      gradT(x + h, y, gx, 0)
      gradT(x - h, y, gx, 2)
      const j11 = (gx[0] - gx[2]) / (2 * h)
      const j21 = (gx[1] - gx[3]) / (2 * h)
      gradT(x, y + h, gx, 0)
      gradT(x, y - h, gx, 2)
      const j12 = (gx[0] - gx[2]) / (2 * h)
      const j22 = (gx[1] - gx[3]) / (2 * h)
      const det = j11 * j22 - j12 * j21
      if (Math.abs(det) < 1e-12) break
      x -= (j22 * fx - j12 * fy) / det
      y -= (-j21 * fx + j11 * fy) / det
    }
  }
  const t = crotchT(x, y)
  out.x = x
  out.y = y
  out.t = t
  out.t0 = t - (a * x + b * y)
  return out
}

/* ───────────────────────── 2. The slicing plane ("now") ───────────────────────── */

/** h(x, y, t) = t − t₀ − tanθ·(x cos φ + y sin φ); the plane is h = 0. */
export const planeT = (x: number, y: number, t0: number, theta: number, phi: number) => t0 + Math.tan(theta) * (x * Math.cos(phi) + y * Math.sin(phi))

/* ───────────────────────── 4. The particle "Y" ───────────────────────── */

/** Vertex event of the particle Y (same ct as the untilted pinch, for a fair comparison). */
export const T_VERTEX = T_STAR
/** Outgoing branches move apart at ±0.45c. */
export const Y_SPEED = 0.45

/**
 * Where a plane cuts the Y (analytic). Returns the number of dots (1 or 2) and writes (x, t) pairs:
 * incoming (0, 0, t₀) while t₀ < t_v; otherwise the two branches (±0.45(t − t_v), 0, t).
 */
export function sliceY(t0: number, theta: number, phi: number, out: Float64Array) {
  const a = Math.tan(theta) * Math.cos(phi)
  if (t0 < T_VERTEX) {
    out[0] = 0
    out[1] = t0
    return 1
  }
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? -1 : 1
    const t = (t0 - sg * Y_SPEED * a * T_VERTEX) / (1 - sg * Y_SPEED * a)
    out[s * 2] = sg * Y_SPEED * (t - T_VERTEX)
    out[s * 2 + 1] = t
  }
  return 2
}

/* ───────────────────────── Analytic slice: marching squares on the plane ───────────────────────── */

export const SLICE = { x0: -4, x1: 4, y0: -1.8, y1: 1.8, step: 0.04 }
const NX = Math.round((SLICE.x1 - SLICE.x0) / SLICE.step) + 1 // 201
const NY = Math.round((SLICE.y1 - SLICE.y0) / SLICE.step) + 1 // 91
const HE = (NX - 1) * NY // horizontal edges
const VE = NX * (NY - 1) // vertical edges
export const MAX_COMPONENTS = 4
export const MAX_SLICE_POINTS = 6000

export interface SliceResult {
  /** number of components found */
  n: number
  /** how many of them are closed loops */
  closedCount: number
  /** start offset (in points) of each component inside `pts` */
  start: Int32Array
  count: Int32Array
  closed: Uint8Array
  /** x, y, t per point */
  pts: Float32Array
}

export function createSlicer() {
  const g = new Float32Array(NX * NY)
  const ts = new Float32Array(NX * NY)
  const link = new Int32Array((HE + VE) * 2).fill(-1)
  const touched = new Int32Array(HE + VE)
  const seen = new Uint8Array(HE + VE)
  let nTouched = 0
  const res: SliceResult = {
    n: 0,
    closedCount: 0,
    start: new Int32Array(MAX_COMPONENTS),
    count: new Int32Array(MAX_COMPONENTS),
    closed: new Uint8Array(MAX_COMPONENTS),
    pts: new Float32Array(MAX_SLICE_POINTS * 3),
  }

  const addLink = (e: number, other: number) => {
    const o = e * 2
    if (link[o] < 0 && link[o + 1] < 0) touched[nTouched++] = e
    if (link[o] < 0) link[o] = other
    else if (link[o + 1] < 0 && link[o] !== other) link[o + 1] = other
  }
  const seg = (e1: number, e2: number) => {
    addLink(e1, e2)
    addLink(e2, e1)
  }
  // edge id → crossing point (x, y) by linear interpolation; t from the plane
  let wp = 0
  const emit = (e: number) => {
    let i0: number, i1: number
    if (e < HE) {
      const j = Math.floor(e / (NX - 1))
      const i = e - j * (NX - 1)
      i0 = j * NX + i
      i1 = i0 + 1
    } else {
      const k = e - HE
      i0 = k
      i1 = k + NX
    }
    const a = g[i0]
    const b = g[i1]
    const f = a / (a - b)
    const xa = SLICE.x0 + (i0 % NX) * SLICE.step
    const ya = SLICE.y0 + Math.floor(i0 / NX) * SLICE.step
    const xb = SLICE.x0 + (i1 % NX) * SLICE.step
    const yb = SLICE.y0 + Math.floor(i1 / NX) * SLICE.step
    if (wp >= MAX_SLICE_POINTS) return
    res.pts[wp * 3] = xa + (xb - xa) * f
    res.pts[wp * 3 + 1] = ya + (yb - ya) * f
    res.pts[wp * 3 + 2] = ts[i0] + (ts[i1] - ts[i0]) * f
    wp++
  }

  /**
   * Slice a field on the tilted plane t = t₀ + a·x + b·y. `field(x, y, t)` returns Φ − L (inside > 0).
   * Allocation-free; the returned object is reused.
   */
  function slice(field: (x: number, y: number, t: number) => number, t0: number, theta: number, phi: number) {
    const k = Math.tan(theta)
    const a = k * Math.cos(phi)
    const b = k * Math.sin(phi)
    for (let j = 0; j < NY; j++) {
      const y = SLICE.y0 + j * SLICE.step
      for (let i = 0; i < NX; i++) {
        const x = SLICE.x0 + i * SLICE.step
        const t = t0 + a * x + b * y
        const idx = j * NX + i
        ts[idx] = t
        let v = field(x, y, t)
        if (v === 0) v = 1e-9
        g[idx] = v
      }
    }
    for (let q = 0; q < nTouched; q++) {
      const e = touched[q]
      link[e * 2] = -1
      link[e * 2 + 1] = -1
      seen[e] = 0
    }
    nTouched = 0
    for (let j = 0; j < NY - 1; j++) {
      for (let i = 0; i < NX - 1; i++) {
        const i00 = j * NX + i
        const v00 = g[i00]
        const v10 = g[i00 + 1]
        const v01 = g[i00 + NX]
        const v11 = g[i00 + NX + 1]
        const c = (v00 > 0 ? 1 : 0) | (v10 > 0 ? 2 : 0) | (v11 > 0 ? 4 : 0) | (v01 > 0 ? 8 : 0)
        if (c === 0 || c === 15) continue
        const eB = j * (NX - 1) + i // bottom (y=j)
        const eT = (j + 1) * (NX - 1) + i // top (y=j+1)
        const eL = HE + j * NX + i // left (x=i)
        const eR = HE + j * NX + i + 1 // right (x=i+1)
        switch (c) {
          case 1:
          case 14:
            seg(eL, eB)
            break
          case 2:
          case 13:
            seg(eB, eR)
            break
          case 3:
          case 12:
            seg(eL, eR)
            break
          case 4:
          case 11:
            seg(eR, eT)
            break
          case 6:
          case 9:
            seg(eB, eT)
            break
          case 7:
          case 8:
            seg(eL, eT)
            break
          case 5:
          case 10: {
            const centre = (v00 + v10 + v01 + v11) * 0.25 > 0
            if ((c === 5) === centre) {
              seg(eL, eT)
              seg(eB, eR)
            } else {
              seg(eL, eB)
              seg(eR, eT)
            }
            break
          }
        }
      }
    }
    // chain into polylines: open chains first (start at ends), then closed loops
    res.n = 0
    res.closedCount = 0
    wp = 0
    for (let pass = 0; pass < 2; pass++) {
      for (let q = 0; q < nTouched; q++) {
        const e0 = touched[q]
        if (seen[e0]) continue
        const deg = (link[e0 * 2] >= 0 ? 1 : 0) + (link[e0 * 2 + 1] >= 0 ? 1 : 0)
        if (pass === 0 && deg !== 1) continue
        if (res.n >= MAX_COMPONENTS) break
        const ci = res.n++
        res.start[ci] = wp
        let prev = -1
        let cur = e0
        let closed = 0
        for (;;) {
          seen[cur] = 1
          emit(cur)
          const l0 = link[cur * 2]
          const l1 = link[cur * 2 + 1]
          const nxt = l0 >= 0 && l0 !== prev && !seen[l0] ? l0 : l1 >= 0 && l1 !== prev && !seen[l1] ? l1 : -1
          if (nxt < 0) {
            if ((l0 === e0 || l1 === e0) && cur !== e0) closed = 1
            break
          }
          prev = cur
          cur = nxt
        }
        res.count[ci] = wp - res.start[ci]
        res.closed[ci] = closed
        if (closed) res.closedCount++
      }
    }
    return res
  }
  return { slice, result: res }
}

/** Field adapters (Φ − L). */
export const pantsField = (x: number, y: number, t: number) => phiPants(x, y, t) - L

/* ───────────────────────── Beat 5: the handle (string loop) ───────────────────────── */

/** c(t) = 1.7·exp(−((t − 5)/w)²); the mesh is baked once at w = 1.5 and rescaled in time about t = 5. */
export const HANDLE_W0 = 1.5
export const cHandle = (t: number, w = HANDLE_W0) => 1.7 * Math.exp(-((t - 5) / w) * ((t - 5) / w))
export const dcHandle = (t: number, w = HANDLE_W0) => -2 * ((t - 5) / (w * w)) * cHandle(t, w)
/** Hole height 2w·√ln(1.7/1.442) = 0.811·w. */
export const holeHeight = (w: number) => 2 * w * Math.sqrt(Math.log(1.7 / WAIST_R))

/* ───────────────────────── Beat 6: open string closing (cartoon) ───────────────────────── */

export const ARC_R = 1.2
export const JOIN_T = 5
/** the tube above the join runs up to ct = 9; the OUT crane ends looking down on this ring */
export const CLOSE_TOP = 9
/** g(t) = 2.4·√max(0, 1 − t/5) rad — the angular gap of the C-shaped open string. */
export const gapAngle = (t: number) => 2.4 * Math.sqrt(Math.max(0, 1 - t / JOIN_T))

/* ───────────────────────── Beat 2: proper time ───────────────────────── */

export const GAMMA_06 = 1 / Math.sqrt(1 - 0.36) // 1.25

/* ───────────────────────── Formatting ───────────────────────── */

export const signed = (v: number, d = 2) => {
  const s = v.toFixed(d)
  if (Number(s) === 0) return (0).toFixed(d)
  return v > 0 ? '+' + s : s
}
