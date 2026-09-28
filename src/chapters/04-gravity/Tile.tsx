/*
 * The pattern tile εᵢⱼ — the one literal element on the string side (content pack § Model › Pattern tile).
 * Rows = the right-mover's arrow i (x, y); columns = the left-mover's arrow j (x, y).
 *   spin 2: ε = [[cos 2ψ, sin 2ψ],[sin 2ψ, −cos 2ψ]]   spin 1: e = (cos ψ, sin ψ)   spin 0: δ = [[1,0],[0,1]]
 *   circular: ε(ψ) × cos φ  and  ε(ψ + 45°) × sin φ   (spin 1: e(ψ), e(ψ + 90°))
 * Entries are written to the DOM only when their 2-decimal text changes, never re-rendered by React.
 *
 * Beat 5 choreography owned here (a = the aha step's local progress):
 *   0.46 tile appears · 0.515 the glints' arrows dock and *become* the ↔ / ↕ headers (TILE_DOCK tells the
 *   Thread where they land) · 0.53 xx = +1 lights with a "stretch x" flash on ring and loop · 0.56 yy = −1
 *   with a "squeeze y" flash · 0.585 the lock wires fire · 0.62 "=", +/× glyphs, readout and scale tags.
 */
import { useMemo, useRef, type Ref } from 'react'
import * as THREE from 'three'
import { SceneLabel, COLORS, useChapterFrame } from '@/gl'
import { smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { Status } from '@/ui'
import { D, labelFade, S } from './director'
import { fmt2 } from './model'
import { lineMaterial, Segs, writeArrow } from './lines'
import { PatternGlyph, useGlyph } from './Glyph'

type Mode = 'm2' | 'vec' | 'id' | 'c2' | 'c1'

/**
 * Where the docking arrows land, in CSS px from the tile grid's centre (y down), measured from the DOM so the
 * GL arrow and the header glyph coincide exactly. Also the grid's half-width and the rows' mid-line (wires).
 */
export const TILE_DOCK = { rx: -60, ry: -6, cx: 20, cy: -48, len: 18, hw: 110, my: 10, ok: false }

/** Beat 5 timings (a = local progress of the aha step). */
export const AHA = { tileIn: 0.46, dock0: 0.515, dock1: 0.535, xx: 0.53, yy: 0.56, zero: 0.585, fire: 0.585, lock: 0.62 } as const

export function Tile() {
  const anchor = useRef<THREE.Group>(null!)
  const eqRead = useRef<THREE.Group>(null!)
  const loopGlyph = useRef<THREE.Group>(null!)
  const ringTag = useRef<THREE.Group>(null!)
  const loopTag = useRef<THREE.Group>(null!)
  const root = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const dockRow = useRef<SVGSVGElement>(null)
  const dockCol = useRef<SVGSVGElement>(null)
  const cells = useRef<(HTMLSpanElement | null)[]>([])
  const glyph = useGlyph()
  const last = useRef({ mode: '' as string, txt: ['', '', '', '', '', '', '', ''], vars: '', measure: '' })

  // the "=" between ring and loop: two hairlines that pulse (the lock)
  const eqLines = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    s.seg(-0.5, 0.5, 0, 0.5, 0.5, 0, 1)
    s.seg(-0.5, -0.5, 0, 0.5, -0.5, 0, 1)
    return { geo: s.build(), mat: lineMaterial(COLORS.field, 0) }
  }, [])
  const eqMesh = useRef<THREE.LineSegments>(null!)

  const wires = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    const n = 40
    for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) s.seg(0, 0, 0, 0, 0, 0, 1, i / n, (i + 1) / n)
    return { geo: s.build(true), mat: lineMaterial(COLORS.field, 0), n }
  }, [])

  // "stretch x" / "squeeze y" flashes on ring and loop: 8 single-headed arrows (3 segments each)
  const flash = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    for (let k = 0; k < 8 * 3; k++) s.seg(0, 0, 0, 0, 0, 0, 0)
    return { geo: s.build(true), mat: lineMaterial(COLORS.field, 1) }
  }, [])

  const eqOp = () => D.v[S.aha] * smoothstep(AHA.lock, AHA.lock + 0.04, D.sp[S.aha])

  useChapterFrame((f) => {
    const w = D.w
    const a = D.sp[S.aha]
    const b = D.b
    const wpp = D.wpp
    anchor.current.position.set(D.tileX, D.tileY, 0)

    /* mode + entries */
    const lab = w[S.lab] + w[S.outro] > 0.5
    const spin = lab ? D.labSpin : 2
    const circ = lab && D.circular
    const mode: Mode = spin === 2 ? (circ ? 'c2' : 'm2') : spin === 1 ? (circ ? 'c1' : 'vec') : 'id'
    const el = root.current
    if (el && mode !== last.current.mode) {
      el.dataset.mode = mode
      last.current.mode = mode
    }
    if (el) {
      // story: headers after the dock, then the cells light in sequence; lab: everything lit
      const q = (x: number) => Math.round(x * 20) / 20
      const hd = lab ? 1 : q(smoothstep(AHA.dock0, AHA.dock1, a))
      const l0 = lab ? 1 : q(smoothstep(AHA.xx, AHA.xx + 0.03, a))
      const l3 = lab ? 1 : q(smoothstep(AHA.yy, AHA.yy + 0.03, a))
      const lz = lab ? 1 : q(smoothstep(AHA.zero, AHA.zero + 0.03, a))
      const lit = lab ? 1 : q(smoothstep(AHA.xx, AHA.yy + 0.03, a))
      const ann = lab ? 0 : q(1 - smoothstep(0.63, 0.655, a))
      const sub = lab ? 1 : q(smoothstep(0.66, 0.69, a))
      const key = `${hd}|${l0}|${l3}|${lz}|${lit}|${ann}|${sub}|${lab ? 1 : 0}`
      if (key !== last.current.vars) {
        last.current.vars = key
        el.style.setProperty('--hd', String(hd))
        el.style.setProperty('--l0', String(l0))
        el.style.setProperty('--l3', String(l3))
        el.style.setProperty('--lz', String(lz))
        el.style.setProperty('--lit', String(lit))
        el.style.setProperty('--ann', String(ann))
        el.style.setProperty('--sub', String(sub))
        el.dataset.ctx = lab ? 'lab' : 'story'
      }
      // measure where the docking arrows land (once per context / size / mode)
      const mk = `${el.dataset.ctx}|${mode}|${f.state.size.width}|${f.state.size.height}`
      if (mk !== last.current.measure && grid.current && dockRow.current && dockCol.current) {
        const g = grid.current.getBoundingClientRect()
        if (g.width > 0) {
          last.current.measure = mk
          const cx = g.left + g.width / 2
          const cy = g.top + g.height / 2
          const r = dockRow.current.getBoundingClientRect()
          const c = dockCol.current.getBoundingClientRect()
          TILE_DOCK.rx = r.left + r.width / 2 - cx
          TILE_DOCK.ry = r.top + r.height / 2 - cy
          TILE_DOCK.cx = c.left + c.width / 2 - cx
          TILE_DOCK.cy = c.top + c.height / 2 - cy
          TILE_DOCK.len = r.width * 0.9
          TILE_DOCK.hw = g.width / 2
          const e = cells.current[2]
          TILE_DOCK.my = e ? e.getBoundingClientRect().top - 2 - cy : 10
          TILE_DOCK.ok = true
        }
      }
    }
    const psi = D.psi
    const v: number[] = VALS
    if (spin === 2) {
      const c = Math.cos(2 * psi)
      const s = Math.sin(2 * psi)
      v[0] = c
      v[1] = s
      v[2] = s
      v[3] = -c
      // ε(ψ + 45°)
      v[4] = -s
      v[5] = c
      v[6] = c
      v[7] = s
    } else if (spin === 1) {
      v[0] = Math.cos(psi)
      v[1] = 0
      v[2] = Math.sin(psi)
      v[3] = 0
      v[4] = -Math.sin(psi)
      v[5] = 0
      v[6] = Math.cos(psi)
      v[7] = 0
    } else {
      v[0] = 1
      v[1] = 0
      v[2] = 0
      v[3] = 1
      v[4] = v[5] = v[6] = v[7] = 0
    }
    for (let i = 0; i < 8; i++) {
      const txt = fmt2(v[i])
      const c = cells.current[i]
      if (c && txt !== last.current.txt[i]) {
        last.current.txt[i] = txt
        c.textContent = txt
        c.dataset.zero = Math.abs(v[i]) < 0.005 ? '1' : '0'
      }
    }

    /* hairlines tile → ring, tile → loop (the LOCK), then a quiet permanent link in the Lab */
    const story = b < S.aha + 1
    const lockFire = story ? smoothstep(AHA.fire, AHA.fire + 0.035, a) : 1
    const lockAlpha = story ? smoothstep(AHA.fire - 0.005, AHA.fire + 0.01, a) * (1 - 0.55 * smoothstep(0.7, 0.8, a)) : 0
    const labAlpha = D.labLbl * 0.3
    const alpha = Math.max(lockAlpha * D.v[S.aha], labAlpha)
    wires.mat.uniforms.uOpacity.value = alpha
    wires.mat.uniforms.uReveal.value = story ? lockFire : 1
    if (alpha > 0.002) {
      const pos = wires.geo.attributes.position.array as Float32Array
      const al = wires.geo.attributes.aAlpha.array as Float32Array
      // from the tile's left / right edges (between the two rows) to the ring's upper-right and the loop's upper-left
      const ex = (TILE_DOCK.hw + 6) * wpp
      const ey = D.tileY - TILE_DOCK.my * wpp
      const ax0 = D.tileX - ex
      const ax1 = D.tileX + ex
      const bx0 = D.ringX + D.ringR * 1.1 * 0.7071
      const by0 = D.ringY + D.ringR * 1.1 * 0.7071
      const bx1 = D.loopX - D.loopR * 1.14 * 0.7071
      const by1 = D.loopY + D.loopR * 1.14 * 0.7071
      const n = wires.n
      const pulse = (D.t * 0.8) % 1
      for (let k = 0; k < 2; k++) {
        const x0 = k === 0 ? ax0 : ax1
        const x1 = k === 0 ? bx0 : bx1
        const y1 = k === 0 ? by0 : by1
        for (let i = 0; i < n; i++) {
          const u0 = i / n
          const u1 = (i + 1) / n
          const o = (k * n + i) * 6
          // leave the tile horizontally, then bend down onto the subject (quadratic, control at the corner)
          pos[o] = quad(x0, x1, x1, u0)
          pos[o + 1] = quad(ey, ey, y1, u0)
          pos[o + 2] = 0
          pos[o + 3] = quad(x0, x1, x1, u1)
          pos[o + 4] = quad(ey, ey, y1, u1)
          pos[o + 5] = 0
          const dd = ((u0 - pulse + 1.5) % 1) - 0.5
          const glow = 0.55 + 0.45 * Math.exp((-dd * dd) / 0.01)
          al[(k * n + i) * 2] = glow
          al[(k * n + i) * 2 + 1] = glow
        }
      }
      wires.geo.attributes.position.needsUpdate = true
      wires.geo.attributes.aAlpha.needsUpdate = true
    }

    /* the xx / yy flashes: "stretch x" (outward along x) then "squeeze y" (inward along y), on ring AND loop */
    const fx = story ? D.v[S.aha] * smoothstep(AHA.xx, AHA.xx + 0.015, a) * (1 - smoothstep(AHA.xx + 0.06, AHA.xx + 0.09, a)) : 0
    const fy = story ? D.v[S.aha] * smoothstep(AHA.yy, AHA.yy + 0.015, a) * (1 - smoothstep(AHA.yy + 0.05, AHA.yy + 0.08, a)) : 0
    flash.mat.uniforms.uOpacity.value = Math.max(fx, fy)
    if (fx > 0.002 || fy > 0.002) {
      const fp = flash.geo.attributes.position.array as Float32Array
      const fa = flash.geo.attributes.aAlpha.array as Float32Array
      const L = D.mobile ? 0.18 : 0.32
      for (let side = 0; side < 2; side++) {
        const cx = side === 0 ? D.ringX : D.loopX
        const cy = side === 0 ? D.ringY : D.loopY
        const R = side === 0 ? D.ringR : D.loopR
        const off = R + (D.mobile ? 0.13 : 0.26)
        const base = side * 4
        // stretch x: arrows at ±x pointing outward
        writeArrow(fp, (base + 0) * 6, cx + off, cy, 0, 1, 0, L, 0.3, false)
        writeArrow(fp, (base + 1) * 6, cx - off, cy, 0, -1, 0, L, 0.3, false)
        // squeeze y: arrows at ±y pointing inward
        writeArrow(fp, (base + 2) * 6, cx, cy + off, 0, 0, -1, L, 0.3, false)
        writeArrow(fp, (base + 3) * 6, cx, cy - off, 0, 0, 1, L, 0.3, false)
        for (let v2 = 0; v2 < 6; v2++) {
          fa[(base + 0) * 6 + v2] = fx
          fa[(base + 1) * 6 + v2] = fx
          fa[(base + 2) * 6 + v2] = fy
          fa[(base + 3) * 6 + v2] = fy
        }
      }
      flash.geo.attributes.position.needsUpdate = true
      flash.geo.attributes.aAlpha.needsUpdate = true
    }

    /* "=" between ring and loop (its readout below it on desktop, under both circles on phones) */
    const midX = (D.ringX + D.ringR + D.loopX - D.loopR) / 2
    const eqA = eqOp() * (0.72 + 0.28 * Math.sin(D.t * 2.4 * ambient()))
    eqLines.mat.uniforms.uOpacity.value = eqA
    eqMesh.current.visible = eqA > 0.002
    eqMesh.current.position.set(midX, D.ringY + (D.mobile ? 0 : 0.05), 0)
    eqMesh.current.scale.set(D.mobile ? 0.2 : 0.42, D.mobile ? 0.05 : 0.085, 1)
    eqRead.current.position.set(D.mobile ? 0 : midX, D.mobile ? D.ringY - D.ringR - 0.26 : D.ringY - 0.32, 0)
    ringTag.current.position.set(D.ringX, D.ringY - D.ringR - 0.1, 0)
    loopTag.current.position.set(D.loopX, D.loopY - D.loopR - 0.1, 0)
    if (D.mobile) loopGlyph.current.position.set(D.loopX + D.loopR * 1.05, D.loopY + D.loopR * 1.05, 0)
    else loopGlyph.current.position.set(D.loopX, D.loopY + D.loopR + 0.42, 0)
    glyph.api.set(D.psi)
  })

  const tileOp = () => {
    const a = D.sp[S.aha]
    return D.v[S.aha] * labelFade(S.aha) * smoothstep(AHA.tileIn, AHA.tileIn + 0.05, a) + D.labLbl
  }
  const loopGlyphOp = () => D.v[S.aha] * smoothstep(AHA.lock + 0.01, AHA.lock + 0.05, D.sp[S.aha]) + D.labLbl * (D.labSpin === 2 && !D.circular ? 0.9 : 0)
  const tagOp = () => (D.mobile ? 0 : eqOp())
  const cell = (i: number) => (el: HTMLSpanElement | null) => void (cells.current[i] = el)

  return (
    <>
      <lineSegments geometry={wires.geo} material={wires.mat} frustumCulled={false} />
      <lineSegments geometry={flash.geo} material={flash.mat} frustumCulled={false} renderOrder={3} />
      <lineSegments ref={eqMesh} geometry={eqLines.geo} material={eqLines.mat} frustumCulled={false} visible={false} />
      <group ref={anchor}>
        <SceneLabel position={[0, 0, 0]} align="center" tone="field" opacity={tileOp} className="gr-tile-wrap">
          <div ref={root} className="gr-tile" data-mode="m2" data-ctx="story">
            <div className="gr-tile__cap">
              <span className="gr-tile__cap-t">
                <span className="gr-tile__cap-story">
                  Pattern <span className="gr-nc">ε</span>
                  <sub>ij</sub>
                </span>
                <span className="gr-tile__cap-lab">
                  <span className="gr-tile__only-m2 gr-tile__only-c2">
                    Pattern <span className="gr-nc">ε</span>
                    <sub>ij</sub>
                  </span>
                  <span className="gr-tile__only-vec gr-tile__only-c1">
                    Pattern <span className="gr-nc">e</span> · one arrow
                  </span>
                  <span className="gr-tile__only-id">
                    Pattern <span className="gr-nc">δ</span> · breathing
                  </span>
                </span>
              </span>
              <span className="gr-tile__legend">
                rows: ↺ right-mover&rsquo;s arrow <i>i</i> · columns: ↻ left-mover&rsquo;s <i>j</i>
              </span>
            </div>
            <div ref={grid} className="gr-tile__grid" aria-hidden="true">
              <span className="gr-tile__corner">
                <i>i</i>\<i>j</i>
              </span>
              <span className="gr-tile__ch">
                <Arrow dir="x" ref={dockCol} />
                <b>x</b>
              </span>
              <span className="gr-tile__ch gr-tile__c2">
                <Arrow dir="y" />
                <b>y</b>
              </span>
              <span className="gr-tile__rh">
                <Arrow dir="x" ref={dockRow} />
                <b>x</b>
              </span>
              <span ref={cell(0)} className="gr-tile__e gr-tile__e--0">
                1.00
              </span>
              <span ref={cell(1)} className="gr-tile__e gr-tile__e--z gr-tile__c2">
                0.00
              </span>
              <span className="gr-tile__rh">
                <Arrow dir="y" />
                <b>y</b>
              </span>
              <span ref={cell(2)} className="gr-tile__e gr-tile__e--z">
                0.00
              </span>
              <span ref={cell(3)} className="gr-tile__e gr-tile__e--3 gr-tile__c2">
                −1.00
              </span>
            </div>
            <div className="gr-tile__circ" aria-hidden="true">
              <span className="gr-tile__tag">× cos φ</span>
              <span className="gr-tile__plus">+</span>
              <span className="gr-tile__mini">
                <span ref={cell(4)}>0</span>
                <span ref={cell(5)} className="gr-tile__c2">
                  1
                </span>
                <span ref={cell(6)}>1</span>
                <span ref={cell(7)} className="gr-tile__c2">
                  0
                </span>
              </span>
              <span className="gr-tile__tag">× sin φ</span>
            </div>
            <div className="gr-tile__below">
              <span className="gr-tile__ann">
                <span className="gr-tile__ann0">
                  <span className="gr-nc">xx</span> = +1 · stretch <span className="gr-nc">x</span>
                </span>
                <span className="gr-tile__ann3">
                  <span className="gr-nc">yy</span> = −1 · squeeze <span className="gr-nc">y</span>
                </span>
              </span>
              <span className="gr-tile__sub">
                <span className="gr-tile__sub-story">
                  Symmetric, traceless part → spin 2
                  <br />
                  <span className="gr-tile__dim">(the rest: B-field, dilaton)</span>
                </span>
                <span className="gr-tile__sub-lab">
                  <span className="gr-tile__only-m2">The same numbers drive both sides</span>
                  <span className="gr-tile__only-c2">Stretch axis turns 180° per cycle</span>
                  <span className="gr-tile__only-vec">Same arrow shakes ring and string</span>
                  <span className="gr-tile__only-c1">Shake turns 360° per cycle</span>
                  <span className="gr-tile__only-id">Identity: same at every angle</span>
                </span>
              </span>
              <span className="gr-tile__note">
                2 × 2 corner of a 24 × 24 tile
                <br />
                (8 × 8 for superstrings)
              </span>
            </div>
          </div>
        </SceneLabel>
      </group>
      <group ref={eqRead}>
        <SceneLabel position={[0, 0, 0]} align="center" tone="ink" opacity={eqOp} className="gr-eq-read">
          <span className="gr-eq-read__m">Mass 0 · spin 2 · same pattern</span>
          <span className="gr-eq-read__s">
            <span className="gr-eq-read__mob">Ring ~4 km · loop ≈ ℓ<sub>s</sub> · </span>~ not to scale
          </span>
        </SceneLabel>
      </group>
      <group ref={ringTag}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={tagOp} className="gr-scaletag">
          Ring ~ LIGO arm · 4 × 10³ <span className="gr-nc">m</span>
        </SceneLabel>
      </group>
      <group ref={loopTag}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={tagOp} className="gr-scaletag">
          <Status kind="speculative" compact />
          <span>
            Loop ≈ ℓ<sub>s</sub> · string length unknown
          </span>
        </SceneLabel>
      </group>
      <group ref={loopGlyph}>
        <SceneLabel position={[0, 0, 0]} align="center" tone="filament" opacity={loopGlyphOp} className="gr-glyph">
          <PatternGlyph gref={glyph.ref} tone="filament" />
        </SceneLabel>
      </group>
    </>
  )
}

/** A hairline double arrow (the header glyph a docking arrow becomes): ↔ for x, ↕ for y. */
function Arrow({ dir, ref }: { dir: 'x' | 'y'; ref?: Ref<SVGSVGElement> }) {
  return (
    <svg ref={ref} className="gr-tile__ar" viewBox="-10 -10 20 20" aria-hidden="true">
      <g transform={dir === 'y' ? 'rotate(90)' : undefined}>
        <line x1="-8.5" y1="0" x2="8.5" y2="0" />
        <polyline points="-5.5,-2.6 -8.5,0 -5.5,2.6" />
        <polyline points="5.5,-2.6 8.5,0 5.5,2.6" />
      </g>
    </svg>
  )
}

const VALS = [0, 0, 0, 0, 0, 0, 0, 0]

/** Quadratic Bézier through a, b (control), c at parameter u. */
const quad = (a: number, b: number, c: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c
