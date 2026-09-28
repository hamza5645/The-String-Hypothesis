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
 */
export function useChapterFrame(cb: (f: FrameInfo) => void, opts?: { always?: boolean; priority?: number }) {
  const h = useChapter()
  const ref = useRef(cb)
  ref.current = cb
  const info = useMemo(() => ({ h }) as FrameInfo, [h])
  const always = !!opts?.always
  useFrame((state) => {
    const presence = h.presence()
    if (presence <= 0 && !always) return
    info.t = clock.t
    info.dt = clock.dt
    info.progress = h.progress()
    info.presence = presence
    info.state = state
    ref.current(info)
  }, opts?.priority ?? 0)
}
