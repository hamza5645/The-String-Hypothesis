import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useChapterFrame } from '@/gl'
import { rng } from '@/core/math'
import { particleScale } from '@/core/settings'
import { FLICKER, HASH, NEAR_FADE, POINT_FRAG, lineMaterial, updateMask } from '../glsl'
import { rt, win } from '../runtime'

/*
 * Inside the nucleus: tangled chromatin as hairline loops (µm), then one fibre resolves into DNA
 * wound around protein spools (nucleosomes, nm). Nothing here is labelled or lit as a "string":
 * hairlines are Ink, never warm.
 */

function lineGeo(segs: number[], cols: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  return g
}

/** Chromatin: persistent random walks confined to the nucleus (radius 3 µm), in a slab behind the cut. */
function buildChromatin() {
  const r = rng(41)
  const segs: number[] = []
  const cols: number[] = []
  const R = 2.9
  const push = (a: THREE.Vector3, b: THREE.Vector3, br: number) => {
    segs.push(a.x, a.y, a.z, b.x, b.y, b.z)
    cols.push(br, br, br, br, br, br)
  }
  const walk = (start: THREE.Vector3, dir: THREE.Vector3, steps: number, step: number, bright: (p: THREE.Vector3) => number, stiff: number) => {
    const p = start.clone()
    const d = dir.clone().normalize()
    const q = new THREE.Vector3()
    const rnd = new THREE.Vector3()
    for (let i = 0; i < steps; i++) {
      rnd.set(r() - 0.5, r() - 0.5, (r() - 0.5) * 0.6)
      d.addScaledVector(rnd, stiff).normalize()
      q.copy(p).addScaledVector(d, step)
      // confine: sphere of radius R, slab z ∈ [-1.1, 0.25]
      if (q.length() > R) d.addScaledVector(q.clone().normalize(), -0.9).normalize()
      if (q.z < -1.1) d.z = Math.abs(d.z)
      if (q.z > 0.25) d.z = -Math.abs(d.z)
      q.copy(p).addScaledVector(d, step)
      push(p, q, bright(p))
      p.copy(q)
    }
  }
  for (let k = 0; k < 70; k++) {
    const u = 2 * r() - 1
    const a = 2 * Math.PI * r()
    const rad = R * Math.cbrt(r())
    const s = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(a) * rad, Math.sqrt(1 - u * u) * Math.sin(a) * rad, -0.45 + 0.6 * (r() - 0.5))
    const d = new THREE.Vector3(r() - 0.5, r() - 0.5, (r() - 0.5) * 0.4)
    walk(s, d, 190, 0.045, () => 0.1 + 0.18 * r(), 0.7)
  }
  // the fibre we follow: through the origin along +x (both ways), a little brighter near the centre
  const bright = (p: THREE.Vector3) => 0.3 + 0.55 * Math.exp(-p.lengthSq() / 0.5)
  walk(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), 120, 0.03, bright, 0.25)
  walk(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1, 0, 0), 120, 0.03, bright, 0.25)
  return lineGeo(segs, cols)
}

/**
 * Nucleosome chain (nm), seen face-on: a straight linker through the origin along x, and on each side
 * spools (histone cores, r ≈ 3.2 nm) with DNA wrapped 1.65 left-handed turns (superhelix radius
 * 4.2 nm, pitch 2.4 nm along the spool axis ≈ z). Linkers zig-zag between spools.
 */
function buildNucleosomes(count: number) {
  const r = rng(77)
  const segs: number[] = []
  const cols: number[] = []
  const cores: THREE.Vector3[] = []
  const axes: THREE.Vector3[] = []
  const RW = 4.2
  const pitch = 2.4
  const Z = new THREE.Vector3(0, 0, 1)
  // a regular zig-zag: straight linker through the origin, spools alternating either side
  const addChain = (dir: number) => {
    const p = new THREE.Vector3(0, 0, 0)
    const t = new THREE.Vector3(dir, 0, 0)
    const prev = new THREE.Vector3()
    let first = true
    const emit = (q: THREE.Vector3, br: number) => {
      if (!first) {
        segs.push(prev.x, prev.y, prev.z, q.x, q.y, q.z)
        cols.push(br, br, br, br, br, br)
      }
      prev.copy(q)
      first = false
    }
    emit(p, 0.9)
    for (let n = 0; n < 5; n++) {
      const L = n === 0 ? 12 : 8 + 3 * r()
      for (let i = 1; i <= 16; i++) emit(p.clone().addScaledVector(t, (L * i) / 16), 0.9)
      p.addScaledVector(t, L)
      // alternate sides; wrap clockwise on one side, counter-clockwise on the other, so the DNA
      // leaves each spool heading onward
      const side = n % 2 === 0 ? -1 : 1
      const perp = new THREE.Vector3(-t.y, t.x, 0).multiplyScalar(side * dir)
      const centre = p.clone().addScaledVector(perp, RW)
      centre.z = -1.2
      cores.push(centre.clone())
      axes.push(Z.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), (r() - 0.5) * 0.3))
      const a0 = Math.atan2(p.y - centre.y, p.x - centre.x)
      const spin = -side * dir // winding sense
      const turns = 1.65
      const N = 120
      const q = new THREE.Vector3()
      for (let i = 1; i <= N; i++) {
        const th = a0 + spin * (turns * 2 * Math.PI * i) / N
        q.set(centre.x + RW * Math.cos(th), centre.y + RW * Math.sin(th), -pitch * (i / N) * turns * 0.5)
        emit(q, 0.8)
      }
      p.copy(q)
      p.z = 0
      // the next linker heads onward, zig-zagging across the axis
      const ang = (n % 2 === 0 ? 1 : -1) * dir * (0.55 + 0.2 * r())
      t.set(Math.cos(ang) * dir, Math.sin(ang), 0).normalize()
    }
  }
  addChain(1)
  addChain(-1)
  // histone cores: soft point hazes shaped like short cylinders (r ≈ 3.2 nm, h ≈ 5.7 nm)
  const n = count
  const centres = new Float32Array(n * 3)
  const rands = new Float32Array(n * 4)
  const shape = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const c = cores[i % cores.length]
    const ax = axes[i % axes.length]
    centres.set([c.x, c.y, c.z], i * 3)
    shape.set([ax.x, ax.y, ax.z], i * 3)
    rands.set([r() * 1000, r(), r(), r()], i * 4)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(centres, 3))
  g.setAttribute('aAxis', new THREE.BufferAttribute(shape, 3))
  g.setAttribute('aRand', new THREE.BufferAttribute(rands, 4))
  return { dna: lineGeo(segs, cols), cores: g }
}

const coreVert = /* glsl */ `
  ${HASH}
  ${FLICKER}
  ${NEAR_FADE}
  attribute vec3 aAxis;
  attribute vec4 aRand;
  uniform float uAlpha;
  uniform float uPx;
  uniform vec3 uColor;
  varying vec3 vCol;
  varying float vA;
  void main() {
    flicker(aRand);
    vec4 h = hash44(vec4(aRand.x, gCycle, 3.7, 1.3));
    // uniform-ish in a cylinder of radius 3.2 nm, height 5.7 nm, around the spool axis
    vec3 ax = normalize(aAxis);
    vec3 e1 = normalize(cross(ax, abs(ax.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));
    vec3 e2 = cross(ax, e1);
    float rr = 3.2 * sqrt(h.x);
    float th = 6.2831853 * h.y;
    vec3 p = position + e1 * rr * cos(th) + e2 * rr * sin(th) + ax * (h.z - 0.5) * 5.7;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = uAlpha * envelope() * nearFade(mv) * (0.5 + 0.5 * h.w);
    vCol = uColor;
    gl_PointSize = uPx * (1.1 + 0.8 * h.w);
  }
`

export function Chromatin() {
  const dpr = useThree((s) => s.viewport.dpr)
  const chroma = useMemo(() => buildChromatin(), [])
  const nuc = useMemo(() => buildNucleosomes(Math.round(16000 * particleScale())), [])
  const chromaMat = useMemo(() => lineMaterial('#9AA0AE'), [])
  const dnaMat = useMemo(() => lineMaterial('#ECE6D9'), [])
  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coreVert,
        fragmentShader: POINT_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uTauMin: { value: 0.5 },
          uTauMax: { value: 1.3 },
          uAlpha: { value: 0 },
          uPx: { value: 1 },
          uColor: { value: new THREE.Color('#8C93A3') },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useLayoutEffect(
    () => () => {
      chroma.dispose()
      nuc.dna.dispose()
      nuc.cores.dispose()
      chromaMat.dispose()
      dnaMat.dispose()
      coreMat.dispose()
    },
    [chroma, nuc, chromaMat, dnaMat, coreMat],
  )
  const cg = useRef<THREE.Group>(null!)
  const ng = useRef<THREE.Group>(null!)
  const corePts = useMemo(() => {
    const p = new THREE.Points(nuc.cores, coreMat)
    p.frustumCulled = false
    return p
  }, [nuc, coreMat])

  useChapterFrame((f) => {
    const aC = win(rt.s, -4.85, -7.2, 0.55)
    const aN = win(rt.s, -6.3, -7.95, 0.4)
    cg.current.visible = aC > 0.002
    ng.current.visible = aN > 0.002
    if (aC > 0.002) {
      const sc = 1e-6 * rt.k
      cg.current.scale.setScalar(sc)
      cg.current.rotation.set((15 * Math.PI) / 180, 0, 0)
      chromaMat.uniforms.uOpacity.value = aC
      updateMask(chromaMat.uniforms, dpr)
    }
    if (aN > 0.002) {
      const sc = 1e-9 * rt.k
      ng.current.scale.setScalar(sc)
      dnaMat.uniforms.uOpacity.value = aN * 0.9
      updateMask(dnaMat.uniforms, dpr)
      coreMat.uniforms.uAlpha.value = aN * 0.85
      coreMat.uniforms.uTime.value = rt.ta
      coreMat.uniforms.uPx.value = dpr
    }
  })

  return (
    <>
      <group ref={cg}>
        <lineSegments geometry={chroma} material={chromaMat} frustumCulled={false} />
      </group>
      <group ref={ng}>
        <lineSegments geometry={nuc.dna} material={dnaMat} frustumCulled={false} />
        <primitive object={corePts} />
      </group>
    </>
  )
}
