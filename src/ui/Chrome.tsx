import { useEffect, useRef, useState } from 'react'
import type { ChapterMeta } from '../core/chapter'
import { getHandle } from '../core/chapter'
import { onFirstSound, unlockAudio, tick } from '../core/audio'
import { journey, onJourney, useJourney } from '../core/journey'
import { orderOf, superscript } from '../core/math'
import { scrollToChapter } from '../core/scroller'
import { useSettings } from '../core/settings'
import { glossaryList } from '../core/glossary'
import { Drawer } from './Drawer'
import { StatusLegend } from './Status'

/* ───────────────────────── Top bar ───────────────────────── */

export function TopBar({ chapters }: { chapters: ChapterMeta[] }) {
  const sound = useSettings((s) => s.sound)
  const deeper = useSettings((s) => s.deeper)
  const setSound = useSettings((s) => s.setSound)
  const setDeeper = useSettings((s) => s.setDeeper)
  const setGlossary = useSettings((s) => s.setGlossaryOpen)
  const setMenu = useSettings((s) => s.setMenuOpen)
  const active = useJourney((s) => s.active)
  const bar = useRef<HTMLDivElement>(null)
  // brief ANALOGY note when sound is first heard or switched on: every sound on the site is a sonification
  const [soundNote, setSoundNote] = useState(false)
  useEffect(() => onFirstSound(() => setSoundNote(true)), [])

  useEffect(
    () =>
      onJourney(() => {
        bar.current?.style.setProperty('--g', journey.global.toFixed(4))
      }),
    [],
  )
  useEffect(() => {
    if (!sound) {
      setSoundNote(false)
      return
    }
    const t = window.setTimeout(() => setSoundNote(false), 6500)
    return () => window.clearTimeout(t)
  }, [sound, soundNote])

  const cur = chapters[active]
  return (
    <header className="topbar" data-ui>
      <div ref={bar} className="topbar__progress" aria-hidden="true" />
      <button type="button" className="topbar__mark" onClick={() => scrollToChapter(chapters[0].id)} aria-label="Back to the beginning">
        <span className="topbar__mark-name">The String Hypothesis</span>
      </button>
      <button type="button" className="topbar__where t-label" onClick={() => setMenu(true)} aria-label="Open chapter list">
        <span className="topbar__where-num">{String(cur?.index ?? 0).padStart(2, '0')}</span>
        <span className="topbar__where-title">{cur?.title}</span>
        <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="1.1" />
        </svg>
      </button>
      <nav className="topbar__tools" aria-label="Settings">
        <button
          type="button"
          className={`tool${deeper ? ' is-on' : ''}`}
          aria-pressed={deeper}
          onClick={() => setDeeper(!deeper)}
          title="Show equations and technical asides throughout"
        >
          <span className="tool__glyph" aria-hidden="true">
            ∂
          </span>
          <span className="tool__label">Deeper physics</span>
        </button>
        <button
          type="button"
          className={`tool${sound ? ' is-on' : ''}`}
          aria-pressed={sound}
          onClick={() => {
            const v = !sound
            setSound(v)
            setSoundNote(v)
            if (v) {
              unlockAudio()
              tick(523)
            }
          }}
          title="Sonification: strings would make no sound"
        >
          <SoundGlyph on={sound} />
          <span className="tool__label">{sound ? 'Sound on · sonification' : 'Sound off'}</span>
        </button>
        <button type="button" className="tool" onClick={() => setGlossary(true)} title="Glossary of terms">
          <span className="tool__glyph tool__glyph--serif" aria-hidden="true">
            Aa
          </span>
          <span className="tool__label">Glossary</span>
        </button>
      </nav>
      <p className="sound-note" role="status" data-show={soundNote ? '1' : '0'}>
        {soundNote && (
          <>
            <span className="sound-note__chip t-label">
              <span aria-hidden="true">≈</span> Analogy
            </span>
            <span>Sonification: strings would make no sound. You hear the pattern, not a pitch.</span>
          </>
        )}
      </p>
    </header>
  )
}

function SoundGlyph({ on }: { on: boolean }) {
  return (
    <svg className="tool__svg" viewBox="0 0 24 12" width="22" height="11" aria-hidden="true">
      {on ? (
        <path d="M1 6 Q4 0 7 6 T13 6 T19 6 T23 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      ) : (
        <path d="M1 6 H23" fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  )
}

/* ───────────────────────── Chapter rail ───────────────────────── */

export function ChapterRail({ chapters }: { chapters: ChapterMeta[] }) {
  const active = useJourney((s) => s.active)
  const fill = useRef<HTMLDivElement>(null)
  useEffect(
    () =>
      onJourney(() => {
        fill.current?.style.setProperty('--g', journey.global.toFixed(4))
      }),
    [],
  )
  return (
    <nav className="rail" aria-label="Chapters" data-ui>
      <div className="rail__line" aria-hidden="true">
        <div ref={fill} className="rail__fill" />
      </div>
      <ol className="rail__list">
        {chapters.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`rail__item${c.index === active ? ' is-active' : ''}${c.index < active ? ' is-past' : ''}`}
              onClick={() => scrollToChapter(c.id)}
              aria-current={c.index === active ? 'step' : undefined}
            >
              <span className="rail__label t-label">
                <span className="rail__num">{String(c.index).padStart(2, '0')}</span> {c.title}
              </span>
              <span className="rail__tick" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ───────────────────────── Scale gauge ───────────────────────── */

const GAUGE_MAX = 27 // 10^27 m (observable universe ~ 8.8e26 m)
const GAUGE_MIN = -36 // below the Planck length
const MARKS = [
  { e: 26, label: 'universe' },
  { e: 0, label: 'you' },
  { e: -10, label: 'atom' },
  { e: -15, label: 'proton' },
  { e: -35, label: 'Planck' },
]
/** Landmark labels closer than this (decades) to the reading step aside so the readout never sits on them. */
const MARK_NEAR = 1.5
/**
 * Default status rule (a chapter can override it with meta.scaleStatus): below ~10⁻³² m the site only ever
 * shows the hypothetical string scale or lengths derived from it, so the reading is flagged HYPOTHETICAL.
 */
const HYPOTHETICAL_BELOW = -31.8
/** The site-wide fiducial string length (log₁₀ m): ~10⁻³⁴ m "if traditional estimates hold" (content/00-arc.md). */
const STRING_FIDUCIAL = -34
const STRING_NOTE = 'ℓs unknown · ~10⁻³⁴ m if traditional estimates hold'

/**
 * Gauge reading. One significant figure in scientific form (so it agrees with the chapter's own labels,
 * e.g. 4 × 10³ m, 5 × 10⁻⁵ m); plain decimals between 1 mm and 1 km; only the order of magnitude for a
 * hypothetical length, whose mantissa would be spurious.
 */
function formatScale(scale: number, e: number, hypothetical: boolean): string {
  if (hypothetical) return `~${orderOf(scale)}`
  if (Math.abs(e) < 3) return `${String(Number(scale.toPrecision(2)))} m`
  let x = Math.floor(e)
  let m = Math.round(scale / 10 ** x)
  if (m >= 10) {
    m = 1
    x++
  }
  return `≈ ${m === 1 ? '' : m + ' × '}10${superscript(x)} m`
}

export function ScaleGauge({ chapters }: { chapters: ChapterMeta[] }) {
  const root = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const marks = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    let raf = 0
    let last = ''
    let lastHyp = ''
    let lastNear = -1
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = root.current
      if (!el) return
      const meta = chapters[journey.active]
      const h = meta ? getHandle(meta.id, meta.index) : null
      const scale = meta?.scale && h ? meta.scale(h) : null
      if (scale == null || !(scale > 0)) {
        if (last !== 'none') {
          el.dataset.on = '0'
          last = 'none'
        }
        return
      }
      const e = Math.log10(scale)
      const pos = (GAUGE_MAX - e) / (GAUGE_MAX - GAUGE_MIN)
      el.dataset.on = '1'
      el.style.setProperty('--pos', Math.min(1, Math.max(0, pos)).toFixed(4))
      const status = meta!.scaleStatus ? meta!.scaleStatus(h!, scale) : e < HYPOTHETICAL_BELOW ? 'speculative' : null
      const hyp = status === 'speculative'
      // 'f' = hypothetical at the string fiducial (adds the ℓs line), 'h' = hypothetical, '' = plain
      const hypKey = hyp ? (Math.abs(e - STRING_FIDUCIAL) <= 0.5 ? 'f' : 'h') : ''
      if (hypKey !== lastHyp) {
        el.dataset.hyp = hypKey
        lastHyp = hypKey
      }
      const text = formatScale(scale, e, hyp)
      if (text !== last && readout.current) {
        readout.current.textContent = text
        last = text
      }
      // bit mask of landmark labels that sit within MARK_NEAR decades of the reading
      let near = 0
      for (let i = 0; i < MARKS.length; i++) if (Math.abs(MARKS[i].e - e) < MARK_NEAR) near |= 1 << i
      if (near !== lastNear) {
        for (let i = 0; i < MARKS.length; i++) marks.current[i]?.toggleAttribute('data-near', (near & (1 << i)) !== 0)
        lastNear = near
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [chapters])

  return (
    <div ref={root} className="gauge" aria-hidden="true" data-on="0">
      <div className="gauge__axis">
        {Array.from({ length: GAUGE_MAX - GAUGE_MIN + 1 }, (_, i) => GAUGE_MAX - i).map((e) => (
          <span key={e} className={`gauge__tick${e % 5 === 0 ? ' is-major' : ''}`} style={{ ['--tp' as string]: (GAUGE_MAX - e) / (GAUGE_MAX - GAUGE_MIN) }} />
        ))}
        {MARKS.map((m, i) => (
          <span
            key={m.e}
            ref={(n) => {
              marks.current[i] = n
            }}
            className="gauge__mark"
            style={{ ['--tp' as string]: (GAUGE_MAX - m.e) / (GAUGE_MAX - GAUGE_MIN) }}
          >
            {m.label}
          </span>
        ))}
        <span className="gauge__marker">
          <span className="gauge__diamond" />
          <span className="gauge__read">
            <span ref={readout} className="gauge__readout t-mono" />
            <span className="gauge__flag">Hypothetical</span>
            <span className="gauge__note">{STRING_NOTE}</span>
          </span>
        </span>
      </div>
      <span className="gauge__title t-label">Scale</span>
    </div>
  )
}

/* ───────────────────────── Chapter menu (all widths) ───────────────────────── */

export function ChapterMenu({ chapters }: { chapters: ChapterMeta[] }) {
  const open = useSettings((s) => s.menuOpen)
  const setOpen = useSettings((s) => s.setMenuOpen)
  const active = useJourney((s) => s.active)
  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="The journey" eyebrow="Chapters">
      <ol className="menu-list">
        {chapters.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`menu-item${c.index === active ? ' is-active' : ''}`}
              onClick={() => {
                setOpen(false)
                window.setTimeout(() => scrollToChapter(c.id), 60)
              }}
            >
              <span className="t-label menu-item__num">{String(c.index).padStart(2, '0')}</span>
              <span className="menu-item__title">{c.title}</span>
              <span className="menu-item__q">{c.question}</span>
            </button>
          </li>
        ))}
      </ol>
      <h3>How to read the labels</h3>
      <StatusLegend />
    </Drawer>
  )
}

/* ───────────────────────── Glossary ───────────────────────── */

export function GlossaryDrawer({ chapters }: { chapters: ChapterMeta[] }) {
  const open = useSettings((s) => s.glossaryOpen)
  const setOpen = useSettings((s) => s.setGlossaryOpen)
  const [q, setQ] = useState('')
  const list = glossaryList().filter((e) => !q || (e.term + ' ' + e.def).toLowerCase().includes(q.toLowerCase()))
  const titleOf = (id?: string) => chapters.find((c) => c.id === id)
  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Glossary" eyebrow="Terms">
      <label className="glossary-search">
        <span className="sr-only">Search terms</span>
        <input id="glossary-search" type="search" placeholder="Search terms" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <dl className="glossary">
        {list.map((e) => {
          const ch = titleOf(e.chapter)
          return (
            <div key={e.id} className="glossary__row">
              <dt>{e.term}</dt>
              <dd>
                {e.def}
                {ch && (
                  <button
                    type="button"
                    className="glossary__link t-label"
                    onClick={() => {
                      setOpen(false)
                      window.setTimeout(() => scrollToChapter(ch.id), 60)
                    }}
                  >
                    {String(ch.index).padStart(2, '0')} {ch.title} →
                  </button>
                )}
              </dd>
            </div>
          )
        })}
        {list.length === 0 && <p className="t-body">No terms match “{q}”.</p>}
      </dl>
    </Drawer>
  )
}
