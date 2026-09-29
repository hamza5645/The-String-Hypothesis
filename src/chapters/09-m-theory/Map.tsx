import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { SceneLabel, useChapterFrame } from '@/gl'
import { setStageCursor } from '@/core/explore'
import { prefersReducedMotion } from '@/core/time'
import { settings } from '@/core/settings'
import { Status } from '@/ui'
import { S } from './director'
import { N_CAPS, createFogMaterial, createSeaMaterial, createTerrainMaterial } from './materials'
import { BRIDGES, BRIDGE_INDEX, SEA, THEORIES, TIPS, tipCenter, type Theory } from './model'
import { Ribbon, type RibbonApi } from './Ribbon'
import { bridgeCurve } from './curves'
import { useM } from './store'

/* ───────────────────────── Terrain · sea · fog ───────────────────────── */

// capsule footprints (world x, z) for the reveal mask, and which bridge switches each on
const CAPS: { a: [number, number]; b: [number, number]; bridge: number }[] = (() => {
  const c = (j: number): [number, number] => {
    const p = tipCenter(j)
    return [p[0], p[2]]
  }
  const iib = c(2)
  const fork: [number, number] = [0.35, -0.25]
  return [
    { a: c(1), b: c(2), bridge: BRIDGE_INDEX['t-ii'] },
    { a: c(4), b: c(5), bridge: BRIDGE_INDEX['t-het'] },
    { a: c(3), b: c(4), bridge: BRIDGE_INDEX['s-i-ho'] },
    { a: iib, b: [iib[0] - 1.15, iib[1] + 0.49], bridge: BRIDGE_INDEX['s-iib'] },
    { a: c(1), b: c(0), bridge: BRIDGE_INDEX['l-iia'] },
    { a: c(5), b: c(0), bridge: BRIDGE_INDEX['l-he'] },
    { a: c(1), b: fork, bridge: BRIDGE_INDEX['c-k3'] },
    { a: fork, b: c(4), bridge: BRIDGE_INDEX['c-k3'] },
    { a: fork, b: c(5), bridge: BRIDGE_INDEX['c-k3'] },
  ]
})()

function Terrain() {
  const mat = useMemo(() => createTerrainMaterial(), [])
  const geo = useMemo(() => {
    // the landmass fits inside ±6.1; 200 segments over 12.8 units ≈ 0.064 per cell (80k triangles)
    const g = new THREE.PlaneGeometry(12.8, 12.8, 200, 200)
    g.rotateX(-Math.PI / 2)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
    return g
  }, [])
  const mesh = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => {
    const u = mat.uniforms
    for (let k = 0; k < N_CAPS; k++) {
      const c = CAPS[k]
      ;(u.uCap.value as THREE.Vector4[])[k].set(c.a[0], c.a[1], c.b[0], c.b[1])
    }
    return () => {
      geo.dispose()
      mat.dispose()
    }
  }, [geo, mat])
  useChapterFrame(() => {
    const u = mat.uniforms
    const amp = u.uAmp.value as number[]
    const fl = u.uFlash.value as number[]
    for (let j = 0; j < 6; j++) {
      amp[j] = S.amp[j]
      fl[j] = S.flash[j]
    }
    const on = u.uCapOn.value as number[]
    for (let k = 0; k < N_CAPS; k++) on[k] = S.bridge[CAPS[k].bridge]
    u.uMaskFull.value = S.maskFull
    u.uReveal.value = S.reveal
    u.uTopo.value = S.topo
    u.uFocusW.value = Math.max(S.shore, S.sFocus)
    const foc = u.uFocus.value as number[]
    for (let j = 0; j < 6; j++) foc[j] = S.sFocus > 0 ? (j === 3 || j === 4 ? 1 : 0) : j === 1 ? 1 : 0
    // while a close-up owns the frame the land itself fades out (not just darkens), so no silhouettes remain
    u.uFade.value = S.mapFade * (1 - S.focus)
    u.uDim.value = S.mapDim
    u.uShore.value = S.shore
    u.uGC.value = S.gContours
    if (mesh.current) mesh.current.visible = S.mapFade > 0.003
  })
  return <mesh ref={mesh} geometry={geo} material={mat} renderOrder={-2} frustumCulled={false} />
}

function Sea() {
  const mat = useMemo(() => createSeaMaterial(), [])
  const mesh = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => () => mat.dispose(), [mat])
  useChapterFrame(() => {
    const u = mat.uniforms
    u.uFill.value = S.seaFill
    u.uFade.value = S.mapFade
    u.uDim.value = 0.35 + 0.65 * S.mapDim
    if (mesh.current) mesh.current.visible = S.mapFade > 0.003
  })
  return (
    <mesh ref={mesh} material={mat} position={[0, SEA, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[40, 40]} />
    </mesh>
  )
}

const FOG_Y = [0.08, 0.24, 0.4, 0.56, 0.72]
function Fog() {
  const n = settings().quality === 'low' ? 3 : FOG_Y.length
  const mats = useMemo(() => FOG_Y.slice(0, n).map((y) => createFogMaterial(y)), [n])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(13.5, 13.5)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const group = useRef<THREE.Group>(null)
  useLayoutEffect(
    () => () => {
      mats.forEach((m) => m.dispose())
      geo.dispose()
    },
    [mats, geo],
  )
  useChapterFrame((f) => {
    const amt = S.fog * S.mapFade * S.mapDim
    if (group.current) group.current.visible = amt > 0.003
    const t = prefersReducedMotion() ? 0 : f.t
    for (const m of mats) {
      m.uniforms.uAmt.value = amt * (0.55 / mats.length) * 1.6
      m.uniforms.uT.value = t
    }
  })
  return (
    <group ref={group}>
      {mats.map((m, i) => (
        <mesh key={i} geometry={geo} material={m} position={[0, FOG_Y[i], 0]} renderOrder={3} frustumCulled={false} />
      ))}
    </group>
  )
}

/* ───────────────────────── Labels on the landmass ───────────────────────── */

function CuspLabels() {
  return (
    <>
      {TIPS.map((tip, j) => {
        const th = (tip.theta * Math.PI) / 180
        const r = 6.75
        return (
          <SceneLabel key={tip.id} position={[r * Math.cos(th), 0.15, -r * Math.sin(th)]} align="center" tone={j === 0 ? 'field' : 'dim'} opacity={() => S.cusps * S.mapFade * (1 - S.focus)}>
            <span className="mth-cusp">
              <b>{j === 0 ? '11D' : tip.short === 'I' ? 'TYPE I' : tip.short}</b>
              <span>{j === 0 ? 'SIZES ≫ ℓ₁₁' : 'g → 0'}</span>
            </span>
          </SceneLabel>
        )
      })}
      <SceneLabel position={[0, 0.7, 0.35]} align="center" tone="dim" opacity={() => S.fog * S.mapFade * (1 - S.focus)}>
        <span className="mth-fog-label">
          <b>g ≈ 1</b>
          <span>NO WEAKLY COUPLED DESCRIPTION</span>
        </span>
      </SceneLabel>
    </>
  )
}

/** Beat 6: one survey marker near the 11D tip — Matrix theory, special backgrounds only. */
function Flag() {
  const base: [number, number, number] = [1.35, SEA, -4.2]
  const pole = useRef<RibbonApi>(null)
  const pennant = useRef<RibbonApi>(null)
  useChapterFrame(() => {
    const op = S.flag * S.mapFade
    const a = pole.current
    const b = pennant.current
    if (a) {
      a.mesh.visible = op > 0.003
      a.material.uniforms.uOpacity.value = op
    }
    if (b) {
      b.mesh.visible = op > 0.003
      b.material.uniforms.uOpacity.value = op
    }
  })
  return (
    <group position={base}>
      <Ribbon
        ref={pole}
        count={2}
        width={0.02}
        minPx={0.7}
        init={(i, P) => {
          P[i * 3] = 0
          P[i * 3 + 1] = i === 0 ? 0 : 1.35
          P[i * 3 + 2] = 0
        }}
      />
      <Ribbon
        ref={pennant}
        count={3}
        closed
        width={0.02}
        minPx={0.7}
        init={(i, P) => {
          const pts = [
            [0, 1.35, 0],
            [0.5, 1.2, 0],
            [0, 1.05, 0],
          ]
          P.set(pts[i], i * 3)
        }}
      />
      <SceneLabel position={[0.55, 1.2, 0]} align="left" tone="field" opacity={() => S.flag * S.mapFade}>
        <span className="mth-flag">
          <span className="mth-stack mth-stack--l">
            MATRIX THEORY<span className="mth-hide-m"> (BFSS 1996)</span>
            <span className="mth-show-m">
              <br />
              (BFSS 1996)
            </span>
            <span className="mth-hide-m">
              <br />
              SPECIAL BACKGROUNDS
            </span>
          </span>
          <Status kind="conjectured" compact />
        </span>
      </SceneLabel>
    </group>
  )
}

/* ───────────────────────── Lab: hover / tap targets ───────────────────────── */

const hidden = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
const noRay = () => {}

function HitTargets() {
  const setFocus = useM((s) => s.setFocus)
  const openDial = useM((s) => s.openDial)
  const on = useRef(false)
  const islands = useRef<(THREE.Mesh | null)[]>([])
  const bridges = useRef<(THREE.Mesh | null)[]>([])
  const gap = useRef<THREE.Mesh>(null)
  const cyl = useMemo(() => new THREE.CylinderGeometry(1.05, 1.05, 2.4, 16, 1), [])
  const tubes = useMemo(
    () =>
      BRIDGES.map((b) => {
        const pts = bridgeCurve(b.id, 24).map((p) => new THREE.Vector3(...p))
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.28, 6, false)
      }),
    [],
  )
  const gapGeo = useMemo(() => {
    const a = tipCenter(2)
    const b = tipCenter(3)
    const pts = [new THREE.Vector3(a[0] * 0.92, 0.5, a[2] * 0.92), new THREE.Vector3(b[0] * 0.92 + 0.8, 0.5, b[2] * 0.92)]
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.45, 6, false)
  }, [])
  useLayoutEffect(
    () => () => {
      cyl.dispose()
      tubes.forEach((t) => t.dispose())
      gapGeo.dispose()
    },
    [cyl, tubes, gapGeo],
  )

  useChapterFrame((f) => {
    const active = S.seg === 'lab' && useM.getState().station === 'map' && S.labW > 0.6 && f.h.active()
    if (active !== on.current) {
      on.current = active
      if (!active) setStageCursor('')
      const r = active ? THREE.Mesh.prototype.raycast : noRay
      islands.current.forEach((m) => m && (m.raycast = r))
      if (gap.current) gap.current.raycast = r
    }
    bridges.current.forEach((m, i) => {
      if (!m) return
      m.raycast = active && S.bridge[i] > 0.95 ? THREE.Mesh.prototype.raycast : noRay
    })
  })

  const over = (key: string) => (e: ThreeEvent<PointerEvent>) => {
    if (!on.current) return
    e.stopPropagation()
    setFocus(key)
    setStageCursor('pointer')
  }
  const out = (key: string) => () => {
    if (!on.current) return
    if (useM.getState().focus === key) setFocus(null)
    setStageCursor('')
  }

  return (
    <group>
      {TIPS.map((tip, j) => {
        const c = tipCenter(j)
        return (
          <mesh
            key={tip.id}
            ref={(m) => {
              islands.current[j] = m
              if (m) m.raycast = noRay
            }}
            geometry={cyl}
            material={hidden}
            position={[c[0], 1.1, c[2]]}
            onPointerOver={over(`tip:${j}`)}
            onPointerOut={out(`tip:${j}`)}
            onClick={(e) => {
              if (!on.current) return
              e.stopPropagation()
              if ((e.nativeEvent as PointerEvent).pointerType === 'mouse' && THEORIES.includes(tip.id as Theory)) openDial(tip.id as Theory)
              else setFocus(`tip:${j}`)
            }}
          />
        )
      })}
      {BRIDGES.map((b, i) => (
        <mesh
          key={b.id}
          ref={(m) => {
            bridges.current[i] = m
            if (m) m.raycast = noRay
          }}
          geometry={tubes[i]}
          material={hidden}
          onPointerOver={over(`bridge:${b.id}`)}
          onPointerOut={out(`bridge:${b.id}`)}
          onClick={(e) => {
            if (!on.current) return
            e.stopPropagation()
            setFocus(`bridge:${b.id}`)
          }}
        />
      ))}
      <mesh
        ref={(m) => {
          gap.current = m
          if (m) m.raycast = noRay
        }}
        geometry={gapGeo}
        material={hidden}
        onPointerOver={over('gap')}
        onPointerOut={out('gap')}
        onClick={(e) => {
          if (!on.current) return
          e.stopPropagation()
          setFocus('gap')
        }}
      />
    </group>
  )
}

export function MapScene() {
  return (
    <>
      <Terrain />
      <Sea />
      <Fog />
      <CuspLabels />
      <Flag />
      <HitTargets />
    </>
  )
}
