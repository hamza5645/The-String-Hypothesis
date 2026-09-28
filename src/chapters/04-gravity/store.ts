import { create } from 'zustand'
import { prefersReducedMotion } from '@/core/time'
import type { Spin } from './model'

export type View = 'ring' | 'both' | 'string'

interface GravityState {
  /** Beat 1 force explorer: selected station (−1 none, 0 EM, 1 weak, 2 strong, 3 gravity). */
  force: number
  setForce: (i: number) => void

  /* Spin Lab (content/04-gravity.md § Lab › Controls) */
  spin: Spin
  /** Pattern rotation ψ in degrees, 0–360. */
  psi: number
  circular: boolean
  /** Display strain A (0–0.40). */
  amp: number
  /** Display wave cycles per second (0–1.2). */
  speed: number
  paused: boolean
  /** Phase scrubber (degrees) used when the wave is paused / speed is 0. */
  phase: number
  view: View
  forces: boolean
  pitch4: boolean
  /** performance.now() of the last chirp press (0 = never). */
  chirpAt: number
  set: (p: Partial<Omit<GravityState, 'set' | 'setForce'>>) => void
}

const reduced = typeof window !== 'undefined' && prefersReducedMotion()

export const useGravity = create<GravityState>((set) => ({
  force: -1,
  setForce: (i) => set({ force: i }),
  spin: 2,
  psi: 0,
  circular: false,
  amp: 0.2,
  speed: reduced ? 0 : 0.35,
  paused: false,
  phase: 0,
  view: 'both',
  forces: true,
  pitch4: true,
  chirpAt: 0,
  set: (p) => set(p),
}))
