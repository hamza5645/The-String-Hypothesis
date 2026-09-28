// Static key diagram for browsers without WebGL: a ring of free particles at + and ×, the pattern tile εᵢⱼ,
// and the closed loop sharing the + pattern (cartoon), as in Beat 5 and the Spin Lab.
const TAU = Math.PI * 2

function ringPts(cx: number, cy: number, R: number, A: number, psi: number, n: number) {
  const c = A * Math.cos(2 * psi)
  const s = A * Math.sin(2 * psi)
  const out: [number, number][] = []
  for (let k = 0; k < n; k++) {
    const th = (k / n) * TAU
    const x = R * Math.cos(th)
    const y = R * Math.sin(th)
    // δx = ½(h₊x + h×y), δy = ½(h×x − h₊y); SVG y points down
    out.push([cx + x + 0.5 * (c * x + s * y), cy - (y + 0.5 * (s * x - c * y))])
  }
  return out
}

export default function Fallback() {
  const A = 0.34
  const ringP = ringPts(160, 150, 70, A, 0, 24)
  const ringX = ringPts(160, 330, 50, A, Math.PI / 4, 24)
  const loop = ringPts(740, 175, 76, A, 0, 120)
  const loopD = loop.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + 'Z'
  const mono = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.1em' }
  return (
    <svg
      viewBox="0 0 900 470"
      role="img"
      aria-label="A ring of free particles stretched in a plus pattern and, smaller, the same pattern turned 45 degrees into a cross; the pattern matrix epsilon with entries 1, 0, 0, minus 1; and a closed string loop deformed with the same plus pattern, a cartoon. Gravitational waves are observed; gravitons are not; the string graviton is derived in theory."
    >
      <defs>
        <filter id="gr-fb-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {/* ring at + */}
      <text x="160" y="52" textAnchor="middle" fill="#9AA0AE" style={mono}>
        RING OF FREE PARTICLES · +
      </text>
      <circle cx="160" cy="150" r="70" fill="none" stroke="#86A8D8" strokeOpacity="0.35" strokeWidth="1" />
      {ringP.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill="#ECE6D9" />
      ))}
      {/* ring at × */}
      <circle cx="160" cy="330" r="50" fill="none" stroke="#86A8D8" strokeOpacity="0.35" strokeWidth="1" />
      {ringX.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill="#ECE6D9" />
      ))}
      <text x="160" y="408" textAnchor="middle" fill="#5C6270" style={mono}>
        ×: SAME PATTERN, TURNED 45°
      </text>

      {/* tile */}
      <text x="450" y="118" textAnchor="middle" fill="#86A8D8" style={mono}>
        PATTERN εᵢⱼ
      </text>
      <path d="M404 134 h-8 v84 h8 M496 134 h8 v84 h-8" fill="none" stroke="#86A8D8" strokeWidth="1" />
      {[
        ['1.00', 425, 166],
        ['0.00', 475, 166],
        ['0.00', 425, 202],
        ['−1.00', 475, 202],
      ].map(([t, x, y]) => (
        <text key={`${x}-${y}`} x={x as number} y={y as number} textAnchor="middle" fill="#86A8D8" style={{ ...mono, fontSize: 14, letterSpacing: 0 }}>
          {t}
        </text>
      ))}
      <text x="450" y="250" textAnchor="middle" fill="#9AA0AE" style={mono}>
        SAME NUMBERS DRIVE BOTH SIDES
      </text>
      <path d="M392 176 C 320 176, 285 160, 240 154" fill="none" stroke="#86A8D8" strokeOpacity="0.5" />
      <path d="M508 176 C 580 176, 615 176, 654 176" fill="none" stroke="#86A8D8" strokeOpacity="0.5" />

      {/* loop, deformed with the same map (cartoon) */}
      <text x="740" y="52" textAnchor="middle" fill="#9AA0AE" style={mono}>
        CLOSED STRING · SPIN 2 · MASS 0
      </text>
      <path d={loopD} fill="none" stroke="#FFC98A" strokeWidth="9" opacity="0.45" filter="url(#gr-fb-blur)" />
      <path d={loopD} fill="none" stroke="#FFF6E8" strokeWidth="1.6" />
      <text x="740" y="292" textAnchor="middle" fill="#C9B48F" style={mono}>
        ≈ CARTOON: SHARES ITS SYMMETRY,
      </text>
      <text x="740" y="310" textAnchor="middle" fill="#C9B48F" style={mono}>
        NOT ITS SHAPE
      </text>
      <text x="450" y="452" textAnchor="middle" fill="#5C6270" style={mono}>
        GRAVITATIONAL WAVES: OBSERVED ● · GRAVITONS: NOT OBSERVED ○ · STRING GRAVITON: DERIVED ◑
      </text>
    </svg>
  )
}
