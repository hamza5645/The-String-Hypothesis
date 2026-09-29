// Bridge paths over the map (world space). T-causeways lie on the water; S and lift bridges are arches.
import { TIP_INDEX, tipCenter } from './model'

export type V3 = [number, number, number]

const PEAK = 1.02
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const C = {
  IIA: tipCenter(TIP_INDEX.IIA),
  IIB: tipCenter(TIP_INDEX.IIB),
  I: tipCenter(TIP_INDEX.I),
  HO: tipCenter(TIP_INDEX.HO),
  HE: tipCenter(TIP_INDEX.HE),
  M11: tipCenter(TIP_INDEX.M11),
}

export const FORK: V3 = [0.35, 0.62, -0.25]
export const APEX = { 's-i-ho': 1.6, 'l-iia': 1.85, 'l-he': 1.85, 's-iib': 1.2 } as Record<string, number>

function line(a: V3, b: V3, s: number, y: number, out: V3) {
  out[0] = lerp(a[0], b[0], s)
  out[1] = y
  out[2] = lerp(a[2], b[2], s)
  return out
}
function arch(a: V3, b: V3, apex: number, s: number, out: V3) {
  out[0] = lerp(a[0], b[0], s)
  out[1] = PEAK + (apex - PEAK) * Math.sin(Math.PI * s)
  out[2] = lerp(a[2], b[2], s)
  return out
}
function chord(a: V3, b: V3, ya: number, yb: number, s: number, out: V3) {
  out[0] = lerp(a[0], b[0], s)
  out[1] = lerp(ya, yb, s) + 0.25 * Math.sin(Math.PI * s)
  out[2] = lerp(a[2], b[2], s)
  return out
}

/** Allocation-free point at parameter s ∈ [0, 1] along a bridge. */
export function bridgeAt(id: string, s: number, out: V3): V3 {
  switch (id) {
    case 't-ii':
      return line(C.IIA as V3, C.IIB as V3, s, 0.365, out)
    case 't-het':
      return line(C.HO as V3, C.HE as V3, s, 0.365, out)
    case 's-i-ho':
      return arch(C.I as V3, C.HO as V3, APEX[id], s, out)
    case 'l-iia':
      return arch(C.IIA as V3, C.M11 as V3, APEX[id], s, out)
    case 'l-he':
      return arch(C.HE as V3, C.M11 as V3, APEX[id], s, out)
    case 's-iib': {
      // a teardrop loop, apex y = 1.2: it heads out over the sea gap towards Type I, turns and comes home
      // (IIB's S-duality maps it to itself; Type I is an orientifold of IIB, not its dual)
      const a = C.IIB
      const ang = s * Math.PI * 2
      const ix = -a[0] / 4.3
      const iz = -a[2] / 4.3
      const dx = 0.6 * ix + 0.8 * iz
      const dz = 0.6 * iz - 0.8 * ix
      const reach = 1.25 * (1 - Math.cos(ang)) * 0.5
      const side = 0.42 * Math.sin(ang)
      out[0] = a[0] + dx * reach - dz * side
      out[1] = PEAK + (APEX[id] - PEAK) * (1 - Math.cos(ang)) * 0.5
      out[2] = a[2] + dz * reach + dx * side
      return out
    }
    case 'c-k3':
      // IIA → fork → HO, drawn low through the fog (the → HE branch is `forkAt`)
      return s < 0.45 ? chord(C.IIA as V3, FORK, PEAK, FORK[1], s / 0.45, out) : chord(FORK, C.HO as V3, FORK[1], PEAK, (s - 0.45) / 0.55, out)
  }
  out[0] = out[1] = out[2] = 0
  return out
}
export const forkAt = (s: number, out: V3) => chord(FORK, C.HE as V3, FORK[1], PEAK, s, out)

export function bridgeCurve(id: string, n: number): V3[] {
  return Array.from({ length: n }, (_, i) => bridgeAt(id, i / (n - 1), [0, 0, 0]))
}
