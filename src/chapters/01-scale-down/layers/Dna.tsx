import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoint, SceneLabel, useChapterFrame, COLORS, type GlowPointApi } from '@/gl'
import { rng, smoothstep } from '@/core/math'
import { particleScale } from '@/core/settings'
import { FLICKER, HASH, MASK, NEAR_FADE, POINT_FRAG, POINT_FRAG_MASKED, lineMaterial, maskUniforms, updateMask } from '../glsl'
import { carbonHazeA, rt, win } from '../runtime'

/*
 * Beat 1 end + Beat 2. A right-handed B-DNA double helix (Ink hairline backbones of ~4k points each,
 * Ink-3 base-pair rungs, 0.05 rev/s), depth-shaded so the near strand reads in front, with its
 * minor/major grooves (the backbones sit ~130° apart around the axis on the minor-groove side),
 * which resolves into overlapping atom hazes. The reticle locks onto one carbon
 * of a sugar ring; that atom becomes a flicker haze sampled from Slater's radial densities
 * (Lab Model 3): 1s P(r) ∝ r² e^(−2Z₁r/a₀) (Z₁ = 5.70) with probability 2/6, n = 2 P(r) ∝ r⁴ e^(−Z₂r/a₀)
 * (Z₂ = 3.25) with probability 4/6. No rings, no orbit tracks, no electron balls.
 * Units: Å (DNA helix drawn in the same Å frame).
 */

const RISE = 3.38
const TWIST = (36 * Math.PI) / 180
const DEG = Math.PI / 180
const R_TARGET = 7.6 // radius of the target C4' (Å)
const P_DX = 3.8 // axial offset of each phosphate from its C1' (Å); sets the groove asymmetry
const A0_ANG = 0.529177 // Bohr radius, Å

type Atom = { x: number; y: number; z: number; sigma: number; target: boolean }

/** Approximate B-DNA atoms around the target (cylindrical templates, dyad-mirrored strand B). */
function buildAtoms(nbp: number) {
  // strand A template relative to its C1' (r Å, Δθ°, Δx Å)
  const sugar: [number, number, number, number][] = [
    [5.9, 0, 0, 0.42], // C1'
    [6.3, -11, -0.8, 0.42], // O4'
    [7.6, -14, -0.5, 0.42], // C4'  ← target when j = 0
    [8.4, -6, 0.3, 0.42], // C3'
    [7.3, 3, 0.8, 0.42], // C2'
    [9.5, -9, 1.2, 0.42], // O3'
    [8.5, -24, -1.9, 0.42], // C5'
    [8.9, -32, -2.8, 0.42], // O5'
    [8.9, -40, -3.8, 0.5], // P
    [10.3, -44, -4.4, 0.42], // OP1
    [9.9, -46, -3.0, 0.42], // OP2
  ]
  const atoms: Atom[] = []
  const cyl = (x: number, r: number, th: number) => new THREE.Vector3(x, r * Math.sin(th), r * Math.cos(th))
  // shift so the target (j = 0, C4') sits at x = 0, θ = 0
  const X0 = -0.5
  const T0 = -14 * DEG
  for (let j = -nbp; j <= nbp; j++) {
    const xj = j * RISE
    const tj = j * TWIST
    const c1A = cyl(xj - X0, 5.9, tj - T0)
    const dyad = tj + 65 * DEG
    const c1B = cyl(xj - X0, 5.9, 2 * dyad - tj - T0)
    for (const [r, dth, dx, sg] of sugar) {
      const a = cyl(xj + dx - X0, r, tj + dth * DEG - T0)
      atoms.push({ x: a.x, y: a.y, z: a.z, sigma: sg, target: j === 0 && r === 7.6 && dth === -14 })
      // strand B: 180° about the dyad axis → Δx → −Δx, θ → 2θ_d − θ
      const b = cyl(xj - dx - X0, r, 2 * dyad - (tj + dth * DEG) - T0)
      atoms.push({ x: b.x, y: b.y, z: b.z, sigma: sg, target: false })
    }
    // bases: a hexagon ring (+ exocyclic atoms) from each C1' toward the partner, in the plane x = xj
    const u = c1B.clone().sub(c1A)
    u.x = 0
    u.normalize()
    const v = new THREE.Vector3(1, 0, 0).cross(u).normalize()
    const ring: [number, number][] = []
    for (let k = 0; k < 6; k++) ring.push([2.95 + 1.4 * Math.cos(Math.PI + (k * Math.PI) / 3), 1.4 * Math.sin(Math.PI + (k * Math.PI) / 3)])
    ring.push([3.7, 2.45], [4.1, -2.2])
    if (j % 2 === 0) ring.push([4.9, 1.2], [5.0, -1.0])
    for (const [a, b] of ring) {
      const pA = c1A.clone().addScaledVector(u, a).addScaledVector(v, b)
      const pB = c1B.clone().addScaledVector(u, -a).addScaledVector(v, -b)
      atoms.push({ x: pA.x, y: pA.y, z: pA.z, sigma: 0.4, target: false })
      atoms.push({ x: pB.x, y: pB.y, z: pB.z, sigma: 0.4, target: false })
    }
  }
  return atoms
}

/** Continuous backbone helices through the phosphates, and base-pair rungs (Å). */
function buildHelix(pointsPerStrand: number, halfLen: number) {
  const n = pointsPerStrand
  const pos = new Float32Array(n * 2 * 3)
  const rnd = new Float32Array(n * 2 * 4)
  const r = rng(5)
  const X0 = -0.5
  const T0 = -14 * DEG
  for (let i = 0; i < n; i++) {
    const x = -halfLen + (2 * halfLen * i) / (n - 1)
    // strand A phosphates: x = j·RISE − 3.8, θ = j·36° − 40°; strand B mirrored through the dyad.
    // At equal x the two backbones sit 129° apart (minor groove) and 231° (major groove), as in B-DNA.
    const jA = (x + X0 + P_DX) / RISE
    const thA = jA * TWIST - 40 * DEG - T0
    const jB = (x + X0 - P_DX) / RISE
    const thB = jB * TWIST + 130 * DEG + 40 * DEG - T0
    pos.set([x, 8.9 * Math.sin(thA), 8.9 * Math.cos(thA)], i * 3)
    pos.set([x, 8.9 * Math.sin(thB), 8.9 * Math.cos(thB)], (n + i) * 3)
    rnd.set([r(), r(), r(), r()], i * 4)
    rnd.set([r(), r(), r(), r()], (n + i) * 4)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
  // rungs
  const segs: number[] = []
  const cols: number[] = []
  const nbp = Math.floor(halfLen / RISE)
  for (let j = -nbp; j <= nbp; j++) {
    const xj = j * RISE - X0
    const tj = j * TWIST
    const dyad = tj + 65 * DEG
    const a = [xj, 5.9 * Math.sin(tj - T0), 5.9 * Math.cos(tj - T0)]
    const b = [xj, 5.9 * Math.sin(2 * dyad - tj - T0), 5.9 * Math.cos(2 * dyad - tj - T0)]
    const fade = 1 - smoothstep(halfLen * 0.55, halfLen, Math.abs(xj))
    segs.push(...a, ...b)
    cols.push(fade, fade, fade, fade, fade, fade)
  }
  const rg = new THREE.BufferGeometry()
  rg.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3))
  rg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  return { strands: g, rungs: rg }
}

const helixVert = /* glsl */ `
  ${NEAR_FADE}
  attribute vec4 aRand;
  uniform float uAlpha;
  uniform float uPx;
  uniform float uTime;
  uniform float uHalf;
  uniform vec3 uColor;
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float ends = 1.0 - smoothstep(uHalf * 0.55, uHalf, abs(position.x));
    float tw = 0.8 + 0.2 * sin(uTime * (1.0 + 2.0 * aRand.x) + aRand.y * 40.0);
    // depth relative to the helix axis: the near strand is bright and a little heavier, the far one recedes
    vec4 ax = modelViewMatrix * vec4(position.x, 0.0, 0.0, 1.0);
    float rr = length((modelViewMatrix * vec4(0.0, 8.9, 0.0, 0.0)).xyz);
    float front = clamp(0.5 + 0.5 * (mv.z - ax.z) / max(rr, 1e-6), 0.0, 1.0);
    vA = uAlpha * ends * tw * nearFade(mv) * mix(0.2, 1.0, front * front);
    vCol = uColor;
    gl_PointSize = uPx * mix(1.0, 1.9, front);
  }
`

const atomVert = /* glsl */ `
  ${HASH}
  ${FLICKER}
  ${NEAR_FADE}
  attribute vec4 aRand;   // seed, tau, phase, sigma
  attribute float aTarget;
  uniform float uAlpha;
  uniform float uTargetFade;
  uniform float uPx;
  uniform float uHalf;
  uniform vec3 uColor;
  varying vec3 vCol;
  varying float vA;
  void main() {
    flicker(aRand);
    vec4 h = hash44(vec4(aRand.x, gCycle, 1.9, 7.1));
    // 3D Gaussian (Box–Muller)
    float rr = sqrt(-2.0 * lnu(h.x));
    float r2 = sqrt(-2.0 * lnu(h.z));
    vec3 g = vec3(rr * cos(6.2831853 * h.y), rr * sin(6.2831853 * h.y), r2 * cos(6.2831853 * h.w));
    vec3 p = position + g * aRand.w;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float ends = 1.0 - smoothstep(uHalf * 0.5, uHalf, abs(position.x));
    vA = uAlpha * envelope() * nearFade(mv) * ends * mix(1.0, uTargetFade, aTarget);
    vCol = uColor;
    gl_PointSize = uPx * 1.6;
  }
`

// one soft Gaussian glow per atom (world-sized): the continuous part of each haze ball; where
// bonded atoms overlap, their haze is shared
const glowVert = /* glsl */ `
  ${NEAR_FADE}
  attribute vec4 aRand;   // x unused, w = sigma (Å)
  attribute float aTarget;
  uniform float uAlpha;
  uniform float uTargetFade;
  uniform float uResY;
  uniform float uHalf;
  varying float vA;
  varying float vK;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
    float px = 5.0 * aRand.w * ws * projectionMatrix[1][1] * uResY * 0.5 / max(-mv.z, 1e-4);
    float ends = 1.0 - smoothstep(uHalf * 0.5, uHalf, abs(position.x));
    // sprites clamped by the point-size limit would look wrong: fade them
    vA = uAlpha * ends * nearFade(mv) * (1.0 - smoothstep(700.0, 1000.0, px)) * mix(1.0, uTargetFade, aTarget);
    // fill rate: the glow keeps its true size (px), but only the disc where it can still add 1/255 is
    // rasterised: exp(-6.25 r²)·vA ≥ 1/255 ⇔ r² ≤ ln(255 vA) / 6.25. A sprite too faint to show is culled.
    float k2 = log(max(255.0 * vA, 1.0)) / 6.25;
    vK = sqrt(min(k2, 1.0));
    gl_PointSize = clamp(px * vK, 1.0, 1024.0);
    if (k2 <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`
const glowFrag = /* glsl */ `
  ${MASK}
  uniform vec3 uColor;
  varying float vA;
  varying float vK;
  void main() {
    vec2 c = (gl_PointCoord * 2.0 - 1.0) * vK;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float g = exp(-r2 * 6.25) * (1.0 - r2);
    if (g * vA < 1.0 / 255.0) discard;
    gl_FragColor = vec4(uColor * g * vA * textMask(), 1.0);
  }
`

const carbonVert = /* glsl */ `
  ${HASH}
  ${FLICKER}
  ${NEAR_FADE}
  attribute vec4 aRand;   // seed, tau, phase, shell (x < 1/3 → 1s)
  uniform float uAlpha;
  uniform float uPx;
  uniform float uS1;      // a0 / (2 Z1)  (Å)
  uniform float uS2;      // a0 / Z2      (Å)
  uniform vec3 uColor;
  varying vec3 vCol;
  varying float vA;
  void main() {
    flicker(aRand);
    vec4 h1 = hash44(vec4(aRand.x, gCycle, 2.3, 5.9));
    vec4 h2 = hash44(vec4(aRand.x, gCycle, 8.1, 0.7));
    float r;
    if (aRand.w < 1.0 / 3.0) {
      // 1s: Gamma(3, a0/2Z1)
      r = -uS1 * (lnu(h1.x) + lnu(h1.y) + lnu(h1.z));
    } else {
      // n = 2: Gamma(5, a0/Z2)
      r = -uS2 * (lnu(h1.x) + lnu(h1.y) + lnu(h1.z) + lnu(h1.w) + lnu(h2.x));
    }
    vec3 p = isoDir(h2.y, h2.z) * r;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = uAlpha * envelope() * nearFade(mv);
    vCol = uColor;
    gl_PointSize = uPx * (1.2 + 1.1 * h2.w);
  }
`

/** Base-pair rungs: hairlines, dimmer toward the back of the helix. */
function rungMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      ${NEAR_FADE}
      attribute vec3 color;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vec4 ax = modelViewMatrix * vec4(position.x, 0.0, 0.0, 1.0);
        float rr = length((modelViewMatrix * vec4(0.0, 5.9, 0.0, 0.0)).xyz);
        float front = clamp(0.5 + 0.5 * (mv.z - ax.z) / max(rr, 1e-6), 0.0, 1.0);
        vA = color.r * nearFade(mv) * mix(0.25, 1.0, front);
      }
    `,
    fragmentShader: /* glsl */ `
      ${MASK}
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vA;
      void main() {
        gl_FragColor = vec4(uColor * vA * uOpacity * textMask(), 1.0);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color('#7A8090') }, uOpacity: { value: 0 }, ...maskUniforms() },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
}

const pointsMat = (vertexShader: string, uniforms: Record<string, THREE.IUniform>, masked = false) =>
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: masked ? POINT_FRAG_MASKED : POINT_FRAG,
    uniforms: { uAlpha: { value: 0 }, uPx: { value: 1 }, uColor: { value: new THREE.Color(COLORS.ink) }, ...maskUniforms(), ...uniforms },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })

/** Slater sampler on the CPU (for the detection events), same distribution as the GPU haze. */
function sampleCarbon(r: () => number, out: THREE.Vector3) {
  const ln = (u: number) => Math.log(Math.max(u, 1e-6))
  const oneS = r() < 1 / 3
  const rad = oneS ? (-A0_ANG / (2 * 5.7)) * (ln(r()) + ln(r()) + ln(r())) : (-A0_ANG / 3.25) * (ln(r()) + ln(r()) + ln(r()) + ln(r()) + ln(r()))
  const z = 2 * r() - 1
  const a = 2 * Math.PI * r()
  const s = Math.sqrt(1 - z * z)
  // keep the flash on the visible side of the atom
  out.set(s * Math.cos(a) * rad, s * Math.sin(a) * rad, Math.abs(z) * rad)
}

export function Dna() {
  const dpr = useThree((s) => s.viewport.dpr)
  const ps = particleScale()
  const HALF = 120
  const helix = useMemo(() => buildHelix(Math.round(4000 * Math.max(0.6, ps)), HALF), [ps])
  const atoms = useMemo(() => {
    const list = buildAtoms(13)
    const perOf = (a: Atom) => {
      const d = Math.hypot(a.x, a.y, a.z - R_TARGET)
      const base = d < 4 ? 320 : d < 7 ? 140 : d < 12 ? 60 : 26
      return Math.max(8, Math.round(base * ps))
    }
    const n = list.reduce((acc, a) => acc + perOf(a), 0)
    const pos = new Float32Array(n * 3)
    const rnd = new Float32Array(n * 4)
    const tgt = new Float32Array(n)
    const r = rng(9)
    let k = 0
    for (const a of list) {
      const per = perOf(a)
      for (let i = 0; i < per; i++, k++) {
        pos.set([a.x, a.y, a.z], k * 3)
        rnd.set([r() * 1000, r(), r(), a.sigma], k * 4)
        tgt[k] = a.target ? 1 : 0
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
    g.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 1))
    // one glow sprite per atom
    const gp = new Float32Array(list.length * 3)
    const gr = new Float32Array(list.length * 4)
    const gt = new Float32Array(list.length)
    list.forEach((a, i) => {
      gp.set([a.x, a.y, a.z], i * 3)
      gr.set([0, 0, 0, a.sigma], i * 4)
      gt[i] = a.target ? 1 : 0
    })
    const glow = new THREE.BufferGeometry()
    glow.setAttribute('position', new THREE.BufferAttribute(gp, 3))
    glow.setAttribute('aRand', new THREE.BufferAttribute(gr, 4))
    glow.setAttribute('aTarget', new THREE.BufferAttribute(gt, 1))
    return { pts: g, glow }
  }, [ps])
  const carbon = useMemo(() => {
    const n = Math.round(30000 * ps)
    const pos = new Float32Array(n * 3)
    const rnd = new Float32Array(n * 4)
    const r = rng(12)
    for (let i = 0; i < n; i++) rnd.set([r() * 1000, r(), r(), r()], i * 4)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
    return g
  }, [ps])

  const helixMat = useMemo(() => pointsMat(helixVert, { uTime: { value: 0 }, uHalf: { value: HALF } }, true), [])
  const rungMat = useMemo(() => rungMaterial(), [])
  const dimMat = useMemo(() => lineMaterial('#86A8D8'), [])
  const atomMat = useMemo(
    () => pointsMat(atomVert, { uTime: { value: 0 }, uTauMin: { value: 0.4 }, uTauMax: { value: 1.2 }, uHalf: { value: 13 * RISE }, uTargetFade: { value: 1 } }, true),
    [],
  )
  const carbonMat = useMemo(
    () =>
      pointsMat(carbonVert, {
        uTime: { value: 0 },
        uTauMin: { value: 0.4 },
        uTauMax: { value: 1.2 },
        uS1: { value: A0_ANG / (2 * 5.7) },
        uS2: { value: A0_ANG / 3.25 },
      }, true),
    [],
  )
  const dimGeo = useMemo(() => {
    // "2 nm" dimension arrow across the helix (Å): vertical line with end ticks and arrowheads
    const x = 32
    const zc = -R_TARGET
    const s = [x, -10, zc, x, 10, zc, x - 1.6, -10, zc, x + 1.6, -10, zc, x - 1.6, 10, zc, x + 1.6, 10, zc]
    s.push(x, 10, zc, x - 0.9, 8.2, zc, x, 10, zc, x + 0.9, 8.2, zc, x, -10, zc, x - 0.9, -8.2, zc, x, -10, zc, x + 0.9, -8.2, zc)
    const c = new Array((s.length / 3) * 3).fill(1)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(s, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
    return g
  }, [])
  useLayoutEffect(
    () => () => {
      helix.strands.dispose()
      helix.rungs.dispose()
      atoms.pts.dispose()
      atoms.glow.dispose()
      carbon.dispose()
      dimGeo.dispose()
      for (const m of [helixMat, rungMat, dimMat, atomMat, carbonMat]) m.dispose()
    },
    [helix, atoms, carbon, dimGeo, helixMat, rungMat, dimMat, atomMat, carbonMat],
  )
  const mkPts = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const p = new THREE.Points(g, m)
    p.frustumCulled = false
    return p
  }
  const helixPts = useMemo(() => mkPts(helix.strands, helixMat), [helix, helixMat])
  const atomPts = useMemo(() => mkPts(atoms.pts, atomMat), [atoms, atomMat])
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        uniforms: { uAlpha: { value: 0 }, uTargetFade: { value: 1 }, uResY: { value: 900 }, uHalf: { value: 13 * RISE }, uColor: { value: new THREE.Color(COLORS.ink) }, ...maskUniforms() },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useLayoutEffect(() => () => glowMat.dispose(), [glowMat])
  const glowPts = useMemo(() => mkPts(atoms.glow, glowMat), [atoms, glowMat])
  const carbonPts = useMemo(() => mkPts(carbon, carbonMat), [carbon, carbonMat])

  const layer = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const hx = useRef<THREE.Group>(null!)
  const at = useRef<THREE.Group>(null!)
  const cb = useRef<THREE.Group>(null!)
  const dim = useRef<THREE.Group>(null!)
  const flash = useRef<GlowPointApi>(null)
  const flashAnchor = useRef<THREE.Group>(null!)
  const det = useMemo(() => ({ cycle: -1, p: new THREE.Vector3(), right: false }), [])

  useChapterFrame((f) => {
    const aHelix = win(rt.s, -7.35, -9.0, 0.5)
    const aAtoms = win(rt.s, -8.05, -9.55, 0.45)
    const aCarbon = win(rt.s, -8.6, -11.5, 1.2)
    const any = aHelix + aAtoms + aCarbon > 0.002
    layer.current.visible = any
    if (!any) return
    const sc = 1e-10 * rt.k // local unit: Å
    layer.current.scale.setScalar(sc)
    // the axis is turned 9° out of the picture plane (about the focus), so the helix foreshortens
    // like the 3D coil it is; it spins about its own axis (R_TARGET behind the focus) until the lock
    tilt.current.rotation.set(0, -0.16 * (1 - rt.lock), 0)
    spin.current.position.set(0, 0, -R_TARGET)
    spin.current.rotation.set(rt.helixAngle, 0, 0)
    hx.current.visible = aHelix > 0.002
    at.current.visible = aAtoms > 0.002
    cb.current.visible = aCarbon > 0.002
    dim.current.visible = aHelix > 0.002
    helixMat.uniforms.uAlpha.value = aHelix * (1 - 0.65 * smoothstep(-8.1, -8.7, rt.s))
    helixMat.uniforms.uTime.value = rt.ta
    helixMat.uniforms.uPx.value = dpr
    rungMat.uniforms.uOpacity.value = aHelix * 0.55 * (1 - smoothstep(-8.0, -8.5, rt.s))
    dimMat.uniforms.uOpacity.value = win(rt.s, -7.6, -8.45, 0.25) * 0.8 * (1 - rt.labW)
    updateMask(helixMat.uniforms, dpr)
    updateMask(rungMat.uniforms, dpr)
    updateMask(dimMat.uniforms, dpr)
    updateMask(carbonMat.uniforms, dpr)
    atomMat.uniforms.uAlpha.value = aAtoms * 0.62
    atomMat.uniforms.uTime.value = rt.ta
    atomMat.uniforms.uPx.value = dpr
    atomMat.uniforms.uTargetFade.value = 1 - smoothstep(-8.55, -9.0, rt.s)
    glowMat.uniforms.uAlpha.value = aAtoms * 0.16 * (1 - smoothstep(-8.75, -9.2, rt.s))
    updateMask(glowMat.uniforms, dpr)
    updateMask(atomMat.uniforms, dpr)
    glowMat.uniforms.uTargetFade.value = 1 - smoothstep(-8.55, -9.0, rt.s)
    glowMat.uniforms.uResY.value = rt.H * dpr
    carbonMat.uniforms.uAlpha.value = carbonHazeA(rt.s) * 0.25 * 2.6
    carbonMat.uniforms.uTime.value = rt.ta
    carbonMat.uniforms.uPx.value = dpr

    // detection event every 3 s: one sample flashes to a bright dot, holds 0.6 s, fades back
    // (reduced motion: the clock rt.ta stands still, so one detection is shown as a still)
    const cyc = Math.floor(rt.ta / 3)
    const ph = rt.ta - cyc * 3
    if (cyc !== det.cycle) {
      det.cycle = cyc
      sampleCarbon(rng(1000 + cyc), det.p)
    }
    const env = smoothstep(1.9, 2.0, ph) * (1 - smoothstep(2.6, 3.0, ph))
    const aDet = env * win(rt.s, -8.95, -10.25, 0.25)
    flashAnchor.current.position.copy(det.p)
    // its tag reads to the left when the dot sits in the right part of the frame (never clipped)
    det.right = (0.5 + (det.p.x * sc * rt.px) / rt.W + rt.shiftX) > 0.6
    if (flash.current) {
      flash.current.visible = aDet > 0.002
      flash.current.position.copy(det.p).multiplyScalar(sc)
      flash.current.material.uniforms.uIntensity.value = 1.25 * aDet
    }
  })

  const flashTag = (right: boolean) => (flash.current?.visible && det.right === right ? flash.current.material.uniforms.uIntensity.value / 1.25 : 0) * (1 - rt.labW)

  return (
    <>
      <group ref={layer}>
        <group ref={tilt}>
          <group ref={spin}>
            {/* y-mirror: the template is written in a left-handed frame; B-DNA is right-handed */}
            <group scale={[1, -1, 1]}>
              <group ref={hx}>
                <primitive object={helixPts} />
                <lineSegments geometry={helix.rungs} material={rungMat} frustumCulled={false} />
              </group>
              <group ref={at}>
                <primitive object={glowPts} />
                <primitive object={atomPts} />
              </group>
            </group>
          </group>
          <group ref={dim}>
            <lineSegments geometry={dimGeo} material={dimMat} frustumCulled={false} />
            <SceneLabel position={[33.5, 0, -R_TARGET]} tone="field" opacity={() => win(rt.s, -7.6, -8.45, 0.25) * (1 - rt.labW)}>
              <span className="sd-unit">2 nm</span>
            </SceneLabel>
          </group>
        </group>
        <group ref={cb}>
          <primitive object={carbonPts} />
          <SceneLabel position={[-0.5, 0.55, 0]} align="right" tone="ink" size="md" opacity={() => win(rt.s, -8.45, -9.35, 0.2) * (1 - rt.labW)}>
            <span className="sd-sym sd-sym--q">C</span>
          </SceneLabel>
          <SceneLabel position={[0, 0, 0]} align="left" tone="field" opacity={() => win(rt.s, -9.35, -10.4, 0.2) * (1 - rt.labW)}>
            <span className="sd-note sd-note--nucleus">
              Nucleus here
              <br />
              <em>far smaller than one pixel at this zoom</em>
            </span>
          </SceneLabel>
        </group>
        <group ref={flashAnchor}>
          <SceneLabel position={[0, 0, 0]} align="left" tone="ink" opacity={() => flashTag(false)}>
            <span className="sd-note">e⁻ detected here</span>
          </SceneLabel>
          <SceneLabel position={[0, 0, 0]} align="right" tone="ink" opacity={() => flashTag(true)}>
            <span className="sd-note">e⁻ detected here</span>
          </SceneLabel>
        </group>
      </group>
      <GlowPoint ref={flash} size={0.2} minPixels={2} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
    </>
  )
}
