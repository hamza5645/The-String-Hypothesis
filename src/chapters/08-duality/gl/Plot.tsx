import { forwardRef, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/gl'
import { famTone, famY, MAP_FAMILIES } from '../model'
import { Ribbons, rgb, type Polyline, type RibbonsApi } from './Ribbons'

/*
 * Beat 5 — the spectrum map as a page that folds. x = log₁₀ r ∈ [−1, 1] → [−PW/2, PW/2],
 * y = α′M² ∈ [0, 10] → [−PH/2, PH/2]. The left half (r < √α′) is its own mesh, hinged on the
 * self-dual line; turned 180°, every left curve lands exactly on a right curve (same families
 * as the lab's strip: a, b ≤ 6, S ∈ {ab, ab+2, ab+4}; momentum blue, winding amber, vibration grey).
 */

export const PW = 5.6
export const PH = 3.4
export const plotX = (lx: number) => (lx * PW) / 2
export const plotY = (y: number) => -PH / 2 + (Math.min(y, 10) / 10) * PH

function halfCurves(side: -1 | 1): Polyline[] {
  const tones = { mom: rgb(COLORS.field), wind: rgb(COLORS.filament), vib: rgb(COLORS.ink2) }
  const out: Polyline[] = []
  const N = 120
  for (const f of MAP_FAMILIES) {
    let cur: Polyline | null = null
    let curTone = ''
    for (let i = 0; i < N; i++) {
      // sample from the hinge outwards
      let x0 = (side * i) / N
      let x1 = (side * (i + 1)) / N
      let y0 = famY(f.a, f.b, f.S, x0)
      let y1 = famY(f.a, f.b, f.S, x1)
      if (y0 > 10 && y1 > 10) {
        cur = null
        continue
      }
      if (y0 > 10) {
        x0 = x0 + ((x1 - x0) * (y0 - 10)) / (y0 - y1)
        y0 = 10
        cur = null
      } else if (y1 > 10) {
        x1 = x0 + ((x1 - x0) * (10 - y0)) / (y1 - y0)
        y1 = 10
      }
      const tn = famTone(f.a, f.b, 0.5 * (x0 + x1))
      const tone = tn > 0 ? 'mom' : tn < 0 ? 'wind' : 'vib'
      if (!cur || tone !== curTone) {
        cur = { pts: [plotX(x0), plotY(y0), 0], color: tones[tone], alpha: tone === 'vib' ? 0.45 : 0.62 }
        curTone = tone
        out.push(cur)
      }
      cur.pts.push(plotX(x1), plotY(y1), 0)
      if (y1 >= 10) cur = null
    }
  }
  return out
}

function axes(side: -1 | 1): Polyline[] {
  const c = rgb(COLORS.ink3)
  const out: Polyline[] = [{ pts: [0, -PH / 2, 0, (side * PW) / 2, -PH / 2, 0], color: c, alpha: 0.9 }]
  // decade ticks on this half's x axis (at ±1 and the minor 2..9 in log spacing)
  for (let k = 2; k <= 10; k++) {
    const x = side * Math.log10(k)
    const big = k === 10
    out.push({ pts: [plotX(x), -PH / 2, 0, plotX(x), -PH / 2 - (big ? 0.1 : 0.05), 0], color: c, alpha: big ? 0.9 : 0.6 })
  }
  return out
}

function hinge(): Polyline[] {
  const c = rgb(COLORS.ink2)
  const out: Polyline[] = []
  const n = 26
  for (let k = 0; k < n; k++) {
    const y0 = -PH / 2 + (PH * k) / n
    out.push({ pts: [0, y0, 0, 0, y0 + (PH / n) * 0.5, 0], color: c, alpha: 0.75 })
  }
  // y ticks every 2 units on the hinge
  for (let v = 0; v <= 10; v += 2) out.push({ pts: [-0.05, plotY(v), 0, 0.05, plotY(v), 0], color: c, alpha: 0.8 })
  return out
}

export interface PlotApi {
  root: THREE.Group
  leaf: THREE.Group
  curvesR: RibbonsApi | null
  curvesL: RibbonsApi | null
  axesR: RibbonsApi | null
  axesL: RibbonsApi | null
  hinge: RibbonsApi | null
}

export const Plot = forwardRef<PlotApi, { children?: ReactNode; leafChildren?: ReactNode }>(function Plot({ children, leafChildren }, ref) {
  const root = useRef<THREE.Group>(null!)
  const leaf = useRef<THREE.Group>(null!)
  const r = [useRef<RibbonsApi>(null), useRef<RibbonsApi>(null), useRef<RibbonsApi>(null), useRef<RibbonsApi>(null), useRef<RibbonsApi>(null)]
  const data = useMemo(() => ({ R: halfCurves(1), L: halfCurves(-1), aR: axes(1), aL: axes(-1), h: hinge() }), [])
  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return root.current
      },
      get leaf() {
        return leaf.current
      },
      get curvesR() {
        return r[0].current
      },
      get curvesL() {
        return r[1].current
      },
      get axesR() {
        return r[2].current
      },
      get axesL() {
        return r[3].current
      },
      get hinge() {
        return r[4].current
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return (
    <group ref={root} visible={false}>
      <Ribbons ref={r[0]} lines={data.R} width={0.5} renderOrder={4} depthTest={false} />
      <Ribbons ref={r[2]} lines={data.aR} width={0.5} renderOrder={4} />
      <Ribbons ref={r[4]} lines={data.h} width={0.5} renderOrder={5} />
      <group ref={leaf}>
        <Ribbons ref={r[1]} lines={data.L} width={0.5} renderOrder={5} />
        <Ribbons ref={r[3]} lines={data.aL} width={0.5} renderOrder={4} />
        {leafChildren}
      </group>
      {children}
    </group>
  )
})
