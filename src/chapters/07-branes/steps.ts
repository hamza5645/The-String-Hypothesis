/** Scroll steps, in order. Shared by the Overlay (lengths) and the Scene (choreography). */
export const STEPS = [
  { id: 'title', len: 1.15 },
  { id: 'open', len: 1.4 },
  { id: 'rule', len: 1.6 },
  { id: 'thing', len: 1.6 },
  { id: 'onoff', len: 1.7 },
  { id: 'mass', len: 1.6 },
  { id: 'touch', len: 2.2 },
  { id: 'world', len: 1.9 },
  { id: 'lab', len: 2.4 },
  { id: 'exit', len: 1.2 },
] as const

export type StepId = (typeof STEPS)[number]['id']
export const LEN = Object.fromEntries(STEPS.map((s) => [s.id, s.len])) as Record<StepId, number>

/** Step progress at which a step's sticky frame is pinned (top at viewport top): 0.5 / len. */
export const pinStart = (id: StepId) => 0.5 / LEN[id]
/** Step progress at which the step's bottom reaches the viewport bottom: 1 − 0.5 / len. */
export const pinEnd = (id: StepId) => 1 - 0.5 / LEN[id]
