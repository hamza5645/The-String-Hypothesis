/*
 * Beat 4 and the Lab — the machine map. The ring stays the same size on screen while the world
 * shrinks away beneath it (L_view = machine width / 60%): Geneva, Earth, the Moon's orbit, the Sun,
 * Earth's orbit, Neptune's orbit, the nearest star, and finally the galaxy. All positions float64.
 */
import { smoothstep } from '@/core/math'
import { GAL_X, GAL_Y, PROXIMA_DIR, landmarkVis, mapX, mapY, type StageState } from '../choreo'
import type { Layout } from '../layout'
import { BORDER, GENEVA, JURA, LAKE, geo, graticulePath } from '../landmarks'
import { AU, EP, HBARC, LHC_REAL_D, LY, OVERTAKES, comparison, fmtEnergy, fmtLength, fmtTime, ringEnergyForWidth, sci } from '../model'
import { B4, SI, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, chip, div, label, line, op, path, sa, setLine, span, svg, toggle, txt } from './dom'

interface LmCircle {
  D: number
  centre: 'cern' | 'sun'
  c: SVGCircleElement
  lbl: HTMLDivElement
  disc?: boolean
}

const TAG_TEXT = ['RING > EARTH · 2 × 10⁴ TeV', "RING > MOON'S ORBIT · 1.3 × 10⁶ TeV", "RING > EARTH'S ORBIT · 5 × 10⁸ TeV", 'RING > SOLAR SYSTEM · 1.5 × 10¹⁰ TeV', 'RING RADIUS > DISTANCE TO NEAREST STAR · 1.3 × 10¹⁴ TeV']

export class MapView implements View {
  private L: Layout
  private g: SVGGElement
  private geo: SVGGElement
  private geoLbl: HTMLDivElement[] = []
  private lhc: SVGCircleElement
  private lhcLbl: HTMLDivElement
  private ghost: SVGCircleElement
  private ghostLbl: HTMLDivElement
  private lms: LmCircle[] = []
  private prox: SVGCircleElement
  private proxLbl: HTMLDivElement
  private cern: HTMLDivElement
  private cernDot: SVGCircleElement
  // Earth's graticule (orthographic about CERN) and the receded-landmark points
  private grat: SVGGElement
  private grat10: SVGPathElement
  private grat5: SVGPathElement
  private sunDot: SVGCircleElement
  private sunPt: HTMLDivElement
  private contact: HTMLDivElement[] = []
  private aha: HTMLDivElement
  // Beat 4 instrumentation
  private mag: SVGGElement
  private magLbl: HTMLDivElement
  private lead: SVGLineElement
  private magChip: HTMLDivElement
  private leadLbl: HTMLDivElement
  private read: HTMLDivElement
  private rE: HTMLSpanElement
  private rC: HTMLSpanElement
  private rD: HTMLSpanElement
  private rLap: HTMLSpanElement
  private rHead: HTMLSpanElement
  private tags: HTMLDivElement[] = []
  private assume: HTMLDivElement
  private note: HTMLDivElement
  private galLbl: HTMLDivElement
  private sunLbl: HTMLDivElement
  private ringMark: SVGCircleElement
  private ringTag: HTMLDivElement
  private labTag: HTMLDivElement
  private lapLbl: HTMLDivElement

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    const L = (this.L = c.L)
    this.g = svg('g', {}, c.back)
    // the Geneva basin, in metres east/north of CERN (a transform maps it to the screen)
    this.geo = svg('g', {}, this.g)
    const toD = (pts: [number, number][], close = false) =>
      pts
        .map(([la, lo], i) => {
          const [x, y] = geo(la, lo)
          return `${i ? 'L' : 'M'}${x.toFixed(0)},${y.toFixed(0)}`
        })
        .join('') + (close ? 'Z' : '')
    path(this.geo, { d: toD(LAKE, true), fill: '#86A8D8', 'fill-opacity': 0.035, stroke: '#9AA0AE', 'stroke-opacity': 0.55, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })
    path(this.geo, { d: toD(JURA), fill: 'none', stroke: '#5C6270', 'stroke-width': 1, 'stroke-dasharray': '6 3 1 3', 'vector-effect': 'non-scaling-stroke' })
    path(this.geo, { d: toD(BORDER), fill: 'none', stroke: '#5C6270', 'stroke-opacity': 0.8, 'stroke-width': 1, 'stroke-dasharray': '1 4', 'vector-effect': 'non-scaling-stroke' })
    for (const [t, la, lo] of [
      ['GENEVA', GENEVA[0] - 0.012, GENEVA[1] + 0.035],
      ['LAKE GENEVA', 46.43, 6.52],
      ['JURA', 46.34, 5.93],
      ['FRANCE', 46.14, 5.93],
      ['SWITZERLAND', 46.3, 6.3],
    ] as [string, number, number][]) {
      const el = div('sp-lbl sp-geo', this.box, t)
      el.dataset.x = String(geo(la, lo)[0])
      el.dataset.y = String(geo(la, lo)[1])
      this.geoLbl.push(el)
    }
    this.lhc = svg('circle', { fill: 'none', stroke: '#ECE6D9', 'stroke-opacity': 0.55, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, this.g)
    this.lhcLbl = label(this.box, 'sp-call', ['LHC · 26.7 km · 13.6 TeV', 'real ring: eight arcs, eight straights'])
    this.lapLbl = label(this.box, 'sp-call sp-dim', ['LAP: 89 µs'])
    this.ghost = svg('circle', { fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.5, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, this.g)
    this.ghostLbl = label(this.box, 'sp-call sp-call--field', ['WITH LHC MAGNETS'])
    const lm: [number, 'cern' | 'sun', string[], boolean?][] = [
      [1.2742e7, 'cern', ['EARTH', '12,742 km'], true],
      [7.688e8, 'cern', ["MOON'S ORBIT", '768,800 km across']],
      [1.3927e9, 'sun', ['SUN'], true],
      [2 * AU, 'sun', ["EARTH'S ORBIT", '2 AU across']],
      [60.14 * AU, 'sun', ["NEPTUNE'S ORBIT", 'Solar System · 60 AU across']],
    ]
    for (const [D, centre, lines, disc] of lm) {
      this.lms.push({
        D,
        centre,
        disc,
        c: svg('circle', { fill: disc ? '#0B0F17' : 'none', 'fill-opacity': disc ? 0.6 : 0, stroke: '#86A8D8', 'stroke-opacity': 0.75, 'stroke-width': 1 }, this.g),
        lbl: label(this.box, 'sp-lmc', lines),
      })
    }
    // the planet under the ring: 10° graticule (and 5° while it is large), drawn in metres like the basin
    this.grat = svg('g', {}, this.g)
    this.grat5 = path(this.grat, { d: graticulePath(5, 10), fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.16, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })
    this.grat10 = path(this.grat, { d: graticulePath(10), fill: 'none', stroke: '#86A8D8', 'stroke-opacity': 0.34, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })
    this.prox = svg('circle', { r: 2.2, fill: '#ECE6D9' }, this.g)
    this.proxLbl = label(this.box, 'sp-lmc', ['PROXIMA CENTAURI', 'nearest star · 4.2 ly'])
    this.sunDot = svg('circle', { r: 2, fill: '#ECE6D9' }, this.g)
    this.sunPt = label(this.box, 'sp-lmc', ['SUN'])
    this.cernDot = svg('circle', { r: 2.4, fill: '#ECE6D9' }, this.g)
    this.cern = label(this.box, 'sp-call sp-cern', ['CERN'])
    // the contact point keeps a name as the world shrinks into it
    this.contact = [
      label(this.box, 'sp-call sp-cern', ['EARTH', '12,742 km across']),
      label(this.box, 'sp-call sp-cern', ['SOLAR SYSTEM', '60 AU across']),
      label(this.box, 'sp-call sp-cern', ['SUN · PROXIMA CENTAURI', 'nearest star, 4.2 ly away']),
    ]
    // the aha, as a display moment inside the ring
    this.aha = div('sp-aha', this.box)
    span('sp-aha__k', this.aha, 'Planck-energy ring · LHC magnets')
    const v = span('sp-aha__v', this.aha, '~2,500')
    const em = document.createElement('em')
    em.textContent = 'light-years around'
    v.appendChild(em)
    const sub = span('sp-aha__s', this.aha, '')
    const b1 = document.createElement('b')
    b1.textContent = '~780 ly'
    sub.append(b1, ' across')

    // magnifier + leader
    this.mag = svg('g', {}, c.top)
    svg('circle', { r: L.gR, fill: 'none', stroke: '#9AA0AE', 'stroke-opacity': 0.8, 'stroke-width': 1 }, this.mag)
    path(this.mag, { d: `M0,${-L.gR}v6M0,${L.gR}v-6M${-L.gR},0h6M${L.gR},0h-6`, stroke: '#9AA0AE', 'stroke-width': 1 })
    this.magLbl = label(this.box, 'sp-call sp-mag-lbl', ['TARGET', '1.5 × 10⁻²⁰ m'])
    this.magChip = div('sp-lbl sp-thread-tag sp-mag-chip', this.box)
    chip('speculative', this.magChip)
    chip('analogy', this.magChip)
    span('sp-lbl__b', this.magChip, 'a string, if resolved · ℓs assumed')
    this.lead = line(c.top, { class: 'sp-hair', stroke: '#9AA0AE', 'stroke-opacity': 0.6, 'stroke-dasharray': '2 3' })
    this.leadLbl = div('sp-lbl sp-lead-lbl', this.box, 'MACHINE ÷ TARGET ≈ 10⁵⁴')

    // readouts
    this.read = div('sp-read', this.box)
    this.rHead = span('sp-read__head', this.read, 'Collision energy')
    this.rE = span('sp-read__big', this.read, '13.6 TeV')
    const row = (k: string) => {
      const r = div('sp-read__row', this.read)
      span('sp-read__k', r, k)
      return span('sp-read__v', r, '')
    }
    this.rC = row('Around')
    this.rD = row('Across')
    this.rLap = row('Real lap')
    for (let i = 0; i < 5; i++) this.tags.push(div('sp-lbl sp-tag', this.box, TAG_TEXT[i]))
    this.assume = div('sp-lbl sp-assume', this.box, 'ASSUMES LHC 8.33 T MAGNETS · ALL ENERGY IN ONE COLLISION (GENEROUS)')
    this.note = div('sp-note sp-map-note', this.box)
    chip('analogy', this.note)
    span('sp-note__t', this.note, 'Ring drawn as a perfect circle; stars placed at random. Sizes are to scale.')
    this.galLbl = label(this.box, 'sp-lmc sp-gal', ['MILKY WAY', '87,400 ly across'])
    this.sunLbl = label(this.box, 'sp-lmc', ['SUN · 26,700 ly FROM CENTRE'])
    this.ringMark = svg('circle', { r: 12, fill: 'none', stroke: '#86A8D8', 'stroke-width': 1 }, c.top)
    this.ringTag = label(this.box, 'sp-call sp-call--field sp-ring-tag', ['NOT GALAXY-SIZED:', "a small circle on the galaxy's map"])
    this.labTag = label(this.box, 'sp-call sp-lab-tag', [''])
  }

  update(S: StageState) {
    const L = this.L
    const M = S.map
    const T = S.T
    const on = M.on
    op(this.g, on)
    const live = on > 0 || (T >= SI.floor && T < SI.sideways)
    op(this.box, live ? 1 : 0)
    if (!live) {
      op(this.mag, 0)
      op(this.lead, 0)
      op(this.ringMark, 0)
      return
    }
    const H = L.H
    const k = H / M.Lm
    const X = (x: number) => mapX(M, L, x)
    const Y = (y: number) => mapY(M, L, y)
    const inB4 = T >= SI.bigger && T < SI.floor
    const inB5 = T >= SI.floor && T < SI.sideways
    const lab = M.lab
    const p4 = local(T, 'bigger')

    // Geneva basin
    const lakeK = Math.log10(73e3 * k)
    const ga = on * smoothstep(1.1, 1.8, lakeK) * (lab ? M.dim : 1) * (inB5 ? smoothstep(0.1, 0.14, local(T, 'floor')) * 0.18 : 1)
    op(this.geo, ga)
    if (ga > 0) sa(this.geo, 'transform', `translate(${(M.ax - M.cx * k).toFixed(2)} ${(M.ay + M.cy * k).toFixed(2)}) scale(${k.toExponential(5)} ${(-k).toExponential(5)})`)
    const gl = ga * smoothstep(2.35, 2.7, lakeK)
    // place names give way to the readout block (and the magnifier) where they would collide
    const rx0 = L.W - 380
    const ry0 = L.H / 2 + 110
    for (const el of this.geoLbl) {
      const gx = X(Number(el.dataset.x))
      const gy = Y(Number(el.dataset.y))
      const under = !L.mobile && inB4 && ((gx > rx0 && gy > ry0) || Math.hypot(gx - L.gx, gy - L.gy) < L.gR + 60)
      op(el, gl * 0.9 * (inB5 || under ? 0 : 1))
      if (ga > 0) at(el, gx, gy, ' translate(-50%,-50%)')
    }
    // the real LHC (dashed, 8.49 km)
    const va = landmarkVis(LHC_REAL_D, M.Lm) * on
    op(this.lhc, va)
    sa(this.lhc, 'cx', X(0))
    sa(this.lhc, 'cy', Y(LHC_REAL_D / 2))
    sa(this.lhc, 'r', Math.max(0.5, (LHC_REAL_D / 2) * k))
    const intro = inB4 ? M.intro : 0
    op(this.lhcLbl, on * intro)
    op(this.lapLbl, on * intro)
    at(this.lhcLbl, X(0), Y(LHC_REAL_D) - 12, ' translate(-50%,-100%)')
    at(this.lapLbl, X(0), Y(LHC_REAL_D / 2), ' translate(-50%,-50%)')
    // the comparison ring (Lab: LHC magnets)
    const gh = lab && M.ghostD > 0 ? on * M.ringOn : 0
    op(this.ghost, gh)
    op(this.ghostLbl, gh)
    if (gh > 0) {
      const r = (M.ghostD / 2) * k
      sa(this.ghost, 'cx', X(0))
      sa(this.ghost, 'cy', Y(M.ghostD / 2))
      sa(this.ghost, 'r', Math.max(0.5, r))
      at(this.ghostLbl, X(0) + r * 0.72 + 6, Y(M.ghostD / 2) - r * 0.72, ' translate(0,-100%)')
    }
    // Earth's graticule: the planet's surface under the ring until Earth itself is small
    const logL = Math.log10(M.Lm)
    const gra = on * smoothstep(5.25, 5.85, logL) * (1 - smoothstep(7.9, 8.4, logL)) * (lab ? M.dim : 1) * (inB5 ? 1 - smoothstep(0.08, 0.13, local(T, 'floor')) : 1)
    op(this.grat, gra)
    if (gra > 0) {
      sa(this.grat, 'transform', `translate(${(M.ax - M.cx * k).toFixed(2)} ${(M.ay + M.cy * k).toFixed(2)}) scale(${k.toExponential(5)} ${(-k).toExponential(5)})`)
      op(this.grat5, 1 - smoothstep(6.9, 7.5, logL))
    }
    // fixed-size landmarks
    const sunY = -AU
    const helio = smoothstep(9.9, 10.3, Math.log10(M.Lm))
    for (const c of this.lms) {
      const cy = c.centre === 'sun' ? sunY : 0
      let a = landmarkVis(c.D, M.Lm) * on * (c.centre === 'sun' ? helio : 1) * (inB5 ? 1 - smoothstep(0.08, 0.13, local(T, 'floor')) : 1)
      if (c.D === 1.3927e9) a *= smoothstep(-1.9, -1.6, Math.log10(c.D / M.Lm)) // the Sun shows once big enough
      op(c.c, a)
      op(c.lbl, a)
      if (a <= 0) continue
      const r = (c.D / 2) * k
      const x = X(0)
      const y = Y(cy)
      sa(c.c, 'cx', x)
      sa(c.c, 'cy', y)
      sa(c.c, 'r', Math.max(0.5, r))
      // phones: keep the (right-aligned) label on screen when its circle overflows the left edge
      at(c.lbl, Math.max(x - r * 0.72 - 8, L.mobile ? 180 : 150), Math.max(y - r * 0.72 - 4, L.mobile ? 120 : 90), ' translate(-100%,-100%)')
    }
    // the Sun as a labelled point once its disc is too small to draw (until it merges into the contact point)
    const sunA = on * helio * smoothstep(10.6, 10.9, logL) * (1 - smoothstep(12.9, 13.3, logL)) * (inB5 ? 0 : 1)
    op(this.sunDot, sunA)
    op(this.sunPt, sunA)
    if (sunA > 0) {
      sa(this.sunDot, 'cx', X(0))
      sa(this.sunDot, 'cy', Y(sunY))
      at(this.sunPt, X(0) - 8, Y(sunY) + 2, ' translate(-100%,-50%)')
    }
    // the nearest star (4.2465 ly): its own label while it is apart from the ring's foot, then part of it
    const pd = 4.2465 * LY
    const pr = Math.log10(pd / M.Lm)
    const pa = on * smoothstep(-2.9, -2.4, pr) * (1 - smoothstep(0.25, 0.5, pr)) * (1 - M.honest)
    const px = X(pd * Math.cos(PROXIMA_DIR))
    const py = Y(pd * Math.sin(PROXIMA_DIR))
    op(this.prox, pa)
    op(this.proxLbl, pa * (1 - smoothstep(17.9, 18.15, logL)))
    sa(this.prox, 'cx', px)
    sa(this.prox, 'cy', py)
    at(this.proxLbl, px - 10, py + 2, ' translate(-100%,-50%)')
    // CERN: the collision point, at the ring's bottom — renamed as the world shrinks into it
    const cx = X(0)
    const cy = Y(0)
    const ca = on * (1 - M.honest) * (inB5 ? 1 - smoothstep(0.26, 0.32, local(T, 'floor')) : 1)
    op(this.cernDot, ca)
    sa(this.cernDot, 'cx', cx)
    sa(this.cernDot, 'cy', cy)
    const st1 = smoothstep(8.7, 8.95, logL) // Earth under 2% of the view
    const st2 = smoothstep(14.6, 14.85, logL) // the Solar System under 2%
    const st3 = smoothstep(17.9, 18.15, logL) // Proxima within ~4% of the view of the ring's foot
    // (between ~10¹⁰ m and the Solar System's collapse the orbits carry their own labels)
    const cw = [1 - st1, st1 * (1 - smoothstep(9.85, 10.1, logL)), st2 * (1 - st3), st3]
    op(this.cern, ca * cw[0])
    at(this.cern, cx, cy + 10, ' translate(-50%,0)')
    this.contact.forEach((el, i) => {
      const a = ca * cw[i + 1] * (lab ? 0 : 1)
      op(el, a)
      if (a > 0) at(el, cx, cy + 10, ' translate(-50%,0)')
    })

    // Beat 4 instrumentation (readouts clear quickly as the camera pulls back to the galaxy)
    const b4 = inB4 ? on * (1 - M.honest) : 0
    const b4r = inB4 ? on * (1 - smoothstep(0, 0.3, M.honest)) : 0
    const logE = M.logE
    const E = Math.pow(10, logE)
    op(this.mag, b4)
    sa(this.mag, 'transform', `translate(${L.gx} ${L.gy})`)
    op(this.magLbl, b4)
    at(this.magLbl, L.gx, L.gy + L.gR + 10, ' translate(-50%,0)')
    const res = inB4 ? smoothstep(B4.grow1 + 0.03, B4.grow1 + 0.05, p4) * (1 - smoothstep(B4.land + 0.015, B4.honest - 0.005, p4)) : 0
    op(this.magChip, b4 * res)
    if (L.mobile) at(this.magChip, L.W - 8, L.gy + L.gR + 38, ' translate(-100%,0)')
    else at(this.magChip, L.gx, L.gy + L.gR + 42, ' translate(-50%,0)')
    const tgt = HBARC / E
    txt(this.magLbl.lastChild as HTMLElement, `${sci(tgt, 2, true)} m`)
    // leader from magnifier to the collision point
    const dx = cx - L.gx
    const dy = cy - L.gy
    const dl = Math.hypot(dx, dy) || 1
    const lx0 = L.gx + (dx / dl) * (L.gR + 4)
    const ly0 = L.gy + (dy / dl) * (L.gR + 4)
    setLine(this.lead, lx0, ly0, cx - (dx / dl) * 6, cy - (dy / dl) * 6)
    const land = inB4 ? M.land : 0
    op(this.lead, b4 * (0.45 + 0.55 * land))
    sa(this.lead, 'stroke-opacity', (0.5 + 0.5 * land).toFixed(2))
    op(this.leadLbl, b4 * land)
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    const flip = ang > 90 || ang < -90
    at(this.leadLbl, (lx0 + cx) / 2, (ly0 + cy) / 2, ` translate(-50%,-50%) rotate(${(flip ? ang + 180 : ang).toFixed(2)}deg) translate(0,-10px)`)

    // readouts
    const locked = land > 0.5
    const ro = inB4 ? b4r * smoothstep(0.06, 0.12, p4) * (L.mobile ? 1 - land : 1) : 0
    op(this.read, ro)
    if (ro > 0) {
      const D = M.m.D
      const C = Math.PI * D
      toggle(this.rE, 'is-quiet', locked)
      txt(this.rHead, locked ? 'Planck-energy ring' : 'Collision energy')
      txt(this.rE, fmtEnergy(E))
      txt(this.rC, locked ? `${fmtEnergy(EP)}` : fmtLength(C))
      txt(this.rD, locked ? '~780 ly' : fmtLength(D))
      txt(this.rLap, `${fmtTime(C / 299792458)} · shown: 3 s`)
      txt(this.rC.previousSibling as HTMLElement, locked ? 'Energy' : 'Around')
      txt(this.rD.previousSibling as HTMLElement, 'Across')
      if (L.mobile) at(this.read, 16, L.my + L.mR + 58)
      else at(this.read, L.W - 360, L.H / 2 + 132)
    }
    // the landing: ~2,500 light-years around, as a display inside the ring (phones: under it)
    const ah = b4r * land
    op(this.aha, ah)
    if (ah > 0) {
      // (phones: nudged left, clear of the leader's label)
      at(this.aha, X(0) - (L.mobile ? 0.14 * L.mR : 0), Y(M.m.D / 2), ' translate(-50%,-50%)')
    }
    // overtake tags: pop, then settle at half strength
    this.tags.forEach((el, i) => {
      const eo = Math.log10(ringEnergyForWidth(OVERTAKES[i].D, 8.33))
      const dE = logE - eo
      const a = inB4 ? b4r * smoothstep(0, 0.12, dE) * (1 - 0.4 * smoothstep(0.5, 1.2, dE)) : 0
      op(el, a)
      toggle(el, 'is-pop', dE > 0 && dE < 0.5)
      if (L.mobile) {
        const last = OVERTAKES.reduce((n, o, j) => (logE >= Math.log10(ringEnergyForWidth(o.D, 8.33)) ? j : n), -1)
        op(el, i === last ? Math.min(1, a * 2) : 0)
        at(el, 16, Math.max(L.my - L.mR - 36, 82))
      } else at(el, L.W - 360, L.H / 2 + 292 + i * 20)
    })
    const as = inB4 ? b4r * smoothstep(B4.grow1 + 0.02, B4.land, p4) : 0
    op(this.assume, L.mobile ? 0 : as)
    // under the ring, left-aligned and wrapped so it never reaches the overtake list on the right
    at(this.assume, L.mx - L.mR, L.H - 64)
    const na = (inB4 ? on * smoothstep(0.1, 0.16, p4) * (1 - smoothstep(B4.grow1, B4.grow1 + 0.04, p4)) : 0) + (lab ? on : 0)
    op(this.note, L.mobile ? 0 : Math.min(1, na))
    if (L.mobile) at(this.note, 16, L.H * 0.06 + 40)
    else if (lab) at(this.note, 32 + (L.W > 1100 ? 40 : 0), L.H - 64)
    else at(this.note, L.mx - 160, L.H - 64)

    // honest proportion: the galaxy
    const hon = inB4 ? M.honest : inB5 ? M.honest * on : 0
    op(this.galLbl, hon * smoothstep(0.6, 1, hon))
    op(this.sunLbl, hon * smoothstep(0.7, 1, hon))
    op(this.ringMark, hon * smoothstep(0.7, 1, hon))
    op(this.ringTag, hon * smoothstep(0.75, 1, hon))
    if (hon > 0) {
      const gx = X(GAL_X)
      const gy = Y(GAL_Y)
      const gr = 43_700 * LY * k
      at(this.galLbl, gx, gy - gr - 10, ' translate(-50%,-100%)')
      const rx = X(0)
      const ry = Y(M.m.D / 2)
      sa(this.ringMark, 'cx', rx)
      sa(this.ringMark, 'cy', ry)
      if (L.mobile) {
        at(this.sunLbl, rx - 16, ry + 12, ' translate(-100%,0)')
        at(this.ringTag, rx - 16, ry - 14, ' translate(-100%,-100%)')
      } else {
        at(this.sunLbl, rx + 16, ry + 12)
        at(this.ringTag, rx + 16, ry - 14, ' translate(0,-100%)')
      }
    }

    // Lab: the machine's own label
    const lt = lab ? on * (M.dim < 1 ? 0.4 : 1) : 0
    op(this.labTag, lt)
    if (lt > 0) {
      const D = M.m.D
      const around = M.m.kind === 'ring' ? `${fmtLength(M.m.C)} around` : `${fmtLength(M.m.C)} long`
      txt(this.labTag.firstChild as HTMLElement, `${around} · ${comparison(D)}`)
      const top = M.m.kind === 'ring' ? Y(D) - 14 : Y(0) - 18
      at(this.labTag, X(0), Math.max(80, top), ' translate(-50%,-100%)')
    }
  }
}
