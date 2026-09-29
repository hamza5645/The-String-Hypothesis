import { create } from 'zustand'
import { prefersReducedMotion } from '@/core/time'
import { HBARC, type MachineId } from './model'

/** Lab + stage interaction state shared by the Overlay (DOM) and the Scene (canvas). */
export interface ScaleLab {
  /** log₁₀ of the probe distance d, in meters. */
  logD: number
  machine: MachineId
  /** Map framing: auto (machine fills 60%) or manual (slider). */
  auto: boolean
  manualLogL: number
  /** Which micro-copy line the panel shows (last thing the visitor did). */
  note: string | null
  /** Beat 6: hovered / focused route card (−1 = none). */
  route: number
  setLogD: (v: number, note?: string | null) => void
  animateTo: (v: number, note?: string | null) => void
  setMachine: (m: MachineId) => void
  setAuto: (v: boolean) => void
  setManualLogL: (v: number) => void
  setRoute: (i: number) => void
}

export const LOG_D_MIN = -36
export const LOG_D_MAX = Math.log10(8.8e26)
export const LOG_D_DEFAULT = Math.log10(HBARC / 13_600) // 1.45 × 10⁻²⁰ m = ħc / 13.6 TeV

let raf = 0
const clampD = (v: number) => Math.min(LOG_D_MAX, Math.max(LOG_D_MIN, v))

export const useScaleLab = create<ScaleLab>((set, get) => ({
  logD: LOG_D_DEFAULT,
  machine: 'lhc',
  auto: true,
  manualLogL: 5,
  note: null,
  route: -1,
  setLogD: (v, note) => {
    cancelAnimationFrame(raf)
    set(note === undefined ? { logD: clampD(v) } : { logD: clampD(v), note })
  },
  animateTo: (v, note = null) => {
    cancelAnimationFrame(raf)
    const to = clampD(v)
    const from = get().logD
    set({ note })
    if (prefersReducedMotion() || Math.abs(to - from) < 1e-6) {
      set({ logD: to })
      return
    }
    const t0 = performance.now()
    const dur = 1200
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur)
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      set({ logD: from + (to - from) * e })
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  },
  setMachine: (machine) => set({ machine, note: `machine:${machine}` }),
  setAuto: (auto) => set({ auto }),
  setManualLogL: (manualLogL) => set({ manualLogL }),
  setRoute: (route) => set({ route }),
}))
