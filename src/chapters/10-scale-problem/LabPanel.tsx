/*
 * Lab · How big a machine? — controls, live readouts and warnings, all computed from the Model.
 */
import { Eq, GoDeeper, Segmented, Status, Toggle, Slider } from '@/ui'
import {
  DX_MIN,
  E_LHC,
  E_STAR,
  HBARC,
  MACHINES,
  comparison,
  energyOf,
  floorDx,
  fmtEnergy,
  fmtLength,
  fmtMeters,
  fmtTime,
  joules,
  machine,
  machineById,
  sci,
  synchrotron,
  type MachineId,
} from './model'
import { ProbeStrip } from './ProbeStrip'
import { useScaleLab } from './store'

const PRESETS: { id: string; label: string; E: number; copy: string }[] = [
  { id: 'lhc', label: 'LHC 13.6 TeV', E: 13_600, copy: 'The LHC reached 13.6 TeV: the most powerful collider yet built.' },
  { id: 'fcc', label: 'FCC-hh? 85 TeV', E: 85_000, copy: 'Proposed 90.7 km successor ring, 85 TeV. Not approved; possibly the 2070s.' },
  { id: 'low', label: 'Low string scale? ~8 TeV ○', E: 8_000, copy: 'If strings were this big, the LHC could excite them. Searches found none below ~7.9 TeV.' },
  { id: 'het', label: 'Heterotic string scale ~4 × 10¹⁷ GeV ◑', E: 4e17, copy: 'A traditional estimate: ~30 times below the Planck energy, in weakly coupled heterotic models.' },
  { id: 'planck', label: 'Planck 1.22 × 10¹⁹ GeV', E: 1.22089e19, copy: 'About 2,500 light-years around with LHC magnets. Light would need 2,500 years per lap.' },
  { id: 'beyond', label: 'Beyond 10²⁰ GeV', E: 1e20, copy: 'More energy past here is expected to make black holes, not sharper views.' },
]
const MACHINE_COPY: Record<MachineId, string> = {
  lhc: 'Stronger magnets shrink the ring only in proportion. The gap is a factor of 10¹⁵.',
  fcc: 'Stronger magnets shrink the ring only in proportion. The gap is a factor of 10¹⁵.',
  hts: 'Stronger magnets shrink the ring only in proportion. The gap is a factor of 10¹⁵.',
  linear: 'No bending arcs, so no ring synchrotron loss. But length still grows with energy.',
  plasma: 'No bending arcs, so no ring synchrotron loss. But length still grows with energy.',
}

/** Large d (≥ 10⁻¹⁶ m): no collider needed. One accurate line per band (content pack § What changes on screen). */
function instrument(d: number) {
  if (d >= 1e-7) return 'Light: eyes, microscopes, telescopes. No collider needed. Light resolves details this size.'
  if (d >= 1e-11) return 'X-rays and electron microscopes resolve details this size.'
  return 'Small accelerators resolve this. No giant collider needed.'
}

export function LabPanel() {
  const logD = useScaleLab((s) => s.logD)
  const mId = useScaleLab((s) => s.machine)
  const note = useScaleLab((s) => s.note)
  const auto = useScaleLab((s) => s.auto)
  const manualLogL = useScaleLab((s) => s.manualLogL)
  const { animateTo, setMachine, setAuto, setManualLogL } = useScaleLab.getState()

  const d = Math.pow(10, logD)
  const E = energyOf(d)
  const spec = machineById(mId)
  const m = machine(E, spec)
  const J = joules(E)
  const small = d > 1e-16
  const ring = spec.kind === 'ring'
  const sync = ring ? synchrotron(E, spec.B!) : null
  const dx = floorDx(E)
  const floorOn = E > 1e18
  const floorBites = dx > 1.1 * d

  let copy: string | null = null
  if (small) copy = instrument(d)
  else if (note?.startsWith('preset:')) copy = PRESETS.find((p) => 'preset:' + p.id === note)?.copy ?? null
  else if (note?.startsWith('machine:')) copy = mId === 'plasma' ? '50 GV/m has been shown over about a meter. Nobody knows how to sustain it for light-years.' : MACHINE_COPY[mId]

  return (
    <div className="sp-lab">
      <ProbeStrip />
      <div className="sp-presets" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`sp-chipbtn${note === 'preset:' + p.id ? ' is-on' : ''}`}
            onClick={() => animateTo(Math.log10(HBARC / p.E), 'preset:' + p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Segmented<MachineId>
        label={
          <>
            Machine · <span className="sp-nocase">{spec.label}</span>
          </>
        }
        value={mId}
        options={MACHINES.map((x) => ({ value: x.id, label: x.short, hint: x.label }))}
        onChange={setMachine}
      />
      {copy && (
        <p className="sp-lab__copy" aria-live="polite">
          {copy}
        </p>
      )}
      <dl className="sp-read-list" aria-live="polite">
        <Row k="PROBE d" v={fmtMeters(d)} />
        <Row k="ENERGY ≈ ħc/d" v={fmtEnergy(E)} hot />
        <Row k="VS LHC" v={`× ${E / E_LHC >= 0.1 && E / E_LHC < 1e4 ? (E / E_LHC).toPrecision(2) : sci(E / E_LHC, 2)}`} />
        <Row k="IN JOULES" v={`${sci(J.J, 2, true)} J${J.text ? ' ' + J.text : ''}`} />
        {!small && (
          <>
            <Row k="MACHINE" v={ring ? `${fmtLength(m.C)} around` : `${fmtLength(m.C)} long`} hot />
            {ring ? <Row k="ACROSS" v={fmtLength(m.D)} /> : <Row k="KIND" v="straight, two arms" />}
            <Row k="LIGHT NEEDS" v={ring ? `${fmtTime(m.t)} per lap` : `${fmtTime(m.t)} per arm`} />
            <Row k="COMPARE" v={comparison(m.D)} />
          </>
        )}
      </dl>
      {!small && (
        <ul className="sp-warn" aria-label="Warnings">
          {ring && sync && (
            <li className={sync.kind === 'fatal' ? 'is-bad' : ''}>
              <Status kind="observed" compact />
              <span>
                {sync.kind === 'fatal'
                  ? '✕ Protons this energetic would radiate away their energy long before one lap.'
                  : sync.kind === 'loss'
                    ? `Synchrotron: ${(sync.u * 100).toPrecision(2)}% of beam energy lost per lap; must be replaced every lap.`
                    : `Synchrotron loss negligible (${sci(sync.u, 1)} of beam energy per lap).`}
              </span>
            </li>
          )}
          {floorOn && (
            <li className={floorBites ? 'is-bad' : ''}>
              <Status kind="conjectured" compact />
              <span>
                {floorBites
                  ? `Black-hole floor: at this energy Δx ≈ ${sci(dx, 2, true)} m · best possible ≈ ${sci(DX_MIN, 2, true)} m.`
                  : 'Black-hole floor not yet reached. Heuristic: near the Planck energy, more energy makes a bigger black hole.'}
              </span>
            </li>
          )}
          {mId === 'plasma' && (
            <li>
              <Status kind="observed" compact />
              <span>50 GV/m demonstrated over ~1 m, not light-years.</span>
            </li>
          )}
          {ring ? (
            <li className="is-quiet">
              <span>Real proton collisions share energy among quarks and gluons. A real machine would be several times bigger.</span>
            </li>
          ) : (
            <li className="is-quiet">
              <span className="t-label">e⁺e⁻ linear collider</span>
            </li>
          )}
        </ul>
      )}
      <div className="sp-map-ctl">
        <Toggle label="Auto-frame the map" checked={auto} onChange={setAuto} describe="When on, the map zooms so the machine fills 60% of the view." />
        {!auto && (
          <Slider
            label="Map height"
            value={Math.pow(10, manualLogL)}
            min={1e3}
            max={1e22}
            log
            onChange={(v) => setManualLogL(Math.log10(v))}
            format={(v) => fmtLength(v)}
          />
        )}
      </div>
    </div>
  )
}

function Row({ k, v, hot }: { k: string; v: string; hot?: boolean }) {
  return (
    <div className={`sp-read-row${hot ? ' is-hot' : ''}`}>
      <dt className="sp-read-k">{k}</dt>
      <dd className="t-mono">{v}</dd>
    </div>
  )
}


/** Go deeper: three limits in three formulas, highlighted in step with the Lab. */
export function DeeperContent() {
  const logD = useScaleLab((s) => s.logD)
  const mId = useScaleLab((s) => s.machine)
  const E = energyOf(Math.pow(10, logD))
  const spec = machineById(mId)
  const ring = spec.kind === 'ring'
  const m = machine(E, spec)
  const hlRing = { rho: ring ? 1 : 0.2, eb: E > E_LHC * 1.5 ? 1 : 0.35, b: ring && spec.B !== 8.33 ? 1 : 0.35 }
  const hlFloor = { q: E < E_STAR ? 1 : 0.35, bh: E > E_STAR ? 1 : E > 1e17 ? 0.55 : 0.15 }
  return (
    <div className="prose">
      <h3>The ring</h3>
      <p>A magnetic field bends a proton into a circle of radius</p>
      <Eq display tex={String.raw`\htmlClass{term-rho}{\rho} = \frac{\htmlClass{term-eb}{E_{\text{beam}}}}{e\,c\,\htmlClass{term-b}{B}}`} highlight={hlRing} label="rho equals E beam over e c B" />
      <p>
        <strong>ρ</strong> is the <strong>bending radius</strong> (the ring on the map). <strong>E_beam</strong> is the <strong>beam energy</strong>, half the collision
        energy readout. <strong>B</strong> is the <strong>magnet strength</strong> (the machine selector). Doubling B halves the ring. Against a factor of 10¹⁵,
        magnet technology barely matters.
      </p>
      <p className="sp-live t-mono">
        {ring
          ? `Now: E_beam = ${fmtEnergy(E / 2)}, B = ${spec.B} T → ρ = ${fmtLength(m.rho * 0.6606)} of bending, ${fmtLength(m.C)} around.`
          : `Now: a straight machine (${spec.label}); no bending radius. Length = ${fmtLength(m.C)}.`}
      </p>
      <h3>The floor</h3>
      <p>To probe a region of size Δx, you must pack energy E into it. Two sizes compete:</p>
      <Eq display tex={String.raw`\Delta x \gtrsim \htmlClass{term-q}{\frac{\hbar c}{E}} + \htmlClass{term-bh}{\frac{2GE}{c^{4}}}`} highlight={hlFloor} label="delta x is at least h-bar c over E plus 2 G E over c to the fourth" />
      <p>
        The first term is the <strong>quantum blur</strong>: it shrinks as energy grows (the falling curve). The second is the <strong>black-hole radius</strong> of that
        energy: it grows (the rising curve). Their sum bottoms out at a few Planck lengths. This is a heuristic, not a theorem. High-energy string scattering shows
        the same shape with the string length in place of the Planck length: hit a string harder and it spreads.
      </p>
      <p className="sp-live t-mono">
        Now: E = {fmtEnergy(E)} → ħc/E = {sci(HBARC / E, 2, true)} m, 2GE/c⁴ = {sci(2.6477e-54 * E, 2, true)} m.
      </p>
      <h3>The string scale</h3>
      <p>In string theory, gravity’s measured strength fixes a combination of the string scale and the hidden dimensions (with ħ = c = 1 and numerical factors dropped):</p>
      <Eq display tex={String.raw`M_P^{2} \sim \frac{M_s^{8}\,V_6}{g_s^{2}}`} label="M P squared is of order M s to the eighth times V 6 over g s squared" />
      <ul>
        <li>
          <strong>M_P</strong> is the <strong>Planck mass</strong>, known from G.
        </li>
        <li>
          <strong>M_s = 1/ℓ_s</strong> is the <strong>string mass scale</strong> (the band on the ruler).
        </li>
        <li>
          <strong>V₆</strong> is the <strong>volume of the hidden dimensions</strong>.
        </li>
        <li>
          <strong>g_s</strong> is the <strong>string coupling</strong>.
        </li>
      </ul>
      <p>
        With weak coupling (g_s &lt; 1) and V₆ no smaller than ℓ_s⁶ (roughly: a smaller volume is equivalent, by T-duality, to a larger one), M_s comes out below
        M_P, so strings are longer than ℓ_P. A huge V₆ could drag M_s far lower: the speculative low-string-scale idea, unseen so far.
      </p>
    </div>
  )
}

export function LabDeeper() {
  return (
    <GoDeeper title="Three limits in three formulas">
      <DeeperContent />
    </GoDeeper>
  )
}
