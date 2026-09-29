import type { StringBatch, HairBatch, DotBatch } from './gfx'
import { SP, WARM_CORE, FIELD, INK } from './gfx'
import type { Hud } from './hud'
import { fold, wobble } from './model'

/*
 * One frame of the stage, written by the beat functions and applied to three.js objects by the Scene.
 * Everything a beat draws is a pure function of (step progress, stage clock t) so scrubbing is exact and
 * frozen-clock screenshots are deterministic. Only the Lab keeps event state (strings you drew, etc.).
 */

export interface BraneOut {
  y: number
  op: number
  grid: number
  edge: number
  fill: number
  fresnel: number
  ripple: number
  dent0: [number, number, number]
  dent1: [number, number, number]
  flash: number
  flashR: number
  flashX: number
  flashZ: number
  paintOn: boolean
  paintTau: number
  complete: number
  /** 0..1 soft (vignetted) border instead of a crisp edge */
  soft: number
}

export interface TagReq {
  x: number
  y: number
  z: number
  o: number
  text?: string
  /** frame stamp: the request is live only when it matches Frame.stamp */
  s: number
}

export interface Frame {
  /** animation clock (stage clock; frozen under reduced motion) */
  t: number
  /** walk clock (same as t; kept separate so walks can be frozen independently) */
  tw: number
  /** event clock for the lab (always the real stage clock) */
  te: number
  dt: number
  mobile: boolean
  aspect: number
  W: number
  H: number
  /** world units per CSS px at the camera target (for pixel-sized marks) */
  wpp: number
  /** contact-ring strength (quieter when looking straight down on the sheet) */
  ringK: number
  /** screen-space text-column fade at a world point (for beads, which have no shader hook) */
  fadeAt: (x: number, y: number, z: number) => number
  /** normalized device y (−1 bottom … 1 top) of a world point, from the last frame's camera */
  ndcY: (x: number, y: number, z: number) => number
  /** normalized device x (−1 left … 1 right) of a world point, from the last frame's camera */
  ndcX: (x: number, y: number, z: number) => number
  cam: { az: number; pol: number; dist: number; tx: number; ty: number; tz: number }
  shift: [number, number]
  slab: { on: boolean; y: number; h: number }
  br: BraneOut[]
  /** canonical H2 loop object (the Thread): transform, opacity and shape blend (1 = loopFn exactly) */
  loop: { x: number; y: number; z: number; s: number; op: number; w: number; rx: number; ry: number; rz: number }
  rr: { op: number; rise: number; y: number }
  grav: { op: number; reveal: number }
  dust: number
  /** screen-space fade of the brane sheets behind the text column: axis 0 = x, 1 = y (from bottom); edge = right-edge vignette */
  fade: { axis: number; from: number; to: number; amount: number; edge: number }
  str: StringBatch
  hair: HairBatch
  dots: DotBatch
  hud: Hud
  /** tag requests, pooled per key (live when req.s === stamp) */
  tags: Map<string, TagReq>
  /** Beat 5: the Higgs ruler's top, which the HUD links to the matrix rows (o = 0: no link) */
  link: { x: number; y: number; z: number; o: number }
  stamp: number
}

export const newBrane = (): BraneOut => ({
  y: 0,
  op: 0,
  grid: 0.14,
  edge: 0.4,
  fill: 0.018,
  fresnel: 0.1,
  ripple: 0,
  dent0: [0, 0, 0],
  dent1: [0, 0, 0],
  flash: 0,
  flashR: 0,
  flashX: 0,
  flashZ: 0,
  paintOn: false,
  paintTau: 1,
  complete: 1,
  soft: 0,
})

export function resetBrane(b: BraneOut) {
  b.y = 0
  b.op = 0
  b.grid = 0.14
  b.edge = 0.4
  b.fill = 0.018
  b.fresnel = 0.1
  b.ripple = 0
  b.dent0[2] = 0
  b.dent1[2] = 0
  b.flash = 0
  b.paintOn = false
  b.paintTau = 1
  b.complete = 1
  b.soft = 0
}

export function tag(f: Frame, key: string, x: number, y: number, z: number, o: number, text?: string) {
  if (o <= 0.005) return
  let r = f.tags.get(key)
  if (r && r.s === f.stamp && r.o >= o) return
  if (!r) {
    r = { x, y, z, o, text, s: f.stamp }
    f.tags.set(key, r)
    return
  }
  r.x = x
  r.y = y
  r.z = z
  r.o = o
  r.text = text
  r.s = f.stamp
}

/**
 * A figure callout: a Field hairline leader from an object at (x, y, z) to the label point (x+dx, y+dy, z+dz),
 * so the annotation never sits on top of the thing it names.
 */
export function callout(f: Frame, key: string, x: number, y: number, z: number, dx: number, dy: number, dz: number, o: number, text?: string) {
  if (o <= 0.005) return
  const lx = x + dx
  const ly = y + dy
  const lz = z + dz
  // start the leader a little off the object, end it just short of the text
  f.hair.seg(x + dx * 0.12, y + dy * 0.12, z + dz * 0.12, lx - dx * 0.04, ly - dy * 0.04, lz - dz * 0.04, FIELD, 0.5 * o, 0.28 * o)
  tag(f, key, lx, ly, lz, o, text)
}

/* ───────────── string shapes (write into a scratch buffer, then f.str.add) ───────────── */

export const PTS = new Float32Array(SP * 3)
export const OPEN_N = 48
export const LOOP_N = 64
const OMEGA = 2.6

/** Open string with both ends on one brane: quadratic Bézier a→b, apex lifted `lift`, plus the fundamental wiggle. */
export function arc(ax: number, ay: number, az: number, bx: number, by: number, bz: number, lift: number, wig: number, t: number, ph: number, out = PTS, n = OPEN_N) {
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2 + 2 * lift
  const mz = (az + bz) / 2
  const w = wig * Math.sin(OMEGA * t + ph)
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1)
    const a = (1 - s) * (1 - s)
    const b = 2 * s * (1 - s)
    const c = s * s
    out[i * 3] = a * ax + b * mx + c * bx
    out[i * 3 + 1] = a * ay + b * my + c * by + w * Math.sin(Math.PI * s)
    out[i * 3 + 2] = a * az + b * mz + c * bz
  }
  return n
}

/** Stretched string a→b: straight, plus a transverse wiggle 0.05·sin(πs)·sin(ωt) (horizontal, ⟂ to the chord). */
export function stretch(ax: number, ay: number, az: number, bx: number, by: number, bz: number, wig: number, t: number, ph: number, out = PTS, n = OPEN_N) {
  const w = wig * Math.sin(OMEGA * 1.3 * t + ph)
  const w2 = wig * 0.6 * Math.sin(OMEGA * 0.9 * t + ph * 1.7)
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1)
    const e = Math.sin(Math.PI * s)
    out[i * 3] = ax + (bx - ax) * s + w * e
    out[i * 3 + 1] = ay + (by - ay) * s
    out[i * 3 + 2] = az + (bz - az) * s + w2 * e
  }
  return n
}

/**
 * Closed string: r(θ) = r₀·(1 + 0.08·cos(2θ − 3t)) — the spin-2 wobble of Chapter 04 — in a plane with
 * normal set by two tumbling angles.
 */
export function loop(cx: number, cy: number, cz: number, r0: number, t: number, a: number, b: number, out = PTS, n = LOOP_N) {
  // basis: u = (cos a, 0, sin a) rotated about it by b → v
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const cb = Math.cos(b)
  const sb = Math.sin(b)
  const ux = ca
  const uy = 0
  const uz = sa
  // v ⟂ u: mix of up and (−sin a, 0, cos a)
  const vx = -sa * cb
  const vy = sb
  const vz = ca * cb
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2
    const r = r0 * (1 + 0.08 * Math.cos(2 * th - 3 * t))
    const c = Math.cos(th) * r
    const s = Math.sin(th) * r
    out[i * 3] = cx + c * ux + s * vx
    out[i * 3 + 1] = cy + c * uy + s * vy
    out[i * 3 + 2] = cz + c * uz + s * vz
  }
  return n
}

/* ───────────── marks ───────────── */

/** Visibility of a point under the on-brane slab clip (1 inside the slab, 0 well outside; 1 when the clip is off). */
export function slabVis(f: Frame, y: number) {
  if (!f.slab.on) return 1
  const h = f.slab.h
  const w = 0.03 + 0.27 * Math.min(1, Math.max(0, (h - 0.06) / 1.14))
  const d = Math.abs(y - f.slab.y)
  if (d <= h) return 1
  if (d >= h + w) return 0
  const q = (d - h) / w
  return 1 - q * q * (3 - 2 * q)
}

/** Endpoint bead + Field contact ring on the sheet (both obey the on-brane slab clip, like the strings). */
export function endMark(f: Frame, x: number, y: number, z: number, a: number, ring = true, size = 1) {
  if (f.fade.amount > 0 || f.fade.edge > 0) a *= f.fadeAt(x, y, z)
  a *= slabVis(f, y)
  f.dots.add(x, y, z, 7.5 * f.wpp * size, WARM_CORE, a)
  if (ring && f.ringK > 0.01) f.hair.ring(x, y + 0.004, z, 0.12, FIELD, 0.55 * a * f.ringK, 18)
}

/** Ink dot (a point-like crossing or unresolved thing). */
export function inkDot(f: Frame, x: number, y: number, z: number, px: number, a: number) {
  if (f.fade.amount > 0 || f.fade.edge > 0) a *= f.fadeAt(x, y, z)
  a *= slabVis(f, y)
  f.dots.add(x, y, z, px * f.wpp, INK, a)
}

/** Smooth wandering of a string centre on a brane (a bounded "random walk"), folded inside ±lim. */
const WND = { x: 0, z: 0 }
/** (writes into a shared scratch object: read x, z before the next call) */
export function wander(seed: number, t: number, amp: number, x0: number, z0: number, lim: number, rate = 0.45) {
  WND.x = fold(x0 + amp * (wobble(rate * t, seed) - wobble(0, seed)), lim)
  WND.z = fold(z0 + amp * (wobble(rate * t, seed + 7.3) - wobble(0, seed + 7.3)), lim)
  return WND
}
