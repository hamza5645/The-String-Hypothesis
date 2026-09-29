/*
 * Beat 1 point-cloud layers (≤ 2 live at once): proton fog, carbon electron haze, a human made of
 * points, the Milky Way, the cosmic web, the universe's mottled disc. Each is a fixed physical size;
 * its on-screen scale is (D / L_view) computed in float64 and handed to the GPU as a ratio.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GlowPoints, COLORS, useChapterFrame, type GlowPointsApi } from '@/gl'
import { particleScale } from '@/core/settings'
import { smoothstep } from '@/core/math'
import { zoomHz, type StageState } from '../choreo'
import { layerVis, universeCircle } from '../dom/ZoomView'
import { wx, wy } from '../layout'
import { LY } from '../model'
import { SI, ZOOM_END, local } from '../timeline'
import { cosmicWeb, electronHaze, humanFigure, protonFog, starField, universeMottle, type Cloud } from './clouds'
import { ZOOM_LAYERS as Z } from '../zoomLayers'

interface LayerDef {
  cloud: Cloud
  id: string
  label: [string, string]
  D: number
  lo: number
  hi: number
  /** metres per local unit */
  unit: number
  color: string
  intensity: number
  minPx: number
  maxPx: number
  sharp: number
}

export function ZoomGL({ S, galaxy }: { S: StageState; galaxy: Cloud }) {
  const ps = particleScale()
  const defs = useMemo<LayerDef[]>(
    () => [
      { cloud: protonFog(Math.round(6000 * ps)), ...Z.proton, unit: 1.7e-15, color: COLORS.field, intensity: 1.0, minPx: 0.8, maxPx: 12, sharp: 0 },
      { cloud: electronHaze(Math.round(7000 * ps)), ...Z.atom, unit: 3.4e-10, color: COLORS.ink, intensity: 1.0, minPx: 0.8, maxPx: 7, sharp: 0 },
      { cloud: humanFigure(Math.round(2600 * ps)), ...Z.you, unit: 1.7, color: COLORS.ink, intensity: 0.9, minPx: 1, maxPx: 1.6, sharp: 0.6 },
      // nearest stars: uniform at roughly the local density inside a 120-ly sphere (positions random)
      { cloud: starField(Math.round(2400 * ps), 0.5, 41), ...Z.stars, unit: Z.stars.D, color: COLORS.ink, intensity: 0.95, minPx: 0.9, maxPx: 1.7, sharp: 0.5 },
      { cloud: galaxy, ...Z.galaxy, unit: LY, color: COLORS.ink, intensity: 0.85, minPx: 0.8, maxPx: 1.4, sharp: 0.4 },
      { cloud: cosmicWeb(Math.round(14000 * ps)), ...Z.web, unit: 3e25, color: COLORS.ink, intensity: 0.8, minPx: 0.8, maxPx: 1.4, sharp: 0.3 },
      { cloud: universeMottle(Math.round(5000 * ps)), ...Z.universe, unit: 8.8e26, color: COLORS.field, intensity: 0.7, minPx: 0.8, maxPx: 16, sharp: 0 },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [galaxy],
  )
  const groups = useRef<(THREE.Group | null)[]>([])
  const pts = useRef<(GlowPointsApi | null)[]>([])

  useChapterFrame(() => {
    const T = S.T
    const L = S.L
    const inB1 = T >= SI.decades && T < SI.quarter
    const p1 = local(T, 'decades')
    const Hz = zoomHz(L)
    const s = S.zoomS
    defs.forEach((d, i) => {
      const g = groups.current[i]
      const m = pts.current[i]
      if (!g || !m) return
      const uni = d.id === 'universe'
      let v = inB1 ? layerVis(d.D, s, d.lo, d.hi) * S.zoomOn : 0
      if (uni && inB1) v = layerVis(d.D, s, d.lo, d.hi) * (1 - smoothstep(ZOOM_END + 0.02, ZOOM_END + 0.1, p1))
      // as a world recedes its cloud thins (a dense cloud in a few px would flare), then hands over to the
      // labelled dot drawn in the diagram layer below ~1% of the view
      const r = Math.log10(d.D) - s
      const rpx = 0.5 * d.D * (Hz / Math.pow(10, s))
      const recede = uni ? 1 : smoothstep(-2.0, -1.45, r) * Math.min(1, Math.max(0.1, Math.pow(rpx / 170, 0.85)))
      v *= recede
      g.visible = v > 0.003
      if (!g.visible) return
      m.material.uniforms.uIntensity.value = d.intensity * v
      if (uni) {
        // the mottled disc rides the universe circle as it shrinks onto the Ruler
        const [ux, uy, ru] = universeCircle(S, L, p1)
        g.scale.setScalar(2 * ru * L.u)
        g.position.set(wx(L, ux), wy(L, uy), 0)
        return
      }
      const pxPerUnit = d.unit * (Hz / Math.pow(10, s))
      g.scale.setScalar(pxPerUnit * L.u)
      g.position.set(wx(L, S.zcx), wy(L, S.zcy), 0)
    })
  })

  return (
    <>
      {defs.map((d, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)} visible={false}>
          <GlowPoints
            ref={(p) => void (pts.current[i] = p)}
            positions={d.cloud.positions}
            sizes={d.cloud.sizes}
            alphas={d.cloud.alphas}
            color={d.color}
            intensity={0}
            minPixels={d.minPx}
            maxPixels={d.maxPx}
            sharpness={d.sharp}
          />
        </group>
      ))}
    </>
  )
}
