import { GoDeeper, Status, STATUS_INFO, type StatusKind } from '@/ui'
import { scrollToY } from '@/core/scroller'
import { prefersReducedMotion } from '@/core/time'
import { READING } from './data'

/*
 * The site's last viewport (`rest`): the Thread holds at H1 above; the footer rises beneath it —
 * the status legend one last time, further reading, credits, and a quiet way back to the top.
 */

const KEY: { kind: StatusKind; short: string }[] = [
  { kind: 'observed', short: 'measured' },
  { kind: 'derived', short: 'follows from the math' },
  { kind: 'conjectured', short: 'strong evidence, unproven' },
  { kind: 'speculative', short: 'possible, untested' },
  { kind: 'analogy', short: 'a picture, not literal' },
]

/** Back to the prologue: a short dip to black, then an immediate jump (no flight through every chapter). */
function backToStart() {
  const root = document.documentElement
  const go = () => {
    scrollToY(0, true)
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-jumping')))
  }
  if (prefersReducedMotion()) {
    scrollToY(0, true)
    return
  }
  root.classList.add('is-jumping')
  window.setTimeout(go, 340)
}

export function Finale() {
  return (
    <footer className="kn-end" aria-label="End of the journey">
      <p className="sr-only">Still waiting for nature’s answer.</p>
      <div className="kn-end__rule" aria-hidden="true" />
      <div className="kn-end__top">
        <p className="t-label kn-end__kicker">
          <span className="kn-end__num">11</span>
          <span className="kn-end__dash" aria-hidden="true" />
          End of the journey · status as of 2026
        </p>
        <ul className="kn-end__key" aria-label="The five marks, one last time">
          {KEY.map((k) => (
            <li key={k.kind} title={STATUS_INFO[k.kind].meaning}>
              <Status kind={k.kind} compact />
              <span className="sr-only">{k.short}</span>
            </li>
          ))}
        </ul>
      </div>

      <nav className="kn-end__reading" aria-label="Further reading">
        {READING.map((g) => (
          <section key={g.group} className="kn-end__col">
            <h3 className="t-label kn-end__group">{g.group}</h3>
            <ul>
              {g.items.map((r) => (
                <li key={r.title} title={`${r.author}, ${r.title} (${r.pub})${r.note ? '. ' + r.note : ''}`}>
                  <span className="kn-end__author">{r.author}</span>
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noreferrer" className={r.italic ? 'kn-end__title is-italic' : 'kn-end__title'}>
                      {r.title}
                    </a>
                  ) : (
                    <span className={r.italic ? 'kn-end__title is-italic' : 'kn-end__title'}>{r.title}</span>
                  )}
                  <span className="sr-only">, {r.pub}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <div className="kn-end__foot">
        <p className="kn-end__credit">
          The String Hypothesis · an explorable guide to an elegant, untested idea. Every claim wore its mark; no experiment has yet confirmed string
          theory.
        </p>
        <div className="kn-end__actions">
          <GoDeeper id="reading" title="Further reading" label="Reading list">
            {READING.map((g) => (
              <section key={g.group}>
                <h3>{g.group}</h3>
                <ul>
                  {g.items.map((r) => (
                    <li key={r.title}>
                      <strong>{r.author}</strong>,{' '}
                      {r.href ? (
                        <a href={r.href} target="_blank" rel="noreferrer">
                          {r.italic ? <em>{r.title}</em> : r.title}
                        </a>
                      ) : r.italic ? (
                        <em>{r.title}</em>
                      ) : (
                        r.title
                      )}{' '}
                      ({r.pub}).{r.note ? ` ${r.note}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </GoDeeper>
          <button type="button" className="kn-back" onClick={backToStart}>
            <span className="kn-back__arrow" aria-hidden="true">
              ↑
            </span>
            Back to the beginning
          </button>
        </div>
      </div>
    </footer>
  )
}
