import { lowestFamilies, stack } from './model'

/*
 * Static fallback (no WebGL): the chapter's key diagram. WORLD A (a large circle, R = 2) and
 * WORLD B (a small one, α′/R = 0.5) share one spectrum: the eight lightest string states,
 * read as momentum (blue) in one world and winding (amber) in the other, at identical heights.
 * Rung heights are exact (model.ts); the circles are drawn ∝ √R (cartoon).
 */

const FIELD = '#86A8D8'
const AMBER = '#FFC98A'
const CORE = '#FFF6E8'
const GREY = '#9AA0AE'
const INK = '#ECE6D9'
const DIM = '#5C6270'
const MONO = 'IBM Plex Mono, monospace'

/** A hidden circle drawn as a cylinder seen side-on (axis horizontal), with what lives on it. */
function Cylinder({ cx, cy, r, len, kind }: { cx: number; cy: number; r: number; len: number; kind: 'wave' | 'coil' }) {
  const x0 = cx - len / 2
  const x1 = cx + len / 2
  const ry = r * 0.36
  const rings = [0.2, 0.4, 0.6, 0.8]
  // the honest part: one whole wavelength around the circle, r(θ) = ρ[1 + 0.06·cos θ]
  const wave = Array.from({ length: 73 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2
    const rr = r * (1 + 0.08 * Math.cos(a - 0.6))
    return `${i ? 'L' : 'M'}${(x0 + len * 0.26 + ry * Math.sin(a)).toFixed(1)} ${(cy - rr * Math.cos(a)).toFixed(1)}`
  }).join('')
  return (
    <g>
      <path d={`M${x0} ${cy - r} H${x1} M${x0} ${cy + r} H${x1}`} stroke={FIELD} strokeWidth="1" opacity="0.75" />
      <ellipse cx={x0} cy={cy} rx={ry} ry={r} fill="none" stroke={FIELD} strokeWidth="1" opacity="0.75" />
      <ellipse cx={x1} cy={cy} rx={ry} ry={r} fill="none" stroke={FIELD} strokeWidth="1" opacity="0.4" />
      {rings.map((f) => (
        <ellipse key={f} cx={x0 + len * f} cy={cy} rx={ry} ry={r} fill="none" stroke={FIELD} strokeWidth="0.6" opacity="0.18" />
      ))}
      {kind === 'wave' ? (
        <>
          <path d={wave} fill="none" stroke={FIELD} strokeWidth="1.8" />
          <circle cx={cx + len * 0.14} cy={cy - r * 0.5} r="10" fill="none" stroke={CORE} strokeWidth="1.5" />
        </>
      ) : (
        <>
          <ellipse cx={cx + len * 0.06} cy={cy} rx={ry * 1.08} ry={r * 1.05} fill="none" stroke={AMBER} strokeWidth="6" opacity="0.22" />
          <ellipse cx={cx + len * 0.06} cy={cy} rx={ry * 1.08} ry={r * 1.05} fill="none" stroke={CORE} strokeWidth="1.5" />
        </>
      )}
    </g>
  )
}

export default function Fallback() {
  const fams = lowestFamilies(2, 8)
  const seam = 410
  const base = 466
  const k = 76 // px per unit of mass (string units)
  const half = 100
  // heights that coincide on screen (within ~2 rung widths) share one rung, split into dashes, drawn at their mean
  const rows: { m: number; m0: number; items: typeof fams }[] = []
  for (const f of fams) {
    const m = Math.sqrt(f.y)
    const last = rows[rows.length - 1]
    if (last && Math.abs(m - last.m0) * k < 7) {
      last.items.push(f)
      last.m = last.items.reduce((acc, it) => acc + Math.sqrt(it.y), 0) / last.items.length
    } else rows.push({ m, m0: m, items: [f] })
  }
  return (
    <svg
      viewBox="0 0 820 560"
      role="img"
      aria-label="Two worlds, one spectrum: a string on a large circle of radius R and on a small circle of radius alpha-prime over R has exactly the same list of masses, with momentum and winding swapped."
    >
      <line x1={seam} x2={seam} y1="20" y2="480" stroke={FIELD} strokeOpacity="0.35" />
      <Cylinder cx={180} cy={150} r={76} len={250} kind="wave" />
      <Cylinder cx={640} cy={150} r={38} len={250} kind="coil" />
      <text x={seam} y="162" fill={INK} fontFamily="Hanken Grotesk, sans-serif" fontWeight="300" fontSize="38" textAnchor="middle">
        =
      </text>
      <text x="180" y="258" fill={DIM} fontFamily={MONO} fontSize="11" letterSpacing="1.6" textAnchor="middle">
        WORLD A · RADIUS R = 2 ℓs
      </text>
      <text x="180" y="276" fill={FIELD} fontFamily={MONO} fontSize="10" letterSpacing="1.2" textAnchor="middle">
        n = 1 WHOLE WAVELENGTH
      </text>
      <text x="640" y="258" fill={DIM} fontFamily={MONO} fontSize="11" letterSpacing="1.6" textAnchor="middle">
        WORLD B · RADIUS α′/R = 0.5 ℓs
      </text>
      <text x="640" y="276" fill={AMBER} fontFamily={MONO} fontSize="10" letterSpacing="1.2" textAnchor="middle">
        w = 1 WRAP
      </text>

      <line x1={seam - half - 14} x2={seam + half + 14} y1={base} y2={base} stroke={DIM} />
      <text x={seam - half - 22} y={base + 4} fill={DIM} fontFamily={MONO} fontSize="10" textAnchor="end">
        M = 0
      </text>
      <text x={seam - half - 22} y={base - Math.sqrt(fams[0].y) * k + 4} fill={FIELD} fontFamily={MONO} fontSize="10" textAnchor="end">
        A: n 1 · w 0
      </text>
      <text x={seam + half + 22} y={base - Math.sqrt(fams[0].y) * k + 4} fill={AMBER} fontFamily={MONO} fontSize="10">
        B: n 0 · w 1
      </text>
      {rows.map((row) => {
        const y = base - row.m * k
        const n = row.items.length
        const gap = 5
        const dw = (half - gap * (n - 1)) / n
        return row.items.map((f, m) => {
          const s = stack(f.mom, f.wind, f.vib)
          const segs: [number, string, string][] = [
            [s.vib, GREY, GREY],
            [s.lo, s.loIsMom ? FIELD : AMBER, s.loIsMom ? AMBER : FIELD],
            [s.hi, s.loIsMom ? AMBER : FIELD, s.loIsMom ? FIELD : AMBER],
          ]
          let xo = m * (dw + gap)
          return (
            <g key={`${f.a}-${f.b}-${f.S}`}>
              {segs.map(([v, cA, cB], j) => {
                const w = (dw * v) / f.y
                const x = xo
                xo += w
                if (w <= 0) return null
                return (
                  <g key={j}>
                    <rect x={seam - x - w} y={y - 1.75} width={w} height={3.5} fill={cA} opacity="0.85" />
                    <rect x={seam + x} y={y - 1.75} width={w} height={3.5} fill={cB} opacity="0.85" />
                  </g>
                )
              })}
            </g>
          )
        })
      })}
      <text x={seam} y={base + 34} fill={INK} fontFamily={MONO} fontSize="11.5" letterSpacing="1.6" textAnchor="middle">
        SAME 8 LIGHTEST MASSES · MOMENTUM ⟷ WINDING
      </text>
      <text x={seam} y={base + 60} fontFamily={MONO} fontSize="11" letterSpacing="0.8" textAnchor="middle">
        <tspan fill={INK}>M² = </tspan>
        <tspan fill={FIELD}>(n/R)²</tspan>
        <tspan fill={DIM}> + </tspan>
        <tspan fill={AMBER}>(wR/α′)²</tspan>
        <tspan fill={DIM}> + </tspan>
        <tspan fill={GREY}>(2/α′)(N+Ñ)</tspan>
        <tspan fill={DIM}> · R ⟷ α′/R, n ⟷ w</tspan>
      </text>
      <text x={seam} y={base + 86} fill={DIM} fontFamily={MONO} fontSize="10" letterSpacing="1" textAnchor="middle">
        ◑ DERIVED IN STRING THEORY · UNTESTED · ~ CIRCLES DRAWN ∝ √R, NOT TO SCALE
      </text>
    </svg>
  )
}
