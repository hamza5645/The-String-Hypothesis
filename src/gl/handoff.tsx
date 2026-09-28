import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { HANDOFF, handoffFit } from '../core/handoff'
import { TAU } from '../core/math'
import { Filament, type FilamentFn, type FilamentProps } from './Filament'
import { GlowPoint, type GlowPointProps } from './GlowPoint'
import { COLORS } from './palette'

/**
 * The canonical handoff objects. A chapter that starts or ends on one of these renders it
 * with no transform at the origin (camera at HANDOFF.camera). Both chapters animate from
 * the shared stage clock, so during the dissolve the two copies coincide exactly.
 */

/**
 * H0 — a point particle. Ink-white, not warm: site rule — warm filament light is shown only
 * when a string is *resolved*; an unresolved thing (a point) glows ink-white.
 */
export function HandoffPoint(props: GlowPointProps) {
  return (
    <GlowPoint
      size={HANDOFF.H0.size}
      minPixels={HANDOFF.H0.minPixels}
      intensity={HANDOFF.H0.intensity}
      color={COLORS.ink}
      coreColor="#FFFFFF"
      {...props}
    />
  )
}

/**
 * H1 — an open string with FREE ends (Neumann boundary conditions: a free open string's
 * endpoints are not pinned). Shape = a blend of its two lowest standing waves, cos(πσ) and cos(2πσ).
 * `amp` scales the vibration (0 = a straight segment, e.g. mid-reveal).
 */
export function openStringFn(amp: number = HANDOFF.H1.amplitude, length: number = HANDOFF.H1.length, omega: number = HANDOFF.H1.omega): FilamentFn {
  return (u, t, out) => {
    const s = Math.PI * u
    const a1 = Math.cos(s) * Math.cos(omega * t)
    const a2 = Math.cos(2 * s) * Math.cos(2 * omega * t + 0.6)
    out.set((u - 0.5) * length, amp * (0.8 * a1 + 0.45 * a2), amp * 0.35 * Math.cos(s) * Math.sin(omega * t))
  }
}

/** handoffFit() for the current viewport — scale H1 length / H2 radius by this when you morph them yourself. */
export function useHandoffFit() {
  const size = useThree((s) => s.size)
  return handoffFit(size.width / Math.max(1, size.height))
}

export function HandoffOpenString({ amp, ...props }: Partial<FilamentProps> & { amp?: number }) {
  const fit = useHandoffFit()
  return (
    <Filament
      count={HANDOFF.H1.count}
      width={HANDOFF.H1.width}
      fn={openStringFn((amp ?? HANDOFF.H1.amplitude) * fit, HANDOFF.H1.length * fit)}
      beads
      {...props}
    />
  )
}

/** H2 — a closed loop, radius R, wobbling in its n=2 and n=3 shape modes. */
export function loopFn(wobble: number = HANDOFF.H2.wobble, radius: number = HANDOFF.H2.radius, omega: number = HANDOFF.H2.omega): FilamentFn {
  return (u, t, out) => {
    const th = u * TAU
    const w = wobble * (0.6 * Math.cos(2 * th) * Math.cos(omega * t) + 0.4 * Math.cos(3 * th + 0.7) * Math.cos(1.37 * omega * t + 1.1))
    const r = radius * (1 + w)
    out.set(r * Math.cos(th), r * Math.sin(th), radius * wobble * 0.5 * Math.sin(2 * th) * Math.sin(omega * t))
  }
}

export function HandoffLoop({ wobble, ...props }: Partial<FilamentProps> & { wobble?: number }) {
  const fit = useHandoffFit()
  return <Filament count={HANDOFF.H2.count} width={HANDOFF.H2.width} closed fn={loopFn(wobble ?? HANDOFF.H2.wobble, HANDOFF.H2.radius * fit)} {...props} />
}

/** Reusable scratch objects for scenes that want them (never share across simultaneous uses). */
export const scratch = { v: new THREE.Vector3(), v2: new THREE.Vector3(), c: new THREE.Color() }
