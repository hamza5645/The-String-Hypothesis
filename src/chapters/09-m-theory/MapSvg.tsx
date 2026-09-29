import { useMemo } from 'react'
import { BRIDGES, G_CONTOURS, TIPS, countPieces, hypo, rhoOfG, tipCenter, type Bridge } from './model'

/**
 * The map as a flat SVG (a top-down view of the same model): the six-cusped landmass, the six tips,
 * the g-contours on the five string horns, and the bridges (solid = derived T-duality, dashed = conjectured).
 * Used by the no-WebGL fallback (full) and by the DIAL station's minimap (compact).
 */

const K = 40 // px per world unit
const P = (x: number, z: number) => [x * K, z * K] as const

function outlinePath() {
  const out: string[] = []
  const q: [number, number] = [0, 0]
  for (let i = 0; i <= 720; i++) {
    hypo((i / 720) * Math.PI * 2, q)
    const [x, y] = P(q[0], q[1])
    out.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return out.join(' ') + 'Z'
}

function hornPath(j: number, from: number, to: number, halfW: number) {
  // an island drawn as the horn from the shoreline (ρ ≈ 3.5) out towards its cusp
  const th = (TIPS[j].theta * Math.PI) / 180
  const ux = Math.cos(th)
  const uz = -Math.sin(th)
  const vx = -uz
  const vz = ux
  const pts: string[] = []
  const n = 16
  for (let i = 0; i <= n; i++) {
    const r = from + ((to - from) * i) / n
    const w = halfW * (1 - Math.pow(i / n, 1.6))
    const [x, y] = P(r * ux + w * vx, r * uz + w * vz)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  for (let i = n; i >= 0; i--) {
    const r = from + ((to - from) * i) / n
    const w = halfW * (1 - Math.pow(i / n, 1.6))
    const [x, y] = P(r * ux - w * vx, r * uz - w * vz)
    pts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ') + 'Z'
}

function arcPath(j: number, rho: number) {
  const th = (TIPS[j].theta * Math.PI) / 180
  const d = 0.55 / rho
  const a = P(rho * Math.cos(th - d), -rho * Math.sin(th - d))
  const b = P(rho * Math.cos(th + d), -rho * Math.sin(th + d))
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} A${(rho * K).toFixed(1)} ${(rho * K).toFixed(1)} 0 0 0 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
}

function bridgePath(b: Bridge) {
  const a = tipCenter(b.a)
  const c = tipCenter(b.b)
  if (b.id === 's-iib') {
    const [x, y] = P(a[0], a[2])
    return `M${x} ${y} c ${-0.9 * K} ${-0.5 * K}, ${-1.2 * K} ${0.5 * K}, 0 0`
  }
  const [x1, y1] = P(a[0], a[2])
  const [x2, y2] = P(c[0], c[2])
  if (b.kind === 'C') {
    const e = tipCenter(b.c!)
    const [fx, fy] = P(0.35, -0.25)
    const [x3, y3] = P(e[0], e[2])
    return `M${x1} ${y1} L${fx} ${fy} L${x2} ${y2} M${fx} ${fy} L${x3} ${y3}`
  }
  if (b.kind === 'T') return `M${x1} ${y1} L${x2} ${y2}`
  // arches bow slightly outward in the top-down view
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const k = 0.12
  return `M${x1} ${y1} Q${mx * (1 + k)} ${my * (1 + k)} ${x2} ${y2}`
}

export function MapSvg({
  active,
  compact = false,
  highlight = -1,
  pulseBridge,
  className,
}: {
  /** Which bridges to draw (by kind); undefined = all. */
  active?: (b: Bridge) => boolean
  compact?: boolean
  highlight?: number
  pulseBridge?: string
  className?: string
}) {
  const outline = useMemo(outlinePath, [])
  const pieces = countPieces(active ?? (() => true))
  const vb = compact ? '-300 -300 600 600' : '-380 -330 760 660'
  return (
    <svg viewBox={vb} className={className} role="img" aria-label={`Map of the five superstring theories and eleven-dimensional supergravity. Separate pieces: ${pieces}.`}>
      <defs>
        <clipPath id={`mth-land-${compact ? 'c' : 'f'}`}>
          <path d={outline} />
        </clipPath>
        <radialGradient id={`mth-fog-${compact ? 'c' : 'f'}`}>
          <stop offset="0" stopColor="#5C6270" stopOpacity="0.28" />
          <stop offset="1" stopColor="#5C6270" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={outline} fill="rgba(43,61,92,0.18)" stroke="#86A8D8" strokeOpacity="0.55" strokeWidth={compact ? 1.2 : 1} />
      {!compact && <circle r={4.1 * K} fill={`url(#mth-fog-f)`} />}
      {TIPS.map((t, j) => (
        <path key={t.id} clipPath={`url(#mth-land-${compact ? 'c' : 'f'})`} d={hornPath(j, 3.5, 6.1, 0.8)} fill={j === highlight ? 'rgba(255,201,138,0.22)' : 'rgba(134,168,216,0.14)'} stroke={j === highlight ? '#FFC98A' : '#86A8D8'} strokeOpacity={j === 0 ? 0.5 : 0.8} strokeWidth="1" className={j === highlight ? 'mth-svg-pulse' : undefined} />
      ))}
      {!compact &&
        TIPS.slice(1).map((t, i) =>
          G_CONTOURS.map((g) => <path key={t.id + g} d={arcPath(i + 1, rhoOfG(g))} fill="none" stroke="#86A8D8" strokeOpacity="0.3" strokeWidth="0.8" />),
        )}
      {BRIDGES.map((b) => {
        const on = active ? active(b) : true
        const dashed = b.status !== 'derived'
        return (
          <path
            key={b.id}
            d={bridgePath(b)}
            fill="none"
            stroke={b.id === pulseBridge ? '#FFC98A' : '#86A8D8'}
            strokeWidth={b.kind === 'T' ? (compact ? 3.2 : 2.6) : compact ? 1.8 : 1.4}
            strokeDasharray={dashed ? (compact ? '7 6' : '6 5') : undefined}
            opacity={on ? 0.95 : 0.12}
            className={b.id === pulseBridge ? 'mth-svg-pulse' : undefined}
          />
        )
      })}
      {TIPS.map((t, j) => {
        if (compact && j !== highlight) return null
        const c = tipCenter(j, compact ? 6.9 : 6.75)
        const [x, y] = P(c[0], c[2])
        return (
          <text key={t.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="mth-svg-label" fontSize={compact ? 52 : 15} fill={j === highlight ? '#FFC98A' : j === 0 ? '#86A8D8' : '#ECE6D9'}>
            {compact ? t.short : j === 0 ? '11D SUGRA' : t.name.toUpperCase()}
          </text>
        )
      })}
      {!compact && (
        <>
          {pieces === 1 && (
            <>
              <text x="0" y="-6" textAnchor="middle" className="mth-svg-m">
                M-theory
              </text>
              <text x="0" y="16" textAnchor="middle" className="mth-svg-small">
                ◌ CONJECTURED · FULL FORMULATION UNKNOWN
              </text>
            </>
          )}
          <text x="-370" y="-305" className="mth-svg-small">
            SEPARATE PIECES: {pieces}
          </text>
          <text x="-370" y="300" className="mth-svg-small">
            ≈ ANALOGY · A 2D CARTOON OF A MANY-DIMENSIONAL SPACE OF BACKGROUNDS
          </text>
          <text x="-370" y="318" className="mth-svg-small">
            SOLID = T-DUALITY (DERIVED) · DASHED = S-DUALITY, LIFTS (CONJECTURED)
          </text>
        </>
      )}
    </svg>
  )
}
