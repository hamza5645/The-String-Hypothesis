import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { StatusRow, type StatusKind } from '@/ui'

/**
 * A beat (same markup/classes as the kit's <Beat>) whose status chips carry the pack's per-beat note:
 * a small "why these marks" button shows the explanation on hover or focus, and pins it open on a click or tap.
 */
export function WsBeat({ kicker, status, note, children }: { kicker: ReactNode; status: StatusKind[]; note: string; children: ReactNode }) {
  return (
    <div className="beat beat--lead">
      <div className="t-label beat__kicker ws-kicker">{kicker}</div>
      <div className="beat__meta">
        <StatusRow status={status} />
        <WhyNote text={note} />
      </div>
      <div className="t-lead beat__text">{children}</div>
    </div>
  )
}

export function WhyNote({ text }: { text: string }) {
  // open: shown; pinned: opened by a click/tap/Enter, so it stays until clicked again, Escape, an outside
  // press or a scroll. Hover and keyboard focus show it transiently. A touch never "hovers": the emulated
  // mouseenter/focus that precede a tap's click are ignored, so the click itself toggles the note.
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  const tip = useId()
  const hideT = useRef(0)
  const pointer = useRef('')
  const place = useCallback(() => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const below = r.top < 220
    // the card is min(340px, 100vw − 32px) wide and centred on x: keep it 16 px inside both edges
    const half = Math.min(340, window.innerWidth - 32) / 2
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 16 + half), window.innerWidth - 16 - half), y: below ? r.bottom + 10 : r.top - 10, below })
  }, [])
  const close = useCallback(() => {
    setOpen(false)
    setPinned(false)
  }, [])
  useLayoutEffect(() => {
    if (!open) return
    place()
    const onScroll = () => close()
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, place, close])
  const show = () => {
    if (pointer.current === 'touch') return
    window.clearTimeout(hideT.current)
    setOpen(true)
  }
  const hide = () => {
    if (pinned) return
    hideT.current = window.setTimeout(() => setOpen(false), 80)
  }
  return (
    <>
      <button
        ref={ref}
        type="button"
        className="ws-why"
        aria-label="Why these marks?"
        aria-describedby={open ? tip : undefined}
        aria-expanded={open}
        onPointerDown={(e) => {
          pointer.current = e.pointerType
        }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={() => {
          // keyboard: tabbing away closes it, pinned or not
          window.clearTimeout(hideT.current)
          hideT.current = window.setTimeout(close, 80)
        }}
        onClick={() => {
          window.clearTimeout(hideT.current)
          if (pinned) close()
          else {
            setOpen(true)
            setPinned(true)
          }
          pointer.current = ''
        }}
        data-ui
      >
        <span aria-hidden="true">?</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div id={tip} role="tooltip" className={`term-card ws-why-card${pos.below ? ' term-card--below' : ''}`} style={{ left: pos.x, top: pos.y }}>
            <div className="t-label term-card__term">Why these marks</div>
            <p className="term-card__def">{text}</p>
          </div>,
          document.body,
        )}
    </>
  )
}
