import { useEffect, useRef, useState } from 'react';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { CheckField, DateField, TextAreaField, TextField, TimeField } from '../../components/forms/fields';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { PlanView } from '../../components/trip/PlanView';
import { TripExportBar } from '../../components/trip/TripExportBar';
import { Button, ButtonLink, Notice, PageHeader } from '../../components/ui';
import { sourceShort } from '../../content/leadership/sources';
import { finalChecklistGroups, finalChecklistProgress } from '../../content/trip/checklist';
import { applicableGroups, dayGroups, MAX_DAYS, MAX_STOPS, tripGroups, tripTypeInfo, type FieldGroup, type TripField } from '../../content/trip/fields';
import { limitDefs, limitFindings, limitKey, limitSource } from '../../content/trip/limits';
import { buildPlan } from '../../content/trip/output';
import {
  addDay,
  addStop,
  dayFieldId,
  gapsForDay,
  removeDay,
  removeStop,
  setCheck,
  setDayValue,
  setLimitsOn,
  setTripValue,
  tripFieldId,
  tripGaps,
  tripTitle,
  updateStop,
  type Gap,
  type Trip,
  type TripStore,
} from '../../content/trip/trip';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';
import { Link, useNavigate } from '../../router/Router';

function FieldView({ field, id, value, onChange }: { field: TripField; id: string; value: string; onChange: (v: string) => void }) {
  const common = { id, label: field.label, hint: field.hint, needed: field.required, value, onChange };
  if (field.kind === 'longtext') return <TextAreaField {...common} />;
  if (field.kind === 'date') return <DateField {...common} />;
  return <TextField {...common} />;
}

function Groups({ groups, idFor, values, onChange }: { groups: FieldGroup[]; idFor: (field: string) => string; values: Record<string, string>; onChange: (field: string, v: string) => void }) {
  return (
    <>
      {groups.map((g) => (
        <fieldset key={g.id} className="group">
          <legend>{g.title}</legend>
          {g.intro && <p className="muted">{g.intro}</p>}
          {g.fields.map((f) => (
            <FieldView key={f.id} field={f} id={idFor(f.id)} value={values[f.id] ?? ''} onChange={(v) => onChange(f.id, v)} />
          ))}
        </fieldset>
      ))}
    </>
  );
}

export function TripEditorPage({ id }: { id: string }) {
  const navigate = useNavigate();
  const { value: store, setValue, state, ready, saveNow } = usePersisted<TripStore>('trips', {});
  const trip: Trip | undefined = store[id];
  const [dayIndex, setDayIndex] = useState(0);
  const pendingFocus = useRef<string | null>(null);

  useDocumentTitle(trip ? tripTitle(trip) : 'Trip plan');

  // After switching day from the "still to fill in" list, move focus to the field once it has been drawn.
  useEffect(() => {
    if (pendingFocus.current) {
      const el = document.getElementById(pendingFocus.current);
      pendingFocus.current = null;
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.focus();
      }
    }
  });

  if (!ready) {
    return (
      <div className="container page">
        <p className="muted" role="status">
          Looking for this plan on this device…
        </p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container page">
        <PageHeader title="Plan not found" icon="trip" crumb={{ label: 'Trip Planning', to: '/trip-planning' }} />
        <Notice tone="warning" title="This plan is not saved on this device">
          Plans are kept in the browser they were made in, so a plan made on another phone or computer will not be here. If you downloaded a trip file, bring
          it back on <Link to="/my-plans">My plans</Link>.
        </Notice>
        <p>
          <ButtonLink to="/trip-planning/day">Back to your plans</ButtonLink>
        </p>
      </div>
    );
  }

  const info = tripTypeInfo(trip.type);
  const multi = trip.type !== 'day';
  const day = Math.min(dayIndex, trip.days.length - 1);
  const update = (fn: (t: Trip) => Trip) => setValue((prev) => (prev[id] ? { ...prev, [id]: fn(prev[id]!) } : prev));
  const gaps = tripGaps(trip);
  const doc = buildPlan(trip);
  const checklist = finalChecklistProgress(trip.checks);
  const findings = limitFindings(trip.values);

  const goTo = (gap: Gap) => {
    const target = gap.dayIndex >= 0 ? gap.dayIndex : day;
    pendingFocus.current = gap.fieldId;
    if (target !== day) setDayIndex(target);
    else {
      const el = document.getElementById(gap.fieldId);
      pendingFocus.current = null;
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.focus();
      }
    }
  };

  const tripLevel = applicableGroups(tripGroups, trip.type);
  const people = tripLevel.filter((g) => g.id === 'people');
  const others = tripLevel.filter((g) => g.id !== 'people');
  const dayLevel = applicableGroups(dayGroups, trip.type);
  const d = trip.days[day]!;

  return (
    <div className="container page">
      <div className="no-print">
        <PageHeader title={info.title} intro="Fill in the plan below. It saves on this device as you type." icon="trip" crumb={{ label: 'Your plans', to: info.path }} />
        <Notice tone="warning" title="Built, but not approved by the club">
          The fields follow the approved specification. The app fills nothing in for you: it does not fetch weather, calculate tides or suggest a route.
        </Notice>
        <SaveStatus state={state} />

        <section className="missing-box" aria-labelledby="missing-title">
          <h2 id="missing-title">{gaps.length === 0 ? 'Nothing missing' : `Still to fill in (${gaps.length})`}</h2>
          {gaps.length === 0 ? (
            <p>Every required field is filled in. That does not mean the plan is complete or safe: check it yourself before you go.</p>
          ) : (
            <ul className="plain-list">
              {gaps.map((g) => (
                <li key={g.fieldId}>
                  <button type="button" className="link-button" onClick={() => goTo(g)}>
                    {g.scope}: {g.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <Groups groups={people} idFor={tripFieldId} values={trip.values} onChange={(f, v) => update((t) => setTripValue(t, f, v))} />

          {multi && (
            <nav className="day-tabs" aria-label="Days of the trip">
              {trip.days.map((_, i) => {
                const n = gapsForDay(trip, i);
                return (
                  <button
                    key={i}
                    type="button"
                    className="day-tab"
                    aria-current={i === day ? 'true' : undefined}
                    onClick={() => setDayIndex(i)}
                  >
                    Day {i + 1}
                    <span className="day-tab__gaps">{n === 0 ? ' (complete)' : ` (${n} to fill in)`}</span>
                  </button>
                );
              })}
              <Button variant="secondary" size="small" disabled={trip.days.length >= MAX_DAYS} onClick={() => { update(addDay); setDayIndex(trip.days.length); }}>
                Add a day
              </Button>
            </nav>
          )}

          <section aria-labelledby="day-heading">
            <h2 id="day-heading">{multi ? `Day ${day + 1}` : 'The day'}</h2>
            <Groups
              groups={dayLevel}
              idFor={(f) => dayFieldId(day, f)}
              values={d.values}
              onChange={(f, v) => update((t) => setDayValue(t, day, f, v))}
            />

            <fieldset className="group">
              <legend>Stops on the route{multi ? ` (day ${day + 1})` : ''}</legend>
              <p className="muted">Optional. Add each place you plan to stop, with the times you expect to arrive and leave.</p>
              {d.stops.length === 0 && <p className="muted">No stops added.</p>}
              {d.stops.map((s, i) => {
                const base = `day${day + 1}-stop${i + 1}`;
                return (
                  <div key={i} className="stop-row">
                    <p className="stop-row__title">Stop {i + 1}</p>
                    <TextField id={`${base}-place`} label={`Stop ${i + 1} place`} value={s.place} onChange={(v) => update((t) => updateStop(t, day, i, { place: v }))} />
                    <TextField id={`${base}-notes`} label={`Stop ${i + 1} notes`} value={s.notes} onChange={(v) => update((t) => updateStop(t, day, i, { notes: v }))} />
                    <div className="time-pair">
                      <TimeField id={`${base}-eta`} label={`Stop ${i + 1} expected arrival`} value={s.eta} onChange={(v) => update((t) => updateStop(t, day, i, { eta: v }))} />
                      <TimeField id={`${base}-etd`} label={`Stop ${i + 1} expected departure`} value={s.etd} onChange={(v) => update((t) => updateStop(t, day, i, { etd: v }))} />
                    </div>
                    <Button variant="secondary" size="small" onClick={() => update((t) => removeStop(t, day, i))} aria-label={`Remove stop ${i + 1}`}>
                      Remove stop {i + 1}
                    </Button>
                  </div>
                );
              })}
              <p>
                <Button variant="secondary" disabled={d.stops.length >= MAX_STOPS} onClick={() => update((t) => addStop(t, day))}>
                  Add a stop
                </Button>
              </p>
            </fieldset>

            {multi && trip.days.length > 2 && (
              <p>
                <ConfirmButton
                  label={`Remove day ${day + 1}`}
                  question={`Remove day ${day + 1} and everything typed under it?`}
                  confirmLabel="Yes, remove it"
                  onConfirm={() => {
                    update((t) => removeDay(t, day));
                    setDayIndex(Math.max(0, day - 1));
                  }}
                />
              </p>
            )}
          </section>

          <Groups groups={others} idFor={tripFieldId} values={trip.values} onChange={(f, v) => update((t) => setTripValue(t, f, v))} />

          <fieldset className="group">
            <legend>Check against the award limits (optional)</legend>
            <p className="muted">
              Information only, and off unless you switch it on. These are the limits for the Sea Kayak Leader award ({limitSource}), not ECSKC rules. The check
              never blocks anything and never says a trip is safe or unsafe.
            </p>
            <CheckField id="limits-on" label="Check this plan against the award limits" checked={trip.limitsOn} onChange={(c) => update((t) => setLimitsOn(t, c))} />
            {trip.limitsOn && (
              <>
                {limitDefs.map((def) =>
                  def.id === 'race' ? (
                    <CheckField
                      key={def.id}
                      id={tripFieldId('lim-race')}
                      label={def.label}
                      checked={trip.values[limitKey('race')] === 'yes'}
                      onChange={(c) => update((t) => setTripValue(t, limitKey('race'), c ? 'yes' : ''))}
                    />
                  ) : (
                    <TextField
                      key={def.id}
                      id={tripFieldId(`lim-${def.id}`)}
                      label={`${def.label} (${def.unit})`}
                      hint={def.hint}
                      needed
                      value={trip.values[limitKey(def.id)] ?? ''}
                      onChange={(v) => update((t) => setTripValue(t, limitKey(def.id), v))}
                    />
                  ),
                )}
                <ul className="plain-list limit-findings" aria-label="Limit check results">
                  {findings.map((f) => (
                    <li key={f.id} className={f.status === 'over' || f.status === 'flagged' ? 'is-over' : undefined}>
                      <strong>{f.label}:</strong> {f.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </fieldset>

          <fieldset className="group">
            <legend>
              Final planning checklist ({checklist.done} of {checklist.total} ticked)
            </legend>
            <p className="muted">These come from the Leader preparation checklist, and each shows its source. They are ticked for this plan only.</p>
            {finalChecklistGroups.map((g) => (
              <div key={g.id}>
                <h3 className="check-group-title">{g.title}</h3>
                <ul className="check-list">
                  {g.items.map((item) => (
                    <li key={item.id} className="check-item">
                      <CheckField id={`final-${item.id}`} label={item.text} checked={trip.checks[item.id] === true} onChange={(c) => update((t) => setCheck(t, item.id, c))} />
                      <p className="check__meta">
                        Source: {sourceShort(item.source)}
                        {item.where ? `, ${item.where}` : ''}.
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </fieldset>

          <p className="muted">
            Not tied to this plan yet: the <Link to="/leadership/equipment">Equipment and safety check</Link>, the <Link to="/leadership/risk">Risk assessment</Link>, the{' '}
            <Link to="/leadership/sheets">SHEETS briefing</Link> and the <Link to="/emergency">Emergency card</Link>. They keep their own entries, so type anything you need to
            carry across.
          </p>
        </form>
      </div>

      <PlanView doc={doc} />

      <TripExportBar trip={trip} />

      <div className="no-print danger-zone">
        <ConfirmButton
          label="Delete this plan"
          question="Delete this plan from this device?"
          confirmLabel="Yes, delete it"
          onConfirm={() => {
            setValue((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            saveNow();
            navigate(info.path);
          }}
        />
      </div>
    </div>
  );
}
