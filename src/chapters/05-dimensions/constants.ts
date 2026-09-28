/*
 * Chapter 05 · Dimensions — shared constants: scroll steps, physics numbers (content/05-dimensions.md
 * § Numbers & facts), formatting, and the exact model formulas used by both the Scene and the Overlay.
 */

/** Overlay steps in scroll order. The Scene reads them to build one continuous "beat time" T. */
export const STEPS = [
  { id: 'title', len: 1.1 },
  { id: 'opening', len: 1.35 },
  { id: 'sweep', len: 1.8 },
  { id: 'cable', len: 1.6 },
  { id: 'lattice', len: 1.5 },
  { id: 'klein', len: 1.05 },
  { id: 'fit', len: 1.9 },
  { id: 'aha', len: 1.35 },
  { id: 'count', len: 1.6 },
  { id: 'bounds', len: 1.6 },
  { id: 'lab', len: 2.4 },
  { id: 'exit', len: 1.1 },
] as const
export type StepId = (typeof STEPS)[number]['id']
export const STEP_LEN = Object.fromEntries(STEPS.map((s) => [s.id, s.len])) as Record<StepId, number>
/** Beat time index of each step: T = index + local step progress. */
export const TI = Object.fromEntries(STEPS.map((s, i) => [s.id, i])) as Record<StepId, number>
/** T at chapter progress 0 (the viewport centre sits half a viewport into the title step). */
export const T_START = 0.5 / STEP_LEN.title
/** T at chapter progress 1. */
export const T_END = TI.exit + 1 - 0.5 / STEP_LEN.exit

/* ─────────────── physics (refereed pack) ─────────────── */

/** ħc in eV·m, exact in the 2019 SI (= 197.327 MeV·fm). */
export const HBARC = 1.973269804e-7
export const LHC_EV = 1.36e13
export const PLANCK_L = 1.616255e-35
export const PLANCK_E = 1.22e28
export const PROTON_R = 8.41e-16
export const BOHR = 5.29177e-11
export const GAP_52 = 52e-6
export const KLEIN_R = 1e-33
export const E_ELECTRON = 5.11e5
export const E_PROTON = 9.38e8

/** FIT slider log mapping: u ∈ [0,1] → R = 10^(−34.79 + 31.79u) m. */
export const R_MIN = Math.pow(10, -34.79)
export const R_MAX = 1e-3
export const R_DEFAULT = 1e-20
export const uOfR = (R: number) => (Math.log10(R) + 34.79) / 31.79

/** Collider shading (universal extra dimensions): 1/R ≈ 1.4–1.8 TeV. */
export const R_UED_START = HBARC / 1.8e12 // ≈ 1.1e-19 m (gradient starts)
export const R_UED_FULL = HBARC / 1.4e12 // ≈ 1.4e-19 m (full strength)
/** Torsion balance, one gravity-only extra dimension (Lee et al. 2020 via PDG): R > 30 µm excluded. */
export const R_GRAV = 30e-6

/** Echo-lap heuristic: survivor amplitude S(k) = sin(Nπk)/(N sin πk), N = 8 (0/0 guarded). */
export const ECHO_N = 8
export function survivorS(k: number) {
  const s = Math.sin(Math.PI * k)
  if (Math.abs(s) < 1e-6) {
    // limit at integers: S = cos(Nπk)/cos(πk) = (−1)^{(N−1)k}
    const n = Math.round(k)
    return (ECHO_N - 1) * n % 2 === 0 ? 1 : -1
  }
  return Math.sin(ECHO_N * Math.PI * k) / (ECHO_N * s)
}

/** Gravity-only circle: force ratio F/F_Newton for x = r/R (sum over graviton rungs, radion ignored). */
export function forceRatio(x: number) {
  if (x > 60) return 1
  const e = Math.exp(x)
  const em1 = Math.expm1(x)
  return 1 + (8 / 3) * (1 / em1 + (x * e) / (em1 * em1))
}
/** Potential ratio V/V_Newton = 1 + (8/3)/(e^{r/R} − 1). */
export function potentialRatio(x: number) {
  if (x > 60) return 1
  return 1 + 8 / 3 / Math.expm1(x)
}

/* ─────────────── formatting ─────────────── */

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const sup = (n: number | string) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')

/** "1.6 × 10⁻³⁵" (mantissa digits = sig). */
export function sciText(v: number, sig = 2) {
  if (!isFinite(v) || v === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(v)) + 1e-9)
  const m = v / Math.pow(10, e)
  let ms = m.toFixed(Math.max(0, sig - 1))
  if (Number(ms) >= 10) return sciText(v * 1.0000001, sig)
  if (sig > 1) ms = ms.replace(/\.?0+$/, '')
  return ms === '1' ? `10${sup(e)}` : `${ms} × 10${sup(e)}`
}

/** Length in metres, auto-ranged: fm/pm/nm/µm/mm/m below 1e-15 → scientific. */
export function formatLength(R: number) {
  const units: [number, string][] = [
    [1, 'm'],
    [1e-3, 'mm'],
    [1e-6, 'µm'],
    [1e-9, 'nm'],
    [1e-12, 'pm'],
    [1e-15, 'fm'],
  ]
  if (R >= 1e-15 && R < 10) {
    for (const [s, u] of units) {
      if (R >= s * 0.9999) {
        const v = R / s
        return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${u}`
      }
    }
  }
  return `${sciText(R, 2)} m`
}

/** Energy in eV, auto-ranged meV…TeV; above 10³ TeV written as "x × 10^y GeV". */
export function formatEnergy(E: number) {
  if (E >= 1e15) return `${sciText(E / 1e9, 2)} GeV`
  const units: [number, string][] = [
    [1e12, 'TeV'],
    [1e9, 'GeV'],
    [1e6, 'MeV'],
    [1e3, 'keV'],
    [1, 'eV'],
    [1e-3, 'meV'],
  ]
  for (const [s, u] of units) {
    if (E >= s * 0.9995) {
      const v = E / s
      return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${u}`
    }
  }
  if (E >= 1e-6) return `${(E / 1e-3).toFixed(3)} meV`
  return `${sciText(E, 2)} eV`
}

/** Size comparison against the nearest (in log) of four reference lengths. */
const REFS: [number, string][] = [
  [PLANCK_L, 'Planck length'],
  [PROTON_R, 'proton radius'],
  [BOHR, 'Bohr radius'],
  [GAP_52, 'torsion gap (52 µm)'],
]
export function sizeComparison(R: number) {
  let best = REFS[0]
  let bd = Infinity
  for (const r of REFS) {
    const d = Math.abs(Math.log10(R / r[0]))
    if (d < bd) {
      bd = d
      best = r
    }
  }
  const ratio = R / best[0]
  if (ratio > 0.95 && ratio < 1.05) return `≈ the ${best[1]}`
  const f = ratio >= 1 ? ratio : 1 / ratio
  const fs = f < 100 ? (f < 10 ? f.toFixed(1) : f.toFixed(0)) : sciText(f, 1)
  return `${fs}× ${ratio >= 1 ? 'larger' : 'smaller'} than the ${best[1]}`
}

/** Rungs strictly below the LHC collision energy for a massless 5D particle: floor(E_LHC / E₁). */
export const rungsBelow = (R: number) => Math.floor(LHC_EV / (HBARC / R))
