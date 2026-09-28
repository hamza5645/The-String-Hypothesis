import type { ImplicitSpec } from './mesher'
import { cHandle, cPants, dcHandle, dcPants } from './model'

export type MeshKind = 'pants' | 'handle'

/** Lab › Model 1 (pants) and Beat 5 (handle, baked once at w = 1.5); cell 0.08 ℓ. */
export const MESH_SPECS: Record<MeshKind, ImplicitSpec> = {
  pants: { c: cPants, dc: dcPants, x0: -4, x1: 4, y0: -1.8, y1: 1.8, t0: 0, t1: 10, cell: 0.08 },
  handle: { c: (t) => cHandle(t), dc: (t) => dcHandle(t), x0: -3, x1: 3, y0: -1.8, y1: 1.8, t0: 0, t1: 10, cell: 0.08 },
}
