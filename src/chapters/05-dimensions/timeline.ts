import { useMemo } from 'react'
import { useChapterFrame } from '@/gl'
import { ambient, prefersReducedMotion } from '@/core/time'
import { STEPS, type StepId } from './constants'
import { useDim } from './store'
import { HUD_Z } from './gl/labels'

/**
 * One mutable object per frame, filled before any other frame work of this chapter (priority −3):
 * the continuous beat time T (= step index + local step progress), layout metrics, and a snapshot
 * of the lab store. Every part of the scene is a pure function of this object (plus the stage clock).
 */
export interface Timeline {
  T: number
  p: number
  presence: number
  t: number
  dt: number
  u: Record<StepId, number>
  W: number
  H: number
  aspect: number
  portrait: boolean
  /** View shift (fractions of the viewport), set by the director. */
  sx: number
  sy: number
  /** World x of the camera target along the cable (the ZOOM station slides it down the tube, close in). */
  camTx: number
  /** Fraction of the canvas width actually on screen (from the left). 1 normally; < 1 when page content
   *  overflows a phone's width and the layout viewport (and with it the fixed stage) grows past it. */
  visR: number
  /** HUD plane half extents (units at HUD_Z). */
  hh: number
  hw: number
  lab: ReturnType<typeof useDim.getState>
  amb: number
  reduced: boolean
  /** True while the lab step is on screen. */
  inLab: boolean
}

const TAN = Math.tan(((35 * Math.PI) / 180) / 2)

export function useTimeline() {
  const tl = useMemo<Timeline>(
    () => ({
      T: 0,
      p: 0,
      presence: 0,
      t: 0,
      dt: 0,
      u: Object.fromEntries(STEPS.map((s) => [s.id, 0])) as Record<StepId, number>,
      W: 1,
      H: 1,
      aspect: 1,
      portrait: false,
      sx: 0,
      sy: 0,
      camTx: 0,
      visR: 1,
      hh: HUD_Z * TAN,
      hw: HUD_Z * TAN,
      lab: useDim.getState(),
      amb: 1,
      reduced: false,
      inLab: false,
    }),
    [],
  )
  useChapterFrame(
    (f) => {
      tl.p = f.progress
      tl.presence = f.presence
      tl.t = f.t
      tl.dt = f.dt
      let T = 0
      for (let i = STEPS.length - 1; i >= 0; i--) {
        const v = f.h.step(STEPS[i].id)
        tl.u[STEPS[i].id] = v
        if (T === 0 && v > 0) T = i + v
      }
      // before the title's centre line (only outside solo/progress-0 frames): hold the opening pose
      tl.T = T
      const s = f.state.size
      tl.W = s.width
      tl.H = s.height
      tl.aspect = s.width / Math.max(1, s.height)
      tl.portrait = tl.aspect < 0.8
      tl.hh = HUD_Z * TAN
      tl.hw = tl.hh * tl.aspect
      const vv = window.visualViewport
      tl.visR = vv ? Math.min(1, Math.max(0.5, (vv.width * vv.scale) / Math.max(1, s.width))) : 1
      tl.lab = useDim.getState()
      tl.amb = ambient()
      tl.reduced = prefersReducedMotion()
      tl.inLab = f.h.inStep('lab')
    },
    { priority: -3 },
  )
  return tl
}

/** HUD x/y from screen fractions (0..1, y from the top), compensating the current view shift. */
export const hx = (tl: Timeline, fx: number) => (fx * tl.visR - 0.5 - tl.sx) * 2 * tl.hw
export const hy = (tl: Timeline, fy: number) => (0.5 - fy - tl.sy) * 2 * tl.hh
/** HUD units per CSS pixel. */
export const hpx = (tl: Timeline) => (2 * tl.hh) / tl.H

/**
 * Desktop lab: the free stage left of the instrument panel, as screen fractions (l, r, centre c) and its
 * width in CSS px. Mirrors styles.css: the 360 px panel sits `gutter` from the edge plus, when the chapter
 * rail shows (W > 860), a 197 − gutter/2 px margin that keeps it clear of the rail's buttons.
 * The left 120 px belong to the scale gauge.
 */
export function labStage(tl: Timeline) {
  const W = tl.W
  const g = Math.min(56, Math.max(16, 0.04 * W))
  const right = W - g - (W > 860 ? 197 - 0.5 * g : 0) - Math.min(360, W - 2 * g) - 28
  const left = 120
  return { l: left / W, r: right / W, c: (left + right) / (2 * W), wpx: right - left }
}

/**
 * Screen-space fade that keeps the narrative text column clean behind dense figures
 * (desktop: the left column; portrait phones: the bottom block). `on` 0..1 blends it away.
 * Writes (dir.x, dir.y, edge0, edge1) for the HairLines / RingField uMask uniform.
 */
export function textMask(tl: Timeline, v: { set(x: number, y: number, z: number, w: number): unknown }, on: number) {
  const k = Math.max(0, Math.min(1, on))
  if (tl.portrait) v.set(0, 1, -0.2 + (0.38 + 0.2) * k, -0.1 + (0.5 + 0.1) * k)
  else v.set(1, 0, -0.2 + (0.3 + 0.2) * k, -0.1 + (0.44 + 0.1) * k)
}
/** The same fade evaluated for one screen point (fractions, y from the top). */
export function textMaskAt(tl: Timeline, fx: number, fy: number, on: number) {
  const k = Math.max(0, Math.min(1, on))
  const s = tl.portrait ? 1 - fy : fx
  const e0 = tl.portrait ? -0.2 + 0.58 * k : -0.2 + 0.5 * k
  const e1 = tl.portrait ? -0.1 + 0.6 * k : -0.1 + 0.54 * k
  const x = Math.max(0, Math.min(1, (s - e0) / (e1 - e0)))
  return x * x * (3 - 2 * x)
}
