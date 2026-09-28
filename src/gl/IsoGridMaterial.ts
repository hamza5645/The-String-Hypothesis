import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from './palette'

/**
 * IsoGrid — the project's "diagram drawn in light" surface material.
 * A translucent, additive surface with anti-aliased parametric grid lines (iso-u / iso-v),
 * a fresnel rim, and an optional reveal clip with a bright leading edge — ideal for
 * worldsheets growing through time, branes, compact cylinders and Calabi–Yau patches.
 *
 * Uses the geometry's `uv`: lines are drawn at uv * grid.
 * Animate via material.uniforms.* (e.g. uReveal) inside useFrame.
 */
export interface IsoGridOptions {
  color?: THREE.ColorRepresentation
  lineColor?: THREE.ColorRepresentation
  edgeColor?: THREE.ColorRepresentation
  /** Number of grid lines along u and v (0 disables that family). */
  grid?: [number, number]
  /** Line width in CSS px. */
  lineWidth?: number
  /** Base fill brightness (0..1). */
  fill?: number
  /** Fresnel rim brightness. */
  fresnel?: number
  opacity?: number
  /** 0..1 reveal along the chosen uv axis (fragments beyond are clipped). 1 = fully shown. */
  reveal?: number
  revealAxis?: 'u' | 'v'
  /** Brightness of the leading-edge line at the reveal boundary. */
  edge?: number
  side?: THREE.Side
  depthTest?: boolean
}

export type IsoGridUniforms = {
  uColor: { value: THREE.Color }
  uLine: { value: THREE.Color }
  uEdgeColor: { value: THREE.Color }
  uGrid: { value: THREE.Vector2 }
  uLineWidth: { value: number }
  uFill: { value: number }
  uFresnel: { value: number }
  uOpacity: { value: number }
  uReveal: { value: number }
  uRevealAxis: { value: number }
  uEdge: { value: number }
  uDpr: { value: number }
}

const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 p = vec4(position, 1.0);
    vec3 nrm = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      nrm = mat3(instanceMatrix) * nrm;
    #endif
    vec4 mv = modelViewMatrix * p;
    vN = normalMatrix * nrm;
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLine;
  uniform vec3 uEdgeColor;
  uniform vec2 uGrid;
  uniform float uLineWidth;
  uniform float uFill;
  uniform float uFresnel;
  uniform float uOpacity;
  uniform float uReveal;
  uniform float uRevealAxis;
  uniform float uEdge;
  uniform float uDpr;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float coord = mix(vUv.y, vUv.x, uRevealAxis);
    if (coord > uReveal + 1e-4) discard;
    vec2 g = vUv * uGrid;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float lw = max(uLineWidth * uDpr, 0.5);
    float lu = (1.0 - clamp(gd.x / lw, 0.0, 1.0)) * step(0.5, uGrid.x);
    float lv = (1.0 - clamp(gd.y / lw, 0.0, 1.0)) * step(0.5, uGrid.y);
    float line = max(lu, lv);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
    float cw = max(fwidth(coord), 1e-5);
    float edge = (1.0 - clamp(abs(coord - uReveal) / (cw * 2.2 * uDpr), 0.0, 1.0)) * step(uReveal, 0.9995);
    vec3 col = uColor * (uFill + fres * uFresnel) + uLine * line + uEdgeColor * edge * uEdge;
    gl_FragColor = vec4(col * uOpacity, 1.0);
  }
`

export function createIsoGridMaterial(o: IsoGridOptions = {}) {
  const m = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uColor: { value: new THREE.Color(o.color ?? COLORS.field) },
      uLine: { value: new THREE.Color(o.lineColor ?? COLORS.field) },
      uEdgeColor: { value: new THREE.Color(o.edgeColor ?? COLORS.filamentCore) },
      uGrid: { value: new THREE.Vector2(...(o.grid ?? [24, 12])) },
      uLineWidth: { value: o.lineWidth ?? 0.9 },
      uFill: { value: o.fill ?? 0.05 },
      uFresnel: { value: o.fresnel ?? 0.35 },
      uOpacity: { value: o.opacity ?? 1 },
      uReveal: { value: o.reveal ?? 1 },
      uRevealAxis: { value: o.revealAxis === 'u' ? 1 : 0 },
      uEdge: { value: o.edge ?? 0 },
      uDpr: { value: 1 },
    } satisfies IsoGridUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: o.depthTest ?? true,
    blending: THREE.AdditiveBlending,
    side: o.side ?? THREE.DoubleSide,
  })
  // keep line widths correct at any pixel ratio, for factory-made materials too
  m.onBeforeRender = (renderer) => {
    m.uniforms.uDpr.value = renderer.getPixelRatio()
  }
  return m as THREE.ShaderMaterial & { uniforms: IsoGridUniforms }
}

/** Memoized IsoGrid material; options are applied on change. Mutate uniforms per-frame for animation. */
export function useIsoGridMaterial(o: IsoGridOptions = {}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => createIsoGridMaterial(o), [])
  useLayoutEffect(() => {
    const u = m.uniforms
    if (o.color !== undefined) u.uColor.value.set(o.color)
    if (o.lineColor !== undefined) u.uLine.value.set(o.lineColor)
    if (o.edgeColor !== undefined) u.uEdgeColor.value.set(o.edgeColor)
    if (o.grid) u.uGrid.value.set(o.grid[0], o.grid[1])
    if (o.lineWidth !== undefined) u.uLineWidth.value = o.lineWidth
    if (o.fill !== undefined) u.uFill.value = o.fill
    if (o.fresnel !== undefined) u.uFresnel.value = o.fresnel
    if (o.opacity !== undefined) u.uOpacity.value = o.opacity
    if (o.edge !== undefined) u.uEdge.value = o.edge
    if (o.reveal !== undefined) u.uReveal.value = o.reveal
    if (o.revealAxis) u.uRevealAxis.value = o.revealAxis === 'u' ? 1 : 0
    if (o.side !== undefined) m.side = o.side
    if (o.depthTest !== undefined) m.depthTest = o.depthTest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, o.color, o.lineColor, o.edgeColor, o.grid?.[0], o.grid?.[1], o.lineWidth, o.fill, o.fresnel, o.opacity, o.edge, o.reveal, o.revealAxis, o.side, o.depthTest])
  useLayoutEffect(() => () => m.dispose(), [m])
  return m
}
