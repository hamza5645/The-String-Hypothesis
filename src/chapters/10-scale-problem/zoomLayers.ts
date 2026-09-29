/*
 * Beat 1's ghost layers: fixed physical sizes, each visible while its size is between lo and hi
 * times the view (log-soft edges). Shared by the hairline (DOM) and point-cloud (WebGL) layers.
 */
import { AU, LY } from './model'

export interface ZoomLayer {
  id: string
  D: number
  lo: number
  hi: number
  label: [string, string]
}

// hi > 1: a world sweeps in while still larger than the frame (the fog-like proton, atom, star field and
// cosmic web fill it first); lo ≈ 0.003: it stays until it has shrunk to a third of a percent of the view,
// receding into a labelled dot
export const ZOOM_LAYERS: Record<string, ZoomLayer> = {
  proton: { id: 'proton', D: 1.7e-15, lo: 0.001, hi: 8, label: ['PROTON', '1.7 × 10⁻¹⁵ m'] },
  atom: { id: 'atom', D: 3.4e-10, lo: 0.001, hi: 8, label: ['CARBON ATOM', '~3 × 10⁻¹⁰ m'] },
  cells: { id: 'cells', D: 1e-4, lo: 0.001, hi: 7, label: ['CELLS', '~10⁻⁵ m each'] },
  you: { id: 'you', D: 1.7, lo: 0.003, hi: 1.25, label: ['YOU', '1.7 m'] },
  lake: { id: 'lake', D: 73e3, lo: 0.003, hi: 2.5, label: ['LAKE GENEVA', '~73 km long'] },
  earth: { id: 'earth', D: 1.2742e7, lo: 0.003, hi: 2.5, label: ['EARTH', '1.27 × 10⁷ m'] },
  moon: { id: 'moon', D: 7.688e8, lo: 0.003, hi: 2.5, label: ["MOON'S ORBIT", '7.7 × 10⁸ m across'] },
  solar: { id: 'solar', D: 60.14 * AU, lo: 0.0008, hi: 40, label: ['SOLAR SYSTEM', '9.0 × 10¹² m'] },
  stars: { id: 'stars', D: 120 * LY, lo: 0.003, hi: 30, label: ['NEAREST STARS', 'Proxima Centauri: 4.2 ly away'] },
  galaxy: { id: 'galaxy', D: 8.3e20, lo: 0.003, hi: 2.6, label: ['MILKY WAY', '8.3 × 10²⁰ m'] },
  web: { id: 'web', D: 3e25, lo: 0.02, hi: 10, label: ['COSMIC WEB', 'filaments of galaxies'] },
  universe: { id: 'universe', D: 8.8e26, lo: 0.2, hi: 1.6, label: ['OBSERVABLE UNIVERSE', '8.8 × 10²⁶ m'] },
}

/** Beat 1's central readout: what lives at the current decade. */
export function scaleName(s: number) {
  if (s < -19) return 'Beyond any measurement'
  if (s < -13) return 'Quarks, protons, nuclei'
  if (s < -7.5) return 'Atoms and molecules'
  if (s < -3) return 'Cells'
  if (s < 3) return 'Human scale'
  if (s < 9.5) return 'Planet scale'
  if (s < 15.5) return 'Solar System scale'
  if (s < 19.5) return 'Nearest stars'
  if (s < 23.5) return 'Galaxy scale'
  if (s < 26.5) return 'Cosmic web'
  return 'Observable universe'
}
