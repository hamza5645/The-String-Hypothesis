import { create } from 'zustand'
import { easeInOutCubic } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'

/** Lab state ("Point or string?"), shared by the Overlay (controls) and the Scene (canvas). */
export type Mode = 'point' | 'string'

interface LabState {
  /** log10 of the field of view L (m). */
  s: number
  mode: Mode
  /** log10 of the string length ℓs (m). Default 10⁻³⁴ m. */
  ls: number
  /**
   * False until the visitor changes something. While untouched, the lab mirrors the story's
   * last state (the resolved string at s_end), so docking the panel changes nothing on stage.
   */
  touched: boolean
  setS: (s: number) => void
  setMode: (m: Mode) => void
  setLs: (ls: number) => void
  /** Animate s to a landmark over 1.2 s. */
  jumpTo: (s: number) => void
  /** Mirror the story's state without counting as a visitor change. */
  prime: (s: number) => void
  /** Leaving the lab: ease back to the story's end state (s_end, string, ℓs = 10⁻³⁴ m). */
  settle: (s: number) => void
  /** Out of the lab's sight: snap back to the story's end state. */
  reset: (s: number) => void
}

export const LS_STORY = -34
let raf = 0
let settling = false
const clampS = (s: number) => Math.max(-36, Math.min(0.5, s))

function animate(from: { s: number; ls: number }, to: { s: number; ls: number }, set: (p: Partial<LabState>) => void, done?: () => void) {
  cancelAnimationFrame(raf)
  if (prefersReducedMotion() || (Math.abs(to.s - from.s) < 1e-3 && Math.abs(to.ls - from.ls) < 1e-3)) {
    set({ s: to.s, ls: to.ls })
    done?.()
    return
  }
  const t0 = performance.now()
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / 1200)
    const e = easeInOutCubic(k)
    set({ s: from.s + (to.s - from.s) * e, ls: from.ls + (to.ls - from.ls) * e })
    if (k < 1) raf = requestAnimationFrame(step)
    else done?.()
  }
  raf = requestAnimationFrame(step)
}

export const useLab = create<LabState>((set, get) => ({
  s: -18,
  mode: 'string',
  ls: LS_STORY,
  touched: false,
  setS: (s) => {
    cancelAnimationFrame(raf)
    settling = false
    set({ s: clampS(s), touched: true })
  },
  setMode: (mode) => {
    cancelAnimationFrame(raf)
    settling = false
    set({ mode, touched: true })
  },
  setLs: (ls) => {
    cancelAnimationFrame(raf)
    settling = false
    set({ ls: Math.max(-35, Math.min(-17, ls)), touched: true })
  },
  jumpTo: (target) => {
    settling = false
    set({ touched: true })
    animate({ s: get().s, ls: get().ls }, { s: target, ls: get().ls }, set)
  },
  prime: (s) => {
    const st = get()
    if (st.touched || (st.s === s && st.mode === 'string' && st.ls === LS_STORY)) return
    set({ s, mode: 'string', ls: LS_STORY })
  },
  reset: (s) => {
    cancelAnimationFrame(raf)
    settling = false
    set({ s, mode: 'string', ls: LS_STORY, touched: false })
  },
  settle: (s) => {
    const st = get()
    if (!st.touched || settling) return
    settling = true
    set({ mode: 'string' })
    animate({ s: st.s, ls: st.ls }, { s, ls: LS_STORY }, set, () => {
      settling = false
      set({ touched: false })
    })
  },
}))
