import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { lockScroll } from '../core/scroller'

/** Right-side glass drawer (go-deeper, glossary). Esc / backdrop / close button dismiss it. */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  // callers pass inline arrows; keep the effect keyed on `open` only so re-renders don't bounce focus/scroll-lock
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    lockScroll(true)
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('.drawer__close')?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      lockScroll(false)
      returnFocus.current?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="drawer-root" data-ui>
      <div className="drawer__backdrop" onClick={onClose} />
      <div ref={panel} className={`drawer${wide ? ' drawer--wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} data-lenis-prevent>
        <header className="drawer__head">
          <div>
            {eyebrow && <div className="t-label drawer__eyebrow">{eyebrow}</div>}
            <h2 className="drawer__title">{title}</h2>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        </header>
        <div className="drawer__body prose">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
