/*
 * Landmark data: the Ruler's sizes (content pack § The Ruler) and a simplified hairline map of
 * the Geneva basin (hand-simplified outlines, public-domain geography; ANALOGY-level accuracy).
 */

export interface RulerLandmark {
  id: string
  s: number
  name: string
  value: string
  /** shown on phones too */
  core: boolean
  /** priority for label placement (lower = placed first) */
  pri: number
  /** 14 px hairline glyph (SVG path, centred at 0,0, ±7) */
  glyph: string
}

const circle = (r: number, cx = 0, cy = 0) => `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`

export const RULER_LANDMARKS: RulerLandmark[] = [
  { id: 'universe', s: Math.log10(8.8e26), name: 'Observable\nuniverse', value: '8.8 × 10²⁶ m', core: true, pri: 1, glyph: circle(6) + circle(0.6, -2, -1.5) + circle(0.6, 2.5, 1) + circle(0.6, -1, 3) },
  { id: 'andromeda', s: Math.log10(2.4e22), name: 'Andromeda', value: '2.4 × 10²² m away', core: false, pri: 12, glyph: 'M-7,2.5 C-3,-4 4,-5 7,-2.5 M-6,3 C-1,1 3,-1 6,-3' },
  { id: 'milkyway', s: Math.log10(8.3e20), name: 'Milky Way', value: '8.3 × 10²⁰ m', core: true, pri: 7, glyph: 'M0,0 C3,-1 4,-5 0,-6 C-4,-6 -6,-1 -5,3 M0,0 C-3,1 -4,5 0,6 C4,6 6,1 5,-3' },
  { id: 'star', s: Math.log10(4.0e16), name: 'Nearest star', value: '4.0 × 10¹⁶ m away', core: false, pri: 8, glyph: 'M0,-6 L0,6 M-6,0 L6,0 M-3,-3 L3,3 M-3,3 L3,-3' },
  { id: 'solar', s: Math.log10(9.0e12), name: 'Solar System', value: '9.0 × 10¹² m', core: true, pri: 6, glyph: circle(6.5) + circle(3.4) + circle(1) },
  { id: 'earth', s: Math.log10(1.27e7), name: 'Earth', value: '1.27 × 10⁷ m', core: true, pri: 4, glyph: circle(6) + 'M1.5,-5.8 A6.5,6.5 0 0,1 1.5,5.8' },
  { id: 'tree', s: 2, name: 'Tall tree', value: '~100 m', core: false, pri: 10, glyph: 'M0,7 L0,-1 M0,-7 L-4,1 L4,1 Z' },
  { id: 'you', s: Math.log10(1.7), name: 'You', value: '1.7 m', core: true, pri: 2, glyph: circle(1.6, 0, -5) + 'M0,-3 L0,2.5 M0,2.5 L-2.2,7 M0,2.5 L2.2,7 M-3,-1 L3,-1' },
  { id: 'paper', s: -4, name: 'Paper', value: '1 × 10⁻⁴ m', core: false, pri: 13, glyph: 'M-0.6,-7 L0.6,-7 L0.6,7 L-0.6,7 Z' },
  { id: 'cell', s: -5, name: 'Cell', value: '1 × 10⁻⁵ m', core: false, pri: 9, glyph: 'M-6,-2 L-2,-6 L4,-5 L6.5,0 L3,6 L-4,5.5 Z' + circle(1.4, 0.5, 0) },
  { id: 'atom', s: -10, name: 'Atom', value: '1 × 10⁻¹⁰ m', core: true, pri: 3, glyph: circle(6) + circle(0.8) },
  { id: 'nucleus', s: -14, name: 'Nucleus', value: '1 × 10⁻¹⁴ m', core: false, pri: 14, glyph: circle(2.2, -2, -1) + circle(2.2, 2, -1) + circle(2.2, 0, 2.2) },
  { id: 'proton', s: Math.log10(1.7e-15), name: 'Proton', value: '1.7 × 10⁻¹⁵ m across', core: true, pri: 5, glyph: circle(6) + circle(0.8, -2.5, -1.5) + circle(0.8, 2.5, -1.5) + circle(0.8, 0, 2.6) },
  { id: 'edge', s: -19, name: 'Edge of direct\nmeasurement', value: '~10⁻¹⁹ m', core: true, pri: 2, glyph: 'M-5,-7 L-5,7 M-2,-7 L-2,7 M1,-5 L1,5 M4,-3 L4,3' },
  { id: 'planck', s: Math.log10(1.616e-35), name: 'Planck length', value: '1.6 × 10⁻³⁵ m', core: true, pri: 0, glyph: '' },
]

// ── The Geneva basin (lat, lon), hand-simplified ─────────────────────────────
export const CERN_LATLON: [number, number] = [46.2342, 6.0547]
const KX = 111.32 * Math.cos((46.24 * Math.PI) / 180) // km per degree of longitude
const KY = 111.19 // km per degree of latitude
/** (lat, lon) → metres east/north of CERN */
export const geo = (lat: number, lon: number): [number, number] => [(lon - CERN_LATLON[1]) * KX * 1e3, (lat - CERN_LATLON[0]) * KY * 1e3]

export const LAKE: [number, number][] = [
  [46.2046, 6.147], [46.22, 6.153], [46.254, 6.156], [46.283, 6.165], [46.315, 6.192], [46.348, 6.213], [46.383, 6.24],
  [46.405, 6.275], [46.458, 6.338], [46.47, 6.45], [46.507, 6.498], [46.51, 6.56], [46.506, 6.627], [46.49, 6.69],
  [46.488, 6.73], [46.46, 6.843], [46.433, 6.91], [46.397, 6.928], [46.385, 6.86], [46.392, 6.805], [46.408, 6.725],
  [46.401, 6.59], [46.398, 6.53], [46.374, 6.48], [46.35, 6.37], [46.37, 6.326], [46.35, 6.295], [46.302, 6.243],
  [46.275, 6.225], [46.253, 6.2], [46.24, 6.195], [46.21, 6.16],
]
export const JURA: [number, number][] = [
  [46.12, 5.89], [46.19, 5.92], [46.25, 5.945], [46.3, 5.97], [46.37, 6.02], [46.425, 6.1], [46.5, 6.2], [46.595, 6.31], [46.68, 6.36],
]
export const BORDER: [number, number][] = [
  [46.302, 6.245], [46.28, 6.26], [46.25, 6.29], [46.22, 6.28], [46.19, 6.235], [46.175, 6.19], [46.16, 6.15], [46.14, 6.1],
  [46.14, 6.04], [46.13, 5.99], [46.16, 5.97], [46.19, 6.0], [46.22, 6.03], [46.236, 6.06], [46.25, 6.08], [46.26, 6.1],
  [46.28, 6.12], [46.3, 6.13], [46.33, 6.12], [46.36, 6.12], [46.4, 6.08], [46.43, 6.09], [46.5, 6.18], [46.58, 6.25],
]
export const GENEVA: [number, number] = [46.2044, 6.1432]

// ── Earth's graticule, orthographic about CERN (metres east/north in the map plane) ──────────
const DEG = Math.PI / 180
const R_EARTH = 6.371e6
/** Parallels and meridians every `step` degrees (skipping multiples of `skip`), front hemisphere only. */
export function graticulePath(step: number, skip = 0): string {
  const f0 = CERN_LATLON[0] * DEG
  const l0 = CERN_LATLON[1] * DEG
  const proj = (lat: number, lon: number): [number, number] | null => {
    const f = lat * DEG
    const dl = lon * DEG - l0
    if (Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(dl) < 0) return null
    return [R_EARTH * Math.cos(f) * Math.sin(dl), R_EARTH * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(dl))]
  }
  let d = ''
  const run = (pts: [number, number][]) => {
    let pen = false
    for (const [la, lo] of pts) {
      const q = proj(la, lo)
      if (!q) {
        pen = false
        continue
      }
      d += `${pen ? 'L' : 'M'}${q[0].toFixed(0)},${q[1].toFixed(0)}`
      pen = true
    }
  }
  const skipIt = (v: number) => skip > 0 && Math.abs(v % skip) < 1e-9
  for (let lat = -80; lat <= 80; lat += step) {
    if (skipIt(lat)) continue
    const pts: [number, number][] = []
    for (let lon = -180; lon <= 180; lon += 1.5) pts.push([lat, lon])
    run(pts)
  }
  for (let lon = -180; lon < 180; lon += step) {
    if (skipIt(lon)) continue
    // meridians stop at ±80° (only every 90th runs to the pole), so the poles don't knot into a blot
    const cap = Math.abs(lon % 90) < 1e-9 ? 90 : 80
    const pts: [number, number][] = []
    for (let lat = -cap; lat <= cap; lat += 1.5) pts.push([lat, lon])
    run(pts)
  }
  return d
}
