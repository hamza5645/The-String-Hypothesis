import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/gl'

/*
 * Chapter 07's reference brane as it hands over (content/07-branes.md § Handoff OUT): a 10 × 10 sheet
 * 1.9 below the loop, dimmed to 10%, hairline grid every 0.5 ℓs, fresnel 0.1, edge rim 0.4. Drawn with
 * 07's own shading so the 7 → 8 dissolve doesn't pop. `uSoft` (0 → 1) dissolves the rim and feathers the
 * border as the camera starts to move, so the sheet never reads as a floating tile.
 */

export interface FloorApi {
  mesh: THREE.Mesh
  uniforms: { uOpacity: { value: number }; uSoft: { value: number } }
}

const vert = /* glsl */ `
  varying vec2 vXZ;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vXZ = position.xz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalMatrix * normal;
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSoft;
  uniform float uDpr;
  varying vec2 vXZ;
  varying vec3 vN;
  varying vec3 vV;
  const float HALF = 5.0;
  void main() {
    vec2 g = vXZ / 0.5;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float line = 1.0 - clamp(min(gd.x, gd.y) / (0.75 * uDpr), 0.0, 1.0);
    line *= 1.0 - smoothstep(0.35, 0.8, max(fw.x, fw.y));
    vec2 e = HALF - abs(vXZ);
    vec2 efw = max(fwidth(vXZ), vec2(1e-5));
    float edge = 1.0 - clamp(min(e.x / efw.x, e.y / efw.y) / (1.3 * uDpr), 0.0, 1.0);
    float m = max(abs(vXZ.x), abs(vXZ.y));
    float mask = mix(1.0, smoothstep(HALF, HALF - 3.0, m), uSoft);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
    vec3 col = uColor * ((0.018 + line * 0.14 + fres * 0.1) * mask + edge * 0.4 * (1.0 - uSoft));
    gl_FragColor = vec4(col * uOpacity, 1.0);
  }
`

export const Floor = forwardRef<FloorApi, { y?: number }>(function Floor({ y = -1.9 }, ref) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(10, 10, 1, 1)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uColor: { value: new THREE.Color(COLORS.field) },
        uOpacity: { value: 0.1 },
        uSoft: { value: 0 },
        uDpr: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    m.onBeforeRender = (renderer) => {
      m.uniforms.uDpr.value = renderer.getPixelRatio()
    }
    return m
  }, [])
  const mesh = useMemo(() => {
    const me = new THREE.Mesh(geo, mat)
    me.renderOrder = 0
    return me
  }, [geo, mat])
  useLayoutEffect(() => {
    mesh.position.y = y
  }, [mesh, y])
  useLayoutEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )
  useImperativeHandle(ref, () => ({ mesh, uniforms: mat.uniforms as FloorApi['uniforms'] }), [mesh, mat])
  return <primitive object={mesh} />
})
