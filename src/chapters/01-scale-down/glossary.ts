import type { GlossaryEntries } from '@/core/glossary'

// Terms introduced in chapter 01 (content/01-scale-down.md § Glossary).
export default {
  'order-of-magnitude': {
    term: 'Order of magnitude',
    def: 'A factor of ten. Each tick on the scale gauge is one; 10⁻³ m is three orders of magnitude smaller than one meter.',
    chapter: 'scale-down',
  },
  'probability-cloud': {
    term: 'Probability cloud',
    def: 'Quantum theory’s description of where an electron is likely to be found. It is not a smeared-out electron: each detection finds it in one place.',
    chapter: 'scale-down',
  },
  quark: {
    term: 'Quark',
    def: 'An elementary particle of the Standard Model. Protons and neutrons each contain three valence quarks. Quarks are never observed alone; the strong force confines them.',
    chapter: 'scale-down',
  },
  gluon: {
    term: 'Gluon',
    def: 'The carrier of the strong force that binds quarks. Most of the proton’s mass comes from the energy of its quarks and gluon field, not the quarks’ rest masses.',
    chapter: 'scale-down',
  },
  'standard-model': {
    term: 'Standard Model',
    def: 'The experimentally tested theory of known particles and three forces (not gravity). It treats particles as point-like excitations of quantum fields.',
    chapter: 'scale-down',
  },
  'point-particle': {
    term: 'Point particle',
    def: 'A particle with no size and no internal parts. Experiments can never prove zero size; they can only push the upper limit lower.',
    chapter: 'scale-down',
  },
  resolution: {
    term: 'Resolution',
    def: 'The smallest detail a measurement can distinguish. Finer resolution needs a more energetic probe: roughly ħc divided by the distance.',
    chapter: 'scale-down',
  },
  'planck-length': {
    term: 'Planck length',
    def: 'About 1.6 × 10⁻³⁵ m, built from the constants of quantum mechanics, gravity and relativity. Quantum-gravity effects are expected near it. It is not a proven smallest length.',
    chapter: 'scale-down',
  },
  string: {
    term: 'String',
    def: 'In string theory, a one-dimensional object with length but no thickness, whose vibrations would appear as particles. Strings can be open (two ends) or closed (loops).',
    chapter: 'scale-down',
  },
  'string-length': {
    term: 'String length',
    def: 'ℓs = √α′, string theory’s single adjustable scale. Unknown: experiments require it below about 10⁻¹⁹ m; traditional estimates sit within a few powers of ten of the Planck length.',
    chapter: 'scale-down',
  },
} satisfies GlossaryEntries
