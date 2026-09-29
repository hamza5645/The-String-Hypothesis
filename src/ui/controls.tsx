import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { tick } from '../core/audio'

/**
 * Instrument-panel controls. Hairline, mono labels, tabular readouts.
 * All are controlled components; keep their values in the chapter's own zustand store
 * so the Scene (inside the canvas) can read them too.
 */

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 0.001,
  onChange,
  format,
  log = false,
  ticks,
  describe,
}: {
  id?: string
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  /** Readout text for the current value. */
  format?: (v: number) => ReactNode
  /** Logarithmic mapping (min/max must be > 0). */
  log?: boolean
  /** Optional labelled tick marks at values. */
  ticks?: { value: number; label?: string }[]
  /** Accessible description of what the slider changes. */
  describe?: string
}) {
  const auto = useId()
  const cid = id ?? auto
  const toPos = (v: number) => (log ? (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min)) : (v - min) / (max - min))
  const fromPos = (p: number) => (log ? Math.exp(Math.log(min) + p * (Math.log(max) - Math.log(min))) : min + p * (max - min))
  const pos = Math.min(1, Math.max(0, toPos(value)))
  const resolution = log ? 1000 : Math.max(1, Math.round((max - min) / step))
  return (
    <div className="ctl ctl-slider" style={{ ['--pos' as string]: pos }}>
      <div className="ctl__top">
        <label className="t-label ctl__label" htmlFor={cid}>
          {label}
        </label>
        <output className="ctl__value t-mono" htmlFor={cid}>
          {format ? format(value) : value.toFixed(2)}
        </output>
      </div>
      <div className="ctl-slider__track">
        <input
          id={cid}
          type="range"
          min={0}
          max={resolution}
          step={1}
          value={Math.round(pos * resolution)}
          aria-valuetext={typeof format?.(value) === 'string' ? (format!(value) as string) : String(value)}
          aria-description={describe}
          onChange={(e) => {
            const p = Number(e.currentTarget.value) / resolution
            let v = fromPos(p)
            if (!log && step) v = Math.round(v / step) * step
            onChange(v)
          }}
        />
        <span className="ctl-slider__fill" aria-hidden="true" />
        <span className="ctl-slider__thumb" aria-hidden="true" />
        {ticks?.map((t) => (
          <span
            key={t.value}
            className={`ctl-slider__tick${toPos(t.value) < 0.1 ? ' is-start' : toPos(t.value) > 0.9 ? ' is-end' : ''}`}
            style={{ ['--tp' as string]: toPos(t.value) }}
            aria-hidden="true"
          >
            {t.label && <span className="ctl-slider__ticklabel">{t.label}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  sound = true,
}: {
  label?: ReactNode
  value: T
  options: { value: T; label: ReactNode; hint?: string }[]
  onChange: (v: T) => void
  sound?: boolean
}) {
  const gid = useId()
  const row = useRef<HTMLDivElement>(null)
  const pick = (i: number) => {
    if (sound) tick(660 + i * 110)
    onChange(options[i].value)
  }
  // radio-group pattern: one tab stop (the checked option), arrows move + select, Home/End jump
  const checkedIdx = options.findIndex((o) => o.value === value)
  const tabIdx = checkedIdx >= 0 ? checkedIdx : 0
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = options.length
    let j = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = n - 1
    if (j < 0) return
    e.preventDefault()
    row.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[j]?.focus()
    if (options[j].value !== value) pick(j)
  }
  return (
    <div className="ctl ctl-seg" role="radiogroup" aria-labelledby={label ? gid : undefined}>
      {label && (
        <div className="ctl__top">
          <span id={gid} className="t-label ctl__label">
            {label}
          </span>
        </div>
      )}
      <div ref={row} className="ctl-seg__row">
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={i === tabIdx ? 0 : -1}
            title={o.hint}
            className={`ctl-seg__opt${o.value === value ? ' is-on' : ''}`}
            onClick={() => pick(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
  describe,
}: {
  label: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  describe?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-description={describe}
      className={`ctl ctl-toggle${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="ctl-toggle__track" aria-hidden="true">
        <span className="ctl-toggle__knob" />
      </span>
      <span className="ctl-toggle__label">{label}</span>
    </button>
  )
}

export function Readout({ label, value, unit, tone }: { label: ReactNode; value: ReactNode; unit?: ReactNode; tone?: 'filament' | 'field' | 'ink' }) {
  return (
    <div className={`readout${tone ? ' readout--' + tone : ''}`}>
      <span className="t-label readout__label">{label}</span>
      <span className="readout__value t-mono">
        {value}
        {unit && <span className="readout__unit"> {unit}</span>}
      </span>
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  pressed,
  title,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'ghost' | 'solid'
  pressed?: boolean
  title?: string
}) {
  return (
    <button type="button" className={`btn btn--${variant}${pressed ? ' is-on' : ''}`} aria-pressed={pressed} title={title} onClick={onClick}>
      {children}
    </button>
  )
}
