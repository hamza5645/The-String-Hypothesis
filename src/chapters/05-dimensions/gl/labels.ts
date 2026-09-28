import * as THREE from 'three'
import type { StatusKind } from '@/ui'

/**
 * A tiny imperative label layer for this chapter's figure annotations (mono captions pinned to
 * 3D points, to the camera-attached HUD plane, or to screen fractions). One container in the shared
 * #scene-labels layer, one projection pass per frame, DOM writes only when something changed.
 * (drei <Html> would mount one React root per label; this chapter has ~80.)
 */

export type LabelAlign = 'left' | 'right' | 'center' | 'above' | 'below'
export type LabelTone = 'ink' | 'dim' | 'field' | 'filament' | 'ink2'

export interface LabelOpts {
  align?: LabelAlign
  tone?: LabelTone
  size?: 'sm' | 'md' | 'lg' | 'xs'
  cls?: string
  /** Static leading chip (rendered like the site's compact Status chip). */
  chip?: StatusKind
  /** Initial live text (replaceable per frame via .text()). */
  text?: string
  /** Static HTML appended after the live text. */
  html?: string
}

const CHIP_LABEL: Record<StatusKind, string> = {
  observed: 'Observed',
  derived: 'Derived',
  conjectured: 'Conjectured',
  speculative: 'Speculative',
  analogy: 'Analogy',
}
export const chipHtml = (k: StatusKind) =>
  `<span class="status status--${k} status--compact dim-chip"><i class="status__mark" aria-hidden="true"></i><span class="status__label">${CHIP_LABEL[k]}</span></span>`

/** HUD plane distance in front of the camera (camera space z = −HUD_Z). */
export const HUD_Z = 10

export class Label {
  el: HTMLDivElement
  inner: HTMLSpanElement
  t: HTMLSpanElement
  mode = 0 // 0 world, 1 hud, 2 screen
  x = 0
  y = 0
  z = 0
  o = 0
  private lo = -1
  private lx = NaN
  private ly = NaN
  private lt: string
  private lvis = true
  constructor(parent: HTMLElement, opts: LabelOpts) {
    const el = document.createElement('div')
    el.className = `scene-label dim-label scene-label--${opts.align ?? 'left'} scene-label--${opts.tone === 'ink2' ? 'ink' : (opts.tone ?? 'ink')} dim-label--${opts.size ?? 'sm'}${opts.tone === 'ink2' ? ' dim-label--ink2' : ''}${opts.cls ? ' ' + opts.cls : ''}`
    el.style.opacity = '0'
    el.style.visibility = 'hidden'
    const inner = document.createElement('span')
    inner.className = 'scene-label__text'
    if (opts.chip) inner.insertAdjacentHTML('beforeend', chipHtml(opts.chip))
    const t = document.createElement('span')
    t.className = 'dim-label__t'
    t.textContent = opts.text ?? ''
    inner.appendChild(t)
    if (opts.html) inner.insertAdjacentHTML('beforeend', opts.html)
    el.appendChild(inner)
    parent.appendChild(el)
    this.el = el
    this.inner = inner
    this.t = t
    this.lt = opts.text ?? ''
    this.lvis = false
  }
  /** Pin to a world point. */
  at(x: number, y: number, z: number) {
    this.mode = 0
    this.x = x
    this.y = y
    this.z = z
    return this
  }
  /** Pin to HUD plane coordinates (world units at distance HUD_Z in front of the camera). */
  hud(x: number, y: number) {
    this.mode = 1
    this.x = x
    this.y = y
    return this
  }
  /** Pin to screen fractions (0..1 from top-left). */
  scr(fx: number, fy: number) {
    this.mode = 2
    this.x = fx
    this.y = fy
    return this
  }
  op(o: number) {
    this.o = o
    return this
  }
  text(s: string) {
    if (s !== this.lt) {
      this.lt = s
      this.t.textContent = s
    }
    return this
  }
  /** Called by the layer after projection. */
  apply(px: number, py: number, presence: number) {
    const o = Math.max(0, Math.min(1, this.o * presence))
    const vis = o > 0.01
    if (vis !== this.lvis) {
      this.lvis = vis
      this.el.style.visibility = vis ? 'visible' : 'hidden'
    }
    if (!vis) {
      if (this.lo !== 0) {
        this.el.style.opacity = '0'
        this.lo = 0
      }
      return
    }
    if (Math.abs(o - this.lo) > 0.004) {
      this.lo = o
      this.el.style.opacity = o.toFixed(3)
    }
    if (!(Math.abs(px - this.lx) <= 0.25 && Math.abs(py - this.ly) <= 0.25)) {
      this.lx = px
      this.ly = py
      this.el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`
    }
  }
}

const v = new THREE.Vector3()

export class LabelLayer {
  root: HTMLDivElement
  list: Label[] = []
  constructor() {
    this.root = document.createElement('div')
    this.root.className = 'dim-labels'
  }
  /** Mount into the shared #scene-labels layer (from an effect; StrictMode-safe). */
  attach() {
    const host = document.getElementById('scene-labels') ?? document.body
    if (this.root.parentNode !== host) host.appendChild(this.root)
  }
  detach() {
    this.root.remove()
  }
  make(opts: LabelOpts = {}) {
    const l = new Label(this.root, opts)
    this.list.push(l)
    return l
  }
  /** Project and write every label. Call once per frame after the camera has moved. */
  flush(camera: THREE.PerspectiveCamera, W: number, H: number, presence: number, visR = 1) {
    camera.updateMatrixWorld()
    for (const l of this.list) {
      if (l.o <= 0.001) {
        l.apply(0, 0, 0)
        continue
      }
      let px = 0
      let py = 0
      if (l.mode === 2) {
        // screen fractions are of the visible width (see Timeline.visR)
        px = l.x * W * visR
        py = l.y * H
      } else {
        if (l.mode === 0) v.set(l.x, l.y, l.z).project(camera)
        else v.set(l.x, l.y, -HUD_Z).applyMatrix4(camera.projectionMatrix)
        if (v.z > 1 || v.z < -1) {
          l.apply(0, 0, 0)
          continue
        }
        px = (v.x * 0.5 + 0.5) * W
        py = (-v.y * 0.5 + 0.5) * H
      }
      l.apply(px, py, presence)
    }
  }
  hideAll() {
    for (const l of this.list) l.apply(0, 0, 0)
  }
}
