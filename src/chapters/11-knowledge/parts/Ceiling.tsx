import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useChapterFrame, useIsoGridMaterial } from '@/gl'
import { lerp, smoothstep } from '@/core/math'
import { RIM_LABEL } from '../data'
import { RING_Y } from '../model'
import { AXIS_L } from './MapLines'
import { circlePts, createLineMaterial, LineBuilder } from '../gl/lines'
import type { LabelLayer, Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * The evidence ceiling (Model §3): a faint iso-grid disc of radius 7.5 with a crisp Field rim
 * (1.5 px, soft cool glow), gliding to y_c(L). Everything above it fades to a ghost.
 * Seen nearly edge-on, a glowing ring collapses into a bright band, so the glow and the grid
 * fade as the view grazes the plane (the crisp rim line stays).
 */

const RADIUS = 7.5

export function Ceiling({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const group = useRef<THREE.Group>(null!)
  const disc = useMemo(() => new THREE.CircleGeometry(RADIUS, 128), [])
  const mat = useIsoGridMaterial({ grid: [30, 30], lineWidth: 0.7, fill: 0.03, fresnel: 0, color: '#86A8D8', lineColor: '#0A0D12' })
  const rim = useMemo(() => {
    const L = new LineBuilder().add(circlePts(RADIUS, 0, 240), { color: '#86A8D8', alpha: 0.72, width: 1.5, glow: 6, yref: 'none' })
    // fine ticks on the rim, every 5°
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2
      const r0 = k % 6 === 0 ? RADIUS - 0.3 : RADIUS - 0.14
      L.add(
        [
          [Math.cos(a) * r0, 0, Math.sin(a) * r0],
          [Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS],
        ],
        { color: '#86A8D8', alpha: k % 6 === 0 ? 0.45 : 0.2, width: 1, yref: 'none' },
      )
    }
    return { geometry: L.build(), material: createLineMaterial() }
  }, [])
  useLayoutEffect(
    () => () => {
      disc.dispose()
      rim.geometry.dispose()
      rim.material.dispose()
    },
    [disc, rim],
  )
  const lbl = useMemo(() => {
    if (!layer) return null
    return {
      // anchored each frame to the lid's visible left-most rim point (screen space), never culled
      rim: layer.add({ text: RIM_LABEL[3] }, [0, 0, 0], { screen: true, cls: 'kn-lbl--field kn-lbl--md kn-lbl--rim', align: 'left', dx: 12, dy: -14, prio: 900, must: true }),
      // just above the highest ghost floor still in frame
      ghost: layer.add({ text: 'FADED, NOT DELETED', sub: 'IDEAS STILL WORTH TESTING' }, [0, 0, 0], { screen: true, cls: 'kn-lbl--ghost kn-lbl--center', align: 'center', prio: 880, must: true }),
    } as Record<string, Lbl>
  }, [layer])
  const st = useMemo(() => ({ v: new THREE.Vector3(), detent: -1, flash: 0, sx: new Float32Array(24), sy: new Float32Array(24), sf: new Uint8Array(24) }), [])

  useChapterFrame(
    (f) => {
      const cam = f.state.camera
      const map = group.current.parent!.matrixWorld.elements
      const cy = map[13] + S.yc * map[5]
      const dy = cam.position.y - cy
      const dxz = Math.hypot(cam.position.x - map[12], cam.position.z - map[14])
      const elev = Math.abs(Math.atan2(dy, Math.max(1e-3, dxz)))
      const grazing = smoothstep(0.03, 0.2, elev)
      const on = S.ceilDisc * S.mapVis
      group.current.visible = on > 0.001
      group.current.position.y = S.yc
      mat.uniforms.uOpacity.value = on * grazing
      // quieter in the lab, where the map (not the lid) is the subject
      const labQuiet = S.sp.lab > 0.1 && S.sp.lab < 0.97 ? 0.72 : 1
      rim.material.uniforms.uOpacity.value = on * lerp(0.4, 0.9, grazing) * labQuiet
      rim.material.uniforms.uGlowScale.value = grazing
    },
    { priority: -1.5 },
  )

  // labels: after the camera has settled this frame (they choose their anchors on screen)
  useChapterFrame(
    (f) => {
      if (!lbl || !layer) return
      const on = S.ceilDisc * S.mapVis * (1 - smoothstep(0, 0.15, S.mapK))
      const cam = f.state.camera
      const M = group.current.parent!.matrixWorld
      const v = st.v
      const W = S.W
      const H = S.H
      // the detent's name; a change is announced (the label re-fades in and brightens briefly)
      const d = Math.max(0, Math.min(3, Math.round(S.L)))
      if (d !== st.detent) {
        if (st.detent >= 0 && on > 0.3) {
          lbl.rim.o = 0
          st.flash = 1.3
        }
        st.detent = d
        layer.setText(lbl.rim, RIM_LABEL[d])
      }
      st.flash = Math.max(0, st.flash - (f.dt || 0))
      lbl.rim.hot = st.flash > 0
      // anchor: the visible rim point with the smallest x right of the text column (or, in the lab,
      // right of the axis ruler), preferring the far arc so the name sits on the lid's back edge
      let minX = S.safeLeft > 0 ? S.safeLeft + 40 : 24
      if (S.axisSide > 0.5) {
        v.set(AXIS_L[0], S.yc, AXIS_L[1]).applyMatrix4(M).project(cam)
        minX = Math.max(minX, (v.x * 0.5 + 0.5) * W + 36)
      }
      if (!lbl.rim.w) {
        lbl.rim.w = lbl.rim.el.offsetWidth
        lbl.rim.h = lbl.rim.el.offsetHeight
      }
      const cx = M.elements[12]
      const cz = M.elements[14]
      let bx = -1
      let by = 0
      let bFar = false
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2
        v.set(RADIUS * Math.cos(a), S.yc, RADIUS * Math.sin(a)).applyMatrix4(M)
        const far = (v.x - cx) * (cam.position.x - cx) + (v.z - cz) * (cam.position.z - cz) < 0
        v.project(cam)
        st.sf[i] = 0
        if (v.z > 1 || v.z < -1) continue
        const x = (v.x * 0.5 + 0.5) * W
        const y = (0.5 - v.y * 0.5) * H
        st.sx[i] = x
        st.sy[i] = y
        st.sf[i] = far ? 1 : 0
        // the name must fit to the right of its point
        const maxX = (layer.right > 0 ? layer.right : W - 8) - (lbl.rim.w || 240) - 14
        if (x < minX || x > maxX || y < 70 || y > H - 50 || layer.reserved(x + 60, y - 12, 20)) continue
        if (bx < 0 || (far && !bFar) || (far === bFar && x < bx)) {
          bx = x
          by = y
          bFar = far
        }
      }
      // lift the name clear of the arc under its whole width (the far arc rises toward its top)
      if (bx >= 0 && bFar) {
        const x1 = bx + (lbl.rim.w || 240) + 20
        for (let i = 0; i < 24; i++) if (st.sf[i] && st.sx[i] >= bx - 10 && st.sx[i] <= x1) by = Math.min(by, st.sy[i])
      }
      lbl.rim.x = bx
      lbl.rim.y = by
      lbl.rim.target = bx < 0 ? 0 : on
      // ghost caption: centred above the highest ghost floor still in frame
      let gy = -1
      let gx = 0
      for (let k = 3; k >= 1; k--) {
        if (RING_Y[k] < S.yc + 0.3) break
        v.set(0, RING_Y[k], 0).applyMatrix4(M).project(cam)
        const y = (0.5 - v.y * 0.5) * H
        if (y > 110) {
          gy = y
          gx = (v.x * 0.5 + 0.5) * W
          break
        }
      }
      lbl.ghost.x = gx
      // (phones: inside the ghost ring — the strip above it belongs to the map's tag)
      lbl.ghost.y = S.mobile ? gy : gy - 26
      const inLab = S.sp.lab > 0.12 && S.sp.lab < 0.95 ? 1 : 0
      const inFrame = S.mobile ? smoothstep(0.93, 0.97, S.sp.demand) : smoothstep(0.84, 0.9, S.sp.demand)
      lbl.ghost.target = gy < 0 ? 0 : on * Math.max(inLab, S.sp.lab > 0 ? 0 : inFrame) * (S.L < 2.5 ? 1 : 0)
    },
    { priority: -0.9 },
  )

  return (
    <group ref={group} visible={false}>
      <mesh geometry={disc} material={mat} rotation-x={-Math.PI / 2} renderOrder={2} frustumCulled={false} />
      <mesh geometry={rim.geometry} material={rim.material} renderOrder={3} frustumCulled={false} />
    </group>
  )
}
