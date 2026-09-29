import { useEffect, useRef, useState } from 'react'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { PORTRAIT_QUERY } from '@/core/layout'
import { clamp, clamp01, smoothstep } from '@/core/math'
import { clock, prefersReducedMotion } from '@/core/time'
import { Status, Term } from '@/ui'
import { packP, sizeOf, squashB3 } from './timeline'

/*
 * Hairline figures drawn in the DOM (crisp at any DPR, legible, responsive), driven by the same pack
 * progress P as the scene. Scroll-driven parts update on journey events; time-driven parts (the rosette
 * turning, the wave rings ringing, the dials drifting) run a rAF only while their beat is on screen,
 * on the shared stage clock (frozen in screenshots).
 */

function useFigureFrame(range: [number, number], animate: boolean, draw: (P: number, t: number) => void) {
  const h = useChapter()
  const ref = useRef(draw)
  ref.current = draw
  useEffect(() => {
    let raf = 0
    let running = false
    let wasIn = false
    const tick = () => {
      if (!running) return
      ref.current(packP(h.progress()), clock.t)
      raf = requestAnimationFrame(tick)
    }
    // draws only while P is in range, plus one clamped draw on the way out (the figure rests at its first or
    // last state); anywhere else in the journey a scroll event costs one comparison
    const onScroll = (force = false) => {
      const P = packP(h.progress())
      const inRange = P >= range[0] && P <= range[1]
      if (animate && inRange && !running) {
        running = true
        raf = requestAnimationFrame(tick)
      } else if (!inRange && running) {
        running = false
        cancelAnimationFrame(raf)
      }
      if (inRange) ref.current(P, clock.t)
      else if (wasIn || force) ref.current(clamp(P, range[0], range[1]), clock.t)
      wasIn = inRange
    }
    const off = onJourney(() => onScroll())
    onScroll(true)
    // a late first draw once the stage clock has started
    const t0 = window.setTimeout(() => onScroll(true), 400)
    return () => {
      off()
      window.clearTimeout(t0)
      running = false
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h])
}

/** The portrait layout (phones, portrait tablets; the engine's predicate, as in the chapter CSS): figures
 *  switch to their compact layouts. */
const PORTRAIT_Q = PORTRAIT_QUERY
export function usePortrait() {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(PORTRAIT_Q).matches)
  useEffect(() => {
    const q = window.matchMedia(PORTRAIT_Q)
    const f = () => setOn(q.matches)
    q.addEventListener('change', f)
    f()
    return () => q.removeEventListener('change', f)
  }, [])
  return on
}

const ss = (a: number, b: number, x: number) => smoothstep(a, b, x)
const fmt = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2)

/* ───────────────────────── Beat 1 · Ricci rosette ───────────────────────── */

const PETALS = 5
export function Rosette() {
  const petals = useRef<(SVGPathElement | null)[]>([])
  const vals = useRef<HTMLSpanElement>(null)
  const rot = useRef<SVGGElement>(null)
  const root = useRef<HTMLElement>(null)
  useFigureFrame([0.1, 0.19], true, (P, t) => {
    if (root.current) root.current.style.setProperty('--k', ss(0.128, 0.142, P).toFixed(3))
    // Ric(v,v) = Σ K(v, eᵢ) over the 5 planes through v: here K_i = A·cos(θ + 2πi/5), which always sums to 0
    const th = 0.42 * t
    const out: number[] = []
    for (let i = 0; i < PETALS; i++) {
      const K = 0.9 * Math.cos(th + (i * 2 * Math.PI) / PETALS)
      out.push(K)
      const el = petals.current[i]
      if (!el) continue
      const ang = (i * 2 * Math.PI) / PETALS - Math.PI / 2
      const L = 46 + 30 * K
      const wdt = 9 + 3 * Math.abs(K)
      const ca = Math.cos(ang)
      const sa = Math.sin(ang)
      const tipX = ca * L
      const tipY = sa * L
      const mx = ca * L * 0.5
      const my = sa * L * 0.5
      el.setAttribute('d', `M0 0 Q ${(mx - sa * wdt).toFixed(1)} ${(my + ca * wdt).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${(mx + sa * wdt).toFixed(1)} ${(my - ca * wdt).toFixed(1)} 0 0 Z`)
      el.classList.toggle('is-neg', K < 0)
    }
    if (rot.current) rot.current.setAttribute('transform', `rotate(${((th * 180) / Math.PI / 5) % 360})`)
    if (vals.current) {
      // round four, let the fifth close the sum (display only; the true sum is exactly 0)
      const r = out.map((v) => Math.round(v * 100) / 100)
      r[4] = -(r[0] + r[1] + r[2] + r[3])
      vals.current.textContent = r.map(fmt).join('  ')
    }
  })
  return (
    <figure ref={root} className="cy-rosette" aria-label="Ricci rosette: at one point of a curved six-dimensional Calabi–Yau, the bending in the five planes through any direction adds up to zero.">
      <figcaption className="cy-rosette__head t-label">
        <span>One point of a curved 6D Calabi–Yau</span>
        <Status kind="analogy" compact />
      </figcaption>
      <svg viewBox="-100 -100 200 200" className="cy-rosette__svg" aria-hidden="true">
        <circle r="46" className="cy-rosette__ref" />
        <circle r="94" className="cy-rosette__frame" />
        <g ref={rot}>
          {Array.from({ length: PETALS }, (_, i) => (
            <path key={i} ref={(el) => void (petals.current[i] = el)} className="cy-rosette__petal" />
          ))}
        </g>
        <circle r="2.2" className="cy-rosette__v" />
        <text x="6" y="-6" className="cy-rosette__vlabel">
          v
        </text>
      </svg>
      <div className="cy-rosette__vals t-mono" aria-hidden="true">
        <span ref={vals} />
      </div>
      <div className="cy-rosette__sum t-label">Σ bending through this direction = 0</div>
      <div className="cy-rosette__cap t-label">
        <Term id="ricci-flat">Ricci-flat</Term>: bending cancels in every direction
      </div>
    </figure>
  )
}

/* ───────────────────────── Beat 1 · timeline ───────────────────────── */

export function Timeline() {
  const root = useRef<HTMLDivElement>(null)
  useFigureFrame([0.08, 0.19], false, (P) => {
    root.current?.style.setProperty('--k', ss(0.138, 0.168, P).toFixed(3))
  })
  // positions on a 1950–1990 axis; labels hang from their ticks (first left-aligned, last right-aligned)
  const items = [
    { y: '1954–57', l: 'Calabi conjectures', pos: 0.1, a: 'start' },
    { y: '1977–78', l: 'Yau’s proof', pos: 0.69, a: 'mid' },
    { y: '1985', l: 'Physics adopts', pos: 0.875, a: 'end' },
  ]
  return (
    <div ref={root} className="cy-timeline" aria-label="Timeline: 1954 to 57, Calabi conjectures; 1977 to 78, Yau's proof; 1985, physics adopts.">
      {/* phones: the rosette's caption moves here, full width, above the timeline */}
      <p className="cy-timeline__cap t-label">
        <Term id="ricci-flat">Ricci-flat</Term>: bending cancels in every direction
      </p>
      <div className="cy-timeline__track">
        <div className="cy-timeline__line" aria-hidden="true" />
        {items.map((it) => (
          <div key={it.y} className={`cy-timeline__item cy-timeline__item--${it.a}`} style={{ ['--p' as string]: it.pos }}>
            <span className="cy-timeline__tick" aria-hidden="true" />
            <span className="cy-timeline__year t-mono">{it.y}</span>
            <span className="cy-timeline__label t-label">{it.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Beat 3 · wave rings + mass ladder ───────────────────────── */

const RING_R = 17
const AMP = 6
const ROW = 52
// standing wave m on a ring: r(a, t) = R + A·cos(m·a)·cos(ωt); its 2m nodes (cos(m·a) = 0) never move
const nodesOf = (m: number, R: number) =>
  Array.from({ length: 2 * m }, (_, k) => {
    const a = ((2 * k + 1) * Math.PI) / (2 * m)
    return { x: R * Math.cos(a), y: R * Math.sin(a) }
  })
const RINGS = [
  { m: 0, tag: ['Zero wiggle', '→ massless'] },
  { m: 1, tag: ['Wigglier', '→ heavier'] },
  { m: 2, tag: ['Wigglier', '→ heavier'] },
]

export function WaveLadder() {
  const portrait = usePortrait()
  const waves = useRef<(SVGPathElement | null)[]>([])
  const lobes = useRef<(SVGPathElement | null)[]>([])
  const rungs = useRef<(SVGGElement | null)[]>([])
  const leaders = useRef<(SVGLineElement | null)[]>([])
  const root = useRef<HTMLElement>(null)
  const lay = useRef(portrait)
  lay.current = portrait
  useFigureFrame([0.3, 0.5], true, (P, t) => {
    const el = root.current
    if (!el) return
    // rings stay until the warm pattern has spread over the slice, then recede together with their leaders
    el.style.setProperty('--inset', (ss(0.322, 0.332, P) * (1 - ss(0.388, 0.402, P))).toFixed(3))
    el.style.setProperty('--ladder', (ss(0.322, 0.334, P) * (1 - ss(0.462, 0.47, P))).toFixed(3))
    el.style.setProperty('--frozen', (ss(0.41, 0.418, P) * (1 - ss(0.462, 0.47, P))).toFixed(3))
    const reduced = prefersReducedMotion()
    const R = lay.current ? 13 : RING_R
    const A = lay.current ? 4.6 : AMP
    for (let m = 0; m < 3; m++) {
      const w = waves.current[m]
      if (!w) continue
      let d = ''
      const amp = m === 0 ? 0 : A * Math.cos((reduced ? 0 : t) * (1.6 + 0.9 * m))
      // the uniform (m = 0) pattern rides just outside the ring, so the Field ring stays visible under it
      const r0 = m === 0 ? R + (lay.current ? 1.5 : 2) : R
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * 2 * Math.PI
        const r = r0 + amp * Math.cos(m * a)
        d += `${i ? 'L' : 'M'}${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
      }
      w.setAttribute('d', d + 'Z')
      // crests and troughs: the area between the wave and the ring (even-odd), so the wavelengths can be counted
      lobes.current[m]?.setAttribute('d', m === 0 ? '' : `${d}Z M${R} 0 A${R} ${R} 0 1 0 ${-R} 0 A${R} ${R} 0 1 0 ${R} 0Z`)
    }
    if (lay.current) return
    // rungs at 0, 1/R, 2/R — spacing ∝ 1/size while the picture is squashed (illustrative); zero stays pinned
    const size = sizeOf(squashB3(P))
    for (let k = 0; k < 3; k++) {
      const y = (-k * ROW) / size
      const g = rungs.current[k]
      if (g && k > 0) g.setAttribute('transform', `translate(0 ${y.toFixed(1)})`)
      // leader from each ring to its rung (it follows the rung when it slides)
      const l = leaders.current[k]
      if (l) {
        l.setAttribute('y1', String(-k * ROW))
        l.setAttribute('y2', y.toFixed(1))
      }
    }
  })
  const label = (lines: string[], x: number, y: number, anchor: 'end' | 'middle', zero: boolean) =>
    lines.map((ln, i) => (
      <text key={i} x={x} y={y + i * 13} textAnchor={anchor} className={`cy-ladder__tag${zero ? ' is-zero' : ''}`}>
        {ln}
      </text>
    ))
  return (
    <figure
      ref={root}
      className={`cy-ladder${portrait ? ' cy-ladder--strip' : ''}`}
      aria-label="Standing waves around a ring with zero, one and two wavelengths. The zero-wiggle pattern is massless; wigglier patterns are heavier. Mass ladder with rungs at 0, 1 over R and 2 over R."
    >
      {portrait ? (
        // phones: the three rings in a row, above the beat text
        <svg viewBox="0 0 330 74" className="cy-ladder__svg" aria-hidden="true">
          <g className="cy-ladder__rings">
            {RINGS.map((r, i) => (
              <g key={r.m} transform={`translate(${55 + i * 110} 20)`}>
                <path ref={(el) => void (lobes.current[r.m] = el)} className="cy-ladder__lobe" />
                <path ref={(el) => void (waves.current[r.m] = el)} className={`cy-ladder__wave${r.m === 0 ? ' is-zero' : ''}`} />
                <circle r={13} className="cy-ladder__ring" />
                {nodesOf(r.m, 13).map((n, k) => (
                  <circle key={k} cx={n.x} cy={n.y} r={1.7} className="cy-ladder__node" />
                ))}
                {label(r.tag, 0, 48, 'middle', r.m === 0)}
              </g>
            ))}
          </g>
        </svg>
      ) : (
        <svg viewBox="-160 -136 300 162" className="cy-ladder__svg" aria-hidden="true">
          {/* rings (inset callback to chapter 05: Ink quantum waves on a Field circle), each tied to its rung by a leader */}
          <g className="cy-ladder__rings">
            {RINGS.map((r) => (
              <g key={r.m}>
                <line
                  ref={(el) => void (leaders.current[r.m] = el)}
                  x1={-40 + RING_R + AMP + 3}
                  x2={40 - 14}
                  y1={-r.m * ROW}
                  y2={-r.m * ROW}
                  className="cy-ladder__leader"
                />
                <g transform={`translate(-40 ${-r.m * ROW})`}>
                  <path ref={(el) => void (lobes.current[r.m] = el)} className="cy-ladder__lobe" />
                  <path ref={(el) => void (waves.current[r.m] = el)} className={`cy-ladder__wave${r.m === 0 ? ' is-zero' : ''}`} />
                  {/* the Field ring (the hidden circle itself) is drawn over its wave, as in chapter 05 */}
                  <circle r={RING_R} className="cy-ladder__ring" />
                  {nodesOf(r.m, RING_R).map((n, k) => (
                    <circle key={k} cx={n.x} cy={n.y} r={1.8} className="cy-ladder__node" />
                  ))}
                  {label(r.tag, -RING_R - AMP - 8, -8, 'end', r.m === 0)}
                  <text x={-RING_R - AMP - 8} y="19" textAnchor="end" className="cy-ladder__n">
                    {r.m} wavelength{r.m === 1 ? '' : 's'}
                  </text>
                </g>
              </g>
            ))}
          </g>
          {/* ladder */}
          <g className="cy-ladder__axis" transform="translate(40 0)">
            <line x1="0" y1="10" x2="0" y2="-130" />
            <text x="-7" y="-124" textAnchor="end" className="cy-ladder__title">
              mass
            </text>
            {[0, 1, 2].map((k) => (
              <g key={k} ref={(el) => void (rungs.current[k] = el)} transform={`translate(0 ${-k * ROW})`}>
                <line x1="-10" x2="10" y1="0" y2="0" className={k === 0 ? 'is-zero' : ''} />
                <text x="16" y="4" className="cy-ladder__rung">
                  {k === 0 ? 'm = 0' : k === 1 ? '1/R' : '2/R'}
                </text>
              </g>
            ))}
          </g>
        </svg>
      )}
      {!portrait && <div className="cy-ladder__foot t-label">Mass ladder · spacing ∝ 1/size · illustrative</div>}
      <div className="cy-ladder__frozen t-label">
        Handles (this slice): <b>6</b> · unchanged
      </div>
    </figure>
  )
}

/* ───────────────────────── Beat 4 · the ledger (100 vs 3) ───────────────────────── */

/*
 * Glyphs (ring, ticks, family quads) live in one SVG so the ticks can fly into the columns; every word and
 * number is HTML laid over it at a fixed CSS size (≥ 11 px), so nothing shrinks with the figure on phones.
 * Two layouts: desktop (400 × 400) and portrait (300 × 260, full column width above the beat text).
 */
interface LedgerLayout {
  w: number
  h: number
  ring: [number, number]
  grid: [number, number, number] // x0, y0, pitch
  col: [number, number, number, number] // x0, bottom row y, pitch x, pitch y
  quad: number // quad scale
  base: [number, number, number] // x1, x2, y
  obs: number // x of the observed column
  ty: number // x of the Tian–Yau column
  L: Record<'h11' | 'h21' | 'badge' | 'pair' | 'count' | 'gen' | 'three' | 'obsChip' | 'ty', [number, number]>
}
const LEDGER: Record<'desk' | 'port', LedgerLayout> = {
  desk: {
    w: 400,
    h: 400,
    ring: [26, 66],
    grid: [88, 36, 8],
    col: [90, 380, 12, 12],
    quad: 1,
    base: [76, 396, 392],
    obs: 194,
    ty: 306,
    L: {
      h11: [4, 2],
      h21: [84, 2],
      badge: [196, 26],
      pair: [196, 80],
      count: [158, 140],
      gen: [158, 184],
      three: [208, 318],
      obsChip: [208, 362],
      ty: [300, 312],
    },
  },
  port: {
    w: 300,
    h: 250,
    ring: [16, 58],
    grid: [64, 26, 7.5],
    col: [66, 238, 9.5, 7.2],
    quad: 0.7,
    base: [54, 298, 246],
    obs: 128,
    ty: 228,
    L: {
      h11: [0, 0],
      h21: [62, 0],
      badge: [156, 20],
      pair: [156, 56],
      count: [120, 100],
      gen: [120, 128],
      three: [140, 184],
      obsChip: [140, 223],
      ty: [214, 182],
    },
  },
}
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`

/** The ledger picks its layout from its own width (phones and mid-width screens get the compact one). */
function useNarrow(ref: React.RefObject<HTMLElement | null>, below: number) {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(PORTRAIT_Q).matches)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < below))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, below])
  return narrow
}

export function Ledger() {
  const root = useRef<HTMLElement>(null)
  const portrait = useNarrow(root, 400)
  const lay = portrait ? LEDGER.port : LEDGER.desk
  const layRef = useRef(lay)
  layRef.current = lay
  const ring = useRef<SVGGElement>(null)
  const ticks = useRef<(SVGLineElement | null)[]>([])
  const fams = useRef<(SVGGElement | null)[]>([])
  const obs = useRef<(SVGGElement | null)[]>([])
  const ty = useRef<(SVGGElement | null)[]>([])
  const counter = useRef<HTMLSpanElement>(null)
  // short phones: the ledger can be taller than the room left above the beat text. Its cell then clips it
  // (CSS) and the view follows the build-up: counts first, then down to the 100-vs-3 landing and its notes.
  // Scroll-linked like everything else here, never a nested scroller.
  const view = useRef({ over: 0, P: 0 })
  const viewAt = useRef((P: number) => {
    const el = root.current
    const cell = el?.parentElement
    if (!el || !cell) return
    const v = view.current
    v.P = P
    const y = v.over * ss(0.515, 0.575, P)
    el.style.setProperty('--cy-lpan', `${y.toFixed(1)}px`)
    // soft edges only where something is cut off
    cell.style.setProperty('--cy-ft', `${Math.min(16, y).toFixed(1)}px`)
    cell.style.setProperty('--cy-fb', `${Math.min(16, v.over - y).toFixed(1)}px`)
  })
  useEffect(() => {
    const el = root.current
    const cell = el?.parentElement
    if (!el || !cell) return
    const ro = new ResizeObserver(() => {
      const pad = parseFloat(getComputedStyle(cell).paddingTop) || 0
      view.current.over = Math.max(0, Math.round(el.offsetHeight + pad - cell.clientHeight))
      viewAt.current(view.current.P)
    })
    ro.observe(el)
    ro.observe(cell)
    return () => ro.disconnect()
  }, [])
  useFigureFrame([0.44, 0.64], false, (P) => {
    const el = root.current
    if (!el) return
    viewAt.current(P)
    const Ly = layRef.current
    const [gx, gy, gp] = Ly.grid
    const tickPos = (i: number) => (i < 100 ? { x: gx + (i % 10) * gp, y: gy + Math.floor(i / 10) * gp } : { x: gx + 10 * gp + 4, y: gy + 9 * gp })
    const [cx0, cy0, cpx, cpy] = Ly.col
    const famPos = (i: number) => ({ x: cx0 + (i % 5) * cpx, y: cy0 - Math.floor(i / 5) * cpy })
    const R = prefersReducedMotion()
    const k = (a: number, b: number) => (R ? (P >= a ? 1 : 0) : ss(a, b, P))
    el.style.setProperty('--title', k(0.462, 0.472).toFixed(3))
    el.style.setProperty('--badge', k(0.49, 0.5).toFixed(3))
    // the pair-off caption clears before the counter arrives beside the column
    el.style.setProperty('--pair', (k(0.502, 0.51) * (1 - k(0.536, 0.548))).toFixed(3))
    el.style.setProperty('--gen', k(0.545, 0.556).toFixed(3))
    el.style.setProperty('--obs', k(0.572, 0.582).toFixed(3))
    el.style.setProperty('--ty', k(0.6, 0.61).toFixed(3))
    // h¹¹: the ring; h²¹: 101 ticks drawn in sequence
    const draw = k(0.464, 0.494)
    const pairT = k(0.504, 0.528) // ring + the 101st tick fly together and fade
    const t100 = tickPos(100)
    const [rx, ry] = Ly.ring
    if (ring.current) {
      const x = rx + (t100.x - rx) * 0.5 * pairT
      const y = ry + (t100.y - ry) * 0.5 * pairT
      ring.current.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
      ring.current.style.opacity = (k(0.462, 0.47) * (1 - smoothstep(0.7, 1, pairT))).toFixed(3)
    }
    let landed = 0
    for (let i = 0; i < 101; i++) {
      const tk = ticks.current[i]
      if (!tk) continue
      const on = R ? draw : clamp01((draw * 101 - i) / 6)
      const tp = tickPos(i)
      let x = tp.x
      let y = tp.y
      let o = on
      if (i === 100) {
        x += (rx - x) * 0.5 * pairT
        y += (ry - y) * 0.5 * pairT
        o *= 1 - smoothstep(0.7, 1, pairT)
      } else {
        // each tick turns into a family glyph (cascade)
        const c = R ? k(0.53, 0.57) : clamp01(ss(0.53, 0.57, P) * 1.6 - (i / 100) * 0.6)
        o *= 1 - c
        if (c >= 0.98) landed++
        const f = fams.current[i]
        if (f) {
          const fp = famPos(i)
          f.setAttribute('transform', `translate(${(x + (fp.x - x) * c).toFixed(1)} ${(y + (fp.y - y) * c).toFixed(1)}) scale(${Ly.quad})`)
          f.style.opacity = c.toFixed(3)
        }
      }
      tk.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
      tk.style.opacity = o.toFixed(3)
    }
    // the counter only counts glyphs that have actually landed in the column
    if (counter.current) counter.current.textContent = String(R ? (k(0.53, 0.57) >= 1 ? 100 : 0) : landed).padStart(3, '\u2007')
    const rise = (arr: (SVGGElement | null)[], a: number, b: number) =>
      arr.forEach((g, i) => {
        if (!g) return
        const v = R ? k(a, b) : clamp01(ss(a, b, P) * 1.5 - i * 0.2)
        g.style.opacity = v.toFixed(3)
        g.setAttribute('transform', `translate(0 ${((1 - v) * 14).toFixed(1)})`)
      })
    rise(obs.current, 0.572, 0.594)
    rise(ty.current, 0.6, 0.616)
  })

  const Quad = ({ kind }: { kind: 'q' | 'o' }) => (
    <>
      <circle cx="0" cy="0" r="1.9" className={`cy-q cy-q--${kind}`} />
      <circle cx="5" cy="0" r="1.9" className={`cy-q cy-q--${kind}`} />
      <circle cx="0" cy="5" r="1.9" className={`cy-q cy-q--${kind}`} />
      <circle cx="5" cy="5" r="1.9" className={`cy-q cy-q--${kind}`} />
    </>
  )
  const at = (key: keyof LedgerLayout['L']) => ({ left: pct(lay.L[key][0], lay.w), top: pct(lay.L[key][1], lay.h) })
  const [cx0, cy0, , cpy] = lay.col
  const short = (x: number, kind: 'o' | 'q', refs: typeof obs) =>
    [0, 1, 2].map((i) => (
      <g key={i} ref={(el) => void (refs.current[i] = el)} style={{ opacity: 0 }}>
        {/* a short column: one quad wide, three high, on the same baseline as the tall one */}
        <g transform={`translate(${x} ${cy0 - i * cpy}) scale(${lay.quad})`}>
          <Quad kind={kind} />
        </g>
      </g>
    ))

  return (
    <figure
      ref={root}
      className={`cy-ledger${portrait ? ' cy-ledger--port' : ''}`}
      aria-label="Ledger. The full 6D quintic has h11 = 1 and h21 = 101, so chi = 2 times (1 minus 101) = minus 200. One family and one anti-family pair up; 100 generations remain in the simplest recipe. Observed: 3. The Tian–Yau manifold divided by Z3 has chi = minus 6, giving 3."
    >
      <div className="cy-ledger__title t-label">
        {portrait ? (
          'Full 6D quintic · cannot be drawn'
        ) : (
          <>
            The full 6D quintic · hole counts
            <br />
            <span className="cy-ledger__sub">(cannot be drawn)</span>
          </>
        )}
      </div>
      <div className="cy-ledger__stage" style={{ aspectRatio: `${lay.w} / ${lay.h}` }}>
        <svg viewBox={`0 0 ${lay.w} ${lay.h}`} className="cy-ledger__svg" aria-hidden="true">
          <g ref={ring}>
            <circle r={portrait ? 7 : 8} className="cy-ledger__ring" />
          </g>
          {Array.from({ length: 101 }, (_, i) => (
            <line key={i} ref={(el) => void (ticks.current[i] = el)} x1="0" y1={portrait ? -2.6 : -3} x2="0" y2={portrait ? 2.6 : 3} className="cy-ledger__tick" style={{ opacity: 0 }} />
          ))}
          <line x1={lay.base[0]} x2={lay.base[1]} y1={lay.base[2]} y2={lay.base[2]} className="cy-ledger__base" />
          {Array.from({ length: 100 }, (_, i) => (
            <g key={i} ref={(el) => void (fams.current[i] = el)} style={{ opacity: 0 }} transform={`translate(${cx0} ${cy0})`}>
              <Quad kind="q" />
            </g>
          ))}
          {short(lay.obs, 'o', obs)}
          {short(lay.ty, 'q', ty)}
        </svg>
        <div className="cy-ledger__l cy-ledger__k" style={at('h11')}>
          h¹¹ = 1
        </div>
        <div className="cy-ledger__l cy-ledger__k" style={at('h21')}>
          h²¹ = 101
        </div>
        <div className="cy-ledger__l cy-ledger__badge" style={at('badge')}>
          χ = 2(h¹¹ − h²¹)
          <br />= 2(1 − 101) = <b className="cy-ledger__hl">−200</b>
        </div>
        <div className="cy-ledger__l cy-ledger__pair" style={at('pair')}>
          Family + anti-family pair up · can become heavy
        </div>
        <div className="cy-ledger__l cy-ledger__count" style={at('count')}>
          <span ref={counter}>{'\u2007\u20070'}</span>
        </div>
        <div className="cy-ledger__l cy-ledger__gen" style={at('gen')}>
          Simplest recipe:
          <br />
          100 generations · <span className="cy-sym cy-nowrap">|χ|/2</span>
          <span className="cy-ledger__e6">(families of an E₆ grand-unified model)</span>
        </div>
        <div className="cy-ledger__l cy-ledger__three" style={at('three')}>
          3
        </div>
        <div className="cy-ledger__l cy-ledger__obschip" style={at('obsChip')}>
          <Status kind="observed" compact />
        </div>
        <div className="cy-ledger__l cy-ledger__ty" style={at('ty')}>
          Tian–Yau ÷ ℤ₃
          <br />
          <span className="cy-sym">χ = −6</span> → 3
        </div>
      </div>
      <div className="cy-ledger__notes">
        <p className="cy-ledger__obsnote">
          <Status kind="observed" compact /> <span>Z-boson decays: 2.996 ± 0.007 light neutrino types</span>
        </p>
        <p className="cy-ledger__tynote">
          <Status kind="derived" compact /> <span>Three is necessary, not sufficient</span>
        </p>
      </div>
    </figure>
  )
}

/* ───────────────────────── Beat 5 · moduli dials ───────────────────────── */

const SMALL = 101
export function Dials() {
  const root = useRef<HTMLElement>(null)
  const needles = useRef<(SVGLineElement | null)[]>([])
  const big = useRef<SVGLineElement>(null)
  const pos = (i: number) => {
    // 101 small dials on three concentric arcs
    const ring = i < 29 ? 0 : i < 63 ? 1 : 2
    const idx = ring === 0 ? i : ring === 1 ? i - 29 : i - 63
    const cnt = ring === 0 ? 29 : ring === 1 ? 34 : 38
    const R = 122 + ring * 26
    const a = Math.PI * (1.08 + (0.84 * idx) / (cnt - 1))
    return { x: Math.cos(a) * R, y: Math.sin(a) * R }
  }
  useFigureFrame([0.6, 0.72], true, (P, t) => {
    const el = root.current
    if (!el) return
    const R = prefersReducedMotion()
    const lock = P >= 0.67 ? 1 : 0
    el.style.setProperty('--lock', String(lock))
    el.style.setProperty('--in', ss(0.618, 0.63, P).toFixed(3))
    const tt = R ? 0 : t
    for (let i = 0; i < SMALL; i++) {
      const n = needles.current[i]
      if (!n) continue
      const base = (i * 137.5) % 360
      const drift = 40 * Math.sin(tt * (0.25 + (i % 7) * 0.05) + i)
      const fixed = (i * 53) % 360
      n.setAttribute('transform', `rotate(${(lock ? fixed : base + drift).toFixed(1)})`)
    }
    if (big.current) big.current.setAttribute('transform', `rotate(${lock ? 38 : (-60 + 50 * Math.sin(tt * 0.3)).toFixed(1)})`)
  })
  return (
    <figure ref={root} className="cy-dials" aria-label="Moduli of the quintic: one size dial and 101 shape dials. Their settings would set masses and couplings. How they are fixed is debated.">
      <svg viewBox="-190 -200 380 250" className="cy-dials__svg" aria-hidden="true">
        {Array.from({ length: SMALL }, (_, i) => {
          const p = pos(i)
          return (
            <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
              <circle r="6.2" className="cy-dial" />
              <line ref={(el) => void (needles.current[i] = el)} x1="0" y1="0" x2="0" y2="-5" className="cy-dial__needle" />
            </g>
          )
        })}
        <g transform="translate(0 -10)">
          <circle r="42" className="cy-dial cy-dial--big" />
          {Array.from({ length: 24 }, (_, i) => (
            <line key={i} x1="0" y1="-42" x2="0" y2={i % 6 === 0 ? -35 : -38} transform={`rotate(${i * 15})`} className="cy-dial__tick" />
          ))}
          <line ref={big} x1="0" y1="4" x2="0" y2="-34" className="cy-dial__needle cy-dial__needle--big" />
          <circle r="2.4" className="cy-dial__hub" />
          <text y="62" textAnchor="middle" className="cy-dials__lbl cy-dials__lbl--size">
            Size ×1
          </text>
        </g>
        <text x="0" y="-186" textAnchor="middle" className="cy-dials__lbl">
          Shape ×101
        </text>
        <g className="cy-dials__lock" transform="translate(0 30)">
          <rect x="-7" y="-2" width="14" height="10" rx="1.5" />
          <path d="M-4.5 -2 v-3.5 a4.5 4.5 0 0 1 9 0 v3.5" />
        </g>
      </svg>
      <div className="cy-dials__foot">
        <p className="t-label cy-dials__read">Masses, couplings: would shift · not computed here</p>
        <p className="cy-dials__how">
          <Status kind="speculative" compact /> <span className="t-label">How: still debated</span>
        </p>
      </div>
    </figure>
  )
}
