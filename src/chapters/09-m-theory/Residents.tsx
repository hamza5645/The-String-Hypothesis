import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Filament, GlowPoints, SceneLabel, useChapterFrame, useHandoffFit, useIsoGridMaterial, COLORS, loopFn, type FilamentApi, type FilamentFn } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { TAU, damp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import { S } from './director'
import { HET, createSegmentsGeometry, createSegmentsMaterial, createStrandsGeometry, createStrandsMaterial } from './materials'
import { TIPS, e8Projection } from './model'

/** Resident animation clock: frozen at phase 0 under reduced motion (the pack's rule). */
const RT = { t: 0 }
const R0 = 0.33
const wrap = (x: number) => ((((x + Math.PI) % TAU) + TAU) % TAU) - Math.PI

/* ───────────────────────── The H2 loop that becomes five ───────────────────────── */

export function HeroLoop() {
  const fit = useHandoffFit()
  const api = useRef<FilamentApi>(null)
  const base = useMemo(() => loopFn(HANDOFF.H2.wobble, HANDOFF.H2.radius * fit), [fit])
  const fn = useMemo<FilamentFn>(
    () => (u, t, out, i) => {
      base(u, t, out, i)
      const lobe = S.hero.lobe
      if (lobe > 0) {
        const th = u * TAU
        const r = Math.hypot(out.x, out.y)
        const k = (r + lobe * Math.sin(5 * th - S.hero.phi)) / Math.max(r, 1e-6)
        out.x *= k
        out.y *= k
      }
    },
    [base],
  )
  useChapterFrame(() => {
    const a = api.current
    if (!a) return
    const op = S.hero.op
    a.group.visible = op > 0.003
    a.material.uniforms.uOpacity.value = op
  })
  return <Filament ref={api} count={HANDOFF.H2.count} width={HANDOFF.H2.width} closed fn={fn} />
}

/* ───────────────────────── Shared: billboard + fade ───────────────────────── */

const qI = new THREE.Quaternion()
function useResidentFrame(j: number, group: React.RefObject<THREE.Group | null>, onFrame?: (op: number) => void) {
  const camera = useThree((s) => s.camera)
  useChapterFrame((f) => {
    RT.t = prefersReducedMotion() ? 0 : f.t
    const g = group.current
    if (!g) return
    const r = S.res[j]
    // while a close-up owns the frame, the other residents leave it entirely (no ghost rings near the lens)
    const op = S.focusTip === j ? r.op : r.op * (1 - S.focus)
    const vis = op > 0.003 && (S.focusTip === j || S.focus < 0.98)
    if (g.visible !== vis) {
      g.visible = vis
      // hidden groups skip their Filaments' per-point evaluation too
      g.traverse((o) => {
        if (o !== g && o.type === 'Group') o.visible = vis
      })
    }
    if (!vis) return
    g.position.set(r.x, r.y, r.z)
    g.scale.setScalar(r.scale)
    g.quaternion.copy(qI).slerp(camera.quaternion, r.bb)
    onFrame?.(op)
  })
}

/* ───────────────────────── Closed-string residents (IIA, IIB, HO, HE) ───────────────────────── */

const II = { n: 2, A: 0.12, s: 0.22, w: 0.6 }

/* Beat 1's chirality cartoon (~ANALOGY): every IIA/IIB pulse carries a short twisted ribbon riding just
   outside the string, whose handedness stands for that mover's chirality (front edges bright, back edges
   dim, so the slant reads in a still), a chevron for its direction, and each train an arrow arc and a tag. */
const HX = { L: 0.26, a: 0.04, out: 0.075, turns: 1.5, strands: 2, seg: 18, spin: 2.6 }
const ARC = { R: 0.58, seg: 14 }
const PER_PULSE = HX.strands * HX.seg + 2
const N_ARCS = 2 * ARC.seg + 4
const FIELD = new THREE.Color(COLORS.field)
/** How strongly each island is being "taught" (visited in Beat 1 or hovered in the Lab), 0..1. */
const TEACH = new Float32Array(6)
/** Handedness per train (cw, ccw): IIA mirror images, IIB the same hand. */
const HAND: Record<string, [number, number]> = { IIA: [-1, 1], IIB: [1, 1] }
const TAGS: Record<string, [string, string]> = {
  IIA: ['↻ LEFT-TWIST', '↺ RIGHT-TWIST'],
  IIB: ['↻ RIGHT-TWIST', '↺ RIGHT-TWIST'],
  HO: ['↻ SUPER', '↺ BOSONIC + 16'],
  HE: ['↻ SUPER', '↺ BOSONIC + 16'],
}

function bumpII(phi: number, t: number) {
  let b = 0
  for (let k = 0; k < II.n; k++) {
    const d1 = wrap(phi - (-II.w * t + (TAU * k) / II.n))
    const d2 = wrap(phi - (II.w * t + (TAU * k) / II.n + 0.5))
    b += Math.exp(-(d1 * d1) / (2 * II.s * II.s)) + Math.exp(-(d2 * d2) / (2 * II.s * II.s))
  }
  return b * II.A
}
function bumpHet(phi: number, t: number) {
  let b = 0
  for (let k = 0; k < HET.cwN; k++) {
    const d = wrap(phi - (-HET.w * t + (TAU * k) / HET.cwN))
    b += HET.cwA * Math.exp(-(d * d) / (2 * HET.cwS * HET.cwS))
  }
  for (let k = 0; k < HET.ccwN; k++) {
    const d = wrap(phi - (HET.w * t + (TAU * k) / HET.ccwN + 0.4))
    b += HET.ccwA * Math.exp(-(d * d) / (2 * HET.ccwS * HET.ccwS))
  }
  return b
}

const V0 = new THREE.Vector3()
const V1 = new THREE.Vector3()
/** Segment writer state (module-level: the frame loop allocates nothing). */
const W: { a: Float32Array<ArrayBufferLike>; b: Float32Array<ArrayBufferLike>; c: Float32Array<ArrayBufferLike>; o: number } = { a: new Float32Array(0), b: new Float32Array(0), c: new Float32Array(0), o: 0 }
function put(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, b: number) {
  const o = W.o++
  W.a[o * 3] = x0
  W.a[o * 3 + 1] = y0
  W.a[o * 3 + 2] = z0
  W.b[o * 3] = x1
  W.b[o * 3 + 1] = y1
  W.b[o * 3 + 2] = z1
  W.c[o * 4] = FIELD.r
  W.c[o * 4 + 1] = FIELD.g
  W.c[o * 4 + 2] = FIELD.b
  W.c[o * 4 + 3] = b
}
/** A point on a pulse's helix axis (riding just outside the string); out.z carries the angle φ. */
function axis(u: number, pc: number, s: number, act: number, out: THREE.Vector3) {
  const dphi = s * (u - 0.5) * (HX.L / R0)
  const phi = pc + dphi
  const r = R0 * (1 + act * II.A * Math.exp(-(dphi * dphi) / (2 * II.s * II.s))) + HX.out
  return out.set(r * Math.cos(phi), r * Math.sin(phi), phi)
}
const tagOp = (j: number) => TEACH[j] * S.res[j].op * (1 - S.focus) * (S.focusTip === j && S.focus > 0.02 ? 0 : 1)

function ClosedResident({ j }: { j: number }) {
  const kind = TIPS[j].id
  const het = kind === 'HO' || kind === 'HE'
  const group = useRef<THREE.Group>(null)
  const fil = useRef<FilamentApi>(null)
  const fn = useMemo<FilamentFn>(
    () => (u, _t, out) => {
      const t = RT.t
      const phi = u * TAU
      const act = S.res[j].act
      const idle = 0.022 * Math.cos(2 * phi + 0.3 * j) * Math.cos(1.6 * t + j) + 0.014 * Math.cos(3 * phi + 0.7) * Math.cos(2.2 * t + 1.1 + j)
      const b = het ? bumpHet(phi, t) : bumpII(phi, t)
      const r = R0 * (1 + act * b + idle)
      out.set(r * Math.cos(phi), r * Math.sin(phi), 0.012 * Math.sin(2 * phi) * Math.sin(1.6 * t + j))
    },
    [het, j],
  )

  // chirality helices + chevrons (IIA/IIB) and the two train arrows (all closed residents), one draw call
  const size = useThree((st) => st.size)
  const dpr = useThree((st) => st.viewport.dpr)
  const nSeg = (het ? 0 : 2 * II.n * PER_PULSE) + N_ARCS
  const segs = useMemo(() => {
    const m = new THREE.Mesh(createSegmentsGeometry(nSeg), createSegmentsMaterial())
    m.frustumCulled = false
    m.renderOrder = 6
    return m
  }, [nSeg])
  useLayoutEffect(() => {
    const u = (segs.material as THREE.ShaderMaterial).uniforms
    u.uResolution.value.set(size.width * dpr, size.height * dpr)
    u.uHalfPx.value = 0.85 * dpr
  }, [segs, size, dpr])
  useLayoutEffect(
    () => () => {
      segs.geometry.dispose()
      ;(segs.material as THREE.Material).dispose()
    },
    [segs],
  )
  // Heterotic: 16 faint sub-strands on the dense side, plus the symmetry emblem
  const strands = useMemo(() => {
    if (!het) return null
    const ls = new THREE.LineSegments(createStrandsGeometry(), createStrandsMaterial())
    ls.frustumCulled = false
    ls.renderOrder = 5
    return ls
  }, [het])
  const emblem = useMemo(() => {
    if (!het) return null
    if (kind === 'HO') {
      const n = 32
      const pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        pos[i * 3] = 0.7 + 0.12 * Math.cos((i / n) * TAU)
        pos[i * 3 + 1] = -0.44 + 0.12 * Math.sin((i / n) * TAU)
      }
      return pos
    }
    const e8 = e8Projection()
    const pos = new Float32Array(480 * 3)
    for (let w = 0; w < 2; w++)
      for (let i = 0; i < 240; i++) {
        pos[(w * 240 + i) * 3] = 0.6 + w * 0.28 + 0.12 * e8[i * 2]
        pos[(w * 240 + i) * 3 + 1] = -0.44 + 0.12 * e8[i * 2 + 1]
      }
    return pos
  }, [het, kind])
  const emblemRef = useRef<THREE.Points>(null)

  useResidentFrame(j, group, (op) => {
    const a = fil.current
    if (a) a.material.uniforms.uOpacity.value = op
    const act = S.res[j].act
    const t = RT.t
    // taught = visited in Beat 1 (fading with the visit) or hovered in the Lab
    const teach = smoothstep(0.45, 0.95, act) * (S.seg === 'islands' ? S.visitW : 1)
    TEACH[j] = teach
    {
      const g = segs.geometry
      const A = g.getAttribute('aA') as THREE.InstancedBufferAttribute
      const B = g.getAttribute('aB') as THREE.InstancedBufferAttribute
      const C = g.getAttribute('aC') as THREE.InstancedBufferAttribute
      const aa = A.array as Float32Array
      const ba = B.array as Float32Array
      const ca = C.array as Float32Array
      W.a = aa
      W.b = ba
      W.c = ca
      W.o = 0
      if (!het) {
        const hand = HAND[kind]
        const k0 = op * act * (0.3 + 0.7 * teach)
        for (let tr = 0; tr < 2; tr++) {
          const s = tr === 0 ? -1 : 1 // −1: clockwise train, +1: counter-clockwise
          const h = hand[tr]
          for (let k = 0; k < II.n; k++) {
            const pc = s * II.w * t + (TAU * k) / II.n + (s > 0 ? 0.5 : 0)
            // the helix: offset a·(cos θ N + sin θ B), N radial, B toward the camera; θ winds with handedness h
            for (let q = 0; q < HX.strands; q++) {
              for (let i = 0; i < HX.seg; i++) {
                const u0 = i / HX.seg
                const u1 = (i + 1) / HX.seg
                axis(u0, pc, s, act, V0)
                axis(u1, pc, s, act, V1)
                const th0 = (TAU * q) / HX.strands - h * s * TAU * HX.turns * u0 + h * s * HX.spin * t
                const th1 = (TAU * q) / HX.strands - h * s * TAU * HX.turns * u1 + h * s * HX.spin * t
                const c0 = Math.cos(V0.z)
                const s0 = Math.sin(V0.z)
                const c1 = Math.cos(V1.z)
                const s1 = Math.sin(V1.z)
                const um = (u0 + u1) / 2
                const front = Math.sin((th0 + th1) / 2)
                const b = k0 * Math.pow(Math.sin(Math.PI * um), 0.6) * (0.025 + 0.975 * smoothstep(0.05, 0.75, front))
                put(
                  V0.x + HX.a * Math.cos(th0) * c0,
                  V0.y + HX.a * Math.cos(th0) * s0,
                  HX.a * Math.sin(th0),
                  V1.x + HX.a * Math.cos(th1) * c1,
                  V1.y + HX.a * Math.cos(th1) * s1,
                  HX.a * Math.sin(th1),
                  b,
                )
              }
            }
            // chevron at the leading end
            axis(1.12, pc, s, act, V0)
            axis(0.9, pc, s, act, V1)
            const nx = Math.cos(V1.z) * 0.04
            const ny = Math.sin(V1.z) * 0.04
            put(V1.x + nx, V1.y + ny, 0, V0.x, V0.y, 0, 0.9 * k0)
            put(V1.x - nx, V1.y - ny, 0, V0.x, V0.y, 0, 0.9 * k0)
          }
        }
      }
      // two train arrows outside the loop: clockwise over the top, counter-clockwise under the bottom
      const ka = op * teach * 0.6
      for (let tr = 0; tr < 2; tr++) {
        const s = tr === 0 ? -1 : 1
        const a0 = (tr === 0 ? 122 : 238) * (Math.PI / 180)
        const span = 64 * (Math.PI / 180)
        for (let i = 0; i < ARC.seg; i++) {
          const p0 = a0 + s * span * (i / ARC.seg)
          const p1 = a0 + s * span * ((i + 1) / ARC.seg)
          put(ARC.R * Math.cos(p0), ARC.R * Math.sin(p0), 0, ARC.R * Math.cos(p1), ARC.R * Math.sin(p1), 0, ka)
        }
        const pe = a0 + s * span
        const tx = -s * Math.sin(pe)
        const ty = s * Math.cos(pe)
        const hx = ARC.R * Math.cos(pe) + tx * 0.012
        const hy = ARC.R * Math.sin(pe) + ty * 0.012
        const bx = hx - tx * 0.065
        const by = hy - ty * 0.065
        const wx = Math.cos(pe) * 0.038
        const wy = Math.sin(pe) * 0.038
        put(bx + wx, by + wy, 0, hx, hy, 0, ka * 1.3)
        put(bx - wx, by - wy, 0, hx, hy, 0, ka * 1.3)
      }
      A.needsUpdate = true
      B.needsUpdate = true
      C.needsUpdate = true
    }
    if (strands) {
      const u = (strands.material as THREE.ShaderMaterial).uniforms
      u.uT.value = t
      u.uAct.value = act
      u.uOpacity.value = op
    }
    if (emblemRef.current) {
      const m = emblemRef.current.material as THREE.ShaderMaterial
      m.uniforms.uIntensity.value = op * (0.25 + 0.75 * act) * 0.9
    }
  })

  return (
    <group ref={group}>
      <Filament ref={fil} count={160} closed width={0.062} minPixels={1.1} fn={fn} intensity={1.1} coreFraction={0.14} renderOrder={6} />
      <primitive object={segs} />
      {TAGS[kind] && (
        <>
          <SceneLabel position={[-0.33, 0.49, 0]} align="right" tone="field" opacity={() => tagOp(j)}>
            <span className="mth-tag">{TAGS[kind][0]}</span>
          </SceneLabel>
          <SceneLabel position={[-0.33, -0.49, 0]} align="right" tone="field" opacity={() => tagOp(j)}>
            <span className="mth-tag">{TAGS[kind][1]}</span>
          </SceneLabel>
        </>
      )}
      {strands && <primitive object={strands} />}
      {emblem && <GlowPoints ref={emblemRef as never} positions={emblem} size={kind === 'HO' ? 0.02 : 0.011} color={COLORS.field} minPixels={0.9} maxPixels={6} intensity={0.8} sharpness={0.6} />}
    </group>
  )
}

/* ───────────────────────── Type I: open + closed, no arrow ───────────────────────── */

function TypeIResident() {
  const j = 3
  const group = useRef<THREE.Group>(null)
  const openApi = useRef<FilamentApi>(null)
  const loopApi = useRef<FilamentApi>(null)
  const openFn = useMemo<FilamentFn>(
    () => (u, _t, out) => {
      const r = S.res[j]
      const t = RT.t
      const L = 0.8 * r.open
      const y = (0.05 + 0.04 * r.act) * (0.7 * Math.cos(Math.PI * u) * Math.cos(2.1 * t) + 0.45 * Math.cos(2 * Math.PI * u) * Math.cos(4.2 * t + 0.6))
      out.set(-0.22 * r.open + (u - 0.5) * L, y * r.open, 0.01 * Math.cos(Math.PI * u) * Math.sin(2.1 * t))
    },
    [],
  )
  const loopFnI = useMemo<FilamentFn>(
    () => (u, _t, out) => {
      const r = S.res[j]
      const t = RT.t
      const phi = u * TAU
      const R = R0 + (0.2 - R0) * r.open
      const w = (0.06 + 0.05 * r.act) * Math.cos(2 * phi) * Math.cos(1.9 * t) + 0.03 * Math.cos(3 * phi + 0.4) * Math.cos(2.8 * t)
      const rr = R * (1 + w)
      out.set(0.47 * r.open + rr * Math.cos(phi), rr * Math.sin(phi), 0)
    },
    [],
  )
  useResidentFrame(j, group, (op) => {
    const r = S.res[j]
    if (openApi.current) {
      openApi.current.group.visible = r.open > 0.02
      openApi.current.material.uniforms.uOpacity.value = op * smoothstep(0.02, 0.3, r.open)
    }
    if (loopApi.current) loopApi.current.material.uniforms.uOpacity.value = op
  })
  return (
    <group ref={group}>
      <Filament ref={openApi} count={64} width={0.062} minPixels={1.1} fn={openFn} beads beadSize={0.09} intensity={1.1} coreFraction={0.14} renderOrder={6} />
      <Filament ref={loopApi} count={120} closed width={0.062} minPixels={1.1} fn={loopFnI} intensity={1.1} coreFraction={0.14} renderOrder={6} />
    </group>
  )
}

/* ───────────────────────── 11D supergravity: a membrane, not a string ───────────────────────── */

function MembraneResident() {
  const group = useRef<THREE.Group>(null)
  const mat = useIsoGridMaterial({ grid: [7, 7], lineWidth: 0.8, fill: 0.05, fresnel: 0.5, color: COLORS.field, lineColor: COLORS.field })
  const geo = useMemo(() => new THREE.PlaneGeometry(0.56, 0.56, 14, 14), [])
  const base = useMemo(() => Float32Array.from(geo.getAttribute('position').array as Float32Array), [geo])
  useResidentFrame(0, group, (op) => {
    mat.uniforms.uOpacity.value = op
    const P = geo.getAttribute('position') as THREE.BufferAttribute
    const a = P.array as Float32Array
    const t = RT.t
    const act = S.res[0].act
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i]
      const y = base[i + 1]
      a[i + 2] = (0.02 + 0.02 * act) * Math.sin(11 * x - 1.7 * t) * Math.cos(9 * y + 1.1 * t)
    }
    P.needsUpdate = true
  })
  return (
    <group ref={group}>
      <mesh geometry={geo} material={mat} rotation={[-0.5, 0.35, 0]} renderOrder={6} />
    </group>
  )
}

/* ───────────────────────── Island labels & Beat 1 captions ───────────────────────── */

function IslandLabel({ j }: { j: number }) {
  const tip = TIPS[j]
  const pos = useMemo(() => {
    // the 11D name sits just inside the map (below its mound), clear of the top edge and the Lab's hint
    if (j === 0) return [0, 0.45, -3.05] as [number, number, number]
    const th = (tip.theta * Math.PI) / 180
    return [4.3 * Math.cos(th), 2.3, -4.3 * Math.sin(th)] as [number, number, number]
  }, [tip.theta, j])
  const camera = useThree((s) => s.camera)
  const capGroup = useRef<THREE.Group>(null)
  const nameGroup = useRef<THREE.Group>(null)
  const right = useMemo(() => new THREE.Vector3(), [])
  const follow = useRef(0)
  useChapterFrame((f) => {
    // while visited (Beat 1) the name rides just above the resident's train arrows; otherwise it sits on its island
    const n = nameGroup.current
    if (n && j > 0) {
      const target = S.visit === j ? S.visitW : 0
      follow.current = f.dt <= 0 ? target : damp(follow.current, target, 4, f.dt)
      const k = follow.current
      const r = S.res[j]
      right.setFromMatrixColumn(camera.matrixWorld, 1)
      const up = j === 3 ? 0.42 : 0.68
      n.position.set(
        pos[0] + (r.x + right.x * up - pos[0]) * k,
        pos[1] + (r.y + right.y * up - pos[1]) * k,
        pos[2] + (r.z + right.z * up - pos[2]) * k,
      )
    }
    const g = capGroup.current
    if (!g || S.visit !== j) return
    const r = S.res[j]
    if (S.portrait) {
      // phones: the caption sits under the resident (screen-down = −camera up)
      right.setFromMatrixColumn(camera.matrixWorld, 1)
      const k = j === 3 ? 0.42 : 0.8
      g.position.set(r.x - right.x * k, r.y - right.y * k, r.z - right.z * k)
      return
    }
    right.setFromMatrixColumn(camera.matrixWorld, 0)
    const k = j === 3 ? 0.78 : 0.56
    g.position.set(r.x + right.x * k, r.y + right.y * k - 0.02, r.z + right.z * k)
  })
  const nameOp = () => {
    // names leave as the camera starts to climb (the cusp labels take over once the landmass shows)
    const base =
      S.names * (1 - S.focus) * (1 - S.cusps) * (1 - smoothstep(0.1, 0.3, S.pull)) * (S.visit === j ? 1 : S.visitW > 0 ? 0.35 : 1) * (j === 3 || j === 4 ? 1 : 1 - S.sFocus)
    if (j === 0) return base * S.m11
    const hl = S.hover === j ? 1 : 0
    return base * Math.max(S.res[j].op > 0.01 ? 1 : 0, hl)
  }
  return (
    <>
      <group ref={nameGroup} position={pos}>
        <SceneLabel position={[0, 0, 0]} align={j === 0 ? 'below' : 'above'} tone={j === 0 ? 'field' : 'ink'} opacity={nameOp}>
          {j === 0 ? (
            <span className="mth-island-name mth-stack mth-stack--c">
              Eleven-dimensional
              <br />
              supergravity · 1978
            </span>
          ) : (
            <span className="mth-island-name">{tip.name}</span>
          )}
        </SceneLabel>
      </group>
      {j === 0 && (
        <SceneLabel position={[0, 0.9, -4.3]} align="center" tone="dim" size="md" opacity={() => S.names * (1 - S.focus) * (1 - S.m11)}>
          <span className="mth-q">?</span>
        </SceneLabel>
      )}
      {tip.caption && (
        <group ref={capGroup}>
          <SceneLabel position={[0, 0, 0]} align="left" tone="field" opacity={() => (S.visit === j && !S.portrait ? S.visitW : 0)}>
            <span className="mth-caption">{tip.caption}</span>
          </SceneLabel>
          <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={() => (S.visit === j && S.portrait ? S.visitW : 0)}>
            <span className="mth-caption mth-caption--c">{tip.caption}</span>
          </SceneLabel>
        </group>
      )}
    </>
  )
}

export function Residents() {
  return (
    <>
      <HeroLoop />
      <MembraneResident />
      <ClosedResident j={1} />
      <ClosedResident j={2} />
      <TypeIResident />
      <ClosedResident j={4} />
      <ClosedResident j={5} />
      {TIPS.map((_, j) => (
        <IslandLabel key={j} j={j} />
      ))}
    </>
  )
}
