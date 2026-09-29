/*
 * Static diagram for browsers without WebGL: two parallel D-branes (drawn as 2D sheets), open strings with
 * both ends on one brane, a string stretched between the branes with its ruler d and mass m = T·d, the
 * m-vs-d line, a closed loop roaming the bulk, and the 2 × 2 string matrix. A landscape layout sits beside
 * the text column on desktop; a portrait layout fills the top of a phone screen (styles.css picks one).
 */

const FIELD = '#86A8D8'
const INK = '#ECE6D9'
const DIM = '#9AA0AE'
const FAINT = '#5C6270'
const WARM = '#FFC98A'
const CORE = '#FFF6E8'
const MONO = 'IBM Plex Mono, monospace'

/** A brane sheet: parallelogram with a hairline grid (x0 = left of the front edge, w = width, dx/dy = depth skew). */
function Sheet({ x0, y, w, dx, dy }: { x0: number; y: number; w: number; dx: number; dy: number }) {
  const grid: string[] = []
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    grid.push(`M${x0 + dx * t} ${y - dy * t} L${x0 + w + dx * t} ${y - dy * t}`)
    grid.push(`M${x0 + w * t} ${y} L${x0 + w * t + dx} ${y - dy}`)
  }
  return (
    <g>
      <path d={`M${x0} ${y} L${x0 + dx} ${y - dy} L${x0 + w + dx} ${y - dy} L${x0 + w} ${y} Z`} fill="rgba(134,168,216,0.05)" stroke={FIELD} strokeOpacity="0.55" />
      <path d={grid.join(' ')} stroke={FIELD} strokeOpacity="0.16" strokeWidth="0.7" fill="none" />
    </g>
  )
}

/** A glowing string path: soft warm halo + crisp core (only strings are warm). */
function Str({ d, beads = [] as [number, number][] }: { d: string; beads?: [number, number][] }) {
  return (
    <g>
      <path d={d} stroke={WARM} strokeWidth="5" fill="none" opacity="0.3" filter="url(#brn-fb-glow)" />
      <path d={d} stroke={CORE} strokeWidth="1.4" fill="none" />
      {beads.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.8" fill={CORE} />
          <ellipse cx={x} cy={y} rx="11" ry="3.6" fill="none" stroke={FIELD} strokeOpacity="0.6" />
        </g>
      ))}
    </g>
  )
}

function Matrix({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const c = 38 * s
  return (
    <g transform={`translate(${x} ${y})`} fontFamily={MONO} fontSize={11 * s}>
      <text x="0" y={-16 * s} fill={INK} letterSpacing="1.2">
        U(1) × U(1)
      </text>
      {[0, 1].map((r) =>
        [0, 1].map((k) => (
          <g key={`${r}${k}`}>
            <rect x={k * c} y={r * c} width={c} height={c} fill={r === k ? 'rgba(134,168,216,0.3)' : 'none'} stroke={FIELD} strokeOpacity="0.5" />
            <text x={k * c + c / 2} y={r * c + c / 2 + 4 * s} fill={r === k ? INK : DIM} textAnchor="middle">
              {r === k ? '0' : 'm'}
            </text>
          </g>
        )),
      )}
      <text x="0" y={2 * c + 18 * s} fill={FAINT}>
        row: start · column: end
      </text>
    </g>
  )
}

function Plot({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const W = 120 * s
  const H = 70 * s
  return (
    <g transform={`translate(${x} ${y})`} fontFamily={MONO} fontSize={10 * s}>
      <path d={`M0 0 L0 ${H} L${W} ${H}`} stroke={FAINT} fill="none" />
      <path d={`M0 ${H} L${W} ${H * 0.08}`} stroke={INK} strokeWidth="1.2" fill="none" />
      <text x={W} y={H + 14 * s} fill={FAINT} textAnchor="end">
        d
      </text>
      <text x={-6 * s} y={8 * s} fill={FAINT} textAnchor="end">
        m
      </text>
      <text x="0" y={H + 30 * s} fill={DIM}>
        straight: tension is fixed
      </text>
    </g>
  )
}

function Defs() {
  return (
    <defs>
      <filter id="brn-fb-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  )
}

/** Landscape (desktop): branes left-centre, readouts to the right. */
function Wide() {
  return (
    <svg
      className="brn-fb brn-fb--wide"
      viewBox="0 0 820 440"
      role="img"
      aria-label="Two parallel D-branes drawn as sheets. Open strings end on them; a string stretched between them is heavier the farther apart they are: m equals T times d, a straight line. A closed loop floats free in the bulk. The string matrix shows two massless and two massive kinds of string."
    >
      <Defs />
      <Sheet x0={20} y={150} w={400} dx={150} dy={60} />
      <Sheet x0={20} y={350} w={400} dx={150} dy={60} />
      <text x="430" y="168" fill={FIELD} fontFamily={MONO} fontSize="11" letterSpacing="1.5">
        BRANE 2
      </text>
      <text x="430" y="368" fill={FIELD} fontFamily={MONO} fontSize="11" letterSpacing="1.5">
        BRANE 1
      </text>
      {/* stretched string + ruler */}
      <Str d="M300 118 L300 318" beads={[[300, 118], [300, 318]]} />
      <path d="M326 118 L326 318 M320 118 L332 118 M320 318 L332 318" stroke={FIELD} strokeOpacity="0.8" fill="none" />
      <text x="338" y="214" fill={INK} fontFamily={MONO} fontSize="12">
        d
      </text>
      <text x="338" y="232" fill={DIM} fontFamily={MONO} fontSize="10.5">
        m = T·d = d/2π
      </text>
      {/* open strings with both ends on one brane */}
      <Str d="M120 330 Q148 300 176 324" beads={[[120, 330], [176, 324]]} />
      <Str d="M400 120 Q428 90 456 112" beads={[[400, 120], [456, 112]]} />
      <text x="100" y="376" fill={WARM} fontFamily={MONO} fontSize="10" letterSpacing="1">
        OPEN STRING · ENDS ON A BRANE
      </text>
      {/* a closed loop in the bulk */}
      <ellipse cx="150" cy="196" rx="24" ry="17" stroke={WARM} strokeWidth="5" fill="none" opacity="0.3" filter="url(#brn-fb-glow)" />
      <ellipse cx="150" cy="196" rx="24" ry="17" stroke={CORE} strokeWidth="1.4" fill="none" />
      <text x="150" y="236" fill={WARM} fontFamily={MONO} fontSize="10" letterSpacing="1" textAnchor="middle">
        CLOSED STRING · ROAMS THE BULK
      </text>
      <Matrix x={640} y={120} />
      <Plot x={650} y={290} />
      <text x="20" y="428" fill={FAINT} fontFamily={MONO} fontSize="10">
        ≈ a 2D sheet stands for a Dp-brane · not to scale · ◑ derived in string theory, untested
      </text>
    </svg>
  )
}

/** Portrait (phones): branes on top, matrix and plot side by side below. */
function Tall() {
  return (
    <svg className="brn-fb brn-fb--tall" viewBox="0 0 360 400" role="img" aria-label="A sketch, not to scale: two parallel D-branes drawn as sheets, with a string stretched between them: mass m equals T times d. A closed loop roams the bulk. The string matrix has two massless and two massive entries.">
      <Defs />
      <Sheet x0={10} y={92} w={250} dx={90} dy={40} />
      <Sheet x0={10} y={232} w={250} dx={90} dy={40} />
      <text x="270" y="90" fill={FIELD} fontFamily={MONO} fontSize="10" letterSpacing="1.2">
        BRANE 2
      </text>
      <text x="270" y="230" fill={FIELD} fontFamily={MONO} fontSize="10" letterSpacing="1.2">
        BRANE 1
      </text>
      <Str d="M190 72 L190 212" beads={[[190, 72], [190, 212]]} />
      <path d="M210 72 L210 212 M205 72 L215 72 M205 212 L215 212" stroke={FIELD} strokeOpacity="0.8" fill="none" />
      <text x="220" y="146" fill={INK} fontFamily={MONO} fontSize="11">
        d · m = T·d
      </text>
      <Str d="M70 222 Q90 200 110 218" beads={[[70, 222], [110, 218]]} />
      <ellipse cx="88" cy="140" rx="18" ry="13" stroke={WARM} strokeWidth="4" fill="none" opacity="0.3" filter="url(#brn-fb-glow)" />
      <ellipse cx="88" cy="140" rx="18" ry="13" stroke={CORE} strokeWidth="1.3" fill="none" />
      <text x="40" y="172" fill={WARM} fontFamily={MONO} fontSize="9" letterSpacing="0.8">
        CLOSED · IN THE BULK
      </text>
      {/* the drawing's caveat, right under it (still clear of the beat text on short phones) */}
      <text x="10" y="256" fill={DIM} fontFamily={MONO} fontSize="9">
        ≈ 2D sheet = a Dp-brane · not to scale · ◑ derived, untested
      </text>
      <Matrix x={20} y={290} s={0.8} />
      <Plot x={190} y={284} s={1} />
    </svg>
  )
}

export default function Fallback() {
  return (
    <div className="brn-fbwrap">
      <Wide />
      <Tall />
    </div>
  )
}
