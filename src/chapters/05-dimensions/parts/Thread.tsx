import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, GlowPoint, HandoffLoop, useChapterFrame, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { lerp, smoothstep } from '@/core/math'
import { TI, T_END } from '../constants'
import { openingQ } from '../model'
import type { Timeline } from '../timeline'

/*
 * The Thread in this chapter (content pack: Opening, Beat 5, Exit).
 *  Opening  H2 (<HandoffLoop/>, default props) → over q = 0.8…1 the loop shrinks toward the origin
 *           (radius × 1→0) and cools filament → ink, handing over to an H0 point of light.
 *  Beat 5   the same loop at scale 0.3 drifts slowly through the lattice (what needs the room).
 *  Exit     it drifts to the centre and grows back to canonical H2: identity transform, default
 *           uniforms, at chapter progress 1 (camera at HANDOFF.camera, no view shift).
 */

/** Beat 5 drift path (world units, inside the ±3 lattice). */
export function driftPos(t: number, out: THREE.Vector3) {
  // the lower right of the lattice, clear of the balance above it and the notes below-left
  // (the camera looks from the +x/+z quadrant, so screen-right is roughly +x, −z)
  return out.set(1.3 + 0.6 * Math.sin(0.13 * t + 0.4), -0.75 + 0.35 * Math.sin(0.17 * t + 1.0), -0.8 + 0.5 * Math.cos(0.11 * t))
}

export function Thread({ tl }: { tl: Timeline }) {
  const wrap = useRef<THREE.Group>(null!)
  const point = useRef<GlowPointApi>(null)
  const mat = useRef<THREE.ShaderMaterial | null>(null)
  const warm = useMemo(() => new THREE.Color(COLORS.filament), [])
  const warmCore = useMemo(() => new THREE.Color(COLORS.filamentCore), [])
  const ink = useMemo(() => new THREE.Color(COLORS.ink), [])
  const tmp = useMemo(() => new THREE.Color(), [])
  const drift = useMemo(() => new THREE.Vector3(), [])

  // the canonical loop's material (so the collapse can cool its colour and hold its pixel width)
  useLayoutEffect(() => {
    wrap.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
      if (!mat.current && m && (m as THREE.ShaderMaterial).uniforms?.uGlow) mat.current = m
    })
  }, [])

  useChapterFrame(() => {
    const T = tl.T
    const g = wrap.current
    const m = mat.current
    let scale = 1
    let cool = 0
    let opacity = 1
    let width = 1 // multiplier on the canonical world width (compensating the group scale)
    let pointI = 0
    g.position.set(0, 0, 0)

    if (T < TI.sweep) {
      // Opening: collapse over q 0.8 → 1
      const q = openingQ(T)
      const k = smoothstep(0.8, 1.0, q)
      scale = Math.max(1 - k, 1e-4)
      // hold the on-screen thickness while shrinking (it is a blur-limited glow once unresolved)
      width = 1 / scale
      cool = smoothstep(0.45, 0.9, k)
      opacity = 1 - smoothstep(0.82, 0.97, k)
      pointI = smoothstep(0.55, 0.95, k)
    } else if (T >= TI.count && T < TI.bounds + 0.12) {
      // Beat 5: the small Thread drifting through the lattice
      const inK = smoothstep(TI.count + 0.04, TI.count + 0.2, T) * (1 - smoothstep(TI.bounds - 0.02, TI.bounds + 0.12, T))
      driftPos(tl.t * (tl.amb || 0.0001), drift)
      // phones: the notes and annotations fill the lower-left, so the Thread keeps to the right, a little higher
      if (tl.portrait) drift.set(drift.x + 0.9, drift.y + 0.9, drift.z - 0.6)
      g.position.copy(drift)
      scale = 0.3
      width = 0.62 / 0.3
      opacity = inK
    } else if (T >= TI.exit - 0.05) {
      // Exit: drift in, grow to canonical H2 exactly at progress 1
      const e = smoothstep(TI.exit - 0.05, T_END - 0.06, T)
      const inK = smoothstep(TI.exit - 0.05, TI.exit + 0.15, T)
      driftPos(tl.t * (tl.amb || 0.0001), drift)
      const k = e * e * (3 - 2 * e)
      g.position.copy(drift).multiplyScalar(1 - k)
      scale = lerp(0.3, 1, k)
      width = lerp(0.62 / 0.3, 1, k)
      opacity = inK
      if (T >= T_END - 0.06) {
        g.position.set(0, 0, 0)
        scale = 1
        width = 1
        opacity = 1
      }
    } else {
      opacity = 0
    }

    g.scale.setScalar(scale)
    g.visible = opacity > 0.002
    if (m) {
      m.uniforms.uWidth.value = HANDOFF.H2.width * width
      tmp.copy(warm).lerp(ink, cool)
      m.uniforms.uGlow.value.copy(tmp)
      tmp.copy(warmCore).lerp(ink, cool * 0.6)
      m.uniforms.uCore.value.copy(tmp)
      m.uniforms.uOpacity.value = opacity
    }
    const p = point.current
    if (p) {
      p.visible = pointI > 0.002
      p.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * pointI
    }
  })

  return (
    <>
      <group ref={wrap}>
        <HandoffLoop />
      </group>
      <GlowPoint ref={point} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
    </>
  )
}
