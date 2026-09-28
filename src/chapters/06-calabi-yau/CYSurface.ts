import * as THREE from 'three'
import { buildBasePatch, buildRims, patchGrid, type Degree } from './cyMath'
import { createPrepassMaterial, createRimMaterial, createSurfaceMaterial, setProj, type CYSurfaceMaterial } from './cyShaders'

/*
 * The instanced Hanson surface: one base patch drawn n² times (one draw call), its depth prepass
 * (only while the loop is highlighted) and its dashed rims. Changing n never tweens geometry
 * (in-between shapes are not solutions): the new surface cross-dissolves in over 0.8 s with a slight bloom.
 */

export interface CYFrameInput {
  n: Degree
  alpha: number
  s: number
  asm: number
  pieces: number
  focus: number
  pattern: number
  spread: number
  touch: THREE.Vector4
  phase: number
  opacity: number
  rim: number
  prepass: boolean
  dt: number
  reduced: boolean
}

interface Slot {
  n: number
  w: number
  geo: THREE.InstancedBufferGeometry | null
  rgeo: THREE.BufferGeometry | null
  mat: CYSurfaceMaterial
  pre: CYSurfaceMaterial
  rmat: CYSurfaceMaterial
  mesh: THREE.Mesh
  pmesh: THREE.Mesh
  rims: THREE.LineSegments
}

const noRaycast = () => {}

function makeSlot(): Slot {
  const mat = createSurfaceMaterial()
  const pre = createPrepassMaterial()
  const rmat = createRimMaterial()
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat)
  const pmesh = new THREE.Mesh(mesh.geometry, pre)
  const rims = new THREE.LineSegments(new THREE.BufferGeometry(), rmat)
  for (const o of [mesh, pmesh, rims]) {
    o.frustumCulled = false
    o.raycast = noRaycast
    o.visible = false
  }
  mesh.renderOrder = 1
  rims.renderOrder = 2
  return { n: 0, w: 0, geo: null, rgeo: null, mat, pre, rmat, mesh, pmesh, rims }
}

function fillSlot(slot: Slot, n: Degree, tier: 'low' | 'medium' | 'high') {
  const [nx, ny] = patchGrid(tier, n)
  const d = buildBasePatch(n, nx, ny)
  const g = new THREE.InstancedBufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(d.position, 3))
  g.setAttribute('aP4', new THREE.BufferAttribute(d.p4, 4))
  g.setAttribute('aTx', new THREE.BufferAttribute(d.tx, 4))
  g.setAttribute('aTy', new THREE.BufferAttribute(d.ty, 4))
  g.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2))
  g.setIndex(new THREE.BufferAttribute(d.index, 1))
  const k = new Float32Array(n * n * 2)
  for (let k1 = 0; k1 < n; k1++)
    for (let k2 = 0; k2 < n; k2++) {
      k[(k1 * n + k2) * 2] = k1
      k[(k1 * n + k2) * 2 + 1] = k2
    }
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(k, 2))
  g.instanceCount = n * n
  const r = buildRims(n, ny)
  const rg = new THREE.BufferGeometry()
  rg.setAttribute('aP4', new THREE.BufferAttribute(r.p4, 4))
  rg.setAttribute('aDash', new THREE.BufferAttribute(r.dash, 1))
  rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(r.dash.length * 3), 3))
  slot.geo?.dispose()
  slot.rgeo?.dispose()
  slot.geo = g
  slot.rgeo = rg
  slot.mesh.geometry = g
  slot.pmesh.geometry = g
  slot.rims.geometry = rg
  slot.n = n
}

export class CYSurface {
  readonly group = new THREE.Group()
  private slots: [Slot, Slot]
  private cur = 0
  private tier: 'low' | 'medium' | 'high'
  private fade = 1
  /** The degree currently shown (after any dissolve completes, equals the requested n). */
  shown: Degree = 5

  constructor(tier: 'low' | 'medium' | 'high') {
    this.tier = tier
    this.slots = [makeSlot(), makeSlot()]
    for (const s of this.slots) this.group.add(s.pmesh, s.mesh, s.rims)
    fillSlot(this.slots[0], 5, tier)
    this.slots[0].w = 1
  }

  setTier(tier: 'low' | 'medium' | 'high') {
    if (tier === this.tier) return
    this.tier = tier
    const s = this.slots[this.cur]
    fillSlot(s, s.n as Degree, tier)
  }

  update(f: CYFrameInput) {
    const a = this.slots[this.cur]
    const b = this.slots[1 - this.cur]
    // start a dissolve when the requested degree differs from the current one
    if (f.n !== a.n && this.fade >= 1) {
      fillSlot(b, f.n, this.tier)
      this.cur = 1 - this.cur
      this.fade = 0
    }
    const inc = this.slots[this.cur]
    const out = this.slots[1 - this.cur]
    if (this.fade < 1) this.fade = f.reduced ? 1 : Math.min(1, this.fade + f.dt / 0.8)
    // frozen clock (screenshots): complete immediately
    if (f.dt === 0) this.fade = 1
    const e = this.fade * this.fade * (3 - 2 * this.fade)
    inc.w = e
    out.w = this.fade >= 1 ? 0 : 1 - e
    this.shown = inc.n as Degree
    const bloom = 1 + 0.35 * Math.sin(Math.PI * e) * (this.fade < 1 ? 1 : 0)
    for (const s of this.slots) {
      const on = s.w > 0.001 && f.opacity > 0.001 && s.geo !== null
      s.mesh.visible = on
      s.rims.visible = on && f.rim > 0.001
      s.pmesh.visible = on && f.prepass && s === inc
      if (!on) continue
      const u = s.mat.uniforms
      setProj(s.mat, s.n, f.alpha, f.s)
      setProj(s.pre, s.n, f.alpha, f.s)
      setProj(s.rmat, s.n, f.alpha, f.s)
      u.uAsm.value = f.asm
      s.pre.uniforms.uAsm.value = f.asm
      u.uPieces.value = f.pieces
      u.uFocus.value = f.focus
      u.uPattern.value = f.pattern
      u.uSpread.value = f.spread
      u.uTouch.value.copy(f.touch)
      u.uPhase.value = f.phase
      u.uOpacity.value = f.opacity * s.w
      u.uGain.value = s === inc ? bloom : 1
      s.rmat.uniforms.uOpacity.value = f.rim * f.opacity * s.w
    }
  }

  dispose() {
    for (const s of this.slots) {
      s.geo?.dispose()
      s.rgeo?.dispose()
      s.mat.dispose()
      s.pre.dispose()
      s.rmat.dispose()
    }
  }
}
