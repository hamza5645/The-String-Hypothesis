/*
 * The chapter's choreography as pure functions of the scroll handle, shared by the Scene
 * (every frame) and index.ts's scale() (the left gauge). No three.js here: this module is eager.
 */
import type { ChapterHandle, ScaleStatus } from '@/core/chapter'
import { clamp01, smoothstep } from '@/core/math'
import { EP, E_LHC, HBARC, LHC_REAL_D, S_MAX, floorDx, frameL, machine, machineById } from './model'
import { useScaleLab } from './store'
import { prefersReducedMotion } from '@/core/time'

/** Reduced motion: zooms become a sequence of held stills (scroll swaps them; nothing slides or scales). */
const still = (p: number, values: number[]) => values[Math.min(values.length - 1, Math.floor(p * values.length))]

export const STEP_IDS = ['title', 'open', 'decades', 'quarter', 'energy', 'bigger', 'floor', 'sideways', 'lab', 'point'] as const
export type StepId = (typeof STEP_IDS)[number]
export const STEP_LEN: Record<StepId, number> = {
  title: 1.15,
  open: 1.35,
  decades: 2.5,
  quarter: 1.8,
  energy: 1.8,
  bigger: 2.8,
  floor: 1.9,
  sideways: 1.9,
  lab: 2.4,
  point: 1.3,
}
export const SI: Record<StepId, number> = Object.fromEntries(STEP_IDS.map((id, i) => [id, i])) as Record<StepId, number>

/** Continuous timeline position: step index + local progress (monotonic in scroll). */
export function timeline(h: ChapterHandle): number {
  let T = 0
  for (const id of STEP_IDS) T += h.step(id)
  return T
}
export const local = (T: number, id: StepId) => clamp01(T - SI[id])

// ── Opening: the pull-back (H2 → H0) ─────────────────────────────────────────
export const S0_H2 = Math.log10((1e-34 * 6.306) / 8.17) // −34.11: the loop's circumference is ℓs = 10⁻³⁴ m
export const S_OPEN_END = -31.5
export const openK = (p: number) => smoothstep(0.12, 0.8, p)
export const openS = (p: number) => S0_H2 + (S_OPEN_END - S0_H2) * openK(p)

// ── Beat 1: the zoom out, fast through the unexplored stretch, slower through familiar scales ──
export const ZOOM_END = 0.6 // zoom occupies local 0 → 0.6; the flatten 0.6 → 1
const ZOOM_STILLS = [-31.5, -14.6, -9.6, -4.4, 0.4, 7.3, 13.2, 21.1, 25.4, S_MAX]
export function zoomS(p: number) {
  const u = smoothstep(0.04, ZOOM_END, p)
  if (prefersReducedMotion()) return still(u, ZOOM_STILLS)
  // unexplored stretch (−31.5 → −19): 12% of the zoom; familiar scales (−19 → 26.94): 88%
  const a = 0.12
  if (u < a) return S_OPEN_END + (-19 - S_OPEN_END) * (u / a)
  return -19 + (S_MAX + 19) * ((u - a) / (1 - a))
}

// ── Beat 3: the bead along the dashed bracket (13.6 TeV → Planck) ────────────
export const b3BeadLogE = (p: number) =>
  prefersReducedMotion() ? Math.log10(EP) : Math.log10(E_LHC) + (Math.log10(EP) - Math.log10(E_LHC)) * smoothstep(0.56, 0.84, p)

// ── Beat 4: the ring grows ───────────────────────────────────────────────────
/** Beat 4 phases: the real ring, the growth, the landing, then the honest proportion (held from HONEST_END) */
export const B4 = { real: 0.1, grow1: 0.76, land: 0.84, honest: 0.88 }
export const HONEST_END = 0.96
export function b4LogE(p: number) {
  const a = Math.log10(E_LHC)
  const b = Math.log10(EP)
  const u = smoothstep(B4.real, B4.grow1, p)
  // five stills: the LHC, past Earth, past Earth's orbit, past the nearest star, the Planck ring
  if (prefersReducedMotion()) return still(u, [a, 7.6, 11.9, 17.3, b])
  // slightly slower through the first decades so each overtake can be read
  return a + (b - a) * (u * u * (3 - 2 * u) * 0.35 + u * 0.65)
}
const LHC_SPEC = machineById('lhc')
/** Machine width (m) for Beat 4: blends the real 8.49 km ring into the Model over the first decade of E. */
export function b4Width(logE: number) {
  const model = machine(Math.pow(10, logE), LHC_SPEC).D
  const k = smoothstep(Math.log10(E_LHC), Math.log10(E_LHC) + 1, logE)
  return Math.exp(Math.log(LHC_REAL_D) * (1 - k) + Math.log(model) * k)
}

// ── Beat 5: the bead on the resolution-floor curve ───────────────────────────
export const b5BeadLogE = (p: number) =>
  prefersReducedMotion()
    ? still(smoothstep(0.5, 0.9, p), [Math.log10(E_LHC), Math.log10(8.63e18), 22])
    : Math.log10(E_LHC) + (22 - Math.log10(E_LHC)) * smoothstep(0.5, 0.9, p)

// ── The gauge ────────────────────────────────────────────────────────────────
/** Characteristic length (m) of what's on screen, for the left scale gauge. */
export function gaugeScale(h: ChapterHandle): number | null {
  const T = timeline(h)
  if (T < SI.open) return 1e-34 // the hypothetical Thread (ℓs assumed 10⁻³⁴ m)
  if (T < SI.decades) return Math.pow(10, openS(local(T, 'open')))
  if (T < SI.quarter) {
    const p = local(T, 'decades')
    return p < ZOOM_END ? Math.pow(10, zoomS(p)) : 8.8e26
  }
  if (T < SI.energy) return 1e-19 // the edge of direct measurement
  if (T < SI.bigger) return HBARC / Math.pow(10, b3BeadLogE(local(T, 'energy')))
  if (T < SI.floor) {
    const p = local(T, 'bigger')
    const L = frameL(b4Width(b4LogE(p)))
    return p > B4.honest ? L * Math.pow(10, 2 * smoothstep(B4.honest, HONEST_END, p)) : L
  }
  if (T < SI.sideways) return floorDx(Math.pow(10, b5BeadLogE(local(T, 'floor'))))
  if (T < SI.lab) return 1e-34
  if (T < SI.point) return Math.pow(10, useScaleLab.getState().logD)
  // the closing point: ~10⁻³⁴ m · hypothetical · unresolved, then the gauge fades before the dissolve
  return local(T, 'point') < 0.5 ? 1e-34 : null
}

/**
 * How the gauge marks its reading. HYPOTHETICAL while the reading is the assumed string length
 * (ℓs ~10⁻³⁴ m) or a frame set by it: the Thread and its pull-back, the point on Beat 6's band, and the
 * closing point. Everything else is a measured size or a length computed from an energy (ħc/E, the
 * floor's Δx, the Lab's probe distance), read plainly even below 10⁻³² m: the Planck length is not a
 * guess, and the floor carries its own CONJECTURED chip on the stage.
 */
export function gaugeStatus(h: ChapterHandle): ScaleStatus {
  const T = timeline(h)
  return T < SI.decades || (T >= SI.sideways && T < SI.lab) || T >= SI.point ? 'speculative' : null
}
