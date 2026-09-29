/*
 * Per-frame stage state, computed once by the Scene and read by both layers (WebGL + diagram DOM).
 * Pure except for the Lab's eased framing (kept in `mem`).
 */
import { clamp01, damp, lerp, smoothstep } from '@/core/math'
import type { Layout } from './layout'
import { AU, EP, E_LHC, LHC_REAL_D, LY, S_MAX, S_MIN, S_STRING, energyOf, frameL, machine, machineById, type Machine } from './model'
import { B4, HONEST_END, SI, ZOOM_END, b4LogE, b4Width, local, openK, zoomS } from './timeline'
import { useScaleLab } from './store'
import { prefersReducedMotion } from '@/core/time'

/** Reduced motion: camera moves snap between their end states instead of travelling. */
let RM = false
const snap = (x: number) => (RM ? (x < 0.5 ? 0 : 1) : x)

/** Physical placement (metres east/north of CERN) of the galaxy centre: the Sun lies 26,670 ly to its lower right. */
export const SUN_GC = 26_670 * LY
const GC_ANGLE = (-38 * Math.PI) / 180
export const GAL_X = -SUN_GC * Math.cos(GC_ANGLE)
export const GAL_Y = -SUN_GC * Math.sin(GC_ANGLE)
// direction is arbitrary (stars are placed at random): up, so Proxima lands inside the ring, clear of the text
export const PROXIMA_DIR = (104 * Math.PI) / 180

export interface MapCam {
  on: number
  /** map linework dimming (1 = full) */
  dim: number
  /** metres per viewport height */
  Lm: number
  ax: number
  ay: number
  cx: number
  cy: number
  m: Machine
  /** ring vs linear-arm visibility (morphs in the Lab) */
  ringOn: number
  armsOn: number
  /** comparison ring width (LHC magnets) in the Lab, 0 = none */
  ghostD: number
  /** Beat 4 phase values */
  logE: number
  land: number
  honest: number
  /** 0..1 "real machine" intro of Beat 4 */
  intro: number
  /** Beat 5: straight-line window */
  line: number
  lab: boolean
}

export interface StageState {
  T: number
  t: number
  L: Layout
  /** opening pull-back 0..1 */
  open: number
  /** Beat 1 */
  zoomS: number
  zoomOn: number
  flat: number
  /** Beat 1 zoom centre (px) */
  zcx: number
  zcy: number
  /** the Ruler: visibility, window, vertical fold */
  rulerOn: number
  sL: number
  sR: number
  fold: number
  /** the Ruler's baseline y for this beat (px), and its screen left edge (Beat 6 zooms into the right side) */
  ry: number
  rx0: number
  /** H0 point: screen px, glow scale (1 = canonical), intensity scale */
  h0x: number
  h0y: number
  h0s: number
  h0i: number
  map: MapCam
  /** Beat 5 chart visibility */
  chartOn: number
}

export interface StageMem {
  labLogL: number
  labRing: number
  init: boolean
}
export const createMem = (): StageMem => ({ labLogL: 5, labRing: 1, init: false })

const LHC_SPEC = machineById('lhc')
const ghost = machine(E_LHC, LHC_SPEC)
const zoomHz = (L: Layout) => (L.mobile ? 0.88 * L.W : 0.8 * L.H)

export function computeStage(T: number, t: number, dt: number, L: Layout, mem: StageMem, out: StageState, progress = 0): StageState {
  out.T = T
  out.t = t
  out.L = L
  RM = prefersReducedMotion()
  const cxS = L.Wc / 2
  const cyS = L.H / 2

  // ── opening ──
  const pOpen = local(T, 'open')
  out.open = T < SI.decades ? openK(pOpen) : 1

  // ── Beat 1 ──
  const p1 = local(T, 'decades')
  const inB1 = T >= SI.decades && T < SI.quarter
  out.zoomS = inB1 ? zoomS(p1) : T < SI.decades ? -31.5 : S_MAX
  out.zoomOn = inB1 ? 1 - smoothstep(ZOOM_END, ZOOM_END + 0.12, p1) : 0
  out.flat = inB1 ? smoothstep(ZOOM_END, 0.97, p1) : T >= SI.quarter ? 1 : 0
  const gz = inB1 ? smoothstep(0.0, 0.1, p1) : 0
  out.zcx = lerp(cxS, L.zx, gz)
  out.zcy = lerp(cyS, L.zy, gz)

  // ── the Ruler window / fold ──
  let rulerOn = 0
  let sL = S_MAX
  let sR = S_MIN
  let fold = 1
  let rx0 = L.rx0
  if (inB1) rulerOn = smoothstep(ZOOM_END + 0.03, ZOOM_END + 0.14, p1)
  else if (T >= SI.quarter && T < SI.bigger) rulerOn = 1
  else if (T >= SI.bigger && T < SI.floor) {
    const p = local(T, 'bigger')
    fold = 1 - smoothstep(0, 0.07, p)
    rulerOn = fold
  } else if (T >= SI.sideways && T < SI.lab) {
    const p = local(T, 'sideways')
    fold = smoothstep(0.02, 0.12, p)
    rulerOn = fold
    // frame only the right end, stretched, then compress back so the long leaders fit
    const z = snap(smoothstep(0.03, 0.12, p) * (1 - smoothstep(0.42, 0.6, p)))
    sL = lerp(S_MAX, -16, z)
    sR = lerp(S_MIN, -36, z)
    // desktop: the magnified end fills the right of the frame (the text keeps the left), then widens back
    if (!L.mobile) rx0 = lerp(L.rx0, Math.max(L.textR + 70, 0.42 * L.W), z)
  } else if (T >= SI.lab && T < SI.point) {
    const p = local(T, 'lab')
    fold = 1 - smoothstep(0, 0.06, p)
    rulerOn = fold
  } else if (T >= SI.point) {
    // At chapter progress 1 the viewport centre is still ~0.62 into this step, so every move ends by 0.45.
    const p = local(T, 'point')
    // the Ruler returns, tiny, then the camera closes on its right end
    fold = smoothstep(0.02, 0.14, p)
    const z = snap(smoothstep(0.12, 0.38, p))
    const c0 = (S_MAX + S_MIN) / 2
    const h0 = (S_MAX - S_MIN) / 2 / 0.42
    const c = lerp(c0, S_STRING, smoothstep(0, 0.55, z))
    const hw = Math.exp(lerp(Math.log(h0), Math.log(0.16), z))
    sL = c + hw
    sR = c - hw
    rulerOn = fold * (1 - smoothstep(0.26, 0.38, p))
  }
  out.rulerOn = rulerOn
  out.ry = T >= SI.sideways && T < SI.lab ? L.ry6 : T >= SI.point ? L.H / 2 : L.ry
  out.sL = sL
  out.sR = sR
  out.fold = fold
  out.rx0 = rx0

  // ── the H0 point ──
  let hx = cxS
  let hy = cyS
  let hs = 1
  let hi = T < SI.open ? 0 : 1
  const planckX = (s: number) => rx0 + ((sL - s) / (sL - sR)) * (L.rx1 - rx0)
  const small = 0.42
  const ry = out.ry
  if (T >= SI.open && T < SI.decades) {
    hi = smoothstep(0.35, 0.95, pOpen)
  } else if (inB1) {
    const g = snap(smoothstep(0.0, 0.1, p1))
    const f = snap(smoothstep(ZOOM_END + 0.06, ZOOM_END + 0.26, p1))
    const zx = lerp(cxS, L.zx, g)
    const zy = lerp(cyS, L.zy, g)
    hx = lerp(zx, planckX(S_STRING), f)
    hy = lerp(zy, ry, f)
    hs = lerp(lerp(1, 0.55, g), small, f)
    // past the edge of measurement the point dims to a quiet marker (it is not "us", nor the centre of
    // anything), and re-lights as it flies to its tick on the Ruler
    hi = 1 - 0.75 * smoothstep(-21, -17, out.zoomS) * (1 - f)
  } else if (T >= SI.quarter && T < SI.bigger) {
    hx = planckX(S_STRING)
    hy = ry
    hs = small
  } else if (T >= SI.bigger && T < SI.floor) {
    hx = planckX(S_STRING)
    hy = ry
    hs = small
    hi = 1 - smoothstep(0, 0.05, local(T, 'bigger'))
  } else if (T >= SI.floor && T < SI.sideways) {
    hi = 0
  } else if (T >= SI.sideways && T < SI.lab) {
    hx = planckX(S_STRING)
    hy = ry
    hs = small
    hi = smoothstep(0.06, 0.16, local(T, 'sideways'))
  } else if (T >= SI.lab && T < SI.point) {
    hx = planckX(S_STRING)
    hy = ry
    hs = small
    hi = 1 - smoothstep(0, 0.05, local(T, 'lab'))
  } else if (T >= SI.point) {
    const p = local(T, 'point')
    const f = snap(smoothstep(0.3, 0.45, p))
    hx = lerp(planckX(S_STRING), cxS, f)
    hy = cyS
    hs = lerp(small, 1, smoothstep(0.25, 0.45, p))
    hi = smoothstep(0.02, 0.12, p)
    // the handoff frame: exactly H0 (centre, canonical size and intensity), whatever the scroll math says
    if (progress >= 0.985) {
      hx = cxS
      hy = cyS
      hs = 1
      hi = 1
    }
  }
  out.h0x = hx
  out.h0y = hy
  out.h0s = hs
  out.h0i = hi

  // ── the map camera (Beat 4, Beat 5 opening, Lab) ──
  const M = out.map
  M.lab = false
  M.on = 0
  M.dim = 1
  M.ringOn = 1
  M.armsOn = 0
  M.ghostD = 0
  M.land = 0
  M.honest = 0
  M.intro = 0
  M.line = 0
  const H = L.H
  if (T >= SI.bigger && T < SI.floor) {
    const p = local(T, 'bigger')
    M.on = smoothstep(0.02, 0.09, p)
    const logE = b4LogE(p)
    M.logE = logE
    machine(Math.pow(10, logE), LHC_SPEC, M.m)
    const D = b4Width(logE)
    M.m.D = D
    M.intro = 1 - smoothstep(B4.real, B4.real + 0.06, p)
    M.land = smoothstep(B4.grow1, B4.grow1 + 0.05, p)
    M.honest = snap(smoothstep(B4.honest, HONEST_END, p))
    const ease = 1 - 0.08 * smoothstep(B4.grow1, B4.land, p) * (1 - M.honest)
    // establishing shot: the real ring in the Geneva basin, then the camera settles to the 60% framing
    const est = lerp(2.7, 1, smoothstep(B4.real - 0.03, B4.real + 0.12, p))
    const L0 = ((D * H) / (2 * L.mR)) * ease * est
    const L1 = L0 * 100
    const k = M.honest
    const Lm = Math.exp(lerp(Math.log(L0), Math.log(L1), k))
    const w = (Lm - L0) / (L1 - L0)
    M.Lm = Lm
    M.ax = L.mx
    M.ay = L.my
    M.cx = lerp(0, GAL_X, w)
    M.cy = lerp(D / 2, GAL_Y, w)
  } else if (T >= SI.floor && T < SI.sideways) {
    const p = local(T, 'floor')
    const E = EP
    machine(E, LHC_SPEC, M.m)
    M.logE = Math.log10(E)
    const D = M.m.D
    M.on = 1 - smoothstep(0.3, 0.4, p)
    M.line = smoothstep(0.08, 0.14, p)
    const L0 = ((D * H) / (2 * L.mR)) * 100 // where Beat 4 left off (galaxy view)
    const L1 = L.mobile ? 2.4e4 : 4e4
    const k = snap(smoothstep(0, 0.14, p))
    const Lm = Math.exp(lerp(Math.log(L0), Math.log(L1), k))
    const w = (Lm - L1) / (L0 - L1)
    M.Lm = Lm
    const bx = L.mobile ? L.W * 0.5 : L.W * 0.645
    const by = L.c1y
    M.ax = lerp(bx, L.mx, w)
    M.ay = lerp(by, L.my, w)
    M.cx = lerp(0, GAL_X, w)
    M.cy = lerp(0, GAL_Y, w)
    M.honest = w
  } else if (T >= SI.lab && T < SI.point) {
    const p = local(T, 'lab')
    M.lab = true
    M.on = smoothstep(0.03, 0.1, p) * (1 - smoothstep(0.93, 1, p))
    const lab = useScaleLab.getState()
    const d = Math.pow(10, lab.logD)
    const E = energyOf(d)
    const spec = machineById(lab.machine)
    machine(E, spec, M.m)
    M.logE = Math.log10(E)
    const ringTarget = spec.kind === 'ring' ? 1 : 0
    const targetLogL = lab.auto ? Math.log10(Math.max(frameL(1), (M.m.D * H) / (2 * L.lR))) : lab.manualLogL
    if (!mem.init || dt === 0) {
      mem.labLogL = targetLogL
      mem.labRing = ringTarget
      mem.init = true
    } else {
      mem.labLogL = damp(mem.labLogL, targetLogL, 5.5, dt)
      mem.labRing = damp(mem.labRing, ringTarget, 5, dt)
    }
    M.ringOn = mem.labRing
    M.armsOn = 1 - mem.labRing
    M.Lm = Math.pow(10, mem.labLogL)
    M.ax = L.lx
    M.ay = L.ly
    M.cx = 0
    M.cy = spec.kind === 'ring' ? (M.m.D / 2) * mem.labRing : 0
    if (spec.kind === 'ring' && spec.B !== 8.33) M.ghostD = machine(E, LHC_SPEC, ghost).D
    M.dim = d > 1e-16 ? 0.32 : 1
  }

  out.chartOn = T >= SI.floor && T < SI.sideways ? smoothstep(0.28, 0.38, local(T, 'floor')) * (1 - smoothstep(0.97, 1, local(T, 'floor'))) : T >= SI.sideways && T < SI.lab ? 1 - smoothstep(0, 0.06, local(T, 'sideways')) : 0

  return out
}

export const createStage = (L: Layout): StageState => ({
  T: 0,
  t: 0,
  L,
  open: 0,
  zoomS: -31.5,
  zoomOn: 0,
  flat: 0,
  zcx: L.Wc / 2,
  zcy: L.H / 2,
  rulerOn: 0,
  sL: S_MAX,
  sR: S_MIN,
  fold: 1,
  ry: L.ry,
  rx0: L.rx0,
  h0x: L.Wc / 2,
  h0y: L.H / 2,
  h0s: 1,
  h0i: 0,
  map: {
    on: 0,
    dim: 1,
    Lm: LHC_REAL_D * 1.7,
    ax: L.mx,
    ay: L.my,
    cx: 0,
    cy: LHC_REAL_D / 2,
    m: machine(E_LHC, LHC_SPEC),
    ringOn: 1,
    armsOn: 0,
    ghostD: 0,
    logE: Math.log10(E_LHC),
    land: 0,
    honest: 0,
    intro: 0,
    line: 0,
    lab: false,
  },
  chartOn: 0,
})

/** Physical (m, east/north of CERN) → screen px for the current map camera. */
export function mapX(M: MapCam, L: Layout, x: number) {
  return M.ax + ((x - M.cx) / M.Lm) * L.H
}
export function mapY(M: MapCam, L: Layout, y: number) {
  return M.ay - ((y - M.cy) / M.Lm) * L.H
}
/** Visibility of a fixed-size landmark of width D: drawn between 2% and 300% of the view, with soft edges. */
export function landmarkVis(D: number, Lm: number) {
  const r = Math.log10(D / Lm)
  return smoothstep(-1.7, -1.35, r) * (1 - smoothstep(0.3, 0.48, r))
}
export const zoomPxPerM = (L: Layout, s: number) => zoomHz(L) / Math.pow(10, s)
export { zoomHz, clamp01, AU }
