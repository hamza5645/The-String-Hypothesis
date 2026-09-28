// Tiny additive synth for string harmonics. Silent unless the visitor turns sound on
// (the toggle click is the user gesture that unlocks the AudioContext).

import { useSettings } from './settings'

let ctx: AudioContext | null = null
let master: GainNode | null = null

function ensure(): AudioContext | null {
  if (!useSettings.getState().sound) return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.22
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 4
      master.connect(comp)
      comp.connect(ctx.destination)
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** Call from the sound toggle's click handler. */
export function unlockAudio() {
  ensure()
}

export interface Partial {
  /** Harmonic number (frequency = f0 * n) — or give `freq` directly. */
  n?: number
  freq?: number
  /** Relative amplitude 0..1. */
  amp: number
}

/**
 * A plucked tone: sum of sine partials with exponential decay (higher partials decay faster),
 * like an idealized string. Returns immediately; no-op when sound is off.
 */
export function pluck(f0: number, partials: Partial[], opts: { decay?: number; gain?: number; pan?: number } = {}) {
  const c = ensure()
  if (!c || !master) return
  const now = c.currentTime
  const decay = opts.decay ?? 2.4
  const out = c.createGain()
  out.gain.value = opts.gain ?? 0.6
  let node: AudioNode = out
  if (opts.pan && c.createStereoPanner) {
    const p = c.createStereoPanner()
    p.pan.value = opts.pan
    out.connect(p)
    node = p
  }
  node.connect(master)
  const total = partials.reduce((s, p) => s + p.amp, 0) || 1
  for (const p of partials) {
    const f = p.freq ?? f0 * (p.n ?? 1)
    if (f > 12000) continue
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = c.createGain()
    const a = (p.amp / total) * 0.9
    const d = decay / Math.sqrt(p.n ?? f / f0)
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(a, now + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, now + d)
    o.connect(g)
    g.connect(out)
    o.start(now)
    o.stop(now + d + 0.05)
  }
}

/** A soft sustained tone (e.g. while holding a mode). Returns a stop() function. */
export function hum(freq: number, gain = 0.12): () => void {
  const c = ensure()
  if (!c || !master) return () => {}
  const now = c.currentTime
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(gain, now + 0.25)
  o.connect(g)
  g.connect(master)
  o.start(now)
  return () => {
    const t = c.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(0, t + 0.3)
    o.stop(t + 0.35)
  }
}

/** A quiet UI tick (mode switches etc.). */
export function tick(freq = 880) {
  pluck(freq, [{ n: 1, amp: 1 }, { n: 2, amp: 0.2 }], { decay: 0.25, gain: 0.15 })
}
