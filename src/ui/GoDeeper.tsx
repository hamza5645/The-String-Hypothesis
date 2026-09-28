import type { ReactNode } from 'react'
import { useChapter } from '../core/chapter'
import { useSettings } from '../core/settings'
import { Drawer } from './Drawer'

/**
 * "Go deeper": a small trigger that opens a side drawer with equations and technical detail.
 * Put rigorous-but-readable content inside (use <Eq> for math, <p>, <ul>, <h3>).
 */
export function GoDeeper({ id = 'deeper', title, label = 'Go deeper', children }: { id?: string; title: ReactNode; label?: ReactNode; children: ReactNode }) {
  const h = useChapter()
  const key = `${h.id}:${id}`
  const open = useSettings((s) => s.drawer === key)
  const setDrawer = useSettings((s) => s.setDrawer)
  return (
    <>
      <button type="button" className="deeper-trigger" onClick={() => setDrawer(key)} data-ui aria-haspopup="dialog">
        <span className="deeper-trigger__glyph" aria-hidden="true">
          ∂
        </span>
        <span>{label}</span>
      </button>
      <Drawer open={open} onClose={() => setDrawer(null)} title={title} eyebrow={`${String(h.index).padStart(2, '0')} · Go deeper`}>
        {children}
      </Drawer>
    </>
  )
}

/** Content shown only in "Deeper physics" mode (global toggle in the top bar). */
export function Deeper({ children, inline = false }: { children: ReactNode; inline?: boolean }) {
  const on = useSettings((s) => s.deeper)
  if (!on) return null
  return inline ? <span className="deeper-inline">{children}</span> : <div className="deeper-block">{children}</div>
}
