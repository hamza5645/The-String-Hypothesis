/*
 * The Thread in this chapter: H2 at the first frame → wobble eases → parks top-left (dim) through Beats 1–4 →
 * Beat 5 flies in, unfurls into an open string (free-end see-saw, one arrow), curls shut into a loop,
 * shows two counter-circling glints (right- and left-movers), whose arrows fly to the pattern tile →
 * the loop LOCKS onto the ring's deformation (P' = c + (I + ½H)(P − c)) → Beat 6 / Lab → recentres into H2.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Filament, GlowPoints, SceneLabel, COLORS, useChapterFrame, type FilamentApi, type GlowPointsApi } from '@/gl'
import { HANDOFF } from '@/core/handoff'
import { lerp, range, smoothstep, TAU, damp } from '@/core/math'
import { Status } from '@/ui'
import { D, S, TITLE_P0 } from './director'
import { useGravity } from './store'
import type { Spin } from './model'
import { lineMaterial, Segs, writeArrow } from './lines'
import { STRING_CAPTION } from './copy'
import { AHA, TILE_DOCK } from './Tile'

const NC = HANDOFF.H2.count
const NO = HANDOFF.H1.count
const L_OPEN = 1.6
const TAN = Math.tan(((HANDOFF.camera.fov * Math.PI) / 180) / 2)

// scratch (module-level: one Thread per chapter)
const qId = new THREE.Quaternion()
const qTmp = new THREE.Quaternion()
const vTmp = new THREE.Vector3()
const vDir = new THREE.Vector3()
const vFwd = new THREE.Vector3()
const parkPos = new THREE.Vector3()

export function Thread() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const group = useRef<THREE.Group>(null!)
  const closed = useRef<FilamentApi>(null)
  const open = useRef<FilamentApi>(null)
  const glints = useRef<GlowPointsApi>(null)
  const openLabel = useRef<THREE.Group>(null!)
  const tagR = useRef<THREE.Group>(null!)
  const tagL = useRef<THREE.Group>(null!)
  const capLoop = useRef<THREE.Group>(null!)
  const capLab = useRef<THREE.Group>(null!)

  const closedPts = useMemo(() => new Float32Array(NC * 3), [])
  const openPts = useMemo(() => new Float32Array(NO * 3), [])
  const glintPos = useMemo(() => new Float32Array(6), [])
  const glintSize = useMemo(() => new Float32Array([0.34, 0.34]), [])
  const glintAlpha = useMemo(() => new Float32Array([0, 0]), [])
  const glintCol = useMemo(() => {
    const c = new THREE.Color(COLORS.filamentCore)
    return new Float32Array([c.r, c.g, c.b, c.r, c.g, c.b])
  }, [])

  // three arrows: [0] open-string end arrow, [1] right-mover glint arrow, [2] left-mover glint arrow (10 verts each)
  const arrows = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    for (let k = 0; k < 15; k++) s.seg(0, 0, 0, 0, 0, 0, 0)
    const geo = s.build(true)
    return { geo, mat: lineMaterial(COLORS.field, 1) }
  }, [])

  const st = useMemo(() => ({ openLab: 0, glint: 0 }), [])

  // Opening: a faint Field hairline circle blooms concentric with the loop and fades (it foreshadows the ring)
  const halo = useMemo(() => {
    const s = new Segs().color(COLORS.field)
    const c: number[] = []
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * TAU
      c.push(Math.cos(a), Math.sin(a), 0)
    }
    s.poly(c, 1, true)
    return { geo: s.build(), mat: lineMaterial(COLORS.field, 0) }
  }, [])
  const haloRef = useRef<THREE.LineSegments>(null!)

  // reduced motion: the loop's half-cycle snapshot (phase ½, dashed), paired with the ring's
  const snap = useMemo(() => {
    const s = new Segs().color(COLORS.filament)
    for (let i = 0; i < 128; i++) s.seg(0, 0, 0, 0, 0, 0, 1, i / 128, (i + 1) / 128)
    return { geo: s.build(true), mat: lineMaterial(COLORS.filament, 0, 1 / 48, 0.5) }
  }, [])

  useChapterFrame((f) => {
    const { t, dt } = f
    const w = D.w
    const sp = D.sp
    const b = D.b
    const a = sp[S.aha]
    const fit = D.fit
    const rC = HANDOFF.H2.radius * fit
    const mob = D.mobile
    const loopR = D.loopR
    const Lopen = L_OPEN * (loopR / 0.8)

    /* ── opening: wobble eases to 50 %, then the loop glides to its parking spot ── */
    const tw = range(sp[S.title], TITLE_P0 + 0.02, 0.98)
    let wob = lerp(1, 0.5, smoothstep(0, 0.6, tw))
    // origin beat: glide right beside the text (0.05 → 0.45), then lift into the parking spot (0.55 → 0.95)
    const glideA = smoothstep(0.05, 0.45, sp[S.origin])
    const glide = smoothstep(0.55, 0.95, sp[S.origin])

    /* ── Beat 5 choreography (a = local progress of the aha step) ── */
    const inAhaOrAfter = b >= S.aha - 0.3
    const fly = inAhaOrAfter ? smoothstep(0.0, 0.07, a) : 0
    const unfurl = inAhaOrAfter ? smoothstep(0.075, 0.135, a) : 0
    const curl = inAhaOrAfter ? smoothstep(0.2, 0.3, a) : 0
    wob *= 1 - smoothstep(0, 0.05, a)
    // in flight the loop shrinks to the length of the open string it will become (unfurling conserves length)
    const rLoc = lerp(rC, Lopen / TAU, fly)
    const afterClose = a >= 0.999 || b >= S.aha + 1 || (b > S.aha && curl >= 1)
    const outro = smoothstep(0.02, 0.45, sp[S.outro])

    /* ── opening foreshadow: radius 1.0 → 1.35 × the loop's, peak 15 % opacity, gone before the glide ── */
    const haloK = range(b, TITLE_P0 + 0.02, 1.08)
    const haloA = 0.15 * Math.sin(Math.PI * haloK) * w[S.title]
    halo.mat.uniforms.uOpacity.value = haloA
    haloRef.current.visible = haloA > 0.002
    haloRef.current.scale.setScalar(rC * lerp(1.04, 1.35, Math.sqrt(haloK)))

    /* ── group transform: identity ↔ parked (camera space, fixed on screen) ── */
    const parkK = Math.max(glideA, glide) * (1 - fly)
    if (parkK > 0) {
      // parked top-right, dim, clear of the header chrome and of every beat's figure
      const ndcX = lerp(mob ? 0 : 0.36, mob ? 0.8 : 0.83, glide)
      const ndcY = lerp(mob ? 0.28 : 0.02, mob ? 0.84 : 0.74, glide)
      vTmp.set(ndcX, ndcY, 0.5).unproject(camera)
      vDir.copy(vTmp).sub(camera.position).normalize()
      camera.getWorldDirection(vFwd)
      const depth = 10
      parkPos.copy(camera.position).addScaledVector(vDir, depth / Math.max(0.2, vDir.dot(vFwd)))
      const rPx = lerp(mob ? 0.09 : 0.2, mob ? 0.022 : 0.042, glide)
      const sPark = (rPx * 2 * depth * TAN) / rC
      const g = group.current
      g.position.set(0, 0, 0).lerp(parkPos, parkK)
      qTmp.copy(qId).slerp(camera.quaternion, parkK)
      g.quaternion.copy(qTmp)
      g.scale.setScalar(lerp(1, sPark, parkK))
    } else {
      group.current.position.set(0, 0, 0)
      group.current.quaternion.identity()
      group.current.scale.setScalar(1)
    }
    const gScale = group.current.scale.x

    /* ── which filament is drawn ── */
    // open string: during unfurl→curl in Beat 5, and in the Lab when spin = 1
    const ahaOpen = inAhaOrAfter && unfurl > 0 && curl < 1 && !afterClose ? 1 : 0
    const labOpenTarget = D.labSpin === 1 && w[S.lab] + w[S.outro] > 0.5 ? 1 : 0
    st.openLab = dt > 0 ? damp(st.openLab, labOpenTarget, 7, dt) : labOpenTarget
    const labOpen = st.openLab * (1 - outro)
    const openVis = Math.max(ahaOpen, labOpen * (b > S.forced + 0.5 ? 1 : 0))

    /* ── closed loop points ── */
    const H = D.loopWave
    const lock = D.lock
    const cx = D.loopX
    const cy = D.loopY
    const om = HANDOFF.H2.omega
    const co = Math.cos(om * t)
    const c2 = Math.cos(1.37 * om * t + 1.1)
    const so = Math.sin(om * t)
    const wobble = HANDOFF.H2.wobble * wob
    const P = closedPts
    const localCX = lerp(0, cx, fly)
    const localCY = lerp(0, cy, fly)
    if (!afterClose) {
      // canonical H2 shape (exactly loopFn at wob = 1, centre 0) — in the group's frame
      for (let i = 0; i < NC; i++) {
        const th = (i / NC) * TAU
        const ww = wobble * (0.6 * Math.cos(2 * th) * co + 0.4 * Math.cos(3 * th + 0.7) * c2)
        const r = rLoc * (1 + ww)
        P[i * 3] = localCX + r * Math.cos(th)
        P[i * 3 + 1] = localCY + r * Math.sin(th)
        P[i * 3 + 2] = rLoc * wobble * 0.5 * Math.sin(2 * th) * so
      }
    } else {
      // loop at its stage position, deformed by the locked pattern; outro blends into canonical H2 at the origin
      const hs = 0.5 * lock
      for (let i = 0; i < NC; i++) {
        const th = (i / NC) * TAU
        const px = loopR * Math.cos(th)
        const py = loopR * Math.sin(th)
        const x = cx + px + hs * (H.h00 * px + H.h01 * py)
        const y = cy + py + hs * (H.h01 * px + H.h11 * py)
        if (outro > 0) {
          const ww = HANDOFF.H2.wobble * (0.6 * Math.cos(2 * th) * co + 0.4 * Math.cos(3 * th + 0.7) * c2)
          const r = rC * (1 + ww)
          P[i * 3] = lerp(x, r * Math.cos(th), outro)
          P[i * 3 + 1] = lerp(y, r * Math.sin(th), outro)
          P[i * 3 + 2] = lerp(0, rC * HANDOFF.H2.wobble * 0.5 * Math.sin(2 * th) * so, outro)
        } else {
          P[i * 3] = x
          P[i * 3 + 1] = y
          P[i * 3 + 2] = 0
        }
      }
    }
    closed.current?.update()

    // reduced motion (story): the matching half-cycle snapshot of the locked loop, like the ring's
    const snapA = D.reduced && afterClose && b < S.lab ? lock * D.v[S.aha] * 0.8 : 0
    snap.mat.uniforms.uOpacity.value = snapA
    if (snapA > 0.002) {
      const sp2 = snap.geo.attributes.position.array as Float32Array
      const hs2 = -0.5 * lock
      let px = 0
      let py = 0
      for (let i = 0; i <= 128; i++) {
        const th = ((i % 128) / 128) * TAU
        const qx = loopR * Math.cos(th)
        const qy = loopR * Math.sin(th)
        const x = cx + qx + hs2 * (H.h00 * qx + H.h01 * qy)
        const y = cy + qy + hs2 * (H.h01 * qx + H.h11 * qy)
        if (i > 0) {
          const o = (i - 1) * 6
          sp2[o] = px
          sp2[o + 1] = py
          sp2[o + 2] = 0
          sp2[o + 3] = x
          sp2[o + 4] = y
          sp2[o + 5] = 0
        }
        px = x
        py = y
      }
      snap.geo.attributes.position.needsUpdate = true
    }

    /* ── open string points ── */
    const O = openPts
    const phi = D.phi
    let endX = 0
    let endY = 0
    let ex = 0
    let ey = 1
    if (ahaOpen) {
      // arc of total turning Θ and length L: unfurl (2π → 0) then curl shut (0 → 2π)
      const theta = curl > 0 ? TAU * curl : TAU * (1 - unfurl)
      // curling: bend at constant length until the arc radius reaches the loop's, then grow as the ends meet
      // (the shape never swells past the loop it becomes)
      const L = curl > 0 ? Math.max(loopR, Lopen / Math.max(theta, 1e-4)) * theta : lerp(TAU * rLoc, Lopen, unfurl)
      const amp = 0.5 * 0.2 * Lopen * unfurl * (1 - curl) // ½ A L, A = 0.2 — free-end first mode
      const cphi = Math.cos(phi)
      for (let i = 0; i < NO; i++) {
        const s = (i / (NO - 1) - 0.5) * L
        let x: number
        let y: number
        let nx: number
        let ny: number
        if (theta < 1e-4) {
          x = s
          y = 0
          nx = 0
          ny = 1
        } else {
          const r = L / theta
          const al = s / r
          x = r * Math.sin(al)
          y = r * (1 - Math.cos(al)) - (r * (1 - Math.cos(theta / 2))) / 2
          // normal (points outward from the curl centre… for a straight string this is +y)
          nx = -Math.sin(al)
          ny = Math.cos(al)
        }
        const u = amp * Math.cos((Math.PI * (s + L / 2)) / L) * cphi
        O[i * 3] = localCX + x + u * nx
        O[i * 3 + 1] = localCY + y + u * ny
        O[i * 3 + 2] = 0
      }
      endX = O[(NO - 1) * 3]
      endY = O[(NO - 1) * 3 + 1]
      ex = 0
      ey = 1
    } else if (labOpen > 0.001) {
      // Lab, spin 1: straight open string along n = Rot(ψ)(0,1); u(s) = ½ A L cos(πs/L) cos φ · e,  e = Rot(ψ)(1,0)
      const psi = D.psi
      const nX = -Math.sin(psi)
      const nY = Math.cos(psi)
      ex = Math.cos(psi)
      ey = Math.sin(psi)
      const A = D.A
      const cphi = Math.cos(phi)
      for (let i = 0; i < NO; i++) {
        const s = (i / (NO - 1)) * Lopen
        const u = 0.5 * A * Lopen * Math.cos((Math.PI * s) / Lopen) * cphi
        const along = s - Lopen / 2
        O[i * 3] = cx + along * nX + u * ex
        O[i * 3 + 1] = cy + along * nY + u * ey
        O[i * 3 + 2] = 0
      }
      endX = O[(NO - 1) * 3]
      endY = O[(NO - 1) * 3 + 1]
    }
    open.current?.update()

    /* ── materials: visibility, width, intensity ── */
    const camD = D.cam.d
    const widthBase = HANDOFF.H2.width * (camD / HANDOFF.camera.position[2])
    const park = parkK
    const bloom = 1 + 0.3 * smoothstep(0.6, 0.64, a) * (1 - smoothstep(0.68, 0.78, a)) * (b < S.aha + 1 ? 1 : 0)
    const closedVis = (1 - ahaOpen) * (1 - labOpen * (b > S.forced + 0.5 ? 1 : 0)) * D.loopVis
    const cm = closed.current?.material
    if (cm) {
      const exact = park === 0 && camD === 10 && !afterClose && wob === 1
      cm.uniforms.uWidth.value = exact ? HANDOFF.H2.width : widthBase / Math.sqrt(Math.max(gScale, 1e-3))
      cm.uniforms.uOpacity.value = closedVis * lerp(1, 0.45, glide * (1 - fly))
      cm.uniforms.uIntensity.value = bloom
      closed.current!.group.visible = closedVis > 0.002
    }
    const omat = open.current?.material
    if (omat) {
      omat.uniforms.uWidth.value = widthBase
      omat.uniforms.uOpacity.value = openVis * D.loopVis
      omat.uniforms.uIntensity.value = 1
      open.current!.group.visible = openVis > 0.002
    }

    /* ── glints: σ = +φ (right-mover, counter-clockwise) and σ = −φ (left-mover) ── */
    const glintTarget =
      b < S.aha ? 0 : b < S.aha + 1 ? smoothstep(0.3, 0.36, a) : b < S.lab ? 0.55 : D.labSpin === 1 ? 0 : 0.8
    st.glint = glintTarget * (1 - smoothstep(0.0, 0.14, sp[S.outro])) * D.loopVis
    const hs = 0.5 * lock
    const gphi = D.glintPhi
    for (let k = 0; k < 2; k++) {
      const sg = k === 0 ? gphi : -gphi
      const px = loopR * Math.cos(sg)
      const py = loopR * Math.sin(sg)
      glintPos[k * 3] = lerp(cx + px + hs * (H.h00 * px + H.h01 * py), (rC / loopR) * px, outro)
      glintPos[k * 3 + 1] = lerp(cy + py + hs * (H.h01 * px + H.h11 * py), (rC / loopR) * py, outro)
      glintPos[k * 3 + 2] = 0.01
      glintAlpha[k] = st.glint
      glintSize[k] = 0.3 * (camD / 10) * (mob ? 1.25 : 1)
    }
    const gp = glints.current
    if (gp) {
      gp.geometry.attributes.position.needsUpdate = true
      gp.geometry.attributes.aAlpha.needsUpdate = true
      gp.geometry.attributes.aSize.needsUpdate = true
      gp.visible = st.glint > 0.002 && afterClose
    }

    /* ── arrows ── */
    const pos = arrows.geo.attributes.position.array as Float32Array
    const al = arrows.geo.attributes.aAlpha.array as Float32Array
    const alen = 0.36 * (mob ? 0.9 : 1)
    // [0] open-string end arrow (along the wiggle direction e)
    let a0 = 0
    if (ahaOpen) {
      a0 = smoothstep(0.12, 0.15, a) * (1 - smoothstep(0.2, 0.24, a))
      writeArrow(pos, 0, endX + 0.16, endY, 0, ex, ey, alen)
    } else if (labOpen > 0.01) {
      a0 = labOpen * 0.9
      writeArrow(pos, 0, endX + 0.18 * -Math.sin(D.psi), endY + 0.18 * Math.cos(D.psi), 0, ex, ey, alen)
    }
    for (let v = 0; v < 10; v++) al[v] = a0
    // [1], [2] glint arrows: angle ψ + 45° ± 45° sin(0.3 φ) (decorative). In Beat 5 (a 0.44 → 0.515) they
    // lift off and fly to the tile, landing exactly on the ↔ header glyphs (TILE_DOCK, measured from the DOM),
    // which then take over: the right-mover's arrow becomes the rows' header, the left-mover's the columns'.
    const story = b < S.aha + 1
    const flyT = story ? smoothstep(0.44, AHA.dock0, a) : 1
    const dockFade = story ? 1 - smoothstep(AHA.dock0 + 0.004, AHA.dock1, a) : 0
    // arrows ride the glints in Beat 5 (until they dock) and in the Lab; not in Beat 6
    const onGlint = st.glint * (story ? 1 : D.labLbl * 0.7)
    const wpp = D.wpp
    for (let k = 0; k < 2; k++) {
      const sgn = k === 0 ? 1 : -1
      const ang = D.psi + Math.PI / 4 + sgn * (Math.PI / 4) * Math.sin(0.3 * phi)
      let x = glintPos[k * 3] + Math.cos(k === 0 ? gphi : -gphi) * 0.22
      let y = glintPos[k * 3 + 1] + Math.sin(k === 0 ? gphi : -gphi) * 0.22
      let dx = Math.cos(ang)
      let dy = Math.sin(ang)
      let len = alen * 0.8
      if (flyT > 0 && story) {
        const tx = D.tileX + (k === 0 ? TILE_DOCK.rx : TILE_DOCK.cx) * wpp
        const ty = D.tileY - (k === 0 ? TILE_DOCK.ry : TILE_DOCK.cy) * wpp
        const e = flyT * flyT * (3 - 2 * flyT)
        x = lerp(x, tx, e)
        y = lerp(y, ty + Math.sin(e * Math.PI) * 0.35, e)
        // both settle horizontal (↔ x): the header glyph they become
        dx = lerp(dx, 1, e)
        dy = lerp(dy, 0, e)
        len = lerp(len, TILE_DOCK.len * wpp, e)
      }
      writeArrow(pos, 10 + k * 10, x, y, 0.02, dx, dy, len, 0.3)
      const aa = story ? onGlint * dockFade : onGlint * 0.6
      for (let v = 0; v < 10; v++) al[10 + k * 10 + v] = aa
    }
    arrows.geo.attributes.position.needsUpdate = true
    arrows.geo.attributes.aAlpha.needsUpdate = true

    /* ── label anchors ── */
    openLabel.current.position.set(D.loopX, D.loopY - (mob ? 0.42 : 0.5), 0)
    const tr = mob ? 0.3 : 0.5
    const xMax = mob ? 1.3 : 99
    tagR.current.position.set(Math.min(xMax, glintPos[0] + Math.cos(gphi) * tr), glintPos[1] + Math.sin(gphi) * tr, 0)
    tagL.current.position.set(Math.min(xMax, glintPos[3] + Math.cos(-gphi) * tr), glintPos[4] + Math.sin(-gphi) * tr, 0)
    capLoop.current.position.set(mob ? 0 : D.loopX, D.loopY - loopR - (mob ? 0.3 : 0.42), 0)
    capLab.current.position.set(D.loopX, D.loopY - loopR - 0.3, 0)
  }, { priority: -1 })

  const aVal = () => D.sp[S.aha]
  const inAha = () => D.v[S.aha]
  return (
    <>
      <group ref={group}>
        <Filament ref={closed} points={closedPts} count={NC} closed width={HANDOFF.H2.width} />
        <Filament ref={open} points={openPts} count={NO} width={HANDOFF.H1.width} beads />
      </group>
      <lineSegments ref={haloRef} geometry={halo.geo} material={halo.mat} frustumCulled={false} visible={false} />
      <lineSegments geometry={snap.geo} material={snap.mat} frustumCulled={false} />
      <GlowPoints ref={glints} positions={glintPos} sizes={glintSize} alphas={glintAlpha} colors={glintCol} minPixels={3} maxPixels={40} intensity={1.6} />
      <lineSegments geometry={arrows.geo} material={arrows.mat} frustumCulled={false} renderOrder={3} />

      <group ref={openLabel}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="field" opacity={() => inAha() * smoothstep(0.12, 0.15, aVal()) * (1 - smoothstep(0.2, 0.23, aVal()))}>
          Open string · first vibration · 1 arrow
          <br />
          Spin 1 · massless
        </SceneLabel>
      </group>
      <group ref={tagR}>
        <SceneLabel position={[0, 0, 0]} align="center" tone="field" opacity={() => inAha() * smoothstep(0.32, 0.35, aVal()) * (1 - smoothstep(0.42, 0.45, aVal()))}>
          ↺ right-moving
        </SceneLabel>
      </group>
      <group ref={tagL}>
        <SceneLabel position={[0, 0, 0]} align="center" tone="field" opacity={() => inAha() * smoothstep(0.32, 0.35, aVal()) * (1 - smoothstep(0.42, 0.45, aVal()))}>
          ↻ left-moving
        </SceneLabel>
      </group>
      <group ref={capLab}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={() => (D.mobile ? 0 : D.labLbl * D.loopVis)} className="gr-strcap">
          <StringCaption />
        </SceneLabel>
      </group>
      <group ref={capLoop}>
        <SceneLabel position={[0, 0, 0]} align="below" tone="dim" opacity={() => inAha() * smoothstep(0.33, 0.36, aVal()) * (1 - smoothstep(0.42, 0.45, aVal()))}>
          No point on a loop is special
          <br />→ both directions excited equally
        </SceneLabel>
      </group>
    </>
  )
}


function StringCaption() {
  const spin = useGravity((s) => s.spin)
  return (
    <>
      <span className="gr-strcap__scale">
        <Status kind="speculative" compact />
        <span>
          Loop ≈ ℓ<sub>s</sub> (unknown) · not to scale
        </span>
      </span>
      <span className="gr-strcap__row">
        <Status kind="analogy" compact />
        <span>{STRING_CAPTION[spin]}</span>
      </span>
    </>
  )
}
