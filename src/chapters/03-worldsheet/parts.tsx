import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, SceneLabel, useChapterFrame, type FrameInfo } from '@/gl'
import { lineMaterial, makeSegments, markerPoints } from './gl'

type Disposable = { dispose(): void }

/**
 * Dispose resources this chapter created by hand (not through JSX) when the component unmounts — the
 * chapter unmounts whenever the visitor scrolls two chapters away, and remounts on the way back.
 * Objects (lines, meshes) release their geometry and material.
 */
export function useDispose(...items: (Disposable | THREE.Object3D | null | undefined)[]) {
  const ref = useRef(items)
  ref.current = items
  useEffect(
    () => () => {
      for (const it of ref.current) {
        if (!it) continue
        if ((it as THREE.Object3D).isObject3D) {
          const o = it as THREE.Mesh
          o.geometry?.dispose()
          const m = o.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m?.dispose()
        } else (it as Disposable).dispose()
      }
    },
    [],
  )
}

const fwd = new THREE.Vector3()
const wp = new THREE.Vector3()

/** World size that spans `px` CSS pixels at the depth of world point p. */
export function pxToWorld(camera: THREE.PerspectiveCamera, p: THREE.Vector3, px: number, heightPx: number) {
  camera.getWorldDirection(fwd)
  const depth = Math.max(0.05, wp.copy(p).sub(camera.position).dot(fwd))
  return (px * 2 * depth * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, heightPx)
}

const right = new THREE.Vector3()
const up = new THREE.Vector3()
/**
 * World point that appears (dx, dy) CSS px from world point p on screen (+dy = down), at p's depth.
 * Call after the camera has moved (priority ≥ −0.9).
 */
export function screenOffset(camera: THREE.PerspectiveCamera, p: THREE.Vector3, dx: number, dy: number, heightPx: number, out: THREE.Vector3) {
  const k = pxToWorld(camera, p, 1, heightPx)
  right.setFromMatrixColumn(camera.matrixWorld, 0)
  up.setFromMatrixColumn(camera.matrixWorld, 1)
  return out.copy(p).addScaledVector(right, dx * k).addScaledVector(up, -dy * k)
}

export interface MarkerApi {
  group: THREE.Group
  material: THREE.LineBasicMaterial
  /** set placement (local coords of the parent), radius in CSS px, and opacity */
  set(x: number, y: number, z: number, px: number, opacity: number): void
}

/** Field hairline crosshair-ring, billboarded, constant pixel size. */
export const Marker = forwardRef<MarkerApi, { color?: string }>(function Marker({ color = COLORS.field }, ref) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const group = useRef<THREE.Group>(null!)
  const { obj, mat } = useMemo(() => {
    const mat = lineMaterial(color, 0)
    return { obj: makeSegments(markerPoints(), mat), mat }
  }, [color])
  useDispose(obj)
  const st = useMemo(() => ({ px: 10, op: 0 }), [])
  const pw = useMemo(() => new THREE.Vector3(), [])
  useImperativeHandle(ref, () => ({
    get group() {
      return group.current
    },
    material: mat,
    set(x, y, z, px, opacity) {
      group.current.position.set(x, y, z)
      st.px = px
      st.op = opacity
    },
  }))
  // after the camera moved (−0.5 runs after the rig and the OUT crane)
  useChapterFrame(
    () => {
      const g = group.current
      if (!g) return
      mat.opacity = st.op
      g.visible = st.op > 0.004
      if (!g.visible) return
      g.getWorldPosition(pw)
      const s = pxToWorld(camera, pw, st.px, size.height)
      const parentScale = g.parent ? g.parent.getWorldScale(wp).x : 1
      g.scale.setScalar(s / Math.max(1e-6, parentScale))
      // face the camera: world quaternion = camera quaternion
      if (g.parent) {
        g.parent.getWorldQuaternion(g.quaternion).invert().multiply(camera.quaternion)
      } else g.quaternion.copy(camera.quaternion)
    },
    { priority: -0.5 },
  )
  return (
    <group ref={group}>
      <primitive object={obj} />
    </group>
  )
})

export interface TagApi {
  group: THREE.Group
  text: HTMLSpanElement | null
  setText(s: string): void
}

/**
 * A SceneLabel pinned to a movable group, with text you can update per frame (no React renders).
 * Case is written explicitly (class ws-case turns off the kit's uppercase): words in capitals, physics
 * symbols as they are — c, ct, v, x, y, b, h, τ, ℓ — so "0.3c" never reads as coulombs.
 */
export const Tag = forwardRef<
  TagApi,
  {
    position?: [number, number, number]
    align?: 'left' | 'right' | 'center' | 'above' | 'below'
    tone?: 'ink' | 'dim' | 'field' | 'filament'
    size?: 'sm' | 'md' | 'lg'
    leader?: boolean
    opacity: (f: FrameInfo) => number
    children?: ReactNode
    className?: string
  }
>(function Tag({ position = [0, 0, 0], align = 'left', tone = 'field', size = 'sm', leader, opacity, children, className }, ref) {
  const group = useRef<THREE.Group>(null!)
  const span = useRef<HTMLSpanElement>(null)
  const last = useRef('')
  useImperativeHandle(ref, () => ({
    get group() {
      return group.current
    },
    get text() {
      return span.current
    },
    setText(s: string) {
      if (s !== last.current && span.current) {
        span.current.textContent = s
        last.current = s
      }
    },
  }))
  return (
    <group ref={group} position={position}>
      <SceneLabel position={[0, 0, 0]} align={align} tone={tone} size={size} leader={leader} opacity={opacity} className={`ws-case${className ? ' ' + className : ''}`}>
        {children}
        <span ref={span} />
      </SceneLabel>
    </group>
  )
})
