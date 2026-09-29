// The Vibration Bench's voice (content pack § Optional audio). Six sine oscillators at n × 110 Hz,
// each through its own gain into a master gain that starts at 0. Nothing is created until the
// visitor has turned sound on (a click = the user gesture). FREE: a steady tone whose TIMBRE follows
// the packets (the pitch never tracks the mass). PINNED plucks go through the shared pluck() synth.
import { useSettings } from '@/core/settings'
import { AQ, F0_HZ, MODES } from './model'

let ctx: AudioContext | null = null
let master: GainNode | null = null
const gains: GainNode[] = []
const last = new Float64Array(MODES).fill(-1)
let lastMaster = -1
let silentSince = 0

function create(): boolean {
  if (ctx) return true
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    for (let n = 1; n <= MODES; n++) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = F0_HZ * n
      const g = ctx.createGain()
      g.gain.value = 0
      o.connect(g)
      g.connect(master)
      o.start()
      gains.push(g)
    }
    return true
  } catch {
    ctx = null
    return false
  }
}

let suspendTimer = 0

/**
 * Fade the bench voice out and suspend its context. Called when the chapter leaves the screen or
 * unmounts, and when sound is switched off, since benchTone() only runs while the chapter is visible.
 * Cheap when already silent (the Scene may call it every frame).
 */
export function silenceBench() {
  if (!ctx || !master) return
  if (lastMaster !== 0) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.04)
    lastMaster = 0
    last.fill(-1)
    silentSince = performance.now() // benchTone's own suspend waits for the fade too
  }
  // suspend once the short fade has run, unless benchTone() has turned the voice back up meanwhile
  if (ctx.state === 'running' && !suspendTimer) {
    suspendTimer = window.setTimeout(() => {
      suspendTimer = 0
      if (ctx && lastMaster === 0 && ctx.state === 'running') ctx.suspend().catch(() => {})
    }, 250)
  }
}

useSettings.subscribe((s) => {
  if (!s.sound) silenceBench()
})

/**
 * Call every frame from the Scene. `amps` in units of L (the drawn amplitudes Aₙ); `on` = the bench is
 * on screen, FREE, and not far away. Target gains gₙ = 0.18·Aₙ/A_q, renormalized so Σgₙ ≤ 0.6.
 */
export function benchTone(amps: ArrayLike<number>, on: boolean, volume: number, nowMs: number) {
  const want = on && useSettings.getState().sound
  if (!want) {
    if (ctx && master && lastMaster !== 0) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12)
      lastMaster = 0
      silentSince = nowMs
    }
    if (ctx && ctx.state === 'running' && lastMaster === 0 && nowMs - silentSince > 1500) ctx.suspend().catch(() => {})
    return
  }
  if (!create() || !ctx || !master) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  let sum = 0
  for (let n = 0; n < MODES; n++) sum += (0.18 * Math.abs(amps[n])) / AQ
  const norm = sum > 0.6 ? 0.6 / sum : 1
  for (let n = 0; n < MODES; n++) {
    const g = ((0.18 * Math.abs(amps[n])) / AQ) * norm
    if (Math.abs(g - last[n]) > 0.004) {
      last[n] = g
      gains[n].gain.setTargetAtTime(g, ctx.currentTime, 0.08)
    }
  }
  const mv = 0.32 * volume
  if (Math.abs(mv - lastMaster) > 0.004) {
    lastMaster = mv
    master.gain.setTargetAtTime(mv, ctx.currentTime, 0.12)
  }
}
