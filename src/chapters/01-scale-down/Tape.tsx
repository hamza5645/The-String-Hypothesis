import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useChapter } from '@/core/chapter'
import { smoothstep } from '@/core/math'
import { LANDMARKS, STRING_MARK, START, decadeLabel, evalZoom, si, type ZoomState } from './model'
import { useLab } from './store'

/*
 * The chapter's zoom instrument: a moving logarithmic tape (like an altimeter) that reads the field
 * of view L live, with SI prefixes down to quecto (10⁻³⁰ m) and scientific notation below. Decade
 * ticks, log-spaced minor ticks, landmarks, the visible-light band, the EDGE OF DIRECT MEASUREMENT
 * band; ticks turn dashed past the edge, and the string landmark is a hollow ring (SPECULATIVE).
 * It complements the site's left gauge. Desktop: top centre; phones: a strip under the top bar.
 */

const E_HI = 1
const E_LO = -37
const PX = 66 // px per decade (CSS var-driven on phones)
/** Landmarks whose labels sit on the second row (their neighbours' labels would overlap). */
const ROW1 = new Set(['PROTON', 'ℓ_P', 'ATOM'])

/** "r_rms" → r<sub>rms</sub>; subscripts keep their case inside upper-cased labels. */
function fmt(t: string) {
  const parts = t.split(/_([A-Za-z]+)/)
  return parts.map((p, i) => (i % 2 ? <sub key={i} className="sd-unit">{p}</sub> : p))
}

export function Tape() {
  const h = useChapter()
  const root = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const read = useRef<HTMLSpanElement>(null)
  const zs = useMemo(() => ({}) as ZoomState, [])

  useEffect(() => {
    let raf = 0
    let lastTxt = ''
    let lastOp = -1
    let lastFlags = ''
    let px = PX
    const measure = () => {
      if (root.current) px = parseFloat(getComputedStyle(root.current).getPropertyValue('--px')) || PX
    }
    measure()
    window.addEventListener('resize', measure)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = root.current
      if (!el) return
      const pres = h.presence()
      if (pres <= 0) {
        if (lastOp !== 0) {
          el.style.opacity = '0'
          el.style.visibility = 'hidden'
          lastOp = 0
        }
        return
      }
      const aspect = window.innerWidth / Math.max(1, window.innerHeight)
      evalZoom(h, aspect, zs)
      const op = pres * smoothstep(1.02, 1.5, zs.z)
      if (Math.abs(op - lastOp) > 0.003) {
        el.style.opacity = op.toFixed(3)
        el.style.visibility = op < 0.01 ? 'hidden' : 'visible'
        lastOp = op
      }
      if (op < 0.01) return
      const x = (E_HI - zs.s) * px
      strip.current!.style.transform = `translate3d(${(-x).toFixed(2)}px,0,0)`
      // in the lab (desktop) the instrument slides left, clear of the docked panel
      const dx = aspect > 0.8 ? -zs.labW * Math.min(0.2 * window.innerWidth, Math.max(0, 0.5 * window.innerWidth - 420)) : 0
      el.style.setProperty('--dx', `${dx.toFixed(1)}px`)
      const txt = si(zs.s)
      if (txt !== lastTxt && read.current) {
        read.current.textContent = txt
        lastTxt = txt
      }
      const lab = useLab.getState()
      const revealed = zs.z > START.reveal + 0.1 || (zs.labW > 0.5 && lab.mode === 'string')
      const flags = `${revealed ? 's' : ''}${zs.s < -30 ? 'q' : ''}${zs.s < -19 ? 'd' : ''}`
      if (flags !== lastFlags) {
        el.dataset.revealed = revealed ? '1' : '0'
        el.dataset.sci = zs.s < -30 ? '1' : '0'
        el.dataset.dashed = zs.s < -18.5 ? '1' : '0'
        lastFlags = flags
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [h, zs])

  const ticks = useMemo(() => {
    const out: { e: number; major: boolean; label?: string; si?: boolean }[] = []
    for (let e = E_HI; e >= E_LO; e--) {
      out.push({ e, major: true, label: decadeLabel(e), si: e % 3 === 0 && e >= -30 })
      if (e > E_LO) for (let m = 2; m <= 9; m++) out.push({ e: e - 1 + Math.log10(m), major: false })
    }
    return out
  }, [])

  const X = (e: number) => `calc(var(--px) * ${(E_HI - e).toFixed(4)})`
  const band = (hi: number, lo: number) => ({ left: X(hi), width: `calc(var(--px) * ${(hi - lo).toFixed(4)})` })

  return createPortal(
    <div ref={root} className="sd-tape" aria-hidden="true" style={{ opacity: 0, visibility: 'hidden' }} data-ui>
      <div className="sd-tape__head">
        <span className="sd-tape__label">Field of view</span>
        <span ref={read} className="sd-tape__read">2.5 m</span>
      </div>
      <div className="sd-tape__win">
        <div ref={strip} className="sd-tape__strip">
          <span className="sd-tape__band sd-tape__band--light" style={band(Math.log10(750e-9), Math.log10(380e-9))}>
            <span>
              Visible light 380–750 <span className="sd-unit">nm</span>
            </span>
          </span>
          <span className="sd-tape__band sd-tape__band--edge" style={band(-18, -20)}>
            <span>Edge of direct measurement</span>
          </span>
          {ticks.map((t, i) => (
            <span
              key={i}
              className={`sd-tick${t.major ? ' is-major' : ''}${t.e < -18.5 ? ' is-dashed' : ''}${t.si ? ' is-si' : ''}`}
              style={{ left: X(t.e) }}
            >
              {t.label && <span className="sd-tick__label">{t.label}</span>}
            </span>
          ))}
          {LANDMARKS.map((m) => (
            <span key={m.label} className={`sd-mark sd-mark--${m.kind}${ROW1.has(m.label) ? ' sd-mark--row1' : ''}`} style={{ left: X(m.e) }}>
              <i />
              <span>
                {fmt(m.label)}
                {m.note && <em> · {fmt(m.note)}</em>}
              </span>
            </span>
          ))}
          <span className="sd-mark sd-mark--hollow sd-mark--string" style={{ left: X(STRING_MARK.e) }}>
            <i />
            <span>
              {STRING_MARK.label}
              <em> · {STRING_MARK.note}</em>
            </span>
          </span>
        </div>
        <span className="sd-tape__index" />
      </div>
      <div className="sd-tape__foot">Past 10⁻³⁰ m, even the SI prefixes run out.</div>
    </div>,
    document.body,
  )
}
