import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Backdrop, GlowPoints, HandoffLoop, loopFn, OrbitRig, useChapterFrame, useHandoffFit, useViewShift, COLORS, type FilamentFn, type GlowPointsApi } from '@/gl'
import { useChapter } from '@/core/chapter'
import { HANDOFF } from '@/core/handoff'
import { claimPointer, explore, setStageCursor } from '@/core/explore'
import { clamp, lerp, range, smoothstep, TAU } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { particleScale, useSettings } from '@/core/settings'
import { pluck, tick } from '@/core/audio'
import { cam, COLL, compose, KEEP, LOOP_REST, LOOP_REST_M, mass, MASS_S, onoff, opening, rider, riderEnds, rule, ruler, thing, touch, world } from './beats'
import { newBrane, resetBrane, tag, type Frame } from './frame'
import { createBraneGeometry, createBraneMaterial, createHairMaterial, DotBatch, FADE, FIELD, HairBatch, staticHair, StringBatch } from './gfx'
import { Hud, type Tag } from './hud'
import { LabSim } from './lab'
import { fmtGeV, fmtMeters, gravityLines, lsMeters, MS_GEV, stacksOf, stretchedMass } from './model'
import { paintTexture } from './paint'
import { pinEnd, pinStart, STEPS } from './steps'
import { ladderPairMemo, useBranes } from './store'

/*
 * Chapter 07 · Branes — the stage.
 * One director (useChapterFrame, priority −5) turns scroll progress into a Frame (camera, branes, strings,
 * hairlines, beads, tags, HUD) via the beat functions in beats.ts; the Scene then applies it to a handful of
 * batched GPU objects (≈ 12 draw calls, ≈ 60k triangles). Tags are projected after the camera settles
 * (priority 0). Handoffs: progress 0 and 1 render the canonical <HandoffLoop/> at the origin, camera at
 * HANDOFF.camera, view shift [0, 0].
 */

type Align = 'left' | 'right' | 'center' | 'above' | 'below'
type Tone = 'ink' | 'dim' | 'field' | 'filament'
interface TagDef {
  align: Align
  tone: Tone
  text: string
  md?: boolean
  status?: 'speculative' | 'derived'
  /** keep letter case (units like ℓ_s, M_s must not be uppercased) */
  nc?: boolean
  /** keep line breaks on phones too */
  pre?: boolean
}
const T = (align: Align, tone: Tone, text: string, o: Partial<TagDef> = {}): TagDef => ({ align, tone, text, ...o })
const TAGS: Record<string, TagDef> = {
  endA: T('right', 'filament', 'end'),
  endB: T('left', 'filament', 'end'),
  ax: T('left', 'field', 'x'),
  ay: T('above', 'field', 'y'),
  az: T('right', 'field', 'z'),
  nx: T('left', 'field', 'x · slides (Neumann)'),
  nz: T('below', 'field', 'z · slides (Neumann)'),
  dy: T('above', 'ink', 'y · pinned (Dirichlet) · y = 0'),
  rulesM: T('above', 'ink', 'y · pinned (Dirichlet) · y = 0\nx · slides (Neumann)\nz · slides (Neumann)', { pre: true }),
  dbrane: T('above', 'field', 'D-brane · where the ends can be', { md: true }),
  ripple: T('above', 'ink', 'a ripple of the brane = open strings with both ends on it'),
  rr: T('left', 'field', 'RR charge · the brane is a source of a closed-string field'),
  openS: T('below', 'filament', 'open string · ends on the brane · e.g. photon-like'),
  closedS: T('right', 'filament', 'closed string · no ends · e.g. graviton'),
  bulkArrow: T('left', 'field', 'into the bulk'),
  collide: T('below', 'ink', 'two open strings in → one open string + one closed loop out'),
  u1: T('above', 'filament', '1–1 · lightest mode massless\na U(1) field on the brane’s worldvolume'),
  b1: T('left', 'field', 'brane 1'),
  b2: T('left', 'field', 'brane 2'),
  b3: T('left', 'field', 'brane 3'),
  b4: T('left', 'field', 'brane 4'),
  // the bench's sheet labels hang just below each ◇ handle, over their own sheet only
  hb1: T('left', 'field', 'brane 1', { pre: true }),
  hb2: T('left', 'field', 'brane 2', { pre: true }),
  hb3: T('left', 'field', 'brane 3', { pre: true }),
  hb4: T('left', 'field', 'brane 4', { pre: true }),
  ruler: T('left', 'ink', 'd', { nc: true }),
  lruler: T('right', 'ink', 'd', { nc: true, pre: true }),
  s12: T('left', 'filament', '1→2'),
  s21: T('left', 'filament', '2→1'),
  higgs: T('right', 'ink', '', { nc: true }),
  ours: T('above', 'ink', 'Our 3D space? · drawn as 2D', { md: true, status: 'speculative' }),
  matter: T('below', 'filament', 'matter and light: open strings'),
  confined: T('left', 'ink', 'forces confined to the brane'),
  gspread: T('above', 'field', 'gravity spreads into the bulk'),
  slabtb: T('above', 'field', 'top ≡ bottom: the extra direction closes on itself'),
  far: T('below', 'field', 'far from the mass: along the brane again,\nonly weaker', { pre: true }),
  cross: T('right', 'ink', 'a closed string passing through · two points'),
  amass: T('below', 'ink', 'a mass'),
  lmatter: T('above', 'filament', 'matter and light'),
  lgrav: T('above', 'filament', 'closed strings · e.g. gravitons'),
  lref: T('left', 'ink', 'our 3D space?', { status: 'speculative' }),
  miss2: T('left', 'ink', 'missing momentum'),
  miss2r: T('right', 'ink', 'missing momentum'),
  miss2a: T('above', 'ink', 'missing momentum'),
  miss2b: T('below', 'ink', 'missing momentum'),
  lm0: T('left', 'ink', '', { nc: true }),
  lm1: T('left', 'ink', '', { nc: true }),
  lm2: T('left', 'ink', '', { nc: true }),
  lm3: T('left', 'ink', '', { nc: true }),
}

/** secondary annotations that would crowd a phone screen */
const MOBILE_HIDE = new Set(['ax', 'ay', 'az', 'add', 'slabtb', 'far', 'confined', 'nz', 's12', 's21', 'lmatter', 'matter'])

const N_STEPS = STEPS.length
/** scratch brane positions for the bench (one array per brane count, so ys.length stays exact) */
const CUR_YS: number[][] = [[], [0], [0, 0], [0, 0, 0], [0, 0, 0, 0]]
/** right-edge vignette span, as fractions of the viewport width (the chapter rail sits beyond ≈ 0.9) */
const EDGE0 = 0.8
const EDGE1 = 0.9
/**
 * Bench drag handles (◇) sit just outside each sheet's LEFT edge, a little behind centre. In the default
 * outside view that spot is on screen (the right edge is under the docked panel), clear of the stage HUD, and
 * — unlike the back-left corner — never behind another sheet, so a handle reads as its own sheet's.
 */
const HANDLE_X = -5.45
const HANDLE_Z = -2.6
/** Per-brane visibility on the bench this frame (sheet opacity). Hit proxies of invisible sheets must not take taps. */
const VIS = [0, 0, 0, 0]
const VIS_MIN = 0.05

export default function Scene() {
  const h = useChapter()
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const fit = useHandoffFit()
  const quality = useSettings((s) => s.quality)

  /* ─────────────── GPU objects ─────────────── */
  const str = useMemo(() => new StringBatch(64), [])
  const hair = useMemo(() => new HairBatch(9000), [])
  const dots = useMemo(() => new DotBatch(240), [])
  const braneGeo = useMemo(() => [createBraneGeometry(96), createBraneGeometry(36)], [])
  const braneMats = useMemo(() => [0, 1, 2, 3].map(() => createBraneMaterial()), [])
  const paint = useMemo(() => paintTexture(), [])
  const rrGeo = useMemo(buildRR, [])
  const rrMat = useMemo(createHairMaterial, [])
  const gravGeo = useMemo(buildGravity, [])
  const gravMat = useMemo(createHairMaterial, [])
  const dust = useMemo(() => buildDust(quality === 'low' ? 0 : Math.round(1500 * particleScale())), [quality])
  const sim = useMemo(() => new LabSim(), [])
  const brRefs = useRef<(THREE.Mesh | null)[]>([])
  const dotsRef = useRef<GlowPointsApi>(null)
  const loopGroup = useRef<THREE.Group>(null!)
  const loopMat = useRef<THREE.ShaderMaterial | null>(null)

  useEffect(
    () => () => {
      str.dispose()
      hair.dispose()
      braneGeo.forEach((g) => g.dispose())
      braneMats.forEach((m) => m.dispose())
      rrGeo.dispose()
      rrMat.dispose()
      gravGeo.dispose()
      gravMat.dispose()
    },
    [str, hair, braneGeo, braneMats, rrGeo, rrMat, gravGeo, gravMat],
  )
  useEffect(() => {
    for (const m of braneMats) m.uniforms.uPaint.value = paint
  }, [braneMats, paint])

  /* ─────────────── HUD (DOM, in the scene-labels layer) ─────────────── */
  const hudRef = useRef<Hud | null>(null)
  const tagsRef = useRef<Map<string, Tag>>(new Map())
  useLayoutEffect(() => {
    const host = document.getElementById('scene-labels')
    if (!host) return
    const hud = new Hud(host)
    hudRef.current = hud
    const m = new Map<string, Tag>()
    for (const [key, d] of Object.entries(TAGS)) m.set(key, hud.tag(d.align, d.tone, d.text, d.md ? 'md' : 'sm', d.status, d.nc, d.pre))
    tagsRef.current = m
    return () => {
      hud.dispose()
      hudRef.current = null
      m.clear()
    }
  }, [])

  // label widths (for keeping them on screen) change with the viewport and once the web fonts arrive
  useEffect(() => {
    const again = () => tagsRef.current.forEach((t) => t.remeasure())
    again()
    let alive = true
    document.fonts?.ready.then(() => alive && again())
    return () => {
      alive = false
    }
  }, [size.width, size.height])

  /* ─────────────── the frame ─────────────── */
  const frame = useMemo<Frame>(
    () => ({
      t: 0,
      tw: 0,
      te: 0,
      dt: 0,
      mobile: false,
      aspect: 1,
      W: 1,
      H: 1,
      wpp: 0.01,
      ringK: 1,
      fadeAt: () => 1,
      ndcY: () => 0,
      ndcX: () => 0,
      cam: { az: 0, pol: Math.PI / 2, dist: 10, tx: 0, ty: 0, tz: 0 },
      shift: [0, 0],
      slab: { on: false, y: 0, h: 100 },
      br: [newBrane(), newBrane(), newBrane(), newBrane()],
      loop: { x: 0, y: 0, z: 0, s: 1, op: 1, w: 1, rx: 0, ry: 0, rz: 0 },
      rr: { op: 0, rise: 0, y: 0 },
      grav: { op: 0, reveal: 0 },
      dust: 1,
      fade: { axis: 0, from: 0, to: 1, amount: 0, edge: 0 },
      str,
      hair,
      dots,
      hud: null as unknown as Hud,
      tags: new Map(),
      link: { x: 0, y: 0, z: 0, o: 0 },
      stamp: 0,
    }),
    [str, hair, dots],
  )
  const sp = useMemo(() => new Float32Array(N_STEPS), [])
  const fv = useMemo(() => new THREE.Vector3(), [])
  frame.fadeAt = (x, y, z) => {
    const fd = frame.fade
    fv.set(x, y, z).project(camera)
    const sx = (fv.x * 0.5 + 0.5) * frame.W
    const c = fd.axis === 0 ? sx : (fv.y * 0.5 + 0.5) * frame.H
    return lerp(1, smoothstep(fd.from, fd.to, c), fd.amount) * (1 - fd.edge * smoothstep(EDGE0 * frame.W, EDGE1 * frame.W, sx))
  }
  frame.ndcY = (x, y, z) => fv.set(x, y, z).project(camera).y
  frame.ndcX = (x, y, z) => fv.set(x, y, z).project(camera).x
  const cur = useRef({ step: 0, p: 0, labK: 0 })

  // H2: canonical loopFn, optionally blended with the bulk-loop wobble r(θ) = r₀(1 + 0.08 cos(2θ − 3t))
  const canon = useMemo(() => loopFn(HANDOFF.H2.wobble, HANDOFF.H2.radius * fit), [fit])
  const loopBlend = useMemo<FilamentFn>(
    () => (u, t, out, i) => {
      canon(u, t, out, i)
      const w = frame.loop.w
      if (w >= 1) return
      const th = u * TAU
      const R = HANDOFF.H2.radius * fit
      const r = R * (1 + 0.08 * Math.cos(2 * th - 3 * t))
      out.set(lerp(r * Math.cos(th), out.x, w), lerp(r * Math.sin(th), out.y, w), lerp(0, out.z, w))
    },
    [canon, fit, frame],
  )

  /* ─────────────── lab interaction ─────────────── */
  const labOn = useRef(false)
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const plane = useMemo(() => new THREE.Plane(), [])
  const hitV = useMemo(() => new THREE.Vector3(), [])
  const nrm = useMemo(() => new THREE.Vector3(), [])
  const pointerRay = () => {
    ndc.set(explore.nx, explore.ny)
    ray.setFromCamera(ndc, camera)
    return ray.ray
  }
  /** pointer ∩ vertical plane through (x, *, z) facing the camera (or the horizontal plane y if looking down) */
  const pointerOnPlane = (x: number, y: number, z: number, preferHorizontal: boolean) => {
    const r = pointerRay()
    if (preferHorizontal) {
      plane.set(nrm.set(0, 1, 0), -y)
    } else {
      nrm.set(camera.position.x - x, 0, camera.position.z - z)
      if (nrm.lengthSq() < 1e-6) nrm.set(0, 0, 1)
      nrm.normalize()
      plane.setFromNormalAndCoplanarPoint(nrm, hitV.set(x, y, z))
    }
    return r.intersectPlane(plane, hitV)
  }
  /** first visible brane (within its 10 × 10 extent) hit by the pointer ray, else null; in the slice only the reference */
  const braneUnderPointer = (ys: number[]) => {
    const r = pointerRay()
    const st = useBranes.getState()
    let best: number | null = null
    let bd = Infinity
    for (let j = 0; j < ys.length; j++) {
      if (VIS[j] < VIS_MIN || (st.viewpoint < 0.45 && j !== st.ref)) continue
      plane.set(nrm.set(0, 1, 0), -ys[j])
      const p = r.intersectPlane(plane, hitV)
      if (!p || Math.abs(p.x) > 5 || Math.abs(p.z) > 5) continue
      const d = p.distanceTo(r.origin)
      if (d < bd) {
        bd = d
        best = j
      }
    }
    return best
  }

  const onBraneDown = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    if (!labOn.current || sim.drag.active) return
    // a brane's drag handle behind another sheet still wins: let the event reach it
    if (e.intersections.some((x) => x.object.userData.brnHandle)) return
    // only a sheet you can see takes the tap; in the on-brane slice that is the reference brane alone.
    // (returning without stopPropagation passes the event on to the next sheet along the ray)
    const st0 = useBranes.getState()
    if (VIS[i] < VIS_MIN || (st0.viewpoint < 0.45 && i !== st0.ref)) return
    e.stopPropagation()
    claimPointer()
    const ys = st0.ys
    sim.beginDraw(i, clamp(e.point.x, -4.8, 4.8), clamp(e.point.z, -4.8, 4.8), ys[i])
    setStageCursor('grabbing')
  }
  const onHandleDown = (j: number) => (e: ThreeEvent<PointerEvent>) => {
    if (!labOn.current) return
    e.stopPropagation()
    claimPointer()
    sim.drag.active = true
    sim.drag.j = j
    setStageCursor('ns-resize')
  }
  useEffect(() => {
    const up = () => {
      if (sim.drag.active) {
        sim.drag.active = false
        setStageCursor('')
        return
      }
      if (!sim.draw.active) return
      const st = useBranes.getState()
      const d = sim.draw
      // released over a brane? prefer the brane nearest in height to the dragged end, then the ray hit
      const j = releaseTarget(st.ys)
      const res = sim.endDraw(frame.te, st.ys, j, d.px, d.pz)
      if (res === 'tap') st.setRef(d.i)
      else if (res === 'made') {
        st.setPair(null)
        useBranes.setState({ focus: 'draw' })
        tick(880)
        if (j != null) {
          hl.current.pj = j
          hl.current.pt0 = frame.te
        }
      }
      setStageCursor('')
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /** The brane a drawn string would end on if released now (null → the loose end snaps back). */
  const releaseTarget = (ys: number[]): number | null => {
    const d = sim.draw
    let j: number | null = null
    let bestDy = 0.45
    for (let k = 0; k < ys.length; k++) {
      if (VIS[k] < VIS_MIN) continue
      const dy = Math.abs(ys[k] - d.py)
      if (dy < bestDy && Math.abs(d.px) <= 5 && Math.abs(d.pz) <= 5) {
        bestDy = dy
        j = k
      }
    }
    if (j == null && !d.moved) j = braneUnderPointer(ys)
    return j
  }
  /** draw feedback: the sheet under the pointer (hover) and the sheet a string just landed on (pulse) */
  const hl = useRef({ hover: -1, pj: -1, pt0: -1e9 })

  // store requests → lab events
  const reqs = useRef({
    release: useBranes.getState().releaseReq,
    collide: useBranes.getState().collideReq,
    clear: useBranes.getState().clearReq,
    n: useBranes.getState().n,
    ys: null as number[] | null,
    nStacks: 0,
    nBranes: 0,
    physD: NaN,
    physS: '',
    phys: '',
    ruler: '',
  })

  /* ─────────────── director ─────────────── */
  useChapterFrame(
    (fi) => {
      const hud = hudRef.current
      if (!hud) return
      const f = frame
      f.hud = hud
      const reduced = prefersReducedMotion()
      f.te = fi.t
      f.t = reduced ? 2.5 : fi.t
      f.tw = f.t * (ambient() || 0) + (reduced ? 2.5 : 0)
      f.dt = fi.dt
      f.W = size.width
      f.H = size.height
      f.aspect = size.width / Math.max(1, size.height)
      f.mobile = f.aspect < 0.8 || size.width <= 720
      // reset
      f.stamp++
      str.begin()
      hair.begin()
      dots.begin()
      hud.begin()
      for (const b of f.br) resetBrane(b)
      f.loop.op = 0
      f.loop.w = 1
      f.loop.rx = f.loop.ry = f.loop.rz = 0
      f.rr.op = 0
      f.grav.op = 0
      f.slab.on = false
      f.slab.h = 100
      f.fade.amount = 0
      f.fade.edge = 0
      f.link.o = 0
      f.ringK = 1
      f.shift[0] = f.shift[1] = 0

      // which step holds the viewport's centre line
      let si = 0
      for (let i = 0; i < N_STEPS; i++) {
        sp[i] = h.step(STEPS[i].id)
        if (sp[i] > 0) si = i
      }
      const p = sp[si]
      cur.current.step = si
      cur.current.p = p
      // world units per CSS px at the target (approx, from the previous camera distance)
      f.wpp = (2 * f.cam.dist * Math.tan((HANDOFF.camera.fov * Math.PI) / 360)) / Math.max(1, f.H)

      const st = useBranes.getState()
      labOn.current = si === 8 && h.active() && p > 0.08 && p < 0.97
      hud.setMode(f.mobile, si >= 8, STEPS[si].id)

      if (si <= 1) opening(f, range(sp[0] + sp[1], pinStart('title'), 2))
      else if (si === 2) rule(f, p)
      else if (si === 3) thing(f, p)
      else if (si === 4) onoff(f, p)
      else if (si === 5) mass(f, p)
      else if (si === 6) touch(f, p)
      else if (si === 7) world(f, p)
      else if (si === 8) labBeat(f, p, 1, st)
      else exitBeat(f, range(p, 0, pinEnd('exit')), st)

      // tags → HUD
      hud.commit()
      // brane stacks dim a little so coincident sheets read as one brighter sheet, not a glare
      applyBranes(f)
      applyStatics(f)
      str.setView(size.width, size.height, dpr, 0.9)
      // the slab's soft edge: razor-thin in the slice (only true crossings survive), 0.3 ℓ_s once outside
      const sw = 0.03 + 0.27 * smoothstep(0.06, 1.2, f.slab.h)
      str.setSlab(f.slab.on, f.slab.y, f.slab.h, sw)
      hair.material.uniforms.uSlabOn.value = f.slab.on ? 1 : 0
      hair.material.uniforms.uSlabY.value = f.slab.y
      hair.material.uniforms.uSlabH.value = f.slab.h
      hair.material.uniforms.uSlabW.value = sw
      str.end()
      hair.end()
      dots.end(dotsRef.current)
      applyLoop(f)
      hud.setOpacity(fi.presence)
    },
    { priority: -5 },
  )

  /* ─────────────── lab + exit (need the store and the sim) ─────────────── */
  const framing = useRef({ lo: 0, hi: 3, ref: 0, init: false })
  const labCam = (f: Frame, V: number, yRef: number, ys?: number[]) => {
    const s = smoothstep(0, 1, V)
    // outside the brane, frame the whole stack (not just the reference sheet). The framing eases, and is
    // held still while a brane is being dragged — otherwise the camera would chase the pointer.
    let lo = yRef
    let hi = yRef
    if (ys) for (const y of ys) {
      lo = Math.min(lo, y)
      hi = Math.max(hi, y)
    }
    const fr = framing.current
    if (!fr.init || f.dt === 0) {
      fr.lo = lo
      fr.hi = hi
      fr.ref = yRef
      fr.init = true
    } else if (!sim.drag.active) {
      const k = 1 - Math.exp(-3 * f.dt)
      fr.lo += (lo - fr.lo) * k
      fr.hi += (hi - fr.hi) * k
      fr.ref += (yRef - fr.ref) * k
    }
    const span = fr.hi - fr.lo
    // phones: the bench shares the screen with the bottom-sheet panel, so it is framed smaller
    cam(f, 28 * s, 90 - 74 * s, 15 - 2.6 * s + span * s + 3.5 * Math.sin(Math.PI * s), 0, lerp(fr.ref, (fr.lo + fr.hi) / 2, s), 0, 2.05)
  }
  /** The bench's sheets, drag handles (◇) and labels. k = lab presence (positions), fade = extra alpha for marks. */
  const drawBranes = (f: Frame, st: ReturnType<typeof useBranes.getState>, k: number, V: number, fade: number) => {
    const ys = st.ys
    const n = st.n
    const h2 = 0.06 + 12 * V * V * V
    const curYs = CUR_YS[n]
    for (let i = 0; i < n; i++) curYs[i] = lerp(0, ys[i], k)
    const yR = curYs[st.ref] ?? 0
    const H = hl.current
    const pulseK = 1 - smoothstep(0, 0.4, f.te - H.pt0)
    VIS.fill(0)
    for (let i = 0; i < n; i++) {
      const b = f.br[i]
      b.y = curYs[i]
      const vis = 1 - smoothstep(h2, h2 + 0.3, Math.abs(curYs[i] - yR))
      b.op = (i === 0 ? 1 : k) * vis * (i === st.ref ? 1 : fade)
      VIS[i] = b.op
      b.fresnel = 0.1
      b.edge = (i === st.ref ? 0.55 : 0.4) * smoothstep(0.1, 0.45, V)
      // drawing: the sheet the string would land on lights its edge; a landing pulses it for 0.4 s
      if (i === H.hover) b.edge = Math.max(b.edge, 0.8)
      if (i === H.pj && pulseK > 0) b.edge += 0.5 * pulseK
      // in the on-brane slice the reference sheet reads as unbounded
      b.soft = i === st.ref ? 1 - smoothstep(0.1, 0.45, V) : 0
      // drag handle (◇ with grips) just outside the sheet's left edge, hidden in the on-brane slice
      const ha = k * vis * fade * smoothstep(0.25, 0.45, V) * (labOn.current ? 1 : 0.6)
      if (ha > 0.01) {
        const y = curYs[i]
        const w = 0.24
        const hx = HANDLE_X
        const hz = HANDLE_Z
        const act = sim.drag.active && sim.drag.j === i ? 1 : 0.75
        f.hair.seg(hx, y - w, hz, hx - w * 0.7, y, hz, FIELD, act * ha)
        f.hair.seg(hx - w * 0.7, y, hz, hx, y + w, hz, FIELD, act * ha)
        f.hair.seg(hx, y + w, hz, hx + w * 0.7, y, hz, FIELD, act * ha)
        f.hair.seg(hx + w * 0.7, y, hz, hx, y - w, hz, FIELD, act * ha)
        f.hair.seg(hx, y + w + 0.05, hz, hx, y + w + 0.24, hz, FIELD, 0.6 * act * ha)
        f.hair.head(hx, y + w + 0.05, hz, hx, y + w + 0.27, hz, FIELD, 0.6 * act * ha, 0.08)
        f.hair.seg(hx, y - w - 0.05, hz, hx, y - w - 0.24, hz, FIELD, 0.6 * act * ha)
        f.hair.head(hx, y - w - 0.05, hz, hx, y - w - 0.27, hz, FIELD, 0.6 * act * ha, 0.08)
        f.hair.seg(-5, y, hz, hx + w * 0.7 + 0.04, y, hz, FIELD, 0.35 * ha)
      }
      // one label per stack ("branes 1 + 2"), named by its lowest-numbered member; none in the on-brane slice.
      // It hangs just below the handle, over its own sheet only.
      const label = braneLabel(st, i, f.mobile)
      const lo = k * vis * fade * smoothstep(0.3, 0.5, V)
      tag(f, 'hb' + (i + 1), HANDLE_X - 0.22, curYs[i] - 0.7, HANDLE_Z, lo * (label ? 1 : 0), label)
      if (st.braneworld && i === st.ref) tag(f, 'lref', HANDLE_X - 0.22, curYs[i] - 0.7, HANDLE_Z, lo)
    }
    f.slab.on = true
    f.slab.y = yR
    f.slab.h = h2
    return curYs
  }

  /** Stack labels for the bench, rebuilt only when positions, reference or labelling change. */
  const lbl = useMemo(() => ({ ys: null as number[] | null, ref: -1, bw: false, mob: false, out: ['', '', '', ''] }), [])
  const braneLabel = (st: ReturnType<typeof useBranes.getState>, i: number, mobile: boolean) => {
    if (st.ys !== lbl.ys || st.ref !== lbl.ref || st.braneworld !== lbl.bw || mobile !== lbl.mob) {
      lbl.ys = st.ys
      lbl.ref = st.ref
      lbl.bw = st.braneworld
      lbl.mob = mobile
      const ys = st.ys
      for (let b = 0; b < ys.length; b++) {
        let first = true
        let names = ''
        let hasRef = false
        for (let j = 0; j < ys.length; j++) {
          if (Math.abs(ys[j] - ys[b]) > 1e-3) continue
          if (j < b) first = false
          names += names ? ` + ${j + 1}` : `${j + 1}`
          if (j === st.ref) hasRef = true
        }
        const many = names.length > 1
        // (phones: the position goes on a second line, so the label stays inside the narrow frame)
        lbl.out[b] = !first || (st.braneworld && hasRef) ? '' : `${many ? 'branes' : 'brane'} ${names}${hasRef ? ' · reference' : ''}${mobile ? '\n' : ' · '}y = ${ys[b].toFixed(1)}`
      }
    }
    return lbl.out[i]
  }

  const labBeat = (f: Frame, p: number, kOut: number, st: ReturnType<typeof useBranes.getState>) => {
    const t = f.te
    const k = smoothstep(0, 0.14, p) * kOut
    const n = st.n
    // store requests → events
    const R = reqs.current
    if (!sim.populated) sim.populate(t, n)
    if (R.n !== n) {
      sim.sync(n)
      R.n = n
    }
    if (st.releaseReq !== R.release) {
      R.release = st.releaseReq
      sim.spawnLoop(t, st.ys[st.ref] ?? 0)
      tick(520)
    }
    if (st.collideReq !== R.collide) {
      R.collide = st.collideReq
      sim.startCollide(t, st.ref)
      st.say('Two open strings in. One open string and a closed loop out.')
    }
    if (st.clearReq !== R.clear) {
      R.clear = st.clearReq
      sim.clear()
    }
    const ys = st.ys
    const yRef = ys[st.ref] ?? 0
    sim.step(
      t,
      ys,
      yRef,
      () => st.say('An open string’s end must sit on a brane. It snapped back.'),
      () => {
        st.say(st.braneworld ? '● Searched for at the LHC. No excess of missing momentum found.' : 'The loop left the brane. What’s left doesn’t balance: missing momentum.')
        pluck(330, [{ n: 1, amp: 1 }, { n: 2, amp: 0.3 }], { decay: 0.6, gain: 0.35 })
      },
    )
    // stacks change → a soft thump at a snap-merge; the symmetry header shows "before → after" for a few seconds
    if (st.ys !== R.ys) {
      R.ys = st.ys
      const nk = stacksOf(st.ys).length
      if (R.nStacks > 0 && st.ys.length === R.nBranes && nk < R.nStacks) pluck(70, [{ n: 1, amp: 1 }], { decay: 0.5, gain: 0.5 })
      R.nStacks = nk
      R.nBranes = st.ys.length
    }

    // drags in progress (pointer → world)
    const V = st.viewpoint
    const s = smoothstep(0, 1, V)
    if (sim.drag.active) {
      const hp = pointerOnPlane(HANDLE_X, ys[sim.drag.j], HANDLE_Z, false)
      if (hp && Math.abs(hp.y - ys[sim.drag.j]) > 0.005) st.setY(sim.drag.j, hp.y)
    }
    hl.current.hover = -1
    if (sim.draw.active) {
      const d = sim.draw
      const yi = ys[d.i]
      const hp = pointerOnPlane(d.ax, yi, d.az, s < 0.45)
      if (hp) {
        d.px = clamp(hp.x, -6, 6)
        d.py = clamp(hp.y, -6, 6)
        d.pz = clamp(hp.z, -6, 6)
        if (Math.hypot(d.px - d.ax, d.py - yi, d.pz - d.az) > 0.3) d.moved = true
      }
      if (d.moved) hl.current.hover = releaseTarget(ys) ?? -1
    }
    // hover cursor over branes / handles
    if (labOn.current && !sim.draw.active && !sim.drag.active && explore.hovering && !explore.dragging) {
      const r = pointerRay()
      let onHandle = false
      for (let i = 0; i < n && s > 0.3; i++) if (r.distanceToPoint(hitV.set(HANDLE_X, ys[i], HANDLE_Z)) < 0.45) onHandle = true
      const b = onHandle ? null : braneUnderPointer(ys)
      setStageCursor(onHandle ? 'ns-resize' : b != null ? 'crosshair' : '')
    }

    // camera: from Beat 6's last pose into the bench
    labCam(f, V, lerp(0, yRef, k), ys)
    const c0 = f.cam
    const az = c0.az
    const pol = c0.pol
    const dist = c0.dist
    const ty = c0.ty
    cam(f, 26, 15, 12, 0, 0, 0, 1.55)
    c0.az = lerp(c0.az, az, k)
    c0.pol = lerp(c0.pol, pol, k)
    c0.dist = lerp(c0.dist, dist, k)
    c0.ty = lerp(c0.ty, ty, k)
    compose(f, 1, 0.12, 0.12)
    f.shift[0] = f.mobile ? 0 : lerp(0.12, -0.08, k)
    f.shift[1] = f.mobile ? lerp(0.15, 0.19, k) : lerp(0, -0.04, k)
    f.fade.amount *= 1 - k

    // Beat 6's sheet and strings hand over
    for (let kk = 3; kk < 9; kk++) rider(f, kk, 1, 0.55, 0.13, 0, 0.85 * 0.65 * (1 - k))
    f.hud.show('pin:notreq', 1 - smoothstep(0, 0.1, p))
    tag(f, 'dbrane', -2.2, 0, -3.4, 1 - smoothstep(0, 0.1, p))

    // branes (slice: other branes vanish outside the slab), handles and labels
    const curYs = drawBranes(f, st, k, V, 1)
    const h2 = 0.06 + 12 * V * V * V
    f.slab.h = lerp(12, h2, k)

    const pair = ladderPairMemo(ys, st.ref, st.pair)
    sim.render(f, k, curYs, st.ref, V, pair, st.braneworld)

    // HUD: mass line for the ladder pair, the scale caveat, the braneworld result cards, stage notes
    const d = pair ? Math.abs(ys[pair[0]] - ys[pair[1]]) : 0
    if (d !== R.physD || st.scale !== R.physS) {
      R.physD = d
      R.physS = st.scale
      const ms = MS_GEV[st.scale]
      const ls = lsMeters(st.scale)
      const m = stretchedMass(d)
      R.phys = ms && ls ? `${fmtGeV(m * ms)} · d ${fmtMeters(d * ls)} · ○ assumed` : ''
      R.ruler = `d = ${d.toFixed(2)} ℓ_s\nm = ${m.toFixed(2)} M_s${ms ? `\n${fmtGeV(m * ms)} ○` : ''}`
    }
    // distance → mass, on the stage: a ruler beside the ladder pair's stretched string with its live mass
    const PA = sim.pairAt
    const ruA = k * smoothstep(0.35, 0.6, V) * (PA.on ? 1 : 0)
    if (ruA > 0.01) {
      const rx = PA.x - 0.42
      ruler(f, rx, PA.z, PA.y0, PA.y1, ruA)
      tag(f, 'lruler', rx - 0.1, lerp(PA.y0, PA.y1, 0.66), PA.z, ruA, R.ruler)
    }
    f.hud.mass.update(Math.min(10, d), R.phys)
    f.hud.show('mass', k * (f.mobile ? 0 : 1))
    f.hud.show('plot', k * (f.mobile || st.braneworld ? 0 : 1))
    f.hud.show('pin:lab', k)
    f.hud.show('results', k * (st.braneworld ? 1 : 0))
    const note = st.note
    if (note) {
      const age = (performance.now() - note.at) / 1000
      f.hud.setNote(note.text)
      f.hud.show('note', k * smoothstep(0, 0.25, age) * (1 - smoothstep(3.2, 4, age)))
    }
  }

  const exitBeat = (f: Frame, e: number, st: ReturnType<typeof useBranes.getState>) => {
    const labFade = 1 - smoothstep(0, 0.3, e)
    const ys = st.ys
    const yRef = ys[st.ref] ?? 0
    const V = st.viewpoint
    // lab pose → HANDOFF.camera
    labCam(f, V, yRef, ys)
    const c = smoothstep(0, 0.8, e)
    const c0 = f.cam
    const mob = f.mobile ? 1.5 : 1
    c0.az = lerp(c0.az, 0, c)
    c0.pol = lerp(c0.pol, Math.PI / 2, c)
    c0.dist = lerp(c0.dist, 10 * mob, c)
    if (e >= 1) c0.dist = 10
    c0.tx = 0
    c0.ty = lerp(c0.ty, 0, c)
    c0.tz = 0
    const lx = f.mobile ? 0 : -0.08
    const ly = f.mobile ? 0.19 : -0.04
    f.shift[0] = lx * (1 - c)
    f.shift[1] = ly * (1 - c)
    f.fade.edge = f.mobile ? 0 : 1 - c
    if (e >= 1) {
      c0.dist = 10
      f.shift[0] = f.shift[1] = 0
    }
    // mobile: the handoff camera is canonical at progress 1
    if (f.mobile) c0.dist = lerp(c0.dist, 10, smoothstep(0.8, 1, e))

    // the bench fades; the reference brane settles below as a faint floor
    if (!sim.populated) sim.populate(f.te, st.n)
    drawBranes(f, st, 1, V, labFade)
    f.slab.h = lerp(f.slab.h, 12, smoothstep(0, 0.4, e))
    if (e > 0.5) f.slab.on = false
    if (labFade > 0.003) sim.render(f, labFade, ys, st.ref, V, null, false)
    const rb = f.br[st.ref]
    rb.y = lerp(yRef, -1.9, smoothstep(0.05, 0.75, e))
    rb.op = lerp(1, 0.1, smoothstep(0.05, 0.7, e))
    rb.edge = lerp(0.55, 0.4, smoothstep(0, 0.3, e))
    f.hud.show('pin:lab', labFade)
    const lp = ladderPairMemo(ys, st.ref, st.pair)
    f.hud.mass.update(Math.min(10, lp ? Math.abs(ys[lp[0]] - ys[lp[1]]) : 0))
    f.hud.show('mass', labFade * (f.mobile ? 0 : 1))
    f.hud.show('plot', labFade * (f.mobile || st.braneworld ? 0 : 1))
    f.hud.show('results', labFade * (st.braneworld ? 1 : 0))
    f.hud.show('card:tdual', smoothstep(0.12, 0.3, e) * (1 - smoothstep(0.7, 0.9, e)))

    // the closed loop that escaped drifts to the centre, turns to face us, grows to canonical H2
    const g = smoothstep(0.08, 0.85, e)
    const face = smoothstep(0.3, 0.9, e)
    const R = HANDOFF.H2.radius * fit
    f.loop.x = lerp(f.mobile ? LOOP_REST_M[0] : LOOP_REST[0], 0, g)
    f.loop.y = lerp(f.mobile ? LOOP_REST_M[1] : LOOP_REST[1], 0, g)
    f.loop.z = lerp(LOOP_REST[2], 0, g)
    f.loop.s = lerp(0.35 / R, 1, g)
    f.loop.op = smoothstep(0.02, 0.14, e)
    f.loop.w = smoothstep(0.85, 1, e)
    const tw = f.tw
    f.loop.rx = (0.7 + 0.4 * tw) * (1 - face)
    f.loop.ry = (1.1 + 0.27 * tw) * (1 - face)
    f.loop.rz = 0
    if (e >= 1) {
      f.loop.x = f.loop.y = f.loop.z = 0
      f.loop.s = 1
      f.loop.op = 1
      f.loop.w = 1
      f.loop.rx = f.loop.ry = 0
    }
  }

  /* ─────────────── apply ─────────────── */
  const applyBranes = (f: Frame) => {
    for (let i = 0; i < 4; i++) {
      const b = f.br[i]
      const mesh = brRefs.current[i]
      if (!mesh) continue
      // stacked sheets: dim each so a stack reads brighter, not blown out
      let stack = 0
      for (let j = 0; j < 4; j++) if (f.br[j].op > 0.02 && Math.abs(f.br[j].y - b.y) < 0.02) stack++
      const op = b.op / Math.sqrt(Math.max(1, stack))
      mesh.visible = op > 0.003
      mesh.position.y = b.y
      const u = braneMats[i].uniforms
      u.uTime.value = f.t
      u.uOpacity.value = op
      u.uGrid.value = b.grid
      u.uEdge.value = b.edge
      u.uFill.value = b.fill
      u.uFresnel.value = b.fresnel
      u.uRipple.value = b.ripple
      u.uDent0.value.set(b.dent0[0], b.dent0[1], b.dent0[2])
      u.uDent1.value.set(b.dent1[0], b.dent1[1], b.dent1[2])
      u.uFlash.value = b.flash
      u.uFlashR.value = b.flashR
      u.uFlashAt.value.set(b.flashX, b.flashZ, 0)
      u.uPaintOn.value = b.paintOn ? 1 : 0
      u.uPaintTau.value = b.paintTau
      u.uComplete.value = b.complete
      u.uSoft.value = b.soft
    }
    FADE.uFadeAxis.value = f.fade.axis
    FADE.uFadeFrom.value = f.fade.from * dpr
    FADE.uFadeTo.value = f.fade.to * dpr
    FADE.uFadeAmt.value = f.fade.amount
    FADE.uEdgeFrom.value = EDGE0 * f.W * dpr
    FADE.uEdgeTo.value = EDGE1 * f.W * dpr
    FADE.uEdgeAmt.value = f.fade.edge
  }
  const rrGroup = useRef<THREE.Group>(null!)
  const gravRef = useRef<THREE.LineSegments>(null!)
  const rrRef = useRef<THREE.LineSegments>(null!)
  const dustRef = useRef<GlowPointsApi>(null)
  const applyStatics = (f: Frame) => {
    rrMat.uniforms.uOpacity.value = f.rr.op
    rrMat.uniforms.uReveal.value = f.rr.rise
    if (rrRef.current) rrRef.current.visible = f.rr.op > 0.003
    if (rrGroup.current) rrGroup.current.position.y = f.rr.y
    gravMat.uniforms.uOpacity.value = f.grav.op
    gravMat.uniforms.uReveal.value = f.grav.reveal
    if (gravRef.current) gravRef.current.visible = f.grav.op > 0.003
    if (dustRef.current) dustRef.current.visible = f.dust > 0
  }
  const applyLoop = (f: Frame) => {
    const g = loopGroup.current
    if (!g) return
    if (!loopMat.current) {
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
        if (!loopMat.current && m && (m as THREE.ShaderMaterial).uniforms?.uOpacity && (o as THREE.Mesh).isMesh) loopMat.current = m
      })
    }
    const L = f.loop
    g.visible = L.op > 0.003
    g.position.set(L.x, L.y, L.z)
    g.scale.setScalar(L.s)
    g.rotation.set(L.rx, L.ry, L.rz)
    if (loopMat.current) {
      loopMat.current.uniforms.uOpacity.value = L.op
      loopMat.current.uniforms.uWidth.value = HANDOFF.H2.width
    }
  }

  /* ─────────────── tags: project after the camera settles ─────────────── */
  const pv = useMemo(() => new THREE.Vector3(), [])
  useChapterFrame(
    () => {
      const tags = tagsRef.current
      if (!tags.size) return
      camera.updateMatrixWorld()
      const W = size.width
      const H = size.height
      const hud = hudRef.current
      let vis = Math.min(W, hud?.cw || W)
      if (hud && hud.panelLeft > 0 && cur.current.step === 8) vis = Math.min(vis, hud.panelLeft - 8)
      // keep figure labels clear of the chapter rail (desktop)
      else if (!frame.mobile) vis = Math.min(vis, 0.86 * W)
      for (const [key, tg] of tags) {
        const r = frame.tags.get(key)
        if (!r || r.s !== frame.stamp || (frame.mobile && MOBILE_HIDE.has(key))) {
          tg.hide()
          continue
        }
        pv.set(r.x, r.y, r.z).project(camera)
        if (pv.z > 1 || pv.z < -1) {
          tg.hide()
          continue
        }
        tg.place((pv.x * 0.5 + 0.5) * W, (-pv.y * 0.5 + 0.5) * H, r.o, r.text, vis, frame.mobile ? 10 : 16)
      }
      // Beat 5's ruler → matrix bracket (desktop; on phones the matrix and stage are too small for it)
      const L = frame.link
      if (hud) {
        if (L.o > 0.01 && !frame.mobile) {
          pv.set(L.x, L.y, L.z).project(camera)
          hud.setLink((pv.x * 0.5 + 0.5) * W, (-pv.y * 0.5 + 0.5) * H, L.o)
        } else hud.setLink(0, 0, 0)
      }
    },
    { priority: 0 },
  )

  /* ─────────────── inset (on-brane view) ─────────────── */
  const insetState = useRef({ w: 0, key: '' })
  useChapterFrame(
    () => {
      const hud = hudRef.current
      if (!hud) return
      const { step, p } = cur.current
      const mode = step === 5 && p > 0.7 ? 'mass' : step === 6 && p < 0.12 ? 'mass' : step === 7 && p > 0.5 ? 'world' : ''
      if (!mode) return
      const cv = hud.inset
      const css = cv.clientWidth
      if (!css) return
      const px = Math.round(css * dpr)
      if (insetState.current.w !== px) {
        cv.width = cv.height = px
        insetState.current.w = px
      }
      const ctx = cv.getContext('2d')
      if (!ctx) return
      drawInset(ctx, px, dpr, mode, frame)
      if (mode === 'mass') hud.setInset('On-brane view · from brane 1', 'From the brane: a heavy particle. Its mass measures a distance you can’t see.')
      else hud.setInset('On-brane view · after the collision', 'Only the outgoing open string is visible. What’s left doesn’t balance: missing momentum.')
    },
    { priority: 0 },
  )

  /* ─────────────── camera ─────────────── */
  useViewShift(() => frame.shift)

  return (
    <>
      <Backdrop />
      <OrbitRig
        pose={() => ({ azimuth: frame.cam.az, polar: frame.cam.pol, distance: frame.cam.dist, target: [frame.cam.tx, frame.cam.ty, frame.cam.tz] })}
        interactive={(hh) => hh.inStep('lab') && cur.current.step === 8}
        polarLimits={[0.01, Math.PI - 0.05]}
      />
      {dust && <GlowPoints ref={dustRef} positions={dust} size={0.02} minPixels={1} maxPixels={2} color={COLORS.field} intensity={0.07} />}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => void (brRefs.current[i] = m)} geometry={braneGeo[i === 0 ? 0 : 1]} material={braneMats[i]} frustumCulled={false} renderOrder={1} visible={false} />
      ))}
      <group ref={rrGroup}>
        <lineSegments ref={rrRef} geometry={rrGeo} material={rrMat} frustumCulled={false} renderOrder={2} visible={false} />
      </group>
      <lineSegments ref={gravRef} geometry={gravGeo} material={gravMat} frustumCulled={false} renderOrder={2} visible={false} />
      <primitive object={hair.lines} />
      <primitive object={str.mesh} />
      <GlowPoints ref={dotsRef} positions={dots.positions} sizes={dots.sizes} colors={dots.colors} alphas={dots.alphas} minPixels={1.5} maxPixels={90} sharpness={0.35} intensity={1} />
      <group ref={loopGroup}>
        <HandoffLoop fn={loopBlend} />
      </group>
      {/* lab: invisible hit proxies (cheap planes; handlers gated while the lab is live) */}
      {[0, 1, 2, 3].map((i) => (
        <LabProxy key={i} i={i} onDown={onBraneDown(i)} onHandle={onHandleDown(i)} />
      ))}
    </>
  )
}

/** Invisible 10 × 10 hit plane at brane i's height, plus a drag handle at its right edge. */
function LabProxy({ i, onDown, onHandle }: { i: number; onDown: (e: ThreeEvent<PointerEvent>) => void; onHandle: (e: ThreeEvent<PointerEvent>) => void }) {
  const g = useRef<THREE.Group>(null!)
  const plane = useRef<THREE.Mesh>(null!)
  const handle = useRef<THREE.Mesh>(null!)
  const none = useMemo(() => () => {}, [])
  useChapterFrame(
    (f) => {
      const st = useBranes.getState()
      // an invisible sheet (e.g. above the reference brane in the on-brane slice) must not take taps
      const on = f.h.inStep('lab') && f.h.active() && i < st.n && VIS[i] >= VIS_MIN
      g.current.visible = on
      g.current.position.y = st.ys[i] ?? 0
      // hidden proxies must not raycast
      plane.current.raycast = on ? THREE.Mesh.prototype.raycast : none
      handle.current.raycast = on ? THREE.Mesh.prototype.raycast : none
    },
    { priority: -6 },
  )
  return (
    <group ref={g} visible={false}>
      <mesh ref={plane} rotation-x={-Math.PI / 2} onPointerDown={onDown}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <mesh ref={handle} position={[HANDLE_X, 0, HANDLE_Z]} onPointerDown={onHandle} userData={{ brnHandle: true }}>
        <sphereGeometry args={[0.42, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}

/* ─────────────── static geometry ─────────────── */

/** RR "field lines": 12 × 12 short hairlines with arrowheads, both sides, fading with distance. */
function buildRR() {
  const pos: number[] = []
  const col: number[] = []
  const tt: number[] = []
  const L = 1.5
  const add = (a: number[], b: number[], ta: number, tb: number, aa: number, ab: number) => {
    pos.push(...a, ...b)
    col.push(...FIELD, aa, ...FIELD, ab)
    tt.push(ta, tb)
  }
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 12; j++) {
      const x = -4.4 + (8.8 * i) / 11
      const z = -4.4 + (8.8 * j) / 11
      for (const sg of [1, -1]) {
        const segs = 6
        for (let k = 0; k < segs; k++) {
          const y0 = 0.04 + (L - 0.04) * (k / segs)
          const y1 = 0.04 + (L - 0.04) * ((k + 1) / segs)
          add([x, sg * y0, z], [x, sg * y1, z], y0 / L, y1 / L, 0.22 * (1 - y0 / L) ** 1.4, 0.22 * (1 - y1 / L) ** 1.4)
        }
        // arrowhead at 0.55 L pointing away from the sheet
        const ya = sg * 0.62 * L
        const yb = sg * (0.62 * L - 0.14)
        const a = 0.3 * (1 - 0.62)
        add([x, ya, z], [x - 0.07, yb, z], 0.62, 0.62, a, a)
        add([x, ya, z], [x + 0.07, yb, z], 0.62, 0.62, a, a)
        add([x, ya, z], [x, yb, z - 0.07], 0.62, 0.62, a * 0.7, a * 0.7)
        add([x, ya, z], [x, yb, z + 0.07], 0.62, 0.62, a * 0.7, a * 0.7)
      }
    }
  return staticHair(pos, col, tt)
}

/** 48 gravity field lines of a mass on the brane in a slab bulk (images every L = 2), revealed along arc length. */
function buildGravity() {
  const lines = gravityLines(48, 2, 12, 0.05, 240)
  const pos: number[] = []
  const col: number[] = []
  const tt: number[] = []
  const S = 0.05 * 110
  for (const ln of lines) {
    const n = ln.length / 3
    for (let i = 0; i + 1 < n; i++) {
      const s0 = (i * 0.05) / S
      const s1 = ((i + 1) * 0.05) / S
      pos.push(ln[i * 3], ln[i * 3 + 1], ln[i * 3 + 2], ln[i * 3 + 3], ln[i * 3 + 4], ln[i * 3 + 5])
      const a0 = 0.34 * smoothstep(0.004, 0.05, s0) * (1 - 0.55 * Math.min(1, s0))
      const a1 = 0.34 * smoothstep(0.004, 0.05, s1) * (1 - 0.55 * Math.min(1, s1))
      col.push(...FIELD, a0, ...FIELD, a1)
      tt.push(Math.min(s0, 1), Math.min(s1, 1))
    }
  }
  return staticHair(pos, col, tt)
}

function buildDust(n: number) {
  if (n <= 0) return null
  const p = new Float32Array(n * 3)
  let s = 12345
  const r = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  for (let i = 0; i < n; i++) {
    p[i * 3] = (r() * 2 - 1) * 9
    p[i * 3 + 1] = (r() * 2 - 1) * 6
    p[i * 3 + 2] = (r() * 2 - 1) * 9
  }
  return p
}

/* ─────────────── inset painter (2D canvas, top-down slice of brane 1) ─────────────── */

function drawInset(ctx: CanvasRenderingContext2D, px: number, dpr: number, mode: 'mass' | 'world', f: Frame) {
  const R = px / 2
  const Rw = 3.4 // world radius shown
  const k = R / Rw
  const X = (x: number) => R + x * k
  const Y = (z: number) => R + z * k
  ctx.clearRect(0, 0, px, px)
  ctx.save()
  ctx.beginPath()
  ctx.arc(R, R, R - 1, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = 'rgba(5,7,11,0.82)'
  ctx.fillRect(0, 0, px, px)
  // the sheet's grid (0.5 ℓ_s)
  ctx.strokeStyle = 'rgba(134,168,216,0.16)'
  ctx.lineWidth = 1
  for (let g = -Rw; g <= Rw + 1e-6; g += 0.5) {
    ctx.beginPath()
    ctx.moveTo(X(g), 0)
    ctx.lineTo(X(g), px)
    ctx.moveTo(0, Y(g))
    ctx.lineTo(px, Y(g))
    ctx.stroke()
  }
  const warmSeg = (ax: number, az: number, bx: number, bz: number, a = 1) => {
    ctx.strokeStyle = `rgba(255,201,138,${0.45 * a})`
    ctx.lineWidth = 5 * dpr
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(X(ax), Y(az))
    ctx.lineTo(X(bx), Y(bz))
    ctx.stroke()
    ctx.strokeStyle = `rgba(255,246,232,${0.95 * a})`
    ctx.lineWidth = 1.4 * dpr
    ctx.stroke()
  }
  const glow = (x: number, z: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(X(x), Y(z), 0, X(x), Y(z), r)
    g.addColorStop(0, `rgba(236,230,217,${a})`)
    g.addColorStop(0.35, `rgba(236,230,217,${a * 0.35})`)
    g.addColorStop(1, 'rgba(236,230,217,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(X(x), Y(z), r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.font = `${10.5 * dpr}px "IBM Plex Mono", monospace`
  if (mode === 'mass') {
    // three open strings lying on brane 1 (they appear as short strings), and the stretched string's end
    for (const kk of KEEP) {
      const e = riderEnds(kk, 1, 0.62, f.tw)
      warmSeg(e[0], e[1], e[2], e[3])
    }
    const y2 = f.br[1].y
    const m = stretchedMass(y2)
    const halo = (6 + 18 * Math.min(m, 1)) * dpr
    glow(MASS_S.x, MASS_S.z, halo * 2.2, 0.55)
    glow(MASS_S.x, MASS_S.z, 5 * dpr, 1)
    ctx.fillStyle = 'rgba(236,230,217,0.95)'
    ctx.textAlign = 'center'
    ctx.fillText(`m = ${m.toFixed(2)} M_s`, X(MASS_S.x), Y(MASS_S.z) + halo + 16 * dpr)
    ctx.textAlign = 'start'
  } else {
    const c = COLL
    const LEN = 0.55
    if (c.phase < 0.47) {
      for (const s of [-1, 1]) warmSeg(s * c.inX - LEN / 2, 0, s * c.inX + LEN / 2, 0)
    } else {
      warmSeg(c.outX - (c.ux * LEN) / 2, c.outZ - (c.uz * LEN) / 2, c.outX + (c.ux * LEN) / 2, c.outZ + (c.uz * LEN) / 2)
      // missing momentum: a dashed Ink arrow opposite the visible string
      const a = smoothstep(0.55, 0.7, c.phase)
      const L = 2.4
      ctx.strokeStyle = `rgba(236,230,217,${0.9 * a})`
      ctx.lineWidth = 1.2 * dpr
      ctx.setLineDash([5 * dpr, 4 * dpr])
      ctx.beginPath()
      ctx.moveTo(X(0), Y(0))
      ctx.lineTo(X(-c.ux * L), Y(-c.uz * L))
      ctx.stroke()
      ctx.setLineDash([])
      const hx = X(-c.ux * L)
      const hz = Y(-c.uz * L)
      const ang = Math.atan2(-c.uz, -c.ux)
      ctx.beginPath()
      ctx.moveTo(hx, hz)
      ctx.lineTo(hx - Math.cos(ang - 0.45) * 9 * dpr, hz - Math.sin(ang - 0.45) * 9 * dpr)
      ctx.moveTo(hx, hz)
      ctx.lineTo(hx - Math.cos(ang + 0.45) * 9 * dpr, hz - Math.sin(ang + 0.45) * 9 * dpr)
      ctx.stroke()
      ctx.fillStyle = `rgba(236,230,217,${0.95 * a})`
      ctx.textAlign = 'center'
      ctx.fillText('missing momentum', R, R + R * 0.62)
      ctx.textAlign = 'start'
      if (c.phase < 0.7) {
        ctx.strokeStyle = `rgba(134,168,216,${0.8 * (1 - range(c.phase, 0.44, 0.7))})`
        ctx.beginPath()
        ctx.arc(X(0), Y(0), (0.1 + 1.1 * range(c.phase, 0.44, 0.66)) * k, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
  // rim
  ctx.strokeStyle = 'rgba(134,168,216,0.5)'
  ctx.lineWidth = 1 * dpr
  ctx.beginPath()
  ctx.arc(R, R, R - 1, 0, Math.PI * 2)
  ctx.stroke()
}

