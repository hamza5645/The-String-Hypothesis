import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { SceneLabel, useChapterFrame, useIsoGridMaterial, COLORS } from '@/gl'
import { smoothstep } from '@/core/math'
import { S } from './director'
import { DynLabel } from './labels'
import { createPanelMaterial, getNoiseTexture } from './materials'
import { DEG, G_CONTOURS, SEA, TIPS, island, rhoOfG } from './model'
import { Ribbon, type RibbonApi } from './Ribbon'

/**
 * Beat 2 · Shallow water. A probe walks the IIA horn inward (g = 0.01 → 1). Above it, closed worldsheets
 * of genus h = 0…3, each with a bar of length g^(2h) (each handle costs g²). Near g = 1 no term can be dropped.
 */

const ROWS = [0, 1, 2, 3]
const ROW_Y = [1.42, 1.02, 0.62, 0.22]
const BAR_X = 0.1
const BAR_L = 0.72

function Genus({ h, mat }: { h: number; mat: THREE.ShaderMaterial }) {
  // genus-h cartoons: a sphere, then h tori fused side by side (not to scale)
  const tori = useMemo(() => new THREE.TorusGeometry(0.105, 0.045, 12, 40), [])
  const sphere = useMemo(() => new THREE.SphereGeometry(0.12, 24, 16), [])
  if (h === 0) return <mesh geometry={sphere} material={mat} renderOrder={8} />
  const xs = h === 1 ? [0] : h === 2 ? [-0.085, 0.085] : [-0.17, 0, 0.17]
  return (
    <group rotation={[0.55, 0, 0]}>
      {xs.map((x) => (
        <mesh key={x} geometry={tori} material={mat} position={[x, 0, 0]} renderOrder={8} />
      ))}
    </group>
  )
}

function FogPuff({ mat }: { mat: THREE.ShaderMaterial }) {
  return (
    <mesh material={mat} position={[-0.05, 0.85, -0.1]} renderOrder={7}>
      <planeGeometry args={[1.9, 1.8]} />
    </mesh>
  )
}

export function Shallow() {
  const camera = useThree((s) => s.camera)
  const probe = useRef<THREE.Group>(null)
  const stack = useRef<THREE.Group>(null)
  const bars = useRef<(THREE.Mesh | null)[]>([])
  const diamond = useRef<RibbonApi>(null)
  const pole = useRef<RibbonApi>(null)
  const sheet = useIsoGridMaterial({ grid: [16, 8], lineWidth: 0.7, fill: 0.04, fresnel: 0.7, color: COLORS.field, lineColor: COLORS.field })
  const barMat = useMemo(() => createPanelMaterial(COLORS.field, 0.45, 0.8), [])
  const fogMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uNoise: { value: getNoiseTexture() }, uAmt: { value: 0 }, uT: { value: 0 }, uColor: { value: new THREE.Color(COLORS.ink3) }, uField: { value: new THREE.Color(COLORS.field) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        // a soft field-tinted glow behind the stack (sea fog rolling in), lightly breathing
        fragmentShader: /* glsl */ `
          uniform sampler2D uNoise; uniform float uAmt; uniform float uT; uniform vec3 uColor; uniform vec3 uField; varying vec2 vUv;
          void main() {
            vec2 c = (vUv - 0.5) * vec2(1.0, 1.15);
            float r = length(c);
            float n = texture(uNoise, vUv * 0.9 + vec2(uT * 0.012, 0.0)).r;
            float edge = smoothstep(0.5, 0.3, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
            float a = exp(-r * r * 9.0) * (0.8 + 0.4 * n) * edge * uAmt;
            gl_FragColor = vec4(mix(uColor, uField, 0.45) * a, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useChapterFrame((f) => {
    const P = S.probe
    const vis = P.vis * S.mapFade
    if (probe.current) {
      probe.current.visible = vis > 0.003
      probe.current.position.set(P.x, P.y, P.z)
    }
    if (stack.current) stack.current.quaternion.copy(camera.quaternion)
    const g = P.g
    const fog = smoothstep(0.35, 0.95, g)
    sheet.uniforms.uOpacity.value = vis * (1 - 0.55 * fog)
    barMat.uniforms.uOpacity.value = vis
    fogMat.uniforms.uAmt.value = vis * fog * 0.7
    fogMat.uniforms.uT.value = f.t
    for (const h of ROWS) {
      const m = bars.current[h]
      if (!m) continue
      const l = Math.max(0.0015, BAR_L * Math.pow(g, 2 * h))
      m.scale.set(l, 1, 1)
      m.position.x = BAR_X + l / 2
    }
    if (diamond.current) diamond.current.material.uniforms.uOpacity.value = vis
    if (pole.current) pole.current.material.uniforms.uOpacity.value = vis * 0.6
  })

  const vis = () => S.probe.vis * S.mapFade
  const iia = TIPS[1].theta * DEG
  const onHorn = (rho: number, lat: number, lift = 0.03): [number, number, number] => {
    const d = lat / rho
    const x = rho * Math.cos(iia + d)
    const z = -rho * Math.sin(iia + d)
    return [x, Math.max(SEA, 0.12 + 0.9 * island(1, x, z)) + lift, z]
  }
  const SHORE_END = onHorn(3.66, -0.7, 0)
  const fmtW = (v: number) => (v >= 0.995 ? '1' : v >= 0.01 ? v.toFixed(2) : v >= 0.0001 ? v.toFixed(4) : '≈ 0')
  return (
    <>
      <group ref={probe}>
        <Ribbon
          ref={diamond}
          count={4}
          closed
          width={0.02}
          minPx={0.8}
          renderOrder={9}
          depthTest={false}
          init={(i, P) => {
            const a = (i / 4) * Math.PI * 2
            P.set([0.08 * Math.cos(a), 0.06 + 0.08 * Math.sin(a), 0], i * 3)
          }}
        />
        <Ribbon ref={pole} count={2} width={0.015} minPx={0.6} renderOrder={9} depthTest={false} init={(i, P) => P.set([0, i === 0 ? 0.14 : 0.3, 0], i * 3)} />
        <DynLabel position={[0.17, 0.06, 0]} align="left" tone="ink" opacity={vis} text={() => `g = ${S.probe.g < 0.1 ? S.probe.g.toFixed(3) : S.probe.g.toFixed(2)}`} />
        <group ref={stack} position={[0, 0.3, 0]}>
          <FogPuff mat={fogMat} />
          {ROWS.map((h) => (
            <group key={h} position={[-0.3, ROW_Y[h], 0]}>
              <Genus h={h} mat={sheet} />
            </group>
          ))}
          {ROWS.map((h) => (
            <mesh key={h} ref={(m) => void (bars.current[h] = m)} material={barMat} position={[BAR_X, ROW_Y[h], 0]} renderOrder={9}>
              <planeGeometry args={[1, 0.05]} />
            </mesh>
          ))}
          {ROWS.map((h) => (
            <SceneLabel key={h} position={[-0.62, ROW_Y[h], 0]} align="right" tone="dim" opacity={vis}>
              <span className="mth-mini">h = {h}</span>
            </SceneLabel>
          ))}
          {ROWS.map((h) => (
            <DynLabel key={h} position={[BAR_X + BAR_L + 0.06, ROW_Y[h], 0]} align="left" tone={h === 0 ? 'ink' : 'dim'} className="mth-mini" opacity={vis} text={() => fmtW(Math.pow(S.probe.g, 2 * h))} />
          ))}
          <SceneLabel position={[0.05, 1.68, 0]} align="above" tone="field" opacity={() => vis() * (1 - smoothstep(0.52, 0.66, S.probe.g))}>
            <span className="mth-mini mth-backed">EACH HANDLE COSTS g²</span>
          </SceneLabel>
          <SceneLabel position={[0.05, 1.68, 0]} align="above" tone="ink" opacity={() => vis() * smoothstep(0.66, 0.8, S.probe.g)}>
            <span className="mth-mini mth-backed">ALL WEIGHTS EQUAL · NO TERM CAN BE DROPPED</span>
          </SceneLabel>
        </group>
      </group>
      {/* each g-arc is labelled at its outboard end (leader tick from the arc's end) as the probe reaches it */}
      {G_CONTOURS.map((g) => (
        <SceneLabel key={g} position={onHorn(rhoOfG(g), 0.84, 0)} align="left" leader tone="field" opacity={() => vis() * smoothstep(rhoOfG(g) + 0.45, rhoOfG(g) + 0.1, S.probe.rho)}>
          <span className="mth-mini">g = {g}</span>
        </SceneLabel>
      ))}
      {/* the shoreline's far end: the bright line under the label is the sea-level crossing */}
      <SceneLabel position={SHORE_END} align="right" leader tone="field" opacity={() => vis() * S.shore * smoothstep(4.6, 4.2, S.probe.rho)}>
        <span className="mth-mini mth-shore">WHERE EASY CALCULATION ENDS · g ≈ 0.4</span>
      </SceneLabel>
    </>
  )
}
