/*
 * Chapter 11 · What We Know — the Claim atlas (content/11-knowledge.md § Claim atlas, Lab Model §1).
 * Pure data: shared by the Overlay (cards, referee) and the Scene (glyphs, labels). No three.js here.
 */

export type Tier = 0 | 1 | 2 | 3
export type Chip = 'observed' | 'derived' | 'conjectured' | 'speculative'

export const CHIPS: Chip[] = ['observed', 'derived', 'conjectured', 'speculative']
export const GLYPH: Record<Chip, string> = { observed: '●', derived: '◑', conjectured: '◌', speculative: '○' }
export const CHIP_NAME: Record<Chip, string> = { observed: 'Observed', derived: 'Derived', conjectured: 'Conjectured', speculative: 'Speculative' }

export interface Claim {
  id: string
  tier: Tier
  /** string-theory claim (counts toward STRING-THEORY CLAIMS SHOWN) */
  st: boolean
  onThread: boolean
  pos: [number, number, number]
  label: string
  sub?: string
  /** small extra tag on the stage (NULL RESULT etc.) */
  tag?: string
  /** crack node on the ground */
  crack?: boolean
  summary: string
  detail: string
  /** chip-tooltip override shown on the card */
  note?: string
}

export const CLAIMS: Claim[] = [
  // ── Zone I · tier 0 · ● OBSERVED (14; none is a string-theory claim) ──
  {
    id: 'G4',
    tier: 0,
    st: false,
    onThread: false,
    pos: [0.0, 0.06, 0.0],
    label: 'STANDARD MODEL · 1970s',
    summary: 'The quantum theory of all known particles and three of the four forces.',
    detail:
      'Assembled in the 1960s–70s, it predicted the W and Z bosons (found 1983), the top quark (1995) and the Higgs boson (2012). Its prediction of the electron’s magnetism matches measurement to about one part in a trillion. It leaves out gravity, dark matter and, in its original form, neutrino masses.',
  },
  {
    id: 'G1',
    tier: 0,
    st: false,
    onThread: false,
    pos: [-1.15, 0.06, 1.64],
    label: 'QUANTUM MECHANICS · 1925–',
    summary: 'At small scales nature comes in discrete amounts, described by probabilities.',
    detail:
      'Formulated in 1925–26 by Heisenberg, Schrödinger and others, it underlies chemistry, lasers and every transistor. Tests of entanglement, its strangest feature, won the 2022 Nobel Prize. String theory is built on it.',
  },
  {
    id: 'G2',
    tier: 0,
    st: false,
    onThread: false,
    pos: [1.15, 0.06, 1.64],
    label: 'SPECIAL RELATIVITY · 1905',
    summary: 'Space and time mix, and nothing outruns light.',
    detail:
      'Einstein, 1905. It is confirmed daily in particle accelerators. String theory is built to respect it: its consistency conditions come from demanding quantum mechanics and relativity at once.',
  },
  {
    id: 'G3',
    tier: 0,
    st: false,
    onThread: false,
    pos: [-1.88, 0.06, -0.68],
    label: 'GENERAL RELATIVITY · 1915',
    summary: 'Gravity is the curvature of spacetime.',
    detail:
      'It explains Mercury’s orbit, bends starlight, corrects GPS clocks, and predicted black holes and gravitational waves. It is classical: combined with quantum theory in the usual way, it stops making predictions near the Planck energy.',
  },
  {
    id: 'G5',
    tier: 0,
    st: false,
    onThread: false,
    pos: [1.88, 0.06, -0.68],
    label: 'HIGGS BOSON · 2012',
    summary: 'The last particle the Standard Model predicted, found at CERN.',
    detail:
      'The ATLAS and CMS experiments announced it on 4 July 2012, at about 125 GeV. Its field gives the W, Z, quarks and charged leptons their masses. No particle beyond the Standard Model has turned up at the LHC so far.',
  },
  {
    id: 'G6',
    tier: 0,
    st: false,
    onThread: false,
    pos: [-0.52, 0.06, -1.93],
    label: 'GRAVITATIONAL WAVES · 2015',
    summary: 'Ripples in spacetime, detected directly.',
    detail:
      'LIGO caught the first on 14 September 2015, from two merging black holes, and many more have followed. Their stretch-and-squeeze pattern is general relativity’s spin-2 pattern (Chapter 4). No individual graviton has been detected.',
  },
  {
    id: 'G7',
    tier: 0,
    st: false,
    onThread: false,
    pos: [0.52, 0.06, -1.93],
    label: 'BLACK HOLES · OBSERVED',
    summary: 'Black holes are real: we see their mergers, their shadows and stars orbiting them.',
    detail:
      'The evidence includes gravitational waves, Event Horizon Telescope images (M87* in 2019, Sagittarius A* in 2022) and decades of stellar orbits at our galaxy’s center. In 2025 the merger GW250114 confirmed, with high confidence, Hawking’s classical rule that total horizon area never shrinks. Their entropy has never been measured.',
  },
  {
    id: 'G8',
    tier: 0,
    st: false,
    onThread: false,
    pos: [-3.95, 0.06, 1.44],
    label: 'NO SUPERPARTNERS · LHC',
    tag: 'NULL RESULT',
    summary: 'No supersymmetric partner particle has been seen.',
    detail:
      'In simplified models, ATLAS and CMS exclude gluinos (the gluon’s partners) lighter than about 2.1–2.4 TeV and light-flavour squarks lighter than about 1.75 TeV. This rules out many, not all, models with light superpartners. Many string constructions are supersymmetric at very high energies, but string theory does not fix the energy at which superpartners would appear.',
  },
  {
    id: 'G9',
    tier: 0,
    st: false,
    onThread: false,
    pos: [-1.09, 0.06, 4.06],
    label: 'NO DEVIATION FROM 1/r² · ≥ 52 µm',
    tag: 'NULL RESULT',
    summary: 'Gravity still follows Newton’s inverse-square law down to 52 micrometres.',
    detail:
      'Torsion-balance experiments see no deviation, and collider searches find no sign of large extra dimensions. Hidden dimensions far smaller than this, as string theory usually assumes, remain untested.',
  },
  {
    id: 'G10',
    tier: 0,
    st: false,
    onThread: false,
    pos: [2.7, 0.06, 3.22],
    label: 'NO DIRECT SIGN OF STRINGS',
    tag: 'NULL RESULT',
    summary: 'No experiment has detected a string or confirmed a string-specific prediction.',
    detail:
      'If strings are near the Planck length, probing them directly needs about 10¹⁵ times the LHC’s energy (Chapter 10). Proposed indirect signs, such as cosmic superstrings, have been searched for and not found. Not seeing strings is expected if they are that small, so this is not a refutation either.',
  },
  {
    id: 'K1',
    tier: 0,
    st: false,
    onThread: false,
    crack: true,
    pos: [3.59, 0.06, 0.31],
    label: 'DARK MATTER · ≈ 84% OF MATTER',
    tag: 'CRACK',
    summary: 'Most matter is invisible and is not any known particle.',
    detail:
      'Galaxy rotation, gravitational lensing and the cosmic microwave background all point to it, and Planck data give it about 84% of all matter. What it is remains unknown; string constructions offer candidates, such as axion-like particles, but no unique prediction.',
  },
  {
    id: 'K2',
    tier: 0,
    st: false,
    onThread: false,
    crack: true,
    pos: [2.76, 0.06, -2.31],
    label: 'DARK ENERGY · ≈ 68% OF ENERGY',
    tag: 'CRACK',
    summary: 'The universe’s expansion is speeding up.',
    detail:
      'It was discovered with distant supernovae in 1998 (Nobel Prize 2011) and makes up about 68% of the universe’s energy. The simplest description, a cosmological constant, has a small value that no theory explains. Recent DESI survey data hint that it may change over time; this is not yet conclusive.',
  },
  {
    id: 'K3',
    tier: 0,
    st: false,
    onThread: false,
    crack: true,
    pos: [-3.12, 0.06, -1.8],
    label: 'NEUTRINO MASS · < 0.45 eV',
    tag: 'CRACK',
    summary: 'Neutrinos have mass, which the original Standard Model did not allow.',
    detail:
      'Neutrino oscillations, established from 1998 (Nobel Prize 2015), require at least two neutrinos to have mass. KATRIN caps the electron neutrino’s effective mass at 0.45 eV, under a millionth of the electron’s. How neutrinos get their mass is unknown.',
  },
  {
    id: 'K4',
    tier: 0,
    st: false,
    onThread: false,
    crack: true,
    pos: [-1.23, 0.06, -3.38],
    label: 'QUANTUM GRAVITY · NO TESTED THEORY',
    tag: 'CRACK',
    summary: 'No tested quantum theory of gravity exists.',
    detail:
      'General relativity plus quantum field theory works at everyday energies but loses predictive power near 10¹⁹ GeV, inside black holes and at the Big Bang (Chapter 4). There are several candidate theories, string theory among them, and none has experimental support.',
  },

  // ── Zone II · tier 1 · ◑ DERIVED (8) ──
  {
    id: 'D1',
    tier: 1,
    st: true,
    onThread: true,
    pos: [-1.3, 1.35, 2.25],
    label: '10 DIMENSIONS',
    sub: '26 FOR THE BOSONIC STRING',
    summary: 'Superstrings in their standard form are consistent only in ten spacetime dimensions (the purely bosonic string needs 26).',
    detail:
      'A classical string can move in any number of dimensions, but demanding quantum mechanics and relativity together singles out one number. In any other dimension, quantum effects either break a symmetry the theory needs or produce negative probabilities. This is a derived requirement, not a measured fact about our universe (Chapter 5).',
  },
  {
    id: 'D2',
    tier: 1,
    st: true,
    onThread: true,
    pos: [0.97, 1.53, 2.41],
    label: 'ANOMALIES CANCEL · 1984',
    sub: 'SO(32) · E₈×E₈ · BOTH OF DIMENSION 496',
    summary: 'A threatened quantum inconsistency cancels, but only for special symmetry groups.',
    detail:
      'In 1984 Green and Schwarz showed that the quantum anomaly threatening ten-dimensional supersymmetric theories with gravity cancels if the force-symmetry group is SO(32) or E₈ × E₈. Both groups have dimension 496. The SO(32) case fits type I superstrings; the heterotic string (1985) realized both groups, giving the first string theory with E₈ × E₈. The result revived the field.',
  },
  {
    id: 'D3',
    tier: 1,
    st: true,
    onThread: true,
    pos: [2.5, 1.72, 0.72],
    label: 'GRAVITON · MASSLESS SPIN 2',
    summary: 'Every closed-string theory contains a massless spin-2 particle that behaves as the graviton.',
    detail:
      'Nobody put it in; consistency forces it (Yoneya; Scherk and Schwarz, 1974). At low energies it interacts the way general relativity requires. Gravitons themselves have never been detected (Chapter 4).',
  },
  {
    id: 'D4',
    tier: 1,
    st: true,
    onThread: true,
    pos: [2.1, 1.9, -1.53],
    label: 'T-DUALITY · R ↔ α′/R',
    summary: 'A string on a circle of radius R has the same physics as on radius α′/R.',
    detail:
      'Momentum and winding trade places, so two different geometries describe one physics (Chapter 8). The equivalence holds at every order of string perturbation theory and is believed to hold completely.',
  },
  {
    id: 'D5',
    tier: 1,
    st: true,
    onThread: true,
    pos: [0.09, 2.08, -2.6],
    label: 'D-BRANES · 1995',
    summary: 'The surfaces where open strings end are real, dynamical objects in the theory.',
    detail:
      'Introduced in 1989, they came to the fore in 1995, when Polchinski showed that D-branes carry the charges string dualities require. They made black-hole counting and AdS/CFT possible. Braneworld scenarios built on them are speculative (Chapter 7).',
  },
  {
    id: 'D6',
    tier: 1,
    st: false,
    onThread: false,
    pos: [-3.25, 1.95, -1.31],
    label: 'BLACK-HOLE ENTROPY · S = A/4G',
    tag: 'GR + QUANTUM FIELDS · NOT STRING THEORY',
    summary: 'A black hole’s entropy is one quarter of its horizon area, in Planck units.',
    detail:
      'Bekenstein argued that black holes carry entropy (1972–73), and Hawking’s radiation calculation (1974–75) fixed the ¼. The result comes from general relativity plus quantum fields, not string theory, and it has never been measured. A solar-mass black hole would hold about 10⁷⁷ units.',
    note: 'Derived in ordinary GR + quantum field theory, not in string theory. Not measured.',
  },
  {
    id: 'D7',
    tier: 1,
    st: true,
    onThread: true,
    pos: [-1.99, 2.27, -1.67],
    label: 'MICROSTATES COUNTED · 1996',
    summary: 'For special black holes, string theory counts the states behind S = A/4G.',
    detail:
      'Strominger and Vafa counted bound states of strings and branes for extremal, supersymmetric black holes in five dimensions. For large charges the count matched Bekenstein–Hawking, ¼ included, and later work extended it to near-extremal cases and even to Hawking radiation rates. Ordinary astrophysical black holes are not covered.',
  },
  {
    id: 'D8',
    tier: 1,
    st: true,
    onThread: true,
    pos: [-2.54, 2.45, 0.54],
    label: 'MIRROR SYMMETRY',
    sub: '317 206 375 CURVES · PREDICTED 1991',
    summary: 'Physics predicted answers to old geometry problems, and mathematicians later established them.',
    detail:
      'Pairs of different Calabi–Yau shapes give identical string physics. In 1991 Candelas and colleagues used this to predict 317,206,375 degree-three curves on the quintic threefold. A mathematical computation first disagreed until an error was found in its computer code, and mirror formulas became theorems in 1996–2000. This confirmed mathematics, not nature.',
  },

  // ── Zone II · tier 2 · ◌ CONJECTURED (3) ──
  {
    id: 'C1',
    tier: 2,
    st: true,
    onThread: true,
    pos: [-0.96, 2.95, 1.98],
    label: 'AdS/CFT · 1997',
    summary: 'String theory in anti-de Sitter space equals a quantum field theory without gravity on its boundary.',
    detail:
      'Maldacena’s 1997 conjecture, in one of the most-cited papers in high-energy physics, has passed many demanding mathematical checks but is not proven in general. If it holds, it defines a quantum theory of gravity, though in a universe shaped unlike ours. It already supplies approximate tools for strongly interacting matter such as quark–gluon plasma.',
  },
  {
    id: 'C2',
    tier: 2,
    st: true,
    onThread: true,
    pos: [1.07, 3.35, 1.92],
    label: 'S-DUALITY · DUALITY WEB',
    summary: 'Strong coupling in one string theory matches weak coupling in another, or in the same theory.',
    detail:
      'The strongest evidence comes from supersymmetry-protected states whose counts match on both sides (Sen 1994; Witten 1995). T-duality is exact in perturbation theory, while the S-dualities remain conjectures, though heavily supported (Chapters 8–9).',
  },
  {
    id: 'C3',
    tier: 2,
    st: true,
    onThread: true,
    pos: [2.19, 3.75, 0.23],
    label: 'M-THEORY · 1995',
    summary: 'The five superstring theories look like limits of one larger theory, which in yet another limit is eleven-dimensional.',
    detail:
      'Witten proposed it in 1995 from the web of dualities, and at low energies it becomes 11-dimensional supergravity. Its existence is strongly supported, but its complete formulation is unknown (Chapter 9).',
  },

  // ── Zone III · tier 3 · ○ SPECULATIVE (9) ──
  {
    id: 'S1',
    tier: 3,
    st: true,
    onThread: true,
    pos: [1.23, 4.5, -1.03],
    label: 'OUR UNIVERSE?',
    summary: 'Does string theory describe our universe? Unknown.',
    detail:
      'String theory contains gravity and forces like ours, but containing them is not the same as predicting their details. Whether nature uses it is the open question this whole site circles.',
  },
  {
    id: 'S2',
    tier: 3,
    st: true,
    onThread: false,
    pos: [1.09, 4.7, 3.01],
    label: 'WHICH HIDDEN SHAPE?',
    summary: 'If string theory is right, which compactification is ours? Unknown.',
    detail:
      'Some constructions reproduce the Standard Model’s list of particles (plus superpartners), for example heterotic models from 2005. None has been shown to reproduce all its measured masses and strengths (Chapter 6).',
  },
  {
    id: 'S3',
    tier: 3,
    st: false,
    onThread: false,
    pos: [-3.12, 4.6, 1.8],
    label: 'SUPERSYMMETRY WITHIN REACH?',
    summary: 'Superpartners at accessible energies were hoped for, and none has been found.',
    detail:
      'Many physicists expected superpartners near the TeV scale, partly to explain why the Higgs boson is so light, but LHC searches have found none (see the ground). String theory remains consistent with much heavier superpartners.',
  },
  {
    id: 'S4',
    tier: 3,
    st: true,
    onThread: false,
    pos: [2.42, 5.2, -1.4],
    label: 'LANDSCAPE · ~10⁵⁰⁰',
    summary: 'The equations appear to allow an enormous number of possible vacua, each with different low-energy physics.',
    detail:
      'The often-quoted ~10⁵⁰⁰ is a rough 2003–04 estimate of flux vacua (Douglas; Ashok and Douglas), and a 2015 estimate for a single geometry gave ~10²⁷²⁰⁰⁰. These count possible solutions, not universes that exist. If so many are allowed, unique predictions become hard, and critics call this a loss of predictive power.',
  },
  {
    id: 'S5',
    tier: 3,
    st: true,
    onThread: false,
    pos: [0.59, 5.7, -3.35],
    label: 'MULTIVERSE?',
    summary: 'Perhaps many vacua are realized in different regions of an inflating cosmos.',
    detail:
      'Some use this idea to explain why dark energy is small: we could only live where it is. Weinberg made a related estimate in 1987, before dark energy’s 1998 discovery. Others see this anthropic reasoning as giving up on explanation, and no observation tests it yet.',
  },
  {
    id: 'S6',
    tier: 3,
    st: true,
    onThread: false,
    pos: [-1.54, 5.4, -1.84],
    label: 'DE SITTER VACUA?',
    summary: 'Can string theory produce a universe with positive dark energy, like ours? Debated.',
    detail:
      'The KKLT construction (2003) proposed how, while swampland conjectures (2018) question whether such vacua exist at all. The dispute is technical and live, and evidence that dark energy changes over time would reshape it.',
  },
  {
    id: 'S7',
    tier: 3,
    st: true,
    onThread: false,
    pos: [1.04, 5.9, 0.6],
    label: 'M-THEORY, FULLY?',
    summary: 'Its complete formulation is unknown.',
    detail:
      'M-theory is known through its limits: the five string theories, 11-dimensional supergravity, and matrix models (1996) for some backgrounds. What its fundamental ingredients are in general is not known.',
  },
  {
    id: 'S8',
    tier: 3,
    st: false,
    onThread: false,
    pos: [-4.33, 5.0, -0.76],
    label: 'OTHER ROUTES',
    summary: 'String theory is not the only candidate for quantum gravity.',
    detail:
      'Loop quantum gravity (from 1986), asymptotic safety (proposed 1979), causal sets (1987) and causal dynamical triangulations (1998) take different routes. Each has results of its own and open problems, and none has experimental confirmation.',
  },
  {
    id: 'S9',
    tier: 3,
    st: true,
    onThread: false,
    pos: [-0.52, 5.8, 2.95],
    label: 'HOW TO TEST IT?',
    sub: 'IS IT TESTABLE? · A LIVE DEBATE',
    summary: 'No agreed decisive test exists yet.',
    detail:
      'Possible clues include cosmic superstrings, signs of extra dimensions or superpartners, and patterns in the early universe, but none is unique to strings. Critics such as Smolin, Woit, and Ellis and Silk warn against accepting untested theories. Some defenders argue that consistency and explanatory success count as evidence (Dawid), a view that is itself contested.',
  },
]

export const CLAIM_INDEX: Record<string, number> = Object.fromEntries(CLAIMS.map((c, i) => [c.id, i]))
export const claimById = (id: string) => CLAIMS[CLAIM_INDEX[id]]
export const TIER_OF: Chip[] = ['observed', 'derived', 'conjectured', 'speculative']
export const chipOf = (c: Claim): Chip => TIER_OF[c.tier]
export const ST_TOTAL = CLAIMS.filter((c) => c.st).length // 17
export const CLAIM_TOTAL = CLAIMS.length // 34

/** Tier guide labels (mono, left end of each ring). */
export const TIER_LABEL = ['● MEASURED', '◑ DERIVED · FOLLOWS FROM THE MATH', '◌ CONJECTURED · STRONG EVIDENCE, UNPROVEN', '○ SPECULATIVE · POSSIBLE, UNTESTED']

// ── Referee's Bench: nine claims, fixed order (Lab § Referee claims) ──
export interface RefereeClaim {
  text: string
  tier: Tier
  node: string
  reason: string
}
export const REFEREE: RefereeClaim[] = [
  { text: 'Neutrinos have mass.', tier: 0, node: 'K3', reason: 'Oscillation experiments since 1998 require it. The original Standard Model had massless neutrinos.' },
  { text: 'No superpartner has turned up at the LHC.', tier: 0, node: 'G8', reason: 'A null result is a measurement too. It rules out many, not all, supersymmetric models.' },
  {
    text: 'Superstrings are consistent only in ten spacetime dimensions.',
    tier: 1,
    node: 'D1',
    reason: 'It follows from the theory’s equations. Whether our universe has extra dimensions is unknown.',
  },
  { text: 'Every closed-string theory contains a graviton.', tier: 1, node: 'D3', reason: 'Forced by consistency and checked many ways. No graviton has ever been detected.' },
  {
    text: 'String theory counts the microstates behind the entropy of certain black holes.',
    tier: 1,
    node: 'D7',
    reason: 'A calculation for idealized 5D supersymmetric black holes. Black holes in our sky are not covered.',
  },
  {
    text: 'Gravity in anti-de Sitter space equals a quantum theory on its boundary.',
    tier: 2,
    node: 'C1',
    reason: 'Passed many demanding checks, still unproven. Our universe is not anti-de Sitter.',
  },
  { text: 'The five superstring theories are limits of one M-theory.', tier: 2, node: 'C3', reason: 'Dualities strongly support it. Nobody has M-theory’s complete formulation.' },
  { text: 'Our universe has six tiny hidden dimensions.', tier: 3, node: 'S2', reason: 'Needed only if superstring theory describes our world. None has been detected.' },
  {
    text: 'We live in one of ~10⁵⁰⁰ universes.',
    tier: 3,
    node: 'S5',
    reason: '10⁵⁰⁰ roughly counts possible solutions, not existing universes. That many are realized is untested.',
  },
]

export const DETENT_COPY = [
  'Measured only. Superb physics, visible cracks, and no strings anywhere.',
  'Add what follows from the math. The Thread returns: derived, but untested.',
  'Add strong conjectures: AdS/CFT, S-duality, M-theory. Heavily checked, not proven.',
  'Admit possible scenarios too: the landscape, a multiverse, which shape is ours.',
]
export const DETENT_NAME = ['● Measured only', '◑ + Derived', '◌ + Conjectured', '○ + Speculative']
export const RIM_LABEL = ['EVIDENCE REQUIRED · ● MEASURED ONLY', 'EVIDENCE REQUIRED · ◑ + DERIVED', 'EVIDENCE REQUIRED · ◌ + CONJECTURED', 'EVIDENCE REQUIRED · ○ ANY SCENARIO']

// ── Further reading (Epilogue) ──
export interface Reading {
  author: string
  title: string
  italic?: boolean
  pub: string
  note?: string
  href?: string
}
export const READING: { group: string; items: Reading[] }[] = [
  {
    group: 'Start here',
    items: [
      { author: 'Brian Greene', title: 'The Elegant Universe', italic: true, pub: 'W. W. Norton, 1999', note: 'The classic enthusiastic tour by an insider.' },
      { author: 'Juan Maldacena', title: '“The Illusion of Gravity”', pub: 'Scientific American 293(5), 2005', note: 'AdS/CFT explained by its author.' },
      { author: 'Joseph Conlon', title: 'Why String Theory?', italic: true, pub: 'CRC Press, 2016', note: 'Why people work on an untested theory.' },
      { author: 'Lisa Randall', title: 'Warped Passages', italic: true, pub: 'Ecco, 2005', note: 'Branes, with care about what is speculative.' },
    ],
  },
  {
    group: 'The critics',
    items: [
      { author: 'Lee Smolin', title: 'The Trouble with Physics', italic: true, pub: 'Houghton Mifflin, 2006' },
      { author: 'Peter Woit', title: 'Not Even Wrong', italic: true, pub: 'Jonathan Cape / Basic Books, 2006' },
      { author: 'Sabine Hossenfelder', title: 'Lost in Math', italic: true, pub: 'Basic Books, 2018' },
      { author: 'George Ellis & Joe Silk', title: '“Defend the integrity of physics”', pub: 'Nature 516, 321–323, 2014' },
    ],
  },
  {
    group: 'The big debates',
    items: [
      { author: 'Leonard Susskind', title: 'The Cosmic Landscape', italic: true, pub: 'Little, Brown, 2005', note: 'The landscape, argued by a proponent.' },
      { author: 'Richard Dawid', title: 'String Theory and the Scientific Method', italic: true, pub: 'Cambridge University Press, 2013', note: 'A philosopher on theories without experiments.' },
      { author: 'Carlo Rovelli', title: 'Reality Is Not What It Seems', italic: true, pub: 'English edition 2016', note: 'Quantum gravity from the loop side.' },
    ],
  },
  {
    group: 'Going technical',
    items: [
      { author: 'Barton Zwiebach', title: 'A First Course in String Theory', italic: true, pub: 'Cambridge University Press, 2nd ed. 2009', note: 'Undergraduate level.' },
      { author: 'David Tong', title: 'Lectures on String Theory', italic: true, pub: 'arXiv:0908.0333, 2009', note: 'Free, graduate level, very clear.', href: 'https://arxiv.org/abs/0908.0333' },
      { author: 'Joseph Polchinski', title: 'String Theory, Vols. 1–2', italic: true, pub: 'Cambridge University Press, 1998' },
      { author: 'K. Becker, M. Becker & J. H. Schwarz', title: 'String Theory and M-Theory', italic: true, pub: 'Cambridge University Press, 2007' },
    ],
  },
]
