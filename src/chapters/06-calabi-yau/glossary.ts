import type { GlossaryEntries } from '@/core/glossary'

// Terms this chapter introduces (content/06-calabi-yau.md › Glossary; ids and wording from content/glossary.md).
// `compactification` (Ch. 5) and `mirror-symmetry` (Ch. 8) are referenced, not redefined.
export default {
  'calabi-yau-manifold': {
    term: 'Calabi–Yau manifold',
    def: 'A compact complex shape that admits a Ricci-flat Kähler metric (Yau’s theorem). Six-dimensional ones with SU(3) holonomy keep some supersymmetry in 4D.',
    chapter: 'calabi-yau',
  },
  'ricci-flat': {
    term: 'Ricci-flat',
    def: 'For every direction, the bending of space in the planes containing that direction adds up to zero. Such a shape solves Einstein’s equations with nothing inside it.',
    chapter: 'calabi-yau',
  },
  supersymmetry: {
    term: 'Supersymmetry',
    def: 'A proposed symmetry pairing every boson with a fermion. It appears in many string models, but string theory does not fix the partners’ masses. No superpartner has been observed.',
    chapter: 'calabi-yau',
  },
  topology: {
    term: 'Topology',
    def: 'The properties of a shape that survive smooth stretching and bending, such as its number of holes or handles. Tearing or gluing can change them.',
    chapter: 'calabi-yau',
  },
  'euler-characteristic': {
    term: 'Euler characteristic (χ)',
    def: 'A single integer summarizing a shape’s holes. For a 2D closed surface χ = 2 − 2g. For the quintic threefold χ = −200.',
    chapter: 'calabi-yau',
  },
  generation: {
    term: 'Generation',
    def: 'One copy of the matter family: two quarks, a charged lepton and its neutrino. Nature has three, with the same charges but different masses.',
    chapter: 'calabi-yau',
  },
  moduli: {
    term: 'Moduli',
    def: 'The continuous “dials” of a hidden shape (its sizes and shape-twists). Their values would set particle masses and couplings, and something must fix (“stabilize”) them.',
    chapter: 'calabi-yau',
  },
  'hodge-numbers': {
    term: 'Hodge numbers',
    def: 'The refined hole counts of a complex shape. For a Calabi–Yau threefold, h¹¹ counts size dials and 2D holes; h²¹ counts shape dials.',
    chapter: 'calabi-yau',
  },
  projection: {
    term: 'Projection',
    def: 'Drawing a higher-dimensional object as its lower-dimensional shadow. Overlaps and crossings in the shadow may not exist in the object itself.',
    chapter: 'calabi-yau',
  },
} satisfies GlossaryEntries
