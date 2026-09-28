import { clamp, damp, easeInOutCubic, lerp, range, smoothstep } from '@/core/math'
import type { FrameInfo } from '@/gl'
import { ceilY, demandL, STEPS, TITLE_P0, type StepId } from './model'
import { useKnowledge } from './store'
import { buildThread } from './gl/thread'
import { screenMask } from './gl/lines'

/*
 * The director: one timeline (scroll → stage values) computed once per frame, before anything
 * else in the scene. Everything the parts draw is a pure function of this state, so scrolling
 * backwards replays every beat in reverse and screenshots at a frozen clock are exact.
 *
 * v = scroll from the chapter top in viewports (progress × (total − 1)). Step `id` has local
 * progress p when v = vAt(id, p).
 */

const ORDER = Object.keys(STEPS) as StepId[]
const TOTAL = ORDER.reduce((a, k) => a + STEPS[k], 0)
const START: Record<string, number> = {}
{
  let acc = 0
  for (const k of ORDER) {
    START[k] = acc - 0.5
    acc += STEPS[k]
  }
}
export const vAt = (id: StepId, p: number) => START[id] + p * STEPS[id]

export interface Pose {
  az: number
  pol: number
  dist: number
  tx: number
  ty: number
  tz: number
}
const D = Math.PI / 180
const P = (az: number, pol: number, dist: number, t: [number, number, number]): Pose => ({ az: az * D, pol: pol * D, dist, tx: t[0], ty: t[1], tz: t[2] })

/** Camera poses (content pack § Global stage conventions; P_holo lifted for a readable disk). */
// Narrative poses frame the whole ledger (ground to ○ ring, and the axis ruler on the right) between
// the text column and the chapter rail, so the map's one rule is always on screen.
export const POSES = {
  H: P(0, 90, 10, [0, 0, 0]),
  ground0: P(6, 64, 20.5, [0.2, 1.9, 0.2]),
  ground1: P(-10, 64, 20.5, [0.2, 1.9, 0.2]),
  // closer on tier 1, turned so D6 · D7 · D8 separate on screen
  scaffold: P(-14, 64, 18.5, [0, 2.5, 0]),
  count: P(0, 84, 6.5, [0, 2.0, 3.6]),
  tier2: P(-6, 70, 21, [0, 2.9, 0.3]),
  holo: P(0, 66, 7.6, [0, 3.3, 3.6]),
  fog: P(-8, 68, 20, [0, 4.1, 0]),
  demand0: P(0, 66, 27, [0, 3.3, 0]),
  demand1: P(0, 78, 26, [0, 1.6, 0]),
  lab: P(15, 68, 22.5, [0, 2.7, 0]),
}

function lerpPose(a: Pose, b: Pose, t: number, out: Pose) {
  out.az = lerp(a.az, b.az, t)
  out.pol = lerp(a.pol, b.pol, t)
  out.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t))
  out.tx = lerp(a.tx, b.tx, t)
  out.ty = lerp(a.ty, b.ty, t)
  out.tz = lerp(a.tz, b.tz, t)
  return out
}

type Key<T> = { v: number; x: T }
const CAM: Key<Pose>[] = [
  { v: 0, x: POSES.H },
  { v: vAt('title', lerp(TITLE_P0, 1, 0.55)), x: POSES.ground0 },
  { v: vAt('ground', 0.05), x: POSES.ground0 },
  { v: vAt('ground', 1), x: POSES.ground1 },
  { v: vAt('scaffold', 0.2), x: POSES.ground1 },
  { v: vAt('scaffold', 0.85), x: POSES.scaffold },
  { v: vAt('count', 0.0), x: POSES.scaffold },
  { v: vAt('count', 0.13), x: POSES.count },
  { v: vAt('count', 0.9), x: POSES.count },
  { v: vAt('hologram', 0.1), x: POSES.tier2 },
  { v: vAt('hologram', 0.2), x: POSES.tier2 },
  { v: vAt('hologram', 0.32), x: POSES.holo },
  { v: vAt('hologram', 0.88), x: POSES.holo },
  { v: vAt('fog', 0.24), x: POSES.fog },
  { v: vAt('demand', 0.0), x: POSES.fog },
  { v: vAt('demand', 0.1), x: POSES.demand0 },
]
// after demand p 0.1 the camera follows the ceiling (see compute), then P_demand end → P_lab
const CAM_LAB: Key<Pose>[] = [
  { v: vAt('lab', 0.0), x: POSES.demand1 },
  { v: vAt('lab', 0.14), x: POSES.lab },
]

function track<T>(keys: Key<T>[], v: number, mix: (a: T, b: T, t: number) => T): T {
  if (v <= keys[0].v) return mix(keys[0].x, keys[0].x, 0)
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (v < b.v) return mix(a.x, b.x, easeInOutCubic(clamp((v - a.v) / Math.max(1e-6, b.v - a.v))))
  }
  const l = keys[keys.length - 1]
  return mix(l.x, l.x, 0)
}
function trackN(keys: [number, number][], v: number) {
  if (v <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (v < b[0]) return lerp(a[1], b[1], easeInOutCubic(clamp((v - a[0]) / Math.max(1e-6, b[0] - a[0]))))
  }
  return keys[keys.length - 1][1]
}

// desktop horizontal view shift (fractions of the viewport; 0 at progress 0 and 1)
const SHIFT_X: [number, number][] = [
  [0, 0],
  [vAt('title', lerp(TITLE_P0, 1, 0.5)), 0.12],
  [vAt('ground', 1), 0.12],
  [vAt('scaffold', 0.85), 0.09],
  [vAt('count', 0.05), 0.12],
  [vAt('count', 0.15), 0.13],
  [vAt('count', 0.9), 0.13],
  [vAt('hologram', 0.12), 0.12],
  [vAt('hologram', 0.2), 0.12],
  [vAt('hologram', 0.32), 0.1],
  [vAt('hologram', 0.9), 0.1],
  [vAt('fog', 0.2), 0.14],
  [vAt('demand', 0.1), 0.14],
  [vAt('demand', 0.72), 0.13],
  // the aha frame: the text column has gone, the figure centres
  [vAt('demand', 0.92), 0.05],
  [vAt('lab', 0.0), 0.05],
  [vAt('lab', 0.14), -0.1],
  [vAt('unseen', 0.0), -0.1],
  [vAt('unseen', 0.3), 0.18],
  [vAt('pluck', 0.02), 0.18],
  [vAt('pluck', 0.38), 0],
]
const SHIFT_Y_DESK: [number, number][] = [
  [0, 0],
  [vAt('count', 0.0), 0],
  [vAt('count', 0.13), 0.07],
  [vAt('count', 0.9), 0.07],
  [vAt('hologram', 0.1), 0],
  [vAt('hologram', 0.2), 0],
  [vAt('hologram', 0.32), 0.03],
  [vAt('hologram', 0.88), 0.03],
  [vAt('fog', 0.2), 0],
  [vAt('demand', 0.72), 0],
  // lift the ground so the readouts sit beneath it, not on it
  [vAt('demand', 0.92), 0.08],
  [vAt('lab', 0.0), 0.08],
  [vAt('lab', 0.14), 0.03],
  [vAt('unseen', 0.0), 0.03],
  [vAt('unseen', 0.3), 0],
]
// portrait phones: lift the subject into the upper part of the screen instead
const SHIFT_Y: [number, number][] = [
  [0, 0],
  [vAt('title', lerp(TITLE_P0, 1, 0.5)), 0.22],
  [vAt('count', 0.02), 0.22],
  [vAt('count', 0.13), 0.31],
  [vAt('count', 0.9), 0.31],
  [vAt('hologram', 0.12), 0.22],
  [vAt('hologram', 0.2), 0.22],
  [vAt('hologram', 0.32), 0.28],
  [vAt('hologram', 0.88), 0.28],
  [vAt('fog', 0.2), 0.22],
  [vAt('lab', 0.0), 0.22],
  [vAt('lab', 0.14), 0.26],
  [vAt('unseen', 0.25), 0.24],
  [vAt('unseen', 0.85), 0.2],
  [vAt('pluck', 0.02), 0.2],
  [vAt('pluck', 0.38), 0.12],
  [vAt('rest', 0.05), 0.12],
  [vAt('rest', 0.42), 0],
]

export class Stage {
  // viewport
  W = 1
  H = 1
  /** visible width: phones can report a layout viewport wider than the screen (shared-code issue) */
  vw = 1
  aspect = 1
  mobile = false
  v = 0
  presence = 0
  t = 0
  dt = 0
  // step progress
  sp: Record<StepId, number> = Object.fromEntries(ORDER.map((k) => [k, 0])) as Record<StepId, number>
  open = 0
  // camera
  pose: Pose = { ...POSES.H }
  shiftX = 0
  shiftY = 0
  interactive = false
  safeLeft = 0
  safeBottom = 0
  safeRight = 0
  /** right edge (px) of the narrative column, measured by the Scene (0 = unknown) */
  textRight = 0
  // map
  mapK = 0
  mapScale = 1
  mapVis = 1
  groundReveal = 0
  point0 = 1
  atlasDim = 1
  threadDim = 1
  growth = 0
  growing = 0
  anchors = 0
  struts = 0
  rings = [0, 0, 0]
  axis = 0
  /** 0: the axis ruler stands on the map's right (narrative); 1: on its left (the lab) */
  axisSide = 0
  /** tier-2 / tier-3 nodes exist (struts and links may point at them) */
  tier2In = 0
  tier3In = 0
  tag = 0
  cracks = 0
  crackLabels = 0
  L = 3
  yc = 99
  ceilOn = 0
  ceilDisc = 0
  fog = 0
  terrain = 0
  rivals = 0
  focus = [0, 0, 0, 0]
  labelsAll = 0
  t0Label = 0
  d6 = 0
  neq = 0
  links = 0
  // dioramas
  cnt = { on: 0, grow: 0, N: 0, coupling: 0, sphere: 0, compare: 0, fold: 0, phase: 0 }
  holo = { on: 0, grow: 0, r: 0.85, ann: 0, labels: 0 }
  leader = 0
  // demand
  readouts = 0
  rim = 0
  // epilogue
  e1 = 0
  point = 0
  arrows = 0
  unfold = 0
  pluckable = false
  caption = 0
  rest = 0
  // lab focus (camera eases toward a judged node)
  focusX = 0
  focusY = 2.6
  focusZ = 0
  focusW = 0
  focusTarget: [number, number, number] | null = null

  private ycInit = false

  compute(f: FrameInfo, W: number, H: number) {
    const h = f.h
    this.W = W
    this.H = H
    this.aspect = W / Math.max(1, H)
    this.mobile = this.aspect < 0.8
    this.vw = this.mobile ? Math.min(W, window.visualViewport?.width ?? W) : W
    this.presence = f.presence
    this.t = f.t
    this.dt = f.dt
    const sp = this.sp
    for (const k of ORDER) sp[k] = h.step(k)
    const prog = f.progress
    const v = (this.v = prog * (TOTAL - 1))
    const open = (this.open = prog <= 0 ? 0 : range(sp.title, TITLE_P0, 0.96))

    // ── opening: H0 → the ground ──
    this.groundReveal = easeInOutCubic(range(open, 0.04, 0.5))
    this.point0 = 1 - smoothstep(0.24, 0.4, open)
    this.rings[0] = range(open, 0.6, 0.78)
    this.rings[1] = range(open, 0.66, 0.84)
    this.rings[2] = range(open, 0.72, 0.9)
    this.axis = range(open, 0.62, 0.95)
    this.tag = smoothstep(0.7, 0.95, open) * (1 - smoothstep(0.1, 0.3, sp.unseen))

    // ── Beat 1: cracks ──
    this.cracks = easeInOutCubic(range(sp.ground, 0.5, 0.9))
    this.crackLabels = smoothstep(0.6, 0.85, sp.ground)

    // ── Beat 2: anchors, the Thread grows through tier 1 ──
    this.anchors = easeInOutCubic(range(sp.scaffold, 0.0, 0.25))
    // the anchors' lesson belongs to the beat's opening; it makes room for the ◑ labels as they pop
    this.t0Label = smoothstep(0.08, 0.22, sp.scaffold) * (1 - smoothstep(0.5, 0.64, sp.scaffold))
    const gD8 = GROWTH.D8
    const gC3 = GROWTH.C3
    let g = 0
    let growing = 0
    if (sp.scaffold > 0.2) {
      const k = range(sp.scaffold, 0.2, 0.85)
      g = lerp(0, gD8, k)
      growing = k > 0 && k < 1 ? 1 : 0
    }
    if (sp.hologram > 0) {
      const k = range(sp.hologram, 0.02, 0.2)
      g = lerp(gD8, gC3, k)
      growing = k > 0 && k < 1 ? 1 : 0
    }
    if (sp.fog > 0) {
      const k = range(sp.fog, 0.06, 0.6)
      g = lerp(gC3, 1, k)
      growing = k > 0 && k < 1 ? 1 : 0
    }
    if (sp.demand > 0 || sp.lab > 0 || sp.unseen > 0) g = 1
    this.growth = g
    this.growing = growing
    this.struts = smoothstep(0.35, 0.8, sp.scaffold)
    const late = sp.demand > 0 || sp.lab > 0 || sp.unseen > 0
    this.tier2In = late ? 1 : range(g, GROWTH.C1 - 0.01, GROWTH.C3 + 0.01)
    this.tier3In = late ? 1 : smoothstep(0.22, 0.32, sp.fog)
    // back to the right as the lab ends: the narrative column returns on the left
    this.axisSide = smoothstep(0.03, 0.12, sp.lab) * (1 - smoothstep(0.9, 0.98, sp.lab))
    this.links = smoothstep(0.5, 0.85, sp.scaffold)
    this.d6 = smoothstep(0.55, 0.75, sp.scaffold)

    // ── Beat 3 / 4: dioramas ──
    // Beat 3 phases (the text stays pinned until p ≈ 0.74): A count 0.10–0.33 · B coupling 0.33–0.54 · C compare 0.54+
    const cIn = range(sp.count, 0.0, 0.08)
    const cOut = 1 - range(sp.hologram, 0.0, 0.1)
    const cnt = this.cnt
    cnt.on = sp.count > 0 && sp.hologram < 0.1 ? 1 : 0
    cnt.grow = easeInOutCubic(cIn) * easeInOutCubic(cOut)
    cnt.N = Math.round(30 * smoothstep(0.1, 0.3, sp.count))
    cnt.coupling = range(sp.count, 0.34, 0.52)
    cnt.sphere = easeInOutCubic(range(sp.count, 0.35, 0.52))
    cnt.compare = smoothstep(0.54, 0.6, sp.count)
    cnt.phase = sp.count <= 0 || sp.count >= 1 ? 0 : sp.count < 0.33 ? 1 : sp.count < 0.54 ? 2 : 3
    this.leader = smoothstep(0.0, 0.06, sp.count) * (1 - smoothstep(0.9, 1, sp.count))
    this.neq = smoothstep(0.58, 0.68, sp.count) * (1 - smoothstep(0.02, 0.12, sp.hologram))
    // Beat 4: the text stays pinned until p ≈ 0.71; the loop sinks 0.22 → 0.62, notes from 0.55
    const hIn = range(sp.hologram, 0.2, 0.3)
    const hOut = 1 - range(sp.hologram, 0.9, 0.99)
    const holo = this.holo
    holo.on = sp.hologram > 0.18 && sp.fog < 0.1 ? 1 : 0
    holo.grow = easeInOutCubic(hIn) * easeInOutCubic(hOut)
    holo.r = lerp(0.85, 0.1, easeInOutCubic(range(sp.hologram, 0.24, 0.62)))
    holo.ann = smoothstep(0.52, 0.6, sp.hologram) * hOut
    holo.labels = smoothstep(0.26, 0.36, sp.hologram) * hOut
    const dio = Math.max(cnt.grow, holo.grow)
    this.atlasDim = lerp(1, 0.13, dio)
    // gone behind the close-ups: a warm ring around the black-hole diorama would read as an accretion disk
    this.threadDim = lerp(1, 0, smoothstep(0, 0.6, dio))

    // ── Beat 5: fog ──
    this.fog = smoothstep(0.0, 0.3, sp.fog)
    this.terrain = smoothstep(0.3, 0.55, sp.fog)
    this.rivals = smoothstep(0.45, 0.7, sp.fog)

    // ── tier focus for labels ──
    const inGround = smoothstep(0.02, 0.12, sp.ground) * (1 - smoothstep(0.9, 1.0, sp.ground))
    const inScaffold = smoothstep(0.05, 0.2, sp.scaffold) * (1 - smoothstep(0.92, 1.0, sp.scaffold))
    const inTier2 = smoothstep(0.02, 0.1, sp.hologram) * (1 - smoothstep(0.22, 0.3, sp.hologram))
    const inFog = smoothstep(0.05, 0.2, sp.fog) * (1 - smoothstep(0.9, 1.0, sp.fog))
    this.focus[0] = inGround
    this.focus[1] = inScaffold
    this.focus[2] = inTier2
    this.focus[3] = inFog
    const st = useKnowledge.getState()
    const inLab = smoothstep(0.1, 0.2, sp.lab) * (1 - smoothstep(0.93, 1.0, sp.lab))
    this.labelsAll = st.labels ? inLab : 0

    // ── Beat 6 + Lab + E1: the evidence ceiling ──
    let L = 3
    let ceilOn = 0
    if (sp.demand > 0) {
      L = demandL(sp.demand)
      ceilOn = 1
    }
    if (sp.lab > 0) {
      L = st.ceiling
      ceilOn = 1
    }
    if (sp.unseen > 0) {
      L = lerp(st.ceiling, 3, easeInOutCubic(range(sp.unseen, 0.0, 0.28)))
      ceilOn = 1 - smoothstep(0.12, 0.3, sp.unseen)
    }
    this.L = L
    this.ceilOn = ceilOn
    const target = ceilY(L)
    if (!this.ycInit || f.dt === 0 || st.dragging) {
      this.yc = target
      this.ycInit = true
    } else this.yc = damp(this.yc, target, 4, f.dt)
    this.ceilDisc = smoothstep(0.0, 0.1, sp.demand) * ceilOn
    this.rim = this.ceilDisc
    this.readouts = smoothstep(0.86, 0.95, sp.demand) * (1 - smoothstep(0.0, 0.08, sp.lab))

    // ── E1: the map shrinks to one point ──
    const k1 = easeInOutCubic(range(sp.unseen, 0.3, 0.92))
    this.mapK = k1
    this.mapScale = Math.exp(lerp(0, Math.log(0.0016), k1))
    this.mapVis = 1 - smoothstep(0.84, 0.97, k1)
    this.e1 = smoothstep(0.88, 0.98, k1) * (1 - smoothstep(0.02, 0.15, sp.verdict))
    this.point = smoothstep(0.8, 0.95, k1) * (sp.pluck > 0 ? 1 - smoothstep(0.1, 0.3, sp.pluck) : 1)

    // ── E2, E3, rest ──
    this.arrows = easeInOutCubic(range(sp.verdict, 0.06, 0.45)) * (1 - smoothstep(0.02, 0.14, sp.pluck))
    this.unfold = easeInOutCubic(range(sp.pluck, 0.04, 0.34))
    this.pluckable = sp.pluck > 0.3
    this.rest = sp.rest

    // ── camera ──
    const pose = this.pose
    if (v < vAt('demand', 0.1)) track(CAM, v, (a, b, t) => lerpPose(a, b, t, pose))
    else if (v < vAt('lab', 0)) {
      const k = (3 - L) / 3
      lerpPose(POSES.demand0, POSES.demand1, k, pose)
    } else if (v < vAt('unseen', 0.3)) track(CAM_LAB, v, (a, b, t) => lerpPose(a, b, t, pose))
    else lerpPose(POSES.lab, POSES.H, k1, pose)
    // lab: ease toward a judged node (damped)
    const want = sp.lab > 0.12 && sp.lab < 0.97 && this.focusTarget ? 1 : 0
    if (this.focusTarget) {
      this.focusX = damp(this.focusX, this.focusTarget[0], 2.2, f.dt || 1)
      this.focusY = damp(this.focusY, this.focusTarget[1], 2.2, f.dt || 1)
      this.focusZ = damp(this.focusZ, this.focusTarget[2], 2.2, f.dt || 1)
    }
    this.focusW = f.dt === 0 ? want : damp(this.focusW, want, 1.6, f.dt)
    if (this.focusW > 0.001) {
      const w = 0.45 * this.focusW
      pose.tx = lerp(pose.tx, this.focusX, w)
      pose.ty = lerp(pose.ty, this.focusY, w)
      pose.tz = lerp(pose.tz, this.focusZ, w)
      pose.dist = lerp(pose.dist, pose.dist * 0.8, this.focusW)
    }
    // portrait phones: pull back so the map's width fits
    if (this.mobile && k1 < 1) {
      const fit = Math.max(1, Math.pow(1.25 / this.aspect, 0.8))
      const dioF = Math.max(cnt.grow, holo.grow)
      // ramp the portrait fit in with the opening crane only: progress 0 stays exactly at H0's distance
      const fitIn = smoothstep(0, 0.6, open)
      pose.dist *= lerp(1, lerp(lerp(fit, 1, k1), Math.max(1, fit * 0.72), dioF), fitIn)
    }
    this.interactive = sp.lab > 0.1 && sp.lab < 0.96

    // ── composition ──
    if (this.mobile) {
      this.shiftX = 0
      this.shiftY = prog >= 1 ? 0 : trackN(SHIFT_Y, v)
      this.safeLeft = 0
      this.safeBottom = H * 0.52
      this.safeRight = 0
    } else {
      this.shiftX = prog >= 1 ? 0 : trackN(SHIFT_X, v)
      // lift the dioramas a little so their readouts sit clear of the frame's bottom
      this.shiftY = prog >= 1 ? 0 : trackN(SHIFT_Y_DESK, v)
      // the narrative column (left steps): labels fade out from under it
      const textOn = sp.lab > 0.05 && sp.lab < 0.97 ? 0 : 1
      const colRight = this.textRight > 0 ? this.textRight : Math.min(W * 0.36, 490)
      this.safeLeft = textOn ? Math.min(W * 0.4, colRight + 36) : 0
      this.safeBottom = 0
      this.safeRight = sp.lab > 0.05 && sp.lab < 0.97 ? W - 420 : 0
    }
    screenMask.x = this.mobile || sp.pluck > 0 ? 0 : this.safeLeft
  }
}

/** The map's Thread geometry, built once; GROWTH = arc fraction of each on-thread claim. */
export const THREAD = buildThread()
export const GROWTH: Record<string, number> = THREAD.g
