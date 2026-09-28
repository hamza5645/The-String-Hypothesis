/*
 * Pure choreography + model functions shared by the Scene, the Overlay and index.ts (no three.js here:
 * index.ts and the Overlay load eagerly).
 */
import { easeInOutCubic, lerp, logLerp, range, smoothstep } from '@/core/math'
import { HBARC, LHC_EV, STEPS, TI, T_START } from './constants'

/** Continuous beat time from step progress values (same rule as the Scene's timeline). */
export function beatTime(step: (id: string) => number) {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    const v = step(STEPS[i].id)
    if (v > 0) return i + v
  }
  return 0
}

/** Opening sub-progress q over [T at progress 0, start of the sweep]. */
export const openingQ = (T: number) => Math.min(1, Math.max(0, (T - T_START) / (TI.sweep - T_START)))

/* Beat 1 · sweep phases */
export const sweepPhase = (s: number) => ({
  a: easeInOutCubic(range(s, 0.05, 0.19)),
  b: easeInOutCubic(range(s, 0.22, 0.42)),
  c: easeInOutCubic(range(s, 0.47, 0.68)),
  d: range(s, 0.7, 1.0),
})

/* Beat 2 · the cable dolly: camera distance in cable radii, log path 10⁴ → 9 (the pack's 3 fills the whole
   frame; the lab's ZOOM slider still reaches 3). Portrait phones stop at 26: a tall, narrow frame would
   otherwise be filled by the tube and bury the beat text. Readouts are computed from the actual distance. */
export const cableNear = (portrait: boolean) => (portrait ? 26 : 9)
export const cableDist = (c: number, portrait = false) => logLerp(1e4, cableNear(portrait), easeInOutCubic(range(c, 0.06, 0.86)))
/** The camera swings around the tube once it resolves (so it reads as a tube you could walk around). */
export const cableOrbit = (d: number, portrait = false) => smoothstep(Math.log(80), Math.log(cableNear(portrait)), Math.log(d))

/* Beat 3 · one sub-timeline l over two steps: the beat text (l 0 → 0.8) and Klein's footnote (l 0.8 → 1, the pull-back) */
export const latticeL = (T: number) =>
  T < TI.klein ? 0.8 * Math.min(1, Math.max(0, T - TI.lattice)) : 0.8 + 0.2 * Math.min(1, Math.max(0, T - TI.klein))

/* Beat 3 · ring radius: 0.12, then log-shrinks to 0.003 during the pull-back */
export const latticeRadius = (l: number) => (l < 0.8 ? 0.12 : logLerp(0.12, 0.003, range(l, 0.8, 1.0)))

/* Beat 4 · the fit: one sub-timeline f over two steps — the beat text (dive, fit, zoom out: f 0 → 0.75)
   and the aha line (f 0.75 → 1) */
export const fitF = (T: number) =>
  T < TI.aha ? 0.75 * Math.min(1, Math.max(0, T - TI.fit)) : 0.75 + 0.25 * Math.min(1, Math.max(0, T - TI.aha))

export const RING_R = 1.4
/** A staircase that holds every integer for a while (plateaus ±0.18 of a step), so each locked state —
 *  k = 0, 1, 2 and 3 alike (~9–12% of the fit step each) — can be read while scrolling. */
export const stair = (x: number) => {
  const n = Math.floor(x)
  return n + smoothstep(0.18, 0.82, x - n)
}
/** Beat 4 fit phase (0.15–0.55): k scrubbed 0 → 3. The dwell is applied to k itself, not to the sweep. */
export const fitK = (f: number) => Math.min(3, stair(3 * range(f, 0.15, 0.55)))
/** Visual inset radius during the aha. */
export const ahaR = (f: number) => lerp(RING_R, 0.35, easeInOutCubic(range(f, 0.8, 0.97)))
/** Physical R for the gauge during the aha: the dashed LHC line sits at 3.5 s₀, so E₁ = 13.6 TeV·(1.4/R_vis)/3.5. */
export const ahaPhysR = (f: number) => HBARC / ((LHC_EV * (RING_R / ahaR(f))) / 3.5)

/* Beat 5 · the balance sequence runs on b. Phones compress it into the first 70% of the step: there the
   beat text sits over the lower stage and scrolls up through it once the step's sticky phase ends. */
export const countB = (u: number, portrait: boolean) => (portrait ? Math.min(1, u / 0.7) : u)

/* Beat 5 · balance chips */
export const CHIPS = 10
export const chipLand = (i: number) => 0.1 + i * 0.045
export const chipsLanded = (b: number) => {
  let d = 0
  for (let i = 0; i < CHIPS; i++) d += smoothstep(chipLand(i) - 0.006, chipLand(i), b)
  return d
}
