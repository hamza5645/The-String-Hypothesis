/*
 * 04 · Gravity, Uninvited — the stage.
 * One director (director.ts) turns scroll + lab state into beat weights, a camera pose and the
 * gravitational-wave state; every sub-scene below only reads it. Handoff IN/OUT = H2 at HANDOFF.camera.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Backdrop, useChapterFrame, useViewShift } from '@/gl'
import { explore, setStageCursor } from '@/core/explore'
import { applyCamera, D, direct, S } from './director'
import { useGravity } from './store'
import { Thread } from './Thread'
import { Forces } from './Forces'
import { Spacetime } from './Spacetime'
import { Chart } from './Chart'
import { Ring } from './Ring'
import { Tile } from './Tile'
import { Timeline } from './Timeline'

function Director() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const cursor = useRef('')
  useChapterFrame(
    (f) => {
      const { width, height } = f.state.size
      direct(f.h, f.t, f.dt, width, height)
      applyCamera(camera)

      // Lab: a horizontal drag on the empty stage turns the pattern (ψ) — rotation symmetry by hand.
      const inLab = f.h.inStep('lab') && f.h.active() && D.w[S.lab] > 0.5
      if (inLab && explore.dragging && explore.dx !== 0) {
        const g = useGravity.getState()
        let psi = (g.psi + explore.dx * 0.4) % 360
        if (psi < 0) psi += 360
        g.set({ psi: Math.round(psi * 10) / 10 })
      }
      const want = inLab && explore.hovering ? (explore.dragging ? 'grabbing' : 'grab') : ''
      if (want !== cursor.current) {
        cursor.current = want
        setStageCursor(want as '' | 'grab' | 'grabbing')
      }
    },
    { priority: -3 },
  )
  useEffect(() => () => setStageCursor(''), [])
  useViewShift(() => [D.shiftX, D.shiftY])
  return null
}

export default function Scene() {
  return (
    <>
      <Director />
      <Backdrop />
      <Forces />
      <Spacetime />
      <Chart />
      <Ring />
      <Tile />
      <Timeline />
      <Thread />
    </>
  )
}
