import type { GlossaryEntries } from '@/core/glossary'

export default {
  duality: {
    term: 'Duality',
    def: 'Two descriptions that look different but predict identical results for every possible measurement, linked by a precise dictionary that translates each quantity of one into the other.',
    chapter: 'duality',
  },
  spectrum: {
    term: 'Spectrum',
    def: 'The complete list of allowed frequencies (for a drum) or particle masses (for a string world). Matching spectra are necessary for a duality but not sufficient.',
    chapter: 'duality',
  },
  isospectral: {
    term: 'Isospectral',
    def: 'Having exactly the same spectrum. Isospectral drums have different shapes yet ring with identical tones. Proved possible in 1992 and confirmed with microwave cavities in 1994.',
    chapter: 'duality',
  },
  'momentum-mode': {
    term: 'Momentum mode',
    def: 'A string state circling a compact dimension, its quantum wave fitting n whole wavelengths. Its energy scales as n/R, cheap on large circles: Chapter 5’s Kaluza–Klein rungs.',
    chapter: 'duality',
  },
  'winding-number': {
    term: 'Winding number',
    def: 'How many times a closed string wraps a compact circle. Wrapping costs tension × length, energy wR/α′: cheap on small circles. Point particles cannot wind.',
    chapter: 'duality',
  },
  't-duality': {
    term: 'T-duality',
    def: 'The equivalence of string physics on a circle of radius R and one of radius α′/R, with momentum and winding exchanged. Holds at every order of string perturbation theory.',
    chapter: 'duality',
  },
  'self-dual-radius': {
    term: 'Self-dual radius',
    def: 'R = √α′, the string length, where a circle and its T-dual partner are the same size. Every smaller radius is equivalent to a larger one.',
    chapter: 'duality',
  },
  'mirror-symmetry': {
    term: 'Mirror symmetry',
    def: 'Pairs of different Calabi–Yau shapes giving identical string physics (type IIA on one equals type IIB on the other); their Hodge numbers swap. Not a reflection of space.',
    chapter: 'duality',
  },
  'gauge-gravity-duality': {
    term: 'Gauge/gravity duality',
    def: 'Also called AdS/CFT (Maldacena 1997): a conjectured equivalence between string theory (which includes quantum gravity) in a curved anti-de Sitter space and a gravity-free quantum theory on its boundary.',
    chapter: 'duality',
  },
} satisfies GlossaryEntries
