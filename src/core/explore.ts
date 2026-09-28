// Pointer input for the 3D stage that doesn't fight the page:
// - Drags that start on empty stage (not on text/panels/controls) accumulate into
//   `explore.dx/dy`, which <OrbitRig> consumes to rotate the camera.
// - R3F object handlers that want the drag for themselves (e.g. plucking a string)
//   call `claimPointer()` in onPointerDown; the stage then won't orbit, and on touch
//   screens the page won't scroll while the claim lasts.
// - `explore.nx/ny` is the pointer position in NDC (-1..1) for hover-reactive scenes;
//   gate hover effects on `explore.hovering` (false after a finger lifts / mouse leaves).
// The .stage element uses `touch-action: pan-y pinch-zoom`, so on phones vertical swipes
// still scroll and horizontal drags rotate.

import { journey } from './journey'

export const explore = {
  dx: 0,
  dy: 0,
  dragging: false,
  claimed: false,
  pointerId: -1,
  /** Pointer in normalized device coords of the stage (x right, y up), last known. */
  nx: 0,
  ny: 0,
  /** True once the pointer has moved over the page at least once. */
  seen: false,
  /** True while a mouse/pen hovers the page or a finger is down. Gate hover effects on this. */
  hovering: false,
  /** Seconds since the last drag movement (for idle auto-rotation etc.). */
  idle: 999,
}

let lastX = 0
let lastY = 0
let inited = false

/** True for DOM targets that belong to the UI (controls, panels, text chrome) rather than the stage. */
export const isUI = (t: EventTarget | null) => {
  const el = t as Element | null
  if (!el || !el.closest) return false
  return !!el.closest('[data-ui], a, button, input, select, textarea, label, summary, [role="slider"], [role="button"]')
}

/** Call from an R3F onPointerDown to take this pointer away from camera orbiting / page panning. */
export function claimPointer() {
  explore.claimed = true
  explore.dragging = false
}

const setNdc = (e: PointerEvent) => {
  const de = document.documentElement
  explore.nx = (e.clientX / Math.max(1, de.clientWidth)) * 2 - 1
  explore.ny = -((e.clientY / Math.max(1, de.clientHeight)) * 2 - 1)
}

export function initExplore() {
  if (inited) return
  inited = true
  window.addEventListener(
    'pointerdown',
    (e) => {
      setNdc(e)
      explore.hovering = true
      if (explore.claimed || isUI(e.target)) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      explore.dragging = true
      explore.pointerId = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
    },
    { passive: true },
  )
  window.addEventListener(
    'pointermove',
    (e) => {
      explore.seen = true
      setNdc(e)
      if (e.pointerType !== 'touch' || e.buttons) explore.hovering = true
      if (explore.dragging && e.pointerId === explore.pointerId) {
        explore.dx += e.clientX - lastX
        explore.dy += e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        explore.idle = 0
      }
    },
    { passive: true },
  )
  const end = (e: PointerEvent) => {
    if (e.pointerType === 'touch') explore.hovering = false
    if (e.pointerId === explore.pointerId || explore.claimed) {
      explore.dragging = false
      explore.claimed = false
      explore.pointerId = -1
    }
  }
  window.addEventListener('pointerup', end, { passive: true })
  window.addEventListener('pointercancel', end, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => {
    explore.hovering = false
  })
  window.addEventListener('blur', () => {
    explore.dragging = false
    explore.claimed = false
    explore.hovering = false
  })
}

/**
 * Must be attached (non-passive) to the .stage element before any touchstart: while an object
 * has claimed the pointer, stop the browser from turning the drag into a page pan.
 */
export function guardTouchPan(stageEl: HTMLElement) {
  const onMove = (e: TouchEvent) => {
    if (explore.claimed) e.preventDefault()
  }
  stageEl.addEventListener('touchmove', onMove, { passive: false })
  return () => stageEl.removeEventListener('touchmove', onMove)
}

/** Called once per frame after scenes ran: drops unconsumed drag deltas. */
export function tickExplore() {
  explore.dx = 0
  explore.dy = 0
  explore.idle += 1 / 60
}

let cursorOwner: string | null = null

/** Set the page cursor while hovering interactive 3D things ('' resets). Owned by the active chapter. */
export function setStageCursor(cursor: '' | 'grab' | 'grabbing' | 'pointer' | 'crosshair' | 'ew-resize' | 'ns-resize') {
  document.documentElement.style.cursor = cursor
  cursorOwner = cursor ? (journey.chapters[journey.active]?.id ?? null) : null
}

/** Engine: reset the cursor if the given chapter set it (called when a chapter deactivates/unmounts). */
export function releaseStageCursor(chapterId: string) {
  if (cursorOwner === chapterId) {
    document.documentElement.style.cursor = ''
    cursorOwner = null
  }
}
