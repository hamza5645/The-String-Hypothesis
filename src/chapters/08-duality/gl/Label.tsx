import type { ReactNode } from 'react'
import * as THREE from 'three'
import { SceneLabel } from '@/gl'

/*
 * A SceneLabel the director moves, fades and re-words every frame without React renders.
 * Text changes write textContent only when the string actually changes.
 */

export interface Slot {
  group: THREE.Group | null
  el: HTMLSpanElement | null
  sub: HTMLSpanElement | null
  op: number
  text: string
  subText: string
}

export const slot = (): Slot => ({ group: null, el: null, sub: null, op: 0, text: '', subText: '' })

export function place(s: Slot, x: number, y: number, z: number, op: number, text?: string, sub?: string) {
  s.op = op
  if (op <= 0.001) return
  s.group?.position.set(x, y, z)
  if (text !== undefined && text !== s.text && s.el) {
    s.text = text
    s.el.textContent = text
  }
  if (sub !== undefined && sub !== s.subText && s.sub) {
    s.subText = sub
    s.sub.textContent = sub
  }
}

type Tone = 'ink' | 'dim' | 'field' | 'filament' | 'graviton'

export function Lbl({
  s,
  align = 'center',
  tone = 'ink',
  size = 'sm',
  className,
  sub,
  children,
}: {
  s: Slot
  align?: 'left' | 'right' | 'center' | 'above' | 'below'
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  className?: string
  sub?: boolean
  /** Static content (not re-worded by the director). */
  children?: ReactNode
}) {
  return (
    <group
      ref={(g) => {
        s.group = g
      }}
    >
      <SceneLabel position={[0, 0, 0]} align={align} tone={tone} size={size} opacity={() => s.op} className={className}>
        <span className="du-sl">
          {children ?? (
            <span
              ref={(e) => {
                s.el = e
                if (e) e.textContent = s.text
              }}
            />
          )}
          {sub && (
            <span
              className="du-sl__sub"
              ref={(e) => {
                s.sub = e
                if (e && s.subText) e.textContent = s.subText
              }}
            />
          )}
        </span>
      </SceneLabel>
    </group>
  )
}

/*
 * A world's reading of one rung, in the chapter's colour code: `HEAD  n 2 · w 0` with n in Field blue
 * and w in Filament amber. Re-worded by the director without React renders.
 */
export interface ReadSlot extends Slot {
  n: HTMLSpanElement | null
  w: HTMLSpanElement | null
  nText: string
  wText: string
}

export const readSlot = (): ReadSlot => ({ ...slot(), n: null, w: null, nText: '', wText: '' })

export function placeReading(s: ReadSlot, x: number, y: number, op: number, head: string, n: number, w: number) {
  place(s, x, y, 0, op, head)
  if (op <= 0.001) return
  const nt = `n ${n}`
  const wt = `w ${w}`
  if (nt !== s.nText && s.n) {
    s.nText = nt
    s.n.textContent = nt
  }
  if (wt !== s.wText && s.w) {
    s.wText = wt
    s.w.textContent = wt
  }
}

export function ReadLbl({ s, align = 'center' }: { s: ReadSlot; align?: 'left' | 'right' | 'center' }) {
  return (
    <group
      ref={(g) => {
        s.group = g
      }}
    >
      <SceneLabel position={[0, 0, 0]} align={align} tone="dim" size="md" opacity={() => s.op}>
        <span className="du-sl du-read">
          <span
            className="du-read__head"
            ref={(e) => {
              s.el = e
              if (e) e.textContent = s.text
            }}
          />
          <span
            className="du-sl-mom"
            ref={(e) => {
              s.n = e
              if (e) e.textContent = s.nText
            }}
          />
          <span className="du-read__dot"> · </span>
          <span
            className="du-sl-wind"
            ref={(e) => {
              s.w = e
              if (e) e.textContent = s.wText
            }}
          />
        </span>
      </SceneLabel>
    </group>
  )
}
