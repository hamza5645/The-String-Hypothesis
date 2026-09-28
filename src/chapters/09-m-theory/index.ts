import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'm-theory',
  index: 9,
  title: 'M-theory',
  question: 'Five theories, or one?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale: () => null,
})
