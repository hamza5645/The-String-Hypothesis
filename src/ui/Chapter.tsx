import { createContext, Suspense, useContext, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ChapterContext, getHandle, useChapter, type ChapterMeta } from '../core/chapter'
import { bindChapterEl, bindStep, type StepExit } from '../core/journey'
import { Status, type StatusKind } from './Status'

const MetaContext = createContext<ChapterMeta | null>(null)
export const useChapterMeta = () => {
  const m = useContext(MetaContext)
  if (!m) throw new Error('useChapterMeta must be used inside a chapter Overlay')
  return m
}

/** One chapter's scroll section. The Overlay's <Step>s define its length. */
export function ChapterSection({ meta, webgl }: { meta: ChapterMeta; webgl: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    bindChapterEl(meta.id, ref.current)
    return () => bindChapterEl(meta.id, null)
  }, [meta.id])
  const handle = getHandle(meta.id, meta.index)
  const Overlay = meta.Overlay
  const Fallback = meta.Fallback
  return (
    <section
      ref={ref}
      id={meta.id}
      className="chapter"
      data-chapter={meta.id}
      tabIndex={meta.index === 0 ? -1 : undefined}
      aria-label={`${meta.title}. ${meta.question}`}
    >
      {/* not aria-hidden: each Fallback's root <svg role="img" aria-label> is the chapter's figure description */}
      {!webgl && Fallback && (
        <div className="chapter-fallback">
          <Suspense fallback={null}>
            <Fallback />
          </Suspense>
        </div>
      )}
      <MetaContext.Provider value={meta}>
        <ChapterContext.Provider value={handle}>
          <Overlay />
        </ChapterContext.Provider>
      </MetaContext.Provider>
    </section>
  )
}

export type StepAlign = 'left' | 'right' | 'center' | 'wide'

/**
 * A scroll step: `length` viewport-heights of scroll during which its content is held in view
 * (sticky) and faded in/out. Scenes read its local progress with h.step(id).
 *
 * `exit` (how the content leaves once its sticky hold ends, in the step's last viewport):
 * - 'late' (default): it scrolls up with the page and fades over the last ~0.22 viewport.
 * - 'early': it fades as soon as it starts to move (it still rises ~0.24 viewport while fading).
 * - 'hold': it stays at its resting place and fades there over ~0.4 viewport. Use it on a chapter's last
 *   step, whose final viewport is the dissolve: the text never slides across the centred handoff object.
 */
export function Step({
  id,
  length = 1,
  align = 'left',
  valign = 'center',
  fade = true,
  exit = 'late',
  className,
  children,
}: {
  id: string
  length?: number
  align?: StepAlign
  valign?: 'center' | 'top' | 'bottom' | 'lower'
  fade?: boolean
  /** See above. 'hold' keeps the text still while it fades (for a chapter's closing step). */
  exit?: StepExit
  className?: string
  children?: ReactNode
}) {
  const h = useChapter()
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => bindStep(h.id, id, ref.current!, fade, exit), [h.id, id, fade, exit])
  return (
    <div
      ref={ref}
      className={`step step--${align} step--v-${valign}${className ? ' ' + className : ''}`}
      data-step={id}
      style={{ ['--len' as string]: length }}
    >
      <div className="step__inner">
        <div className="step__content">{children}</div>
      </div>
    </div>
  )
}

/** The chapter's opening card: number, title, the big question. */
export function ChapterTitle({
  children,
  sub,
  status,
  align = 'left',
  valign = 'lower',
  length = 1.15,
}: {
  /** The question. Use <em> for the word that should lean. Defaults to meta.question. */
  children?: ReactNode
  sub?: ReactNode
  status?: StatusKind | StatusKind[]
  align?: StepAlign
  /** 'lower' (default) keeps the screen centre free for the handoff object. */
  valign?: 'center' | 'top' | 'bottom' | 'lower'
  length?: number
}) {
  const meta = useChapterMeta()
  return (
    // 'hold': the card fades where it rests (lower-left), so it never rises through the centred handoff object
    <Step id="title" length={length} align={align} valign={valign} exit="hold" className="step--title">
      <header className="chapter-title">
        <div className="chapter-title__eyebrow t-label">
          <span className="chapter-title__num">{String(meta.index).padStart(2, '0')}</span>
          <span className="chapter-title__rule" aria-hidden="true" />
          <span>{meta.title}</span>
        </div>
        <h2 className="t-question chapter-title__q">{children ?? meta.question}</h2>
        {(sub || status) && (
          <div className="chapter-title__sub">
            {status && <StatusRow status={status} />}
            {sub && <p className="t-lead">{sub}</p>}
          </div>
        )}
      </header>
    </Step>
  )
}

export function StatusRow({ status }: { status: StatusKind | StatusKind[] }) {
  const list = Array.isArray(status) ? status : [status]
  return (
    <div className="status-row">
      {list.map((k) => (
        <Status key={k} kind={k} />
      ))}
    </div>
  )
}

/** A narrative beat: optional status chips, then a short passage (≤ 45 words). */
export function Beat({
  status,
  kicker,
  children,
  size = 'lead',
}: {
  status?: StatusKind | StatusKind[]
  kicker?: ReactNode
  children: ReactNode
  size?: 'lead' | 'display'
}) {
  return (
    <div className={`beat beat--${size}`}>
      {(status || kicker) && (
        <div className="beat__meta">
          {kicker && <span className="t-label beat__kicker">{kicker}</span>}
          {status && <StatusRow status={status} />}
        </div>
      )}
      <div className={size === 'display' ? 'beat__display' : 't-lead beat__text'}>{children}</div>
    </div>
  )
}

/** A quiet caption line under a beat (mono, small), e.g. units, "not to scale". */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="caption t-mono">{children}</p>
}
