import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Backdrop, OrbitRig, useChapterFrame, useViewShift, type OrbitPose } from '@/gl'
import { clamp, damp, easeInOutCubic, lerp, range, smoothstep } from '@/core/math'
import { TI, T_END, T_START } from './constants'
import { cableDist, cableNear, cableOrbit, fitF, latticeL, sweepPhase } from './model'
import { LabelLayer } from './gl/labels'
import { labStage, useTimeline, type Timeline } from './timeline'
import { Thread } from './parts/Thread'
import { Opening } from './parts/Opening'
import { Sweep } from './parts/Sweep'
import { Cable, CAM_D } from './parts/Cable'
import { Lattice } from './parts/Lattice'
import { HiddenCircle, fitLayout } from './parts/HiddenCircle'
import { Balance } from './parts/Balance'
import { Bounds } from './parts/Bounds'
import { CountLab, countCamera } from './parts/CountLab'

/*
 * Chapter 05 · Dimensions — "Where would extra dimensions hide?" (content/05-dimensions.md)
 * One continuous beat time T drives every part; the director below turns T (and the lab station)
 * into a camera pose and a view shift. Progress 0 and 1 are exactly HANDOFF.camera with no shift,
 * framing the canonical H2 loop (Thread.tsx).
 */

const HALF_PI = Math.PI / 2

interface Pose {
  az: number
  pol: number
  dist: number
  tx: number
  ty: number
  tz: number
  sx: number
  sy: number
}
const mk = (): Pose => ({ az: 0, pol: HALF_PI, dist: 10, tx: 0, ty: 0, tz: 0, sx: 0, sy: 0 })
const mixP = (o: Pose, a: Pose, b: Pose, k: number) => {
  o.az = lerp(a.az, b.az, k)
  o.pol = lerp(a.pol, b.pol, k)
  o.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k))
  o.tx = lerp(a.tx, b.tx, k)
  o.ty = lerp(a.ty, b.ty, k)
  o.tz = lerp(a.tz, b.tz, k)
  o.sx = lerp(a.sx, b.sx, k)
  o.sy = lerp(a.sy, b.sy, k)
  return o
}
const copyP = (o: Pose, a: Pose) => mixP(o, a, a, 0)

function useDirector(tl: Timeline) {
  const S = useMemo(
    () => ({ a: mk(), b: mk(), c: mk(), out: mk(), v: new THREE.Vector3(), wC: 1, wZ: 0, wF: 0, cd: [0.55, 1.2, 10] as number[], pose: { azimuth: 0, polar: HALF_PI, distance: 10, target: [0, 0, 0] as [number, number, number], fov: 35 } }),
    [],
  )

  /* ── pose of each segment ── */
  const opening = (T: number, o: Pose) => {
    copyP(o, mk())
    const k = smoothstep(T_START + 0.03, 1.3, T)
    o.sx = tl.portrait ? 0 : 0.12 * k
    o.sy = tl.portrait ? 0.14 * k : -0.085 * k
    return o
  }
  const pm = () => (tl.portrait ? clamp(1.05 / tl.aspect, 1, 2.4) : 1)
  const sweep = (s: number, o: Pose) => {
    const ph = sweepPhase(s)
    const glide = smoothstep(0, 0.05, s)
    o.tx = 0
    o.ty = -glide + ph.b
    o.tz = -glide + ph.c
    const orbit = smoothstep(0.45, 0.7, s)
    o.az = 0.61 * orbit + 0.2 * smoothstep(0.7, 1, s)
    o.pol = HALF_PI - 0.26 * orbit
    // a little closer than the handoff camera so the growing figure fills its half of the frame
    o.dist = lerp(lerp(10, 8.2, smoothstep(0.03, 0.14, s)), tl.portrait ? 16 : 11.8, smoothstep(0.66, 0.9, s)) * lerp(1, pm(), smoothstep(0, 0.1, s))
    o.sx = tl.portrait ? 0 : 0.12
    o.sy = tl.portrait ? 0.14 + 0.05 * smoothstep(0.6, 0.8, s) : -0.085 * (1 - smoothstep(0.05, 0.2, s))
    return o
  }
  const cable = (d: number, o: Pose, lab = false) => {
    const port = tl.portrait
    const k = cableOrbit(d, port)
    // The lab reaches d = 3, where a side view is filled by the tube (2·asin(1/3) ≈ 39° > the 35° fov).
    // Close in, look down the tube instead: the camera stays ~d radii from the axis while it orbits a
    // target slid along the axis, so the tube recedes and its near section (ant, arc) sits in frame.
    const near = lab ? easeInOutCubic(smoothstep(11, 3.5, d)) : 0
    o.ty = o.tz = 0
    // phones: half the swing (a tall frame over-reads the receding tube)
    o.az = lerp((port ? 0.28 : 0.52) * k, port ? 0.8 : 1.08, near)
    o.pol = HALF_PI - (port ? 0.12 : 0.24) * k - (port ? 0.1 : 0.1) * near
    const sp = Math.sin(o.pol)
    const axisF = Math.sqrt(Math.cos(o.pol) ** 2 + (sp * Math.cos(o.az)) ** 2)
    o.dist = lerp(CAM_D, CAM_D / axisF, near)
    o.tx = -near * o.dist * sp * Math.sin(o.az)
    o.sx = port ? 0 : lab ? (labStage(tl).c - 0.5) * k : 0.07 * k
    // desktop beat: the cable runs across the upper half, the text sits low on the left;
    // phones: the tube's axis sits at ~30% of the height, above the text block
    o.sy = port ? (lab ? 0.24 : 0.2) : lab ? 0.04 : 0.11
    return o
  }
  const lattice = (l: number, o: Pose) => {
    cable(cableNear(tl.portrait), o)
    const a = easeInOutCubic(range(l, 0, 0.14))
    const b = easeInOutCubic(range(l, 0.1, 0.32))
    const c = easeInOutCubic(range(l, 0.8, 1))
    o.dist = Math.exp(lerp(Math.log(CAM_D), Math.log(4), a))
    o.dist = Math.exp(lerp(Math.log(o.dist), Math.log(15 * pm()), b))
    o.dist = Math.exp(lerp(Math.log(o.dist), Math.log(30 * pm()), c))
    // continue from wherever the cable's swing ended (phones swing half as far)
    o.az = lerp(o.az, 0.42, b) + 0.3 * l
    o.pol = lerp(o.pol, HALF_PI - 0.3, b)
    o.sx = tl.portrait ? 0 : lerp(0.07, 0.12, b)
    o.sy = tl.portrait ? lerp(0.2, 0.14, a) : lerp(0.11, 0, a)
    return o
  }
  const fit = (f: number, o: Pose) => {
    lattice(1, S.c)
    const lay = fitLayout(tl)
    const k = easeInOutCubic(range(f, 0, 0.15))
    copyP(o, S.c)
    o.dist = Math.exp(lerp(Math.log(S.c.dist), Math.log(lay.camD), k))
    o.az = lerp(S.c.az, 0, k)
    o.pol = lerp(S.c.pol, HALF_PI, k)
    o.sx = lerp(S.c.sx, lay.ringFx - 0.5, k)
    o.sy = lerp(S.c.sy, 0.5 - lay.ringFy, k)
    return o
  }
  const count = (b: number, o: Pose) => {
    copyP(o, mk())
    o.dist = 13 * pm()
    o.az = 0.4 + 0.35 * b
    o.pol = HALF_PI - 0.24
    // the lattice sits low in the frame; the balance (HUD) takes the clear space above it
    o.ty = tl.portrait ? 0.6 : 1.3
    o.sx = tl.portrait ? 0 : 0.1
    o.sy = tl.portrait ? 0.1 : 0
    return o
  }
  const bounds = (r: number, o: Pose) => {
    count(1, o)
    const k = easeInOutCubic(range(r, 0, 0.3))
    o.dist = Math.exp(lerp(Math.log(o.dist), Math.log(40 * pm()), k))
    o.az += 0.3 * r
    return o
  }
  const lab = (o: Pose, dt: number) => {
    const L = tl.lab
    const wc = L.station === 'count' ? 1 : 0
    const wz = L.station === 'zoom' ? 1 : 0
    const wf = L.station === 'fit' ? 1 : 0
    const snap = dt === 0
    S.wC = snap ? wc : damp(S.wC, wc, 4, dt)
    S.wZ = snap ? wz : damp(S.wZ, wz, 4, dt)
    S.wF = snap ? wf : damp(S.wF, wf, 4, dt)
    const cc = countCamera(L.D)
    for (let i = 0; i < 3; i++) S.cd[i] = snap ? cc[i] : damp(S.cd[i], cc[i], 4, dt)
    // COUNT
    copyP(S.a, mk())
    S.a.az = S.cd[0]
    S.a.pol = S.cd[1]
    S.a.dist = S.cd[2] * pm() * (tl.portrait ? 1.5 : 1.05)
    // desktop: centred in the free stage left of the panel (which stays clear of the chapter rail)
    S.a.sx = tl.portrait ? 0 : labStage(tl).c - 0.5
    S.a.sy = tl.portrait ? 0.29 : 0.02
    // ZOOM
    cable(L.zoom, S.b, true)
    // FIT: a still, calm camera (the station is drawn on the instrument plane)
    bounds(1, S.c)
    S.c.sx = 0
    S.c.sy = 0
    const tot = S.wC + S.wZ + S.wF || 1
    mixP(o, S.a, S.b, S.wZ / Math.max(1e-6, S.wC + S.wZ))
    mixP(o, o, S.c, S.wF / tot)
    return o
  }

  useChapterFrame(
    (f) => {
      const T = tl.T
      const o = S.out
      if (T < TI.sweep) opening(T, o)
      else if (T < TI.cable) sweep(tl.u.sweep, o)
      else if (T < TI.lattice) {
        // blend out of the tesseract into the cable
        sweep(1, S.a)
        cable(cableDist(tl.u.cable, tl.portrait), S.b)
        mixP(o, S.a, S.b, easeInOutCubic(range(T, TI.cable, TI.cable + 0.14)))
      } else if (T < TI.fit) lattice(latticeL(T), o)
      else if (T < TI.count) fit(fitF(T), o)
      else if (T < TI.bounds) {
        fit(1, S.a)
        count(tl.u.count, S.b)
        mixP(o, S.a, S.b, easeInOutCubic(range(T, TI.count - 0.0, TI.count + 0.16)))
      } else if (T < TI.lab) bounds(tl.u.bounds, o)
      else if (T < TI.exit) {
        bounds(1, S.a)
        lab(S.b, f.dt)
        mixP(o, S.a, S.b, easeInOutCubic(range(T, TI.lab, TI.lab + 0.12)))
      } else {
        lab(S.a, f.dt)
        copyP(S.b, mk())
        const e = easeInOutCubic(range(T, TI.exit, T_END - 0.06))
        mixP(o, S.a, S.b, e)
        if (T >= T_END - 0.06) copyP(o, S.b)
      }
      // progress 0 and 1 are exact handoff frames
      if (f.progress <= 0.0005 || f.progress >= 0.9995) copyP(o, mk())
      tl.sx = o.sx
      tl.camTx = o.tx
      tl.sy = o.sy
      const p = S.pose
      p.azimuth = o.az
      p.polar = o.pol
      p.distance = o.dist
      p.target[0] = o.tx
      p.target[1] = o.ty
      p.target[2] = o.tz
    },
    { priority: -2 },
  )
  return S.pose as OrbitPose
}

export default function Scene() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const tl = useTimeline()
  const pose = useDirector(tl)
  const labels = useMemo(() => new LabelLayer(), [])
  useEffect(() => {
    labels.attach()
    return () => labels.detach()
  }, [labels])

  useViewShift(() => [tl.sx, tl.sy])
  // one projection pass for every figure label, after the camera, the shift and all parts
  useChapterFrame(
    (f) => {
      labels.flush(camera, tl.W, tl.H, f.presence, tl.visR)
    },
    { priority: -0.4, always: true },
  )

  return (
    <>
      <OrbitRig pose={() => pose} interactive={(h) => h.inStep('lab') && tl.lab.station !== 'fit'} autoRotate={0.05} />
      <Backdrop />
      <Lattice tl={tl} labels={labels} />
      <Opening tl={tl} labels={labels} />
      <Sweep tl={tl} labels={labels} />
      <Cable tl={tl} labels={labels} />
      <HiddenCircle tl={tl} labels={labels} />
      <Balance tl={tl} labels={labels} />
      <Bounds tl={tl} labels={labels} />
      <CountLab tl={tl} labels={labels} />
      <Thread tl={tl} />
    </>
  )
}
