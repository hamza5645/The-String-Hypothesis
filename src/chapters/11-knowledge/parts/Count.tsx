import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createIsoGridMaterial, useChapterFrame } from '@/gl'
import { lerp, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { horizonR, N_MAX, omegaExp, Q1, Q5, sup, svS } from '../model'
import { circlePts, createLineMaterial, LineBuilder } from '../gl/lines'
import { el, type LabelLayer, type Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * Beat 3 · Counting a black hole (Model §7). Schematic except the numbers:
 *   Phase A — Q₅ = 5 bands, Q₁ = 4 rings on a hidden circle; N warm open strings, all circulating one
 *             way; ln Ω ≈ 2π√(Q₁Q₅N) live.
 *   Phase B — turn up the coupling: a horizon (radius ∝ √S, so drawn area ∝ S) swallows the branes;
 *             the count does not change.
 *   Phase C — A₅/4G₅ ≈ the same 153.9. "=" pulses. Leading order, large charges, extremal 5D only.
 */

const R0 = 0.9
const ARCS = N_MAX
const ARC_SEG = 6
export const COUNT_AT: [number, number, number] = [0, 2.0, 3.6]
const TILT = (22 * Math.PI) / 180

const sphereVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const sphereFrag = /* glsl */ `
  uniform vec3 uVoid;
  uniform vec3 uField;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    vec3 col = uVoid * (1.0 - f) + uField * f * 0.95;
    gl_FragColor = vec4(col, uOpacity);
  }
`

export function Count({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const root = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const branes = useRef<THREE.Group>(null!)
  const sphere = useRef<THREE.Mesh>(null!)
  const well = useRef<THREE.Mesh>(null!)

  const res = useMemo(() => {
    // Q₅ bands: five nested sleeves around the hidden circle (one geometry)
    const parts: THREE.BufferGeometry[] = []
    for (let k = 0; k < Q5; k++) {
      const c = new THREE.CylinderGeometry(R0 + 0.035 * (k - 2), R0 + 0.035 * (k - 2), 0.2 - 0.02 * Math.abs(k - 2), 120, 1, true)
      parts.push(c)
    }
    const bands = mergeGeos(parts)
    parts.forEach((p) => p.dispose())
    const bandMat = createIsoGridMaterial({ grid: [48, 2], lineWidth: 0.6, fill: 0.12 / Q5, fresnel: 0.25, color: '#86A8D8', lineColor: '#1E2A3B' })
    // Q₁ rings + the hidden circle itself
    const L = new LineBuilder()
    L.add(circlePts(R0 + 0.12, 0, 160), { color: '#86A8D8', alpha: 0.45, width: 1, dash: 14, yref: 'none' })
    for (let k = 0; k < Q1; k++) L.add(circlePts(R0 - 0.004 * k, -0.06 + 0.04 * k, 160), { color: '#86A8D8', alpha: 0.95, width: 1.2, glow: 3, yref: 'none' })
    const ringGeo = L.build()
    const ringMat = createLineMaterial()
    // warm arcs: open strings between rings and bands (dynamic)
    const A = new LineBuilder()
    for (let i = 0; i < ARCS * ARC_SEG; i++)
      A.add(
        [
          [0, 0, 0],
          [0, 0, 0],
        ],
        { color: '#FFC98A', alpha: 1, width: 1.6, glow: 4, yref: 'none' },
      )
    const arcGeo = A.build()
    const arcMat = createLineMaterial()
    // a small local grid under the diorama that bows toward the horizon (cartoon)
    const wellGeo = new THREE.PlaneGeometry(3.4, 3.4, 30, 30)
    wellGeo.rotateX(-Math.PI / 2)
    const wellBase = Float32Array.from(wellGeo.getAttribute('position').array as Float32Array)
    const wellMat = createIsoGridMaterial({ grid: [15, 15], lineWidth: 0.7, fill: 0.0, fresnel: 0, color: '#86A8D8', lineColor: '#2A3950' })
    const sphMat = new THREE.ShaderMaterial({
      vertexShader: sphereVert,
      fragmentShader: sphereFrag,
      uniforms: { uVoid: { value: new THREE.Color('#05070B') }, uField: { value: new THREE.Color('#86A8D8') }, uOpacity: { value: 1 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    const sphGeo = new THREE.SphereGeometry(1, 64, 40)
    return { bands, bandMat, ringGeo, ringMat, arcGeo, arcMat, wellGeo, wellBase, wellMat, sphMat, sphGeo }
  }, [])
  useLayoutEffect(
    () => () => {
      for (const v of Object.values(res)) if (v && typeof (v as { dispose?: () => void }).dispose === 'function') (v as { dispose: () => void }).dispose()
    },
    [res],
  )

  const lbl = useMemo(() => {
    if (!layer) return null
    const o = { cls: 'kn-lbl--field', safe: true }
    const circle = layer.add({ text: 'HIDDEN CIRCLE' }, [0, 0, 0], { ...o, cls: 'kn-lbl--dim', align: 'left' })
    const bands = layer.add({ text: `Q₅ = ${Q5} D5-BRANES`, sub: 'DRAWN AS BANDS' }, [0, 0, 0], { ...o, align: 'right' })
    const rings = layer.add({ text: `Q₁ = ${Q1} D1-BRANES` }, [0, 0, 0], { ...o, align: 'left' })
    const flow = layer.add({ text: 'ALL MOMENTUM FLOWS ONE WAY', sub: 'THE SUPERSYMMETRIC (EXTREMAL) CASE' }, [0, 0, 0], { screen: true, safe: false, clamp: false, cls: 'kn-lbl--warm kn-lbl--center', align: 'center' })
    // live equation row (screen space, under the diorama)
    const lv = el('span', 'kn-eqrow__val', [el('span', '', '0.0')])
    lv.firstElementChild!.setAttribute('data-t', '')
    const lOmega = el('span', 'kn-eqrow__cap', 'Ω ~ 10⁰ STATES')
    const lForm = el('span', 'kn-eqrow__formula', `ln Ω ≈ 2π√(Q₁Q₅N) = 2π√(4·5·0)`)
    const left = el('div', 'kn-eqrow__term', [el('span', 'kn-eqrow__cap', 'COUNTED · WEAK COUPLING'), lForm, lv, lOmega, el('span', 'kn-eqrow__lo', 'LEADING ORDER')])
    const eq = el('div', 'kn-eqrow__eq', [el('i'), el('i')])
    eq.setAttribute('aria-label', 'equals')
    const rv = el('span', 'kn-eqrow__val', '153.9')
    const right = el('div', 'kn-eqrow__term', [el('span', 'kn-eqrow__cap', 'BLACK HOLE · STRONG COUPLING'), el('span', 'kn-eqrow__formula', 'HORIZON AREA ÷ 4G₅'), rv, el('span', 'kn-eqrow__cap', 'A₅ / 4G₅'), el('span', 'kn-eqrow__lo', 'LEADING ORDER')])
    const row = el('div', 'kn-eqrow', [left, eq, right])
    const eqRow = layer.add(row, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'center', cls: 'kn-lbl--hud' })
    const dialKnob = el('span', 'kn-dial__knob')
    const dial = el('div', 'kn-dial', [
      el('span', 'kn-lbl__main', ['STRING COUPLING ', el('span', 'kn-lc', ['g', el('sub', '', 's')]), ' · WEAK → STRONG']),
      el('div', 'kn-dial__bar', [dialKnob]),
      el('div', 'kn-dial__ends', [el('span', '', 'HORIZON SMALLER THAN A STRING'), el('span', '', 'LARGER')]),
    ])
    const dialL = layer.add(dial, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'center', cls: 'kn-lbl--hud' })
    const unchanged = layer.add({ text: 'UNCHANGED · SUPERSYMMETRY PROTECTS THIS COUNT' }, [0, 0, 0], { screen: true, safe: false, clamp: false, align: 'center', cls: 'kn-lbl--field' })
    const neq = layer.add({ text: '≠  BLACK HOLES IN OUR SKY', sub: 'MICROSTATES NOT COUNTED · NOT COVERED BY THIS RESULT' }, [0, 0, 0], {
      screen: true,
      safe: false,
      clamp: false,
      align: 'center',
      cls: 'kn-lbl--t0 kn-lbl--center kn-lbl--md',
    })
    const same = layer.add({ text: 'SAME LEADING FORMULA, ¼ INCLUDED', sub: 'LARGE CHARGES · EXTREMAL 5D BLACK HOLES ONLY' }, [0, 0, 0], {
      screen: true,
      safe: false,
      clamp: false,
      align: 'center',
      cls: 'kn-lbl--field',
    })
    const tag = layer.add(
      el('span', 'kn-tag', [el('span', 'kn-tag__chip', '≈ ANALOGY'), el('span', '', 'BRANES AND HIDDEN DIRECTIONS DRAWN SCHEMATICALLY · NUMBERS FROM THE REAL FORMULA, LEADING ORDER')]),
      [0, 0, 0],
      { screen: true, safe: false, clamp: false, align: 'right', dx: 0.001, cls: 'kn-lbl--hud' },
    )
    return { circle, bands, rings, flow, eqRow, left, right, eq, lv, rv, lForm, lOmega, dialL, dialKnob, unchanged, same, neq, tag } as unknown as {
      circle: Lbl
      bands: Lbl
      rings: Lbl
      flow: Lbl
      eqRow: Lbl
      left: HTMLElement
      right: HTMLElement
      eq: HTMLElement
      lv: HTMLElement
      rv: HTMLElement
      lForm: HTMLElement
      lOmega: HTMLElement
      dialL: Lbl
      dialKnob: HTMLElement
      unchanged: Lbl
      same: Lbl
      neq: Lbl
      tag: Lbl
    }
  }, [layer])

  const st = useMemo(() => ({ N: -1, v: new THREE.Vector3(), phase: -1 }), [])

  useChapterFrame(
    (f) => {
      const c = S.cnt
      const g = root.current
      const on = c.grow > 0.001
      g.visible = on
      if (lbl) {
        for (const k of ['circle', 'bands', 'rings', 'flow', 'eqRow', 'dialL', 'unchanged', 'same', 'neq', 'tag'] as const) lbl[k].target = 0
      }
      if (!on) return
      const t = f.t
      g.scale.setScalar(Math.max(1e-3, c.grow))
      const sph = c.sphere
      // branes contract toward the centre and fade as the horizon engulfs them
      const shrink = lerp(1, 0.42, smoothstep(0.1, 1, sph))
      const bAlpha = 1 - smoothstep(0.45, 0.9, sph)
      branes.current.scale.setScalar(shrink)
      res.bandMat.uniforms.uOpacity.value = bAlpha
      res.ringMat.uniforms.uOpacity.value = bAlpha
      res.arcMat.uniforms.uOpacity.value = bAlpha
      // warm arcs: N open strings, every one circulating the same way at 0.6 rad/s
      const a = res.arcGeo.getAttribute('aA') as THREE.InstancedBufferAttribute
      const b = res.arcGeo.getAttribute('aB') as THREE.InstancedBufferAttribute
      const col = res.arcGeo.getAttribute('aColor') as THREE.InstancedBufferAttribute
      const spin = 0.6 * t * Math.max(ambient(), 0.35)
      for (let i = 0; i < ARCS; i++) {
        const phi = (i / ARCS) * Math.PI * 2 + spin
        const ringY = -0.06 + 0.04 * (i % Q1)
        const bandR = R0 + 0.035 * ((i * 3) % Q5 - 2)
        const bandY = ((i * 7) % 5) * 0.03 - 0.06
        const dphi = 0.12 / R0
        const alpha = i < c.N ? 1 : 0
        for (let s = 0; s < ARC_SEG; s++) {
          const k0 = s / ARC_SEG
          const k1 = (s + 1) / ARC_SEG
          arcPoint(phi, dphi, R0, ringY, bandR, bandY, k0, st.v)
          a.setXYZ(i * ARC_SEG + s, st.v.x, st.v.y, st.v.z)
          arcPoint(phi, dphi, R0, ringY, bandR, bandY, k1, st.v)
          b.setXYZ(i * ARC_SEG + s, st.v.x, st.v.y, st.v.z)
          col.setW(i * ARC_SEG + s, alpha)
        }
      }
      a.needsUpdate = true
      b.needsUpdate = true
      col.needsUpdate = true
      // the horizon: drawn radius ∝ √S (area ∝ S), cartoon mapping
      const S_now = svS(Math.max(c.N, 0))
      const rH = horizonR(S_now) * 1.25
      sphere.current.visible = sph > 0.001
      sphere.current.scale.setScalar(Math.max(1e-3, rH * sph))
      res.sphMat.uniforms.uOpacity.value = smoothstep(0, 0.2, sph)
      // the well: a local grid bowing toward the horizon (cartoon)
      const pos = res.wellGeo.getAttribute('position') as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      const depth = 0.55 * sph
      for (let i = 0; i < arr.length; i += 3) {
        const x = res.wellBase[i]
        const z = res.wellBase[i + 2]
        const r2 = x * x + z * z
        arr[i + 1] = -depth * Math.exp(-r2 / 0.9)
      }
      pos.needsUpdate = true
      res.wellMat.uniforms.uOpacity.value = 0.7 * smoothstep(0.0, 0.25, sph)
      well.current.visible = sph > 0.001

      if (!lbl || !layer) return
      const W = S.W
      const H = S.H
      const onL = c.grow * S.presence
      // 3D labels on the diorama (positions in map space)
      const [cx, cy, cz] = COUNT_AT
      lbl.circle.pos.set(cx + (R0 + 0.12) * 1.02, cy + 0.08, cz)
      lbl.bands.pos.set(cx - R0 - 0.1, cy + 0.02, cz + 0.1)
      lbl.rings.pos.set(cx + R0 * 0.72, cy - 0.16, cz + R0 * 0.62)
      const phaseA = c.phase === 1 ? 1 : 0
      lbl.circle.target = onL * (1 - sph) * 0.9
      lbl.bands.target = onL * (1 - sph) * smoothstep(0.1, 0.2, S.sp.count)
      lbl.rings.target = onL * (1 - sph) * smoothstep(0.12, 0.22, S.sp.count)
      lbl.flow.target = onL * phaseA * smoothstep(0.17, 0.23, S.sp.count)
      // equation row: left (count) from phase A; right (area) in phase C
      if (c.N !== st.N) {
        st.N = c.N
        const Sv = svS(c.N)
        layer.setText(lbl.eqRow, Sv.toFixed(1))
        lbl.lForm.textContent = `ln Ω ≈ 2π√(Q₁Q₅N) = 2π√(4·5·${c.N})`
        lbl.lOmega.textContent = c.N > 0 ? `Ω ~ 10${sup(omegaExp(Sv))} STATES` : 'Ω ~ 1 STATE'
      }
      // centre of the diorama on screen
      st.v.set(cx, cy, cz).applyMatrix4(g.parent!.matrixWorld)
      const cam = f.state.camera
      st.v.project(cam)
      const sx = (st.v.x * 0.5 + 0.5) * W
      const sy = (0.5 - st.v.y * 0.5) * H
      const mob = S.mobile
      lbl.eqRow.x = sx
      lbl.eqRow.y = mob ? sy + 128 : Math.min(sy + 232, H - 190)
      lbl.eqRow.target = onL * smoothstep(0.08, 0.14, S.sp.count)
      lbl.right.style.opacity = String(c.compare)
      lbl.eq.style.opacity = String(c.compare * (0.7 + 0.3 * Math.sin(t * 3.2)))
      lbl.dialL.x = sx
      lbl.dialL.y = sy - 205
      lbl.dialL.target = mob ? 0 : onL * smoothstep(0.32, 0.37, S.sp.count) * (1 - smoothstep(0.92, 1, S.sp.count))
      lbl.dialKnob.style.left = `${(c.coupling * 100).toFixed(1)}%`
      lbl.flow.x = sx
      lbl.flow.y = mob ? lbl.eqRow.y + 56 : sy - 190
      // phones: one caption line under the row at a time
      const capY = lbl.eqRow.y + (mob ? 56 : 96)
      lbl.unchanged.x = sx
      lbl.unchanged.y = capY
      lbl.unchanged.target = onL * smoothstep(0.38, 0.43, S.sp.count) * (1 - smoothstep(0.52, 0.55, S.sp.count))
      lbl.same.x = sx
      lbl.same.y = capY
      lbl.same.target = onL * smoothstep(0.56, 0.62, S.sp.count) * (mob ? 1 - smoothstep(0.65, 0.68, S.sp.count) : 1)
      lbl.neq.x = sx
      lbl.neq.y = mob ? capY : lbl.eqRow.y + 146
      lbl.neq.target = S.neq * S.presence * (mob ? smoothstep(0.68, 0.71, S.sp.count) : 1)
      lbl.tag.x = W - (S.mobile ? 16 : 64)
      lbl.tag.y = S.mobile ? 70 : H - 30
      lbl.tag.target = onL * (S.mobile ? 0 : 1)
    },
    { priority: -1.5 },
  )

  return (
    <group ref={root} position={COUNT_AT} visible={false}>
      <group ref={tilt} rotation-x={TILT}>
        <group ref={branes}>
          <mesh geometry={res.bands} material={res.bandMat} renderOrder={3} frustumCulled={false} />
          <mesh geometry={res.ringGeo} material={res.ringMat} renderOrder={4} frustumCulled={false} />
          <mesh geometry={res.arcGeo} material={res.arcMat} renderOrder={5} frustumCulled={false} />
        </group>
        <mesh ref={sphere} geometry={res.sphGeo} material={res.sphMat} renderOrder={7} frustumCulled={false} visible={false} />
      </group>
      <mesh ref={well} geometry={res.wellGeo} material={res.wellMat} position-y={-0.95} renderOrder={1} frustumCulled={false} />
    </group>
  )
}

/** A short arch from the ring (φ, ringY) to a band (φ + dφ, bandR, bandY), bulging outward. */
function arcPoint(phi: number, dphi: number, r0: number, y0: number, r1: number, y1: number, k: number, out: THREE.Vector3) {
  const ang = phi + dphi * k
  const bulge = Math.sin(Math.PI * k) * 0.05
  const r = r0 + (r1 - r0) * k + bulge
  out.set(Math.cos(ang) * r, y0 + (y1 - y0) * k + bulge * 0.6, Math.sin(ang) * r)
}

function mergeGeos(geos: THREE.BufferGeometry[]) {
  const pos: number[] = []
  const nrm: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  let base = 0
  for (const g of geos) {
    const p = g.getAttribute('position').array
    const n = g.getAttribute('normal').array
    const u = g.getAttribute('uv').array
    for (let i = 0; i < p.length; i++) pos.push(p[i])
    for (let i = 0; i < n.length; i++) nrm.push(n[i])
    for (let i = 0; i < u.length; i++) uv.push(u[i])
    const ix = g.getIndex()!.array
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + base)
    base += p.length / 3
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  out.setIndex(idx)
  return out
}
