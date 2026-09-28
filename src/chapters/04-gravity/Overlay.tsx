import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Beat, Button, Caption, ChapterTitle, Deeper, Eq, GoDeeper, Lab, Segmented, Slider, Status, Step, Term, Toggle, STATUS_INFO } from '@/ui'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { ahaTextFade, LEN } from './director'
import { matchM, matchState, type Spin } from './model'
import { useGravity } from './store'
import { Dial } from './Dial'
import { playChirp } from './chirp'
import { STRING_CAPTION } from './copy'
import './styles.css'

/* ───────────────────────── small local pieces ───────────────────────── */

/** A beat whose chip row can hold custom chips (tooltip overrides, hollow "not observed" tags). Same markup as <Beat>. */
function GBeat({ chips, children }: { chips: ReactNode; children: ReactNode }) {
  return (
    <div className="beat beat--lead">
      <div className="beat__meta">
        <div className="status-row">{chips}</div>
      </div>
      <div className="t-lead beat__text">{children}</div>
    </div>
  )
}

/** The DERIVED chip with a tooltip override (Beat 3 is ordinary QFT + GR, not string theory). */
function DerivedQFT() {
  const title =
    'Mathematics of ordinary quantum field theory plus general relativity, not string theory. Untested: no experiment reaches these energies, and gravity’s quantum corrections are far too small to measure.'
  return (
    <span className="status status--derived" title={title} data-ui>
      <i className="status__mark" aria-hidden="true" />
      <span className="status__label">{STATUS_INFO.derived.label}</span>
      <span className="sr-only">: {title}</span>
    </span>
  )
}

/** What the left-hand scale gauge means on string-only frames: the string length is unknown. */
function GaugeNote({ bare = false }: { bare?: boolean }) {
  const body = (
    <>
      <Status kind="speculative" compact />
      <span>
        Scale ≈ ℓ<sub>s</sub> · string length unknown · ~10⁻³⁴ <span className="gr-nc">m</span> if traditional estimates hold
      </span>
    </>
  )
  return bare ? body : <span className="gr-gauge t-mono">{body}</span>
}

/** A hollow tag: something that has NOT been observed. */
function NotObserved({ children }: { children: ReactNode }) {
  return (
    <span className="gr-hollow gr-hollow--chip" title="Hypothetical: never detected." data-ui>
      <i aria-hidden="true" />
      {children}
    </span>
  )
}

const FORCES = [
  { name: 'EM', long: 'Electromagnetism', card: 'Photon: mass 0 (measured below 10⁻¹⁸ eV); unlimited range, 1/r²; α ≈ 1/137.' },
  { name: 'Weak', long: 'Weak force', card: 'W and Z: 80.4 and 91.2 GeV; range about 2.5 × 10⁻¹⁸ m; feeble at low energy because W and Z are heavy.' },
  { name: 'Strong', long: 'Strong force', card: '8 gluons: massless, confined inside hadrons (about 10⁻¹⁵ m); αs ≈ 0.12 at 91 GeV.' },
  { name: 'Gravity', long: 'Gravity', card: 'Graviton, if it exists: massless (gravitational-wave data: below 2 × 10⁻²³ eV); unlimited range. Never observed.' },
]

function ForceExplorer() {
  const force = useGravity((s) => s.force)
  const setForce = useGravity((s) => s.setForce)
  return (
    <div className="gr-fx" data-ui>
      <span className="t-label gr-fx__label">Explore the forces</span>
      <div className="gr-fx__row" role="group" aria-label="Force explorer">
        {FORCES.map((f, i) => (
          <button
            key={f.name}
            type="button"
            className={`gr-fx__btn${force === i ? ' is-on' : ''}${i === 3 ? ' gr-fx__btn--g' : ''}`}
            aria-pressed={force === i}
            aria-label={f.long}
            onMouseEnter={() => setForce(i)}
            onMouseLeave={() => setForce(-1)}
            onFocus={() => setForce(i)}
            onBlur={() => setForce(-1)}
            onClick={() => setForce(force === i ? -1 : i)}
          >
            {f.name}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {force >= 0 ? FORCES[force].card : ''}
      </p>
    </div>
  )
}

/**
 * Beat 5: the sentence that matches what is on stage is lit; the rest rest dimmer. The whole centred text
 * fades out before its sticky hold ends, so it never scrolls up through the ring | tile | loop triptych.
 */
function AhaText() {
  const h = useChapter()
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let last = -1
    let lastX = -1
    const upd = () => {
      const a = h.step('aha')
      const ph = a < 0.2 ? 0 : a < 0.44 ? 1 : a < 0.6 ? 2 : 3
      if (ph !== last && ref.current) {
        ref.current.dataset.phase = String(ph)
        last = ph
      }
      const x = Math.round(ahaTextFade(a) * 100) / 100
      const step = ref.current?.closest<HTMLElement>('.gr-step-aha')
      if (x !== lastX && step) {
        step.style.setProperty('--gx', x.toFixed(2))
        step.toggleAttribute('data-gx-off', x < 0.01)
        lastX = x
      }
    }
    upd()
    return onJourney(upd)
  }, [h])
  return (
    <span ref={ref} className="gr-aha" data-phase="0">
      <span data-s="0">
        Now the string. An open string&rsquo;s first vibration carries one arrow: <Term id="spin">spin</Term> 1, like a photon.
      </span>{' '}
      <span data-s="1">A closed loop has ripples circling both ways, always excited equally.</span>{' '}
      <span data-s="2">So its first vibration carries two arrows.</span>{' '}
      <span data-s="3">One combination is spin 2 and exactly massless: a graviton.</span>
    </span>
  )
}

/* ───────────────────────── the Spin Lab panel ───────────────────────── */

const SPIN_CAPTION: Record<Spin, string> = {
  2: 'Gravity’s pattern: stretch one way, squeeze the other. Seen in gravitational waves.',
  1: 'Light’s pattern: a ring of charges shaken side to side. Repeats only every 360°.',
  0: 'A breathing pattern. General relativity has none; LIGO–Virgo data disfavor purely scalar waves.',
}
const MATCH_TEXT = { same: 'Same pattern.', half: 'Same shape, half a cycle later.', other: 'The other polarization.' } as const

function MatchMeter({ spin, psi, circular }: { spin: Spin; psi: number; circular: boolean }) {
  const rad = (psi * Math.PI) / 180
  const M = matchM(spin, rad)
  const st = matchState(M)
  const repeats = spin === 0 ? 'any angle' : `${360 / spin}°`
  if (circular) {
    return (
      <div className="gr-meter">
        <span className="t-label gr-meter__k">Circular</span>
        <p className="gr-meter__state">The {spin === 2 ? 'stretch axis' : 'shake direction'} turns {360 / spin}° per wave cycle{spin === 2 ? ': the signature of spin 2.' : '.'}</p>
        <span className="gr-meter__rep t-mono">Pattern turns 360°/s per cycle = {360 / spin}°</span>
      </div>
    )
  }
  return (
    <div className="gr-meter">
      <span className="gr-meter__q">Turn the pattern. How far until it looks exactly the same?</span>
      <div className="gr-meter__bar" aria-hidden="true">
        <span className="gr-meter__mid" />
        <span className="gr-meter__mk" style={{ ['--m' as string]: ((M + 1) / 2).toFixed(3) }} />
      </div>
      <div className="gr-meter__ends t-mono" aria-hidden="true">
        <span>−1</span>
        <span>0</span>
        <span>+1</span>
      </div>
      <p className="gr-meter__state" aria-live="polite">
        {st ? MATCH_TEXT[st] : <span className="gr-meter__dim">M = cos({spin}ψ) = {M.toFixed(2)}</span>}
      </p>
      <span className="gr-meter__rep t-mono">Repeats every 360°/s = {repeats}</span>
    </div>
  )
}

/** The lab's drag hint floats over the stage; show it only once the step has docked (not while it scrolls in over the ring). */
function useDockedHint(ref: RefObject<HTMLElement | null>) {
  const h = useChapter()
  useEffect(() => {
    let last = -1
    const dockAt = 0.5 / LEN.lab
    const upd = () => {
      const p = h.step('lab')
      const x = p > dockAt - 0.01 && p < 1 - dockAt + 0.01 ? 1 : 0
      const step = ref.current?.closest<HTMLElement>('.step--lab')
      if (x !== last && step) {
        step.toggleAttribute('data-hint-on', x === 1)
        last = x
      }
    }
    upd()
    return onJourney(upd)
  }, [h, ref])
}

function SpinLab() {
  const g = useGravity()
  const dialRow = useRef<HTMLDivElement>(null)
  useDockedHint(dialRow)
  const spin = g.spin
  const circular = spin !== 0 && g.circular
  const phaseMode = g.paused || g.speed <= 0
  const hl = {
    eps: spin === 2 ? 1 : spin === 0 ? 0.55 : 0,
    a: spin >= 1 ? 1 : 0.55,
    at: spin === 1 ? 0 : spin === 2 ? 1 : 0.55,
    hp: spin === 2 ? Math.abs(Math.cos((2 * g.psi * Math.PI) / 180)) : 0,
    hx: spin === 2 ? Math.abs(Math.sin((2 * g.psi * Math.PI) / 180)) : 0,
  }
  return (
    <Lab
      title="Spin Lab · Ring & Loop"
      status={['observed', 'derived', 'analogy']}
      hint="Drag the stage to turn the pattern · pick a spin"
      length={LEN.lab}
      intro={
        <>
          <p>{SPIN_CAPTION[spin]}</p>
          <p className="gr-lab__string">
            <Status kind="analogy" compact />
            <span>{STRING_CAPTION[spin]}</span>
          </p>
        </>
      }
      footer={
        <>
          <GoDeeper title="Two arrows make a graviton">
            <p>
              In the light-cone description of the simplest (bosonic) closed string, every state is built by adding ripple quanta to a bare string. The
              lightest state that has ripples is:
            </p>
            <Eq
              display
              tex="\lvert \text{graviton} \rangle = \htmlClass{term-eps}{\varepsilon_{ij}}\,\htmlClass{term-a}{\alpha^{i}_{-1}}\,\htmlClass{term-at}{\tilde{\alpha}^{j}_{-1}}\,\lvert 0;p\rangle"
              highlight={hl}
              label="graviton state equals epsilon i j times alpha i minus one times alpha tilde j minus one acting on the ripple-free string with momentum p"
            />
            <Eq
              display
              tex="M^{2} = \frac{4}{\alpha'}\,(N-1) = \frac{4}{\alpha'}\,(\tilde N-1)"
              label="mass squared equals four over alpha prime times N minus one, which equals four over alpha prime times N tilde minus one"
            />
            <ul>
              <li>
                <strong>α<sup>i</sup>₋₁</strong> adds one quantum of the lowest <strong>right-moving ripple</strong>, wiggling along transverse direction <em>i</em>.
              </li>
              <li>
                <strong>α̃<sup>j</sup>₋₁</strong> does the same for the <strong>left-moving ripple</strong>, along <em>j</em>.
              </li>
              <li>
                <strong>|0;p⟩</strong> is the <strong>ripple-free string</strong> with momentum <em>p</em>.
              </li>
              <li>
                <strong>α′</strong> sets the <strong>string&rsquo;s size</strong> (it has units of length²).
              </li>
              <li>
                <strong>N</strong> and <strong>Ñ</strong> count the <strong>ripple levels</strong> on each side. <Term id="level-matching">Level matching</Term>, N = Ñ, holds
                because no point on a loop is special.
              </li>
              <li>
                The <strong>−1</strong> is quantum <strong>zero-point energy</strong>.
              </li>
            </ul>
            <p>
              With N = Ñ = 1, the mass is exactly zero. Lorentz symmetry <em>requires</em> this. These states have only transverse arrows, and only a massless
              particle can get by with so few. In flat spacetime, that requirement fixes spacetime at 26 dimensions. Superstrings have an analogous state and
              reach the same conclusion in 10 dimensions.
            </p>
            <p>
              The <strong>pattern</strong> ε<sub>ij</sub> splits into three parts: a symmetric, traceless piece (the graviton), an antisymmetric piece (the
              B-field) and a trace (the dilaton). In the full theory i and j run over 24 transverse directions (8 for superstrings), so ε is really a 24 × 24
              grid. Restrict both arrows to the directions of our three space dimensions: for a wave crossing them, the transverse plane is 2D, so this block of
              the graviton&rsquo;s ε has just two independent choices, <strong>+</strong> and <strong>×</strong>. (The other rows and columns, which point into
              extra dimensions, describe other particles.) It is exactly the matrix that moves the ring:
            </p>
            <Eq
              display
              tex="\delta x^{i} = \tfrac{1}{2}\,h_{ij}\,x^{j}, \qquad h_{ij} = \begin{pmatrix} \htmlClass{term-hp}{h_{+}} & \htmlClass{term-hx}{h_{\times}} \\ \htmlClass{term-hx}{h_{\times}} & \htmlClass{term-hp}{-h_{+}} \end{pmatrix}"
              highlight={hl}
              label="delta x i equals one half h i j x j, with h equal to the matrix h plus, h cross; h cross, minus h plus"
            />
            <p>
              Here x<sup>j</sup> is a particle&rsquo;s <strong>rest position</strong> and δx<sup>i</sup> its <strong>displacement</strong>. Turn the dial: h₊ = A cos φ
              cos 2ψ and h× = A cos φ sin 2ψ light up as the pattern turns.
            </p>
            <p>Finally, a string can move consistently through curved spacetime only if:</p>
            <Eq
              display
              tex="\beta_{\mu\nu} = \alpha' \htmlClass{term-r}{R_{\mu\nu}} + \mathcal{O}(\alpha'^{2}) = 0"
              highlight={{ r: 1 }}
              label="beta mu nu equals alpha prime times R mu nu plus order alpha prime squared equals zero"
            />
            <p>
              R<sub>μν</sub> is spacetime&rsquo;s <strong>Ricci curvature</strong>. The equation says that, to leading order, <strong>Einstein&rsquo;s vacuum equations</strong>{' '}
              must hold. The B-field and dilaton add further terms.
            </p>
            <h3>What is faithful, what is cartoon</h3>
            <table>
              <thead>
                <tr>
                  <th>On screen</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ring pattern, + / × at 45°, 180° repeat, circular axis turning 180° per cycle</td>
                  <td>Faithful (linearized GR, TT gauge)</td>
                </tr>
                <tr>
                  <td>Tidal arrows</td>
                  <td>Faithful (geodesic deviation, long wavelength)</td>
                </tr>
                <tr>
                  <td>M(ψ) = cos(sψ); two polarizations for any massless s ≥ 1</td>
                  <td>Faithful (helicity ±s)</td>
                </tr>
                <tr>
                  <td>Pattern tile ε</td>
                  <td>Faithful: the graviton&rsquo;s polarization, in GR and in the string state (a 2 × 2 block of a larger tile)</td>
                </tr>
                <tr>
                  <td>Amplitude A ≤ 0.4; speed ≤ 1.2 Hz</td>
                  <td>Exaggerated ~10²⁰×; slowed ~10²–10³×</td>
                </tr>
                <tr>
                  <td>Loop deforming like the ring; circling glints</td>
                  <td>Cartoon: the graviton is a quantum superposition; no classical loop shape is massless</td>
                </tr>
              </tbody>
            </table>
          </GoDeeper>
        </>
      }
    >
      <Segmented<Spin>
        label="Spin s"
        value={spin}
        options={[
          { value: 0, label: '0 · breathe', hint: 'Hypothetical scalar wave' },
          { value: 1, label: '1 · light', hint: 'Electromagnetic wave shaking charges' },
          { value: 2, label: '2 · gravity', hint: 'Gravitational wave' },
        ]}
        onChange={(v) => g.set({ spin: v, circular: v === 0 ? false : g.circular })}
      />

      <div className="gr-dialrow" ref={dialRow}>
        <div className="gr-dialbox">
          <Dial psi={g.psi} spin={spin} onChange={(v) => g.set({ psi: v })} />
          <span className="gr-dialbox__v t-mono">ψ = {Math.round(g.psi)}°</span>
        </div>
        <MatchMeter spin={spin} psi={g.psi} circular={circular} />
      </div>

      <div className="gr-two">
        <div className="ctl ctl-seg" role="radiogroup" aria-label="Polarization">
          <div className="ctl__top">
            <span className="t-label ctl__label">Polarization</span>
          </div>
          <div className="ctl-seg__row">
            <button type="button" role="radio" aria-checked={!circular} className={`ctl-seg__opt${!circular ? ' is-on' : ''}`} onClick={() => g.set({ circular: false })}>
              Linear
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={circular}
              disabled={spin === 0}
              title={spin === 0 ? 'A breathing pattern has no direction to turn' : undefined}
              className={`ctl-seg__opt${circular ? ' is-on' : ''}`}
              onClick={() => g.set({ circular: true })}
            >
              Circular
            </button>
          </div>
        </div>
        <Segmented
          label="View"
          value={g.view}
          options={[
            { value: 'ring', label: 'Ring' },
            { value: 'both', label: 'Both' },
            { value: 'string', label: 'String' },
          ]}
          onChange={(v) => g.set({ view: v })}
        />
      </div>

      <Slider
        label="Display strain A"
        value={g.amp}
        min={0}
        max={0.4}
        step={0.01}
        onChange={(v) => g.set({ amp: v })}
        format={(v) => `${v.toFixed(2)} · real ≈ 10⁻²¹`}
        describe="Size of the stretch and squeeze shown on stage. Exaggerated about 10²⁰ times: GW150914 moved LIGO’s 4 km arms by about a thousandth of a proton’s width."
      />
      <p className="gr-lab__note">Exaggerated about 10²⁰ times. GW150914 moved LIGO&rsquo;s 4 km arms by about a thousandth of a proton&rsquo;s width.</p>

      {/* one row: the speed slider while the wave runs; the phase scrubber while it is paused (or speed is 0) */}
      <div className="gr-speed">
        {phaseMode ? (
          <Slider label="Phase φ" value={g.phase} min={0} max={360} step={1} onChange={(v) => g.set({ phase: v })} format={(v) => `${Math.round(v)}° · paused`} describe="Scrub through one wave cycle" />
        ) : (
          <Slider
            label="Wave speed"
            value={g.speed}
            min={0}
            max={1.2}
            step={0.01}
            onChange={(v) => g.set({ speed: v, paused: false })}
            format={(v) => `${v.toFixed(2)} cycles/s`}
            describe="Display wave cycles per second (slowed about 10² to 10³ times)"
          />
        )}
        <Button
          onClick={() => g.set(phaseMode ? { paused: false, speed: g.speed > 0 ? g.speed : 0.35 } : { paused: true })}
          pressed={phaseMode}
          title={phaseMode ? 'Play the wave' : 'Pause the wave and scrub its phase'}
        >
          {phaseMode ? '▶' : '❙❙'}
        </Button>
      </div>

      <div className="gr-toggles">
        <Toggle label="Tidal forces" checked={g.forces} onChange={(v) => g.set({ forces: v })} describe="Show the arrows of the tidal (stretch/squeeze) force field" />
        <Toggle label="Pitch ×4" checked={g.pitch4} onChange={(v) => g.set({ pitch4: v })} describe="35 Hz is hard to hear on laptop speakers; this raises the chirp two octaves" />
      </div>
      <div className="gr-chirp">
        <Button
          variant="ghost"
          onClick={() => {
            playChirp(g.pitch4)
            g.set({ chirpAt: performance.now(), spin: 2, circular: false })
          }}
          title="Hear a synthesized GW150914 chirp: 35 → 250 Hz in about 0.2 s"
        >
          ♪ Chirp
        </Button>
        <span className="gr-chirp__cap">Synthesized from the inspiral formula; not the recorded data.</span>
      </div>

      <dl className="gr-reads" aria-label="Readouts">
        <div>
          <dt className="t-label">Spin {spin}</dt>
          <dd className="t-mono gr-reads__f">
            {spin >= 1 ? 2 : 1} independent pattern{spin >= 1 ? 's' : ''} · mass 0
          </dd>
        </div>
        <div title="About a thousandth of a proton’s width">
          <dt className="t-label">LIGO · each arm</dt>
          <dd className="t-mono">
            ½hL ≈ 2 × 10⁻¹⁸ <span className="gr-reads__u">m</span>
          </dd>
        </div>
        <div>
          <dt className="t-label">LIGO · arm difference</dt>
          <dd className="t-mono">
            hL ≈ 4 × 10⁻¹⁸ <span className="gr-reads__u">m</span>
          </dd>
        </div>
      </dl>
    </Lab>
  )
}

/* ───────────────────────── the chapter ───────────────────────── */

export default function Overlay() {
  return (
    <>
      <ChapterTitle
        valign="bottom"
        status="derived"
        sub={
          <>
            Gravity, uninvited.
            <GaugeNote />
          </>
        }
        length={LEN.title}
      >
        Why did physicists take strings <em>seriously</em>?
      </ChapterTitle>

      <Step id="origin" length={LEN.origin}>
        <Beat status="observed" kicker="History">
          String theory&rsquo;s mathematics began in 1968, as an attempt to describe the strong nuclear force. By the mid-1970s a better theory of that force,
          QCD, had taken over. Strings survived because of one feature nobody had asked for.
        </Beat>
      </Step>

      <Step id="forces" length={LEN.forces}>
        <Beat status="observed">
          All known forces reduce to four fundamental interactions. Photons carry electromagnetism; W and Z bosons, the weak force; gluons, the strong force.
          One <Term id="quantum-field-theory">quantum field theory</Term>, the Standard Model, describes these three, in places to a part in a trillion. The
          fourth is gravity.
        </Beat>
        <ForceExplorer />
        <Deeper>
          The electron&rsquo;s magnetic moment, g/2 = 1.001 159 652 180 59(13), tests the Standard Model to about 1 part in 10¹². The weak force is feeble at low
          energy because W and Z are heavy, not because its coupling is small: α<sub>W</sub> ≈ 1/30 is larger than α ≈ 1/137.
        </Deeper>
      </Step>

      <Step id="gr" length={LEN.gr}>
        <Beat status={['observed', 'analogy']}>
          Gravity has its own theory: Einstein&rsquo;s <Term id="general-relativity">general relativity</Term>. Mass and energy curve spacetime; curved spacetime
          steers everything that moves. It has passed every test so far: Mercury&rsquo;s orbit, GPS clocks, ripples in spacetime detected in 2015. But it is
          classical. It knows nothing of quanta.
        </Beat>
        <Caption>≈ Analogy · the grid sketches curvature · not to scale</Caption>
        <Deeper>
          The GPS effect is mostly the curvature of <em>time</em>, which a spatial grid cannot show: satellite clocks gain +45 μs/day from gravity and lose 7
          μs/day from their speed, a net +38 μs/day.
        </Deeper>
      </Step>

      <Step id="qg" length={LEN.qg}>
        <GBeat
          chips={
            <>
              <DerivedQFT />
              <Status kind="analogy" />
            </>
          }
        >
          Treat gravity as a quantum field. At everyday energies this works: its quantum effects are calculable and tiny. But gravity strengthens with energy.
          Near the <Term id="planck-energy">Planck energy</Term>, infinitely many unknown inputs all matter, and prediction fails. Black-hole cores and the Big
          Bang reach that regime.
        </GBeat>
        <Caption>◑ here = ordinary quantum field theory + general relativity, not string theory · untested</Caption>
        <Caption>≈ Schematic couplings · fan is a cartoon</Caption>
        <Deeper>
          In the jargon, gravity is <Term id="non-renormalizable">non-renormalizable</Term> but works as an <Term id="effective-field-theory">effective field
          theory</Term>. Its leading quantum correction to Newton&rsquo;s law is calculable:
          <Eq
            display
            tex="U=-\frac{GMm}{r}\Big[1+\frac{3G(M+m)}{rc^{2}}+\frac{41}{10\pi}\frac{G\hbar}{r^{2}c^{3}}\Big]"
            label="U equals minus G M m over r times one plus 3 G M plus m over r c squared plus 41 over 10 pi times G h-bar over r squared c cubed"
          />
          Far above the Planck energy, collisions would simply make black holes; the trouble is a window around it.
        </Deeper>
      </Step>

      <Step id="spin2" length={LEN.spin2}>
        <GBeat
          chips={
            <>
              <Status kind="observed" />
              <Status kind="analogy" />
              <NotObserved>Gravitons · not observed</NotObserved>
            </>
          }
        >
          If gravity is quantum, a <Term id="gravitational-wave">gravitational wave</Term> is a crowd of <Term id="graviton">gravitons</Term>, as light is of
          photons. It stretches a ring of free particles one way, squeezes it the other, then swaps. Two patterns, + and ×, 45° apart: the fingerprint of spin 2.
        </GBeat>
        <Caption>Strain shown 0.2 · real ≈ 10⁻²¹ · exaggerated ~10²⁰×</Caption>
        <Caption>LIGO 4 km arms · each moved ≈ 2 × 10⁻¹⁸ m (½hL)</Caption>
        <Deeper>
          The + / × <Term id="polarization">polarization</Term> pattern is general relativity&rsquo;s prediction. GW170814, seen by three detectors, favored it
          over pure vector (Bayes factor &gt; 200) and pure scalar (&gt; 1000) patterns. A single graviton may never be detectable, and even a clean click could be
          mimicked by classical waves.
        </Deeper>
      </Step>

      <Step id="aha" length={LEN.aha} align="center" valign="bottom" className="gr-step-aha">
        <Beat status={['derived', 'analogy']}>
          <AhaText />
        </Beat>
        <Caption>Cartoon. The graviton is a quantum state; this loop shares its symmetry, not its shape.</Caption>
        <Deeper>
          Why a loop must carry both: <Term id="level-matching">level matching</Term> (N = Ñ) holds because no point on a loop is special. And a theory of
          interacting open strings necessarily includes closed strings, so the spin-2 state comes along either way.
        </Deeper>
      </Step>

      <Step id="forced" length={LEN.forced}>
        <Beat status="derived" kicker="Forced, not inserted">
          In a strong-force model, this massless spin-2 state was a nuisance. In 1973–74 Yoneya, and independently Scherk and Schwarz, showed it interacts at
          low energies like general relativity&rsquo;s graviton. String theory did not add gravity; it could not avoid it. Whether nature agrees is untested.
        </Beat>
        <Deeper>
          Why a spin-2 particle means gravity: any theory of interacting massless spin-2 particles is equivalent to general relativity at low energies, assuming
          Lorentz invariance (Weinberg 1964; Feynman), perhaps with higher-derivative corrections.
        </Deeper>
      </Step>

      <SpinLab />

      <Step id="outro" length={LEN.outro} align="center" valign="bottom" className="gr-step-outro">
        <Beat status="derived">
          In flat spacetime, the bookkeeping that keeps the graviton massless balances only in 10 dimensions (26 for the simpler bosonic string).
        </Beat>
        <p className="gr-gauge gr-gauge--center t-mono">
          <GaugeNote bare />
        </p>
      </Step>
    </>
  )
}
