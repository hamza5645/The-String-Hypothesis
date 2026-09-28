import { lazy } from 'react'
import { defineChapter } from '@/core/chapter'
import Overlay from './Overlay'

const load = () => import('./Scene')

export default defineChapter({
  id: 'calabi-yau',
  index: 6,
  title: 'Hidden shapes',
  question: 'What shape could the hidden dimensions have?',
  Scene: lazy(load),
  preload: load,
  Overlay,
  Fallback: lazy(() => import('./Fallback')),
  // The size of hidden dimensions is unknown (model-dependent): the gauge marker stays hidden and the
  // scene pins its own "SIZE: UNKNOWN · DRAWN MAGNIFIED" caption (content pack, pitfall 9).
  scale: () => null,
})
