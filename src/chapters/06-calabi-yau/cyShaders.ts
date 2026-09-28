import * as THREE from 'three'
import { COLORS } from '@/gl'
import { S_WORLD } from './cyMath'

/*
 * GPU side of the Hanson slice. Mirrors cyMath.ts:
 *   per-instance phase rotation (k1, k2) → projection P_α (a uniform: turning α costs nothing)
 *   → squash D_s (cartoon) with its Jacobian applied to the tangents for the normal.
 */

export const CY_PROJECT = /* glsl */ `
  uniform float uN;
  uniform float uAlpha;
  uniform float uS;
  uniform float uScale;
  vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
  // Hanson: (Re z1, Re z2, cos a Im z1 + sin a Im z2), z up  →  three.js Y up: S (P.x, P.z, -P.y)
  vec3 projP(vec4 p) { return uScale * vec3(p.x, cos(uAlpha) * p.y + sin(uAlpha) * p.w, -p.z); }
  vec3 sqDiag() { return vec3(1.0 + 0.45 * uS, 1.0 - 0.30 * uS, 1.0 + 0.15 * uS); }
  vec3 squash(vec3 W) {
    vec3 V = W * sqDiag();
    float ph = 0.9 * uS * W.y;
    float c = cos(ph), s = sin(ph);
    return vec3(c * V.x + s * V.z, V.y, -s * V.x + c * V.z);
  }
  // Jacobian of squash at W applied to tangent t
  vec3 squashT(vec3 W, vec3 t) {
    vec3 d = sqDiag();
    vec3 V = W * d;
    vec3 St = t * d;
    float ph = 0.9 * uS * W.y;
    float c = cos(ph), s = sin(ph);
    vec3 RSt = vec3(c * St.x + s * St.z, St.y, -s * St.x + c * St.z);
    vec3 dR = vec3(-s * V.x + c * V.z, 0.0, -c * V.x - s * V.z);
    return RSt + dR * (0.9 * uS * t.y);
  }
`

const surfaceVert = /* glsl */ `
  ${CY_PROJECT}
  uniform float uAsm;       // (pack progress − 0.20) during the B2 assembly; ≥ 1 otherwise
  uniform float uPieces;
  uniform float uFocus;     // wrap mode: non-loop patches fade to 12%
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform vec3 uField;
  attribute vec4 aP4;
  attribute vec4 aTx;
  attribute vec4 aTy;
  attribute vec2 aK;
  #ifndef PREPASS
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vTint;
  varying float vA;
  varying vec2 vZ1;
  varying vec4 vP4;
  #endif
  void main() {
    float k1 = aK.x, k2 = aK.y;
    float isBase = 1.0 - step(0.5, k1 + k2);
    float ti = clamp((uAsm - 0.005 * (k1 + k2)) / 0.02, 0.0, 1.0);
    float a1 = 6.2831853 * k1 * ti / uN;
    float a2 = 6.2831853 * k2 * ti / uN;
    vec4 p = vec4(rot2(aP4.xy, a1), rot2(aP4.zw, a2));
    vec3 W = projP(p);
    vec4 mv = modelViewMatrix * vec4(squash(W), 1.0);
    gl_Position = projectionMatrix * mv;
    #ifndef PREPASS
    vec4 tx = vec4(rot2(aTx.xy, a1), rot2(aTx.zw, a2));
    vec4 ty = vec4(rot2(aTy.xy, a1), rot2(aTy.zw, a2));
    vec3 n = cross(squashT(W, projP(tx)), squashT(W, projP(ty)));
    vN = normalMatrix * n;
    vV = -mv.xyz;
    vUv = uv;
    vZ1 = p.xy;
    vP4 = p;
    float idx = (k1 * uN + k2) / max(uN * uN - 1.0, 1.0);
    vec3 ramp = mix(uColA, uColB, idx) * (1.0 + 0.4 * isBase);
    vTint = mix(uField, ramp, uPieces);
    float appear = isBase + (1.0 - isBase) * smoothstep(0.0, 0.55, ti) * step(0.0001, ti);
    float isLoop = step(k1, 1.5) * step(k2, 1.5);
    vA = appear * mix(1.0, mix(0.12, 1.0, isLoop), uFocus);
    #else
    // hidden pieces (assembly) must not write depth
    float appear = isBase + (1.0 - isBase) * step(0.0001, ti);
    if (appear < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    #endif
  }
`

const surfaceFrag = /* glsl */ `
  uniform vec2 uGrid;
  uniform float uLineW;
  uniform float uDpr;
  uniform float uFill;
  uniform float uFres;
  uniform float uKey;
  uniform float uLine;
  uniform float uOpacity;
  uniform float uGain;
  uniform vec3 uWarm;
  uniform float uPattern;
  uniform float uSpread;
  uniform vec4 uTouch;
  uniform float uPhase;     // 3Ωt of the harmonic pattern
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vTint;
  varying float vA;
  varying vec2 vZ1;
  varying vec4 vP4;
  void main() {
    if (vA * uOpacity < 0.002) discard;
    vec3 V = normalize(vV);
    vec3 N = vN;
    float nl = length(N);
    if (nl < 1e-6) N = normalize(cross(dFdx(-vV), dFdy(-vV)));
    else N /= nl;
    float ndv = abs(dot(N, V));
    float fres = pow(1.0 - ndv, 2.6);
    float key = pow(abs(dot(N, normalize(vec3(-0.45, 0.75, 0.5)))), 3.0);
    vec2 g = vUv * uGrid;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float lw = max(uLineW * uDpr, 0.5);
    vec2 l2 = (1.0 - clamp(gd / lw, 0.0, 1.0)) * clamp(1.6 - fw * 1.4, 0.0, 1.0);
    float line = max(l2.x, l2.y);
    vec3 col = vTint * (uFill + uKey * key + uFres * fres) + vTint * line * uLine * (0.55 + 0.45 * fres);
    if (uPattern > 0.001) {
      // f = Re((z1 e^{iΩt})^3): harmonic on the surface (real part of a holomorphic function)
      vec2 z = vZ1;
      vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
      vec2 z3 = vec2(z2.x * z.x - z2.y * z.y, z2.x * z.y + z2.y * z.x);
      float f = z3.x * cos(uPhase) - z3.y * sin(uPhase);
      // stripe intensity 0.5 + 0.5 cos(6f) as a faint wash, plus hairline crests at its maxima
      // (6f = 2πk): the same level sets drawn as fine warm contours. The additive surface stacks
      // several folds, so a strong wash alone would turn to fog.
      float stripe = 0.5 + 0.5 * cos(6.0 * f);
      float g = 6.0 * f / 6.2831853;
      float gw = max(fwidth(g), 1e-5);
      float crest = 1.0 - smoothstep(0.0, 1.3 * gw * uDpr, abs(fract(g + 0.5) - 0.5));
      float d = length(vP4 - uTouch);
      float m = 1.0 - smoothstep(uSpread - 0.3, uSpread, d);
      float edge = exp(-pow((d - uSpread) / 0.07, 2.0)) * (1.0 - smoothstep(2.4, 3.2, uSpread));
      col += uWarm * ((0.05 * stripe + 0.3 * crest) * m + 0.12 * edge) * uPattern;
    }
    gl_FragColor = vec4(col * vA * uOpacity * uGain, 1.0);
  }
`

export type CYSurfaceMaterial = THREE.ShaderMaterial & { uniforms: Record<string, THREE.IUniform> }

const projUniforms = () => ({
  uN: { value: 5 },
  uAlpha: { value: Math.PI / 4 },
  uS: { value: 0 },
  uScale: { value: S_WORLD },
  uAsm: { value: 10 },
  uPieces: { value: 1 },
  uFocus: { value: 0 },
  uColA: { value: new THREE.Color(0.42, 0.6, 0.94) },
  uColB: { value: new THREE.Color(0.66, 0.54, 0.95) },
  uField: { value: new THREE.Color(COLORS.field) },
})

export function createSurfaceMaterial(): CYSurfaceMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: surfaceVert,
    fragmentShader: surfaceFrag,
    uniforms: {
      ...projUniforms(),
      uGrid: { value: new THREE.Vector2(12, 6) },
      uLineW: { value: 0.75 },
      uDpr: { value: 1 },
      uFill: { value: 0.03 },
      uFres: { value: 0.62 },
      uKey: { value: 0.1 },
      uLine: { value: 0.3 },
      uOpacity: { value: 1 },
      uGain: { value: 1 },
      uWarm: { value: new THREE.Color(COLORS.filament) },
      uPattern: { value: 0 },
      uSpread: { value: 0 },
      uTouch: { value: new THREE.Vector4() },
      uPhase: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  m.onBeforeRender = (renderer) => {
    m.uniforms.uDpr.value = renderer.getPixelRatio()
  }
  return m as CYSurfaceMaterial
}

/** Depth-only copy of the surface, so the highlighted loop can be drawn "in front" and "seen through". */
export function createPrepassMaterial(): CYSurfaceMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: '#define PREPASS\n' + surfaceVert,
    fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }',
    uniforms: projUniforms(),
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2,
  })
  return m as CYSurfaceMaterial
}

const rimVert = /* glsl */ `
  ${CY_PROJECT}
  attribute vec4 aP4;
  attribute float aDash;
  varying float vDash;
  void main() {
    vDash = aDash;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(squash(projP(aP4)), 1.0);
  }
`
const rimFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDashes;
  varying float vDash;
  void main() {
    if (fract(vDash * uDashes) > 0.5) discard;
    gl_FragColor = vec4(uColor * uOpacity, 1.0);
  }
`
export function createRimMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: rimVert,
    fragmentShader: rimFrag,
    uniforms: {
      uN: { value: 5 },
      uAlpha: { value: Math.PI / 4 },
      uS: { value: 0 },
      uScale: { value: S_WORLD },
      uColor: { value: new THREE.Color(COLORS.ink) },
      uOpacity: { value: 0.5 },
      uDashes: { value: 6 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  }) as CYSurfaceMaterial
}

/** Copy the projection uniforms (n, α, s) into a material. */
export function setProj(m: CYSurfaceMaterial, n: number, alpha: number, s: number) {
  m.uniforms.uN.value = n
  m.uniforms.uAlpha.value = alpha
  m.uniforms.uS.value = s
}
