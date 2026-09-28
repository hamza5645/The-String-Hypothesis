import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useChapterFrame } from '@/gl'
import { rng, smoothstep } from '@/core/math'
import { CLAIMS, claimById, TIER_LABEL } from '../data'
import { RING_R, RING_Y } from '../model'
import { circlePts, createLineMaterial, LineBuilder } from '../gl/lines'
import { T0 } from '../gl/thread'
import { el, type LabelLayer, type Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * The map's hairline diagram, one draw call: tier guide rings, the axis, anchors, struts,
 * meaningful links, the ≠ link, the ground's cracks and rim. Groups reveal / fade independently;
 * every line obeys the evidence ceiling through its y_ref (struts use their higher end).
 */

export const G = {
  ring1: 0,
  ring2: 1,
  ring3: 2,
  axis: 3,
  anchors: 4,
  struts: 5,
  links: 6,
  neq: 7,
  cracks: 8,
  d6: 9,
  rim: 10,
  leader: 11,
  holoLeader: 12,
  /** the axis mirrored to the map's right side (narrative beats; the left one serves the lab) */
  axisR: 13,
  /** struts / links that reach tier 2 or tier 3: drawn only once those nodes exist */
  struts2: 14,
  links2: 15,
  links3: 16,
} as const

/** The two axis positions (x, z): right while the text column is on screen, left in the lab. */
export const AXIS_R: [number, number] = [5.2, -1.2]
export const AXIS_L: [number, number] = [-5.2, 0]

const FIELD = '#86A8D8'
const INK2 = '#9AA0AE'
const pos = (id: string) => claimById(id).pos

/** Midpoint-displacement polyline from a to b (a jagged crack). */
function crack(a: [number, number], b: [number, number], seed: number, depth = 5, rough = 0.28) {
  const r = rng(seed)
  let pts: [number, number][] = [a, b]
  let amp = rough
  for (let d = 0; d < depth; d++) {
    const next: [number, number][] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i]
      const q = pts[i + 1]
      const mx = (p[0] + q[0]) / 2
      const mz = (p[1] + q[1]) / 2
      const dx = q[0] - p[0]
      const dz = q[1] - p[1]
      const len = Math.hypot(dx, dz)
      const off = (r() * 2 - 1) * amp * len
      next.push([mx - (dz / len) * off, mz + (dx / len) * off], q)
    }
    pts = next
    amp *= 0.62
  }
  return pts
}

export const CRACKS: Record<string, { len: number; seed: number; ang: number }> = {
  K1: { len: 1.8, seed: 11, ang: 0.08 },
  K2: { len: 1.5, seed: 23, ang: -0.1 },
  K3: { len: 1.6, seed: 37, ang: 0.12 },
  K4: { len: 1.25, seed: 41, ang: -0.06 },
}

export function MapLines({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const { geometry, material, crackPts } = useMemo(() => {
    const L = new LineBuilder()
    // tier guide rings (Ink-3 hairlines), drawn on from the (right) axis side
    ;[1, 2, 3].forEach((t, i) => L.add(circlePts(RING_R, RING_Y[t], 160, 0.15, 0.15 + Math.PI * 2), { color: INK2, alpha: 0.2, width: 1, group: i, yref: 'none' }))
    // the vertical axis with arrowhead and tier ticks — once on each side (ticks point into the map)
    for (const [[ax, az], grp, inward] of [
      [AXIS_L, G.axis, 1],
      [AXIS_R, G.axisR, -1],
    ] as const) {
      L.add(
        [
          [ax, 0, az],
          [ax, 6.4, az],
        ],
        { color: INK2, alpha: 0.5, width: 1, group: grp, yref: 'none' },
      )
      L.add(
        [
          [ax - 0.09, 6.22, az],
          [ax, 6.42, az],
          [ax + 0.09, 6.22, az],
        ],
        { color: INK2, alpha: 0.6, width: 1, group: grp, yref: 'none' },
        false,
        [0.97, 1, 0.97],
      )
      for (const y of [0, ...RING_Y.slice(1)])
        L.add(
          [
            [ax, y, az],
            [ax + inward * 0.22, y, az],
          ],
          { color: INK2, alpha: 0.7, width: 1, group: grp, yref: 'none' },
          false,
          [y / 6.4, y / 6.4],
        )
    }
    // anchors: string theory is built on tested principles (QM, SR) — but never stands on the ground
    for (const id of ['G1', 'G2']) L.add([pos(id), T0], { color: FIELD, alpha: 0.55, width: 1, group: G.anchors, yref: 'max' })
    // struts: a light lattice between neighbouring tier-1 and tier-2 nodes
    const upper = CLAIMS.filter((c) => c.tier === 1 || c.tier === 2)
    const seen = new Set<string>()
    const special = new Set(['D5|D7', 'D5|C1', 'D4|C2', 'C2|C3', 'D6|D7'])
    for (const a of upper) {
      const near = upper
        .filter((b) => b !== a)
        .map((b) => ({ b, d: Math.hypot(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
      for (const { b } of near) {
        const key = [a.id, b.id].sort().join('|')
        if (seen.has(key) || special.has(key) || special.has([b.id, a.id].join('|'))) continue
        seen.add(key)
        // a strut never points at a node that has not appeared yet
        const grp = a.tier === 2 || b.tier === 2 ? G.struts2 : G.struts
        L.add([a.pos, b.pos], { color: FIELD, alpha: 0.22, width: 1, group: grp, yref: 'max', ghost: true })
      }
    }
    // meaningful links
    for (const [a, b] of [
      ['D5', 'D7'],
      ['D5', 'C1'],
      ['D4', 'C2'],
      ['C2', 'C3'],
      ['D8', 'S2'],
    ]) {
      const top = Math.max(claimById(a).tier, claimById(b).tier)
      L.add([pos(a), pos(b)], { color: FIELD, alpha: 0.42, width: 1, group: top >= 3 ? G.links3 : top === 2 ? G.links2 : G.links, yref: 'max', ghost: true })
    }
    // D6 (GR + quantum fields) — dashed link to D7: MATCH
    L.add([pos('D6'), pos('D7')], { color: FIELD, alpha: 0.7, width: 1, dash: 7, group: G.d6, yref: 'max', ghost: true })
    // the one place where two things are NOT the same: real black holes ≠ idealized ones
    L.add([pos('G7'), pos('D7')], { color: FIELD, alpha: 0.75, width: 1, dash: 6, group: G.neq, yref: 'max', ghost: true })
    // cracks in the measured ground (always visible)
    const crackPts: number[] = []
    for (const [id, c] of Object.entries(CRACKS)) {
      const p = pos(id)
      const a = Math.atan2(p[2], p[0]) + c.ang
      const pts2 = crack([p[0], p[2]], [p[0] + Math.cos(a) * c.len, p[2] + Math.sin(a) * c.len], c.seed)
      // a few samples along the crack: labels keep off it
      for (let i = 4; i < pts2.length; i += 4) crackPts.push(pts2[i][0], 0.012, pts2[i][1])
      L.add(
        pts2.map(([x, z]) => [x, 0.012, z]),
        { color: FIELD, alpha: 0.95, width: 1.5, glow: 5, group: G.cracks, yref: 'none' },
      )
      // a short side branch
      const mid = pts2[Math.floor(pts2.length * 0.45)]
      const b2 = crack(mid, [mid[0] + Math.cos(a + 0.9) * c.len * 0.35, mid[1] + Math.sin(a + 0.9) * c.len * 0.35], c.seed + 5, 4)
      L.add(
        b2.map(([x, z]) => [x, 0.012, z]),
        { color: FIELD, alpha: 0.7, width: 1, glow: 3, group: G.cracks, yref: 'none' },
        false,
        b2.map((_, i) => 0.45 + (0.55 * i) / (b2.length - 1)),
      )
    }
    // ground rim with instrument ticks
    L.add(circlePts(7, 0, 180), { color: FIELD, alpha: 0.12, width: 1, group: G.rim, yref: 'none' })
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2
      const r1 = k % 6 === 0 ? 6.72 : 6.86
      L.add(
        [
          [Math.cos(a) * r1, 0, Math.sin(a) * r1],
          [Math.cos(a) * 7, 0, Math.sin(a) * 7],
        ],
        { color: FIELD, alpha: k % 6 === 0 ? 0.3 : 0.16, width: 1, group: G.rim, yref: 'none' },
      )
    }
    // leaders to the dioramas
    L.add([pos('D7'), [0, 2.0, 3.6]], { color: FIELD, alpha: 0.5, width: 1, group: G.leader, yref: 'none' })
    L.add([pos('C1'), [0, 3.3, 3.6]], { color: FIELD, alpha: 0.5, width: 1, group: G.holoLeader, yref: 'none' })
    const geometry = L.build()
    const material = createLineMaterial()
    return { geometry, material, crackPts: Float32Array.from(crackPts) }
  }, [])
  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  // labels owned by the diagram
  const lbl = useMemo(() => {
    if (!layer) return null
    // the legend is a ruler on the axis: each floor named at its tick, the rule at the arrowhead
    const legend = [0, 1, 2, 3].map((t) =>
      layer.add(legendEl(t), [0, 0, 0], { cls: 'kn-lbl--legend', align: 'right', dx: 10, dy: -9, prio: 800 - t, must: true }),
    )
    const axisHead = el('span', 'kn-axis', [el('span', 'kn-lbl__main', 'DISTANCE FROM EXPERIMENT ↑')])
    const axis = layer.add(axisHead, [0, 0, 0], { cls: 'kn-lbl--legend kn-lbl--axis', align: 'right', dx: 10, dy: -2, prio: 810, must: true })
    const t0 = layer.add({ text: 'BUILT ON TESTED PRINCIPLES', sub: 'QUANTUM MECHANICS + RELATIVITY' }, T0, { cls: 'kn-lbl--field', align: 'below', dy: 14, prio: 450, must: true })
    const match = layer.add({ text: 'MATCH' }, mid(pos('D6'), pos('D7')), { cls: 'kn-lbl--field', align: 'above', dy: 6, prio: 60, cull: true })
    const branes = layer.add({ text: 'D-BRANES MADE THESE POSSIBLE' }, mid(pos('D5'), pos('C1')), { cls: 'kn-lbl--field', align: 'left', dx: 10, prio: 60, cull: true })
    const neq = layer.add({ text: '≠  BLACK HOLES IN OUR SKY', sub: 'MICROSTATES NOT COUNTED' }, mid(pos('G7'), pos('D7')), { cls: 'kn-lbl--field kn-lbl--md', align: 'right', dx: 14 })
    return { legend, axis, t0, match, branes, neq } as Record<string, Lbl | Lbl[]>
  }, [layer])

  useChapterFrame(
    (f) => {
      const u = material.uniforms
      const dim = S.atlasDim
      u.uReveal.value[G.ring1] = S.rings[0]
      u.uReveal.value[G.ring2] = S.rings[1]
      u.uReveal.value[G.ring3] = S.rings[2]
      for (let i = 0; i < 3; i++) u.uAlpha.value[i] = dim
      const side = S.axisSide
      u.uReveal.value[G.axis] = S.axis
      u.uAlpha.value[G.axis] = dim * side
      u.uReveal.value[G.axisR] = S.axis
      u.uAlpha.value[G.axisR] = dim * (1 - side)
      u.uReveal.value[G.anchors] = S.anchors
      u.uAlpha.value[G.anchors] = dim
      u.uAlpha.value[G.struts] = S.struts * dim
      u.uAlpha.value[G.struts2] = S.struts * S.tier2In * dim
      u.uAlpha.value[G.links] = S.links * dim
      u.uAlpha.value[G.links2] = S.links * S.tier2In * dim
      u.uAlpha.value[G.links3] = S.links * S.tier3In * dim
      u.uAlpha.value[G.d6] = S.d6 * dim
      u.uAlpha.value[G.neq] = S.links * dim * 0.45 + S.neq
      u.uReveal.value[G.cracks] = S.cracks
      u.uAlpha.value[G.cracks] = (0.78 + 0.22 * Math.sin(f.t * Math.PI * 2 * 0.15)) * Math.max(dim, 0.4)
      u.uAlpha.value[G.rim] = S.groundReveal * dim
      u.uReveal.value[G.leader] = S.leader
      u.uAlpha.value[G.leader] = S.leader
      u.uReveal.value[G.holoLeader] = S.holo.grow
      u.uAlpha.value[G.holoLeader] = S.holo.grow * 0.8
      u.uCeilY.value = S.ceilOn > 0.001 ? S.yc : 1e3
      u.uOpacity.value = S.mapVis
      if (!lbl) return
      // the legend rides the axis on whichever side is in use (a quick fade across the switch)
      const legend = lbl.legend as Lbl[]
      const axisL = lbl.axis as Lbl
      const left = side > 0.5
      const ax = left ? AXIS_L[0] : AXIS_R[0]
      const az = left ? AXIS_L[1] : AXIS_R[1]
      const swap = Math.abs(side - 0.5) * 2
      const gone = (1 - smoothstep(0, 0.15, S.mapK)) * S.mapVis
      const guideOn = S.sp.demand > 0.05 && S.sp.demand < 0.97 ? 0.8 : 1
      // each floor's meaning is spelled out while its tier is the subject (all of them in the opening,
      // the aha and the lab); otherwise the ruler shows just the mark and the name
      let ft = -1
      for (let k = 0, fw = 0.3; k < 4; k++)
        if (S.focus[k] > fw) {
          fw = S.focus[k]
          ft = k
        }
      const allLong = ft < 0 || S.sp.demand > 0 || S.sp.lab > 0
      // phones: names only, and under the evidence ceiling only the floors it admits
      const mob = S.mobile
      const ceilCut = mob && S.ceilOn > 0.5
      for (let t = 0; t < 4; t++) {
        const l = legend[t]
        const long = !mob && (allLong || t === ft)
        if (l.el.dataset.long !== (long ? '1' : '0')) {
          l.el.dataset.long = long ? '1' : '0'
          l.w = 0
        }
        l.pos.set(ax, RING_Y[t], az)
        l.align = left ? 'left' : 'right'
        l.dx = left ? 14 : 10
        const draw = t === 0 ? smoothstep01(clamp01((S.axis - 0.05) / 0.3)) : smoothstep01(S.rings[t - 1])
        l.target = draw * dim * guideOn * swap * gone * (ceilCut && t > Math.round(S.L) ? 0 : 1)
      }
      axisL.pos.set(ax, 6.45, az)
      axisL.align = left ? 'above' : 'right'
      axisL.dx = left ? 0 : 10
      axisL.dy = left ? 8 : -2
      // (phones: the top tag already states the rule)
      axisL.target = mob ? 0 : smoothstep01(clamp01((S.axis - 0.7) / 0.3)) * dim * swap * gone
      ;(lbl.t0 as Lbl).target = S.t0Label
      ;(lbl.t0 as Lbl).must = !S.mobile
      ;(lbl.match as Lbl).target = S.d6 * S.focus[1]
      ;(lbl.branes as Lbl).target = S.links * S.focus[2] * 0.9
      ;(lbl.neq as Lbl).target = 0 // shown in screen space by the diorama (clearer than at the link's midpoint)
    },
    { priority: -1.5 },
  )

  // after the camera has settled: the drawn cracks are obstacles for labels
  const cv = useMemo(() => new THREE.Vector3(), [])
  const meshRef = useRef<THREE.Mesh>(null)
  useChapterFrame(
    (f) => {
      if (!layer || S.cracks < 0.5 || S.mapK > 0.05 || S.atlasDim < 0.3) return
      const M = meshRef.current?.parent?.matrixWorld
      if (!M) return
      for (let i = 0; i < crackPts.length; i += 3) {
        cv.set(crackPts[i], crackPts[i + 1], crackPts[i + 2]).applyMatrix4(M).project(f.state.camera)
        if (cv.z > 1) continue
        layer.addObstacle((cv.x * 0.5 + 0.5) * S.W, (0.5 - cv.y * 0.5) * S.H, 4)
      }
    },
    { priority: -0.9 },
  )

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
}

const smoothstep01 = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const CHIP_CLS = ['observed', 'derived', 'conjectured', 'speculative']
const TIER_NAME = ['MEASURED', 'DERIVED', 'CONJECTURED', 'SPECULATIVE']
/** One legend entry: the chip's own mark (shape = status), its name, and what it means. */
function legendEl(t: number) {
  const rest = TIER_LABEL[t].split(' · ').slice(1).join(' · ')
  return el('span', 'kn-legend', [
    el('i', `kn-glyph kn-glyph--${CHIP_CLS[t]}`),
    el('b', `kn-legend__name kn-legend__name--${CHIP_CLS[t]}`, TIER_NAME[t]),
    rest ? el('span', 'kn-legend__rest', `· ${rest}`) : null,
  ])
}
const mid = (a: readonly number[], b: readonly number[]): [number, number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
