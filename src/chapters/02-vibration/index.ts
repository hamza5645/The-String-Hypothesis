import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'
import { vibScale } from './timeline'

const load = () => import('./Scene')

export default defineChapter({
  id: 'vibration',
  index: 2,
  title: 'Vibration',
  question: 'How can one kind of thing look like many particles?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale: vibScale,
})
