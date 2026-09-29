import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Filament, GlowPoint, GlowPoints, useChapterFrame, COLORS, type FilamentApi, type FilamentFn, type GlowPointApi } from '@/gl'
import { clamp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import { Status } from '@/ui'
import { RIG_VIEW, S, THREAD_L, rigD, type Frame, type RigKind } from './director'
import { DynLabel, SafeLabel } from './labels'
import { createLadderMaterial, createPanelMaterial, createRingPointsMaterial, createTubeMaterial } from './materials'
import { L11, R11, T_F1, T_pq, e8Projection, fmtG, fmtT, ratio11, tubeRadius, wallSep } from './model'
import { Ribbon, type RibbonApi } from './Ribbon'

/* ───────────────────────── Shared ───────────────────────── */

function useRigGroup(frame: () => Frame, vis: () => number) {
  const ref = useRef<THREE.Group>(null)
  useChapterFrame(() => {
    const g = ref.current
    if (!g) return
    const v = vis()
    g.visible = v > 0.003
    if (!g.visible) return
    const f = frame()
    g.position.set(f.x, f.y, f.z)
    g.rotation.set(0, f.yaw, 0)
    g.scale.setScalar(f.s)
  })
  return ref
}

/** Horizontal screen anchor (0..1 of the width) → rig-local x, for portrait phones. */
function screenX(frac: number, dRel: number, fovDeg: number, aspect: number, shiftX: number) {
  const halfW = dRel * Math.tan(((fovDeg * Math.PI) / 180) / 2) * aspect
  return (2 * (frac - shiftX) - 1) * halfW
}

/**
 * Portrait phones: rig-local x of a gauge axis placed just far enough in that its tick labels (right-aligned,
 * 0.3 units + 10 px left of the axis, "0.1" ≈ 22 px wide) keep the 16 px page gutter.
 */
function portraitGaugeX(kind: RigKind, width: number, height: number) {
  const d = rigD(kind)
  const pxPerUnit = height / (2 * d * Math.tan((17.5 * Math.PI) / 180))
  return screenX((48 + 0.3 * pxPerUnit) / width, d, 35, S.aspect, S.shift[0])
}

const gy = (g: number) => -2.2 + (4.4 * (Math.log10(g) + 1.301)) / 2.602
const GAUGE_TICKS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]

/** The coupling gauge: a vertical log axis, g = 0.05 … 20, with a marker. */
function Gauge({ g, vis, x, sub }: { g: () => number; vis: () => number; x: () => number; sub?: { prefix: ReactNode; text: () => string } }) {
  const group = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Group>(null)
  const axis = useRef<RibbonApi>(null)
  const tick = useRef<RibbonApi>(null)
  const dot = useRef<GlowPointApi>(null)
  const ticks = useMemo(() => {
    const pos = new Float32Array(GAUGE_TICKS.length * 6)
    GAUGE_TICKS.forEach((v, i) => {
      const major = v === 0.1 || v === 1 || v === 10
      pos.set([0, gy(v), 0, major ? -0.24 : -0.12, gy(v), 0], i * 6)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: COLORS.ink2, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    ls.renderOrder = 8
    return ls
  }, [])
  useChapterFrame(() => {
    const v = vis()
    if (!group.current) return
    group.current.visible = v > 0.003
    group.current.position.x = x()
    if (marker.current) marker.current.position.y = gy(clamp(g(), 0.05, 20))
    if (axis.current) axis.current.material.uniforms.uOpacity.value = v * 0.55
    if (tick.current) tick.current.material.uniforms.uOpacity.value = v
    ;(ticks.material as THREE.LineBasicMaterial).opacity = v * 0.8
    if (dot.current) dot.current.material.uniforms.uIntensity.value = v * 1.1
  })
  return (
    <group ref={group}>
      <Ribbon
        ref={axis}
        count={2}
        width={0.02}
        minPx={0.6}
        color={COLORS.ink2}
        renderOrder={8}
        depthTest={false}
        init={(i, P) => P.set([0, i === 0 ? -2.2 : 2.2, 0], i * 3)}
      />
      <primitive object={ticks} />
      {[0.1, 1, 10].map((v) => (
        <SafeLabel key={v} position={[-0.3, gy(v), 0]} align="right" tone="dim" opacity={vis}>
          <span className="mth-mini">{v}</span>
        </SafeLabel>
      ))}
      <DynLabel
        position={[-0.12, sub ? 2.98 : 2.52, 0]}
        align="left"
        tone="ink"
        className="mth-mini mth-gauge-title"
        opacity={vis}
        prefix={<span className="mth-hide-m">COUPLING </span>}
        text={() => `g = ${fmtG(g())}`}
      />
      {sub && <DynLabel position={[-0.12, 2.74, 0]} align="left" tone="field" className="mth-mini" opacity={vis} prefix={sub.prefix} text={sub.text} />}
      <group ref={marker}>
        <Ribbon ref={tick} count={2} width={0.03} minPx={0.8} color={COLORS.ink} renderOrder={9} depthTest={false} init={(i, P) => P.set([i === 0 ? -0.26 : 0.26, 0, 0], i * 3)} />
        <GlowPoint ref={dot} size={0.16} minPixels={2.2} color={COLORS.ink} coreColor="#ffffff" intensity={1} renderOrder={9} />
      </group>
    </group>
  )
}

/* ───────────────────────── IIA: the coupling was a size ───────────────────────── */

const NT = 200
const ARX = -0.6 // where the "around" arrow circles the tube (its label rides above the arrow)
const ARROW_TILT = 0.5
const R_BAR_MAX = 2.6 // the R₁₁ bar's drawn length is clamped here; an overflow arrow carries the value

function ThreadRig() {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const T = S.thread
  const group = useRigGroup(
    () => T.frame,
    () => T.vis,
  )
  const thread = useRef<FilamentApi>(null)
  const tubeMesh = useRef<THREE.Mesh>(null)
  const tubeMat = useMemo(() => createTubeMaterial(), [])
  const ladderMat = useMemo(() => createLadderMaterial(), [])
  const ringMat = useMemo(() => createRingPointsMaterial(), [])
  const barR = useMemo(() => createPanelMaterial(COLORS.field, 0.3, 0.8), [])
  const barL = useMemo(() => createPanelMaterial(COLORS.field, 0.04, 0.7, 9), [])
  const barRMesh = useRef<THREE.Mesh>(null)
  const barLMesh = useRef<THREE.Mesh>(null)
  const extras = useRef<THREE.Group>(null)
  const ladder = useRef<THREE.Mesh>(null)
  const arrow = useRef<RibbonApi>(null)
  const arrowHead = useRef<RibbonApi>(null)
  const lattice = useRef<THREE.Points>(null)
  const latticeLines = useRef<THREE.LineSegments>(null)

  const fn = useMemo<FilamentFn>(
    () => (u, t, out) => {
      const c = T.curl
      const L = THREAD_L
      const s = (u - 0.5) * L
      const R = L / (2 * Math.PI)
      const k = (2 * Math.PI * c) / L
      let x: number, y: number
      if (k < 1e-4) {
        x = s
        y = 0
      } else {
        x = Math.sin(k * s) / k
        y = (1 - Math.cos(k * s)) / k - R * c
      }
      const tt = prefersReducedMotion() ? 0 : t
      const w = (1 - c) * 0.045 * Math.sin(Math.PI * 3 * u) * Math.cos(2.1 * tt) * (1 - smoothstep(0.8, 1.3, ratio11(T.g)))
      out.set(x, y + w, 0.02 * (1 - c) * Math.cos(Math.PI * 2 * u) * Math.sin(2.1 * tt))
    },
    [T],
  )

  const lat = useMemo(() => {
    const pos: number[] = []
    const lines: number[] = []
    for (let k = 0; k < 3; k++)
      for (let j = 0; j < 7; j++)
        for (let i = 0; i < 7; i++) {
          const x = (i - 3) * 1.2
          const y = (j - 3) * 1.2
          const z = -1.2 - k * 1.2
          pos.push(x, y, z)
          if (i < 6) lines.push(x, y, z, x + 1.2, y, z)
          if (j < 6) lines.push(x, y, z, x, y + 1.2, z)
          if (k < 2) lines.push(x, y, z, x, y, z - 1.2)
        }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lines), 3))
    const lm = new THREE.LineBasicMaterial({ color: COLORS.field, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false })
    return { pg, lg, lm }
  }, [])

  useLayoutEffect(() => {
    ringMat.uniforms.uResY.value = size.height * dpr
    ladderMat.uniforms.uDpr.value = dpr
  }, [ringMat, ladderMat, size, dpr])

  const arrowR = useRef(0)
  const rowR = useRef<THREE.Group>(null)
  const rowL = useRef<THREE.Group>(null)
  const ladderTop = useRef<THREE.Group>(null)
  const ladderBottom = useRef<THREE.Group>(null)
  const aroundLabel = useRef<THREE.Group>(null)
  useChapterFrame(() => {
    if (T.vis <= 0.003) return
    if (rowR.current) rowR.current.position.y = S.portrait ? -0.06 : 0
    if (rowL.current) rowL.current.position.y = S.portrait ? -0.22 : 0
    if (aroundLabel.current) {
      // above the arrow's top, which sits a little behind the ring's axis point because of the tilt
      aroundLabel.current.position.y = tubeRadius(T.g) + 0.32 + 0.04
      aroundLabel.current.position.x = ARX + (S.portrait ? 0.45 : 0)
    }
    if (ladderTop.current && ladder.current) ladderTop.current.position.x = ladder.current.position.x + 0.4
    if (ladderBottom.current && ladder.current) ladderBottom.current.position.x = ladder.current.position.x + 0.4
    const g = T.g
    const vis = T.vis
    const ex = T.extra
    const ratio = ratio11(g)
    const tubeOp = smoothstep(0.8, 1.2, ratio)
    const r = tubeRadius(g)
    const a = thread.current
    if (a) {
      const u = a.material.uniforms
      u.uOpacity.value = vis * (1 - 0.82 * tubeOp)
      u.uWidth.value = T.width
      u.uTaper.value = 0.09 * (1 - smoothstep(0.7, 1, T.curl))
    }
    if (tubeMesh.current) {
      tubeMesh.current.visible = tubeOp * vis > 0.003
      tubeMesh.current.scale.set(Math.max(r, 0.02), 1, Math.max(r, 0.02))
      tubeMat.uniforms.uOpacity.value = tubeOp * vis * (1 - T.curl)
    }
    if (extras.current) extras.current.visible = ex > 0.003
    ladderMat.uniforms.uG.value = g
    ladderMat.uniforms.uFuse.value = T.story * smoothstep(0.056, 0.046, 0.44 / g)
    ladderMat.uniforms.uOpacity.value = ex
    // portrait phones: anchor gauge and ladder to 8% / 88% of the width
    if (ladder.current) ladder.current.position.x = S.portrait ? screenX(0.88, rigD('thread'), 35, S.aspect, S.shift[0]) : 3.4
    ringMat.uniforms.uSize.value = Math.max(0.02, 2 * 0.035 * g)
    // rings grow as 0.035·g; keep their total light constant-ish as they swell
    ringMat.uniforms.uOpacity.value = (0.11 / (1 + 0.12 * g)) * ex
    lat.lm.opacity = 0.035 * ex
    if (barRMesh.current) {
      const l = Math.min(R_BAR_MAX, Math.max(0.01, 0.35 * R11(g)))
      barRMesh.current.scale.set(l, 1, 1)
      barRMesh.current.position.x = -2.6 + l / 2
      barR.uniforms.uOpacity.value = ex
    }
    if (barLMesh.current) {
      const l = 0.35 * L11(g)
      barLMesh.current.scale.set(l, 1, 1)
      barLMesh.current.position.x = -2.6 + l / 2
      barL.uniforms.uOpacity.value = ex
    }
    // the curved arrow around the tube: AROUND, THE ELEVENTH DIMENSION
    const ar = r + 0.32
    const aop = tubeOp * ex
    if (arrow.current && arrowHead.current) {
      arrow.current.mesh.visible = arrowHead.current.mesh.visible = aop > 0.003
      arrow.current.material.uniforms.uOpacity.value = aop
      arrowHead.current.material.uniforms.uOpacity.value = aop
      if (Math.abs(ar - arrowR.current) > 1e-4) {
        arrowR.current = ar
        // the ring's plane is tilted about the vertical so, seen from the side, it reads as an ellipse (around)
        const sT = Math.sin(ARROW_TILT)
        const cT = Math.cos(ARROW_TILT)
        const P = arrow.current.points
        const th0 = -1.3
        const th1 = 2.35
        for (let i = 0; i < 48; i++) {
          const th = th0 + (i / 47) * (th1 - th0)
          P[i * 3] = ARX + ar * Math.sin(th) * sT
          P[i * 3 + 1] = ar * Math.cos(th)
          P[i * 3 + 2] = ar * Math.sin(th) * cT
        }
        arrow.current.update()
        const hx = ARX + ar * Math.sin(th1) * sT
        const hy = ar * Math.cos(th1)
        const hz = ar * Math.sin(th1) * cT
        // tangent (dθ) and the in-plane normal (radial) at the head
        const tx = Math.cos(th1) * sT
        const ty = -Math.sin(th1)
        const tz = Math.cos(th1) * cT
        const nx = Math.sin(th1) * sT
        const ny = Math.cos(th1)
        const nz = Math.sin(th1) * cT
        const b = 0.22
        const w = 0.13
        const H = arrowHead.current.points
        H.set([hx - tx * b + nx * w, hy - ty * b + ny * w, hz - tz * b + nz * w, hx, hy, hz, hx - tx * b - nx * w, hy - ty * b - ny * w, hz - tz * b - nz * w])
        arrowHead.current.update()
      }
    }
  })

  const ex = () => T.extra
  // phones in the Lab: the bottom sheet already carries the wrap check, the message and the ladder's meaning
  const plab = () => (S.portrait && S.labW > 0.5 ? 0 : 1)
  const aha = () => T.extra * smoothstep(0.8, 1.2, ratio11(T.g))
  // the story fuses by the 0.05-unit rule (g ≳ 8.8); the Lab when rungs sit under ~3 px on screen
  const fuseAmount = () => {
    if (T.story > 0.5) return smoothstep(0.056, 0.046, 0.44 / T.g)
    const pxPerUnit = size.height / (2 * rigD('thread') * Math.tan((17.5 * Math.PI) / 180))
    return smoothstep(3.8, 2.6, (0.44 / T.g) * pxPerUnit)
  }
  const gaugeX = () => (S.portrait ? portraitGaugeX('thread', size.width, size.height) : -3.4)
  return (
    <group ref={group}>
      <Filament ref={thread} count={NT} fn={fn} width={0.12} minPixels={1.1} taper={0.09} intensity={1.15} coreFraction={0.14} renderOrder={7} />
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh ref={tubeMesh} material={tubeMat} renderOrder={6}>
          {/* the tube ends where the ladder (x = 3.4 ± 0.4) begins */}
          <cylinderGeometry args={[1, 1, THREAD_L - 0.1, 64, 1, true]} />
        </mesh>
      </group>
      <group ref={extras}>
        <points ref={lattice} geometry={lat.pg} material={ringMat} renderOrder={2} />
        <lineSegments ref={latticeLines} geometry={lat.lg} material={lat.lm} renderOrder={2} />
        <mesh ref={ladder} material={ladderMat} position={[3.4, 0, 0]} renderOrder={8}>
          <planeGeometry args={[0.8, 4.4]} />
        </mesh>
        <Ribbon ref={arrow} count={48} width={0.03} minPx={0.8} renderOrder={8} />
        <Ribbon ref={arrowHead} count={3} width={0.03} minPx={0.8} renderOrder={8} />
      </group>
      {/* the two scale bars; on phones their rows spread apart so the labels never touch */}
      <group ref={rowR}>
        <mesh ref={barRMesh} material={barR} position={[-2.6, -2.7, 0]} renderOrder={8}>
          <planeGeometry args={[1, 0.09]} />
        </mesh>
        <SafeLabel position={[-2.64, -2.52, 0]} align="left" tone="field" opacity={ex}>
          <span className="mth-mini">R₁₁ = g ℓs</span>
        </SafeLabel>
        {/* past the clamp the bar stops and an arrow carries the true value */}
        <DynLabel
          position={[-2.6 + R_BAR_MAX - 0.06, -2.7, 0]}
          align="left"
          tone="field"
          className="mth-mini"
          opacity={() => T.extra * smoothstep(R_BAR_MAX - 0.02, R_BAR_MAX + 0.05, 0.35 * T.g)}
          text={() => `→ R₁₁ = ${T.g < 10 ? T.g.toFixed(1) : T.g.toFixed(0)} ℓs`}
        />
      </group>
      <group ref={rowL}>
        <mesh ref={barLMesh} material={barL} position={[-2.6, -3.02, 0]} renderOrder={8}>
          <planeGeometry args={[1, 0.09]} />
        </mesh>
        <SafeLabel position={[-2.64, -3.2, 0]} align="left" tone="dim" opacity={ex}>
          <span className="mth-mini">
            ℓ₁₁ = g<sup>1/3</sup> ℓs<span className="mth-hide-m"> · 11D PLANCK LENGTH</span>
          </span>
        </SafeLabel>
      </group>
      <Gauge g={() => T.g} vis={ex} x={gaugeX} />
      {/* ladder: its title above (rungs), the legend below, and the continuum note under the legend once fused */}
      <group ref={ladderTop} position={[3.8, 2.56, 0]}>
        <SafeLabel position={[0, 0, 0]} align="right" tone="ink" opacity={() => T.extra * smoothstep(0.1, 0.13, T.g) * (1 - smoothstep(0.42, 0.47, fuseAmount()))}>
          <span className="mth-mini mth-stack">
            n = 1, 2, 3 …
            <br />
            <span className="mth-hide-m">D-PARTICLES BOUND TOGETHER</span>
          </span>
        </SafeLabel>
      </group>
      <group ref={ladderBottom} position={[3.8, -2.62, 0]}>
        <SafeLabel position={[0, 0, 0]} align="right" tone="dim" opacity={() => ex() * plab()}>
          <span className="mth-mini mth-stack">
            MASS 0 → 10/ℓs
            <br />
            <span className="mth-hide-m">DASHED: </span>STRING SCALE<span className="mth-hide-m"> 1/ℓs</span>
          </span>
        </SafeLabel>
        {/* one line under the two-line legend (offset in type units, so it never overlaps at any rig scale) */}
        <SafeLabel position={[0, 0, 0]} align="right" tone="ink" opacity={() => T.extra * smoothstep(0.47, 0.52, fuseAmount()) * plab()}>
          <span className="mth-mini mth-under2">A CONTINUUM: THE CIRCLE IS NOW LARGE</span>
        </SafeLabel>
      </group>
      <group ref={aroundLabel} position={[ARX, 1, 0]}>
        <SafeLabel position={[0, 0, 0]} align="above" tone="field" opacity={() => aha() * (1 - T.curl)}>
          <span className="mth-mini mth-backed mth-stack mth-stack--c">
            AROUND:
            <br className="mth-br-m" /> THE ELEVENTH DIMENSION
          </span>
        </SafeLabel>
      </group>
      <SafeLabel position={[0.2, -3.5, 0]} align="below" tone="ink" opacity={() => T.extra * smoothstep(1.0, 1.1, ratio11(T.g)) * plab()}>
        <span className="mth-readout">
          MEMBRANE TENSION × 2πR₁₁
          <br className="mth-br-m" /> = STRING TENSION ✓ <Status kind="conjectured" compact />
        </span>
      </SafeLabel>
      <SafeLabel position={[0.2, -3.5, 0]} align="below" tone="dim" opacity={() => T.extra * (1 - smoothstep(0.9, 1.0, ratio11(T.g))) * plab()}>
        <span className="mth-mini mth-stack mth-stack--c">
          CIRCLE SMALLER THAN ℓ₁₁ ·
          <br className="mth-br-m" /> THE 10D STRING PICTURE WORKS BETTER
        </span>
      </SafeLabel>
    </group>
  )
}

/* ───────────────────────── HE: two walls, one E8 on each ───────────────────────── */

const W_SUB = {
  prefix: (
    <>
      INTERVAL / ℓ₁₁ = g<sup>2/3</sup> ={' '}
    </>
  ),
  text: () => ratio11(S.walls.g).toFixed(2),
}

function WallsRig() {
  const size = useThree((s) => s.size)
  const W = S.walls
  const group = useRigGroup(
    () => W.frame,
    () => W.vis,
  )
  const wallMat = useMemo(() => createPanelMaterial(COLORS.field, 0.15, 0.6), [])
  const sheetMat = useMemo(() => createPanelMaterial(COLORS.filament, 0.07, 0), [])
  const top = useRef<THREE.Group>(null)
  const bot = useRef<THREE.Group>(null)
  const capRow = useRef<THREE.Group>(null)
  const sheet = useRef<THREE.Mesh>(null)
  const thread = useRef<FilamentApi>(null)
  const edgeT = useRef<FilamentApi>(null)
  const edgeB = useRef<FilamentApi>(null)
  const e8 = useMemo(() => {
    const p = e8Projection()
    const out = new Float32Array(240 * 3)
    for (let i = 0; i < 240; i++) {
      out[i * 3] = 2.15 + 0.55 * p[i * 2]
      out[i * 3 + 1] = 0.004
      out[i * 3 + 2] = 0.55 * p[i * 2 + 1]
    }
    return out
  }, [])
  const line = (sign: number): FilamentFn => (u, t, out) => {
    const d = wallSep(W.g)
    const tt = prefersReducedMotion() ? 0 : t
    out.set((u - 0.5) * THREAD_L, sign * d * 0.5 + (sign === 0 ? 0.04 * Math.sin(3 * Math.PI * u) * Math.cos(2 * tt) : 0), 0)
  }
  const fnT = useMemo(() => line(1), [])
  const fnB = useMemo(() => line(-1), [])
  const fnC = useMemo(() => line(0), [])
  useChapterFrame(() => {
    if (W.vis <= 0.003) return
    const d = wallSep(W.g)
    const rib = smoothstep(0.85, 1.25, ratio11(W.g))
    if (top.current) top.current.position.y = d / 2
    if (bot.current) bot.current.position.y = -d / 2
    // the caption rides under the bottom wall (its near edge sits ~0.26 lower on screen at this pitch)
    if (capRow.current) capRow.current.position.y = -d / 2 - 0.62
    wallMat.uniforms.uOpacity.value = W.vis
    sheetMat.uniforms.uOpacity.value = W.vis * rib
    if (sheet.current) {
      sheet.current.scale.set(1, Math.max(d, 0.02), 1)
      sheet.current.visible = rib > 0.01
    }
    if (thread.current) {
      thread.current.material.uniforms.uOpacity.value = W.vis * (1 - rib)
      thread.current.group.visible = rib < 0.99
    }
    const et = edgeT.current
    const eb = edgeB.current
    if (et) {
      et.material.uniforms.uOpacity.value = W.vis * rib
      et.group.visible = rib > 0.01
    }
    if (eb) {
      eb.material.uniforms.uOpacity.value = W.vis * rib
      eb.group.visible = rib > 0.01
    }
  })
  const vis = () => W.extra
  const wall = (
    <>
      <mesh material={wallMat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
        <planeGeometry args={[6, 3]} />
      </mesh>
      <GlowPoints positions={e8} size={0.035} color={COLORS.field} minPixels={0.7} maxPixels={4} intensity={0.5} sharpness={0.5} />
    </>
  )
  return (
    <group ref={group}>
      <group ref={top}>
        {wall}
        <SafeLabel position={[-3.1, 0, 0]} align="right" tone="field" opacity={vis}>
          <span className="mth-mini">E8</span>
        </SafeLabel>
      </group>
      <group ref={bot}>
        {wall}
        <SafeLabel position={[-3.1, 0, 0]} align="right" tone="field" opacity={vis}>
          <span className="mth-mini">E8</span>
        </SafeLabel>
      </group>
      <mesh ref={sheet} material={sheetMat} renderOrder={6}>
        <planeGeometry args={[THREAD_L, 1]} />
      </mesh>
      <Filament ref={thread} count={120} fn={fnC} width={0.12} minPixels={1.1} taper={0.09} renderOrder={7} />
      <Filament ref={edgeT} count={120} fn={fnT} width={0.1} minPixels={1} taper={0.09} renderOrder={7} />
      <Filament ref={edgeB} count={120} fn={fnB} width={0.1} minPixels={1} taper={0.09} renderOrder={7} />
      <Gauge g={() => W.g} vis={vis} x={() => (S.portrait ? portraitGaugeX('walls', size.width, size.height) : -4.1)} sub={W_SUB} />
      <group ref={capRow}>
        <SafeLabel position={[0, 0, 1.5]} align="below" tone="field" opacity={() => W.extra * smoothstep(0.85, 1.25, ratio11(W.g))}>
          <span className="mth-mini mth-stack mth-stack--c">
            ONE E8 ON EACH WALL ·
            <br className="mth-br-m" /> FAR FROM BOTH: PLAIN ELEVEN DIMENSIONS
          </span>
        </SafeLabel>
      </group>
    </group>
  )
}

/* ───────────────────────── Type I · HO · IIB: the two lightest strings ───────────────────────── */

const ty = (T: number) => -2 + 4 * clamp((Math.log10(T) + 3) / 4, 0, 1)

function TensionRig() {
  const size = useThree((s) => s.size)
  const X = S.tension
  const group = useRigGroup(
    () => X.frame,
    () => X.vis,
  )
  const upF = useRef<FilamentApi>(null)
  const loF = useRef<FilamentApi>(null)
  const upR = useRef<RibbonApi>(null)
  const loR = useRef<RibbonApi>(null)
  const barU = useRef<THREE.Mesh>(null)
  const barD = useRef<THREE.Mesh>(null)
  const matU = useMemo(() => createPanelMaterial(COLORS.filament, 0.22, 0.8), [])
  const matD = useMemo(() => createPanelMaterial(COLORS.field, 0.22, 0.8), [])
  const matDh = useMemo(() => createPanelMaterial(COLORS.field, 0.02, 0.7, 7), [])
  const pq = useRef<THREE.Points>(null)
  const strings = useRef<THREE.Group>(null)
  const seg = (y: number): FilamentFn => (u, t, out) => {
    const tt = prefersReducedMotion() ? 0 : t
    out.set(-3 + u * 4.4, y + 0.035 * Math.sin(Math.PI * 2 * u) * Math.cos(2 * tt + y), 0)
  }
  const fnU = useMemo(() => seg(0.8), [])
  const fnL = useMemo(() => seg(-0.8), [])
  const line = (y: number) => (k: number, P: Float32Array) => P.set([-3 + (k / 39) * 4.4, y, 0], k * 3)

  // (p,q)-strings: coprime pairs |p|,|q| ≤ 6, drawn at (p, q/g); distance ∝ tension
  const pqData = useMemo(() => {
    const pairs: [number, number][] = []
    const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
    for (let p = -6; p <= 6; p++) for (let q = -6; q <= 6; q++) if ((p || q) && gcd(p, q) === 1) pairs.push([p, q])
    const pos = new Float32Array(pairs.length * 3)
    const sizes = new Float32Array(pairs.length)
    const colors = new Float32Array(pairs.length * 3)
    const alphas = new Float32Array(pairs.length)
    const fil = new THREE.Color(COLORS.filament)
    const fld = new THREE.Color(COLORS.field)
    const ink = new THREE.Color(COLORS.ink2)
    pairs.forEach(([p, q], i) => {
      const c = p === 1 && q === 0 ? fil : p === 0 && q === 1 ? fld : ink
      colors.set([c.r, c.g, c.b], i * 3)
      sizes[i] = (p === 1 && q === 0) || (p === 0 && q === 1) ? 0.22 : 0.1
    })
    return { pairs, pos, sizes, colors, alphas }
  }, [])

  const circle = useRef<RibbonApi>(null)
  useChapterFrame(() => {
    if (X.vis <= 0.003) return
    const g = X.g
    const th = X.theory
    const strong = smoothstep(0.85, 1.18, g)
    const vis = X.vis
    const pqOn = X.pq
    // which string is "fundamental" (warm) at this coupling
    // I: upper = F (weak), lower = D.   HO: upper = heterotic, lower = Type I string.   IIB: upper = F, lower = D.
    const upperWarm = 1 - strong
    const lowerWarm = strong
    const s = 1 - pqOn
    if (upF.current) upF.current.material.uniforms.uOpacity.value = vis * upperWarm * s
    if (upR.current) {
      upR.current.material.uniforms.uOpacity.value = vis * (1 - upperWarm) * s
      upR.current.material.uniforms.uDash.value = th === 'I' ? 0.2 : 0
    }
    if (loF.current) loF.current.material.uniforms.uOpacity.value = vis * lowerWarm * s
    if (loR.current) {
      loR.current.material.uniforms.uOpacity.value = vis * (1 - lowerWarm) * s
      loR.current.material.uniforms.uDash.value = th === 'HO' ? 0.2 : 0
    }
    // tensions
    const Tu = th === 'IIB' ? T_pq(1, 0, g) : T_F1
    const Tl = th === 'IIB' ? T_pq(0, 1, g) : 1 / (2 * Math.PI * g)
    const ex = X.extra
    if (barU.current) {
      const h = ty(Tu) + 2
      barU.current.scale.set(1, Math.max(h, 0.01), 1)
      barU.current.position.y = -2 + h / 2
      matU.uniforms.uColor.value.set(upperWarm > 0.5 ? COLORS.filament : COLORS.field)
      matU.uniforms.uOpacity.value = ex
    }
    if (barD.current) {
      const h = ty(Tl) + 2
      barD.current.scale.set(1, Math.max(h, 0.01), 1)
      barD.current.position.y = -2 + h / 2
      const est = th === 'HO'
      barD.current.material = est ? matDh : matD
      matD.uniforms.uColor.value.set(lowerWarm > 0.5 ? COLORS.filament : COLORS.field)
      matD.uniforms.uOpacity.value = ex
      matDh.uniforms.uOpacity.value = ex
    }
    if (strings.current) strings.current.visible = s > 0.01
    // (p,q) lattice
    if (pq.current) {
      pq.current.visible = pqOn > 0.01 && vis > 0.01
      const P = pqData.pos
      const A = pqData.alphas
      const k = 0.36
      const pairs = pqData.pairs
      for (let i = 0; i < pairs.length; i++) {
        const x = pairs[i][0] * k
        const y = (pairs[i][1] / g) * k
        P[i * 3] = x - 0.6
        P[i * 3 + 1] = y
        P[i * 3 + 2] = 0
        A[i] = Math.hypot(x, y) < 2.5 ? pqOn * vis : 0
      }
      const geo = pq.current.geometry
      geo.getAttribute('position').needsUpdate = true
      geo.getAttribute('aAlpha').needsUpdate = true
    }
    if (circle.current) {
      circle.current.mesh.visible = pqOn * vis > 0.01
      circle.current.material.uniforms.uOpacity.value = pqOn * vis * 0.5
    }
  })
  const ex = () => X.extra
  const weak = () => X.extra * (1 - smoothstep(0.9, 1.1, X.g))
  const strongL = () => X.extra * smoothstep(0.9, 1.1, X.g)
  const is = (t: string, f: () => number) => () => (X.theory === t ? f() : 0)
  const noPq = (f: () => number) => () => f() * (1 - X.pq)
  return (
    <group ref={group}>
      <group ref={strings}>
        <Filament ref={upF} count={80} fn={fnU} width={0.11} minPixels={1} taper={0.06} renderOrder={7} />
        <Filament ref={loF} count={80} fn={fnL} width={0.11} minPixels={1} taper={0.06} renderOrder={7} />
        <Ribbon ref={upR} count={40} width={0.07} minPx={1} glow={0.45} renderOrder={7} init={line(0.8)} />
        <Ribbon ref={loR} count={40} width={0.07} minPx={1} glow={0.45} renderOrder={7} init={line(-0.8)} />
      </group>
      <GlowPoints ref={pq as never} positions={pqData.pos} sizes={pqData.sizes} colors={pqData.colors} alphas={pqData.alphas} minPixels={1.4} maxPixels={14} intensity={1} sharpness={0.7} />
      <Ribbon
        ref={circle}
        count={64}
        closed
        width={0.02}
        minPx={0.6}
        color={COLORS.ink3}
        renderOrder={6}
        init={(k, P) => {
          const a = (k / 64) * Math.PI * 2
          P.set([-0.6 + 0.36 * Math.cos(a), 0.36 * Math.sin(a), 0], k * 3)
        }}
      />
      {/* bar chart: log tension, 10⁻³ … 10¹ (units 1/ℓ_s²) */}
      <mesh ref={barU} material={matU} position={[2.45, 0, 0]} renderOrder={8}>
        <planeGeometry args={[0.32, 1]} />
      </mesh>
      <mesh ref={barD} material={matD} position={[2.95, 0, 0]} renderOrder={8}>
        <planeGeometry args={[0.32, 1]} />
      </mesh>
      <Ribbon count={2} width={0.02} minPx={0.6} color={COLORS.ink2} renderOrder={8} opacity={0.5} init={(i, P) => P.set([2.15, i === 0 ? -2 : 2, 0], i * 3)} />
      {[-3, -2, -1, 0, 1].map((e) => (
        <SafeLabel key={e} position={[2.08, ty(Math.pow(10, e)), 0]} align="right" tone="dim" opacity={ex}>
          <span className="mth-mini">{e === 0 ? '1' : e === 1 ? '10' : `10${e === -1 ? '⁻¹' : e === -2 ? '⁻²' : '⁻³'}`}</span>
        </SafeLabel>
      ))}
      <SafeLabel position={[2.7, 2.2, 0]} align="above" tone="dim" opacity={ex}>
        <span className="mth-mini">
          TENSION · LOG<span className="mth-hide-m"> · 1/ℓs²</span>
        </span>
      </SafeLabel>
      {/* string labels */}
      <SafeLabel position={[-3.0, 1.12, 0]} align="left" tone="filament" opacity={noPq(is('I', weak))}>
        <span className="mth-mini">F-STRING · T = 1/2π</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, -0.48, 0]} align="left" tone="field" opacity={noPq(is('I', weak))}>
        <span className="mth-mini">D-STRING · T = 1/2πg</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, -0.48, 0]} align="left" tone="filament" opacity={noPq(is('I', strongL))}>
        <span className="mth-mini">HETEROTIC STRING</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, 1.12, 0]} align="left" tone="dim" opacity={noPq(is('I', strongL))}>
        <span className="mth-mini">TYPE I STRING · NOT BPS</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, 1.12, 0]} align="left" tone="filament" opacity={noPq(is('HO', weak))}>
        <span className="mth-mini">HETEROTIC STRING · T = 1/2π</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, -0.48, 0]} align="left" tone="field" opacity={noPq(is('HO', weak))}>
        <span className="mth-mini">TYPE I STRING · 1/2πg · ESTIMATE</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, -0.48, 0]} align="left" tone="filament" opacity={noPq(is('HO', strongL))}>
        <span className="mth-mini">TYPE I STRING · ESTIMATE</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, 1.12, 0]} align="left" tone="field" opacity={noPq(is('HO', strongL))}>
        <span className="mth-mini">ITS D-STRING</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, 1.12, 0]} align="left" tone="filament" opacity={noPq(is('IIB', weak))}>
        <span className="mth-mini">F-STRING (1,0)</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, -0.48, 0]} align="left" tone="field" opacity={noPq(is('IIB', weak))}>
        <span className="mth-mini">D-STRING (0,1)</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, 1.12, 0]} align="left" tone="field" opacity={noPq(is('IIB', strongL))}>
        <span className="mth-mini">F-STRING (1,0)</span>
      </SafeLabel>
      <SafeLabel position={[-3.0, -0.48, 0]} align="left" tone="filament" opacity={noPq(is('IIB', strongL))}>
        <span className="mth-mini">D-STRING (0,1) · NOW THE LIGHTER</span>
      </SafeLabel>
      <SafeLabel position={[-0.6, 2.5, 0]} align="above" tone="ink" opacity={is('I', strongL)}>
        <span className="mth-readout">
          <span>
            NOW: HETEROTIC SO(32) AT g = 1/g<sub>I</sub>
          </span>
        </span>
      </SafeLabel>
      <SafeLabel position={[-0.6, 2.5, 0]} align="above" tone="ink" opacity={is('HO', strongL)}>
        <span className="mth-readout">
          <span>
            NOW: TYPE I AT g = 1/g<sub>H</sub>
          </span>
        </span>
      </SafeLabel>
      <SafeLabel position={[-0.6, 2.5, 0]} align="above" tone="ink" opacity={is('IIB', strongL)}>
        <span className="mth-readout">SAME THEORY AT 1/g · NAMES SWAPPED</span>
      </SafeLabel>
      <SafeLabel position={[-0.6, -2.6, 0]} align="below" tone="dim" opacity={() => X.extra * X.pq}>
        <span className="mth-mini">(p,q)-STRINGS AT (p, q/g) · DISTANCE ∝ TENSION</span>
      </SafeLabel>
      <DynLabel position={[2.7, -2.25, 0]} align="below" tone="ink" opacity={ex} text={() => {
        const g = X.g
        const Tu = X.theory === 'IIB' ? T_pq(1, 0, g) : T_F1
        const Tl = X.theory === 'IIB' ? T_pq(0, 1, g) : 1 / (2 * Math.PI * g)
        return `${fmtT(Tu)} · ${fmtT(Tl)}`
      }} />
      <Gauge g={() => X.g} vis={ex} x={() => (S.portrait ? portraitGaugeX('tension', size.width, size.height) : -3.95)} />
    </group>
  )
}

export function Rigs() {
  return (
    <>
      <ThreadRig />
      <WallsRig />
      <TensionRig />
    </>
  )
}
