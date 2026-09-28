import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeElements } from '@react-three/fiber'
import { COLORS } from './palette'

/**
 * GlowPoint — a single point particle of light (camera-facing billboard).
 * Size is in world units (scales with perspective and parent scale) with a minimum pixel radius,
 * so a point stays visible when far away.
 */
export interface GlowPointProps extends Omit<ThreeElements['mesh'], 'ref' | 'args'> {
  size?: number
  minPixels?: number
  color?: THREE.ColorRepresentation
  coreColor?: THREE.ColorRepresentation
  intensity?: number
  /** 0..1 how much of the radius is the hot core (default 0.18). */
  core?: number
}

export type GlowPointApi = THREE.Mesh & { material: THREE.ShaderMaterial }

const vert = /* glsl */ `
  uniform float uSize;
  uniform float uMinPx;
  uniform vec2 uResolution;
  varying vec2 vUv;
  void main() {
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 clip = projectionMatrix * mv;
    float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2])); // parent scale
    float worldSize = uSize * ws;
    float halfPx = 0.5 * worldSize * projectionMatrix[1][1] / max(clip.w, 1e-5) * uResolution.y * 0.5;
    float s = max(halfPx, uMinPx) / max(halfPx, 1e-5);
    mv.xy += position.xy * worldSize * s;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy * 2.0;
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uIntensity;
  uniform float uCoreR;
  varying vec2 vUv;
  void main() {
    float r = length(vUv);
    if (r > 1.0) discard;
    float core = exp(-pow(r / max(uCoreR, 1e-3), 2.0) * 2.2);
    float halo = exp(-r * r * 4.5) * (1.0 - r);
    vec3 col = uCore * core + uColor * halo * 0.8;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`

export const GlowPoint = forwardRef<GlowPointApi, GlowPointProps>(function GlowPoint(
  { size = 0.3, minPixels = 2, color = COLORS.filament, coreColor = COLORS.filamentCore, intensity = 1, core = 0.18, ...props },
  ref,
) {
  const meshRef = useRef<GlowPointApi>(null!)
  const gsize = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uSize: { value: size },
          uMinPx: { value: minPixels },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uColor: { value: new THREE.Color(color) },
          uCore: { value: new THREE.Color(coreColor) },
          uIntensity: { value: intensity },
          uCoreR: { value: core },
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
    u.uSize.value = size
    u.uMinPx.value = minPixels * dpr
    u.uResolution.value.set(gsize.width * dpr, gsize.height * dpr)
    u.uColor.value.set(color)
    u.uCore.value.set(coreColor)
    u.uIntensity.value = intensity
    u.uCoreR.value = core
  }, [material, size, minPixels, gsize, dpr, color, coreColor, intensity, core])
  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useImperativeHandle(ref, () => meshRef.current)
  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} {...props} />
})
