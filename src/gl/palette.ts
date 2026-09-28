// 3D palette — mirrors src/styles/tokens.css. Colors pass through unmanaged (see Stage.tsx),
// so these hex values are exactly what appears on screen before additive blending.
export const COLORS = {
  void: '#05070B',
  abyss: '#0B0F17',
  ink: '#ECE6D9',
  ink2: '#9AA0AE',
  ink3: '#5C6270',
  /** Strings, and only strings, glow warm. */
  filament: '#FFC98A',
  filamentCore: '#FFF6E8',
  /** Diagram lines, grids, geometry, spacetime. */
  field: '#86A8D8',
  fieldDeep: '#2B3D5C',
  /** Gravity / graviton accent (sparingly). */
  graviton: '#F2A38A',
  /** Epistemic status. */
  observed: '#ECE6D9',
  derived: '#86A8D8',
  conjectured: '#A99BD6',
  speculative: '#7D8190',
} as const
