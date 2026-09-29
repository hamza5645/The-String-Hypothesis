import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, Filament, GlowPoint, openStringFn, useChapterFrame, useHandoffFit, type FilamentApi, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { claimPointer, explore, setStageCursor } from '@/core/explore'
import { pluck } from '@/core/audio'
import { clamp, damp, easeInOutCubic, smoothstep } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { useSettings } from '@/core/settings'
import { useKnowledge } from '../store'
import { el, type LabelLayer, type Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * Epilogue (content pack § Epilogue).
 *  E1 — the map has shrunk to one ink point (H0 again): "every claim above is one point of light".
 *  E2 — four instruments' arrows slide in and stop short of the point (screen-space diagram).
 *  E3 — the point unfolds into the Thread (ink → warm as it is resolved) and can be plucked once more,
 *       with the prologue's model (Model §10): y(σ,t) = Σₙ aₙ(t)·cos(nπσ), n = 1..8, free ends,
 *       aₙ(0) = 2∫ y₀ cos(nπσ) dσ, y₀ = h·exp(−(σ−σ₀)²/(2·0.06²)), aₙ(t) = aₙ(0)·cos(2πn f₁ t)·e^(−γₙ t),
 *       f₁ = 0.9 Hz, γₙ = 0.6 + 0.15n (damping fictional). After decay it blends (1.2 s) into H1's motion.
 *  rest — the Thread holds at H1 exactly (<HandoffOpenString/>'s geometry, props and phase).
 */

const N = HANDOFF.H1.count
const MODES = 8
const F1 = 0.9
const SIG = 0.06

const cosTable = (() => {
  const t = new Float32Array((MODES + 1) * N)
  for (let n = 0; n <= MODES; n++) for (let i = 0; i < N; i++) t[n * N + i] = Math.cos(n * Math.PI * (i / (N - 1)))
  return t
})()

const SVGNS = 'http://www.w3.org/2000/svg'
const svg = (tag: string, attrs: Record<string, string | number> = {}, parent?: Element) => {
  const e = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  if (parent) parent.appendChild(e)
  return e
}

const ARROWS = [
  { id: 'gw', dir: [0, -1], label: 'GRAVITATIONAL-WAVE DETECTORS', lines: ['GRAVITATIONAL-WAVE', 'DETECTORS'], glyph: 'gw' },
  { id: 'cmb', dir: [1, 0], label: 'THE EARLY UNIVERSE’S LIGHT', lines: ['THE EARLY', 'UNIVERSE’S LIGHT'], glyph: 'cmb' },
  { id: 'lhc', dir: [0, 1], label: 'COLLIDERS · 13.6 TeV', lines: ['COLLIDERS', '13.6 TeV'], glyph: 'ring' },
  { id: 'tab', dir: [-1, 0], label: 'TABLETOP PRECISION', lines: ['TABLETOP', 'PRECISION'], glyph: 'balance' },
] as const

export function Epilogue({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const camera = useThree((s) => s.camera)
  const fit = useHandoffFit()
  const point = useRef<GlowPointApi>(null)
  const thread = useRef<FilamentApi>(null)
  const hit = useRef<THREE.Mesh>(null!)
  const points = useMemo(() => new Float32Array(N * 3), [])
  const h1 = useMemo(() => openStringFn(HANDOFF.H1.amplitude * fit, HANDOFF.H1.length * fit), [fit])
  const base = useMemo(() => new THREE.Vector3(), [])
  const warm = useMemo(() => new THREE.Color(COLORS.filament), [])
  const warmCore = useMemo(() => new THREE.Color(COLORS.filamentCore), [])
  const ink = useMemo(() => new THREE.Color(COLORS.ink), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const hitPt = useMemo(() => new THREE.Vector3(), [])
  const v = useMemo(() => new THREE.Vector3(), [])

  const st = useMemo(
    () => ({
      amp: new Float64Array(MODES + 1),
      tPluck: -1e3,
      f1: F1,
      drag: false,
      sigma0: 0.3,
      h: 0,
      L: HANDOFF.H1.length as number,
      nudge: new Float32Array(N),
      lastReq: useKnowledge.getState().pluckSeq,
      interactive: false,
      t: 0,
      grace: -1e3,
      cursor: false,
    }),
    [],
  )

  // ── screen-space diagram: E2 arrows, E3 grace ring + glyphs ──
  const dom = useMemo(() => {
    if (!layer) return null
    const root = svg('svg', { class: 'kn-svg', width: '100%', height: '100%' }) as SVGSVGElement
    root.style.position = 'absolute'
    root.style.inset = '0'
    root.style.opacity = '0'
    root.style.pointerEvents = 'none'
    layer.root.appendChild(root)
    const arrows = ARROWS.map((a) => {
      const g = svg('g', { opacity: 0 }, root)
      const line = svg('line', { stroke: '#86A8D8', 'stroke-width': 1, 'stroke-linecap': 'round' }, g)
      const head = svg('path', { fill: 'none', stroke: '#86A8D8', 'stroke-width': 1 }, g)
      const icon = svg('g', { stroke: '#86A8D8', 'stroke-width': 1, fill: 'none' }, g)
      if (a.glyph === 'ring') {
        svg('circle', { cx: 0, cy: 0, r: 9 }, icon)
        svg('circle', { cx: 0, cy: 0, r: 5.5, 'stroke-dasharray': '2 2' }, icon)
      } else if (a.glyph === 'gw') {
        svg('path', { d: 'M-9 7 L-9 -7 M-9 7 L7 7 M-12 -4 L-6 -4 M-4 10 L-4 4' }, icon)
      } else if (a.glyph === 'cmb') {
        svg('path', { d: 'M-10 0 Q-7 -6 -4 0 T2 0 T8 0 M-10 6 L10 6' }, icon)
      } else {
        svg('path', { d: 'M-9 6 L9 6 M0 6 L0 -6 M-8 -6 L8 -6 M-8 -6 L-10 -1 M8 -6 L10 -1' }, icon)
      }
      const text = svg('text', { fill: '#9AA0AE', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10.5, 'letter-spacing': 1.3 }, g)
      // two lines on phones, one on wider screens
      const t1 = svg('tspan', {}, text)
      const t2 = svg('tspan', {}, text)
      return { g, line, head, icon, text, t1, t2 }
    })
    // the collider gap: ~10¹⁵× in energy, if the string scale is near the Planck scale
    const gapG = svg('g', { opacity: 0 }, root)
    const gapLine = svg('line', { stroke: '#86A8D8', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, gapG)
    const gapT1 = svg('text', { fill: '#86A8D8', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10.5, 'letter-spacing': 1.2 }, gapG)
    gapT1.textContent = '~10¹⁵× IN ENERGY'
    const gapT2 = svg('text', { fill: '#5C6270', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 9.5, 'letter-spacing': 1.1 }, gapG)
    const g1 = svg('tspan', {}, gapT2)
    const g2 = svg('tspan', {}, gapT2)
    // grace note: one faint ring, and the four marks blinking below the Thread
    const ring = svg('circle', { fill: 'none', stroke: '#86A8D8', 'stroke-width': 1, opacity: 0 }, root)
    const glyphs = [0, 1, 2, 3].map((k) => {
      const g = svg('g', { opacity: 0 }, root)
      const color = ['#ECE6D9', '#86A8D8', '#A99BD6', '#7D8190'][k]
      if (k === 0) svg('circle', { r: 4.5, fill: color }, g)
      if (k === 1) {
        svg('circle', { r: 4.5, fill: 'none', stroke: color, 'stroke-width': 1 }, g)
        svg('path', { d: 'M0 -4.5 A4.5 4.5 0 0 1 0 4.5 Z', fill: color }, g)
      }
      if (k === 2) svg('circle', { r: 4.5, fill: 'none', stroke: color, 'stroke-width': 1, 'stroke-dasharray': '2 1.6' }, g)
      if (k === 3) svg('circle', { r: 4.5, fill: 'none', stroke: color, 'stroke-width': 1 }, g)
      return g
    })
    const e1 = layer.add(el('span', 'kn-tag kn-tag--e1', [el('span', 'kn-tag__chip', '≈ ANALOGY'), el('span', '', 'FROM HERE, EVERY CLAIM ABOVE IS ONE POINT OF LIGHT')]), [0, 0, 0], {
      screen: true,
      safe: false,
      clamp: false,
      align: 'center',
      cls: 'kn-lbl--hud',
    })
    const caption = layer.add(el('span', 'kn-closing', 'Still waiting for nature’s answer.'), [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'center', cls: 'kn-lbl--hud' })
    const hint = layer.add({ text: 'DRAG AND RELEASE TO PLUCK' }, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'center', cls: 'kn-lbl--dim' })
    return { root, arrows, gapG, gapLine, gapT1, gapT2, g1, g2, ring, glyphs, e1, caption, hint }
  }, [layer])
  useLayoutEffect(() => () => dom?.root.remove(), [dom])

  // The pluck beat scrolls up through the Thread's captions: until the beat has all but faded out, a
  // caption fades by how much of its line box the beat's block covers (so one of the two is always legible).
  const beat = useMemo(() => ({ step: null as HTMLElement | null, box: null as Element | null, on: 0, x0: 0, y0: 0, x1: 0, y1: 0 }), [])
  const measureBeat = () => {
    beat.on = 0
    const p = S.sp.pluck
    if (p <= 0 || p >= 1) return
    if (!beat.step) {
      beat.step = document.querySelector<HTMLElement>('#knowledge .step[data-step="pluck"]')
      beat.box = beat.step?.querySelector('.step__content') ?? null
    }
    if (!beat.step || !beat.box) return
    const r = beat.box.getBoundingClientRect()
    if (r.height <= 0) return
    const sv = beat.step.style.getPropertyValue('--sv')
    beat.on = smoothstep(0.02, 0.15, sv ? parseFloat(sv) : 1)
    beat.x0 = r.left
    beat.y0 = r.top
    beat.x1 = r.right
    beat.y1 = r.bottom
  }
  /** 1 − (covered fraction of a centred label's line box) × the beat's legibility */
  const clearOfBeat = (l: Lbl, wFallback: number, hFallback: number) => {
    if (beat.on <= 0) return 1
    const w = l.w || wFallback
    const h = l.h || hFallback
    if (beat.x1 <= l.x - w / 2 || beat.x0 >= l.x + w / 2) return 1
    const pad = 24
    const cover = clamp((Math.min(l.y + h / 2, beat.y1 + pad) - Math.max(l.y - h / 2, beat.y0 - pad)) / h)
    return 1 - cover * beat.on
  }

  // release → project the released shape onto the free-end modes and ring
  const release = (t: number) => {
    if (!st.drag) return
    st.drag = false
    if (st.cursor) setStageCursor('grab')
    let h = st.h
    if (Math.abs(h) < 0.01 * st.L) h = 0.07 * st.L
    const s2 = 2 * SIG * SIG
    for (let n = 0; n <= MODES; n++) {
      let acc = 0
      for (let i = 0; i < N; i++) {
        const sg = i / (N - 1)
        const y0 = h * Math.exp(-((sg - st.sigma0) ** 2) / s2) + ringing(i, t)
        acc += y0 * cosTable[n * N + i]
      }
      acc /= N
      st.amp[n] = n === 0 ? acc : 2 * acc
    }
    st.tPluck = t
    st.f1 = prefersReducedMotion() ? 0.3 : F1
    let max = 1e-6
    for (let n = 1; n <= MODES; n++) max = Math.max(max, Math.abs(st.amp[n]))
    pluck(
      110,
      Array.from({ length: MODES }, (_, k) => ({ n: k + 1, amp: Math.abs(st.amp[k + 1]) / max })),
      { decay: 3.2, gain: 0.7 },
    )
    if (useSettings.getState().quality !== 'low') st.grace = t
  }
  const ringing = (i: number, t: number) => {
    const dt = t - st.tPluck
    if (dt < 0 || dt > 14) return 0
    let y = st.amp[0] * Math.exp(-3 * dt)
    if (prefersReducedMotion()) return y + st.amp[1] * Math.cos(2 * Math.PI * st.f1 * dt) * Math.exp(-0.75 * dt) * cosTable[N + i]
    for (let n = 1; n <= MODES; n++) y += st.amp[n] * Math.cos(2 * Math.PI * n * st.f1 * dt) * Math.exp(-(0.6 + 0.15 * n) * dt) * cosTable[n * N + i]
    return y
  }

  useEffect(() => {
    const up = () => release(st.t)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (st.cursor) setStageCursor('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useChapterFrame(
    (f) => {
      const t = f.t
      st.t = t
      const dt = f.dt
      const amb = ambient()
      // ── the H0 point (E1 → E3) ──
      const pi = S.point
      if (point.current) {
        point.current.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * pi
        point.current.visible = pi > 0.001
      }
      // ── E3 Thread ──
      const un = S.unfold
      const inE3 = un > 0.001
      const th = thread.current
      if (th) th.group.visible = inE3
      st.L = HANDOFF.H1.length * fit
      if (inE3 && th) {
        // keyboard / button pluck
        const req = useKnowledge.getState().pluckSeq
        if (req !== st.lastReq) {
          st.lastReq = req
          if (S.pluckable) {
            st.drag = true
            st.sigma0 = 0.3
            st.h = 0.08 * st.L
            release(t)
          }
        }
        st.interactive = S.pluckable && f.h.active()
        // pointer → z = 0 plane
        let pw: THREE.Vector3 | null = null
        if (st.interactive && (explore.hovering || st.drag)) {
          ndc.set(explore.nx, explore.ny)
          ray.setFromCamera(ndc, camera)
          pw = ray.ray.intersectPlane(plane, hitPt)
        }
        if (st.drag && pw) {
          st.h = clamp(pw.y, -0.12 * st.L, 0.12 * st.L)
          st.sigma0 = clamp(pw.x / st.L + 0.5, 0.02, 0.98)
        }
        const k = easeInOutCubic(un)
        const ampK = smoothstep(0.55, 1, un)
        const sinceP = t - st.tPluck
        const wBase = sinceP < 0 || sinceP > 14 ? 1 : clamp(1 - smoothstep(0, 0.25, sinceP) + smoothstep(3.0, 4.2, sinceP), 0, 1)
        const pxPerUnit = S.H / (2 * HANDOFF.camera.position[2] * Math.tan(((HANDOFF.camera.fov * Math.PI) / 180) / 2))
        for (let i = 0; i < N; i++) {
          const u = i / (N - 1)
          // H1's canonical motion (the same function <HandoffOpenString/> evaluates), unfolding from the point
          h1(u, t, base, i)
          base.x *= k
          let y = base.y * ampK * wBase * amb
          let z = base.z * ampK * wBase * amb
          y += ringing(i, t) * ampK
          if (st.drag) y += st.h * Math.exp(-((u - st.sigma0) ** 2) / (2 * SIG * SIG))
          // hover nudge: within 48 px the pointer pushes the Thread away (≤ 6 px), springing back
          let target = 0
          if (pw && !st.drag) {
            const x = base.x
            const dxp = (x - pw.x) * pxPerUnit
            const dyp = (y - pw.y) * pxPerUnit
            if (Math.abs(dyp) < 48 && Math.abs(dxp) < 140) {
              const fall = (1 - Math.abs(dyp) / 48) * Math.exp(-(dxp * dxp) / (2 * 38 * 38))
              target = (Math.sign(dyp) || 1) * (6 / pxPerUnit) * fall
            }
          }
          st.nudge[i] = dt > 0 ? damp(st.nudge[i], target, target !== 0 ? 16 : 7, dt) : target
          y += st.nudge[i]
          if (amb === 0) z = 0
          points[i * 3] = base.x
          points[i * 3 + 1] = y
          points[i * 3 + 2] = z
        }
        th.update()
        const warmK = smoothstep(0.25, 0.8, un)
        const u2 = th.material.uniforms
        u2.uGlow.value.copy(ink).lerp(warm, warmK)
        u2.uCore.value.copy(ink).lerp(warmCore, warmK)
        u2.uOpacity.value = smoothstep(0.0, 0.12, un)
      }
      // pluck hit band
      if (hit.current) {
        hit.current.visible = st.interactive
        hit.current.scale.set(st.L, Math.max(0.6, 90 / Math.max(1, S.H / 6.3)), 1)
      }

      // ── screen diagram ──
      if (!dom) return
      v.set(0, 0, 0).project(camera)
      const px = (v.x * 0.5 + 0.5) * S.W
      const py = (0.5 - v.y * 0.5) * S.H
      const ar = S.arrows
      const showSvg = Math.max(ar, t - st.grace < 2.4 ? 1 : 0) * f.presence
      dom.root.style.opacity = showSvg > 0.001 ? '1' : '0'
      for (let i = 0; i < ARROWS.length; i++) {
        const a = ARROWS[i]
        const A = dom.arrows[i]
        const gap = S.mobile ? 34 : 44
        // reach as far as the free space allows: never into the text column, the rail or off-screen
        const reach =
          a.dir[0] > 0
            ? Math.min(0.3 * S.vw, S.vw - px - (S.mobile ? 58 : 130))
            : a.dir[0] < 0
              ? Math.min(0.3 * S.W, px - (S.mobile ? 40 : 0.45 * S.W))
              : a.dir[1] < 0
                ? Math.min(0.34 * S.H, py - (S.mobile ? 150 : 120))
                : S.mobile
                  ? 0.075 * S.H
                  : Math.min(0.34 * S.H, S.H - py - 90)
        const stagger = clamp(ar * 1.3 - i * 0.1)
        const e = easeInOutCubic(stagger)
        const tail = gap + reach * (1.35 - 0.35 * e)
        const tip = gap + reach * 0.9 * (1 - e)
        const dx = a.dir[0]
        const dy = a.dir[1]
        const x1 = px + dx * tail
        const y1 = py + dy * tail
        const x2 = px + dx * tip
        const y2 = py + dy * tip
        A.g.setAttribute('opacity', (stagger * 0.95).toFixed(3))
        A.line.setAttribute('x1', x1.toFixed(1))
        A.line.setAttribute('y1', y1.toFixed(1))
        A.line.setAttribute('x2', x2.toFixed(1))
        A.line.setAttribute('y2', y2.toFixed(1))
        // arrowhead pointing at the point
        const hx = -dx
        const hy = -dy
        const nx = -hy
        const ny = hx
        A.head.setAttribute('d', `M${(x2 - hx * 7 + nx * 4).toFixed(1)} ${(y2 - hy * 7 + ny * 4).toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${(x2 - hx * 7 - nx * 4).toFixed(1)} ${(y2 - hy * 7 - ny * 4).toFixed(1)}`)
        A.icon.setAttribute('transform', `translate(${(x1 + dx * 16).toFixed(1)} ${(y1 + dy * 16).toFixed(1)})`)
        // label beside the tail, on the point's side of the instrument glyph (two lines on phones)
        const l1 = S.mobile ? a.lines[0] : a.label
        const l2 = S.mobile ? a.lines[1] : ''
        if (A.t1.textContent !== l1) A.t1.textContent = l1
        if (A.t2.textContent !== l2) A.t2.textContent = l2
        let tx: number
        let ty: number
        if (dx !== 0) {
          tx = x1 - dx * 4
          ty = y1 - 14 - (l2 ? 13 : 0)
          A.text.setAttribute('text-anchor', dx > 0 ? 'end' : 'start')
        } else {
          tx = x1 + 18
          ty = y1 + dy * 22 + 4 - (dy < 0 && l2 ? 13 : 0)
          A.text.setAttribute('text-anchor', 'start')
        }
        A.t1.setAttribute('x', tx.toFixed(1))
        A.t1.setAttribute('y', ty.toFixed(1))
        A.t2.setAttribute('x', tx.toFixed(1))
        A.t2.setAttribute('y', (ty + 13).toFixed(1))
        if (a.id === 'lhc') {
          dom.gapLine.setAttribute('x1', (px + 16).toFixed(1))
          dom.gapLine.setAttribute('y1', (py + 10).toFixed(1))
          dom.gapLine.setAttribute('x2', (px + 16).toFixed(1))
          dom.gapLine.setAttribute('y2', y2.toFixed(1))
          const my = (py + y2) / 2
          const g1 = S.mobile ? 'IF THE STRING SCALE IS' : 'IF THE STRING SCALE IS NEAR THE PLANCK SCALE'
          const g2 = S.mobile ? 'NEAR THE PLANCK SCALE' : ''
          if (dom.g1.textContent !== g1) dom.g1.textContent = g1
          if (dom.g2.textContent !== g2) dom.g2.textContent = g2
          dom.gapT1.setAttribute('x', (px + 26).toFixed(1))
          dom.gapT1.setAttribute('y', (my + 2 - (g2 ? 6 : 0)).toFixed(1))
          dom.g1.setAttribute('x', (px + 26).toFixed(1))
          dom.g1.setAttribute('y', (my + 16 - (g2 ? 6 : 0)).toFixed(1))
          dom.g2.setAttribute('x', (px + 26).toFixed(1))
          dom.g2.setAttribute('y', (my + 28).toFixed(1))
          dom.gapG.setAttribute('opacity', (smoothstep(0.75, 1, stagger) * 0.95).toFixed(3))
        }
      }
      // grace note
      const gt = t - st.grace
      if (gt >= 0 && gt < 2.4) {
        const R = gt / 2.2 * Math.hypot(S.W, S.H) * 0.7
        dom.ring.setAttribute('cx', px.toFixed(1))
        dom.ring.setAttribute('cy', py.toFixed(1))
        dom.ring.setAttribute('r', R.toFixed(1))
        dom.ring.setAttribute('opacity', (0.5 * (1 - gt / 2.4)).toFixed(3))
        for (let k = 0; k < 4; k++) {
          const gx = px + (k - 1.5) * 26
          const gy = py + 56
          const d = Math.hypot(gx - px, gy - py)
          const blink = Math.exp(-(((R - d) / 40) ** 2)) * 0.9
          dom.glyphs[k].setAttribute('transform', `translate(${gx.toFixed(1)} ${gy.toFixed(1)})`)
          dom.glyphs[k].setAttribute('opacity', blink.toFixed(3))
        }
      } else {
        dom.ring.setAttribute('opacity', '0')
        for (const g of dom.glyphs) g.setAttribute('opacity', '0')
      }
      // captions
      dom.e1.x = px
      dom.e1.y = py + 46
      dom.e1.target = S.e1
      const ringingOn = t - st.tPluck < 3.4
      const cap = (S.sp.pluck > 0.5 ? smoothstep(0.5, 0.62, S.sp.pluck) : 0) * (ringingOn ? 0 : 1)
      measureBeat()
      dom.caption.x = px
      dom.caption.y = py + (S.mobile ? 58 : 74)
      dom.caption.target = Math.max(cap, S.rest > 0 ? 1 : 0) * clearOfBeat(dom.caption, 0.5 * S.vw, 32)
      dom.hint.x = px
      dom.hint.y = py - (S.mobile ? 60 : 78)
      dom.hint.target =
        smoothstep(0.36, 0.44, S.sp.pluck) * (1 - smoothstep(0.85, 0.98, S.sp.pluck)) * (S.rest > 0 ? 0 : 1) * (t - st.tPluck < 14 ? 0 : 1) * clearOfBeat(dom.hint, 220, 16)
    },
    { priority: -1.4 },
  )

  return (
    <>
      <GlowPoint ref={point} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <Filament ref={thread} points={points} count={N} width={HANDOFF.H1.width} beads />
      <mesh
        ref={hit}
        visible={false}
        onPointerDown={(e) => {
          if (!st.interactive) return
          e.stopPropagation()
          claimPointer()
          st.drag = true
          st.h = 0
          st.sigma0 = clamp(e.point.x / st.L + 0.5, 0.02, 0.98)
          setStageCursor('grabbing')
          st.cursor = true
        }}
        onPointerOver={() => {
          if (st.interactive && !st.drag) {
            setStageCursor('grab')
            st.cursor = true
          }
        }}
        onPointerOut={() => {
          if (!st.drag && st.cursor) {
            setStageCursor('')
            st.cursor = false
          }
        }}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </>
  )
}

export type { Lbl }
