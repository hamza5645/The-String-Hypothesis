import { create } from 'zustand'
import { smoothstep } from '@/core/math'

/** The Thread's analogy note fades as soon as the reader starts to scroll (chapter progress), on both layouts. */
export const noteOpacity = (progress: number) => 1 - smoothstep(0.08, 0.4, progress)

/** Prologue lab state shared between the Overlay (DOM) and the Scene (canvas). */
export const usePrologue = create<{
  pluckRequests: number
  requestPluck: () => void
  /**
   * Portrait layout only: the Thread's resting height, in px from the top of the screen, measured from the
   * hero's DOM band (.pro-band__slot). null on the desktop layout, where the Scene composes the Thread itself.
   */
  bandY: number | null
}>((set) => ({
  pluckRequests: 0,
  requestPluck: () => set((s) => ({ pluckRequests: s.pluckRequests + 1 })),
  bandY: null,
}))
