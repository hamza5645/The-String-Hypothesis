import { useEffect, useRef, type ReactNode } from 'react'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { Status, type StatusKind } from '@/ui'
import { dictSeam } from './store'

/*
 * Beat 6 — "A web of dualities": a two-column dictionary whose rows arrive with scroll
 * (content/08-duality.md § Beat 6). DOM, not WebGL, so every row and chip stays legible
 * and readable by screen readers. Each row wears its own status.
 */

interface Row {
  a: ReactNode
  b: ReactNode
  status: StatusKind[]
  tag?: string
  note?: ReactNode
  glyph?: ReactNode
}

function Dials() {
  // S-duality: one coupling dial turns up from g = 0.1 while its mirror turns down from 10.
  return (
    <svg className="du-dials" viewBox="0 0 120 30" aria-hidden="true">
      {[0, 1].map((k) => (
        <g key={k} transform={`translate(${15 + k * 64} 15)`}>
          <circle r="10.5" className="du-dials__ring" />
          <path d="M-7.4 7.4 A10.5 10.5 0 1 1 7.4 7.4" className="du-dials__arc" />
          <line x1="0" y1="0" x2="0" y2="-8" className={`du-dials__hand du-dials__hand--${k ? 'down' : 'up'}`} />
          <text x="16" y="3.5" className="du-dials__t">
            {k ? '10' : '0.1'}
          </text>
        </g>
      ))}
      <text x="56" y="18.5" className="du-dials__eq" textAnchor="middle">
        ⟷
      </text>
    </svg>
  )
}

function AdS() {
  // Gauge/gravity: an iso-grid cylinder whose curved surface glows faintly (schematic).
  return (
    <svg className="du-ads" viewBox="0 0 44 34" aria-hidden="true">
      <ellipse cx="22" cy="6" rx="14" ry="4" className="du-ads__rim" />
      <path d="M8 6 V28 A14 4 0 0 0 36 28 V6" className="du-ads__wall" />
      {[11, 16, 21].map((y) => (
        <path key={y} d={`M8 ${y} A14 4 0 0 0 36 ${y}`} className="du-ads__ring" />
      ))}
      {[15, 22, 29].map((x) => (
        <line key={x} x1={x} x2={x} y1={9.6} y2={31.6} className="du-ads__line" />
      ))}
    </svg>
  )
}

const ROWS: Row[] = [
  { a: 'circle of radius R', b: 'circle of radius α′/R', status: ['derived'] },
  { a: 'momentum n', b: 'winding w', status: ['derived'] },
  { a: 'open-string ends free to slide', b: 'ends pinned on a D-brane', status: ['derived'], note: 'how D-branes were found, 1989' },
  { a: 'type IIA on a circle', b: 'type IIB on the dual circle', status: ['derived'] },
  {
    a: 'coupling g (strong)',
    b: 'coupling 1/g (weak)',
    status: ['conjectured'],
    tag: 'S-duality',
    glyph: <Dials />,
    note: (
      <>
        <i className="du-dot du-dot--obs" aria-hidden="true" /> a cousin: Maxwell’s equations in empty space are unchanged by E → B, B → −E
      </>
    ),
  },
  {
    a: 'type IIA on Calabi–Yau X',
    b: 'type IIB on its mirror X̃',
    status: ['derived', 'conjectured'],
    tag: 'mirror symmetry',
    glyph: <span className="du-hodge t-mono">(1, 101) ⟷ (101, 1)</span>,
    note: 'Hodge numbers of the quintic and its mirror · ◑ constructed pairs · ◌ in general',
  },
  {
    a: 'strings + gravity in 5D anti-de Sitter space (× a 5-sphere)',
    b: 'a gauge theory without gravity on its 4D boundary',
    status: ['conjectured'],
    tag: 'Maldacena 1997',
    glyph: <AdS />,
    note: '~ schematic · our universe is not anti-de Sitter: its expansion accelerates',
  },
]

export function Dictionary() {
  const h = useChapter()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let last = -1
    // the "=" column's x, for the Scene's seam hairline (horizontal layout only changes on resize)
    const measure = () => {
      const el = ref.current?.querySelector('.du-dict__eqh')
      if (!el) return
      const r = el.getBoundingClientRect()
      dictSeam.x = r.width > 0 ? r.left + r.width / 2 : -1
      dictSeam.vw = window.innerWidth
    }
    const up = () => {
      const p = h.step('web')
      if (p > 0 && p < 1 && dictSeam.vw !== window.innerWidth) measure()
      if (Math.abs(p - last) < 0.002 || !ref.current) return
      last = p
      ref.current.style.setProperty('--dp', p.toFixed(3))
    }
    const onResize = () => {
      dictSeam.vw = 0
      up()
    }
    up()
    window.addEventListener('resize', onResize)
    const off = onJourney(up)
    return () => {
      off()
      window.removeEventListener('resize', onResize)
    }
  }, [h])

  return (
    <div ref={ref} className="du-dict" role="table" aria-label="A dictionary of dualities: each row pairs two descriptions of one physics">
      <div className="du-dict__head t-label" role="row">
        <span role="columnheader">Description A</span>
        <span className="du-dict__eqh" role="columnheader" aria-label="equals">
          =
        </span>
        <span role="columnheader">Description B</span>
        <span role="columnheader" className="du-dict__sth">
          Status
        </span>
      </div>
      {ROWS.map((row, i) => (
        <div key={i} className={`du-dict__row${row.note || row.glyph ? ' has-note' : ''}`} role="row" style={{ ['--at' as string]: 0.07 + i * 0.05 }}>
          <span className="du-dict__a" role="cell">
            {row.a}
          </span>
          <span className="du-dict__eq" role="cell" aria-label="equals">
            =
          </span>
          <span className="du-dict__b" role="cell">
            {row.b}
          </span>
          <span className="du-dict__st" role="cell">
            {row.status.map((k) => (
              <Status key={k} kind={k} compact />
            ))}
          </span>
          {(row.note || row.glyph || row.tag) && (
            <span className="du-dict__note" role="cell">
              {row.tag && <span className="du-dict__tag t-label">{row.tag}</span>}
              {row.glyph}
              {row.note && <span className="du-dict__notetext t-mono">{row.note}</span>}
            </span>
          )}
        </div>
      ))}
      <div className="du-dict__legend" aria-hidden="true">
        <Status kind="derived" compact />
        <Status kind="conjectured" compact />
        <Status kind="observed" compact />
      </div>
    </div>
  )
}
