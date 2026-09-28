import type { GlossaryEntries } from '@/core/glossary'

// Terms introduced in content/05-dimensions.md (definitions ≤ 30 words).
export default {
  dimension: {
    term: 'Dimension',
    def: 'An independent direction to move or vary. Equivalently, how many numbers you need to say where something is.',
    chapter: 'dimensions',
  },
  compactification: {
    term: 'Compactification',
    def: 'Curling extra dimensions into a finite, closed shape. If that shape is small, space looks lower-dimensional at long distances and low energies.',
    chapter: 'dimensions',
  },
  'kaluza-klein-theory': {
    term: 'Kaluza–Klein theory',
    def: 'The 1920s idea that 5D gravity with one circular dimension looks, in 4D, like gravity plus electromagnetism plus one extra field.',
    chapter: 'dimensions',
  },
  'kaluza-klein-tower': {
    term: 'Kaluza–Klein tower',
    def: 'The ladder of heavier copies of a particle, from quantized motion around a hidden circle of radius R. For a particle massless in 5D, rungs are spaced ħ/(Rc) in mass.',
    chapter: 'dimensions',
  },
  'critical-dimension': {
    term: 'Critical dimension',
    def: 'The spacetime dimension at which a string theory’s quantum version, in flat space, keeps its essential symmetries: 26 (bosonic string) or 10 (superstring).',
    chapter: 'dimensions',
  },
  anomaly: {
    term: 'Anomaly',
    def: 'A symmetry of the classical equations that quantum effects destroy. String consistency requires the worldsheet’s scale anomaly to cancel.',
    chapter: 'dimensions',
  },
  braneworld: {
    term: 'Braneworld',
    def: 'A speculative scenario in which the particles we know are confined to a 3D membrane, a “brane” (Ch. 7), while gravity also spreads into extra dimensions.',
    chapter: 'dimensions',
  },
  'inverse-square-law': {
    term: 'Inverse-square law',
    def: 'Gravity’s strength falls as 1/r², the signature of three large space dimensions. Torsion balances have tested it at separations down to 52 µm.',
    chapter: 'dimensions',
  },
} satisfies GlossaryEntries
