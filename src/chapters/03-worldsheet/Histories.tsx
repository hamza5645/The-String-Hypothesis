import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, Filament, GlowPoints, useChapterFrame, type FilamentApi, type GlowPointsApi } from '@/gl'
import { lerp, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { D } from './director'
import { createNowMaterial, createSheetMaterial, lineMaterial, makeLine, makeSegments } from './gl'
import { createSlicer, crotchT, pantsField, signed, sliceY, solveSplit, T_STAR, T_VERTEX, Y_SPEED, type Split } from './model'
import { Marker, screenOffset, Tag, useDispose, type MarkerApi, type TagApi } from './parts'
import { X_P, X_Y } from './stageConsts'
import { MAX_MARKS, useWorldsheet } from './store'
import { useImplicitMesh } from './useImplicitMesh'

const yFlash = (w: number) => {
  const d = (D.sl.t0 - T_VERTEX) / w
  return Math.exp(-d * d)
}
const DEG = Math.PI / 180
const TRAIL_N = 72

/* ───────────────────────── the NOW plane (7 × 4, in the history's own coordinates) ───────────────────────── */

function NowPlane({ show, labelX = 3.5 }: { show: () => number; labelX?: number }) {
  const mat = useMemo(() => createNowMaterial(), [])
  useDispose(mat)
  const mesh = useRef<THREE.Mesh>(null!)
  const tag = useRef<TagApi>(null)
  useChapterFrame(() => {
    const k = show()
    mesh.current.visible = k > 0.003
    if (!mesh.current.visible) return
    const s = D.sl
    const tn = Math.tan(s.theta)
    const a = tn * Math.cos(s.phi)
    const b = tn * Math.sin(s.phi)
    mat.uniforms.uPlane.value.set(s.t0, a, b)
    mat.uniforms.uOpacity.value = k
    // label on a front corner (x = ±3.5, y = +2 → world z = +2)
    tag.current?.group.position.set(labelX, s.t0 + a * labelX + b * 2, 2)
  })
  return (
    <>
      <mesh ref={mesh} material={mat} renderOrder={3}>
        <planeGeometry args={[7, 4, 1, 1]} />
      </mesh>
      <Tag ref={tag} align="left" tone="field" opacity={() => show() * 0.95 * (1 - D.closeup)}>
        NOW
      </Tag>
    </>
  )
}

/* ───────────────────────── the particle "Y" (a vertex) ───────────────────────── */

export function YHistory() {
  const group = useRef<THREE.Group>(null!)
  const marker = useRef<MarkerApi>(null)
  const readout = useRef<TagApi>(null)
  const splitTag = useRef<TagApi>(null)
  const lights = useRef<GlowPointsApi>(null)
  const dots = useRef<GlowPointsApi>(null)
  const trailDot = useRef<GlowPointsApi>(null)
  const yOut = useMemo(() => new Float64Array(4), [])
  const seenTag = useRef<TagApi>(null)
  const st = useMemo(() => ({ seen: -1 }), [])
  const { lines, mat } = useMemo(() => {
    const mat = lineMaterial(COLORS.field, 0)
    const tEnd = 10
    const dx = Y_SPEED * (tEnd - T_VERTEX)
    const lines = makeSegments([0, 0, 0, 0, T_VERTEX, 0, 0, T_VERTEX, 0, -dx, tEnd, 0, 0, T_VERTEX, 0, dx, tEnd, 0], mat)
    return { lines, mat }
  }, [])
  useDispose(lines)
  const lp = useMemo(() => ({ positions: new Float32Array(9), alphas: new Float32Array(3) }), [])
  const dp = useMemo(() => ({ positions: new Float32Array(6), alphas: new Float32Array(2) }), [])
  const tp = useMemo(() => ({ positions: new Float32Array([0, T_VERTEX, 0]), alphas: new Float32Array(1) }), [])

  useChapterFrame(({ t }) => {
    const w = D.w.hist * D.yFade
    const vis = w * (D.sl.showY ? 1 : 0)
    group.current.visible = vis > 0.003
    if (!group.current.visible) return
    mat.opacity = 0.85 * vis
    // B3: points of light travel up the lines and split at the vertex (a looping cartoon)
    const trav = vis * (1 - smoothstep(0.02, 0.08, D.p.now)) * smoothstep(0.02, 0.1, D.p.pants)
    const la = lights.current?.geometry.getAttribute('aAlpha') as THREE.BufferAttribute | undefined
    const lpos = lights.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined
    if (la && lpos) {
      const ct = ambient() ? ((t * 1.6) % 11) - 0.5 : 7.8
      const before = ct < T_VERTEX
      const x = Y_SPEED * Math.max(0, ct - T_VERTEX)
      const P = lp.positions
      P[1] = ct
      P[3] = -x
      P[4] = ct
      P[6] = x
      P[7] = ct
      const edge = smoothstep(-0.5, 0.2, ct) * (1 - smoothstep(9.6, 10.2, ct))
      lp.alphas[0] = before ? trav * edge : 0
      lp.alphas[1] = lp.alphas[2] = before ? 0 : trav * edge
      lpos.needsUpdate = true
      la.needsUpdate = true
    }
    // the slice of the Y by this "now": one dot, then two
    const n = sliceY(D.sl.t0, D.sl.theta, D.sl.phi, yOut)
    const pk = D.w.planes * vis
    const dpos = dots.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined
    const da = dots.current?.geometry.getAttribute('aAlpha') as THREE.BufferAttribute | undefined
    if (dpos && da) {
      const Q = dp.positions
      Q[0] = yOut[0]
      Q[1] = yOut[1]
      Q[3] = n > 1 ? yOut[2] : 0
      Q[4] = n > 1 ? yOut[3] : 0
      dp.alphas[0] = pk
      dp.alphas[1] = n > 1 ? pk : 0
      dpos.needsUpdate = true
      da.needsUpdate = true
    }
    // the split is always at the vertex, for every tilt
    const dv = (D.sl.t0 - T_VERTEX) / 0.05
    const flash = Math.exp(-dv * dv)
    marker.current?.set(0, T_VERTEX, 0, lerp(7, 10, flash), pk * lerp(0.35, 1, flash))
    splitTag.current?.group.position.set(0.3, T_VERTEX + 0.28, 0)
    // trail: every slicing's split lands on the same event
    const lab = useWorldsheet.getState()
    const trail = D.sl.mode === 1 ? (lab.yMarks > 0 ? 1 : 0) : D.sl.trail > 0 ? 1 : 0
    const ta = trailDot.current?.geometry.getAttribute('aAlpha') as THREE.BufferAttribute | undefined
    if (ta) {
      tp.alphas[0] = trail * pk
      ta.needsUpdate = true
    }
    readout.current?.setText(`SPLIT SEEN AT x 0.00 · y 0.00 · ct ${T_VERTEX.toFixed(2)}`)
    // lab: how many splits this visitor has witnessed, and where they all landed
    if (lab.yMarks !== st.seen && seenTag.current?.text) {
      st.seen = lab.yMarks
      seenTag.current.setText(`${lab.yMarks} ${lab.yMarks === 1 ? 'SPLIT' : 'SPLITS'} SEEN · ALL AT 1 POINT`)
    }
  })

  return (
    <group ref={group} position={[X_Y, 0, 0]}>
      <primitive object={lines} />
      <GlowPoints ref={lights} positions={lp.positions} alphas={lp.alphas} size={0.24} minPixels={2.2} color={COLORS.ink} />
      <GlowPoints ref={dots} positions={dp.positions} alphas={dp.alphas} size={0.3} minPixels={2.6} color={COLORS.ink} />
      <GlowPoints ref={trailDot} positions={tp.positions} alphas={tp.alphas} size={0.16} minPixels={2.4} color={COLORS.field} sharpness={1} intensity={1.4} />
      <Marker ref={marker} />
      <NowPlane show={() => D.w.planes * D.w.hist * D.yFade * (D.sl.showY ? 1 : 0)} />
      <Tag ref={splitTag} align="left" tone="field" opacity={() => D.w.planes * D.w.hist * D.yFade * (D.sl.showY ? 1 : 0) * yFlash(0.08)}>
        SPLIT
      </Tag>
      <Tag ref={readout} position={[0, -0.7, 0]} align="center" tone="field" opacity={() => D.w.hist * D.yFade * (D.sl.showY ? 1 : 0) * Math.max(smoothstep(0.28, 0.34, D.p.now), D.w.lab)} />
      <Tag position={[0, 11.2, 0]} align="center" tone="ink" opacity={() => D.w.hist * D.yFade * (D.sl.showY ? 1 : 0) * (1 - D.w.lab) * (1 - smoothstep(0.5, 0.58, D.p.now))}>
        PARTICLES · A VERTEX
      </Tag>
      <Tag ref={seenTag} position={[0, -1.25, 0]} align="center" tone="ink" opacity={() => D.w.lab * D.w.hist * (D.sl.showY ? 1 : 0) * (useWorldsheet.getState().yMarks > 0 ? 0.9 : 0)} />
    </group>
  )
}

/* ───────────────────────── the pants (a pair of pants: one loop → two) ───────────────────────── */

const NF = 180
/** smear outline + dimension marks: world units above the surface, so they read over the film */
const LIFT = 0.012

export function PantsHistory() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const group = useRef<THREE.Group>(null!)
  const geo = useImplicitMesh('pants')
  const mat = useMemo(() => createSheetMaterial(), [])
  const fa = useRef<FilamentApi>(null)
  const fb = useRef<FilamentApi>(null)
  const outline = useRef<FilamentApi>(null)
  const marker = useRef<MarkerApi>(null)
  const readout = useRef<TagApi>(null)
  const splitTag = useRef<TagApi>(null)
  const countTag = useRef<TagApi>(null)
  const seenTag = useRef<TagApi>(null)
  const caption = useRef<TagApi>(null)
  const trail = useRef<GlowPointsApi>(null)
  const marks = useRef<GlowPointsApi>(null)
  const smearMesh = useRef<THREE.Mesh>(null!)
  const ptsA = useMemo(() => new Float32Array(NF * 3), [])
  const ptsB = useMemo(() => new Float32Array(NF * 3), [])
  const slicer = useMemo(() => createSlicer(), [])
  const cum = useMemo(() => new Float32Array(3000), [])
  const st = useMemo(() => ({ t0: NaN, th: NaN, ph: NaN, n: 0, marksRef: null as number[] | null, count: -1, seen: -1, distinct: -1 }), [])
  const v = useMemo(() => ({ crotch: new THREE.Vector3(), out: new THREE.Vector3() }), [])

  // scripted trail for Beat 4: the split for θ = 30° and every φ (5° apart); plus the "smear" wash inside it
  const tr = useMemo(() => {
    const positions = new Float32Array(TRAIL_N * 3)
    const alphas = new Float32Array(TRAIL_N)
    const s: Split = { x: 0, y: 0, t: 0, t0: 0 }
    const curve = new Float32Array((TRAIL_N + 1) * 3)
    const ring = new Float32Array(TRAIL_N * 3)
    let x0 = 0
    let x1 = 0
    let y0 = 0
    let y1 = 0
    for (let i = 0; i < TRAIL_N; i++) {
      solveSplit(30 * DEG, i * 5 * DEG, s, s)
      positions.set([s.x, s.t, s.y], i * 3)
      curve.set([s.x, s.t + 0.004, s.y], i * 3)
      ring.set([s.x, s.t + LIFT, s.y], i * 3)
      x0 = Math.min(x0, s.x)
      x1 = Math.max(x1, s.x)
      y0 = Math.min(y0, s.y)
      y1 = Math.max(y1, s.y)
    }
    curve.set(curve.subarray(0, 3), TRAIL_N * 3)
    // wash: a fan hugging the surface t = T(x, y) from the crotch out to the curve
    const R = 6
    const wp: number[] = [0, crotchT(0, 0) + 0.003, 0]
    const idx: number[] = []
    for (let r = 1; r <= R; r++)
      for (let i = 0; i < TRAIL_N; i++) {
        const f = r / R
        const x = positions[i * 3] * f
        const y = positions[i * 3 + 2] * f
        wp.push(x, crotchT(x, y) + 0.003, y)
      }
    for (let i = 0; i < TRAIL_N; i++) idx.push(0, 1 + i, 1 + ((i + 1) % TRAIL_N))
    for (let r = 1; r < R; r++)
      for (let i = 0; i < TRAIL_N; i++) {
        const a = 1 + (r - 1) * TRAIL_N + i
        const b = 1 + (r - 1) * TRAIL_N + ((i + 1) % TRAIL_N)
        const c = a + TRAIL_N
        const d = b + TRAIL_N
        idx.push(a, c, d, a, d, b)
      }
    const wash = new THREE.BufferGeometry()
    wash.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3))
    wash.setIndex(idx)
    // hairline dimension marks, hugging the saddle: the smear's width in x (in front) and depth in y (right)
    const dims: number[] = []
    const on = (x: number, y: number) => [x, crotchT(x, y) + LIFT, y]
    const seg = (xa: number, ya: number, xb: number, yb: number, n = 8) => {
      for (let k = 0; k < n; k++) {
        const u0 = k / n
        const u1 = (k + 1) / n
        dims.push(...on(xa + (xb - xa) * u0, ya + (yb - ya) * u0), ...on(xa + (xb - xa) * u1, ya + (yb - ya) * u1))
      }
    }
    const fy = y1 + 0.2 // x-dimension line, in front (toward the camera)
    seg(x0, fy, x1, fy, 1)
    seg(x0, fy - 0.06, x0, fy + 0.06, 1)
    seg(x1, fy - 0.06, x1, fy + 0.06, 1)
    const rx = x1 + 0.2 // y-dimension line, to the right
    seg(rx, y0, rx, y1, 1)
    seg(rx - 0.06, y0, rx + 0.06, y0, 1)
    seg(rx - 0.06, y1, rx + 0.06, y1, 1)
    const labX = on(0, fy + 0.04)
    const labY = on(rx + 0.06, 0)
    return { positions, alphas, curve, ring, wash, dims: new Float32Array(dims), labX, labY, w: x1 - x0, d: y1 - y0 }
  }, [])
  const smear = useMemo(() => makeLine(tr.curve, lineMaterial(COLORS.field, 0)), [tr])
  const dimLines = useMemo(() => makeSegments(tr.dims, lineMaterial('#9fb6da', 0)), [tr])
  const washMat = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.field, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), [])
  // (the pants geometry itself is cached across remounts by useImplicitMesh, so it is not disposed here)
  useDispose(mat, smear, dimLines, tr.wash, washMat)
  const mk = useMemo(() => ({ positions: new Float32Array(MAX_MARKS * 3), alphas: new Float32Array(MAX_MARKS) }), [])

  const resample = (ci: number, out: Float32Array) => {
    const r = slicer.result
    const s0 = r.start[ci]
    const n = r.count[ci]
    const P = r.pts
    cum[0] = 0
    for (let i = 1; i <= n; i++) {
      const a = (s0 + i - 1) * 3
      const b = (s0 + (i % n)) * 3
      cum[i] = cum[i - 1] + Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2])
    }
    const total = cum[n] || 1
    let j = 0
    for (let k = 0; k < NF; k++) {
      const target = (k / NF) * total
      while (j < n - 1 && cum[j + 1] < target) j++
      const seg = cum[j + 1] - cum[j] || 1
      const f = (target - cum[j]) / seg
      const a = (s0 + j) * 3
      const b = (s0 + ((j + 1) % n)) * 3
      // physics (x, y, t) → world (x, t, y)
      out[k * 3] = P[a] + (P[b] - P[a]) * f
      out[k * 3 + 1] = P[a + 2] + (P[b + 2] - P[a + 2]) * f
      out[k * 3 + 2] = P[a + 1] + (P[b + 1] - P[a + 1]) * f
    }
  }

  useChapterFrame(() => {
    const w = D.w.hist
    const vis = w * (D.sl.showPants ? 1 : 0)
    group.current.visible = vis > 0.003
    if (!group.current.visible) return
    const s = D.sl
    const pk = D.w.planes * vis
    const hold = D.hold
    const tn = Math.tan(s.theta)
    const a = tn * Math.cos(s.phi)
    const b = tn * Math.sin(s.phi)
    // the film quiets for the close-up, and again for the hold, where the smear is the hero
    mat.uniforms.uOpacity.value = vis * (1 - 0.4 * D.closeup) * (1 - 0.5 * hold)
    mat.uniforms.uNow.value.set(s.t0, a, b, pk * 0.5 * (1 - 0.85 * hold))
    // the rings re-tilt with this observer's "now": the same history, re-sliced (no slicing is preferred)
    mat.uniforms.uRingTilt.value.set(a * D.w.planes, b * D.w.planes)

    // analytic slice (marching squares on the plane) — only when the slicing changed
    if (pk > 0.003 && (s.t0 !== st.t0 || s.theta !== st.th || s.phi !== st.ph)) {
      st.t0 = s.t0
      st.th = s.theta
      st.ph = s.phi
      const r = slicer.slice(pantsField, s.t0, s.theta, s.phi)
      let n = 0
      let first = -1
      let second = -1
      for (let i = 0; i < r.n; i++) {
        if (!r.closed[i] || r.count[i] < 8) continue
        if (first < 0) first = i
        else if (second < 0) second = i
        n++
      }
      st.n = n
      if (first >= 0) {
        // keep a stable left/right assignment once there are two loops
        let a = first
        let b = second
        if (b >= 0) {
          const xa = r.pts[r.start[a] * 3]
          const xb = r.pts[r.start[b] * 3]
          if (xa > xb) [a, b] = [b, a]
        }
        resample(a, ptsA)
        fa.current?.update()
        if (b >= 0) {
          resample(b, ptsB)
          fb.current?.update()
        }
      }
    }
    const fOn = pk * (st.n > 0 ? 1 : 0) * (1 - 0.87 * hold)
    if (fa.current) {
      fa.current.group.visible = fOn > 0.003
      fa.current.material.uniforms.uOpacity.value = fOn
    }
    if (fb.current) {
      fb.current.group.visible = fOn > 0.003 && st.n > 1
      fb.current.material.uniforms.uOpacity.value = fOn
    }

    // this slicing's split point: moves with θ, φ
    const sp = D.split
    marker.current?.set(sp.x, sp.t, sp.y, lerp(7, 10, D.flash), pk * lerp(0.35, 1, D.flash) * (1 - 0.7 * hold))
    splitTag.current?.group.position.set(sp.x + 0.3, sp.t + 0.3, sp.y)
    readout.current?.setText(`SPLIT SEEN AT x ${signed(sp.x)} · y ${signed(sp.y)} · ct ${sp.t.toFixed(2)}`)

    // Beat 4 trail (scripted by scroll), faded as the lab takes over with its own marks
    const scripted = D.sl.mode === 0 ? 1 : 1 - D.w.lab
    const ta = trail.current?.geometry.getAttribute('aAlpha') as THREE.BufferAttribute | undefined
    const reach = D.sl.trail * TRAIL_N
    if (ta) {
      for (let i = 0; i < TRAIL_N; i++) tr.alphas[i] = smoothstep(i - 0.5, i + 0.5, reach) * pk * scripted
      ta.needsUpdate = true
    }
    smear.geometry.setDrawRange(0, Math.min(TRAIL_N + 1, Math.floor(reach) + 1))
    ;(smear.material as THREE.LineBasicMaterial).opacity = 0.55 * pk * scripted * (1 - hold)
    // the hold: the closed smear inks in as a crisp field line over a brighter wash, with its dimensions
    const inked = hold * pk * scripted * smoothstep(0.97, 1, D.sl.trail)
    if (outline.current) {
      outline.current.group.visible = inked > 0.003
      outline.current.material.uniforms.uOpacity.value = inked
    }
    const washK = smoothstep(0.86, 1, D.sl.trail) * pk * scripted
    smearMesh.current.visible = washK > 0.003
    washMat.opacity = lerp(0.14, 0.3, hold) * washK
    ;(dimLines.material as THREE.LineBasicMaterial).opacity = 0.7 * inked
    const n = Math.min(TRAIL_N, Math.floor(reach + 0.5))
    // (the label's DOM mounts a few frames late: only cache once the text has landed)
    if (n !== st.count && countTag.current?.text) {
      st.count = n
      countTag.current?.setText(`${n} ${n === 1 ? 'TILT' : 'TILTS'} · ${n} SPLIT ${n === 1 ? 'POINT' : 'POINTS'}`)
    }
    // the counter (on one line with the Y inset's) and the closing caption (near the foot of the screen),
    // screen-anchored under the crotch, clear of the smear and its dimensions
    group.current.localToWorld(v.crotch.set(0, T_STAR, 0))
    if (countTag.current) {
      screenOffset(camera, v.crotch, 0, D.portrait ? 128 : 196, size.height, v.out)
      countTag.current.group.position.copy(group.current.worldToLocal(v.out))
    }
    if (caption.current) {
      const sy = (0.5 - 0.5 * v.out.copy(v.crotch).project(camera).y) * size.height
      const dy = D.portrait ? 128 : Math.max(240, 0.85 * size.height - sy)
      screenOffset(camera, v.crotch, 0, dy, size.height, v.out)
      caption.current.group.position.copy(group.current.worldToLocal(v.out))
    }

    // lab marks
    const lab = useWorldsheet.getState()
    if (lab.pantsMarks !== st.marksRef && marks.current) {
      st.marksRef = lab.pantsMarks
      const m = lab.pantsMarks
      const n = Math.min(MAX_MARKS, m.length / 3)
      for (let i = 0; i < MAX_MARKS; i++) {
        if (i < n) {
          mk.positions[i * 3] = m[i * 3]
          mk.positions[i * 3 + 1] = m[i * 3 + 2]
          mk.positions[i * 3 + 2] = m[i * 3 + 1]
          mk.alphas[i] = 1
        } else mk.alphas[i] = 0
      }
      ;(marks.current.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(marks.current.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true
    }
    if (marks.current) marks.current.material.uniforms.uIntensity.value = 0.95 * D.w.lab * vis
    const pm = lab.pantsMarks.length / 3
    if ((lab.pantsSeen !== st.seen || pm !== st.distinct) && seenTag.current?.text) {
      st.seen = lab.pantsSeen
      st.distinct = pm
      seenTag.current.setText(`${lab.pantsSeen} ${lab.pantsSeen === 1 ? 'SPLIT' : 'SPLITS'} SEEN · ${pm} DIFFERENT ${pm === 1 ? 'POINT' : 'POINTS'}`)
    }
  })

  const showP = () => D.w.hist * (D.sl.showPants ? 1 : 0)
  const inked = () => D.hold * D.w.planes * showP() * (D.sl.mode === 0 ? 1 : 1 - D.w.lab) * smoothstep(0.97, 1, D.sl.trail) * (1 - D.textRise)
  return (
    <group ref={group} position={[X_P, 0, 0]}>
      {geo && <mesh geometry={geo} material={mat} renderOrder={1} />}
      {/* the string now: a thin warm filament (a soft amber halo round a fine core), as in the prologue */}
      <Filament ref={fa} points={ptsA} count={NF} closed width={0.13} minPixels={1.5} coreFraction={0.06} coreColor="#FFEBD2" intensity={0.95} renderOrder={6} />
      <Filament ref={fb} points={ptsB} count={NF} closed width={0.13} minPixels={1.5} coreFraction={0.06} coreColor="#FFEBD2" intensity={0.95} renderOrder={6} />
      <primitive object={smear} />
      <mesh ref={smearMesh} geometry={tr.wash} material={washMat} renderOrder={2} />
      <primitive object={dimLines} />
      {/* the smear, inked: a diagram line (field blue), not a string */}
      <Filament ref={outline} points={tr.ring} count={TRAIL_N} closed width={0.022} minPixels={0.85} coreFraction={0.4} color={COLORS.field} coreColor="#dce8f8" intensity={0.9} renderOrder={7} />
      <GlowPoints ref={trail} positions={tr.positions} alphas={tr.alphas} size={0.036} minPixels={1.5} color={COLORS.field} sharpness={1} intensity={0.95} />
      <GlowPoints ref={marks} positions={mk.positions} alphas={mk.alphas} size={0.06} minPixels={3} color={COLORS.field} sharpness={1} intensity={1.2} />
      <Marker ref={marker} />
      <NowPlane show={() => D.w.planes * showP() * (1 - 0.55 * D.closeup) * (1 - 0.7 * D.hold)} labelX={-3.5} />
      <Tag ref={splitTag} align="left" tone="field" opacity={() => D.w.planes * showP() * D.flash * (1 - smoothstep(0, 0.4, D.hold))}>
        SPLIT
      </Tag>
      <Tag ref={readout} position={[0, -0.7, 0]} align="center" tone="field" opacity={() => showP() * Math.max(smoothstep(0.28, 0.34, D.p.now) * (1 - D.closeup), D.w.lab)} />
      <Tag ref={seenTag} position={[0, -1.25, 0]} align="center" tone="ink" opacity={() => D.w.lab * showP() * (useWorldsheet.getState().pantsSeen > 0 ? 0.9 : 0)} />
      <Tag position={[0, 11.2, 0]} align="center" tone="ink" opacity={() => showP() * (1 - D.w.lab) * (1 - smoothstep(0.5, 0.58, D.p.now))}>
        STRINGS · PAIR OF PANTS
      </Tag>
      <Tag position={[0, 10.75, 0]} align="center" tone="dim" opacity={() => showP() * Math.max(0.75 * (1 - D.w.lab) * (1 - smoothstep(0.5, 0.58, D.p.now)), D.deeper.bh * 1.2)}>
        b = 3 OPENINGS · h = 0 HANDLES
      </Tag>
      {/* the ring family follows the tilt (shown once "now" is tilted, in Beat 4 and the lab) */}
      <Tag position={[0, 10.3, 0]} align="center" tone="field" opacity={() => D.w.planes * showP() * smoothstep(0.05, 0.14, D.sl.theta) * (1 - D.closeup) * 0.85}>
        RINGS: THIS OBSERVER’S NOWS
      </Tag>
      <Tag position={tr.labX as [number, number, number]} align="below" tone="field" opacity={inked}>
        ≈ {tr.w.toFixed(1)} ℓ
      </Tag>
      <Tag position={tr.labY as [number, number, number]} align="left" tone="field" opacity={inked}>
        ≈ {tr.d.toFixed(1)} ℓ
      </Tag>
      <Tag
        ref={countTag}
        align="below"
        tone="field"
        opacity={() => D.w.planes * showP() * (D.sl.mode === 0 ? 1 : 0) * smoothstep(0.004, 0.03, D.sl.trail) * smoothstep(0.3, 0.9, D.closeup) * (D.portrait ? 1 - smoothstep(0.1, 0.45, D.hold) : 1) * (1 - D.textRise)}
      />
      <Tag ref={caption} align="center" tone="ink" opacity={() => D.w.planes * showP() * smoothstep(D.portrait ? 0.5 : 0.35, 0.9, D.hold) * (1 - smoothstep(0.99, 1.02, D.p.now)) * (1 - D.textRise)}>
        SAME SURFACE FOR EVERYONE.
        <br className="ws-mbr" /> DIFFERENT “SPLIT” POINTS.
      </Tag>
    </group>
  )
}
