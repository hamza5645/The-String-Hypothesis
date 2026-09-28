import { ECHO_N, survivorS } from '../constants'
import { C_FIELD, C_INK, type HairLinesApi } from './HairLines'

/*
 * The hidden circle and its wave (content pack · FIT model, ~ANALOGY drawing of a faithful rule).
 *   echo laps  r_j(θ) = R·[1 + a·cos(kθ + 2πkj − Ωt)],  j = 0…7
 *   survivor   r(θ)   = R·[1 + a·S(k)·cos(kθ + π(N−1)k − Ωt)],  S(k) = sin(Nπk)/(N sin πk)
 *   k = 0      a uniform glow (no motion around the circle: the ordinary particle)
 *   seam       a gap at θ = 0 of size ∝ |k − round(k)|
 * Display only (the formulas are unchanged): the laps are drawn as one coil winding outward — lap j at
 * radius R·(1 + LAP_DR·j), continuous from lap to lap, because the wave simply keeps going round. Each
 * lap carries a tick at every crest. At whole k every lap repeats the last: the ticks line up into
 * spokes and the coil tightens onto the circle. Otherwise the ticks fan out (the laps disagree and
 * average away), and a bright jump at θ = 0 shows lap 0's head missing its own tail.
 * Drawn in the plane spanned by (1,0,0),(0,1,0) around (cx, cy, cz).
 */

export const KK_A = 0.08
export const KK_OMEGA = 1.5
/** Radial step between successive echo laps (fraction of R) when the wave doesn't fit. */
export const LAP_DR = 0.045
/** Outermost extent of the drawing (fraction of R): the last lap's crests. */
export const KK_EXTENT = (1 + LAP_DR * ECHO_N) * (1 + KK_A)

export interface KKDraw {
  cx: number
  cy: number
  cz: number
  R: number
  k: number
  /** Ωt (0 under reduced motion). */
  phase: number
  alpha: number
  /** echo-lap visibility multiplier. */
  echo?: number
  /** base-circle (Field) visibility multiplier. */
  base?: number
  seg?: number
  /** Pixel width of the wave. */
  w?: number
}

const TAU = Math.PI * 2

export function drawKK(L: HairLinesApi, o: KKDraw) {
  const { cx, cy, cz, R, k, phase, alpha } = o
  const seg = o.seg ?? 160
  const echo = (o.echo ?? 1) * alpha
  const base = (o.base ?? 1) * alpha
  const F = C_FIELD
  const I = C_INK
  // base circle (the hidden direction itself)
  let px = cx + R
  let py = cy
  for (let i = 1; i <= 120; i++) {
    const th = (TAU * i) / 120
    const qx = cx + R * Math.cos(th)
    const qy = cy + R * Math.sin(th)
    L.seg(px, py, cz, qx, qy, cz, F[0], F[1], F[2], 0.62 * base, 1.5)
    px = qx
    py = qy
  }
  const dev = Math.abs(k - Math.round(k))
  const zero = 1 - Math.min(1, Math.max(0, (k - 0.015) / 0.22)) // k ≈ 0: uniform glow
  const waveA = alpha * (1 - zero)
  if (zero > 0.001) {
    // ordinary particle: no motion around the circle — a quiet uniform glow
    const pulse = 0.85 + 0.15 * Math.sin(phase * 0.7)
    for (let i = 0; i < 120; i++) {
      const a0 = (TAU * i) / 120
      const a1 = (TAU * (i + 1)) / 120
      const r = R * (1 + 0.012)
      L.seg(cx + r * Math.cos(a0), cy + r * Math.sin(a0), cz, cx + r * Math.cos(a1), cy + r * Math.sin(a1), cz, I[0], I[1], I[2], 0.1 * zero * alpha * pulse, 9)
      L.seg(cx + r * Math.cos(a0), cy + r * Math.sin(a0), cz, cx + r * Math.cos(a1), cy + r * Math.sin(a1), cz, I[0], I[1], I[2], 0.85 * zero * alpha * pulse, 1.6)
    }
  }
  if (waveA <= 0.001) return
  const lock = 1 - Math.min(1, dev / 0.05)

  // ── echo laps: one coil winding outward (the misfit opens it; at whole k it tightens onto the circle) ──
  const ea = echo * (1 - zero)
  if (ea > 0.001) {
    const miss = Math.min(1, dev / 0.12)
    const dr = LAP_DR * (0.3 + 0.7 * miss * (2 - miss))
    const ls = Math.max(48, Math.round(seg * 0.75))
    for (let j = 0; j < ECHO_N; j++) {
      const la = (j === 0 ? 0.35 : 0.12) * ea * (0.55 + 0.45 * (1 - lock))
      let ex = 0
      let ey = 0
      for (let i = 0; i <= ls; i++) {
        const th = (TAU * i) / ls
        const r = R * (1 + dr * (j + i / ls)) * (1 + KK_A * Math.cos(k * (th + TAU * j) - phase))
        const qx = cx + r * Math.cos(th)
        const qy = cy + r * Math.sin(th)
        if (i > 0) L.seg(ex, ey, cz, qx, qy, cz, I[0], I[1], I[2], la, 1)
        ex = qx
        ey = qy
      }
      // a tick at every crest of this lap: phase k(θ + 2πj) − Ωt = 2πm
      if (k > 0.05) {
        const ta = ea * (0.5 + 0.2 * lock)
        const m0 = Math.ceil((k * TAU * j - phase) / TAU)
        const m1 = Math.floor((k * TAU * (j + 1) - phase) / TAU)
        for (let m = m0; m <= m1; m++) {
          const th = (TAU * m + phase) / k - TAU * j
          if (th < 0 || th >= TAU) continue
          const r0 = R * (1 + dr * (j + th / TAU)) * (1 + KK_A) * 1.01
          const r1 = r0 + R * Math.max(0.06, dr * 1.1)
          const c = Math.cos(th)
          const s = Math.sin(th)
          L.seg(cx + r0 * c, cy + r0 * s, cz, cx + r1 * c, cy + r1 * s, cz, I[0], I[1], I[2], ta, 1.2)
        }
      }
    }
  }

  // ── survivor wave (the laps' average) on the base circle, with the seam gap ──
  const S = survivorS(k)
  const off = Math.PI * (ECHO_N - 1) * k - phase
  const gap = Math.min(0.9, 1.6 * dev)
  const th0 = gap
  const th1 = TAU - gap
  const w = (o.w ?? 1.6) * (1 + 0.35 * lock)
  let sx = 0
  let sy = 0
  for (let i = 0; i <= seg; i++) {
    const th = th0 + ((th1 - th0) * i) / seg
    const r = R * (1 + KK_A * S * Math.cos(k * th + off))
    const qx = cx + r * Math.cos(th)
    const qy = cy + r * Math.sin(th)
    if (i > 0) {
      L.seg(sx, sy, cz, qx, qy, cz, I[0], I[1], I[2], waveA * (0.7 + 0.3 * lock), w)
      L.seg(sx, sy, cz, qx, qy, cz, I[0], I[1], I[2], waveA * 0.08 * (0.4 + lock), 7)
    }
    sx = qx
    sy = qy
  }
  // the two loose ends at the seam
  if (gap > 0.01) {
    for (const th of [th0, th1]) {
      const r = R * (1 + KK_A * S * Math.cos(k * th + off))
      const ex = cx + r * Math.cos(th)
      const ey = cy + r * Math.sin(th)
      const nx = Math.cos(th) * R * 0.035
      const ny = Math.sin(th) * R * 0.035
      L.seg(ex - nx, ey - ny, cz, ex + nx, ey + ny, cz, I[0], I[1], I[2], waveA, 2.4)
    }
  }
  // the jump at θ = 0: lap 0 starts at R(1 + a·cos Ωt) but comes round to R(1 + a·cos(2πk − Ωt))
  if (dev > 0.01) {
    const ja = waveA * Math.min(1, dev / 0.05)
    const rh = R * (1 + KK_A * Math.cos(-phase))
    const rt = R * (1 + KK_A * Math.cos(TAU * k - phase))
    const lo = Math.min(rh, rt) - R * 0.012
    const hi = Math.max(rh, rt) + R * 0.012
    L.seg(cx + lo, cy, cz, cx + hi, cy, cz, I[0], I[1], I[2], ja, 2.2)
    for (const rr of [rh, rt]) L.seg(cx + rr, cy - R * 0.03, cz, cx + rr, cy + R * 0.03, cz, I[0], I[1], I[2], ja, 1.6)
  }
  // crest ticks on the survivor once the wave locks: count them — n whole wavelengths
  // (with the echo laps drawn, their aligned ticks already form these spokes)
  const ct = waveA * lock * 0.9 * (1 - Math.min(1, 3 * (o.echo ?? 1)))
  if (ct > 0.001 && k > 0.5) {
    const nC = Math.round(k)
    for (let m = 0; m < nC; m++) {
      // the survivor is S·cos(kθ + off): its crests sit where that phase is 0 (S > 0) or π (S < 0)
      let th = (TAU * m + (S < 0 ? Math.PI : 0) - off) / k
      th = ((th % TAU) + TAU) % TAU
      const r0 = R * (1 + KK_A * Math.abs(S)) * 1.035
      const r1 = r0 + R * 0.07
      const c = Math.cos(th)
      const si = Math.sin(th)
      L.seg(cx + r0 * c, cy + r0 * si, cz, cx + r1 * c, cy + r1 * si, cz, I[0], I[1], I[2], ct, 1.4)
    }
  }
}
