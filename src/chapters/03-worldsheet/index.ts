import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'worldsheet',
  index: 3,
  title: 'Worldsheets',
  question: 'What does a string do as it moves through time?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  scale: () => null,
})
