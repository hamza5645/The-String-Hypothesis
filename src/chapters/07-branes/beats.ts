import { clamp, easeInOutCubic, easeOutCubic, lerp, range, smoothstep, window01 } from '@/core/math'
import { arc, callout, endMark, inkDot, loop, LOOP_N, OPEN_N, PTS, stretch, tag, type Frame } from './frame'
import { FIELD, INK, INK2 } from './gfx'
import { fold, loopCrossings, masslessCount, stacksOf, symmetryLabel, wobble, type Stack } from './model'
import { endXZ, PAINT_TAU } from './paint'

/*
 * The story beats (content/07-branes.md § Storyboard). Each function draws one step from its local
 * progress u ∈ [0, 1] and the stage clock. Adjacent beats agree exactly at their shared boundary, so the
 * scene is continuous when scrubbing across steps. World units = ℓ_s; the transverse axis is y.
 */

const D2R = Math.PI / 180
export const STR_W = 0.052

/** Camera pose. On phones the distance is multiplied by `mob` (portrait frames are narrow). */
export function cam(f: Frame, azDeg: number, pitchDeg: number, dist: number, tx = 0, ty = 0, tz = 0, mob = 1.5) {
  f.cam.az = azDeg * D2R
  f.cam.pol = clamp((90 - pitchDeg) * D2R, 0.012, Math.PI - 0.05)
  f.cam.dist = dist * (f.mobile ? mob : 1)
  f.cam.tx = tx
  f.cam.ty = ty
  f.cam.tz = tz
}

/** Compose the subject beside the text: right of the column on desktop, above it on phones. */
export function compose(f: Frame, k: number, sx = 0.16, sy = 0.15) {
  f.shift[0] = f.mobile ? 0 : sx * k
  f.shift[1] = f.mobile ? sy * k : 0
  // keep the sheets quiet behind the narrative column
  if (f.mobile) {
    f.fade.axis = 1
    f.fade.from = 0.3 * f.H
    f.fade.to = 0.5 * f.H
  } else {
    f.fade.axis = 0
    f.fade.from = 0.33 * f.W
    f.fade.to = 0.52 * f.W
  }
  f.fade.amount = 0.92 * k
  // a right-edge vignette keeps the chapter rail's column quiet (desktop): strings and sheets are gone by 0.9 W
  f.fade.edge = f.mobile ? 0 : k
}

const J = { x: 0, y: 0, z: 0 }
const E0 = { x: 0, y: 0, z: 0 }
const E1 = { x: 0, y: 0, z: 0 }

/** Small real-time jiggle of a walking end (keeps the ends alive between scroll ticks). */
function jiggle(k: number, t: number, a: number) {
  J.x = a * wobble(1.7 * t, 20 + k * 3)
  J.y = a * wobble(1.5 * t, 23 + k * 3)
  J.z = a * wobble(1.9 * t, 26 + k * 3)
  return J
}

/** Canonical rest pose of the string at the end of Beat 1 / start of Beat 2 (end-to-end 1.6, apex 0.4). */
/** Where the H2 loop waits in the bulk after the Opening (upper right of the subject). */
export const LOOP_REST = [1.45, 1.2, -1.8] as const
/** phones: the loop waits above the subject, clear of the pinned note */
export const LOOP_REST_M = [0.75, 1.15, -2.2] as const
const OPEN_YAW = 12
/** Opening / Beat 1 view shift: the lone string sits a little nearer the centre, clear of the chapter rail */
const OPEN_SX = 0.1
/** phones: camera distance multiplier while a single string / sheet is framed */
const MOB_RULE = 1.8
/** where the "D-brane" label sits on the sheet (front edge, right of centre) */
const DBR = [1.4, 0, 3.4] as const
const REST_A = [-0.8, 0, 0] as const
const REST_B = [0.8, 0, 0] as const

/* ═══════════════════════════ Opening (title + open) ═══════════════════════════ */

export function opening(f: Frame, o: number) {
  const t = f.t
  const e1 = smoothstep(0, 0.35, o)
  const damp = easeOutCubic(range(o, 0.7, 1))
  const turn = smoothstep(0.35, 1, o)
  cam(f, OPEN_YAW * turn, 10 * turn, lerp(10, 8, e1), 0, 0, 0, lerp(1, MOB_RULE, e1))
  compose(f, smoothstep(0.02, 0.32, o), OPEN_SX)
  f.fade.amount = 0

  // the H2 loop drifts to the upper right, keeps its wobble: it returns as the bulk-roaming closed string
  f.loop.x = lerp(0, f.mobile ? LOOP_REST_M[0] : LOOP_REST[0], e1)
  f.loop.y = lerp(0, f.mobile ? LOOP_REST_M[1] : LOOP_REST[1], e1)
  f.loop.z = lerp(0, LOOP_REST[2], e1)
  f.loop.s = lerp(1, 0.45, e1)
  f.loop.op = lerp(1, 0.5, e1)
  f.loop.w = 1

  // a free-ended open string (H1 shape, 2 units, amplitude 0.12) fades in at centre
  const alpha = smoothstep(0.08, 0.34, o)
  if (alpha <= 0) return
  const tau = -4 + 4 * range(o, 0.35, 1)
  const walk = smoothstep(0.33, 0.48, o)
  const jig = 0.1 * walk
  endXZ(0, tau, E0)
  endXZ(1, tau, E1)
  const ya = walk * E0.y * (1 - damp)
  const yb = walk * E1.y * (1 - damp)
  const j0 = jiggle(0, t, jig)
  const ax = lerp(-1, E0.x, walk) + j0.x
  const ay = ya + j0.y * (1 - damp)
  const az = lerp(0, E0.z, walk) + j0.z
  const j1 = jiggle(1, t, jig)
  const bx = lerp(1, E1.x, walk) + j1.x
  const by = yb + j1.y * (1 - damp)
  const bz = lerp(0, E1.z, walk) + j1.z
  openShape(ax, ay, az, bx, by, bz, damp, t)
  f.str.add(PTS, OPEN_N, false, STR_W, alpha)
  // the free (Neumann) mode moves the ends too: beads, tags and traces sit on the string's real ends
  readEnds()

  // the two ends brighten and get tags; traces show where they wandered (in x, y and z alike)
  const endGlow = alpha * (0.35 + 0.75 * smoothstep(0.35, 0.5, o))
  endMark(f, ENDS[0], ENDS[1], ENDS[2], endGlow, false)
  endMark(f, ENDS[3], ENDS[4], ENDS[5], endGlow, false)
  const tagO = window01(o, 0.36, 1.2, 0.08)
  tag(f, 'endA', ENDS[0], ENDS[1] + 0.06, ENDS[2], tagO)
  tag(f, 'endB', ENDS[3], ENDS[4] + 0.06, ENDS[5], tagO)
  const trO = smoothstep(0.36, 0.5, o)
  if (trO > 0) trace(f, tau, damp, t, jig, 2.6, 26, 0.5 * trO, 1, ENDS)

  // axis triad (x, y, z · 1.5 units), lower left of the subject
  const triO = smoothstep(0.38, 0.55, o)
  triad(f, triO)
  f.hud.show('pin:scale', window01(o, 0.45, 1.4, 0.1))
}

/** The string's two real endpoints (xyz, xyz), read back from PTS after a shape is written. */
const ENDS = new Float32Array(6)
function readEnds() {
  const b = (OPEN_N - 1) * 3
  ENDS[0] = PTS[0]
  ENDS[1] = PTS[1]
  ENDS[2] = PTS[2]
  ENDS[3] = PTS[b]
  ENDS[4] = PTS[b + 1]
  ENDS[5] = PTS[b + 2]
}

/** Free (Neumann) modes blend into the pinned (Dirichlet) fundamental as `damp` → 1. */
function openShape(ax: number, ay: number, az: number, bx: number, by: number, bz: number, damp: number, t: number, lift = 0, liftW = 0) {
  const om = 2.2
  for (let i = 0; i < OPEN_N; i++) {
    const s = i / (OPEN_N - 1)
    const free = 0.12 * (0.8 * Math.cos(Math.PI * s) * Math.cos(om * t) + 0.45 * Math.cos(2 * Math.PI * s) * Math.cos(2 * om * t + 0.6))
    const pinned = 0.25 * Math.sin(Math.PI * s) * Math.sin(2.6 * t)
    const vy = lerp(free, pinned, damp)
    const vz = 0.12 * 0.35 * Math.cos(Math.PI * s) * Math.sin(om * t) * (1 - damp)
    // optional arch (quadratic lift) for the settle into Beat 2's rest arc
    const arch = 4 * s * (1 - s) * lift
    PTS[i * 3] = ax + (bx - ax) * s
    PTS[i * 3 + 1] = ay + (by - ay) * s + vy * (1 - liftW) + arch + 0.04 * Math.sin(Math.PI * s) * Math.sin(2.6 * t) * liftW
    PTS[i * 3 + 2] = az + (bz - az) * s + vz
  }
}

/**
 * Fading traces of both walking ends, over the last `span` of walk time. `ends` (the beads' real positions)
 * pins each trace's newest point to its bead; the offset fades out along the trace, into the walk's history.
 */
const TP = { x: 0, y: 0, z: 0 }
function trace(f: Frame, tau: number, damp: number, t: number, jig: number, span: number, n: number, a: number, yk: number, ends?: Float32Array) {
  const P = TP
  for (let k = 0; k < 2; k++) {
    let px = 0
    let py = 0
    let pz = 0
    let ox = 0
    let oy = 0
    let oz = 0
    for (let i = 0; i <= n; i++) {
      const q = i / n
      const tt = tau - span * q
      endXZ(k, tt, P)
      const j = jiggle(k, t - 1.4 * q, jig)
      let x = P.x + j.x
      let y = (P.y * yk + j.y) * (1 - damp)
      let z = P.z + j.z
      if (ends) {
        if (i === 0) {
          ox = ends[k * 3] - x
          oy = ends[k * 3 + 1] - y
          oz = ends[k * 3 + 2] - z
        }
        const w = 1 - smoothstep(0, 0.35, q)
        x += ox * w
        y += oy * w
        z += oz * w
      }
      if (i > 0) f.hair.seg(px, py, pz, x, y, z, FIELD, a * (1 - (q - 1 / n)), a * (1 - q))
      px = x
      py = y
      pz = z
    }
  }
}

function triad(f: Frame, o: number) {
  if (o <= 0.01 || f.mobile) return
  const x0 = -1.75
  const y0 = -1.0
  const z0 = 0.7
  const L = 1
  const a = 0.36 * o
  const tk = 0.05
  f.hair.seg(x0, y0, z0, x0 + L, y0, z0, FIELD, a)
  f.hair.head(x0, y0, z0, x0 + L, y0, z0, FIELD, a, 0.07)
  f.hair.seg(x0, y0, z0, x0, y0 + L, z0, FIELD, a)
  f.hair.head(x0, y0, z0, x0, y0 + L, z0, FIELD, a, 0.07, 0, 0, 1)
  f.hair.seg(x0, y0, z0, x0, y0, z0 + L, FIELD, a)
  f.hair.head(x0, y0, z0, x0, y0, z0 + L, FIELD, a, 0.07)
  // 0.5 ℓ_s ticks: the axes double as a scale key
  for (let q = 0.5; q < L - 0.1; q += 0.5) {
    f.hair.seg(x0 + q, y0, z0, x0 + q, y0 + tk, z0, FIELD, a)
    f.hair.seg(x0, y0 + q, z0, x0 + tk, y0 + q, z0, FIELD, a)
    f.hair.seg(x0, y0, z0 + q, x0, y0 + tk, z0 + q, FIELD, a)
  }
  tag(f, 'ax', x0 + L + 0.06, y0, z0, o)
  tag(f, 'ay', x0, y0 + L + 0.06, z0, o)
  tag(f, 'az', x0, y0, z0 + L + 0.08, o)
}

/* ═══════════════════════════ Beat 1 · A rule at each end ═══════════════════════════ */

export function rule(f: Frame, u: number) {
  const t = f.t
  const tau = PAINT_TAU * range(u, 0.25, 0.7)
  const settle = smoothstep(0.72, 0.96, u)
  const complete = smoothstep(0.7, 0.9, u)
  cam(f, lerp(OPEN_YAW, 18, smoothstep(0.3, 0.95, u)), lerp(10, 28, smoothstep(0.25, 0.72, u)), lerp(8, 12.5, smoothstep(0.28, 0.9, u)), 0, 0, 0, MOB_RULE)
  // the Opening's composition, centred a little more while the callouts (which extend right) are up, then
  // easing to Beat 2's framing by the end of the step
  compose(f, 1, lerp(lerp(OPEN_SX, 0.16, smoothstep(0.72, 0.96, u)), 0.09, window01(u, 0.0, 0.42, 0.1)))
  f.fade.amount *= smoothstep(0.2, 0.4, u)

  // the loop from the Opening drifts off into the bulk (it returns in Beat 3) as the rule takes over
  const away = smoothstep(0, 0.2, u)
  f.loop.x = (f.mobile ? LOOP_REST_M[0] : LOOP_REST[0]) + 0.5 * away
  f.loop.y = (f.mobile ? LOOP_REST_M[1] : LOOP_REST[1]) + 0.6 * away
  f.loop.z = LOOP_REST[2] - 1.5 * away
  f.loop.s = 0.45
  f.loop.op = 0.5 * (1 - smoothstep(0.0, 0.16, u))
  f.loop.w = 1

  // the brane: painted in by where the ends have been, then completed
  const b = f.br[0]
  b.op = 1
  b.paintOn = true
  b.paintTau = tau / PAINT_TAU
  b.complete = complete
  b.edge = 0.4 * smoothstep(0.74, 0.92, u)
  b.fresnel = 0
  b.fill = lerp(0.006, 0.018, complete)

  // ends: y is pinned (damp = 1); x, z wander, widening from 0.6 to 3 ℓ_s
  const jig = 0.1 * (1 - settle)
  endXZ(0, tau, E0)
  endXZ(1, tau, E1)
  const j0 = jiggle(0, t, jig)
  const j1 = jiggle(1, t, jig)
  const ax = lerp(E0.x + j0.x, REST_A[0], settle)
  const az = lerp(E0.z + j0.z, REST_A[2], settle)
  const bx = lerp(E1.x + j1.x, REST_B[0], settle)
  const bz = lerp(E1.z + j1.z, REST_B[2], settle)
  openShape(ax, 0, az, bx, 0, bz, 1, t, 0.4 * settle, settle)
  f.str.add(PTS, OPEN_N, false, STR_W, 1)
  readEnds()
  const ring = smoothstep(0.02, 0.12, u)
  endMark(f, ax, 0, az, 1.1, ring > 0.01)
  endMark(f, bx, 0, bz, 1.1, ring > 0.01)
  tag(f, 'endA', ax, 0, az, 1 - smoothstep(0, 0.1, u))
  tag(f, 'endB', bx, 0, bz, 1 - smoothstep(0, 0.1, u))
  triad(f, 1 - smoothstep(0, 0.14, u))
  f.hud.show('pin:scale', 1 - smoothstep(0.02, 0.12, u))

  // clamp glyphs: two short Field ticks just above and below each bead (pinned in y)
  const cl = window01(u, 0.03, 0.78, 0.08)
  clamp2(f, ax, az, cl)
  clamp2(f, bx, bz, cl)

  // three callouts on one end (the right one: the free side of the frame, away from the text column)
  const co = window01(u, 0.04, 0.36, 0.08)
  if (co > 0) {
    const a = 0.6 * co
    const L = 0.55
    f.hair.seg(bx - L, 0, bz, bx + L, 0, bz, FIELD, a)
    f.hair.head(bx, 0, bz, bx - L, 0, bz, FIELD, a, 0.07, 0, 0, 1)
    f.hair.head(bx, 0, bz, bx + L, 0, bz, FIELD, a, 0.07, 0, 0, 1)
    f.hair.seg(bx, 0, bz - L, bx, 0, bz + L, FIELD, a)
    f.hair.head(bx, 0, bz, bx, 0, bz - L, FIELD, a, 0.07, 1, 0, 0)
    f.hair.head(bx, 0, bz, bx, 0, bz + L, FIELD, a, 0.07, 1, 0, 0)
    f.hair.seg(bx, 0.14, bz, bx, 0.7, bz, FIELD, 0.35 * co)
    if (f.mobile) {
      // phones: one stacked legend above the end instead of three labels fighting for a narrow frame
      tag(f, 'rulesM', bx, 0.74, bz, co)
    } else {
      tag(f, 'nx', bx + L + 0.05, 0, bz, co)
      tag(f, 'nz', bx, 0, bz + L + 0.08, co)
      tag(f, 'dy', bx, 0.74, bz, co)
    }
  }

  // the Opening's short traces fade out as the pinned-end trails take over
  const oldTr = 1 - smoothstep(0, 0.1, u)
  if (oldTr > 0.01) trace(f, tau, 1, t, jig, 2.6, 26, 0.5 * oldTr, 1, ENDS)
  // Field trails that persist, fading, over the last stretch of the walk
  const trO = window01(u, 0.24, 0.8, 0.06)
  if (trO > 0) trace(f, tau, 1, t, jig, 7, 70, 0.55 * trO, 0, ENDS)

  // the completed sheet
  const lab = smoothstep(0.74, 0.86, u)
  tag(f, 'dbrane', DBR[0], 0, f.mobile ? -3.8 : DBR[2], lab)
  f.hud.show('icons', smoothstep(0.76, 0.88, u))
  f.hud.show('pin:sheet', smoothstep(0.74, 0.86, u))
  f.hud.show('card:1989', smoothstep(0.8, 0.92, u))
}

function clamp2(f: Frame, x: number, z: number, o: number) {
  if (o <= 0.01) return
  const w = 0.1
  const a = 0.75 * o
  f.hair.seg(x - w, 0.1, z, x + w, 0.1, z, FIELD, a)
  f.hair.seg(x - w, -0.1, z, x + w, -0.1, z, FIELD, a)
  f.hair.seg(x - w, 0.1, z, x - w, 0.065, z, FIELD, a)
  f.hair.seg(x + w, 0.1, z, x + w, 0.065, z, FIELD, a)
  f.hair.seg(x - w, -0.1, z, x - w, -0.065, z, FIELD, a)
  f.hair.seg(x + w, -0.1, z, x + w, -0.065, z, FIELD, a)
}

/* ═══════════════════════════ shared casts ═══════════════════════════ */

/** Ten short open strings with both ends on brane 1 (Beat 2's riders → Beat 3's sliders → …). */
const RIDERS = [
  [-2.4, 1.3, 0.3],
  [-0.9, -2.1, 1.9],
  [2.7, -1.4, 2.6],
  [1.3, 2.5, 0.9],
  [-3.2, -1.1, 1.2],
  [3.1, 1.3, 2.2],
  [-1.7, 3.3, 0.1],
  [0.5, -3.5, 1.5],
  [2.6, -3.4, 2.9],
  [-3.3, 3.0, 0.6],
].map(([x, z, ang], k) => ({ x, z, ang, seed: 30 + k * 3.7, ph: k * 1.37 }))

export const rippleH = (x: number, z: number, t: number, r: number) =>
  0.08 * r * (Math.sin(1.45 * x + 0.42 * z - 1.5 * t) + Math.sin(-0.55 * x + 1.62 * z - 1.9 * t + 1.3) + Math.sin(-1.21 * x - 1.05 * z - 2.2 * t + 2.1))

const C = { x: 0, z: 0 }
const RE = new Float32Array(4)
const RIDER_X = 3.4
/** Endpoints (ax, az, bx, bz) of rider k at walk time t. */
export function riderEnds(k: number, D: number, len: number, t: number) {
  const r = RIDERS[k]
  // |x| ≤ 3.4 keeps the riders out of the chapter rail's column on the right (and off the text column's edge)
  const cx = fold(r.x + D * 1.3 * (wobble(0.33 * t, r.seed) - wobble(0, r.seed)), RIDER_X)
  const cz = fold(r.z + D * 1.3 * (wobble(0.33 * t, r.seed + 5) - wobble(0, r.seed + 5)), 4.4)
  const ang = r.ang + D * 0.8 * (wobble(0.2 * t, r.seed + 2) - wobble(0, r.seed + 2))
  const dx = (Math.cos(ang) * len) / 2
  const dz = (Math.sin(ang) * len) / 2
  RE[0] = cx - dx
  RE[1] = cz - dz
  RE[2] = cx + dx
  RE[3] = cz + dz
  return RE
}
/** Draw rider k. D = how much it slides (0 = parked), len, lift (apex), y base; returns its centre in C. */
export function rider(f: Frame, k: number, D: number, len: number, lift: number, yb: number, alpha: number, ripple = 0, clip = false) {
  const r = RIDERS[k]
  const e = riderEnds(k, D, len, f.tw)
  const ax = e[0]
  const az = e[1]
  const bx = e[2]
  const bz = e[3]
  const cx = (ax + bx) / 2
  const cz = (az + bz) / 2
  const ya = yb + (ripple ? rippleH(ax, az, f.t, ripple) : 0)
  const yc = yb + (ripple ? rippleH(bx, bz, f.t, ripple) : 0)
  C.x = cx
  C.z = cz
  if (alpha <= 0.003) return C
  // crest flash: brighter as a crest passes under it
  const hm = ripple ? rippleH(cx, cz, f.t, ripple) : 0
  const fl = 1 + 1.6 * smoothstep(0.05, 0.16, hm)
  arc(ax, ya, az, bx, yc, bz, lift, 0.025, f.t, r.ph)
  f.str.add(PTS, OPEN_N, false, STR_W * 0.9, alpha * fl, 0, clip)
  endMark(f, ax, ya, az, alpha * 0.85, true, 0.8)
  endMark(f, bx, yc, bz, alpha * 0.85, true, 0.8)
  return C
}

/** Six closed loops roaming the bulk (they pass through the brane). */
const LOOPS = [
  [-2.2, 1.6, 1.1, 0.42, 0.2],
  [1.8, -2.3, 1.7, 0.36, 1.3],
  [2.9, 2.2, 0.9, 0.5, 0.1],
  [-1.3, -2.8, 2.1, 0.33, 2.2],
  [0.3, 0.9, 1.3, 0.47, -0.15],
  [-3.4, -0.2, 1.9, 0.39, 2.9],
].map(([x, z, A, w, ph0], k) => ({ x, z, A, w, ph: -w * 2.5 + ph0, a0: k * 1.1, b0: 0.6 + k * 0.7, seed: 60 + k * 2.3 }))

const CROSS = new Float32Array(12)
/** the last bulkLoop's slice crossings: how many, and their midpoint */
const XING = { n: 0, x: 0, z: 0 }
/** Draw bulk loop k; returns its centre. dots = alpha of the slice crossings (Ink dots). */
export function bulkLoop(f: Frame, k: number, alpha: number, clip: boolean, dots: number, yRef = 0) {
  XING.n = 0
  const L = LOOPS[k]
  const t = f.tw
  const cx = L.x + 1.3 * wobble(0.16 * t, L.seed)
  const cz = L.z + 1.3 * wobble(0.16 * t, L.seed + 4)
  const cy = L.A * Math.sin(L.w * t + L.ph)
  loop(cx, cy, cz, 0.35, f.t, L.a0 + 0.4 * t, L.b0 + 0.27 * t)
  f.str.add(PTS, LOOP_N, true, STR_W * 0.9, alpha, 0, clip)
  if (dots > 0.01) {
    const n = loopCrossings(PTS, LOOP_N, yRef, CROSS)
    for (let i = 0; i < n; i++) {
      inkDot(f, CROSS[i * 3], yRef, CROSS[i * 3 + 2], 18, 0.22 * dots)
      inkDot(f, CROSS[i * 3], yRef, CROSS[i * 3 + 2], 7, dots)
    }
    if (n === 2) {
      XING.n = 2
      XING.x = (CROSS[0] + CROSS[3]) / 2
      XING.z = (CROSS[2] + CROSS[5]) / 2
    }
  }
  C.x = cx
  C.z = cz
  return { x: cx, y: cy, z: cz }
}

/** which bulk loop's slice crossing carries the label (sticky across frames) */
const XK = { k: -1 }

/* ═══════════════════════════ Beat 2 · Not a rule, a thing ═══════════════════════════ */

export function thing(f: Frame, u: number) {
  const t = f.t
  // camera: closer for the pluck, back out for the ripples, low to see both sides of the RR field
  const k1 = smoothstep(0, 0.12, u)
  const k2 = smoothstep(0.28, 0.4, u)
  const k3 = smoothstep(0.62, 0.8, u)
  let pitch = lerp(28, 30, k1)
  pitch = lerp(pitch, 26, k2)
  pitch = lerp(pitch, 12, k3)
  let dist = lerp(12.5, 8.6, k1)
  dist = lerp(dist, 11.5, k2)
  dist = lerp(dist, 11, k3)
  cam(f, lerp(18, 24, u), pitch, dist, 0, lerp(lerp(0, 0.25, k1), 0.1, k2), 0, lerp(MOB_RULE, 1.5, k1))
  compose(f, 1)

  const b = f.br[0]
  b.op = 1
  b.fresnel = 0.1

  // pluck: pull the midpoint to y = 1.2 over the first stretch, release into a decaying fundamental
  const pullIn = easeInOutCubic(range(u, 0.03, 0.1))
  const tr = range(u, 0.1, 0.32)
  let ym = lerp(0.4, 1.2, pullIn)
  if (u > 0.1) ym = 0.4 + 0.8 * Math.cos(2 * Math.PI * 3.2 * tr) * Math.exp(-3.4 * tr)
  const pull = ((ym - 0.4) / 0.8) * 1.2
  const dent = 0.12 * (pull / 1.2) * (1 - smoothstep(0.3, 0.36, u))
  b.dent0[0] = REST_A[0]
  b.dent0[1] = REST_A[2]
  b.dent0[2] = dent
  b.dent1[0] = REST_B[0]
  b.dent1[1] = REST_B[2]
  b.dent1[2] = dent
  const mainA = 1 - smoothstep(0.34, 0.42, u)
  if (mainA > 0) {
    // the ends ride the dented sheet
    arc(REST_A[0], dent, REST_A[2], REST_B[0], dent, REST_B[2], ym - dent, 0.04 * (1 - pullIn * (1 - tr)), t, 0)
    f.str.add(PTS, OPEN_N, false, STR_W, mainA * 1.05)
    endMark(f, REST_A[0], dent, REST_A[2], mainA * 1.1)
    endMark(f, REST_B[0], dent, REST_B[2], mainA * 1.1)
    // a hairline "pull" marker while pulling
    const pm = window01(u, 0.02, 0.14, 0.03)
    if (pm > 0) {
      f.hair.seg(0, 0.02, 0, 0, ym, 0, FIELD, 0.35 * pm)
      f.hair.head(0, 0.02, 0, 0, ym + 0.02, 0, FIELD, 0.5 * pm, 0.08, 0, 0, 1)
    }
  }
  tag(f, 'dbrane', DBR[0], 0, f.mobile ? -3.8 : DBR[2], 1 - smoothstep(0, 0.08, u))
  f.hud.show('icons', 1 - smoothstep(0, 0.08, u))
  f.hud.show('pin:sheet', 1 - smoothstep(0, 0.08, u))
  f.hud.show('card:1989', 1 - smoothstep(0, 0.08, u))
  f.hud.show('pin:recoil', window01(u, 0.2, 0.4, 0.05))

  // ripples: the whole brane as a sum of three plane waves; ten tiny open strings ride the crests
  const rip = window01(u, 0.3, 0.7, 0.08)
  b.ripple = rip
  const ra = smoothstep(0.3, 0.4, u)
  for (let k = 0; k < 10; k++) rider(f, k, 0, 0.4, 0.1, 0, ra * 0.9, rip)
  callout(f, 'ripple', -0.9, rippleH(-0.9, -2.1, t, rip) + 0.1, -2.1, 0, 1.25, 0, window01(u, 0.36, 0.66, 0.05))

  // RR charge: a lattice of hairlines rising on both sides, fading with distance
  const rr = smoothstep(0.66, 0.84, u)
  f.rr.op = rr
  f.rr.rise = rr
  f.rr.y = 0
  tag(f, 'rr', -3.6, 1.62, -1.2, smoothstep(0.72, 0.84, u))
  f.hud.show('pin:rr', smoothstep(0.7, 0.8, u))
  f.hud.show('card:sv', smoothstep(0.85, 0.93, u))
}

/* ═══════════════════════════ collision (Beats 3 and 6) ═══════════════════════════ */

export const COLL = { phase: 0, inX: 0, outX: 0, outZ: 0, loopX: 0, loopY: 0, loopZ: 0, ux: 0, uz: 0, flash: 0 }

/**
 * Two open strings in → one open string + one closed loop out. Momentum along the brane is conserved
 * (the pair leaves with equal and opposite along-brane velocities); momentum across it is absorbed by the brane.
 */
export function collision(f: Frame, c: number, yb: number, alpha: number, angDeg: number, loopUp = 1, drawLoop = true) {
  const ux = Math.cos(angDeg * D2R)
  const uz = Math.sin(angDeg * D2R)
  COLL.ux = ux
  COLL.uz = uz
  COLL.phase = c
  const t = f.t
  if (alpha <= 0.003) return COLL
  const LEN = 0.55
  if (c < 0.47) {
    const x = 0.3 + 2.7 * (1 - easeInOutCubic(range(c, 0, 0.45)))
    COLL.inX = x
    for (const s of [-1, 1]) {
      arc(s * x - LEN / 2, yb, 0, s * x + LEN / 2, yb, 0, 0.12, 0.02, t, s)
      f.str.add(PTS, OPEN_N, false, STR_W, alpha)
      endMark(f, s * x - LEN / 2, yb, 0, alpha * 0.9)
      endMark(f, s * x + LEN / 2, yb, 0, alpha * 0.9)
      // velocity arrow
      const va = alpha * 0.45 * (1 - smoothstep(0.3, 0.45, c))
      f.hair.seg(s * (x + 0.45), yb + 0.02, 0, s * (x + 0.05), yb + 0.02, 0, FIELD, va)
    }
  }
  const fl = window01(c, 0.43, 0.66, 0.05)
  COLL.flash = fl
  if (fl > 0) {
    const r = 0.1 + 1.1 * range(c, 0.44, 0.66)
    f.hair.ring(0, yb + 0.01, 0, r, FIELD, 0.9 * alpha * (1 - range(c, 0.44, 0.66)), 36)
  }
  if (c > 0.47) {
    const k = range(c, 0.47, 1)
    const d = 2.6 * k
    const ox = ux * d
    const oz = uz * d
    COLL.outX = ox
    COLL.outZ = oz
    const born = smoothstep(0.47, 0.55, c)
    arc(ox - (ux * LEN) / 2, yb, oz - (uz * LEN) / 2, ox + (ux * LEN) / 2, yb, oz + (uz * LEN) / 2, 0.12, 0.02, t, 0.4)
    f.str.add(PTS, OPEN_N, false, STR_W, alpha * born)
    endMark(f, ox - (ux * LEN) / 2, yb, oz - (uz * LEN) / 2, alpha * born * 0.9)
    endMark(f, ox + (ux * LEN) / 2, yb, oz + (uz * LEN) / 2, alpha * born * 0.9)
    // the closed loop: −û along the brane, 1.2 across it
    const lx = -ux * d
    const lz = -uz * d
    const ly = yb + loopUp * (0.36 + 1.2 * d)
    COLL.loopX = lx
    COLL.loopY = ly
    COLL.loopZ = lz
    if (drawLoop) {
      loop(lx, ly, lz, 0.35, t, 0.7 + 0.4 * t, 1.2 + 0.27 * t)
      // it thins out as it leaves the frame into the bulk
      f.str.add(PTS, LOOP_N, true, STR_W, alpha * born * (1 - 0.75 * smoothstep(1.4, 2.6, d)))
    }
  }
  return COLL
}

/* ═══════════════════════════ Beat 3 · On the brane, off the brane ═══════════════════════════ */

export function onoff(f: Frame, u: number) {
  // camera: up to top-down (slice), then the fly-off, then hold for the collision
  const up = smoothstep(0, 0.14, u)
  const w = range(u, 0.3, 0.7)
  const fly = smoothstep(0, 1, w)
  let az = lerp(24, 0, up)
  let pitch = lerp(12, 89.4, up)
  let dist = lerp(11, 16, up)
  az = lerp(az, 28, fly)
  pitch = lerp(pitch, 16, fly)
  dist = lerp(dist, 11, fly)
  cam(f, az, pitch, dist, 0, 0.1 * (1 - up) + 0.1 * fly, 0)
  compose(f, 1, lerp(0.16, 0.2, up * (1 - fly)))

  const b = f.br[0]
  b.op = 1
  b.fresnel = 0.1
  b.edge = 0.4 * (1 - up * (1 - fly))
  b.soft = up * (1 - fly)

  // slab clip: only what is within h of the brane is drawn at full strength
  const h = u < 0.3 ? 0.06 : 0.06 + 12 * w * w * w
  const slabOn = up > 0.5 && u < 0.72
  f.slab.on = slabOn
  f.slab.y = 0
  f.slab.h = h

  // Beat 2's RR lattice sinks back
  f.rr.op = 1 - smoothstep(0, 0.1, u)
  f.rr.rise = f.rr.op
  f.hud.show('pin:rr', 1 - smoothstep(0, 0.08, u))
  f.hud.show('card:sv', 1 - smoothstep(0, 0.08, u))

  // eight open strings slide on the brane (both ends on it); in the slice they bow ≤ 0.06 out of plane
  f.ringK = lerp(1, 0.35, up * (1 - fly))
  const D = smoothstep(0, 0.18, u)
  const liftK = lerp(0.1, 0.24, 1 - up + fly)
  const inColl = smoothstep(0.7, 0.76, u)
  const glow = 1 + 0.35 * up * (1 - fly)
  for (let k = 0; k < 10; k++) {
    const a = (k < 8 ? lerp(0.9, 0.95, D) * (1 - 0.72 * inColl) : 0.9 * (1 - smoothstep(0, 0.12, u))) * glow
    const len = lerp(0.4, 0.62, D)
    rider(f, k, D, len, len * liftK, 0, a)
    if (k === 1) callout(f, 'openS', C.x, 0.02, C.z + 0.15, 0, 0, f.mobile ? 1.15 : 1.45, window01(u, 0.46, 0.72, 0.05))
  }

  // six closed loops roam the bulk; in the slice they show only as pairs of Ink dots where they cross it.
  // One pair is annotated (the same loop for as long as it keeps crossing, so the label doesn't hop).
  const dots = up * (1 - smoothstep(0.3, 0.42, u))
  const la = smoothstep(0.3, 0.44, u) * (1 - 0.72 * inColl)
  let xk = -1
  let xx = 0
  let xz = 0
  for (let k = 0; k < 6; k++) {
    const p = bulkLoop(f, k, la, true, dots)
    // (only pairs in the right part of the sheet: the label reads leftward, into the sheet, clear of the rail)
    if (XING.n === 2 && XING.x > -0.5 && Math.abs(XING.z) < 3.4 && (xk < 0 || k === XK.k)) {
      xk = k
      xx = XING.x
      xz = XING.z
    }
    // (lifted clear of the loops around it; on phones the pinned note owns the top, so it hangs below)
    if (k === 1) callout(f, 'closedS', p.x - 0.36, p.y, p.z, -0.9, f.mobile ? -0.4 : 0.6, 0, window01(u, 0.5, 0.72, 0.05))
  }
  if (xk >= 0) XK.k = xk
  callout(f, 'cross', xx, 0, xz, -0.5, 0, 0.5, dots * window01(u, 0.12, 0.34, 0.05) * (xk >= 0 ? 1 : 0))
  // the slice's title is a fixed figure title at the top of the stage, not a label among the moving strings
  f.hud.setTitle('On-brane view · you see only what touches the brane')
  f.hud.show('ftitle', window01(u, 0.1, 0.34, 0.05))
  f.hud.show('pin:slice', window01(u, 0.2, 0.4, 0.05))
  f.hud.show('pin:bulk', window01(u, 0.44, 1.2, 0.06))

  // a loop leaves: two open strings meet, one open string + one closed loop come out
  const c = range(u, 0.72, 0.98)
  const ca = smoothstep(0.7, 0.74, u)
  const cl = collision(f, c, 0, ca, 38)
  b.flash = cl.flash * 0.55 * ca
  b.flashR = 0.2 + 2.2 * range(c, 0.44, 0.7)
  b.flashX = 0
  b.flashZ = 0
  if (c > 0.47) {
    const aa = ca * smoothstep(0.5, 0.62, c)
    const L = f.mobile ? 1.35 : 2.1
    f.hair.dash(0, 0.3, 0, -cl.ux * L, 0.36 + 1.2 * L, -cl.uz * L, FIELD, 0.55 * aa, 0.16, 0.12)
    f.hair.head(0, 0.3, 0, -cl.ux * L, 0.36 + 1.2 * L, -cl.uz * L, FIELD, 0.6 * aa, 0.16)
    tag(f, 'bulkArrow', -cl.ux * L + 0.15, 0.36 + 1.2 * L, -cl.uz * L, aa)
  }
  tag(f, 'collide', 0.2, 0, 1.1, window01(u, 0.74, 1.2, 0.05))

  // the H2 loop from the Opening glides past in the background
  const g = range(u, 0.7, 1.0)
  f.loop.x = lerp(-5, 3.5, g)
  f.loop.y = lerp(1.2, 1.7, g)
  f.loop.z = -9
  f.loop.s = 0.45
  f.loop.op = 0.3 * window01(u, 0.72, 1.0, 0.08)
  f.loop.w = 1
}

/* ═══════════════════════════ Beat 4 · Distance becomes mass ═══════════════════════════ */

export const MASS_S = { x: 0.3, z: 0.9 }
/** Beat 4's ruler stands this far to the right of the stretched string */
const RULER_DX = 0.5
/** "d = 2.50 ℓ_s", cached on the value (no string building per frame while d holds still) */
const DT = { v: NaN, s: '' }
function dText(d: number) {
  if (d !== DT.v) {
    DT.v = d
    DT.s = `d = ${d.toFixed(2)} ℓ_s`
  }
  return DT.s
}
/** The three open strings that stay on brane 1 through Beats 4–5 (a subset of Beat 3's sliders). */
export const KEEP = [0, 1, 7] as const

/** The stretched string of Beats 4–5: its brane-1 end drifts; the far end slides in step. */
export function stretchedAt(f: Frame, sx: number, sz: number, y0: number, y1: number, alpha: number, ph: number, dir = 1) {
  const gap = Math.abs(y1 - y0)
  const fold = 1 - smoothstep(0, 0.4, gap)
  const half = 0.34 * fold
  const ax = sx - half
  const bx = sx + half
  if (fold > 0.001) {
    arc(ax, y0, sz, bx, y1, sz, 0.17 * fold, 0.03 * fold, f.t, ph)
  } else {
    stretch(sx, y0, sz, sx, y1, sz, 0.05, f.t, ph)
  }
  f.str.add(PTS, OPEN_N, false, STR_W, alpha)
  endMark(f, ax, y0, sz, alpha)
  endMark(f, bx, y1, sz, alpha)
  // orientation chevron at the midpoint
  if (gap > 0.35 && alpha > 0.05) {
    const my = (y0 + y1) / 2
    const d = dir * Math.sign(y1 - y0 || 1)
    const s = 0.09
    f.hair.seg(sx - s, my - d * s * 0.6, sz, sx, my + d * s * 0.5, sz, INK, 0.8 * alpha)
    f.hair.seg(sx + s, my - d * s * 0.6, sz, sx, my + d * s * 0.5, sz, INK, 0.8 * alpha)
  }
}

/** Hairline ruler from y0 to y1 at (x, z): end caps and 0.5 ℓ_s ticks. */
export function ruler(f: Frame, x: number, z: number, y0: number, y1: number, a: number) {
  if (a <= 0.01) return
  f.hair.seg(x, y0, z, x, y1, z, FIELD, 0.6 * a)
  const w = 0.12
  f.hair.seg(x - w, y0, z, x + w, y0, z, FIELD, 0.7 * a)
  f.hair.seg(x - w, y1, z, x + w, y1, z, FIELD, 0.7 * a)
  const lo = Math.min(y0, y1)
  const hi = Math.max(y0, y1)
  for (let y = lo + 0.5; y < hi - 0.05; y += 0.5) f.hair.seg(x, y, z, x + 0.06, y, z, FIELD, 0.5 * a)
}

export function mass(f: Frame, u: number) {
  const settle = smoothstep(0, 0.2, u)
  const peel = easeInOutCubic(range(u, 0.2, 0.45))
  const r = range(u, 0.45, 0.8)
  const y2 = 2.5 * peel + 2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * r)) * (u > 0.45 && u < 0.8 ? 1 : 0)
  const ty = lerp(0.1, 1.15, smoothstep(0.15, 0.45, u)) + 0.5 * (y2 - 2.5 * peel)
  cam(f, lerp(28, 20, settle), lerp(16, 12, settle), lerp(11, 11.5, settle), 0, ty, 0)
  compose(f, 1, lerp(0.16, 0.06, settle))

  const b1 = f.br[0]
  b1.op = 1
  b1.fresnel = 0.1
  const b2 = f.br[1]
  b2.y = y2
  b2.op = smoothstep(0.18, 0.26, u)
  b2.fresnel = 0.1
  tag(f, 'b2', -4.9, y2, -4.9, smoothstep(0.26, 0.36, u) * (y2 > 0.4 ? 1 : 0))
  tag(f, 'b1', -4.9, 0, -4.9, smoothstep(0.26, 0.36, u))

  // Beat 3's cast fades: three short strings stay, sliding on brane 1 (its labels are gone before Beat 4's arrive)
  const fadeOld = 1 - smoothstep(0, 0.06, u)
  const dim = 0.95 * 0.4
  for (let k = 0; k < 8; k++) {
    const keep = k === KEEP[0] || k === KEEP[1] || k === KEEP[2]
    rider(f, k, 1, 0.62, 0.62 * 0.24 * (1 + settle * 1.2), 0, keep ? lerp(dim, 0.95, smoothstep(0, 0.12, u)) : dim * fadeOld)
    // (it leaves before brane 2 rises through the space it occupies)
    if (k === 0) callout(f, 'u1', C.x, 0.28, C.z, -0.2, 1.2, 0, window01(u, 0.06, 0.2, 0.04))
  }
  if (fadeOld > 0) {
    for (let k = 0; k < 6; k++) bulkLoop(f, k, 0.35 * fadeOld, false, 0)
    const cl = collision(f, 1, 0, fadeOld, 38)
    const L = 2.1
    f.hair.dash(0, 0.3, 0, -cl.ux * L, 0.36 + 1.2 * L, -cl.uz * L, FIELD, 0.55 * fadeOld, 0.16, 0.12)
    f.hair.head(0, 0.3, 0, -cl.ux * L, 0.36 + 1.2 * L, -cl.uz * L, FIELD, 0.6 * fadeOld, 0.16)
    tag(f, 'bulkArrow', -cl.ux * L + 0.15, 0.36 + 1.2 * L, -cl.uz * L, fadeOld)
    tag(f, 'collide', 0.2, 0, 1.1, fadeOld)
  }
  f.hud.show('pin:bulk', fadeOld)

  // the stretched string from brane 1 to brane 2, a ruler beside it (on the open side, away from the 1–1 arcs)
  const sa = smoothstep(0.22, 0.3, u)
  if (sa > 0) {
    const sx = MASS_S.x
    const sz = MASS_S.z
    stretchedAt(f, sx, sz, 0, y2, sa, 0.7)
    ruler(f, sx + RULER_DX, sz, 0, y2, sa * smoothstep(0.28, 0.36, u))
    tag(f, 'ruler', sx + RULER_DX + 0.1, y2 / 2, sz, sa * smoothstep(0.3, 0.38, u), dText(y2))
  }
  f.hud.mass.update(y2)
  f.hud.show('mass', smoothstep(0.3, 0.42, u))
  f.hud.show('plot', smoothstep(0.34, 0.46, u) * (1 - smoothstep(0.78, 0.84, u)))
  f.hud.show('pin:exact', smoothstep(0.32, 0.42, u))

  // the view from brane 1: a heavy particle whose mass measures a distance you can't see
  f.hud.show('inset', smoothstep(0.82, 0.9, u))
}

/* ═══════════════════════════ Beat 5 · Touching branes ═══════════════════════════ */

export const TOUCH = { ys: [0, 2.5, -4], n: 2, header: '', count: '' }

/** The Beat 5/6 string matrix: stacks and labels recomputed only when the brane positions change. */
const MX = { ys: [0, 0] as number[], stacks: [] as Stack[], header: '', count: '', showMass: true, showPos: false, v: 0 }
const MXC = { y1: NaN, y2: NaN, n: 0, ys2: [0, 0], ys3: [0, 0, 0], header: '', count: '' }
function matrixState(y1: number, y2: number, n: number) {
  if (y1 !== MXC.y1 || y2 !== MXC.y2 || n !== MXC.n) {
    MXC.y1 = y1
    MXC.y2 = y2
    MXC.n = n
    const ys = n === 3 ? MXC.ys3 : MXC.ys2
    ys[0] = 0
    ys[1] = y1
    if (n === 3) ys[2] = y2
    MX.ys = ys
    MX.v++
    MX.stacks = stacksOf(ys)
    const ml = masslessCount(MX.stacks)
    MXC.header = `SYMMETRY ${symmetryLabel(MX.stacks)}`
    MXC.count = `MASSLESS CARRIERS ${ml} · HEAVY ${n * n - ml}`
  }
  MX.header = MXC.header
  MX.count = MXC.count
  return MX
}

/** Stretched pairs: (i, j, x, z) for i → j. */
const PAIRS: [number, number, number, number][] = [
  [0, 1, 0.3, 0.9],
  [1, 0, 1.1, -0.1],
  [0, 2, -0.9, 2.3],
  [2, 0, -0.2, 1.6],
  [1, 2, 1.1, 2.6],
  [2, 1, 1.9, 1.9],
]
const DIAG: [number, number, number][] = [
  [0, -1.9, 1.6],
  [1, 2.1, 1.9],
  [2, 1.9, -2.3],
]

export function touch(f: Frame, u: number) {
  let y2 = 2.5
  let y3 = -4
  if (u > 0.15) {
    const r = range(u, 0.15, 0.48)
    y2 = 0.22 + 2.28 * (1 - easeOutCubic(r))
    if (u > 0.48) y2 = 0.22 * (1 - range(u, 0.48, 0.5))
  }
  if (u > 0.6) y2 = 1.5 * easeInOutCubic(range(u, 0.6, 0.74))
  if (u > 0.78) y3 = -4 + 2.5 * easeOutCubic(range(u, 0.78, 0.82))
  if (u > 0.82) {
    const e = easeInOutCubic(range(u, 0.82, 0.88))
    y2 = 1.5 * (1 - e)
    y3 = -1.5 * (1 - e)
  }
  if (u > 0.9) y3 = -1.5 * easeInOutCubic(range(u, 0.9, 0.97))
  if (Math.abs(y2) < 1e-3) y2 = 0
  if (Math.abs(y3) < 1e-3) y3 = 0
  const three = smoothstep(0.78, 0.8, u)
  const n = u > 0.78 ? 3 : 2
  TOUCH.ys[0] = 0
  TOUCH.ys[1] = y2
  TOUCH.ys[2] = y3
  TOUCH.n = n

  const ty = lerp(1.15, 0.1, smoothstep(0.76, 0.84, u))
  cam(f, 20, 12, 11.5, 0, ty, 0, lerp(1.5, 1.95, smoothstep(0.74, 0.8, u)))
  // phones: lift the stack clear of the (long) beat text once the third brane arrives
  compose(f, 1, 0.06, lerp(0.15, 0.2, smoothstep(0.74, 0.8, u)))

  const ys = TOUCH.ys
  f.br[0].op = 1
  f.br[1].op = 1
  f.br[1].y = y2
  f.br[2].op = three
  f.br[2].y = y3
  for (const b of f.br) b.fresnel = 0.1

  // merge flashes (Field, not filament)
  const fl1 = window01(u, 0.485, 0.62, 0.03)
  const fl2 = window01(u, 0.875, 0.96, 0.02)
  const fl = Math.max(fl1, fl2)
  if (fl > 0) {
    const rr = fl1 > fl2 ? range(u, 0.49, 0.62) : range(u, 0.88, 0.96)
    f.br[0].flash = 0.6 * fl
    f.br[0].flashR = 0.3 + 6.5 * rr
  }

  // Beat 4's leftovers fade
  const fo = 1 - smoothstep(0, 0.1, u)
  for (const k of KEEP) rider(f, k, 1, 0.62, 0.62 * 0.24 * 2.2, 0, k === 0 ? 0.95 : 0.95 * fo)
  const ro = 1 - smoothstep(0, 0.06, u)
  if (ro > 0) {
    ruler(f, MASS_S.x + RULER_DX, MASS_S.z, 0, y2, ro)
    tag(f, 'ruler', MASS_S.x + RULER_DX + 0.1, y2 / 2, MASS_S.z, ro, dText(y2))
  }
  f.hud.show('inset', 1 - smoothstep(0, 0.05, u))
  f.hud.show('mass', 1 - smoothstep(0, 0.05, u))
  f.hud.mass.update(y2)

  // the strings: i–i on each brane, i→j stretched (oriented)
  const pa = smoothstep(0.0, 0.08, u)
  for (const [i, x, z] of DIAG) {
    if (i === 0) continue
    const a = i === 1 ? pa : three
    const ang = 0.5 + i
    const L = 0.6
    const yb = ys[i]
    const ax = x - (Math.cos(ang) * L) / 2
    const az = z - (Math.sin(ang) * L) / 2
    const bx = x + (Math.cos(ang) * L) / 2
    const bz = z + (Math.sin(ang) * L) / 2
    arc(ax, yb, az, bx, yb, bz, 0.15, 0.025, f.t, i)
    f.str.add(PTS, OPEN_N, false, STR_W * 0.9, 0.95 * a)
    endMark(f, ax, yb, az, 0.9 * a, true, 0.8)
    endMark(f, bx, yb, bz, 0.9 * a, true, 0.8)
  }
  for (let p = 0; p < PAIRS.length; p++) {
    const [i, j, x, z] = PAIRS[p]
    const a = p < 1 ? 1 : p < 2 ? pa : three
    if (a <= 0.003) continue
    stretchedAt(f, x, z, ys[i], ys[j], a, p === 0 ? 0.7 : p * 1.3)
  }
  const lab12 = window01(u, 0.02, 0.2, 0.05)
  tag(f, 's12', PAIRS[0][2] + 0.14, (ys[0] + ys[1]) / 2, PAIRS[0][3], lab12)
  tag(f, 's21', PAIRS[1][2] + 0.14, (ys[0] + ys[1]) / 2, PAIRS[1][3], lab12)
  // brane labels name each stack: "brane 1", "branes 1 + 2", "branes 1 + 2 + 3"
  const with2 = Math.abs(y2) < 0.02
  const with3 = n > 2 && Math.abs(y3) < 0.02
  tag(f, 'b1', -4.9, 0, -4.9, smoothstep(0.0, 0.06, u), with2 && with3 ? 'branes 1 + 2 + 3' : with2 ? 'branes 1 + 2' : with3 ? 'branes 1 + 3' : 'brane 1')
  tag(f, 'b2', -4.9, y2, -4.9, smoothstep(0.25, 0.4, Math.abs(y2)))
  tag(f, 'b3', -4.9, y3, -4.9, three * smoothstep(0.25, 0.4, Math.abs(y3)))

  // the string matrix
  const mx = matrixState(y2, y3, n)
  let header = mx.header
  let count = mx.count
  if (u > 0.49 && u < 0.62) {
    header = 'SYMMETRY U(1) × U(1) → U(2)'
    count = 'MASSLESS CARRIERS 2 → 4'
  } else if (u >= 0.62 && u < 0.78) {
    header = 'SYMMETRY U(2) → U(1) × U(1)'
  } else if (u > 0.875 && u < 0.9) {
    header = 'SYMMETRY U(1)³ → U(3)'
    count = 'MASSLESS CARRIERS 3 → 9'
  } else if (u > 0.93) {
    header = 'SYMMETRY U(3) → U(2) × U(1)'
  }
  mx.header = header
  mx.count = count
  // from the pull-apart on, each row also carries its brane's position: the diagonal of ⟨Φ⟩
  mx.showPos = u > 0.62
  f.hud.matrix.update(mx)
  f.hud.show('matrix', smoothstep(0.06, 0.13, u))
  // (the legend steps aside while the Higgs bracket runs under the matrix)
  f.hud.show('legend', 1 - window01(u, 0.62, 0.81, 0.03))
  // the aha is staged on the matrix: it grows while its cells fill, then settles back for the pull-apart
  // (phones: the matrix shares the top of the stage with the caption, so it keeps its size)
  f.hud.matrix.setScale(f.mobile ? 1 : 1 + 0.35 * window01(u, 0.46, 0.68, 0.05))
  f.hud.matrix.setDiag(window01(u, 0.63, 0.8, 0.03))

  // the aha, and what it means
  const aha = window01(u, 0.51, 0.66, 0.03)
  const fin = smoothstep(0.93, 0.99, u)
  f.hud.setCap(fin > aha ? 'Here, the value of a Higgs field is a distance.' : 'Four massless carriers, not two. The symmetry grew because the branes touched.')
  f.hud.show('cap', Math.max(aha, fin))

  // the ruler d, now read as the Higgs field's value: a hairline bracket runs from its top to the matrix rows
  const ra = window01(u, 0.63, 0.8, 0.03)
  ruler(f, HIGGS_R[0], HIGGS_R[1], 0, y2, ra)
  tag(f, 'higgs', HIGGS_R[0] - 0.12, y2 * 0.5, HIGGS_R[1], ra, dText(y2))
  link(f, HIGGS_R[0], y2, HIGGS_R[1], ra)
  f.hud.show('pin:exact', window01(u, -0.2, 0.62, 0.04))
  f.hud.show('pin:higgs', smoothstep(0.62, 0.7, u))
  f.hud.show('nsq', smoothstep(0.84, 0.9, u))
  f.hud.show('card:su3', smoothstep(0.9, 0.96, u))
}

/** Beat 5's Higgs ruler: right of every string, so its bracket rises to the matrix without crossing any */
const HIGGS_R = [2.8, 0.4] as const

/** Ask the HUD for the ruler → matrix bracket, from the world point (x, y, z). */
function link(f: Frame, x: number, y: number, z: number, o: number) {
  const L = f.link
  L.x = x
  L.y = y
  L.z = z
  L.o = o
}

/* ═══════════════════════════ Beat 6 · Are we on a brane? ═══════════════════════════ */

export function world(f: Frame, u: number) {
  const t = f.t
  const merge = easeInOutCubic(range(u, 0, 0.1))
  const y3 = -1.5 * (1 - merge)
  // low and close for the gravity lines (they flatten into the slab), then back out for the searches
  const g1 = smoothstep(0.06, 0.2, u)
  const g2 = smoothstep(0.38, 0.52, u)
  const pitch = lerp(lerp(12, 7, g1), 15, g2)
  const dist = lerp(lerp(11.5, 9.6, g1), 12, g2)
  cam(f, lerp(20, 26, smoothstep(0, 0.6, u)), pitch, dist, 0, lerp(0.1, 0, g1), 0, lerp(1.95, 1.55, smoothstep(0, 0.12, u)))
  compose(f, 1, lerp(0.06, 0.12, smoothstep(0, 0.2, u)), lerp(0.2, 0.15, smoothstep(0, 0.2, u)))

  f.br[0].op = 1
  f.br[1].op = 1 - smoothstep(0.08, 0.16, u)
  f.br[1].y = 0
  f.br[2].op = 1 - smoothstep(0.08, 0.16, u)
  f.br[2].y = y3
  for (const b of f.br) b.fresnel = 0.1

  // Beat 5's strings fold into the sheet and fade
  const fo = 1 - smoothstep(0.02, 0.14, u)
  if (fo > 0) {
    for (let p = 0; p < PAIRS.length; p++) {
      const [i, j, x, z] = PAIRS[p]
      const ys = [0, 0, y3]
      stretchedAt(f, x, z, ys[i], ys[j], fo, p === 0 ? 0.7 : p * 1.3)
    }
    rider(f, KEEP[0], 1, 0.62, 0.62 * 0.24 * 2.2, 0, 0.95 * fo)
    for (const [i, x, z] of DIAG) {
      if (i === 0) continue
      const yb = i === 2 ? y3 : 0
      const ang = 0.5 + i
      arc(x - Math.cos(ang) * 0.3, yb, z - Math.sin(ang) * 0.3, x + Math.cos(ang) * 0.3, yb, z + Math.sin(ang) * 0.3, 0.15, 0.025, t, i)
      f.str.add(PTS, OPEN_N, false, STR_W * 0.9, 0.95 * fo)
    }
    // Beat 5's closing state (kept in sync even when arriving here directly)
    const mx = matrixState(0, y3, 3)
    mx.header = 'SYMMETRY U(3) → U(2) × U(1)'
    mx.showPos = true
    f.hud.matrix.update(mx)
    f.hud.setCap('Here, the value of a Higgs field is a distance.')
    f.hud.show('matrix', fo)
    f.hud.show('legend', 1)
    f.hud.show('cap', fo)
    f.hud.show('card:su3', fo)
    f.hud.show('pin:higgs', fo)
    f.hud.show('nsq', fo)
    tag(f, 'b1', -4.9, 0, -4.9, fo, 'branes 1 + 2')
  }

  // matter and light: open strings confined to the sheet
  const ma = smoothstep(0.06, 0.16, u)
  let mx = 0
  let mz = 0
  for (let k = 3; k < 9; k++) {
    rider(f, k, 1, 0.55, 0.13, 0, 0.85 * ma * (1 - 0.35 * smoothstep(0.54, 0.6, u)))
    if (k === 3) {
      mx = C.x
      mz = C.z
    }
  }
  // the label hangs toward the viewer, below the sheet's front, clear of the field lines above it
  callout(f, 'matter', mx, 0, mz, 0.2, 0, 1.3, window01(u, 0.08, 0.25, 0.04))

  // a mass on the sheet; forces confined to the brane vs gravity spreading into the bulk
  const ga = window01(u, 0.08, 0.56, 0.06)
  const grow = smoothstep(0.1, 0.34, u)
  if (ga > 0) {
    inkDot(f, 0, 0.02, 0, 16, ga)
    inkDot(f, 0, 0.02, 0, 7, ga)
    for (let i = 0; i < 16; i++) {
      const th = (i / 16) * Math.PI * 2 + 0.1
      const r1 = 0.2 + 3.6 * grow
      f.hair.seg(Math.cos(th) * 0.2, 0.01, Math.sin(th) * 0.2, Math.cos(th) * r1, 0.01, Math.sin(th) * r1, INK2, 0.55 * ga, 0.1 * ga)
    }
  }
  f.grav.op = ga
  f.grav.reveal = grow
  // slab faces y = ±1 (L = 2) with matching ticks: the extra direction closes on itself
  const sa = window01(u, 0.14, 0.56, 0.06)
  if (sa > 0) slab(f, sa)
  tag(f, 'ours', OURS[0], 0, OURS[2], window01(u, 0.04, f.mobile ? 0.56 : 0.88, 0.04))
  tag(f, 'dbrane', OURS[0], 0, OURS[2], smoothstep(0.88, 0.94, u))
  // at the tip of one of the flat (in-sheet) field lines, front right of the mass
  // the figure's labels arrive in turn (the relabelled strings, then the two kinds of field line, then the slab)
  tag(f, 'confined', 1.45, 0.02, 2.86, window01(u, 0.18, 0.36, 0.04))
  tag(f, 'gspread', -1.3, 1.25, -0.6, window01(u, 0.14, 0.31, 0.04))
  tag(f, 'slabtb', -1.3, 1.0, -5, window01(u, 0.29, 0.44, 0.04))
  // far from the mass the lines lie along the brane again (below the sheet, in front): the dilution, stated.
  // (it follows the proton card, which shares the bottom of the frame)
  callout(f, 'far', 0.6, -0.9, 2.0, 0, -0.3, 0.45, window01(u, 0.41, 0.55, 0.03))
  f.hud.setTitle('Arkani-Hamed, Dimopoulos & Dvali, 1998 · large extra dimensions dilute gravity')
  f.hud.show('ftitle', window01(u, 0.14, 0.4, 0.04))
  tag(f, 'amass', 0, -0.12, 0.2, window01(u, 0.1, 0.4, 0.05))
  f.hud.show('card:proton', window01(u, 0.24, 0.42, 0.04))
  f.hud.show('pin:add', window01(u, 0.12, 0.4, 0.04))

  // Randall–Sundrum: weakness from warping, not volume
  f.hud.show('rs', window01(u, 0.4, 0.58, 0.04))
  f.hud.show('pin:rs', window01(u, 0.42, 0.58, 0.03))

  // how we'd notice: the collision replays; the loop leaves; what's left doesn't balance
  const c = range(u, 0.56, 0.8)
  const ca = window01(u, 0.54, 0.97, 0.05)
  const cl = collision(f, c, 0, ca, 30)
  f.br[0].flash = cl.flash * 0.55 * ca
  f.br[0].flashR = 0.2 + 2.2 * range(c, 0.44, 0.7)
  if (c > 0.5) {
    const aa = ca * smoothstep(0.55, 0.7, c)
    f.hair.dash(0, 0.3, 0, -cl.ux * 3.2, 0.36 + 1.2 * 3.2, -cl.uz * 3.2, FIELD, 0.4 * aa, 0.16, 0.12)
  }
  f.hud.show('inset', window01(u, 0.58, 0.9, 0.04))
  f.hud.show('results', window01(u, 0.6, 0.92, 0.04))
  f.hud.show('pin:notreq', smoothstep(0.86, 0.92, u))
}

/** where "our 3D space?" sits on the sheet (front edge, right of centre) */
const OURS = [1.6, 0, 4.2] as const

/** The slab: faces at y = ±1 with matching ticks (top ≡ bottom). */
function slab(f: Frame, a: number) {
  const H = 1
  const R = 5
  for (const y of [-H, H]) {
    f.hair.dash(-R, y, R, R, y, R, FIELD, 0.4 * a, 0.2, 0.14)
    f.hair.dash(R, y, R, R, y, -R, FIELD, 0.3 * a, 0.2, 0.14)
    f.hair.dash(-R, y, -R, R, y, -R, FIELD, 0.22 * a, 0.2, 0.14)
    f.hair.dash(-R, y, R, -R, y, -R, FIELD, 0.3 * a, 0.2, 0.14)
  }
  const tick = (x: number, z: number) => {
    for (const y of [-H, H]) {
      f.hair.seg(x, y - 0.18, z, x, y + 0.18, z, FIELD, 0.7 * a)
      f.hair.head(x, y - 0.18, z, x, y + 0.18, z, FIELD, 0.8 * a, 0.08, 1, 0, 0)
    }
  }
  for (const x of [-R, R]) for (const z of [-3, 0, 3]) tick(x, z)
  for (const x of [-2.5, 0, 2.5]) tick(x, -R)
  // vertical corner posts, very faint
  for (const [x, z] of [
    [-R, R],
    [R, R],
    [R, -R],
    [-R, -R],
  ])
    f.hair.seg(x, -H, z, x, H, z, FIELD, 0.12 * a)
}

