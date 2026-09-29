import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Backdrop, COLORS, Filament, HandoffLoop, loopFn, useChapterFrame, useHandoffFit, useViewShift, type FilamentApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { clamp, easeInOutCubic, lerp, logLerp, range, smoothstep, TAU } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { pluck } from '@/core/audio'
import { DRUM_A, DRUM_B, DRUM_RATIOS, lowestInto, rho, STEPS } from './model'
import { dictSeam, useDuality } from './store'
import { World, makeWorld, type WorldState } from './gl/World'
import { Segs, Swatches, type SegsApi, type SwatchesApi } from './gl/Swatches'
import { Ribbons, dashedCircle, rgb, type RibbonsApi } from './gl/Ribbons'
import { Drums, centeredPolygon, samplePerimeter, type DrumsApi } from './gl/Drums'
import { Plot, PH, PW, plotX, type PlotApi } from './gl/Plot'
import { Lbl, ReadLbl, place, placeReading, readSlot, slot, type Slot } from './gl/Label'
import { Floor, type FloorApi } from './gl/Floor'

/*
 * Chapter 08 · Duality — the director. Everything on stage is a function of one timeline,
 *   T = Σ step progress: title 0‥1 · opening 1‥2 · drums 2‥3 · momentum 3‥4 · winding 4‥5 ·
 *   aha 5‥6 · landing 6‥7 · selfdual 7‥8 · web 8‥9 · lab 9‥10 · outro 10‥(10.67 at progress 1)
 * plus the lab store and the stage clock. IN and OUT frames are exactly <HandoffLoop/> (H2) at
 * HANDOFF.camera with no view shift. Physics: model.ts (content/08-duality.md § Model).
 * Every hidden circle is a cartoon: drawn ∝ √R, not to scale.
 */

const TANH = Math.tan((HANDOFF.camera.fov * Math.PI) / 360)
const DEG = Math.PI / 180
const NLOOP = HANDOFF.H2.count
const T_SPLIT = 1.3
const T_END = 10.5
const DRUM_Y = 0.78
const BAR_BASE = -1.72
const LADDER_BASE = -1.55
/** Beat 4 (desktop): gap between the seam ladder's end and each world's inner edge. */
const WGAP = 0.5
const YAW1 = 28 * DEG
const PITCH1 = 14 * DEG
const YAW2 = 25 * DEG
const PITCH2 = 12 * DEG
const B2_FLASH = [0.15, 0.35, 0.55]
/** Lab worlds are drawn slightly smaller so even the largest circle clears the hint above. */
const LAB_S = 0.88
/** Portrait camera distance per beat index (1 opening … 8 web). */
const PORTRAIT_D = [10, 17, 19.5, 21, 21, 18, 18, 20.5, 17]

const fx2 = (v: number) => v.toFixed(2)
/**
 * Desktop: the free stage between the beat column and the chapter rail's label, from a px model of the shared
 * layout (column ≈ 6% gutter + 34ch; rail label ≈ the last 176 px). Returns [left, right] in px.
 */
const freeRegion = (w: number): [number, number] => [Math.min(0.06 * w + 440, 0.55 * w), w - 176]
/** Beat 4 stacks WORLDS over the ladder (as on phones) when the free region is too narrow for one row. */
const stackedAha = (w: number, h: number) => w / Math.max(1, h) < 0.8 || freeRegion(w)[1] - freeRegion(w)[0] < 560
/** One world's reading of a rung: n whole wavelengths, w windings. */
const reading = (n: number, w: number) => `n ${n} · w ${w}`

interface Batch {
  api: SwatchesApi | null
  n: number
}

export default function Scene() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const fit = useHandoffFit()
  const stack = stackedAha(size.width, size.height)

  const WA = useMemo(makeWorld, [])
  const WB = useMemo(makeWorld, [])
  const D = useMemo(() => ({ sx: 0, sy: 0 }), [])
  const L = useMemo(
    () => ({
      wA: slot(),
      wB: slot(),
      eqq: slot(),
      tri: slot(),
      tones: slot(),
      cartoon: slot(),
      around: slot(),
      axis: slot(),
      n: slot(),
      R: slot(),
      readout: slot(),
      lm: slot(),
      lw: slot(),
      point: slot(),
      tag: slot(),
      match: slot(),
      prod: slot(),
      mass: slot(),
      t01: slot(),
      t1: slot(),
      t10: slot(),
      ylab: slot(),
      sd: slot(),
      fold: slot(),
      set: slot(),
      eqv: slot(),
      glyph: slot(),
      honest: slot(),
      rdA: readSlot(),
      rdB: readSlot(),
      hA: slot(),
      hB: slot(),
      sdm: slot(),
      c0: slot(),
      c1: slot(),
      c2: slot(),
    }),
    [],
  )

  const handoff = useRef<THREE.Group>(null!)
  const copyA = useRef<FilamentApi>(null)
  const copyB = useRef<FilamentApi>(null)
  const outro = useRef<FilamentApi>(null)
  const circA = useRef<THREE.Group>(null!)
  const circB = useRef<THREE.Group>(null!)
  const circARib = useRef<RibbonsApi>(null)
  const circBRib = useRef<RibbonsApi>(null)
  const drums = useRef<DrumsApi>(null)
  const plot = useRef<PlotApi>(null)
  // Chapter 07 hands over H2 in front of its reference brane, dimmed to 10%, 1.9 below the loop;
  // the same faint sheet sits here at progress 0 and dissolves as the camera starts to move
  const floor = useRef<FloorApi>(null)

  const circle = useMemo(() => dashedCircle(rgb(COLORS.field), 1, 56, 0.5), [])
  const circleSmall = useMemo(() => dashedCircle(rgb(COLORS.field), 1, 12, 0.5), [])
  const loop = useMemo(() => loopFn(HANDOFF.H2.wobble, HANDOFF.H2.radius * fit), [fit])

  const S = useMemo(() => {
    return {
      polyA: samplePerimeter(centeredPolygon(DRUM_A), NLOOP),
      polyB: samplePerimeter(centeredPolygon(DRUM_B), NLOOP),
      ptsA: new Float32Array(NLOOP * 3),
      ptsB: new Float32Array(NLOOP * 3),
      ptsO: new Float32Array(NLOOP * 3),
      v: new THREE.Vector3(),
      e: new THREE.Euler(0, 0, 0, 'XYZ'),
      fam: new Float64Array(64),
      idx: new Int32Array(64),
      labFam: new Float64Array(64),
      labR: -1,
      jumps: useDuality.getState().jumps,
      jumpT0: -99,
      swapped: false,
      litPairs: 0,
      litT: -99,
      cA: new THREE.Color(),
      cB: new THREE.Color(),
      field: new THREE.Color(COLORS.field),
      fil: new THREE.Color(COLORS.filament),
      filCore: new THREE.Color(COLORS.filamentCore),
      ink: new THREE.Color(COLORS.ink),
      ink2: new THREE.Color(COLORS.ink2),
      ink3: new THREE.Color(COLORS.ink3),
      sw: { api: null, n: 0 } as Batch,
      sg: { api: null as SegsApi | null, n: 0 },
      gaps: new Float64Array(24),
      rg: { api: null, n: 0 } as Batch,
      // per-frame context
      T: 0,
      t: 0,
      dt: 0,
      amb: 1,
      frozen: false,
      reduced: false,
      portrait: false,
      stack: false, // Beat 4: worlds over the ladder (phones, narrow landscape) instead of one row
      upx: 0.01,
      xRight: 3,
      hw: 5, // half the visible width at z = 0 (world units)
      yTop: 3,
      yBot: -3,
      RA: 3,
      RB: 1,
      Rset: 3,
      q10: 0,
      labK: 0,
      left: null as WorldState | null,
      bv: new Float64Array(3),
      // layout (desktop | portrait), refreshed every frame
      wx: 2.2, // Beat 4 (phones): world centres at ±wx, height wy, scale ws
      wy: 1.15,
      ws: 1,
      wxA: 2.2, // Beat 4: A's and B's centres (desktop: anchored by their inner edges)
      wxB: 2.2,
      half: 0.8, // Beat 4: the seam ladder's half width
      land: 0, // 0 → 1 as the landing scales the ladder up
      lb: LADDER_BASE, // seam ladder base and height per unit mass
      lk: 1.1,
      cx: -0.95, // Beats 2–3: the single cylinder's centre and length
      cy: 0.2,
      clen: 4.4,
      cs: 1, // Beats 2–3: the single cylinder's scale
      lmx: 2.3, // Beats 2–3: the two energy ladders
      lwx: 3.1,
      lbase: -2,
      ltop: 2,
      lsc: 0.8,
      lrw: 0.5,
      drumY: DRUM_Y, // Beat 1: drums' height and the tone bars' baseline
      barBase: BAR_BASE,
      plotS: 1, // Beat 5: plot scale
    }
  }, [])

  const add = (b: Batch, x: number, y: number, w: number, h: number, c: THREE.Color, a: number) => {
    if (!b.api || a <= 0.003) return
    b.api.set(b.n++, x, y, w, h, c.r, c.g, c.b, a)
  }
  const q = (k: number) => clamp(S.T - k, 0, 1)

  useViewShift(() => [D.sx, D.sy])
  if (import.meta.env.DEV) (window as unknown as { __du: unknown }).__du = { WA, WB, S, D, camera }

  // ───────────── camera: per-beat framing, cross-faded across step boundaries ─────────────
  const beatFrame = (k: number, fitD: (W: number, H: number, fW?: number, fH?: number) => number, dLab: number) => {
    const bv = S.bv
    const SX = S.portrait ? 0 : 0.14
    const SY = S.portrait ? 0.2 : 0
    const LSX = S.portrait ? 0 : -0.18
    const LSY = S.portrait ? 0.1 : 0.03
    bv[1] = SX
    bv[2] = SY
    if (S.portrait && k >= 1 && k <= 8) {
      // phones: dolly back so each composition fits the upper 60% (content pack: d ≈ 17)
      bv[0] = PORTRAIT_D[k]
      return
    }
    switch (k) {
      case 0:
        bv[0] = 10
        bv[1] = 0
        bv[2] = 0
        break
      case 1:
        bv[0] = fitD(7.3, 3.9)
        break
      case 2:
        bv[0] = fitD(6.4, 4.3)
        break
      case 3: {
        const g = smoothstep(0.6, 1, q(3))
        bv[0] = fitD(7.1 + 0.5 * g, 4.9 + 1.1 * g)
        break
      }
      case 4: {
        const g = smoothstep(0.5, 1, q(4))
        bv[0] = fitD(7.7 - 0.3 * g, 6.0 - 1.3 * g)
        break
      }
      case 5:
      case 6: {
        // the row WORLD A | ladder | WORLD B, framed in the free region between the beat column and the chapter
        // rail's label (px model of the shared layout), and kept centred there as its weight shifts
        const Wpx = Math.max(1, size.width)
        const [textR, railL] = freeRegion(Wpx)
        const fRegion = Math.max(0.28, (railL - textR) / Wpx)
        const cRegion = (textR + railL) / 2 / Wpx - 0.5
        if (S.stack) {
          // narrow landscape: the phone composition (worlds over the ladder), framed in the free region
          bv[0] = fitD(2 * (S.wx + hwOf(rho(3), S.ws)) + 0.4, 6.2, fRegion, 0.84)
          bv[1] = cRegion
          bv[2] = 0.02
          break
        }
        const hA = hwOf(rho(S.RA), S.ws)
        const hB = hwOf(rho(S.RB), S.ws)
        const left = S.wxA + hA
        const right = S.wxB + hB
        bv[0] = fitD(left + right + 0.4, 5.3, fRegion, 0.8)
        bv[1] = cRegion - (right - left) / 2 / (2 * bv[0] * TANH * (Wpx / Math.max(1, size.height)))
        break
      }
      case 7:
      case 8:
        bv[0] = fitD(6.8, 6.3)
        break
      case 9:
        bv[0] = dLab
        bv[1] = LSX
        bv[2] = LSY
        break
      default: {
        // outro: the view re-centres first, so the two worlds merge in the middle of the frame; then the dolly
        const q10 = range(S.T, 10, T_END)
        const ks = smoothstep(0, 0.36, q10)
        const kd = smoothstep(0.3, 0.88, q10)
        bv[0] = lerp(dLab, 10, kd)
        bv[1] = lerp(LSX, 0, ks)
        bv[2] = lerp(LSY, 0, ks)
      }
    }
  }

  useChapterFrame(
    (f) => {
      const { t, dt, h } = f
      S.t = t
      S.dt = dt
      S.frozen = dt === 0
      S.amb = ambient()
      S.reduced = prefersReducedMotion()
      let T = 0
      for (let i = 0; i < STEPS.length; i++) T += h.step(STEPS[i][0])
      S.T = T
      const aspect = size.width / Math.max(1, size.height)
      S.portrait = aspect < 0.8
      S.stack = stackedAha(size.width, size.height)
      if (S.portrait) {
        // phones: compose in the upper 60%, worlds above the seam ladder, ladders under the circle
        S.wx = 1.24
        S.wy = 1.4
        S.ws = 0.56
        S.lb = -2.55
        S.lk = 1.0
        S.cx = 0
        S.cy = 1.75
        S.clen = 3.3
        S.cs = 0.66
        S.lmx = -0.55
        S.lwx = 0.55
        S.lbase = -2.3
        S.ltop = -0.1
        S.lsc = 0.5
        S.lrw = 0.62
        S.drumY = 1.5
        S.barBase = -0.95
        S.plotS = 0.84
      } else {
        S.wx = 2.3
        S.wy = LADDER_BASE + 2.55
        S.ws = 0.66
        S.lb = LADDER_BASE
        S.lk = 1.25
        S.cx = -1.1
        S.cy = 0.2
        S.clen = 4.4
        S.cs = 1
        S.lmx = 2.45
        S.lwx = 3.25
        S.lbase = -2
        S.ltop = 2
        S.lsc = 0.8
        S.lrw = 0.5
        S.drumY = DRUM_Y
        S.barBase = BAR_BASE
        S.plotS = 1
      }

      radii()
      ahaLayout()

      const fw = S.portrait ? 0.92 : 0.5
      const fh = S.portrait ? 0.5 : 0.78
      const fitD = (W: number, H: number, fW = fw, fH = fh) => Math.max(10, W / (fW * 2 * TANH * aspect), H / (fH * 2 * TANH))
      const dLab = S.portrait ? fitD(7.6, 4.8, 0.94, 0.4) : fitD(8.3, 5.6, 0.6, 0.66)
      let dCam = 0
      let sx = 0
      let sy = 0
      const X = 0.16
      for (let k = 0; k <= 10; k++) {
        // the first move (H2 → the opening's framing) starts as the title card begins to scroll away,
        // so the loop recedes to the right instead of meeting the title on its way up
        const up = (j: number) => (j === 1 ? 1 - (1 - range(T, 0.5, 1.02)) ** 2 : smoothstep(j - X, j + X, T))
        const w = (k === 0 ? 1 : up(k)) * (k === 10 ? 1 : 1 - up(k + 1))
        if (w <= 0) continue
        beatFrame(k, fitD, dLab)
        dCam += w * S.bv[0]
        sx += w * S.bv[1]
        sy += w * S.bv[2]
      }
      D.sx = sx
      D.sy = sy
      camera.position.set(0, 0, dCam)
      camera.lookAt(0, 0, 0)
      const hh = dCam * TANH
      const hw = hh * aspect
      S.upx = (2 * hh) / Math.max(1, size.height)
      S.hw = hw
      S.xRight = hw * (1 - 2 * sx) - 44 * S.upx
      S.yTop = hh * (1 - 2 * sy) + 4 * S.upx
      S.yBot = -hh * (1 + 2 * sy) - 4 * S.upx

      handoff.current.visible = T < T_SPLIT || T >= T_END
      S.sw.n = 0
      S.rg.n = 0
      S.sg.n = 0

      opening()
      drumsBeat()
      worlds()
      ladders()
      seamLadder()
      foldPlot()
      lab()
      outroThread()
      worldLabels()
      seam()

      S.sw.api?.commit(S.sw.n)
      S.sg.api?.commit(S.sg.n)
      S.rg.api?.commit(S.rg.n)
    },
    { priority: -3 },
  )

  // ───────────── R choreography (Beats 2–5) ─────────────
  function radii() {
    const T = S.T
    let RB = 1
    if (T < 4) RB = logLerp(1, 3, smoothstep(0.6, 1, q(3)))
    else if (T < 5) RB = logLerp(3, 1 / 3, smoothstep(0.5, 1, q(4)))
    let RA = 3
    if (T >= 5) {
      const q5 = q(5)
      const m = S.reduced ? (q5 < 0.575 ? 0 : 1) : smoothstep(0.35, 0.8, q5)
      RA = logLerp(3, 1 / 3, m)
      RB = 1 / RA
    }
    S.Rset = logLerp(3, 0.1, range(q(7), 0.62, 0.97))
    if (T >= 6.9) {
      RA = T < 7.5 ? logLerp(1 / 3, 3, smoothstep(6.95, 7.25, T)) : S.Rset
      RB = 1 / RA
    }
    S.RA = RA
    S.RB = RB
  }

  /** Projected half-width of a world (cylinder length 2.2 at yaw 25°, radius ρ, scale ws), with a perspective margin. */
  function hwOf(rh: number, ws: number) {
    return ws * (0.997 + 0.4226 * (rh + 0.02)) * 1.05
  }

  // ───────────── Beat 4 layout: WORLD A | seam ladder | WORLD B ─────────────
  function ahaLayout() {
    const T = S.T
    if (S.stack) {
      if (!S.portrait) {
        // narrow landscape uses the phone composition
        S.wx = 1.3
        S.wy = 1.45
        S.ws = 0.58
        S.lb = -2.5
        S.lk = 1.0
      }
      S.half = 0.62
      S.land = 0
      S.wxA = S.wxB = S.wx
      return
    }
    // landing: the one spectrum grows; the two pictures step back a little
    const land = smoothstep(6.02, 6.45, T)
    S.land = land
    S.half = 0.8 * (1 + 0.3 * land)
    S.lk = 1.25 * (1 + 0.3 * land)
    S.lb = LADDER_BASE - 0.45 * land
    S.ws = 0.66 * (1 - 0.14 * land)
    S.wy = LADDER_BASE + 2.55 + 0.25 * land
    // each world hangs a fixed gap outside the ladder, so a growing circle extends outward, never into the rail
    S.wxA = S.half + WGAP + hwOf(rho(S.RA), S.ws)
    S.wxB = S.half + WGAP + hwOf(rho(S.RB), S.ws)
  }

  // ───────────── Opening: the loop splits into two worlds ─────────────
  function opening() {
    const T = S.T
    // progress 0 sits at T ≈ 0.44 and the camera leaves H2 at T = 0.5: the sheet is gone (edges first) before
    // the move is three-quarters done, so it never reads as a tile floating under the loop
    const fl = floor.current
    if (fl) {
      const fo = 0.1 * (1 - smoothstep(0.44, 0.78, T))
      fl.mesh.visible = fo > 0.002
      fl.uniforms.uOpacity.value = fo
      fl.uniforms.uSoft.value = smoothstep(0.45, 0.62, T)
    }
    const sp = easeInOutCubic(range(T, T_SPLIT, 1.66))
    const un = smoothstep(0.03, 0.22, q(2))
    const on = T >= T_SPLIT && T < 3.08
    const sep = S.portrait ? 1.3 : 1.9
    const s = lerp(1, 0.6, sp)
    const xc = sep * sp
    const yc = lerp(0, S.drumY, un)
    const fadeOut = 1 - smoothstep(2.9, 3.06, T)
    drawCopy(copyA.current, S.polyA, S.ptsA, -1, on, s, xc, yc, un, fadeOut, 1)
    drawCopy(copyB.current, S.polyB, S.ptsB, 1, on, s, xc, yc, un, fadeOut, Math.min(1, sp * 5))
    // WORLD A on a big dashed circle, WORLD B on a tiny one
    const cOp = 0.25 * smoothstep(1.72, 1.9, T) * (1 - smoothstep(2.0, 2.12, T))
    circA.current.visible = circB.current.visible = cOp > 0.003
    circA.current.position.set(-xc, 0, -0.01)
    circA.current.scale.setScalar(S.portrait ? 1.15 : 1.6)
    circB.current.position.set(xc, 0, -0.01)
    circB.current.scale.setScalar(0.2)
    if (circARib.current) circARib.current.material.uniforms.uOpacity.value = cOp
    if (circBRib.current) circBRib.current.material.uniforms.uOpacity.value = Math.min(1, cOp * 2.4)
    const lab = smoothstep(1.52, 1.66, T) * (1 - smoothstep(2.04, 2.14, T))
    const ly = HANDOFF.H2.radius * fit * s + 0.34
    place(L.wA, -xc, ly, 0, lab, 'WORLD A')
    place(L.wB, xc, ly, 0, lab, 'WORLD B')
    place(L.eqq, 0, 0, 0, smoothstep(1.76, 1.9, T) * (1 - smoothstep(2.0, 2.1, T)), '= ?')
  }

  function drawCopy(api: FilamentApi | null, poly: Float32Array, pts: Float32Array, sign: number, on: boolean, s: number, xc: number, yc: number, un: number, fadeOut: number, op: number) {
    if (!api) return
    api.group.visible = on
    if (!on) return
    for (let i = 0; i < NLOOP; i++) {
      loop(i / NLOOP, S.t, S.v, i)
      pts[i * 3] = sign * xc + lerp(S.v.x * s, poly[i * 2], un)
      pts[i * 3 + 1] = yc + lerp(S.v.y * s, poly[i * 2 + 1], un)
      pts[i * 3 + 2] = lerp(S.v.z * s, 0, un)
    }
    api.update()
    // the loop cools into a Field hairline as it becomes a drum outline (drums are not strings)
    const u = api.material.uniforms
    u.uGlow.value.copy(S.fil).lerp(S.field, un)
    u.uCore.value.copy(S.filCore).lerp(S.field, un * 0.85)
    u.uWidth.value = lerp(HANDOFF.H2.width, 0.016, un)
    u.uIntensity.value = lerp(1, 0.95, un)
    u.uOpacity.value = op * fadeOut
  }

  // ───────────── Beat 1: can you hear the shape of a drum? ─────────────
  function drumsBeat() {
    const dr = drums.current
    const T = S.T
    const q2 = q(2)
    const sep = S.portrait ? 1.3 : 1.9
    const op = smoothstep(2.06, 2.2, T) * (1 - smoothstep(2.9, 3.05, T))
    if (!dr) return
    dr.a.visible = dr.b.visible = op > 0.003
    if (op <= 0.003) {
      S.litPairs = T < 2.3 ? 0 : S.litPairs
      return
    }
    dr.a.position.set(-sep, S.drumY, 0)
    dr.b.position.set(sep, S.drumY, 0)
    const BAR_BASE = S.barBase
    const DRUM_Y = S.drumY
    const nb = 8 * range(q2, 0.35, 0.9)
    const lit = Math.floor(nb + 1e-6)
    if (lit > S.litPairs) {
      S.litT = S.t
      // each matching pair of tones, f = 220·√(λₖ/λ₁) Hz, panned left and right (muted unless sound is on)
      const fr = 220 * DRUM_RATIOS[Math.min(7, lit - 1)]
      pluck(fr, [{ n: 1, amp: 1 }], { decay: 1.4, gain: 0.3, pan: -0.6 })
      pluck(fr, [{ n: 1, amp: 1 }], { decay: 1.4, gain: 0.3, pan: 0.6 })
    }
    S.litPairs = lit
    const pulse = S.frozen ? 0 : Math.exp(-(S.t - S.litT) / 0.7)
    const breath = 0.35 * smoothstep(0.3, 0.4, q2) * (0.5 + 0.5 * Math.sin(TAU * 0.6 * S.t * S.amb)) + 0.9 * pulse
    dr.fill.uniforms.uOp.value = op
    dr.fill.uniforms.uBreath.value = breath
    const cutOp = op * (0.42 * smoothstep(0.18, 0.24, q2) * (1 - smoothstep(0.34, 0.44, q2)) + 0.07 * smoothstep(0.34, 0.44, q2))
    if (dr.cuts) dr.cuts.material.uniforms.uOpacity.value = cutOp
    if (dr.cutsB) dr.cutsB.material.uniforms.uOpacity.value = cutOp
    // the tones: 8 bars per drum, mirrored about the seam; a level Ink hairline joins each equal pair
    const bw = 0.07
    const upx = S.upx
    for (let k = 0; k < 8; k++) {
      const g = clamp(nb - k, 0, 1)
      if (g <= 0) continue
      const hgt = (DRUM_RATIOS[k] / DRUM_RATIOS[7]) * easeInOutCubic(Math.min(1, g * 1.6))
      const xL = -(sep - 0.72 + 0.205 * k)
      const xR = sep - 0.72 + 0.205 * k
      add(S.sw, xL - bw / 2, BAR_BASE, bw, hgt, S.field, 0.8 * op)
      add(S.sw, xR - bw / 2, BAR_BASE, bw, hgt, S.field, 0.8 * op)
      add(S.sw, xL, BAR_BASE + hgt - 0.5 * upx, xR - xL, upx, S.ink, 0.5 * smoothstep(0.6, 1, g) * op)
    }
    add(S.sw, -sep - 0.95, BAR_BASE - upx, sep * 2 + 1.9, upx, S.ink3, 0.6 * op * smoothstep(0.3, 0.38, q2))
    place(L.tri, 0, DRUM_Y + 1.32, 0, op * smoothstep(0.2, 0.26, q2) * (1 - smoothstep(0.42, 0.5, q2)), 'SAME 7 TRIANGLES · REARRANGED · SAME AREA · SAME PERIMETER')
    place(L.tones, 0, BAR_BASE - 0.3, 0, op * smoothstep(0.36, 0.42, q2), `${Math.min(8, lit)} / 8 TONES MATCH · SHAPES DIFFER`)
    place(L.cartoon, 0, BAR_BASE - 0.56, 0, op * smoothstep(0.42, 0.5, q2) * 0.9, '~ CARTOON MOTION')
  }

  // ───────────── the seam between the two descriptions ─────────────
  function seam() {
    const T = S.T
    if (T < 1.1) return
    const toEdge = smoothstep(2.9, 3.15, T) * (1 - smoothstep(4.95, 5.15, T))
    let x = lerp(0, S.xRight, toEdge)
    let op = lerp(0.4, 0.1, toEdge)
    if (T > 5 && T < 6) {
      // one flash as the two circles pass through the same size
      const l = Math.log10(S.RA)
      op += 0.6 * Math.exp(-((l / 0.05) ** 2))
    }
    op *= 1 - 0.85 * smoothstep(5.85, 6.1, T)
    op *= 1 - smoothstep(6.6, 6.95, T)
    op += 0.26 * smoothstep(8.9, 9.15, T) * (1 - smoothstep(10.2, 10.45, T)) + 0.08 * smoothstep(10.2, 10.45, T)
    // Beat 6 (desktop): the seam returns as the dictionary's "=" column, behind its glass rows
    const web = S.portrait || dictSeam.x < 0 ? 0 : smoothstep(8.1, 8.32, T) * (1 - smoothstep(8.7, 8.86, T))
    if (web > 0.003) {
      x = (dictSeam.x / Math.max(1, size.width) - 0.5 - D.sx) * 2 * S.hw
      op = 0.22 * web
    }
    if (op <= 0.003) return
    const draw = T > 6.5 ? 1 : smoothstep(1.1, 1.36, T)
    // phones: the stage is the upper 60% (text and the lab sheet sit below), so the hairline ends there;
    // at the outro the frame is the full-height H2 again, so the faint OUT seam spans it as on desktop
    const floorF = lerp(lerp(0.45, 0.6, smoothstep(4.9, 5.1, T) * (1 - smoothstep(6.9, 7.1, T))), 1, smoothstep(10.2, 10.45, T))
    const floorY = S.portrait ? lerp(S.yTop, S.yBot, floorF) : S.yBot
    const bot = lerp(S.yTop, floorY, draw)
    // the hairline steps aside wherever a centred label or glyph sits on it
    const G = S.gaps
    let ng = 0
    const gapFor = (sl: Slot, hPx: number, wPx = sl.text.length * 3.9 + 8) => {
      if (sl.op <= 0.01 || !sl.group || ng >= 12) return
      const p = sl.group.position
      // centred labels: the seam gaps wherever it crosses the label's width (also while it slides away)
      if (Math.abs(p.x - x) > wPx * S.upx) return
      const y0 = p.y - hPx * S.upx
      const y1 = p.y + hPx * S.upx
      // insertion by lower edge
      let i = ng++
      while (i > 0 && G[2 * (i - 1)] > y0) {
        G[2 * i] = G[2 * (i - 1)]
        G[2 * i + 1] = G[2 * (i - 1) + 1]
        i--
      }
      G[2 * i] = y0
      G[2 * i + 1] = y1
    }
    gapFor(L.eqq, 26, 30)
    gapFor(L.glyph, 26, 22)
    gapFor(L.tri, 12)
    gapFor(L.tones, 12)
    gapFor(L.cartoon, 12)
    gapFor(L.tag, 12)
    gapFor(L.match, 12)
    gapFor(L.prod, 12, 110)
    gapFor(L.honest, 12)
    gapFor(L.sdm, 12)
    let y = bot
    for (let i = 0; i < ng; i++) {
      // a sliver between two nearby labels would read as a tick: skip it
      if (G[2 * i] > y + 6 * S.upx) add(S.sw, x - 0.5 * S.upx, y, S.upx, G[2 * i] - y, S.field, op)
      y = Math.max(y, G[2 * i + 1])
    }
    if (S.yTop > y) add(S.sw, x - 0.5 * S.upx, y, S.upx, S.yTop - y, S.field, op)
  }

  // ───────────── the worlds (Beats 2–5) ─────────────
  function worlds() {
    const T = S.T
    const q3 = q(3)
    const q4 = q(4)
    const q5 = q(5)
    const m45 = smoothstep(4.97, 5.22, T)
    const m57 = smoothstep(6.92, 7.18, T)
    const gone = T > 8.12 && T < 8.86
    // WB: the protagonist circle of Beats 2–3, then WORLD B
    const W = WB
    W.on = T > 3.02 && T < 10.52 && !gone
    W.len = lerp(S.clen, 2.2, m45)
    W.yaw = lerp(YAW1, YAW2, m45)
    W.pitch = lerp(PITCH1, PITCH2, m45)
    W.x = lerp(S.cx, S.wxB, m45)
    W.y = lerp(S.cy, S.wy, m45)
    W.z = 0
    W.scale = lerp(S.cs, S.ws, m45)
    W.rho = rho(S.RB)
    W.reveal = smoothstep(3.04, 3.38, T)
    W.cylOp = smoothstep(3.03, 3.12, T)
    W.threadOp = smoothstep(3.14, 3.26, T)
    W.glow = 1
    W.threadX = 0
    W.stretch = 0
    W.point = false
    W.demoOp = 0
    W.waveX = lerp(-0.8, -0.62, m45)
    W.waveOp = smoothstep(3.16, 3.26, T)
    // Beat 2: momentum n = 1 → 2 → 3 (wave locks at local p 0.15, 0.35, 0.55)
    const n = q3 < 0.15 ? 0 : q3 < 0.35 ? 1 : q3 < 0.55 ? 2 : 3
    W.spec.b = 0
    W.spec.a = Math.max(1, n)
    W.spec.S = 0
    W.waveA = n
    let fl = 0
    for (let i = 0; i < 3; i++) fl += Math.exp(-(((q3 - B2_FLASH[i]) / 0.02) ** 2))
    W.waveFlash = T < 4 ? fl : 0
    if (T >= 4) {
      // Beat 3: the loop stretches round the circle and wraps once, then twice
      W.waveA = 0
      W.spec.a = 0
      W.spec.b = q4 < 0.2 ? 0 : q4 < 0.3 ? 1 : 2
      W.stretch = smoothstep(0.03, 0.2, q4)
      W.threadOp *= 1 - 0.55 * smoothstep(0.3, 0.33, q4) * (1 - smoothstep(0.45, 0.48, q4))
      // a point particle circles once, and cannot stay wrapped
      W.demoOp = smoothstep(0.3, 0.33, q4) * (1 - smoothstep(0.46, 0.49, q4))
      W.demoTheta = Math.PI / 2 + 0.35 + TAU * smoothstep(0.32, 0.45, q4)
      W.demoTrail = 1.5 * smoothstep(0.32, 0.36, q4) * (1 - smoothstep(0.43, 0.46, q4))
      W.demoX = 1.15
    }
    // WA: WORLD A, from Beat 4
    const A = WA
    A.on = T > 4.98 && T < 10.52 && !gone
    A.len = 2.2
    A.yaw = YAW2
    A.pitch = PITCH2
    A.x = -S.wxA
    A.y = S.wy
    A.z = 0
    A.scale = S.ws
    A.rho = rho(S.RA)
    A.reveal = smoothstep(5.0, 5.16, T)
    A.cylOp = smoothstep(5.0, 5.05, T)
    A.threadOp = smoothstep(5.1, 5.22, T)
    A.glow = 1
    A.threadX = 0
    A.stretch = 0
    A.point = false
    A.demoOp = 0
    A.waveX = -0.62
    A.waveOp = A.threadOp
    A.waveFlash = 0
    if (T >= 4.98) {
      // A reads (a, b) of the selected rung; B reads the swap (b, a)
      const sel = q5 >= 0.2 && q5 < 0.35 ? Math.floor((S.t * S.amb + 0.0001) / 1.5) % 4 : 0
      lowestInto(S.RA, 8, S.fam, S.idx)
      const a = S.fam[4 * sel]
      const b = S.fam[4 * sel + 1]
      const s = S.fam[4 * sel + 2]
      A.spec.a = a
      A.spec.b = b
      A.spec.S = s
      A.waveA = a
      if (q5 >= 0.12 || T >= 6) {
        W.spec.a = b
        W.spec.b = a
        W.spec.S = s
        W.waveA = b
        W.stretch = 0
      }
      if (S.reduced && T < 6) {
        const dip = 1 - 0.95 * Math.exp(-(((q5 - 0.575) / 0.03) ** 2))
        A.cylOp *= dip
        W.cylOp *= dip
      }
    }
    // Beat 5: both worlds retreat to the top corners; A becomes "the radius you set"
    if (T >= 6.9) {
      const fade = (1 - smoothstep(7.93, 8.05, T)) * (S.portrait ? 1 - m57 : 1)
      for (let k = 0; k < 2; k++) {
        const V = k ? WB : WA
        const sgn = k ? 1 : -1
        V.x = lerp(sgn * (k ? S.wxB : S.wxA), sgn * (S.portrait ? 1.55 : 2.35), m57)
        V.y = lerp(S.wy, S.portrait ? 3.05 : 2.55, m57)
        V.scale = lerp(S.ws, 0.35, m57)
        V.cylOp *= lerp(1, 0.6, m57) * fade
        V.threadOp *= fade
        V.waveOp *= fade
      }
    }
  }

  // ───────────── Beats 2–3: the two energy ladders ─────────────
  function ladders() {
    const T = S.T
    const q3 = q(3)
    const q4 = q(4)
    const lop = smoothstep(3.12, 3.28, T) * (1 - smoothstep(4.95, 5.1, T))
    const wop = smoothstep(4.04, 4.18, T) * (1 - smoothstep(4.95, 5.1, T))
    const LMx = S.lmx
    const LWx = S.lwx
    const base = S.lbase
    const top = S.ltop
    const rw = S.lrw
    const upx = S.upx
    const RB = S.RB
    const nCur = q3 < 0.15 || T >= 4 ? 0 : q3 < 0.35 ? 1 : q3 < 0.55 ? 2 : 3
    for (let L2 = 0; L2 < 2; L2++) {
      const on = L2 ? wop : lop
      if (on <= 0.003) continue
      const x0 = L2 ? LWx : LMx
      const c = L2 ? S.fil : S.field
      add(S.sw, x0 - rw / 2 - 0.08, base - upx, rw + 0.16, 1.2 * upx, S.ink3, 0.8 * on)
      add(S.sw, x0 - rw / 2, base, upx, top - base, S.ink3, 0.26 * on)
      add(S.sw, x0 + rw / 2 - upx, base, upx, top - base, S.ink3, 0.26 * on)
      const kmax = L2 ? 4 : 6
      for (let k = 1; k <= kmax; k++) {
        const y = base + S.lsc * (L2 ? k * RB : k / RB)
        if (y > top) continue
        const clip = 1 - smoothstep(top - 0.2, top, y)
        const hi = !L2 && k === nCur
        const th = (hi ? 3.2 : 2) * upx
        add(S.sw, x0 - rw / 2, y - th / 2, rw, th, c, (hi ? 1 : 0.8) * on * clip)
      }
    }
    place(L.lm, LMx, base - 0.36, 0, lop, 'MOMENTUM', 'n / R')
    place(L.lw, LWx, base - 0.36, 0, wop, 'WINDING', 'wR / α′')
    // annotations on the single world
    const Wd = WB
    const r = Wd.rho
    const op = smoothstep(3.2, 3.35, T) * (1 - smoothstep(4.92, 5.05, T))
    const both = T >= 4
    toWorld(Wd, Wd.waveX, r, 0, S.v)
    place(L.around, S.v.x, S.v.y + 0.36, 0, op * (both ? 0.6 : 1), 'AROUND · HIDDEN CIRCLE · RADIUS R')
    toWorld(Wd, Wd.waveX, -r, 0, S.v)
    if (S.portrait) S.v.set(0, S.cy - (r + 0.02) * Wd.scale - 0.12, 0)
    place(L.n, S.v.x, S.v.y - 0.32, 0, op * (both ? 0 : smoothstep(0.15, 0.2, q3)), nCur > 0 ? `n = ${nCur} · WHOLE WAVELENGTHS` : '')
    // count the crests: each of the n crest beads carries its number, so "n whole wavelengths" can be counted
    const crestOp = op * (both ? 0 : smoothstep(0.17, 0.22, q3)) * (S.portrait ? 0 : 1)
    const ax = 0.1 * r + 0.045
    const rr = r * 1.06 + 0.01
    for (let k = 0; k < 3; k++) {
      const sl = k === 0 ? L.c0 : k === 1 ? L.c1 : L.c2
      if (k >= nCur || crestOp <= 0.003) {
        place(sl, 0, 0, 0, 0)
        continue
      }
      const a = (1.2 * S.t * S.amb + TAU * k) / nCur
      const cy = Math.cos(a)
      const sz = Math.sin(a)
      // which way the crest faces: radial direction's z after the world's rotation (camera on +z)
      toWorld(Wd, 0, cy, sz, S.v)
      const nz = (S.v.z - Wd.z) / Wd.scale
      toWorld(Wd, Wd.waveX + ax, (rr + 0.17) * cy, (rr + 0.17) * sz, S.v)
      place(sl, S.v.x, S.v.y, S.v.z, crestOp * smoothstep(-0.5, -0.15, nz), `${k + 1}`)
    }
    toWorld(Wd, 1.3, -r, 0, S.v)
    place(L.axis, S.v.x + 0.15, S.v.y - 0.34, 0, S.portrait ? 0 : op * (1 - smoothstep(0.1, 0.2, q4)) * (both ? 1 : smoothstep(0.08, 0.16, q3)), 'x · A LARGE DIRECTION →')
    toWorld(Wd, -S.clen / 2 + 0.25, -r, 0, S.v)
    if (S.portrait) S.v.set(-1.75, 0.5 * (base + top) + 0.62, 0)
    place(L.R, S.v.x, S.v.y - 0.62, 0, op, `R = ${fx2(RB)} ℓs`, 'ℓs · SIZE UNKNOWN')
    const ro = T < 4 ? smoothstep(0.62, 0.7, q3) : smoothstep(0.52, 0.6, q4)
    place(L.readout, S.portrait ? 0 : 1.0, S.portrait ? top + 0.3 : base - 0.98, 0, op * ro, T < 4 ? 'R ↑ · MOMENTUM RUNGS ↓ · CHEAP ON BIG CIRCLES' : 'R ↓ · WINDING RUNGS ↓ · CHEAP ON SMALL CIRCLES')
    toWorld(Wd, 0.3, -r, 0, S.v)
    if (S.portrait) S.v.set(0, S.cy - (r + 0.02) * Wd.scale + 0.1, 0)
    place(L.point, S.v.x, S.v.y - 0.42, 0, Wd.demoOp, S.portrait ? 'A POINT CAN’T STAY WRAPPED' : 'A POINT CAN CIRCLE, NOT STAY WRAPPED · NO WINDING ENERGY')
  }

  // ───────────── Beat 4: the seam ladder — lowest 8 families, A's reading | B's reading ─────────────
  function seamLadder() {
    const T = S.T
    const q5 = q(5)
    const op = smoothstep(5.02, 5.14, T) * (1 - smoothstep(6.9, 7.08, T))
    const b = S.rg
    const LB = S.lb
    const LK = S.lk
    const upx = S.upx
    const half = S.half
    let yTop = LB
    let selY = NaN
    let selA = 0
    let selB = 0
    if (op > 0.003) {
      const RA = S.RA
      lowestInto(RA, 8, S.fam, S.idx)
      // recognition: rung i's two halves slide in from their worlds and click together at the seam
      const bx = T >= 6 ? 99 : ((q5 - 0.04) / 0.16) * 8
      const selRung = q5 >= 0.2 && q5 < 0.35 ? Math.floor((S.t * S.amb + 0.0001) / 1.5) % 4 : 0
      const showSel = q5 >= 0.12 && T < 6
      const gap = 0.04
      const slide = 1.5 * S.ws
      const thk = 1 + 0.35 * S.land
      let j = 0
      while (j < 8) {
        // families closer than ~2 rung widths on screen share one rung, drawn as k dashes (the pack's rule for
        // shared heights), so a near-tie never overprints into a two-tone smudge
        const m0 = Math.sqrt(S.fam[4 * j + 3])
        let mSum = m0
        let k = 1
        while (j + k < 8 && LK * Math.abs(Math.sqrt(S.fam[4 * (j + k) + 3]) - m0) < 6.5 * thk * upx) {
          mSum += Math.sqrt(S.fam[4 * (j + k) + 3])
          k++
        }
        const y = LB + LK * (mSum / k)
        yTop = Math.max(yTop, y)
        const dw = (half - gap * (k - 1)) / k
        for (let m = 0; m < k; m++) {
          const i = j + m
          const vis = clamp(bx - i, 0, 1)
          if (vis <= 0) continue
          const e = easeInOutCubic(vis)
          const off = (1 - e) * slide
          const a = S.fam[4 * i]
          const bb = S.fam[4 * i + 1]
          const yy = S.fam[4 * i + 3]
          const mom = (a * a) / (RA * RA)
          const wind = bb * bb * RA * RA
          const vib = 2 * S.fam[4 * i + 2]
          const loIsMom = mom <= wind
          const sel = showSel && i === selRung
          const th = (sel ? 4.5 : 3) * thk * upx
          const al = (sel ? 1 : 0.85) * op * (0.25 + 0.75 * e)
          // from the seam outward: vibration, the smaller of (mom, wind), the larger
          for (let side = -1; side <= 1; side += 2) {
            const aSide = side < 0
            let x0 = m * (dw + gap) + off
            for (let part = 0; part < 3; part++) {
              const v = part === 0 ? vib : part === 1 ? Math.min(mom, wind) : Math.max(mom, wind)
              const w = (dw * v) / yy
              if (w <= 0) continue
              const isMom = part === 1 ? loIsMom : !loIsMom
              const col = part === 0 ? S.ink2 : isMom === aSide ? S.field : S.fil
              add(b, aSide ? -(x0 + w) : x0, y - th / 2, w, th, col, al)
              x0 += w
            }
          }
          // the click: the moment both halves meet, one Ink hairline flashes across the seam
          const click = vis >= 1 ? Math.exp(-Math.max(0, bx - i - 1) * 4) : 0
          if (click > 0.01) add(b, -half - 0.12, y - 0.5 * upx, 2 * half + 0.24, upx, S.ink, 0.9 * click * op)
          if (sel) {
            add(b, -half - 0.1, y - 0.5 * upx, 0.06, upx, S.ink, op)
            add(b, half + 0.04, y - 0.5 * upx, 0.06, upx, S.ink, op)
            selY = y
            selA = a
            selB = bb
          }
        }
        j += k
      }
      add(b, -half - 0.12, LB - 0.5 * upx, 2 * half + 0.24, upx, S.ink3, 0.8 * op)
    }
    const lop = op * (1 - smoothstep(5.85, 6.05, T))
    // the question, then its answer in the same place: WAIT … → MATCH 8 / 8
    const tagOp = op * smoothstep(0.07, 0.11, q5) * (1 - smoothstep(0.19, 0.22, q5))
    const yQ = S.stack ? yTop + 0.36 : LB - 0.34
    place(L.tag, 0, yQ, 0, tagOp, 'WAIT: THESE HEIGHTS AGAIN?')
    if (S.stack) {
      // phones: one readout at a time, above the ladder between the two worlds
      place(L.match, 0, yQ, 0, lop * smoothstep(0.22, 0.25, q5) * (1 - smoothstep(0.34, 0.37, q5)), 'MATCH 8 / 8')
      place(L.prod, 0, yQ, 0, lop * smoothstep(0.37, 0.4, q5))
    } else {
      place(L.match, 0, yQ, 0, lop * smoothstep(0.21, 0.25, q5), 'MATCH 8 / 8')
      place(L.prod, 0, LB - 0.62, 0, lop * smoothstep(0.35, 0.4, q5))
    }
    place(L.mass, -half - 0.2, LB, 0, op * 0.9, 'M = 0')
    // each world's reading of the selected rung: A counts (a waves, b wraps); B reads the swap
    const rop = Number.isNaN(selY) ? 0 : op * (1 - smoothstep(5.85, 6.0, T))
    if (S.stack) {
      placeReading(L.rdA, -half - 0.16, selY, rop, '', selA, selB)
      placeReading(L.rdB, half + 0.16, selY, rop, '', selB, selA)
      place(L.hA, 0, 0, 0, 0)
      place(L.hB, 0, 0, 0, 0)
      return
    }
    const yA = WA.y - (WA.rho + 0.32) * WA.scale - 0.12 - 0.32
    const yB = WB.y - (WB.rho + 0.32) * WB.scale - 0.12 - 0.32
    placeReading(L.rdA, WA.x, yA, rop, 'READS', selA, selB)
    placeReading(L.rdB, WB.x, yB, rop, 'READS', selB, selA)
    // 1 px leaders from each reading to its half of that rung
    const sg = S.sg.api
    if (sg && rop > 0.01) {
      const hwA = ((15 + String(selA).length + String(selB).length) * 4.4 + 8) * upx
      const hwB = ((15 + String(selB).length + String(selA).length) * 4.4 + 8) * upx
      const c = S.ink3
      sg.set(S.sg.n++, WA.x + hwA, yA, -half - 0.16, selY, upx, c.r, c.g, c.b, 0.9 * rop)
      sg.set(S.sg.n++, WB.x - hwB, yB, half + 0.16, selY, upx, c.r, c.g, c.b, 0.9 * rop)
    }
    // the ladder's two halves, named
    const hop = op * smoothstep(0.12, 0.18, q5) * (1 - smoothstep(5.85, 6.0, T))
    place(L.hA, -0.08, yTop + 0.34, 0, hop, 'A’S READING')
    place(L.hB, 0.08, yTop + 0.34, 0, hop, 'B’S READING')
  }

  // ───────────── Beat 5: the spectrum map folds at √α′ ─────────────
  function foldPlot() {
    const p = plot.current
    if (!p) return
    const T = S.T
    const q7 = q(7)
    // after the bounce the figure folds away (recedes as it fades), clearing the stage for the dictionary
    const away = smoothstep(7.95, 8.06, T)
    const pop = smoothstep(6.95, 7.18, T) * (1 - away)
    const PY = S.portrait ? 0.6 : -0.4
    p.root.visible = pop > 0.003
    if (pop <= 0.003) return
    p.root.scale.setScalar(S.plotS * (1 - 0.1 * away))
    const fold = S.reduced ? (q7 < 0.4 ? 0 : 1) : easeInOutCubic(range(q7, 0.15, 0.6))
    // once turned, the folded page slides to the centre of the frame
    const PX = -(PW / 4) * S.plotS * smoothstep(0.45, 0.62, q7)
    p.root.position.set(PX, PY, -1.5 * away)
    p.leaf.rotation.y = fold * Math.PI
    const flash = 0.75 * smoothstep(0.57, 0.61, q7) * (1 - smoothstep(0.64, 0.74, q7))
    // one curve, two readings — blue under amber, amber under blue
    const landed = smoothstep(0.6, 0.66, q7)
    if (p.curvesR) {
      p.curvesR.material.uniforms.uOpacity.value = pop
      p.curvesR.material.uniforms.uFlash.value = flash
    }
    if (p.curvesL) {
      const u = p.curvesL.material.uniforms
      u.uOpacity.value = pop
      u.uFlash.value = flash
      // landed: the folded curve turns to dashes over the curve it landed on, so both colours show
      u.uDash.value = landed
      u.uWidth.value = lerp(0.5, 0.75, landed)
    }
    if (p.axesR) p.axesR.material.uniforms.uOpacity.value = pop
    if (p.axesL) p.axesL.material.uniforms.uOpacity.value = pop
    if (p.hinge) p.hinge.material.uniforms.uOpacity.value = pop
    // the needle: the equivalent large circle max(R, α′/R) bottoms out at √α′ and climbs again
    const nop = pop * smoothstep(0.6, 0.66, q7)
    const eq = Math.max(S.Rset, 1 / S.Rset)
    if (nop > 0) {
      const ps = S.plotS
      const xN = PX + plotX(Math.log10(eq)) * ps
      add(S.sw, xN - 0.6 * S.upx, PY - (PH / 2) * ps, 1.2 * S.upx, PH * ps, S.ink, 0.85 * nop)
      add(S.sw, xN - 0.05, PY - (PH / 2) * ps - 0.025, 0.1, 0.05, S.ink, nop)
    }
    place(L.t01, -PW / 2, -PH / 2 - 0.26, 0, pop * (1 - smoothstep(0.3, 0.45, q7)), '0.1')
    place(L.t1, 0, -PH / 2 - 0.26, 0, pop, '1 = √α′')
    place(L.t10, PW / 2, -PH / 2 - 0.26, 0, pop, fold > 0.98 ? '10 ⟷ 0.1' : '10')
    place(L.ylab, PW / 2, PH / 2 + 0.24, 0, pop * 0.9 * (S.portrait ? 1 - smoothstep(0.7, 0.74, q7) : 1), S.portrait ? 'MASS²' : 'MASS² · α′M² 0–10')
    place(L.sd, 0, PH / 2 + 0.24, 0, pop * (1 - smoothstep(0.56, 0.62, q7)), 'SELF-DUAL · R = √α′')
    const foldOp = pop * smoothstep(0.6, 0.66, q7) * (S.portrait ? 1 - smoothstep(0.7, 0.74, q7) : 1)
    place(L.fold, PW / 4, PH / 2 + 0.62, 0, foldOp, 'FOLDED AT √α′ · EVERY CURVE LANDS ON A CURVE')
    if (S.portrait) {
      // phones: the text below is tall, so the bounce readouts take the fold caption's place above the plot
      const pop2 = nop * smoothstep(0.72, 0.76, q7)
      place(L.set, PW / 4, PH / 2 + 0.95, 0, pop2, `RADIUS YOU SET  ${fx2(S.Rset)}`)
      place(L.eqv, PW / 4, PH / 2 + 0.6, 0, pop2, `EQUIVALENT LARGE CIRCLE  ${fx2(eq)}`)
    } else {
      // stacked under the folded plot: the radius you set, and the large circle it is equivalent to
      place(L.set, PW / 4, -PH / 2 - 0.62, 0, nop, `RADIUS YOU SET  R = ${fx2(S.Rset)} ℓs`)
      place(L.eqv, PW / 4, -PH / 2 - 0.92, 0, nop, `EQUIVALENT LARGE CIRCLE  max(R, α′/R) = ${fx2(eq)} ℓs`)
    }
  }

  // ───────────── Lab: the circle swap, and the outro glide ─────────────
  function lab() {
    const T = S.T
    S.labK = smoothstep(8.85, 9.15, T)
    S.q10 = range(T, 10, T_END)
    S.left = WA
    if (T < 8.86) return
    const st = useDuality.getState()
    if (T < 9.05) S.swapped = false
    if (st.jumps !== S.jumps) {
      S.jumps = st.jumps
      S.jumpT0 = S.t
      if (T >= 9.05) S.swapped = !S.swapped
    }
    const left = S.swapped ? WB : WA
    const right = S.swapped ? WA : WB
    S.left = left
    const r = st.r
    if (r !== S.labR) {
      lowestInto(r, 16, S.labFam, S.idx)
      S.labR = r
    }
    const sel = clamp(st.sel, 0, 15)
    const pm = st.mode === 'point'
    const a = pm ? sel + 1 : S.labFam[4 * sel]
    const b = pm ? 0 : S.labFam[4 * sel + 1]
    const s = pm ? 0 : S.labFam[4 * sel + 2]
    // "Jump to the dual world": the worlds cross — no bar moves, only the description changes sides
    const jt = S.frozen || S.reduced ? 1 : clamp((S.t - S.jumpT0) / 0.9, 0, 1)
    const je = easeInOutCubic(jt)
    const q10 = S.q10
    const g = smoothstep(0, 0.35, q10)
    const LX = 1.95
    const LY = S.portrait ? 0.45 : 0.05
    for (let k = 0; k < 2; k++) {
      const W = k ? right : left
      const side = k ? 1 : -1
      const isLeft = !k
      W.on = T < 10.52
      W.len = 2.2
      W.yaw = YAW2
      W.pitch = PITCH2
      W.scale = lerp(LAB_S, 1, g)
      W.glow = 1
      W.threadX = 0
      W.stretch = 0
      W.demoOp = 0
      W.waveX = -0.62
      W.waveFlash = 0
      const x = jt < 1 ? lerp(-side * LX, side * LX, je) : side * LX
      W.x = lerp(x, 0, g)
      W.y = LY
      W.z = jt < 1 ? 0.9 * Math.sin(Math.PI * je) * side : 0
      W.rho = rho(logLerp(isLeft ? r : 1 / r, 1, g))
      W.reveal = 1
      W.cylOp = S.labK * (isLeft ? 1 - smoothstep(0.55, 0.85, q10) : 1 - smoothstep(0.3, 0.4, q10))
      W.threadOp = S.labK * (isLeft ? 1 - smoothstep(0.36, 0.4, q10) : 1 - smoothstep(0.3, 0.38, q10))
      W.waveOp = W.threadOp * (1 - smoothstep(0.02, 0.1, q10))
      if (q10 > 0.05) {
        // outro: both glide to the self-dual radius wearing a single winding
        W.spec.a = 0
        W.spec.b = 1
        W.spec.S = 0
        W.point = false
        W.waveA = 0
      } else {
        W.point = pm
        W.spec.a = isLeft || pm ? a : b
        W.spec.b = pm ? 0 : isLeft ? b : a
        W.spec.S = s
        W.waveA = W.spec.a
      }
    }
  }

  // ───────────── Outro: the wound Thread slips off the merged circle and unwinds into H2 ─────────────
  function outroThread() {
    const o = outro.current
    if (!o) return
    const T = S.T
    const q10 = S.q10
    const on = T >= 10 && q10 > 0.36 && T < T_END
    o.group.visible = on
    if (!on) return
    const W = S.left ?? WA
    const slip = smoothstep(0.36, 0.62, q10)
    const uw = smoothstep(0.55, 0.92, q10)
    const rc = rho(1) + 0.02
    const loopR = HANDOFF.H2.radius * fit
    const slipX = slip * (W.len / 2 + 0.45)
    const phi = W.phiOut
    S.e.set(W.pitch * (1 - uw), lerp(W.yaw, Math.PI / 2, uw), 0, 'XYZ')
    const wEnd = smoothstep(0.7, 1, uw)
    for (let i = 0; i < NLOOP; i++) {
      const sg = (i / NLOOP) * TAU
      const ang = sg + phi
      const r = lerp(rc, loopR, uw)
      S.v.set(lerp(0.16 * Math.sin(sg) + slipX, 0, uw), r * Math.cos(ang), r * Math.sin(ang))
      S.v.applyEuler(S.e)
      let px = S.v.x + lerp(W.x, 0, uw)
      let py = S.v.y + lerp(W.y, 0, uw)
      let pz = S.v.z + lerp(W.z, 0, uw)
      if (wEnd > 0) {
        let u2 = (Math.PI / 2 - ang) / TAU
        u2 -= Math.floor(u2)
        loop(u2, S.t, S.v, i)
        px = lerp(px, S.v.x, wEnd)
        py = lerp(py, S.v.y, wEnd)
        pz = lerp(pz, S.v.z, wEnd)
      }
      S.ptsO[i * 3] = px
      S.ptsO[i * 3 + 1] = py
      S.ptsO[i * 3 + 2] = pz
    }
    o.update()
    o.material.uniforms.uWidth.value = lerp(0.05, HANDOFF.H2.width, uw)
  }

  // ───────────── labels that follow the worlds (Beat 4 onward) ─────────────
  function worldLabels() {
    const T = S.T
    const b4 = smoothstep(5.1, 5.25, T) * (1 - smoothstep(6.9, 7.05, T))
    const labOp = S.labK * (1 - smoothstep(10.02, 10.12, T))
    if (T >= 4.98 && T < 8.5) {
      const b5 = smoothstep(7.1, 7.25, T) * (1 - smoothstep(7.85, 8.0, T))
      const late = T > 7
      const pw = S.stack
      const oA = late ? (S.portrait ? 0 : b5) : b4
      place(L.wA, WA.x, WA.y - (WA.rho + 0.32) * WA.scale - 0.12, 0, oA, late ? `R = ${fx2(S.RA)} ℓs` : `${pw ? 'A' : 'WORLD A'} · R = ${fx2(S.RA)} ℓs`)
      place(L.wB, WB.x, WB.y - (WB.rho + 0.32) * WB.scale - 0.12, 0, oA, late ? `α′/R = ${fx2(S.RB)} ℓs` : `${pw ? 'B' : 'WORLD B'} · α′/R = ${fx2(S.RB)} ℓs`)
    } else if (T >= 8.5) {
      const st = useDuality.getState()
      const LY = S.portrait ? 0.45 : 0.05
      const drop = Math.max(rho(st.r), rho(1 / st.r)) * LAB_S + 0.5
      const pw = S.portrait
      place(L.wA, -1.95, LY - drop, 0, labOp, `${pw ? 'A' : 'WORLD A'} · R = ${fx2(st.r)} ℓs`)
      place(L.wB, 1.95, LY - drop, 0, labOp, `${pw ? 'B' : 'WORLD B'} · α′/R = ${fx2(1 / st.r)} ℓs`)
      const pm = st.mode === 'point'
      const eq = !pm || Math.abs(st.r - 1) < 1e-9
      place(L.glyph, 0, LY + 0.02, 0, labOp, eq ? '=' : '≠')
      L.glyph.el?.classList.toggle('is-miss', !eq)
      place(
        L.honest,
        0,
        S.portrait ? LY + drop + 0.1 : LY - drop - 0.42,
        0,
        labOp * 0.9,
        S.portrait ? '~ THE WAVE IS THE HONEST PART' : '~ THE WAVE IS THE HONEST PART: n WHOLE WAVELENGTHS',
        S.portrait ? 'n WHOLE WAVELENGTHS' : '',
      )
      // outro: where the two worlds meet
      const q10 = S.q10
      place(L.sdm, 0, LY - rho(1) - 0.5, 0, smoothstep(0.22, 0.3, q10) * (1 - smoothstep(0.44, 0.52, q10)), 'R = √α′ · SELF-DUAL · ONE CIRCLE')
    }
  }

  const bind = (b: Batch) => (api: SwatchesApi | null) => {
    b.api = api
  }

  return (
    <>
      <Backdrop />
      <Floor ref={floor} />
      <group ref={handoff}>
        <HandoffLoop />
      </group>
      <Filament ref={copyA} points={S.ptsA} count={NLOOP} closed width={HANDOFF.H2.width} />
      <Filament ref={copyB} points={S.ptsB} count={NLOOP} closed width={HANDOFF.H2.width} />
      <Filament ref={outro} points={S.ptsO} count={NLOOP} closed width={HANDOFF.H2.width} />
      <group ref={circA} visible={false}>
        <Ribbons ref={circARib} lines={circle} width={0.55} />
      </group>
      <group ref={circB} visible={false}>
        <Ribbons ref={circBRib} lines={circleSmall} width={0.55} />
      </group>
      <Drums ref={drums} />
      <World state={WA} />
      <World state={WB} />
      <Swatches ref={bind(S.sw)} capacity={96} renderOrder={6} />
      <Swatches ref={bind(S.rg)} capacity={96} renderOrder={6} />
      <Segs
        ref={(api) => {
          S.sg.api = api
        }}
        capacity={8}
        renderOrder={6}
      />
      <Plot ref={plot} leafChildren={<Lbl s={L.t01} tone="dim" />}>
        <Lbl s={L.t1} tone="dim" />
        <Lbl s={L.t10} tone="dim" />
        <Lbl s={L.ylab} tone="dim" align="right" />
        <Lbl s={L.sd} tone="ink" />
        <Lbl s={L.fold} tone="ink" />
        <Lbl s={L.set} tone="dim" />
        <Lbl s={L.eqv} tone="ink" />
      </Plot>
      <Lbl s={L.wA} tone="dim" />
      <Lbl s={L.wB} tone="dim" />
      <Lbl s={L.eqq} className="du-sl--glyph" />
      <Lbl s={L.tri} tone="dim" />
      <Lbl s={L.tones} tone="ink" />
      <Lbl s={L.cartoon} tone="dim" />
      <Lbl s={L.around} tone="field" />
      <Lbl s={L.axis} tone="dim" />
      <Lbl s={L.n} tone="field" />
      <Lbl s={L.c0} tone="field" className="du-sl--crest" />
      <Lbl s={L.c1} tone="field" className="du-sl--crest" />
      <Lbl s={L.c2} tone="field" className="du-sl--crest" />
      <Lbl s={L.R} tone="ink" sub />
      <Lbl s={L.readout} tone="ink" />
      <Lbl s={L.lm} tone="field" sub />
      <Lbl s={L.lw} tone="filament" sub />
      <Lbl s={L.point} tone="ink" />
      <Lbl s={L.tag} tone="ink" />
      <Lbl s={L.match} tone="ink" />
      <Lbl s={L.prod} tone="dim">
        R<sub>A</sub> × R<sub>B</sub> = α′ · ALWAYS
      </Lbl>
      <Lbl s={L.mass} tone="dim" align="right" />
      <Lbl s={L.glyph} className="du-sl--glyph" />
      <ReadLbl s={L.rdA} align={stack ? 'right' : 'center'} />
      <ReadLbl s={L.rdB} align={stack ? 'left' : 'center'} />
      <Lbl s={L.hA} tone="dim" align="right" />
      <Lbl s={L.hB} tone="dim" align="left" />
      <Lbl s={L.honest} tone="dim" sub />
      <Lbl s={L.sdm} tone="dim" />
    </>
  )
}

const _e = new THREE.Euler(0, 0, 0, 'XYZ')
/** A point in a world's local frame (cylinder axis = x) → stage coordinates. */
function toWorld(W: WorldState, lx: number, ly: number, lz: number, out: THREE.Vector3) {
  _e.set(W.pitch, W.yaw, 0, 'XYZ')
  out.set(lx, ly, lz).applyEuler(_e).multiplyScalar(W.scale)
  out.x += W.x
  out.y += W.y
  out.z += W.z
  return out
}
