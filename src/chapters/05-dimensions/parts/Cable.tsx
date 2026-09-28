import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, GlowPoint, useChapterFrame, type GlowPointApi } from '@/gl'
import { clamp, damp, easeInOutCubic, lerp, logLerp, range, smoothstep } from '@/core/math'
import { TI } from '../constants'
import { cableDist, cableNear } from '../model'
import { CableMesh, type CableApi } from '../gl/CableMesh'
import { HairLines, C_FIELD, C_INK, sg, circle, type HairLinesApi } from '../gl/HairLines'
import type { LabelLayer } from '../gl/labels'
import { labStage, textMask, type Timeline } from '../timeline'
import { noteSpot, readoutSpot } from './notes'

/*
 * Beat 2 · Hiding a direction by making it small — and the Lab's ZOOM station (content pack, ~ANALOGY).
 * Cable radius R_c = 1 (local units). Camera distance d (in cable radii) on a log path 10⁴ → 3.
 * The real camera stays ~8 world units away and the cable group is scaled by 8/d ("virtual distance":
 * identical perspective, no depth-precision or sky problems).
 *   D_px = 2R_c·(H/2)/(d·tan(fov/2))                 LOOKS LIKE: 1 DIMENSION < 1.5 px < fade < 6 px < 2
 *   ant: θ(t) = 1.2t around; ds/dt = 0.15·d along (wrapped in the visible width); 2 s fading trail
 */

export const CAM_D = 8
const TANH = Math.tan(((35 * Math.PI) / 180) / 2)
export const dPx = (d: number, H: number) => (2 * (H / 2)) / (d * TANH)

export function Cable({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null!)
  const cable = useRef<CableApi>(null)
  const lines = useRef<HairLinesApi>(null)
  const ant = useRef<GlowPointApi>(null)
  const st = useMemo(() => ({ s: 0, wZoom: 0, cp: new THREE.Vector3(), q: new THREE.Vector3() }), [])
  const L = useMemo(
    () => ({
      key: labels.make({ tone: 'dim', align: 'left', cls: 'dim-counter__k', text: 'LOOKS LIKE' }),
      one: labels.make({ tone: 'ink', align: 'left', cls: 'dim-readout', text: '1 dimension' }),
      two: labels.make({ tone: 'ink', align: 'left', cls: 'dim-readout', text: '2 dimensions' }),
      px: labels.make({ tone: 'dim', align: 'left', cls: 'dim-counter__sub', text: '' }),
      arc: labels.make({ tone: 'field', align: 'above', cls: 'dim-mono-case', text: 'around: finite · 2πr' }),
      note: labels.make({
        tone: 'dim',
        align: 'left',
        cls: 'dim-note',
        chip: 'analogy',
        text: 'A real cable has an inside. A hidden dimension doesn’t: only the surface counts as space.',
      }),
    }),
    [labels],
  )

  useChapterFrame((f) => {
    const Ln = lines.current
    const cm = cable.current
    const a = ant.current
    if (!Ln || !cm || !a) return
    const T = tl.T
    // beat weight (Beat 2 and the lattice hand-off), and the ZOOM station weight
    const beat = smoothstep(TI.cable + 0.0, TI.cable + 0.12, T) * (1 - smoothstep(TI.lattice + 0.12, TI.lattice + 0.24, T))
    const zoomTarget = tl.inLab && tl.lab.station === 'zoom' ? 1 : 0
    st.wZoom = f.dt === 0 ? zoomTarget : damp(st.wZoom, zoomTarget, 5, f.dt)
    const labW = st.wZoom * smoothstep(TI.lab - 0.02, TI.lab + 0.08, T) * (1 - smoothstep(TI.exit - 0.02, TI.exit + 0.1, T))
    const w = Math.max(beat, labW)
    Ln.begin()
    if (w <= 0.001) {
      group.current.visible = false
      Ln.end()
      Object.values(L).forEach((l) => l.op(0))
      return
    }
    group.current.visible = true

    // distance (cable radii) and the lattice hand-off
    const inLab = labW > beat
    let d = inLab ? tl.lab.zoom : cableDist(T < TI.lattice ? tl.u.cable : 1, tl.portrait)
    let only0 = 0
    let rc = CAM_D / d
    if (beat >= labW && T >= TI.lattice) {
      // Beat 3 opening: pull back along the cable; the tube dissolves, its cross-section ring stays
      const k = easeInOutCubic(range(T, TI.lattice, TI.lattice + 0.22))
      rc = logLerp(CAM_D / cableNear(tl.portrait), 0.12, k)
      d = CAM_D / 0.12 // (for the readout only)
      only0 = smoothstep(0.0, 0.6, k)
    }
    group.current.scale.setScalar(rc)

    const Dpx = dPx(d, tl.H)
    const rho = smoothstep(1.5, 6, Dpx)
    const u = cm.material.uniforms
    const wLocal = d * TANH * tl.aspect
    u.uLen.value = Math.max(2.8 * wLocal, 70)
    u.uOnly0.value = only0
    u.uOpacity.value = w
    u.uFar.value = 0.55
    u.uFog.value = CAM_D * 2.6
    // once the tube resolves, its far end fades before the narrative column (not in the lab)
    textMask(tl, u.uMask.value, labW > beat ? 0 : rho)

    // ── the ant ──
    const t = tl.t
    if (f.dt > 0) st.s += 0.15 * d * Math.min(f.dt, 1 / 20)
    // lab, close in: keep the ant on the framed section of the tube (around the camera target, which
    // slides down the tube as the camera looks along it), so its helix stays in view
    const wrapW = lerp(wLocal * 1.15 + 1, 2.4, inLab ? smoothstep(14, 5, d) : 0)
    const cL = inLab ? tl.camTx / rc : 0
    const wrap = (x: number) => ((((x + wrapW) % (2 * wrapW)) + 2 * wrapW) % (2 * wrapW)) - wrapW
    st.s = wrap(st.s)
    const th = 1.2 * t
    const antA = w * (1 - only0)
    a.visible = antA > 0.002
    a.position.set(cL + st.s, Math.cos(th), Math.sin(th))
    a.material.uniforms.uIntensity.value = 1.1 * antA
    // trail: the analytic past 2 s of the helix, dimmer on the far side of the tube
    camera.getWorldPosition(st.cp)
    group.current.worldToLocal(st.cp)
    let px = cL + st.s
    let py = Math.cos(th)
    let pz = Math.sin(th)
    const N = 48
    for (let i = 1; i <= N; i++) {
      const tau = (2 * i) / N
      const thi = 1.2 * (t - tau)
      const qx = cL + wrap(st.s - 0.15 * d * tau * (tl.amb || 1))
      const qy = Math.cos(thi)
      const qz = Math.sin(thi)
      if (Math.abs(qx - px) < wrapW) {
        // facing: radial direction vs direction to the camera
        const fx = st.cp.x - qx
        const fy = st.cp.y - qy
        const fz = st.cp.z - qz
        const fl = Math.hypot(fx, fy, fz) || 1
        const facing = (qy * fy + qz * fz) / fl
        const side = 0.35 + 0.65 * smoothstep(-0.25, 0.2, facing) * rho + (1 - rho) * 0.65
        const al = antA * Math.pow(1 - tau / 2, 1.6) * 0.9 * side
        sg(Ln, px, py, pz, qx, qy, qz, C_INK, al, 1.8)
      }
      px = qx
      py = qy
      pz = qz
    }

    // ── "around: finite · 2πr" arc at the closest approach ──
    // in the lab it follows the zoom itself (close in: the tube's circumference is what you see)
    const arcA = w * (1 - only0) * (inLab ? smoothstep(Math.log(40), Math.log(7), Math.log(d)) : smoothstep(0.82, 0.95, tl.u.cable)) * rho
    if (arcA > 0.001) {
      const ax = cL + 1.35
      circle(Ln, ax, 0, 0, 1.28, 0, 1, 0, 0, 0, 1, 64, C_FIELD, 0.75 * arcA, 1, 0, -2.6, 2.1)
      // arrowhead at the end of the arc
      const e = 2.1
      const ex = Math.cos(e) * 1.28
      const ez = Math.sin(e) * 1.28
      const tx = -Math.sin(e)
      const tz = Math.cos(e)
      sg(Ln, ax, ex, ez, ax, ex - tx * 0.14 + Math.cos(e) * 0.06, ez - tz * 0.14 + Math.sin(e) * 0.06, C_FIELD, 0.75 * arcA, 1)
      sg(Ln, ax, ex, ez, ax, ex - tx * 0.14 - Math.cos(e) * 0.06, ez - tz * 0.14 - Math.sin(e) * 0.06, C_FIELD, 0.75 * arcA, 1)
      group.current.localToWorld(st.q.set(ax, 1.3, 0.25))
      L.arc.at(st.q.x, st.q.y, st.q.z).op(arcA)
    } else L.arc.op(0)
    Ln.end()

    // ── readouts ──
    // (desktop lab: bottom-left of the free stage, clear of the arc label and the panel)
    const [rx0, ry0] = readoutSpot(tl)
    const labSpot = inLab && !tl.portrait
    const rx = labSpot ? labStage(tl).l + 0.01 : rx0
    const ry = labSpot ? 0.71 : ry0
    const leave = 1 - smoothstep(TI.lattice - 0.06, TI.lattice + 0.04, T)
    const ro = inLab ? labW : w * leave * smoothstep(TI.cable + 0.07, TI.cable + 0.15, T)
    L.key.scr(rx, ry).op(0.9 * ro)
    L.one.scr(rx, ry + 0.04).op(ro * (1 - rho))
    L.two.scr(rx, ry + 0.04).op(ro * rho)
    L.px.text(`cable ≈ ${Dpx < 10 ? Dpx.toFixed(1) : Dpx.toFixed(0)} px across`).scr(rx, ry + 0.085).op(0.8 * ro)
    const [nx, ny] = noteSpot(tl)
    // (the lab panel carries this caveat itself). Phones: just under the tube, and gone before the
    // beat text (with its caption) scrolls up through that spot at the end of the step
    const exitM = tl.portrait ? 1 - smoothstep(0.8, 0.87, tl.u.cable) : 1
    L.note.scr(nx, tl.portrait ? 0.42 : ny).op(labW > beat ? 0 : w * leave * exitM * clamp(smoothstep(0.35, 0.45, tl.u.cable), 0, 1))
  })

  return (
    <group ref={group}>
      <CableMesh ref={cable} />
      <HairLines ref={lines} capacity={140} />
      <GlowPoint ref={ant} size={0.001} minPixels={2} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" core={0.4} visible={false} />
    </group>
  )
}
