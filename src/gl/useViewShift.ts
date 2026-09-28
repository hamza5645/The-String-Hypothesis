import { useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useChapterFrame, type FrameInfo } from './useChapterFrame'

/**
 * Slide the rendered image across the screen without moving the camera (an off-axis
 * frustum via camera.setViewOffset). Use it to compose the subject beside the text column:
 *
 *   useViewShift((f) => [0.18 * (1 - f.h.step('reveal')), 0])   // subject 18% right, easing back to center
 *
 * Values are fractions of the viewport (x → right, y → up). Raycasting stays correct.
 * Handoff frames (progress 0 and 1) should return [0, 0] so neighbours line up.
 */
export function useViewShift(fn: (f: FrameInfo) => [number, number]) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const ref = useRef(fn)
  ref.current = fn
  const last = useRef({ x: NaN, y: NaN, w: 0, h: 0 })
  useChapterFrame((f) => {
    const [sx, sy] = ref.current(f)
    const w = size.width
    const h = size.height
    const L = last.current
    if (Math.abs(sx - L.x) < 1e-5 && Math.abs(sy - L.y) < 1e-5 && L.w === w && L.h === h) return
    L.x = sx
    L.y = sy
    L.w = w
    L.h = h
    if (Math.abs(sx) < 1e-5 && Math.abs(sy) < 1e-5) camera.clearViewOffset()
    else camera.setViewOffset(w, h, -sx * w, sy * h, w, h)
  })
}
