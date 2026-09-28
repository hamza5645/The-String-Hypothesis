import { lazy } from 'react'
import { defineChapter, type ChapterHandle } from '@/core/chapter'
import Overlay from './Overlay'
import { cOf } from './layout'

const load = () => import('./Scene')

/**
 * Scale gauge. Every diagram here is drawn in ℓ, the string length, which is unknown (SPECULATIVE: the
 * Overlay says so). The gauge draws the traditional estimate, ~10⁻³⁴ m, the value Chapters 1, 2 and 10 use.
 * The chapter opens on Chapter 2's far view (a string seen from ~10⁻¹⁹ m away looks like a point), so the
 * reading starts there and closes in on the string scale as the point unfolds back into the Thread.
 */
const FAR = Math.log10(2e-19) // Chapter 2's last reading (its exit pull-back)
const STRING = -34 // ~10⁻³⁴ m if traditional estimates hold

function scale(h: ChapterHandle) {
  const c = cOf(h.progress())
  const u = Math.min(1, Math.max(0, (c - 1.0) / 0.42))
  const k = u * u * (3 - 2 * u)
  return Math.pow(10, FAR + (STRING - FAR) * k)
}

export default defineChapter({
  id: 'worldsheet',
  index: 3,
  title: 'Worldsheets',
  question: 'What does a string do as it moves through time?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale,
})
