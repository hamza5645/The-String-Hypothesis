/*
 * The chapter's conductor. Runs once per frame before every other frame callback in this chapter
 * (priority −3) and turns scroll + lab state into one shared, allocation-free description of the
 * stage: beat weights, camera pose, the gravitational-wave state and where the ring / loop / tile sit.
 * Sub-components only read `D`.
 */
import * as THREE from 'three'
import { HANDOFF, handoffFit } from '@/core/handoff'
import type { ChapterHandle } from '@/core/chapter'
import { damp, lerp, smoothstep, TAU } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import { settings } from '@/core/settings'
import { makeWave, mixWave, waveState, type Spin, type Wave } from './model'
import { useGravity } from './store'

export const STEPS = ['title', 'origin', 'forces', 'gr', 'qg', 'spin2', 'aha', 'forced', 'lab', 'outro'] as const
export const S = { title: 0, origin: 1, forces: 2, gr: 3, qg: 4, spin2: 5, aha: 6, forced: 7, lab: 8, outro: 9 } as const
/** Step lengths (viewports) — the Overlay uses the same numbers. */
export const LEN = { title: 1.15, origin: 1.25, forces: 1.6, gr: 1.7, qg: 1.8, spin2: 1.7, aha: 2.6, forced: 1.7, lab: 2.6, outro: 1.15 } as const
/** Title-step local progress at chapter progress 0 (viewport centre is half a screen into the section). */
export const TITLE_P0 = 0.5 / LEN.title

const N = STEPS.length
const DELTA = 0.13 // half-width of the camera / layout cross-fade between beats, in beat units
/** Figures and labels never cross-fade in place: a beat's own figure is gone by its step's end (DOUT) and
 *  the next one only starts after the boundary (DIN), so two figure systems never share the screen. */
export const DOUT = 0.12
export const DIN = 0.12
const TAN = Math.tan(((HANDOFF.camera.fov * Math.PI) / 180) / 2)

/** Lab ring radius R (content pack § Model); the loop's R_s lives in LAYOUT (0.8, smaller on phones). */
export const R_LAB = 1.0

export const D = {
  ready: false,
  t: 0,
  dt: 0,
  aspect: 1.6,
  mobile: false,
  pxH: 900,
  reduced: false,
  /** Beat coordinate: Σ step progress (0 … 10). */
  b: 0,
  /** Camera / layout weights: a partition of unity that cross-fades across each boundary. */
  w: new Float32Array(N),
  /** Visibility weights for a beat's own figure + labels: exit before the boundary, enter after it. */
  v: new Float32Array(N),
  sp: new Float32Array(N),
  /** Lab labels (tile, captions): after the loop has settled into its lab spot. */
  labLbl: 0,
  /** Glint angle (= φ, or a fixed spread under reduced motion so the two glints stay apart). */
  glintPhi: 0,
  /** handoffFit(aspect) — the H2 radius factor. */
  fit: 1,

  /* camera */
  cam: { az: 0, pol: Math.PI / 2, d: 10, tx: 0, ty: 0, tz: 0 },
  shiftX: 0,
  shiftY: 0,
  /** World units per CSS pixel on the z = 0 plane (face-on beats). */
  wpp: 0.01,

  /* wave */
  phi: 0,
  /** Accumulated lab phase. */
  phiAcc: 0,
  wave: makeWave(), // drives the ring
  loopWave: makeWave(), // drives the loop (the lock)
  spin: 2 as Spin,
  circular: false,
  psi: 0, // radians, effective (narrative or lab)
  A: 0.2,
  chirp: 0, // 0..1 while a chirp animation runs

  /* layout (world, z = 0 plane) */
  ringX: 0,
  ringY: 0,
  ringR: 1.2,
  ringVis: 0,
  loopX: 2,
  loopY: 0,
  /** Current rest radius of the string-side loop (R_s, smaller on phones). */
  loopR: 0.8,
  loopVis: 0,
  tileX: 0,
  tileY: 0.9,
  lock: 0,
  labSpin: 2 as Spin,
}

/**
 * Where things sit, per context (world units on the z = 0 plane). Desktop keeps the subject right of the
 * text column (Beats) or left of the lab panel (Lab); phones compose everything in the upper half, above
 * the bottom-anchored text, with ring | tile | loop side by side so the "=" reads at a glance.
 */
type XY = readonly [number, number]
interface Triptych {
  ring: XY
  loop: XY
  tile: XY
  ringR: number
  loopR: number
}
const LAYOUT = {
  desktop: {
    aha: { ring: [-2.05, -0.05], loop: [2.05, -0.05], tile: [0, 1.28], ringR: 1.0, loopR: 0.8 } as Triptych,
    lab: { ring: [-1.6, -0.1], loop: [1.6, -0.1], tile: [0, 1.62], ringR: 1.0, loopR: 0.8 } as Triptych,
    forcedLoop: [0.55, 0.5] as XY,
    forcedRing: [-2.6, 0] as XY,
  },
  mobile: {
    aha: { ring: [-0.98, -0.75], loop: [1.04, -0.75], tile: [0, 1.02], ringR: 0.72, loopR: 0.58 } as Triptych,
    lab: { ring: [-0.98, -0.55], loop: [1.04, -0.55], tile: [0, 1.02], ringR: 0.72, loopR: 0.58 } as Triptych,
    forcedLoop: [-0.95, 0.95] as XY,
    forcedRing: [-0.98, -0.45] as XY,
  },
}
export const layoutFor = (mobile: boolean) => (mobile ? LAYOUT.mobile : LAYOUT.desktop)

/** Beats whose figure steps aside on phones as their text scrolls away. */
const MOBILE_FADE = [S.forces, S.gr, S.qg, S.spin2, S.forced] as const

// scratch
const wA = makeWave()
const wB = makeWave()
const labView = { x: 0, ring: 1, str: 1 }

/** Soft window over [a, b] in beat units, as a partition of unity across neighbours. */
function weights(b: number, out: Float32Array) {
  for (let i = 0; i < N; i++) {
    const lo = i === 0 ? 1 : smoothstep(i - DELTA, i + DELTA, b)
    const hi = i === N - 1 ? 0 : smoothstep(i + 1 - DELTA, i + 1 + DELTA, b)
    out[i] = lo * (1 - hi)
  }
}

/** Sequenced visibility: beat i fades in over [i, i + DIN] and out over [i + 1 − DOUT, i + 1]. */
function visibility(b: number, out: Float32Array) {
  for (let i = 0; i < N; i++) {
    const inn = i === 0 ? 1 : smoothstep(i, i + DIN, b)
    const ex = i === N - 1 ? 0 : smoothstep(i + 1 - DOUT, i + 1, b)
    out[i] = inn * (1 - ex)
  }
}

/** Camera distance so that a half-extent (hw, hh) fits in fractions (fw, fh) of the half-viewport. */
export const fitD = (hw: number, hh: number, aspect: number, fw = 1, fh = 1) => Math.max(hh / (TAN * fh), hw / (TAN * aspect * fw))

interface Pose {
  az: number
  pol: number
  d: number
  tx: number
  ty: number
  sx: number
  sy: number
}
const poses: Pose[] = Array.from({ length: N }, () => ({ az: 0, pol: Math.PI / 2, d: 10, tx: 0, ty: 0, sx: 0, sy: 0 }))
const setPose = (i: number, az: number, pol: number, d: number, tx: number, ty: number, sx: number, sy: number) => {
  const p = poses[i]
  p.az = az
  p.pol = pol
  p.d = d
  p.tx = tx
  p.ty = ty
  p.sx = sx
  p.sy = sy
}

/** Right edge (CSS px) of the free stage left of the docked lab panel: W − gutter − margin(197 − gutter/2) − 360 − 28. */
const labRegionRight = (W: number) => {
  const gutter = Math.min(56, Math.max(16, 0.04 * W))
  return W - gutter - (197 - gutter / 2) - 360 - 28
}

/**
 * Pose `i` so that the world box [cx0, cx1] × [cy0, cy1] (z = 0 plane, face-on) fills the screen region
 * [px0, px1] × [py0, py1] (CSS px from the top-left), using an off-axis view shift for the offset.
 */
function frame(i: number, az: number, pol: number, cx0: number, cx1: number, cy0: number, cy1: number, px0: number, px1: number, py0: number, py1: number, aspect: number) {
  const W = D.pxH * aspect
  const H = D.pxH
  const d = fitD((cx1 - cx0) / 2, (cy1 - cy0) / 2, aspect, (px1 - px0) / W, (py1 - py0) / H)
  setPose(i, az, pol, d, (cx0 + cx1) / 2, (cy0 + cy1) / 2, (px0 + px1) / (2 * W) - 0.5, 0.5 - (py0 + py1) / (2 * H))
}

/**
 * Phones: a beat's text is bottom-anchored, so when its sticky hold ends (local p = 1 − 0.5/len) the text
 * scrolls up *through* the figure above it. Scene labels of step `i` fade out as that starts (1 on desktop).
 */
export function labelFade(i: number) {
  // Beat 5 fades its own (centred) text before it can scroll through the triptych, so its figure stays up
  if (!D.mobile || i === S.aha) return 1
  const p0 = 1 - 0.5 / LEN[STEPS[i]]
  return 1 - smoothstep(p0 - 0.03, p0 + 0.07, D.sp[i])
}

export function narrativePsiSpin2(p: number) {
  // Beat 4: + (ψ = 0) until 0.45, scrub to × by 0.68, hold (inside the step's sticky window)
  return (Math.PI / 4) * smoothstep(0.45, 0.68, p)
}
export function narrativePsiAha(a: number) {
  // rotate together while the text is still docked (its sticky hold ends at 1 − 0.5/2.6 ≈ 0.81)
  return (Math.PI / 4) * smoothstep(0.67, 0.76, a)
}
/** Beat 5 text fade (the Overlay dims its centred text out before it scrolls up through the figure). */
export const ahaTextFade = (a: number) => 1 - smoothstep(0.78, 0.83, a)

export function direct(h: ChapterHandle, t: number, dt: number, width: number, height: number) {
  const aspect = width / Math.max(1, height)
  const mobile = aspect < 0.8
  D.t = t
  D.dt = dt
  D.aspect = aspect
  D.mobile = mobile
  D.pxH = height
  D.reduced = prefersReducedMotion()
  D.fit = handoffFit(aspect)

  let b = 0
  for (let i = 0; i < N; i++) {
    const p = h.step(STEPS[i])
    D.sp[i] = p
    b += p
  }
  D.b = b
  weights(b, D.w)
  visibility(b, D.v)
  const w = D.w
  const v = D.v
  const sp = D.sp
  if (mobile) {
    // phones: a beat's bottom-anchored text scrolls up through the figure once its hold ends — the figure
    // (not only its labels) steps aside first. Beat 5 fades its own text instead; the Lab is a bottom sheet.
    for (let k = 0; k < MOBILE_FADE.length; k++) v[MOBILE_FADE[k]] *= labelFade(MOBILE_FADE[k])
  }
  D.labLbl = smoothstep(S.lab + 0.1, S.lab + 0.26, b) * v[S.lab]

  /* ─────────────── lab state ─────────────── */
  const g = useGravity.getState()
  const inLab = w[S.lab] > 0.02

  /* ─────────────── wave phase ─────────────── */
  // Default display rate 0.35 Hz; the lab's speed slider takes over while the lab is on screen.
  // Reduced motion: no ambient motion — the phase follows scroll instead (still interactive in the lab).
  const labPaused = g.paused || g.speed <= 0
  let rate = 0.35
  if (inLab) rate = labPaused ? 0 : g.speed
  // chirp: a slowed display sweep f = f₀(1 − τ/τc)^(−3/8), amplitude ∝ f^(2/3)
  let chirpAmp = 1
  D.chirp = 0
  if (g.chirpAt > 0 && inLab) {
    const tau = (performance.now() - g.chirpAt) / 1000
    const Td = 2.4
    if (tau >= 0 && tau < Td + 0.5) {
      const tc = Td / 0.9947
      const f = 0.5 * Math.pow(Math.max(1e-3, 1 - Math.min(tau, Td) / tc), -3 / 8)
      rate = tau < Td ? f : 3.57
      chirpAmp = Math.pow(f / 3.57, 2 / 3) * 1.5 * (tau < Td ? 1 : Math.exp(-(tau - Td) / 0.12))
      D.chirp = tau < Td ? 1 : Math.exp(-(tau - Td) / 0.12)
    }
  }
  if (!D.ready) {
    D.phiAcc = TAU * 0.35 * t
    D.ready = true
  }
  if (D.reduced && !inLab) {
    // reduced motion: no wave motion in the story — a fixed snapshot at full stretch (phase 0); the Ring and
    // Thread overlay the matching half-cycle snapshot (phase ½) and the reference circle is phase ¼
    D.phiAcc = 0
  } else if (inLab && labPaused && D.chirp === 0) {
    D.phiAcc = (g.phase * Math.PI) / 180
  } else {
    D.phiAcc += TAU * rate * dt
  }
  D.phi = D.phiAcc
  D.glintPhi = D.reduced && !inLab ? 1.05 : D.phi

  /* ─────────────── wave state: narrative ⊕ lab ─────────────── */
  const pSpin2 = sp[S.spin2]
  const a = sp[S.aha]
  const wn = w[S.spin2] + w[S.aha] + w[S.forced] + 1e-6
  const psiN = (w[S.spin2] * narrativePsiSpin2(pSpin2) + w[S.aha] * narrativePsiAha(a) + w[S.forced] * (Math.PI / 4)) / wn
  // Beat 5: the ring calms to 60 % while the string unfurls, then both breathe at full strain once they lock
  const lockAmp = b < S.aha + 1 ? smoothstep(0.6, 0.64, a) : 1
  const AN = (w[S.spin2] * 0.2 + (w[S.aha] + w[S.forced]) * lerp(0.12, 0.2, lockAmp)) / wn
  const RN = (w[S.spin2] * 1.2 + (w[S.aha] + w[S.forced]) * R_LAB) / wn
  waveState(wA, 2, false, psiN, AN, D.phi, RN)

  const labPsi = (g.psi * Math.PI) / 180
  const labA = g.amp * chirpAmp
  waveState(wB, g.spin, g.spin === 0 ? false : g.circular, labPsi, labA, D.phi, R_LAB)
  const kLab = smoothstep(0.35, 0.65, w[S.lab] + w[S.outro])
  mixWave(D.wave, wA, wB, kLab)
  D.spin = kLab > 0.5 ? g.spin : 2
  D.labSpin = g.spin
  D.circular = kLab > 0.5 ? g.spin !== 0 && g.circular : false
  D.psi = lerp(psiN, labPsi, kLab)
  D.A = lerp(AN, labA, kLab)

  // the loop locks onto the ring's pattern in Beat 5 (a 0.6 → 0.64, as the lock wires land) and stays locked
  const lockAha = smoothstep(0.6, 0.64, a)
  D.lock = b < S.aha ? 0 : b < S.aha + 1 ? lockAha : 1
  mixWave(D.loopWave, wA, wB, kLab)

  /* ─────────────── layout per beat ─────────────── */
  // Persistent objects move only while nothing else is drawn next to them: the ring slides spin2 → aha
  // (both beats' labels are out), the loop waits for Beat 5's labels to clear before it glides to Beat 6,
  // and for Beat 6's labels before it glides into the Lab.
  const LY = layoutFor(mobile)
  // ring
  const ringVisSpin2 = smoothstep(0.02, 0.2, pSpin2)
  const kA = smoothstep(S.aha - DELTA, S.aha + DELTA, b)
  const inLabLayout = b >= S.lab
  const ringX = inLabLayout ? LY.lab.ring[0] : LY.aha.ring[0] * kA
  const ringY = inLabLayout ? LY.lab.ring[1] : LY.aha.ring[1] * kA
  const kPost = smoothstep(S.spin2 + 1 - DELTA, S.spin2 + 1 + DELTA, b)
  // (aha and lab share one ring radius)
  const ringR = lerp(mobile ? 1.02 : 1.2, LY.aha.ringR, kPost)
  const vr = g.view !== 'string' ? 1 : 0
  const vs = g.view !== 'ring' ? 1 : 0
  labView.ring = dt > 0 ? damp(labView.ring, vr, 5, dt) : vr
  labView.str = dt > 0 ? damp(labView.str, vs, 5, dt) : vs
  const viewRing = labView.ring
  const viewString = labView.str
  D.ringX = ringX
  D.ringY = ringY
  D.ringR = ringR
  // story ring: Beat 4 → Beat 5 (continuous), gone before Beat 6 starts; the Lab brings its own back
  const ringStory = b < S.spin2 ? 0 : b < S.aha ? ringVisSpin2 : 1 - smoothstep(S.forced - DOUT, S.forced, b)
  D.ringVis = (b < S.forced ? ringStory : 0) + v[S.lab] * viewRing

  // loop (string side): aha spot → (after Beat 5's labels are gone) Beat 6 spot → (after Beat 6's) the Lab spot
  const kF = smoothstep(S.forced, S.forced + 0.22, b)
  const kL = smoothstep(S.lab, S.lab + 0.22, b)
  D.loopX = lerp(lerp(LY.aha.loop[0], LY.forcedLoop[0], kF), LY.lab.loop[0], kL)
  D.loopY = lerp(lerp(LY.aha.loop[1], LY.forcedLoop[1], kF), LY.lab.loop[1], kL)
  D.loopR = LY.aha.loopR
  D.loopVis = w[S.lab] * viewString + (1 - w[S.lab])

  // tile (never visible across the forced → lab boundary, so it can jump)
  D.tileX = b < S.lab ? LY.aha.tile[0] : LY.lab.tile[0]
  D.tileY = b < S.lab ? LY.aha.tile[1] : LY.lab.tile[1]

  /* ─────────────── camera poses ─────────────── */
  // frame(i, …, content box in world units, screen region in px): fits the box into the region.
  const P2 = Math.PI / 2
  const hd = HANDOFF.camera.position[2]
  const W = width
  const Hh = height
  setPose(S.title, 0, P2, hd, 0, 0, 0, 0)
  setPose(S.origin, 0, P2, hd, 0, 0, 0, 0)
  // Beat 4 enters ~40° oblique and tilted so the plane wavefronts read as stacking along z, face-on by p 0.3
  const face4 = smoothstep(0.04, 0.3, pSpin2)
  const az4 = 0.7 * (1 - face4)
  const pol4 = P2 - 0.22 * (1 - face4)
  // Beat 2 ends edge-on (az 0, pol π/2) so the flattened sheet is one hairline: Beat 3's x-axis
  const flat2 = smoothstep(0.78, 1, sp[S.gr])
  const az2 = lerp(-0.3, 0, flat2)
  const pol2 = lerp(P2 - 0.44, P2, flat2)
  if (mobile) {
    // phones: the subject lives above the bottom-anchored text (≈ the top 53 % of the screen)
    frame(S.forces, 0, P2, -1.62, 1.62, -2.26, 1.56, 12, W - 12, 92, Hh * 0.535, aspect)
    setPose(S.gr, az2, pol2, fitD(2.6, 2.4, aspect, 0.98, 0.6), 0, -0.2, 0, 0.2)
    frame(S.qg, 0, P2, -2.0, 1.78, -1.66, 1.98, 10, W - 10, 100, Hh * 0.515, aspect)
    setPose(S.spin2, az4, pol4, fitD(1.75, 1.75, aspect, 0.95, 0.6), 0, 0, 0, 0.2)
    // (with "Deeper physics" on, Beat 5's centred text grows by its Deeper block: keep the triptych above it)
    frame(S.aha, 0, P2, -1.95, 1.95, -1.85, 1.74, 10, W - 10, 96, Hh * (settings().deeper ? 0.52 : 0.63), aspect)
    frame(S.forced, 0, P2, -1.64, 1.64, -1.34, 1.58, 12, W - 12, 96, Hh * 0.6, aspect)
    frame(S.lab, 0, P2, -1.95, 1.95, -1.4, 1.74, 10, W - 10, 96, Hh * 0.525, aspect)
  } else {
    // desktop: the subject lives in x ∈ [≈0.4, ≈0.88] of the screen (text column left, chapter rail right)
    setPose(S.forces, 0, P2, fitD(2.95, 2.1, aspect, 0.49, 0.8), 0, -0.35, 0.145, 0.02)
    setPose(S.gr, az2, pol2, fitD(3.25, 2.3, aspect, 0.5, 0.86), 0, -0.3, 0.145, 0.02)
    setPose(S.qg, 0, P2, fitD(2.75, 2.3, aspect, 0.48, 0.8), 0, -0.05, 0.15, -0.01)
    setPose(S.spin2, az4, pol4, fitD(2.3, 2.3, aspect, 0.5, 0.92), 0, 0, 0.145, 0)
    // Beat 5 triptych above the centred text; the camera eases in 10 % at the lock
    frame(S.aha, 0, P2, -3.3, 3.35, -1.5, 2.02, 150, W - 190, 96, Hh - (settings().deeper ? 300 : 212), aspect)
    poses[S.aha].d *= 1 - 0.1 * smoothstep(0.6, 0.66, a) * (1 - smoothstep(0.78, 0.92, a))
    setPose(S.forced, 0, P2, fitD(2.75, 2.15, aspect, 0.49, 0.8), 0, -0.25, 0.15, 0.02)
    // Lab: ring | tile | loop, left of the docked panel (panel geometry mirrors styles.css)
    frame(S.lab, 0, P2, -3.4, 2.9, -1.92, 2.22, 118, labRegionRight(W), 84, Hh - 26, aspect)
  }
  setPose(S.outro, 0, P2, hd, 0, 0, 0, 0)

  // lab "view": ring-only / string-only recentre the camera on the remaining side
  const labCX = poses[S.lab].tx
  const tgtView = g.view === 'ring' ? LY.lab.ring[0] : g.view === 'string' ? LY.lab.loop[0] : labCX
  labView.x = dt > 0 ? damp(labView.x, tgtView, 4, dt) : tgtView
  poses[S.lab].tx = labView.x

  let az = 0
  let pol = 0
  let d = 0
  let tx = 0
  let ty = 0
  let sx = 0
  let sy = 0
  for (let i = 0; i < N; i++) {
    const k = w[i]
    if (k <= 0) continue
    const p = poses[i]
    az += k * p.az
    pol += k * p.pol
    d += k * Math.log(p.d)
    tx += k * p.tx
    ty += k * p.ty
    sx += k * p.sx
    sy += k * p.sy
  }
  // handoff frames are exact
  const home = w[S.title] + w[S.origin] > 0.99999 || w[S.outro] > 0.99999
  D.cam.az = home ? 0 : az
  D.cam.pol = home ? P2 : pol
  D.cam.d = home ? hd : Math.exp(d)
  D.cam.tx = tx
  D.cam.ty = ty
  D.cam.tz = 0
  D.shiftX = home ? 0 : sx
  D.shiftY = home ? 0 : sy
  D.wpp = (2 * D.cam.d * TAN) / Math.max(1, height)
}

/** Place a camera on the orbit described by D.cam (exact HANDOFF pose when az = 0, pol = π/2, d = 10). */
export function applyCamera(camera: THREE.PerspectiveCamera) {
  const c = D.cam
  const sp = Math.sin(c.pol)
  camera.position.set(c.tx + c.d * sp * Math.sin(c.az), c.ty + c.d * Math.cos(c.pol), c.tz + c.d * sp * Math.cos(c.az))
  camera.lookAt(c.tx, c.ty, c.tz)
  if (Math.abs(camera.fov - HANDOFF.camera.fov) > 1e-4) {
    camera.fov = HANDOFF.camera.fov
    camera.updateProjectionMatrix()
  }
}

export type { Wave }
