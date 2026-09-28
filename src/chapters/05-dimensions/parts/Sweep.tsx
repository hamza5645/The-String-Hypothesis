import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, GlowPoint, useChapterFrame, type GlowPointApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { lerp, smoothstep } from '@/core/math'
import { TI } from '../constants'
import { sweepPhase } from '../model'
import { HairLines, C_FIELD, C_INK, sg, type HairLinesApi } from '../gl/HairLines'
import type { LabelLayer } from '../gl/labels'
import type { Timeline } from '../timeline'
import { noteSpot } from './notes'

/*
 * Beat 1 · Counting directions (content pack). Driven by s = the sweep step's progress:
 *  0.00–0.20  the point of light (H0) is dragged along +x: a 2-unit Field segment, ticks every 0.25,
 *             two Lineland creatures (0.15-unit Ink segments) that can never pass each other.
 *  0.20–0.45  the segment sweeps along +y into a square (grid at 10%); a Flatlander wanders inside.
 *  0.45–0.70  the square sweeps along +z into a wireframe cube (camera yaw 0 → 35°, pitch 0 → 15°).
 *  0.70–1.00  the cube "sweeps" into a tesseract drawn as its perspective projection:
 *             16 vertices (±1,±1,±1,±1), 32 edges, x–w rotation φ = π·sub, x' = x·d/(d − w), d = 3.
 */

const D4 = 3

export function Sweep({ tl, labels }: { tl: Timeline; labels: LabelLayer }) {
  const lines = useRef<HairLinesApi>(null)
  const point = useRef<GlowPointApi>(null)
  const P = useMemo(() => new Float32Array(16 * 3), [])
  const W = useMemo(() => new Float32Array(16), [])
  const EDGES = useMemo(() => {
    const e: [number, number][] = []
    for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) {
      const j = i ^ (1 << b)
      if (i < j) e.push([i, j])
    }
    return e
  }, [])
  const L = useMemo(
    () => ({
      key: labels.make({ tone: 'dim', align: 'left', cls: 'dim-counter__k', text: 'DIRECTIONS' }),
      val: labels.make({ tone: 'ink', align: 'left', cls: 'dim-counter__v', text: '1' }),
      line: labels.make({ tone: 'dim', align: 'below', text: 'LINELAND' }),
      flat: labels.make({ tone: 'dim', align: 'below', text: 'FLATLAND · ABBOTT, 1884' }),
      space: labels.make({ tone: 'dim', align: 'below', text: 'SPACELAND · OURS' }),
      note: labels.make({ tone: 'dim', align: 'left', cls: 'dim-note', chip: 'analogy', text: 'A 3D shadow of a 4D cube, not the cube.' }),
    }),
    [labels],
  )

  useChapterFrame(() => {
    const Ln = lines.current
    const pt = point.current
    if (!Ln || !pt) return
    Ln.begin()
    const T = tl.T
    const on = smoothstep(TI.sweep - 0.03, TI.sweep + 0.02, T) * (1 - smoothstep(TI.cable - 0.03, TI.cable + 0.12, T))
    if (on <= 0.001) {
      Ln.end()
      pt.visible = false
      Object.values(L).forEach((l) => l.op(0))
      return
    }
    const s = T < TI.sweep ? 0 : T >= TI.cable ? 1 : tl.u.sweep
    const ph = sweepPhase(s)
    const t = tl.t * (tl.amb || 0)
    const shrink = 1 - 0.75 * smoothstep(TI.cable - 0.03, TI.cable + 0.12, T) // "the tesseract shrinks away"
    const k = shrink
    const F = C_FIELD
    const ink = C_INK

    // ── brush point ──
    const glide = smoothstep(0, 0.05, s)
    let bx = lerp(0, -1, glide)
    let by = lerp(0, -1, glide)
    let bz = lerp(0, -1, glide)
    if (s >= 0.05) {
      bx = lerp(-1, 1, ph.a)
      by = lerp(-1, 1, ph.b)
      bz = lerp(-1, 1, ph.c)
    }
    const ptA = (1 - smoothstep(0.69, 0.76, s)) * on
    pt.visible = ptA > 0.002
    pt.position.set(bx, by, bz)
    pt.material.uniforms.uIntensity.value = HANDOFF.H0.intensity * ptA

    // ── phase A: the segment ──
    const xA = s < 0.05 ? -1 : bx
    const segA = on * (s < 0.7 ? 1 : 0)
    if (segA > 0 && ph.d <= 0) {
      const y0 = -1
      const z0 = -1
      // bottom edge (the first segment), stays as the square/cube's first edge
      sg(Ln, -1, y0, z0, xA, y0, z0, F, 0.8 * segA, 1.2)
      // ticks every 0.25 (become grid lines when swept)
      for (let i = 0; i <= 8; i++) {
        const x = -1 + i * 0.25
        if (x > xA + 1e-6) break
        const len = i % 4 === 0 ? 0.09 : 0.055
        if (ph.b <= 0.001) sg(Ln, x, y0 - len, z0, x, y0 + len, z0, F, 0.6 * segA, 1)
      }
      // Lineland creatures: two short ink segments that slide but can never pass each other
      const cA = on * smoothstep(0.12, 0.17, s) * (1 - smoothstep(0.26, 0.33, s))
      if (cA > 0) {
        const x1 = -0.35 + 0.28 * Math.sin(0.8 * t)
        const x2 = 0.35 + 0.28 * Math.sin(0.8 * t + 2.4)
        sg(Ln, x1 - 0.075, y0, z0, x1 + 0.075, y0, z0, ink, cA, 3)
        sg(Ln, x2 - 0.075, y0, z0, x2 + 0.075, y0, z0, ink, cA, 3)
      }
      L.line.at(0, -1.2, -1).op(on * smoothstep(0.1, 0.16, s) * (1 - smoothstep(0.24, 0.32, s)))

      // ── phase B: sweep along +y ──
      if (ph.b > 0) {
        const yB = bx === 1 ? by : -1
        const gridA = 0.13 * segA
        sg(Ln, -1, y0, z0, -1, yB, z0, F, 0.8 * segA, 1.2)
        sg(Ln, 1, y0, z0, 1, yB, z0, F, 0.8 * segA, 1.2)
        sg(Ln, -1, yB, z0, 1, yB, z0, F, 0.95 * segA, 1.4)
        for (let i = 1; i < 8; i++) {
          const x = -1 + i * 0.25
          sg(Ln, x, y0, z0, x, yB, z0, F, gridA * (1 - ph.c * 0.5), 1)
        }
        for (let j = 1; j < 8; j++) {
          const y = -1 + j * 0.25
          if (y > yB) break
          sg(Ln, -1, y, z0, 1, y, z0, F, gridA * (1 - ph.c * 0.5), 1)
        }
        // Flatlander: a small ink triangle wandering inside the square
        const fA = on * smoothstep(0.34, 0.4, s) * (1 - smoothstep(0.5, 0.56, s))
        if (fA > 0) {
          const fx = 0.5 * Math.sin(0.45 * t + 0.3)
          const fy = 0.42 * Math.sin(0.33 * t + 1.1)
          const dx = 0.5 * 0.45 * Math.cos(0.45 * t + 0.3)
          const dy = 0.42 * 0.33 * Math.cos(0.33 * t + 1.1)
          const ang = Math.atan2(dy, dx)
          const r = 0.11
          let px = fx + r * 1.3 * Math.cos(ang)
          let py = fy + r * 1.3 * Math.sin(ang)
          for (let v = 1; v <= 3; v++) {
            const a2 = ang + (v % 3) * ((2 * Math.PI) / 3)
            const rr = v % 3 === 0 ? r * 1.3 : r
            const qx = fx + rr * Math.cos(a2)
            const qy = fy + rr * Math.sin(a2)
            sg(Ln, px, py, z0, qx, qy, z0, ink, fA, 1.4)
            px = qx
            py = qy
          }
        }
        L.flat.at(0, -1.2, -1).op(on * smoothstep(0.3, 0.36, s) * (1 - smoothstep(0.48, 0.55, s)))
      } else L.flat.op(0)

      // ── phase C: sweep along +z ──
      if (ph.c > 0) {
        const zC = by === 1 && bx === 1 ? bz : -1
        const e = 0.85 * segA
        // front (moving) face
        sg(Ln, -1, -1, zC, 1, -1, zC, F, e, 1.3)
        sg(Ln, -1, 1, zC, 1, 1, zC, F, e, 1.3)
        sg(Ln, -1, -1, zC, -1, 1, zC, F, e, 1.3)
        sg(Ln, 1, -1, zC, 1, 1, zC, F, e, 1.3)
        // the four swept edges
        sg(Ln, -1, -1, -1, -1, -1, zC, F, e, 1.2)
        sg(Ln, 1, -1, -1, 1, -1, zC, F, e, 1.2)
        sg(Ln, -1, 1, -1, -1, 1, zC, F, e, 1.2)
        sg(Ln, 1, 1, -1, 1, 1, zC, F, e, 1.2)
        L.space.at(0, -1.25, 0).op(on * smoothstep(0.56, 0.62, s) * (1 - smoothstep(0.7, 0.75, s)))
      } else L.space.op(0)
    } else {
      L.line.op(0)
      L.flat.op(0)
      L.space.op(0)
    }

    // ── phase D: tesseract (perspective shadow of a 4D cube) ──
    if (ph.d > 0) {
      const sub = ph.d
      const sep = smoothstep(0, 0.3, sub)
      const phi = Math.PI * sub
      const c = Math.cos(phi)
      const sn = Math.sin(phi)
      for (let i = 0; i < 16; i++) {
        const x = i & 1 ? 1 : -1
        const y = i & 2 ? 1 : -1
        const z = i & 4 ? 1 : -1
        const w = (i & 8 ? 1 : -1) * sep
        const xr = x * c - w * sn
        const wr = x * sn + w * c
        const kk = (D4 / (D4 - wr)) * k
        P[i * 3] = xr * kk
        P[i * 3 + 1] = y * kk
        P[i * 3 + 2] = z * kk
        W[i] = wr
      }
      const a = on * (T >= TI.cable ? 1 - smoothstep(TI.cable, TI.cable + 0.1, T) : 1)
      for (const [i, j] of EDGES) {
        const wm = 0.5 * (W[i] + W[j])
        const al = a * (0.5 + 0.28 * wm)
        sg(Ln, P[i * 3], P[i * 3 + 1], P[i * 3 + 2], P[j * 3], P[j * 3 + 1], P[j * 3 + 2], F, al, 1.25)
      }
    }

    // ── counter & note ──
    const n = s < 0.2 ? '1' : s < 0.45 ? '2' : s < 0.7 ? '3' : '4?'
    const cOp = on * (T < TI.cable ? 1 : 1 - smoothstep(TI.cable, TI.cable + 0.08, T))
    const cx = tl.portrait ? 0.07 : 0.8
    const cy = tl.portrait ? 0.11 : 0.17
    L.key.scr(cx, cy).op(0.9 * cOp)
    L.val.text(n).scr(cx, cy + (tl.portrait ? 0.032 : 0.045)).op(cOp)
    const [nx, ny] = noteSpot(tl)
    L.note.scr(nx, ny).op(on * smoothstep(0.74, 0.8, s) * (T < TI.cable ? 1 : 1 - smoothstep(TI.cable, TI.cable + 0.06, T)))
    Ln.end()
  })

  return (
    <>
      <HairLines ref={lines} capacity={160} />
      <GlowPoint ref={point} size={HANDOFF.H0.size} minPixels={HANDOFF.H0.minPixels} intensity={0} color={COLORS.ink} coreColor="#FFFFFF" visible={false} />
    </>
  )
}

/** Sweep camera target: re-frames on the growing object's centre. */
export function sweepTarget(s: number, out: THREE.Vector3) {
  const ph = sweepPhase(s)
  const glide = smoothstep(0, 0.05, s)
  return out.set(0, lerp(0, -1, glide) + ph.b * 1, lerp(0, -1, glide) + ph.c * 1)
}
