/*
 * Chapter 10 · Out of Reach — the Lab Model (content/10-scale-problem.md § Model), implemented exactly.
 * Everything here is float64 JS arithmetic; only ratios ever reach the GPU.
 */

// ── Constants ────────────────────────────────────────────────────────────────
export const HBARC = 1.973269804e-16 // GeV·m
export const LP = 1.616255e-35 // m
export const EP = 1.22089e19 // GeV
export const C_LIGHT = 299_792_458 // m/s
export const LY = 9.4607304725808e15 // m
export const AU = 1.495978707e11 // m
export const GEV_J = 1.602176634e-10 // J per GeV
export const E_LHC = 13_600 // GeV (13.6 TeV collision energy)
export const FILL = 0.6606 // dipole fill factor (reproduces the LHC's 26 659 m at 7 TeV, 8.33 T)
export const C_GAMMA_P = 7.783e-18 // m·GeV⁻³
export const K_BH = 2.6477e-54 // 2G/c⁴ in m/GeV
export const E_STAR = Math.sqrt(HBARC / K_BH) // 8.63e18 GeV
export const DX_MIN = 2 * Math.sqrt(HBARC * K_BH) // 4.57e-35 m
export const LHC_REAL_C = 26_659 // m
export const LHC_REAL_D = 8.49e3 // m

// ── The Ruler ────────────────────────────────────────────────────────────────
export const S_MAX = Math.log10(8.8e26) // 26.94 — observable universe (diameter)
export const S_MIN = Math.log10(1.616e-35) // −34.79 — Planck length
export const S_STUB = -36 // dotted stub: the axis does not end at ℓP
export const S_EDGE = -19 // edge of direct measurement (~10⁻¹⁹ m)
export const LOG_HBARC = Math.log10(HBARC) // −15.705: log₁₀(E/GeV) = −15.705 − s
export const S_STRING = -34 // the Thread's assumed ℓs = 10⁻³⁴ m (the H0 point on the Ruler)
export const S_LOWSCALE = Math.log10(2.5e-20) // −19.6: ħc / 7.9 TeV
export const S_TRAD = -33 // traditional band upper edge (10⁻³³ m)

export const eOfS = (s: number) => LOG_HBARC - s // log₁₀(E / GeV)
export const sOfE = (logE: number) => LOG_HBARC - logE

// ── Model 1–4: energy and machine size ───────────────────────────────────────
export type MachineId = 'lhc' | 'fcc' | 'hts' | 'linear' | 'plasma'
export interface MachineSpec {
  id: MachineId
  label: string
  short: string
  kind: 'ring' | 'linear'
  B?: number // T
  G?: number // GeV/m
}
export const MACHINES: MachineSpec[] = [
  { id: 'lhc', label: 'LHC magnets 8.33 T', short: 'LHC 8.3T', kind: 'ring', B: 8.33 },
  { id: 'fcc', label: 'FCC-hh magnets 14 T', short: 'FCC 14T', kind: 'ring', B: 14 },
  { id: 'hts', label: 'HTS magnets 20 T', short: 'HTS 20T', kind: 'ring', B: 20 },
  { id: 'linear', label: 'Linear 100 MV/m', short: 'Linear', kind: 'linear', G: 0.1 },
  { id: 'plasma', label: 'Plasma 50 GV/m', short: 'Plasma', kind: 'linear', G: 50 },
]
export const machineById = (id: MachineId) => MACHINES.find((m) => m.id === id)!

export const energyOf = (d: number) => HBARC / d // GeV (≈; conventional prefactor)
export const beamEnergy = (E: number) => E / 2
export const ringRho = (E: number, B: number) => beamEnergy(E) / (0.299792458 * B) // m
export const ringC = (E: number, B: number) => (2 * Math.PI * ringRho(E, B)) / FILL // m
export const linearL = (E: number, G: number) => (2 * beamEnergy(E)) / G // m (active length only)

export interface Machine {
  E: number // GeV
  kind: 'ring' | 'linear'
  C: number // circumference (rings) or total length (linear), m
  D: number // width: C/π for rings, L for linear
  rho: number // bending radius (rings), m
  t: number // lap time (rings) or one-arm light time (linear), s
}
export function machine(E: number, spec: MachineSpec, out?: Machine): Machine {
  const o = out ?? ({} as Machine)
  o.E = E
  if (spec.kind === 'ring') {
    const C = ringC(E, spec.B!)
    o.kind = 'ring'
    o.C = C
    o.D = C / Math.PI
    o.rho = C / (2 * Math.PI)
    o.t = C / C_LIGHT
    return o
  }
  const L = linearL(E, spec.G!)
  o.kind = 'linear'
  o.C = L
  o.D = L
  o.rho = 0
  o.t = L / 2 / C_LIGHT
  return o
}
/** Energy at which an 8.33 T-style ring of field B reaches width D (inverse of Model 3). */
export const ringEnergyForWidth = (D: number, B: number) => D * 0.299792458 * B * FILL

// ── Model 6: synchrotron loss per lap ────────────────────────────────────────
export type SynchState = { kind: 'negligible'; u: number } | { kind: 'loss'; u: number } | { kind: 'fatal' }
export function synchrotron(E: number, B: number): SynchState {
  const Eb = beamEnergy(E)
  const u = C_GAMMA_P * 0.299792458 * B * Eb * Eb
  const chi = ((Eb / 0.93827) * B) / 1.488e16
  if (u >= 0.1 || chi > 0.1) return { kind: 'fatal' }
  if (u < 1e-4) return { kind: 'negligible', u }
  return { kind: 'loss', u }
}

// ── Model 7: black-hole floor (heuristic, CONJECTURED) ───────────────────────
export const floorDx = (E: number) => HBARC / E + K_BH * E
export const stringDx = (E: number, ls = 1e-34) => HBARC / E + (ls * ls * E) / HBARC

// ── Model 8: joules ──────────────────────────────────────────────────────────
export function joules(E: number) {
  const J = E * GEV_J
  if (J < 1) return { J, text: `≈ ${fmtCount(J / 1.6e-7)} flying mosquito${J / 1.6e-7 >= 1.5 ? 'es' : ''}` }
  if (J >= 3.4e6) return { J, text: `≈ ${fmtCount(J / 3.42e7)} L of petrol` }
  return { J, text: '' }
}

// ── Model 9: map landmarks ───────────────────────────────────────────────────
export interface MapLandmark {
  id: string
  name: string // for the comparison string
  D: number // m
  centre: 'cern' | 'sun' | 'none'
  label: string
}
export const MAP_LANDMARKS: MapLandmark[] = [
  { id: 'lhc', name: 'the LHC ring', D: LHC_REAL_D, centre: 'none', label: 'LHC' },
  { id: 'lake', name: "Lake Geneva's length", D: 73e3, centre: 'none', label: 'Lake Geneva' },
  { id: 'earth', name: 'Earth', D: 1.2742e7, centre: 'cern', label: 'Earth' },
  { id: 'moon', name: "the Moon's orbit", D: 7.688e8, centre: 'cern', label: "Moon's orbit" },
  { id: 'sun', name: 'the Sun', D: 1.3927e9, centre: 'sun', label: 'Sun' },
  { id: 'earthorbit', name: "Earth's orbit", D: 2 * AU, centre: 'sun', label: "Earth's orbit" },
  { id: 'neptune', name: 'the Solar System (Neptune’s orbit)', D: 60.14 * AU, centre: 'sun', label: "Solar System · Neptune's orbit" },
  { id: 'proxima', name: 'the distance to the nearest star', D: 4.2465 * LY, centre: 'none', label: 'Proxima Centauri' },
  { id: 'galaxy', name: 'the Milky Way', D: 87_400 * LY, centre: 'none', label: 'Milky Way' },
]
export function comparison(width: number): string {
  let best: MapLandmark | null = null
  for (const l of MAP_LANDMARKS) if (l.D <= width && (!best || l.D > best.D)) best = l
  if (!best) return width > 0.8 * LHC_REAL_D ? 'about the size of the LHC' : 'smaller than the LHC ring'
  const x = width / best.D
  if (best.id === 'lhc' && x < 1.25) return 'about the size of the LHC'
  const num = x < 10 ? x.toFixed(1).replace(/\.0$/, '') : fmtCount(x)
  return `≈ ${num} × ${best.name}`
}

/** Overtake tags (Beat 4): energies at which an 8.33 T ring's diameter passes each landmark. */
export const OVERTAKES = [
  { id: 'earth', text: 'Ring > Earth', D: 1.2742e7 },
  { id: 'moon', text: "Ring > Moon's orbit", D: 7.688e8 },
  { id: 'earthorbit', text: "Ring > Earth's orbit", D: 2 * AU },
  { id: 'neptune', text: 'Ring > Solar System', D: 60.14 * AU },
  { id: 'proxima', text: 'Ring radius > distance to nearest star', D: 2 * 4.2465 * LY },
]

// ── Model 10: framing ────────────────────────────────────────────────────────
export const L_MIN = 5e4
export const frameL = (width: number) => Math.max(L_MIN, 1.667 * width)

// ── Formatting ───────────────────────────────────────────────────────────────
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const sup = (n: number | string) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')

/** "1.6 × 10⁻³⁵" (digits = significant figures). Pure power of ten prints as "10⁻³⁵". */
export function sci(v: number, digits = 2, keepOne = false): string {
  if (!isFinite(v) || v === 0) return '0'
  let e = Math.floor(Math.log10(Math.abs(v)))
  let m = v / Math.pow(10, e)
  let ms = m.toFixed(Math.max(0, digits - 1))
  if (Math.abs(Number(ms)) >= 10) {
    e += 1
    m = v / Math.pow(10, e)
    ms = m.toFixed(Math.max(0, digits - 1))
  }
  if (!keepOne && (ms === '1' || /^1\.0+$/.test(ms))) return `10${sup(e)}`
  return `${ms} × 10${sup(e)}`
}
/** Plain numbers for moderate magnitudes, scientific beyond. */
export function num(v: number, digits = 2): string {
  const a = Math.abs(v)
  if (a >= 0.01 && a < 1e5) {
    if (a >= 100) return fmtCount(v)
    return Number(v.toPrecision(digits)).toString()
  }
  return sci(v, digits)
}
/** Thousands separators, 2–3 significant figures ("2,460", "180"). */
export function fmtCount(v: number): string {
  if (v >= 1e6) return sci(v, 2)
  const p = v >= 1000 ? 3 : 2
  const r = Number(v.toPrecision(p))
  return r.toLocaleString('en-US', { maximumFractionDigits: r < 10 ? 1 : 0 })
}

export function fmtLength(m: number): string {
  if (m < 1e-2) return `${sci(m, 2)} m`
  if (m < 1e3) return `${num(m, 2)} m`
  if (m < 1e9) return `${num(m / 1e3, 3)} km`
  if (m < 0.05 * LY) return `${num(m / AU, 2)} AU`
  return `${fmtCount(m / LY)} ly`
}
export function fmtMeters(m: number): string {
  return `${sci(m, 2, true)} m`
}
export function fmtEnergy(E: number): string {
  if (E < 1e-6) return `${num(E * 1e9, 2)} eV`
  if (E < 1e-3) return `${num(E * 1e6, 2)} keV`
  if (E < 1) return `${num(E * 1e3, 2)} MeV`
  if (E < 1e3) return `${num(E, 3)} GeV`
  if (E < 1e6) return `${num(E / 1e3, 3)} TeV`
  return `${sci(E, 2, true)} GeV`
}
export function fmtTime(s: number): string {
  if (s < 1e-3) return `${num(s * 1e6, 2)} µs`
  if (s < 1) return `${num(s * 1e3, 2)} ms`
  if (s < 86_400) return `${num(s, 2)} s`
  const days = s / 86_400
  if (days < 365.25) return `${num(days, 2)} days`
  const yr = days / 365.25
  return `${fmtCount(yr)} years`
}
