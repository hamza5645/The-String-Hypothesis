import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useChapterFrame } from '@/gl'
import type { Stage } from '../director'

/*
 * Measured ground: a disc of radius 7 at y = 0 with a 0.5-unit Field grid (16%) over an Abyss
 * fill (35%). It reveals radially from beneath the opening point with a bright Field leading
 * edge, and fades softly toward its rim. Normal blending, so it quietly occludes the stars below.
 */

const vert = /* glsl */ `
  varying vec2 vXZ;
  void main() {
    vXZ = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const frag = /* glsl */ `
  uniform float uReveal;   // revealed radius
  uniform float uOpacity;
  uniform float uDpr;
  uniform vec3 uField;
  uniform vec3 uAbyss;
  varying vec2 vXZ;
  void main() {
    float r = length(vXZ);
    if (r > 7.0 || r > uReveal + 0.02) discard;
    vec2 g = vXZ / 0.5;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float lw = 0.75 * uDpr;
    float line = max(1.0 - clamp(gd.x / lw, 0.0, 1.0), 1.0 - clamp(gd.y / lw, 0.0, 1.0));
    // dense far cells fade instead of shimmering
    float dens = 1.0 - smoothstep(0.18, 0.55, max(fw.x, fw.y));
    // major lines every 2 units, a touch brighter
    vec2 g2 = vXZ / 2.0;
    vec2 fw2 = max(fwidth(g2), vec2(1e-5));
    vec2 gd2 = abs(fract(g2 - 0.5) - 0.5) / fw2;
    float major = max(1.0 - clamp(gd2.x / lw, 0.0, 1.0), 1.0 - clamp(gd2.y / lw, 0.0, 1.0));
    float rim = 1.0 - smoothstep(4.8, 7.0, r);
    float edgeW = max(fwidth(r), 1e-4) * 2.2 * uDpr;
    float edge = (1.0 - smoothstep(0.0, edgeW * 3.0, abs(r - uReveal))) * step(uReveal, 6.98);
    float edgeGlow = exp(-pow((uReveal - r) / 0.35, 2.0)) * step(r, uReveal) * step(uReveal, 6.98);
    float la = (line * 0.16 * dens + major * 0.07 * dens) * rim;
    float fillA = 0.35 * rim;
    vec3 col = uAbyss * fillA + uField * (la + edge * 0.9 + edgeGlow * 0.12);
    float a = clamp(fillA + la + edge * 0.9, 0.0, 1.0);
    gl_FragColor = vec4(col * uOpacity, a * uOpacity);
  }
`

export function Ground({ S }: { S: Stage }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const geometry = useMemo(() => new THREE.PlaneGeometry(14.2, 14.2, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uReveal: { value: 0 },
          uOpacity: { value: 1 },
          uDpr: { value: 1 },
          uField: { value: new THREE.Color('#86A8D8') },
          uAbyss: { value: new THREE.Color('#0B0F17') },
        },
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useLayoutEffect(() => {
    material.onBeforeRender = (r) => {
      material.uniforms.uDpr.value = r.getPixelRatio()
    }
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useChapterFrame(() => {
    material.uniforms.uReveal.value = S.groundReveal * 7.0
    material.uniforms.uOpacity.value = S.mapVis
    mesh.current.visible = S.groundReveal > 0.001 && S.mapVis > 0.001
  }, { priority: -1.5 })

  return <mesh ref={mesh} geometry={geometry} material={material} rotation-x={-Math.PI / 2} renderOrder={-2} frustumCulled={false} />
}
