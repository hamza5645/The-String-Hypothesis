import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { createRibbonGeometry, createRibbonMaterial, writeRibbon } from './materials'

/**
 * A diagram line in light (Field-blue by default): screen-space ribbon with a crisp core,
 * optional dashes (status ◌), a double-hairline mode (T-duality causeways) and a grow-in head.
 * Width is world-space with a pixel floor, like <Filament>. Not for strings.
 */
export interface RibbonApi {
  points: Float32Array
  update(): void
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
}

export interface RibbonProps {
  count: number
  closed?: boolean
  /** Initial points (count*3); mutate api.points and call api.update() to animate. */
  init?: (i: number, out: Float32Array) => void
  width?: number
  minPx?: number
  color?: THREE.ColorRepresentation
  opacity?: number
  dash?: number
  duty?: number
  double?: boolean
  glow?: number
  renderOrder?: number
  depthTest?: boolean
  position?: [number, number, number]
}

export const Ribbon = forwardRef<RibbonApi, RibbonProps>(function Ribbon(
  { count, closed = false, init, width = 0.03, minPx = 0.75, color, opacity = 1, dash = 0, duty = 0.55, double = false, glow = 0.35, renderOrder = 4, depthTest = true, position },
  ref,
) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => createRibbonGeometry(count, closed), [count, closed])
  const material = useMemo(() => createRibbonMaterial(), [])
  const points = useMemo(() => new Float32Array(count * 3), [count])
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    return m
  }, [geometry, material])

  useLayoutEffect(() => {
    if (init) {
      for (let i = 0; i < count; i++) init(i, points)
      writeRibbon(geometry, points, count, closed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry])

  useLayoutEffect(() => {
    const u = material.uniforms
    u.uResolution.value.set(size.width * dpr, size.height * dpr)
    u.uWidth.value = width
    u.uMinPx.value = minPx * dpr
    u.uDpr.value = dpr
    if (color !== undefined) u.uColor.value.set(color)
    u.uOpacity.value = opacity
    u.uDash.value = dash
    u.uDuty.value = duty
    u.uDouble.value = double ? 1 : 0
    u.uGlow.value = glow
    material.depthTest = depthTest
    mesh.renderOrder = renderOrder
  }, [material, mesh, size, dpr, width, minPx, color, opacity, dash, duty, double, glow, depthTest, renderOrder])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useImperativeHandle(
    ref,
    () => ({
      points,
      material,
      mesh,
      update: () => writeRibbon(geometry, points, count, closed),
    }),
    [points, material, mesh, geometry, count, closed],
  )
  return <primitive object={mesh} position={position} />
})
