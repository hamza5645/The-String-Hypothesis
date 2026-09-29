import type { GlossaryEntries } from '@/core/glossary'

export default {
  'string-coupling': {
    term: 'String coupling',
    def: 'The number g that sets how likely a string is to split or join. Small g: approximations (perturbation theory) work. Near or above 1: they fail.',
    chapter: 'm-theory',
  },
  'heterotic-string': {
    term: 'Heterotic string',
    def: 'A closed string whose waves running one way are superstring-like and the other way bosonic-string-like. It has two supersymmetric versions, with symmetry SO(32) or E8×E8.',
    chapter: 'm-theory',
  },
  's-duality': {
    term: 'S-duality',
    def: 'A proposed exact equivalence swapping strong and weak coupling, g ↔ 1/g. It maps Type I to heterotic SO(32), and Type IIB to itself. Conjectured; passed many theoretical checks, none experimental.',
    chapter: 'm-theory',
  },
  'bps-state': {
    term: 'BPS state',
    def: 'An object whose mass or tension supersymmetry fixes exactly by its charges, so it can be followed reliably from weak to strong coupling.',
    chapter: 'm-theory',
  },
  'd-particle': {
    term: 'D-particle',
    def: 'A D0-brane: Type IIA’s pointlike D-brane, with mass 1/(g ℓs). Heavy at weak coupling, light at strong coupling.',
    chapter: 'm-theory',
  },
  membrane: {
    term: 'Membrane',
    def: 'A two-dimensional extended object (the M2-brane). In M-theory, a membrane wrapped once around the eleventh-dimensional circle behaves exactly as the Type IIA string.',
    chapter: 'm-theory',
  },
  'eleven-dimensional-supergravity': {
    term: 'Eleven-dimensional supergravity',
    def: 'The supersymmetric theory of gravity in eleven dimensions, the maximum supersymmetry allows (1978). Believed to be M-theory’s low-energy limit.',
    chapter: 'm-theory',
  },
  'm-theory': {
    term: 'M-theory',
    def: 'The conjectured single theory whose limits are the five superstring theories and eleven-dimensional supergravity. Its complete formulation is unknown.',
    chapter: 'm-theory',
  },
  'moduli-space': {
    term: 'Moduli space',
    def: 'The space of a theory’s adjustable background values, such as its coupling and the sizes and shapes of hidden dimensions. Each point is one possible background.',
    chapter: 'm-theory',
  },
  'matrix-theory': {
    term: 'Matrix theory',
    def: 'The BFSS conjecture (1996): M-theory in certain backgrounds equals the quantum mechanics of N×N matrices as N grows without limit.',
    chapter: 'm-theory',
  },
} satisfies GlossaryEntries
