// Shaders and procedural textures for the map. All created once (module-level factories used in useMemo).
import * as THREE from 'three'
import { COLORS } from '@/gl'
import { SDF_N, onSdfReady, startSdfBake, tipDir } from './model'

const col = (hex: string) => new THREE.Color(hex)

/* ───────────────────────── Textures ───────────────────────── */

let sdfTex: THREE.DataTexture | null = null
/**
 * Signed distance to the landmass over [−8, 8]² (half-float, bilinear). Baked once per session, in idle time
 * (model.ts); the texture uploads when the bake completes. Terrain finishes it at once if it must draw first.
 */
export function getSdfTexture() {
  if (sdfTex) return sdfTex
  const N = SDF_N
  const h = new Uint16Array(N * N)
  const tex = new THREE.DataTexture(h, N, N, THREE.RedFormat, THREE.HalfFloatType)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  sdfTex = tex
  startSdfBake()
  onSdfReady((f) => {
    for (let i = 0; i < N * N; i++) h[i] = THREE.DataUtils.toHalfFloat(Math.max(-8, Math.min(8, f[i])))
    tex.needsUpdate = true
  })
  return tex
}

let noiseTex: THREE.DataTexture | null = null
/** Tileable value-noise fbm (128², R8), for fog. */
export function getNoiseTexture() {
  if (noiseTex) return noiseTex
  const N = 128
  const lattice = (period: number, seed: number) => {
    const g = new Float32Array(period * period)
    let s = seed
    for (let i = 0; i < g.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0
      g[i] = s / 4294967296
    }
    return (x: number, y: number) => {
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      const fx = x - xi
      const fy = y - yi
      const ux = fx * fx * (3 - 2 * fx)
      const uy = fy * fy * (3 - 2 * fy)
      const at = (a: number, b: number) => g[(((b % period) + period) % period) * period + (((a % period) + period) % period)]
      const a = at(xi, yi)
      const b = at(xi + 1, yi)
      const c = at(xi, yi + 1)
      const d = at(xi + 1, yi + 1)
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
    }
  }
  const o1 = lattice(8, 11)
  const o2 = lattice(16, 23)
  const o3 = lattice(32, 37)
  const data = new Uint8Array(N * N)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = 0.55 * o1((x / N) * 8, (y / N) * 8) + 0.3 * o2((x / N) * 16, (y / N) * 16) + 0.15 * o3((x / N) * 32, (y / N) * 32)
      data[y * N + x] = Math.round(Math.max(0, Math.min(1, v)) * 255)
    }
  noiseTex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType)
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
  noiseTex.minFilter = THREE.LinearFilter
  noiseTex.magFilter = THREE.LinearFilter
  noiseTex.generateMipmaps = false
  noiseTex.needsUpdate = true
  return noiseTex
}

const dirs = () => Array.from({ length: 6 }, (_, j) => new THREE.Vector2(...tipDir(j)))

const ISLAND_GLSL = /* glsl */ `
  float isl(vec2 p, vec2 d) {
    float along = dot(p, d);
    vec2 l = p - along * d;
    return smoothstep(3.3, 3.9, along) * exp(-dot(l, l) / 0.5);
  }
  float sdfAt(sampler2D t, vec2 xz) { return texture(t, (xz + 8.0) / 16.0).r; }
`

/* ───────────────────────── Terrain ───────────────────────── */

export const N_CAPS = 9

export function createTerrainMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSdf: { value: getSdfTexture() },
      uAmp: { value: [0, 0, 0, 0, 0, 0] },
      uFlash: { value: [0, 0, 0, 0, 0, 0] },
      uDir: { value: dirs() },
      uCap: { value: Array.from({ length: N_CAPS }, () => new THREE.Vector4()) },
      uCapOn: { value: new Array(N_CAPS).fill(0) },
      uCapN: { value: 0 },
      uMaskFull: { value: 0 },
      uReveal: { value: 0 },
      uTopo: { value: 1 },
      uFocus: { value: [0, 0, 0, 0, 0, 0] },
      uFocusW: { value: 0 },
      uFade: { value: 1 },
      uDim: { value: 1 },
      uGC: { value: 1 },
      uShore: { value: 0 },
      uSea: { value: 0.35 },
      uField: { value: col(COLORS.field) },
      uDeep: { value: col(COLORS.fieldDeep) },
    },
    vertexShader: /* glsl */ `
      uniform sampler2D uSdf;
      uniform float uAmp[6];
      uniform vec2 uDir[6];
      varying vec3 vW;
      varying float vH;
      varying float vInside;
      ${ISLAND_GLSL}
      void main() {
        vec2 xz = position.xz;
        float sdf = textureLod(uSdf, (xz + 8.0) / 16.0, 0.0).r;
        float inside = smoothstep(-0.15, 0.15, -sdf);
        // the relief uses a gentler edge than the mask so the horns slope into the sea instead of ending in cliffs
        float insideH = smoothstep(-0.55, 0.3, -sdf);
        float m = 0.0;
        for (int j = 0; j < 6; j++) m = max(m, uAmp[j] * isl(xz, uDir[j]));
        float h = insideH * (0.12 + 0.9 * m) - (1.0 - inside) * 0.4;
        vec4 w = modelMatrix * vec4(xz.x, h, xz.y, 1.0);
        vW = w.xyz;
        vH = h;
        vInside = inside;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uSdf;
      uniform float uAmp[6];
      uniform float uFlash[6];
      uniform vec2 uDir[6];
      uniform vec4 uCap[${N_CAPS}];
      uniform float uCapOn[${N_CAPS}];
      uniform int uCapN;
      uniform float uMaskFull;
      uniform float uReveal;
      uniform float uTopo;
      uniform float uFocus[6];
      uniform float uFocusW;
      uniform float uFade;
      uniform float uDim;
      uniform float uGC;
      uniform float uShore;
      uniform float uSea;
      uniform vec3 uField;
      uniform vec3 uDeep;
      varying vec3 vW;
      varying float vH;
      varying float vInside;
      ${ISLAND_GLSL}
      float line(float d, float fw, float w) { return 1.0 - smoothstep(0.0, w * max(fw, 1e-5), abs(d)); }
      float capD(vec2 p, vec4 c) {
        vec2 a = c.xy, b = c.zw;
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
        return length(pa - ba * h);
      }
      void main() {
        vec2 xz = vW.xz;
        float sdf = sdfAt(uSdf, xz);
        float inside = smoothstep(-0.15, 0.15, -sdf);
        float im = 0.0, istr = 0.0, fl = 0.0, m = 0.0, foc = 0.0;
        for (int j = 0; j < 6; j++) {
          float v = isl(xz, uDir[j]);
          im = max(im, v);
          foc = max(foc, uFocus[j] * smoothstep(0.06, 0.3, v));
          m = max(m, v * uAmp[j]);
          if (j > 0) istr = max(istr, v * uAmp[j]);
          fl = max(fl, v * uFlash[j]);
        }
        // the same height as the vertex stage, evaluated per pixel: contour lines stay smooth at any mesh density
        float hF = smoothstep(-0.55, 0.3, -sdf) * (0.12 + 0.9 * m) - (1.0 - inside) * 0.4;
        float hx = dFdx(hF), hy = dFdy(hF);
        float fh = abs(hx) + abs(hy);
        float above = smoothstep(uSea - fh, uSea + fh, hF);
        float mask = smoothstep(0.08, 0.14, im);
        for (int k = 0; k < ${N_CAPS}; k++) {
          if (k >= uCapN) break;
          mask = max(mask, uCapOn[k] * (1.0 - smoothstep(0.2, 0.32, capD(xz, uCap[k]))));
        }
        mask = mix(mask, vInside, uMaskFull) * smoothstep(0.02, 0.2, vInside);
        // the submerged shelf only exists for the eye once the sea turns translucent (never in the opening's tilt)
        mask *= uReveal;
        float vis = max(above, mask);
        if (vis * uFade < 0.004) discard;

        // shading normal from the per-pixel height (smooth at any mesh density, no facets); the triangle's own
        // normal where the map is seen nearly edge-on and the screen → map step degenerates
        vec3 dWx = dFdx(vW), dWy = dFdy(vW);
        vec3 n = normalize(cross(dWx, dWy));
        if (n.y < 0.0) n = -n;
        float det = dWx.x * dWy.z - dWx.z * dWy.x;
        if (abs(det) > 0.05 * length(dWx.xz) * length(dWy.xz)) {
          vec2 gr = vec2(hx * dWy.z - hy * dWx.z, dWx.x * hy - dWy.x * hx) / det;
          n = normalize(vec3(-gr.x, 1.0, -gr.y));
        }
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 3.0);
        float lam = clamp(dot(n, normalize(vec3(-0.45, 0.8, 0.4))), 0.0, 1.0);
        float elev = clamp((hF - uSea) / 0.67, 0.0, 1.0);
        vec3 c = vec3(0.010, 0.016, 0.028) + uDeep * (0.05 + 0.2 * lam * lam) * (0.35 + 0.65 * above);

        // topography: a contour every 0.08 of height above the sea
        float hc = (hF - uSea) / 0.08;
        float topo = line(abs(fract(hc + 0.5) - 0.5), fwidth(hc), 0.9) * smoothstep(0.0, 0.02, hF - uSea - 0.04);
        c += uField * topo * (0.1 + 0.26 * elev) * uTopo;

        // g-contours: arcs of constant ρ across the five string islands (faint dashes; bright in Beat 2)
        float rho = length(xz);
        float frho = fwidth(rho);
        float gw = 1.1 + 0.5 * uGC;
        float gc = max(max(line(rho - 5.60, frho, gw), line(rho - 4.98, frho, gw)), max(line(rho - 4.30, frho, gw), line(rho - 3.68, frho, gw)));
        float ang = atan(xz.y, xz.x) * rho;
        float dash = mix(step(0.5, fract(ang / 0.09)), 1.0, uGC);
        gc *= smoothstep(0.1, 0.3, istr) * above * dash;
        c += uField * gc * (0.14 + 0.9 * uGC);

        // the shoreline: where easy calculation ends
        float shore = line(hF - uSea, fh, 1.3 + 0.9 * uShore) * smoothstep(0.1, 0.3, im);
        c += uField * shore * (0.32 + 1.9 * uShore);

        // the shelf's outline, wherever the shelf is revealed
        float outline = line(sdf, fwidth(sdf), 1.2) * mask;
        c += uField * outline * 0.75;

        c += uField * fres * 0.14 * above;
        c += uField * fl * 0.35 * above;
        // Beats 2 and 3 keep one or two islands in focus: the rest recede
        float fk = mix(1.0, foc, uFocusW);
        c *= 0.22 + 0.78 * fk;
        float a = vis * uFade;
        gl_FragColor = vec4(c * uDim * a, a);
      }
    `,
    transparent: true,
    depthWrite: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  })
}

/* ───────────────────────── Sea ───────────────────────── */

export function createSeaMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFill: { value: 0.85 },
      uGrid: { value: 0.08 },
      uFade: { value: 1 },
      uDim: { value: 1 },
      uField: { value: col(COLORS.field) },
      uVoid: { value: col(COLORS.void) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFill;
      uniform float uGrid;
      uniform float uFade;
      uniform float uDim;
      uniform vec3 uField;
      uniform vec3 uVoid;
      varying vec3 vW;
      void main() {
        vec2 g = vW.xz;
        float r = length(g);
        float edge = 1.0 - smoothstep(10.0, 19.5, r);
        vec2 fw = max(fwidth(g), vec2(1e-5));
        vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
        float ln = 1.0 - clamp(min(gd.x, gd.y) / 1.15, 0.0, 1.0);
        float lod = 1.0 - smoothstep(0.12, 0.4, max(fw.x, fw.y));
        // seen edge-on (the opening's tilt) the plane would collapse into a bright horizon line: fade it out
        float graze = smoothstep(0.12, 0.35, abs(normalize(cameraPosition - vW).y));
        float a = uFill * edge * uFade * graze;
        vec3 c = uField * ln * uGrid * lod * edge * uFade * uDim * graze;
        gl_FragColor = vec4(c + uVoid * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  })
}

/* ───────────────────────── Fog (unmapped interior) ───────────────────────── */

export function createFogMaterial(y: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSdf: { value: getSdfTexture() },
      uNoise: { value: getNoiseTexture() },
      uDir: { value: dirs() },
      uAmt: { value: 0 },
      uT: { value: 0 },
      uY: { value: y },
      uColor: { value: col(COLORS.ink3) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uSdf;
      uniform sampler2D uNoise;
      uniform vec2 uDir[6];
      uniform float uAmt;
      uniform float uT;
      uniform float uY;
      uniform vec3 uColor;
      varying vec3 vW;
      ${ISLAND_GLSL}
      void main() {
        vec2 xz = vW.xz;
        float inside = smoothstep(-0.15, 0.15, -sdfAt(uSdf, xz));
        float im = 0.0;
        for (int j = 0; j < 6; j++) im = max(im, isl(xz, uDir[j]));
        float dens = inside * (1.0 - im);
        // noise advected at 0.02 u/s
        vec2 q1 = (xz + vec2(uT * 0.02, uT * 0.013)) * 0.085 + vec2(uY * 0.37, uY * 0.11);
        vec2 q2 = (xz - vec2(uT * 0.016, -uT * 0.02)) * 0.19 + vec2(0.31, uY * 0.53);
        float n = texture(uNoise, q1).r * 0.62 + texture(uNoise, q2).r * 0.38;
        n = smoothstep(0.34, 0.8, n);
        float a = dens * n * uAmt * (1.0 - 0.55 * uY / 0.8);
        gl_FragColor = vec4(uColor * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/* ───────────────────────── Ribbon (diagram lines: solid, dashed, double) ───────────────────────── */

export function createRibbonMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uWidth: { value: 0.03 },
      uMinPx: { value: 0.75 },
      uColor: { value: col(COLORS.field) },
      uOpacity: { value: 1 },
      uDash: { value: 0 },
      uDuty: { value: 0.55 },
      uDouble: { value: 0 },
      uGrow: { value: 1 },
      uHead: { value: 0.8 },
      uGlow: { value: 0.35 },
      uDpr: { value: 1 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uResolution;
      uniform float uWidth;
      uniform float uMinPx;
      attribute vec3 aPrev;
      attribute vec3 aNext;
      attribute float aSide;
      attribute float aU;
      attribute float aDist;
      varying float vSide;
      varying float vU;
      varying float vDist;
      varying float vHalfPx;
      void main() {
        mat4 mvp = projectionMatrix * modelViewMatrix;
        vec4 c = mvp * vec4(position, 1.0);
        vec4 p = mvp * vec4(aPrev, 1.0);
        vec4 n = mvp * vec4(aNext, 1.0);
        float aspect = uResolution.x / uResolution.y;
        vec2 cs = c.xy / c.w; cs.x *= aspect;
        vec2 ps = p.xy / p.w; ps.x *= aspect;
        vec2 ns = n.xy / n.w; ns.x *= aspect;
        vec2 d1 = cs - ps;
        vec2 d2 = ns - cs;
        float l1 = length(d1);
        float l2 = length(d2);
        vec2 dir;
        if (l1 < 1e-7) dir = d2 / max(l2, 1e-7);
        else if (l2 < 1e-7) dir = d1 / l1;
        else dir = normalize(d1 / l1 + d2 / l2);
        vec2 normal = vec2(-dir.y, dir.x);
        float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
        float halfNdc = 0.5 * uWidth * ws * projectionMatrix[1][1] / max(c.w, 1e-5);
        float minNdc = uMinPx * 2.0 / uResolution.y;
        float h = max(halfNdc, minNdc);
        vHalfPx = h * uResolution.y * 0.5;
        vec2 off = normal * h * aSide;
        off.x /= aspect;
        c.xy += off * c.w;
        gl_Position = c;
        vSide = aSide;
        vU = aU;
        vDist = aDist;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uDash;
      uniform float uDuty;
      uniform float uDouble;
      uniform float uGrow;
      uniform float uHead;
      uniform float uGlow;
      uniform float uDpr;
      uniform float uTime;
      varying float vSide;
      varying float vU;
      varying float vDist;
      varying float vHalfPx;
      void main() {
        if (vU > uGrow + 1e-4) discard;
        float d = abs(vSide);
        float px = d * vHalfPx;
        float core;
        if (uDouble > 0.5) {
          float e = abs(px - vHalfPx * 0.78);
          core = 1.0 - smoothstep(0.35 * uDpr, 1.1 * uDpr, e);
          core += 0.12 * (1.0 - d);
        } else {
          core = 1.0 - smoothstep(0.45 * uDpr, 1.15 * uDpr, px);
        }
        float halo = exp(-d * d * 4.0) * (1.0 - d) * uGlow;
        float dash = 1.0;
        if (uDash > 0.0) {
          float f = fract(vDist / uDash);
          float fw = max(fwidth(vDist / uDash), 1e-4);
          dash = smoothstep(0.0, fw, f) * (1.0 - smoothstep(uDuty - fw, uDuty, f));
        }
        float head = uGrow < 0.999 ? exp(-pow((uGrow - vU) * 40.0, 2.0)) * uHead : 0.0;
        float v = (core + halo) * dash + head * (core + halo * 2.0);
        gl_FragColor = vec4(uColor * v * uOpacity, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}

/** Build ribbon geometry for n points (open or closed). Positions filled by `writeRibbon`. */
export function createRibbonGeometry(n: number, closed = false) {
  const m = closed ? n + 1 : n
  const g = new THREE.BufferGeometry()
  const f = () => new THREE.BufferAttribute(new Float32Array(m * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('position', f())
  g.setAttribute('aPrev', f())
  g.setAttribute('aNext', f())
  const side = new Float32Array(m * 2)
  const u = new Float32Array(m * 2)
  for (let j = 0; j < m; j++) {
    side[j * 2] = -1
    side[j * 2 + 1] = 1
    u[j * 2] = u[j * 2 + 1] = j / (m - 1)
  }
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  g.setAttribute('aU', new THREE.BufferAttribute(u, 1))
  g.setAttribute('aDist', new THREE.BufferAttribute(new Float32Array(m * 2), 1).setUsage(THREE.DynamicDrawUsage))
  const index: number[] = []
  for (let j = 0; j < m - 1; j++) {
    const a = j * 2
    index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
  }
  g.setIndex(index)
  return g
}

export function writeRibbon(g: THREE.BufferGeometry, P: Float32Array, n: number, closed = false) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const prv = g.getAttribute('aPrev') as THREE.BufferAttribute
  const nxt = g.getAttribute('aNext') as THREE.BufferAttribute
  const dist = g.getAttribute('aDist') as THREE.BufferAttribute
  const pa = pos.array as Float32Array
  const qa = prv.array as Float32Array
  const na = nxt.array as Float32Array
  const da = dist.array as Float32Array
  const m = closed ? n + 1 : n
  let acc = 0
  for (let j = 0; j < m; j++) {
    const i = closed ? j % n : j
    const ip = closed ? (i - 1 + n) % n : Math.max(i - 1, 0)
    const inx = closed ? (i + 1) % n : Math.min(i + 1, n - 1)
    if (j > 0) {
      const k = closed ? (j - 1) % n : j - 1
      acc += Math.hypot(P[i * 3] - P[k * 3], P[i * 3 + 1] - P[k * 3 + 1], P[i * 3 + 2] - P[k * 3 + 2])
    }
    for (let s = 0; s < 2; s++) {
      const o = (j * 2 + s) * 3
      pa[o] = P[i * 3]
      pa[o + 1] = P[i * 3 + 1]
      pa[o + 2] = P[i * 3 + 2]
      qa[o] = P[ip * 3]
      qa[o + 1] = P[ip * 3 + 1]
      qa[o + 2] = P[ip * 3 + 2]
      na[o] = P[inx * 3]
      na[o + 1] = P[inx * 3 + 1]
      na[o + 2] = P[inx * 3 + 2]
      da[j * 2 + s] = acc
    }
  }
  pos.needsUpdate = true
  prv.needsUpdate = true
  nxt.needsUpdate = true
  dist.needsUpdate = true
}

/* ───────────────────────── Ladder (IIA D-particle rungs) ───────────────────────── */

export function createLadderMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uG: { value: 0.1 },
      uFuse: { value: 0 },
      uOpacity: { value: 1 },
      uInk: { value: col(COLORS.ink) },
      uInk3: { value: col(COLORS.ink3) },
      uDpr: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uG;
      uniform float uFuse;
      uniform float uOpacity;
      uniform vec3 uInk;
      uniform vec3 uInk3;
      uniform float uDpr;
      varying vec2 vUv;
      void main() {
        float M = vUv.y * 10.0;           // mass axis, 0 … 10 (units 1/ℓ_s)
        float n = M * uG;                 // rung index: M_n = n / g
        float fw = max(fwidth(n), 1e-6);
        float spacingPx = 1.0 / fw / uDpr;
        float dn = abs(fract(n + 0.5) - 0.5);
        float rung = (1.0 - smoothstep(0.0, 1.25 * fw, dn)) * step(0.5, n) * step(M, 9.985);
        float ends = smoothstep(0.0, 0.08, vUv.x) * smoothstep(0.0, 0.08, 1.0 - vUv.x);
        // rungs fuse into a continuum under ~3 px on screen (Lab), or by the story's 0.05-unit rule (uFuse)
        float fuse = max(smoothstep(4.0, 2.5, spacingPx), uFuse);
        float first = 1.0 / uG;
        float cont = step(first - 0.5 * fwidth(M), M) * (0.34 + 0.12 * vUv.y);
        float v = mix(rung * 0.95, cont, fuse) * ends;
        // the string scale: dashed Ink-3 at M = 1
        float fm = max(fwidth(M), 1e-6);
        float ss = (1.0 - smoothstep(0.0, 1.2 * fm, abs(M - 1.0))) * step(0.45, fract(vUv.x * 7.0));
        vec3 c = uInk * v + uInk3 * ss * 1.1;
        gl_FragColor = vec4(c * uOpacity, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
}

/* ───────────────────────── Tube (the wrapped membrane) & walls ───────────────────────── */

export function createTubeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0 },
      uFil: { value: col(COLORS.filament) },
      uField: { value: col(COLORS.field) },
      uLen: { value: 6 },
      uDpr: { value: 1 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalMatrix * normal;
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uFil;
      uniform vec3 uField;
      uniform float uLen;
      uniform float uDpr;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        // uv.x runs around the circle, uv.y along the tube
        float around = vUv.x * 20.0;
        float along = vUv.y * uLen / 0.5;
        float fa = max(fwidth(around), 1e-5);
        float fl = max(fwidth(along), 1e-5);
        float lengthwise = 1.0 - smoothstep(0.0, 1.3 * fa, abs(fract(around + 0.5) - 0.5));
        float ring = 1.0 - smoothstep(0.0, 1.2 * fl, abs(fract(along + 0.5) - 0.5));
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float ends = smoothstep(0.0, 0.06, vUv.y) * smoothstep(0.0, 0.06, 1.0 - vUv.y);
        vec3 c = uFil * lengthwise * 0.55 + uField * ring * 0.4 + uField * (0.035 + 0.3 * fres);
        gl_FragColor = vec4(c * uOpacity * ends, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}

/** Flat translucent panel with bright edges (HE walls, bars). */
export function createPanelMaterial(color: string, fill = 0.15, edge = 0.6, hatch = 0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: col(color) },
      uFill: { value: fill },
      uEdge: { value: edge },
      uHatch: { value: hatch },
      uOpacity: { value: 1 },
      uDpr: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec2 vP;
      void main() { vUv = uv; vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uFill;
      uniform float uEdge;
      uniform float uHatch;
      uniform float uOpacity;
      uniform float uDpr;
      varying vec2 vUv;
      varying vec2 vP;
      void main() {
        vec2 fw = max(fwidth(vUv), vec2(1e-5));
        vec2 e = min(vUv, 1.0 - vUv) / fw;
        float edge = 1.0 - smoothstep(0.6 * uDpr, 1.6 * uDpr, min(e.x, e.y));
        float h = 0.0;
        if (uHatch > 0.0) {
          float s = (vP.x + vP.y) * uHatch;
          float fs = max(fwidth(s), 1e-5);
          h = 1.0 - smoothstep(0.0, 1.2 * fs, abs(fract(s + 0.5) - 0.5));
        }
        float v = uFill + edge * uEdge + h * 0.55;
        gl_FragColor = vec4(uColor * v * uOpacity, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}

/* ───────────────────────── Ring points (lattice circles) ───────────────────────── */

export function createRingPointsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: 0.07 },
      uResY: { value: 800 },
      uColor: { value: col(COLORS.field) },
      uOpacity: { value: 0.3 },
    },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uResY;
      varying float vPx;
      varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = clamp((-position.z - 1.2) / 2.4, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
        float ws = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
        float px = uSize * ws * projectionMatrix[1][1] * uResY * 0.5 / max(-mv.z, 1e-4);
        vPx = max(px, 2.0);
        gl_PointSize = vPx + 2.0;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vPx;
      varying float vDepth;
      void main() {
        vec2 c = (gl_PointCoord * 2.0 - 1.0) * (vPx + 2.0) * 0.5;   // px from the centre
        float r = length(c);
        float R = vPx * 0.5;
        float ring = 1.0 - smoothstep(0.35, 1.1, abs(r - R + 0.6));
        float dot = 1.0 - smoothstep(0.6, 1.4, r);
        float v = R < 1.6 ? dot : ring;
        gl_FragColor = vec4(uColor * v * uOpacity * (1.0 - 0.6 * vDepth), 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/* ───────────────────────── Heterotic sub-strands ───────────────────────── */

export const STRANDS = 16
export const STRAND_SEG = 96

/** 16 faint parallel copies of the loop, visible only where the dense (bosonic-side) pulses pass. */
export function createStrandsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uT: { value: 0 },
      uR0: { value: 0.33 },
      uAct: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: col(COLORS.filament) },
    },
    vertexShader: /* glsl */ `
      attribute float aPhi;
      attribute float aK;
      uniform float uT;
      uniform float uR0;
      uniform float uAct;
      varying float vA;
      ${PULSE_GLSL}
      void main() {
        float r = uR0 * (1.0 + uAct * (cwTrain(aPhi, uT) + ccwTrain(aPhi, uT))) + (aK - 7.5) * 0.0042;
        vA = ccwEnv(aPhi, uT) * uAct;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(r * cos(aPhi), r * sin(aPhi), 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying float vA;
      void main() { gl_FragColor = vec4(uColor * vA * 0.62 * uOpacity, 1.0); }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

// Heterotic pulse trains, mirrored on the CPU in residents.ts (keep in sync).
export const HET = { cwN: 2, cwA: 0.13, cwS: 0.34, ccwN: 6, ccwA: 0.05, ccwS: 0.14, w: 0.6 }
const PULSE_GLSL = /* glsl */ `
  float wrapA(float x) { return mod(x + 3.14159265, 6.2831853) - 3.14159265; }
  float cwTrain(float phi, float t) {
    float s = 0.0;
    for (int k = 0; k < ${HET.cwN}; k++) { float d = wrapA(phi - (-${HET.w.toFixed(4)} * t + 6.2831853 * float(k) / ${HET.cwN.toFixed(1)})); s += exp(-d * d / (2.0 * ${HET.cwS} * ${HET.cwS})); }
    return s * ${HET.cwA};
  }
  float ccwEnv(float phi, float t) {
    float s = 0.0;
    for (int k = 0; k < ${HET.ccwN}; k++) { float d = wrapA(phi - (${HET.w.toFixed(4)} * t + 6.2831853 * float(k) / ${HET.ccwN.toFixed(1)} + 0.4)); s += exp(-d * d / (2.0 * 0.16 * 0.16)); }
    return min(s, 1.0);
  }
  float ccwTrain(float phi, float t) {
    float s = 0.0;
    for (int k = 0; k < ${HET.ccwN}; k++) { float d = wrapA(phi - (${HET.w.toFixed(4)} * t + 6.2831853 * float(k) / ${HET.ccwN.toFixed(1)} + 0.4)); s += exp(-d * d / (2.0 * ${HET.ccwS} * ${HET.ccwS})); }
    return s * ${HET.ccwA};
  }
`

export function createStrandsGeometry() {
  const g = new THREE.BufferGeometry()
  const n = STRANDS * STRAND_SEG * 2
  const pos = new Float32Array(n * 3)
  const phi = new Float32Array(n)
  const k = new Float32Array(n)
  let o = 0
  for (let s = 0; s < STRANDS; s++)
    for (let i = 0; i < STRAND_SEG; i++) {
      phi[o] = (i / STRAND_SEG) * Math.PI * 2
      k[o++] = s
      phi[o] = ((i + 1) / STRAND_SEG) * Math.PI * 2
      k[o++] = s
    }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aPhi', new THREE.BufferAttribute(phi, 1))
  g.setAttribute('aK', new THREE.BufferAttribute(k, 1))
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1)
  return g
}

/* ───────────────────────── Segments (many short hairlines, one draw call) ───────────────────────── */

/**
 * Instanced screen-space hairline segments: instance i runs aA → aB with colour aC.rgb × aC.a.
 * Used for the Beat 1 chirality helices, their chevrons and the train arrows (all in one call).
 */
export function createSegmentsGeometry(n: number) {
  const g = new THREE.InstancedBufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0]), 3))
  g.setIndex([0, 1, 2, 2, 1, 3])
  const inst = (k: number) => new THREE.InstancedBufferAttribute(new Float32Array(n * k), k).setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('aA', inst(3))
  g.setAttribute('aB', inst(3))
  g.setAttribute('aC', inst(4))
  g.instanceCount = n
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
  return g
}

export function createSegmentsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uHalfPx: { value: 0.8 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uResolution;
      uniform float uHalfPx;
      attribute vec3 aA;
      attribute vec3 aB;
      attribute vec4 aC;
      varying float vY;
      varying vec4 vC;
      void main() {
        mat4 mvp = projectionMatrix * modelViewMatrix;
        vec4 a = mvp * vec4(aA, 1.0);
        vec4 b = mvp * vec4(aB, 1.0);
        vec4 c = mix(a, b, position.x);
        float aspect = uResolution.x / uResolution.y;
        vec2 as2 = a.xy / a.w; as2.x *= aspect;
        vec2 bs2 = b.xy / b.w; bs2.x *= aspect;
        vec2 d = bs2 - as2;
        float l = length(d);
        d = l > 1e-7 ? d / l : vec2(1.0, 0.0);
        float hp = uHalfPx + 1.0;
        vec2 off = vec2(-d.y, d.x) * (hp * 2.0 / uResolution.y) * position.y;
        // a half-pixel cap at each end so short segments join without gaps
        off += d * (hp * 2.0 / uResolution.y) * (position.x * 2.0 - 1.0) * 0.6;
        off.x /= aspect;
        c.xy += off * c.w;
        gl_Position = c;
        vY = position.y * hp;
        vC = aC;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uHalfPx;
      uniform float uOpacity;
      varying float vY;
      varying vec4 vC;
      void main() {
        float cov = clamp(uHalfPx + 0.5 - abs(vY), 0.0, 1.0);
        gl_FragColor = vec4(vC.rgb * vC.a * cov * uOpacity, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}
