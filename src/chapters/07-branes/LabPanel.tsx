import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Button, Eq, GoDeeper, Readout, Segmented, Slider, Status, Toggle } from '@/ui'
import { fmtGeV, fmtMeters, lsMeters, masslessCount, MS_GEV, stacksOf, stretchedMass, symmetryLabel, type EnergyScale } from './model'
import { ladderPair, useBranes } from './store'

/*
 * Brane Bench instrument panel: VIEW · BRANES · READOUTS (m, d, string matrix, mass ladder) · STRINGS ·
 * ASSUMPTIONS (energy scale, braneworld labels). The most telling readouts come first, so they sit above the
 * fold; the long print folds into <details>. Everything is keyboard-operable; the stage mirrors it (drag
 * handles, draw gesture, and a live ruler + mass on the stretched string).
 */

export function ViewSection() {
  const V = useBranes((s) => s.viewpoint)
  const setV = useBranes((s) => s.setViewpoint)
  const n = useBranes((s) => s.n)
  const ref = useBranes((s) => s.ref)
  const setRef = useBranes((s) => s.setRef)
  return (
    <section className="brn-sec" aria-label="View">
      <h4 className="t-label brn-sec__h">View</h4>
      <Slider
        label="Viewpoint"
        value={V}
        min={0}
        max={1}
        step={0.01}
        onChange={setV}
        format={(v) => (v < 0.05 ? 'on the brane' : v > 0.95 ? 'outside, in the bulk' : v.toFixed(2))}
        describe="Fly the camera from the on-brane slice (0) to the outside view of the bulk (1)."
      />
      <p className="brn-micro" aria-live="polite">
        {V < 0.35 ? 'On the brane: you see only what touches it. Closed strings show up as passing points.' : 'Outside: the bulk, where closed strings roam freely.'}
      </p>
      {n > 1 && (
        <Segmented
          label="Reference brane"
          value={ref}
          options={Array.from({ length: n }, (_, i) => ({ value: i, label: `Brane ${i + 1}` }))}
          onChange={setRef}
        />
      )}
    </section>
  )
}

export function BranesSection() {
  const n = useBranes((s) => s.n)
  const ys = useBranes((s) => s.ys)
  const setN = useBranes((s) => s.setN)
  const setY = useBranes((s) => s.setY)
  const setSep = useBranes((s) => s.setSeparation)
  const d = n === 2 ? Math.abs(ys[1] - ys[0]) : 0
  return (
    <section className="brn-sec" aria-label="Branes">
      <h4 className="t-label brn-sec__h">Branes</h4>
      <Segmented label="Number of branes" value={n} options={[1, 2, 3, 4].map((k) => ({ value: k, label: String(k) }))} onChange={setN} />
      {n === 2 && (
        <Slider
          label="Separation d"
          value={d}
          min={0}
          max={10}
          step={0.01}
          onChange={setSep}
          format={(v) => `${v.toFixed(2)} ℓ_s`}
          ticks={[{ value: 2 * Math.PI, label: '2π' }]}
          describe="Distance between the two branes. Below 0.2 the branes snap together."
        />
      )}
      {n !== 2 &&
        ys.map((y, i) => (
          <Slider
            key={i}
            label={`Brane ${i + 1} · position`}
            value={y}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => setY(i, v)}
            format={(v) => `y = ${v.toFixed(1)} ℓ_s`}
            describe="Moves the brane across the bulk. It snaps onto another brane within 0.2."
          />
        ))}
      <details className="brn-info">
        <summary className="t-label">Why don’t the branes pull together?</summary>
        <p className="brn-micro brn-micro--dim">
          Identical parallel branes feel no net pull: gravity-like attraction and RR repulsion cancel exactly. Infinite branes are infinitely heavy. They stay where you leave
          them.
        </p>
      </details>
    </section>
  )
}

export function StringsSection() {
  const release = useBranes((s) => s.release)
  const collide = useBranes((s) => s.collide)
  const clear = useBranes((s) => s.clear)
  return (
    <section className="brn-sec" aria-label="Strings">
      <h4 className="t-label brn-sec__h">Strings</h4>
      <p className="brn-micro">Drag from one brane to another to stretch an open string between them.</p>
      <div className="brn-btns">
        <Button onClick={release}>Release a closed string</Button>
        <Button onClick={collide}>Collide on the brane</Button>
        <Button onClick={clear}>Clear strings</Button>
      </div>
    </section>
  )
}

/** The string matrix: row = where the string starts, column = where it ends (Chan–Paton labels). */
function MatrixPanel() {
  const ys = useBranes((s) => s.ys)
  const ref = useBranes((s) => s.ref)
  const pairSel = useBranes((s) => s.pair)
  const setPair = useBranes((s) => s.setPair)
  const stacks = useMemo(() => stacksOf(ys), [ys])
  const order = stacks.flatMap((s) => s.members)
  const n = ys.length
  // display slot of each brane, and its stack
  const slot = new Array<number>(n).fill(0)
  order.forEach((i, r) => (slot[i] = r))
  const stackOf = new Array<number>(n).fill(0)
  stacks.forEach((s, k) => s.members.forEach((m) => (stackOf[m] = k)))
  const ml = masslessCount(stacks)
  const sym = symmetryLabel(stacks)
  const tr = useTransition(sym, ml, n)
  const pair = ladderPair(ys, ref, pairSel)
  let start = 0
  const blocks = stacks.map((s) => {
    const b = { start, len: s.members.length }
    start += s.members.length
    return b
  })
  const idx = Array.from({ length: n }, (_, i) => i)
  const v = (o: Record<string, number>) => o as CSSProperties
  return (
    <div className="brn-pmx">
      <div className="brn-pmx__head t-mono" aria-live="polite">
        <span>
          Symmetry <b className={tr ? 'is-new' : ''}>{tr ? `${tr.sym} → ${sym}` : sym}</b>
        </span>
        <span>
          Massless carriers <b className={tr ? 'is-new' : ''}>{tr && tr.ml !== ml ? `${tr.ml} → ${ml}` : ml}</b> · heavy <b>{n * n - ml}</b>
        </span>
      </div>
      {/* cells are keyed by brane pair and placed by transform, so if rows ever reorder they glide, not relabel */}
      <div className="brn-pmx__fig" style={v({ '--n': n })}>
        <div className="brn-pmx__grid" role="group" aria-label="String matrix: row is where the string starts, column is where it ends">
          {idx.map((i) =>
            idx.map((j) => {
              const same = stackOf[i] === stackOf[j]
              const m = stretchedMass(ys[i] - ys[j])
              const sel = !!pair && pair[0] === i && pair[1] === j && !same
              return (
                <button
                  key={`${i}-${j}`}
                  type="button"
                  className={`brn-pmx__cell t-mono${same ? ' is-filled' : ' is-open'}${sel ? ' is-sel' : ''}`}
                  style={v({ '--r': slot[i], '--c': slot[j] })}
                  aria-label={`String from brane ${i + 1} to brane ${j + 1}: ${same ? 'massless' : `mass ${m.toFixed(2)} M_s`}`}
                  title={same ? 'Massless: both ends in one stack' : 'Select this stretched string for the ladder'}
                  disabled={same}
                  onClick={() => setPair([i, j])}
                >
                  {same ? '0' : m.toFixed(2)}
                </button>
              )
            }),
          )}
          {blocks.map((b, k) => (
            <span key={k} className="brn-pmx__block" style={v({ '--r': b.start, '--len': b.len })} aria-hidden="true" />
          ))}
          {idx.map((i) => (
            <span key={`r${i}`} className="brn-pmx__rl t-mono" style={v({ '--r': slot[i] })} aria-hidden="true">
              {i + 1}
            </span>
          ))}
          {idx.map((i) => (
            <span key={`c${i}`} className="brn-pmx__cl t-mono" style={v({ '--r': slot[i] })} aria-hidden="true">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="brn-pmx__axes t-mono" aria-hidden="true">
          row: start brane
          <br />
          column: end brane
          <br />
          masses in M_s
        </div>
      </div>
      <details className="brn-info">
        <summary className="t-label">Reading the matrix</summary>
        <p className="brn-micro brn-micro--dim">
          Row: where the string starts. Column: where it ends. N branes, N² strings. U(N) contains SU(N), the kind of symmetry behind the strong (SU(3)) and weak (SU(2))
          forces. <span className="brn-aside">Orientifold planes would give SO(N) or Sp(N) instead. Not modelled here.</span>
        </p>
      </details>
    </div>
  )
}

/**
 * "U(1) × U(1) → U(2)" for a few seconds after branes merge or separate (not when the brane count changes:
 * adding a brane is not a symmetry change of the same system).
 */
function useTransition(sym: string, ml: number, n: number) {
  const prev = useRef({ sym, ml, n })
  const [tr, setTr] = useState<{ sym: string; ml: number } | null>(null)
  useEffect(() => {
    const p = prev.current
    prev.current = { sym, ml, n }
    if (p.sym === sym || p.n !== n) {
      if (p.n !== n) setTr(null)
      return
    }
    setTr({ sym: p.sym, ml: p.ml })
    const id = window.setTimeout(() => setTr(null), 3200)
    return () => window.clearTimeout(id)
  }, [sym, ml, n])
  return tr
}

/** Mass ladder: n = 0…5 for strings on one brane (√n) and for the selected stretched pair (√((d/2π)² + n)). */
function Ladder() {
  const ys = useBranes((s) => s.ys)
  const ref = useBranes((s) => s.ref)
  const pairSel = useBranes((s) => s.pair)
  const rung = useBranes((s) => s.rung)
  const setRung = useBranes((s) => s.setRung)
  const pair = ladderPair(ys, ref, pairSel)
  const d = pair ? Math.abs(ys[pair[0]] - ys[pair[1]]) : 0
  const W = 300
  const H = 150
  const Y = (m: number) => H - 14 - (m / 3) * (H - 26)
  const colL = 70
  const colR = 200
  const rungW = 62
  return (
    <div className="brn-ladder">
      <svg viewBox={`0 0 ${W} ${H}`} className="brn-ladder__svg" role="img" aria-label={`Mass ladder. Same brane: square root of n. Stretched: square root of (d over 2 pi) squared plus n, with d = ${d.toFixed(2)}.`}>
        <line x1={34} y1={Y(0)} x2={34} y2={Y(3)} className="ax" />
        {[0, 1, 2, 3].map((m) => (
          <g key={m}>
            <line x1={30} y1={Y(m)} x2={34} y2={Y(m)} className="ax" />
            <text x={26} y={Y(m) + 3} className="tk" textAnchor="end">
              {m}
            </text>
          </g>
        ))}
        <text x={4} y={10} className="tk">
          M_s
        </text>
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = Math.sqrt(k)
          const b = stretchedMass(d, k)
          const on = k === rung
          return (
            <g key={k} className={on ? 'is-on' : ''}>
              <line x1={colL - rungW / 2} y1={Y(a)} x2={colL + rungW / 2} y2={Y(a)} className="rg" />
              <line x1={colR - rungW / 2} y1={Y(b)} x2={colR + rungW / 2} y2={Y(b)} className="rg rg--s" />
              <line x1={colL + rungW / 2} y1={Y(a)} x2={colR - rungW / 2} y2={Y(b)} className="ln" />
              <text x={colR + rungW / 2 + 5} y={Y(b) + 3} className="tk">
                {k}
              </text>
            </g>
          )
        })}
        <text x={colL} y={H - 1} className="tk" textAnchor="middle">
          same brane · √n
        </text>
        <text x={colR} y={H - 1} className="tk" textAnchor="middle">
          {pair ? `${pair[0] + 1}→${pair[1] + 1} · √((d/2π)²+n)` : 'stretched'}
        </text>
      </svg>
      <Segmented label="Level n (lit rung)" value={rung} options={[0, 1, 2, 3, 4, 5].map((k) => ({ value: k, label: String(k) }))} onChange={setRung} sound={false} />
      <p className="brn-micro brn-micro--dim" title="Each n = 0 rung is a whole multiplet: a vector, 9 − p scalars and fermions (8 + 8 states). At d > 0 the vector absorbs the scalar for the separation direction and becomes massive.">
        {d > 2 * Math.PI
          ? 'Stretched this far, the lightest stretched string outweighs an unstretched string’s first excited level.'
          : d < 1e-3
            ? 'Touching: the stretched strings are massless too. The ladders are identical.'
            : 'Each rung is a whole multiplet of bosons and fermions (hover for details).'}
      </p>
    </div>
  )
}

export function ReadoutsSection() {
  const ys = useBranes((s) => s.ys)
  const ref = useBranes((s) => s.ref)
  const pairSel = useBranes((s) => s.pair)
  const scale = useBranes((s) => s.scale)
  const pair = ladderPair(ys, ref, pairSel)
  const d = pair ? Math.abs(ys[pair[0]] - ys[pair[1]]) : 0
  const m = stretchedMass(d)
  const ms = MS_GEV[scale]
  const ls = lsMeters(scale)
  const stacks = stacksOf(ys)
  const together = stacks.some((s) => s.members.length > 1)
  return (
    <section className="brn-sec" aria-label="Readouts">
      <h4 className="t-label brn-sec__h">Readouts</h4>
      {pair ? (
        <>
          <div className="brn-reads">
            <Readout label={`m (${pair[0] + 1}→${pair[1] + 1})`} value={m.toFixed(3)} unit="M_s" tone="filament" />
            <Readout label="d" value={d.toFixed(2)} unit="ℓ_s" tone="field" />
            {ms && ls ? (
              <>
                <Readout label="m, if assumed" value={fmtGeV(m * ms)} />
                <Readout label="d, if assumed" value={fmtMeters(d * ls)} />
              </>
            ) : null}
          </div>
          <p className="brn-micro" aria-live="polite">
            Lightest mass = tension × distance. Double the gap, double the mass.{' '}
            {together ? 'Touching: the stretched strings are massless too. The symmetry grows.' : 'Apart: the extra carriers gain mass. The Higgs mechanism, drawn as geometry.'}
          </p>
          <p className="brn-micro brn-micro--dim">This Higgs field is the branes’ position, not the Standard Model Higgs.</p>
        </>
      ) : (
        <p className="brn-micro">One brane: every open string has both ends on it. Add a brane to stretch one.</p>
      )}
      <MatrixPanel />
      <Ladder />
    </section>
  )
}

/** Speculative framings: a physical energy scale for the string (unknown) and the braneworld relabel. */
export function AssumptionsSection() {
  const scale = useBranes((s) => s.scale)
  const setScale = useBranes((s) => s.setScale)
  const bw = useBranes((s) => s.braneworld)
  const setBw = useBranes((s) => s.setBraneworld)
  return (
    <section className="brn-sec" aria-label="Assumptions">
      <h4 className="t-label brn-sec__h">Assumptions ○</h4>
      <Segmented<EnergyScale>
        label="Energy scale (unknown)"
        value={scale}
        options={[
          { value: 'units', label: 'string units' },
          { value: 'high', label: 'if 10¹⁸ GeV ○' },
          { value: 'tev', label: 'if 10 TeV ○' },
        ]}
        onChange={setScale}
      />
      {scale !== 'units' ? (
        <p className="brn-micro brn-assumed">
          <Status kind="speculative" compact /> Assumed M_s c² = {scale === 'high' ? '10¹⁸ GeV' : '10 TeV'}. The formula is exact. The string scale is unknown.
        </p>
      ) : (
        <p className="brn-micro brn-micro--dim">The formula is exact. The string scale is unknown.</p>
      )}
      <Toggle label="Braneworld labels ○" checked={bw} onChange={setBw} describe="Relabel the reference brane as our 3D space, a speculative scenario." />
      {bw && <p className="brn-micro">○ Speculative: our 3D space as a brane. Gravity also spreads into the bulk.</p>}
    </section>
  )
}

/** A bottom-edge fade with a "↓ more" cue while the instrument panel has more below the fold. */
export function MoreCue() {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    // the panel's scroller (the shared Lab scrolls an inner .lab__scroll; older builds scroll .lab itself)
    const el = (ref.current?.closest('.lab__scroll') ?? ref.current?.closest('.lab')) as HTMLElement | null
    if (!el) return
    const upd = () => setOn(el.scrollHeight - el.clientHeight - el.scrollTop > 48)
    upd()
    el.addEventListener('scroll', upd, { passive: true })
    const ro = new ResizeObserver(upd)
    ro.observe(el)
    const body = el.querySelector('.lab__body')
    if (body) ro.observe(body)
    return () => {
      el.removeEventListener('scroll', upd)
      ro.disconnect()
    }
  }, [])
  return (
    <div ref={ref} className={`brn-more${on ? ' is-on' : ''}`} aria-hidden="true">
      <span className="t-label">↓ more</span>
    </div>
  )
}

/** Go deeper: the two rules at an end, and where the mass comes from. Terms light up with the bench. */
export function BraneDeeper() {
  const focus = useBranes((s) => s.focus)
  const rung = useBranes((s) => s.rung)
  const ys = useBranes((s) => s.ys)
  const ref = useBranes((s) => s.ref)
  const pairSel = useBranes((s) => s.pair)
  const pair = ladderPair(ys, ref, pairSel)
  const d = pair ? Math.abs(ys[pair[0]] - ys[pair[1]]) : 0
  const hl = {
    neu: focus === 'view' || focus === 'draw' ? 1 : 0.25,
    dir: focus === 'brane' || focus === 'draw' ? 1 : 0.25,
    T: 0.6,
    d: focus === 'brane' ? 1 : Math.min(0.45, d / 6),
    n: focus === 'rung' || rung > 0 ? 1 : 0,
    phi: focus === 'brane' ? 1 : 0.2,
    Mij: focus === 'brane' && d > 0 ? 1 : 0.2,
  }
  return (
    <GoDeeper title="The two rules at an end, and where the mass comes from">
      <p>Units with ħ = c = 1. Each coordinate X of an open string obeys one of two rules at its ends:</p>
      <Eq
        display
        tex={String.raw`\htmlClass{term-neu}{\partial_\sigma X^{a}\big|_{\text{ends}} = 0} \qquad\qquad \htmlClass{term-dir}{X^{i}\big|_{\text{ends}} = y^{i}}`}
        highlight={hl}
        label="Neumann: the sigma derivative of X a vanishes at the ends. Dirichlet: X i equals y i at the ends."
      />
      <ul>
        <li>
          <strong>∂σXᵃ = 0 (Neumann)</strong> applies along the brane. No momentum leaks out of the end in direction a, so the end slides freely.
        </li>
        <li>
          <strong>Xⁱ = yⁱ (Dirichlet)</strong> applies across the brane: the end sits at the brane’s position yⁱ. Momentum in direction i is not conserved by the string
          alone; heuristically it flows into the brane, a first hint that the brane is dynamical. The real argument is in the spectrum: the massless open-string scalars{' '}
          <em>are</em> the brane’s position fluctuations (Polchinski TASI §2.4; Tong §3.1.2).
        </li>
      </ul>
      <p>For a superstring stretched between parallel branes i and j, the masses are</p>
      <Eq
        display
        tex={String.raw`M_{ij}^2 = \left(\frac{\htmlClass{term-d}{|y_i - y_j|}}{\htmlClass{term-T}{2\pi\alpha'}}\right)^2 + \htmlClass{term-n}{\frac{n}{\alpha'}}, \qquad n = 0, 1, 2, \dots`}
        highlight={hl}
        label="M i j squared equals the quantity absolute y i minus y j over 2 pi alpha prime, squared, plus n over alpha prime."
      />
      <ul>
        <li>
          <strong>1/(2πα′) = T</strong> is the string tension, fixed however long the string is: the mass gauge’s slope.
        </li>
        <li>
          <strong>|yᵢ − yⱼ|</strong> is the stretched length: the ruler d.
        </li>
        <li>
          <strong>n/α′</strong> is the vibration’s contribution to M² (level n after the superstring’s GSO projection): the lit rung. For i = j and n = 0, M = 0: the
          photon-like field.
        </li>
      </ul>
      <p>With N coincident branes the massless fields are N × N matrices: entry (i, j) comes from strings running from brane i to brane j. Transverse positions become a matrix Φ of fields. Separating the branes gives it a value:</p>
      <Eq
        display
        tex={String.raw`\htmlClass{term-phi}{\langle\Phi\rangle = \frac{1}{2\pi\alpha'}\,\mathrm{diag}(y_1,\dots,y_N)} \;\Rightarrow\; \htmlClass{term-Mij}{M_{ij} = \big|\langle\Phi\rangle_{ii} - \langle\Phi\rangle_{jj}\big|}`}
        highlight={hl}
        label="The expectation value of Phi is diag of the brane positions over 2 pi alpha prime, so M i j is the difference of its diagonal entries."
      />
      <ul>
        <li>
          <strong>⟨Φ⟩</strong> is the Higgs field’s value. Its diagonal holds the brane positions: the matrix diagonal.
        </li>
        <li>
          <strong>M_ij</strong> is the mass of carrier (i, j), exactly the n = 0 stretched string: the off-diagonal cells.
        </li>
      </ul>
      <p>
        This is the Higgs mechanism with a matrix-valued (“adjoint”) scalar, not the Standard Model’s Higgs. The branes themselves have tension ∝ 1/g_s, so they are heavy while
        strings interact weakly. Orientifold planes would give SO(N) or Sp(N) instead of U(N); the bench does not model them. Loops passing through branes untouched is also a
        simplification: a brane can absorb or scatter a closed string, with a probability set by g_s.
      </p>
      <p className="brn-refs">
        Sources: Dai, Leigh &amp; Polchinski, Mod. Phys. Lett. A 4 (1989) 2073; Hořava, Phys. Lett. B 231 (1989) 251; Polchinski, PRL 75 (1995) 4724; Witten, Nucl. Phys. B 460
        (1996) 335; Tong, Lectures on String Theory, arXiv:0908.0333, §3 and §7.7.
      </p>
    </GoDeeper>
  )
}
