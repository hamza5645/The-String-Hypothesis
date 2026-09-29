import { useMemo } from 'react'
import { Eq, GoDeeper, Lab, Readout, Segmented, Slider, Status, Toggle, type StatusKind } from '@/ui'
import { LEN } from './director'
import { MapSvg } from './MapSvg'
import { BRIDGES, TIPS, TIP_INDEX, THEORIES, T_D1, T_F1, T_pq, fmtG, fmtT, gFromU, ratio11, rungsBelow, uFromG, type Theory, type Toggles } from './model'
import { useM } from './store'

/* ───────────────────────── MAP station ───────────────────────── */

const TOGGLES: { k: keyof Toggles; label: string; status: StatusKind; note: string }[] = [
  { k: 'T', label: 'T-duality', status: 'derived', note: 'Curl one dimension into a circle; radius R becomes α′/R.' },
  { k: 'S', label: 'S-duality', status: 'conjectured', note: 'Coupling g becomes 1/g. Strong becomes weak. Heavily checked in theory; never by experiment.' },
  { k: 'L', label: 'Strong-coupling lift', status: 'conjectured', note: 'The coupling becomes the size of an eleventh dimension.' },
]

function groups(t: Toggles) {
  const parent = [0, 1, 2, 3, 4, 5]
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  for (const b of BRIDGES) {
    if (!t[b.kind]) continue
    parent[find(b.a)] = find(b.b)
    if (b.c != null) parent[find(b.a)] = find(b.c)
  }
  const m = new Map<number, number[]>()
  for (let i = 0; i < 6; i++) {
    const r = find(i)
    m.set(r, [...(m.get(r) ?? []), i])
  }
  return [...m.values()].sort((a, b) => b.length - a.length)
}

function ToggleRow({ k, label, status, note }: { k: keyof Toggles; label: string; status: StatusKind; note: string }) {
  const on = useM((s) => s[k])
  const set = useM((s) => s.setToggle)
  return (
    <div className={`mth-trow${on ? ' is-on' : ''}`}>
      <Toggle
        label={
          <span className="mth-trow__label">
            {label} <Status kind={status} compact />
          </span>
        }
        checked={on}
        onChange={(v) => set(k, v)}
        describe={note}
      />
      <p className="mth-trow__note">{note}</p>
    </div>
  )
}

const GAP_TEXT = 'Type I is IIB with direction-blind strings plus D9-branes: close relatives, not duals.'

function Inspector() {
  const focus = useM((s) => s.focus)
  const openDial = useM((s) => s.openDial)
  const setFocus = useM((s) => s.setFocus)
  let title = ''
  let text = ''
  let dial: Theory | null = null
  if (focus?.startsWith('tip:')) {
    const t = TIPS[Number(focus.slice(4))]
    title = t.name
    text = t.hover
    if (THEORIES.includes(t.id as Theory)) dial = t.id as Theory
  } else if (focus?.startsWith('bridge:')) {
    const b = BRIDGES.find((x) => x.id === focus.slice(7))
    if (b) {
      title = b.kind === 'T' ? 'T-duality bridge' : b.kind === 'S' ? 'S-duality bridge' : b.kind === 'L' ? 'Strong-coupling lift' : 'Curl-up chord'
      text = b.hover
    }
  } else if (focus === 'gap') {
    title = 'IIB – Type I: no bridge'
    text = GAP_TEXT
  }
  return (
    <div className="mth-inspect" aria-live="polite">
      {text ? (
        <>
          <div className="mth-inspect__head">
            <span className="t-label">{title}</span>
            <button type="button" className="mth-x" onClick={() => setFocus(null)} aria-label="Clear selection">
              ×
            </button>
          </div>
          <p>{text}</p>
          {dial && (
            <button type="button" className="mth-link" onClick={() => openDial(dial!)}>
              Turn its coupling in DIAL →
            </button>
          )}
        </>
      ) : (
        <p className="mth-inspect__hint">Hover or tap an island or a bridge to read it. Click an island to open its dial.</p>
      )}
    </div>
  )
}

function Pieces() {
  const T = useM((s) => s.T)
  const S = useM((s) => s.S)
  const L = useM((s) => s.L)
  const C = useM((s) => s.C)
  const pieces = useM((s) => s.pieces)
  const setFocus = useM((s) => s.setFocus)
  const gs = useMemo(() => groups({ T, S, L, C }), [T, S, L, C])
  return (
    <div className="mth-pieces" aria-live="polite">
      <span className={`mth-pieces__n${pieces === 1 ? ' is-one' : ''}`}>{pieces}</span>
      <div className="mth-pieces__body">
        <span className="t-label">Separate pieces</span>
        <div className="mth-groups" aria-label="Connected groups">
          {gs.map((g) => (
            <span key={g.join()} className="mth-group">
              {g.map((j) => (
                <button key={j} type="button" className="mth-chip" onClick={() => setFocus(`tip:${j}`)} onMouseEnter={() => setFocus(`tip:${j}`)}>
                  {TIPS[j].short}
                </button>
              ))}
            </span>
          ))}
        </div>
      </div>
      {pieces === 1 && (
        <p className="mth-one">
          One piece: every island is a limit of one structure. <strong>Conjectured, not proven.</strong>
        </p>
      )}
    </div>
  )
}

function MapStation() {
  const more = useM((s) => s.more)
  const setMore = useM((s) => s.setMore)
  const pull = useM((s) => s.pull)
  const setPull = useM((s) => s.setPull)
  const pieces = useM((s) => s.pieces)
  return (
    <>
      <p className="mth-lead">Six theories, no bridges. Switch on each kind of duality and count the pieces.</p>
      <Pieces />
      <div className="mth-toggles">
        {TOGGLES.map((t) => (
          <ToggleRow key={t.k} {...t} />
        ))}
        <button type="button" className="mth-more" aria-expanded={more} onClick={() => setMore(!more)}>
          {more ? '− Less' : '+ More'}
        </button>
        {more && <ToggleRow k="C" label="Curl up more dimensions" status="conjectured" note="IIA on K3 matches heterotic on a four-torus." />}
      </div>
      <Slider
        label="PULL BACK"
        value={pull}
        min={0}
        max={1}
        step={0.01}
        onChange={setPull}
        format={(v) => (v < 0.02 ? 'overview' : `${Math.round(v * 100)}%`)}
        describe="Raises the camera and makes the sea translucent"
      />
      {pull > 0.25 && pieces > 1 && <p className="mth-hint">Connect every island to see what lies beneath.</p>}
      <Inspector />
      <p className="mth-caveat mth-caveat--map">
        <Status kind="analogy" compact /> A 2D cartoon of a many-dimensional space of possible backgrounds.
      </p>
    </>
  )
}

/* ───────────────────────── DIAL station ───────────────────────── */

const DIAL_BRIDGE: Record<Theory, string> = { I: 's-i-ho', HO: 's-i-ho', IIB: 's-iib', IIA: 'l-iia', HE: 'l-he' }

function DialReadouts({ theory, g }: { theory: Theory; g: number }) {
  const strong = theory === 'IIA' || theory === 'HE' ? ratio11(g) > 1 : g > 1
  if (theory === 'IIA') {
    return (
      <>
        <div className="mth-readouts">
          <Readout label={<>R₁₁ / ℓ₁₁ = g<sup>2/3</sup></>} value={ratio11(g).toFixed(2)} tone={strong ? 'filament' : 'field'} />
          <Readout label="RUNGS BELOW STRING SCALE" value={String(rungsBelow(g))} />
          <Readout label="WRAP CHECK" value={<>2πR₁₁·T<sub>M2</sub> = T<sub>F1</sub> ✓</>} tone="field" />
        </div>
        <p className="mth-msg">
          {strong
            ? 'The circle outgrows the 11D Planck length. Space now has ten directions; with time, eleven.'
            : 'The eleventh circle is smaller than the 11D Planck length. The ten-dimensional string picture works better.'}
        </p>
        <p className="mth-note">
          Spacing 1/(g ℓs): Chapter 5’s rule for a circle of radius g ℓs.{' '}
          <span className="mth-tip" title="Bound states: proven for n = 2, strongly supported for all n.">
            ⓘ bound states
          </span>
        </p>
      </>
    )
  }
  if (theory === 'HE') {
    return (
      <>
        <div className="mth-readouts">
          <Readout label={<>INTERVAL / ℓ₁₁ = g<sup>2/3</sup></>} value={ratio11(g).toFixed(2)} tone={strong ? 'filament' : 'field'} />
        </div>
        <p className="mth-msg">Two walls, one E8 on each. Far from both: plain eleven dimensions.</p>
      </>
    )
  }
  if (theory === 'I') {
    return (
      <>
        <div className="mth-readouts">
          <Readout label="F-STRING T = 1/2π (REFERENCE)" value={fmtT(T_F1)} unit="1/ℓs²" />
          <Readout label="D-STRING T = 1/2πg" value={fmtT(T_D1(g))} unit="1/ℓs²" tone="field" />
        </div>
        <p className="mth-msg">{strong ? 'Relabel: this is heterotic SO(32), weakly coupled at 1/g.' : 'The D-string’s tension falls as 1/g. Past g = 1 it is the lightest string.'}</p>
      </>
    )
  }
  if (theory === 'HO') {
    return (
      <>
        <div className="mth-readouts">
          <Readout label="HETEROTIC STRING T = 1/2π" value={fmtT(T_F1)} unit="1/ℓs²" />
          <div className="mth-estimate">
            <Readout label="TYPE I STRING ≈ 1/2πg · ESTIMATE" value={fmtT(T_D1(g))} unit="1/ℓs²" />
          </div>
        </div>
        <p className="mth-msg">{strong ? <>Now: Type I at g = 1/g<sub>H</sub>. Its D-string is the heterotic string.</> : 'The Type I string is not protected: it can break. Its tension is dashed.'}</p>
      </>
    )
  }
  return (
    <>
      <div className="mth-readouts">
        <Readout label="F-STRING (1,0)" value={fmtT(T_pq(1, 0, g))} unit="1/ℓs²" />
        <Readout label="D-STRING (0,1)" value={fmtT(T_pq(0, 1, g))} unit="1/ℓs²" tone="field" />
      </div>
      <p className="mth-msg">Past g = 1 the D-string is lighter. Swap the names: IIB again, at 1/g.</p>
    </>
  )
}

function DialStation() {
  const theory = useM((s) => s.theory)
  const setTheory = useM((s) => s.setTheory)
  const u = useM((s) => s.u)
  const setU = useM((s) => s.setU)
  const pq = useM((s) => s.pq)
  const setPq = useM((s) => s.setPq)
  const T = useM((s) => s.T)
  const S = useM((s) => s.S)
  const L = useM((s) => s.L)
  const C = useM((s) => s.C)
  const g = gFromU(u)
  const strong = theory === 'IIA' || theory === 'HE' ? ratio11(g) > 1 : g > 1
  const on = { T, S, L, C }
  return (
    <>
      <p className="mth-lead">Turn the coupling. Watch what was heavy become light.</p>
      <Segmented
        label="THEORY"
        value={theory}
        options={THEORIES.map((t) => ({ value: t, label: t === 'HE' ? 'HE' : t === 'HO' ? 'HO' : t, hint: TIPS[TIP_INDEX[t]].name }))}
        onChange={setTheory}
      />
      <Slider
        label="COUPLING g"
        value={g}
        min={0.05}
        max={20}
        log
        onChange={(v) => setU(uFromG(v))}
        format={(v) => `g = ${fmtG(v)}`}
        ticks={[{ value: 0.1, label: '0.1' }, { value: 1, label: '1' }, { value: 10, label: '10' }]}
        describe="Log scale from 0.05 to 20; g = 1 is the handover point"
      />
      {theory === 'IIB' && <Toggle label="Show (p,q)-strings" checked={pq} onChange={setPq} describe="Coprime pairs drawn at (p, q/g); distance is proportional to tension" />}
      <DialReadouts theory={theory} g={g} />
      <div className="mth-mini-map">
        <MapSvg compact className="mth-minimap" highlight={TIP_INDEX[theory]} pulseBridge={strong ? DIAL_BRIDGE[theory] : undefined} active={(b) => on[b.kind] || b.id === DIAL_BRIDGE[theory]} />
        <p className="mth-note">
          <span className="mth-tip" title="Why trust this offshore? Supersymmetry fixes these tensions exactly: BPS objects.">
            ⓘ Why trust this offshore?
          </span>{' '}
          Supersymmetry fixes these tensions exactly: BPS objects.
        </p>
      </div>
      <p className="mth-caveat">
        <Status kind="analogy" compact /> Not to scale. The string length ℓs itself is unknown.
      </p>
    </>
  )
}

/* ───────────────────────── Go deeper ───────────────────────── */

function Deeper() {
  const u = useM((s) => s.u)
  const theory = useM((s) => s.theory)
  const station = useM((s) => s.station)
  const g = gFromU(u)
  const iia = station === 'dial' && theory === 'IIA'
  const big = ratio11(g) > 1
  const hl = { r: iia && big ? 1 : 0.15, l: iia && !big ? 1 : 0.15, m: iia && rungsBelow(g) > 0 ? 1 : 0.15, w: iia ? 0.9 : 0.15 }
  return (
    <GoDeeper title="The dictionary between Type IIA and eleven dimensions">
      <p>Units are ħ = c = 1, in one common convention; textbooks differ by factors of 2π. The highlighted terms follow the DIAL (Type IIA).</p>
      <Eq display tex={String.raw`\htmlClass{term-r}{R_{11} = g_s\,\ell_s}, \qquad \htmlClass{term-l}{\ell_{11} = g_s^{1/3}\,\ell_s}`} highlight={hl} label="R eleven equals g s times l s; l eleven equals g s to the one third times l s" />
      <ul>
        <li>
          <Eq tex="g_s" /> is the IIA string coupling (the Lab’s dial).
        </li>
        <li>
          <Eq tex={String.raw`\ell_s`} /> is the string length, <Eq tex={String.raw`\sqrt{\alpha'}`} />.
        </li>
        <li>
          <Eq tex="R_{11}" /> is the radius of the eleventh-dimensional circle (the tube).
        </li>
        <li>
          <Eq tex={String.raw`\ell_{11}`} /> is the eleven-dimensional Planck length: the scale where eleven-dimensional gravity becomes strongly quantum. It is not a proven smallest length.
        </li>
      </ul>
      <p>
        Their ratio, <Eq tex={String.raw`R_{11}/\ell_{11} = g_s^{2/3}`} />, is the whole story. At weak coupling the circle is far smaller than ℓ₁₁. No eleven-dimensional description is useful there, and the ten-dimensional string picture takes over. At strong
        coupling the circle is large, and space gains a tenth direction.
      </p>
      <p>The evidence is a ladder. n D-particles bind into a single state (proven for n = 2, strongly supported beyond) of mass</p>
      <Eq display tex={String.raw`\htmlClass{term-m}{M_n = \frac{n}{g_s\,\ell_s}} = \frac{n}{R_{11}}`} highlight={hl} label="M n equals n over g s l s, which equals n over R eleven" />
      <ul>
        <li>
          <Eq tex="n" /> is the number of D-particles, which is also the number of wavelengths around the circle.
        </li>
        <li>
          <Eq tex="M_n" /> is the rung’s mass. Supersymmetry protects it, so it holds at any coupling.
        </li>
      </ul>
      <p>That is Chapter 5’s Kaluza–Klein tower for a circle of radius R₁₁. The string fits too:</p>
      <Eq display tex={String.raw`\htmlClass{term-w}{T_{\mathrm{F1}} = 2\pi R_{11}\,T_{\mathrm{M2}}}, \qquad T_{\mathrm{M2}} = \frac{1}{(2\pi)^2\,\ell_{11}^{3}}`} highlight={hl} label="T F1 equals 2 pi R eleven T M2; T M2 equals one over 2 pi squared l eleven cubed" />
      <ul>
        <li>
          <Eq tex={String.raw`T_{\mathrm{M2}}`} /> is the membrane’s tension (energy per area).
        </li>
        <li>
          <Eq tex={String.raw`2\pi R_{11}`} /> is the circle’s circumference.
        </li>
        <li>
          <Eq tex={String.raw`T_{\mathrm{F1}}`} /> is the string’s tension, <Eq tex={String.raw`1/(2\pi\ell_s^2)`} />.
        </li>
      </ul>
      <p>
        Substitute the first line and every <Eq tex="g_s" /> cancels. A membrane wrapped once around the circle has exactly the IIA string’s tension, at any coupling. Heterotic E8×E8 follows the same scaling, with an interval in place of the
        circle (Hořava–Witten).
      </p>
      <h3>Where the map comes from</h3>
      <p>
        Polchinski’s 1996 colloquium drew the same star and warned it “is actually an oversimplification”: over most of the space the coupling is of order 1, and “the cusps are limits in which a weakly coupled string description is
        possible (except for the M-theory limit).” That is why the 11D tip here reads “sizes ≫ ℓ₁₁”, not “g → 0”.
      </p>
      <h3>Who found what</h3>
      <ul>
        <li>T-dualities: 1986–89. An early S-duality conjecture: Font–Ibáñez–Lüst–Quevedo, 1990; Sen, 1994.</li>
        <li>The IIA string as a wrapped membrane: Duff–Howe–Inami–Stelle, 1987. Hull–Townsend, 1994; Townsend, January 1995.</li>
        <li>Witten’s March 1995 paper tied the web together; Polchinski’s D-branes (October 1995); Hořava–Witten, 1995–96.</li>
        <li>Matrix theory: Banks, Fischler, Shenker, Susskind, 1996, for special backgrounds.</li>
      </ul>
      <p className="mth-deeper-status">
        <Status kind="conjectured" compact /> None of this has been tested by experiment.
      </p>
    </GoDeeper>
  )
}

/* ───────────────────────── The Lab ───────────────────────── */

export function LabPanel() {
  const station = useM((s) => s.station)
  const setStation = useM((s) => s.setStation)
  return (
    <Lab
      title="The Duality Atlas"
      status={['conjectured', 'analogy']}
      hint={
        station === 'map' ? (
          <>
            Toggle the dualities<span className="mth-hide-m"> · hover the map · drag to turn it</span>
            <span className="mth-show-m"> · tap the map</span>
          </>
        ) : (
          <span className="mth-hint-dial">Turn the coupling · drag to turn the view</span>
        )
      }
      length={LEN.lab}
      footer={<Deeper />}
    >
      <div className="mth-station">
        <Segmented
          label="STATION"
          value={station}
          options={[
            { value: 'map', label: 'Map' },
            { value: 'dial', label: 'Dial' },
          ]}
          onChange={setStation}
        />
      </div>
      {station === 'map' ? <MapStation /> : <DialStation />}
    </Lab>
  )
}
