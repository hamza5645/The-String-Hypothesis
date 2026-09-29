/*
 * Beat 5 — a floor, not just a distance. The Planck ring seen from a ~20 km window is a straight line;
 * a proton on it radiates its energy away. The line becomes the E-axis of the resolution floor:
 * Δx ≳ ħc/E + 2GE/c⁴ (heuristic, CONJECTURED), with the string-scattering variant (DERIVED).
 * As the bead nears the minimum the chart's window closes in on the floor (a camera move in log space).
 */
import { lerp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import type { Layout } from '../layout'
import { DX_MIN, E_LHC, E_STAR, EP, HBARC, K_BH, fmtEnergy, sci, stringDx, sup } from '../model'
import { SI, b5BeadLogE, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, chip, div, label, line, op, path, sa, setLine, span, svg, txt } from './dom'

// full window (content pack) and the close-up on the floor
const FULL = [3, 23, -15, -36]
const NEAR = [11, 23, -25, -36.3]
const N = 220
const SPARKS = 150

const CURVES: ((E: number) => number)[] = [(E) => HBARC / E, (E) => K_BH * E, (E) => HBARC / E + K_BH * E, (E) => stringDx(E)]

export class ChartView implements View {
  private L: Layout
  private g: SVGGElement
  private axX: SVGLineElement
  private axY: SVGLineElement
  private ticks: SVGPathElement
  private grid: SVGPathElement
  private xLbl: HTMLDivElement[] = []
  private yLbl: HTMLDivElement[] = []
  private titleX: HTMLDivElement
  private titleY: HTMLDivElement
  private curves: SVGPathElement[]
  private l1: HTMLDivElement
  private l2: HTMLDivElement
  private lMin: HTMLDivElement
  private lS: HTMLDivElement
  private mLHC: SVGLineElement
  private mP: SVGLineElement
  private mLHCl: HTMLDivElement
  private mPl: HTMLDivElement
  private minDot: SVGCircleElement
  private bead: SVGCircleElement
  private probe: SVGPathElement
  private bh: SVGCircleElement
  private bhRing: SVGCircleElement
  private read: HTMLDivElement
  private bhTag: HTMLDivElement
  private tagSync: HTMLDivElement
  private tagLHC: HTMLDivElement
  private lens: number[] = []
  private key = ''
  private labels: HTMLDivElement[] = []
  private sparkG: SVGGElement
  private sparks: SVGLineElement[] = []
  private rnd = new Float64Array(SPARKS * 3)
  // current window
  private e0 = FULL[0]
  private e1 = FULL[1]
  private d0 = FULL[2]
  private d1 = FULL[3]

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    this.L = c.L
    this.g = svg('g', {}, c.mid)
    this.grid = path(this.g, { class: 'sp-hair', stroke: '#9AA0AE', 'stroke-opacity': 0.06, fill: 'none' })
    this.axX = line(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-opacity': 0.9 })
    this.axY = line(this.g, { class: 'sp-hair sp-ink3' })
    this.ticks = path(this.g, { class: 'sp-hair sp-ink3', fill: 'none' })
    for (let e = 3; e <= 23; e++) this.xLbl.push(div('sp-lbl sp-tick', this.box, `10${sup(e)}`))
    for (let e = -15; e >= -36; e--) this.yLbl.push(div('sp-lbl sp-tick', this.box, `10${sup(e)} m`))
    this.titleX = label(this.box, 'sp-axis-title sp-field', ['COLLISION ENERGY E (GeV) →'])
    this.titleY = label(this.box, 'sp-axis-title', this.L.mobile ? ['SMALLEST SIZE Δx · SMALLER IS LOWER ↓'] : ['SMALLEST RESOLVABLE SIZE Δx', 'smaller is lower ↓'])
    this.curves = [
      path(this.g, { fill: 'none', stroke: '#86A8D8', 'stroke-width': 1.1 }),
      path(this.g, { fill: 'none', stroke: '#86A8D8', 'stroke-width': 1.1, 'stroke-dasharray': '5 4' }),
      path(this.g, { fill: 'none', stroke: '#ECE6D9', 'stroke-width': 2 }),
      path(this.g, { fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.85, 'stroke-width': 1.3, 'stroke-dasharray': '0.5 4', 'stroke-linecap': 'round' }),
    ]
    // the curves' drawn lengths (px) for the dash reveal: summed from their own segments, since
    // getTotalLength() would force a synchronous layout while the Scene mounts
    this.lens = this.redraw()
    this.l1 = label(this.box, 'sp-curve-lbl sp-field', ['QUANTUM BLUR', 'ħc / E'])
    this.l2 = label(this.box, 'sp-curve-lbl sp-field', ['BLACK-HOLE SIZE', '2GE / c⁴'])
    this.lMin = label(this.box, 'sp-curve-lbl', ['FLOOR ≈ 3 ℓP', `at ${sci(E_STAR, 1, true)} GeV`])
    this.lS = div('sp-note sp-string-note', this.box)
    const hs = div('sp-note__head', this.lS)
    chip('derived', hs)
    span('sp-note__k', hs, 'STRING SCATTERING')
    span('sp-note__t', this.lS, 'String calculations: hit a string hard enough, and it spreads out. Drawn for an assumed ℓs = 10⁻³⁴ m.')
    this.mLHC = line(this.g, { class: 'sp-hair sp-ink3', 'stroke-dasharray': '2 3' })
    this.mP = line(this.g, { class: 'sp-hair sp-ink3', 'stroke-dasharray': '2 3' })
    this.mLHCl = label(this.box, 'sp-call', ['LHC'])
    this.mPl = label(this.box, 'sp-call', ['PLANCK'])
    this.minDot = svg('circle', { r: 3, fill: 'none', stroke: '#ECE6D9', 'stroke-width': 1 }, this.g)
    this.probe = path(this.g, { fill: 'none', stroke: '#ECE6D9', 'stroke-opacity': 0.55, 'stroke-width': 0.8 })
    this.bh = svg('circle', { fill: '#05070B', stroke: 'none' }, this.g)
    this.bhRing = svg('circle', { fill: 'none', stroke: '#86A8D8', 'stroke-width': 1.2 }, this.g)
    this.bead = svg('circle', { r: 8, fill: 'url(#sp-bead)' }, this.g)
    this.read = div('sp-lbl sp-chart-read', this.box)
    this.bhTag = label(this.box, 'sp-call sp-call--field sp-call--r sp-bh-tag', ['MORE ENERGY →', 'BIGGER BLACK HOLE →', 'BLURRIER VIEW'])

    this.tagSync = div('sp-note sp-sync', this.box)
    const h1 = div('sp-note__head', this.tagSync)
    chip('observed', h1)
    span('sp-note__k', h1, 'SYNCHROTRON RADIATION')
    span('sp-note__t', this.tagSync, 'At this energy, in LHC magnets: energy lost to radiation long before one lap.')
    this.tagLHC = label(this.box, 'sp-call sp-dim sp-sync2', ['LHC AT 6.8 TeV: ~6 keV PER LAP · ONE PART IN 10⁹'])
    // synchrotron sparks: forward-beamed streaks shed by the proton (Beat 5 prelude)
    this.sparkG = svg('g', {}, c.top)
    for (let i = 0; i < SPARKS; i++) this.sparks.push(line(this.sparkG, { stroke: '#ECE6D9', 'stroke-width': 1.1, 'stroke-linecap': 'round' }))
    let a = 12345
    for (let i = 0; i < SPARKS * 3; i++) {
      a = (a * 16807) % 2147483647
      this.rnd[i] = a / 2147483647
    }
    this.labels = [...this.xLbl, ...this.yLbl, this.titleX, this.titleY, this.l1, this.l2, this.lMin, this.lS, this.mLHCl, this.mPl, this.read, this.bhTag]
  }

  private x(le: number) {
    const L = this.L
    return L.c0x + ((le - this.e0) / (this.e1 - this.e0)) * (L.c1x - L.c0x)
  }
  private y(ld: number) {
    const L = this.L
    return L.c0y + ((this.d0 - ld) / (this.d0 - this.d1)) * (L.c1y - L.c0y)
  }
  /** rebuild the curve paths for the current window (clipped to the chart rectangle); returns their lengths */
  private redraw() {
    return CURVES.map((f, k) => {
      let d = ''
      let pen = false
      let len = 0
      let px = 0
      let py = 0
      for (let i = 0; i <= N; i++) {
        const le = this.e0 + ((this.e1 - this.e0) * i) / N
        const ld = Math.log10(f(Math.pow(10, le)))
        if (ld < this.d1 || ld > this.d0) {
          pen = false
          continue
        }
        const x = Number(this.x(le).toFixed(1))
        const y = Number(this.y(ld).toFixed(1))
        if (pen) len += Math.hypot(x - px, y - py)
        d += `${pen ? 'L' : 'M'}${x},${y}`
        px = x
        py = y
        pen = true
      }
      sa(this.curves[k], 'd', d || 'M0,0')
      return len
    })
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const inB5 = T >= SI.floor && T < SI.sideways
    const live = inB5 || S.chartOn > 0
    op(this.box, live ? 1 : 0)
    if (!live) {
      op(this.g, 0)
      op(this.sparkG, 0)
      return
    }
    const p = local(T, 'floor')
    // prelude tags (the straight Planck ring, radiating)
    const pre = inB5 ? smoothstep(0.16, 0.22, p) * (1 - smoothstep(0.3, 0.36, p)) : 0
    op(this.tagSync, pre)
    op(this.tagLHC, pre * smoothstep(0.19, 0.24, p))
    const lineY = S.map.ay
    if (L.mobile) {
      at(this.tagSync, 16, lineY - 150)
      at(this.tagLHC, 16, lineY + 22)
    } else {
      at(this.tagSync, Math.max(L.textR + 30, L.W * 0.36), lineY - 112)
      at(this.tagLHC, Math.max(L.textR + 30, L.W * 0.36), lineY + 22)
    }

    // the sparks (the bead itself is drawn in WebGL at the same place)
    const sOn = inB5 && p > 0.13 && p < 0.37
    op(this.sparkG, sOn ? 1 : 0)
    if (sOn) {
      const q = smoothstep(0.14, 0.3, p)
      const x0 = L.W * (L.mobile ? 0.12 : 0.5)
      const span = L.W * 0.15
      const fade = 1 - smoothstep(0.3, 0.36, p)
      for (let i = 0; i < SPARKS; i++) {
        const el = this.sparks[i]
        const qi = (i + 0.5) / SPARKS
        if (qi > q) {
          op(el, 0)
          continue
        }
        const age = q - qi
        const ang = (this.rnd[i * 3] - 0.5) * 0.18
        const v = (0.7 + 0.7 * this.rnd[i * 3 + 1]) * L.W * 1.2
        const d = age * v
        const hx = x0 + span * qi + Math.cos(ang) * d
        const hy = lineY + Math.sin(ang) * d
        const len = 8 + 18 * this.rnd[i * 3 + 2]
        setLine(el, hx - Math.cos(ang) * len, hy - Math.sin(ang) * len, hx, hy)
        op(el, (1 - qi) * Math.exp(-age * 4) * fade)
      }
    }

    const on = S.chartOn
    op(this.g, on)
    if (on <= 0) {
      for (const el of this.labels) op(el, 0)
      return
    }
    // the camera closes in on the floor
    const z = inB5 ? (prefersReducedMotion() ? (p > 0.66 ? 1 : 0) : smoothstep(0.58, 0.74, p)) : 1
    this.e0 = lerp(FULL[0], NEAR[0], z)
    this.e1 = lerp(FULL[1], NEAR[1], z)
    this.d0 = lerp(FULL[2], NEAR[2], z)
    this.d1 = lerp(FULL[3], NEAR[3], z)
    const key = z.toFixed(4)
    if (key !== this.key) {
      this.key = key
      this.redraw()
    }

    const draw = inB5 ? smoothstep(0.3, 0.42, p) : 1
    // the straight line narrows into the E axis
    const ax0 = L.c0x * draw
    const ax1 = L.c1x + (L.W - L.c1x) * (1 - draw)
    setLine(this.axX, ax0, L.c1y, ax1, L.c1y)
    const ya = inB5 ? smoothstep(0.34, 0.44, p) : 1
    setLine(this.axY, L.c0x, L.c1y, L.c0x, L.c1y - (L.c1y - L.c0y) * ya)
    const pxdX = (L.c1x - L.c0x) / (this.e1 - this.e0)
    const pxdY = (L.c1y - L.c0y) / (this.d0 - this.d1)
    const sx = pxdX > 44 ? 1 : pxdX > 20 ? 2 : 4
    const sy = L.mobile ? (pxdY > 30 ? 2 : 4) : pxdY > 44 ? 1 : pxdY > 30 ? 2 : 3
    let d = ''
    let gd = ''
    for (let e = Math.ceil(this.e0); e <= this.e1; e++) {
      const x = this.x(e)
      const major = e % sx === 0
      d += `M${x.toFixed(1)},${L.c1y}v${major ? 5 : 2.5}`
      if (major) gd += `M${x.toFixed(1)},${L.c1y}V${L.c0y}`
    }
    for (let e = Math.floor(this.d0); e >= this.d1; e--) {
      const y = this.y(e)
      const major = e % sy === 0
      d += `M${L.c0x},${y.toFixed(1)}h${major ? -5 : -2.5}`
      if (major) gd += `M${L.c0x},${y.toFixed(1)}H${L.c1x}`
    }
    sa(this.ticks, 'd', d)
    sa(this.grid, 'd', gd)
    op(this.ticks, ya)
    op(this.grid, ya)
    const lo = on * ya
    this.xLbl.forEach((el, i) => {
      const e = 3 + i
      const show = e >= this.e0 - 0.01 && e <= this.e1 + 0.01 && e % sx === 0
      op(el, show ? lo : 0)
      if (show) at(el, this.x(e), L.c1y + 8, ' translate(-50%,0)')
    })
    this.yLbl.forEach((el, i) => {
      const e = -15 - i
      const show = e <= this.d0 + 0.01 && e >= this.d1 - 0.01 && e % sy === 0
      op(el, show ? lo : 0)
      if (show) at(el, L.c0x - 9, this.y(e), ' translate(-100%,-50%)')
    })
    op(this.titleX, lo)
    op(this.titleY, lo)
    at(this.titleX, L.c1x, L.c1y + (L.mobile ? 22 : 26), ' translate(-100%,0)')
    at(this.titleY, L.c0x + (L.mobile ? 2 : 10), L.c0y - (L.mobile ? 4 : 8), ' translate(0,-100%)')

    // curves draw in (dash reveal, then plain once drawn)
    const k1 = inB5 ? smoothstep(0.38, 0.48, p) : 1
    const k2 = inB5 ? smoothstep(0.44, 0.54, p) : 1
    const k3 = inB5 ? smoothstep(0.5, 0.58, p) : 1
    const reveal = (i: number, k: number) => {
      const el = this.curves[i]
      if (k >= 1) sa(el, 'stroke-dasharray', i === 1 ? '5 4' : i === 3 ? '0.5 4' : 'none')
      else if (i !== 1) {
        sa(el, 'stroke-dasharray', `${this.lens[i]} ${this.lens[i]}`)
        sa(el, 'stroke-dashoffset', this.lens[i] * (1 - k))
      }
      op(el, i === 1 ? k : k > 0 ? 1 : 0)
    }
    reveal(0, k1)
    reveal(1, k2)
    reveal(2, k3)
    op(this.l1, on * k1)
    op(this.l2, on * k2)
    // curve labels ride their curves at a fixed fraction of the window
    const le1 = lerp(this.e0, this.e1, 0.13)
    at(this.l1, this.x(le1) + 10, this.y(Math.log10(HBARC / Math.pow(10, le1))) - 4, ' translate(0,-100%)')
    // the black-hole line's label sits where it rises out of the bottom of the frame
    const ldB = this.d1 + 0.6
    at(this.l2, this.x(ldB - Math.log10(K_BH)) - 12, this.y(ldB), ' translate(-100%,-50%)')
    const xm = this.x(Math.log10(E_STAR))
    const ym = this.y(Math.log10(DX_MIN))
    op(this.minDot, k3)
    sa(this.minDot, 'cx', xm)
    sa(this.minDot, 'cy', ym)
    op(this.lMin, on * smoothstep(0.66, 0.72, p))
    // phones: above-left of the minimum, clear of the black-hole line's label beneath
    if (L.mobile) at(this.lMin, xm - 8, ym - 8, ' translate(-100%,-100%)')
    else at(this.lMin, xm - 18, ym + 2, ' translate(-100%,-50%)')
    // markers
    const xl = this.x(Math.log10(E_LHC))
    const xp = this.x(Math.log10(EP))
    const mk = inB5 ? smoothstep(0.42, 0.5, p) : 1
    const lIn = xl >= L.c0x - 1 ? 1 : 0
    setLine(this.mLHC, xl, L.c1y, xl, L.c0y)
    setLine(this.mP, xp, L.c1y, xp, L.c0y)
    op(this.mLHC, mk * lIn)
    op(this.mP, mk)
    op(this.mLHCl, on * mk * lIn)
    op(this.mPl, on * mk)
    at(this.mLHCl, xl + 5, L.c0y + 2)
    at(this.mPl, xp + 5, L.c0y + 2)

    // the bead rides the floor curve; the probe narrows; past the minimum, a black hole grows
    const le = b5BeadLogE(p)
    const E = Math.pow(10, le)
    const dx = HBARC / E + K_BH * E
    const bx = this.x(le)
    const by = this.y(Math.log10(dx))
    const ba = inB5 ? smoothstep(0.47, 0.52, p) : 0
    op(this.bead, ba)
    sa(this.bead, 'cx', bx)
    sa(this.bead, 'cy', by)
    const over = Math.max(0, le - Math.log10(E_STAR))
    const spread = Math.max(0.6, 1 + 1.4 * (Math.log10(dx) - Math.log10(DX_MIN)))
    let pd = ''
    for (let i = -2; i <= 2; i++) pd += `M${(bx - 30 + i * 8).toFixed(1)},${(by - 44).toFixed(1)}L${(bx + i * spread).toFixed(1)},${(by - 3).toFixed(1)}`
    sa(this.probe, 'd', pd)
    op(this.probe, ba * (1 - smoothstep(0, 0.3, over)))
    const rbh = 3 + 8 * over
    const bha = ba * smoothstep(0.02, 0.25, over)
    op(this.bh, bha)
    op(this.bhRing, bha)
    for (const c of [this.bh, this.bhRing]) {
      sa(c, 'cx', bx)
      sa(c, 'cy', by)
      sa(c, 'r', rbh)
    }
    op(this.read, on * ba)
    txt(this.read, `E = ${fmtEnergy(E)} · Δx ≈ ${sci(dx, 2, true)} m`)
    if (L.mobile) at(this.read, 16, L.c1y + 40)
    else at(this.read, L.c0x + 16, L.c0y + 10)
    op(this.bhTag, on * bha * smoothstep(0.3, 0.6, over))
    at(this.bhTag, bx - rbh - 10, by - 8, ' translate(-100%,-100%)')

    // the string-scattering curve (DERIVED), drawn for an assumed ℓs
    const ks = inB5 ? smoothstep(0.84, 0.94, p) : 1
    op(this.curves[3], ks)
    op(this.lS, on * ks)
    // desktop: right of the PLANCK marker, above the dotted curve's rising branch (never across a line)
    if (L.mobile) at(this.lS, 16, L.c1y + 62)
    else at(this.lS, this.x(Math.log10(EP)) + 16, L.c0y + 36)
  }
}
