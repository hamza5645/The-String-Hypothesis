/*
 * Beat 1 · Four forces. Four hairline exchange sketches (Feynman notation): photon (wavy), W/Z (wavy + mass
 * tick), gluon (coiled), graviton (double wavy, dashed = hypothetical). Phase flows along each carrier at
 * 0.5 Hz. Hover/tap a station → a glass card (the force explorer). Under the row, a 38-decade log ruler:
 * gravity/electric force between two protons = G m_p²/(k_e e²) ≈ 8.1 × 10⁻³⁷, distance-independent.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoint, SceneLabel, COLORS, useChapterFrame, type GlowPointApi } from '@/gl'
import { claimPointer, setStageCursor } from '@/core/explore'
import { lerp, smoothstep, TAU } from '@/core/math'
import { ambient } from '@/core/time'
import { D, labelFade, S } from './director'
import { useGravity } from './store'
import { lineMaterial, Segs } from './lines'

const M = 72 // points per carrier curve
const RATIO_LOG = Math.log10(8.09e-37) // −36.09

type Layout = {
  st: [number, number][]
  half: number
  /** x of the vertical dashed divider between the Standard Model and gravity (desktop only). */
  div: number | null
  ruler: { y: number; x0: number; x1: number }
  /** Standard Model bracket [x0, x1, y]. */
  sm: [number, number, number]
  /** General-relativity bracket [x0, x1, y] (desktop); phones put the label beside the station instead. */
  gr: [number, number, number] | null
}

function layout(mobile: boolean): Layout {
  if (mobile) {
    return {
      st: [
        [-1.08, 1.22],
        [0, 1.22],
        [1.08, 1.22],
        [0, -0.3],
      ],
      half: 0.3,
      div: null,
      ruler: { y: -1.52, x0: -1.5, x1: 1.5 },
      sm: [-1.45, 1.45, 0.3],
      gr: null,
    }
  }
  return {
    st: [
      [-2.3, 0.55],
      [-0.95, 0.55],
      [0.4, 0.55],
      [2.05, 0.55],
    ],
    half: 0.4,
    div: 1.23,
    ruler: { y: -1.62, x0: -2.75, x1: 2.5 },
    sm: [-2.8, 0.9, -0.55],
    gr: [1.6, 2.5, -0.55],
  }
}

const NAMES = [
  ['Electromagnetism', 'Photon · spin 1'],
  ['Weak', 'W⁺ W⁻ Z · spin 1'],
  ['Strong', '8 gluons · spin 1'],
  ['Gravity', 'Graviton? · spin 2'],
]

export function Forces() {
  const group = useRef<THREE.Group>(null!)
  const bead = useRef<GlowPointApi>(null)
  const beadLabel = useRef<THREE.Group>(null!)
  const beadText = useRef<HTMLSpanElement>(null)
  const stationGroups = useRef<(THREE.Group | null)[]>([])
  const interactive = useRef(false)

  const size = useThree((st) => st.size)
  const mob = size.width / Math.max(1, size.height) < 0.8
  const L = useMemo(() => layout(mob), [mob])

  // carriers (EM, weak, strong) — one dynamic geometry; graviton (dashed double line) — another
  const carriers = useMemo(() => {
    const s = new Segs()
    for (let k = 0; k < 3; k++) for (let i = 0; i < M - 1; i++) s.seg(0, 0, 0, 0, 0, 0, 1, 0, 0)
    const geo = s.build(true)
    return { geo, mat: lineMaterial(COLORS.field, 0.95) }
  }, [])
  const grav = useMemo(() => {
    const s = new Segs()
    for (let k = 0; k < 2; k++) for (let i = 0; i < M - 1; i++) s.seg(0, 0, 0, 0, 0, 0, 1, i / (M - 1), (i + 1) / (M - 1))
    const geo = s.build(true)
    return { geo, mat: lineMaterial(COLORS.field, 0.95, 0.07, 0.55) }
  }, [])

  // static linework: particle lines, vertices, mass tick, brackets, divider, ruler (in group space)
  const statics = useMemo(() => {
    const s = new Segs()
    const h = L.half
    const ink3 = COLORS.ink2
    L.st.forEach(([x, y], i) => {
      s.color(ink3)
      s.seg(x - h, y + h * 0.9, 0, x + h, y + h * 0.9, 0, 0.8)
      s.seg(x - h, y - h * 0.9, 0, x + h, y - h * 0.9, 0, 0.8)
      // fermion arrows (small chevrons pointing right) on each particle line
      for (const yy of [y + h * 0.9, y - h * 0.9]) {
        for (const xx of [x - h * 0.55, x + h * 0.55]) {
          s.seg(xx + 0.035, yy, 0, xx - 0.02, yy + 0.03, 0, 0.8)
          s.seg(xx + 0.035, yy, 0, xx - 0.02, yy - 0.03, 0, 0.8)
        }
      }
      if (i === 1) {
        // mass tick on the W/Z carrier
        s.color(COLORS.field)
        s.seg(x - 0.12, y, 0, x + 0.12, y, 0, 0.9)
      }
    })
    s.color(COLORS.ink2)
    // brackets
    const [a0, a1, ay] = L.sm
    s.seg(a0, ay, 0, a1, ay, 0, 0.55)
    s.seg(a0, ay, 0, a0, ay + 0.08, 0, 0.55)
    s.seg(a1, ay, 0, a1, ay + 0.08, 0, 0.55)
    if (L.gr) {
      const [g0, g1, gy] = L.gr
      s.seg(g0, gy, 0, g1, gy, 0, 0.55)
      s.seg(g0, gy, 0, g0, gy + 0.08, 0, 0.55)
      s.seg(g1, gy, 0, g1, gy + 0.08, 0, 0.55)
    }
    // vertical dashed divider between the Standard Model and gravity (desktop)
    if (L.div !== null) {
      for (let k = 0; k < 14; k++) {
        const y0 = 1.15 - k * 0.14
        s.seg(L.div, y0, 0, L.div, y0 - 0.07, 0, 0.5)
      }
    }
    // ruler: 38 decade ticks from 10⁰ (left) to 10⁻³⁷ (right)
    const { y, x0, x1 } = L.ruler
    s.color(COLORS.field)
    s.seg(x0, y, 0, x1, y, 0, 0.55)
    for (let k = 0; k <= 37; k++) {
      const x = lerp(x0, x1, k / 37)
      const major = k % 10 === 0
      s.seg(x, y, 0, x, y + (major ? 0.11 : 0.05), 0, major ? 0.9 : 0.5)
    }
    return { geo: s.build(), mat: lineMaterial('#ffffff', 1) }
  }, [L])

  // pixel-free station dimming: per-vertex alpha on the carriers
  useChapterFrame((f) => {
    const b = D.b
    // Standard Model stations and all labels leave before the boundary; the graviton station slides to the
    // centre and stays a moment past it, handing over to the spacetime grid that spreads out from there
    const w = D.v[S.forces]
    // (phones: the beat's text scrolls up over the centre, so the station leaves with the rest of the figure)
    const gravW = D.mobile ? w : smoothstep(S.forces, S.forces + 0.12, b) * (1 - smoothstep(S.gr + 0.03, S.gr + 0.15, b))
    const g = group.current
    g.visible = Math.max(w, gravW) > 0.002
    interactive.current = D.w[S.forces] > 0.6 && w > 0.6 && f.h.active()
    if (!g.visible) return
    const p = D.sp[S.forces]
    const exit = smoothstep(S.gr - 0.2, S.gr, b)
    const enter = smoothstep(0.0, 0.14, p) + (b > S.forces + 0.5 ? 1 : 0)
    const sel = useGravity.getState().force
    const t = f.t * ambient()
    const om = TAU * 0.5
    const h = L.half

    const pos = carriers.geo.attributes.position.array as Float32Array
    const al = carriers.geo.attributes.aAlpha.array as Float32Array
    const gpos = grav.geo.attributes.position.array as Float32Array
    const gal = grav.geo.attributes.aAlpha.array as Float32Array

    for (let k = 0; k < 4; k++) {
      const [sx, sy] = L.st[k]
      // Beat 2 hand-off: SM stations drift left and dim; gravity's station slides to centre
      const x = k < 3 ? sx - 2.6 * exit : lerp(sx, 0, exit)
      const y = k < 3 ? sy : lerp(sy, 0, exit)
      const sg = stationGroups.current[k]
      if (sg) sg.position.set(x - sx, y - sy, 0)
      const focus = sel < 0 ? 1 : sel === k ? 1.25 : 0.35
      const alpha = focus * (k < 3 ? 1 - exit : 1) * Math.min(1, enter)
      const y0 = y - h * 0.9
      const y1 = y + h * 0.9
      const len = y1 - y0
      if (k < 3) {
        let o = k * (M - 1) * 2 * 3
        let oa = k * (M - 1) * 2
        let px = 0
        let py = 0
        for (let i = 0; i < M; i++) {
          const s = i / (M - 1)
          const env = smoothstep(0, 0.08, s) * smoothstep(0, 0.08, 1 - s)
          let cx: number
          let cy: number
          if (k === 2) {
            // gluon: a coil — the loops travel along the line
            const th = TAU * 5.5 * s - om * t
            cx = x + 0.075 * env * Math.sin(th)
            cy = y0 + len * s - 0.05 * env * (Math.cos(th) - 1)
          } else {
            const th = TAU * 3.5 * s - om * t
            cx = x + 0.07 * env * Math.sin(th)
            cy = y0 + len * s
          }
          if (i > 0) {
            pos[o++] = px
            pos[o++] = py
            pos[o++] = 0
            pos[o++] = cx
            pos[o++] = cy
            pos[o++] = 0
            al[oa++] = alpha
            al[oa++] = alpha
          }
          px = cx
          py = cy
        }
      } else {
        for (let side = 0; side < 2; side++) {
          let o = side * (M - 1) * 2 * 3
          let oa = side * (M - 1) * 2
          let px = 0
          let py = 0
          const off = side === 0 ? -0.03 : 0.03
          for (let i = 0; i < M; i++) {
            const s = i / (M - 1)
            const env = smoothstep(0, 0.08, s) * smoothstep(0, 0.08, 1 - s)
            const th = TAU * 3.5 * s - om * t
            const cx = x + off + 0.07 * env * Math.sin(th)
            const cy = y0 + len * s
            if (i > 0) {
              gpos[o++] = px
              gpos[o++] = py
              gpos[o++] = 0
              gpos[o++] = cx
              gpos[o++] = cy
              gpos[o++] = 0
              gal[oa++] = alpha
              gal[oa++] = alpha
            }
            px = cx
            py = cy
          }
        }
      }
    }
    carriers.geo.attributes.position.needsUpdate = true
    carriers.geo.attributes.aAlpha.needsUpdate = true
    grav.geo.attributes.position.needsUpdate = true
    grav.geo.attributes.aAlpha.needsUpdate = true
    const fade = w * Math.min(1, enter)
    carriers.mat.uniforms.uOpacity.value = fade
    grav.mat.uniforms.uOpacity.value = gravW * Math.min(1, enter)
    statics.mat.uniforms.uOpacity.value = fade * (1 - exit)

    // ruler bead: 10⁰ → 8 × 10⁻³⁷ as the beat plays (local p 0.35 → 0.8)
    const k = smoothstep(0.3, 0.62, p)
    const lg = RATIO_LOG * k
    const { y, x0, x1 } = L.ruler
    const bx = lerp(x0, x1, -lg / 37)
    if (bead.current) {
      bead.current.position.set(bx, y, 0.01)
      bead.current.material.uniforms.uIntensity.value = 1.1 * fade * (1 - exit) * smoothstep(0.2, 0.3, p)
    }
    beadLabel.current.position.set(bx, y + (mob ? 0.14 : 0.2), 0)
    if (beadText.current) {
      const e = Math.round(lg)
      const txt = k >= 0.999 ? '≈ 8 × 10⁻³⁷' : e === 0 ? '1' : `≈ 10${sup(e)}`
      if (beadText.current.textContent !== txt) beadText.current.textContent = txt
    }
  })

  const op = (extra: (p: number) => number = () => 1) => () => {
    const exit = smoothstep(S.gr - 0.2, S.gr - 0.08, D.b)
    return D.v[S.forces] * (1 - exit) * labelFade(S.forces) * extra(D.sp[S.forces])
  }
  const card = (i: number) => () => D.v[S.forces] * labelFade(S.forces) * (useGravity.getState().force === i ? 1 : 0)
  const h = L.half
  const lblY = -h - (mob ? 0.12 : 0.14)

  return (
    <group ref={group}>
      <lineSegments geometry={carriers.geo} material={carriers.mat} frustumCulled={false} />
      <lineSegments geometry={grav.geo} material={grav.mat} frustumCulled={false} />
      <lineSegments geometry={statics.geo} material={statics.mat} frustumCulled={false} />
      <GlowPoint ref={bead} size={0.12} minPixels={3} color={COLORS.ink} coreColor="#ffffff" intensity={0} />

      {L.st.map(([x, y], i) => (
        <group key={i} ref={(el) => void (stationGroups.current[i] = el)} position={[0, 0, 0]}>
          <group position={[x, y, 0]}>
            {/* invisible hit proxy for the force explorer (visible=false still raycasts; gated by `interactive`) */}
            <mesh
              visible={false}
              onPointerOver={(e) => {
                if (!interactive.current) return
                e.stopPropagation()
                useGravity.getState().setForce(i)
                setStageCursor('pointer')
              }}
              onPointerOut={() => {
                if (useGravity.getState().force === i) useGravity.getState().setForce(-1)
                setStageCursor('')
              }}
              onPointerDown={(e) => {
                if (!interactive.current) return
                e.stopPropagation()
                claimPointer()
                const s = useGravity.getState()
                s.setForce(s.force === i ? -1 : i)
              }}
            >
              <planeGeometry args={[h * 2.6, h * 3.2]} />
              <meshBasicMaterial />
            </mesh>
            <SceneLabel position={[0, lblY, 0]} align="below" tone={i === 3 ? 'field' : 'ink'} opacity={op((p) => smoothstep(0.02, 0.16, p))} className="gr-fl">
              <span className="gr-fl__name">{NAMES[i][0]}</span>
              <span className="gr-fl__sub">{NAMES[i][1]}</span>
            </SceneLabel>
            {i === 3 && (
              <SceneLabel
                position={mob ? [h + 0.14, 0, 0] : [0, h + 0.14, 0]}
                align={mob ? 'left' : 'above'}
                tone="dim"
                opacity={op((p) => smoothstep(0.1, 0.22, p))}
                className="gr-fl-tag"
              >
                <span className="gr-hollow">
                  <i aria-hidden="true" />
                  Not observed
                </span>
              </SceneLabel>
            )}
            {i === 3 && mob && (
              <SceneLabel position={[-h - 0.14, 0, 0]} align="right" tone="dim" opacity={op((p) => smoothstep(0.1, 0.24, p))} className="gr-bracket gr-bracket--side">
                General relativity
                <br />
                classical <span className="gr-dot">●</span>
              </SceneLabel>
            )}
            {!mob && (
              <SceneLabel position={[0, h + (i === 3 ? 0.42 : 0.12), 0]} align="above" tone="ink" opacity={card(i)} className="gr-card-wrap">
                <ForceCard i={i} />
              </SceneLabel>
            )}
          </group>
        </group>
      ))}

      <SceneLabel position={[(L.sm[0] + L.sm[1]) / 2, L.sm[2] - 0.06, 0]} align="below" tone="dim" opacity={op((p) => smoothstep(0.08, 0.22, p))} className="gr-bracket">
        Standard Model · quantum field theory <span className="gr-dot">●</span>
      </SceneLabel>
      {L.gr && (
        <SceneLabel position={[(L.gr[0] + L.gr[1]) / 2, L.gr[2] - 0.06, 0]} align="below" tone="dim" opacity={op((p) => smoothstep(0.1, 0.24, p))} className="gr-bracket">
          General relativity
          <br />
          classical <span className="gr-dot">●</span>
        </SceneLabel>
      )}
      {/* phones: one card, centred over the figure (tapped from the explorer buttons under the text) */}
      {mob &&
        [0, 1, 2, 3].map((i) => (
          <SceneLabel key={'card' + i} position={[0, 0.3, 0]} align="center" tone="ink" opacity={card(i)} className="gr-card-wrap">
            <ForceCard i={i} />
          </SceneLabel>
        ))}

      <SceneLabel position={[L.ruler.x0, L.ruler.y - 0.14, 0]} align="below" tone="dim" opacity={op((p) => smoothstep(0.2, 0.3, p))} className="gr-ruler-l">
        Electric repulsion,
        <br />
        two protons = 1
      </SceneLabel>
      <SceneLabel position={[L.ruler.x1, L.ruler.y - 0.14, 0]} align="below" tone="field" opacity={op((p) => smoothstep(0.56, 0.64, p))} className="gr-ruler-r">
        Gravity, same two
        <br />
        protons ≈ 8 × 10⁻³⁷
      </SceneLabel>
      <SceneLabel position={[(L.ruler.x0 + L.ruler.x1) / 2, L.ruler.y - 0.5, 0]} align="below" tone="dim" opacity={op((p) => smoothstep(0.45, 0.58, p))} className="gr-ruler-cap">
        Both fall as <span className="gr-nc">1/r²</span>
        {mob ? ': ' : ', so '}the ratio holds at any distance
      </SceneLabel>
      <group ref={beadLabel}>
        <SceneLabel position={[0, 0, 0]} align="above" tone="ink" opacity={op((p) => smoothstep(0.22, 0.3, p))}>
          <span ref={beadText}>1</span>
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

function ForceCard({ i }: { i: number }) {
  const rows: [string, string][][] = [
    [
      [
        'Mass',
        '0 · measured < 10⁻¹⁸ eV',
      ],
      ['Range', 'unlimited · 1/r²'],
      ['Strength', 'α ≈ 1/137'],
    ],
    [
      ['Mass', '80.4 / 91.2 GeV'],
      ['Range', '≈ 2.5 × 10⁻¹⁸ m'],
      ['Note', 'feeble at low energy because W and Z are heavy'],
    ],
    [
      ['Mass', '0 · confined inside hadrons (~10⁻¹⁵ m)'],
      ['Strength', 'αs ≈ 0.12 at 91 GeV'],
    ],
    [
      ['If it exists', 'massless (GW data: < 2 × 10⁻²³ eV)'],
      ['Range', 'unlimited'],
    ],
  ]
  const titles = ['Photon', 'W⁺ W⁻ Z', 'Gluons', 'Graviton?']
  return (
    <span className="gr-card">
      <span className="gr-card__t">{titles[i]}</span>
      {rows[i].map(([k, v]) => (
        <span key={k} className="gr-card__row">
          <span className="gr-card__k">{k}</span>
          <span className="gr-card__v">{v}</span>
        </span>
      ))}
    </span>
  )
}
