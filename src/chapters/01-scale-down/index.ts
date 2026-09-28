import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'scale-down',
  index: 1,
  title: 'Smaller',
  question: 'What is everything made of?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale: () => null,
})
