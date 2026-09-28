// Builds the implicit worldsheet meshes off the main thread (≈ 50k triangles each).
import { meshTwoGaussians, type ImplicitSpec } from './mesher'
import { MESH_SPECS, type MeshKind } from './meshSpecs'

type Ctx = { onmessage: ((e: MessageEvent<MeshKind>) => void) | null; postMessage(m: unknown, t: Transferable[]): void }
const ctx = self as unknown as Ctx

ctx.onmessage = (e) => {
  const kind = e.data
  const spec: ImplicitSpec = MESH_SPECS[kind]
  const m = meshTwoGaussians(spec)
  ctx.postMessage({ kind, positions: m.positions, normals: m.normals, index: m.index }, [m.positions.buffer, m.normals.buffer, m.index.buffer])
}
