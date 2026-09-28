import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Backdrop, COLORS, GlowPoint, OrbitRig, useChapterFrame, useViewShift, type GlowPointApi, type OrbitPose } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { lerp, smoothstep } from '@/core/math'
import { useKnowledge } from './store'
import { STEPS, type StepId } from './model'
import { Stage } from './director'
import { LabelLayer } from './gl/labels'
import { Ground } from './parts/Ground'
import { MapLines } from './parts/MapLines'
import { Nodes } from './parts/Nodes'
import { MapThread } from './parts/MapThread'
import { Ceiling } from './parts/Ceiling'
import { Fog } from './parts/Fog'
import { Hud } from './parts/Hud'
import { Count } from './parts/Count'
import { Holo } from './parts/Holo'
import { Landscape } from './parts/Landscape'
import { Epilogue } from './parts/Epilogue'

/*
 * Chapter 11 · What We Know — the stage.
 * IN: H0 (a single ink point, HANDOFF camera, no shift) → the point stands on measured ground and
 * becomes the Standard Model's ●. The map: ground ● · scaffold ◑ ◌ strung on the warm Thread ·
 * fog ○. B6 lowers the evidence ceiling until no warm light is left. The Lab lets you set it.
 * Epilogue: the map shrinks to one point, arrows stop short, the point unfolds into the Thread
 * one last time. OUT: H1 at rest (the prologue's own object).
 */

const MAP_C = new THREE.Vector3(0, 3.1, 0)

/** The DOM blocks of each step that sit over the stage (the lab: its sheet, then its hint). */
interface StepBlock {
  id: StepId
  els: Element[]
}
function buildStepBlocks(): StepBlock[] {
  return (Object.keys(STEPS) as StepId[]).map((id) => {
    const step = document.querySelector(`#knowledge .step[data-step="${id}"]`)
    const sel = id === 'lab' ? ['.lab', '.lab-hint'] : ['.step__content']
    return { id, els: sel.map((q) => step?.querySelector(q)).filter((e): e is Element => !!e) }
  })
}

export default function Scene() {
  const S = useMemo(() => new Stage(), [])
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const [layer, setLayer] = useState<LabelLayer | null>(null)
  const map = useRef<THREE.Group>(null!)
  const point0 = useRef<GlowPointApi>(null)

  useLayoutEffect(() => {
    const host = document.getElementById('scene-labels')
    if (!host) return
    const l = new LabelLayer(host, 'kn-stage')
    setLayer(l)
    return () => l.destroy()
  }, [])

  // the narrative column's right edge (desktop), measured now and then from the DOM
  const col = useMemo(() => ({ t: -1, right: 0, steps: null as StepBlock[] | null }), [])
  // the director runs first: scroll → stage values; then the map's E1 transform
  useChapterFrame(
    (f) => {
      col.t -= f.dt || 0.5
      if (col.t < 0) {
        col.t = 0.5
        const b = document.querySelector('#knowledge .step--left .beat')?.getBoundingClientRect()
        col.right = b && b.width > 0 ? b.right : 0
      }
      S.textRight = col.right
      S.compute(f, size.width, size.height)
      // phones: the narrative text and the lab sheet sit over the stage — labels keep out of them
      // (a step's text block; in the lab, just the sheet and its hint, not the empty span between).
      // On desktop the text column is handled by safeLeft, so only the lab's floating hint is reserved.
      // Only steps on screen (0 < local p < 1) are measured.
      if (layer) {
        if (!col.steps) col.steps = buildStepBlocks()
        for (const b of col.steps) {
          const p = S.sp[b.id]
          if (p <= 0 || p >= 1 || (!S.mobile && b.id !== 'lab')) continue
          for (let i = 0; i < b.els.length; i++) {
            if (!S.mobile && i === 0) continue // desktop lab: the hint only (the panel is safeRight)
            const r = b.els[i].getBoundingClientRect()
            if (r.bottom > 0 && r.top < size.height && r.height > 0) layer.reserve(r.left, r.top, r.right, r.bottom)
          }
        }
      }
      const g = map.current
      const s = S.mapScale
      // world = c_t + s·(x − c), c_t sliding from the map's centre to the origin
      const k = smoothstep(0, 0.6, S.mapK)
      g.scale.setScalar(s)
      g.position.set(lerp(MAP_C.x, 0, k) - s * MAP_C.x, lerp(MAP_C.y, 0, k) - s * MAP_C.y, lerp(MAP_C.z, 0, k) - s * MAP_C.z)
      g.visible = S.mapVis > 0.001
      g.updateMatrixWorld()
      // the opening point (H0) — hands over to the Standard Model's ● as the ground appears
      const p = point0.current
      if (p) {
        p.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * S.point0
        p.visible = S.point0 > 0.001
        p.position.set(0, 0.06 * (1 - S.point0), 0)
      }
      const phase = S.cnt.phase
      if (useKnowledge.getState().countPhase !== phase) useKnowledge.setState({ countPhase: phase })
    },
    { priority: -2 },
  )

  useViewShift(() => [S.shiftX, S.shiftY])

  const pose = useMemo<OrbitPose & { target: [number, number, number] }>(() => ({ azimuth: 0, polar: Math.PI / 2, distance: 10, target: [0, 0, 0], fov: HANDOFF.camera.fov }), [])
  const poseFn = () => {
    const p = S.pose
    pose.azimuth = p.az
    pose.polar = p.pol
    pose.distance = p.dist
    pose.target[0] = p.tx
    pose.target[1] = p.ty
    pose.target[2] = p.tz
    return pose
  }

  // DOM labels last, after the camera and view shift have settled this frame
  useChapterFrame(
    (f) => {
      if (!layer) return
      camera.updateMatrixWorld()
      // labels stay clear of the chapter rail (desktop) and inside the visible width (phones)
      layer.right = S.mobile ? S.vw - 8 : size.width - 72
      layer.update(camera, map.current.matrixWorld, size.width, size.height, f.presence, f.dt, S.safeLeft, S.safeBottom, S.safeRight)
    },
    { priority: -0.8, always: true },
  )

  return (
    <>
      <Backdrop />
      <OrbitRig pose={poseFn} interactive={() => S.interactive} />
      <group ref={map}>
        <Ground S={S} />
        <MapLines S={S} layer={layer} />
        <Fog S={S} />
        <Landscape S={S} layer={layer} />
        <Ceiling S={S} layer={layer} />
        <MapThread S={S} layer={layer} />
        <Nodes S={S} layer={layer} />
        <Count S={S} layer={layer} />
        <Holo S={S} layer={layer} />
      </group>
      <Epilogue S={S} layer={layer} />
      {/* H0, exactly as <HandoffPoint/> renders it (registry size / min px / intensity, ink not warm) */}
      <GlowPoint ref={point0} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={HANDOFF.H0.intensity} color={COLORS.ink} coreColor="#FFFFFF" />
      <Hud S={S} layer={layer} map={map} />
    </>
  )
}
