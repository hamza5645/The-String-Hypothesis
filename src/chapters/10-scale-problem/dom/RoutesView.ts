/*
 * Beat 6 — where strings might be, and how to look sideways. Three zones on the Ruler's right end
 * (excluded in tested low-scale models ✕, speculative ○, traditional ◑), then six route cards whose
 * leaders run to the scale each one actually tests. Theory checks get no leader.
 */
import { smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import type { Layout } from '../layout'
import { S_LOWSCALE, S_MIN, S_TRAD } from '../model'
import { useScaleLab } from '../store'
import { ROUTES } from '../routes'
import { SI, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, chip, div, label, op, path, sa, span, svg, toggle } from './dom'

interface Card {
  el: HTMLDivElement
  leads: SVGPathElement[]
  dots: SVGCircleElement[]
  h: number
}

export class RoutesView implements View {
  private L: Layout
  private g: SVGGElement
  private zEx: SVGRectElement
  private zSp: SVGRectElement
  private zTr: SVGRectElement
  private lEx: HTMLDivElement
  private lSp: HTMLDivElement
  private lTr: HTMLDivElement
  private legend: HTMLDivElement
  private brk: SVGPathElement
  private brkLbl: HTMLDivElement
  private thread: HTMLDivElement
  private leads: SVGGElement
  private cards: Card[] = []
  private hi: SVGCircleElement

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    const L = (this.L = c.L)
    this.g = svg('g', {}, c.mid)
    this.zEx = svg('rect', { fill: 'url(#sp-hatch)', stroke: '#5C6270', 'stroke-width': 0.6 }, this.g)
    this.zSp = svg('rect', { fill: 'url(#sp-rings)', stroke: '#7D8190', 'stroke-width': 0.6 }, this.g)
    this.zTr = svg('rect', { fill: 'url(#sp-half)', stroke: '#86A8D8', 'stroke-width': 0.7 }, this.g)
    const m = L.mobile
    this.lEx = label(this.box, 'sp-zone sp-zone--ex', m ? ['EXCLUDED IN', 'TESTED MODELS'] : ['STRINGS THIS LONG', 'EXCLUDED IN TESTED', 'LOW-SCALE MODELS · LHC'])
    this.lSp = div('sp-lbl sp-zone sp-zone--sp', this.box)
    span('sp-lbl__a', this.lSp, m ? 'LOW / INTERMEDIATE' : 'LOW OR INTERMEDIATE STRING SCALE')
    chip('speculative', this.lSp)
    this.lTr = div('sp-lbl sp-zone sp-zone--tr', this.box)
    span('sp-lbl__a', this.lTr, m ? 'WEAKLY COUPLED' : 'WEAKLY COUPLED STRINGS')
    span('sp-lbl__b', this.lTr, m ? 'in those models' : 'derived in those models')
    chip('derived', this.lTr)
    // once the Ruler compresses back to full width, the zone labels collapse into a legend
    this.legend = div('sp-lbl sp-legend', this.box)
    for (const [mark, t, k] of [
      ['✕', m ? 'EXCLUDED IN TESTED MODELS' : 'EXCLUDED IN TESTED LOW-SCALE MODELS · LHC', 'ex'],
      ['○', m ? 'LOW / INTERMEDIATE · SPECULATIVE' : 'LOW OR INTERMEDIATE STRING SCALE · SPECULATIVE', 'sp'],
      ['◑', m ? 'WEAKLY COUPLED · IN THOSE MODELS' : 'WEAKLY COUPLED STRINGS · DERIVED IN THOSE MODELS', 'tr'],
    ]) {
      const row = div(`sp-legend__row sp-legend__row--${k}`, this.legend)
      span('sp-legend__t', row, t)
      span('sp-legend__m', row, mark)
    }
    this.brk = path(this.g, { class: 'sp-hair sp-ink2', fill: 'none' })
    this.brkLbl = label(this.box, 'sp-call sp-call--r', ['ℓs ≳ ℓP WHEN STRINGS', 'INTERACT WEAKLY'])
    this.thread = div('sp-lbl sp-thread-tag', this.box)
    chip('analogy', this.thread)
    span('sp-lbl__b', this.thread, m ? 'ℓs assumed' : 'the Thread · ℓs assumed 10⁻³⁴ m')

    this.leads = svg('g', {}, c.top)
    this.hi = svg('circle', { r: 9, fill: 'url(#sp-fieldglow)', stroke: '#86A8D8', 'stroke-width': 1 }, this.leads)
    ROUTES.forEach((r, i) => {
      const el = div(`sp-card sp-route${m ? ' sp-route--s' : ''}`, c.front)
      el.dataset.ui = ''
      const head = div('sp-route__head', el)
      span('sp-route__title', head, r.title)
      const chips = div('sp-route__chips', el)
      for (const k of r.status) chip(k, chips)
      if (!m) span('sp-route__text', el, r.text)
      if (r.check) span('sp-route__check', el, m ? 'Theory check' : 'Theory check · not a measurement')
      el.addEventListener('pointerenter', () => useScaleLab.getState().setRoute(i))
      el.addEventListener('pointerleave', () => useScaleLab.getState().setRoute(-1))
      el.addEventListener('pointerdown', () => useScaleLab.getState().setRoute(useScaleLab.getState().route === i ? -1 : i))
      const wide = !L.mobile && i >= L.cardCols
      el.style.width = `${wide ? L.cardW2 : L.cardW}px`
      const leads: SVGPathElement[] = []
      const dots: SVGCircleElement[] = []
      for (let k = 0; k < r.to.length; k++) {
        leads.push(path(this.leads, { class: 'sp-hair sp-lead', fill: 'none' }))
        dots.push(svg('circle', { r: 2.2, fill: '#86A8D8' }, this.leads))
      }
      this.cards.push({ el, leads, dots, h: 0 })
    })
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const inB = T >= SI.sideways && T < SI.lab
    const p = local(T, 'sideways')
    const on = inB ? S.rulerOn * (1 - smoothstep(0.97, 1, p)) : 0
    op(this.g, on)
    op(this.box, inB ? 1 : 0)
    if (!inB) {
      op(this.leads, 0)
      for (const c of this.cards) op(c.el, 0)
      return
    }
    const X = (s: number) => S.rx0 + ((S.sL - s) / (S.sL - S.sR)) * (L.rx1 - S.rx0)
    const ry = S.ry
    // the band is tall while magnified, a strip once the Ruler widens back for the cards
    const zoomedH = 1 - smoothstep(0.42, 0.55, p)
    const zh = L.mobile ? 34 : 46 + 38 * zoomedH
    const y0 = ry - 4 - zh
    // zones grow upward from the axis
    const zg = smoothstep(0.08, 0.22, p)
    const hh = zh * zg
    const ya = ry - 4 - hh
    const xl = Math.max(S.rx0, X(-15.2))
    const xe = X(S_LOWSCALE)
    const xt = X(S_TRAD)
    const xp = X(S_MIN)
    rect(this.zEx, xl, ya, xe - xl, hh)
    rect(this.zSp, xe, ya, xt - xe, hh)
    rect(this.zTr, xt, ya, xp - xt, hh)
    const zl = smoothstep(0.16, 0.26, p)
    const zoomed = 1 - smoothstep(0.42, 0.55, p)
    // phones: the compact legend carries the zones' names and marks throughout
    const zoneLbl = L.mobile ? 0 : zoomed
    op(this.lEx, on * zl * zoneLbl)
    op(this.lSp, on * zl * zoneLbl)
    op(this.lTr, on * zl * zoneLbl)
    op(this.legend, on * (1 - zoneLbl) * zl)
    if (L.mobile) at(this.legend, xp + 2, ry + 24, ' translate(-100%,0)')
    else at(this.legend, xp + 2, y0 - 10, ' translate(-100%,-100%)')
    at(this.lEx, (xl + xe) / 2, y0 - 8, ' translate(-50%,-100%)')
    at(this.lSp, (xe + xt) / 2, y0 - 8, ' translate(-50%,-100%)')
    const trRight = xp + 6 > L.W - 150
    at(this.lTr, trRight ? xp + 4 : (xt + xp) / 2, y0 - 8, trRight ? ' translate(-100%,-100%)' : ' translate(-50%,-100%)')
    // the bracket at the Planck tick
    const yb = ry + (L.mobile ? 24 : 30)
    sa(this.brk, 'd', `M${xt},${yb - 5}V${yb}H${xp}V${yb - 5}`)
    const bk = smoothstep(0.24, 0.32, p) * zoomed
    op(this.brk, on * bk)
    op(this.brkLbl, L.mobile ? 0 : on * bk)
    at(this.brkLbl, xp, yb + 6, ' translate(-100%,0)')
    const th = smoothstep(0.12, 0.2, p) * zoomed
    op(this.thread, on * th)
    if (L.mobile) at(this.thread, L.W - 8, ry + 84, ' translate(-100%,0)')
    else at(this.thread, xp, yb + 40, ' translate(-100%,0)')

    // the routes
    const route = useScaleLab.getState().route
    const cardsOn = inB ? 1 - smoothstep(0.97, 1, p) : 0
    op(this.leads, cardsOn)
    const below = L.cardsBelow
    const yAxis = below ? ry + 3 : ry - 3
    let hiX = -1
    let rowY = L.cardY0
    let rowH = 0
    this.cards.forEach((c, i) => {
      const st = prefersReducedMotion() ? 0 : i * 0.03
      const a = smoothstep(0.5 + st, 0.58 + st, p) * cardsOn
      op(c.el, a)
      toggle(c.el, 'is-live', a > 0.5)
      toggle(c.el, 'is-hi', route === i)
      toggle(c.el, 'is-dim', route >= 0 && route !== i)
      const col = i % L.cardCols
      if (col === 0 && i > 0) {
        rowY += rowH + (L.mobile ? 6 : 10)
        rowH = 0
      }
      if (!c.h && inB) c.h = c.el.offsetHeight
      rowH = Math.max(rowH, c.h || L.cardH)
      const wide = !L.mobile && i >= L.cardCols
      const cx = L.cardX0 + col * ((wide ? L.cardW2 : L.cardW) + (L.mobile ? 8 : 12))
      const cy = rowY
      at(c.el, cx, cy)
      const bx = cx + L.cardW / 2
      const by = below ? cy - 1 : cy + (c.h || L.cardH) + 1
      const r = ROUTES[i]
      const draw = smoothstep(0.58 + i * 0.03, 0.72 + i * 0.03, p)
      r.to.forEach((tgt, k) => {
        const tx = tgt === 'sky' ? S.rx0 : X(tgt)
        const lead = c.leads[k]
        const my = (by + yAxis) / 2
        const bend = below ? 10 : -10
        sa(lead, 'd', `M${bx.toFixed(1)},${by.toFixed(1)} C${bx.toFixed(1)},${my.toFixed(1)} ${tx.toFixed(1)},${(my + bend).toFixed(1)} ${tx.toFixed(1)},${yAxis.toFixed(1)}`)
        const hi = route === i
        op(lead, a * draw * (route < 0 ? (L.mobile ? 0.45 : 0.75) : hi ? 1 : 0.18))
        toggle(lead, 'is-hi', hi)
        sa(c.dots[k], 'cx', tx)
        sa(c.dots[k], 'cy', yAxis)
        op(c.dots[k], a * draw * (route < 0 || hi ? 1 : 0.2))
        if (hi && tgt !== 'sky') hiX = tx
      })
    })
    op(this.hi, hiX >= 0 ? 1 : 0)
    if (hiX >= 0) {
      sa(this.hi, 'cx', hiX)
      sa(this.hi, 'cy', yAxis)
    }
  }

  destroy() {
    for (const c of this.cards) c.el.remove()
  }
}

function rect(r: SVGRectElement, x: number, y: number, w: number, h: number) {
  sa(r, 'x', x)
  sa(r, 'y', y)
  sa(r, 'width', Math.max(0, w))
  sa(r, 'height', Math.max(0, h))
}
