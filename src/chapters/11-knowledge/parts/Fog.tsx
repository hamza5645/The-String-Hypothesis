import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GlowPoints, useChapterFrame, type GlowPointsApi } from '@/gl'
import { rng } from '@/core/math'
import { particleScale } from '@/core/settings'
import { ambient } from '@/core/time'
import { visAt } from '../model'
import type { Stage } from '../director'

/*
 * Tier 3's fog: seven horizontal noise layers (10 × 10, y = 4.3…6.2, Speculative grey, 5% each)
 * drifting at 0.01 units/s, plus fine dust. One draw call for the layers, one for the dust.
 * Each layer obeys the evidence ceiling at its own height.
 */

const LAYERS = 7
const Y0 = 4.3
const Y1 = 6.2

const vert = /* glsl */ `
  attribute float aLayer;
  varying vec2 vP;
  varying float vLayer;
  void main() {
    vP = position.xz;
    vLayer = aLayer;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const frag = /* glsl */ `
  uniform float uA[${LAYERS}];
  uniform float uT;
  uniform vec3 uColor;
  varying vec2 vP;
  varying float vLayer;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }
  void main() {
    int li = int(vLayer + 0.5);
    float a = uA[li];
    if (a < 0.002) discard;
    // drift 0.01 units/s (uT is seconds × ambient)
    vec2 p = vP * 0.34 + vec2(vLayer * 3.1, vLayer * 1.7) + vec2(uT * 0.01, uT * 0.006) * (1.0 + vLayer * 0.2);
    float n = fbm(p);
    float cloud = smoothstep(0.28, 0.78, n);
    float r = length(vP);
    float edge = 1.0 - smoothstep(2.4, 5.0, r);
    gl_FragColor = vec4(uColor * cloud * edge * a, 1.0);
  }
`

export function Fog({ S }: { S: Stage }) {
  const layers = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos: number[] = []
    const lay: number[] = []
    const idx: number[] = []
    for (let l = 0; l < LAYERS; l++) {
      const y = Y0 + ((Y1 - Y0) * l) / (LAYERS - 1)
      const b = pos.length / 3
      pos.push(-5, y, -5, 5, y, -5, 5, y, 5, -5, y, 5)
      lay.push(l, l, l, l)
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 1))
    g.setIndex(idx)
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uA: { value: new Array(LAYERS).fill(0) }, uT: { value: 0 }, uColor: { value: new THREE.Color('#7D8190') } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    return { g, m }
  }, [])

  const n = Math.round(1200 * particleScale())
  const dust = useMemo(() => {
    const r = rng(91)
    const positions = new Float32Array(n * 3)
    const sizes = new Float32Array(n)
    const alphas = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * 5.2
      positions[i * 3] = Math.cos(a) * rad
      positions[i * 3 + 1] = Y0 - 0.1 + r() * (Y1 - Y0 + 0.4)
      positions[i * 3 + 2] = Math.sin(a) * rad
      sizes[i] = 0.03 + r() * 0.05
      alphas[i] = 0.3 + r() * 0.7
    }
    return { positions, sizes, alphas }
  }, [n])
  const dustRef = useRef<GlowPointsApi>(null)
  const dustGroup = useRef<THREE.Group>(null!)
  const mesh = useRef<THREE.Mesh>(null!)
  useLayoutEffect(
    () => () => {
      layers.g.dispose()
      layers.m.dispose()
    },
    [layers],
  )

  useChapterFrame(
    (f) => {
      const u = layers.m.uniforms
      const ceil = S.ceilOn > 0.001
      const base = S.fog * S.mapVis * S.atlasDim
      let any = 0
      for (let l = 0; l < LAYERS; l++) {
        const y = Y0 + ((Y1 - Y0) * l) / (LAYERS - 1)
        // pack: 5% per layer; drawn at 9% because additive grey on the void reads fainter than intended
        const a = 0.09 * base * (ceil ? visAt(S.yc, y) : 1)
        u.uA.value[l] = a
        any = Math.max(any, a)
      }
      u.uT.value = f.t * ambient()
      mesh.current.visible = any > 0.0005
      const dv = base * (ceil ? visAt(S.yc, 5.25) : 1)
      if (dustRef.current) dustRef.current.material.uniforms.uIntensity.value = 1.1 * dv
      dustGroup.current.visible = dv > 0.002
      dustGroup.current.rotation.y = f.t * 0.01 * ambient()
    },
    { priority: -1.5 },
  )

  return (
    <>
      <mesh ref={mesh} geometry={layers.g} material={layers.m} frustumCulled={false} renderOrder={0} />
      <group ref={dustGroup}>
        <GlowPoints ref={dustRef} positions={dust.positions} sizes={dust.sizes} alphas={dust.alphas} color="#5C6270" minPixels={0.8} maxPixels={3} intensity={0} />
      </group>
    </>
  )
}
