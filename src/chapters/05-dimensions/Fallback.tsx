// Static figure for browsers without WebGL: the chapter's argument in three parts — a cable that
// looks like a line from afar and a tube up close; a wave that must fit whole wavelengths around the
// hidden circle; and the ladder of masses, spaced by ħc/R, climbing past the LHC's collision energy.
// Everything sits in the right-hand ~60% of the viewBox so the narrative column (left) stays clear.
const F = '#86A8D8'
const I = '#ECE6D9'
const I2 = '#9AA0AE'
const D = '#5C6270'
const M = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.06em' } as const

function wave(cx: number, cy: number, R: number, k: number, a: number) {
  let d = ''
  for (let i = 0; i <= 240; i++) {
    const th = (i / 240) * Math.PI * 2
    const r = R * (1 + a * Math.cos(k * th))
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(th)).toFixed(1)} ${(cy - r * Math.sin(th)).toFixed(1)}`
  }
  return d + 'Z'
}

export default function Fallback() {
  // the tube: rings + the ant's helix (front half bright, back half dim)
  const rings = Array.from({ length: 11 }, (_, i) => 632 + i * 22)
  let helixFront = ''
  let helixBack = ''
  let prev: boolean | null = null
  for (let i = 0; i <= 200; i++) {
    const x = 628 + i * 1.2
    const th = i * 0.13
    const pt = `${x.toFixed(1)} ${(92 + 22 * Math.cos(th)).toFixed(1)} `
    const front = Math.sin(th) > 0
    if (front) helixFront += (prev === true ? 'L' : 'M') + pt
    else helixBack += (prev === false ? 'L' : 'M') + pt
    prev = front
  }
  const s = 30 // ladder spacing
  const y0 = 390 // rung n = 0
  const lhcY = y0 - 3.5 * s
  return (
    <svg
      viewBox="0 0 900 470"
      role="img"
      aria-label="Hidden dimensions. From far away a cable looks like a line; up close it is a tube, with a second direction, around. A wave around a hidden circle must fit a whole number of wavelengths. Each allowed wave weighs as a heavier copy of the particle: a ladder of masses spaced by h-bar c over R. A small circle pushes every rung above the LHC's collision energy, out of reach."
    >
      {/* 1 · the cable: a line from afar, a tube up close */}
      <text x="330" y="44" fill={D} style={M}>
        FROM FAR · 1 DIMENSION
      </text>
      <line x1="330" y1="92" x2="580" y2="92" stroke={F} strokeWidth="1.2" />
      <circle cx="455" cy="92" r="2.4" fill={I} />
      <text x="628" y="44" fill={D} style={M}>
        UP CLOSE · 2 DIMENSIONS
      </text>
      <line x1="628" y1="70" x2="870" y2="70" stroke={F} strokeWidth="1" opacity="0.8" />
      <line x1="628" y1="114" x2="870" y2="114" stroke={F} strokeWidth="1" opacity="0.8" />
      {rings.map((x) => (
        <ellipse key={x} cx={x} cy="92" rx="6" ry="22" fill="none" stroke={F} strokeWidth="0.8" opacity="0.45" />
      ))}
      <path d={helixBack} fill="none" stroke={I} strokeWidth="1" opacity="0.3" />
      <path d={helixFront} fill="none" stroke={I} strokeWidth="1.3" opacity="0.9" />
      <text x="628" y="140" fill={F} style={M}>
        AROUND: FINITE · 2πR
      </text>

      {/* 2 · the wave must fit */}
      <circle cx="440" cy="300" r="78" fill="none" stroke={F} strokeWidth="1.2" opacity="0.7" />
      <path d={wave(440, 300, 78, 3, 0.1)} fill="none" stroke={I} strokeWidth="1.5" />
      <text x="440" y="408" fill={I} textAnchor="middle" style={M}>
        k = 3 · FITS: 3 WHOLE WAVELENGTHS
      </text>
      <text x="440" y="426" fill={D} textAnchor="middle" style={M}>
        NON-INTEGER k CANCELS ITSELF OUT
      </text>

      {/* 3 · the ladder: E_n = n ħc/R */}
      <line x1="640" y1={y0 + 8} x2="640" y2={y0 - 6.6 * s} stroke={F} strokeWidth="1" opacity="0.6" />
      <text x="636" y={y0 - 6.6 * s - 10} fill={D} style={M}>
        MASS WE WOULD MEASURE
      </text>
      {Array.from({ length: 7 }, (_, n) => (
        <g key={n}>
          <line x1="640" y1={y0 - n * s} x2="662" y2={y0 - n * s} stroke={n === 0 ? I : F} strokeWidth={n === 0 ? 2 : 1.2} />
          <text x="670" y={y0 - n * s + 4} fill={n === 0 ? I : I2} style={M}>
            {n === 0 ? 'n = 0 · the ordinary particle' : `n = ${n} · E = ${n === 1 ? '' : n}ħc/R`}
          </text>
        </g>
      ))}
      <line x1="548" y1={lhcY} x2="880" y2={lhcY} stroke={D} strokeWidth="1" strokeDasharray="5 4" />
      <text x="630" y={lhcY - 6} fill={I2} textAnchor="end" style={M}>
        LHC · 13.6 TeV
      </text>
      <text x="640" y="426" fill={D} style={M}>
        SMALLER R → WIDER SPACING (∝ 1/R)
      </text>

      <text x="330" y="446" fill={D} style={{ ...M, fontSize: 10 }}>
        ~ ANALOGY · NOT TO SCALE · SUPERSTRINGS IN FLAT SPACE NEED 9 + 1 DIMENSIONS
      </text>
      <text x="330" y="460" fill={D} style={{ ...M, fontSize: 10 }}>
        NONE OF THE EXTRA ONES HAS BEEN OBSERVED
      </text>
    </svg>
  )
}
