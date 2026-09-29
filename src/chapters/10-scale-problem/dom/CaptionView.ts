/*
 * Opening captions: the Thread's own marks (SPECULATIVE ~ ANALOGY), and the pull-back's caption
 * under the glow (a string blurs into a point; measured particles look like points).
 */
import { smoothstep } from '@/core/math'
import { handoffFit } from '@/core/handoff'
import { prefersReducedMotion } from '@/core/time'
import type { StageState } from '../choreo'
import type { Layout } from '../layout'
import { S0_H2, SI, local, openS } from '../timeline'
import type { Ctx, View } from './Diagram'
import { at, chip, div, op, span } from './dom'

export class CaptionView implements View {
  private L: Layout
  private thread: HTMLDivElement
  private blur: HTMLDivElement

  private box: HTMLDivElement

  constructor(c: Ctx) {
    this.box = div('sp-box', c.lbl)
    this.L = c.L
    this.thread = div('sp-cap sp-cap--thread', this.box)
    const r = div('sp-cap__chips', this.thread)
    chip('speculative', r)
    chip('analogy', r)
    span('sp-cap__t', this.thread, 'THE THREAD · ℓs ~ 10⁻³⁴ m · HYPOTHETICAL')
    this.blur = div('sp-cap sp-cap--blur', this.box)
    const r2 = div('sp-cap__chips', this.blur)
    chip('derived', r2)
    chip('analogy', r2)
    chip('observed', r2)
    span('sp-cap__t', this.blur, 'Step back, and a string blurs into a point. Every elementary particle measured so far looks like a point.')
  }

  update(S: StageState) {
    const L = this.L
    const T = S.T
    const fit = handoffFit(L.W / L.H)
    const R = (1.3 * fit) / L.u
    const live = T < SI.quarter
    op(this.box, live ? 1 : 0)
    if (!live) return
    const po = local(T, 'open')
    // The Thread's marks stay on it for as long as it glows warm, and ride the loop as the pull-back
    // shrinks it: the same scale and warmth rule as OpeningGL (δ = L/50, warmth = smoothstep(1, 3, ℓ/δ)).
    // Reduced motion: no pull-back; the marks leave with the loop as it cross-fades into the point.
    const reduced = prefersReducedMotion()
    const k = T < SI.open || reduced ? 1 : Math.pow(10, S0_H2 - openS(po))
    const lr = (2 * Math.PI * R * k) / (L.H / 50) // ℓ/δ, in px
    const a = T < SI.open ? 1 : T < SI.decades ? (reduced ? 1 - smoothstep(0.3, 0.6, po) : smoothstep(1, 3, lr)) : 0
    op(this.thread, a)
    if (L.mobile) at(this.thread, L.Wc / 2, L.H / 2 - R * k - 26, ' translate(-50%,-100%)')
    else at(this.thread, L.Wc / 2, L.H / 2 + R * k + 30, ' translate(-50%,0)')
    // phones: the beat text rises through mid-screen as its step ends, so the caption waits for it to clear
    const [b0, b1] = L.mobile ? [0.82, 0.92] : [0.62, 0.78]
    const b = T >= SI.open && T < SI.decades ? smoothstep(b0, b1, po) : T >= SI.decades && T < SI.quarter ? 1 - smoothstep(0, 0.05, local(T, 'decades')) : 0
    op(this.blur, b)
    if (L.mobile) at(this.blur, L.Wc / 2, L.H / 2 - 40, ' translate(-50%,-100%)')
    else at(this.blur, L.Wc / 2, L.H / 2 + 42, ' translate(-50%,0)')
  }
}
