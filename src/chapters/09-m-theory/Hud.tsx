import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useChapterFrame } from '@/gl'
import { lerp, smoothstep, window01 } from '@/core/math'
import { Status } from '@/ui'
import { PINNED, S } from './director'
import { fmtG } from './model'

/**
 * Screen-space annotations for the chapter (DOM, in the #scene-labels layer, never interactive):
 * the pieces counter, the pinned ~ANALOGY line, the M-theory title and its three candidate words,
 * the "no experiment yet" footer, and a scale note where the left gauge would be.
 */
const HIST = [6, 5, 4, 3, 2, 1]
const ZERO = [0, 0]
const origin = () => ZERO

export function Hud() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const portal = useMemo(() => ({ current: document.getElementById('scene-labels')! }), [])
  const count = useRef<HTMLDivElement>(null)
  const countNum = useRef<HTMLSpanElement>(null)
  const countHist = useRef<HTMLSpanElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const pinText = useRef<HTMLSpanElement>(null)
  const m = useRef<HTMLDivElement>(null)
  const words = useRef<(HTMLSpanElement | null)[]>([])
  const attrib = useRef<HTMLSpanElement>(null)
  const footer = useRef<HTMLDivElement>(null)
  const scale = useRef<HTMLDivElement>(null)
  const scaleText = useRef<HTMLSpanElement>(null)
  const inset = useRef<HTMLDivElement>(null)
  const insetG = useRef<HTMLSpanElement>(null)
  const big = useRef<HTMLDivElement>(null)
  const v = useMemo(() => new THREE.Vector3(), [])
  const last = useRef({ n: -1, hist: -1, pin: -2, scale: '', g: '', swap: -1 })

  const anchor = useRef<THREE.Group>(null)
  useChapterFrame((f) => {
    // keep the (screen-fixed) HUD's anchor in front of the camera so drei never hides it as "behind"
    if (anchor.current) {
      camera.getWorldDirection(v)
      anchor.current.position.copy(camera.position).addScaledVector(v, 1)
    }
    const pr = f.presence
    const L = last.current
    // pieces counter (story)
    if (count.current) {
      count.current.style.opacity = (S.counter * pr).toFixed(3)
      if (S.pieces !== L.n && countNum.current) {
        countNum.current.textContent = String(S.pieces)
        L.n = S.pieces
      }
      if (S.histN !== L.hist && countHist.current) {
        countHist.current.textContent = HIST.slice(0, S.histN).join(' → ')
        L.hist = S.histN
      }
    }
    // pinned analogy line
    if (pin.current) {
      pin.current.style.opacity = (S.pinOp * pr).toFixed(3)
      if (S.pin !== L.pin && S.pin >= 0 && pinText.current) {
        pinText.current.textContent = PINNED[S.pin]
        L.pin = S.pin
      }
    }
    // M-theory: a title over the top of the landmass (never on it): its top edge sits in the band above the
    // 11D cusp, centred on the landmass; in Beat 6 it shrinks so the three candidate words fit beneath it
    if (m.current) {
      const op = S.mLabel * S.mapFade * pr
      m.current.style.opacity = op.toFixed(3)
      if (op > 0.002) {
        v.set(0, 0.6, 0).project(camera)
        const x = ((v.x + 1) / 2) * size.width
        const top = S.portrait ? size.height * lerp(lerp(0.122, 0.105, S.mTop), 0.105, S.labW) : Math.max(58, size.height * lerp(0.075, 0.065, S.mTop))
        const sc = lerp(1, 0.62, S.mTop) * (1 - 0.22 * S.labW)
        m.current.style.transform = `translate3d(${x.toFixed(1)}px, ${top.toFixed(1)}px, 0) translate(-50%, 0) scale(${sc.toFixed(3)})`
      }
    }
    // IIB is its own S-dual: an inset above the pieces counter (screen space, clear of the map and rail)
    if (inset.current) {
      const op = S.iib.vis * S.mapFade * pr
      inset.current.style.opacity = op.toFixed(3)
      if (op > 0.002) {
        const g = S.iib.g
        const txt = `g = ${fmtG(g)} · 1/g = ${fmtG(1 / g)}`
        if (txt !== L.g && insetG.current) {
          insetG.current.textContent = txt
          L.g = txt
        }
        inset.current.style.setProperty('--swap', smoothstep(0.85, 1.18, g).toFixed(3))
      }
    }
    // the aha's big caption: projected from the thread rig, clamped below the chapter pill / header
    if (big.current) {
      const op = S.thread.big * pr
      big.current.style.opacity = op.toFixed(3)
      if (op > 0.002) {
        const f = S.thread.frame
        const lx = 0.2
        const ly = 3.1
        v.set(f.x + f.s * lx * Math.cos(f.yaw), f.y + f.s * ly, f.z - f.s * lx * Math.sin(f.yaw)).project(camera)
        const x = ((v.x + 1) / 2) * size.width
        // phones: the "AROUND: / THE ELEVENTH DIMENSION" label under it wraps to two lines, so sit one line higher
        const y = Math.max(S.portrait ? 104 : 96, ((1 - v.y) / 2) * size.height - (S.portrait ? 34 : 0))
        big.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      }
    }
    const w = S.words
    const all = smoothstep(0.7, 0.78, w)
    for (let i = 0; i < 3; i++) {
      const el = words.current[i]
      const a = 0.22 + 0.16 * i
      if (el) el.style.opacity = Math.max(window01(w, a, a + 0.2, 0.05) * (1 - all), all).toFixed(3)
    }
    if (attrib.current) attrib.current.style.opacity = smoothstep(0.76, 0.84, w).toFixed(3)
    if (footer.current) footer.current.style.opacity = (S.footer * pr).toFixed(3)
    // scale note (desktop, where the scale gauge would sit)
    if (scale.current) {
      const aha = S.scaleNoteAha
      scale.current.style.opacity = (Math.max(S.scaleNote * S.mapFade * (1 - aha), aha) * pr * 0.9).toFixed(3)
      const txt = aha > 0.5 ? 'R₁₁ = g·ℓs · ℓs ITSELF UNKNOWN' : '— · A MAP OF THEORIES, NOT OF SPACE'
      if (txt !== L.scale && scaleText.current) {
        scaleText.current.textContent = txt
        L.scale = txt
      }
    }
  })

  return (
    <group ref={anchor}>
    <Html calculatePosition={origin} portal={portal} zIndexRange={[1, 0]} style={{ width: Math.min(size.width, document.documentElement.clientWidth || size.width), height: size.height, pointerEvents: 'none' }}>
    <div className="mth-hud" aria-hidden="true">
      <div ref={count} className="mth-count" style={{ opacity: 0 }}>
        <span className="mth-count__label">Separate pieces</span>
        <span ref={countNum} className="mth-count__num">
          6
        </span>
        <span ref={countHist} className="mth-count__hist">
          6
        </span>
      </div>
      <div ref={pin} className="mth-pin" style={{ opacity: 0 }}>
        <Status kind="analogy" compact />
        <span ref={pinText} className="mth-pin__text" />
      </div>
      <div ref={m} className="mth-m" style={{ opacity: 0 }}>
        <div className="mth-m__title">
          <span className="mth-m__word">M-theory</span>
          <Status kind="conjectured" compact />
        </div>
        <div className="mth-m__words">
          {['magic', 'mystery', 'membrane'].map((t, i) => (
            <span key={t} ref={(el) => void (words.current[i] = el)} className="mth-m__cand" style={{ opacity: 0 }}>
              {t}
            </span>
          ))}
        </div>
        <span ref={attrib} className="mth-m__attrib" style={{ opacity: 0 }}>
          Witten’s suggestion, as reported by Duff (1996): “according to taste”
        </span>
      </div>
      <div ref={footer} className="mth-footer" style={{ opacity: 0 }}>
        Experimental tests: none yet · see chapter 10
      </div>
      <div ref={inset} className="mth-inset" style={{ opacity: 0 }}>
        <span className="mth-inset__title">
          TYPE IIB AT g AND AT 1/g <Status kind="conjectured" compact />
        </span>
        <span className="mth-inset__row">
          <i className="mth-inset__line mth-inset__line--a" />
          F-STRING
        </span>
        <span className="mth-inset__row">
          <i className="mth-inset__line mth-inset__line--b" />
          D-STRING
        </span>
        <span ref={insetG} className="mth-inset__g">
          g = 0.30 · 1/g = 3.3
        </span>
      </div>
      <div ref={big} className="mth-bigcap" style={{ opacity: 0 }}>
        The coupling was a size.
      </div>
      <div ref={scale} className="mth-scale" style={{ opacity: 0 }}>
        <span className="mth-scale__title">Scale</span>
        <span ref={scaleText} className="mth-scale__text" />
      </div>
    </div>
    </Html>
    </group>
  )
}
