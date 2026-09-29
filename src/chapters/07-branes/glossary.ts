import type { GlossaryEntries } from '@/core/glossary'

export default {
  'd-brane': {
    term: 'D-brane',
    def: 'An object on which open strings can end ("D" for Dirichlet). A Dp-brane has p space dimensions. It has mass, carries charge, and can move.',
    chapter: 'branes',
  },
  'dirichlet-boundary-condition': {
    term: 'Dirichlet boundary condition',
    def: 'The rule that pins a string’s endpoint at a fixed position in some direction. Its partner, the Neumann condition, lets the end slide freely.',
    chapter: 'branes',
  },
  bulk: {
    term: 'Bulk',
    def: 'The full higher-dimensional space surrounding the branes. Closed strings, including gravitons, can travel anywhere in it.',
    chapter: 'branes',
  },
  worldvolume: {
    term: 'Worldvolume',
    def: 'The region of spacetime a brane sweeps out: its own space dimensions plus time. Fields from open strings on the brane live there.',
    chapter: 'branes',
  },
  'ramond-ramond-charge': {
    term: 'Ramond–Ramond charge',
    def: 'A kind of charge carried by D-branes (not by fundamental strings) under fields that come from closed-string vibrations. Polchinski identified D-branes as its sources (1995).',
    chapter: 'branes',
  },
  'chan-paton-label': {
    term: 'Chan–Paton label',
    def: 'The tag recording which brane each end of an open string sits on. With N branes there are N² kinds of oriented open string.',
    chapter: 'branes',
  },
  'gauge-symmetry': {
    term: 'Gauge symmetry',
    def: 'The symmetry behind a force. The group fixes how many force carriers there are: U(1) has one, like the photon; U(N) has N².',
    chapter: 'branes',
  },
  'higgs-mechanism': {
    term: 'Higgs mechanism',
    def: 'How force carriers gain mass when a field takes a nonzero value everywhere. For branes, that value is their separation.',
    chapter: 'branes',
  },
  // braneworld (Ch. 5), duality (Ch. 8), graviton (Ch. 4), open/closed string (Ch. 3) are referenced, not redefined.
} satisfies GlossaryEntries
