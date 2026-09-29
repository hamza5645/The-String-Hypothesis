/*
 * The machine map in light: the ring (Field hairline + cool glow — never warm), the proton bunch,
 * linear arms (Lab), the star field, the galaxy, the magnifier (where — and only where — the target
 * resolves into a tiny warm Thread), and Beat 5's synchrotron sparks.
 * All geometry is recomputed from float64 ratios each frame; the GPU only sees on-screen coordinates.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Filament, GlowPoint, GlowPoints, COLORS, openStringFn, useChapterFrame, type FilamentApi, type GlowPointApi, type GlowPointsApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { ambient } from '@/core/time'
import { clamp01, smoothstep } from '@/core/math'
import { GAL_X, GAL_Y, mapX, mapY, type StageState } from '../choreo'
import { wx, wy } from '../layout'
import { LY } from '../model'
import { B4, SI, local } from '../timeline'
import type { CloudSet } from './cloudSet'

const RING_N = 512
const ARC_N = 256
const RING_CORE = '#AFC6EA'

/** The star fields and the galaxy draw once their clouds have arrived from the worker (cloudSet.ts). */
export function MapGL({ S, clouds }: { S: StageState; clouds: CloudSet | null }) {
  const ringPts = useMemo(() => new Float32Array(RING_N * 3), [])
  const arcPts = useMemo(() => new Float32Array(ARC_N * 3), [])
  const armPts = useMemo(() => new Float32Array(32 * 3), [])
  const ring = useRef<FilamentApi>(null)
  const arc = useRef<FilamentApi>(null)
  const arms = useRef<FilamentApi>(null)
  const bead = useRef<GlowPointApi>(null)
  const nearG = useRef<THREE.Group>(null!)
  const farG = useRef<THREE.Group>(null!)
  const galG = useRef<THREE.Group>(null!)
  const nearP = useRef<GlowPointsApi>(null)
  const farP = useRef<GlowPointsApi>(null)
  const galP = useRef<GlowPointsApi>(null)
  const mag = useRef<THREE.Group>(null!)
  const magDisc = useRef<THREE.Mesh>(null!)
  const magGlow = useRef<GlowPointApi>(null)
  const magThread = useRef<FilamentApi>(null)
  const magThreadG = useRef<THREE.Group>(null!)
  const threadFn = useMemo(() => openStringFn(HANDOFF.H1.amplitude * 2.6, HANDOFF.H1.length), [])

  useChapterFrame((f) => {
    const L = S.L
    const M = S.map
    const T = S.T
    const u = L.u
    const on = M.on
    const k = L.H / M.Lm // px per metre
    const inB4 = T >= SI.bigger && T < SI.floor
    const inB5 = T >= SI.floor && T < SI.sideways
    const p4 = local(T, 'bigger')
    const p5 = local(T, 'floor')

    // ── the ring ──
    const D = M.m.D
    const R = (D / 2) * k
    const cxp = mapX(M, L, 0)
    const cyp = mapY(M, L, D / 2) // ring centre (px)
    const cernY = mapY(M, L, 0)
    const ringAlpha = on * M.ringOn * (M.lab ? (M.dim < 1 ? 0.45 : 1) : 1)
    const useArc = R > 6 * L.H
    const rApi = ring.current
    const aApi = arc.current
    if (rApi && aApi) {
      rApi.group.visible = ringAlpha > 0.003 && !useArc
      aApi.group.visible = ringAlpha > 0.003 && useArc
      const small = R < 14
      const wpx = small ? 2.4 : 6.5
      if (!useArc && rApi.group.visible) {
        for (let i = 0; i < RING_N; i++) {
          const th = (i / RING_N) * Math.PI * 2
          ringPts[i * 3] = wx(L, cxp + R * Math.sin(th))
          ringPts[i * 3 + 1] = wy(L, cyp + R * Math.cos(th))
          ringPts[i * 3 + 2] = 0
        }
        rApi.update()
        rApi.material.uniforms.uWidth.value = wpx * u
        rApi.material.uniforms.uOpacity.value = ringAlpha
      }
      if (useArc && aApi.group.visible) {
        // sample only the visible arc near the collision point: y = x² / (R + √(R² − x²))
        const x0 = inB5 ? Math.max(L.textR + 30, L.c0x - 120) - cxp : -1.2 * L.W
        const x1 = 1.2 * L.W
        for (let i = 0; i < ARC_N; i++) {
          const x = x0 + ((x1 - x0) * i) / (ARC_N - 1)
          const y = (x * x) / (R + Math.sqrt(Math.max(0, R * R - x * x)))
          arcPts[i * 3] = wx(L, cxp + x)
          arcPts[i * 3 + 1] = wy(L, cernY - y)
          arcPts[i * 3 + 2] = 0
        }
        aApi.update()
        aApi.material.uniforms.uWidth.value = wpx * u
        aApi.material.uniforms.uOpacity.value = ringAlpha * (inB5 ? 1 - smoothstep(0.3, 0.36, p5) : 1)
      }
    }
    // ── linear arms (Lab) ──
    const armA = arms.current
    if (armA) {
      const aa = on * M.armsOn
      armA.group.visible = aa > 0.003
      if (armA.group.visible) {
        const half = (M.m.C / 2) * k
        const cx0 = mapX(M, L, 0)
        for (let i = 0; i < 32; i++) {
          const t = i / 31
          armPts[i * 3] = wx(L, cx0 - half + 2 * half * t)
          armPts[i * 3 + 1] = wy(L, cernY)
          armPts[i * 3 + 2] = 0
        }
        armA.update()
        armA.material.uniforms.uOpacity.value = aa * (M.dim < 1 ? 0.45 : 1)
        armA.material.uniforms.uWidth.value = 6.5 * u
      }
    }

    // ── the proton bunch: a 3 s display lap (retimed; the real lap is printed) ──
    const b = bead.current
    if (b) {
      let ba = 0
      let bx = 0
      let by = 0
      if ((inB4 || M.lab) && !useArc && M.ringOn > 0.5) {
        const ph = ((f.t * ambient()) / 3) * Math.PI * 2 + (ambient() ? 0 : 0.9)
        bx = cxp + R * Math.sin(ph)
        by = cyp + R * Math.cos(ph)
        ba = on * (1 - M.honest) * (R > 10 ? 1 : 0) * (M.lab && M.dim < 1 ? 0.4 : 1)
      } else if (inB5) {
        // enters, radiates, fades within 15% of the screen width
        const q = smoothstep(0.14, 0.3, p5)
        bx = L.W * (L.mobile ? 0.12 : 0.5) + L.W * 0.15 * q
        by = cernY
        ba = smoothstep(0.13, 0.15, p5) * (1 - q)
      }
      b.visible = ba > 0.003
      b.position.set(wx(L, bx), wy(L, by), 0)
      b.material.uniforms.uIntensity.value = 1.4 * ba
    }

    // ── stars and the galaxy (per light-year scale) ──
    const lyPx = LY * k
    const logL = Math.log10(M.Lm)
    const nearA = on * smoothstep(15.6, 16.6, logL) * (1 - smoothstep(18.1, 18.6, logL)) * (1 - M.honest)
    const farA = on * smoothstep(18.1, 18.6, logL) * (1 - smoothstep(19.9, 20.4, logL))
    const galA = on * smoothstep(19.6, 20.3, logL)
    const place = (g: THREE.Group, p: GlowPointsApi | null, a: number, x: number, y: number, inten: number) => {
      g.visible = a > 0.003
      if (!g.visible || !p) return
      g.position.set(wx(L, mapX(M, L, x)), wy(L, mapY(M, L, y)), 0)
      g.scale.setScalar(lyPx * u)
      p.material.uniforms.uIntensity.value = inten * a
    }
    place(nearG.current, nearP.current, nearA * (M.lab && M.dim < 1 ? 0.5 : 1), 0, 0, 0.9)
    place(farG.current, farP.current, farA, 0, 0, 1.25)
    place(galG.current, galP.current, galA, GAL_X, GAL_Y, 0.72)

    // ── the magnifier: the target, and (only here) the Thread resolving ──
    const mg = mag.current
    const ma = inB4 ? on * (1 - M.honest) : 0
    mg.visible = ma > 0.003
    if (mg.visible) {
      mg.position.set(wx(L, L.gx), wy(L, L.gy), 0)
      const disc = magDisc.current.material as THREE.MeshBasicMaterial
      disc.opacity = 0.92 * ma
      magDisc.current.scale.setScalar((L.gR - 1) * u)
      const res = smoothstep(B4.grow1 + 0.03, B4.grow1 + 0.05, p4) * (1 - smoothstep(B4.land + 0.015, B4.honest - 0.005, p4))
      const gp = magGlow.current
      if (gp) gp.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * ma * (1 - 0.8 * res)
      const th = magThread.current
      const sm = ((L.gR * 1.5) / HANDOFF.H1.length) * u * (0.3 + 0.7 * clamp01(res * 1.2))
      magThreadG.current.scale.setScalar(sm)
      if (th) {
        th.group.visible = res > 0.003
        th.material.uniforms.uOpacity.value = res * ma
        // a resolved string: warm halo ~6 px wide on screen
        th.material.uniforms.uWidth.value = (6 * u) / sm
      }
    }
  })

  return (
    <>
      <group ref={farG} visible={false}>
        {clouds && (
          <GlowPoints ref={farP} positions={clouds.far.positions} sizes={clouds.far.sizes} alphas={clouds.far.alphas} color={COLORS.ink} intensity={0} minPixels={0.9} maxPixels={1.5} sharpness={0.5} />
        )}
      </group>
      <group ref={nearG} visible={false}>
        {clouds && (
          <GlowPoints ref={nearP} positions={clouds.near.positions} sizes={clouds.near.sizes} alphas={clouds.near.alphas} color={COLORS.ink} intensity={0} minPixels={0.8} maxPixels={1.7} sharpness={0.5} />
        )}
      </group>
      <group ref={galG} visible={false}>
        {clouds && (
          <GlowPoints ref={galP} positions={clouds.galaxy.positions} sizes={clouds.galaxy.sizes} alphas={clouds.galaxy.alphas} color={COLORS.ink} intensity={0} minPixels={0.7} maxPixels={1.35} sharpness={0.4} />
        )}
      </group>
      <Filament ref={ring} points={ringPts} count={RING_N} closed width={0.04} minPixels={0.75} color={COLORS.field} coreColor={RING_CORE} intensity={0.9} coreFraction={0.16} />
      <Filament ref={arc} points={arcPts} count={ARC_N} width={0.04} minPixels={0.75} color={COLORS.field} coreColor={RING_CORE} intensity={0.9} coreFraction={0.16} taper={0.08} />
      <Filament ref={arms} points={armPts} count={32} width={0.04} minPixels={0.75} color={COLORS.field} coreColor={RING_CORE} intensity={0.9} coreFraction={0.16} />
      <GlowPoint ref={bead} size={0.09} minPixels={2.2} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <group ref={mag} visible={false}>
        <mesh ref={magDisc} renderOrder={10}>
          <circleGeometry args={[1, 64]} />
          <meshBasicMaterial color={COLORS.void} transparent opacity={0.92} depthWrite={false} depthTest={false} />
        </mesh>
        <GlowPoint ref={magGlow} size={0.2} minPixels={2} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" renderOrder={11} />
        <group ref={magThreadG}>
          <Filament ref={magThread} count={120} fn={threadFn} width={HANDOFF.H1.width} minPixels={1.1} intensity={1.35} beads renderOrder={12} depthTest={false} />
        </group>
      </group>
    </>
  )
}
