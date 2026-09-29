import { createSlicer, pantsField, type SliceResult } from './model'

/*
 * The analytic slice of the pants by the current "now", shared by the Scene (the glowing loops) and the
 * lab's inset: whichever asks first runs marching squares, the other reuses the result. Keyed on the plane
 * t = t₀ + a·x + b·y itself, so φ and φ + 360°, or a value that went through the director's blend, hit the
 * same entry. Pure (no three.js): the Overlay imports it too. The result object is reused; read it at once.
 */
let slicer: ReturnType<typeof createSlicer> | null = null
const key = { t0: NaN, a: NaN, b: NaN }
const EPS = 1e-9

export function sliceNow(t0: number, theta: number, phi: number): SliceResult {
  const k = Math.tan(theta)
  const a = k * Math.cos(phi)
  const b = k * Math.sin(phi)
  if (slicer && Math.abs(t0 - key.t0) < EPS && Math.abs(a - key.a) < EPS && Math.abs(b - key.b) < EPS) return slicer.result
  slicer ??= createSlicer()
  key.t0 = t0
  key.a = a
  key.b = b
  return slicer.slice(pantsField, t0, theta, phi)
}
