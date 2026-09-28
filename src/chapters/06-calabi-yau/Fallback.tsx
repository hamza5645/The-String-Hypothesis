import { useEffect, useMemo, useRef } from 'react'
import { getHandle } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { smoothstep } from '@/core/math'
import { usePortrait } from './figures'
import { packP } from './timeline'
import { buildLoop, evalP4, HALF_PI, HANSON_PITCH, HANSON_YAW, LOOP_COUNT, S_WORLD, XMAX } from './cyMath'
import { decodeHodge } from './hodgeData'

/*
 * No-WebGL fallback: the chapter's three key figures as one static SVG, computed from the same model
 * as the scene (content pack › Lab › Model):
 *   1 · the n = 5 Hanson slice z₁⁵ + z₂⁵ = 1 at hidden angle α = 45°, from Hanson's viewpoint, with loop a
 *   2 · the ledger: 100 generations (|χ|/2, simplest recipe) against the 3 observed
 *   3 · the Kreuzer–Skarke Hodge plot (30,108 pairs), binned to the drawing's resolution
 */

const FIELD = '#86A8D8'
const INK = '#ECE6D9'
const INK2 = '#9AA0AE'
const INK3 = '#5C6270'
const WARM = '#FFC98A'
const MONO = { fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' } as const

const N = 5
const ALPHA = Math.PI / 4

/** Hanson view of a p4 point: world (Y up) = S(Re z₁, cosα Im z₁ + sinα Im z₂, −Re z₂), then the scene's view rotation. */
function view(p: ArrayLike<number>, o: number, out: { x: number; y: number }) {
  const wx = S_WORLD * p[o]
  const wy = S_WORLD * (Math.cos(ALPHA) * p[o + 1] + Math.sin(ALPHA) * p[o + 3])
  const wz = -S_WORLD * p[o + 2]
  // Euler XYZ (pitch about X, then yaw about Y): R = Rx · Ry
  const cy = Math.cos(HANSON_YAW)
  const sy = Math.sin(HANSON_YAW)
  const x1 = cy * wx + sy * wz
  const z1 = -sy * wx + cy * wz
  const cp = Math.cos(HANSON_PITCH)
  const sp = Math.sin(HANSON_PITCH)
  out.x = x1
  out.y = cp * wy - sp * z1
}

function rot(q: Float64Array, k1: number, k2: number) {
  const a = (2 * Math.PI * k1) / N
  const b = (2 * Math.PI * k2) / N
  const r0 = q[0] * Math.cos(a) - q[1] * Math.sin(a)
  const i0 = q[0] * Math.sin(a) + q[1] * Math.cos(a)
  const r1 = q[2] * Math.cos(b) - q[3] * Math.sin(b)
  const i1 = q[2] * Math.sin(b) + q[3] * Math.cos(b)
  q[0] = r0
  q[1] = i0
  q[2] = r1
  q[3] = i1
}

const cosY = (y: number) => (y === 0 ? 1 : y === HALF_PI ? 0 : Math.cos(y))
const sinY = (y: number) => (y === 0 ? 0 : y === HALF_PI ? 1 : Math.sin(y))

function surfacePaths(cx: number, cyy: number, scale: number) {
  const q = new Float64Array(4)
  const o = { x: 0, y: 0 }
  const pt = (x: number, y: number, k1: number, k2: number) => {
    evalP4(N, x, cosY(y), sinY(y), q)
    rot(q, k1, k2)
    view(q, 0, o)
    return `${(cx + o.x * scale).toFixed(1)} ${(cyy - o.y * scale).toFixed(1)}`
  }
  let grid = ''
  let rims = ''
  const SAMPLES = 14
  for (let k1 = 0; k1 < N; k1++)
    for (let k2 = 0; k2 < N; k2++) {
      // iso-lines of x (along y), the two outer ones are the cut-off rims
      for (let a = 0; a <= 6; a++) {
        const x = -XMAX + (2 * XMAX * a) / 6
        let d = ''
        for (let j = 0; j <= SAMPLES; j++) d += `${j ? 'L' : 'M'}${pt(x, j === SAMPLES ? HALF_PI : (HALF_PI * j) / SAMPLES, k1, k2)}`
        if (a === 0 || a === 6) rims += d
        else grid += d
      }
      // iso-lines of y (along x)
      for (let b = 1; b <= 3; b++) {
        const y = (HALF_PI * b) / 4
        let d = ''
        for (let i = 0; i <= SAMPLES; i++) d += `${i ? 'L' : 'M'}${pt(-XMAX + (2 * XMAX * i) / SAMPLES, y, k1, k2)}`
        grid += d
      }
    }
  const loop = buildLoop(N)
  let l = ''
  for (let i = 0; i <= LOOP_COUNT; i++) {
    view(loop.p4, (i % LOOP_COUNT) * 4, o)
    l += `${i ? 'L' : 'M'}${(cx + o.x * scale).toFixed(1)} ${(cyy - o.y * scale).toFixed(1)}`
  }
  return { grid, rims, loop: l }
}

// Hodge plot geometry: [x0, x1, bottom y, top y] of the plot box
type Box = readonly [number, number, number, number]
const BOX_WIDE: Box = [790, 1170, 262, 62]
const BOX_PORT: Box = [352, 588, 214, 64]
const mkX = (b: Box) => (chi: number) => b[0] + ((chi + 960) / 1920) * (b[1] - b[0])
const mkY = (b: Box) => (s: number) => b[2] - (s / 502) * (b[2] - b[3])

function hodgePath(box: Box) {
  const hx = mkX(box)
  const hy = mkY(box)
  const pairs = decodeHodge()
  const seen = new Set<number>()
  let d = ''
  const B = 1.6 // bin size in drawing units: one mark per occupied bin
  for (let i = 0; i < pairs.length; i += 2) {
    const a = pairs[i]
    const b = pairs[i + 1]
    const bx = Math.round(hx(2 * (a - b)) / B)
    const by = Math.round(hy(a + b) / B)
    const key = bx * 4096 + by
    if (seen.has(key)) continue
    seen.add(key)
    d += `M${(bx * B).toFixed(1)} ${(by * B).toFixed(1)}h1.2v1.2h-1.2z`
  }
  return d
}

function Quad({ x, y, fill, stroke, k = 1 }: { x: number; y: number; fill?: string; stroke?: string; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {[
        [0, 0],
        [4.6, 0],
        [0, 4.6],
        [4.6, 4.6],
      ].map(([a, b]) => (
        <circle key={`${a}${b}`} cx={a} cy={b} r={1.7} fill={fill ?? 'none'} stroke={stroke} strokeWidth={stroke ? 0.8 : 0} />
      ))}
    </g>
  )
}

/*
 * Layout (viewBox 1200 × 560): the fallback sits centred behind the chapter's text, whose column covers
 * roughly the left quarter on desktop, so that quarter is left empty.
 */
const ARIA =
  "Three figures. One: the Hanson picture, a two-dimensional slice of the six-dimensional quintic Calabi–Yau, z1 to the fifth plus z2 to the fifth equals 1, drawn as its 3D shadow from 25 pieces, with a closed string wound around one of its six handles. Two: the Kreuzer–Skarke catalogue, 30,108 pairs of Hodge numbers from 473,800,776 polytopes, plotted as h11 plus h21 against chi; the plot is mirror-symmetric and nobody knows which shape, if any, is ours. Three: in the simplest recipe the quintic's Euler characteristic of minus 200 gives 100 generations of particles; we observe 3."

const band = (P: number, a: number, b: number) => smoothstep(a, a + 0.012, P) * (1 - smoothstep(b - 0.012, b, P))

export default function Fallback() {
  const portrait = usePortrait()
  // the chapter's DOM figures (rosette, ledger, dials; the ring strip on phones) take the same screen area:
  // the static figures step back while they are up
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = getHandle('calabi-yau', 6)
    const f = () => {
      const P = packP(h.progress())
      const busy = Math.max(band(P, 0.118, 0.19), band(P, 0.452, 0.708), portrait ? band(P, 0.316, 0.47) : 0)
      if (root.current) root.current.style.opacity = (1 - busy).toFixed(3)
    }
    f()
    return onJourney(f)
  }, [portrait])
  return (
    <div ref={root} className="cy-fallback">
      {portrait ? <FallbackPortrait /> : <FallbackWide />}
    </div>
  )
}

/*
 * Phones: one compact stack in the upper half of the screen (the beat text sits at the bottom), every
 * label ≥ 18 units ≈ 11 px at a 358 px column.
 */
function FallbackPortrait() {
  const surf = useMemo(() => surfacePaths(172, 214, 108), [])
  const hodge = useMemo(() => hodgePath(BOX_PORT), [])
  const hx = mkX(BOX_PORT)
  const hy = mkY(BOX_PORT)
  const T = { ...MONO, fontSize: 18.5 }
  return (
    <svg viewBox="0 0 600 664" role="img" aria-label={ARIA}>
      <text x={4} y={22} fill={INK} style={T}>
        z₁⁵ + z₂⁵ = 1
      </text>
      <text x={4} y={46} fill={INK2} style={T}>
        4D → 3D SHADOW
      </text>
      <path d={surf.grid} fill="none" stroke={FIELD} strokeWidth={1.1} strokeOpacity={0.55} />
      <path d={surf.rims} fill="none" stroke={INK2} strokeWidth={1.1} strokeDasharray="5 5" strokeOpacity={0.75} />
      <path d={surf.loop} fill="none" stroke={WARM} strokeWidth={7} strokeOpacity={0.16} strokeLinejoin="round" />
      <path d={surf.loop} fill="none" stroke={WARM} strokeWidth={2.2} strokeLinejoin="round" />
      <text x={4} y={392} fill={INK2} style={T}>
        2D SLICE OF THE 6D QUINTIC · 6 HANDLES
      </text>
      <text x={4} y={416} fill={INK2} style={T}>
        NOT OUR UNIVERSE · SIZE UNKNOWN
      </text>

      <text x={BOX_PORT[0]} y={24} fill={INK} style={T}>
        30,108 HODGE PAIRS
      </text>
      <path d={hodge} fill={FIELD} fillOpacity={0.85} />
      <line x1={BOX_PORT[0]} x2={BOX_PORT[1]} y1={BOX_PORT[2]} y2={BOX_PORT[2]} stroke={INK3} strokeWidth={1.1} />
      <line x1={BOX_PORT[0]} x2={BOX_PORT[0]} y1={BOX_PORT[2]} y2={BOX_PORT[3] - 8} stroke={INK3} strokeWidth={1.1} />
      <line x1={hx(0)} x2={hx(0)} y1={BOX_PORT[2]} y2={BOX_PORT[3] - 8} stroke={INK2} strokeWidth={1} strokeDasharray="3 4" />
      <circle cx={hx(-200)} cy={hy(102)} r={4.5} fill={INK} />
      <text x={hx(-200) - 10} y={hy(102) - 10} textAnchor="end" fill={INK} style={T}>
        QUINTIC
      </text>
      <text x={BOX_PORT[0]} y={BOX_PORT[2] + 30} fill={INK2} style={T}>
        χ = 2(h¹¹ − h²¹)
      </text>
      <text x={BOX_PORT[0]} y={BOX_PORT[2] + 54} fill={INK2} style={T}>
        MIRROR-SYMMETRIC
      </text>
      <text x={BOX_PORT[0]} y={BOX_PORT[2] + 78} fill={INK3} style={T}>
        473,800,776
      </text>
      <text x={BOX_PORT[0]} y={BOX_PORT[2] + 100} fill={INK3} style={T}>
        POLYTOPES
      </text>

      <g transform="translate(4 452)">
        <text x={0} y={0} fill={INK2} style={T}>
          FULL QUINTIC · χ = 2(1 − 101) = −200
        </text>
        {Array.from({ length: 100 }, (_, i) => (
          <Quad key={i} x={4 + (i % 25) * 15} y={22 + Math.floor(i / 25) * 15} fill={FIELD} k={1.45} />
        ))}
        <text x={392} y={70} fill={INK} fontSize={48} style={{ fontFamily: 'var(--font-display)' }}>
          100
        </text>
        {[0, 1, 2].map((i) => (
          <Quad key={i} x={4 + i * 15} y={100} fill={INK} k={1.45} />
        ))}
        <text x={62} y={110} fill={INK} style={T}>
          OBSERVED: 3
        </text>
        <text x={0} y={146} fill={FIELD} style={T}>
          SIMPLEST RECIPE: 100 GENERATIONS · |χ|/2
        </text>
        <text x={0} y={172} fill={INK3} style={T}>
          Z-boson decays: 2.996 ± 0.007
        </text>
        <text x={0} y={196} fill={INK3} style={T}>
          light neutrino types
        </text>
      </g>
    </svg>
  )
}

function FallbackWide() {
  const surf = useMemo(() => surfacePaths(520, 290, 132), [])
  const hodge = useMemo(() => hodgePath(BOX_WIDE), [])
  const hx = mkX(BOX_WIDE)
  const hy = mkY(BOX_WIDE)
  const [PX0, PX1, PY0, PY1] = BOX_WIDE
  return (
    <svg viewBox="0 0 1200 560" role="img" aria-label={ARIA}>
      {/* 1 · the slice */}
      <g>
        <path d={surf.grid} fill="none" stroke={FIELD} strokeWidth={0.9} strokeOpacity={0.55} />
        <path d={surf.rims} fill="none" stroke={INK2} strokeWidth={0.9} strokeDasharray="4 4" strokeOpacity={0.75} />
        <path d={surf.loop} fill="none" stroke={WARM} strokeWidth={6} strokeOpacity={0.16} strokeLinejoin="round" />
        <path d={surf.loop} fill="none" stroke={WARM} strokeWidth={1.8} strokeLinejoin="round" />
        <text x={520} y={40} textAnchor="middle" fill={INK} fontSize={13} style={MONO}>
          z₁⁵ + z₂⁵ = 1 · 4D → 3D SHADOW
        </text>
        <text x={520} y={528} textAnchor="middle" fill={INK2} fontSize={11.5} style={MONO}>
          2D SLICE OF THE 6D QUINTIC · 25 PIECES · 6 HANDLES
        </text>
        <text x={520} y={546} textAnchor="middle" fill={INK3} fontSize={11.5} style={MONO}>
          NOT OUR UNIVERSE · SIZE UNKNOWN · DASHED: CUT OFF HERE
        </text>
      </g>

      {/* 2 · the Hodge plot */}
      <g>
        <text x={PX0} y={30} fill={INK} fontSize={11.5} style={MONO}>
          473,800,776 POLYTOPES · 30,108 HODGE PAIRS
        </text>
        <path d={hodge} fill={FIELD} fillOpacity={0.85} />
        <line x1={PX0} x2={PX1} y1={PY0} y2={PY0} stroke={INK3} strokeWidth={0.9} />
        <line x1={PX0} x2={PX0} y1={PY0} y2={PY1 - 8} stroke={INK3} strokeWidth={0.9} />
        <line x1={hx(0)} x2={hx(0)} y1={PY0} y2={PY1 - 8} stroke={INK2} strokeWidth={0.8} strokeDasharray="3 4" />
        {[-960, 0, 960].map((c) => (
          <text key={c} x={hx(c)} y={PY0 + 16} textAnchor="middle" fill={INK3} fontSize={10.5} style={MONO}>
            {c < 0 ? `−${-c}` : c}
          </text>
        ))}
        <text x={hx(0)} y={PY0 + 34} textAnchor="middle" fill={INK2} fontSize={11} style={MONO}>
          χ = 2(h¹¹ − h²¹) · mirror-symmetric
        </text>
        <text x={PX0 + 6} y={PY1 + 4} fill={INK2} fontSize={11} style={MONO}>
          h¹¹ + h²¹
        </text>
        <circle cx={hx(-200)} cy={hy(102)} r={3.4} fill={INK} />
        <text x={hx(-200) - 9} y={hy(102) + 4} textAnchor="end" fill={INK} fontSize={11} style={MONO}>
          QUINTIC
        </text>
      </g>

      {/* 3 · the ledger: 100 against 3 */}
      <g transform="translate(790 352)">
        <text x={0} y={0} fill={INK2} fontSize={11} style={MONO}>
          FULL QUINTIC · χ = 2(1 − 101) = −200
        </text>
        {Array.from({ length: 100 }, (_, i) => (
          <Quad key={i} x={2 + (i % 20) * 12.5} y={22 + Math.floor(i / 20) * 13} fill={FIELD} />
        ))}
        <text x={262} y={60} fill={INK} fontSize={30} style={{ fontFamily: 'var(--font-display)' }}>
          100
        </text>
        {[0, 1, 2].map((i) => (
          <Quad key={i} x={2 + i * 12.5} y={110} fill={INK} />
        ))}
        <text x={50} y={118} fill={INK} fontSize={11} style={MONO}>
          OBSERVED: 3
        </text>
        <text x={0} y={150} fill={FIELD} fontSize={11} style={MONO}>
          SIMPLEST RECIPE: 100 GENERATIONS · |χ|/2
        </text>
        <text x={0} y={168} fill={INK3} fontSize={10.5} style={MONO}>
          Z-boson decays: 2.996 ± 0.007 light neutrino types
        </text>
        <text x={0} y={186} fill={INK3} fontSize={10.5} style={MONO}>
          So, in this recipe, the quintic isn’t our world.
        </text>
      </g>
    </svg>
  )
}
