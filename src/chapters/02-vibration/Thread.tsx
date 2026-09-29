import { useEffect, useMemo, useRef, type ComponentType, type Ref } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import {
  COLORS,
  Filament,
  GlowPoint,
  GlowPoints,
  HandoffOpenString,
  HandoffPoint,
  useChapterFrame,
  useHandoffFit,
  type FilamentApi,
  type FilamentProps,
  type GlowPointApi,
  type GlowPointProps,
  type GlowPointsApi,
} from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { claimPointer, explore, setStageCursor } from '@/core/explore'
import { pluck, tick } from '@/core/audio'
import { clamp, damp, hash01 } from '@/core/math'
import { MODES, OMEGA1, packetsFrom, projectPull } from './model'
import type { Shared } from './shared'
import { live, useVib } from './store'
import { drag, pin, TENT_C } from './Director'
import { benchTone, silenceBench } from './benchAudio'

/*
 * The Thread: y(σ,t) = Σₙ Aₙ φₙ(σ) cos(nω₁t + θₙ) (+ swirl: z = ±Σ Aₙ φₙ sin(…)), φₙ = sin(nπσ) pinned /
 * cos(nπσ) free (blendable), plus the always-on bottom-rung jitter Σ (0.015 L/√n) φₙ noiseₙ(t) in y and z.
 * (content/02-vibration.md § Lab › Model 1–4). While dragging, the six-harmonic reconstruction of the pull.
 */

const N = 256
const WIDTH = HANDOFF.H1.width
const SIN = new Float32Array(MODES * N)
const COS = new Float32Array(MODES * N)
const TENT = new Float32Array(N)
for (let n = 1; n <= MODES; n++)
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1)
    SIN[(n - 1) * N + i] = Math.sin(n * Math.PI * s)
    COS[(n - 1) * N + i] = Math.cos(n * Math.PI * s)
  }
for (let i = 0; i < N; i++) {
  let y = 0
  for (let n = 0; n < MODES; n++) y += TENT_C[n] * SIN[n * N + i]
  TENT[i] = y
}

/** Smooth value noise in [−1, 1]. */
function vnoise(x: number) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return (hash01(i) * (1 - u) + hash01(i + 1) * u) * 2 - 1
}

type H1Props = Partial<FilamentProps> & {
  amp?: number
  ref?: Ref<FilamentApi>
}
const H1 = HandoffOpenString as unknown as ComponentType<H1Props>
type H0Props = GlowPointProps & { ref?: Ref<GlowPointApi> }
const H0 = HandoffPoint as unknown as ComponentType<H0Props>

const GHOSTS = 4
const GN = 96
const DOTS = 44

export function Thread({ S }: { S: Shared }) {
  const camera = useThree((s) => s.camera)
  const fit = useHandoffFit()
  const main = useRef<FilamentApi>(null)
  const h1 = useRef<FilamentApi>(null)
  const h0 = useRef<GlowPointApi>(null)
  const far = useRef<GlowPointApi>(null)
  const group = useRef<THREE.Group>(null!)
  const hit = useRef<THREE.Mesh>(null!)
  const dots = useRef<GlowPointsApi>(null)
  const ghosts = useRef<(FilamentApi | null)[]>([])
  const pts = useMemo(() => new Float32Array(N * 3), [])
  const gpts = useMemo(() => Array.from({ length: GHOSTS }, () => new Float32Array(GN * 3)), [])
  const dotPos = useMemo(() => new Float32Array(DOTS * 3), [])
  const dotSizes = useMemo(() => new Float32Array(DOTS).fill(0.05), [])

  const tmp = useMemo(
    () => ({
      c: new Float64Array(MODES),
      cph: new Float64Array(MODES),
      sph: new Float64Array(MODES),
      jy: new Float64Array(MODES),
      jz: new Float64Array(MODES),
      drawn: new Float64Array(MODES),
      statics: new Float32Array(N),
      ray: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hitPt: new THREE.Vector3(),
      warm: new THREE.Color(COLORS.filament),
      warmCore: new THREE.Color(COLORS.filamentCore),
      ink: new THREE.Color(COLORS.ink),
      tc: new THREE.Color(),
      interactive: false,
      lastReq: useVib.getState().pluckReq,
      lastEnds: useVib.getState().ends,
      offY: 0,
    }),
    [],
  )

  /** Pointer → (σ, h) in the thread's frame (h in units of L). */
  const pointerLocal = () => {
    tmp.ndc.set(explore.nx, explore.ny)
    tmp.ray.setFromCamera(tmp.ndc, camera)
    const p = tmp.ray.ray.intersectPlane(tmp.plane, tmp.hitPt)
    if (!p) return false
    const sc = S.thScale
    drag.sp = clamp((p.x - S.thCx) / (S.thL * sc) + 0.5, 0.03, 0.97)
    drag.h = clamp((p.y - S.thCy) / (S.thL * sc), -0.35, 0.35)
    return true
  }

  /** Let go (or the PLUCK button): FREE snaps to whole packets; PINNED rings down classically. */
  const release = (sp: number, hh: number) => {
    const lab = useVib.getState()
    const pinned = lab.ends === 'pinned'
    const mean = projectPull(sp, hh, pinned, tmp.c)
    const t = S.t
    for (let n = 0; n < MODES; n++) {
      pin.phase[n] = -(n + 1) * OMEGA1 * t + (tmp.c[n] < 0 ? Math.PI : 0)
      S.amp[n] = Math.abs(tmp.c[n]) * S.thL
    }
    if (pinned) {
      for (let n = 0; n < MODES; n++) pin.c[n] = tmp.c[n]
      pin.t0 = t
      let max = 1e-6
      for (let n = 0; n < MODES; n++) max = Math.max(max, Math.abs(tmp.c[n]))
      pluck(
        110,
        Array.from({ length: MODES }, (_, i) => ({
          n: i + 1,
          amp: Math.abs(tmp.c[i]) / max,
        })),
        { decay: 3.0, gain: 0.8 },
      )
    } else {
      const k = packetsFrom(tmp.c)
      const K = k.reduce((a, b) => a + b, 0)
      tmp.offY = mean * S.thL
      lab.setK(k, 'pluck')
      lab.say(K > 0 ? 'snap' : Math.abs(mean) > 0.05 ? 'zero' : 'gentle')
      if (K > 0) tick(440)
    }
  }

  useEffect(() => {
    const up = () => {
      if (!drag.on) return
      drag.on = false
      live.dragging = false
      setStageCursor('')
      let hh = drag.h
      if (Math.abs(hh) < 0.012) hh = useVib.getState().pluckStrength // a tap plucks at the slider strength
      release(drag.sp, hh)
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      drag.on = false
      live.dragging = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // benchTone() below runs only while the chapter is visible: silence the bench once it is off
  // screen (any jump away) or unmounted, so its tone can't outlive the chapter
  useEffect(() => silenceBench, [])
  useChapterFrame(
    (f) => {
      if (f.presence <= 0) silenceBench()
    },
    { always: true },
  )

  useChapterFrame((f) => {
    const lab = useVib.getState()
    const B = S.B
    const inBench = B >= 7.9
    const pinned = lab.ends === 'pinned'

    // ── lab input: PLUCK button, ends switch, drag ──
    if (lab.pluckReq !== tmp.lastReq) {
      tmp.lastReq = lab.pluckReq
      if (inBench) release(lab.pluckPos, lab.pluckStrength)
    }
    if (lab.ends !== tmp.lastEnds) {
      tmp.lastEnds = lab.ends
      if (inBench && lab.ends === 'pinned') release(0.2, 0.16) // a guitar is plucked
    }
    const interactive = S.inLab && S.active && B > 8.04 && B < 8.96 && S.lenPx > 80
    tmp.interactive = interactive
    if (drag.on && !interactive) {
      drag.on = false
      live.dragging = false
    }
    if (drag.on) pointerLocal()

    // ── shape ──
    const L = S.thL
    const tOsc = S.reduced ? 0.55 : S.t
    const b = S.basis
    for (let n = 0; n < MODES; n++) {
      const ph = (n + 1) * S.omega * tOsc + S.phase[n]
      tmp.cph[n] = Math.cos(ph)
      tmp.sph[n] = Math.sin(ph)
      const jn = S.jitter / Math.sqrt(n + 1)
      const tau = 0.5 / Math.sqrt(n + 1)
      tmp.jy[n] = jn * vnoise(tOsc / tau + 17.3 * (n + 1))
      tmp.jz[n] = jn * vnoise(tOsc / tau + 91.7 * (n + 1))
    }
    // static shapes: Beat 1's tent pull, or the visitor's pull (six-harmonic reconstruction)
    let staticW = S.staticW
    const statics = tmp.statics
    if (drag.on && inBench) {
      const mean = projectPull(drag.sp, drag.h, pinned, tmp.c)
      for (let i = 0; i < N; i++) {
        let y = 0
        for (let n = 0; n < MODES; n++) y += tmp.c[n] * (pinned ? SIN[n * N + i] : COS[n * N + i])
        statics[i] = y + (pinned ? 0 : mean)
      }
      staticW = 1
      tmp.offY = 0
    } else if (staticW > 0) statics.set(TENT)
    tmp.offY = S.frozen ? 0 : damp(tmp.offY, 0, 5, Math.max(f.dt, 1e-4))

    const cp = Math.cos(S.psi)
    const sp = Math.sin(S.psi)
    const sw = S.swirl
    const env = S.envelope
    const w1 = S.wH1
    const hL = HANDOFF.H1.length * fit
    const hA = HANDOFF.H1.amplitude * fit
    const om = HANDOFF.H1.omega
    const ha = Math.cos(om * S.t)
    const hb = Math.cos(2 * om * S.t + 0.6)
    const hc = Math.sin(om * S.t)
    let envAmp = 0
    for (let i = 0; i < N; i++) {
      const sg = i / (N - 1)
      let Y = 0
      let Z = 0
      let JY = 0
      let JZ = 0
      for (let n = 0; n < MODES; n++) {
        const phi = SIN[n * N + i] * (1 - b) + COS[n * N + i] * b
        const A = S.amp[n]
        if (A !== 0) {
          Y += A * phi * tmp.cph[n]
          Z += A * phi * tmp.sph[n]
        }
        JY += tmp.jy[n] * phi
        JZ += tmp.jz[n] * phi
      }
      let y = Y * cp - sw * Z * sp + JY
      let z = Y * sp + sw * Z * cp + JZ
      y += staticW * statics[i] * L + tmp.offY
      if (Math.abs(y) > envAmp) envAmp = Math.abs(y)
      y *= 1 - env
      z *= 1 - env
      let x = (sg - 0.5) * L
      if (w1 > 0) {
        const hx = (sg - 0.5) * hL
        const hy = hA * (0.8 * COS[i] * ha + 0.45 * COS[N + i] * hb)
        const hz = hA * 0.35 * COS[i] * hc
        x += (hx - x) * w1
        y += (hy - y) * w1
        z += (hz - z) * w1
      }
      pts[i * 3] = x
      pts[i * 3 + 1] = y
      pts[i * 3 + 2] = z
    }

    // ── main thread transform & look ──
    const g = group.current
    const sc = S.thScale
    g.position.set(S.thCx, S.thCy, 0)
    g.scale.setScalar(Math.max(sc, 1e-9))
    const visible = S.thOp > 0.002
    g.visible = visible
    const mat = main.current?.material
    if (mat && visible) {
      main.current!.update()
      // far view: below 40 px the string is drawn as its time-averaged glow envelope, a soft band
      const envW = Math.max(WIDTH + 2 * envAmp, (0.7 * S.lenPx) / Math.max(1e-9, sc * S.ppu))
      const base = WIDTH / Math.max(sc, 1e-9)
      mat.uniforms.uWidth.value = base + (envW - base) * env
      mat.uniforms.uCoreFrac.value = 0.2 - 0.06 * env
      tmp.tc.copy(tmp.ink).lerp(tmp.warm, S.warmth)
      mat.uniforms.uGlow.value.copy(tmp.tc)
      tmp.tc.copy(tmp.ink).lerp(tmp.warmCore, S.warmth)
      mat.uniforms.uCore.value.copy(tmp.tc)
      mat.uniforms.uIntensity.value = S.thInt * (1 - 0.62 * S.ghostSplit) * (1 - 0.35 * env)
      mat.uniforms.uOpacity.value = S.thOp * (1 - 0.72 * S.dotted)
    }

    // H1 (the canonical handoff string) at the very start
    if (h1.current) h1.current.group.visible = S.h1Op > 0

    // dotted Thread (spin-½ cells: no wiggle picture)
    if (dots.current) {
      const on = S.dotted > 0 && visible
      dots.current.visible = on
      if (on) {
        for (let d = 0; d < DOTS; d++) {
          const i = Math.round((d / (DOTS - 1)) * (N - 1))
          dotPos[d * 3] = pts[i * 3]
          dotPos[d * 3 + 1] = pts[i * 3 + 1]
          dotPos[d * 3 + 2] = pts[i * 3 + 2]
        }
        dots.current.geometry.getAttribute('position').needsUpdate = true
      }
    }

    // ghosts: Beat 1's pluck, split into its first four harmonics
    const gOp = S.ghostOp
    const gap = (S.layout.mobile ? 0.26 : 0.56) * S.ghostSplit
    for (let k = 0; k < GHOSTS; k++) {
      const api = ghosts.current[k]
      if (!api) continue
      api.group.visible = gOp > 0.002
      if (gOp <= 0.002) continue
      const P = gpts[k]
      const ck = S.ghostC[k]
      const cos = Math.cos((k + 1) * S.omega * tOsc + S.phase[k])
      for (let i = 0; i < GN; i++) {
        const sg = i / (GN - 1)
        P[i * 3] = S.thCx + (sg - 0.5) * L
        P[i * 3 + 1] = S.thCy - gap * (k + 1) + ck * Math.sin((k + 1) * Math.PI * sg) * cos
        P[i * 3 + 2] = 0
      }
      api.update()
      api.material.uniforms.uOpacity.value = gOp * (0.9 - 0.12 * k)
    }

    // far view: the point sprite (lab + exit; Beats 4–5 hand the point to the catalogue)
    const fp = far.current
    if (fp) {
      const on = inBench && S.pointW > 0.002
      fp.visible = on
      if (on) {
        fp.position.set(S.thCx, S.thCy, 0)
        const halo = S.pointHalo
        fp.material.uniforms.uSize.value = (5 * halo) / S.ppu
        fp.material.uniforms.uIntensity.value = 1.15 * S.pointW * (1 - S.h0Op)
      }
    }
    if (h0.current) {
      h0.current.visible = S.h0Op > 0.002
      h0.current.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * S.h0Op
    }

    // hit band for plucking
    const hm = hit.current
    if (hm) {
      hm.position.set(S.thCx, S.thCy, 0)
      hm.scale.set(S.thL * sc + 0.4, Math.max(0.7, 110 / S.ppu), 1)
      hm.raycast = interactive ? THREE.Mesh.prototype.raycast : () => {}
    }

    // live readouts + sound
    for (let n = 0; n < MODES; n++) {
      tmp.drawn[n] = S.amp[n] / Math.max(1e-6, L)
      live.amps[n] = tmp.drawn[n]
    }
    benchTone(tmp.drawn, inBench && B < 9 && S.inLab && S.active && !pinned && S.lenPx > 40, lab.volume, performance.now())
  })

  return (
    <>
      <H1 ref={h1} />
      <group ref={group}>
        <Filament ref={main} points={pts} count={N} width={WIDTH} beads />
        <GlowPoints
          ref={dots}
          positions={dotPos}
          sizes={dotSizes}
          color={COLORS.filamentCore}
          minPixels={1.6}
          maxPixels={6}
          sharpness={0.7}
          intensity={1.1}
          visible={false}
        />
      </group>
      {Array.from({ length: GHOSTS }, (_, k) => (
        <Filament
          key={k}
          ref={(api) => {
            ghosts.current[k] = api
          }}
          points={gpts[k]}
          count={GN}
          width={0.05}
          minPixels={0.7}
          coreFraction={0.14}
          intensity={0.85}
          visible={false}
        />
      ))}
      <GlowPoint ref={far} size={0.2} minPixels={1.5} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} visible={false} />
      <H0 ref={h0} visible={false} />
      <mesh
        ref={hit}
        onPointerDown={(e) => {
          if (!tmp.interactive) return
          e.stopPropagation()
          claimPointer()
          drag.on = true
          live.dragging = true
          pointerLocal()
          drag.h = 0
          setStageCursor('grabbing')
        }}
        onPointerOver={() => tmp.interactive && !drag.on && setStageCursor('grab')}
        onPointerOut={() => !drag.on && setStageCursor('')}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </>
  )
}
