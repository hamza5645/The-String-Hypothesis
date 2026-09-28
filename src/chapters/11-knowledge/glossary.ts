import type { GlossaryEntries } from '@/core/glossary'

// Terms introduced in chapter 11 (content/glossary.md, "Ch. 11" entries). Others are referenced by id.
export default {
  'consistency-condition': {
    term: 'Consistency condition',
    def: 'A requirement a theory must meet just to make sense, such as probabilities adding to one. In string theory these conditions fix the dimension and the allowed symmetries.',
    chapter: 'knowledge',
  },
  'dark-matter': {
    term: 'Dark matter',
    def: 'Unseen matter inferred from its gravity on galaxies, clusters and the cosmic microwave background. It is about 84% of all matter, and its nature is unknown.',
    chapter: 'knowledge',
  },
  microstate: {
    term: 'Microstate',
    def: 'One exact microscopic arrangement of a system. Entropy counts them: S = k_B ln Ω, where Ω is the number of microstates that look the same from outside.',
    chapter: 'knowledge',
  },
  'bekenstein-hawking-entropy': {
    term: 'Bekenstein–Hawking entropy',
    def: 'A black hole’s entropy: one quarter of its horizon area in Planck units. It is derived from general relativity plus quantum fields and has never been measured.',
    chapter: 'knowledge',
  },
  'anti-de-sitter-space': {
    term: 'Anti-de Sitter space',
    def: 'A spacetime of constant negative curvature, like a box whose walls light can reach in finite time. Our expanding universe is not of this type.',
    chapter: 'knowledge',
  },
  'string-landscape': {
    term: 'String landscape',
    def: 'The vast set of possible vacua (stable or long-lived solutions) of string theory, each with different low-energy physics. The often-quoted ~10⁵⁰⁰ is a rough estimate.',
    chapter: 'knowledge',
  },
  'quantum-gravity': {
    term: 'Quantum gravity',
    def: 'A theory joining quantum mechanics and gravity that works at all energies. Candidates include string theory, loop quantum gravity and asymptotic safety. None is experimentally confirmed.',
    chapter: 'knowledge',
  },
  falsifiable: {
    term: 'Falsifiable',
    def: 'Able, in principle, to be shown wrong by some observation. It is a standard test for scientific theories, and critics ask whether string theory currently meets it.',
    chapter: 'knowledge',
  },
} satisfies GlossaryEntries
