// The stage clock. Every scene animates from `clock.t` (seconds) instead of
// R3F's clock so that screenshots can freeze time (?freeze=2.5) and so that
// two chapters rendering the same handoff pose stay perfectly in phase.

import { params } from './params'

const frozen = params.freeze

export const clock = {
  /** Seconds since start (frozen when ?freeze is set). */
  t: frozen ?? 0,
  /** Seconds since last frame (clamped; 0 when frozen). */
  dt: 0,
  frame: 0,
}

export function tickClock(rawDt: number) {
  clock.frame++
  if (frozen != null) {
    clock.dt = 0
    clock.t = frozen
    return
  }
  clock.dt = Math.min(rawDt, 1 / 20)
  clock.t += clock.dt
}

const reduceQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

/** True when the visitor prefers reduced motion. Scenes should freeze ambient motion (not interaction). */
export const prefersReducedMotion = () => !!reduceQuery?.matches

/** Multiply ambient/idle animation speeds by this (0 when reduced motion). */
export const ambient = () => (prefersReducedMotion() ? 0 : 1)
