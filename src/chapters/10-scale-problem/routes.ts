/* Beat 6's six routes: how physicists look sideways (content pack § Beat 6). */
import type { StatusKind } from '@/ui'

export interface Route {
  title: string
  status: StatusKind[]
  text: string
  /** leader targets on the Ruler (s); 'sky' = the Ruler's far left */
  to: (number | 'sky')[]
  check?: boolean
}
export const ROUTES: Route[] = [
  { title: 'Early universe · CMB', status: ['observed', 'speculative'], text: 'Primordial gravitational waves would reveal physics near 10¹⁶ GeV. Not yet seen: r < 0.036.', to: ['sky', Math.log10(2e-32)] },
  { title: 'Cosmic superstrings', status: ['speculative'], text: 'Strings stretched to astronomical length by expansion. None found; gravitational-wave data limit their tension.', to: ['sky', -33.9] },
  { title: 'Colliders', status: ['observed'], text: 'No superpartners, extra dimensions or string resonances so far. String theory doesn’t fix superpartner masses.', to: [-19] },
  { title: 'Gravity at short range', status: ['observed'], text: 'Newton’s inverse-square law holds down to 52 µm. Large extra dimensions must hide below that.', to: [Math.log10(52e-6)] },
  { title: 'Black holes · theory', status: ['derived'], text: 'For special black holes, string theory counts the microstates and matches the Bekenstein–Hawking entropy (1996).', to: [], check: true },
  { title: 'Consistency', status: ['derived', 'conjectured'], text: 'String consistency is restrictive: anomalies cancel only for special choices. Proposed ‘swampland’ rules may limit possible physics.', to: [], check: true },
]
