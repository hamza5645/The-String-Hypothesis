import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'duality',
  index: 8,
  title: 'Duality',
  question: 'Can two different worlds be the same?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  // Radii here are in string lengths ℓs = √α′, whose size in meters is unknown: no gauge reading.
  scale: () => null,
})
