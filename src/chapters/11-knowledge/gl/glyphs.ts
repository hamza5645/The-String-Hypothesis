import * as THREE from 'three'
import { screenMask } from './lines'

/*
 * Claim glyphs — Model §2: instanced billboards, ONE draw call; the glyph's shape IS its chip.
 *   ● fill · ◑ ring + right half filled · ◌ 12-dash ring · ○ ring · ghost: 16-dash Ink-3 ring
 * Size 0.26 world units, clamped to 14–28 px (quad diameter). The quad is drawn 2× larger so a
 * pop / pulse ring can expand beyond the glyph. Node colors are status colors, never Filament.
 *
 * Per instance: iPos (xyz), iA = (chip, scale, visibility a, pulse), iB = (hover, brightness, ghostOn, _).
 */

const vert = /* glsl */ `
  attribute vec3 iPos;
  attribute vec4 iA;
  attribute vec4 iB;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uSize;
  uniform float uMinPx;
  uniform float uMaxPx;
  varying vec2 vUv;
  varying vec4 vA;
  varying vec4 vB;
  void main() {
    vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
    vec4 clip = projectionMatrix * mv;
    float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
    // half the quad (glyph box) in drawing-buffer px, clamped to [minPx, maxPx] / 2
    float halfPx = 0.5 * uSize * ws * projectionMatrix[1][1] / max(clip.w, 1e-5) * uRes.y * 0.5;
    halfPx = clamp(halfPx, 0.5 * uMinPx * uDpr, 0.5 * uMaxPx * uDpr);
    halfPx *= iA.y * (1.0 + 0.25 * iB.x);
    float q = halfPx * 2.0; // drawn quad is 2x the glyph box
    clip.xy += position.xy * q / (uRes * 0.5) * clip.w;
    gl_Position = clip;
    vUv = position.xy * 2.0;
    vA = iA;
    vB = iB;
  }
`

const frag = /* glsl */ `
  uniform vec3 uCol0;
  uniform vec3 uCol1;
  uniform vec3 uCol2;
  uniform vec3 uCol3;
  uniform vec3 uGhost;
  uniform float uGhostAlpha;
  uniform float uOpacity;
  uniform float uMaskX;
  uniform float uDprF;
  varying vec2 vUv;
  varying vec4 vA;
  varying vec4 vB;
  const float TAU = 6.28318530718;
  float ringAt(float d, float r, float w, float aa) { return 1.0 - smoothstep(w - aa, w + aa, abs(d - r)); }
  void main() {
    float d = length(vUv);
    float aa = max(fwidth(d), 1e-4);
    float chip = vA.x;
    float a = vA.z;
    float fill = 1.0 - smoothstep(0.78 - aa, 0.78 + aa, d);
    float ang = atan(vUv.y, vUv.x) / TAU;
    float cov;
    vec3 col;
    // ● is drawn as a smaller solid core inside a soft ink glow (measured ground: solid, bright)
    float core0 = 1.0 - smoothstep(0.5 - aa, 0.5 + aa, d);
    if (chip < 0.5) { cov = core0; col = uCol0; }
    else if (chip < 1.5) { cov = max(ringAt(d, 0.78, 0.075, aa), fill * step(0.0, vUv.x)); col = uCol1; }
    else if (chip < 2.5) { cov = ringAt(d, 0.78, 0.085, aa) * step(fract(ang * 12.0), 0.55); col = uCol2; }
    else { cov = ringAt(d, 0.78, 0.08, aa); col = uCol3; }
    float bright = vB.y;
    float halo = chip < 0.5 ? exp(-d * d * 3.2) * 0.42 : exp(-d * d * 4.0) * 0.07;
    vec3 c = col * (cov + halo) * a * bright;
    // ghost: faded, not deleted
    float ghost = ringAt(d, 0.78, 0.05, aa) * step(fract(ang * 16.0), 0.5) * (1.0 - a) * vB.z;
    c += uGhost * ghost * uGhostAlpha;
    // pop / pulse ring (vA.w in 0..1, expanding and fading)
    float p = vA.w;
    if (p > 0.001 && p < 0.999) {
      float r = 0.78 + p * 1.05;
      c += col * ringAt(d, r, 0.035, aa) * (1.0 - p) * (1.0 - p) * 0.9 * max(a, 0.3);
    }
    float mask = uMaskX > 0.0 ? mix(0.3, 1.0, smoothstep(uMaskX - 110.0 * uDprF, uMaskX + 40.0 * uDprF, gl_FragCoord.x)) : 1.0;
    gl_FragColor = vec4(c * uOpacity * mask, 1.0);
  }
`

export type GlyphMaterial = THREE.ShaderMaterial

export function createGlyphs(count: number) {
  const g = new THREE.InstancedBufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3))
  g.setIndex([0, 1, 2, 0, 2, 3])
  const pos = new Float32Array(count * 3)
  const A = new Float32Array(count * 4)
  const B = new Float32Array(count * 4)
  const iPos = new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)
  const iA = new THREE.InstancedBufferAttribute(A, 4).setUsage(THREE.DynamicDrawUsage)
  const iB = new THREE.InstancedBufferAttribute(B, 4).setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('iPos', iPos)
  g.setAttribute('iA', iA)
  g.setAttribute('iB', iB)
  g.instanceCount = count
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)

  const m = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uSize: { value: 0.26 },
      uMinPx: { value: 11 },
      uMaxPx: { value: 20 },
      uCol0: { value: new THREE.Color('#ECE6D9') },
      uCol1: { value: new THREE.Color('#86A8D8') },
      uCol2: { value: new THREE.Color('#A99BD6') },
      uCol3: { value: new THREE.Color('#7D8190') },
      uGhost: { value: new THREE.Color('#5C6270') },
      uGhostAlpha: { value: 0.3 },
      uOpacity: { value: 1 },
      uMaskX: { value: 0 },
      uDprF: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const size = new THREE.Vector2()
  m.onBeforeRender = (renderer) => {
    renderer.getDrawingBufferSize(size)
    m.uniforms.uRes.value.copy(size)
    const dpr = renderer.getPixelRatio()
    m.uniforms.uDpr.value = dpr
    m.uniforms.uDprF.value = dpr
    m.uniforms.uMaskX.value = screenMask.x * dpr
  }
  return { geometry: g, material: m, pos, A, B, attrs: [iPos, iA, iB] }
}
