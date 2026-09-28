import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { ChapterHandle } from '../core/chapter'
import { explore } from '../core/explore'
import { clamp, damp } from '../core/math'
import { ambient } from '../core/time'
import { useChapterFrame, type FrameInfo } from './useChapterFrame'

export interface OrbitPose {
  /** Rotation around the target's vertical axis (radians). 0 = camera on +Z looking at target. */
  azimuth: number
  /** Angle from the +Y axis (radians). PI/2 = level with the target. */
  polar: number
  distance: number
  target?: [number, number, number]
  fov?: number
}

/**
 * OrbitRig — drives this chapter's camera on a sphere around a target.
 *
 * `pose` is the choreographed (usually scroll-driven) base pose: a constant or a per-frame
 * function. When `interactive` is true (e.g. while the Lab step is on screen), drags on empty
 * stage rotate the camera away from the base pose, with inertia; when it turns false the
 * user's offset relaxes back so the narrative camera takes over again smoothly.
 * Touch: horizontal drags rotate (vertical swipes keep scrolling the page).
 */
export function OrbitRig({
  pose,
  interactive = false,
  sensitivity = 0.0055,
  polarLimits = [0.12, Math.PI - 0.12],
  azimuthLimits,
  relax = 2.2,
  autoRotate = 0,
  smoothing = 0,
}: {
  pose: OrbitPose | ((f: FrameInfo) => OrbitPose)
  interactive?: boolean | ((h: ChapterHandle) => boolean)
  sensitivity?: number
  polarLimits?: [number, number]
  azimuthLimits?: [number, number]
  /** How fast (1/s) the user's offset returns to the base pose when not interactive. */
  relax?: number
  /** Idle auto-rotation speed (rad/s) while interactive and not being dragged. */
  autoRotate?: number
  /** >0 smooths the base pose over time (1/s); 0 = follow exactly. */
  smoothing?: number
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const st = useRef({ az: 0, pol: 0, vaz: 0, vpol: 0, init: false, baz: 0, bpol: 0, bdist: 0, bx: 0, by: 0, bz: 0 })
  const target = useMemo(() => new THREE.Vector3(), [])
  const poseRef = useRef(pose)
  poseRef.current = pose
  const interRef = useRef(interactive)
  interRef.current = interactive

  useChapterFrame((f) => {
    const s = st.current
    const p = typeof poseRef.current === 'function' ? poseRef.current(f) : poseRef.current
    const it = interRef.current
    const on = (typeof it === 'function' ? it(f.h) : it) && f.h.active()
    const frozen = f.dt === 0 // screenshot harness freezes the clock: snap, don't integrate
    const dt = Math.max(f.dt, 1e-4)
    const tx = p.target?.[0] ?? 0
    const ty = p.target?.[1] ?? 0
    const tz = p.target?.[2] ?? 0

    if (!s.init || smoothing <= 0 || frozen) {
      s.baz = p.azimuth
      s.bpol = p.polar
      s.bdist = p.distance
      s.bx = tx
      s.by = ty
      s.bz = tz
      s.init = true
    } else {
      s.baz = damp(s.baz, p.azimuth, smoothing, dt)
      s.bpol = damp(s.bpol, p.polar, smoothing, dt)
      s.bdist = damp(s.bdist, p.distance, smoothing, dt)
      s.bx = damp(s.bx, tx, smoothing, dt)
      s.by = damp(s.by, ty, smoothing, dt)
      s.bz = damp(s.bz, tz, smoothing, dt)
    }

    if (frozen) {
      // keep the user's offset as-is; no inertia/relax integration without time
    } else if (on) {
      if (explore.dragging && (explore.dx !== 0 || explore.dy !== 0)) {
        const daz = -explore.dx * sensitivity
        const dpol = -explore.dy * sensitivity
        s.az += daz
        s.pol += dpol
        s.vaz = daz / dt
        s.vpol = dpol / dt
      } else if (!explore.dragging) {
        s.az += s.vaz * dt
        s.pol += s.vpol * dt
        const k = Math.exp(-3.5 * dt)
        s.vaz *= k
        s.vpol *= k
        if (autoRotate && explore.idle > 2.5) s.az += autoRotate * dt * ambient()
      }
    } else {
      s.az = Math.atan2(Math.sin(s.az), Math.cos(s.az)) // unwind whole turns: take the short way back
      s.az = damp(s.az, 0, relax, dt)
      s.pol = damp(s.pol, 0, relax, dt)
      s.vaz = s.vpol = 0
    }

    let az = s.baz + s.az
    if (azimuthLimits) {
      const c = clamp(az, azimuthLimits[0], azimuthLimits[1])
      s.az += c - az
      az = c
    }
    let pol = s.bpol + s.pol
    const pc = clamp(pol, polarLimits[0], polarLimits[1])
    s.pol += pc - pol
    pol = pc

    target.set(s.bx, s.by, s.bz)
    const r = s.bdist
    camera.position.set(
      target.x + r * Math.sin(pol) * Math.sin(az),
      target.y + r * Math.cos(pol),
      target.z + r * Math.sin(pol) * Math.cos(az),
    )
    camera.lookAt(target)
    if (p.fov && Math.abs(camera.fov - p.fov) > 1e-3) {
      camera.fov = p.fov
      camera.updateProjectionMatrix()
    }
  })
  return null
}
