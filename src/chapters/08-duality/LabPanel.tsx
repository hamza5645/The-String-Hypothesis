import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { pluck } from '@/core/audio'
import { Button, Eq, Segmented } from '@/ui'
import { famTone, famY, lowestFamilies, MAP_FAMILIES, pointFamilies, stack, type Family } from './model'
import { useDuality } from './store'

/*
 * The instrument panel of "The Circle Swap" (content/08-duality.md § Lab).
 * Everything here is computed from model.ts — the same functions the Scene draws from.
 */

const fmt = (v: number, d = 2) => v.toFixed(d)
const sig3 = (v: number) => (v === 0 ? '0' : Math.abs(v) >= 100 ? v.toFixed(0) : v.toPrecision(3))

/** One row of the paired chart: World A's reading (left column) and World B's (right). */
export interface PairRow {
  key: string
  a: number
  b: number
  S: number
  yA: number
  yB: number
  /** stacked segments, bottom → top: [value, tone] with tone 'mom' | 'wind' | 'vib' */
  segA: [number, Tone][]
  segB: [number, Tone][]
}
type Tone = 'mom' | 'wind' | 'vib'

export function usePairs() {
  const r = useDuality((s) => s.r)
  const mode = useDuality((s) => s.mode)
  return useMemo(() => buildPairs(r, mode), [r, mode])
}

function buildPairs(r: number, mode: 'string' | 'point'): { rows: PairRow[]; fams: Family[] } {
  if (mode === 'point') {
    const rows = pointFamilies(r).map((p, i) => ({
      key: `p${i}`,
      a: p.a,
      b: 0,
      S: 0,
      yA: p.yA,
      yB: p.yB,
      segA: [[p.yA, 'mom']] as [number, Tone][],
      segB: [[p.yB, 'mom']] as [number, Tone][],
    }))
    return { rows, fams: [] }
  }
  const fams = lowestFamilies(r)
  const rows = fams.map((f, i) => {
    const st = stack(f.mom, f.wind, f.vib)
    const lo: Tone = st.loIsMom ? 'mom' : 'wind'
    const hi: Tone = st.loIsMom ? 'wind' : 'mom'
    const swap = (t: Tone): Tone => (t === 'mom' ? 'wind' : t === 'wind' ? 'mom' : t)
    const segA: [number, Tone][] = [
      [st.vib, 'vib'],
      [st.lo, lo],
      [st.hi, hi],
    ]
    const segB = segA.map(([v, t]) => [v, swap(t)] as [number, Tone])
    return { key: `s${i}`, a: f.a, b: f.b, S: f.S, yA: f.y, yB: f.y, segA, segB }
  })
  return { rows, fams }
}

// ───────────────────────────── audio (muted unless sound is on) ─────────────────────────────

/**
 * The spectrum as a chord: each of the lowest 6 bars sounds f = 220 Hz × M (string units), tones
 * outside 55–1760 Hz dropped. A jump leaves the chord unchanged to the cent; in point mode World B's
 * chord sounds against World A's and clashes.
 */
function playSpectrum() {
  const { r, mode } = useDuality.getState()
  const tones = (ms: number[]) => ms.map((m) => ({ freq: 220 * m, amp: 1 })).filter((p) => p.freq >= 55 && p.freq <= 1760)
  if (mode === 'point') {
    const pts = pointFamilies(r, 6)
    pluck(220, tones(pts.map((p) => Math.sqrt(p.yA))), { decay: 2.2, gain: 0.3, pan: -0.5 })
    pluck(220, tones(pts.map((p) => Math.sqrt(p.yB))), { decay: 2.2, gain: 0.3, pan: 0.5 })
  } else {
    pluck(220, tones(lowestFamilies(r, 6).map((f) => Math.sqrt(f.y))), { decay: 2.2, gain: 0.35 })
  }
}

// ───────────────────────────── formula ─────────────────────────────

const TEX =
  "M^2=\\htmlClass{term-mom}{\\left(\\frac{n}{R}\\right)^{2}}+\\htmlClass{term-wind}{\\left(\\frac{wR}{\\alpha'}\\right)^{2}}+\\htmlClass{term-vib}{\\frac{2}{\\alpha'}\\,(N+\\tilde N)}"

export function Formula({ row, mode }: { row: PairRow | undefined; mode: 'string' | 'point' }) {
  const r = useDuality((s) => s.r)
  const a = row?.a ?? 0
  const b = row?.b ?? 0
  const S = row?.S ?? 0
  const mom = (a * a) / (r * r)
  const wind = mode === 'point' ? 0 : b * b * r * r
  const vib = mode === 'point' ? 0 : 2 * S
  const y = Math.max(1e-12, mom + wind + vib)
  const hl = { mom: mom / y, wind: wind / y, vib: vib / y }
  const dom = mom >= wind && mom >= vib ? 'mom' : wind >= vib ? 'wind' : 'vib'
  return (
    <div className="du-formula">
      <Eq
        display
        tex={TEX}
        highlight={hl}
        label="M squared equals n over R squared, plus w R over alpha-prime squared, plus two over alpha-prime times N plus N-tilde"
      />
      <div className="du-formula__vals t-mono" aria-hidden="true">
        <span className={`du-c-mom${dom === 'mom' ? ' is-dom' : ''}`}>{sig3(mom)}</span>
        <span className="du-formula__op">+</span>
        <span className={`du-c-wind${dom === 'wind' ? ' is-dom' : ''}`}>{sig3(wind)}</span>
        <span className="du-formula__op">+</span>
        <span className={`du-c-vib${dom === 'vib' ? ' is-dom' : ''}`}>{sig3(vib)}</span>
        <span className="du-formula__op">=</span>
        <span className="du-formula__sum">{sig3(mom + wind + vib)}</span>
      </div>
      <div className="du-formula__lm">
        <Eq tex="N-\tilde N = n\,w" label="N minus N-tilde equals n times w" />
        <span className="t-mono du-formula__lmnote">level matching</span>
      </div>
    </div>
  )
}

/** The Go-deeper form of the mass formula, its terms lit by the state selected in the lab. */
export function DeepFormula() {
  const { rows } = usePairs()
  const mode = useDuality((s) => s.mode)
  const sel = useDuality((s) => s.sel)
  const r = useDuality((s) => s.r)
  const row = rows[sel]
  const a = row?.a ?? 0
  const b = row?.b ?? 0
  const mom = (a * a) / (r * r)
  const wind = mode === 'point' ? 0 : b * b * r * r
  const vib = mode === 'point' ? 0 : 2 * (row?.S ?? 0)
  const y = Math.max(1e-12, mom + wind + vib)
  return (
    <div className="du-dformula">
      <Eq
        display
        tex={DEEP_TEX}
        highlight={{ mom: mom / y, wind: wind / y, vib: vib / y }}
        label="M squared equals momentum term n over R squared, plus winding term w R over alpha-prime squared, plus vibration term two over alpha-prime times N plus N-tilde; with N minus N-tilde equal to n w"
      />
      <p className="du-dformula__note t-mono">
        Lit by the lab: n = {a} · w = {mode === 'point' ? 0 : b} · R = {fmt(r)} ℓs
      </p>
    </div>
  )
}

const DEEP_TEX =
  "M^2 = \\htmlClass{term-mom}{\\underbrace{\\left(\\frac{n}{R}\\right)^2}_{\\text{momentum}}} + \\htmlClass{term-wind}{\\underbrace{\\left(\\frac{wR}{\\alpha'}\\right)^2}_{\\text{winding}}} + \\htmlClass{term-vib}{\\underbrace{\\frac{2}{\\alpha'}\\left(N+\\tilde N\\right)}_{\\text{vibration}}}, \\qquad N-\\tilde N = nw"

// ───────────────────────────── paired bar chart ─────────────────────────────

const CW = 324
const CH = 118
const PADL = 18
const PADT = 12
const PADB = 24
const YMAX = 10.5
const pitch = (CW - PADL - 2) / 16
const colW = 7

export function PairChart({ rows, mode }: { rows: PairRow[]; mode: 'string' | 'point' }) {
  const sel = useDuality((s) => s.sel)
  const setSel = useDuality((s) => s.setSel)
  const r = useDuality((s) => s.r)
  const plotH = CH - PADT - PADB
  const Y = (v: number) => PADT + plotH * (1 - Math.min(v, YMAX) / YMAX)
  const y16 = rows[15]?.yA ?? 0
  const tag = mode === 'string' && y16 < 3 ? (r > 1 ? 'A NEW LARGE DIRECTION OPENING' : 'THE DUAL DIRECTION OPENING') : null
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setSel(sel + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setSel(sel - 1)
    else if (e.key === 'Home') setSel(0)
    else if (e.key === 'End') setSel(15)
    else return
    e.preventDefault()
  }
  const cur = rows[sel]
  const label = cur
    ? `Paired bar chart of the sixteen lightest ${mode === 'point' ? 'point-particle' : 'string'} states. Selected pair ${sel + 1}: World A height ${fmt(cur.yA)}, World B height ${fmt(cur.yB)}. Use arrow keys to pick a pair.`
    : 'Paired bar chart'

  const col = (x: number, segs: [number, Tone][], total: number, key: string) => {
    let acc = 0
    const out = segs.map(([v, t], j) => {
      if (v <= 0 || acc >= YMAX) {
        acc += v
        return <rect key={j} className={`du-seg du-seg--${t}`} x={x} y={Y(acc)} width={colW} height={0} />
      }
      const y0 = Y(acc)
      acc += v
      const y1 = Y(acc)
      return <rect key={j} className={`du-seg du-seg--${t}`} x={x} y={y1} width={colW} height={Math.max(0, y0 - y1)} />
    })
    return (
      <g key={key}>
        {out}
        {total > YMAX && (
          <text className="du-chart__clip" x={x + colW / 2} y={PADT - 1} textAnchor="middle">
            ↑
          </text>
        )}
      </g>
    )
  }

  return (
    <figure className="du-chart">
      <svg
        viewBox={`0 0 ${CW} ${CH}`}
        className="du-chart__svg"
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={undefined}
        onKeyDown={onKey}
        data-ui
      >
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <g key={v}>
            <line className={v === 0 ? 'du-chart__base' : 'du-chart__grid'} x1={PADL} x2={CW} y1={Y(v)} y2={Y(v)} />
            <text className="du-chart__tick" x={PADL - 5} y={Y(v) + 2.5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {rows.map((row, i) => {
          const x0 = PADL + 3 + i * pitch
          const on = i === sel
          return (
            <g
              key={row.key}
              className={`du-pair${on ? ' is-sel' : ''}${Math.abs(row.yA - row.yB) < 1e-9 ? ' is-match' : ' is-miss'}`}
              onClick={() => setSel(i)}
              role="option"
              aria-selected={on}
            >
              <title>
                {mode === 'point'
                  ? `point · n = ${row.a} · World A ${fmt(row.yA)} · World B ${fmt(row.yB)}`
                  : `n = ${row.a} · w = ${row.b} · N+Ñ = ${row.S} · M = ${fmt(Math.sqrt(row.yA))} · signs and spins grouped`}
              </title>
              <rect className="du-pair__hit" x={x0 - 2} y={0} width={pitch} height={CH} />
              {on && <rect className="du-pair__sel" x={x0 - 2.5} y={PADT - 4} width={2 * colW + 6} height={plotH + 8} />}
              {col(x0, row.segA, row.yA, 'a')}
              {col(x0 + colW + 1, row.segB, row.yB, 'b')}
              <text className="du-chart__nw" x={x0 + colW + 0.5} y={CH - PADB + 11} textAnchor="middle">
                {mode === 'point' ? `${row.a}` : `${row.a}·${row.b}`}
              </text>
            </g>
          )
        })}
        <text className="du-chart__axis" x={PADL} y={CH - 2}>
          {mode === 'point' ? 'n (POINT)' : 'n·w'} · 0 = MASSLESS · GRAVITON &amp; PARTNERS
        </text>
        <text className="du-chart__axis" x={0} y={PADT - 5}>
          MASS² · STRING UNITS
        </text>
        {tag && (
          <text className="du-chart__tag" x={CW - 2} y={PADT + 6} textAnchor="end">
            {tag}
          </text>
        )}
      </svg>
      <figcaption className="du-chart__key">Each pair: World A left, World B right. Equal height means equal mass.</figcaption>
    </figure>
  )
}

// ───────────────────────────── radius control: spectrum map strip + log slider ─────────────────────────────

const SW = 324
const SH = 48

function useStripPaths() {
  return useMemo(() => {
    const paths: Record<'mom' | 'wind' | 'vib', string> = { mom: '', wind: '', vib: '' }
    const N = 200
    const X = (x: number) => ((x + 1) / 2) * SW
    const Yp = (y: number) => SH - 2 - (Math.min(y, 10) / 10) * (SH - 6)
    const P = (x: number, y: number) => `${X(x).toFixed(1)} ${Yp(y).toFixed(1)}`
    for (const f of MAP_FAMILIES) {
      let open: 'mom' | 'wind' | 'vib' | null = null
      for (let i = 1; i <= N; i++) {
        let x0 = -1 + (2 * (i - 1)) / N
        let x1 = -1 + (2 * i) / N
        let y0 = famY(f.a, f.b, f.S, x0)
        let y1 = famY(f.a, f.b, f.S, x1)
        if (y0 > 10 && y1 > 10) {
          open = null
          continue
        }
        // clip the segment at the frame top (y = 10)
        if (y0 > 10) {
          x0 = x0 + ((x1 - x0) * (y0 - 10)) / (y0 - y1)
          y0 = 10
          open = null
        } else if (y1 > 10) {
          x1 = x0 + ((x1 - x0) * (10 - y0)) / (y1 - y0)
          y1 = 10
        }
        const tn = famTone(f.a, f.b, 0.5 * (x0 + x1))
        const tone = tn > 0 ? 'mom' : tn < 0 ? 'wind' : 'vib'
        if (open !== tone) paths[tone] += `M${P(x0, y0)}`
        paths[tone] += `L${P(x1, y1)}`
        open = y1 >= 10 ? null : tone
      }
    }
    return paths
  }, [])
}

export function RadiusControl({ action }: { action?: ReactNode }) {
  const r = useDuality((s) => s.r)
  const setR = useDuality((s) => s.setR)
  const jumps = useDuality((s) => s.jumps)
  const id = useId()
  const paths = useStripPaths()
  const x = Math.log10(r)
  const pos = (x + 1) / 2
  const ghost = (1 - x) / 2
  const [gliding, setGliding] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setGliding(true)
    const t = window.setTimeout(() => setGliding(false), 950)
    return () => window.clearTimeout(t)
  }, [jumps])

  const RES = 2000
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    let step = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') step = 0.01
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') step = -0.01
    else if (e.key === 'PageUp') step = 0.1
    else if (e.key === 'PageDown') step = -0.1
    else if (e.key === 'Home') {
      e.preventDefault()
      setR(0.1)
      return
    } else if (e.key === 'End') {
      e.preventDefault()
      setR(10)
      return
    } else return
    e.preventDefault()
    if (e.shiftKey) step *= 10
    let nx = Math.round((x + step) * 1000) / 1000
    // step over the soft detent (with margin, so float error can't snap it back) instead of getting stuck in it
    if (Math.abs(nx) < 0.02) nx = x === 0 ? Math.sign(step) * 0.021 : 0
    setR(Math.pow(10, Math.max(-1, Math.min(1, nx))))
  }
  const valueText = `R = ${fmt(r)} string lengths; dual radius alpha-prime over R = ${fmt(1 / r)}`

  return (
    <div className={`du-radius${gliding ? ' is-gliding' : ''}`} style={{ ['--pos' as string]: pos, ['--ghost' as string]: ghost }}>
      <div className="ctl__top du-radius__top">
        <label className="t-label ctl__label" htmlFor={id}>
          Circle radius R
        </label>
        {action}
      </div>
      <output className="du-radius__value t-mono" htmlFor={id}>
        R = {fmt(r)} ℓs <span className="du-dim">·</span> <span className="du-c-ghost">α′/R = {fmt(1 / r)} ℓs</span>
        {r === 1 && <span className="du-radius__sd"> · self-dual</span>}
      </output>
      <svg className="du-strip" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" aria-hidden="true">
        <line className="du-strip__mid" x1={SW / 2} x2={SW / 2} y1={0} y2={SH} />
        <path className="du-strip__c du-strip__c--vib" d={paths.vib} />
        <path className="du-strip__c du-strip__c--mom" d={paths.mom} />
        <path className="du-strip__c du-strip__c--wind" d={paths.wind} />
      </svg>
      <div className="du-strip__cursors" aria-hidden="true">
        <span className="du-strip__cur" />
        <span className="du-strip__ghost" />
      </div>
      <div className="du-track">
        <input
          id={id}
          type="range"
          min={0}
          max={RES}
          step={1}
          value={Math.round(pos * RES)}
          aria-valuetext={valueText}
          aria-description="Circle radius R, in string lengths. Drag it through the square root of alpha-prime."
          onChange={(e) => setR(Math.pow(10, (2 * Number(e.currentTarget.value)) / RES - 1))}
          onPointerUp={() => playSpectrum()}
          onKeyUp={(e) => e.key.startsWith('Arrow') && playSpectrum()}
          onKeyDown={onKey}
        />
        <span className="du-track__line" aria-hidden="true" />
        <span className="du-track__ghost" aria-hidden="true" title="α′/R: the dual circle" />
        <span className="du-track__thumb" aria-hidden="true" />
        {[
          { p: 0, l: '0.1' },
          { p: 0.5, l: '1 = √α′' },
          { p: 1, l: '10' },
        ].map((t) => (
          <span key={t.l} className={`du-track__tick${t.p === 0.5 ? ' is-mid' : ''}`} style={{ ['--tp' as string]: t.p }} aria-hidden="true">
            <span>{t.l}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────── the panel body ─────────────────────────────

export function LabBody() {
  const { rows } = usePairs()
  const mode = useDuality((s) => s.mode)
  const setMode = useDuality((s) => s.setMode)
  const sel = useDuality((s) => s.sel)
  const r = useDuality((s) => s.r)
  const note = useDuality((s) => s.note)
  const jump = useDuality((s) => s.jump)
  const row = rows[sel]
  const match = rows.filter((p) => Math.abs(p.yA - p.yB) < 1e-9).length
  const y16 = rows[15]?.yA ?? 0

  let msg: string
  if (mode === 'point')
    msg = match === 16 ? 'R = √α′: both descriptions have the same size. The self-dual point.' : "A point can't wind. Its two worlds disagree: it can tell big from small."
  else if (note === 'jump') msg = 'Relabelled, not changed. Every bar kept its height; momentum and winding swapped colors.'
  else if (r === 1) msg = 'R = √α′: both descriptions have the same size. The self-dual point.'
  else if (y16 < 3) msg = r > 1 ? 'Blue bars crowd together: a new large direction opening up.' : 'Amber bars crowd together: the dual large direction opening up.'
  else if (row && row.a === 0 && row.b === 0) msg = 'Pure vibration: indifferent to the circle’s size.'
  else if (row && row.a * row.b > 0) msg = 'N − Ñ = nw: a string that both moves and wraps must also vibrate.'
  else msg = 'All sixteen pairs match. No experiment could tell these worlds apart.'

  return (
    <div className="du-lab">
      <Formula row={row} mode={mode} />
      <PairChart rows={rows} mode={mode} />
      <RadiusControl
        action={
          <Button
            onClick={() => {
              jump()
              playSpectrum()
            }}
            title="R ← α′/R"
          >
            <span aria-hidden="true">⇄</span> Jump to the dual world
          </Button>
        }
      />
      <div className="du-lab__actions">
        <Segmented
          label="What lives on the circle?"
          value={mode}
          options={[
            { value: 'string', label: 'String' },
            { value: 'point', label: 'Point particle' },
          ]}
          onChange={(m) => {
            setMode(m)
            playSpectrum()
          }}
        />
      </div>
      <dl className="du-readouts t-mono" aria-live="polite">
        <div>
          <dt>Selected</dt>
          <dd>
            {mode === 'point' ? (
              <>n = {row?.a ?? 0} · point</>
            ) : (
              <>
                <span className="du-c-mom">n = {row?.a ?? 0}</span> · <span className="du-c-wind">w = {row?.b ?? 0}</span> · N+Ñ = {row?.S ?? 0}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>{mode === 'point' ? 'World B reads' : 'Dual reading'}</dt>
          <dd>
            {mode === 'point' ? (
              <>M = {fmt(Math.sqrt(row?.yB ?? 0), 3)}</>
            ) : (
              <>
                <span className="du-c-mom">n = {row?.b ?? 0}</span> · <span className="du-c-wind">w = {row?.a ?? 0}</span>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Mass</dt>
          <dd>M = {fmt(Math.sqrt(row?.yA ?? 0), 3)} string units</dd>
        </div>
        <div className={match === 16 ? 'is-match' : 'is-miss'}>
          <dt>Match</dt>
          <dd>{match} / 16</dd>
        </div>
      </dl>
      <p className="du-lab__note" aria-live="polite">
        {msg}
      </p>
    </div>
  )
}
