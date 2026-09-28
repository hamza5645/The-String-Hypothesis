import type { Timeline } from '../timeline'

/** Where pinned "~ ANALOGY" notes sit: bottom-left of the figure frame (right of the text column
 *  on desktop; above the text block on phones). */
export function noteSpot(tl: Timeline): [number, number] {
  if (tl.portrait) return [0.055, 0.49]
  return [0.47, 0.9]
}

/** Top-right readout spot of the figure frame. */
export function readoutSpot(tl: Timeline): [number, number] {
  if (tl.portrait) return [0.07, 0.11]
  return [0.8, 0.17]
}
