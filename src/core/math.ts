// Small, allocation-free math helpers shared by scenes and UI.

export const TAU = Math.PI * 2

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const invLerp = (a: number, b: number, x: number) => (b === a ? 0 : (x - a) / (b - a))

/** Map x from [a,b] to [0,1], clamped. */
export const range = (x: number, a: number, b: number) => clamp01(invLerp(a, b, x))

/** Map x from [a0,a1] to [b0,b1] (unclamped). */
export const remap = (x: number, a0: number, a1: number, b0: number, b1: number) =>
  b0 + ((x - a0) * (b1 - b0)) / (a1 - a0)

export const smoothstep = (a: number, b: number, x: number) => {
  const t = range(x, a, b)
  return t * t * (3 - 2 * t)
}

export const smootherstep = (a: number, b: number, x: number) => {
  const t = range(x, a, b)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInCubic = (t: number) => t * t * t
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Frame-rate independent exponential smoothing. lambda ~ 1/time-constant (e.g. 6 → ~0.17s). */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Window of x inside [a,b] that rises over `fade` then falls over `fade`. */
export const window01 = (x: number, a: number, b: number, fade = 0.1) =>
  smoothstep(a, a + fade, x) * (1 - smoothstep(b - fade, b, x))

/** Logarithmic interpolation between two positive numbers. */
export const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t))

/** Deterministic hash → [0,1). Use instead of Math.random() for reproducible layouts. */
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return s - Math.floor(s)
}

/** Seeded PRNG (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Format a length in meters as "1.6 × 10⁻³⁵ m" style text. */
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const superscript = (s: string | number) =>
  String(s)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')

export function sci(value: number, digits = 2, unit = ''): string {
  if (!isFinite(value) || value === 0) return `0${unit ? ' ' + unit : ''}`
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const mant = value / Math.pow(10, exp)
  const u = unit ? ' ' + unit : ''
  if (exp >= -2 && exp <= 3) {
    return `${value.toPrecision(digits)}${u}`
  }
  const m = mant.toFixed(Math.max(0, digits - 1))
  return `${m === '1' || m === '1.0' ? '' : m + ' × '}10${superscript(exp)}${u}`
}

/** "10⁻³⁵ m" — order of magnitude only. */
export function orderOf(value: number, unit = 'm'): string {
  const exp = Math.round(Math.log10(Math.abs(value)))
  return `10${superscript(exp)} ${unit}`.trim()
}
