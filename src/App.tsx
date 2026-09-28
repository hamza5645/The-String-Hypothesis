import { useEffect } from 'react'
import { CHAPTERS } from './chapters'
import { initExplore } from './core/explore'
import { journey } from './core/journey'
import { params } from './core/params'
import { applyInitialPosition, initScroller } from './core/scroller'
import { useSettings } from './core/settings'
import { Stage } from './core/stage/Stage'
import { ChapterSection } from './ui/Chapter'
import { ChapterMenu, ChapterRail, GlossaryDrawer, ScaleGauge, TopBar } from './ui/Chrome'

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
      {webgl && <Stage chapters={CHAPTERS} />}
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
