import { useEffect, useState } from 'react'
import { clock } from '@/core/time'
import { Eq } from '@/ui'
import { deeperPhase } from './layout'

/**
 * Go deeper (content/03-worldsheet.md › Go deeper). While the drawer is open, the stage clock drives a
 * slow highlight loop shared with the Scene: dτ ↔ the proper-time ticks, T ↔ the ribbon's glowing edges,
 * dA ↔ the area fill, b and h ↔ the counters beside the tube, the pants and the handle.
 */
function useDeeperHighlight() {
  const [hl, setHl] = useState({ dtau: 0, T: 0, dA: 0, bh: 0 })
  useEffect(() => {
    let raf = 0
    let last = ''
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const p = deeperPhase(clock.t)
      const key = [p.dtau, p.T, p.dA, p.bh].map((v) => Math.round(v * 10)).join()
      if (key !== last) {
        last = key
        setHl(p)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return hl
}

export function DeeperContent({ observersFirst = false }: { observersFirst?: boolean }) {
  const hl = useDeeperHighlight()
  const observers = (
    <>
      {!observersFirst && <h3>Do moving observers really disagree about where it split?</h3>}
      <p>
        String amplitudes are computed on worldsheets in “imaginary time”. There, a tilt is just a rotation and every patch of the pants is locally alike,
        so the moving pinch is exact geometry. A strictly real-time classical splitting surface is different. It cannot be timelike everywhere; in the
        simplest case it has one degenerate “crotch” point, and every observer’s slicing would find the split there. The lesson that survives in both
        pictures: no vertex is put in by hand.
      </p>
      <p className="ws-deeper-note">
        In the lab, the drawn crotch is flatter than 45° within about ±0.34 ℓ in x and ±0.86 ℓ in y. That patch is exactly where the moving pinch lives,
        and it is the tell. The specific pants shape is a cartoon: the quantum amplitude sums over all smooth surfaces of this shape class.
      </p>
    </>
  )
  return (
    <>
      <p className="ws-deeper-sync t-label" aria-hidden="true">
        <span className="ws-deeper-sync__dot" /> Highlighted terms pulse with the figure behind this panel
      </p>
      {observersFirst && observers}
      {/* the drawer's own title names the first section */}
      {observersFirst && <h3>Why area, and where do interactions come from?</h3>}
      <p>A relativistic particle’s action is its proper time, scaled by its rest energy:</p>
      <Eq display tex={String.raw`S_{\text{particle}} = -\,m c^{2}\!\int \htmlClass{term-dtau}{d\tau}`} highlight={{ dtau: hl.dtau }} label="S particle equals minus m c squared times the integral of d tau" />
      <p>
        Here <em>m</em> is the mass and <em>dτ</em> is the time ticked by a clock riding along each bit of the worldline. The straight worldline has the
        most proper time, so it gives the smallest action of any worldline between the same two events.
      </p>
      <p>Nambu (1970) and Goto (1971) lifted this rule one dimension:</p>
      <Eq
        display
        tex={String.raw`S_{\text{NG}} = -\frac{\htmlClass{term-T}{T}}{c}\int \htmlClass{term-dA}{dA} \;=\; -\frac{\htmlClass{term-T}{T}}{c}\int d\tau\,d\sigma\,\sqrt{(\dot X\!\cdot\! X')^{2}-\dot X^{2}\,X'^{2}}`}
        highlight={{ T: hl.T, dA: hl.dA }}
        label="S Nambu-Goto equals minus T over c times the integral of dA, the worldsheet area"
      />
      <ul>
        <li>
          <em>T</em> is the tension, an energy per unit length. In units where ħ = c = 1 it is written 1/2πα′.
        </li>
        <li>
          <em>X(τ, σ)</em> places each point of the worldsheet in spacetime: σ runs along the string and τ runs forward in time. (Here τ is just a label,
          not the particle’s proper time above.)
        </li>
        <li>
          <em>Ẋ</em> and <em>X′</em> are the two edges of a tiny patch, and the square root is that patch’s area, measured by relativity’s rules.
        </li>
      </ul>
      <p>
        The real history makes <em>S</em> <strong>stationary</strong>: nudge it slightly and <em>S</em> changes only at second order. The area doesn’t
        depend on how you label or slice the sheet into moments, so no slicing of the pants is preferred.
      </p>
      <p>
        Interactions need almost no new ingredient. There is no vertex rule, only one weight per shape class. (Tong says the free theory already contains
        all the information about interactions, and adds that this is “almost true”.)
      </p>
      <Eq
        display
        tex={String.raw`\text{weight}\;\propto\; g_s^{-\chi},\qquad \chi = 2-2\htmlClass{term-h}{h}-\htmlClass{term-b}{b}`}
        highlight={{ h: hl.bh, b: hl.bh }}
        label="weight proportional to g s to the minus chi, with chi equal to 2 minus 2 h minus b"
      />
      <ul>
        <li>
          <em>χ</em> is the Euler number of the surface. Here <em>b</em> counts the openings where strings enter or leave, and <em>h</em> counts handles
          (loops). This uses Tong’s normalization, in which each incoming or outgoing string carries one factor of g<sub>s</sub>.
        </li>
        <li>A tube has χ = 0: free travel. The pants have χ = −1: one factor of the string coupling g<sub>s</sub>.</li>
        <li>Each extra handle costs another factor of g<sub>s</sub>².</li>
      </ul>
      <p>
        And g<sub>s</sub> is not a free dial: it is the value of a field of the theory itself, the dilaton. What fixes that value in our universe is an
        open question.
      </p>
      {!observersFirst && observers}
      <h3>Sources</h3>
      <p className="ws-deeper-src">
        Tong, <em>Lectures on String Theory</em> §1.2, §3, §6 · Zwiebach, <em>A First Course in String Theory</em> ch. 6–8 · Witten, “Reflections on the
        Fate of Spacetime”, Physics Today 49(4) (1996) · Louko &amp; Sorkin, CQG 14, 179 (1997) · Sen &amp; Zwiebach, “String Field Theory: A Review”
        (2024) · D’Hoker &amp; Phong (2002, 2005).
      </p>
    </>
  )
}
