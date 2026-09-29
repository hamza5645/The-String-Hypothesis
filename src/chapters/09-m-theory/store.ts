import { create } from 'zustand'
import { piecesFor, type Theory, type Toggles } from './model'

export type Station = 'map' | 'dial'
/** Hover/tap target on the MAP: 'tip:<index>' or 'bridge:<id>' (or 'gap' for the IIB–I note). */
export type Focus = string | null

interface MState extends Toggles {
  station: Station
  more: boolean
  /** Pull back slider 0..1. */
  pull: number
  focus: Focus
  theory: Theory
  /** Coupling slider position u ∈ [0,1] (g = 10^(−1.301 + 2.602u)). */
  u: number
  pq: boolean
  pieces: number
  setToggle: (k: keyof Toggles, v: boolean) => void
  setStation: (s: Station) => void
  setMore: (v: boolean) => void
  setPull: (v: number) => void
  setFocus: (f: Focus) => void
  setTheory: (t: Theory) => void
  setU: (u: number) => void
  setPq: (v: boolean) => void
  openDial: (t: Theory) => void
}

export const useM = create<MState>((set, get) => ({
  T: false,
  S: false,
  L: false,
  C: false,
  station: 'map',
  more: false,
  pull: 0,
  focus: null,
  theory: 'IIA',
  u: (Math.log10(0.1) + 1.301) / 2.602, // g = 0.1
  pq: false,
  pieces: 6,
  setToggle: (k, v) => {
    const next = { T: get().T, S: get().S, L: get().L, C: get().C, [k]: v }
    set({ [k]: v, pieces: piecesFor(next) } as Partial<MState>)
  },
  setStation: (station) => set({ station, focus: null }),
  setMore: (more) => set({ more }),
  setPull: (pull) => set({ pull }),
  setFocus: (focus) => set({ focus }),
  setTheory: (theory) => set({ theory }),
  setU: (u) => set({ u }),
  setPq: (pq) => set({ pq }),
  openDial: (theory) => set({ station: 'dial', theory, focus: null }),
}))

// dev only: lets the screenshot scripts set lab states directly
if (import.meta.env.DEV) (window as unknown as { __mth?: typeof useM }).__mth = useM
