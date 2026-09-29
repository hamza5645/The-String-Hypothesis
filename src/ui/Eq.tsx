import { useEffect, useRef, useState } from 'react'

let loader: Promise<typeof import('./katex')> | null = null
const load = () => (loader ??= import('./katex'))

/**
 * KaTeX (JS, CSS, fonts) is fetched only when an equation comes within ~1.5 viewports of the screen, so it
 * never competes with first load. Resolves at once when it is already loaded (or IntersectionObserver is missing).
 */
function whenNear(el: Element, fn: () => void): () => void {
  if (loader || typeof IntersectionObserver === 'undefined') {
    fn()
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        fn()
      }
    },
    { rootMargin: '150% 0px' },
  )
  io.observe(el)
  return () => io.disconnect()
}

/**
 * <Eq tex="M^2 = \htmlClass{term-n}{(n/R)^2} + \htmlClass{term-w}{(wR/\alpha')^2}" display
 *     highlight={{ n: 1, w: 0.2 }} />
 *
 * Wrap terms in \htmlClass{term-<key>}{…}; `highlight` maps key → 0..1 emphasis, which
 * glows those terms in filament light (drive it from the same state as the scene so the
 * equation lights up in sync with what's on screen).
 */
export function Eq({
  tex,
  display = false,
  highlight,
  label,
  className,
}: {
  tex: string
  display?: boolean
  highlight?: Record<string, number>
  /** Accessible reading of the equation (plain words). */
  label?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [ready, setReady] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    // observe the wrapper: the (empty) KaTeX target has no box of its own before the first render
    const stop = whenNear(el.parentElement ?? el, () =>
      load().then((m) => {
        if (!alive || !ref.current) return
        m.renderTexInto(ref.current, tex, display)
        setReady((r) => r + 1)
      }),
    )
    return () => {
      alive = false
      stop()
    }
  }, [tex, display])

  useEffect(() => {
    const el = ref.current
    if (!el || !ready) return
    el.querySelectorAll<HTMLElement>('[class*="term-"]').forEach((node) => {
      const key = Array.from(node.classList)
        .find((c) => c.startsWith('term-'))
        ?.slice(5)
      const v = key && highlight ? (highlight[key] ?? 0) : 0
      node.style.setProperty('--hl', String(Math.max(0, Math.min(1, v))))
      node.classList.toggle('is-hl', v > 0.5)
    })
  }, [ready, highlight])

  const Tag = display ? 'div' : 'span'
  return (
    <Tag className={`eq${display ? ' eq--display' : ''}${className ? ' ' + className : ''}`} role={label ? 'img' : undefined} aria-label={label}>
      {!ready && <span className="eq__placeholder t-mono">{tex.replace(/\\htmlClass\{[^}]*\}/g, '')}</span>}
      {/* KaTeX owns this node's children; React never renders into it. */}
      <span ref={ref} className="eq__tex" />
    </Tag>
  )
}
