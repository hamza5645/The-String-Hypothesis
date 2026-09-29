import { useEffect, useState } from 'react'
import { createSampler, type Cloud, type FigureSpec } from './body'

/*
 * The figure's point clouds are rejection-sampled once per page, off the main thread (a module worker;
 * if one cannot start, idle-time slices of a few ms on the main thread), and cached across remounts.
 * This chapter mounts beside the prologue at page load, so sampling on the main thread would land
 * right when the visitor first tries the prologue's pluck. Requests run in order: the body cloud (seen
 * first) before the hand cloud, which is only on screen once the zoom reaches the fingertip.
 */

const cache = new Map<string, Cloud>()
const waiting = new Map<string, ((c: Cloud) => void)[]>()
const pending = new Map<string, FigureSpec>()
let worker: Worker | null | undefined

const keyOf = (s: FigureSpec) => `${s.withBody ? 'body' : 'hand'}:${s.seed}:${s.count}`

function deliver(key: string, cloud: Cloud) {
  pending.delete(key)
  // one cloud per figure: drop one built for an earlier particle count (quality tier)
  const stem = key.slice(0, key.lastIndexOf(':') + 1)
  for (const k of cache.keys()) if (k.startsWith(stem)) cache.delete(k)
  cache.set(key, cloud)
  for (const cb of waiting.get(key) ?? []) cb(cloud)
  waiting.delete(key)
}

/* main-thread fallback: the same sampler, resumed in idle slices (never one long task) */
const queue: FigureSpec[] = []
let busy = false
const idle = (cb: (budgetMs: number) => void) =>
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback((d) => cb(d.didTimeout ? 6 : Math.max(2, d.timeRemaining() - 1)), { timeout: 400 })
    : window.setTimeout(() => cb(6), 16)

function runLocal(spec: FigureSpec) {
  queue.push(spec)
  if (!busy) next()
}
function next() {
  const spec = queue.shift()
  busy = !!spec
  if (!spec) return
  const sampler = createSampler(spec)
  const slice = (budgetMs: number) => {
    const cloud = sampler.run(performance.now() + budgetMs)
    if (!cloud) return idle(slice)
    deliver(keyOf(spec), cloud)
    next()
  }
  idle(slice)
}

function request(spec: FigureSpec) {
  const key = keyOf(spec)
  if (worker === undefined) {
    try {
      worker = new Worker(new URL('./figure.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<{ key: string; cloud: Cloud }>) => deliver(e.data.key, e.data.cloud)
      worker.onerror = () => {
        // blocked (CSP) or failed: finish everything still outstanding on the main thread instead
        worker?.terminate()
        worker = null
        for (const s of pending.values()) runLocal(s)
      }
    } catch {
      worker = null
    }
  }
  pending.set(key, spec)
  if (worker) worker.postMessage({ key, spec })
  else runLocal(spec)
}

/** The figure's point cloud, or null until it has been sampled (the previous cloud is kept meanwhile). */
export function useFigureCloud(spec: FigureSpec): Cloud | null {
  const key = keyOf(spec)
  const [cloud, setCloud] = useState<Cloud | null>(() => cache.get(key) ?? null)
  useEffect(() => {
    const hit = cache.get(key)
    if (hit) {
      setCloud(hit)
      return
    }
    let alive = true
    const list = waiting.get(key) ?? []
    waiting.set(key, list)
    list.push((c) => alive && setCloud(c))
    if (!pending.has(key)) request(spec)
    return () => {
      alive = false
    }
  }, [key]) // spec is fully described by key
  return cloud
}
