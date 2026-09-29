/*
 * The ring of 24 free test particles (Beat 4, Beat 5 left half, Lab). Faithful to linearized GR in TT
 * gauge: x_k → x_k + ½ H x_k + v (model.ts). Tidal arrows (13 × 13 over [−1.8R, 1.8R]²) draw
 * −(½ H r + v) normalised by ½ A · 1.8, clamped to 0.14 R (geodesic deviation, long-wavelength limit).
 * Ghost: the ψ = 0 pattern at the same φ (dashed, linear mode). Beat 4: three square plane wavefronts
 * (faint iso-grid, bright rim) stack along z and sweep toward the viewer through the ring, with a +z arrow.
 * Reduced motion: a fixed phase-0 snapshot plus a dashed phase-½ snapshot (phase ¼ = the reference circle).
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createIsoGridMaterial, GlowPoints, SceneLabel, COLORS, useChapterFrame, type GlowPointsApi } from '@/gl'
import { smoothstep, TAU } from '@/core/math'
import { D, labelFade, S } from './director'
import { displace, makeWave, waveState, type Wave } from './model'
import { useGravity } from './store'
import { lineMaterial, Segs } from './lines'
import { PatternGlyph, useGlyph } from './Glyph'
import { AHA } from './Tile'

const NP = 24
const NG = 128
const NA = 13

const ghostW = makeWave()
const snapW = makeWave()
const tmp = new Float32Array(2)
const PLANE = 3.0 // wavefront square side, in ring radii

/** Write a closed 128-segment outline of the ring displaced by wave `w` into a line geometry's positions. */
function outline(geo: THREE.BufferGeometry, w: Wave, cx: number, cy: number, R: number) {
  const gp = geo.attributes.position.array as Float32Array
  let px = 0
  let py = 0
  for (let i = 0; i <= NG; i++) {
    const th = ((i % NG) / NG) * TAU
    displace(w, R * Math.cos(th), R * Math.sin(th), tmp)
    const x = cx + tmp[0]
    const y = cy + tmp[1]
    if (i > 0) {
      const o = (i - 1) * 6
      gp[o] = px
      gp[o + 1] = py
      gp[o + 2] = 0
      gp[o + 3] = x
      gp[o + 4] = y
      gp[o + 5] = 0
    }
    px = x
    py = y
  }
  geo.attributes.position.needsUpdate = true
}

export function Ring() {
  const group = useRef<THREE.Group>(null!)
  const pts = useRef<GlowPointsApi>(null)
  const discs = useRef<THREE.Group>(null!)
  const glyph = useRef<THREE.Group>(null!)
  const refLine = useRef<THREE.LineSegments>(null!)
  const ringCap = useRef<THREE.Group>(null!)
  const zArrow = useRef<THREE.Group>(null!)
  const pg = useGlyph()
  const psiEl = useRef<HTMLSpanElement>(null)
  const lastPsi = useRef(-1)

  const pPos = useMemo(() => new Float32Array(NP * 3), [])
  const pSize = useMemo(() => new Float32Array(NP).fill(0.15), [])
  const pAlpha = useMemo(() => new Float32Array(NP).fill(1), [])

  const ref = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    const c: number[] = []
    for (let i = 0; i < NG; i++) {
      const a = (i / NG) * TAU
      c.push(Math.cos(a), Math.sin(a), 0)
    }
    s.poly(c, 1, true)
    return { geo: s.build(), mat: lineMaterial(COLORS.field, 0.3) }
  }, [])
  const ghost = useMemo(() => {
    const s = new Segs().color(COLORS.ink2)
    for (let i = 0; i < NG; i++) s.seg(0, 0, 0, 0, 0, 0, 1, i / NG, (i + 1) / NG)
    return { geo: s.build(true), mat: lineMaterial(COLORS.ink2, 0.8, 1 / 64, 0.5) }
  }, [])
  const arrows = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    for (let i = 0; i < NA * NA * 3; i++) s.seg(0, 0, 0, 0, 0, 0, 1)
    return { geo: s.build(true), mat: lineMaterial(COLORS.field, 0.25) }
  }, [])
  // reduced motion: the half-cycle snapshot (dashed)
  const snap = useMemo(() => {
    const s = new Segs().color(COLORS.ink)
    for (let i = 0; i < NG; i++) s.seg(0, 0, 0, 0, 0, 0, 1, i / NG, (i + 1) / NG)
    return { geo: s.build(true), mat: lineMaterial(COLORS.ink, 0, 1 / 48, 0.5) }
  }, [])
  // Beat 4 wavefronts: square planes (faint iso-grid) with a bright rim, stacked along z
  const planeGeo = useMemo(() => {
    const fill = new THREE.PlaneGeometry(1, 1)
    const s = new Segs().color(COLORS.field)
    s.poly([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 1, true)
    return { fill, rim: s.build() }
  }, [])
  const planeMats = useMemo(
    () =>
      [0, 1, 2].map(() => ({
        fill: createIsoGridMaterial({ grid: [6, 6], lineWidth: 0.8, fill: 0.03, fresnel: 0, opacity: 0, side: THREE.DoubleSide, depthTest: false }),
        rim: lineMaterial(COLORS.field, 0),
      })),
    [],
  )
  // the direction of travel: a Field arrow along +z through the ring's centre
  const zArr = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    const L = 3.4
    s.seg(0, 0, 0, 0, 0, L, 1, 0, 1)
    s.seg(0, 0, L, 0.12, 0, L - 0.22, 1, 1, 1)
    s.seg(0, 0, L, -0.12, 0, L - 0.22, 1, 1, 1)
    s.seg(0, 0, L, 0, 0.12, L - 0.22, 1, 1, 1)
    s.seg(0, 0, L, 0, -0.12, L - 0.22, 1, 1, 1)
    return { geo: s.build(), mat: lineMaterial(COLORS.field, 0), L }
  }, [])

  useChapterFrame(() => {
    const vis = D.ringVis
    const g = group.current
    g.visible = vis > 0.002
    if (!g.visible) return
    const R = D.ringR
    const cx = D.ringX
    const cy = D.ringY
    const W = D.wave
    const w = D.w
    const lab = w[S.lab] + w[S.outro]
    const gs = useGravity.getState()

    // particles
    for (let k = 0; k < NP; k++) {
      const th = (k / NP) * TAU
      displace(W, R * Math.cos(th), R * Math.sin(th), tmp)
      pPos[k * 3] = cx + tmp[0]
      pPos[k * 3 + 1] = cy + tmp[1]
      pPos[k * 3 + 2] = 0.02
      pAlpha[k] = vis
      pSize[k] = 0.16 * (D.mobile ? 1.15 : 1)
    }
    const P = pts.current
    if (P) {
      P.geometry.attributes.position.needsUpdate = true
      P.geometry.attributes.aAlpha.needsUpdate = true
      P.geometry.attributes.aSize.needsUpdate = true
    }

    // reference circle
    ref.mat.uniforms.uOpacity.value = 0.34 * vis
    refLine.current.position.set(cx, cy, 0)
    ringCap.current.position.set(cx, cy - R * (D.mobile ? 1.18 : 1.25), 0)
    refLine.current.scale.setScalar(R)

    // ghost: the unrotated (ψ = 0) pattern at the same phase, linear mode only
    const spin = D.spin
    const ghostOn = lab > 0.5 ? (D.circular ? 0 : D.labLbl) : D.v[S.spin2] * smoothstep(0.44, 0.5, D.sp[S.spin2]) * 0.8
    ghost.mat.uniforms.uOpacity.value = 0.75 * vis * ghostOn
    if (ghostOn > 0.002) {
      waveState(ghostW, spin, false, 0, D.A, D.phi, R)
      outline(ghost.geo, ghostW, cx, cy, R)
    }
    // reduced motion: the story ring is a phase-0 snapshot; overlay the phase-½ one (−H), dashed
    const snapOn = D.reduced && lab < 0.5 ? 1 : 0
    snap.mat.uniforms.uOpacity.value = 0.55 * vis * snapOn
    if (snapOn) {
      snapW.h00 = -W.h00
      snapW.h01 = -W.h01
      snapW.h11 = -W.h11
      snapW.vx = -W.vx
      snapW.vy = -W.vy
      outline(snap.geo, snapW, cx, cy, R)
    }

    // tidal arrows along −(½ H r + v), normalised by ½ A · 1.8, clamped to 0.14 (in units of R)
    const forcesOn = lab > 0.5 ? (gs.forces ? 1 : 0) : D.v[S.spin2] * smoothstep(0.12, 0.22, D.sp[S.spin2]) + (D.b > S.aha ? 0.45 : 0)
    arrows.mat.uniforms.uOpacity.value = 0.3 * vis * forcesOn
    if (forcesOn > 0.002) {
      const ap = arrows.geo.attributes.position.array as Float32Array
      const aa = arrows.geo.attributes.aAlpha.array as Float32Array
      const norm = 0.5 * Math.max(D.A, 1e-3) * 1.8
      const maxL = 0.14 * R
      let o = 0
      let oa = 0
      for (let i = 0; i < NA; i++)
        for (let j = 0; j < NA; j++) {
          const rx = (-1.8 + (3.6 * i) / (NA - 1)) * R
          const ry = (-1.8 + (3.6 * j) / (NA - 1)) * R
          let dx = -(0.5 * (W.h00 * rx + W.h01 * ry) + W.vx) / (norm * R)
          let dy = -(0.5 * (W.h01 * rx + W.h11 * ry) + W.vy) / (norm * R)
          dx *= maxL
          dy *= maxL
          let l = Math.hypot(dx, dy)
          if (l > maxL) {
            dx *= maxL / l
            dy *= maxL / l
            l = maxL
          }
          // keep the ring itself legible: arrows fade near the particles' circle
          const rr = Math.hypot(rx, ry) / R
          // a soft disc of field around the ring (a square grid cut by the frame reads as a HUD)
          const fade = (0.35 + 0.65 * smoothstep(0.08, 0.3, Math.abs(rr - 1))) * (1 - smoothstep(1.4, 1.95, rr))
          const x0 = cx + rx - dx * 0.5
          const y0 = cy + ry - dy * 0.5
          const x1 = cx + rx + dx * 0.5
          const y1 = cy + ry + dy * 0.5
          const ux = l > 1e-5 ? dx / l : 0
          const uy = l > 1e-5 ? dy / l : 0
          const hl = Math.min(0.045 * R, l * 0.45)
          const al = fade * smoothstep(0.004 * R, 0.02 * R, l)
          // shaft
          ap[o++] = x0
          ap[o++] = y0
          ap[o++] = -0.05
          ap[o++] = x1
          ap[o++] = y1
          ap[o++] = -0.05
          // head
          ap[o++] = x1
          ap[o++] = y1
          ap[o++] = -0.05
          ap[o++] = x1 - hl * (ux * 0.866 - uy * 0.5)
          ap[o++] = y1 - hl * (uy * 0.866 + ux * 0.5)
          ap[o++] = -0.05
          ap[o++] = x1
          ap[o++] = y1
          ap[o++] = -0.05
          ap[o++] = x1 - hl * (ux * 0.866 + uy * 0.5)
          ap[o++] = y1 - hl * (uy * 0.866 - ux * 0.5)
          ap[o++] = -0.05
          for (let v = 0; v < 6; v++) aa[oa++] = al
        }
      arrows.geo.attributes.position.needsUpdate = true
      arrows.geo.attributes.aAlpha.needsUpdate = true
    }

    // plane wavefronts (Beat 4): peaks at z = λ (frac(φ/2π) + j − 1.5), crossing z = 0 when cos φ = 1.
    // Seen obliquely they stack along z; face-on (by local p 0.3) they fade, leaving the ring.
    const oblique = Math.min(1, (Math.abs(D.cam.az) + Math.abs(D.cam.pol - Math.PI / 2)) / 0.3)
    const dk = D.v[S.spin2] * vis * oblique
    discs.current.visible = dk > 0.002
    if (discs.current.visible) {
      const lam = 1.7 * R
      const fr = D.reduced ? 0.5 : (((D.phi / TAU) % 1) + 1) % 1
      for (let j = 0; j < 3; j++) {
        const z = lam * (fr + j - 1.5)
        const d = discs.current.children[j]
        d.position.set(cx, cy, z)
        d.scale.setScalar(PLANE * R)
        const f = (1 - smoothstep(0.55 * lam, 1.2 * lam, Math.abs(z))) * dk
        planeMats[j].fill.uniforms.uOpacity.value = 0.42 * f
        planeMats[j].rim.uniforms.uOpacity.value = 0.5 * f
      }
    }
    zArrow.current.position.set(cx, cy, 0)
    zArr.mat.uniforms.uOpacity.value = dk

    // + / × glyph and ψ readout: top-right of the ring in Beat 4, above it beside the triptych (Beat 5, Lab)
    if (w[S.spin2] > 0.5) glyph.current.position.set(cx + R * (D.mobile ? 1.0 : 1.3), cy + R * (D.mobile ? 1.12 : 1.1), 0)
    else if (D.mobile) glyph.current.position.set(cx - R * 1.02, cy + R * 1.02, 0)
    else glyph.current.position.set(cx, cy + R + 0.46, 0)
    pg.api.set(spin === 2 ? D.psi : 0)
    const tri = w[S.spin2] <= 0.5
    if (psiEl.current && psiEl.current.hasAttribute('data-tri') !== tri) psiEl.current.toggleAttribute('data-tri', tri)
    const deg = Math.round((((D.psi * 180) / Math.PI) % 360 + 360) % 360)
    if (deg !== lastPsi.current && psiEl.current) {
      lastPsi.current = deg
      psiEl.current.textContent = `ψ = ${deg}°`
    }
  })

  const glyphOp = () => {
    const v = D.v
    return D.ringVis * (v[S.spin2] * labelFade(S.spin2) * smoothstep(0.15, 0.25, D.sp[S.spin2]) + v[S.aha] * smoothstep(AHA.lock + 0.01, AHA.lock + 0.05, D.sp[S.aha]) + D.labLbl * (D.spin === 2 && !D.circular ? 1 : 0))
  }
  const zOp = () => {
    // only while the arrow's tip projects well outside the ring
    const ob = (Math.abs(D.cam.az) + Math.abs(D.cam.pol - Math.PI / 2)) / 0.3
    return D.v[S.spin2] * labelFade(S.spin2) * smoothstep(0.03, 0.08, D.sp[S.spin2]) * smoothstep(1.7, 2.3, ob)
  }
  return (
    <group ref={group}>
      <GlowPoints ref={pts} positions={pPos} sizes={pSize} alphas={pAlpha} color={COLORS.ink} sharpness={0.92} minPixels={3} maxPixels={22} intensity={1.15} />
      <lineSegments ref={refLine} geometry={ref.geo} material={ref.mat} frustumCulled={false} />
      <lineSegments geometry={ghost.geo} material={ghost.mat} frustumCulled={false} />
      <lineSegments geometry={snap.geo} material={snap.mat} frustumCulled={false} />
      <lineSegments geometry={arrows.geo} material={arrows.mat} frustumCulled={false} />
      <group ref={discs}>
        {planeMats.map((m, j) => (
          <group key={j}>
            <mesh geometry={planeGeo.fill} material={m.fill} />
            <lineSegments geometry={planeGeo.rim} material={m.rim} frustumCulled={false} />
          </group>
        ))}
      </group>
      <group ref={zArrow}>
        <lineSegments geometry={zArr.geo} material={zArr.mat} frustumCulled={false} />
        <SceneLabel position={[0, 0, zArr.L + 0.05]} align="right" tone="field" opacity={zOp} className="gr-zlab">
          Wave moves toward you
          <br />
          stretch is across its path
        </SceneLabel>
      </group>
      <group ref={ringCap}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={() => (D.mobile ? 0 : D.ringVis * D.labLbl)} className="gr-subcap">
          <span className="gr-subcap__scale">Ring ~ LIGO arm · 4 × 10³ <span className="gr-nc">m</span> · not to scale</span>
          <span>Strain exaggerated ~10²⁰× · real ≈ 10⁻²¹</span>
          <span className="gr-subcap__dim">24 free test particles · dashed = <span className="gr-nc">ψ</span> = 0 ghost</span>
        </SceneLabel>
      </group>
      <group ref={glyph}>
        <SceneLabel position={[0, 0, 0]} align="center" tone="ink" opacity={glyphOp} className="gr-glyph">
          <PatternGlyph gref={pg.ref} tone="ink" />
          <span ref={psiEl} className="gr-glyph__psi">
            ψ = 0°
          </span>
        </SceneLabel>
      </group>
    </group>
  )
}
