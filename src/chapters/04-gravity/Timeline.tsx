/*
 * Beat 6 · Forced, not inserted. A hairline timeline (history: OBSERVED) under the loop, ticks lighting
 * in order. At the 1973–74 graviton tick the loop is tagged hadron-sized (~10⁻¹⁵ m); the tag then sweeps
 * to Scherk & Schwarz's 1974 *proposal* (~10⁻³⁵ m · not measured) while the loop's size on screen stays
 * fixed. At 1985: consistency ⇒ R_μν = 0 (DERIVED).
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoints, SceneLabel, COLORS, useChapterFrame, type GlowPointsApi } from '@/gl'
import { lerp, smoothstep } from '@/core/math'
import { Eq, Status } from '@/ui'
import { D, labelFade, S } from './director'
import { lineMaterial, Segs } from './lines'

const EVENTS: { year: number; at: number; lines: string[]; short: string[]; side: 1 | -1; key?: boolean; end?: boolean; endM?: boolean }[] = [
  { year: 1968, at: 0.12, lines: ['1968', 'Veneziano amplitude', '(strong force)'], short: ['1968', 'Veneziano', '(strong force)'], side: 1 },
  { year: 1970, at: 0.2, lines: ['1970', 'Read as strings:', 'Nambu, Nielsen, Susskind'], short: ['1970', 'Read as', 'strings'], side: -1, end: true, endM: true },
  { year: 1973.5, at: 0.28, lines: ['1973–74', 'QCD arrives; strings', 'fall out of favor'], short: ['1973–74', 'QCD arrives'], side: 1 },
  { year: 1973.5, at: 0.36, lines: ['1973–74', 'Massless spin 2 = graviton:', 'Yoneya; Scherk & Schwarz'], short: ['1973–74', 'Spin 2 =', 'graviton'], side: -1, key: true },
  { year: 1985, at: 0.56, lines: ['1985', 'Einstein’s equations from', 'string consistency', '(Callan–Friedan–Martinec–Perry)'], short: ['1985', 'Einstein’s eqs.', 'from strings'], side: 1, end: true, endM: true },
]

export function Timeline() {
  const size = useThree((s) => s.size)
  const mob = size.width / Math.max(1, size.height) < 0.8
  const X0 = mob ? -1.45 : -2.45
  const X1 = mob ? 1.45 : 2.55
  const Y = mob ? -0.62 : -1.75
  const yx = (y: number) => lerp(X0, X1, (y - 1966.5) / (1986.5 - 1966.5))

  const group = useRef<THREE.Group>(null!)
  const dots = useRef<GlowPointsApi>(null)
  const tag = useRef<THREE.Group>(null!)
  const tagText = useRef<HTMLSpanElement>(null)
  const tagSub = useRef<HTMLSpanElement>(null)
  const eqG = useRef<THREE.Group>(null!)
  const lastTag = useRef(-1)

  const line = useMemo(() => {
    const s = new Segs().color(COLORS.ink2)
    s.seg(X0 - 0.1, Y, 0, X1 + 0.1, Y, 0, 0.6, 0, 1)
    for (let yr = 1967; yr <= 1986; yr++) s.seg(yx(yr), Y, 0, yx(yr), Y - (yr % 5 === 0 ? 0.07 : 0.035), 0, 0.5)
    s.color(COLORS.field)
    for (const e of EVENTS) s.seg(yx(e.year), Y, 0, yx(e.year), Y + e.side * 0.2, 0, 0.9)
    return { geo: s.build(), mat: lineMaterial('#ffffff', 0) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mob])
  const dotPos = useMemo(() => {
    const a = new Float32Array(EVENTS.length * 3)
    EVENTS.forEach((e, i) => {
      a[i * 3] = yx(e.year) + (i === 3 ? 0.0 : 0)
      a[i * 3 + 1] = Y
      a[i * 3 + 2] = 0.01
    })
    return a
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mob])
  const dotAlpha = useMemo(() => new Float32Array(EVENTS.length), [])

  useChapterFrame(() => {
    const w = D.v[S.forced]
    const g = group.current
    g.visible = w > 0.002
    if (!g.visible) return
    const p = D.sp[S.forced]
    const w3 = w
    line.mat.uniforms.uOpacity.value = w3 * smoothstep(0.02, 0.08, p)
    for (let i = 0; i < EVENTS.length; i++) dotAlpha[i] = w3 * smoothstep(EVENTS[i].at, EVENTS[i].at + 0.04, p) * (EVENTS[i].key ? 1.4 : 1)
    if (dots.current) dots.current.geometry.attributes.aAlpha.needsUpdate = true

    // loop tag: hadron-sized → sweep → proposal → "unknown"
    const R = D.loopR
    // above the loop (the consistency block owns its side: left on desktop, right on phones)
    tag.current.position.set(mob ? D.loopX - R : D.loopX, D.loopY + R + (mob ? 0.2 : 0.1), 0)
    // hadron-sized → the 1974 proposal sweep (on-screen size fixed) → "not measured" → unknown
    const phase = p < 0.4 ? 0 : p < 0.5 ? 1 : p < 0.66 ? 2 : 3
    const e = phase === 1 ? Math.round(lerp(-15, -35, smoothstep(0.4, 0.5, p))) : 0
    const key = phase * 100 - e
    if (key !== lastTag.current && tagText.current && tagSub.current) {
      lastTag.current = key
      const txt =
        phase === 0 ? 'Hadron-sized string ~10⁻¹⁵ m' : phase === 1 ? `Proposed string size ~10${sup(e)} m` : phase === 2 ? 'Proposed 1974 · ~10⁻³⁵ m' : '≈ ℓs · string length (unknown)'
      const sb = phase === 0 ? 'Strong-force picture' : phase === 1 ? 'Scherk & Schwarz, 1974' : phase === 2 ? 'Not measured' : '~10⁻³⁴ m if traditional estimates hold'
      if (tagText.current) tagText.current.textContent = txt
      if (tagSub.current) tagSub.current.textContent = sb
    }
    eqG.current.position.set(mob ? D.loopX + R + 0.08 : D.loopX - R * 1.25, D.loopY + (mob ? 0 : -R * 0.1), 0)
  })

  const op = (a: number, b = a + 0.05) => () => D.v[S.forced] * labelFade(S.forced) * smoothstep(a, b, D.sp[S.forced])
  return (
    <group ref={group}>
      <lineSegments geometry={line.geo} material={line.mat} frustumCulled={false} />
      <GlowPoints ref={dots} positions={dotPos} alphas={dotAlpha} size={0.1} color={COLORS.field} sharpness={0.8} minPixels={2.5} maxPixels={12} intensity={1.2} />
      <SceneLabel position={[X0 - 0.1, Y + 0.02, 0]} align="right" tone="dim" opacity={op(0.02, 0.08)} className="gr-tl-head">
        History <span className="gr-dot">●</span>
      </SceneLabel>
      {EVENTS.map((e, i) => (
        <SceneLabel
          key={i}
          position={[yx(e.year), Y + e.side * 0.24, 0]}
          align={e.side > 0 ? 'above' : 'below'}
          tone={e.key ? 'ink' : 'dim'}
          opacity={op(e.at)}
          className={`gr-tl${e.key ? ' gr-tl--key' : ''}${(mob ? e.endM : e.end) ? ' gr-tl--end' : ''}`}
        >
          {(mob ? e.short : e.lines).map((l, k) => (
            <span key={k} className={k === 0 ? 'gr-tl__y' : 'gr-tl__l'}>
              {l}
            </span>
          ))}
        </SceneLabel>
      ))}
      <group ref={tag}>
        <SceneLabel position={[0, 0, 0]} align={mob ? 'left' : 'above'} tone="filament" opacity={op(0.36, 0.42)} className="gr-sizetag">
          <span ref={tagText} className="gr-sizetag__t">
            Hadron-sized string ~10⁻¹⁵ m
          </span>
          <span ref={tagSub} className="gr-sizetag__s">
            Strong-force picture
          </span>
        </SceneLabel>
      </group>
      <group ref={eqG}>
        <SceneLabel position={[0, 0, 0]} align={mob ? 'left' : 'right'} tone="ink" opacity={op(0.56, 0.62)} className="gr-cons">
          <span className="gr-cons__row">
            <Status kind="derived" compact />
          </span>
          <span className="gr-cons__eq">
            <Eq tex="\text{consistency}\;\Rightarrow\;R_{\mu\nu}=0" />
          </span>
          <span className="gr-cons__note">empty space, + small corrections</span>
          <span className="gr-cons__soft">String graviton scattering softens at high energy (tree level) · derived</span>
        </SceneLabel>
      </group>
    </group>
  )
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const sup = (n: number) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')
