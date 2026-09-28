import { useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import { useChapterFrame } from '@/gl'
import { smoothstep } from '@/core/math'
import { el, type LabelLayer, type Lbl } from '../gl/labels'
import type { Stage } from '../director'

/*
 * Screen-space composition elements (not pinned to 3D): the persistent map tag and the B6 frame's
 * readouts. They live in the chapter's label layer (screen mode) so they fade with presence.
 */

function tagEl(chip: string, text: string, text2?: string) {
  return el('span', 'kn-tag', [el('span', 'kn-tag__chip', chip), el('span', 'kn-tag__t', text), text2 ? el('span', 'kn-tag__t', text2) : null])
}

export function Hud({ S, layer, map }: { S: Stage; layer: LabelLayer | null; map: RefObject<THREE.Group> }) {
  const L = useMemo(() => {
    if (!layer) return null
    const o = { screen: true, safe: false, clamp: false, align: 'left' as const, dx: 0.001 }
    const tag = layer.add(tagEl('≈ ANALOGY', 'HEIGHT = DISTANCE FROM EXPERIMENT', '· NOT IMPORTANCE, NOT TRUTH'), [0, 0, 0], { ...o, align: 'right', cls: 'kn-lbl--hud', prio: 950, solid: true })
    // B6's frame: the verdict as a figure — three large zeros, then the count, then the one-line why
    const zero = (label: string) => el('div', 'kn-zero', [el('b', 'kn-zero__n', '0'), el('span', 'kn-zero__k', label)])
    const read = el('div', 'kn-demand', [
      el('div', 'kn-demand__k', 'DETECTED SO FAR'),
      el('div', 'kn-demand__zeros', [zero('STRINGS'), zero('SUPERPARTNERS'), zero('EXTRA DIMENSIONS')]),
      el('div', 'kn-readline', [el('span', '', ['CLAIMS SHOWN', el('b', '', '14 / 34')]), el('span', 'kn-readline__sep', '·'), el('span', '', ['STRING-THEORY CLAIMS SHOWN', el('b', '', '0 / 17')])]),
      el('div', 'kn-demand__cap', 'Only strings glow warm on this site. Measured ground has none.'),
    ])
    const readouts = layer.add(read, [0, 0, 0], { ...o, align: 'center', cls: 'kn-lbl--hud' })
    return { tag, readouts } as Record<string, Lbl>
  }, [layer])

  const v = useMemo(() => new THREE.Vector3(), [])
  useChapterFrame(
    (f) => {
      if (!L) return
      const W = S.W
      const H = S.H
      // persistent tag: bottom-left on desktop, under the top bar on phones
      // top-right, under the tool bar: the one corner the map never reaches
      const vw = S.vw
      L.tag.x = S.mobile ? vw - 16 : W - 64
      L.tag.y = S.mobile ? 70 : 76
      L.tag.target = S.tag * (1 - S.cnt.grow) * (1 - S.holo.grow) * (S.sp.lab > 0.1 && S.sp.lab < 0.97 ? 0.6 : 1)
      // B6 frame readouts: centred under the ground's near edge (never on it), once the beat text has
      // gone (phones: the text leaves upward through the lower half, so the figure waits for it)
      v.set(0, 0, 7).applyMatrix4(map.current.matrixWorld).project(f.state.camera)
      const gy = (0.5 - v.y * 0.5) * H
      const h = L.readouts.h || 180
      const top = Math.min(Math.max(gy + (S.mobile ? 14 : 22), H * 0.5), H - h - (S.mobile ? 24 : 36))
      L.readouts.x = S.mobile ? vw / 2 : W * (0.5 + S.shiftX)
      L.readouts.y = top + h / 2
      L.readouts.target = S.readouts * (S.mobile ? smoothstep(0.92, 0.97, S.sp.demand) : 1)
    },
    // after the camera and view shift have settled this frame
    { priority: -0.9 },
  )
  return null
}
