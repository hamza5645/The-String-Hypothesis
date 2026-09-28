import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, GlowPoint, useChapterFrame, type GlowPointApi } from '@/gl'
import { lerp, smoothstep } from '@/core/math'
import { Status } from '@/ui'
import { D } from './director'
import { createSheetMaterial, lineMaterial, makeSegments } from './gl'
import { HANDLE_W0, holeHeight } from './model'
import { Tag, useDispose, type TagApi } from './parts'
import { X_BUBBLE, X_HANDLE } from './stageConsts'
import { useImplicitMesh } from './useImplicitMesh'

const ARC = 32

/**
 * Beat 5. Left: a particle loop — a worldline splits at x and rejoins at y (a lens of two arcs); the squeeze
 * slides x and y together until the loop collapses to a point (schematic). Right: a string loop (a handle),
 * Φ with c(t) = 1.7·exp(−((t−5)/w)²). One mesh baked at w = 1.5 serves every w exactly (t rescaled about 5
 * by w/1.5 in the vertex shader). The squeeze drives w 2.4 → 1.5 and stops: the hole is 0.811·w tall and
 * cannot shrink to a point. Then w 1.5 → 4: the only escape is a long tube.
 */
export function Loops() {
  const group = useRef<THREE.Group>(null!)
  const geo = useImplicitMesh('handle')
  const mat = useMemo(() => {
    const m = createSheetMaterial()
    m.uniforms.uFill.value = 0.06
    return m
  }, [])
  const flare = useRef<GlowPointApi>(null)
  const eventA = useRef<GlowPointApi>(null)
  const eventB = useRef<GlowPointApi>(null)
  const sizeTag = useRef<TagApi>(null)
  const holeTag = useRef<TagApi>(null)
  const { bubble, bubbleMat, brackets, brMat } = useMemo(() => {
    const bubbleMat = lineMaterial(COLORS.field, 0)
    // in, arc L, arc R, out → one line strip each (segments form)
    const bubble = makeSegments(new Float32Array((2 + 2 * ARC * 2 + 2) * 3), bubbleMat)
    const brMat = lineMaterial(COLORS.ink, 0)
    const brackets = makeSegments(new Float32Array(12 * 3), brMat)
    return { bubble, bubbleMat, brackets, brMat }
  }, [])
  // (the handle geometry is cached across remounts by useImplicitMesh)
  useDispose(mat, bubble, brackets)

  useChapterFrame(() => {
    const w = D.w.loops
    group.current.visible = w > 0.003
    if (!group.current.visible) return
    const pl = D.p.loops
    const wv = D.w5
    const mobStrings = D.portrait ? (D.sl.showPants ? 1 : 0) : 1
    const mobParticles = D.portrait ? (D.sl.showY ? 1 : 0) : 1

    // string loop
    mat.uniforms.uTScale.value = wv / HANDLE_W0
    mat.uniforms.uOpacity.value = w * mobStrings
    const hh = holeHeight(wv) / 2
    // clamp brackets press on the hole; they stop where the hole stops (w = 1.5)
    const gap = lerp(0.35, 0.0, smoothstep(0.08, 0.45, pl)) + 0.02 * Math.sin(Math.min(1, smoothstep(0.45, 0.58, pl)) * Math.PI * 3)
    const bp = brackets.geometry.getAttribute('position') as THREE.BufferAttribute
    const ya = 5 + hh + gap + 0.04
    const yb = 5 - hh - gap - 0.04
    const hx = 0.5
    const pts = [
      [-hx, ya + 0.12, 0, -hx, ya, 0],
      [-hx, ya, 0, hx, ya, 0],
      [hx, ya, 0, hx, ya + 0.12, 0],
      [-hx, yb - 0.12, 0, -hx, yb, 0],
      [-hx, yb, 0, hx, yb, 0],
      [hx, yb, 0, hx, yb - 0.12, 0],
    ]
    let o = 0
    for (const s of pts) {
      bp.setXYZ(o++, s[0], s[1], s[2])
      bp.setXYZ(o++, s[3], s[4], s[5])
    }
    bp.needsUpdate = true
    brMat.opacity = w * mobStrings * smoothstep(0.06, 0.14, pl) * (1 - smoothstep(0.6, 0.68, pl))
    holeTag.current?.setText(`HOLE ${(2 * hh).toFixed(2)} ℓ`)

    // particle loop (lens) — collapses to a point
    const k = D.bubble
    const hb = 0.975 * k
    const wb = 0.78 * k
    const P = bubble.geometry.getAttribute('position') as THREE.BufferAttribute
    let i = 0
    const put = (x: number, y: number) => P.setXYZ(i++, X_BUBBLE + x, y, 0)
    put(0, 0)
    put(0, 5 - hb)
    for (const sg of [-1, 1])
      for (let j = 0; j < ARC; j++) {
        const a0 = j / ARC
        const a1 = (j + 1) / ARC
        put(sg * wb * Math.sin(Math.PI * a0), 5 - hb + 2 * hb * a0)
        put(sg * wb * Math.sin(Math.PI * a1), 5 - hb + 2 * hb * a1)
      }
    put(0, 5 + hb)
    put(0, 10)
    P.needsUpdate = true
    bubbleMat.opacity = 0.85 * w * mobParticles
    eventA.current?.position.set(X_BUBBLE, 5 - hb, 0)
    eventB.current?.position.set(X_BUBBLE, 5 + hb, 0)
    const ev = 0.8 * w * mobParticles * smoothstep(0.02, 0.2, k)
    if (eventA.current) eventA.current.material.uniforms.uIntensity.value = ev
    if (eventB.current) eventB.current.material.uniforms.uIntensity.value = ev
    if (flare.current) flare.current.material.uniforms.uIntensity.value = w * mobParticles * (1 - smoothstep(0.0, 0.25, k)) * 1.2
    sizeTag.current?.setText(k < 0.02 ? 'LOOP SIZE → 0 · CONTRIBUTION → ∞' : `LOOP SIZE ${(2 * hb).toFixed(2)} ℓ`)
  })

  return (
    <group ref={group}>
      <primitive object={bubble} />
      <GlowPoint ref={eventA} size={0.2} minPixels={2} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} />
      <GlowPoint ref={eventB} size={0.2} minPixels={2} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} />
      <GlowPoint ref={flare} position={[X_BUBBLE, 5, 0]} size={0.5} minPixels={3} color={COLORS.ink} coreColor="#FFFFFF" intensity={0} />
      <Tag position={[X_BUBBLE, 10.6, 0]} align="center" tone="ink" opacity={() => D.w.loops * (D.portrait && !D.sl.showY ? 0 : 1)}>
        PARTICLES · A LOOP
      </Tag>
      <Tag ref={sizeTag} position={[X_BUBBLE, -0.8, 0]} align="center" tone="field" opacity={() => D.w.loops * (D.portrait && !D.sl.showY ? 0 : 1) * smoothstep(0.04, 0.1, D.p.loops)}>
        <Status kind="analogy" compact />{' '}
      </Tag>

      <group position={[X_HANDLE, 0, 0]}>
        {geo && <mesh geometry={geo} material={mat} renderOrder={1} />}
        <primitive object={brackets} />
        <Tag position={[0, 10.6, 0]} align="center" tone="ink" opacity={() => D.w.loops * (D.portrait && !D.sl.showPants ? 0 : 1)}>
          STRINGS · A LOOP
        </Tag>
        <Tag position={[0, 10.2, 0]} align="center" tone="dim" opacity={() => D.w.loops * (D.portrait && !D.sl.showPants ? 0 : 1) * Math.max(0.85, D.deeper.bh * 1.2)}>
          b = 2 OPENINGS · h = 1 HANDLE
        </Tag>
        <Tag ref={holeTag} position={[0, -0.8, 0]} align="center" tone="field" opacity={() => D.w.loops * (D.portrait && !D.sl.showPants ? 0 : 1) * smoothstep(0.06, 0.12, D.p.loops)} />
        <Tag position={[0, 3.35, 1.6]} align="below" tone="ink" opacity={() => D.w.loops * smoothstep(0.45, 0.5, D.p.loops) * (1 - smoothstep(0.58, 0.64, D.p.loops))}>
          NO SHRINKING TO A POINT
        </Tag>
        <Tag position={[0, -1.3, 0]} align="center" tone="ink" opacity={() => D.w.loops * smoothstep(0.66, 0.74, D.p.loops)}>
          THE ONLY ESCAPE IS A LONG TUBE
        </Tag>
        <Tag position={[0, -1.75, 0]} align="center" tone="dim" opacity={() => D.w.loops * smoothstep(0.7, 0.78, D.p.loops)}>
          LONG-DISTANCE PHYSICS, NOT A SHORT-DISTANCE INFINITY
        </Tag>
      </group>
    </group>
  )
}
