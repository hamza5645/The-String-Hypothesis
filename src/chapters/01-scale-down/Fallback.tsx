// Static diagram for browsers without WebGL: the whole zoom on one logarithmic axis, the edge of
// direct measurement, the unexplored gap, and the hypothetical point → string reveal.
const W = 900
const e0 = 1
const e1 = -36
const X0 = 60
const X1 = 840
const x = (e: number) => X0 + ((e0 - e) / (e0 - e1)) * (X1 - X0)

// [log10 m, label, value, label baseline y]
const MARKS: [number, string, string, number][] = [
  [Math.log10(1.7), 'YOU', '1.7 m', 176],
  [Math.log10(15e-6), 'CELL', '15 µm', 160],
  [Math.log10(2e-9), 'DNA', '2 nm', 176],
  [-10, 'ATOM', '10⁻¹⁰ m', 144],
  [Math.log10(0.84e-15), 'PROTON', '0.84 fm', 176],
]

export default function Fallback() {
  const edge0 = x(-18)
  const edge1 = x(-20)
  const lp = x(Math.log10(1.616e-35))
  return (
    <svg viewBox={`0 0 ${W} 400`} role="img" aria-label="A logarithmic zoom from a person, about 1.7 meters, down through cells, DNA, atoms and protons to the edge of direct measurement near 10⁻¹⁹ meters. Below that, about sixteen unexplored powers of ten reach the Planck length. String theory proposes that at far smaller scales a point particle would resolve into a tiny vibrating string; this is untested.">
      <defs>
        <linearGradient id="sd-fb-edge" x1="0" x2="1">
          <stop offset="0" stopColor="#86A8D8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#86A8D8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#86A8D8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sd-fb-glow">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.2" stopColor="#ECE6D9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ECE6D9" stopOpacity="0" />
        </radialGradient>
        <filter id="sd-fb-blur" x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <text x={X0} y={48} fill="#9AA0AE" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="2">
        FIELD OF VIEW · EACH TICK ONE POWER OF TEN
      </text>
      {/* the axis */}
      <line x1={X0} x2={x(-18.5)} y1={200} y2={200} stroke="#9AA0AE" strokeWidth="1" />
      <line x1={x(-18.5)} x2={X1} y1={200} y2={200} stroke="#5C6270" strokeWidth="1" strokeDasharray="3 4" />
      {Array.from({ length: 38 }, (_, i) => e0 - i).map((e) => (
        <line key={e} x1={x(e)} x2={x(e)} y1={200} y2={e % 3 === 0 ? 210 : 205} stroke={e < -18.5 ? '#5C6270' : '#9AA0AE'} strokeWidth="1" strokeDasharray={e < -18.5 ? '2 2' : undefined} />
      ))}
      {[0, -9, -15, -18, -30].map((e) => (
        <text key={e} x={x(e)} y={226} fill="#5C6270" fontFamily="IBM Plex Mono, monospace" fontSize="10" textAnchor="middle">
          {e === 0 ? '1 m' : `10${e.toString().replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])}`}
        </text>
      ))}
      {/* observed landmarks */}
      {MARKS.map(([e, a, b, y]) => (
        <g key={a}>
          <circle cx={x(e)} cy={200} r={3} fill="#ECE6D9" />
          <line x1={x(e)} x2={x(e)} y1={y + 16} y2={196} stroke="#5C6270" strokeWidth="1" opacity={y < 176 ? 0.7 : 0} />
          <text x={x(e)} y={y - 12} fill="#ECE6D9" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="1.5" textAnchor="middle">
            {a}
          </text>
          <text x={x(e)} y={y} fill="#5C6270" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
            {b}
          </text>
        </g>
      ))}
      {/* edge of direct measurement */}
      <rect x={edge0} y={186} width={edge1 - edge0} height={28} fill="url(#sd-fb-edge)" />
      <text x={(edge0 + edge1) / 2} y={250} fill="#86A8D8" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="1.2" textAnchor="middle">
        EDGE OF DIRECT MEASUREMENT
      </text>
      {/* observed vs unexplored brackets */}
      <path d={`M${x(0.23)} 118 V110 H${x(-15.08)} V118`} fill="none" stroke="#ECE6D9" strokeWidth="1" />
      <text x={(x(0.23) + x(-15.08)) / 2} y={100} fill="#ECE6D9" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="1.5" textAnchor="middle">
        ● OBSERVED · YOU → PROTON · ~15 POWERS OF TEN
      </text>
      <path d={`M${x(-18.5)} 118 V110 H${lp} V118`} fill="none" stroke="#86A8D8" strokeWidth="1" strokeDasharray="4 4" />
      <text x={(x(-18.5) + lp) / 2} y={100} fill="#86A8D8" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="1.5" textAnchor="middle">
        UNEXPLORED · ~16 POWERS OF TEN
      </text>
      <line x1={lp} x2={lp} y1={190} y2={214} stroke="#86A8D8" strokeWidth="1" />
      <text x={lp} y={250} fill="#86A8D8" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
        ℓP · 1.6 × 10⁻³⁵ m
      </text>
      {/* the reveal: point → stretched glow → string (hypothetical) */}
      <g transform="translate(0 320)">
        <text x={X0} y={-24} fill="#7D8190" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="1.5">
          ○ SPECULATIVE · ≈ ANALOGY — LOOK CLOSER THAN ℓs AND A POINT WOULD RESOLVE INTO A STRING
        </text>
        <circle cx={200} cy={10} r={16} fill="url(#sd-fb-glow)" />
        <text x={200} y={50} fill="#5C6270" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
          ℓs ≪ resolution
        </text>
        <line x1={355} x2={395} y1={10} y2={10} stroke="#ECE6D9" strokeWidth="9" strokeLinecap="round" opacity="0.35" filter="url(#sd-fb-blur)" />
        <line x1={358} x2={392} y1={10} y2={10} stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <text x={375} y={50} fill="#5C6270" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
          ℓs ≈ resolution
        </text>
        <path d="M520 10 C 560 -4, 600 22, 640 8 S 720 -2, 760 12" fill="none" stroke="#FFC98A" strokeWidth="8" opacity="0.4" filter="url(#sd-fb-blur)" />
        <path d="M520 10 C 560 -4, 600 22, 640 8 S 720 -2, 760 12" fill="none" stroke="#FFF6E8" strokeWidth="1.4" />
        <text x={640} y={50} fill="#FFC98A" fontFamily="IBM Plex Mono, monospace" fontSize="9" textAnchor="middle">
          ℓs ≫ resolution · a string (hypothetical)
        </text>
      </g>
    </svg>
  )
}
