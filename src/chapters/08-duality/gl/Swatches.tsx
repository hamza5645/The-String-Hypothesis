import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'

/*
 * Flat, unlit swatches: axis-aligned rectangles in their group's xy-plane, one draw call per batch.
 * Used for rungs, bars, hairlines and needles. Normal (not additive) blending — the chapter's
 * amber winding rungs are diagram keys that match the Thread, not light sources.
 */

export interface SwatchesApi {
  /** Set rectangle i (lower-left x, y, width, height) with colour (0..1 rgb) and alpha. */
  set(i: number, x: number, y: number, w: number, h: number, r: number, g: number, b: number, a: number): void
  /** Draw the first n rectangles. */
  commit(n: number): void
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
}

const vert = /* glsl */ `
  attribute vec4 aRect;
  attribute vec4 aCol;
  varying vec4 vCol;
  varying vec2 vUv;
  void main() {
    vec3 p = vec3(aRect.xy + position.xy * aRect.zw, 0.0);
    vCol = aCol;
    vUv = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const frag = /* glsl */ `
  uniform float uOpacity;
  varying vec4 vCol;
  varying vec2 vUv;
  void main() {
    vec2 fw = max(fwidth(vUv), vec2(1e-5));
    vec2 e = min(vUv, 1.0 - vUv) / fw;
    float cover = clamp(min(e.x, e.y) + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(vCol.rgb, vCol.a * uOpacity * cover);
  }
`

export const Swatches = forwardRef<SwatchesApi, { capacity: number; renderOrder?: number }>(function Swatches({ capacity, renderOrder = 0 }, ref) {
  const { geometry, rect, col } = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    const rect = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage)
    const col = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('aRect', rect)
    g.setAttribute('aCol', col)
    g.instanceCount = 0
    return { geometry: g, rect, col }
  }, [capacity])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    return m
  }, [geometry, material])
  useLayoutEffect(() => {
    mesh.renderOrder = renderOrder
  }, [mesh, renderOrder])
  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useImperativeHandle(
    ref,
    () => ({
      mesh,
      material,
      set(i, x, y, w, h, r, g, b, a) {
        if (i >= capacity) return
        const R = rect.array as Float32Array
        const C = col.array as Float32Array
        R[i * 4] = x
        R[i * 4 + 1] = y
        R[i * 4 + 2] = w
        R[i * 4 + 3] = h
        C[i * 4] = r
        C[i * 4 + 1] = g
        C[i * 4 + 2] = b
        C[i * 4 + 3] = a
      },
      commit(n) {
        geometry.instanceCount = Math.min(n, capacity)
        rect.needsUpdate = true
        col.needsUpdate = true
        mesh.visible = n > 0
      },
    }),
    [mesh, material, geometry, rect, col, capacity],
  )
  return <primitive object={mesh} />
})

/*
 * Flat hairline segments at any angle (leaders from a label to a rung), one draw call per batch.
 * Width is in world units per segment (callers pass pixels × world-units-per-pixel).
 */
export interface SegsApi {
  set(i: number, x0: number, y0: number, x1: number, y1: number, width: number, r: number, g: number, b: number, a: number): void
  commit(n: number): void
}

const segVert = /* glsl */ `
  attribute vec4 aSeg;
  attribute vec4 aCol;
  attribute float aWid;
  varying vec4 vCol;
  varying float vV;
  void main() {
    vec2 a = aSeg.xy;
    vec2 b = aSeg.zw;
    vec2 d = b - a;
    float l = max(length(d), 1e-6);
    vec2 n = vec2(-d.y, d.x) / l;
    // widen by one pixel's worth so the fragment can antialias across the width
    vec2 p = mix(a, b, position.x) + n * (position.y - 0.5) * (aWid * 2.0);
    vCol = aCol;
    vV = (position.y - 0.5) * 2.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  }
`
const segFrag = /* glsl */ `
  varying vec4 vCol;
  varying float vV;
  void main() {
    float fw = max(fwidth(vV), 1e-5);
    float cover = clamp((0.5 - abs(vV)) / fw + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(vCol.rgb, vCol.a * cover);
  }
`

export const Segs = forwardRef<SegsApi, { capacity: number; renderOrder?: number }>(function Segs({ capacity, renderOrder = 0 }, ref) {
  const { geometry, seg, col, wid } = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    const seg = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage)
    const col = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage)
    const wid = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('aSeg', seg)
    g.setAttribute('aCol', col)
    g.setAttribute('aWid', wid)
    g.instanceCount = 0
    return { geometry: g, seg, col, wid }
  }, [capacity])
  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: segVert, fragmentShader: segFrag, transparent: true, depthWrite: false, depthTest: false }),
    [],
  )
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geometry, material)
    m.frustumCulled = false
    m.visible = false
    return m
  }, [geometry, material])
  useLayoutEffect(() => {
    mesh.renderOrder = renderOrder
  }, [mesh, renderOrder])
  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useImperativeHandle(
    ref,
    () => ({
      set(i, x0, y0, x1, y1, width, r, g, b, a) {
        if (i >= capacity) return
        const S4 = seg.array as Float32Array
        const C4 = col.array as Float32Array
        S4[i * 4] = x0
        S4[i * 4 + 1] = y0
        S4[i * 4 + 2] = x1
        S4[i * 4 + 3] = y1
        C4[i * 4] = r
        C4[i * 4 + 1] = g
        C4[i * 4 + 2] = b
        C4[i * 4 + 3] = a
        ;(wid.array as Float32Array)[i] = width
      },
      commit(n) {
        geometry.instanceCount = Math.min(n, capacity)
        seg.needsUpdate = true
        col.needsUpdate = true
        wid.needsUpdate = true
        mesh.visible = n > 0
      },
    }),
    [mesh, geometry, seg, col, wid, capacity],
  )
  return <primitive object={mesh} />
})
