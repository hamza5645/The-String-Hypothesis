import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useChapterFrame, useHandoffFit } from '@/gl'
import { explore } from '@/core/explore'
import { clamp, damp, range, smoothstep as ss, window01 } from '@/core/math'
import { params } from '@/core/params'
import { prefersReducedMotion } from '@/core/time'
import { MODES, packetAmp, trianglePluck, level, packetCount, PARTICLES } from './model'
import { rungY, Shared, trk } from './shared'
import { useVib } from './store'
import { beatCoord, exitU, pull, pullbackU, pullDecades } from './timeline'

const FROZEN = params.freeze != null
const DEG = Math.PI / 180
/** Fixed pseudo-random phase per harmonic (story beats). */
const STORY_PHASE = [0.4, 2.1, 4.0, 1.2, 5.3, 3.1]
/** Beat 1's pinned pluck: tent at σ = 0.2, height 0.16 L, 6-mode reconstruction. */
const TENT_P = 0.2
const TENT_H = 0.16
export const TENT_C = Array.from({ length: MODES }, (_, i) => TENT_H * trianglePluck(i + 1, TENT_P))

/** Lab pluck state shared between Director and Thread (PINNED decay + phases, drag). */
export const pin = {
  c: new Float64Array(MODES),
  t0: -1e3,
  phase: new Float64Array(STORY_PHASE),
}
export const drag = { on: false, sp: 0.2, h: 0 }

/** Beat-2 bead landings (local progress) and which harmonic each fills. */
export const BEADS2 = [0.43, 0.51, 0.59]
export const BEADS2_REPLAY = [0.735, 0.79, 0.845]
export const BEAD_MODE = [1, 1, 2]
export const BEAD_SIGMA = [0.3, 0.64, 0.46]
/** Beat-3 second bead (harmonic 1). */
export const BEAD3 = 0.68

/** Window with cross-fades centred on its edges (0.5 at each boundary), so neighbouring modes overlap. */
function xfade(x: number, a: number, b: number, f = 0.03) {
  return ss(a - f / 2, a + f / 2, x) * (1 - ss(b - f / 2, b + f / 2, x))
}

/** k-vector implied by beads that have landed. */
function beadK(b: number, lands: number[], out: number[]) {
  out.fill(0)
  for (let i = 0; i < lands.length; i++) if (b >= lands[i]) out[BEAD_MODE[i] - 1] += 1
}

export function Director({ S }: { S: Shared }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const fit = useHandoffFit()
  const Lo = S.layout
  useLayoutEffect(() => {
    Lo.compute(size.width, size.height, fit, document.documentElement.clientWidth || size.width, document.documentElement.clientHeight || size.height)
    pull.l0px = Lo.L4 * Lo.ppu
  }, [Lo, size, fit])

  const st = useMemo(
    () => ({
      k: [0, 0, 0, 0, 0, 0],
      oyaw: 0,
      opitch: 0,
      vyaw: 0,
      vpitch: 0,
      lastSx: NaN,
      lastSy: NaN,
      lastW: 0,
      lastH: 0,
      labPsi: 0,
      labSwirl: 0,
      labBasis: 1,
      shrinkLab: 0,
    }),
    [],
  )

  useChapterFrame(
    (f) => {
      const B = beatCoord(f.h)
      S.B = B
      S.t = f.t
      S.dt = f.dt
      S.frozen = FROZEN || f.dt === 0
      S.reduced = prefersReducedMotion()
      S.presence = f.presence
      S.active = f.h.active()
      S.inLab = f.h.inStep('lab')
      const dt = Math.max(f.dt, 1e-4)
      const snap = S.frozen
      const lab = useVib.getState()
      const m = Lo.mobile
      const w = Lo.w
      const h = Lo.h

      // ───────── camera ─────────
      const b3 = ss(4.0, 4.25, B) * (1 - ss(5.0, 5.08, B))
      const b6 = ss(7.02, 7.14, B) * (1 - ss(7.34, 7.46, B))
      const bl = ss(7.92, 8.06, B) * (1 - ss(9.0, 9.12, B))
      const yawS = 35 * b3 + 30 * bl
      const pitchS = 12 * b3 + 15 * b6 + 10 * bl
      const dist = 10 - 0.8 * range(B, 2.0, 3.0) * (1 - ss(3.0, 3.12, B)) - 1.6 * b6

      // lab: drags on empty stage orbit the bench (horizontal on touch); relaxes back outside the lab
      const labOn = S.inLab && S.active && B > 8.04 && B < 8.96 && S.logShrink > -1.2
      if (!snap) {
        if (labOn && explore.dragging && (explore.dx !== 0 || explore.dy !== 0)) {
          const dy = -explore.dx * 0.0055
          const dp = explore.dy * 0.004
          st.oyaw += dy
          st.opitch += dp
          st.vyaw = dy / dt
          st.vpitch = dp / dt
        } else if (labOn && !explore.dragging) {
          st.oyaw += st.vyaw * dt
          st.opitch += st.vpitch * dt
          const k = Math.exp(-3.5 * dt)
          st.vyaw *= k
          st.vpitch *= k
        } else if (!labOn) {
          st.oyaw = damp(st.oyaw, 0, 2.2, dt)
          st.opitch = damp(st.opitch, 0, 2.2, dt)
          st.vyaw = st.vpitch = 0
        }
        st.oyaw = clamp(st.oyaw, -1.05, 1.05)
        st.opitch = clamp(st.opitch, -0.5, 0.6)
      }
      const yaw = yawS * DEG + st.oyaw
      const pitch = pitchS * DEG + st.opitch
      S.yaw = yaw
      S.pitch = pitch
      S.dist = dist
      camera.position.set(dist * Math.sin(yaw) * Math.cos(pitch), dist * Math.sin(pitch), dist * Math.cos(yaw) * Math.cos(pitch))
      camera.lookAt(0, 0, 0)
      if (Math.abs(camera.fov - 35) > 1e-3) {
        camera.fov = 35
        camera.updateProjectionMatrix()
      }
      S.ppu = h / (2 * dist * Math.tan(17.5 * DEG))

      // view shift: the subject sits beside the text column (0 at the handoff frames)
      const SX = Lo.SX
      const SY = Lo.SY
      const sx = trk(B, [1.0, 0, 1.22, SX, 5.0, SX, 5.1, 0, 6.0, 0, 6.12, SX, 7.9, SX, 8.04, Lo.SXlab, 9.0, Lo.SXlab, 9.16, 0])
      const sy = m ? trk(B, [1.0, 0, 1.22, SY, 7.9, SY, 8.04, Lo.SYlab, 9.0, Lo.SYlab, 9.16, 0]) : trk(B, [7.9, 0, 8.04, Lo.SYlab, 9.0, Lo.SYlab, 9.16, 0])
      S.sx = sx
      S.sy = sy
      if (Math.abs(sx - st.lastSx) > 1e-5 || Math.abs(sy - st.lastSy) > 1e-5 || st.lastW !== w || st.lastH !== h) {
        st.lastSx = sx
        st.lastSy = sy
        st.lastW = w
        st.lastH = h
        if (Math.abs(sx) < 1e-5 && Math.abs(sy) < 1e-5) camera.clearViewOffset()
        else camera.setViewOffset(w, h, -sx * w, sy * h, w, h)
      }
      camera.updateMatrixWorld()

      // world position of a screen point on z = 0 at the default distance (frontal camera)
      const ppu10 = Lo.ppu

      // ───────── thread placement ─────────
      const slotC = Lo.slots[2]
      const cx4 = slotC ? (slotC.x - 0.5 * w) / ppu10 : 0
      const cy4 = slotC ? -(slotC.y - (0.5 - (m ? SY : 0)) * h) / ppu10 : 0
      // Beat 6 opens on rung 0: the massless point A resolves into the Thread lying on the rung
      const xA = (Lo.lad5.x + Lo.aOff - (0.5 + SX) * w) / ppu10
      const yA = -(rungY(Lo.lad5, 0) - (0.5 - (m ? SY : 0)) * h) / ppu10
      const y6 = m ? 0.25 : 0.1
      const L = trk(B, [
        2.0,
        Lo.L1,
        3.0,
        Lo.L1,
        3.14,
        Lo.Ls,
        4.0,
        Lo.Ls,
        4.12,
        Lo.L3,
        5.0,
        Lo.L3,
        5.08,
        Lo.L4,
        6.9,
        Lo.L4,
        6.95,
        Lo.L6,
        7.9,
        Lo.L6,
        7.95,
        Lo.Llab,
      ])
      S.thL = L
      S.thCx = trk(B, [2.02, 0, 2.15, Lo.cx1, 3.0, Lo.cx1, 3.14, 0, 3.66, 0, 3.86, Lo.cx2, 4.0, Lo.cx2, 4.12, Lo.cx3, 5.0, Lo.cx3, 5.08, cx4, 6.9, cx4, 6.95, xA, 7.04, xA, 7.16, 0])
      S.thCy = trk(B, [2.7, 0, 2.8, Lo.cy1, 3.0, Lo.cy1, 3.14, 0, 5.0, 0, 5.08, cy4, 6.9, cy4, 6.95, yA, 7.04, yA, 7.16, y6, 7.9, y6, 7.95, 0])
      S.thSlide = trk(B, [3.66, 1, 3.86, Lo.slide2, 4.0, Lo.slide2, 4.12, 1])
      S.wH1 = trk(B, [2.0, 1, 2.15, 0])
      S.h1Op = B < 1.4 ? 1 : 0

      // ───────── mode content ─────────
      const tgt = S.tgt
      tgt.fill(0)
      let jitter = 0
      let basis = 1
      let psi = 0
      let swirl = 0
      S.staticW = 0
      S.ghostOp = 0
      S.ghostSplit = 0
      S.pegsOp = 0
      S.nodesOp = 0
      S.nodesFree = 0
      S.compassOp = 0
      S.dotted = 0
      S.higgs = 0
      S.grav = 0
      S.spinSign = 0
      const k = st.k
      k.fill(0)
      let phaseSrc: ArrayLike<number> = STORY_PHASE

      if (B < 2) {
        tgt[0] = 0.085 * L
        basis = 1
      } else if (B < 3) {
        // Beat 1 — a guitar string: pinned ends, harmonics 1–4, then a pluck split into its harmonics
        const a = B - 2
        basis = trk(B, [2.02, 1, 2.15, 0])
        S.pegsOp = ss(0.02, 0.14, a)
        const A = 0.085 * L
        const ends = [0.245, 0.37, 0.495, 0.62]
        const starts = [-1, 0.245, 0.37, 0.495]
        let best = 0
        let bestW = 0
        for (let n = 1; n <= 4; n++) {
          const wn = xfade(a, starts[n - 1], ends[n - 1])
          tgt[n - 1] = A * wn
          if (wn > bestW) {
            bestW = wn
            best = n
          }
        }
        S.nodesN = best || 1
        S.nodesOp = ss(0.1, 0.15, a) * (1 - ss(0.6, 0.63, a))
        if (a > 0.6) {
          const pull = ss(0.62, 0.67, a)
          const rel = ss(0.67, 0.71, a)
          S.staticW = pull * (1 - rel)
          for (let n = 0; n < MODES; n++) tgt[n] += TENT_C[n] * L * rel
          S.ghostSplit = ss(0.71, 0.77, a) * (1 - ss(0.86, 0.92, a))
          S.ghostOp = ss(0.7, 0.74, a) * (1 - ss(0.9, 0.95, a))
          for (let n = 0; n < 4; n++) S.ghostC[n] = TENT_C[n] * L
        }
      } else if (B < 4) {
        // Beat 2 — unpin; free modes; quanta; the ladder
        const b = B - 3
        basis = trk(B, [3.04, 0, 3.16, 1])
        S.pegsOp = 1 - ss(0.015, 0.09, b)
        const A = 0.085 * L
        const fadePl = 1 - ss(0.0, 0.07, b)
        for (let n = 0; n < MODES; n++) tgt[n] = TENT_C[n] * L * fadePl
        const w1 = ss(0.0, 0.07, b) * (1 - ss(0.2, 0.215, b))
        tgt[0] += A * w1
        if (b >= 0.18 && b < 0.37) {
          const f1 = xfade(b, 0.185, 0.25)
          const f2 = xfade(b, 0.25, 0.3)
          const f3 = xfade(b, 0.3, 0.36)
          tgt[0] += A * f1
          tgt[1] += A * f2
          tgt[2] += A * f3
          S.nodesN = f3 > 0.5 ? 3 : f2 > 0.5 ? 2 : 1
          S.nodesOp = window01(b, 0.19, 0.355, 0.02)
          S.nodesFree = 1
        } else {
          S.nodesN = 1
          S.nodesOp = ss(0.1, 0.16, b) * (1 - ss(0.19, 0.2, b))
          S.nodesFree = ss(0.08, 0.16, b)
        }
        jitter = ss(0.33, 0.39, b)
        if (b >= 0.35 && b < 0.68) beadK(b, BEADS2, k)
        else if (b >= 0.68) beadK(b, BEADS2_REPLAY, k)
        for (let n = 0; n < MODES; n++) tgt[n] += packetAmp(k[n], n + 1) * L
      } else if (B < 5) {
        // Beat 3 — polarization and swirl (spin)
        const c = B - 4
        k[0] = c >= BEAD3 ? 2 : 1
        for (let n = 0; n < MODES; n++) tgt[n] = packetAmp(k[n], n + 1) * L
        jitter = 1
        psi = trk(B, [4.25, 0, 4.4, Math.PI / 2])
        swirl = trk(B, [4.4, 0, 4.6, 1])
        S.compassOp = ss(4.14, 4.26, B)
      } else if (B < 7.9) {
        // Beat 4 (the pull-back of k₁ = 2, swirling) … Beat 6 (massless shimmer)
        if (B < 6.9) {
          k[0] = 2
          psi = Math.PI / 2
          swirl = 1
          S.compassOp = 1 - ss(5.0, 5.06, B)
        }
        for (let n = 0; n < MODES; n++) tgt[n] = packetAmp(k[n], n + 1) * L
        jitter = 1
      } else {
        // Lab (and the exit, which relaxes the bench back to the bottom rung)
        const pinned = lab.ends === 'pinned'
        const sel = lab.particle ? PARTICLES.find((p) => p.id === lab.particle) : null
        const override = !!sel // particle cells show the bottom rung
        if (!pinned) {
          for (let n = 0; n < MODES; n++) k[n] = override ? 0 : lab.k[n]
          for (let n = 0; n < MODES; n++) tgt[n] = packetAmp(k[n], n + 1) * L
          jitter = 1
        } else {
          const tp = S.t - pin.t0
          for (let n = 0; n < MODES; n++) tgt[n] = Math.abs(pin.c[n]) * L * Math.exp(-Math.max(0, tp) / (3.0 / Math.sqrt(n + 1)))
        }
        const exitK = 1 - ss(9.0, 9.12, B)
        for (let n = 0; n < MODES; n++) tgt[n] *= exitK
        if (B >= 9) jitter = 1
        phaseSrc = pin.phase
        // wiggle direction, ends
        const pol = B < 9 ? lab.pol : 'ud'
        const tPsi = pol === 'io' ? Math.PI / 2 : 0
        const tSw = pol === 'cw' ? 1 : pol === 'ccw' ? -1 : 0
        const tBasis = pinned && B < 9 ? 0 : 1
        if (snap) {
          st.labPsi = tPsi
          st.labSwirl = tSw
          st.labBasis = tBasis
        } else {
          st.labPsi = damp(st.labPsi, tPsi, 5, dt)
          st.labSwirl = damp(st.labSwirl, tSw, 5, dt)
          st.labBasis = damp(st.labBasis, tBasis, 5, dt)
        }
        psi = st.labPsi
        swirl = st.labSwirl
        basis = st.labBasis
        S.spinSign = pol === 'cw' ? 1 : pol === 'ccw' ? -1 : 0
        S.pegsOp = (1 - basis) * (1 - ss(9.0, 9.1, B))
        S.pinnedLook = 1 - basis
        S.compassOp = ss(7.96, 8.03, B) * (1 - ss(9.0, 9.1, B))
        if (sel && sel.spin === '½') S.dotted = 1
        if (sel && sel.id === 'H') S.higgs = 1
        if (lab.particle === 'grav') S.grav = 1
        // node ticks when exactly one harmonic holds packets
        let one = -1
        let cnt = 0
        for (let n = 0; n < MODES; n++)
          if (k[n] > 0) {
            one = n
            cnt++
          }
        if (!pinned && cnt === 1) {
          S.nodesN = one + 1
          S.nodesOp = 0.8 * (1 - ss(9.0, 9.08, B))
          S.nodesFree = 1
        }
        if (pinned) jitter = 0
      }
      S.N = level(k)
      S.K = packetCount(k)
      S.basis = basis
      S.psi = psi
      S.swirl = swirl
      S.jitter = jitter * 0.015 * L

      // displayed amplitudes: follow targets; changes of packet number land as a 150 ms quantum step
      for (let n = 0; n < MODES; n++) {
        S.phase[n] = phaseSrc[n]
        if (snap || (B >= 7.9 && useVib.getState().ends === 'pinned' && !drag.on)) S.amp[n] = tgt[n]
        else if (drag.on && B >= 7.9) S.amp[n] = damp(S.amp[n], 0, 14, dt)
        else S.amp[n] = damp(S.amp[n], tgt[n], 22, dt)
      }

      // ───────── far view (Beat-4 pull-back, the lab's viewing distance, the exit) ─────────
      let logS = 0
      if (B >= 5 && B < 7) logS = -pullDecades(pullbackU(B))
      else if (B >= 7 && B < 7.9) logS = -pullDecades(1 - range(B, 7.0, 7.1)) // Beat 6: back into rung 0
      else if (B >= 7.9) {
        const target = lab.ends === 'pinned' ? 0 : -Math.log10(Math.max(1, lab.dist))
        st.shrinkLab = snap ? target : damp(st.shrinkLab, target, 10, dt)
        const back = ss(9.0, 9.14, B)
        logS = st.shrinkLab * (1 - back) - pullDecades(exitU(B))
      }
      S.logShrink = logS
      S.thScale = S.thSlide * Math.pow(10, logS)
      S.lenPx = L * S.ppu * S.thScale
      S.envelope = 1 - ss(30, 40, S.lenPx)
      S.pointW = 1 - ss(4, 10, S.lenPx)
      S.warmth = ss(10, 60, S.lenPx)
      S.pointHalo = Math.min(22, 4 + 3 * Math.sqrt(S.N))
      S.h0Op = B >= 9 ? ss(0.72, 1, exitU(B)) : 0

      // thread opacity per beat (far view hands over to a point sprite)
      const op = trk(B, [1.395, 0, 1.4, 1, 5.3, 1, 5.36, 0, 6.97, 0, 7.0, 1, 7.12, 1, 7.2, 0, 7.9, 0, 7.97, 1])
      S.thOp = op * (1 - S.pointW)
      S.thInt = 1 + 0.12 * Math.sqrt(S.N)
    },
    { priority: -3 },
  )
  return null
}
