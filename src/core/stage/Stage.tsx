// colorspace MUST be the first import of the stage chunk (disables colour management before any THREE.Color exists)
import '../colorspace'
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, events as createPointerEvents } from '@react-three/fiber'
import type { EventManager, RootState } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import type { ChapterMeta } from '../chapter'
import { journey, useJourney } from '../journey'
import { useSettings, type QualityTier } from '../settings'
import { clock, tickClock } from '../time'
import { HANDOFF } from '../handoff'
import { ChapterPortal } from './ChapterPortal'
import { Compositor } from './Compositor'
import { explore, guardTouchPan, isUI, tickExplore } from '../explore'

// Color management is disabled in core/colorspace.ts (imported first, above):
// hex colors pass straight through, no tone mapping, display-space blending.

const DPR: Record<QualityTier, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1] }
const DOWN: Record<QualityTier, QualityTier> = { high: 'medium', medium: 'low', low: 'low' }

type Handler = (e: PointerEvent | MouseEvent) => void

/**
 * Pointer events for the whole stage, installed *before* any portal copies them:
 * - pointer from clientX/Y against the fixed full-screen canvas (not offsetX of whatever element is hovered)
 * - events that start on UI (panels, controls, chrome) never reach 3D objects, unless an object owns the drag
 * - no wheel raycasting (scroll is the narrative)
 */
const stageEvents = (store: Parameters<typeof createPointerEvents>[0]): EventManager<HTMLElement> => {
  const base = createPointerEvents(store)
  const h = base.handlers as unknown as Record<string, Handler>
  const guard =
    (fn: Handler): Handler =>
    (e) => {
      if (isUI(e.target) && !explore.claimed) h.onPointerLeave?.(e)
      else fn(e)
    }
  const rest: Record<string, Handler> = { ...h }
  delete rest.onWheel
  return {
    ...base,
    compute(e: PointerEvent, s: RootState) {
      s.pointer.set((e.clientX / s.size.width) * 2 - 1, -(e.clientY / s.size.height) * 2 + 1)
      s.raycaster.setFromCamera(s.pointer, s.camera)
    },
    handlers: {
      ...rest,
      onPointerDown: guard(h.onPointerDown),
      onPointerMove: guard(h.onPointerMove),
      onClick: guard(h.onClick),
      onDoubleClick: guard(h.onDoubleClick),
      onContextMenu: guard(h.onContextMenu),
    } as unknown as EventManager<HTMLElement>['handlers'],
  } as EventManager<HTMLElement>
}

export default function Stage({ chapters }: { chapters: ChapterMeta[] }) {
  const quality = useSettings((s) => s.quality)
  const root = document.getElementById('root')!
  const stageRef = useRef<HTMLDivElement>(null)
  useEffect(() => (stageRef.current ? guardTouchPan(stageRef.current) : undefined), [])
  // MSAA is decided once, when the context is created (it can't change later). At an effective DPR of 2 the
  // image is antialiased enough without it (as the Compositor's dissolve targets already assume), and 4× MSAA
  // costs ~3 ms of GPU per frame there. At DPR 1.5 it stays: raw GL hairlines stair-step without it.
  const [antialias] = useState(() => quality !== 'low' && Math.min(window.devicePixelRatio || 1, DPR[quality][1]) < 2)
  return (
    <div ref={stageRef} className="stage" aria-hidden="true">
      <Canvas
        eventSource={root}
        events={stageEvents}
        dpr={DPR[quality]}
        flat
        linear
        legacy
        gl={{ antialias, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        camera={{ fov: HANDOFF.camera.fov, position: HANDOFF.camera.position, near: HANDOFF.camera.near, far: HANDOFF.camera.far }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <ClockDriver />
        <PerformanceMonitor
          onDecline={() => {
            // ignore startup work (chunk parsing, shader compiles)
            const ready = (window as unknown as { __stageReady?: boolean }).__stageReady
            if (!ready || clock.t < 4) return
            const s = useSettings.getState()
            if (!s.qualityLocked && s.quality !== 'low') s.setQuality(DOWN[s.quality])
          }}
        />
        <Director chapters={chapters} />
        <Compositor />
      </Canvas>
    </div>
  )
}

function ClockDriver() {
  const lastY = useRef(-1)
  useFrame((_, dt) => tickClock(dt), -100)
  useFrame((s) => {
    // re-hover after scrolling: scroll moves things under a still pointer without any pointermove
    if (journey.scrollY !== lastY.current) {
      lastY.current = journey.scrollY
      if (explore.hovering) s.events.update?.()
    }
    // after every scene has consumed this frame's drag input
    tickExplore()
  }, 0.5)
  return null
}

function Director({ chapters }: { chapters: ChapterMeta[] }) {
  const mounted = useJourney((s) => s.mounted)
  const active = useJourney((s) => s.active)
  return (
    <>
      {mounted.map((i) => {
        const meta = chapters[i]
        return meta ? <ChapterPortal key={meta.id} meta={meta} active={i === active} /> : null
      })}
    </>
  )
}
