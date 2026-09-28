/*
 * Chapter 11 · the pack's Model (content/11-knowledge.md § Lab Model), as pure functions.
 * Shared by the Overlay (readouts, referee) and the Scene. No three.js here.
 */
import { clamp, easeInOutCubic, smoothstep } from '@/core/math'

/** Step ids and lengths (viewports). Title is longer than the pack's 1.1 because progress 0
 *  already sits 0.5 viewport into it; the crane needs real scroll after the handoff frame. */
export const STEPS = {
  title: 1.6,
  ground: 1.25,
  scaffold: 1.35,
  // count and hologram run their last phase while the text is still pinned (sticky until p ≈ (len − 0.5)/len)
  count: 1.9,
  hologram: 1.75,
  fog: 1.3,
  demand: 1.6,
  lab: 2.4,
  unseen: 1.15,
  verdict: 1.05,
  pluck: 1.4,
  rest: 1.0,
} as const
export type StepId = keyof typeof STEPS

/** Chapter progress at which the title step's local progress equals p (title is first). */
export const TITLE_P0 = 0.5 / STEPS.title

// ── §3 Evidence ceiling ──
/** Middle of each tier's height band (token start heights, §5). */
export const TIER_MID = [0.15, 1.9, 3.35, 5.25]
/** Guide-ring heights (tier 0 = the ground). */
export const RING_Y = [0, 1.9, 3.35, 5.25]
export const RING_R = 4.6
const DETENT_Y = [0.8, 2.7, 4.05, 6.8]

/** y_c(L) = interp(L; [0,1,2,3] → [0.80, 2.70, 4.05, 6.80]) */
export function ceilY(L: number) {
  const l = clamp(L, 0, 3)
  const k = Math.min(2, Math.floor(l))
  const f = l - k
  return DETENT_Y[k] + (DETENT_Y[k + 1] - DETENT_Y[k]) * f
}

/** a(y_ref) = 1 − smoothstep(y_c − 0.12, y_c + 0.12, y_ref) */
export const visAt = (yc: number, y: number) => 1 - smoothstep(yc - 0.12, yc + 0.12, y)

/** Scroll-driven descent in B6: plateau at each detent for the first and last 20% of each third. */
export function demandL(p: number) {
  const q = clamp((p - 0.1) / 0.75, 0, 1)
  const k = Math.min(Math.floor(3 * q), 2)
  const f = easeInOutCubic(clamp((3 * q - k - 0.2) / 0.6, 0, 1))
  return 3 - (k + f)
}

// ── §7 Strominger–Vafa, leading order ──
export const Q1 = 4
export const Q5 = 5
export const N_MAX = 30
/** S(N) = 2π√(Q₁Q₅N) — the leading-order ln Ω */
export const svS = (N: number) => 2 * Math.PI * Math.sqrt(Q1 * Q5 * N)
export const S_MAX = svS(N_MAX) // 153.906
/** k = round(S / ln 10), for the "Ω ~ 10^k" display */
export const omegaExp = (S: number) => Math.round(S / Math.LN10)
/** Drawn horizon radius (cartoon mapping): R_vis = 0.55·√(S/153.906), so drawn area ∝ S. */
export const horizonR = (S: number) => 0.55 * Math.sqrt(Math.max(0, S) / S_MAX)

// ── §8 Poincaré disk ──
/** Footprint rule θ(r) = π/2 − 2·arctan(r): a geodesic ending at φ ± θ reaches down to radius r. */
export const footprint = (r: number) => Math.PI / 2 - 2 * Math.atan(r)

// ── §5 Referee ──
export type Verdict = 'agreed' | 'too-sure' | 'firmer'
export const verdictOf = (chosen: number, truth: number): Verdict => (chosen === truth ? 'agreed' : chosen < truth ? 'too-sure' : 'firmer')
export const VERDICT_TEXT: Record<Verdict, string> = { agreed: 'Agreed.', 'too-sure': 'Too sure.', firmer: 'Firmer than that.' }

// ── superscripts for readouts ──
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export const sup = (n: number | string) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')
