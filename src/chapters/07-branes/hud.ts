/*
 * The chapter's stage HUD: figure annotations drawn in DOM above the canvas (in the fixed #scene-labels
 * layer, below the narrative text). Built imperatively and updated from the scene's frame loop — no React
 * renders per frame, and every write is skipped when nothing changed.
 *
 *  - tags: mono labels pinned to 3D points (projected each frame)
 *  - pins: "~ ANALOGY …" notes pinned bottom-left
 *  - cards: footnote cards with a status chip
 *  - icons: D0 · D1 · D2 · D3 … D9 row
 *  - matrix: the N × N string matrix (Chan–Paton labels)
 *  - mass: the MASS gauge and the m-vs-d line
 *  - inset: a round on-brane (slice) view drawn on a 2D canvas
 *  - rs: the Randall–Sundrum warped-grid inset
 *  - results: the three null-result cards
 *  - cap: a large display caption
 */
import type { StatusKind } from '@/ui'
import { STATUS_INFO } from '@/ui'
import { stretchedMass, type Stack } from './model'

type Tone = 'ink' | 'dim' | 'field' | 'filament'
type Align = 'left' | 'right' | 'center' | 'above' | 'below'

const SVGNS = 'http://www.w3.org/2000/svg'

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const el = document.createElement(tag)
  if (cls) el.className = cls
  if (text != null) el.textContent = text
  return el
}

const s = (parent: Element, tag: string, attrs: Record<string, string | number>, text?: string) => {
  const e = document.createElementNS(SVGNS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  if (text != null) e.textContent = text
  parent.appendChild(e)
  return e
}

/** Status chip markup identical to <Status compact>. */
export function chip(kind: StatusKind) {
  const c = h('span', `status status--${kind} status--compact`)
  c.appendChild(h('i', 'status__mark'))
  c.appendChild(h('span', 'status__label', STATUS_INFO[kind].label))
  return c
}

class Fader {
  private v = -1
  constructor(readonly el: HTMLElement) {
    el.style.opacity = '0'
    el.style.visibility = 'hidden'
  }
  set(o: number) {
    const q = Math.round(Math.max(0, Math.min(1, o)) * 200) / 200
    if (q === this.v) return
    this.v = q
    this.el.style.opacity = String(q)
    this.el.style.visibility = q < 0.01 ? 'hidden' : 'visible'
  }
}

const setText = (el: Element, t: string) => {
  if (el.textContent !== t) el.textContent = t
}

export class Tag {
  readonly el: HTMLDivElement
  readonly text: HTMLSpanElement
  private f: Fader
  private x = NaN
  private y = NaN
  private readonly def: string
  /** measured width of the label box (0 = measure again) */
  private w = 0
  constructor(
    parent: HTMLElement,
    private readonly align: Align,
    tone: Tone,
    size: 'sm' | 'md' | 'lg',
    content: string,
    status?: StatusKind,
    keepCase = false,
    pre = false,
  ) {
    this.def = content
    this.el = h('div', `scene-label scene-label--${align} scene-label--${tone} scene-label--${size} brn-tag${keepCase ? ' brn-tag--nc' : ''}${pre ? ' brn-tag--pre' : ''}`)
    const inner = h('span', 'scene-label__text')
    if (status) inner.appendChild(chip(status))
    this.text = h('span', 'brn-tag__t', content)
    inner.appendChild(this.text)
    this.el.appendChild(inner)
    parent.appendChild(this.el)
    this.f = new Fader(this.el)
  }
  /** Place at screen point (x, y); the label box is kept inside [m, W − m] horizontally. */
  place(x: number, y: number, o: number, text: string | undefined, W: number, m = 14) {
    this.f.set(o)
    if (o < 0.01) return
    const t = text ?? this.def
    if (this.text.textContent !== t) {
      this.text.textContent = t
      this.w = 0
    }
    if (!this.w) this.w = (this.el.firstChild as HTMLElement).offsetWidth
    const w = this.w
    if (w > 0) {
      if (this.align === 'left') x = Math.max(m - 10, Math.min(x, W - m - 10 - w))
      else if (this.align === 'right') x = Math.min(W - m + 10, Math.max(x, m + 10 + w))
      else x = Math.max(m + w / 2, Math.min(x, W - m - w / 2))
    }
    const rx = Math.round(x * 2) / 2
    const ry = Math.round(y * 2) / 2
    if (rx === this.x && ry === this.y) return
    this.x = rx
    this.y = ry
    this.el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
  }
  /** Measure again (after a resize or a font swap). */
  remeasure() {
    this.w = 0
  }
  hide() {
    this.f.set(0)
  }
}

export interface MatrixState {
  ys: number[]
  stacks: Stack[]
  header: string
  count: string
  /** show masses in off-diagonal cells */
  showMass: boolean
  /** print each brane's position beside its row label ("2 · y 1.5"): the diagonal of ⟨Φ⟩ */
  showPos?: boolean
  /** highlight a pair (brane indices) */
  pair?: [number, number] | null
  /** bumped by the caller whenever ys/stacks change (lets update() skip all work otherwise) */
  v?: number
}

const fmtY = (y: number) => (y < 0 ? `−${(-y).toFixed(1)}` : y.toFixed(1))

/** The N × N string matrix. Rows: where the string starts; columns: where it ends. */
export class MatrixView {
  readonly el: HTMLDivElement
  private head: HTMLDivElement
  private count: HTMLDivElement
  readonly grid: HTMLDivElement
  private cells: HTMLDivElement[] = []
  readonly rowL: HTMLSpanElement[] = []
  private colL: HTMLSpanElement[] = []
  private blocks: HTMLDivElement[] = []
  private key = ''
  private nStacks = 0
  private scale = 1
  private diag = -1
  n = 0
  constructor(private readonly wrapEl: HTMLElement) {
    const parent = wrapEl
    this.el = h('div', 'brn-mx')
    this.head = h('div', 'brn-mx__head t-mono')
    this.count = h('div', 'brn-mx__count t-mono')
    const wrap = h('div', 'brn-mx__wrap')
    this.grid = h('div', 'brn-mx__grid')
    for (let i = 0; i < 4; i++) {
      const r = h('span', 'brn-mx__rl t-mono')
      const c = h('span', 'brn-mx__cl t-mono')
      this.rowL.push(r)
      this.colL.push(c)
      wrap.appendChild(r)
      wrap.appendChild(c)
    }
    for (let i = 0; i < 16; i++) {
      const c = h('div', 'brn-mx__cell t-mono')
      this.cells.push(c)
      this.grid.appendChild(c)
    }
    for (let i = 0; i < 4; i++) {
      const b = h('div', 'brn-mx__block')
      this.blocks.push(b)
      this.grid.appendChild(b)
    }
    wrap.appendChild(this.grid)
    this.el.appendChild(this.head)
    this.el.appendChild(this.count)
    this.el.appendChild(wrap)
    parent.appendChild(this.el)
  }
  private v = -1
  private pos = false
  update(st: MatrixState) {
    const n = st.ys.length
    setText(this.head, st.header)
    setText(this.count, st.count)
    const pos = !!st.showPos
    if (st.v !== undefined) {
      if (st.v === this.v && pos === this.pos) return
      this.v = st.v
    }
    this.pos = pos
    const order = st.stacks.flatMap((k) => k.members)
    const stackOf = new Array(n).fill(0)
    st.stacks.forEach((k, si) => k.members.forEach((m) => (stackOf[m] = si)))
    const key = `${n}|${order.map((i) => st.ys[i].toFixed(2)).join(',')}|${st.showMass}|${pos}|${st.stacks.map((k) => k.members.join('.')).join('/')}|${st.pair?.join('-') ?? ''}`
    if (key === this.key) return
    this.key = key
    this.n = n
    this.el.style.setProperty('--n', String(n))
    for (let r = 0; r < 4; r++) {
      const on = r < n
      this.rowL[r].style.display = on ? '' : 'none'
      this.colL[r].style.display = on ? '' : 'none'
      if (on) {
        setText(this.rowL[r], pos ? `${order[r] + 1} · y ${fmtY(st.ys[order[r]])}` : String(order[r] + 1))
        setText(this.colL[r], String(order[r] + 1))
        this.rowL[r].style.setProperty('--i', String(r))
        this.colL[r].style.setProperty('--i', String(r))
      }
    }
    this.rowL[0].parentElement?.classList.toggle('is-pos', pos)
    let rank = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        const cell = this.cells[r * 4 + c]
        if (r >= n || c >= n) {
          cell.style.display = 'none'
          continue
        }
        cell.style.display = ''
        cell.style.gridRow = String(r + 1)
        cell.style.gridColumn = String(c + 1)
        cell.classList.toggle('is-d', r === c)
        // off-diagonal cells fill one after another (reading order, 120 ms apart) when branes merge
        cell.style.setProperty('--d', r === c ? '0ms' : `${120 * rank++}ms`)
        const i = order[r]
        const j = order[c]
        const same = stackOf[i] === stackOf[j]
        cell.classList.toggle('is-filled', same)
        cell.classList.toggle('is-open', !same)
        const sel = !!st.pair && ((st.pair[0] === i && st.pair[1] === j) || (st.pair[0] === j && st.pair[1] === i))
        cell.classList.toggle('is-sel', sel && !same)
        setText(cell, same ? '0' : st.showMass ? stretchedMass(st.ys[i] - st.ys[j]).toFixed(2) : '')
      }
    // a merge (fewer stacks, same branes) sends a one-shot Field glow round the grown block
    const merged = st.stacks.length < this.nStacks && n === this.lastN
    this.nStacks = st.stacks.length
    this.lastN = n
    let start = 0
    for (let b = 0; b < 4; b++) {
      const blk = this.blocks[b]
      const k = st.stacks[b]
      if (!k) {
        blk.style.display = 'none'
        continue
      }
      const len = k.members.length
      blk.style.display = ''
      blk.style.gridRow = `${start + 1} / span ${len}`
      blk.style.gridColumn = `${start + 1} / span ${len}`
      start += len
      if (merged && len > 1) {
        blk.classList.remove('is-glow')
        void blk.offsetWidth
        blk.classList.add('is-glow')
      }
    }
  }
  private lastN = 0
  /** Scale the whole matrix figure (anchored top-right). */
  setScale(v: number) {
    const q = Math.round(v * 500) / 500
    if (q === this.scale) return
    this.scale = q
    this.wrapEl.style.transform = q === 1 ? '' : `scale(${q})`
  }
  /** 0..1: light the diagonal (the brane positions, ⟨Φ⟩'s diagonal). */
  setDiag(o: number) {
    const q = Math.round(o * 50) / 50
    if (q === this.diag) return
    this.diag = q
    this.el.style.setProperty('--diag', String(q))
  }
}

/** Mass gauge (vertical bar) + the m-vs-d line (d ∈ [0, 10] ℓ_s, m ∈ [0, 1.6] M_s). */
export class MassView {
  readonly el: HTMLDivElement
  readonly plotEl: HTMLDivElement
  private fill: HTMLDivElement
  private val: HTMLSpanElement
  private ratio: HTMLSpanElement
  private dRead: HTMLSpanElement
  private phys: HTMLDivElement
  private cursor: SVGElement
  private cursorV: SVGElement
  private last = ''
  private X = (d: number) => 34 + (d / 10) * 176
  private Y = (m: number) => 124 - (m / 1.6) * 110
  constructor(parent: HTMLElement) {
    const { X, Y } = this
    this.el = h('div', 'brn-mass')
    const top = h('div', 'brn-mass__top')
    // gauge
    const g = h('div', 'brn-gauge')
    g.appendChild(h('div', 'brn-gauge__title t-label', 'Mass'))
    const bar = h('div', 'brn-gauge__bar')
    this.fill = h('div', 'brn-gauge__fill')
    bar.appendChild(this.fill)
    for (const v of [0, 0.2, 0.4, 0.6, 0.8]) {
      const t = h('span', 'brn-gauge__tick t-mono', v === 0 ? '0' : v.toFixed(1))
      t.style.setProperty('--p', String(v / 0.8))
      bar.appendChild(t)
    }
    g.appendChild(bar)
    g.appendChild(h('div', 'brn-gauge__unit t-mono', 'M_s'))
    top.appendChild(g)
    // readouts
    const read = h('div', 'brn-mass__read')
    const row = (k: string) => {
      const l = h('div', 'brn-mass__row t-mono')
      l.appendChild(h('span', 'k', k))
      const v = h('span', 'v')
      l.appendChild(v)
      read.appendChild(l)
      return v
    }
    this.val = row('m = T·d = d/2π')
    this.dRead = row('d')
    this.ratio = row('m ÷ d = T')
    this.phys = h('div', 'brn-mass__phys t-mono')
    read.appendChild(this.phys)
    top.appendChild(read)
    this.el.appendChild(top)
    // plot
    const p = h('div', 'brn-plot')
    const svg = document.createElementNS(SVGNS, 'svg')
    svg.setAttribute('viewBox', '0 0 220 146')
    svg.setAttribute('class', 'brn-plot__svg')
    s(svg, 'line', { x1: X(0), y1: Y(0), x2: X(10), y2: Y(0), class: 'ax' })
    s(svg, 'line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(1.6), class: 'ax' })
    for (let d = 0; d <= 10; d += 2) {
      s(svg, 'line', { x1: X(d), y1: Y(0), x2: X(d), y2: Y(0) + 3, class: 'ax' })
      s(svg, 'text', { x: X(d), y: Y(0) + 13, class: 'tk', 'text-anchor': 'middle' }, String(d))
    }
    for (const m of [0, 0.5, 1, 1.5]) {
      s(svg, 'line', { x1: X(0) - 3, y1: Y(m), x2: X(0), y2: Y(m), class: 'ax' })
      s(svg, 'text', { x: X(0) - 6, y: Y(m) + 3, class: 'tk', 'text-anchor': 'end' }, String(m))
    }
    s(svg, 'line', { x1: X(0), y1: Y(1), x2: X(10), y2: Y(1), class: 'grid' })
    // d = 2π: where the stretched string's lightest mass reaches M_s
    s(svg, 'line', { x1: X(2 * Math.PI), y1: Y(1), x2: X(2 * Math.PI), y2: Y(0) + 3, class: 'grid' })
    s(svg, 'text', { x: X(2 * Math.PI), y: Y(0) + 22, class: 'tk tk--dim', 'text-anchor': 'middle' }, '2π')
    s(svg, 'line', { x1: X(0), y1: Y(0), x2: X(10), y2: Y(10 / (2 * Math.PI)), class: 'ln' })
    s(svg, 'text', { x: X(10), y: 145, class: 'tk tk--ax', 'text-anchor': 'end' }, 'd (ℓ_s)')
    s(svg, 'text', { x: 2, y: 9, class: 'tk tk--ax' }, 'm (M_s)')
    this.cursorV = s(svg, 'line', { x1: 0, y1: Y(0), x2: 0, y2: Y(0), class: 'cur' })
    this.cursor = s(svg, 'circle', { cx: 0, cy: Y(0), r: 3.2, class: 'dot' })
    p.appendChild(svg)
    const key = h('div', 'brn-plot__key t-mono')
    key.appendChild(h('i', 'brn-plot__dash'))
    key.appendChild(h('span', '', 'above this line: heavier than an unstretched string’s first excited level'))
    p.appendChild(key)
    p.appendChild(h('div', 'brn-plot__cap t-mono', 'Not a rubber band: tension stays fixed, so the line is straight.'))
    this.plotEl = p
    parent.appendChild(this.el)
    parent.appendChild(p)
  }
  private lastD = NaN
  update(d: number, phys = '') {
    if (d === this.lastD && phys === this.last) return
    this.lastD = d
    this.last = phys
    const m = stretchedMass(d)
    this.fill.style.transform = `scaleY(${Math.min(1, m / 0.8).toFixed(4)})`
    setText(this.val, `${m.toFixed(2)} M_s`)
    setText(this.dRead, `${d.toFixed(2)} ℓ_s`)
    setText(this.ratio, (1 / (2 * Math.PI)).toFixed(3))
    setText(this.phys, phys)
    const x = this.X(Math.min(10, d)).toFixed(1)
    const y = this.Y(Math.min(1.6, m)).toFixed(1)
    this.cursor.setAttribute('cx', x)
    this.cursor.setAttribute('cy', y)
    this.cursorV.setAttribute('x1', x)
    this.cursorV.setAttribute('x2', x)
    this.cursorV.setAttribute('y2', y)
  }
}

export class Hud {
  readonly root: HTMLDivElement
  readonly tagLayer: HTMLDivElement
  private faders = new Map<string, Fader>()
  private pending = new Map<string, number>()
  readonly matrix: MatrixView
  readonly mass: MassView
  readonly inset: HTMLCanvasElement
  readonly insetTitle: HTMLDivElement
  readonly insetCap: HTMLDivElement
  readonly capText: HTMLDivElement
  readonly note: HTMLDivElement
  private ftitle: HTMLDivElement
  private link: SVGSVGElement
  private linkPath: SVGPathElement
  private linkBr: SVGPathElement
  private linkT: SVGTextElement
  private linkF: Fader
  private linkKey = ''
  private rootOp = -1

  constructor(host: HTMLElement) {
    this.root = h('div', 'brn-hud')
    this.root.setAttribute('aria-hidden', 'true')
    this.tagLayer = h('div', 'brn-hud__tags')
    this.root.appendChild(this.tagLayer)

    // pinned notes (bottom-left)
    const pins = h('div', 'brn-pins')
    this.root.appendChild(pins)
    const pin = (key: string, kind: StatusKind, text: string) => {
      const el = h('div', 'brn-pin')
      el.appendChild(chip(kind))
      el.appendChild(h('span', 'brn-pin__t', text))
      pins.appendChild(el)
      this.faders.set('pin:' + key, new Fader(el))
    }
    pin('scale', 'analogy', 'Not to scale · 1 unit = ℓ_s = √α′, whose size is unknown')
    pin('sheet', 'analogy', 'Drawn as a 2D sheet in 3D. A Dp-brane has p space dimensions.')
    pin('recoil', 'analogy', 'Recoil exaggerated · branes are very heavy when strings interact weakly (tension ∝ 1/g_s)')
    pin('rr', 'analogy', 'Drawn like an electric field. The RR field is a higher-rank cousin of it.')
    pin('slice', 'analogy', 'A geometric slice. Brane-dwellers would notice a passing closed string only through weak effects such as gravity.')
    pin('bulk', 'analogy', 'A 2D brane in a 3D bulk. In string theory, e.g., a 3D brane in 9D space.')
    pin('exact', 'analogy', 'Branes drawn 2D. Masses exact in string units.')
    pin('higgs', 'derived', 'This “Higgs field” is the branes’ position, not the Standard Model Higgs.')
    pin('add', 'analogy', 'One extra dimension drawn, where ADD needs at least 2. A single one this large is long excluded.')
    pin('rs', 'analogy', 'Warping drawn as shrinking grid spacing.')
    pin('notreq', 'speculative', 'String theory doesn’t require that we live on a brane.')
    pin('lab', 'analogy', 'Branes drawn as 2D sheets in 3D. Not to scale. Masses exact in string units.')

    // footnote cards (bottom-right)
    const cards = h('div', 'brn-cards')
    this.root.appendChild(cards)
    const card = (key: string, kind: StatusKind, text: string) => {
      const el = h('div', 'brn-card')
      el.appendChild(chip(kind))
      el.appendChild(h('p', 'brn-card__t', text))
      cards.appendChild(el)
      this.faders.set('card:' + key, new Fader(el))
    }
    card('1989', 'derived', '1989 · Dai, Leigh & Polchinski, and independently Hořava. Found through the duality of Chapter 08.')
    card('sv', 'derived', '1996 · Counting D-brane bound states reproduced the entropy of certain idealized, supersymmetric black holes (Strominger & Vafa).')
    card('su3', 'speculative', 'Some speculative models use a stack of three branes for the strong force’s SU(3).')
    card('proton', 'observed', 'Between two protons, gravity is ~10³⁶ times weaker than their electric repulsion.')
    card('tdual', 'derived', 'D-branes were found through T-duality, which swaps “slides” and “pinned” ends. Next chapter.')

    // null results
    const res = h('div', 'brn-results')
    res.appendChild(h('div', 'brn-results__head t-label', 'Searches so far · no signal'))
    for (const t of [
      'Torsion balance, 2020: 1/r² holds to 52 µm',
      'ATLAS, 2021: no excess of missing momentum; gravity’s true scale > 11.2 TeV if 2 large extra dimensions',
      'CMS, 2021: no warped-graviton resonance below 4.8 TeV (benchmark coupling)',
    ]) {
      const el = h('div', 'brn-res')
      el.appendChild(chip('observed'))
      el.appendChild(h('p', 'brn-res__t', t))
      res.appendChild(el)
    }
    this.root.appendChild(res)
    this.faders.set('results', new Fader(res))

    // D0…D9 icon row
    const icons = h('div', 'brn-icons')
    const icon = (label: string, draw: (svg: SVGSVGElement) => void, wide = false) => {
      const it = h('div', wide ? 'brn-icon brn-icon--wide' : 'brn-icon')
      const svg = document.createElementNS(SVGNS, 'svg')
      svg.setAttribute('viewBox', '0 0 36 28')
      draw(svg)
      it.appendChild(svg)
      it.appendChild(h('span', 'brn-icon__t t-mono', label))
      icons.appendChild(it)
    }
    icon('D0 · a point', (g) => s(g, 'circle', { cx: 18, cy: 14, r: 2.2, class: 'pt' }))
    icon('D1 · a line', (g) => s(g, 'line', { x1: 4, y1: 14, x2: 32, y2: 14, class: 'ln' }))
    icon('D2 · a sheet', (g) => {
      s(g, 'path', { d: 'M6 20 L14 8 L32 8 L24 20 Z', class: 'sh' })
      s(g, 'path', { d: 'M10 14 L28 14 M15 20 L23 8', class: 'gr' })
    })
    icon(
      'D3 · three space dimensions\n(can’t draw)',
      (g) => {
        s(g, 'path', { d: 'M8 21 L8 9 L20 5 L30 9 L30 21 L18 25 Z', class: 'sh sh--dash' })
        s(g, 'text', { x: 19, y: 18, class: 'q', 'text-anchor': 'middle' }, '?')
      },
      true,
    )
    icons.appendChild(h('div', 'brn-icons__more t-mono', '… up to D9'))
    this.root.appendChild(icons)
    this.faders.set('icons', new Fader(icons))

    // matrix
    const mxWrap = h('div', 'brn-mxwrap')
    this.matrix = new MatrixView(mxWrap)
    const legend = h('div', 'brn-mx__legend t-mono', 'Row: where the string starts.\nColumn: where it ends.\nN branes, N² strings.')
    mxWrap.appendChild(legend)
    this.faders.set('legend', new Fader(legend))
    const nsq = h('div', 'brn-mx__nsq t-mono', 'N branes together → N² kinds of string → U(N)')
    mxWrap.appendChild(nsq)
    this.root.appendChild(mxWrap)
    this.faders.set('matrix', new Fader(mxWrap))
    this.faders.set('nsq', new Fader(nsq))

    // the ruler → matrix bracket (Beat 5): "brane positions = the Higgs field's value"
    this.link = document.createElementNS(SVGNS, 'svg') as SVGSVGElement
    this.link.setAttribute('class', 'brn-link')
    this.linkPath = s(this.link, 'path', { class: 'ld', d: '' }) as SVGPathElement
    this.linkBr = s(this.link, 'path', { class: 'br', d: '' }) as SVGPathElement
    this.linkT = s(this.link, 'text', { class: 'lt', 'text-anchor': 'end' }) as SVGTextElement
    s(this.linkT, 'tspan', { x: 0, dy: 0 }, 'brane positions')
    s(this.linkT, 'tspan', { x: 0, dy: '1.45em' }, '= the Higgs field’s value')
    this.root.appendChild(this.link)
    // set from the label pass (after commit), so it keeps its own fader outside the per-frame show/commit cycle
    this.linkF = new Fader(this.link as unknown as HTMLElement)

    // mass gauge + plot
    this.mass = new MassView(this.root)
    this.faders.set('mass', new Fader(this.mass.el))
    this.faders.set('plot', new Fader(this.mass.plotEl))

    // round inset (on-brane view)
    const inset = h('div', 'brn-inset')
    this.inset = h('canvas', 'brn-inset__cv')
    const ring = h('div', 'brn-inset__ring')
    ring.appendChild(this.inset)
    inset.appendChild(ring)
    this.insetTitle = h('div', 'brn-inset__title t-label', 'On-brane view · brane 1')
    inset.appendChild(this.insetTitle)
    this.insetCap = h('div', 'brn-inset__cap', '')
    inset.appendChild(this.insetCap)
    this.root.appendChild(inset)
    this.faders.set('inset', new Fader(inset))

    // Randall–Sundrum warped inset: bulk grid spacing ∝ e^(−k·y), shrinking 8× from brane A to brane B
    const rs = h('div', 'brn-rs')
    const svg = document.createElementNS(SVGNS, 'svg')
    svg.setAttribute('viewBox', '0 0 240 132')
    const rows = 9
    const q = Math.pow(8, 1 / (rows - 1))
    let s0 = 0
    for (let i = 0; i < rows; i++) s0 += Math.pow(q, -i)
    s0 = 104 / s0
    let yy = 118
    for (let i = 0; i < rows; i++) {
      const hgt = s0 * Math.pow(q, -i)
      const ny = yy - hgt
      if (i < rows - 1) s(svg, 'line', { x1: 12, y1: ny.toFixed(2), x2: 228, y2: ny.toFixed(2), class: 'gl' })
      const w = 1.25 * hgt
      const n = Math.floor(216 / w)
      const x0 = 12 + (216 - n * w) / 2
      for (let k = 1; k < n; k++) s(svg, 'line', { x1: (x0 + k * w).toFixed(2), y1: yy.toFixed(2), x2: (x0 + k * w).toFixed(2), y2: ny.toFixed(2), class: 'gl' })
      yy = ny
    }
    s(svg, 'line', { x1: 12, y1: 118, x2: 228, y2: 118, class: 'br' })
    s(svg, 'line', { x1: 12, y1: 14, x2: 228, y2: 14, class: 'br' })
    s(svg, 'text', { x: 12, y: 130, class: 'tk' }, 'brane A')
    s(svg, 'text', { x: 12, y: 9, class: 'tk' }, 'brane B · grid spacing ÷ 8')
    s(svg, 'text', { x: 234, y: 70, class: 'tk', 'text-anchor': 'start' }, 'y')
    rs.appendChild(svg)
    rs.appendChild(h('div', 'brn-rs__cap t-mono', 'Randall & Sundrum, 1999: a warped extra dimension; weakness from warping, not volume'))
    this.root.appendChild(rs)
    this.faders.set('rs', new Fader(rs))

    // figure title (top-left of the stage): a credit line for the picture on screen
    const ft = h('div', 'brn-ftitle t-mono', '')
    this.ftitle = ft
    this.root.appendChild(ft)
    this.faders.set('ftitle', new Fader(ft))

    // big caption
    const cap = h('div', 'brn-cap')
    this.capText = h('div', 'brn-cap__t')
    cap.appendChild(this.capText)
    this.root.appendChild(cap)
    this.faders.set('cap', new Fader(cap))

    // lab stage note (micro-copy raised by the stage)
    this.note = h('div', 'brn-note t-mono')
    this.root.appendChild(this.note)
    this.faders.set('note', new Fader(this.note))

    host.appendChild(this.root)
  }

  tag(align: Align, tone: Tone, text: string, size: 'sm' | 'md' | 'lg' = 'sm', status?: StatusKind, keepCase = false, pre = false) {
    return new Tag(this.tagLayer, align, tone, size, text, status, keepCase, pre)
  }

  /** Start a frame: every element defaults to hidden unless shown before commit(). */
  begin() {
    this.pending.clear()
  }
  /** Fade a named element: pin:<key>, card:<key>, icons, matrix, nsq, mass, inset, rs, results, cap, ftitle, note. */
  show(key: string, o: number) {
    if (o > (this.pending.get(key) ?? 0)) this.pending.set(key, o)
  }
  /** Apply this frame's opacities (one DOM write per element that changed). */
  commit() {
    for (const [k, f] of this.faders) f.set(this.pending.get(k) ?? 0)
  }
  setCap(text: string) {
    setText(this.capText, text)
  }
  /** the stage's figure title (top-left of the stage) */
  setTitle(text: string) {
    setText(this.ftitle, text)
  }
  /**
   * The Beat 5 bracket: from the Higgs ruler's top (screen x, y) up and across to a bracket on the matrix's
   * row labels, which carry the brane positions. o = opacity (0 hides it). Geometry is read from the DOM only
   * while it shows.
   */
  setLink(x: number, y: number, o: number) {
    this.linkF.set(o)
    if (o < 0.01) return
    const n = this.matrix.n
    if (!n) return
    const r0 = this.matrix.rowL[0].getBoundingClientRect()
    const r1 = this.matrix.rowL[n - 1].getBoundingClientRect()
    const g = this.matrix.grid.getBoundingClientRect()
    const bx = Math.min(r0.left, r1.left) - 9
    const top = r0.top + 2
    const bot = r1.bottom - 2
    const mid = (top + bot) / 2
    const yA = g.bottom + 26
    const key = `${Math.round(x)}|${Math.round(y)}|${Math.round(bx)}|${Math.round(top)}|${Math.round(bot)}|${Math.round(yA)}`
    if (key === this.linkKey) return
    this.linkKey = key
    // ruler top → up to just under the matrix → across → up into the bracket's foot
    this.linkPath.setAttribute('d', `M${x.toFixed(1)} ${(y - 6).toFixed(1)} V${yA.toFixed(1)} H${bx.toFixed(1)} V${(bot + 6).toFixed(1)}`)
    this.linkBr.setAttribute('d', `M${(bx + 5).toFixed(1)} ${top.toFixed(1)} H${bx.toFixed(1)} V${bot.toFixed(1)} H${(bx + 5).toFixed(1)}`)
    this.linkT.setAttribute('transform', `translate(${(bx - 10).toFixed(1)} ${(mid - 4).toFixed(1)})`)
  }
  setNote(text: string) {
    setText(this.note, text)
  }
  setInset(title: string, cap: string) {
    setText(this.insetTitle, title)
    setText(this.insetCap, cap)
  }
  setOpacity(o: number) {
    const q = Math.round(o * 100) / 100
    if (q === this.rootOp) return
    this.rootOp = q
    this.root.style.opacity = String(q)
    this.root.style.visibility = q < 0.01 ? 'hidden' : 'visible'
  }
  private beat = ''
  /** the visible width (the layout viewport can be wider than the screen on phones) */
  cw = 0
  /** left edge of the docked lab panel (desktop), 0 when not docked beside the stage */
  panelLeft = 0
  private tick = 0
  setMode(mobile: boolean, lab: boolean, beat: string) {
    // keep right-anchored panels inside the visible width even if the layout viewport is wider than the screen
    const cw = document.documentElement.clientWidth
    if (cw !== this.cw) {
      this.cw = cw
      this.root.style.width = cw > 0 && cw < window.innerWidth ? `${cw}px` : ''
      this.root.style.right = cw > 0 && cw < window.innerWidth ? 'auto' : ''
    }
    this.root.classList.toggle('is-mobile', mobile)
    this.root.classList.toggle('is-lab', lab)
    // where the docked lab panel starts (re-read now and then: it is sticky, so it only moves on resize)
    if (lab && !mobile) {
      if (this.tick++ % 30 === 0) {
        const el = document.querySelector('.chapter[data-chapter="branes"] .step--lab .lab')
        const r = el?.getBoundingClientRect()
        this.panelLeft = r && r.width > 0 && r.top < window.innerHeight && r.bottom > 0 ? r.left : 0
      }
    } else this.panelLeft = 0
    if (beat !== this.beat) {
      this.beat = beat
      this.root.dataset.b = beat
    }
  }
  dispose() {
    this.root.remove()
  }
}
