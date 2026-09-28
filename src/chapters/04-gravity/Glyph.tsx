/*
 * The +/× pattern glyph: a hairline cross whose arms are the stretch / squeeze axes, turned by ψ. At ψ = 0 it
 * is "+", at 45° it is "×", at 90° it is "+" again (half a cycle later) — the glyph *is* the rotation symmetry.
 */
import { useRef, type RefObject } from 'react'

export interface GlyphApi {
  /** Set ψ (radians) and the glyph's opacity; writes to the DOM only when the rounded values change. */
  set: (psi: number) => void
}

export function useGlyph() {
  const g = useRef<SVGGElement>(null)
  const last = useRef(-999)
  const api = useRef<GlyphApi>({
    set: (psi: number) => {
      const deg = Math.round((psi * 180) / Math.PI)
      if (deg === last.current || !g.current) return
      last.current = deg
      g.current.setAttribute('transform', `rotate(${-deg})`)
    },
  })
  return { ref: g, api: api.current }
}

export function PatternGlyph({ gref, tone }: { gref: RefObject<SVGGElement | null>; tone: 'ink' | 'filament' }) {
  return (
    <svg className={`gr-pg gr-pg--${tone}`} viewBox="-22 -22 44 44" aria-hidden="true">
      <circle r="21" className="gr-pg__halo" />
      <g ref={gref}>
        <line x1="-15" y1="0" x2="15" y2="0" />
        <line x1="0" y1="-15" x2="0" y2="15" />
      </g>
    </svg>
  )
}
