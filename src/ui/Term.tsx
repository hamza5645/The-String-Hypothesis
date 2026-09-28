import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY } from '../core/glossary'

/**
 * Hoverable glossary term: dotted underline, definition card on hover/focus (tap on phones).
 * <Term id="worldsheet">worldsheet</Term>. Unknown ids render as plain text.
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  const tip = useId()
  const hideT = useRef<number>(0)

  const place = useCallback(() => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const below = r.top < 190
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 170), window.innerWidth - 170), y: below ? r.bottom + 10 : r.top - 10, below })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open, place])

  if (!entry) {
    if (import.meta.env.DEV) console.warn(`[Term] unknown glossary id "${id}"`)
    return <>{children}</>
  }
  const show = () => {
    window.clearTimeout(hideT.current)
    setOpen(true)
  }
  const hide = () => {
    hideT.current = window.setTimeout(() => setOpen(false), 80)
  }
  return (
    <>
      <button
        ref={ref}
        type="button"
        className="term"
        aria-describedby={open ? tip : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => setOpen((o) => !o)}
        data-ui
      >
        {children ?? entry.term}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            id={tip}
            role="tooltip"
            className={`term-card${pos.below ? ' term-card--below' : ''}`}
            style={{ left: pos.x, top: pos.y }}
          >
            <div className="t-label term-card__term">{entry.term}</div>
            <p className="term-card__def">{entry.def}</p>
          </div>,
          document.body,
        )}
    </>
  )
}
