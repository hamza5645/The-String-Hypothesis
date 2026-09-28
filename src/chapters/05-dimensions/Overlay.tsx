import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Beat, Caption, ChapterTitle, Deeper, Eq, GoDeeper, Lab, Readout, Segmented, Slider, Status, Step, Term, Toggle } from '@/ui'
import { useChapter } from '@/core/chapter'
import { GLOSSARY } from '@/core/glossary'
import { onJourney } from '@/core/journey'
import { pluck } from '@/core/audio'
import { HBARC, LHC_EV, R_GRAV, R_MAX, R_MIN, R_UED_START, STEP_LEN, formatEnergy, formatLength, rungsBelow, sciText, sizeComparison } from './constants'
import { chipsLanded, countB } from './model'
import { useDim, type Station } from './store'
import './styles.css'

/* ─────────────── scroll-linked helpers (no React renders per scroll) ─────────────── */

/** Integer chips landed on the balance (re-renders only when it changes). */
function useChipsLanded() {
  const h = useChapter()
  const [n, setN] = useState(0)
  useEffect(
    () =>
      onJourney(() => {
        const v = Math.round(chipsLanded(countB(h.step('count'), window.innerWidth / Math.max(1, window.innerHeight) < 0.8)))
        setN((o) => (o === v ? o : v))
      }),
    [h],
  )
  return n
}

/* ─────────────── small local controls (the shared kit has no disabled state) ─────────────── */

function ActButton({ children, onClick, disabled, title }: { children: ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button type="button" className="btn btn--ghost dim-btn" onClick={onClick} disabled={disabled} aria-disabled={disabled} title={title}>
      {children}
    </button>
  )
}

function Micro({ children, tone }: { children: ReactNode; tone?: 'dim' | 'warn' }) {
  return <p className={`dim-micro${tone ? ' dim-micro--' + tone : ''}`}>{children}</p>
}

/** A glossary link to a term another chapter defines; plain text until that chapter's entry exists. */
function XTerm({ id, children }: { id: string; children: ReactNode }) {
  return GLOSSARY[id] ? <Term id={id}>{children}</Term> : <>{children}</>
}

/* ─────────────── lab stations ─────────────── */

const D_LABELS = ['0 · Pointland', '1 · Lineland', '2 · Flatland', '3 · Spaceland (ours)', '4 · shadow only']

function CountStation() {
  const D = useDim((s) => s.D)
  const dist = useDim((s) => s.dist)
  const orbit = useDim((s) => s.orbit)
  const orbitNote = useDim((s) => s.orbitNote)
  const visitorOn = useDim((s) => s.visitorOn)
  const set = useDim((s) => s.set)
  const setOrbit = useDim((s) => s.setOrbit)
  const requestVisitor = useDim((s) => s.requestVisitor)
  const ratio = D === 0 ? null : Math.pow(dist, -(D - 1))
  const visitorCopy = [
    '',
    'A disk crossing Lineland: a segment appears, grows, shrinks, vanishes.',
    'A sphere crossing Flatland: they see a circle appear, grow, shrink, vanish.',
    'A 4D ball crossing our space would look like a sphere inflating from nothing, then deflating.',
    '',
  ][D]
  return (
    <>
      <Micro>How many directions can you move in? Change the count and watch gravity spread.</Micro>
      <Segmented
        label="Large directions of space"
        value={D}
        options={[0, 1, 2, 3, 4].map((d) => ({ value: d, label: String(d), hint: D_LABELS[d] }))}
        onChange={(v) => set({ D: v, visitorOn: false, orbitNote: '' })}
      />
      <p className="dim-dlabel t-mono" aria-live="polite">
        {D_LABELS[D]}
      </p>
      <Slider
        label="Distance from the mass"
        value={dist}
        min={0.5}
        max={8}
        log
        onChange={(v) => set({ dist: v })}
        format={(v) => `r = ${v.toFixed(2)}`}
        describe="Moves the probe boundary; the readout shows how much weaker gravity is there."
      />
      <div className="dim-readouts">
        <Readout
          label={
            <>
              Force ÷ <span className="dim-nocase">F(1)</span>
            </>
          }
          value={ratio == null ? '—' : `${ratio >= 100 ? ratio.toFixed(0) : ratio.toPrecision(3)}×`}
          tone="ink"
        />
        <Readout label="Falls as" value={D === 0 ? '—' : D === 1 ? 'constant' : `1/r${D - 1 === 1 ? '' : D === 3 ? '²' : '³'}`} />
      </div>
      <Micro tone="dim">
        Gravity here weakens as 1/r<sup>(D−1)</sup>. We measure 1/r²: <Term id="inverse-square-law">three large directions</Term>.
      </Micro>
      <div className="dim-row">
        <ActButton onClick={requestVisitor} disabled={D === 0 || D === 4 || visitorOn} title={D === 0 || D === 4 ? 'Available for 1, 2 or 3 directions' : undefined}>
          {visitorOn ? 'Visitor passing…' : 'Send a visitor from one dimension up'}
        </ActButton>
      </div>
      {visitorOn && visitorCopy && (
        <Micro>
          {visitorCopy} {D === 3 && <Status kind="analogy" compact />}
        </Micro>
      )}
      <div className={D <= 1 ? 'dim-disabled' : ''}>
        <Toggle label="Orbit a planet" checked={orbit && D >= 2} onChange={(v) => D >= 2 && setOrbit(v)} describe="Launches a planet with a 3% tangential kick." />
      </div>
      {D <= 1 && <Micro tone="dim">{D === 0 ? 'No room to move.' : 'No room to orbit.'}</Micro>}
      {orbit && D === 4 && <Micro>Four large directions: gravity falls as 1/r³ and orbits spiral away. (Ehrenfest, 1917)</Micro>}
      {orbit && D === 3 && <Micro tone="dim">Nearly circular: r stays between 1.00 and 1.13.</Micro>}
      {orbit && D === 2 && <Micro tone="dim">Bound, but the ellipse precesses into a rosette.</Micro>}
      {orbitNote && <p className="dim-micro dim-micro--dim t-mono">{orbitNote === 'escaped' ? 'Escaped (r > 6). Resetting…' : 'Fell in (r < 0.1). Resetting…'}</p>}
    </>
  )
}

const TAN_H = Math.tan(((35 * Math.PI) / 180) / 2)

function ZoomStation() {
  const zoom = useDim((s) => s.zoom)
  const set = useDim((s) => s.set)
  const H = typeof window !== 'undefined' ? window.innerHeight : 900
  const Dpx = (2 * (H / 2)) / (zoom * TAN_H)
  const looks = Dpx < 1.5 ? '1 dimension' : Dpx > 6 ? '2 dimensions' : 'in between'
  const detail = (zoom * TAN_H) / (H / 2)
  return (
    <>
      <Micro>Far away, “around” is smaller than your sharpest detail. It’s still there.</Micro>
      <Slider
        label="Zoom toward the cable"
        value={1e4 / zoom}
        min={1}
        max={1e4 / 3}
        log
        onChange={(v) => set({ zoom: 1e4 / v })}
        format={() => `d = ${zoom >= 1000 ? sciText(zoom, 2) : zoom.toFixed(zoom < 10 ? 1 : 0)} radii`}
        describe="Moves the camera from ten thousand cable radii away to three."
      />
      <div className="dim-readouts">
        <Readout label="Looks like" value={looks} tone="ink" />
        <Readout label="Sharpest detail" value={detail >= 10 ? detail.toFixed(0) : detail >= 0.01 ? detail.toFixed(2) : sciText(detail, 2)} unit="radii" />
      </div>
      <Micro>For a hidden dimension, zooming in means colliding at energy ≳ ħc/R.</Micro>
      <Micro tone="dim">
        <Status kind="analogy" compact /> A cable has an inside. A hidden dimension has only its surface.
      </Micro>
    </>
  )
}

function FitStation() {
  const k = useDim((s) => s.k)
  const R = useDim((s) => s.R)
  const mode = useDim((s) => s.mode)
  const set = useDim((s) => s.set)
  const snapT = useRef<number>(0)
  const lastSound = useRef(0)
  const E1 = HBARC / R
  const below = rungsBelow(R)
  const dev = Math.abs(k - Math.round(k))
  const excludedAll = mode === 'all' && R >= R_UED_START
  const excludedGrav = mode === 'gravity' && R > R_GRAV
  const f1 = Math.min(2000, Math.max(40, 220 * Math.pow(2, -(Math.log10(R) + 20) / 6)))

  const onK = (v: number) => {
    set({ k: v })
    window.clearTimeout(snapT.current)
    snapT.current = window.setTimeout(() => {
      const kk = useDim.getState().k
      const n = Math.round(kk)
      if (Math.abs(kk - n) < 0.08 && Math.abs(kk - n) > 1e-6) set({ k: n })
    }, 380)
    const now = performance.now()
    if (now - lastSound.current > 160) {
      lastSound.current = now
      const n = Math.round(v)
      // harmonics: k·f₁ with round(k)·f₁ — the beat slows to a pure tone as k locks (illustrative pitch map)
      if (v > 0.02) pluck(f1, [{ freq: v * f1, amp: 1 }, ...(Math.abs(v - n) > 0.01 && n > 0 ? [{ freq: n * f1, amp: 0.8 }] : [])], { decay: 0.9, gain: 0.35 })
    }
  }
  const onR = (v: number) => {
    set({ R: v })
    const now = performance.now()
    if (now - lastSound.current > 200) {
      lastSound.current = now
      const f = Math.min(2000, Math.max(40, 220 * Math.pow(2, -(Math.log10(v) + 20) / 6)))
      pluck(f, [1, 2, 3].map((n) => ({ n, amp: 1 / n })), { decay: 1.1, gain: 0.3 })
    }
  }
  // one verdict for this radius in this mode (the stage mirrors "excluded" at the ruler's cursor)
  const verdict: ReactNode = excludedAll ? (
    <>
      <Status kind="observed" compact /> Ruled out: colliders would already have made these heavy copies.
    </>
  ) : excludedGrav ? (
    <>
      <Status kind="observed" compact /> Ruled out: gravity would already bend away from 1/r² in the tested range.
    </>
  ) : mode === 'gravity' && below > 1e6 ? (
    'Rungs this close blur together. Escaping gravitons would look like missing energy.'
  ) : below === 0 ? (
    'Every rung above n = 0 lies beyond the LHC’s collision energy. Out of direct reach.'
  ) : mode === 'all' ? (
    'Below 13.6 TeV isn’t automatically seen: each quark or gluon carries only part of the collision energy.'
  ) : (
    'Shrink the circle. Watch the whole ladder climb.'
  )
  return (
    <>
      <Slider
        label={
          <>
            Wavelengths around the circle <span className="dim-nocase">(k)</span>
          </>
        }
        value={k}
        min={0}
        max={6}
        step={0.01}
        onChange={onK}
        format={(v) => `k = ${v.toFixed(2)}`}
        describe="Non-integer values do not close on themselves; whole numbers fit."
      />
      <Micro tone={dev > 0.02 ? 'dim' : undefined}>
        {k < 0.02
          ? 'No motion around the circle: the ordinary, lightest particle.'
          : dev < 0.02
            ? `Fits: ${Math.round(k)} whole wavelength${Math.round(k) === 1 ? '' : 's'}. Allowed.`
            : 'Doesn’t close on itself. Lap after lap, the wave cancels itself out.'}
      </Micro>
      <Slider
        label={
          <>
            Radius of the hidden circle <span className="dim-nocase">(R)</span>
          </>
        }
        value={R}
        min={R_MIN}
        max={R_MAX}
        log
        onChange={onR}
        format={(v) => formatLength(v)}
        describe="Shrink the circle and the whole ladder of masses climbs."
      />
      <Segmented
        label="Who can move around the circle?"
        value={mode}
        options={[
          { value: 'all', label: 'All particles' },
          { value: 'gravity', label: 'Only gravity ○' },
        ]}
        onChange={(v) => set({ mode: v })}
      />
      {mode === 'gravity' && (
        <Micro tone="dim">
          <Status kind="speculative" compact /> braneworld: only gravity feels the circle.
        </Micro>
      )}
      <p className={`dim-status${excludedAll || excludedGrav ? ' dim-status--warn' : ''}`} aria-live="polite">
        {verdict}
      </p>
      <div className="dim-readouts">
        <Readout
          label={
            <>
              E₁ = <span className="dim-nocase">ħc/R</span>
            </>
          }
          value={formatEnergy(E1)}
          tone="ink"
        />
        <Readout label="Below 13.6 TeV" value={below > 1e6 ? `${sciText(below, 2)} ≈ a continuum` : String(below)} />
        <Readout
          label={
            <>
              R × E₁ = <span className="dim-nocase">ħc</span>
            </>
          }
          value="197.327 MeV·fm · always"
        />
        <Readout label="Size" value={sizeComparison(R)} />
      </div>
      {/* shown on the stage beside the ladder */}
      <p className="sr-only">In Kaluza–Klein theory, n also acts like an electric charge.</p>
      <Deeper>
        <Eq tex={`E_1=\\frac{\\hbar c}{R}=\\frac{197.327\\ \\mathrm{MeV\\,fm}}{R}\\quad(\\mathrm{LHC}:\\ ${(LHC_EV / 1e12).toFixed(1)}\\ \\mathrm{TeV})`} />
      </Deeper>
    </>
  )
}

function DeeperMass() {
  const k = useDim((s) => s.k)
  const station = useDim((s) => s.station)
  const n = Math.round(k)
  const lock = station === 'fit' && n >= 1 ? 1 - Math.min(1, Math.abs(k - n) / 0.06) : 0
  return (
    <GoDeeper id="mass" title="Why a circle makes mass" label="Why a circle makes mass">
      <p>
        A wave on a circle of radius R must be single-valued: after one lap (a distance of 2πR) it has to return to its starting value. So a whole number n of
        wavelengths must fit around the circle, and by de Broglie’s rule the momentum around the circle comes in steps. Einstein’s energy relation, written in five
        dimensions, then reads
      </p>
      <Eq
        display
        tex="E^2=(pc)^2+\htmlClass{term-n}{\left(\frac{n\hbar c}{R}\right)^2}+\htmlClass{term-m}{(m_0c^2)^2}"
        highlight={{ n: lock, m: 0 }}
        label="E squared equals p c squared, plus n h-bar c over R squared, plus m-zero c squared squared"
      />
      <ul>
        <li>
          <strong>E</strong> is the total energy; <strong>p</strong> is the momentum along our three large directions.
        </li>
        <li>
          <strong>nħc/R</strong> is the hidden circling, the lit rung in the lab{lock > 0.5 ? ` (now n = ${n})` : ''}.
        </li>
        <li>
          <strong>m₀</strong> is the particle’s own five-dimensional mass, zero for a graviton.
        </li>
      </ul>
      <p>An observer who can’t see the circle compares this with E² = (pc)² + (mc²)² and concludes that the particle has a mass</p>
      <Eq display tex="m_nc^2=\sqrt{(m_0c^2)^2+\htmlClass{term-n}{\left(\frac{n\hbar c}{R}\right)^2}}" highlight={{ n: lock }} />
      <p>
        The rungs are spaced by <strong>ħc/R ≈ 197 MeV·fm ÷ R</strong>. For R = 10⁻¹⁹ m that spacing is about 2 TeV. In Kaluza–Klein theory, n also sets the
        particle’s charge under the photon-like field that comes from the geometry.
      </p>
      <p className="dim-fine">
        Simplifications in the lab: the circle is drawn at a constant size (not to scale); only one hidden circle is shown, where string theory needs six hidden
        dimensions; winding strings are left for Chapter 08; the rungs are for a free particle. The echo laps are a picture of the single-valuedness rule, not literal
        dynamics.
      </p>
    </GoDeeper>
  )
}

function DeeperTen({ landed }: { landed: number }) {
  return (
    <GoDeeper id="ten" title="Why ten?" label="Why ten?">
      <p>
        Quantizing a string’s worldsheet produces an <Term id="anomaly">anomaly</Term> (a classical symmetry broken by quantum effects) unless a quantity called the
        central charge adds up to zero:
      </p>
      <Eq
        display
        tex="\htmlClass{term-D}{D}\,\Big(\htmlClass{term-x}{1}+\htmlClass{term-psi}{\tfrac12}\Big)\htmlClass{term-gh}{-\,15}=0\;\Rightarrow\;D=10"
        highlight={{ D: landed / 10, x: landed > 0 ? 0.6 : 0, psi: landed > 0 ? 0.6 : 0, gh: landed >= 10 ? 1 : 0.25 }}
        label="D times one plus one half, minus fifteen, equals zero, so D equals ten"
      />
      <ul>
        <li>
          <strong>D</strong> is the number of spacetime dimensions ({landed} on the balance now).
        </li>
        <li>
          <strong>1</strong> is each dimension’s position field X; <strong>½</strong> is X’s fermionic partner ψ.
        </li>
        <li>
          <strong>−15</strong> is the gauge-fixing ghosts’ contribution: −26 + 11.
        </li>
      </ul>
      <p>
        For the bosonic string, D·1 − 26 = 0 gives D = 26. So “critical dimension” is really a critical <em>central charge</em>, and it reads as a count of dimensions
        only when every direction is flat and free. What is really required is the total: 4 flat dimensions contribute 6, so the remaining 9 must come from a hidden
        “internal” theory, such as a six-dimensional Calabi–Yau space (next chapter). Non-critical strings also exist; 10 is the flat-background statement.
      </p>
      <p className="dim-fine">
        This worldsheet (Weyl) anomaly is not the Green–Schwarz anomaly cancellation of 1984, a separate spacetime condition that selects gauge groups. M-theory’s
        11 dimensions are conjectured (Witten 1995).
      </p>
    </GoDeeper>
  )
}

const STATIONS: { value: Station; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'fit', label: 'Fit' },
]

function LabPanel() {
  const station = useDim((s) => s.station)
  const set = useDim((s) => s.set)
  return (
    <Lab
      title="The Hidden Circle"
      status={['derived', 'analogy']}
      hint={station === 'fit' ? 'Scrub k · shrink the circle: the whole ladder climbs' : station === 'zoom' ? 'Zoom in · drag the stage to orbit' : 'Drag the stage to orbit'}
      length={STEP_LEN.lab}
      footer={<DeeperMass />}
    >
      <div className="dim-tabs">
        <Segmented label="Station" value={station} options={STATIONS} onChange={(v) => set({ station: v })} />
      </div>
      {station === 'count' && <CountStation />}
      {station === 'zoom' && <ZoomStation />}
      {station === 'fit' && <FitStation />}
    </Lab>
  )
}

/* ─────────────── the chapter ─────────────── */

export default function Overlay() {
  const landed = useChipsLanded()
  return (
    <>
      <ChapterTitle status="derived" length={STEP_LEN.title} valign="bottom">
        Where would extra dimensions <em>hide</em>?
      </ChapterTitle>

      <Step id="opening" length={STEP_LEN.opening}>
        <Beat status="derived">
          The closed string from the last chapter comes with a condition. Quantized in flat space, its simplest setting, string theory is consistent only with more
          directions of space than the three we move through. If those extra directions exist, where could they hide?
        </Beat>
      </Step>

      <Step id="sweep" length={STEP_LEN.sweep}>
        <Beat status={['observed', 'analogy']} kicker="Counting directions">
          A <Term id="dimension">dimension</Term> is an independent direction to move. Sweep a point: a line, home to Lineland. Sweep the line: a plane, Abbott’s
          Flatland (1884). Sweep again: our space. Sweep once more, into a fourth direction, and we can only draw a shadow.
        </Beat>
      </Step>

      <Step id="cable" length={STEP_LEN.cable} valign="lower">
        <Beat status="analogy" kicker="Hiding by being small">
          One way to hide a direction: make it small. From afar, a cable is a line: one number says where you are. An ant on it finds a second direction: around.
          Curling a direction into a loop is <Term id="compactification">compactification</Term>. A tiny loop vanishes.
        </Beat>
        <Caption>After Brian Greene’s garden hose (1999) · not to scale</Caption>
      </Step>

      <Step id="lattice" length={STEP_LEN.lattice}>
        <Beat status={['derived', 'analogy']} kicker="A circle at every point">
          Kaluza (1921) added a fourth direction of space, a fifth dimension counting time. Klein (1926) curled it into a tiny circle at every point.{' '}
          <Term id="kaluza-klein-theory">Kaluza–Klein theory</Term>: Einstein’s gravity in five dimensions yields, in four, gravity, Maxwell’s electromagnetism, and
          one extra field.
        </Beat>
        <Caption>R ~ 10⁻³³ m (Klein’s 1926 estimate) · not to scale</Caption>
        <Deeper>
          <p className="dim-fine">
            The extra field is the circle’s own size, free to vary from place to place. It is the first example of the <XTerm id="moduli">moduli</XTerm> of a hidden
            shape; a realistic model must fix it.
          </p>
        </Deeper>
      </Step>

      <Step id="klein" length={STEP_LEN.klein}>
        <Beat status="derived" kicker="Klein’s footnote">
          Klein’s version failed: anything with the electron’s charge came out &gt;10²⁰ times too heavy. The idea outlived the model.
        </Beat>
      </Step>

      <Step id="fit" length={STEP_LEN.fit}>
        <Beat status={['derived', 'analogy']} kicker="The wave must fit">
          A wave around the hidden circle must fit: 0, 1, 2… whole wavelengths. We can’t see that motion, only its energy, weighed as mass. Shrink the circle and the{' '}
          <Term id="kaluza-klein-tower">Kaluza–Klein tower</Term> climbs. A small dimension hides by being too costly to excite.
        </Beat>
        <Deeper>
          <Eq tex="\lambda_n=\frac{2\pi R}{n},\quad p_n=\frac{n\hbar}{R},\quad E_n=\frac{n\hbar c}{R}" />
        </Deeper>
      </Step>

      <Step id="aha" length={STEP_LEN.aha} className="dim-step-aha">
        <Beat status={['derived', 'analogy']} size="display">
          Smaller circle, heavier echoes. <em>Out of reach means out of sight.</em>
        </Beat>
        <Caption>Spacing ∝ 1/R · R × first rung = ħc ≈ 197 MeV·fm</Caption>
      </Step>

      <Step id="count" length={STEP_LEN.count}>
        <Beat status={['derived', 'analogy']} kicker="String theory’s count">
          String theory turns the count into a requirement. Quantum <XTerm id="superstring">superstrings</XTerm> in flat space keep their symmetries only at a{' '}
          <Term id="critical-dimension">critical dimension</Term> of ten: nine of space, one of time. If string theory describes our world, six must be hidden, or
          replaced by something equivalent.
        </Beat>
        <div className="dim-deeper-row">
          <DeeperTen landed={landed} />
        </div>
        <Deeper>
          <Eq tex="D\,(1+\tfrac12)-15=0\;\Rightarrow\;D=10\qquad(\text{bosonic: }D-26=0)" />
        </Deeper>
      </Step>

      <Step id="bounds" length={STEP_LEN.bounds} valign="top" className="dim-step-bounds">
        <Beat status={['observed', 'speculative']} kicker="How small, and how we’d know">
          How small? Unknown. If known particles could circle a hidden dimension wider than ~10⁻¹⁹ m, colliders would have made their heavy copies. None seen. If only
          gravity could, as speculative <Term id="braneworld">braneworld</Term> models allow, torsion balances would catch one such circle above ~30 µm. Nothing yet.
        </Beat>
      </Step>

      <LabPanel />

      <Step id="exit" length={STEP_LEN.exit}>
        <span className="sr-only">The Thread returns to the centre, a closed loop in front of a faint lattice of hidden shapes.</span>
      </Step>
    </>
  )
}
