import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GlowPoints, useChapterFrame, type GlowPointsApi } from '@/gl'
import { smoothstep } from '@/core/math'
import { TI, T_END } from '../constants'
import { countB, latticeL, latticeRadius } from '../model'
import { HairLines, C_FIELD, C_INK, sg, type HairLinesApi } from '../gl/HairLines'
import { RingField, type RingFieldApi } from '../gl/RingField'
import type { LabelLayer } from '../gl/labels'
import { textMask, textMaskAt, type Timeline } from '../timeline'
import { noteSpot } from './notes'

/*
 * Beat 3 · A tiny circle at every point (content pack, ◑ DERIVED maths + ~ANALOGY drawing).
 * 7×7×7 lattice, spacing 1, hairline edges at 12%; a ring of radius 0.12 at every node (343 loops,
 * billboarded: the hidden circle points along none of our three axes). Sub-timeline l (model.latticeL):
 *   0.00–0.35  lattice and rings appear (camera 4 → 12)
 *   0.35–0.60  a marker on each ring: θ = 0.8·sin(0.7x + 0.4y + 0.3t) — how neighbours line up (~ potential)
 *   0.60–0.80  the radius breathes: r = 0.12·(1 + 0.25·sin(0.5z − 0.6t)) — a new field
 *   0.80–1.00  camera 12 → 30 while r shrinks log 0.12 → 0.003; opacity × smoothstep(1px, 4px, diameter)
 * Beat 5 brings it back (r = 0.12, quieter) and morphs the rings into the stand-in hidden-shape glyph;
 * the exit keeps it faint (15%) behind the final H2 loop.
 * Readability: rings right in front of the lens fade, and a screen-space mask keeps the text column clean.
 */

const N = 7
const H = (N - 1) / 2
const EXIT_ROT = new THREE.Euler(0.42, 0.62, 0.12)

export function Lattice({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null!)
  const lines = useRef<HairLinesApi>(null)
  const rings = useRef<RingFieldApi>(null)
  const marks = useRef<GlowPointsApi>(null)
  const nodes = useMemo(() => {
    const a = new Float32Array(N * N * N * 3)
    let n = 0
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
      a[n++] = i - H
      a[n++] = j - H
      a[n++] = k - H
    }
    return a
  }, [])
  const markPos = useMemo(() => new Float32Array(N * N * N * 3), [])
  const markSize = useMemo(() => new Float32Array(N * N * N).fill(0.05), [])
  const markAlpha = useMemo(() => new Float32Array(N * N * N).fill(1), [])
  const st = useMemo(
    () => ({ right: new THREE.Vector3(), up: new THREE.Vector3(), cam: new THREE.Vector3(), m: new THREE.Matrix4(), v: new THREE.Vector3() }),
    [],
  )
  const L = useMemo(
    () => ({
      hoop: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: 'The circle isn’t attached to points like a hoop; each point simply has one more direction.' }),
      twist: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: 'How neighbouring circles line up acts as the electromagnetic potential.' }),
      size: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: '…and the circle’s size itself can vary: a new field.' }),
      glyph: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: 'A stand-in. The real hidden shape is the next chapter.' }),
    }),
    [labels],
  )

  useChapterFrame(
    () => {
      const Ln = lines.current
      const rf = rings.current
      const mk = marks.current
      if (!Ln || !rf || !mk) return
      const T = tl.T
      let edge = 0
      let ringA = 0
      let r = 0.12
      let marker = 0
      let breath = 0
      let glyph = 0
      let z0 = 0
      let depthFade = 0
      let near = 3.4
      let r0 = 0
      let r1 = 0
      let mask = 1
      let exit = false
      // Beat 3 (and Klein's footnote)
      if (T >= TI.lattice - 0.01 && T < TI.fit + 0.2) {
        const l = T >= TI.fit ? 1 : latticeL(T)
        const out = 1 - smoothstep(TI.fit, TI.fit + 0.12, T)
        // the lattice gathers as the camera backs out of the centre node (camera 4 → 12)
        const inK = smoothstep(0.12, 0.34, l)
        edge = 0.12 * smoothstep(0.08, 0.3, l) * out
        ringA = 0.5 * inK * out
        r = latticeRadius(l)
        marker = smoothstep(0.35, 0.42, l) * (1 - smoothstep(0.76, 0.82, l))
        breath = smoothstep(0.6, 0.66, l) * (1 - smoothstep(0.8, 0.86, l))
        depthFade = 22
        r0 = 3.0
        r1 = 5.3
      }
      // Beat 5 (and receding into Beat 6): quieter, so the balance reads on top of it
      if (T >= TI.count - 0.02 && T < TI.bounds + 0.35) {
        const b = T >= TI.bounds ? 1 : T < TI.count ? 0 : countB(tl.u.count, tl.portrait)
        const k = smoothstep(TI.count + 0.02, TI.count + 0.16, T) * (1 - smoothstep(TI.bounds + 0.02, TI.bounds + 0.3, T))
        glyph = smoothstep(0.7, 0.9, b)
        edge = 0.06 * k
        ringA = (0.3 - 0.08 * glyph) * k
        r = 0.12 - 0.03 * glyph
        depthFade = 24
        r0 = 1.6
        r1 = 4.4
      }
      // Exit: a faint lattice (15%) of hidden-shape glyphs behind the final loop, turned so it reads as a crystal
      if (T >= TI.exit - 0.05) {
        const k = T >= T_END - 0.06 ? 1 : smoothstep(TI.exit - 0.05, TI.exit + 0.3, T)
        edge = 0.15 * 0.45 * k
        ringA = 0.15 * 1.3 * k
        r = 0.1
        glyph = 1
        z0 = -5
        depthFade = 30
        r0 = 1.8
        r1 = 4.6
        near = 0
        mask = 0
        exit = true
      }
      const vis = edge > 0.001 || ringA > 0.001
      group.current.visible = vis
      Ln.begin()
      if (!vis) {
        Ln.end()
        L.hoop.op(0)
        L.twist.op(0)
        L.size.op(0)
        L.glyph.op(0)
        return
      }
      group.current.position.set(0, 0, z0)
      if (exit) group.current.rotation.copy(EXIT_ROT)
      else group.current.rotation.set(0, 0, 0)
      group.current.updateMatrixWorld()
      camera.getWorldPosition(st.cam)
      group.current.worldToLocal(st.cam)

      // mask: keep the narrative column clean (not in the lab or the exit)
      const maskOn = mask * (tl.inLab ? 0 : 1)
      textMask(tl, Ln.material.uniforms.uMask.value, maskOn)
      textMask(tl, rf.material.uniforms.uMask.value, maskOn)

      // edges with a gentle depth cue (and the same soft radial falloff as the rings)
      const cd = st.cam.length()
      for (let a = 0; a < 3; a++) {
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          let ax = 0
          let ay = 0
          let az = 0
          if (a === 0) {
            ay = i - H
            az = j - H
          } else if (a === 1) {
            ax = i - H
            az = j - H
          } else {
            ax = i - H
            ay = j - H
          }
          const mx = ax - st.cam.x
          const my = ay - st.cam.y
          const mz = az - st.cam.z
          const dist = Math.sqrt(mx * mx + my * my + mz * mz)
          const dc = Math.min(1, Math.max(0.3, 1.45 - dist / (cd + 3)))
          const rad = r1 > r0 ? 0.35 + 0.65 * smoothstep(r1 + 1, r0 - 0.5, Math.hypot(ax, ay, az)) : 1
          const al = edge * dc * rad
          if (a === 0) sg(Ln, -H, ay, az, H, ay, az, C_FIELD, al, 1)
          else if (a === 1) sg(Ln, ax, -H, az, ax, H, az, C_FIELD, al, 1)
          else sg(Ln, ax, ay, -H, ax, ay, H, C_FIELD, al, 1)
        }
      }

      const u = rf.material.uniforms
      u.uR.value = r
      u.uOpacity.value = ringA
      u.uBreath.value = breath
      u.uGlyph.value = glyph
      u.uTime.value = tl.t * (tl.amb || 0)
      u.uSpin.value = 0.25 * tl.t * (tl.amb || 0)
      u.uWidth.value = 1
      u.uDepthFade.value = depthFade
      u.uNear.value = near
      // the twist phase focuses on one sheet of 7 × 7 circles (z = 0), so the smooth wave can be read;
      // the rest of the lattice drops to 25% and the sheet's corners are spared the radial falloff
      u.uFocus.value = marker
      u.uFocusZ.value = 0
      u.uRadial.value.set(r0 + 1.6 * marker, r1 + 1.3 * marker)
      rf.mesh.visible = ringA > 0.001

      // markers: a dot on each ring at θ from 12 o'clock (billboard frame)
      mk.visible = marker > 0.001 && ringA > 0.001
      if (mk.visible) {
        st.m.extractRotation(camera.matrixWorld)
        st.right.setFromMatrixColumn(st.m, 0)
        st.up.setFromMatrixColumn(st.m, 1)
        const t = tl.t * (tl.amb || 0)
        const n = nodes.length / 3
        for (let i = 0; i < n; i++) {
          const x = nodes[i * 3]
          const y = nodes[i * 3 + 1]
          const z = nodes[i * 3 + 2]
          const th = 0.8 * Math.sin(0.7 * x + 0.4 * y + 0.3 * t)
          const rr = r * (1 + breath * 0.25 * Math.sin(0.5 * z - 0.6 * t))
          const s = Math.sin(th) * rr
          const c = Math.cos(th) * rr
          const px = x + st.right.x * s + st.up.x * c
          const py = y + st.right.y * s + st.up.y * c
          const pz = z + st.right.z * s + st.up.z * c
          markPos[i * 3] = px
          markPos[i * 3 + 1] = py
          markPos[i * 3 + 2] = pz
          // the same fades as the rings: near the lens, radial, the text column, and the focus sheet
          st.v.set(x, y, z).applyMatrix4(group.current.matrixWorld)
          const depth = st.v.distanceTo(camera.position)
          st.v.project(camera)
          const nf = smoothstep(0.55 * near, near, depth)
          const inSheet = z === 0
          const rf2 = smoothstep(r1 + 1.3 * marker, r0 + 1.6 * marker, Math.hypot(x, y, z))
          const mf = textMaskAt(tl, st.v.x * 0.5 + 0.5, 0.5 - st.v.y * 0.5, maskOn)
          const a = marker * ringA * nf * rf2 * mf
          markAlpha[i] = a * 1.4 * (inSheet ? 1 : 0.15)
          markSize[i] = inSheet ? 0.06 : 0.04
          // a clock hand from the circle's centre to its marker: read the angle, sheet-wide
          if (inSheet) sg(Ln, x, y, z, px, py, pz, C_INK, 0.95 * a, 1.2)
        }
        const g = mk.geometry
        g.getAttribute('position').needsUpdate = true
        g.getAttribute('aAlpha').needsUpdate = true
        g.getAttribute('aSize').needsUpdate = true
      }
      Ln.end()

      // notes (Beat 3 sequence, Beat 5 glyph)
      const [nx, ny] = noteSpot(tl)
      const l = latticeL(T)
      const b3 = T >= TI.lattice && T < TI.klein ? 1 : 0
      L.hoop.scr(nx, ny).op(b3 * smoothstep(0.14, 0.2, l) * (1 - smoothstep(0.32, 0.36, l)))
      L.twist.scr(nx, ny).op(b3 * smoothstep(0.38, 0.43, l) * (1 - smoothstep(0.57, 0.61, l)))
      L.size.scr(nx, ny).op(b3 * smoothstep(0.62, 0.67, l) * (1 - smoothstep(0.77, 0.8, l)))
      const b5 = T >= TI.count && T < TI.bounds ? 1 : 0
      L.glyph.scr(nx, ny).op(b5 * smoothstep(0.72, 0.8, countB(tl.u.count, tl.portrait)))
    },
    { priority: -0.8 },
  )

  return (
    <group ref={group}>
      <HairLines ref={lines} capacity={4 * N * N + 8} renderOrder={0} />
      <RingField ref={rings} nodes={nodes} />
      <GlowPoints ref={marks} positions={markPos} sizes={markSize} alphas={markAlpha} minPixels={2.2} maxPixels={4.5} intensity={1.2} visible={false} />
    </group>
  )
}
