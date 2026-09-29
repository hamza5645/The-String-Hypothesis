import { useLayoutEffect, useRef } from 'react'
import { useChapter } from '@/core/chapter'
import { onJourney } from '@/core/journey'
import { Beat, Status, Step, STATUS_INFO, type StatusKind } from '@/ui'
import { noteOpacity, usePrologue } from './store'
import './styles.css'

const KEY: { kind: StatusKind; short: string }[] = [
  { kind: 'observed', short: 'measured' },
  { kind: 'derived', short: 'follows from the math' },
  { kind: 'conjectured', short: 'strong evidence, unproven' },
  { kind: 'speculative', short: 'one possible scenario' },
  { kind: 'analogy', short: 'a picture, not literal' },
]

/**
 * Portrait layout: the band between the subtitle and the opening beat belongs to the Thread. The DOM owns
 * the band (its note, and a slot for the Thread), and publishes the slot's resting height so the Scene can
 * lay the Thread in it, whatever the screen size, font metrics or text wrapping.
 */
function useBandSlot() {
  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = slot.current!
    const measure = () => {
      // hidden (desktop layout) → the Scene keeps its own composition
      if (el.offsetHeight === 0) return usePrologue.setState({ bandY: null })
      // offsets are layout positions (the step's fade transform is ignored); the sticky .step__inner rests at
      // the top of the screen while the hero is held
      let y = el.offsetHeight / 2
      for (let n: HTMLElement | null = el; n && !n.classList.contains('step__inner'); n = n.offsetParent as HTMLElement | null) y += n.offsetTop
      usePrologue.setState({ bandY: y })
    }
    const hero = el.closest('.pro-hero')!
    const ro = new ResizeObserver(measure)
    // the hero (screen size), its head (font swap, rewrapping) and the band itself
    for (const n of [hero, hero.querySelector('.pro-hero__head'), el.parentElement]) if (n) ro.observe(n)
    let live = true
    document.fonts?.ready.then(() => live && measure())
    measure()
    return () => {
      live = false
      ro.disconnect()
      usePrologue.setState({ bandY: null })
    }
  }, [])
  return slot
}

/** The band's note fades with the same curve as the Scene's own note, before the hero starts to rise. */
function useNoteFade() {
  const h = useChapter()
  const note = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const fade = () => note.current && (note.current.style.opacity = noteOpacity(h.progress()).toFixed(3))
    fade()
    return onJourney(fade)
  }, [h])
  return note
}

export default function Overlay() {
  const requestPluck = usePrologue((s) => s.requestPluck)
  const slot = useBandSlot()
  const note = useNoteFade()
  return (
    <>
      <Step id="hero" length={1.7} align="wide" valign="top" className="pro-step">
        <div className="pro-hero">
          <header className="pro-hero__head">
            <p className="t-label pro-kicker">
              <span className="pro-kicker__num">00</span>
              <span className="pro-kicker__rule" aria-hidden="true" />
              An explorable guide in eleven chapters
            </p>
            <h1 className="pro-title">
              The String <em>Hypothesis</em>
            </h1>
            <p className="pro-sub">An explorable guide to an elegant, untested idea about what everything is made of.</p>
          </header>

          {/* the Thread's band (portrait): a figure caption, then the slot the Thread rests in */}
          <div className="pro-band" aria-hidden="true">
            <p ref={note} className="pro-band__note">
              <Status kind="analogy" compact /> A picture of an idea.
              <br />
              No one has ever seen a string.
            </p>
            <div ref={slot} className="pro-band__slot" />
          </div>

          <div className="pro-hero__foot">
            <div className="pro-beats">
              <Beat status="speculative">
                String theory proposes that the particles of our world are tiny vibrating strings, too small for any experiment so far to resolve.
                Developed for more than fifty years, it is mathematically rich and still untested by experiment.
              </Beat>
              <p className="pro-p2">
                <span className="pro-p2__chip">
                  <Status kind="analogy" compact />
                </span>
                Every claim here wears a mark showing how sure we are.{' '}
                <button type="button" className="pro-pluck" onClick={requestPluck}>
                  Touch the thread
                </button>
                . Then scroll: we begin with you.
              </p>
            </div>
            <div className="pro-cue t-label" aria-hidden="true">
              <span className="pro-cue__line" />
              Scroll · we start with you
            </div>
          </div>

          <ul className="pro-key" aria-label="How sure is each claim? The five marks">
            {KEY.map((k) => (
              <li key={k.kind} className="pro-key__item" title={STATUS_INFO[k.kind].meaning}>
                <Status kind={k.kind} compact />
                <span className="pro-key__short">{k.short}</span>
              </li>
            ))}
          </ul>
        </div>
      </Step>

      <Step id="recede" length={1.5} align="center" valign="lower" exit="hold">
        <Beat status={['derived', 'analogy']}>Step back far enough, and a string would look just like a point. Hold that thought.</Beat>
      </Step>
    </>
  )
}
