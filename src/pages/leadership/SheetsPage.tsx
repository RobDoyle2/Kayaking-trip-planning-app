import { CheckField, TextAreaField, TextField, TimeField } from '../../components/forms/fields';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { ExportBar } from '../../components/forms/ExportBar';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { ExternalLink, Notice, PageHeader } from '../../components/ui';
import {
  briefingText,
  buildBriefing,
  missingFields,
  sectionProgress,
  sheetsMeta,
  sheetsSections,
  sheetsSource,
  type SheetsField,
  type SheetsValues,
} from '../../content/leadership/sheets';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';

function FieldView({ field, values, set }: { field: SheetsField; values: SheetsValues; set: (id: string, v: string | boolean) => void }) {
  const id = `sheets-${field.id}`;
  const text = typeof values[field.id] === 'string' ? (values[field.id] as string) : '';
  switch (field.kind) {
    case 'check':
      return <CheckField id={id} label={field.label} checked={values[field.id] === true} onChange={(c) => set(field.id, c)} />;
    case 'longtext':
      return <TextAreaField id={id} label={field.label} hint={field.hint} needed={field.required} value={text} onChange={(v) => set(field.id, v)} />;
    case 'time':
      return <TimeField id={id} label={field.label} hint={field.hint} needed={field.required} value={text} onChange={(v) => set(field.id, v)} />;
    default:
      return <TextField id={id} label={field.label} hint={field.hint} needed={field.required} value={text} onChange={(v) => set(field.id, v)} />;
  }
}

/**
 * The SHEETS briefing: fill in the six sections, see the briefing build up, print or download it.
 * It is a template, not an AI: the briefing contains only what the leader typed, with blanks marked.
 */
export function SheetsPage() {
  useDocumentTitle('SHEETS briefing');
  const { value, setValue, state, clear } = usePersisted<SheetsValues>('sheets-briefing', {});
  const set = (id: string, v: string | boolean) => setValue((prev) => ({ ...prev, [id]: v }));
  const missing = missingFields(value);
  const briefing = buildBriefing(value);
  const text = briefingText(value);

  return (
    <div className="container page">
      <PageHeader
        title="SHEETS briefing"
        icon="leadership"
        intro="Fill in each section, and your briefing builds up below. Print it, copy it or download it."
        crumb={{ label: 'Leadership', to: '/leadership' }}
      />

      <div className="no-print">
        <Notice title="Where the sections come from">
          The six headings and what to cover under each follow the SHEETS page on the saturnbull sea kayaking blog (
          <ExternalLink href={sheetsSource.url}>saturnbull.co.uk/sheets</ExternalLink>), paraphrased. The page does not say what the letters stand for, so
          this app does not either. ECSKC has not yet confirmed that it uses this version, and permission to reuse the
          wording has not been settled. Trip details are typed here for now; trip planning (Stage 3) will fill them in for you.
        </Notice>
        <SaveStatus state={state} />
        <p className="missing-summary" role="status">
          {missing.length === 0
            ? 'Every required field is filled in.'
            : `${missing.length} required ${missing.length === 1 ? 'field is' : 'fields are'} still to fill in. They are marked (needed).`}
        </p>

        <form className="sheets-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <fieldset className="group">
            <legend>Trip details</legend>
            {sheetsMeta.map((f) => (
              <FieldView key={f.id} field={f} values={value} set={set} />
            ))}
          </fieldset>

          {sheetsSections.map((section) => {
            const progress = sectionProgress(section, value);
            return (
              <fieldset key={section.id} className="group">
                <legend>
                  {section.letter}: {section.heading}
                </legend>
                <p className="muted section-progress">
                  {progress.done} of {progress.total} done
                </p>
                <p className="prompts-title">What to cover</p>
                <ul className="plain-list prompts">
                  {section.prompts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {section.fields.map((f) => (
                  <FieldView key={f.id} field={f} values={value} set={set} />
                ))}
              </fieldset>
            );
          })}
        </form>
      </div>

      <section className="briefing" aria-labelledby="briefing-title">
        <h2 id="briefing-title">Your briefing</h2>
        <dl className="briefing__meta">
          {briefing.meta.map((l) => (
            <div key={l.label} className={l.gap ? 'is-gap' : undefined}>
              <dt>{l.label}</dt>
              <dd>{l.value}</dd>
            </div>
          ))}
        </dl>
        {briefing.sections.map((s) => (
          <div key={`${s.letter}-${s.heading}`} className="briefing__section">
            <h3>
              {s.letter}: {s.heading}
            </h3>
            <ul className="briefing__lines">
              {s.lines.map((l) => (
                <li key={l.label} className={l.gap ? 'is-gap' : undefined}>
                  <span className="briefing__label">{l.label}:</span> {l.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="briefing__foot">
          {missing.length === 0 ? 'All required fields are filled in.' : `Still to fill in (${missing.length}): ${missing.map((m) => m.label).join('; ')}.`}
        </p>
        <p className="briefing__foot muted">
          Framework: {sheetsSource.title}, {sheetsSource.url}. A planning aid, not a substitute for the leader’s judgement.
        </p>
      </section>

      <ExportBar title={value.tripName ? `SHEETS briefing ${String(value.tripName)}` : 'SHEETS briefing'} text={text} />
      <div className="no-print danger-zone">
        <ConfirmButton label="Clear this briefing" question="Clear every entry in this briefing?" confirmLabel="Yes, clear it" onConfirm={clear} />
      </div>
    </div>
  );
}
