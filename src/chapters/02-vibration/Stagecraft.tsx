import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { COLORS, Filament, GlowPoint, GlowPoints, useChapterFrame, type FilamentApi, type GlowPointApi, type GlowPointsApi } from '@/gl'
import { easeOutCubic, hash01, range, smoothstep as ss } from '@/core/math'
import { particleScale } from '@/core/settings'
import { CATALOGUE, MODES, packetAmp } from './model'
import { Hairlines, type HairApi } from './Hairlines'
import { rungY, type Shared } from './shared'
import { BEAD3, BEAD_SIGMA, BEADS2, BEADS2_REPLAY } from './Director'

/*
 * Everything on stage besides the main Thread:
 *  - hairline diagram (one draw call): pegs, node ticks, polarization compass, far-view spin ring,
 *    loupe rings, the Beat-6 lattice with a tiny circle at every point, brane sheets;
 *  - packet beads and the pegs' dust;
 *  - the Beat-4 catalogue: five point sprites, five loupes each holding the same Thread in its state,
 *    and the "same string" filament;
 *  - Beat 6's two copies of the Thread (a closed loop wound on a hidden circle; an open string on two sheets).
 */

/** preallocated loop constants (no array literals inside frame loops) */
const SIGNS = [-1, 1] as const
const HEADS = [0.6, -0.6] as const

const MINI = 96
const LOOPN = 160
const OPENN = 120
const SAMEN = 180

const glassVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const glassFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uAlpha;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    vec3 col = mix(vec3(0.016, 0.022, 0.036), vec3(0.05, 0.075, 0.12), smoothstep(0.45, 1.0, r));
    gl_FragColor = vec4(col, uAlpha * (1.0 - smoothstep(0.985, 1.0, r)));
  }
`

/** A point on the polarization dial: u along UP, w along the dial's IN direction (vx, 0, vz). */
function dial(cx: number, cy: number, vx: number, vz: number, u: number, w: number, out: THREE.Vector3) {
  return out.set(cx + vx * w, cy + u, vz * w)
}

export function Stagecraft({ S }: { S: Shared }) {
  const camera = useThree((s) => s.camera)
  const H = useRef<HairApi>(null)
  const beads = useRef<GlowPointsApi>(null)
  const motes = useRef<GlowPointsApi>(null)
  const pts = useRef<(GlowPointApi | null)[]>([])
  const discs = useRef<(THREE.Mesh | null)[]>([])
  const minis = useRef<(FilamentApi | null)[]>([])
  const same = useRef<FilamentApi>(null)
  const loop = useRef<FilamentApi>(null)
  const open = useRef<FilamentApi>(null)

  const C = useMemo(
    () => ({
      field: new THREE.Color(COLORS.field),
      ink: new THREE.Color(COLORS.ink),
      ink2: new THREE.Color(COLORS.ink2),
      ink3: new THREE.Color(COLORS.ink3),
      deep: new THREE.Color(COLORS.fieldDeep),
    }),
    [],
  )

  // buffers
  const beadPos = useMemo(() => new Float32Array(4 * 3), [])
  const beadA = useMemo(() => new Float32Array(4), [])
  const beadSz = useMemo(() => new Float32Array(4).fill(0.1), [])
  const nMotes = Math.max(40, Math.round(170 * particleScale()))
  const motePos = useMemo(() => new Float32Array(nMotes * 3), [nMotes])
  const moteA = useMemo(() => new Float32Array(nMotes), [nMotes])
  const moteSz = useMemo(() => {
    const a = new Float32Array(nMotes)
    for (let i = 0; i < nMotes; i++) a[i] = 0.022 + 0.03 * hash01(i * 3.1)
    return a
  }, [nMotes])
  const miniPts = useMemo(() => Array.from({ length: 5 }, () => new Float32Array(MINI * 3)), [])
  const samePts = useMemo(() => new Float32Array(SAMEN * 3), [])
  const loopPts = useMemo(() => new Float32Array(LOOPN * 3), [])
  const openPts = useMemo(() => new Float32Array(OPENN * 3), [])
  const discMats = useMemo(
    () =>
      Array.from(
        { length: 5 },
        () =>
          new THREE.ShaderMaterial({
            vertexShader: glassVert,
            fragmentShader: glassFrag,
            uniforms: { uAlpha: { value: 0 } },
            transparent: true,
            depthTest: false,
            depthWrite: false,
          }),
      ),
    [],
  )
  const discGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), [])
  useLayoutEffect(
    () => () => {
      discGeo.dispose()
      discMats.forEach((m) => m.dispose())
    },
    [discGeo, discMats],
  )
  const tops = useMemo(() => new Float32Array(5 * 2), [])
  const cm = useMemo(() => new THREE.Vector3(), [])
  const cu = useMemo(() => new THREE.Vector3(), [])

  useChapterFrame(
    () => {
      const B = S.B
      const Lo = S.layout
      const w = Lo.w
      const h = Lo.h
      const m = Lo.mobile
      const ppu10 = Lo.ppu
      const t = S.reduced ? 0.55 : S.t
      const om = S.omega
      const hair = H.current
      if (!hair) return
      hair.begin()

      // ───────── catalogue (Beat 4) → ladder (Beat 5) ─────────
      const inCat = B >= 5.0 && B < 7.15
      const d = B - 5
      const e = B - 6
      const sx4 = 0
      const sy4 = m ? Lo.SY : 0
      const sx5 = Lo.SX
      const sy5 = m ? Lo.SY : 0
      const rw = Lo.loupeR / ppu10
      S.loupeRw = rw
      for (let i = 0; i < 5; i++) {
        const c = S.cat[i]
        if (!inCat || !Lo.slots[i]) {
          c.a = 0
          c.open = 0
          continue
        }
        const sl = Lo.slots[i]
        const wx = (sl.x - (0.5 + sx4) * w) / ppu10
        const wy = -(sl.y - (0.5 - sy4) * h) / ppu10
        let x = wx
        let y = wy
        let a: number
        if (i === 2) {
          a = d < 0.33 ? S.pointW : 1
          if (d < 0.33) {
            x = S.thCx
            y = S.thCy
          }
        } else {
          a = ss(0.33, 0.39, d)
          const g = easeOutCubic(range(d, 0.33, 0.48))
          const off = ((i < 2 ? -1 : 1) * (0.62 * w)) / ppu10
          x = wx + off * (1 - g)
        }
        // Beat 5: swing into a column on the ladder rungs (A→0, B→1, C,D→2, E→4)
        const rung = [0, 1, 2, 2, 4][i]
        const lx = Lo.lad5.x + Lo.aOff + (i === 3 ? (m ? 22 : 36) : 0)
        const ly = rungY(Lo.lad5, rung)
        const rx = (lx - (0.5 + sx5) * w) / ppu10
        const ry = -(ly - (0.5 - sy5) * h) / ppu10
        const mv = ss(0.0 + 0.025 * i, 0.14 + 0.025 * i, e)
        if (mv > 0) {
          x = x + (rx - x) * mv
          y = y + (ry - y) * mv + Math.sin(Math.PI * mv) * 0.45
        }
        // Beat 6: every point but A leaves before the push into rung 0; A (the massless state) is the
        // Thread seen from far away, and hands over to it as the Thread resolves on the rung
        if (i === 0 && B >= 6.95) {
          x = S.thCx
          y = S.thCy
          a *= B >= 7 ? S.pointW * (1 - ss(7.1, 7.14, B)) : 1
        } else a *= 1 - ss(6.93, 7.0, B)
        c.x = x
        c.y = y
        c.a = a
        const N = [0, 1, 2, 2, 4][i]
        c.halo = Math.min(22, 4 + 3 * Math.sqrt(N))
        c.open = ss(0.49 + 0.055 * i, 0.55 + 0.055 * i, d) * (1 - ss(5.93, 5.99, B))
      }
      for (let i = 0; i < 5; i++) {
        const c = S.cat[i]
        const p = pts.current[i]
        if (p) {
          p.visible = c.a > 0.002
          if (p.visible) {
            p.position.set(c.x, c.y, 0)
            p.material.uniforms.uSize.value = (5 * c.halo) / ppu10
            const N = [0, 1, 2, 2, 4][i]
            const pulse = 1 + 0.16 * Math.sin(2 * Math.PI * (0.35 + 0.22 * Math.sqrt(N)) * t + i * 1.7)
            p.material.uniforms.uIntensity.value = 1.15 * c.a * pulse
          }
        }
        // loupe: glass, ring, the same Thread in this point's state
        const disc = discs.current[i]
        const mini = minis.current[i]
        const o = c.open
        const on = o > 0.004 && c.a > 0.01
        if (disc) {
          disc.visible = on
          if (on) {
            disc.position.set(c.x, c.y, 0)
            disc.scale.setScalar(rw * o)
            discMats[i].uniforms.uAlpha.value = 0.94 * Math.min(1, o * 1.5)
          }
        }
        if (on) {
          hair.arc(c.x, c.y, 0, 1, 0, 0, 0, 1, 0, rw * o, 0, Math.PI * 2, 72, C.field, 0.8 * o, 1)
          hair.arc(c.x, c.y, 0, 1, 0, 0, 0, 1, 0, rw * o * 1.06, 0.3, 1.1, 14, C.field, 0.35 * o, 1)
        }
        if (mini) {
          mini.group.visible = on && o > 0.3
          if (mini.group.visible) {
            const Lm = 1.45 * rw
            const k = CATALOGUE[i].k
            const P = miniPts[i]
            const grow = ss(0.3, 1, o)
            for (let j = 0; j < MINI; j++) {
              const sg = j / (MINI - 1)
              let y = 0
              for (let n = 0; n < MODES; n++) {
                const phi = Math.cos((n + 1) * Math.PI * sg)
                const A = packetAmp(k[n], n + 1) * Lm
                if (A > 0) y += A * phi * Math.cos((n + 1) * om * t + 0.4 + 1.7 * n)
                y += ((0.03 * Lm) / Math.sqrt(n + 1)) * phi * Math.sin(t * (2.3 + n * 1.3) + n * 2.1 + i)
              }
              P[j * 3] = c.x + (sg - 0.5) * Lm * grow
              P[j * 3 + 1] = c.y + y * grow
              P[j * 3 + 2] = 0.01
            }
            mini.update()
            mini.material.uniforms.uOpacity.value = ss(0.3, 0.8, o)
          }
        }
      }
      // one continuous filament hairline across the loupe tops: "same string"
      const sameOp = inCat ? ss(0.76, 0.82, d) * (1 - ss(5.92, 5.98, B)) : 0
      if (same.current) {
        same.current.group.visible = sameOp > 0.002
        if (sameOp > 0.002) {
          for (let q = 0; q < 5; q++) {
            const c = S.cat[q]
            tops[q * 2] = c.x
            tops[q * 2 + 1] = c.y + rw * c.open + 0.16
          }
          for (let j = 0; j < SAMEN; j++) {
            const u = (j / (SAMEN - 1)) * 4
            const q = Math.min(3, Math.floor(u))
            const fr = u - q
            const s2 = fr * fr * (3 - 2 * fr)
            const x0 = tops[q * 2]
            const x1 = tops[(q + 1) * 2]
            const y0 = tops[q * 2 + 1]
            const y1 = tops[(q + 1) * 2 + 1]
            samePts[j * 3] = x0 + (x1 - x0) * fr
            samePts[j * 3 + 1] = y0 + (y1 - y0) * s2 + 0.05 * Math.sin(fr * Math.PI) + 0.012 * Math.sin(u * 9 - t * 2.2)
            samePts[j * 3 + 2] = 0.01
          }
          // extend a little past the end loupes
          samePts[0] -= rw * 0.9
          samePts[(SAMEN - 1) * 3] += rw * 0.9
          same.current.update()
          same.current.material.uniforms.uOpacity.value = sameOp
        }
      }

      // ───────── thread furniture: pegs, nodes, compass, far-view spin ring ─────────
      const sc = S.thScale
      const L = S.thL
      const tx = S.thCx
      const ty = S.thCy
      const thVis = S.thOp > 0.02
      if (S.pegsOp > 0.002 && thVis) {
        const a = S.pegsOp
        const off = (1 - a) * 0.9
        const hy = 0.22
        for (let si = 0; si < 2; si++) {
          const sgn = SIGNS[si]
          const x = tx + sgn * ((L / 2) * sc + off)
          hair.seg(x, ty - hy, 0, x, ty + hy, 0, C.ink2, 0.85 * a, 1.25)
          hair.seg(x - 0.07, ty - hy, 0, x + 0.07, ty - hy, 0, C.ink2, 0.6 * a, 1)
          hair.seg(x - sgn * 0.0, ty - hy - 0.06, 0, x + sgn * 0.09, ty - hy + 0.03, 0, C.ink3, 0.5 * a, 1)
        }
      }
      if (S.nodesOp > 0.002 && thVis) {
        const n = S.nodesN
        const aP = S.nodesOp * (1 - S.nodesFree)
        const aF = S.nodesOp * S.nodesFree
        const tk = 0.11
        if (aP > 0.002)
          for (let j = 0; j <= n; j++) {
            const x = tx + (j / n - 0.5) * L * sc
            hair.seg(x, ty - tk, 0, x, ty + tk, 0, C.field, aP * (j === 0 || j === n ? 0.5 : 0.9), 1)
          }
        if (aF > 0.002)
          for (let j = 0; j < n; j++) {
            const x = tx + ((j + 0.5) / n - 0.5) * L * sc
            hair.seg(x, ty - tk, 0, x, ty + tk, 0, C.field, aF * 0.9, 1)
          }
      }
      if (S.compassOp > 0.002 && thVis && S.lenPx > 60) {
        const a = S.compassOp
        const rC = B >= 7.9 ? (m ? 0.24 : 0.3) : m ? 0.3 : 0.5
        const cx = tx + (L / 2) * sc + rC + (B >= 7.9 ? 0.1 : m ? 0.1 : 0.24)
        const cy = ty
        S.compassX = cx
        S.compassY = cy
        S.compassZ = 0
        S.compassR = rC
        // disc in the plane of transverse wiggles (y–z); in the lab the dial is turned toward the viewer
        const tilt = B >= 7.9 ? 0.85 : 0
        const vx = -Math.sin(tilt)
        const vz = Math.cos(tilt)
        S.compassVx = vx
        S.compassVz = vz
        hair.arc(cx, cy, 0, 0, 1, 0, vx, 0, vz, rC, 0, Math.PI * 2, 64, C.field, 0.6 * a, 1)
        hair.seg(cx, cy - rC * 1.12, 0, cx, cy + rC * 1.12, 0, C.field, 0.32 * a, 1, 5)
        hair.seg(cx - vx * rC * 1.12, cy, -vz * rC * 1.12, cx + vx * rC * 1.12, cy, vz * rC * 1.12, C.field, 0.32 * a, 1, 5)
        const lin = 1 - Math.min(1, Math.abs(S.swirl))
        const cps = Math.cos(S.psi)
        const sps = Math.sin(S.psi)
        if (S.higgs > 0) {
          // Higgs: the arrow points "into" a tiny hidden-circle glyph (in some models)
          const hx = cx + rC * 0.2
          const hy = cy + rC * 0.55
          const hz = rC * 0.62
          hair.seg(cx, cy, 0, hx, hy, hz, C.ink, 0.9 * a, 1.4)
          hair.arc(hx, hy, hz, 1, 0, 0, 0, 1, 0, rC * 0.16, 0, Math.PI * 2, 24, C.field, 0.9 * a, 1)
        } else if (lin > 0.01) {
          const r = rC * 0.82
          const ay = cps * r
          const az = sps * r
          // (u, w) coordinates in the dial: u along UP, w along IN
          dial(cx, cy, vx, vz, -ay, -az, cm)
          dial(cx, cy, vx, vz, ay, az, cu)
          hair.seg(cm.x, cm.y, cm.z, cu.x, cu.y, cu.z, C.ink, 0.95 * a * lin, 1.4)
          for (let si = 0; si < 2; si++) {
            const sgn = SIGNS[si]
            const eu = sgn * ay
            const ew = sgn * az
            const bu = -sgn * cps * rC * 0.2
            const bw = -sgn * sps * rC * 0.2
            const pu = -sps * rC * 0.12
            const pw = cps * rC * 0.12
            dial(cx, cy, vx, vz, eu, ew, cm)
            dial(cx, cy, vx, vz, eu + bu + pu, ew + bw + pw, cu)
            hair.seg(cm.x, cm.y, cm.z, cu.x, cu.y, cu.z, C.ink, 0.95 * a * lin, 1.4)
            dial(cx, cy, vx, vz, eu + bu - pu, ew + bw - pw, cu)
            hair.seg(cm.x, cm.y, cm.z, cu.x, cu.y, cu.z, C.ink, 0.95 * a * lin, 1.4)
          }
        }
        const circ = Math.min(1, Math.abs(S.swirl))
        if (circ > 0.01 && S.higgs === 0) {
          const sgn = S.swirl >= 0 ? 1 : -1
          const r = rC * 0.62
          const a0 = t * 1.2 * sgn
          const a1 = a0 + sgn * Math.PI * 1.6
          hair.arc(cx, cy, 0, 0, 1, 0, vx, 0, vz, r, a0, a1, 40, C.ink, 0.95 * a * circ, 1.4)
          // arrowhead at the arc's end (dial coordinates u = UP, w = IN)
          const eu = r * Math.cos(a1)
          const ew = r * Math.sin(a1)
          const tu = -Math.sin(a1) * sgn
          const tw = Math.cos(a1) * sgn
          const nu = Math.cos(a1)
          const nw = Math.sin(a1)
          const hl = rC * 0.2
          for (let hi = 0; hi < 2; hi++) {
            const k = HEADS[hi]
            const qu = eu - tu * hl + nu * hl * k
            const qw = ew - tw * hl + nw * hl * k
            hair.seg(cx + vx * ew, cy + eu, vz * ew, cx + vx * qw, cy + qu, vz * qw, C.ink, 0.95 * a * circ, 1.4)
          }
        }
      }
      // far view (lab + exit): a spin ring with K+1 ticks around the point
      if (B >= 7.9 && S.pointW > 0.01 && S.h0Op < 0.99) {
        const a = S.pointW * (1 - S.h0Op) * (1 - ss(9.0, 9.1, B))
        const e2 = camera.matrixWorld.elements
        cm.set(e2[0], e2[1], e2[2]).normalize()
        cu.set(e2[4], e2[5], e2[6]).normalize()
        const rpx = S.pointHalo + 6
        const r = rpx / S.ppu
        hair.arc(tx, ty, 0, cm.x, cm.y, cm.z, cu.x, cu.y, cu.z, r, 0, Math.PI * 2, 48, C.field, 0.55 * a, 1)
        const n = S.K + 1
        const rot = S.spinSign * 2 * Math.PI * 0.2 * t
        for (let j = 0; j < n; j++) {
          const ang = rot + (2 * Math.PI * j) / n + Math.PI / 2
          const ca = Math.cos(ang)
          const sa = Math.sin(ang)
          const r2 = (rpx + 4) / S.ppu
          hair.seg(
            tx + r * (cm.x * ca + cu.x * sa),
            ty + r * (cm.y * ca + cu.y * sa),
            r * (cm.z * ca + cu.z * sa),
            tx + r2 * (cm.x * ca + cu.x * sa),
            ty + r2 * (cm.y * ca + cu.y * sa),
            r2 * (cm.z * ca + cu.z * sa),
            C.ink,
            0.8 * a,
            1.2,
          )
        }
      }
      // reduced motion: the oscillation is frozen; draw its faint min/max envelope
      if (S.reduced && thVis && B >= 2 && S.lenPx > 60) {
        const cps = Math.cos(S.psi)
        const sps = Math.sin(S.psi)
        let px = 0
        let py = 0
        let pz = 0
        for (let si = 0; si < 2; si++) {
          const sgn = SIGNS[si]
          for (let j = 0; j <= 48; j++) {
            const sg = j / 48
            let env = 0
            for (let n = 0; n < MODES; n++) {
              const phi = Math.sin((n + 1) * Math.PI * sg) * (1 - S.basis) + Math.cos((n + 1) * Math.PI * sg) * S.basis
              env += Math.abs(S.amp[n] * phi)
            }
            const x = tx + (sg - 0.5) * L * sc
            const y = ty + sgn * env * cps * sc
            const z = sgn * env * sps * sc
            if (j > 0) hair.seg(px, py, pz, x, y, z, C.field, 0.3 * S.thOp, 1, 4)
            px = x
            py = y
            pz = z
          }
        }
      }

      // ───────── beads: packets falling into harmonics ─────────
      const bd = beads.current
      if (bd) {
        let any = false
        beadA.fill(0)
        const bsz = (16 / S.ppu) * (m ? 0.85 : 1)
        if (B >= 3.3 && B < 4) {
          const b = B - 3
          const replay = b >= 0.66
          const lands = replay ? BEADS2_REPLAY : BEADS2
          const fall = replay ? 0.035 : 0.06
          for (let i = 0; i < 3; i++) {
            const u = range(b, lands[i] - fall, lands[i])
            if (u <= 0 || u >= 1) continue
            const x = tx + (BEAD_SIGMA[i] - 0.5) * L * sc
            const top = ty + (h / 2 + 40) / S.ppu + (m ? 1 : 0.4)
            beadPos[i * 3] = x
            beadPos[i * 3 + 1] = top + (ty - top) * u * u
            beadPos[i * 3 + 2] = 0
            beadA[i] = ss(0, 0.15, u)
            beadSz[i] = bsz
            any = true
          }
        } else if (B >= 4.55 && B < 4.7) {
          const c = B - 4
          const u = range(c, BEAD3 - 0.06, BEAD3)
          if (u > 0 && u < 1) {
            const top = ty + (h / 2 + 40) / S.ppu + 0.4
            beadPos[9] = tx
            beadPos[10] = top + (ty - top) * u * u
            beadPos[11] = 0
            beadA[3] = ss(0, 0.15, u)
            beadSz[3] = bsz
            any = true
          }
        }
        bd.visible = any
        if (any) {
          bd.geometry.getAttribute('position').needsUpdate = true
          bd.geometry.getAttribute('aAlpha').needsUpdate = true
          bd.geometry.getAttribute('aSize').needsUpdate = true
        }
      }
      // pegs dissolve into dust as the ends are set free (Beat 2)
      const mt = motes.current
      if (mt) {
        const on = B >= 3.0 && B < 3.3 && thVis
        mt.visible = on
        if (on) {
          const b = B - 3
          for (let i = 0; i < nMotes; i++) {
            const r1 = hash01(i * 1.37 + 0.2)
            const r2 = hash01(i * 2.71 + 0.9)
            const r3 = hash01(i * 4.19 + 0.4)
            const sgn = i % 2 === 0 ? -1 : 1
            const delay = 0.03 * r3
            const u = range(b, 0.015 + delay, 0.2 + delay)
            const x0 = tx + sgn * (L / 2) * sc
            const y0 = ty + (r1 - 0.5) * 0.44
            const ang = (r2 - 0.5) * 2.4 + (sgn < 0 ? Math.PI : 0)
            const dist = (0.25 + 0.9 * r3) * u
            motePos[i * 3] = x0 + Math.cos(ang) * dist
            motePos[i * 3 + 1] = y0 + Math.sin(ang) * dist * 0.6 + 0.25 * u * u
            motePos[i * 3 + 2] = (r1 - 0.5) * 0.4 * u
            moteA[i] = u > 0 && u < 1 ? 0.85 * Math.pow(Math.sin(Math.PI * u), 0.6) : 0
          }
          mt.geometry.getAttribute('position').needsUpdate = true
          mt.geometry.getAttribute('aAlpha').needsUpdate = true
        }
      }

      // ───────── Beat 6: a lattice with a tiny circle at every point; the Thread in two copies ─────────
      const g6 = B - 7
      const gridOp = B >= 7 && B < 8 ? ss(0.03, 0.12, g6) * (1 - ss(0.34, 0.42, g6)) : 0
      const s6 = m ? 0.5 : 1
      const y0 = m ? 0.25 : 0.1
      const split = ss(0.1, 0.22, g6)
      const close = ss(0.14, 0.24, g6)
      const copiesOp = B >= 7 && B < 8 ? ss(0.09, 0.14, g6) * (1 - ss(0.34, 0.42, g6)) : 0
      const sheetsOp = copiesOp * ss(0.16, 0.24, g6)
      const D6 = 1.2 * s6
      S.c1x = -D6 * split
      S.c1y = y0
      S.c2x = D6 * split
      S.c2y = y0
      S.b6scale = s6
      S.b6op = copiesOp
      if (gridOp > 0.002) {
        const yF = -1.05 * s6 + (m ? 0.1 : 0)
        const X = 2.4 * s6
        const step = 0.4 * s6
        const z0 = -3.2 * s6
        const z1 = 1.2 * s6
        const zc = (z0 + z1) / 2
        const R2 = X * X
        // a soft patch of lattice (fades toward its rim) rather than a plane to infinity
        for (let x = -X; x <= X + 1e-6; x += step) {
          let px = x
          let pz = z0
          for (let z = z0 + step; z <= z1 + 1e-6; z += step) {
            const f = Math.max(0, 1 - (x * x + (z - zc) * (z - zc) * 1.4) / R2)
            hair.seg(px, yF, pz, x, yF, z, C.field, 0.15 * gridOp * f, 1)
            px = x
            pz = z
          }
        }
        for (let z = z0; z <= z1 + 1e-6; z += step) {
          let px = -X
          for (let x = -X + step; x <= X + 1e-6; x += step) {
            const f = Math.max(0, 1 - (x * x + (z - zc) * (z - zc) * 1.4) / R2)
            hair.seg(px, yF, z, x, yF, z, C.field, 0.15 * gridOp * f, 1)
            px = x
          }
        }
        const rr = 0.045 * s6
        for (let x = -X; x <= X + 1e-6; x += step)
          for (let z = z0; z <= z1 + 1e-6; z += step) {
            const f = Math.max(0, 1 - (x * x + (z - zc) * (z - zc) * 1.4) / R2)
            if (f > 0.02) hair.arc(x, yF + rr, z, 1, 0, 0, 0, 1, 0, rr, 0, Math.PI * 2, 8, C.field, 0.34 * gridOp * f, 1)
          }
        // the focal hidden circle rises out of the lattice and grows into a short tube
        const rise = ss(0.1, 0.22, g6)
        const rC = (0.05 + 0.3 * rise) * s6
        const fx = S.c1x
        const fy = yF + rr + (y0 - (yF + rr)) * rise
        const depth = 0.16 * s6 * rise
        const ta = gridOp * (0.5 + 0.4 * rise)
        hair.arc(fx, fy, -depth, 1, 0, 0, 0, 1, 0, rC, 0, Math.PI * 2, 48, C.field, 0.75 * ta, 1)
        hair.arc(fx, fy, depth, 1, 0, 0, 0, 1, 0, rC, 0, Math.PI * 2, 48, C.field, 0.75 * ta, 1)
        for (let j = 0; j < 12; j++) {
          const an = (j / 12) * Math.PI * 2
          const xx = fx + rC * Math.cos(an)
          const yy = fy + rC * Math.sin(an)
          hair.seg(xx, yy, -depth, xx, yy, depth, C.field, 0.35 * ta, 1)
        }
      }
      if (sheetsOp > 0.002) {
        const hx = 0.62 * s6
        const hy = 0.52 * s6
        const hz = 0.62 * s6
        for (let si = 0; si < 2; si++) {
          const sgn = SIGNS[si]
          const x = S.c2x + sgn * hx
          const cy = S.c2y
          hair.seg(x, cy - hy, -hz, x, cy + hy, -hz, C.field, 0.55 * sheetsOp, 1)
          hair.seg(x, cy - hy, hz, x, cy + hy, hz, C.field, 0.55 * sheetsOp, 1)
          hair.seg(x, cy - hy, -hz, x, cy - hy, hz, C.field, 0.55 * sheetsOp, 1)
          hair.seg(x, cy + hy, -hz, x, cy + hy, hz, C.field, 0.55 * sheetsOp, 1)
          for (let q = 1; q < 4; q++) {
            const yy = cy - hy + (2 * hy * q) / 4
            hair.seg(x, yy, -hz, x, yy, hz, C.field, 0.2 * sheetsOp, 1, 4)
          }
        }
      }
      // copy 1: closes into a loop wound once around the hidden circle
      if (loop.current) {
        const on = copiesOp > 0.002
        loop.current.group.visible = on
        if (on) {
          const Lc = S.layout.L6 * (1 - 0.35 * split)
          const rL = (0.05 + 0.3 * ss(0.1, 0.22, g6)) * s6 * 1.08
          for (let j = 0; j < LOOPN; j++) {
            const sg = j / (LOOPN - 1)
            const ox = S.c1x + (sg - 0.5) * Lc
            const oy = y0 + 0.02 * Math.cos(Math.PI * sg) * Math.sin(t * 3.1) + 0.012 * Math.cos(2 * Math.PI * sg) * Math.sin(t * 4.3 + 1)
            const th = Math.PI + sg * Math.PI * 2
            const rr = rL * (1 + 0.045 * Math.sin(3 * th + t * 2.4))
            const lx = S.c1x + rr * Math.cos(th)
            const ly = y0 + rr * Math.sin(th)
            loopPts[j * 3] = ox + (lx - ox) * close
            loopPts[j * 3 + 1] = oy + (ly - oy) * close
            loopPts[j * 3 + 2] = 0.02 * Math.sin(th * 2 + t) * close
          }
          loop.current.update()
          loop.current.material.uniforms.uOpacity.value = copiesOp
        }
      }
      // copy 2: an open string whose ends stay on two sheets (free to slide within them)
      if (open.current) {
        const on = copiesOp > 0.002
        open.current.group.visible = on
        if (on) {
          const spanF = ss(0.12, 0.22, g6)
          const half = (S.layout.L6 / 2) * (1 - spanF) + 0.62 * s6 * spanF
          for (let j = 0; j < OPENN; j++) {
            const sg = j / (OPENN - 1)
            openPts[j * 3] = S.c2x + (sg - 0.5) * 2 * half
            openPts[j * 3 + 1] =
              y0 + 0.14 * s6 * spanF * Math.cos(Math.PI * sg) * Math.cos(om * t + 0.3) + 0.05 * s6 * Math.cos(2 * Math.PI * sg) * Math.cos(2 * om * t + 1.2)
            openPts[j * 3 + 2] = 0.08 * s6 * spanF * Math.cos(Math.PI * sg) * Math.sin(om * t + 0.3)
          }
          open.current.update()
          open.current.material.uniforms.uOpacity.value = copiesOp
        }
      }

      hair.end()
    },
    { priority: -2 },
  )

  return (
    <>
      <Hairlines ref={H} capacity={4096} renderOrder={10} />
      <GlowPoints
        ref={beads}
        positions={beadPos}
        sizes={beadSz}
        alphas={beadA}
        color={COLORS.filament}
        sharpness={0.55}
        intensity={1.6}
        minPixels={2}
        maxPixels={40}
        visible={false}
      />
      <GlowPoints
        ref={motes}
        positions={motePos}
        sizes={moteSz}
        alphas={moteA}
        color={COLORS.field}
        intensity={1.1}
        minPixels={0.8}
        maxPixels={8}
        visible={false}
      />
      {Array.from({ length: 5 }, (_, i) => (
        <GlowPoint
          key={`p${i}`}
          ref={(p) => {
            pts.current[i] = p
          }}
          size={0.2}
          minPixels={1.5}
          color={COLORS.ink}
          coreColor="#FFFFFF"
          intensity={0}
          visible={false}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={`d${i}`}
          ref={(m) => {
            discs.current[i] = m
            if (m) m.raycast = () => {}
          }}
          geometry={discGeo}
          material={discMats[i]}
          renderOrder={5}
          frustumCulled={false}
          visible={false}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Filament
          key={`m${i}`}
          ref={(api) => {
            minis.current[i] = api
          }}
          points={miniPts[i]}
          count={MINI}
          width={0.035}
          minPixels={0.8}
          coreFraction={0.16}
          beads
          renderOrder={6}
          depthTest={false}
          visible={false}
        />
      ))}
      <Filament
        ref={same}
        points={samePts}
        count={SAMEN}
        width={0.018}
        minPixels={0.6}
        coreFraction={0.25}
        intensity={0.9}
        renderOrder={6}
        depthTest={false}
        visible={false}
      />
      <Filament ref={loop} points={loopPts} count={LOOPN} width={0.06} minPixels={0.9} coreFraction={0.16} visible={false} />
      <Filament ref={open} points={openPts} count={OPENN} width={0.06} minPixels={0.9} coreFraction={0.16} beads visible={false} />
    </>
  )
}
