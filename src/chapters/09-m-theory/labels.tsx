import { useRef, type ComponentProps, type ReactNode } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { SceneLabel, useChapterFrame, type FrameInfo } from '@/gl'
import { smoothstep } from '@/core/math'
import { S } from './director'

/* Portrait phones dock the Lab as a bottom sheet, and the #scene-labels layer paints above it: a rig label that
   projects below the sheet's top edge (e.g. after the visitor turns the view) fades out instead of covering it. */
const SHEET = { top: Infinity, at: -1e9 }
function sheetTop() {
  const now = performance.now()
  if (now - SHEET.at > 400) {
    SHEET.at = now
    const el = document.querySelector('[data-chapter="m-theory"] .step--lab .lab')
    const r = el?.getBoundingClientRect()
    SHEET.top = r && r.height > 0 ? r.top : Infinity
  }
  return SHEET.top
}
const V = new THREE.Vector3()

/** Opacity factor (1 → 0) for a label anchored at `anchor` as it nears the lab sheet on portrait phones. */
function useSheetSafety(anchor: React.RefObject<THREE.Object3D | null>) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const k = useRef(1)
  useChapterFrame(() => {
    const a = anchor.current
    if (!a || !S.portrait || S.labW < 0.01) {
      k.current = 1
      return
    }
    a.getWorldPosition(V).project(camera)
    const y = ((1 - V.y) / 2) * size.height
    const top = sheetTop()
    k.current = 1 - smoothstep(top - 28, top - 6, y)
  })
  return k
}

type LabelProps = ComponentProps<typeof SceneLabel>

/** A SceneLabel that also stays off the portrait Lab sheet. */
export function SafeLabel({ position, opacity = 1, ...rest }: LabelProps) {
  const g = useRef<THREE.Group>(null)
  const k = useSheetSafety(g)
  const op = useRef(opacity)
  op.current = opacity
  return (
    <group ref={g} position={position}>
      <SceneLabel {...rest} position={[0, 0, 0]} opacity={(f) => (typeof op.current === 'function' ? op.current(f) : op.current) * k.current} />
    </group>
  )
}

/** A SceneLabel whose text changes every frame without React renders (and stays off the portrait Lab sheet). */
export function DynLabel({
  position,
  text,
  opacity,
  align = 'left',
  tone = 'ink',
  size = 'sm',
  className = 'mth-readout',
  prefix,
}: {
  position: [number, number, number]
  text: () => string
  opacity: number | ((f: FrameInfo) => number)
  align?: 'left' | 'right' | 'center' | 'above' | 'below'
  tone?: 'ink' | 'dim' | 'field' | 'filament'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  prefix?: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const last = useRef('')
  const op = useRef(opacity)
  op.current = opacity
  useChapterFrame((f) => {
    const o = typeof op.current === 'function' ? op.current(f) : op.current
    if (o <= 0.002) return
    const t = text()
    if (t !== last.current && ref.current) {
      ref.current.textContent = t
      last.current = t
    }
  })
  return (
    <SafeLabel position={position} opacity={opacity} align={align} tone={tone} size={size}>
      <span className={className}>
        {prefix}
        <span ref={ref} />
      </span>
    </SafeLabel>
  )
}
