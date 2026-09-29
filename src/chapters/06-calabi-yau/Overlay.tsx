import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import {
  Beat,
  Button,
  Caption,
  ChapterTitle,
  Deeper,
  Eq,
  GoDeeper,
  Lab,
  Segmented,
  Slider,
  Status,
  Step,
  Term,
  Toggle,
  type StatusKind,
} from '@/ui'
import { DEGREES, TOPO, type Degree } from './cyMath'
import { Dials, Ledger, Rosette, Timeline, WaveLadder } from './figures'
import { cyPan, useCY } from './store'
import { LEN, packP } from './timeline'
import './styles.css'

/* An inline status mark on a word, explained by a footnote line under the beat. */
function Mark({ kind, id }: { kind: StatusKind; id: string }) {
  return <i className={`cy-mark cy-mark--${kind}`} aria-describedby={id} role="img" aria-label={kind} />
}
/* A math symbol inside an uppercase mono label: keeps its case (α must not become A, χ must not become X). */
function Sym({ children }: { children: ReactNode }) {
  return <span className="cy-sym">{children}</span>
}
function Foot({ kind, id, children }: { kind: StatusKind; id: string; children: ReactNode }) {
  return (
    <p className="cy-foot" id={id}>
      <Status kind={kind} compact />
      <span>{children}</span>
    </p>
  )
}

/*
 * A wide beat's composition: text column + figure. On a short screen (a phone with the browser toolbars
 * showing, or with Deeper physics on) it can be taller than the screen, and since step content is sticky,
 * whatever hangs below the fold would never be seen. So while the step holds, the frame slides up by its
 * overflow (over the first 60% of the hold, then rests), driven by the page scroll itself, never by a nested
 * scroller. The scene lifts its picture by the same amount (cyPan), so the 3D shape and the DOM figures stay
 * in register. Where everything fits, this does nothing.
 */
function Frame({ step, children }: { step: 'b1' | 'b4' | 'b5'; children: ReactNode }) {
  const h = useChapter()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let over = 0
    let last = 0
    // the sticky content is settled while the viewport's centre line is ½ viewport inside the step
    const a = 0.5 / LEN[step]
    const b = 1 - a
    const apply = () => {
      const p = h.step(step)
      const y = over * smoothstep(a, a + 0.6 * (b - a), p)
      if (Math.abs(y - last) > 0.05) {
        last = y
        el.style.transform = y > 0 ? `translate3d(0, ${(-y).toFixed(1)}px, 0)` : ''
      }
      // the scene follows while the content is held, and settles back as the content scrolls away
      cyPan[step] = y * (1 - smoothstep(b, 1, p))
    }
    const measure = () => {
      // in-flow boxes only (offset* ignore transforms; the beat's backdrop glow must not count)
      let bottom = 0
      for (const c of Array.from(el.children) as HTMLElement[]) bottom = Math.max(bottom, c.offsetTop + c.offsetHeight)
      const o = bottom - el.clientHeight
      over = o > 1 ? o : 0
      apply()
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const c of Array.from(el.children)) ro.observe(c)
    const off = onJourney(apply)
    measure()
    return () => {
      off()
      ro.disconnect()
      cyPan[step] = 0
    }
  }, [h, step])
  return (
    <div ref={ref} className={`cy-frame cy-frame--${step}`}>
      {children}
    </div>
  )
}

export default function Overlay() {
  return (
    <>
      {/* bottom-aligned, no sub-line and set narrow, so the question sits below-left of the centred H2 loop and
          stays clear of it while it scrolls away (the scene slides the loop up and right at the same time) */}
      <ChapterTitle length={LEN.title} status="derived" valign="bottom">
        What shape <br />
        could the hidden <br />
        dimensions <em>have</em>?
      </ChapterTitle>

      <Step id="opening" length={LEN.opening} align="left">
        <Beat status="derived" kicker="A circle was the easy case">
          Chapter 5 hid one dimension in a circle. Superstring theory needs nine of space; if it describes our world, six must hide. Six can curl up in vastly more ways than
          one. The hidden shape isn’t decoration: it would help decide what strings can do.
        </Beat>
        <Caption>Nine space dimensions: a consistency requirement within superstring theory · extra dimensions are unobserved</Caption>
      </Step>

      <Step id="b1" length={LEN.b1} align="wide" className="cy-step">
        <Frame step="b1">
          <div className="cy-frame__text">
            <Beat status="derived" kicker="Which shapes are allowed?">
              Not any shape will do. If the hidden space is otherwise empty and some{' '}
              <span className="cy-nowrap">
                <Term id="supersymmetry">supersymmetry</Term>
                <Mark kind="observed" id="cy-fn-susy" />
              </span>{' '}
              survives, string theory’s equations demand a <Term id="calabi-yau-manifold">Calabi–Yau manifold</Term>: curved, yet solving Einstein’s equations for empty space. Calabi conjectured such geometries exist (1954–57); Yau proved it (1977–78).
            </Beat>
            <Foot kind="observed" id="cy-fn-susy">
              No superpartner found so far
            </Foot>
            <Deeper>
              Six-dimensional Calabi–Yau shapes have SU(3) holonomy, which keeps one quarter of the supersymmetry in four dimensions. Other options exist (G₂ manifolds in M-theory,
              flux compactifications, orbifolds); Calabi–Yau is the simplest, best-studied case.
            </Deeper>
          </div>
          <div className="cy-frame__fig">
            <Rosette />
          </div>
          <Timeline />
        </Frame>
      </Step>

      <Step id="b2" length={LEN.b2} align="left">
        <Beat status={['analogy', 'derived']} kicker="The famous picture is a shadow">
          You may have seen this picture. It is a shadow of a slice. Cut a six-dimensional Calabi–Yau, the quintic, and a two-dimensional surface remains. That surface still
          needs four dimensions, so we draw its 3D <Term id="projection">projection</Term>. Turn through the fourth direction and the shadow changes.
        </Beat>
        <Caption>
          A 2D slice of the 6D quintic, drawn as its 3D shadow · the surface <Sym>z₁⁵ + z₂⁵ = 1</Sym> is exact · not a picture of our universe
        </Caption>
      </Step>

      <Step id="b3" length={LEN.b3} align="left" valign="top" className="cy-step-b3">
        <Beat status={['derived', 'analogy']} kicker="The shape sets the notes">
          A drum’s shape sets its notes. Hidden dimensions do the same for strings: wave patterns must fit the shape. Patterns with zero wiggle cost no energy, so they’d look like
          massless particles. How many exist depends on the shape’s <Term id="topology">topology</Term>, its holes, not its size.
        </Beat>
        <p className="cy-foot cy-foot--wide">
          <Status kind="analogy" compact />
          <span className="cy-foot__long">Warm stripes: a harmonic pattern on the open slice. Real zero-modes are harmonic forms on the full 6D shape.</span>
          <span className="cy-foot__short">Stripes: a pattern on the open slice, not the real zero-modes</span>
        </p>
        <WaveLadder />
        <DeeperDrawer id="deeper-notes" context="b3" />
      </Step>

      <Step id="b4" length={LEN.b4} align="wide" className="cy-step">
        <Frame step="b4">
          <div className="cy-frame__text">
            <Beat status="derived" kicker="Count the holes, count the families">
              In 1985, Candelas, Horowitz, Strominger and Witten found that in the simplest recipe, particle <Term id="generation">generations</Term> number half the shape’s{' '}
              <Term id="euler-characteristic">Euler characteristic</Term>, ignoring sign. The quintic’s is −200: one hundred generations. We observe{' '}
              <span className="cy-nowrap">
                three
                <Mark kind="observed" id="cy-fn-three" />.
              </span>{' '}
              Shapes giving three exist; in this recipe, the quintic can’t be ours.
            </Beat>
            <Foot kind="observed" id="cy-fn-three">
              Three generations, established by experiment
            </Foot>
            <Deeper>
              In the 1985 “standard embedding” the quintic carries 101 families (E₆ <b>27</b>s, counted by h²¹) and 1 anti-family (<b>27̄</b>, counted by h¹¹). They pair off; the net
              100 survives. Other gauge bundles change the count, so “not ours” holds only in this recipe.
            </Deeper>
            <DeeperDrawer id="deeper-holes" context="b4" />
          </div>
          <div className="cy-frame__fig cy-frame__fig--ledger">
            <Ledger />
          </div>
        </Frame>
      </Step>

      <Step id="b5" length={LEN.b5} align="wide" className="cy-step">
        <Frame step="b5">
          <div className="cy-frame__text">
            <Beat status="derived" kicker="Even the right shape has dials">
              A shape with the right holes still has dials: sizes and shape-twists called <Term id="moduli">moduli</Term>. The quintic has one size dial and 101 shape dials. Their
              settings would set masses and force strengths. Left loose, they’d add long-range forces never{' '}
              <span className="cy-nowrap">
                seen
                <Mark kind="observed" id="cy-fn-fifth" />.
              </span>{' '}
              How they’re fixed is{' '}
              <span className="cy-nowrap">
                debated
                <Mark kind="speculative" id="cy-fn-fix" />.
              </span>
            </Beat>
            <Foot kind="observed" id="cy-fn-fifth">
              Fifth-force searches find none
            </Foot>
            <Foot kind="speculative" id="cy-fn-fix">
              Moduli stabilization: proposals, not settled
            </Foot>
            <Caption>
              <span className="cy-inline-chip">
                <Status kind="analogy" compact />
              </span>{' '}
              The slice breathing: we bend the picture, not a real Calabi–Yau
            </Caption>
          </div>
          <div className="cy-frame__fig cy-frame__fig--ledger">
            <Dials />
          </div>
        </Frame>
      </Step>

      <Step id="b6" length={LEN.b6} align="left">
        <Beat status="derived" kicker="How many shapes?">
          How many Calabi–Yau shapes are there? One catalogue alone, built from 473,800,776 four-dimensional polytopes, yields 30,108 distinct pairs of{' '}
          <Term id="hodge-numbers">Hodge numbers</Term>, often shared by many shapes. Whether the full count is finite is unknown. Which shape, if any, describes our universe: nobody
          knows.
        </Beat>
        <Caption>Kreuzer–Skarke (2000) · each point is one (h¹¹, h²¹) pair, not one shape</Caption>
        <Deeper>
          The often-quoted 10⁵⁰⁰ counts flux vacua, not Calabi–Yau shapes. This list alone allows at most about 10⁴²⁸ topologically distinct hypersurfaces.
        </Deeper>
      </Step>

      <Lab
        title="Turn the shadow"
        side="left"
        length={LEN.lab}
        status={['derived', 'analogy']}
        hint={
          <>
            Drag to orbit
            <span className="cy-keyhint">
              {' '}
              · ← → turn <Sym>α</Sym> · [ ] <Sym>n</Sym> · W wrap
            </span>
          </>
        }
        intro={<p>A genuine slice of a Calabi–Yau. Rotate it, count its handles, and try to trap a string.</p>}
        footer={
          <>
            <DeeperDrawer id="deeper" context="lab" />
            <p className="cy-keys">The bends you see aren’t the true Ricci-flat geometry. Beyond the torus, nobody knows it in closed form.</p>
          </>
        }
      >
        <LabPanel />
      </Lab>

      {/* top-aligned: when the section ends the caption scrolls up and away above the H2 loop, never through it */}
      <Step id="exit" length={LEN.exit} align="center" valign="top">
        <Caption>Shape unknown · size unknown · next: where do open strings end?</Caption>
      </Step>
    </>
  )
}

/* ───────────────────────── Lab panel ───────────────────────── */

const PARENT_NOTE: Record<Degree, string> = {
  3: 'Parent: a torus, the Calabi–Yau with two real dimensions. Here the slice is the whole thing.',
  4: 'Parent: a K3 surface, four real dimensions. You’re seeing a slice.',
  5: 'Parent: the quintic threefold, six real dimensions, as many as superstrings hide. You’re seeing a slice.',
  6: 'Parent: a Calabi–Yau fourfold, eight real dimensions, more than superstrings hide.',
}

function LabPanel() {
  const h = useChapter()
  const { n, alpha, s, pieces, wrap, playing, phase } = useCY()
  const st = useCY.getState()
  const topo = TOPO[n]
  // the panel scrolls on short screens: bring the string experiment into view when it opens
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (wrap) wrapRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [wrap, phase])

  // keyboard: ← → α ±5°, [ ] step n, W toggles wrap — only while the lab is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!h.inStep('lab') || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      const c = useCY.getState()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        c.setAlpha(c.alpha + (e.key === 'ArrowRight' ? 5 : -5))
        e.preventDefault()
      } else if (e.key === '[' || e.key === ']') c.stepN(e.key === ']' ? 1 : -1)
      else if (e.key === 'w' || e.key === 'W') c.setWrap(!c.wrap)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [h])

  // leaving the lab stops the α player
  useEffect(
    () =>
      onJourney(() => {
        if (useCY.getState().playing && !h.inStep('lab')) useCY.getState().setPlaying(false)
      }),
    [h],
  )

  const caption =
    phase === 'snag'
      ? 'Snagged. On the slice this loop circles a handle, so it can’t shrink.'
      : phase === 'stuck'
        ? 'Stuck for real. At n = 3 the slice is the entire Calabi–Yau: a torus.'
        : phase === 'escape' || phase === 'free'
          ? 'Free. In the full shape it slips out through directions this slice leaves out.'
          : null

  return (
    <div className="cy-lab">
      <div className="cy-lab__block cy-lab__block--n">
        <Segmented
          label={
            <>
              Degree <Sym>n</Sym>
            </>
          }
          value={n}
          options={DEGREES.map((d) => ({ value: d, label: <Sym>n = {d}</Sym>, hint: TOPO[d].parent }))}
          onChange={(v) => st.setN(v as Degree)}
        />
        <p className="cy-lab__note">{PARENT_NOTE[n]}</p>
      </div>

      <div className="cy-lab__block cy-lab__block--spec">
        <dl className="cy-lab__spec" aria-live="polite">
          <div>
            <dt>
              Parent <Sym>χ</Sym>
            </dt>
            <dd className="is-field">{topo.chi}</dd>
          </div>
          <div>
            <dt>
              Slice handles <Sym>g</Sym>
            </dt>
            <dd className="is-field">{topo.g}</dd>
          </div>
          <div>
            <dt>Pieces</dt>
            <dd>
              {n}² = {n * n}
            </dd>
          </div>
          <div>
            <dt>Parent dims</dt>
            <dd>{topo.real} real</dd>
          </div>
          <div>
            <dt>Parent traps</dt>
            <dd>{topo.trap}</dd>
          </div>
          <div>
            <dt>Generations</dt>
            <dd className={n === 5 ? 'is-warm' : ''}>{topo.gen}</dd>
          </div>
        </dl>
        <p className="cy-lab__note cy-lab__note--dim">
          {n === 5
            ? 'Simplest recipe: 100 generations. Observed: 3. So, in this recipe, the quintic isn’t our world.'
            : 'The generation rule applies to six-dimensional shapes, n = 5.'}
        </p>
      </div>

      <div className="cy-lab__block cy-lab__block--alpha">
        <div className="cy-lab__row">
          <Slider
            label={
              <>
                Hidden rotation <Sym>α</Sym>
              </>
            }
            value={alpha}
            min={0}
            max={360}
            step={1}
            onChange={(v) => st.setAlpha(v)}
            format={(v) => `${Math.round(v)}°`}
            describe="Rotates the 4D surface through its hidden fourth direction. The surface is unchanged; only its 3D shadow re-folds."
          />
          <button type="button" className="cy-play" aria-pressed={playing} aria-label={playing ? 'Pause the hidden rotation' : 'Play the hidden rotation'} onClick={() => st.setPlaying(!playing)}>
            {playing ? (
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M3 2v8M9 2v8" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M3 1.8 10 6 3 10.2Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
        <p className="cy-lab__note">Turn through the fourth direction. The surface doesn’t change; only its shadow does.</p>
      </div>

      <div className="cy-lab__toggles">
        <Toggle label={`Show pieces (${n * n})`} checked={pieces} onChange={(v) => st.setPieces(v)} describe={`Built from ${n * n} copies of one piece, each turned by a complex phase.`} />
        <Toggle label="Wrap a string" checked={wrap} onChange={(v) => st.setWrap(v)} describe="A closed string, wound once around a handle of the slice." />
      </div>

      {wrap && (
        <div className="cy-lab__wrap" ref={wrapRef}>
          {/* the outcome replaces the set-up line, so it is always in view and the block keeps its height */}
          <p className={`cy-lab__caption${caption ? ' is-on' : ''}`} aria-live="polite">
            {caption ? (
              <>
                <Status kind={phase === 'escape' || phase === 'free' ? 'analogy' : 'derived'} compact /> {caption}
              </>
            ) : (
              'A closed string, wound once around a handle of the slice. Now try to shrink it.'
            )}
          </p>
          <div className="cy-lab__btns">
            <Button onClick={() => st.requestShrink('slice')}>Shrink on the slice</Button>
            <Button onClick={() => st.requestShrink('full')}>Shrink in the full shape</Button>
            {phase === 'free' && (
              <Button variant="solid" onClick={() => st.resetLoop()}>
                Reset loop
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="cy-lab__block cy-lab__block--squash">
        <Slider
          label={
            <>
              Squash &amp; twist <Sym>s</Sym>
            </>
          }
          value={s}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => st.setS(v)}
          format={(v) => v.toFixed(2)}
          describe="Bends the drawn picture smoothly. Handles, Euler characteristic and the generation count stay the same."
        />
        <p className="cy-lab__note">
          <Status kind="analogy" compact /> Squash it all you like: the holes, and the massless count, stay put. Cartoon: we bend the picture, not a real Calabi–Yau.
        </p>
      </div>
    </div>
  )
}

/* ───────────────────────── Go deeper ───────────────────────── */

type Ctx = 'b3' | 'b4' | 'lab'

function DeeperDrawer({ id, context }: { id: string; context: Ctx }) {
  return (
    <GoDeeper id={id} title="Why holes count particles" label={context === 'b3' ? 'Why zero wiggle = massless' : context === 'b4' ? 'The hole count, in equations' : 'Go deeper'}>
      <DeeperBody context={context} />
    </GoDeeper>
  )
}

function DeeperBody({ context }: { context: Ctx }) {
  const n = useCY((s) => s.n)
  const h = useChapter()
  // where the visitor is decides which terms light up (the drawer locks scroll while open)
  const [P, setP] = useState(() => packP(h.progress()))
  useEffect(() => onJourney(() => setP(packP(h.progress()))), [h])
  const inB3 = context === 'b3' || (P >= 0.32 && P < 0.46)
  const inB4 = context === 'b4' || (P >= 0.46 && P < 0.62)
  const inLab = context === 'lab'
  const hlWave = { m2: inB3 ? 1 : 0, lap: inB3 ? 1 : 0, psi: inB3 ? 1 : 0 }
  const hlHodge = { h11: inB4 ? 1 : 0, h21: inB4 ? 1 : 0, chi: inB4 ? 1 : 0, ngen: inB4 ? 1 : 0 }
  const hlShape = { quintic: inLab && n === 5 ? 1 : 0, slice: inLab ? 1 : 0 }
  return (
    <>
      <p>
        Split a massless ten-dimensional field into a 4D wave times a pattern ψ spread over the hidden shape Y. The wave equation then becomes an eigenvalue problem on Y:
      </p>
      <Eq
        display
        tex={String.raw`\htmlClass{term-m2}{m^2}\,\htmlClass{term-psi}{\psi} \;=\; -\htmlClass{term-lap}{\nabla_Y^{2}}\,\htmlClass{term-psi}{\psi}`}
        highlight={hlWave}
        label="m squared times psi equals minus the Laplacian on Y acting on psi"
      />
      <p>
        <b>m²</b> is the mass-squared a 4D observer would measure; <b>∇²<sub>Y</sub></b>, the Laplacian on Y, measures how sharply ψ wiggles across the hidden shape; <b>ψ</b> is
        the pattern itself. Wigglier patterns are heavier (on a circle m ∝ 1/R, as in Chapter 5). Zero-wiggle patterns (∇²ψ = 0) are massless.
      </p>
      <p>
        For a plain number-valued ψ on a closed shape, that forces ψ to be constant: one pattern, whatever the shape. For fields that carry directions (forms), Hodge’s theorem says
        the number of zero-wiggle patterns equals the number of independent holes of each dimension. That count is topological, blind to stretching. For quarks and leptons an
        index theorem does the same job and fixes the net number of families.
      </p>
      <h3>Two numbers for a threefold</h3>
      <p>For a Calabi–Yau threefold the relevant holes are packaged in two Hodge numbers:</p>
      <Eq
        display
        tex={String.raw`\htmlClass{term-chi}{\chi} \;=\; 2\,\big(\htmlClass{term-h11}{h^{1,1}}-\htmlClass{term-h21}{h^{2,1}}\big), \qquad \htmlClass{term-ngen}{N_{\text{gen}}} \;=\; \tfrac12\,|\chi|`}
        highlight={hlHodge}
        label="chi equals 2 times h11 minus h21; the number of generations is half the absolute value of chi"
      />
      <p>
        <b>h¹¹</b> counts independent 2D holes, which is also the number of size dials. <b>h²¹</b> counts the shape dials, tied to the 3D holes. <b>χ</b> is the Euler
        characteristic. <b>N<sub>gen</sub></b> is the net number of generations in the 1985 “standard embedding”, where families and anti-families pair off and only the difference
        survives. (There, the number of E₆ <b>27</b>s is h²¹ and of <b>27̄</b>s is h¹¹, so the quintic gives 101 and 1: net 100.)
      </p>
      <h3>The quintic, and the slice you can turn</h3>
      <Eq
        display
        tex={String.raw`\htmlClass{term-quintic}{z_1^5+z_2^5+z_3^5+z_4^5+z_5^5=0 \quad\text{in } \mathbb{CP}^4}`}
        highlight={hlShape}
        label="z1 to the fifth plus ... plus z5 to the fifth equals zero, in complex projective four-space"
      />
      <p>
        has h¹¹ = 1 and h²¹ = 101, so χ = −200 and N<sub>gen</sub> = 100. Set z₃ = z₄ = 0 and z₅ = −1. What is left is the surface on screen:
      </p>
      <Eq display tex={String.raw`\htmlClass{term-slice}{z_1^5 + z_2^5 = 1}`} highlight={hlShape} label="z1 to the fifth plus z2 to the fifth equals one" />
      <h3>How the picture is built</h3>
      <p>
        Following Hanson (1994): with θ = x + iy, x ∈ [−1, 1], y ∈ [0, π/2], and ω = e<sup>2πi/n</sup>,
      </p>
      <Eq display tex={String.raw`z_1 = \omega^{k_1}(\cosh\theta)^{2/n},\quad z_2 = \omega^{k_2}(-i\sinh\theta)^{2/n} \;\Rightarrow\; z_1^n + z_2^n = 1`} label="Hanson's parametrization" />
      <p>
        Each of the n² pieces (k₁, k₂) is one copy of the same patch turned by complex phases. The surface lives in four real dimensions; we draw (Re z₁, Re z₂, cos α Im z₁ + sin α Im
        z₂). Turning α changes only the shadow. The drawing is cut off at |x| = 1: the real surface continues outward to infinity.
      </p>
      <h3>Sources</h3>
      <ul className="cy-sources">
        <li>A. J. Hanson, “A construction for computer visualization of certain complex curves”, Notices AMS 41(9) (1994) 1156–1163.</li>
        <li>P. Candelas, G. Horowitz, A. Strominger, E. Witten, “Vacuum configurations for superstrings”, Nucl. Phys. B 258 (1985) 46–74.</li>
        <li>M. Kreuzer, H. Skarke, Adv. Theor. Math. Phys. 4 (2000) 1209–1230, arXiv:hep-th/0002240.</li>
        <li>Tian–Yau ÷ ℤ₃ (χ = −6): G. Tian, S.-T. Yau (1987); B. Greene et al., Nucl. Phys. B 278 (1986) 667.</li>
        <li>Number of light neutrino types: PDG 2024, N<sub>ν</sub> = 2.996 ± 0.007.</li>
      </ul>
    </>
  )
}
