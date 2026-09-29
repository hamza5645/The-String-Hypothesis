import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'
import { gaugeScale } from './timeline'

const load = () => import('./Scene')

export default defineChapter({
  id: 'scale-problem',
  index: 10,
  title: 'The scale problem',
  question: "Why haven't we seen a string?",
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale: gaugeScale,
})
