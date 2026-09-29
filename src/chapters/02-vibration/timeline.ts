// One continuous "beat coordinate" B for the whole chapter: B = i + (local progress of the i-th step),
// so every visual is a pure function of scroll (plus the stage clock). Shared by index.ts (scale gauge)
// and the Scene. Keep this file free of three.js so the eager chunk stays tiny.
import type { ChapterHandle } from '@/core/chapter'
import { clamp01, range, smoothstep } from '@/core/math'
import { useVib } from './store'

export const STEPS = ['title', 'opening', 'harmonics', 'packets', 'spin', 'stepback', 'bottomrung', 'charge', 'lab', 'exit'] as const
/** Step lengths (viewports of scroll); the Overlay uses these too. */
export const STEP_LEN = {
  title: 1.15,
  opening: 1.2,
  harmonics: 1.7,
  packets: 1.9,
  spin: 1.6,
  stepback: 1.9,
  bottomrung: 1.9,
  charge: 1.8,
  lab: 2.6,
  exit: 1.2,
} as const

export const BI = {
  title: 0,
  opening: 1,
  harmonics: 2,
  packets: 3,
  spin: 4,
  stepback: 5,
  bottomrung: 6,
  charge: 7,
  lab: 8,
  exit: 9,
} as const

/**
 * A step's text slides into place over its first half-viewport of scroll and out over its last.
 * Each beat's local coordinate u is piecewise-linear in the step's progress p: the slide-in maps to
 * u ∈ [0, 0.08] (entry transitions), the stretch where the text is in place to [0.08, 0.92] (the
 * beat's choreography and its hold), and the slide-out to [0.92, 1] (exit transitions).
 */
const EDGE = STEPS.map((id) => Math.min(0.45, 0.5 / STEP_LEN[id]))
export function beatCoord(h: ChapterHandle): number {
  for (let i = 0; i < STEPS.length; i++) {
    const p = h.step(STEPS[i])
    if (p < 1) {
      const a = EDGE[i]
      let u: number
      if (p < a) u = (0.08 * p) / a
      else if (p > 1 - a) u = 0.92 + (0.08 * (p - (1 - a))) / a
      else u = 0.08 + (0.84 * (p - a)) / (1 - 2 * a)
      return i + Math.min(0.9999, clamp01(u))
    }
  }
  return STEPS.length
}

/** Beat-4 pull-back: string scale s = 10^(−15u) (from ~10⁻³⁴ m out to ~10⁻¹⁹ m, the LHC's resolution). */
export const PULLBACK_DECADES = 15
/** u ∈ [0,1] of the Beat-4 pull-back for a beat coordinate (starts once the beat's text is in place). */
export const pullbackU = (B: number) => clamp01((B - 5.08) / 0.3)
/** u ∈ [0,1] of the exit pull-back (replay) after the Lab. */
export const exitU = (B: number) => clamp01((B - 9.16) / 0.3)

/**
 * The pull-back is not linear in decades: the part where the resolved string blurs into a point gets
 * most of the scroll. Keys are on-screen lengths of the string (Model §9 thresholds: a glow envelope
 * below 40 px, a point sprite between 10 and 4 px); `pull.l0px` is the string's on-screen length before
 * the pull-back (the Director keeps it current).
 */
export const pull = { l0px: 520 }
const PU = [0, 0.26, 0.64, 0.78, 1] as const
export function pullDecades(u: number): number {
  const l0 = Math.max(60, pull.l0px)
  const k1 = Math.log10(l0 / 40)
  const k2 = Math.log10(l0 / 10)
  const k3 = Math.log10(l0 / 3.5)
  const D = [0, k1, k2, k3, PULLBACK_DECADES]
  if (u <= 0) return 0
  if (u >= 1) return PULLBACK_DECADES
  for (let i = 0; i < 4; i++) {
    if (u <= PU[i + 1]) {
      let f = (u - PU[i]) / (PU[i + 1] - PU[i])
      if (i === 0) f = f * f * (1.6 - 0.6 * f) // ease in from the resolved string
      if (i === 3) f = f * (2 - f) // ease out into the far view
      return D[i] + (D[i + 1] - D[i]) * f
    }
  }
  return PULLBACK_DECADES
}

const L_H1 = Math.log10(1.5e-34) // chapter 1 hands over at this gauge reading
const L_S = Math.log10(2e-34) // assumed ℓ_s = ħc/M_s for M_s = 10¹⁸ GeV
const L_GUITAR = Math.log10(0.65) // a guitar's scale length: the Lab's PINNED (guitar) string

/** Characteristic length on screen (m), for the left scale gauge. */
export function vibScale(h: ChapterHandle): number | null {
  const B = beatCoord(h)
  let e: number
  if (B < 5) e = L_H1 + (L_S - L_H1) * smoothstep(0.6, 1.6, B)
  else if (B < 7) e = L_S + pullDecades(pullbackU(B))
  else if (B < 8) e = L_S + pullDecades(1 - range(B, 7.0, 7.1)) // Beat 6 pushes back into rung 0
  else {
    const lab = useVib.getState()
    const labE = lab.ends === 'pinned' ? L_GUITAR : L_S + Math.log10(Math.max(1, lab.dist))
    if (B < 9) e = L_S + (labE - L_S) * smoothstep(8.0, 8.12, B)
    else e = labE + (L_S - labE) * smoothstep(9.0, 9.16, B) + pullDecades(exitU(B))
  }
  return Math.pow(10, e)
}
