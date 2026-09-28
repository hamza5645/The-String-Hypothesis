import { createContext, Suspense, useContext, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ChapterContext, getHandle, useChapter, type ChapterMeta } from '../core/chapter'
import { bindChapterEl, bindStep } from '../core/journey'
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
    <section ref={ref} id={meta.id} className="chapter" data-chapter={meta.id} aria-label={`${meta.title}. ${meta.question}`}>
      {!webgl && Fallback && (
        <div className="chapter-fallback" aria-hidden="true">
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
 */
export function Step({
  id,
  length = 1,
  align = 'left',
  valign = 'center',
  fade = true,
  className,
  children,
}: {
  id: string
  length?: number
  align?: StepAlign
  valign?: 'center' | 'top' | 'bottom' | 'lower'
  fade?: boolean
  className?: string
  children?: ReactNode
}) {
  const h = useChapter()
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => bindStep(h.id, id, ref.current!, fade), [h.id, id, fade])
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
    <Step id="title" length={length} align={align} valign={valign} className="step--title">
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
