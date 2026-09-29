import { Beat, Caption, ChapterTitle, Deeper, Step, Term } from '@/ui'
import { LEN } from './director'
import { LabPanel } from './LabPanel'
import './styles.css'

export default function Overlay() {
  return (
    <>
      <ChapterTitle length={LEN.title} valign="bottom" status="conjectured" sub="Five versions of string theory, drawn as islands on one map.">
        Five theories, <em>or one?</em>
      </ChapterTitle>

      <Step id="opening" length={LEN.opening}>
        <Beat status="derived" kicker="1985">
          Chapter 08 found two pictures of one physics. Hold on to that. By 1985, string theory, hoped to be unique, came in five consistent versions, each in ten dimensions, each built differently. An embarrassment.
          Five theories, or one?
        </Beat>
      </Step>

      <Step id="islands" length={LEN.islands}>
        <Beat status={['derived', 'analogy']} kicker="Five islands">
          Ask for supersymmetric strings in ten flat dimensions and only five consistent theories are known: Type I, IIA, IIB, and two <Term id="heterotic-string">heterotic strings</Term>. They differ in whether strings can be
          open, how waves running each way around a loop compare, and which symmetries come along.
        </Beat>
        <Deeper>
          <p>
            Anomaly cancellation (Green &amp; Schwarz, 1984) selects the symmetry groups SO(32) or E8×E8, both with 496 force carriers. “Five” counts supersymmetric theories in flat ten dimensions; non-supersymmetric strings exist too.
          </p>
        </Deeper>
      </Step>

      <Step id="shallow" length={LEN.shallow}>
        <Beat status={['derived', 'analogy']} kicker="Shallow water">
          Each island marks where its theory is easy to use. There the <Term id="string-coupling">string coupling</Term> g is small: strings rarely split or join, so approximate sums of simple worldsheets work. Offshore, g grows,
          the approximation fails, and the map goes blank.
        </Beat>
        <Deeper>
          <p>A closed-string worldsheet with h handles is weighted by g^(2h−2), so each extra handle costs a relative g². At g ≈ 1 no term in the sum can be dropped.</p>
        </Deeper>
      </Step>

      <Step id="bridges" length={LEN.bridges}>
        <Beat status={['conjectured', 'derived', 'analogy']} kicker="Bridges">
          Some masses are <Term id="bps-state">pinned exactly</Term> by supersymmetry, at any coupling. Follow them offshore and bridges appear. Strongly coupled Type I matches weakly coupled heterotic SO(32) in every test made:{' '}
          <Term id="s-duality">S-duality</Term>. IIB maps onto itself. T-duality, Chapter 08’s circle swap, joins IIA–IIB and heterotic–heterotic.
        </Beat>
        <Caption>Solid causeway = derived · dashed arch = conjectured</Caption>
      </Step>

      <Step id="aha" length={LEN.aha}>
        <Beat status={['conjectured', 'analogy']} kicker="Strong coupling">
          Turn up Type IIA’s coupling. A ladder of <Term id="d-particle">new particles</Term> descends, evenly spaced: Chapter 05’s signature of a hidden circle. The coupling was a size. An eleventh dimension opens, and the string
          turns out to be a <Term id="membrane">membrane</Term> wrapped around it.
        </Beat>
        <Caption>R₁₁ = g ℓ_s · ℓ₁₁ = g^⅓ ℓ_s · not to scale</Caption>
      </Step>

      <Step id="landmass" length={LEN.landmass}>
        <Beat status={['conjectured', 'analogy']} kicker="One landmass">
          Strongly coupled heterotic E8×E8 grows one too: a gap between two walls. Now pull back. Five islands and <Term id="eleven-dimensional-supergravity">eleven-dimensional supergravity</Term> become six tips of{' '}
          <Term id="moduli-space">one landmass</Term>. Witten’s 1995 proposal: one theory, six limits. It was named <Term id="m-theory">M-theory</Term>.
        </Beat>
        <Deeper>
          <p>
            Witten (March 1995) described “a web of connections between the five string theories and eleven-dimensional supergravity”. He called Type I ↔ heterotic SO(32) “a curious speculation”. The E8×E8 walls came from
            Hořava and Witten that October.
          </p>
        </Deeper>
      </Step>

      <Step id="interior" length={LEN.interior}>
        <Beat status="conjectured" kicker="The unmapped interior">
          What is M-theory, exactly? Its full formulation is unknown. We know its limits and some exact features. “M” was left open: magic, mystery, membrane. <Term id="matrix-theory">Matrix theory</Term> (1996) proposes a
          definition, only in special settings. No experiment has tested any of it.
        </Beat>
        <Deeper>
          <p>Hořava and Witten (1995): “we will non-committally call it the M-theory, leaving to the future the relation of M to membranes.”</p>
        </Deeper>
      </Step>

      <LabPanel />

      <Step id="dive" length={LEN.dive} />
      <Step id="exit" length={LEN.exit} align="center" valign="lower">
        <Beat status="conjectured">The weak-coupling string we started with is back. It may be one face of something larger.</Beat>
      </Step>
    </>
  )
}
