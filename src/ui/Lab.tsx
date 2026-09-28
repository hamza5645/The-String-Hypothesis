import type { ReactNode } from 'react'
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
  return (
    <Step id={id} length={length} align="wide" valign="bottom" fade className={`step--lab step--lab-${side}`}>
      {hint && (
        <div className="lab-hint t-label" aria-hidden="true">
          <span className="lab-hint__dot" />
          {hint}
        </div>
      )}
      <aside className={`lab lab--${side}`} data-ui data-lenis-prevent aria-label={typeof title === 'string' ? title : 'Lab'}>
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
      </aside>
    </Step>
  )
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
