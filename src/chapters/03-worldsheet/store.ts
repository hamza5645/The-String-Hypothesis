import { create } from 'zustand'
import { pluck, tick } from '@/core/audio'
import { solveSplit, T_VERTEX, type Split } from './model'

/*
 * The Now-Slicer lab state, shared by the Overlay (controls, readouts, inset) and the Scene.
 * Pure (no three.js). Split marks are recorded here, so the lab works the same with or without WebGL.
 */

export type History = 'particles' | 'strings' | 'both'
export type ViewPreset = 'q' | 'side' | 'top'

const DEG = Math.PI / 180
export const T0_MIN = 1
export const T0_MAX = 9
export const THETA_MAX = 35
export const MAX_MARKS = 240

interface WsState {
  history: History
  t0: number
  thetaDeg: number
  phiDeg: number
  marks: boolean
  /** pants split marks, flattened (x, y, t) */
  pantsMarks: number[]
  /** how many times the particle Y was seen to split (every mark lands on the vertex) */
  yMarks: number
  /** how many times the pants were seen to split (their marks are the distinct points among these) */
  pantsSeen: number
  playing: boolean
  /** "Try every direction" running */
  sweeping: boolean
  /** set once a full "try every direction" has run (unlocks its caption) */
  swept: boolean
  view: ViewPreset
  /** bumps when a camera preset is chosen, so the Scene drops the visitor's drag offset */
  viewNonce: number
  /** phones: which history the side-by-side beats show */
  mobileView: 'particles' | 'strings'
  split: Split

  setHistory: (h: History) => void
  setT0: (v: number) => void
  setTheta: (deg: number) => void
  setPhi: (deg: number) => void
  setMarks: (on: boolean) => void
  clearMarks: () => void
  setPlaying: (on: boolean) => void
  setSweeping: (on: boolean) => void
  setView: (v: ViewPreset) => void
  setMobileView: (v: 'particles' | 'strings') => void
  /** one animation step of "try every direction": direction φ, and "now" at this slicing's split + dt0 */
  sweepTo: (phiDeg: number, dt0: number) => void
}

const wide = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true

const split0 = solveSplit(0, 0, { x: 0, y: 0, t: 0, t0: 0 })

/*
 * Optional sound (silent while sound is off): where one loop becomes two, one voice divides
 * into two slightly detuned voices; a particle vertex is a short dry tick, since a point event has no
 * "gradual" sound. Throttled so a fast sweep does not chatter.
 */
let lastSound = 0
function cue(kind: 'pinch' | 'vertex') {
  const now = typeof performance !== 'undefined' ? performance.now() : 0
  if (now - lastSound < 140) return
  lastSound = now
  if (kind === 'vertex') tick(1320)
  else pluck(196, [{ freq: 196, amp: 1 }, { freq: 201.5, amp: 0.85 }, { n: 2, amp: 0.2 }], { decay: 1.4, gain: 0.3 })
}

/** Did this change of slicing pass through the split? Then leave a dot (dedupe radius 0.02 ℓ). */
function withCrossing(prev: WsState, next: { t0: number; thetaDeg: number; phiDeg: number }, split: Split) {
  const out: Partial<WsState> = {}
  const before = prev.t0 - prev.split.t0
  const after = next.t0 - split.t0
  const crossed = (before < 0 && after >= 0) || (before >= 0 && after < 0) || Math.abs(after) < 1e-4
  const yBefore0 = prev.t0 - T_VERTEX
  const yAfter0 = next.t0 - T_VERTEX
  const yCrossed = (yBefore0 < 0) !== (yAfter0 < 0)
  if (crossed && prev.history !== 'particles' && Math.abs(before - after) > 1e-6) cue('pinch')
  else if (yCrossed && prev.history === 'particles') cue('vertex')
  if (!prev.marks) return out
  if (crossed && prev.history !== 'particles') {
    out.pantsSeen = prev.pantsSeen + 1
    const m = prev.pantsMarks
    let dup = false
    for (let i = 0; i < m.length; i += 3) {
      if (Math.hypot(m[i] - split.x, m[i + 1] - split.y, m[i + 2] - split.t) < 0.02) {
        dup = true
        break
      }
    }
    if (!dup && m.length / 3 < MAX_MARKS) out.pantsMarks = [...m, split.x, split.y, split.t]
  }
  const yBefore = prev.t0 - T_VERTEX
  const yAfter = next.t0 - T_VERTEX
  if (((yBefore < 0) !== (yAfter < 0) || Math.abs(yAfter) < 1e-4) && prev.history !== 'strings') out.yMarks = prev.yMarks + 1
  return out
}

export const useWorldsheet = create<WsState>((set, get) => ({
  history: wide ? 'both' : 'strings',
  t0: 3,
  thetaDeg: 0,
  phiDeg: 0,
  marks: true,
  pantsMarks: [],
  yMarks: 0,
  pantsSeen: 0,
  playing: false,
  sweeping: false,
  swept: false,
  view: 'q',
  viewNonce: 0,
  mobileView: 'strings',
  split: { ...split0 },

  setHistory: (history) => set({ history }),
  setT0: (v) => {
    const s = get()
    const t0 = Math.min(T0_MAX, Math.max(T0_MIN, v))
    set({ t0, ...withCrossing(s, { t0, thetaDeg: s.thetaDeg, phiDeg: s.phiDeg }, s.split) })
  },
  setTheta: (deg) => {
    const s = get()
    const thetaDeg = Math.min(THETA_MAX, Math.max(0, deg))
    const split = solveSplit(thetaDeg * DEG, s.phiDeg * DEG, { x: 0, y: 0, t: 0, t0: 0 }, s.split)
    set({ thetaDeg, split, ...withCrossing(s, { t0: s.t0, thetaDeg, phiDeg: s.phiDeg }, split) })
  },
  setPhi: (deg) => {
    const s = get()
    const phiDeg = ((deg % 360) + 360) % 360
    const split = solveSplit(s.thetaDeg * DEG, phiDeg * DEG, { x: 0, y: 0, t: 0, t0: 0 }, s.split)
    set({ phiDeg, split, ...withCrossing(s, { t0: s.t0, thetaDeg: s.thetaDeg, phiDeg }, split) })
  },
  setMarks: (marks) => set({ marks }),
  clearMarks: () => set({ pantsMarks: [], yMarks: 0, pantsSeen: 0, swept: false }),
  setPlaying: (playing) => set({ playing, sweeping: playing ? false : get().sweeping }),
  setSweeping: (on) => {
    if (!on) return set({ sweeping: false })
    const s = get()
    if (s.thetaDeg < 5) get().setTheta(30)
    set({ sweeping: true, playing: false })
  },
  setView: (view) => set((s) => ({ view, viewNonce: s.viewNonce + 1 })),
  setMobileView: (mobileView) => set({ mobileView }),
  sweepTo: (phiDeg, dt0) => {
    const s = get()
    const p = ((phiDeg % 360) + 360) % 360
    const split = solveSplit(s.thetaDeg * DEG, p * DEG, { x: 0, y: 0, t: 0, t0: 0 }, s.split)
    const tt = Math.min(T0_MAX, Math.max(T0_MIN, split.t0 + dt0))
    set({ phiDeg: p, t0: tt, split, ...withCrossing(s, { t0: tt, thetaDeg: s.thetaDeg, phiDeg: p }, split) })
  },
}))
