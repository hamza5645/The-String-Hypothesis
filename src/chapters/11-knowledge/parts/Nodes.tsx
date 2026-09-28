import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useChapterFrame } from '@/gl'
import { explore, isUI, setStageCursor } from '@/core/explore'
import { pluck, tick } from '@/core/audio'
import { clamp, easeInOutCubic, lerp, range, smoothstep } from '@/core/math'
import { ambient } from '@/core/time'
import { CLAIMS, CLAIM_INDEX, REFEREE } from '../data'
import { TIER_MID, visAt } from '../model'
import { browse, cardAnchor, useKnowledge, type ThreadState } from '../store'
import { createGlyphs } from '../gl/glyphs'
import { createLineMaterial, LineBuilder } from '../gl/lines'
import type { LabelLayer, Lbl } from '../gl/labels'
import { GROWTH, THREAD, type Stage } from '../director'

/*
 * The 34 claim nodes (Model §1–§5): glyph pops choreographed by scroll, ceiling visibility and
 * ghosts, focus-tier labels, hover/tap claim cards, the lab readouts, and the Referee's tokens.
 */

const N = CLAIMS.length
const TOKEN = N // one extra glyph instance for the referee token
const MOBILE_KEEP = new Set(['G4', 'G1', 'G10', 'K1', 'K4', 'D1', 'D3', 'D7', 'C1', 'C2', 'C3', 'S1', 'S4', 'S9'])
const RADIUS = CLAIMS.map((c) => Math.hypot(c.pos[0], c.pos[2]))
const TIER3_ORDER = ['S1', 'S4', 'S2', 'S9', 'S6', 'S3', 'S5', 'S7', 'S8']
/** Labels that carry their beat's lesson (the beat text's own examples, the null results, the
 *  cracks, the ≠ anchor, the landscape caveat): never culled, they displace the others. */
const MUST = new Set(['G7', 'D1', 'D2', 'D3', 'D7', 'D8', 'D6', 'K1', 'K2', 'K3', 'K4', 'S9', 'S4', 'S8', 'G8', 'G10'])
const basePrio = (i: number) => (MUST.has(CLAIMS[i].id) ? 400 : 100) - i
const THREAD_YMIN = (() => {
  let m = 1e9
  for (let i = 0; i < THREAD.pts.length; i += 3) m = Math.min(m, THREAD.pts[i + 1])
  return m
})()
const THREAD_YMAX = (() => {
  let m = -1e9
  for (let i = 0; i < THREAD.pts.length; i += 3) m = Math.max(m, THREAD.pts[i + 1])
  return m
})()

const backOut = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

/** Pop progress 0..1 of claim i, a pure function of the director's state. */
function popOf(i: number, S: Stage) {
  const c = CLAIMS[i]
  if (S.mapK > 0) return 1
  if (c.tier === 0) {
    if (c.id === 'G4') return smoothstep(0.26, 0.4, S.open)
    const s = 0.36 + 0.3 * clamp(RADIUS[i] / 4.2)
    return range(S.open, s, s + 0.12)
  }
  if (c.onThread) {
    // pops as the tip arrives, complete when it is there (so the beat's last node, D8, is whole)
    const g = GROWTH[c.id]
    return range(S.growth, g - 0.03, g - 0.002)
  }
  if (c.id === 'D6') return range(S.growth, GROWTH.D7 + 0.012, GROWTH.D7 + 0.05)
  if (c.tier === 3) {
    const k = TIER3_ORDER.indexOf(c.id)
    const s = 0.1 + 0.055 * k
    return S.sp.demand > 0 || S.sp.lab > 0 || S.sp.unseen > 0 ? 1 : range(S.sp.fog, s, s + 0.1)
  }
  return 0
}

export function Nodes({ S, layer }: { S: Stage; layer: LabelLayer | null }) {
  const camera = useThree((s) => s.camera)
  const mesh = useRef<THREE.Mesh>(null!)
  const G = useMemo(() => createGlyphs(N + 1), [])
  useLayoutEffect(
    () => () => {
      G.geometry.dispose()
      G.material.dispose()
    },
    [G],
  )

  // token trail: one dynamic hairline
  const trail = useMemo(() => {
    const L = new LineBuilder().add(
      [
        [0, 0, 0],
        [0, 1, 0],
      ],
      { color: '#86A8D8', alpha: 0.8, width: 1, glow: 3, yref: 'none' },
    )
    const geometry = L.build()
    const material = createLineMaterial()
    return { geometry, material, a: geometry.getAttribute('aA') as THREE.InstancedBufferAttribute, b: geometry.getAttribute('aB') as THREE.InstancedBufferAttribute }
  }, [])
  const trailMesh = useRef<THREE.Mesh>(null!)
  useLayoutEffect(
    () => () => {
      trail.geometry.dispose()
      trail.material.dispose()
    },
    [trail],
  )

  const st = useMemo(
    () => ({
      scr: new Float32Array(N * 3), // screen x, y, radius (CSS px); radius 0 = not pickable
      pop: new Float32Array(N),
      vis: new Float32Array(N),
      drift: new Float32Array(N * 3),
      pulseT: new Float32Array(N).fill(-99),
      hover: -1,
      cursor: false,
      lostPinned: 0,
      tokenSeq: useKnowledge.getState().tokenSeq,
      token: null as null | { claim: number; chosen: number; node: number; t0: number; from: THREE.Vector3; landed: boolean; ghost: boolean },
      shown: -1,
      stShown: -1,
      thread: '' as ThreadState | '',
      down: { x: 0, y: 0, on: false },
    }),
    [],
  )
  const v = useMemo(() => new THREE.Vector3(), [])
  const v2 = useMemo(() => new THREE.Vector3(), [])
  const inv = useMemo(() => new THREE.Matrix4(), [])

  // labels (one per claim)
  const labels = useMemo(() => {
    if (!layer) return [] as Lbl[]
    return CLAIMS.map((c, i) =>
      layer.add({ text: c.label, sub: c.sub, tag: c.tag && c.tag !== 'CRACK' ? c.tag : undefined }, c.pos, {
        cls: `kn-lbl--node ${c.crack ? 'kn-lbl--crack' : `kn-lbl--t${c.tier}`}`,
        align: 'auto',
        dx: 13,
        cull: true,
        must: MUST.has(c.id),
        prio: basePrio(i),
      }),
    )
  }, [layer])
  // the referee's feedback wins every placement contest while it is on screen
  const tokenLbl = useMemo(() => (layer ? layer.add({ text: 'Δ = 1 TIER' }, [0, 0, 0], { cls: 'kn-lbl--field', align: 'left', dx: 12, prio: 990, must: true }) : null), [layer])

  // ── click / tap to pin a card ──
  const h = useRef<{ active: () => boolean } | null>(null)
  useEffect(() => {
    const down = (e: PointerEvent) => {
      st.down.x = e.clientX
      st.down.y = e.clientY
      st.down.on = !isUI(e.target)
    }
    const up = (e: PointerEvent) => {
      if (!st.down.on || !h.current?.active()) return
      st.down.on = false
      if (Math.hypot(e.clientX - st.down.x, e.clientY - st.down.y) > 7) return
      const i = nearest(e.clientX, e.clientY, 10)
      const s = useKnowledge.getState()
      if (i >= 0) s.setPinned(CLAIMS[i].id)
      else if (s.pinned) s.setPinned(null)
    }
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      if (st.cursor) setStageCursor('')
      const s = useKnowledge.getState()
      s.setHover(null)
      s.setPinned(null)
      cardAnchor.on = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nearest = (x: number, y: number, slack: number) => {
    let best = -1
    let bd = 1e9
    for (let i = 0; i < N; i++) {
      const r = st.scr[i * 3 + 2]
      if (r <= 0) continue
      const d = Math.hypot(st.scr[i * 3] - x, st.scr[i * 3 + 1] - y)
      if (d < Math.max(r + slack, 16) && d < bd) {
        bd = d
        best = i
      }
    }
    return best
  }

  // ── geometry pass: pops, visibility, drift, glyph attributes, token ──
  useChapterFrame(
    (f) => {
      h.current = f.h
      const t = f.t
      const amb = ambient()
      const ks = useKnowledge.getState()
      const ceil = S.ceilOn > 0.001
      const ghostOn = ceil ? S.ceilOn : 0
      const collapse = smoothstep(0.25, 0.75, S.mapK)
      G.material.uniforms.uMinPx.value = lerp(11, 0.6, collapse)
      G.material.uniforms.uMaxPx.value = lerp(20, 1.2, collapse)
      G.material.uniforms.uOpacity.value = S.mapVis * (1 - 0.55 * collapse)
      let anyPop = false
      for (let i = 0; i < N; i++) {
        const c = CLAIMS[i]
        const pop = popOf(i, S)
        st.pop[i] = pop
        if (pop > 0) anyPop = true
        // tier 3 drifts gently (Brownian stand-in, amplitude ≤ 0.05)
        let dx = 0
        let dy = 0
        let dz = 0
        if (c.tier === 3) {
          const ph = i * 1.93
          dx = 0.05 * Math.sin(0.31 * t * amb + ph) * 0.8
          dy = 0.05 * Math.sin(0.23 * t * amb + ph * 1.7) * 0.6
          dz = 0.05 * Math.sin(0.27 * t * amb + ph * 2.3) * 0.8
        }
        st.drift[i * 3] = dx
        st.drift[i * 3 + 1] = dy
        st.drift[i * 3 + 2] = dz
        const y = c.pos[1] + dy
        const a = ceil ? lerp(1, visAt(S.yc, y), S.ceilOn) : 1
        st.vis[i] = a
        G.pos[i * 3] = c.pos[0] + dx
        G.pos[i * 3 + 1] = y
        G.pos[i * 3 + 2] = c.pos[2] + dz
        const tp = (t - st.pulseT[i]) / 0.9
        const timePulse = tp >= 0 && tp < 1 ? tp : 0
        const scrollPulse = pop > 0 && pop < 1 ? pop : 0
        G.A[i * 4] = c.tier
        G.A[i * 4 + 1] = pop <= 0 ? 0 : pop < 1 ? backOut(pop) : 1
        G.A[i * 4 + 2] = a
        G.A[i * 4 + 3] = Math.max(scrollPulse, timePulse)
        const hot = st.hover === i || ks.pinned === c.id
        G.B[i * 4] = hot ? 1 : 0
        G.B[i * 4 + 1] = S.atlasDim * (hot ? 1.25 : 1)
        G.B[i * 4 + 2] = ghostOn
      }
      // the opening point becomes the Standard Model's ● (G4 fades in as the H0 glow fades out)
      // referee token
      const tk = st.token
      if (ks.tokenSeq !== st.tokenSeq) {
        st.tokenSeq = ks.tokenSeq
        const ci = ks.tokenClaim
        const chosen = ci >= 0 ? ks.answers[ci] : null
        if (ci >= 0 && chosen != null && S.sp.lab > 0) {
          const node = CLAIM_INDEX[REFEREE[ci].node]
          // start at the panel edge (screen) at the target's depth
          const from = new THREE.Vector3()
          st.token = { claim: ci, chosen, node, t0: t, from, landed: false, ghost: false }
          const sx = S.mobile ? S.W * 0.5 : S.W - 400
          const sy = S.mobile ? S.H * 0.52 : S.H * 0.62
          const np = CLAIMS[node].pos
          v.set(np[0], TIER_MID[chosen], np[2]).applyMatrix4(mapMatrix())
          const dist = v.distanceTo(camera.position)
          v2.set((sx / S.W) * 2 - 1, 1 - (sy / S.H) * 2, 0.5).unproject(camera).sub(camera.position).normalize()
          from.copy(camera.position).addScaledVector(v2, dist)
          inv.copy(mapMatrix()).invert()
          from.applyMatrix4(inv)
          S.focusTarget = [np[0], (TIER_MID[chosen] + np[1]) / 2, np[2]]
        } else st.token = null
      }
      let trailOn = 0
      if (tk) {
        const c = CLAIMS[tk.node]
        const dt = t - tk.t0
        const yC = TIER_MID[tk.chosen]
        const yT = c.pos[1]
        let x = c.pos[0]
        let y = yC
        let z = c.pos[2]
        let sc = 1
        let alpha = 1
        if (dt < 0.45) {
          const k = easeInOutCubic(dt / 0.45)
          x = lerp(tk.from.x, x, k)
          y = lerp(tk.from.y, yC, k)
          z = lerp(tk.from.z, z, k)
          sc = lerp(0.6, 1, k)
        } else if (dt < 0.85) {
          y = yC
        } else if (dt < 1.65) {
          y = lerp(yC, yT, easeInOutCubic((dt - 0.85) / 0.8))
          trailOn = 1
        } else {
          y = yT
          trailOn = 1 - clamp((dt - 1.65) / 1.2)
          if (!tk.landed) {
            tk.landed = true
            st.pulseT[tk.node] = t
            const truth = REFEREE[tk.claim].tier
            tk.ghost = truth > Math.round(ks.ceiling)
            tick(740)
            if (tk.chosen === truth) pluck(146.8, [{ n: 1, amp: 1 }, { n: 2, amp: 0.25 }], { decay: 1.8, gain: 0.32 })
            else {
              const upward = tk.chosen < truth
              window.setTimeout(() => tick(upward ? 587 : 440), 20)
              window.setTimeout(() => tick(upward ? 784 : 330), 170)
            }
          }
          const m = clamp((dt - 1.65) / 0.35)
          sc = lerp(1, 0.2, m)
          alpha = 1 - m
        }
        if (tk.ghost && dt > 1.2) alpha *= 0.35
        G.pos[TOKEN * 3] = x
        G.pos[TOKEN * 3 + 1] = y
        G.pos[TOKEN * 3 + 2] = z
        G.A[TOKEN * 4] = tk.chosen
        G.A[TOKEN * 4 + 1] = sc * 1.15
        G.A[TOKEN * 4 + 2] = alpha * (S.sp.lab > 0 && S.sp.lab < 1 ? 1 : 0)
        G.A[TOKEN * 4 + 3] = 0
        G.B[TOKEN * 4] = 1
        G.B[TOKEN * 4 + 1] = 1.2
        G.B[TOKEN * 4 + 2] = 0
        // trail from the chosen height to the token
        trail.a.setXYZ(0, c.pos[0], yC, c.pos[2])
        trail.b.setXYZ(0, x, y, z)
        trail.a.needsUpdate = true
        trail.b.needsUpdate = true
        if (tokenLbl) {
          const d = Math.abs(tk.chosen - REFEREE[tk.claim].tier)
          layerSetText(tokenLbl, d === 0 ? 'Δ = 0 · AGREED' : `Δ = ${d} TIER${d > 1 ? 'S' : ''} ${tk.chosen < REFEREE[tk.claim].tier ? '↑' : '↓'}`)
          tokenLbl.pos.set(c.pos[0], (yC + y) / 2, c.pos[2])
          tokenLbl.target = dt > 0.5 ? trailOn * (S.sp.lab > 0 && S.sp.lab < 1 ? 1 : 0) : 0
        }
        if (dt > 3.2) st.token = null
      } else {
        G.A[TOKEN * 4 + 1] = 0
        if (tokenLbl) tokenLbl.target = 0
      }
      trail.material.uniforms.uOpacity.value = trailOn * S.mapVis
      trailMesh.current.visible = trailOn > 0.001
      for (const a of G.attrs) a.needsUpdate = true
      mesh.current.visible = anyPop && S.mapVis > 0.001

      // readouts (Model §4), written only on change
      let shown = 0
      let stShown = 0
      for (let i = 0; i < N; i++) {
        if (st.vis[i] >= 0.5) {
          shown++
          if (CLAIMS[i].st) stShown++
        }
      }
      const yc = ceil ? S.yc : 1e3
      const maxA = visAt(yc, THREAD_YMIN)
      const minA = visAt(yc, THREAD_YMAX)
      const thread: ThreadState = maxA < 0.05 ? 'HIDDEN' : minA > 0.95 ? 'SHOWN' : 'PARTLY SHOWN'
      if (shown !== st.shown || stShown !== st.stShown || thread !== st.thread) {
        st.shown = shown
        st.stShown = stShown
        st.thread = thread
        useKnowledge.setState({ shown, stShown, thread, warm: thread !== 'HIDDEN' })
      }
    },
    { priority: -1.5 },
  )

  const mapMatrix = () => (mesh.current.parent ? mesh.current.parent.matrixWorld : new THREE.Matrix4())
  const layerSetText = (l: Lbl, s: string) => layer?.setText(l, s)

  // ── camera-dependent pass: projection, picking, labels, card anchor ──
  useChapterFrame(
    (f) => {
      const ks = useKnowledge.getState()
      const W = S.W
      const H = S.H
      const map = mesh.current.parent!.matrixWorld
      camera.updateMatrixWorld()
      const P11 = camera.projectionMatrix.elements[5]
      const active = f.h.active() && f.presence > 0.6
      const pickPhase = S.mapK < 0.05 && S.sp.unseen < 0.25 && S.atlasDim > 0.6 && (S.open > 0.7 || S.sp.ground > 0)
      const mob = S.mobile
      // focus tier (for keyboard browse)
      let ft = -1
      let fw = 0.25
      for (let k = 0; k < 4; k++)
        if (S.focus[k] > fw) {
          fw = S.focus[k]
          ft = k
        }
      const labAll = S.labelsAll
      const ids: string[] = []
      // visible glyphs are obstacles for every label (no text over a dot)
      const obsOn = layer && S.mapK < 0.05 && S.atlasDim > 0.3 && S.mapVis > 0.5
      for (let i = 0; i < N; i++) {
        const c = CLAIMS[i]
        v.set(G.pos[i * 3], G.pos[i * 3 + 1], G.pos[i * 3 + 2]).applyMatrix4(map)
        v2.copy(v).applyMatrix4(camera.matrixWorldInverse)
        const zc = -v2.z
        v.project(camera)
        const x = (v.x * 0.5 + 0.5) * W
        const y = (0.5 - v.y * 0.5) * H
        const halfPx = clamp(((0.13 * S.mapScale * P11) / Math.max(zc, 1e-4)) * H * 0.5, 5.5, 10)
        const pickable = active && pickPhase && st.pop[i] > 0.9 && zc > 0 && (st.vis[i] >= 0.5 || S.ceilOn > 0.5)
        st.scr[i * 3] = x
        st.scr[i * 3 + 1] = y
        st.scr[i * 3 + 2] = pickable ? halfPx * 0.78 : 0
        if (obsOn && zc > 0 && st.pop[i] > 0.5 && st.vis[i] >= 0.5) layer!.addObstacle(x, y, halfPx * 0.85)
        if (pickable && (labAll > 0.5 ? st.vis[i] >= 0.5 : c.tier === ft)) ids.push(c.id)
        // label
        const l = labels[i]
        if (l) {
          const focus = Math.max(S.focus[c.tier] * (c.crack ? S.crackLabels : 1), labAll)
          const keep = !mob || MOBILE_KEEP.has(c.id)
          const hot = st.hover === i || ks.pinned === c.id
          l.pos.set(G.pos[i * 3], G.pos[i * 3 + 1], G.pos[i * 3 + 2])
          // phones show three labels per tier; there a crowded one is culled, not forced
          l.must = !mob && MUST.has(c.id)
          l.hot = hot
          l.prio = hot ? 1000 : basePrio(i)
          const base = smoothstep(0.6, 1, st.pop[i]) * (st.vis[i] >= 0.5 ? st.vis[i] : 0) * S.mapVis * (1 - smoothstep(0, 0.15, S.mapK))
          l.target = base * (hot ? 1 : focus * (keep ? 1 : 0) * 0.92)
        }
      }
      browse.ids = ids
      // hover (mouse/pen only; touch pins on tap)
      let hov = -1
      if (active && pickPhase && explore.hovering && !explore.dragging) {
        const px = (explore.nx * 0.5 + 0.5) * W
        const py = (0.5 - explore.ny * 0.5) * H
        hov = nearest(px, py, 6)
      }
      if (hov !== st.hover) {
        st.hover = hov
        ks.setHover(hov >= 0 ? CLAIMS[hov].id : null)
        if (f.h.active()) {
          setStageCursor(hov >= 0 ? 'pointer' : '')
          st.cursor = hov >= 0
        }
      }
      // a pinned card lets go when its node leaves the stage
      const pinned = ks.pinned ? CLAIM_INDEX[ks.pinned] : -1
      if (pinned >= 0 && st.scr[pinned * 3 + 2] <= 0) {
        st.lostPinned += f.dt || 0.05
        if (st.lostPinned > 0.25) ks.setPinned(null)
      } else st.lostPinned = 0
      const ci = pinned >= 0 ? pinned : st.hover
      if (ci >= 0 && st.scr[ci * 3 + 2] > 0) {
        cardAnchor.x = st.scr[ci * 3]
        cardAnchor.y = st.scr[ci * 3 + 1]
        cardAnchor.r = st.scr[ci * 3 + 2]
        cardAnchor.on = true
        cardAnchor.ghost = S.ceilOn > 0.5 && st.vis[ci] < 0.5
      } else cardAnchor.on = false
    },
    { priority: -0.9 },
  )

  return (
    <>
      <mesh ref={mesh} geometry={G.geometry} material={G.material} frustumCulled={false} renderOrder={6} />
      <mesh ref={trailMesh} geometry={trail.geometry} material={trail.material} frustumCulled={false} renderOrder={5} visible={false} />
    </>
  )
}
