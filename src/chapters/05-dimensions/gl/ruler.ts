import { smoothstep } from '@/core/math'
import { E_ELECTRON, E_PROTON, GAP_52, HBARC, KLEIN_R, LHC_EV, PLANCK_E, PLANCK_L, R_GRAV, R_UED_FULL, R_UED_START, formatEnergy, formatLength, sup } from '../constants'
import { C_FIELD, C_INK, C_INK2, C_INK3, C_SPEC, sg, type HairLinesApi } from './HairLines'
import type { Label, LabelLayer } from './labels'

/*
 * The mirrored log slide rule (content pack Beat 6 and the FIT station):
 *   upper rail: R from 1.6×10⁻³⁵ m (left) to 1 mm (right), a tick every decade
 *   lower rail: ħc/R in eV at the same positions (energy grows to the left) — one slide rule
 * Shaded (● OBSERVED, published bounds): R ≳ 1.1–1.4×10⁻¹⁹ m if all particles feel the circle
 * (model-dependent gradient), R > 30 µm if only gravity does (○ speculative scenario). Soft band
 * 1.6×10⁻³⁵ … ~10⁻³⁰ m: many (not all) string models, ○ SPECULATIVE — soft edges, no peak at the Planck length.
 *
 * Layout (px from the upper rail, up = +):  +82 gravity sub-label · +64 gravity label / R title ·
 * +44 zone labels · +4…+28 the two hatched bands · rail · −12 decades · −40/−58 markers ·
 * energy rail at −rail gap · −12 energy decades · −36/−52 energy references.
 */

export const LR_MIN = Math.log10(PLANCK_L) // −34.79
export const LR_MAX = -3
const LE_OFF = Math.log10(HBARC) // log10 E = LE_OFF − log10 R

export interface RulerOpts {
  x0: number
  x1: number
  y: number
  alpha: number
  /** 0..1 left→right draw-in. */
  reveal: number
  collider: number
  gravity: number
  markers: number
  band: number
  refs: number
  /** Current R for the FIT cursor (m), or 0 for none. */
  cursor: number
  compact: boolean
  /** Lab (FIT) layout: only the active zone is labelled, on its own row above the band's label. */
  lab?: boolean
  /** Units per CSS px (for pixel-true spacing). */
  upx: number
}

export class RulerFig {
  L: Record<string, Label> = {}
  dec: Label[] = []
  edec: Label[] = []
  constructor(layer: LabelLayer) {
    const m = (k: string, o: Parameters<LabelLayer['make']>[0]) => (this.L[k] = layer.make(o))
    m('title', { tone: 'dim', align: 'left', cls: 'dim-rule__t', text: 'RADIUS OF A HIDDEN CIRCLE, R  →' })
    m('etitle', { tone: 'dim', align: 'right', cls: 'dim-rule__t', text: '←  ħc/R · ENERGY TO EXCITE IT' })
    m('planck', { tone: 'ink2', align: 'left', cls: 'dim-rule__m', text: 'Planck length 1.6×10⁻³⁵ m' })
    m('klein', { tone: 'ink2', align: 'left', cls: 'dim-rule__m', text: 'Klein 1926 · R ~ 10⁻³³ m' })
    m('proton', { tone: 'ink2', align: 'center', cls: 'dim-rule__m', text: 'proton radius 0.84×10⁻¹⁵ m' })
    m('gap', { tone: 'ink2', align: 'right', cls: 'dim-rule__m', text: '52 µm · closest gap tested' })
    m('coll', { tone: 'ink', align: 'left', cls: 'dim-rule__z', chip: 'observed', text: 'EXCLUDED IF ALL PARTICLES FEEL IT · MODEL-DEPENDENT' })
    m('grav', { tone: 'ink', align: 'right', cls: 'dim-rule__z', chip: 'observed', text: 'EXCLUDED EVEN IF ONLY GRAVITY FEELS IT' })
    m('gravsub', { tone: 'dim', align: 'right', cls: 'dim-rule__zs', text: '○ gravity-only = speculative braneworld' })
    m('band', { tone: 'dim', align: 'left', cls: 'dim-rule__z', chip: 'speculative', text: 'MANY (NOT ALL) STRING MODELS' })
    m('eEl', { tone: 'ink2', align: 'center', cls: 'dim-rule__m', text: 'electron' })
    m('ePr', { tone: 'ink2', align: 'center', cls: 'dim-rule__m', text: 'proton' })
    m('eLhc', { tone: 'ink2', align: 'center', cls: 'dim-rule__m', text: 'LHC collisions 13.6 TeV' })
    m('ePl', { tone: 'ink2', align: 'left', cls: 'dim-rule__m', text: 'Planck energy' })
    m('curR', { tone: 'ink', align: 'center', cls: 'dim-rule__cur', text: '' })
    m('curE', { tone: 'ink', align: 'center', cls: 'dim-rule__cur', text: '' })
    m('curX', { tone: 'ink', align: 'center', cls: 'dim-rule__cur dim-rule__x', chip: 'observed', text: '' })
    for (let e = -30; e <= -5; e += 5) this.dec.push(layer.make({ tone: 'dim', align: 'below', cls: 'dim-rule__d', text: `10${sup(e)} m` }))
    this.dec.push(layer.make({ tone: 'dim', align: 'below', cls: 'dim-rule__d', text: '1 mm' }))
    for (let e = 25; e >= -3; e -= 5) this.edec.push(layer.make({ tone: 'dim', align: 'below', cls: 'dim-rule__d', text: e === 0 ? '1 eV' : `10${sup(e)} eV` }))
  }

  hide() {
    for (const l of Object.values(this.L)) l.op(0)
    for (const l of this.dec) l.op(0)
    for (const l of this.edec) l.op(0)
  }

  xOf(o: RulerOpts, R: number) {
    return o.x0 + ((Math.log10(R) - LR_MIN) / (LR_MAX - LR_MIN)) * (o.x1 - o.x0)
  }

  draw(Ln: HairLinesApi, o: RulerOpts) {
    const a = o.alpha
    if (a <= 0.001) {
      this.hide()
      return
    }
    const { x0, x1, y, upx } = o
    const px = upx
    const xr = x0 + (x1 - x0) * o.reveal
    const yE = y - (o.compact ? 70 : 84) * px // the mirrored energy rail
    const X = (lr: number) => x0 + ((lr - LR_MIN) / (LR_MAX - LR_MIN)) * (x1 - x0)
    const vis = (x: number) => smoothstep(xr + 20 * px, xr - 10 * px, x)
    const L = this.L
    // phones: the rule is narrow, so labels switch to short forms and zone labels stack right-aligned;
    // mid-width rules (the desktop lab) keep the numbers but shorten the names that would collide
    const wpx = (x1 - x0) / px
    const narrow = wpx < 560
    const mid = wpx < 800
    L.planck.text(narrow ? 'Planck length' : 'Planck length 1.6×10⁻³⁵ m')
    L.klein.text(narrow ? 'Klein 1926' : 'Klein 1926 · R ~ 10⁻³³ m')
    L.proton.text(narrow ? 'proton' : mid ? 'proton 0.84×10⁻¹⁵ m' : 'proton radius 0.84×10⁻¹⁵ m')
    L.gap.text(narrow ? '52 µm' : mid ? '52 µm tested' : '52 µm · closest gap tested')
    L.ePl.text(narrow ? 'Planck' : 'Planck energy')
    L.eLhc.text(narrow ? 'LHC 13.6 TeV' : 'LHC collisions 13.6 TeV')
    L.coll.text(mid ? 'EXCLUDED IF ALL FEEL IT · MODEL-DEPENDENT' : 'EXCLUDED IF ALL PARTICLES FEEL IT · MODEL-DEPENDENT')
    L.grav.text(narrow ? 'EXCLUDED IF ONLY GRAVITY FEELS IT' : 'EXCLUDED EVEN IF ONLY GRAVITY FEELS IT')
    L.coll.el.classList.toggle('dim-rule__z--r', mid)

    // rails (+ a faint connector at both ends: one slide rule)
    sg(Ln, x0, y, 0, xr, y, 0, C_FIELD, 0.75 * a, 1)
    sg(Ln, x0, yE, 0, xr, yE, 0, C_FIELD, 0.55 * a, 1)
    sg(Ln, x0, y, 0, x0, yE, 0, C_FIELD, 0.18 * a, 1)
    sg(Ln, x1, y, 0, x1, yE, 0, C_FIELD, 0.18 * a * vis(x1), 1)
    // R decade ticks (down from the upper rail), E decade ticks (down from the energy rail)
    for (let e = -34; e <= -3; e++) {
      const x = X(e)
      const v = vis(x) * a
      if (v <= 0.001) continue
      const major = e % 5 === 0
      sg(Ln, x, y, 0, x, y - (major ? 8 : 4) * px, 0, C_FIELD, (major ? 0.8 : 0.4) * v, 1)
    }
    for (let le = -3; le <= 28; le++) {
      const x = X(LE_OFF - le)
      if (x < x0 - 1e-6 || x > x1 + 1e-6) continue
      const v = vis(x) * a
      if (v <= 0.001) continue
      const major = le % 5 === 0
      sg(Ln, x, yE, 0, x, yE - (major ? 8 : 4) * px, 0, C_FIELD, (major ? 0.7 : 0.32) * v, 1)
    }
    // decade labels (every 5 decades; every 10 when compact). Skip the two that markers already name.
    const step = o.compact ? 2 : 1
    this.dec.forEach((l, i) => {
      const e = i < 6 ? -30 + 5 * i : -3
      const x = X(e)
      const named = e === -15 || e === -5
      const show = i === 6 || (i % step === 0 && !named)
      l.hud(x, y - 11 * px).op(show ? 0.85 * a * vis(x) : 0)
    })
    this.edec.forEach((l, i) => {
      const le = 25 - 5 * i
      const x = X(LE_OFF - le)
      const show = i % step === 0 && x <= x1 && x >= x0
      l.hud(x, yE - 11 * px).op(show ? 0.75 * a * vis(x) : 0)
    })
    L.title.hud(x0, y + 64 * px).op(o.compact ? 0 : 0.85 * a * vis(x0))
    L.etitle.hud(x1, yE - 38 * px).op(o.compact ? 0 : 0.8 * a * vis(x1))

    // ── zones (hatched bands above the rail) ──
    const hatch = (xa: number, xb: number, ya: number, yb: number, alpha: number, c: readonly [number, number, number], rampTo: number) => {
      const sp = 6 * px
      const hgt = yb - ya
      for (let x = xa - hgt; x < xb; x += sp) {
        let ax = x
        let ay = ya
        let bx = x + hgt
        let by = yb
        if (ax < xa) {
          ay += xa - ax
          ax = xa
        }
        if (bx > xb) {
          by -= bx - xb
          bx = xb
        }
        if (bx <= ax) continue
        const mid = 0.5 * (ax + bx)
        const ramp = rampTo > xa ? smoothstep(xa, rampTo, mid) : 1
        const al = alpha * ramp * vis(mid)
        if (al > 0.002) sg(Ln, ax, ay, 0, bx, by, 0, c, al, 1)
      }
      const x2 = Math.min(xb, xr)
      if (x2 > rampTo) sg(Ln, rampTo, yb, 0, x2, yb, 0, c, 0.5 * alpha * vis(rampTo), 1)
    }
    if (o.collider > 0.001) {
      const xa = this.xOf(o, R_UED_START)
      const xf = this.xOf(o, R_UED_FULL)
      hatch(xa, x1, y + 4 * px, y + 14 * px, 0.5 * o.collider * a, C_INK2, xf)
      if (o.lab) L.coll.hud(x1, y + 62 * px).op(o.collider >= 0.99 ? a : 0)
      else L.coll.hud(mid ? x1 : xa, y + 42 * px).op(o.collider * a * vis(xf))
      if (!mid) sg(Ln, xa, y + 16 * px, 0, xa, y + 33 * px, 0, C_INK3, 0.8 * o.collider * a * vis(xa), 1)
    } else L.coll.op(0)
    if (o.gravity > 0.001) {
      const xa = this.xOf(o, R_GRAV)
      hatch(xa, x1, y + 18 * px, y + 28 * px, 0.62 * o.gravity * a, C_INK, xa)
      const gl = o.lab ? (o.gravity >= 0.99 ? 1 : 0) : o.gravity
      L.grav.hud(x1, y + 62 * px).op(gl * a * vis(x1))
      L.gravsub.hud(x1, y + 80 * px).op(0.85 * gl * a * vis(x1))
      if (!narrow) sg(Ln, xa, y + 30 * px, 0, xa, y + 54 * px, 0, C_INK3, 0.8 * o.gravity * a * vis(xa), 1)
    } else {
      L.grav.op(0)
      L.gravsub.op(0)
    }
    // soft band for "many (not all) string models": soft edges, no peak, no marker
    if (o.band > 0.001) {
      const xa = X(LR_MIN)
      const xb = X(-30) + 34 * px
      const n = 48
      for (let i = 0; i < n; i++) {
        const xx0 = xa + ((xb - xa) * i) / n
        const xx1 = xa + ((xb - xa) * (i + 1)) / n
        const m = (0.5 * (xx0 + xx1) - xa) / (xb - xa)
        const soft = smoothstep(0, 0.25, m) * (1 - smoothstep(0.5, 1, m))
        sg(Ln, xx0, y + 9 * px, 0, xx1, y + 9 * px, 0, C_SPEC, 0.3 * soft * o.band * a * vis(xx0), 11)
      }
      L.band.hud(xa, y + (narrow && !o.lab ? 98 : 42) * px).op(0.95 * o.band * a * vis(xa))
    } else L.band.op(0)

    // ── markers (below the upper rail) ──
    const mk = (R: number, l: Label, drop: number) => {
      const x = this.xOf(o, R)
      const v = o.markers * a * vis(x)
      if (v <= 0.001) {
        l.op(0)
        return
      }
      sg(Ln, x, y, 0, x, y - (drop - 5) * px, 0, C_INK3, 0.9 * v, 1)
      l.hud(x, y - drop * px).op(0.92 * v)
    }
    mk(PLANCK_L * 1.0001, L.planck, o.compact ? 50 : 58)
    mk(KLEIN_R, L.klein, o.compact ? 32 : 40)
    mk(0.84e-15, L.proton, o.compact ? 32 : 40)
    mk(GAP_52, L.gap, o.compact ? 32 : 40)
    // energy references (below the energy rail)
    const er = (E: number, l: Label, drop: number) => {
      const x = X(LE_OFF - Math.log10(E))
      const v = o.refs * a * vis(x)
      if (v <= 0.001) {
        l.op(0)
        return
      }
      sg(Ln, x, yE, 0, x, yE - (drop - 7) * px, 0, C_INK3, 0.9 * v, 1)
      l.hud(x, yE - drop * px).op(0.85 * v)
    }
    er(E_ELECTRON, L.eEl, 36)
    er(E_PROTON, L.ePr, 54)
    er(LHC_EV, L.eLhc, 36)
    er(PLANCK_E * 0.9999, L.ePl, 36)

    // ── cursor (FIT station): one vertical line through both rails ──
    if (o.cursor > 0) {
      const x = this.xOf(o, o.cursor)
      const top = y + (o.compact ? 96 : 36) * px // compact (lab): above the zone labels
      sg(Ln, x, top, 0, x, yE - 4 * px, 0, C_INK, 0.95 * a, 1.4)
      sg(Ln, x - 4 * px, top + 6 * px, 0, x, top, 0, C_INK, 0.9 * a, 1.4)
      sg(Ln, x + 4 * px, top + 6 * px, 0, x, top, 0, C_INK, 0.9 * a, 1.4)
      // keep the cursor label inside the rule: anchor it left / right near the ends
      const fr = (x - x0) / (x1 - x0)
      L.curR.el.classList.toggle('dim-cur--l', fr < 0.22)
      L.curR.el.classList.toggle('dim-cur--r', fr > 0.78)
      L.curX.el.classList.toggle('dim-cur--l', fr < 0.22)
      L.curX.el.classList.toggle('dim-cur--r', fr > 0.78)
      // the verdict for this radius, next to the cursor (mirrors the panel's "Ruled out" line)
      const exColl = o.collider >= 0.99 && o.cursor >= R_UED_START
      const exGrav = o.gravity >= 0.99 && o.cursor > R_GRAV
      if (exColl || exGrav) L.curX.text(exColl ? 'EXCLUDED · colliders (model-dependent)' : 'EXCLUDED · torsion balance').hud(x, top + 34 * px).op(a)
      else L.curX.op(0)
      if (o.compact) {
        L.curR.text(`R = ${formatLength(o.cursor)}  ·  ħc/R = ${formatEnergy(HBARC / o.cursor)}`).hud(x, top + 14 * px).op(a)
        L.curE.op(0)
      } else {
        L.curR.text(`R = ${formatLength(o.cursor)}`).hud(x, top + 14 * px).op(a)
        L.curE.text(`ħc/R = ${formatEnergy(HBARC / o.cursor)}`).hud(x, yE - 30 * px).op(a)
      }
    } else {
      L.curR.op(0)
      L.curE.op(0)
      L.curX.op(0)
    }
  }
}
