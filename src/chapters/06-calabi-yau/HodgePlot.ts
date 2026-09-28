import * as THREE from 'three'
import { COLORS } from '@/gl'
import { createHairlines, type HairSeg } from './unroll'

/*
 * Beat 6: the Kreuzer–Skarke Hodge plot. x = χ = 2(h¹¹ − h²¹) ∈ [−960, 960], y = h¹¹ + h²¹ ∈ [0, 502].
 * 30,108 points in one THREE.Points draw call, swept in bottom-up. Exactly mirror-symmetric about χ = 0.
 * The 208 pairs with |χ| = 6 (where the simplest rule gives three generations) carry aHi = 1 and are lifted
 * out of the cloud (ink, larger) when uHi rises — the real data, not a band that would sit on the mirror axis.
 */

export const PLOT_W = 3.4
export const PLOT_H = 1.8
export const plotX = (chi: number) => (chi / 960) * (PLOT_W / 2)
export const plotY = (h: number) => (h / 502 - 0.5) * PLOT_H
/** Where the χ = ±6 callout sits (plot units): up and to the right of the column, in the sparse upper middle. */
export const HI_LABEL: [number, number] = [plotX(150), plotY(410)]

const vert = /* glsl */ `
  uniform float uReveal;
  uniform float uSize;
  uniform float uHi;
  attribute float aHi;
  varying float vA;
  varying float vHi;
  void main() {
    float yn = position.y / ${PLOT_H.toFixed(3)} + 0.5;
    vA = smoothstep(yn - 0.06, yn, uReveal);
    vHi = aHi * uHi;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (1.0 + 1.1 * vHi);
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHiColor;
  uniform float uOpacity;
  varying float vA;
  varying float vHi;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r = dot(c, c);
    if (r > 1.0) discard;
    vec3 col = mix(uColor, uHiColor, vHi);
    gl_FragColor = vec4(col * (1.0 - 0.55 * r) * vA * uOpacity, 1.0);
  }
`

export class HodgePlot {
  readonly group = new THREE.Group()
  readonly axes: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>
  readonly mirror: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>
  readonly leader: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>
  readonly leaderL: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>
  private points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null
  private mat: THREE.ShaderMaterial

  constructor() {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uReveal: { value: 0 },
        uSize: { value: 1.5 },
        uColor: { value: new THREE.Color(COLORS.field).multiplyScalar(0.85) },
        uHiColor: { value: new THREE.Color(COLORS.ink).multiplyScalar(1.6) },
        uHi: { value: 0 },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    const x0 = plotX(-960)
    const x1 = plotX(960)
    const y0 = plotY(0)
    const y1 = plotY(502)
    const t = 0.035
    const segs: HairSeg[] = [
      { a: [x0, y0, 0], b: [x1, y0, 0] },
      { a: [x0, y0, 0], b: [x0, y1, 0] },
    ]
    for (const chi of [-960, -480, 0, 480, 960]) segs.push({ a: [plotX(chi), y0, 0], b: [plotX(chi), y0 - t, 0] })
    for (const h of [100, 200, 300, 400, 500]) segs.push({ a: [x0, plotY(h), 0], b: [x0 - t, plotY(h), 0] })
    this.axes = createHairlines(segs, COLORS.ink3)
    this.mirror = createHairlines([{ a: [0, y0, 0], b: [0, plotY(505), 0], dashed: true }], COLORS.ink2, 38)
    // leader from the top of the χ = ±6 columns (h¹¹ + h²¹ ≤ 259) up and away from the mirror axis to the callout
    // (to the right on wide screens, mirrored to the left in portrait where the right edge is too close)
    this.leader = createHairlines([{ a: [plotX(9), plotY(266), 0], b: [HI_LABEL[0], HI_LABEL[1], 0] }], COLORS.ink2)
    this.leaderL = createHairlines([{ a: [plotX(-9), plotY(266), 0], b: [-HI_LABEL[0], HI_LABEL[1], 0] }], COLORS.ink2)
    for (const o of [this.axes, this.mirror, this.leader, this.leaderL]) {
      o.frustumCulled = false
      o.raycast = () => {}
      this.group.add(o)
    }
    this.axes.renderOrder = this.mirror.renderOrder = this.leader.renderOrder = this.leaderL.renderOrder = 3
  }

  setData(pairs: Uint16Array) {
    if (this.points) return
    const n = pairs.length / 2
    const pos = new Float32Array(n * 3)
    const hi = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const a = pairs[i * 2]
      const b = pairs[i * 2 + 1]
      pos[i * 3] = plotX(2 * (a - b))
      pos[i * 3 + 1] = plotY(a + b)
      pos[i * 3 + 2] = 0
      hi[i] = Math.abs(2 * (a - b)) === 6 ? 1 : 0
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aHi', new THREE.BufferAttribute(hi, 1))
    this.points = new THREE.Points(g, this.mat)
    this.points.frustumCulled = false
    this.points.raycast = () => {}
    this.points.renderOrder = 2
    this.group.add(this.points)
  }

  update(opacity: number, reveal: number, dpr: number, hi: number, portrait: boolean) {
    this.group.visible = opacity > 0.002
    this.mat.uniforms.uOpacity.value = opacity
    this.mat.uniforms.uReveal.value = reveal
    this.mat.uniforms.uSize.value = 1.6 * dpr
    this.mat.uniforms.uHi.value = hi
    this.axes.material.uniforms.uOpacity.value = opacity * 0.9
    this.mirror.material.uniforms.uOpacity.value = opacity * 0.75
    this.leader.material.uniforms.uOpacity.value = portrait ? 0 : opacity * hi * 0.9
    this.leaderL.material.uniforms.uOpacity.value = portrait ? opacity * hi * 0.9 : 0
  }

  dispose() {
    this.points?.geometry.dispose()
    this.mat.dispose()
    this.axes.geometry.dispose()
    this.axes.material.dispose()
    this.mirror.geometry.dispose()
    this.mirror.material.dispose()
    for (const l of [this.leader, this.leaderL]) {
      l.geometry.dispose()
      l.material.dispose()
    }
  }
}
