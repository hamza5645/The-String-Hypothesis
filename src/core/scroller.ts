import Lenis from 'lenis'
import { chapterScrollY, journey, measure, scheduleMeasure, setJumpImpl, stepScrollY, update } from './journey'
import { params } from './params'
import { prefersReducedMotion } from './time'

let lenis: Lenis | null = null
let inited = false

export function initScroller() {
  if (inited) return
  inited = true
  if (!prefersReducedMotion() && !params.solo && !params.shot) {
    // allowNestedScroll: wheel/touch over a lab panel scrolls the page unless the panel itself can scroll.
    lenis = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false, allowNestedScroll: true })
  }
  window.addEventListener('scroll', () => update(window.scrollY), { passive: true })
  // resize → re-measure; measure() itself re-anchors the reader inside their chapter (Lenis-aware jump)
  setJumpImpl((y) => scrollToY(y, true))
  window.addEventListener('resize', scheduleMeasure)
  if (!params.solo && !params.shot) window.addEventListener('pagehide', savePosition)
  const ro = new ResizeObserver(() => scheduleMeasure())
  ro.observe(document.body)
  document.fonts?.ready.then(() => scheduleMeasure()).catch(() => {})
}

export const getLenis = () => lenis

export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, force: true, duration: immediate ? 0 : 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

let jumping = false
/** The latest pick made while a dip-to-black jump is under way (the jump lands there). */
let pendingId: string | null = null
/**
 * Scroll to a chapter. Neighbouring chapters glide; long jumps dip to black instead of
 * flying through (and mounting) every scene in between.
 */
export function scrollToChapter(id: string) {
  const c = journey.byId.get(id)
  if (!c) return
  if (jumping) {
    // still under the black cover: retarget the pending jump instead of starting a flight
    pendingId = id
    return
  }
  const y = Math.max(0, chapterScrollY(id, 0))
  const distance = Math.abs(c.index - journey.active)
  if (distance <= 1) {
    scrollToY(y)
    return
  }
  jumping = true
  pendingId = id
  const root = document.documentElement
  root.classList.add('is-jumping')
  window.setTimeout(
    () => {
      const target = journey.byId.get(pendingId ?? id) ?? c
      pendingId = null
      journey.travelTo = target.index
      scrollToY(Math.max(0, chapterScrollY(target.id, 0)), true)
      update(window.scrollY)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          journey.travelTo = null
          update(window.scrollY)
          root.classList.remove('is-jumping')
          jumping = false
          // a pick that arrived in these last two frames still wins
          const late = pendingId
          pendingId = null
          if (late && late !== target.id) scrollToChapter(late)
        }),
      )
    },
    prefersReducedMotion() ? 0 : 320,
  )
}

export function scrollToStep(chapterId: string, stepId: string, sp = 0.5, immediate = false) {
  const y = stepScrollY(chapterId, stepId, sp)
  if (y != null) scrollToY(Math.max(0, y), immediate)
}

/** Stop background page scrolling while a drawer is open. */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

const POS_KEY = 'sh:pos'
interface SavedPosition {
  /** chapter whose section holds the position, and the fraction through it */
  id: string
  f: number
  /** chapter that was active (the URL hash) */
  active: string
}

/** On leaving the page: remember the exact place, so a reload returns there (not just the chapter top). */
function savePosition() {
  const c = journey.chapters[journey.section]
  const a = journey.chapters[journey.active]
  if (!c?.el || !a) return
  const pos: SavedPosition = { id: c.id, f: (journey.scrollY - c.top) / Math.max(1, c.height), active: a.id }
  try {
    sessionStorage.setItem(POS_KEY, JSON.stringify(pos))
  } catch {
    /* storage unavailable: the #chapter hash still restores the chapter */
  }
}

function savedPosition(hash: string): SavedPosition | null {
  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
    if (nav && nav.type !== 'reload' && nav.type !== 'back_forward') return null
    const raw = sessionStorage.getItem(POS_KEY)
    if (!raw) return null
    const pos = JSON.parse(raw) as SavedPosition
    if (!journey.byId.has(pos.id) || !(pos.f >= 0 && pos.f <= 1)) return null
    // a hash that disagrees (an edited or shared link) wins over the remembered place
    if (hash ? hash !== pos.active : pos.active !== journey.chapters[0]?.id) return null
    return pos
  } catch {
    return null
  }
}

/** Apply ?solo / ?p / ?step deep-links, #chapter hashes, and reload positions, after layout settles. */
export function applyInitialPosition() {
  measure()
  if (params.solo) {
    let y: number | null = null
    if (params.step) y = stepScrollY(params.solo, params.step, params.sp ?? 0.5)
    if (y == null) y = chapterScrollY(params.solo, params.p ?? 0)
    window.scrollTo(0, Math.max(0, y))
    update(window.scrollY)
    return
  }
  const hash = decodeURIComponent(window.location.hash.replace('#', ''))
  const saved = params.shot ? null : savedPosition(hash)
  if (saved) {
    const c = journey.byId.get(saved.id)!
    window.scrollTo(0, Math.max(0, Math.round(c.top + saved.f * c.height)))
    update(window.scrollY)
  } else if (hash && journey.byId.has(hash)) {
    window.scrollTo(0, chapterScrollY(hash, 0))
    update(window.scrollY)
  }
}
