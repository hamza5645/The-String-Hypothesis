import { create } from 'zustand'
import { clampR, snapR } from './model'

export type Occupant = 'string' | 'point'

/**
 * Where Beat 6's dictionary draws its "=" column (CSS px from the viewport's left edge; −1 = unknown).
 * Measured by the Overlay, read by the Scene so the seam hairline runs through the dictionary's "=" signs.
 */
export const dictSeam = { x: -1, vw: 0 }
export type LabNote = 'none' | 'jump' | 'detent'

/** Lab state for "The Circle Swap", shared by the Overlay (DOM panel) and the Scene (worlds). */
interface DualityLab {
  /** Circle radius R in string lengths (r = R/ℓs). Default exactly 2 (see Model: slider default). */
  r: number
  mode: Occupant
  /** Selected pair index 0..15 in the sorted list. */
  sel: number
  /** Increments on every "Jump to the dual world"; the Scene animates the crossing slide. */
  jumps: number
  /** Radius before the latest jump. */
  jumpFrom: number
  note: LabNote
  setR: (r: number) => void
  setMode: (m: Occupant) => void
  setSel: (i: number) => void
  jump: () => void
}

export const useDuality = create<DualityLab>((set, get) => ({
  r: 2,
  mode: 'string',
  sel: 0,
  jumps: 0,
  jumpFrom: 2,
  note: 'none',
  setR: (r) => {
    const v = snapR(clampR(r))
    set({ r: v, note: v === 1 ? 'detent' : 'none' })
  },
  setMode: (mode) => set({ mode }),
  setSel: (i) => set({ sel: Math.max(0, Math.min(15, i)) }),
  jump: () => {
    const { r, jumps } = get()
    set({ r: 1 / r, jumpFrom: r, jumps: jumps + 1, note: 'jump' })
  },
}))
