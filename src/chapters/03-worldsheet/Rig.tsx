import { useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { OrbitRig, useChapterFrame, useViewShift, type OrbitPose } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { direct, D } from './director'
import { CLOSE_TOP } from './model'

const DEG = Math.PI / 180

/**
 * Camera: the director's scroll pose through OrbitRig (drag to orbit in the lab), a view shift that
 * composes the subject beside the text, and the Beat-6 OUT crane (priority −0.9, after OrbitRig):
 * the camera cranes up the tube and pitches down the time axis while the whole diagram is carried by
 * G(k) = T(0,0,−9k)·Rx(90°k), so that at k = 1 the camera is exactly HANDOFF.camera and the loop is H2.
 */
export function Rig({ world }: { world: RefObject<THREE.Group | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  // the director runs first
  useChapterFrame((f) => direct(f), { priority: -2 })

  const pose = useMemo<OrbitPose>(() => ({ azimuth: 0, polar: Math.PI / 2, distance: 10, target: [0, 0, 0], fov: HANDOFF.camera.fov }), [])
  const poseFn = () => {
    pose.azimuth = D.cam.az * DEG
    pose.polar = D.cam.pol * DEG
    pose.distance = D.cam.dist
    pose.target = D.camTarget
    return pose
  }

  useViewShift(() => [D.cam.sx, D.cam.sy])

  const s = useMemo(
    () => ({
      q0: new THREE.Quaternion(),
      q1: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
      q: new THREE.Quaternion(),
      g: new THREE.Quaternion(),
      xAxis: new THREE.Vector3(1, 0, 0),
      t0: new THREE.Vector3(),
      t1: new THREE.Vector3(0, CLOSE_TOP, 0),
      tk: new THREE.Vector3(),
      back: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      m: new THREE.Matrix4(),
      look: new THREE.Matrix4(),
      up: new THREE.Vector3(0, 1, 0),
      eye: new THREE.Vector3(),
    }),
    [],
  )

  useChapterFrame(
    () => {
      const g = world.current
      if (!g) return
      const k = D.out
      if (k <= 0) {
        if (g.position.lengthSq() > 0 || g.quaternion.w !== 1) {
          g.position.set(0, 0, 0)
          g.quaternion.identity()
        }
        return
      }
      // start frame: the director's (constant) Beat-6 pose, in diagram coordinates
      const c = D.cam
      const pol = c.pol * DEG
      const az = c.az * DEG
      s.t0.set(c.tx, c.ty, c.tz)
      s.eye.set(c.tx + c.dist * Math.sin(pol) * Math.sin(az), c.ty + c.dist * Math.cos(pol), c.tz + c.dist * Math.sin(pol) * Math.cos(az))
      s.look.lookAt(s.eye, s.t0, s.up)
      s.q0.setFromRotationMatrix(s.look)
      // crane: orientation slerps to "looking down −t, up = −z", target climbs to the top ring, distance → 10
      s.q.slerpQuaternions(s.q0, s.q1, k)
      s.tk.lerpVectors(s.t0, s.t1, k)
      const dist = c.dist + (HANDOFF.camera.position[2] - c.dist) * k
      s.back.set(0, 0, 1).applyQuaternion(s.q)
      s.pos.copy(s.tk).addScaledVector(s.back, dist)
      // carry the diagram: G(k) = T(0, 0, −CLOSE_TOP·k) · Rx(90°·k)
      s.g.setFromAxisAngle(s.xAxis, (Math.PI / 2) * k)
      g.quaternion.copy(s.g)
      g.position.set(0, 0, -CLOSE_TOP * k)
      // camera world = G(k) · local camera
      camera.position.copy(s.pos).applyQuaternion(s.g).add(g.position)
      camera.quaternion.copy(s.g).multiply(s.q)
      if (k >= 1) {
        camera.position.set(...HANDOFF.camera.position)
        camera.quaternion.identity()
      }
      camera.updateMatrixWorld()
    },
    { priority: -0.9 },
  )

  // a preset choice drops the visitor's drag offset: the rig relaxes back for a moment
  const nonce = useMemo(() => ({ n: 0, at: -10 }), [])
  const interactive = (h: { inStep: (id: string) => boolean }) => {
    if (D.viewNonce !== nonce.n) {
      nonce.n = D.viewNonce
      nonce.at = D.t
    }
    return h.inStep('lab') && D.t - nonce.at > 1.1
  }

  return <OrbitRig pose={poseFn} interactive={interactive} polarLimits={[10 * DEG, 85 * DEG]} />
}
