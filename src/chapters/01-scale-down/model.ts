// Chapter 01 · the zoom model (content/01-scale-down.md § Storyboard "Engine brief", § Lab "Model").
// One quantity drives everything: s = log10(L), L = the vertical field of view in meters.
// Pure functions only: the Scene, the Overlay, the tape instrument and scale(h) all call these.

import type { ChapterHandle } from '@/core/chapter'
import { HANDOFF, handoffFit } from '@/core/handoff'
import { clamp, lerp, smoothstep, superscript } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import { useLab } from './store'

/* ───────────── constants (CODATA / PDG, see the pack's "Numbers & facts") ───────────── */

/** Visible height of the z = 0 plane at HANDOFF.camera (world units). */
export const HW = 2 * HANDOFF.camera.position[2] * Math.tan((HANDOFF.camera.fov * Math.PI) / 360)
export const HBAR_C = 1.973269804e-16 // GeV·m
export const LHC_GEV = 13600
export const L_PLANCK = 1.616255e-35
export const C_LIGHT = 299792458
export const F1 = HANDOFF.H1.omega / (2 * Math.PI) // ≈ 0.35 Hz, the chapter string's fundamental on screen
export const LS_DEFAULT = 1e-34
/** H1's on-screen length as a fraction of the viewport height (registry: 4.2 / 6.306 ≈ 0.666). */
export const H1_FRAC = HANDOFF.H1.length / HW

/* ───────────── steps: the Overlay's scroll layout (lengths in viewport heights) ───────────── */

export const STEPS = [
  { id: 'title', len: 0.9 },
  { id: 'you', len: 1.0 },
  { id: 'skin', len: 1.6 },
  { id: 'dna', len: 1.3 },
  { id: 'atom', len: 1.1 },
  { id: 'dark', len: 0.55 },
  { id: 'proton', len: 1.3 },
  { id: 'points', len: 1.05 },
  { id: 'gap', len: 1.6 },
  { id: 'reveal', len: 1.5 },
  { id: 'lab', len: 2.0 },
  { id: 'bridge', len: 1.0 },
] as const
export type StepId = (typeof STEPS)[number]['id']
export const LEN = Object.fromEntries(STEPS.map((s) => [s.id, s.len])) as Record<StepId, number>
/** Z (viewport heights from the chapter top to the viewport's centre line) where each step starts. */
export const START = (() => {
  const o = {} as Record<StepId, number>
  let z = 0
  for (const s of STEPS) {
    o[s.id] = z
    z += s.len
  }
  return o
})()

/** Position of the viewport centre line inside the chapter, in viewport heights (0.5 at progress 0). */
export function zOf(h: ChapterHandle) {
  let z = 0
  for (const s of STEPS) z += s.len * h.step(s.id)
  return z
}
export const zAt = (id: StepId, local: number) => START[id] + local * LEN[id]

/* ───────────── scroll map (pack keyframes, re-expressed per step) ───────────── */

const END = 999 // placeholder for s_end
type Key = [number, number] // [local 0..1 within the step, s]
const KEYS: Partial<Record<StepId, Key[]>> = {
  // Beat 1 (p .08→.34): +0.4 → −1.0 → −3.0 → −4.6 | → −6.0 → −8.3
  skin: [[0, 0.4], [0.286, -1.0], [0.643, -3.0], [1, -4.6]],
  dna: [[0, -4.6], [0.5, -6.0], [1, -8.3]],
  // Beat 2: −8.3 → −9.3 → −9.6 (hold)
  atom: [[0, -8.3], [0.43, -9.3], [0.71, -9.6], [1, -9.6]],
  // Beat 3: the long dark stretch, then nucleus (hold), anchor shift 1, proton (hold)
  dark: [[0, -9.6], [1, -13.5]],
  proton: [[0, -13.5], [0.12, -13.8], [0.3, -14.1], [0.5, -14.1], [0.78, -14.6], [1, -14.6]],
  // Beat 4: snapshot + anchor shift 2, then points that never grow
  points: [[0, -14.6], [0.18, -15.3], [1, -19.0]],
  // Beat 5: accelerating through the unexplored gap
  gap: [[0, -19.0], [1, -32.0]],
  // Beat 6: the reveal
  reveal: [[0, -32.0], [0.714, END], [1, END]],
}

/** s_end = log10(ℓs / (H1 fraction · fit)): the string's on-screen length equals the registry's H1. */
export function sEnd(aspect: number) {
  return Math.log10(LS_DEFAULT / (H1_FRAC * handoffFit(aspect)))
}

function interp(keys: Key[], u: number, se: number) {
  const v = (x: number) => (x === END ? se : x)
  if (u <= keys[0][0]) return v(keys[0][1])
  for (let i = 1; i < keys.length; i++) {
    if (u <= keys[i][0]) {
      const [u0, s0] = keys[i - 1]
      const [u1, s1] = keys[i]
      return lerp(v(s0), v(s1), (u - u0) / Math.max(1e-6, u1 - u0))
    }
  }
  return v(keys[keys.length - 1][1])
}

/** The scroll-driven s for a centre-line position Z. */
export function sScroll(z: number, aspect: number) {
  const se = sEnd(aspect)
  if (z < START.skin) return 0.4
  if (z >= START.lab) return se
  for (const st of STEPS) {
    const a = START[st.id]
    if (z < a + st.len) {
      const k = KEYS[st.id]
      return k ? interp(k, (z - a) / st.len, se) : 0.4
    }
  }
  return se
}

/**
 * Reduced motion: the continuous zoom becomes one still per beat (the reveal: three stills),
 * joined by dips to black. Returns [s, dip 0..1].
 */
const STILLS: Partial<Record<StepId, number[]>> = {
  skin: [-1.2, -3.9],
  dna: [-4.8, -8.2],
  atom: [-9.6],
  dark: [-12],
  proton: [-14.1, -14.6],
  points: [-17.5],
  gap: [-26],
  reveal: [-31, -32.6, END],
}
export function sReduced(z: number, aspect: number): [number, number] {
  const se = sEnd(aspect)
  if (z < START.skin) return [0.4, 0]
  if (z >= START.lab) return [se, 0]
  for (const st of STEPS) {
    const a = START[st.id]
    if (z < a + st.len) {
      const list = STILLS[st.id]
      if (!list) return [0.4, 0]
      const u = (z - a) / st.len
      const n = list.length
      const i = Math.min(n - 1, Math.floor(u * n))
      const v = list[i] === END ? se : list[i]
      // dip near every boundary between stills (and at step edges)
      const w = 0.09 / st.len
      const local = u * n - i // 0..1 within this still
      const d = Math.max(1 - smoothstep(0, w * n, local), smoothstep(1 - w * n, 1, local))
      return [v, d]
    }
  }
  return [se, 0]
}

/* ───────────── the lab blend ───────────── */

/** 0..1: how much the lab (rather than the scroll story) drives the scene. */
export function labWeight(z: number) {
  const a = START.lab
  const b = a + LEN.lab
  return smoothstep(a + 0.1, a + 0.5, z) * (1 - smoothstep(b - 0.42, b - 0.02, z))
}

export interface ZoomState {
  z: number
  s: number
  /** string fraction: 0 = point (ℓ = 0), 1 = string of length ℓs */
  m: number
  /** log10 ℓs in meters */
  ls: number
  labW: number
  dip: number
}

/** Everything derived from scroll + lab, as one pure evaluation (lab mode snaps; the Scene smooths m). */
export function evalZoom(h: ChapterHandle, aspect: number, out: ZoomState): ZoomState {
  const z = zOf(h)
  const rm = prefersReducedMotion()
  let sS: number
  let dip = 0
  if (rm) [sS, dip] = sReduced(z, aspect)
  else sS = sScroll(z, aspect)
  // portrait phones: the round subjects (atom, nucleus, proton) are framed a little wider, since the
  // frame is narrow and the text sits below; the offset is gone before the point stage and the reveal
  if (aspect < 0.8) sS += 0.3 * smoothstep(-7.6, -9.0, sS) * (1 - smoothstep(-15.4, -16.8, sS))
  const w = labWeight(z)
  const lab = useLab.getState()
  out.z = z
  out.labW = w
  out.dip = dip
  out.s = lerp(sS, lab.s, w)
  out.ls = lerp(Math.log10(LS_DEFAULT), lab.ls, w)
  out.m = lerp(1, lab.mode === 'string' ? 1 : 0, w)
  return out
}

/* ───────────── physics readouts (Lab Model 1–2, 5, 7, 8) ───────────── */

/** δ = L/50, the finest detail drawn (the resolution blur's FWHM). */
export const deltaOf = (s: number) => Math.pow(10, s) / 50
/** Probe energy E = ħc/δ in GeV. */
export const energyOf = (s: number) => HBAR_C / deltaOf(s)
/** Warmth r = smoothstep(1, 3, ℓ/δ): warm light only once resolved. */
export const warmthOf = (ratio: number) => smoothstep(1, 3, ratio)
/** Slowdown N = round(log10((c/ℓs)/f1)). */
export const slowdownOf = (ls: number) => Math.round(Math.log10(C_LIGHT / ls / F1))

export type Resolve = 'unresolved' | 'edge' | 'resolved'
export const resolveOf = (ratio: number): Resolve => (ratio < 0.05 ? 'unresolved' : ratio < 1 ? 'edge' : 'resolved')

/* ───────────── formatting ───────────── */

/** "1.0 × 10⁻¹⁸ m" with a fixed-point mantissa (never drops the "1.0 ×"). */
export function sci(v: number, digits = 2, unit = 'm') {
  if (!(v > 0)) return `0 ${unit}`.trim()
  let e = Math.floor(Math.log10(v) + 1e-9)
  let m = v / Math.pow(10, e)
  let ms = m.toFixed(Math.max(0, digits - 1))
  if (Number(ms) >= 10) {
    e += 1
    m /= 10
    ms = m.toFixed(Math.max(0, digits - 1))
  }
  const u = unit ? ' ' + unit : ''
  if (e === 0) return `${ms}${u}`
  return `${ms} × 10${superscript(e)}${u}`
}

const PREFIX: Record<number, string> = { 0: '', [-3]: 'm', [-6]: 'µ', [-9]: 'n', [-12]: 'p', [-15]: 'f', [-18]: 'a', [-21]: 'z', [-24]: 'y', [-27]: 'r', [-30]: 'q' }

/** Readout prefix: exponent 3·⌊s/3⌋ clamped to [−30, 0]; below 10⁻³⁰ m, scientific notation. */
export function si(s: number): string {
  if (s < -30.0001) return sci(Math.pow(10, s), 2)
  const e3 = clamp(3 * Math.floor(s / 3 + 1e-9), -30, 0)
  const v = Math.pow(10, s - e3)
  const txt = v >= 99.5 ? v.toFixed(0) : v >= 9.95 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')
  return `${txt} ${PREFIX[e3]}m`
}
/** "1 am" for an integer decade (tick labels). */
export function decadeLabel(e: number) {
  if (e < -30) return `10${superscript(e)}`
  const e3 = clamp(3 * Math.floor(e / 3), -30, 0)
  return `${Math.round(Math.pow(10, e - e3))} ${PREFIX[e3]}m`
}

/** Energies in eV-prefixed units up to TeV, then "× 10ⁿ GeV". */
export function energy(gev: number) {
  const ev = gev * 1e9
  const units: [number, string][] = [
    [1e12, 'TeV'],
    [1e9, 'GeV'],
    [1e6, 'MeV'],
    [1e3, 'keV'],
    [1, 'eV'],
    [1e-3, 'meV'],
    [1e-6, 'µeV'],
  ]
  if (ev >= 1e15) return `${sci(gev, 2, 'GeV')}`
  for (const [f, u] of units) {
    if (ev >= f * 0.9995) {
      const v = ev / f
      return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')} ${u}`
    }
  }
  return sci(ev, 2, 'eV')
}

export function lhcRatio(gev: number) {
  const r = gev / LHC_GEV
  if (r < 0.01) return '≪ LHC'
  if (r < 10) return `≈ ${r < 1 ? r.toFixed(1) : r.toFixed(0)} × LHC`
  return `≈ 10${superscript(Math.round(Math.log10(r)))} × LHC`
}

/* ───────────── landmarks on the scale (tape, lab chips) ───────────── */

export interface Landmark {
  e: number
  label: string
  note?: string
  kind: 'solid' | 'hollow'
}
export const LANDMARKS: Landmark[] = [
  { e: Math.log10(1.7), label: 'YOU', note: '~1.7 m', kind: 'solid' },
  { e: Math.log10(15e-6), label: 'CELL', note: '10–20 µm', kind: 'solid' },
  { e: Math.log10(2e-9), label: 'DNA', note: '2 nm', kind: 'solid' },
  { e: -10, label: 'ATOM', note: '~10⁻¹⁰ m', kind: 'solid' },
  { e: Math.log10(2.47e-15), label: 'C-12 NUCLEUS', note: 'r_rms ≈ 2.5 fm', kind: 'solid' },
  { e: Math.log10(0.84e-15), label: 'PROTON', note: 'r ≈ 0.84 fm', kind: 'solid' },
  { e: Math.log10(L_PLANCK), label: 'ℓ_P', note: '1.6 × 10⁻³⁵ m', kind: 'solid' },
]
export const STRING_MARK: Landmark = { e: -34, label: 'STRING', note: '~10⁻³⁴ m · HYPOTHETICAL', kind: 'hollow' }

/** Lab jump chips (field of view to jump to). */
export const JUMPS: { id: string; label: string; s: number }[] = [
  { id: 'you', label: 'You', s: 0.4 },
  { id: 'cell', label: 'Cell', s: -4.6 },
  { id: 'dna', label: 'DNA', s: -8.3 },
  { id: 'atom', label: 'Atom', s: -9.6 },
  { id: 'proton', label: 'Proton', s: -14.6 },
  { id: 'edge', label: 'Edge', s: -18 },
  { id: 'planck', label: 'Planck', s: Math.log10(50 * L_PLANCK) },
]

export const S_MAX = 0.5
export const S_MIN = -36
export const LS_MAX = -17
export const LS_MIN = -35
