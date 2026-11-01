import { CheckField, TextAreaField, TextField } from '../../components/forms/fields';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { ExportBar } from '../../components/forms/ExportBar';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { SourceList } from '../../components/forms/SourceList';
import { Button, Notice, PageHeader } from '../../components/ui';
import { ratings } from '../../content/leadership/review';
import {
  MAX_ACTIONS,
  addAction,
  boxLabel,
  emptyPlan,
  newAction,
  noteBoxes,
  planAreas,
  planText,
  removeAction,
  setNote,
  setRating,
  summarise,
  updateAction,
  type DevelopmentPlan,
} from '../../content/training/plan';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';
import { Link } from '../../router/Router';

const newId = () => `a${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 3).toString(36)}`;

export function DevelopmentPlanPage() {
  useDocumentTitle('Skills development plan');
  const { value, setValue, state, clear } = usePersisted<DevelopmentPlan>('development-plan', emptyPlan);
  const s = summarise(value);
  const text = planText(value);
  const full = value.actions.length >= MAX_ACTIONS;

  return (
    <div className="container page">
      <PageHeader
        title="Skills development plan"
        icon="training"
        intro="Rate yourself, note what to work on, and list the actions. It stays on this device."
        crumb={{ label: 'Training and Skills', to: '/training' }}
      />

      <div className="no-print">
        <Notice tone="warning" title="Your own self-assessment, not approved by the club">
          The lines and ratings follow the Sea Kayak Leader Skills Checklist from British Canoeing. Nobody assesses what you enter here, and it does not say whether you are
          ready to lead. A course provider or assessor decides that. See the <Link to="/training/guidance">training guidance</Link>.
        </Notice>
        <SaveStatus state={state} />
        <p className="missing-summary" role="status">
          {s.rated} of {s.total} rated. Strong: {s.strong}. Competent: {s.competent}. Develop: {s.develop}.
        </p>

        <form onSubmit={(e) => e.preventDefault()} noValidate>
          {planAreas.map((area) => (
            <fieldset key={area.id} className="group">
              <legend>{area.title}</legend>
              {area.items.map((item) => (
                <div key={item.id} className="field field--inline">
                  <label className="field__label" htmlFor={`plan-${item.id}`}>
                    {item.label}
                  </label>
                  <select
                    id={`plan-${item.id}`}
                    className="input input--short"
                    value={value.ratings[item.id] ?? ''}
                    onChange={(e) => setValue((prev) => setRating(prev, item.id, e.target.value))}
                  >
                    <option value="">Not rated</option>
                    {ratings.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </fieldset>
          ))}

          <fieldset className="group">
            <legend>Notes and action points</legend>
            {noteBoxes.map((b) => (
              <TextAreaField
                key={b.id}
                id={`note-${b.id}`}
                label={b.label}
                hint={b.hint}
                value={value.notes[b.id] ?? ''}
                onChange={(v) => setValue((prev) => setNote(prev, b.id, v))}
              />
            ))}
          </fieldset>

          <fieldset className="group">
            <legend>Action list ({value.actions.filter((a) => !a.done).length} open)</legend>
            {value.actions.length === 0 && <p className="muted">No actions yet.</p>}
            {value.actions.map((a, i) => (
              <div key={a.id} className="stop-row">
                <p className="stop-row__title">Action {i + 1}</p>
                <TextField
                  id={`act-${a.id}-text`}
                  label={`Action ${i + 1}`}
                  value={a.text}
                  onChange={(v) => setValue((prev) => ({ ...prev, actions: updateAction(prev.actions, a.id, { text: v }) }))}
                />
                <div className="field">
                  <label className="field__label" htmlFor={`act-${a.id}-area`}>
                    Action {i + 1} area
                  </label>
                  <select
                    id={`act-${a.id}-area`}
                    className="input input--short"
                    value={a.area}
                    onChange={(e) => setValue((prev) => ({ ...prev, actions: updateAction(prev.actions, a.id, { area: e.target.value }) }))}
                  >
                    <option value="">No area</option>
                    {noteBoxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField
                  id={`act-${a.id}-when`}
                  label={`Action ${i + 1} by when`}
                  hint="Free text, for example “before May”."
                  value={a.when}
                  onChange={(v) => setValue((prev) => ({ ...prev, actions: updateAction(prev.actions, a.id, { when: v }) }))}
                />
                <CheckField
                  id={`act-${a.id}-done`}
                  label={`Action ${i + 1} is done`}
                  checked={a.done}
                  onChange={(c) => setValue((prev) => ({ ...prev, actions: updateAction(prev.actions, a.id, { done: c }) }))}
                />
                <Button
                  variant="secondary"
                  size="small"
                  aria-label={`Remove action ${i + 1}`}
                  onClick={() => setValue((prev) => ({ ...prev, actions: removeAction(prev.actions, a.id) }))}
                >
                  Remove action {i + 1}
                </Button>
              </div>
            ))}
            <p>
              <Button variant="secondary" disabled={full} onClick={() => setValue((prev) => ({ ...prev, actions: addAction(prev.actions, newAction(newId())) }))}>
                Add an action
              </Button>
              {full && <span className="muted"> The list holds at most {MAX_ACTIONS} actions.</span>}
            </p>
          </fieldset>
        </form>
      </div>

      <section className="briefing plan-view" aria-labelledby="devplan-title">
        <h2 id="devplan-title">Your development plan</h2>
        <p>
          Rated {s.rated} of {s.total}. Strong: {s.strong}. Competent: {s.competent}. Develop: {s.develop}.
        </p>
        <h3>Areas to develop</h3>
        {s.developItems.length === 0 ? (
          <p className="muted">None rated Develop.</p>
        ) : (
          <ul className="plain-list">
            {s.developItems.map((d) => (
              <li key={`${d.area}-${d.label}`}>
                {d.area}. {d.label}
              </li>
            ))}
          </ul>
        )}
        <h3>Notes and action points</h3>
        <dl className="plan-view__rows">
          {noteBoxes.map((b) => {
            const v = (value.notes[b.id] ?? '').trim();
            return (
              <div key={b.id} className={v === '' ? 'is-gap' : undefined}>
                <dt>{b.label}</dt>
                <dd>{v === '' ? 'Not filled in' : v}</dd>
              </div>
            );
          })}
        </dl>
        <h3>Action list</h3>
        {value.actions.length === 0 ? (
          <p className="muted">No actions listed.</p>
        ) : (
          <ul className="plain-list">
            {[...value.actions.filter((a) => !a.done), ...value.actions.filter((a) => a.done)].map((a) => (
              <li key={a.id}>
                {a.done ? 'Done: ' : 'Open: '}
                {a.text.trim() || 'Not filled in'}
                {a.area ? ` (${boxLabel(a.area)})` : ''}
                {a.when.trim() ? ` by when: ${a.when.trim()}` : ''}
              </li>
            ))}
          </ul>
        )}
        <p className="briefing__foot muted">A personal record made with the Sea Kayaking Hub. It does not assess you.</p>
      </section>

      <ExportBar title="Skills development plan" text={text} />
      <div className="no-print danger-zone">
        <ConfirmButton label="Clear this plan" question="Clear every rating, note and action?" confirmLabel="Yes, clear it" onConfirm={clear} />
      </div>
      <SourceList ids={['bcab-checklist', 'bcab']} />
    </div>
  );
}
