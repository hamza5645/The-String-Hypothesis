import { lazy } from 'react'
import { defineChapter, type ChapterHandle } from '@/core/chapter'
import Overlay from './Overlay'
import { cursorLogE, HBARC_GEV_M } from './model'

const load = () => import('./Scene')

/**
 * Scale gauge (meters).
 *   String-only frames (Opening, Outro, end of Beat 6): the string length is unknown, so the gauge rests on
 *   the site-wide fiducial ~10⁻³⁴ m "if traditional estimates hold" (the Overlay says so in words, with a
 *   SPECULATIVE mark), matching Chapters 1–3.
 *   Beat 1 nucleus 10⁻¹⁵ m · Beat 2 GPS orbit 2.66 × 10⁷ m · Beat 3 λ = ħc/E at the cursor ·
 *   Beats 4–5 LIGO arm 4 × 10³ m · Beat 6 the 1974 proposal: hadron-sized 10⁻¹⁵ m → ~10⁻³⁵ m (proposed,
 *   not measured) → back to the fiducial. Lab: the LIGO arm.
 */
const STRING_FIDUCIAL = 1e-34

function scale(h: ChapterHandle): number | null {
  if (h.step('origin') < 0.5) return STRING_FIDUCIAL
  if (h.step('forces') < 1) return 1e-15
  if (h.step('gr') < 1) return 2.66e7
  if (h.step('qg') < 1) return HBARC_GEV_M / 10 ** cursorLogE(h.step('qg'))
  if (h.step('aha') < 1) return 4e3
  if (h.step('forced') < 1) {
    const p = h.step('forced')
    if (p < 0.4) return 1e-15
    if (p < 0.5) return 10 ** (-15 - 20 * Math.min(1, (p - 0.4) / 0.1))
    if (p < 0.66) return 1.6e-35
    return STRING_FIDUCIAL
  }
  if (h.step('lab') < 1) return 4e3
  return STRING_FIDUCIAL
}

export default defineChapter({
  id: 'gravity',
  index: 4,
  title: 'Gravity',
  question: 'Why did physicists take strings seriously?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale,
})
