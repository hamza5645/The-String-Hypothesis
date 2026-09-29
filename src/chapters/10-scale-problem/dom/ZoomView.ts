/*
 * Beat 1 — sixty-two powers of ten. Chapter 1's zoom, run backwards: decade rings (dashed where no
 * experiment has looked, solid from ~10⁻¹⁹ m up) shrink toward the H0 point while ghost layers pass.
 * Hairline layers live here; point-cloud layers are WebGL (ZoomClouds). Positions are float64 ratios.
 */
import { smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import { zoomHz, type StageState } from '../choreo'
import type { Layout } from '../layout'
import { AU, sup } from '../model'
import { ZOOM_LAYERS, scaleName } from '../zoomLayers'
import { LAKE, geo } from '../landmarks'
import { SI, ZOOM_END, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, div, label, op, path, sa, span, svg, txt } from './dom'

/**
 * Visibility of a layer of physical diameter D at zoom s: on while D/L ∈ [lo, hi]. It enters softly at
 * hi, and recedes slowly (a smoothstep over 0.6 decades in log space) as it shrinks toward lo.
 */
export function layerVis(D: number, s: number, lo: number, hi: number, soft = 0.22) {
  const r = Math.log10(D) - s
  return smoothstep(Math.log10(lo), Math.log10(lo) + 0.6, r) * (1 - smoothstep(Math.log10(hi) - soft, Math.log10(hi) + soft, r))
}

/** The universe circle during Beat 1 (centre x, y and radius in px): shrinks onto the Ruler's end glyph. */
export const uniCircle = new Float64Array(3)
export function universeCircle(S: StageState, L: Layout, p1: number) {
  const f = prefersReducedMotion() ? 0 : smoothstep(ZOOM_END, ZOOM_END + 0.12, p1)
  const ru0 = 0.5 * 8.8e26 * (zoomHz(L) / Math.pow(10, S.zoomS))
  uniCircle[0] = S.zcx + (L.rx0 - S.zcx) * f
  uniCircle[1] = S.zcy + (L.ry - (L.mobile ? 11 : 13) - S.zcy) * f
  uniCircle[2] = Math.exp(Math.log(ru0) + (Math.log(6) - Math.log(ru0)) * f)
  return uniCircle
}

interface Ring {
  c: SVGCircleElement
  lbl: HTMLDivElement
}

const ORBITS = [0.387, 0.723, 1, 1.524, 5.203, 9.537, 19.19, 30.07]

export class ZoomView implements View {
  private L: Layout
  private g: SVGGElement
  private rings: Ring[] = []
  private edge: SVGCircleElement
  private edgeLbl: HTMLDivElement
  private dot: SVGCircleElement
  private zread: HTMLDivElement
  private zv: HTMLSpanElement
  private zsup: HTMLElement
  private zk: HTMLSpanElement
  private cells: SVGGElement
  private earth: SVGGElement
  private moon: SVGCircleElement
  private lake: SVGGElement
  private solar: SVGGElement
  private orbits: SVGCircleElement[] = []
  private uni: SVGCircleElement
  private uniFill: SVGCircleElement
  private tags: { D: number; lo: number; hi: number; el: HTMLDivElement; uni: boolean }[] = []

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    this.L = c.L
    this.g = svg('g', {}, c.back)
    this.edge = svg('circle', { fill: 'none', stroke: '#ECE6D9', 'stroke-opacity': 0.12, 'stroke-width': 14 }, this.g)
    for (let i = 0; i < 5; i++) {
      const cc = svg('circle', { fill: 'none', 'stroke-width': 1 }, this.g)
      this.rings.push({ c: cc, lbl: div('sp-lbl sp-ring-lbl', this.box) })
    }
    this.edgeLbl = label(this.box, 'sp-call sp-edge-lbl', ['EDGE OF DIRECT MEASUREMENT', '~10⁻¹⁹ m · rings turn solid'])
    // a receded world: once a layer is smaller than ~2% of the view it is a labelled dot at the centre
    this.dot = svg('circle', { r: 1.7, fill: '#ECE6D9' }, this.g)
    // the central readout: the current decade, and what lives there
    this.zread = div('sp-zread', this.box)
    this.zv = span('sp-zread__v', this.zread)
    const ten = document.createElement('span')
    ten.textContent = '10'
    this.zv.appendChild(ten)
    this.zsup = document.createElement('sup')
    this.zv.appendChild(this.zsup)
    const unit = document.createElement('small')
    unit.textContent = 'm'
    this.zv.appendChild(unit)
    this.zk = span('sp-zread__k', this.zread, '')

    // cells: a Voronoi mosaic (~10 µm cells), unit = 50 µm
    this.cells = svg('g', {}, this.g)
    for (const [d, a] of voronoiCells()) {
      path(this.cells, { d, fill: 'none', stroke: '#86A8D8', 'stroke-opacity': (0.55 * a).toFixed(3), 'stroke-width': 0.9, 'vector-effect': 'non-scaling-stroke' })
    }
    // Lake Geneva (metres, centred on the lake): the hairline outline Beat 4's map returns to
    this.lake = svg('g', {}, this.g)
    {
      const pts = LAKE.map(([la, lo]) => geo(la, lo))
      const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length
      const my = pts.reduce((a, p) => a + p[1], 0) / pts.length
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x - mx).toFixed(0)},${(y - my).toFixed(0)}`).join('') + 'Z'
      path(this.lake, { d, fill: '#86A8D8', 'fill-opacity': 0.04, stroke: '#9AA0AE', 'stroke-opacity': 0.7, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })
    }
    // Earth: limb + terminator (unit = radius)
    this.earth = svg('g', {}, this.g)
    svg('circle', { r: 1, fill: 'none', stroke: '#ECE6D9', 'stroke-opacity': 0.75, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, this.earth)
    path(this.earth, { d: 'M0.26,-0.966 A0.34,1 0 0,1 0.26,0.966', fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.6, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })
    svg('circle', { r: 1.012, fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.18, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke' }, this.earth)
    // the Moon's orbit around the Earth (hairline, Field)
    this.moon = svg('circle', { fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.6, 'stroke-width': 1 }, this.g)
    // the Sun and the planets' orbits (unit = 1 AU)
    this.solar = svg('g', {}, this.g)
    svg('circle', { r: 0.02, fill: '#ECE6D9' }, this.solar)
    for (const a of ORBITS) this.orbits.push(svg('circle', { r: a, fill: 'none', stroke: '#86A8D8', 'stroke-width': 0.9, 'vector-effect': 'non-scaling-stroke' }, this.solar))
    // the observable universe: one hairline circle with a faint mottled fill
    this.uniFill = svg('circle', { fill: 'url(#sp-uni)' }, this.g)
    this.uni = svg('circle', { fill: 'none', stroke: '#ECE6D9', 'stroke-opacity': 0.8, 'stroke-width': 1 }, this.g)

    Object.values(ZOOM_LAYERS).forEach((z) => this.tags.push({ D: z.D, lo: z.lo, hi: Math.min(z.hi, 1.4), el: label(this.box, 'sp-layer-tag', z.label), uni: z.id === 'universe' }))
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const inB1 = T >= SI.decades && T < SI.quarter
    const on = inB1 ? 1 : 0
    op(this.g, on)
    op(this.box, on)
    if (!on) return
    const p1 = local(T, 'decades')
    const s = S.zoomS
    const Hz = zoomHz(L)
    const cx = S.zcx
    const cy = S.zcy
    const zOn = S.zoomOn
    const R = (D: number) => 0.5 * D * (Hz / Math.pow(10, s)) // on-screen radius (px) of diameter D

    // decade rings: dashed below the edge of measurement, solid above
    const k0 = Math.floor(s) - 2
    this.rings.forEach((r, i) => {
      const k = k0 + i
      const rad = R(Math.pow(10, k))
      const a = smoothstep(7, 20, rad) * (1 - smoothstep(0.42 * Hz, 0.56 * Hz, rad)) * zOn * smoothstep(0.02, 0.07, p1)
      op(r.c, a)
      sa(r.c, 'cx', cx)
      sa(r.c, 'cy', cy)
      sa(r.c, 'r', Math.max(0.1, rad))
      const solid = k >= -19
      sa(r.c, 'stroke', solid ? '#ECE6D9' : '#86A8D8')
      sa(r.c, 'stroke-opacity', solid ? 0.42 : 0.5)
      sa(r.c, 'stroke-dasharray', solid ? 'none' : '3 5')
      op(r.lbl, a * smoothstep(40, 70, rad))
      txt(r.lbl, `10${sup(k)} m`)
      at(r.lbl, cx + rad * 0.707 + 4, cy - rad * 0.707 - 4, ' translate(0,-100%)')
    })
    const re = R(1e-19)
    const ea = smoothstep(10, 40, re) * (1 - smoothstep(0.5 * Hz, 0.6 * Hz, re)) * zOn
    op(this.edge, ea)
    sa(this.edge, 'cx', cx)
    sa(this.edge, 'cy', cy)
    sa(this.edge, 'r', re)
    op(this.edgeLbl, ea * smoothstep(60, 120, re) * (1 - smoothstep(0.34 * Hz, 0.46 * Hz, re)))
    at(this.edgeLbl, cx - re * 0.707 - 8, cy + re * 0.707 + 8, ' translate(-100%,0)')
    // the central readout ticks decade by decade
    const za = zOn * smoothstep(0.02, 0.06, p1)
    op(this.zread, za)
    if (za > 0) {
      const k = Math.round(s)
      const e = s > 26.8 ? 27 : k
      txt(this.zsup, e < 0 ? `−${-e}` : String(e))
      txt(this.zk, scaleName(s))
      if (L.mobile) at(this.zread, cx, 84, ' translate(-50%,0)')
      else at(this.zread, cx, L.H - 64, ' translate(-50%,-100%)')
    }

    // hairline ghost layers
    const Z = ZOOM_LAYERS
    const vc = layerVis(Z.cells.D, s, Z.cells.lo, Z.cells.hi) * zOn * smoothstep(-1.9, -1.4, Math.log10(Z.cells.D) - s)
    op(this.cells, vc)
    if (vc > 0) sa(this.cells, 'transform', `translate(${cx} ${cy}) scale(${(R(1e-4)).toFixed(4)})`)
    const vl = layerVis(Z.lake.D, s, Z.lake.lo, Z.lake.hi) * zOn
    op(this.lake, vl)
    if (vl > 0) {
      const k = Hz / Math.pow(10, s)
      sa(this.lake, 'transform', `translate(${cx} ${cy}) scale(${k.toExponential(5)} ${(-k).toExponential(5)})`)
    }
    const ve = layerVis(Z.earth.D, s, Z.earth.lo, Z.earth.hi) * zOn
    op(this.earth, ve)
    if (ve > 0) sa(this.earth, 'transform', `translate(${cx} ${cy}) scale(${R(1.2742e7).toFixed(4)})`)
    const vm = layerVis(Z.moon.D, s, Z.moon.lo, Z.moon.hi) * zOn * smoothstep(2.5, 6, R(Z.moon.D))
    op(this.moon, vm)
    if (vm > 0) {
      sa(this.moon, 'cx', cx)
      sa(this.moon, 'cy', cy)
      sa(this.moon, 'r', R(Z.moon.D))
    }
    const vs = layerVis(Z.solar.D, s, Z.solar.lo, Z.solar.hi) * zOn
    op(this.solar, vs)
    if (vs > 0) {
      const sc = R(2 * AU)
      sa(this.solar, 'transform', `translate(${cx} ${cy}) scale(${sc.toFixed(4)})`)
      ORBITS.forEach((a, i) => {
        const rp = a * sc
        sa(this.orbits[i], 'stroke-opacity', (0.55 * smoothstep(3, 14, rp) * (1 - smoothstep(0.5 * Hz, 0.62 * Hz, rp))).toFixed(3))
      })
    }
    // the universe circle: shrinks and slides to the Ruler's left end, becoming its end glyph
    const f = smoothstep(ZOOM_END, ZOOM_END + 0.12, p1)
    const [ux, uy, ru] = universeCircle(S, L, p1)
    const vu = layerVis(Z.universe.D, s, Z.universe.lo, Z.universe.hi) * (1 - smoothstep(ZOOM_END + 0.1, ZOOM_END + 0.12, p1))
    op(this.uni, vu)
    op(this.uniFill, vu * (1 - f))
    for (const el of [this.uni, this.uniFill]) {
      sa(el, 'cx', ux)
      sa(el, 'cy', uy)
      sa(el, 'r', ru)
    }
    let dotA = 0
    for (const t of this.tags) {
      const v = layerVis(t.D, s, t.lo, t.hi) * zOn
      op(t.el, v)
      if (v <= 0) continue
      // the universe's tag rides its circle as it shrinks onto the Ruler's end
      const ox = t.uni ? ux : cx
      const oy = t.uni ? uy : cy
      const rr = t.uni ? ru : Math.min(R(t.D), 0.46 * Hz)
      if (t.uni) op(t.el, v * (1 - smoothstep(ZOOM_END, ZOOM_END + 0.06, p1)))
      if (!t.uni) dotA = Math.max(dotA, v * (1 - smoothstep(-1.9, -1.55, Math.log10(t.D) - s)))
      if (L.mobile) at(t.el, ox, oy + rr + 10, ' translate(-50%,0)')
      else at(t.el, ox + rr * 0.8 + 14, oy - rr * 0.6 - 6, ' translate(0,-100%)')
    }
    op(this.dot, dotA)
    sa(this.dot, 'cx', cx)
    sa(this.dot, 'cy', cy)
  }
}

/** A Voronoi mosaic in a unit disc (half-plane clipping), with per-cell edge fade. Computed once. */
function voronoiCells(): [string, number][] {
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const pts: [number, number][] = []
  const sp = 0.2
  for (let j = -7; j <= 7; j++)
    for (let i = -7; i <= 7; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * sp + (rnd() - 0.5) * sp * 0.7
      const y = j * sp * 0.866 + (rnd() - 0.5) * sp * 0.7
      if (x * x + y * y < 1.25) pts.push([x, y])
    }
  const out: [string, number][] = []
  for (let a = 0; a < pts.length; a++) {
    const [px, py] = pts[a]
    const dist = Math.hypot(px, py)
    if (dist > 0.98) continue
    let poly: [number, number][] = [
      [px - 1, py - 1],
      [px + 1, py - 1],
      [px + 1, py + 1],
      [px - 1, py + 1],
    ]
    for (let b = 0; b < pts.length; b++) {
      if (a === b) continue
      const [qx, qy] = pts[b]
      if (Math.abs(qx - px) > 0.6 || Math.abs(qy - py) > 0.6) continue
      // keep the half-plane closer to a: (x − m)·(q − p) ≤ 0
      const mx = (px + qx) / 2
      const my = (py + qy) / 2
      const nx = qx - px
      const ny = qy - py
      const next: [number, number][] = []
      for (let k = 0; k < poly.length; k++) {
        const A = poly[k]
        const B = poly[(k + 1) % poly.length]
        const da = (A[0] - mx) * nx + (A[1] - my) * ny
        const db = (B[0] - mx) * nx + (B[1] - my) * ny
        if (da <= 0) next.push(A)
        if (da * db < 0) {
          const t = da / (da - db)
          next.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t])
        }
      }
      poly = next
      if (poly.length < 3) break
    }
    if (poly.length < 3) continue
    // shrink slightly toward the seed: cells read as separate membranes
    const d =
      poly.map(([x, y], k) => `${k ? 'L' : 'M'}${(px + (x - px) * 0.9).toFixed(4)},${(py + (y - py) * 0.9).toFixed(4)}`).join('') +
      `Z M${(px + 0.025).toFixed(4)},${py.toFixed(4)} a0.025,0.025 0 1,0 -0.05,0 a0.025,0.025 0 1,0 0.05,0`
    out.push([d, 1 - smoothstep(0.45, 0.98, dist)])
  }
  return out
}
