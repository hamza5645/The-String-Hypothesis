/*
 * Tiny imperative DOM/SVG kit for the stage's diagram layer. Elements are built once per layout
 * and mutated per frame through cached setters (a write only happens when a value changes).
 */
import { STATUS_INFO, type StatusKind } from '@/ui'

export const SVGNS = 'http://www.w3.org/2000/svg'

type Attrs = Record<string, string | number | undefined>

export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVGNS, tag)
  for (const k in attrs) if (attrs[k] !== undefined) el.setAttribute(k, String(attrs[k]))
  parent?.appendChild(el)
  return el
}

/** An HTML element; `text` becomes a text node (never parsed as markup). */
export function el<K extends keyof HTMLElementTagNameMap = 'div'>(cls: string, parent?: Element, text?: string, tag?: K): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag ?? 'div') as HTMLElementTagNameMap[K]
  e.className = cls
  if (text !== undefined) e.textContent = text
  parent?.appendChild(e)
  return e
}
export const div = (cls: string, parent?: Element, text?: string) => el(cls, parent, text, 'div')
export const span = (cls: string, parent?: Element, text?: string) => el(cls, parent, text, 'span')

const cache = new WeakMap<Element, Record<string, string>>()
const c = (e: Element) => {
  let v = cache.get(e)
  if (!v) cache.set(e, (v = {}))
  return v
}
const numCache = new WeakMap<Element, Record<string, number>>()
const nums = (e: Element) => {
  let v = numCache.get(e)
  if (!v) numCache.set(e, (v = {}))
  return v
}

/** set attribute if changed (numbers are compared before any string is built) */
export function sa(e: Element, k: string, v: number | string) {
  const m = c(e)
  if (typeof v === 'number') {
    const n = nums(e)
    if (n[k] !== undefined && Math.abs(n[k] - v) < 0.005 * Math.max(1, Math.abs(v) * 1e-4)) return
    n[k] = v
    e.setAttribute(k, Math.abs(v) < 1e6 ? v.toFixed(2) : v.toExponential(4))
    return
  }
  if (m[k] === v) return
  m[k] = v
  e.setAttribute(k, v)
}

/** opacity (and visibility) if changed */
export function op(e: HTMLElement | SVGElement, v: number) {
  const x = !(v > 0.004) ? 0 : v > 0.996 ? 1 : v
  const n = nums(e)
  if (n.__op !== undefined && Math.abs(n.__op - x) < 0.0015 && (x === 0) === (n.__op === 0)) return
  n.__op = x
  e.style.opacity = x.toFixed(3)
  const m = c(e)
  const vis = x === 0 ? 'hidden' : 'visible'
  if (m.__vis !== vis) {
    m.__vis = vis
    e.style.visibility = vis
  }
}

/** translate an absolutely-positioned HTML element (px), with an optional extra transform */
export function at(e: HTMLElement | SVGElement, x: number, y: number, extra = '') {
  const n = nums(e)
  const m = c(e)
  if (n.__x !== undefined && Math.abs(n.__x - x) < 0.05 && Math.abs(n.__y - y) < 0.05 && m.__ex === extra) return
  n.__x = x
  n.__y = y
  m.__ex = extra
  e.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${extra}`
}

export function txt(e: Element, s: string) {
  const m = c(e)
  if (m.__tx === s) return
  m.__tx = s
  e.textContent = s
}

export function toggle(e: Element, name: string, on: boolean) {
  const m = c(e)
  const k = '__c_' + name
  const v = on ? '1' : '0'
  if (m[k] === v) return
  m[k] = v
  e.classList.toggle(name, on)
}

/** A status chip (same markup and classes as <Status/> from @/ui). */
export function chip(kind: StatusKind, parent?: Element, compact = true): HTMLSpanElement {
  const info = STATUS_INFO[kind]
  const s = span(`status status--${kind}${compact ? ' status--compact' : ''}`, parent)
  s.title = info.meaning
  const i = document.createElement('i')
  i.className = 'status__mark'
  s.appendChild(i)
  span('status__label', s, info.label)
  return s
}

export const line = (parent: Element, attrs: Attrs = {}) => svg('line', attrs, parent)
export const path = (parent: Element, attrs: Attrs = {}) => svg('path', attrs, parent)

export function setLine(e: SVGLineElement, x1: number, y1: number, x2: number, y2: number) {
  sa(e, 'x1', x1)
  sa(e, 'y1', y1)
  sa(e, 'x2', x2)
  sa(e, 'y2', y2)
}

/** Absolutely-positioned label: a mono caption of one or more lines. */
export function label(parent: Element, cls: string, lines: string[]): HTMLDivElement {
  const d = div(`sp-lbl ${cls}`, parent)
  for (let i = 0; i < lines.length; i++) span(i === 0 ? 'sp-lbl__a' : 'sp-lbl__b', d, lines[i])
  return d
}

/** A display moment: mono kicker, a large Bodoni value, and mono sub-lines (each can be faded on its own). */
export interface Display {
  el: HTMLDivElement
  k: HTMLSpanElement
  v: HTMLSpanElement
  s: HTMLSpanElement[]
}
export function display(parent: Element, cls: string, k: string, v: string, subs: string[] = []): Display {
  const el = div(`sp-disp ${cls}`, parent)
  const kk = span('sp-disp__k', el, k)
  const vv = span('sp-disp__v', el, v)
  return { el, k: kk, v: vv, s: subs.map((t) => span('sp-disp__s', el, t)) }
}
