import type { GlossaryEntries } from '@/core/glossary'

// content/10-scale-problem.md § Glossary
export default {
  'logarithmic-scale': {
    term: 'Logarithmic scale',
    def: 'A scale where each equal step multiplies by the same factor, here ten. Atoms and galaxies get equal room. Enlarging everything simply slides the picture.',
    chapter: 'scale-problem',
  },
  electronvolt: {
    term: 'Electronvolt',
    def: 'The energy an electron gains crossing one volt: 1.6 × 10⁻¹⁹ J. A GeV is 10⁹ eV; a TeV is 10¹² eV.',
    chapter: 'scale-problem',
  },
  'collision-energy': {
    term: 'Collision energy',
    def: 'The total energy available when two particles meet head-on. It sets the smallest distance, and the heaviest new particle, a collision can reach.',
    chapter: 'scale-problem',
  },
  'synchrotron-radiation': {
    term: 'Synchrotron radiation',
    def: 'Light given off by charged particles on curved paths. It grows steeply with energy and limits how powerful a ring collider can be.',
    chapter: 'scale-problem',
  },
  'black-hole': {
    term: 'Black hole',
    def: 'A region where gravity traps even light. Energy E packed inside its horizon radius, 2GE/c⁴, would form one. For everyday energies this radius is absurdly tiny.',
    chapter: 'scale-problem',
  },
  'string-scale': {
    term: 'String scale',
    def: 'The energy (or length ℓs = √α′) at which strings would reveal their extent. Unknown. Traditional estimates sit roughly ten to thirty times below the Planck energy; speculative models place it much lower.',
    chapter: 'scale-problem',
  },
  'indirect-test': {
    term: 'Indirect test',
    def: 'Checking a theory through consequences at accessible scales, such as the early universe or short-range gravity, instead of seeing its basic objects directly. Theoretical checks test consistency, not nature.',
    chapter: 'scale-problem',
  },
  supersymmetry: {
    term: 'Supersymmetry',
    def: "A proposed symmetry pairing each known particle with a partner. It appears in many string models, but string theory does not fix the partners' masses. None have been found.",
    chapter: 'scale-problem',
  },
  'cosmic-superstring': {
    term: 'Cosmic superstring',
    def: 'A hypothetical string (a fundamental string or a D-string) stretched to astronomical length by cosmic expansion. Not observed. Searches use gravitational waves and the cosmic microwave background.',
    chapter: 'scale-problem',
  },
  swampland: {
    term: 'Swampland',
    def: 'The set of low-energy theories that seem consistent but cannot be completed into quantum gravity. Its proposed criteria are conjectures, actively debated.',
    chapter: 'scale-problem',
  },
} satisfies GlossaryEntries
