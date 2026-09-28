/*
 * Beat 2 · General relativity (a cartoon of curvature). A 9 × 9 × 3 Field lattice bowed toward a neutral
 * Ink sphere: d = −k r̂/(r + 0.6), k = 0.35. At local p 0.7 the sphere splits into a binary whose orbit
 * speeds up as ω ∝ (t_c − t)^(−3/8) (separation ∝ (t_c − t)^(1/4)) and merges at 0.92; the grid carries the
 * m = 2 two-armed spiral, displacement ∝ cos(2θ − 2Ω(t − r/v)). Deformation runs in the vertex shader; the
 * spiral's crest lines (where that cosine = 1) are traced as two bright arms so the m = 2 shape reads.
 * Entry: the grid spreads out radially from where the graviton station stood. Exit: the camera comes edge-on
 * and the sheet folds into one hairline at the chart's x-axis — Beat 3 grows from it.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { SceneLabel, COLORS, useChapterFrame } from '@/gl'
import { clamp, lerp, smoothstep, TAU } from '@/core/math'
import { ambient } from '@/core/time'
import { D, labelFade, S } from './director'
import { chartDims } from './Chart'
import { lineMaterial, Segs } from './lines'

const G = 2.0 // half extent
const NL = 9
const LAYERS = [-0.5, 0, 0.5]
const SUB = 56
const NSP = 96 // segments per spiral arm

const vert = /* glsl */ `
  attribute float aLayer;
  uniform vec3 uM1;
  uniform vec3 uM2;
  uniform float uK1;
  uniform float uK2;
  uniform float uRip;
  uniform float uPhase;
  uniform float uWaveK;
  uniform float uFront;
  uniform float uTail;
  uniform float uStatic;
  uniform float uG;
  uniform float uGrow;
  varying float vA;
  vec3 pull(vec3 p, vec3 m, float k) {
    vec3 d = p - m;
    float r = length(d);
    float mag = min(k / (r + 0.6), 0.7 * r);
    return -mag * d / max(r, 1e-4);
  }
  void main() {
    vec3 p = position;
    p += pull(position, uM1, uK1) + pull(position, uM2, uK2);
    float rc = length(position.xz);
    float th = atan(position.z, position.x);
    float env = smoothstep(0.2, 0.75, rc) / (0.55 + rc);
    env *= smoothstep(uFront, uFront - 0.5, rc) * smoothstep(uTail - 0.5, uTail, rc);
    float wave = cos(2.0 * th - uPhase + uWaveK * rc);
    float rings = cos(6.2832 * rc / 0.8) * smoothstep(0.3, 0.8, rc) / (0.6 + rc);
    p.y += uRip * mix(env * wave, rings, uStatic) * (aLayer == 0.0 ? 1.0 : 0.65);
    float edge = 1.0 - smoothstep(uG * 0.7, uG * 1.02, max(abs(position.x), abs(position.z)));
    vA = (aLayer == 0.0 ? 1.0 : aLayer > 1.5 ? 0.1 : 0.3) * (0.35 + 0.65 * edge);
    vA *= 1.0 - smoothstep(uGrow - 0.6, uGrow, length(position.xz));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    gl_FragColor = vec4(uColor * vA * uOpacity, 1.0);
  }
`

const sphVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const sphFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = 1.0 - abs(dot(vN, vV));
    float rim = pow(f, 2.4);
    float key = max(dot(vN, normalize(vec3(-0.4, 0.7, 0.6))), 0.0);
    vec3 col = uColor * (0.05 + 0.85 * rim + 0.22 * key);
    gl_FragColor = vec4(col * uOpacity, 1.0);
  }
`

function sphereMat() {
  return new THREE.ShaderMaterial({
    vertexShader: sphVert,
    fragmentShader: sphFrag,
    uniforms: { uColor: { value: new THREE.Color(COLORS.ink) }, uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export function Spacetime() {
  const size = useThree((st) => st.size)
  const group = useRef<THREE.Group>(null!)
  const s0 = useRef<THREE.Mesh>(null!)
  const s1 = useRef<THREE.Mesh>(null!)
  const s2 = useRef<THREE.Mesh>(null!)
  const st = useMemo(() => ({ orb: 0, lastScroll: 0 }), [])

  const { geo, mat } = useMemo(() => {
    const pos: number[] = []
    const layer: number[] = []
    const lines: [number, number, number, number, number, number, number][] = []
    for (let l = 0; l < LAYERS.length; l++) {
      const y = LAYERS[l]
      for (let j = 0; j < NL; j++) {
        const c = -G + (2 * G * j) / (NL - 1)
        lines.push([-G, y, c, G, y, c, l - 1])
        lines.push([c, y, -G, c, y, G, l - 1])
      }
    }
    for (const [x0, y0, z0, x1, y1, z1, ly] of lines) {
      for (let i = 0; i < SUB; i++) {
        const a = i / SUB
        const b = (i + 1) / SUB
        pos.push(lerp(x0, x1, a), lerp(y0, y1, a), lerp(z0, z1, a), lerp(x0, x1, b), lerp(y0, y1, b), lerp(z0, z1, b))
        layer.push(ly, ly)
      }
    }
    // vertical struts between layers at every node
    for (let i = 0; i < NL; i++)
      for (let j = 0; j < NL; j++) {
        const x = -G + (2 * G * i) / (NL - 1)
        const z = -G + (2 * G * j) / (NL - 1)
        for (let k = 0; k < 8; k++) {
          const a = -0.5 + k / 8
          const b = -0.5 + (k + 1) / 8
          pos.push(x, a, z, x, b, z)
          layer.push(2, 2)
        }
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
    g.setAttribute('aLayer', new THREE.BufferAttribute(new Float32Array(layer), 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uM1: { value: new THREE.Vector3() },
        uM2: { value: new THREE.Vector3() },
        uK1: { value: 0.35 },
        uK2: { value: 0 },
        uRip: { value: 0 },
        uPhase: { value: 0 },
        uWaveK: { value: 5 },
        uFront: { value: 99 },
        uTail: { value: -1 },
        uStatic: { value: 0 },
        uG: { value: G },
        uGrow: { value: 99 },
        uColor: { value: new THREE.Color(COLORS.field) },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo: g, mat: m }
  }, [])
  const m0 = useMemo(sphereMat, [])
  const m1 = useMemo(sphereMat, [])
  const m2 = useMemo(sphereMat, [])
  const sphGeo = useMemo(() => new THREE.SphereGeometry(1, 40, 24), [])
  // the two crest arms of the m = 2 spiral (dynamic)
  const arms = useMemo(() => {
    const sg = new Segs().color(COLORS.field)
    for (let i = 0; i < 2 * NSP; i++) sg.seg(0, 0, 0, 0, 0, 0, 0)
    return { geo: sg.build(true), mat: lineMaterial(COLORS.field, 0) }
  }, [])

  useChapterFrame((f) => {
    const b = D.b
    const p = D.sp[S.gr]
    // enter after Beat 1's figure has cleared (the graviton station hands over at the centre); leave by
    // handing the flattened hairline to the chart's x-axis just after the boundary
    const enter = smoothstep(S.gr, S.gr + 0.2, b)
    const handover = smoothstep(S.qg + 0.005, S.qg + 0.07, b)
    const vis = enter * (1 - handover)
    const g = group.current
    g.visible = vis > 0.002
    if (!g.visible) return
    const u = mat.uniforms
    const amb = ambient()
    const reduced = D.reduced

    // leaving (local p 0.8 → 0.97, while the camera comes edge-on): the sheet folds flat and slides onto
    // Beat 3's x-axis — seen edge-on it is that one hairline
    const exit = smoothstep(0.8, 0.97, p)
    u.uOpacity.value = 0.62 * vis * lerp(1, 0.14, exit)
    u.uGrow.value = lerp(0.2, 3.4, enter)
    const { CW, CH } = chartDims(D.mobile)
    g.scale.set(lerp(1, CW / (2 * G), exit), lerp(0.2, 1, enter) * (1 - exit), 1 - 0.999 * exit)
    g.position.y = (-CH / 2) * exit

    // inspiral: τ ∈ [0,1] over local p 0.48 → 0.64 (inside the step's sticky window), then the ripple leaves
    const P0 = 0.48
    const PM = 0.64
    const tau = clamp((p - P0) / (PM - P0))
    const merged = p >= PM
    const binary = p > P0 && !merged
    const sep = 0.62 * Math.pow(1 - tau, 0.25)
    // orbital phase: scroll part Φ_s(τ) = Φ_tot (1 − (1−τ)^(5/8))  +  a time part Ω(τ)·dt (ω ∝ (1−τ)^(−3/8))
    const phiScroll = TAU * 4 * (1 - Math.pow(1 - Math.min(tau, 0.999), 5 / 8))
    const omega = TAU * 0.3 * Math.pow(1 - Math.min(tau, 0.97), -3 / 8)
    st.orb += (phiScroll - st.lastScroll) + omega * f.dt * amb * (p > P0 ? 1 : 0.4)
    st.lastScroll = phiScroll
    const orb = st.orb

    if (binary) {
      const c = Math.cos(orb) * sep * 0.5
      const s = Math.sin(orb) * sep * 0.5
      u.uM1.value.set(c, 0, s)
      u.uM2.value.set(-c, 0, -s)
      u.uK1.value = 0.175
      u.uK2.value = 0.175
    } else {
      u.uM1.value.set(0, 0, 0)
      u.uM2.value.set(0, 0, 0)
      u.uK1.value = 0.35
      u.uK2.value = 0
    }

    // waves: amplitude ∝ Ω^(2/3) ∝ (1−τ)^(−1/4); after merger a packet travels outward
    const k = 4.2 * Math.pow(1 - Math.min(tau, 0.9), -3 / 8)
    u.uWaveK.value = Math.min(k, 9.5)
    u.uPhase.value = 2 * orb
    if (p < P0) {
      u.uRip.value = 0
      u.uFront.value = 99
      u.uTail.value = -1
    } else if (!merged) {
      u.uRip.value = Math.min(0.2, 0.07 * Math.pow(1 - Math.min(tau, 0.95), -0.25)) * smoothstep(P0, P0 + 0.03, p)
      u.uFront.value = lerp(0.9, 3.4, smoothstep(P0, P0 + 0.08, p))
      u.uTail.value = -1
    } else {
      const q = Math.min(1, (p - PM) / 0.2)
      u.uRip.value = 0.2 * (1 - 0.45 * q)
      u.uFront.value = 3.4 + 2.5 * q
      u.uTail.value = lerp(0.2, 2.6, q)
    }
    u.uStatic.value = reduced ? 1 : 0
    if (reduced && p > P0) {
      u.uRip.value = 0.08
      u.uFront.value = 99
      u.uTail.value = -1
    }

    // the spiral's two crest arms: 2θ = uPhase − k r (mod 2π), riding the sheet at the crest height
    const armOn = !reduced && u.uRip.value > 0.001 ? vis * (1 - exit) : 0
    arms.mat.uniforms.uOpacity.value = 0.95 * armOn
    if (armOn > 0.002) {
      const ap = arms.geo.attributes.position.array as Float32Array
      const aa = arms.geo.attributes.aAlpha.array as Float32Array
      const k = u.uWaveK.value
      const ph = u.uPhase.value
      const front = u.uFront.value
      const tail = u.uTail.value
      const rip = u.uRip.value
      const r0 = 0.22
      const r1 = 1.98
      for (let arm = 0; arm < 2; arm++) {
        let px = 0
        let py = 0
        let pz = 0
        let pa = 0
        for (let i = 0; i <= NSP; i++) {
          const r = r0 + ((r1 - r0) * i) / NSP
          const th = (ph - k * r) / 2 + arm * Math.PI
          const env = (smoothstep(0.2, 0.75, r) / (0.55 + r)) * smoothstep(front, front - 0.5, r) * smoothstep(tail - 0.5, tail, r)
          // stay inside the square sheet
          const x = r * Math.cos(th)
          const z = r * Math.sin(th)
          const inside = 1 - smoothstep(1.85, 2.0, Math.max(Math.abs(x), Math.abs(z)))
          const y = rip * env
          const al = Math.min(1, env * 2.6) * inside
          if (i > 0) {
            const o = ((arm * NSP + i - 1) * 2) * 3
            ap[o] = px
            ap[o + 1] = py
            ap[o + 2] = pz
            ap[o + 3] = x
            ap[o + 4] = y
            ap[o + 5] = z
            const oa = (arm * NSP + i - 1) * 2
            aa[oa] = pa
            aa[oa + 1] = al
          }
          px = x
          py = y
          pz = z
          pa = al
        }
      }
      arms.geo.attributes.position.needsUpdate = true
      arms.geo.attributes.aAlpha.needsUpdate = true
    }

    // spheres (neutral Ink, rim-lit — never warm)
    const op = vis * (1 - exit)
    s0.current.visible = !binary
    s0.current.scale.setScalar(0.25)
    ;(s0.current.material as THREE.ShaderMaterial).uniforms.uOpacity.value = op
    s1.current.visible = binary
    s2.current.visible = binary
    const r2 = 0.2
    s1.current.scale.setScalar(r2)
    s2.current.scale.setScalar(r2)
    s1.current.position.copy(u.uM1.value)
    s2.current.position.copy(u.uM2.value)
    ;(s1.current.material as THREE.ShaderMaterial).uniforms.uOpacity.value = op
    ;(s2.current.material as THREE.ShaderMaterial).uniforms.uOpacity.value = op
  })

  const ann = (at: number) => () => D.v[S.gr] * labelFade(S.gr) * smoothstep(at, at + 0.06, D.sp[S.gr]) * (1 - smoothstep(0.72, 0.78, D.sp[S.gr]))
  const mob = size.width / Math.max(1, size.height) < 0.8
  return (
    <group ref={group}>
      <lineSegments geometry={geo} material={mat} frustumCulled={false} />
      <lineSegments geometry={arms.geo} material={arms.mat} frustumCulled={false} />
      <mesh ref={s0} geometry={sphGeo} material={m0} />
      <mesh ref={s1} geometry={sphGeo} material={m1} />
      <mesh ref={s2} geometry={sphGeo} material={m2} />
      <SceneLabel position={[-2.0, 0.75, -2.0]} align="left" leader tone="ink" opacity={ann(0.2)} className="gr-ann">
        Mercury · perihelion +43″ / century
      </SceneLabel>
      <SceneLabel position={[-2.0, -0.75, 2.0]} align="left" leader tone="ink" opacity={ann(0.32)} className="gr-ann">
        GPS · satellite clocks +38 <span className="gr-nc">μs</span> / day
      </SceneLabel>
      <SceneLabel position={mob ? [-2.0, -1.2, 2.0] : [2.0, -0.75, 2.0]} align={mob ? 'left' : 'right'} tone="field" opacity={ann(0.44)} className="gr-ann">
        GW150914 · 14 Sep 2015
      </SceneLabel>
    </group>
  )
}
