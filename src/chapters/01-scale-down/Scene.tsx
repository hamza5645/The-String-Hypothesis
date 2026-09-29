import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { useChapterFrame, useViewShift } from '@/gl'
import { explore } from '@/core/explore'
import { pluck } from '@/core/audio'
import { clamp, damp, lerp, smoothstep } from '@/core/math'
import { particleScale } from '@/core/settings'
import { ambient } from '@/core/time'
import { HW, LEN, START, deltaOf, evalZoom, sEnd, type ZoomState } from './model'
import { rt, win } from './runtime'
import { useLab } from './store'
import { Figure } from './layers/Figure'
import { Skin } from './layers/Skin'
import { Chromatin } from './layers/Chromatin'
import { Dna } from './layers/Dna'
import { Nucleus } from './layers/Nucleus'
import { Point } from './layers/Point'
import { Hud } from './layers/Hud'

/*
 * Chapter 01 · Powers of Ten, reimagined in light.
 * One quantity drives everything: s = log10(L), the field of view in meters (model.ts). Each layer
 * lives in its own local unit (m, µm, nm, Å, fm); every frame the CPU computes, in float64, only the
 * ratio unit/L and each layer's offset from the zoom focus, and hands those to the GPU — so the
 * zoom spans 10⁰ … 10⁻³⁶ m without float32 collapse. The camera never moves (HANDOFF.camera):
 * the first frame is H0, the last is H1.
 */

export default function Scene() {
  const size = useThree((s) => s.size)
  const zs = useMemo(() => ({}) as ZoomState, [])
  const helix = useMemo(() => ({ t: 0, lastRatio: 0 }), [])
  const ps = particleScale()

  useChapterFrame(
    (f) => {
      const W = size.width
      const H = size.height
      const aspect = W / Math.max(1, H)
      rt.W = W
      rt.H = H
      rt.aspect = aspect
      rt.mobile = aspect < 0.8
      rt.t = f.t
      rt.dt = f.dt
      rt.ta = ambient() > 0 ? f.t : 2.5

      // the lab: horizontal drags on the empty stage zoom (right = closer)
      const lab = useLab.getState()
      if (f.h.inStep('lab') && explore.dragging && explore.dx !== 0) lab.setS(lab.s - explore.dx / 70)
      // the lab opens on the story's last state (the resolved string at s_end), so docking the panel
      // changes nothing on stage; on the way out it eases back there, so the bridge blend is a no-op
      const se = sEnd(aspect)
      const kLab = f.h.step('lab')
      if (lab.touched && (kLab < 0.04 || kLab >= 1)) lab.reset(se)
      else if (kLab > 0.78) lab.settle(se)
      lab.prime(se)

      evalZoom(f.h, aspect, zs)
      rt.z = zs.z
      rt.labW = zs.labW
      rt.dip = zs.dip
      rt.s = clamp(zs.s, -36.5, 1)
      rt.k = HW / Math.pow(10, rt.s)
      rt.px = H / HW
      rt.m = f.dt > 0 ? damp(rt.m, zs.m, 5, f.dt) : zs.m
      rt.ell = rt.m * Math.pow(10, zs.ls)
      const s = rt.s

      // choreography, all pure functions of s (so the lab can revisit every stage)
      rt.assemble = smoothstep(0.6, 1.62, rt.z)
      rt.cut = smoothstep(-2.5, -2.9, s)
      rt.tilt = smoothstep(-2.85, -3.9, s)
      rt.lock = smoothstep(-8.25, -8.75, s)
      rt.freeze = smoothstep(-14.6, -14.72, s)
      rt.k1 = smoothstep(-14.1, -14.6, s)
      rt.k2 = smoothstep(-14.72, -15.3, s)
      rt.tP += f.dt * (1 - rt.freeze) * ambient()
      // DNA spins at 0.05 rev/s until the reticle locks onto its carbon; it settles at the lock angle
      helix.t += f.dt * (1 - rt.lock) * ambient()
      const free = 2 * Math.PI * 0.05 * helix.t
      const target = 2 * Math.PI * Math.round(free / (2 * Math.PI))
      rt.helixAngle = free + rt.lock * (target - free)

      // composition: the subject sits beside the text column; handoff frames are centred
      const mob = rt.mobile
      const intro = smoothstep(0.58, 1.5, rt.z)
      const human = 1 - smoothstep(-0.3, -1.4, s)
      let bx = lerp(mob ? 0 : 0.14, mob ? 0.2 : 0.14, human)
      let by = lerp(mob ? 0.17 : 0, mob ? 0.2 : 0.17, human)
      const rv = smoothstep(START.reveal, START.reveal + 0.9, rt.z)
      bx = lerp(bx, mob ? 0 : 0.1, rv)
      // lab (desktop): the subject sits left of the docked panel; a long resolved string moves further
      // left so it never runs under the panel (panel ≈ 360 px + 118 px + gutter from the right edge)
      const gut = Math.min(56, Math.max(16, 0.04 * W))
      const strHalf = 0.5 * Math.min(1.2, rt.ell / Math.pow(10, s)) * H
      const room = (W - (360 + 118 + gut) - 36 - strHalf - W / 2) / W
      bx = lerp(bx, mob ? 0 : clamp(Math.min(-0.075, room), -0.2, -0.075), rt.labW)
      by = lerp(by, mob ? 0.21 : 0.04, rt.labW)
      const end = smoothstep(START.lab + LEN.lab - 0.45, START.bridge + 0.3, rt.z)
      rt.shiftX = bx * intro * (1 - end)
      rt.shiftY = by * intro * (1 - end)
      rt.maskK = (1 - rt.labW) * (1 - end)

      // reticle and rings
      const ratio = rt.ell / deltaOf(s)
      rt.retA = smoothstep(0.75, 1.3, rt.z) * (1 - smoothstep(0.3, 1.0, ratio)) * (1 - end) * 0.85
      rt.ret = 1 + smoothstep(-14.9, -15.5, s)
      const busy = Math.max(win(s, 0.6, -10.4, 0.5), win(s, -13.1, -14.9, 0.4))
      // the big question gets a clean frame
      const question = smoothstep(START.gap - 0.15, START.gap + 0.1, rt.z) * (1 - smoothstep(START.gap + 0.45, START.gap + 0.7, rt.z))
      rt.ringsA = smoothstep(1.15, 1.8, rt.z) * (1 - 0.62 * busy) * (1 - end) * (1 - 0.75 * question)

      // sound (a sonification; silent while sound is off): soft detents per decade, silence in Beats 4–5,
      // one tone when the string resolves
      const dec = Math.floor(s)
      if (dec !== rt.lastDecade) {
        if (f.h.active() && f.dt > 0 && (rt.labW > 0.5 || s > -14.6)) {
          if (dec <= -19) pluck(330, [{ n: 1, amp: 1 }, { n: 3, amp: 0.25 }], { decay: 0.16, gain: 0.08 })
          else pluck(880, [{ n: 1, amp: 1 }, { n: 2, amp: 0.2 }], { decay: 0.12, gain: 0.07 })
        }
        rt.lastDecade = dec
      }
      if (ratio >= 1 && helix.lastRatio < 1 && f.h.active() && f.dt > 0) {
        pluck(110, [1, 2, 3, 4].map((n) => ({ n, amp: 1 / n })), { decay: 3.6, gain: 0.45 })
      }
      helix.lastRatio = ratio
    },
    { priority: -2 },
  )

  useViewShift(() => [rt.shiftX, rt.shiftY])

  return (
    <>
      <Figure withBody count={Math.round(80000 * ps)} seed={3} hi={1.6} lo={-1.15} alpha={0.62} />
      <Figure withBody={false} count={Math.round(60000 * ps)} seed={4} hi={0.05} lo={-1.95} alpha={0.5} />
      <Skin />
      <Chromatin />
      <Dna />
      <Nucleus />
      <Point />
      <Hud />
    </>
  )
}
