/*
 * Builds the stage's point clouds off the main thread and hands the buffers over (transferred, not copied).
 * In: { ps } (the particle scale). Out: a CloudSet.
 */
import { CLOUD_BUILDERS, CLOUD_KEYS, type CloudSet } from './cloudSet'

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<{ ps: number }>) => void) | null
  postMessage(msg: unknown, transfer: Transferable[]): void
}

ctx.onmessage = (e) => {
  const ps = e.data.ps
  const set = {} as CloudSet
  const transfer: Transferable[] = []
  for (const k of CLOUD_KEYS) {
    const c = CLOUD_BUILDERS[k](ps)
    set[k] = c
    transfer.push(c.positions.buffer, c.sizes.buffer, c.alphas.buffer)
  }
  ctx.postMessage(set, transfer)
}
