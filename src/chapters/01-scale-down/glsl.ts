// Shared GLSL chunks for chapter 01's point clouds and flicker hazes.
import * as THREE from 'three'
import { rt } from './runtime'

/** Dave Hoskins' hash (no sin) — stable for large inputs. */
export const HASH = /* glsl */ `
  vec4 hash44(vec4 p4) {
    p4 = fract(p4 * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
  }
  vec3 isoDir(float u, float v) {
    float z = 2.0 * u - 1.0;
    float r = sqrt(max(0.0, 1.0 - z * z));
    float a = 6.2831853 * v;
    return vec3(r * cos(a), r * sin(a), z);
  }
  float lnu(float u) { return log(max(u, 1e-6)); }
`

/**
 * Flicker-haze clock: each point has a seed, a lifetime τ and a phase; its position is resampled
 * from hash(seed, cycle) every lifetime and its alpha follows sin² over the life. No CPU work.
 */
export const FLICKER = /* glsl */ `
  uniform float uTime;
  uniform float uTauMin;
  uniform float uTauMax;
  float gCycle; float gAge;
  void flicker(vec4 r) {
    float tau = mix(uTauMin, uTauMax, r.y);
    float x = uTime / tau + r.z;
    gCycle = floor(x);
    gAge = x - gCycle;
  }
  float envelope() { float e = sin(3.14159265 * gAge); return e * e; }
`

/** Soft round point sprite. */
export const POINT_FRAG = /* glsl */ `
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float a = exp(-r2 * 2.6) * (1.0 - r2 * 0.6);
    gl_FragColor = vec4(vCol * a * vA, 1.0);
  }
`

/** Fade points that come near (or behind) the camera, so fly-throughs never flash. */
export const NEAR_FADE = /* glsl */ `
  float nearFade(vec4 mv) { return smoothstep(0.6, 2.2, -mv.z); }
`

/**
 * Text-side mask for full-frame layers (rings, cell mosaic, chromatin, hazes): on desktop the content
 * fades out toward the beat column on the left; on phones it fades toward the text at the bottom.
 * uMask = (strength, mode 0 = left / 1 = bottom, from, to) in viewport fractions.
 * Every masked layer also clears a band along the top edge (uTop), where the zoom tape reads.
 */
export const MASK = /* glsl */ `
  uniform vec2 uRes;
  uniform vec4 uMask;
  uniform vec2 uTop;
  float textMask() {
    float top = smoothstep(uTop.x, uTop.y, 1.0 - gl_FragCoord.y / uRes.y);
    if (uMask.x <= 0.0) return top;
    float m = uMask.y < 0.5
      ? smoothstep(uMask.z, uMask.w, gl_FragCoord.x / uRes.x)
      : 1.0 - smoothstep(uMask.z, uMask.w, 1.0 - gl_FragCoord.y / uRes.y);
    return mix(1.0, m, uMask.x) * top;
  }
`

export const maskUniforms = () => ({ uRes: { value: new THREE.Vector2(1, 1) }, uMask: { value: new THREE.Vector4() }, uTop: { value: new THREE.Vector2(0.04, 0.15) } })

export function updateMask(u: Record<string, THREE.IUniform>, dpr: number) {
  ;(u.uRes.value as THREE.Vector2).set(rt.W * dpr, rt.H * dpr)
  ;(u.uMask.value as THREE.Vector4).set(rt.maskK, rt.mobile ? 1 : 0, rt.mobile ? 0.5 : 0.27, rt.mobile ? 0.66 : 0.45)
  ;(u.uTop.value as THREE.Vector2).set(rt.mobile ? 0.07 : 0.04, rt.mobile ? 0.19 : 0.15)
}

/** Additive hairlines with per-vertex colour, near-camera fade and the text mask. */
export function lineMaterial(color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      ${NEAR_FADE}
      attribute vec3 color;
      varying vec3 vCol;
      varying float vNear;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vCol = color;
        vNear = nearFade(mv);
      }
    `,
    fragmentShader: /* glsl */ `
      ${MASK}
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vCol;
      varying float vNear;
      void main() {
        gl_FragColor = vec4(uColor * vCol * uOpacity * vNear * textMask(), 1.0);
      }
    `,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, ...maskUniforms() },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
}

/** Soft round point sprite, faded toward the text column like the other full-frame layers. */
export const POINT_FRAG_MASKED = /* glsl */ `
  ${MASK}
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float a = exp(-r2 * 2.6) * (1.0 - r2 * 0.6);
    gl_FragColor = vec4(vCol * a * vA * textMask(), 1.0);
  }
`
