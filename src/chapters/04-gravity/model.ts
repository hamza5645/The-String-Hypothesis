/*
 * Chapter 04 · Gravity — the physics model (content/04-gravity.md § Lab › Model). Pure, allocation-free.
 *
 * Transverse plane (x, y); the wave travels along +z (toward the camera).
 * Particle k at rest position x_k moves to  x_k + ½ H(t) x_k + v(t):
 *   spin 2, linear    H = A cos φ · ε(ψ),                 ε(ψ) = [[cos 2ψ, sin 2ψ],[sin 2ψ, −cos 2ψ]]
 *   spin 2, circular  H = A [cos φ ε(ψ) + sin φ ε(ψ+45°)] = A ε(ψ + φ/2)
 *   spin 1, linear    v = ½ A R cos φ · e(ψ),              e(ψ) = (cos ψ, sin ψ)
 *   spin 1, circular  v = ½ A R [cos φ e(ψ) + sin φ e(ψ+90°)] = ½ A R e(ψ + φ)
 *   spin 0            H = A cos φ · I
 * Spin 2 linear is linearized GR in TT gauge: h₊ = A cos φ cos 2ψ, h× = A cos φ sin 2ψ.
 */

export type Spin = 0 | 1 | 2

/** Mutable wave state: H = [[h00, h01],[h01, h11]], v = (vx, vy). */
export interface Wave {
  h00: number
  h01: number
  h11: number
  vx: number
  vy: number
}

export const makeWave = (): Wave => ({ h00: 0, h01: 0, h11: 0, vx: 0, vy: 0 })

export function waveState(out: Wave, spin: Spin, circular: boolean, psi: number, A: number, phi: number, R: number) {
  out.h00 = out.h01 = out.h11 = out.vx = out.vy = 0
  if (spin === 2) {
    if (circular) {
      out.h00 = A * Math.cos(2 * psi + phi)
      out.h01 = A * Math.sin(2 * psi + phi)
    } else {
      const c = A * Math.cos(phi)
      out.h00 = c * Math.cos(2 * psi)
      out.h01 = c * Math.sin(2 * psi)
    }
    out.h11 = -out.h00
  } else if (spin === 1) {
    const a = 0.5 * A * R
    if (circular) {
      out.vx = a * Math.cos(psi + phi)
      out.vy = a * Math.sin(psi + phi)
    } else {
      out.vx = a * Math.cos(phi) * Math.cos(psi)
      out.vy = a * Math.cos(phi) * Math.sin(psi)
    }
  } else {
    out.h00 = out.h11 = A * Math.cos(phi)
  }
  return out
}

/** Blend two wave states (for scroll cross-fades). */
export function mixWave(out: Wave, a: Wave, b: Wave, k: number) {
  out.h00 = a.h00 + (b.h00 - a.h00) * k
  out.h01 = a.h01 + (b.h01 - a.h01) * k
  out.h11 = a.h11 + (b.h11 - a.h11) * k
  out.vx = a.vx + (b.vx - a.vx) * k
  out.vy = a.vy + (b.vy - a.vy) * k
  return out
}

/** Displace a rest point (x, y) (relative to the ring centre): writes into o[0], o[1]. */
export function displace(w: Wave, x: number, y: number, o: Float32Array | number[], scale = 1) {
  o[0] = x + scale * (0.5 * (w.h00 * x + w.h01 * y) + w.vx)
  o[1] = y + scale * (0.5 * (w.h01 * x + w.h11 * y) + w.vy)
}

/** Match meter: overlap of the rotated linear pattern with the unrotated ghost. M(ψ) = cos(sψ); 1 for s = 0. */
export const matchM = (spin: Spin, psi: number) => (spin === 0 ? 1 : Math.cos(spin * psi))

export type MatchState = 'same' | 'half' | 'other' | null
export function matchState(M: number): MatchState {
  if (M >= 0.995) return 'same'
  if (M <= -0.995) return 'half'
  if (Math.abs(M) <= 0.05) return 'other'
  return null
}

/** Pattern tile entries for the DOM tile (2 decimals, "−0" normalised). */
export const fmt2 = (x: number) => {
  const r = Math.round(x * 100) / 100
  const s = (Object.is(r, -0) ? 0 : r).toFixed(2)
  return s.startsWith('-') ? '−' + s.slice(1) : s
}

/* ─────────────── Beat 3 · schematic couplings vs energy (log–log) ─────────────── */

export const E_PLANCK = 1.220890e19 // GeV
export const M_Z = 91.1879
export const M_W = 80.3625
export const HBARC_GEV_M = 1.97327e-16 // ħc in GeV·m
export const LHC_E = 1.36e4 // GeV (13.6 TeV)

/** Electromagnetism: 1/α runs from 137.036 (low energy) to 128 at M_Z, logarithmically (schematic). */
export function alphaEM(E: number) {
  const me = 0.000511
  const k = (137.036 - 128) / Math.log(M_Z / me)
  return 1 / (137.036 - k * Math.log(Math.max(E, me) / me))
}
/** Strong: one-loop α_s with n_f = 5 throughout (schematic), from 2 GeV. */
export const alphaS = (E: number) => 0.118 / (1 + 0.118 * (23 / (12 * Math.PI)) * Math.log((E * E) / (M_Z * M_Z)))
/** Weak, effective: α_W (E/M_W)² below M_W, then α_W ≈ 1/30. */
export const ALPHA_W = 1 / 30
export const alphaWeak = (E: number) => (E < M_W ? ALPHA_W * (E / M_W) ** 2 : ALPHA_W)
/** Gravity: dimensional estimate (E/E_P)². */
export const alphaG = (E: number) => (E / E_PLANCK) ** 2

/** Beat 3 cursor: log10(E/GeV) as a function of the beat's local progress. Shared with index.ts (gauge). */
export const cursorLogE = (p: number) => {
  const t = Math.min(1, Math.max(0, (p - 0.1) / (0.62 - 0.1)))
  const s = t * t * (3 - 2 * t)
  return s * Math.log10(E_PLANCK)
}

/* ─────────────── Audio · Newtonian chirp (leading order) ─────────────── */

/** f(τ) = f₀ (1 − τ/τ_c)^(−3/8), f₀ = 35 Hz, τ_c = 0.201 s; stops at 250 Hz (τ ≈ 0.2 s). */
export const CHIRP = { f0: 35, tc: 0.201, fEnd: 250 }
export const chirpF = (tau: number, f0 = CHIRP.f0, tc = CHIRP.tc) => f0 * Math.pow(Math.max(1e-6, 1 - tau / tc), -3 / 8)
/** τ at which f reaches fEnd. */
export const chirpEnd = (f0 = CHIRP.f0, tc = CHIRP.tc, fEnd = CHIRP.fEnd) => tc * (1 - Math.pow(fEnd / f0, -8 / 3))
