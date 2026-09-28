import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { HandoffOpenString, HandoffPoint, SceneLabel, useChapterFrame, COLORS } from '@/gl'
import { HANDOFF, handoffFit } from '@/core/handoff'
import { lerp, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { Status } from '@/ui'
import { F1, START, deltaOf, warmthOf, zAt } from '../model'
import { rt, win } from '../runtime'

/*
 * Lab Model 5–7: ONE renderer for both modes. The object is a polyline of physical length ℓ
 * (ℓ = 0 in Point mode, ℓ = ℓs in String mode), drawn with a resolution glow: a distance-to-polyline
 * light profile. With ℓ = 0 the distance is just the distance to the centre, so a point is simply a
 * string of zero length — and its glow is pixel-identical to H0. While ℓ ≪ δ = L/50 the two modes
 * cannot be told apart; once ℓ passes δ the glow stretches, and warmth r = smoothstep(1, 3, ℓ/δ)
 * (warm light = resolved) blends it into the Thread's filament light (H1's profile exactly).
 * Shape (Model 6): x = (σ−½)ℓ, y = ℓ Σ Aₙ cos(nπσ) cos(2π n f₁ t + φₙ), A = [.07, .025, .012, .006],
 * z-wiggle 90° out of phase; then it eases into the registry's H1 motion and hands over to it.
 */

const NP = 49 // polyline points
const A = [0.07, 0.025, 0.012, 0.006]
const PHI = [0.4, 2.1, 4.0, 5.3]
const CAM = HANDOFF.camera.position[2]

const vert = /* glsl */ `
  uniform vec2 uHalf;   // quad half-size, CSS px
  varying vec2 vP;
  void main() {
    vP = position.xy * 2.0 * uHalf;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  uniform vec2 uPts[${NP}];
  uniform float uGate;     // resolvability gate for the hot core (0: point-like core, 1: follows the string)
  uniform float uR;        // glow radius, px
  uniform float uCoreR;    // gaussian core radius, fraction of uR
  uniform float uFlat;     // 0 gaussian core (H0) → 1 flat filament core (H1)
  uniform float uFlatW;    // filament core half-width, px
  uniform float uAA;       // px
  uniform float uHaloK;
  uniform float uHaloW;
  uniform vec3 uCoreCol;
  uniform vec3 uHaloCol;
  uniform float uInt;
  uniform float uBead;
  uniform float uBeadR;
  uniform float uNorm;     // keeps the peak at I0 while the core is widened to the resolution blur
  uniform vec3 uAx;        // (string length px, blur sigma px, weight): axial profile of a true blur
  varying vec2 vP;
  // erf, to ~1e-2 (plenty for light)
  float erfa(float x) { return tanh(1.2025 * x); }
  float seg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a; vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return length(pa - ba * h);
  }
  vec3 glowPoint(float r) {
    if (r >= 1.0) return vec3(0.0);
    float core = exp(-pow(r / 0.18, 2.0) * 2.2);
    float halo = exp(-r * r * 4.5) * (1.0 - r);
    return uCoreCol * core + uHaloCol * halo * 0.8;
  }
  void main() {
    float d = 1e9;
    float dc = 1e9;
    float uc = 0.5;
    for (int i = 0; i < ${NP - 1}; i++) {
      vec2 a = uPts[i];
      vec2 b = uPts[i + 1];
      d = min(d, seg(vP, a, b));
      vec2 ga = a * uGate;
      vec2 pa = vP - ga;
      vec2 ba = b * uGate - ga;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
      float dd = length(pa - ba * h);
      if (dd < dc) { dc = dd; uc = (float(i) + h) / ${(NP - 1).toFixed(1)}; }
    }
    float rc = dc / uR;
    float gcore = exp(-pow(rc / uCoreR, 2.0) * 2.2);
    // a segment convolved with the blur is brightest mid-length and dims toward its ends (an ellipse,
    // not a pill): ½[erf(ℓ(1−u)/√2σ) + erf(ℓu/√2σ)], normalised to 1 at the centre
    if (uAx.z > 0.0) {
      float k = uAx.x / (1.41421 * uAx.y);
      float ax = 0.5 * (erfa(k * (1.0 - uc)) + erfa(k * uc)) / max(erfa(0.5 * k), 1e-4);
      gcore *= mix(1.0, ax, uAx.z);
    }
    float fcore = 1.0 - smoothstep(uFlatW - uAA, uFlatW + uAA, dc);
    float core = mix(gcore, fcore, uFlat);
    float rh = d / uR;
    float halo = rh < 1.0 ? exp(-rh * rh * uHaloK) * (1.0 - rh) : 0.0;
    vec3 col = uCoreCol * core + uHaloCol * halo * uHaloW;
    col *= uInt * uNorm;
    if (uBead > 0.0) {
      col += uBead * glowPoint(length(vP - uPts[0]) / uBeadR);
      col += uBead * glowPoint(length(vP - uPts[${NP - 1}]) / uBeadR);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`

const INK = new THREE.Color(COLORS.ink)
const FIL = new THREE.Color(COLORS.filament)
const WHITE = new THREE.Color('#FFFFFF')
const FILCORE = new THREE.Color(COLORS.filamentCore)

export function Point() {
  const dpr = useThree((s) => s.viewport.dpr)
  const size = useThree((s) => s.size)
  const pts = useMemo(() => new Float32Array(NP * 2), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uPts: { value: pts },
          uHalf: { value: new THREE.Vector2(40, 40) },
          uGate: { value: 0 },
          uR: { value: 24 },
          uCoreR: { value: 0.18 },
          uFlat: { value: 0 },
          uFlatW: { value: 1.2 },
          uAA: { value: 0.7 },
          uHaloK: { value: 4.5 },
          uHaloW: { value: 0.8 },
          uCoreCol: { value: new THREE.Color('#FFFFFF') },
          uHaloCol: { value: new THREE.Color(COLORS.ink) },
          uInt: { value: 1.2 },
          uBead: { value: 0 },
          uBeadR: { value: 11 },
          uNorm: { value: 1 },
          uAx: { value: new THREE.Vector3() },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [pts],
  )
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  useLayoutEffect(
    () => () => {
      material.dispose()
      geometry.dispose()
    },
    [material, geometry],
  )
  const mesh = useRef<THREE.Mesh>(null!)
  const h0 = useRef<THREE.Group>(null!)
  const h1 = useRef<THREE.Group>(null!)
  const chips = useRef<THREE.Group>(null!)
  const tag = useRef<THREE.Group>(null!)
  const cache = useMemo(() => ({ h0m: null as THREE.ShaderMaterial | null, h1m: [] as THREE.ShaderMaterial[], found: false, chipsA: 0, tagA: 0, snapA: 0, mob: false }), [])

  useChapterFrame((f) => {
    const aspect = size.width / Math.max(1, size.height)
    const fit = handoffFit(aspect)
    if (!cache.found) {
      h0.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
        if (m?.uniforms?.uIntensity && !cache.h0m) cache.h0m = m
      })
      h1.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
        if (m?.uniforms?.uOpacity) cache.h1m.push(m)
      })
      cache.found = true
    }

    // ── H0 at the very start: the prologue's point, dimming into the reticle
    const a0 = 1 - smoothstep(0.55, 1.15, rt.z)
    h0.current.visible = a0 > 0.001
    if (cache.h0m) cache.h0m.uniforms.uIntensity.value = HANDOFF.H0.intensity * a0

    // ── H1 at the very end: the registry's open string, exactly
    const h1Mix = smoothstep(zAt('bridge', -0.02), zAt('bridge', 0.3), rt.z)
    h1.current.visible = h1Mix > 0.001
    for (const m of cache.h1m) m.uniforms.uOpacity.value = h1Mix

    // ── the capsule: the u quark from Beat 3 on (the lab can bring it back anywhere below −13.9)
    const inner = smoothstep(-13.95, -14.4, rt.s)
    const op = inner * (1 - h1Mix)
    const m = mesh.current
    m.visible = op > 0.001
    if (!m.visible) {
      chips.current.visible = false
      return
    }
    chips.current.visible = true
    const fmk = 1e-15 * rt.k
    const P = rt.P
    const Q = rt.Q
    const qx = ((1 - rt.k1) * P.x + (1 - rt.k2) * Q.x) * fmk
    const qy = ((1 - rt.k1) * P.y + (1 - rt.k2) * Q.y) * fmk
    const qz = ((1 - rt.k1) * P.z + (1 - rt.k2) * Q.z) * fmk
    const persp = CAM / Math.max(0.5, CAM - qz)
    const pxW = rt.px * persp // css px per world unit at the quark's depth

    const ell = rt.ell
    const ratio = ell / deltaOf(rt.s)
    const q = warmthOf(ratio)
    const gate = smoothstep(0.3, 1.2, ratio)
    // the transverse wiggle shows only once its peak-to-peak (≈ 0.14 ℓ, mode 1) exceeds the blur δ
    // (Beat 6 step 4, s ≈ −33.2); before that the resolved glow is a plain soft ellipse
    const wig = smoothstep(0.8, 1.5, 0.14 * ratio)
    const ellW = ell * rt.k // world units
    // shape: the reveal's free-end modes, easing into the registry's H1 motion
    const settle = smoothstep(zAt('reveal', 0.72), zAt('reveal', 0.97), rt.z) * (1 - rt.labW)
    const t = f.t * ambient()
    const w = HANDOFF.H1.omega
    const h1a = HANDOFF.H1.amplitude / HANDOFF.H1.length
    let minX = 0
    let maxX = 0
    let minY = 0
    let maxY = 0
    for (let i = 0; i < NP; i++) {
      const sg = i / (NP - 1)
      let yr = 0
      let zr = 0
      for (let n = 1; n <= 4; n++) {
        const c = Math.cos(n * Math.PI * sg)
        const ph = 2 * Math.PI * n * F1 * t + PHI[n - 1]
        yr += A[n - 1] * c * Math.cos(ph)
        zr += A[n - 1] * c * Math.sin(ph)
      }
      const c1 = Math.cos(Math.PI * sg)
      const c2 = Math.cos(2 * Math.PI * sg)
      const yh = h1a * (0.8 * c1 * Math.cos(w * f.t) + 0.45 * c2 * Math.cos(2 * w * f.t + 0.6))
      const zh = h1a * 0.35 * c1 * Math.sin(w * f.t)
      const xw = (sg - 0.5) * ellW
      const yw = lerp(yr, yh, settle) * ellW * wig
      const zw = lerp(zr, zh, settle) * ellW * wig
      const pz = CAM / Math.max(0.5, CAM - qz - zw) / persp
      const X = xw * pz * pxW
      const Y = yw * pz * pxW
      pts[i * 2] = X
      pts[i * 2 + 1] = Y
      if (X < minX) minX = X
      if (X > maxX) maxX = X
      if (Y < minY) minY = Y
      if (Y > maxY) maxY = Y
    }
    // profile: H0's glow at q = 0 → the Filament's (H1) at q = 1
    const R0 = 0.5 * HANDOFF.H0.size * pxW
    const R1 = 0.5 * HANDOFF.H1.width * pxW
    const R = Math.exp(lerp(Math.log(R0), Math.log(R1), q))
    const beadR = 0.5 * HANDOFF.H1.width * 1.9 * pxW
    // core: H0's hot core (σ₀) while point-like; as it starts to follow the string it widens to the
    // instrument's blur, σ = 0.0085·H (FWHM = δ = L/50, Model 5), so the first resolved frames read as
    // a soft white ellipse, never a hard pill; warmth then sharpens it into the Thread's filament.
    // exp(−2.2 (d / (uCoreR·R))²) is a Gaussian of σ = uCoreR·R / 2.098.
    const sig0 = (0.18 * R0) / 2.098
    const sigB = 0.0085 * rt.H * persp
    const sig = lerp(sig0, Math.max(sig0, sigB), gate)
    // the quad must hold the whole glow (a clipped Gaussian would draw its rectangle)
    const margin = Math.max(R, beadR * q, q < 0.995 ? 3.4 * sig : 0) + 3
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const hx = (maxX - minX) / 2 + margin
    const hy = (maxY - minY) / 2 + margin
    // re-centre the polyline on the quad
    for (let i = 0; i < NP; i++) {
      pts[i * 2] -= cx
      pts[i * 2 + 1] -= cy
    }
    const u = material.uniforms
    u.uHalf.value.set(hx, hy)
    u.uGate.value = gate
    u.uR.value = R
    u.uCoreR.value = (2.098 * sig) / R
    u.uAx.value.set(ellW * pxW * gate, sig, gate * (1 - q))
    const I = lerp(HANDOFF.H0.intensity, 1, q)
    const hw = lerp(0.8, 0.62, q)
    u.uNorm.value = lerp(1, 1 / (I * (1 + hw)), gate * (1 - q * q))
    u.uFlat.value = q
    u.uFlatW.value = 0.2 * R1
    u.uAA.value = 0.7 / dpr
    u.uHaloK.value = lerp(4.5, 5.5, q)
    u.uHaloW.value = hw
    u.uCoreCol.value.copy(WHITE).lerp(FILCORE, q)
    u.uHaloCol.value.copy(INK).lerp(FIL, q) // Model 7: mix(Ink, Filament, r)
    // Beat 3: the valence quarks sit a little below H0 so the fog around them can read; by the
    // snapshot (s = −14.6) the point is exactly H0 again, and stays so for the rest of the zoom
    const dimQ = lerp(0.75, 1, smoothstep(-14.3, -14.6, rt.s))
    u.uInt.value = I * op * (rt.labW > 0.5 ? 1 : dimQ)
    u.uBead.value = q * op
    u.uBeadR.value = beadR
    m.position.set(qx + cx / pxW, qy + cy / pxW, qz)
    m.scale.set((2 * hx) / pxW, (2 * hy) / pxW, 1)

    // chips pinned to the resolved string (below its right end), the quark's size tag, the snapshot note
    const resolved = smoothstep(2.5, 6, ratio) * (1 - h1Mix)
    cache.chipsA = resolved * (rt.z < START.lab ? 1 : rt.labW)
    // desktop story: under the string's right half; phones and the lab (panel on the right): centred
    chips.current.position.set(qx + (rt.mobile || rt.labW > 0.5 ? 0 : 0.28 * ellW), qy - 34 / pxW - (maxY - minY) / 2 / pxW, 0)
    cache.tagA = win(rt.s, -16.4, -21.5, 0.4) * (1 - rt.labW)
    cache.mob = rt.mobile
    cache.snapA = win(rt.s, -14.62, -15.25, 0.12) * (1 - rt.labW)
    tag.current.position.set(qx, qy, qz)
  })

  return (
    <>
      <group ref={h0}>
        <HandoffPoint />
      </group>
      <group ref={h1} visible={false}>
        <HandoffOpenString />
      </group>
      <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={5} visible={false} />
      <group ref={chips}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={() => cache.chipsA}>
          <span className="sd-chips">
            <span className="sd-chips__row">
              <Status kind="speculative" compact />
              <Status kind="analogy" compact />
            </span>
            <span className="sd-chips__txt">thickness, glow and speed not to scale</span>
          </span>
        </SceneLabel>
      </group>
      <group ref={tag}>
        <SceneLabel position={[0, 0, 0]} align="left" tone="ink" opacity={() => (cache.mob ? 0 : cache.tagA)}>
          <span className="sd-note sd-note--offset">Quark · no size found · &lt; 4.3 × 10⁻¹⁹ m</span>
        </SceneLabel>
        {/* phones: under the point, two lines, clear of the reticle */}
        <SceneLabel position={[0, 0, 0]} align="below" tone="ink" opacity={() => (cache.mob ? cache.tagA : 0)}>
          <span className="sd-note sd-note--center sd-note--under">
            Quark · no size found
            <br />
            &lt; 4.3 × 10⁻¹⁹ m
          </span>
        </SceneLabel>
        <SceneLabel position={[0, 0, 0]} align="left" tone="dim" opacity={() => cache.snapA}>
          <span className="sd-note sd-note--offset sd-note--wrap">
            <Status kind="analogy" compact /> A high-energy collision catches a quark at one place, like a snapshot.
          </span>
        </SceneLabel>
      </group>
    </>
  )
}
