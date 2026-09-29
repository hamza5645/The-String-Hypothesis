// Chapter 09 · M-theory — the pack's Model, as pure functions (content/09-m-theory.md § Lab › Model).
// Everything here is allocation-free at call time unless it says "once".

import type { StatusKind } from '@/ui'

export const DEG = Math.PI / 180
export const SEA = 0.35
export const ISLAND_R = 4.3
export const RESIDENT_Y = 1.45

/* ───────────────────────── Map nodes (the six tips) ───────────────────────── */

export type TipId = 'M11' | 'IIA' | 'IIB' | 'I' | 'HO' | 'HE'
export type Theory = 'I' | 'IIA' | 'IIB' | 'HO' | 'HE'

export interface Tip {
  id: TipId
  theta: number // degrees, CCW from +X seen from above
  name: string
  short: string
  caption?: string
  hover: string
}

// Index order is used everywhere (uniform arrays, union-find): 0 11D, 1 IIA, 2 IIB, 3 I, 4 HO, 5 HE.
export const TIPS: Tip[] = [
  { id: 'M11', theta: 90, name: 'Eleven-dimensional supergravity', short: '11D', hover: 'Not a string theory: supergravity in eleven dimensions, the maximum allowed (1978).' },
  { id: 'IIA', theta: 30, name: 'Type IIA', short: 'IIA', caption: 'CLOSED · MIRROR-IMAGE MOVERS (NON-CHIRAL)', hover: 'Closed strings; the two movers are mirror images (non-chiral). 32 supercharges.' },
  { id: 'IIB', theta: -30, name: 'Type IIB', short: 'IIB', caption: 'CLOSED · SAME-HANDED MOVERS (CHIRAL)', hover: 'Closed strings; both movers share one handedness (chiral). 32 supercharges. Its own S-dual.' },
  { id: 'I', theta: -90, name: 'Type I', short: 'I', caption: 'OPEN + CLOSED · NO ARROW (UNORIENTED) · SO(32)', hover: 'Open and closed strings, no arrow along them. Symmetry SO(32). 16 supercharges.' },
  { id: 'HO', theta: -150, name: 'Heterotic SO(32)', short: 'HO', caption: 'HYBRID STRING · SYMMETRY SO(32) · 496 FORCE CARRIERS', hover: 'Hybrid closed string: super one way, bosonic the other. Symmetry SO(32).' },
  { id: 'HE', theta: 150, name: 'Heterotic E8×E8', short: 'HE', caption: 'HYBRID STRING · SYMMETRY E8×E8 · 496 FORCE CARRIERS', hover: 'The same hybrid string with symmetry E8×E8. Early favourite for particle-physics models.' },
]
export const TIP_INDEX: Record<TipId, number> = { M11: 0, IIA: 1, IIB: 2, I: 3, HO: 4, HE: 5 }
export const THEORIES: Theory[] = ['I', 'IIA', 'IIB', 'HO', 'HE']

/** Unit direction of tip j in the map plane, as world (x, z). North = −Z. */
export const tipDir = (j: number): [number, number] => {
  const t = TIPS[j].theta * DEG
  return [Math.cos(t), -Math.sin(t)]
}
/** Island centre cⱼ = 4.3·(cos θ, 0, −sin θ). */
export const tipCenter = (j: number, r = ISLAND_R): [number, number, number] => {
  const [x, z] = tipDir(j)
  return [r * x, 0, r * z]
}
/** OrbitRig azimuth of a camera placed outward along tip j, looking back in toward the map centre. */
export const outwardAzimuth = (j: number) => Math.PI / 2 + TIPS[j].theta * DEG

/* ───────────────────────── Bridges (edges) ───────────────────────── */

export type BridgeKind = 'T' | 'S' | 'L' | 'C'
export interface Bridge {
  id: string
  kind: BridgeKind
  a: number
  b: number
  /** Curl-up chord only: second branch end. */
  c?: number
  status: StatusKind
  mid?: string
  story?: string
  hover: string
}

export const BRIDGES: Bridge[] = [
  { id: 't-ii', kind: 'T', a: 1, b: 2, status: 'derived', mid: 'R = √α′', story: 'NEEDS A CIRCLE · R ↔ α′/R', hover: 'IIA on a circle of radius R = IIB on radius α′/R. Needs one dimension curled up.' },
  { id: 't-het', kind: 'T', a: 4, b: 5, status: 'derived', mid: 'R ~ √α′', story: 'NEEDS A CIRCLE + WILSON LINE · R ↔ ~α′/R', hover: "Heterotic SO(32) on a circle = E8×E8 on the dual circle, with a symmetry-breaking 'Wilson line'." },
  { id: 's-i-ho', kind: 'S', a: 3, b: 4, status: 'conjectured', mid: 'g = 1', hover: "Type I at coupling g = heterotic SO(32) at 1/g. Type I's D-string is the heterotic string." },
  { id: 's-iib', kind: 'S', a: 2, b: 2, status: 'conjectured', mid: 'g ↔ 1/g · F-STRING ↔ D-STRING', story: 'IIB ↔ IIB · g ↔ 1/g · F-STRING ↔ D-STRING', hover: 'IIB at g = IIB at 1/g, fundamental and D-strings exchanged. Part of a larger SL(2,ℤ) symmetry.' },
  { id: 'l-iia', kind: 'L', a: 1, b: 0, status: 'conjectured', mid: 'R₁₁ ≈ ℓ₁₁', hover: 'Strongly coupled IIA = M-theory on a circle of radius R₁₁ = g ℓ_s.' },
  { id: 'l-he', kind: 'L', a: 5, b: 0, status: 'conjectured', mid: 'INTERVAL ≈ ℓ₁₁', hover: 'Strongly coupled E8×E8 = M-theory on an interval between two walls (Hořava–Witten).' },
  { id: 'c-k3', kind: 'C', a: 1, b: 4, c: 5, status: 'conjectured', hover: 'Curl up four dimensions: IIA on a K3 surface = heterotic on a four-torus.' },
]
export const BRIDGE_INDEX: Record<string, number> = Object.fromEntries(BRIDGES.map((b, i) => [b.id, i]))

export interface Toggles {
  T: boolean
  S: boolean
  L: boolean
  C: boolean
}

/** Union-find over the six nodes → number of separate pieces (pack table: none 6 … T+S+Lift 1). */
export function countPieces(active: (b: Bridge) => boolean): number {
  const parent = [0, 1, 2, 3, 4, 5]
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  const join = (a: number, b: number) => {
    parent[find(a)] = find(b)
  }
  for (const b of BRIDGES) {
    if (!active(b)) continue
    join(b.a, b.b)
    if (b.c != null) join(b.a, b.c)
  }
  let n = 0
  for (let i = 0; i < 6; i++) if (find(i) === i) n++
  return n
}
export const piecesFor = (t: Toggles) => countPieces((b) => t[b.kind])

/* ───────────────────────── Couplings & the dial ───────────────────────── */

/** Lab slider u ∈ [0,1] → g = 10^(−1.301 + 2.602u), i.e. 0.05 … 20. */
export const gFromU = (u: number) => Math.pow(10, -1.301 + 2.602 * u)
export const uFromG = (g: number) => (Math.log10(g) + 1.301) / 2.602

/** Coupling cartoon along a string horn: g(ρ) = 10^((4.3 − ρ)/1.3 − 1). (~ANALOGY) */
export const gOfRho = (rho: number) => Math.pow(10, (4.3 - rho) / 1.3 - 1)
export const G_CONTOURS = [0.01, 0.03, 0.1, 0.3]
export const rhoOfG = (g: number) => 4.3 - 1.3 * (Math.log10(g) + 1)

/** Beat 4's piecewise ramp: g = 1 lands exactly at the phase boundary p = 0.55; g = 10 at 0.80. */
export function beat4g(p: number) {
  if (p <= 0.15) return 0.1
  if (p <= 0.55) return Math.pow(10, -1 + (p - 0.15) / 0.4)
  if (p <= 0.8) return Math.pow(10, (p - 0.55) / 0.25)
  return 10
}

// IIA ↔ 11D dictionary (units ℓ_s = 1)
export const R11 = (g: number) => g
export const L11 = (g: number) => Math.cbrt(g)
export const ratio11 = (g: number) => Math.pow(g, 2 / 3)
/** Visual tube radius r_vis = clamp(0.35·g, 0, 2.2). */
export const tubeRadius = (g: number) => Math.min(2.2, Math.max(0, 0.35 * g))
/** HE wall separation (visual): clamp(0.7·g, 0.02, 4.4). */
export const wallSep = (g: number) => Math.min(4.4, Math.max(0.02, 0.7 * g))
/** Rungs below the string scale (M_n = n/g < 1): ⌈g⌉ − 1. */
export const rungsBelow = (g: number) => Math.max(0, Math.ceil(g - 1e-9) - 1)

// Tensions (units 1/ℓ_s²)
export const T_F1 = 1 / (2 * Math.PI)
export const T_D1 = (g: number) => 1 / (2 * Math.PI * g)
export const T_pq = (p: number, q: number, g: number) => Math.sqrt(p * p + (q * q) / (g * g)) / (2 * Math.PI)

/* ───────────────────────── Landmass (six-cusped hypocycloid) ───────────────────────── */

/** P(t) = Rot₃₀°(5cos t + cos 5t, 5 sin t − sin 5t), mapped to world X = P.x, Z = −P.y. */
export function hypo(t: number, out: [number, number]) {
  const x = 5 * Math.cos(t) + Math.cos(5 * t)
  const y = 5 * Math.sin(t) - Math.sin(5 * t)
  const c = Math.cos(30 * DEG)
  const s = Math.sin(30 * DEG)
  out[0] = c * x - s * y
  out[1] = -(s * x + c * y)
  return out
}

/**
 * Signed distance to the landmass (negative inside), baked once into an N² grid over [−8, 8]².
 * The curve has 12-fold (dihedral) symmetry, so each texel is folded into one 30° wedge and measured
 * against that wedge's 60 segments of the 720-segment outline — exact, and ~10 ms instead of seconds.
 */
export function bakeSdf(N = 256): Float32Array {
  const K = 60
  const px = new Float64Array(K + 1)
  const py = new Float64Array(K + 1)
  const pa = new Float64Array(K + 1)
  const pr = new Float64Array(K + 1)
  for (let k = 0; k <= K; k++) {
    const t = (k / K) * (Math.PI / 6)
    px[k] = 5 * Math.cos(t) + Math.cos(5 * t)
    py[k] = 5 * Math.sin(t) - Math.sin(5 * t)
    pa[k] = Math.atan2(py[k], px[k])
    pr[k] = Math.hypot(px[k], py[k])
  }
  const out = new Float32Array(N * N)
  const W60 = Math.PI / 3
  for (let j = 0; j < N; j++) {
    const Z = -8 + ((j + 0.5) * 16) / N
    for (let i = 0; i < N; i++) {
      const X = -8 + ((i + 0.5) * 16) / N
      // world → map plane (y = −Z), unrotate 30°, fold into [0°, 30°]
      const mx = X
      const my = -Z
      const rho = Math.hypot(mx, my)
      let a = Math.atan2(my, mx) - 30 * DEG
      a = ((a % W60) + W60) % W60
      if (a > W60 / 2) a = W60 - a
      const qx = rho * Math.cos(a)
      const qy = rho * Math.sin(a)
      let best = 1e9
      for (let k = 0; k < K; k++) {
        const ax = px[k]
        const ay = py[k]
        const bx = px[k + 1] - ax
        const by = py[k + 1] - ay
        const l2 = bx * bx + by * by
        let h = ((qx - ax) * bx + (qy - ay) * by) / l2
        h = h < 0 ? 0 : h > 1 ? 1 : h
        const dx = qx - ax - h * bx
        const dy = qy - ay - h * by
        const d2 = dx * dx + dy * dy
        if (d2 < best) best = d2
      }
      // inside ⇔ closer to the centre than the outline at this folded angle
      let k = 0
      while (k < K - 1 && pa[k + 1] < a) k++
      const f = pa[k + 1] > pa[k] ? Math.min(1, Math.max(0, (a - pa[k]) / (pa[k + 1] - pa[k]))) : 0
      const rc = pr[k] + (pr[k + 1] - pr[k]) * f
      const d = Math.sqrt(best)
      out[j * N + i] = rho < rc ? -d : d
    }
  }
  return out
}

/** Island shape along tip j: smoothstep(3.3, 3.9, along)·exp(−lat²/0.5). */
export function island(j: number, x: number, z: number) {
  const [ux, uz] = tipDir(j)
  const along = x * ux + z * uz
  const lx = x - along * ux
  const lz = z - along * uz
  const t = Math.min(1, Math.max(0, (along - 3.3) / 0.6))
  return t * t * (3 - 2 * t) * Math.exp(-(lx * lx + lz * lz) / 0.5)
}

/** Height of the (fully risen) horn axis at radius ρ along a tip, ignoring the outline trim. */
export const hornHeight = (rho: number, amp = 1) => {
  const t = Math.min(1, Math.max(0, (rho - 3.3) / 0.6))
  return 0.12 + 0.9 * amp * t * t * (3 - 2 * t)
}

/* ───────────────────────── Camera helpers ───────────────────────── */

/**
 * Overview distance. The pack's D_ov = max(18, 18/aspect) frames the map edge to edge; on landscape
 * screens the narrative column covers the left ~40%, so the story pulls back 30% further to fit the
 * whole archipelago into the free space beside the text.
 */
export const overviewDistance = (aspect: number) => Math.max(18, 18 / Math.max(0.2, aspect)) * (aspect < 0.8 ? 1.1 : 1.3)
/** Pull-back: H = H_ov·(60/H_ov)^p, pitch = lerp(55°, 85°, p), distance = H / sin(pitch). */
export function pullPose(p: number, aspect: number) {
  const Dov = overviewDistance(aspect)
  const Hov = Dov * Math.sin(55 * DEG)
  // camera choice, not physics: landscape ends with the six-cusp landmass at ~55% of the frame height (the
  // pack's 60 left it a small star under its own title); portrait phones need more sky above the text
  const Hend = aspect < 0.8 ? 84 : 33
  const H = Hov * Math.pow(Hend / Hov, p)
  const pitch = (55 + 30 * p) * DEG
  return { distance: H / Math.sin(pitch), polar: Math.PI / 2 - pitch, height: H }
}

/* ───────────────────────── E8 emblem (Coxeter-plane projection) ───────────────────────── */

/** The 240 E8 roots projected onto the Coxeter plane: 8 rings of 30 (computed once). */
export function e8Projection(): Float32Array {
  const roots: number[][] = []
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++)
      for (const si of [1, -1])
        for (const sj of [1, -1]) {
          const v = new Array(8).fill(0)
          v[i] = si
          v[j] = sj
          roots.push(v)
        }
  for (let m = 0; m < 256; m++) {
    let neg = 0
    const v: number[] = []
    for (let i = 0; i < 8; i++) {
      const s = (m >> i) & 1 ? -1 : 1
      if (s < 0) neg++
      v.push(0.5 * s)
    }
    if (neg % 2 === 0) roots.push(v)
  }
  const simple = [
    [0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5],
    [1, 1, 0, 0, 0, 0, 0, 0],
    [-1, 1, 0, 0, 0, 0, 0, 0],
    [0, -1, 1, 0, 0, 0, 0, 0],
    [0, 0, -1, 1, 0, 0, 0, 0],
    [0, 0, 0, -1, 1, 0, 0, 0],
    [0, 0, 0, 0, -1, 1, 0, 0],
    [0, 0, 0, 0, 0, -1, 1, 0],
  ]
  const I = (): number[][] => Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => (i === j ? 1 : 0)))
  const mul = (A: number[][], B: number[][]) => A.map((r) => B[0].map((_, j) => r.reduce((s, _v, k) => s + r[k] * B[k][j], 0)))
  const refl = (a: number[]) => {
    const aa = a.reduce((s, x) => s + x * x, 0)
    return I().map((r, i) => r.map((v, j) => v - (2 * a[i] * a[j]) / aa))
  }
  let W = I()
  for (const a of simple) W = mul(W, refl(a))
  let P = I().map((r) => r.map(() => 0))
  let Wk = I()
  for (let k = 0; k < 30; k++) {
    const c = (Math.cos((2 * Math.PI * k) / 30) * 2) / 30
    P = P.map((r, i) => r.map((v, j) => v + c * Wk[i][j]))
    Wk = mul(Wk, W)
  }
  const apply = (M: number[][], v: number[]) => M.map((r) => r.reduce((s, x, k) => s + x * v[k], 0))
  let x = apply(P, [1, 0.3, 0.2, 0.1, 0.05, 0.7, 0.4, 0.9])
  const nx = Math.hypot(...x)
  x = x.map((v) => v / nx)
  let y = apply(W, x)
  const d = y.reduce((s, v, i) => s + v * x[i], 0)
  y = y.map((v, i) => v - d * x[i])
  const ny = Math.hypot(...y)
  y = y.map((v) => v / ny)
  const out = new Float32Array(240 * 2)
  roots.forEach((r, i) => {
    out[i * 2] = r.reduce((s, v, k) => s + v * x[k], 0) / 1.1396
    out[i * 2 + 1] = r.reduce((s, v, k) => s + v * y[k], 0) / 1.1396
  })
  return out
}

/* ───────────────────────── Formatting ───────────────────────── */

export function fmtG(g: number) {
  if (g < 0.1) return g.toFixed(3)
  if (g < 1) return g.toFixed(2)
  if (g < 10) return g.toFixed(2)
  return g.toFixed(1)
}
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const sup = (s: string | number) =>
  String(s)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')
/** 0.159 → "0.16", 1.59e-3 → "1.6 × 10⁻³". */
export function fmtT(v: number) {
  if (v >= 0.01 && v < 100) return v < 1 ? v.toFixed(3) : v.toFixed(2)
  const e = Math.floor(Math.log10(v))
  return `${(v / Math.pow(10, e)).toFixed(1)} × 10${sup(e)}`
}
