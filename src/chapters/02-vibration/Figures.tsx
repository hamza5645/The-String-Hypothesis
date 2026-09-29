import { useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useChapterFrame } from '@/gl'
import { range, smoothstep as ss, window01 } from '@/core/math'
import { renderTexInto } from '@/ui/katex'
import { CATALOGUE, D, fmtCount, MODES, PARTICLES, sup, type Particle } from './model'
import { Fig, h, Layer, Projector, s } from './dom'
import { rungY, type Rect, type Shared } from './shared'
import { useVib } from './store'
import { BEADS2, BEADS2_REPLAY, TENT_C } from './Director'
import { pullbackU, pullDecades } from './timeline'

/*
 * The chapter's figure layer: every annotation and screen-space diagram (ladder, spectrum,
 * log strip, catalogue cards, the particle table). Plain DOM in the aria-hidden #scene-labels
 * layer; positions come from projecting the 3D scene, so labels stay pinned to what they name.
 */

const W1 = [1, TENT_C[1] / TENT_C[0], TENT_C[2] / TENT_C[0], TENT_C[3] / TENT_C[0]]
const SUBS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
const kSub = (n: number) => `k${SUBS[n] ?? n}`

function status(kind: string, label: string) {
  return h(
    'span',
    { class: `status status--${kind} status--compact` },
    h('i', { class: 'status__mark', 'aria-hidden': 'true' }),
    h('span', { class: 'status__label' }, label),
  )
}
function sym(p: Particle) {
  return h('span', { class: 'vib-sym' }, p.sym, p.sub ? h('sub', null, p.sub) : null)
}

/** Height (px) of rung N: equally spaced in M², or ∝ √(8N) on the M axis (rung 8 coincides). */
const rungH = (axisM: boolean, sp: number, N: number) => (axisM ? sp * Math.sqrt(8 * N) : sp * N)

/** The mass ladder: rungs equally spaced in M² (or in M), N on the left, M on the right, tags beyond. */
class Ladder {
  root: Fig
  rows: {
    el: HTMLElement
    fig: Fig
    n: Fig
    m: Fig
    tag: Fig
    line: HTMLElement
  }[] = []
  brk: Fig
  marker: Fig
  hN: Fig
  hM: Fig
  private w = -1
  constructor(L: Layer) {
    this.root = L.add(h('div', { class: 'vib-fig vib-ladder' }))
    this.hN = L.add(h('span', { class: 'vib-ladder__h vib-ladder__hn' }, 'N'), this.root.el)
    this.hM = L.add(h('span', { class: 'vib-ladder__h vib-ladder__hm' }, 'M = √N · Mₛ'), this.root.el)
    for (let i = 0; i < 24; i++) {
      const n = h('span', { class: 'vib-rung__n' })
      const line = h('span', { class: 'vib-rung__line' })
      const m = h('span', { class: 'vib-rung__m' })
      const tag = h('span', { class: 'vib-rung__tag' })
      const el = h('div', { class: 'vib-rung' }, n, line, m, tag)
      const fig = L.add(el, this.root.el)
      this.rows.push({
        el,
        fig,
        n: new Fig(n, false),
        m: new Fig(m, false),
        tag: new Fig(tag),
        line,
      })
    }
    this.brk = L.add(h('span', { class: 'vib-rung__brk' }, '//'), this.root.el)
    this.marker = L.add(h('span', { class: 'vib-ladder__marker' }), this.root.el, -50, -50)
  }
  width(w: number) {
    if (Math.abs(w - this.w) < 0.5) return
    this.w = w
    this.root.el.style.setProperty('--w', `${w.toFixed(1)}px`)
  }
  private txt = -1
  /** Opacity of the ladder's numbers (the hairlines stay). */
  text(v: number) {
    const q = Math.round(v * 100) / 100
    if (q === this.txt) return
    this.txt = q
    this.root.el.style.setProperty('--txt', String(q))
  }
}

const COUNT_TAGS: Record<number, string> = {
  0: '+15 MORE STATES',
  1: '+255 MORE',
  2: '+2 302 MORE',
  4: '+84 223 MORE',
}
const R0_TAG = '16 = ONE OPEN STRING IN FLAT 10D\nBRANES + HIDDEN DIMS MULTIPLY THIS'

/** Log strip of m/Mₛ from 10⁻²⁸ to 10⁻¹⁵ (assumes Mₛ = 10¹⁸ GeV). */
class Strip {
  root: Fig
  box: Fig
  zero: HTMLElement
  ticks: HTMLElement[] = []
  note: Fig
  far: Fig
  private w = -1
  constructor(L: Layer) {
    this.root = L.add(h('div', { class: 'vib-fig vib-strip' }))
    const r = this.root.el
    r.appendChild(h('span', { class: 'vib-strip__axis' }))
    for (let e = -28; e <= -15; e++) {
      const lab = e % 3 === 0 ? h('span', { class: 'vib-strip__tl' }, `10${sup(e)}`) : null
      const t = h('span', { class: `vib-strip__tick${lab ? ' is-major' : ''}` }, lab)
      this.ticks.push(t)
      r.appendChild(t)
    }
    this.zero = h('span', { class: 'vib-strip__zero' }, h('span', { class: 'vib-strip__tl' }, '0'), h('span', { class: 'vib-strip__zb' }, '//'))
    r.appendChild(this.zero)
    r.appendChild(h('span', { class: 'vib-strip__unit' }, 'm / Mₛ'))
    this.note = L.add(h('span', { class: 'vib-strip__note' }, 'ASSUMES Mₛ = 10¹⁸ GeV · UNKNOWN'), r)
    this.far = L.add(h('span', { class: 'vib-strip__far' }, h('b', null, '//'), ' RUNG 1 ≈ 6×10¹⁵ × TOP-QUARK MASS'), r)
    this.box = L.add(h('div', { class: 'vib-fig vib-zoombox' }))
  }
  width(w: number) {
    if (Math.abs(w - this.w) < 0.5) return
    this.w = w
    this.root.el.style.setProperty('--w', `${w.toFixed(1)}px`)
    for (let i = 0; i < this.ticks.length; i++) this.ticks[i].style.left = `${((i / 13) * w).toFixed(1)}px`
  }
  /** x (px, relative) of a mass ratio; 0 → the separate zero tick. */
  static x(ratio: number, w: number) {
    if (ratio <= 0) return -34
    return ((Math.log10(ratio) + 28) / 13) * w
  }
}

/** Frequency axis with spikes at n × 110 Hz. */
class Spectrum {
  root: Fig
  spikes: HTMLElement[] = []
  ticks: HTMLElement[] = []
  maxLbl: HTMLElement
  private fmax = -1
  private hs = new Float64Array(6).fill(-1)
  constructor(L: Layer) {
    this.root = L.add(h('div', { class: 'vib-fig vib-spec' }))
    const r = this.root.el
    r.appendChild(h('span', { class: 'vib-spec__axis' }))
    for (let n = 1; n <= 6; n++) {
      const t = h('span', { class: 'vib-spec__tick' }, h('span', null, String(110 * n)))
      this.ticks.push(t)
      r.appendChild(t)
      const sp = h('span', { class: 'vib-spec__spike' })
      this.spikes.push(sp)
      r.appendChild(sp)
    }
    r.appendChild(h('span', { class: 'vib-spec__zero' }, '0'))
    this.maxLbl = h('span', { class: 'vib-spec__unit' }, 'f · Hz')
    r.appendChild(this.maxLbl)
  }
  set(fmax: number, heights: ArrayLike<number>, hot: number) {
    if (fmax !== this.fmax) {
      this.fmax = fmax
      for (let n = 1; n <= 6; n++) {
        const x = ((110 * n) / fmax) * 100
        const vis = 110 * n < fmax
        this.ticks[n - 1].style.left = `${x}%`
        this.ticks[n - 1].style.display = vis ? '' : 'none'
        this.spikes[n - 1].style.left = `${x}%`
        this.spikes[n - 1].style.display = vis ? '' : 'none'
      }
    }
    for (let n = 0; n < 6; n++) {
      const v = Math.max(0, Math.min(1, heights[n]))
      if (Math.abs(v - this.hs[n]) > 0.004) {
        this.hs[n] = v
        this.spikes[n].style.transform = `scaleY(${v.toFixed(3)})`
      }
      this.spikes[n].classList.toggle('is-hot', n + 1 === hot)
    }
  }
}

class FigureSet {
  L = new Layer('vib-figs')
  P = new Projector()
  rings: Fig[] = []
  modeLbl: Fig
  freeNote: Fig
  jitterNote: Fig
  spec: Spectrum
  cursor: Fig
  ghostLbl: Fig[] = []
  levelLbl: Fig
  eq: Fig
  eqN: HTMLElement | null = null
  aside: Fig
  lad: Ladder
  compUp: Fig
  compIn: Fig
  spinLbl: Fig
  higgsTag: Fig
  inset: Fig
  rod: SVGLineElement
  rodDot: SVGCircleElement
  foot3: Fig
  pbRead: Fig
  cardC: Fig
  cards: Fig[] = []
  cardState: Fig[] = []
  catNote: Fig
  sameLbl: Fig
  rainCap: Fig
  r0a: Fig
  r0b: Fig
  strip: Strip
  eAxis: Fig
  lhc: Fig
  rung1: Fig
  chip1: Fig
  chip2: Fig
  sm: Fig
  smCells: { fig: Fig; val: Fig; pred: Fig }[] = []
  smHead: Fig
  smSub: Fig
  smLegend: Fig
  smCols: Fig
  farCard: Fig
  farMass: Fig
  halfNote: Fig
  grav: Fig
  graphCap: Fig
  jitCap: Fig
  guitarCap: Fig
  stageMsg: Fig
  labSpecCap: Fig
  ringRow = new Int8Array(PARTICLES.length)
  ringX = new Float64Array(PARTICLES.length)
  private stripW = -1
  private eqLevel = -1

  constructor() {
    const L = this.L
    // the seventeen measured particles, drawn as hairline rings
    for (const p of PARTICLES) {
      const el = h(
        'span',
        {
          class: `vib-fig vib-pring${p.upper ? ' is-upper' : ''}${p.ratio === 0 ? ' is-zero' : ''}`,
        },
        sym(p),
      )
      this.rings.push(L.add(el, null, -50, -50))
    }
    this.modeLbl = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--ink' }), null, -100, -100)
    this.freeNote = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--field' }, 'FREE END · CLASSICALLY IT MOVES AT LIGHT SPEED'), null, -100, 0)
    this.jitterNote = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--dim' }, '≈ QUANTUM JITTER, DRAWN SMALL · NEVER PERFECTLY STILL'), null, -50, 0)
    this.spec = new Spectrum(L)
    this.cursor = L.add(
      h('span', { class: 'vib-fig vib-cursor' }, h('span', { class: 'vib-cursor__ring' }), h('span', { class: 'vib-cursor__stem' })),
      null,
      -50,
      -50,
    )
    for (let k = 0; k < 4; k++) this.ghostLbl.push(L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--dim' }, `n = ${k + 1}`), null, -100, -50))
    this.levelLbl = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--ink vib-lbl--lg' }))
    const eqInner = h('div', { class: 'vib-eq__tex' })
    this.eq = L.add(h('div', { class: 'vib-fig vib-eq eq' }, eqInner, h('span', { class: 'vib-eq__cap' }, 'MASS² RISES IN EQUAL STEPS OF 1/α′')), null, -50, 0)
    renderTexInto(eqInner, "M^2 = \\dfrac{\\htmlClass{term-N}{N}}{\\alpha'}", false)
    this.eqN = eqInner.querySelector('.term-N')
    this.aside = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--dim' }, 'VIBRATION ENERGY = REST ENERGY = M c²'), null, -50, 0)
    this.lad = new Ladder(L)
    this.compUp = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--field vib-lbl--xs' }, 'UP'), null, -50, -100)
    this.compIn = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--field vib-lbl--xs' }, 'IN'), null, 0, -50)
    this.spinLbl = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--ink' }), null, -50, 0)
    this.higgsTag = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--field vib-lbl--xs' }, 'INTO A HIDDEN DIMENSION · IN SOME MODELS'), null, -50, 0)
    // real-space inset (y–z only)
    this.rod = s<SVGLineElement>('line', {
      class: 'vib-inset__rod',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    })
    this.rodDot = s<SVGCircleElement>('circle', {
      class: 'vib-inset__dot',
      cx: 0,
      cy: 0,
      r: 1.6,
    })
    const svg = s(
      'svg',
      { viewBox: '-50 -50 100 100', class: 'vib-inset__svg' },
      s('line', { class: 'vib-inset__ax', x1: -44, y1: 0, x2: 44, y2: 0 }),
      s('line', { class: 'vib-inset__ax', x1: 0, y1: -44, x2: 0, y2: 44 }),
      this.rod,
      this.rodDot,
    )
    this.inset = L.add(
      h(
        'div',
        { class: 'vib-fig vib-inset' },
        svg,
        h('span', { class: 'vib-inset__cap' }, 'REAL SPACE · y–z ONLY'),
        h('span', { class: 'vib-inset__ay' }, 'y'),
        h('span', { class: 'vib-inset__az' }, 'z'),
      ),
    )
    this.foot3 = L.add(
      h(
        'div',
        { class: 'vib-fig vib-foot' },
        status('derived', 'Derived'),
        h('span', null, 'SPIN-½ STATES (ELECTRONS, QUARKS) COME FROM THE STRING’S FERMIONIC SIDE: NO WIGGLE PICTURE.'),
      ),
    )
    // Beat 4
    this.pbRead = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--dim' }), null, -50, 0)
    this.cardC = L.add(
      h(
        'div',
        { class: 'vib-fig vib-card vib-card--wide' },
        h('span', { class: 'vib-card__k' }, 'MASS 1.41 Mₛ · SPIN ≤ 3ħ · CHARGE —'),
        h('span', { class: 'vib-card__s' }, 'SEEN FROM FAR AWAY'),
      ),
      null,
      0,
      -50,
    )
    const stateTxt = ['BOTTOM RUNG · JITTER ONLY', `${kSub(1)} = 1`, `${kSub(1)} = 2`, `${kSub(2)} = 1`, `${kSub(1)} = 1 · ${kSub(3)} = 1`]
    CATALOGUE.forEach((c, i) => {
      const st = h('span', { class: 'vib-card__s' }, stateTxt[i])
      const full = c.card.replace(' · ', '\n')
      const short = c.card.replace('MASS ', '').replace(' · SPIN ', '\n')
      this.cards.push(
        L.add(
          h(
            'div',
            { class: 'vib-fig vib-card' },
            h('span', { class: 'vib-card__key' }, c.key),
            h('span', { class: 'vib-card__k vib-card__k--full' }, full),
            h('span', { class: 'vib-card__k vib-card__k--short' }, short),
            st,
          ),
          null,
          -50,
          0,
        ),
      )
      this.cardState.push(new Fig(st))
    })
    this.catNote = L.add(
      h('span', { class: 'vib-fig vib-lbl vib-lbl--dim vib-catnote' }, h('span', { class: 'vib-m-only' }, 'CARDS: MASS · SPIN · '), '≈ CATALOGUE LAYOUT, NOT POSITIONS'),
      null,
      -50,
      0,
    )
    this.sameLbl = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--ink' }, 'SAME STRING'), null, -50, -100)
    // Beat 5
    this.rainCap = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--ink' }, 'EVERY ELEMENTARY PARTICLE EVER MEASURED'), null, 0, 0)
    this.r0a = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--field' }, '16 = ONE OPEN STRING IN FLAT 10D'), null, 0, 0)
    this.r0b = L.add(h('span', { class: 'vib-fig vib-lbl vib-lbl--field' }, 'BRANES + HIDDEN DIMENSIONS MULTIPLY THIS'), null, 0, 0)
    this.strip = new Strip(L)
    this.eAxis = L.add(h('div', { class: 'vib-fig vib-eaxis' }, h('span', { class: 'vib-eaxis__t' }, 'ENERGY ↑')))
    this.lhc = L.add(
      h(
        'div',
        { class: 'vib-fig vib-lhc' },
        h('span', { class: 'vib-lhc__t' }, 'LHC 1.36×10⁴ GeV', h('span', { class: 'vib-lhc__br' })),
        h('span', { class: 'vib-lhc__s' }, 'SQUEEZED AGAINST RUNG 0', h('span', { class: 'vib-d-only' }, ' · Mₛ ≈ 7×10¹³ × LHC (ASSUMED)')),
      ),
      null,
      -100,
      0,
    )
    this.rung1 = L.add(
      h(
        'div',
        { class: 'vib-fig vib-foot vib-foot--sm' },
        status('speculative', 'Speculative'),
        h('span', null, 'IN GeV: UNKNOWN · TRADITIONAL ESTIMATES ~10¹⁸ · LHC: > 7.9 TeV IN SIMPLEST LOW-SCALE MODELS'),
      ),
      null,
      0,
      -100,
    )
    // Beat 6
    this.chip1 = L.add(h('div', { class: 'vib-fig vib-chip6' }, h('b', null, 'CHARGE ←'), ' MOTION / WRAPPING AROUND A HIDDEN CIRCLE (CH. 5, 8)'), null, -50, 0)
    this.chip2 = L.add(h('div', { class: 'vib-fig vib-chip6' }, h('b', null, 'CHARGE ←'), ' WHERE THE ENDS ATTACH (CH. 7)'), null, -50, 0)
    this.sm = L.add(h('div', { class: 'vib-fig vib-sm' }))
    const smEl = this.sm.el
    this.smHead = L.add(h('div', { class: 'vib-sm__head' }, status('derived', 'Derived'), h('span', null, 'SOME CONSTRUCTIONS REPRODUCE THIS PATTERN')), smEl)
    this.smSub = L.add(h('div', { class: 'vib-sm__sub' }, '>200 HETEROTIC MODELS (2011) · ~10¹⁵ F-THEORY MODELS (2019)'), smEl)
    this.smCols = L.add(
      h(
        'div',
        { class: 'vib-sm__cols' },
        h('span', null, 'I'),
        h('span', null, 'II'),
        h('span', null, 'III'),
        h('span', null, 'FORCES'),
        h('span', null, 'HIGGS'),
      ),
      smEl,
    )
    for (const p of PARTICLES) {
      const paren = / \(.*\)$/.exec(p.mass)?.[0] ?? ''
      const val = h(
        'span',
        { class: 'vib-sm__val' },
        h('i', { class: 'vib-dot vib-dot--solid' }),
        p.mass.slice(0, p.mass.length - paren.length),
        paren ? h('span', { class: 'vib-d-only' }, paren) : null,
      )
      const pred = h('span', { class: 'vib-sm__pred' }, h('i', { class: 'vib-dot vib-dot--ring' }), '—')
      const mark = p.id === 'H' ? 'wrap' : p.slot[0] === 3 ? 'same' : 'attach'
      const icon = s(
        'svg',
        {
          class: `vib-sm__icon vib-sm__icon--${mark}`,
          viewBox: '0 0 44 16',
          'aria-hidden': 'true',
        },
        s('path', {
          class: 'vib-sm__thread',
          d: 'M5 8 C 11 2, 16 14, 22 8 S 33 2, 39 8',
        }),
        mark === 'wrap'
          ? s('ellipse', {
              class: 'vib-sm__mark',
              cx: 22,
              cy: 8,
              rx: 5,
              ry: 6.5,
            })
          : s(
              'g',
              { class: 'vib-sm__mark' },
              s('line', { x1: 4, y1: 2, x2: 4, y2: 14 }),
              s('line', {
                x1: 40,
                y1: mark === 'same' ? 2 : 4,
                x2: 40,
                y2: mark === 'same' ? 14 : 12,
              }),
            ),
      )
      const cell = h('div', { class: 'vib-sm__cell' }, icon, val, pred)
      const fig = L.add(cell, smEl)
      this.smCells.push({ fig, val: new Fig(val), pred: new Fig(pred) })
    }
    this.smLegend = L.add(
      h(
        'div',
        { class: 'vib-sm__legend' },
        h('span', null, h('i', { class: 'vib-dot vib-dot--solid' }), 'MEASURED MASS (PDG 2026)'),
        h('span', null, h('i', { class: 'vib-dot vib-dot--ring' }), 'STRING-THEORY PREDICTION'),
        h('span', { class: 'vib-sm__an' }, '≈ SAME THREAD IN EVERY CELL · MARKS ILLUSTRATIVE'),
        h('span', { class: 'vib-sm__fn' }, '* QUARK MASSES SCHEME-DEPENDENT (MS-BAR) · † KATRIN 2025 UPPER BOUND; OSCILLATIONS PROVE ν MASS'),
      ),
      smEl,
    )
    // lab
    this.farMass = new Fig(h('span', { class: 'vib-card__k' }), false)
    this.farCard = L.add(
      h(
        'div',
        { class: 'vib-fig vib-card vib-card--wide' },
        this.farMass.el,
        h('span', { class: 'vib-card__s' }, 'CHARGE NEEDS HIDDEN DIMENSIONS · NOT MODELLED HERE'),
      ),
      null,
      0,
      -50,
    )
    this.halfNote = L.add(
      h(
        'span',
        { class: 'vib-fig vib-lbl vib-lbl--ink vib-lbl--case vib-lbl--cap' },
        'Spin-½ states come from the string’s fermionic side. No wiggle picture exists.',
      ),
      null,
      0,
      0,
    )
    this.grav = L.add(
      h(
        'div',
        { class: 'vib-fig vib-grav' },
        s(
          'svg',
          { viewBox: '0 0 40 40', class: 'vib-grav__svg' },
          s('path', {
            d: 'M20 6 C 30 5, 35 13, 34 20 S 28 35, 20 34 S 5 28, 6 20 S 11 7, 20 6 Z',
          }),
        ),
        h('span', null, 'CLOSED STRING · CH. 4'),
      ),
      null,
      0,
      -50,
    )
    this.stageMsg = L.add(h('p', { class: 'vib-fig vib-stagemsg' }), null, -50, -100)
    this.graphCap = L.add(
      h(
        'span',
        { class: 'vib-fig vib-lbl vib-lbl--dim vib-lbl--case vib-lbl--cap' },
        '≈ Across: position along the string. Up/down and in/out: real directions it moves.',
      ),
      null,
      0,
      0,
    )
    this.jitCap = L.add(
      h(
        'span',
        { class: 'vib-fig vib-lbl vib-lbl--dim vib-lbl--case vib-lbl--cap' },
        '≈ Quantum jitter, drawn small. Even the bottom rung is never perfectly still.',
      ),
      null,
      0,
      0,
    )
    this.guitarCap = L.add(
      h(
        'div',
        { class: 'vib-fig vib-foot vib-foot--sm' },
        status('observed', 'Observed'),
        h('span', null, 'GUITAR: PINNED ENDS. A PLUCK HOLDS ~10²⁸ PACKETS, SO IT LOOKS SMOOTH. ADDS ONLY ~10⁻²⁰ kg.'),
      ),
      null,
      0,
      -100,
    )
    // two lines so it fits a phone: a guitar is quantized too, its packets are just too small to notice
    this.labSpecCap = L.add(
      h(
        'span',
        { class: 'vib-fig vib-lbl vib-lbl--dim vib-lbl--xs vib-lbl--lines' },
        h('span', null, 'CLASSICAL LIMIT · ~10²⁸ PACKETS,'),
        h('span', null, 'TOO SMALL TO SEE · DECAYS LIKE A REAL PLUCK'),
      ),
      null,
      0,
      0,
    )
  }

  /** Greedy row assignment so strip glyphs never overlap. */
  layoutStrip(w: number, size: number) {
    if (Math.abs(w - this.stripW) < 0.5) return
    this.stripW = w
    const order = PARTICLES.map((p, i) => ({ i, x: Strip.x(p.ratio, w) })).sort((a, b) => a.x - b.x)
    const lastX: number[] = []
    for (const o of order) {
      let r = 0
      while (lastX[r] !== undefined && o.x - lastX[r] < size + 3) r++
      lastX[r] = o.x
      this.ringRow[o.i] = r
      this.ringX[o.i] = o.x
    }
  }

  dispose() {
    this.L.dispose()
  }

  update(S: Shared) {
    const L = this.L
    L.presence(S.presence)
    if (S.presence <= 0) return
    const P = this.P
    const Lo = S.layout
    const B = S.B
    const m = Lo.mobile
    const w = Lo.w
    const hgt = Lo.vh // px layout: the visible height
    const lab = useVib.getState()
    const t = S.reduced ? 0.55 : S.t
    const sc = S.thScale
    const tx = S.thCx
    const ty = S.thCy
    const thL = S.thL
    const o1 = B - 1
    const a1 = B - 2
    const b2 = B - 3
    const c3 = B - 4
    const d4 = B - 5
    const e5 = B - 6
    const g6 = B - 7
    const ringSize = m ? 20 : 24

    // ───────── the seventeen rings ─────────
    const cx0 = P.p(tx, ty).x
    const cy0 = P.y
    const rx = m ? Lo.vw * 0.39 : 2.75 * S.ppu
    const ry = m ? hgt * 0.1 : 1.5 * S.ppu
    const ringOpen = 0.3 * ss(0.2, 0.7, o1) + (0.12 - 0.3) * ss(0.7, 1.0, o1)
    const ringA0 = B < 2.15 ? Math.max(0, ringOpen) * (1 - ss(2.0, 2.12, B)) : 0
    const inB5 = B >= 6 && B < 8
    const pile = 0.84
    const r0y = rungY(Lo.lad5, 0)
    const sw = Lo.strip5
    // the pile: every glyph rests ON the rung-0 line, in one row right of the massless point A
    // (neighbours overlap by at most ~30%; nothing ever rests above the line)
    const pileL = Lo.lad5.x + Lo.aOff + (m ? 16 : 24)
    const pileR = Lo.lad5.x + Lo.lad5.w - (m ? 8 : 12)
    const pitch = (pileR - pileL) / (PARTICLES.length - 1)
    const pileS = Math.min(pile, pitch / (0.72 * ringSize))
    this.layoutStrip(sw.w, ringSize * 0.84)
    const labStrip = B >= 7.9 && B < 9.05 && (lab.zoom0 || (!!lab.particle && lab.particle !== 'grav')) && lab.ends === 'free'
    for (let i = 0; i < PARTICLES.length; i++) {
      const R = this.rings[i]
      if (B < 2.15 && ringA0 > 0.003) {
        const th = (Math.PI * 2 * (i + 0.5)) / 17 + 0.035 * t + 0.1 * Math.sin(0.3 * t + i * 1.9)
        const wob = 1 + 0.06 * Math.sin(0.21 * t + i * 2.3)
        R.at(cx0 + rx * Math.cos(th) * wob, cy0 + ry * Math.sin(th) * wob).alpha(ringA0)
        R.el.classList.remove('is-sel')
      } else if (inB5) {
        // rain straight down onto rung 0 (they appear only in the last stretch of the fall)
        const slot = (i * 7) % PARTICLES.length // interleave, so the pile builds up across the rung
        const u = range(e5, 0.27 + 0.0095 * slot, 0.33 + 0.0095 * slot)
        const px = pileL + i * pitch
        const top = rungY(Lo.lad5, Lo.count5 - 1) - 30
        let x = px
        let y = top + (r0y - top) * u * u
        let a = ss(0.25, 0.75, u) * 0.95
        let scl = pileS
        // then out to the log strip (the gap)
        const v = ss(0.54 + 0.006 * i, 0.64 + 0.006 * i, e5)
        if (v > 0) {
          const qx = sw.x + this.ringX[i]
          const qy = sw.y - 14 - this.ringRow[i] * (ringSize * pile + 2)
          x += (qx - x) * v
          y += (qy - y) * v
          scl = pileS + (pile - pileS) * v
        }
        // Beat 6: gone while the lattice shows; then each glyph settles into its cell of the table
        if (B >= 6.93) {
          if (B < 7.1) a *= 1 - ss(6.93, 7.0, B)
          else {
            const p = PARTICLES[i]
            const row = p.slot[1] + p.slot[0] * 0.2
            const q = ss(0.38 + 0.015 * row, 0.46 + 0.015 * row, g6)
            x = Lo.sm.x + p.slot[0] * Lo.sm.w + ringSize * 0.5 + 7
            y = Lo.sm.y + p.slot[1] * Lo.sm.h + ringSize * 0.5 + 7 + (1 - q) * 10
            a = q * (1 - ss(0.85, 0.91, g6))
            scl = 1
          }
        }
        R.at(x, y, scl).alpha(a)
        R.el.classList.remove('is-sel')
      } else if (labStrip) {
        const st = Lo.stripLab
        this.layoutStrip(st.w, m ? ringSize * 0.84 : ringSize)
        const x = st.x + this.ringX[i]
        const y = st.y - 16 - this.ringRow[i] * (m ? ringSize * 0.84 + 2 : ringSize + 3)
        const sel = lab.particle === PARTICLES[i].id
        R.at(x, y, m ? 0.84 : 1).alpha(sel ? 1 : 0.7)
        R.el.classList.toggle('is-sel', sel)
      } else R.alpha(0)
    }
    // restore the Beat-5 strip layout if the lab changed it
    if (!labStrip) this.layoutStrip(sw.w, ringSize * 0.84)

    // ───────── Beat 1: harmonics, spectrum, pluck ─────────
    if (B >= 2 && B < 3.4) {
      const inB1 = B < 3
      const n = S.nodesN
      const txt = inB1 ? `n = ${n} · ${n} ARCH${n > 1 ? 'ES' : ''} · ${110 * n} Hz` : `FREE ENDS · n = ${n} · ${n} NODE${n > 1 ? 'S' : ''}`
      P.p(tx + (thL / 2) * sc, ty + (m ? -0.34 : 0.52))
      this.modeLbl
        .text(txt)
        .at(P.x, P.y + (m ? 14 : 0))
        .alpha(S.nodesOp)
    } else this.modeLbl.alpha(0)

    // spectrum: Beat 1 (and the lab's guitar mode)
    const specOn = (B >= 2.1 && B < 3.1) || (B >= 7.95 && B < 9.05 && lab.ends === 'pinned')
    if (specOn) {
      const hs = this.specH
      let hot = 0
      let fmax = 500
      let a: number
      let ax: number
      let ay: number
      if (B < 3.1) {
        const starts = [0.12, 0.245, 0.37, 0.495]
        const ends = [0.245, 0.37, 0.495, 0.62]
        const rescale = ss(0.71, 0.77, a1)
        for (let k = 0; k < 6; k++) {
          if (k >= 4) {
            hs[k] = 0
            continue
          }
          const cur = window01(a1, k === 0 ? 0.1 : starts[k], ends[k], 0.03)
          const past = a1 > starts[k] + 0.04 ? 0.4 : 0
          const base = Math.max(cur, past) * ss(starts[k] - 0.02, starts[k] + 0.04, a1)
          hs[k] = base + (W1[k] - base) * rescale
          if (cur > 0.5 && a1 < 0.62) hot = k + 1
        }
        a = ss(0.12, 0.2, a1) * (1 - ss(3.0, 3.07, B))
        P.p(tx + (thL / 2) * sc, ty)
        ax = m ? Lo.vw / 2 - 79 : P.x + 34
        ay = m ? hgt * 0.075 : P.y + 36
      } else {
        fmax = 720
        for (let k = 0; k < 6; k++) hs[k] = Math.min(1, Math.abs(S.amp[k]) / (0.1 * thL))
        a = (1 - ss(9.0, 9.05, B)) * (1 - S.pointW)
        P.p(tx - (thL / 2) * sc, ty)
        ax = m ? 24 : P.x
        ay = m ? Lo.vh * 0.36 : P.y + 0.62 * S.ppu + 44
      }
      this.spec.set(fmax, hs, hot)
      this.spec.root.at(ax, ay).alpha(a)
      this.labSpecCap.at(ax, ay + 86).alpha(B >= 7.95 ? a * 0.9 : 0)
    } else {
      this.spec.root.alpha(0)
      this.labSpecCap.alpha(0)
    }
    // Beat 1 pluck: a fingertip pulls at σ = 0.2
    if (B >= 2.58 && B < 2.74) {
      const pull = ss(0.62, 0.67, a1)
      P.p(tx + (0.2 - 0.5) * thL * sc, ty + 0.16 * thL * pull + 0.02)
      this.cursor.at(P.x, P.y).alpha(window01(a1, 0.6, 0.7, 0.02))
    } else this.cursor.alpha(0)
    for (let k = 0; k < 4; k++) {
      const G = this.ghostLbl[k]
      if (S.ghostOp > 0.01) {
        const gap = (m ? 0.26 : 0.56) * S.ghostSplit
        P.p(tx - (thL / 2) * sc - 0.12, ty - gap * (k + 1))
        G.at(P.x, P.y).alpha(S.ghostOp * S.ghostSplit)
      } else G.alpha(0)
    }

    // ───────── Beat 2: free ends, quanta, the ladder ─────────
    if (B >= 3 && B < 3.4) {
      P.p(tx + (thL / 2) * sc, ty - 0.3)
      this.freeNote.at(P.x + 6, P.y).alpha(window01(b2, 0.07, 0.34, 0.04))
    } else this.freeNote.alpha(0)
    if (B >= 3.3 && B < 3.5) {
      P.p(tx, ty - (m ? 0.3 : 0.42))
      this.jitterNote.at(P.x, P.y).alpha(window01(b2, 0.355, 0.44, 0.02))
    } else this.jitterNote.alpha(0)
    if (B >= 3.33 && B < 4.1) {
      const replay = b2 >= 0.68
      const lands = replay ? BEADS2_REPLAY : BEADS2
      const k1 = (b2 >= lands[0] ? 1 : 0) + (b2 >= lands[1] ? 1 : 0)
      const k2 = b2 >= lands[2] ? 1 : 0
      let txt = 'k = 0 · LEVEL N = 0 · BOTTOM RUNG'
      if (k2) txt = m ? 'LEVEL N = 1·2 + 2·1 = 4' : `${kSub(1)} = 2 · ${kSub(2)} = 1 → LEVEL N = 1·2 + 2·1 = 4`
      else if (k1 === 2) txt = m ? 'LEVEL N = 1·2 = 2' : `${kSub(1)} = 2 → LEVEL N = 1·2 = 2`
      else if (k1 === 1) txt = m ? 'LEVEL N = 1·1 = 1' : `${kSub(1)} = 1 → LEVEL N = 1·1 = 1`
      P.p(tx - (thL / 2) * sc, ty + (m ? -0.42 : 0.72))
      this.levelLbl
        .text(txt)
        .at(m ? Math.max(16, P.x) : P.x, P.y)
        .alpha(ss(0.36, 0.4, b2) * (1 - ss(4.0, 4.08, B)))
    } else this.levelLbl.alpha(0)
    // equation M² = N/α′ with N pulsing as packets land
    if (B >= 3.6 && B < 4.2) {
      let pulse = 0
      for (const l of BEADS2_REPLAY) pulse = Math.max(pulse, Math.exp(-(((b2 - l) / 0.014) ** 2)))
      const ex = m ? Lo.vw / 2 : w * (0.5 + Lo.SX)
      const ey = m ? hgt * 0.07 : hgt * 0.1
      this.eq.at(ex, ey).alpha(ss(0.66, 0.72, b2) * (1 - ss(4.02, 4.12, B)))
      if (this.eqN) {
        const lvl = Math.round(pulse * 50) / 50
        if (lvl !== this.eqLevel) {
          this.eqLevel = lvl
          this.eqN.style.setProperty('--hl', String(Math.max(0.35, lvl)))
        }
      }
      this.aside.at(ex, ey + (m ? 62 : 74)).alpha(m ? 0 : window01(b2, 0.7, 0.86, 0.03))
    } else {
      this.eq.alpha(0)
      this.aside.alpha(0)
    }

    // ───────── the ladder (Beats 2, 3, 5; lab) ─────────
    this.updLadder(S, lab)

    // ───────── Beat 3: compass labels, spin readout, real-space inset, footnote ─────────
    const compA = S.compassOp * (S.thOp > 0.02 && S.lenPx > 60 ? 1 : 0)
    if (compA > 0.01) {
      const r = S.compassR
      P.p(S.compassX, S.compassY + r * 1.18, 0)
      this.compUp.at(P.x, P.y - 2).alpha(compA * 0.9)
      P.p(S.compassX + S.compassVx * r * 1.22, S.compassY, S.compassVz * r * 1.22)
      this.compIn.at(P.x + 5, P.y).alpha(compA * 0.9)
    } else {
      this.compUp.alpha(0)
      this.compIn.alpha(0)
    }
    if (B >= 4 && B < 5.1) {
      let txt: string
      if (c3 < 0.32) txt = 'WIGGLE · UP–DOWN'
      else if (c3 < 0.43) txt = 'WIGGLE · IN–OUT'
      else txt = `SPIN ALONG AXIS: +${S.K + 1} ħ`
      P.p(S.compassX, S.compassY - S.compassR * 1.3, 0)
      // phones: keep the label inside the screen
      this.spinLbl
        .align(m ? -100 : -50, 0)
        .text(txt)
        .at(m ? Math.min(Lo.vw - 16, P.x + 80) : P.x, P.y + 4)
        .alpha(ss(4.12, 4.25, B) * (1 - ss(5.0, 5.05, B)))
    } else if (B >= 8 && B < 9.05 && compA > 0.01) {
      // a guitar (PINNED) is the classical limit: ~10²⁸ packets per pluck, far too many to show a quantized spin
      const txt =
        lab.particle && lab.particle !== 'grav'
          ? 'BOTTOM RUNG'
          : lab.ends === 'pinned'
            ? S.spinSign !== 0
              ? 'SWIRL · CLASSICAL LIMIT'
              : 'WIGGLE DIRECTION'
            : S.spinSign !== 0
              ? `SPIN ALONG AXIS: ${S.spinSign > 0 ? '+' : '−'}${S.K + 1} ħ`
              : 'WIGGLE DIRECTION'
      P.p(S.compassX, S.compassY - S.compassR * 1.3, 0)
      const edge = P.x + S.compassR * S.ppu
      const mStrip = Lo.mobile && (lab.zoom0 || (!!lab.particle && lab.particle !== 'grav')) && lab.ends === 'free'
      this.spinLbl
        .align(-100, 0)
        .text(txt)
        .at(edge, P.y + 16)
        .alpha(mStrip ? 0 : compA * 0.85)
    } else this.spinLbl.alpha(0)
    if (S.higgs > 0 && compA > 0.01) {
      P.p(S.compassX, S.compassY - S.compassR * 1.3, 0)
      this.higgsTag
        .align(-100, 0)
        .at(P.x + S.compassR * S.ppu, P.y + 34)
        .alpha(Lo.mobile ? 0 : compA)
    } else this.higgsTag.alpha(0)
    // inset: the same state in real space (y–z), where a swirling single harmonic is a spinning rod
    const insA = B >= 4.35 && B < 5.1 ? window01(c3, 0.4, m ? 0.8 : 1.02, 0.05) * (1 - ss(5.0, 5.05, B)) : 0
    if (insA > 0.003) {
      const I = Lo.inset
      this.inset.at(I.x, I.y).alpha(insA)
      // ends of the string (σ = 0, 1) in the y–z plane
      let y0 = 0
      let z0 = 0
      let y1 = 0
      let z1 = 0
      const cps = Math.cos(S.psi)
      const sps = Math.sin(S.psi)
      for (let n = 0; n < MODES; n++) {
        const ph = (n + 1) * S.omega * t + S.phase[n]
        const Y = S.amp[n] * Math.cos(ph)
        const Z = S.amp[n] * Math.sin(ph)
        const yy = Y * cps - S.swirl * Z * sps
        const zz = Y * sps + S.swirl * Z * cps
        y0 += yy
        z0 += zz
        const sgn = (n + 1) % 2 === 0 ? 1 : -1
        y1 += yy * sgn
        z1 += zz * sgn
      }
      const k = 38 / Math.max(0.25, 0.2 * thL)
      this.rod.setAttribute('x1', (z0 * k).toFixed(2))
      this.rod.setAttribute('y1', (-y0 * k).toFixed(2))
      this.rod.setAttribute('x2', (z1 * k).toFixed(2))
      this.rod.setAttribute('y2', (-y1 * k).toFixed(2))
    } else this.inset.alpha(0)
    if (B >= 4.78 && B < 5.1) {
      const fx = m ? 16 : w * (0.5 + Lo.SX) - (w * 0.56 - 60) / 2 + 10
      const fy = m ? hgt * 0.075 : hgt * 0.86
      this.foot3.at(fx, fy).alpha(ss(0.8, 0.87, c3) * (1 - ss(5.0, 5.05, B)))
    } else this.foot3.alpha(0)

    // ───────── Beat 4: the pull-back, the catalogue, the loupes ─────────
    if (B >= 5.06 && B < 5.46) {
      const u = pullbackU(B)
      const e = -33.7 + pullDecades(u)
      const txt = u >= 0.97 ? 'VIEW ≈ 10⁻¹⁹ m · LHC RESOLUTION' : `VIEW ≈ 10${sup(Math.round(e))} m`
      P.p(tx, ty)
      // the readout sits under the string, and follows it in as the string shrinks to a point
      const half = Math.min(95, S.lenPx * 0.18)
      this.pbRead
        .text(txt)
        .at(P.x, P.y + 26 + half)
        .alpha(window01(d4, 0.09, 0.4, 0.03))
      const cA = window01(d4, 0.27, 0.4, 0.03)
      if (m) this.cardC.align(-50, 0).at(Lo.vw / 2, P.y + 50).alpha(cA)
      else this.cardC.align(0, -50).at(P.x + 26, P.y).alpha(cA)
    } else {
      this.pbRead.alpha(0)
      this.cardC.alpha(0)
    }
    const rpx = Lo.loupeR
    for (let i = 0; i < 5; i++) {
      const c = S.cat[i]
      const card = this.cards[i]
      if (B >= 5.3 && B < 6.2 && c.a > 0.01) {
        P.p(c.x, c.y)
        const below = 18 + (rpx + 4) * c.open + 6 * (1 - c.open)
        const aIn = ss(0.36, 0.42, d4) * (1 - ss(5.93, 5.99, B))
        card.at(P.x, P.y + below).alpha(aIn * c.a)
        this.cardState[i].alpha(m ? 0 : ss(0.3, 0.8, c.open))
      } else card.alpha(0)
    }
    if (B >= 5.35 && B < 6.1) {
      const y = Lo.slots[0] ? Lo.slots[0].y + rpx + (m ? 78 : 88) : 0
      this.catNote.at(Lo.vw / 2, y).alpha(ss(0.39, 0.45, d4) * (1 - ss(5.93, 5.99, B)))
      const cC = S.cat[2]
      P.p(cC.x, cC.y + S.loupeRw * cC.open + 0.16)
      this.sameLbl.at(P.x, P.y - 8).alpha(ss(0.78, 0.84, d4) * (1 - ss(5.92, 5.98, B)))
    } else {
      this.catNote.alpha(0)
      this.sameLbl.alpha(0)
    }

    // ───────── Beat 5: the bottom rung ─────────
    if (inB5 && B < 7.2) {
      // everything but the rung hairlines is gone before Beat 6 pushes into rung 0
      const fade6 = 1 - ss(6.93, 7.0, B)
      const top5 = rungY(Lo.lad5, Lo.count5 - 1)
      const capOut = m ? 1 - ss(0.41, 0.44, e5) : 1 - ss(0.52, 0.56, e5)
      this.rainCap.at(Lo.lad5.x - 6, r0y + 12).alpha(ss(0.36, 0.42, e5) * capOut * fade6)
      // phones: the rung-0 rewrite sits under the rung and stays (desktop: it is rung 0's tag, see updLadder)
      const rw = m ? ss(0.45, 0.5, e5) * fade6 : 0
      this.r0a.at(Lo.lad5.x - 6, r0y + 12).alpha(rw)
      this.r0b.at(Lo.lad5.x - 6, r0y + 27).alpha(rw)
      // zoom box → log strip
      const zb = ss(0.5, 0.56, e5) * (1 - ss(0.6, 0.66, e5))
      const zbg = ss(0.5, 0.6, e5)
      const bx0 = Lo.lad5.x - 10
      const by0 = r0y - 16
      const bw0 = Lo.lad5.w + 20
      const bh0 = 32
      const bx = bx0 + (sw.x - 40 - bx0) * zbg
      const by = by0 + (sw.y - (m ? 88 : 96) - by0) * zbg
      const bwid = bw0 + (sw.w + 60 - bw0) * zbg
      const bhei = bh0 + ((m ? 104 : 116) - bh0) * zbg
      this.strip.box.at(bx, by).alpha(zb * fade6)
      this.strip.box.el.style.width = `${bwid.toFixed(1)}px`
      this.strip.box.el.style.height = `${bhei.toFixed(1)}px`
      this.strip.width(sw.w)
      const sa = ss(0.56, 0.62, e5) * fade6
      this.strip.root.at(sw.x, sw.y).alpha(sa)
      this.strip.note.alpha(ss(0.62, 0.68, e5))
      this.strip.far.alpha(ss(0.64, 0.7, e5))
      // energy axis: the ladder's right rail; the LHC squeezed against rung 0
      const ea = ss(0.74, 0.8, e5) * fade6
      const ex = Lo.lad5.x + Lo.lad5.w + 5
      this.eAxis.at(ex, top5).alpha(m ? 0 : ea)
      this.eAxis.el.style.height = `${(r0y - top5).toFixed(1)}px`
      if (m) this.lhc.align(0, 0).at(Lo.lad5.x - 6, r0y + 42).alpha(ea)
      else this.lhc.align(-100, 0).at(ex + 1, r0y + 12).alpha(ea)
      const ca = ss(0.78, 0.84, e5) * fade6
      if (m) this.rung1.align(0, 0).at(16, 62).alpha(ca)
      else this.rung1.align(0, -100).at(Lo.lad5.x - 34, top5 - 40).alpha(ca)
    } else {
      this.rainCap.alpha(0)
      this.r0a.alpha(0)
      this.r0b.alpha(0)
      this.strip.box.alpha(0)
      this.eAxis.alpha(0)
      this.lhc.alpha(0)
      this.rung1.alpha(0)
      if (!labStrip) this.strip.root.alpha(0)
    }
    if (labStrip) {
      const st = Lo.stripLab
      this.strip.width(st.w)
      this.strip.root.at(st.x, st.y).alpha(1 - ss(9.0, 9.05, B))
      this.strip.note.alpha(1)
      this.strip.far.alpha(1)
    }

    // ───────── Beat 6: where charge comes from; the Standard-Model pattern ─────────
    if (B >= 7.15 && B < 7.5) {
      const a = window01(g6, 0.18, 0.37, 0.04)
      const s6 = S.b6scale
      P.p(S.c1x, S.c1y - 0.62 * s6)
      this.chip1.at(P.x, P.y + 10).alpha(a)
      P.p(S.c2x, S.c2y - 0.62 * s6)
      this.chip2.at(P.x, P.y + 10).alpha(a)
    } else {
      this.chip1.alpha(0)
      this.chip2.alpha(0)
    }
    if (B >= 7.36 && B < 8.02) {
      const sm = Lo.sm
      this.sm.at(sm.x, sm.y).alpha(ss(0.36, 0.44, g6) * (1 - ss(0.85, 0.91, g6)))
      this.sm.el.style.setProperty('--cw', `${sm.w.toFixed(1)}px`)
      this.sm.el.style.setProperty('--ch', `${sm.h.toFixed(1)}px`)
      this.smHead.alpha(ss(0.46, 0.52, g6))
      this.smSub.alpha(ss(0.48, 0.54, g6))
      this.smCols.alpha(ss(0.44, 0.5, g6))
      this.smLegend.alpha(ss(0.58, 0.64, g6))
      for (let i = 0; i < PARTICLES.length; i++) {
        const p = PARTICLES[i]
        const cell = this.smCells[i]
        cell.fig.at(p.slot[0] * sm.w, p.slot[1] * sm.h).alpha(ss(0.38 + 0.005 * i, 0.46 + 0.005 * i, g6))
        const row = p.slot[1] + p.slot[0] * 0.25
        cell.val.alpha(ss(0.56 + 0.012 * row, 0.6 + 0.012 * row, g6))
        cell.pred.alpha(ss(0.62 + 0.03 * p.slot[1], 0.66 + 0.03 * p.slot[1], g6))
      }
    } else this.sm.alpha(0)

    // ───────── the Lab ─────────
    this.updLab(S, lab)
  }

  private specH = new Float64Array(6)
  private ladRect: Rect = { x: 0, y: 0, w: 0, h: 0 }

  private updLadder(S: Shared, lab: ReturnType<typeof useVib.getState>) {
    const B = S.B
    const Lo = S.layout
    const lad = this.lad
    let R: Rect | null = null
    let a = 0
    let count = 7
    let marker = -1
    let markerA = 0
    let axisM = false
    let units: 'Ms' | 'GeV' = 'Ms'
    let tagMode: 'none' | 'spin' | 'count' | 'lab' = 'none'
    let tagA = 0
    let dimLab = 1
    let showHeadM = true
    /** Beat 6: rung spacing and widths grow around the Thread on rung 0 (texts are gone by then) */
    let zoom = 1
    let txtA = 1
    let ax = 0
    let ay = 0
    let anchored = false
    const b2 = B - 3
    const c3 = B - 4
    const e5 = B - 6
    if (B >= 3.6 && B < 5.1) {
      const mv = ss(4.0, 4.14, B)
      const A2 = Lo.lad2
      const A3 = Lo.lad3
      const Rm = this.ladRect
      Rm.x = A2.x + (A3.x - A2.x) * mv
      Rm.y = A2.y + (A3.y - A2.y) * mv
      Rm.w = A2.w + (A3.w - A2.w) * mv
      Rm.h = A2.h + (A3.h - A2.h) * mv
      R = Rm
      a = ss(0.64, 0.72, b2)
      if (B >= 4) a *= 1 - 0.62 * ss(0.0, 0.12, c3)
      a *= 1 - ss(5.0, 5.06, B)
      // the marker climbs one rung per packet-weight; the harmonic-2 packet lifts it two rungs at once
      const L = BEADS2_REPLAY
      let lvl = 0
      lvl += ss(L[0] - 0.012, L[0] + 0.004, b2)
      lvl += ss(L[1] - 0.012, L[1] + 0.004, b2)
      lvl += 2 * ss(L[2] - 0.012, L[2] + 0.02, b2)
      if (B >= 4) lvl = 4 + (1 - 4) * ss(0.0, 0.1, c3) + ss(0.675, 0.7, c3)
      marker = lvl
      markerA = ss(0.68, 0.72, b2) * (1 - ss(5.0, 5.06, B))
      if (B >= 4) {
        tagMode = 'spin'
        tagA = ss(0.7, 0.85, c3)
      }
    } else if (B >= 6 && B < 7.16) {
      R = Lo.lad5
      count = Lo.count5
      a = ss(0.0, 0.08, e5) * (1 - ss(7.07, 7.15, B))
      tagMode = 'count'
      tagA = ss(0.16, 0.24, e5)
      txtA = 1 - ss(6.93, 7.0, B)
      if (B >= 6.95) {
        // the camera pushes into rung 0: only the rung hairlines scale, anchored on the Thread lying on rung 0
        this.P.p(S.thCx, S.thCy)
        zoom = 1 + 2.4 * ss(7.0, 7.13, B)
        ax = this.P.x - Lo.aOff * zoom
        ay = this.P.y
        anchored = true
      }
    } else if (B >= 7.92 && B < 9.08) {
      R = Lo.ladLab
      const pinned = lab.ends === 'pinned'
      dimLab = pinned ? 0.2 : 1
      a = ss(7.95, 8.05, B) * (1 - ss(9.0, 9.06, B)) * (Lo.mobile && (lab.zoom0 || (!!lab.particle && lab.particle !== 'grav')) && lab.ends === 'free' ? 0 : 1)
      const N = S.N
      count = Lo.mobile ? Math.max(6, Math.min(12, N + 3)) : Math.max(9, Math.min(21, N + 3))
      axisM = lab.axis === 'M'
      units = lab.units
      marker = N
      markerA = pinned ? 0 : 1
      tagMode = 'lab'
      tagA = pinned ? 0 : 1
      showHeadM = !Lo.mobile
    }
    if (!R || a <= 0.003) {
      lad.root.alpha(0)
      this.guitarCap.alpha(0)
      return
    }
    const mob = Lo.mobile
    const lab0 = B >= 7.92
    lad.width(R.w * zoom)
    if (anchored) lad.root.at(ax, ay)
    else lad.root.at(R.x, R.y)
    lad.root.alpha(a * dimLab)
    lad.root.el.classList.toggle('is-compact', lab0 && mob)
    lad.text(txtA)
    const Nnow = S.N
    const big = lab0 && Nnow > 20
    const sp = R.h * zoom
    let top = 0
    for (let i = 0; i < lad.rows.length; i++) {
      const row = lad.rows[i]
      let N = i
      let show = i < count
      let y = 0
      if (big) {
        // rungs 0…8, a break, then the three rungs around N
        show = i < 12
        if (i <= 8) N = i
        else N = Nnow + (i - 10)
        y = i <= 8 ? rungH(axisM, sp, N) : rungH(axisM, sp, 8) + sp * (1.3 + (i - 9))
      } else y = rungH(axisM, sp, N)
      if (!show) {
        row.fig.alpha(0)
        continue
      }
      top = Math.max(top, y)
      row.fig.at(-34, -y).alpha(anchored ? ss(70, 170, ay - y) : 1)
      row.n.text(String(N))
      const Mv = Math.sqrt(N)
      row.m.text(N === 0 ? (tagMode === 'none' || lab0 || B < 4 ? '0 · MASSLESS' : '0') : units === 'GeV' ? `${Mv.toFixed(2)}×10¹⁸ GeV` : Mv.toFixed(2))
      row.el.classList.toggle('is-zero', N === 0)
      row.el.classList.toggle('is-cur', lab0 && N === Nnow && markerA > 0)
      // tags
      let tag = ''
      let ta = 0
      if (tagMode === 'spin') {
        tag = `J ≤ ${N + 1}`
        ta = tagA
      } else if (tagMode === 'count') {
        // 10D open-superstring counts; as the seventeen land, rung 0's tag explains why 17 fit on "16"
        tag = COUNT_TAGS[N] ?? ''
        ta = tagA
        if (N === 0 && e5 >= 0.45) {
          tag = mob ? '' : R0_TAG
          ta = ss(0.45, 0.5, e5)
        } else if (N === 0) ta = tagA * (1 - ss(0.41, 0.45, e5))
        ta *= txtA
      } else if (tagMode === 'lab' && N === Nnow) {
        tag = `${fmtCount(D[Math.min(63, N)])} STATES · J ≤ ${N + 1}`
        ta = tagA
      }
      row.tag.text(tag).alpha(tag ? ta : 0)
      row.tag.el.classList.toggle('is-2l', tag === R0_TAG)
    }
    lad.brk.at(-30, -(rungH(axisM, sp, 8) + sp * 0.65)).alpha(big ? 1 : 0)
    lad.hN.at(-34, -(top + (mob && lab0 ? 16 : 24))).alpha(lab0 && mob ? 0 : txtA)
    lad.hM
      .text(units === 'GeV' ? 'M (ASSUMES Mₛ = 10¹⁸ GeV)' : axisM ? 'M = √N · Mₛ  (AXIS: M)' : 'M = √N · Mₛ')
      .at(R.w * zoom + 10, -(top + 24))
      .alpha(showHeadM ? txtA : 0)
    if (marker >= 0 && markerA > 0) {
      let y: number
      if (big) y = Nnow <= 8 ? rungH(axisM, sp, Nnow) : rungH(axisM, sp, 8) + sp * 2.3
      else y = rungH(axisM, sp, marker)
      lad.marker.at(R.w * 0.5, -y).alpha(markerA)
    } else lad.marker.alpha(0)
    // guitar mode: ladder dims behind the classical caption
    if (lab0 && lab.ends === 'pinned' && !mob) this.guitarCap.at(R.x - 34, R.y - top * 0.35).alpha(a)
    else this.guitarCap.alpha(0)
  }

  private updLab(S: Shared, lab: ReturnType<typeof useVib.getState>) {
    const B = S.B
    const P = this.P
    const Lo = S.layout
    const inLab = B >= 7.95 && B < 9.05
    const exitA = 1 - ss(9.0, 9.05, B)
    if (!inLab) {
      this.farCard.alpha(0)
      this.halfNote.alpha(0)
      this.grav.alpha(0)
      this.graphCap.alpha(0)
      this.jitCap.alpha(0)
      this.stageMsg.alpha(0)
      return
    }
    const la = ss(7.97, 8.06, B) * exitA
    const tx = S.thCx
    const ty = S.thCy
    const far = S.pointW
    P.p(tx, ty)
    const px = P.x
    const py = P.y
    // the far-away point: mass, spin, charge
    if (far > 0.4) {
      const N = S.N
      const mass = lab.units === 'GeV' ? (N === 0 ? '0 GeV' : `${Math.sqrt(N).toFixed(2)}×10¹⁸ GeV`) : N === 0 ? '0' : `${Math.sqrt(N).toFixed(2)} Mₛ`
      const sel = lab.particle && lab.particle !== 'grav' ? PARTICLES.find((q) => q.id === lab.particle) : null
      const spin = sel ? (sel.spin === '½' ? '½ħ' : sel.spin === '0' ? '0' : '1ħ') : N === 0 ? '1ħ' : `≤ ${S.K + 1}ħ`
      this.farMass.text(`MASS ${mass} · SPIN ${spin} · CHARGE —`)
      // the card sits under the point (clear of the lab panel on the right)
      if (Lo.mobile) this.farCard.align(-50, 0).at(Lo.vw / 2, py + S.pointHalo + 26).alpha(la * ss(0.4, 0.9, far))
      else this.farCard.align(-50, 0).at(px, py + S.pointHalo + 30).alpha(la * ss(0.4, 0.9, far))
    } else this.farCard.alpha(0)
    const close = 1 - far
    const Lpx = (S.thL * S.thScale * S.ppu) / 2
    // captions under the bench string (graph view; jitter at the bottom rung)
    const stripOpen = (lab.zoom0 || (!!lab.particle && lab.particle !== 'grav')) && lab.ends === 'free'
    // phones: no free band while the rung-0 zoom is open (the sheet's card carries the same text)
    const capA = Lo.mobile && stripOpen ? 0 : 1
    const capY = Lo.mobile ? Lo.vh * 0.43 : py + 0.62 * S.ppu
    const capX = Lo.mobile ? 16 : px - Lpx
    const showJit = S.N === 0 && lab.ends === 'free' && !lab.particle
    this.graphCap.at(capX, capY).alpha(capA * la * close * (showJit || S.dotted || lab.ends === 'pinned' ? 0 : 0.95))
    this.jitCap.at(capX, capY).alpha(capA * la * close * (showJit && !S.dotted ? 0.95 : 0))
    this.halfNote.at(capX, capY).alpha(capA * la * close * S.dotted)
    // the snap / too-gentle / zero-mode line, echoed on stage for a few seconds
    const age = performance.now() - lab.msgAt
    if (lab.msg && age < 4200) {
      const txt =
        lab.msg === 'snap'
          ? 'Snapped to whole packets. A quantum string can’t vibrate by half a packet.'
          : lab.msg === 'gentle'
            ? 'Too gentle for even one packet. Still on the bottom rung.'
            : 'Sliding the whole string isn’t vibration. It doesn’t change the mass.'
      const fade = Math.min(1, age / 250) * (1 - ss(3400, 4200, age))
      this.stageMsg
        .text(txt)
        .at(Lo.mobile ? Lo.vw / 2 : px, py - (Lo.mobile ? 0.62 : 0.95) * S.ppu)
        .alpha(la * close * fade)
    } else this.stageMsg.alpha(0)
    // graviton: a closed-loop glyph beside the (open) bench string
    if (S.grav > 0) this.grav.at(Lo.mobile ? 16 : px - Lpx, py + (Lo.mobile ? 48 : -96)).alpha(la)
    else this.grav.alpha(0)
  }
}

export function Figures({ S }: { S: Shared }) {
  const camera = useThree((st) => st.camera)
  const ref = useRef<FigureSet | null>(null)
  useLayoutEffect(() => {
    const F = new FigureSet()
    ref.current = F
    if (import.meta.env.DEV)
      (
        window as unknown as {
          __vibProject: (x: number, y: number, z: number) => number[]
        }
      ).__vibProject = (x, y, z) => {
        F.P.p(x, y, z)
        return [F.P.x, F.P.y]
      }
    return () => {
      F.dispose()
      ref.current = null
    }
  }, [])
  useChapterFrame(
    (f) => {
      const F = ref.current
      if (!F) return
      F.P.set(camera, S.layout.w, S.layout.h)
      S.presence = f.presence
      F.update(S)
    },
    { always: true, priority: -0.5 },
  )
  return null
}
