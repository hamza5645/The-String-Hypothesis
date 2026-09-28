import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useChapterFrame } from '@/gl'
import { HUD_Z } from './labels'

/**
 * A camera-attached plane for flat instrument diagrams (ladders, rulers, plots): children use HUD
 * coordinates (x, y, 0) = world units on a plane HUD_Z in front of the camera, so 1 unit ≈ 1/6.3 of
 * the viewport height. The view shift (setViewOffset) applies to it like to everything else.
 * Synced after the camera rig (priority −0.45) and before labels/rendering.
 */
export function Hud({ children }: { children: ReactNode }) {
  const camera = useThree((s) => s.camera)
  const g = useRef<THREE.Group>(null!)
  useChapterFrame(
    () => {
      g.current.position.copy(camera.position)
      g.current.quaternion.copy(camera.quaternion)
    },
    { priority: -0.45 },
  )
  return (
    <group ref={g}>
      <group position={[0, 0, -HUD_Z]}>{children}</group>
    </group>
  )
}
