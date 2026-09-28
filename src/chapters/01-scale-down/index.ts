import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import { evalZoom, type ZoomState } from './model'
import Overlay from './Overlay'

const load = () => import('./Scene')
const zs = {} as ZoomState

export default defineChapter({
  id: 'scale-down',
  index: 1,
  title: 'Smaller',
  question: 'What is everything made of?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  // the live field of view L (m); hidden on the opening point (H0) until the zoom instrument appears
  scale: (h) => {
    const z = evalZoom(h, window.innerWidth / Math.max(1, window.innerHeight), zs)
    return z.z < 1.05 ? null : Math.pow(10, z.s)
  },
})
