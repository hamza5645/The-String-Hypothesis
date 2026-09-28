import { forwardRef, useContext, useImperativeHandle, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import { clock } from '../core/time'
import { ChapterContext } from '../core/chapter'
import { COLORS } from './palette'
import { GlowPoint, type GlowPointApi } from './GlowPoint'

/**
 * Filament — the Thread. A string of light: a crisp bright core with a soft halo,
 * drawn as a screen-space ribbon along any 3D curve.
 *
 * Give it either
 *   fn(u, t, out, i)  → evaluated every frame for u in [0,1] (closed: u=1 wraps to u=0), or
 *   points (Float32Array, count*3) that you mutate yourself, then call api.update().
 *
 * Width is in world units (so it scales with perspective), with a minimum pixel width so it
 * never disappears. Additive, no depth write: filaments read as light.
 */

export type FilamentFn = (u: number, t: number, out: THREE.Vector3, i: number) => void

export interface FilamentProps extends Omit<ThreeElements['group'], 'ref' | 'children'> {
  count?: number
  closed?: boolean
  fn?: FilamentFn
  points?: Float32Array
  /** Full world-space width of the glow (default 0.085). */
  width?: number
  /** Minimum half-width in CSS pixels (default 1.1). */
  minPixels?: number
  /** Halo color. */
  color?: THREE.ColorRepresentation
  /** Core color. */
  coreColor?: THREE.ColorRepresentation
  intensity?: number
  opacity?: number
  /** Fraction of the half-width that is the bright core (default 0.2). */
  coreFraction?: number
  /** 0..1 subtle travelling brightness ripple (energy moving along the string). */
  shimmer?: number
  /** Glowing beads at the two ends (open strings). */
  beads?: boolean
  /** Open strings: fraction of the length over which each end tapers to nothing (e.g. 0.03). */
  taper?: number
  beadSize?: number
  depthTest?: boolean
  renderOrder?: number
  children?: ReactNode
}

export interface FilamentApi {
  points: Float32Array
  /** Push `points` to the GPU (call after mutating points yourself). */
  update(): void
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
  group: THREE.Group
}

const vertexShader = /* glsl */ `
  uniform vec2 uResolution;   // drawing-buffer px
  uniform float uWidth;       // world units (full width)
  uniform float uMinPx;       // min half width, drawing-buffer px
  uniform float uTaper;       // 0 = none; else fraction of length over which open ends taper to nothing
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aU;
  varying float vSide;
  varying float vU;
  varying float vHalfPx;
  varying float vTaper;
  void main() {
    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 c = mvp * vec4(position, 1.0);
    vec4 p = mvp * vec4(aPrev, 1.0);
    vec4 n = mvp * vec4(aNext, 1.0);
    float aspect = uResolution.x / uResolution.y;
    vec2 cs = c.xy / c.w; cs.x *= aspect;
    vec2 ps = p.xy / p.w; ps.x *= aspect;
    vec2 ns = n.xy / n.w; ns.x *= aspect;
    vec2 dir;
    vec2 d1 = cs - ps;
    vec2 d2 = ns - cs;
    float l1 = length(d1);
    float l2 = length(d2);
    if (l1 < 1e-7) dir = d2 / max(l2, 1e-7);
    else if (l2 < 1e-7) dir = d1 / l1;
    else dir = normalize(d1 / l1 + d2 / l2);
    vec2 normal = vec2(-dir.y, dir.x);
    float halfNdc = 0.5 * uWidth * projectionMatrix[1][1] / max(c.w, 1e-5);
    float minNdc = uMinPx * 2.0 / uResolution.y;
    float tp = uTaper > 0.0 ? smoothstep(0.0, uTaper, aU) * smoothstep(0.0, uTaper, 1.0 - aU) : 1.0;
    vTaper = tp;
    float h = max(halfNdc, minNdc) * mix(0.15, 1.0, tp);
    vHalfPx = h * uResolution.y * 0.5;
    vec2 off = normal * h * aSide;
    off.x /= aspect;
    c.xy += off * c.w;
    gl_Position = c;
    vSide = aSide;
    vU = aU;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uGlow;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uCoreFrac;
  uniform float uShimmer;
  uniform float uTime;
  uniform float uDpr;
  varying float vSide;
  varying float vU;
  varying float vHalfPx;
  varying float vTaper;
  void main() {
    float d = abs(vSide);
    float dpx = d * vHalfPx;
    float corePx = max(vHalfPx * uCoreFrac, 0.55 * uDpr);
    float core = 1.0 - smoothstep(corePx - 0.7 * uDpr, corePx + 0.7 * uDpr, dpx);
    float halo = exp(-d * d * 5.5) * (1.0 - d);
    float sh = 1.0 + uShimmer * 0.35 * sin(vU * 38.0 - uTime * 3.2);
    vec3 col = uCore * core + uGlow * halo * 0.62 * sh;
    gl_FragColor = vec4(col * uIntensity * uOpacity * vTaper, 1.0);
  }
`

const tmp = new THREE.Vector3()

export const Filament = forwardRef<FilamentApi, FilamentProps>(function Filament(
  {
    count = 200,
    closed = false,
    fn,
    points: externalPoints,
    width = 0.085,
    minPixels = 1.1,
    color = COLORS.filament,
    coreColor = COLORS.filamentCore,
    intensity = 1,
    opacity = 1,
    coreFraction = 0.2,
    shimmer = 0,
    beads = false,
    taper = 0,
    beadSize,
    depthTest = true,
    renderOrder = 0,
    children,
    ...groupProps
  },
  ref,
) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const beadA = useRef<GlowPointApi>(null)
  const beadB = useRef<GlowPointApi>(null)

  const n = Math.max(2, count)
  const points = useMemo(() => externalPoints ?? new Float32Array(n * 3), [externalPoints, n])

  const geometry = useMemo(() => {
    const m = closed ? n + 1 : n // closed: duplicate first point at the end
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(m * 2 * 3)
    const prev = new Float32Array(m * 2 * 3)
    const next = new Float32Array(m * 2 * 3)
    const side = new Float32Array(m * 2)
    const u = new Float32Array(m * 2)
    for (let j = 0; j < m; j++) {
      side[j * 2] = -1
      side[j * 2 + 1] = 1
      u[j * 2] = u[j * 2 + 1] = j / (m - 1)
    }
    const index: number[] = []
    for (let j = 0; j < m - 1; j++) {
      const a = j * 2
      index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aPrev', new THREE.BufferAttribute(prev, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aNext', new THREE.BufferAttribute(next, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
    g.setAttribute('aU', new THREE.BufferAttribute(u, 1))
    g.setIndex(index)
    return g
  }, [n, closed])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uWidth: { value: width },
          uMinPx: { value: minPixels },
          uTaper: { value: taper },
          uCore: { value: new THREE.Color(coreColor) },
          uGlow: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uOpacity: { value: opacity },
          uCoreFrac: { value: coreFraction },
          uShimmer: { value: shimmer },
          uTime: { value: 0 },
          uDpr: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        depthTest,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // keep uniforms in sync with props
  useLayoutEffect(() => {
    const u = material.uniforms
    u.uWidth.value = width
    u.uMinPx.value = minPixels * dpr
    u.uCore.value.set(coreColor)
    u.uGlow.value.set(color)
    u.uIntensity.value = intensity
    u.uOpacity.value = opacity
    u.uCoreFrac.value = coreFraction
    u.uShimmer.value = shimmer
    u.uTaper.value = closed ? 0 : taper
    u.uDpr.value = dpr
    u.uResolution.value.set(size.width * dpr, size.height * dpr)
    material.depthTest = depthTest
  }, [material, width, minPixels, coreColor, color, intensity, opacity, coreFraction, shimmer, taper, closed, depthTest, size, dpr])

  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => () => material.dispose(), [material])

  const upload = () => {
    const P = points
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute
    const prv = geometry.getAttribute('aPrev') as THREE.BufferAttribute
    const nxt = geometry.getAttribute('aNext') as THREE.BufferAttribute
    const pa = pos.array as Float32Array
    const qa = prv.array as Float32Array
    const na = nxt.array as Float32Array
    const m = closed ? n + 1 : n
    for (let j = 0; j < m; j++) {
      const i = closed ? j % n : j
      const ip = closed ? (i - 1 + n) % n : Math.max(i - 1, 0)
      const inx = closed ? (i + 1) % n : Math.min(i + 1, n - 1)
      for (let s = 0; s < 2; s++) {
        const o = (j * 2 + s) * 3
        pa[o] = P[i * 3]
        pa[o + 1] = P[i * 3 + 1]
        pa[o + 2] = P[i * 3 + 2]
        qa[o] = P[ip * 3]
        qa[o + 1] = P[ip * 3 + 1]
        qa[o + 2] = P[ip * 3 + 2]
        na[o] = P[inx * 3]
        na[o + 1] = P[inx * 3 + 1]
        na[o + 2] = P[inx * 3 + 2]
      }
    }
    pos.needsUpdate = true
    prv.needsUpdate = true
    nxt.needsUpdate = true
    if (beads && !closed) {
      beadA.current?.position.set(P[0], P[1], P[2])
      beadB.current?.position.set(P[(n - 1) * 3], P[(n - 1) * 3 + 1], P[(n - 1) * 3 + 2])
    }
  }

  const fnRef = useRef(fn)
  fnRef.current = fn

  const evaluate = (t: number) => {
    const f = fnRef.current
    if (!f) return
    const P = points
    for (let i = 0; i < n; i++) {
      const u = closed ? i / n : i / (n - 1)
      tmp.set(0, 0, 0)
      f(u, t, tmp, i)
      P[i * 3] = tmp.x
      P[i * 3 + 1] = tmp.y
      P[i * 3 + 2] = tmp.z
    }
    upload()
  }

  // initial fill so the first frame is right
  useLayoutEffect(() => {
    if (fnRef.current) evaluate(clock.t)
    else upload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry])

  const chapter = useContext(ChapterContext)
  useFrame(() => {
    if (chapter && chapter.presence() <= 0) return
    material.uniforms.uTime.value = clock.t
    if (fnRef.current && groupRef.current?.visible !== false) evaluate(clock.t)
  })

  useImperativeHandle(
    ref,
    () => ({
      points,
      update: upload,
      material,
      mesh: meshRef.current,
      group: groupRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, material],
  )

  const bead = beadSize ?? width * 1.9
  return (
    <group ref={groupRef} {...groupProps}>
      <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={renderOrder} />
      {beads && !closed && (
        <>
          <GlowPoint ref={beadA} size={bead} color={color} intensity={intensity * opacity} renderOrder={renderOrder} />
          <GlowPoint ref={beadB} size={bead} color={color} intensity={intensity * opacity} renderOrder={renderOrder} />
        </>
      )}
      {children}
    </group>
  )
})
