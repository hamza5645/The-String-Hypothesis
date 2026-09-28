import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import type { Spin } from './model'

/**
 * Rotate-pattern dial (ψ, 0–360°, soft detents every 45°). role="slider": arrows ±1° (Shift ±15°),
 * PageUp/PageDown ±45°, Home = 0°. The face shows the pattern itself turning (and, dashed, the ψ = 0 ghost),
 * so turning the dial is turning the wave's polarization pattern.
 */
export function Dial({ psi, spin, onChange }: { psi: number; spin: Spin; onChange: (deg: number) => void }) {
  const ref = useRef<SVGSVGElement>(null)
  const drag = useRef(false)
  const set = (v: number) => {
    let d = ((v % 360) + 360) % 360
    const near = Math.round(d / 45) * 45
    if (Math.abs(d - near) < 3) d = near % 360
    onChange(Math.round(d))
  }
  const fromPointer = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = r.top + r.height / 2 - e.clientY
    set((Math.atan2(y, x) * 180) / Math.PI)
  }
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 1
    let v: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = psi + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = psi - step
    else if (e.key === 'PageUp') v = (Math.floor(psi / 45) + 1) * 45
    else if (e.key === 'PageDown') v = (Math.ceil(psi / 45) - 1) * 45
    else if (e.key === 'Home') v = 0
    if (v !== null) {
      e.preventDefault()
      onChange(((Math.round(v) % 360) + 360) % 360)
    }
  }
  const rad = (psi * Math.PI) / 180
  const R = 40
  const nx = 50 + R * Math.cos(rad)
  const ny = 50 - R * Math.sin(rad)
  const ticks = []
  for (let d = 0; d < 360; d += 15) {
    const a = (d * Math.PI) / 180
    const major = d % 45 === 0
    const r0 = major ? 43 : 45
    ticks.push(<line key={d} x1={50 + r0 * Math.cos(a)} y1={50 - r0 * Math.sin(a)} x2={50 + 48 * Math.cos(a)} y2={50 - 48 * Math.sin(a)} className={major ? 'gr-dial__tk gr-dial__tk--M' : 'gr-dial__tk'} />)
  }
  // pattern glyph: spin 2 → stretched ellipse along ψ; spin 1 → shake arrow along ψ; spin 0 → breathing circle
  const glyph =
    spin === 2 ? (
      <>
        <ellipse cx="50" cy="50" rx="22" ry="13" className="gr-dial__ghost" />
        <ellipse cx="50" cy="50" rx="22" ry="13" className="gr-dial__pat" transform={`rotate(${-psi} 50 50)`} />
      </>
    ) : spin === 1 ? (
      <>
        <line x1="30" y1="50" x2="70" y2="50" className="gr-dial__ghost" />
        <g transform={`rotate(${-psi} 50 50)`}>
          <line x1="28" y1="50" x2="72" y2="50" className="gr-dial__pat" />
          <path d="M66 45 L72 50 L66 55" className="gr-dial__pat" />
        </g>
      </>
    ) : (
      <>
        <circle cx="50" cy="50" r="15" className="gr-dial__ghost" />
        <circle cx="50" cy="50" r="19" className="gr-dial__pat" />
      </>
    )
  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      className="gr-dial"
      role="slider"
      tabIndex={0}
      aria-label="Rotate pattern ψ"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(psi)}
      aria-valuetext={`${Math.round(psi)} degrees`}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        drag.current = true
        ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
        fromPointer(e)
      }}
      onPointerMove={(e) => drag.current && fromPointer(e)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
      data-ui
    >
      <circle cx="50" cy="50" r="48" className="gr-dial__ring" />
      {ticks}
      <line x1="50" y1="50" x2={nx} y2={ny} className="gr-dial__needle" />
      {glyph}
      <circle cx={nx} cy={ny} r="3.4" className="gr-dial__knob" />
    </svg>
  )
}
