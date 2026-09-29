/*
 * Where the Ruler's landmark labels go (pure: a layout in, placements out, no DOM).
 * Every label gets a tier (height) and an alignment (centred, or hanging right/left of its tick) so
 * that no label overlaps another and no leader line (tick → label) crosses a label; the cheapest
 * arrangement found wins. The answer depends only on the viewport, so it is solved once per size and remembered.
 */
import { hitsRail, type Layout } from '../layout'
import type { RulerLandmark } from '../landmarks'
import { S_MAX, S_MIN } from '../model'

// label metrics (CSS: .sp-lm names 11px / values 10.5px desktop, 10px / 10px phones)
const FONT_A = 11
const FONT_B = 10.5
/** the Ruler's midpoint: √(8.8 × 10²⁶ × 1.616 × 10⁻³⁵) m */
export const MID_S = Math.log10(1.19e-4)
export const midY = (L: Layout) => L.ry - (L.mobile ? 150 : 172)
export const rulerXFull = (L: Layout, s: number) => L.rx0 + ((S_MAX - s) / (S_MAX - S_MIN)) * (L.rx1 - L.rx0)

export interface Placement {
  tier: number
  align: number
  cx: number
  yb: number
  h: number
}

type R = [number, number, number, number]
interface Cand {
  p: Placement
  r: R
  lead: R
  cost: number
}

/** dropping a label is allowed, at a steep price */
const DROP = 1000
/**
 * Search budget. Deterministic (every device lands the labels in the same place) and ~1 ms; the greedy
 * start plus the bound find the answer the old 60,000-step search did, or a cheaper one, at every
 * viewport checked (phones to 2560 × 1440).
 */
const MAX_ITERS = 6000

const memo = new Map<string, Map<string, Placement>>()

export function placeLabels(L: Layout, list: RulerLandmark[], small: boolean, tierStep: number): Map<string, Placement> {
  const key = `${L.W}|${L.H}|${small ? 1 : 0}|${tierStep}|${list.map((d) => d.id).join(',')}`
  let m = memo.get(key)
  if (!m) {
    m = solve(L, list, small, tierStep)
    if (memo.size > 12) memo.clear()
    memo.set(key, m)
  }
  return m
}

const hit = (a: R, b: R) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
/** index of the lowest set bit (mask ≠ 0) */
const low = (m: number) => 31 - Math.clz32(m & -m)

function solve(L: Layout, list: RulerLandmark[], small: boolean, tierStep: number) {
  const fa = small ? 10 : FONT_A
  const fb = small ? 10 : FONT_B
  const gTop = L.ry - (small ? 18 : 21)
  const items = list
    .map((d) => {
      const names = d.name.split('\n')
      const w = Math.max(...names.map((n) => n.length * fa * 0.69), d.value.length * fb * 0.64) + 6
      const h = (names.length + 1) * (small ? 13.6 : 15) + 2
      return { d, x: rulerXFull(L, d.s), w, h }
    })
    .sort((a, b) => a.x - b.x)
  // Beat 1's midpoint callout: its dotted line (above PAPER's label) and its label box stay clear
  const xm = rulerXFull(L, MID_S)
  const ym = midY(L)
  const midLine: R = [xm - 2, ym, xm + 2, gTop]
  const midBox: R = [xm - 4, ym - 36, xm + (small ? 170 : 210), ym + 4]
  const opts = (it: (typeof items)[number]) => {
    const out: Cand[] = []
    for (let t = 0; t < 7; t++)
      for (const al of [0, -1, 1]) {
        const cx = al === 0 ? Math.min(Math.max(it.x, 8 + it.w / 2), L.W - 8 - it.w / 2) : it.x
        const x0 = al === 0 ? cx - it.w / 2 : al === 1 ? it.x - 5 : it.x - it.w + 5
        // keep clear of the left scale gauge (desktop) and the screen edges
        if (x0 < (L.W >= 1100 ? 80 : 6) || x0 + it.w > L.W - 6) continue
        const yb = L.ry - (small ? 20 : 26) - t * tierStep
        if (yb - it.h < (small ? 58 : 70)) continue // below the top chrome
        // 8 px of air either side, so two neighbours never read as one label
        const r: R = [x0 - 8, yb - it.h, x0 + it.w + 8, yb]
        const lead: R = [it.x - 1.5, yb, it.x + 1.5, gTop]
        if (hitsRail(L, r[0], r[1], r[2], r[3]) || hitsRail(L, it.x - 1, yb, it.x + 1, L.ry)) continue
        if (hit(r, midBox) || (it.d.id !== 'paper' && hit(r, midLine))) continue
        // labels that straddle a neighbour's tick would block that neighbour's leader
        let straddle = 0
        for (const o of items) if (o !== it && o.x > r[0] && o.x < r[2]) straddle++
        out.push({ p: { tier: t, align: al, cx, yb, h: it.h }, r, lead, cost: t * 10 + (al ? 1 : 0) + straddle * 25 })
      }
    return out.sort((a, b) => a.cost - b.cost) // ≤ 21 options: one bit each
  }
  const n = items.length
  const cands = items.map(opts)
  const full = cands.map((c) => (c.length >= 32 ? -1 : (1 << c.length) - 1))

  // conflicts, once: conf[i][k][j] = the options of label j (j > i) that label i's option k rules out
  // (overlapping labels, or a leader line through a label)
  const conf = cands.map((ci, i) =>
    ci.map((c) => {
      const m = new Int32Array(n)
      for (let j = i + 1; j < n; j++) {
        let bits = 0
        cands[j].forEach((o, b) => {
          if (hit(c.r, o.r) || hit(c.lead, o.r) || hit(c.r, o.lead)) bits |= 1 << b
        })
        m[j] = bits
      }
      return m
    }),
  )
  // blocked[i][j]: options of label j ruled out by the labels placed before label i
  const blocked = Array.from({ length: n + 1 }, () => new Int32Array(n))
  /** the cheapest option label j still has (or the price of dropping it) */
  const cheapest = (j: number, mask: number) => {
    const free = ~mask & full[j]
    return free === 0 ? DROP : Math.min(cands[j][low(free)].cost, DROP)
  }
  const bound = (from: number, b: Int32Array) => {
    let s = 0
    for (let j = from; j < n; j++) s += cheapest(j, b[j])
    return s
  }

  // 1. greedy, in x order: each label takes its cheapest free option. A valid answer, and an upper bound.
  const chosen: (Cand | null)[] = new Array(n).fill(null)
  let bestCost = 0
  const g = new Int32Array(n)
  for (let i = 0; i < n; i++) {
    const free = ~g[i] & full[i]
    if (free === 0) {
      bestCost += DROP
      continue
    }
    const k = low(free)
    chosen[i] = cands[i][k]
    bestCost += cands[i][k].cost
    for (let j = i + 1; j < n; j++) g[j] |= conf[i][k][j]
  }
  let best = chosen.slice()
  bestCost += 0.5 // costs are integers: the search below may re-find the greedy answer itself

  // 2. depth-first search in the same order (options by cost, dropping last), pruned by an admissible
  // bound: the cost so far plus each remaining label's cheapest free option. Among equally cheap answers
  // the first in this order wins.
  let iters = 0
  const dfs = (i: number, cost: number) => {
    if (++iters > MAX_ITERS) return
    if (i === n) {
      if (cost < bestCost) {
        best = chosen.slice()
        bestCost = cost
      }
      return
    }
    const b = blocked[i]
    const nb = blocked[i + 1]
    const free = ~b[i] & full[i]
    const tail = bound(i + 1, b)
    for (let k = 0; k < cands[i].length; k++) {
      if (!(free & (1 << k))) continue
      const c = cands[i][k]
      if (cost + c.cost + tail >= bestCost) break // options are sorted by cost: nothing cheaper follows
      const cf = conf[i][k]
      for (let j = i + 1; j < n; j++) nb[j] = b[j] | cf[j]
      if (cost + c.cost + bound(i + 1, nb) >= bestCost) continue
      chosen[i] = c
      dfs(i + 1, cost + c.cost)
      if (iters > MAX_ITERS) break
    }
    chosen[i] = null
    if (cost + DROP + tail < bestCost) {
      for (let j = i + 1; j < n; j++) nb[j] = b[j]
      dfs(i + 1, cost + DROP)
    }
  }
  chosen.fill(null)
  dfs(0, 0)

  const map = new Map<string, Placement>()
  items.forEach((it, i) => {
    const c = best[i]
    if (c) map.set(it.d.id, c.p)
  })
  return map
}
