import { Suspense, useEffect, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { ChapterContext, getHandle, useChapter, type ChapterMeta } from '../chapter'
import { releaseStageCursor } from '../explore'
import { HANDOFF } from '../handoff'
import { portalRegistry } from './registry'
import { StageBoundary } from './StageBoundary'

/**
 * Mounts one chapter's Scene into its own THREE.Scene with its own camera.
 * The Compositor decides when (and how) that scene is drawn.
 */
export function ChapterPortal({ meta, active }: { meta: ChapterMeta; active: boolean }) {
  const get = useThree((s) => s.get)
  const scene = useMemo(() => {
    const s = new THREE.Scene()
    s.name = `chapter:${meta.id}`
    return s
  }, [meta.id])
  const camera = useMemo(() => {
    const { size } = get()
    const c = new THREE.PerspectiveCamera(HANDOFF.camera.fov, size.width / Math.max(1, size.height), HANDOFF.camera.near, HANDOFF.camera.far)
    c.position.set(...HANDOFF.camera.position)
    c.lookAt(0, 0, 0)
    return c
  }, [get])
  // Every portal (whenever it mounts) attaches DOM helpers such as drei <Html> to the fixed
  // #scene-labels layer — so labels behave identically in solo screenshots and in the journey.
  const connected = useMemo(() => document.getElementById('scene-labels') ?? undefined, [])
  const handle = getHandle(meta.id, meta.index)
  const Scene = meta.Scene
  // memoized so `active` flips never re-render the chapter's scene tree
  const content = useMemo(
    () => (
      <Suspense fallback={null}>
        <Scene />
        <Registrar id={meta.id} scene={scene} />
      </Suspense>
    ),
    [Scene, meta.id, scene],
  )

  return createPortal(
    <ChapterContext.Provider value={handle}>
      <StageBoundary label={`chapter ${meta.id}`}>
        <PortalKeeper active={active} />
        {content}
      </StageBoundary>
    </ChapterContext.Provider>,
    scene,
    { camera, events: { connected } as never },
  )
}

/** Keeps the portal camera's aspect in sync, gates pointer events to the active chapter, tidies hover/cursor. */
function PortalKeeper({ active }: { active: boolean }) {
  const setEvents = useThree((s) => s.setEvents)
  const get = useThree((s) => s.get)
  const h = useChapter()
  useEffect(() => {
    setEvents({ enabled: active })
    // re-raycast at the last pointer so this chapter's hovered objects get onPointerOut
    get().events.update?.()
    if (!active) releaseStageCursor(h.id)
  }, [active, setEvents, get, h.id])
  useEffect(() => () => releaseStageCursor(h.id), [h.id])
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

let warmRT: THREE.WebGLRenderTarget | null = null
const idle = (cb: () => void) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 600 }) : window.setTimeout(cb, 60)
const cancelIdle = (id: number) => (typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback(id) : window.clearTimeout(id))

/** Registers the (loaded) scene with the compositor; in idle time compiles shaders and uploads buffers/textures. */
function Registrar({ id, scene }: { id: string; scene: THREE.Scene }) {
  const get = useThree((s) => s.get)
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    portalRegistry.set(id, { scene, getCamera: () => get().camera })
    let dead = false
    const r = gl as THREE.WebGLRenderer
    const handle = idle(() => {
      if (dead) return
      const cam = get().camera
      if (import.meta.env.DEV) {
        scene.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
          if (m && !Array.isArray(m) && m.map?.colorSpace === THREE.SRGBColorSpace)
            console.warn(`[${id}] a texture uses SRGBColorSpace — it renders dark (color management is off); leave colorSpace at its default`)
        })
      }
      r.compileAsync(scene, cam)
        .then(() => {
          if (dead) return
          // one tiny off-screen render uploads geometry + textures, so the first dissolve frame doesn't hitch
          scene.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.Material & { map?: THREE.Texture | null }
            if (m && !Array.isArray(m) && m.map) r.initTexture(m.map)
          })
          warmRT ??= new THREE.WebGLRenderTarget(16, 16)
          const prev = r.getRenderTarget()
          r.setRenderTarget(warmRT)
          r.render(scene, cam)
          r.setRenderTarget(prev)
        })
        .catch(() => {})
    })
    return () => {
      dead = true
      cancelIdle(handle as number)
      if (portalRegistry.get(id)?.scene === scene) portalRegistry.delete(id)
    }
  }, [id, scene, get, gl])
  return null
}
