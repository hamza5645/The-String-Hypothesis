import { useId, useRef, type ReactNode } from 'react'
import { tick } from '@/core/audio'

/**
 * A logarithmic slider for lengths (value = log10 of meters). Larger lengths sit on the left and
 * smaller on the right, like the zoom tape, so moving right always means "look closer".
 * Keyboard: ←/→ (or ↑/↓) = 0.1 decade, PgUp/PgDn = 1 decade, Home/End = the ends.
 * Optional shaded zones (e.g. excluded / probed / unexplored) under the track.
 */
export interface Zone {
  from: number
  to: number
  kind: 'excluded' | 'probed' | 'open'
  label: string
}

export function LogSlider({
  label,
  value,
  min,
  max,
  onChange,
  format,
  describe,
  disabled = false,
  zones,
  note,
  buttons = false,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  format: (v: number) => string
  describe?: string
  disabled?: boolean
  zones?: Zone[]
  /** Shown under the track in place of the zone legend (e.g. a warning about the current value). */
  note?: ReactNode
  buttons?: boolean
}) {
  const id = useId()
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const pos = Math.min(1, Math.max(0, (max - value) / (max - min)))
  const at = (v: number) => (max - v) / (max - min)
  const clampV = (v: number) => Math.max(min, Math.min(max, v))
  const set = (v: number) => {
    const c = clampV(v)
    if (Math.floor(c) !== Math.floor(value)) tick(c < -19 ? 440 : 760)
    onChange(c)
  }
  const fromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)))
    return max - p * (max - min)
  }
  const text = format(value)
  return (
    <div className={`ctl sd-slider${disabled ? ' is-disabled' : ''}`} style={{ ['--pos' as string]: pos }}>
      <div className="ctl__top">
        <span id={id} className="t-label ctl__label">
          {label}
        </span>
        <output className="ctl__value t-mono" aria-live="off">
          {text}
        </output>
      </div>
      <div className="sd-slider__row">
        {buttons && (
          <button type="button" className="sd-slider__btn" onClick={() => set(value + 1)} disabled={disabled || value >= max} aria-label="Zoom out one decade">
            −
          </button>
        )}
        <div
          ref={track}
          className="sd-slider__track"
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={id}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos * 100)}
          aria-valuetext={text}
          aria-disabled={disabled || undefined}
          aria-description={describe}
          data-ui
          onKeyDown={(e) => {
            if (disabled) return
            const k = e.key
            let v: number | null = null
            if (k === 'ArrowRight' || k === 'ArrowUp') v = value - 0.1
            else if (k === 'ArrowLeft' || k === 'ArrowDown') v = value + 0.1
            else if (k === 'PageUp') v = value - 1
            else if (k === 'PageDown') v = value + 1
            else if (k === 'Home') v = max
            else if (k === 'End') v = min
            if (v != null) {
              e.preventDefault()
              set(v)
            }
          }}
          onPointerDown={(e) => {
            if (disabled) return
            drag.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            set(fromX(e.clientX))
          }}
          onPointerMove={(e) => {
            if (drag.current) set(fromX(e.clientX))
          }}
          onPointerUp={(e) => {
            drag.current = false
            e.currentTarget.releasePointerCapture?.(e.pointerId)
          }}
          onPointerCancel={() => (drag.current = false)}
        >
          {zones?.map((z) => (
            <span
              key={z.kind}
              className={`sd-zone sd-zone--${z.kind}`}
              style={{ left: `${at(z.from) * 100}%`, width: `${(at(z.to) - at(z.from)) * 100}%` }}
              aria-hidden="true"
            >
              <span className="sd-zone__label">{z.label}</span>
            </span>
          ))}
          <span className="sd-slider__rail" aria-hidden="true" />
          <span className="sd-slider__fill" aria-hidden="true" />
          <span className="sd-slider__thumb" aria-hidden="true" />
        </div>
        {buttons && (
          <button type="button" className="sd-slider__btn" onClick={() => set(value - 1)} disabled={disabled || value <= min} aria-label="Zoom in one decade">
            +
          </button>
        )}
      </div>
      {note ? (
        <p className="sd-slider__note" role="status">
          {note}
        </p>
      ) : zones && (
        <div className="sd-zones-legend" aria-hidden="true">
          {zones.map((z) => (
            <span key={z.kind}>
              <i className={`sd-zone--${z.kind}`} />
              {z.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
