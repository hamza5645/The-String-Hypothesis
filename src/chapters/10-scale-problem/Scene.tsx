/*
 * Chapter 10 · Out of Reach — the stage.
 * One fixed camera (HANDOFF.camera); every beat is composed in screen space from float64 ratios:
 *   WebGL  — the Thread / H0 point, point-cloud layers, the ring, stars, galaxy, sparks, magnifier
 *   DOM    — the diagram in light (SVG hairlines + mono labels) in the shared #scene-labels layer
 * Both read one StageState computed per frame from scroll (and the Lab store).
 */
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Backdrop, useChapterFrame } from '@/gl'
import { particleScale } from '@/core/settings'
import { computeStage, createMem, createStage } from './choreo'
import { Diagram } from './dom/Diagram'
import { galaxy as makeGalaxy } from './gl/clouds'
import { MapGL } from './gl/MapGL'
import { OpeningGL } from './gl/OpeningGL'
import { ZoomGL } from './gl/ZoomGL'
import { makeLayout } from './layout'
import { timeline } from './timeline'

export default function Scene() {
  const size = useThree((s) => s.size)
  const vw = typeof document !== 'undefined' ? document.documentElement.clientWidth || size.width : size.width
  const L = useMemo(() => makeLayout(size.width, size.height, vw), [size.width, size.height, vw])
  const S = useMemo(() => createStage(L), []) // eslint-disable-line react-hooks/exhaustive-deps
  const mem = useMemo(createMem, [])
  const galaxy = useMemo(() => makeGalaxy(Math.round(60000 * particleScale())), [])
  const diagram = useRef<Diagram | null>(null)
  S.L = L

  useLayoutEffect(() => {
    const host = document.getElementById('scene-labels')
    if (!host) return
    const d = new Diagram(host)
    diagram.current = d
    return () => {
      d.destroy()
      diagram.current = null
    }
  }, [])
  useLayoutEffect(() => {
    diagram.current?.build(L)
  }, [L])

  // the director: runs first, computes the StageState, then drives the diagram layer
  useChapterFrame(
    (f) => {
      if (f.presence > 0) computeStage(timeline(f.h), f.t, f.dt, L, mem, S, f.progress)
      diagram.current?.update(S, f.presence)
    },
    { always: true, priority: -2 },
  )

  return (
    <>
      <Backdrop intensity={0.4} />
      <MapGL S={S} galaxy={galaxy} />
      <ZoomGL S={S} galaxy={galaxy} />
      <OpeningGL S={S} />
    </>
  )
}
