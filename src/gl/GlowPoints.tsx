import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeElements } from '@react-three/fiber'
import { COLORS } from './palette'

/**
 * GlowPoints — many soft points in one draw call (dust, particle swarms, point clouds,
 * "a human made of points"). Per-point attributes:
 *   position (vec3), aSize (float, world units, optional), aColor (vec3, optional), aAlpha (float, optional)
 * Mutate the attribute arrays and set needsUpdate for animation, or animate in a custom shader.
 */
export interface GlowPointsProps extends Omit<ThreeElements['points'], 'ref' | 'args'> {
  positions: Float32Array
  sizes?: Float32Array
  colors?: Float32Array
  alphas?: Float32Array
  /** Default world size when `sizes` is not given. */
  size?: number
  minPixels?: number
  maxPixels?: number
  color?: THREE.ColorRepresentation
  intensity?: number
  /** 0 = soft gaussian dot, 1 = crisp disc with small halo. */
  sharpness?: number
}

export type GlowPointsApi = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>

const vert = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uResY;    // drawing-buffer height in px
  uniform float uMinPx;
  uniform float uMaxPx;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2])); // parent scale
    float px = aSize * ws * projectionMatrix[1][1] * uResY * 0.5 / max(-mv.z, 1e-4);
    float clamped = clamp(px, uMinPx, uMaxPx);
    // points smaller than the min size fade instead of shrinking (keeps density honest)
    vAlpha = aAlpha * min(1.0, px / max(uMinPx, 1e-4) + 0.25);
    vColor = aColor;
    gl_PointSize = clamped;
  }
`
const frag = /* glsl */ `
  uniform vec3 uTint;
  uniform float uIntensity;
  uniform float uSharp;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r = length(c);
    if (r > 1.0) discard;
    float soft = exp(-r * r * 4.0) * (1.0 - r);
    float disc = 1.0 - smoothstep(0.35, 0.5, r);
    float a = mix(soft, max(disc, soft * 0.5), uSharp);
    gl_FragColor = vec4(vColor * uTint * a * vAlpha * uIntensity, 1.0);
  }
`

export const GlowPoints = forwardRef<GlowPointsApi, GlowPointsProps>(function GlowPoints(
  { positions, sizes, colors, alphas, size = 0.05, minPixels = 1, maxPixels = 64, color = COLORS.ink, intensity = 1, sharpness = 0, ...props },
  ref,
) {
  const gsize = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const count = positions.length / 3

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes ?? new Float32Array(count).fill(size), 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(colors ?? new Float32Array(count * 3).fill(1), 3))
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alphas ?? new Float32Array(count).fill(1), 1))
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, sizes, colors, alphas, count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uResY: { value: 800 },
          uMinPx: { value: minPixels },
          uMaxPx: { value: maxPixels },
          uTint: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uSharp: { value: sharpness },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useLayoutEffect(() => {
    const u = material.uniforms
    u.uResY.value = gsize.height * dpr
    u.uMinPx.value = minPixels * dpr
    u.uMaxPx.value = maxPixels * dpr
    u.uTint.value.set(color)
    u.uIntensity.value = intensity
    u.uSharp.value = sharpness
  }, [material, gsize, dpr, minPixels, maxPixels, color, intensity, sharpness])

  // `size` (when no per-point `sizes`) stays live
  useLayoutEffect(() => {
    if (sizes) return
    const a = geometry.getAttribute('aSize') as THREE.BufferAttribute
    ;(a.array as Float32Array).fill(size)
    a.needsUpdate = true
  }, [geometry, sizes, size])

  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => () => material.dispose(), [material])

  const pts = useMemo(() => new THREE.Points(geometry, material), [geometry, material])
  useImperativeHandle(ref, () => pts as GlowPointsApi, [pts])
  return <primitive object={pts} frustumCulled={false} {...props} />
})
