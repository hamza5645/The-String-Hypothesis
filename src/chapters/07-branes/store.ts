import { create } from 'zustand'
import { DEFAULT_Y, snapY, stacksOf, type EnergyScale } from './model'

/** Which part of the Go-deeper equations the visitor last touched (drives \htmlClass highlighting). */
export type Focus = 'brane' | 'rung' | 'view' | 'draw' | null

/** Brane Bench lab state, shared by the Overlay (panel) and the Scene (stage). */
interface BraneLab {
  viewpoint: number
  ref: number
  n: number
  ys: number[]
  /** selected stretched pair for the ladder (brane indices) or null → auto */
  pair: [number, number] | null
  rung: number
  scale: EnergyScale
  braneworld: boolean
  focus: Focus
  /** bumped to ask the stage for an action (closed string / collide / clear) */
  releaseReq: number
  collideReq: number
  clearReq: number
  /** a short caption the stage raises (e.g. snap-back) — text + stamp */
  note: { text: string; at: number } | null
  setViewpoint: (v: number) => void
  setRef: (i: number) => void
  setN: (n: number) => void
  setY: (i: number, y: number) => void
  setSeparation: (d: number) => void
  setPair: (p: [number, number] | null) => void
  setRung: (n: number) => void
  setScale: (s: EnergyScale) => void
  setBraneworld: (v: boolean) => void
  release: () => void
  collide: () => void
  clear: () => void
  say: (text: string) => void
}

// dev-only deep links for screenshots of lab states (?brnV=0&brnN=3&brnBW=1&brnS=high)
const dev = import.meta.env.DEV && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
const devN = dev?.get('brnN') ? Math.max(1, Math.min(4, Number(dev.get('brnN')))) : 2
const devV = dev?.get('brnV') != null ? Number(dev.get('brnV')) : 1

export const useBranes = create<BraneLab>((set, get) => ({
  viewpoint: Number.isFinite(devV) ? devV : 1,
  ref: 0,
  n: devN,
  ys: [...DEFAULT_Y[devN]],
  pair: null,
  rung: 0,
  scale: (dev?.get('brnS') as EnergyScale | null) ?? 'units',
  braneworld: dev?.get('brnBW') === '1',
  focus: null,
  releaseReq: 0,
  collideReq: 0,
  clearReq: 0,
  note: null,
  setViewpoint: (v) => set({ viewpoint: Math.max(0, Math.min(1, v)), focus: 'view' }),
  setRef: (i) => set({ ref: Math.max(0, Math.min(get().n - 1, i)) }),
  setN: (n) => {
    const k = Math.max(1, Math.min(4, Math.round(n)))
    set({ n: k, ys: [...DEFAULT_Y[k]], ref: Math.min(get().ref, k - 1), pair: null, focus: 'brane' })
  },
  setY: (i, y) => {
    const ys = [...get().ys]
    ys[i] = snapY(y, ys.filter((_, j) => j !== i))
    set({ ys, focus: 'brane' })
  },
  setSeparation: (d0) => {
    const { ys } = get()
    if (ys.length !== 2) return
    const d = d0 < 0.2 ? 0 : Math.min(10, d0)
    // keep the pair's midpoint fixed; shift it only as far as needed to stay inside [−5, 5]
    let mid = (ys[0] + ys[1]) / 2
    mid = Math.max(-5 + d / 2, Math.min(5 - d / 2, mid))
    const sign = ys[1] >= ys[0] ? 1 : -1
    set({ ys: [mid - (sign * d) / 2, mid + (sign * d) / 2], focus: 'brane' })
  },
  setPair: (p) => set({ pair: p, focus: 'brane' }),
  setRung: (n) => set({ rung: n, focus: 'rung' }),
  setScale: (s) => set({ scale: s }),
  setBraneworld: (v) => set({ braneworld: v }),
  release: () => set((s) => ({ releaseReq: s.releaseReq + 1 })),
  collide: () => set((s) => ({ collideReq: s.collideReq + 1 })),
  clear: () => set((s) => ({ clearReq: s.clearReq + 1 })),
  say: (text) => set({ note: { text, at: performance.now() } }),
}))

/**
 * The stretched pair the ladder shows: the selected one if still valid, else the reference brane and
 * the nearest brane not stacked with it (null when every brane sits in one stack).
 */
export function ladderPair(ys: number[], ref: number, pair: [number, number] | null): [number, number] | null {
  if (pair && pair[0] < ys.length && pair[1] < ys.length && pair[0] !== pair[1]) return pair
  let best = -1
  let bd = Infinity
  for (let j = 0; j < ys.length; j++) {
    if (j === ref) continue
    const d = Math.abs(ys[j] - ys[ref])
    if (d < 1e-3) continue
    if (d < bd) {
      bd = d
      best = j
    }
  }
  if (best >= 0) return [ref, best]
  // all stacked with the reference: still show a pair (d = 0, identical ladders)
  const other = ys.length > 1 ? (ref === 0 ? 1 : 0) : -1
  return other >= 0 ? [ref, other] : null
}

export const stacksNow = () => stacksOf(useBranes.getState().ys)

const LP = { ys: null as readonly number[] | null, ref: -1, pair: null as [number, number] | null, out: null as [number, number] | null }
/** ladderPair() memoized on its inputs (the store replaces ys/pair on change), for per-frame callers. */
export function ladderPairMemo(ys: number[], ref: number, pair: [number, number] | null) {
  if (ys !== LP.ys || ref !== LP.ref || pair !== LP.pair) {
    LP.ys = ys
    LP.ref = ref
    LP.pair = pair
    LP.out = ladderPair(ys, ref, pair)
  }
  return LP.out
}
