import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useChapterFrame } from '@/gl'
import { rng, smoothstep } from '@/core/math'
import { claimById } from '../data'
import { createLineMaterial, LineBuilder } from '../gl/lines'
import { el, type LabelLayer, type Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * Beat 5 · the fog's furniture (cartoons, ANALOGY):
 *  • the landscape terrain (Model §9): a 96 × 96 height-field over [−2.5, 2.5]²,
 *      z(u, v) = −Σₖ aₖ·exp(−|x − cₖ|² / 2σₖ²) + 0.12·fbm(x), 160 seeded dips, hairlines every 4 cells,
 *    tilted 15° toward the camera and centred on LANDSCAPE. The quoted ~10⁵⁰⁰ is NOT the dips drawn.
 *  • rival routes to quantum gravity near OTHER ROUTES: four Field sketches (never warm), each UNTESTED.
 */

const GRID = 96
const SPAN = 2.5
const DIPS = 160
const ZSCALE = 1.8 // cartoon exaggeration so the dips read at map scale
/** The terrain's function lives on [−2.5, 2.5]² (Model §9); it is drawn at 0.75× beside S4, clear of the ruler. */
const T_SCALE = 0.75
const T_OFFSET: [number, number, number] = [-0.45, 0.3, -0.35]

function vnoise(x: number, y: number, seed: number) {
  const h = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453
    return s - Math.floor(s)
  }
  const i = Math.floor(x)
  const j = Math.floor(y)
  const fx = x - i
  const fy = y - j
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = h(i, j)
  const b = h(i + 1, j)
  const c = h(i, j + 1)
  const d = h(i + 1, j + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}
const fbm = (x: number, y: number) => {
  let s = 0
  let a = 0.5
  let f = 1.3
  for (let o = 0; o < 4; o++) {
    s += a * (vnoise(x * f, y * f, o) - 0.5)
    f *= 2.07
    a *= 0.5
  }
  return s
}

function buildTerrain(L: LineBuilder, group: number) {
  const r = rng(500)
  const cs: number[][] = []
  for (let k = 0; k < DIPS; k++) cs.push([(r() * 2 - 1) * SPAN, (r() * 2 - 1) * SPAN, 0.05 + r() * 0.13, 0.08 + r() * 0.14])
  const n = GRID + 1
  const Z = new Float32Array(n * n)
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const u = -SPAN + (2 * SPAN * i) / GRID
      const v = -SPAN + (2 * SPAN * j) / GRID
      let z = 0.12 * fbm(u, v)
      for (const [cu, cv, a, s] of cs) {
        const d2 = (u - cu) ** 2 + (v - cv) ** 2
        if (d2 < 9 * s * s) z -= a * Math.exp(-d2 / (2 * s * s))
      }
      Z[j * n + i] = z * ZSCALE
    }
  const P = (i: number, j: number) => [-SPAN + (2 * SPAN * i) / GRID, Z[j * n + i], -SPAN + (2 * SPAN * j) / GRID]
  const edge = (i: number) => {
    const e = Math.min(i, GRID - i) / 10
    return Math.min(1, e)
  }
  for (let j = 0; j <= GRID; j += 4) {
    const pts: number[][] = []
    for (let i = 0; i <= GRID; i++) pts.push(P(i, j))
    L.add(pts, { color: '#86A8D8', alpha: 0.13 * (0.3 + 0.7 * edge(j)), width: 1, group, yref: 5.2 })
  }
  for (let i = 0; i <= GRID; i += 4) {
    const pts: number[][] = []
    for (let j = 0; j <= GRID; j++) pts.push(P(i, j))
    L.add(pts, { color: '#86A8D8', alpha: 0.13 * (0.3 + 0.7 * edge(i)), width: 1, group, yref: 5.2 })
  }
}

// ── rival sketches (local 2D, ~0.8 units) ──
function dot(L: LineBuilder, x: number, y: number, r: number, o: Parameters<LineBuilder['add']>[1]) {
  const pts: number[][] = []
  for (let k = 0; k <= 8; k++) pts.push([x + Math.cos((k / 8) * Math.PI * 2) * r, y + Math.sin((k / 8) * Math.PI * 2) * r, 0])
  L.add(pts, o)
}
function spinNetwork(L: LineBuilder, o: Parameters<LineBuilder['add']>[1]) {
  const N: [number, number][] = [
    [-0.34, -0.22],
    [-0.05, -0.33],
    [0.3, -0.18],
    [0.36, 0.2],
    [0.02, 0.33],
    [-0.3, 0.16],
    [0.02, 0.0],
  ]
  const E = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [6, 0],
    [6, 2],
    [6, 4],
    [1, 6],
  ]
  for (const [a, b] of E) L.add([[...N[a], 0], [...N[b], 0]], o)
  for (const [x, y] of N) dot(L, x, y, 0.028, o)
}
function flowToFixedPoint(L: LineBuilder, o: Parameters<LineBuilder['add']>[1]) {
  const fx = 0.05
  const fy = 0.12
  for (let k = 0; k < 7; k++) {
    const a0 = (k / 7) * Math.PI * 2 + 0.3
    const pts: number[][] = []
    for (let s = 0; s <= 24; s++) {
      const t = s / 24
      const r = 0.42 * (1 - t) + 0.02
      const a = a0 + t * 1.6
      pts.push([fx + Math.cos(a) * r, fy + Math.sin(a) * r * 0.8 - (1 - t) * 0.12, 0])
    }
    L.add(pts, o)
    // arrowhead near the fixed point (flow toward high energy)
    const p = pts[18]
    const q = pts[21]
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const l = Math.hypot(dx, dy) || 1
    const ux = dx / l
    const uy = dy / l
    L.add(
      [
        [q[0] - ux * 0.05 - uy * 0.03, q[1] - uy * 0.05 + ux * 0.03, 0],
        [q[0], q[1], 0],
        [q[0] - ux * 0.05 + uy * 0.03, q[1] - uy * 0.05 - ux * 0.03, 0],
      ],
      o,
    )
  }
  dot(L, fx, fy, 0.03, o)
}
function causalSet(L: LineBuilder, o: Parameters<LineBuilder['add']>[1]) {
  const r = rng(1987)
  const P: [number, number][] = []
  while (P.length < 16) {
    const x = (r() * 2 - 1) * 0.4
    const y = (r() * 2 - 1) * 0.4
    if (Math.abs(x) + Math.abs(y) < 0.42) P.push([x, y])
  }
  P.sort((a, b) => a[1] - b[1])
  // link each element to a few causally-later neighbours (inside its forward light cone)
  for (let i = 0; i < P.length; i++) {
    let links = 0
    for (let j = i + 1; j < P.length && links < 2; j++) {
      const dy = P[j][1] - P[i][1]
      const dx = Math.abs(P[j][0] - P[i][0])
      if (dy > dx && dy < 0.35) {
        L.add([[...P[i], 0], [...P[j], 0]], o)
        links++
      }
    }
  }
  for (const [x, y] of P) dot(L, x, y, 0.018, o)
}
function triangulation(L: LineBuilder, o: Parameters<LineBuilder['add']>[1]) {
  const cols = 5
  const w = 0.2
  for (let row = 0; row < 3; row++) {
    const y0 = -0.3 + row * 0.2
    const y1 = y0 + 0.2
    const off = row % 2 ? w / 2 : 0
    for (let c = 0; c < cols; c++) {
      const x0 = -0.45 + c * w + off
      L.add(
        [
          [x0, y0, 0],
          [x0 + w, y0, 0],
          [x0 + w / 2, y1, 0],
          [x0, y0, 0],
        ],
        o,
      )
    }
  }
}

// a compact 2 × 2 cluster (sketches ≈ 0.8 units drawn at 0.7×), each caption under its sketch
const RIVAL_SCALE = 0.7
const RIVALS = [
  { name: 'LOOP QUANTUM', name2: 'GRAVITY', draw: spinNetwork, at: [-0.82, 0.74] },
  { name: 'ASYMPTOTIC', name2: 'SAFETY', draw: flowToFixedPoint, at: [0.82, 0.74] },
  { name: 'CAUSAL', name2: 'SETS', draw: causalSet, at: [-0.82, -0.82] },
  { name: 'CAUSAL DYNAMICAL', name2: 'TRIANGULATIONS', draw: triangulation, at: [0.82, -0.82] },
] as const

export function Landscape({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const s4 = claimById('S4').pos
  const s8 = claimById('S8').pos
  // up and back from OTHER ROUTES (S8), inside the ○ band, in the open sky above the other ○ labels
  const RIVAL_AT = useMemo(() => new THREE.Vector3(s8[0] + 1.18, s8[1] + 1.15, s8[2] - 3.24), [s8])
  const terrain = useMemo(() => {
    const L = new LineBuilder()
    buildTerrain(L, 0)
    return { geometry: L.build(), material: createLineMaterial() }
  }, [])
  const rivals = useMemo(() => {
    const L = new LineBuilder()
    for (const rv of RIVALS) {
      const sub = new LineBuilder()
      rv.draw(sub, { color: '#86A8D8', alpha: 0.62, width: 1, yref: 5.0 })
      // scale and translate into the 2 × 2 cluster
      for (let i = 0; i < sub.count * 3; i++) {
        sub.a[i] *= RIVAL_SCALE
        sub.b[i] *= RIVAL_SCALE
      }
      for (let i = 0; i < sub.count; i++) {
        sub.a[i * 3] += rv.at[0]
        sub.a[i * 3 + 1] += rv.at[1]
        sub.b[i * 3] += rv.at[0]
        sub.b[i * 3 + 1] += rv.at[1]
      }
      L.a.push(...sub.a)
      L.b.push(...sub.b)
      L.color.push(...sub.color)
      L.style.push(...sub.style)
      L.extra.push(...sub.extra)
      L.ref.push(...sub.ref)
      L.count += sub.count
    }
    return { geometry: L.build(), material: createLineMaterial() }
  }, [])
  useLayoutEffect(
    () => () => {
      terrain.geometry.dispose()
      terrain.material.dispose()
      rivals.geometry.dispose()
      rivals.material.dispose()
    },
    [terrain, rivals],
  )
  const rivalGroup = useRef<THREE.Group>(null!)
  const terrainMesh = useRef<THREE.Mesh>(null!)

  const lbl = useMemo(() => {
    if (!layer) return null
    // one caption for the terrain, under its near edge: what it is, and what the famous number is not
    const cap = el('div', 'kn-terrain', [
      el('span', 'kn-terrain__row', [el('span', 'kn-tag__chip', '≈ ANALOGY'), el('span', '', 'EACH DIP ≈ ONE VACUUM')]),
      el('span', 'kn-terrain__long', 'A 2D STAND-IN FOR A SPACE OF HUNDREDS OF DIMENSIONS'),
      el('b', '', 'OFTEN QUOTED: ~10⁵⁰⁰ · A ROUGH ESTIMATE'),
      el('b', '', 'NOT THE NUMBER OF DIPS DRAWN'),
    ])
    // above the terrain's far edge (open sky); rotation-x 15° lifts the far edge by sin 15° · 2.5
    const t1 = layer.add(cap, [s4[0] + T_OFFSET[0], s4[1] + T_OFFSET[1] + 0.65 * T_SCALE + 0.15, s4[2] + T_OFFSET[2] - 2.4 * T_SCALE], {
      cls: 'kn-lbl--t3',
      align: 'above',
      dy: 12,
      prio: 700,
      must: true,
    })
    const names = RIVALS.map((rv) =>
      layer.add({ text: rv.name, sub: rv.name2, tag: 'UNTESTED' }, [0, 0, 0], { cls: 'kn-lbl--field kn-lbl--center kn-lbl--rival', align: 'below', dy: 3, prio: 70, solid: true }),
    )
    return { t1, names }
  }, [layer, s4])
  const v = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])

  useChapterFrame(
    (f) => {
      const ceil = S.ceilOn > 0.001
      // dense sketches turn into bright specks when the map shrinks (E1): let them go first
      const early = 1 - smoothstep(0.08, 0.35, S.mapK)
      const tOn = S.terrain * S.mapVis * S.atlasDim * early
      terrain.material.uniforms.uOpacity.value = tOn
      terrain.material.uniforms.uCeilY.value = ceil ? S.yc : 1e3
      terrainMesh.current.visible = tOn > 0.002
      // fog-beat furniture: gone before the evidence ceiling arrives
      // (phones: too small to read beside the ○ labels; the beat text names the rivals)
      const rOn = S.mobile ? 0 : S.rivals * S.mapVis * S.atlasDim * early * (1 - smoothstep(0, 0.07, S.sp.demand)) * (S.sp.lab > 0 ? 0 : 1)
      rivals.material.uniforms.uOpacity.value = rOn
      rivals.material.uniforms.uCeilY.value = ceil ? S.yc : 1e3
      const g = rivalGroup.current
      g.visible = rOn > 0.002
      // billboard toward the camera (the map group never rotates)
      q.copy(f.state.camera.quaternion)
      g.quaternion.copy(q)
      if (!lbl) return
      const foc = S.focus[3] * S.mapVis
      const vis = ceil ? (S.yc > 5.2 ? 1 : 0) : 1
      lbl.t1.target = S.terrain * foc * vis
      // phones: under the terrain (the top belongs to the map's tag)
      lbl.t1.align = S.mobile ? 'below' : 'above'
      lbl.t1.pos.set(s4[0] + T_OFFSET[0], s4[1] + T_OFFSET[1] + (S.mobile ? -0.65 * T_SCALE - 0.1 : 0.65 * T_SCALE + 0.15), s4[2] + T_OFFSET[2] + (S.mobile ? 2.4 : -2.4) * T_SCALE)
      for (let i = 0; i < RIVALS.length; i++) {
        const rv = RIVALS[i]
        // under the sketch (its half-size is 0.4 · RIVAL_SCALE)
        v.set(rv.at[0], rv.at[1] - 0.3, 0).applyQuaternion(q).add(RIVAL_AT)
        lbl.names[i].pos.copy(v)
        lbl.names[i].target = rOn > 0.002 ? S.rivals * foc * vis : 0
      }
    },
    { priority: -1.5 },
  )

  // the sketches are obstacles for labels (no ○ caption across a drawing)
  const ov = useMemo(() => new THREE.Vector3(), [])
  useChapterFrame(
    (f) => {
      if (!layer || S.mobile || S.rivals * S.mapVis * S.atlasDim < 0.3 || S.mapK > 0.05 || S.sp.demand > 0.05) return
      const g = rivalGroup.current
      const cam = f.state.camera
      for (const rv of RIVALS) {
        ov.set(rv.at[0], rv.at[1], 0).applyMatrix4(g.matrixWorld).project(cam)
        const x = (ov.x * 0.5 + 0.5) * S.W
        const y = (0.5 - ov.y * 0.5) * S.H
        ov.set(rv.at[0] + 0.3, rv.at[1], 0).applyMatrix4(g.matrixWorld).project(cam)
        const r = Math.abs((ov.x * 0.5 + 0.5) * S.W - x)
        layer.addObstacle(x, y, r)
      }
    },
    { priority: -0.9 },
  )

  return (
    <>
      <group position={[s4[0] + T_OFFSET[0], s4[1] + T_OFFSET[1], s4[2] + T_OFFSET[2]]} rotation-x={(15 * Math.PI) / 180} scale={T_SCALE}>
        <mesh ref={terrainMesh} geometry={terrain.geometry} material={terrain.material} frustumCulled={false} renderOrder={1} visible={false} />
      </group>
      <group ref={rivalGroup} position={RIVAL_AT} visible={false}>
        <mesh geometry={rivals.geometry} material={rivals.material} frustumCulled={false} renderOrder={2} />
      </group>
    </>
  )
}

export type { Lbl }
