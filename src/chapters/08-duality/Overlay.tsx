import { Beat, Caption, ChapterTitle, Deeper, Eq, GoDeeper, Lab, Status, Step, Term } from '@/ui'
import { Dictionary } from './Dictionary'
import { DeepFormula, LabBody } from './LabPanel'
import { stepLen } from './model'
import './styles.css'

/*
 * Chapter 08 · Duality — copy from content/08-duality.md (refereed). Beat order and lengths
 * come from model.ts STEPS, which the Scene reads as one continuous timeline.
 */

export default function Overlay() {
  return (
    <>
      <ChapterTitle
        status="derived"
        valign="bottom"
        sub="A string can move around a circle, or wrap around it. That choice hides a symmetry."
        length={stepLen('title')}
      >
        Can two different worlds be <em>the same</em>?
      </ChapterTitle>

      <Step id="opening" length={stepLen('opening')}>
        <Beat status="derived">
          Two descriptions of a world can look nothing alike, and still predict exactly the same result for every possible experiment. Physicists call
          such a pair a <Term id="duality">duality</Term>. String theory is full of them.
        </Beat>
      </Step>

      <Step id="drums" length={stepLen('drums')}>
        <Beat status={['analogy', 'observed']}>
          In 1966 Mark Kac asked: can one hear the shape of a drum? In 1992 three mathematicians answered no. Two differently shaped drums can ring with
          exactly the same set of tones: the same <Term id="spectrum">spectrum</Term>. For a string, the “tones” are particle masses.
        </Beat>
        <Caption>
          ~ Drums share only their tones. Dual string worlds share every measurable quantity.
          <br />● <Term id="isospectral">Isospectral</Term> drums: proved 1992 · measured in microwave cavities 1994
        </Caption>
      </Step>

      <Step id="momentum" length={stepLen('momentum')}>
        <Beat status={['derived', 'analogy']}>
          Curl one direction into a circle of radius R, as in Chapter 5. A closed string can travel around it, but its quantum wave must fit: n whole
          wavelengths. This <Term id="momentum-mode">momentum mode</Term> costs energy proportional to n/R: cheap when the circle is big.
        </Beat>
        <Caption>~ The surface is the space; “around” is one hidden direction. Not to scale.</Caption>
        <Deeper>
          <p className="du-deeper">
            A wavefunction e<sup>ipX</sup> must return to itself when X → X + 2πR, so p = n/R with n a whole number.
          </p>
        </Deeper>
      </Step>

      <Step id="winding" length={stepLen('winding')}>
        <Beat status={['derived', 'analogy']}>
          Only a string can also wrap around the circle, like a rubber band on a pole. Its <Term id="winding-number">winding number</Term> w counts the
          wraps. Stretching costs energy, tension times length, so winding energy grows with R: cheap on small circles. A point particle cannot wind.
        </Beat>
        <Caption>~ A real string has no thickness, and no pole is inside.</Caption>
        <Deeper>
          <p className="du-deeper">
            Wrapped w times, the string has length 2πwR. At tension T = 1/(2πα′) that costs 2πwR · T = wR/α′.
          </p>
        </Deeper>
      </Step>

      <Step id="aha" length={stepLen('aha')}>
        <Beat status={['derived', 'analogy']}>
          Compare two worlds: one with circle R, one with circle α′/R (<Term id="alpha-prime">α′</Term>, string theory’s one scale). Each momentum rung in
          one sits exactly on a winding rung in the other. Every mass matches; so does every interaction. Two descriptions, one physics:{' '}
          <Term id="t-duality">T-duality</Term>.
        </Beat>
        <Caption>◑ Holds at every order of string perturbation theory; believed exact · ~ circles drawn ∝ √R</Caption>
        <Deeper>
          <p className="du-deeper">
            Interactions match because the coupling shifts too, g<sub>s</sub> → g<sub>s</sub>√α′/R, and the worldsheet theories at R and α′/R are
            equivalent.
          </p>
        </Deeper>
      </Step>

      <Step id="landing" length={stepLen('landing')} className="du-landing-step">
        <Beat status="derived" size="display">
          <span className="du-landing">
            <span>Two pictures.</span> <em>One spectrum.</em>
          </span>
        </Beat>
        <p className="du-landing__swap t-mono" aria-label="R becomes alpha-prime over R; n becomes w">
          <span>R</span> ⟷ <span>α′/R</span> <span className="du-dim">·</span> <span className="du-c-mom">n</span> ⟷{' '}
          <span className="du-c-wind">w</span>
        </p>
        <Caption>~ Circles drawn ∝ √R, not to scale. Rung heights follow the mass formula.</Caption>
      </Step>

      <Step id="selfdual" length={stepLen('selfdual')}>
        <Beat status="derived">
          Shrink the circle below √α′, the string length, and nothing new appears. Past this <Term id="self-dual-radius">self-dual radius</Term>, the
          physics retraces that of ever-larger circles, with momentum and winding trading roles. For strings, a circle smaller than the string length is
          a larger circle, described differently.
        </Beat>
        <Caption>
          ◑ With strings as probes. D-branes can resolve shorter distances.
          <br />~ Plot schematic · families grouped · |n|, |w| ≤ 6 shown
        </Caption>
        <div className="du-inline-deeper">
          <GoDeeper id="minlength" title="Is there a smallest length?" label="Smallest length?">
            <p>
              T-duality makes a narrow claim: a <em>circle</em> smaller than √α′ is equivalent to a larger one, <em>for strings used as probes</em>. It
              says nothing about directions that are not curled up.
            </p>
            <p>
              Tong’s lectures call a minimum length “roughly true in string theory, although not in any crude simple manner”, and add that “D-branes are
              much better probes of sub-stringy physics.” Douglas, Kabat, Pouliot and Shenker (1996) showed that D0-branes can probe distances down to
              about g<sub>s</sub>
              <sup>1/3</sup> ℓ<sub>s</sub>, the eleven-dimensional Planck length.
            </p>
            <p className="du-fine">Status: ◑ derived within string theory. None of it has been tested in nature.</p>
          </GoDeeper>
        </div>
      </Step>

      <Step id="web" length={stepLen('web')} align="wide" className="du-web-step">
        <div className="du-web">
          <div className="du-web__beat">
            <Beat status={['derived', 'conjectured']}>
              T-duality is the simplest of many. It even turns one superstring theory (IIA) into another (IIB). S-duality swaps strong and weak{' '}
              <Term id="string-coupling">string coupling</Term>.{' '}
              <Term id="mirror-symmetry">Mirror symmetry</Term> pairs different Calabi–Yau shapes. <Term id="gauge-gravity-duality">Gauge/gravity duality</Term>{' '}
              equates a theory with gravity to one without it. Several remain conjectures, strongly supported.
            </Beat>
            <Caption>~ A dictionary, not a map of where things are.</Caption>
          </div>
          <Dictionary />
        </div>
      </Step>

      <Lab
        title="The Circle Swap"
        status={['derived', 'analogy']}
        hint="Drag R through √α′ · tap a bar pair · jump worlds"
        length={stepLen('lab')}
        intro={<p>Set the circle’s size. Compare the sixteen lightest string states in both worlds.</p>}
        footer={
          <>
            <GoDeeper title="The mass formula, and the swap">
              <LabDeeper />
            </GoDeeper>
            <span className="du-lab__fine t-mono">~ circles ∝ √R · ℓs size unknown</span>
          </>
        }
      >
        <LabBody />
      </Lab>

      <Step id="outro" length={stepLen('outro')} fade={false}>
        <span className="sr-only">The two worlds meet at the self-dual radius and merge. The wound string slips free as a single closed loop.</span>
      </Step>
    </>
  )
}

function LabDeeper() {
  return (
    <>
      <h3>The mass formula</h3>
      <p>Curl one direction into a circle of radius R. With ħ = c = 1, a closed superstring then has</p>
      <DeepFormula />
      <ul>
        <li>
          <strong className="du-c-mom">Momentum (blue):</strong> n whole wavelengths fit around the circle, so the momentum is n/R.
        </li>
        <li>
          <strong className="du-c-wind">Winding (amber):</strong> a string wrapped w times has length 2πwR and tension T = 1/(2πα′), so it costs wR/α′.
        </li>
        <li>
          <strong className="du-c-vib">Vibration (grey):</strong> N and Ñ count the ripples running each way around the loop (Chapter 2).
        </li>
        <li>
          <strong>Level matching (Chapter 4)</strong> gains a twist: the imbalance N − Ñ must equal nw. A string that both moves and wraps must also
          vibrate. For the lightest state of each (n, w), M = |n|/R + |w|R/α′.
        </li>
      </ul>
      <h3>The swap</h3>
      <Eq display tex="R \;\to\; \frac{\alpha'}{R}, \qquad n \leftrightarrow w, \qquad g_s \;\to\; g_s\,\frac{\sqrt{\alpha'}}{R}" label="R goes to alpha-prime over R, n and w swap, and the coupling g-s goes to g-s times root alpha-prime over R" />
      <p>
        The first two terms trade places and the third doesn’t care. Momentum and winding are each conserved, and each is the charge of its own
        photon-like field; the swap exchanges those fields too. The coupling shift keeps interactions identical. Because the string’s worldsheet
        theories at R and α′/R are equivalent, the match holds at every order of string perturbation theory.
      </p>
      <p>
        For superstrings the dual world is the partner theory: type IIA on radius R equals type IIB on α′/R. The bosonic string’s formula carries
        (N + Ñ − 2); it swaps the same way. Applied to open strings, T-duality turns free ends into ends fixed on a surface, which is how D-branes were
        found in 1989.
      </p>
      <h3>Other dualities</h3>
      <p>
        S-duality <Status kind="conjectured" compact /> maps coupling g to 1/g. Mirror symmetry pairs different Calabi–Yau shapes; it predicted 317,206,375
        twisted cubic curves on the quintic, a count later proved. Gauge/gravity duality (Maldacena 1997) <Status kind="conjectured" compact /> equates
        string theory in anti-de Sitter space, gravity included, with a gauge theory on its boundary.
      </p>
      <h3>What the lab simplifies</h3>
      <ul className="du-fine-list">
        <li>Only one circle is compact; the other 8 space directions are flat and large.</li>
        <li>No B-field or Wilson line on the circle.</li>
        <li>Each bar is a family: signs of n and w, spins and fermions are grouped.</li>
        <li>Tree-level masses only, except BPS states (N = 0 or Ñ = 0), which are exact at any coupling.</li>
        <li>The coupling shift needed for interactions to match is not visualized.</li>
        <li>Circles are drawn ∝ √R. The string length in meters is unknown and never shown.</li>
        <li>For type II, World B is strictly the partner theory (IIA ↔ IIB). Masses are unaffected.</li>
      </ul>
      <p className="du-fine">
        Sources: D. Tong, <em>Lectures on String Theory</em> (arXiv:0908.0333) §8; J. H. Schwarz, hep-th/9607201 §2.5; Polchinski vol. 1 ch. 8.
      </p>
    </>
  )
}
