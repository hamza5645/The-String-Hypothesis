import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import { logLerp, range } from '@/core/math'
import { GAP_52, KLEIN_R, TI } from './constants'
import { ahaPhysR, beatTime, fitF } from './model'
import { useDim } from './store'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'dimensions',
  index: 5,
  title: 'Dimensions',
  question: 'Where would extra dimensions hide?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  // Characteristic length on screen (content pack: — / 10 m → 1 mm / Klein's R ~ 10⁻³³ m / live inset R / unknown / 52 µm)
  scale: (h) => {
    const T = beatTime(h.step)
    if (T < TI.cable || T >= TI.exit) return null
    if (T < TI.lattice) return logLerp(10, 1e-3, range(h.step('cable'), 0.06, 0.86))
    if (T < TI.fit) return KLEIN_R
    if (T < TI.count) return fitF(T) >= 0.76 ? ahaPhysR(fitF(T)) : null
    if (T < TI.bounds) return null
    if (T < TI.lab) return GAP_52
    const s = useDim.getState()
    if (s.station === 'fit') return s.R
    if (s.station === 'zoom') return logLerp(10, 1e-3, (Math.log(1e4) - Math.log(s.zoom)) / (Math.log(1e4) - Math.log(3)))
    return null
  },
})
