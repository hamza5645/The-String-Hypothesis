import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * CableMesh — the Beat 2 / ZOOM cable: a Field-blue wireframe tube (16 longitudinal lines, a ring every
 * 0.5 radii) of radius 1 along x, length uLen (local units). Screen-space safe:
 *  - never thinner than uMinPx (css px): far away it is a single bright hairline;
 *  - per-vertex resolvedness ρ = smoothstep(1.5px, 6px, projected diameter) cross-fades line → tube;
 *  - rings fade before they alias; the far end fades with distance.
 * uOnly0 keeps only the cross-section ring at x = 0 (used when the tube dissolves into the lattice).
 */

export type CableUniforms = Record<'uLen' | 'uMinPx' | 'uOpacity' | 'uOnly0' | 'uFog' | 'uFar', { value: number }> & { uMask: { value: THREE.Vector4 } }
export interface CableApi {
  material: THREE.ShaderMaterial & { uniforms: CableUniforms }
  mesh: THREE.Mesh
}

const vert = /* glsl */ `
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uLen;
  uniform float uMinPx;
  varying float vX;
  varying float vU;
  varying float vRho;
  varying float vFres;
  varying float vDepth;
  void main() {
    float x = position.x * uLen;
    vec3 radial = vec3(0.0, position.y, position.z);
    vec4 va = modelViewMatrix * vec4(x, 0.0, 0.0, 1.0);
    float ws = length(modelMatrix[0].xyz);
    float depth = max(-va.z, 1e-4);
    float rpx = ws * projectionMatrix[1][1] / depth * uRes.y * 0.5 / uDpr;   // css px per local unit
    float k = max(1.0, uMinPx / max(rpx, 1e-6));
    vec4 mv = modelViewMatrix * vec4(vec3(x, 0.0, 0.0) + radial * k, 1.0);
    gl_Position = projectionMatrix * mv;
    vX = x;
    vU = uv.x;
    vRho = smoothstep(1.5, 6.0, 2.0 * rpx);
    vec3 n = normalize(mat3(modelViewMatrix) * radial);
    vFres = 1.0 - abs(dot(n, normalize(-mv.xyz)));
    vDepth = depth;
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uOnly0;
  uniform float uLen;
  uniform float uFog;
  uniform float uFar;
  uniform float uDpr;
  uniform vec2 uRes;
  uniform vec4 uMask;
  varying float vX;
  varying float vU;
  varying float vRho;
  varying float vFres;
  varying float vDepth;
  float aline(float g, float wpx) {
    float fw = max(fwidth(g), 1e-5);
    float d = abs(fract(g - 0.5) - 0.5) / fw;
    return 1.0 - clamp(d / (wpx * uDpr), 0.0, 1.0);
  }
  void main() {
    float gu = vU * 16.0;
    float gr = vX / 0.5;
    float lineU = aline(gu, 0.8);
    float ringFade = 1.0 - smoothstep(0.1, 0.32, fwidth(gr));
    float ring = aline(gr, 0.8) * ringFade;
    float ring0 = 1.0 - clamp(abs(vX) / max(fwidth(vX), 1e-5) / (1.1 * uDpr), 0.0, 1.0);
    float near = 0.02 + 0.16 * vFres * vFres + 0.5 * lineU + 0.36 * ring;
    float far = uFar;
    float body = mix(far, near, vRho);
    float b = mix(body, 0.95 * ring0, uOnly0);
    float endFade = smoothstep(0.5 * uLen, 0.36 * uLen, abs(vX));
    float fog = clamp(1.5 - vDepth / uFog, 0.0, 1.0);
    float a = b * endFade * mix(fog, 1.0, uOnly0) * uOpacity;
    if (uMask.z < uMask.w) a *= smoothstep(uMask.z, uMask.w, dot(gl_FragCoord.xy / uRes, uMask.xy));
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor * a, 1.0);
  }
`

export const CableMesh = forwardRef<CableApi, { color?: string }>(function CableMesh({ color = '#86A8D8' }, ref) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => {
    // many height segments: per-vertex screen quantities (min width, resolvedness, depth) must be sampled
    // along the tube, and vertices far along it can sit behind the camera
    const g = new THREE.CylinderGeometry(1, 1, 1, 64, 240, true)
    g.rotateZ(-Math.PI / 2)
    return g
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uRes: { value: new THREE.Vector2(1, 1) },
          uDpr: { value: 1 },
          uLen: { value: 60 },
          uMinPx: { value: 0.75 },
          uOpacity: { value: 0 },
          uOnly0: { value: 0 },
          uFog: { value: 1e6 },
          uFar: { value: 0.5 },
          uMask: { value: new THREE.Vector4(0, 0, 1, 0) },
          uColor: { value: new THREE.Color(color) },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useLayoutEffect(() => {
    material.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
    material.uniforms.uDpr.value = dpr
  }, [material, size, dpr])
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    m.renderOrder = 1
    return m
  }, [geometry, material])
  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useImperativeHandle(ref, () => ({ material: material as CableApi['material'], mesh }), [material, mesh])
  return <primitive object={mesh} />
})
