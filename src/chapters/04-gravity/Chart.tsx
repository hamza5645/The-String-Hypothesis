/*
 * Beat 3 · Where the quantum version breaks. Schematic log–log chart: energy 10⁰–10²⁰ GeV vs dimensionless
 * strength 10⁻⁴⁰–10⁰. EM (1/α: 137 → 128 at M_Z), strong (one-loop α_s, n_f = 5), weak-effective
 * (α_W (E/M_W)² → 1/30), gravity (E/E_P)². SM lines solid to 10³ GeV, dashed beyond (extrapolated).
 * A cursor rides the gravity line; past ~10¹⁷ GeV it frays into c₁, c₂, c₃ … (cartoon of unknown inputs).
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GlowPoint, SceneLabel, COLORS, useChapterFrame, type GlowPointApi } from '@/gl'
import { useThree } from '@react-three/fiber'
import { lerp, rng, smoothstep } from '@/core/math'
import { D, labelFade, S } from './director'
import { alphaEM, alphaG, alphaS, alphaWeak, cursorLogE, E_PLANCK, LHC_E } from './model'
import { lineMaterial, Segs } from './lines'

const LOG_EP = Math.log10(E_PLANCK)
const LOG_LHC = Math.log10(LHC_E)

/**
 * Label layout in chart units [log₁₀ E/GeV, log₁₀ strength]: [anchor x on the curve, _, label x, label y].
 * SM labels sit in the empty wedge above the gravity line; the Fermi callout between the weak curve's E²
 * rise (its first leader) and the gravity line (its second).
 */
function smLabels(mob: boolean) {
  return mob
    ? { strong: [2.2, 0, 7.0, -3.6], em: [3.0, 0, 7.0, -6.6], weak: [1.35, 0, 7.0, -10.0], fermiW: [0.95, 0, 0.5, -13.4], fermiG: [8.6, 0, 3.0, -20.6] }
    : { strong: [2.2, 0, 5.6, -4.2], em: [3.0, 0, 5.6, -7.0], weak: [1.4, 0, 5.6, -9.9], fermiW: [0.95, 0, 0.9, -14.2], fermiG: [7.2, 0, 3.4, -19.6] }
}
const NF = 34 // fan branches

/** Chart frame size (world units). Beat 2's flattened ripple lands on the x-axis at y = −CH/2. */
export const chartDims = (mobile: boolean) => (mobile ? { CW: 3.3, CH: 2.8 } : { CW: 5.0, CH: 3.7 })

export function Chart() {
  const size = useThree((s) => s.size)
  const mob = size.width / Math.max(1, size.height) < 0.8
  const { CW, CH } = chartDims(mob)
  const X = (lg: number) => -CW / 2 + (lg / 20) * CW
  const Y = (ls: number) => -CH / 2 + ((ls + 40) / 40) * CH

  const group = useRef<THREE.Group>(null!)
  const bead = useRef<GlowPointApi>(null)
  const beadG = useRef<THREE.Group>(null!)
  const readE = useRef<HTMLSpanElement>(null)
  const readG = useRef<HTMLSpanElement>(null)
  const last = useRef({ e: '', g: '', q: -1 })

  const built = useMemo(() => {
    // x-axis: grows out from the centre (u = distance from it) — where Beat 2's flattened ripple lands
    const ax = new Segs().color(COLORS.ink2)
    ax.seg(X(10), Y(-40), 0, X(20), Y(-40), 0, 0.8, 0, CW / 2)
    ax.seg(X(10), Y(-40), 0, X(0), Y(-40), 0, 0.8, 0, CW / 2)
    // the rest of the frame + ticks
    const fr = new Segs().color(COLORS.ink2)
    fr.seg(X(0), Y(-40), 0, X(0), Y(0), 0, 0.75)
    fr.seg(X(0), Y(0), 0, X(20), Y(0), 0, 0.22)
    fr.seg(X(20), Y(-40), 0, X(20), Y(0), 0, 0.22)
    for (let e = 0; e <= 20; e += 2) fr.seg(X(e), Y(-40), 0, X(e), Y(-40) - (e % 4 === 0 ? 0.08 : 0.045), 0, 0.7)
    for (let e = -40; e <= 0; e += 5) fr.seg(X(0), Y(e), 0, X(0) - (e % 10 === 0 ? 0.08 : 0.045), Y(e), 0, 0.7)
    // faint horizontal guides every 10 decades
    for (let e = -30; e < 0; e += 10) for (let k = 0; k < 40; k++) fr.seg(X(k * 0.5), Y(e), 0, X(k * 0.5 + 0.18), Y(e), 0, 0.12)

    // SM curves: solid ≤ 10³ GeV, dashed beyond. u = log10(E) so the reveal sweeps left → right.
    const solid = new Segs().color(COLORS.ink2)
    const dashed = new Segs().color(COLORS.ink2)
    const curve = (fn: (E: number) => number, lg0: number, alpha: number) => {
      const n = 220
      let pl = lg0
      let pv = Math.log10(fn(10 ** lg0))
      for (let i = 1; i <= n; i++) {
        const lg = lg0 + ((20 - lg0) * i) / n
        const v = Math.log10(fn(10 ** lg))
        const target = (pl + lg) / 2 <= 3 ? solid : dashed
        target.seg(X(pl), Y(pv), 0, X(lg), Y(v), 0, alpha, pl, lg)
        pl = lg
        pv = v
      }
    }
    curve(alphaEM, 0, 0.9)
    curve(alphaS, Math.log10(2), 0.9)
    curve(alphaWeak, 0, 0.9)

    // gravity: the straight line (E/E_P)² to E_P
    const grav = new Segs().color(COLORS.field)
    grav.seg(X(0), Y(Math.log10(alphaG(1))), 0, X(LOG_EP), Y(0), 0, 1, 0, LOG_EP)

    // the fan: past ~10¹⁷ GeV the line frays. Branches (the unknown coefficients c₁, c₂, c₃ … of ever-higher
    // curvature terms) start at an accelerating rate toward E_P and splay into a wedge. Clipped to the frame.
    const fan = new Segs().color(COLORS.field)
    const r = rng(41)
    const starts: number[] = []
    const YTOP = 0.35
    for (let k = 0; k < NF; k++) {
      const s = LOG_EP - 2.2 * Math.pow(1 - k / NF, 1.7)
      starts.push(s)
      const y0 = 2 * (s - LOG_EP)
      const up = k % 3 === 1
      const dev = (up ? 1 : -1) * (2.2 + 7.5 * r()) * (0.45 + (0.55 * k) / NF)
      const m = 10
      let pl = s
      let pv = y0
      for (let i = 1; i <= m; i++) {
        const lg = s + ((20 - s) * i) / m
        const q = (lg - s) / (20 - s)
        const v = y0 + 2 * (lg - s) + dev * Math.pow(lg - s, 1.5)
        if (v > YTOP || v < -38) break
        fan.seg(X(pl), Y(pv), 0, X(lg), Y(v), 0, 0.62 * (1 - 0.55 * q), pl, lg)
        pl = lg
        pv = v
      }
    }

    // verticals (LHC, Planck) and the two glyphs above the Planck line
    const vert = new Segs().color(COLORS.ink2)
    for (let k = 0; k < 30; k++) {
      const a = -40 + (k * 40) / 30
      vert.seg(X(LOG_LHC), Y(a), 0, X(LOG_LHC), Y(a + 0.7), 0, 0.45)
    }
    vert.color(COLORS.field)
    vert.seg(X(LOG_EP), Y(-40), 0, X(LOG_EP), Y(0) + 0.25, 0, 0.6)
    // horizon circle (black-hole interior) and converging cone (Big Bang) — revealed with the fan
    const gl = new Segs().color(COLORS.field)
    const gy = Y(0) + (mob ? 0.5 : 0.62)
    const cx0 = X(LOG_EP) - (mob ? 0.62 : 0.34)
    const rr = 0.09
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      const b = ((i + 1) / 40) * Math.PI * 2
      gl.seg(cx0 + rr * Math.cos(a), gy + rr * Math.sin(a), 0, cx0 + rr * Math.cos(b), gy + rr * Math.sin(b), 0, 0.85)
    }
    const cx1 = X(LOG_EP) + (mob ? 0.1 : 0.26)
    gl.seg(cx1 - 0.1, gy + 0.11, 0, cx1, gy - 0.1, 0, 0.85)
    gl.seg(cx1 + 0.1, gy + 0.11, 0, cx1, gy - 0.1, 0, 0.85)
    gl.seg(cx1 - 0.1, gy + 0.11, 0, cx1 + 0.1, gy + 0.11, 0, 0.5)

    // leaders: each Standard Model curve to its own label; the Fermi callout to both E² lines
    const lead = (sg: Segs, x0: number, y0: number, x1: number, y1: number) => {
      sg.seg(X(x0), Y(y0), 0, X(x1), Y(y1), 0, 0.7)
      // a tiny tick ring at the curve end
      const r = 0.022
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const b2 = ((i + 1) / 12) * Math.PI * 2
        sg.seg(X(x0) + r * Math.cos(a), Y(y0) + r * Math.sin(a), 0, X(x0) + r * Math.cos(b2), Y(y0) + r * Math.sin(b2), 0, 0.9)
      }
    }
    const L = smLabels(mob)
    const smL = new Segs().color(COLORS.ink2)
    lead(smL, L.strong[0], Math.log10(alphaS(10 ** L.strong[0])), L.strong[2], L.strong[3])
    lead(smL, L.em[0], Math.log10(alphaEM(10 ** L.em[0])), L.em[2], L.em[3])
    lead(smL, L.weak[0], Math.log10(alphaWeak(10 ** L.weak[0])), L.weak[2], L.weak[3])
    const fermiL = new Segs().color(COLORS.ink2)
    lead(fermiL, L.fermiW[0], Math.log10(alphaWeak(10 ** L.fermiW[0])), L.fermiW[2], L.fermiW[3])
    fermiL.color(COLORS.field)
    lead(fermiL, L.fermiG[0], 2 * (L.fermiG[0] - LOG_EP), L.fermiG[2], L.fermiG[3])

    const mk = (s: Segs, c: string, dash = 0) => ({ geo: s.build(), mat: lineMaterial(c === 'w' ? '#ffffff' : c, 1, dash) })
    return {
      axis: mk(ax, 'w'),
      smL: mk(smL, 'w'),
      fermiL: mk(fermiL, 'w'),
      frame: mk(fr, 'w'),
      solid: mk(solid, 'w'),
      dashed: mk(dashed, 'w', 0.22),
      grav: mk(grav, 'w'),
      fan: mk(fan, 'w'),
      vert: mk(vert, 'w'),
      glyphs: mk(gl, 'w'),
      starts,
      gy,
      cx0,
      cx1,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CW, CH, mob])

  useChapterFrame(() => {
    const w = D.v[S.qg]
    const g = group.current
    g.visible = w > 0.002
    if (!g.visible) return
    const p = D.sp[S.qg]
    // enter: the x-axis draws out from the centre (the flattened ripple), then the frame, then the curves
    const axisIn = smoothstep(S.qg, S.qg + 0.04, D.b) * (1 - smoothstep(S.spin2 - 0.12, S.spin2, D.b))
    built.axis.mat.uniforms.uOpacity.value = axisIn
    built.axis.mat.uniforms.uReveal.value = lerp(0, CW / 2 + 0.01, smoothstep(0.0, 0.06, p))
    const frameIn = smoothstep(0.05, 0.13, p)
    const draw = smoothstep(0.08, 0.2, p)
    const reveal = lerp(-0.5, 20.5, draw)
    built.frame.mat.uniforms.uOpacity.value = w * frameIn
    built.solid.mat.uniforms.uOpacity.value = w
    built.solid.mat.uniforms.uReveal.value = reveal
    built.dashed.mat.uniforms.uOpacity.value = w * 0.8
    built.dashed.mat.uniforms.uReveal.value = reveal
    built.grav.mat.uniforms.uOpacity.value = w
    built.grav.mat.uniforms.uReveal.value = reveal
    built.vert.mat.uniforms.uOpacity.value = w * smoothstep(0.12, 0.22, p)
    built.smL.mat.uniforms.uOpacity.value = w * labelFade(S.qg) * smoothstep(0.18, 0.24, p)
    built.fermiL.mat.uniforms.uOpacity.value = w * labelFade(S.qg) * smoothstep(0.24, 0.3, p)

    const lg = cursorLogE(p)
    const fanReveal = lg + 1.6 * smoothstep(0.55, 0.68, p)
    built.glyphs.mat.uniforms.uOpacity.value = w * smoothstep(0.58, 0.64, p)
    built.fan.mat.uniforms.uReveal.value = lg > 17 ? fanReveal : -1
    built.fan.mat.uniforms.uOpacity.value = w
    const ls = 2 * (lg - LOG_EP)
    beadG.current.position.set(X(lg), Y(ls), 0.01)
    if (bead.current) bead.current.material.uniforms.uIntensity.value = 1.2 * w * smoothstep(0.08, 0.14, p)
    const lgQ = Math.round(lg * 200)
    if (lgQ === last.current.q || !readE.current || !readG.current) return
    last.current.q = lgQ
    const eTxt = fmtSci(10 ** lg, 2)
    const gTxt = fmtSci(alphaG(10 ** lg), 2)
    if (eTxt !== last.current.e && readE.current) {
      readE.current.textContent = eTxt
      last.current.e = eTxt
    }
    if (gTxt !== last.current.g && readG.current) {
      readG.current.textContent = gTxt
      last.current.g = gTxt
    }
  })

  const op = (a = 0, b = 0.1) => () => D.v[S.qg] * labelFade(S.qg) * smoothstep(a, b, D.sp[S.qg])
  const fanOp = (a: number) => () => D.v[S.qg] * labelFade(S.qg) * smoothstep(a, a + 0.05, D.sp[S.qg])
  const L = smLabels(mob)
  const ticksX = [0, 4, 8, 12, 16, 20]
  const ticksY = [0, -10, -20, -30, -40]
  return (
    <group ref={group}>
      <lineSegments geometry={built.axis.geo} material={built.axis.mat} frustumCulled={false} />
      <lineSegments geometry={built.frame.geo} material={built.frame.mat} frustumCulled={false} />
      <lineSegments geometry={built.smL.geo} material={built.smL.mat} frustumCulled={false} />
      <lineSegments geometry={built.fermiL.geo} material={built.fermiL.mat} frustumCulled={false} />
      <lineSegments geometry={built.solid.geo} material={built.solid.mat} frustumCulled={false} />
      <lineSegments geometry={built.dashed.geo} material={built.dashed.mat} frustumCulled={false} />
      <lineSegments geometry={built.grav.geo} material={built.grav.mat} frustumCulled={false} />
      <lineSegments geometry={built.fan.geo} material={built.fan.mat} frustumCulled={false} />
      <lineSegments geometry={built.vert.geo} material={built.vert.mat} frustumCulled={false} />
      <lineSegments geometry={built.glyphs.geo} material={built.glyphs.mat} frustumCulled={false} />
      <group ref={beadG}>
        <GlowPoint ref={bead} size={0.16} minPixels={3} color={COLORS.field} coreColor="#ffffff" intensity={0} />
      </group>
      {/* live readout, parked in the chart's empty lower-right triangle */}
      <SceneLabel
        position={[X(19.5), Y(mob ? -27.5 : -29.5), 0]}
        align="right"
        tone="field"
        opacity={() => op(0.1, 0.16)() * (mob ? 1 - smoothstep(0.6, 0.64, D.sp[S.qg]) : 1)}
        className="gr-cursor"
      >
        <span className="gr-cursor__k">Cursor</span>
        <span className="gr-cursor__row">
          E = <span ref={readE}>1</span> GeV
        </span>
        <span className="gr-cursor__row">
          gravity ≈ (E/E<sub>P</sub>)² = <span ref={readG}>1</span>
        </span>
        {mob && <span className="gr-cursor__k">dimensional estimate</span>}
      </SceneLabel>

      {ticksX.map((e) => (
        <SceneLabel key={'x' + e} position={[X(e), Y(-40) - 0.12, 0]} align="below" tone="dim" opacity={op(0.02, 0.1)} className="gr-tick">
          10{sup(e)}
        </SceneLabel>
      ))}
      {ticksY.map((e) => (
        <SceneLabel key={'y' + e} position={[X(0) - 0.12, Y(e), 0]} align="right" tone="dim" opacity={op(0.02, 0.1)} className="gr-tick">
          10{sup(e)}
        </SceneLabel>
      ))}
      {mob ? (
        <SceneLabel position={[X(20), Y(-40) + 0.1, 0]} align="right" tone="dim" opacity={op(0.02, 0.12)} className="gr-axis">
          E · <span className="gr-nc">GeV</span> →
        </SceneLabel>
      ) : (
        <SceneLabel position={[X(10), Y(-40) - 0.4, 0]} align="below" tone="dim" opacity={op(0.02, 0.12)} className="gr-axis">
          Collision energy E · <span className="gr-nc">GeV</span>
        </SceneLabel>
      )}
      <SceneLabel position={[X(0), Y(0) + 0.14, 0]} align="left" tone="dim" opacity={op(0.02, 0.12)} className="gr-axis gr-axis--y">
        {mob ? 'Strength (dimensionless)' : 'Interaction strength (dimensionless)'}
      </SceneLabel>

      {/* each Standard Model curve gets its own label (leaders drawn in GL) */}
      <SceneLabel position={[X(L.strong[2]), Y(L.strong[3]), 0]} align="left" tone="ink" opacity={op(0.2, 0.26)} className="gr-cl gr-cl--sm">
        Strong
      </SceneLabel>
      <SceneLabel position={[X(L.em[2]), Y(L.em[3]), 0]} align="left" tone="ink" opacity={op(0.2, 0.26)} className="gr-cl gr-cl--sm">
        Electromagnetism
        <br />
        <span className="gr-nc">α ≈ 1/137 → 1/128 at 91 GeV</span>
      </SceneLabel>
      <SceneLabel position={[X(L.weak[2]), Y(L.weak[3]), 0]} align="left" tone="ink" opacity={op(0.2, 0.26)} className="gr-cl gr-cl--sm">
        Weak, effective
      </SceneLabel>
      {!mob && (
        <SceneLabel position={[X(14.4), Y(-3.7), 0]} align="left" tone="dim" opacity={op(0.2, 0.26)} className="gr-cl">
          - - extrapolated
        </SceneLabel>
      )}
      {/* the chart's best argument: Fermi's weak theory had gravity's E² growth, and new particles cured it */}
      <SceneLabel position={[X(L.fermiW[2]), Y(L.fermiW[3]), 0]} align="left" tone="ink" opacity={op(0.26, 0.32)} className="gr-cl gr-fermi">
        <span className="gr-fermi__b">Fermi&rsquo;s theory (1933–34)</span>
        <span className="gr-fermi__t">Same E² growth as gravity</span>
        <span className="gr-fermi__b gr-fermi__cure">Cured by new particles, W and Z</span>
      </SceneLabel>
      {!mob && (
        <SceneLabel position={[X(4.7), Y(2 * 4.7 - 2 * LOG_EP) - 0.1, 0]} align="left" tone="field" opacity={op(0.1, 0.18)} className="gr-cl gr-cl--g">
          Gravity · (E/E<sub>P</sub>)² · dimensional estimate
        </SceneLabel>
      )}

      <SceneLabel position={[X(LOG_LHC) + 0.02, Y(-40) + 0.16, 0]} align="left" tone="dim" opacity={op(0.12, 0.2)} className="gr-vl gr-vl--right">
        LHC
        <br />
        1.36 × 10⁴ <span className="gr-nc">GeV</span>
      </SceneLabel>
      <SceneLabel position={[X(LOG_EP) + 0.02, Y(-40) + 0.16, 0]} align="left" tone="field" opacity={op(0.12, 0.2)} className="gr-vl gr-vl--left">
        Planck
        <br />
        1.22 × 10¹⁹ <span className="gr-nc">GeV</span>
      </SceneLabel>
      <SceneLabel position={[built.cx0, built.gy - 0.13, 0]} align="below" tone="dim" opacity={fanOp(0.6)} className="gr-cl gr-cl--glyph">
        Black-hole
        <br />
        interior
      </SceneLabel>
      <SceneLabel position={[built.cx1, built.gy - 0.13, 0]} align="below" tone="dim" opacity={fanOp(0.62)} className="gr-cl gr-cl--glyph">
        Big Bang
        <br />
        <span className="gr-nc">t</span> → 0
      </SceneLabel>
      {!mob && (
        <SceneLabel position={[X(16.8), Y(-5.4), 0]} align="right" tone="field" opacity={fanOp(0.5)} className="gr-cl gr-cl--c">
          c₁, c₂, c₃ …
        </SceneLabel>
      )}
      <SceneLabel position={[X(mob ? 19.5 : 18.3), Y(mob ? -30.5 : -21), 0]} align="right" tone="ink" opacity={fanOp(0.64)} className="gr-cl gr-cl--wedge">
        {mob && (
          <>
            <span className="gr-cl__c">c₁, c₂, c₃ …</span>
            <br />
          </>
        )}
        Infinitely many unknown inputs
        <br />→ no prediction
      </SceneLabel>
    </group>
  )
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const sup = (n: number) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')

/** "1.2 × 10⁴" (mantissa with `digits` significant figures). */
function fmtSci(v: number, digits: number) {
  let e = Math.floor(Math.log10(v) + 1e-9)
  let ms = (v / 10 ** e).toFixed(digits - 1)
  if (parseFloat(ms) >= 10) {
    e += 1
    ms = (v / 10 ** e).toFixed(digits - 1)
  }
  if (e === 0) return ms
  return `${ms} × 10${sup(e)}`
}
