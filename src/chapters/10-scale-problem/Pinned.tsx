/*
 * Holds a beat's text in its resting place while its step scrolls in and out, and cross-fades it
 * instead: narrative text never slides across the diagram (desktop) or the figure (phones), and it
 * never overlaps a neighbour's text. On the closing step it also keeps the lines still through the
 * dissolve into Chapter 11, so nothing crosses the H0 point.
 * DOM only, driven by the journey listener (no React renders, no three.js: this file is eager).
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useChapter } from '@/core/chapter'
import { journey, onJourney } from '@/core/journey'
import { smoothstep } from '@/core/math'

export function Pinned({
  step,
  len,
  fadeLead,
  children,
}: {
  step: string
  len: number
  /** fade the first child as soon as the step starts to leave (the rest keeps the normal window) */
  fadeLead?: boolean
  children: ReactNode
}) {
  const h = useChapter()
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const lead = el.firstElementChild as HTMLElement | null
    const pIn = 0.5 / len // the step's content reaches its sticky place
    const pOut = 1 - 0.5 / len // … and starts to scroll away
    const a = 0.45 / len // fade window: 0.45 viewports of scroll (the outgoing text is gone before the next arrives)
    const g = 0.05 / len
    let last = -1
    const run = () => {
      const p = h.step(step)
      if (Math.abs(p - last) < 1e-5) return
      last = p
      const dy = p < pIn ? -(pIn - p) * len * journey.vh : p > pOut ? (p - pOut) * len * journey.vh : 0
      el.style.transform = Math.abs(dy) > 0.5 ? `translate3d(0, ${dy.toFixed(1)}px, 0)` : ''
      const o = smoothstep(pIn - a, pIn - g, p) * (1 - smoothstep(pOut + g, pOut + a, p))
      el.style.opacity = o.toFixed(3)
      el.classList.toggle('is-off', o < 0.4)
      if (fadeLead && lead) lead.style.opacity = (1 - smoothstep(pOut, pOut + 0.35 * a, p)).toFixed(3)
    }
    run()
    return onJourney(run)
  }, [h, step, len, fadeLead])
  return (
    <div ref={ref} className="sp-pin">
      {children}
    </div>
  )
}
