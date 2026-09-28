import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Deeper, Eq, GoDeeper, Readout, Slider, Toggle } from '@/ui'
import { easeInOutCubic } from '@/core/math'
import { CHIP_NAME, CHIPS, CLAIM_TOTAL, DETENT_COPY, DETENT_NAME, GLYPH, REFEREE, ST_TOTAL } from './data'
import { VERDICT_TEXT, verdictOf } from './model'
import { useKnowledge } from './store'
import { Browse } from './ClaimCard'

/*
 * The Referee's Bench (Lab). Two sections: Evidence required (the ceiling, 4 detents) and
 * Referee (nine claims, fixed order). Readouts are measured by the Scene (Model §4).
 */

const TICKS = [0, 1, 2, 3].map((v) => ({ value: v, label: GLYPH[CHIPS[v]] }))

/** The detent the ceiling is gliding to (so quick key presses step from the goal, not mid-glide). */
let snapGoal: number | null = null
let snapRun = 0

/** Animate the stored ceiling to a detent (250 ms easeInOutCubic). */
function snapTo(target: number) {
  const s = useKnowledge.getState()
  const from = s.ceiling
  snapGoal = target
  const run = ++snapRun
  if (Math.abs(from - target) < 1e-3) {
    s.setCeiling(target)
    snapGoal = null
    return
  }
  const t0 = performance.now()
  const step = (now: number) => {
    if (run !== snapRun) return
    const k = Math.min(1, (now - t0) / 250)
    useKnowledge.getState().setCeiling(from + (target - from) * easeInOutCubic(k))
    if (k < 1 && !useKnowledge.getState().dragging) requestAnimationFrame(step)
    else snapGoal = null
  }
  requestAnimationFrame(step)
}

function Ceiling() {
  const L = useKnowledge((s) => s.ceiling)
  const setCeiling = useKnowledge((s) => s.setCeiling)
  const setDragging = useKnowledge((s) => s.setDragging)
  const detent = Math.round(L)
  const release = () => {
    setDragging(false)
    snapTo(Math.round(useKnowledge.getState().ceiling))
  }
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (d) {
      e.preventDefault()
      const base = snapGoal ?? Math.round(useKnowledge.getState().ceiling)
      snapTo(Math.max(0, Math.min(3, base + d)))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      snapTo(e.key === 'Home' ? 0 : 3)
    }
  }
  return (
    <div
      className="kn-ceil"
      onPointerDown={() => setDragging(true)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDownCapture={onKey}
    >
      <Slider
        label="Evidence required"
        value={L}
        min={0}
        max={3}
        step={0.01}
        onChange={setCeiling}
        format={() => DETENT_NAME[detent]}
        ticks={TICKS}
        describe="Sets the evidence ceiling. Claims above it fade to ghosts."
      />
      <p className="kn-ceil__copy">{DETENT_COPY[detent]}</p>
    </div>
  )
}

function Readouts() {
  const L = useKnowledge((s) => s.ceiling)
  const shown = useKnowledge((s) => s.shown)
  const st = useKnowledge((s) => s.stShown)
  const thread = useKnowledge((s) => s.thread)
  const warm = useKnowledge((s) => s.warm)
  const admitted = CHIPS.slice(0, Math.round(L) + 1)
    .map((c) => GLYPH[c])
    .join(' ')
  return (
    <div className="kn-readouts" aria-live="polite">
      <Readout label="Admitted" value={admitted} />
      <Readout label="Claims shown" value={`${shown} / ${CLAIM_TOTAL}`} />
      <Readout label="String-theory claims shown" value={`${st} / ${ST_TOTAL}`} tone={st > 0 ? 'field' : undefined} />
      <Readout label="Thread · warm light" value={`${thread} · ${warm ? 'ON' : 'OFF'}`} tone={warm ? 'filament' : undefined} />
    </div>
  )
}

function Referee() {
  const idx = useKnowledge((s) => s.refIdx)
  const answers = useKnowledge((s) => s.answers)
  const seq = useKnowledge((s) => s.tokenSeq)
  const L = useKnowledge((s) => s.ceiling)
  const answer = useKnowledge((s) => s.answer)
  const next = useKnowledge((s) => s.nextClaim)
  const claim = REFEREE[idx]
  const chosen = answers[idx]
  // the verdict shows once the token has slid to its true height (0.4 s hover + 0.8 s slide)
  const [landed, setLanded] = useState(true)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setLanded(false)
    const t = window.setTimeout(() => setLanded(true), 1350)
    return () => window.clearTimeout(t)
  }, [seq])
  const verdict = chosen == null ? null : verdictOf(chosen, claim.tier)
  const answered = answers.filter((a) => a != null).length
  const agree = answers.reduce<number>((n, a, i) => n + (a != null && a === REFEREE[i].tier ? 1 : 0), 0)
  const hidden = chosen != null && claim.tier > Math.round(L)
  const last = idx === REFEREE.length - 1
  return (
    <section className="kn-ref" aria-labelledby="kn-ref-h">
      <header className="kn-ref__head">
        <span id="kn-ref-h" className="t-label">
          Referee
        </span>
        <span className="t-label kn-ref__count">
          Claim {idx + 1} / {REFEREE.length}
        </span>
      </header>
      <p className="kn-ref__claim">“{claim.text}”</p>
      <p className="kn-ref__prompt">How sure are we? Pick a mark.</p>
      <div className="kn-ref__chips" role="group" aria-label="How sure are we?">
        {CHIPS.map((c, t) => (
          <button
            key={c}
            type="button"
            className={`kn-chipbtn kn-chipbtn--${c}${chosen === t ? ' is-on' : ''}`}
            aria-pressed={chosen === t}
            aria-label={CHIP_NAME[c]}
            onClick={() => answer(t)}
          >
            <i className={`kn-glyph kn-glyph--${c}`} aria-hidden="true" />
            <span>{CHIP_NAME[c]}</span>
          </button>
        ))}
      </div>
      <div className="kn-ref__out" aria-live="polite">
        {verdict && landed && (
          <>
            <p className={`kn-ref__verdict kn-ref__verdict--${verdict}`}>
              <strong>{VERDICT_TEXT[verdict]}</strong> {claim.reason}
            </p>
            {hidden && <p className="kn-ref__hidden">Hidden above your evidence ceiling. Admit more to see it.</p>}
          </>
        )}
      </div>
      <footer className="kn-ref__foot">
        <span className="kn-ref__score t-mono">{answered > 0 ? `You and the referee agree on ${agree} of ${answered}.` : ' '}</span>
        {!last && (
          <Button onClick={next} variant="ghost">
            Next claim →
          </Button>
        )}
      </footer>
      {last && chosen != null && landed && <p className="kn-ref__closing">Ask of any claim: measured, derived, conjectured, or only possible?</p>}
    </section>
  )
}

export function Bench() {
  return (
    <div className="kn-bench">
      <Ceiling />
      <Readouts />
      <Referee />
    </div>
  )
}

function BenchFooter() {
  const labels = useKnowledge((s) => s.labels)
  const setLabels = useKnowledge((s) => s.setLabels)
  const reset = useKnowledge((s) => s.reset)
  return (
    <>
      <div className="kn-bench__tools">
        <Toggle label="Labels" checked={labels} onChange={setLabels} describe="Show node labels for every admitted tier" />
        <Button onClick={reset}>Reset</Button>
      </div>
      <Browse hint="Browse claims" compact />
      <GoDeeper id="ceiling" title="How the map is built" label="The rule">
        <p>
          The map has one rule: <strong>height = distance from direct experimental evidence</strong>. It does not mean importance, beauty or likelihood of
          being true. Each claim sits in the band of its status:
        </p>
        <ul>
          <li>● measured: y 0.00–0.30 (the ground)</li>
          <li>◑ derived: y 1.30–2.50</li>
          <li>◌ conjectured: y 2.90–3.80</li>
          <li>○ speculative: y 4.30–6.20</li>
        </ul>
        <p>The evidence ceiling sits in the gaps between the bands. Its height is piecewise-linear in the level L you choose:</p>
        <Eq display tex={String.raw`y_c(L) = \operatorname{interp}\big(L;\ [0,1,2,3] \to [0.80,\ 2.70,\ 4.05,\ 6.80]\big)`} label="y c of L interpolates 0.8, 2.7, 4.05, 6.8" />
        <p>Anything with height y fades as the ceiling passes it:</p>
        <Eq display tex={String.raw`a(y) = 1 - \operatorname{smoothstep}(y_c - 0.12,\ y_c + 0.12,\ y)`} label="a of y equals 1 minus smoothstep" />
        <p>
          Claims fade to dashed ghosts, never deleted. The Thread fades vertex by vertex with no ghost, so it is fully dark at L = 0: its lowest point (y =
          1.20) sits above the measured-only ceiling. Anchors and struts use their higher end, so nothing warm is left standing on the ground.
        </p>
        <p>
          Counted: 34 claims, 17 of them string-theory claims. At “measured only”, 14 claims and 0 string-theory claims remain. Status as of 2026: no
          experiment has confirmed string theory.
        </p>
      </GoDeeper>
    </>
  )
}
Bench.Footer = BenchFooter

export function BenchDeeper() {
  return (
    <Deeper>
      Visibility runs from one number: a(y) = 1 − smoothstep(y_c − 0.12, y_c + 0.12, y), with the ceiling y_c at 0.80 · 2.70 · 4.05 · 6.80 for the four
      detents.
    </Deeper>
  )
}
