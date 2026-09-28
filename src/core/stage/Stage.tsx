import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import type { ChapterMeta } from '../chapter'
import { useJourney } from '../journey'
import { useSettings, type QualityTier } from '../settings'
import { tickClock } from '../time'
import { HANDOFF } from '../handoff'
import { ChapterPortal } from './ChapterPortal'
import { Compositor } from './Compositor'
import { tickExplore } from '../explore'

// Color management is disabled in core/colorspace.ts (imported first by main.tsx):
// hex colors pass straight through, no tone mapping, display-space blending.

const DPR: Record<QualityTier, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1] }
const DOWN: Record<QualityTier, QualityTier> = { high: 'medium', medium: 'low', low: 'low' }

export function Stage({ chapters }: { chapters: ChapterMeta[] }) {
  const quality = useSettings((s) => s.quality)
  const root = document.getElementById('root')!
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        eventSource={root}
        eventPrefix="client"
        dpr={DPR[quality]}
        flat
        linear
        legacy
        gl={{ antialias: quality !== 'low', alpha: false, stencil: false, powerPreference: 'high-performance' }}
        camera={{ fov: HANDOFF.camera.fov, position: HANDOFF.camera.position, near: HANDOFF.camera.near, far: HANDOFF.camera.far }}
        style={{ position: 'fixed', inset: 0, touchAction: 'pan-y' }}
      >
        <ClockDriver />
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => {
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
  useFrame((_, dt) => tickClock(dt), -100)
  // after every scene has consumed this frame's drag input
  useFrame(() => tickExplore(), 0.5)
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
