/*
 * Screen-space composition for every beat. The stage is a figure drawn in light: all positions
 * are computed here in CSS pixels (float64), and both layers (WebGL + the SVG/DOM diagram) read
 * the same numbers, so they line up exactly. The camera never moves (HANDOFF.camera).
 */
import { HANDOFF } from '@/core/handoff'
import { S_MAX, S_MIN } from './model'

export interface Layout {
  /** visible content width (px) — compose within this */
  W: number
  /** canvas width (px) — the WebGL origin sits at Wc / 2 */
  Wc: number
  H: number
  mobile: boolean
  /** world units per CSS px at z = 0 */
  u: number
  hvis: number
  /** text column's right edge (desktop, left-aligned beats) */
  textR: number
  /** the Ruler (horizontal) */
  rx0: number
  rx1: number
  ry: number
  /** energy axis y */
  ey: number
  /** Beat 6: the Ruler's y (cards sit below it on desktop) */
  ry6: number
  cardsBelow: boolean
  /** label tier spacing and font scale */
  tier: number
  /** Beat 1 zoom centre (px) */
  zx: number
  zy: number
  /** Beat 4 map: ring centre and radius (px) */
  mx: number
  my: number
  mR: number
  /** Lab map: ring centre and radius (px) */
  lx: number
  ly: number
  lR: number
  /** magnifier (px) */
  gx: number
  gy: number
  gR: number
  /** Beat 5 chart rectangle */
  c0x: number
  c1x: number
  c0y: number
  c1y: number
  /** Beat 6 card grid */
  cardX0: number
  cardX1: number
  cardY0: number
  cardW: number
  /** desktop: the theory-check cards (second row) run wider, below the rail's label band */
  cardW2: number
  cardH: number
  cardCols: number
  /** no-go rectangle for the right-edge chapter rail's active label (desktop) */
  rail: [number, number, number, number] | null
  /** the beat text block (desktop: top-left) — labels keep out of it */
  text: [number, number, number, number] | null
}

export function makeLayout(Wc: number, H: number, visibleW = Wc): Layout {
  // phones can report a layout viewport wider than the visible one (shared-chrome overflow); compose in what is visible
  const W = Math.min(Wc, visibleW)
  const hvis = 2 * HANDOFF.camera.position[2] * Math.tan(((HANDOFF.camera.fov * Math.PI) / 180) / 2)
  const u = hvis / H
  const mobile = W < 720 || W / H < 0.9
  if (mobile) {
    const rx0 = 22
    const rx1 = W - 22
    const ry = Math.round(0.29 * H)
    return {
      W,
      Wc,
      H,
      mobile,
      u,
      hvis,
      textR: 0,
      rx0,
      rx1,
      ry,
      ey: ry + 72,
      ry6: Math.round(0.42 * H),
      cardsBelow: false,
      tier: 22,
      zx: W * 0.5,
      zy: H * 0.3,
      mx: W * 0.43,
      my: H * 0.25,
      mR: 0.26 * Math.min(W, H),
      lx: W * 0.5,
      ly: H * 0.25,
      lR: 0.27 * Math.min(W, H),
      gx: W - 48,
      gy: H * 0.12,
      gR: 30,
      c0x: W * 0.17,
      c1x: W - 16,
      // the chart keeps to the top third: the beat text (six lines + caption) rises to ~0.5H
      c0y: Math.max(H * 0.09, 96), // below the (possibly two-line) chapter menu
      c1y: H * 0.34,
      cardX0: 14,
      cardX1: W - 14,
      cardY0: Math.max(64, H * 0.08),
      cardW: (W - 28 - 8) / 2,
      cardW2: (W - 28 - 8) / 2,
      cardH: 44,
      cardCols: 2,
      rail: null,
      text: null,
    }
  }
  // the Ruler stops short of the chapter rail's active label on the right edge
  const rx0 = W >= 1100 ? Math.max(124, 0.07 * W) : Math.max(40, 0.05 * W)
  const rx1 = W - (W >= 860 ? Math.max(262, 0.18 * W) : 60)
  // the Ruler sits a little above centre (content pack: 55%) so its label tiers fill the middle band
  const ry = Math.round(0.58 * H)
  const panel = W > 1100 ? 420 : 400
  const labW = W - panel
  // route cards: the four experimental routes in a row (their leaders rise to the Ruler), the two
  // theory checks beneath; the grid stops short of the chapter rail's active label on the right
  const cardX1 = Math.min(W - Math.max(80, 0.055 * W), W - 250)
  const cardX0 = rx0 + 24
  const cardCols = 4
  const cardGap = 12
  return {
    W,
    Wc,
    H,
    mobile,
    u,
    hvis,
    textR: Math.min(0.36 * W, 520),
    rx0,
    rx1,
    ry,
    ey: ry + 96,
    // Beat 6 sits higher: the magnified band takes the upper right, the route cards the middle band
    ry6: Math.round(0.47 * H),
    cardsBelow: true,
    tier: 28,
    zx: W * 0.63,
    zy: H * 0.45,
    mx: W * 0.575,
    my: H * 0.44,
    mR: 0.29 * Math.min(W, H),
    lx: Math.max(labW * 0.52, 360),
    ly: H * 0.47,
    lR: 0.3 * Math.min(labW - 80, H),
    gx: W - Math.max(190, 0.13 * W),
    gy: H * 0.19,
    gR: 58,
    c0x: Math.max(0.44 * W, 560),
    c1x: W - Math.max(250, 0.16 * W),
    c0y: H * 0.13,
    c1y: H * 0.78,
    cardX0,
    cardX1,
    cardY0: Math.round(0.47 * H) + 70,
    cardW: (cardX1 - cardX0 - (cardCols - 1) * cardGap) / cardCols,
    cardW2: Math.min(520, (W - Math.max(80, 0.055 * W) - cardX0 - cardGap) / 2),
    cardH: 150,
    cardCols,
    // chapter rail: the active item (index 10 of 12) sits at ~50% + 97px, its label ~220px wide
    rail: [W - 240, H / 2 + 72, W, H / 2 + 124],
    text: [0, 0, Math.min(0.36 * W, 520) + 10, Math.round(0.44 * H)],
  }
}

/** px → world (z = 0) */
export const wx = (L: Layout, px: number) => (px - L.Wc / 2) * L.u
export const wy = (L: Layout, py: number) => (L.H / 2 - py) * L.u

/** Ruler mapping for a visible window [sL (left, big) … sR (right, small)]. */
export const rulerX = (L: Layout, s: number, sL = S_MAX, sR = S_MIN) => L.rx0 + ((sL - s) / (sL - sR)) * (L.rx1 - L.rx0)

export const hitsRail = (L: Layout, x0: number, y0: number, x1: number, y1: number) => {
  for (const r of [L.rail, L.text]) if (r && x1 > r[0] && x0 < r[2] && y1 > r[1] && y0 < r[3]) return true
  return false
}
