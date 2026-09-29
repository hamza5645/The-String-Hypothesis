// The physics of Chapter 08, as specified in content/08-duality.md § Model.
// Pure TypeScript: shared by the Overlay (first-paint bundle) and the Scene. No three.js here.
//
// Closed type II superstring with one direction on a circle of radius R (tree-level spectrum):
//   M² = (n/R)² + (wR/α′)² + (2/α′)(N + Ñ),   N − Ñ = n·w
// Units: ħ = c = 1, ℓs = √α′ = 1, r = R/ℓs, plotted y = α′M² (dimensionless).
// A bar is a family (a, b, S) = (|n|, |w|, N+Ñ); allowed: S ≥ ab, S ≡ ab (mod 2), not (0,0,0).

export const R_MIN = 0.1
export const R_MAX = 10

/** Slider position u ∈ [0,1] ↔ radius r = 10^(2u − 1). */
export const rFromU = (u: number) => Math.pow(10, 2 * u - 1)
export const uFromR = (r: number) => (1 + Math.log10(r)) / 2
/** Soft detent at the self-dual radius: |log₁₀ r| < 0.02 snaps to r = 1 (tolerant to float error at the rim). */
export const snapR = (r: number) => (Math.abs(Math.log10(r)) < 0.02 - 1e-9 ? 1 : r)
export const clampR = (r: number) => Math.min(R_MAX, Math.max(R_MIN, r))

/** Visual radius of a hidden-circle cylinder (circles drawn ∝ √R, not to scale). */
export const rho = (r: number) => Math.min(2.0, Math.max(0.28, 0.9 * Math.sqrt(r)))

// ───────────────────────────── candidate families ─────────────────────────────

const cand = (() => {
  const A: number[] = []
  const B: number[] = []
  const S: number[] = []
  for (let a = 0; a <= 60; a++)
    for (let b = 0; b <= 60; b++) {
      const ab = a * b
      if (ab > 12) continue
      for (let s = ab; s <= 12; s += 2) {
        if (a === 0 && b === 0 && s === 0) continue
        A.push(a)
        B.push(b)
        S.push(s)
      }
    }
  return { A: Int16Array.from(A), B: Int16Array.from(B), S: Int16Array.from(S), n: A.length }
})()

export const CANDIDATES = cand.n

const Y = new Float64Array(cand.n)

/** Does candidate i sort before j? Heights within 1e−9 tie; then (S, max(a,b), min(a,b), −a). */
function before(i: number, j: number) {
  const d = Y[i] - Y[j]
  if (d < -1e-9) return true
  if (d > 1e-9) return false
  const { A, B, S } = cand
  if (S[i] !== S[j]) return S[i] < S[j]
  const mi = Math.max(A[i], B[i])
  const mj = Math.max(A[j], B[j])
  if (mi !== mj) return mi < mj
  const ni = Math.min(A[i], B[i])
  const nj = Math.min(A[j], B[j])
  if (ni !== nj) return ni < nj
  return A[i] > A[j]
}

/**
 * The lowest `k` string families at radius r, written into `out` (a, b, S, y per family,
 * flattened: out[4i..4i+3]). Allocation-free; safe inside frame loops. Returns k.
 */
export function lowestInto(r: number, k: number, out: Float64Array, idx: Int32Array) {
  const { A, B, S, n } = cand
  const r2 = r * r
  const ir2 = 1 / r2
  for (let i = 0; i < n; i++) Y[i] = A[i] * A[i] * ir2 + B[i] * B[i] * r2 + 2 * S[i]
  let m = 0
  for (let i = 0; i < n; i++) {
    if (m === k && !before(i, idx[m - 1])) continue
    let p = m < k ? m++ : k - 1
    while (p > 0 && before(i, idx[p - 1])) {
      idx[p] = idx[p - 1]
      p--
    }
    idx[p] = i
  }
  for (let j = 0; j < k; j++) {
    const i = idx[j]
    out[4 * j] = A[i]
    out[4 * j + 1] = B[i]
    out[4 * j + 2] = S[i]
    out[4 * j + 3] = Y[i]
  }
  return k
}

export interface Family {
  /** |n| — momentum number */
  a: number
  /** |w| — winding number */
  b: number
  /** N + Ñ — vibration level */
  S: number
  /** α′M² */
  y: number
  mom: number
  wind: number
  vib: number
}

const famBuf = new Float64Array(64)
const idxBuf = new Int32Array(64)

/** Lowest `k` families at radius r (allocates; for React renders, not frame loops). */
export function lowestFamilies(r: number, k = 16): Family[] {
  lowestInto(r, k, famBuf, idxBuf)
  const out: Family[] = []
  for (let j = 0; j < k; j++) {
    const a = famBuf[4 * j]
    const b = famBuf[4 * j + 1]
    const S = famBuf[4 * j + 2]
    out.push({ a, b, S, y: famBuf[4 * j + 3], mom: (a * a) / (r * r), wind: b * b * r * r, vib: 2 * S })
  }
  return out
}

/** A point particle on the same circle: no winding, no vibration. World A reads a²/r², World B a²r². */
export function pointFamilies(r: number, k = 16) {
  const out: { a: number; yA: number; yB: number }[] = []
  for (let a = 1; a <= k; a++) out.push({ a, yA: (a * a) / (r * r), yB: a * a * r * r })
  return out
}

/** Segment stack for one column: vibration at the base, then the smaller of (mom, wind), then the larger. */
export function stack(mom: number, wind: number, vib: number) {
  const momFirst = mom <= wind
  return {
    lo: momFirst ? mom : wind,
    hi: momFirst ? wind : mom,
    loIsMom: momFirst,
    vib,
  }
}

// ───────────────────────────── spectrum map (strip, Beat 5 plot) ─────────────────────────────

/** Families drawn on the spectrum map: a, b ≤ 6 and S ∈ {ab, ab+2, ab+4} (schematic truncation). */
export const MAP_FAMILIES: { a: number; b: number; S: number }[] = (() => {
  const f: { a: number; b: number; S: number }[] = []
  for (let a = 0; a <= 6; a++)
    for (let b = 0; b <= 6; b++)
      for (const dS of [0, 2, 4]) {
        const S = a * b + dS
        if (a === 0 && b === 0 && S === 0) continue
        if (2 * S > 10) continue // entirely above the y = 10 frame
        f.push({ a, b, S })
      }
  return f
})()

/** y(x) for a family at x = log₁₀ r. */
export const famY = (a: number, b: number, S: number, x: number) => {
  const r2 = Math.pow(10, 2 * x)
  return (a * a) / r2 + b * b * r2 + 2 * S
}
/** Locally dominant term: 1 = momentum (blue), −1 = winding (amber), 0 = pure vibration (grey). */
export const famTone = (a: number, b: number, x: number) => {
  if (a === 0 && b === 0) return 0
  const r2 = Math.pow(10, 2 * x)
  return (a * a) / r2 > b * b * r2 ? 1 : -1
}

// ───────────────────────────── Beat 1: isospectral drums ─────────────────────────────

/** Gordon–Webb–Wolpert drums (unit legs), vertices in order. Both: area 3.5, perimeter 6 + 3√2. */
export const DRUM_A: [number, number][] = [
  [0, 0],
  [0, 1],
  [2, 3],
  [2, 2],
  [3, 2],
  [2, 1],
  [1, 1],
  [1, 0],
]
export const DRUM_B: [number, number][] = [
  [1, 0],
  [0, 1],
  [0, 2],
  [2, 2],
  [2, 3],
  [3, 2],
  [2, 1],
  [1, 1],
]
/** The 6 internal edges of each drum's decomposition into 7 congruent right-isosceles triangles. */
export const DRUM_A_CUTS: [number, number, number, number][] = [
  [0, 0, 1, 1],
  [0, 1, 1, 1],
  [1, 1, 1, 2],
  [1, 1, 2, 2],
  [1, 2, 2, 2],
  [2, 1, 2, 2],
]
export const DRUM_B_CUTS: [number, number, number, number][] = [
  [0, 1, 1, 1],
  [1, 1, 0, 2],
  [1, 1, 1, 2],
  [1, 1, 2, 2],
  [2, 1, 2, 2],
  [2, 2, 3, 2],
]
/** Frequency ratios √(λₖ/λ₁) of the first 8 Dirichlet modes (Driscoll 1997; Amore et al. 2015). */
export const DRUM_RATIOS = [1.0, 1.2, 1.428, 1.605, 1.69, 1.905, 2.043, 2.132]

export function polygonCentroid(v: [number, number][]) {
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < v.length; i++) {
    const [x0, y0] = v[i]
    const [x1, y1] = v[(i + 1) % v.length]
    const c = x0 * y1 - x1 * y0
    a += c
    cx += (x0 + x1) * c
    cy += (y0 + y1) * c
  }
  a *= 0.5
  return { x: cx / (6 * a), y: cy / (6 * a), area: Math.abs(a) }
}

// ───────────────────────────── scroll timeline ─────────────────────────────

/** Overlay steps in order, with their lengths (viewports). The Scene's timeline T = Σ step progress. */
export const STEPS = [
  ['title', 1.15],
  ['opening', 1.1],
  ['drums', 1.5],
  ['momentum', 1.45],
  ['winding', 1.55],
  ['aha', 2.1],
  ['landing', 1.45],
  ['selfdual', 1.6],
  ['web', 1.7],
  ['lab', 2.4],
  ['outro', 1.5],
] as const

export type StepId = (typeof STEPS)[number][0]
export const stepLen = (id: StepId) => STEPS.find((s) => s[0] === id)![1]
