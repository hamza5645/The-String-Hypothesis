/*
 * The Ruler — the chapter's instrument: a 62-decade logarithmic axis, universe (left) → Planck (right),
 * with a dotted stub past ℓP (the axis does not end there). Landmarks, decade ticks, and Beat 1's callouts.
 */
import { lerp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import { hitsRail, type Layout } from '../layout'
import { RULER_LANDMARKS, type RulerLandmark } from '../landmarks'
import { S_MAX, S_MIN, S_STUB, sup } from '../model'
import { SI, ZOOM_END, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, div, label, line, op, path, sa, setLine, span, svg } from './dom'

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

// label metrics (CSS: .sp-lm names 11px / values 10.5px desktop, 10px / 10px phones)
const FONT_A = 11
const FONT_B = 10.5
const MID_S = Math.log10(1.19e-4) // the Ruler's midpoint: √(8.8 × 10²⁶ × 1.616 × 10⁻³⁵) m
const midY = (L: Layout) => L.ry - (L.mobile ? 150 : 172)

export class RulerView implements View {
  private L: Layout
  private g: SVGGElement
  private base: SVGLineElement
  private stub: SVGLineElement
  private ticks: SVGPathElement
  private ticksStub: SVGPathElement
  private tickLbl = new Map<number, HTMLDivElement>()
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
    for (const [s, el] of this.tickLbl) {
      const x = X(s)
      const inRange = x >= X(S_MAX) - 1 && x <= X(S_STUB) + 1
      const show = s % step === 0 && inRange && x > S.rx0 - 16 && x < L.W + 20 && x <= xd + 1 && !(s < S_MIN && pxd < 40) && !hitsRail(L, x - 24, ry + 6, x + 24, ry + 22)
      op(el, show ? tickOn * (s < S_MIN ? 0.5 : 1) : 0)
      if (show) at(el, x, fy(ry + 8), ' translate(-50%,0)')
    }
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

export const rulerXFull = (L: Layout, s: number) => L.rx0 + ((S_MAX - s) / (S_MAX - S_MIN)) * (L.rx1 - L.rx0)

interface Placement {
  tier: number
  align: number
  cx: number
  yb: number
  h: number
}

/**
 * Landmark labels above the Ruler: every label gets a tier (height) and an alignment (centred, or
 * hanging right/left of its tick) so that no label overlaps another, and no leader line (tick → label)
 * crosses a label. Depth-first search in x order with backtracking; lowest total height wins.
 */
function placeLabels(L: Layout, list: RulerLandmark[], small: boolean, tierStep: number) {
  const fa = small ? 10 : FONT_A
  const fb = small ? 10 : FONT_B
  const gTop = L.ry - (small ? 18 : 21)
  const items = list
    .map((d) => {
      const names = d.name.split('\n')
      const w = Math.max(...names.map((n) => n.length * fa * 0.69), d.value.length * fb * 0.64) + 6
      const h = (names.length + 1) * (small ? 13.6 : 15) + 2
      return { d, x: rulerXFull(L, d.s), w, h }
    })
    .sort((a, b) => a.x - b.x)
  type R = [number, number, number, number]
  const hit = (a: R, b: R) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
  // Beat 1's midpoint callout: its dotted line (above PAPER's label) and its label box stay clear
  const xm = rulerXFull(L, MID_S)
  const ym = midY(L)
  const midLine: R = [xm - 2, ym, xm + 2, gTop]
  const midBox: R = [xm - 4, ym - 36, xm + (small ? 170 : 210), ym + 4]
  const opts = (it: (typeof items)[number]) => {
    const out: { p: Placement; r: R; lead: R; cost: number }[] = []
    for (let t = 0; t < 7; t++)
      for (const al of [0, -1, 1]) {
        const cx = al === 0 ? Math.min(Math.max(it.x, 8 + it.w / 2), L.W - 8 - it.w / 2) : it.x
        const x0 = al === 0 ? cx - it.w / 2 : al === 1 ? it.x - 5 : it.x - it.w + 5
        // keep clear of the left scale gauge (desktop) and the screen edges
        if (x0 < (L.W >= 1100 ? 80 : 6) || x0 + it.w > L.W - 6) continue
        const yb = L.ry - (small ? 20 : 26) - t * tierStep
        if (yb - it.h < (small ? 58 : 70)) continue // below the top chrome
        // 8 px of air either side, so two neighbours never read as one label
        const r: R = [x0 - 8, yb - it.h, x0 + it.w + 8, yb]
        const lead: R = [it.x - 1.5, yb, it.x + 1.5, gTop]
        if (hitsRail(L, r[0], r[1], r[2], r[3]) || hitsRail(L, it.x - 1, yb, it.x + 1, L.ry)) continue
        if (hit(r, midBox) || (it.d.id !== 'paper' && hit(r, midLine))) continue
        // labels that straddle a neighbour's tick would block that neighbour's leader
        let straddle = 0
        for (const o of items) if (o !== it && o.x > r[0] && o.x < r[2]) straddle++
        out.push({ p: { tier: t, align: al, cx, yb, h: it.h }, r, lead, cost: t * 10 + (al ? 1 : 0) + straddle * 25 })
      }
    return out.sort((a, b) => a.cost - b.cost)
  }
  const cands = items.map(opts)
  const chosen: ({ p: Placement; r: R; lead: R } | null)[] = []
  let best: typeof chosen | null = null
  let bestCost = Infinity
  let iters = 0
  const dfs = (i: number, cost: number) => {
    if (++iters > 60000 || cost >= bestCost) return
    if (i === items.length) {
      best = chosen.slice()
      bestCost = cost
      return
    }
    for (const c of cands[i]) {
      let ok = true
      for (let j = 0; j < i && ok; j++) {
        const o = chosen[j]
        if (!o) continue
        if (hit(c.r, o.r) || hit(c.lead, o.r) || hit(c.r, o.lead)) ok = false
      }
      if (!ok) continue
      chosen[i] = c
      dfs(i + 1, cost + c.cost)
      if (iters > 60000) break
    }
    // allow a label to be dropped only at a steep price
    chosen[i] = null
    dfs(i + 1, cost + 1000)
  }
  dfs(0, 0)
  const map = new Map<string, Placement>()
  const res = (best ?? []) as ({ p: Placement } | null)[]
  items.forEach((it, i) => {
    const c = res[i]
    if (c) map.set(it.d.id, c.p)
  })
  return map
}
