/*
 * Branes — the physics model (content/07-branes.md § Lab › Model). Pure functions, no three.js.
 *
 * Units: lengths in string lengths ℓ_s = √α′, masses in M_s = ħ/(c·ℓ_s). ħ = c = α′ = 1, so the
 * string tension is T = 1/(2π) and a string stretched a distance d has lowest mass m = T·d = d/2π.
 *   ladder:   m_ij,n = √((|y_i − y_j|/2π)² + n)      (type II superstring, parallel identical Dp-branes)
 *   stacks:   coincident branes (|Δy| < 1e−3) form U(n_k); massless carriers = Σ n_k², all types = N²
 */

export const TENSION = 1 / (2 * Math.PI)
export const BRANE_HALF = 5 // branes are 10 × 10 ℓ_s squares
export const Y_LIMIT = 5
export const SNAP = 0.2
export const HBARC_GEV_M = 1.97327e-16 // ħc in GeV·m (exact in the 2019 SI)

/** Lowest (n = 0) and excited stretched-string masses, in M_s. */
export const stretchedMass = (d: number, n = 0) => Math.sqrt((Math.abs(d) * TENSION) ** 2 + n)

/** Default brane positions for N = 1..4 (pack: N=2 → 0, 3 · N=3 → 0, 2, 3.5 · N=4 → 0, 1.5, 3, −2). */
export const DEFAULT_Y: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 3.5],
  4: [0, 1.5, 3, -2],
}

export interface Stack {
  /** brane indices in this stack */
  members: number[]
  y: number
}

/**
 * Cluster coincident branes into stacks. Stacks are ordered by their lowest brane index and list their members
 * in ascending order, so each stack is a contiguous block of the matrix (the pack's reason for sorting) while
 * rows keep their labels as branes merge and part: two branes read 1, 2 before, during and after touching.
 */
export function stacksOf(ys: readonly number[], eps = 1e-3): Stack[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => b.y - a.y || a.i - b.i)
  const out: Stack[] = []
  for (const o of order) {
    const last = out[out.length - 1]
    if (last && Math.abs(last.y - o.y) < eps) last.members.push(o.i)
    else out.push({ members: [o.i], y: o.y })
  }
  for (const st of out) st.members.sort((a, b) => a - b)
  return out.sort((a, b) => a.members[0] - b.members[0])
}

/** "U(2) × U(1)": product of U(n_k), largest first. */
export function symmetryLabel(stacks: Stack[]): string {
  return stacks
    .map((s) => s.members.length)
    .sort((a, b) => b - a)
    .map((n) => `U(${n})`)
    .join(' × ')
}

export const masslessCount = (stacks: Stack[]) => stacks.reduce((a, s) => a + s.members.length ** 2, 0)

/** Row order for the string matrix: stack by stack (see stacksOf), so stacks are contiguous blocks. */
export const matrixOrder = (stacks: Stack[]) => stacks.flatMap((s) => s.members)

/** Snap a brane position to any other brane within SNAP, and clamp to the bench. */
export function snapY(y: number, others: readonly number[]): number {
  let v = Math.max(-Y_LIMIT, Math.min(Y_LIMIT, y))
  for (const o of others) if (Math.abs(o - v) < SNAP) v = o
  return v
}

/* ───────────── Energy-scale assumptions (the string scale is unknown) ───────────── */

export type EnergyScale = 'units' | 'high' | 'tev'
/** M_s c² in GeV under each assumption (null = string units only). 10¹⁸ GeV is the site-wide traditional fiducial. */
export const MS_GEV: Record<EnergyScale, number | null> = { units: null, high: 1e18, tev: 1e4 }
/** ℓ_s in meters under an assumption: ℓ_s = ħc / (M_s c²). */
export const lsMeters = (s: EnergyScale) => {
  const m = MS_GEV[s]
  return m ? HBARC_GEV_M / m : null
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const sup = (n: number) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')

/** 4.8 × 10¹⁶ (two significant figures). */
export function sci2(v: number): string {
  if (!(v > 0)) return '0'
  let e = Math.floor(Math.log10(v))
  let m = v / 10 ** e
  if (m >= 9.95) {
    m /= 10
    e += 1
  }
  return `${m.toFixed(1)} × 10${sup(e)}`
}

/** A mass in GeV as the most readable unit: "≈ 4.8 TeV", "≈ 4.8 × 10¹⁶ GeV". */
export function fmtGeV(gev: number): string {
  if (gev <= 0) return '0 GeV'
  if (gev >= 1e3 && gev < 1e6) return `≈ ${(gev / 1e3).toPrecision(2)} TeV`
  if (gev < 1e3) return `≈ ${gev.toPrecision(2)} GeV`
  return `≈ ${sci2(gev)} GeV`
}
export const fmtMeters = (m: number) => (m > 0 ? `≈ ${sci2(m)} m` : '0 m')

/* ───────────── Closed-loop ∩ brane (the on-brane slice) ───────────── */

/**
 * Crossings of a closed polyline (n points, xyz) with the plane y = yRef.
 * Writes crossing points into out (xyz) and returns how many (usually 0 or 2).
 */
export function loopCrossings(pts: Float32Array, n: number, yRef: number, out: Float32Array, max = 4): number {
  let c = 0
  for (let i = 0; i < n && c < max; i++) {
    const j = (i + 1) % n
    const a = pts[i * 3 + 1] - yRef
    const b = pts[j * 3 + 1] - yRef
    if ((a <= 0 && b > 0) || (a > 0 && b <= 0)) {
      const t = a / (a - b)
      out[c * 3] = pts[i * 3] + (pts[j * 3] - pts[i * 3]) * t
      out[c * 3 + 1] = yRef
      out[c * 3 + 2] = pts[i * 3 + 2] + (pts[j * 3 + 2] - pts[i * 3 + 2]) * t
      c++
    }
  }
  return c
}

/* ───────────── Braneworld gravity (Beat 6): a mass plus its periodic images ───────────── */

/**
 * Field lines of a unit mass at the origin in a slab bulk whose extra direction y is a circle of
 * period L: images at (0, kL, 0), k = −K…K, g(r) = −Σ (r − r_k)/|r − r_k|³. Lines start on a sphere of
 * radius 0.1 (Fibonacci directions) and are integrated outward along −g with RK4 (unit-speed, step h).
 * Near the mass they spread in 3D; beyond ~L they bend until they run parallel to the brane.
 * Returns one Float32Array (xyz per step) per line, stopped at the bench edge |x|,|z| ≤ half.
 */
export function gravityLines(count = 48, L = 2, K = 12, h = 0.05, steps = 240, half = BRANE_HALF): Float32Array[] {
  const field = (x: number, y: number, z: number, o: number[]) => {
    let gx = 0
    let gy = 0
    let gz = 0
    for (let k = -K; k <= K; k++) {
      const dy = y - k * L
      const r2 = x * x + dy * dy + z * z
      const r3 = r2 * Math.sqrt(r2) + 1e-9
      gx -= x / r3
      gy -= dy / r3
      gz -= z / r3
    }
    // integrate along −g (outward), normalized → arc-length parametrization
    const m = Math.hypot(gx, gy, gz) + 1e-12
    o[0] = -gx / m
    o[1] = -gy / m
    o[2] = -gz / m
  }
  const lines: Float32Array[] = []
  const k1 = [0, 0, 0]
  const k2 = [0, 0, 0]
  const k3 = [0, 0, 0]
  const k4 = [0, 0, 0]
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const yy = 1 - (2 * (i + 0.5)) / count
    const rr = Math.sqrt(1 - yy * yy)
    const th = golden * i
    let x = 0.1 * rr * Math.cos(th)
    let y = 0.1 * yy
    let z = 0.1 * rr * Math.sin(th)
    const buf: number[] = [x, y, z]
    for (let s = 0; s < steps; s++) {
      field(x, y, z, k1)
      field(x + 0.5 * h * k1[0], y + 0.5 * h * k1[1], z + 0.5 * h * k1[2], k2)
      field(x + 0.5 * h * k2[0], y + 0.5 * h * k2[1], z + 0.5 * h * k2[2], k3)
      field(x + h * k3[0], y + h * k3[1], z + h * k3[2], k4)
      x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
      y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
      z += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])
      if (Math.abs(x) > half || Math.abs(z) > half) break
      buf.push(x, y, z)
    }
    lines.push(new Float32Array(buf))
  }
  return lines
}

/* ───────────── Smooth deterministic "random walks" ───────────── */

/** Smooth band-limited noise in ≈[−1, 1] (three incommensurate sines). Pure function of t and seed. */
export function wobble(t: number, seed: number): number {
  const a = seed * 12.9898
  return (Math.sin(t + a) + 0.62 * Math.sin(1.731 * t + 2.3 * a + 1.1) + 0.37 * Math.sin(2.917 * t + 3.7 * a + 2.4)) / 1.75
}

/** Soft reflection into [−lim, lim] (a random walk bouncing off the bench edge). */
export function fold(x: number, lim: number): number {
  const p = 4 * lim
  let u = (((x + lim) % p) + p) % p
  u = u < 2 * lim ? u : p - u
  return u - lim
}
