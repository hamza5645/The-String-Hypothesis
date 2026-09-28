import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * HairLines — the chapter's "diagram drawn in light": thousands of anti-aliased line segments in
 * one draw call (instanced screen-space quads). Widths are in CSS px, dashes in CSS px, colours are
 * additive. Immediate mode: call begin(), seg(...) for every segment this frame, then end().
 * Nothing allocates per frame; only the used range is uploaded.
 */

export interface HairLinesApi {
  begin(): void
  /** One segment A→B, colour rgb (0..1) × alpha, width (CSS px), dash period (CSS px, 0 = solid). */
  seg(ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, g: number, b: number, a: number, w?: number, dash?: number): void
  end(): void
  readonly count: number
  readonly capacity: number
  material: THREE.ShaderMaterial
  object: THREE.Mesh
}

const vert = /* glsl */ `
  uniform vec2 uRes;      // drawing-buffer px
  uniform float uDpr;
  attribute vec2 aCorner; // x: 0 at A, 1 at B ; y: side −1/+1
  attribute vec3 aA;
  attribute vec3 aB;
  attribute vec4 aColor;
  attribute vec2 aStyle;  // x: width (css px), y: dash period (css px)
  varying vec4 vColor;
  varying float vD;
  varying float vHalf;
  varying float vW;
  varying float vAlongW;   // along-distance × w and w: their ratio interpolates linearly in screen space
  varying float vWw;
  varying float vDash;
  void main() {
    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 ca = mvp * vec4(aA, 1.0);
    vec4 cb = mvp * vec4(aB, 1.0);
    // keep both ends in front of the camera
    float nearW = 1e-3;
    if (ca.w < nearW && cb.w < nearW) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    if (ca.w < nearW) ca = mix(ca, cb, (nearW - ca.w) / (cb.w - ca.w));
    if (cb.w < nearW) cb = mix(cb, ca, (nearW - cb.w) / (ca.w - cb.w));
    vec2 half_res = 0.5 * uRes;
    vec2 sa = ca.xy / ca.w * half_res;
    vec2 sb = cb.xy / cb.w * half_res;
    vec2 d = sb - sa;
    float len = length(d);
    vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float w = max(aStyle.x * uDpr, 0.0);
    float drawW = max(w, uDpr);            // never thinner than one css px: fade instead
    float hw = 0.5 * drawW + uDpr;         // +1 css px for anti-aliasing
    vec4 c = mix(ca, cb, aCorner.x);
    // no end caps: joints of polylines would overlap (additive) and read as dots
    vec2 sp = mix(sa, sb, aCorner.x) + nrm * aCorner.y * hw;
    gl_Position = vec4(sp / half_res * c.w, c.z, c.w);
    vD = aCorner.y * hw;
    vHalf = 0.5 * drawW;
    vW = clamp(w / drawW, 0.0, 1.0);
    vAlongW = mix(0.0, len, aCorner.x) * c.w;
    vWw = c.w;
    vDash = aStyle.y * uDpr;
    vColor = aColor;
  }
`
const frag = /* glsl */ `
  uniform float uOpacity;
  uniform float uDpr;
  uniform vec2 uRes;
  uniform vec4 uMask;   // screen-space fade: s = dot(fragCoord/res, mask.xy); alpha *= smoothstep(mask.z, mask.w, s) (off when z >= w)
  varying vec4 vColor;
  varying float vD;
  varying float vHalf;
  varying float vW;
  varying float vAlongW;
  varying float vWw;
  varying float vDash;
  void main() {
    float cov = 1.0 - smoothstep(vHalf - 0.5 * uDpr, vHalf + 0.5 * uDpr, abs(vD));
    if (vDash > 0.0) {
      float m = mod(vAlongW / vWw, vDash);
      float on = 0.52 * vDash;
      cov *= 1.0 - smoothstep(on - 0.6 * uDpr, on + 0.6 * uDpr, m);
    }
    float a = cov * vColor.a * vW * uOpacity;
    if (uMask.z < uMask.w) a *= smoothstep(uMask.z, uMask.w, dot(gl_FragCoord.xy / uRes, uMask.xy));
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor.rgb * a, 1.0);
  }
`

export const HairLines = forwardRef<HairLinesApi, { capacity?: number; renderOrder?: number; depthTest?: boolean; opacity?: number }>(function HairLines(
  { capacity = 1024, renderOrder = 2, depthTest = false, opacity = 1 },
  ref,
) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)

  const { geometry, A, B, C, S, attrs } = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]), 3))
    g.setAttribute('aCorner', new THREE.BufferAttribute(new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]), 2))
    g.setIndex([0, 1, 2, 2, 1, 3])
    const A = new Float32Array(capacity * 3)
    const B = new Float32Array(capacity * 3)
    const C = new Float32Array(capacity * 4)
    const S = new Float32Array(capacity * 2)
    const aA = new THREE.InstancedBufferAttribute(A, 3).setUsage(THREE.DynamicDrawUsage)
    const aB = new THREE.InstancedBufferAttribute(B, 3).setUsage(THREE.DynamicDrawUsage)
    const aC = new THREE.InstancedBufferAttribute(C, 4).setUsage(THREE.DynamicDrawUsage)
    const aS = new THREE.InstancedBufferAttribute(S, 2).setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('aA', aA)
    g.setAttribute('aB', aB)
    g.setAttribute('aColor', aC)
    g.setAttribute('aStyle', aS)
    g.instanceCount = 0
    return { geometry: g, A, B, C, S, attrs: [aA, aB, aC, aS] as const }
  }, [capacity])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uDpr: { value: 1 }, uOpacity: { value: 1 }, uMask: { value: new THREE.Vector4(0, 0, 1, 0) } },
        transparent: true,
        depthWrite: false,
        depthTest,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useLayoutEffect(() => {
    material.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
    material.uniforms.uDpr.value = dpr
    material.uniforms.uOpacity.value = opacity
    material.depthTest = depthTest
  }, [material, size, dpr, opacity, depthTest])

  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    m.renderOrder = renderOrder
    return m
  }, [geometry, material, renderOrder])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const api = useMemo<HairLinesApi>(() => {
    let n = 0
    return {
      begin() {
        n = 0
      },
      seg(ax, ay, az, bx, by, bz, r, g, b, a, w = 1, dash = 0) {
        if (n >= capacity || a <= 0.001) return
        const i3 = n * 3
        A[i3] = ax
        A[i3 + 1] = ay
        A[i3 + 2] = az
        B[i3] = bx
        B[i3 + 1] = by
        B[i3 + 2] = bz
        const i4 = n * 4
        C[i4] = r
        C[i4 + 1] = g
        C[i4 + 2] = b
        C[i4 + 3] = a
        S[n * 2] = w
        S[n * 2 + 1] = dash
        n++
      },
      end() {
        geometry.instanceCount = n
        for (const at of attrs) {
          at.clearUpdateRanges()
          if (n > 0) at.addUpdateRange(0, n * at.itemSize)
          at.needsUpdate = true
        }
      },
      get count() {
        return n
      },
      capacity,
      material,
      object: mesh,
    }
  }, [capacity, A, B, C, S, attrs, geometry, material, mesh])

  useImperativeHandle(ref, () => api, [api])
  return <primitive object={mesh} />
})

/* ─────────────── colour helpers (display-space rgb, colour management is off) ─────────────── */

export type RGB = readonly [number, number, number]
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const
}
export const C_INK: RGB = hex('#ECE6D9')
export const C_INK2: RGB = hex('#9AA0AE')
export const C_INK3: RGB = hex('#5C6270')
export const C_FIELD: RGB = hex('#86A8D8')
export const C_FIELD_DEEP: RGB = hex('#2B3D5C')
export const C_FIL: RGB = hex('#FFC98A')
export const C_CONJ: RGB = hex('#A99BD6')
export const C_SPEC: RGB = hex('#7D8190')

/** Convenience: segment with an RGB tuple. */
export function sg(L: HairLinesApi, ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: RGB, a: number, w = 1, dash = 0) {
  L.seg(ax, ay, az, bx, by, bz, c[0], c[1], c[2], a, w, dash)
}

/** A polyline of a parametric curve f(u) for u ∈ [u0,u1] (writes into a shared scratch vector). */
const P0 = new THREE.Vector3()
const P1 = new THREE.Vector3()
export function curve(
  L: HairLinesApi,
  f: (u: number, out: THREE.Vector3) => void,
  u0: number,
  u1: number,
  n: number,
  c: RGB,
  a: number | ((u: number) => number),
  w = 1,
  dash = 0,
) {
  f(u0, P0)
  for (let i = 1; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n
    f(u, P1)
    const al = typeof a === 'number' ? a : a(u - (u1 - u0) / (2 * n))
    L.seg(P0.x, P0.y, P0.z, P1.x, P1.y, P1.z, c[0], c[1], c[2], al, w, dash)
    P0.copy(P1)
  }
}

/** Circle in the plane spanned by unit vectors e1, e2 (given as components). */
export function circle(
  L: HairLinesApi,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  e1x: number,
  e1y: number,
  e1z: number,
  e2x: number,
  e2y: number,
  e2z: number,
  n: number,
  c: RGB,
  a: number,
  w = 1,
  dash = 0,
  th0 = 0,
  th1 = Math.PI * 2,
) {
  let px = cx + r * (Math.cos(th0) * e1x + Math.sin(th0) * e2x)
  let py = cy + r * (Math.cos(th0) * e1y + Math.sin(th0) * e2y)
  let pz = cz + r * (Math.cos(th0) * e1z + Math.sin(th0) * e2z)
  for (let i = 1; i <= n; i++) {
    const th = th0 + ((th1 - th0) * i) / n
    const co = Math.cos(th)
    const si = Math.sin(th)
    const qx = cx + r * (co * e1x + si * e2x)
    const qy = cy + r * (co * e1y + si * e2y)
    const qz = cz + r * (co * e1z + si * e2z)
    L.seg(px, py, pz, qx, qy, qz, c[0], c[1], c[2], a, w, dash)
    px = qx
    py = qy
    pz = qz
  }
}
