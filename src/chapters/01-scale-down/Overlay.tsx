import { Beat, Caption, ChapterTitle, Deeper, Eq, GoDeeper, Lab, Readout, Segmented, Status, Step, Term } from '@/ui'
import { particleScale } from '@/core/settings'
import { superscript } from '@/core/math'
import { useLab, type Mode } from './store'
import { LogSlider } from './LogSlider'
import { Tape } from './Tape'
import { Brackets, GapQuestion } from './Gap'
import { BridgeLine, useExitFades } from './Exit'
import {
  JUMPS,
  LEN,
  LHC_GEV,
  LS_MAX,
  LS_MIN,
  L_PLANCK,
  S_MAX,
  S_MIN,
  deltaOf,
  energy,
  energyOf,
  lhcRatio,
  resolveOf,
  sci,
  si,
  slowdownOf,
} from './model'
import './styles.css'

const BRIDGE = 'One kind of string. So why does the world contain so many different particles?'
const BRIDGE_CAP = 'Open or closed? That depends on the version of string theory. We start with the simplest picture.'

const CAP = {
  unresolved: 'At this zoom, no experiment could tell a point from a string.',
  edge: 'At the edge of resolution: the glow starts to stretch.',
  pointDeep: 'A true point never resolves. Zoom forever: still a point.',
  resolved: 'You’ve zoomed past the string’s length. Now its shape shows.',
  excluded: 'Ruled out: strings this long would already have shown up in collisions.',
  partly: 'Partly tested: collider searches exclude this in some models, not all.',
}

export default function Overlay() {
  const pts = Math.round((80000 * particleScale()) / 1000) * 1000
  useExitFades()
  return (
    <>
      <ChapterTitle length={LEN.title} status={['observed', 'analogy']} sub="From your fingertip down to the edge of what can be measured, and one question beyond it.">
        What is everything <em>made of</em>?
      </ChapterTitle>

      <Step id="you" length={LEN.you} className="sd-step">
        <Tape />
        <Beat status={['observed', 'analogy']}>
          Start with something familiar: you, about 1.7 meters tall. What are you made of? Keep your eye on the fingertip. We will zoom toward it, ten times
          closer at every step, until our instruments run out.
        </Beat>
        <Caption>
          <Status kind="analogy" compact /> This figure: {pts.toLocaleString('en-US')} drawn points. You: roughly 30 trillion cells.
        </Caption>
      </Step>

      <Step id="skin" length={LEN.skin} className="sd-step">
        <Beat status={['observed', 'analogy']}>
          Each tick on the gauge is one <Term id="order-of-magnitude">order of magnitude</Term>, a factor of ten. Skin gives way to living cells, each some
          ten to twenty micrometers across.
        </Beat>
        <Caption>Fingertip → skin → one living cell · drawn in light, not to scale</Caption>
      </Step>

      <Step id="dna" length={LEN.dna} className="sd-step">
        <Beat status={['observed', 'analogy']}>Inside, DNA coils: a molecule two nanometers wide, far narrower than a wavelength of visible light.</Beat>
        <Caption>Light microscopes blur detail finer than about 200 nm. Smaller things are measured with electrons, X-rays or collisions; these are drawings.</Caption>
      </Step>

      <Step id="atom" length={LEN.atom} className="sd-step">
        <Beat status={['observed', 'analogy']}>
          One of DNA&rsquo;s carbon atoms, about 10⁻¹⁰ m across. No planets, no orbits. Its electrons form a <Term id="probability-cloud">probability cloud</Term>{' '}
          that shows where each is likely to be found. Detect one, and it turns up in a single spot.
        </Beat>
        <Deeper>
          The haze samples Slater&rsquo;s radial densities for carbon&rsquo;s six electrons: two in 1s (Z<sub>eff</sub> = 5.70), four in n = 2 (Z
          <sub>eff</sub> = 3.25). Angular shapes, bonding and the 2s node are simplified away.
        </Deeper>
      </Step>

      <Step id="dark" length={LEN.dark} className="sd-step">
        <Beat status="observed">
          <span className="sd-quiet">Four powers of ten with nothing to draw. Not empty: the electron cloud reaches in here too.</span>
        </Beat>
      </Step>

      <Step id="proton" length={LEN.proton} className="sd-step">
        <Beat status={['observed', 'analogy']}>
          Tens of thousands of times smaller: the nucleus, six protons and six neutrons. A proton, radius about 0.84 × 10⁻¹⁵ m, is not three marbles. Three{' '}
          <Term id="quark">quarks</Term> churn in a seething <Term id="gluon">gluon</Term> field, with quark–antiquark pairs flickering in and out.
        </Beat>
        <Caption>The three quarks&rsquo; rest masses add up to only about 1% of the proton&rsquo;s mass.</Caption>
        <Caption>
          <Status kind="analogy" compact /> A cartoon of quantum fluctuations. A quark&rsquo;s &ldquo;color&rdquo; charge is a name, not a color.
        </Caption>
        <Deeper>
          2 × 2.16 MeV + 4.70 MeV ≈ 9 MeV of 938 MeV. Counting sea quarks too, lattice QCD attributes about 9% of the proton&rsquo;s mass to quark-mass
          effects; the rest is energy of the quarks&rsquo; motion and the gluon field.
        </Deeper>
      </Step>

      <Step id="points" length={LEN.points} className="sd-step">
        <Beat status="observed">
          Keep zooming onto one quark. Notice: it never grows. The <Term id="standard-model">Standard Model</Term> treats quarks and electrons as{' '}
          <Term id="point-particle">point particles</Term>, with no size and no parts. Experiments agree so far: any size is below a few times 10⁻¹⁹ m.
        </Beat>
        <Deeper>
          Only direct, conservative bounds are quoted: electron &lt; 2.8 × 10⁻¹⁹ m (LEP), quark &lt; 4.3 × 10⁻¹⁹ m (HERA). Smaller figures from Penning traps
          or g−2 depend on models, so they are not used here.
        </Deeper>
      </Step>

      <Step id="gap" length={LEN.gap} className="sd-step sd-step--gap">
        <div className="sd-gap">
          <GapQuestion>What if they aren&rsquo;t points?</GapQuestion>
          <div className="sd-gap__rest">
            <Beat status="observed">
              Past this edge, no experiment resolves anything directly. The unexplored stretch down to the <Term id="planck-length">Planck length</Term>, 1.6 ×
              10⁻³⁵ m, spans about sixteen powers of ten, about as many as the whole journey from you to a proton.
            </Beat>
            <Brackets />
          </div>
        </div>
      </Step>

      <Step id="reveal" length={LEN.reveal} className="sd-step sd-step--reveal">
        <Beat status={['speculative', 'derived', 'analogy']}>
          String theory proposes an answer. Look closely enough, it says, and each point particle would be a tiny vibrating <Term id="string">string</Term>.
          From afar, a string would look just like a point. Its length is unknown; we draw it near 10⁻³⁴ m, one traditional estimate.
        </Beat>
        <Caption>Not a string inside the quark. In this picture, the quark itself would be a string.</Caption>
        <Deeper>
          <span className="sd-deeper-chip">
            <Status kind="derived" compact />
          </span>
          That a string probed at distances much larger than ℓ<sub>s</sub> behaves like a point particle is derived within string theory, with corrections
          shrinking as powers of ℓ<sub>s</sub>/Δx. A quantum string has no definite shape; its measured size even grows slowly as resolution sharpens.
        </Deeper>
      </Step>

      <PointOrString />

      <Step id="bridge" length={LEN.bridge} align="center" valign="bottom" className="sd-step sd-step--bridge">
        {/* in-flow copy for assistive tech; the visible line is pinned under the handoff string (BridgeLine) */}
        <div className="sr-only">
          <Beat status={['speculative', 'analogy']}>{BRIDGE}</Beat>
          <Caption>{BRIDGE_CAP}</Caption>
        </div>
        <BridgeLine>
          <Beat status={['speculative', 'analogy']}>{BRIDGE}</Beat>
          <Caption>{BRIDGE_CAP}</Caption>
        </BridgeLine>
      </Step>
    </>
  )
}

/* ───────────── Lab: Point or string? ───────────── */

function PointOrString() {
  const s = useLab((st) => st.s)
  const mode = useLab((st) => st.mode)
  const ls = useLab((st) => st.ls)
  const setS = useLab((st) => st.setS)
  const setMode = useLab((st) => st.setMode)
  const setLs = useLab((st) => st.setLs)
  const jumpTo = useLab((st) => st.jumpTo)

  const L = Math.pow(10, s)
  const delta = deltaOf(s)
  const E = energyOf(s)
  const ell = mode === 'string' ? Math.pow(10, ls) : 0
  const ratio = ell / delta
  const state = resolveOf(ratio)
  const caption = mode === 'point' ? (s < -20 ? CAP.pointDeep : CAP.unresolved) : state === 'unresolved' ? CAP.unresolved : state === 'edge' ? CAP.edge : CAP.resolved
  const zone = mode === 'string' ? (ls > -19 ? CAP.excluded : ls > -20 ? CAP.partly : null) : null
  const scaleText = s < -30 ? sci(L, 2) : `${sci(L, 2)} · ${si(s)}`

  // Go-deeper highlights, driven by the same state as the scene
  const eLhc = Math.log10(E / LHC_GEV)
  const hl = {
    dx: Math.min(1, Math.max(0, eLhc + 1)),
    E: Math.min(1, Math.max(0, eLhc + 1)),
    lp: Math.max(0, 1 - Math.abs(Math.log10(delta / L_PLANCK)) / 1.5),
    ls: mode === 'string' ? (ratio >= 1 ? 1 : 0.55) : 0,
    ap: mode === 'string' ? (ratio >= 1 ? 1 : 0.55) : 0,
  }

  return (
    <Lab
      title="Point or string?"
      status={['observed', 'speculative', 'analogy']}
      length={LEN.lab}
      intro={<p className="sd-lab__intro">You start where the story ended. Zoom out, or tap Edge, then flip between point and string.</p>}
      footer={
        <>
          <span className="sd-lab__note">
            <Status kind="analogy" compact />
            <span>Thickness, glow and speed drawn for visibility. Real strings have no thickness.</span>
          </span>
          <GoDeeper title="How do you measure the size of something you can’t see?">
            <p>
              Physicists measure the size of the very small by collision: fire a probe at a target and watch how it scatters. At high enough energy, an
              extended object scatters less than a point of the same charge would (its &ldquo;form factor&rdquo; falls off); a true point never shows that
              shortfall. The finest detail a probe can resolve is set by its energy:
            </p>
            <Eq display tex={String.raw`\htmlClass{term-dx}{\Delta x} \approx \frac{\hbar c}{\htmlClass{term-E}{E}}`} highlight={hl} label="Delta x is about h-bar c divided by E" />
            <p>
              <strong>Δx</strong> is the smallest resolvable distance: the lab&rsquo;s <strong>finest-detail</strong> readout (one fiftieth of the field of
              view). <strong>E</strong> is the probe&rsquo;s energy: the lab&rsquo;s <strong>energy</strong> readout. <strong>ħc</strong> ≈ 197 MeV·fm
              converts between them. Collisions are how quarks were found: from 1968, electrons fired at protons at SLAC scattered as if from tiny point-like
              constituents inside.
            </p>
            <p className="sd-live t-mono">
              Now: Δx = {sci(delta, 2)} → E ≈ {energy(E)} ({lhcRatio(E)})
            </p>
            <p>Where would new structure be expected? Combine the constants of quantum theory, gravity and relativity, and one natural length appears:</p>
            <Eq display tex={String.raw`\htmlClass{term-lp}{\ell_P} = \sqrt{\frac{\hbar G}{c^3}} \approx 1.6\times10^{-35}\ \text{m}`} highlight={hl} label="The Planck length is the square root of h-bar G over c cubed, about 1.6 times ten to the minus 35 meters" />
            <p>
              <strong>ħ</strong> carries quantum mechanics, <strong>G</strong> gravity and <strong>c</strong> relativity. Near <strong>ℓ<sub>P</sub></strong>{' '}
              (the Planck marker on the gauge), gravity&rsquo;s quantum effects are expected to become strong. Put ℓ<sub>P</sub> into the first formula and E
              comes out near 10¹⁹ GeV, about 10¹⁵ times the LHC&rsquo;s collision energy.
            </p>
            <p>
              String theory has exactly one adjustable length of its own, the string length (Newton&rsquo;s G is then no longer independent: it follows from
              ℓ<sub>s</sub>, the string coupling and the size of any hidden dimensions):
            </p>
            <Eq display tex={String.raw`\htmlClass{term-ls}{\ell_s} = \sqrt{\htmlClass{term-ap}{\alpha'}} \qquad (\hbar = c = 1;\ \text{some authors include factors such as } 2\pi)`} highlight={hl} label="The string length is the square root of alpha prime" />
            <p>
              <strong>α′</strong> (&ldquo;alpha-prime&rdquo;) sets the string&rsquo;s tension, T = 1/(2πα′), and its size, and <strong>ℓ<sub>s</sub></strong>{' '}
              is the lab&rsquo;s string-length slider. The theory does not fix its value. Experiments require ℓ<sub>s</sub> to be below roughly 10⁻¹⁹ m, and
              traditional estimates put it within a few powers of ten of ℓ<sub>P</sub>. For probes with Δx much larger than ℓ<sub>s</sub>, string
              theory&rsquo;s predictions reduce to those of point particles, with corrections too small to see. That is why the reveal can happen only past
              the edge of what we can measure.
            </p>
          </GoDeeper>
        </>
      }
    >
      <Segmented<Mode>
        label="Model"
        value={mode}
        onChange={setMode}
        options={[
          {
            value: 'point',
            label: (
              <span className="sd-opt">
                Point <small>Standard Model</small>
              </span>
            ),
            hint: 'Point: the Standard Model’s picture, ℓ = 0',
          },
          {
            value: 'string',
            label: (
              <span className="sd-opt">
                String <small>hypothesis</small>
              </span>
            ),
            hint: 'String: a string of length ℓs (hypothetical)',
          },
        ]}
      />
      <p className="sd-lab__cap" aria-live="polite">
        {caption}
      </p>
      <LogSlider label="Field of view" value={s} min={S_MIN} max={S_MAX} onChange={setS} format={(v) => sci(Math.pow(10, v), 2)} buttons describe="Zoom: the field of view from 3 m down to 10⁻³⁶ m" />
      <div className="sd-jumps" role="group" aria-label="Jump to a landmark">
        {JUMPS.map((j) => (
          <button key={j.id} type="button" className={`sd-jump${Math.abs(s - j.s) < 0.05 ? ' is-on' : ''}`} onClick={() => jumpTo(j.s)}>
            {j.label}
          </button>
        ))}
      </div>
      <LogSlider
        label={
          <>
            String length <span className="sd-unit">ℓ<sub>s</sub></span> · unknown
          </>
        }
        value={ls}
        min={LS_MIN}
        max={LS_MAX}
        onChange={setLs}
        disabled={mode === 'point'}
        note={zone}
        format={(v) => (mode === 'point' ? 'ℓ = 0' : sci(Math.pow(10, v), 1))}
        describe="The hypothetical string length, from 10⁻¹⁷ m down to 10⁻³⁵ m"
        zones={[
          { from: -17, to: -19, kind: 'excluded', label: 'Excluded' },
          { from: -19, to: -20, kind: 'probed', label: 'Some models' },
          { from: -20, to: -35, kind: 'open', label: 'Unexplored' },
        ]}
      />
      <div className="sd-readouts">
        <Readout label="Scale" value={scaleText} tone="ink" />
        <Readout label="Finest detail" value={sci(delta, 1)} />
        <Readout label="Probe energy" value={`≈ ${energy(E)}`} tone="field" />
        <Readout
          label={
            <>
              vs LHC 13.6 <span className="sd-unit">TeV</span>
            </>
          }
          value={lhcRatio(E).replace(' × LHC', '×').replace('≪ LHC', '≪ 1×')}
        />
        {mode === 'string' && <Readout label="Shown" value={`~10${superscript(slowdownOf(Math.pow(10, ls)))}× slower`} tone="filament" />}
        <p className="sd-lab__energy">
          Seeing smaller takes more energy: about <span className="t-mono">ħc</span> divided by the distance.
        </p>
      </div>
    </Lab>
  )
}
