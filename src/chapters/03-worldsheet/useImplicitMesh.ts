import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { meshTwoGaussians, type MeshData } from './mesher'
import { MESH_SPECS, type MeshKind } from './meshSpecs'

/*
 * The pants and handle meshes are built once per page (worker, or idle main-thread fallback) and cached
 * across remounts: the chapter mounts/unmounts as the visitor scrolls past, the geometry doesn't change.
 */
const cache: Partial<Record<MeshKind, THREE.BufferGeometry>> = {}
const waiting: Partial<Record<MeshKind, ((g: THREE.BufferGeometry) => void)[]>> = {}
let worker: Worker | null | undefined

function toGeometry(m: MeshData) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3))
  g.setIndex(new THREE.BufferAttribute(m.index, 1))
  g.computeBoundingSphere()
  return g
}

function deliver(kind: MeshKind, m: MeshData) {
  const g = toGeometry(m)
  cache[kind] = g
  for (const cb of waiting[kind] ?? []) cb(g)
  waiting[kind] = []
}

const idle = (cb: () => void) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 500 }) : window.setTimeout(cb, 30)

function request(kind: MeshKind) {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL('./mesh.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<MeshData & { kind: MeshKind }>) => deliver(e.data.kind, e.data)
      worker.onerror = () => {
        // worker blocked (CSP) or failed: build on the main thread in idle time instead
        worker = null
        for (const k of Object.keys(waiting) as MeshKind[]) if (!cache[k] && waiting[k]?.length) idle(() => deliver(k, meshTwoGaussians(MESH_SPECS[k])))
      }
    } catch {
      worker = null
    }
  }
  if (worker) worker.postMessage(kind)
  else idle(() => deliver(kind, meshTwoGaussians(MESH_SPECS[kind])))
}

export function useImplicitMesh(kind: MeshKind) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(() => cache[kind] ?? null)
  useEffect(() => {
    if (cache[kind]) {
      setGeo(cache[kind]!)
      return
    }
    let alive = true
    const cb = (g: THREE.BufferGeometry) => alive && setGeo(g)
    const list = (waiting[kind] ??= [])
    const first = list.length === 0
    list.push(cb)
    if (first) request(kind)
    return () => {
      alive = false
    }
  }, [kind])
  return geo
}
