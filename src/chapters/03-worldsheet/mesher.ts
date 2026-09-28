/*
 * Implicit-surface mesher for the two-Gaussian worldsheets (pants, Beat 5 handle).
 *
 *   Φ(x, y, t) = e^{−y²}·[e^{−(x−c(t))²} + e^{−(x+c(t))²}],   surface Φ = L
 *
 * Naive surface nets on a regular grid (one vertex per crossed cell, one quad per crossed edge), then each
 * vertex is projected onto the exact surface with Newton steps along ∇Φ and given the analytic normal.
 * The field is separable (e^{−y²} × G(x, t)), so sampling the grid is one multiply per sample.
 * Output is in world axes: X = x, Y = t (ct), Z = y. Pure TS, no three.js.
 */
import { L } from './model'

export interface ImplicitSpec {
  c: (t: number) => number
  dc: (t: number) => number
  x0: number
  x1: number
  y0: number
  y1: number
  t0: number
  t1: number
  cell: number
}

export interface MeshData {
  positions: Float32Array
  normals: Float32Array
  index: Uint32Array
}

// cube corners as (di, dj, dk) and the 12 edges between them
const CX = [0, 1, 0, 1, 0, 1, 0, 1]
const CY = [0, 0, 1, 1, 0, 0, 1, 1]
const CT = [0, 0, 0, 0, 1, 1, 1, 1]
const EA = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3]
const EB = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7]

export function meshTwoGaussians(s: ImplicitSpec): MeshData {
  const nx = Math.round((s.x1 - s.x0) / s.cell) + 1
  const ny = Math.round((s.y1 - s.y0) / s.cell) + 1
  const nt = Math.round((s.t1 - s.t0) / s.cell) + 1
  const dx = (s.x1 - s.x0) / (nx - 1)
  const dy = (s.y1 - s.y0) / (ny - 1)
  const dt = (s.t1 - s.t0) / (nt - 1)
  const sxy = nx * ny
  const N = sxy * nt

  // separable sampling: v = e^{−y²}·G(x, t) − L
  const ey = new Float32Array(ny)
  for (let j = 0; j < ny; j++) {
    const y = s.y0 + j * dy
    ey[j] = Math.exp(-y * y)
  }
  const G = new Float32Array(nx * nt)
  for (let k = 0; k < nt; k++) {
    const c = s.c(s.t0 + k * dt)
    for (let i = 0; i < nx; i++) {
      const x = s.x0 + i * dx
      G[k * nx + i] = Math.exp(-(x - c) * (x - c)) + Math.exp(-(x + c) * (x + c))
    }
  }
  const v = new Float32Array(N)
  const S = new Uint8Array(N)
  for (let k = 0; k < nt; k++)
    for (let j = 0; j < ny; j++) {
      const e = ey[j]
      const row = (k * ny + j) * nx
      const g = k * nx
      for (let i = 0; i < nx; i++) {
        const val = e * G[g + i] - L
        v[row + i] = val
        S[row + i] = val > 0 ? 1 : 0
      }
    }

  const cx = nx - 1
  const cy = ny - 1
  const cellVert = new Int32Array(cx * cy * (nt - 1)).fill(-1)
  let cap = 32768
  let pos = new Float32Array(cap * 3)
  let nrm = new Float32Array(cap * 3)
  let nv = 0
  const off = [0, 1, nx, nx + 1, sxy, sxy + 1, sxy + nx, sxy + nx + 1]
  const gr = [0, 0, 0]

  const grad = (x: number, y: number, t: number) => {
    const c = s.c(t)
    const d = s.dc(t)
    const e0 = Math.exp(-y * y)
    const e1 = e0 * Math.exp(-(x - c) * (x - c))
    const e2 = e0 * Math.exp(-(x + c) * (x + c))
    gr[0] = -2 * (x - c) * e1 - 2 * (x + c) * e2
    gr[1] = -2 * y * (e1 + e2)
    gr[2] = 2 * d * ((x - c) * e1 - (x + c) * e2)
    return e1 + e2 - L
  }

  for (let k = 0; k < nt - 1; k++)
    for (let j = 0; j < cy; j++) {
      const rowBase = (k * ny + j) * nx
      for (let i = 0; i < cx; i++) {
        const b = rowBase + i
        const sum = S[b] + S[b + 1] + S[b + nx] + S[b + nx + 1] + S[b + sxy] + S[b + sxy + 1] + S[b + sxy + nx] + S[b + sxy + nx + 1]
        if (sum === 0 || sum === 8) continue
        let ax = 0
        let ay = 0
        let at = 0
        let n = 0
        for (let e = 0; e < 12; e++) {
          const a = EA[e]
          const bb = EB[e]
          const va = v[b + off[a]]
          const vb = v[b + off[bb]]
          if (va > 0 === vb > 0) continue
          const f = va / (va - vb)
          ax += CX[a] + (CX[bb] - CX[a]) * f
          ay += CY[a] + (CY[bb] - CY[a]) * f
          at += CT[a] + (CT[bb] - CT[a]) * f
          n++
        }
        let x = s.x0 + (i + ax / n) * dx
        let y = s.y0 + (j + ay / n) * dy
        let t = s.t0 + (k + at / n) * dt
        // project onto Φ = L along the gradient (bounded steps)
        for (let it = 0; it < 3; it++) {
          const f = grad(x, y, t)
          const g2 = gr[0] * gr[0] + gr[1] * gr[1] + gr[2] * gr[2]
          if (g2 < 1e-12) break
          const gl = Math.sqrt(g2)
          const step = Math.max(-0.5 * s.cell, Math.min(0.5 * s.cell, f / gl)) / gl
          x -= step * gr[0]
          y -= step * gr[1]
          t -= step * gr[2]
        }
        grad(x, y, t)
        const gl = Math.hypot(gr[0], gr[1], gr[2]) || 1
        if (nv >= cap) {
          cap *= 2
          const p2 = new Float32Array(cap * 3)
          p2.set(pos)
          pos = p2
          const n2 = new Float32Array(cap * 3)
          n2.set(nrm)
          nrm = n2
        }
        const o = nv * 3
        pos[o] = x // world axes: X = x, Y = t, Z = y
        pos[o + 1] = t
        pos[o + 2] = y
        nrm[o] = -gr[0] / gl // outward = −∇Φ
        nrm[o + 1] = -gr[2] / gl
        nrm[o + 2] = -gr[1] / gl
        cellVert[(k * cy + j) * cx + i] = nv++
      }
    }

  let icap = nv * 7
  let idx = new Uint32Array(icap)
  let ni = 0
  const C = (i: number, j: number, k: number) => cellVert[(k * cy + j) * cx + i]
  const quad = (a: number, b: number, c: number, d: number, flip: number) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return
    if (ni + 6 > icap) {
      icap *= 2
      const i2 = new Uint32Array(icap)
      i2.set(idx)
      idx = i2
    }
    if (flip) {
      idx[ni++] = a
      idx[ni++] = c
      idx[ni++] = b
      idx[ni++] = a
      idx[ni++] = d
      idx[ni++] = c
    } else {
      idx[ni++] = a
      idx[ni++] = b
      idx[ni++] = c
      idx[ni++] = a
      idx[ni++] = c
      idx[ni++] = d
    }
  }
  for (let k = 1; k < nt - 1; k++)
    for (let j = 1; j < ny - 1; j++) {
      const rowBase = (k * ny + j) * nx
      for (let i = 1; i < nx - 1; i++) {
        const b = rowBase + i
        const s0 = S[b]
        if (S[b + 1] !== s0) quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k), s0)
        if (S[b + nx] !== s0) quad(C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1), s0)
        if (S[b + sxy] !== s0) quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k), s0)
      }
    }

  return { positions: pos.slice(0, nv * 3), normals: nrm.slice(0, nv * 3), index: idx.slice(0, ni) }
}
