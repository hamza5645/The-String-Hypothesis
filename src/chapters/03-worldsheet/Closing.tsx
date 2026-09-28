import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, Filament, loopFn, useChapterFrame, useIsoGridMaterial, type FilamentApi } from '@/gl'
import { HANDOFF, handoffFit } from '@/core/handoff'
import { lerp, smoothstep } from '@/core/math'
import { D } from './director'
import { lineMaterial, makeLine, paramSurface } from './gl'
import { ARC_R, CLOSE_TOP, gapAngle, JOIN_T } from './model'
import { Tag, useDispose } from './parts'

/**
 * Beat 6 — open strings can close (a cartoon, flagged): a C-shaped arc of radius 1.2 whose angular gap
 * narrows as g(t) = 2.4·√max(0, 1 − t/5); the ends meet at ct = 5 and a plain tube continues to ct = 9.
 * The warm slice goes from a "C" to a ring. OUT: the Rig cranes up the tube and looks straight down the
 * time axis; the diagram fades, leaving the loop — which becomes exactly H2 (HandoffLoop) at progress 1.
 */

const GAP_DIR = (70 * Math.PI) / 180 // the gap faces the 3/4 camera obliquely, so both edges read
const NA = 200
/** the caveat's anchor: just outside the right-hand drawn end's worldline (angle GAP_DIR − g/2), at ct = 2.2 */
const CAVEAT_AT = (() => {
  const t = 2.2
  const th = GAP_DIR - gapAngle(t) / 2
  return [ARC_R * 1.1 * Math.cos(th), t, ARC_R * 1.1 * Math.sin(th)] as const
})()

export function Closing() {
  const group = useRef<THREE.Group>(null!)
  const arc = useRef<FilamentApi>(null)
  const ring = useRef<FilamentApi>(null)
  const geo = useMemo(
    () =>
      paramSurface(96, 120, (u, v, out) => {
        const t = v * CLOSE_TOP
        const g = gapAngle(t)
        const th = GAP_DIR + g / 2 + u * (2 * Math.PI - g)
        out.set(ARC_R * Math.cos(th), t, ARC_R * Math.sin(th))
      }),
    [],
  )
  const film = useIsoGridMaterial({ grid: [16, 18], lineWidth: 0.7, fill: 0.07, fresnel: 0.35, revealAxis: 'v', reveal: 0, edge: 0.9, lineColor: '#4f6588' })
  const { edges, edgeMat } = useMemo(() => {
    const edgeMat = lineMaterial(COLORS.field, 0)
    const n = 120
    const mk = (sg: number) => {
      const p = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * JOIN_T
        const th = GAP_DIR + sg * (gapAngle(t) / 2)
        p.set([ARC_R * Math.cos(th), t, ARC_R * Math.sin(th)], i * 3)
      }
      return makeLine(p, edgeMat)
    }
    return { edges: [mk(1), mk(-1)], edgeMat }
  }, [])
  useDispose(geo, edges[0].geometry, edges[1].geometry, edgeMat)
  const arcPts = useMemo(() => new Float32Array(NA * 3), [])
  const ringPts = useMemo(() => new Float32Array(NA * 3), [])
  const loopPt = useMemo(() => new THREE.Vector3(), [])

  useChapterFrame(({ t, state }) => {
    const w = D.w.close
    const out = D.out
    const g = group.current
    // the diagram's ring hands over to the canonical H2 (Scene) once the crane has landed and both coincide
    g.visible = w > 0.003 && D.h2 < 0.999
    const tC = D.tC
    const fadeFilm = 1 - smoothstep(0.3, 0.72, out)
    film.uniforms.uReveal.value = tC / CLOSE_TOP
    film.uniforms.uOpacity.value = w * fadeFilm
    film.uniforms.uEdge.value = tC < CLOSE_TOP - 0.01 ? 0.9 : 0
    const nE = Math.max(2, Math.floor((Math.min(tC, JOIN_T) / JOIN_T) * 119) + 1)
    for (const e of edges) e.geometry.setDrawRange(0, nE)
    edgeMat.opacity = 0.85 * w * fadeFilm

    // the warm "now": a C-arc (open, free ends) until the join, then a ring
    const gp = gapAngle(tC)
    const open = tC < JOIN_T - 1e-3
    for (let i = 0; i < NA; i++) {
      const u = i / (NA - 1)
      const th = GAP_DIR + gp / 2 + u * (2 * Math.PI - gp)
      arcPts[i * 3] = ARC_R * Math.cos(th)
      arcPts[i * 3 + 1] = tC
      arcPts[i * 3 + 2] = ARC_R * Math.sin(th)
    }
    arc.current?.update()
    // ring: the tube's slice; during OUT it morphs into H2 (loopFn, radius 1.3·fit) expressed in diagram
    // coordinates: world (x, y, z) = G·local  ⇔  local = (x, CLOSE_TOP + z, −y)
    const aspect = state.size.width / Math.max(1, state.size.height)
    const fit = handoffFit(aspect)
    const m = smoothstep(0.25, 0.85, out)
    const fnH2 = h2Fn
    for (let i = 0; i < NA; i++) {
      const u = i / NA
      const th = u * Math.PI * 2
      const rx = ARC_R * Math.cos(th)
      const rz = -ARC_R * Math.sin(th)
      fnH2(u, t, loopPt, fit)
      ringPts[i * 3] = lerp(rx, loopPt.x, m)
      ringPts[i * 3 + 1] = lerp(tC, CLOSE_TOP + loopPt.z, m)
      ringPts[i * 3 + 2] = lerp(rz, -loopPt.y, m)
    }
    ring.current?.update()
    const aOn = w * (open ? 1 : 0)
    const rOn = w * (open ? 0 : 1) * (1 - D.h2)
    if (arc.current) {
      arc.current.group.visible = aOn > 0.003
      arc.current.material.uniforms.uOpacity.value = aOn
    }
    if (ring.current) {
      ring.current.group.visible = rOn > 0.003
      ring.current.material.uniforms.uOpacity.value = rOn
    }
  })

  return (
    <group ref={group}>
        <mesh geometry={geo} material={film} renderOrder={1} />
        {edges.map((e, i) => (
          <primitive key={i} object={e} />
        ))}
        <Filament ref={arc} points={arcPts} count={NA} width={0.11} beads minPixels={1} coreFraction={0.14} intensity={1.1} renderOrder={6} />
        <Filament ref={ring} points={ringPts} count={NA} closed width={HANDOFF.H2.width} minPixels={1} coreFraction={0.14} intensity={1.1} renderOrder={6} />
        <Tag
          position={[ARC_R * Math.cos(GAP_DIR) * 1.22, JOIN_T + 0.12, ARC_R * Math.sin(GAP_DIR) * 1.22]}
          align="left"
          tone="ink"
          opacity={() => D.w.close * smoothstep(JOIN_T - 0.3, JOIN_T + 0.2, D.tC) * (1 - smoothstep(0.1, 0.3, D.out))}
        >
          ENDS JOIN
        </Tag>
        {/* beside the drawn ends it qualifies: right of the right-hand edge, at mid-height */}
        <Tag
          position={[CAVEAT_AT[0], CAVEAT_AT[1], CAVEAT_AT[2]]}
          align="left"
          tone="ink"
          leader
          opacity={() => (D.portrait ? 0 : 0.9) * D.w.close * smoothstep(1.2, 2.0, D.tC) * (1 - smoothstep(0.05, 0.2, D.out))}
        >
          CARTOON ·
          <br />
          REAL FREE ENDS MOVE AT c
        </Tag>
        {/* phones: the side caption would leave the screen, so it sits under the history */}
        <Tag position={[0, -0.7, 0]} align="center" tone="ink" opacity={() => (D.portrait ? 0.9 : 0) * D.w.close * smoothstep(1.2, 2.0, D.tC) * (1 - smoothstep(0.05, 0.2, D.out))}>
          CARTOON · REAL FREE ENDS MOVE AT c
        </Tag>
    </group>
  )
}

/** loopFn with the canonical wobble/radius, evaluated for a given fit (same phase as HandoffLoop). */
const fnCache = { fit: -1, fn: null as ReturnType<typeof loopFn> | null }
function h2Fn(u: number, t: number, out: THREE.Vector3, fit: number) {
  if (fnCache.fit !== fit || !fnCache.fn) {
    fnCache.fit = fit
    fnCache.fn = loopFn(HANDOFF.H2.wobble, HANDOFF.H2.radius * fit)
  }
  fnCache.fn(u, t, out, 0)
}
