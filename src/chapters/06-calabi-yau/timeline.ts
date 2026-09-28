import type { ChapterHandle } from '@/core/chapter'
import { clamp01, smoothstep } from '@/core/math'

export type StepId = 'title' | 'opening' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'lab' | 'exit'

/*
 * One source of truth for the chapter's scroll layout, shared by Overlay (step lengths) and Scene.
 * The content pack times everything in "pack progress" P (Opening 0–0.08 · B1 0.08–0.18 · B2 0.18–0.32 ·
 * B3 0.32–0.46 · B4 0.46–0.62 · B5 0.62–0.70 · B6 0.70–0.80 · Lab 0.80–0.94 · exit 0.94–1).
 *
 * P is a piecewise-linear remap of the viewport's centre line c (viewport heights from the chapter top).
 * A step's sticky content is only settled on screen while c ∈ [top + ½, top + len − ½]; so each beat's
 * pack window is mapped onto (roughly) that readable window, and P holds still for the short scroll during
 * which one beat's text leaves and the next arrives. P = 0 at chapter progress 0 and P = 1 at progress 1
 * (both handoff frames).
 */
export const STEPS: readonly Step[] = [
  { id: 'title', len: 1.1, p: 0, hin: 0, hout: 0 },
  { id: 'opening', len: 1.5, p: 0.03, hin: 0.3, hout: 0.35 },
  { id: 'b1', len: 1.6, p: 0.08, hin: 0.4, hout: 0.4 },
  { id: 'b2', len: 1.7, p: 0.18, hin: 0.4, hout: 0.4 },
  // the drum/ring inset (0.32–0.37) gets ≥ ½ viewport before the pattern takes over
  { id: 'b3', len: 2.0, p: 0.32, hin: 0.4, hout: 0.4, mid: [[1.0, 0.37]] },
  // the aha: build-up 0.46–0.57 over one viewport, then the 100-vs-3 landing (0.57–0.60) holds for
  // more than half a viewport before the Tian–Yau column slides in (0.60–0.62)
  { id: 'b4', len: 2.8, p: 0.46, hin: 0.4, hout: 0.5, mid: [[1.4, 0.57], [1.95, 0.6]] },
  { id: 'b5', len: 1.5, p: 0.62, hin: 0.4, hout: 0.4 },
  { id: 'b6', len: 1.5, p: 0.7, hin: 0.4, hout: 0.4 },
  { id: 'lab', len: 2.4, p: 0.8, hin: 0.3, hout: 0.3 },
  { id: 'exit', len: 1.3, p: 0.94, hin: 0.05, hout: 0 },
]

interface Step {
  id: StepId
  len: number
  /** pack progress when this step's text has settled (c = top + hin) */
  p: number
  hin: number
  hout: number
  /** optional inner anchors [c − top, P] between hin and len − hout */
  mid?: readonly (readonly [number, number])[]
}
export const LEN = Object.fromEntries(STEPS.map((s) => [s.id, s.len])) as Record<StepId, number>

const TOTAL = STEPS.reduce((a, s) => a + s.len, 0)
// anchors: centre line c (viewport heights) → pack progress P
const AC: number[] = [0.5]
const AP: number[] = [0]
{
  let top = 0
  STEPS.forEach((s, i) => {
    if (i > 0) {
      AC.push(top + s.hin)
      AP.push(s.p)
      for (const [c, p] of s.mid ?? []) {
        AC.push(top + c)
        AP.push(p)
      }
      const next = STEPS[i + 1]
      if (next) {
        AC.push(top + s.len - s.hout)
        AP.push(next.p)
      }
    }
    top += s.len
  })
  // the exit ramp completes a little before progress 1, then holds the H2 handoff pose
  AC.push(TOTAL - 0.65, TOTAL - 0.5)
  AP.push(1, 1)
}

/** Pack progress P from chapter progress p. */
export function packP(progress: number) {
  const c = clamp01(progress) * (TOTAL - 1) + 0.5
  if (c <= AC[0]) return 0
  for (let i = 1; i < AC.length; i++) {
    if (c <= AC[i]) {
      const t = (c - AC[i - 1]) / Math.max(1e-6, AC[i] - AC[i - 1])
      return AP[i - 1] + t * (AP[i] - AP[i - 1])
    }
  }
  return 1
}

export const P = (h: ChapterHandle) => packP(h.progress())

/** 0 → 1 across [a, b] of pack progress (smoothstep). */
export const ss = (P: number, a: number, b: number) => smoothstep(a, b, P)
/** Rises over [a, a+f], falls over [b−f, b]. */
export const win = (P: number, a: number, b: number, f = 0.01) => smoothstep(a, a + f, P) * (1 - smoothstep(b - f, b, P))

export type Keys = readonly (readonly [number, number])[]
/** Keyframes over pack progress, smoothstep-eased between keys. */
export function kf(P: number, keys: Keys) {
  if (P <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (P <= keys[i][0]) {
      const t = smoothstep(keys[i - 1][0], keys[i][0], P)
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * t
    }
  }
  return keys[keys.length - 1][1]
}

const SQUASH_B3: Keys = [
  [0.41, 0],
  [0.435, 1],
  [0.46, 0.3],
  [0.49, 0],
]
/** Beat 3's squash & twist s(P): 0 → 1 → 0.3 (then relaxes to 0 as Beat 4 begins). */
export const squashB3 = (P: number) => kf(P, SQUASH_B3)
/** Illustrative "size" of the squashed picture: cube root of the D_s volume factor. */
export const sizeOf = (s: number) => Math.cbrt((1 + 0.45 * s) * (1 - 0.3 * s) * (1 + 0.15 * s))
