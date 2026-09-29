import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Step } from './Chapter'
import { Status, type StatusKind } from './Status'

/**
 * The chapter's hands-on experiment. A long sticky step: while it's on screen the scene
 * becomes interactive (scenes check h.inStep('lab')), and the instrument panel docks
 * bottom-right (desktop) or as a bottom sheet (phones).
 */
export function Lab({
  id = 'lab',
  length = 2.2,
  title,
  status,
  hint,
  intro,
  children,
  footer,
  side = 'right',
}: {
  id?: string
  length?: number
  title: ReactNode
  status?: StatusKind | StatusKind[]
  /** How to interact, e.g. "Drag the string · pick a mode". Shown near the scene. */
  hint?: ReactNode
  /** One or two short lines above the controls. */
  intro?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'right' | 'left'
}) {
  const statuses = status ? (Array.isArray(status) ? status : [status]) : []
  const scroller = useRef<HTMLDivElement>(null)
  useMoreCue(scroller)
  return (
    <Step id={id} length={length} align="wide" valign="bottom" fade className={`step--lab step--lab-${side}`}>
      {hint && (
        <div className="lab-hint t-label" aria-hidden="true">
          <span className="lab-hint__dot" />
          {hint}
        </div>
      )}
      <aside className={`lab lab--${side}`} data-ui aria-label={typeof title === 'string' ? title : 'Lab'}>
        <div ref={scroller} className="lab__scroll">
        <header className="lab__head">
          <span className="t-label lab__eyebrow">Lab</span>
          <h3 className="lab__title">{title}</h3>
          {statuses.length > 0 && (
            <div className="lab__status">
              {statuses.map((k) => (
                <Status key={k} kind={k} compact />
              ))}
            </div>
          )}
        </header>
        {intro && <div className="lab__intro">{intro}</div>}
        <div className="lab__body">{children}</div>
        {footer && <footer className="lab__foot">{footer}</footer>}
        </div>
        <span className="lab__more t-label" aria-hidden="true">
          ↓ more
        </span>
      </aside>
    </Step>
  )
}

/**
 * While the panel has more below its fold (phones: a 46svh sheet; iOS hides scrollbars), mark the .lab with
 * data-more: CSS fades the bottom edge and shows a small "↓ more" cue. DOM only, no React renders.
 */
function useMoreCue(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    const lab = el?.parentElement
    if (!el || !lab) return
    let on = false
    const upd = () => {
      const more = el.scrollHeight - el.scrollTop - el.clientHeight > 8
      if (more !== on) {
        on = more
        lab.toggleAttribute('data-more', more)
      }
    }
    upd()
    el.addEventListener('scroll', upd, { passive: true })
    const ro = new ResizeObserver(upd)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => {
      el.removeEventListener('scroll', upd)
      ro.disconnect()
    }
  }, [ref])
}

/** A labelled group of controls inside a Lab. */
export function LabRow({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <div className="lab-row">
      {label && <div className="t-label lab-row__label">{label}</div>}
      <div className="lab-row__body">{children}</div>
    </div>
  )
}
