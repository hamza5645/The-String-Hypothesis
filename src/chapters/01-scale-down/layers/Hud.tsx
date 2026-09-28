import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoint, SceneLabel, useChapterFrame, COLORS, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { smoothstep, superscript } from '@/core/math'
import { MASK, maskUniforms, updateMask } from '../glsl'
import { rt, win } from '../runtime'

/*
 * Screen-true diagram marks, drawn in one full-view quad at z = 0 (so they follow the view shift):
 * - Decade rings: circles of physical radius 10ᵏ m at (10ᵏ/L)·H px, visible while 0.03 H < R < 0.8 H.
 *   They fly outward as the zoom runs; past the measurement edge (k ≤ −19) they are dashed.
 * - The zoom reticle: four 6 px ticks around a 24 px gap (doubling once the point is centred).
 * - Beat 4: a ring around the snapshot quark; the electron inset (an identical glow, top right on
 *   desktop; upper left on phones, under the tape, where it cannot collide with the quark's tag).
 */

const vert = /* glsl */ `
  varying vec2 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xy;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const frag = /* glsl */ `
  ${MASK}
  uniform float uPxW;
  uniform float uDpr;
  uniform vec3 uRings[3];   // (radius px, alpha, dashed)
  uniform float uRet;
  uniform float uRetA;
  uniform vec3 uTgt;        // (x px, y px, alpha)
  uniform vec4 uInset;      // (x px, y px, radius px, alpha)
  uniform vec4 uTag;        // the quark's size tag, kept clear of rings: (x0, x1, y0, y1) px; alpha in uTagA
  uniform float uTagA;
  uniform vec3 uCol;
  varying vec2 vW;
  float hair(float d) { return 1.0 - smoothstep(0.0, (0.9 + 0.5 * uDpr) / uDpr, d); }
  void main() {
    vec2 p = vW * uPxW;       // CSS px from the focus
    float r = length(p);
    float ang = atan(p.y, p.x);
    float a = 0.0;
    for (int i = 0; i < 3; i++) {
      vec3 R = uRings[i];
      if (R.y <= 0.0) continue;
      float line = hair(abs(r - R.x));
      if (R.z > 0.5) {
        float n = max(8.0, floor(6.2831853 * R.x / 11.0));
        line *= step(0.42, fract(ang / 6.2831853 * n));
      }
      a += line * R.y;
    }
    a *= textMask();
    // the electron inset is a separate view: rings never cross it or its label
    if (uInset.w > 0.0) {
      vec2 d = p - uInset.xy;
      float win = 1.0 - smoothstep(uInset.z + 6.0, uInset.z + 16.0, length(d));
      float lab = (1.0 - smoothstep(96.0, 110.0, abs(d.x))) * step(-uInset.z - 58.0, d.y) * step(d.y, -uInset.z + 4.0);
      a *= 1.0 - uInset.w * max(win, lab);
    }
    // …nor through the quark's size tag
    if (uTagA > 0.0) {
      float inTag = step(uTag.x, p.x) * step(p.x, uTag.y) * step(uTag.z, p.y) * step(p.y, uTag.w);
      a *= 1.0 - uTagA * inTag;
    }
    // reticle ticks
    float g0 = 12.0 * uRet;
    float g1 = 18.0 * uRet;
    float tx = hair(abs(p.y)) * step(g0, abs(p.x)) * step(abs(p.x), g1);
    float ty = hair(abs(p.x)) * step(g0, abs(p.y)) * step(abs(p.y), g1);
    a += max(tx, ty) * uRetA;
    // snapshot target ring
    if (uTgt.z > 0.0) a += hair(abs(length(p - uTgt.xy) - 30.0)) * uTgt.z;
    // electron inset circle
    if (uInset.w > 0.0) a += hair(abs(length(p - uInset.xy) - uInset.z)) * uInset.w * 0.8;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(uCol * a, 1.0);
  }
`

export function Hud() {
  const dpr = useThree((s) => s.viewport.dpr)
  const rings = useMemo(() => new Float32Array(9), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uPxW: { value: 140 },
          uDpr: { value: 1 },
          uRings: { value: rings },
          uRet: { value: 1 },
          uRetA: { value: 0 },
          uTgt: { value: new THREE.Vector3() },
          uInset: { value: new THREE.Vector4() },
          uTag: { value: new THREE.Vector4() },
          uTagA: { value: 0 },
          uCol: { value: new THREE.Color(COLORS.field) },
          ...maskUniforms(),
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [rings],
  )
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const dipMat = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.void, transparent: true, opacity: 0, depthTest: false, depthWrite: false }), [])
  useLayoutEffect(
    () => () => {
      material.dispose()
      geometry.dispose()
      dipMat.dispose()
    },
    [material, geometry, dipMat],
  )
  const quad = useRef<THREE.Mesh>(null!)
  const dip = useRef<THREE.Mesh>(null!)
  const inset = useRef<GlowPointApi>(null)
  const insetTag = useRef<THREE.Group>(null!)
  const labelG = useRef<(THREE.Group | null)[]>([])
  const labelT = useRef<(HTMLSpanElement | null)[]>([])
  const st = useMemo(() => ({ la: [0, 0, 0], lk: [99, 99, 99], insetA: 0 }), [])

  useChapterFrame(() => {
    const W = rt.W
    const H = rt.H
    const pxW = rt.px
    quad.current.scale.set((W * 3) / pxW, (H * 3) / pxW, 1)
    const u = material.uniforms
    u.uPxW.value = pxW
    u.uDpr.value = dpr
    const s = rt.s
    const lab = rt.labW
    // electron inset (Beat 4): an identical point, for comparison
    const aIn = win(s, -16.85, -18.95, 0.3) * (1 - lab)
    const IX = rt.mobile ? 0.24 * W : 0.79 * W
    const IY = rt.mobile ? 0.25 * H : 0.27 * H
    const rIn = rt.mobile ? 34 : 50
    // decade rings: at most three candidates, k = ⌊s − 0.097⌋ downward
    const kTop = Math.floor(s - 0.097)
    for (let i = 0; i < 3; i++) {
      const k = kTop - i
      const R = Math.pow(10, k - s) * H
      const f = R / H
      let a = smoothstep(0.03, 0.07, f) * (1 - smoothstep(0.42, 0.66, f)) * rt.ringsA
      // the hush: no rings below 10⁻³² m in the story (the lab keeps them)
      if (k < -32) a *= lab
      a *= 1 - (1 - lab) * smoothstep(-31.55, -31.95, s)
      rings[i * 3] = R
      rings[i * 3 + 1] = a
      rings[i * 3 + 2] = k <= -19 ? 1 : 0
      // label at 52° on the ring
      const g = labelG.current[i]
      const c = 0.6157
      const sn = 0.788
      if (g) g.position.set((R * c) / pxW, (R * sn) / pxW, 0)
      const lx = (W / 2 + R * c + rt.shiftX * W) / W
      const ly = (H / 2 - R * sn - rt.shiftY * H) / H
      // never over the electron inset or its two-line tag
      const inInset = aIn > 0.01 && Math.abs(lx * W - IX) < rIn + 90 && ly * H > IY - rIn - 24 && ly * H < IY + rIn + 58
      const vis = lx > 0.08 && lx < 0.86 && ly > 0.17 && ly < 0.94 && !inInset
      const side = rt.mobile ? 1 - smoothstep(0.5, 0.62, ly) : smoothstep(0.36, 0.46, lx)
      st.la[i] = vis ? a * 0.95 * (1 - rt.maskK + rt.maskK * side) : 0
      const el = labelT.current[i]
      if (el && st.lk[i] !== k) {
        st.lk[i] = k
        el.textContent = `10${superscript(k)} m`
      }
    }
    updateMask(u, dpr)
    u.uRet.value = rt.ret
    u.uRetA.value = rt.retA
    // snapshot target ring around the u quark (before anchor shift 2 completes)
    const fmk = 1e-15 * rt.k
    const P = rt.P
    const Q = rt.Q
    const qx = ((1 - rt.k1) * P.x + (1 - rt.k2) * Q.x) * fmk * pxW
    const qy = ((1 - rt.k1) * P.y + (1 - rt.k2) * Q.y) * fmk * pxW
    u.uTgt.value.set(qx, qy, win(s, -14.56, -15.3, 0.1) * (1 - smoothstep(0.55, 0.95, rt.k2)) * (1 - lab) * 0.9)
    st.insetA = aIn
    // the quark tag (Point.tsx): right of the point on desktop, under it on phones
    u.uTagA.value = win(s, -16.4, -21.5, 0.4) * (1 - lab)
    if (rt.mobile) u.uTag.value.set(-100, 100, -78, -22)
    else u.uTag.value.set(34, 330, -12, 12)
    const wx = (IX - W / 2 - rt.shiftX * W) / pxW
    const wy = (H / 2 - IY - rt.shiftY * H) / pxW
    u.uInset.value.set(wx * pxW, wy * pxW, rIn, aIn)
    if (inset.current) {
      inset.current.visible = aIn > 0.002
      inset.current.position.set(wx, wy, 0)
      inset.current.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * aIn
    }
    insetTag.current.position.set(wx, wy - (rIn + 8) / pxW, 0)
    // reduced motion: dip to black between stills
    dip.current.visible = rt.dip > 0.001
    dipMat.opacity = rt.dip
  })

  return (
    <>
      <mesh ref={quad} geometry={geometry} material={material} frustumCulled={false} renderOrder={8} />
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (labelG.current[i] = el)}>
          <SceneLabel position={[0, 0, 0]} tone="field" align="left" opacity={() => st.la[i]}>
            <span ref={(el) => void (labelT.current[i] = el)} className="sd-ring" />
          </SceneLabel>
        </group>
      ))}
      <GlowPoint ref={inset} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <group ref={insetTag}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="ink" opacity={() => st.insetA}>
          <span className="sd-note sd-note--center">
            Electron · no size found
            <br />
            &lt; 3 × 10⁻¹⁹ m
          </span>
        </SceneLabel>
      </group>
      <mesh ref={dip} position={[0, 0, 6]} renderOrder={20} visible={false} frustumCulled={false} material={dipMat}>
        <planeGeometry args={[40, 40]} />
      </mesh>
    </>
  )
}
