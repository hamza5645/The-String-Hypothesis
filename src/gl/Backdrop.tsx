import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { rng } from '../core/math'
import { particleScale } from '../core/settings'
import { ambient } from '../core/time'
import { GlowPoints } from './GlowPoints'
import { useChapterFrame } from './useChapterFrame'

/**
 * Backdrop — sparse deep-space dust and far stars, so every scene shares one sky.
 * Slow drift gives parallax as cameras move. Keep it quiet: it's atmosphere, not content.
 */
export function Backdrop({
  count = 1600,
  radius = [60, 220],
  intensity = 0.55,
  seed = 7,
  drift = 0.004,
}: {
  count?: number
  radius?: [number, number]
  intensity?: number
  seed?: number
  drift?: number
}) {
  const n = Math.max(50, Math.round(count * particleScale()))
  const { positions, sizes, colors } = useMemo(() => {
    const r = rng(seed)
    const positions = new Float32Array(n * 3)
    const sizes = new Float32Array(n)
    const colors = new Float32Array(n * 3)
    const warm = new THREE.Color('#ECE6D9')
    const cool = new THREE.Color('#86A8D8')
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const rad = radius[0] + Math.pow(r(), 0.7) * (radius[1] - radius[0])
      positions[i * 3] = s * Math.cos(th) * rad
      positions[i * 3 + 1] = u * rad * 0.8
      positions[i * 3 + 2] = s * Math.sin(th) * rad
      const big = r() < 0.04
      sizes[i] = (big ? 0.55 : 0.22) * (0.5 + r()) * (rad / 100)
      c.copy(warm).lerp(cool, r() * 0.8)
      const b = big ? 0.9 : 0.25 + r() * 0.45
      colors[i * 3] = c.r * b
      colors[i * 3 + 1] = c.g * b
      colors[i * 3 + 2] = c.b * b
    }
    return { positions, sizes, colors }
  }, [n, seed, radius])

  const group = useRef<THREE.Group>(null!)
  useChapterFrame(({ dt }) => {
    group.current.rotation.y += dt * drift * ambient()
  })

  return (
    <group ref={group}>
      <GlowPoints positions={positions} sizes={sizes} colors={colors} minPixels={0.8} maxPixels={5} intensity={intensity} />
    </group>
  )
}
