import { Beat, Button, Caption, ChapterTitle, Deeper, Eq, GoDeeper, Lab, Step, Term } from '@/ui'
import { useVib } from './store'
import { LabPanel } from './LabPanel'
import { level, packetCount } from './model'
import { STEP_LEN } from './timeline'
import './styles.css'

/** Term highlights for the Go-deeper equations, driven by the bench's state. */
function useHighlights() {
  const k = useVib((s) => s.k)
  const ends = useVib((s) => s.ends)
  const pol = useVib((s) => s.pol)
  const dist = useVib((s) => s.dist)
  const tab = useVib((s) => s.tab)
  const particle = useVib((s) => s.particle)
  const pinned = ends === 'pinned'
  const kk = particle && particle !== 'grav' ? [0, 0, 0, 0, 0, 0] : k
  const N = level(kk)
  const K = packetCount(kk)
  return {
    n: pinned || K > 0 ? 1 : 0,
    inst: pinned ? 1 : 0,
    fn: pinned ? 1 : 0,
    k: !pinned && K > 0 ? 1 : 0,
    N: !pinned && N > 0 ? 1 : 0,
    alpha: tab === 'ladder' ? 1 : 0,
    M: !pinned && dist > 100 ? 1 : 0,
    J: !pinned && (pol === 'cw' || pol === 'ccw') ? 1 : 0,
  }
}

function DeeperDrawer() {
  const hl = useHighlights()
  return (
    <GoDeeper title="The ladder, term by term">
      <p>A guitar string’s harmonics obey</p>
      <Eq
        display
        tex="\htmlClass{term-fn}{f_n}=\frac{\htmlClass{term-n}{n}}{2\htmlClass{term-inst}{L}}\sqrt{\frac{\htmlClass{term-inst}{T}}{\htmlClass{term-inst}{\mu}}}"
        highlight={hl}
        label="f sub n equals n over 2 L times the square root of T over mu"
      />
      <p>
        The <strong>harmonic number</strong> <Eq tex="n" /> counts the arches. <strong>Length</strong> <Eq tex="L" />, <strong>tension</strong> <Eq tex="T" />{' '}
        and <strong>mass per length</strong> <Eq tex="\mu" /> belong to the instrument. The <strong>frequency</strong> <Eq tex="f_n" /> climbs in equal steps:
        110, 220, 330 Hz.
      </p>
      <p>
        A quantum open superstring (in units where <Eq tex="\hbar=c=1" />) obeys
      </p>
      <Eq
        display
        tex="\htmlClass{term-M}{M}^2=\frac{\htmlClass{term-N}{N}}{\htmlClass{term-alpha}{\alpha'}},\qquad \htmlClass{term-N}{N}=\sum_{n\ge 1} \htmlClass{term-n}{n}\,\htmlClass{term-k}{k_n}"
        highlight={hl}
        label="M squared equals N over alpha prime, where N is the sum over n of n times k sub n"
      />
      <p>
        Here <Eq tex="k_n" /> is the <strong>packet count</strong> in harmonic <Eq tex="n" /> (the dots on each chip), and <Eq tex="N" /> is the{' '}
        <strong>level</strong> (the rung). <Eq tex="\alpha'" /> is the theory’s single scale, met in Chapter 1 (the string length is <Eq tex="\sqrt{\alpha'}" />), and{' '}
        <Eq tex="M_s = 1/\sqrt{\alpha'}" /> is the{' '}
        <strong>string scale</strong>. <Eq tex="M" /> is the <strong>mass</strong> reported by the distant point. The massless bottom rung is not a still
        string: a quantum effect of its jitter exactly offsets the energy of its lowest excitation. Closed strings follow the same logic, with{' '}
        <Eq tex="M^2 = 4N/\alpha'" /> and equal left- and right-moving levels.
      </p>
      <p>
        Why mass-squared? Here is a heuristic. A heavier string is longer, and a longer string vibrates more slowly. Each new packet brings energy in proportion
        to its frequency, so each adds less mass than the one before, and <Eq tex="M^2" />, not <Eq tex="M" />, climbs evenly.
      </p>
      <Eq
        display
        tex="\htmlClass{term-J}{J_{\max}}=\htmlClass{term-alpha}{\alpha'} \htmlClass{term-M}{M}^2+1"
        highlight={hl}
        label="J max equals alpha prime M squared plus 1"
      />
      <p>
        Every packet carries a direction, like a small arrow, and so does the bottom-rung state. Line them all up and their spins add, so the{' '}
        <strong>maximum spin</strong> <Eq tex="J_{\max}" /> on rung <Eq tex="N" /> is <Eq tex="N+1" /> units of <Eq tex="\hbar" />. Spin rising with
        mass-squared was first seen in real hadrons, with a slope of about 0.9 GeV⁻². That pattern was one of the clues that led to string theory in 1968–70. In
        hadrons the “string” is a flux tube between quarks. A fundamental string’s <Eq tex="\alpha'" /> would be roughly <Eq tex="10^{36}" /> times smaller, if{' '}
        <Eq tex="M_s \approx 10^{18}" /> GeV.
      </p>
      <h3>What the bench draws</h3>
      <ul>
        <li>
          Free (Neumann) ends give <Eq tex="\cos n\pi\sigma" /> modes; pinned (Dirichlet) ends give <Eq tex="\sin n\pi\sigma" />. Both have{' '}
          <Eq tex="\omega_n = n\,\omega_1" />.
        </li>
        <li>
          A harmonic holding <Eq tex="k_n" /> packets is drawn with amplitude <Eq tex="A_n = A_q\sqrt{k_n/n}" />, the form of the open-string mode expansion;{' '}
          <Eq tex="A_q" /> stands in for <Eq tex="\sqrt{2\alpha'}" />.
        </li>
        <li>
          A pluck is projected onto the six harmonics; on release, <Eq tex="k_n = \min(3, \mathrm{round}(n c_n^2/A_q^2))" />.
        </li>
        <li>States on rung N: 16, 256, 2 304, 15 360, 84 224 … (10D open superstring, bosons + fermions). The bench shows one of them.</li>
        <li>Not drawn: charges, fermions (spin ½), closed strings, interactions, and six of the eight transverse directions.</li>
      </ul>
    </GoDeeper>
  )
}

function LabFooter() {
  const reset = useVib((s) => s.reset)
  return (
    <>
      <DeeperDrawer />
      <Button onClick={reset}>Reset</Button>
    </>
  )
}

export default function Overlay() {
  return (
    <>
      <ChapterTitle status={['derived', 'analogy']} valign="bottom" length={STEP_LEN.title}>
        How can one kind of thing look like <em>many particles</em>?
      </ChapterTitle>

      <Step id="opening" length={STEP_LEN.opening} align="left">
        <Beat status={['observed', 'analogy']} kicker="One thread, seventeen particles?">
          Chapter 1 ended on a proposal: the smallest things might be tiny strings, not points. A harder question follows. The Standard Model lists seventeen
          fundamental particles. How could one kind of string be all of them?
        </Beat>
        <Caption>≈ Picture: across is position along the string; up/down and in/out are real directions it moves.</Caption>
      </Step>

      <Step id="harmonics" length={STEP_LEN.harmonics} align="left">
        <Beat status="observed" kicker="Only certain patterns">
          Pin a string at both ends and pluck it. Its steady vibrations come in only certain patterns: one arch, two, three, and so on. Each is a{' '}
          <Term id="harmonic">harmonic</Term>, at a whole-number multiple of the lowest frequency. Any pluck is a blend of them.
        </Beat>
        <Caption>A guitar’s A string: 110 · 220 · 330 · 440 Hz</Caption>
      </Step>

      <Step id="packets" length={STEP_LEN.packets} align="left">
        <Beat status={['derived', 'observed', 'analogy']} kicker="Packets, and mass">
          String theory’s strings aren’t pinned to a guitar, yet the whole-number rule survives. Quantum physics adds another: vibration comes in whole packets,{' '}
          <Term id="quanta">quanta</Term>. And by E = mc², vibration energy is mass. So more vibration means a heavier particle, with mass-squared rising in
          equal steps.
        </Beat>
        <Caption>E = mc² is observed · the ladder is derived · beads, graph view and jitter are pictures</Caption>
        <Deeper>
          <p className="vib-deeper">
            Each packet in harmonic <Eq tex="n" /> adds <Eq tex="n" /> to the <Term id="level">level</Term> <Eq tex="N=\sum n k_n" />, and{' '}
            <Eq tex="M^2 = N/\alpha'" />. Free (Neumann) ends give <Eq tex="\cos n\pi\sigma" /> modes, so harmonic <Eq tex="n" /> has <Eq tex="n" /> nodes.
          </p>
        </Deeper>
      </Step>

      <Step id="spin" length={STEP_LEN.spin} align="left">
        <Beat status={['derived', 'analogy']} kicker="Which way it wiggles">
          Vibrations have a direction, too. Up-down and in-out wiggles are different states, like light’s <Term id="polarization">polarizations</Term>. A
          swirling wiggle carries angular momentum around its axis: <Term id="spin">spin</Term>. More packets of vibration can line up to carry more spin.
        </Beat>
        <Caption>≈ The swirl is a picture · only 2 of 8 transverse directions shown</Caption>
        <Deeper>
          <p className="vib-deeper">
            With every packet in harmonic 1, spin peaks at <Eq tex="J_{\max} = \alpha' M^2 + 1" />: the leading Regge trajectory. The swirling one-packet state,
            seen in real space, is the classical rotating rod behind <Eq tex="J = \alpha' E^2" />.
          </p>
        </Deeper>
      </Step>

      <Step id="stepback" length={STEP_LEN.stepback} align="left" valign="top">
        <Beat status={['derived', 'analogy']} kicker="Step back">
          Now step back. Seen from far beyond its own size, the string blurs into a point. Only what it carries survives: a mass, a spin, charges. Change the
          vibration and a different ‘particle’ appears. One kind of object, many <Term id="state">states</Term>.
        </Beat>
        <Caption>≈ Not to scale · loupes magnify ~10¹⁵×</Caption>
      </Step>

      <Step id="bottomrung" length={STEP_LEN.bottomrung} align="left">
        <Beat status={['derived', 'observed', 'speculative']} kicker="The bottom rung">
          The twist: every elementary particle ever measured would sit on the bottom rung, massless by string standards. Their small masses would switch on at
          far lower energies, through effects like the Higgs field. The next rung, the <Term id="string-scale">string scale</Term>, is probably far beyond any
          collider.
        </Beat>
        <Caption>○ The string scale in GeV is unknown · the strip assumes 10¹⁸ GeV</Caption>
      </Step>

      <Step id="charge" length={STEP_LEN.charge} align="left">
        <Beat status={['derived', 'speculative', 'analogy']} kicker="Where charge comes from">
          And charge? In string theory it would come from how the string moves or wraps in <Term id="hidden-dimensions">hidden dimensions</Term>, or where its
          ends attach. Some constructions reproduce the Standard Model’s forces and particle families. None yet predicts the measured masses or force strengths.
        </Beat>
        <Caption>○ Whether any construction describes our universe is an open question</Caption>
        <Caption>≈ Schematic, not to scale: hidden dimensions need not be circles, and their size is unknown (Ch. 5–7).</Caption>
      </Step>

      <Lab
        title="The Vibration Bench"
        status={['derived', 'observed', 'analogy']}
        hint="Drag anywhere on the string, then let go"
        length={STEP_LEN.lab}
        intro={<p>Pluck the string or tap the harmonics. Then step back and see what a distant observer would call it.</p>}
        footer={<LabFooter />}
      >
        <LabPanel />
      </Lab>

      <Step id="exit" length={STEP_LEN.exit} align="center" valign="lower" exit="hold">
        <Beat status={['derived', 'analogy']}>Step back far enough, and every state of the string looks like a point with a mass and a spin.</Beat>
      </Step>
    </>
  )
}
