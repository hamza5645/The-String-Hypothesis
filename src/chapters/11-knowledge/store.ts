import { create } from 'zustand'
import { REFEREE } from './data'

/*
 * Shared state for chapter 11: the Referee's Bench (lab), the claim cards, and readouts the
 * Scene measures (written only when a value changes). Scene reads with getState() in frame loops.
 */

export type ThreadState = 'HIDDEN' | 'PARTLY SHOWN' | 'SHOWN'

interface KnowledgeState {
  /** Lab evidence ceiling L ∈ [0, 3] (0 = measured only). Continues from B6's final L = 0. */
  ceiling: number
  dragging: boolean
  labels: boolean
  /** Referee: current claim index 0..8 and the latest answer per claim (tier index or null). */
  refIdx: number
  answers: (number | null)[]
  /** Increments on every answer; the Scene flies a token for REFEREE[tokenClaim]. */
  tokenSeq: number
  tokenClaim: number

  /** Claim cards: hovered node (pointer) and pinned node (tap / click / keyboard). */
  hover: string | null
  pinned: string | null

  /** Measured by the Scene (Model §4). */
  shown: number
  stShown: number
  thread: ThreadState
  warm: boolean
  /** Beat 3 phase for the Go-deeper highlight: 0 none, 1 count (A), 2 coupling (B), 3 compare (C). */
  countPhase: number
  /** E3: pluck requests from the keyboard / button. */
  pluckSeq: number

  setCeiling: (L: number) => void
  setDragging: (v: boolean) => void
  setLabels: (v: boolean) => void
  answer: (tier: number) => void
  nextClaim: () => void
  reset: () => void
  setHover: (id: string | null) => void
  setPinned: (id: string | null) => void
  requestPluck: () => void
}

export const useKnowledge = create<KnowledgeState>((set, get) => ({
  ceiling: 0,
  dragging: false,
  labels: true,
  refIdx: 0,
  answers: REFEREE.map(() => null),
  tokenSeq: 0,
  tokenClaim: 0,
  hover: null,
  pinned: null,
  shown: 14,
  stShown: 0,
  thread: 'HIDDEN',
  warm: false,
  countPhase: 0,
  pluckSeq: 0,

  setCeiling: (L) => set({ ceiling: Math.max(0, Math.min(3, L)) }),
  setDragging: (v) => set({ dragging: v }),
  setLabels: (v) => set({ labels: v }),
  answer: (tier) => {
    const { refIdx, answers, tokenSeq } = get()
    const next = answers.slice()
    next[refIdx] = tier
    set({ answers: next, tokenSeq: tokenSeq + 1, tokenClaim: refIdx })
  },
  nextClaim: () => set({ refIdx: Math.min(REFEREE.length - 1, get().refIdx + 1) }),
  reset: () => set({ ceiling: 0, answers: REFEREE.map(() => null), refIdx: 0, pinned: null, tokenSeq: get().tokenSeq + 1, tokenClaim: -1 }),
  setHover: (id) => {
    if (get().hover !== id) set({ hover: id })
  },
  setPinned: (id) => {
    if (get().pinned !== id) set({ pinned: id })
  },
  requestPluck: () => set({ pluckSeq: get().pluckSeq + 1 }),
}))

/**
 * Non-reactive, per-frame values the Scene writes for the DOM card (no React renders):
 * the on-screen position of the node the card is attached to.
 */
export const cardAnchor = { x: 0, y: 0, r: 10, on: false, ghost: false }

/** Nodes the keyboard can cycle through right now (the tier in focus), set by the Scene. */
export const browse = { ids: [] as string[] }
