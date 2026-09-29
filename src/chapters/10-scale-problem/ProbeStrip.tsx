/*
 * The Lab's Ruler strip: a draggable log cursor for the probe distance d (8.8 × 10²⁶ m … 10⁻³⁶ m),
 * with the explored / unexplored shading and Beat 6's string band. Arrows = 0.1 decade, PgUp/PgDn = 1.
 */
import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { fmtEnergy, fmtMeters, energyOf, S_LOWSCALE, S_MAX, S_MIN, S_TRAD } from './model'
import { LOG_D_MAX, LOG_D_MIN, useScaleLab } from './store'

const W = 320
const H = 58
const PAD = 8
const Y = 34
const x = (s: number) => PAD + ((LOG_D_MAX - s) / (LOG_D_MAX - LOG_D_MIN)) * (W - 2 * PAD)
const s = (px: number) => LOG_D_MAX - ((px - PAD) / (W - 2 * PAD)) * (LOG_D_MAX - LOG_D_MIN)

export function ProbeStrip() {
  const logD = useScaleLab((st) => st.logD)
  const setLogD = useScaleLab((st) => st.setLogD)
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const fromEvent = useCallback(
    (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const px = ((e.clientX - r.left) / r.width) * W
      setLogD(s(px), null)
    },
    [setLogD],
  )

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'PageUp' || e.key === 'PageDown' ? 1 : 0.1
    let v = logD
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') v -= step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') v += step
    else if (e.key === 'Home') v = LOG_D_MAX
    else if (e.key === 'End') v = LOG_D_MIN
    else return
    e.preventDefault()
    setLogD(Math.round(v * 10) / 10, null)
  }

  const d = Math.pow(10, logD)
  const E = energyOf(d)
  const cx = x(logD)
  const pos = (LOG_D_MAX - logD) / (LOG_D_MAX - LOG_D_MIN)
  const eLabel = `E ≈ ${fmtEnergy(E)}`
  const flip = cx > W * 0.62
  return (
    <div className="sp-strip">
      <div className="sp-strip__top">
        <span className="sp-strip__lbl">
          Probe distance <span className="sp-nocase">d</span>
        </span>
        <span className="sp-strip__hint">drag toward the small end →</span>
      </div>
      <svg
        ref={ref}
        className="sp-strip__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={0}
        aria-label="Probe distance d, logarithmic, from the observable universe to past the Planck length"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 1000) / 10}
        aria-valuetext={`d = ${fmtMeters(d)}, energy about ${fmtEnergy(E)}`}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
          fromEvent(e)
        }}
        onPointerMove={(e) => dragging.current && fromEvent(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        data-ui
      >
        {/* explored: solid ink; unexplored: dashed field; the stub continues past ℓP */}
        <line x1={x(S_MAX)} x2={x(-19)} y1={Y} y2={Y} stroke="#ECE6D9" strokeWidth={2} />
        <line x1={x(-19)} x2={x(S_MIN)} y1={Y} y2={Y} stroke="#86A8D8" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="3 3" />
        <line x1={x(S_MIN)} x2={x(-36)} y1={Y} y2={Y} stroke="#86A8D8" strokeOpacity={0.3} strokeDasharray="1 2.5" />
        {/* string band */}
        <rect x={x(-15.2)} y={Y - 12} width={x(S_LOWSCALE) - x(-15.2)} height={8} fill="url(#sp-strip-hatch)" stroke="#5C6270" strokeWidth={0.5} />
        <rect x={x(S_LOWSCALE)} y={Y - 12} width={x(S_TRAD) - x(S_LOWSCALE)} height={8} fill="url(#sp-strip-rings)" stroke="#7D8190" strokeWidth={0.5} />
        <rect x={x(S_TRAD)} y={Y - 12} width={x(S_MIN) - x(S_TRAD)} height={8} fill="#86A8D8" fillOpacity={0.55} />
        <defs>
          <pattern id="sp-strip-hatch" width={4} height={4} patternUnits="userSpaceOnUse">
            <path d="M0,0 L4,4 M4,0 L0,4" stroke="#5C6270" strokeWidth={0.5} />
          </pattern>
          <pattern id="sp-strip-rings" width={6} height={8} patternUnits="userSpaceOnUse">
            <circle cx={3} cy={4} r={1.4} fill="none" stroke="#7D8190" strokeWidth={0.6} />
          </pattern>
        </defs>
        {[20, 10, 0, -10, -20, -30].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={Y + 3} y2={Y + 7} stroke="#5C6270" />
            <text x={x(t)} y={Y + 17} textAnchor="middle" className="sp-strip__tick">
              {t === 0 ? '1 m' : `10${sup(t)}`}
            </text>
          </g>
        ))}
        <text x={x(-15.2) - 5} y={Y - 5} textAnchor="end" className="sp-strip__tick sp-strip__tick--dim">
          string band
        </text>
        {/* the cursor */}
        <line x1={cx} x2={cx} y1={6} y2={Y + 8} stroke="#FFC98A" strokeWidth={1} />
        <circle cx={cx} cy={Y} r={5} fill="#FFF6E8" stroke="#FFC98A" strokeWidth={1} />
        <text x={flip ? cx - 6 : cx + 6} y={10} textAnchor={flip ? 'end' : 'start'} className="sp-strip__cur">
          {eLabel}
        </text>
        {/* a generous invisible hit band */}
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
      </svg>
    </div>
  )
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const sup = (n: number) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')
