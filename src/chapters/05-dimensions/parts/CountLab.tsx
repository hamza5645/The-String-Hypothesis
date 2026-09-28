import { useMemo, useRef } from 'react'
import { COLORS, GlowPoint, GlowPoints, useChapterFrame, type GlowPointApi, type GlowPointsApi } from '@/gl'
import { clamp, damp, smoothstep } from '@/core/math'
import { TI } from '../constants'
import { HairLines, C_FIELD, C_INK, C_INK2, C_INK3, sg, circle, type HairLinesApi } from '../gl/HairLines'
import { Hud } from '../gl/Hud'
import type { LabelLayer } from '../gl/labels'
import { useDim } from '../store'
import { hpx, hx, hy, type Timeline } from '../timeline'

/*
 * Lab · COUNT station (content pack model: Gauss's law, Ehrenfest 1917 — faithful physics).
 *  F(r)/F(1) = r^−(D−1): flux through a (D−1)-sphere of area ∝ r^(D−1) is conserved.
 *  Field lines: D=1 two arrows · D=2 16 lines in the plane · D=3 64 lines on a Fibonacci sphere · D=4 none.
 *  Probe: ring (D=2) / sphere (D=3) at the chosen distance: the same lines spread over a bigger boundary.
 *  Orbit: planar velocity Verlet, a = −r̂/r^(D−1) (GM = 1), dt = 0.004, 8 substeps/frame (16 at D = 4),
 *    r₀ = 1, v₀ = 1.03·√(1/r₀^(D−2)); reset 1.5 s after r < 0.1 ("fell in") or r > 6 ("escaped").
 *  Visitor: a unit ball crossing along the unseen axis at 0.4/s; cross-section ρ = √(1 − z²).
 */

const LINE_R = 2.7 // display radius of field lines
const DISP = 0.36 // display units per model length unit (probe distance 0.5–8 → 0.18–2.9)
const ORB = 1.15 // display units per orbit length unit
const TRAIL = 900

export function CountLab({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const wl = useRef<HairLinesApi>(null)
  const hl = useRef<HairLinesApi>(null)
  const mass = useRef<GlowPointApi>(null)
  const planet = useRef<GlowPointApi>(null)
  const dots = useRef<GlowPointsApi>(null)
  const fib = useMemo(() => {
    const n = 64
    const a = new Float32Array(n * 3)
    const ga = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * (i + 0.5)) / n
      const r = Math.sqrt(1 - y * y)
      a[i * 3] = r * Math.cos(ga * i)
      a[i * 3 + 1] = y
      a[i * 3 + 2] = r * Math.sin(ga * i)
    }
    return a
  }, [])
  const dotPos = useMemo(() => new Float32Array(64 * 3), [])
  const dotAlpha = useMemo(() => new Float32Array(64), [])
  const orbit = useMemo(
    () => ({
      x: 1,
      y: 0,
      vx: 0,
      vy: 1.03,
      D: -1,
      seq: -1,
      on: false,
      stopT: -1,
      trail: new Float32Array(TRAIL * 2),
      head: 0,
      len: 0,
      acc: 0,
      static: false,
    }),
    [],
  )
  const vis = useMemo(() => ({ req: useDim.getState().visitorReq, t0: -100, D: 3, w: 0, dW: [0, 0, 0, 0, 0] }), [])
  const L = useMemo(
    () => ({
      none: labels.make({ tone: 'ink2', align: 'below', cls: 'dim-count__l', text: 'no room to move' }),
      draw: labels.make({ tone: 'ink2', align: 'center', cls: 'dim-count__l', text: 'four large directions · can’t draw this' }),
      pT: labels.make({ tone: 'dim', align: 'left', cls: 'dim-plot__l', text: 'FORCE ÷ FORCE AT r = 1' }),
      pX: labels.make({ tone: 'dim', align: 'below', cls: 'dim-plot__l', text: 'DISTANCE r · 0.5 → 8 (LOG)' }),
      pS: labels.make({ tone: 'ink', align: 'left', cls: 'dim-plot__l', text: '' }),
      pM: labels.make({ tone: 'dim', align: 'left', cls: 'dim-plot__l', text: 'MEASURED: 1/r²' }),
      probe: labels.make({ tone: 'field', align: 'left', cls: 'dim-plot__l', text: '' }),
      vis: labels.make({ tone: 'dim', align: 'below', cls: 'dim-count__l', text: '' }),
    }),
    [labels],
  )

  const resetOrbit = (D: number) => {
    orbit.x = 1
    orbit.y = 0
    orbit.vx = 0
    orbit.vy = 1.03 * Math.sqrt(1 / Math.pow(1, D - 2))
    orbit.D = D
    orbit.len = 0
    orbit.head = 0
    orbit.stopT = -1
    orbit.acc = 0
  }
  const accel = (x: number, y: number, D: number, out: { ax: number; ay: number }) => {
    const r = Math.hypot(x, y)
    const f = 1 / Math.pow(r, D - 1)
    out.ax = (-x / r) * f
    out.ay = (-y / r) * f
  }
  const A = useMemo(() => ({ ax: 0, ay: 0 }), [])
  const step = (D: number, dt: number) => {
    accel(orbit.x, orbit.y, D, A)
    const ax0 = A.ax
    const ay0 = A.ay
    orbit.x += orbit.vx * dt + 0.5 * ax0 * dt * dt
    orbit.y += orbit.vy * dt + 0.5 * ay0 * dt * dt
    accel(orbit.x, orbit.y, D, A)
    orbit.vx += 0.5 * (ax0 + A.ax) * dt
    orbit.vy += 0.5 * (ay0 + A.ay) * dt
  }
  const pushTrail = () => {
    orbit.trail[orbit.head * 2] = orbit.x
    orbit.trail[orbit.head * 2 + 1] = orbit.y
    orbit.head = (orbit.head + 1) % TRAIL
    orbit.len = Math.min(TRAIL, orbit.len + 1)
  }

  useChapterFrame((f) => {
    const W = wl.current
    const Hh = hl.current
    const M = mass.current
    const Pl = planet.current
    const Dt = dots.current
    if (!W || !Hh || !M || !Pl || !Dt) return
    W.begin()
    Hh.begin()
    const T = tl.T
    const lab = tl.lab
    const target = tl.inLab && lab.station === 'count' ? 1 : 0
    vis.w = f.dt === 0 ? target : damp(vis.w, target, 5, f.dt)
    const w = vis.w * smoothstep(TI.lab - 0.02, TI.lab + 0.08, T) * (1 - smoothstep(TI.exit - 0.02, TI.exit + 0.1, T))
    Object.values(L).forEach((l) => l.op(0))
    if (w <= 0.001) {
      M.visible = false
      Pl.visible = false
      Dt.visible = false
      W.end()
      Hh.end()
      return
    }
    const D = lab.D
    // per-dimension cross-fade weights (so changing D morphs rather than jumps)
    for (let d = 0; d <= 4; d++) vis.dW[d] = f.dt === 0 ? (d === D ? 1 : 0) : damp(vis.dW[d], d === D ? 1 : 0, 6, f.dt)
    M.visible = true
    M.material.uniforms.uIntensity.value = 1.1 * w

    // visitor
    if (lab.visitorReq !== vis.req) {
      vis.req = lab.visitorReq
      if (D >= 1 && D <= 3) {
        vis.t0 = tl.t
        vis.D = D
        useDim.setState({ visitorOn: true })
      }
    }
    const vt = tl.t - vis.t0
    const vOn = vt >= 0 && vt <= 6 && vis.D === D
    if (!vOn && useDim.getState().visitorOn && vt > 6) useDim.setState({ visitorOn: false })
    const fieldDim = vOn ? 0.3 : 1

    const rProbe = lab.dist * DISP
    const F = C_FIELD
    // ── field lines per D ──
    // D = 1: a line with two inward arrows
    const w1 = vis.dW[1] * w
    if (w1 > 0.002) {
      sg(W, -LINE_R - 0.4, 0, 0, LINE_R + 0.4, 0, 0, F, 0.45 * w1, 1)
      for (const sgn of [-1, 1]) {
        const a = 0.85 * w1 * fieldDim
        sg(W, sgn * LINE_R, 0, 0, sgn * 0.14, 0, 0, F, a, 1.6)
        const hx0 = sgn * 0.9
        sg(W, hx0, 0, 0, hx0 + sgn * 0.14, 0.07, 0, F, a, 1.6)
        sg(W, hx0, 0, 0, hx0 + sgn * 0.14, -0.07, 0, F, a, 1.6)
        // probe points at ±r
        sg(W, sgn * rProbe, -0.12, 0, sgn * rProbe, 0.12, 0, F, 0.9 * w1, 2)
      }
    }
    // D = 2: 16 radial lines in the plane, a faint plane grid, a probe ring
    const w2 = vis.dW[2] * w
    if (w2 > 0.002) {
      for (let i = -3; i <= 3; i++) {
        sg(W, i, -3, 0, i, 3, 0, F, 0.07 * w2, 1)
        sg(W, -3, i, 0, 3, i, 0, F, 0.07 * w2, 1)
      }
      for (let i = 0; i < 16; i++) {
        const th = (i / 16) * Math.PI * 2
        const c = Math.cos(th)
        const s = Math.sin(th)
        const a = 0.6 * w2 * fieldDim
        sg(W, c * LINE_R, s * LINE_R, 0, c * 0.14, s * 0.14, 0, F, a, 1.1)
        const m = 1.25
        sg(W, c * m, s * m, 0, c * (m + 0.12) - s * 0.06, s * (m + 0.12) + c * 0.06, 0, F, a, 1.1)
        sg(W, c * m, s * m, 0, c * (m + 0.12) + s * 0.06, s * (m + 0.12) - c * 0.06, 0, F, a, 1.1)
      }
      circle(W, 0, 0, 0, rProbe, 1, 0, 0, 0, 1, 0, 96, F, 0.9 * w2, 1.4)
    }
    // D = 3 (and fading for 4): 64 lines on a Fibonacci sphere, a probe sphere
    const w3 = (vis.dW[3] + 0.35 * vis.dW[4]) * w
    Dt.visible = vis.dW[3] * w > 0.01
    if (w3 > 0.002) {
      const a = 0.42 * w3 * fieldDim * (1 - 0.8 * vis.dW[4])
      for (let i = 0; i < 64; i++) {
        const x = fib[i * 3]
        const y = fib[i * 3 + 1]
        const z = fib[i * 3 + 2]
        // lines fade outward: the same flux, spread over a bigger sphere
        sg(W, x * 0.14, y * 0.14, z * 0.14, x * 1.1, y * 1.1, z * 1.1, F, a, 1)
        sg(W, x * 1.1, y * 1.1, z * 1.1, x * LINE_R, y * LINE_R, z * LINE_R, F, a * 0.55, 1)
        dotPos[i * 3] = x * rProbe
        dotPos[i * 3 + 1] = y * rProbe
        dotPos[i * 3 + 2] = z * rProbe
        dotAlpha[i] = vis.dW[3] * w
      }
      Dt.geometry.getAttribute('position').needsUpdate = true
      Dt.geometry.getAttribute('aAlpha').needsUpdate = true
      const pa = 0.5 * vis.dW[3] * w
      circle(W, 0, 0, 0, rProbe, 1, 0, 0, 0, 1, 0, 96, F, pa, 1.2)
      circle(W, 0, 0, 0, rProbe, 1, 0, 0, 0, 0, 1, 96, F, pa * 0.7, 1)
      circle(W, 0, 0, 0, rProbe, 0, 0, 1, 0, 1, 0, 96, F, pa * 0.7, 1)
      for (const yy of [-0.6, 0.6]) circle(W, 0, yy * rProbe, 0, rProbe * 0.8, 1, 0, 0, 0, 0, 1, 72, F, pa * 0.45, 1)
    }
    if (vis.dW[4] * w > 0.01) L.draw.hud(hx(tl, tl.portrait ? 0.5 : 0.42), hy(tl, tl.portrait ? 0.3 : 0.5)).op(vis.dW[4] * w)
    if (vis.dW[0] * w > 0.01) L.none.at(0, -0.25, 0).op(vis.dW[0] * w)
    if (D >= 1 && D <= 3) L.probe.text(`r = ${lab.dist.toFixed(2)}`).at(rProbe * 0.72 + 0.05, rProbe * 0.72 + 0.05, 0).op(0.9 * w)

    // ── visitor slice ──
    if (vOn) {
      const z = -1.2 + 0.4 * vt
      const rho = Math.abs(z) < 1 ? Math.sqrt(1 - z * z) : 0
      const S = 1.3
      const va = w * smoothstep(0, 0.3, vt) * (1 - smoothstep(5.6, 6, vt))
      if (D === 1) {
        // a disk crossing Lineland (it lives in the plane; Lineland sees only the segment)
        circle(W, 0, z * S, 0, S, 1, 0, 0, 0, 1, 0, 72, F, 0.3 * va, 1, 4)
        if (rho > 0) sg(W, -rho * S, 0, 0, rho * S, 0, 0, C_INK, va, 3)
      } else if (D === 2) {
        // a sphere crossing Flatland (its cross-section is a circle in the plane)
        circle(W, 0, 0, z * S, S, 1, 0, 0, 0, 1, 0, 72, F, 0.25 * va, 1, 4)
        circle(W, 0, 0, z * S, S, 1, 0, 0, 0, 0, 1, 72, F, 0.25 * va, 1, 4)
        circle(W, 0, 0, z * S, S, 0, 0, 1, 0, 1, 0, 72, F, 0.25 * va, 1, 4)
        if (rho > 0) circle(W, 0, 0, 0, rho * S, 1, 0, 0, 0, 1, 0, 96, C_INK, va, 2.2)
      } else if (D === 3 && rho > 0) {
        // a 4D ball crossing our space: a sphere inflating from nothing, then deflating (~ANALOGY)
        const r = rho * S
        for (let k = 0; k < 5; k++) {
          const lat = -0.8 + 0.4 * k
          circle(W, 0, lat * r, 0, r * Math.sqrt(1 - lat * lat), 1, 0, 0, 0, 0, 1, 72, C_INK, 0.7 * va, 1.2)
        }
        for (let k = 0; k < 4; k++) {
          const th = (k / 4) * Math.PI
          circle(W, 0, 0, 0, r, Math.cos(th), 0, Math.sin(th), 0, 1, 0, 72, C_INK, 0.55 * va, 1)
        }
      }
      L.vis.text(`slice radius ρ = √(1 − z²) = ${rho.toFixed(2)}`).at(0, -1.55, 0).op(va)
    }

    // ── orbit ──
    const canOrbit = lab.orbit && D >= 2 && D <= 4
    if (canOrbit) {
      if (orbit.seq !== lab.orbitSeq || orbit.D !== D) {
        orbit.seq = lab.orbitSeq
        resetOrbit(D)
        orbit.static = false
        if (tl.reduced) {
          // reduced motion: precompute and show the whole path
          orbit.static = true
          for (let i = 0; i < 6000; i++) {
            step(D, 0.004)
            if (i % 8 === 0) pushTrail()
            const r = Math.hypot(orbit.x, orbit.y)
            if (r < 0.1 || r > 6) break
          }
        }
      }
      if (!orbit.static && f.dt > 0) {
        const r = Math.hypot(orbit.x, orbit.y)
        if (orbit.stopT < 0) {
          // (playback speed only — the integration step stays dt = 0.004: 8 substeps show a D = 2 rosette
          // forming within a few seconds; 16 at D = 4, as the pack recommends, so the escape takes ~6 s)
          const sub = D === 4 ? 16 : 8
          for (let i = 0; i < sub; i++) step(D, 0.004)
          pushTrail()
          const r2 = Math.hypot(orbit.x, orbit.y)
          if (r2 < 0.1 || r2 > 6) {
            orbit.stopT = tl.t
            useDim.setState({ orbitNote: r2 < 0.1 ? 'fell' : 'escaped' })
          }
        } else if (tl.t - orbit.stopT > 1.5) {
          resetOrbit(D)
          useDim.setState({ orbitNote: '' })
        }
        void r
      }
      // trail
      const n = orbit.len
      let px = 0
      let py = 0
      for (let i = 0; i < n; i++) {
        const idx = (orbit.head - n + i + TRAIL) % TRAIL
        const x = orbit.trail[idx * 2] * ORB
        const y = orbit.trail[idx * 2 + 1] * ORB
        if (i > 0) {
          const age = orbit.static ? 1 : i / n
          sg(W, px, py, 0, x, y, 0, C_INK2, (0.15 + 0.7 * age) * w, 1.2)
        }
        px = x
        py = y
      }
      // the starting circle r = 1 (dashed): the few-percent swings of a D = 2 / 3 orbit read against it
      circle(W, 0, 0, 0, ORB, 1, 0, 0, 0, 1, 0, 96, C_INK3, 0.9 * w, 1, 5)
      Pl.visible = !orbit.static || n > 0
      Pl.position.set(orbit.x * ORB, orbit.y * ORB, 0)
      Pl.material.uniforms.uIntensity.value = 1.1 * w
    } else {
      Pl.visible = false
      if (orbit.seq !== lab.orbitSeq) orbit.seq = -2
      orbit.D = -1
    }

    // ── force plot (HUD): F/F(1) = r^−(D−1), log–log ──
    const port = tl.portrait
    const u = hpx(tl)
    const X0 = hx(tl, port ? 0.2 : 0.05)
    const X1 = hx(tl, port ? 0.6 : 0.23)
    const Y0 = hy(tl, port ? 0.45 : 0.4)
    const Y1 = hy(tl, port ? 0.355 : 0.14)
    const lxA = Math.log10(0.5)
    const lxB = Math.log10(8)
    const X = (r: number) => X0 + ((Math.log10(r) - lxA) / (lxB - lxA)) * (X1 - X0)
    const Y = (Fv: number) => Y0 + ((clamp(Math.log10(Fv), -3, 1) + 3) / 4) * (Y1 - Y0)
    const pa = w * (D === 0 ? 0.35 : 1)
    sg(Hh, X0, Y0, 0, X1, Y0, 0, F, 0.6 * pa, 1)
    sg(Hh, X0, Y0, 0, X0, Y1, 0, F, 0.6 * pa, 1)
    const x1 = X(1)
    sg(Hh, x1, Y0, 0, x1, Y0 - 4 * u, 0, F, 0.6 * pa, 1)
    // measured reference: slope −2
    sg(Hh, X(0.5), Y(4), 0, X(8), Y(1 / 64), 0, C_INK3, 0.9 * pa, 1, 5)
    if (D >= 1 && D <= 4) {
      const p = D - 1
      const n = 24
      let ox = 0
      let oy = 0
      for (let i = 0; i <= n; i++) {
        const r = Math.pow(10, lxA + ((lxB - lxA) * i) / n)
        const x = X(r)
        const y = Y(Math.pow(r, -p))
        if (i > 0) sg(Hh, ox, oy, 0, x, y, 0, C_INK, 0.95 * w, 1.5)
        ox = x
        oy = y
      }
      // cursor at the probe distance
      const cx = X(lab.dist)
      const cy = Y(Math.pow(lab.dist, -p))
      sg(Hh, cx, Y0, 0, cx, cy, 0, C_FIELD, 0.6 * w, 1, 3)
      circle(Hh, cx, cy, 0, 3.5 * u, 1, 0, 0, 0, 1, 0, 16, C_INK, w, 1.4)
      L.pS.text(`SLOPE −(D − 1) = ${p === 0 ? '0' : '−' + p}`).hud(X1 + 4 * u, Y(Math.pow(8, -p))).op(0.95 * w)
    }
    L.pT.hud(X0 + 4 * u, Y1 + 10 * u).op(0.8 * pa)
    L.pX.hud(0.5 * (X0 + X1), Y0 - 6 * u).op(0.8 * pa)
    L.pM.hud(X(8) + 4 * u, Y(1 / 64) - 10 * u).op(0.8 * pa * (D === 3 ? 0 : 1))

    W.end()
    Hh.end()
  })

  return (
    <>
      <HairLines ref={wl} capacity={1600} />
      <GlowPoint ref={mass} size={0.22} minPixels={2.4} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <GlowPoint ref={planet} size={0.09} minPixels={2} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
      <GlowPoints ref={dots} positions={dotPos} alphas={dotAlpha} size={0.05} minPixels={2.2} maxPixels={4} intensity={1.2} color={COLORS.ink} visible={false} />
      <Hud>
        <HairLines ref={hl} capacity={120} />
      </Hud>
    </>
  )
}

export const countCamera = (D: number) => {
  // az, polar, distance per D (the plane is seen from above for Flatland; space from an oblique angle)
  if (D <= 1) return [0, Math.PI / 2, 9.5] as const
  if (D === 2) return [0.25, 1.0, 9.5] as const
  return [0.55, 1.2, 10] as const
}
