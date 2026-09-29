/*
 * The stage's point clouds, built in a module Worker when the Scene mounts (that is, when Chapter 9
 * becomes active; never from the idle-time chunk preload). They are needed only from Beat 1's zoom
 * onward, a few viewports into the chapter, so they arrive long before they are drawn. Kept per quality
 * tier, so a remount (scrolling back) reuses them at once.
 */
import { useEffect, useState } from 'react'
import { CLOUD_BUILDERS, CLOUD_KEYS, type CloudSet } from './cloudSet'

const pending = new Map<number, Promise<CloudSet>>()
const ready = new Map<number, CloudSet>()

/** No Worker (or a policy that blocks one): build on the main thread, one cloud per task. */
function sliced(ps: number): Promise<CloudSet> {
  return new Promise((resolve) => {
    const set = {} as CloudSet
    let i = 0
    const next = () => {
      const k = CLOUD_KEYS[i++]
      set[k] = CLOUD_BUILDERS[k](ps)
      if (i < CLOUD_KEYS.length) setTimeout(next, 0)
      else resolve(set)
    }
    setTimeout(next, 0)
  })
}

function build(ps: number): Promise<CloudSet> {
  return new Promise((resolve) => {
    let done = false
    let w: Worker | null = null
    const fallback = () => {
      w?.terminate()
      if (done) return
      done = true
      sliced(ps).then(resolve)
    }
    try {
      w = new Worker(new URL('./clouds.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      fallback()
      return
    }
    w.onmessage = (e: MessageEvent<CloudSet>) => {
      w?.terminate()
      if (done) return
      done = true
      resolve(e.data)
    }
    w.onerror = fallback
    w.onmessageerror = fallback
    w.postMessage({ ps })
  })
}

function load(ps: number) {
  let p = pending.get(ps)
  if (!p) {
    p = build(ps).then((set) => {
      ready.set(ps, set)
      return set
    })
    pending.set(ps, p)
  }
  return p
}

/** The cloud set for particle scale `ps`: null until it has been built. */
export function useClouds(ps: number): CloudSet | null {
  const [set, setSet] = useState<CloudSet | null>(() => ready.get(ps) ?? null)
  useEffect(() => {
    if (set) return
    let live = true
    load(ps).then((s) => {
      if (live) setSet(s)
    })
    return () => {
      live = false
    }
  }, [ps, set])
  return set
}
