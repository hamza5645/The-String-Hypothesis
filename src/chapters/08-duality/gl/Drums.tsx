import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS } from '@/gl'
import { DRUM_A, DRUM_A_CUTS, DRUM_B, DRUM_B_CUTS, polygonCentroid } from '../model'
import { Ribbons, rgb, type RibbonsApi } from './Ribbons'

/*
 * Beat 1 — the Gordon–Webb–Wolpert isospectral drums. Drumheads are Field fills at ~8% whose
 * breathing (a cartoon: displacement 0.06·d/d_max, d = distance to the rim) is baked per vertex.
 * The drum outlines themselves are the two loops of the opening, morphed onto the polygons
 * (Scene.tsx), so the drums are visibly "the two worlds" unfolded.
 */

export const DRUM_SCALE = 0.6

export function centeredPolygon(v: [number, number][]) {
  const c = polygonCentroid(v)
  return v.map(([x, y]) => [(x - c.x) * DRUM_SCALE, (y - c.y) * DRUM_SCALE] as [number, number])
}

/** N points around the polygon, equally spaced by arc length, counter-clockwise, starting where
 *  the ray from the centroid along +x leaves the drum (so a circle morphs without twisting). */
export function samplePerimeter(v: [number, number][], N: number): Float32Array {
  let p = v.slice()
  let area = 0
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i]
    const [x1, y1] = p[(i + 1) % p.length]
    area += x0 * y1 - x1 * y0
  }
  if (area < 0) p = p.reverse()
  const M = 4000
  const dense: [number, number][] = []
  let per = 0
  const seg: number[] = []
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i]
    const [x1, y1] = p[(i + 1) % p.length]
    const l = Math.hypot(x1 - x0, y1 - y0)
    seg.push(l)
    per += l
  }
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i]
    const [x1, y1] = p[(i + 1) % p.length]
    const k = Math.max(1, Math.round((seg[i] / per) * M))
    for (let j = 0; j < k; j++) dense.push([x0 + ((x1 - x0) * j) / k, y0 + ((y1 - y0) * j) / k])
  }
  // start index: rightmost crossing of the +x axis (angle closest to 0 on the right)
  let best = 0
  let bestScore = Infinity
  dense.forEach(([x, y], i) => {
    if (x <= 0) return
    const s = Math.abs(Math.atan2(y, x))
    if (s < bestScore) {
      bestScore = s
      best = i
    }
  })
  const out = new Float32Array(N * 2)
  const D = dense.length
  for (let i = 0; i < N; i++) {
    const q = dense[(best + Math.round((i / N) * D)) % D]
    out[i * 2] = q[0]
    out[i * 2 + 1] = q[1]
  }
  return out
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

function drumhead(poly: [number, number][]) {
  const contour = poly.map(([x, y]) => new THREE.Vector2(x, y))
  const tris = THREE.ShapeUtils.triangulateShape(contour, [])
  const n = 8
  const pos: number[] = []
  const dd: number[] = []
  for (const [ia, ib, ic] of tris) {
    const A = contour[ia]
    const B = contour[ib]
    const C = contour[ic]
    const P = (i: number, j: number) => [A.x + ((B.x - A.x) * i) / n + ((C.x - A.x) * j) / n, A.y + ((B.y - A.y) * i) / n + ((C.y - A.y) * j) / n]
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n - i; j++) {
        const q = [P(i, j), P(i + 1, j), P(i, j + 1)]
        for (const [x, y] of q) pos.push(x, y, 0)
        if (i + j < n - 1) for (const [x, y] of [P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]) pos.push(x, y, 0)
      }
  }
  let dmax = 0
  for (let k = 0; k < pos.length; k += 3) {
    let d = Infinity
    for (let e = 0; e < poly.length; e++) {
      const [ax, ay] = poly[e]
      const [bx, by] = poly[(e + 1) % poly.length]
      d = Math.min(d, segDist(pos[k], pos[k + 1], ax, ay, bx, by))
    }
    dd.push(d)
    dmax = Math.max(dmax, d)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(dd.map((d) => d / dmax)), 1))
  return g
}

const vert = /* glsl */ `
  attribute float aD;
  uniform float uBreath;
  varying float vD;
  void main() {
    vD = aD;
    vec3 p = position;
    p.z += 0.06 * aD * uBreath;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOp;
  uniform float uBreath;
  varying float vD;
  void main() {
    float b = 0.085 + 0.05 * vD + 0.16 * vD * max(uBreath, 0.0);
    gl_FragColor = vec4(uColor * b * uOp, 1.0);
  }
`

export interface DrumsApi {
  a: THREE.Group
  b: THREE.Group
  fill: THREE.ShaderMaterial
  cuts: RibbonsApi | null
  cutsB: RibbonsApi | null
}

export const Drums = forwardRef<DrumsApi>(function Drums(_, ref) {
  const ga = useRef<THREE.Group>(null!)
  const gb = useRef<THREE.Group>(null!)
  const ca = useRef<RibbonsApi>(null)
  const cb = useRef<RibbonsApi>(null)
  const { geoA, geoB, cutsA, cutsB } = useMemo(() => {
    const pa = centeredPolygon(DRUM_A)
    const pb = centeredPolygon(DRUM_B)
    const ctrA = polygonCentroid(DRUM_A)
    const ctrB = polygonCentroid(DRUM_B)
    const white = rgb(COLORS.ink)
    const mk = (cuts: [number, number, number, number][], c: { x: number; y: number }) =>
      cuts.map(([x0, y0, x1, y1]) => ({
        pts: [(x0 - c.x) * DRUM_SCALE, (y0 - c.y) * DRUM_SCALE, 0, (x1 - c.x) * DRUM_SCALE, (y1 - c.y) * DRUM_SCALE, 0],
        color: white,
      }))
    return { geoA: drumhead(pa), geoB: drumhead(pb), cutsA: mk(DRUM_A_CUTS, ctrA), cutsB: mk(DRUM_B_CUTS, ctrB) }
  }, [])
  const fill = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uColor: { value: new THREE.Color(COLORS.field) }, uOp: { value: 0 }, uBreath: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useLayoutEffect(
    () => () => {
      geoA.dispose()
      geoB.dispose()
      fill.dispose()
    },
    [geoA, geoB, fill],
  )
  useImperativeHandle(
    ref,
    () => ({
      get a() {
        return ga.current
      },
      get b() {
        return gb.current
      },
      fill,
      get cuts() {
        return ca.current
      },
      get cutsB() {
        return cb.current
      },
    }),
    [fill],
  )
  return (
    <>
      <group ref={ga} visible={false}>
        <mesh geometry={geoA} material={fill} renderOrder={0} />
        <Ribbons ref={ca} lines={cutsA} width={0.5} renderOrder={2} />
      </group>
      <group ref={gb} visible={false}>
        <mesh geometry={geoB} material={fill} renderOrder={0} />
        <Ribbons ref={cb} lines={cutsB} width={0.5} renderOrder={2} />
      </group>
    </>
  )
})
