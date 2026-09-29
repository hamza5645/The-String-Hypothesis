import { clamp, lerp, smoothstep } from '@/core/math'
import { prefersReducedMotion } from '@/core/time'
import { arc, endMark, inkDot, loop, LOOP_N, OPEN_N, PTS, stretch, tag, wander, type Frame } from './frame'
import { FIELD, INK } from './gfx'
import { loopCrossings, stretchedMass } from './model'
import { STR_W } from './beats'

/*
 * Brane Bench — the lab's string population (content/07-branes.md § Lab › Model).
 * Open strings: endpoints always on a brane; i = j → Bézier arc (apex 0.25·|a − b|, alternate sign);
 * i ≠ j → straight + wiggle, the far end following the near end through a critically damped spring
 * (ω = 6 s⁻¹), so a slanted string relaxes to perpendicular: Neumann ends slide freely while tension pulls.
 * Closed strings: 0.8 ℓ_s/s on a straight 3D path with |û_y| ≥ 0.4, tumbling at 0.4 rad/s; removed at |x| > 14.
 * Collide: two i–i strings in at 1.5 ℓ_s/s → one open string (û, 1.0) + one loop (−û along, ±1.2 across).
 * All motion is a closed-form function of time since each event, so it scrubs and freezes cleanly.
 * Clocks: event times (t0) and every "time since" come from the event clock f.te, which keeps running under
 * reduced motion; f.t / f.tw only drive idle wobbles and walks, which reduced motion freezes. Under reduced
 * motion loops translate without tumbling and a collision cuts from "before" to "after" with a 0.3 s fade.
 */

export interface LabString {
  i: number
  j: number
  x: number
  z: number
  ang: number
  len: number
  dx0: number
  dz0: number
  t0: number
  seed: number
  sign: number
  /** drawn by the visitor (its ends pulse on the sheets for 0.4 s when it is made) */
  drawn?: boolean
}
export interface LabLoop {
  t0: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  a0: number
  b0: number
  ambient: boolean
}

const CR = new Float32Array(12)
const MAX_OPEN = 24
const MAX_CLOSED = 12
const W = 6 // spring ω, s⁻¹
/** collision timing: contact (products handed to the bench) and hand-off of the outgoing open string */
const CONTACT = 2
const DONE = 5
/** reduced motion: the "before" frame holds until RM_CUT, then cross-fades (0.3 s) to the "after" frame */
const RM_CUT = 1.2
const RM_FADE = 0.3
/** reduced motion: where the products sit in the "after" frame (ℓ_s along the brane from the contact point) */
const RM_OUT = 1.2
const RM_IN = 1.1

/** The bench's opening loops: start (x, y above the reference brane, z) and direction (|û_y| ≥ 0.4). */
const POP_LOOPS = [
  [-0.3, 4.3, -1.2, -0.45, 0.5, -0.75],
  [-0.2, -1.3, 2.4, 0.25, 0.75, -0.6],
  [2.9, -1.2, 1.6, 0.35, -0.6, 0.72],
] as const

let seedCounter = 1
const rand = () => {
  seedCounter = (seedCounter * 16807) % 2147483647
  return (seedCounter - 1) / 2147483646
}

export class LabSim {
  strings: LabString[] = []
  loops: LabLoop[] = []
  coll: { t0: number; ux: number; uz: number; sign: number; ref: number } | null = null
  draw = { active: false, i: 0, ax: 0, az: 0, px: 0, py: 0, pz: 0, moved: false }
  snap: { t0: number; fromY: number; j: number; i: number; ax: number; az: number; x: number; z: number } | null = null
  drag = { active: false, j: 0 }
  missing: { t0: number; ux: number; uz: number; ref: number } | null = null
  populated = false
  /** the ladder pair's stretched string this frame (for the stage ruler + live mass tag) */
  pairAt = { on: false, x: 0, z: 0, y0: 0, y1: 0 }

  populate(t: number, n: number) {
    this.strings = []
    this.loops = []
    this.coll = null
    this.missing = null
    // the stretched pair sits in the open middle of the frame, clear of the handles and labels on the left
    this.add({ i: 0, j: 0, x: -1.2, z: 2.8, ang: 0.4, len: 1.0, dx0: 0, dz0: 0, t0: t, seed: 3, sign: 1 })
    if (n > 1) {
      this.add({ i: 1, j: 1, x: 1.8, z: -1.6, ang: 2.1, len: 0.9, dx0: 0, dz0: 0, t0: t, seed: 7, sign: -1 })
      this.add({ i: 0, j: 1, x: 0.8, z: 0.9, ang: 0, len: 0, dx0: 0, dz0: 0, t0: t - 10, seed: 11, sign: 1 })
      this.add({ i: 1, j: 0, x: 2.2, z: 0.2, ang: 0, len: 0, dx0: 0, dz0: 0, t0: t - 10, seed: 13, sign: 1 })
    }
    // three loops already drifting, placed in the open parts of the default view (not tangled with the strings)
    for (let k = 0; k < 3; k++) this.spawnLoop(t - 0.4 - 0.3 * k, 0, true, k)
    this.populated = true
  }

  add(s: LabString) {
    this.strings.push(s)
    while (this.strings.length > MAX_OPEN) this.strings.shift()
  }

  /** Drop strings whose ends sit on branes that no longer exist. */
  sync(n: number) {
    this.strings = this.strings.filter((s) => s.i < n && s.j < n)
  }

  spawnLoop(t: number, yRef: number, ambient = false, k = -1) {
    if (k >= 0) {
      const p = POP_LOOPS[k]
      const m = Math.hypot(p[3], p[4], p[5])
      this.loops.push({ t0: t, x: p[0], y: yRef + p[1], z: p[2], vx: (0.8 * p[3]) / m, vy: (0.8 * p[4]) / m, vz: (0.8 * p[5]) / m, a0: 1.3 + k, b0: 0.7 + 1.9 * k, ambient })
      return
    }
    let ux = 0
    let uy = 0
    let uz = 0
    for (let g = 0; g < 20; g++) {
      const th = rand() * Math.PI * 2
      const c = rand() * 2 - 1
      const s = Math.sqrt(1 - c * c)
      ux = s * Math.cos(th)
      uy = c
      uz = s * Math.sin(th)
      if (Math.abs(uy) >= 0.4) break
    }
    const x = k >= 0 ? [-2.5, 2.2, 0.4][k] : (rand() * 2 - 1) * 3
    const z = k >= 0 ? [1.8, -2.1, 2.6][k] : (rand() * 2 - 1) * 3
    const y = yRef + (rand() < 0.5 ? -1 : 1) * rand() * 0.5
    this.loops.push({ t0: t, x, y, z, vx: 0.8 * ux, vy: 0.8 * uy, vz: 0.8 * uz, a0: rand() * 6, b0: rand() * 6, ambient })
    while (this.loops.length > MAX_CLOSED) this.loops.shift()
  }

  startCollide(t: number, ref: number) {
    const th = rand() * Math.PI * 2
    this.coll = { t0: t, ux: Math.cos(th), uz: Math.sin(th), sign: rand() < 0.5 ? -1 : 1, ref }
  }

  clear() {
    this.strings = []
    this.coll = null
    this.missing = null
    this.snap = null
  }

  beginDraw(i: number, x: number, z: number, y: number) {
    this.draw.active = true
    this.draw.i = i
    this.draw.ax = x
    this.draw.az = z
    this.draw.px = x
    this.draw.py = y
    this.draw.pz = z
    this.draw.moved = false
  }

  /** Release: j = brane under the pointer (or null → the loose end springs back to the nearest brane). */
  endDraw(t: number, ys: number[], j: number | null, x: number, z: number): 'made' | 'snap' | 'tap' {
    const d = this.draw
    d.active = false
    if (!d.moved && j === d.i && Math.hypot(x - d.ax, z - d.az) < 0.25) return 'tap'
    if (j != null) {
      this.make(t, d.i, d.ax, d.az, j, x, z)
      return 'made'
    }
    // nearest brane in height to the released point
    let best = 0
    let bd = Infinity
    for (let k = 0; k < ys.length; k++) {
      const dd = Math.abs(ys[k] - d.py)
      if (dd < bd) {
        bd = dd
        best = k
      }
    }
    this.snap = { t0: t, fromY: d.py, j: best, i: d.i, ax: d.ax, az: d.az, x: clamp(d.px, -4.8, 4.8), z: clamp(d.pz, -4.8, 4.8) }
    return 'snap'
  }

  make(t: number, i: number, ax: number, az: number, j: number, bx: number, bz: number) {
    const cx = clamp(bx, -4.8, 4.8)
    const cz = clamp(bz, -4.8, 4.8)
    if (i === j) {
      const len = clamp(Math.hypot(cx - ax, cz - az), 0.5, 1.5)
      this.add({ i, j, x: (ax + cx) / 2, z: (az + cz) / 2, ang: Math.atan2(cz - az, cx - ax), len, dx0: 0, dz0: 0, t0: t, seed: rand() * 90, sign: rand() < 0.5 ? -1 : 1, drawn: true })
    } else {
      let dx = cx - ax
      let dz = cz - az
      const m = Math.hypot(dx, dz)
      if (m > 3) {
        dx *= 3 / m
        dz *= 3 / m
      }
      this.add({ i, j, x: ax, z: az, ang: 0, len: 0, dx0: dx, dz0: dz, t0: t, seed: rand() * 90, sign: 1, drawn: true })
    }
  }

  /** Advance event state (collisions finishing, loops leaving, the snap-back completing). */
  step(t: number, ys: number[], yRef: number, onSnap: () => void, onCollide: (phase: 'in' | 'out') => void) {
    // loops leave the bench; ambient ones are replaced so the bulk never empties
    for (let k = this.loops.length - 1; k >= 0; k--) {
      const L = this.loops[k]
      const tau = t - L.t0
      const x = L.x + L.vx * tau
      const y = L.y + L.vy * tau
      const z = L.z + L.vz * tau
      if (Math.hypot(x, y - yRef, z) > 14 || tau < -1) {
        this.loops.splice(k, 1)
        if (L.ambient) this.spawnLoop(t, yRef + (rand() < 0.5 ? -2.5 : 2.5), true)
      }
    }
    if (this.snap && t - this.snap.t0 >= 0.4) {
      const s = this.snap
      this.snap = null
      this.make(t, s.i, s.ax, s.az, s.j, s.x, s.z)
      onSnap()
    }
    if (this.coll) {
      const c = this.coll
      const tau = t - c.t0
      const rm = prefersReducedMotion()
      const hit = rm ? RM_CUT : CONTACT
      if (tau >= hit && !this.missing) {
        // hand the products to the bench: a closed loop that leaves, an open string that stays.
        // (reduced motion: the loop starts where the "after" frame drew it, then translates away)
        const y = ys[c.ref] ?? 0
        const d = rm ? RM_OUT : 0
        this.loops.push({ t0: c.t0 + hit, x: -c.ux * d, y: y + c.sign * (0.3 + 1.2 * d), z: -c.uz * d, vx: -c.ux, vy: 1.2 * c.sign, vz: -c.uz, a0: 1, b0: 2, ambient: false })
        this.missing = { t0: c.t0 + hit, ux: c.ux, uz: c.uz, ref: c.ref }
        onCollide('out')
      }
      if (tau >= DONE) {
        const d = rm ? RM_OUT : DONE - CONTACT
        this.add({ i: c.ref, j: c.ref, x: c.ux * d, z: c.uz * d, ang: Math.atan2(c.uz, c.ux), len: 0.6, dx0: 0, dz0: 0, t0: t, seed: rand() * 90, sign: 1 })
        this.coll = null
      }
    }
    if (this.missing && t - this.missing.t0 > 7) this.missing = null
  }

  /**
   * Draw the bench. k = lab presence (0..1), V = viewpoint slider, s = smoothstep(V),
   * pair = the ladder's stretched pair (highlighted), bw = braneworld labels.
   */
  render(f: Frame, k: number, ys: number[], ref: number, V: number, pair: [number, number] | null, bw: boolean) {
    // t: idle wobble phase (frozen under reduced motion); te: the event clock every "time since" is measured on
    const t = f.t
    const te = f.te
    const rm = prefersReducedMotion()
    /** walk time of a string since it was made (0 under reduced motion: the walks are frozen where they began) */
    const walk = (t0: number) => (rm ? 0 : Math.max(0, te - t0))
    const PA = this.pairAt
    PA.on = false
    let pairExact = false
    // camera position (for fading loops that drift toward the lens)
    const cm = f.cam
    const camX = cm.tx + cm.dist * Math.sin(cm.pol) * Math.sin(cm.az)
    const camY = cm.ty + cm.dist * Math.cos(cm.pol)
    const camZ = cm.tz + cm.dist * Math.sin(cm.pol) * Math.cos(cm.az)
    const s = smoothstep(0, 1, V)
    const yRef = ys[ref] ?? 0
    const slice = 1 - smoothstep(0.25, 0.55, V)
    let heavyTag = 0
    let openTagged = false
    for (let n = 0; n < this.strings.length; n++) {
      const st = this.strings[n]
      if (st.i >= ys.length || st.j >= ys.length) continue
      const yi = ys[st.i]
      const yj = ys[st.j]
      const hi = !!pair && ((pair[0] === st.i && pair[1] === st.j) || (pair[0] === st.j && pair[1] === st.i))
      if (st.i === st.j) {
        const wt = walk(st.t0)
        const wd = wander(st.seed, wt, 1.2, st.x, st.z, 4.8 - st.len / 2)
        const cx = wd.x
        const cz = wd.z
        const ang = st.ang + 0.7 * (Math.sin(0.21 * wt + st.seed) - Math.sin(st.seed))
        const len = clamp(st.len * (1 + 0.2 * Math.sin(0.3 * wt + st.seed * 2)), 0.5, 1.5)
        const dx = (Math.cos(ang) * len) / 2
        const dz = (Math.sin(ang) * len) / 2
        const onRef = st.i === ref
        const lift = st.sign * 0.25 * len * Math.max(onRef ? s : 1, 0.1)
        arc(cx - dx, yi, cz - dz, cx + dx, yi, cz + dz, lift, 0.04, t, st.seed)
        f.str.add(PTS, OPEN_N, false, STR_W, k, 0, !onRef)
        endMark(f, cx - dx, yi, cz - dz, k * 0.9, true, 0.85)
        endMark(f, cx + dx, yi, cz + dz, k * 0.9, true, 0.85)
        if (st.drawn) {
          pulse(f, cx - dx, yi, cz - dz, te - st.t0, k)
          pulse(f, cx + dx, yi, cz + dz, te - st.t0, k)
        }
        if (!openTagged && onRef) {
          openTagged = true
          tag(f, 'lmatter', cx, yi + Math.abs(lift) + 0.1, cz, k * (bw ? 1 : 0))
        }
      } else {
        const wd = wander(st.seed, walk(st.t0), 0.8, st.x, st.z, 4.6)
        const nx = wd.x
        const nz = wd.z
        // tension pulls a slanted string back to perpendicular (an interaction response: it runs on te)
        const tau = Math.max(0, te - st.t0)
        const e = (1 + W * tau) * Math.exp(-W * tau)
        const fx = nx + st.dx0 * e
        const fz = nz + st.dz0 * e
        const gap = Math.abs(yj - yi)
        const a = k * (hi ? 1.25 : 1)
        if (gap < 1e-3) {
          // coincident branes: the stretched string is massless too — it lies in the sheet
          arc(nx - 0.34, yi, nz, nx + 0.34, yj, nz, 0.17, 0.03, t, st.seed)
        } else {
          stretch(nx, yi, nz, fx, yj, fz, 0.05, t, st.seed)
        }
        f.str.add(PTS, OPEN_N, false, STR_W, a, 0, true)
        endMark(f, nx, yi, nz, a * 0.95)
        endMark(f, gap < 1e-3 ? nx + 0.34 : fx, yj, gap < 1e-3 ? nz : fz, a * 0.95)
        if (st.drawn) {
          pulse(f, nx, yi, nz, te - st.t0, k)
          pulse(f, gap < 1e-3 ? nx + 0.34 : fx, yj, gap < 1e-3 ? nz : fz, te - st.t0, k)
        }
        // the ladder pair's string carries the stage ruler (prefer the exact orientation i → j)
        if (hi && gap > 0.3 && (!PA.on || (!pairExact && pair && pair[0] === st.i))) {
          PA.on = true
          pairExact = !!pair && pair[0] === st.i
          PA.x = nx
          PA.z = nz
          PA.y0 = yi
          PA.y1 = yj
        }
        // chevron (orientation i → j)
        if (gap > 0.4) {
          const mx = (nx + fx) / 2
          const my = (yi + yj) / 2
          const mz = (nz + fz) / 2
          const d = Math.sign(yj - yi)
          f.hair.seg(mx - 0.09, my - d * 0.055, mz, mx, my + d * 0.045, mz, INK, 0.7 * a)
          f.hair.seg(mx + 0.09, my - d * 0.055, mz, mx, my + d * 0.045, mz, INK, 0.7 * a)
        }
        // in the slice: only the end on the reference brane, as a heavy point-like bead with a mass halo
        if (slice > 0.01 && gap > 1e-3 && (st.i === ref || st.j === ref)) {
          const m = stretchedMass(gap)
          const ex = st.i === ref ? nx : fx
          const ez = st.i === ref ? nz : fz
          const px = 6 + 18 * Math.min(m, 1)
          inkDot(f, ex, yRef, ez, 2.6 * px, 0.28 * slice * k)
          inkDot(f, ex, yRef, ez, 9, 0.95 * slice * k)
          if (heavyTag < 4) {
            // just clear of the halo (radius 1.3·px)
            tag(f, 'lm' + heavyTag, ex + (1.3 * px - 4) * f.wpp, yRef, ez, slice * k, `m = ${m.toFixed(2)} M_s`)
            heavyTag++
          }
        }
      }
    }

    // closed strings
    const dots = 1 - smoothstep(0.2, 0.35, V)
    let loopTagged = false
    for (const L of this.loops) {
      // position on the event clock; the tumble (0.4 rad/s) is an idle motion, frozen under reduced motion
      const tau = te - L.t0
      const x = L.x + L.vx * tau
      const y = L.y + L.vy * tau
      const z = L.z + L.vz * tau
      const tumble = rm ? 0 : tau
      loop(x, y, z, 0.35, t, L.a0 + 0.4 * tumble, L.b0 + 0.27 * tumble)
      // fade loops that leave the bench (and ones drifting toward the camera); in the slice only crossings show
      const fade =
        smoothstep(14, 11, Math.hypot(x, y - yRef, z)) *
        smoothstep(-0.2, 0.4, tau + (L.ambient ? 10 : 0)) *
        smoothstep(8, 5.5, Math.max(Math.abs(x), Math.abs(z))) *
        smoothstep(4, 7.5, Math.hypot(x - camX, y - camY, z - camZ)) *
        (1 - smoothstep(0.72, 0.9, Math.abs(f.ndcY(x, y, z)))) *
        // never drift bright behind the docked panel (right on desktop, the bottom sheet on phones)
        (f.mobile
          ? smoothstep(-0.25, 0.05, f.ndcY(x, y, z))
          : (1 - smoothstep(0.2, 0.42, f.ndcX(x, y, z))) * (1 - smoothstep(0.3, 0.45, f.ndcY(x, y, z)) * smoothstep(-0.1, 0.05, f.ndcX(x, y, z))))
      f.str.add(PTS, LOOP_N, true, STR_W, k * fade * smoothstep(0.15, 0.4, V), 0, true)
      if (dots > 0.01) {
        const c = loopCrossings(PTS, LOOP_N, yRef, CR)
        for (let i = 0; i < c; i++) {
          inkDot(f, CR[i * 3], yRef, CR[i * 3 + 2], 18, 0.22 * dots * k * fade)
          inkDot(f, CR[i * 3], yRef, CR[i * 3 + 2], 7, dots * k * fade)
        }
      }
      if (!loopTagged && bw && Math.abs(y - yRef) > 0.8) {
        loopTagged = true
        tag(f, 'lgrav', x, y + 0.45, z, k * fade * s)
      }
    }

    // collision in progress
    if (this.coll) {
      const c = this.coll
      const y = ys[c.ref] ?? 0
      const tau = te - c.t0
      const clip = c.ref !== ref
      if (rm) {
        // reduced motion: a "before" frame, then a 0.3 s cross-fade to an "after" frame (no sliding)
        const xf = smoothstep(RM_CUT, RM_CUT + RM_FADE, tau)
        if (xf < 1) collIn(f, RM_IN, y, k * (1 - xf), t, clip)
        if (xf > 0) {
          collOut(f, c.ux, c.uz, RM_OUT, y, k * xf, t, clip)
          f.hair.ring(0, y + 0.01, 0, 0.5, FIELD, 0.5 * xf * (1 - smoothstep(2.5, 3.5, tau)) * k, 36)
        }
      } else if (tau < CONTACT) {
        collIn(f, Math.max(0.3, 3 - 1.5 * tau), y, k, t, clip)
      } else if (tau < DONE) {
        const d = tau - CONTACT
        collOut(f, c.ux, c.uz, d, y, k, t, clip)
        const fl = 1 - smoothstep(0, 0.5, d)
        if (fl > 0) f.hair.ring(0, y + 0.01, 0, 0.15 + 1.2 * smoothstep(0, 0.5, d), FIELD, fl * k, 36)
      }
    }
    // missing momentum: in the on-brane view, the visible products don't balance
    if (this.missing) {
      const m = this.missing
      const y = ys[m.ref] ?? 0
      const a = k * (1 - smoothstep(0.4, 0.7, V)) * smoothstep(0, 0.6, te - m.t0) * (1 - smoothstep(5, 7, te - m.t0))
      if (a > 0.01) {
        f.hair.dash(0, y + 0.02, 0, -m.ux * 2.4, y + 0.02, -m.uz * 2.4, INK, 0.9 * a, 0.14, 0.1)
        f.hair.head(0, y + 0.02, 0, -m.ux * 2.4, y + 0.02, -m.uz * 2.4, INK, 0.9 * a, 0.16, 0, 1, 0)
        // the label sits beyond the arrow's tip, on the side it points to (the slice looks straight down: x → right, z → down)
        const key = Math.abs(m.ux) > 0.55 ? (m.ux > 0 ? 'miss2r' : 'miss2') : m.uz > 0 ? 'miss2a' : 'miss2b'
        tag(f, key, -m.ux * 2.55, y, -m.uz * 2.55, a)
      }
    }

    // rubber band while drawing, and the snap-back of a loose end
    if (this.draw.active) {
      const d = this.draw
      const yi = ys[d.i]
      stretch(d.ax, yi, d.az, d.px, d.py, d.pz, 0.02, t, 0)
      f.str.add(PTS, OPEN_N, false, STR_W, 1.1 * k, 0, false)
      endMark(f, d.ax, yi, d.az, k)
      endMark(f, d.px, d.py, d.pz, 0.8 * k, false)
    }
    if (this.snap) {
      const sn = this.snap
      const tau = Math.max(0, te - sn.t0)
      const to = ys[sn.j]
      const yy = to + (sn.fromY - to) * (1 + 12 * tau) * Math.exp(-12 * tau)
      const yi = ys[sn.i]
      stretch(sn.ax, yi, sn.az, sn.x, yy, sn.z, 0.02, t, 0)
      f.str.add(PTS, OPEN_N, false, STR_W, k, 0, false)
      endMark(f, sn.ax, yi, sn.az, k)
      endMark(f, sn.x, yy, sn.z, k, false)
    }
    return lerp(0, 1, k)
  }
}

const COLL_LEN = 0.55
/** The two incoming i–i strings of a collision, at ±x along the brane. */
function collIn(f: Frame, x: number, y: number, a: number, t: number, clip: boolean) {
  for (const sg of [-1, 1]) {
    arc(sg * x - COLL_LEN / 2, y, 0, sg * x + COLL_LEN / 2, y, 0, 0.12, 0.02, t, sg)
    f.str.add(PTS, OPEN_N, false, STR_W, a, 0, clip)
    endMark(f, sg * x - COLL_LEN / 2, y, 0, a * 0.9)
    endMark(f, sg * x + COLL_LEN / 2, y, 0, a * 0.9)
  }
}
/** The outgoing i–i string, a distance d along û from the contact point. */
function collOut(f: Frame, ux: number, uz: number, d: number, y: number, a: number, t: number, clip: boolean) {
  const ox = ux * d
  const oz = uz * d
  const hx = (ux * COLL_LEN) / 2
  const hz = (uz * COLL_LEN) / 2
  arc(ox - hx, y, oz - hz, ox + hx, y, oz + hz, 0.12, 0.02, t, 0.4)
  f.str.add(PTS, OPEN_N, false, STR_W, a, 0, clip)
  endMark(f, ox - hx, y, oz - hz, a * 0.9)
  endMark(f, ox + hx, y, oz + hz, a * 0.9)
}
/** A drawn string's end lands: an expanding Field ring on the sheet for 0.4 s. */
function pulse(f: Frame, x: number, y: number, z: number, age: number, k: number) {
  if (age < 0 || age > 0.4) return
  const q = age / 0.4
  f.hair.ring(x, y + 0.006, z, 0.12 + 0.3 * q, FIELD, 0.9 * (1 - q) * k, 24)
}
