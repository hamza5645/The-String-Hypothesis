// The journey, in order. Each chapter lives in its own folder and owns only that folder.
import type { ChapterMeta } from '@/core/chapter'
import prologue from './00-prologue'
import scaleDown from './01-scale-down'
import vibration from './02-vibration'
import worldsheet from './03-worldsheet'
import gravity from './04-gravity'
import dimensions from './05-dimensions'
import calabiYau from './06-calabi-yau'
import branes from './07-branes'
import duality from './08-duality'
import mTheory from './09-m-theory'
import scaleProblem from './10-scale-problem'
import knowledge from './11-knowledge'

export const CHAPTERS: ChapterMeta[] = [
  prologue,
  scaleDown,
  vibration,
  worldsheet,
  gravity,
  dimensions,
  calabiYau,
  branes,
  duality,
  mTheory,
  scaleProblem,
  knowledge,
]
