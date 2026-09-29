import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Backdrop, OrbitRig, useChapterFrame, useHandoffFit, useViewShift, type OrbitPose } from '@/gl'
import { Bridges } from './Bridges'
import { direct, S } from './director'
import { Hud } from './Hud'
import { MapScene } from './Map'
import { Residents } from './Residents'
import { Rigs } from './Rigs'
import { Shallow } from './Shallow'

/*
 * Chapter 09 · One map. Five superstring theories as islands on a dark sea (a cartoon of the space of
 * backgrounds), duality bridges between them, two strong-coupling lifts to eleven dimensions, and a
 * pull-back that reveals one six-cusped landmass: M-theory, whose full formulation is unknown.
 * Model and choreography: content/09-m-theory.md. All timing lives in director.ts.
 */
export default function Scene() {
  const size = useThree((s) => s.size)
  const fit = useHandoffFit()
  useChapterFrame((f) => direct(f.h, f.t, f.dt, size.width / Math.max(1, size.height), fit), { priority: -2 })
  useViewShift(() => S.shift)

  const pose = useMemo(() => ({ azimuth: 0, polar: Math.PI / 2, distance: 10, target: [0, 0, 0] as [number, number, number], fov: 35 }) satisfies OrbitPose, [])
  const poseFn = useMemo(
    () => () => {
      const c = S.cam
      pose.azimuth = c.az
      pose.polar = c.pol
      pose.distance = c.d
      pose.target[0] = c.tx
      pose.target[1] = c.ty
      pose.target[2] = c.tz
      return pose
    },
    [pose],
  )

  return (
    <>
      <Backdrop />
      <OrbitRig pose={poseFn} interactive={(h) => S.interactive && h.inStep('lab')} polarLimits={[0.02, Math.PI - 0.02]} sensitivity={0.004} />
      <MapScene />
      <Bridges />
      <Residents />
      <Rigs />
      <Shallow />
      <Hud />
    </>
  )
}
