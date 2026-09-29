import { Beat, Caption, ChapterTitle, Deeper, Eq, Lab, Step, Term } from '@/ui'
import { AssumptionsSection, BraneDeeper, BranesSection, MoreCue, ReadoutsSection, StringsSection, ViewSection } from './LabPanel'
import { LEN } from './steps'
import './styles.css'

/*
 * Chapter 07 · Branes — narrative beats (content/07-branes.md, refereed copy), the Brane Bench lab,
 * and the Go-deeper drawer. Step ids and lengths are shared with the Scene through steps.ts.
 */
export default function Overlay() {
  return (
    <>
      <ChapterTitle status="derived" length={LEN.title} sub="Follow the ends of an open string and you find new objects: D-branes.">
        Where do <br className="brn-br" />
        open strings <br className="brn-br" />
        <em>end</em>?
      </ChapterTitle>

      <Step id="open" length={LEN.open} align="left">
        <Beat status="derived">
          Chapter 3 met two kinds of string. Closed loops have no ends. Open strings have two, and so far those ends wandered anywhere. String theory’s equations also allow
          ends that are held, and what holds them turns out to be objects in their own right.
        </Beat>
      </Step>

      <Step id="rule" length={LEN.rule} align="left">
        <Beat status={['derived', 'analogy']}>
          A string’s equations need a rule at each end. Along some directions an end slides freely; along others it stays pinned. The places where pinned ends can sit form a
          surface: a <Term id="d-brane">D-brane</Term>, “D” for <Term id="dirichlet-boundary-condition">Dirichlet</Term>, the name of the pinning rule.
        </Beat>
        <Caption>≈ drawn as a 2D sheet in 3D · 1 unit = ℓ_s = √α′ · not to scale</Caption>
        <Deeper>
          Neumann: ∂<sub>σ</sub>X = 0 at the end (it slides). Dirichlet: X = const at the end (it is pinned). A Dp-brane is where p space directions are Neumann and the rest
          Dirichlet; p runs from 0 to 9.
        </Deeper>
      </Step>

      <Step id="thing" length={LEN.thing} align="left">
        <Beat status={['derived', 'analogy']}>
          A pinned end can push and pull, so the brane must be able to recoil. It is an object: it has mass, moves and ripples, and its ripples are open strings. In 1995
          Polchinski showed D-branes also carry <Term id="ramond-ramond-charge">Ramond–Ramond charge</Term>, exactly what string <Term id="duality">duality</Term>{' '}
          required.
        </Beat>
        <Caption>≈ recoil exaggerated · RR “field lines” are a cartoon</Caption>
        <Deeper>
          D-brane tension is τ<sub>p</sub> = 1 / (g<sub>s</sub> (2π)<sup>p</sup> α′<sup>(p+1)/2</sup>), so at weak string coupling g<sub>s</sub> branes are very heavy.
        </Deeper>
      </Step>

      <Step id="onoff" length={LEN.onoff} align="left">
        <Beat status={['derived', 'analogy']}>
          Open strings with both ends on a brane slide along it; while open, they cannot leave. Their lightest vibration acts like a photon confined to the brane. Closed strings
          have no ends to hold. Among them is the graviton, free to roam the whole <Term id="bulk">bulk</Term>.
        </Beat>
        <Caption>≈ a 2D brane in a 3D bulk · the on-brane view is a geometric slice</Caption>
      </Step>

      <Step id="mass" length={LEN.mass} align="left">
        <Beat status="derived">
          Each brane carries its own photon-like field, with a <Term id="gauge-symmetry">gauge symmetry</Term> called U(1). Add a second brane, and an open string can run
          between them. Its tension is fixed, so its energy is tension × length. At rest, energy is mass: farther apart, heavier string.
        </Beat>
        <Caption>m = T · d = d / 2π · in string units (M_s, ℓ_s)</Caption>
        <Deeper>
          <Eq tex={String.raw`m = T\,d = \frac{d}{2\pi\alpha'}`} label="m equals T times d equals d over 2 pi alpha prime" /> The line is straight: a rubber band’s energy
          would grow as d², a string’s grows as d.
        </Deeper>
      </Step>

      <Step id="touch" length={LEN.touch} align="left">
        <Beat status={['derived', 'observed']}>
          Now push the branes together. The stretched strings shrink to zero length and turn massless: two separate photon-like fields become four linked ones, the larger
          symmetry U(2). Pull them apart and the extra carriers gain mass. That is the <Term id="higgs-mechanism">Higgs mechanism</Term>, drawn as geometry.
        </Beat>
        <Caption>◑ the brane picture: derived, untested · ● the Higgs mechanism itself: W and Z masses, Higgs boson (2012)</Caption>
        <Deeper>
          Strings are oriented, and each end carries a <Term id="chan-paton-label">Chan–Paton label</Term>: N coincident branes give N² kinds of open string, the size of U(N).
          Brane positions are the eigenvalues of a matrix field Φ (Witten, 1996).
        </Deeper>
      </Step>

      <Step id="world" length={LEN.world} align="left">
        <Beat status={['speculative', 'observed']}>
          Chapter 5’s gravity-only scenario now gets a mechanism, a speculative <Term id="braneworld">braneworld</Term>: everything we’re made of could be open strings on a
          3D brane, while gravity, carried by closed strings, spreads into the bulk. Diluted there, it would seem weak. The LHC sees no escaping gravitons.
        </Beat>
        <Caption>○ the scenario · ● the null results · string theory doesn’t require that we live on a brane</Caption>
        <Deeper>
          Braneworlds re-express the weakness of gravity rather than explain it: why is the bulk so large, or the warping so strong? The simplest TeV-gravity versions are
          excluded by torsion balances, the LHC and astrophysics.
        </Deeper>
      </Step>

      <Lab
        title="Brane Bench"
        status={['derived', 'analogy']}
        length={LEN.lab}
        hint="Drag brane → brane to stretch a string · drag ◇ to move a brane"
        intro={<p>Pin the ends, move the branes. Watch distance turn into mass.</p>}
        footer={<BraneDeeper />}
      >
        <ViewSection />
        <BranesSection />
        <ReadoutsSection />
        <StringsSection />
        <AssumptionsSection />
        <MoreCue />
      </Lab>

      <Step id="exit" length={LEN.exit} align="center" valign="bottom">
        <p className="sr-only">D-branes were found through T-duality, which swaps “slides” and “pinned” ends. That duality is the next chapter.</p>
      </Step>
    </>
  )
}
