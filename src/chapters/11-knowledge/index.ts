import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'knowledge',
  index: 11,
  title: 'What we know',
  question: 'What do we actually know?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  // The map has no physical length scale (height = distance from experiment), so the gauge stays off.
  scale: () => null,
})
