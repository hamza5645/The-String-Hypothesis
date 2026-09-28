import { useRef } from 'react'
import * as THREE from 'three'
import { Backdrop, HandoffLoop, HandoffPoint, useChapterFrame } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { D } from './director'
import { Closing } from './Closing'
import { PantsHistory, YHistory } from './Histories'
import { Loops } from './Loops'
import { Loupes } from './Loupes'
import { Floor, OpeningParticles, Thread, TimeAxis } from './Opening'
import { Rig } from './Rig'
import { Helicoid, ProperTime, Tube } from './Sheets'
import { YInset } from './YInset'

/*
 * Chapter 03 · Worldsheets. A spacetime diagram with time running up (world +Y = ct), one space dimension
 * hidden, 1 unit = 1 ℓ (not to scale). IN: H0 (Chapter 2 ends on a point) unfolds into H1, which lies down
 * in space. OUT: the open string's ends join; the camera looks down the tube → H2.
 * Everything below reads the per-frame state `D` computed by the director (see director.ts).
 */
export default function Scene() {
  const world = useRef<THREE.Group>(null)
  return (
    <>
      <Backdrop />
      <Rig world={world} />
      <group ref={world}>
        <Floor />
        <TimeAxis />
        <Thread />
        <OpeningParticles />
        <Helicoid />
        <Tube />
        <ProperTime />
        <YHistory />
        <PantsHistory />
        <Loupes />
        <YInset />
        <Loops />
        <Closing />
      </group>
      <H0 />
      <H2 />
    </>
  )
}

/** H0 — exactly <HandoffPoint/> at the origin; it fades as the point unfolds into the Thread. */
function H0() {
  const g = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.ShaderMaterial | null>(null)
  useChapterFrame(() => {
    if (!mat.current)
      g.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
        if (m?.uniforms?.uIntensity) mat.current = m
      })
    const w = D.w.point
    g.current.visible = w > 0.002
    if (mat.current) mat.current.uniforms.uIntensity.value = HANDOFF.H0.intensity * w
  })
  return (
    <group ref={g}>
      <HandoffPoint />
    </group>
  )
}

/** H2 — exactly <HandoffLoop/> at the origin, outside the diagram group; it takes over at the end of the crane. */
function H2() {
  const g = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.ShaderMaterial | null>(null)
  useChapterFrame(() => {
    if (!mat.current)
      g.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
        if (m?.uniforms?.uOpacity) mat.current = m
      })
    const k = D.h2
    g.current.visible = k > 0.001
    if (mat.current) mat.current.uniforms.uOpacity.value = k
  })
  return (
    <group ref={g} visible={false}>
      <HandoffLoop />
    </group>
  )
}
