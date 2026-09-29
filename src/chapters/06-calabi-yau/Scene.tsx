import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import {
  Backdrop,
  Filament,
  GlowPoint,
  GlowPoints,
  HandoffLoop,
  OrbitRig,
  SceneLabel,
  useChapterFrame,
  useViewShift,
  COLORS,
  type FilamentApi,
  type FrameInfo,
  type GlowPointApi,
  type GlowPointsApi,
  type OrbitPose,
} from '@/gl'
import { HANDOFF, handoffFit } from '@/core/handoff'
import { isPortraitLayout } from '@/core/layout'
import { clamp, easeInOutCubic, lerp, smoothstep, TAU } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { useSettings } from '@/core/settings'
import { pluck } from '@/core/audio'
import { Status } from '@/ui'
import { CYSurface, type CYFrameInput } from './CYSurface'
import { HI_LABEL, HodgePlot, PLOT_W, plotX, plotY } from './HodgePlot'
import { branchPoints, buildLoop, evalP4, HANSON_PITCH, HANSON_YAW, loopNormal, projectP4, type Degree } from './cyMath'
import { createHairlines, createUnrollGeometry, createUnrollMaterial, unrollPoint } from './unroll'
import { kf, packP, squashB3, ss, type Keys } from './timeline'
import { cyPan, useCY } from './store'

/*
 * Chapter 06 · The hidden shape. Everything is timed in pack progress P (see timeline.ts).
 *   Opening  H2 loop → hairline circle under it → torus (Thread on the outer equator) → 6-axis star
 *   B1       torus unrolls into the flat torus (square, matched edges); Thread = straight wrapped segment
 *   B2       the Hanson quintic slice assembles from 25 phase-rotated copies; α sweeps 45° → 135°
 *   B3       probe touches the slice; harmonic pattern Re((z₁e^{iΩt})³) spreads; squash D_s (topology frozen)
 *   B4/B5    slice slides aside (DOM ledger / dials); breathes under D_s
 *   B6       the quintic shrinks to a point and lands on the Kreuzer–Skarke Hodge plot
 *   Lab      degree n, hidden rotation α, squash, pieces, wrap a string on loop a
 *   Exit     back to the canonical H2 loop, camera at HANDOFF.camera
 */

const N = HANDOFF.H2.count // 260 = LOOP_COUNT

const K_GSCALE: Keys = [
  [0, 1],
  [0.08, 0.56],
]
const K_ALPHA: Keys = [
  [0.26, 45],
  [0.32, 135],
]
const K_CYOP: Keys = [
  [0.176, 0],
  [0.196, 1],
  [0.705, 1],
  [0.728, 0],
  [0.8, 0],
  [0.816, 1],
  [0.94, 1],
  [0.958, 0],
]
const TAN = Math.tan((HANDOFF.camera.fov * Math.PI) / 360)
const DEG = Math.PI / 180


/** Shared per-frame state: written by the rig (first), read by everything after it. */
interface Dir {
  keysFor: number
  kDist: Keys
  kShiftX: Keys
  kShiftY: Keys
  P: number
  aspect: number
  portrait: boolean
  pose: OrbitPose & { target: [number, number, number] }
  shift: [number, number]
  lab: number
  /** label opacities etc. */
  L: Record<string, number>
  /** world-space anchors for labels */
  A: Record<string, THREE.Vector3>
}

function makeDir(): Dir {
  return {
    keysFor: NaN,
    kDist: [[0, 10]],
    kShiftX: [[0, 0]],
    kShiftY: [[0, 0]],
    P: 0,
    aspect: 1.6,
    portrait: false,
    pose: { azimuth: 0, polar: Math.PI / 2, distance: 10, target: [0, 0, 0], fov: HANDOFF.camera.fov },
    shift: [0, 0],
    lab: 0,
    L: {},
    A: {},
  }
}

// distance at which a radius r fits in `frac` of the half-width (portrait) — never closer than d
const fitD = (d: number, r: number, aspect: number, frac = 0.9) => Math.max(d, r / (TAN * Math.min(aspect, 1.6) * frac))

function direct(D: Dir, f: FrameInfo) {
  const P = packP(f.progress)
  D.P = P
  const size = f.state.size
  const aspect = size.width / Math.max(1, size.height)
  D.aspect = aspect
  // the engine's portrait predicate, so the scene composes for the same layout the DOM shows
  const portrait = isPortraitLayout(size.width, size.height)
  D.portrait = portrait
  D.lab = ss(P, 0.8, 0.815) * (1 - ss(P, 0.935, 0.955))
  if (D.keysFor !== (portrait ? -aspect : aspect)) {
    // key arrays depend only on the viewport: rebuilt on resize, never per frame
    D.keysFor = portrait ? -aspect : aspect
    // portrait: the slice fits the upper half, above the beat text
    const dCY = portrait ? fitD(6.2, 1.36, aspect, 0.84) : 6.2
    const dB3 = portrait ? dCY * 1.3 : 7.0
    const dLab = portrait ? fitD(5.6, 1.36, aspect, 0.86) : 5.7
    const dPlot0 = portrait ? fitD(4.4, 1.85, aspect, 0.96) : 6.0
    const dPlot1 = portrait ? fitD(6.6, 1.85, aspect, 0.8) : 7.9
    D.kDist = [
      [0, 10],
      [0.08, 5],
      [0.18, 5],
      [0.205, dCY],
      [0.32, dCY],
      [0.345, dB3],
      [0.46, dB3],
      [0.49, dCY],
      [0.705, dCY],
      [0.735, dPlot0],
      [0.8, dPlot1],
      [0.816, dLab],
      [0.94, dLab],
      [0.992, 10],
    ]
    // Opening: the moment scrolling starts, the loop leaves the path of the rising title card
    // (still [0, 0] at P = 0, the H2 handoff frame)
    D.kShiftX = portrait
      ? [
          // B1: the flat torus moves left so the rosette inset has the right-hand side
          [0.084, 0],
          [0.11, -0.21],
          [0.176, -0.21],
          [0.2, 0],
        ]
      : [
          [0, 0],
          [0.016, 0.19],
          [0.05, 0.12],
          [0.085, 0.12],
          [0.11, 0.035],
          [0.178, 0.035],
          [0.205, 0.14],
          [0.705, 0.14],
          [0.735, 0.12],
          [0.8, 0.12],
          [0.816, 0.1],
          [0.94, 0.1],
          [0.99, 0],
        ]
    D.kShiftY = portrait
      ? [
          [0, 0],
          [0.012, 0.24],
          [0.024, 0.24],
          [0.055, 0.15],
          [0.084, 0.15],
          // B1: the flat torus rises to leave room for the Ricci-flat caption and timeline above the text
          [0.11, 0.2],
          [0.176, 0.2],
          [0.205, 0.19],
          // B3: lift the slice so the ring strip fits between it and the beat text
          [0.322, 0.19],
          [0.338, 0.245],
          [0.46, 0.245],
          [0.49, 0.19],
          [0.8, 0.19],
          [0.816, 0.2],
          [0.94, 0.2],
          [0.99, 0],
        ]
      : [
          [0, 0],
          [0.016, 0.11],
          [0.05, 0],
        ]
  }
  // the lab's squash widens the picture by up to 45%: ease the camera back so it stays framed
  D.pose.distance = kf(P, D.kDist) * (1 + 0.2 * D.lab * useCY.getState().s)
  // B6: start close on the quintic's landing spot, pull back to the whole (mirror-symmetric) plot
  const tq = ss(P, 0.705, 0.735) * (1 - ss(P, 0.745, 0.79)) * (D.portrait ? 0 : 1)
  D.pose.target[0] = tq * plotX(-200) * 0.5
  D.pose.target[1] = tq * plotY(102) * 0.5
  D.pose.target[2] = 0
  D.shift[0] = kf(P, D.kShiftX)
  // + the Overlay's fit pan on short screens (0 elsewhere, so the handoff frames stay centred)
  D.shift[1] = kf(P, D.kShiftY) + (cyPan.b1 + cyPan.b4 + cyPan.b5) / Math.max(1, size.height)
  return D.pose
}

export default function Scene() {
  const quality = useSettings((s) => s.quality)
  const D = useMemo(makeDir, [])
  return (
    <>
      <OrbitRig
        pose={(f) => direct(D, f)}
        interactive={(h) => h.inStep('lab')}
        autoRotate={0.06}
        polarLimits={[10 * DEG, 170 * DEG]}
      />
      <ViewShift D={D} />
      <Stage D={D} quality={quality} />
    </>
  )
}

function ViewShift({ D }: { D: Dir }) {
  useViewShift(() => D.shift)
  return null
}

/* ─────────────────────────────── the stage ─────────────────────────────── */

function Stage({ D, quality }: { D: Dir; quality: 'low' | 'medium' | 'high' }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const fit = handoffFit(size.width / Math.max(1, size.height))
  const R0 = HANDOFF.H2.radius * fit

  // ── objects ──
  const cy = useMemo(() => new CYSurface(quality), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => cy.setTier(quality), [cy, quality])
  useEffect(() => () => cy.dispose(), [cy])
  const plot = useMemo(() => new HodgePlot(), [])
  useEffect(() => () => plot.dispose(), [plot])
  const [hodgeLoaded, setHodgeLoaded] = useState(false)

  const unrollMat = useMemo(createUnrollMaterial, [])
  const unrollGeo = useMemo(() => createUnrollGeometry(), [])
  useEffect(
    () => () => {
      unrollMat.dispose()
      unrollGeo.dispose()
    },
    [unrollMat, unrollGeo],
  )
  // six axis-ticks from one point of the torus: two drawable (solid), four we cannot draw (dashed)
  const star = useMemo(() => {
    const L = 1.0
    const dirs: [number, number, number, boolean][] = [
      [1, 0, 0, false],
      [0, 1, 0, false],
      [-0.62, 0.42, 0.66, true],
      [0.55, 0.62, 0.56, true],
      [-0.5, -0.58, 0.64, true],
      [0.7, -0.45, 0.55, true],
    ]
    return createHairlines(
      dirs.map(([x, y, z, d]) => {
        const l = Math.hypot(x, y, z)
        return { a: [0, 0, 0] as [number, number, number], b: [(x / l) * L, (y / l) * L, (z / l) * L] as [number, number, number], dashed: d }
      }),
      COLORS.field,
      9,
    )
  }, [])
  useEffect(
    () => () => {
      star.geometry.dispose()
      star.material.dispose()
    },
    [star],
  )

  // ── refs ──
  const openG = useRef<THREE.Group>(null!)
  const torusMesh = useRef<THREE.Mesh>(null!)
  const starG = useRef<THREE.Group>(null!)
  const circle = useRef<FilamentApi>(null)
  const cyRoot = useRef<THREE.Group>(null!)
  const dots = useRef<GlowPointsApi>(null)
  const loopHi = useRef<FilamentApi>(null)
  const loopHiBack = useRef<FilamentApi>(null)
  const thread = useRef<FilamentApi>(null)
  const threadBack = useRef<FilamentApi>(null)
  const open = useRef<FilamentApi>(null)
  const bead = useRef<GlowPointApi>(null)
  const quintic = useRef<GlowPointApi>(null)
  const handoff = useRef<THREE.Group>(null!)
  const ghost = useRef<THREE.LineLoop>(null!)
  // front (depth-tested) and behind-the-surface (35%) passes, iterated every frame without allocating
  const loopPasses = useMemo(() => [[loopHi, 1], [loopHiBack, 0.35]] as const, [])
  const threadPasses = useMemo(() => [[thread, 1], [threadBack, 0.35]] as const, [])

  // ── buffers (no per-frame allocation) ──
  const buf = useMemo(
    () => ({
      circle: new Float32Array(N * 3),
      thread: new Float32Array(N * 3),
      open: new Float32Array(N * 3),
      loop: new Float32Array(N * 3),
      probe: new Float32Array(N * 3),
      wrapped: new Float32Array(N * 3),
      ghost: new Float32Array(N * 3),
      dotPos: new Float32Array(12 * 3),
      dotSize: new Float32Array(12).fill(0.05),
      dotCol: new Float32Array(12 * 3).fill(1),
      dotA: new Float32Array(12),
    }),
    [],
  )
  const tmp = useMemo(
    () => ({
      v: new THREE.Vector3(),
      w: new THREE.Vector3(),
      n: new THREE.Vector3(),
      c: new THREE.Vector3(),
      cr: new THREE.Vector3(),
      cu: new THREE.Vector3(),
      cf: new THREE.Vector3(),
      m: new THREE.Matrix4(),
      cyCenter: new THREE.Vector3(),
      probe: new THREE.Vector3(),
      park: new THREE.Vector3(),
      touchW: new THREE.Vector3(),
      q4: new Float64Array(4),
      col: new THREE.Color(),
      warm: new THREE.Color(COLORS.filament),
      warmCore: new THREE.Color(COLORS.filamentCore),
      touch4: new THREE.Vector4(),
      o3: { x: 0, y: 0, z: 0 },
    }),
    [],
  )
  // label anchors (world or local positions written each frame)
  const anchors = useMemo(() => {
    const names = ['open', 'openC', 'sq', 'sqL', 'sqR', 'sqT', 'sqB', 'asm', 'c1', 'c2', 'rim', 'slice', 'A0', 'B0', 'A1', 'B1', 'size', 'q']
    return Object.fromEntries(names.map((k) => [k, new THREE.Vector3()])) as Record<string, THREE.Vector3>
  }, [])
  D.A = anchors

  // loop "a" and branch points for every degree, built once
  const loops = useMemo(() => {
    const out: Record<number, ReturnType<typeof buildLoop>> = {}
    for (const n of [3, 4, 5, 6]) out[n] = buildLoop(n)
    return out
  }, [])
  // rim edge midpoints (patch (k1,k2), x = ±X, y = π/4) as label candidates
  const rimMids = useMemo(() => {
    const out: Record<number, Float64Array> = {}
    for (const n of [3, 4, 5, 6]) {
      const a = new Float64Array(n * n * 2 * 4)
      const q = new Float64Array(4)
      let o = 0
      for (let k1 = 0; k1 < n; k1++)
        for (let k2 = 0; k2 < n; k2++)
          for (const x of [-1, 1]) {
            evalP4(n, x, Math.SQRT1_2, Math.SQRT1_2, q)
            const r1 = (2 * Math.PI * k1) / n
            const r2 = (2 * Math.PI * k2) / n
            a[o] = Math.cos(r1) * q[0] - Math.sin(r1) * q[1]
            a[o + 1] = Math.sin(r1) * q[0] + Math.cos(r1) * q[1]
            a[o + 2] = Math.cos(r2) * q[2] - Math.sin(r2) * q[3]
            a[o + 3] = Math.sin(r2) * q[2] + Math.cos(r2) * q[3]
            o += 4
          }
      out[n] = a
    }
    return out
  }, [])
  const branches = useMemo(() => {
    const out: Record<number, Float64Array> = {}
    for (const n of [3, 4, 5, 6]) out[n] = branchPoints(n)
    return out
  }, [])

  // mutable choreography state
  const st = useMemo(
    () => ({
      wrapE: 0,
      anim: 'none' as 'none' | 'snag' | 'escape',
      animT: 0,
      stuck: false,
      lastShrink: 0,
      lastN: 5,
      escaped: 0,
      reappear: 1,
    }),
    [],
  )

  // ghost (escape) dashed loop
  const ghostMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          attribute float aU;
          varying float vU;
          void main() { vU = aU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; varying float vU;
          void main() { if (fract(vU * 48.0) > 0.5) discard; gl_FragColor = vec4(uColor * uOpacity, 1.0); }`,
        uniforms: { uColor: { value: new THREE.Color(COLORS.ink3).multiplyScalar(1.8) }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const ghostGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(buf.ghost, 3).setUsage(THREE.DynamicDrawUsage))
    const u = new Float32Array(N)
    for (let i = 0; i < N; i++) u[i] = i / N
    g.setAttribute('aU', new THREE.BufferAttribute(u, 1))
    return g
  }, [buf])
  useEffect(
    () => () => {
      ghostMat.dispose()
      ghostGeo.dispose()
    },
    [ghostMat, ghostGeo],
  )

  // occluded ("seen through the surface") copies: depth GREATER, 35%
  useLayoutEffect(() => {
    for (const r of [loopHiBack, threadBack]) {
      const m = r.current?.material
      if (m) {
        m.depthFunc = THREE.GreaterDepth
        m.needsUpdate = true
      }
    }
  }, [])

  // lazy-load the Hodge list (≈ 40 kB) once the chapter gets near Beat 5
  const loadHodge = useRef(false)
  const requestHodge = () => {
    if (loadHodge.current) return
    loadHodge.current = true
    import('./hodgeData').then((m) => {
      plot.setData(m.decodeHodge())
      setHodgeLoaded(true)
    })
  }

  const frameIn = useMemo<CYFrameInput>(
    () => ({
      n: 5,
      alpha: Math.PI / 4,
      s: 0,
      asm: 10,
      pieces: 1,
      focus: 0,
      pattern: 0,
      spread: 0,
      touch: new THREE.Vector4(),
      phase: 0,
      opacity: 0,
      rim: 0.5,
      prepass: false,
      dt: 0,
      reduced: false,
    }),
    [],
  )

  const main = (f: FrameInfo) => {
    const { t, dt } = f
    const P = D.P
    const amb = ambient()
    const reduced = prefersReducedMotion()
    const lab = D.lab
    const cs = useCY.getState()
    if (P > 0.45) requestHodge()

    camera.updateMatrixWorld()
    const { cr, cu, cf, v, w, n: nv, c } = tmp
    cr.setFromMatrixColumn(camera.matrixWorld, 0)
    cu.setFromMatrixColumn(camera.matrixWorld, 1)
    cf.setFromMatrixColumn(camera.matrixWorld, 2) // towards the viewer

    /* ───────────── Opening & Beat 1: circle → torus → star → flat torus ───────────── */
    const og = openG.current
    const gScale = kf(P, K_GSCALE)
    const tilt = 0.5 * ss(P, 0.032, 0.06) * (1 - ss(P, 0.082, 0.108))
    og.scale.setScalar(gScale)
    og.rotation.set(-tilt, 0, 0)
    og.updateMatrixWorld()
    const rho = 0.35 * R0 * ss(P, 0.03, 0.06)
    const ua = ss(P, 0.084, 0.108)
    const ub = ss(P, 0.104, 0.124)
    const SQ = D.portrait ? 1.08 : Math.min(2.5, (0.78 * 10 * TAN * D.aspect) / 0.56)
    const um = unrollMat.uniforms
    um.uR.value = R0
    um.uRho.value = rho
    um.uA.value = ua
    um.uB.value = ub
    um.uW.value = SQ
    um.uH.value = SQ
    um.uFlat.value = ub
    const torusOp = ss(P, 0.03, 0.045) * (1 - ss(P, 0.178, 0.196))
    um.uOpacity.value = torusOp
    um.uEdge.value.set(1.5 * ss(P, 0.126, 0.132) * (1 - ss(P, 0.17, 0.18)), 1.5 * ss(P, 0.136, 0.142) * (1 - ss(P, 0.17, 0.18)))
    // the "zip": a light running along both edges of a pair at once (they are the same edge)
    um.uZip.value.set(lerp(-0.1, 1.1, ss(P, 0.126, 0.14)), lerp(-0.1, 1.1, ss(P, 0.136, 0.15)))
    torusMesh.current.visible = torusOp > 0.002
    // star of six hidden directions at the torus's top-front point
    const starOp = ss(P, 0.058, 0.064) * (1 - ss(P, 0.08, 0.088))
    starG.current.visible = starOp > 0.002
    starG.current.position.set(0, R0, rho)
    star.material.uniforms.uGrow.value = ss(P, 0.058, 0.078)
    star.material.uniforms.uStagger.value = 0.09
    star.material.uniforms.uOpacity.value = starOp
    // hairline circle under the loop
    const circOp = ss(P, 0.002, 0.026) * (1 - ss(P, 0.05, 0.066))
    if (circle.current) {
      circle.current.group.visible = circOp > 0.002
      circle.current.material.uniforms.uOpacity.value = circOp
      circle.current.material.uniforms.uWidth.value = 0.018 * gScale
      for (let i = 0; i < N; i++) {
        const th = (i / N) * TAU
        v.set(R0 * Math.cos(th), R0 * Math.sin(th), 0).applyMatrix4(og.matrixWorld)
        buf.circle[i * 3] = v.x
        buf.circle[i * 3 + 1] = v.y
        buf.circle[i * 3 + 2] = v.z
      }
      circle.current.update()
    }
    // portrait: the beat text sits below the shape, so the opening labels go above it
    anchors.open.set(0, D.portrait ? R0 + rho + 0.3 : -(R0 + rho) - 0.28, 0).applyMatrix4(og.matrixWorld)
    // portrait: the loop is lifted high while the title leaves, so the circle's label goes under it
    anchors.openC.set(0, -(R0 + rho) - 0.28, 0).applyMatrix4(og.matrixWorld)
    // the circle's label waits until the title card has scrolled away (it would sit on the kicker)
    D.L.circle = ss(P, 0.004, 0.018) * (1 - ss(P, 0.03, 0.036)) * ss(f.h.step('title'), 0.9, 1)
    D.L.torus = ss(P, 0.036, 0.046) * (1 - ss(P, 0.058, 0.064))
    D.L.star = ss(P, 0.066, 0.072) * (1 - ss(P, 0.082, 0.088))
    // flat torus labels
    const hs = SQ / 2
    anchors.sq.set(0, D.portrait ? hs + 0.1 : -hs - 0.22, 0).applyMatrix4(og.matrixWorld)
    anchors.sqL.set(-hs, 0, 0).applyMatrix4(og.matrixWorld)
    anchors.sqR.set(hs, 0, 0).applyMatrix4(og.matrixWorld)
    anchors.sqT.set(0, hs, 0).applyMatrix4(og.matrixWorld)
    anchors.sqB.set(0, -hs, 0).applyMatrix4(og.matrixWorld)
    D.L.square = ss(P, 0.122, 0.132) * (1 - ss(P, 0.172, 0.18))
    D.L.edgeU = ss(P, 0.128, 0.134) * (1 - ss(P, 0.172, 0.18))
    D.L.edgeV = ss(P, 0.138, 0.144) * (1 - ss(P, 0.172, 0.18))

    /* ───────────── The Calabi–Yau slice ───────────── */
    if (cs.playing && lab > 0.5 && dt > 0) useCY.getState().setAlpha(cs.alpha + 15 * dt)
    const labN = cs.n
    const wantN: Degree = P > 0.755 ? labN : 5
    const scrollAlpha = kf(P, K_ALPHA)
    const alphaDeg = lerp(scrollAlpha, cs.alpha, lab)
    const alpha = alphaDeg * DEG
    const breathe = 0.2 * (1 - Math.cos(t * 0.9 * (amb || 0) + 1.1))
    const sScroll = squashB3(P) + breathe * ss(P, 0.615, 0.635) * (1 - ss(P, 0.695, 0.715))
    const sq = lerp(sScroll, cs.s, lab)
    const cyOp = kf(P, K_CYOP)
    // placement: B4/B5 the slice slides aside and shrinks (anchored to a screen position)
    const aside = ss(P, 0.46, 0.49) * (1 - ss(P, 0.7, 0.73))
    const toPoint = ss(P, 0.7, 0.728) * (1 - ss(P, 0.8, 0.816))
    const cyS = lerp(1, D.portrait ? 0.36 : 0.37, aside) * (1 - 0.97 * toPoint)
    // screen anchor for "aside": desktop between text and ledger; portrait near the top
    const ax = D.portrait ? 0 : -0.105
    const ay = D.portrait ? 0.62 : 0.06
    screenToPlane(camera, ax, ay, tmp.c)
    const root = cyRoot.current
    root.position.set(c.x * aside, c.y * aside, 0)
    // B6: the shrinking quintic keeps its place; the point then flies to the plot
    root.scale.setScalar(Math.max(1e-3, cyS))
    const spin = t * 0.045 * amb - 40 * DEG * ss(P, 0.26, 0.32)
    root.rotation.set(HANSON_PITCH, HANSON_YAW + spin, 0, 'XYZ')
    root.updateMatrixWorld()
    tmp.cyCenter.setFromMatrixPosition(root.matrixWorld)
    const asm = P < 0.3 ? P - 0.2 : 10
    // B3: the probe touches the slice here; a harmonic pattern spreads from it
    evalP4(5, 0.35, Math.cos(0.72), Math.sin(0.72), tmp.q4)
    tmp.touch4.set(tmp.q4[0], tmp.q4[1], tmp.q4[2], tmp.q4[3])
    const pattern = ss(P, 0.364, 0.372) * (1 - ss(P, 0.462, 0.486))
    const spread = lerp(0, 3.2, ss(P, 0.366, 0.412))
    const cyIn: CYFrameInput = frameIn
    cyIn.n = wantN
    cyIn.alpha = alpha
    cyIn.s = sq
    cyIn.asm = asm
    cyIn.pieces = lerp(1, cs.pieces ? 1 : 0, lab)
    cyIn.focus = easeInOutCubic(st.wrapE) * lab
    cyIn.pattern = pattern
    cyIn.spread = spread
    cyIn.touch = tmp.touch4
    cyIn.phase = 3 * 0.6 * t
    // portrait: the ledger and dials take the upper half in B4/B5, so the slice steps out of view
    // (mid-width screens too: there is no room between the text and the ledger for it)
    const crowded = D.portrait || f.state.size.width < 1160
    const cyVis = cyOp * (crowded ? 1 - aside : 1)
    cyIn.opacity = cyVis
    cyIn.rim = 0.55 * (P < 0.3 ? ss(P, 0.245, 0.27) : 1)
    cyIn.prepass = lab > 0.01 && st.wrapE > 0.001 // depth for the loop's front/behind passes (wrap only)
    cyIn.dt = dt
    cyIn.reduced = reduced
    cy.update(cyIn)
    const shownN = cy.shown
    if (shownN !== st.lastN) st.lastN = shownN

    // branch points: n of each kind
    const bp = branches[shownN]
    for (let k = 0; k < 12; k++) {
      if (k < 2 * shownN) {
        projectP4(bp, k * 4, alpha, sq, tmp.o3)
        buf.dotPos[k * 3] = tmp.o3.x
        buf.dotPos[k * 3 + 1] = tmp.o3.y
        buf.dotPos[k * 3 + 2] = tmp.o3.z
        const onLoop = k === 0 || k === 1 || k === shownN || k === shownN + 1
        buf.dotA[k] = cyVis * (P < 0.3 ? ss(P, 0.245, 0.27) : 1) * (0.35 + 0.4 * lab) * (1 + (onLoop ? 1.6 * st.wrapE * lab : 0))
        buf.dotSize[k] = onLoop ? lerp(0.045, 0.07, st.wrapE * lab) : 0.045
      } else buf.dotA[k] = 0
    }
    if (dots.current) {
      const g = dots.current.geometry
      g.attributes.position.needsUpdate = true
      g.attributes.aAlpha.needsUpdate = true
      g.attributes.aSize.needsUpdate = true
    }
    // loop labels (A₀ B₀ A₁ B₁) in CY-local space
    branchAnchor(bp, 0, alpha, sq, tmp.o3, root, anchors.A0)
    branchAnchor(bp, 1, alpha, sq, tmp.o3, root, anchors.A1)
    branchAnchor(bp, shownN, alpha, sq, tmp.o3, root, anchors.B0)
    branchAnchor(bp, shownN + 1, alpha, sq, tmp.o3, root, anchors.B1)
    D.L.loopLabels = lab * st.wrapE

    // rim callout: the dashed-rim midpoint furthest down-and-right on screen, where its two-line label
    // has room (clear of the chapter rail); the anchor glides between candidates, never jumps
    const rims = rimMids[shownN]
    let best = -1e9
    for (let k = 0; k < rims.length / 4; k++) {
      projectP4(rims, k * 4, alpha, sq, tmp.o3)
      v.set(tmp.o3.x, tmp.o3.y, tmp.o3.z).applyMatrix4(root.matrixWorld)
      const score = 0.45 * v.dot(cr) - v.dot(cu)
      if (score > best) {
        best = score
        w.copy(v)
      }
    }
    if (dt === 0 || anchors.rim.lengthSq() === 0) anchors.rim.copy(w)
    else anchors.rim.lerp(w, 1 - Math.exp(-4 * dt))
    D.L.rim = (ss(P, 0.285, 0.295) * (1 - ss(P, 0.318, 0.326)) + lab * (1 - st.wrapE)) * (D.portrait ? 0 : 1)

    // B2 labels: equation above the shape, the overlap note below it (clear of the text and the rail)
    const Rv = 1.32 * cyS
    anchors.asm.copy(tmp.cyCenter).addScaledVector(cu, -Rv - 0.2)
    anchors.c1.copy(tmp.cyCenter).addScaledVector(cu, Rv + 0.12)
    anchors.c2.copy(tmp.cyCenter).addScaledVector(cu, -Rv - 0.14)
    // portrait: the margin callouts would sit on the beat text (the caption under it carries the equation)
    const land = D.portrait ? 0 : 1
    D.L.asm = ss(P, 0.2, 0.208) * (1 - ss(P, 0.262, 0.27)) * land
    D.L.c1 = ss(P, 0.268, 0.278) * (1 - ss(P, 0.318, 0.326)) * land
    D.L.c2 = ss(P, 0.276, 0.286) * (1 - ss(P, 0.318, 0.326)) * land
    D.L.overlap = lab * (1 - st.wrapE) * (D.portrait ? 0 : 1)
    anchors.slice.copy(tmp.cyCenter).addScaledVector(cu, -(1.32 * cyS) - 0.16)
    D.L.slice = ss(P, 0.49, 0.5) * (1 - ss(P, 0.69, 0.705)) * land * (crowded ? 0 : 1)

    /* ───────────── Loop "a" (lab) and the wrapped Thread ───────────── */
    const loop = loops[shownN]
    // wrap animation (1.2 s), time-based; the exit ramp unwraps by scroll
    const wantWrap = cs.wrap && lab > 0.5 && P < 0.94
    if (dt === 0) st.wrapE = wantWrap ? 1 : 0
    else st.wrapE = clamp(st.wrapE + (wantWrap ? dt : -dt) / (reduced ? 0.2 : 1.2), 0, 1)
    const wrapE = easeInOutCubic(st.wrapE) * (1 - ss(P, 0.94, 0.955))

    // shrink experiments
    if (cs.shrink && cs.shrink.id !== st.lastShrink) {
      st.lastShrink = cs.shrink.id
      if (cs.wrap && st.wrapE > 0.5 && cs.phase !== 'free') {
        const escape = cs.shrink.kind === 'full' && shownN >= 4
        st.anim = escape ? 'escape' : 'snag'
        st.animT = 0
        st.stuck = cs.shrink.kind === 'full' && shownN === 3
        useCY.getState().setPhase(escape ? 'escape' : st.stuck ? 'stuck' : 'snag')
        if (escape) pluck(146.8, [{ n: 1, amp: 1 }, { n: 2, amp: 0.3 }], { decay: 2.4, gain: 0.35 })
        else pluck(98, [{ n: 1, amp: 1 }, { n: 2, amp: 0.5 }, { n: 3, amp: 0.3 }], { decay: st.stuck ? 3.6 : 1.1, gain: 0.55 })
      }
    }
    if (cs.phase === 'idle' && st.anim !== 'none' && st.animT > 0.05) st.anim = 'none' // reset / n change
    if (st.anim !== 'none') st.animT += dt
    let tighten = 0
    let escape = 0
    if (st.anim === 'snag') {
      const tau = st.animT
      if (reduced) tighten = 0
      else if (tau < 0.8) tighten = 0.18 * Math.sin((Math.PI / 2) * (tau / 0.8))
      else {
        const om = TAU / 0.7
        const z = 0.3
        tighten = 0.18 * Math.exp(-z * om * (tau - 0.8)) * Math.cos(om * Math.sqrt(1 - z * z) * (tau - 0.8))
      }
      if (tau > 3.2) st.anim = 'none'
    } else if (st.anim === 'escape') {
      escape = reduced ? 1 : clamp(st.animT / 2, 0, 1)
      if (escape >= 1 && useCY.getState().phase === 'escape') useCY.getState().setPhase('free')
    }
    if (cs.phase === 'free' && st.anim !== 'escape') escape = 1
    const escE = easeInOutCubic(escape)
    st.reappear = cs.phase === 'free' ? 0 : dt === 0 ? 1 : Math.min(1, st.reappear + dt / 0.6)

    // loop geometry → CY-local points (highlight) and world points (wrapped Thread)
    let cx = 0
    let cyy = 0
    let cz = 0
    for (let i = 0; i < N; i++) {
      projectP4(loop.p4, i * 4, alpha, sq, tmp.o3)
      loopNormal(loop, i, alpha, sq, nv)
      buf.loop[i * 3] = tmp.o3.x + 0.012 * nv.x
      buf.loop[i * 3 + 1] = tmp.o3.y + 0.012 * nv.y
      buf.loop[i * 3 + 2] = tmp.o3.z + 0.012 * nv.z
      // Thread decoration (cartoon): transverse wobble A·N·sin(2π·6σ − 3t), A = 0.01
      const wob = 0.01 * Math.sin(TAU * 6 * (i / N) - 3 * t)
      v.set(tmp.o3.x + (0.02 + wob) * nv.x, tmp.o3.y + (0.02 + wob) * nv.y, tmp.o3.z + (0.02 + wob) * nv.z).applyMatrix4(root.matrixWorld)
      buf.wrapped[i * 3] = v.x
      buf.wrapped[i * 3 + 1] = v.y
      buf.wrapped[i * 3 + 2] = v.z
      cx += v.x
      cyy += v.y
      cz += v.z
    }
    cx /= N
    cyy /= N
    cz /= N
    const shrinkK = 1 - tighten - escE
    for (let i = 0; i < N; i++) {
      buf.wrapped[i * 3] = cx + (buf.wrapped[i * 3] - cx) * shrinkK + cf.x * 0.3 * escE
      buf.wrapped[i * 3 + 1] = cyy + (buf.wrapped[i * 3 + 1] - cyy) * shrinkK + cf.y * 0.3 * escE
      buf.wrapped[i * 3 + 2] = cz + (buf.wrapped[i * 3 + 2] - cz) * shrinkK + cf.z * 0.3 * escE
    }
    const hiOp = cyOp * lab * lerp(0.3, 0.55, st.wrapE)
    for (const [r, k] of loopPasses) {
      const api = r.current
      if (!api) continue
      api.group.visible = hiOp > 0.002
      api.material.uniforms.uOpacity.value = hiOp * k
      api.update()
    }

    /* ───────────── The Thread ───────────── */
    // probe orbit around the slice (radius 2.0 in slice units)
    const orbitR = (D.portrait ? 1.5 : 2.0) * cyS
    const psi = 0.6 + t * 0.2 * amb
    tmp.probe.copy(tmp.cyCenter).addScaledVector(cr, orbitR * Math.cos(psi))
    tmp.probe.addScaledVector(cu, orbitR * 0.3 * Math.sin(psi) + 0.15 * cyS)
    tmp.probe.addScaledVector(cf, orbitR * 0.95 * Math.sin(psi))
    // B3: fly to the touch point and dock
    projectP4(tmp.q4, 0, alpha, sq, tmp.o3)
    tmp.touchW.set(tmp.o3.x, tmp.o3.y, tmp.o3.z).applyMatrix4(root.matrixWorld)
    const dock = ss(P, 0.352, 0.37) * (1 - ss(P, 0.412, 0.43))
    tmp.probe.lerp(tmp.touchW, dock)
    // B6: drift in front of the plot but park beside it, clear of the data (never read as a data highlight)
    const drift = ss(P, 0.706, 0.74) * (1 - ss(P, 0.8, 0.814))
    w.set(plotX(960) + 0.36 + 0.05 * Math.sin(0.23 * t * amb), plotY(430) + 0.04 * Math.sin(0.31 * t * amb + 1), 0.5)
    tmp.probe.lerp(w, drift)
    // Lab: the Thread waits past the right edge and flies in only to wrap the loop (never orbits the surface)
    screenToPlane(camera, 1.18, 0.3, tmp.park)
    tmp.probe.lerp(tmp.park, lab)
    // a small string, not a ring-shaped UI element
    const rp = 0.06 * lerp(1, 0.85, dock) * lerp(1, 0.8, aside) * lerp(1, 0.8, drift)
    // canonical H2 (exit)
    const g = ss(P, 0.95, 0.992)
    // curl: straight wrapped segment (B1) closes into the probe loop
    const curl = ss(P, 0.176, 0.2)
    const flat = P >= 0.08 && P < 0.2
    const probeWob = HANDOFF.H2.wobble * ss(P, 0.2, 0.225)
    const ht = HANDOFF.H2.omega * t
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU
      const wob = probeWob * (0.6 * Math.cos(2 * th) * Math.cos(ht) + 0.4 * Math.cos(3 * th + 0.7) * Math.cos(1.37 * ht + 1.1))
      const rr = rp * (1 + wob)
      c.copy(tmp.probe).addScaledVector(cr, rr * Math.cos(th)).addScaledVector(cu, rr * Math.sin(th))
      c.addScaledVector(cf, rp * probeWob * 0.5 * Math.sin(2 * th) * Math.sin(ht))
      buf.probe[i * 3] = c.x
      buf.probe[i * 3 + 1] = c.y
      buf.probe[i * 3 + 2] = c.z
    }
    // closed Thread: opening loop / probe / wrapped / exit
    const tp = buf.thread
    if (P < 0.08) {
      const wobble = HANDOFF.H2.wobble * (1 - ss(P, 0.018, 0.036))
      const r = R0 + rho
      for (let i = 0; i < N; i++) {
        const th = (i / N) * TAU
        const wv = wobble * (0.6 * Math.cos(2 * th) * Math.cos(ht) + 0.4 * Math.cos(3 * th + 0.7) * Math.cos(1.37 * ht + 1.1))
        const rr = r * (1 + wv)
        v.set(rr * Math.cos(th), rr * Math.sin(th), R0 * wobble * 0.5 * Math.sin(2 * th) * Math.sin(ht)).applyMatrix4(og.matrixWorld)
        tp[i * 3] = v.x
        tp[i * 3 + 1] = v.y
        tp[i * 3 + 2] = v.z
      }
    } else {
      for (let i = 0; i < N * 3; i++) tp[i] = lerp(buf.probe[i], buf.wrapped[i], wrapE)
      if (g > 0) {
        for (let i = 0; i < N; i++) {
          const th = (i / N) * TAU
          const w0 = HANDOFF.H2.wobble * (0.6 * Math.cos(2 * th) * Math.cos(ht) + 0.4 * Math.cos(3 * th + 0.7) * Math.cos(1.37 * ht + 1.1))
          const rr = R0 * (1 + w0)
          tp[i * 3] = lerp(tp[i * 3], rr * Math.cos(th), g)
          tp[i * 3 + 1] = lerp(tp[i * 3 + 1], rr * Math.sin(th), g)
          tp[i * 3 + 2] = lerp(tp[i * 3 + 2], R0 * HANDOFF.H2.wobble * 0.5 * Math.sin(2 * th) * Math.sin(ht), g)
        }
      }
    }
    const atHandoff = P < 0.0015 || P > 0.9985
    handoff.current.visible = atHandoff
    const threadVisible = !atHandoff && !flat
    const wrappedGone = wrapE > 0.5 ? escE : 0
    const probeHide = ss(P, 0.452, 0.466) * (1 - ss(P, 0.702, 0.72))
    const labHide = lab * (1 - smoothstep(0, 0.35, st.wrapE))
    const threadOp = (1 - wrappedGone) * lerp(1, st.reappear, wrapE) * (1 - probeHide) * (1 - labHide) * (1 - (D.portrait ? drift : 0))
    for (const [r, k] of threadPasses) {
      const api = r.current
      if (!api) continue
      api.group.visible = threadVisible && threadOp > 0.002 && (k === 1 || lab > 0.01)
      const u = api.material.uniforms
      u.uOpacity.value = threadOp * k
      const baseW = P < 0.08 ? HANDOFF.H2.width * gScale : lerp(lerp(0.03, 0.05, wrapE), HANDOFF.H2.width, g)
      u.uWidth.value = baseW
      u.uIntensity.value = P < 0.08 ? 1 : lerp(lerp(0.7, 1, wrapE), 1, g)
      u.uShimmer.value = st.anim === 'snag' ? 0.9 * Math.max(0, 1 - st.animT / 2.4) : 0
      api.update()
    }
    // open Thread: rides the unrolling outer equator (V = ¾), then curls into the probe loop
    if (open.current) {
      open.current.group.visible = flat && !atHandoff
      if (flat) {
        const op = buf.open
        // world-space endpoints of the flat segment (for the curl)
        unrollPoint(0, 0.75, R0, rho, ua, ub, SQ, SQ, v).applyMatrix4(og.matrixWorld)
        unrollPoint(1, 0.75, R0, rho, ua, ub, SQ, SQ, w).applyMatrix4(og.matrixWorld)
        const L0 = v.distanceTo(w)
        c.copy(v).add(w).multiplyScalar(0.5)
        const e = easeInOutCubic(curl)
        const L = lerp(L0, TAU * rp, e)
        const k = (e * TAU) / L
        // arc centre point moves from the segment middle to the bottom of the probe loop
        nv.copy(tmp.probe).addScaledVector(cu, -rp)
        c.lerp(nv, e)
        for (let i = 0; i < N; i++) {
          const U = i / (N - 1)
          if (curl <= 0) {
            unrollPoint(U, 0.75, R0, rho, ua, ub, SQ, SQ, nv).applyMatrix4(og.matrixWorld)
          } else {
            const s = (U - 0.5) * L
            const ax2 = k > 1e-6 ? Math.sin(k * s) / k : s
            const ay2 = k > 1e-6 ? (1 - Math.cos(k * s)) / k : 0
            nv.copy(c).addScaledVector(cr, ax2).addScaledVector(cu, ay2)
          }
          op[i * 3] = nv.x
          op[i * 3 + 1] = nv.y
          op[i * 3 + 2] = nv.z
        }
        open.current.material.uniforms.uWidth.value = lerp(HANDOFF.H2.width * gScale, 0.03, e)
        open.current.material.uniforms.uIntensity.value = lerp(1, 0.7, e)
        open.current.material.uniforms.uShimmer.value = 0.6 * ss(P, 0.126, 0.14) * (1 - e)
        open.current.update()
      }
    }
    // wrap bead: a travelling glint that leaves one edge and re-enters the opposite one
    if (bead.current) {
      const bOp = ss(P, 0.132, 0.142) * (1 - ss(P, 0.168, 0.176))
      bead.current.visible = bOp > 0.002
      if (bOp > 0.002) {
        const U = (t / 3.4) % 1
        unrollPoint(U, 0.75, R0, rho, ua, ub, SQ, SQ, v).applyMatrix4(og.matrixWorld)
        bead.current.position.copy(v)
        bead.current.material.uniforms.uIntensity.value = 0.9 * bOp * smoothstep(0, 0.06, U) * (1 - smoothstep(0.94, 1, U))
      }
    }
    // ghost of the escaping loop
    const ghostOp = wrapE > 0.5 && st.anim === 'escape' ? Math.sin(Math.PI * escape) * 0.9 : 0
    ghost.current.visible = ghostOp > 0.002
    if (ghostOp > 0.002) {
      buf.ghost.set(buf.wrapped)
      ghostGeo.attributes.position.needsUpdate = true
      ghostMat.uniforms.uOpacity.value = ghostOp
    }

    /* ───────────── Beat 6: Hodge plot ───────────── */
    const plotOp = ss(P, 0.712, 0.735) * (1 - ss(P, 0.8, 0.81))
    // 30,108 additive points: on a small plot they pile up to white, so thin them with on-screen density
    const plotPx = (PLOT_W * f.state.size.height) / (2 * D.pose.distance * TAN)
    D.L.plotAnn = ss(P, 0.748, 0.76) * (1 - ss(P, 0.797, 0.805))
    plot.update(plotOp * clamp(Math.pow(plotPx / 780, 1.3), 0.22, 1), ss(P, 0.722, 0.765), dpr, D.L.plotAnn, D.portrait)
    D.L.plot = plotOp
    // the title waits for the pull-back (during the close-up it would sit in the header row)
    D.L.plotTitle = plotOp * ss(P, 0.75, 0.765)
    // the quintic as one point: from the slice's centre to (χ, h¹¹+h²¹) = (−200, 102)
    if (quintic.current) {
      const qf = ss(P, 0.712, 0.742)
      const qOp = ss(P, 0.704, 0.716) * (1 - ss(P, 0.8, 0.81))
      quintic.current.visible = qOp > 0.002
      v.set(plotX(-200), plotY(102), 0)
      quintic.current.position.copy(tmp.cyCenter).lerp(v, easeInOutCubic(qf))
      quintic.current.material.uniforms.uIntensity.value = qOp * (1.1 + 0.3 * (1 - qf))
      anchors.q.copy(v)
    }
    D.L.quintic = ss(P, 0.742, 0.75) * (1 - ss(P, 0.797, 0.805))

    // SIZE: UNKNOWN caption, pinned near the (hidden) gauge edge
    const wide = f.state.size.width >= 1100
    screenToPlane(camera, wide ? -0.962 : D.portrait ? -0.9 : -0.93, wide ? 0 : D.portrait ? 0.835 : 0.78, anchors.size)
    // it captions the drawn shape: where B4/B5 hide the slice (crowded) and a short screen slides the ledger or
    // dials up under it (the Overlay's fit pan), it steps aside instead of printing over their labels
    const underPan = crowded ? 1 - smoothstep(16, 40, cyPan.b4 + cyPan.b5) : 1
    D.L.size = ss(P, 0.012, 0.03) * (1 - ss(P, 0.96, 0.985)) * underPan
  }

  const lo = (k: string) => (/* f */) => D.L[k] ?? 0

  return (
    <>
      <FrameRunner fn={main} />
      <Backdrop />

      {/* Opening + Beat 1 (torus ⇄ flat torus) */}
      <group ref={openG}>
        <mesh ref={torusMesh} geometry={unrollGeo} material={unrollMat} frustumCulled={false} renderOrder={1} raycast={() => null} />
        <group ref={starG}>
          <primitive object={star} />
        </group>
      </group>
      <Filament ref={circle} points={buf.circle} count={N} closed width={0.018} minPixels={0.55} color={COLORS.field} coreColor="#CFE0F7" intensity={0.9} />

      {/* The Calabi–Yau slice, in Hanson's view frame */}
      <group ref={cyRoot}>
        <primitive object={cy.group} />
        <GlowPoints
          ref={dots}
          positions={buf.dotPos}
          sizes={buf.dotSize}
          colors={buf.dotCol}
          alphas={buf.dotA}
          minPixels={2}
          maxPixels={14}
          color={COLORS.ink}
          intensity={1}
          sharpness={0.6}
          renderOrder={4}
        />
        <Filament ref={loopHi} points={buf.loop} count={N} closed width={0.022} minPixels={0.8} color={COLORS.field} coreColor="#E6F0FF" intensity={1} renderOrder={5} />
        <Filament ref={loopHiBack} points={buf.loop} count={N} closed width={0.022} minPixels={0.8} color={COLORS.field} coreColor="#E6F0FF" intensity={1} renderOrder={5} />
      </group>

      {/* Hodge plot (B6) */}
      <primitive object={plot.group} />
      <GlowPoint ref={quintic} size={0.09} minPixels={3} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} visible={false} />

      {/* The Thread */}
      <Filament ref={thread} points={buf.thread} count={N} closed width={HANDOFF.H2.width} renderOrder={6} />
      <Filament ref={threadBack} points={buf.thread} count={N} closed width={HANDOFF.H2.width} renderOrder={6} />
      <Filament ref={open} points={buf.open} count={N} width={HANDOFF.H2.width} renderOrder={6} />
      <GlowPoint ref={bead} size={0.09} minPixels={2.5} intensity={0} visible={false} />
      <lineLoop ref={ghost} geometry={ghostGeo} material={ghostMat} frustumCulled={false} visible={false} raycast={() => null} />
      <group ref={handoff} visible={false}>
        <HandoffLoop />
      </group>

      {/* ── figure labels ── */}
      <Anchored at={anchors.openC}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={lo('circle')}>
          1 hidden dimension · circle
        </SceneLabel>
      </Anchored>
      <Anchored at={anchors.open}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={lo('torus')}>
          2 hidden dimensions · torus
        </SceneLabel>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={lo('star')}>
          6 hidden dimensions · ?
        </SceneLabel>
      </Anchored>
      <Anchored at={anchors.sq}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={() => (D.portrait ? 0 : (D.L.square ?? 0))}>
          Simplest Calabi–Yau · 2 real dimensions · flat
        </SceneLabel>
        <SceneLabel position={[0, 0, 0]} align="above" tone="field" opacity={() => (D.portrait ? (D.L.square ?? 0) : 0)}>
          <span className="cy-callout cy-callout--narrow">Simplest Calabi–Yau · 2 real dims · flat</span>
        </SceneLabel>
      </Anchored>
      {(['sqL', 'sqR', 'sqT', 'sqB'] as const).map((k) => (
        <Anchored key={k} at={anchors[k]}>
          <SceneLabel position={[0, 0, 0]} align="center" tone="ink" opacity={lo(k === 'sqL' || k === 'sqR' ? 'edgeU' : 'edgeV')}>
            <span className={`cy-chev cy-chev--${k === 'sqL' || k === 'sqR' ? 'v' : 'h'}`} aria-hidden="true">
              {k === 'sqL' || k === 'sqR' ? '›' : '››'}
            </span>
          </SceneLabel>
        </Anchored>
      ))}
      <Anchored at={anchors.asm}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={lo('asm')}>
          25 copies of one piece
        </SceneLabel>
      </Anchored>
      <Anchored at={anchors.c1}>
        <SceneLabel position={[0, 0, 0]} align="above" tone="ink" opacity={lo('c1')}>
          <span className="cy-callout">
            <span className="cy-sym">z₁⁵ + z₂⁵ = 1</span> · 4D → 3D shadow
          </span>
        </SceneLabel>
      </Anchored>
      <Anchored at={anchors.c2}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={lo('c2')}>
          <span className="cy-callout cy-callout--soft">Apparent crossings = shadow overlap, not real</span>
        </SceneLabel>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={lo('overlap')}>
          <span className="cy-callout cy-callout--wrap cy-callout--soft">Apparent crossings are shadows overlapping. The real surface never passes through itself.</span>
        </SceneLabel>
      </Anchored>
      <Anchored at={anchors.rim}>
        <SceneLabel position={[0, 0, 0]} align="left" tone="dim" leader opacity={lo('rim')}>
          <span className="cy-callout cy-callout--rim cy-callout--soft">
            <span className="cy-dash" aria-hidden="true" />
            Cut off here
            <br />
            surface continues outward
          </span>
        </SceneLabel>
      </Anchored>
      <Anchored at={anchors.slice}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={lo('slice')}>
          <span className="cy-callout cy-callout--center">
            This slice · 6 handles
            <br />
            <span className="cy-dim">drawable</span>
          </span>
        </SceneLabel>
      </Anchored>
      {(['A0', 'B0', 'A1', 'B1'] as const).map((k) => (
        <Anchored key={k} at={anchors[k]}>
          <SceneLabel position={[0, 0, 0]} align="left" tone="ink" opacity={lo('loopLabels')}>
            <span className="cy-pt">
              {k[0]}
              <sub>{k[1]}</sub>
            </span>
          </SceneLabel>
        </Anchored>
      ))}
      <PlotLabels D={D} hodgeLoaded={hodgeLoaded} />
      <Anchored at={anchors.size}>
        <SceneLabel position={[0, 0, 0]} align={size.width >= 1100 ? 'center' : 'left'} tone="dim" opacity={lo('size')}>
          <span className={`cy-size${size.width >= 1100 ? ' cy-size--v' : ''}`}>
            <Status kind="analogy" compact /> Size: unknown · drawn magnified
          </span>
        </SceneLabel>
      </Anchored>
    </>
  )
}

/** Runs the stage loop. Rendered first, so it subscribes before every label/anchor below it. */
function FrameRunner({ fn }: { fn: (f: FrameInfo) => void }) {
  const ref = useRef(fn)
  ref.current = fn
  useChapterFrame((f) => ref.current(f))
  return null
}

/** A group whose world position follows a Vector3 written each frame by the stage loop. */
function Anchored({ at, children }: { at: THREE.Vector3; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  useChapterFrame(() => {
    g.current.position.copy(at)
  })
  return <group ref={g}>{children}</group>
}

/** World position of branch point k (A's then B's in bp), projected and carried by the slice's transform. */
function branchAnchor(
  bp: Float64Array,
  k: number,
  alpha: number,
  s: number,
  o3: { x: number; y: number; z: number },
  root: THREE.Object3D,
  out: THREE.Vector3,
) {
  projectP4(bp, k * 4, alpha, s, o3)
  out.set(o3.x, o3.y, o3.z).applyMatrix4(root.matrixWorld)
}

/** Intersect the camera ray through NDC (nx, ny) with the plane z = 0. */
const _o = new THREE.Vector3()
const _d = new THREE.Vector3()
function screenToPlane(camera: THREE.PerspectiveCamera, nx: number, ny: number, out: THREE.Vector3) {
  _o.setFromMatrixPosition(camera.matrixWorld)
  _d.set(nx, ny, 0.5).unproject(camera).sub(_o).normalize()
  const tt = Math.abs(_d.z) > 1e-6 ? -_o.z / _d.z : 5
  out.copy(_o).addScaledVector(_d, tt)
  return out
}

function PlotLabels({ D, hodgeLoaded }: { D: Dir; hodgeLoaded: boolean }) {
  const op = (k: string, m = 1) => () => (D.L[k] ?? 0) * m * (hodgeLoaded ? 1 : 0)
  const size = useThree((s) => s.size)
  const portrait = isPortraitLayout(size.width, size.height)
  const y0 = plotY(0)
  const y1 = plotY(502)
  const x0 = plotX(-960)
  return (
    <group>
      <SceneLabel position={[x0, plotY(portrait ? 740 : 650), 0]} align="left" tone="ink" opacity={op('plotTitle')}>
        <span className="cy-plot-title">
          One catalogue · 473,800,776 polytopes
          <br />
          30,108 Hodge pairs
        </span>
      </SceneLabel>
      <SceneLabel position={[plotX(0), y0 - 0.2, 0]} align="below" tone="dim" opacity={op('plot')}>
        <span className="cy-sym">χ = 2(h¹¹ − h²¹)</span>
      </SceneLabel>
      {[-960, -480, 0, 480, 960].map((c) => (
        <SceneLabel key={c} position={[plotX(c), y0 - 0.05, 0]} align="below" tone="dim" opacity={op('plot', 0.8)}>
          {c > 0 ? c : c === 0 ? '0' : `−${-c}`}
        </SceneLabel>
      ))}
      <SceneLabel position={[x0, y1 + 0.13, 0]} align="above" tone="dim" opacity={op('plot')}>
        <span className="cy-sym">h¹¹ + h²¹</span>
      </SceneLabel>
      {[100, 300, 500].map((h) => (
        <SceneLabel key={h} position={[x0 - 0.05, plotY(h), 0]} align="right" tone="dim" opacity={op('plot', 0.7)}>
          {h}
        </SceneLabel>
      ))}
      {portrait ? (
        <SceneLabel position={[-HI_LABEL[0], HI_LABEL[1], 0]} align="right" tone="ink" opacity={op('plotAnn')}>
          <span className="cy-callout cy-callout--bg cy-callout--lines cy-callout--end">
            <span className="cy-sym">χ = ±6</span> · 208 pairs
            <span className="cy-hi-dot cy-hi-dot--end" aria-hidden="true" />
            <br />
            simplest rule
            <br />
            gives 3 here
          </span>
        </SceneLabel>
      ) : (
        <SceneLabel position={[HI_LABEL[0], HI_LABEL[1], 0]} align="left" tone="ink" opacity={op('plotAnn')}>
          <span className="cy-callout cy-callout--bg cy-callout--lines">
            <span className="cy-hi-dot" aria-hidden="true" />
            <span className="cy-sym">χ = ±6</span> · 208 pairs
            <br />
            simplest rule gives 3 here
          </span>
        </SceneLabel>
      )}
      <SceneLabel position={[0, y0 - 0.42, 0]} align="below" tone="ink" opacity={op('plotAnn')}>
        <span className="cy-callout cy-callout--center cy-callout--lines">
          <Status kind="derived" compact /> Mirror symmetry: <span className="cy-sym">h¹¹ ↔ h²¹</span>
          <br />
          the plot is its own reflection
        </span>
      </SceneLabel>
      <SceneLabel position={[plotX(-200), plotY(102), 0]} align="right" tone="ink" opacity={op('quintic')}>
        <span className={`cy-callout cy-callout--bg${portrait ? ' cy-callout--end cy-callout--lines' : ''}`}>
          Quintic{portrait ? <br /> : ' · '}(−200, 102)
        </span>
      </SceneLabel>
    </group>
  )
}
