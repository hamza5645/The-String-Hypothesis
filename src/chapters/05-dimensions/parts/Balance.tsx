import { useMemo, useRef } from 'react'
import { useChapterFrame } from '@/gl'
import { clamp, easeInOutCubic, range, smoothstep } from '@/core/math'
import { TI } from '../constants'
import { CHIPS, chipLand, chipsLanded, countB } from '../model'
import { HairLines, C_FIELD, C_INK, C_INK2, sg, circle, type HairLinesApi, type RGB } from '../gl/HairLines'
import { Hud } from '../gl/Hud'
import { chipHtml, type LabelLayer } from '../gl/labels'
import { hpx, hx, hy, type Timeline } from '../timeline'
import { noteSpot } from './notes'

/*
 * Beat 5 · String theory's count (content pack; ◑ DERIVED count, ~ANALOGY balance).
 * Left pan fixed: GHOSTS −15 (the gauge-fixing ghosts: −26 + 11). Ten dimension chips drop onto the
 * right pan, each +1.5 = 1 (position X) + ½ (fermion partner ψ). Beam angle = 0.04·(15 − 1.5·D) rad,
 * clamped; it levels exactly when the tenth chip lands (D(1 + ½) − 15 = 0 ⇒ D = 10) and glows (Field).
 * Then the chips sort: 1 time (Ink), 3 large space (Field solid), 6 hidden (Field dashed, curled).
 */


export function Balance({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const lines = useRef<HairLinesApi>(null)
  const L = useMemo(
    () => ({
      ghosts: labels.make({ tone: 'ink', align: 'below', cls: 'dim-bal__l', text: 'GHOSTS −15' }),
      ghostsSub: labels.make({ tone: 'dim', align: 'below', cls: 'dim-bal__s', text: 'gauge-fixing bookkeeping · −26 + 11' }),
      each: labels.make({ tone: 'dim', align: 'below', cls: 'dim-bal__s', text: 'each: 1 (position) + ½ (fermion partner)' }),
      sum: labels.make({ tone: 'ink', align: 'above', cls: 'dim-bal__sum', text: '' }),
      time: labels.make({ tone: 'ink', align: 'below', cls: 'dim-bal__g', text: '1 TIME' }),
      large: labels.make({ tone: 'field', align: 'below', cls: 'dim-bal__g', text: '3 LARGE SPACE' }),
      hidden: labels.make({ tone: 'field', align: 'below', cls: 'dim-bal__g', text: '6 HIDDEN' }),
      b26: labels.make({ tone: 'ink2', align: 'left', cls: 'dim-side', text: '', html: `<b>26</b> · bosonic string ${chipHtml('derived')} <span class="dim-side__s">has a tachyon, no fermions: a stepping stone</span>` }),
      m11: labels.make({ tone: 'ink2', align: 'left', cls: 'dim-side dim-side--inline', text: '', html: `<b>11</b> · M-theory ${chipHtml('conjectured')} <span class="dim-side__s">Witten 1995</span>` }),
      note: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: 'A bookkeeping cartoon of the worldsheet “central charge” count (see Go deeper).' }),
    }),
    [labels],
  )

  useChapterFrame(() => {
    const Ln = lines.current
    if (!Ln) return
    Ln.begin()
    const T = tl.T
    const on = smoothstep(TI.count - 0.02, TI.count + 0.08, T) * (1 - smoothstep(TI.bounds - 0.04, TI.bounds + 0.06, T))
    if (on <= 0.001) {
      Ln.end()
      Object.values(L).forEach((l) => l.op(0))
      return
    }
    const b = T >= TI.bounds ? 1 : countB(tl.u.count, tl.portrait)
    const u = hpx(tl)
    const port = tl.portrait
    const k = port ? 0.72 : 1 // px scale on phones
    const px = hx(tl, port ? 0.5 : 0.66)
    const py = hy(tl, port ? 0.2 : 0.3)
    const Lb = 150 * k * u
    const D = chipsLanded(b)
    const ang = clamp(0.04 * (15 - 1.5 * D), -0.3, 0.3)
    const glow = smoothstep(0.55, 0.58, b) * (1 - smoothstep(0.6, 0.7, b))
    const F = C_FIELD
    // post & base
    const postH = 118 * k * u
    sg(Ln, px, py, 0, px, py - postH, 0, F, 0.55 * on, 1)
    sg(Ln, px - 38 * k * u, py - postH, 0, px + 38 * k * u, py - postH, 0, F, 0.55 * on, 1)
    // pivot mark
    sg(Ln, px - 6 * k * u, py + 8 * k * u, 0, px, py, 0, F, 0.7 * on, 1)
    sg(Ln, px + 6 * k * u, py + 8 * k * u, 0, px, py, 0, F, 0.7 * on, 1)
    // beam (left end down while the ghosts outweigh)
    const c = Math.cos(ang)
    const s = Math.sin(ang)
    const lx = px - Lb * c
    const ly = py - Lb * s
    const rx = px + Lb * c
    const ry = py + Lb * s
    sg(Ln, lx, ly, 0, rx, ry, 0, F, (0.85 + 0.15 * glow) * on, 1.4 + glow)
    if (glow > 0.01) sg(Ln, lx, ly, 0, rx, ry, 0, F, 0.22 * glow * on, 10)
    // level reference tick marks at the beam ends
    // pans hanging from the ends
    const hang = 58 * k * u
    const panW = 44 * k * u
    const pan = (ex: number, ey: number, col: RGB) => {
      sg(Ln, ex, ey, 0, ex - panW, ey - hang, 0, col, 0.45 * on, 1)
      sg(Ln, ex, ey, 0, ex + panW, ey - hang, 0, col, 0.45 * on, 1)
      sg(Ln, ex - panW - 6 * k * u, ey - hang, 0, ex + panW + 6 * k * u, ey - hang, 0, col, 0.8 * on, 1.3)
    }
    pan(lx, ly, F)
    pan(rx, ry, F)
    // the ghost weight on the left pan
    const gy = ly - hang
    const gw = 26 * k * u
    const gh = 22 * k * u
    const rect = (x0: number, y0: number, w: number, h: number, col: RGB, a: number, dash = 0) => {
      sg(Ln, x0 - w, y0, 0, x0 + w, y0, 0, col, a, 1.2, dash)
      sg(Ln, x0 + w, y0, 0, x0 + w, y0 + h, 0, col, a, 1.2, dash)
      sg(Ln, x0 + w, y0 + h, 0, x0 - w, y0 + h, 0, col, a, 1.2, dash)
      sg(Ln, x0 - w, y0 + h, 0, x0 - w, y0, 0, col, a, 1.2, dash)
    }
    rect(lx, gy + 1 * u, gw, gh, C_INK2, 0.9 * on)
    L.ghosts.hud(lx, gy - 6 * u).op(on)
    L.ghostsSub.hud(lx, gy - 24 * u).op(0.8 * on * (port ? 0 : 1))

    // chips
    const cs = 8 * k * u // half size
    const sortK = easeInOutCubic(range(b, 0.64, 0.8))
    const rowY = py - postH - 64 * k * u
    const slot = (i: number) => {
      const g = 30 * k * u
      if (i === 0) return px - 5.2 * g
      if (i <= 3) return px - 3.4 * g + (i - 1) * g
      return px - 0.1 * g + (i - 4) * g
    }
    for (let i = 0; i < CHIPS; i++) {
      const land = chipLand(i)
      const fall = range(b, land - 0.03, land)
      if (fall <= 0) continue
      // on the pan: 5 per row, two rows
      const col = i % 5
      const row = Math.floor(i / 5)
      const ox = (col - 2) * (2 * cs + 3 * u)
      const oy = row * (2 * cs + 3 * u)
      const panX = rx + ox
      const panY = ry - hang + cs + 2 * u + oy
      const dropY = panY + 150 * k * u * (1 - fall * fall)
      let x = panX
      let y = fall < 1 ? dropY : panY
      // sorted row
      x = x + (slot(i) - x) * sortK
      y = y + (rowY - y) * sortK
      const kind = i === 0 ? 0 : i <= 3 ? 1 : 2
      const col3: RGB = sortK > 0.5 && kind === 0 ? C_INK : F
      const a = on * Math.min(1, fall * 3)
      const curl = kind === 2 ? smoothstep(0.35, 1, sortK) : 0
      if (curl < 0.999) {
        const dash = kind === 2 && sortK > 0.2 ? 3 : 0
        rect(x, y - cs, cs * (1 - curl), 2 * cs * (1 - curl), col3, a * (1 - curl), dash)
        // "1 + ½" marks inside the chip
        if (curl < 0.3) {
          sg(Ln, x - cs * 0.35, y - cs * 0.7, 0, x - cs * 0.35, y + cs * 0.7, 0, col3, a * 0.9 * (1 - curl), 1.2)
          sg(Ln, x + cs * 0.35, y - cs * 0.7, 0, x + cs * 0.35, y, 0, col3, a * 0.9 * (1 - curl), 1.2)
        }
      }
      if (curl > 0.001) circle(Ln, x, y, 0, cs * 0.85, 1, 0, 0, 0, 1, 0, 24, F, a * curl, 1.2, 3)
    }
    L.each.hud(rx, ry - hang - 8 * u).op(on * smoothstep(0.1, 0.16, b) * (1 - smoothstep(0.6, 0.66, b)) * (port ? 0 : 1))
    const Dn = Math.round(D)
    const bal = -15 + 1.5 * Dn
    L.sum
      .text(Dn >= 10 ? 'D (1 + ½) − 15 = 0  ⇒  D = 10' : `${Dn} × (1 + ½) − 15 = ${bal < 0 ? '−' : ''}${Math.abs(bal).toFixed(1)}`)
      .hud(px, py + 24 * k * u)
      .op(on * smoothstep(0.08, 0.12, b))
    const gA = on * smoothstep(0.72, 0.8, b)
    L.time.hud(slot(0), rowY - cs - 8 * u).op(gA)
    // phones: the slots are too close for three labels on one line, so the middle one drops a row
    L.large.hud(slot(2), rowY - cs - (port ? 24 : 8) * u).op(gA)
    L.hidden.hud(slot(6) + 15 * k * u, rowY - cs - 8 * u).op(gA)
    const sA = on * smoothstep(0.84, 0.92, b)
    // phones: above the sum line (the lower stage belongs to the chip row, the notes and the text)
    const sx = hx(tl, port ? 0.055 : 0.47)
    L.b26.hud(sx, hy(tl, port ? 0.076 : 0.605)).op(sA)
    L.m11.hud(sx, hy(tl, port ? 0.127 : 0.645)).op(sA)
    const [nx, ny] = noteSpot(tl)
    L.note.scr(nx, ny).op(on * smoothstep(0.1, 0.16, b) * (1 - smoothstep(0.62, 0.68, b)))
    Ln.end()
  })

  return (
    <Hud>
      <HairLines ref={lines} capacity={320} />
    </Hud>
  )
}
