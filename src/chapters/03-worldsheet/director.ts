/*
 * The director: turns scroll (+ lab state) into one mutable per-frame state object `D` that every part
 * of the Scene reads. Runs at priority −2 (before OrbitRig / parts at −1). Allocation-free.
 *
 * All timing is expressed as centre-line positions c of the steps (K(step, localProgress), see layout.ts),
 * so step lengths can change without re-tuning the choreography.
 */
import { handoffFit } from '@/core/handoff'
import { clamp, damp, easeInOutCubic, lerp, range, smoothstep } from '@/core/math'
import { useSettings } from '@/core/settings'
import type { FrameInfo } from '@/gl'
import { areaPhase, cAt, cOf, deeperPhase, STEP_LEN, stepAt, textTop, TOTAL, type StepId } from './layout'
import { solveSplit, T_STAR, type Split } from './model'
import { X_BUBBLE, X_HANDLE, X_P, X_Y } from './stageConsts'
import { useWorldsheet } from './store'

const DEG = Math.PI / 180
const K = (id: StepId, p: number) => cAt(id, p)
const ss = smoothstep

/* ───────────── keyframe tracks: values at centre-line positions c, smoothstep between keys ───────────── */

type Key = [number, number]
function track(keys: Key[]) {
  return (c: number) => {
    if (c <= keys[0][0]) return keys[0][1]
    for (let i = 1; i < keys.length; i++) {
      const [c1, v1] = keys[i]
      if (c <= c1) {
        const [c0, v0] = keys[i - 1]
        const u = (c - c0) / Math.max(1e-6, c1 - c0)
        return v0 + (v1 - v0) * (u * u * (3 - 2 * u))
      }
    }
    return keys[keys.length - 1][1]
  }
}

type Pose = { az: number; pol: number; dist: number; tx: number; ty: number; tz: number; sx: number }
const P = (az: number, pol: number, dist: number, tx: number, ty: number, sx: number, tz = 0): Pose => ({ az, pol, dist, tx, ty, tz, sx })
const H_POSE = P(0, 90, 10, 0, 0, 0)
const LOOPS_POSE = P(-10, 81, 24, -1.3, 4.9, 0.1)
const POSES: [number, Pose][] = [
  [K('title', 0.4), H_POSE],
  [K('title', 0.85), H_POSE],
  // the point has unfolded into H1: slide it beside the text
  [K('open', 0.2), P(0, 90, 10, 0, 0, 0.13)],
  // dolly back 2×, pitch down: the Thread lies on the floor; the time axis draws itself
  [K('open', 0.55), P(-12, 75, 22, -0.4, 3.4, 0.14)],
  [K('open', 0.9), P(-16, 77, 24.5, -0.6, 4.4, 0.15)],
  // beat 1: slow 3/4 orbit, −20° → +15° of yaw, target near (0, 4, 0)
  [K('sheet', 0.14), P(-20, 76, 23, -0.3, 3.0, 0.14)],
  [K('sheet', 0.5), P(-4, 77, 24, -0.4, 4.0, 0.14)],
  [K('sheet', 0.88), P(15, 77, 25, -0.4, 4.6, 0.14)],
  // beat 2: static, framing the particle (left) and the ribbon (right)
  [K('area', 0.14), P(-5, 82, 21.5, -2.4, 4.3, 0.13)],
  [K('area', 0.88), P(2, 82, 21.5, -2.4, 4.3, 0.13)],
  // beat 3: the Y and the pants
  [K('pants', 0.06), P(-20, 76, 29, -1.3, 5.2, 0.12)],
  [K('pants', 0.86), P(-23, 76, 29, -1.3, 5.2, 0.12)],
  // beat 4: flat now, tilt, then dolly in on the pants' smear and end 3/4 above it
  [K('now', 0.1), P(-24, 74, 29, -1.3, 5.2, 0.13)],
  [K('now', 0.4), P(-28, 70, 28, -1.3, 5.0, 0.14)],
  // elevation ≥ 38° before φ starts turning (0.49): a plane tilted 30° is then never seen edge-on
  [K('now', 0.48), P(-30, 51, 22, 1.4, 5.2, 0.15)],
  [K('now', 0.8), P(-14, 45, 11, X_P, T_STAR - 0.1, 0.12)],
  [K('now', 1.0), P(-10, 41, 8.8, X_P, T_STAR - 0.05, 0.12)],
  // lab (overridden by the lab pose while the panel is up); by the end it has settled on beat 5's pose
  [K('lab', 0.5), LOOPS_POSE],
  [K('loops', 0.14), LOOPS_POSE],
  [K('loops', 0.86), P(-3, 81, 24, -1.3, 4.9, 0.1)],
  // beat 6: frame the rising present (the C-arc starts on the floor), then the whole tube; the OUT crane takes over
  [K('close', 0.04), P(-26, 64, 13, 0, 1.4, 0.15)],
  [K('close', 0.5), P(-22, 70, 17, 0, 5.0, 0.15)],
]
const camTrack = (k: keyof Pose) => track(POSES.map(([c, p]) => [c, p[k]] as Key))
const TR = { az: camTrack('az'), pol: camTrack('pol'), dist: camTrack('dist'), tx: camTrack('tx'), ty: camTrack('ty'), tz: camTrack('tz'), sx: camTrack('sx') }

/** Lab camera presets (pitch 5°–80° per the pack): 3/4, side, top. */
const LAB_VIEWS = {
  q: { az: -30, pol: 62, one: 15.5, two: 30 },
  side: { az: 0, pol: 86, one: 16, two: 30 },
  // from above, the legs rise toward the lens: stand further back
  top: { az: -8, pol: 12, one: 25, two: 36 },
}

/* time axis: back-left corner for single-history beats; behind, between the histories for the two-history ones */
const AXIS_X = track([
  [K('area', 0.0), -5],
  [K('area', 0.12), -8],
  [K('area', 0.9), -8],
  [K('pants', 0.06), -1.25],
  [K('lab', 0.86), -1.25],
  [K('lab', 0.98), -6.4],
  [K('loops', 0.97), -6.4],
  [K('close', 0.0), -2.6],
])
const AXIS_Z = track([
  [K('area', 0.9), -5],
  [K('pants', 0.06), -4.6],
  [K('lab', 0.86), -4.6],
  [K('lab', 0.98), -3.6],
  [K('loops', 0.97), -3.6],
  [K('close', 0.0), -3.4],
])
const FLOOR_X = track([
  [K('sheet', 0.9), -0.9],
  [K('area', 0.1), 0],
  [K('area', 0.9), 0],
  [K('pants', 0.06), -1.25],
  [K('lab', 0.86), -1.25],
  [K('lab', 0.98), -1.6],
  [K('loops', 0.97), -1.6],
  [K('close', 0.0), 0],
])
const STEP_IDS = Object.keys(STEP_LEN) as StepId[]

/** c at progress 1 (the handoff frame) */
export const C_END = TOTAL - 0.5
/** the OUT crane runs over these centre-line positions; H2 cross-fades in once it has landed */
export const OUT_START = K('close', 0.84)
export const OUT_END = K('out', 0.3)
const H2_START = K('out', 0.26)
const H2_END = K('out', 0.42)

/* ───────────── state ───────────── */

export const D = {
  c: 0.5,
  t: 0,
  dt: 0,
  aspect: 1.6,
  portrait: false,
  fit: 1,
  /** unclamped local progress of every step */
  p: { title: 0, open: 0, sheet: 0, area: 0, pants: 0, now: 0, lab: 0, loops: 0, close: 0, out: 0 } as Record<StepId, number>,
  /** phones: top of the text block on screen (fraction of the viewport height) */
  textTop: 0.62,
  /** phones: 0 → 1 as the current step's text unpins and rises over the diagram (scene captions yield) */
  textRise: 0,
  cam: { az: 0, pol: 90, dist: 10, tx: 0, ty: 0, tz: 0, sx: 0, sy: 0 },
  camTarget: [0, 0, 0] as [number, number, number],
  /** OUT crane 0 → 1, and the H2 cross-fade after it has landed */
  out: 0,
  h2: 0,
  // group weights 0..1
  w: {
    point: 1,
    thread: 0,
    floor: 0,
    axis: 0,
    openParticles: 0,
    rest: 0,
    helicoid: 0,
    tube: 0,
    proper: 0,
    hist: 0,
    loupes: 0,
    planes: 0,
    lab: 0,
    loops: 0,
    close: 0,
  },
  floor: { x: 0, w: 10, d: 10 },
  axis: { x: -5, z: -5 },
  /** Beat 4's close-up on the smear: the particle Y steps aside, the diagram quiets (back for the lab) */
  closeup: 0,
  /** the end of Beat 4: the smear is the hero, the slice glows quieter */
  hold: 0,
  yFade: 1,
  // opening
  axisK: 0,
  tP: 0,
  /** present of the particle at rest: it keeps climbing with the ribbon's present in Beat 1 */
  tRest: 0,
  lie: 0,
  threadLen: 4.2,
  // beat 1
  tN: 0,
  tT: 0,
  vib: 1,
  // beat 2
  area: { T: 0, A: 0, sweep: 0, nudge: 0, tau: 0 },
  // slicing (beat 4 + lab)
  sl: { t0: 3.5, theta: 0, phi: 0, showY: true, showPants: true, trail: 0, mode: 0 as 0 | 1 },
  split: { x: 0, y: 0, t: T_STAR, t0: T_STAR } as Split,
  flash: 0,
  // beat 5
  w5: 2.4,
  bubble: 1,
  // beat 6
  tC: 0,
  // go-deeper drawer (open → subject glides left; figures pulse with the equation terms)
  drawer: 0,
  deeper: { dtau: 0, T: 0, dA: 0, bh: 0 },
  deeperOpen: false,
  /** the visitor's lab view preset, damped */
  labAz: -30,
  labPol: 62,
  labDist: 30,
  viewNonce: 0,
}

const tmpSplit: Split = { x: 0, y: 0, t: T_STAR, t0: T_STAR }
/** Beat 4's φ sweep holds "now" this far below t₀*: a figure-eight about to pinch (one unambiguous loop). */
const PINCH_EPS = 0.006
/**
 * Beat 4 (step 'now' local progress): flat "now" rises → tilts to 30° → tilted sweep → held at the pinch
 * while φ turns once (the smear is painted) → the smear holds as the hero. The φ turn ends while the beat
 * text is still pinned (it unpins at (2.6 − 0.5)/2.6 ≈ 0.81), so the aha is complete before the text leaves.
 */
export const NOW_PHASE = { tilt0: 0.24, tilt1: 0.3, pin0: 0.44, phi0: 0.49, phi1: 0.78, hold0: 0.76, hold1: 0.84 }

export function direct(f: FrameInfo) {
  const size = f.state.size
  D.t = f.t
  D.dt = f.dt
  D.aspect = size.width / Math.max(1, size.height)
  D.portrait = D.aspect < 0.8
  D.fit = handoffFit(D.aspect)
  const c = cOf(f.progress)
  D.c = c
  for (const id of STEP_IDS) D.p[id] = stepAt(id, c)
  const Pp = D.p
  const lab = useWorldsheet.getState()
  const settings = useSettings.getState()
  const dtS = f.dt > 0 ? f.dt : 1 // frozen clock (screenshots): snap

  /* ── OUT (Beat 6 → H2) ── */
  D.out = easeInOutCubic(range(c, OUT_START, OUT_END))
  D.h2 = ss(H2_START, H2_END, c)
  const outFade = ss(0.3, 0.72, D.out)

  /* ── weights ── */
  const w = D.w
  const toLab = ss(K('lab', 0), K('lab', 0.12), c)
  // phones showing the particles: no close-up on the pants (the Y stays the subject)
  const mobY = D.portrait && lab.mobileView === 'particles' && toLab < 1 ? 1 : 0
  D.closeup = ss(K('now', 0.46), K('now', 0.62), c) * (1 - toLab) * (1 - mobY)
  D.hold = ss(K('now', NOW_PHASE.hold0), K('now', NOW_PHASE.hold1), c) * (1 - toLab) * (1 - mobY)
  w.point = 1 - ss(1.0, 1.3, c)
  w.thread = ss(1.0, 1.25, c) * (1 - ss(K('area', 0.9), K('pants', 0.02), c))
  w.floor = ss(K('open', 0.22), K('open', 0.45), c) * (1 - outFade) * (1 - 0.55 * D.closeup)
  D.axisK = range(c, K('open', 0.32), K('open', 0.6))
  w.axis = ss(K('open', 0.3), K('open', 0.36), c) * (1 - outFade) * (1 - D.closeup)
  w.openParticles = ss(K('open', 0.44), K('open', 0.5), c) * (1 - ss(K('sheet', 0.08), K('sheet', 0.3), c))
  w.rest = ss(K('open', 0.44), K('open', 0.5), c) * (1 - ss(K('area', -0.02), K('area', 0.1), c))
  w.helicoid = ss(K('sheet', -0.1), K('sheet', 0.06), c) * (1 - ss(K('area', 0.9), K('pants', 0.02), c))
  w.tube = ss(K('sheet', 0.5), K('sheet', 0.58), c) * (1 - ss(K('area', -0.16), K('area', 0), c))
  w.proper = ss(K('area', 0.0), K('area', 0.1), c) * (1 - ss(K('area', 0.9), K('pants', 0.02), c))
  w.hist = ss(K('area', 0.9), K('pants', 0.08), c) * (1 - ss(K('lab', 0.86), K('lab', 0.98), c))
  w.loupes = ss(K('pants', 0.28), K('pants', 0.34), c) * (1 - ss(K('pants', 0.9), K('pants', 0.97), c))
  w.planes = ss(K('now', 0.02), K('now', 0.07), c) * (1 - ss(K('lab', 0.84), K('lab', 0.94), c))
  w.lab = ss(K('lab', -0.01), K('lab', 0.14), c) * (1 - ss(K('lab', 0.82), K('lab', 0.94), c))
  w.loops = ss(K('lab', 0.9), K('lab', 1.02), c) * (1 - ss(K('loops', 0.82), K('loops', 0.96), c))
  w.close = ss(K('close', -0.03), K('close', 0.07), c)

  /* ── floor footprint follows the subject ── */
  D.floor.x = FLOOR_X(c)
  D.axis.x = AXIS_X(c)
  D.axis.z = AXIS_Z(c)
  // the real Y hands over to the inset loupe (YInset) as the camera closes in on the pants
  D.yFade = 1 - ss(0, 0.55, D.closeup)
  const two = ss(K('area', 0.9), K('pants', 0.06), c) * (1 - ss(K('lab', 0.86), K('lab', 0.98), c))
  const loopsW = ss(K('lab', 0.86), K('lab', 0.98), c) * (1 - ss(K('loops', 0.97), K('close', 0.0), c))
  const early = 1 - ss(K('area', 0.0), K('area', 0.12), c)
  D.floor.w = 10 + 2.4 * early + 7 * two + 6 * loopsW
  D.floor.d = 10

  /* ── opening ── */
  D.lie = ss(0.22, 0.5, Pp.open)
  D.threadLen = lerp(4.2 * D.fit, 2.0, ss(0.22, 0.55, Pp.open))
  D.tP = 6 * easeInOutCubic(range(Pp.open, 0.48, 0.78))

  /* ── beat 1 ── */
  D.vib = 1 - ss(0.0, 0.15, Pp.sheet)
  D.tN = 8 * easeInOutCubic(range(Pp.sheet, 0.08, 0.78))
  D.tT = 8 * easeInOutCubic(range(Pp.sheet, 0.55, 0.9))
  D.tRest = Math.max(D.tP, D.tN)

  /* ── beat 2 ── */
  const ap = areaPhase(Pp.area)
  D.area.T = ap.T
  D.area.A = ap.A
  D.area.sweep = ap.sweep
  D.area.nudge = ap.nudge
  D.area.tau = ap.tau

  /* ── slicing: beat 4 (scroll) → lab (store) ── */
  const pn = Pp.now
  let t0: number
  let th: number
  let ph = 0
  const B = NOW_PHASE
  if (pn < B.tilt0) {
    th = 0
    t0 = lerp(3.5, 7, easeInOutCubic(range(pn, 0.04, B.tilt0)))
  } else if (pn < B.tilt1) {
    const u = easeInOutCubic(range(pn, B.tilt0, B.tilt1))
    th = 30 * u
    t0 = lerp(7, 3.8, u)
  } else if (pn < B.pin0) {
    th = 30
    t0 = lerp(3.8, 7, easeInOutCubic(range(pn, B.tilt1, B.pin0)))
  } else {
    // every direction: φ turns once while "now" is held at each slicing's own split moment t₀*(φ) — the
    // slice is always the pinching figure-eight, and its crossing slides round the crotch, painting the
    // smear (scroll-coupled mini-sweeps would strobe between one loop and two under a wheel notch)
    th = 30
    const u = range(pn, B.phi0, B.phi1)
    ph = 360 * easeInOutCubic(u)
    solveSplit(30 * DEG, ph * DEG, tmpSplit, tmpSplit)
    const intro = easeInOutCubic(range(pn, B.pin0, B.phi0))
    t0 = lerp(7, tmpSplit.t0 - PINCH_EPS, intro)
  }
  D.sl.trail = pn >= B.pin0 ? ph / 360 : 0
  D.sl.mode = toLab > 0.5 ? 1 : 0
  if (toLab > 0) {
    t0 = lerp(t0, lab.t0, toLab)
    th = lerp(th, lab.thetaDeg, toLab)
    // φ: beat 4 ends at 360° ≡ 0°; blend along the short way
    let dphi = lab.phiDeg - (ph % 360)
    if (dphi > 180) dphi -= 360
    if (dphi < -180) dphi += 360
    ph = (ph % 360) + dphi * toLab
  }
  D.sl.t0 = t0
  D.sl.theta = th * DEG
  D.sl.phi = ph * DEG
  solveSplit(D.sl.theta, D.sl.phi, D.split, D.split)
  const dist = t0 - D.split.t0
  D.flash = Math.exp(-(dist / 0.05) * (dist / 0.05))
  const inLab = D.sl.mode === 1
  const hist = lab.history
  const mob = D.portrait ? lab.mobileView : null
  D.sl.showY = inLab ? hist !== 'strings' : mob ? mob === 'particles' : true
  D.sl.showPants = inLab ? hist !== 'particles' : mob ? mob === 'strings' : true

  /* ── beat 5 ── */
  const pl = Pp.loops
  const squeeze = easeInOutCubic(range(pl, 0.08, 0.45))
  const stretch = easeInOutCubic(range(pl, 0.6, 0.88))
  D.w5 = stretch > 0 ? lerp(1.5, 4.0, stretch) : lerp(2.4, 1.5, squeeze)
  D.bubble = 1 - squeeze

  /* ── beat 6 ── */
  D.tC = 9 * easeInOutCubic(range(Pp.close, 0.04, 0.5))

  /* ── go-deeper drawer ── */
  const dr = settings.drawer
  D.deeperOpen = !!dr && dr.startsWith('worldsheet:')
  D.drawer = damp(D.drawer, D.deeperOpen ? 1 : 0, 4, dtS)
  const dp = deeperPhase(f.t)
  const on = D.deeperOpen ? 1 : 0
  D.deeper.dtau = dp.dtau * on
  D.deeper.T = dp.T * on
  D.deeper.dA = dp.dA * on
  D.deeper.bh = dp.bh * on

  /* ── camera ── */
  const cam = D.cam
  cam.az = TR.az(c)
  cam.pol = TR.pol(c)
  cam.dist = TR.dist(c)
  cam.tx = TR.tx(c)
  cam.ty = TR.ty(c)
  cam.tz = TR.tz(c)
  cam.sx = TR.sx(c)
  cam.sy = 0

  // lab: preset view, framed on the chosen history, the subject kept clear of the docked panel
  if (w.lab > 0) {
    const v = LAB_VIEWS[lab.view]
    D.labAz = damp(D.labAz, v.az, 3, dtS)
    D.labPol = damp(D.labPol, v.pol, 3, dtS)
    const single = hist !== 'both' || D.portrait
    // both: a little right of the midpoint, so the pants' readouts clear the docked panel
    const focus = hist === 'particles' || (D.portrait && hist === 'both' && lab.mobileView === 'particles') ? X_Y : hist === 'strings' || D.portrait ? X_P : (X_Y + X_P) / 2 + 0.45
    const k = ss(0, 1, w.lab)
    cam.az = lerp(cam.az, D.labAz, k)
    cam.pol = lerp(cam.pol, D.labPol, k)
    D.labDist = damp(D.labDist, single ? v.one : v.two, 3, dtS)
    cam.dist = lerp(cam.dist, D.labDist, k)
    cam.tx = lerp(cam.tx, focus, k)
    cam.ty = lerp(cam.ty, lab.view === 'top' ? 5.2 : 4.9, k)
    cam.sx = lerp(cam.sx, single ? -0.13 : -0.17, k)
  }
  D.viewNonce = lab.viewNonce

  // phones: the text sits at the bottom — frame the diagram in the free band above it, one history at a time
  let rising = 0
  if (D.portrait) {
    let tt = 0.62
    for (const id of STEP_IDS) {
      const p = Pp[id]
      if (p >= 0 && p < 1) {
        tt = textTop[id] ?? (id === 'out' ? 1 : 0.62)
        // in a step's last half viewport its text unpins and rises until it has faded out: yield some
        // room to it (capped, so the diagram never collapses while the text is leaving)
        const len = STEP_LEN[id]
        const rise = Math.max(0, p * len - (len - 0.5))
        const fw = Math.min(0.45, 0.22 / len)
        const r = rise * (1 - ss(1 - fw, 1, p))
        if (tt < 1) tt -= Math.min(0.12, r)
        rising = ss(0.02, 0.1, r)
        break
      }
    }
    D.textTop = f.dt > 0 ? damp(D.textTop, tt, 3, f.dt) : tt
    const top = 0.1
    const bottom = clamp(D.textTop - 0.03, 0.25, 0.8)
    const span = bottom - top
    const pf = clamp(0.95 / D.aspect, 1, 2.1)
    const intro = ss(1.2, 1.8, c) * (1 - ss(0.2, 0.7, D.out))
    cam.dist *= lerp(1, pf, intro)
    cam.sx = 0
    cam.sy = (0.5 - (top + bottom) / 2) * intro
    const dual = ss(K('area', 0.95), K('pants', 0.1), c) * (1 - ss(K('loops', 0.97), K('close', 0.0), c))
    if (dual > 0 && w.lab < 0.5) {
      const onStrings = lab.mobileView === 'strings'
      const inLoops = c > K('lab', 0.9)
      const focus = inLoops ? (onStrings ? X_HANDLE : X_BUBBLE) : onStrings ? X_P : X_Y
      cam.tx = lerp(cam.tx, focus, dual * (1 - D.closeup))
      cam.dist = lerp(cam.dist, cam.dist * 0.62, dual * (1 - D.closeup))
    }
    // the diagram (≈ 11 ℓ tall with its labels; ≥ 7.5 ℓ in Beat 4's close-up, so the pants' legs stay
    // clear of the text) must fit the free band; the target (the crotch) sits at the band's middle
    // (at the hold the film is dimmed and the slices nearly out: the smear itself may grow)
    const need = lerp(11, lerp(7.5, 5, D.hold), D.closeup) / (0.6306 * span)
    cam.dist = lerp(cam.dist, Math.max(cam.dist, need), ss(1.6, 2.2, c) * (1 - D.out))
  }

  D.textRise = rising

  // the drawer covers the right of the screen: glide the subject into the free left side
  if (!D.portrait) cam.sx = lerp(cam.sx, -0.21, D.drawer)
  cam.sx *= 1 - D.out
  cam.sy *= 1 - D.out
  D.camTarget[0] = cam.tx
  D.camTarget[1] = cam.ty
  D.camTarget[2] = cam.tz
}
