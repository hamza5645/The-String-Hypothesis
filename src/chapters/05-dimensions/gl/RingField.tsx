import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * RingField — a tiny hidden circle at every node of a lattice (content pack Beat 3), drawn as
 * instanced screen-space hairline loops. The loop faces the camera (the hidden circle points along
 * none of our three axes). Uniforms:
 *   uR       base radius (world)          uBreath  0..1 radius field r = uR(1 + 0.25 sin(0.5z − 0.6t))
 *   uGlyph   0..1 morph into the stand-in 6-lobed "hidden shape" glyph (Beat 5)
 *   uOpacity overall alpha                pixel fade: × smoothstep(1px, 4px, projected diameter)
 *   uFocus   0..1 focus on one z-sheet (z = uFocusZ); every other ring drops to 25%
 */

export interface RingFieldApi {
  material: THREE.ShaderMaterial & {
    uniforms: Record<'uR' | 'uBreath' | 'uGlyph' | 'uOpacity' | 'uTime' | 'uSpin' | 'uWidth' | 'uDepthFade' | 'uNear' | 'uFocus' | 'uFocusZ', { value: number }> & {
      uMask: { value: THREE.Vector4 }
      /** x: inner radius (full), y: outer radius (gone) of a spherical falloff around the lattice centre; off when y <= x. */
      uRadial: { value: THREE.Vector2 }
    }
  }
  mesh: THREE.Mesh
}

const SEGS = 56

const vert = /* glsl */ `
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uTime;
  uniform float uR;
  uniform float uBreath;
  uniform float uGlyph;
  uniform float uSpin;
  uniform float uWidth;
  uniform float uOpacity;
  uniform float uDepthFade;
  uniform float uNear;
  uniform vec2 uRadial;
  uniform float uFocus;      // 0..1: dim every ring outside the z = uFocusZ sheet to 25%
  uniform float uFocusZ;
  attribute vec2 aCorner;
  attribute float aSeg;
  attribute vec4 aNode;      // xyz centre, w seed
  varying float vD;
  varying float vHalf;
  varying float vA;
  const float TAU = 6.28318530718;
  const float SEGS = ${SEGS}.0;

  vec3 shapeAt(float th, float r, float seed) {
    vec3 c = vec3(cos(th), sin(th), 0.0);
    // stand-in hidden shape: a 6-fold self-crossing loop with a depth wobble, slowly turning
    vec2 g = vec2(cos(th) + 0.55 * cos(5.0 * th), sin(th) - 0.55 * sin(5.0 * th)) / 1.35;
    float gz = 0.5 * sin(3.0 * th);
    float sp = uSpin + seed * 6.0;
    float cs = cos(sp), sn = sin(sp);
    vec3 g3 = vec3(g.x * cs + gz * sn, g.y, -g.x * sn + gz * cs);          // turn about y
    g3 = vec3(g3.x, g3.y * 0.8776 - g3.z * 0.4794, g3.y * 0.4794 + g3.z * 0.8776); // fixed tilt about x
    return mix(c, g3 * 0.95, uGlyph) * r;
  }

  void main() {
    vec4 cv = modelViewMatrix * vec4(aNode.xyz, 1.0);
    float r = uR * (1.0 + uBreath * 0.25 * sin(0.5 * aNode.z - 0.6 * uTime));
    float th0 = aSeg / SEGS * TAU;
    float th1 = (aSeg + 1.0) / SEGS * TAU;
    vec3 pa = shapeAt(th0, r, aNode.w);
    vec3 pb = shapeAt(th1, r, aNode.w);
    vec4 ca = projectionMatrix * vec4(cv.xyz + pa, 1.0);
    vec4 cb = projectionMatrix * vec4(cv.xyz + pb, 1.0);
    float depth = max(-cv.z, 1e-3);
    if (ca.w < 1e-3 || cb.w < 1e-3) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    // projected diameter (css px) of the base circle
    float diam = 2.0 * r * projectionMatrix[1][1] / depth * uRes.y * 0.5 / uDpr;
    float vis = smoothstep(1.0, 4.0, diam);
    vec2 hr = 0.5 * uRes;
    vec2 sa = ca.xy / ca.w * hr;
    vec2 sb = cb.xy / cb.w * hr;
    vec2 d = sb - sa;
    float len = length(d);
    vec2 dir = len > 1e-5 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float w = uWidth * uDpr;
    float hw = 0.5 * w + uDpr;
    vec4 c = mix(ca, cb, aCorner.x);
    vec2 sp = mix(sa, sb, aCorner.x) + nrm * aCorner.y * hw;
    gl_Position = vec4(sp / hr * c.w, c.z, c.w);
    vD = aCorner.y * hw;
    vHalf = 0.5 * w;
    float df = mix(1.0, clamp(1.35 - depth / uDepthFade, 0.25, 1.0), step(0.001, uDepthFade));
    float nf = uNear > 0.0 ? smoothstep(0.55 * uNear, uNear, depth) : 1.0;       // rings right in front of the lens fade
    float rf = uRadial.y > uRadial.x ? smoothstep(uRadial.y, uRadial.x, length(aNode.xyz)) : 1.0;
    float inSheet = 1.0 - step(0.5, abs(aNode.z - uFocusZ));
    float focus = mix(1.0, mix(0.25, 1.0, inSheet), uFocus);
    vA = uOpacity * vis * df * nf * rf * focus;
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDpr;
  uniform vec2 uRes;
  uniform vec4 uMask;
  varying float vD;
  varying float vHalf;
  varying float vA;
  void main() {
    float cov = 1.0 - smoothstep(vHalf - 0.5 * uDpr, vHalf + 0.5 * uDpr, abs(vD));
    float a = cov * vA;
    if (uMask.z < uMask.w) a *= smoothstep(uMask.z, uMask.w, dot(gl_FragCoord.xy / uRes, uMask.xy));
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor * a, 1.0);
  }
`

/** nodes: Float32Array of xyz triplets. */
export const RingField = forwardRef<RingFieldApi, { nodes: Float32Array; color?: string }>(function RingField({ nodes, color = '#86A8D8' }, ref) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    const pos = new Float32Array(SEGS * 4 * 3)
    const corner = new Float32Array(SEGS * 4 * 2)
    const seg = new Float32Array(SEGS * 4)
    const idx: number[] = []
    for (let i = 0; i < SEGS; i++) {
      const c = [0, -1, 1, -1, 0, 1, 1, 1]
      for (let k = 0; k < 4; k++) {
        corner[(i * 4 + k) * 2] = c[k * 2]
        corner[(i * 4 + k) * 2 + 1] = c[k * 2 + 1]
        seg[i * 4 + k] = i
      }
      const b = i * 4
      idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2))
    g.setAttribute('aSeg', new THREE.BufferAttribute(seg, 1))
    g.setIndex(idx)
    const n = nodes.length / 3
    const node = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      node[i * 4] = nodes[i * 3]
      node[i * 4 + 1] = nodes[i * 3 + 1]
      node[i * 4 + 2] = nodes[i * 3 + 2]
      node[i * 4 + 3] = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1
    }
    g.setAttribute('aNode', new THREE.InstancedBufferAttribute(node, 4))
    g.instanceCount = n
    return g
  }, [nodes])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uRes: { value: new THREE.Vector2(1, 1) },
          uDpr: { value: 1 },
          uTime: { value: 0 },
          uR: { value: 0.12 },
          uBreath: { value: 0 },
          uGlyph: { value: 0 },
          uSpin: { value: 0 },
          uWidth: { value: 1 },
          uOpacity: { value: 0 },
          uDepthFade: { value: 0 },
          uNear: { value: 0 },
          uMask: { value: new THREE.Vector4(0, 0, 1, 0) },
          uRadial: { value: new THREE.Vector2(0, 0) },
          uFocus: { value: 0 },
          uFocusZ: { value: 0 },
          uColor: { value: new THREE.Color(color) },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
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
  useImperativeHandle(ref, () => ({ material: material as RingFieldApi['material'], mesh }), [material, mesh])
  return <primitive object={mesh} />
})
