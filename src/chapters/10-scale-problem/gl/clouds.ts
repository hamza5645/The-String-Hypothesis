/*
 * Procedural point clouds (built once). Unit conventions:
 *   zoom layers: content fits a unit-diameter disc (±0.5)
 *   galaxy / stars: light-years, centred on the galaxy centre / the Sun
 */
import { rng } from '@/core/math'

export interface Cloud {
  positions: Float32Array
  sizes: Float32Array
  alphas: Float32Array
}

const gauss = (r: () => number) => {
  let u = 0
  let v = 0
  while (u === 0) u = r()
  while (v === 0) v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function alloc(n: number): Cloud {
  return { positions: new Float32Array(n * 3), sizes: new Float32Array(n), alphas: new Float32Array(n) }
}
/** write point i (no per-point array allocation) */
function put(c: Cloud, i: number, x: number, y: number, z: number) {
  const p = c.positions
  p[i * 3] = x
  p[i * 3 + 1] = y
  p[i * 3 + 2] = z
}

/** Proton: a soft fog with three denser valence lumps (a cartoon of quarks in a sea of gluons). */
export function protonFog(n: number): Cloud {
  const r = rng(3)
  const c = alloc(n)
  const lumps = [0, 1, 2].map((k) => [0.13 * Math.cos(k * 2.094 + 0.4), 0.13 * Math.sin(k * 2.094 + 0.4)])
  for (let i = 0; i < n; i++) {
    let x: number
    let y: number
    if (i % 4 === 0) {
      const l = lumps[i % 3]
      x = l[0] + gauss(r) * 0.045
      y = l[1] + gauss(r) * 0.045
    } else {
      x = gauss(r) * 0.17
      y = gauss(r) * 0.17
    }
    put(c, i, x, y, (r() - 0.5) * 0.2)
    c.sizes[i] = 0.012 + r() * 0.012
    c.alphas[i] = (i % 4 === 0 ? 0.55 : 0.28) * (0.6 + 0.4 * r())
  }
  return c
}

/** Carbon atom: 1s² 2s² 2p² as a radial haze with a tiny nucleus (probability, not orbits). */
export function electronHaze(n: number): Cloud {
  const r = rng(5)
  const c = alloc(n)
  for (let i = 0; i < n; i++) {
    const shell = i % 3 === 0 ? 0 : 1
    // Gamma-like radial profile (r² e^(−r/a)) per shell
    const a = shell === 0 ? 0.025 : 0.085
    const rad = a * (-Math.log(r() * r() * r() + 1e-9))
    const ct = 2 * r() - 1
    const st = Math.sqrt(1 - ct * ct)
    const ph = r() * Math.PI * 2
    let x = rad * st * Math.cos(ph)
    let y = rad * st * Math.sin(ph)
    // 2p lobes: a gentle dumbbell elongation on half of the outer shell
    if (shell === 1 && i % 2 === 0) {
      x *= 1.35
      y *= 0.8
    }
    put(c, i, x, y, rad * ct)
    c.sizes[i] = 0.006 + r() * 0.006
    c.alphas[i] = 0.26 * (0.5 + 0.5 * r())
  }
  // nucleus: a handful of bright points at the centre
  for (let i = 0; i < 40; i++) {
    put(c, i, gauss(r) * 0.002, gauss(r) * 0.002, 0)
    c.sizes[i] = 0.004
    c.alphas[i] = 1
  }
  return c
}

/** A standing human, 1.7 m, as a point figure (height = 1 unit, feet at −0.5). */
export function humanFigure(n: number): Cloud {
  const r = rng(9)
  const c = alloc(n)
  // capsules [x0,y0,x1,y1,radius] in body units (height 1)
  const caps: number[][] = [
    [0, 0.395, 0, 0.395, 0.058], // head
    [0, 0.335, 0, 0.3, 0.022], // neck
    [0, 0.28, 0, 0.06, 0.075], // torso
    [-0.085, 0.27, -0.12, 0.08, 0.024], // upper arms
    [0.085, 0.27, 0.12, 0.08, 0.024],
    [-0.12, 0.08, -0.13, -0.08, 0.02], // forearms
    [0.12, 0.08, 0.13, -0.08, 0.02],
    [-0.045, 0.04, -0.06, -0.22, 0.034], // thighs
    [0.045, 0.04, 0.06, -0.22, 0.034],
    [-0.06, -0.22, -0.065, -0.47, 0.026], // shins
    [0.06, -0.22, 0.065, -0.47, 0.026],
    [-0.065, -0.49, -0.1, -0.5, 0.012], // feet
    [0.065, -0.49, 0.1, -0.5, 0.012],
  ]
  const lens = caps.map((k) => Math.hypot(k[2] - k[0], k[3] - k[1]) + k[4] * 2)
  const total = lens.reduce((a, b) => a + b, 0)
  let i = 0
  caps.forEach((k, j) => {
    const m = j === caps.length - 1 ? n - i : Math.round((lens[j] / total) * n)
    for (let q = 0; q < m && i < n; q++, i++) {
      const t = r()
      const ang = r() * Math.PI * 2
      // points on the capsule's surface (a hollow figure reads as a silhouette)
      const rr = k[4] * (0.82 + 0.18 * r())
      const x = k[0] + (k[2] - k[0]) * t + Math.cos(ang) * rr
      const y = k[1] + (k[3] - k[1]) * t + Math.sin(ang) * rr * 0.6
      put(c, i, x, y, Math.sin(ang) * rr)
      c.sizes[i] = 1e4
      c.alphas[i] = 0.55 + 0.45 * r()
    }
  })
  return c
}

/** Cosmic web: galaxies strung along filaments between clusters (points along gently curved lines). */
export function cosmicWeb(n: number): Cloud {
  const r = rng(17)
  const c = alloc(n)
  const nodes: [number, number][] = []
  for (let k = 0; k < 80; k++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 0.5
    nodes.push([Math.cos(a) * d, Math.sin(a) * d])
  }
  const edges: [number, number][] = []
  nodes.forEach((p, a) => {
    const near = nodes
      .map((q, b) => [b, Math.hypot(q[0] - p[0], q[1] - p[1])] as [number, number])
      .filter(([b]) => b !== a)
      .sort((x, y) => x[1] - y[1])
      .slice(0, 3)
    for (const [b] of near) if (a < b) edges.push([a, b])
  })
  for (let i = 0; i < n; i++) {
    let x: number
    let y: number
    if (i % 5 === 0) {
      const p = nodes[i % nodes.length]
      x = p[0] + gauss(r) * 0.012
      y = p[1] + gauss(r) * 0.012
    } else {
      const [a, b] = edges[i % edges.length]
      const t = r()
      const P = nodes[a]
      const Q = nodes[b]
      const bend = Math.sin(t * Math.PI) * 0.04 * (((a * 7 + b * 13) % 5) / 5 - 0.4)
      const nx = -(Q[1] - P[1])
      const ny = Q[0] - P[0]
      x = P[0] + (Q[0] - P[0]) * t + nx * bend + gauss(r) * 0.006
      y = P[1] + (Q[1] - P[1]) * t + ny * bend + gauss(r) * 0.006
    }
    if (x * x + y * y > 0.25) {
      x *= 0.95
      y *= 0.95
    }
    put(c, i, x, y, 0)
    c.sizes[i] = 1e4
    c.alphas[i] = (i % 5 === 0 ? 0.7 : 0.32) * (0.5 + 0.5 * r())
  }
  return c
}

/** The observable universe's disc: faint mottling (a nod to the CMB's speckle), field blue. */
export function universeMottle(n: number): Cloud {
  const r = rng(23)
  const c = alloc(n)
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 0.495
    const x = Math.cos(a) * d
    const y = Math.sin(a) * d
    const m = Math.sin(x * 31 + Math.sin(y * 17) * 2) * Math.sin(y * 27 - Math.cos(x * 13) * 2)
    put(c, i, x, y, 0)
    c.sizes[i] = 0.016
    c.alphas[i] = Math.max(0, 0.12 + 0.2 * m) * (0.6 + 0.4 * r())
  }
  return c
}

/** The Milky Way: two-armed log spiral + bar + bulge + smooth disc, in light-years (87,400 ly across). */
export function galaxy(n: number): Cloud {
  const r = rng(29)
  const c = alloc(n)
  const pitch = Math.tan((13 * Math.PI) / 180)
  const R = 43_700
  for (let i = 0; i < n; i++) {
    const kind = r()
    let x = 0
    let y = 0
    let a = 0.5
    if (kind < 0.55) {
      const arm = i % 2
      const rad = 2600 + (R - 2600) * Math.pow(r(), 0.85)
      const th = Math.log(rad / 2600) / pitch + arm * Math.PI
      const w = 900 + 0.045 * rad
      const px = rad * Math.cos(th)
      const py = rad * Math.sin(th)
      x = px + gauss(r) * w
      y = py + gauss(r) * w
      a = 0.62 * (1 - 0.5 * (rad / R))
    } else if (kind < 0.8) {
      const rad = Math.min(R, -11_000 * Math.log(r() + 1e-6))
      const th = r() * Math.PI * 2
      x = rad * Math.cos(th)
      y = rad * Math.sin(th)
      a = 0.22
    } else if (kind < 0.92) {
      const t = gauss(r) * 5200
      const s = gauss(r) * 1500
      const ba = 0.44
      x = t * Math.cos(ba) - s * Math.sin(ba)
      y = t * Math.sin(ba) + s * Math.cos(ba)
      a = 0.75
    } else {
      x = gauss(r) * 2300
      y = gauss(r) * 2300
      a = 0.95
    }
    put(c, i, x, y, gauss(r) * 400)
    c.sizes[i] = 1e12
    c.alphas[i] = a * (0.55 + 0.45 * r())
  }
  return c
}

/**
 * Stars around the Sun, uniform in a sphere of radius R (ly), projected on the map plane.
 * `fall` > 0 fades the outer fraction of the disc to nothing, so the field has no hard edge.
 */
export function starField(n: number, R: number, seed: number, flat = 1, fall = 0): Cloud {
  const r = rng(seed)
  const c = alloc(n)
  for (let i = 0; i < n; i++) {
    let x = 0
    let y = 0
    let z = 0
    do {
      x = 2 * r() - 1
      y = 2 * r() - 1
      z = 2 * r() - 1
    } while (x * x + y * y + z * z > 1)
    put(c, i, x * R, y * R, z * R * flat)
    c.sizes[i] = 1e12
    const bright = r()
    const rho = Math.hypot(x, y)
    const edge = fall > 0 ? 1 - smooth(1 - fall, 1, rho) : 1
    c.alphas[i] = (bright > 0.97 ? 1 : 0.25 + 0.45 * r()) * edge
  }
  return c
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
