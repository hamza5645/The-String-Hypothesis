import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Filament, GlowPoint, SceneLabel, useChapterFrame, COLORS, type FilamentApi, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { claimPointer, explore, setStageCursor } from '@/core/explore'
import { pluck } from '@/core/audio'
import { clamp, damp, lerp, smoothstep } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { Status } from '@/ui'
import { usePrologue } from './store'

/*
 * The Thread at rest, as specified in content/01-scale-down.md § Prologue.
 * Model: open string with free (Neumann) ends, y(σ,t) = Σₙ aₙ(t)·cos(nπσ), n = 1..8.
 *   pluck: y₀(σ) = h·exp(−(σ−σ₀)²/(2·0.06²)),  aₙ(0) = 2∫ y₀ cos(nπσ) dσ
 *   ring:  aₙ(t) = aₙ(0)·cos(2π·n·f₁·t)·e^(−γₙ t),  f₁ = 0.9 Hz,  γₙ = 0.6 + 0.15n  (damping is fictional)
 * Recede (progress 0.55 → 1): the Thread shrinks until unresolved, cools to ink-white → H0.
 */

const N = 256
const MODES = 8
const F1 = 0.9
const WIDTH = 0.17

const cosTable = (() => {
  const t = new Float32Array((MODES + 1) * N)
  for (let n = 0; n <= MODES; n++) for (let i = 0; i < N; i++) t[n * N + i] = Math.cos(n * Math.PI * (i / (N - 1)))
  return t
})()

export default function Scene() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const thread = useRef<FilamentApi>(null)
  const glow = useRef<GlowPointApi>(null)
  const group = useRef<THREE.Group>(null!)
  const hit = useRef<THREE.Mesh>(null!)

  const points = useMemo(() => new Float32Array(N * 3), [])
  const aspect0 = size.width / Math.max(1, size.height)
  // Portrait: the opening beat sits just under the Thread, so the note goes above its right end,
  // in the band below the subtitle (right-aligned, clear of the subtitle's short last line).
  const portrait = aspect0 < 0.8
  const hvis0 = 2 * HANDOFF.camera.position[2] * Math.tan(((HANDOFF.camera.fov * Math.PI) / 180) / 2)
  const labelPos: [number, number, number] = portrait
    ? [Math.min(0.4 * hvis0 * aspect0, 4.75), -0.025 * hvis0 + 0.33, 0]
    : [0.3 * 0.56 * 6.306 * aspect0 * 0.5, -0.62, 0]
  const st = useMemo(
    () => ({
      amp: new Float64Array(MODES + 1), // aₙ(0) of the current ringing
      tPluck: -1e3,
      f1: F1,
      drag: false,
      sigma0: 0.5,
      h: 0,
      shape: new Float32Array(N), // displayed displacement (without nudge), world units
      nudge: new Float32Array(N),
      lastReq: usePrologue.getState().pluckRequests,
      parX: 0,
      parY: 0,
      L: 5,
      y0: 0,
      pxPerUnit: 100,
    }),
    [],
  )

  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const hitPt = useMemo(() => new THREE.Vector3(), [])
  const warm = useMemo(() => new THREE.Color(COLORS.filament), [])
  const warmCore = useMemo(() => new THREE.Color(COLORS.filamentCore), [])
  const inkC = useMemo(() => new THREE.Color(COLORS.ink), [])
  const tmpC = useMemo(() => new THREE.Color(), [])

  // Pointer → world point on the z=0 plane (in the thread group's unscaled frame).
  const pointerWorld = () => {
    ndc.set(explore.nx, explore.ny)
    ray.setFromCamera(ndc, camera)
    return ray.ray.intersectPlane(plane, hitPt)
  }

  const release = (t: number) => {
    if (!st.drag) return
    st.drag = false
    setStageCursor('')
    // tap without a pull → a gentle default pluck
    let h = st.h
    if (Math.abs(h) < 0.01 * st.L) h = 0.07 * st.L
    // project the released shape (gaussian + current ringing) onto the free-end modes
    const s2 = 2 * 0.06 * 0.06
    for (let n = 0; n <= MODES; n++) {
      let acc = 0
      for (let i = 0; i < N; i++) {
        const sg = i / (N - 1)
        const y0 = h * Math.exp(-((sg - st.sigma0) ** 2) / s2) + ringing(i, t)
        acc += y0 * cosTable[n * N + i]
      }
      acc /= N
      st.amp[n] = n === 0 ? acc : 2 * acc
    }
    st.tPluck = t
    st.f1 = prefersReducedMotion() ? 0.3 : F1
    let max = 1e-6
    for (let n = 1; n <= MODES; n++) max = Math.max(max, Math.abs(st.amp[n]))
    pluck(
      110,
      Array.from({ length: MODES }, (_, k) => ({ n: k + 1, amp: Math.abs(st.amp[k + 1]) / max })),
      { decay: 3.2, gain: 0.7 },
    )
  }

  // current modal ringing at point i (world units)
  const ringing = (i: number, t: number) => {
    const dt = t - st.tPluck
    if (dt < 0 || dt > 14) return 0
    let y = st.amp[0] * Math.exp(-3 * dt) // rigid shift relaxes (not physics — keeps the release seamless)
    for (let n = 1; n <= MODES; n++) {
      y += st.amp[n] * Math.cos(2 * Math.PI * n * st.f1 * dt) * Math.exp(-(0.6 + 0.15 * n) * dt) * cosTable[n * N + i]
    }
    return y
  }

  useEffect(() => {
    const up = () => release(currentT.current)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const currentT = useRef(0)
  // visible=false does NOT stop R3F raycasts — gate the grab band's handlers explicitly
  const interactiveRef = useRef(true)

  useChapterFrame((f) => {
    const { t, dt, progress, h } = f
    currentT.current = t
    const amb = ambient()

    // geometry of the composition
    const hvis = 2 * HANDOFF.camera.position[2] * Math.tan(((HANDOFF.camera.fov * Math.PI) / 180) / 2)
    const aspect = size.width / Math.max(1, size.height)
    const wvis = hvis * aspect
    st.L = Math.min(aspect < 0.8 ? 0.8 * wvis : 0.56 * wvis, 9.5)
    st.pxPerUnit = size.height / hvis
    const k = smoothstep(0.55, 1.0, progress) // recede
    const shrink = Math.exp(-k * Math.log(420))
    st.y0 = lerp(-0.025 * hvis, 0, smoothstep(0, 0.6, k))

    // external pluck requests (keyboard / button)
    const req = usePrologue.getState().pluckRequests
    if (req !== st.lastReq) {
      st.lastReq = req
      st.drag = true
      st.sigma0 = 0.3
      st.h = 0.08 * st.L
      release(t)
    }

    // pointer
    const interactive = h.active() && k < 0.05
    interactiveRef.current = interactive
    const pw = interactive && (explore.hovering || st.drag) ? pointerWorld() : null
    if (st.drag && pw) {
      st.h = clamp(pw.y - st.y0, -0.12 * st.L, 0.12 * st.L)
      st.sigma0 = clamp(pw.x / st.L + 0.5, 0.02, 0.98)
    }

    // idle tremble: free-end modes, rms 0.4%·L at n=1, falling as 1/n², band-limited wobble
    const idleA = 0.004 * st.L * Math.SQRT2 * amb
    for (let i = 0; i < N; i++) {
      let y = 0
      if (idleA > 0) {
        for (let n = 1; n <= MODES; n++) {
          const ph = n * 1.713
          const env = 0.65 + 0.35 * Math.sin(0.23 * n * t + n * 2.1)
          y += (idleA / (n * n)) * Math.sin(2 * Math.PI * n * F1 * 0.55 * t + ph) * env * cosTable[n * N + i]
        }
      }
      y += ringing(i, t)
      if (st.drag) {
        const sg = i / (N - 1)
        y += st.h * Math.exp(-((sg - st.sigma0) ** 2) / (2 * 0.06 * 0.06))
      }
      st.shape[i] = y
    }

    // hover nudge: within 48px the pointer pushes the Thread away (≤ 6px), springing back
    const px = st.pxPerUnit
    for (let i = 0; i < N; i++) {
      let target = 0
      if (pw && !st.drag) {
        const x = (i / (N - 1) - 0.5) * st.L
        const y = st.y0 + st.shape[i]
        const dxp = (x - pw.x) * px
        const dyp = (y - pw.y) * px
        if (Math.abs(dyp) < 48 && Math.abs(dxp) < 140) {
          const fall = (1 - Math.abs(dyp) / 48) * Math.exp(-(dxp * dxp) / (2 * 38 * 38))
          target = (Math.sign(dyp) || 1) * (6 / px) * fall
        }
      }
      st.nudge[i] = damp(st.nudge[i], target, target !== 0 ? 16 : 7, Math.max(dt, 1 / 120))
    }

    // write points
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1) - 0.5) * st.L
      const y = st.shape[i] + st.nudge[i]
      points[i * 3] = x
      points[i * 3 + 1] = y
      points[i * 3 + 2] = 0.3 * st.shape[i]
    }
    thread.current?.update()

    // recede: shrink about the thread's centre, cool from filament to ink, hand over to the H0 glow
    const g = group.current
    g.scale.setScalar(shrink)
    g.position.set(0, st.y0, 0)
    const cool = smoothstep(0.35, 0.85, k)
    const mat = thread.current?.material
    if (mat) {
      // width scales with the parent group; hold it constant while the Thread shrinks, so it
      // reads as a blur-limited glow once unresolved
      mat.uniforms.uWidth.value = WIDTH / Math.max(shrink, 1e-4)
      tmpC.copy(warm).lerp(inkC, cool)
      mat.uniforms.uGlow.value.copy(tmpC)
      tmpC.copy(warmCore).lerp(inkC, cool * 0.6)
      mat.uniforms.uCore.value.copy(tmpC)
      mat.uniforms.uOpacity.value = 1 - smoothstep(0.82, 1.0, k)
    }
    if (glow.current) {
      const gm = glow.current.material
      gm.uniforms.uIntensity.value = HANDOFF.H0.intensity * smoothstep(0.62, 1.0, k)
      glow.current.visible = k > 0.6
    }
    if (hit.current) {
      hit.current.scale.set(st.L, Math.max(0.5, 90 / px), 1)
      hit.current.visible = interactive
    }

    // camera: ±3° pointer parallax, fading out as we recede (handoff frame is exactly HANDOFF.camera)
    const par = (1 - k) * (explore.hovering ? 1 : 0) * amb
    st.parX = damp(st.parX, explore.nx * 0.052 * par, 3, dt || 1 / 60)
    st.parY = damp(st.parY, explore.ny * 0.035 * par, 3, dt || 1 / 60)
    const d = HANDOFF.camera.position[2]
    camera.position.set(Math.sin(st.parX) * d, Math.sin(st.parY) * d, Math.cos(st.parX) * Math.cos(st.parY) * d)
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <group ref={group}>
        <Filament ref={thread} points={points} count={N} width={WIDTH} taper={0.03} minPixels={0.9} coreFraction={0.09} intensity={1.15} />
        {/* invisible grab band around the Thread */}
        <mesh
          ref={hit}
          onPointerDown={(e) => {
            if (!interactiveRef.current) return
            e.stopPropagation()
            claimPointer()
            st.drag = true
            st.h = 0
            st.sigma0 = clamp(e.point.x / st.L + 0.5, 0.02, 0.98)
            setStageCursor('grabbing')
          }}
          onPointerOver={() => interactiveRef.current && !st.drag && setStageCursor('grab')}
          onPointerOut={() => !st.drag && setStageCursor('')}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
      <GlowPoint
        ref={glow}
        size={HANDOFF.H0.size}
        minPixels={HANDOFF.H0.minPixels}
        intensity={0}
        color={COLORS.ink}
        coreColor="#FFFFFF"
        visible={false}
      />
      <SceneLabel
        position={labelPos}
        align={portrait ? 'right' : 'below'}
        tone="dim"
        opacity={(f) => 1 - smoothstep(0.08, 0.4, f.progress)}
      >
        <span className={portrait ? 'pro-scene-note pro-scene-note--portrait' : 'pro-scene-note'}>
          <Status kind="analogy" compact /> A picture of an idea.{portrait ? <br /> : ' '}No one has ever seen a string.
        </span>
      </SceneLabel>
    </>
  )
}
