import { lazy, Suspense, useEffect } from 'react'
import { CHAPTERS } from './chapters'
import { initExplore } from './core/explore'
import { journey } from './core/journey'
import { params } from './core/params'
import { applyInitialPosition, initScroller } from './core/scroller'
import { useSettings } from './core/settings'
import { StageBoundary } from './core/stage/StageBoundary'
import { ChapterSection } from './ui/Chapter'
import { ChapterMenu, ChapterRail, GlossaryDrawer, ScaleGauge, TopBar } from './ui/Chrome'

// three.js + R3F load in their own chunk: the hero text paints immediately, WebGL follows.
const Stage = lazy(() => import('./core/stage/Stage'))

export function App() {
  const webgl = useSettings((s) => s.webgl)
  const sections = params.solo ? CHAPTERS.filter((c) => c.id === params.solo) : CHAPTERS

  useEffect(() => {
    // exposed for the screenshot harness (read-only use)
    ;(window as unknown as { __journey: typeof journey }).__journey = journey
    initScroller()
    initExplore()
    // let fonts + first layout settle, then honour deep links
    requestAnimationFrame(() => requestAnimationFrame(applyInitialPosition))
    if (!webgl) (window as unknown as { __stageReady: boolean }).__stageReady = true
    // warm the scene chunks in idle time so boundaries never wait on the network
    const warm = () => {
      for (const c of CHAPTERS) c.preload?.()
    }
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(warm, { timeout: 4000 })
    else setTimeout(warm, 1500)
  }, [webgl])

  return (
    <>
      {webgl && (
        <StageBoundary label="stage" onError={() => useSettings.setState({ webgl: false })}>
          <Suspense fallback={<div className="stage" aria-hidden="true" />}>
            <Stage chapters={CHAPTERS} />
          </Suspense>
        </StageBoundary>
      )}
      <div className="jump-cover" aria-hidden="true" />
      <div id="scene-labels" className="scene-labels" aria-hidden="true" />
      <div className="fx" aria-hidden="true">
        <div className="fx__vignette" />
        <div className="fx__grain" />
      </div>
      <TopBar chapters={CHAPTERS} />
      <ChapterRail chapters={CHAPTERS} />
      <ScaleGauge chapters={CHAPTERS} />
      <main className="journey">
        {sections.map((m) => (
          <ChapterSection key={m.id} meta={m} webgl={webgl} />
        ))}
      </main>
      <ChapterMenu chapters={CHAPTERS} />
      <GlossaryDrawer chapters={CHAPTERS} />
    </>
  )
}
