import { createContext, useContext, type ComponentType, type LazyExoticComponent } from 'react'
import { journey } from './journey'

/**
 * Live, allocation-free view of one chapter's scroll state.
 * Read it inside useFrame / rAF loops. Every getter is O(1) and never triggers React renders.
 */
export interface ChapterHandle {
  id: string
  index: number
  /** 0..1 through the chapter's whole scroll section (0 while its top is below the viewport top). */
  progress(): number
  /** 0..1 how visible this chapter's scene is (cross-dissolves with neighbours at the boundaries). */
  presence(): number
  /** True when this chapter is the dominant one on screen. */
  active(): boolean
  /**
   * 0..1 local progress of a named <Step id="..."> in this chapter's Overlay.
   * 0 when the viewport's center line is above the step, 1 when it has passed the step's bottom.
   * Unknown ids return 0.
   */
  step(stepId: string): number
  /** True while the viewport center line is inside the step (0 < step < 1). */
  inStep(stepId: string): boolean
}

export interface ChapterMeta {
  id: string
  index: number
  /** Short title for navigation, e.g. "Vibration". */
  title: string
  /** The chapter's headline question as plain text. */
  question: string
  /** 3D content, rendered inside the chapter's own portal scene with its own camera. Must be React.lazy. */
  Scene: LazyExoticComponent<ComponentType>
  /** DOM content: title, beats (<Step>), lab, go-deeper. Eager (it defines the scroll length). */
  Overlay: ComponentType
  /** Prefetch the Scene chunk (called in idle time after load). */
  preload?: () => Promise<unknown>
  /** Static SVG illustration used when WebGL is unavailable. */
  Fallback?: LazyExoticComponent<ComponentType>
  /** Characteristic length scale of what's on screen, in meters (drives the scale gauge). null hides the marker. */
  scale?: (h: ChapterHandle) => number | null
  /**
   * Epistemic status of the gauge reading (evaluated every frame, right after `scale`: keep it pure and
   * allocation-free). 'speculative' draws a hollow-ring marker flagged HYPOTHETICAL; null draws a plain reading.
   * Omit it to use the default rule: readings below ~10⁻³² m (the hypothetical string scale, ℓs ~10⁻³⁴ m by
   * traditional estimates) are speculative, and readings at that fiducial also get the line
   * "ℓs unknown · ~10⁻³⁴ m if traditional estimates hold".
   */
  scaleStatus?: (h: ChapterHandle, scale: number) => ScaleStatus
}

/** How the scale gauge marks its reading. */
export type ScaleStatus = 'speculative' | null

export const defineChapter = (m: ChapterMeta) => m

const handles = new Map<string, ChapterHandle>()

export function getHandle(id: string, index: number): ChapterHandle {
  let h = handles.get(id)
  if (h) return h
  const rt = () => journey.byId.get(id)
  h = {
    id,
    index,
    progress: () => rt()?.progress ?? 0,
    presence: () => rt()?.presence ?? 0,
    active: () => journey.active === index,
    step: (sid) => rt()?.steps.get(sid)?.progress ?? 0,
    inStep: (sid) => {
      const p = rt()?.steps.get(sid)?.progress ?? 0
      return p > 0 && p < 1
    },
  }
  handles.set(id, h)
  return h
}

export const ChapterContext = createContext<ChapterHandle | null>(null)

/** The current chapter's handle. Works in both Scene (3D) and Overlay (DOM) trees. */
export function useChapter(): ChapterHandle {
  const h = useContext(ChapterContext)
  if (!h) throw new Error('useChapter() must be used inside a chapter Scene or Overlay')
  return h
}
