// The physics of chapter 02 (content/02-vibration.md § Lab › Model). Pure, allocation-free where it
// runs per frame. Units: ħ = c = 1; L = 1 is the drawn string length; masses in Mₛ = 1/√α′.

export const MODES = 6
/** Amplitude of one packet in harmonic 1, in units of L (stands in for √(2α′)). Design constant. */
export const AQ = 0.12
/** Width of the pluck bump (units of L). Design constant. */
export const W_PLUCK = 0.15
/** Visual time: ω₁ = 2π × 0.45 rad/s. */
export const OMEGA1 = 2 * Math.PI * 0.45
/** Audio fundamental (A2) — the pattern, not the mass. */
export const F0_HZ = 110
/** Assumed string scale for every GeV readout. The real value is unknown. */
export const MS_GEV = 1e18
/** Assumed string length ℓ_s = ħc/Mₛ ≈ 2×10⁻³⁴ m. */
export const LS_M = 2e-34

/** D(N): states on rung N of the 10D open superstring (bosons + fermions, one endpoint label). */
export const D = [
  16, 256, 2304, 15360, 84224, 400896, 1.71e6, 6.69e6, 2.43e7, 8.32e7, 2.7e8, 8.36e8, 2.49e9, 7.12e9, 1.98e10, 5.32e10, 1.39e11, 3.56e11, 8.88e11, 2.17e12,
  5.2e12, 1.22e13, 2.82e13, 6.42e13, 1.44e14, 3.17e14, 6.89e14, 1.48e15, 3.14e15, 6.59e15, 1.37e16, 2.8e16, 5.69e16, 1.14e17, 2.28e17, 4.5e17, 8.81e17, 1.71e18,
  3.29e18, 6.29e18, 1.19e19, 2.25e19, 4.2e19, 7.81e19, 1.44e20, 2.64e20, 4.82e20, 8.73e20, 1.57e21, 2.82e21, 5.03e21, 8.91e21, 1.57e22, 2.76e22, 4.82e22,
  8.38e22, 1.45e23, 2.5e23, 4.29e23, 7.33e23, 1.25e24, 2.11e24, 3.56e24, 5.99e24,
]

export type Packets = readonly number[] // length 6, each 0..3

/** Level N = Σ n·kₙ. */
export const level = (k: Packets) => {
  let N = 0
  for (let i = 0; i < MODES; i++) N += (i + 1) * (k[i] ?? 0)
  return N
}
/** Packets K = Σ kₙ. */
export const packetCount = (k: Packets) => {
  let K = 0
  for (let i = 0; i < MODES; i++) K += k[i] ?? 0
  return K
}
/** Aₙ = A_q·√(kₙ/n), in units of L. */
export const packetAmp = (kn: number, n: number) => AQ * Math.sqrt(kn / n)

/** "1·2 + 2·1" — the live sum behind N. */
export function levelSum(k: Packets): string {
  const parts: string[] = []
  for (let i = 0; i < MODES; i++) if (k[i]) parts.push(`${i + 1}·${k[i]}`)
  return parts.length ? parts.join(' + ') : '0'
}

const SUP: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}
export const sup = (n: number | string) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')

/** Exact with thin-space thousands below 10⁶, else "≈ 1.7 × 10⁶". */
export function fmtCount(v: number): string {
  if (v < 1e6) return Math.round(v).toLocaleString('en-US').replace(/,/g, ' ')
  const e = Math.floor(Math.log10(v))
  return `≈ ${(v / 10 ** e).toFixed(1)} × 10${sup(e)}`
}

/** Mass readout for level N. */
export function fmtMass(N: number, units: 'Ms' | 'GeV'): string {
  const m = Math.sqrt(N)
  if (units === 'Ms') return N === 0 ? '0' : `${m.toFixed(2)} Mₛ`
  return N === 0 ? '0 GeV' : `${m.toFixed(2)} × 10¹⁸ GeV`
}

// ───────────────────────── Pluck → modes → packets (Model §5) ─────────────────────────

const S = 65 // trapezoid samples
const COS = new Float64Array(MODES * S)
const SIN = new Float64Array(MODES * S)
for (let n = 1; n <= MODES; n++)
  for (let i = 0; i < S; i++) {
    COS[(n - 1) * S + i] = Math.cos(n * Math.PI * (i / (S - 1)))
    SIN[(n - 1) * S + i] = Math.sin(n * Math.PI * (i / (S - 1)))
  }
const bump = new Float64Array(S)

/**
 * Project the pull s(σ) = h·exp(−(σ−σ_p)²/2w²) on the mode basis.
 * FREE subtracts the mean first (the zero mode is motion, not vibration). Writes cₙ (units of L) into `out`
 * and returns the mean offset (FREE) or 0.
 */
export function projectPull(sp: number, h: number, pinned: boolean, out: Float64Array | number[]): number {
  let mean = 0
  for (let i = 0; i < S; i++) {
    const x = i / (S - 1)
    bump[i] = h * Math.exp(-((x - sp) ** 2) / (2 * W_PLUCK * W_PLUCK))
    mean += (i === 0 || i === S - 1 ? 0.5 : 1) * bump[i]
  }
  mean /= S - 1
  if (pinned) mean = 0
  const T = pinned ? SIN : COS
  for (let n = 0; n < MODES; n++) {
    let a = 0
    for (let i = 0; i < S; i++) a += (i === 0 || i === S - 1 ? 0.5 : 1) * (bump[i] - mean) * T[n * S + i]
    out[n] = (2 * a) / (S - 1)
  }
  return mean
}

/** On release (FREE): kₙ = min(3, round(n·cₙ²/A_q²)). */
export function packetsFrom(c: ArrayLike<number>): number[] {
  const k: number[] = []
  for (let n = 1; n <= MODES; n++) k.push(Math.min(3, Math.round((n * c[n - 1] * c[n - 1]) / (AQ * AQ))))
  return k
}

/** Classical guitar (PINNED) decay: τₙ = 3.0 s/√n. */
export const tauPinned = (n: number) => 3.0 / Math.sqrt(n)

/** Pinned triangle pluck at p (height 1): cₙ = 2 sin(nπp) / (n²π² p(1−p)). */
export const trianglePluck = (n: number, p: number) => (2 * Math.sin(n * Math.PI * p)) / (n * n * Math.PI * Math.PI * p * (1 - p))

/** Fixed pseudo-random phases per state (seeded by the state vector). */
export function statePhases(k: Packets, out: Float64Array | number[]) {
  let seed = 7
  for (let i = 0; i < MODES; i++) seed = (seed * 31 + (k[i] ?? 0) * 7 + i) | 0
  for (let i = 0; i < MODES; i++) {
    const s = Math.sin((seed + i * 97.13) * 12.9898) * 43758.5453
    out[i] = (s - Math.floor(s)) * Math.PI * 2
  }
}

// ───────────────────────── Measured particles (PDG 2026; m/Mₛ assumes Mₛ = 10¹⁸ GeV) ─────────────────────────

export type CardKind = 'F' | 'N' | 'V' | 'G' | 'W' | 'H' | 'Grav'
export interface Particle {
  id: string
  sym: string
  /** subscript (neutrino flavours) */
  sub?: string
  name: string
  mass: string
  spin: string
  charge: string
  /** m/Mₛ (0 = massless; for neutrinos an upper limit) */
  ratio: number
  upper?: boolean
  card: CardKind
  /** Standard-Model table slot: [col, row] */
  slot: [number, number]
}

export const PARTICLES: Particle[] = [
  {
    id: 'u',
    sym: 'u',
    name: 'up quark',
    mass: '2.16 MeV*',
    spin: '½',
    charge: '+⅔',
    ratio: 2.2e-21,
    card: 'F',
    slot: [0, 0],
  },
  {
    id: 'c',
    sym: 'c',
    name: 'charm quark',
    mass: '1.273 GeV*',
    spin: '½',
    charge: '+⅔',
    ratio: 1.3e-18,
    card: 'F',
    slot: [1, 0],
  },
  {
    id: 't',
    sym: 't',
    name: 'top quark',
    mass: '172.60 GeV',
    spin: '½',
    charge: '+⅔',
    ratio: 1.7e-16,
    card: 'F',
    slot: [2, 0],
  },
  {
    id: 'd',
    sym: 'd',
    name: 'down quark',
    mass: '4.70 MeV*',
    spin: '½',
    charge: '−⅓',
    ratio: 4.7e-21,
    card: 'F',
    slot: [0, 1],
  },
  {
    id: 's',
    sym: 's',
    name: 'strange quark',
    mass: '92.9 MeV*',
    spin: '½',
    charge: '−⅓',
    ratio: 9.3e-20,
    card: 'F',
    slot: [1, 1],
  },
  {
    id: 'b',
    sym: 'b',
    name: 'bottom quark',
    mass: '4.186 GeV*',
    spin: '½',
    charge: '−⅓',
    ratio: 4.2e-18,
    card: 'F',
    slot: [2, 1],
  },
  {
    id: 'e',
    sym: 'e',
    name: 'electron',
    mass: '0.511 MeV',
    spin: '½',
    charge: '−1',
    ratio: 5.1e-22,
    card: 'F',
    slot: [0, 2],
  },
  {
    id: 'mu',
    sym: 'μ',
    name: 'muon',
    mass: '105.66 MeV',
    spin: '½',
    charge: '−1',
    ratio: 1.1e-19,
    card: 'F',
    slot: [1, 2],
  },
  {
    id: 'tau',
    sym: 'τ',
    name: 'tau',
    mass: '1.777 GeV',
    spin: '½',
    charge: '−1',
    ratio: 1.8e-18,
    card: 'F',
    slot: [2, 2],
  },
  {
    id: 'nue',
    sym: 'ν',
    sub: 'e',
    name: 'electron neutrino',
    mass: '< 0.45 eV†',
    spin: '½',
    charge: '0',
    ratio: 4.5e-28,
    upper: true,
    card: 'N',
    slot: [0, 3],
  },
  {
    id: 'num',
    sym: 'ν',
    sub: 'μ',
    name: 'muon neutrino',
    mass: '< 0.45 eV†',
    spin: '½',
    charge: '0',
    ratio: 4.5e-28,
    upper: true,
    card: 'N',
    slot: [1, 3],
  },
  {
    id: 'nut',
    sym: 'ν',
    sub: 'τ',
    name: 'tau neutrino',
    mass: '< 0.45 eV†',
    spin: '½',
    charge: '0',
    ratio: 4.5e-28,
    upper: true,
    card: 'N',
    slot: [2, 3],
  },
  {
    id: 'g',
    sym: 'g',
    name: 'gluon',
    mass: '0 (theory)',
    spin: '1',
    charge: '0 (carries colour)',
    ratio: 0,
    card: 'G',
    slot: [3, 0],
  },
  {
    id: 'gamma',
    sym: 'γ',
    name: 'photon',
    mass: '0 (< 10⁻¹⁸ eV)',
    spin: '1',
    charge: '0',
    ratio: 0,
    card: 'V',
    slot: [3, 1],
  },
  {
    id: 'Z',
    sym: 'Z',
    name: 'Z boson',
    mass: '91.19 GeV',
    spin: '1',
    charge: '0',
    ratio: 9.1e-17,
    card: 'W',
    slot: [3, 2],
  },
  {
    id: 'W',
    sym: 'W',
    name: 'W boson',
    mass: '80.36 GeV',
    spin: '1',
    charge: '±1',
    ratio: 8.0e-17,
    card: 'W',
    slot: [3, 3],
  },
  {
    id: 'H',
    sym: 'H',
    name: 'Higgs boson',
    mass: '125.13 GeV',
    spin: '0',
    charge: '0',
    ratio: 1.3e-16,
    card: 'H',
    slot: [4, 0],
  },
]
export const GRAVITON: Particle = {
  id: 'grav',
  sym: 'G',
  name: 'graviton (hypothetical)',
  mass: '0 (expected; < 1.76×10⁻²³ eV)',
  spin: '2',
  charge: '0',
  ratio: 0,
  card: 'Grav',
  slot: [4, 2],
}

export const CARD_TEXT: Record<CardKind, string> = {
  F: 'Spin ½: from the string’s fermionic side. Why three families? In some models, the hidden shape’s topology (Ch. 6).',
  N: 'Spin ½, lightest known matter. Oscillations prove it has mass; only an upper limit on how much.',
  V: 'Spin 1, massless: a bottom-rung state whose polarization is the wiggle direction, as on this bench.',
  G: 'Spin 1. In brane models, a string with both ends on a stack of three branes (Ch. 7).',
  W: 'Spin 1, bottom rung. Its 80–91 GeV mass would switch on at low energy, through the Higgs mechanism.',
  H: 'Spin 0: in some models, a wiggle pointing into hidden dimensions. Why it’s so light is unsolved.',
  Grav: 'Not in the Standard Model; never detected as a particle. Closed strings always include a massless spin-2 state (Ch. 4).',
}

/** The five catalogue states of Beat 4 (and their loupe states). */
export const CATALOGUE = [
  { key: 'A', k: [0, 0, 0, 0, 0, 0], card: 'MASS 0 · SPIN 1ħ' },
  { key: 'B', k: [1, 0, 0, 0, 0, 0], card: 'MASS 1 Mₛ · SPIN ≤ 2ħ' },
  { key: 'C', k: [2, 0, 0, 0, 0, 0], card: 'MASS 1.41 Mₛ · SPIN ≤ 3ħ' },
  { key: 'D', k: [0, 1, 0, 0, 0, 0], card: 'MASS 1.41 Mₛ · SPIN ≤ 2ħ' },
  { key: 'E', k: [1, 0, 1, 0, 0, 0], card: 'MASS 2 Mₛ · SPIN ≤ 3ħ' },
] as const
