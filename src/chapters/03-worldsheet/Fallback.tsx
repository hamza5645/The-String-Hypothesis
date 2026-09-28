import { cPants, L, T_STAR, Y_SPEED } from './model'

/*
 * No-WebGL figure (Lab › Fallback): the Y and the pants side by side in an x–ct side view, each crossed by
 * three "now" lines (0° and ±30°). The Y's three split marks coincide at the vertex; the pants' marks sit at
 * x = −0.19, 0, +0.19 ℓ (ct 5.38, 5.33, 5.38), shown again in a ×4 crotch inset. Outlines come from the model:
 * the side-view silhouette of Φ = L is its y = 0 section, G(x, t) = e^{−(x−c)²} + e^{−(x+c)²} = L.
 */

const G = (x: number, t: number) => {
  const c = cPants(t)
  return Math.exp(-(x - c) * (x - c)) + Math.exp(-(x + c) * (x + c))
}
/** bisection for G(x, t) = L on [a, b] (G(a) and G(b) on opposite sides) */
function root(t: number, a: number, b: number) {
  let lo = a
  let hi = b
  const sLo = G(lo, t) > L
  for (let i = 0; i < 40; i++) {
    const m = 0.5 * (lo + hi)
    if (G(m, t) > L === sLo) lo = m
    else hi = m
  }
  return 0.5 * (lo + hi)
}

// geometry of the figure
const SX = 34 // px per ℓ
const T0 = 388 // y of ct = 0
const Y = (t: number) => T0 - t * SX
const XY = 205 // Y history centre
const XP = 610 // pants centre
const TAN30 = Math.tan(Math.PI / 6)
const T0_TILT = 5.272 // t₀* for θ = 30°, φ = 0 (and φ = 180° by symmetry)

function outline() {
  const outerR: string[] = []
  const outerL: string[] = []
  const inner: [number, number][] = []
  for (let t = 0; t <= 10.0001; t += 0.05) {
    const c = cPants(t)
    const xo = root(t, Math.max(0, c), c + 3)
    outerR.push(`${(XP + xo * SX).toFixed(1)},${Y(t).toFixed(1)}`)
    outerL.push(`${(XP - xo * SX).toFixed(1)},${Y(t).toFixed(1)}`)
    if (t > T_STAR && G(0, t) < L) inner.push([root(t, 0, c), t])
  }
  // inner arch: from the left leg's inner wall, over the crotch, down the right leg's inner wall
  const tip = `${XP},${Y(T_STAR).toFixed(1)}`
  const arch =
    inner
      .slice()
      .reverse()
      .map(([x, t]) => `${(XP - x * SX).toFixed(1)},${Y(t).toFixed(1)}`)
      .join(' ') +
    ` ${tip} ` +
    inner.map(([x, t]) => `${(XP + x * SX).toFixed(1)},${Y(t).toFixed(1)}`).join(' ')
  return { right: outerR.join(' '), left: outerL.join(' '), arch }
}
const O = outline()

// ×4 inset of the crotch: x ∈ [−0.55, 0.55], ct ∈ [4.95, 5.85]
const IX = 820
const IY = 96
const IS = SX * 4
const ix = (x: number) => IX + x * IS
const iy = (t: number) => IY - (t - 5.4) * IS
function insetArch() {
  const pts: string[] = []
  for (let x = -0.55; x <= 0.5501; x += 0.01) {
    // crotch graph t = T(x, 0): the arch between the legs near the pinch
    let lo = 4.9
    let hi = 6.2
    for (let i = 0; i < 40; i++) {
      const m = 0.5 * (lo + hi)
      if (G(x, m) > L) lo = m
      else hi = m
    }
    pts.push(`${ix(x).toFixed(1)},${iy(0.5 * (lo + hi)).toFixed(1)}`)
  }
  return pts.join(' ')
}
const INSET_ARCH = insetArch()

function Mark({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return (
    <g stroke="#86A8D8" strokeWidth="1" fill="none">
      <circle cx={x} cy={y} r={r} />
      <path d={`M${x - r - 5} ${y}h4M${x + r + 1} ${y}h4M${x} ${y - r - 5}v4M${x} ${y + r + 1}v4`} />
    </g>
  )
}

export default function Fallback() {
  const tv = T_STAR
  const yEnd = 10
  const dx = Y_SPEED * (yEnd - tv) * SX
  const nowLine = (cx: number, t0: number, slope: number, half: number) => `M${cx - half * SX} ${Y(t0 - slope * half)} L${cx + half * SX} ${Y(t0 + slope * half)}`
  const txt = { fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: 1.2 }
  return (
    <svg viewBox="0 0 900 430" role="img" aria-label="Two histories in a side view with time upward. Left: a particle Y whose three tilted 'now' lines all find the split at the same vertex. Right: a pair-of-pants worldsheet whose three 'now' lines find the split at three different points, shown magnified four times.">
      <g stroke="#86A8D8" strokeWidth="1" opacity="0.35">
        <path d={`M40 ${T0}H860`} />
        <path d={`M40 ${T0}V30`} />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M40 ${Y(i)}h${i % 5 === 0 ? 8 : 4}`} />
        ))}
      </g>
      <text x="48" y="26" fill="#86A8D8" style={txt}>
        ct [ℓ] ↑
      </text>

      {/* Y */}
      <g stroke="#86A8D8" strokeWidth="1.2" fill="none">
        <path d={`M${XY} ${Y(0)}V${Y(tv)}L${XY - dx} ${Y(yEnd)}M${XY} ${Y(tv)}L${XY + dx} ${Y(yEnd)}`} />
      </g>
      {/* pants silhouette (y = 0 section) */}
      <g stroke="#86A8D8" strokeWidth="1.2" fill="rgba(134,168,216,0.06)">
        <polyline points={O.right} fill="none" />
        <polyline points={O.left} fill="none" />
        <polyline points={O.arch} fill="none" />
      </g>

      {/* three "now" lines per history: 0°, +30° (φ = 0), −30° (φ = 180°) — each tangent at its split */}
      <g stroke="#FFC98A" strokeWidth="1" fill="none" opacity="0.85">
        <path d={nowLine(XY, tv, 0, 2.6)} />
        <path d={nowLine(XY, tv, TAN30, 2.6)} strokeDasharray="5 4" />
        <path d={nowLine(XY, tv, -TAN30, 2.6)} strokeDasharray="1.5 3" />
        <path d={nowLine(XP, tv, 0, 3.9)} />
        <path d={nowLine(XP, T0_TILT, TAN30, 3.9)} strokeDasharray="5 4" />
        <path d={nowLine(XP, T0_TILT, -TAN30, 3.9)} strokeDasharray="1.5 3" />
      </g>
      <Mark x={XY} y={Y(tv)} />
      <Mark x={XP - 0.19 * SX} y={Y(5.382)} r={3.5} />
      <Mark x={XP} y={Y(tv)} r={3.5} />
      <Mark x={XP + 0.19 * SX} y={Y(5.382)} r={3.5} />

      {/* ×4 inset */}
      <g>
        <rect x={IX - 0.55 * IS} y={iy(5.85)} width={1.1 * IS} height={0.9 * IS} fill="rgba(5,7,11,0.85)" stroke="#86A8D8" strokeOpacity="0.5" />
        <polyline points={INSET_ARCH} stroke="#86A8D8" strokeWidth="1.2" fill="none" />
        <g stroke="#FFC98A" strokeWidth="1" opacity="0.85" fill="none">
          <path d={`M${ix(-0.55)} ${iy(tv)}H${ix(0.55)}`} />
          <path d={`M${ix(-0.55)} ${iy(T0_TILT - TAN30 * 0.55)}L${ix(0.55)} ${iy(T0_TILT + TAN30 * 0.55)}`} strokeDasharray="5 4" />
          <path d={`M${ix(-0.55)} ${iy(T0_TILT + TAN30 * 0.55)}L${ix(0.55)} ${iy(T0_TILT - TAN30 * 0.55)}`} strokeDasharray="1.5 3" />
        </g>
        <Mark x={ix(-0.19)} y={iy(5.382)} />
        <Mark x={ix(0)} y={iy(tv)} />
        <Mark x={ix(0.19)} y={iy(5.382)} />
        <text x={IX - 0.55 * IS} y={iy(5.85) - 8} fill="#86A8D8" style={txt}>
          ×4 CROTCH
        </text>
        <text x={IX - 0.55 * IS + 6} y={iy(4.95) - 8} fill="#9AA0AE" style={{ ...txt, fontSize: 9 }}>
          −0.19 · 0 · +0.19 ℓ
        </text>
        <path d={`M${XP + 0.6 * SX} ${Y(5.8)}L${IX - 0.55 * IS} ${iy(5.6)}`} stroke="#86A8D8" strokeOpacity="0.35" />
      </g>

      <g style={txt}>
        <text x={XY} y="416" fill="#ECE6D9" textAnchor="middle">
          PARTICLES · ONE VERTEX FOR EVERY TILT
        </text>
        <text x={XP} y="416" fill="#ECE6D9" textAnchor="middle">
          STRINGS · THE SPLIT MOVES WITH THE TILT
        </text>
        <text x={XY + 2.7 * SX} y={Y(tv) + 4} fill="#FFC98A">
          NOW 0°
        </text>
        <text x={XY + 2.7 * SX} y={Y(tv + TAN30 * 2.6) + 4} fill="#FFC98A">
          +30°
        </text>
        <text x={XY + 2.7 * SX} y={Y(tv - TAN30 * 2.6) + 4} fill="#FFC98A">
          −30°
        </text>
      </g>
    </svg>
  )
}
