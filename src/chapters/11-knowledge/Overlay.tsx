import { Beat, Caption, ChapterTitle, Deeper, Eq, GoDeeper, Lab, Step, Term } from '@/ui'
import { useKnowledge } from './store'
import { STEPS } from './model'
import { Bench, BenchDeeper } from './Bench'
import { Browse, ClaimCard } from './ClaimCard'
import { Finale } from './Finale'
import './styles.css'

/*
 * Chapter 11 · What We Know — copy from content/11-knowledge.md (refereed).
 * Beats → steps (ids are what the Scene's director reads), then the Referee's Bench, then the epilogue.
 */

const EQ_BH = String.raw`S_{\text{BH}} = \frac{\htmlClass{term-kB}{k_B}\,c^{3}}{\htmlClass{term-quarter}{4}\,G\,\hbar}\,\htmlClass{term-A}{A} \;=\; \htmlClass{term-kB}{k_B}\,\frac{\htmlClass{term-A}{A}}{\htmlClass{term-quarter}{4}\,\htmlClass{term-lp}{\ell_P^{2}}}`
const EQ_SV = String.raw`\ln \htmlClass{term-Omega}{\Omega} \;\simeq\; 2\pi\sqrt{\htmlClass{term-Q1}{Q_1}\,\htmlClass{term-Q5}{Q_5}\,\htmlClass{term-N}{N}} \;=\; \frac{\htmlClass{term-A5}{A_5}}{4\,\htmlClass{term-G5}{G_5}}`

function CountDeeper() {
  // Beat 3 drives Q1, Q5, N in Phase A and A5, G5 in Phase C (Go deeper § highlight keys).
  const phase = useKnowledge((s) => s.countPhase)
  const a = phase === 1 ? 1 : 0
  const c = phase === 3 ? 1 : 0
  const hl = { Q1: a, Q5: a, N: a, A5: c, G5: c, Omega: phase === 2 ? 1 : 0, A: c }
  return (
    <GoDeeper id="count" title="Counting a black hole">
      <p>General relativity plus quantum fields give a black hole an entropy fixed by its horizon:</p>
      <Eq display tex={EQ_BH} highlight={hl} label="S B H equals k B c cubed over 4 G h-bar, times A, which equals k B times A over 4 Planck lengths squared" />
      <ul>
        <li>
          <strong>A</strong>: the horizon area (the sphere in the diorama).
        </li>
        <li>
          <strong>
            ℓ<sub>P</sub>² = Għ/c³
          </strong>
          : the Planck area, Chapter 1’s Planck length squared, about 2.6 × 10⁻⁷⁰ m².
        </li>
        <li>
          <strong>¼</strong>: Hawking’s factor, fixed by his 1974 calculation of black-hole radiation.
        </li>
        <li>
          <strong>
            k<sub>B</sub>
          </strong>
          : Boltzmann’s constant, the unit of entropy.
        </li>
      </ul>
      <p>
        Boltzmann taught that entropy counts arrangements: S = k<sub>B</sub> ln Ω. A solar-mass black hole has S ≈ 10⁷⁷ k<sub>B</sub>. So what are its Ω
        arrangements? For one family of black holes, string theory answers:
      </p>
      <Eq display tex={EQ_SV} highlight={hl} label="ln Omega is approximately 2 pi root Q1 Q5 N, which equals A5 over 4 G5" />
      <ul>
        <li>
          <strong>Q₁, Q₅</strong>: how many D1-branes and D5-branes are wrapped on the hidden dimensions (the rings and bands).
        </li>
        <li>
          <strong>N</strong>: units of momentum carried around the hidden circle by open strings (the warm arcs), all moving the same way.
        </li>
        <li>
          <strong>Ω</strong>: the number of quantum states with these charges, counted at weak coupling, where there is no black hole. (Strictly, a
          supersymmetry-protected signed count.)
        </li>
        <li>
          <strong>≃</strong>: equal at leading order for large charges; the exact count has small corrections.
        </li>
        <li>
          <strong>A₅, G₅</strong>: the horizon area and Newton’s constant of the five-dimensional black hole with the same charges (units with ħ = c =
          k<sub>B</sub> = 1).
        </li>
      </ul>
      <p>
        The left side is counted with the string coupling turned down. The right side is computed with it turned up. Supersymmetry keeps the count from
        changing in between, and for large charges the two agree, factor ¼ included. With Q₁ = 4, Q₅ = 5 and N = 30, the leading formula gives ln Ω ≈
        153.9, so Ω ~ 10⁶⁷; the exact count at such small charges differs by a few percent in ln Ω. No one has achieved the same match for ordinary,
        non-supersymmetric black holes like those in our sky.
      </p>
    </GoDeeper>
  )
}

function PluckButton() {
  const requestPluck = useKnowledge((s) => s.requestPluck)
  return (
    <button type="button" className="kn-pluck" onClick={requestPluck}>
      <span className="kn-pluck__line" aria-hidden="true" />
      Pluck the Thread
    </button>
  )
}

export default function Overlay() {
  return (
    <>
      <ChapterTitle status="analogy" length={STEPS.title} sub="Ten chapters, one idea. Now an honest ledger. Every claim you met wore a mark: measured, derived, conjectured or speculative. Sort the claims by how far each stands from an experiment, and see what rests on solid ground.">
        What do we <em>actually</em> know?
      </ChapterTitle>

      <Step id="ground" length={STEPS.ground}>
        <Beat status="observed">
          Solid ground first. Quantum mechanics, relativity and the Standard Model have matched experiment for decades: the Higgs boson in 2012,
          gravitational waves in 2015. Even solid ground has cracks: <Term id="dark-matter">dark matter</Term>, dark energy, neutrino masses, and no tested{' '}
          <span className="kn-nw">
            <Term id="quantum-gravity">quantum theory of gravity</Term>.
          </span>
        </Beat>
        <Browse hint="Tap any point to read the claim" />
      </Step>

      <Step id="scaffold" length={STEPS.scaffold}>
        <Beat status="derived">
          Above the ground stands a structure of mathematics, built on quantum mechanics and relativity. Its{' '}
          <Term id="consistency-condition">consistency conditions</Term> decide a lot: superstrings need ten dimensions; quantum anomalies cancel only for
          special symmetries (Green and Schwarz, 1984); every closed-string theory contains a graviton. All derived. None tested.
        </Beat>
        <Caption>◑ Derived · follows from the equations · untested in nature</Caption>
        <Browse hint="Read the derived results" />
      </Step>

      <Step id="count" length={STEPS.count}>
        <Beat status={['derived', 'analogy']}>
          Bekenstein and Hawking concluded that a black hole carries <Term id="bekenstein-hawking-entropy">entropy</Term>: one quarter of its horizon’s
          area, in Planck units. Entropy counts hidden{' '}
          <span className="kn-nw">
            <Term id="microstate">microstates</Term>.
          </span>{' '}
          In 1996 Strominger and Vafa counted them for idealized
          black holes built from strings and branes. For large charges, the count matched.
        </Beat>
        <Caption>The entropy formula comes from general relativity plus quantum fields; the count comes from string theory. Neither has been measured.</Caption>
        <Deeper>
          ln Ω ≃ 2π√(Q₁Q₅N) = A₅/4G₅ at leading order. At Q₁ = 4, Q₅ = 5, N = 30 the exact supersymmetric index differs by 1–2% in ln Ω (a factor of ~8
          in Ω), so the stage shows only Ω ~ 10⁶⁷.
        </Deeper>
        <div className="kn-deeper-row">
          <CountDeeper />
        </div>
      </Step>

      <Step id="hologram" length={STEPS.hologram}>
        <Beat status={['conjectured', 'analogy']}>
          Chapter 8 previewed Maldacena’s 1997 conjecture: string theory inside a curved, box-like <Term id="anti-de-sitter-space">anti-de Sitter space</Term>{' '}
          exactly equals a quantum theory without gravity on its boundary. Unproven, it has passed many demanding mathematical checks and helps model hot
          nuclear matter. Our universe is not this shape.
        </Beat>
        <Caption>~ 2 space directions + time drawn (AdS₅ has 4 + 1) · S⁵ omitted · the disk geometry is exact</Caption>
        <Deeper>
          A geodesic ending on the rim at φ ± θ dips to radius r = tan(π/4 − θ/2), so θ(r) = π/2 − 2 arctan r: deeper inside, wider on the boundary.
        </Deeper>
      </Step>

      <Step id="fog" length={STEPS.fog}>
        <Beat status={['speculative', 'analogy']}>
          Above the scaffold, fog. Does string theory describe our universe at all? Its equations seem to allow a vast{' '}
          <Term id="string-landscape">string landscape</Term> of solutions (one rough estimate: 10⁵⁰⁰), each with different physics. Critics ask whether
          it is{' '}
          <span className="kn-nw">
            <Term id="falsifiable">testable</Term>.
          </span>{' '}
          Rival approaches exist. None, strings included, is confirmed.
        </Beat>
        <Browse hint="Read the open questions" />
      </Step>

      <Step id="demand" length={STEPS.demand}>
        <Beat status="observed" kicker="The evidence, 2026">
          Now demand a measurement. The fog clears. The scaffold fades. What remains is superb, unfinished physics, with no superpartner, no extra dimension
          and not one string. The Thread you have followed for ten chapters has never been observed.
        </Beat>
        <p className="sr-only">
          Detected so far: strings 0, superpartners 0, extra dimensions 0. Claims shown 14 of 34; string-theory claims shown 0 of 17. Only strings glow warm
          on this site. Measured ground has none.
        </p>
      </Step>

      <Lab
        title="Referee’s Bench"
        status={['observed', 'analogy']}
        hint="Drag to orbit · tap any point in the map to read its claim"
        length={STEPS.lab}
        intro={
          <>
            <p>Choose how much evidence you demand. Then judge nine claims yourself.</p>
            <BenchDeeper />
          </>
        }
        footer={<Bench.Footer />}
      >
        <Bench />
      </Lab>

      <Step id="unseen" length={STEPS.unseen}>
        <Beat status={['observed', 'speculative']}>
          Unobserved is not the same as wrong. If strings are near the Planck length, no foreseeable experiment could see them directly. Meanwhile their
          mathematics has already changed how physicists think about black holes, quantum fields and geometry. Whether nature uses it remains open.
        </Beat>
      </Step>

      <Step id="verdict" length={STEPS.verdict}>
        <Beat status={['speculative', 'observed']}>
          What would change the verdict? Clues might come from superpartners, hidden dimensions, or cosmic strings stretched across the sky. None has
          appeared, and none alone would settle it. Decisive evidence needs a prediction only strings make, then a measurement that confirms it.
        </Beat>
      </Step>

      <Step id="pluck" length={STEPS.pluck} align="center" valign="lower" className="kn-pluck-step">
        <Beat status="analogy">
          The title called it a hypothesis. It still is one: elegant, consistent wherever anyone has checked, and unconfirmed. The Thread was always a
          picture of an idea, not of a thing. Pluck it once more.
        </Beat>
        <PluckButton />
      </Step>

      <Step id="rest" length={STEPS.rest} align="wide" valign="bottom" className="kn-rest">
        <Finale />
      </Step>

      <ClaimCard />
    </>
  )
}
