// The scroll engine. Measures chapter sections and <Step> blocks, and on every
// scroll computes (without React) each chapter's progress/presence and each
// step's local progress. Coarse changes (active chapter, mounted set) are
// published to a tiny zustand store for React.

import { create } from 'zustand'
import { clamp01, smoothstep } from './math'
import { params } from './params'

export interface StepRuntime {
  id: string
  el: HTMLElement
  top: number
  height: number
  progress: number
  vis: number
  fade: boolean
  /** fade out as soon as the sticky content starts moving away (instead of in the last ~22% vh) */
  early: boolean
  /** keep the content at its sticky resting place after the sticky release and fade it there (exit="hold") */
  hold: boolean
  /** px the content is pushed down to cancel the sticky release (hold only) */
  dy: number
  /** this step is a <Lab> */
  lab: boolean
}

export type StepExit = 'late' | 'early' | 'hold'
/** exit="hold": viewports of scroll over which the held content fades, starting at the sticky release. */
const HOLD_FADE = 0.4

export interface ChapterRuntime {
  id: string
  index: number
  el: HTMLElement | null
  top: number
  height: number
  progress: number
  presence: number
  steps: Map<string, StepRuntime>
}

export const journey = {
  scrollY: 0,
  vh: typeof window !== 'undefined' ? window.innerHeight : 800,
  vw: typeof window !== 'undefined' ? window.innerWidth : 1200,
  chapters: [] as ChapterRuntime[],
  byId: new Map<string, ChapterRuntime>(),
  /** Index of the dominant chapter. */
  active: 0,
  /** 0..1 blend from the current chapter towards the next one. */
  blend: 0,
  /** 0..1 through the whole document. */
  global: 0,
  /** Index of the section whose top has passed the viewport top. */
  section: 0,
  /** During a long programmatic jump: the target chapter index (mounting follows it). */
  travelTo: null as number | null,
  docHeight: 1,
}

interface JourneyStore {
  active: number
  mounted: number[]
}

export const useJourney = create<JourneyStore>(() => ({ active: 0, mounted: [0, 1] }))

export function registerChapters(list: { id: string; index: number }[]) {
  journey.chapters = list.map((c) => ({
    id: c.id,
    index: c.index,
    el: null,
    top: 0,
    height: 1,
    progress: 0,
    presence: c.index === 0 ? 1 : 0,
    steps: new Map(),
  }))
  journey.byId = new Map(journey.chapters.map((c) => [c.id, c]))
  if (params.solo) {
    const solo = journey.byId.get(params.solo)
    if (solo) {
      journey.active = solo.index
      useJourney.setState({ active: solo.index, mounted: [solo.index] })
    }
  }
}

export function bindChapterEl(id: string, el: HTMLElement | null) {
  const c = journey.byId.get(id)
  if (!c) return
  c.el = el
  scheduleMeasure()
}

/** `exit`: a StepExit, or (legacy) a boolean meaning 'early'. */
export function bindStep(chapterId: string, stepId: string, el: HTMLElement, fade: boolean, exit: boolean | StepExit = false) {
  const c = journey.byId.get(chapterId)
  if (!c) return () => {}
  const prev = c.steps.get(stepId)
  if (import.meta.env.DEV && prev && prev.el !== el && prev.el.isConnected)
    console.error(`[journey] duplicate <Step id="${stepId}"> in chapter ${chapterId}; ids must be unique per chapter ('title' and 'lab' are used by <ChapterTitle> and <Lab>)`)
  const early = exit === true || exit === 'early'
  const hold = exit === 'hold'
  el.style.removeProperty('--sh')
  const s: StepRuntime = { id: stepId, el, top: 0, height: 1, progress: 0, vis: -1, fade, early, hold, dy: 0, lab: el.classList.contains('step--lab') }
  c.steps.set(stepId, s)
  scheduleMeasure()
  return () => {
    if (c.steps.get(stepId) === s) c.steps.delete(stepId)
  }
}

let measureQueued = false
export function scheduleMeasure() {
  if (measureQueued || typeof window === 'undefined') return
  measureQueued = true
  requestAnimationFrame(() => {
    measureQueued = false
    measure()
  })
}

// journey.vh must equal the layout's 100svh (steps are len × 100svh). On phones innerHeight
// changes as the toolbar collapses; svh does not — so measure a 100svh probe.
let probe: HTMLElement | null = null
function svh() {
  if (!probe) {
    probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none'
    document.body.appendChild(probe)
  }
  return probe.getBoundingClientRect().height || window.innerHeight
}

/** How a large programmatic re-anchor scrolls (the scroller installs Lenis-aware scrolling). */
let jumpTo = (y: number) => window.scrollTo(0, y)
export function setJumpImpl(fn: (y: number) => void) {
  jumpTo = fn
}

let measured = false
export function measure() {
  const vh = svh()
  const vw = window.innerWidth
  // A viewport resize (window, rotation, fullscreen, devtools) rescales every step (len × 100svh) while the
  // absolute scrollY stays put. Remember where the reader was inside the current chapter (from the stale
  // runtime) and return them there once everything is re-measured.
  let anchor: ChapterRuntime | null = null
  let anchorF = 0
  if (measured && (Math.abs(vh - journey.vh) > 0.5 || vw !== journey.vw)) {
    const c = journey.chapters[journey.section]
    if (c?.el && c.height > 1) {
      anchor = c
      anchorF = (journey.scrollY - c.top) / c.height
    }
  }
  journey.vh = vh
  journey.vw = vw
  const sy = window.scrollY
  for (const c of journey.chapters) {
    if (!c.el) continue
    const r = c.el.getBoundingClientRect()
    c.top = r.top + sy
    c.height = Math.max(1, r.height)
    for (const s of c.steps.values()) {
      const sr = s.el.getBoundingClientRect()
      s.top = sr.top + sy
      s.height = Math.max(1, sr.height)
    }
  }
  if (import.meta.env.DEV) {
    for (const c of journey.chapters) {
      if (!c.el || !c.steps.size) continue
      let sum = 0
      for (const st of c.steps.values()) sum += st.height
      if (Math.abs(c.height - sum) > 2)
        console.warn(`[journey] chapter ${c.id}: ${Math.round(c.height - sum)}px of content outside <Step> — wrap everything in a Step (or the Lab footer)`)
    }
  }
  journey.docHeight = document.documentElement.scrollHeight
  measured = true
  if (anchor) {
    const y = Math.max(0, Math.round(anchor.top + anchorF * anchor.height))
    if (Math.abs(y - window.scrollY) > 1) jumpTo(y)
  }
  update(window.scrollY)
}

let labOn = false
const listeners = new Set<() => void>()
/** Subscribe to every scroll update (non-React). Returns an unsubscribe fn. */
export function onJourney(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function update(y: number) {
  journey.scrollY = y
  const vh = journey.vh
  const cs = journey.chapters
  journey.global = clamp01(y / Math.max(1, journey.docHeight - vh))

  // chapter progress + step progress
  for (const c of cs) {
    if (!c.el) continue
    c.progress = clamp01((y - c.top) / Math.max(1, c.height - vh))
    for (const s of c.steps.values()) {
      const p = clamp01((y + vh * 0.5 - s.top) / s.height)
      s.progress = p
      // fade over ~22% of a viewport of scroll at each end
      const f = Math.min(0.45, (0.22 * vh) / s.height)
      let vis = 1
      if (s.hold) {
        // cancel the sticky release: the content stays where it rested while it fades out
        const dy = Math.min(vh, Math.max(0, y - (s.top + s.height - vh)))
        if (Math.abs(dy - s.dy) > 0.25) {
          s.dy = dy
          s.el.style.setProperty('--sh', `${dy.toFixed(1)}px`)
        }
      }
      if (s.fade) {
        if (s.hold) {
          const release = Math.max(f, 1 - (0.5 * vh) / s.height)
          vis = smoothstep(0, f, p) * (1 - smoothstep(release, Math.min(1, release + (HOLD_FADE * vh) / s.height), p))
        } else if (s.early) {
          // out as soon as the sticky content releases and starts to rise
          const release = Math.max(f, 1 - (0.5 * vh) / s.height)
          vis = smoothstep(0, f, p) * (1 - smoothstep(release, Math.min(1, release + (0.24 * vh) / s.height), p))
        } else vis = smoothstep(0, f, p) * (1 - smoothstep(1 - f, 1, p))
      }
      if (Math.abs(vis - s.vis) > 0.002) {
        const wasHidden = s.vis < 0.01
        s.vis = vis
        s.el.style.setProperty('--sv', vis.toFixed(3))
        const hidden = vis < 0.01
        if (hidden !== wasHidden || s.el.dataset.hidden === undefined) s.el.dataset.hidden = hidden ? '1' : '0'
      }
    }
  }

  // presence: dissolve across the last viewport of each chapter
  let k = 0
  if (!params.solo) {
    for (let i = 0; i < cs.length; i++) if (cs[i].el && cs[i].top <= y + 1) k = i
    const cur = cs[k]
    const next = cs[k + 1]
    let t = 0
    if (next && next.el) t = smoothstep(0.1, 0.9, (y - (next.top - vh)) / vh)
    for (const c of cs) c.presence = 0
    if (cur) cur.presence = 1 - t
    if (next) next.presence = t
    journey.blend = t
    journey.active = next && t > 0.5 ? k + 1 : k
  } else {
    const solo = journey.byId.get(params.solo)
    for (const c of cs) c.presence = c === solo ? 1 : 0
  }
  journey.section = k

  // is a lab on screen? (chrome such as the rail labels steps aside)
  let lab = false
  const act = cs[journey.active]
  if (act) for (const st of act.steps.values()) if (st.lab && st.progress > 0 && st.progress < 1) lab = true
  if (lab !== labOn) {
    labOn = lab
    document.documentElement.classList.toggle('is-lab', lab)
  }

  const st = useJourney.getState()
  if (!params.solo) {
    // Mount set follows the *section* index (it only changes where one scene is drawn alone),
    // with ±2 hysteresis so hovering around a boundary never thrashes mounts. While a long
    // programmatic jump is in flight, the target's neighbourhood is mounted instead.
    const centre = journey.travelTo ?? k
    const want = [centre - 1, centre, centre + 1]
    const keep = journey.travelTo != null ? [] : st.mounted.filter((i) => i >= centre - 2 && i <= centre + 2)
    const set = [...new Set([...keep, ...want])].filter((i) => i >= 0 && i < cs.length).sort((a, b) => a - b)
    const mountedChanged = set.join() !== st.mounted.join()
    if (mountedChanged || st.active !== journey.active) {
      if (st.active !== journey.active) syncHash(journey.active)
      useJourney.setState({ active: journey.active, mounted: mountedChanged ? set : st.mounted })
    }
  }
  for (const fn of listeners) fn()
}

/** The URL follows the active chapter (#id), so reloads and shared links land in the same chapter. */
function syncHash(idx: number) {
  if (params.shot) return
  const id = journey.chapters[idx]?.id
  if (!id) return
  const url = idx === 0 ? location.pathname + location.search : `${location.pathname}${location.search}#${id}`
  if (url === location.pathname + location.search + location.hash) return
  try {
    history.replaceState(history.state, '', url)
  } catch {
    /* rate-limited (Safari): the next change catches up */
  }
}


/** Scroll position (px) at which a chapter reaches the given progress. */
export function chapterScrollY(id: string, progress = 0) {
  const c = journey.byId.get(id)
  if (!c) return 0
  return c.top + progress * Math.max(0, c.height - journey.vh)
}

/** Scroll position (px) that centers a step at the given local progress. */
export function stepScrollY(chapterId: string, stepId: string, sp = 0.5) {
  const s = journey.byId.get(chapterId)?.steps.get(stepId)
  if (!s) return null
  return s.top + sp * s.height - journey.vh * 0.5
}
