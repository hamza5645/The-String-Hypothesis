/*
 * Beat 3 — smaller means harder. A second axis mirror-mapped under the Ruler:
 * log₁₀(E/GeV) = −15.705 − s, so every length gets its partner energy and energy grows to the right.
 */
import { smoothstep } from '@/core/math'
import type { StageState } from '../choreo'
import { hitsRail, type Layout } from '../layout'
import { E_LHC, EP, S_MAX, S_MIN, sOfE, sci, sup } from '../model'
import { SI, b3BeadLogE, local } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, chip, display, div, label, line, op, path, sa, setLine, span, svg, txt, type Display } from './dom'

interface ELM {
  s: number
  hair: SVGPathElement
  lbl: HTMLDivElement
  i: number
}

export class EnergyView implements View {
  private L: Layout
  private g: SVGGElement
  private axis: SVGLineElement
  private ticks: SVGPathElement
  private tickLbl: { e: number; el: HTMLDivElement }[] = []
  private endLbl: HTMLDivElement
  private title: HTMLDivElement
  private lms: ELM[] = []
  private coll: HTMLDivElement
  private brA: SVGPathElement
  private brB: SVGPathElement
  private lblA: HTMLDivElement
  private lblB: HTMLDivElement
  private bead: SVGCircleElement
  private beadLbl: HTMLDivElement
  private inset: HTMLDivElement
  private disp: Display | null = null

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    const L = (this.L = c.L)
    this.g = svg('g', {}, c.mid)
    this.axis = line(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-opacity': 0.8 })
    this.ticks = path(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-opacity': 0.6, fill: 'none' })
    // phones: the unit moves into the axis title so the decade labels fit
    for (let e = -40; e <= 15; e += 5) this.tickLbl.push({ e, el: div('sp-lbl sp-tick sp-tick--e', this.box, L.mobile ? `10${sup(e)}` : `10${sup(e)} GeV`) })
    this.endLbl = div('sp-lbl sp-tick sp-tick--e sp-tick--end', this.box, L.mobile ? '1.2 × 10¹⁹' : '1.2 × 10¹⁹ GeV')
    this.title = label(this.box, 'sp-axis-title sp-field', [L.mobile ? 'ENERGY TO SEE IT (GeV) · E ≈ ħc/d →' : 'ENERGY NEEDED TO SEE IT · E ≈ ħc/d · GROWS →'])
    const E: [number, string, string][] = [
      [-7, 'VISIBLE LIGHT', '~2 eV ↔ ~10⁻⁷ m'],
      [sOfE(-6), 'X-RAYS', '~keV ↔ atoms'],
      [-15, 'NUCLEI', '~0.2 GeV ↔ 1 fm'],
      [sOfE(Math.log10(E_LHC)), 'LHC', '13.6 TeV ↔ 1.5 × 10⁻²⁰ m'],
      [S_MIN, 'PLANCK', '1.22 × 10¹⁹ GeV ↔ 1.6 × 10⁻³⁵ m'],
    ]
    const SHORT = ['~2 eV', '', '', '13.6 TeV', '1.2 × 10¹⁹ GeV']
    E.forEach(([s, a, b], i) => {
      if (L.mobile && (i === 1 || i === 2)) return
      this.lms.push({ s, hair: path(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-opacity': 0.45, 'stroke-dasharray': '1 2' }), lbl: label(this.box, 'sp-elm', [a, L.mobile ? SHORT[i] : b]), i })
    })
    this.coll = div('sp-note sp-coll', this.box)
    span('sp-note__t', this.coll, 'Protons are bags of quarks and gluons. Each collision uses only part of the 13.6 TeV, so ~10⁻¹⁹ m in practice.')
    this.brA = path(this.g, { class: 'sp-hair sp-ink', fill: 'none' })
    this.brB = path(this.g, { class: 'sp-hair', stroke: '#86A8D8', 'stroke-dasharray': '3 3', fill: 'none' })
    this.lblA = label(this.box, 'sp-call sp-call--r', L.mobile ? ['1932 → 2022 · ~7 DECADES IN 90 YR'] : ['1932 → 2022 · BEAM ENERGY PER PROTON', '~7 powers of ten in 90 years'])
    this.lblB = label(this.box, 'sp-call sp-call--field', L.mobile ? ['~15 MORE TO PLANCK'] : ['~15 MORE', 'to the Planck energy'])
    this.bead = svg('circle', { r: 7, fill: 'url(#sp-bead)' }, this.g)
    this.beadLbl = div('sp-lbl sp-bead-lbl', this.box)

    // concentration inset: the total isn't the problem, concentrating it is
    this.inset = div('sp-card sp-inset', this.box)
    const head = div('sp-inset__head', this.inset)
    chip('observed', head)
    span('sp-inset__title', head, 'The concentration problem')
    const row = div('sp-inset__row', this.inset)
    const a = div('sp-inset__cell', row)
    const cv = document.createElement('canvas')
    cv.className = 'sp-inset__cv'
    a.appendChild(cv)
    label(a, 'sp-inset__lbl', ['ONE LHC BEAM (DESIGN)', '~360 MJ · spread over', '3 × 10¹⁴ protons'])
    const b = div('sp-inset__cell', row)
    const cv2 = document.createElement('canvas')
    cv2.className = 'sp-inset__cv'
    b.appendChild(cv2)
    label(b, 'sp-inset__lbl', ['PLANCK ENERGY', '~2 × 10⁹ J ≈ 60 L of petrol', 'in one collision'])
    span('sp-inset__cap', this.inset, 'The total isn’t the problem. Concentrating it is.')
    paintInset(cv, cv2, L.mobile)
    // desktop: the bead's multiplier as a display moment (upper right), before the inset takes the slot
    if (!L.mobile) this.disp = display(this.box, 'sp-disp--e', 'Energy needed · LHC → Planck', '× 1', ['13.6 TeV → 1.2 × 10¹⁹ GeV'])
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const inE = T >= SI.energy && T < SI.bigger
    const on = inE ? 1 : T >= SI.bigger && T < SI.floor ? S.fold : 0
    op(this.g, on)
    op(this.box, on > 0 ? 1 : 0)
    if (on <= 0) return
    sa(this.g, 'transform', `translate(0 ${L.ry}) scale(1 ${Math.max(0.001, S.fold).toFixed(4)}) translate(0 ${-L.ry})`)
    const fy = (y: number) => L.ry + (y - L.ry) * S.fold
    const p = inE ? local(T, 'energy') : 1
    const X = (s: number) => S.rx0 + ((S.sL - s) / (S.sL - S.sR)) * (L.rx1 - S.rx0)
    const ey = L.ey
    const unroll = smoothstep(0.03, 0.24, p)
    const x0 = X(S_MAX)
    const x1 = X(S_MIN)
    const xr = x0 + (x1 - x0) * unroll
    setLine(this.axis, x0, ey, xr, ey)
    let d = ''
    for (let e = -42; e <= 19; e++) {
      const x = X(sOfE(e))
      if (x > xr || x < x0 - 1) continue
      const h = e % 5 === 0 ? 4 : 1.5
      d += `M${x.toFixed(1)},${ey - h}V${ey + h}`
    }
    sa(this.ticks, 'd', d || 'M0,0')
    const step = L.mobile ? 10 : 5
    for (const k of this.tickLbl) {
      const x = X(sOfE(k.e))
      // the Planck end carries its own label (1.2 × 10¹⁹ GeV): the last decade tick before it stays quiet
      const show = k.e % step === 0 && x <= xr && x < x1 - (L.mobile ? 70 : 96) && !hitsRail(L, x - 30, ey - 18, x + 30, ey - 4)
      op(k.el, show ? on : 0)
      at(k.el, x, fy(ey - 7), ' translate(-50%,-100%)')
    }
    op(this.endLbl, on * smoothstep(0.2, 0.26, p))
    // phones: the Planck end sits near the screen edge, so its label hangs left of the tick (as lblB does)
    at(this.endLbl, x1, fy(ey - 7), L.mobile ? ' translate(-100%,-100%)' : ' translate(-50%,-100%)')
    op(this.title, on * smoothstep(0.1, 0.22, p))
    at(this.title, x0 - 2, fy(ey + 8))

    // energy landmarks, left → right, each joined to its length by a hairline
    const TIER = [0, 1, 0, 1, 0]
    const g0 = L.ry + (L.mobile ? 21 : 24) // below the Ruler's tick labels
    const g1 = ey - (L.mobile ? 21 : 24) // above the energy tick labels
    for (const m of this.lms) {
      const a = smoothstep(0.16 + m.i * 0.05, 0.24 + m.i * 0.05, p) * on
      const x = X(m.s)
      op(m.hair, a)
      // each joiner skips both tick-label rows, so it never strikes through a number
      const xs = x.toFixed(1)
      sa(m.hair, 'd', `M${xs},${L.ry + 3}V${L.ry + 6}M${xs},${g0}V${g1}M${xs},${ey - 5}V${ey - 3}`)
      op(m.lbl, a)
      // two fixed tiers so neighbours never collide
      const tier = L.mobile ? [0, 0, 0, 1, 0][m.i] : TIER[m.i]
      const ly = ey + (L.mobile ? 20 : 22) + (tier ? (L.mobile ? 26 : 32) : 0)
      const right = x > L.W - 170
      at(m.lbl, right ? x + 4 : x, fy(ly), right ? ' translate(-100%,0)' : ' translate(-50%,0)')
    }
    const xl = X(sOfE(Math.log10(E_LHC)))
    const ca = L.mobile ? 0 : smoothstep(0.34, 0.44, p) * on
    op(this.coll, ca)
    // at the LHC mark: right of it, under the LHC label, clear of every joiner
    at(this.coll, xl + 12, fy(ey + 94))

    // brackets on the energy axis: history (solid) vs the gap (dashed)
    const yb = ey + (L.mobile ? 88 : 158)
    const xa0 = X(sOfE(Math.log10(1.22e-3)))
    const xa1 = X(sOfE(Math.log10(6800)))
    const xb0 = X(sOfE(Math.log10(E_LHC)))
    const xb1 = X(sOfE(Math.log10(EP)))
    sa(this.brA, 'd', `M${xa0},${yb - 5}V${yb}H${xa1}V${yb - 5}`)
    sa(this.brB, 'd', `M${xb0},${yb - 5}V${yb}H${xb1}V${yb - 5}`)
    const ba = smoothstep(0.4, 0.5, p) * on
    const bb = smoothstep(0.46, 0.56, p) * on
    op(this.brA, ba)
    op(this.lblA, ba)
    op(this.brB, bb)
    op(this.lblB, bb)
    at(this.lblA, xa1, fy(yb + 6), ' translate(-100%,0)')
    if (L.mobile) at(this.lblB, xb1, fy(yb + 22), ' translate(-100%,0)')
    else at(this.lblB, xb0 + 8, fy(yb + 6))
    // the bead: × 10 … × 10⁵ … × 10¹⁰ … × 9 × 10¹⁴
    const le = b3BeadLogE(p)
    const xbd = X(sOfE(le))
    const beadOn = smoothstep(0.5, 0.56, p) * on
    op(this.bead, beadOn)
    sa(this.bead, 'cx', xbd)
    sa(this.bead, 'cy', yb)
    const ratio = Math.pow(10, le) / E_LHC
    const r = ratio < 1.5 ? '× 1' : ratio > 8e14 ? '× 9 × 10¹⁴' : `× ${sci(ratio, 1)}`
    op(this.beadLbl, L.mobile ? beadOn : 0)
    txt(this.beadLbl, r)
    // (phones only) centred on the bead, but kept right of the LHC label (which hangs left of its tick) and
    // inside the screen, so "× 9 × 10¹⁴" stays whole at the Planck end. Width: mono 12px + 0.08em tracking.
    const bw = r.length * 8.2
    at(this.beadLbl, Math.min(Math.max(xbd - bw / 2, xb0 + 8), L.W - 12 - bw), fy(yb - 12), ' translate(0,-100%)')

    // upper right: the multiplier (display), then the concentration inset takes the same slot
    const ia = inE ? smoothstep(0.82, 0.9, p) : 0
    const dx = L.W - Math.max(96, 0.07 * L.W)
    const dy = Math.max(96, 0.11 * L.H)
    if (this.disp) {
      const d = this.disp
      op(d.el, inE ? smoothstep(0.5, 0.56, p) * (1 - smoothstep(0.8, 0.85, p)) : 0)
      txt(d.v, r)
      at(d.el, dx, dy, ' translate(-100%,0)')
    }
    op(this.inset, ia)
    if (L.mobile) at(this.inset, 12, 70)
    else at(this.inset, dx, dy, ' translate(-100%,0)')
  }
}

/** Two pictograms, painted once: a haze of 20k points (one beam) vs a single pair (one collision). */
function paintInset(a: HTMLCanvasElement, b: HTMLCanvasElement, mobile: boolean) {
  const W = mobile ? 150 : 170
  const H = mobile ? 70 : 84
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  for (const cv of [a, b]) {
    cv.width = W * dpr
    cv.height = H * dpr
    cv.style.width = `${W}px`
    cv.style.height = `${H}px`
  }
  const ca = a.getContext('2d')
  const cb = b.getContext('2d')
  if (!ca || !cb) return
  ca.scale(dpr, dpr)
  cb.scale(dpr, dpr)
  let seed = 7
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  ca.fillStyle = 'rgba(236,230,217,0.55)'
  for (let i = 0; i < 20000; i++) {
    // an elongated bunch train across the cell
    const x = 6 + rnd() * (W - 12)
    const g = (rnd() + rnd() + rnd() - 1.5) * 0.9
    const y = H / 2 + g * H * 0.28
    ca.fillRect(x, y, 0.55, 0.55)
  }
  cb.fillStyle = 'rgba(236,230,217,1)'
  for (const dx of [-5, 5]) {
    const x = W / 2 + dx
    const grd = cb.createRadialGradient(x, H / 2, 0, x, H / 2, 6)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.3, 'rgba(236,230,217,0.6)')
    grd.addColorStop(1, 'rgba(236,230,217,0)')
    cb.fillStyle = grd
    cb.beginPath()
    cb.arc(x, H / 2, 6, 0, Math.PI * 2)
    cb.fill()
  }
  cb.strokeStyle = 'rgba(134,168,216,0.6)'
  cb.lineWidth = 0.8
  cb.beginPath()
  cb.moveTo(12, H / 2)
  cb.lineTo(W / 2 - 12, H / 2)
  cb.moveTo(W - 12, H / 2)
  cb.lineTo(W / 2 + 12, H / 2)
  cb.stroke()
}
