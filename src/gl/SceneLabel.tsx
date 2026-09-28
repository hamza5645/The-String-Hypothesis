import { useRef, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { useChapterFrame, type FrameInfo } from './useChapterFrame'

/**
 * SceneLabel — a crisp DOM annotation pinned to a 3D point (mono caption, optional
 * hairline leader), in the "figure in a physics paper" style. Fades with the chapter's
 * presence automatically; pass `opacity` (number or per-frame fn) to choreograph it.
 * Labels live in the #scene-labels layer: above the canvas, below narrative text.
 */
export function SceneLabel({
  position,
  children,
  align = 'left',
  tone = 'ink',
  leader = false,
  opacity = 1,
  size = 'sm',
  className,
}: {
  position: [number, number, number]
  children: ReactNode
  align?: 'left' | 'right' | 'center' | 'above' | 'below'
  tone?: 'ink' | 'dim' | 'field' | 'filament' | 'graviton'
  leader?: boolean
  opacity?: number | ((f: FrameInfo) => number)
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const op = useRef(opacity)
  op.current = opacity
  useChapterFrame(
    (f) => {
      const el = ref.current
      if (!el) return
      const o = typeof op.current === 'function' ? op.current(f) : op.current
      const v = Math.max(0, Math.min(1, o * f.presence))
      el.style.opacity = v.toFixed(3)
      el.style.visibility = v < 0.01 ? 'hidden' : 'visible'
    },
    { always: true },
  )
  const portal = { current: document.getElementById('scene-labels')! }
  return (
    <Html position={position} portal={portal} zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
      <div
        ref={ref}
        className={`scene-label scene-label--${align} scene-label--${tone} scene-label--${size}${leader ? ' scene-label--leader' : ''}${className ? ' ' + className : ''}`}
        style={{ opacity: 0 }}
      >
        <span className="scene-label__text">{children}</span>
      </div>
    </Html>
  )
}
