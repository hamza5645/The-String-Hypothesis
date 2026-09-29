/*
 * The opening pull-back, drawn with the capsule rule (content pack § Global stage conventions):
 * resolution blur δ = L/50; warmth r = smoothstep(1, 3, ℓ/δ). The camera "dollies back" by scaling the
 * H2 loop down about the origin (s: −34.11 → −31.5); warm light drains as the loop becomes unresolved,
 * and it rounds into the Ink H0 glow. The same H0 point then travels with the story.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Filament, GlowPoint, COLORS, loopFn, useChapterFrame, useHandoffFit, type FilamentApi, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { lerp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import { wx, wy } from '../layout'
import { S0_H2, SI, local, openS } from '../timeline'

export function OpeningGL({ S }: { S: StageState }) {
  const fit = useHandoffFit()
  const fn = useMemo(() => loopFn(HANDOFF.H2.wobble, HANDOFF.H2.radius * fit), [fit])
  const group = useRef<THREE.Group>(null!)
  const loop = useRef<FilamentApi>(null)
  const point = useRef<GlowPointApi>(null)
  const c = useMemo(
    () => ({
      warm: new THREE.Color(COLORS.filament),
      warmCore: new THREE.Color(COLORS.filamentCore),
      ink: new THREE.Color(COLORS.ink),
    }),
    [],
  )

  useChapterFrame(() => {
    const reduced = prefersReducedMotion()
    const T = S.T
    const L = S.L
    const g = group.current
    const inOpen = T < SI.decades
    g.visible = inOpen
    let glow = 0
    if (inOpen) {
      const po = local(T, 'open')
      // reduced motion: no pull-back, the loop cross-fades into the point
      const s = reduced ? S0_H2 : openS(po)
      const k = Math.pow(10, S0_H2 - s)
      g.scale.setScalar(k)
      const R = HANDOFF.H2.radius * fit * k
      const delta = L.hvis / 50
      const lr = (2 * Math.PI * R) / delta // ℓ/δ
      const warmth = smoothstep(1, 3, lr)
      const m = loop.current?.material
      if (m) {
        const onScreenW = lerp(HANDOFF.H2.width, 2.2 * delta, 1 - smoothstep(2, 8, lr))
        m.uniforms.uWidth.value = onScreenW / k
        m.uniforms.uGlow.value.copy(c.ink).lerp(c.warm, warmth)
        m.uniforms.uCore.value.copy(c.ink).lerp(c.warmCore, warmth)
        m.uniforms.uOpacity.value = reduced ? 1 - smoothstep(0.3, 0.6, po) : smoothstep(0.5, 2.0, lr)
      }
      glow = T < SI.open ? 0 : reduced ? smoothstep(0.3, 0.6, po) : 1 - smoothstep(0.6, 2.2, lr)
    }
    const p = point.current
    if (p) {
      const hi = inOpen ? glow : S.h0i
      p.visible = hi > 0.001
      p.position.set(wx(L, S.h0x), wy(L, S.h0y), 0)
      p.scale.setScalar(S.h0s)
      p.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * hi
    }
  })

  return (
    <>
      <group ref={group}>
        <Filament ref={loop} count={HANDOFF.H2.count} width={HANDOFF.H2.width} closed fn={fn} />
      </group>
      <GlowPoint ref={point} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
    </>
  )
}
