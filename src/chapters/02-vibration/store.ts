// Lab state for the Vibration Bench, shared by Scene (read with getState() in frame loops) and Overlay.
import { create } from 'zustand'
import { MODES } from './model'

export type Ends = 'free' | 'pinned'
export type Pol = 'ud' | 'io' | 'cw' | 'ccw'
export type Tab = 'bench' | 'ladder' | 'particles'
export type MsgKey = 'snap' | 'gentle' | 'zero' | null

export interface VibState {
  /** Packets per harmonic (FREE). */
  k: number[]
  ends: Ends
  pol: Pol
  pluckPos: number
  pluckStrength: number
  /** Viewing distance in multiples of the string's length (10⁰ … 10¹⁶). Ignored in PINNED (guitar) mode. */
  dist: number
  axis: 'M2' | 'M'
  units: 'Ms' | 'GeV'
  zoom0: boolean
  /** Selected particle cell (drawer), or null. */
  particle: string | null
  volume: number
  tab: Tab
  msg: MsgKey
  msgAt: number
  /** Increments when the PLUCK button fires (the Scene performs the pluck). */
  pluckReq: number
  /** Last control the visitor touched (drives Go-deeper term highlights). */
  last: string
  lastAt: number
  setK: (k: number[], cause?: string) => void
  cycleK: (n: number) => void
  clearK: (n: number) => void
  setEnds: (e: Ends) => void
  setPol: (p: Pol) => void
  setPluckPos: (v: number) => void
  setPluckStrength: (v: number) => void
  requestPluck: () => void
  setDist: (v: number) => void
  setAxis: (a: 'M2' | 'M') => void
  setUnits: (u: 'Ms' | 'GeV') => void
  setZoom0: (v: boolean) => void
  setParticle: (id: string | null) => void
  setVolume: (v: number) => void
  setTab: (t: Tab) => void
  say: (m: MsgKey) => void
  reset: () => void
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : 0)

const DEFAULTS = {
  k: [1, 0, 0, 0, 0, 0],
  ends: 'free' as Ends,
  pol: 'ud' as Pol,
  pluckPos: 0.2,
  pluckStrength: 0.25,
  dist: 1,
  axis: 'M2' as const,
  units: 'Ms' as const,
  zoom0: false,
  particle: null,
  volume: 0.4,
  tab: 'bench' as Tab,
  msg: null as MsgKey,
  msgAt: 0,
}

export const useVib = create<VibState>((set) => ({
  ...DEFAULTS,
  pluckReq: 0,
  last: '',
  lastAt: 0,
  setK: (k, cause = 'k') => set({ k: k.slice(0, MODES), particle: null, last: cause, lastAt: now() }),
  cycleK: (n) =>
    set((s) => {
      const k = s.k.slice()
      k[n - 1] = (k[n - 1] + 1) % 4
      return { k, particle: null, last: 'k', lastAt: now(), msg: null }
    }),
  clearK: (n) =>
    set((s) => {
      const k = s.k.slice()
      k[n - 1] = 0
      return { k, particle: null, last: 'k', lastAt: now(), msg: null }
    }),
  setEnds: (ends) => set({ ends, last: 'ends', lastAt: now(), msg: null }),
  setPol: (pol) => set({ pol, last: 'pol', lastAt: now() }),
  setPluckPos: (pluckPos) => set({ pluckPos }),
  setPluckStrength: (pluckStrength) => set({ pluckStrength }),
  requestPluck: () => set((s) => ({ pluckReq: s.pluckReq + 1 })),
  setDist: (dist) => set({ dist, last: 'dist', lastAt: now() }),
  setAxis: (axis) => set({ axis, last: 'axis', lastAt: now() }),
  setUnits: (units) => set({ units }),
  setZoom0: (zoom0) => set({ zoom0 }),
  setParticle: (particle) => set({ particle }),
  setVolume: (volume) => set({ volume }),
  setTab: (tab) => set({ tab }),
  say: (msg) => set({ msg, msgAt: now() }),
  reset: () => set({ ...DEFAULTS, k: DEFAULTS.k.slice(), last: 'reset', lastAt: now() }),
}))

/**
 * Per-frame values the Scene publishes for the Overlay (no React renders): the live classical
 * amplitudes in PINNED mode (chips draw them as bars) and the drag state.
 */
export const live = {
  amps: new Float64Array(MODES),
  dragging: false,
}
