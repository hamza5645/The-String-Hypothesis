import { create } from 'zustand'

/** Prologue lab state shared between the Overlay (DOM) and the Scene (canvas). */
export const usePrologue = create<{ pluckRequests: number; requestPluck: () => void }>((set) => ({
  pluckRequests: 0,
  requestPluck: () => set((s) => ({ pluckRequests: s.pluckRequests + 1 })),
}))
