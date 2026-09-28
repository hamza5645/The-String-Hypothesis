// Per-frame shared state for the chapter's scene. The Director writes it (priority −3); every
// sub-component reads it in its own frame loop. Plain mutable fields: no allocation per frame.
import { MODES } from './model'

/** Keyframe track: flat [B0, v0, B1, v1, …]; constant outside, smoothstep between consecutive keys. */
export function trk(B: number, k: readonly number[]): number {
  const n = k.length
  if (B <= k[0]) return k[1]
  for (let i = 0; i < n - 2; i += 2) {
    const b0 = k[i]
    const b1 = k[i + 2]
    if (B <= b1) {
      const v0 = k[i + 1]
      const v1 = k[i + 3]
      if (b1 <= b0) return v1
      let t = (B - b0) / (b1 - b0)
      t = t * t * (3 - 2 * t)
      return v0 + (v1 - v0) * t
    }
  }
  return k[n - 1]
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Viewport-dependent composition (recomputed on resize). World sizes are at the default camera (z = 10). */
export class Layout {
  w = 1
  vw = 1
  h = 1
  vh = 1
  aspect = 1
  mobile = false
  fit = 1
  /** px per world unit at z = 0 with the camera at distance 10. */
  ppu = 100
  SX = 0.19
  SY = 0
  SXlab = -0.085
  SYlab = 0.04
  // string lengths (world) per beat
  L1 = 3.7
  Ls = 4.6
  L3 = 3.8
  L4 = 4.2
  L6 = 2.2
  Llab = 4
  cx1 = -0.55
  cy1 = 0.45
  cx2 = -1.25
  cx3 = -0.35
  /** Beat 2: the string's scale while the ladder is up (keeps it clear of the rungs) */
  slide2 = 0.7
  /** x offset (px) of the massless point A on rung 0 of the Beat-5 ladder */
  aOff = 34
  /** rungs shown on the Beat-5 ladder */
  count5 = 7
  /** Beat 4: catalogue slots (px) and loupe radius (px) */
  slots: { x: number; y: number }[] = []
  loupeR = 90
  /** ladders: left x, rung-0 y (px), width, px per level */
  lad2: Rect = { x: 0, y: 0, w: 0, h: 0 }
  lad3: Rect = { x: 0, y: 0, w: 0, h: 0 }
  lad5: Rect = { x: 0, y: 0, w: 0, h: 0 }
  ladLab: Rect = { x: 0, y: 0, w: 0, h: 0 }
  strip5: Rect = { x: 0, y: 0, w: 0, h: 0 }
  stripLab: Rect = { x: 0, y: 0, w: 0, h: 0 }
  sm: Rect = { x: 0, y: 0, w: 0, h: 0 }
  inset: Rect = { x: 0, y: 0, w: 0, h: 0 }

  /** Canvas size (w, h) and the visible layout width vw (≤ w; px layout uses vw, world conversions use w). */
  compute(canvasW: number, h: number, fit: number, vw = canvasW, vhIn = h) {
    const cvw = canvasW
    this.w = cvw
    this.h = h
    this.aspect = cvw / Math.max(1, h)
    this.mobile = this.aspect < 0.8 || cvw < 620
    this.fit = fit
    this.ppu = h / (2 * 10 * Math.tan((35 * Math.PI) / 360))
    const ppu = this.ppu
    const m = this.mobile
    const w = Math.min(cvw, vw)
    this.vw = w
    /** visible height (≤ h): px layout uses it, world conversions use the canvas height h */
    const H = Math.min(h, vhIn)
    this.vh = H
    /** view shift that centres the visible area on the canvas centre */
    const vis = (w - cvw) / (2 * cvw)
    if (!m) {
      // desktop: beat text in a left column; the subject lives between it and the chapter rail
      const textRight = Math.min(w * 0.4, 606)
      const areaL = textRight + 30
      const areaR = w - 150
      const subjW = Math.max(420, Math.min(860, areaR - areaL))
      const subjCx = (areaL + areaR) / 2
      const half = subjW / 2 / ppu
      this.SX = subjCx / w - 0.5
      this.SY = 0
      this.SXlab = -0.13
      this.SYlab = 0.04
      this.Ls = Math.min(4.6, 1.72 * half)
      this.L1 = Math.min(3.7, 1.36 * half)
      this.L3 = Math.min(3.6, 1.3 * half)
      this.L4 = Math.min(4.2, 1.5 * half)
      this.L6 = 2.1
      this.Llab = Math.min(3.6, (w * 0.36) / ppu)
      this.cx1 = -0.22 * half
      this.cy1 = 0.42
      this.cx3 = -0.3 * half
      // catalogue row, lower half, centred on the screen
      const sp = Math.min(1.6 * ppu, (w - 220) / 5)
      this.loupeR = Math.min(90, sp * 0.4)
      const rowY = H * 0.655
      this.slots = [-2, -1, 0, 1, 2].map((i) => ({
        x: w / 2 + i * sp,
        y: rowY,
      }))
      // ladders (px)
      this.lad2 = {
        x: subjCx + 0.1 * subjW,
        y: H * 0.74,
        w: 0.26 * subjW,
        h: Math.min(60, H * 0.066),
      }
      // Beat 2: the shrunken string sits left of the ladder, clear of its N labels
      const ladL = this.lad2.x - 34 - 30
      const strR = ladL - 12
      this.slide2 = Math.max(0.45, Math.min(0.7, (strR - (textRight + 16)) / (this.Ls * ppu)))
      this.cx2 = (strR - subjCx) / ppu - (this.Ls * this.slide2) / 2
      this.lad3 = {
        x: subjCx + 0.12 * subjW,
        y: H * 0.3,
        w: 0.18 * subjW,
        h: Math.min(24, H * 0.027),
      }
      this.lad5 = {
        x: subjCx - 0.34 * subjW,
        y: H * 0.63,
        w: 0.44 * subjW,
        h: Math.min(54, H * 0.058),
      }
      this.aOff = 34
      this.count5 = 7
      this.strip5 = {
        x: subjCx - 0.42 * subjW,
        y: H * 0.82,
        w: 0.86 * subjW,
        h: 0,
      }
      this.ladLab = {
        x: Math.max(118, w * 0.09),
        y: H - 64,
        w: Math.min(190, w * 0.14),
        h: Math.min(26, H * 0.029),
      }
      // the rung-0 zoom opens beside rung 0, between the ladder's tags and the lab panel
      const labL = this.ladLab.x + this.ladLab.w + 282
      const panelL = w - 56 - 118 - 360
      this.stripLab = {
        x: labL,
        y: this.ladLab.y,
        w: Math.max(220, Math.min(360, panelL - 40 - labL)),
        h: 0,
      }
      const cw = Math.min(118, subjW / 5.2)
      this.sm = {
        x: subjCx - (cw * 5) / 2,
        y: H * 0.27,
        w: cw,
        h: Math.min(84, H * 0.094),
      }
      this.inset = { x: areaR - 150, y: H - 215, w: 128, h: 128 }
    } else {
      // phones: beat text fills the lower half; every figure lives in a band across the top
      const subjW = w - 32
      const half = subjW / 2 / ppu
      this.SX = vis
      // subject centred at 20% of the visible height
      this.SY = 0.5 - (0.2 * H) / h
      this.SXlab = vis - 0.12 * (w / cvw)
      this.SYlab = 0.5 - (0.32 * H) / h
      this.Ls = 1.8 * half
      this.L1 = 1.6 * half
      this.L3 = 1.3 * half
      this.L4 = 1.7 * half
      this.L6 = 1.2
      this.Llab = 1.3 * half
      this.cx1 = 0
      this.cy1 = 0
      // Beat 2 on phones: the string stays on top, the ladder stacks below it
      this.cx2 = 0
      this.slide2 = 0.86
      this.cx3 = -0.18 * half
      const sp = (w - 24) / 5
      this.loupeR = Math.min(34, sp * 0.43)
      const rowY = H * 0.235
      this.slots = [-2, -1, 0, 1, 2].map((i) => ({
        x: w / 2 + i * sp,
        y: rowY,
      }))
      this.lad2 = { x: 62, y: H * 0.47, w: Math.min(200, w - 62 - 110), h: Math.min(20, H * 0.024) }
      this.lad3 = { x: 44, y: H * 0.41, w: Math.min(120, w * 0.3), h: 13 }
      this.lad5 = { x: 52, y: H * 0.3, w: Math.min(190, w - 52 - 150), h: Math.min(22, H * 0.026) }
      this.aOff = 16
      this.count5 = 5
      this.strip5 = { x: 56, y: H * 0.458, w: w - 56 - 30, h: 0 }
      this.ladLab = { x: w - 58, y: H * 0.515, w: 38, h: 12 }
      this.stripLab = { x: 48, y: H * 0.48, w: w - 84, h: 0 }
      const cw = (w - 32) / 5
      this.sm = { x: 16, y: H * 0.17, w: cw, h: Math.max(52, Math.min(58, H * 0.066)) }
      this.inset = { x: w - 16 - 90, y: H * 0.345, w: 90, h: 90 }
    }
  }
}

export class Shared {
  layout = new Layout()
  // frame
  B = 0
  t = 0
  dt = 0
  frozen = false
  reduced = false
  presence = 0
  active = false
  inLab = false
  // camera
  yaw = 0
  pitch = 0
  dist = 10
  sx = 0
  sy = 0
  /** px per world unit at z = 0 for the current camera distance */
  ppu = 100
  // thread (local frame: centred at (thCx, thCy), x ∈ [−L/2, L/2] before group scale)
  thCx = 0
  thCy = 0
  thL = 4.2
  /** log10 of the far-view shrink (0 = close) */
  logShrink = 0
  thScale = 1
  /** extra (non-far-view) group scale, e.g. Beat 2's slide-left */
  thSlide = 1
  wH1 = 1
  h1Op = 1
  basis = 1
  amp = new Float64Array(MODES)
  tgt = new Float64Array(MODES)
  phase = new Float64Array(MODES)
  omega = 2 * Math.PI * 0.45
  psi = 0
  swirl = 0
  jitter = 0
  /** static (non-oscillating) displacement shape, units of L, and its weight */
  staticW = 0
  statics = new Float32Array(256)
  /** extra rigid vertical offset (FREE zero mode while dragging), world */
  offY = 0
  thOp = 0
  thInt = 1
  warmth = 1
  envelope = 0
  dotted = 0
  /** on-screen length of the (far-viewed) string in px */
  lenPx = 600
  pointW = 0
  pointHalo = 4
  h0Op = 0
  // state descriptors (for labels)
  N = 0
  K = 0
  /** swirl sign in the lab (+1 ↻, −1 ↺, 0 straight) */
  spinSign = 0
  /** Beat-1 pluck: 0..1 static tent pull, ghosts split */
  ghostSplit = 0
  ghostOp = 0
  ghostC = new Float64Array(4)
  pegsOp = 0
  pinnedLook = 0
  nodesOp = 0
  nodesN = 1
  /** 0 pinned node layout, 1 free node layout */
  nodesFree = 0
  compassOp = 0
  /** lab: Higgs "into hidden circle" pose */
  higgs = 0
  /** lab: graviton glyph */
  grav = 0
  // catalogue (Beats 4–5): world position, alpha, halo px, loupe opening, loupe radius (world)
  cat = Array.from({ length: 5 }, () => ({
    x: 0,
    y: 0,
    a: 0,
    halo: 4,
    open: 0,
  }))
  loupeRw = 0.6
  // Beat 6: the two copies (world), their scale and progress
  c1x = 0
  c1y = 0
  c2x = 0
  c2y = 0
  b6scale = 1
  b6op = 0
  /** screen px of the compass centre (for its labels) */
  compassX = 0
  compassY = 0
  compassZ = 0
  compassR = 0.5
  /** the dial's IN direction (x, z) */
  compassVx = 0
  compassVz = 1
}

/** Rung N's y (px) on a ladder rect (rung 0 at rect.y, rect.h px per level). */
export const rungY = (r: Rect, N: number) => r.y - N * r.h
