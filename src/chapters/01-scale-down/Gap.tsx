import { useEffect, useRef } from 'react'
import { useChapter } from '@/core/chapter'
import { easeInOutCubic, range } from '@/core/math'
import { L_PLANCK } from './model'

/**
 * Beat 5's pivotal line: it appears large (Bodoni italic) centred above the point, then settles
 * into the text column (a scroll-scrubbed FLIP from its opening pose to its place in the column).
 */
export function GapQuestion({ children }: { children: string }) {
  const h = useChapter()
  const slot = useRef<HTMLDivElement>(null)
  const q = useRef<HTMLHeadingElement>(null)
  const rest = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let raf = 0
    let last = ''
    rest.current = slot.current?.parentElement?.querySelector<HTMLElement>('.sd-gap__rest') ?? null
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const k = h.step('gap')
      const el = q.current
      const sl = slot.current
      if (!el || !sl || k <= 0 || k >= 1) return
      const e = easeInOutCubic(range(k, 0.1, 0.38))
      const W = window.innerWidth
      const H = window.innerHeight
      const mobile = W / H < 0.8
      const r = sl.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      // the point sits at (0.5 + 0.14) W on desktop (view shift): the question opens centred above it.
      // On phones (point in the upper third, text at the bottom) it opens just below the point.
      const sx = mobile ? 0.5 * W : 0.64 * W
      const sy = mobile ? 0.5 * H : 0.29 * H
      const s0 = mobile ? 1.08 : 1.75
      const dx = (sx - cx) * (1 - e)
      const dy = (sy - cy) * (1 - e)
      const sc = s0 + (1 - s0) * e
      const t = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`
      if (t !== last) {
        el.style.transform = t
        if (rest.current) rest.current.style.opacity = e.toFixed(3)
        last = t
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [h])

  return (
    <div ref={slot} className="sd-gap__slot">
      <h3 ref={q} className="sd-gap__q">
        {children}
      </h3>
    </div>
  )
}

/** Two side-by-side brackets on one log axis: YOU → PROTON (~15 decades) vs UNEXPLORED (~16). */
export function Brackets() {
  const W = 340
  const e0 = 1
  const e1 = -36
  const x = (e: number) => ((e0 - e) / (e0 - e1)) * W
  const you = Math.log10(1.7)
  const proton = Math.log10(0.84e-15)
  const edge = Math.log10(3e-19)
  const lp = Math.log10(L_PLANCK)
  return (
    <figure className="sd-brackets" aria-label="Two spans on the same logarithmic scale: from you to a proton, about 15 powers of ten; from the edge of measurement to the Planck length, about 16 powers of ten, unexplored.">
      <svg viewBox={`0 0 ${W} 74`} role="img" aria-hidden="true">
        <defs>
          <linearGradient id="sd-edge-g" x1="0" x2="1">
            <stop offset="0" stopColor="#86A8D8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#86A8D8" stopOpacity="0.35" />
            <stop offset="1" stopColor="#86A8D8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* axis */}
        <line x1={0} x2={W} y1={30} y2={30} stroke="#5C6270" strokeWidth={1} />
        {Array.from({ length: 38 }, (_, i) => e0 - i).map((e) => (
          <line key={e} x1={x(e)} x2={x(e)} y1={e % 5 === 0 ? 26 : 28} y2={30} stroke="#5C6270" strokeWidth={1} strokeDasharray={e < -18.5 ? '1 1' : undefined} />
        ))}
        {/* measurement edge band */}
        <rect x={x(-18)} y={20} width={x(-20) - x(-18)} height={14} fill="url(#sd-edge-g)" />
        {/* bracket: you → proton (solid) */}
        <path d={`M${x(you)} 18 V12 H${x(proton)} V18`} fill="none" stroke="#ECE6D9" strokeWidth={1} />
        <text x={(x(you) + x(proton)) / 2} y={7} textAnchor="middle" className="sd-brackets__t">
          YOU → PROTON · ~15
        </text>
        {/* bracket: unexplored (dashed) */}
        <path d={`M${x(edge)} 18 V12 H${x(lp)} V18`} fill="none" stroke="#86A8D8" strokeWidth={1} strokeDasharray="3 3" />
        <text x={(x(edge) + x(lp)) / 2} y={7} textAnchor="middle" className="sd-brackets__t sd-brackets__t--field">
          UNEXPLORED · ~16
        </text>
        {/* markers */}
        <circle cx={x(you)} cy={30} r={2.2} fill="#ECE6D9" />
        <circle cx={x(proton)} cy={30} r={2.2} fill="#ECE6D9" />
        <line x1={x(lp)} x2={x(lp)} y1={24} y2={40} stroke="#86A8D8" strokeWidth={1} />
        <text x={x(you)} y={48} className="sd-brackets__s">
          1.7 m
        </text>
        <text x={x(proton)} y={48} textAnchor="middle" className="sd-brackets__s">
          0.84 fm
        </text>
        <text x={x(-19)} y={48} textAnchor="middle" className="sd-brackets__s">
          edge
        </text>
        <text x={x(lp)} y={48} textAnchor="end" className="sd-brackets__s sd-brackets__s--field">
          ℓ
          <tspan baselineShift="sub" fontSize="80%">
            P
          </tspan>{' '}
          · 1.6 × 10⁻³⁵ m
        </text>
        <text x={0} y={68} className="sd-brackets__cap">
          POWERS OF TEN · EACH TICK ONE DECADE
        </text>
      </svg>
    </figure>
  )
}
