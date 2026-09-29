// Static figure for browsers without WebGL: the Ruler (62 powers of ten, the unexplored quarter),
// the energy axis beneath it (E ≈ ħc/d), the Planck-energy ring against the galaxy, and the
// resolution floor. All positions are computed from the same Model as the live stage.
import { DX_MIN, E_LHC, E_STAR, EP, HBARC, K_BH, LOG_HBARC, S_MAX, S_MIN } from './model'

const X0 = 60
const X1 = 830
const S_END = -36
const x = (s: number) => X0 + ((S_MAX - s) / (S_MAX - S_END)) * (X1 - X0)
const xE = (logE: number) => x(LOG_HBARC - logE)

const LMS: [number, string, number][] = [
  [S_MAX, 'Universe', 0],
  [Math.log10(8.3e20), 'Milky Way', 1],
  [Math.log10(4e16), 'Nearest star', 2],
  [Math.log10(1.27e7), 'Earth', 1],
  [Math.log10(1.7), 'You', 0],
  [-10, 'Atom', 1],
  [Math.log10(1.7e-15), 'Proton', 0],
  [-19, 'Edge of measurement', 2],
  [S_MIN, 'Planck length', 0],
]

// the floor chart (log-log): E 10³…10²³ GeV, Δx 10⁻²⁵…10⁻³⁶ m
const CX0 = 560
const CX1 = 850
const CY0 = 330
const CY1 = 490
const cx = (le: number) => CX0 + ((le - 11) / 12) * (CX1 - CX0)
const cy = (ld: number) => CY0 + ((-25 - ld) / 11.3) * (CY1 - CY0)
function curve(f: (E: number) => number) {
  let d = ''
  let pen = false
  for (let i = 0; i <= 120; i++) {
    const le = 11 + (12 * i) / 120
    const ld = Math.log10(f(Math.pow(10, le)))
    if (ld < -36.3 || ld > -25) {
      pen = false
      continue
    }
    d += `${pen ? 'L' : 'M'}${cx(le).toFixed(1)},${cy(ld).toFixed(1)}`
    pen = true
  }
  return d
}

export default function Fallback() {
  const mono = { fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em' }
  const RY = 160
  const EY = 236
  return (
    <svg
      className="sp-fb"
      viewBox="0 0 900 540"
      role="img"
      aria-label="A logarithmic ruler from the observable universe (8.8 × 10^26 m) to the Planck length (1.6 × 10^-35 m): about 62 powers of ten, of which the last sixteen are unexplored. Beneath it, the energy needed to see each size, E ≈ ħc/d: the LHC reached 13.6 TeV, the Planck length needs about 10^19 GeV. A Planck-energy ring with LHC magnets would be about 2,500 light-years around, still a small circle on the Milky Way's map. Beyond the Planck energy, collisions are expected to make black holes, so resolution bottoms out at a few Planck lengths (a heuristic)."
    >
      <text x={X0} y={34} fill="#9AA0AE" fontSize={13.5} style={mono}>
        OUT OF REACH · 62 POWERS OF TEN · NOT A STRING IN SIGHT
      </text>
      {/* the Ruler: probed (solid), the edge band, unprobed (dashed), and a stub past ℓP */}
      <line x1={x(S_MAX)} x2={x(-18)} y1={RY} y2={RY} stroke="#ECE6D9" strokeWidth={3} />
      <line x1={x(-18)} x2={x(-20)} y1={RY} y2={RY} stroke="#9AA0AE" strokeWidth={3} />
      <line x1={x(-20)} x2={x(S_MIN)} y1={RY} y2={RY} stroke="#86A8D8" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="5 4" />
      <line x1={x(S_MIN)} x2={x(S_END)} y1={RY} y2={RY} stroke="#86A8D8" strokeOpacity={0.35} strokeDasharray="1 3" />
      {Array.from({ length: 63 }, (_, i) => 26 - i).map((s) => (
        <line key={s} x1={x(s)} x2={x(s)} y1={RY - (s % 5 === 0 ? 5 : 2)} y2={RY + (s % 5 === 0 ? 5 : 2)} stroke="#5C6270" />
      ))}
      {LMS.map(([s, name, row]) => (
        <g key={name}>
          <line x1={x(s)} x2={x(s)} y1={RY - 8} y2={RY - 22 - row * 24} stroke="#5C6270" />
          <text x={x(s)} y={RY - 27 - row * 24} textAnchor={s === S_MAX ? 'start' : s === S_MIN ? 'end' : 'middle'} dx={s === S_MAX ? -6 : s === S_MIN ? 6 : 0} fill="#ECE6D9" fontSize={13} style={mono}>
            {name.toUpperCase()}
          </text>
        </g>
      ))}
      <circle cx={x(-34)} cy={RY} r={4} fill="#ECE6D9" />
      <path d={`M${x(S_MAX)},${RY + 16}v5H${x(-19) - 2}v-5`} fill="none" stroke="#9AA0AE" />
      <path d={`M${x(-19) + 2},${RY + 16}v5H${x(S_MIN)}v-5`} fill="none" stroke="#86A8D8" strokeDasharray="3 3" />
      <text x={(x(S_MAX) + x(-19)) / 2} y={RY + 36} textAnchor="middle" fill="#9AA0AE" fontSize={13} style={mono}>
        PROBED · ~46 POWERS OF TEN
      </text>
      <text x={(x(-19) + x(S_MIN)) / 2} y={RY + 36} textAnchor="middle" fill="#86A8D8" fontSize={13} style={mono}>
        UNPROBED · ~16 · A QUARTER
      </text>
      {/* the energy axis, mirror-mapped: E ≈ ħc/d grows to the right */}
      <line x1={x(S_MAX)} x2={x(S_MIN)} y1={EY} y2={EY} stroke="#86A8D8" strokeOpacity={0.8} />
      <text x={X0} y={EY + 16} fill="#86A8D8" fontSize={13} style={mono}>
        ENERGY TO SEE IT · E ≈ ħc/d →
      </text>
      <line x1={xE(Math.log10(E_LHC))} x2={xE(Math.log10(E_LHC))} y1={RY + 4} y2={EY + 4} stroke="#86A8D8" strokeDasharray="1 2" />
      <text x={xE(Math.log10(E_LHC)) - 6} y={EY + 16} textAnchor="end" fill="#ECE6D9" fontSize={13} style={mono}>
        LHC 13.6 TeV
      </text>
      <text x={x(S_MIN)} y={EY + 16} textAnchor="end" fill="#ECE6D9" fontSize={13} style={mono}>
        PLANCK 1.2 × 10¹⁹ GeV
      </text>
      <path d={`M${xE(Math.log10(E_LHC))},${EY + 30}v5H${xE(Math.log10(EP))}v-5`} fill="none" stroke="#86A8D8" strokeDasharray="3 3" />
      <text x={(xE(Math.log10(E_LHC)) + xE(Math.log10(EP))) / 2} y={EY + 50} textAnchor="middle" fill="#86A8D8" fontSize={13} style={mono}>
        × 9 × 10¹⁴ · ~15 MORE POWERS OF TEN
      </text>

      {/* the machine: a Planck-energy ring with LHC magnets, on the galaxy's map */}
      <text x={X0} y={318} fill="#9AA0AE" fontSize={13.5} style={mono}>
        BUILD IT BIGGER? · RING SIZE ∝ ENERGY
      </text>
      <ellipse cx={210} cy={420} rx={150} ry={62} fill="none" stroke="#9AA0AE" strokeOpacity={0.5} strokeDasharray="2 3" />
      <circle cx={210} cy={420} r={10} fill="#ECE6D9" fillOpacity={0.18} />
      <circle cx={292} cy={448} r={1.6} fill="none" stroke="#86A8D8" strokeWidth={1.2} />
      <circle cx={292} cy={448} r={8} fill="none" stroke="#86A8D8" strokeOpacity={0.6} />
      <line x1={298} y1={455} x2={318} y2={500} stroke="#86A8D8" strokeOpacity={0.6} />
      <text x={60} y={514} fill="#86A8D8" fontSize={13} style={mono}>
        PLANCK RING · ~2,500 ly AROUND
      </text>
      <text x={60} y={532} fill="#9AA0AE" fontSize={13} style={mono}>
        &lt; 1% of the Milky Way · light needs 2,500 yr per lap
      </text>
      <text x={210} y={346} textAnchor="middle" fill="#9AA0AE" fontSize={13} style={mono}>
        MILKY WAY · 87,400 ly
      </text>

      {/* the floor: Δx ≳ ħc/E + 2GE/c⁴ (heuristic) */}
      <text x={890} y={318} textAnchor="end" fill="#A99BD6" fontSize={13.5} style={mono}>
        A FLOOR · Δx ≳ ħc/E + 2GE/c⁴ (HEURISTIC)
      </text>
      <line x1={CX0} x2={CX1} y1={CY1} y2={CY1} stroke="#5C6270" />
      <line x1={CX0} x2={CX0} y1={CY0} y2={CY1} stroke="#5C6270" />
      <path d={curve((E) => HBARC / E)} fill="none" stroke="#86A8D8" />
      <path d={curve((E) => K_BH * E)} fill="none" stroke="#86A8D8" strokeDasharray="4 3" />
      <path d={curve((E) => HBARC / E + K_BH * E)} fill="none" stroke="#ECE6D9" strokeWidth={2} />
      <circle cx={cx(Math.log10(E_STAR))} cy={cy(Math.log10(DX_MIN))} r={3} fill="none" stroke="#ECE6D9" />
      <text x={cx(Math.log10(E_STAR))} y={cy(Math.log10(DX_MIN)) + 22} textAnchor="middle" fill="#ECE6D9" fontSize={13} style={mono}>
        ~3 ℓP
      </text>
      <text x={CX1} y={CY1 + 16} textAnchor="end" fill="#86A8D8" fontSize={13} style={mono}>
        COLLISION ENERGY →
      </text>
    </svg>
  )
}
