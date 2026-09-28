// No-WebGL figure: free-ended harmonics (whole packets) → seen from far away, a point → the mass ladder
// M² = N/α′, with every measured particle on the massless bottom rung. The left third stays empty for
// the beat text that scrolls over it.
const F = '#FFC98A'
const CORE = '#FFF6E8'
const FIELD = '#86A8D8'
const INK = '#ECE6D9'
const INK2 = '#9AA0AE'
const INK3 = '#5C6270'
const MONO = "'IBM Plex Mono', Menlo, monospace"

function mode(n: number, x0: number, y0: number, len: number, amp: number, sign = 1) {
  let d = ''
  for (let i = 0; i <= 64; i++) {
    const s = i / 64
    d += `${i === 0 ? 'M' : 'L'}${(x0 + s * len).toFixed(1)} ${(y0 - sign * amp * Math.cos(n * Math.PI * s)).toFixed(1)} `
  }
  return d
}

export default function Fallback() {
  const X0 = 318
  const LEN = 190
  const rows = [
    { n: 1, y: 128, k: 'k₁ = 1' },
    { n: 2, y: 208, k: 'k₂ = 1' },
    { n: 3, y: 288, k: 'k₃ = 1' },
  ]
  const rung = (N: number) => 350 - N * 52
  return (
    <svg
      viewBox="0 0 900 430"
      role="img"
      aria-label="Free-ended string harmonics each hold whole packets of vibration. Seen from far away, each state looks like a point with a mass and a spin. The states sit on a ladder where mass squared rises in equal steps, and every measured particle would sit on the massless bottom rung."
    >
      <defs>
        <filter id="vib-fb-blur" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <radialGradient id="vib-fb-pt">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.25" stopColor={INK} stopOpacity="0.7" />
          <stop offset="1" stopColor={INK} stopOpacity="0" />
        </radialGradient>
      </defs>
      <text x={X0} y="66" fill={INK2} fontFamily={MONO} fontSize="10" letterSpacing="1.4">
        HARMONICS · FREE ENDS · WHOLE PACKETS
      </text>
      {rows.map((r) => (
        <g key={r.n}>
          <path d={mode(r.n, X0, r.y, LEN, 20, -1)} fill="none" stroke={F} strokeOpacity="0.2" strokeWidth="1" />
          <path d={mode(r.n, X0, r.y, LEN, 20)} fill="none" stroke={F} strokeWidth="6" opacity="0.35" filter="url(#vib-fb-blur)" />
          <path d={mode(r.n, X0, r.y, LEN, 20)} fill="none" stroke={CORE} strokeWidth="1.3" />
          {Array.from({ length: r.n }, (_, j) => {
            const x = X0 + ((j + 0.5) / r.n) * LEN
            return <line key={j} x1={x} x2={x} y1={r.y - 8} y2={r.y + 8} stroke={FIELD} strokeWidth="1" />
          })}
          <text x={X0} y={r.y + 38} fill={INK3} fontFamily={MONO} fontSize="9" letterSpacing="1">
            {`n = ${r.n} · ${r.k} → N = ${r.n}`}
          </text>
        </g>
      ))}
      <g>
        <line x1="528" x2="592" y1="208" y2="208" stroke={FIELD} strokeWidth="1" strokeDasharray="3 4" />
        <path d="M586 203 L594 208 L586 213" fill="none" stroke={FIELD} strokeWidth="1" />
        <text x="560" y="194" textAnchor="middle" fill={INK2} fontFamily={MONO} fontSize="9" letterSpacing="1">
          STEP BACK
        </text>
        <circle cx="620" cy="208" r="15" fill="url(#vib-fb-pt)" />
        <text x="620" y="242" textAnchor="middle" fill={INK3} fontFamily={MONO} fontSize="8.5" letterSpacing="0.8">
          A POINT WITH
        </text>
        <text x="620" y="255" textAnchor="middle" fill={INK3} fontFamily={MONO} fontSize="8.5" letterSpacing="0.8">
          MASS · SPIN
        </text>
      </g>
      <text x="676" y="66" fill={INK2} fontFamily={MONO} fontSize="10" letterSpacing="1.4">
        LADDER · M² = N / α′
      </text>
      {[0, 1, 2, 3, 4].map((N) => (
        <g key={N}>
          <text x="684" y={rung(N) + 3.5} textAnchor="end" fill={INK3} fontFamily={MONO} fontSize="9">
            {N}
          </text>
          <line x1="692" x2="818" y1={rung(N)} y2={rung(N)} stroke={N === 0 ? INK : FIELD} strokeOpacity={N === 0 ? 0.85 : 0.6} strokeWidth="1" />
          <text x="826" y={rung(N) + 3.5} fill={INK2} fontFamily={MONO} fontSize="9">
            {N === 0 ? '0' : `${Math.sqrt(N).toFixed(2)} Mₛ`}
          </text>
        </g>
      ))}
      {[1, 2, 3].map((N) => (
        <circle key={N} cx={706 + N * 20} cy={rung(N)} r="3" fill={F} />
      ))}
      {Array.from({ length: 17 }, (_, i) => (
        <circle key={i} cx={699 + i * 7.1} cy={rung(0)} r="3.1" fill="#05070B" stroke={INK} strokeOpacity="0.75" strokeWidth="0.8" />
      ))}
      <text x="692" y={rung(0) + 22} fill={INK2} fontFamily={MONO} fontSize="8.5" letterSpacing="0.8">
        RUNG 0 · MASSLESS · EVERY
      </text>
      <text x="692" y={rung(0) + 35} fill={INK2} fontFamily={MONO} fontSize="8.5" letterSpacing="0.8">
        MEASURED PARTICLE WOULD SIT HERE
      </text>
      <text x="692" y={rung(0) + 54} fill={INK3} fontFamily={MONO} fontSize="8.5" letterSpacing="0.8">
        ◑ DERIVED · ≈ NOT TO SCALE
      </text>
    </svg>
  )
}
