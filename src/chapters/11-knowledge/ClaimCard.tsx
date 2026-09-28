import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CHIP_NAME, chipOf, claimById } from './data'
import { browse, cardAnchor, useKnowledge } from './store'

/*
 * Claim cards (Claim atlas): hover shows the one-line summary beside the node; a tap, click or the
 * keyboard pins the card and adds the 2–3 sentence detail. The Scene writes the node's screen
 * position into `cardAnchor` every frame; the card follows it without React renders.
 */

function cycle(d: number) {
  const ids = browse.ids
  if (!ids.length) return
  const s = useKnowledge.getState()
  let i = s.pinned ? ids.indexOf(s.pinned) : -1
  i = i < 0 ? (d > 0 ? 0 : ids.length - 1) : (i + d + ids.length) % ids.length
  s.setPinned(ids[i])
}

/** Keyboard route to every node: focus, then ← / → cycle the claims of the tier in focus. */
export function Browse({ hint, compact = false }: { hint: string; compact?: boolean }) {
  return (
    <button
      type="button"
      className={`kn-browse${compact ? ' kn-browse--compact' : ''}`}
      onClick={() => cycle(1)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          cycle(e.key === 'ArrowRight' ? 1 : -1)
        } else if (e.key === 'Escape') useKnowledge.getState().setPinned(null)
      }}
      aria-label={`${hint}. Press, then use the left and right arrow keys to move between claims.`}
    >
      <span className="kn-browse__dot" aria-hidden="true" />
      <span>{hint}</span>
      <span className="kn-browse__keys" aria-hidden="true">
        ← →
      </span>
    </button>
  )
}

export function ClaimCard() {
  const hover = useKnowledge((s) => s.hover)
  const pinned = useKnowledge((s) => s.pinned)
  const setPinned = useKnowledge((s) => s.setPinned)
  const id = pinned ?? hover
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    let raf = 0
    let lastT = ''
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = ref.current
      if (!el) return
      const W = window.innerWidth
      const H = window.innerHeight
      const docked = W < 720
      el.dataset.dock = docked ? '1' : '0'
      el.dataset.ghost = cardAnchor.ghost ? '1' : '0'
      el.style.opacity = cardAnchor.on ? '1' : '0'
      if (docked) {
        if (lastT) {
          el.style.transform = ''
          lastT = ''
        }
        return
      }
      const w = el.offsetWidth
      const h = el.offsetHeight
      const r = cardAnchor.r
      let x = cardAnchor.x + r + 16
      if (x + w > W - 64) x = cardAnchor.x - r - 16 - w
      const y = Math.min(Math.max(cardAnchor.y - 22, 72), H - h - 18)
      const t = `translate3d(${Math.round(Math.max(12, x))}px, ${Math.round(y)}px, 0)`
      if (t !== lastT) {
        el.style.transform = t
        lastT = t
      }
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [id])

  useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinned(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pinned, setPinned])

  if (!id) return null
  const c = claimById(id)
  if (!c) return null
  const chip = chipOf(c)
  return createPortal(
    <div
      ref={ref}
      className={`kn-card kn-card--${chip}${pinned ? ' is-pinned' : ''}`}
      role={pinned ? 'dialog' : 'tooltip'}
      aria-live="polite"
      aria-label={`${CHIP_NAME[chip]}: ${c.label}`}
      data-ui
    >
      <div className="kn-card__head">
        <i className={`kn-glyph kn-glyph--${chip}`} aria-hidden="true" />
        <span className="kn-card__chip">
          {CHIP_NAME[chip]}
          {c.id === 'D6' ? ' *' : ''}
        </span>
        {c.st && <span className="kn-card__st">String-theory claim</span>}
        {pinned && (
          <button type="button" className="kn-card__close" onClick={() => setPinned(null)} aria-label="Close claim">
            <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        )}
      </div>
      <div className="kn-card__label">{c.label}</div>
      {(c.sub || c.tag) && <div className="kn-card__sub">{c.sub ?? c.tag}</div>}
      <p className="kn-card__summary">{c.summary}</p>
      {pinned ? <p className="kn-card__detail">{c.detail}</p> : <p className="kn-card__more">Tap or click to read more</p>}
      {pinned && c.note && <p className="kn-card__note">* {c.note}</p>}
      <p className="kn-card__ghost">Above your evidence ceiling. Faded, not deleted: ideas still worth testing.</p>
    </div>,
    document.body,
  )
}
