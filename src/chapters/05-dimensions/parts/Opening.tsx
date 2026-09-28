import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useChapterFrame } from '@/gl'
import { hash01, smoothstep } from '@/core/math'
import { handoffFit } from '@/core/handoff'
import { TI } from '../constants'
import { HairLines, C_FIELD, C_INK, sg, type HairLinesApi } from '../gl/HairLines'
import type { LabelLayer } from '../gl/labels'
import type { Timeline } from '../timeline'
import { openingQ } from '../model'

/*
 * Opening (content pack): a faint Field-blue x/y/z triad fades in behind the loop over q 0 → 0.5.
 * From q = 0.5 a dashed fourth stub "?" tries a new orientation every 0.6 s; from its tip three dashed
 * projections drop onto x, y, z with the readout "= 0.60x + 0.48y + 0.64z" (a unit vector: the weights
 * square-sum to 1). Every attempt is only a mix of the three, so it dims and tries again.
 * The triad is drawn obliquely (rotated) so that z reads while the camera stays at HANDOFF.camera.
 */

const AXIS = 3
const STUB = 2.2
const PERIOD = 0.6

export function Opening({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const lines = useRef<HairLinesApi>(null)
  const group = useRef<THREE.Group>(null!)
  const E = useMemo(() => {
    const e = new THREE.Euler(0.32, -0.62, 0.02)
    return [new THREE.Vector3(1, 0, 0).applyEuler(e), new THREE.Vector3(0, 1, 0).applyEuler(e), new THREE.Vector3(0, 0, 1).applyEuler(e)]
  }, [])
  const L = useMemo(
    () => ({
      x: labels.make({ tone: 'field', align: 'left', cls: 'dim-axisname', text: 'x' }),
      y: labels.make({ tone: 'field', align: 'above', cls: 'dim-axisname', text: 'y' }),
      z: labels.make({ tone: 'field', align: 'below', cls: 'dim-axisname', text: 'z' }),
      q: labels.make({ tone: 'ink', align: 'above', size: 'md', text: '?' }),
      r: labels.make({ tone: 'ink2', align: 'left', cls: 'dim-mono-case', text: '' }),
    }),
    [labels],
  )
  const st = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), v: new THREE.Vector3(), w: new THREE.Vector3() }), [])

  useLayoutEffect(() => () => Object.values(L).forEach((l) => l.op(0)), [L])

  const dirOf = (i: number, out: THREE.Vector3) => {
    // a random direction (seeded), biased away from the axes so the mix is obvious
    const u = hash01(i * 3.17 + 0.5) * 2 - 1
    const th = hash01(i * 7.31 + 1.7) * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    out.set(s * Math.cos(th), u, s * Math.sin(th))
    // keep it on the visible side (positive weights mostly, so projections land on drawn half-axes)
    out.set(Math.abs(out.x) * (hash01(i + 9.1) < 0.2 ? -1 : 1), Math.abs(out.y) * (hash01(i + 3.3) < 0.2 ? -1 : 1), Math.abs(out.z))
    const m = Math.min(Math.abs(out.x), Math.abs(out.y), Math.abs(out.z))
    if (m < 0.22) out.addScalar(0.25).normalize()
    return out.normalize()
  }

  useChapterFrame(() => {
    const Ln = lines.current
    if (!Ln) return
    Ln.begin()
    // portrait phones: the figure scales with the handoff loop (same fit as H2)
    const fs = tl.portrait ? handoffFit(tl.aspect) : 1
    group.current.scale.setScalar(fs)
    const T = tl.T
    const q = openingQ(T)
    const vis = T < TI.sweep + 0.25 ? 1 - smoothstep(TI.sweep - 0.06, TI.sweep + 0.07, T) : 0
    const axA = smoothstep(0.02, 0.5, q) * vis
    if (axA <= 0.001) {
      Ln.end()
      Object.values(L).forEach((l) => l.op(0))
      return
    }
    // triad
    for (let i = 0; i < 3; i++) {
      const e = E[i]
      sg(Ln, 0, 0, 0, e.x * AXIS, e.y * AXIS, e.z * AXIS, C_FIELD, 0.5 * axA, 1)
      // ticks every unit
      for (let k = 1; k < AXIS; k++) {
        const o = E[(i + 1) % 3]
        const px = e.x * k
        const py = e.y * k
        const pz = e.z * k
        sg(Ln, px - o.x * 0.06, py - o.y * 0.06, pz - o.z * 0.06, px + o.x * 0.06, py + o.y * 0.06, pz + o.z * 0.06, C_FIELD, 0.35 * axA, 1)
      }
      // arrowhead
      const o = E[(i + 1) % 3]
      const tx = e.x * AXIS
      const ty = e.y * AXIS
      const tz = e.z * AXIS
      sg(Ln, tx, ty, tz, tx - e.x * 0.16 + o.x * 0.07, ty - e.y * 0.16 + o.y * 0.07, tz - e.z * 0.16 + o.z * 0.07, C_FIELD, 0.5 * axA, 1)
      sg(Ln, tx, ty, tz, tx - e.x * 0.16 - o.x * 0.07, ty - e.y * 0.16 - o.y * 0.07, tz - e.z * 0.16 - o.z * 0.07, C_FIELD, 0.5 * axA, 1)
    }
    const la = (AXIS + 0.12) * fs
    L.x.at(E[0].x * la, E[0].y * la, E[0].z * la).op(0.9 * axA)
    L.y.at(E[1].x * la, E[1].y * la, E[1].z * la).op(0.9 * axA)
    L.z.at(E[2].x * la, E[2].y * la, E[2].z * la).op(0.9 * axA)

    // the probing fourth stub
    const stubA = smoothstep(0.5, 0.56, q) * (1 - smoothstep(0.86, 0.97, q)) * vis
    if (stubA > 0.001) {
      const t = tl.reduced ? 0.3 : tl.t
      const n = Math.floor(t / PERIOD)
      const ph = (t - n * PERIOD) / PERIOD
      // hold, then swing to the next orientation (weighted, not a jump)
      const sw = smoothstep(0.62, 1.0, ph)
      dirOf(n, st.a)
      dirOf(n + 1, st.b)
      st.v.copy(st.a).lerp(st.b, sw).normalize()
      // components along the (oblique) triad axes: v = Σ w_i E_i  (E is orthonormal)
      const wx = st.v.x
      const wy = st.v.y
      const wz = st.v.z
      st.w.set(0, 0, 0).addScaledVector(E[0], wx).addScaledVector(E[1], wy).addScaledVector(E[2], wz)
      const dim = 1 - 0.55 * Math.sin(Math.PI * sw) // dims while it swings: "tries again"
      const a = stubA * dim
      const tipx = st.w.x * STUB
      const tipy = st.w.y * STUB
      const tipz = st.w.z * STUB
      sg(Ln, 0, 0, 0, tipx, tipy, tipz, C_INK, 0.85 * a, 1.2, 7)
      // dashed projections from the tip onto each axis
      for (let i = 0; i < 3; i++) {
        const w = i === 0 ? wx : i === 1 ? wy : wz
        const e = E[i]
        const fx = e.x * w * STUB
        const fy = e.y * w * STUB
        const fz = e.z * w * STUB
        sg(Ln, tipx, tipy, tipz, fx, fy, fz, C_FIELD, 0.55 * a, 1, 4)
        // the landed weight: a short bright mark on the axis
        sg(Ln, 0, 0, 0, fx, fy, fz, C_FIELD, 0.9 * a, 2)
      }
      const f = (x: number) => Math.abs(x).toFixed(2)
      const sgn = (x: number) => (x < 0 ? '−' : '+')
      L.r.text(`= ${wx < 0 ? '−' : ''}${f(wx)}x ${sgn(wy)} ${f(wy)}y ${sgn(wz)} ${f(wz)}z`)
      // (portrait: pinned top-left, clear of the text block and the screen edge)
      if (tl.portrait) L.r.scr(0.035, 0.115).op(0.85 * a)
      else L.r.at(tipx * fs, tipy * fs, tipz * fs).op(0.85 * a)
      L.q.at(tipx * fs, (tipy + 0.08) * fs, tipz * fs).op(0.95 * a)
    } else {
      L.r.op(0)
      L.q.op(0)
    }
    Ln.end()
  })

  return (
    <group ref={group}>
      <HairLines ref={lines} capacity={96} />
    </group>
  )
}
