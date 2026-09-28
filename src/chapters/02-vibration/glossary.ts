import type { GlossaryEntries } from '@/core/glossary'

export default {
  harmonic: {
    term: 'Harmonic',
    def: 'One of the standing-wave patterns a string can hold steadily. Harmonic n vibrates at n times the lowest frequency.',
    chapter: 'vibration',
  },
  node: {
    term: 'Node',
    def: 'A point on a vibrating string that stays still. Pinned harmonic n has n − 1 inside the string; a free-ended harmonic n has n.',
    chapter: 'vibration',
  },
  quanta: {
    term: 'Quanta',
    def: 'Whole packets of vibration energy. Quantum physics forbids half a packet, so each harmonic of a quantum string holds 0, 1, 2… of them.',
    chapter: 'vibration',
  },
  level: {
    term: 'Level',
    def: 'The string’s rung number N: add n for every packet in harmonic n. In string theory, mass-squared is proportional to N.',
    chapter: 'vibration',
  },
  'alpha-prime': {
    term: 'α′ (alpha-prime)',
    def: 'String theory’s single adjustable scale, with units of length squared. It sets the tension, T = 1/(2πα′), the string length ℓs = √α′, and the rung spacing M² = N/α′.',
    chapter: 'scale-down',
  },
  'string-scale': {
    term: 'String scale',
    def: 'The mass of the first massive rung, M_s = 1/√α′. Unknown: traditional estimates put it ten to thirty times below the Planck energy (~10¹⁸ GeV); speculative models, much lower.',
    chapter: 'vibration',
  },
  polarization: {
    term: 'Polarization',
    def: 'The direction or pattern of a wave’s vibration. It tells otherwise identical states apart: light has two; gravity’s two, + and ×, sit 45° apart.',
    chapter: 'vibration',
  },
  spin: {
    term: 'Spin',
    def: 'A particle’s built-in angular momentum, in units of ħ. Measured: 0 (Higgs), ½ (electrons, quarks), 1 (photon, gluons, W, Z). A massless spin-s wave’s pattern repeats after turning 360°/s.',
    chapter: 'vibration',
  },
  state: {
    term: 'State',
    def: 'One complete, definite way the string can be: which harmonics hold how many packets, pointing which way. From far away, each state looks like a particle.',
    chapter: 'vibration',
  },
  'hidden-dimensions': {
    term: 'Hidden dimensions',
    def: 'Extra directions of space superstring theory needs for consistency: six beyond our three. Often pictured tiny and curled up, but other options exist. Motion or wrapping there could set charges.',
    chapter: 'vibration',
  },
} satisfies GlossaryEntries
