// Pointer input for the 3D stage that doesn't fight the page:
// - Drags that start on empty stage (not on text/panels/controls) accumulate into
//   `explore.dx/dy`, which <OrbitRig> consumes to rotate the camera.
// - R3F object handlers that want the drag for themselves (e.g. plucking a string)
//   call `claimPointer()` in onPointerDown; the stage then won't orbit.
// - `explore.nx/ny` is the pointer position in NDC (-1..1) for hover-reactive scenes.
// The canvas uses `touch-action: pan-y`, so on phones vertical swipes still scroll
// and horizontal drags rotate.

export const explore = {
  dx: 0,
  dy: 0,
  dragging: false,
  claimed: false,
  pointerId: -1,
  /** Pointer in normalized device coords (x right, y up), last known. */
  nx: 0,
  ny: 0,
  /** True once the pointer has moved over the page at least once. */
  seen: false,
  /** Seconds since the last drag movement (for idle auto-rotation etc.). */
  idle: 999,
}

let lastX = 0
let lastY = 0
let inited = false

const isUI = (t: EventTarget | null) => {
  const el = t as Element | null
  if (!el || !el.closest) return false
  return !!el.closest('[data-ui], a, button, input, select, textarea, label, summary, [role="slider"], [role="button"]')
}

/** Call from an R3F onPointerDown to take this pointer away from camera orbiting. */
export function claimPointer() {
  explore.claimed = true
  explore.dragging = false
}

export function initExplore() {
  if (inited) return
  inited = true
  window.addEventListener(
    'pointerdown',
    (e) => {
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
      explore.nx = (e.clientX / window.innerWidth) * 2 - 1
      explore.ny = -((e.clientY / window.innerHeight) * 2 - 1)
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
    if (e.pointerId === explore.pointerId || explore.claimed) {
      explore.dragging = false
      explore.claimed = false
      explore.pointerId = -1
    }
  }
  window.addEventListener('pointerup', end, { passive: true })
  window.addEventListener('pointercancel', end, { passive: true })
  window.addEventListener('blur', () => {
    explore.dragging = false
    explore.claimed = false
  })
}

/** Called once per frame after scenes ran: drops unconsumed drag deltas. */
export function tickExplore() {
  explore.dx = 0
  explore.dy = 0
  explore.idle += 1 / 60
}

/** Set the page cursor while hovering interactive 3D things ('' resets). */
export function setStageCursor(cursor: '' | 'grab' | 'grabbing' | 'pointer' | 'crosshair' | 'ew-resize' | 'ns-resize') {
  document.documentElement.style.cursor = cursor
}
