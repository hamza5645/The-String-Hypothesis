import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { journey, warmNeighbours } from '../journey'
import { settings } from '../settings'
import { clock } from '../time'
import { portalRegistry } from './registry'

const VOID = new THREE.Color('#05070B')

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// Dissolve: both scenes are sampled with ONE shared transform (so identical handoff objects
// coincide exactly) that gently "breathes" (s = 1 − 0.03·sin πt, exactly 1 at both ends); a soft
// noise field staggers the dissolve and bright features of the incoming scene surface first.
// k is exactly 0 at t = 0 and exactly 1 at t = 1, so there is no pop entering/leaving the RT path.
const mixFrag = /* glsl */ `
  uniform sampler2D tA;
  uniform sampler2D tB;
  uniform float uMix;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    float t = uMix;
    float s = 1.0 - 0.03 * sin(3.14159265 * t);
    vec2 uv = 0.5 + (vUv - 0.5) * s;
    vec3 a = texture2D(tA, uv).rgb;
    vec3 b = texture2D(tB, uv).rgb;
    float n = noise(vec2(vUv.x * uAspect, vUv.y) * 2.6 + uTime * 0.03);
    float lb = dot(b, vec3(0.299, 0.587, 0.114));
    float jitter = ((n - 0.5) * 0.4 + lb * 0.2) * 4.0 * t * (1.0 - t);
    float k = clamp(t * 1.5 - 0.25 + jitter, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    gl_FragColor = vec4(mix(a, b, k), 1.0);
  }
`

const fadeFrag = /* glsl */ `
  uniform float uAlpha;
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, uAlpha); }
`

/**
 * Takes over rendering (useFrame priority 1).
 * - One visible chapter: render its scene straight to the screen (cheap path).
 * - Two visible chapters (a boundary): render both to render targets and dissolve.
 * - Low tier: no render targets; dip to black between chapters.
 */
export function Compositor() {
  const gl = useThree((s) => s.gl)

  const { quadScene, quadCam, mixMat, fadeMat, rtA, rtB } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
    const mixMat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: mixFrag,
      uniforms: {
        tA: { value: null },
        tB: { value: null },
        uMix: { value: 0 },
        uAspect: { value: 1 },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const fadeMat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: fadeFrag,
      uniforms: { uAlpha: { value: 0 }, uColor: { value: VOID.clone() } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const quad = new THREE.Mesh(geo, mixMat)
    quad.frustumCulled = false
    const quadScene = new THREE.Scene()
    quadScene.add(quad)
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const opts: THREE.RenderTargetOptions = {
      samples: 4,
      depthBuffer: true,
      stencilBuffer: false,
      resolveDepthBuffer: false,
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
    }
    const rtA = new THREE.WebGLRenderTarget(2, 2, opts)
    const rtB = new THREE.WebGLRenderTarget(2, 2, opts)
    return { quadScene, quadCam, mixMat, fadeMat, rtA, rtB, quad }
  }, [])

  useEffect(() => {
    gl.setClearColor(VOID, 1)
    // harness/perf-audit hook: per-frame renderer stats (info auto-resets each frame render call; we reset manually)
    gl.info.autoReset = false
    ;(window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl
    return () => {
      rtA.dispose()
      rtB.dispose()
      mixMat.dispose()
      fadeMat.dispose()
    }
  }, [gl, rtA, rtB, mixMat, fadeMat])

  const buf = useMemo(() => new THREE.Vector2(), [])
  const quad = quadScene.children[0] as THREE.Mesh

  const readyFrames = useMemo(() => ({ n: 0, idle: 0, allocated: false }), [])

  useFrame(() => {
    gl.info.reset()
    const cs = journey.chapters
    let ia = -1
    let ib = -1
    for (let i = 0; i < cs.length; i++) {
      if (cs[i].presence > 0.0005) {
        if (ia < 0) ia = i
        else if (ib < 0) ib = i
      }
    }
    const ea = ia >= 0 ? portalRegistry.get(cs[ia].id) : undefined
    const eb = ib >= 0 ? portalRegistry.get(cs[ib].id) : undefined
    const pa = ia >= 0 ? cs[ia].presence : 0
    const pb = ib >= 0 ? cs[ib].presence : 0
    const low = settings().quality === 'low'
    // screenshot harness: signal once a registered scene has drawn a few frames
    if (ea || eb) {
      readyFrames.n++
      if (readyFrames.n === 8) {
        ;(window as unknown as { __stageReady: boolean }).__stageReady = true
        // the first scene is up: let neighbouring chapters mount once the browser has breathing room
        window.setTimeout(() => {
          if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => warmNeighbours(), { timeout: 2500 })
          else warmNeighbours()
        }, 1200)
      }
    }

    // Scene renders use three's default autoClear (so a chapter's own background clears correctly
    // and chapter-level offscreen passes behave normally); only the overlay quad passes disable it.
    gl.setRenderTarget(null)
    gl.setClearColor(VOID, 1)

    if (ea && eb && !low) {
      gl.getDrawingBufferSize(buf)
      // MSAA only where it matters: at high pixel ratios the dissolve is antialiased enough without it
      const samples = gl.getPixelRatio() >= 1.5 ? 0 : 4
      if (rtA.samples !== samples) {
        rtA.dispose()
        rtB.dispose()
        rtA.samples = rtB.samples = samples
      }
      if (rtA.width !== buf.x || rtA.height !== buf.y) {
        rtA.setSize(buf.x, buf.y)
        rtB.setSize(buf.x, buf.y)
      }
      readyFrames.idle = 0
      readyFrames.allocated = true
      gl.setRenderTarget(rtA)
      gl.render(ea.scene, ea.getCamera())
      gl.setRenderTarget(rtB)
      gl.render(eb.scene, eb.getCamera())
      gl.setRenderTarget(null)
      quad.material = mixMat
      mixMat.uniforms.tA.value = rtA.texture
      mixMat.uniforms.tB.value = rtB.texture
      mixMat.uniforms.uMix.value = pb / Math.max(1e-4, pa + pb)
      mixMat.uniforms.uAspect.value = buf.x / Math.max(1, buf.y)
      mixMat.uniforms.uTime.value = clock.t
      gl.autoClear = false
      gl.render(quadScene, quadCam)
      gl.autoClear = true
      return
    }

    // free the dissolve targets once we've been on the cheap path for a while (three re-allocates lazily)
    if (readyFrames.allocated && (++readyFrames.idle > 180 || low)) {
      rtA.dispose()
      rtB.dispose()
      readyFrames.allocated = false
    }

    // Single scene (or low tier): draw the dominant one, dip towards black by (1 - presence).
    let entry = ea
    let presence = pa
    if (eb && (pb > pa || !ea)) {
      entry = eb
      presence = pb
    }
    if (entry) gl.render(entry.scene, entry.getCamera())
    else gl.clear()
    const dip = low && ea && eb ? Math.abs(pa - pb) : presence
    const alpha = 1 - Math.min(1, dip)
    if (alpha > 0.002) {
      quad.material = fadeMat
      fadeMat.uniforms.uAlpha.value = alpha
      gl.autoClear = false
      gl.render(quadScene, quadCam)
      gl.autoClear = true
    }
  }, 1)

  return null
}
