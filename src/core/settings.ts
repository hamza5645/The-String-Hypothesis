import { create } from 'zustand'
import { params } from './params'

export type QualityTier = 'low' | 'medium' | 'high'

interface Settings {
  /** Sound is off by default; turning it on happens from a click (user gesture). */
  sound: boolean
  /** "Deeper physics" mode: shows equations and technical asides inline. */
  deeper: boolean
  /** Rendering tier. Auto-detected, may step down if frames are slow. */
  quality: QualityTier
  qualityLocked: boolean
  webgl: boolean
  glossaryOpen: boolean
  menuOpen: boolean
  /** Currently open "Go deeper" drawer id (chapterId:drawerKey) or null. */
  drawer: string | null
  setSound: (v: boolean) => void
  setDeeper: (v: boolean) => void
  setQuality: (q: QualityTier, lock?: boolean) => void
  setGlossaryOpen: (v: boolean) => void
  setMenuOpen: (v: boolean) => void
  setDrawer: (id: string | null) => void
}

const load = (k: string): string | null => {
  try {
    return window.localStorage.getItem('sh:' + k)
  } catch {
    return null
  }
}
const save = (k: string, v: string) => {
  try {
    window.localStorage.setItem('sh:' + k, v)
  } catch {
    /* storage unavailable: fine */
  }
}

function detectQuality(): QualityTier {
  if (params.quality) return params.quality
  if (typeof window === 'undefined') return 'medium'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (cores <= 4 || mem <= 4) return 'low'
  if (coarse || small) return 'medium'
  return 'high'
}

function detectWebGL(): boolean {
  if (params.nowebgl) return false
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2') // three r186 is WebGL2-only
  } catch {
    return false
  }
}

export const useSettings = create<Settings>((set) => ({
  sound: false,
  deeper: params.deeper || load('deeper') === '1',
  quality: detectQuality(),
  qualityLocked: !!params.quality,
  webgl: typeof document !== 'undefined' ? detectWebGL() : true,
  glossaryOpen: false,
  menuOpen: false,
  drawer: null,
  setSound: (v) => set({ sound: v }),
  setDeeper: (v) => {
    save('deeper', v ? '1' : '0')
    set({ deeper: v })
  },
  setQuality: (quality, lock = false) => set({ quality, qualityLocked: lock }),
  setGlossaryOpen: (v) => set({ glossaryOpen: v }),
  setMenuOpen: (v) => set({ menuOpen: v }),
  setDrawer: (id) => set({ drawer: id }),
}))

/** Non-reactive read for render loops. */
export const settings = () => useSettings.getState()

/** Particle-count multiplier for the current tier. */
export const particleScale = () => {
  const q = useSettings.getState().quality
  return q === 'high' ? 1 : q === 'medium' ? 0.6 : 0.35
}
