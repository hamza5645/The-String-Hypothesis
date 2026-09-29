import { create } from 'zustand'
import { params } from './params'

export type QualityTier = 'low' | 'medium' | 'high'

interface Settings {
  /** Sound is on by default (silent until the first click, tap or key press); switching it off is remembered. */
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

/** One throwaway WebGL2 probe: is WebGL2 there at all, and which GPU renders it? (context released right after) */
function probeGPU(): { webgl: boolean; renderer: string } {
  if (params.nowebgl || typeof document === 'undefined') return { webgl: false, renderer: '' }
  try {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl2') // three r186 is WebGL2-only
    if (!g) return { webgl: false, renderer: '' }
    const dbg = g.getExtension('WEBGL_debug_renderer_info')
    const renderer = dbg ? String(g.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
    g.getExtension('WEBGL_lose_context')?.loseContext()
    return { webgl: true, renderer }
  } catch {
    return { webgl: false, renderer: '' }
  }
}
const GPU = probeGPU()

// Software rasterizers draw every pixel on the CPU; integrated laptop GPUs (Intel UHD/Iris, mobile
// chips) share memory bandwidth and, on Windows, compile shaders through Direct3D's slow FXC compiler.
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|basic render|software/i
const INTEGRATED_GPU = /intel|uhd graphics|iris|hd graphics|mali|adreno|powervr|videocore/i

function detectQuality(): QualityTier {
  if (params.quality) return params.quality
  if (typeof window === 'undefined') return 'medium'
  if (SOFTWARE_GPU.test(GPU.renderer)) return 'low'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (cores <= 4 || mem <= 4) return 'low'
  if (coarse || small || INTEGRATED_GPU.test(GPU.renderer)) return 'medium'
  return 'high'
}

/** The GPU's renderer string (for diagnostics; empty when unavailable). */
export const gpuRenderer = GPU.renderer

export const useSettings = create<Settings>((set) => ({
  sound: load('sound') !== '0',
  deeper: params.deeper || load('deeper') === '1',
  quality: detectQuality(),
  qualityLocked: !!params.quality,
  webgl: typeof document !== 'undefined' ? GPU.webgl : true,
  glossaryOpen: false,
  menuOpen: false,
  drawer: null,
  setSound: (v) => {
    save('sound', v ? '1' : '0')
    set({ sound: v })
  },
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
