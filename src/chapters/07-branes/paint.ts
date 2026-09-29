import * as THREE from 'three'
import { smoothstep } from '@/core/math'
import { fold, wobble } from './model'

/*
 * Beat 1: the brane is "painted in" by where the pinned ends have been.
 * The endpoints follow a smooth walk parametrized by τ (scroll-driven walk time). Instead of accumulating a
 * density buffer every frame, we precompute, for every texel of the 10 × 10 sheet, the FIRST τ at which an
 * end came within the brush radius. The shader shows a texel once uPaintTau ≥ τ_first — exact under
 * scrubbing in both directions, and free at runtime.
 */

export const PAINT_TAU = 30
export const WALK_RATE = 0.55

const SEEDS = [
  [1.3, 2.7, 8.2],
  [4.1, 5.9, 9.6],
]

/**
 * Endpoint k (0 = left, 1 = right) of the Opening/Beat-1 string at walk time τ.
 * Each end runs its own smooth walk (0.6 ℓ_s in the Opening); once the ends are pinned (τ > 0) the string's
 * centre also wanders, so each end covers ≈ 3 ℓ_s while the string keeps a readable length (≈ 1–3 ℓ_s).
 * The y-walk (returned in out.y) is damped by the caller.
 */
export function endXZ(k: number, tau: number, out: { x: number; y: number; z: number }) {
  const pin = smoothstep(0, 4, tau)
  const s = SEEDS[k]
  const w = WALK_RATE * tau
  // the centre's walk widens as the camera pulls back, biased toward the part of the sheet the camera frames
  // (beside the text column), so the string never leaves the picture
  const ac = 0.7 + 1.5 * smoothstep(3, 22, tau)
  // (the centre holds still while the callouts are up, τ ≲ 3)
  const roam = smoothstep(2.5, 8, tau)
  const cx = roam * fold(0.35 + ac * wobble(0.8 * w, 11.1), 3.0)
  const cz = roam * fold(-0.7 + ac * 0.9 * wobble(0.8 * w, 12.7), 3.0)
  const th = 0.9 * pin * wobble(0.45 * w, 13.9)
  const sg = k === 0 ? -1 : 1
  const ai = 0.6 - 0.15 * pin
  out.x = cx + sg * Math.cos(th) + ai * wobble(w, s[0])
  out.z = cz + sg * Math.sin(th) + ai * 0.95 * wobble(w, s[1])
  out.y = 0.6 * wobble(w, s[2])
  return out
}

let tex: THREE.DataTexture | null = null

export function paintTexture() {
  if (tex) return tex
  const N = 128
  const data = new Float32Array(N * N).fill(1)
  const r = 0.62
  const cell = 10 / N
  const rc = Math.ceil(r / cell)
  const p = { x: 0, y: 0, z: 0 }
  const steps = 3200
  for (let k = 0; k < 2; k++)
    for (let i = 0; i <= steps; i++) {
      const tau = (i / steps) * PAINT_TAU
      endXZ(k, tau, p)
      const v = tau / PAINT_TAU
      const cx = Math.floor((p.x + 5) / cell)
      // texture v runs with +z (uv = xz/10 + 0.5)
      const cz = Math.floor((p.z + 5) / cell)
      for (let dz = -rc; dz <= rc; dz++)
        for (let dx = -rc; dx <= rc; dx++) {
          const x = cx + dx
          const z = cz + dz
          if (x < 0 || z < 0 || x >= N || z >= N) continue
          const wx = (x + 0.5) * cell - 5 - p.x
          const wz = (z + 0.5) * cell - 5 - p.z
          const d = Math.hypot(wx, wz)
          if (d > r) continue
          // soft brush: the rim of the stroke fills in a little later than its centre
          const tv = Math.min(1, v + (d / r) ** 2 * 0.035)
          const j = z * N + x
          if (tv < data[j]) data[j] = tv
        }
    }
  const bytes = new Uint8Array(N * N)
  for (let j = 0; j < N * N; j++) bytes[j] = Math.round(data[j] * 255)
  tex = new THREE.DataTexture(bytes, N, N, THREE.RedFormat, THREE.UnsignedByteType)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}
