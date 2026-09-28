import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, useChapterFrame } from '@/gl'
import { lerp, range, sci, smoothstep } from '@/core/math'
import { D } from './director'
import { X_P, X_Y } from './stageConsts'
import { crotchT, T_STAR, T_VERTEX, WAIST_R, Y_SPEED } from './model'
import { pxToWorld, Tag, useDispose, type TagApi } from './parts'

/*
 * Beat 3 loupes. Each is a billboarded disc of constant pixel radius over its subject, drawn after the
 * scene (depth test off) — plain geometry, no render targets. The content inside keeps world orientation,
 * so it is seen from the same angle as the diagram, magnified by z = 10^(3p):
 *   · Y: three straight hairlines — a corner stays a corner at every zoom (scale invariant).
 *   · pants crotch: the surface t = T(x, y) over a disc of radius 1/z ℓ, drawn at loupe scale. Its relief
 *     (T − t*)·z shrinks ∝ 1/z: the saddle flattens into a featureless patch. For z > 20 the analytic
 *     patch ct = t* + 1.522x² − 0.482y² is used (Lab › Model), so no mesh facets can show.
 *   · waist (at ×1000): an ordinary patch of the tube, bent only by 1/R — flat too. SAME.
 */

const GRID = 16
const R_UNIT = 0.8 // at ×1 the loupe spans ±0.8 ℓ

function discMap(u: number, v: number, out: { x: number; y: number }) {
  out.x = u * Math.sqrt(1 - (v * v) / 2)
  out.y = v * Math.sqrt(1 - (u * u) / 2)
}

/** grid lines (rows + columns) on a disc-mapped patch, heights from a callback; returns a LineSegments */
function makePatch(mat: THREE.Material) {
  const n = GRID
  const segs = (n + 1) * n * 2
  const pos = new Float32Array(segs * 2 * 3)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const obj = new THREE.LineSegments(g, mat)
  obj.frustumCulled = false
  obj.renderOrder = 31
  return obj
}

const q = { x: 0, y: 0 }
function fillPatch(obj: THREE.LineSegments, height: (x: number, y: number) => number) {
  const pos = obj.geometry.getAttribute('position') as THREE.BufferAttribute
  const a = pos.array as Float32Array
  const n = GRID
  let o = 0
  const put = (u: number, v: number) => {
    discMap(u, v, q)
    a[o++] = q.x
    a[o++] = height(q.x, q.y)
    a[o++] = q.y
  }
  for (let r = 0; r <= n; r++) {
    const v = (r / n) * 2 - 1
    for (let i = 0; i < n; i++) {
      put((i / n) * 2 - 1, v)
      put(((i + 1) / n) * 2 - 1, v)
      put(v, (i / n) * 2 - 1)
      put(v, ((i + 1) / n) * 2 - 1)
    }
  }
  pos.needsUpdate = true
}

export function Loupe({
  anchor,
  weight,
  label,
  radius = 110,
  children,
  contentRef,
  scaleBar = true,
  zoom,
  text,
}: {
  anchor: () => THREE.Vector3
  weight: () => number
  label: string
  radius?: number
  children: React.ReactNode
  /** content that keeps world orientation (the billboard's rotation is undone); omit for flat 2D content */
  contentRef?: React.RefObject<THREE.Group | null>
  scaleBar?: boolean
  zoom: () => number
  /** replaces the rim's zoom label */
  text?: () => string
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const group = useRef<THREE.Group>(null!)
  const tag = useRef<TagApi>(null)
  const bar = useRef<TagApi>(null)
  const { disc, rim, discMat, rimMat, barObj } = useMemo(() => {
    const discMat = new THREE.MeshBasicMaterial({ color: COLORS.void, transparent: true, opacity: 0, depthTest: false, depthWrite: false })
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 72), discMat)
    disc.renderOrder = 30
    const rimMat = new THREE.LineBasicMaterial({ color: COLORS.field, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })
    const rp: number[] = []
    const n = 96
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2
      const a1 = ((i + 1) / n) * Math.PI * 2
      rp.push(Math.cos(a0), Math.sin(a0), 0, Math.cos(a1), Math.sin(a1), 0)
    }
    // bezel ticks
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2
      const l = k % 6 === 0 ? 0.1 : 0.05
      rp.push(Math.cos(a), Math.sin(a), 0, Math.cos(a) * (1 + l), Math.sin(a) * (1 + l), 0)
    }
    const rg = new THREE.BufferGeometry()
    rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3))
    const rim = new THREE.LineSegments(rg, rimMat)
    rim.renderOrder = 32
    rim.frustumCulled = false
    const bg = new THREE.BufferGeometry()
    bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.25, -0.62, 0, 0.25, -0.62, 0, -0.25, -0.58, 0, -0.25, -0.66, 0, 0.25, -0.58, 0, 0.25, -0.66, 0], 3))
    const barObj = new THREE.LineSegments(bg, rimMat)
    barObj.renderOrder = 32
    return { disc, rim, discMat, rimMat, barObj }
  }, [])
  useDispose(disc, rim, barObj.geometry)
  const pw = useMemo(() => new THREE.Vector3(), [])
  const qi = useMemo(() => new THREE.Quaternion(), [])

  useChapterFrame(
    () => {
      const g = group.current
      const w = weight()
      g.visible = w > 0.003
      if (!g.visible) return
      const a = anchor()
      g.position.copy(a)
      g.parent?.worldToLocal(g.position)
      g.getWorldPosition(pw)
      const rpx = (D.portrait ? radius * 0.72 : radius) * lerp(0.6, 1, w)
      const s = pxToWorld(camera, pw, rpx, size.height)
      g.scale.setScalar(s)
      if (g.parent) g.parent.getWorldQuaternion(g.quaternion).invert().multiply(camera.quaternion)
      else g.quaternion.copy(camera.quaternion)
      discMat.opacity = 0.9 * w
      rimMat.opacity = 0.85 * w
      // content: undo the billboard rotation so it keeps world orientation
      const c = contentRef?.current
      if (c) {
        g.getWorldQuaternion(qi).invert()
        c.quaternion.copy(qi)
      }
      const z = zoom()
      tag.current?.setText(text ? text() : `${label} ×${z >= 999.5 ? '1000' : z >= 10 ? Math.round(z).toString() : z.toFixed(1)}`)
      bar.current?.setText(`${sci(0.5 / z, 2)} ℓ`)
      barObj.visible = scaleBar
    },
    { priority: -0.5 },
  )

  return (
    <group ref={group}>
      <primitive object={disc} />
      <primitive object={rim} />
      <primitive object={barObj} />
      {children}
      <Tag ref={tag} position={[0, 1.2, 0]} align="above" tone="field" opacity={() => weight()} />
      {scaleBar && <Tag ref={bar} position={[0, -0.66, 0]} align="below" tone="dim" opacity={() => weight()} />}
    </group>
  )
}

export function Loupes() {
  const yContent = useRef<THREE.Group>(null)
  const pContent = useRef<THREE.Group>(null)
  const wContent = useRef<THREE.Group>(null)
  const st = useMemo(() => ({ z: -1 }), [])
  const zoom = () => Math.pow(10, 3 * Math.pow(range(D.p.pants, 0.3, 0.76), 1.7))
  const wLoupe = () => D.w.loupes * D.w.hist
  const wWaist = () => wLoupe() * smoothstep(0.76, 0.82, D.p.pants)

  const mats = useMemo(() => {
    const mk = (op = 1) => new THREE.LineBasicMaterial({ color: COLORS.field, transparent: true, opacity: op, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })
    return { y: mk(), p: mk(), w: mk(), bracket: mk() }
  }, [])
  const yLines = useMemo(() => {
    // incoming from below, two branches at ±0.45c — identical at every zoom
    const k = 1 / Math.hypot(Y_SPEED, 1)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.82, 0, 0, 0, 0, 0, 0, 0, -Y_SPEED * k * 0.82, k * 0.82, 0, 0, 0, 0, Y_SPEED * k * 0.82, k * 0.82, 0], 3))
    const o = new THREE.LineSegments(g, mats.y)
    o.renderOrder = 31
    o.frustumCulled = false
    return o
  }, [mats])
  const pPatch = useMemo(() => makePatch(mats.p), [mats])
  const wPatch = useMemo(() => makePatch(mats.w), [mats])
  const bracket = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3))
    const o = new THREE.LineSegments(g, mats.bracket)
    o.renderOrder = 32
    o.frustumCulled = false
    return o
  }, [mats])
  useDispose(mats.y, mats.p, mats.w, mats.bracket, yLines.geometry, pPatch.geometry, wPatch.geometry, bracket.geometry)
  const sameTag = useRef<TagApi>(null)

  const aY = useMemo(() => new THREE.Vector3(X_Y, T_VERTEX, 0), [])
  const aP = useMemo(() => new THREE.Vector3(X_P, T_STAR, 0), [])
  const aW = useMemo(() => new THREE.Vector3(X_P + 3.3, 1.2, 2.4), [])
  const waistPoint = useMemo(() => new THREE.Vector3(X_P + WAIST_R * 0.75, 2.0, WAIST_R * 0.66), [])

  useChapterFrame(() => {
    const w = wLoupe()
    if (w <= 0.003) return
    const z = zoom()
    const s = 0.8 // content radius in loupe units
    if (Math.abs(z - st.z) > 1e-6) {
      st.z = z
      const r = R_UNIT / z
      // crotch: relief (T − t*)/r in units of the loupe radius → ∝ r, flattens as the zoom grows
      fillPatch(pPatch, (x, y) => {
        const X = x * r
        const Y = y * r
        const dt = z > 20 ? 1.522 * X * X - 0.482 * Y * Y : crotchT(X, Y) - T_STAR
        return Math.max(-1.4, Math.min(1.4, dt / r))
      })
      // waist: a patch of the tube, bent by 1/R only (shown in its own tangent frame, like the crotch)
      fillPatch(wPatch, (x) => {
        const X = x * r
        return -((X * X) / (2 * WAIST_R)) / r
      })
    }
    for (const c of [yContent.current, pContent.current, wContent.current]) c?.scale.setScalar(s)
    mats.y.opacity = w
    mats.p.opacity = 0.9 * w
    mats.w.opacity = 0.9 * wWaist()
    // bracket crotch-loupe ↔ waist-loupe, labelled SAME
    const wb = wWaist()
    mats.bracket.opacity = 0.6 * wb
    const pos = bracket.geometry.getAttribute('position') as THREE.BufferAttribute
    pos.setXYZ(0, waistPoint.x, waistPoint.y, waistPoint.z)
    pos.setXYZ(1, aW.x - 0.7, aW.y + 0.1, aW.z)
    pos.setXYZ(2, aP.x + 0.9, aP.y - 0.9, aP.z + 0.6)
    pos.setXYZ(3, aW.x - 0.1, aW.y + 0.75, aW.z)
    pos.needsUpdate = true
    sameTag.current?.group.position.set(lerp(aP.x + 0.9, aW.x - 0.1, 0.5) + 0.15, lerp(aP.y - 0.9, aW.y + 0.75, 0.5), lerp(aP.z + 0.6, aW.z, 0.5))
  })

  return (
    <group>
      <Loupe anchor={() => aY} weight={wLoupe} label="VERTEX" zoom={zoom} contentRef={yContent}>
        <group ref={yContent}>
          <primitive object={yLines} />
        </group>
      </Loupe>
      <Loupe anchor={() => aP} weight={wLoupe} label="CROTCH" zoom={zoom} contentRef={pContent}>
        <group ref={pContent}>
          <primitive object={pPatch} />
        </group>
      </Loupe>
      <Loupe anchor={() => aW} weight={wWaist} label="WAIST" zoom={zoom} contentRef={wContent} scaleBar={false} radius={82}>
        <group ref={wContent}>
          <primitive object={wPatch} />
        </group>
      </Loupe>
      <primitive object={bracket} />
      <Tag ref={sameTag} align="left" tone="ink" opacity={() => wWaist()}>
        SAME
      </Tag>
    </group>
  )
}
