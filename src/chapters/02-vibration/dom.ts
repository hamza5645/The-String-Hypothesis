// A tiny imperative DOM layer for the scene's figures: mono annotations, the mass ladder, the
// log strip, the particle table. Everything lives in the shared, aria-hidden #scene-labels layer
// (above the canvas, below narrative text). Built with createElement (no HTML strings), and
// writes to the DOM only when a value actually changes.
import * as THREE from 'three'

type Child = Node | string | number | null | undefined | false
type Attrs = Record<string, string | number> | null | undefined

function append(el: Element, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c)
  }
}

/** HTML element helper: h('div', { class: 'x' }, 'text', h('sub', null, 'e')). */
export function h(tag: string, attrs?: Attrs, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag)
  if (attrs) for (const k in attrs) el.setAttribute(k, String(attrs[k]))
  append(el, children)
  return el
}

const SVGNS = 'http://www.w3.org/2000/svg'
/** SVG element helper. */
export function s<T extends SVGElement = SVGElement>(tag: string, attrs?: Attrs, ...children: Child[]): T {
  const el = document.createElementNS(SVGNS, tag) as T
  if (attrs) for (const k in attrs) el.setAttribute(k, String(attrs[k]))
  append(el, children)
  return el
}

export class Fig {
  el: HTMLElement | SVGElement
  private x = NaN
  private y = NaN
  private sc = NaN
  private a = -1
  private t: string | null = null
  /** alignment of the element relative to its anchor, in % of its own size (e.g. −50, −50 = centred) */
  ax = 0
  ay = 0
  constructor(el: HTMLElement | SVGElement, hidden = true, ax = 0, ay = 0) {
    this.el = el
    this.ax = ax
    this.ay = ay
    if (hidden) {
      el.style.opacity = '0'
      el.style.visibility = 'hidden'
    } else this.a = 1
  }
  /** Place the element's origin at (x, y) CSS px, optional uniform scale. */
  at(x: number, y: number, sc = 1) {
    if (Math.abs(x - this.x) < 0.05 && Math.abs(y - this.y) < 0.05 && Math.abs(sc - this.sc) < 1e-4) return this
    this.x = x
    this.y = y
    this.sc = sc
    const al = this.ax || this.ay ? ` translate(${this.ax}%,${this.ay}%)` : ''
    this.el.style.transform =
      sc === 1 ? `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)${al}` : `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)${al} scale(${sc.toFixed(4)})`
    return this
  }
  /** Change the anchor alignment (percent of own size). */
  align(ax: number, ay: number) {
    if (ax !== this.ax || ay !== this.ay) {
      this.ax = ax
      this.ay = ay
      this.x = NaN
    }
    return this
  }
  alpha(v: number) {
    const q = v < 0.004 ? 0 : Math.min(1, Math.round(v * 250) / 250)
    if (q === this.a) return this
    const wasHidden = this.a <= 0
    this.a = q
    this.el.style.opacity = String(q)
    if (q <= 0) this.el.style.visibility = 'hidden'
    else if (wasHidden) this.el.style.visibility = 'visible'
    return this
  }
  get visible() {
    return this.a > 0
  }
  text(str: string) {
    if (str !== this.t) {
      this.t = str
      this.el.textContent = str
    }
    return this
  }
  /** Set a CSS custom property (e.g. highlight strength). */
  prop(name: string, v: number) {
    this.el.style.setProperty(name, v.toFixed(3))
    return this
  }
}

export class Layer {
  root: HTMLDivElement
  private op = -1
  constructor(className = '') {
    this.root = document.createElement('div')
    this.root.className = `vib-layer ${className}`.trim()
    document.getElementById('scene-labels')?.appendChild(this.root)
  }
  /** Add an element (to the layer root or a parent) and wrap it as a figure. */
  add(el: HTMLElement | SVGElement, parent?: Element | null, ax = 0, ay = 0): Fig {
    ;(parent ?? this.root).appendChild(el)
    return new Fig(el, true, ax, ay)
  }
  presence(v: number) {
    const q = Math.round(v * 200) / 200
    if (q === this.op) return
    this.op = q
    this.root.style.opacity = String(q)
    this.root.style.visibility = q <= 0 ? 'hidden' : 'visible'
  }
  dispose() {
    this.root.remove()
  }
}

/** Projects world points to CSS px with a camera (call camera.updateMatrixWorld() first). */
export class Projector {
  w = 1
  h = 1
  private v = new THREE.Vector3()
  camera!: THREE.Camera
  x = 0
  y = 0
  /** False when the point is behind the camera. */
  ok = true
  set(camera: THREE.Camera, w: number, h: number) {
    this.camera = camera
    this.w = w
    this.h = h
  }
  p(x: number, y: number, z = 0) {
    this.v.set(x, y, z).project(this.camera)
    this.x = (this.v.x * 0.5 + 0.5) * this.w
    this.y = (-this.v.y * 0.5 + 0.5) * this.h
    this.ok = this.v.z < 1
    return this
  }
}
