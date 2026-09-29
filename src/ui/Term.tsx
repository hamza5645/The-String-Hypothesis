import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY } from '../core/glossary'

/**
 * Glossary term: dotted underline, definition card on hover (mouse), keyboard focus, or tap (touch).
 * <Term id="worldsheet">worldsheet</Term>. Unknown ids render as plain text.
 * - Mouse: hover shows the card; a click keeps it open (it closes when the pointer leaves).
 * - Touch/pen: a tap toggles it; tapping anywhere else closes it.
 * - Keyboard: focus shows it, Enter/Space toggles it, Escape dismisses it (WCAG 1.4.13).
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  const tip = useId()
  const hideT = useRef<number>(0)
  // the pointer that started the current press, and whether the card was open at that moment
  const press = useRef<{ type: string; wasOpen: boolean } | null>(null)
  const openRef = useRef(open)
  openRef.current = open

  const place = useCallback(() => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const below = r.top < 190
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 170), window.innerWidth - 170), y: below ? r.bottom + 10 : r.top - 10, below })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    // scrolling closes a hover/tap card; a keyboard-focused term keeps its card (Tab itself scrolls the
    // focused term into view) and the card follows it
    const onScroll = () => {
      if (ref.current?.matches(':focus-visible')) place()
      else setOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // tap/click anywhere else closes it
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(hideT.current), [])

  if (!entry) {
    if (import.meta.env.DEV) console.warn(`[Term] unknown glossary id "${id}"`)
    return <>{children}</>
  }
  const show = () => {
    window.clearTimeout(hideT.current)
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(hideT.current)
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
        onPointerDown={(e) => {
          press.current = { type: e.pointerType, wasOpen: openRef.current }
        }}
        onMouseEnter={() => {
          // touch taps emulate mouseenter (after pointerdown); only a real mouse hover should open the card
          if (press.current?.type !== 'touch' && press.current?.type !== 'pen') show()
        }}
        onMouseLeave={() => {
          if (press.current?.type !== 'touch' && press.current?.type !== 'pen') hide()
        }}
        onFocus={(e) => {
          // keyboard focus only; pointer presses decide in onClick
          if (e.currentTarget.matches(':focus-visible')) show()
        }}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            e.stopPropagation()
            setOpen(false)
          }
        }}
        onClick={(e) => {
          window.clearTimeout(hideT.current)
          const p = press.current
          press.current = null
          if (e.detail === 0 || !p) setOpen((o) => !o) // keyboard (Enter/Space)
          else if (p.type === 'mouse') setOpen(true)
          else setOpen(!p.wasOpen)
        }}
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
