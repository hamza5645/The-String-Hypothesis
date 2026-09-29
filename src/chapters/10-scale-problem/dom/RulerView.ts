/*
 * The Ruler — the chapter's instrument: a 62-decade logarithmic axis, universe (left) → Planck (right),
 * with a dotted stub past ℓP (the axis does not end there). Landmarks, decade ticks, and Beat 1's callouts.
 */
import { lerp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import { hitsRail, type Layout } from '../layout'
import { RULER_LANDMARKS, type RulerLandmark } from '../landmarks'
import { S_MAX, S_MIN, S_STRING, S_STUB, sup } from '../model'
import { SI, ZOOM_END, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, div, label, line, op, path, sa, setLine, span, svg } from './dom'
import { MID_S, midY, placeLabels, rulerXFull } from './placeLabels'

interface LM {
  d: RulerLandmark
  glyph: SVGGElement
  lead: SVGLineElement
  lbl: HTMLDivElement
  tier: number
  ly: number // label bottom y (full fold)
  lh: number // label height
  lx: number // label anchor x at full window
  align: number // 0 centre, 1 label to the right of its tick, −1 to the left
  order: number
}

export class RulerView implements View {
  private L: Layout
  private g: SVGGElement
  private base: SVGLineElement
  private stub: SVGLineElement
  private ticks: SVGPathElement
  private ticksStub: SVGPathElement
  private tickLbl = new Map<number, HTMLDivElement>()
  /** the closing frame's tag under the point: the assumed string length, never a measured size */
  private ptTag: HTMLDivElement
  private lms: LM[] = []
  private title: HTMLDivElement
  private youL: SVGPathElement
  private youR: SVGPathElement
  private youLblL: HTMLDivElement
  private youLblR: HTMLDivElement
  private youLbl: HTMLDivElement
  private midLine: SVGLineElement
  private midGlyph: SVGRectElement
  private midLbl: HTMLDivElement
  private key = ''
  private paper: LM | undefined

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    const L = (this.L = c.L)
    this.g = svg('g', { class: 'sp-ruler' }, c.mid)
    this.base = line(this.g, { class: 'sp-hair sp-ink3', 'stroke-width': 1 })
    this.stub = line(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-opacity': 0.4, 'stroke-dasharray': '1.2 3.2' })
    this.ticks = path(this.g, { class: 'sp-hair sp-ink3', fill: 'none' })
    this.ticksStub = path(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-opacity': 0.3, fill: 'none' })
    for (let s = S_STUB; s <= 26; s++) {
      const d = div('sp-lbl sp-tick', this.box, `10${sup(s)} m`)
      this.tickLbl.set(s, d)
    }
    this.ptTag = label(this.box, 'sp-pt-tag', ['ℓs assumed ~10⁻³⁴ m', 'hypothetical · unresolved'])
    this.title = label(this.box, 'sp-dim sp-axis-title', [L.mobile ? 'LENGTH · LOG SCALE · EACH TICK ×10' : 'LENGTH · LOGARITHMIC · EACH TICK ×10'])

    // landmarks: glyph at the tick, label above in tiers (placed once, greedy, by priority)
    const small = L.mobile
    const list = RULER_LANDMARKS.filter((d) => !small || d.core)
    const tierStep = small ? 27 : 32
    const plan = placeLabels(L, list, small, tierStep)
    for (const d of list) {
      const pl = plan.get(d.id)
      const names = d.name.split('\n')
      const glyph = svg('g', { class: 'sp-glyph' }, this.g)
      if (d.glyph) path(glyph, { d: d.glyph, class: 'sp-hair sp-ink2', fill: 'none' })
      const lead = line(this.g, { class: 'sp-hair sp-ink3', 'stroke-opacity': 0.7 })
      const align = pl?.align ?? 0
      const lbl = label(this.box, `sp-lm${small ? ' sp-lm--s' : ''}${d.id === 'planck' ? ' sp-lm--planck' : ''}${align ? (align > 0 ? ' sp-lm--r' : ' sp-lm--l') : ''}`, [...names.map((n) => n.toUpperCase()), d.value])
      this.lms.push({ d, glyph, lead, lbl, tier: pl ? pl.tier : -1, ly: pl ? pl.yb - L.ry : 0, lh: pl ? pl.h : 0, lx: pl ? pl.cx : 0, align, order: 0 })
    }
    this.paper = this.lms.find((m) => m.d.id === 'paper')
    this.lms.sort((a, b) => b.d.s - a.d.s)
    this.lms.forEach((m, i) => (m.order = i / Math.max(1, this.lms.length - 1)))

    // Beat 1 callouts: 27 ↔ YOU ↔ 35, and the midpoint (a sheet of paper)
    this.youL = path(this.g, { class: 'sp-hair sp-ink2', fill: 'none' })
    this.youR = path(this.g, { class: 'sp-hair sp-ink2', fill: 'none' })
    this.youLblL = label(this.box, 'sp-call', ['27 POWERS OF TEN ↔'])
    this.youLblR = label(this.box, 'sp-call', ['↔ 35 POWERS OF TEN'])
    this.youLbl = label(this.box, 'sp-call sp-call--you', ['YOU · 1.7 m', '43% of the way along'])
    this.midLine = line(this.g, { class: 'sp-hair', stroke: '#ECE6D9', 'stroke-opacity': 0.55, 'stroke-dasharray': '2 3' })
    this.midGlyph = svg('rect', { width: 2, height: 14, fill: 'none', stroke: '#ECE6D9', 'stroke-width': 0.8 }, this.g)
    this.midLbl = div('sp-lbl sp-call sp-call--mid', this.box)
    span('sp-lbl__a', this.midLbl, 'MIDPOINT · 1.2 × 10⁻⁴ m')
    span('sp-lbl__b', this.midLbl, 'about a sheet of paper')
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const on = S.rulerOn
    op(this.g, on)
    op(this.box, on > 0 ? 1 : 0)
    if (on <= 0) return
    const fold = S.fold
    const ry = S.ry
    const dy = ry - L.ry
    sa(this.g, 'transform', `translate(0 ${ry}) scale(1 ${Math.max(0.001, fold).toFixed(4)}) translate(0 ${-L.ry})`)
    const fy = (y: number) => ry + (y - ry) * fold
    const X = (s: number) => S.rx0 + ((S.sL - s) / (S.sL - S.sR)) * (L.rx1 - S.rx0)

    // Beat 1 flatten: the Ruler draws itself left → right; landmarks fly in from the zoom centre
    const inB1 = T >= SI.decades && T < SI.quarter
    const p1 = local(T, 'decades')
    const reduced = prefersReducedMotion()
    const draw = inB1 ? (reduced ? (p1 > ZOOM_END + 0.08 ? 1 : 0) : smoothstep(ZOOM_END + 0.03, ZOOM_END + 0.2, p1)) : 1
    const xa = X(S_MAX)
    const xb = X(S_MIN)
    const xd = lerp(xa, xb, draw)
    const xClip = S.rx0 - 28
    setLine(this.base, Math.max(xa, xClip), L.ry, Math.min(xd, L.W + 20), L.ry)
    setLine(this.stub, Math.min(xb, L.W + 20), L.ry, Math.min(X(S_STUB), L.W + 20), L.ry)
    op(this.stub, draw >= 1 ? 1 : 0)

    // ticks (rebuilt only when the window changes)
    const key = `${S.sL.toFixed(3)}|${S.sR.toFixed(3)}|${draw.toFixed(3)}`
    const pxd = (L.rx1 - S.rx0) / (S.sL - S.sR)
    const step = pxd > 60 ? 1 : pxd > 24 ? 2 : pxd > 9 ? 5 : 10
    if (key !== this.key) {
      this.key = key
      let d = ''
      let ds = ''
      for (let s = S_STUB; s <= 26; s++) {
        const x = X(s)
        if (x < xClip || x > L.W + 10 || x > xd + 0.5) continue
        const major = s % 5 === 0
        const h = major ? 5 : 2
        const seg = `M${x.toFixed(1)},${L.ry - h}V${L.ry + h}`
        if (s < S_MIN) ds += seg
        else d += seg
      }
      sa(this.ticks, 'd', d || 'M0,0')
      sa(this.ticksStub, 'd', ds || 'M0,0')
    }
    const tickOn = on * fold
    // closing frame: the point on the Ruler is the assumed ℓs, so its tick names the assumption and
    // no plain length label sits under it
    const inPt = T >= SI.point
    const xs = X(S_STRING)
    for (const [s, el] of this.tickLbl) {
      const x = X(s)
      const inRange = x >= X(S_MAX) - 1 && x <= X(S_STUB) + 1
      const show =
        s % step === 0 &&
        inRange &&
        x > S.rx0 - 16 &&
        x < L.W + 20 &&
        x <= xd + 1 &&
        !(s < S_MIN && pxd < 40) &&
        !(inPt && Math.abs(x - xs) < 110) &&
        !hitsRail(L, x - 24, ry + 6, x + 24, ry + 22)
      op(el, show ? tickOn * (s < S_MIN ? 0.5 : 1) : 0)
      if (show) at(el, x, fy(ry + 8), ' translate(-50%,0)')
    }
    op(this.ptTag, inPt ? tickOn : 0)
    if (inPt) at(this.ptTag, xs, fy(ry + 8), ' translate(-50%,0)')
    const titleOn = inB1 ? smoothstep(ZOOM_END + 0.16, ZOOM_END + 0.26, p1) : T >= SI.quarter && T < SI.bigger ? 1 - smoothstep(0.08, 0.2, local(T, 'quarter')) : 0
    op(this.title, titleOn * on)
    // the axis title sits under the "27 powers of ten" bracket, never on its end tick
    at(this.title, L.rx0 - 2, ry + (L.mobile ? 84 : 74))

    // landmarks
    let lmOn = 0
    let lblOn = 1
    if (inB1) lmOn = 1
    else if (T >= SI.quarter && T < SI.bigger) lmOn = T >= SI.energy ? 0.85 * (L.mobile ? 1 - smoothstep(0.78, 0.86, local(T, 'energy')) : 1) : 1
    else if (T >= SI.bigger && T < SI.floor) lmOn = fold
    else if (T >= SI.point) {
      lmOn = 0.7 * (1 - smoothstep(0.12, 0.24, local(T, 'point')))
      lblOn = 0
    }
    for (const m of this.lms) {
      let a = lmOn
      let gx = X(m.d.s)
      let gy = L.ry - (L.mobile ? 11 : 13)
      let sc = 1
      let la = lblOn
      if (inB1) {
        const uni = m.d.id === 'universe'
        const t0 = uni ? ZOOM_END : ZOOM_END + 0.08 + 0.16 * m.order
        const f = reduced ? 1 : smoothstep(t0, t0 + 0.12, p1)
        a = uni ? smoothstep(ZOOM_END + 0.1, ZOOM_END + 0.12, p1) : smoothstep(t0 - 0.02, t0 + 0.04, p1)
        gx = lerp(L.zx, gx, f)
        gy = lerp(L.zy - dy, gy, f)
        sc = uni ? 1 : lerp(2.4, 1, f)
        la = smoothstep(t0 + 0.09, t0 + 0.16, p1)
      }
      const inWin = gx > L.rx0 - 12 && gx < L.rx1 + 12 ? 1 : T >= SI.point ? 1 : 0
      a *= inWin
      op(m.glyph, a)
      sa(m.glyph, 'transform', `translate(${gx.toFixed(1)} ${gy.toFixed(1)}) scale(${sc.toFixed(3)})`)
      const lx = m.lx + (gx - rulerXFull(L, m.d.s))
      const showLbl = m.tier < 0 ? 0 : a * la
      op(m.lbl, showLbl * fold)
      if (showLbl > 0) at(m.lbl, m.align > 0 ? lx - 5 : m.align < 0 ? lx + 5 : lx, fy(ry + m.ly), m.align > 0 ? ' translate(0,-100%)' : m.align < 0 ? ' translate(-100%,-100%)' : ' translate(-50%,-100%)')
      op(m.lead, showLbl)
      setLine(m.lead, gx, gy - 9, gx, L.ry + m.ly + 2)
    }

    // Beat 1 callouts
    const pc = inB1 ? smoothstep(0.86, 0.92, p1) : T >= SI.quarter && T < SI.bigger ? 1 - smoothstep(0.02, 0.12, local(T, 'quarter')) : 0
    const pm = inB1 ? smoothstep(0.9, 0.96, p1) : T >= SI.quarter && T < SI.bigger ? 1 - smoothstep(0.02, 0.12, local(T, 'quarter')) : 0
    const yB = L.ry + (L.mobile ? 30 : 36)
    const yH = yB + dy
    const xy = X(Math.log10(1.7))
    const xu = X(S_MAX)
    const xp = X(S_MIN)
    sa(this.youL, 'd', `M${xu},${yB - 5}V${yB}H${xy - 3}V${yB - 5}`)
    sa(this.youR, 'd', `M${xy + 3},${yB - 5}V${yB}H${xp}V${yB - 5}`)
    op(this.youL, pc)
    op(this.youR, pc)
    op(this.youLblL, pc)
    op(this.youLblR, pc)
    op(this.youLbl, pc)
    at(this.youLblL, (xu + xy) / 2, yH + 5, ' translate(-50%,0)')
    at(this.youLblR, (xy + xp) / 2, yH + 5, ' translate(-50%,0)')
    at(this.youLbl, xy, yH + (L.mobile ? 18 : 22), ' translate(-50%,0)')
    const xm = X(MID_S)
    const ym = midY(L)
    // the dotted midpoint line starts above the PAPER label (never through it)
    const paper = this.paper
    const y0 = paper && paper.tier >= 0 && paper.lbl.style.visibility !== 'hidden' ? L.ry + paper.ly - paper.lh - 4 : L.ry - 4
    setLine(this.midLine, xm, y0, xm, ym + 6)
    op(this.midLine, pm)
    op(this.midGlyph, pm)
    sa(this.midGlyph, 'x', xm - 1)
    sa(this.midGlyph, 'y', ym - 30)
    op(this.midLbl, pm)
    at(this.midLbl, xm + 8, ym + dy, ' translate(0,-100%)')
  }
}
