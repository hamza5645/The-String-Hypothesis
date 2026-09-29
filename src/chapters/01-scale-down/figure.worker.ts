// Samples the human figure's surface points off the main thread (≈ 80k body + 60k hand points; cloud.ts).
import { createSampler, type Cloud, type FigureSpec } from './body'

type Ctx = { onmessage: ((e: MessageEvent<{ key: string; spec: FigureSpec }>) => void) | null; postMessage(m: unknown, t: Transferable[]): void }
const ctx = self as unknown as Ctx

ctx.onmessage = (e) => {
  const { key, spec } = e.data
  const cloud = createSampler(spec).run(Infinity) as Cloud
  ctx.postMessage({ key, cloud }, [cloud.positions.buffer, cloud.normals.buffer, cloud.starts.buffer, cloud.rands.buffer])
}
