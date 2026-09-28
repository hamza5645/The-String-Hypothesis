import { Beat, Status, Step, STATUS_INFO, type StatusKind } from '@/ui'
import { usePrologue } from './store'
import './styles.css'

const KEY: { kind: StatusKind; short: string }[] = [
  { kind: 'observed', short: 'measured' },
  { kind: 'derived', short: 'follows from the math' },
  { kind: 'conjectured', short: 'strong evidence, unproven' },
  { kind: 'speculative', short: 'one possible scenario' },
  { kind: 'analogy', short: 'a picture, not literal' },
]

export default function Overlay() {
  const requestPluck = usePrologue((s) => s.requestPluck)
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

      <Step id="recede" length={1.5} align="center" valign="lower">
        <Beat status={['derived', 'analogy']}>Step back far enough, and a string would look just like a point. Hold that thought.</Beat>
      </Step>
    </>
  )
}
