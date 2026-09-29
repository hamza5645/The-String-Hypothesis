import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Button, Segmented, Slider, Toggle } from '@/ui'
import { tick, unlockAudio } from '@/core/audio'
import { useSettings } from '@/core/settings'
import { CARD_TEXT, D, fmtCount, fmtMass, GRAVITON, level, levelSum, MODES, packetCount, PARTICLES, sup, type Particle } from './model'
import { live, useVib, type Ends, type Pol, type Tab } from './store'

const MSG: Record<string, string> = {
  snap: 'Snapped to whole packets. A quantum string can’t vibrate by half a packet.',
  gentle: 'Too gentle for even one packet. Still on the bottom rung.',
  zero: 'Sliding the whole string isn’t vibration. It doesn’t change the mass.',
}

const TABS: { value: Tab; label: string }[] = [
  { value: 'bench', label: 'Harmonics' },
  { value: 'ladder', label: 'Ladder' },
  { value: 'particles', label: 'Particles' },
]

function Sym({ p }: { p: Particle }) {
  return (
    <span className="vib-sym">
      {p.sym}
      {p.sub && <sub>{p.sub}</sub>}
    </span>
  )
}

/** Harmonic chip: tap adds a packet (0→1→2→3→0); right-click, long-press or Delete clears. */
function Chip({ n }: { n: number }) {
  const k = useVib((s) => s.k[n - 1])
  const pinned = useVib((s) => s.ends === 'pinned')
  const cycleK = useVib((s) => s.cycleK)
  const clearK = useVib((s) => s.clearK)
  const bar = useRef<HTMLSpanElement>(null)
  const press = useRef<number>(0)
  const longed = useRef(false)

  // PINNED: bars follow the live (decaying) classical amplitudes
  useEffect(() => {
    if (!pinned) return
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const v = Math.min(1, Math.abs(live.amps[n - 1]) / 0.1)
      bar.current?.style.setProperty('--v', v.toFixed(3))
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [pinned, n])

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    longed.current = false
    window.clearTimeout(press.current)
    press.current = window.setTimeout(() => {
      longed.current = true
      clearK(n)
    }, 550)
  }
  const onUp = () => window.clearTimeout(press.current)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      clearK(n)
    }
  }
  return (
    <button
      type="button"
      className={`vib-chip${k > 0 && !pinned ? ' is-on' : ''}${pinned ? ' is-bar' : ''}`}
      title="Harmonic n. Each packet here adds n to the level."
      aria-label={
        pinned
          ? `Harmonic ${n} (guitar mode: amplitude shown as a bar)`
          : `Harmonic ${n}: ${k} packet${k === 1 ? '' : 's'}. Press to add a packet; Delete clears.`
      }
      disabled={pinned}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => {
        e.preventDefault()
        clearK(n)
      }}
      onKeyDown={onKey}
      onClick={() => {
        if (longed.current) return
        cycleK(n)
        tick(330 + 110 * n)
      }}
    >
      <span className="vib-chip__n">{n}</span>
      {pinned ? (
        <span ref={bar} className="vib-chip__bar" aria-hidden="true" />
      ) : (
        <span className="vib-chip__dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < k ? 'is-on' : ''} />
          ))}
        </span>
      )}
    </button>
  )
}

function SoundRow() {
  const sound = useSettings((s) => s.sound)
  const setSound = useSettings((s) => s.setSound)
  const volume = useVib((s) => s.volume)
  const setVolume = useVib((s) => s.setVolume)
  return (
    <div className={`vib-sound${sound ? ' is-on' : ''}`}>
      <Toggle
        label={sound ? 'Sound on · harmonics of 110 Hz' : 'Hear the harmonics (sound is off)'}
        checked={sound}
        describe="Plays the string's vibration pattern as a chord of 110 Hz harmonics."
        onChange={(v) => {
          setSound(v)
          if (v) {
            unlockAudio()
            tick(523)
          }
        }}
      />
      {sound && (
        <>
          <Slider label="Volume" value={volume} min={0} max={1} step={0.01} onChange={setVolume} format={(v) => `${Math.round(v * 100)}%`} />
          <p className="vib-note">
            You hear the vibration pattern, not the mass. At E = hf, a 10¹⁸ GeV rung would be about 10⁴¹ Hz: transposed about 131 octaves down.
          </p>
        </>
      )}
    </div>
  )
}

function BenchTab() {
  const ends = useVib((s) => s.ends)
  const pol = useVib((s) => s.pol)
  const pluckPos = useVib((s) => s.pluckPos)
  const pluckStrength = useVib((s) => s.pluckStrength)
  const v = useVib.getState()
  const swirl = pol === 'cw' || pol === 'ccw'
  return (
    <>
      <div className="vib-row">
        <div className="t-label vib-row__label">Harmonics · packets</div>
        <div className="vib-chips" role="group" aria-label="Harmonics 1 to 6">
          {Array.from({ length: MODES }, (_, i) => (
            <Chip key={i} n={i + 1} />
          ))}
        </div>
        <p className="vib-note">{ends === 'free' ? 'Put packets in low harmonics to carry more spin.' : 'Guitar mode: amplitudes look continuous and decay.'}</p>
      </div>
      <Segmented<Ends>
        label="Ends"
        value={ends}
        onChange={v.setEnds}
        options={[
          {
            value: 'free',
            label: 'Free',
            hint: 'Free ends, like an open string in string theory. Quantum: whole packets only.',
          },
          {
            value: 'pinned',
            label: 'Pinned (guitar)',
            hint: 'Guitar: pinned ends, classical physics.',
          },
        ]}
      />
      <p className="vib-note">
        {ends === 'free'
          ? 'Free ends, like an open string in string theory. Quantum: whole packets only.'
          : 'Guitar: pinned ends. A pluck holds ~10²⁸ packets, so it looks smooth. Adds only ~10⁻²⁰ kg.'}
      </p>
      <Segmented<Pol>
        label="Wiggle direction"
        value={pol}
        onChange={v.setPol}
        options={[
          { value: 'ud', label: 'Up–down' },
          { value: 'io', label: 'In–out' },
          { value: 'cw', label: 'Swirl ↻' },
          { value: 'ccw', label: 'Swirl ↺' },
        ]}
      />
      <p className="vib-note">
        {!swirl
          ? 'Wiggle direction is polarization, like light’s.'
          : ends === 'free'
            ? 'A swirl carries spin around the axis: K+1 units, the most this state allows.'
            : 'A swirl carries angular momentum around the axis; with ~10²⁸ packets it looks continuous.'}
      </p>
      <div className="vib-pluck">
        <Slider
          label="Pluck position"
          value={pluckPos}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={v.setPluckPos}
          format={(x) => `${x.toFixed(2)} L`}
          describe="Where along the string the pluck pulls"
        />
        <Slider
          label="Pluck strength"
          value={pluckStrength}
          min={0}
          max={0.35}
          step={0.01}
          onChange={v.setPluckStrength}
          format={(x) => `${x.toFixed(2)} L`}
          describe="How far the pluck pulls the string sideways"
        />
        <Button variant="solid" onClick={v.requestPluck}>
          Pluck
        </Button>
      </div>
      <SoundRow />
    </>
  )
}

function LadderTab() {
  const axis = useVib((s) => s.axis)
  const units = useVib((s) => s.units)
  const zoom0 = useVib((s) => s.zoom0)
  const v = useVib.getState()
  return (
    <>
      <p className="vib-note vib-note--lead">Rung 0 · massless. Every elementary particle we’ve measured would live here.</p>
      <Segmented<'M2' | 'M'>
        label="Ladder axis"
        value={axis}
        onChange={v.setAxis}
        options={[
          { value: 'M2', label: 'M²' },
          { value: 'M', label: 'M' },
        ]}
      />
      <p className="vib-note">Rungs equally spaced in mass-squared. Switch to mass and they crowd together.</p>
      <Segmented<'Ms' | 'GeV'>
        label="Units"
        value={units}
        onChange={v.setUnits}
        options={[
          { value: 'Ms', label: 'Mₛ' },
          { value: 'GeV', label: 'GeV' },
        ]}
      />
      {units === 'GeV' && <p className="vib-note vib-note--spec">○ Assumes Mₛ = 10¹⁸ GeV. The real value is unknown.</p>}
      <Button pressed={zoom0} onClick={() => v.setZoom0(!zoom0)}>
        {zoom0 ? 'Close rung-0 zoom' : 'Zoom into rung 0'}
      </Button>
    </>
  )
}

// pack copy; the 10² caption grows rightward and the 10¹⁵ caption is right-aligned to its tick (styles.css)
const DIST_TICKS = [
  { value: 1e2, label: '10²: already a point' },
  { value: 1e15, label: '10¹⁵: LHC resolution' },
]

/** The chapter's signature move, always in view: step back until the string is a point. */
function StepBack() {
  const dist = useVib((s) => s.dist)
  const ends = useVib((s) => s.ends)
  const setDist = useVib((s) => s.setDist)
  const e = Math.round(Math.log10(dist))
  return (
    <div className="vib-far">
      {ends === 'pinned' ? (
        <p className="vib-note">
          <span className="t-label vib-far__off">Step back</span> Switch to FREE to step back from a quantum string.
        </p>
      ) : (
        <Slider
          label="Step back"
          value={dist}
          min={1}
          max={1e16}
          log
          ticks={DIST_TICKS}
          onChange={setDist}
          format={() => `10${sup(e)} × its length`}
          describe="Viewing distance, in multiples of the string's own length. Seen from far beyond its own size, a string looks like a point."
        />
      )}
      <p className="vib-note vib-note--small">Our sharpest view, the LHC, resolves about 10⁻¹⁹ m. A string might be about 10⁻³⁴ m.</p>
    </div>
  )
}

function ParticlesTab() {
  const sel = useVib((s) => s.particle)
  const setParticle = useVib((s) => s.setParticle)
  // a click keeps the selection; hovering previews it until the pointer leaves the grid
  const clicked = useRef<string | null>(null)
  const all = [...PARTICLES, GRAVITON]
  const p = all.find((q) => q.id === sel) ?? null
  const cols = ['u', 'c', 't', 'g', 'H', 'd', 's', 'b', 'gamma', 'grav', 'e', 'mu', 'tau', 'Z', 'nue', 'num', 'nut', 'W']
  return (
    <>
      <p className="vib-note vib-note--lead">In string theory, all of these would be bottom-rung states of one kind of string.</p>
      <div className="vib-cells" role="group" aria-label="Measured particles" onMouseLeave={() => setParticle(clicked.current)}>
        {cols.map((id) => {
          const q = all.find((x) => x.id === id)!
          return (
            <button
              key={id}
              type="button"
              className={`vib-cell${sel === id ? ' is-sel' : ''}${id === 'grav' ? ' is-ghost' : ''}`}
              aria-pressed={sel === id}
              aria-label={`${q.name}: mass ${q.mass}, spin ${q.spin}`}
              onClick={() => {
                clicked.current = clicked.current === id ? null : id
                setParticle(clicked.current)
              }}
              onMouseEnter={() => setParticle(id)}
            >
              <Sym p={q} />
            </button>
          )
        })}
      </div>
      <div className="vib-pcard" aria-live="polite">
        {p ? (
          <>
            <div className="vib-pcard__head">
              <Sym p={p} /> <span>{p.name}</span>
            </div>
            <dl className="vib-pcard__dl">
              <div>
                <dt>Mass</dt>
                <dd>{p.mass}</dd>
              </div>
              <div>
                <dt>Spin</dt>
                <dd>{p.spin}</dd>
              </div>
              <div>
                <dt>Charge</dt>
                <dd>{p.charge}</dd>
              </div>
            </dl>
            <p className="vib-pcard__txt">{CARD_TEXT[p.card]}</p>
            {p.card === 'F' && p.mass.includes('*') && (
              <p className="vib-pcard__fn">* Quark masses are scheme-dependent (MS-bar): quarks are never seen alone.</p>
            )}
            {p.card === 'N' && (
              <p className="vib-pcard__fn">† KATRIN 2025 bounds the effective electron-antineutrino mass; at least one neutrino mass is ≥ 0.05 eV.</p>
            )}
            <p className="vib-pcard__foot">
              {p.id === 'grav' ? 'EXPECTED MASSLESS · NEVER DETECTED' : 'MEASURED ● · STRING-THEORY PREDICTION OF THIS MASS: —'}
            </p>
          </>
        ) : (
          <p className="vib-note">Hover or tap a cell. The bench drops to the bottom rung, where they would all live.</p>
        )}
      </div>
      <p className="vib-note">Some constructions reproduce this list. None yet predicts the measured masses.</p>
    </>
  )
}

function Cell({ label, value, tone, wide }: { label: string; value: string; tone?: 'fil' | 'field'; wide?: boolean }) {
  return (
    <div className={`vib-ro__cell${tone ? ' vib-ro__cell--' + tone : ''}${wide ? ' vib-ro__cell--wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/** What a distant observer would read off this state (always visible, near the top of the panel). */
function Readouts() {
  const k = useVib((s) => s.k)
  const ends = useVib((s) => s.ends)
  const pol = useVib((s) => s.pol)
  const units = useVib((s) => s.units)
  const particle = useVib((s) => s.particle)
  if (ends === 'pinned')
    return (
      <div className="vib-ro" aria-live="polite">
        <dl className="vib-ro__grid">
          <Cell label="HARMONICS" value="110 · 220 · 330… Hz" tone="field" wide />
          <Cell label="PHYSICS" value="classical" wide />
          <Cell label="PACKETS PER PLUCK" value="~10²⁸" wide />
          <Cell label="MASS ADDED" value="~10⁻²⁰ kg" wide />
        </dl>
      </div>
    )
  // a particle cell sets the bench to the bottom rung (the graviton leaves it alone: it is a closed string)
  const sel = particle && particle !== 'grav' ? (PARTICLES.find((q) => q.id === particle) ?? null) : null
  const kk = sel ? [0, 0, 0, 0, 0, 0] : k
  const N = level(kk)
  const K = packetCount(kk)
  const swirl = pol === 'cw' || pol === 'ccw'
  // spin: the bench's vector-like states carry up to K+1 units; a spin-½ or spin-0 particle is not one of them
  let spinLabel = 'SPIN'
  let spinV = K === 0 ? '1ħ' : `≤ ${K + 1}ħ`
  let axisV = swirl ? `${pol === 'cw' ? '+' : '−'}${K + 1}ħ` : 'mixed'
  let note: string | null = swirl ? null : 'A straight wiggle blends both swirls, so its spin along the axis is mixed.'
  if (sel && sel.spin === '½') {
    spinLabel = 'SPIN'
    spinV = '½ħ'
    axisV = 'no picture'
    note = 'Spin ½ comes from the string’s fermionic side. No wiggle picture exists.'
  } else if (sel && sel.spin === '0') {
    spinLabel = 'SPIN'
    spinV = '0'
    axisV = '0'
    note = 'Spin 0: in some models, a wiggle pointing into hidden dimensions.'
  }
  return (
    <div className="vib-ro" aria-live="polite">
      <dl className="vib-ro__grid">
        <Cell label="LEVEL N = Σ n·kₙ" value={N === 0 ? '0 · bottom rung' : `${levelSum(kk)} = ${N}`} tone="fil" wide />
        <Cell label="MASS M = √N·Mₛ" value={fmtMass(N, units)} tone="fil" wide />
        <Cell label="PACKETS K" value={String(K)} />
        <Cell label={spinLabel} value={spinV} />
        <Cell label="SPIN ALONG AXIS" value={axisV} wide />
      </dl>
      <p className="vib-ro__states">
        <span>STATES ON THIS RUNG</span> <b>{fmtCount(D[Math.min(63, N)])}</b>{' '}
        <span className="vib-ro__dim">· the bench shows one · rung max spin {N + 1}ħ</span>
      </p>
      {note && <p className="vib-ro__dim vib-ro__tight">{note}</p>}
    </div>
  )
}

function Message() {
  const msg = useVib((s) => s.msg)
  const at = useVib((s) => s.msgAt)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!msg) return
    setShow(true)
    const id = window.setTimeout(() => setShow(false), 4200)
    return () => window.clearTimeout(id)
  }, [msg, at])
  return (
    <p className={`vib-msg${show && msg ? ' is-on' : ''}`} role="status" aria-live="polite">
      {msg ? MSG[msg] : ''}
    </p>
  )
}

export function LabPanel() {
  const tab = useVib((s) => s.tab)
  const setTab = useVib((s) => s.setTab)
  const id = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  // ARIA tabs pattern: one tab stop; Left/Right (wrapping), Home and End select and focus a tab
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.value === tab)
    const j =
      e.key === 'ArrowRight'
        ? (i + 1) % TABS.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + TABS.length) % TABS.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? TABS.length - 1
              : -1
    if (j < 0) return
    e.preventDefault()
    setTab(TABS[j].value)
    tabRefs.current[j]?.focus()
  }
  return (
    <>
      <div className="vib-ro-wrap">
        <Readouts />
        <Message />
      </div>
      <StepBack />
      <div className="vib-tabs" role="tablist" aria-label="Bench sections" onKeyDown={onTabKey}>
        {TABS.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.value}`}
            aria-selected={tab === t.value}
            aria-controls={`${id}-panel`}
            tabIndex={tab === t.value ? 0 : -1}
            className={`vib-tab${tab === t.value ? ' is-on' : ''}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="vib-tabpanel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`}>
        {tab === 'bench' && <BenchTab />}
        {tab === 'ladder' && <LadderTab />}
        {tab === 'particles' && <ParticlesTab />}
      </div>
    </>
  )
}
