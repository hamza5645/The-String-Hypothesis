import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useChapter } from '@/core/chapter'
import { smoothstep } from '@/core/math'
import { LEN, type StepId } from './model'

/**
 * Steps whose sticky content fades out as soon as it starts to scroll away, so no beat, question
 * or lab panel ever slides up under the site header (the shared --sv fade starts only after the
 * content has already travelled ~0.28 viewport). Title and bridge are handled elsewhere.
 */
const EXIT: StepId[] = ['you', 'skin', 'dna', 'atom', 'dark', 'proton', 'points', 'gap', 'reveal', 'lab']

/** Viewport heights the step's sticky content has moved up past its resting place. */
function movedUp(k: number, len: number) {
  const top = 0.5 - k * len // the step's top edge, in viewports from the viewport top
  if (top > 0) return 0
  return len >= 1 ? Math.max(0, 1 - len - top) : -top
}

export function useExitFades() {
  const h = useChapter()
  useEffect(() => {
    let raf = 0
    const els = new Map<StepId, HTMLElement>()
    const last = new Map<StepId, number>()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (h.presence() <= 0) return
      for (const id of EXIT) {
        let el = els.get(id)
        if (!el) {
          el = document.querySelector<HTMLElement>(`section[data-chapter="${h.id}"] [data-step="${id}"]`) ?? undefined
          if (!el) continue
          els.set(id, el)
        }
        // the lab panel already reaches the header's edge when docked: it must be gone almost at once
        const m = movedUp(h.step(id), LEN[id])
        const v = id === 'lab' ? 1 - smoothstep(0.0, 0.07, m) : 1 - smoothstep(0.05, 0.24, m)
        if (Math.abs(v - (last.get(id) ?? -1)) > 0.003) {
          el.style.setProperty('--sd-out', v.toFixed(3))
          last.set(id, v)
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [h])
}

/**
 * The 1 → 2 bridge line, pinned under the H1 string. It must not scroll with its step: during the
 * dissolve into chapter 2 the step's content would pass straight over the handoff object. So it
 * lives in a fixed layer, holds under the string, and fades with the chapter's presence.
 * Decorative copy (aria-hidden): the step carries the same text in flow for assistive tech.
 */
export function BridgeLine({ children }: { children: ReactNode }) {
  const h = useChapter()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    let lastOp = -1
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = ref.current
      if (!el) return
      const pres = h.presence()
      const op = smoothstep(0.05, 0.3, h.step('bridge')) * pres
      if (Math.abs(op - lastOp) > 0.003) {
        el.style.opacity = op.toFixed(3)
        el.style.visibility = op < 0.01 ? 'hidden' : 'visible'
        lastOp = op
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [h])
  return createPortal(
    <div ref={ref} className="sd-bridge" aria-hidden="true" style={{ opacity: 0, visibility: 'hidden' }}>
      {children}
    </div>,
    document.body,
  )
}
