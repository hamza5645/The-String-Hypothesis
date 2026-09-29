import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoint, SceneLabel, useChapterFrame, COLORS, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { smoothstep, superscript } from '@/core/math'
import { MASK, maskUniforms, updateMask } from '../glsl'
import { carbonHazeA, rt, win } from '../runtime'

/*
 * Screen-true diagram marks at z = 0 (so they follow the view shift), in one draw:
 * - Decade rings: circles of physical radius 10ᵏ m at (10ᵏ/L)·H px, visible while 0.03 H < R < 0.66 H.
 *   They fly outward as the zoom runs; past the measurement edge (k ≤ −19) they are dashed.
 * - The zoom reticle: four 6 px ticks around a 24 px gap (doubling once the point is centred).
 * - Beat 4: a ring around the snapshot quark; the electron inset (an identical glow, top right on
 *   desktop; upper left on phones, under the tape, where it cannot collide with the quark's tag).
 * Each mark is its own piece of geometry that covers only its hairline (a thin annulus per ring, a small
 * quad per mark), so the fill cost follows the lines' length, not the screen's area. A hidden piece
 * collapses to a point. Pieces evaluate only their own mark, so where they overlap the light adds up
 * exactly as a single full-screen pass would.
 */

const SEG = 256 // annulus segments per ring (sagitta < 0.1 px up to R ≈ 1400 px)
const PAD = 2.5 // CSS px of coverage beyond each hairline (the hairline's soft edge is ≤ 1.4 px)

const vert = /* glsl */ `
  attribute float aPiece;   // 0–2: decade ring i · 3: reticle · 4: snapshot target · 5: electron inset
  attribute vec2 aDir;      // ring: (cos θ, sin θ) · quad: corner (±1, ±1)
  attribute float aSide;    // ring: 0 inner edge, 1 outer edge
  uniform float uPxW;
  uniform vec3 uRings[3];
  uniform float uRet;
  uniform float uRetA;
  uniform vec3 uTgt;
  uniform vec4 uInset;
  varying vec2 vW;
  varying float vPiece;
  void main() {
    vec2 p;                 // CSS px from the focus
    float on;
    if (aPiece < 2.5) {
      vec3 R = uRings[int(aPiece + 0.5)];
      on = step(1e-4, R.y);
      p = aDir * (aSide > 0.5 ? R.x + ${PAD.toFixed(1)} : max(0.0, R.x - ${PAD.toFixed(1)}));
    } else if (aPiece < 3.5) {
      on = step(1e-4, uRetA);
      p = aDir * (18.0 * uRet + ${PAD.toFixed(1)});
    } else if (aPiece < 4.5) {
      on = step(1e-4, uTgt.z);
      p = uTgt.xy + aDir * (30.0 + ${PAD.toFixed(1)});
    } else {
      on = step(1e-4, uInset.w);
      p = uInset.xy + aDir * (uInset.z + ${PAD.toFixed(1)});
    }
    vec4 w = modelMatrix * vec4(p * on / uPxW, 0.0, 1.0);
    vW = w.xy;
    vPiece = aPiece;
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
  varying float vPiece;
  float hair(float d) { return 1.0 - smoothstep(0.0, (0.9 + 0.5 * uDpr) / uDpr, d); }
  void main() {
    vec2 p = vW * uPxW;       // CSS px from the focus
    float a;
    if (vPiece < 2.5) {
      // decade ring
      vec3 R = uRings[int(vPiece + 0.5)];
      a = hair(abs(length(p) - R.x));
      if (R.z > 0.5) {
        float n = max(8.0, floor(6.2831853 * R.x / 11.0));
        a *= step(0.42, fract(atan(p.y, p.x) / 6.2831853 * n));
      }
      a *= R.y * textMask();
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
    } else if (vPiece < 3.5) {
      // reticle ticks
      float g0 = 12.0 * uRet;
      float g1 = 18.0 * uRet;
      float tx = hair(abs(p.y)) * step(g0, abs(p.x)) * step(abs(p.x), g1);
      float ty = hair(abs(p.x)) * step(g0, abs(p.y)) * step(abs(p.y), g1);
      a = max(tx, ty) * uRetA;
    } else if (vPiece < 4.5) {
      // snapshot target ring
      a = hair(abs(length(p - uTgt.xy) - 30.0)) * uTgt.z;
    } else {
      // electron inset circle
      a = hair(abs(length(p - uInset.xy) - uInset.z)) * uInset.w * 0.8;
    }
    if (a <= 0.001) discard;
    gl_FragColor = vec4(uCol * a, 1.0);
  }
`

/** Three unit annuli (one per decade ring) and three unit quads (reticle, target, inset); the vertex
 *  shader sizes and places each piece from the uniforms. */
function hudGeometry() {
  const nRing = (SEG + 1) * 2
  const nV = 3 * nRing + 3 * 4
  const piece = new Float32Array(nV)
  const dir = new Float32Array(nV * 2)
  const side = new Float32Array(nV)
  const index: number[] = []
  let v = 0
  for (let i = 0; i < 3; i++) {
    const v0 = v
    for (let j = 0; j <= SEG; j++) {
      const th = (j / SEG) * 2 * Math.PI
      for (let e = 0; e < 2; e++) {
        piece[v] = i
        dir[v * 2] = Math.cos(th)
        dir[v * 2 + 1] = Math.sin(th)
        side[v] = e
        v++
      }
      if (j < SEG) {
        const a = v0 + j * 2
        index.push(a, a + 1, a + 3, a, a + 3, a + 2)
      }
    }
  }
  for (let q = 3; q < 6; q++) {
    const v0 = v
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      piece[v] = q
      dir[v * 2] = x
      dir[v * 2 + 1] = y
      v++
    }
    index.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3)
  }
  const g = new THREE.BufferGeometry()
  // position is unused by the shader (pieces are placed from the uniforms) but three expects one
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3))
  g.setAttribute('aPiece', new THREE.BufferAttribute(piece, 1))
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 2))
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  g.setIndex(index)
  return g
}

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
  const geometry = useMemo(() => hudGeometry(), [])
  const dipMat = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.void, transparent: true, opacity: 0, depthTest: false, depthWrite: false }), [])
  useLayoutEffect(
    () => () => {
      material.dispose()
      geometry.dispose()
      dipMat.dispose()
    },
    [material, geometry, dipMat],
  )
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
      // never outline the subject: around the carbon haze the 10⁻¹⁰ m ring reads as an orbit or a shell
      // edge ("no planets, no orbits"), around the gluon fog the 10⁻¹⁵ m ring as a hard proton surface
      // (blobs, not billiard balls). Other decades keep flying outward; the lab keeps its rings. The haze
      // fades in over more than a decade, so its ring is gone once the haze is a third of the way in.
      // The 10⁻¹⁵ m ring is centred on the target proton from the moment it enters (s −13.48), so it is
      // held back through the nucleus view too, where it would ring that one nucleon beside the blobs note.
      if (k === -10) a *= 1 - (1 - lab) * Math.min(1, 3 * carbonHazeA(s))
      else if (k === -15) a *= 1 - (1 - lab) * win(s, -13.4, -14.8, 0.2)
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
      <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={8} />
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
