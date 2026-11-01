import { CheckField, TextAreaField, TextField } from '../../components/forms/fields';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { ExportBar } from '../../components/forms/ExportBar';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { SourceList } from '../../components/forms/SourceList';
import { Button, Notice, PageHeader } from '../../components/ui';
import { sourceShort } from '../../content/leadership/sources';
import {
  MAX_RISK_ROWS,
  addRow,
  hazardPrompts,
  newRow,
  removeRow,
  riskGaps,
  riskHeaderFields,
  riskText,
  updateRow,
  type HazardPrompt,
  type RiskAssessment,
  type RiskRow,
} from '../../content/leadership/risk';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';

const empty: RiskAssessment = { header: {}, rows: [] };

function newId(): string {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function RiskPage() {
  useDocumentTitle('Risk assessment');
  const { value, setValue, state, clear } = usePersisted<RiskAssessment>('risk-assessment', empty);
  const gaps = riskGaps(value);
  const text = riskText(value);
  const full = value.rows.length >= MAX_RISK_ROWS;

  const patch = (id: string, change: Partial<Omit<RiskRow, 'id'>>) => setValue((prev) => ({ ...prev, rows: updateRow(prev.rows, id, change) }));

  return (
    <div className="container page">
      <PageHeader
        title="Risk assessment"
        icon="leadership"
        intro="List the hazards for your trip and what you will do about each. The prompts below each name where they come from."
        crumb={{ label: 'Leadership', to: '/leadership' }}
      />

      <div className="no-print">
        <Notice tone="warning" title="A generic layout, not the club's template">
          ECSKC has not supplied the risk assessment template it uses, so this is a plain layout. It has no scoring, because none of the supplied
          documents defines a scoring method. Copy your answers into the club's own form if it has one.
        </Notice>
        <SaveStatus state={state} />

        <section className="block-tight" aria-labelledby="prompts-title">
          <h2 id="prompts-title">Hazards to consider</h2>
          <ul className="prompt-list">
            {hazardPrompts.map((p: HazardPrompt) => {
              const added = value.rows.some((r) => r.hazard === p.hazard);
              return (
                <li key={p.id} className="prompt-item">
                  <div>
                    <p className="prompt-item__title">{p.hazard}</p>
                    <p>{p.why}</p>
                    <p className="check__meta">
                      Source: {sourceShort(p.source)}
                      {p.where ? `, ${p.where}` : ''}.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    disabled={added || full}
                    aria-label={added ? `${p.hazard} is already on the form` : `Add ${p.hazard} to the form`}
                    onClick={() => setValue((prev) => ({ ...prev, rows: addRow(prev.rows, newRow(newId(), p.hazard)) }))}
                  >
                    {added ? 'On the form' : 'Add to the form'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <fieldset className="group">
            <legend>About this assessment</legend>
            {riskHeaderFields.map((f) => (
              <TextField
                key={f.id}
                id={`risk-${f.id}`}
                label={f.label}
                value={value.header[f.id] ?? ''}
                onChange={(v) => setValue((prev) => ({ ...prev, header: { ...prev.header, [f.id]: v } }))}
              />
            ))}
          </fieldset>

          <h2>Hazards on your form</h2>
          {value.rows.length === 0 && <p className="muted">None yet. Add one from the prompts above, or start a blank one.</p>}
          {value.rows.map((row, i) => (
            <fieldset key={row.id} className="group risk-row">
              <legend>Hazard {i + 1}</legend>
              <TextField id={`risk-${row.id}-hazard`} label="Hazard" value={row.hazard} onChange={(v) => patch(row.id, { hazard: v })} />
              <TextAreaField id={`risk-${row.id}-harmed`} label="Who or what could be harmed" value={row.harmed} onChange={(v) => patch(row.id, { harmed: v })} />
              <TextAreaField id={`risk-${row.id}-controls`} label="Controls already in place" needed value={row.controls} onChange={(v) => patch(row.id, { controls: v })} />
              <TextAreaField id={`risk-${row.id}-further`} label="Further action needed" value={row.further} onChange={(v) => patch(row.id, { further: v })} />
              <TextField id={`risk-${row.id}-owner`} label="Who is responsible" value={row.owner} onChange={(v) => patch(row.id, { owner: v })} />
              <CheckField id={`risk-${row.id}-done`} label="Further action done" checked={row.done} onChange={(c) => patch(row.id, { done: c })} />
              <Button
                variant="secondary"
                size="small"
                aria-label={`Remove hazard ${i + 1}`}
                onClick={() => setValue((prev) => ({ ...prev, rows: removeRow(prev.rows, row.id) }))}
              >
                Remove this hazard
              </Button>
            </fieldset>
          ))}
          <p>
            <Button variant="secondary" disabled={full} onClick={() => setValue((prev) => ({ ...prev, rows: addRow(prev.rows, newRow(newId())) }))}>
              Add a blank hazard
            </Button>
            {full && <span className="muted"> The form holds at most {MAX_RISK_ROWS} hazards.</span>}
          </p>
        </form>
      </div>

      <section className="briefing" aria-labelledby="gaps-title">
        <h2 id="gaps-title">{gaps.length === 0 ? 'No gaps found' : `Still to fill in (${gaps.length})`}</h2>
        {gaps.length > 0 && (
          <ul className="plain-list">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
        <div className="print-only">
          <pre className="print-text">{text}</pre>
        </div>
      </section>

      <ExportBar title="Risk assessment" text={text} />
      <div className="no-print danger-zone">
        <ConfirmButton label="Clear this assessment" question="Clear everything on this assessment?" confirmLabel="Yes, clear it" onConfirm={clear} />
      </div>

      <SourceList ids={hazardPrompts.map((h) => h.source)} />
    </div>
  );
}
