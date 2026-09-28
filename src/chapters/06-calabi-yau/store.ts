import { create } from 'zustand'
import type { Degree } from './cyMath'

/**
 * Lab state shared by the Overlay (DOM panel) and the Scene (canvas).
 * The scene reads it with useCY.getState() inside frame loops; it writes back only `phase`
 * (the wrapped-string experiment's outcome) and `alpha` while playing.
 */
export type LoopPhase = 'idle' | 'snag' | 'stuck' | 'escape' | 'free'

interface CYState {
  n: Degree
  /** Hidden rotation α in degrees, 0–360. */
  alpha: number
  /** Squash & twist (cartoon), 0–1. */
  s: number
  pieces: boolean
  wrap: boolean
  playing: boolean
  /** Shrink request: which experiment, plus a counter so repeated clicks re-trigger. */
  shrink: { kind: 'slice' | 'full'; id: number } | null
  phase: LoopPhase
  setN: (n: Degree) => void
  stepN: (d: 1 | -1) => void
  setAlpha: (a: number) => void
  setS: (s: number) => void
  setPieces: (v: boolean) => void
  setWrap: (v: boolean) => void
  setPlaying: (v: boolean) => void
  requestShrink: (kind: 'slice' | 'full') => void
  resetLoop: () => void
  setPhase: (p: LoopPhase) => void
}

const wrapDeg = (a: number) => ((a % 360) + 360) % 360

export const useCY = create<CYState>((set, get) => ({
  n: 5,
  alpha: 45,
  s: 0,
  pieces: true,
  wrap: false,
  playing: false,
  shrink: null,
  phase: 'idle',
  setN: (n) => set({ n, phase: 'idle', shrink: null }),
  stepN: (d) => {
    const n = Math.min(6, Math.max(3, get().n + d)) as Degree
    if (n !== get().n) set({ n, phase: 'idle', shrink: null })
  },
  setAlpha: (a) => set({ alpha: wrapDeg(a) }),
  setS: (s) => set({ s: Math.min(1, Math.max(0, s)) }),
  setPieces: (pieces) => set({ pieces }),
  setWrap: (wrap) => set({ wrap, phase: 'idle', shrink: null }),
  setPlaying: (playing) => set({ playing }),
  requestShrink: (kind) => set((st) => ({ shrink: { kind, id: (st.shrink?.id ?? 0) + 1 } })),
  resetLoop: () => set({ phase: 'idle', shrink: null }),
  setPhase: (phase) => set({ phase }),
}))

// dev-only handle for the screenshot harness (stripped from production builds)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __cy: typeof useCY }).__cy = useCY
