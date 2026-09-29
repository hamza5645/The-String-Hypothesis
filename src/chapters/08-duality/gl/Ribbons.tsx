import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS } from '@/gl'

/*
 * Static batches of hairlines: many polylines in one draw call, drawn as screen-space ribbons of a
 * fixed pixel width (crisp at any DPR, unlike GL lines). Flat, normal blending. Geometry is built
 * once; animate with the group transform and the uOpacity / uFlash uniforms.
 */

export interface Polyline {
  /** x,y,z triples */
  pts: number[]
  /** 0..1 rgb */
  color: [number, number, number]
  alpha?: number
}

export interface RibbonsApi {
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial & {
    uniforms: { uOpacity: { value: number }; uFlash: { value: number }; uWidth: { value: number }; uDash: { value: number }; uDashLen: { value: number } }
  }
}

const vert = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uWidth; // half width, CSS px
  uniform float uDpr;
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute vec4 aColor;
  attribute float aDist;
  varying vec4 vColor;
  varying float vSide;
  varying float vHalf;
  varying float vDist;
  void main() {
    vDist = aDist;
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
    float halfPx = uWidth * uDpr + 0.75;
    vHalf = halfPx;
    vec2 off = normal * (halfPx * 2.0 / uResolution.y) * aSide;
    off.x /= aspect;
    c.xy += off * c.w;
    gl_Position = c;
    vColor = aColor;
    vSide = aSide;
  }
`
const frag = /* glsl */ `
  uniform float uOpacity;
  uniform float uFlash;
  uniform vec3 uFlashColor;
  uniform float uWidth;
  uniform float uDpr;
  uniform float uDash;
  uniform float uDashLen;
  varying vec4 vColor;
  varying float vSide;
  varying float vHalf;
  varying float vDist;
  void main() {
    float dpx = abs(vSide) * vHalf;
    float cover = clamp(uWidth * uDpr + 0.5 - dpx, 0.0, 1.0);
    // optional dashes along the polyline (world-space period uDashLen)
    float ph = fract(vDist / uDashLen);
    cover *= mix(1.0, step(ph, 0.5), uDash);
    vec3 col = mix(vColor.rgb, uFlashColor, uFlash);
    gl_FragColor = vec4(col, vColor.a * uOpacity * cover * (1.0 + 0.5 * uFlash));
  }
`

export const Ribbons = forwardRef<RibbonsApi, { lines: Polyline[]; width?: number; renderOrder?: number; depthTest?: boolean }>(function Ribbons(
  { lines, width = 0.6, renderOrder = 0, depthTest = false },
  ref,
) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => {
    let nv = 0
    let ni = 0
    for (const l of lines) {
      const m = l.pts.length / 3
      if (m < 2) continue
      nv += m * 2
      ni += (m - 1) * 6
    }
    const pos = new Float32Array(nv * 3)
    const prev = new Float32Array(nv * 3)
    const next = new Float32Array(nv * 3)
    const side = new Float32Array(nv)
    const color = new Float32Array(nv * 4)
    const dist = new Float32Array(nv)
    const index = new Uint32Array(ni)
    let v = 0
    let k = 0
    for (const l of lines) {
      const P = l.pts
      const m = P.length / 3
      if (m < 2) continue
      const base = v
      let acc = 0
      for (let j = 0; j < m; j++) {
        if (j > 0) acc += Math.hypot(P[j * 3] - P[j * 3 - 3], P[j * 3 + 1] - P[j * 3 - 2], P[j * 3 + 2] - P[j * 3 - 1])
        const jp = Math.max(0, j - 1)
        const jn = Math.min(m - 1, j + 1)
        for (let s = 0; s < 2; s++) {
          const o = v * 3
          pos[o] = P[j * 3]
          pos[o + 1] = P[j * 3 + 1]
          pos[o + 2] = P[j * 3 + 2]
          prev[o] = P[jp * 3]
          prev[o + 1] = P[jp * 3 + 1]
          prev[o + 2] = P[jp * 3 + 2]
          next[o] = P[jn * 3]
          next[o + 1] = P[jn * 3 + 1]
          next[o + 2] = P[jn * 3 + 2]
          side[v] = s ? 1 : -1
          color[v * 4] = l.color[0]
          color[v * 4 + 1] = l.color[1]
          color[v * 4 + 2] = l.color[2]
          color[v * 4 + 3] = l.alpha ?? 1
          dist[v] = acc
          v++
        }
      }
      for (let j = 0; j < m - 1; j++) {
        const a = base + j * 2
        index[k++] = a
        index[k++] = a + 1
        index[k++] = a + 2
        index[k++] = a + 2
        index[k++] = a + 1
        index[k++] = a + 3
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aPrev', new THREE.BufferAttribute(prev, 3))
    g.setAttribute('aNext', new THREE.BufferAttribute(next, 3))
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(color, 4))
    g.setAttribute('aDist', new THREE.BufferAttribute(dist, 1))
    g.setIndex(new THREE.BufferAttribute(index, 1))
    return g
  }, [lines])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uWidth: { value: width },
          uDpr: { value: 1 },
          uOpacity: { value: 1 },
          uFlash: { value: 0 },
          uFlashColor: { value: new THREE.Color(COLORS.ink) },
          uDash: { value: 0 },
          uDashLen: { value: 0.16 },
        },
        transparent: true,
        depthWrite: false,
        depthTest,
        side: THREE.DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useLayoutEffect(() => {
    material.uniforms.uWidth.value = width
    material.uniforms.uDpr.value = dpr
    material.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
  }, [material, width, size, dpr])
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    return m
  }, [geometry, material])
  useLayoutEffect(() => {
    mesh.renderOrder = renderOrder
  }, [mesh, renderOrder])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => () => material.dispose(), [material])
  useImperativeHandle(ref, () => ({ mesh, material: material as RibbonsApi['material'] }), [mesh, material])
  return <primitive object={mesh} />
})

/** A dashed circle in the xy-plane (radius 1; scale the parent group). */
export function dashedCircle(color: [number, number, number], alpha: number, dashes = 44, duty = 0.55): Polyline[] {
  const out: Polyline[] = []
  for (let k = 0; k < dashes; k++) {
    const a0 = (k / dashes) * Math.PI * 2
    const a1 = ((k + duty) / dashes) * Math.PI * 2
    const pts: number[] = []
    for (let s = 0; s <= 4; s++) {
      const a = a0 + ((a1 - a0) * s) / 4
      pts.push(Math.cos(a), Math.sin(a), 0)
    }
    out.push({ pts, color, alpha })
  }
  return out
}

export const rgb = (hex: string): [number, number, number] => {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b]
}
