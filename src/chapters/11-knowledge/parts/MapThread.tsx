import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GlowPoint, useChapterFrame, COLORS, type GlowPointApi } from '@/gl'
import { hum } from '@/core/audio'
import { clamp, lerp, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { visAt } from '../model'
import { createRibbon, FRAY_N, FRAY_START, THREAD_N } from '../gl/thread'
import { THREAD, type Stage } from '../director'
import type { LabelLayer } from '../gl/labels'

/*
 * The Thread strung through the map — the chapter's only warm light (ANALOGY: a picture of
 * "string theory's results", not a physical object). Grows along its spline with a brighter tip,
 * ripples slowly (0.02·sin(12σ − 1.4t)), frays into three strands over its last 15%, and obeys
 * the evidence ceiling per vertex with no ghost floor. As the ceiling passes ◑, its last warm
 * segment near T0 shrinks to a glint and goes out; any ambient hum falls silent with it.
 */

const FRAY_SPREAD = 0.2 // tip offset of the outer strands (pack: 0.04; widened so the fray reads at map scale)

export function MapThread({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const R = useMemo(() => createRibbon(), [])
  useLayoutEffect(
    () => () => {
      R.geometry.dispose()
      R.material.dispose()
    },
    [R],
  )
  const mesh = useRef<THREE.Mesh>(null!)
  const tip = useRef<GlowPointApi>(null)
  const glint = useRef<GlowPointApi>(null)
  const warm = useMemo(() => new THREE.Color(COLORS.filament), [])
  const warmCore = useMemo(() => new THREE.Color('#FFE9CC'), [])
  const ink = useMemo(() => new THREE.Color(COLORS.ink), [])
  const st = useMemo(() => ({ stopHum: null as null | (() => void), humOn: false }), [])
  useLayoutEffect(() => () => st.stopHum?.(), [st])

  useChapterFrame(
    (f) => {
      const t = f.t
      const amb = ambient()
      const P = THREAD.pts
      const Nn = THREAD.nrm
      const Bn = THREAD.bin
      const main = R.strips[0].pts
      const fa = R.strips[1].pts
      const fb = R.strips[2].pts
      for (let i = 0; i < THREAD_N; i++) {
        const s = i / (THREAD_N - 1)
        const r = 0.02 * Math.sin(12 * s - 1.4 * t) * amb
        main[i * 3] = P[i * 3] + Nn[i * 3] * r
        main[i * 3 + 1] = P[i * 3 + 1] + Nn[i * 3 + 1] * r
        main[i * 3 + 2] = P[i * 3 + 2] + Nn[i * 3 + 2] * r
      }
      // fray strands: offset along the normal / binormal by spread·s², s ∈ [0,1] over the frayed part
      for (let j = 0; j < FRAY_N; j++) {
        const u = FRAY_START + ((1 - FRAY_START) * j) / (FRAY_N - 1)
        const fi = u * (THREAD_N - 1)
        const i = Math.min(THREAD_N - 2, Math.floor(fi))
        const w = fi - i
        const s = (u - FRAY_START) / (1 - FRAY_START)
        const off = FRAY_SPREAD * s * s
        const wob = 0.012 * Math.sin(9 * s - 2.1 * t) * amb * s
        for (let k = 0; k < 3; k++) {
          const base = lerp(main[i * 3 + k], main[(i + 1) * 3 + k], w)
          fa[j * 3 + k] = base - Nn[i * 3 + k] * (off + wob) + Bn[i * 3 + k] * off * 0.3
          fb[j * 3 + k] = base + Bn[i * 3 + k] * (off - wob) + Nn[i * 3 + k] * off * 0.35
        }
      }
      R.upload()

      const u = R.material.uniforms
      const ceil = S.ceilOn > 0.001
      u.uCeilY.value = ceil ? S.yc : 1e3
      u.uGrowth.value = S.growth
      u.uTime.value = t
      // E1: as the map shrinks below resolution the Thread cools to ink (unresolved things glow ink-white)
      const cool = smoothstep(0.45, 0.8, S.mapK)
      u.uGlow.value.copy(warm).lerp(ink, cool)
      u.uCore.value.copy(warmCore).lerp(ink, cool * 0.7)
      u.uOpacity.value = S.threadDim * S.mapVis
      ;(R.material as unknown as { minPx: number }).minPx = lerp(3.4, 0.6, smoothstep(0.3, 0.8, S.mapK))
      mesh.current.visible = S.growth > 0.001 && S.mapVis > 0.001 && S.threadDim > 0.001

      // growing tip bead
      const gi = Math.min(THREAD_N - 1, Math.round(S.growth * (THREAD_N - 1)))
      if (tip.current) {
        tip.current.position.set(main[gi * 3], main[gi * 3 + 1], main[gi * 3 + 2])
        const ya = ceil ? visAt(S.yc, main[gi * 3 + 1]) : 1
        const on = S.growing * ya * S.threadDim * (S.growth < FRAY_START ? 1 : 0.4)
        tip.current.material.uniforms.uIntensity.value = 0.9 * on
        tip.current.visible = on > 0.01
      }
      // the last glint: at the lowest still-lit vertex as the ceiling crosses T0's height
      if (glint.current) {
        const y0 = P[1]
        const a0 = ceil ? visAt(S.yc, y0) : 1
        const k = ceil && S.growth > 0.1 ? a0 * (1 - a0) * 4 : 0 // peaks mid-fade, 0 when fully lit or dark
        glint.current.position.set(P[0], P[1], P[2])
        glint.current.material.uniforms.uIntensity.value = 1.4 * k * S.mapVis
        glint.current.visible = k > 0.01
      }

      // audio (silent while sound is off): a faint hum while warm light is on screen under the ceiling —
      // in B6 it falls silent the instant the Thread goes out, and nothing replaces it; in the lab it
      // returns whenever the ceiling admits the Thread again
      const lit = ceil ? clamp(visAt(S.yc, P[1])) : 0
      const inDemand = S.sp.demand > 0.05 && S.sp.demand < 0.86
      const inLab = S.sp.lab > 0.1 && S.sp.lab < 0.95
      const wantHum = f.h.active() && (inDemand || inLab) && lit > 0.5
      if (wantHum !== st.humOn) {
        st.humOn = wantHum
        if (wantHum) st.stopHum = hum(110, 0.035)
        else {
          st.stopHum?.()
          st.stopHum = null
        }
      }
    },
    { priority: -1.5 },
  )

  // after the camera has settled: the lit Thread is an obstacle for labels (no text across it)
  const ov = useMemo(() => new THREE.Vector3(), [])
  useChapterFrame(
    (f) => {
      if (!layer || S.threadDim < 0.5 || S.mapK > 0.05 || S.growth < 0.01) return
      const M = mesh.current.parent!.matrixWorld
      const P = THREAD.pts
      const ceil = S.ceilOn > 0.001
      const last = Math.min(THREAD_N - 1, Math.floor(S.growth * (THREAD_N - 1)))
      for (let i = 1; i <= last; i += 3) {
        if (ceil && visAt(S.yc, P[i * 3 + 1]) < 0.5) continue
        ov.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).applyMatrix4(M).project(f.state.camera)
        if (ov.z > 1) continue
        layer.addObstacle((ov.x * 0.5 + 0.5) * S.W, (0.5 - ov.y * 0.5) * S.H, 4)
      }
    },
    { priority: -0.9 },
  )

  return (
    <>
      <mesh ref={mesh} geometry={R.geometry} material={R.material} frustumCulled={false} renderOrder={4} />
      <GlowPoint ref={tip} size={0.16} minPixels={3} intensity={0} color={COLORS.filament} coreColor={COLORS.filamentCore} visible={false} renderOrder={5} />
      <GlowPoint ref={glint} size={0.3} minPixels={4} intensity={0} color={COLORS.filament} coreColor="#FFFFFF" visible={false} renderOrder={5} />
    </>
  )
}
