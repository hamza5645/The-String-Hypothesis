/*
 * Synthesized GW150914-like chirp (content pack § Lab › Audio). Leading-order (Newtonian) inspiral:
 *   f(τ) = f₀ (1 − τ/τ_c)^(−3/8), f₀ = 35 Hz, τ_c = 0.201 s, stopping at 250 Hz (τ ≈ 0.2 s);
 *   amplitude ∝ f^(2/3); phase = 2π ∫ f dτ; then a 30 ms exponential fade (an audio convenience —
 *   the real ring-down damped in ≈ 4 ms). Not the recorded data. Plays only on an explicit button press.
 */
import { CHIRP, chirpEnd, chirpF } from './model'

let ctx: AudioContext | null = null

export function playChirp(pitch4: boolean) {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
  } catch {
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const sr = ctx.sampleRate
  const mult = pitch4 ? 4 : 1
  const tEnd = chirpEnd()
  const fade = 0.03
  const n = Math.ceil((tEnd + fade) * sr)
  const buf = ctx.createBuffer(1, n, sr)
  const d = buf.getChannelData(0)
  const aEnd = Math.pow(CHIRP.fEnd * mult, 2 / 3)
  let ph = 0
  for (let i = 0; i < n; i++) {
    const tau = i / sr
    let f: number
    let a: number
    if (tau < tEnd) {
      f = chirpF(tau) * mult
      a = Math.pow(f, 2 / 3) / aEnd
    } else {
      f = CHIRP.fEnd * mult
      a = Math.exp((-5 * (tau - tEnd)) / fade)
    }
    const attack = Math.min(1, tau / 0.005)
    ph += (2 * Math.PI * f) / sr
    d[i] = 0.6 * a * attack * Math.sin(ph)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const g = ctx.createGain()
  g.gain.value = 0.55
  src.connect(g)
  g.connect(ctx.destination)
  src.start()
}
