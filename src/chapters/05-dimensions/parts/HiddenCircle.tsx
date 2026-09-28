import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, GlowPoint, useChapterFrame, type GlowPointApi } from '@/gl'
import { clamp, damp, easeInOutCubic, lerp, logLerp, range, smoothstep } from '@/core/math'
import { GAP_52, HBARC, LHC_EV, TI, formatEnergy, potentialRatio } from '../constants'
import { HairLines, C_FIELD, C_INK, C_INK2, C_INK3, sg, type HairLinesApi } from '../gl/HairLines'
import { Hud } from '../gl/Hud'
import { KK_EXTENT, KK_OMEGA, drawKK } from '../gl/kk'
import { RING_R, ahaR, fitF, fitK } from '../model'
import type { Label, LabelLayer } from '../gl/labels'
import { hpx, hx, hy, labStage, type Timeline } from '../timeline'
import { noteSpot } from './notes'

/*
 * Beat 4 · The wave must fit (the aha) and the Lab's FIT station (content pack).
 * Beat 4, by f = the fit step's progress:
 *  1 Dive (0–0.15)      the centre node's ring regrows to R = 1.4 (camera ≈ 8: ~55% of the height)
 *  2 Fit (0.15–0.55)    k scrubbed 0 → 3; echo laps at non-integer k; ladder rung n lights at y = n·s
 *  3 Zoom out (0.55–0.75) the ring shrinks to an ink point of light; axis → "MASS WE WOULD MEASURE"
 *  4 Aha (0.75–1)       an inset reopens the circle, R_vis 1.4 → 0.35; spacing s = s₀·(1.4/R_vis);
 *                       rungs slide up past the dashed LHC COLLISION ENERGY line; only n = 0 stays below
 * FIT: the same circle (not to scale) with k from the lab, a ladder n = 0…8 with E_n = n·ħc/R,
 * and in "Only gravity" mode the potential V/V_N = 1 + (8/3)/(e^{r/R} − 1), r = 1 µm…10 mm.
 */

/** Beat 4 layout (screen fractions / px) for desktop and portrait phones. */
export function fitLayout(tl: Timeline) {
  if (tl.portrait) {
    // ring on top (radius ≈ 20% of the width), ladder below-left with its labels to the right
    return { ringFx: 0.5, ringFy: 0.22, camD: 11.1 / Math.max(tl.aspect, 0.3), ladFx: 0.12, ladFy: 0.53, s0px: 24, insetFx: 0.8, insetFy: 0.14 }
  }
  return { ringFx: 0.53, ringFy: 0.49, camD: 9.6, ladFx: 0.755, ladFy: 0.8, s0px: 50, insetFx: 0.46, insetFy: 0.22 }
}

/** Outer extent of the circle's drawing, echo-lap coil included (gl/kk.ts). */
const COIL = KK_EXTENT

/**
 * Desktop FIT station: circle · ladder · (gravity plot) in one row across the free stage left of the
 * instrument panel, the slide rule (Bounds.tsx) below. Screen fractions, plus the circle radius in px.
 */
export function fitLabLayout(tl: Timeline) {
  const ls = labStage(tl)
  const W = tl.W
  const gw = Math.min(ls.wpx, 780)
  const x0 = ls.l * W + (ls.wpx - gw) / 2
  const R = clamp((gw - 416) / (2 * COIL), 64, Math.min(106, 0.12 * tl.H))
  const lx = x0 + 2 * COIL * R + 36
  return { x0: x0 / W, x1: (x0 + gw) / W, cx: (x0 + COIL * R + 4) / W, R, lx: lx / W, px0: (lx + 190) / W, px1: (x0 + gw) / W }
}

export function HiddenCircle({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const world = useRef<THREE.Group>(null!)
  const wl = useRef<HairLinesApi>(null)
  const hl = useRef<HairLinesApi>(null)
  const pt = useRef<GlowPointApi>(null)
  const st = useMemo(() => ({ wFit: 0, lit: 0 }), [])
  const L = useMemo(() => {
    const rung: Label[] = []
    for (let n = 0; n <= 8; n++) rung.push(labels.make({ tone: 'ink2', align: 'left', cls: 'dim-rung', text: '' }))
    return {
      rung,
      axis: labels.make({ tone: 'dim', align: 'left', cls: 'dim-rung__axis', text: 'ENERGY AROUND THE CIRCLE' }),
      lhc: labels.make({ tone: 'ink2', align: 'right', cls: 'dim-rung__lhc', text: 'LHC COLLISION ENERGY · 13.6 TeV' }),
      lhcUp: labels.make({ tone: 'ink2', align: 'left', cls: 'dim-rung__lhc', text: 'LHC 13.6 TeV · FAR ABOVE ↑' }),
      k: labels.make({ tone: 'ink', align: 'below', cls: 'dim-kread', text: '' }),
      weigh: labels.make({ tone: 'ink2', align: 'below', cls: 'dim-weigh', text: 'We can’t see the circling. We can weigh it.' }),
      inset: labels.make({ tone: 'field', align: 'left', cls: 'dim-inset__l', text: 'R ↓' }),
      note: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: 'Not to scale. The rule “spacing ∝ 1/R” is exact for a circle.' }),
      fitNote: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note dim-note--top dim-note--narrow', chip: 'analogy', text: 'Circle not to scale. Numbers are.' }),
      charge: labels.make({ tone: 'dim', align: 'left', cls: 'dim-rung__q', text: 'In Kaluza–Klein theory, n also acts like an electric charge.' }),
      gx: labels.make({ tone: 'dim', align: 'below', cls: 'dim-plot__l', text: 'DISTANCE r · 1 µm → 10 mm' }),
      gy: labels.make({ tone: 'dim', align: 'left', cls: 'dim-plot__l dim-plot__lg', text: 'GRAVITY ÷ NEWTON (LOG, 1 → 100)' }),
      gband: labels.make({ tone: 'dim', align: 'right', cls: 'dim-plot__l dim-plot__tr', text: 'TESTED · r ≥ 52 µm' }),
      g1: labels.make({ tone: 'dim', align: 'right', cls: 'dim-plot__l', text: '1' }),
    }
  }, [labels])

  useChapterFrame((f) => {
    const W = wl.current
    const Hh = hl.current
    const P = pt.current
    if (!W || !Hh || !P) return
    const T = tl.T
    const upx = hpx(tl)
    W.begin()
    Hh.begin()
    const fitTarget = tl.inLab && tl.lab.station === 'fit' ? 1 : 0
    st.wFit = f.dt === 0 ? fitTarget : damp(st.wFit, fitTarget, 5, f.dt)
    const labW = st.wFit * smoothstep(TI.lab - 0.02, TI.lab + 0.08, T) * (1 - smoothstep(TI.exit - 0.02, TI.exit + 0.1, T))
    const beat = smoothstep(TI.fit - 0.01, TI.fit + 0.03, T) * (1 - smoothstep(TI.count - 0.05, TI.count + 0.06, T))
    const phase = tl.reduced ? 0 : KK_OMEGA * tl.t
    let pointI = 0
    // hide everything by default
    for (const l of L.rung) l.op(0)
    ;[L.axis, L.lhc, L.lhcUp, L.k, L.weigh, L.inset, L.note, L.fitNote, L.charge, L.gx, L.gy, L.gband, L.g1].forEach((l) => l.op(0))

    if (beat > 0.001 && labW < 0.5) {
      const fp = T >= TI.count ? 1 : fitF(T)
      const lay = fitLayout(tl)
      // ── phase 1–3: the ring in the world (camera faces it) ──
      const grow = logLerp(0.003 / RING_R, 1, easeInOutCubic(range(fp, 0.0, 0.13)))
      const shrink = logLerp(1, 0.004, easeInOutCubic(range(fp, 0.56, 0.72)))
      const sc = grow * shrink
      world.current.scale.setScalar(sc)
      const k = fitK(fp)
      const ringA = beat * smoothstep(0.03, 0.14, fp) * smoothstep(0.01, 0.05, sc)
      if (ringA > 0.001) {
        drawKK(W, { cx: 0, cy: 0, cz: 0, R: RING_R, k, phase, alpha: ringA, seg: 180 })
      }
      const dev = Math.abs(k - Math.round(k))
      const lock = 1 - Math.min(1, dev / 0.06)
      const lit = Math.round(k)
      // k readout under the ring
      const ringPxR = (RING_R * sc) / ((lay.camD * Math.tan((17.5 * Math.PI) / 180) * 2) / tl.H)
      const kTxt =
        k < 0.02 ? 'k = 0 · no motion around: the ordinary particle' : lock > 0.5 ? `k = ${lit} · fits: ${lit} whole wavelength${lit === 1 ? '' : 's'}` : `k = ${k.toFixed(2)} · doesn’t close on itself`
      L.k.text(kTxt).hud(hx(tl, lay.ringFx), hy(tl, lay.ringFy) - (ringPxR * COIL + 12) * upx).op(ringA * smoothstep(0.12, 0.17, fp) * (1 - smoothstep(0.55, 0.6, fp)))

      // point of light as the ring becomes unresolvable
      pointI = beat * smoothstep(0.05, 0.012, sc) * (0.85 + 0.12 * 3)
      L.weigh.hud(hx(tl, lay.ringFx), hy(tl, lay.ringFy) - 22 * upx).op(beat * smoothstep(0.66, 0.72, fp))

      // ── ladder (HUD) ──
      const ladA = beat * smoothstep(0.13, 0.2, fp)
      if (ladA > 0.001) {
        const lx = hx(tl, lay.ladFx)
        const y0 = hy(tl, lay.ladFy)
        const s0 = lay.s0px * upx
        const Rv = ahaR(fp)
        const s = s0 * (RING_R / Rv)
        const yTop = hy(tl, tl.portrait ? 0.12 : 0.13)
        const rw = 22 * upx
        sg(Hh, lx, y0 - 10 * upx, 0, lx, yTop, 0, C_FIELD, 0.55 * ladA, 1)
        const aha = smoothstep(0.76, 0.8, fp)
        for (let n = 0; n <= 8; n++) {
          const y = y0 + n * s
          const clip = smoothstep(yTop, yTop - 30 * upx, y)
          if (clip <= 0.001) {
            L.rung[n].op(0)
            continue
          }
          const isLit = fp < 0.78 && n === Math.min(3, lit) && fp > 0.15 ? lock * smoothstep(0.15, 0.2, fp) : 0
          const al = ladA * clip * (0.45 + 0.55 * isLit) * (n <= 3 || aha > 0 ? 1 : 0.55)
          const c = isLit > 0.2 ? C_INK : C_FIELD
          sg(Hh, lx, y, 0, lx + rw, y, 0, c, al, 1.2 + 1.2 * isLit)
          if (isLit > 0.01) sg(Hh, lx, y, 0, lx + rw, y, 0, C_INK, 0.12 * isLit * ladA, 9)
          if (n <= 3) {
            const txt = n === 0 ? 'n = 0 · the ordinary particle' : `n = ${n} · E = ${n === 1 ? '' : n}ħc/R`
            L.rung[n].text(txt).hud(lx + rw + 8 * upx, y).op(ladA * clip * (0.6 + 0.4 * isLit))
            L.rung[n].el.classList.toggle('dim-rung--r', false)
          }
        }
        // axis label (relabelled when we step back)
        L.axis.text(fp < 0.6 ? 'ENERGY AROUND THE CIRCLE' : 'MASS WE WOULD MEASURE').hud(lx - 4 * upx, yTop + 16 * upx).op(ladA * 0.9)
        // LHC line in the aha
        if (aha > 0.001) {
          const yL = y0 + 3.5 * s0
          if (tl.portrait) {
            // phones: the ladder hugs the left edge, so the label sits at the line's right end
            sg(Hh, lx - 12 * upx, yL, 0, hx(tl, 0.92), yL, 0, C_INK3, 0.95 * aha * beat, 1, 6)
            L.lhc.text('LHC · 13.6 TeV').hud(hx(tl, 0.9), yL).op(aha * beat)
          } else {
            sg(Hh, lx - 190 * upx, yL, 0, lx + rw + 40 * upx, yL, 0, C_INK3, 0.95 * aha * beat, 1, 6)
            L.lhc.text('LHC COLLISION ENERGY · 13.6 TeV').hud(lx - 10 * upx, yL).op(aha * beat)
          }
          // inset: the circle reopened, shrinking
          const ix = hx(tl, lay.insetFx)
          const iy = hy(tl, lay.insetFy)
          const isc = tl.portrait ? 0.24 : 0.36
          drawKK(Hh, { cx: ix, cy: iy, cz: 0, R: Rv * isc, k: 1, phase, alpha: aha * beat, seg: 96, w: 1.3, echo: 0 })
          // inset corner marks
          const b = RING_R * isc * 1.3
          for (const [sx, sy] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            sg(Hh, ix + sx * b, iy + sy * b, 0, ix + sx * (b - 10 * upx), iy + sy * b, 0, C_INK3, 0.9 * aha * beat, 1)
            sg(Hh, ix + sx * b, iy + sy * b, 0, ix + sx * b, iy + sy * (b - 10 * upx), 0, C_INK3, 0.9 * aha * beat, 1)
          }
          L.inset.hud(ix + b + 6 * upx, iy + b - 8 * upx).op(aha * beat)
          const [nx, ny] = noteSpot(tl)
          // phones: the ladder fills the note's usual spot, so it sits just above the short aha line
          L.note.scr(nx, tl.portrait ? 0.635 : ny).op(beat * smoothstep(0.8, 0.86, fp))
        }
      }
    } else {
      world.current.scale.setScalar(1)
    }

    // ── FIT station ──
    if (labW > 0.001) {
      const lab = tl.lab
      const port = tl.portrait
      // desktop: circle · ladder · (gravity plot) across the top, the slide rule along the bottom (Bounds.tsx)
      const lay = fitLabLayout(tl)
      const cx = hx(tl, port ? 0.19 : lay.cx)
      const cy = hy(tl, port ? 0.37 : 0.4)
      const R = (port ? 44 : lay.R) * upx
      drawKK(Hh, { cx, cy, cz: 0, R, k: lab.k, phase, alpha: labW, seg: 160, w: 1.5 })
      const dev = Math.abs(lab.k - Math.round(lab.k))
      const lock = 1 - Math.min(1, dev / 0.06)
      const lit = Math.round(lab.k)
      // above the ring (below it, the ladder's LHC line and labels need the room)
      L.fitNote.el.classList.toggle('dim-note--up', true)
      L.fitNote.hud(cx - R * (port ? 1 : COIL), cy + R * COIL + 10 * upx).op(0.9 * labW)
      // ladder with physical energies, E_n = n·ħc/R
      const lx = hx(tl, port ? 0.46 : lay.lx)
      const y0 = hy(tl, port ? 0.49 : 0.6)
      const gravPort = port && lab.mode === 'gravity' // phones: the gravity plot takes the labels' place
      const s = (port ? 16 : 31 * Math.min(1, tl.H / 900)) * upx
      const E1 = HBARC / lab.R
      const rw = 20 * upx
      sg(Hh, lx, y0 - 8 * upx, 0, lx, y0 + 8.6 * s, 0, C_FIELD, 0.55 * labW, 1)
      const yL = y0 + (LHC_EV / E1) * s
      for (let n = 0; n <= 8; n++) {
        const y = y0 + n * s
        const isLit = n === lit && lit <= 8 ? lock : 0
        const below = n * E1 < LHC_EV
        const c = isLit > 0.2 ? C_INK : below ? C_INK2 : C_FIELD
        sg(Hh, lx, y, 0, lx + rw, y, 0, c, labW * (0.5 + 0.5 * isLit), 1.2 + 1.3 * isLit)
        if (isLit > 0.01) sg(Hh, lx, y, 0, lx + rw, y, 0, C_INK, 0.12 * isLit * labW, 9)
        const txt = n === 0 ? 'n = 0 · lightest' : `n = ${n} · ${formatEnergy(n * E1)}`
        L.rung[n].el.classList.toggle('dim-rung--r', false)
        if (!port || ((n % 2 === 0 || isLit > 0.5) && !gravPort)) L.rung[n].text(txt).hud(lx + rw + 6 * upx, y).op(labW * (0.62 + 0.38 * isLit))
      }
      const yTopL = y0 + 8.6 * s
      if (yL <= yTopL) {
        sg(Hh, lx - 16 * upx, yL, 0, lx + rw + 118 * upx, yL, 0, C_INK3, 0.95 * labW, 1, 6)
        L.lhc.text('LHC · 13.6 TeV').hud(lx - 20 * upx, yL).op(labW)
      } else {
        // far above the drawn ladder: an arrow at the top
        sg(Hh, lx, yTopL, 0, lx, yTopL + 16 * upx, 0, C_INK3, 0.9 * labW, 1)
        sg(Hh, lx - 4 * upx, yTopL + 11 * upx, 0, lx, yTopL + 16 * upx, 0, C_INK3, 0.9 * labW, 1)
        sg(Hh, lx + 4 * upx, yTopL + 11 * upx, 0, lx, yTopL + 16 * upx, 0, C_INK3, 0.9 * labW, 1)
        L.lhcUp.hud(lx + 10 * upx, yTopL + 12 * upx).op(gravPort ? 0 : labW)
        if (port) L.lhcUp.hud(lx + 10 * upx, yTopL + 6 * upx)
      }
      L.axis.text('KK TOWER · E = nħc/R').hud(lx - 4 * upx, yTopL + 34 * upx).op(port ? 0 : 0.8 * labW)
      // the charge tag (a label only): rung n carries charge n·q₁
      L.charge.hud(lx - 4 * upx, yTopL + 52 * upx).op(port ? 0 : 0.75 * labW)

      // gravity-only plot: V/V_N = 1 + (8/3)/(e^{r/R} − 1), r = 1 µm…10 mm (log), y ∈ [1, 100] (log)
      const gA = labW * (lab.mode === 'gravity' ? 1 : 0)
      if (gA > 0.001) {
        const px0 = hx(tl, port ? 0.56 : lay.px0)
        const px1 = hx(tl, port ? 0.94 : lay.px1)
        const py0 = hy(tl, port ? 0.47 : 0.6)
        const py1 = hy(tl, port ? 0.33 : 0.33)
        const X = (r: number) => px0 + ((Math.log10(r) + 6) / 4) * (px1 - px0)
        const Y = (v: number) => py0 + (Math.log10(clamp(v, 1, 100)) / 2) * (py1 - py0)
        sg(Hh, px0, py0, 0, px1, py0, 0, C_FIELD, 0.6 * gA, 1)
        sg(Hh, px0, py0, 0, px0, py1, 0, C_FIELD, 0.6 * gA, 1)
        // tested band r ≥ 52 µm: diagonal hatching clipped to the band
        const xb = X(GAP_52)
        const hh = py1 - py0
        for (let x = xb - hh * 0.4; x < px1; x += 6 * upx) {
          let ax = x
          let ay = py0
          let bx = x + hh * 0.4
          let by = py1
          if (ax < xb) {
            ay += ((xb - ax) / (bx - ax)) * (by - ay)
            ax = xb
          }
          if (bx > px1) {
            by -= ((bx - px1) / (bx - ax)) * (by - ay)
            bx = px1
          }
          if (bx > ax) sg(Hh, ax, ay, 0, bx, by, 0, C_INK3, 0.35 * gA, 1)
        }
        sg(Hh, xb, py0, 0, xb, py1, 0, C_INK2, 0.6 * gA, 1)
        // the gravity-only curve for the current R (Newton would be the floor, V/V_N = 1)
        let ox = 0
        let oy = 0
        for (let i = 0; i <= 90; i++) {
          const r = Math.pow(10, -6 + (4 * i) / 90)
          const v = potentialRatio(r / lab.R)
          const x = X(r)
          const y = Y(v)
          if (i > 0) sg(Hh, ox, oy, 0, x, y, 0, C_INK, 0.9 * gA, 1.4)
          ox = x
          oy = y
        }
        L.gx.hud(0.5 * (px0 + px1), py0 - 6 * upx).op(0.85 * gA)
        L.gy.text(port ? 'GRAVITY ÷ NEWTON' : 'GRAVITY ÷ NEWTON · LOG 1 → 100').hud(px0, py1 + (port ? 14 : 30) * upx).op(0.85 * gA)
        L.g1.hud(px0 - 4 * upx, py0).op(0.7 * gA)
        L.gband.hud(px1, py1 + (port ? 28 : 12) * upx).op(0.85 * gA)
      }
    }

    W.end()
    Hh.end()
    P.visible = pointI > 0.002
    P.material.uniforms.uIntensity.value = pointI
  })

  return (
    <>
      <group ref={world}>
        <HairLines ref={wl} capacity={2600} />
      </group>
      <GlowPoint ref={pt} size={0.3} minPixels={2.5} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <Hud>
        <HairLines ref={hl} capacity={3200} />
      </Hud>
    </>
  )
}
