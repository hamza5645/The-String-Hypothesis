import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, GlowPoint, useChapterFrame, type GlowPointApi } from '@/gl'
import { smoothstep } from '@/core/math'
import { D } from './director'
import { Loupe } from './Loupes'
import { T_STAR, Y_SPEED } from './model'
import { screenOffset, Tag, useDispose, type TagApi } from './parts'
import { X_P } from './stageConsts'

const TAN30 = Math.tan(Math.PI / 6)
const TRAIL_N = 72

/**
 * Beat 4's comparison, kept in view while the camera closes in on the pants: a small loupe, anchored on
 * screen beside the crotch, with the particle Y in side view (x–ct, time up). For each tilt the "now" is
 * drawn through its split moment (slope tan 30°·cos φ in this plane) — and every one of them splits the Y
 * at the same event, the vertex. Its one dot pulses as each new tilt lands on it, while the pants' smear
 * grows a new dot per tilt.
 */
export function YInset() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const dot = useRef<GlowPointApi>(null)
  const count = useRef<TagApi>(null)
  const st = useMemo(() => ({ n: -1, anchor: new THREE.Vector3(), crotch: new THREE.Vector3() }), [])

  const { yLines, nowLine, ring, matY, matN, matR } = useMemo(() => {
    const mk = () => new THREE.LineBasicMaterial({ color: COLORS.field, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })
    const matY = mk()
    const matN = mk()
    const matR = mk()
    const k = 1 / Math.hypot(Y_SPEED, 1)
    const r = 0.8
    const gy = new THREE.BufferGeometry()
    gy.setAttribute('position', new THREE.Float32BufferAttribute([0, -r, 0, 0, 0, 0, 0, 0, 0, -Y_SPEED * k * r, k * r, 0, 0, 0, 0, Y_SPEED * k * r, k * r, 0], 3))
    const yLines = new THREE.LineSegments(gy, matY)
    const gn = new THREE.BufferGeometry()
    gn.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    const nowLine = new THREE.LineSegments(gn, matN)
    // the split marker: a crosshair-ring at the vertex (as on the 3D histories)
    const rp: number[] = []
    for (let i = 0; i < 40; i++) {
      const a0 = (i / 40) * Math.PI * 2
      const a1 = ((i + 1) / 40) * Math.PI * 2
      rp.push(Math.cos(a0), Math.sin(a0), 0, Math.cos(a1), Math.sin(a1), 0)
    }
    for (let q = 0; q < 4; q++) {
      const a = (q / 4) * Math.PI * 2 + Math.PI / 4
      rp.push(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0, Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0)
    }
    const gr = new THREE.BufferGeometry()
    gr.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3))
    const ring = new THREE.LineSegments(gr, matR)
    for (const o of [yLines, nowLine, ring]) {
      o.renderOrder = 31
      o.frustumCulled = false
    }
    return { yLines, nowLine, ring, matY, matN, matR }
  }, [])
  useDispose(yLines, nowLine, ring)
  useLayoutEffect(() => {
    const m = dot.current?.material
    if (m) m.depthTest = false
  }, [])

  const weight = () => D.w.hist * D.w.planes * (D.sl.showPants ? 1 : 0) * (D.sl.mode === 0 ? 1 : 0) * smoothstep(0.3, 0.9, D.closeup)
  // screen-anchored: beside the pants' crotch (left and a little below on desktop; above-left on phones)
  const anchor = () => {
    st.crotch.set(X_P, T_STAR, 0)
    const w = size.width
    st.anchor.copy(st.crotch).project(camera)
    const sx = (0.5 + 0.5 * st.anchor.x) * w
    const sy = (0.5 - 0.5 * st.anchor.y) * size.height
    // phones: top-left of the free band, far enough in for its labels (≈ 190 px wide) to stay on screen
    if (D.portrait) return screenOffset(camera, st.crotch, Math.max(104, sx - 0.3 * w) - sx, 0.1 * size.height + 76 - sy, size.height, st.anchor)
    // desktop: ~290 px left of the crotch, but never into the text column (its right edge ≈ 0.345·W)
    return screenOffset(camera, st.crotch, Math.max(0.345 * w + 82, sx - 290) - sx, 105, size.height, st.anchor)
  }

  useChapterFrame(
    () => {
      const w = weight()
      if (w <= 0.003) return
      matY.opacity = 0.9 * w
      // this tilt's "now" through the vertex: slope tan 30°·cos φ in the Y's x–ct plane
      const m = TAN30 * Math.cos(D.sl.phi)
      const L = 0.86 / Math.hypot(1, m)
      const p = nowLine.geometry.getAttribute('position') as THREE.BufferAttribute
      p.setXYZ(0, -L, -L * m, 0)
      p.setXYZ(1, L, L * m, 0)
      p.needsUpdate = true
      matN.opacity = 0.5 * w
      // the one dot: every tilt lands here; it pulses as each new tilt arrives (scroll-driven)
      const reach = D.sl.trail * TRAIL_N
      const n = Math.min(TRAIL_N, Math.floor(reach + 0.5))
      const frac = reach - Math.floor(reach)
      const pulse = n > 0 && n < TRAIL_N ? 1 - smoothstep(0, 0.45, frac) : 0
      if (dot.current) dot.current.material.uniforms.uIntensity.value = w * (n > 0 ? 1.1 + 0.9 * pulse : 0.3)
      ring.scale.setScalar(0.085 * (1 + 0.45 * pulse))
      matR.opacity = w * (n > 0 ? 0.75 + 0.25 * pulse : 0.35)
      if (n !== st.n && count.current?.text) {
        st.n = n
        count.current?.setText(`${n} ${n === 1 ? 'TILT' : 'TILTS'} · 1 SPLIT POINT`)
      }
    },
    { priority: -0.6 },
  )

  return (
    <Loupe anchor={anchor} weight={weight} label="" radius={68} scaleBar={false} zoom={() => 1} text={() => 'PARTICLES · A VERTEX'}>
      <primitive object={yLines} />
      <primitive object={nowLine} />
      <primitive object={ring} />
      <GlowPoint ref={dot} size={0.16} minPixels={2.4} color={COLORS.field} coreColor="#e4eefb" intensity={0} renderOrder={33} />
      <Tag ref={count} position={[0, -1.22, 0]} align="below" tone="field" opacity={() => weight() * (1 - D.textRise)} />
    </Loupe>
  )
}
