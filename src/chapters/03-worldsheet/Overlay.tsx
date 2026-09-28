import { useEffect, useLayoutEffect, useState } from 'react'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { Caption, ChapterTitle, Deeper, Eq, GoDeeper, Segmented, Status, Step, Term } from '@/ui'
import { WsBeat } from './Beat'
import { DeeperContent } from './DeeperContent'
import { LabPanel } from './LabPanel'
import { areaPhase, STEP_LEN, textTop, type StepId } from './layout'
import { useWorldsheet } from './store'
import './styles.css'

/** Phones: side-by-side histories are shown one at a time. */
function MobileToggle() {
  const v = useWorldsheet((s) => s.mobileView)
  const set = useWorldsheet((s) => s.setMobileView)
  return (
    <div className="ws-mtoggle">
      <Segmented
        label="Show"
        value={v}
        options={[
          { value: 'particles', label: 'Particles' },
          { value: 'strings', label: 'Strings' },
        ]}
        onChange={set}
      />
    </div>
  )
}

/** Beat 2's card: S = −T·A, with T and A lit in step with the ribbon (same phase function as the Scene). */
function ActionCard() {
  const h = useChapter()
  const [hl, setHl] = useState({ T: 0, A: 0 })
  useEffect(
    () =>
      onJourney(() => {
        const p = areaPhase(h.step('area'))
        setHl((o) => (Math.abs(o.T - p.T) > 0.04 || Math.abs(o.A - p.A) > 0.04 ? { T: p.T, A: p.A } : o))
      }),
    [h],
  )
  return (
    <div className="ws-eqcard">
      <Eq display tex={String.raw`S = -\,\htmlClass{term-T}{T}\cdot \htmlClass{term-A}{A}`} highlight={hl} label="S equals minus T times A: tension times worldsheet area" />
      <p className="ws-eqcard__key t-label">
        <span className={hl.T > 0.5 ? 'is-on' : undefined}>T · tension</span>
        <span className={hl.A > 0.5 ? 'is-on' : undefined}>A · worldsheet area</span>
      </p>
    </div>
  )
}

/**
 * Phones: record where each step's text block starts (fraction of the viewport height), so the Scene can
 * frame the diagram in the free band above it. Measured on resize only, never per frame.
 */
function useTextTops() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-chapter="worldsheet"]')
    if (!root || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      for (const el of root.querySelectorAll<HTMLElement>('.step[data-step]')) {
        const inner = el.querySelector<HTMLElement>('.step__inner')
        const target = el.querySelector<HTMLElement>('.lab') ?? el.querySelector<HTMLElement>('.step__content')
        if (!inner || !target || !inner.clientHeight) continue
        const ri = inner.getBoundingClientRect()
        const rt = target.getBoundingClientRect()
        textTop[el.dataset.step as StepId] = rt.height > 2 ? (rt.top - ri.top) / ri.height : 1
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    root.querySelectorAll('.step__content, .lab').forEach((e) => ro.observe(e))
    return () => ro.disconnect()
  }, [])
}

export default function Overlay() {
  useTextTops()
  return (
    <>
      <ChapterTitle
        status={['derived', 'analogy']}
        length={STEP_LEN.title}
        sub="In string theory, a string’s history through time is a surface: a ribbon for an open string, a tube for a closed one."
      >
        What does a string do as it moves <em>through time</em>?
      </ChapterTitle>

      <Step id="open" length={STEP_LEN.open} align="left">
        <WsBeat kicker="Stack the moments" status={['observed', 'analogy']} note="Worldlines are standard relativity. One space dimension is hidden so that time can be drawn upward.">
          Draw time pointing up and hide one direction of space. A point particle moving through time then traces a line, its{' '}
          <Term id="worldline">worldline</Term>. No worldline can lean past 45°, the tilt of light. So what does a string trace?
        </WsBeat>
        <Caption>Time runs upward · one space dimension hidden · 1 unit = 1 ℓ, not to scale</Caption>
        <p className="ws-scale">
          <Status kind="speculative" compact /> Scale ≈ ℓs, the string length, which is unknown; ~10⁻³⁴ m if traditional estimates hold.
        </p>
      </Step>

      <Step id="sheet" length={STEP_LEN.sheet} align="left">
        <WsBeat kicker="A line sweeps a surface" status={['derived', 'analogy']} note="The spinning ribbon is an exact solution of the string’s equations. The loop’s gentle wobble is a cartoon.">
          A string is a tiny line, so its history is a surface: its <Term id="worldsheet">worldsheet</Term>. An <Term id="open-string">open string</Term>, with
          two free ends, sweeps a ribbon; here it spins, and its ends move at exactly light speed. A closed loop has no ends. It sweeps a tube.
        </WsBeat>
        <Caption>Warm: the string now · blue: its history</Caption>
        <Deeper>
          <p>
            The ribbon is the rigidly rotating open string, an exact solution: <Eq tex={String.raw`\vec x(\sigma,t)=\tfrac{L}{\pi}\cos\tfrac{\pi\sigma}{L}\,\big(\cos\tfrac{\pi ct}{L},\ \sin\tfrac{\pi ct}{L}\big)`} />. Its
            ends circle at exactly c, which is why its edges lean at 45° everywhere.
          </p>
        </Deeper>
      </Step>

      <Step id="area" length={STEP_LEN.area} align="left">
        <WsBeat
          kicker="Nature’s rule: area"
          status={['derived']}
          note="The particle rule is tested relativity. The area rule is string theory’s starting assumption; everything else in this chapter follows from it."
        >
          What picks the real history? For a free particle, the action tracks <Term id="proper-time">proper time</Term>, and the straight worldline, which has the
          most, wins. String theory’s founding rule, the <Term id="nambu-goto-action">Nambu–Goto action</Term>, trades length for area: S = −T·A, tension times
          worldsheet area.
        </WsBeat>
        <ActionCard />
        <div className="ws-deeper-row">
          <GoDeeper id="action" title="Why area, and where do interactions come from?">
            <DeeperContent />
          </GoDeeper>
        </div>
      </Step>

      <Step id="pants" length={STEP_LEN.pants} align="left">
        <WsBeat
          kicker="The pants have no corner"
          status={['derived', 'analogy']}
          note="Smooth, with no special point: true of the surfaces string calculations use. The exact shape drawn is a cartoon, since the theory sums over all such shapes."
        >
          Strings interact by splitting and joining. One loop becomes two, and the history is a <Term id="pair-of-pants">pair of pants</Term>. Particle worldlines
          meet at a sharp point, a <Term id="vertex">vertex</Term>. Zoom into the pants: no corner, no seam. Every patch looks like a string simply moving.
        </WsBeat>
        <Caption>Loupes zoom ×1 → ×1000 · the Y keeps its corner</Caption>
        <Deeper>
          <p>
            Near the crotch the drawn surface is <Eq tex={String.raw`ct \approx 5.327 + 1.522\,x^2 - 0.482\,y^2`} />: a saddle with a level tangent plane.
            The gradient of Φ never vanishes there, so the surface is perfectly smooth.
          </p>
        </Deeper>
        <MobileToggle />
      </Step>

      <Step id="now" length={STEP_LEN.now} align="left">
        <WsBeat
          kicker="No single moment of splitting"
          status={['analogy', 'derived']}
          note="Drawn with time treated like space, as in string calculations. There, tilting the slicing moves the pinch exactly. For real observers it is a heuristic (see Go deeper)."
        >
          So where did it split? Slice the pants with a flat “now”: one loop, then two. Tilt the slice, as motion tilts <Term id="simultaneity">simultaneity</Term>,
          and the pinch slides elsewhere. No point on the surface is special, so no single event is “the” split.
        </WsBeat>
        {/* phones: Go deeper and the PARTICLES | STRINGS toggle share one row, so the diagram keeps its room */}
        <div className="ws-actions">
          <div className="ws-deeper-row">
            <GoDeeper id="observers" title="Do moving observers really disagree about where it split?">
              <DeeperContent observersFirst />
            </GoDeeper>
          </div>
          <MobileToggle />
        </div>
      </Step>

      <LabPanel />

      <Step id="loops" length={STEP_LEN.loops} align="left">
        <WsBeat
          kicker="Why it matters"
          status={['derived', 'analogy']}
          note="Superstring amplitudes have no ultraviolet infinities at one and two loops, by explicit calculation. To all orders, string field theory gives a general argument its authors consider settled; it is not a mathematical theorem, and some standard notes call it unproven. Each order is finite, but the full series doesn’t converge. At low energies, ordinary quantum gravity works fine. The squeeze animation is a cartoon."
        >
          Particle calculations blow up where interaction points crowd together. For gravity, these <Term id="uv-divergence">UV divergences</Term> can’t be tamed at
          high energies. String loops can’t be squeezed to a point. Explicit <Term id="superstring">superstring</Term> calculations through two loops have no
          such infinities; arguments extend this to every order.
        </WsBeat>
        <Caption>Squeeze is schematic · the string hole stops at ≈ 1.2 ℓ</Caption>
        <Deeper>
          <p>
            Explicit: one loop (Tong §6.4) and two loops (D’Hoker &amp; Phong, 2002–05). All orders: string field theory argues it (Sen &amp; Zwiebach, 2024), but
            it is not a theorem. The series itself does not converge, and long-distance (IR) divergences remain, as in field theory.
          </p>
        </Deeper>
        <MobileToggle />
      </Step>

      <Step id="close" length={STEP_LEN.close} align="left">
        <WsBeat
          kicker="Open strings can close"
          status={['derived', 'analogy']}
          note="Open implies closed, but not always the reverse: heterotic theories seem to have no open strings. The joining shape drawn is a cartoon."
        >
          Open strings can also close. If an open string’s two ends meet, they can fuse into a loop. So any theory with open strings also contains{' '}
          <Term id="closed-string">closed strings</Term>. That matters: one vibration of a closed loop behaves like the <Term id="graviton">graviton</Term>.
        </WsBeat>
      </Step>

      {/* the handoff: the OUT crane lands on H2 and the loop is left alone, with no text over it */}
      <Step id="out" length={STEP_LEN.out} align="center">
        <p className="sr-only">One closed loop remains: the object the next chapter follows.</p>
      </Step>
    </>
  )
}
