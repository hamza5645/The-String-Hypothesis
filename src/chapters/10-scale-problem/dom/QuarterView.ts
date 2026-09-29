/*
 * Beat 2 — the unexplored quarter. Paint what we know (solid ink to 10⁻¹⁸ m, the edge band, then
 * dashed field), then the slide: enlarge everything × 8.8 × 10³⁶ — on a log scale that is just a shift.
 */
import { easeInOutCubic, lerp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import type { Layout } from '../layout'
import { S_MAX, S_MIN } from '../model'
import { SI, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, chip, display, div, label, line, op, path, sa, setLine, span, svg, type Display } from './dom'

const SLIDE = Math.log10(8.8e36) // 36.94 decades: atom → observable universe

interface Token {
  s: number
  cap: HTMLDivElement
  hair: SVGPathElement
  res: HTMLDivElement
  row: number
}

export class QuarterView implements View {
  private L: Layout
  private g: SVGGElement
  private solid: SVGLineElement
  private band: SVGRectElement
  private dashed: SVGLineElement
  private brP: SVGPathElement
  private brU: SVGPathElement
  private lblP: HTMLDivElement
  private lblU: HTMLDivElement
  private tokens: Token[] = []
  private enlarge: HTMLDivElement
  private tree: SVGCircleElement
  private disp: Display | null = null
  private sum: HTMLDivElement | null = null
  private cap: HTMLDivElement

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    const L = (this.L = c.L)
    this.g = svg('g', {}, c.mid)
    this.solid = line(this.g, { stroke: '#ECE6D9', 'stroke-width': 3, 'stroke-linecap': 'butt' })
    this.band = svg('rect', { height: 3, fill: 'url(#sp-edge)' }, this.g)
    this.dashed = line(this.g, { stroke: '#86A8D8', 'stroke-opacity': 0.45, 'stroke-width': 3, 'stroke-dasharray': '5 4' })
    this.brP = path(this.g, { class: 'sp-hair sp-ink2', fill: 'none' })
    this.brU = path(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-dasharray': '3 3', fill: 'none' })
    this.lblP = label(this.box, 'sp-call', [L.mobile ? 'PROBED · ~46 DECADES' : 'PROBED · ~46 POWERS OF TEN'])
    this.lblU = label(this.box, 'sp-call sp-call--field', [L.mobile ? 'UNPROBED · ~16 · A QUARTER' : 'UNPROBED · ~16 · ABOUT A QUARTER'])
    const defs: [number, string, string, number][] = [
      [-10, 'ATOM', '→ 8.8 × 10²⁶ m', 0],
      [Math.log10(1.7e-15), 'PROTON', '→ ~1.6 MILLION ly', 1],
      [-19, 'LHC REACH', '→ ~90 ly', 0],
      [Math.log10(1.616e-35), 'PLANCK LENGTH', '→ ~140 m', 1],
    ]
    for (const [s, name, res, row] of defs) {
      const hair = path(this.g, { class: 'sp-hair sp-ink2', 'stroke-opacity': 0.6 })
      const cap = div('sp-lbl sp-token', this.box, name)
      const r = label(this.box, 'sp-token-res', [res])
      this.tokens.push({ s, cap, hair, res: r, row })
    }
    this.enlarge = label(this.box, 'sp-call sp-enlarge', [L.mobile ? '← ENLARGE EVERYTHING × 8.8 × 10³⁶' : '← EVERY TOKEN SLIDES 36.94 DECADES'])
    // desktop: the slide's factor as a display moment in the upper right
    if (!L.mobile)
      this.disp = display(this.box, 'sp-disp--q', 'Enlarge everything · atom → universe', '× 8.8 × 10³⁶', [
        'on a log scale, multiplying is a slide',
        'Planck length → ~140 m: a tall tree',
      ])
    if (L.mobile) this.sum = label(this.box, 'sp-call sp-sum', ['ATOM → 8.8 × 10²⁶ m · PROTON → ~1.6 MILLION ly', 'LHC REACH → ~90 ly · PLANCK LENGTH → ~140 m'])
    this.tree = svg('circle', { r: 11, fill: 'url(#sp-bead)', 'fill-opacity': 0.35, stroke: '#ECE6D9', 'stroke-opacity': 0.7, 'stroke-width': 0.8 }, this.g)
    this.cap = div('sp-note sp-tree-note', this.box)
    chip('analogy', this.cap)
    span(
      'sp-note__t',
      this.cap,
      'In an atom blown up to the universe, our sharpest view resolves ~90-light-year detail. A Planck-scale string would be tree-sized.',
    )
    span('sp-note__s', this.cap, '~40–140 m, DEPENDING ON WHERE AN ATOM’S EDGE IS DRAWN')
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const X = (s: number) => S.rx0 + ((S.sL - s) / (S.sL - S.sR)) * (L.rx1 - S.rx0)
    const inQ = T >= SI.quarter && T < SI.bigger
    const live = T >= SI.quarter && T < SI.floor && S.rulerOn > 0
    op(this.box, live ? 1 : 0)
    if (!live) {
      op(this.g, 0)
      return
    }
    const p = local(T, 'quarter')
    const pe = local(T, 'energy')
    // bars persist through Beat 3 as context, fold away with the Ruler in Beat 4
    let barsOn = 0
    let fill = 0
    if (inQ) {
      fill = T >= SI.energy ? 1 : smoothstep(0.02, 0.3, p)
      barsOn = 1
    } else if (T >= SI.bigger && T < SI.floor) {
      fill = 1
      barsOn = S.fold
    }
    op(this.g, barsOn * S.rulerOn)
    sa(this.g, 'transform', `translate(0 ${L.ry}) scale(1 ${Math.max(0.001, S.fold).toFixed(4)}) translate(0 ${-L.ry})`)
    const x0 = X(S_MAX)
    const x18 = X(-18)
    const x20 = X(-20)
    const x19 = X(-19)
    const xp = X(S_MIN)
    // fill left → right over 0.02–0.3 (solid), then the band, then the dashed quarter
    const fSolid = smoothstep(0, 0.7, fill)
    const fBand = smoothstep(0.66, 0.8, fill)
    const fDash = smoothstep(0.78, 1, fill)
    setLine(this.solid, x0, L.ry, lerp(x0, x18, fSolid), L.ry)
    sa(this.band, 'x', x18)
    sa(this.band, 'y', L.ry - 1.5)
    sa(this.band, 'width', Math.max(0, (x20 - x18) * fBand))
    setLine(this.dashed, x20, L.ry, lerp(x20, xp, fDash), L.ry)
    const yb = L.ry + (L.mobile ? 30 : 36)
    sa(this.brP, 'd', `M${x0},${yb - 5}V${yb}H${x19 - 3}V${yb - 5}`)
    sa(this.brU, 'd', `M${x19 + 3},${yb - 5}V${yb}H${xp}V${yb - 5}`)
    // the brackets' words clear away before the tokens slide through them; the brackets stay, quiet
    const brIn = inQ && T < SI.energy ? smoothstep(0.22, 0.34, p) : 0
    const brOn = brIn * (1 - 0.6 * smoothstep(0.34, 0.42, p))
    const brOnE = T >= SI.energy && T < SI.bigger ? 0.4 * (1 - smoothstep(0, 0.12, pe)) : 0
    const br = Math.max(brOn, brOnE)
    const brL = brIn * (1 - smoothstep(0.33, 0.39, p))
    op(this.brP, br)
    op(this.brU, br)
    op(this.lblP, brL)
    op(this.lblU, brL)
    if (L.mobile) at(this.lblP, x0, yb + 5)
    else at(this.lblP, (x0 + x19) / 2, yb + 5, ' translate(-50%,0)')
    if (L.mobile) at(this.lblU, xp, yb + 5, ' translate(-100%,0)')
    else at(this.lblU, (x19 + xp) / 2, yb + 5, ' translate(-50%,0)')

    // tokens: appear under their real positions, then slide left by exactly 36.94 decades
    const tokOn = inQ && T < SI.energy ? smoothstep(0.36, 0.44, p) : T >= SI.energy && T < SI.bigger ? 1 - smoothstep(0, 0.12, pe) : 0
    const slide = inQ && T < SI.energy ? (prefersReducedMotion() ? (p > 0.66 ? 1 : 0) : easeInOutCubic(smoothstep(0.46, 0.84, p))) : T >= SI.energy ? 1 : 0
    const yt = L.ry + (L.mobile ? 58 : 70)
    this.tokens.forEach((k, i) => {
      const s = k.s + SLIDE * slide
      const hw = (k.cap.textContent?.length ?? 6) * 3.6 + 12 // half the capsule's width (10px mono)
      const x = L.mobile ? Math.min(Math.max(X(s), hw + 8), L.W - hw - 8) : X(s)
      // two staggered rows on desktop: PROTON and LHC REACH land only ~70 px apart
      const yk = yt + (L.mobile ? [0, 1, 2, 0][i] * 21 : k.row * 30)
      op(k.cap, tokOn)
      op(k.hair, tokOn)
      at(k.cap, x, yk, ' translate(-50%,-50%)')
      // a stub at the Ruler, then the hairline resumes below the tick-label row (never through a label)
      const xr = X(s)
      const yGap = L.ry + (L.mobile ? 21 : 24)
      sa(k.hair, 'd', `M${xr.toFixed(1)},${L.ry + 3}V${L.ry + 6}M${xr.toFixed(1)},${yGap}L${x.toFixed(1)},${(yk - 12).toFixed(1)}`)
      const settle = inQ && T < SI.energy ? smoothstep(0.8 + i * 0.02, 0.86 + i * 0.02, p) : T >= SI.energy ? 1 : 0
      op(k.res, L.mobile ? 0 : tokOn * settle)
      at(k.res, x, yk + 13, ' translate(-50%,0)')
    })
    const enl = inQ && T < SI.energy ? smoothstep(0.4, 0.48, p) * (1 - smoothstep(0.86, 0.92, p)) : 0
    if (this.sum) {
      op(this.sum, (inQ && T < SI.energy ? smoothstep(0.88, 0.93, p) : 0) * tokOn)
      at(this.sum, 16, yt + 70)
    }
    op(this.enlarge, L.mobile ? enl : enl * (1 - smoothstep(0.8, 0.86, p)))
    at(this.enlarge, L.mobile ? L.W / 2 : (X(-10) + X(-10 + SLIDE)) / 2, yt + (L.mobile ? 78 : 74), ' translate(-50%,0)')
    if (this.disp) {
      const d = this.disp
      const dOn = inQ && T < SI.energy ? smoothstep(0.4, 0.5, p) : T >= SI.energy && T < SI.bigger ? 1 - smoothstep(0, 0.08, pe) : 0
      op(d.el, dOn)
      op(d.s[0], 1 - smoothstep(0.84, 0.88, p))
      op(d.s[1], inQ && T < SI.energy ? smoothstep(0.86, 0.92, p) : 1)
      at(d.el, L.W - Math.max(96, 0.07 * L.W), Math.max(96, 0.11 * L.H), ' translate(-100%,0)')
    }

    // the tree: brightens; the caption lands beside it
    const tr = inQ && T < SI.energy ? smoothstep(0.88, 0.95, p) : T >= SI.energy && T < SI.bigger ? 1 - smoothstep(0, 0.1, pe) : 0
    const xt = X(2)
    op(this.tree, tr)
    sa(this.tree, 'cx', xt)
    sa(this.tree, 'cy', L.ry - (L.mobile ? 11 : 13))
    op(this.cap, tr)
    if (L.mobile) at(this.cap, 16, yt + 104)
    else at(this.cap, Math.max(xt + 76, L.rx0 + 380), yt + 40)
  }
}
