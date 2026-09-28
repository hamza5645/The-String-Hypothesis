import Lenis from 'lenis'
import { chapterScrollY, journey, measure, scheduleMeasure, stepScrollY, update } from './journey'
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
  window.addEventListener('resize', scheduleMeasure)
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
/**
 * Scroll to a chapter. Neighbouring chapters glide; long jumps dip to black instead of
 * flying through (and mounting) every scene in between.
 */
export function scrollToChapter(id: string) {
  const c = journey.byId.get(id)
  if (!c) return
  const y = Math.max(0, chapterScrollY(id, 0))
  const distance = Math.abs(c.index - journey.active)
  if (distance <= 1 || jumping) {
    scrollToY(y)
    return
  }
  jumping = true
  const root = document.documentElement
  root.classList.add('is-jumping')
  window.setTimeout(
    () => {
      journey.travelTo = c.index
      scrollToY(y, true)
      update(window.scrollY)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          journey.travelTo = null
          update(window.scrollY)
          root.classList.remove('is-jumping')
          jumping = false
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

/** Apply ?solo / ?p / ?step deep-links, and #chapter hashes, after layout settles. */
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
  if (hash && journey.byId.has(hash)) {
    window.scrollTo(0, chapterScrollY(hash, 0))
    update(window.scrollY)
  }
}
