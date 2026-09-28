import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, Filament, useChapterFrame, useIsoGridMaterial, type FilamentApi } from '@/gl'
import { lerp, range, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { D } from './director'
import { cAt } from './layout'
import { lineMaterial, makeLine, makeSegments, paramSurface } from './gl'
import { GAMMA_06 } from './model'
import { Marker, screenOffset, Tag, useDispose, type MarkerApi, type TagApi } from './parts'
import { TUBE_X } from './stageConsts'

const H = 8 // the "present" climbs from ct = 0 to ct = 8
const LINE_DIM = '#4f6588'

/* ───────────────────────── Beat 1: the rotating open string's helicoid ribbon ───────────────────────── */

/** P(s, t) = (s·cos(t/r₀), t, s·sin(t/r₀)), s ∈ [−r₀, r₀], r₀ = 1: endpoints circle at radius 1, speed exactly c. */
const helicoid = (u: number, v: number, out: THREE.Vector3) => {
  const s = 2 * u - 1
  const t = H * v
  out.set(s * Math.cos(t), t, s * Math.sin(t))
}

export function Helicoid() {
  const group = useRef<THREE.Group>(null!)
  const geo = useMemo(() => paramSurface(64, 256, helicoid), [])
  const film = useIsoGridMaterial({ grid: [16, 16], lineWidth: 0.7, fill: 0.075, fresnel: 0.35, revealAxis: 'v', reveal: 0, edge: 0.9, lineColor: LINE_DIM })
  const sweep = useIsoGridMaterial({ grid: [0, 0], fill: 0.42, fresnel: 0.2, revealAxis: 'v', reveal: 0, edge: 2.2, edgeColor: COLORS.field })
  const ghostGeo = useMemo(() => paramSurface(16, 64, helicoid), [])
  const ghostBase = useMemo(() => Float32Array.from(ghostGeo.getAttribute('position').array as Float32Array), [ghostGeo])
  const ghost = useIsoGridMaterial({ grid: [4, 12], lineWidth: 0.9, fill: 0.025, fresnel: 0.3, lineColor: '#b8cbe6', color: '#b8cbe6' })
  const ghostMesh = useRef<THREE.Mesh>(null!)
  const sweepMesh = useRef<THREE.Mesh>(null!)
  const nudgeTag = useRef<TagApi>(null)
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera
  const size = useThree((st) => st.size)
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Vector3() }), [])

  // endpoint worldlines: helices at s = ±1 that lean at exactly 45° everywhere
  const { edges, edgeMat } = useMemo(() => {
    const edgeMat = lineMaterial(COLORS.field, 0)
    const n = 257
    const mk = (sg: number) => {
      const p = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * H
        p.set([sg * Math.cos(t), t, sg * Math.sin(t)], i * 3)
      }
      return makeLine(p, edgeMat)
    }
    return { edges: [mk(1), mk(-1)], edgeMat }
  }, [])
  useDispose(geo, ghostGeo, edges[0].geometry, edges[1].geometry, edgeMat)

  useChapterFrame(({ t }) => {
    const w = D.w.helicoid
    const g = group.current
    g.visible = w > 0.003
    if (!g.visible) return
    const reveal = D.tN / H
    const u = film.uniforms
    u.uReveal.value = reveal
    u.uOpacity.value = w
    u.uEdge.value = reveal < 0.999 ? 0.9 : 0
    // Beat 2 "T": tension — the edges brighten; "A": a brighter fill sweeps up, measuring the area
    const T = Math.max(D.area.T, D.deeper.T)
    const A = Math.max(D.area.A, D.deeper.dA)
    const n = Math.max(2, Math.floor(reveal * 256) + 1)
    for (const e of edges) e.geometry.setDrawRange(0, n)
    edgeMat.opacity = w * (0.75 + 1.4 * T)
    sweepMesh.current.visible = A > 0.003
    sweep.uniforms.uReveal.value = D.deeper.dA > D.area.A ? range(D.deeper.dA, 0, 1) : D.area.sweep
    sweep.uniforms.uOpacity.value = A * w
    // nudge: a ghost bulges by ε off the real sheet — S changes only at order ε²
    const nk = D.area.nudge * w
    const nt = nudgeTag.current
    if (nt && nk > 0.003) {
      if (D.portrait) {
        // phones: above the ribbon, its two lines (≈ 190 px) kept inside the right edge
        g.localToWorld(tmp.p.set(0, H + 1.05, 0))
        const sx = (0.5 + 0.5 * tmp.q.copy(tmp.p).project(camera).x) * size.width
        screenOffset(camera, tmp.p, Math.min(-70, size.width - 206 - sx), 0, size.height, tmp.q)
        nt.group.position.copy(g.worldToLocal(tmp.q))
      } else nt.group.position.set(1.45, H / 2 + 0.2, 0)
    }
    ghostMesh.current.visible = nk > 0.003
    if (nk > 0.003) {
      const pos = ghostGeo.getAttribute('position') as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      const eps = 0.35 * (ambient() ? Math.sin(t * 1.3) : 0.8)
      for (let j = 0; j <= 64; j++) {
        const tt = (j / 64) * H
        const ct = Math.cos(tt)
        const st = Math.sin(tt)
        for (let i = 0; i <= 16; i++) {
          const k = j * 17 + i
          const s = (i / 16) * 2 - 1
          const bump = eps * Math.sin((Math.PI * (s + 1)) / 2) * Math.sin((Math.PI * tt) / H)
          const inv = 1 / Math.sqrt(1 + s * s)
          arr[k * 3] = ghostBase[k * 3] + bump * -st * inv
          arr[k * 3 + 1] = ghostBase[k * 3 + 1] + bump * -s * inv
          arr[k * 3 + 2] = ghostBase[k * 3 + 2] + bump * ct * inv
        }
      }
      pos.needsUpdate = true
      ghost.uniforms.uOpacity.value = 0.85 * nk
    }
  })

  return (
    <group ref={group}>
      <mesh geometry={geo} material={film} renderOrder={1} />
      <mesh ref={sweepMesh} geometry={geo} material={sweep} renderOrder={2} />
      <mesh ref={ghostMesh} geometry={ghostGeo} material={ghost} renderOrder={2} />
      {edges.map((e, i) => (
        <primitive key={i} object={e} />
      ))}
      <Tag position={[0, H + 0.75, 0]} align="center" tone="ink" opacity={() => D.w.helicoid * smoothstep(0.7, 0.78, D.p.sheet) * (1 - smoothstep(cAt('area', -0.08), cAt('area', 0.06), D.c))}>
        OPEN · RIBBON
      </Tag>
      {/* beside the ghost, at the ribbon's mid-height (where the bulge is largest); phones: above the ribbon */}
      <Tag ref={nudgeTag} position={[1.45, H / 2 + 0.2, 0]} align="left" tone="field" opacity={() => D.w.helicoid * D.area.nudge}>
        NUDGE IT: AREA CHANGES
        <br />
        ONLY AT ORDER ε²
      </Tag>
    </group>
  )
}

/* ───────────────────────── Beat 1: the closed loop's tube (radius breathes ±5%, cartoon) ───────────────────────── */

const rTube = (t: number) => 1 + 0.05 * Math.sin(2.1 * t)

export function Tube() {
  const group = useRef<THREE.Group>(null!)
  const ring = useRef<FilamentApi>(null)
  const geo = useMemo(
    () =>
      paramSurface(64, 128, (u, v, out) => {
        const th = u * Math.PI * 2
        const t = v * H
        const r = rTube(t)
        out.set(r * Math.cos(th), t, r * Math.sin(th))
      }),
    [],
  )
  const film = useIsoGridMaterial({ grid: [16, 16], lineWidth: 0.7, fill: 0.07, fresnel: 0.35, revealAxis: 'v', reveal: 0, edge: 0.9, lineColor: LINE_DIM })
  useDispose(geo)
  const pts = useMemo(() => new Float32Array(160 * 3), [])

  useChapterFrame(() => {
    const w = D.w.tube
    group.current.visible = w > 0.003
    if (!group.current.visible) return
    const tT = D.tT
    film.uniforms.uReveal.value = tT / H
    film.uniforms.uOpacity.value = w
    film.uniforms.uEdge.value = tT < H - 0.01 ? 0.9 : 0
    const r = rTube(tT)
    for (let i = 0; i < 160; i++) {
      const th = (i / 160) * Math.PI * 2
      pts[i * 3] = r * Math.cos(th)
      pts[i * 3 + 1] = tT
      pts[i * 3 + 2] = r * Math.sin(th)
    }
    const a = ring.current
    if (a) {
      a.update()
      a.material.uniforms.uOpacity.value = w
    }
  })
  return (
    <group ref={group} position={[TUBE_X, 0, 0]}>
      <mesh geometry={geo} material={film} renderOrder={1} />
      <Filament ref={ring} points={pts} count={160} closed width={0.12} minPixels={1} coreFraction={0.14} intensity={1.05} renderOrder={5} />
      <Tag position={[0, H + 0.75, 0]} align="center" tone="ink" opacity={() => D.w.tube * smoothstep(0.84, 0.92, D.p.sheet)}>
        CLOSED · TUBE
      </Tag>
      {/* χ = 2 − 2h − b (Go deeper): pulses with the drawer's b, h */}
      <Tag position={[0, H + 0.35, 0]} align="center" tone="dim" opacity={() => D.w.tube * Math.max(smoothstep(0.84, 0.92, D.p.sheet) * 0.9, D.deeper.bh * 1.2)}>
        b = 2 OPENINGS · h = 0 HANDLES
      </Tag>
    </group>
  )
}

/* ───────────────────────── Beat 2: proper time — the straight worldline ticks the most ───────────────────────── */

const PX = -3.5
const V_DETOUR = 0.6

export function ProperTime() {
  const group = useRef<THREE.Group>(null!)
  const mA = useRef<MarkerApi>(null)
  const mB = useRef<MarkerApi>(null)
  const { line, ticks, ghost, gticks, matL, matT, matG, matGT } = useMemo(() => {
    const matL = lineMaterial(COLORS.field, 0)
    const matT = lineMaterial(COLORS.ink, 0)
    const matG = lineMaterial(COLORS.field, 0)
    const matGT = lineMaterial(COLORS.ink, 0)
    const line = makeLine([PX, 0, 0, PX, H, 0], matL)
    // 10 proper-time ticks, every 0.8 of τ (γ = 1 on the straight line)
    const tp: number[] = []
    for (let k = 1; k <= 10; k++) tp.push(PX - 0.16, 0.8 * k, 0, PX + 0.16, 0.8 * k, 0)
    const ticks = makeSegments(tp, matT)
    // detour: out at 0.6c for 4 units of ct, then back; 8 ticks (every 0.8 of τ = every 1.0 of ct, γ = 1.25)
    const apex = PX - V_DETOUR * 4
    const ghost = makeLine([PX, 0, 0, apex, 4, 0, PX, H, 0], matG)
    const gp: number[] = []
    const dt = 0.8 * GAMMA_06
    for (let k = 1; k <= 8; k++) {
      const t = k * dt
      const x = t <= 4 ? PX - V_DETOUR * t : apex + V_DETOUR * (t - 4)
      gp.push(x - 0.14, t + 0.05, 0, x + 0.14, t - 0.05, 0)
    }
    const gticks = makeSegments(gp, matGT)
    return { line, ticks, ghost, gticks, matL, matT, matG, matGT }
  }, [])
  useDispose(line, ticks, ghost, gticks)

  useChapterFrame(() => {
    const w = D.w.proper
    const g = group.current
    g.visible = w > 0.003
    if (!g.visible) return
    const pa = D.p.area
    const dtau = D.deeper.dtau
    matL.opacity = 0.8 * w * smoothstep(0.02, 0.07, pa)
    const nT = Math.round(10 * range(pa, 0.06, 0.16))
    ticks.geometry.setDrawRange(0, 2 * nT)
    matT.opacity = w * (0.75 + 0.9 * dtau)
    const gk = smoothstep(0.18, 0.22, pa) * (1 - smoothstep(0.4, 0.46, pa))
    matG.opacity = 0.45 * w * gk
    const nG = Math.round(8 * range(pa, 0.21, 0.33))
    gticks.geometry.setDrawRange(0, 2 * nG)
    matGT.opacity = w * gk * 0.8
    mA.current?.set(PX, 0, 0, 7, w * 0.85)
    mB.current?.set(PX, H, 0, 7, w * 0.85)
  })

  return (
    <group ref={group}>
      <primitive object={line} />
      <primitive object={ticks} />
      <primitive object={ghost} />
      <primitive object={gticks} />
      <Marker ref={mA} />
      <Marker ref={mB} />
      <Tag position={[PX + 0.35, -0.05, 0]} align="left" tone="field" opacity={() => D.w.proper}>
        A
      </Tag>
      <Tag position={[PX + 0.35, H + 0.05, 0]} align="left" tone="field" opacity={() => D.w.proper}>
        B
      </Tag>
      <Tag position={[PX + 0.35, 2.4, 0]} align="left" tone="ink" opacity={() => (D.portrait ? 0 : 1) * D.w.proper * smoothstep(0.15, 0.18, D.p.area)}>
        τ = 8.0 · 10 TICKS
      </Tag>
      {/* phones: no room beside the worldline (the ribbon sits close), so both readings stack above B */}
      <Tag position={[PX, H + 1.35, 0]} align="center" tone="ink" opacity={() => (D.portrait ? 1 : 0) * D.w.proper * smoothstep(0.15, 0.18, D.p.area) * (1 - D.area.nudge)}>
        τ = 8.0 · 10 TICKS
      </Tag>
      <Tag
        position={[PX, H + 0.78, 0]}
        align="center"
        tone="dim"
        opacity={() => (D.portrait ? 1 : 0) * D.w.proper * smoothstep(0.31, 0.34, D.p.area) * (1 - smoothstep(0.4, 0.46, D.p.area))}
      >
        DETOUR AT 0.6c · τ = 6.4 · 8 TICKS
      </Tag>
      <Tag
        position={[PX - V_DETOUR * 4 - 0.3, 4, 0]}
        align="right"
        tone="dim"
        opacity={() => (D.portrait ? 0 : 1) * D.w.proper * smoothstep(0.31, 0.34, D.p.area) * (1 - smoothstep(0.4, 0.46, D.p.area))}
      >
        DETOUR AT 0.6c · τ = 6.4 · 8 TICKS
      </Tag>
      <Tag position={[PX, -0.55, 0]} align="center" tone="dim" opacity={() => D.w.proper * lerp(0, 1, smoothstep(0.06, 0.14, D.p.area))}>
        PARTICLE
      </Tag>
    </group>
  )
}
