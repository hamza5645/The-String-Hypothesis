// Static map of claims for browsers without WebGL: height = distance from experiment.
// Measured ground (●) with its cracks, the derived (◑) and conjectured (◌) tiers strung on the warm
// Thread, the open fog (○), and the verdict: no string-specific claim rests on measured ground.
// Laid out in the right two-thirds so the narrative column stays clear.

const X0 = 350
const X1 = 880
const X = (u: number) => X0 + u * (X1 - X0)

const TIERS = [
  { y: 400, label: '● MEASURED', color: '#ECE6D9' },
  { y: 300, label: '◑ DERIVED', color: '#86A8D8' },
  { y: 205, label: '◌ CONJECTURED', color: '#A99BD6' },
  { y: 110, label: '○ SPECULATIVE', color: '#9AA0AE' },
]
const GROUND = ['QUANTUM MECH.', 'RELATIVITY', 'STANDARD MODEL', 'HIGGS · 2012', 'GRAV. WAVES', 'NO STRINGS SEEN'].map((t, i) => ({ t, x: X(0.04 + i * 0.184), y: i % 2 ? 376 : 389 }))
const DERIVED = [
  { u: 0.08, y: 306, t: '10 DIMENSIONS' },
  { u: 0.3, y: 296, t: 'ANOMALIES CANCEL' },
  { u: 0.52, y: 290, t: 'GRAVITON' },
  { u: 0.72, y: 300, t: 'T-DUALITY' },
  { u: 0.92, y: 292, t: 'BLACK-HOLE COUNT' },
].map((d) => ({ ...d, x: X(d.u) }))
const CONJ = [
  { u: 0.78, y: 208, t: 'M-THEORY' },
  { u: 0.5, y: 198, t: 'S-DUALITY' },
  { u: 0.22, y: 210, t: 'AdS/CFT' },
].map((d) => ({ ...d, x: X(d.u) }))
const SPEC = [
  { u: 0.1, y: 118, t: 'OUR UNIVERSE?' },
  { u: 0.36, y: 100, t: 'LANDSCAPE ~10⁵⁰⁰' },
  { u: 0.6, y: 114, t: 'OTHER ROUTES' },
  { u: 0.84, y: 98, t: 'HOW TO TEST IT?' },
].map((d) => ({ ...d, x: X(d.u) }))

/** Centripetal-ish Catmull–Rom through points, as a smooth cubic Bézier path. */
function smoothPath(p: [number, number][]) {
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)]
    const b = p[i]
    const c = p[i + 1]
    const e = p[Math.min(p.length - 1, i + 2)]
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6]
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${c[0].toFixed(1)} ${c[1].toFixed(1)}`
  }
  return d
}
const T0: [number, number] = [X(0.16), 345]
const THREAD = smoothPath([T0, ...DERIVED.map((d) => [d.x, d.y] as [number, number]), [X(0.98), 250], ...CONJ.map((c) => [c.x, c.y] as [number, number]), [X(0.12), 170], [X(0.3), 140]])

export default function Fallback() {
  return (
    <svg
      viewBox="0 0 900 480"
      role="img"
      aria-label="A map of claims sorted by distance from experiment. Measured physics forms the ground, with cracks such as dark matter. Above it, string theory's derived and conjectured results are strung on a warm thread that never touches the ground. Open questions float in fog above. No string-specific claim rests on measured ground."
    >
      <defs>
        <filter id="kn-fb-blur" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="kn-fb-fog" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7D8190" stopOpacity="0" />
          <stop offset="0.5" stopColor="#7D8190" stopOpacity="0.12" />
          <stop offset="1" stopColor="#7D8190" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fontFamily="IBM Plex Mono, monospace" letterSpacing="0.8">
        {/* axis */}
        <line x1={X0 - 24} y1="420" x2={X0 - 24} y2="70" stroke="#9AA0AE" strokeOpacity="0.5" />
        <path d={`M${X0 - 29} 80 L${X0 - 24} 68 L${X0 - 19} 80`} fill="none" stroke="#9AA0AE" strokeOpacity="0.6" />
        <text x={X0 - 24} y="56" fill="#5C6270" fontSize="9" textAnchor="middle">
          DISTANCE FROM EXPERIMENT ↑
        </text>
        {/* fog */}
        <rect x={X0 - 10} y="70" width={X1 - X0 + 20} height="80" fill="url(#kn-fb-fog)" />
        {/* tiers */}
        {TIERS.map((t, i) => (
          <g key={t.label}>
            <line x1={X0 - 10} x2={X1 + 10} y1={t.y + (i === 0 ? 14 : 0)} y2={t.y + (i === 0 ? 14 : 0)} stroke={i === 0 ? '#86A8D8' : '#9AA0AE'} strokeOpacity={i === 0 ? 0.35 : 0.2} strokeDasharray={i === 2 ? '5 4' : i === 3 ? '2 4' : undefined} />
            <text x={X0 - 32} y={t.y + (i === 0 ? 17 : 3)} fill={t.color} fillOpacity="0.8" fontSize="8.5" textAnchor="end">
              {t.label}
            </text>
          </g>
        ))}
        {/* cracks */}
        <path d={`M${X0} 412 l 16 4 l 9 -3 l 13 6 l 11 -2`} fill="none" stroke="#86A8D8" strokeOpacity="0.8" />
        <path d={`M${X1} 412 l -13 5 l -9 -3 l -15 6`} fill="none" stroke="#86A8D8" strokeOpacity="0.8" />
        <text x={X0} y="438" fill="#86A8D8" fontSize="8">
          CRACKS: DARK MATTER · DARK ENERGY · NEUTRINO MASS · NO TESTED QUANTUM GRAVITY
        </text>
        {/* anchors: built on tested principles */}
        <line x1={GROUND[0].x} y1={GROUND[0].y} x2={T0[0]} y2={T0[1]} stroke="#86A8D8" strokeOpacity="0.5" />
        <line x1={GROUND[1].x} y1={GROUND[1].y} x2={T0[0]} y2={T0[1]} stroke="#86A8D8" strokeOpacity="0.5" />
        {/* the Thread: warm, strung through theory, never on the ground; frays into the fog */}
        <path d={THREAD} fill="none" stroke="#FFC98A" strokeWidth="6" opacity="0.4" filter="url(#kn-fb-blur)" />
        <path d={THREAD} fill="none" stroke="#FFF1DC" strokeWidth="1.3" />
        <path d={`M${X(0.3)} 140 q 14 -6 26 -20 M${X(0.3)} 140 q 18 2 30 -8`} fill="none" stroke="#FFC98A" strokeOpacity="0.45" />
        {GROUND.map((g) => (
          <g key={g.t}>
            <circle cx={g.x} cy={400} r="4" fill="#ECE6D9" />
            <text x={g.x} y={g.y} fill="#ECE6D9" fontSize="8" textAnchor="middle">
              {g.t}
            </text>
          </g>
        ))}
        {DERIVED.map((d) => (
          <g key={d.t}>
            <circle cx={d.x} cy={d.y} r="5" fill="none" stroke="#86A8D8" />
            <path d={`M${d.x} ${d.y - 5} A5 5 0 0 1 ${d.x} ${d.y + 5} Z`} fill="#86A8D8" />
            <text x={d.x} y={d.u < 0.1 ? d.y - 11 : d.y + 18} fill="#86A8D8" fontSize="8" textAnchor="middle">
              {d.t}
            </text>
          </g>
        ))}
        {CONJ.map((c) => (
          <g key={c.t}>
            <circle cx={c.x} cy={c.y} r="5" fill="none" stroke="#A99BD6" strokeDasharray="2 1.6" />
            <text x={c.x} y={c.y - 11} fill="#A99BD6" fontSize="8" textAnchor="middle">
              {c.t}
            </text>
          </g>
        ))}
        {SPEC.map((s) => (
          <g key={s.t}>
            <circle cx={s.x} cy={s.y} r="5" fill="none" stroke="#7D8190" />
            <text x={s.x} y={s.y - 11} fill="#9AA0AE" fontSize="8" textAnchor="middle">
              {s.t}
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y="466" fill="#9AA0AE" fontSize="8.5" textAnchor="middle">
          ≈ HEIGHT = DISTANCE FROM EXPERIMENT · NO STRING-SPECIFIC CLAIM RESTS ON MEASURED GROUND (2026)
        </text>
      </g>
    </svg>
  )
}
