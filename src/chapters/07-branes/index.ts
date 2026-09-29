import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'
import { lsMeters } from './model'
import { ladderPairMemo, useBranes } from './store'

const load = () => import('./Scene')

export default defineChapter({
  id: 'branes',
  index: 7,
  title: 'Branes',
  question: 'Where do open strings end?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  // ℓ_s is unknown, so the gauge stays empty — except where a real length is on screen:
  // Beat 6's tested range of 1/r² gravity (52 µm, while the result cards show), and the lab's stretch d under a
  // stated energy-scale assumption.
  scale: (h) => {
    if (h.inStep('world') && h.step('world') > 0.55) return 52e-6
    if (h.inStep('lab')) {
      const s = useBranes.getState()
      const ls = lsMeters(s.scale)
      if (!ls) return null
      const p = ladderPairMemo(s.ys, s.ref, s.pair)
      const d = p ? Math.abs(s.ys[p[0]] - s.ys[p[1]]) : 0
      return (d > 0.05 ? d : 1) * ls
    }
    return null
  },
})
