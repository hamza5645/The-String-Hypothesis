import { useEffect, useRef, useState } from 'react'
import type { ChapterMeta } from '../core/chapter'
import { getHandle } from '../core/chapter'
import { unlockAudio, tick } from '../core/audio'
import { journey, onJourney, useJourney } from '../core/journey'
import { orderOf, sci } from '../core/math'
import { scrollToChapter, scrollToY } from '../core/scroller'
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

  useEffect(
    () =>
      onJourney(() => {
        bar.current?.style.setProperty('--g', journey.global.toFixed(4))
      }),
    [],
  )

  const cur = chapters[active]
  return (
    <header className="topbar" data-ui>
      <div ref={bar} className="topbar__progress" aria-hidden="true" />
      <button type="button" className="topbar__mark" onClick={() => scrollToY(0)} aria-label="Back to the beginning">
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
            if (v) {
              unlockAudio()
              tick(523)
            }
          }}
          title="Hear string vibrations (off by default)"
        >
          <SoundGlyph on={sound} />
          <span className="tool__label">{sound ? 'Sound on' : 'Sound off'}</span>
        </button>
        <button type="button" className="tool" onClick={() => setGlossary(true)} title="Glossary of terms">
          <span className="tool__glyph tool__glyph--serif" aria-hidden="true">
            Aa
          </span>
          <span className="tool__label">Glossary</span>
        </button>
      </nav>
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

export function ScaleGauge({ chapters }: { chapters: ChapterMeta[] }) {
  const root = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    let last = ''
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = root.current
      if (!el) return
      const meta = chapters[journey.active]
      const scale = meta?.scale ? meta.scale(getHandle(meta.id, meta.index)) : null
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
      const text = Math.abs(e) < 3 ? sci(scale, 2, 'm') : `≈ ${orderOf(scale)}`
      if (text !== last && readout.current) {
        readout.current.textContent = text
        last = text
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
        {MARKS.map((m) => (
          <span key={m.e} className="gauge__mark" style={{ ['--tp' as string]: (GAUGE_MAX - m.e) / (GAUGE_MAX - GAUGE_MIN) }}>
            {m.label}
          </span>
        ))}
        <span className="gauge__marker">
          <span className="gauge__diamond" />
          <span ref={readout} className="gauge__readout t-mono" />
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
