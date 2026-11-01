import { TextAreaField, TextField } from '../../components/forms/fields';
import { ConfirmButton } from '../../components/forms/ConfirmButton';
import { ExportBar } from '../../components/forms/ExportBar';
import { SaveStatus } from '../../components/forms/SaveStatus';
import { SourceList } from '../../components/forms/SourceList';
import { Notice, PageHeader } from '../../components/ui';
import { ratingAreas, ratings, reviewFields, reviewText, type Review } from '../../content/leadership/review';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePersisted } from '../../hooks/usePersisted';

const empty: Review = { values: {}, ratings: {} };

export function ReviewPage() {
  useDocumentTitle('Post-trip review');
  const { value, setValue, state, clear } = usePersisted<Review>('post-trip-review', empty);
  const text = reviewText(value);

  const setField = (id: string, v: string) => setValue((prev) => ({ ...prev, values: { ...prev.values, [id]: v } }));
  const setRating = (id: string, v: string) =>
    setValue((prev) => {
      const next = { ...prev.ratings };
      if (v === '') delete next[id];
      else next[id] = v;
      return { ...prev, ratings: next };
    });

  return (
    <div className="container page">
      <PageHeader
        title="Post-trip review"
        icon="leadership"
        intro="Look back on the trip: what went well, what to change, and where to develop as a leader."
        crumb={{ label: 'Leadership', to: '/leadership' }}
      />
      <div className="no-print">
        <Notice title="For your own records">
          Anything that needs reporting goes through the club’s own procedure. The ratings use the three words on the British Canoeing Sea Kayak Leader
          Skills Checklist: Strong, Competent or Develop. Rate only the areas this trip tested.
        </Notice>
        <SaveStatus state={state} />
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <fieldset className="group">
            <legend>The trip</legend>
            {reviewFields.map((f) =>
              f.long ? (
                <TextAreaField key={f.id} id={`review-${f.id}`} label={f.label} hint={f.hint} value={value.values[f.id] ?? ''} onChange={(v) => setField(f.id, v)} />
              ) : (
                <TextField key={f.id} id={`review-${f.id}`} label={f.label} hint={f.hint} value={value.values[f.id] ?? ''} onChange={(v) => setField(f.id, v)} />
              ),
            )}
          </fieldset>

          <h2>Rate yourself</h2>
          {ratingAreas.map((area) => {
            const rated = area.items.filter((i) => value.ratings[i.id]).length;
            return (
              <details key={area.id} className="group rating-area">
                <summary>
                  {area.title} <span className="muted">({rated} of {area.items.length} rated)</span>
                </summary>
                {area.items.map((item) => (
                  <div key={item.id} className="field field--inline">
                    <label className="field__label" htmlFor={`rate-${item.id}`}>
                      {item.label}
                    </label>
                    <select id={`rate-${item.id}`} className="input input--short" value={value.ratings[item.id] ?? ''} onChange={(e) => setRating(item.id, e.target.value)}>
                      <option value="">Not rated</option>
                      {ratings.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </details>
            );
          })}
        </form>
      </div>

      <div className="print-only">
        <pre className="print-text">{text}</pre>
      </div>

      <ExportBar title={value.values.tripName ? `Post-trip review ${value.values.tripName}` : 'Post-trip review'} text={text} />
      <div className="no-print danger-zone">
        <ConfirmButton label="Clear this review" question="Clear everything in this review?" confirmLabel="Yes, clear it" onConfirm={clear} />
      </div>
      <SourceList ids={['bcab-checklist', 'hqol']} />
    </div>
  );
}
