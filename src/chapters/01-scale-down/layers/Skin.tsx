import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { SceneLabel, useChapterFrame } from '@/gl'
import { lerp } from '@/core/math'
import { Status } from '@/ui'
import { MASK, maskUniforms, updateMask } from '../glsl'
import { rt, win } from '../runtime'

/*
 * Beat 1, "into the living scale": the fingertip pad (fingerprint ridges as Ink-3 hairlines), then a
 * cutaway that slices the skin and tilts (to a 15° down view) to reveal the section: flattened dead
 * cells without nuclei on top, living cells below (a hairline Voronoi mosaic, each with a darker
 * nucleus and a faint Field-blue rim). Units: µm. The block's origin is the target cell's centre.
 */

const D = 300 // depth of the target cell below the surface (µm)
const G = 13 // living-cell grid (µm): cells ~ 13–15 µm across

const COMMON = /* glsl */ `
  float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 h22(vec2 p) { return vec2(h21(p), h21(p + 17.13)); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0)), f.x), f.y);
  }
  // fingerprint ridge phase on the skin surface; p = (x, z) in µm, the pad centre at the origin
  float ridgePhase(vec2 p) {
    vec2 d = p - vec2(1700.0, -1100.0);
    float r = length(d * vec2(1.0, 0.82));
    float a = atan(d.y, d.x);
    float w = r + 150.0 * sin(2.0 * a + r * 0.00055) + 300.0 * (vnoise(p * 0.00042) - 0.5) + 70.0 * (vnoise(p * 0.0016 + 11.0) - 0.5);
    return w / 460.0;
  }
`

const vert = /* glsl */ `
  uniform vec2 uOffset;
  uniform float uFlip;
  varying vec2 vP;
  void main() {
    vP = vec2(position.x, position.y * uFlip) + uOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const padFrag = /* glsl */ `
  ${COMMON}
  ${MASK}
  uniform vec3 uInk3;
  uniform vec3 uInk2;
  uniform float uAlpha;
  uniform float uCut;
  uniform vec3 uInk;
  uniform vec3 uField;
  uniform float uDpr;
  varying vec2 vP; // (x, z) on the surface, µm
  void main() {
    vec2 p = vP;
    float px = length(fwidth(p)) * 0.7071;   // µm per device px
    // pad outline: an ellipse along the finger axis (30° on screen)
    vec2 ax = vec2(0.866, -0.5);
    vec2 q = p - ax * 1800.0;
    float along = dot(q, ax) / 10500.0;
    float across = dot(q, vec2(-ax.y, ax.x)) / 8300.0;
    float e = length(vec2(along, across));
    // early outs (fill rate at DPR 2): nothing is drawn outside the pad, or under the text column
    float tm = textMask();
    if (e > 1.08 || tm * uAlpha < 0.003) discard;
    float mask = 1.0 - smoothstep(0.6, 0.98, e);
    // the fingertip's outline, a single hairline
    float ew = fwidth(e);
    float outline = 1.0 - smoothstep(0.0, 1.0 + 0.4 * uDpr, abs(e - 1.0) / max(ew, 1e-6));
    float ph = ridgePhase(p);
    float fw = fwidth(ph);
    float d = abs(fract(ph + 0.5) - 0.5) / max(fw, 1e-5); // device px from the ridge line
    float line = 1.0 - smoothstep(0.15, 0.55 + 0.4 * uDpr, d);
    // ridge endings and bifurcations: ridges break where a slow noise dips
    float brk = 0.1 + 0.9 * smoothstep(0.2, 0.34, vnoise(p * 0.0021 + 3.7));
    line *= brk;
    // the ridge itself: a faint luminous band about half the ridge spacing wide
    float band = (1.0 - smoothstep(0.12, 0.3, abs(fract(ph + 0.5) - 0.5))) * brk;
    // ridges denser than ~4 px fade out (no moiré)
    float lod = 1.0 - smoothstep(0.14, 0.28, fw);
    // sweat pores sit on the ridges
    vec2 cell = floor(p / 430.0);
    vec2 pc = (cell + 0.5 + 0.4 * (h22(cell) - 0.5)) * 430.0;
    float onRidge = 1.0 - smoothstep(0.08, 0.2, abs(fract(ridgePhase(pc) + 0.5) - 0.5));
    float pr = length(p - pc);
    float pore = (1.0 - smoothstep(0.0, 1.2 * px, abs(pr - 34.0))) * onRidge * step(0.3, h21(cell + 3.1)) * smoothstep(1.5, 5.0, 34.0 / px);
    // the cut: the part below the cutting line (z > 0) is lifted away
    float keep = p.y > 0.0 ? 1.0 - uCut : 1.0;
    float edge = (1.0 - smoothstep(0.0, 1.3 * px, abs(p.y))) * uCut;
    vec3 col = uInk3 * line * lod * 0.9 * mask * keep;
    col += uInk3 * band * 0.09 * mask * keep;
    col += uInk2 * pore * 0.55 * lod * mask * keep;
    col += uInk2 * outline * 0.7 * keep * (1.0 - uCut);
    col += uField * edge * 0.9 * mask;
    gl_FragColor = vec4(col * uAlpha * tm, 1.0);
  }
`

const secFrag = /* glsl */ `
  ${COMMON}
  ${MASK}
  uniform float uAlpha;
  uniform vec3 uInk;
  uniform vec3 uInk2;
  uniform vec3 uInk3;
  uniform vec3 uField;
  uniform float uDpr;
  varying vec2 vP; // (x, y) on the section, µm; y up toward the skin surface; target cell centre at 0
  const float G = ${G.toFixed(1)};
  vec2 seedOf(vec2 c) {
    if (c.x == 0.0 && c.y == 0.0) return vec2(0.5);
    return vec2(0.5) + 0.36 * (h22(c) * 2.0 - 1.0);
  }
  // IQ's Voronoi with exact border distance. Returns (border distance, vector to own seed), cell units.
  vec3 voronoi(vec2 x, out vec2 cellId) {
    vec2 n = floor(x); vec2 f = x - n;
    vec2 mg = vec2(0.0); vec2 mr = vec2(0.0); float md = 8.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + seedOf(n + g) - f;
      float d = dot(r, r);
      if (d < md) { md = d; mr = r; mg = g; }
    }
    md = 8.0;
    // seeds are jittered by at most ±0.36 of a cell, so the 3×3 ring around the nearest cell
    // holds every neighbour that can share a border (IQ's 5×5 pass costs ~2× the fill rate)
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 r = g + seedOf(n + g) - f;
      if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
    }
    cellId = n + mg;
    return vec3(md, mr);
  }
  // a ~1 CSS px hairline; pxD = µm per device pixel
  float hair(float dUm, float pxD) { return 1.0 - smoothstep(0.0, pxD * (0.9 + 0.5 * uDpr), dUm); }
  void main() {
    vec2 p = vP;
    float px = length(fwidth(p)) * 0.7071; // µm per device px (derivatives before any discard)
    float pxC = px * uDpr;                 // µm per CSS px
    // early outs (fill rate at DPR 2): the slab's soft edges and the text column
    float edge = smoothstep(2500.0, 1500.0, abs(p.x)) * smoothstep(-900.0, -550.0, p.y);
    float tm = textMask();
    if (edge * tm * uAlpha < 0.003) discard;
    float top = ${D.toFixed(1)} + 22.0 * cos(6.2831853 * ridgePhase(vec2(p.x, 0.0)));
    if (p.y > top + 2.0 * px) discard;
    float depth = top - p.y;
    float junction = -150.0 + 55.0 * cos(6.2831853 * p.x / 210.0) + 12.0 * sin(p.x / 47.0);
    vec3 col = vec3(0.0);
    // skin surface
    col += uInk2 * hair(abs(depth), px) * 0.8;
    float cellPx = G / pxC;
    float lod = smoothstep(2.5, 6.0, cellPx);
    if (depth < 150.0) {
      // stratum corneum: flattened dead cells, no nuclei
      // stratum corneum: flattened dead cells stacked like thin lamellae, no nuclei
      float row = floor(depth / 5.0);
      float fr = depth / 5.0 - row;
      float off = h21(vec2(row, 7.0)) * 40.0;
      float cellx = (p.x + off) / 36.0;
      float gap = abs(fract(cellx) - 0.5) * 36.0;       // µm to the nearest cell end
      float lam = hair(abs(fr - 0.5) * 5.0 - 2.1, px);  // the boundary between two lamellae
      float ends = 1.0 - smoothstep(0.0, 1.2 * px + 0.6, gap - 17.4);
      float vis = smoothstep(2.5, 6.0, 5.0 / pxC);
      col += uInk3 * max(lam, ends * step(abs(fr - 0.5), 0.45)) * 0.34 * vis;
      col += uInk * 0.022 * (0.85 + 0.3 * h21(vec2(row, floor(cellx))));
      col += uInk * 0.01 * (1.0 - vis);
    } else if (p.y > junction) {
      // living epidermis
      vec2 cid;
      vec3 v = voronoi(p / G + 0.5, cid);
      float border = v.x * G;
      float dn = length(v.yz) * G;
      float rn = G * (0.215 + 0.035 * h21(cid + 7.7));
      if (cid.x == 0.0 && cid.y == 0.0) rn = 3.05;
      float inNuc = 1.0 - smoothstep(rn - px, rn + px, dn);
      // granular layer: cells flatten a little just under the corneum
      float gran = smoothstep(90.0, 150.0, depth);
      col += uInk * mix(0.017, 0.004, inNuc) * (1.0 + 0.3 * gran);
      col += uInk * inNuc * 0.022 * vnoise(p * 1.7) * smoothstep(8.0, 30.0, 1.0 / pxC);
      float close = smoothstep(40.0, 160.0, cellPx);
      col += uField * hair(abs(dn - rn), px) * (0.3 + 0.4 * close) * lod;
      col += uInk2 * hair(border, px) * (0.42 + 0.2 * close) * lod;
      // a nucleolus, once a cell is large on screen
      float nd = length(v.yz * G - vec2(0.8, -0.6));
      float nsmall = 1.0 - smoothstep(18.0, 50.0, 0.55 / pxC);
      col += uInk * (1.0 - smoothstep(0.55, 0.55 + px, nd)) * 0.2 * close * nsmall;
      col += uInk2 * hair(abs(nd - 0.55), px) * 0.35 * close * (1.0 - nsmall);
      col += uInk * 0.012 * (1.0 - lod);
    } else {
      // dermis: sparse wavy fibres, fading with depth
      float ph = (p.y + 25.0 * sin(p.x / 70.0) + 60.0 * vnoise(p * 0.012)) / 34.0;
      float d = abs(fract(ph) - 0.5) * 34.0;
      float fade = smoothstep(-650.0, -200.0, p.y);
      col += uInk3 * hair(d, px) * 0.16 * fade * smoothstep(0.25, 0.6, vnoise(p * 0.004 + 2.0));
      col += uInk * 0.012 * fade;
    }
    // basement membrane
    col += uField * hair(abs(p.y - junction), px) * 0.35;
    gl_FragColor = vec4(col * uAlpha * edge * tm, 1.0);
  }
`

export function Skin() {
  const dpr = useThree((s) => s.viewport.dpr)
  const block = useRef<THREE.Group>(null!)
  const mk = (frag: string, offset: [number, number], flip: number) =>
    new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uAlpha: { value: 0 },
        uCut: { value: 0 },
        uOffset: { value: new THREE.Vector2(...offset) },
        uFlip: { value: flip },
        uInk: { value: new THREE.Color('#ECE6D9') },
        uInk2: { value: new THREE.Color('#9AA0AE') },
        uInk3: { value: new THREE.Color('#7A8090') },
        uField: { value: new THREE.Color('#86A8D8') },
        uDpr: { value: 1 },
        ...maskUniforms(),
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      extensions: { derivatives: true } as never,
    })
  const padMat = useMemo(() => mk(padFrag, [0, 0], -1), [])
  const secMat = useMemo(() => mk(secFrag, [0, -270], 1), [])
  const padGeo = useMemo(() => new THREE.PlaneGeometry(26000, 26000, 1, 1), [])
  const secGeo = useMemo(() => new THREE.PlaneGeometry(5000, 1260, 1, 1), [])
  useLayoutEffect(
    () => () => {
      padMat.dispose()
      secMat.dispose()
      padGeo.dispose()
      secGeo.dispose()
    },
    [padMat, secMat, padGeo, secGeo],
  )
  const pad = useRef<THREE.Mesh>(null!)
  const sec = useRef<THREE.Mesh>(null!)
  const tagG = useRef<THREE.Group>(null!)

  useChapterFrame(() => {
    const aPad = win(rt.s, -1.15, -4.4, 0.45)
    const aSec = win(rt.s, -2.75, -6.0, 0.5) * Math.min(1, rt.tilt * 3)
    // the section tag sits at a fixed spot on screen, lower right of the subject
    {
      const X = rt.mobile ? 0.08 * rt.W : 0.58 * rt.W
      const Y = rt.mobile ? 0.56 * rt.H : 0.86 * rt.H
      tagG.current.position.set((X - rt.W / 2 - rt.shiftX * rt.W) / rt.px, (rt.H / 2 - Y - rt.shiftY * rt.H) / rt.px, 0)
    }
    const g = block.current
    g.visible = aPad + aSec > 0.002
    if (!g.visible) return
    const sc = 1e-6 * rt.k
    g.scale.setScalar(sc)
    g.position.set(0, 0, 0)
    // the cutaway tilt: from facing the surface (90°) to looking 15° down into the section
    g.rotation.set(lerp(Math.PI / 2, (15 * Math.PI) / 180, rt.tilt), 0, 0)
    pad.current.visible = aPad > 0.002
    sec.current.visible = aSec > 0.002
    padMat.uniforms.uAlpha.value = aPad
    padMat.uniforms.uCut.value = rt.cut
    padMat.uniforms.uDpr.value = dpr
    secMat.uniforms.uAlpha.value = aSec
    secMat.uniforms.uDpr.value = dpr
    updateMask(padMat.uniforms, dpr)
    updateMask(secMat.uniforms, dpr)
  })

  return (
    <>
    <group ref={block}>
      {/* skin surface y = D, lying in the block's xz-plane; the section is the block's z = 0 plane */}
      <mesh ref={pad} geometry={padGeo} material={padMat} position={[0, D, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} />
      <mesh ref={sec} geometry={secGeo} material={secMat} position={[0, -270, 0]} frustumCulled={false} />
    </group>
    <group ref={tagG}>
      <SceneLabel position={[0, 0, 0]} align="left" tone="dim" opacity={() => win(rt.s, -3.0, -4.4, 0.25) * (1 - rt.labW)}>
        <span className="sd-tag">
          <Status kind="analogy" compact /> Cutaway · skin in section
        </span>
      </SceneLabel>
    </group>
    </>
  )
}
