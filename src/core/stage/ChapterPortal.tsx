import { Suspense, useEffect, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { ChapterContext, getHandle, type ChapterMeta } from '../chapter'
import { HANDOFF } from '../handoff'
import { portalRegistry } from './registry'

/**
 * Mounts one chapter's Scene into its own THREE.Scene with its own camera.
 * The Compositor decides when (and how) that scene is drawn.
 */
export function ChapterPortal({ meta, active }: { meta: ChapterMeta; active: boolean }) {
  const scene = useMemo(() => {
    const s = new THREE.Scene()
    s.name = `chapter:${meta.id}`
    return s
  }, [meta.id])
  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(HANDOFF.camera.fov, 1, HANDOFF.camera.near, HANDOFF.camera.far)
    c.position.set(...HANDOFF.camera.position)
    c.lookAt(0, 0, 0)
    return c
  }, [])
  const handle = getHandle(meta.id, meta.index)
  const Scene = meta.Scene

  return createPortal(
    <ChapterContext.Provider value={handle}>
      <PortalKeeper active={active} />
      <Suspense fallback={null}>
        <Scene />
        <Registrar id={meta.id} scene={scene} />
      </Suspense>
    </ChapterContext.Provider>,
    scene,
    { camera },
  )
}

/** Keeps the portal camera's aspect in sync and gates pointer events to the active chapter. */
function PortalKeeper({ active }: { active: boolean }) {
  const setEvents = useThree((s) => s.setEvents)
  const get = useThree((s) => s.get)
  useEffect(() => {
    setEvents({ enabled: active })
  }, [active, setEvents])
  useFrame(() => {
    const { camera, size } = get()
    const cam = camera as THREE.PerspectiveCamera & { manual?: boolean }
    if (!cam.isPerspectiveCamera || cam.manual) return
    const aspect = size.width / Math.max(1, size.height)
    if (Math.abs(cam.aspect - aspect) > 1e-4) {
      cam.aspect = aspect
      cam.updateProjectionMatrix()
    }
  }, -50)
  return null
}

/** Registers the (loaded) scene with the compositor and pre-compiles its shaders. */
function Registrar({ id, scene }: { id: string; scene: THREE.Scene }) {
  const get = useThree((s) => s.get)
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    portalRegistry.set(id, { scene, getCamera: () => get().camera })
    const cam = get().camera
    // Warm up shader programs so the first dissolve frame doesn't hitch.
    const r = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> }
    const t = window.setTimeout(() => {
      try {
        r.compileAsync?.(scene, cam)?.catch(() => {})
      } catch {
        /* ignore */
      }
    }, 30)
    return () => {
      window.clearTimeout(t)
      if (portalRegistry.get(id)?.scene === scene) portalRegistry.delete(id)
    }
  }, [id, scene, get, gl])
  return null
}
