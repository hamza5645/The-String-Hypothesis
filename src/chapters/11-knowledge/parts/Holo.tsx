import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createIsoGridMaterial, Filament, GlowPoints, useChapterFrame, type FilamentApi, type GlowPointsApi } from '@/gl'
import { rng, smoothstep } from '@/core/math'
import { footprint } from '../model'
import { circlePts, createLineMaterial, LineBuilder } from '../gl/lines'
import { el, type LabelLayer, type Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * Beat 4 · A world inside a box (Model §8): the "can" — AdS drawn with two space directions and
 * time running up. Three slices are Poincaré disks; the middle one carries 14 hyperbolic geodesics
 * (circle arcs meeting the rim at right angles: faithful geometry). A warm closed loop sinks from
 * r = 0.85 to 0.10; the 24-point arc on the wall has half-width θ(r) = π/2 − 2·arctan(r), and the
 * geodesic joining its ends passes exactly through the loop (closest approach sec θ − tan θ = r).
 */

export const HOLO_AT: [number, number, number] = [0, 3.3, 3.6]
const R = 1.0
const HGT = 1.8
const PHI0 = Math.PI / 2 - 0.35 // the loop's direction: toward the camera, a little to the right
const ARC_PTS = 24
const GEO_SEG = 48

/**
 * The geodesic with endpoints at angles φ ± θ on the rim: the circle centred at distance sec θ in
 * direction φ with radius tan θ (orthogonal to the rim). Writes n+1 points (xyz) into `out`.
 */
function geodesicInto(out: Float32Array, phi: number, theta: number, y: number, n = GEO_SEG) {
  const d = 1 / Math.cos(theta)
  const rad = Math.tan(theta)
  const cx = Math.cos(phi) * d
  const cz = Math.sin(phi) * d
  const a0 = Math.atan2(Math.sin(phi - theta) - cz, Math.cos(phi - theta) - cx)
  const a1 = Math.atan2(Math.sin(phi + theta) - cz, Math.cos(phi + theta) - cx)
  // sweep the short way, through the side facing the centre
  let da = a1 - a0
  while (da > Math.PI) da -= Math.PI * 2
  while (da < -Math.PI) da += Math.PI * 2
  for (let i = 0; i <= n; i++) {
    const a = a0 + (da * i) / n
    out[i * 3] = (cx + Math.cos(a) * rad) * R
    out[i * 3 + 1] = y
    out[i * 3 + 2] = (cz + Math.sin(a) * rad) * R
  }
  return out
}
const geodesic = (phi: number, theta: number, y: number) => {
  const f = geodesicInto(new Float32Array((GEO_SEG + 1) * 3), phi, theta, y)
  const pts: number[][] = []
  for (let i = 0; i <= GEO_SEG; i++) pts.push([f[i * 3], f[i * 3 + 1], f[i * 3 + 2]])
  return pts
}

export function Holo({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const root = useRef<THREE.Group>(null!)
  const loop = useRef<FilamentApi>(null)
  const arcPts = useRef<GlowPointsApi>(null)

  const res = useMemo(() => {
    const wallGeo = new THREE.CylinderGeometry(R, R, HGT, 96, 1, true)
    const wallMat = createIsoGridMaterial({ grid: [32, 6], lineWidth: 0.6, fill: 0.035, fresnel: 0.22, color: '#86A8D8', lineColor: '#152030' })
    const L = new LineBuilder()
    for (const y of [-HGT / 2, 0, HGT / 2]) L.add(circlePts(R, y, 160), { color: '#86A8D8', alpha: y === 0 ? 0.95 : 0.55, width: y === 0 ? 1.3 : 1, yref: 'none' })
    // 14 decorative geodesics on the middle disk (seeded)
    const r = rng(1997)
    for (let i = 0; i < 14; i++) {
      const phi = r() * Math.PI * 2
      const th = 0.25 + r() * 1.05
      L.add(geodesic(phi, th, 0), { color: '#86A8D8', alpha: 0.32, width: 1, yref: 'none' })
    }
    // faint geodesics on the top and bottom slices (they are Poincaré disks too)
    for (const y of [-HGT / 2, HGT / 2])
      for (let i = 0; i < 5; i++) {
        const phi = r() * Math.PI * 2
        L.add(geodesic(phi, 0.4 + r() * 0.8, y), { color: '#86A8D8', alpha: 0.14, width: 1, yref: 'none' })
      }
    // time arrow at the side
    const TX = -R - 0.16
    L.add(
      [
        [TX, -HGT / 2 + 0.1, 0.35],
        [TX, HGT / 2 - 0.05, 0.35],
      ],
      { color: '#9AA0AE', alpha: 0.55, width: 1, yref: 'none' },
    )
    L.add(
      [
        [TX - 0.045, HGT / 2 - 0.15, 0.35],
        [TX, HGT / 2 - 0.05, 0.35],
        [TX + 0.045, HGT / 2 - 0.15, 0.35],
      ],
      { color: '#9AA0AE', alpha: 0.55, width: 1, yref: 'none' },
    )
    const staticGeo = L.build()
    const staticMat = createLineMaterial()
    // the live geodesic through the loop (dynamic, same topology every frame)
    const G = new LineBuilder().add(geodesic(PHI0, 0.5, 0), { color: '#86A8D8', alpha: 1, width: 1.5, glow: 5, yref: 'none' })
    const liveGeo = G.build()
    const liveMat = createLineMaterial()
    const diskGeo = new THREE.CircleGeometry(R, 96)
    diskGeo.rotateX(-Math.PI / 2)
    const diskMat = createIsoGridMaterial({ grid: [0, 0], fill: 0.05, fresnel: 0, color: '#86A8D8' })
    const ptsPos = new Float32Array(ARC_PTS * 3)
    const live = new Float32Array((GEO_SEG + 1) * 3)
    return { live, wallGeo, wallMat, staticGeo, staticMat, liveGeo, liveMat, diskGeo, diskMat, ptsPos }
  }, [])
  useLayoutEffect(
    () => () => {
      res.wallGeo.dispose()
      res.wallMat.dispose()
      res.staticGeo.dispose()
      res.staticMat.dispose()
      res.liveGeo.dispose()
      res.liveMat.dispose()
      res.diskGeo.dispose()
      res.diskMat.dispose()
    },
    [res],
  )
  const loopPts = useMemo(() => new Float32Array(96 * 3), [])

  const lbl = useMemo(() => {
    if (!layer) return null
    const inside = layer.add({ text: 'INSIDE · STRING THEORY ON AdS₅ × S⁵', sub: 'WITH GRAVITY' }, [0, 0, 0], { cls: 'kn-lbl--warm kn-lbl--right', align: 'right', dx: 14, dy: -18 })
    const boundary = layer.add({ text: 'BOUNDARY · 4D QUANTUM FIELD THEORY', sub: 'NO GRAVITY' }, [0, 0, 0], { cls: 'kn-lbl--t0', align: 'left', dx: 14 })
    const time = layer.add({ text: 'TIME ↑' }, [0, 0, 0], { cls: 'kn-lbl--dim', align: 'right', dx: 10, safe: false })
    const caption = layer.add({ text: 'DEEPER INSIDE ↔ LARGER PATTERN ON THE BOUNDARY' }, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'center', cls: 'kn-lbl--field kn-lbl--md' })
    const note = el('div', 'kn-note', [
      el('div', '', [el('b', '', 'QUARK–GLUON PLASMA · OBSERVED ●'), el('br'), 'INFERRED η/s ≈ 0.06–0.11 · MODEL-DEPENDENT']),
      el('div', '', [el('b', '', 'HOLOGRAPHIC VALUE 1/4π ≈ 0.080')]),
      el('em', '', 'SIMILAR, NOT A TEST OF STRINGS'),
    ])
    const qgp = layer.add(note, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'left', dx: 0.001, cls: 'kn-lbl--hud' })
    const ours = layer.add({ text: 'OUR UNIVERSE · Λ > 0', sub: 'NOT ANTI-DE SITTER' }, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'left', dx: 0.001, cls: 'kn-lbl--t0' })
    return { inside, boundary, time, caption, qgp, ours } as Record<string, Lbl>
  }, [layer])

  const v = useMemo(() => new THREE.Vector3(), [])

  useChapterFrame(
    (f) => {
      const H = S.holo
      const g = root.current
      const on = H.grow > 0.001
      g.visible = on
      if (lbl) {
        lbl.inside.target = lbl.boundary.target = lbl.time.target = 0
        lbl.caption.target = lbl.qgp.target = lbl.ours.target = 0
      }
      if (!on) return
      g.scale.set(1, Math.max(1e-3, H.grow), 1)
      const fade = smoothstep(0, 0.5, H.grow)
      res.wallMat.uniforms.uOpacity.value = fade
      res.staticMat.uniforms.uOpacity.value = fade
      res.diskMat.uniforms.uOpacity.value = fade
      res.liveMat.uniforms.uOpacity.value = fade
      const r = H.r
      const th = footprint(r)
      // live geodesic
      const P = geodesicInto(res.live, PHI0, th, 0)
      const A = res.liveGeo.getAttribute('aA') as THREE.InstancedBufferAttribute
      const B = res.liveGeo.getAttribute('aB') as THREE.InstancedBufferAttribute
      for (let i = 0; i < GEO_SEG; i++) {
        A.setXYZ(i, P[i * 3], P[i * 3 + 1], P[i * 3 + 2])
        B.setXYZ(i, P[i * 3 + 3], P[i * 3 + 4], P[i * 3 + 5])
      }
      A.needsUpdate = true
      B.needsUpdate = true
      // 24 ink points on the wall: φ₀ + θ·(2i/23 − 1)
      for (let i = 0; i < ARC_PTS; i++) {
        const a = PHI0 + th * ((2 * i) / (ARC_PTS - 1) - 1)
        res.ptsPos[i * 3] = Math.cos(a) * R
        res.ptsPos[i * 3 + 1] = 0
        res.ptsPos[i * 3 + 2] = Math.sin(a) * R
      }
      const ap = arcPts.current
      if (ap) {
        ;(ap.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
        ap.material.uniforms.uIntensity.value = fade * 1.1
      }
      // the warm closed loop (radius 0.07) at radius r toward φ₀
      const lx = Math.cos(PHI0) * r * R
      const lz = Math.sin(PHI0) * r * R
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2
        const w = 1 + 0.08 * Math.sin(3 * a + f.t * 1.6)
        loopPts[i * 3] = lx + Math.cos(a) * 0.07 * w
        loopPts[i * 3 + 1] = 0.012 * Math.sin(2 * a + f.t * 1.3)
        loopPts[i * 3 + 2] = lz + Math.sin(a) * 0.07 * w
      }
      loop.current?.update()
      if (loop.current) loop.current.material.uniforms.uOpacity.value = fade

      if (!lbl) return
      const [cx, cy, cz] = HOLO_AT
      const on2 = H.labels
      lbl.inside.pos.set(cx + lx + 0.05, cy + 0.04, cz + lz)
      lbl.inside.target = on2
      // the boundary pattern's right end (angles decrease toward screen-right from the front)
      const wa = PHI0 - th - 0.1
      lbl.boundary.pos.set(cx + Math.cos(wa) * R * 1.02, cy + 0.02, cz + Math.sin(wa) * R * 1.02)
      lbl.boundary.target = on2
      lbl.time.pos.set(cx - R - 0.16, cy + HGT / 2 - 0.02, cz + 0.35)
      lbl.time.target = on2 * 0.9
      // screen anchors
      v.set(cx, cy - HGT / 2, cz).applyMatrix4(g.parent!.matrixWorld).project(f.state.camera)
      const bx = (v.x * 0.5 + 0.5) * S.W
      const by = (0.5 - v.y * 0.5) * S.H
      lbl.caption.x = bx
      lbl.caption.y = Math.min(by + 44, S.H - 70)
      lbl.caption.target = on2 * smoothstep(0.34, 0.44, S.sp.hologram)
      // side annotations: top-right, clear of the can and the chapter rail
      const noteX = S.W - 340
      lbl.qgp.x = noteX
      lbl.qgp.y = 150
      lbl.qgp.target = H.ann * (S.mobile ? 0 : 1)
      lbl.ours.x = noteX + 14
      lbl.ours.y = 262
      lbl.ours.target = H.ann * (S.mobile ? 0 : 1)
    },
    { priority: -1.5 },
  )

  return (
    <group ref={root} position={HOLO_AT} visible={false}>
      <mesh geometry={res.wallGeo} material={res.wallMat} renderOrder={2} frustumCulled={false} />
      <mesh geometry={res.diskGeo} material={res.diskMat} renderOrder={2} frustumCulled={false} />
      <mesh geometry={res.staticGeo} material={res.staticMat} renderOrder={3} frustumCulled={false} />
      <mesh geometry={res.liveGeo} material={res.liveMat} renderOrder={4} frustumCulled={false} />
      <GlowPoints ref={arcPts} positions={res.ptsPos} size={0.05} minPixels={2.2} maxPixels={6} color="#ECE6D9" intensity={1} sharpness={0.6} />
      <Filament ref={loop} points={loopPts} count={96} closed width={0.03} minPixels={1.2} intensity={1.3} renderOrder={6} />
    </group>
  )
}
