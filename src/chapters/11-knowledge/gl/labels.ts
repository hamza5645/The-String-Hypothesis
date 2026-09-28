import * as THREE from 'three'
import { smoothstep } from '@/core/math'

/*
 * A light DOM label layer in the shared #scene-labels layer (above the canvas, below the text).
 * One absolutely positioned element per label; projected once per frame from 3D (or placed in
 * screen px), faded by a per-frame target opacity. Collision-aware labels (`cull` / `must`) try
 * the right, left, above and below of their anchor before giving up; node glyphs (obstacles, set
 * each frame by the Scene) and the chapter rail's active label are never covered. `must` labels
 * (the ones that carry a beat's lesson) are never culled: they are placed first and displace the
 * rest. Labels fade out from under the narrative column (the "safe" zone) instead of colliding.
 * All content is authored text, built with textContent (no HTML strings).
 */

export type Align = 'left' | 'right' | 'center' | 'above' | 'below' | 'auto'

/** Tiny DOM builder: el('div', 'cls', 'text' | children[]) */
export function el(tag: string, cls = '', kids?: string | (Node | string | null | undefined)[]): HTMLElement {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (typeof kids === 'string') e.textContent = kids
  else if (kids) for (const k of kids) if (k != null) e.append(k)
  return e
}

export interface Lbl {
  el: HTMLElement
  pos: THREE.Vector3
  inMap: boolean
  screen: boolean
  align: Align
  dx: number
  dy: number
  target: number
  o: number
  x: number
  y: number
  w: number
  h: number
  prio: number
  cull: boolean
  /** never culled; tries every side, displaces lower-priority labels */
  must: boolean
  /** occupies space (others avoid it) but never moves */
  solid: boolean
  safe: boolean
  clamp: boolean
  hot: boolean
  _hot: boolean
  _t: string
  _vis: boolean
  _side: number
  /** last chosen candidate side (hysteresis) */
  _cand: number
  text?: HTMLElement
  _txt: string
}

export interface LblOpts {
  cls?: string
  align?: Align
  dx?: number
  dy?: number
  inMap?: boolean
  screen?: boolean
  prio?: number
  cull?: boolean
  must?: boolean
  solid?: boolean
  safe?: boolean
  /** hide when any part would leave the viewport (default true) */
  clamp?: boolean
}

export interface LabelText {
  text: string
  sub?: string
  tag?: string
}

const v = new THREE.Vector3()
/**
 * Candidate sides: 0 right-of-anchor ('left' align), 1 left-of-anchor ('right'), 2 above, 3 below,
 * 4 centred, 5 above-right, 6 below-right, 7 above-left, 8 below-left (the diagonals slip into gaps)
 */
const SIDE: Record<Exclude<Align, 'auto'>, number> = { left: 0, right: 1, above: 2, below: 3, center: 4 }
const FALLBACK = [0, 1, 5, 6, 7, 8, 2, 3]
const CAND = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const R = [0, 0]
function rect(l: Lbl, c: number, out: number[]) {
  let ax = l.x + l.dx
  let ay = l.y + l.dy - l.h / 2
  if (c === 0) ax = l.x + (l.dx || 12)
  else if (c === 1) ax = l.x - (l.dx || 12) - l.w
  else if (c === 4) ax = l.x - l.w / 2 + l.dx
  else if (c === 2 || c === 3) {
    const own = l.align === 'above' || l.align === 'below'
    ax = l.x - l.w / 2 + (own ? l.dx : 0)
    const d = own ? l.dy || 12 : 13
    ay = c === 2 ? l.y - l.h - d : l.y + d
  } else if (c >= 5) {
    // diagonal: the label's near corner a little off the glyph
    const right = c === 5 || c === 6
    ax = right ? l.x + 6 : l.x - 6 - l.w
    ay = c === 5 || c === 7 ? l.y - l.h - 9 : l.y + 9
  }
  out[0] = ax
  out[1] = ay
}

export class LabelLayer {
  root: HTMLDivElement
  items: Lbl[] = []
  private placed: number[] = []
  /** Screen discs (x, y, r) labels must not cover: the visible node glyphs, written by the Scene. */
  obs = new Float32Array(3 * 224)
  nObs = 0
  /** Right edge labels may reach (px from the left); set per frame by the Scene (clear of the rail). */
  right = 0
  /** Screen rects (x0, y0, x1, y1) that `safe` labels must keep out of — e.g. the narrative text on phones. */
  private resv = new Float32Array(4 * 8)
  private nResv = 0
  private rail = { x0: 0, y0: 0, x1: 0, y1: 0, on: false, t: -1 }
  private clock = 0

  constructor(host: HTMLElement, cls = '') {
    this.root = document.createElement('div')
    this.root.className = `kn-layer ${cls}`
    this.root.setAttribute('aria-hidden', 'true')
    host.appendChild(this.root)
  }

  destroy() {
    this.root.remove()
    this.items = []
  }

  /** Add a label: plain text parts (main line, optional sub-line and tag) or a prebuilt element. */
  add(content: LabelText | HTMLElement, pos: [number, number, number] = [0, 0, 0], o: LblOpts = {}): Lbl {
    let node: HTMLElement
    let text: HTMLElement | undefined
    if (content instanceof HTMLElement) {
      node = el('div', `kn-lbl ${o.cls ?? ''}`, [content])
      text = (content.querySelector('[data-t]') as HTMLElement) ?? undefined
    } else {
      text = el('span', 'kn-lbl__main', content.text)
      node = el('div', `kn-lbl ${o.cls ?? ''}`, [text, content.sub ? el('span', 'kn-lbl__sub', content.sub) : null, content.tag ? el('span', 'kn-lbl__tag', content.tag) : null])
    }
    this.root.appendChild(node)
    const l: Lbl = {
      el: node,
      pos: new THREE.Vector3(...pos),
      inMap: o.inMap ?? true,
      screen: o.screen ?? false,
      align: o.align ?? 'left',
      dx: o.dx ?? 0,
      dy: o.dy ?? 0,
      target: 0,
      o: 0,
      x: -1e4,
      y: -1e4,
      w: 0,
      h: 0,
      prio: o.prio ?? 0,
      cull: o.cull ?? false,
      must: o.must ?? false,
      solid: o.solid ?? false,
      safe: o.safe ?? true,
      clamp: o.clamp ?? true,
      hot: false,
      _hot: false,
      _t: '',
      _vis: false,
      _side: 1,
      _cand: -1,
      text,
      _txt: '',
    }
    this.items.push(l)
    return l
  }

  reserve(x0: number, y0: number, x1: number, y1: number) {
    if (this.nResv >= 8) return
    const i = this.nResv++ * 4
    this.resv[i] = x0
    this.resv[i + 1] = y0
    this.resv[i + 2] = x1
    this.resv[i + 3] = y1
  }
  /** Is the point inside a reserved rect (grown by `pad`)? For anchors that can choose where to sit. */
  reserved(x: number, y: number, pad = 0) {
    return this.inResv(x - pad, y - pad, 2 * pad, 2 * pad)
  }
  private inResv(ax: number, ay: number, w: number, h: number) {
    const r = this.resv
    for (let j = 0; j < this.nResv * 4; j += 4) if (ax < r[j + 2] + 8 && ax + w + 8 > r[j] && ay < r[j + 3] + 6 && ay + h + 6 > r[j + 1]) return true
    return false
  }
  addObstacle(x: number, y: number, r: number) {
    if (this.nObs >= 224) return
    const i = this.nObs++ * 3
    this.obs[i] = x
    this.obs[i + 1] = y
    this.obs[i + 2] = r
  }

  /** The chapter rail's active label (desktop), re-measured about twice a second. */
  private measureRail(now: number) {
    const r = this.rail
    if (now - r.t < 0.5 && r.t >= 0) return
    r.t = now
    const e = document.querySelector('.rail__item.is-active .rail__label') as HTMLElement | null
    const b = e?.getBoundingClientRect()
    r.on = !!b && b.width > 0 && getComputedStyle(e!).opacity !== '0'
    if (b) {
      r.x0 = b.left - 16
      r.y0 = b.top - 16
      r.x1 = b.right + 16
      r.y1 = b.bottom + 16
    }
  }

  private hits(ax: number, ay: number, w: number, h: number) {
    const p = this.placed
    for (let j = 0; j < p.length; j += 4) if (ax < p[j + 2] + 6 && ax + w + 6 > p[j] && ay < p[j + 3] + 2 && ay + h + 2 > p[j + 1]) return true
    const o = this.obs
    for (let j = 0; j < this.nObs * 3; j += 3) {
      const r = o[j + 2] + 2
      if (ax < o[j] + r && ax + w > o[j] - r && ay < o[j + 1] + r && ay + h > o[j + 1] - r) return true
    }
    return false
  }

  private hitCount(ax: number, ay: number, w: number, h: number) {
    let n = 0
    const p = this.placed
    for (let j = 0; j < p.length; j += 4) if (ax < p[j + 2] + 6 && ax + w + 6 > p[j] && ay < p[j + 3] + 2 && ay + h + 2 > p[j + 1]) n += 2
    const o = this.obs
    for (let j = 0; j < this.nObs * 3; j += 3) {
      const r = o[j + 2] + 2
      if (ax < o[j] + r && ax + w > o[j] - r && ay < o[j + 1] + r && ay + h > o[j + 1] - r) n++
    }
    return n
  }

  /** Replace a label's main text (only when it changed). */
  setText(l: Lbl, s: string) {
    if (s === l._txt || !l.text) return
    l._txt = s
    l.text.textContent = s
    l.w = 0
  }

  update(camera: THREE.Camera, map: THREE.Matrix4, W: number, H: number, presence: number, dt: number, safeLeft: number, safeBottom = 0, safeRight = 0) {
    // priority order (stable insertion sort; the list is nearly sorted frame to frame)
    const items = this.items
    for (let i = 1; i < items.length; i++) {
      const x = items[i]
      let j = i - 1
      while (j >= 0 && items[j].prio < x.prio) {
        items[j + 1] = items[j]
        j--
      }
      items[j + 1] = x
    }
    const k = dt > 0 ? 1 - Math.exp(-12 * dt) : 1
    const placed = this.placed
    placed.length = 0
    this.clock += dt > 0 ? dt : 0.5
    this.measureRail(this.clock)
    const rail = this.rail
    const rightLim = this.right > 0 ? this.right : W - 8
    for (let i = 0; i < items.length; i++) {
      const l = items[i]
      let want = l.target * presence
      if (want <= 0.002 && l.o <= 0.004) {
        if (l._vis) {
          l.el.style.visibility = 'hidden'
          l.el.style.opacity = '0'
          l._vis = false
          l.o = 0
        }
        continue
      }
      if (!l.screen) {
        v.copy(l.pos)
        if (l.inMap) v.applyMatrix4(map)
        v.project(camera)
        if (v.z > 1 || v.z < -1) want = 0
        l.x = (v.x * 0.5 + 0.5) * W
        l.y = (0.5 - v.y * 0.5) * H
      }
      if (!l.w) {
        l.w = l.el.offsetWidth
        l.h = l.el.offsetHeight
      }
      let align = l.align
      if (align === 'auto') align = l.x > W * 0.8 || (l._side < 0 && l.x > W * 0.76) ? 'right' : 'left'
      const smart = (l.cull || l.must) && want > 0.05
      // candidate sides: the preferred one first, then last frame's choice (so a displaced label
      // stays put rather than hopping), then the rest
      let nC = 1
      CAND[0] = SIDE[align]
      if (smart) {
        const pref = SIDE[align]
        nC = 1
        if (l._cand >= 0 && l._cand !== pref) CAND[nC++] = l._cand
        for (const c of FALLBACK) if (c !== l._cand && c !== pref) CAND[nC++] = c
      }
      let chosen = -1
      let bestCost = 1e9
      let bestSafe = -1
      let bestC = CAND[0]
      let fx = 0
      let fy = 0
      let fs = 1
      for (let ci = 0; ci < nC; ci++) {
        const c = CAND[ci]
        rect(l, c, R)
        const ax = R[0]
        const ay = R[1]
        let sf = 1
        if (l.safe && safeLeft > 0) sf *= smoothstep(safeLeft - 16, safeLeft + 40, ax)
        if (l.safe && safeBottom > 0) sf *= 1 - smoothstep(safeBottom - 30, safeBottom + 6, ay + l.h)
        if (l.safe && safeRight > 0) sf *= 1 - smoothstep(safeRight - 30, safeRight + 6, ax + l.w)
        if (l.safe && this.nResv > 0 && this.inResv(ax, ay, l.w, l.h)) sf = 0
        const out = l.clamp && (ax < 8 || ax + l.w > rightLim || ay < 54 || ay + l.h > H - 6)
        const onRail = rail.on && l.clamp && ax < rail.x1 && ax + l.w > rail.x0 && ay < rail.y1 && ay + l.h > rail.y0
        if (!smart) {
          fx = ax
          fy = ay
          fs = out || onRail ? 0 : sf
          chosen = c
          break
        }
        if (out || onRail) continue
        // a must label that finds no free side takes the clearest one (fewest things covered)
        const cost = l.must ? this.hitCount(ax, ay, l.w, l.h) - sf * 0.5 : 0
        if (sf >= 0.5 && cost < bestCost) {
          bestCost = cost
          bestC = c
          bestSafe = sf
        } else if (bestSafe < 0.5 && sf > bestSafe) {
          bestSafe = sf
          bestC = c
        }
        if (sf < 0.5) continue
        if (this.hits(ax, ay, l.w, l.h)) continue
        chosen = c
        fx = ax
        fy = ay
        fs = sf
        break
      }
      if (smart && chosen < 0) {
        if (l.must && bestSafe >= 0) {
          // never culled: take the clearest in-bounds side even if it overlaps something lesser
          rect(l, bestC, R)
          chosen = bestC
          fx = R[0]
          fy = R[1]
          fs = bestSafe
        } else {
          want = 0
          rect(l, l._cand >= 0 ? l._cand : CAND[0], R)
          fx = R[0]
          fy = R[1]
        }
      }
      if (chosen >= 0 && smart) l._cand = chosen
      l._side = chosen === 1 ? -1 : 1
      want *= fs
      const ax = fx
      const ay = fy
      if ((smart || l.solid) && want > 0.05) placed.push(ax, ay, ax + l.w, ay + l.h)
      l.o += (want - l.o) * k
      const op = l.o < 0.01 ? 0 : l.o
      const vis = op > 0
      if (vis !== l._vis) {
        l.el.style.visibility = vis ? 'visible' : 'hidden'
        l._vis = vis
      }
      if (!vis) continue
      l.el.style.opacity = op.toFixed(3)
      const t = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0)`
      if (t !== l._t) {
        l.el.style.transform = t
        l._t = t
      }
      if (l.hot !== l._hot) {
        l.el.classList.toggle('is-hot', l.hot)
        l._hot = l.hot
      }
    }
    // obstacles and reserved rects are rebuilt by their owners every frame
    this.nObs = 0
    this.nResv = 0
  }
}
