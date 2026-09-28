export type StatusKind = 'observed' | 'derived' | 'conjectured' | 'speculative' | 'analogy'

export const STATUS_INFO: Record<StatusKind, { label: string; meaning: string }> = {
  observed: {
    label: 'Observed',
    meaning: 'Experimentally established. Measured and confirmed in nature.',
  },
  derived: {
    label: 'Derived in theory',
    meaning: 'A mathematical result within string theory. It follows from the equations but has not been tested in nature.',
  },
  conjectured: {
    label: 'Conjectured',
    meaning: 'Backed by strong theoretical evidence, but not proven.',
  },
  speculative: {
    label: 'Speculative',
    meaning: 'A possible scenario or interpretation. Neither established nor ruled out.',
  },
  analogy: {
    label: 'Analogy',
    meaning: 'The picture is a metaphor or cartoon, not literal (often not to scale).',
  },
}

/** Epistemic status chip. Encodes status in form (glyph) as well as color. */
export function Status({ kind, compact = false }: { kind: StatusKind; compact?: boolean }) {
  const info = STATUS_INFO[kind]
  return (
    <span className={`status status--${kind}${compact ? ' status--compact' : ''}`} title={info.meaning} data-ui>
      <i className="status__mark" aria-hidden="true" />
      <span className="status__label">{info.label}</span>
      <span className="sr-only">: {info.meaning}</span>
    </span>
  )
}

export function StatusLegend({ kinds = ['observed', 'derived', 'conjectured', 'speculative', 'analogy'] }: { kinds?: StatusKind[] }) {
  return (
    <dl className="status-legend">
      {kinds.map((k) => (
        <div key={k} className="status-legend__row">
          <dt>
            <Status kind={k} />
          </dt>
          <dd>{STATUS_INFO[k].meaning}</dd>
        </div>
      ))}
    </dl>
  )
}
