/*
 * Scroll layout shared by the Overlay (step lengths) and the Scene (choreography).
 * The Scene works in "c": the position of the viewport's centre line inside the chapter section,
 * in viewport heights. c = progress·(TOTAL − 1) + 0.5, so c = 0.5 at progress 0 and TOTAL − 0.5 at 1.
 * A step's local progress is (c − start)/length — identical to h.step(id), but unclamped.
 * Pure: no three.js (the Overlay imports this).
 */

export const STEP_LEN = {
  title: 1.15,
  open: 1.5,
  sheet: 1.6,
  area: 1.9,
  pants: 1.7,
  now: 2.6,
  lab: 2.5,
  loops: 1.6,
  close: 1.7,
  /** no text: the OUT crane lands and the loop is left alone (the handoff frame) */
  out: 1.2,
} as const

export type StepId = keyof typeof STEP_LEN
const ORDER: StepId[] = ['title', 'open', 'sheet', 'area', 'pants', 'now', 'lab', 'loops', 'close', 'out']

export const STEP_START = {} as Record<StepId, number>
let acc = 0
for (const id of ORDER) {
  STEP_START[id] = acc
  acc += STEP_LEN[id]
}
export const TOTAL = acc

export const cOf = (progress: number) => progress * (TOTAL - 1) + 0.5
/** Unclamped local progress of a step at centre-line position c. */
export const stepAt = (id: StepId, c: number) => (c - STEP_START[id]) / STEP_LEN[id]
/** Centre-line position of a step's local progress p. */
export const cAt = (id: StepId, p: number) => STEP_START[id] + p * STEP_LEN[id]

/**
 * Phones: where each step's text block starts, as a fraction of the viewport height (measured by the
 * Overlay with a ResizeObserver). The Scene frames the diagram in the free band above it.
 */
export const textTop: Partial<Record<StepId, number>> = {}

const sat = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const ss = (a: number, b: number, x: number) => {
  const t = sat((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * Beat 2 phases (step 'area' local progress) — drives both the ribbon (Scene) and the KaTeX card (Overlay).
 * The particle first (ticks, then the detour); then T pulses with the ribbon's edges; A lights while a
 * brighter fill sweeps up the ribbon (measuring its area); last, the nudge (the ribbon is still fully lit:
 * it only dissolves after area 0.9), whose ε² caption holds to the end of the beat.
 */
export function areaPhase(p: number) {
  const T = ss(0.4, 0.44, p) * (1 - ss(0.47, 0.51, p))
  const sweep = sat((p - 0.5) / 0.16)
  const A = ss(0.49, 0.53, p) * (1 - ss(0.66, 0.72, p))
  const nudge = ss(0.66, 0.72, p)
  const tau = ss(0.06, 0.12, p) * (1 - ss(0.4, 0.46, p))
  return { T, A, sweep, nudge, tau }
}

/**
 * The Go-deeper drawer's highlight loop (seconds of stage clock). While the drawer is open the Scene
 * pulses the matching element (tick marks, ribbon edges, area fill, b/h counters) in the same rhythm.
 */
export const DEEPER_PERIOD = 10
export function deeperPhase(t: number) {
  const u = (((t % DEEPER_PERIOD) + DEEPER_PERIOD) % DEEPER_PERIOD) / DEEPER_PERIOD
  const bump = (a: number, b: number) => ss(a, a + 0.04, u) * (1 - ss(b - 0.04, b, u))
  return { dtau: bump(0, 0.25), T: bump(0.25, 0.5), dA: bump(0.5, 0.75), bh: bump(0.75, 1) }
}
