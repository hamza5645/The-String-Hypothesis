import { useMemo, useRef } from 'react'
import { useFrame, type RootState } from '@react-three/fiber'
import { useChapter, type ChapterHandle } from '../core/chapter'
import { clock } from '../core/time'

export interface FrameInfo {
  /** Stage clock seconds (freezable; use this, not state.clock). */
  t: number
  /** Seconds since last frame (0 when frozen). */
  dt: number
  /** This chapter's 0..1 scroll progress. */
  progress: number
  /** This chapter's 0..1 visibility. */
  presence: number
  h: ChapterHandle
  state: RootState
}

/**
 * useFrame for chapter scenes: skipped while the chapter is invisible (presence 0),
 * and hands you the stage clock + scroll state. Never allocate inside the callback.
 *
 * Default priority −1: runs after the clock (−100) and aspect keeper (−50) but BEFORE library
 * frame work at 0 (drei <Html> projection, Filament fn evaluation) — so camera moves made here are
 * seen by labels in the same frame. Use this, not raw useFrame, in chapters.
 * Exceptions are caught (logged once) so one chapter's bug can't freeze the compositor.
 */
export function useChapterFrame(cb: (f: FrameInfo) => void, opts?: { always?: boolean; priority?: number }) {
  const h = useChapter()
  const ref = useRef(cb)
  ref.current = cb
  const info = useMemo(() => ({ h }) as FrameInfo, [h])
  const always = !!opts?.always
  const errored = useRef(false)
  useFrame((state) => {
    const presence = h.presence()
    if (presence <= 0 && !always) return
    info.t = clock.t
    info.dt = clock.dt
    info.progress = h.progress()
    info.presence = presence
    info.state = state
    try {
      ref.current(info)
    } catch (e) {
      if (!errored.current) {
        errored.current = true
        console.error(`[${h.id}] frame callback threw`, e)
      }
    }
  }, opts?.priority ?? -1)
}
