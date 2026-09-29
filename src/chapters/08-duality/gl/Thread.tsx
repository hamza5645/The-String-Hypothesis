import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS } from '@/gl'

/*
 * A depth-cued Thread: the same screen-space ribbon as the shared <Filament> (crisp core, soft
 * halo, additive), plus a per-point `fade` so the half of a winding that passes behind its hidden
 * circle reads dimmer — the difference between a drawing of a ring and a ring *around* something.
 * Points and fades are written by the caller each frame; call update() afterwards.
 */

export interface ThreadApi {
  points: Float32Array
  fade: Float32Array
  update(): void
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
}

const vert = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uWidth;
  uniform float uMinPx;
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aFade;
  varying float vSide;
  varying float vHalfPx;
  varying float vFade;
  void main() {
    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 c = mvp * vec4(position, 1.0);
    vec4 p = mvp * vec4(aPrev, 1.0);
    vec4 n = mvp * vec4(aNext, 1.0);
    float aspect = uResolution.x / uResolution.y;
    vec2 cs = c.xy / c.w; cs.x *= aspect;
    vec2 ps = p.xy / p.w; ps.x *= aspect;
    vec2 ns = n.xy / n.w; ns.x *= aspect;
    vec2 d1 = cs - ps;
    vec2 d2 = ns - cs;
    float l1 = length(d1);
    float l2 = length(d2);
    vec2 dir;
    if (l1 < 1e-7) dir = d2 / max(l2, 1e-7);
    else if (l2 < 1e-7) dir = d1 / l1;
    else dir = normalize(d1 / l1 + d2 / l2);
    vec2 normal = vec2(-dir.y, dir.x);
    float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
    float halfNdc = 0.5 * uWidth * ws * projectionMatrix[1][1] / max(c.w, 1e-5);
    float h = max(halfNdc, uMinPx * 2.0 / uResolution.y);
    vHalfPx = h * uResolution.y * 0.5;
    vec2 off = normal * h * aSide;
    off.x /= aspect;
    c.xy += off * c.w;
    gl_Position = c;
    vSide = aSide;
    vFade = aFade;
  }
`
const frag = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uGlow;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uCoreFrac;
  uniform float uDpr;
  varying float vSide;
  varying float vHalfPx;
  varying float vFade;
  void main() {
    float d = abs(vSide);
    float dpx = d * vHalfPx;
    float corePx = max(vHalfPx * uCoreFrac, 0.55 * uDpr);
    float core = 1.0 - smoothstep(corePx - 0.7 * uDpr, corePx + 0.7 * uDpr, dpx);
    float halo = exp(-d * d * 5.5) * (1.0 - d);
    vec3 col = uCore * core * mix(0.55, 1.0, vFade) + uGlow * halo * 0.62;
    gl_FragColor = vec4(col * uIntensity * uOpacity * vFade, 1.0);
  }
`

export interface ThreadProps {
  count: number
  closed?: boolean
  width?: number
  minPixels?: number
  color?: THREE.ColorRepresentation
  coreColor?: THREE.ColorRepresentation
  intensity?: number
  coreFraction?: number
  renderOrder?: number
}

export const Thread = forwardRef<ThreadApi, ThreadProps>(function Thread(
  { count, closed = false, width = 0.05, minPixels = 0.9, color = COLORS.filament, coreColor = COLORS.filamentCore, intensity = 1, coreFraction = 0.2, renderOrder = 0 },
  ref,
) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const n = count
  const m = closed ? n + 1 : n
  const points = useMemo(() => new Float32Array(n * 3), [n])
  const fade = useMemo(() => new Float32Array(n).fill(1), [n])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const side = new Float32Array(m * 2)
    for (let j = 0; j < m; j++) {
      side[j * 2] = -1
      side[j * 2 + 1] = 1
    }
    const index: number[] = []
    for (let j = 0; j < m - 1; j++) {
      const a = j * 2
      index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(m * 6), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aPrev', new THREE.BufferAttribute(new Float32Array(m * 6), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aNext', new THREE.BufferAttribute(new Float32Array(m * 6), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aFade', new THREE.BufferAttribute(new Float32Array(m * 2).fill(1), 1).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
    g.setIndex(index)
    return g
  }, [m])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uWidth: { value: width },
          uMinPx: { value: minPixels },
          uCore: { value: new THREE.Color(coreColor) },
          uGlow: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uOpacity: { value: 1 },
          uCoreFrac: { value: coreFraction },
          uDpr: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useLayoutEffect(() => {
    const u = material.uniforms
    u.uWidth.value = width
    u.uMinPx.value = minPixels * dpr
    u.uCore.value.set(coreColor)
    u.uGlow.value.set(color)
    u.uIntensity.value = intensity
    u.uCoreFrac.value = coreFraction
    u.uDpr.value = dpr
    u.uResolution.value.set(size.width * dpr, size.height * dpr)
  }, [material, width, minPixels, coreColor, color, intensity, coreFraction, size, dpr])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => () => material.dispose(), [material])

  const mesh = useMemo(() => {
    const me = new THREE.Mesh(geometry, material)
    me.frustumCulled = false
    return me
  }, [geometry, material])
  useLayoutEffect(() => {
    mesh.renderOrder = renderOrder
  }, [mesh, renderOrder])

  useImperativeHandle(
    ref,
    () => ({
      points,
      fade,
      material,
      mesh,
      update() {
        const pa = (geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
        const qa = (geometry.getAttribute('aPrev') as THREE.BufferAttribute).array as Float32Array
        const na = (geometry.getAttribute('aNext') as THREE.BufferAttribute).array as Float32Array
        const fa = (geometry.getAttribute('aFade') as THREE.BufferAttribute).array as Float32Array
        for (let j = 0; j < m; j++) {
          const i = closed ? j % n : j
          const ip = closed ? (i - 1 + n) % n : Math.max(i - 1, 0)
          const inx = closed ? (i + 1) % n : Math.min(i + 1, n - 1)
          for (let s = 0; s < 2; s++) {
            const o = (j * 2 + s) * 3
            pa[o] = points[i * 3]
            pa[o + 1] = points[i * 3 + 1]
            pa[o + 2] = points[i * 3 + 2]
            qa[o] = points[ip * 3]
            qa[o + 1] = points[ip * 3 + 1]
            qa[o + 2] = points[ip * 3 + 2]
            na[o] = points[inx * 3]
            na[o + 1] = points[inx * 3 + 1]
            na[o + 2] = points[inx * 3 + 2]
            fa[j * 2 + s] = fade[i]
          }
        }
        geometry.getAttribute('position').needsUpdate = true
        geometry.getAttribute('aPrev').needsUpdate = true
        geometry.getAttribute('aNext').needsUpdate = true
        geometry.getAttribute('aFade').needsUpdate = true
      },
    }),
    [points, fade, material, mesh, geometry, m, n, closed],
  )

  return <primitive object={mesh} />
})
