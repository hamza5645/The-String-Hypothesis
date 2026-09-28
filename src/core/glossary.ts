// Glossary registry: each chapter contributes src/chapters/<chapter>/glossary.ts with
//   export default { 'worldsheet': { term: 'Worldsheet', def: '…', chapter: 'worldsheet' } } satisfies GlossaryEntries
// Keys are kebab-case ids used by <Term id="…">.

export interface GlossaryEntry {
  term: string
  /** ≤ 30 words, plain language. */
  def: string
  /** Chapter id where it is introduced (for "introduced in …" links). */
  chapter?: string
}
export type GlossaryEntries = Record<string, GlossaryEntry>

const modules = import.meta.glob<{ default: GlossaryEntries }>('../chapters/*/glossary.ts', { eager: true })

export const GLOSSARY: GlossaryEntries = {}
for (const m of Object.values(modules)) Object.assign(GLOSSARY, m.default)

export const glossaryList = () =>
  Object.entries(GLOSSARY)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => a.term.localeCompare(b.term))
