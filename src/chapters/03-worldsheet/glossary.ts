import type { GlossaryEntries } from '@/core/glossary'

// Terms introduced in chapter 03 (content/03-worldsheet.md › Glossary).
export default {
  worldline: {
    term: 'Worldline',
    def: 'The line a point particle traces through spacetime: every place it has been, at every moment, drawn as one line.',
    chapter: 'worldsheet',
  },
  worldsheet: {
    term: 'Worldsheet',
    def: "The surface a string traces through spacetime. An open string's is a ribbon; a closed string's is a tube.",
    chapter: 'worldsheet',
  },
  'open-string': {
    term: 'Open string',
    def: 'A string with two free ends; classically they move at light speed. Later chapters show the ends can stick to objects called D-branes.',
    chapter: 'worldsheet',
  },
  'closed-string': {
    term: 'Closed string',
    def: 'A string that forms a loop with no ends. Its worldsheet is a tube. Any theory with open strings contains closed strings too.',
    chapter: 'worldsheet',
  },
  'proper-time': {
    term: 'Proper time',
    def: 'The time a clock carried along a worldline actually ticks. Between two events, the straight, unaccelerated worldline ticks the most.',
    chapter: 'worldsheet',
  },
  'nambu-goto-action': {
    term: 'Nambu–Goto action',
    def: "String theory's starting rule: a history's action is minus the string tension times the worldsheet's area, measured by relativity's rules.",
    chapter: 'worldsheet',
  },
  'pair-of-pants': {
    term: 'Pair of pants',
    def: 'The worldsheet of one closed string splitting into two, or two joining into one. It is smooth everywhere, with no corner.',
    chapter: 'worldsheet',
  },
  vertex: {
    term: 'Vertex',
    def: 'In a particle (Feynman) diagram, the sharp point where worldlines meet. Particle theories attach a separate rule and strength to each kind of vertex.',
    chapter: 'worldsheet',
  },
  simultaneity: {
    term: 'Simultaneity',
    def: 'Which events count as happening "now". Observers moving relative to each other slice spacetime into "nows" at different tilts (a well-tested consequence of special relativity).',
    chapter: 'worldsheet',
  },
  // Named first in beat text here (Beat 5); content/glossary.md lists no other chapter that defines it.
  superstring: {
    term: 'Superstring',
    def: 'String theory with fermions (spin-½ states, like electrons) in its spectrum as well as bosons, paired rung by rung. In flat space it needs ten spacetime dimensions (Ch. 5).',
    chapter: 'worldsheet',
  },
  'uv-divergence': {
    term: 'UV divergence',
    def: 'An infinity in a quantum calculation that comes from extremely short distances (very high energies), for example interaction points squeezed together.',
    chapter: 'worldsheet',
  },
} satisfies GlossaryEntries
