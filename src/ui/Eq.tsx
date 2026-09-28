import { useEffect, useRef, useState } from 'react'

let loader: Promise<typeof import('./katex')> | null = null
const load = () => (loader ??= import('./katex'))

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
    let alive = true
    load().then((m) => {
      if (!alive || !ref.current) return
      m.renderTexInto(ref.current, tex, display)
      setReady((r) => r + 1)
    })
    return () => {
      alive = false
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
