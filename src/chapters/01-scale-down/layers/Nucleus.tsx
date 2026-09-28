import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoint, SceneLabel, useChapterFrame, COLORS, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { rng, smoothstep } from '@/core/math'
import { particleScale } from '@/core/settings'
import { Status } from '@/ui'
import { FLICKER, HASH, MASK, NEAR_FADE, POINT_FRAG, POINT_FRAG_MASKED, maskUniforms, updateMask } from '../glsl'
import { rt, win } from '../runtime'

/*
 * Beat 3 (Lab Model 4). Carbon-12: 12 soft nucleon blobs, each a flicker haze with the exponential
 * charge profile ρ ∝ e^(−r/a), a = r_p/√12 = 0.243 fm (sampled as Gamma(3, a)), centres at rms radius
 * √(2.470² − 0.841²) ≈ 2.32 fm, jiggling with Ornstein–Uhlenbeck noise (σ = 0.15 fm, τ = 1.5 s).
 * Then one proton from inside: a turbulent Field-blue gluon fog (never tubes, never warm), three
 * valence quarks as PSF-size Ink points on OU walks (σ = 0.35 fm, τ = 0.5 s), and sea pairs
 * (~8 per second) that split by up to 0.3 fm and re-merge within 0.4 s. Units: fm.
 */

const A_EXP = 0.243
const FM = 1e-15

const nucVert = /* glsl */ `
  ${HASH}
  ${FLICKER}
  ${NEAR_FADE}
  attribute vec4 aRand;
  attribute float aBlob;
  attribute vec3 aColor;
  uniform vec3 uCenters[12];
  uniform float uBlobA[12];
  uniform float uAlpha;
  uniform float uPx;
  uniform float uA;
  varying vec3 vCol;
  varying float vA;
  void main() {
    flicker(aRand);
    vec4 h = hash44(vec4(aRand.x, gCycle, 4.1, 2.2));
    vec4 h2 = hash44(vec4(aRand.x, gCycle, 9.3, 6.6));
    float r = -uA * (lnu(h.x) + lnu(h.y) + lnu(h.z));
    int bi = int(aBlob + 0.5);
    vec3 p = uCenters[bi] + isoDir(h.w, h2.x) * r;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = uAlpha * uBlobA[bi] * envelope() * nearFade(mv);
    vCol = aColor;
    gl_PointSize = uPx * (1.2 + 1.0 * h2.y);
  }
`

const fogVert = /* glsl */ `
  ${HASH}
  ${FLICKER}
  ${NEAR_FADE}
  attribute vec4 aRand;
  uniform float uAlpha;
  uniform float uPx;
  uniform float uA;
  uniform vec3 uColor;
  uniform vec2 uRes;
  varying vec3 vCol;
  varying float vA;
  varying vec2 vDir;
  varying float vStreak;
  // Arnold–Beltrami–Childress flow: divergence-free and chaotic; drifting phases keep it churning
  vec3 abc(vec3 p, float t) {
    vec3 ph = vec3(0.31, 0.43, 0.23) * t;
    const float A = 1.0; const float B = 0.8; const float C = 0.6;
    return vec3(A * sin(p.z + ph.x) + C * cos(p.y + ph.y), B * sin(p.x + ph.z) + A * cos(p.z + ph.x), C * sin(p.y + ph.y) + B * cos(p.x + ph.z));
  }
  void main() {
    flicker(aRand);
    vec4 h = hash44(vec4(aRand.x, gCycle, 1.1, 3.3));
    vec4 h2 = hash44(vec4(aRand.x, gCycle, 7.7, 4.4));
    // respawn from the exponential radial profile, then advect through a divergence-free flow
    float r = -uA * (lnu(h.x) + lnu(h.y) + lnu(h.z));
    vec3 p = isoDir(h.w, h2.x) * r;
    float tau = mix(uTauMin, uTauMax, aRand.y);
    float age = gAge * tau;
    float t0 = (gCycle - aRand.z) * tau;
    vec3 v = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      float tt = t0 + age * (float(i) + 0.5) / 4.0;
      v = abc(p * 3.6 + h2.yzw * 6.0, tt);
      p += v * (age / 4.0) * 0.22;
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // ~30% of the fog is drawn as short streaks along the local flow, so the churn reads in a still
    vStreak = step(aRand.w, 0.3);
    // streaks follow one shared, slowly turning field, so neighbours align into visible swirls
    vec3 vf = abc(p * 2.6, uTime * 0.5);
    vec4 c2 = projectionMatrix * modelViewMatrix * vec4(p + vf * 0.02, 1.0);
    vec2 d = (c2.xy / c2.w - gl_Position.xy / gl_Position.w) * uRes;
    vDir = length(d) > 1e-6 ? normalize(d) : vec2(1.0, 0.0);
    // puffs: large and faint, so together they read as a continuous volume; streaks: crisp dashes
    float sz = mix(5.0 + 7.0 * h2.x, 8.0 + 6.0 * h2.x, vStreak);
    vA = uAlpha * envelope() * nearFade(mv) * mix(0.62, 0.95, vStreak);
    vCol = uColor;
    gl_PointSize = uPx * sz;
  }
`

/** Fog sprite: a very soft round puff, or (streak points) a short soft dash along vDir. */
const FOG_FRAG = /* glsl */ `
  ${MASK}
  varying vec3 vCol;
  varying float vA;
  varying vec2 vDir;
  varying float vStreak;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    c.y = -c.y;
    float a;
    if (vStreak > 0.5) {
      float along = dot(c, vDir);
      float across = dot(c, vec2(-vDir.y, vDir.x));
      a = exp(-across * across * 34.0) * (1.0 - smoothstep(0.2, 0.9, abs(along)));
    } else {
      float r2 = dot(c, c);
      if (r2 > 1.0) discard;
      a = exp(-r2 * 2.4) * (1.0 - r2);
    }
    gl_FragColor = vec4(vCol * a * vA * textMask(), 1.0);
  }
`

const seaVert = /* glsl */ `
  ${NEAR_FADE}
  attribute float aA;
  uniform float uAlpha;
  uniform float uPx;
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = uAlpha * aA * nearFade(mv);
    vCol = vec3(0.93, 0.9, 0.85);
    gl_PointSize = uPx * 4.2;
  }
`

const mat = (vertexShader: string, uniforms: Record<string, THREE.IUniform>, masked = false) =>
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: masked ? POINT_FRAG_MASKED : POINT_FRAG,
    uniforms: { uAlpha: { value: 0 }, uPx: { value: 1 }, ...maskUniforms(), ...uniforms },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })

/** Exact OU update per axis: x ← μ + (x−μ)e^(−dt/τ) + σ√(1−e^(−2dt/τ))·N(0,1). */
function ou(v: THREE.Vector3, mean: THREE.Vector3, sigma: number, tau: number, dt: number, gauss: () => number) {
  if (dt <= 0) return
  const e = Math.exp(-dt / tau)
  const s = sigma * Math.sqrt(1 - e * e)
  v.x = mean.x + (v.x - mean.x) * e + s * gauss()
  v.y = mean.y + (v.y - mean.y) * e + s * gauss()
  v.z = mean.z + (v.z - mean.z) * e + s * gauss()
}

/** Allocation-free seeded PRNG (mulberry32) for the per-frame sea-pair hashing. */
const seed = { v: 1 }
function seedRand() {
  seed.v = (seed.v + 0x6d2b79f5) >>> 0
  let t = seed.v
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const SEA_SLOTS = 6
const SEA_PERIOD = SEA_SLOTS / 8 // ~8 pairs per second
const SEA_LIFE = 0.4

export function Nucleus() {
  const dpr = useThree((s) => s.viewport.dpr)
  const ps = particleScale()

  // ── the C-12 cluster (seeded)
  const cluster = useMemo(() => {
    const r = rng(2026)
    const gauss = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(2 * Math.PI * r())
    const c: THREE.Vector3[] = []
    let guard = 0
    while (c.length < 12 && guard++ < 5000) {
      const p = new THREE.Vector3(gauss(), gauss(), gauss()).multiplyScalar(1.34)
      if (c.every((q) => q.distanceTo(p) > 1.3)) c.push(p)
    }
    // recentre and rescale to rms radius 2.32 fm
    const mean = c.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(c.length)
    c.forEach((p) => p.sub(mean))
    const rms = Math.sqrt(c.reduce((a, p) => a + p.lengthSq(), 0) / c.length)
    c.forEach((p) => p.multiplyScalar(2.32 / rms))
    // the target proton: the front-most, fairly central blob
    let ti = 0
    let best = -1e9
    c.forEach((p, i) => {
      const sc = p.z - 0.35 * Math.hypot(p.x, p.y)
      if (sc > best) {
        best = sc
        ti = i
      }
    })
    const proton = c.map(() => false)
    proton[ti] = true
    const order = c.map((_, i) => i).filter((i) => i !== ti)
    for (let k = 0; k < 5; k++) proton[order[(k * 2 + 1) % order.length]] = true
    let np = proton.filter(Boolean).length
    for (let i = 0; np < 6 && i < 12; i++) if (!proton[i]) (proton[i] = true), np++
    return { centres: c, proton, target: ti }
  }, [])

  const nucGeo = useMemo(() => {
    const per = Math.round(2600 * ps)
    const n = per * 12
    const pos = new Float32Array(n * 3)
    const rnd = new Float32Array(n * 4)
    const blob = new Float32Array(n)
    const col = new Float32Array(n * 3)
    const r = rng(31)
    const pc = new THREE.Color('#C9D2DF')
    const nc = new THREE.Color('#6A7080')
    for (let i = 0; i < n; i++) {
      const b = Math.floor(i / per)
      blob[i] = b
      rnd.set([r() * 1000, r(), r(), r()], i * 4)
      const c = cluster.proton[b] ? pc : nc
      col.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
    g.setAttribute('aBlob', new THREE.BufferAttribute(blob, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    return g
  }, [ps, cluster])

  const fogGeo = useMemo(() => {
    const n = Math.round(24000 * ps)
    const pos = new Float32Array(n * 3)
    const rnd = new Float32Array(n * 4)
    const r = rng(47)
    for (let i = 0; i < n; i++) rnd.set([r() * 1000, r(), r(), r()], i * 4)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4))
    return g
  }, [ps])

  const seaGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEA_SLOTS * 2 * 3), 3))
    g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(SEA_SLOTS * 2), 1))
    return g
  }, [])
  // a 1 px Field-blue hairline joins each pair while its partners are apart (same buffers)
  const seaLineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          attribute float aA;
          varying float vA;
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vA = aA;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uAlpha;
          varying float vA;
          void main() { gl_FragColor = vec4(uColor * vA * uAlpha, 1.0); }
        `,
        uniforms: { uColor: { value: new THREE.Color(COLORS.field) }, uAlpha: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const centresU = useMemo(() => new Float32Array(36), [])
  const blobA = useMemo(() => new Float32Array(12).fill(1), [])
  const nucMat = useMemo(
    () => mat(nucVert, { uTime: { value: 0 }, uTauMin: { value: 0.4 }, uTauMax: { value: 1.2 }, uCenters: { value: centresU }, uBlobA: { value: blobA }, uA: { value: A_EXP } }, true),
    [centresU, blobA],
  )
  const fogMat = useMemo(() => {
    const m = mat(fogVert, { uTime: { value: 0 }, uTauMin: { value: 1.0 }, uTauMax: { value: 2.2 }, uA: { value: A_EXP }, uColor: { value: new THREE.Color(COLORS.field) } }, true)
    m.fragmentShader = FOG_FRAG
    return m
  }, [])
  const seaMat = useMemo(() => mat(seaVert, {}), [])
  useLayoutEffect(
    () => () => {
      nucGeo.dispose()
      fogGeo.dispose()
      seaGeo.dispose()
      nucMat.dispose()
      fogMat.dispose()
      seaMat.dispose()
      seaLineMat.dispose()
    },
    [nucGeo, fogGeo, seaGeo, nucMat, fogMat, seaMat, seaLineMat],
  )
  const mk = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const p = new THREE.Points(g, m)
    p.frustumCulled = false
    return p
  }
  const nucPts = useMemo(() => mk(nucGeo, nucMat), [nucGeo, nucMat])
  const fogPts = useMemo(() => mk(fogGeo, fogMat), [fogGeo, fogMat])
  const seaPts = useMemo(() => mk(seaGeo, seaMat), [seaGeo, seaMat])
  const seaLines = useMemo(() => {
    const l = new THREE.LineSegments(seaGeo, seaLineMat)
    l.frustumCulled = false
    return l
  }, [seaGeo, seaLineMat])

  // ── dynamic state (OU walks), preallocated
  const st = useMemo(() => {
    const r = rng(99)
    const gauss = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(2 * Math.PI * r())
    const jig = cluster.centres.map(() => new THREE.Vector3(gauss(), gauss(), gauss()).multiplyScalar(0.15))
    const qMean = [new THREE.Vector3(0.12, 0.08, 0.32), new THREE.Vector3(-0.38, 0.22, -0.12), new THREE.Vector3(0.28, -0.36, -0.18)]
    const qRaw = qMean.map((m) => m.clone().add(new THREE.Vector3(gauss(), gauss(), gauss()).multiplyScalar(0.2)))
    const qShow = qRaw.map((q) => q.clone())
    return { gauss, jig, zero: new THREE.Vector3(), qMean, qRaw, qShow, tmp: new THREE.Vector3(), tagPair: new THREE.Vector3(), tagA: 0, tagVis: new Float32Array(12) }
  }, [cluster])

  // anchors are updated before any layer is placed (priority −1.8, after the Scene's −2)
  useChapterFrame(
    (f) => {
      const dt = f.dt * (1 - rt.freeze)
      for (const j of st.jig) ou(j, st.zero, 0.15, 1.5, dt, st.gauss)
      for (let q = 0; q < 3; q++) {
        ou(st.qRaw[q], st.qMean[q], 0.35, 0.5, dt, st.gauss)
        // display with a short critically damped lag so the points read as seething, not jittering
        const k = dt > 0 ? 1 - Math.exp(-dt / 0.12) : 0
        st.qShow[q].lerp(st.qRaw[q], k)
      }
      rt.P.copy(cluster.centres[cluster.target]).add(st.jig[cluster.target])
      rt.Q.copy(st.qShow[0])
    },
    { priority: -1.8 },
  )

  const nucG = useRef<THREE.Group>(null!)
  const proG = useRef<THREE.Group>(null!)
  const q2 = useRef<GlowPointApi>(null)
  const q3 = useRef<GlowPointApi>(null)
  const tagGroups = useRef<(THREE.Group | null)[]>([])
  const quarkTags = useRef<(THREE.Group | null)[]>([])
  const seaTag = useRef<THREE.Group>(null!)
  const blobTag = useRef<THREE.Group>(null!)

  useChapterFrame((f) => {
    // the "blobs" note sits at a fixed spot on screen, lower right of the cluster
    {
      // desktop: the text column's lower left, off the haze; phones: under the tape (the beat fills the bottom)
      const X = rt.mobile ? 0.04 * rt.W - 10 : 0.094 * rt.W - 10
      const Y = rt.mobile ? 0.215 * rt.H : 0.85 * rt.H
      blobTag.current.position.set((X - rt.W / 2 - rt.shiftX * rt.W) / rt.px, (rt.H / 2 - Y - rt.shiftY * rt.H) / rt.px, 0)
    }
    // the neighbours are gone by s = −14.45, so the proton's own fog reads alone
    const aNuc = smoothstep(-12.9, -13.4, rt.s) * smoothstep(-14.45, -14.15, rt.s)
    const inner = smoothstep(-13.95, -14.4, rt.s)
    const aPro = win(rt.s, -13.9, -16.4, 0.6)
    nucG.current.visible = aNuc > 0.002
    proG.current.visible = aPro > 0.002
    const fmk = FM * rt.k
    // nucleus frame: origin offset = −F, F = k1·P + k2·Q
    const P = rt.P
    const Q = rt.Q
    const k1 = rt.k1
    const k2 = rt.k2
    if (aNuc > 0.002) {
      nucG.current.scale.setScalar(fmk)
      nucG.current.position.set(-(k1 * P.x + k2 * Q.x) * fmk, -(k1 * P.y + k2 * Q.y) * fmk, -(k1 * P.z + k2 * Q.z) * fmk)
      for (let i = 0; i < 12; i++) {
        const c = cluster.centres[i]
        const j = st.jig[i]
        centresU[i * 3] = c.x + j.x
        centresU[i * 3 + 1] = c.y + j.y
        centresU[i * 3 + 2] = c.z + j.z
        blobA[i] = i === cluster.target ? 1 - inner : 1
        tagGroups.current[i]?.position.set(c.x + j.x + 0.62, c.y + j.y + 0.62, c.z + j.z)
        // p / n tags stay clear of the tape and the header (top band) and of the frame's edges
        const wz = (c.z + j.z) * fmk + nucG.current.position.z
        const ps = 10 / Math.max(0.5, 10 - wz)
        const sy = 0.5 - (((c.y + j.y + 0.62) * fmk + nucG.current.position.y) * ps * rt.px) / rt.H - rt.shiftY
        const sx = 0.5 + (((c.x + j.x + 0.62) * fmk + nucG.current.position.x) * ps * rt.px) / rt.W + rt.shiftX
        st.tagVis[i] = smoothstep(0.17, 0.23, sy) * (1 - smoothstep(0.9, 0.95, sy)) * (1 - smoothstep(0.93, 0.97, sx))
      }
      nucMat.uniforms.uAlpha.value = aNuc * 0.95
      nucMat.uniforms.uTime.value = rt.ta
      nucMat.uniforms.uPx.value = dpr
      updateMask(nucMat.uniforms, dpr)
    }
    // proton frame: origin offset = P − F = (1−k1)P − k2·Q
    const ox = (1 - k1) * P.x - k2 * Q.x
    const oy = (1 - k1) * P.y - k2 * Q.y
    const oz = (1 - k1) * P.z - k2 * Q.z
    if (aPro > 0.002) {
      proG.current.scale.setScalar(fmk)
      proG.current.position.set(ox * fmk, oy * fmk, oz * fmk)
      const aIn = aPro * inner
      fogMat.uniforms.uAlpha.value = aIn * 0.2
      fogMat.uniforms.uTime.value = rt.tP
      fogMat.uniforms.uPx.value = dpr
      updateMask(fogMat.uniforms, dpr)
      // sea pairs: slots on a fixed rota; positions from a per-cycle hash (frozen with the snapshot)
      const pos = seaGeo.getAttribute('position') as THREE.BufferAttribute
      const aa = seaGeo.getAttribute('aA') as THREE.BufferAttribute
      const parr = pos.array as Float32Array
      const aarr = aa.array as Float32Array
      st.tagA = 0
      for (let i = 0; i < SEA_SLOTS; i++) {
        const tt = rt.tP - (i * SEA_PERIOD) / SEA_SLOTS
        const cyc = Math.floor(tt / SEA_PERIOD)
        const age = tt - cyc * SEA_PERIOD
        const on = age < SEA_LIFE
        seed.v = (7919 * (cyc + 1000) + i * 131) >>> 0
        const r = seedRand
        // pair centres: Gamma(2, a), a little tighter than the charge profile, so pairs bloom inside
        const rad = -A_EXP * (Math.log(Math.max(r(), 1e-6)) + Math.log(Math.max(r(), 1e-6)))
        const z = 2 * r() - 1
        const a = 2 * Math.PI * r()
        const s = Math.sqrt(1 - z * z)
        const cx = s * Math.cos(a) * rad
        const cy = s * Math.sin(a) * rad
        const cz = z * rad
        const dz = 2 * r() - 1
        const da = 2 * Math.PI * r()
        const ds = Math.sqrt(1 - dz * dz)
        const sep = on ? 0.15 * Math.sin((Math.PI * age) / SEA_LIFE) : 0
        const env = on ? Math.sin((Math.PI * age) / SEA_LIFE) : 0
        const ex = ds * Math.cos(da) * sep
        const ey = ds * Math.sin(da) * sep
        const ez = dz * sep
        parr[i * 6] = cx + ex
        parr[i * 6 + 1] = cy + ey
        parr[i * 6 + 2] = cz + ez
        parr[i * 6 + 3] = cx - ex
        parr[i * 6 + 4] = cy - ey
        parr[i * 6 + 5] = cz - ez
        aarr[i * 2] = aarr[i * 2 + 1] = 0.8 * env
        if ((cyc * SEA_SLOTS + i) % 5 === 0 && env > st.tagA) {
          st.tagA = env
          st.tagPair.set(cx, cy, cz)
        }
      }
      pos.needsUpdate = true
      aa.needsUpdate = true
      seaMat.uniforms.uAlpha.value = aIn
      seaMat.uniforms.uPx.value = dpr
      // the partner hairlines leave with the snapshot: magnified by the zoom they would cross the frame
      seaLineMat.uniforms.uAlpha.value = aIn * 0.4 * (1 - smoothstep(-14.62, -14.9, rt.s))
      seaTag.current.position.copy(st.tagPair)
      for (let q = 0; q < 3; q++) quarkTags.current[q]?.position.copy(st.qShow[q]).add(st.tmp.set(0.05, 0.06, 0))
    }
    // valence quarks u (2nd) and d: fixed-pixel PSF glows, placed in unscaled world space
    const aQ = aPro * inner * (1 - smoothstep(-15.25, -15.85, rt.s))
    for (let q = 1; q < 3; q++) {
      const g = q === 1 ? q2.current : q3.current
      if (!g) continue
      const v = st.qShow[q]
      const wx = (ox + v.x) * fmk
      const wy = (oy + v.y) * fmk
      const wz = (oz + v.z) * fmk
      g.position.set(wx, wy, wz)
      g.visible = aQ > 0.002 && wz < 6
      // Beat 3: a little below H0 so the fog can read around them; exactly H0 from the snapshot on
      const dimQ = rt.labW > 0.5 ? 1 : 0.75 + 0.25 * smoothstep(-14.3, -14.6, rt.s)
      g.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * aQ * dimQ * (1 - smoothstep(3, 6, wz))
    }
  })

  const tagOp = (lo: number, hi: number) => () => win(rt.s, hi, lo, 0.2) * (1 - rt.labW)
  const nucTag = tagOp(-14.35, -13.35)
  return (
    <>
      <group ref={nucG}>
        <primitive object={nucPts} />
        {cluster.centres.map((_, i) => (
          <group key={i} ref={(el) => void (tagGroups.current[i] = el)}>
            <SceneLabel position={[0, 0, 0]} tone={cluster.proton[i] ? 'ink' : 'dim'} align="center" opacity={() => nucTag() * st.tagVis[i]}>
              <span className="sd-sym">{cluster.proton[i] ? 'p' : 'n'}</span>
            </SceneLabel>
          </group>
        ))}

      </group>
      <group ref={proG}>
        <primitive object={fogPts} />
        <primitive object={seaLines} />
        <primitive object={seaPts} />
        {['u', 'u', 'd'].map((n, i) => (
          <group key={i} ref={(el) => void (quarkTags.current[i] = el)}>
            <SceneLabel position={[0, 0, 0]} tone="ink" align="left" opacity={tagOp(-15.0, -14.3)}>
              <span className="sd-sym sd-sym--q">{n}</span>
            </SceneLabel>
          </group>
        ))}
        <group ref={seaTag}>
          <SceneLabel position={[0, 0, 0]} tone="dim" align="left" opacity={() => st.tagA * win(rt.s, -14.25, -14.65, 0.12) * (1 - rt.labW)}>
            <span className="sd-sym">q q̄</span>
          </SceneLabel>
        </group>

      </group>
      <group ref={blobTag}>
        <SceneLabel position={[0, 0, 0]} align="left" tone="dim" opacity={tagOp(-14.35, -13.4)}>
          <span className="sd-note sd-note--wrap sd-note--plate">
            <Status kind="analogy" compact /> Blobs, not billiard balls: nucleons have fuzzy edges and never sit still.
          </span>
        </SceneLabel>
      </group>
      <GlowPoint ref={q2} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <GlowPoint ref={q3} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
    </>
  )
}
