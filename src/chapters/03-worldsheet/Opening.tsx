import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, Filament, GlowPoint, GlowPoints, useChapterFrame, type FilamentApi, type GlowPointApi, type GlowPointsApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { clamp, easeOutCubic, lerp, range, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { D } from './director'
import { cAt } from './layout'
import { createFloorMaterial, lightConePoints, lineMaterial, makeLine, makeSegments } from './gl'
import { Tag, useDispose, type TagApi } from './parts'
import { X_MOVE, X_REST, Z_REST } from './stageConsts'

/* ───────────────────────── Floor + time axis ───────────────────────── */

export function Floor() {
  const mat = useMemo(() => createFloorMaterial(), [])
  useDispose(mat)
  const mesh = useRef<THREE.Mesh>(null!)
  useChapterFrame(() => {
    const m = mesh.current
    const w = D.w.floor
    m.visible = w > 0.003
    mat.uniforms.uOpacity.value = 0.34 * w
    m.position.set(D.floor.x, 0, 0)
    m.scale.set(D.floor.w, D.floor.d, 1)
  })
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={-2}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}

const AXIS_H = 10
export function TimeAxis() {
  const group = useRef<THREE.Group>(null!)
  const tag = useRef<TagApi>(null)
  const { axis, ticks, head, matA, matT } = useMemo(() => {
    const matA = lineMaterial(COLORS.field, 0)
    const matT = lineMaterial(COLORS.field, 0)
    const axis = makeLine([0, 0, 0, 0, AXIS_H + 0.5, 0], matA)
    const tp: number[] = []
    for (let i = 1; i <= AXIS_H; i++) {
      const l = i % 5 === 0 ? 0.32 : 0.16
      tp.push(0, i, 0, l, i, 0)
    }
    const ticks = makeSegments(tp, matT)
    const head = makeSegments([0, AXIS_H + 0.5, 0, -0.1, AXIS_H + 0.22, 0, 0, AXIS_H + 0.5, 0, 0.1, AXIS_H + 0.22, 0], matA)
    return { axis, ticks, head, matA, matT }
  }, [])
  useDispose(axis.geometry, ticks.geometry, head.geometry, matA, matT)
  useChapterFrame(() => {
    const g = group.current
    const w = D.w.axis
    g.visible = w > 0.003
    if (!g.visible) return
    g.position.set(D.axis.x, 0, D.axis.z)
    const k = D.axisK
    axis.scale.y = Math.max(1e-3, k)
    head.visible = k > 0.98
    matA.opacity = 0.75 * w
    matT.opacity = 0.6 * w
    const n = Math.floor(k * AXIS_H + 1e-3)
    ticks.geometry.setDrawRange(0, n * 2)
    tag.current?.group.position.set(0.18, AXIS_H + 0.62, 0)
  })
  return (
    <group ref={group}>
      <primitive object={axis} />
      <primitive object={ticks} />
      <primitive object={head} />
      <Tag ref={tag} align="left" tone="field" opacity={() => D.w.axis * smoothstep(0.9, 1, D.axisK)}>
        ct [ℓ] ↑
      </Tag>
      <Tag position={[0.42, 5, 0]} align="left" tone="dim" opacity={() => D.w.axis * smoothstep(0.5, 0.6, D.axisK) * 0.9}>
        5
      </Tag>
    </group>
  )
}

/* ───────────────────────── The Thread: H0 → H1 → lies in space → rotating open string ───────────────────────── */

const NT = 200
export function Thread() {
  const api = useRef<FilamentApi>(null)
  const points = useMemo(() => new Float32Array(NT * 3), [])
  const warm = useMemo(() => new THREE.Color(COLORS.filament), [])
  const warmCore = useMemo(() => new THREE.Color(COLORS.filamentCore), [])
  const ink = useMemo(() => new THREE.Color(COLORS.ink), [])
  const tmp = useMemo(() => new THREE.Color(), [])
  const { omega } = HANDOFF.H1

  useChapterFrame(({ t }) => {
    const a = api.current
    if (!a) return
    const w = D.w.thread
    a.group.visible = w > 0.003
    if (!a.group.visible) return
    const c = D.c
    const grow = easeOutCubic(range(c, 1.0, 1.42))
    const len = D.threadLen * lerp(0.04, 1, grow)
    const amb = ambient()
    // H1: free-ended open string, fundamental + second mode (openStringFn), amplitude ∝ length
    const amp = HANDOFF.H1.amplitude * (D.threadLen / 4.2) * lerp(0.2, 1, grow) * D.vib
    const beta = (Math.PI / 2) * D.lie
    const cb = Math.cos(beta)
    const sb = Math.sin(beta)
    const tN = D.tN
    const ct = Math.cos(tN)
    const st = Math.sin(tN)
    const tt = amb ? t : 0.6
    // after the lie-down the rotating solution has s ∈ [−1, 1] (r₀ = 1)
    for (let i = 0; i < NT; i++) {
      const u = i / (NT - 1)
      const s = Math.PI * u
      const a1 = Math.cos(s) * Math.cos(omega * tt)
      const a2 = Math.cos(2 * s) * Math.cos(2 * omega * tt + 0.6)
      const x = (u - 0.5) * len
      const y0 = amp * (0.8 * a1 + 0.45 * a2)
      const z0 = amp * 0.35 * Math.cos(s) * Math.sin(omega * tt)
      // lie down: the vibration turns from "up" (future) into the floor plane (space)
      const y = y0 * cb - z0 * sb
      const z = y0 * sb + z0 * cb
      // rotate about the midpoint by angle tN (1 rad per unit of ct) and lift to the present ct = tN
      points[i * 3] = x * ct - z * st
      points[i * 3 + 1] = tN + y
      points[i * 3 + 2] = x * st + z * ct
    }
    a.update()
    const m = a.material
    // unresolved (tiny) → ink-white; resolved → warm
    const warmK = smoothstep(0.25, 0.8, grow)
    tmp.copy(ink).lerp(warm, warmK)
    m.uniforms.uGlow.value.copy(tmp)
    tmp.copy(ink).lerp(warmCore, warmK)
    m.uniforms.uCore.value.copy(tmp)
    const dim = 1 - 0.4 * smoothstep(0.46, 0.56, D.p.open) * (1 - smoothstep(0.0, 0.12, D.p.sheet))
    m.uniforms.uOpacity.value = w * dim * clamp(grow * 3, 0, 1)
    m.uniforms.uWidth.value = lerp(HANDOFF.H1.width, 0.13, smoothstep(1.5, 2.4, c))
  })

  return <Filament ref={api} points={points} count={NT} width={HANDOFF.H1.width} beads minPixels={1} coreFraction={0.14} intensity={1.1} renderOrder={5} />
}

/* ───────────────────────── Opening: two particles, film frames → worldlines, light cone ───────────────────────── */

const FRAMES = 12

export function OpeningParticles() {
  const moving = useRef<GlowPointApi>(null)
  const rest = useRef<GlowPointApi>(null)
  const frames = useRef<GlowPointsApi>(null)
  const cone = useRef<THREE.Group>(null!)
  const coneTag = useRef<TagApi>(null)
  const endTag = useRef<TagApi>(null)
  const vTag = useRef<TagApi>(null)
  const restTag = useRef<TagApi>(null)
  const pointTag = useRef<TagApi>(null)
  const group = useRef<THREE.Group>(null!)

  const fr = useMemo(() => {
    const positions = new Float32Array(FRAMES * 3)
    const alphas = new Float32Array(FRAMES)
    const sizes = new Float32Array(FRAMES).fill(0.2)
    for (let i = 0; i < FRAMES; i++) {
      const ti = i * 0.5
      positions.set([X_MOVE + 0.3 * ti, ti, 0], i * 3)
    }
    return { positions, alphas, sizes }
  }, [])

  const { lineM, lineR, matM, matR, coneObj, matC } = useMemo(() => {
    const matM = lineMaterial(COLORS.field, 0)
    const matR = lineMaterial(COLORS.field, 0)
    const matC = lineMaterial(COLORS.field, 0)
    return {
      matM,
      matR,
      matC,
      lineM: makeLine(new Float32Array(6), matM),
      lineR: makeLine(new Float32Array(6), matR),
      coneObj: makeSegments(lightConePoints(0.6), matC),
    }
  }, [])
  useDispose(lineM, lineR, coneObj)

  useChapterFrame(() => {
    const wP = D.w.openParticles
    const wR = D.w.rest
    const po = D.p.open
    const ps = D.p.sheet
    group.current.visible = Math.max(wP, wR) > 0.003
    const tP = D.tP
    const tR = D.tRest
    // points of light
    if (moving.current) {
      moving.current.position.set(X_MOVE + 0.3 * tP, tP, 0)
      moving.current.material.uniforms.uIntensity.value = 1.1 * wP * (1 - smoothstep(0.0, 0.12, ps))
    }
    if (rest.current) {
      // the particle at rest keeps climbing with the ribbon's present in Beat 1: point → line, line → sheet
      rest.current.position.set(X_REST, tR, Z_REST)
      rest.current.material.uniforms.uIntensity.value = 0.9 * wR
    }
    // film frames stack, then fuse into one hairline
    const fuse = smoothstep(0.72, 0.82, po)
    const al = frames.current?.geometry.getAttribute('aAlpha') as THREE.BufferAttribute | undefined
    if (al) {
      for (let i = 0; i < FRAMES; i++) {
        const ti = i * 0.5
        fr.alphas[i] = smoothstep(ti - 0.05, ti + 0.25, tP) * (1 - fuse) * 0.75 * wP
      }
      al.needsUpdate = true
    }
    // worldlines
    const pm = lineM.geometry.getAttribute('position') as THREE.BufferAttribute
    pm.setXYZ(0, X_MOVE, 0, 0)
    pm.setXYZ(1, X_MOVE + 0.3 * tP, tP, 0)
    pm.needsUpdate = true
    matM.opacity = wP * lerp(0.18, 0.85, fuse)
    const pr = lineR.geometry.getAttribute('position') as THREE.BufferAttribute
    pr.setXYZ(0, X_REST, 0, Z_REST)
    pr.setXYZ(1, X_REST, tR, Z_REST)
    pr.needsUpdate = true
    matR.opacity = wR * lerp(0.6, 0.8, smoothstep(0.1, 0.3, ps))
    vTag.current?.group.position.set(X_MOVE + 0.3 * tP * 0.55 + 0.25, tP * 0.55, 0)
    restTag.current?.group.position.set(X_REST, -0.55, Z_REST)
    pointTag.current?.group.position.set(X_REST, Math.max(tR, 8) + 0.75, Z_REST)

    // light cone: first at the moving particle's "now", then it snaps onto the ribbon's endpoint and rides up
    const inOpen = smoothstep(0.8, 0.9, po)
    const snap = smoothstep(0.1, 0.22, ps)
    const cx = lerp(X_MOVE + 0.3 * tP, Math.cos(D.tN), snap)
    const cy = lerp(tP, D.tN, snap)
    const cz = lerp(0, Math.sin(D.tN), snap)
    cone.current.position.set(cx, cy, cz)
    // it has made its point once the ribbon is fully grown: clear the top for the labels
    const wC = inOpen * (1 - smoothstep(cAt('sheet', 0.66), cAt('sheet', 0.76), D.c))
    cone.current.visible = wC > 0.003
    matC.opacity = 0.5 * wC
    coneTag.current?.group.position.set(0.72, 0.62, 0)
    endTag.current?.group.position.set(0.72, 0.62, 0)
  })

  return (
    <>
      <group ref={group}>
        <primitive object={lineM} />
        <primitive object={lineR} />
        <GlowPoints ref={frames} positions={fr.positions} sizes={fr.sizes} alphas={fr.alphas} color={COLORS.ink} minPixels={2.2} intensity={1} />
        <GlowPoint ref={moving} size={0.3} minPixels={2.4} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} />
        <GlowPoint ref={rest} size={0.26} minPixels={2.2} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} />
        <Tag ref={vTag} align="left" tone="dim" opacity={() => D.w.openParticles * smoothstep(0.58, 0.66, D.p.open) * (1 - smoothstep(0.02, 0.1, D.p.sheet))}>
          v = 0.3c · 17°
        </Tag>
        <Tag ref={restTag} align="center" tone="dim" opacity={() => D.w.rest * smoothstep(0.58, 0.66, D.p.open) * (1 - smoothstep(0.02, 0.1, D.p.sheet))}>
          AT REST
        </Tag>
        <Tag ref={pointTag} align="center" tone="ink" opacity={() => D.w.rest * smoothstep(0.7, 0.78, D.p.sheet)}>
          POINT · LINE
        </Tag>
      </group>
      <group ref={cone}>
        <primitive object={coneObj} />
        <Tag ref={coneTag} align="left" tone="field" opacity={() => smoothstep(0.82, 0.92, D.p.open) * (1 - smoothstep(0.06, 0.14, D.p.sheet))}>
          LIGHT · 45°
        </Tag>
        <Tag ref={endTag} align="left" tone="ink" opacity={() => smoothstep(0.2, 0.3, D.p.sheet) * (1 - smoothstep(0.6, 0.68, D.p.sheet))}>
          ENDPOINT · v = c
        </Tag>
      </group>
    </>
  )
}
