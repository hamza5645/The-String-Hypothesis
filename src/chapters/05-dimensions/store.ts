import { create } from 'zustand'
import { R_DEFAULT } from './constants'

export type Station = 'count' | 'zoom' | 'fit'
export type FitMode = 'all' | 'gravity'

/** Lab state ("The Hidden Circle"), shared by the Overlay (controls) and the Scene (stage). */
interface DimState {
  station: Station
  /** COUNT: number of large spatial directions, 0…4. */
  D: number
  /** COUNT: distance from the mass (arbitrary length units, log 0.5–8). */
  dist: number
  /** COUNT: visitor requests (the Scene starts a 6 s slice animation on each increment). */
  visitorReq: number
  /** COUNT: set by the Scene while the visitor animation plays. */
  visitorOn: boolean
  /** COUNT: orbit toggle, and a sequence number that restarts the integration. */
  orbit: boolean
  orbitSeq: number
  /** COUNT: last orbit outcome reported by the Scene. */
  orbitNote: '' | 'fell' | 'escaped'
  /** ZOOM: camera distance in cable radii (log 3–1e4). */
  zoom: number
  /** FIT: wavelengths per lap (0–6). */
  k: number
  /** FIT: radius of the hidden circle (m). */
  R: number
  mode: FitMode
  set: (p: Partial<Omit<DimState, 'set'>>) => void
  requestVisitor: () => void
  setOrbit: (v: boolean) => void
}

export const useDim = create<DimState>((set) => ({
  station: 'count',
  D: 3,
  dist: 1,
  visitorReq: 0,
  visitorOn: false,
  orbit: false,
  orbitSeq: 0,
  orbitNote: '',
  zoom: 1e4,
  k: 1,
  R: R_DEFAULT,
  mode: 'all',
  set: (p) => set(p),
  requestVisitor: () => set((s) => ({ visitorReq: s.visitorReq + 1 })),
  setOrbit: (v) => set((s) => ({ orbit: v, orbitSeq: s.orbitSeq + 1, orbitNote: '' })),
}))

// dev only: lets a screenshot script set lab state (e.g. the FIT station)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __dimStore?: typeof useDim }).__dimStore = useDim
