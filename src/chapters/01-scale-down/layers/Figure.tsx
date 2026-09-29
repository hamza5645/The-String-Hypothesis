import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useChapterFrame, COLORS } from '@/gl'
import { explore } from '@/core/explore'
import { damp } from '@/core/math'
import { ambient } from '@/core/time'
import { HASH, NEAR_FADE, POINT_FRAG_MASKED, maskUniforms, updateMask } from '../glsl'
import type { Cloud } from '../body'
import { useFigureCloud } from '../cloud'
import { rt, win } from '../runtime'

const SWIRL = { x: -0.45, y: -0.55, z: -0.35 }
const NONE: Cloud = { positions: new Float32Array(0), normals: new Float32Array(0), starts: new Float32Array(0), rands: new Float32Array(0), count: 0 }

const vert = /* glsl */ `
  ${HASH}
  ${NEAR_FADE}
  attribute vec3 aStart;
  attribute vec3 aNormal;
  attribute vec4 aRand;
  uniform float uAssemble;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uPx;
  uniform vec3 uSwirl;
  uniform vec3 uColor;
  uniform float uFloorFade;
  varying vec3 vCol;
  varying float vA;
  void main() {
    float e = clamp((uAssemble - aRand.x * 0.55) / 0.45, 0.0, 1.0);
    e = e * e * (3.0 - 2.0 * e);
    // swirl in from a loose sphere
    float ang = (1.0 - e) * (1.8 + 1.6 * aRand.y);
    vec3 s = aStart - uSwirl;
    float c = cos(ang);
    float sn = sin(ang);
    s = vec3(c * s.x - sn * s.z, s.y + (1.0 - e) * 0.12 * sin(ang * 2.0), sn * s.x + c * s.z) + uSwirl;
    vec3 p = mix(s, position, e);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float sh = 0.8 + 0.2 * sin(uTime * (0.7 + 1.5 * aRand.y) + aRand.y * 61.0);
    // phones: the legs dissolve into the text area at the bottom
    float floorFade = uFloorFade < 0.0 ? smoothstep(-1.55, uFloorFade, position.y) : 1.0;
    // surfaces facing away recede (a solid read, not an X-ray); silhouettes keep their light
    float facing = dot(normalize(normalMatrix * aNormal), -normalize(mv.xyz));
    float solid = mix(1.0, mix(0.22, 1.0, smoothstep(-0.3, 0.3, facing)), e);
    vA = uAlpha * aRand.w * sh * smoothstep(0.0, 0.4, e) * nearFade(mv) * floorFade * solid;
    vCol = uColor;
    gl_PointSize = uPx * (1.0 + 0.9 * aRand.z);
  }
`

/**
 * A figure made of points. `withBody` = the whole person (opening); otherwise the hand alone, far
 * denser, for the zoom onto the fingertip. The index-finger pad sits at the local origin = the focus.
 * The points are sampled off the main thread (cloud.ts); until they arrive the figure draws nothing,
 * then fades in over 0.4 s.
 */
export function Figure({ withBody, count, seed, hi, lo, alpha }: { withBody: boolean; count: number; seed: number; hi: number; lo: number; alpha: number }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const cloud = useFigureCloud({ withBody, count, seed, swirl: { ...SWIRL, r: withBody ? 1.25 : 0.2 } }) ?? NONE
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(cloud.positions.subarray(0, cloud.count * 3), 3))
    g.setAttribute('aStart', new THREE.BufferAttribute(cloud.starts.subarray(0, cloud.count * 3), 3))
    g.setAttribute('aNormal', new THREE.BufferAttribute(cloud.normals.subarray(0, cloud.count * 3), 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(cloud.rands.subarray(0, cloud.count * 4), 4))
    return g
  }, [cloud])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: POINT_FRAG_MASKED,
        uniforms: {
          uAssemble: { value: 1 },
          uTime: { value: 0 },
          uAlpha: { value: 0 },
          uPx: { value: 1 },
          uSwirl: { value: new THREE.Vector3(SWIRL.x, SWIRL.y, SWIRL.z) },
          uColor: { value: new THREE.Color(COLORS.ink) },
          uFloorFade: { value: 0 },
          ...maskUniforms(),
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => () => material.dispose(), [material])
  const pts = useMemo(() => {
    const p = new THREE.Points(geometry, material)
    p.frustumCulled = false
    return p
  }, [geometry, material])
  const group = useRef<THREE.Group>(null!)
  const yaw = useRef(0)
  const fadeIn = useRef(0)

  useChapterFrame((f) => {
    // fade in once the cloud has arrived (at once when the stage clock is frozen)
    fadeIn.current = cloud.count === 0 ? 0 : f.dt > 0 ? Math.min(1, fadeIn.current + f.dt / 0.4) : 1
    const a = win(rt.s, hi, lo, 0.5) * alpha * fadeIn.current
    const g = group.current
    g.visible = a > 0.002
    if (!g.visible) return
    const u = material.uniforms
    u.uAlpha.value = a
    u.uTime.value = rt.ta
    u.uPx.value = dpr
    u.uAssemble.value = withBody ? rt.assemble : 1
    u.uFloorFade.value = rt.mobile && withBody ? -0.75 : 0
    updateMask(u, dpr)
    const sc = rt.k // local unit = 1 m
    g.scale.setScalar(sc)
    g.position.set(0, 0, 0)
    // the figure yaws ±6° with pointer parallax, pivoting on the fingertip (which stays on the reticle)
    const target = explore.hovering && f.h.active() ? explore.nx * 0.105 * ambient() : 0
    yaw.current = f.dt > 0 ? damp(yaw.current, target, 2.2, f.dt) : target
    g.rotation.y = yaw.current
  })

  return (
    <group ref={group}>
      <primitive object={pts} />
    </group>
  )
}
