import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, GlowPoint, GlowPoints, createIsoGridMaterial, useChapterFrame, type GlowPointApi, type GlowPointsApi } from '@/gl'
import { ambient } from '@/core/time'
import { damp, smoothstep, TAU } from '@/core/math'
import { Thread, type ThreadApi } from './Thread'

/*
 * One "world": a hidden circle drawn as a cylinder (axis = local x), with what lives on it —
 * the picture model of content/08-duality.md § Lab:
 *   winding coil (b ≥ 1): σ ∈ [0,2π), θ = bσ + φ(t), x = h·sin σ, h = 0.10 + 0.06b, radius ρ + 0.02
 *   unwound string (b = 0): loop of radius 0.16 lying on the surface at θ₀ = φ(t)
 *   momentum wave ring (a ≥ 1): r(θ) = ρ[1 + 0.06 cos(aθ − 1.2t)] — the honest part; the same crest pattern is
 *     also drawn as a small axial ripple, x = x₀ + A·cos(aθ − 1.2t), so the a whole wavelengths read as a bumps
 *     from the ¾ view (cartoon: the wave's phase drawn as a displacement)
 *   vibration (S > 0): normal displacement 0.03√S·sin(kσ − 2t), k = 2 + (S mod 4)
 *   φ(t) = 0.6·a·t: a slow rigid spin standing in for momentum (cartoon)
 * The director (Scene.tsx) writes a WorldState every frame; this component only draws it.
 */

export interface StringSpec {
  /** windings |w| */
  b: number
  /** momentum |n| (drives the cartoon circulation) */
  a: number
  /** vibration level N+Ñ */
  S: number
}

export interface WorldState {
  on: boolean
  x: number
  y: number
  z: number
  scale: number
  yaw: number
  pitch: number
  len: number
  rho: number
  cylOp: number
  reveal: number
  /** target string state (discrete changes crossfade) */
  spec: StringSpec
  threadOp: number
  /** 0..1 B3 stretch: the unwound loop stretches around the circle */
  stretch: number
  /** extra brightness factor (energy ∝ length) */
  glow: number
  /** thread offset along the axis */
  threadX: number
  /** momentum wave ring */
  waveA: number
  waveOp: number
  waveX: number
  waveFlash: number
  /** point particle mode: an Ink point instead of a string */
  point: boolean
  /** B3 demo point (independent of `point`): opacity, angle, trail length (radians) */
  demoOp: number
  demoTheta: number
  demoTrail: number
  demoX: number
  /** written back by the World: the current string's cartoon phase φ (read by the outro) */
  phiOut: number
}

export const makeWorld = (): WorldState => ({
  on: false,
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  yaw: 0.44,
  pitch: 0.21,
  len: 2.2,
  rho: 0.9,
  cylOp: 1,
  reveal: 1,
  spec: { b: 0, a: 0, S: 0 },
  threadOp: 1,
  stretch: 0,
  glow: 1,
  threadX: 0,
  waveA: 1,
  waveOp: 1,
  waveX: -0.7,
  waveFlash: 0,
  point: false,
  demoOp: 0,
  demoTheta: 0,
  demoTrail: 0,
  demoX: 0,
  phiOut: 0.9,
})

const NT = 240
const NW = 160
const NTR = 40
/** Most crests the wave ring ever shows (the lab's selected families have n ≤ 16; beads beyond 16 are not needed). */
const MAXC = 16
const BACK = 0.26

type Slot = { b: number; a: number; S: number; point: boolean; op: number; phi: number }

export function World({ state, threadWidth = 0.05 }: { state: WorldState; threadWidth?: number }) {
  const camera = useThree((s) => s.camera)
  const root = useRef<THREE.Group>(null!)
  const orient = useRef<THREE.Group>(null!)
  const cyl = useRef<THREE.Mesh>(null!)
  const th = [useRef<ThreadApi>(null), useRef<ThreadApi>(null)]
  const wave = useRef<ThreadApi>(null)
  const trail = useRef<ThreadApi>(null)
  const pt = useRef<GlowPointApi>(null)
  const demo = useRef<GlowPointApi>(null)
  const crests = useRef<GlowPointsApi>(null)
  const crestPos = useMemo(() => new Float32Array(MAXC * 3), [])
  const crestAlpha = useMemo(() => new Float32Array(MAXC), [])

  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true)
    g.rotateZ(-Math.PI / 2)
    return g
  }, [])
  const mat = useMemo(() => {
    // the space itself stays quiet (dim hairlines, a fresnel silhouette) so the wave and the Thread lead
    const m = createIsoGridMaterial({
      grid: [24, 4],
      lineWidth: 0.7,
      lineColor: '#44597C',
      fill: 0.018,
      fresnel: 0.8,
      edge: 1.4,
      edgeColor: '#DCE7F7',
      revealAxis: 'v',
    })
    // hidden-line cue: the far wall of the circle (seen from inside) draws dimmer
    const extra = m.uniforms as unknown as Record<string, { value: number }>
    extra.uBack = { value: BACK + 0.12 }
    // clean ground for the momentum wave: grid rings near it (in uv.v, along the axis) are dimmed
    extra.uWaveV = { value: 0.5 }
    extra.uWaveHalf = { value: 0.1 }
    extra.uWaveDim = { value: 0 }
    m.onBeforeCompile = (sh) => {
      for (const k of ['uBack', 'uWaveV', 'uWaveHalf', 'uWaveDim']) sh.uniforms[k] = extra[k]
      sh.fragmentShader = sh.fragmentShader
        .replace('uniform float uDpr;', 'uniform float uDpr;\n  uniform float uBack;\n  uniform float uWaveV;\n  uniform float uWaveHalf;\n  uniform float uWaveDim;')
        .replace(
          'float line = max(lu, lv);',
          'float wm = uWaveDim * (1.0 - smoothstep(uWaveHalf * 0.6, uWaveHalf, abs(vUv.y - uWaveV)));\n    float line = max(lu * (1.0 - 0.45 * wm), lv * (1.0 - wm));',
        )
        .replace('gl_FragColor = vec4(col * uOpacity, 1.0);', 'gl_FragColor = vec4(col * uOpacity * (gl_FrontFacing ? 1.0 : uBack), 1.0);')
    }
    m.customProgramCacheKey = () => 'du-world-cyl'
    return m
  }, [])
  useLayoutEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )

  const st = useMemo(
    () => ({
      slots: [
        { b: 0, a: 0, S: 0, point: false, op: 1, phi: 0.9 },
        { b: 0, a: 0, S: 0, point: false, op: 0, phi: 0.9 },
      ] as Slot[],
      cur: 0,
      init: false,
      waveShown: 1,
      waveEnv: 1,
      cam: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }),
    [],
  )

  useChapterFrame((f) => {
    const S = state
    const g = root.current
    g.visible = S.on
    if (!S.on) return
    const { t, dt } = f
    const frozen = dt === 0
    const amb = ambient()
    g.position.set(S.x, S.y, S.z)
    g.scale.setScalar(S.scale)
    orient.current.rotation.set(S.pitch, S.yaw, 0, 'XYZ')
    g.updateMatrixWorld(true)
    // camera in this world's local frame (for the depth cue)
    st.cam.copy(camera.position)
    orient.current.worldToLocal(st.cam)

    // cylinder
    const rho = S.rho
    cyl.current.scale.set(S.len, rho, rho)
    const cu = mat.uniforms
    cu.uGrid.value.y = S.len > 3.3 ? 8 : 4
    cu.uOpacity.value = S.cylOp
    cu.uReveal.value = S.reveal
    cyl.current.visible = S.cylOp > 0.003

    // ── string slots: crossfade on discrete changes ──
    const sp = S.spec
    const first = !st.init
    const cur = st.slots[st.cur]
    const same = cur.b === sp.b && cur.a === sp.a && cur.S === sp.S && cur.point === S.point
    if (!st.init || frozen) {
      if (!same) {
        cur.b = sp.b
        cur.a = sp.a
        cur.S = sp.S
        cur.point = S.point
      }
      cur.op = 1
      st.slots[1 - st.cur].op = 0
      st.init = true
    } else if (!same) {
      const other = st.slots[1 - st.cur]
      if (other.op < 0.02 || !(other.b === sp.b && other.a === sp.a && other.S === sp.S && other.point === S.point)) {
        other.b = sp.b
        other.a = sp.a
        other.S = sp.S
        other.point = S.point
        other.phi = cur.phi
      }
      st.cur = 1 - st.cur
    }
    for (let k = 0; k < 2; k++) {
      const sl = st.slots[k]
      if (!frozen) sl.op = damp(sl.op, k === st.cur ? 1 : 0, 7, dt)
      sl.phi += 0.6 * sl.a * dt * amb
    }
    S.phiOut = st.slots[st.cur].phi

    const rc = rho + 0.02
    for (let k = 0; k < 2; k++) {
      const api = th[k].current
      if (!api) continue
      const sl = st.slots[k]
      const op = sl.op * S.threadOp
      api.mesh.visible = op > 0.004 && !sl.point
      if (!api.mesh.visible) continue
      const P = api.points
      const F = api.fade
      const vibA = sl.S > 0 ? 0.03 * Math.sqrt(sl.S) : 0
      const kv = 2 + (sl.S % 4)
      let len = 0
      let px = 0
      let py = 0
      let pz = 0
      for (let i = 0; i < NT; i++) {
        const sg = (i / NT) * TAU
        let x: number
        let ang: number
        let r = rc
        if (sl.b >= 1) {
          const h = 0.1 + 0.06 * sl.b
          ang = sl.b * sg + sl.phi
          x = h * Math.sin(sg)
        } else {
          // unwound loop lying on the surface; B3 stretches it around the circle
          const s = S.stretch
          const ext = (0.16 / rc) * (1 - s) + Math.PI * 0.985 * s
          ang = sl.phi + ext * Math.sin(sg)
          x = 0.16 * (1 - 0.55 * s) * Math.cos(sg)
        }
        if (vibA > 0) r += vibA * Math.sin(kv * sg - 2 * t * amb)
        x += S.threadX
        const cy = Math.cos(ang)
        const sz = Math.sin(ang)
        const X = x
        const Y = r * cy
        const Z = r * sz
        P[i * 3] = X
        P[i * 3 + 1] = Y
        P[i * 3 + 2] = Z
        // facing: radial direction · direction to camera
        const vx = st.cam.x - X
        const vy = st.cam.y - Y
        const vz = st.cam.z - Z
        const vl = Math.hypot(vx, vy, vz) || 1
        const facing = (cy * vy + sz * vz) / vl
        F[i] = BACK + (1 - BACK) * smoothstep(-0.18, 0.22, facing)
        if (i > 0) len += Math.hypot(X - px, Y - py, Z - pz)
        px = X
        py = Y
        pz = Z
      }
      api.update()
      // energy ∝ length: brighter when stretched around a big circle (clamped, cartoon)
      const lenGain = Math.min(1.35, Math.max(0.7, 0.55 + len / 9))
      api.material.uniforms.uOpacity.value = op
      api.material.uniforms.uIntensity.value = 1.05 * S.glow * lenGain
    }

    // ── point particle (lab point mode) ──
    const ptOp = st.slots[st.cur].point ? st.slots[st.cur].op * S.threadOp : st.slots[1 - st.cur].point ? st.slots[1 - st.cur].op * S.threadOp : 0
    if (pt.current) {
      pt.current.visible = ptOp > 0.004
      if (pt.current.visible) {
        const sl = st.slots[st.slots[st.cur].point ? st.cur : 1 - st.cur]
        const a = sl.phi
        pt.current.position.set(S.threadX, rc * Math.cos(a), rc * Math.sin(a))
        pt.current.material.uniforms.uIntensity.value = 1.1 * ptOp
      }
    }

    // ── B3 demo point + trail ──
    const dOp = S.demoOp
    if (demo.current) demo.current.visible = dOp > 0.004
    if (trail.current) trail.current.mesh.visible = dOp > 0.004 && S.demoTrail > 0.01
    if (dOp > 0.004 && demo.current) {
      const a = S.demoTheta
      demo.current.position.set(S.demoX, rc * Math.cos(a), rc * Math.sin(a))
      demo.current.material.uniforms.uIntensity.value = 1.2 * dOp
      const tr = trail.current
      if (tr && S.demoTrail > 0.01) {
        for (let i = 0; i < NTR; i++) {
          const u = i / (NTR - 1)
          const aa = a - S.demoTrail * (1 - u)
          tr.points[i * 3] = S.demoX
          tr.points[i * 3 + 1] = rc * Math.cos(aa)
          tr.points[i * 3 + 2] = rc * Math.sin(aa)
          const vy = st.cam.y - rc * Math.cos(aa)
          const vz = st.cam.z - rc * Math.sin(aa)
          const vl = Math.hypot(st.cam.x, vy, vz) || 1
          const facing = (Math.cos(aa) * vy + Math.sin(aa) * vz) / vl
          tr.fade[i] = u * u * (BACK + (1 - BACK) * smoothstep(-0.18, 0.22, facing))
        }
        tr.update()
        tr.material.uniforms.uOpacity.value = dOp
      }
    }

    // ── momentum wave ring ──
    const w = wave.current
    if (w) {
      if (frozen || first) {
        st.waveShown = S.waveA
        st.waveEnv = 1
      } else if (st.waveShown !== S.waveA) {
        st.waveEnv = damp(st.waveEnv, 0, 14, dt)
        if (st.waveEnv < 0.04) st.waveShown = S.waveA
      } else st.waveEnv = damp(st.waveEnv, 1, 8, dt)
      const aW = st.waveShown
      const vis = S.waveOp * (aW >= 1 ? 1 : 0.25)
      w.mesh.visible = vis > 0.004
      const ax = aW >= 1 ? (0.1 * rho + 0.045) * st.waveEnv : 0
      const extra = mat.uniforms as unknown as Record<string, { value: number }>
      extra.uWaveV.value = S.waveX / S.len + 0.5
      extra.uWaveHalf.value = (ax + 0.3) / S.len
      extra.uWaveDim.value = aW >= 1 ? 0.9 * Math.min(1, S.waveOp * 1.5) : 0
      if (w.mesh.visible) {
        const amp = aW >= 1 ? 0.06 * st.waveEnv : 0
        for (let i = 0; i < NW; i++) {
          const a = (i / NW) * TAU
          const ph = Math.cos(aW * a - 1.2 * t * amb)
          const r = rho * (1 + amp * ph)
          const cy = Math.cos(a)
          const sz = Math.sin(a)
          const X = S.waveX + ax * ph
          const Y = r * cy
          const Z = r * sz
          w.points[i * 3] = X
          w.points[i * 3 + 1] = Y
          w.points[i * 3 + 2] = Z
          const vx = st.cam.x - X
          const vy = st.cam.y - Y
          const vz = st.cam.z - Z
          const vl = Math.hypot(vx, vy, vz) || 1
          // n crests read as n bright beads of the wave, so the whole wavelengths can be counted
          // n crests read as n bright arcs, near and far alike, so the whole wavelengths can be counted
          const crest = aW >= 1 ? 0.1 + 0.9 * Math.pow(0.5 + 0.5 * Math.cos(aW * a - 1.2 * t * amb), 4) * st.waveEnv + 0.9 * (1 - st.waveEnv) : 1
          w.fade[i] = crest * (0.6 + 0.4 * smoothstep(-0.18, 0.22, (cy * vy + sz * vz) / vl))
        }
        w.update()
        w.material.uniforms.uOpacity.value = vis
        w.material.uniforms.uIntensity.value = 1.3 + 1.6 * S.waveFlash
      }
      // crest beads: where cos(nθ − 1.2t) = 1 — exactly n of them, travelling round together
      const cp = crests.current
      if (cp) {
        const on = w.mesh.visible && aW >= 1
        cp.visible = on
        if (on) {
          const rr = rho * (1 + 0.06 * st.waveEnv) + 0.01
          for (let k = 0; k < MAXC; k++) {
            const live = k < aW
            const a = (1.2 * t * amb + TAU * k) / Math.max(1, aW)
            crestPos[k * 3] = S.waveX + ax
            crestPos[k * 3 + 1] = rr * Math.cos(a)
            crestPos[k * 3 + 2] = rr * Math.sin(a)
            crestAlpha[k] = live ? vis * st.waveEnv : 0
          }
          cp.geometry.getAttribute('position').needsUpdate = true
          cp.geometry.getAttribute('aAlpha').needsUpdate = true
        }
      }
    }
  })

  return (
    <group ref={root} visible={false}>
      <group ref={orient}>
        <mesh ref={cyl} geometry={geo} material={mat} renderOrder={1} />
        <Thread ref={th[0]} count={NT} closed width={threadWidth} minPixels={0.9} renderOrder={3} />
        <Thread ref={th[1]} count={NT} closed width={threadWidth} minPixels={0.9} renderOrder={3} />
        <Thread ref={wave} count={NW} closed width={0.045} minPixels={1.1} color={COLORS.field} coreColor="#B9CFEE" coreFraction={0.4} renderOrder={2} />
        <Thread ref={trail} count={NTR} width={0.03} minPixels={0.8} color={COLORS.ink} coreColor="#FFFFFF" intensity={0.8} renderOrder={3} />
        <GlowPoint ref={pt} size={0.2} minPixels={2.5} color={COLORS.ink} coreColor="#FFFFFF" intensity={1.1} visible={false} renderOrder={4} />
        <GlowPoints ref={crests} positions={crestPos} alphas={crestAlpha} size={0.13} minPixels={4.5} color="#CFE0F6" intensity={1.25} visible={false} renderOrder={4} />
        <GlowPoint ref={demo} size={0.22} minPixels={2.5} color={COLORS.ink} coreColor="#FFFFFF" intensity={1.2} visible={false} renderOrder={4} />
      </group>
    </group>
  )
}
