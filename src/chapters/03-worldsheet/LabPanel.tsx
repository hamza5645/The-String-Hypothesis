import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Button, GoDeeper, Lab, Readout, Segmented, Slider, Toggle } from '@/ui'
import { DeeperContent } from './DeeperContent'
import { STEP_LEN } from './layout'
import { signed, sliceY, T_VERTEX } from './model'
import { sliceNow } from './nowSlice'
import { THETA_MAX, T0_MAX, T0_MIN, useWorldsheet, type History, type ViewPreset } from './store'

const DEG = Math.PI / 180
const PLAY_SECONDS = 8
const SWEEP_SECONDS = 6
const SWEEP_CYCLES = 12
/** Inset: baseline (CSS px from the top) for the y label, just below the caption's first line (styles.css). */
const CAPTION_CLEAR = 29

/* ───────────────────────── inset: this observer's movie (top-down x–y view of the slice) ───────────────────────── */

/**
 * Drawn imperatively, with no React render: a store subscription queues one redraw (a microtask, so several
 * changes in one task draw once, in the same frame) whenever the slicing changes; ▶ play moves "now" every
 * frame. The size comes from a ResizeObserver, so drawing never reads layout, and the slice is shared with
 * the Scene (sliceNow): whichever draws first computes it, so it is computed once per frame.
 */
function Inset() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = canvas.current
    const g = cv?.getContext('2d')
    if (!cv || !g) return
    const yOut = new Float64Array(4)
    let size = 0 // CSS px of the drawing area (the CSS decides it: smaller on phones)
    let queued = false
    let alive = true
    const draw = () => {
      queued = false
      if (!alive || !size) return
      const { t0, thetaDeg, phiDeg, history, split } = useWorldsheet.getState()
      const INSET = size
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (cv.width !== Math.round(INSET * dpr)) {
        cv.width = Math.round(INSET * dpr)
        cv.height = Math.round(INSET * dpr)
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, INSET, INSET)
      const S = INSET / 8.6 // px per ℓ; x ∈ [−4.3, 4.3]
      const X = (x: number) => INSET / 2 + x * S
      const Y = (y: number) => INSET / 2 - y * S
      // grid (1 ℓ) + axes
      g.lineWidth = 1
      g.strokeStyle = 'rgba(134,168,216,0.10)'
      for (let i = -4; i <= 4; i++) {
        g.beginPath()
        g.moveTo(X(i) + 0.5, 0)
        g.lineTo(X(i) + 0.5, INSET)
        g.stroke()
      }
      for (let j = -4; j <= 4; j++) {
        g.beginPath()
        g.moveTo(0, Y(j) + 0.5)
        g.lineTo(INSET, Y(j) + 0.5)
        g.stroke()
      }
      // the y axis and its label start below the caption's first line (the plate label overlays the top)
      const yTop = Math.max(Y(3.6), CAPTION_CLEAR - 7)
      g.strokeStyle = 'rgba(134,168,216,0.32)'
      g.beginPath()
      g.moveTo(X(-4.2), Y(0) + 0.5)
      g.lineTo(X(4.2), Y(0) + 0.5)
      g.moveTo(X(0) + 0.5, Y(-3.6))
      g.lineTo(X(0) + 0.5, yTop)
      g.stroke()
      g.fillStyle = 'rgba(134,168,216,0.6)'
      g.font = '9px "IBM Plex Mono", monospace'
      g.fillText('x', X(4.05), Y(0) - 4)
      g.fillText('y', X(0) + 4, Math.max(Y(3.3), CAPTION_CLEAR))
      const th = thetaDeg * DEG
      const ph = phiDeg * DEG
      // strings: the analytic slice of the pants on this "now"
      if (history !== 'particles') {
        const r = sliceNow(t0, th, ph)
        g.strokeStyle = '#FFC98A'
        g.shadowColor = 'rgba(255,201,138,0.8)'
        g.shadowBlur = 6
        g.lineWidth = 1.4
        for (let c = 0; c < r.n; c++) {
          const s0 = r.start[c]
          const n = r.count[c]
          g.beginPath()
          for (let i = 0; i < n; i++) {
            const x = r.pts[(s0 + i) * 3]
            const y = r.pts[(s0 + i) * 3 + 1]
            if (i === 0) g.moveTo(X(x), Y(y))
            else g.lineTo(X(x), Y(y))
          }
          if (r.closed[c]) g.closePath()
          g.stroke()
        }
        g.shadowBlur = 0
        // this slicing's split point
        g.strokeStyle = 'rgba(134,168,216,0.9)'
        g.lineWidth = 1
        g.beginPath()
        g.arc(X(split.x), Y(split.y), 4, 0, Math.PI * 2)
        g.stroke()
      }
      // particles: dots (drawn along the x axis, their direction of motion)
      if (history !== 'strings') {
        const n = sliceY(t0, th, ph, yOut)
        g.fillStyle = '#ECE6D9'
        g.shadowColor = 'rgba(236,230,217,0.9)'
        g.shadowBlur = 6
        const yy = history === 'both' ? -2.7 : 0
        for (let i = 0; i < n; i++) {
          g.beginPath()
          g.arc(X(yOut[i * 2]), Y(yy), 2.2, 0, Math.PI * 2)
          g.fill()
        }
        g.shadowBlur = 0
      }
    }
    const schedule = () => {
      if (queued) return
      queued = true
      queueMicrotask(draw)
    }
    const unsub = useWorldsheet.subscribe((s, p) => {
      if (s.t0 !== p.t0 || s.thetaDeg !== p.thetaDeg || s.phiDeg !== p.phiDeg || s.history !== p.history || s.split !== p.split) schedule()
    })
    const ro =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
            const w = Math.round(entries[entries.length - 1].contentRect.width)
            if (w !== size) {
              size = w
              schedule()
            }
          })
    if (ro) ro.observe(cv)
    else {
      size = cv.clientWidth
      schedule()
    }
    return () => {
      alive = false
      unsub()
      ro?.disconnect()
    }
  }, [])
  return <canvas ref={canvas} className="ws-inset__canvas" aria-hidden="true" />
}

/** What this "now" sees and where it saw the split: re-renders only when the text changes. */
function Readouts() {
  const sees = useWorldsheet((s) => {
    const pinching = Math.abs(s.t0 - s.split.t0) < 0.03
    const loops = pinching ? 'PINCHING' : s.t0 < s.split.t0 ? '1 LOOP' : '2 LOOPS'
    const parts = s.t0 < T_VERTEX ? '1 PARTICLE' : '2 PARTICLES'
    return s.history === 'strings' ? loops : s.history === 'particles' ? parts : `${loops} · ${parts}`
  })
  const splitText = useWorldsheet((s) =>
    s.history === 'particles' ? `x 0.00 · y 0.00 · ct ${T_VERTEX.toFixed(2)}` : `x ${signed(s.split.x)} · y ${signed(s.split.y)} · ct ${s.split.t.toFixed(2)}`,
  )
  return (
    <div className="ws-lab-read">
      <Readout label="This “now” sees" value={sees} tone="filament" />
      <Readout label="Split seen at" value={splitText} tone="field" />
    </div>
  )
}

/** "Now" slider + ▶ play. The only part of the panel that re-renders on every tick of play. */
function NowControl() {
  const t0 = useWorldsheet((s) => s.t0)
  const playing = useWorldsheet((s) => s.playing)
  const { setT0, setPlaying } = useWorldsheet.getState()

  // ▶ play: sweep "now" 1 → 9 in 8 s, looping until paused
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const st = useWorldsheet.getState()
      let v = st.t0 + ((T0_MAX - T0_MIN) / PLAY_SECONDS) * dt
      if (v > T0_MAX) v = T0_MIN
      st.setT0(v)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return (
    <div className="ws-lab-row">
      <div className="ws-lab-grow">
        <Slider
          label={
            <>
              Now · <span className="ws-nc">t₀</span>
            </>
          }
          value={t0}
          min={T0_MIN}
          max={T0_MAX}
          step={0.05}
          onChange={(x) => {
            if (playing) setPlaying(false)
            setT0(x)
          }}
          format={(x) => `ct ${x.toFixed(2)} ℓ`}
          describe="Where this observer's present cuts through the whole history."
        />
      </div>
      <button type="button" className={`ws-play${playing ? ' is-on' : ''}`} aria-pressed={playing} aria-label={playing ? 'Pause the sweep of now' : 'Play: sweep now upward'} onClick={() => setPlaying(!playing)}>
        {playing ? (
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path d="M2 1.5h2v7H2zM6 1.5h2v7H6z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path d="M2.5 1.2l6 3.8-6 3.8z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  )
}

/**
 * Screen-reader live region: announces the loop count and the split point once the slicing has rested for
 * 350 ms. Driven by a store subscription, so play's per-frame "now" never re-renders it.
 */
function LiveRegion() {
  const [live, setLive] = useState('')
  useEffect(() => {
    const L = { loops: '', split: '' }
    let id = 0
    const announce = () => {
      const { t0, split, history, thetaDeg } = useWorldsheet.getState()
      const l = t0 < split.t0 ? 'This “now” sees one loop.' : 'This “now” sees two loops.'
      const sp = `Split point moved to x ${split.x.toFixed(2)}, y ${split.y.toFixed(2)}.`
      if (history !== 'particles' && l !== L.loops) {
        L.loops = l
        setLive(l)
      } else if (history !== 'particles' && sp !== L.split && thetaDeg > 0) {
        L.split = sp
        setLive(sp)
      }
    }
    const later = () => {
      window.clearTimeout(id)
      id = window.setTimeout(announce, 350)
    }
    later()
    const unsub = useWorldsheet.subscribe((s, p) => {
      if (s.t0 !== p.t0 || s.split !== p.split || s.history !== p.history || s.thetaDeg !== p.thetaDeg) later()
    })
    return () => {
      unsub()
      window.clearTimeout(id)
    }
  }, [])
  return (
    <div className="sr-only" aria-live="polite">
      {live}
    </div>
  )
}

/* ───────────────────────── direction dial (φ from +x toward +y) ───────────────────────── */

function Dial({ value, onChange }: { value: number; onChange: (deg: number) => void }) {
  const ref = useRef<SVGSVGElement>(null)
  const drag = useRef(false)
  const setFrom = (e: PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = -(e.clientY - (r.top + r.height / 2))
    onChange(Math.round(((Math.atan2(dy, dx) / DEG + 360) % 360) / 1) * 1)
  }
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 5
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(value + step)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(value - step)
    else if (e.key === 'Home') onChange(0)
    else return
    e.preventDefault()
  }
  const a = value * DEG
  const R = 21
  return (
    <svg
      ref={ref}
      className="ws-dial"
      viewBox="-29 -29 58 58"
      width={52}
      height={52}
      role="slider"
      tabIndex={0}
      aria-label="Direction of motion φ"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)} degrees from x toward y`}
      aria-description="Which way this observer moves."
      onKeyDown={onKey}
      onPointerDown={(e) => {
        drag.current = true
        ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
        setFrom(e)
      }}
      onPointerMove={(e) => drag.current && setFrom(e)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
      data-ui
    >
      <circle r={R} className="ws-dial__ring" />
      {Array.from({ length: 24 }, (_, i) => {
        const t = (i / 24) * Math.PI * 2
        const l = i % 6 === 0 ? 5 : 2.5
        return <line key={i} x1={Math.cos(t) * R} y1={-Math.sin(t) * R} x2={Math.cos(t) * (R - l)} y2={-Math.sin(t) * (R - l)} className="ws-dial__tick" />
      })}
      <text x={R + 2} y={3} className="ws-dial__lbl">
        x
      </text>
      <text x={-3} y={-R - 2} className="ws-dial__lbl">
        y
      </text>
      <line x1={0} y1={0} x2={Math.cos(a) * (R - 3)} y2={-Math.sin(a) * (R - 3)} className="ws-dial__needle" />
      <circle cx={Math.cos(a) * (R - 3)} cy={-Math.sin(a) * (R - 3)} r={2.6} className="ws-dial__knob" />
      <circle r={1.6} className="ws-dial__hub" />
    </svg>
  )
}

/* ───────────────────────── the lab ───────────────────────── */

export function LabPanel() {
  const history = useWorldsheet((s) => s.history)
  const thetaDeg = useWorldsheet((s) => s.thetaDeg)
  const phiDeg = useWorldsheet((s) => s.phiDeg)
  const marks = useWorldsheet((s) => s.marks)
  const sweeping = useWorldsheet((s) => s.sweeping)
  const swept = useWorldsheet((s) => s.swept)
  const view = useWorldsheet((s) => s.view)
  const { setHistory, setTheta, setPhi, setMarks, clearMarks, setSweeping, setView } = useWorldsheet.getState()

  // try every direction: φ through a full turn in 6 s with quick mini-sweeps of "now" around each split
  useEffect(() => {
    if (!sweeping) return
    let raf = 0
    const start = performance.now()
    const phi0 = useWorldsheet.getState().phiDeg
    const loop = (now: number) => {
      const u = Math.min(1, (now - start) / 1000 / SWEEP_SECONDS)
      const st = useWorldsheet.getState()
      st.sweepTo(phi0 + 360 * u, -0.4 * Math.cos(2 * Math.PI * SWEEP_CYCLES * u) * (1 - u * u * u * u))
      if (u < 1) raf = requestAnimationFrame(loop)
      else useWorldsheet.setState({ sweeping: false, swept: true })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [sweeping])

  const th = thetaDeg * DEG
  const v = Math.tan(th)
  const atLimit = thetaDeg >= THETA_MAX - 0.05

  let caption: string[]
  if (atLimit) caption = ['Tilts stop below 45°: no observer outruns light.']
  else if (swept && history !== 'particles') caption = ['No single point. Different tilts put the split anywhere in this patch.']
  else if (history === 'particles') caption = ['Every tilt agrees: the particles split at one event, the vertex.']
  else if (history === 'strings') caption = ['Each tilt finds a different split point. The surface itself never changes.']
  else caption = ['Each tilt finds a different split point. The surface itself never changes.', 'Every tilt agrees: the particles split at one event, the vertex.']

  return (
    <Lab
      title="The Now-Slicer"
      status={['analogy', 'derived']}
      hint="Drag to rotate · slide “now” · tilt it"
      length={STEP_LEN.lab}
      intro={<p>Slide “now” upward to watch one loop become two. Then tilt “now” and find the split again.</p>}
      footer={
        <>
          <GoDeeper id="deeper" title="Why area, and where do interactions come from?">
            <DeeperContent />
          </GoDeeper>
          <p className="ws-lab-analogy">Time drawn like space, as in string calculations. One dimension hidden; not to scale.</p>
        </>
      }
    >
      <div className="ws-lab-top">
        <figure className="ws-inset" aria-label="This observer's movie: the slice seen from above">
          <figcaption className="t-label">This observer’s movie</figcaption>
          <Inset />
        </figure>
        <Readouts />
      </div>

      <div className="ws-quiet-label">
      <Segmented<History>
        label="History"
        value={history}
        options={[
          { value: 'particles', label: 'Particles' },
          { value: 'strings', label: 'Strings' },
          { value: 'both', label: 'Both' },
        ]}
        onChange={setHistory}
      />
      </div>

      <NowControl />

      <div>
        <Slider
          label={
            <>
              Tilt · <span className="ws-nc">θ</span>
            </>
          }
          value={thetaDeg}
          min={0}
          max={THETA_MAX}
          step={0.5}
          onChange={setTheta}
          format={(x) => `${x.toFixed(1)}° · v/c = tan θ = ${Math.tan(x * DEG).toFixed(2)}`}
          describe="Motion tilts an observer's 'now'. In a spacetime diagram, the slope is v/c."
        />
        <p className="ws-lab-hint t-mono">like an observer moving at {v.toFixed(2)}c</p>
      </div>

      <div className="ws-lab-dir">
        <Dial value={phiDeg} onChange={setPhi} />
        <div className="ws-lab-dir__txt">
          <span className="t-label">Direction</span>
          <span className="ws-lab-dir__val t-mono">φ = {Math.round(phiDeg)}°</span>
          <span className="ws-lab-dir__hint">Which way this observer moves.</span>
        </div>
        <Button onClick={() => setSweeping(!sweeping)} pressed={sweeping} title="Set a 30° tilt and turn φ through every direction, sweeping “now” around each split">
          {sweeping ? 'Stop' : 'Try every direction'}
        </Button>
      </div>

      <div className="ws-lab-marks">
        <Toggle label="Mark splits" checked={marks} onChange={setMarks} describe="Leave a dot at each split point you witness." />
        <button type="button" className="ws-clear" onClick={clearMarks}>
          Clear
        </button>
        <div className="ws-lab-view">
          <Segmented<ViewPreset>
            label="View"
            value={view}
            options={[
              { value: 'q', label: '3/4' },
              { value: 'side', label: 'Side' },
              { value: 'top', label: 'Top' },
            ]}
            onChange={setView}
            sound={false}
          />
        </div>
      </div>

      <div className="ws-lab-caption">
        {caption.map((c) => (
          <p key={c} className={atLimit ? 'is-limit' : undefined}>
            {c}
          </p>
        ))}
      </div>
      <LiveRegion />
    </Lab>
  )
}
