import { useEffect } from 'react'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { Beat, Caption, ChapterTitle, Deeper, Lab, Step, Term } from '@/ui'
import { Pinned } from './Pinned'
import { ROUTES } from './routes'
import { LabDeeper, LabPanel } from './LabPanel'
import { STEP_LEN } from './timeline'
import './styles.css'

/**
 * While this chapter's Lab is docked, <html> carries .sp-lab-on (styles.css: the chapter rail steps aside).
 * A class toggled twice per visit, instead of a body:has() rule that re-matched on every scroll frame.
 */
function useLabClass() {
  const h = useChapter()
  useEffect(() => {
    const root = document.documentElement
    let on = false
    const run = () => {
      const v = h.inStep('lab')
      if (v === on) return
      on = v
      root.classList.toggle('sp-lab-on', v)
    }
    run()
    const off = onJourney(run)
    return () => {
      off()
      root.classList.remove('sp-lab-on')
    }
  }, [h])
}

export default function Overlay() {
  useLabClass()
  return (
    <>
      <ChapterTitle status="observed" sub="No experiment has ever detected one." valign="top" length={STEP_LEN.title}>
        Why haven’t we <em>seen</em> a string?
      </ChapterTitle>

      <Step id="open" length={STEP_LEN.open} valign="top">
        <Pinned step="open" len={STEP_LEN.open}>
          <Beat status="observed" kicker="Out of reach">
            So far we have built a picture: vibrating strings, hidden dimensions, branes, dualities. None of it has been seen directly. So ask the plain question: if
            strings exist, why has no one ever seen one?
          </Beat>
        </Pinned>
      </Step>

      <Step id="decades" length={STEP_LEN.decades} valign="top">
        <Pinned step="decades" len={STEP_LEN.decades}>
          <Beat status={['observed', 'analogy']} kicker="Sixty-two powers of ten">
            From the Planck length to the width of the observable universe: about 62 powers of ten. On a <Term id="logarithmic-scale">logarithmic scale</Term>, each
            factor of ten gets equal room. You are not in the middle. The middle is a tenth of a millimeter, the thickness of paper.
          </Beat>
          <Caption>Sizes measured · glyphs are drawings</Caption>
          <Deeper>Upward, the SI prefixes reach 10³⁰ (quetta): enough for the universe. Downward they stop at 10⁻³⁰ (quecto), short of the Planck length.</Deeper>
        </Pinned>
      </Step>

      <Step id="quarter" length={STEP_LEN.quarter} valign="top">
        <Pinned step="quarter" len={STEP_LEN.quarter}>
          <Beat status={['observed', 'analogy']} kicker="The unexplored quarter">
            Measurements reach every scale from the universe’s width down to about 10⁻¹⁹ m. The last sixteen powers of ten, a quarter of the ruler, remain unexplored.
            Enlarge an atom to the size of the observable universe: the Planck length becomes a tall tree.
          </Beat>
        </Pinned>
      </Step>

      <Step id="energy" length={STEP_LEN.energy} valign="top">
        <Pinned step="energy" len={STEP_LEN.energy}>
          <Beat status="observed" kicker="Smaller means harder">
            Recall Chapter 1: seeing smaller takes more energy, roughly ħc divided by the distance. Ten times smaller, ten times the energy. The LHC reached 13.6 TeV (trillion{' '}
            <Term id="electronvolt">electronvolts</Term>), resolving about 10⁻¹⁹ m. The Planck length needs about 10¹⁹ GeV: a million billion times more.
          </Beat>
          <Deeper>Why ħc/d: a probe must fit its wavelength inside the detail. The prefactor is a convention (h instead of ħ changes it by 2π); only the order of magnitude matters.</Deeper>
        </Pinned>
      </Step>

      <Step id="bigger" length={STEP_LEN.bigger} valign="top">
        <Pinned step="bigger" len={STEP_LEN.bigger}>
          <Beat status={['observed', 'analogy']} kicker="Build it bigger?">
            Could we just build bigger? A ring’s size grows in step with its energy. With the LHC’s magnets, a Planck-energy ring would be about 2,500 light-years
            around. Light would need 2,500 years for one lap. The smallest target demands the largest machine.
          </Beat>
          <Caption>Arithmetic from established accelerator physics · no such machine exists or is planned · assumes LHC magnets, all energy in one collision</Caption>
        </Pinned>
      </Step>

      <Step id="floor" length={STEP_LEN.floor} valign="top">
        <Pinned step="floor" len={STEP_LEN.floor}>
          <Beat status={['conjectured', 'observed']} kicker="A floor, not just a distance">
            Size is not the only problem. Protons that energetic, steered by magnets, would{' '}
            <Term id="synchrotron-radiation">radiate their energy away</Term> long before one lap. And beyond the Planck energy, a collision is expected to form a tiny{' '}
            <Term id="black-hole">black hole</Term>, hiding the very detail it should reveal.
          </Beat>
          <Caption>Radiation loss: observed physics · black-hole floor: a heuristic, not a theorem. Widely expected; untested</Caption>
        </Pinned>
      </Step>

      <Step id="sideways" length={STEP_LEN.sideways} valign="top">
        <Pinned step="sideways" len={STEP_LEN.sideways}>
          <Beat status="speculative" kicker="Where strings might be">
            The <Term id="string-scale">string scale</Term> is unknown. Traditional estimates put strings somewhat longer than the Planck length. Speculative models
            allow strings big enough for the LHC to see; none has appeared. So physicists <Term id="indirect-test">look sideways</Term>: signs in the early universe and
            short-range gravity, plus theoretical checks.
          </Beat>
          <Deeper>
            Named routes: <Term id="cosmic-superstring">cosmic superstrings</Term> (none found), <Term id="swampland">swampland</Term> rules (conjectures),
            no <Term id="supersymmetry">superpartners</Term> yet.
          </Deeper>
          <ul className="sr-only">
            {ROUTES.map((r) => (
              <li key={r.title}>
                {r.title} ({r.status.join(', ')}){r.check ? ', a theory check, not a measurement' : ''}: {r.text}
              </li>
            ))}
          </ul>
        </Pinned>
      </Step>

      <Lab
        title="How big a machine?"
        status={['observed', 'analogy']}
        length={STEP_LEN.lab}
        intro={<p>Seeing a distance d takes energy of about ħc/d. Ten times smaller, ten times more.</p>}
        footer={
          <>
            <LabDeeper />
            <span className="t-label sp-lab__foot">Sizes to scale · ring drawn as a circle</span>
          </>
        }
      >
        <LabPanel />
      </Lab>

      <Step id="point" length={STEP_LEN.point} align="center" valign="lower" className="sp-closing">
        <Pinned step="point" len={STEP_LEN.point} fadeLead>
          <Beat status={['derived', 'analogy']} size="display">
            <em>From where we stand, a string would look just like a point.</em>
          </Beat>
          <p className="sp-bridge">Then what, exactly, do we know, and what are we still guessing?</p>
        </Pinned>
      </Step>
    </>
  )
}
