/*
 * The stage's diagram layer: one full-screen SVG (hairlines, dashes, patterns) plus absolutely
 * positioned mono labels, living in the shared #scene-labels layer (above the canvas, below the
 * narrative). Built once per viewport size; updated every frame from the StageState.
 */
import type { StageState } from '../choreo'
import type { Layout } from '../layout'
import { div, op, svg } from './dom'
import { ChartView } from './ChartView'
import { CaptionView } from './CaptionView'
import { EnergyView } from './EnergyView'
import { MapView } from './MapView'
import { QuarterView } from './QuarterView'
import { RoutesView } from './RoutesView'
import { RulerView } from './RulerView'
import { ZoomView } from './ZoomView'

export interface Ctx {
  L: Layout
  svg: SVGSVGElement
  defs: SVGDefsElement
  /** SVG groups in paint order */
  back: SVGGElement
  mid: SVGGElement
  top: SVGGElement
  /** HTML label layer */
  lbl: HTMLDivElement
  /** interactive HTML (pointer-events: auto on children) */
  front: HTMLDivElement
}

export interface View {
  update(S: StageState): void
  destroy?(): void
}

export class Diagram {
  root: HTMLDivElement
  private ctx: Ctx | null = null
  private views: View[] = []
  private W = 0
  private Wc = 0
  private H = 0

  constructor(host: HTMLElement) {
    this.root = div('sp-stage')
    this.root.setAttribute('aria-hidden', 'true')
    host.appendChild(this.root)
  }

  build(L: Layout) {
    if (L.W === this.W && L.Wc === this.Wc && L.H === this.H && this.ctx) return
    this.W = L.W
    this.Wc = L.Wc
    this.H = L.H
    for (const v of this.views) v.destroy?.()
    this.root.replaceChildren()
    const s = svg('svg', { class: 'sp-svg', width: L.Wc, height: L.H, viewBox: `0 0 ${L.Wc} ${L.H}` }, this.root)
    const defs = svg('defs', {}, s)
    buildDefs(defs)
    const back = svg('g', {}, s)
    const mid = svg('g', {}, s)
    const top = svg('g', {}, s)
    const lbl = div('sp-labels', this.root)
    const front = div('sp-front', this.root)
    const ctx: Ctx = { L, svg: s, defs, back, mid, top, lbl, front }
    this.ctx = ctx
    this.views = [
      new ZoomView(ctx),
      new MapView(ctx),
      new ChartView(ctx),
      new RulerView(ctx),
      new QuarterView(ctx),
      new EnergyView(ctx),
      new RoutesView(ctx),
      new CaptionView(ctx),
    ]
  }

  update(S: StageState, presence: number) {
    op(this.root, presence)
    if (presence <= 0 || !this.ctx) return
    for (const v of this.views) v.update(S)
  }

  destroy() {
    for (const v of this.views) v.destroy?.()
    this.views = []
    this.root.remove()
    this.ctx = null
  }
}

function buildDefs(defs: SVGDefsElement) {
  // edge of direct measurement: ink fading into field
  const eg = svg('linearGradient', { id: 'sp-edge', x1: 0, x2: 1, y1: 0, y2: 0 }, defs)
  svg('stop', { offset: 0, 'stop-color': '#ECE6D9', 'stop-opacity': 0.95 }, eg)
  svg('stop', { offset: 1, 'stop-color': '#86A8D8', 'stop-opacity': 0.25 }, eg)
  // soft round glow for beads drawn in SVG
  const rg = svg('radialGradient', { id: 'sp-bead' }, defs)
  svg('stop', { offset: 0, 'stop-color': '#FFFFFF', 'stop-opacity': 1 }, rg)
  svg('stop', { offset: 0.18, 'stop-color': '#ECE6D9', 'stop-opacity': 0.95 }, rg)
  svg('stop', { offset: 0.45, 'stop-color': '#ECE6D9', 'stop-opacity': 0.22 }, rg)
  svg('stop', { offset: 1, 'stop-color': '#ECE6D9', 'stop-opacity': 0 }, rg)
  const fg = svg('radialGradient', { id: 'sp-fieldglow' }, defs)
  svg('stop', { offset: 0, 'stop-color': '#86A8D8', 'stop-opacity': 0.35 }, fg)
  svg('stop', { offset: 1, 'stop-color': '#86A8D8', 'stop-opacity': 0 }, fg)
  // Beat 6 zone fills: cross-hatch ✕ (excluded), hollow rings ○ (speculative), half dots ◑ (derived)
  const hatch = svg('pattern', { id: 'sp-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, defs)
  svg('path', { d: 'M0,0 L7,7 M7,0 L0,7', stroke: '#5C6270', 'stroke-width': 0.7, fill: 'none' }, hatch)
  const rings = svg('pattern', { id: 'sp-rings', width: 11, height: 11, patternUnits: 'userSpaceOnUse' }, defs)
  svg('circle', { cx: 5.5, cy: 5.5, r: 2.2, stroke: '#7D8190', 'stroke-width': 0.8, fill: 'none' }, rings)
  const half = svg('pattern', { id: 'sp-half', width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, defs)
  svg('circle', { cx: 3.5, cy: 3.5, r: 1.9, stroke: '#86A8D8', 'stroke-width': 0.6, fill: 'none' }, half)
  svg('path', { d: 'M3.5,1.6 A1.9,1.9 0 0,0 3.5,5.4 Z', fill: '#86A8D8' }, half)
  // universe mottling (faint)
  const mot = svg('radialGradient', { id: 'sp-uni' }, defs)
  svg('stop', { offset: 0, 'stop-color': '#86A8D8', 'stop-opacity': 0.06 }, mot)
  svg('stop', { offset: 0.92, 'stop-color': '#86A8D8', 'stop-opacity': 0.03 }, mot)
  svg('stop', { offset: 1, 'stop-color': '#86A8D8', 'stop-opacity': 0 }, mot)
}
