import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Filament, SceneLabel, useChapterFrame, COLORS, type FilamentApi, type FilamentFn } from '@/gl'
import { smoothstep } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { Status } from '@/ui'
import { S } from './director'
import { APEX, bridgeAt, forkAt, type V3 } from './curves'
import { createPanelMaterial } from './materials'
import { BRIDGES, RESIDENT_Y, TIPS, T_D1, T_F1, fmtG, tipCenter } from './model'
import { Ribbon, type RibbonApi } from './Ribbon'
import { useM } from './store'

const N = 72
const tmp: V3 = [0, 0, 0]
const LOOP_LABEL = ((): V3 => {
  const p = bridgeAt('s-iib', 0.5, [0, 0, 0])
  return [p[0], p[1] - 0.05, p[2]]
})()

/* ───────────────────────── One bridge ───────────────────────── */

function BridgeLine({ i }: { i: number }) {
  const b = BRIDGES[i]
  const isT = b.kind === 'T'
  const main = useRef<RibbonApi>(null)
  const fork = useRef<RibbonApi>(null)
  const ring = useRef<RibbonApi>(null)
  const ringGroup = useRef<THREE.Group>(null)
  const mid = useMemo(() => {
    const p = bridgeAt(b.id, b.id === 's-iib' ? 0.5 : 0.5, [0, 0, 0])
    return [p[0], p[1] + (isT ? 0.42 : 0.26), p[2]] as V3
  }, [b.id, isT])
  const ringPos = useMemo(() => {
    const p = bridgeAt(b.id, 0.5, [0, 0, 0])
    return [p[0], p[1] + 0.26, p[2]] as V3
  }, [b.id])

  useChapterFrame((f) => {
    const grow = S.bridge[i]
    const hl = S.bridgeHL[i]
    const op = S.mapFade * (1 - S.focus) * (0.8 + 0.5 * hl) * (b.id === 's-i-ho' ? 1 : 1 - 0.85 * S.sFocus)
    const vis = grow > 0.002 && op > 0.003
    const mr = main.current
    if (mr) {
      mr.mesh.visible = vis
      mr.material.uniforms.uOpacity.value = op
    }
    const fr = fork.current
    if (fr) {
      fr.mesh.visible = vis
      fr.material.uniforms.uOpacity.value = op
    }
    if (main.current) main.current.material.uniforms.uGrow.value = b.id === 'c-k3' ? Math.min(1, grow / 0.999) : grow
    if (fork.current) fork.current.material.uniforms.uGrow.value = smoothstep(0.45, 1, grow)
    if (ring.current && ringGroup.current) {
      const rv = smoothstep(0.7, 1, grow) * op
      ring.current.mesh.visible = rv > 0.003
      ring.current.material.uniforms.uOpacity.value = rv
      ringGroup.current.rotation.y = prefersReducedMotion() ? 0.6 : f.t * 0.7
    }
  })

  const labelOp = () => smoothstep(0.85, 1, S.bridge[i]) * S.mapFade * (1 - S.focus) * (1 - S.cusps) * (1 - smoothstep(0.1, 0.3, S.pull)) * (isT ? 1 - S.sFocus : 1)
  const storyText = b.story ?? b.mid
  return (
    <>
      <Ribbon
        ref={main}
        count={N}
        width={isT ? 0.12 : 0.028}
        minPx={isT ? 2.2 : 0.7}
        double={isT}
        dash={isT ? 0 : 0.17}
        duty={0.55}
        glow={isT ? 0.12 : 0.3}
        renderOrder={4}
        init={(k, P) => {
          bridgeAt(b.id, k / (N - 1), tmp)
          P[k * 3] = tmp[0]
          P[k * 3 + 1] = tmp[1]
          P[k * 3 + 2] = tmp[2]
        }}
      />
      {b.id === 'c-k3' && (
        <Ribbon
          ref={fork}
          count={40}
          width={0.028}
          minPx={0.7}
          dash={0.17}
          renderOrder={4}
          init={(k, P) => {
            forkAt(k / 39, tmp)
            P[k * 3] = tmp[0]
            P[k * 3 + 1] = tmp[1]
            P[k * 3 + 2] = tmp[2]
          }}
        />
      )}
      {isT && (
        <group ref={ringGroup} position={ringPos}>
          <Ribbon
            ref={ring}
            count={48}
            closed
            width={0.022}
            minPx={0.7}
            init={(k, P) => {
              const a = (k / 48) * Math.PI * 2
              P[k * 3] = 0.2 * Math.cos(a)
              P[k * 3 + 1] = 0.2 * Math.sin(a)
              P[k * 3 + 2] = 0
            }}
          />
        </group>
      )}
      {storyText && (
        <SceneLabel position={b.id === 's-iib' ? LOOP_LABEL : mid} align={b.id === 's-iib' ? 'below' : 'above'} tone="field" opacity={() => labelOp() * (1 - S.labW) * (S.portrait ? 0 : 1)}>
          <span className="mth-bridge-label">
            <Status kind={b.status} compact /> {storyText}
          </span>
        </SceneLabel>
      )}
      {b.mid && b.id !== 's-iib' && (
        <SceneLabel position={mid} align="above" tone="field" opacity={() => labelOp() * (S.portrait ? 1 : S.labW) * (1 - S.dialW)}>
          <span className="mth-bridge-label">
            <Status kind={b.status} compact /> {b.mid}
          </span>
        </SceneLabel>
      )}
    </>
  )
}

/* ───────────────────────── Beat 3 · Type I's D-string walks the S-bridge ───────────────────────── */

const LOGT = (T: number) => (Math.log10(T) + 3) / 4 // log axis 10⁻³ … 10¹
const SA: V3 = [0, 0, 0]
const SB: V3 = [0, 0, 0]
const SM: V3 = [0, 0, 0]
const SR: V3 = [0, 0, 0]
const BAR_H = 1.0
const BAR_W = 0.17

function SDuality() {
  const camera = useThree((s) => s.camera)
  const dRib = useRef<RibbonApi>(null)
  const dFil = useRef<FilamentApi>(null)
  const bars = useRef<THREE.Group>(null)
  const barF = useRef<THREE.Mesh>(null)
  const barD = useRef<THREE.Mesh>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const matF = useMemo(() => createPanelMaterial(COLORS.filament, 0.3, 0.85), [])
  const matD = useMemo(() => createPanelMaterial(COLORS.field, 0.3, 0.85), [])
  const pts = useMemo(() => new Float32Array(24 * 3), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const I = useMemo(() => tipCenter(3), [])
  const last = useRef('')
  const fn = useMemo<FilamentFn>(() => (u, _t, out, i) => out.set(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]), [pts])
  const restGroup = useRef<THREE.Group>(null)

  useChapterFrame(() => {
    const vis = S.dstr.vis * S.mapFade
    const s = S.dstr.s
    const g = S.dstr.g
    right.setFromMatrixColumn(camera.matrixWorld, 0)
    // D-string: rests just under Type I's thread, then travels the arch (tangent-aligned)
    const rest = SR
    rest[0] = I[0]
    rest[1] = RESIDENT_Y - 0.3
    rest[2] = I[2]
    let cx: number, cy: number, cz: number, tx: number, ty: number, tz: number
    if (s <= 0) {
      cx = rest[0]
      cy = rest[1]
      cz = rest[2]
      tx = right.x
      ty = right.y
      tz = right.z
    } else {
      const a = bridgeAt('s-i-ho', Math.max(0, s - 0.02), SA)
      const b = bridgeAt('s-i-ho', Math.min(1, s + 0.02), SB)
      const m = bridgeAt('s-i-ho', s, SM)
      const k = smoothstep(0, 0.08, s)
      cx = rest[0] + (m[0] - rest[0]) * k
      cy = rest[1] + (m[1] + 0.12 - rest[1]) * k
      cz = rest[2] + (m[2] - rest[2]) * k
      const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1
      tx = right.x + ((b[0] - a[0]) / l - right.x) * k
      ty = right.y + ((b[1] - a[1]) / l - right.y) * k
      tz = right.z + ((b[2] - a[2]) / l - right.z) * k
    }
    const L = 0.95
    const rp = dRib.current?.points
    for (let i = 0; i < 24; i++) {
      const u = i / 23 - 0.5
      const wig = 0.012 * Math.sin(u * 9 + S.t * 2.2 * ambient())
      pts[i * 3] = cx + tx * u * L
      pts[i * 3 + 1] = cy + ty * u * L + wig
      pts[i * 3 + 2] = cz + tz * u * L
      if (rp) {
        rp[i * 3] = pts[i * 3]
        rp[i * 3 + 1] = pts[i * 3 + 1]
        rp[i * 3 + 2] = pts[i * 3 + 2]
      }
    }
    const warm = smoothstep(0.5, 0.75, s)
    const arrive = smoothstep(0.93, 1, s)
    if (dRib.current) {
      dRib.current.update()
      dRib.current.mesh.visible = vis > 0.003
      dRib.current.material.uniforms.uOpacity.value = vis * (1 - warm) * (1 - arrive)
    }
    if (dFil.current) {
      dFil.current.group.visible = vis * warm > 0.003
      dFil.current.material.uniforms.uOpacity.value = vis * warm * (1 - arrive)
    }
    if (restGroup.current) restGroup.current.quaternion.copy(camera.quaternion)
    // tension bars, screen-left of Type I (over open sea): F fixed, D ∝ 1/g (log axis 10⁻³ … 10¹)
    const bv = S.dstr.bars * S.mapFade
    if (bars.current) {
      bars.current.visible = bv > 0.003
      bars.current.quaternion.copy(camera.quaternion)
      bars.current.position.set(I[0] + right.x * 1.15, 0.4, I[2] + right.z * 1.15)
    }
    if (barF.current) {
      const h = BAR_H * LOGT(T_F1)
      barF.current.scale.set(1, h, 1)
      barF.current.position.y = h / 2
      matF.uniforms.uOpacity.value = bv
    }
    if (barD.current) {
      const h = BAR_H * LOGT(T_D1(g))
      barD.current.scale.set(1, h, 1)
      barD.current.position.y = h / 2
      matD.uniforms.uOpacity.value = bv
    }
    const txt = s >= 0.97 ? `g_HO = 1/g_I = ${fmtG(1 / g)}` : `g_I = ${fmtG(g)}`
    if (readout.current && txt !== last.current) {
      readout.current.textContent = txt
      last.current = txt
    }
  })

  const tickOp = (at: number) => () => smoothstep(at, at + 0.06, S.ticks) * S.dstr.vis * S.mapFade
  const tickPos = (s: number, dy: number): V3 => {
    const p = bridgeAt('s-i-ho', s, [0, 0, 0])
    return [p[0], p[1] + dy, p[2]]
  }
  const restOp = () => S.dstr.vis * S.mapFade * (1 - smoothstep(0.0, 0.06, S.dstr.s))
  const bOp = () => S.dstr.bars * S.mapFade
  return (
    <>
      <Ribbon ref={dRib} count={24} width={0.07} minPx={1.5} glow={0.9} renderOrder={7} depthTest={false} />
      <Filament ref={dFil} count={24} fn={fn} width={0.07} minPixels={1.2} intensity={1.2} renderOrder={7} depthTest={false} />
      {/* while resting: name the two strings (F: the island's thread, D: the brane lying under it) */}
      <group ref={restGroup} position={[I[0], RESIDENT_Y, I[2]]}>
        <SceneLabel position={[0, 0.2, 0]} align="above" tone="filament" opacity={restOp}>
          <span className="mth-mini">F-STRING</span>
        </SceneLabel>
        <SceneLabel position={[0, -0.36, 0]} align="below" tone="field" opacity={restOp}>
          <span className="mth-mini">D-STRING (A D1-BRANE)</span>
        </SceneLabel>
      </group>
      <group ref={bars}>
        <mesh ref={barF} material={matF} position={[-0.17, 0, 0]} renderOrder={7}>
          <planeGeometry args={[BAR_W, 1]} />
        </mesh>
        <mesh ref={barD} material={matD} position={[0.17, 0, 0]} renderOrder={7}>
          <planeGeometry args={[BAR_W, 1]} />
        </mesh>
        <SceneLabel position={[-0.17, -0.02, 0]} align="below" tone="filament" opacity={bOp}>
          <span className="mth-mini">F</span>
        </SceneLabel>
        <SceneLabel position={[0.17, -0.02, 0]} align="below" tone="field" opacity={bOp}>
          <span className="mth-mini">D</span>
        </SceneLabel>
        <SceneLabel position={[0, -0.2, 0]} align="below" tone="dim" opacity={bOp}>
          <span className="mth-mini mth-stack mth-stack--c">
            TENSION · LOG
            <br />
            <span className="mth-readout" ref={readout}>
              g_I = 0.10
            </span>
          </span>
        </SceneLabel>
      </group>
      <SceneLabel position={tickPos(0.24, 0.2)} align="above" tone="field" opacity={tickOp(0.2)}>
        <span className="mth-tick">LOW-ENERGY FIELDS ✓</span>
      </SceneLabel>
      <SceneLabel position={tickPos(0.5, -0.12)} align="below" tone="field" opacity={tickOp(0.45)}>
        <span className="mth-tick">PROTECTED SPECTRUM ✓</span>
      </SceneLabel>
      <SceneLabel position={tickPos(0.74, 0.2)} align="above" tone="field" opacity={tickOp(0.72)}>
        <span className="mth-tick">D-STRING = HETEROTIC STRING ✓</span>
      </SceneLabel>
    </>
  )
}

/* ───────────────────────── Lab: the focus card (hover / tap) ───────────────────────── */

const GAP_TEXT = 'Type I is IIB with direction-blind strings plus D9-branes: close relatives, not duals.'

function FocusCard() {
  const focus = useM((s) => s.focus)
  const station = useM((s) => s.station)
  let pos: V3 = [0, 0, 0]
  let title = ''
  let text = ''
  let status: 'derived' | 'conjectured' | null = null
  if (focus?.startsWith('tip:')) {
    const j = Number(focus.slice(4))
    const c = tipCenter(j)
    pos = [c[0], RESIDENT_Y - 0.5, c[2]]
    title = TIPS[j].name
    text = TIPS[j].hover
  } else if (focus?.startsWith('bridge:')) {
    const b = BRIDGES.find((x) => x.id === focus.slice(7))
    if (b) {
      const p = bridgeAt(b.id, 0.5, [0, 0, 0])
      pos = [p[0], (APEX[b.id] ?? p[1]) - 0.15, p[2]]
      title = b.kind === 'T' ? 'T-duality' : b.kind === 'S' ? 'S-duality' : b.kind === 'L' ? 'Strong-coupling lift' : 'Curl up four dimensions'
      text = b.hover
      status = b.status === 'derived' ? 'derived' : 'conjectured'
    }
  } else if (focus === 'gap') {
    const a = tipCenter(2)
    const b = tipCenter(3)
    pos = [(a[0] + b[0]) / 2, 0.5, (a[2] + b[2]) / 2]
    title = 'No bridge: an orientifold'
    text = GAP_TEXT
  }
  if (!focus || station !== 'map' || !text) return null
  return (
    <SceneLabel key={focus} position={pos} align="below" tone="ink" opacity={() => S.labW * S.mapFade}>
      <span className="mth-card">
        <span className="mth-card__title">
          {title} {status && <Status kind={status} compact />}
        </span>
        <span className="mth-card__text">{text}</span>
      </span>
    </SceneLabel>
  )
}

export function Bridges() {
  return (
    <>
      {BRIDGES.map((b, i) => (
        <BridgeLine key={b.id} i={i} />
      ))}
      <SDuality />
      <FocusCard />
    </>
  )
}
