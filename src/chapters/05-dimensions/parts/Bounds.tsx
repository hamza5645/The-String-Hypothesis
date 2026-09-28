import { useMemo, useRef } from 'react'
import { useChapterFrame } from '@/gl'
import { clamp, damp, smoothstep } from '@/core/math'
import { GAP_52, TI, forceRatio } from '../constants'
import { HairLines, C_FIELD, C_INK, C_INK2, C_INK3, sg, type HairLinesApi } from '../gl/HairLines'
import { Hud } from '../gl/Hud'
import type { LabelLayer } from '../gl/labels'
import { RulerFig } from '../gl/ruler'
import { fitLabLayout } from './HiddenCircle'
import { hpx, hx, hy, type Timeline } from '../timeline'

/*
 * Beat 6 · How small, and how we'd know (● OBSERVED null results + ○ SPECULATIVE gravity-only scenario).
 * The slide rule (gl/ruler.ts) plus an inset: a torsion-balance schematic (pendulum disk with a ring of
 * holes on a fibre above a rotating attractor; gap 52 µm) and a log–log plot of gravity's strength vs
 * distance: Newton's 1/r² in Ink and the ILLUSTRATIVE dashed curve for a hypothetical gravity-only
 * circle of R = 100 µm, F/F_N = 1 + (8/3)[1/(eˣ − 1) + x·eˣ/(eˣ − 1)²], x = r/R (steepens toward 1/r³).
 * The ruler is reused by the Lab's FIT station with a cursor on the current R.
 */

const R_HYP = 100e-6

export function Bounds({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const lines = useRef<HairLinesApi>(null)
  const ruler = useMemo(() => new RulerFig(labels), [labels])
  const st = useMemo(() => ({ wFit: 0 }), [])
  const L = useMemo(
    () => ({
      tb: labels.make({ tone: 'dim', align: 'above', cls: 'dim-plot__l', text: 'TORSION BALANCE · SCHEMATIC' }),
      gap: labels.make({ tone: 'ink', align: 'left', cls: 'dim-plot__l', text: '52 µm' }),
      newton: labels.make({ tone: 'ink', align: 'left', cls: 'dim-plot__l dim-plot__lg', text: '1/r² · NEWTON' }),
      hyp: labels.make({ tone: 'ink2', align: 'left', cls: 'dim-plot__l dim-plot__lg', text: 'IF A GRAVITY-ONLY CIRCLE HAD R = 100 µm (HYPOTHETICAL)' }),
      illus: labels.make({ tone: 'dim', align: 'left', cls: 'dim-plot__l dim-plot__lg', text: 'ILLUSTRATIVE CURVE, NOT THE MEASURED DATA' }),
      band: labels.make({ tone: 'dim', align: 'right', cls: 'dim-plot__l dim-plot__tr', text: 'TESTED · r ≥ 52 µm' }),
      ax: labels.make({ tone: 'dim', align: 'below', cls: 'dim-plot__l', text: 'DISTANCE r · 10 µm → 3 mm (LOG)' }),
      ay: labels.make({ tone: 'dim', align: 'left', cls: 'dim-plot__l dim-plot__lg', text: 'GRAVITY’S STRENGTH (LOG)' }),
    }),
    [labels],
  )

  useChapterFrame((f) => {
    const Ln = lines.current
    if (!Ln) return
    Ln.begin()
    const T = tl.T
    const u = hpx(tl)
    const port = tl.portrait
    const fitTarget = tl.inLab && tl.lab.station === 'fit' ? 1 : 0
    st.wFit = f.dt === 0 ? fitTarget : damp(st.wFit, fitTarget, 5, f.dt)
    const labW = st.wFit * smoothstep(TI.lab - 0.02, TI.lab + 0.08, T) * (1 - smoothstep(TI.exit - 0.02, TI.exit + 0.1, T))
    const beat = smoothstep(TI.bounds - 0.02, TI.bounds + 0.08, T) * (1 - smoothstep(TI.lab - 0.04, TI.lab + 0.06, T))
    const r = T >= TI.lab ? 1 : tl.u.bounds

    if (beat > 0.001 && beat >= labW) {
      ruler.draw(Ln, {
        x0: hx(tl, port ? 0.06 : 0.1),
        x1: hx(tl, port ? 0.94 : 0.84),
        y: hy(tl, port ? 0.385 : 0.7),
        alpha: beat,
        // the inset (right of the text column) opens first; the rule draws in once the text has settled
        reveal: smoothstep(0.18, 0.4, r),
        collider: smoothstep(0.38, 0.44, r),
        gravity: smoothstep(0.46, 0.52, r),
        markers: smoothstep(0.32, 0.38, r),
        band: smoothstep(0.52, 0.58, r),
        refs: smoothstep(0.42, 0.48, r),
        cursor: 0,
        compact: port,
        upx: u,
      })
      // ── inset: torsion balance schematic + force plot ──
      const iA = beat * smoothstep(0.05, 0.16, r)
      if (iA > 0.001) {
        const t = tl.t * (tl.amb || 0)
        if (!port) {
          const cx = hx(tl, 0.475)
          const cy = hy(tl, 0.34)
          const rx = 74 * u
          const ry = 17 * u
          const gapY = 34 * u
          // fibre
          sg(Ln, cx, cy, 0, cx, hy(tl, 0.12), 0, C_INK2, 0.7 * iA, 1)
          const disk = (y: number, rot: number, a: number) => {
            let ox = cx + rx
            let oy = y
            for (let i = 1; i <= 64; i++) {
              const th = (i / 64) * Math.PI * 2
              const x = cx + rx * Math.cos(th)
              const yy = y + ry * Math.sin(th)
              sg(Ln, ox, oy, 0, x, yy, 0, C_FIELD, 0.8 * a, 1)
              ox = x
              oy = yy
            }
            // thickness
            sg(Ln, cx - rx, y, 0, cx - rx, y - 5 * u, 0, C_FIELD, 0.5 * a, 1)
            sg(Ln, cx + rx, y, 0, cx + rx, y - 5 * u, 0, C_FIELD, 0.5 * a, 1)
            // ring of holes
            for (let h = 0; h < 18; h++) {
              const th = (h / 18) * Math.PI * 2 + rot
              const hx0 = cx + 0.78 * rx * Math.cos(th)
              const hy0 = y + 0.78 * ry * Math.sin(th)
              const front = Math.sin(th) < 0 ? 1 : 0.45
              sg(Ln, hx0 - 3.2 * u, hy0, 0, hx0 + 3.2 * u, hy0, 0, C_INK, 0.75 * a * front, 1.4)
            }
          }
          disk(cy, 0.2, iA)
          disk(cy - gapY, 0.15 * t, iA * 0.85)
          // gap dimension
          const gx = cx + rx + 16 * u
          sg(Ln, gx, cy - 5 * u, 0, gx, cy - gapY + 1 * u, 0, C_INK, 0.8 * iA, 1)
          sg(Ln, gx - 4 * u, cy - 5 * u, 0, gx + 4 * u, cy - 5 * u, 0, C_INK, 0.8 * iA, 1)
          sg(Ln, gx - 4 * u, cy - gapY + 1 * u, 0, gx + 4 * u, cy - gapY + 1 * u, 0, C_INK, 0.8 * iA, 1)
          L.gap.hud(gx + 4 * u, cy - gapY * 0.5 - 2 * u).op(iA)
          L.tb.hud(cx, cy - gapY - ry - 26 * u).op(0.85 * iA)
        } else {
          L.gap.op(0)
          L.tb.op(0)
        }
        // force plot (log–log): r ∈ [10 µm, 3 mm], F normalised to F_N(1 mm) = 1
        const X0 = hx(tl, port ? 0.1 : 0.62)
        const X1 = hx(tl, port ? 0.9 : 0.83)
        const Y0 = hy(tl, port ? 0.17 : 0.4)
        const Y1 = hy(tl, port ? 0.085 : 0.13)
        const lrA = -5
        const lrB = Math.log10(3e-3)
        const lfA = -1.2
        const lfB = 6
        const X = (rr: number) => X0 + ((Math.log10(rr) - lrA) / (lrB - lrA)) * (X1 - X0)
        const Y = (F: number) => Y0 + ((clamp(Math.log10(F), lfA, lfB) - lfA) / (lfB - lfA)) * (Y1 - Y0)
        sg(Ln, X0, Y0, 0, X1, Y0, 0, C_FIELD, 0.6 * iA, 1)
        sg(Ln, X0, Y0, 0, X0, Y1, 0, C_FIELD, 0.6 * iA, 1)
        // decade ticks on r
        for (let e = -5; e <= -3; e++) {
          const x = X(Math.pow(10, e))
          sg(Ln, x, Y0, 0, x, Y0 - 5 * u, 0, C_FIELD, 0.6 * iA, 1)
        }
        // tested band r ≥ 52 µm
        const xb = X(GAP_52)
        const hh = Y1 - Y0
        for (let x = xb - hh * 0.3; x < X1; x += 7 * u) {
          let ax = x
          let ay = Y0
          let bx = x + hh * 0.3
          let by = Y1
          if (ax < xb) {
            ay += ((xb - ax) / (bx - ax)) * (by - ay)
            ax = xb
          }
          if (bx > X1) {
            by -= ((bx - X1) / (bx - ax)) * (by - ay)
            bx = X1
          }
          if (bx > ax) sg(Ln, ax, ay, 0, bx, by, 0, C_INK3, 0.38 * iA, 1)
        }
        sg(Ln, xb, Y0, 0, xb, Y1, 0, C_INK2, 0.7 * iA, 1)
        // Newton 1/r² and the hypothetical curve
        let ox = 0
        let oy = 0
        let hx0 = 0
        let hy0 = 0
        const n = 90
        for (let i = 0; i <= n; i++) {
          const rr = Math.pow(10, lrA + ((lrB - lrA) * i) / n)
          const FN = Math.pow(1e-3 / rr, 2)
          const FH = FN * forceRatio(rr / R_HYP)
          const x = X(rr)
          const yN = Y(FN)
          const yH = Y(FH)
          if (i > 0) {
            sg(Ln, ox, oy, 0, x, yN, 0, C_INK, 0.95 * iA, 1.4)
            sg(Ln, hx0, hy0, 0, x, yH, 0, C_INK2, 0.9 * iA, 1.2, 6)
          }
          ox = x
          oy = yN
          hx0 = x
          hy0 = yH
        }
        // titles, and a legend under the plot (keeps the plot area clean)
        L.ay.hud(X0, Y1 + 14 * u).op(0.8 * iA)
        L.band.hud(X1, Y1 + 14 * u).op(0.85 * iA)
        L.ax.hud(0.5 * (X0 + X1), Y0 - 7 * u).op(0.8 * iA)
        const lgX = X0
        const lg1 = Y0 - 40 * u
        const lg2 = Y0 - 57 * u
        sg(Ln, lgX, lg1, 0, lgX + 22 * u, lg1, 0, C_INK, 0.95 * iA, 1.4)
        sg(Ln, lgX, lg2, 0, lgX + 22 * u, lg2, 0, C_INK2, 0.9 * iA, 1.2, 6)
        L.newton.hud(lgX + 30 * u, lg1).op(iA)
        L.hyp.text(port ? 'GRAVITY-ONLY CIRCLE, R = 100 µm (HYPOTHETICAL)' : 'IF A GRAVITY-ONLY CIRCLE HAD R = 100 µm (HYPOTHETICAL)').hud(lgX + 30 * u, lg2).op(0.95 * iA)
        L.illus.text(port ? 'ILLUSTRATIVE, NOT THE MEASURED DATA' : 'ILLUSTRATIVE CURVE, NOT THE MEASURED DATA').hud(lgX + 30 * u, Y0 - 74 * u).op(0.85 * iA)
      } else Object.values(L).forEach((l) => l.op(0))
    } else if (labW > 0.001 && port) {
      // phones: no room for the slide rule beside the ladder (the panel's readouts carry R and ħc/R)
      Object.values(L).forEach((l) => l.op(0))
      ruler.hide()
    } else if (labW > 0.001) {
      Object.values(L).forEach((l) => l.op(0))
      const lab = tl.lab
      const lay = fitLabLayout(tl)
      ruler.draw(Ln, {
        x0: hx(tl, lay.x0),
        x1: hx(tl, lay.x1),
        y: hy(tl, port ? 0.5 : 0.8),
        alpha: labW,
        reveal: 1,
        collider: lab.mode === 'all' ? 1 : 0.3,
        gravity: lab.mode === 'gravity' ? 1 : 0.3,
        markers: port ? 0 : 1,
        band: port ? 0 : 1,
        refs: port ? 0 : 1,
        cursor: lab.R,
        compact: true,
        lab: true,
        upx: u,
      })
    } else {
      ruler.hide()
      Object.values(L).forEach((l) => l.op(0))
    }
    Ln.end()
  })

  return (
    <Hud>
      <HairLines ref={lines} capacity={1400} />
    </Hud>
  )
}
