// The chapter's choreography in one place. Every frame, `direct()` turns scroll (step progress),
// lab state and time into the numbers every component reads from `S`. Components never decide
// timing themselves, so story, lab and handoffs stay consistent.

import type { ChapterHandle } from '@/core/chapter'
import { clamp, damp, lerp, range, smootherstep, smoothstep } from '@/core/math'
import {
  BRIDGES,
  DEG,
  RESIDENT_Y,
  SEA,
  TIP_INDEX,
  TIPS,
  beat4g,
  gFromU,
  gOfRho,
  hornHeight,
  outwardAzimuth,
  overviewDistance,
  pullPose,
  ratio11,
  tipCenter,
  tipDir,
  type Theory,
} from './model'
import { useM } from './store'

/* ───────────────────────── Scroll layout (shared with the Overlay) ───────────────────────── */

export const LEN = {
  title: 1.15,
  opening: 1.4,
  islands: 1.9,
  shallow: 1.45,
  bridges: 1.8,
  aha: 2.3,
  landmass: 2.3,
  interior: 1.5,
  lab: 2.4,
  dive: 1.0,
  exit: 1.3,
} as const

/* ───────────────────────── Camera poses ───────────────────────── */

export interface Pose {
  tx: number
  ty: number
  tz: number
  d: number
  pol: number
  az: number
}
const mk = (): Pose => ({ tx: 0, ty: 0, tz: 0, d: 10, pol: Math.PI / 2, az: 0 })
const set = (o: Pose, tx: number, ty: number, tz: number, d: number, pol: number, az: number) => {
  o.tx = tx
  o.ty = ty
  o.tz = tz
  o.d = d
  o.pol = pol
  o.az = az
  return o
}
const copy = (o: Pose, a: Pose) => set(o, a.tx, a.ty, a.tz, a.d, a.pol, a.az)
/** Blend two poses: target and angles linearly, distance logarithmically (a dolly feels even). */
export function mixPose(o: Pose, a: Pose, b: Pose, t: number) {
  const k = clamp(t)
  let daz = b.az - a.az
  daz = Math.atan2(Math.sin(daz), Math.cos(daz))
  return set(
    o,
    lerp(a.tx, b.tx, k),
    lerp(a.ty, b.ty, k),
    lerp(a.tz, b.tz, k),
    Math.exp(lerp(Math.log(a.d), Math.log(b.d), k)),
    lerp(a.pol, b.pol, k),
    a.az + daz * k,
  )
}
/** A dive: travel and dolly first, pitch down to the horizon only at the end (never skim the archipelago). */
export function divePose(o: Pose, a: Pose, b: Pose, t: number) {
  const k = clamp(t)
  mixPose(o, a, b, k)
  const kp = k < 0.4 ? 0 : ((k - 0.4) / 0.6) ** 2
  o.pol = lerp(a.pol, b.pol, kp)
  return o
}
function dampPose(o: Pose, b: Pose, lambda: number, dt: number) {
  const k = dt <= 0 ? 1 : 1 - Math.exp(-lambda * dt)
  return mixPose(o, o, b, k)
}

/* ───────────────────────── Rig frames ───────────────────────── */

/** A close-up apparatus lives in its own frame: position, yaw (faces an OrbitRig azimuth) and scale. */
export interface Frame {
  x: number
  y: number
  z: number
  yaw: number
  s: number
}
const frameAt = (o: Frame, j: number, y: number, s = RIG_S) => {
  const [x, , z] = tipCenter(j)
  o.x = x
  o.y = y
  o.z = z
  o.yaw = outwardAzimuth(j)
  o.s = s
  return o
}
/** Rig units: the Beat-4 thread is 6 long. At this scale a 6-long circle has the resident's radius (0.3). */
export const THREAD_L = 6
export const RIG_S = 0.3 / (THREAD_L / (2 * Math.PI))
export const RIG_Y = 1.95
export const HANDOFF_WIDTH = 0.085

export type RigKind = 'thread' | 'walls' | 'tension'
export interface RigState {
  vis: number
  /** Extras (gauge, ladder, lattice, labels) visibility. */
  extra: number
  g: number
  frame: Frame
}

/* ───────────────────────── The shared state ───────────────────────── */

export type Seg = 'opening' | 'islands' | 'shallow' | 'bridges' | 'aha' | 'landmass' | 'interior' | 'lab' | 'exit'

export interface Resident {
  x: number
  y: number
  z: number
  scale: number
  op: number
  act: number
  /** Type I only: 0 = one closed loop, 1 = open string + tiny loop. */
  open: number
  /** Billboard: 1 = face the camera, 0 = lie in the XY plane (opening). */
  bb: number
}

export const S = {
  aspect: 1.6,
  portrait: false,
  t: 0,
  dt: 0,
  seg: 'opening' as Seg,
  O: 0,
  p: { title: 0, opening: 0, islands: 0, shallow: 0, bridges: 0, aha: 0, landmass: 0, interior: 0, lab: 0, exit: 0 },
  labW: 0,
  dialW: 0,
  mapFade: 0,
  mapDim: 1,
  /** 0..1 while a close-up rig owns the frame (map labels hide, the map dims). */
  focus: 0,
  /** 0..1 while Beat 3 frames the Type I – HO arch. */
  sFocus: 0,
  /** The island whose resident becomes the close-up (exempt from the focus dimming). */
  focusTip: -1,
  seaFill: 0.85,
  amp: new Float32Array(6),
  flash: new Float32Array(6),
  bridge: new Float32Array(BRIDGES.length),
  bridgeHL: new Float32Array(BRIDGES.length),
  pieces: 6,
  /** How many entries of 6 → 5 → 4 → 3 → 2 → 1 the story has reached. */
  histN: 1,
  maskFull: 0,
  /** 0..1: the submerged shelf may show through the sea (only once it turns translucent). */
  reveal: 0,
  /** Topographic contour strength (0 in Beat 2, so only the g-arcs draw). */
  topo: 1,
  fog: 0,
  pull: 0,
  gContours: 1,
  shore: 0,
  /** Island name labels (0 hidden) and the 11D identity reveal. */
  names: 0,
  m11: 0,
  cusps: 0,
  mLabel: 0,
  mTop: 0,
  words: 0,
  flag: 0,
  footer: 0,
  counter: 0,
  res: Array.from({ length: 6 }, (): Resident => ({ x: 0, y: 0, z: 0, scale: 1, op: 0, act: 0, open: 0, bb: 1 })),
  hero: { op: 1, lobe: 0, phi: 0 },
  visit: -1,
  visitW: 0,
  thread: { vis: 0, extra: 0, g: 0.1, frame: { x: 0, y: 0, z: 0, yaw: 0, s: RIG_S }, curl: 0, width: 0.12, big: 0, story: 1 } as RigState & { curl: number; width: number; big: number; story: number },
  walls: { vis: 0, extra: 0, g: 0.1, frame: { x: 0, y: 0, z: 0, yaw: 0, s: RIG_S } } as RigState,
  tension: { vis: 0, extra: 0, g: 0.1, frame: { x: 0, y: 0, z: 0, yaw: 0, s: RIG_S }, theory: 'I' as Theory, pq: 0 } as RigState & { theory: Theory; pq: number },
  probe: { vis: 0, rho: 5.6, g: 0.01, x: 0, y: 0, z: 0 },
  dstr: { vis: 0, s: 0, g: 0.1, bars: 0 },
  iib: { vis: 0, g: 0.3 },
  ticks: 0,
  cam: mk(),
  shift: [0, 0] as [number, number],
  /** Which pinned analogy line the HUD shows (index into PINNED) and its opacity. */
  pin: -1,
  pinOp: 0,
  scaleNote: 0,
  scaleNoteAha: 0,
  hover: -1,
  hoverBridge: -1,
  interactive: false,
  swapPulse: 0,
}

export const PINNED = [
  '“Twist” stands for each mover’s chirality. Counting supersymmetric theories in flat 10D; non-supersymmetric strings exist too.',
  'The sea marks where approximation fails. Nothing physical happens at the shore.',
  'A 2D cartoon of a many-dimensional space of possible backgrounds.',
  'The eleventh direction is drawn as a tube in 3D. The rule R₁₁ = g ℓs is the real content.',
  'A 2D cartoon of a many-dimensional space. Tips are limits; real paths can change the hidden shape.',
  'Not to scale. The string length ℓs itself is unknown.',
]

/* ───────────────────────── Internal persistent (time-damped) lab state ───────────────────────── */

const L = {
  bridge: new Float32Array(BRIDGES.length),
  mask: 0,
  pull: 0,
  dial: 0,
  cam: mk(),
  camInit: false,
  lastToggles: { T: false, S: false, L: false, C: false },
  flash: new Float32Array(6),
  act: new Float32Array(6),
  g: 0.1,
  lastSide: 0,
  swap: 0,
}

// scratch
const KINDS = ['T', 'S', 'L', 'C'] as const
const STORY = new Float32Array(BRIDGES.length)
const P0 = mk()
const P1 = mk()
const P2 = mk()
const HANDOFF_P = set(mk(), 0, 0, 0, 10, Math.PI / 2, 0)
const tmpF: Frame = { x: 0, y: 0, z: 0, yaw: 0, s: RIG_S }

const OV = (o: Pose, az = 0) => set(o, 0, 0, 0, overviewDistance(S.aspect), 35 * DEG, az)
const PULL = (o: Pose, p: number, az = 0) => {
  const q = pullPose(p, S.aspect)
  return set(o, 0, 0, 0, q.distance, q.polar, az)
}
const rigPose = (o: Pose, f: Frame, dRel: number, pol: number) => set(o, f.x, f.y, f.z, f.s * dRel, pol, f.yaw)
const hoverPoint = (j: number) => {
  const [x, , z] = tipCenter(j)
  return [x, RESIDENT_Y, z] as const
}

/** Scroll-to-g helper for the HE walls beat (0.1 → 10, log). */
const wallsG = (p: number) => Math.pow(10, -1 + 2 * range(p, 0.08, 0.2))

/** Rig camera distances (rig units) and pitch, per kind. */
export const RIG_VIEW: Record<RigKind, { d: number; pol: number }> = {
  thread: { d: 17, pol: 90 * DEG },
  walls: { d: 15.5, pol: 80 * DEG },
  tension: { d: 15.5, pol: 86 * DEG },
}
export const theoryRig = (t: Theory): RigKind => (t === 'IIA' ? 'thread' : t === 'HE' ? 'walls' : 'tension')
/** Rig camera distance (rig units); portrait phones stand further back so the apparatus and its gauge's tick
 *  labels fit the width, and further still in the Lab, where the rig must fit the top ~half above the bottom sheet. */
export const rigD = (k: RigKind) => RIG_VIEW[k].d * (S.portrait ? lerp(1.9, 2.25, S.dialW) : 1)

/* ───────────────────────── direct() ───────────────────────── */

export function direct(h: ChapterHandle, t: number, dt: number, aspect: number, handoffFit: number) {
  const st = useM.getState()
  S.t = t
  S.dt = dt
  S.aspect = aspect
  S.portrait = aspect < 0.8
  const p = S.p
  p.title = h.step('title')
  p.opening = h.step('opening')
  p.islands = h.step('islands')
  p.shallow = h.step('shallow')
  p.bridges = h.step('bridges')
  p.aha = h.step('aha')
  p.landmass = h.step('landmass')
  p.interior = h.step('interior')
  p.lab = h.step('lab')
  // the exit runs across two steps: an empty 'dive' and the closing line's 'exit'
  p.exit = (h.step('dive') * LEN.dive + h.step('exit') * LEN.exit) / (LEN.dive + LEN.exit)

  const T0 = 0.5 / LEN.title
  const O = 0.35 * range(p.title, T0, 1) + 0.65 * range(p.opening, 0, 0.9)
  S.O = O
  S.seg =
    p.exit > 0
      ? 'exit'
      : p.lab > 0
        ? 'lab'
        : p.interior > 0
          ? 'interior'
          : p.landmass > 0
            ? 'landmass'
            : p.aha > 0
              ? 'aha'
              : p.bridges > 0
                ? 'bridges'
                : p.shallow > 0
                  ? 'shallow'
                  : p.islands > 0
                    ? 'islands'
                    : 'opening'

  /* ── lab weights & damped lab state ── */
  const labW = smoothstep(0, 0.1, p.lab)
  S.labW = labW
  const inLab = S.seg === 'lab'
  const snap = dt <= 0
  const toward = (cur: number, target: number, rate: number) =>
    snap ? target : cur < target ? Math.min(target, cur + rate * dt) : Math.max(target, cur - rate * dt)

  const tg = { T: st.T, S: st.S, L: st.L, C: st.C }
  for (let i = 0; i < BRIDGES.length; i++) {
    const b = BRIDGES[i]
    L.bridge[i] = toward(L.bridge[i], tg[b.kind] ? 1 : 0, 2) // 0.5 s grow
  }
  // flash the islands a newly switched-on bridge touches
  for (const k of KINDS) {
    if (tg[k] && !L.lastToggles[k]) for (const b of BRIDGES) if (b.kind === k) for (const j of [b.a, b.b, b.c ?? b.a]) L.flash[j] = 1
    L.lastToggles[k] = tg[k]
  }
  for (let j = 0; j < 6; j++) L.flash[j] = snap ? 0 : Math.max(0, L.flash[j] - dt * 1.3)
  L.mask = toward(L.mask, st.pieces === 1 ? 1 : 0, 1 / 1.2)
  L.pull = snap ? st.pull : damp(L.pull, st.pull, 5, dt)
  const dialTarget = st.station === 'dial' ? 1 : 0
  L.dial = snap ? dialTarget : damp(L.dial, dialTarget, 2.6, dt)
  L.g = gFromU(st.u)
  S.dialW = L.dial * labW

  /* ── story quantities (monotonic through the beats) ── */
  const p3 = p.bridges
  const p4 = p.aha
  const p5 = p.landmass
  const p6 = p.interior
  const sb = S.bridge
  const story = STORY
  story[0] = range(p3, 0.03, 0.14) // t-ii
  story[1] = range(p3, 0.15, 0.27) // t-het
  story[2] = range(p3, 0.31, 0.42) // s-i-ho
  story[3] = range(p3, 0.76, 0.87) // s-iib
  story[4] = range(p4, 0.83, 0.93) // l-iia
  story[5] = range(p5, 0.2, 0.3) // l-he
  story[6] = 0 // c-k3 (lab only)
  for (let i = 0; i < BRIDGES.length; i++) sb[i] = lerp(story[i], L.bridge[i], labW)

  let hn = 1
  if (p3 >= 0.14) hn++
  if (p3 >= 0.27) hn++
  if (p3 >= 0.7) hn++
  if (p4 >= 0.93) hn++
  if (p5 >= 0.3) hn++
  S.histN = hn
  S.pieces = labW > 0.5 ? st.pieces : 7 - hn
  S.counter = smoothstep(0.0, 0.06, p3) * (1 - smoothstep(0.45, 0.6, p5)) * (1 - smoothstep(0.02, 0.1, p4) * (1 - smoothstep(0.82, 0.9, p4)))

  const storyPull = range(p5, 0.3, 0.95)
  const storyPullE = storyPull * storyPull * (3 - 2 * storyPull)
  const labPull = L.pull * (1 - L.dial)
  S.pull = lerp(storyPullE, labPull, labW)
  S.seaFill = lerp(0.85, 0.12, smoothstep(0.3, 0.8, S.pull))
  S.maskFull = lerp(smoothstep(0.3, 0.5, p5), L.mask, labW)
  S.reveal = Math.max(S.maskFull, smoothstep(0.02, 0.2, S.pull))
  S.fog = lerp(smoothstep(0.45, 0.75, p5), L.mask * smoothstep(0.05, 0.4, labPull + 0.2), labW)
  S.cusps = lerp(smoothstep(0.52, 0.68, p5), L.mask * smoothstep(0.25, 0.6, labPull), labW)
  S.mLabel = lerp(smoothstep(0.78, 0.86, p5), L.mask * smoothstep(0.3, 0.6, labPull), labW)
  S.mTop = lerp(smoothstep(0.04, 0.24, p6), 0, labW)
  S.words = lerp(p6, 0, labW)
  S.flag = lerp(smoothstep(0.1, 0.22, p6), 0, labW)
  S.footer = lerp(smoothstep(0.55, 0.7, p6), 0, labW)

  /* ── islands ── */
  // landing order in the opening (rank): I, IIB, IIA, HO, HE
  const rank = [0, 2, 1, 0, 3, 4]
  for (let j = 1; j < 6; j++) {
    const land = 0.66 + 0.03 * rank[j] + 0.16
    S.amp[j] = lerp(smoothstep(land - 0.02, land + 0.06, O), 1, labW)
  }
  const m11Story = smoothstep(0.85, 0.97, p4)
  S.m11 = lerp(m11Story, 1, labW)
  S.amp[0] = lerp(0.2 * smoothstep(0.66, 0.8, O) + 0.8 * m11Story, 1, labW)
  for (let j = 0; j < 6; j++) S.flash[j] = L.flash[j] * labW

  /* ── map visibility ── */
  const exitFade = 1 - smoothstep(0.2, 0.4, p.exit)
  // the map only fades in once the camera has pitched well above the horizon (no edge-on slivers)
  S.mapFade = smoothstep(0.72, 0.86, O) * exitFade
  S.names = smoothstep(0.8, 0.95, O) * exitFade * (1 - smoothstep(0.02, 0.12, p.shallow) * (1 - smoothstep(0.88, 0.98, p.shallow)))
  S.shore = smoothstep(0.05, 0.2, p.shallow) * (1 - smoothstep(0.9, 1, p.shallow))
  S.gContours = S.shore
  S.topo = 1 - S.shore

  /* ── residents ── */
  const fit = handoffFit
  const R = 1.3 * fit
  // hero loop (H2): five lobes, then pinch
  // five lobes grow, then deepen until the loop pinches (only in the opening; the exit's H2 is plain)
  const lobe = S.seg === 'opening' ? 0.06 * smoothstep(0, 0.35, O) + (0.5 * R - 0.06) * smoothstep(0.35, 0.5, O) : 0
  const phT = (1.2 * t) % (2 * Math.PI)
  let dph = Math.PI - phT
  dph = Math.atan2(Math.sin(dph), Math.cos(dph))
  S.hero.lobe = lobe
  S.hero.phi = phT + dph * smoothstep(0.35, 0.45, O)
  const heroExit = smoothstep(0.49, 0.53, p.exit)
  S.hero.op = Math.max(1 - smoothstep(0.47, 0.52, O), heroExit)

  // Beat 1 visits: I, IIA, IIB, HO, HE
  const visitOrder = [3, 1, 2, 4, 5]
  const v = range(p.islands, 0.1, 0.9) * 5
  const vk = Math.min(4, Math.floor(v))
  const vf = v - vk
  const vs = smoothstep(0.72, 1.0, vf)
  const inIslands = S.seg === 'islands'
  S.visit = inIslands ? visitOrder[vs > 0.5 && vk < 4 ? vk + 1 : vk] : -1
  S.visitW = inIslands ? smoothstep(0, 0.1, p.islands) * (1 - smoothstep(0.9, 1, p.islands)) : 0

  // hover & selection (lab)
  S.hover = -1
  S.hoverBridge = -1
  if (inLab && st.focus) {
    if (st.focus.startsWith('tip:')) S.hover = Number(st.focus.slice(4))
    else if (st.focus.startsWith('bridge:')) S.hoverBridge = BRIDGES.findIndex((b) => b.id === st.focus!.slice(7))
  }
  for (let i = 0; i < BRIDGES.length; i++) S.bridgeHL[i] = S.hoverBridge === i ? 1 : 0

  const shallowW = S.seg === 'shallow' ? smoothstep(0.02, 0.12, p.shallow) * (1 - smoothstep(0.88, 0.98, p.shallow)) : 0
  // Beat 3's close-up on the Type I – HO crossing (camera, dimming and labels all key off this)
  const sFocus = S.seg === 'bridges' ? smootherstep(0.25, 0.37, p3) * (1 - smootherstep(0.72, 0.8, p3)) : 0
  const petal = [0, 54, -18, -90, -162, 126] // birth angle (deg) of each string's loop, by tip index
  for (let j = 0; j < 6; j++) {
    const r = S.res[j]
    const [hx, hy, hz] = hoverPoint(j)
    if (j === 0) {
      // 11D resident: a small membrane, appears at landfall
      r.x = hx
      r.y = hy
      r.z = hz
      r.scale = 1
      r.op = S.m11 * S.mapFade
      r.bb = 1
      r.open = 0
    } else {
      const th = TIPS[j].theta * DEG
      const pa = petal[j] * DEG
      // birth → pentagon (radius 1.8 at the island's bearing) → island
      const kb = smoothstep(0.52, 0.65, O)
      const bx = lerp(0.95 * R * Math.cos(pa), 1.8 * fit * Math.cos(th), kb)
      const by = lerp(0.95 * R * Math.sin(pa), 1.8 * fit * Math.sin(th), kb)
      const st0 = 0.66 + 0.03 * rank[j]
      const kd = smootherstep(st0, st0 + 0.16, O)
      r.x = lerp(bx, hx, kd)
      r.y = lerp(by, hy, kd)
      r.z = lerp(0, hz, kd)
      r.scale = lerp(lerp(1.3, 1, kb) * fit, 1, kd)
      r.bb = smoothstep(0.64, 0.72, O)
      r.open = j === 3 ? smoothstep(0.55, 0.65, O) : 0
      r.op = smoothstep(0.47, 0.52, O) * exitFade
    }
    // activity: visited (Beat 1), hovered/selected (lab), or merging
    let a = 0.35
    if (S.visit === j) a = 1
    if (S.hover === j) a = 1
    if (inLab && st.station === 'dial' && TIP_INDEX[st.theory] === j) a = 1
    L.act[j] = snap ? a : damp(L.act[j], a, 3, dt)
    r.act = L.act[j] * (O < 0.66 ? 0.5 : 1)
    // keep the frame on one subject: dim the others while visiting (Beat 1) and during the offshore walk (Beat 2)
    if (S.visit >= 0 && S.visit !== j) r.op *= 1 - 0.85 * S.visitW
    r.op *= 1 - shallowW
    // Beat 3's close-up on the Type I – HO crossing: every other resident leaves the frame
    if (j !== 3 && j !== 4) r.op *= 1 - sFocus
  }

  /* ── camera ── */
  const cam = S.cam
  const desk = !S.portrait
  const textShift: [number, number] = desk ? [0.1, 0] : [0, 0.2]
  // desktop: the docked panel (clear of the chapter rail) leaves the left ~60% for the map
  const labShift: [number, number] = desk ? [-0.19, -0.04] : [0, 0.12]
  let shift: [number, number] = [0, 0]
  const thr = S.thread
  const wal = S.walls
  const ten = S.tension
  thr.vis = 0
  thr.extra = 0
  thr.big = 0
  thr.curl = 0
  thr.width = 0.12
  wal.vis = 0
  wal.extra = 0
  ten.vis = 0
  ten.extra = 0
  S.probe.vis = 0
  S.dstr.vis = 0
  S.dstr.bars = 0
  S.iib.vis = 0
  S.ticks = 0
  S.mapDim = 1
  S.focus = 0
  S.sFocus = 0
  S.focusTip = -1
  S.pin = -1
  S.pinOp = 0
  S.scaleNote = desk ? smoothstep(0.8, 1, O) : 0
  S.scaleNoteAha = 0
  S.interactive = inLab
  frameAt(thr.frame, 1, RIG_Y)
  frameAt(wal.frame, 5, RIG_Y)

  switch (S.seg) {
    case 'opening': {
      const k = smootherstep(0.65, 1.0, O)
      mixPose(cam, HANDOFF_P, OV(P0), k)
      const ks = smoothstep(0.0, 0.3, p.opening)
      shift = [textShift[0] * ks, textShift[1] * ks]
      S.pin = 2
      S.pinOp = smoothstep(0.85, 1, O)
      break
    }
    case 'islands': {
      const p1 = p.islands
      const az = 20 * DEG * Math.sin(Math.PI * p1)
      const a = visitOrder[vk]
      const b = visitOrder[Math.min(4, vk + 1)]
      const [ax, ay, az0] = hoverPoint(a)
      const [bx, by, bz] = hoverPoint(b)
      const s = vk < 4 ? vs : 0
      const d = (S.portrait ? 8.6 : 4.3) + 2.8 * Math.sin(Math.PI * s)
      set(P1, lerp(ax, bx, s), lerp(ay, by, s) - 0.25, lerp(az0, bz, s), d, 52 * DEG, az)
      OV(P0, az)
      const kv = smootherstep(0, 0.1, p1) * (1 - smootherstep(0.9, 1, p1))
      mixPose(cam, P0, P1, kv)
      // the visited resident sits at ~57% of the width so its caption stays clear of the chapter rail;
      // on phones it sits a little lower, so its name clears the pinned line at the top
      shift = [textShift[0] * (1 - 0.3 * kv), S.portrait ? lerp(textShift[1], 0.13, kv) : textShift[1]]
      S.pin = 0
      S.pinOp = smoothstep(0.08, 0.16, p1) * (1 - smoothstep(0.9, 0.98, p1))
      break
    }
    case 'shallow': {
      const p2 = p.shallow
      const rho = lerp(5.6, 3.0, range(p2, 0.1, 0.9))
      const [ux, uz] = tipDir(1)
      const y = Math.max(hornHeight(rho), SEA)
      S.probe.vis = smoothstep(0.04, 0.12, p2) * (1 - smoothstep(0.9, 0.98, p2))
      S.probe.rho = rho
      S.probe.g = gOfRho(rho)
      S.probe.x = rho * ux
      S.probe.y = y
      S.probe.z = rho * uz
      // phones stand back so the stack, the probe and the horn below it all sit above the text (upper ~55% of
      // the screen), with room left of the horn for the shore label
      const az1 = outwardAzimuth(1)
      set(P1, rho * ux, y + 0.95, rho * uz, S.portrait ? 14.5 : 5.2, 60 * DEG, az1)
      OV(P0)
      const k2 = smootherstep(0, 0.14, p2) * (1 - smootherstep(0.88, 1, p2))
      mixPose(cam, P0, P1, k2)
      S.mapDim = 1
      shift = S.portrait ? [0, textShift[1] + 0.025 * k2] : textShift
      S.pin = 1
      S.pinOp = smoothstep(0.08, 0.16, p2) * (1 - smoothstep(0.9, 0.98, p2))
      break
    }
    case 'bridges': {
      const I = tipCenter(3)
      const HO = tipCenter(4)
      // the camera swings round to face the crossing from the map's interior: Type I on the left, HO on the right,
      // so the D-string's walk (Type I → HO) reads left to right, with only open sea behind the pair
      // two moves, never a low pass over the other islands: the map turns under the high overview camera
      // (turntable), then the camera dollies in; on the way out, dolly back up first, then turn back
      const mx = (I[0] + HO[0]) / 2
      const mz = (I[2] + HO[2]) / 2
      set(P1, mx, 1.2, mz, S.portrait ? 25 : 10.8, 44 * DEG, 150 * DEG)
      OV(P0)
      set(P2, mx * 0.5, 0.6, mz * 0.5, P0.d, P0.pol, 150 * DEG)
      const kTurn = smootherstep(0.25, 0.32, p3) * (1 - smootherstep(0.76, 0.8, p3))
      const kDolly = smootherstep(0.3, 0.37, p3) * (1 - smootherstep(0.72, 0.77, p3))
      mixPose(cam, P0, P2, kTurn)
      mixPose(cam, cam, P1, kDolly)
      const ks = sFocus
      S.sFocus = ks
      shift = [textShift[0] * (1 + 0.1 * ks), textShift[1]]
      S.dstr.vis = smoothstep(0.34, 0.4, p3) * (1 - smoothstep(0.72, 0.78, p3))
      S.dstr.bars = S.dstr.vis
      S.dstr.s = range(p3, 0.42, 0.7)
      S.dstr.g = Math.pow(10, -1 + 2 * S.dstr.s)
      S.ticks = range(p3, 0.44, 0.7)
      S.iib.vis = smoothstep(0.78, 0.84, p3) * (1 - smoothstep(0.95, 1, p3))
      S.iib.g = Math.pow(10, -0.6 + 1.2 * range(p3, 0.8, 0.95))
      S.pin = 2
      S.pinOp = smoothstep(0.06, 0.14, p3) * (1 - smoothstep(0.92, 1, p3))
      break
    }
    case 'aha': {
      thr.story = 1
      const kIn = smootherstep(0.0, 0.12, p4)
      const kOut = smootherstep(0.8, 0.93, p4)
      const straighten = smoothstep(0.12, 0.19, p4)
      thr.curl = 1 - straighten
      frameAt(thr.frame, 1, lerp(RESIDENT_Y, RIG_Y, straighten))
      thr.g = beat4g(p4)
      thr.vis = smoothstep(0.08, 0.12, p4) * (1 - smoothstep(0.8, 0.86, p4))
      thr.extra = smoothstep(0.14, 0.22, p4) * (1 - smoothstep(0.78, 0.84, p4))
      thr.big = smoothstep(0.6, 0.68, p4) * (1 - smoothstep(0.78, 0.82, p4))
      rigPose(P1, thr.frame, rigD('thread'), RIG_VIEW.thread.pol)
      OV(P0)
      divePose(P2, P0, P1, kIn)
      divePose(cam, P0, P2, 1 - kOut)
      S.focus = smoothstep(0.0, 0.1, p4) * (1 - smoothstep(0.8, 0.9, p4))
      S.focusTip = 1
      S.mapDim = 1 - 0.88 * S.focus
      shift = [textShift[0] * (1 - 0.3 * S.focus), S.portrait ? lerp(textShift[1], 0.15, S.focus) : textShift[1]]
      S.pin = 3
      S.pinOp = smoothstep(0.16, 0.24, p4) * (1 - smoothstep(0.78, 0.84, p4))
      S.scaleNoteAha = smoothstep(0.1, 0.2, p4) * (1 - smoothstep(0.8, 0.9, p4))
      break
    }
    case 'landmass': {
      wal.g = wallsG(p5)
      // the walls clear the frame before the camera starts to pull out of the close-up
      wal.vis = smoothstep(0.03, 0.08, p5) * (1 - smoothstep(0.18, 0.21, p5))
      wal.extra = wal.vis
      rigPose(P1, wal.frame, rigD('walls'), RIG_VIEW.walls.pol)
      OV(P0)
      divePose(P2, P0, P1, smootherstep(0, 0.08, p5))
      divePose(cam, P0, P2, 1 - smootherstep(0.2, 0.29, p5))
      if (p5 > 0.3) PULL(cam, S.pull)
      S.focus = smoothstep(0.0, 0.06, p5) * (1 - smoothstep(0.2, 0.27, p5))
      S.focusTip = 5
      // the HE resident steps aside for the walls close-up
      S.res[5].op *= 1 - smoothstep(0.0, 0.05, p5) * (1 - smoothstep(0.25, 0.3, p5))
      S.mapDim = 1 - 0.88 * S.focus
      // the walls rig (gauge at −4.1 … walls to +3) is centred in the band between the text and the rail
      // phones: as the camera climbs, the landmass settles lower so the pinned line and the M title fit above it
      shift = [lerp(textShift[0], S.portrait ? 0.09 : 0.138, S.focus), S.portrait ? lerp(textShift[1], 0.13, S.pull) : textShift[1]]
      S.pin = p5 < 0.88 ? 2 : 4
      S.pinOp = p5 < 0.88 ? smoothstep(0.3, 0.4, p5) * (1 - smoothstep(0.8, 0.86, p5)) : smoothstep(0.9, 0.96, p5)
      break
    }
    case 'interior': {
      PULL(cam, 1, 8 * DEG * p6)
      // desktop: the landmass settles a little lower so the title, the three words and their source fit above it
      shift = S.portrait ? [0, lerp(0.13, 0.1, S.mTop)] : [textShift[0], -0.035 * S.mTop]
      S.pin = 4
      S.pinOp = 1 - smoothstep(0.9, 1, p6)
      break
    }
    case 'lab':
    case 'exit': {
      // lab camera target (time-damped): MAP = overview + pull; DIAL = the chosen theory's rig
      const theory = st.theory
      const kind = theoryRig(theory)
      const j = TIP_INDEX[theory]
      PULL(P1, labPull, 0)
      P1.d *= S.portrait ? 1.3 : 1.14
      frameAt(tmpF, j, RIG_Y)
      rigPose(P2, tmpF, rigD(kind), RIG_VIEW[kind].pol)
      mixPose(P0, P1, P2, L.dial)
      if (!L.camInit || snap) {
        copy(L.cam, P0)
        L.camInit = true
      } else dampPose(L.cam, P0, 3.2, dt)
      PULL(P1, 1, 8 * DEG)
      mixPose(cam, P1, L.cam, smoothstep(0, 0.12, p.lab))
      // MAP centres the map in the space left of the panel; DIAL centres each rig's span there
      const lsx = lerp(labShift[0], desk ? (kind === 'thread' ? -0.175 : -0.15) : kind === 'walls' ? 0.075 : kind === 'tension' ? 0.035 : 0, L.dial)
      const lsy = desk ? labShift[1] : lerp(labShift[1], 0.175, L.dial)
      shift = [lerp(textShift[0], lsx, labW), lerp(textShift[1], lsy, labW)]
      // DIAL rigs
      const dw = L.dial * labW
      thr.story = S.seg === 'exit' ? 1 : 0
      if (kind === 'thread') {
        thr.g = L.g
        thr.vis = dw
        thr.extra = dw
        thr.big = 0
      } else if (kind === 'walls') {
        wal.g = L.g
        wal.vis = dw
        wal.extra = dw
      } else {
        ten.g = L.g
        ten.vis = dw
        ten.extra = dw
        ten.theory = theory
        frameAt(ten.frame, j, RIG_Y)
      }
      ten.pq = st.pq && theory === 'IIB' ? 1 : 0
      S.focus = dw
      S.focusTip = j
      S.mapDim = 1 - 0.85 * dw
      S.pin = st.station === 'dial' ? 5 : 2
      S.pinOp = labW * (1 - smoothstep(0.9, 1, p.lab))
      // swap pulse: the dial crossed its handover point
      const side = theory === 'IIA' || theory === 'HE' ? (ratio11(L.g) > 1 ? 1 : -1) : L.g > 1 ? 1 : -1
      if (L.lastSide !== 0 && side !== L.lastSide) L.swap = 1
      L.lastSide = side
      L.swap = snap ? 0 : Math.max(0, L.swap - dt * 1.2)
      S.swapPulse = L.swap

      if (S.seg === 'exit') {
        const pe = p.exit
        const fromLabIIA = st.station === 'dial' && theory === 'IIA'
        // a short reprise: arrive with the circle still open, then slide the dial back to g = 0.1
        const g0 = fromLabIIA ? L.g : 3
        const kg = smootherstep(0.15, 0.31, pe)
        thr.g = Math.exp(lerp(Math.log(g0), Math.log(0.1), kg))
        wal.vis *= 1 - smoothstep(0, 0.08, pe)
        ten.vis *= 1 - smoothstep(0, 0.08, pe)
        wal.extra = wal.vis
        ten.extra = ten.vis
        thr.vis = Math.max(fromLabIIA ? dw : 0, smoothstep(0.08, 0.15, pe)) * (1 - smoothstep(0.5, 0.54, pe))
        thr.extra = Math.max(fromLabIIA ? dw : 0, smoothstep(0.11, 0.17, pe)) * (1 - smoothstep(0.28, 0.38, pe))
        // curl up and carry the rig's frame to the origin (the map has dissolved by then)
        const kc = smootherstep(0.32, 0.5, pe)
        thr.curl = kc
        const sEnd = (1.3 * fit) / (THREAD_L / (2 * Math.PI))
        const f = thr.frame
        const [ix, , iz] = tipCenter(1)
        f.x = lerp(ix, 0, kc)
        f.y = lerp(RIG_Y, 0, kc)
        f.z = lerp(iz, 0, kc)
        const yaw0 = outwardAzimuth(1)
        f.yaw = lerp(yaw0, 0, kc)
        f.s = lerp(RIG_S, sEnd, kc)
        thr.width = lerp(0.12, HANDOFF_WIDTH / sEnd, kc)
        const dRel = lerp(rigD('thread'), 10 / sEnd, kc)
        rigPose(P1, f, dRel, RIG_VIEW.thread.pol)
        copy(P2, cam)
        divePose(cam, P2, P1, smootherstep(0, 0.16, pe))
        if (kc > 0) {
          // once curling, the camera is locked to the rig frame
          rigPose(cam, f, dRel, RIG_VIEW.thread.pol)
        }
        if (pe >= 0.54) set(cam, 0, 0, 0, 10, Math.PI / 2, 0)
        shift = [lerp(shift[0], 0, smoothstep(0, 0.2, pe)), lerp(shift[1], 0, smoothstep(0, 0.2, pe))]
        S.focus = Math.max(S.focus, smoothstep(0.0, 0.07, pe))
        S.focusTip = 1
        S.mapDim = 1 - 0.88 * S.focus
        S.pinOp = 0
        S.interactive = false
      }
      break
    }
  }

  // Aha: the IIA resident hands over to the rig thread (and back)
  if (thr.vis > 0) S.res[1].op *= 1 - thr.vis
  if (wal.vis > 0) S.res[5].op *= 1 - wal.vis
  if (ten.vis > 0) S.res[TIP_INDEX[ten.theory]].op *= 1 - ten.vis

  // phones: the pinned line shares the top band with the big caption, Beat 6's title block and (in the Lab,
  // where the hint pill also needs that band) the M title; it yields to them
  if (S.portrait) S.pinOp *= (1 - thr.big) * (1 - S.mLabel * S.mapFade * Math.max(labW, smoothstep(0, 0.5, S.mTop)))
  S.shift[0] = shift[0]
  S.shift[1] = shift[1]
}
