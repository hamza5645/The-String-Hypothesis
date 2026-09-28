import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Backdrop } from '@/gl'
import { Director } from './Director'
import { Figures } from './Figures'
import { Shared } from './shared'
import { Stagecraft } from './Stagecraft'
import { Thread } from './Thread'

/*
 * Chapter 02 · Vibration — "How can one kind of thing look like many particles?"
 * One continuous stage driven by a beat coordinate (see timeline.ts):
 *   H1 → guitar harmonics → free ends + quanta + the mass ladder → polarization & spin →
 *   step back (a point with properties; the catalogue of states) → the bottom rung →
 *   where charge comes from → the Vibration Bench (lab) → back out to H0.
 * Director (priority −3) writes the choreography into a shared state object; Stagecraft (−2),
 * Thread and the DOM figure layer (−1 / −0.5) render it.
 */
export default function Scene() {
  const S = useMemo(() => new Shared(), [])
  const gl = useThree((st) => st.gl)
  if (import.meta.env.DEV) Object.assign(window as object, { __vib: S, __vibGL: gl })
  return (
    <>
      <Backdrop />
      <Director S={S} />
      <Thread S={S} />
      <Stagecraft S={S} />
      <Figures S={S} />
    </>
  )
}
