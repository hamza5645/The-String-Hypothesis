import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Hairlines — every diagram line of the chapter in ONE draw call: anti-aliased screen-space
 * segments with a width in CSS px (so a "1 px hairline" stays 1 px at any distance and DPR),
 * optional dashes, additive (diagram drawn in light). Rebuild the list every frame:
 *   api.begin(); api.seg(...); api.circle(...); api.end()
 * No allocations per call.
 */
export interface HairApi {
  begin(): void
  /** One segment A→B (world). */
  seg(ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: THREE.Color, alpha: number, width?: number, dash?: number): void
  /** Arc of a circle centred at (cx,cy,cz) in the plane spanned by unit vectors u, v. */
  arc(
    cx: number,
    cy: number,
    cz: number,
    ux: number,
    uy: number,
    uz: number,
    vx: number,
    vy: number,
    vz: number,
    r: number,
    a0: number,
    a1: number,
    segs: number,
    c: THREE.Color,
    alpha: number,
    width?: number,
    dash?: number,
  ): void
  end(): void
  count(): number
}

const vert = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute vec4 aC;
  attribute vec2 aW;
  uniform vec2 uRes;
  uniform float uDpr;
  varying vec4 vC;
  varying float vS;
  varying float vHW;
  varying float vAlong;
  varying float vDash;
  varying float vCov;
  void main() {
    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 a = mvp * vec4(aA, 1.0);
    vec4 b = mvp * vec4(aB, 1.0);
    vec2 sa = (a.xy / max(a.w, 1e-5)) * 0.5 * uRes;
    vec2 sb = (b.xy / max(b.w, 1e-5)) * 0.5 * uRes;
    vec2 d = sb - sa;
    float len = length(d);
    vec2 dir = len > 1e-5 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float w = aW.x * uDpr;
    float hw = max(0.5 * w, 0.5);
    float ext = hw + 1.0;
    vec4 c = mix(a, b, position.x);
    vec2 off = nrm * ext * position.y + dir * (position.x * 2.0 - 1.0) * 0.5;
    c.xy += off / (0.5 * uRes) * c.w;
    gl_Position = c;
    vC = aC;
    vS = position.y * ext;
    vHW = hw;
    vAlong = position.x * len;
    vDash = aW.y * uDpr;
    vCov = min(1.0, w);
  }
`
const frag = /* glsl */ `
  varying vec4 vC;
  varying float vS;
  varying float vHW;
  varying float vAlong;
  varying float vDash;
  varying float vCov;
  void main() {
    float a = clamp(vHW + 0.5 - abs(vS), 0.0, 1.0) * vCov;
    if (vDash > 0.0) {
      float ph = fract(vAlong / vDash);
      a *= smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.5, 0.58, ph));
    }
    gl_FragColor = vec4(vC.rgb * vC.a * a, 1.0);
  }
`

export const Hairlines = forwardRef<HairApi, { capacity?: number; renderOrder?: number }>(function Hairlines({ capacity = 2048, renderOrder = 2 }, ref) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const { geometry, material, A, Bv, C, W, attrs } = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3))
    g.setIndex([0, 1, 2, 2, 1, 3])
    const A = new Float32Array(capacity * 3)
    const Bv = new Float32Array(capacity * 3)
    const C = new Float32Array(capacity * 4)
    const W = new Float32Array(capacity * 2)
    const attrs = [
      new THREE.InstancedBufferAttribute(A, 3).setUsage(THREE.DynamicDrawUsage),
      new THREE.InstancedBufferAttribute(Bv, 3).setUsage(THREE.DynamicDrawUsage),
      new THREE.InstancedBufferAttribute(C, 4).setUsage(THREE.DynamicDrawUsage),
      new THREE.InstancedBufferAttribute(W, 2).setUsage(THREE.DynamicDrawUsage),
    ]
    g.setAttribute('aA', attrs[0])
    g.setAttribute('aB', attrs[1])
    g.setAttribute('aC', attrs[2])
    g.setAttribute('aW', attrs[3])
    g.instanceCount = 0
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uDpr: { value: 1 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: g, material, A, Bv, C, W, attrs }
  }, [capacity])

  useLayoutEffect(() => {
    material.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
    material.uniforms.uDpr.value = dpr
  }, [material, size, dpr])
  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    m.renderOrder = renderOrder
    m.raycast = () => {}
    return m
  }, [geometry, material, renderOrder])

  const api = useMemo<HairApi>(() => {
    let n = 0
    const seg: HairApi['seg'] = (ax, ay, az, bx, by, bz, c, alpha, width = 1, dash = 0) => {
      if (n >= capacity || alpha <= 0.002) return
      const i3 = n * 3
      A[i3] = ax
      A[i3 + 1] = ay
      A[i3 + 2] = az
      Bv[i3] = bx
      Bv[i3 + 1] = by
      Bv[i3 + 2] = bz
      const i4 = n * 4
      C[i4] = c.r
      C[i4 + 1] = c.g
      C[i4 + 2] = c.b
      C[i4 + 3] = alpha
      W[n * 2] = width
      W[n * 2 + 1] = dash
      n++
    }
    return {
      begin() {
        n = 0
      },
      seg,
      arc(cx, cy, cz, ux, uy, uz, vx, vy, vz, r, a0, a1, segs, c, alpha, width = 1, dash = 0) {
        if (alpha <= 0.002) return
        let px = cx + r * (ux * Math.cos(a0) + vx * Math.sin(a0))
        let py = cy + r * (uy * Math.cos(a0) + vy * Math.sin(a0))
        let pz = cz + r * (uz * Math.cos(a0) + vz * Math.sin(a0))
        for (let i = 1; i <= segs; i++) {
          const a = a0 + ((a1 - a0) * i) / segs
          const ca = Math.cos(a)
          const sa = Math.sin(a)
          const qx = cx + r * (ux * ca + vx * sa)
          const qy = cy + r * (uy * ca + vy * sa)
          const qz = cz + r * (uz * ca + vz * sa)
          seg(px, py, pz, qx, qy, qz, c, alpha, width, dash)
          px = qx
          py = qy
          pz = qz
        }
      },
      end() {
        geometry.instanceCount = n
        for (const at of attrs) {
          at.clearUpdateRanges()
          at.addUpdateRange(0, Math.max(1, n) * at.itemSize)
          at.needsUpdate = true
        }
      },
      count: () => n,
    }
  }, [capacity, A, Bv, C, W, attrs, geometry])

  useImperativeHandle(ref, () => api, [api])
  return <primitive object={mesh} />
})
